'use strict';
// Disposable loopback only; never navigates to owner/production profiles or remote preview.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/storage/mixed-backup.json','utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const server=http.createServer((req,res)=>{try{const path=new URL(req.url,'http://loopback').pathname;const file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error('path');res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file))}catch(_){res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 let browser;const results=[];
 try{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});console.log('M5_BROWSER '+browser.version());
 async function open({weight=0,unit='kg',empty=false}={}){
  const data=copy(fixture);data.unit=unit;if(empty){data.history=[];data.active=null}else{data.active.state='set';data.active.endsAt=0;data.active.drafts['0_1'].weightKg=weight}
  const ctx=await browser.newContext({viewport:{width:390,height:844}});ctx.setDefaultTimeout(10000);
  await ctx.addInitScript(data=>{if(!localStorage.getItem('__m5Seed')){for(const[k,v]of Object.entries({'fv4.history':data.history,'fv4.active':data.active,'fv4.unit':data.unit,'fv4.migrated':true}))localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('__m5Seed','true')}},data);
  const p=await ctx.newPage();p.on('dialog',d=>d.accept());const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>persistence.ready&&!persistence.busy);if(!empty){await p.locator('#resumeBtn').click();await p.evaluate(()=>pendingActive)}return {ctx,p,data,errors};
 }
 async function test(name,fn){try{await fn();results.push(true);console.log('PASS | M5_BROWSER '+name)}catch(e){results.push(false);console.log('FAIL | M5_BROWSER '+name+' | '+e.message)}}
 if(process.argv.includes('--flicker-probe')){
  const {ctx,p}=await open({weight:20});try{
   const trace=await p.evaluate(async()=>{
    const sample=label=>({label,top:document.querySelector('#sessionStage').getBoundingClientRect().top,recoveryHidden:document.querySelector('#completionRecovery').hidden,scroll:document.querySelector('#sessionOverlay').scrollTop});
    const rows=[sample('before')];document.querySelector('#wPlus').click();rows.push(sample('sync-after-tap'));await new Promise(requestAnimationFrame);rows.push(sample('next-frame'));await pendingActive;rows.push(sample('verified-save'));return rows;
   });console.log('M5_02_BOUNDED_RENDER_TRACE '+JSON.stringify(trace));console.log('M5_02 UNKNOWN: DOM/layout transition is observable; no physical iPhone screen-wide flicker, paint trace or matched device recording established. Runtime presentation/blur/persistence unchanged.');
  }finally{await ctx.close()}return;
 }
 await test('empty/cleared/typed-zero/invalid load rejects with identical RAM, disk and index',async()=>{
  const {ctx,p,errors}=await open();try{
   for(const raw of ['', '0', '-1', 'bad', '20junk', 'NaN', 'Infinity']){
    await p.locator('#wInput').fill(raw);await p.locator('#rInput').fill('8');await p.evaluate(()=>pendingActive);
    const before=await p.evaluate(()=>({ram:JSON.stringify(active()),disk:localStorage.getItem('fv4.active')}));await p.locator('#completeSet').click();await p.evaluate(()=>pendingActive);
    assert.deepEqual(await p.evaluate(()=>({ram:JSON.stringify(active()),disk:localStorage.getItem('fv4.active')})),before);assert(await p.locator('#weightError').isVisible());assert.equal(await p.locator('#wInput').getAttribute('aria-invalid'),'true');assert.equal(await p.evaluate(()=>document.activeElement.id),'wInput');
   }assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
 await test('explicit zero requires reconfirmation after reload and round-trips completed history',async()=>{
  const {ctx,p,data}=await open();let restored;try{
   await p.locator('#wZero').click();await p.evaluate(()=>pendingActive);await p.reload();await p.waitForFunction(()=>persistence.ready&&!persistence.busy);await p.locator('#resumeBtn').click();await p.evaluate(()=>pendingActive);
   assert.equal(await p.locator('#wZero').getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#wInput').inputValue(),'');const before=await p.evaluate(()=>JSON.stringify(active()));await p.locator('#completeSet').click();assert.equal(await p.evaluate(()=>JSON.stringify(active())),before);
   await p.locator('#wZero').click();await p.locator('#completeSet').click();await p.evaluate(()=>pendingActive);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active')).logs['0_1'].weightKg),0);
   await p.evaluate(()=>finishSession(active()));assert.equal(await p.evaluate(()=>history().at(-1).sets.find(s=>s.setIndex===1).weightKg),0);assert.deepEqual(await p.evaluate(()=>history().slice(0,3)),data.history);
   const exported=await p.evaluate(()=>durability.exportData());assert(exported.ok);const backup=JSON.parse(exported.text);restored=await open({empty:true});await restored.p.locator('#importFile').setInputFiles({name:'synthetic-m5.json',mimeType:'application/json',buffer:Buffer.from(exported.text)});await restored.p.waitForFunction(()=>!document.querySelector('#importFile').value&&!persistence.busy);await restored.p.reload();await restored.p.waitForFunction(()=>persistence.ready&&!persistence.busy);const again=await restored.p.evaluate(()=>durability.exportData());assert(again.ok);assert.deepEqual(JSON.parse(again.text).history,backup.history);assert.deepEqual(JSON.parse(again.text).active,backup.active);assert.equal(JSON.parse(again.text).unit,backup.unit);
  }finally{await ctx.close();if(restored)await restored.ctx.close()}
 });
 await test('cleared load remains invalid through RIR/reps and unit rerender',async()=>{
  const {ctx,p}=await open({weight:20});try{await p.locator('#wInput').fill('');await p.locator('#rInput').fill('9');await p.locator('[data-rir="2"]').click();await p.evaluate(()=>pendingActive);await p.locator('#sessionOverlay [data-unit="lb"]').click();await p.waitForFunction(()=>!persistence.pendingUnit);assert.equal(await p.locator('#wInput').inputValue(),'');const before=await p.evaluate(()=>JSON.stringify(active()));await p.locator('#completeSet').click();assert.equal(await p.evaluate(()=>JSON.stringify(active())),before)}finally{await ctx.close()}
 });
 for(const[unit,raw,kg]of [['kg','20.123',20.123],['lb','10',4.5359237],['kg','20,5',20.5]])await test('positive '+unit+' '+raw+' persists without conversion loss',async()=>{
  const {ctx,p}=await open({unit});try{await p.locator('#wInput').fill(raw);await p.evaluate(()=>pendingActive);if(unit==='kg'&&raw==='20.123'){await p.locator('#sessionOverlay [data-unit="lb"]').click();await p.waitForFunction(()=>!persistence.pendingUnit)}await p.locator('#completeSet').click();await p.evaluate(()=>pendingActive);assert(Math.abs(await p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active')).logs['0_1'].weightKg)-kg)<1e-10);await p.reload();await p.waitForFunction(()=>persistence.ready&&!persistence.busy);assert(Math.abs(await p.evaluate(()=>active().logs['0_1'].weightKg)-kg)<1e-10)}finally{await ctx.close()}
 });
 await test('skip remains independent of missing load',async()=>{
  const {ctx,p}=await open();try{await p.locator('#skipAction').click();await p.locator('#skipOneSet').click();await p.evaluate(()=>pendingActive);const log=await p.evaluate(()=>active().logs['0_1']);assert.equal(log.skipped,true);assert.equal(log.done,false);assert.equal(log.weightKg,0)}finally{await ctx.close()}
 });
 console.log('M5_BROWSER_TOTAL '+results.filter(Boolean).length+'/'+results.length+' PASS');if(results.some(x=>!x))process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
