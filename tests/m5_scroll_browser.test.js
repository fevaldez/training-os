'use strict';
// Existing Playwright/loopback infrastructure; disposable synthetic storage only.
const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE='c23f7cdd21b895c0aed3a6da49ea02da27d25aad',baseline=process.argv.includes('--baseline');
const html=baseline?execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8'}):fs.readFileSync('index.html','utf8');
// Only the two presentation routines and five exact release markers may differ from the pin.
let preserved=baseline?html:require('./superset_skip_scope.cjs').restore(html);const originalSource=execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8'});
const originalRelease=originalSource.match(/const RELEASE='([^']+)'/)[1];
const release=baseline?originalRelease:JSON.parse(fs.readFileSync('version.json','utf8')).release;
assert.equal(html.match(/const RELEASE='([^']+)'/)[1],release,'candidate release marker differs from metadata');
assert.equal(originalSource.split(originalRelease).length-1,5,'pinned metadata-site inventory changed');
const original=originalSource.replaceAll(originalRelease,release);
for(const[start,end]of [['function renderRecovery(){','let pendingActive='],['function showPage(id){','function routineReviewInsight(']]){const a=preserved.indexOf(start),b=preserved.indexOf(end,a),oa=original.indexOf(start),ob=original.indexOf(end,oa);assert(a>=0&&b>a&&oa>=0&&ob>oa);preserved=preserved.slice(0,a)+original.slice(oa,ob)+preserved.slice(b)}
assert.equal(preserved,original,'unexpected runtime change outside recovery presentation/navigation');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/storage/mixed-backup.json','utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const server=http.createServer((req,res)=>{try{const path=new URL(req.url,'http://loopback').pathname;if(path==='/'||path==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html)}else{if(path.includes('..'))throw Error('path');res.end(fs.readFileSync('.'+path))}}catch(_){res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;let browser;const results=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  console.log('M5_PRESERVATION all production bytes outside renderRecovery/showPage match '+BASE);
  console.log('M5_SCROLL_BROWSER '+browser.version()+' | '+(baseline?BASE:'CURRENT')+' | HTML_SHA256 '+createHash('sha256').update(html).digest('hex'));
  async function open(){
   const data=copy(fixture);data.active.state='set';data.active.endsAt=0;data.active.drafts['0_1'].weightKg=20;
   const ctx=await browser.newContext({viewport:{width:390,height:844}});ctx.setDefaultTimeout(10000);
   await ctx.addInitScript(data=>{for(const[k,v]of Object.entries({'fv4.history':data.history,'fv4.active':data.active,'fv4.unit':data.unit,'fv4.migrated':true}))localStorage.setItem(k,JSON.stringify(v));const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__failActive&&k==='fv4.active')throw Error('synthetic active write failure');return set.call(this,k,v)}},data);
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto(url);await p.waitForFunction(()=>persistence.ready&&!persistence.busy);
   await p.evaluate(()=>{
    window.__scrolls=[];const scroll=window.scrollTo.bind(window);window.scrollTo=(...args)=>{window.__scrolls.push(args);return scroll(...args)};
    window.__sample=label=>{const o=document.querySelector('#sessionOverlay'),s=document.querySelector('#sessionStage'),r=s.getBoundingClientRect(),v=window.visualViewport;return {label,windowY:window.scrollY,viewport:v?{top:v.offsetTop,pageTop:v.pageTop,height:v.height}:null,overlay:o.scrollTop,focus:document.activeElement.id,stage:{top:r.top,left:r.left,width:r.width,height:r.height},recoveryHidden:document.querySelector('#completionRecovery').hidden,recoveryText:document.querySelector('#completionRecovery').textContent,active:localStorage.getItem('fv4.active'),ram:JSON.stringify(active())}};
    window.__frames=async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)};
   });
   return {ctx,p,errors,data};
  }
  async function session(x){await x.p.locator('#resumeBtn').click();await x.p.evaluate(async()=>{await pendingActive;await __frames()})}
  async function test(name,fn){try{await fn();results.push(true);console.log('PASS | M5_SCROLL '+name)}catch(e){results.push(false);console.log('FAIL | M5_SCROLL '+name+' | '+e.message.split('\n')[0])}}
  // Interaction receipts are the contract. Render observations remain diagnostic, not a count gate.
  const pointerSteps=[
   {label:'initial:wPlus',selector:'#wPlus',weight:'49',kg:49*0.45359237,reps:9,rir:3,zero:false},
   {label:'initial:wMinus',selector:'#wMinus',weight:'44',kg:44*0.45359237,reps:9,rir:3,zero:false},
   {label:'initial:rPlus',selector:'#rPlus',weight:'44',kg:44*0.45359237,reps:10,rir:3,zero:false},
   {label:'initial:rMinus',selector:'#rMinus',weight:'44',kg:44*0.45359237,reps:9,rir:3,zero:false},
   {label:'initial:wZero',selector:'#wZero',weight:'0',kg:0,reps:9,rir:3,zero:true},
   {label:'initial:rir2',selector:'[data-rir="2"]',weight:'0',kg:0,reps:9,rir:2,zero:true},
   {label:'input:weight',selector:'#wInput',fill:'27.5',weight:'27.5',kg:27.5*0.45359237,reps:9,rir:2,zero:false},
   {label:'input:reps',selector:'#rInput',fill:'12',weight:'27.5',kg:27.5*0.45359237,reps:12,rir:2,zero:false},
   {label:'rapid:wPlus',selector:'#wPlus',weight:'32.5',kg:32.5*0.45359237,reps:12,rir:2,zero:false},
   {label:'rapid:rPlus',selector:'#rPlus',weight:'32.5',kg:32.5*0.45359237,reps:13,rir:2,zero:false},
   {label:'rapid:rir1',selector:'[data-rir="1"]',weight:'32.5',kg:32.5*0.45359237,reps:13,rir:1,zero:false}
  ];
  function expectedSession(initial,step,actual){
   assert.equal(typeof actual.updatedAt,'string',step.label+' updatedAt');assert(Number.isFinite(Date.parse(actual.updatedAt)),step.label+' updatedAt');
   const expected=copy(initial);expected.updatedAt=actual.updatedAt;
   Object.assign(expected.drafts['0_1'],{weightKg:step.kg,reps:step.reps,rir:step.rir});return expected;
  }
  function checkStep(initial,step,sample,receipt){
   assert.equal(sample.weight,step.weight,step.label+' UI weight');assert.equal(sample.reps,String(step.reps),step.label+' UI reps');
   assert.equal(sample.rir,String(step.rir),step.label+' UI RIR');assert.equal(sample.zero,String(step.zero),step.label+' explicit zero');
   assert.deepEqual(sample.session,expectedSession(initial,step,sample.session),step.label+' RAM active');
   assert.equal(receipt.ok,true,step.label+' verified save');assert.equal(receipt.status,'verified',step.label+' verified save');
   assert.deepEqual(JSON.parse(receipt.raw),sample.session,step.label+' persisted write receipt');
  }
  async function pointerContract(x,control={}){
   await session(x);
   const initial=await x.p.evaluate(control=>{
    window.__contractControl=control;window.__contractAction='';window.__recoveryTrace=[];window.__anchorFailures=[];window.__renderCalls=0;window.__renderBatch=null;window.__controlInjected=false;
    window.__contractSample=()=>{const e=document.activeElement;return {...__sample('contract'),focusToken:e.id||e.getAttribute('data-rir')||e.tagName,weight:document.querySelector('#wInput').value,reps:document.querySelector('#rInput').value,rir:document.querySelector('[data-rir].active')?.dataset.rir,zero:document.querySelector('#wZero').getAttribute('aria-pressed'),session:JSON.parse(JSON.stringify(active()))}};
    // A legal batched observer delivers once per completed interaction/task group.
    // Every real render still runs and every anchor/focus comparison is retained, even within a batch.
    window.__flushRenderBatch=()=>{if(__renderBatch){__recoveryTrace.push(__renderBatch);__renderBatch=null}};
    const render=renderRecovery;renderRecovery=()=>{
     const before=__contractSample();render();
     if(!__controlInjected&&control.anchor){__controlInjected=true;if(control.anchor==='scroll')document.querySelector('#sessionStage').style.transform='translateY(3px)';else document.querySelector('#closeSession').focus({preventScroll:true})}
     const after=__contractSample(),row={before,after};__renderCalls++;
     if(Math.abs(after.stage.top-before.stage.top)>=1||after.focusToken!==before.focusToken)__anchorFailures.push(row);
     if(control.batch)__renderBatch=row;else __recoveryTrace.push(row);
    };
    // Deliberate faults are confined to this disposable page; no application bytes change.
    for(const type of ['click','input'])document.addEventListener(type,event=>{if(control.drop&&__contractAction===control.drop){event.preventDefault();event.stopImmediatePropagation()}},true);
    return {sample:__contractSample(),unit,history:localStorage.getItem('fv4.history')};
   },control);
   assert.equal(initial.unit,'lb');assert.equal(initial.sample.weight,'44');assert.deepEqual(initial.sample.session.drafts['0_1'],{...x.data.active.drafts['0_1'],weightKg:20});
   const checkpoints=[];
   for(const step of pointerSteps.slice(0,8)){
    await x.p.evaluate(label=>{__contractAction=label},step.label);
    if(step.fill!==undefined)await x.p.locator(step.selector).fill(step.fill);else await x.p.locator(step.selector).click();
    const result=await x.p.evaluate(async()=>{const receipt=await pendingActive;await __frames();__flushRenderBatch();return {sample:__contractSample(),receipt}});
    checkStep(initial.sample.session,step,result.sample,result.receipt);assert.equal(result.sample.active,result.sample.ram,step.label+' disk/RAM');checkpoints.push({label:step.label,draft:result.sample.session.drafts['0_1']});
   }
   // No await between these dispatches: all three snapshots must independently reach verified storage.
   const queued=await x.p.evaluate(async steps=>{
    const pending=[],samples=[];
    for(const step of steps){__contractAction=step.label;document.querySelector(step.selector).click();samples.push(__contractSample());pending.push(pendingActive)}
    const receipts=await Promise.all(pending);await __frames();__flushRenderBatch();return {samples,receipts};
   },pointerSteps.slice(8));
   for(let i=0;i<3;i++){const step=pointerSteps[8+i];checkStep(initial.sample.session,step,queued.samples[i],queued.receipts[i]);checkpoints.push({label:step.label,draft:queued.samples[i].session.drafts['0_1']})}
   const final=await x.p.evaluate(control=>{
    if(control.persist){const a=JSON.parse(localStorage.getItem('fv4.active'));if(control.persist==='session')a.id='synthetic-wrong-session';else a.drafts['0_1'][control.persist]+=1;localStorage.setItem('fv4.active',JSON.stringify(a))}
    return {sample:__contractSample(),rows:__recoveryTrace,anchorFailures:__anchorFailures,renderCalls:__renderCalls,history:localStorage.getItem('fv4.history')};
   },control);
   const last=pointerSteps.at(-1);checkStep(initial.sample.session,last,final.sample,queued.receipts.at(-1));
   assert.equal(final.sample.active,final.sample.ram,'final persisted active must equal RAM');
   assert.deepEqual(JSON.parse(final.sample.active),expectedSession(initial.sample.session,last,JSON.parse(final.sample.active)),'final persisted active state');
   assert.equal(final.history,initial.history,'history bytes unchanged');assert.deepEqual(JSON.parse(final.history),x.data.history);
   assert.equal(final.anchorFailures.length,0,'unexpected scroll/focus change during render');
   assert(final.renderCalls>0,'recovery render instrumentation must execute');
   for(const{before,after}of final.rows){assert(Math.abs(after.stage.top-before.stage.top)<1,'render scroll anchor');assert.equal(after.focusToken,before.focusToken,'render focus')}
   assert(final.sample.recoveryHidden,'verified recovery state');assert.deepEqual(x.errors,[]);
   return {checkpoints,renderCalls:final.renderCalls,observations:final.rows.length,rows:final.rows.map(({before:b,after:a})=>({stageDelta:a.stage.top-b.stage.top,overlayDelta:a.overlay-b.overlay,focusBefore:b.focusToken,focusAfter:a.focusToken,pending:!a.recoveryHidden,diskMatchesRAM:a.active===a.ram}))};
  }
  if(process.argv.includes('--negative-controls')){
   let passed=0;
   const x=await open();try{const t=await pointerContract(x,{batch:true});assert.equal(t.observations,9,'one delivered observation per six buttons, two inputs and queued task');assert(t.renderCalls>t.observations);console.log('PASS | M5_CONTROL A batched observer delivery: '+t.observations+' observations, '+t.renderCalls+' renders, 11 verified interactions; no inference about prior CI batching');passed++}finally{await x.ctx.close()}
   const controls=[
    ...['initial:wPlus','rapid:wPlus','rapid:rPlus','rapid:rir1'].map(drop=>({name:'B dropped '+drop,control:{drop},error:new RegExp(drop+' (UI|RAM)')})),
    ...['weightKg','reps','rir','session'].map(persist=>({name:'C wrong persisted '+persist,control:{persist},error:/final persisted active/})),
    ...['scroll','focus'].map(anchor=>({name:'D unexpected '+anchor,control:{anchor},error:/unexpected scroll\/focus change/}))
   ];
   for(const c of controls){const x=await open();try{await assert.rejects(()=>pointerContract(x,c.control),c.error);console.log('PASS | M5_CONTROL '+c.name+' rejected');passed++}finally{await x.ctx.close()}}
   console.log('M5_CONTROL_TOTAL '+passed+'/11 PASS');return;
  }
  await test('same active tab preserves viewport, focused DOM and stored session on all three pages',async()=>{
   const x=await open();try{for(const id of ['today','program','progress']){
    const trace=await x.p.evaluate(async id=>{showPage(id);await __frames();window.scrollTo(0,350);const el=document.querySelector('#'+id+' button');el.focus({preventScroll:true});const before={y:scrollY,focus:el,active:localStorage.getItem('fv4.active')},calls=__scrolls.length;document.querySelector('[data-page="'+id+'"]').click();await __frames();return {id,before:before.y,after:scrollY,focusPreserved:document.activeElement===before.focus&&before.focus.isConnected,scrollCalls:__scrolls.length-calls,activePreserved:before.active===localStorage.getItem('fv4.active')}} ,id);
    console.log('M5_NAV_TRACE '+JSON.stringify(trace));assert(trace.before>0);assert.equal(trace.after,trace.before);assert(trace.focusPreserved);assert.equal(trace.scrollCalls,0);assert(trace.activePreserved);
   }assert.deepEqual(x.errors,[])}finally{await x.ctx.close()}
  });
  await test('legitimate page transitions retain one intentional viewport top scroll',async()=>{
   const x=await open();try{for(const id of ['program','progress','today']){const t=await x.p.evaluate(async id=>{window.scrollTo(0,300);const calls=__scrolls.length;document.querySelector('[data-page="'+id+'"]').click();await __frames();return {id,y:scrollY,calls:__scrolls.length-calls,current:document.querySelector('.page.active').id}},id);assert.equal(t.y,0);assert.equal(t.calls,1);assert.equal(t.current,id)}}finally{await x.ctx.close()}
  });
  for(const selector of ['#wPlus','#rPlus','[data-rir="2"]'])await test('autosave '+selector+' preserves content position and focus through pending→verified',async()=>{
   const x=await open();try{await session(x);for(const offset of [0,240,900]){
    const rows=await x.p.evaluate(async({selector,offset})=>{const o=document.querySelector('#sessionOverlay');o.scrollTop=offset;await __frames();document.querySelector(selector).focus({preventScroll:true});const rows=[__sample('before')];document.querySelector(selector).click();rows.push(__sample('pending'));await pendingActive;rows.push(__sample('verified'));await __frames();rows.push(__sample('paint'));return rows},{selector,offset});
    console.log('M5_AUTOSAVE_TRACE '+JSON.stringify({selector,offset,rows:rows.map(({active:disk,ram,...row})=>({...row,persistedDraft:JSON.parse(disk).drafts['0_1'],diskMatchesRAM:disk===ram}))}));const first=rows[0];assert.equal(rows[1].recoveryHidden,false);assert(rows[1].recoveryText.includes('pending'));for(const r of rows){assert(Math.abs(r.stage.top-first.stage.top)<1,'stage moved '+(r.stage.top-first.stage.top));assert.equal(r.windowY,first.windowY);assert.deepEqual(r.viewport,first.viewport);assert.equal(r.focus,first.focus)}assert.equal(rows.at(-1).overlay,first.overlay);assert(rows.at(-1).recoveryHidden);assert.equal(rows.at(-1).active,rows.at(-1).ram);
   }assert.deepEqual(await x.p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.history'))),x.data.history);assert.deepEqual(x.errors,[])}finally{await x.ctx.close()}
  });
  await test('typing keeps actual input node, focus and viewport while verified drafts persist',async()=>{
   const x=await open();try{await session(x);for(const[id,value]of [['wInput','25.25'],['rInput','11']]){const t=await x.p.evaluate(async({id,value})=>{const e=document.getElementById(id);e.focus();await __frames();const before=__sample('before');e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));const pending=__sample('pending');await pendingActive;await __frames();return {before,pending,after:__sample('verified'),sameNode:document.getElementById(id)===e}},{id,value});assert(t.sameNode);for(const r of [t.pending,t.after]){assert.equal(r.focus,id);assert.equal(r.windowY,t.before.windowY);assert(Math.abs(r.stage.top-t.before.stage.top)<1)}assert.equal(t.after.active,t.after.ram)}}finally{await x.ctx.close()}
  });
  await test('real pointer taps, text input and rapid queued autosaves preserve the focused content anchor',async()=>{
   const x=await open();try{const trace=await pointerContract(x);console.log('M5_INTERACTION_TRACE '+JSON.stringify(trace.checkpoints));console.log('M5_POINTER_TRACE '+JSON.stringify(trace.rows));console.log('M5_POINTER_CONTRACT 6 buttons + 2 inputs + 3 queued interactions verified; '+trace.observations+' render observations (diagnostic only)');}finally{await x.ctx.close()}
  });
  await test('real pending/failure/dirty states retain Retry and Export; retry verifies exact draft',async()=>{
   const x=await open();try{await session(x);await x.p.evaluate(async()=>{window.__held=navigator.locks.request('training-os-data-v1',()=>new Promise(r=>window.__release=r));while(!window.__release)await new Promise(r=>setTimeout(r,0));document.querySelector('#rInput').value='17';document.querySelector('#rInput').dispatchEvent(new Event('input',{bubbles:true}))});
    for(const text of ['Reintentar','Exportar respaldo'])assert(await x.p.locator('#completionRecovery button').filter({hasText:text}).isEnabled());assert((await x.p.evaluate(()=>persistence.message)).includes('pending'));assert.equal(await x.p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active')).drafts['0_1'].reps),9);
    await x.p.evaluate(async()=>{__release();await __held;await pendingActive;window.__failActive=true;document.querySelector('#rInput').value='18';document.querySelector('#rInput').dispatchEvent(new Event('input',{bubbles:true}));await pendingActive});
    assert.equal(await x.p.evaluate(()=>active().drafts['0_1'].reps),18);assert.equal(await x.p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active')).drafts['0_1'].reps),17);assert((await x.p.evaluate(()=>persistence.message)).includes('no sobrevivirán'));assert(await x.p.locator('#completionRecovery').isVisible());
    const download=x.p.waitForEvent('download');await x.p.locator('#completionRecovery button').filter({hasText:'Exportar respaldo'}).click();const backup=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.equal(backup.active.drafts['0_1'].reps,18);
    await x.p.evaluate(()=>window.__failActive=false);await x.p.locator('#completionRecovery button').filter({hasText:'Reintentar'}).click();await x.p.evaluate(()=>pendingActive);assert.equal(await x.p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.active')).drafts['0_1'].reps),18);assert(await x.p.locator('#completionRecovery').isHidden());assert.deepEqual(await x.p.evaluate(()=>JSON.parse(localStorage.getItem('fv4.history'))),x.data.history);assert.deepEqual(x.errors,[]);
   }finally{await x.ctx.close()}
  });
  await test('intentional overlay scroll stays on open, warmup, sets, rest, supersets and exercise transitions',async()=>{
   const x=await open();try{await session(x);
    const traces=await x.p.evaluate(async()=>{
     const rows=[],o=document.querySelector('#sessionOverlay');
     async function action(label,fn){o.scrollTop=250;window.scrollTo(0,150);const calls=__scrolls.length;fn();await pendingActive;await __frames();rows.push({label,overlay:o.scrollTop,y:scrollY,calls:__scrolls.length-calls,state:active().state,index:active().index});}
     await action('open',()=>openSession());
     const a=active();a.state='warmup';renderStage();await action('warmup',()=>document.querySelector('#warmupDone').click());
     let {seq,item}=current(a);const d=draftFor(a,item);d.reps=8;d.weightKg=20;await action('complete-set',()=>completeSet(a,seq,item,WORKOUTS[a.workoutKey].exercises[item.ei],d));
     const ends=a.endsAt;document.querySelector('#plus15').click();await pendingActive;if(a.endsAt!==ends+15000)throw Error('rest timer changed unexpectedly');
     await action('rest-next',()=>document.querySelector('#dockStart').click());
     const pair=seq.findIndex(s=>s.superset&&s.position==='first');if(pair<0)throw Error('synthetic workout lacks superset');a.index=pair;a.state='set';renderStage();({seq,item}=current(a));const paired=draftFor(a,item);paired.reps=8;paired.weightKg=20;await action('superset-complete',()=>completeSet(a,seq,item,WORKOUTS[a.workoutKey].exercises[item.ei],paired));await action('superset-partner',()=>document.querySelector('#goPartner').click());
     const exercise=seq.findIndex((s,i)=>i+1<seq.length&&s.ei!==seq[i+1].ei&&!s.superset);a.index=exercise;a.state='set';renderStage();({seq,item}=current(a));const last=draftFor(a,item);last.reps=8;last.weightKg=20;await action('exercise-complete',()=>completeSet(a,seq,item,WORKOUTS[a.workoutKey].exercises[item.ei],last));await action('next-exercise',()=>document.querySelector('#dockStart').click());return rows;
    });console.log('M5_INTENTIONAL_SCROLL_TRACE '+JSON.stringify(traces));for(const t of traces){assert.equal(t.overlay,0,t.label);assert.equal(t.calls,0,t.label)}assert.deepEqual(x.errors,[]);
   }finally{await x.ctx.close()}
  });
  console.log('M5_SCROLL_TOTAL '+results.filter(Boolean).length+'/'+results.length+' PASS');if(results.some(x=>!x))process.exitCode=1;
  if(!baseline){const child=require('node:child_process').spawn(process.execPath,['tests/superset_skip_browser.test.js'],{env:process.env,stdio:'inherit'});if(await new Promise(r=>child.on('exit',r))!==0)process.exitCode=1;}
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
