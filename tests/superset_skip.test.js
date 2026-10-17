'use strict';
// Production engine, action/render functions and durability; synthetic DOM/storage only.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {production,Storage,Locks,fixture,copy,H,A,U,M}=require('./storage_g3_support.cjs');
const BASE='89e8cae016386a1c5f27a4f5d7e7bc2eecc6db18',baseline=process.argv.includes('--baseline');
const html=baseline?execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8'}):fs.readFileSync('index.html','utf8');
const part=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return html.slice(a,b)};
async function setup({indices=[3,4],counts=null,key='chest'}={}){
 const storage=new Storage({[H]:JSON.stringify(fixture.history),[U]:'"lb"',[M]:'true'}),p=production(html,storage,new Locks()),c=p.c,w=c.api.WORKOUTS[key],nodes=new Map(),writes=[],errors=[],pending=[];
 if(counts){w.exercises[indices[0]].sets=counts[0];w.exercises[indices[1]].sets=counts[1]}
 const node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',classList:{remove(){},add(){},toggle(){}},setAttribute(){}});return nodes.get(s)};
 Object.assign(c,{$:node,unit:'lb',diagnostics(){},scrollSessionTop(){},startTicker(){},tick(){},fmtWeight:x=>String(x),storedRirLabel:x=>String(x),escapeStoredText:x=>String(x),videoLinkMarkup:()=>'',finishSession(){},renderCooldown(){node('#sessionStage').innerHTML='cooldown'}});
 vm.runInContext(part('function makeSession(','function totalSets(')+part('function current(','function draftFor(')+part('function skippedLog(',"$('#closeSkipSheet').onclick")+part('function completeSet(','function startTicker('),c);
 const a=c.makeSession(key,vm.runInContext(`makePlanSnapshot('${key}','custom',${JSON.stringify(indices)})`,c));a.state='set';a.futureP0={keep:[1,'untouched']};const seq=vm.runInContext('buildSequence(__w,__indices)',Object.assign(c,{__w:w,__indices:indices}));
 storage.values.set(A,JSON.stringify(a));assert((await p.d.bindState(a,'lb')).ok);
 c.active=()=>a;
 c.saveActive=x=>{const snap=copy(x);writes.push(snap);const r=p.d.saveActive(snap);pending.push(r);return r};
 c.renderStage=()=>{const {seq}=c.current(a);if(a.state==='transition')return c.renderTransition(a,w,seq);if(a.state==='rest')return c.renderRest(a,w,seq);if(a.state==='cooldown')return c.renderCooldown(a,w)};
 async function flush(){const q=pending.splice(0);return Promise.all(q)}
 async function action(kind){const {item}=c.current(a);assert(item,'action without executable set');const index=a.index,e=w.exercises[item.ei],before=copy(a.logs);try{if(kind==='complete')c.completeSet(a,seq,item,e,{weightKg:20.125,reps:8,rir:2});else if(kind==='one')c.skipCurrentSet(a,seq,item,e);else c.skipRemainingExercise(a,seq,item,e)}catch(err){errors.push(err.message)}const results=await flush();return {kind,item,index,before,results}}
 async function next(){try{if(a.state==='transition')node('#goPartner').onclick();else if(a.state==='rest')node('#dockStart').onclick()}catch(e){errors.push(e.message)}await flush()}
 return {...p,c,a,w,seq,storage,writes,errors,node,action,next,flush};
}
function coherent(x){
 assert.deepEqual(x.errors,[]);assert(x.d.validActive(x.a),'RAM active invalid');
 for(const s of x.writes){assert(x.d.validActive(s),'invalid snapshot attempted');if(s.state!=='cooldown'){const dest=x.seq[s.index];assert(dest,'missing destination');assert(!s.logs[`${dest.ei}_${dest.si}`]?.skipped,'snapshot points at skipped destination')}}
 const disk=JSON.parse(x.storage.values.get(A));assert.deepEqual(disk,copy(x.a));assert.deepEqual(JSON.parse(x.storage.values.get(H)),fixture.history);assert.equal(x.storage.values.get(U),'"lb"');assert.deepEqual(disk.futureP0,{keep:[1,'untouched']});
}
async function runCase(config,mode){
 const x=await setup(config),first=config.indices?.[0]??3,second=config.indices?.[1]??4;let skipped=false,steps=0;
 while(x.a.state!=='cooldown'&&steps++<80){
  if(x.a.state==='transition'||x.a.state==='rest'){if(!x.seq[x.a.index])break;await x.next();continue}
  const {item}=x.c.current(x.a);if(!item)break;
  let kind='complete';if(!skipped&&mode.startsWith('first')&&item.ei===first||!skipped&&mode.startsWith('second')&&item.ei===second){kind=mode.endsWith('all')?'all':'one';skipped=true}
  if(mode==='both-all')kind='all';
  const t=await x.action(kind);if(x.errors.length)break;
  const dest=x.seq[x.a.index],samePair=dest?.superset&&dest.position==='second'&&t.item.position==='first'&&dest.si===t.item.si;
  if(!dest){assert.equal(x.a.state,'cooldown');assert.equal(x.a.endsAt,0)}
  else if(kind==='complete'){assert.equal(x.a.state,samePair?'transition':'rest');if(!samePair){assert.equal(x.a.restOriginal,Number(x.w.exercises[t.item.ei].rest)||0);assert(Math.abs(x.a.endsAt-Date.now()-x.a.restOriginal*1000)<1000)}}
  if(kind==='all')for(const s of x.seq.slice(t.index).filter(s=>s.ei===t.item.ei)){const l=x.a.logs[`${s.ei}_${s.si}`];if(t.before[`${s.ei}_${s.si}`]?.done)assert.deepEqual(l,t.before[`${s.ei}_${s.si}`]);else assert(l.skipped&&!l.done&&l.status==='skipped_exercise')}
  coherent(x);
 }
 coherent(x);assert.equal(x.a.state,'cooldown');assert.equal(x.a.index,x.seq.length);assert.equal(Object.keys(x.a.logs).length,x.seq.length);
 for(const l of Object.values(x.a.logs))if(l.done){assert.equal(l.weightKg,20.125);assert.equal(l.rir,2);assert.equal(l.reps,8)}
 return x;
}
(async()=>{
 const tests=[];async function test(name,fn){try{await fn();tests.push(true);console.log('PASS | P0_SKIP '+name)}catch(e){tests.push(false);console.log('FAIL | P0_SKIP '+name+' | '+e.message.replace(/\n/g,' | ').slice(0,700))}}
 for(const indices of [[3,4],[3,4,5]])for(const counts of [null,[2,4],[4,2]])for(const mode of ['none','first-one','second-one','first-all','second-all','both-all'])await test(JSON.stringify({indices,counts,mode}),()=>runCase({indices,counts},mode));
 for(const mode of ['none','first-all','second-all'])await test('natural terminal shoulders superset '+mode,()=>runCase({key:'shoulders',indices:[5,6]},mode));
 for(const indices of [[3],[4],[5]])await test('custom standalone/last exercise '+indices,()=>runCase({indices},'both-all'));
 for(const fault of ['before-write','readback'])await test('interrupted affected transition '+fault+' retries/reloads without loss',async()=>{
  const x=await setup();await x.action('complete');await x.next();await x.action('all');await x.next();const before=x.storage.values.get(A);let written=false;
  x.storage.inject=(op,k)=>{if(k!==A)return;if(op==='set'){if(fault==='before-write')throw Error('synthetic quota');written=true}if(op==='get'&&fault==='readback'&&written)throw Error('synthetic readback interruption')};
  const r=await x.action('complete');assert(r.results.some(y=>!y.ok));assert.deepEqual(x.errors,[]);assert(x.d.validActive(x.a));if(fault==='before-write')assert.equal(x.storage.values.get(A),before);
  const raw=JSON.parse(x.d.exportRaw(x.a).text);assert.deepEqual(raw.memoryActive,copy(x.a));x.storage.inject=()=>{};assert((await x.d.saveActive(x.a)).ok);coherent(x);const fresh=production(html,x.storage,new Locks());assert((await fresh.d.recover()).ok);assert(fresh.d.validActive(JSON.parse(x.storage.values.get(A))));
 });
 await test('legacy terminal skipped destination is repaired only in UI; validator stays strict',async()=>{
  const x=await setup();for(const s of x.seq)x.a.logs[`${s.ei}_${s.si}`]={exerciseIndex:s.ei,exerciseName:x.w.exercises[s.ei].name,setIndex:s.si,weightKg:s.ei===3?20.125:0,reps:s.ei===3?8:0,rir:s.ei===3?2:null,done:s.ei===3,skipped:s.ei===4};x.a.index=x.seq.length-1;x.a.state='transition';x.a.last={...x.a.logs['3_3'],restSec:60};assert(x.d.validActive(x.a));assert(!x.d.validActive({...copy(x.a),index:x.seq.length}));x.c.renderStage();await x.flush();assert.equal(x.a.state,'cooldown');coherent(x);
 });
 await test('legacy nonterminal skipped partner resumes with rest at the actual destination',async()=>{
  const x=await setup();for(const s of x.seq.filter(s=>s.ei===4||s.si<2))x.a.logs[`${s.ei}_${s.si}`]={exerciseIndex:s.ei,exerciseName:x.w.exercises[s.ei].name,setIndex:s.si,weightKg:s.ei===3?20.125:0,reps:s.ei===3?8:0,rir:s.ei===3?2:null,done:s.ei===3,skipped:s.ei===4};x.a.index=3;x.a.state='transition';x.a.last={...x.a.logs['3_1'],restSec:60};assert(x.d.validActive(x.a));x.c.renderStage();await x.flush();assert.equal(x.a.index,4);assert.equal(x.a.state,'rest');assert.equal(x.a.restOriginal,60);assert(Math.abs(x.a.endsAt-Date.now()-60000)<1000);coherent(x);
 });
 await test('skipped gaps cannot switch into a different superset with the same round number',async()=>{
  const x=await setup({key:'back',indices:[3,4,5,6]}),target=x.seq.find(s=>s.ei===6&&s.si===0),logs={};for(const s of x.seq.slice(1))if(s.ei!==6)logs[`${s.ei}_${s.si}`]={skipped:true};const result=x.c.nextTransition(x.seq,0,x.w,logs);assert.equal(result.type,'rest');assert.equal(result.next,target);assert.equal(result.restSec,x.w.exercises[3].rest);
 });
 if(!baseline)await test('approved hotfix scope leaves validators/prescriptions/workflows byte-preserved',()=>require('./superset_skip_scope.cjs').assertScope(html));
 console.log(`P0_SKIP_TOTAL ${tests.filter(Boolean).length}/${tests.length} PASS | SOURCE ${baseline?BASE:'CURRENT'}`);if(tests.some(x=>!x))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
