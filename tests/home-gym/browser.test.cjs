'use strict';
// Disposable loopback origins + synthetic data only. No hosted Preview or owner records.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright'),engine=process.env.HOME_GYM_BROWSER||'chromium',chromium=playwright[engine];
const root=path.resolve('apps/home-gym'),files=new Map(Object.keys(JSON.parse(fs.readFileSync(root+'/artifact.json')).files).concat('artifact.json').map(n=>[n,fs.readFileSync(root+'/'+n)]));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),results=[],evidence=process.env.HOME_GYM_EVIDENCE_DIR||path.join(os.tmpdir(),'home-gym-browser-evidence');
fs.mkdirSync(evidence,{recursive:true});
let mode='current',browser;
const update=new Map(files),newHTML=Buffer.from(files.get('index.html').toString().replace('<head>','<head><!-- synthetic candidate update -->'));
update.set('index.html',newHTML);
const oldWorker=files.get('sw.js').toString(),build=JSON.parse(oldWorker.split('const BUILD = ')[1].split(';\n')[0]);
const asset=build.assets.find(x=>x.name==='index.html');asset.size=newHTML.length;asset.sha256=hash(newHTML);build.id=hash(JSON.stringify(build));
update.set('sw.js',Buffer.from(oldWorker.replace(/const BUILD = .*;\n/,'const BUILD = '+JSON.stringify(build)+';\n')));
const failedWorker=update.get('sw.js').toString().replace(build.id,hash('synthetic failed candidate'));
function contentType(file){return file.endsWith('.html')?'text/html':file.endsWith('.mjs')||file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webmanifest')?'application/manifest+json':'application/json'}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://loopback').pathname;
 res.setHeader('Cache-Control','no-store');
 if(pathname==='/blank.html'||pathname==='/outside/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Synthetic other app</title>');return}
 const file=pathname.slice(1)||'index.html';
 if(!files.has(file)){res.statusCode=404;res.end('not found');return}
 res.setHeader('Content-Type',contentType(file));
 if(mode==='first-failure'&&file==='styles.css'){res.statusCode=503;res.end('synthetic failure');return}
 if(mode==='failed-update'&&file==='sw.js'){res.end(failedWorker);return}
 if(mode==='failed-update'&&file==='styles.css'){res.end('synthetic corrupt stylesheet');return}
 res.end((mode==='update'||mode==='failed-update'?update:files).get(file));
});
const foreign=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Synthetic FV boundary</title>')});
const launch={headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})};
const mobile={viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'};
const key='home-gym.v1.data';
let app,fv;
const raw=p=>p.evaluate(k=>localStorage.getItem(k),key);
const data=async p=>JSON.parse(await raw(p));
async function ready(p){await p.waitForFunction(()=>document.documentElement.dataset.boot==='ready')}
async function warm(ctx){let p=await ctx.newPage();await p.goto(app);await ready(p);await p.evaluate(()=>navigator.serviceWorker.ready);await p.close();p=await ctx.newPage();await p.goto(app);await ready(p);await p.waitForFunction(()=>document.documentElement.dataset.offline==='ready');await p.locator('#sessionChoices [data-route="fuerza-a"]').click();return p}
async function click(p,selector){await p.locator(selector).click();}
async function openProgress(p){if(!await p.locator('#hoy').isVisible()){if(await p.locator('.back-button').isVisible())await p.locator('.back-button').click();else await p.locator('.tab-bar [data-route="hoy"]').click()}if(!await p.locator('#progressPanel').evaluate(el=>el.open))await p.locator('#progressPanel > summary').click();}
async function saveRow(p,index=0,status='done'){
 const row=p.locator('.setrow');if(status==='done'){await row.locator('[data-field="reps"]').fill('8');if(await row.getAttribute('data-load-required')==='true'&&!await row.locator('[data-field="weight"]').inputValue())await row.locator('[data-field="weight"]').fill('10 kg')}
 if(!await row.locator('.set-note').evaluate(el=>el.open))await row.locator('.set-note summary').click();
 await row.locator('[data-field="note"]').fill('Synthetic local note');
 const setKey=await row.getAttribute('data-key');await p.locator(status==='done'?'#saveSet':'#skipSet').click();
 await p.waitForFunction(([k,setKey,status])=>{const a=JSON.parse(localStorage.getItem(k))?.active;return a?.logs?.[setKey]?.status===status&&!a?.drafts?.[setKey]},[key,setKey,status]);
}
async function complete(p){
 if(await p.locator('#homeResume').isVisible())await p.locator('#homeResume').click();
 while(await p.locator('.setrow[data-status="pending"]').count()){
  const k=await p.locator('.setrow').getAttribute('data-key');await saveRow(p,0,k.endsWith(':2')?'skipped':'done');
 }
 const id=(await data(p)).active.id;
 await click(p,'#finishSession');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active===null,key);return id;
}
async function test(name,fn){if(process.env.HOME_GYM_CASE&&!name.includes(process.env.HOME_GYM_CASE))return;try{await fn();results.push(true);console.log('PASS | HOME_GYM_BROWSER '+name)}catch(e){results.push(false);console.error('FAIL | HOME_GYM_BROWSER '+name+' | '+e.stack)}}
(async()=>{
 await Promise.all([new Promise(r=>server.listen(0,'127.0.0.1',r)),new Promise(r=>foreign.listen(0,'127.0.0.1',r))]);
 app='http://127.0.0.1:'+server.address().port+'/';fv='http://127.0.0.1:'+foreign.address().port+'/';
 try{
 browser=await chromium.launch(launch);console.log('HOME_GYM_BROWSER '+engine+' '+browser.version()+' | 390x844 | loopback synthetic');
 async function tipVisible(p,id,label){
  const tip=p.locator('.exercise [data-pro-tip="'+id+'"]');assert.equal(await tip.count(),1);assert((await tip.textContent()).includes('Pro tip 1%'));
  await tip.scrollIntoViewIfNeeded();const box=await tip.boundingBox(),dock=await p.locator('#sessionDock').boundingBox();assert(box.width>100&&box.height>45);assert(box.y>=0&&box.y+box.height<=(dock?.y||mobile.viewport.height)+1,label+' tip unobscured');
  assert(await tip.evaluate(el=>getComputedStyle(el).visibility==='visible'&&getComputedStyle(el).opacity==='1'&&!el.closest('details:not([open])')));
  await p.screenshot({path:path.join(evidence,'v4-tip-'+label+'.png'),fullPage:false});
 }
 async function pickExercise(p,index){if(!await p.locator('.exercise-menu').evaluate(el=>el.open))await p.locator('.exercise-menu > summary').click();await p.locator('[data-exercise="'+index+'"]').click()}
 async function oriented(p,done=false){
  await p.waitForTimeout(80);const area=p.locator(done?'.completion-state':'.exercise-orientation'),box=await area.boundingBox();assert(box.y>=0&&box.y<=24,'new context near top: '+box.y);
  const dock=await p.locator('#sessionDock').boundingBox();if(!done){const title=await p.locator('.exercise-title').boundingBox(),set=await p.locator('.current-set').boundingBox();assert(title.y>=box.y&&set.y+set.height<dock.y);assert((await p.locator('#sessionAnnouncement').textContent()).includes('Serie'));}
 }
 await test('V4 visible labeled tips in A/B preview and execution, next exercise, conditioning and Plan B',async()=>{
  for(const session of ['A','B','C']){const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);if(session!=='A')await p.locator('[data-session="'+session+'"]').click();const id=session==='A'?'asq':session==='B'?'bhinge':'condition';
   await tipVisible(p,id,session+'-preview');assert.equal(await p.locator('#technique').evaluateAll(els=>els.every(el=>!el.open)),true);
   await click(p,'#startSession');await p.waitForSelector('.setrow');await tipVisible(p,id,session+'-active');
   if(session!=='C'){await p.locator('#nextExercise').click();await tipVisible(p,session==='A'?'apress':'bpush',session+'-next');}
  }finally{await ctx.close()}}
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await p.locator('.workout-options > summary').click();const preview=p.locator('.emergency-preview [data-pro-tip]');await preview.scrollIntoViewIfNeeded();assert(await preview.isVisible());assert((await preview.textContent()).includes('Pro tip 1%'));await click(p,'#startEmergency');await p.waitForSelector('.setrow');await tipVisible(p,'emergency','plan-b');assert((await p.locator('.movement-limit').textContent()).includes('No hay otra alternativa distinta aprobada'));}finally{await ctx.close()}
 });
 await test('V4 active-set recall has no implicit write, preserves units/text, current precedence, clear and reload',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#weightInput').fill('10');await p.locator('#repsInput').fill('6–8/lado');await p.locator('#rirInput').selectOption('3');await click(p,'#saveSet');await p.waitForSelector('.setrow[data-key="asq:2"]');
   assert.equal(await p.locator('#weightInput').inputValue(),'10');assert.equal(await p.locator('#repsInput').inputValue(),'6–8/lado');assert.equal(await p.locator('#rirInput').inputValue(),'');assert((await p.locator('.last-time').textContent()).includes('Última vez'));assert.equal((await data(p)).active.drafts['asq:2'],undefined);
   const saved=await raw(p);await p.locator('[data-set="1"]').click();assert.equal(await raw(p),saved);await click(p,'[data-unit="lb"]');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).preferences?.displayUnit==='lb',key);assert.equal((await data(p)).active.drafts['asq:2'],undefined);assert.equal((await data(p)).active.logs['asq:1'].weightKg,10);assert.equal(await p.locator('#weightInput').inputValue(),'22.046226');
   await click(p,'#clearWeight');await click(p,'#clearReps');await p.waitForFunction(k=>{const d=JSON.parse(localStorage.getItem(k)).active.drafts['asq:2'];return d?.weight===''&&d.reps===''},key);await p.locator('[data-set="0"]').click();assert.equal(await p.locator('#weightInput').inputValue(),'10');assert.equal(await p.locator('#rirInput').inputValue(),'3');await p.locator('[data-set="1"]').click();assert.equal(await p.locator('#weightInput').inputValue(),'');assert.equal(await p.locator('#repsInput').inputValue(),'');assert.equal(await p.locator('.last-time').count(),0);
   await p.reload();await ready(p);assert.equal(await p.locator('.setrow').getAttribute('data-key'),'asq:2');assert.equal(await p.locator('#weightInput').inputValue(),'');assert.equal(await p.locator('#repsInput').inputValue(),'');assert.equal((await data(p)).active.logs['asq:1'].reps,'6–8/lado');
  }finally{await ctx.close()}
 });
 await test('V4 later-week numeric/text/zero recall, skipped-only exclusion, history immutability and real export/restore',async()=>{
  const {prescription,setKeys}=await import('../../apps/home-gym/engine.mjs'),{editLoad}=await import('../../apps/home-gym/experience.mjs');
  for(const scenario of ['numeric','text','zero','skipped']){const ctx=await browser.newContext(mobile);try{const p=await warm(ctx),plan=prescription(1,'A'),logs=Object.fromEntries(setKeys(plan).map(k=>[k,{weight:'',reps:'',note:'',status:'skipped'}]));
   logs['asq:1']={weight:'20 piedras',reps:'6/lado',note:'synthetic source note',status:scenario==='skipped'?'skipped':'done',futureSet:{keep:true},...(scenario==='numeric'?editLoad({},'10','kg','single-implement'):{}),...(scenario==='zero'?{...editLoad({},'0','kg','single-implement'),loadIntent:'zero'}:{})};
   await p.evaluate(({k,plan,logs})=>{const d=JSON.parse(localStorage.getItem(k)||'null')||{schema:1,programId:'tactical-mass-hybrid-home-gym',programVersion:'1.1.0-pilot.1',rev:0,calendar:{},active:null,history:[],feedback:''};d.preferences={selectedWeek:2,displayUnit:'lb'};d.history=[{id:'v4-closed',week:1,session:'A',programId:d.programId,programVersion:d.programVersion,startedAt:'2026-01-01',endedAt:'2026-01-01',plan,logs}];d.future={keep:true};localStorage.setItem(k,JSON.stringify(d))},{k:key,plan,logs});await p.reload();await ready(p);const history=JSON.stringify((await data(p)).history);await click(p,'#startSession');await p.waitForSelector('.setrow');const before=await raw(p);
   assert.equal(await p.locator('#weightInput').inputValue(),scenario==='numeric'?'22.046226':scenario==='text'?'20 piedras':scenario==='zero'?'0':'');assert.equal(await p.locator('#repsInput').inputValue(),scenario==='skipped'?'':'6/lado');assert.equal((await data(p)).active.drafts['asq:1'],undefined);assert.equal(await p.locator('#rirInput').inputValue(),'');await p.locator('[data-set="0"]').click();assert.equal(await raw(p),before);assert.equal(JSON.stringify((await data(p)).history),history);
   if(scenario==='numeric'){
    await openProgress(p);const waiting=p.waitForEvent('download');await click(p,'#exportProgress');const download=await waiting,backup=JSON.parse(fs.readFileSync(await download.path())),other=await browser.newContext(mobile);
    try{const q=await warm(other);await openProgress(q);q.on('dialog',d=>d.accept());await q.locator('#importFile').setInputFiles({name:'v4-synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await q.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.week===2,key);await click(q,'#homeResume');assert.equal(await q.locator('#weightInput').inputValue(),'22.046226');assert.equal(JSON.stringify((await data(q)).history),history);assert.deepEqual((await data(q)).future,{keep:true});assert.equal((await data(q)).active.drafts['asq:1'],undefined);}finally{await other.close()}
   }
  }finally{await ctx.close()}}
 });
 await test('V4 ten source alternatives show meaningful differences and persist independent per-set identity',async()=>{
  for(const session of ['A','B']){const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);if(session==='B')await p.locator('[data-session="B"]').click();await click(p,'#startSession');await p.waitForSelector('.setrow');const {movements}=await import('../../apps/home-gym/coaching.mjs');const plan=(await data(p)).active.plan;
   for(let i=0;i<plan.exercises.length;i++){await pickExercise(p,i);const e=plan.exercises[i],choices=movements(e);await p.locator('.movement-options > summary').click();assert.equal(await p.locator('.movement-choice').count(),choices.length);
    for(const m of choices){const card=p.locator('[data-movement="'+m.id+'"]');assert((await card.textContent()).includes(m.gear));if(m.id!=='primary'){assert((await card.textContent()).includes(m.difference));assert((await card.locator('small').textContent()).includes(m.kind));assert(await card.locator('svg').count()>0);const primaryColor=await p.locator('[data-movement="primary"] .equipment-visual').first().evaluate(el=>getComputedStyle(el).backgroundColor),altColor=await card.locator('.equipment-visual').first().evaluate(el=>getComputedStyle(el).backgroundColor);assert.notEqual(primaryColor,altColor);}}
    // A main draft must not become a baseline when an alternative is chosen.
    await p.locator('#weightInput').fill('99');await p.locator('#repsInput').fill('7');const alternative=choices[1];await click(p,'[data-use-movement="'+alternative.id+'"]');assert.equal(await p.locator('#weightInput').inputValue(),'');await p.locator('#repsInput').fill('8');if(alternative.loaded)await p.locator('#weightInput').fill('5');const k=e.id+':1';await click(p,'#saveSet');await p.waitForFunction(([k,id])=>JSON.parse(localStorage.getItem(k)).active.logs[id]?.status==='done',[key,k]);const log=(await data(p)).active.logs[k];assert.equal(log.variantId,alternative.id);assert.equal(log.movement.name,alternative.name);assert.notEqual(log.weight,'99');assert.equal(log.loadBasis,alternative.basis);if(alternative.unloaded)assert.equal(log.loadIntent,'unloaded-alternative');
    await pickExercise(p,i);await p.locator('[data-set="0"]').click();assert((await p.locator('.movement-options > summary').textContent()).includes('Alternativa'));assert.equal((await data(p)).active.logs[k].variantId,alternative.id);
    if(e.sets>1){await p.locator('[data-set="1"]').click();assert.equal(await p.locator('#weightInput').inputValue(),'');await p.locator('.movement-options > summary').click();await click(p,'[data-use-movement="'+alternative.id+'"]');assert.equal(await p.locator('#weightInput').inputValue(),alternative.loaded?'5':'');assert.equal(await p.locator('#repsInput').inputValue(),'8');const pending=(await data(p)).active.drafts[e.id+':2'];if(pending)assert.equal(pending.weight,'');assert((await p.locator('.last-time').textContent()).includes('Última vez'));}
   }
  }finally{await ctx.close()}}
 });
 await test('V4 confirmed save/skip scroll once to next set/exercise, keeps input focus, rapid guard, final and manual resume',async()=>{
  const ctx=await browser.newContext({...mobile,viewport:{width:320,height:568}});try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#weightInput').fill('10');await p.locator('#repsInput').fill('8');await p.locator('#weightInput').focus();await p.locator('#weightInput').scrollIntoViewIfNeeded();/* Focus + reduced viewport models keyboard space; a native iOS keyboard remains untested. */await p.setViewportSize({width:320,height:420});await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1']?.reps==='8',key);
   await p.evaluate(()=>{window.syntheticScrolls=[];const original=window.scrollTo;window.scrollTo=function(...args){window.syntheticScrolls.push(args);return original.apply(this,args)}});
   await p.locator('#saveSet').click();await p.waitForSelector('.setrow[data-key="asq:2"]');await oriented(p);assert.equal(await p.evaluate(()=>document.activeElement.id),'weightInput');assert.equal(await p.evaluate(()=>window.syntheticScrolls.length),1);assert((await p.locator('.current-set').textContent()).includes('Serie 2'));await p.screenshot({path:path.join(evidence,'v4-keyboard-space-simulated.png'),fullPage:false});
   await p.evaluate(()=>{window.syntheticScrolls=[];document.querySelector('#saveSet').click();document.querySelector('#saveSet').click();document.querySelector('#skipSet').click()});await p.waitForSelector('.setrow[data-key="apress:1"]');await oriented(p);assert.equal(await p.evaluate(()=>window.syntheticScrolls.length),1);assert.equal(Object.keys((await data(p)).active.logs).length,2);assert((await p.locator('.exercise-title').textContent()).includes('Press'));assert((await p.locator('.gear-required').textContent()).includes('Banco'));
   await p.evaluate(()=>{window.syntheticScrolls=[];document.querySelector('#skipSet').click()});await p.waitForSelector('.setrow[data-key="apress:2"]');await oriented(p);assert.equal((await data(p)).active.logs['apress:1'].status,'skipped');assert.equal(await p.evaluate(()=>window.syntheticScrolls.length),1);
   await p.evaluate(()=>{window.syntheticScrolls=[];document.querySelector('#nextExercise').click()});await p.waitForSelector('.exercise[data-exercise-id="arow"]');assert.equal(await p.evaluate(()=>window.syntheticScrolls.length),0);await p.setViewportSize({width:320,height:568});await p.reload();await ready(p);assert.equal(await p.locator('.setrow').getAttribute('data-key'),'apress:2');
   const {setKeys}=await import('../../apps/home-gym/engine.mjs');const keys=setKeys((await data(p)).active.plan),last=keys.at(-1);await p.evaluate(({k,keys,last})=>{const d=JSON.parse(localStorage.getItem(k));d.active.drafts={};d.active.logs=Object.fromEntries(keys.filter(k=>k!==last).map(k=>[k,{weight:'',reps:'',note:'',status:'skipped'}]));localStorage.setItem(k,JSON.stringify(d))},{k:key,keys,last});await p.reload();await ready(p);await p.locator('#repsInput').focus();await p.locator('#skipSet').click();await p.waitForSelector('#finishSession');await oriented(p,true);assert.equal(await p.evaluate(()=>document.activeElement.className),'completion-state');assert((await p.locator('#sessionAnnouncement').textContent()).includes('Todas las series'));await p.screenshot({path:path.join(evidence,'v4-small-finish.png'),fullPage:false});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }finally{await ctx.close()}
 });
 await test('V4 invalid weight, failed read-back and concurrent active change never advance or autoscroll',async()=>{
  for(const failure of ['validation','readback','concurrent']){console.log('HOME_GYM_V4_NEGATIVE '+failure);const ctx=await browser.newContext({...mobile,viewport:{width:320,height:568}});try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#repsInput').fill('8');if(failure!=='validation')await p.locator('#weightInput').fill('10');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1']?.reps==='8',key);await p.waitForFunction(()=>document.querySelector('.set-state').textContent.includes('Borrador guardado · confirma'));await p.locator('#weightInput').focus();await p.locator('#weightInput').scrollIntoViewIfNeeded();
   if(failure==='readback')await p.evaluate(k=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(n,v){if(n!==k)return original.call(this,n,v)}},key);
   if(failure==='concurrent')await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.active.id='synthetic-concurrent-active';d.rev++;localStorage.setItem(k,JSON.stringify(d))},key);
   await p.evaluate(()=>{window.syntheticScrolls=[];const original=window.scrollTo;window.scrollTo=function(...args){window.syntheticScrolls.push(args);return original.apply(this,args)}});const before=await raw(p),inputBefore=await p.locator('#weightInput').boundingBox();await p.locator('#saveSet').click();if(failure==='validation')await p.waitForFunction(()=>!document.querySelector('#weightError').hidden);else await p.waitForFunction(()=>document.querySelector('#saveState').classList.contains('error'));assert.equal(await raw(p),before);assert.equal(await p.locator('.setrow').getAttribute('data-key'),'asq:1');assert.equal(await p.evaluate(()=>window.syntheticScrolls.length),0);const inputAfter=await p.locator('#weightInput').boundingBox();assert(Math.abs(inputAfter.y-inputBefore.y)<2,'failure keeps the input visually stationary');assert.equal(await p.evaluate(()=>document.activeElement.id),'weightInput');
  }finally{await ctx.close()}}
 });
 await test('V3 A/D coaching disclosures classify resources and keep training operational offline',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx),network=[];p.on('request',r=>{if(!r.url().startsWith(app))network.push(r.url())});
   for(const session of ['A','B']){await p.locator('[data-session="'+session+'"]').click();for(let i=0;i<5;i++){
    const tip=p.locator('.exercise [data-pro-tip]');assert.equal(await tip.count(),1);assert((await tip.textContent()).trim().split(/\s+/).length>=12);await p.locator('#technique summary').click();assert((await p.locator('#technique').textContent()).includes('Alternativa:'));
    for(const link of await p.locator('#technique a').all()){assert((await link.getAttribute('href')).startsWith('https://'));assert((await link.getAttribute('rel')).includes('noopener'));assert.equal(await link.getAttribute('target'),'_blank')}
    if(i<4)await p.locator('#nextExercise').click();
   }}
   assert((await p.locator('#technique').textContent()).includes('Muestra caminar'));assert((await p.locator('#technique').textContent()).includes('Sin video verificado'));
   await p.locator('[data-session="C"]').click();assert.equal(await p.locator('[data-pro-tip="condition"]').count(),1);
   await p.locator('[data-session="A"]').click();await p.locator('#technique summary').click();await ctx.setOffline(true);await p.locator('#technique [data-resource-status="EXACT"] a').first().click();assert((await p.locator('#saveState').textContent()).includes('Necesitas conexión'));
   await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#weightInput').fill('10');await p.locator('#repsInput').fill('8');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.status==='done',key);assert.equal((await data(p)).active.logs['asq:1'].weightKg,10);assert.deepEqual(network,[]);
  }finally{await ctx.close()}
 });
 await test('V3 B/C numeric unit switching, load basis and rapid controls retain canonical value, focus and scroll',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#weightInput').fill('10');await p.locator('#repsInput').fill('8');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1']?.weightKg===10,key);
   const node=await p.locator('#weightInput').elementHandle();await p.locator('#weightInput').focus();await p.locator('#weightInput').scrollIntoViewIfNeeded();const y=await p.evaluate(()=>scrollY);
   await p.evaluate(()=>{for(let i=0;i<20;i++){document.querySelector('[data-unit="lb"]').click();document.querySelector('[data-unit="kg"]').click()}});
   await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1']?.displayUnit==='kg',key);assert.equal((await data(p)).active.drafts['asq:1'].weightKg,10);assert.equal(await p.locator('#weightInput').inputValue(),'10');assert(await node.evaluate(el=>el===document.activeElement));assert(Math.abs(await p.evaluate(()=>scrollY)-y)<2);
   await p.evaluate(()=>{for(let i=0;i<10;i++)document.querySelector('[data-bump="weight:1"]').click();for(let i=0;i<3;i++)document.querySelector('[data-bump="reps:1"]').click()});await p.waitForFunction(k=>{const d=JSON.parse(localStorage.getItem(k)).active.drafts['asq:1'];return d.weightKg===15&&d.reps==='11'},key);assert(await node.evaluate(el=>el===document.activeElement));
   assert.equal(await p.locator('[data-quick-load="5"]').isVisible(),false);await p.locator('.load-options summary').click();await click(p,'[data-quick-load="5"]');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1']?.weightKg===20,key);
   await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.status==='done',key);const saved=(await data(p)).active.logs['asq:1'];assert.equal(saved.weightKg,20);assert.equal(saved.enteredUnit,'kg');assert.equal(saved.loadBasis,'single-implement');
   await p.locator('#nextExercise').click();assert.equal(await p.locator('#loadBasisLabel').textContent(),'Por mancuerna');await click(p,'[data-unit="lb"]');await p.locator('#weightInput').fill('8.5');await p.locator('#repsInput').fill('8');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['apress:1']?.status==='done',key);const dumbbell=(await data(p)).active.logs['apress:1'];assert.equal(dumbbell.weightKg,8.5*0.45359237);assert.equal(dumbbell.loadBasis,'per-dumbbell');assert.equal(dumbbell.enteredUnit,'lb');
   await p.reload();await ready(p);assert.equal(await p.locator('[data-unit="lb"]').getAttribute('aria-pressed'),'true');assert.equal((await data(p)).preferences.displayUnit,'lb');
   await p.setViewportSize({width:320,height:740});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   for(const selector of ['[data-unit="kg"]','[data-unit="lb"]','[data-bump="weight:1"]','[data-bump="reps:1"]']){const box=await p.locator(selector).boundingBox();assert(box.width>=44&&box.height>=44,selector)}
   await p.locator('#weightInput').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,'v3-mobile-units.png'),fullPage:false});
  }finally{await ctx.close()}
 });
 await test('V3 B legacy mixed weights, zeros, free text and unknown fields survive preference and rep edits',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');
   await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.future={keep:true};d.active.logs['asq:1']={weight:'0',reps:'8',note:'legacy zero',status:'done',futureSet:{keep:true}};d.active.logs['asq:2']={weight:'20 piedras',reps:'6/lado',note:'unknown string',status:'done'};d.active.drafts={};localStorage.setItem(k,JSON.stringify(d))},key);await p.reload();await ready(p);
   await p.locator('.exercise-menu summary').click();await p.locator('[data-exercise="0"]').click();await p.locator('[data-set="0"]').click();const before=(await data(p)).active.logs;
   await click(p,'[data-unit="lb"]');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).preferences?.displayUnit==='lb',key);assert.equal(await p.locator('#weightInput').inputValue(),'0');assert.deepEqual((await data(p)).active.logs,before);
   await p.locator('#rirInput').selectOption('3');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.rir==='3',key);assert.equal((await data(p)).active.logs['asq:1'].weight,'0');assert.equal((await data(p)).active.logs['asq:1'].weightKg,undefined);assert.deepEqual((await data(p)).active.logs['asq:1'].futureSet,{keep:true});
   await p.locator('.exercise-menu summary').click();await p.locator('[data-exercise="0"]').click();await p.locator('[data-set="1"]').click();await click(p,'[data-unit="kg"]');await click(p,'[data-bump="reps:1"]');await click(p,'[data-bump="weight:1"]');assert.equal(await p.locator('#weightInput').inputValue(),'20 piedras');assert.equal(await p.locator('#repsInput').inputValue(),'6/lado');assert.deepEqual((await data(p)).active.logs['asq:2'],before['asq:2']);assert.deepEqual((await data(p)).future,{keep:true});
  }finally{await ctx.close()}
 });
 await test('V3 E progress counts confirmed outcomes once across partial, skip-only, Plan B and duplicate histories',async()=>{
  const {prescription,emergency,setKeys}=await import('../../apps/home-gym/engine.mjs');let id=0;
  const entry=(w,s,status='done',planB=false)=>{const plan=planB?emergency(w,s):prescription(w,s);return {id:'v3-synthetic-'+(++id),week:w,session:s,programId:'tactical-mass-hybrid-home-gym',programVersion:'1.1.0-pilot.1',startedAt:'2026-01-01',endedAt:'2026-01-01',plan,logs:Object.fromEntries(setKeys(plan).map(k=>[k,{weight:'',reps:'8',note:'synthetic',status}]))}};
  const A=entry(1,'A'),C=entry(1,'C'),B=entry(1,'B'),skip=entry(1,'C','skipped'),planB=entry(1,'B','done',true);
  for(const scenario of [{history:[],expected:[0,0,0,0]},{history:[A],expected:[1,1,0,0]},{history:[A,C,B],expected:[3,3,0,1]},{history:['A','B','C'].map(s=>entry(1,s,'skipped')),expected:[3,0,3,0]},{history:[A,skip,planB],expected:[3,2,1,0]},{history:[A,entry(1,'A','skipped')],expected:[1,1,0,0]}]){
   const ctx=await browser.newContext(mobile);try{await ctx.addInitScript(({k,history})=>localStorage.setItem(k,JSON.stringify({schema:1,programId:'tactical-mass-hybrid-home-gym',programVersion:'1.1.0-pilot.1',rev:0,calendar:{},active:null,history,feedback:'',preferences:{selectedWeek:1}})),{k:key,history:scenario.history});const p=await warm(ctx);await openProgress(p);const metrics=await p.locator('#progressSummary dd').allTextContents();assert.equal(metrics[0],scenario.expected[0]+'/36');assert.equal(metrics[1],String(scenario.expected[1]));assert.equal(metrics[2],String(scenario.expected[2]));assert.equal(metrics[3],scenario.expected[3]+'/12');assert.equal(await p.locator('#history .log').count(),scenario.expected[0]);assert((await p.locator('#homeProgress').textContent()).includes('Sin sincronización'));const hero=await p.locator('#todayCard').boundingBox(),summary=await p.locator('#homeProgress').boundingBox();assert(summary.y>=hero.y+hero.height-1);
   }finally{await ctx.close()}
  }
 });
 await test('V3 F meaningful week, intentional manual week, active session and backup preferences survive reopen',async()=>{
  const {prescription,setKeys}=await import('../../apps/home-gym/engine.mjs');const history=['A','B','C'].map(session=>{const plan=prescription(1,session);return {id:'week-one-'+session,week:1,session,programId:'tactical-mass-hybrid-home-gym',programVersion:'1.1.0-pilot.1',startedAt:'2026-01-01',endedAt:'2026-01-01',plan,logs:Object.fromEntries(setKeys(plan).map(k=>[k,{weight:'10 lb',reps:'8',note:'synthetic',status:'done'}]))}});
  const ctx=await browser.newContext(mobile);try{
   await ctx.addInitScript(({k,history})=>{if(localStorage.getItem(k)===null)localStorage.setItem(k,JSON.stringify({schema:1,programId:'tactical-mass-hybrid-home-gym',programVersion:'1.1.0-pilot.1',rev:0,calendar:{},active:null,history,feedback:'',future:{keep:true}}))},{k:key,history});const p=await warm(ctx);assert((await p.locator('#weekBadge').textContent()).includes('2'));
   await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="semana"]').click();await p.locator('#weekSelect').selectOption('7');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).preferences?.selectedWeek===7,key);await p.reload();await ready(p);assert.equal(await p.locator('#weekSelect').inputValue(),'7');
   await p.locator('#weekSessions [data-route="fuerza-a"]').click();await click(p,'#startSession');await p.waitForSelector('.setrow');await click(p,'[data-unit="lb"]');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).preferences?.displayUnit==='lb',key);
   await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="semana"]').click();await p.locator('#weekSelect').selectOption('5');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).preferences.selectedWeek===5,key);assert.equal(await p.locator('#weekSelect').inputValue(),'5');await p.reload();await ready(p);assert.equal(await p.locator('#weekSelect').inputValue(),'7');assert.equal((await data(p)).active.week,7);
   await openProgress(p);const downloadPromise=p.waitForEvent('download');await click(p,'#exportProgress');const download=await downloadPromise,backup=JSON.parse(fs.readFileSync(await download.path()));
   const other=await browser.newContext(mobile);try{const q=await warm(other);await openProgress(q);q.on('dialog',d=>d.accept());await q.locator('#importFile').setInputFiles({name:'v3-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await q.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.week===7,key);assert((await q.locator('#weekBadge').textContent()).includes('7'));assert.equal((await data(q)).preferences.displayUnit,'lb');assert.equal((await data(q)).history.length,3);assert.deepEqual((await data(q)).future,{keep:true});await q.reload();await ready(q);assert((await q.locator('#weekBadge').textContent()).includes('7'))}finally{await other.close()}
  }finally{await ctx.close()}
 });
 await test('HARDEN A missing-load, intentional zero, free-text history, bodyweight and conditioning',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await p.locator('#repsInput').fill('8');await click(p,'#saveSet');assert.equal(Object.keys((await data(p)).active.logs).length,0);assert.equal(await p.locator('#weightInput').getAttribute('aria-invalid'),'true');assert((await p.locator('#weightError').textContent()).includes('peso'));assert.equal(await p.locator('#weightInput').inputValue(),'');
   await p.locator('#weightInput').fill('0');await click(p,'#saveSet');assert.equal(Object.keys((await data(p)).active.logs).length,0);await click(p,'#zeroWeight');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.status==='done',key);assert.equal((await data(p)).active.logs['asq:1'].weight,'0');assert.equal((await data(p)).active.logs['asq:1'].loadIntent,'zero');
   await p.locator('#weightInput').fill('27,5 kg');await p.locator('#repsInput').fill('9');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:2']?.status==='done',key);assert.equal((await data(p)).active.logs['asq:2'].weight,'27,5 kg');
   await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.future={keep:true};d.active.logs['asq:2'].legacy={unit:'do not convert'};localStorage.setItem(k,JSON.stringify(d))},key);const historical=await raw(p);await p.reload();await ready(p);assert.equal(await raw(p),historical);
   for(let i=0;i<3;i++)await p.locator('#nextExercise').click();assert.equal(await p.locator('.exercise-title').textContent(),'Dead bug');await p.locator('#repsInput').fill('6/lado');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['acore:1']?.status==='done',key);assert.equal((await data(p)).active.logs['acore:1'].weight,'');
   // The approved goblet alternative is explicitly without weight; record the choice, not an invented zero load.
   await p.locator('.exercise-menu > summary').click();await p.locator('[data-exercise="0"]').click();await p.locator('[data-set="0"]').click();await click(p,'#alternativeNoLoad');await p.locator('#repsInput').fill('8');await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.loadIntent==='unloaded-alternative',key);assert.equal((await data(p)).active.logs['asq:1'].weight,'');assert.deepEqual((await data(p)).active.logs['asq:2'].legacy,{unit:'do not convert'});assert.deepEqual((await data(p)).future,{keep:true});
  }finally{await ctx.close()}
  for(const [session,exercise,answer]of [['B',1,'8'],['B',4,'20 s/lado'],['C',0,'15 min suave']]){const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await p.locator('[data-session="'+session+'"]').click();await click(p,'#startSession');for(let i=0;i<exercise;i++)await p.locator('#nextExercise').click();const setKey=await p.locator('.setrow').getAttribute('data-key');await p.locator('#repsInput').fill(answer);await click(p,'#saveSet');await p.waitForFunction(([k,s])=>JSON.parse(localStorage.getItem(k)).active.logs[s]?.status==='done',[key,setKey]);assert.equal((await data(p)).active.logs[setKey].weight,'')}finally{await ctx.close()}}
 });
 await test('HARDEN B equipment from the full prescription, required supports versus alternatives',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);
   assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="dumbbell"]').count(),1);assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="bench"]').count(),1);
   await p.locator('[data-session="B"]').click();assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="kettlebell"]').count(),1);assert((await p.locator('.gear-required').textContent()).includes('apoyo firme'));assert.equal(await p.locator('.gear-chip[data-role="alternative"][data-gear="dumbbell"]').count(),1);
   await p.locator('#nextExercise').click();assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="bench"]').count(),1);assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="bar"]').count(),0);assert.equal(await p.locator('.gear-chip[data-role="alternative"][data-gear="bar"]').count(),1);assert.equal(await p.locator('.gear-chip[data-role="alternative"][data-gear="rack"]').count(),1);
   await p.locator('#nextExercise').click();await p.locator('#nextExercise').click();assert.equal(await p.locator('.gear-chip[data-role="required"][data-gear="bench"]').count(),1);assert.equal(await p.locator('.gear-chip[data-role="optional"][data-gear="dumbbell"]').count(),1);
   await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="equipo"]').click();assert.equal(await p.locator('.equipment-card svg').count(),10);
  }finally{await ctx.close()}
 });
 await test('HARDEN C unresolved readiness is bounded and manual retry recovers without reset/reload',async()=>{
  const ctx=await browser.newContext(mobile);try{await ctx.addInitScript(()=>{Object.defineProperty(navigator.serviceWorker,'ready',{configurable:true,get:()=>new Promise(()=>{})})});const p=await ctx.newPage();await p.goto(app);await ready(p);const started=Date.now();await p.waitForFunction(()=>document.documentElement.dataset.offline==='unavailable',{},{timeout:13000});assert(Date.now()-started<12500);assert((await p.locator('#offlineStatus').textContent()).includes('Reconecta'));assert.equal(await raw(p),null);const url=p.url();await p.locator('.offline-card > summary').click();assert(await p.locator('#retryOffline').isVisible());
   await p.evaluate(()=>{delete navigator.serviceWorker.ready});await click(p,'#retryOffline');await p.waitForFunction(()=>['installed','ready'].includes(document.documentElement.dataset.offline));assert.equal(p.url(),url);assert.equal(await raw(p),null);await p.close();const q=await ctx.newPage();await q.goto(app);await ready(q);
   // The init script deliberately masks ready on each new page; restore it before this page's explicit retry.
   await q.evaluate(()=>{delete navigator.serviceWorker.ready});await q.locator('.offline-card > summary').click();await q.waitForFunction(()=>document.documentElement.dataset.offline==='unavailable',{},{timeout:13000});await click(q,'#retryOffline');await q.waitForFunction(()=>document.documentElement.dataset.offline==='ready');assert.equal(await raw(q),null);
  }finally{await ctx.close()}
 });
 await test('1/5 six destinations, source details across 12 weeks, visuals and mobile layout',async()=>{
  mode='current';const ctx=await browser.newContext(mobile);try{
   const p=await warm(ctx),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));
   const expected=await p.evaluate(async()=>(await import('./program.mjs')).PROGRAM);
   for(let week=1;week<=12;week++){
    await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="semana"]').click();await p.locator('#weekSelect').selectOption(String(week));
    assert((await p.locator('#weekHeadline').textContent()).includes('Semana '+week));assert.equal(await p.locator('.weekdot').count(),12);
    assert.deepEqual(await p.locator('.day').evaluateAll(els=>els.map(e=>e.dataset.daySession).filter(Boolean)),week%2?['A','C','B']:['B','C','A']);
    for(const session of ['A','B']){
     await p.locator('#weekSessions [data-route="'+(session==='A'?'fuerza-a':'fuerza-b')+'"]').click();
     const plan=await p.evaluate(async({week,session})=>(await import('./engine.mjs')).prescription(week,session),{week,session});
     for(let i=0;i<5;i++){
      if(i)await p.locator('#nextExercise').click();assert.equal(await p.locator('.exercise:visible').count(),1);const e=plan.exercises[i];
      assert.equal(await p.locator('.exercise-title').textContent(),e.name);assert((await p.locator('.exercise-equipment').textContent()).includes(e.gear));
      const prescription=await p.locator('.prescription').textContent();assert(prescription.includes(e.sets+' × '+e.reps));assert(prescription.includes(e.rir));assert(prescription.includes(e.rest));
      assert.equal(await p.locator('#technique').evaluate(el=>el.open),false);await p.locator('#technique summary').click();const details=await p.locator('#technique').textContent();for(const field of ['tempo','cue','alt'])assert(details.includes(e[field]));
      assert(await p.locator('.gear-required svg').evaluateAll(els=>els.length>0&&els.every(el=>el.getBoundingClientRect().height>0)));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     }
     await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="semana"]').click();
    }
    await p.locator('#weekSessions [data-route="condicion"]').click();assert.equal(await p.locator('.interval-block').count(),week===6?1:3);const protocol=await p.evaluate(async w=>(await import('./engine.mjs')).prescription(w,'C').protocol,week);assert((await p.locator('.technique').textContent()).includes(protocol));
   }
   await p.locator('.back-button').click();await p.locator('.tab-bar [data-route="equipo"]').click();assert.equal(await p.locator('.equipment-card').count(),10);assert.equal(await p.locator('.equipment-card svg').count(),10);assert.equal(await p.locator('img').count(),0);
   for(const item of expected.equipment)assert((await p.locator('#equipment').textContent()).includes(item));
   await p.screenshot({path:path.join(evidence,'mobile-equipment.png'),fullPage:false});
   await p.locator('.tab-bar [data-route="semana"]').click();await p.locator('#weekSelect').selectOption('1');await p.locator('#moveDays').locator('..').locator('summary').click();await p.locator('[data-move="A"]').selectOption('1');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.calendar?.['1']?.A===1,key);await p.reload();await ready(p);assert.equal(await p.locator('.day').nth(1).getAttribute('data-day-session'),'A');
   await p.screenshot({path:path.join(evidence,'mobile-calendar.png'),fullPage:false});assert.deepEqual(pageErrors,[]);
  }finally{await ctx.close()}
 });
 await test('UX steppers/RIR preserve drafts, units, focus, scroll and unknown fields; all critical targets >=44',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');
   assert.equal(await p.locator('#weightInput').inputValue(),'');assert.equal(await p.locator('#repsInput').inputValue(),'');await click(p,'#saveSet');assert.equal(Object.keys((await data(p)).active.logs).length,0);assert.equal(await p.locator('#weightInput').inputValue(),'');
   await p.locator('#weightInput').fill('20 lb');await p.locator('#repsInput').fill('8');await p.locator('#rirInput').selectOption('3');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.drafts?.['asq:1']?.rir==='3',key);
   const id=(await data(p)).active.id;await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.future={keep:true};d.active.drafts['asq:1'].futureSet={keep:true};localStorage.setItem(k,JSON.stringify(d))},key);await p.reload();await ready(p);
   assert.equal(await p.locator('#weightInput').inputValue(),'20 lb');assert.equal(await p.locator('#rirInput').inputValue(),'3');
   for(const selector of ['[data-bump="weight:1"]','[data-bump="weight:-1"]','[data-bump="reps:1"]','[data-bump="reps:-1"]','#rirInput','#saveSet','#skipSet']){const box=await p.locator(selector).boundingBox();assert(box.width>=44&&box.height>=44,selector+' target')}
   // Center the control above the fixed dock before measuring; intersection alone includes obscured controls.
   await p.locator('[data-bump="weight:1"]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await p.locator('[data-bump="weight:1"]').focus();
   const before=await p.locator('.exercise').boundingBox();await p.screenshot({path:path.join(evidence,'v4-stepper-before.png'),fullPage:false});await p.locator('[data-bump="weight:1"]').click();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.drafts?.['asq:1']?.weight==='21 lb',key);const after=await p.locator('.exercise').boundingBox();await p.screenshot({path:path.join(evidence,'v4-stepper-after.png'),fullPage:false});assert(Math.abs(before.y-after.y)<1,JSON.stringify({before,after}));assert.equal(await p.locator('[data-bump="weight:1"]').evaluate(el=>document.activeElement===el),true);
   await p.evaluate(()=>{document.querySelector('[data-bump="reps:1"]').click();document.querySelector('[data-bump="reps:1"]').click();document.querySelector('[data-bump="weight:-1"]').click()});await p.waitForFunction(k=>{const d=JSON.parse(localStorage.getItem(k)).active.drafts['asq:1'];return d.weight==='20 lb'&&d.reps==='10'},key);
   assert.equal((await data(p)).active.id,id);assert.deepEqual((await data(p)).active.drafts['asq:1'].futureSet,{keep:true});
   await click(p,'#zeroWeight');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.drafts['asq:1'].weight==='0',key);await click(p,'#saveSet');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active.logs['asq:1']?.status==='done',key);const saved=await data(p);assert.equal(saved.active.logs['asq:1'].weight,'0');assert.equal(saved.active.logs['asq:1'].rir,'3');assert.deepEqual(saved.active.logs['asq:1'].futureSet,{keep:true});assert.deepEqual(saved.future,{keep:true});assert.equal(await p.locator('.setrow').getAttribute('data-key'),'asq:2');
   await p.screenshot({path:path.join(evidence,'mobile-session.png'),fullPage:false});
   await p.setViewportSize({width:320,height:740});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.locator('.back-button').click();assert.equal(await p.locator('#hoy').isVisible(),true);await p.locator('#homeResume').click();
   while(await p.locator('.setrow[data-status="pending"]').count())await saveRow(p);
   assert(await p.locator('#finishSession').isVisible());await p.locator('#rirInput').selectOption('2');await p.waitForFunction(k=>Object.keys(JSON.parse(localStorage.getItem(k)).active.drafts).length===1,key);assert.equal(await p.locator('#finishSession').count(),0);assert(await p.locator('#saveSet').isVisible());
   await p.reload();await ready(p);assert.equal(await p.locator('#rirInput').inputValue(),'2');assert.equal(await p.locator('#finishSession').count(),0);await p.locator('#saveSet').click();await p.waitForSelector('#finishSession');await p.locator('#finishSession').click();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).history.length===1,key);const finished=await data(p);assert.deepEqual(finished.future,{keep:true});assert.deepEqual(finished.history[0].logs['asq:1'].futureSet,{keep:true});assert(Object.values(finished.history[0].logs).some(v=>v.rir==='2'));
  }finally{await ctx.close()}
 });
 await test('4/5 save, explicit skip, immutable completion, feedback and emergency replacement',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);
   await click(p,'#startSession');await p.waitForSelector('.setrow');
   await p.locator('.setrow').first().locator('[data-field="weight"]').fill('25 lb');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.drafts?.['asq:1']?.weight==='25 lb',key);await p.reload();await ready(p);assert.equal(await p.locator('.setrow').first().locator('[data-field="weight"]').inputValue(),'25 lb');assert.equal(await p.locator('#finishSession').count(),0);assert.equal(await p.locator('#saveSet').isVisible(),true);
   await saveRow(p,0);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.locator('#sessionTitle').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,'mobile-session.png'),fullPage:false});
   await p.reload();await ready(p);assert.equal(Object.keys((await data(p)).active.logs).length,1);
   const id=await complete(p),saved=await data(p);assert.equal(saved.history.length,1);assert.equal(saved.history[0].id,id);assert(Object.values(saved.history[0].logs).some(x=>x.status==='skipped'));
   await p.reload();await ready(p);assert.equal((await data(p)).history.length,1);assert((await p.locator('#weeklyCount').textContent()).startsWith('1/3'));
   await p.locator('#sessionChoices [data-route="fuerza-b"]').click();await p.locator('.workout-options summary').click();await click(p,'#startEmergency');await p.waitForSelector('.setrow');assert((await data(p)).active.plan.emergency);
   await complete(p);assert.equal((await data(p)).history.length,2);assert.equal((await data(p)).active,null);
   await openProgress(p);await p.locator('#progressPanel .nested-disclosure summary').click();await p.locator('#feedback').fill('<img src=x onerror=alert(1)> synthetic');await click(p,'#saveFeedback');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).feedback.includes('synthetic'),key);
   const downloadPromise=p.waitForEvent('download');await click(p,'#exportProgress');const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path()));assert.equal(exported.programId,'tactical-mass-hybrid-home-gym');assert.equal(JSON.parse(exported.raw).history.length,2);
   const next=await browser.newContext(mobile);try{const q=await warm(next);await openProgress(q);q.on('dialog',d=>d.accept());await q.locator('#importFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await q.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.history.length===2,key);assert.equal((await data(q)).feedback,JSON.parse(exported.raw).feedback);assert.equal(await q.locator('#feedback img').count(),0)}finally{await next.close()}
  }finally{await ctx.close()}
 });
 await test('3 distinct origins isolate synthetic FV records; pilot uses only its namespace',async()=>{
  const ctx=await browser.newContext(mobile);try{
   const f=await ctx.newPage();await f.goto(fv);await f.evaluate(()=>{localStorage.setItem('fv4.history','synthetic FV sentinel');localStorage.setItem('fv4.active','synthetic active')});
   const p=await warm(ctx);assert.equal(await raw(p),null);await click(p,'#startSession');await p.waitForSelector('.setrow');
   assert.equal(await p.evaluate(()=>localStorage.getItem('fv4.history')),null);
   assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage)),[key]);
   const popupPromise=p.waitForEvent('popup');await p.evaluate(origin=>{window.syntheticOther=window.open(origin)},fv);const popup=await popupPromise;await popup.waitForLoadState();const access=await p.evaluate(()=>{try{return window.syntheticOther.localStorage.getItem('fv4.history')}catch(e){return e.name}});assert.equal(access,'SecurityError');await popup.close();
   assert.equal(await f.evaluate(()=>localStorage.getItem('fv4.history')),'synthetic FV sentinel');
  }finally{await ctx.close()}
 });
 await test('3 known FV hostname refuses boot before any storage or worker registration',async()=>{
  const ctx=await browser.newContext(mobile);try{
   await ctx.route('http://fevaldez.github.io/**',route=>{const pathname=new URL(route.request().url()).pathname;const n=pathname.replace('/apps/home-gym/','')||'index.html';route.fulfill({status:files.has(n)?200:404,contentType:contentType(n),body:files.get(n)||Buffer.from('not found')})});
   const p=await ctx.newPage();await p.addInitScript(()=>{localStorage.setItem('fv4.history','synthetic sentinel');window.syntheticWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.syntheticWrites.push(k);return set.call(this,k,v)}});
   await p.goto('http://fevaldez.github.io/apps/home-gym/');await p.waitForFunction(()=>document.documentElement.dataset.boot==='blocked-origin');
   assert.equal(await p.evaluate(()=>localStorage.getItem('fv4.history')),'synthetic sentinel');assert.deepEqual(await p.evaluate(()=>window.syntheticWrites),[]);assert.equal(await p.locator('.weekdot').count(),0);
  }finally{await ctx.close()}
 });
 await test('4 storage quota failure leaves active session and history intact, retry completes once',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');
   while(await p.locator('.setrow[data-status="pending"]').count()){const rows=p.locator('.setrow');let i=0;for(;i<await rows.count();i++)if(await rows.nth(i).getAttribute('data-status')==='pending')break;await saveRow(p,i)}
   const before=await raw(p);await p.evaluate(k=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(name,v){if(name===k)throw new DOMException('synthetic quota','QuotaExceededError');return window.originalSet.call(this,name,v)}},key);
   await click(p,'#finishSession');await p.waitForFunction(()=>document.querySelector('#saveState').classList.contains('error'));assert.equal(await raw(p),before);
   await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);await click(p,'#refresh');await click(p,'#finishSession');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).history.length===1,key);
   await p.reload();await ready(p);assert.equal((await data(p)).history.length,1);
  }finally{await ctx.close()}
 });
 await test('4 complete online installation, offline save and full browser process restart cold relaunch',async()=>{
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'home-gym-profile-'));let ctx;try{
   ctx=await chromium.launchPersistentContext(profile,{...launch,...mobile,acceptDownloads:true});let p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await ctx.setOffline(true);await saveRow(p,0);const saved=await raw(p);await p.close();
   p=await ctx.newPage();await p.goto(app+'index.html');await ready(p);assert.equal(await raw(p),saved);await ctx.close();
   ctx=await chromium.launchPersistentContext(profile,{...launch,...mobile});await ctx.setOffline(true);p=await ctx.newPage();await p.goto(app,{timeout:10000});await ready(p);assert.equal(await raw(p),saved);await p.waitForFunction(()=>document.documentElement.dataset.offline==='ready');
   const before=(await data(p)).active.id;await complete(p);assert.equal((await data(p)).history[0].id,before);
  }finally{await ctx?.close();fs.rmSync(profile,{recursive:true,force:true})}
 });
 await test('4 failed initial installation cannot advertise readiness; later complete online install works',async()=>{
  mode='first-failure';const ctx=await browser.newContext(mobile);try{const p=await ctx.newPage();await p.goto(app);await ready(p);
   await p.waitForFunction(()=>document.documentElement.dataset.offline==='unavailable',{},{timeout:13000});assert((await p.locator('#offlineStatus').textContent()).includes('Reconecta'));assert.deepEqual(await p.evaluate(()=>caches.keys()),[]);assert.equal(await raw(p),null);
   mode='current';await p.locator('.offline-card > summary').click();await click(p,'#retryOffline');await p.waitForFunction(()=>document.documentElement.dataset.offline==='installed');assert.equal(await raw(p),null);await p.close();const q=await ctx.newPage();await q.goto(app);await ready(q);await q.waitForFunction(()=>document.documentElement.dataset.offline==='ready');
  }finally{mode='current';await ctx.close()}
 });
 await test('4/6 failed update retains active release; valid update waits, preserves logs and unrelated caches',async()=>{
  mode='current';const ctx=await browser.newContext(mobile);try{let p=await warm(ctx);await click(p,'#startSession');await p.waitForSelector('.setrow');await saveRow(p,0);const saved=await raw(p);
   const original=await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await (await caches.open('synthetic-unrelated')).put('/keep',new Response('keep'));return r.active.scriptURL});
   mode='failed-update';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();await new Promise(resolve=>{const i=r.installing;if(!i||i.state==='redundant')return resolve();i.addEventListener('statechange',()=>{if(i.state==='redundant')resolve()})})});
   assert.equal(await raw(p),saved);assert.equal(await p.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting)),false);
   assert.equal((await p.evaluate(()=>caches.keys())).filter(n=>n.startsWith('home-gym-shell-v1-')).length,1);
   mode='update';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await p.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting));
   assert.equal(await raw(p),saved);assert.equal(await p.evaluate(()=>navigator.serviceWorker.controller.scriptURL),original);
   assert.equal(await p.evaluate(()=>fetch('./index.html').then(r=>r.text()).then(t=>t.includes('synthetic candidate update'))),false);
   await p.close();p=await ctx.newPage();await p.goto(app);await ready(p);assert.equal(await raw(p),saved);
   await p.waitForFunction(()=>fetch('./index.html').then(r=>r.text()).then(t=>t.includes('synthetic candidate update')));
   assert((await p.evaluate(()=>caches.keys())).includes('synthetic-unrelated'));
   const other=await ctx.newPage();await other.goto(app+'outside/');assert.equal(await other.title(),'Synthetic other app');assert.equal(await other.evaluate(async()=>{for(const n of await caches.keys())if(await (await caches.open(n)).match(location.href))return true;return false}),false);await other.close();
   await ctx.setOffline(true);await p.reload();await ready(p);assert.equal(await raw(p),saved);
  }finally{mode='current';await ctx.close()}
 });
 }finally{await browser?.close();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>foreign.close(r))])}
 if(engine==='chromium'){if(fs.existsSync(playwright.webkit.executablePath())){const run=require('node:child_process').spawnSync(process.execPath,[__filename],{env:{...process.env,HOME_GYM_BROWSER:'webkit',HOME_GYM_CASE:'V4'},stdio:'inherit',timeout:240000});if(run.status!==0)process.exitCode=1;}else console.log('HOME_GYM_WEBKIT UNKNOWN | no installed executable; no physical iPhone evidence');}
 console.log(`HOME_GYM_BROWSER_TOTAL ${results.filter(Boolean).length}/${results.length} PASS | physical iPhone Safari/Home Screen UNKNOWN`);
 if(results.some(x=>!x))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;server.close();foreign.close()});
