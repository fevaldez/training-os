// Conditioning chronology is independent of both workout outcomes and strength rest.
import { PROGRAM } from './program.mjs';
import { createStore, LOCK } from './engine.mjs';
export const CONDITION_KEY = 'home-gym.v1.condition';
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const integer = (n,min,max) => Number.isSafeInteger(n) && n >= min && n <= max;
export function conditionSource(active) {
 const p=active.plan.conditioning;
 if(p)return p;
 // Explicit compatibility for an unfinished V4.1 session, not an arbitrary future plan.
 if(active.programVersion!==PROGRAM.programVersion)throw Error('condition-version-unavailable');
 return {...PROGRAM.plan[active.week-1],sourceSHA256:PROGRAM.sourceSHA256};
}
export function timeline(source,{cooldown=3,walk=15,modality='walk'}={}) {
 if(!integer(source.week,1,12)||!['walk','row','ski'].includes(modality))throw Error('invalid-condition-choice');
 if(source.week===6){
  if(!integer(walk,15,20)||modality!=='walk')throw Error('invalid-condition-choice');
  return [{kind:'walk',label:'Caminata continua suave',seconds:walk*60,cycle:0,effort:source.effort}];
 }
 if(![3,4,5].includes(cooldown)||!integer(source.intervals,1,10)||!integer(source.hard,1,300)||!integer(source.easy,1,300))throw Error('invalid-condition-choice');
 const phases=[{kind:'warmup',label:'Entrada en calor',seconds:300,cycle:0,effort:'Suave · ritmo conversacional'}];
 for(let cycle=1;cycle<=source.intervals;cycle++)phases.push(
  {kind:'effort',label:'Esfuerzo controlado',seconds:source.hard,cycle,effort:source.effort},
  {kind:'easy',label:'Recuperación suave',seconds:source.easy,cycle,effort:'Suave · ritmo conversacional'});
 phases.push({kind:'cooldown',label:'Cierre muy suave',seconds:cooldown*60,cycle:0,effort:'Muy suave · ritmo conversacional'});
 return phases;
}
export function conditionRange(week) {
 const p=typeof week==='object'?week:PROGRAM.plan[week-1];
 return p.week===6?'15–20 min':`${8+p.intervals*(p.hard+p.easy)/60}–${10+p.intervals*(p.hard+p.easy)/60} min`;
}
export function position(r,now=Date.now()) {
 const end=r.stoppedAt??now,elapsed=Math.max(0,Math.min(r.durationMs,end-r.startedAt));
 let offset=0,index=r.phases.length-1;
 for(let i=0;i<r.phases.length;i++){if(elapsed<offset+r.phases[i].seconds*1000){index=i;break;}offset+=r.phases[i].seconds*1000;}
 const reached=r.state==='time_reached'||r.state==='running'&&now>=r.endsAt;
 if(reached)return {index:r.phases.length-1,phase:r.phases.at(-1),remaining:0,elapsed:r.durationMs,reached:true};
 const before=r.phases.slice(0,index).reduce((n,p)=>n+p.seconds*1000,0);
 return {index,phase:r.phases[index],remaining:Math.max(0,before+r.phases[index].seconds*1000-elapsed),elapsed,reached:false};
}
export const clockChanged=(wallBefore,monoBefore,wallNow,monoNow)=>Math.abs((wallNow-wallBefore)-(monoNow-monoBefore))>5000;
export function validCondition(r,a) {
 if(!r||r.schema!==1||!a||a.session!=='C'||a.logs['condition:1']||r.sessionId!==a.id||r.programId!==a.programId
   ||r.programVersion!==a.programVersion||r.week!==a.week||typeof r.id!=='string'
   ||!['running','stopped_early','time_reached'].includes(r.state)||!integer(r.revision,1,Number.MAX_SAFE_INTEGER)
   ||!Number.isFinite(r.startedAt)||!Number.isFinite(r.endsAt)||!Number.isFinite(r.updatedAt)
   ||typeof r.clockWarning!=='boolean'||typeof r.sourceSHA256!=='string')return false;
 try {
  if(r.snapshot.week!==a.week||r.sourceSHA256!==r.snapshot.sourceSHA256||!same(timeline(r.snapshot,r.choices),r.phases))return false;
  if(a.plan.conditioning&&!same(a.plan.conditioning,r.snapshot))return false;
  if(r.durationMs!==r.phases.reduce((n,p)=>n+p.seconds*1000,0)||r.endsAt!==r.startedAt+r.durationMs)return false;
  if(r.state==='running')return r.stoppedAt===null;
  return Number.isFinite(r.stoppedAt)&&(r.state==='time_reached'?r.stoppedAt>=r.endsAt:r.stoppedAt<r.endsAt);
 } catch(_){return false;}
}
export function createConditionStore(storage,locks,{now=()=>Date.now()}={}) {
 const workout=createStore(storage,locks);
 const read=()=>{const raw=storage.getItem(CONDITION_KEY),a=workout.read().data.active;let parsed;try{parsed=JSON.parse(raw)}catch(_){}
  const record=validCondition(parsed,a)?parsed:null;return {raw,record,unusable:!!raw&&!record&&parsed?.sessionId===a?.id&&!a?.logs['condition:1']};};
 async function locked(fn){
  if(!locks?.request)throw Error('condition-lock-unavailable');
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),4000);
  try{return await locks.request(LOCK,{mode:'exclusive',signal:abort.signal},()=>{clearTimeout(timeout);return fn()})}finally{clearTimeout(timeout)}
 }
 function write(raw,record){
  if(storage.getItem(CONDITION_KEY)!==raw)throw Error('stale-condition');
  const text=JSON.stringify(record);storage.setItem(CONDITION_KEY,text);
  if(storage.getItem(CONDITION_KEY)!==text)throw Error('condition-read-back-failed');
  return {raw:text,record};
 }
 function checked(raw,a){
  if(storage.getItem(CONDITION_KEY)!==raw)throw Error('stale-condition');
  let r;try{r=JSON.parse(raw)}catch(_){}
  if(!validCondition(r,a))throw Error('condition-unavailable');return r;
 }
 return {
  read,
  start:(expectedWorkout,sessionId,choices={})=>locked(()=>{
   choices={cooldown:3,walk:15,modality:'walk',...choices};
   const current=workout.read(),a=current.data.active;
   if(current.raw!==expectedWorkout||a?.id!==sessionId||a.session!=='C'||a.logs['condition:1'])throw Error('active-conflict');
   const prior=read();if(prior.record)return prior;if(prior.unusable)throw Error('condition-unavailable');
   const snapshot=conditionSource(a),phases=timeline(snapshot,choices),durationMs=phases.reduce((n,p)=>n+p.seconds*1000,0),t=now();
   return write(prior.raw,{schema:1,id:crypto.randomUUID(),sessionId,programId:a.programId,programVersion:a.programVersion,
    sourceSHA256:snapshot.sourceSHA256,week:a.week,snapshot,choices:{...choices},phases,durationMs,
    startedAt:t,endsAt:t+durationMs,stoppedAt:null,state:'running',clockWarning:false,revision:1,updatedAt:t});
  }),
  stop:raw=>locked(()=>{
   const r=checked(raw,workout.read().data.active);if(r.state!=='running')return {raw,record:r};
   const t=now();return write(raw,{...r,state:t>=r.endsAt?'time_reached':'stopped_early',stoppedAt:t,
    clockWarning:r.clockWarning||t<r.startedAt,updatedAt:t,revision:r.revision+1});
  }),
  reach:raw=>locked(()=>{
   const r=checked(raw,workout.read().data.active),t=now();
   if(r.state==='time_reached')return {raw,record:r};
   if(r.state!=='running'||t<r.endsAt)throw Error('condition-time-not-reached');
   return write(raw,{...r,state:'time_reached',stoppedAt:t,updatedAt:t,revision:r.revision+1});
  }),
  flagClock:raw=>locked(()=>{
   const r=checked(raw,workout.read().data.active);if(r.clockWarning)return {raw,record:r};
   return write(raw,{...r,clockWarning:true,updatedAt:now(),revision:r.revision+1});
  }),
  outcome:async(expectedWorkout,sessionId,expectedTimer,value)=>{
   let bound;const verified={...value};
   const snap=await workout.conditionOutcome(expectedWorkout,sessionId,verified,a=>{
    if(storage.getItem(CONDITION_KEY)!==expectedTimer)throw Error('stale-condition');
    let parsed;try{parsed=JSON.parse(expectedTimer)}catch(_){}
    const r=validCondition(parsed,a)?parsed:null;bound=r;
    verified.clockWarning=!!r?.clockWarning;verified.conditionSnapshot=r?{programVersion:r.programVersion,sourceSHA256:r.sourceSHA256,phases:r.phases,choices:r.choices,startedAt:r.startedAt,endsAt:r.endsAt,stoppedAt:r.stoppedAt}:null;
    if(!['full','partial','not_performed'].includes(value.completionLevel)||!Number.isFinite(value.actualReportedSeconds)
      ||!integer(value.actualReportedSeconds,0,86400)||!integer(value.cyclesReported,0,r?.snapshot.intervals??10000)
      ||value.reviewed!==true||value.status!==(value.completionLevel==='not_performed'?'skipped':'done')
      ||value.completionLevel==='not_performed'&&(value.actualReportedSeconds!==0||value.cyclesReported!==0)
      ||value.completionLevel!=='not_performed'&&value.actualReportedSeconds===0)throw Error('invalid-condition-outcome');
    if(r?.state==='running'&&!position(r,now()).reached)throw Error('stop-before-outcome');
    if(value.completionLevel==='full'&&(!r||r.state==='stopped_early'||!position(r,now()).reached
      ||value.actualReportedSeconds<r.durationMs/1000||value.cyclesReported!==r.snapshot.intervals))throw Error('full-condition-not-confirmed');
    if(r?.clockWarning&&value.clockReviewed!==true)throw Error('clock-review-required');
    if(r&&value.modality!==r.choices.modality)throw Error('invalid-condition-outcome');
   });
   // Workout acknowledgement is authoritative. A failed optional tombstone cannot undo it.
   let timerWarning=false;
   if(bound)try{await locked(()=>{
    if(storage.getItem(CONDITION_KEY)!==expectedTimer)throw Error('stale-condition');
    const a=workout.read().data.active;
    if(a?.id!==sessionId||a.logs['condition:1']?.confirmedAt!==value.confirmedAt)throw Error('active-conflict');
    write(expectedTimer,{...bound,state:'recorded_'+value.completionLevel,updatedAt:now(),revision:bound.revision+1});
   })}catch(_){timerWarning=true;}
   return {snapshot:snap,timerWarning};
  },
  cancel:(expectedWorkout,sessionId,expectedTimer)=>workout.cancelCondition(expectedWorkout,sessionId,a=>{
   if(storage.getItem(CONDITION_KEY)!==expectedTimer)throw Error('stale-condition');
   let r;try{r=JSON.parse(expectedTimer)}catch(_){}
   if(validCondition(r,a)&&r.state==='running'&&!position(r,now()).reached)throw Error('stop-before-cancel');
  })
 };
}
