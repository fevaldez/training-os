import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PROGRAM } from '../../apps/home-gym/program.mjs';
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
 assert(!/data:image|base64,|103\s*kg|1\.76|defaultAnswers|thm_form_|fv4\.|tos_v3|https?:\/\//.test(text.replace('http://www.w3.org/2000/svg','')));
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
 const w=worker();await w.event('install');await w.event('activate');const {BUILD,CACHE}=w.meta();assert.equal(w.store.get(CACHE).size,9);
 assert(!w.calls.some(x=>['skipWaiting','claim'].includes(x[0])));
 const r=await w.event('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});assert.equal(await r.text(),read(root+'index.html').toString());
 for(const [url,method,mode]of [[scope+'other/','GET','navigate'],['https://else.invalid/','GET','cors'],[scope,'POST','navigate']])assert.equal(await w.event('fetch',{request:{url,method,mode}}),undefined);
 for(const registrationScope of ['https://synthetic.invalid/foreign/','https://foreign.invalid/']){const bad=worker({registrationScope});await assert.rejects(()=>bad.event('install'));assert.equal(bad.store.size,0)}
 let replies=[];await w.event('message',{data:{type:'HOME_GYM_OFFLINE_STATUS'},source:{url:scope},ports:[{postMessage:x=>replies.push(x)}]});assert.equal(replies.at(-1).ready,true);
 const before=replies.length;await w.event('message',{data:{type:'HOME_GYM_OFFLINE_STATUS'},source:{url:scope+'foreign/'},ports:[{postMessage:x=>replies.push(x)}]});assert.equal(replies.length,before);
 assert.equal(BUILD.assets.length,9);
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
 assert.equal(Object.keys(artifact.files).length,10);
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
console.log(`HOME_GYM_CONTRACT_TOTAL ${tests.filter(Boolean).length}/${tests.length} PASS`);
if(tests.some(x=>!x))process.exitCode=1;
