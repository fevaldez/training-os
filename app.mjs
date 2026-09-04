import {WORKOUTS, ORDER} from './program.mjs';
import {KG_PER_LB,toKg,fromKg,roundDisplay,parseRepRange,targetRIR,average,explainTempo,buildSequence,nextTransition,remainingSeconds,progressionDecision,sessionCompletion} from './engine.mjs';

const RELEASE='4.0.0-rc1';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={ok:false,test(){try{localStorage.setItem('__fv4test','1');localStorage.removeItem('__fv4test');this.ok=true}catch(e){this.ok=false}return this.ok},get(k,d=null){if(!this.ok)return d;try{const x=localStorage.getItem(k);return x===null?d:JSON.parse(x)}catch(e){return d}},set(k,v){if(!this.ok)return false;try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del(k){if(this.ok)try{localStorage.removeItem(k)}catch(e){}}};store.test();
let unit=store.get('fv4.unit',null)||store.get('tos_v3_display_unit','kg')||'kg',wake=null,ticker=null,lastAlarmAt=0;
const today=()=>new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
$('#todayDate').textContent=today();

function legacyMigrate(){
 if(store.get('fv4.migrated',false)) return;
 if(!store.get('fv4.history',null)){
   const old=store.get('tos_v3_history',[]);
   if(Array.isArray(old)&&old.length){
     const mapped=old.map(h=>({release:'3.x-migrated',id:h.id,workoutKey:h.workoutKey||h.workout,workoutName:h.workoutName||h.name,startedAt:h.startedAt||h.date,endedAt:h.endedAt||h.date,durationSec:h.durationSec||0,sets:(h.sets||[]).map(s=>({...s,weightKg:+(s.weightKg??s.kg??0)}))}));
     store.set('fv4.history',mapped);
   }
 }
 if(!store.get('fv4.unit',null)) store.set('fv4.unit',unit);
 store.set('fv4.migrated',true);
}
legacyMigrate();

const history=()=>store.get('fv4.history',[]);
const active=()=>store.get('fv4.active',null);
function saveActive(a){if(a){a.updatedAt=new Date().toISOString();store.set('fv4.active',a)}else store.del('fv4.active');renderHome()}
const fmtWeight=kg=>{if(!kg)return '';return String(roundDisplay(fromKg(+kg,unit),unit))};
function renderUnits(){$$('[data-unit]').forEach(b=>b.classList.toggle('active',b.dataset.unit===unit))}
function setUnit(u){unit=u==='lb'?'lb':'kg';store.set('fv4.unit',unit);renderUnits();if($('#sessionOverlay').classList.contains('open'))renderStage()}
$$('[data-unit]').forEach(b=>b.onclick=()=>setUnit(b.dataset.unit));

function previousWorkout(k){return history().slice().reverse().find(h=>h.workoutKey===k)}
function previousExerciseSets(k,name){const h=previousWorkout(k);return h?(h.sets||[]).filter(s=>s.exerciseName===name):[]}
function previousSet(k,name,si){const list=previousExerciseSets(k,name);return list.find(s=>Number(s.setIndex)===Number(si))||list[si]||list[0]||null}
function nextWorkoutKey(){const h=history();if(!h.length)return ORDER[0];const i=ORDER.indexOf(h[h.length-1].workoutKey);return ORDER[(i+1)%ORDER.length]}
function makeSession(k){return {schema:4,id:Date.now(),release:RELEASE,workoutKey:k,startedAt:new Date().toISOString(),index:0,state:'set',endsAt:0,restOriginal:0,last:null,drafts:{},logs:{}}}
function totalSets(k){return buildSequence(WORKOUTS[k]).length}
function renderHome(){
 const a=active(),k=nextWorkoutKey(),w=WORKOUTS[k];
 $('#nextWorkout').textContent=w.name;$('#nextGoal').textContent=w.goal;$('#startWorkout').onclick=()=>a?openSession():startSession(k);
 $('#startWorkout').textContent=a?'Reanudar sesión':'Iniciar sesión';
 $('#resumeCard').classList.toggle('show',!!a);
 if(a){const c=sessionCompletion(buildSequence(WORKOUTS[a.workoutKey]),a.logs);$('#resumeTitle').textContent=WORKOUTS[a.workoutKey].name;$('#resumeMeta').textContent=`${c.done}/${c.total} sets · ${a.state==='rest'?'descanso':a.state==='transition'?'biserie':'set activo'}`;$('#resumeBtn').onclick=openSession}
 renderUnits()
}
$$('.bottom button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));if(id==='program')renderProgram();if(id==='progress')renderProgress();scrollTo(0,0)}
function renderProgram(){$('#programCards').innerHTML=ORDER.map(k=>{const w=WORKOUTS[k];return `<div class="card"><span class="integrity ${w.sourceConfidence==='alta'?'':'med'}">${w.sourceConfidence} confidence</span><div class="eyebrow">${w.short}</div><h2>${w.name}</h2><p class="small">${w.note}</p>${w.exercises.map(e=>`<span class="pill">${e.name}</span>`).join('')}</div>`}).join('')}

function startSession(k){if(active())return openSession();saveActive(makeSession(k));openSession()}
async function requestWake(){try{if('wakeLock'in navigator){wake=await navigator.wakeLock.request('screen')}}catch(e){}}
function releaseWake(){try{wake&&wake.release()}catch(e){}wake=null}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active())requestWake();tick()});
function openSession(){if(!active())return;$('#sessionOverlay').classList.add('open');requestWake();renderStage()}
$('#closeSession').onclick=()=>{$('#sessionOverlay').classList.remove('open');releaseWake();renderHome()}

function current(a){const seq=buildSequence(WORKOUTS[a.workoutKey]);return {seq,item:seq[a.index]||null}}
function draftFor(a,item){
 const key=`${item.ei}_${item.si}`;if(a.drafts[key])return a.drafts[key];
 const e=WORKOUTS[a.workoutKey].exercises[item.ei],p=previousSet(a.workoutKey,e.name,item.si),decision=progressionDecision(e,previousExerciseSets(a.workoutKey,e.name));
 const r=parseRepRange(e.reps),d={weightKg:p?(+p.weightKg||0)*decision.factor:0,reps:p?(+p.reps||r.min):r.min,rir:p?.rir??targetRIR(e.rir),reason:p?decision.reason:'Primer baseline: encuentra una carga que deje el RIR objetivo.'};
 a.drafts[key]=d;saveActive(a);return d
}
function saveDraft(a,item,d){a.drafts[`${item.ei}_${item.si}`]=d;saveActive(a)}
function renderStage(){
 const a=active();if(!a)return;const w=WORKOUTS[a.workoutKey],{seq,item}=current(a),c=sessionCompletion(seq,a.logs);
 $('#sessionTitle').textContent=w.name;$('#sessionProgress').textContent=`${c.done}/${c.total} sets · ${c.pct}%`;renderUnits();
 if(a.state==='transition')return renderTransition(a,w,seq);
 if(a.state==='rest')return renderRest(a,w,seq);
 if(!item)return renderFinish(a,w);
 renderSet(a,w,seq,item)
}
function renderSet(a,w,seq,item){
 const e=w.exercises[item.ei],d=draftFor(a,item),prev=previousSet(a.workoutKey,e.name,item.si),nxt=seq[a.index+1];
 $('#sessionStage').innerHTML=`<div class="stage">
 <div class="state-label">Set activo · ${item.si+1}/${e.sets}</div><div class="exercise-title">${e.name}</div>
 <div class="specrow"><span class="spec">${e.reps} reps</span><span class="spec">RIR ${e.rir}</span><span class="spec">${e.rest}s descanso</span></div>
 <a class="video" href="${e.video}" target="_blank" rel="noopener">▶ Técnica en video ↗</a>
 <div class="tempo-box"><strong>CPEP / Tempo ${e.tempo}</strong><span class="small">${explainTempo(e.tempo)}<br><b>Orden:</b> excéntrica → pausa estirada → concéntrica → pausa contraída. X = explosivo con control.</span></div>
 ${prev?`<div class="previous"><b>Anterior:</b> ${fmtWeight(prev.weightKg)} ${unit} × ${prev.reps} @RIR ${prev.rir} · ${d.reason}</div>`:`<div class="previous">${d.reason}</div>`}
 <div class="control"><label>Peso · ${unit}</label><div class="stepper"><button id="wMinus">−5</button><input id="wInput" inputmode="decimal" value="${fmtWeight(d.weightKg)}" placeholder="—"><button id="wPlus">+5</button></div><div class="quickstep"><button data-w="-10">−10</button><button data-w="10">+10</button></div></div>
 <div class="control"><label>Repeticiones</label><div class="stepper"><button id="rMinus">−1</button><input id="rInput" inputmode="numeric" value="${d.reps||''}" placeholder="${parseRepRange(e.reps).min||'—'}"><button id="rPlus">+1</button></div></div>
 <div class="control"><label>RIR real</label><div class="rir">${[0,1,2,3].map(v=>`<button data-rir="${v}" class="${Number(d.rir)===v?'active':''}">${v===3?'3+':v}</button>`).join('')}</div></div>
 <div class="tip ${a.workoutKey==='legs'||a.workoutKey==='shoulders'?'guard':''}"><strong>Pro tip 1%</strong><br>${e.tip}</div>
 <button class="cta" id="completeSet">Completar set</button>
 <div class="next-mini">${nxt?`Después: ${w.exercises[nxt.ei].name} · set ${nxt.si+1}${nxt.superset?' · biserie':''}`:'Último set de la sesión'}</div></div>`;
 const sync=()=>{d.weightKg=toKg(parseFloat($('#wInput').value)||0,unit);d.reps=parseInt($('#rInput').value)||0;saveDraft(a,item,d)};
 $('#wInput').oninput=sync;$('#rInput').oninput=sync;
 const bump=x=>{$('#wInput').value=Math.max(0,(parseFloat($('#wInput').value)||0)+x);sync()};
 $('#wMinus').onclick=()=>bump(-5);$('#wPlus').onclick=()=>bump(5);$$('[data-w]').forEach(b=>b.onclick=()=>bump(+b.dataset.w));
 $('#rMinus').onclick=()=>{$('#rInput').value=Math.max(0,(parseInt($('#rInput').value)||0)-1);sync()};$('#rPlus').onclick=()=>{$('#rInput').value=(parseInt($('#rInput').value)||0)+1;sync()};
 $$('[data-rir]').forEach(b=>b.onclick=()=>{d.rir=+b.dataset.rir;saveDraft(a,item,d);$$('[data-rir]').forEach(x=>x.classList.toggle('active',x===b))});
 $('#completeSet').onclick=()=>completeSet(a,seq,item,e,d)
}
function completeSet(a,seq,item,e,d){
 if(!d.reps){alert('Captura reps antes de completar.');return}
 const key=`${item.ei}_${item.si}`;a.logs[key]={exerciseIndex:item.ei,exerciseName:e.name,setIndex:item.si,weightKg:+d.weightKg||0,reps:+d.reps||0,rir:d.rir,tempo:e.tempo,restSec:e.rest,completedAt:new Date().toISOString(),done:true};a.last=a.logs[key];
 const transition=nextTransition(seq,a.index,WORKOUTS[a.workoutKey]);a.index+=1;
 if(transition.type==='finish'){a.state='finish';a.endsAt=0}
 else if(transition.type==='superset-switch'){a.state='transition';a.endsAt=0}
 else {a.state='rest';a.restOriginal=transition.restSec;a.endsAt=transition.restSec?Date.now()+transition.restSec*1000:0}
 saveActive(a);renderStage();startTicker()
}
function renderTransition(a,w,seq){
 const next=seq[a.index],e=w.exercises[next.ei];
 $('#sessionStage').innerHTML=`<div class="stage transition"><div class="state-label">Biserie · sin descanso</div><div class="symbol">↔</div><div class="big">${e.name}</div><p class="sub">Set ${next.si+1}/${e.sets} · ${e.reps} · RIR ${e.rir}</p><div class="tempo-box" style="text-align:left"><strong>Tempo ${e.tempo}</strong><span class="small">${explainTempo(e.tempo)}</span></div><div class="tip" style="text-align:left"><strong>Pro tip 1%</strong><br>${e.tip}</div><a class="video" href="${e.video}" target="_blank" rel="noopener">▶ Video partner ↗</a><button class="cta" id="goPartner">Ir al partner</button></div>`;
 $('#goPartner').onclick=()=>{a.state='set';saveActive(a);renderStage()}
}
function fmtTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function renderRest(a,w,seq){
 const next=seq[a.index],e=next?w.exercises[next.ei]:null,s=remainingSeconds(a.endsAt),last=a.last;
 const previousItem=seq[a.index-1],nextIsSame=e&&last&&e.name===last.exerciseName;
 const afterPair=previousItem?.superset && previousItem.position==='second';
 $('#sessionStage').innerHTML=`<div class="stage rest"><div class="state-label">${s?'Descanso':'Listo'}</div><div class="rest-time ${s?'':'ready'}" id="restClock">${s?fmtTime(s):'READY'}</div>
 <div class="timercontrols"><button id="minus15">−15 s</button><button id="plus15">+15 s</button><button class="skip" id="skipRest">Saltar descanso</button></div>
 <div class="rest-last"><b>Último set:</b> ${last.exerciseName} · ${fmtWeight(last.weightKg)} ${unit} × ${last.reps} @RIR ${last.rir}</div>
 ${e?`<div class="rest-next"><div class="eyebrow">${afterPair?'Biserie completada · siguiente':nextIsSame?'Mismo ejercicio · siguiente':'Siguiente ejercicio'}</div><div class="big">${e.name} · Set ${next.si+1}/${e.sets}</div>${next.superset?`<span class="superset-badge">Biserie · partner: ${w.exercises[next.partner].name}</span>`:''}<div class="specrow" style="margin-top:9px"><span class="spec">${e.reps}</span><span class="spec">RIR ${e.rir}</span><span class="spec">Tempo ${e.tempo}</span></div><div class="tempo-box"><strong>${e.tempo}</strong><span class="small">${explainTempo(e.tempo)}</span></div><div class="tip"><strong>Pro tip 1%</strong><br>${e.tip}</div><a class="video" href="${e.video}" target="_blank" rel="noopener">▶ Video siguiente ↗</a></div><button class="startnext" id="startNext">Empezar siguiente set</button>`:`<div class="rest-next"><div class="big">Sesión completada</div></div><button class="startnext" id="finishNow">Finalizar sesión</button>`}</div>`;
 $('#minus15').onclick=()=>{a.endsAt=Math.max(Date.now(),a.endsAt-15000);saveActive(a);tick()};
 $('#plus15').onclick=()=>{a.endsAt=Math.max(Date.now(),a.endsAt)+15000;saveActive(a);tick()};
 $('#skipRest').onclick=()=>{a.endsAt=0;saveActive(a);tick()};
 if(e)$('#startNext').onclick=()=>{a.state='set';a.endsAt=0;saveActive(a);renderStage()};else $('#finishNow').onclick=()=>finishSession(a)
}
function startTicker(){if(!ticker)ticker=setInterval(tick,250)}
function tick(){const a=active();if(!a||a.state!=='rest')return;const c=$('#restClock');if(!c)return;const s=remainingSeconds(a.endsAt);c.textContent=s?fmtTime(s):'READY';c.classList.toggle('ready',!s);if(!s&&a.endsAt&&Date.now()-lastAlarmAt>1000){lastAlarmAt=Date.now();try{navigator.vibrate&&navigator.vibrate([100,70,100])}catch(e){}}}
function renderFinish(a,w){$('#sessionStage').innerHTML=`<div class="stage"><div class="eyebrow">Completado</div><h1>${w.name}</h1><button class="cta" id="finishSession">Finalizar sesión</button></div>`;$('#finishSession').onclick=()=>finishSession(a)}
function finishSession(a){const sets=Object.values(a.logs).filter(x=>x.done),ended=new Date().toISOString(),entry={schema:4,release:RELEASE,id:a.id,workoutKey:a.workoutKey,workoutName:WORKOUTS[a.workoutKey].name,startedAt:a.startedAt,endedAt:ended,durationSec:Math.round((new Date(ended)-new Date(a.startedAt))/1000),sets};const h=history();h.push(entry);store.set('fv4.history',h);saveActive(null);$('#sessionOverlay').classList.remove('open');releaseWake();renderProgress();showPage('progress')}
function renderProgress(){const h=history(),sets=h.flatMap(x=>x.sets||[]),vol=sets.reduce((a,x)=>a+(+x.weightKg||0)*(+x.reps||0),0);$('#storageHealth').textContent=store.ok?'Autosave ON':'Autosave OFF';$('#storageHealth').className='health '+(store.ok?'ok':'warn');$('#stats').textContent=`${h.length} sesiones · ${sets.length} sets`;$('#statsSub').textContent=`${Math.round(vol).toLocaleString('es-MX')} kg·reps normalizados`;$('#history').innerHTML=h.length?h.slice().reverse().slice(0,10).map(x=>`<div class="historyrow"><b>${x.workoutName}</b><br><span class="small">${new Date(x.endedAt).toLocaleDateString('es-MX')} · ${x.sets.length} sets · ${Math.round(x.durationSec/60)} min</span></div>`).join(''):'<span class="small">Aún no hay sesiones.</span>'}
$('#exportBtn').onclick=()=>{const data={schema:4,release:RELEASE,exportedAt:new Date().toISOString(),history:history(),active:active(),unit};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`training-os-${RELEASE}-backup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};
$('#importFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.history))throw new Error('Backup inválido');if(!confirm(`Importar ${d.history.length} sesiones?`))return;store.set('fv4.history',d.history);if(d.active)store.set('fv4.active',d.active);if(d.unit)setUnit(d.unit);renderHome();renderProgress();alert('Importación completa')}catch(err){alert(err.message)}e.target.value=''};
renderHome();renderProgress();renderUnits();startTicker();
window.__FV_QA__={release:RELEASE,storage:store.ok,unit,programs:ORDER.length};
if('serviceWorker'in navigator && location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
