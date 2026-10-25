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
// The prescription never changes. Cursor includes manual advances; played excludes
// paused time and unperformed phase remainders. Only user actions persist counters.
export function position(r,now=Date.now()) {
 const legacy=r.schema===1;
 const cursor=legacy?Math.max(0,Math.min(r.durationMs,(r.stoppedAt??now)-r.startedAt)):
  Math.min(r.durationMs,r.cursorMs+(r.state==='running'?Math.max(0,now-r.segmentStartedAt):0));
 const elapsed=r.state==='time_reached'?r.durationMs:cursor;
 const played=legacy?elapsed:Math.min(r.durationMs,r.playedMs+Math.max(0,elapsed-r.cursorMs));
 let offset=0,index=r.phases.length-1;
 for(let i=0;i<r.phases.length;i++){if(elapsed<offset+r.phases[i].seconds*1000){index=i;break;}offset+=r.phases[i].seconds*1000;}
 const reached=r.state==='time_reached'||elapsed>=r.durationMs;
 const before=r.phases.slice(0,index).reduce((n,p)=>n+p.seconds*1000,0);
 return {index,phase:r.phases[index],remaining:reached?0:Math.max(0,before+r.phases[index].seconds*1000-elapsed),elapsed,played,reached};
}
export const clockChanged=(wallBefore,monoBefore,wallNow,monoNow)=>Math.abs((wallNow-wallBefore)-(monoNow-monoBefore))>5000;
export function validCondition(r,a) {
 if(!r||![1,2].includes(r.schema)||!a||a.session!=='C'||a.logs['condition:1']||r.sessionId!==a.id||r.programId!==a.programId
   ||r.programVersion!==a.programVersion||r.week!==a.week||typeof r.id!=='string'
   ||!['running','paused','stopped_early','time_reached'].includes(r.state)||!integer(r.revision,1,Number.MAX_SAFE_INTEGER)
   ||!Number.isFinite(r.startedAt)||!Number.isFinite(r.updatedAt)||typeof r.clockWarning!=='boolean'||typeof r.sourceSHA256!=='string')return false;
 try {
  if(r.snapshot.week!==a.week||r.sourceSHA256!==r.snapshot.sourceSHA256||!same(timeline(r.snapshot,r.choices),r.phases))return false;
  if(a.plan.conditioning&&!same(a.plan.conditioning,r.snapshot))return false;
  if(r.durationMs!==r.phases.reduce((n,p)=>n+p.seconds*1000,0))return false;
  if(r.schema===1){
   if(!Number.isFinite(r.endsAt)||r.endsAt!==r.startedAt+r.durationMs||r.state==='paused')return false;
   if(r.state==='running')return r.stoppedAt===null;
   return Number.isFinite(r.stoppedAt)&&(r.state==='time_reached'?r.stoppedAt>=r.endsAt:r.stoppedAt<r.endsAt);
  }
  if(!integer(r.cursorMs,0,r.durationMs)||!integer(r.playedMs,0,r.cursorMs)||!Number.isFinite(r.segmentStartedAt)||!Array.isArray(r.events))return false;
  if(r.events.some(e=>!['pause','resume','next','skip','cooldown','stop'].includes(e.type)||!Number.isFinite(e.at)
    ||!integer(e.phase,0,r.phases.length-1)||!integer(e.fromMs,0,e.toMs)||!integer(e.toMs,e.fromMs,r.durationMs)))return false;
  if(r.events.reduce((n,e)=>n+e.toMs-e.fromMs,0)!==r.cursorMs-r.playedMs)return false;
  if(r.state==='running')return r.endsAt===r.segmentStartedAt+r.durationMs-r.cursorMs&&r.stoppedAt===null;
  if(r.state==='paused')return r.endsAt===null&&r.remainingMs===r.durationMs-r.cursorMs&&r.stoppedAt===null;
  return Number.isFinite(r.stoppedAt)&&(r.state!=='time_reached'||r.cursorMs===r.durationMs);
 }catch(_){return false;}
}
function settled(r,t) {
 const p=position(r,t),next={...r,schema:2,cursorMs:p.elapsed,playedMs:p.played,segmentStartedAt:t,events:r.events||[]};
 if(r.schema===1&&r.state==='running')next.endsAt=t+r.durationMs-p.elapsed;
 return next;
}
export function stoppedCondition(r,t=Date.now()) {
 const next=settled(r,t),p=position(r,t);
 return {...next,state:p.reached?'time_reached':'stopped_early',stoppedAt:t};
}
export function guidedResult(r,now=Date.now()) {
 if(!r)return {seconds:0,cycles:0,level:'not_performed',advancedMs:0};
 const p=position(r,now),events=r.events||[],seconds=Math.floor(p.played/1000),advancedMs=p.elapsed-p.played;
 let offset=0,cycles=0;
 for(const phase of r.phases){const start=offset;offset+=phase.seconds*1000;
  if(phase.kind==='easy'&&offset<=p.elapsed){
   const effort=r.phases.find(x=>x.kind==='effort'&&x.cycle===phase.cycle),pairStart=start-effort.seconds*1000;
   if(!events.some(e=>e.toMs>e.fromMs&&e.fromMs<offset&&e.toMs>pairStart))cycles++;
  }
 }
 return {seconds,cycles,advancedMs,level:!seconds?'not_performed':p.reached&&r.state!=='stopped_early'&&!advancedMs&&!r.clockWarning?'full':'partial'};
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
 function guard(expectedTimer,value){return a=>{
  if(storage.getItem(CONDITION_KEY)!==expectedTimer)throw Error('stale-condition');
  let parsed;try{parsed=JSON.parse(expectedTimer)}catch(_){}
  const r=validCondition(parsed,a)?parsed:null;
  const verified=r&&guidedResult(r,now());
  if(!['full','partial','not_performed'].includes(value.completionLevel)||!integer(value.actualReportedSeconds,0,86400)
    ||!integer(value.cyclesReported,0,r?.snapshot.intervals??10000)||value.reviewed!==true
    ||value.status!==(value.completionLevel==='not_performed'?'skipped':'done')
    ||value.completionLevel==='not_performed'&&(value.actualReportedSeconds!==0||value.cyclesReported!==0)
    ||value.completionLevel!=='not_performed'&&value.actualReportedSeconds===0)throw Error('invalid-condition-outcome');
  if(r&&['running','paused'].includes(r.state)&&!position(r,now()).reached)throw Error('stop-before-outcome');
  if(value.completionLevel==='full'&&(!r||verified.level!=='full'||value.actualReportedSeconds<r.durationMs/1000||value.cyclesReported!==r.snapshot.intervals))throw Error('full-condition-not-confirmed');
  if(r?.clockWarning&&value.clockReviewed!==true)throw Error('clock-review-required');
  if(r&&value.modality!==r.choices.modality)throw Error('invalid-condition-outcome');
  value.clockWarning=!!r?.clockWarning;
  value.conditionSnapshot=r?{schema:r.schema,programVersion:r.programVersion,sourceSHA256:r.sourceSHA256,phases:r.phases,choices:r.choices,
   startedAt:r.startedAt,endsAt:r.endsAt,stoppedAt:r.stoppedAt,playedMs:position(r,now()).played,advancedMs:verified.advancedMs,events:r.events||[]}:null;
 };}
 async function control(raw,type){return locked(()=>{
  const r=checked(raw,workout.read().data.active),t=now();
  if(!['running','paused'].includes(r.state))throw Error('condition-not-active');
  let next=settled(r,t);const p=position(next,t),fromMs=p.elapsed;
  if(type==='pause'){
   if(r.state!=='running')throw Error('condition-not-running');
   Object.assign(next,{state:p.reached?'time_reached':'paused',endsAt:null,remainingMs:r.durationMs-fromMs,stoppedAt:p.reached?t:null});
  }else if(type==='resume'){
   if(r.state!=='paused')throw Error('condition-not-paused');
   Object.assign(next,{state:'running',endsAt:t+r.durationMs-fromMs,stoppedAt:null});delete next.remainingMs;
  }else{
   let target=p.index+1;
   if(type==='cooldown')target=r.phases.findIndex((x,i)=>i>p.index&&x.kind==='cooldown');
   if(target<0)throw Error('no-next-phase');
   next.cursorMs=r.phases.slice(0,target).reduce((sum,x)=>sum+x.seconds*1000,0);
   if(next.cursorMs>=r.durationMs){next.state='time_reached';next.stoppedAt=t;}
   next.endsAt=next.state==='paused'?null:t+r.durationMs-next.cursorMs;
   if(next.state==='paused')next.remainingMs=r.durationMs-next.cursorMs;
  }
  next.events=[...next.events,{type,at:t,phase:p.index,fromMs,toMs:next.cursorMs}];
  return write(raw,{...next,updatedAt:t,revision:r.revision+1,clockWarning:r.clockWarning||t<r.updatedAt});
 });}
 return {
  read,
  start:(expectedWorkout,sessionId,choices={})=>locked(()=>{
   choices={cooldown:3,walk:15,modality:'walk',...choices};
   const current=workout.read(),a=current.data.active;
   if(current.raw!==expectedWorkout||a?.id!==sessionId||a.session!=='C'||a.logs['condition:1'])throw Error('active-conflict');
   const prior=read();if(prior.record)return prior;if(prior.unusable)throw Error('condition-unavailable');
   const snapshot=conditionSource(a),phases=timeline(snapshot,choices),durationMs=phases.reduce((n,p)=>n+p.seconds*1000,0),t=now();
   return write(prior.raw,{schema:2,id:crypto.randomUUID(),sessionId,programId:a.programId,programVersion:a.programVersion,sourceSHA256:snapshot.sourceSHA256,
    week:a.week,snapshot,choices:{...choices},phases,durationMs,startedAt:t,endsAt:t+durationMs,segmentStartedAt:t,cursorMs:0,playedMs:0,events:[],stoppedAt:null,state:'running',clockWarning:false,revision:1,updatedAt:t});
  }),
  pause:raw=>control(raw,'pause'),resume:raw=>control(raw,'resume'),advance:(raw,type)=>{
   if(!['next','skip','cooldown'].includes(type))return Promise.reject(Error('invalid-condition-action'));return control(raw,type);
  },
  stop:(raw,at=now())=>locked(()=>{
   const r=checked(raw,workout.read().data.active);if(!['running','paused'].includes(r.state))return {raw,record:r};
   const t=Math.max(r.segmentStartedAt??r.startedAt,Math.min(now(),at)),next=stoppedCondition(r,t),p=position(next,t);
   return write(raw,{...next,events:[...next.events,{type:'stop',at:t,phase:p.index,fromMs:p.elapsed,toMs:p.elapsed}],clockWarning:r.clockWarning||now()<r.updatedAt,updatedAt:now(),revision:r.revision+1});
  }),
  reach:raw=>locked(()=>{
   const r=checked(raw,workout.read().data.active),t=now();if(r.state==='time_reached')return {raw,record:r};
   if(r.state!=='running'||!position(r,t).reached)throw Error('condition-time-not-reached');
   return write(raw,{...settled(r,t),state:'time_reached',stoppedAt:t,updatedAt:t,revision:r.revision+1});
  }),
  flagClock:raw=>locked(()=>{
   const r=checked(raw,workout.read().data.active);if(r.clockWarning)return {raw,record:r};
   return write(raw,{...r,clockWarning:true,updatedAt:now(),revision:r.revision+1});
  }),
  // Compatibility for old consumers: this method still acknowledges only a log.
  outcome:async(expectedWorkout,sessionId,expectedTimer,value)=>{
   const verified={...value},snapshot=await workout.conditionOutcome(expectedWorkout,sessionId,verified,guard(expectedTimer,verified));
   let timerWarning=false;
   try{await locked(()=>{const r=JSON.parse(expectedTimer);if(r)write(expectedTimer,{...r,state:'recorded_'+value.completionLevel,updatedAt:now(),revision:r.revision+1});});}catch(_){timerWarning=true;}
   return {snapshot,timerWarning};
  },
  finalize:(expectedWorkout,sessionId,expectedTimer,value)=>{
   const verified={...value};return workout.finishCondition(expectedWorkout,sessionId,verified,guard(expectedTimer,verified));
  },
  cancel:(expectedWorkout,sessionId,expectedTimer)=>workout.cancelCondition(expectedWorkout,sessionId,a=>{
   if(storage.getItem(CONDITION_KEY)!==expectedTimer)throw Error('stale-condition');
   let r;try{r=JSON.parse(expectedTimer)}catch(_){}
   if(validCondition(r,a)&&['running','paused'].includes(r.state)&&!position(r,now()).reached)throw Error('stop-before-cancel');
  })
 };
}
