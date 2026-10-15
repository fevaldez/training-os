#!/usr/bin/env node
'use strict';
// Local optional browser evidence. Always launches a disposable browser context.
// Usage: PLAYWRIGHT_MODULE=/path/to/playwright node tests/storage_browser.test.js
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/storage/mixed-backup.json','utf8'));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(data=>{
  if(!localStorage.getItem('__syntheticSeeded')){for(const [k,v] of Object.entries({'fv4.history':data.history,'fv4.active':data.active,'fv4.unit':data.unit,'fv4.migrated':true}))localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('__syntheticSeeded','true')}
  window.__syntheticOriginalSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){if(window.__syntheticFailKey===k||window.__syntheticQuota&&k==='fv4.history')throw new DOMException('synthetic quota','QuotaExceededError');return window.__syntheticOriginalSet.call(this,k,v)};
 },fixture);
 const messages=[];page.on('dialog',async d=>{messages.push(d.message());await d.accept()});
 try{
  await page.goto(process.env.DURABILITY_URL||'http://127.0.0.1:8765/');
  await page.waitForFunction(()=>document.querySelector('#storageRecovery').hidden);
  await page.evaluate(()=>showPage('progress'));
  assert.equal(await page.locator('#history img').count(),0);
  assert((await page.locator('#history').innerText()).includes('<img src=x onerror=alert(1)>'));
  console.log('PASS | imported history renders as literal text');
  await page.locator('[data-page="today"]').click();await page.locator('#resumeBtn').click();
  assert.equal(await page.locator('#sessionStage svg').count(),0);
  const before=await page.evaluate(()=>localStorage.getItem('fv4.history'));
  await page.evaluate(()=>{window.__syntheticQuota=true});
  await page.locator('#closeSession').click();await page.locator('#finishEarlyBtn').click();
  await page.waitForFunction(()=>document.querySelector('#storageRecovery').textContent.includes('No se pudo verificar'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('fv4.history')),before);
  assert(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('fv4.active')).completionIntent));
  assert(await page.locator('#storageRecovery button').filter({hasText:'Reintentar'}).isEnabled());
  assert(await page.locator('#storageRecovery button').filter({hasText:'Exportar respaldo'}).isEnabled());
  assert.equal(await page.locator('#today').getAttribute('class'),'page active');
  console.log('PASS | quota failure stays on Today with intent, prior history, visible Retry and Export');
  await page.evaluate(()=>{window.__syntheticQuota=false});
  await page.locator('#storageRecovery button').filter({hasText:'Reintentar'}).click();
  await page.waitForFunction(()=>document.querySelector('#progress').classList.contains('active'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fv4.history')).length),4);
  assert.equal(await page.evaluate(()=>localStorage.getItem('fv4.active')),null);
  console.log('PASS | visible Retry appends once, verifies cleanup and navigates to Progress');
  const downloadPromise=page.waitForEvent('download');await page.locator('#exportBtn').click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'training-os-backup.json');
  const path=await download.path(),backup=JSON.parse(fs.readFileSync(path,'utf8'));assert.equal(backup.schema,6);assert.equal(backup.history.length,4);assert.equal(backup.unit,'lb');assert.equal(backup.active,null);
  console.log('PASS | disposable Chromium emits a parseable download with matching history/unit');
  const initial=await page.evaluate(()=>Object.fromEntries(['fv4.history','fv4.active','fv4.unit','fv4.migrated'].map(k=>[k,localStorage.getItem(k)])));
  const incoming={...fixture,history:[],active:null,unit:'kg'};
  await page.evaluate(()=>{window.__syntheticFailKey='fv4.unit'});
  await page.locator('#importFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
  await page.waitForFunction(()=>document.querySelector('#storageRecovery').textContent.includes('No se pudo verificar'));
  assert(await page.evaluate(()=>!!localStorage.getItem('fv4.recovery.v1')));
  assert(!messages.some(m=>m.startsWith('Importación completa')));
  console.log('PASS | interrupted multi-key import keeps journal and never announces success');
  const rawDownloadPromise=page.waitForEvent('download');await page.locator('#exportBtn').click();const rawDownload=await rawDownloadPromise;
  const recovery=JSON.parse(fs.readFileSync(await rawDownload.path(),'utf8'));assert.equal(recovery.format,'training-os-raw-recovery-v1');assert(recovery.values['fv4.recovery.v1']);
  console.log('PASS | failed import can download exact raw recovery journal');
  await page.reload();await page.waitForFunction(()=>document.querySelector('#storageRecovery').hidden);
  const restored=await page.evaluate(()=>Object.fromEntries(['fv4.history','fv4.active','fv4.unit','fv4.migrated'].map(k=>[k,localStorage.getItem(k)])));
  assert.deepEqual(restored,initial);assert.equal(await page.evaluate(()=>localStorage.getItem('fv4.recovery.v1')),null);
  console.log('PASS | startup automatically rolls interrupted import back to exact prior raw bytes');
  await page.evaluate(()=>showPage('progress'));
  await page.locator('#importFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await page.waitForFunction(()=>document.querySelector('#stats').textContent.startsWith('3 sesiones'));
  assert(messages.some(m=>m.startsWith('Importación completa')));
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active'))),fixture.active);
  console.log('PASS | verified import restores timers, drafts, unit and unknown fields');
  const other=await context.newPage();await other.goto(process.env.DURABILITY_URL||'http://127.0.0.1:8765/');await other.waitForFunction(()=>document.querySelector('#storageRecovery').hidden);
  const result=await Promise.all([page.evaluate(async()=>{const a=JSON.parse(localStorage.getItem('fv4.active'));a.drafts['0_1'].reps=11;return durability.saveActive(a)}),other.evaluate(async()=>{const a=JSON.parse(localStorage.getItem('fv4.active'));a.drafts['0_1'].reps=12;return durability.saveActive(a)})]);
  assert.equal(result.filter(r=>r.ok).length,1);assert.equal(result.find(r=>!r.ok).status,'active-conflict');await other.close();
  console.log('PASS | real same-origin Web Locks serialize two tabs and reject stale active writes');
  assert.deepEqual(errors,[]);
  console.log('TOTAL 9/9 PASS | Chromium 390×844; synthetic context only; physical iPhone remains unverified');
 }finally{await context.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
