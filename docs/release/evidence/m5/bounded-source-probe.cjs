'use strict';
// Read-only source probe. All state/DOM/locks below are synthetic, in memory.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createHash, webcrypto } = require('node:crypto');
const SHA = '54e25199e33b8cc725d86881b950bb68b4cf0cd4';
const html = execFileSync('git', ['show', SHA + ':index.html'], { encoding: 'utf8' });
const hash = createHash('sha256').update(html).digest('hex');
assert.equal(hash, 'cc3284cb5eaf41778e0f8fcda86352cf85ab1d41b816d57f7e9e0ad7efbad5b3');
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
    const result = { value: '', dataset: {}, children: [], textContent: '',
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
  vm.runInContext(part('const WORKOUTS =', "const RELEASE='") + "const RELEASE='4.0.0-rc6.2.1';\n" +
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
(async () => {
  const inputCases = [];
  for (const [name, input] of [['empty', ''], ['cleared-positive', ''], ['explicit-zero-control', '0'], ['positive-control', '20']]) {
    const x = await setup();
    if (name === 'cleared-positive') { x.weight.value = '20'; x.weight.oninput(); await vm.runInContext('pendingActive', x.context); }
    x.weight.value = input; x.reps.value = '8'; x.reps.oninput();
    await vm.runInContext('pendingActive', x.context);
    const beforeIndex = x.a.index;
    x.node('#completeSet').onclick();
    const saved = await vm.runInContext('pendingActive', x.context);
    const persisted = JSON.parse(x.values.get('fv4.active'));
    const result = { name, visibleInput: input, indexBefore: beforeIndex, indexAfter: persisted.index,
      stateAfter: persisted.state, saved: saved.ok, done: persisted.logs['0_0'].done,
      weightKg: persisted.logs['0_0'].weightKg, weightType: typeof persisted.logs['0_0'].weightKg,
      reps: persisted.logs['0_0'].reps, alertCount: x.events.filter(e => e.op === 'alert').length };
    assert.equal(result.saved, true); assert.equal(result.done, true); assert.equal(result.indexAfter, beforeIndex + 1);
    assert.equal(result.weightKg, name === 'positive-control' ? 20 : 0);
    assert.equal(result.alertCount, 0); inputCases.push(result);
  }
  const churnCases = [];
  for (const action of ['weight-plus', 'reps-plus', 'RIR-2']) {
    const x = await setup(); x.weight.value = '20';
    if (action === 'weight-plus') x.node('#wPlus').onclick();
    if (action === 'reps-plus') x.node('#rPlus').onclick();
    if (action === 'RIR-2') x.rir[2].onclick();
    const pending = { ui: x.ui(), panels: x.panels(), events: [...x.events] };
    const result = await vm.runInContext('pendingActive', x.context);
    const resolved = { ui: x.ui(), panels: x.panels(), events: [...x.events] };
    assert(pending.panels.every(p => !p.hidden && p.children === 3));
    assert.equal(pending.ui.activeFailure, 'pending');
    assert(resolved.panels.every(p => p.hidden && p.children === 0));
    assert.equal(result.ok, true);
    assert.equal(pending.events.filter(e => e.op === 'innerHTML' && ['#todayDecision', '#weekSnapshot'].includes(e.key)).length, 2);
    assert.equal(pending.events.filter(e => e.op === 'renderStage-stub').length, 0);
    churnCases.push({ action, overlayOpen: true, pending, resolved, saveOK: result.ok });
  }
  const nav = await setup(); nav.context.showPage('today');
  const navEvents = [...nav.events];
  assert.equal(navEvents.filter(e => e.op === 'window.scrollTo').length, 1);
  assert.equal(nav.ui().activeFailure, null);
  console.log(JSON.stringify({ sourceCommit: SHA, indexSHA256: hash, sourceUnmodified: true,
    method: 'Exact candidate engine, durability core, draft/renderSet/completeSet, persistence UI, Today rendering and showPage functions executed in Node vm; only synthetic in-memory storage and instrumented DOM adapters. No server/browser/iPhone, real profile or deployed asset accessed.',
    limitations: ['DOM adapters are not a layout/paint engine.', 'No iPhone flicker or frame timing reproduced.', 'Auxiliary recommendation/formatting, stage transition render/scroll/ticker, and optional DOM nodes are stubbed.', 'Navigation was invoked while Today was already current; no visual outcome inferred.'],
    m501: inputCases, m502: { saveDrivenDOMChurn: churnCases, samePageNavigationControl: { events: navEvents, ui: nav.ui() }, physicalRootCause: 'UNKNOWN' } }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
