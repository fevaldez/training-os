'use strict';
// Disposable loopback origins + synthetic data only. No hosted Preview or owner records.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
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
async function warm(ctx){let p=await ctx.newPage();await p.goto(app);await ready(p);await p.evaluate(()=>navigator.serviceWorker.ready);await p.close();p=await ctx.newPage();await p.goto(app);await ready(p);await p.waitForFunction(()=>document.documentElement.dataset.offline==='ready');return p}
async function click(p,selector){await p.locator(selector).click();}
async function saveRow(p,index=0,status='done'){
 const row=p.locator('.setrow').nth(index);
 if(status==='done')await row.locator('[data-field="reps"]').fill('8');
 await row.locator('[data-field="note"]').fill('Synthetic local note');
 const setKey=await row.getAttribute('data-key');
 await row.locator(`[data-log-action="${status}"]`).click();
 await p.waitForFunction(([k,setKey,status])=>{const a=JSON.parse(localStorage.getItem(k))?.active;return a?.logs?.[setKey]?.status===status&&!a?.drafts?.[setKey]},[key,setKey,status]);
}
async function complete(p){
 while(await p.locator('.setrow[data-status="pending"]').count()){
  const rows=p.locator('.setrow');const count=await rows.count();let index;
  for(let i=0;i<count;i++)if(await rows.nth(i).getAttribute('data-status')==='pending'){index=i;break}
  await saveRow(p,index,index===1?'skipped':'done');
 }
 const id=(await data(p)).active.id;
 await click(p,'#finishSession');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).active===null,key);
 return id;
}
async function test(name,fn){try{await fn();results.push(true);console.log('PASS | HOME_GYM_BROWSER '+name)}catch(e){results.push(false);console.error('FAIL | HOME_GYM_BROWSER '+name+' | '+e.stack)}}
(async()=>{
 await Promise.all([new Promise(r=>server.listen(0,'127.0.0.1',r)),new Promise(r=>foreign.listen(0,'127.0.0.1',r))]);
 app='http://127.0.0.1:'+server.address().port+'/';fv='http://127.0.0.1:'+foreign.address().port+'/';
 try{
 browser=await chromium.launch(launch);console.log('HOME_GYM_BROWSER Chromium '+browser.version()+' | 390x844 | loopback synthetic');
 await test('1/5 all 12 weeks, source-specific prescriptions, movable alternating calendar, no page overflow',async()=>{
  mode='current';const ctx=await browser.newContext(mobile);try{
   const p=await warm(ctx),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));
   assert.equal(await p.locator('.weekdot').count(),12);
   const box=await p.locator('#semana').boundingBox();assert(box.y<500);
   for(let week=1;week<=12;week++){
    await p.locator('#weekSelect').selectOption(String(week));
    assert((await p.locator('#weekHeadline').textContent()).includes('Semana '+week));
    assert.equal(await p.locator('.day.session').count(),2);assert.equal(await p.locator('.day.interval').count(),1);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await p.locator('[data-session="A"]').click();assert.equal(await p.locator('.exercise').count(),5);
    if(week===1)assert((await p.locator('.exercise').last().textContent()).includes('1 series'));
    if(week===6)assert((await p.locator('.exercise').nth(2).textContent()).includes('1 series'));
    await p.locator('[data-session="C"]').click();
    if(week===6)assert((await p.locator('#sessionContent').textContent()).includes('Sin intervalos'));
    if(week===9)assert((await p.locator('#sessionContent').textContent()).includes('6 ciclos de 30 s a RPE 7–8 + 90 s suave'));
   }
   await p.locator('#weekSelect').selectOption('2');assert((await p.locator('.day').first().textContent()).includes('Fuerza B'));
   await p.locator('#weekSelect').selectOption('1');
   await p.locator('#moveDays').locator('..').locator('summary').click();
   await p.locator('[data-move="A"]').selectOption('1');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.calendar?.['1']?.A===1,key);
   await p.reload();await ready(p);assert((await p.locator('.day').nth(1).textContent()).includes('Fuerza A'));
   await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(evidence,'mobile-calendar.png'),fullPage:false});
   assert.deepEqual(pageErrors,[]);
  }finally{await ctx.close()}
 });
 await test('4/5 save, explicit skip, immutable completion, feedback and emergency replacement',async()=>{
  const ctx=await browser.newContext(mobile);try{const p=await warm(ctx);
   await click(p,'#startSession');await p.waitForSelector('.setrow');
   await p.locator('.setrow').first().locator('[data-field="weight"]').fill('25 lb');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.active?.drafts?.['asq:1']?.weight==='25 lb',key);await p.reload();await ready(p);assert.equal(await p.locator('.setrow').first().locator('[data-field="weight"]').inputValue(),'25 lb');assert.equal(await p.locator('#finishSession').isDisabled(),true);
   await saveRow(p,0);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.locator('#sessionTitle').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(evidence,'mobile-session.png'),fullPage:false});
   await p.reload();await ready(p);assert.equal(Object.keys((await data(p)).active.logs).length,1);
   const id=await complete(p),saved=await data(p);assert.equal(saved.history.length,1);assert.equal(saved.history[0].id,id);assert(Object.values(saved.history[0].logs).some(x=>x.status==='skipped'));
   await p.reload();await ready(p);assert.equal((await data(p)).history.length,1);assert((await p.locator('#weeklyCount').textContent()).startsWith('1/3'));
   await p.locator('[data-session="B"]').click();await click(p,'#startEmergency');await p.waitForSelector('.setrow');assert((await data(p)).active.plan.emergency);
   await complete(p);assert.equal((await data(p)).history.length,2);assert.equal(await p.locator('#startSession').count(),0);
   await p.locator('#feedback').fill('<img src=x onerror=alert(1)> synthetic');await click(p,'#saveFeedback');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).feedback.includes('synthetic'),key);
   const downloadPromise=p.waitForEvent('download');await click(p,'#exportProgress');const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path()));assert.equal(exported.programId,'tactical-mass-hybrid-home-gym');assert.equal(JSON.parse(exported.raw).history.length,2);
   const next=await browser.newContext(mobile);try{const q=await warm(next);q.on('dialog',d=>d.accept());await q.locator('#importFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await q.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.history.length===2,key);assert.equal((await data(q)).feedback,JSON.parse(exported.raw).feedback);assert.equal(await q.locator('#feedback img').count(),0)}finally{await next.close()}
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
   await p.evaluate(async()=>{const r=await navigator.serviceWorker.register('./sw.js',{scope:'./'});const w=r.installing;if(w)await new Promise(resolve=>{if(w.state==='redundant')return resolve();w.addEventListener('statechange',()=>{if(w.state==='redundant')resolve()})})});
   assert.notEqual(await p.evaluate(()=>document.documentElement.dataset.offline),'ready');assert.deepEqual(await p.evaluate(()=>caches.keys()),[]);
   mode='current';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(r)await r.update();else await navigator.serviceWorker.register('./sw.js',{scope:'./'})});
   await p.evaluate(()=>navigator.serviceWorker.ready);await p.close();const q=await ctx.newPage();await q.goto(app);await ready(q);await q.waitForFunction(()=>document.documentElement.dataset.offline==='ready');
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
 console.log(`HOME_GYM_BROWSER_TOTAL ${results.filter(Boolean).length}/${results.length} PASS | physical iPhone Safari/Home Screen UNKNOWN`);
 if(results.some(x=>!x))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;server.close();foreign.close()});
