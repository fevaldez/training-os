// A nonessential, session-scoped clock. Workout data is only read, never written here.
import { PROGRAM } from './program.mjs';
import { createStore, LOCK, setKeys } from './engine.mjs';
export const REST_KEY='home-gym.v1.rest';
export function restDuration(text) {
 const m=String(text).trim().match(/^(\d+)\s*(?:[–—-]\s*(\d+)\s*)?s$/i);
 if(!m)return null;
 const min=Number(m[1]),max=Number(m[2]||m[1]);
 return min>0&&max>=min&&Number.isSafeInteger(max*1000)?{minMs:min*1000,maxMs:max*1000}:null;
}
export function nextRestSet(active,sourceKey) {
 const keys=setKeys(active.plan),i=keys.indexOf(sourceKey);
 return i<0?null:keys.slice(i+1).find(k=>!active.logs[k]||active.drafts?.[k])||null;
}
export const remainingMs=(r,now=Date.now())=>r?.state==='running'?Math.max(0,r.endsAt-now):r?.state==='paused'?r.remainingMs:0;
export const restState=(r,now=Date.now())=>r?.state==='running'&&remainingMs(r,now)===0?'expired':r?.state;
export const restTime=ms=>{const s=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
export function validRest(r,a) {
 if(!r||r.schema!==1||r.programId!==PROGRAM.programId||!a||r.sessionId!==a.id||a.programId!==r.programId
  ||typeof r.id!=='string'||!['running','paused','expired','skipped','manual'].includes(r.state)
  ||!Number.isSafeInteger(r.revision)||r.revision<1||!Number.isFinite(r.updatedAt)
  ||typeof r.sourceKey!=='string'||typeof r.nextKey!=='string'||typeof r.sourceConfirmedAt!=='string')return false;
 const source=a.logs[r.sourceKey],exercise=a.plan.exercises.find(e=>r.sourceKey.startsWith(e.id+':'));
 if(source?.status!=='done'||a.drafts?.[r.sourceKey]||source.confirmedAt!==r.sourceConfirmedAt
  ||!exercise||r.prescribedRest!==exercise.rest||!setKeys(a.plan).includes(r.nextKey)
  ||a.logs[r.nextKey]&&!a.drafts?.[r.nextKey]||nextRestSet(a,r.sourceKey)!==r.nextKey)return false;
 const parsed=restDuration(exercise.rest);
 if(r.prescribedMs!==(parsed?.minMs??null)||!(r.originalDurationMs===null||Number.isSafeInteger(r.originalDurationMs)&&r.originalDurationMs>0))return false;
 if(r.state==='running')return Number.isFinite(r.endsAt)&&r.endsAt>=0&&r.remainingMs===null&&r.originalDurationMs!==null;
 if(r.state==='paused')return r.endsAt===null&&Number.isFinite(r.remainingMs)&&r.remainingMs>=0&&r.originalDurationMs!==null;
 return r.endsAt===null&&r.remainingMs===0;
}
export function createRestStore(storage,locks,{now=()=>Date.now()}={}) {
 const workout=createStore(storage,locks);
 const read=()=>{const raw=storage.getItem(REST_KEY),active=workout.read().data.active;let record=null;try{record=raw===null?null:JSON.parse(raw)}catch(_){}
  return {raw,record:validRest(record,active)?record:null};};
 // Reuse the existing Home Gym write lock, including its bounded wait. No new lock domain.
 async function locked(fn) {
  if(!locks?.request)throw Error('timer-lock-unavailable');
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),4000);
  try{return await locks.request(LOCK,{mode:'exclusive',signal:abort.signal},()=>{clearTimeout(timer);return fn()})}finally{clearTimeout(timer)}
 }
 function write(expected,record) {
  if(storage.getItem(REST_KEY)!==expected)throw Error('stale-timer');
  const text=JSON.stringify(record);storage.setItem(REST_KEY,text);
  if(storage.getItem(REST_KEY)!==text)throw Error('timer-read-back-failed');
  return {raw:text,record};
 }
 return {
  read,
  start:(sessionId,sourceKey)=>locked(()=>{
   const a=workout.read().data.active,source=a?.logs?.[sourceKey];
   if(a?.id!==sessionId||source?.status!=='done'||a.drafts?.[sourceKey]||typeof source.confirmedAt!=='string')return {raw:null,record:null};
   const nextKey=nextRestSet(a,sourceKey);if(!nextKey)return {raw:null,record:null};
   const previous=read();
   // A repeated acknowledgement/render cannot reset or revive the same rest.
   if(previous.record?.sourceKey===sourceKey&&previous.record.sourceConfirmedAt===source.confirmedAt)return previous;
   const prescribedRest=a.plan.exercises.find(e=>sourceKey.startsWith(e.id+':')).rest,duration=restDuration(prescribedRest)?.minMs??null,t=now();
   return write(previous.raw,{schema:1,programId:PROGRAM.programId,sessionId,id:crypto.randomUUID(),sourceKey,sourceConfirmedAt:source.confirmedAt,nextKey,
    state:duration===null?'manual':'running',endsAt:duration===null?null:t+duration,remainingMs:duration===null?0:null,
    prescribedRest,prescribedMs:duration,originalDurationMs:duration,updatedAt:t,revision:1});
  }),
  change:(expected,action,value)=>locked(()=>{
   const current=read();if(!current.record||current.raw!==expected)throw Error('stale-timer');
   const r={...current.record},t=now(),left=remainingMs(r,t);
   if(action==='pause'&&r.state==='running'){r.state=left?'paused':'expired';r.remainingMs=left;r.endsAt=null;}
   else if(action==='resume'&&r.state==='paused'){r.state=left?'running':'expired';r.endsAt=left?t+left:null;r.remainingMs=left?null:0;}
   else if(action==='adjust'&&r.originalDurationMs!==null&&[-15000,15000].includes(value)){
    if(r.state==='paused'){r.remainingMs=Math.max(0,left+value);if(r.remainingMs===0)r.state='expired';}
    else if(['running','expired'].includes(r.state)){const next=Math.max(0,left+value);r.state=next?'running':'expired';r.endsAt=next?t+next:null;r.remainingMs=next?null:0;}
    else throw Error('timer-action-unavailable');
   }
   else if(action==='manual'&&r.state==='manual'&&Number.isSafeInteger(value)&&value>0){r.originalDurationMs=value;r.state='running';r.endsAt=t+value;r.remainingMs=null;}
   else if(action==='reset'&&r.originalDurationMs!==null){r.state='running';r.endsAt=t+r.originalDurationMs;r.remainingMs=null;}
   else if(action==='skip'){r.state='skipped';r.endsAt=null;r.remainingMs=0;}
   else if(action==='expire'&&r.state==='running'&&left===0){r.state='expired';r.endsAt=null;r.remainingMs=0;}
   else throw Error('timer-action-unavailable');
   r.updatedAt=t;r.revision++;
   return write(current.raw,r);
  }),
  invalidate:sessionId=>locked(()=>{
   const raw=storage.getItem(REST_KEY);let record;try{record=JSON.parse(raw)}catch(_){return;}
   if(record?.sessionId!==sessionId)return;
   write(raw,{...record,state:'skipped',endsAt:null,remainingMs:0,updatedAt:now(),revision:(record.revision||0)+1});
  })
 };
}
