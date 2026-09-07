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
test('critical surfaces exist',()=>{
  for(const id of ['today','week','program','progress','sessionOverlay','workoutPicker','skipSheet','todayContext'])assert(html.includes(`id="${id}"`),'missing '+id);
});
test('simple $ id references resolve',()=>{
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const refs=[...html.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
  const missing=[...new Set(refs.filter(x=>!ids.has(x)))];
  assert(!missing.length,'missing referenced ids: '+missing.join(','));
});
test('bottom navigation targets valid pages',()=>{
  const pages=new Set([...html.matchAll(/<section class="page[^"]*" id="([^"]+)"/g)].map(m=>m[1]));
  const targets=[...html.matchAll(/data-page="([^"]+)"/g)].map(m=>m[1]);
  assert(targets.every(x=>pages.has(x)),'invalid nav target');
});
test('tempo renderer is centralized',()=>{
  assert(!html.includes('CPEP'),'legacy CPEP remains');
  assert((html.match(/tempoMarkup\(e,false\)/g)||[]).length>=3,'tempoMarkup not shared');
});
for(const [n,ok,d] of tests)console.log(`${ok?'PASS':'FAIL'} | ${n}${d?' | '+d:''}`);
const p=tests.filter(x=>x[1]).length;console.log(`TOTAL ${p}/${tests.length} PASS`);process.exit(p===tests.length?0:1);
