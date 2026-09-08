#!/usr/bin/env node
const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const tests=[];
function test(name,fn){try{fn();tests.push([name,true])}catch(e){tests.push([name,false,e.message])}}
function assert(x,msg){if(!x)throw new Error(msg)}

test('inline scripts compile',()=>{
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  assert(scripts.length>0,'no inline script');
  for(const s of scripts)new vm.Script(s);
});
test('critical DOM ids are unique',()=>{
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
  assert(!dup.length,'duplicate ids: '+dup.join(','));
});
test('RC6 critical surfaces exist',()=>{
  for(const id of ['today','program','progress','sessionOverlay','workoutPicker','plannerSheet','skipSheet','weekSnapshot','todayDecision'])assert(html.includes(`id="${id}"`),'missing '+id);
});
test('simple $ id references resolve',()=>{
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const refs=[...html.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
  const missing=[...new Set(refs.filter(x=>!ids.has(x)))];
  assert(!missing.length,'missing referenced ids: '+missing.join(','));
});
test('bottom navigation has exactly Today Program Progress',()=>{
  const pages=new Set([...html.matchAll(/<section class="page[^"]*" id="([^"]+)"/g)].map(m=>m[1]));
  const targets=[...html.matchAll(/data-page="([^"]+)"/g)].map(m=>m[1]);
  assert(JSON.stringify(targets)===JSON.stringify(['today','program','progress']),'unexpected nav: '+targets.join(','));
  assert(targets.every(x=>pages.has(x)),'invalid nav target');
});
test('Week tab and permanent MVP explainer are removed',()=>{
  assert(!html.includes('data-page="week"'),'week nav remains');
  assert(!html.includes('<h1>Semana</h1>'),'week page remains');
  assert(!html.includes('Una decisión a la vez.'),'MVP explainer remains');
});
test('Today uses decision stack and weekly snapshot',()=>{
  assert(html.includes('Mejor fit ahora'),'missing best-fit decision');
  assert(html.includes('Esta semana'),'missing weekly snapshot');
  assert(html.includes('Después de esta sesión'),'missing active-state next priority');
});
test('Program uses Decision Cards and includes standalone Arms flex session',()=>{
  assert(html.includes('Decision cards'),'program architecture missing');
  assert(html.includes('Brazos · standalone'),'arms session missing');
  assert(html.includes('Flex / catch-up'),'arms flex label missing');
  assert(html.includes('Cobertura directa'),'coverage metric missing');
});
test('Pre-workout planner exposes Full 45 30 and per-exercise toggles',()=>{
  assert(html.includes('id="plannerSheet"'),'planner missing');
  assert(html.includes("['30','30 min'],['45','45 min'],['full','Full']"),'presets missing');
  assert(html.includes('data-plan-toggle'),'planner exercise toggle missing');
  assert(html.includes('Los cambios aplican solo a hoy'),'session scoped note missing');
});
test('planned confirmed executed metrics are persisted',()=>{
  assert(html.includes('confirmedSets'),'confirmed sets missing');
  assert(html.includes('executionAdherencePct'),'execution adherence missing');
  assert(html.includes('excludedExerciseIndices'),'excluded exercise snapshot missing');
});
test('skip set and skip exercise force workout scroll to top',()=>{
  assert(html.includes("scrollSessionTop('skip:set')"),'skip set scroll missing');
  assert(html.includes("scrollSessionTop('skip:exercise')"),'skip exercise scroll missing');
  assert(html.includes("diagnostics('session:scroll-top'"),'scroll diagnostic missing');
});
test('tempo renderer remains centralized',()=>{
  assert(!html.includes('CPEP'),'legacy CPEP remains');
  assert((html.match(/tempoMarkup\(e,false\)/g)||[]).length>=3,'tempoMarkup not shared');
});
test('Node 24 compatible Pages action majors are selected',()=>{
  const wf=fs.readFileSync('.github/workflows/release-pages.yml','utf8');
  assert(wf.includes('actions/configure-pages@v6'),'configure-pages not v6');
  assert(wf.includes('actions/upload-pages-artifact@v5'),'upload-pages-artifact not v5');
  assert(wf.includes('actions/deploy-pages@v5'),'deploy-pages not v5');
});
for(const [n,ok,d] of tests)console.log(`${ok?'PASS':'FAIL'} | ${n}${d?' | '+d:''}`);
const p=tests.filter(x=>x[1]).length;console.log(`TOTAL ${p}/${tests.length} PASS`);process.exit(p===tests.length?0:1);
