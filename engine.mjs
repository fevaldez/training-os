export const KG_PER_LB = 0.45359237;

export function toKg(value, unit='kg') {
  const n = Number(value) || 0;
  return unit === 'lb' ? n * KG_PER_LB : n;
}
export function fromKg(kg, unit='kg') {
  const n = Number(kg) || 0;
  return unit === 'lb' ? n / KG_PER_LB : n;
}
export function roundDisplay(value, unit='kg') {
  return unit === 'lb' ? Math.round(value * 2) / 2 : Math.round(value * 4) / 4;
}
export function parseRepRange(text) {
  const n = String(text).match(/\d+/g) || [];
  return { min: +(n[0] || 0), max: +(n[1] || n[0] || 0) };
}
export function targetRIR(text) {
  const n = String(text).match(/\d+/g) || [];
  return +(n[0] || 2);
}
export function average(values) {
  return values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
}
export function explainTempo(code) {
  if (!code || String(code).toLowerCase().startsWith('continuo')) {
    return 'Continuo: ritmo estable; no hay fases cronometradas.';
  }
  const p = String(code).split('-');
  if (p.length !== 4) return String(code);
  const phase = (x, label) => String(x).toUpperCase() === 'X'
    ? `${label}: explosivo con control`
    : `${label}: ${x}s`;
  return [
    phase(p[0], 'Excéntrica / bajada'),
    phase(p[1], 'Pausa en estiramiento'),
    phase(p[2], 'Concéntrica / subida'),
    phase(p[3], 'Pausa en contracción')
  ].join(' · ');
}
export function buildSequence(workout) {
  const seq = [], es = workout.exercises;
  for (let i=0; i<es.length;) {
    const partnerName = es[i].superset;
    if (partnerName && i+1<es.length && es[i+1].superset === es[i].name) {
      const a=i, b=i+1, rounds=Math.max(es[a].sets, es[b].sets);
      for(let s=0;s<rounds;s++) {
        if(s<es[a].sets) seq.push({ei:a,si:s,superset:true,position:'first',partner:b});
        if(s<es[b].sets) seq.push({ei:b,si:s,superset:true,position:'second',partner:a});
      }
      i+=2;
    } else {
      for(let s=0;s<es[i].sets;s++) seq.push({ei:i,si:s,superset:false,position:'single',partner:null});
      i++;
    }
  }
  return seq;
}
export function nextTransition(sequence, completedIndex, workout) {
  const current = sequence[completedIndex];
  const next = sequence[completedIndex+1] || null;
  if (!next) return {type:'finish', next:null, restSec:0};
  if (current?.superset && current.position === 'first' &&
      next.superset && next.position === 'second' && current.si === next.si) {
    return {type:'superset-switch', next, restSec:0};
  }
  const completedExercise = workout.exercises[current.ei];
  return {type:'rest', next, restSec:Number(completedExercise.rest)||0};
}
export function remainingSeconds(endsAt, now=Date.now()) {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt-now)/1000));
}
export function progressionDecision(exercise, priorExerciseSets=[]) {
  const r = parseRepRange(exercise.reps);
  if (!priorExerciseSets.length) return {factor:1, reason:'Primer baseline'};
  const valid = priorExerciseSets.filter(s=>s && s.done !== false);
  if (!valid.length) return {factor:1, reason:'Sin baseline válido'};
  const repsHitTop = r.max>0 && valid.length>=exercise.sets && valid.slice(0,exercise.sets).every(s=>(+s.reps||0)>=r.max);
  const rirs = valid.slice(0,exercise.sets).map(s=>Number(s.rir)).filter(Number.isFinite);
  if (repsHitTop && rirs.length && average(rirs)>=2) {
    return {factor:1.025, reason:'Techo de reps completado con ≥2 RIR promedio'};
  }
  const missed = r.min>0 && valid.some(s=>(+s.reps||0)<r.min || Number(s.rir)<=0);
  if (missed) return {factor:0.975, reason:'Rep target fallado o RIR 0'};
  return {factor:1, reason:'Mantener carga; ganar reps/calidad primero'};
}
export function sessionCompletion(sequence, logs) {
  const done = Object.values(logs||{}).filter(x=>x.done).length;
  return {done,total:sequence.length,pct:sequence.length?Math.round(done/sequence.length*100):0};
}
