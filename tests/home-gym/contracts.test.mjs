import { createConditionStore, CONDITION_KEY, timeline, position, conditionRange, clockChanged } from '../../apps/home-gym/condition.mjs';
import { createRestStore, REST_KEY, restDuration, remainingMs, restState, restTime } from '../../apps/home-gym/rest.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PROGRAM } from '../../apps/home-gym/program.mjs';
import { KG_PER_LB, parseLoad, editLoad, switchLoad, knownLoad, bumpValue, adjustment, progress, meaningfulWeek, lastConfirmed } from '../../apps/home-gym/experience.mjs';
import { COACHING, RESOURCES, coverage, movements, movementIdentity } from '../../apps/home-gym/coaching.mjs';
import { createStore, KEY, prescription, emergency, schedule, setKeys } from '../../apps/home-gym/engine.mjs';
const require=createRequire(import.meta.url), {worker,scope}=require('./worker-support.cjs');
const root='apps/home-gym/', base='5b69389c5a8d0a1257a33c157b4da5488899080c';
const read=n=>fs.readFileSync(n), sha=v=>createHash('sha256').update(v).digest('hex');
const tests=[];
async function test(name,fn){try{await fn();tests.push(true);console.log('PASS | HOME_GYM '+name)}catch(e){tests.push(false);console.error('FAIL | HOME_GYM '+name+' | '+e.stack)}}
await test('1 exact V1.1 checksum and golden source program, every week and strength instruction',()=>{
 const bytes=read('tests/home-gym/source-golden.json');
 assert.equal(sha(bytes),'6577ead533c2f98fe10cfbb630ceda3c1bbb65d05206b7b0fed1207334ee5d88');
 const golden=JSON.parse(bytes);
 assert.equal(PROGRAM.sourceSHA256,'938c51d609eaef258919a71ce7dbeb8c898c97568f64c5073e13ea993ed0d4a2');
 assert.equal(PROGRAM.sourceSHA256,golden.sourceSHA256);
 assert.deepEqual(PROGRAM.plan,golden.plan);assert.deepEqual(PROGRAM.exercise,golden.exercise);assert.deepEqual(PROGRAM.guidance,golden.guidance);
 for(let w=1;w<=12;w++){
  const p=golden.plan[w-1];
  assert.deepEqual(Object.keys(schedule(w)),w%2?['A','C','B']:['B','C','A']);
  for(const s of ['A','B']){
   const actual=prescription(w,s);
   for(const [i,e] of golden.exercise[s].entries()) assert.deepEqual(actual.exercises[i],{...e,sets:i===4?p.coreSets:i<2?p.mainSets:p.auxSets,rir:e.rir==='Técnica'?'técnica':p.rir});
  }
  assert.equal(prescription(w,'C').protocol,w===6?'15–20 min de caminata muy suave, ritmo conversacional. Sin intervalos.':`Camina o pedalea si se dispone de equipo adecuado: 5 min suave → ${p.intervals} ciclos de ${p.hard} s a ${p.effort} + ${p.easy} s suave → 3–5 min muy suave. Sin sprints; intensidad controlada.`);
 }
 assert(emergency(1,'A').protocol.includes(golden.guidance.emergency));assert.throws(()=>emergency(1,'C'));
 assert.throws(()=>prescription(13,'A'));assert.throws(()=>prescription(0,'B'));
});
await test('2 FV eight public assets, runtime, build and Pages workflow remain byte-identical',()=>{
 const assets=['index.html','sw.js','version.json','manifest.webmanifest','training-os-loop-v1-180.png','training-os-loop-v1-192.png','training-os-loop-v1-512.png','training-os-loop-v1-1024.png'];
 for(const n of [...assets,'scripts/sw-runtime.js','scripts/build_offline.py','.github/workflows/release-pages.yml']){
  assert.deepEqual(read(n),execFileSync('git',['show',base+':'+n]));
  if(assets.includes(n))console.log('FV_UNCHANGED '+n+' '+sha(read(n)));
 }
});
await test('3 no private source payload, external asset requests, FV keys or data migration',()=>{
 const manifest=JSON.parse(read(root+'artifact.json'));
 const text=Object.keys(manifest.files).map(n=>read(root+n).toString()).join('\n');
 assert(!/data:image|base64,|103\s*kg|1\.76|defaultAnswers|thm_form_|fv4\.|tos_v3/.test(text.replace('http://www.w3.org/2000/svg','')));
 assert(!/https?:\/\//.test(Object.keys(manifest.files).filter(n=>n!=='coaching.mjs').map(n=>read(root+n).toString()).join('\n').replace('http://www.w3.org/2000/svg','')));
 assert.equal(PROGRAM.privacyClass,'public-template');
 assert(text.includes("location.hostname==='fevaldez.github.io'"));
 assert(text.indexOf("location.hostname==='fevaldez.github.io'")<text.indexOf('store=createStore(localStorage'));
 assert(!/localStorage\.(clear|key)|localStorage\[|indexedDB/.test(text));
});
class Storage {
 constructor(seed={}){this.map=new Map(Object.entries(seed));this.events=[];this.fault=null}
 getItem(k){this.events.push(['get',k]);const r=this.fault?.('get',k);return r===undefined?this.map.get(k)??null:r}
 setItem(k,v){this.events.push(['set',k]);this.fault?.('set',k,v);this.map.set(k,v)}
}
class Locks {
 tail=Promise.resolve();
 request(name,options,fn){assert.equal(name,'home-gym.v1.write');const run=this.tail.then(()=>{if(options.signal.aborted)throw Error('aborted');return fn()});this.tail=run.catch(()=>{});return run}
}
const harness=(s=new Storage(),locks=new Locks())=>({storage:s,store:createStore(s,locks)});
const log={status:'done',weight:'20 lb',reps:'8',note:'synthetic'};
async function finishedReady(h){let snap=h.store.read();snap=await h.store.start(snap.raw,1,'A');for(const key of setKeys(snap.data.active.plan))snap=await h.store.log(snap.raw,snap.data.active.id,key,log);return snap}
await test('3/4 separate keys, unknown fields and lossless export/restore',async()=>{
 const h=harness(new Storage({'fv4.history':'synthetic sentinel','unrelated':'keep'}));
 let s=h.store.read();s=await h.store.move(s.raw,1,'A',4);assert.deepEqual(s.data.calendar[1],{A:4,C:2,B:0});
 s=await h.store.feedback(s.raw,'<script>synthetic</script>');
 const data=s.data;data.future={nested:['keep']};h.storage.map.set(KEY,JSON.stringify(data));s=h.store.read();
 s=await h.store.start(s.raw,2,'B');s=await h.store.log(s.raw,s.data.active.id,setKeys(s.data.active.plan)[0],log);
 const raw=h.store.exportRaw();const target=harness();const restored=await target.store.restore(null,raw);
 assert.deepEqual({...restored.data,rev:s.data.rev},s.data);assert.equal(h.storage.map.get('fv4.history'),'synthetic sentinel');
 assert.deepEqual(h.storage.events.filter(e=>e[1]!==KEY),[]);
 await assert.rejects(()=>target.store.restore(restored.raw,raw),/empty-store/);
 assert.throws(()=>target.store.restore(restored.raw,{schema:1,programId:'fv',raw:'{}'}),/wrong-backup/);
});
await test('4 quota failure never reports success or loses active/history; retry appends exactly once',async()=>{
 const h=harness();const s=await finishedReady(h),id=s.data.active.id,before=h.storage.map.get(KEY);
 h.storage.fault=(op)=>{if(op==='set')throw Error('quota')};
 await assert.rejects(()=>h.store.finish(s.raw,id),/quota/);assert.equal(h.storage.map.get(KEY),before);
 h.storage.fault=null;const done=await h.store.finish(s.raw,id);assert.equal(done.data.history.length,1);assert.equal(done.data.active,null);
 assert.equal((await h.store.finish(s.raw,id)).data.history.length,1);
 assert.deepEqual(done.data.history[0].plan,s.data.active.plan);
});
await test('4 failed acknowledgement is recoverable without duplicate completion',async()=>{
 const h=harness(),s=await finishedReady(h);let wrote=false;
 h.storage.fault=(op)=>{if(op==='set')wrote=true;if(op==='get'&&wrote)throw Error('read denied')};
 await assert.rejects(()=>h.store.finish(s.raw,s.data.active.id),/read denied/);
 h.storage.fault=null;const retried=await h.store.finish(s.raw,s.data.active.id);assert.equal(retried.data.history.length,1);assert.equal(retried.data.active,null);
});
await test('4 drafts survive reopen, remain unresolved and export/restore without losing typed values',async()=>{
 const h=harness();let s=await finishedReady(h),id=s.data.active.id;
 s=await h.store.draft(s.raw,id,'asq:1',{weight:'25 lb',reps:'9',note:'unconfirmed synthetic draft'});
 await assert.rejects(()=>h.store.finish(s.raw,id),/resolve-every-set/);
 const reopened=h.store.read();assert.equal(reopened.data.active.drafts['asq:1'].weight,'25 lb');
 const other=harness();const restored=await other.store.restore(null,h.store.exportRaw());assert.deepEqual(restored.data.active.drafts,reopened.data.active.drafts);
 s=await h.store.log(s.raw,id,'asq:1',{...log,weight:'25 lb',reps:'9'});s=await h.store.finish(s.raw,id);assert.equal(s.data.history.length,1);assert.deepEqual(s.data.history[0].drafts,{});
});
await test('4 malformed/unreadable storage and unsupported locks fail closed',async()=>{
 for(const raw of ['{','{}','null','{"schema":99}']){const h=harness(new Storage({[KEY]:raw}));assert.throws(()=>h.store.read());assert(!h.storage.events.some(e=>e[0]==='set'))}
 const h=harness();h.storage.fault=()=>{throw Error('denied')};assert.throws(()=>h.store.read());
 const unsupported=harness(new Storage(),null);await assert.rejects(()=>unsupported.store.start(null,1,'A'),/lock-unavailable/);assert.equal(unsupported.storage.map.size,0);
});
await test('4 cooperating tabs reject stale writers, preserve immutable logs and require every set',async()=>{
 const storage=new Storage(),locks=new Locks(),a=createStore(storage,locks),b=createStore(storage,locks);
 const r=await Promise.allSettled([a.start(null,1,'A'),b.start(null,1,'B')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);
 let s=a.read();await assert.rejects(()=>a.finish(s.raw,s.data.active.id),/resolve-every-set/);
 for(const key of setKeys(s.data.active.plan))s=await a.log(s.raw,s.data.active.id,key,{...log,status:'skipped'});
 s=await a.finish(s.raw,s.data.active.id);const old=JSON.stringify(s.data.history[0]);
 s=await b.start(s.raw,2,'B');assert.equal(JSON.stringify(s.data.history[0]),old);
 await assert.rejects(()=>a.log(null,s.data.active.id,setKeys(s.data.active.plan)[0],log),/stale-tab/);
});
await test('4 emergency replaces one strength session and cannot become a fourth workout',async()=>{
 const h=harness();let s=await h.store.start(null,1,'B',true);assert(s.data.active.plan.emergency);
 s=await h.store.log(s.raw,s.data.active.id,'emergency:1',log);s=await h.store.finish(s.raw,s.data.active.id);
 await assert.rejects(()=>h.store.start(s.raw,1,'B'),/already-completed/);assert.equal(s.data.history.length,1);
});
await test('4 complete offline install, scoped pins and safe lifecycle',async()=>{
 const w=worker();await w.event('install');await w.event('activate');const {BUILD,CACHE}=w.meta();assert.equal(w.store.get(CACHE).size,14);
 assert(!w.calls.some(x=>['skipWaiting','claim'].includes(x[0])));
 const r=await w.event('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});assert.equal(await r.text(),read(root+'index.html').toString());
 for(const [url,method,mode]of [[scope+'other/','GET','navigate'],['https://else.invalid/','GET','cors'],[scope,'POST','navigate']])assert.equal(await w.event('fetch',{request:{url,method,mode}}),undefined);
 for(const registrationScope of ['https://synthetic.invalid/foreign/','https://foreign.invalid/']){const bad=worker({registrationScope});await assert.rejects(()=>bad.event('install'));assert.equal(bad.store.size,0)}
 let replies=[];await w.event('message',{data:{type:'HOME_GYM_OFFLINE_STATUS'},source:{url:scope},ports:[{postMessage:x=>replies.push(x)}]});assert.equal(replies.at(-1).ready,true);
 const before=replies.length;await w.event('message',{data:{type:'HOME_GYM_OFFLINE_STATUS'},source:{url:scope+'foreign/'},ports:[{postMessage:x=>replies.push(x)}]});assert.equal(replies.length,before);
 assert.equal(BUILD.assets.length,14);
});
for(const fault of ['network','http','hash','portal','size','quota','cache-open','cache-read','redirect']) await test('4 failed offline installation: '+fault+' retains previous and unrelated caches',async()=>{
 const store=new Map([['home-gym-shell-v1-previous',new Map()],['tos-shell-v1-sentinel',new Map()],['unrelated',new Map()]]);
 const w=worker({store,fault});await assert.rejects(()=>w.event('install'));assert.deepEqual([...store.keys()],['home-gym-shell-v1-previous','tos-shell-v1-sentinel','unrelated']);
});
await test('4 corrupted cache fails closed offline and repairs only its own version online',async()=>{
 const w=worker();await w.event('install');const {CACHE}=w.meta();w.store.get(CACHE).set(scope+'index.html',new Response('corrupt',{headers:{'Content-Type':'text/html'}}));
 const broken=worker({store:w.store,fault:'network'});const r=await broken.event('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});assert.equal(r.status,503);
 const repaired=worker({store:w.store});const good=await repaired.event('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});assert.equal(good.status,200);
});
await test('6 deterministic allowlist, independent artifact and mandatory read-only PR CI',()=>{
 execFileSync('python3',[root+'build.py','--check']);
 const artifact=JSON.parse(read(root+'artifact.json'));
 assert.equal(Object.keys(artifact.files).length,15);
 for(const[n,pin]of Object.entries(artifact.files)){assert.equal(read(root+n).length,pin.size);assert.equal(sha(read(root+n)),pin.sha256)}
 const code=`import importlib.util; s=importlib.util.spec_from_file_location('b','${root}build.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); import sys; sys.stdout.buffer.write(m.archive(m.build()))`;
 const first=execFileSync('python3',['-B','-c',code]);assert.deepEqual(first,execFileSync('python3',['-B','-c',code]));
 console.log('HOME_GYM_TAR_SHA256 '+sha(first));
 const ci=read('.github/workflows/validate-pr.yml').toString();
 assert(ci.includes('pull_request:'));assert(!ci.includes('pull_request_target:'));assert(ci.includes('contents: read'));
 for(const command of ['python3 apps/home-gym/build.py --check','node tests/home-gym/contracts.test.mjs','node tests/home-gym/browser.test.cjs'])assert(ci.includes(command));
 assert(!/pages: write|id-token: write|secrets\.|vercel|deploy-pages|continue-on-error/.test(ci));
 assert(ci.includes('ref: ${{ github.event.pull_request.head.sha }}'));
 const pages=read('.github/workflows/release-pages.yml').toString().split('      - name: Build deploy artifact\n')[1].split('      - name:')[0];assert(!pages.includes('home-gym'));
 assert(!fs.existsSync('vercel.json'));assert(!fs.existsSync('.vercel'));
});

await test('V3 A coaching maps stable IDs, conditioning, Plan B and materially different alternatives',()=>{
 for(const e of [...PROGRAM.exercise.A,...PROGRAM.exercise.B]){
  const c=COACHING[e.id];assert(c);assert(c.tip.split(/\s+/).length>=12);assert(c.tip.split(/\s+/).length<=26);assert(c.technique);assert(RESOURCES[c.resource]);assert(c.alternatives.length);
  for(const a of c.alternatives){assert(a.tip);assert(RESOURCES[a.resource])}
 }
 assert(COACHING.condition.tip);assert(COACHING.emergency.tip);assert.equal(RESOURCES.hold.status,'RELATED');assert(RESOURCES.hold.scope.includes('quieto'));assert(COACHING.bhinge.resourceNote.includes('no demuestra'));
});
await test('V3 B numeric kg/lb canonical anchors round-trip 1000 times without cumulative drift',()=>{
 for(const text of ['20','27,5 kg','0.125 lb','42.333333','0']){
  const original=editLoad({future:{keep:true}},text,'kg','per-dumbbell');assert(knownLoad(original));let record=original;
  for(let i=0;i<1000;i++){record=switchLoad(record,'lb');record=switchLoad(record,'kg');}
  assert.equal(record.weightKg,original.weightKg);assert.equal(record.enteredWeight,original.enteredWeight);assert.equal(record.enteredUnit,original.enteredUnit);assert.deepEqual(record.future,{keep:true});assert.equal(record.loadBasis,'per-dumbbell');
 }
 assert.equal(parseLoad('20 lb').weightKg,20*KG_PER_LB);assert.equal(parseLoad('27,5 kg').weightKg,27.5);assert.equal(adjustment('kg'),5);assert.equal(adjustment('lb'),5);
});
await test('V3 B/C legacy, unknown, duration and historical zero remain literal; invalid values never acquire fake units',()=>{
 for(const weight of ['20 lb','27,5 kg','0','0 kg','sin carga','6/lado','20 s/lado','2 × 10','veinte','10 stones']){
  const legacy={weight,reps:'6/lado',note:'keep',future:{keep:true}};assert.equal(switchLoad(legacy,'lb'),null);assert.equal(legacy.weight,weight);
 }
 for(const text of ['veinte','10 stones','20 s','2 × 10','Infinity','-5','1e3']){assert.equal(parseLoad(text),null);assert.equal(knownLoad(editLoad({},text,'kg','unknown')),false)}
 assert.equal(switchLoad({...editLoad({},'10','kg','single-implement'),weight:'10 stones'},'lb'),null);
 const zero=editLoad({loadIntent:'zero'},'0','kg','external-total');assert.equal(switchLoad(zero,'lb').weightKg,0);
 const unloaded=editLoad({...zero,loadIntent:'unloaded-alternative'},'','kg','single-implement');assert.equal(knownLoad(unloaded),false);assert.equal(switchLoad(unloaded,'lb'),null);
 for(const text of ['6/lado','20 s/lado','15 min'])assert.equal(bumpValue(text,'reps',1,'kg'),null);
 assert.equal(bumpValue('8','reps',1,'kg'),'9');assert.equal(bumpValue('20 lb','weight',1,'kg'),'21 lb');assert.equal(bumpValue('20','weight',0.5,'kg'),'20.5');assert.equal(bumpValue('unknown','weight',1,'kg'),null);
});
await test('V3 D resource review is finite, safe HTTPS and classified without live CI network',()=>{
 const counts=coverage();console.log('HOME_GYM_VIDEO_COVERAGE '+JSON.stringify(counts));
 assert.equal(counts.EXACT,6);assert.equal(counts.RELATED,5);assert.equal(counts.UNVERIFIED,4);
 for(const r of Object.values(RESOURCES)){
  assert(['EXACT','RELATED','UNVERIFIED'].includes(r.status));assert(r.title&&r.scope);
  if(r.status==='UNVERIFIED')assert.equal(r.url,undefined);
  else{const u=new URL(r.url);assert.equal(u.protocol,'https:');assert(['www.muscleandstrength.com','www.nhs.uk'].includes(u.hostname));assert(!u.search);assert(!/search|youtube\.com\/results/.test(r.url))}
 }
 const app=read(root+'app.mjs').toString();assert(app.includes('rel="noopener noreferrer external"'));assert(app.includes('!navigator.onLine'));assert(!/<iframe|<video|autoplay/.test(app));
});
function historyEntry(week,session,status='done',planB=false){
 const plan=planB?emergency(week,session):prescription(week,session);
 return {id:crypto.randomUUID(),week,session,programId:PROGRAM.programId,programVersion:PROGRAM.programVersion,plan,logs:Object.fromEntries(setKeys(plan).map(k=>[k,{...log,status}])),startedAt:'2026-01-01',endedAt:'2026-01-01'};
}
await test('V3 E progress distinguishes empty, partial, full, skip-only, active, duplicate and emergency replacements',()=>{
 let d={history:[],active:null,calendar:{}};let p=progress(d,1);assert.equal(p.recorded,0);assert.equal(p.performed,0);assert.deepEqual(p.next,{week:1,session:'A'});assert.equal(p.completeWeeks,0);
 d.history.push(historyEntry(1,'A'));p=progress(d,1);assert.equal(p.recorded,1);assert.equal(p.weekPerformed,1);assert.equal(p.weekSaved,1);assert.equal(p.completeWeeks,0);assert.deepEqual(p.next,{week:1,session:'C'});
 d.history.push(historyEntry(1,'C','skipped'));p=progress(d,1);assert.equal(p.recorded,2);assert.equal(p.performed,1);assert.equal(p.whollySkipped,1);assert.equal(p.weekPerformed,1);
 d.history.push(historyEntry(1,'B','done',true));p=progress(d,1);assert.equal(p.recorded,3);assert.equal(p.weekSaved,3);assert.equal(p.weekPerformed,2);assert.equal(p.completeWeeks,0);assert.deepEqual(p.next,{week:2,session:'B'});
 d.history.push(historyEntry(1,'A','skipped'));p=progress(d,1);assert.equal(p.recorded,3);assert.equal(p.performed,2);assert.equal(p.sessions.find(x=>x.session==='A').copies,2);assert.equal(p.sessions.find(x=>x.session==='A').actuallyPerformed,true);
 d.history.push(historyEntry(1,'C'));p=progress(d,1);assert.equal(p.completeWeeks,1);assert.equal(p.weekPerformed,3);assert.equal(p.recorded,3);
 d.active={week:1,session:'A'};assert(progress(d,1).active);assert.equal(progress(d,1).recorded,3);
 d.active={week:2,session:'B'};p=progress(d,2);assert(p.active);assert.equal(p.recorded,3);assert.equal(p.weekPerformed,0);
 const skipped={history:['A','B','C'].map(s=>historyEntry(1,s,'skipped')),active:null};p=progress(skipped,1);assert.equal(p.recorded,3);assert.equal(p.performed,0);assert.equal(p.whollySkipped,3);assert.equal(p.completeWeeks,0);
 const full={history:Array.from({length:12},(_,i)=>['A','B','C'].map(s=>historyEntry(i+1,s))).flat()};p=progress(full,12);assert.equal(p.recorded,36);assert.equal(p.performed,36);assert.equal(p.completeWeeks,12);assert.equal(p.next,null);
});
await test('V3 F context honors active, manual preference, first unresolved week and completed block without dates',async()=>{
 const d={history:['A','B','C'].map(s=>historyEntry(1,s)),active:null};assert.equal(meaningfulWeek(d),2);
 d.preferences={selectedWeek:7,displayUnit:'lb',future:{keep:true}};assert.equal(meaningfulWeek(d),7);d.active={week:4,session:'B'};assert.equal(meaningfulWeek(d),4);d.active=null;d.preferences.selectedWeek=99;assert.equal(meaningfulWeek(d),2);
 const h=harness();let s=await h.store.preference(null,{selectedWeek:7,displayUnit:'lb'});const beforeHistory=JSON.stringify(s.data.history);s=await h.store.start(s.raw,7,'A');s=await h.store.draft(s.raw,s.data.active.id,'asq:1',{...log,...editLoad({},'25','lb','single-implement')});
 const restored=harness();const imported=await restored.store.restore(null,h.store.exportRaw());assert.equal(meaningfulWeek(imported.data),7);assert.equal(imported.data.preferences.displayUnit,'lb');assert.equal(JSON.stringify(s.data.history),beforeHistory);
 const old=h.store.read();s=await h.store.preference(s.raw,{selectedWeek:8});await assert.rejects(()=>h.store.preference(old.raw,{displayUnit:'kg'}),/stale-tab/);
 await assert.rejects(()=>h.store.preference(s.raw,{selectedWeek:13}),/invalid-preference/);
});
await test('V4 confirmed recall is read-only, chronological and excludes skips, drafts and incompatible movement/basis',()=>{
 const e=prescription(2,'A').exercises[0],plan=prescription(1,'A');
 const record=(weight,reps='8',extra={})=>({...editLoad({},weight,'kg','single-implement'),reps,note:'synthetic',status:'done',variantId:'primary',movement:movementIdentity(e),...extra});
 const entry={id:'closed',programId:PROGRAM.programId,endedAt:'2026-01-01',week:1,plan,logs:Object.fromEntries(setKeys(plan).map(k=>[k,{weight:'',reps:'',note:'',status:'skipped'}]))};
 entry.logs['asq:1']=record('10');entry.logs['asq:2']=record('12','6/lado');
 const active={id:'active',programId:PROGRAM.programId,week:2,plan:prescription(2,'A'),logs:{},drafts:{}},data={history:[entry]};
 const before=JSON.stringify(data);assert.equal(lastConfirmed(data,active,e,'asq:1').fields.weight,'12');assert.equal(lastConfirmed(data,active,e,'asq:1').fields.reps,'6/lado');
 active.logs['asq:1']=record('14','9',{confirmedAt:'2026-02-01T01:00:00Z',rir:'4'});active.logs['asq:2']=record('16','7',{confirmedAt:'2026-02-01T00:00:00Z'});
 let result=lastConfirmed(data,active,e,'asq:3');assert.equal(result.source,'active');assert.equal(result.fields.weight,'14');assert.equal(result.fields.rir,undefined);
 active.drafts['asq:1']={weight:'20'};assert.equal(lastConfirmed(data,active,e,'asq:3').fields.weight,'16');
 active.logs['asq:2'].status='skipped';assert.equal(lastConfirmed(data,active,e,'asq:3').source,'history');
 assert.equal(lastConfirmed(data,active,e,'asq:3','sitstand-unloaded'),null);
 entry.logs['asq:2'].loadBasis='per-dumbbell';assert.equal(lastConfirmed(data,active,e,'asq:3').fields.weight,'10');
 entry.logs['asq:1'].movement.gear='unproven equipment';assert.equal(lastConfirmed(data,active,e,'asq:3'),null);
 // Stable identity is mandatory: the same movement name under B is never treated as A.
 assert.equal(lastConfirmed({history:[entry]},active,prescription(2,'B').exercises[3],'bsq:1'),null);
 entry.logs['asq:1']=record('10');entry.logs['asq:2']=record('12','6/lado');assert.equal(JSON.stringify(data),before);
});
await test('V4 compatible alternative recall keeps zero, unloaded intent, canonical units and exact legacy text',()=>{
 const e=prescription(2,'A').exercises[0],active={id:'active',programId:PROGRAM.programId,week:2,plan:prescription(2,'A'),logs:{},drafts:{}};
 const zero={...editLoad({},'0','kg','single-implement'),reps:'8',note:'',status:'done',loadIntent:'zero'};active.logs['asq:1']=zero;
 assert.equal(lastConfirmed({history:[]},active,e,'asq:2').fields.loadIntent,'zero');
 active.logs['asq:1']={...zero,weight:'',weightKg:undefined,loadIntent:'unloaded-alternative',loadBasis:'external-total',variantId:'sitstand-unloaded',movement:movementIdentity(e,'sitstand-unloaded')};
 assert.equal(lastConfirmed({history:[]},active,e,'asq:2'),null);assert.equal(lastConfirmed({history:[]},active,e,'asq:2','sitstand-unloaded').fields.loadIntent,'unloaded-alternative');
 const text={weight:'20 piedras',reps:'6–8/lado',note:'private source note',status:'done',future:{keep:true}};active.logs['asq:1']=text;
 const before=JSON.stringify(active),copy=lastConfirmed({history:[]},active,e,'asq:2','primary','lb');assert.equal(copy.fields.weight,text.weight);assert.equal(copy.fields.reps,text.reps);assert.equal(copy.fields.loadBasis,'unknown');assert.equal(copy.fields.note,undefined);assert.equal(copy.fields.future,undefined);assert.equal(JSON.stringify(active),before);
 const numeric={...zero,...editLoad({},'10','kg','single-implement')};active.logs['asq:1']=numeric;
 const pounds=lastConfirmed({history:[]},active,e,'asq:2','primary','lb').fields;assert.equal(pounds.weightKg,10);assert.equal(pounds.enteredUnit,'kg');assert.equal(pounds.enteredWeight,10);assert.equal(pounds.displayUnit,'lb');assert.equal(switchLoad(pounds,'kg').weight,'10');
});
await test('V4 completed history required; malformed identity, incomplete and unconfirmed sources fail closed',()=>{
 const e=prescription(2,'A').exercises[0],active={id:'a',programId:PROGRAM.programId,week:2,plan:prescription(2,'A'),logs:{},drafts:{}};
 const old={...active,id:'old',endedAt:'2026-01-01',logs:{'asq:1':{weight:'10',reps:'8',note:'',status:'done'}}};
 assert.equal(lastConfirmed({history:[old]},active,e,'asq:1'),null);
 old.logs=Object.fromEntries(setKeys(old.plan).map(k=>[k,{weight:'10',reps:'8',note:'',status:'done'}]));assert(lastConfirmed({history:[old]},active,e,'asq:1'));
 old.drafts={'asq:2':old.logs['asq:2']};assert.equal(lastConfirmed({history:[old]},active,e,'asq:1'),null);
});
await test('V4 honest alternative metadata covers all source definitions with real equipment/support differences',()=>{
 for(const session of ['A','B'])for(const e of PROGRAM.exercise[session]){
  const choices=movements(e);assert(choices.length>=2,e.id);assert.equal(choices[0].name,e.name);assert.equal(choices[0].gear,e.gear);
  for(const m of choices.slice(1)){assert(e.alt.toLowerCase().includes(m.name.toLowerCase()),m.name+' must come from source');assert(m.difference.length>25);assert.notEqual(m.gear,e.gear);assert(m.icons.length>0);assert(['Alternativa','Variante de apoyo/equipo'].includes(m.kind));assert(movementIdentity(e,m.id));}
 }
 assert.equal(movements(prescription(1,'C').exercises[0]).length,1);assert.equal(movements(emergency(1,'A').exercises[0]).length,1);
 assert.equal(coverage().EXACT,6);assert.equal(coverage().RELATED,5);assert.equal(coverage().UNVERIFIED,4);
});
await test('V4.1 S rest parser preserves source ranges and refuses invented manual durations',()=>{
 for(const text of ['90–120 s','90-120s','90 – 120 s',' 90—120 s '])assert.deepEqual(restDuration(text),{minMs:90000,maxMs:120000});
 assert.deepEqual(restDuration('45 s'),{minMs:45000,maxMs:45000});
 for(const text of ['Lo necesario','','según necesidad','120–90 s','0 s','45 min'])assert.equal(restDuration(text),null);
});
async function timerHarness(rest='90–120 s'){
 const locks=new Locks(),h=harness(new Storage(),locks);let s=await h.store.start(null,1,'A');
 if(rest!==s.data.active.plan.exercises[0].rest){const data=JSON.parse(s.raw);data.active.plan.exercises[0].rest=rest;h.storage.map.set(KEY,JSON.stringify(data));s=h.store.read();}
 s=await h.store.log(s.raw,s.data.active.id,'asq:1',{...log,confirmedAt:'2030-01-01T00:00:00Z'});
 let clock=1000000;const timer=createRestStore(h.storage,locks,{now:()=>clock});
 return {...h,timer,sessionId:s.data.active.id,clock:()=>clock,jump:ms=>clock+=ms};
}
await test('V4.1 A/C/D/T only confirmed performed sets with a subsequent unresolved set start one clock',async()=>{
 const h=await timerHarness(),before=h.storage.map.get(KEY);let r=await h.timer.start(h.sessionId,'asq:1');assert.equal(r.record.endsAt,h.clock()+90000);assert.equal(r.record.nextKey,'asq:2');assert.equal(r.record.prescribedRest,'90–120 s');assert.equal(h.storage.map.get(KEY),before);
 h.jump(30000);const again=await h.timer.start(h.sessionId,'asq:1');assert.equal(again.raw,r.raw);assert.equal(remainingMs(again.record,h.clock()),60000);
 let s=h.store.read();s=await h.store.log(s.raw,h.sessionId,'asq:2',{...log,status:'skipped',confirmedAt:'skip'});assert.equal((await h.timer.start(h.sessionId,'asq:2')).record,null);assert.equal(h.timer.read().record,null);
 const last=setKeys(s.data.active.plan).at(-1);s=await h.store.log(s.raw,h.sessionId,last,{...log,confirmedAt:'last'});assert.equal((await h.timer.start(h.sessionId,last)).record,null);
});
await test('V4.1 E/F/G/J wall-clock jumps 30/90/180 seconds reconstruct without ticker execution or counter writes',async()=>{
 for(const elapsed of [30000,90000,180000]){const h=await timerHarness(),r=await h.timer.start(h.sessionId,'asq:1'),raw=r.raw,writes=h.storage.events.filter(e=>e[0]==='set').length;h.jump(elapsed);
  const restored=h.timer.read();assert.equal(restored.raw,raw);assert.equal(restored.record.endsAt,1000000+90000);assert.equal(remainingMs(restored.record,h.clock()),Math.max(0,90000-elapsed));assert.equal(restState(restored.record,h.clock()),elapsed<90000?'running':'expired');assert.equal(h.storage.events.filter(e=>e[0]==='set').length,writes);
  if(elapsed>=90000){const expired=await h.timer.change(raw,'expire');assert.equal(expired.record.state,'expired');assert.equal(remainingMs(expired.record,h.clock()),0);await assert.rejects(()=>h.timer.change(raw,'expire'),/stale-timer/);}
 }
});
await test('V4.2 no new rest pause/resume; legacy paused passage and retained adjustments preserve workout bytes',async()=>{
 const h=await timerHarness('45 s'),before=h.storage.map.get(KEY);let r=await h.timer.start(h.sessionId,'asq:1');h.jump(10000);
 for(const action of ['pause','resume'])await assert.rejects(()=>h.timer.change(r.raw,action),/timer-action-unavailable/);
 r=await h.timer.change(r.raw,'adjust',15000);assert.equal(remainingMs(r.record,h.clock()),50000);
 r=await h.timer.change(r.raw,'adjust',-15000);for(let i=0;i<4;i++)r=await h.timer.change(r.raw,'adjust',-15000);assert.equal(remainingMs(r.record,h.clock()),0);
 r=await h.timer.change(r.raw,'reset');assert.equal(remainingMs(r.record,h.clock()),45000);
 const legacy={...r.record,state:'paused',endsAt:null,remainingMs:35000,future:{keep:true}};h.storage.map.set(REST_KEY,JSON.stringify(legacy));r=h.timer.read();h.jump(180000);
 assert.deepEqual(h.timer.read().record,legacy);assert.equal(remainingMs(r.record,h.clock()),35000);
 for(const [action,value]of [['pause'],['resume'],['reset'],['adjust',15000]])await assert.rejects(()=>h.timer.change(r.raw,action,value),/legacy-rest-interrupted/);
 r=await h.timer.change(r.raw,'skip');assert.equal(r.record.state,'skipped');assert.deepEqual(r.record.future,{keep:true});assert.equal(h.storage.map.get(KEY),before);
 const manual=await timerHarness('Lo necesario');r=await manual.timer.start(manual.sessionId,'asq:1');assert.equal(r.record.state,'manual');assert.equal(r.record.originalDurationMs,null);
 r=await manual.timer.change(r.raw,'manual',75000);assert.equal(r.record.endsAt,manual.clock()+75000);r=await manual.timer.change(r.raw,'reset');assert.equal(remainingMs(r.record,manual.clock()),75000);
});
await test('V4.1 N/O stale timer tabs, source revisions, completed and replaced sessions cannot resurrect rest',async()=>{
 const h=await timerHarness();let r=await h.timer.start(h.sessionId,'asq:1'),old=r.raw;r=await h.timer.change(r.raw,'adjust',15000);await assert.rejects(()=>h.timer.change(old,'reset'),/stale-timer/);
 let s=h.store.read();for(const k of setKeys(s.data.active.plan).slice(1))s=await h.store.log(s.raw,h.sessionId,k,{...log,status:'skipped'});s=await h.store.finish(s.raw,h.sessionId);assert.equal(h.timer.read().record,null);await h.timer.invalidate(h.sessionId);assert.equal(JSON.parse(h.storage.map.get(REST_KEY)).state,'skipped');
 s=await h.store.start(s.raw,2,'A');assert.equal(h.timer.read().record,null);await assert.rejects(()=>h.timer.change(r.raw,'reset'),/stale-timer/);
 const fresh=await timerHarness();r=await fresh.timer.start(fresh.sessionId,'asq:1');s=fresh.store.read();s=await fresh.store.draft(s.raw,fresh.sessionId,'asq:1',{...log});assert.equal(fresh.timer.read().record,null);
});
await test('V4.1 P timer quota/readback failures cannot mutate workout bytes or require timer metadata in backups',async()=>{
 for(const failure of ['quota','readback']){const h=await timerHarness(),before=h.storage.map.get(KEY),backup=h.store.exportRaw();let wrote=false;
  h.storage.fault=(op,key)=>{if(key!==REST_KEY)return;if(failure==='quota'&&op==='set')throw Error('synthetic quota');if(failure==='readback'){if(op==='set')wrote=true;if(op==='get'&&wrote)return null;}};
  await assert.rejects(()=>h.timer.start(h.sessionId,'asq:1'));assert.equal(h.storage.map.get(KEY),before);h.storage.fault=null;
  const imported=harness();await imported.store.restore(null,backup);assert.deepEqual(imported.store.read().data.active,h.store.read().data.active);assert.equal(imported.storage.map.has(REST_KEY),false);
 }
});
async function conditionHarness(week=1){
 const storage=new Storage({'fv4.history':'synthetic sentinel'}),locks=new Locks(),store=createStore(storage,locks);let t=1000000;
 const timer=createConditionStore(storage,locks,{now:()=>t});let s=await store.start(null,week,'C');
 return {storage,locks,store,timer,id:s.data.active.id,jump:ms=>t+=ms,now:()=>t};
}
const declared=(level='partial',seconds=60,cycles=0)=>({weight:'',reps:seconds+' s declarados',note:'synthetic',status:level==='not_performed'?'skipped':'done',completionLevel:level,actualReportedSeconds:seconds,cyclesReported:cycles,reviewed:true,clockReviewed:true,modality:'walk',confirmedAt:'synthetic-confirmation'});
await test('V4.2 12 source timelines; W1/W6/W9/W12 exact phases, durations, boundaries and RPE',()=>{
 for(const source of PROGRAM.plan){const p=timeline(source);assert.equal(p.length,source.week===6?1:source.intervals*2+2);
  if(source.week===6){assert.equal(p[0].seconds,900);assert.equal(p[0].effort,'RPE 3–4');assert.equal(timeline(source,{walk:20})[0].seconds,1200);}
  else{assert.equal(p[0].seconds,300);assert.equal(p.at(-1).seconds,180);assert.equal(timeline(source,{cooldown:5}).at(-1).seconds,300);
   for(const phase of p.filter(p=>p.kind==='effort')){assert.equal(phase.seconds,source.hard);assert.equal(phase.effort,source.effort);}
   for(const phase of p.filter(p=>p.kind==='easy')){assert.equal(phase.seconds,source.easy);assert(phase.effort.includes('conversacional'));}
  }
 }
 for(const [w,n,hard,easy,range]of [[1,4,45,75,'16–18 min'],[9,6,30,90,'20–22 min'],[12,4,45,75,'16–18 min']]){
  const p=PROGRAM.plan[w-1];assert.deepEqual([p.intervals,p.hard,p.easy],[n,hard,easy]);assert.equal(conditionRange(w),range);
 }
 assert.equal(conditionRange(6),'15–20 min');assert.throws(()=>timeline(PROGRAM.plan[5],{walk:14}));assert.throws(()=>timeline(PROGRAM.plan[5],{modality:'row'}));assert.throws(()=>timeline(PROGRAM.plan[0],{cooldown:2}));
});
await test('V4.2 start acknowledgement, immutable deadline/snapshot, rapid duplicate start and concurrent tabs',async()=>{
 const h=await conditionHarness();const s=h.store.read(),before=s.raw;
 await assert.rejects(()=>h.timer.start(null,h.id),/active-conflict/);assert.equal(h.storage.map.has(CONDITION_KEY),false);
 const [a,b]=await Promise.all([h.timer.start(s.raw,h.id,{cooldown:4}),h.timer.start(s.raw,h.id,{cooldown:5})]);assert.equal(a.raw,b.raw);assert.equal(a.record.durationMs,1020000);assert.equal(a.record.endsAt,h.now()+1020000);
 const raw=a.raw;h.jump(180000);assert.equal((await h.timer.start(s.raw,h.id,{cooldown:3})).raw,raw);assert.equal(h.storage.map.get(KEY),before);
 assert.equal(a.record.sourceSHA256,PROGRAM.sourceSHA256);assert.equal(a.record.programVersion,s.data.active.programVersion);assert.deepEqual(a.record.snapshot,s.data.active.plan.conditioning);
 assert(!('remainingMs'in a.record));assert.equal(h.timer.pause,undefined);assert.equal(h.timer.resume,undefined);assert.equal(h.timer.adjust,undefined);
});
await test('V4.2 fake 30/90/180s and phase/full-deadline jumps never write outcomes or decrement counters',async()=>{
 const h=await conditionHarness(),s=h.store.read(),r=await h.timer.start(s.raw,h.id),workout=h.storage.map.get(KEY),writes=h.storage.events.filter(e=>e[0]==='set').length;
 for(const elapsed of [30000,90000,180000,300000,345000,420000,960000,1900000]){
  const p=position(r.record,r.record.startedAt+elapsed);assert.equal(h.timer.read().raw,r.raw);assert.equal(h.storage.map.get(KEY),workout);assert.equal(h.storage.events.filter(e=>e[0]==='set').length,writes);
  if(elapsed===300000){assert.equal(p.phase.kind,'effort');assert.equal(p.remaining,45000);}
  if(elapsed===345000){assert.equal(p.phase.kind,'easy');assert.equal(p.remaining,75000);}
  if(elapsed===420000){assert.equal(p.phase.cycle,2);assert.equal(p.phase.kind,'effort');}
  if(elapsed>=960000){assert(p.reached);assert.equal(p.remaining,0);}
 }
 assert.equal(h.store.read().data.history.length,0);assert.deepEqual(h.store.read().data.active.logs,{});
 assert(!clockChanged(100,100,1000,1000));assert(clockChanged(100,100,100000,1000));assert(clockChanged(100000,1000,100,2000));
});
await test('V4.2 explicit full/partial/not-performed only; stop and accidental cancellation never fabricate credit',async()=>{
 for(const level of ['full','partial','not_performed']){const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);
  await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,declared('full',960,4)),/stop-before-outcome/);
  if(level==='full')h.jump(960000);else{h.jump(30000);r=await h.timer.stop(r.raw);}
  if(level!=='full')await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,declared('full',960,4)),/full-condition-not-confirmed/);
  const result=await h.timer.outcome(s.raw,h.id,r.raw,declared(level,level==='full'?960:level==='partial'?30:0,level==='full'?4:0));
  assert.equal(result.snapshot.data.active.logs['condition:1'].completionLevel,level);assert.equal(h.timer.read().record,null);assert.equal(result.snapshot.data.history.length,0);
  await assert.rejects(()=>h.timer.cancel(result.snapshot.raw,h.id,h.storage.getItem(CONDITION_KEY)),/confirmed-session-cannot-cancel/);
  const finished=await h.store.finish(result.snapshot.raw,h.id);assert.equal(finished.data.history.length,1);assert.equal(h.timer.read().record,null);
 }
 const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);await assert.rejects(()=>h.timer.cancel(s.raw,h.id,r.raw),/stop-before-cancel/);r=await h.timer.stop(r.raw);
 const canceled=await h.timer.cancel(s.raw,h.id,r.raw);assert.equal(canceled.data.active,null);assert.equal(canceled.data.history.length,0);assert.equal(h.timer.read().record,null);assert.equal(h.storage.map.get('fv4.history'),'synthetic sentinel');
});
await test('V4.2 time-reached persists without credit and cannot restart after a backwards clock change',async()=>{
 const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);
 await assert.rejects(()=>h.timer.reach(r.raw),/condition-time-not-reached/);h.jump(960000);r=await h.timer.reach(r.raw);assert.equal(r.record.state,'time_reached');assert.equal(r.record.endsAt,r.record.startedAt+960000);
 h.jump(-300000);assert(position(h.timer.read().record,h.now()).reached);assert.equal(position(r.record,h.now()).remaining,0);assert.deepEqual(h.store.read().data.active.logs,{});assert.equal(h.store.read().data.history.length,0);
});
await test('V4.2 timer quota/readback and failed stop cannot damage workout; outcome acknowledgement stays authoritative',async()=>{
 for(const failure of ['quota','readback']){const h=await conditionHarness(),s=h.store.read();let wrote=false;
  h.storage.fault=(op,key)=>{if(key!==CONDITION_KEY)return;if(failure==='quota'&&op==='set')throw Error('quota');if(failure==='readback'){if(op==='set')wrote=true;if(op==='get'&&wrote)return null;}};
  await assert.rejects(()=>h.timer.start(s.raw,h.id));assert.equal(h.storage.map.get(KEY),s.raw);h.storage.fault=null;
 }
 const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);h.storage.fault=(op,key)=>{if(op==='set'&&key===CONDITION_KEY)throw Error('quota')};
 await assert.rejects(()=>h.timer.stop(r.raw),/quota/);assert.equal(h.storage.map.get(CONDITION_KEY),r.raw);assert.equal(h.storage.map.get(KEY),s.raw);h.storage.fault=null;r=await h.timer.stop(r.raw);
 h.storage.fault=(op,key)=>{if(op==='set'&&key===KEY)throw Error('workout quota')};await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,declared()),/workout quota/);assert.equal(h.storage.map.get(KEY),s.raw);
 h.storage.fault=(op,key)=>{if(op==='set'&&key===CONDITION_KEY)throw Error('timer quota')};const result=await h.timer.outcome(s.raw,h.id,r.raw,declared());assert(result.timerWarning);assert.equal(result.snapshot.data.active.logs['condition:1'].status,'done');assert.equal(h.timer.read().record,null);
});
await test('V4.2 stale tabs, replacement sessions, clock review and immutable saved histories/backups',async()=>{
 const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);const old=r.raw;r=await h.timer.flagClock(r.raw);assert(r.record.clockWarning);assert.equal(r.record.endsAt,JSON.parse(old).endsAt);
 await assert.rejects(()=>h.timer.stop(old),/stale-condition/);r=await h.timer.stop(r.raw);await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,{...declared(),clockReviewed:false}),/clock-review-required/);
 const result=await h.timer.outcome(s.raw,h.id,r.raw,{...declared(),future:{keep:true}});const finished=await h.store.finish(result.snapshot.raw,h.id),history=JSON.stringify(finished.data.history);
 const target=harness();await target.store.restore(null,h.store.exportRaw());assert.equal(JSON.stringify(target.store.read().data.history),history);assert.equal(target.storage.map.has(CONDITION_KEY),false);
 const later=await h.store.start(finished.raw,2,'C');assert.equal(h.timer.read().record,null);await assert.rejects(()=>h.timer.stop(r.raw),/stale-condition/);assert.equal(JSON.stringify(later.data.history),history);
});
await test('V4.2 failed outcome readback and competing declarations cannot duplicate or resurrect confirmed activity',async()=>{
 const h=await conditionHarness(),s=h.store.read();let r=await h.timer.start(s.raw,h.id);r=await h.timer.stop(r.raw);let rejectRead=false;
 h.storage.fault=(op,key,value)=>{if(key!==KEY)return;if(op==='set'&&JSON.parse(value).active?.logs['condition:1'])rejectRead=true;if(op==='get'&&rejectRead){rejectRead=false;return s.raw;}};
 await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,declared()),/read-back-failed/);h.storage.fault=null;
 const verified=h.store.read();assert.equal(verified.data.active.logs['condition:1'].completionLevel,'partial');assert.equal(h.timer.read().record,null);
 await assert.rejects(()=>h.timer.outcome(s.raw,h.id,r.raw,declared()),/stale-tab/);const done=await h.store.finish(verified.raw,h.id);assert.equal(done.data.history.length,1);
 const concurrent=await conditionHarness(),before=concurrent.store.read();let clock=await concurrent.timer.start(before.raw,concurrent.id);clock=await concurrent.timer.stop(clock.raw);
 const attempts=await Promise.allSettled([concurrent.timer.outcome(before.raw,concurrent.id,clock.raw,declared()),concurrent.timer.outcome(before.raw,concurrent.id,clock.raw,declared('not_performed',0,0))]);
 assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(Object.keys(concurrent.store.read().data.active.logs).length,1);
});
await test('V4.2 old condition:1, unfinished backups and unknown-version plans stay readable without a ghost clock',async()=>{
 const h=await conditionHarness();let s=h.store.read();s.data.future={keep:true};s.data.active.programVersion='future-version';delete s.data.active.plan.conditioning;h.storage.map.set(KEY,JSON.stringify(s.data));s=h.store.read();
 await assert.rejects(()=>h.timer.start(s.raw,h.id),/condition-version-unavailable/);assert.equal(h.storage.map.has(CONDITION_KEY),false);
 const result=await h.timer.outcome(s.raw,h.id,null,declared());const finished=await h.store.finish(result.snapshot.raw,h.id);assert.deepEqual(finished.data.future,{keep:true});
 const old=await conditionHarness();s=old.store.read();s=await old.store.log(s.raw,old.id,'condition:1',{...log,future:'keep'});s=await old.store.finish(s.raw,old.id);
 const restored=harness();await restored.store.restore(null,old.store.exportRaw());assert.deepEqual(restored.store.read().data.history,s.data.history);
 const activeBackup=await conditionHarness();s=activeBackup.store.read();await activeBackup.timer.start(s.raw,activeBackup.id);const imported=harness();await imported.store.restore(null,activeBackup.store.exportRaw());assert.equal(createConditionStore(imported.storage,new Locks()).read().record,null);assert(imported.store.read().data.active);
});
console.log(`HOME_GYM_CONTRACT_TOTAL ${tests.filter(Boolean).length}/${tests.length} PASS`);
if(tests.some(x=>!x))process.exitCode=1;
