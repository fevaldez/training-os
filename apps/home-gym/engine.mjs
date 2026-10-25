// Bounded Home Gym adapter. FV remains inline and byte-identical.
// Reuses FV principles: explicit set outcomes, immutable plan snapshots,
// Web Locks, read-back verification, stale-writer refusal and idempotent finish.
import { PROGRAM } from './program.mjs';

export const KEY = 'home-gym.v1.data';
export const LOCK = 'home-gym.v1.write';
export const clone = x => JSON.parse(JSON.stringify(x));
const sessions = ['A', 'C', 'B'];
const integer = (x, low, high) => Number.isInteger(x) && x >= low && x <= high;
export function schedule(week) {
  return week % 2 ? { A: 0, C: 2, B: 4 } : { B: 0, C: 2, A: 4 };
}
export function prescription(week, session) {
  if (!integer(week, 1, 12) || !sessions.includes(session)) throw Error('invalid-plan');
  const p = PROGRAM.plan[week - 1];
  if (session === 'C') return {
    title: 'Condición progresiva', week, session, phase: p.phase, effort: p.effort,
    conditioning: { ...clone(p), sourceSHA256: PROGRAM.sourceSHA256 },
    protocol: week === 6
      ? '15–20 min de caminata muy suave, ritmo conversacional. Sin intervalos.'
      : `Camina o pedalea si se dispone de equipo adecuado: 5 min suave → ${p.intervals} ciclos de ${p.hard} s a ${p.effort} + ${p.easy} s suave → 3–5 min muy suave. Sin sprints; intensidad controlada.`,
    exercises: [{ id: 'condition', name: p.cardio, sets: 1, reps: p.effort, tempo: '', rest: '', rir: '', gear: 'Caminadora / caminata; alternativas según técnica', cue: PROGRAM.guidance.cardioTalk, alt: PROGRAM.guidance.cardioAlternatives }]
  };
  return { title: 'Fuerza ' + session, week, session, phase: p.phase, exercises: PROGRAM.exercise[session].map((e, i) => ({
    ...e, sets: i === 4 ? p.coreSets : i < 2 ? p.mainSets : p.auxSets,
    rir: e.rir === 'Técnica' ? 'técnica' : p.rir
  })) };
}
export function emergency(week, session) {
  if (!['A', 'B'].includes(session)) throw Error('emergency-strength-only');
  prescription(week, session);
  return { title: 'Plan B · 15–20 minutos', week, session, emergency: true,
    protocol: PROGRAM.guidance.emergency + ' ' + PROGRAM.guidance.emergencyRule,
    exercises: [{ id: 'emergency', name: 'Dos rondas del Plan B', sets: 1, reps: '2 rondas', rir: '3–4', gear: 'Banco + mancuerna', tempo: 'Sin prisa', rest: 'Lo necesario', cue: PROGRAM.guidance.emergency, alt: PROGRAM.guidance.emergencyRule }] };
}
export function setKeys(plan) {
  return plan.exercises.flatMap(e => Array.from({ length: e.sets }, (_, i) => e.id + ':' + (i + 1)));
}
function fresh() {
  return { schema: 1, programId: PROGRAM.programId, programVersion: PROGRAM.programVersion,
    rev: 0, calendar: {}, active: null, history: [], feedback: '' };
}
function validate(data) {
  if (!data || data.schema !== 1 || data.programId !== PROGRAM.programId || !integer(data.rev, 0, Number.MAX_SAFE_INTEGER)
      || !Array.isArray(data.history) || !data.calendar || typeof data.calendar !== 'object'
      || Array.isArray(data.calendar) || typeof data.feedback !== 'string') throw Error('unsupported-or-damaged-data');
  const ids = new Set();
  for (const entry of data.history) {
    if (!validSession(entry) || ids.has(entry.id) || typeof entry.endedAt !== 'string') throw Error('damaged-history');
    ids.add(entry.id);
  }
  if (data.active !== null && !validSession(data.active)) throw Error('damaged-active');
  for (const [week, days] of Object.entries(data.calendar)) {
    if (!integer(Number(week), 1, 12) || !days || !sessions.every(s => integer(days[s], 0, 6))
        || new Set(sessions.map(s => days[s])).size !== 3) throw Error('damaged-calendar');
  }
  return data;
}
function validSession(a) {
  if (!a || typeof a.id !== 'string' || !integer(a.week, 1, 12) || !sessions.includes(a.session)
      || a.programId !== PROGRAM.programId || a.plan?.week !== a.week || a.plan?.session !== a.session
      || !a.plan || !Array.isArray(a.plan.exercises) || !a.plan.exercises.length || !a.logs || typeof a.logs !== 'object'
      || typeof a.startedAt !== 'string' || typeof a.programVersion !== 'string') return false;
  const ex = a.plan.exercises;
  if (ex.some(e => typeof e.id !== 'string' || !integer(e.sets, 1, 10))) return false;
  const keys = new Set(setKeys(a.plan));
  const fields = v => v && ['weight', 'reps', 'note'].every(k => typeof v[k] === 'string' && v[k].length <= 2000);
  return Object.entries(a.logs).every(([key, log]) => keys.has(key) && fields(log) && ['done', 'skipped'].includes(log.status))
    && (!a.drafts || typeof a.drafts === 'object' && !Array.isArray(a.drafts)
      && Object.entries(a.drafts).every(([key, value]) => keys.has(key) && fields(value)));
}
export function createStore(storage, locks, options = {}) {
  // A single atomic document replaces FV's multi-key journal; no partial history/active move.
  // Unknown fields are copied through. Invalid storage is never defaulted or overwritten.
  function read() {
    const raw = storage.getItem(KEY);
    return { raw, data: raw === null ? fresh() : validate(JSON.parse(raw)) };
  }
  async function change(expected, mutate) {
    if (!locks?.request) throw Error('lock-unavailable');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), options.lockTimeout || 4000);
    try {
      return await locks.request(LOCK, { mode: 'exclusive', signal: abort.signal }, async () => {
        clearTimeout(timer);
        const before = read();
        if (before.raw !== expected) throw Error('stale-tab');
        const next = clone(before.data);
        mutate(next);
        next.rev++;
        validate(next);
        const text = JSON.stringify(next);
        // Recheck after constructing the snapshot; never perform speculative cleanup.
        if (storage.getItem(KEY) !== before.raw) throw Error('stale-tab');
        storage.setItem(KEY, text);
        if (storage.getItem(KEY) !== text) throw Error('read-back-failed');
        return { raw: text, data: next };
      });
    } finally { clearTimeout(timer); }
  }
  return {
    read,
    preference: (expected, patch) => change(expected, data => {
      if (Object.keys(patch).some(k => !['displayUnit', 'selectedWeek'].includes(k))
          || ('displayUnit' in patch && !['kg','lb'].includes(patch.displayUnit))
          || ('selectedWeek' in patch && !integer(patch.selectedWeek, 1, 12))) throw Error('invalid-preference');
      data.preferences = { ...data.preferences, ...patch };
    }),
    move: (expected, week, session, day) => change(expected, data => {
      prescription(week, session);
      if (!integer(day, 0, 6)) throw Error('invalid-day');
      const days = data.calendar[week] || schedule(week);
      const previous = days[session];
      for (const s of sessions) if (s !== session && days[s] === day) days[s] = previous;
      days[session] = day;
      data.calendar[week] = days;
    }),
    start: (expected, week, session, isEmergency = false) => change(expected, data => {
      if (data.active) throw Error('active-session-exists');
      if (data.history.some(h => h.week === week && h.session === session)) throw Error('already-completed');
      const plan = isEmergency ? emergency(week, session) : prescription(week, session);
      data.active = { id: crypto.randomUUID(), week, session, programId: PROGRAM.programId,
        programVersion: PROGRAM.programVersion, startedAt: new Date().toISOString(), plan: clone(plan), logs: {}, drafts: {} };
    }),
    draft: (expected, id, key, value) => change(expected, data => {
      if (data.active?.id !== id || !setKeys(data.active.plan).includes(key)) throw Error('active-conflict');
      data.active.drafts = { ...data.active.drafts, [key]: clone(value) };
    }),
    log: (expected, id, key, value) => change(expected, data => {
      if (data.active?.id !== id || !setKeys(data.active.plan).includes(key)) throw Error('active-conflict');
      data.active.logs[key] = clone(value);
      if (data.active.drafts) delete data.active.drafts[key];
    }),
    // Conditioning still resolves one historical key. Its clock guard runs inside
    // this existing atomic workout transaction, never in a second lock domain.
    conditionOutcome: (expected, id, value, guard) => change(expected, data => {
      const a = data.active;
      if (a?.id !== id || a.session !== 'C' || a.logs['condition:1'] || typeof guard !== 'function') throw Error('active-conflict');
      guard(a);
      a.logs['condition:1'] = clone(value);
      if (a.drafts) delete a.drafts['condition:1'];
    }),
    // One atomic write both confirms condition:1 and closes the session. A lost
    // acknowledgement can be retried even after another session has started.
    finishCondition: async (expected, id, value, guard) => {
      const current = read();
      if (current.data.history.some(h => h.id === id)) return current;
      return change(expected, data => {
        const a = data.active;
        if (a?.id !== id || a.session !== 'C' || a.logs['condition:1'] || typeof guard !== 'function') throw Error('active-conflict');
        guard(a);
        a.logs['condition:1'] = clone(value);
        if (a.drafts) delete a.drafts['condition:1'];
        if (Object.keys(a.drafts || {}).length) throw Error('resolve-every-set');
        data.history.push({ ...clone(a), endedAt: new Date().toISOString() });
        data.active = null;
      });
    },
    cancelCondition: (expected, id, guard) => change(expected, data => {
      const a = data.active;
      if (a?.id !== id || a.session !== 'C' || Object.keys(a.logs).length
          || data.history.some(h => h.id === id) || typeof guard !== 'function') throw Error('confirmed-session-cannot-cancel');
      guard(a);
      data.active = null;
    }),
    finish: async (expected, id) => {
      // A failed acknowledgement can be retried without duplicating an already committed log.
      const current = read();
      if (current.data.history.some(h => h.id === id) && !current.data.active) return current;
      return change(expected, data => {
        const a = data.active;
        if (!a || a.id !== id) throw Error('active-conflict');
        if (!setKeys(a.plan).every(k => a.logs[k]) || Object.keys(a.drafts || {}).length) throw Error('resolve-every-set');
        if (data.history.some(h => h.id === id)) throw Error('history-conflict');
        data.history.push({ ...clone(a), endedAt: new Date().toISOString() });
        data.active = null;
      });
    },
    feedback: (expected, text) => change(expected, data => {
      if (typeof text !== 'string' || text.length > 5000) throw Error('invalid-feedback');
      data.feedback = text;
    }),
    exportRaw: () => ({ schema: 1, programId: PROGRAM.programId, programVersion: PROGRAM.programVersion, raw: storage.getItem(KEY) }),
    restore: (expected, backup) => {
      if (backup?.schema !== 1 || backup.programId !== PROGRAM.programId || typeof backup.raw !== 'string') throw Error('wrong-backup');
      const candidate = validate(JSON.parse(backup.raw));
      return change(expected, data => {
        // Restore only into an empty store. Never replace existing progress or migrate other keys.
        if (data.active || data.history.length || data.feedback || Object.keys(data.calendar).length) throw Error('restore-requires-empty-store');
        Object.assign(data, clone(candidate), { rev: data.rev });
      });
    }
  };
}
