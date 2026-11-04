/* WOD V0.2 pure planning, validation and migration contract. No production keys. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.WODCore=factory()})(typeof globalThis==='object'?globalThis:this,()=>{
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v)),KEY='training-os.wod-lab.v0',BACKUP=KEY+'.pre-v02';
const equipment=['Mancuernas','Banco','Barra','Rack','Remo','Kettlebell','Caminadora','SkiErg','Pull-up bar','Bandas'];
const ex=(id,es,en,eq=[],cue=['Controla el movimiento, sin dolor.','Control the movement, stay pain-free.'],sub=null)=>({id,names:[es,en],equipment:eq,cues:cue,substitute:sub});
const exercises=[ex('squat','Sentadilla sin carga','Air squat'),ex('push','Flexión de rodillas','Knee push-up'),ex('lunge','Desplante atrás','Reverse lunge'),ex('bridge','Puente de glúteos','Glute bridge'),ex('deadbug','Abdomen alterno','Dead bug'),ex('march','Marcha suave','Easy march'),ex('prone','Elevación W boca abajo','Prone W raise',[],['Alternativa ligera de espalda; no equivale a una dominada.','Light back exercise; not equivalent to a pull-up.']),ex('dbrow','Remo con mancuerna','Dumbbell row',['Mancuernas']),ex('pullup','Dominada estricta','Strict pull-up',['Pull-up bar'],['Solo barra certificada y fijada; sin impulso. Usa remo si no es seguro.','Only a rated, secured bar; no kipping. Use rows if unsafe.'],'dbrow')];
const defaults=()=>({version:1,schemaVersion:2,favorites:[],custom:[],history:[],active:null,day5:false,feedback:[],sourceBackups:[],archivedPlans:[],exercises:[],plans:{},equipment:[],goals:{strength:2,endurance:2,consistency:4},modified:0});
function weekKey(date=new Date()){const d=new Date(date);if(!Number.isFinite(+d))throw Error('date');d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
const ordinal=key=>Math.floor(Date.parse(key)/604800000);
const total=w=>Number(w.warm)+Number(w.main)+Number(w.cool);
function workoutOK(w){return w&&typeof w.id==='string'&&w.id.length>0&&typeof w.title==='string'&&['Fuerza','AMRAP','EMOM','HIIT','Recuperación'].includes(w.type)&&Array.isArray(w.moves)&&w.moves.length>0&&w.moves.length<=18&&w.moves.every(m=>Array.isArray(m)&&m.length>=2&&m.slice(0,2).every(x=>typeof x==='string'&&x.length>0))&&Array.isArray(w.equip)&&w.equip.every(x=>typeof x==='string')&&['warm','main','cool'].every(k=>Number.isInteger(w[k])&&w[k]>0&&w[k]<=45)&&total(w)<=45&&(w.type!=='HIIT'||Number.isFinite(w.work)&&Number.isFinite(w.rest)&&w.work>0&&w.rest>0)}
function activeOK(a){return !a||typeof a.id==='string'&&workoutOK(a.workout)&&Array.isArray(a.segments)&&a.segments.length>0&&a.segments.length<=300&&a.segments.every(g=>g&&Number.isFinite(g.seconds)&&g.seconds>0)&&Number.isInteger(a.idx)&&a.idx>=0&&a.idx<=a.segments.length&&['running','paused','ready'].includes(a.status)&&Number.isFinite(a.guidedMs)&&a.guidedMs>=0&&Number.isFinite(a.liveInitial)&&a.liveInitial>=0&&Number.isFinite(a.liveAt)&&Array.isArray(a.records)&&a.records.every(r=>r&&typeof r.action==='string'&&Number.isFinite(r.elapsedMs)&&r.elapsedMs>=0)&&Array.isArray(a.skippedMoves)&&a.skippedMoves.every(Number.isInteger)&&(a.status!=='running'||Number.isFinite(a.deadline))}
function validate(d){
 if(!d||d.version!==1||(d.schemaVersion!==undefined&&d.schemaVersion!==2))throw Error('version');
 for(const [k,max] of [['history',10000],['custom',500],['favorites',1000]])if(!Array.isArray(d[k])||d[k].length>max)throw Error(k);
 for(const k of ['history','custom']){const ids=new Set();for(const x of d[k]){if(!x||typeof x.id!=='string'||!x.id||ids.has(x.id))throw Error('duplicate');ids.add(x.id)}}
 const reserved=new Set(['barbell-base','engine-emom','forge-amrap','density-strength','bodyweight-only','tempo-hiit','kb-amrap','recovery-flow',...additions().map(w=>w.id)]);
 if(d.custom.some(w=>reserved.has(w.id)))throw Error('reserved-workout-id');
 if(!d.custom.every(workoutOK)||!activeOK(d.active))throw Error('workout/session');
 if(!d.history.every(h=>typeof h.name==='string'&&typeof h.type==='string'&&Number.isFinite(h.guidedSeconds)&&h.guidedSeconds>=0&&Number.isFinite(Date.parse(h.completedAt))&&(!h.records||Array.isArray(h.records))))throw Error('history');
 if(!d.favorites.every(x=>typeof x==='string'))throw Error('favorites');
 if(d.feedback&&!Array.isArray(d.feedback))throw Error('feedback');
 if(d.equipment&&(!Array.isArray(d.equipment)||!d.equipment.every(x=>equipment.includes(x))))throw Error('equipment');
 if(d.exercises&&(!Array.isArray(d.exercises)||d.exercises.length>500||!d.exercises.every(e=>e&&typeof e.id==='string'&&Array.isArray(e.names)&&e.names.length===2&&e.names.every(n=>typeof n==='string'&&n.length>0)&&Array.isArray(e.equipment)&&e.equipment.every(q=>equipment.includes(q))&&Array.isArray(e.cues)&&e.cues.length===2&&e.cues.every(c=>typeof c==='string'))||new Set(d.exercises.map(e=>e.id)).size!==d.exercises.length||d.exercises.some(e=>exercises.some(b=>b.id===e.id))))throw Error('exercises');
 if(d.sourceBackups&&(!Array.isArray(d.sourceBackups)||!d.sourceBackups.every(x=>typeof x==='string')))throw Error('sourceBackups');
 if(d.archivedPlans&&!Array.isArray(d.archivedPlans))throw Error('archivedPlans');
 if(d.plans&&(typeof d.plans!=='object'||Array.isArray(d.plans)||Object.entries(d.plans).some(([k,p])=>k!==p.week||weekKey(k)!==k||!Array.isArray(p.slots)||p.slots.length!==5||p.slots.some(s=>!s||!workoutOK(s.workout)||total(s.workout)!==45)||new Set(p.slots.map(s=>s.workout.id)).size!==5)))throw Error('plans');
  for(const h of d.history){if(h.workout&&!workoutOK(h.workout))throw Error('history-workout');if(h.strengthLogs&&(!Array.isArray(h.strengthLogs)||h.strengthLogs.some(x=>!x||typeof x.move!=='string'||typeof x.variant!=='string'||!Number.isInteger(x.reps)||x.reps<1||x.reps>100||!Number.isFinite(x.kg)||x.kg<0||x.kg>500)))throw Error('strengthLogs')}
 return d;
}
function migrate(d){validate(d);return {...defaults(),...copy(d),schemaVersion:2}}
function safe(w,available){return workoutOK(w)&&[...w.equip,...(w.id==='kb-amrap'?['Banco']:[])].every(e=>e==='Peso corporal'||available.includes(e))}
function plan(workouts,available,key){
 const pool=workouts.filter(w=>w.eligible!==false&&total(w)===45&&safe(w,available)&&(!w.custom||w.reviewed===true));
 const pick=(type,count)=>{const p=pool.filter(w=>w.type===type).sort((a,b)=>a.id.localeCompare(b.id));if(p.length<count)throw Error('insufficient-safe-workouts');const start=((ordinal(key)%p.length)+p.length)%p.length;return Array.from({length:count},(_,i)=>copy(p[(start+i)%p.length]))};
 const strength=pick('Fuerza',2),a=pick('AMRAP',1)[0],e=pick('EMOM',1)[0],cond=ordinal(key)%2?[e,a]:[a,e];
 return {week:key,createdAt:new Date().toISOString(),equipment:copy(available),slots:[strength[0],cond[0],strength[1],cond[1],pick('Recuperación',1)[0]].map((w,i)=>({id:key+':'+i,optional:i===4,workout:w}))};
}
function union(a,b){const out=copy(a);for(const x of b){const old=out.find(y=>y.id===x.id);if(old&&JSON.stringify(old)!==JSON.stringify(x))throw Error('conflicting-id:'+x.id);if(!old)out.push(copy(x))}return out}
function merge(local,incoming){validate(local);validate(incoming);const a=migrate(local),b=migrate(incoming);if(a.active&&b.active&&JSON.stringify(a.active)!==JSON.stringify(b.active))throw Error('active-conflict');
 // Unknown field collisions fail closed. No silent choice between two owners' values.
 const known=new Set(Object.keys(defaults()));for(const k of Object.keys(b))if(!known.has(k)&&k in a&&JSON.stringify(a[k])!==JSON.stringify(b[k]))throw Error('unknown-conflict:'+k);
 const out={...b,...a,history:union(a.history,b.history),custom:union(a.custom,b.custom),exercises:union(a.exercises,b.exercises),favorites:[...new Set([...a.favorites,...b.favorites])],active:a.active||b.active,plans:{...a.plans},sourceBackups:[...new Set([...a.sourceBackups,...b.sourceBackups])],archivedPlans:copy(a.archivedPlans),feedback:[...new Map([...a.feedback,...b.feedback].map(x=>[JSON.stringify(x),x])).values()]};
 for(const[k,p]of Object.entries(b.plans)){if(out.plans[k]){if(JSON.stringify(out.plans[k])!==JSON.stringify(p)&&!out.archivedPlans.some(x=>JSON.stringify(x)===JSON.stringify(p)))out.archivedPlans.push(copy(p))}else out.plans[k]=copy(p)}
 for(const p of b.archivedPlans)if(!out.archivedPlans.some(x=>JSON.stringify(x)===JSON.stringify(p)))out.archivedPlans.push(copy(p));
 out.history.sort((x,y)=>Date.parse(y.completedAt)-Date.parse(x.completedAt));return validate(out);
}
function load(storage){const raw=storage.getItem(KEY);if(raw===null)return {data:defaults(),raw};return {data:migrate(JSON.parse(raw)),raw}}
function write(storage,candidate,expected){validate(candidate);const raw=storage.getItem(KEY);if(raw!==expected)throw Error('stale-tab');if(raw!==null&&!storage.getItem(BACKUP)){storage.setItem(BACKUP,raw);if(storage.getItem(BACKUP)!==raw)throw Error('backup-readback')}
 const next=JSON.stringify(candidate);storage.setItem(KEY,next);if(storage.getItem(KEY)!==next)throw Error('primary-readback');return next;
}
function fingerprint(w,context){return JSON.stringify([w.id,w.type,w.warm,w.main,w.cool,w.moves,w.exerciseIds||[],w.work,w.rest,context])}
function metrics(d,key=weekKey()){
 const hist=d.history,completed=hist.filter(h=>!h.early&&h.guidedSeconds>=h.plannedM*60&&weekKey(h.completedAt)===key),credits=new Map();
 for(const h of completed){const slot=d.plans?.[key]?.slots.find(s=>s.id===h.planSlot);if(h.planWeek===key&&slot&&h.workout&&fingerprint(slot.workout,'')===fingerprint(h.workout,'')&&!credits.has(h.planSlot))credits.set(h.planSlot,{...h,optional:slot.optional,type:slot.workout.type})}
 const rows=[...credits.values()],required=rows.filter(h=>!h.optional),strength=required.filter(h=>h.type==='Fuerza').length,endurance=required.filter(h=>['AMRAP','EMOM','HIIT'].includes(h.type)).length;
 const comparisons=[];const chronological=[...hist].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt));const prev=new Map();
 for(const h of chronological){if(h.early||h.guidedSeconds<h.plannedM*60||!h.benchmarkKey||!Number.isFinite(h.benchmarkScore))continue;const p=prev.get(h.benchmarkKey);if(p)comparisons.push({name:h.name,workoutId:h.workoutId,type:h.type,score:h.benchmarkScore,previous:p.benchmarkScore,delta:h.benchmarkScore-p.benchmarkScore,unit:h.type==='AMRAP'?'rounds':'intervals'});prev.set(h.benchmarkKey,h)}
 const loads=new Map(),strengthComparisons=[];for(const h of chronological){if(h.early||h.guidedSeconds<h.plannedM*60||!h.benchmarkKey)continue;const best=new Map();for(const s of h.strengthLogs||[]){const k=JSON.stringify([h.benchmarkKey,s.move,s.reps,s.variant]);if(!best.has(k)||best.get(k).kg<s.kg)best.set(k,s)}for(const[k,s]of best){const old=loads.get(k);if(old)strengthComparisons.push({move:s.move,names:s.names,reps:s.reps,kg:s.kg,delta:s.kg-old.kg});loads.set(k,s)}}
 return {strength,endurance,consistency:required.length,optional:rows.filter(h=>h.optional).length,comparisons,strengthComparisons};
}
function additions(){const make=(id,type,refs,doses)=>({id,title:id,type,benefit:type==='Fuerza'?'Fuerza':type==='Recuperación'?'Recuperación':'Resistencia',focus:'Tren completo',equip:['Peso corporal'],level:type==='Recuperación'?'RPE 4–5':'RPE 6–7',warm:8,main:30,cool:7,work:40,rest:80,subtitle:'',exerciseIds:refs,moves:refs.map((id,i)=>{const e=exercises.find(x=>x.id===id);return [e.names[0],doses[i],e.cues[0]]}),custom:false});return [make('bw-strength-a','Fuerza',['squat','push','bridge','prone'],['3×8 · 60–90 s','3×6 · 60–90 s','3×10 · 60–90 s','3×8 · 60–90 s']),make('bw-strength-b','Fuerza',['lunge','push','deadbug','prone'],['3×6/lado · 60–90 s','3×8 · 60–90 s','3×8/lado · 60–90 s','3×10 · 60–90 s']),make('bw-strength-c','Fuerza',['bridge','lunge','prone','deadbug'],['3×12 · 60–90 s','3×8/lado · 60–90 s','3×10 · 60–90 s','3×8/lado · 60–90 s']),make('bw-amrap','AMRAP',['squat','push','deadbug'],['10 rep','6 rep','8/lado']),make('bw-emom-a','EMOM',['squat','push','march'],['8 rep','6 rep','35 s']),make('bw-emom-b','EMOM',['lunge','bridge','march'],['6/lado','10 rep','35 s']),make('bw-recovery','Recuperación',['march'],['30 min'])]}
return {KEY,BACKUP,copy,equipment,exercises,defaults,weekKey,total,workoutOK,validate,migrate,safe,plan,merge,load,write,fingerprint,metrics,additions};
});
