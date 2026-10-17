'use strict';
// Focused M5-01 regression: real UI/engine/durability with synthetic in-memory adapters.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createHash, webcrypto } = require('node:crypto');
const SHA = '54e25199e33b8cc725d86881b950bb68b4cf0cd4';
const html = process.argv.includes('--baseline') ? execFileSync('git', ['show', SHA + ':index.html'], { encoding: 'utf8' }) : require('node:fs').readFileSync('index.html','utf8');
const hash = createHash('sha256').update(html).digest('hex');
if(process.argv.includes('--baseline'))assert.equal(hash, 'cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3');
function part(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, start);
  return html.slice(a, b);
}
async function setup(unit = 'kg') {
  const events = [], elements = new Map();
  function node(key) {
    if (elements.has(key)) return elements.get(key);
    let hidden = false, markup = '';
    const attributes=new Map();
    const result = { value: '', dataset: {}, children: [], textContent: '', scrollTop: 0,
      getBoundingClientRect(){return {top:0};},
      setAttribute(k,v){attributes.set(k,String(v));},getAttribute(k){return attributes.get(k)??null;},focus(){events.push({op:'focus',key});},
      classList: { toggle() {}, contains: () => key === '#sessionOverlay' },
      replaceChildren() { this.children = []; events.push({ op: 'replaceChildren', key }); },
      append(child) { this.children.push(child); },
      get hidden() { return hidden; },
      set hidden(value) { hidden = value; events.push({ op: 'hidden', key, value }); },
      get innerHTML() { return markup; },
      set innerHTML(value) { markup = value; events.push({ op: 'innerHTML', key }); }
    };
    elements.set(key, result); return result;
  }
  const rir = [0, 1, 2, 3].map(n => { const el = node('rir-' + n); el.dataset.rir = String(n); return el; });
  const values = new Map(), mutations = [];
  const storage = { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); mutations.push(['set', key]); },
    removeItem: key => { values.delete(key); mutations.push(['remove', key]); } };
  let tail = Promise.resolve();
  const locks = { request: (_name, _options, callback) => { const next = tail.then(callback); tail = next.catch(() => {}); return next; } };
  const context = { console, crypto: webcrypto, TextEncoder, AbortController, setTimeout, clearTimeout,
    $: node, $$: selector => selector === '[data-rir]' ? rir : [],
    document: { createElement: tag => ({ tag, textContent: '' }) },
    window: { addEventListener() {}, scrollTo: options => events.push({ op: 'window.scrollTo', options }) },
    requestAnimationFrame: callback => callback(),
    exportBackup() {}, retryPersistence() {}, finishSession() {}, openSession() {}, finishEarlySession() {}, discardSession() {},
    currentSessionPreviousSet: () => null, previousSet: () => null,
    loadMemoryInsight: () => ({ loadKg: 0 }), progressionInsight: () => ({ status: 'baseline', reason: 'synthetic' }),
    rankCoreWorkoutsFromHistory: () => [{ key: 'back', reasons: [] }], workoutStatus: () => ({ cls: 'due', label: 'DUE' }),
    todayAvoidedWorkouts: () => [], todayPreset: 'full', recommendationReasonsMarkup: () => '',
    weeklySnapshotMarkup: () => '<div>synthetic unchanged weekly snapshot</div>',
    renderStage: () => events.push({ op: 'renderStage-stub' }), scrollSessionTop: reason => events.push({ op: 'scrollSessionTop-stub', reason }),
    startTicker: () => events.push({ op: 'startTicker-stub' }),
    videoLinkMarkup: () => '', tempoMarkup: () => '', nextPreviewMarkup: () => '', fmtTime: () => '01:00',
    diagnostics() {}, renderProgram: () => events.push({ op: 'renderProgram-stub' }), renderProgress: () => events.push({ op: 'renderProgress-stub' }),
    alert: message => events.push({ op: 'alert', message }) };
  vm.createContext(context);
  vm.runInContext(part('const WORKOUTS =', "const RELEASE='") + html.match(/const RELEASE='[^']+';/)[0] + "\n" +
    part('// DATA DURABILITY CORE START', '// DATA DURABILITY CORE END'), context);
  context.__durability = context.createDurability(storage, locks, vm.runInContext('WORKOUTS', context));
  vm.runInContext('const durability=__durability;\n' +
    part('const persistence={', 'async function retryPersistence(') +
    part('const escapeStoredText=', 'async function setUnit(') +
    part('function makeSession(', 'function totalSets(') +
    part('function draftFor(', 'function nextPreviewMarkup(') +
    part('function renderTodayDecision(', 'function renderHome(') +
    part('function renderHome(){', "$$('.bottom button').forEach") +
    part('function showPage(', 'function routineReviewInsight(') +
    part('function renderSet(', 'function skippedLog(') +
    part('function completeSet(', 'function renderTransition('), context);
  const a = context.makeSession('chest'); a.state = 'set';
  values.set('fv4.history', '[]'); values.set('fv4.active', JSON.stringify(a));
  values.set('fv4.unit', JSON.stringify(unit)); values.set('fv4.migrated', 'true');
  assert((await context.__durability.bindState(a, unit)).ok);
  vm.runInContext('persistence.ready=true;', context); context.__active = a; context.__unit = unit;
  vm.runInContext('unit=__unit;persistence.memory=__active;', context);
  const seq = vm.runInContext('sessionSequence(__active,WORKOUTS.chest)', context), item = seq[0], workout = vm.runInContext('WORKOUTS.chest', context);
  context.renderSet(a, workout, seq, item);
  await vm.runInContext('pendingActive', context);
  const weight = node('#wInput'), reps = node('#rInput');
  weight.value = node('#sessionStage').innerHTML.match(/id="wInput"[^>]*value="([^"]*)"/)[1];
  reps.value = String(a.drafts['0_0'].reps);
  events.length = 0; mutations.length = 0;
  const ui = () => vm.runInContext('({message:persistence.message,activeFailure:persistence.failures["fv4.active"]?.status||null,storeOK:store.ok})', context);
  const panels = () => ['#storageRecovery', '#completionRecovery'].map(key => ({ key, hidden: node(key).hidden, children: node(key).children.length }));
  return { context, a, values, mutations, events, weight, reps, rir, node, ui, panels };
}

(async()=>{
 const results=[];
 async function test(name,fn){try{await fn();results.push(true);console.log('PASS | M5_LOAD '+name)}catch(e){results.push(false);console.log('FAIL | M5_LOAD '+name+' | '+e.message.split('\n')[0])}}
 for(const raw of ['', '0', '-1', 'bad', '20junk', 'NaN', 'Infinity', '1e309'])await test('reject '+JSON.stringify(raw)+' without session/save mutation',async()=>{
  const x=await setup();x.weight.value=raw;x.weight.oninput();x.reps.value='8';x.reps.oninput();await vm.runInContext('pendingActive',x.context);
  const before=JSON.stringify(x.a),writes=x.mutations.length;x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);
  console.log('M5_LOAD_OBSERVATION '+JSON.stringify({raw,indexBefore:JSON.parse(before).index,indexAfter:x.a.index,weightKg:x.a.logs['0_0']?.weightKg??null,completionWrites:x.mutations.length-writes}));assert.equal(JSON.stringify(x.a),before);assert.equal(x.mutations.length,writes);assert.equal(x.node('#weightError').hidden,false);assert(x.node('#weightError').textContent);assert.equal(x.weight.getAttribute('aria-invalid'),'true');
 });
 await test('cleared positive stays unconfirmed through reps/RIR/unit rerender',async()=>{
  const x=await setup();x.weight.value='20';x.weight.oninput();await vm.runInContext('pendingActive',x.context);x.weight.value='';x.weight.oninput();x.reps.value='8';x.reps.oninput();x.rir[1].onclick();await vm.runInContext('pendingActive',x.context);
  vm.runInContext("unit='lb';renderSet(__active,WORKOUTS.chest,sessionSequence(__active,WORKOUTS.chest),sessionSequence(__active,WORKOUTS.chest)[0]);",x.context);
  assert.match(x.node('#sessionStage').innerHTML,/id="wInput"[^>]*value=""/);const before=JSON.stringify(x.a);x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);assert.equal(JSON.stringify(x.a),before);
 });
 await test('old zero requires explicit choice and explicit zero remains numeric',async()=>{
  const x=await setup();x.reps.value='8';x.reps.oninput();await vm.runInContext('pendingActive',x.context);const before=JSON.stringify(x.a);x.node('#completeSet').onclick();assert.equal(JSON.stringify(x.a),before);
  x.node('#wZero').onclick();await vm.runInContext('pendingActive',x.context);x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);
  const a=JSON.parse(x.values.get('fv4.active'));assert.equal(a.logs['0_0'].weightKg,0);assert.equal(a.logs['0_0'].done,true);assert.equal(a.index,1);assert(!JSON.stringify(a).includes('zeroConfirmed'));
 });
 for(const [unit,raw,kg]of [['kg','20.5',20.5],['lb','10',4.5359237],['kg','20,5',20.5]])await test('positive '+unit+' '+raw+' is saved accurately',async()=>{
  const x=await setup(unit);x.weight.value=raw;x.weight.oninput();x.reps.value='8';x.reps.oninput();await vm.runInContext('pendingActive',x.context);x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);
  const a=JSON.parse(x.values.get('fv4.active'));assert(Math.abs(a.logs['0_0'].weightKg-kg)<1e-10);assert.equal(a.index,1);
 });
 await test('reps and RIR edits never replace prior valid load with coerced zero',async()=>{
  const x=await setup();x.weight.value='30';x.weight.oninput();await vm.runInContext('pendingActive',x.context);x.weight.value='bad';x.weight.oninput();x.reps.value='9';x.reps.oninput();x.rir[3].onclick();await vm.runInContext('pendingActive',x.context);assert.equal(x.a.drafts['0_0'].weightKg,30);assert.equal(JSON.parse(x.values.get('fv4.active')).drafts['0_0'].weightKg,30);
 });
 await test('literal numeric zero never implicitly confirms on render',async()=>{
  const x=await setup();x.a.drafts['0_0'].weightKg=0;vm.runInContext('renderSet(__active,WORKOUTS.chest,sessionSequence(__active,WORKOUTS.chest),sessionSequence(__active,WORKOUTS.chest)[0]);',x.context);x.weight.value='0';x.reps.value='8';x.reps.oninput();await vm.runInContext('pendingActive',x.context);const before=JSON.stringify(x.a);x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);assert.equal(JSON.stringify(x.a),before);
 });
 await test('unit-only rerender preserves exact positive load without display-rounding drift',async()=>{
  const x=await setup();x.weight.value='20.123';x.weight.oninput();await vm.runInContext('pendingActive',x.context);
  vm.runInContext("unit='lb';renderSet(__active,WORKOUTS.chest,sessionSequence(__active,WORKOUTS.chest),sessionSequence(__active,WORKOUTS.chest)[0]);",x.context);
  x.weight.value=x.node('#sessionStage').innerHTML.match(/id="wInput"[^>]*value="([^"]*)"/)[1];x.node('#completeSet').onclick();await vm.runInContext('pendingActive',x.context);assert.equal(JSON.parse(x.values.get('fv4.active')).logs['0_0'].weightKg,20.123);
 });
 console.log('M5_LOAD_TOTAL '+results.filter(Boolean).length+'/'+results.length+' PASS | HTML_SHA256 '+hash);if(results.some(x=>!x))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
