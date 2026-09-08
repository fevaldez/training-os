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
globalThis.__CORE_ORDER = CORE_ORDER;
globalThis.__FLEX_ORDER = FLEX_ORDER;
globalThis.__estimatePlanMinutes = estimatePlanMinutes;
globalThis.__plannerPresetIndices = plannerPresetIndices;
globalThis.__makePlanSnapshot = makePlanSnapshot;
globalThis.__weeklyStateFromHistory = weeklyStateFromHistory;
globalThis.__armCoverageFromHistory = armCoverageFromHistory;
globalThis.__armCatchUpNeedsFromHistory = armCatchUpNeedsFromHistory;
globalThis.__catchUpArmsIndicesFromNeeds = catchUpArmsIndicesFromNeeds;
globalThis.__recommendedCoreWorkoutFromHistory = recommendedCoreWorkoutFromHistory;
globalThis.__sessionSequence = sessionSequence;
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
const CORE_ORDER=context.__CORE_ORDER, FLEX_ORDER=context.__FLEX_ORDER;
const estimatePlanMinutes=context.__estimatePlanMinutes, plannerPresetIndices=context.__plannerPresetIndices, makePlanSnapshot=context.__makePlanSnapshot;
const weeklyStateFromHistory=context.__weeklyStateFromHistory, armCoverageFromHistory=context.__armCoverageFromHistory, armCatchUpNeedsFromHistory=context.__armCatchUpNeedsFromHistory;
const catchUpArmsIndicesFromNeeds=context.__catchUpArmsIndicesFromNeeds, recommendedCoreWorkoutFromHistory=context.__recommendedCoreWorkoutFromHistory, sessionSequence=context.__sessionSequence;

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


test('core order remains four base sessions and arms is flex only', () => {
  assert(JSON.stringify(CORE_ORDER)===JSON.stringify(['chest','back','legs','shoulders']),'core order changed');
  assert(FLEX_ORDER.length===1 && FLEX_ORDER[0]==='arms','arms must be flex');
});
test('standalone arms source of truth has biceps triceps forearm and 25 planned sets', () => {
  const w=WORKOUTS.arms,groups=new Set(w.exercises.map(e=>e.group));
  assert(groups.has('Bíceps')&&groups.has('Tríceps')&&groups.has('Antebrazo'),'missing arm groups');
  assert(buildSequence(w).length===25,'unexpected arms full set count');
});
test('standalone arms heavy opening blocks are not supersetted', () => {
  const w=WORKOUTS.arms,s=buildSequence(w);
  const firstCurl=s.find(x=>x.ei===0),firstPress=s.find(x=>x.ei===1);
  assert(firstCurl && !firstCurl.superset && firstPress && !firstPress.superset,'heavy blocks must stay standalone');
});
test('arms volume pair alternates lying curl and rope pushdown', () => {
  const w=WORKOUTS.arms,s=buildSequence(w),i=s.findIndex(x=>x.ei===2);
  assert(i>=0 && s[i].position==='first' && s[i+1].ei===3 && s[i+1].position==='second','arms B pair');
});
test('planner full snapshot preserves full workout set count', () => {
  for(const k of [...CORE_ORDER,...FLEX_ORDER]){
    const p=makePlanSnapshot(k,'full');
    assert(p.confirmedSets===buildSequence(WORKOUTS[k]).length,`full mismatch ${k}`);
    assert(p.excludedExerciseIndices.length===0,`full excluded ${k}`);
  }
});
test('30 minute planner is deterministic and keeps tier-1 blocks', () => {
  for(const k of ['chest','back','legs','arms']){
    const idx=plannerPresetIndices(k,'30');
    assert(idx.includes(0) && idx.includes(1),`tier1 missing ${k}`);
    assert(buildSequence(WORKOUTS[k],idx).length<buildSequence(WORKOUTS[k]).length,`30min failed to shorten ${k}`);
    assert(estimatePlanMinutes(k,idx)<=35,`30min estimate too high ${k}: ${estimatePlanMinutes(k,idx)}`);
  }
});
test('45 minute planner is never smaller than 30 minute planner', () => {
  for(const k of [...CORE_ORDER,...FLEX_ORDER]){
    const a=buildSequence(WORKOUTS[k],plannerPresetIndices(k,'30')).length,b=buildSequence(WORKOUTS[k],plannerPresetIndices(k,'45')).length;
    assert(b>=a,`45 smaller than 30 ${k}`);
  }
});
test('plan-aware sequence preserves superset only when both partners are included', () => {
  const both=buildSequence(WORKOUTS.chest,[3,4]),solo=buildSequence(WORKOUTS.chest,[3]);
  assert(both[0].superset===true && both[1].superset===true,'pair should remain superset');
  assert(solo.every(x=>!x.superset),'single partner must become standalone');
});
test('short confirmed plan counts as done when fully executed', () => {
  const plan=makePlanSnapshot('chest','30'),sets=Array.from({length:plan.confirmedSets},(_,i)=>({done:true,setIndex:i,reps:6,rir:2}));
  const h=[{workoutKey:'chest',endedAt:'2026-09-07T12:00:00Z',plan,sets}];
  assert(weeklyStateFromHistory(h,'chest',new Date('2026-09-07T18:00:00Z')).state==='done','short plan should count as completed core');
});
test('legacy partial session is classified partial not done', () => {
  const sets=Array.from({length:6},(_,i)=>({done:true,setIndex:i,reps:6,rir:2}));
  const h=[{workoutKey:'chest',endedAt:'2026-09-07T12:00:00Z',sets}];
  assert(weeklyStateFromHistory(h,'chest',new Date('2026-09-07T18:00:00Z')).state==='partial','legacy 6/20 should be partial');
});
test('arms catch-up is not suggested before corresponding core attempt', () => {
  const n=armCatchUpNeedsFromHistory([],new Date('2026-09-07T18:00:00Z'));
  assert(!n.biceps&&!n.triceps,'catchup should not invent debt');
});
test('arms catch-up detects undercovered triceps after chest attempt', () => {
  const sets=[{done:true,exerciseName:'Machine / Lever Chest Press'},{done:true,exerciseName:'Rope Pushdown'}];
  const h=[{workoutKey:'chest',endedAt:'2026-09-07T12:00:00Z',sets}];
  const n=armCatchUpNeedsFromHistory(h,new Date('2026-09-07T18:00:00Z'));
  assert(n.triceps===true,'triceps undercoverage not detected');
  assert(n.biceps===false,'biceps should not be inferred without back attempt');
});
test('catch-up arms defaults exclude forearm and avoid one-to-one debt recovery', () => {
  const needs={biceps:true,triceps:true,coverage:{biceps:2,bicepsTarget:9,triceps:2,tricepsTarget:7}};
  const idx=catchUpArmsIndicesFromNeeds(needs);
  assert(idx.every(i=>![6,7].includes(i)),'forearm should be optional in catchup');
  assert(idx.length===4,'catchup should use conservative two movements per undercovered group');
});
test('core recommendation never returns flex arms', () => {
  const h=[{workoutKey:'arms',endedAt:'2026-09-07T12:00:00Z'}];
  const k=recommendedCoreWorkoutFromHistory(h,new Date('2026-09-07T18:00:00Z'));
  assert(CORE_ORDER.includes(k)&&k!=='arms','flex arms entered core recommendation');
});
test('core recommendation prioritizes a pending core over completed core', () => {
  const p=makePlanSnapshot('chest','30'),sets=Array.from({length:p.confirmedSets},()=>({done:true,reps:6,rir:2}));
  const h=[{workoutKey:'chest',endedAt:'2026-09-07T12:00:00Z',plan:p,sets}];
  const k=recommendedCoreWorkoutFromHistory(h,new Date('2026-09-07T18:00:00Z'));
  assert(k!=='chest'&&CORE_ORDER.includes(k),'completed chest should not be immediate recommendation');
});
test('session sequence honors confirmed planner exercise list', () => {
  const plan=makePlanSnapshot('back','30'),a={plan},seq=sessionSequence(a,WORKOUTS.back);
  assert(seq.length===plan.confirmedSets,'session sequence count');
  assert(seq.every(x=>plan.includedExerciseIndices.includes(x.ei)),'excluded exercise leaked into session');
});

for (const [name, ok, detail] of tests) {
  console.log(`${ok?'PASS':'FAIL'} | ${name}${detail?' | '+detail:''}`);
}
const passed = tests.filter(x=>x[1]).length;
console.log(`TOTAL ${passed}/${tests.length} PASS`);
process.exit(passed===tests.length ? 0 : 1);
