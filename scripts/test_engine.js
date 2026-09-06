#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('const WORKOUTS =');
const end = html.indexOf("const RELEASE='");
if (start < 0 || end < 0 || end <= start) {
  console.error('FAIL | could not extract current inline training engine');
  process.exit(1);
}

const core = html.slice(start, end) + `
globalThis.__WORKOUTS = WORKOUTS;
globalThis.__toKg = toKg;
globalThis.__fromKg = fromKg;
globalThis.__explainTempo = explainTempo;
globalThis.__buildSequence = buildSequence;
globalThis.__nextTransition = nextTransition;
globalThis.__remainingSeconds = remainingSeconds;
globalThis.__progressionDecision = progressionDecision;
globalThis.__sessionCompletion = sessionCompletion;
globalThis.__recommendedWorkoutKeyFromHistory = recommendedWorkoutKeyFromHistory;
`;

const context = { console };
vm.createContext(context);
vm.runInContext(core, context);

const WORKOUTS=context.__WORKOUTS;
const toKg=context.__toKg, fromKg=context.__fromKg, explainTempo=context.__explainTempo;
const buildSequence=context.__buildSequence, nextTransition=context.__nextTransition;
const remainingSeconds=context.__remainingSeconds, progressionDecision=context.__progressionDecision;
const sessionCompletion=context.__sessionCompletion;
const recommendedWorkoutKeyFromHistory=context.__recommendedWorkoutKeyFromHistory;

const tests = [];
function test(name, fn) {
  try { fn(); tests.push([name, true]); }
  catch (e) { tests.push([name, false, e.message]); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

test('kg/lb round trip', () => {
  const kg=65, lb=fromKg(kg,'lb');
  assert(Math.abs(toKg(lb,'lb')-kg)<1e-9,'canonical weight drift');
});
test('tempo four phase explanation', () => {
  const x=explainTempo('3-1-X-1');
  assert(x.includes('Excéntrica') && x.includes('explosivo'),'tempo mapping');
});
test('standalone shoulder sequence count', () => {
  assert(buildSequence(WORKOUTS.shoulders).length===10,'shoulder count');
});
test('chest superset alternates A/B', () => {
  const s=buildSequence(WORKOUTS.chest);
  const i=s.findIndex(x=>x.superset);
  assert(i>=0 && s[i].position==='first' && s[i+1].position==='second' && s[i].si===s[i+1].si,'superset order');
});
test('first superset movement has zero-rest partner transition', () => {
  const s=buildSequence(WORKOUTS.chest);
  const i=s.findIndex(x=>x.superset && x.position==='first');
  assert(nextTransition(s,i,WORKOUTS.chest).type==='superset-switch','transition');
});
test('second superset movement starts rest', () => {
  const s=buildSequence(WORKOUTS.chest);
  const i=s.findIndex(x=>x.superset && x.position==='second');
  assert(nextTransition(s,i,WORKOUTS.chest).type==='rest','rest');
});
test('timestamp timer survives elapsed background time mathematically', () => {
  const now=1000000, ends=now+90000;
  assert(remainingSeconds(ends,now+30000)===60,'expected 60');
  assert(remainingSeconds(ends,now+95000)===0,'expected 0');
});
test('progression increases only after complete top-range success', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const d=progressionDecision(e,[{reps:8,rir:2,done:true},{reps:8,rir:3,done:true}]);
  assert(d.factor===1.025,'increase factor');
});
test('progression reduces after miss / RIR 0', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const d=progressionDecision(e,[{reps:4,rir:0,done:true},{reps:6,rir:1,done:true}]);
  assert(d.factor===0.975,'reduction factor');
});
test('progression maintains otherwise', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const d=progressionDecision(e,[{reps:7,rir:2,done:true},{reps:7,rir:2,done:true}]);
  assert(d.factor===1,'maintain factor');
});
test('session completion accounting', () => {
  const seq=buildSequence(WORKOUTS.shoulders);
  const c=sessionCompletion(seq,{a:{done:true},b:{done:true}});
  assert(c.done===2 && c.total===10,'completion math');
});
test('exercise content completeness', () => {
  for (const w of Object.values(WORKOUTS)) {
    for (const e of w.exercises) {
      assert(e.video && e.video.startsWith('http'),'video');
      assert(e.tempo,'tempo');
      assert(e.tip && e.tip.length>40,'pro tip');
    }
  }
});


test('recommendation defaults to first untrained workout', () => {
  assert(recommendedWorkoutKeyFromHistory([])==='chest','default chest');
});
test('manual leg override does not force shoulder next', () => {
  const h=[{workoutKey:'legs',endedAt:'2026-09-06T18:00:00Z'}];
  assert(recommendedWorkoutKeyFromHistory(h)==='chest','old rigid rotation would choose shoulder');
});
test('recommendation selects least recently trained when all have history', () => {
  const h=[
    {workoutKey:'chest',endedAt:'2026-09-05T18:00:00Z'},
    {workoutKey:'back',endedAt:'2026-09-02T18:00:00Z'},
    {workoutKey:'legs',endedAt:'2026-09-04T18:00:00Z'},
    {workoutKey:'shoulders',endedAt:'2026-09-03T18:00:00Z'}
  ];
  assert(recommendedWorkoutKeyFromHistory(h)==='back','back should be least recent');
});

for (const [name, ok, detail] of tests) {
  console.log(`${ok?'PASS':'FAIL'} | ${name}${detail?' | '+detail:''}`);
}
const passed = tests.filter(x=>x[1]).length;
console.log(`TOTAL ${passed}/${tests.length} PASS`);
process.exit(passed===tests.length ? 0 : 1);
