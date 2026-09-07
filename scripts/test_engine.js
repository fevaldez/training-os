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
globalThis.__progressionDecisionFromExposures = progressionDecisionFromExposures;
globalThis.__tempoView = tempoView;
globalThis.__prefillFromMemory = prefillFromMemory;
globalThis.__remainingExerciseIndices = remainingExerciseIndices;
globalThis.__sessionCompletion = sessionCompletion;
globalThis.__recommendedWorkoutKeyFromHistory = recommendedWorkoutKeyFromHistory;
`;

const context = { console };
vm.createContext(context);
vm.runInContext(core, context);

const WORKOUTS=context.__WORKOUTS;
const toKg=context.__toKg, fromKg=context.__fromKg, explainTempo=context.__explainTempo;
const buildSequence=context.__buildSequence, nextTransition=context.__nextTransition;
const remainingSeconds=context.__remainingSeconds, progressionDecision=context.__progressionDecision, progressionDecisionFromExposures=context.__progressionDecisionFromExposures;
const tempoView=context.__tempoView, prefillFromMemory=context.__prefillFromMemory, remainingExerciseIndices=context.__remainingExerciseIndices;
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
test('tempo four phase canonical mapping is E-PE-C-PC', () => {
  const e={name:'Smith Flat Bench Press',tempo:'3-1-X-1'};
  const x=tempoView(e);
  assert(x.canonical==='E–PE–C–PC · 3–1–X–1','canonical tempo');
  assert(x.map.includes('E 3s')&&x.map.includes('C X'),'phase mapping');
});
test('concentric-start exercise renders chronological execution from concentric', () => {
  const x=tempoView({name:'Cable Curl',tempo:'3-0-1-1'});
  assert(x.execution.startsWith('Concéntrica 1s'),'concentric chronological start');
});
test('eccentric-start exercise renders chronological execution from eccentric', () => {
  const x=tempoView({name:'Smith Flat Bench Press',tempo:'2-1-X-0'});
  assert(x.execution.startsWith('Excéntrica 2s'),'eccentric chronological start');
});
test('continuous tempo has no false phase timing', () => {
  const x=tempoView({name:'Reverse Sled Drag',tempo:'Continuo'});
  assert(x.continuous===true && x.canonical==='Continuo','continuous handling');
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
test('one qualifying exposure does not increase load', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const q=[{reps:8,rir:2,done:true},{reps:8,rir:3,done:true}];
  const d=progressionDecisionFromExposures(e,[q]);
  assert(d.factor===1 && d.status==='building','must require two exposures');
});
test('two consecutive qualifying exposures unlock conservative +2.5%', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const q1=[{reps:8,rir:2,done:true},{reps:8,rir:3,done:true}];
  const q2=[{reps:8,rir:2,done:true},{reps:8,rir:2,done:true}];
  const d=progressionDecisionFromExposures(e,[q1,q2]);
  assert(d.factor===1.025 && d.status==='eligible','two-exposure gate');
});
test('repeated miss triggers review, never automatic load increase', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const bad=[{reps:4,rir:0,done:true},{reps:6,rir:1,done:true}];
  const d=progressionDecisionFromExposures(e,[bad,bad]);
  assert(d.factor===1 && d.status==='review','review instead of automatic increase');
});
test('progression holds when target is not yet at ceiling', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const a=[{reps:7,rir:2,done:true},{reps:7,rir:2,done:true}];
  const d=progressionDecisionFromExposures(e,[a,a]);
  assert(d.factor===1 && d.status==='hold','hold factor');
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


test('skipped set counts as resolved session progress', () => {
  const seq=buildSequence(WORKOUTS.shoulders);
  const c=sessionCompletion(seq,{a:{done:true},b:{done:false,skipped:true}});
  assert(c.done===2 && c.total===10,'skip should resolve progress');
});
test('skipped set cannot satisfy two-exposure progression gate', () => {
  const e={...WORKOUTS.back.exercises[0],sets:2,reps:'5–8'};
  const partial=[{reps:8,rir:3,done:true},{reps:0,rir:null,done:false,skipped:true}];
  const good=[{reps:8,rir:2,done:true},{reps:8,rir:2,done:true}];
  const d=progressionDecisionFromExposures(e,[partial,good]);
  assert(d.factor===1,'skip must not qualify an exposure');
});

test('current-session weight memory overrides historical weight', () => {
  const current={weightKg:70,reps:6,rir:2,done:true},history={weightKg:65,reps:7,rir:2,done:true};
  const d=prefillFromMemory(current,history,5,1);
  assert(d.weightKg===70 && d.reps===5 && d.rir===1 && d.source==='current','current session priority');
});
test('historical weight memory pre-fills next workout but not old reps/RIR', () => {
  const history={weightKg:65,reps:8,rir:3,done:true};
  const d=prefillFromMemory(null,history,5,1);
  assert(d.weightKg===65 && d.reps===5 && d.rir===1 && d.source==='history','history prefill');
});
test('baseline remains empty when no load memory exists', () => {
  const d=prefillFromMemory(null,null,10,2);
  assert(d.weightKg===0 && d.reps===10 && d.rir===2 && d.source==='baseline','baseline');
});

test('skip-exercise index selection preserves superset partner sets', () => {
  const seq=buildSequence(WORKOUTS.chest);
  const ropeEi=WORKOUTS.chest.exercises.findIndex(e=>e.name==='Rope Pushdown');
  const crunchEi=WORKOUTS.chest.exercises.findIndex(e=>e.name==='Cable / Machine Crunch');
  const first=seq.findIndex(x=>x.ei===ropeEi);
  const idxs=remainingExerciseIndices(seq,first,ropeEi);
  assert(idxs.length===WORKOUTS.chest.exercises[ropeEi].sets,'all rope sets');
  assert(idxs.every(i=>seq[i].ei===ropeEi),'no partner index');
  assert(idxs.every(i=>seq[i].ei!==crunchEi),'crunch preserved');
});

for (const [name, ok, detail] of tests) {
  console.log(`${ok?'PASS':'FAIL'} | ${name}${detail?' | '+detail:''}`);
}
const passed = tests.filter(x=>x[1]).length;
console.log(`TOTAL ${passed}/${tests.length} PASS`);
process.exit(passed===tests.length ? 0 : 1);
