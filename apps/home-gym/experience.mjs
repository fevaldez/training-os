// Presentation math only. No elapsed-time inference, prescription changes or schema migration.
export const KG_PER_LB = 0.45359237;
export const unit = value => value === 'lb' ? 'lb' : 'kg';
export const BASES = ['per-dumbbell', 'single-implement', 'external-total', 'unknown'];
export const basisLabels = { 'per-dumbbell':'Por mancuerna', 'single-implement':'Una pesa', 'external-total':'Carga externa total', unknown:'Base sin confirmar' };
export function parseLoad(text, displayUnit = 'kg') {
  const match = String(text).trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|lbs?)?$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const enteredUnit = match[2] ? (match[2].toLowerCase() === 'kg' ? 'kg' : 'lb') : unit(displayUnit);
  return { enteredWeight:amount, enteredUnit, displayUnit:enteredUnit, weightKg:enteredUnit === 'kg' ? amount : amount * KG_PER_LB };
}
export function editLoad(previous, text, displayUnit, basis) {
  // Undefined removes only our optional numeric metadata on serialization; other fields survive.
  return { ...previous, weight:text, weightKg:undefined, enteredWeight:undefined, enteredUnit:undefined, displayUnit:undefined,
    loadBasis:BASES.includes(basis) ? basis : 'unknown', ...parseLoad(text, displayUnit) };
}
export function knownLoad(record) {
  const shown=record&&parseLoad(record.weight,record.displayUnit);
  return !!shown && shown.enteredUnit===record.displayUnit && Math.abs(shown.weightKg-record.weightKg)<=0.000001
    && record && Number.isFinite(record.weightKg) && record.weightKg >= 0
    && Number.isFinite(record.enteredWeight) && record.enteredWeight >= 0
    && ['kg','lb'].includes(record.enteredUnit) && ['kg','lb'].includes(record.displayUnit)
    && BASES.includes(record.loadBasis)
    && Math.abs(record.weightKg - record.enteredWeight * (record.enteredUnit === 'lb' ? KG_PER_LB : 1)) <= 1e-9 * Math.max(1,record.weightKg);
}
export const formatLoad = n => String(Number(n.toFixed(6)));
export function switchLoad(record, target) {
  if (!knownLoad(record) || record.loadIntent === 'unloaded-alternative') return null;
  // Always render from the same canonical anchor. Never convert the previously rounded display.
  const next = unit(target), suffix = /\s*(?:kg|lbs?)\s*$/i.test(record.weight) ? ' ' + next : '';
  return { ...record, weight:formatLoad(record.weightKg / (next === 'lb' ? KG_PER_LB : 1)) + suffix, displayUnit:next };
}
export function bumpValue(text, field, delta, displayUnit) {
  if (field === 'reps') {
    if (text.trim() && !/^\d+$/.test(text.trim())) return null;
    if (!text.trim() && delta < 0) return '';
    return String(Math.max(0, Number(text.trim() || 0) + delta));
  }
  const parsed = parseLoad(text, displayUnit);
  if (text.trim() && !parsed) return null;
  if (!text.trim() && delta < 0) return '';
  const next = Math.max(0, (parsed?.enteredWeight || 0) + delta);
  return formatLoad(next) + (/\s*(?:kg|lbs?)\s*$/i.test(text) ? ' ' + (parsed?.enteredUnit || unit(displayUnit)) : '');
}
export const adjustment = displayUnit => displayUnit === 'lb' ? 1 : 0.5;
const order = week => week % 2 ? ['A','C','B'] : ['B','C','A'];
const validWeek = week => Number.isInteger(week) && week >= 1 && week <= 12;
const identity = entry => validWeek(entry.week) && ['A','B','C'].includes(entry.session) ? entry.week + ':' + entry.session : null;
function outcomes(entry) {
  const logs = Object.values(entry.logs || {}), performed = logs.filter(s=>s.status === 'done').length, skipped = logs.filter(s=>s.status === 'skipped').length;
  const keys = (entry.plan?.exercises || []).flatMap(e=>Array.from({length:e.sets},(_,i)=>e.id+':'+(i+1)));
  return { performed, skipped, whollySkipped:keys.length > 0 && keys.every(k=>entry.logs?.[k]?.status === 'skipped') };
}
export function progress(data, week) {
  const groups = new Map();
  for (const entry of data.history || []) {
    const id = identity(entry);
    if (!id || typeof entry.endedAt !== 'string') continue;
    if (!groups.has(id)) groups.set(id,[]);
    groups.get(id).push(entry);
  }
  const sessions = [...groups].map(([id,entries])=>{
    // One planned identity, even in an imported duplicate. Confirmed movement is not erased by a later skip-only copy.
    const performedEntries = entries.filter(e=>outcomes(e).performed > 0);
    const record = (performedEntries.length ? performedEntries : entries).at(-1), counts = outcomes(record);
    return { id, week:record.week, session:record.session, record, copies:entries.length, ...counts, actuallyPerformed:performedEntries.length > 0 };
  });
  const saved = new Set(sessions.map(s=>s.id)), performed = new Set(sessions.filter(s=>s.actuallyPerformed).map(s=>s.id));
  let next = null;
  for (let w=1;w<=12 && !next;w++) {
    const map = data.calendar?.[w], weekly = map ? [...order(w)].sort((a,b)=>map[a]-map[b]) : order(w);
    for (const session of weekly) if (!saved.has(w+':'+session)) { next={week:w,session};break; }
  }
  const weekSaved = order(week).filter(s=>saved.has(week+':'+s)).length;
  const weekPerformed = order(week).filter(s=>performed.has(week+':'+s)).length;
  const completeWeeks = Array.from({length:12},(_,i)=>i+1).filter(w=>order(w).every(s=>performed.has(w+':'+s))).length;
  const whollySkipped = sessions.filter(s=>s.whollySkipped && !s.actuallyPerformed).length;
  const active = data.active || null;
  const message = active ? 'Tienes una sesión en curso. Continúa una serie a la vez.'
    : performed.size ? `${performed.size} ${performed.size===1?'sesión con movimiento registrado':'sesiones con movimiento registrado'}. Sigue a tu ritmo.`
    : saved.size ? `${saved.size} ${saved.size===1?'sesión guardada':'sesiones guardadas'}; aún sin series realizadas confirmadas. Tu siguiente paso sigue disponible.`
    : 'Empieza con una serie. Tu progreso se construye aquí.';
  return { recorded:saved.size, performed:performed.size, whollySkipped, weekSaved, weekPerformed, completeWeeks, next, active, sessions, message };
}
export function meaningfulWeek(data) {
  if (validWeek(data.active?.week)) return data.active.week;
  if (validWeek(data.preferences?.selectedWeek)) return data.preferences.selectedWeek;
  return progress(data,1).next?.week || 12;
}
