import { PROGRAM } from './program.mjs';
import { createConditionStore, CONDITION_KEY, conditionSource, conditionRange, timeline, position, clockChanged } from './condition.mjs';
import { restTime } from './rest.mjs';
export { CONDITION_KEY, conditionRange };
export function createConditionUI(o) {
 const {$,h,visual,store}=o,timer=createConditionStore(localStorage,navigator.locks);
 let snap={raw:null,record:null},ticker=null,pending=false,localStop=null,manual=false,missed=false,lastPhase=null,anchor=null,reachRaw=null;
 let tone=null,audio=null,sound=false,soundMessage='',wake=null,wakeWanted=false,wakeMessage='Pantalla: control del dispositivo.';
 const current=()=>localStop||snap.record;
 const visible=()=>o.view()==='condicion';
 const active=()=>o.snapshot().data.active;
 const warning=text=>{const el=$('#conditionWarning');el.hidden=!text;el.textContent=text||'';};
 function stopTicker(){if(ticker!==null)clearInterval(ticker);ticker=null;document.documentElement.dataset.conditionTicker='stopped';}
 function releaseWake(){const held=wake;wake=null;if(held)void held.release().catch(()=>{});}
 async function requestWake(){
  if(!wakeWanted||wake||!visible()||document.visibilityState==='hidden'||current()?.state!=='running')return;
  if(!navigator.wakeLock){wakeMessage='Pantalla: función opcional no disponible.';return;}
  try{wake=await navigator.wakeLock.request('screen');wakeMessage='Pantalla activa mientras el navegador lo permita.';
   wake.addEventListener('release',()=>{wake=null;wakeMessage='Pantalla: el dispositivo liberó el bloqueo.';paint();});
  }catch(_){wakeMessage='Pantalla: no se pudo mantener activa; usa el control del dispositivo.';}
 }
 function silence(){if(tone){try{tone.stop()}catch(_){}tone=null;}}
 function cue(){
  if(!sound||document.visibilityState==='hidden'||audio?.state!=='running'||localStop)return;
  try{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);
   gain.gain.setValueAtTime(0.07,audio.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+0.13);
   tone=oscillator;oscillator.frequency.value=660;oscillator.start();oscillator.stop(audio.currentTime+0.14);
  }catch(_){sound=false;soundMessage='Sonido no disponible. Sigue las indicaciones visibles.';}
 }
 async function toggleSound(){
  if(sound){sound=false;soundMessage='Sonido desactivado.';paint();return;}
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio??=new Audio();await audio.resume();
   sound=audio.state==='running';soundMessage=sound?'Sonido opcional solo en primer plano.':'Sonido no disponible; usa las indicaciones visibles.';
  }catch(_){sound=false;soundMessage='Sonido no disponible; usa las indicaciones visibles.';}paint();
 }
 function sync({returning=false}={}){
  try{
   const before=snap.record;snap=timer.read();
   if(localStop&&(localStop.sessionId!==active()?.id||snap.record?.id!==localStop.id||snap.record?.state!=='running'))localStop=null;
   if(returning&&snap.record){missed=true;lastPhase=null;}
   if(before?.id!==snap.record?.id){lastPhase=null;manual=false;}
   if(snap.unusable)warning('No se pudo verificar el reloj guardado. Tus registros siguen intactos. Puedes declarar lo realizado manualmente.');
   if(snap.record&&Date.now()<snap.record.updatedAt&&!snap.record.clockWarning)flagClock();
  }catch(_){warning('No se pudo leer el reloj. No se confirma persistencia; conserva tu respaldo.');}
  anchor={wall:Date.now(),mono:performance.now()};paint();
 }
 function flagClock(){
  if(!snap.record||snap.record.clockWarning)return;
  const expected=snap.raw;snap.record={...snap.record,clockWarning:true};
  void timer.flagClock(expected).then(result=>{snap=result;paint();}).catch(()=>warning('La hora del dispositivo cambió o no pudo verificarse. Revisa el resultado real; no se confirmó el aviso en almacenamiento.'));
 }
 function tick(){
  if(document.visibilityState==='hidden'){stopTicker();return;}
  const wall=Date.now(),mono=performance.now();
  if(anchor&&clockChanged(anchor.wall,anchor.mono,wall,mono))flagClock();
  anchor={wall,mono};paint();
 }
 function phaseCopy(p,r){
  const technique=r.choices.modality==='row'?'Remo: usa solo una técnica que ya domines; conserva un movimiento controlado.':r.choices.modality==='ski'?'SkiErg: usa solo una técnica que ya domines; conserva un movimiento controlado.':'Camina con pasos controlados; conserva una postura cómoda y el área despejada.';
  const cue=p.kind==='effort'?'Respeta el RPE. Sin sprints; mantén control de la respiración.':p.kind==='walk'?'Camina muy suave, a ritmo conversacional. Sin intervalos.':'Ritmo suave y conversacional; recupera sin prisas.';
  return [cue,technique,PROGRAM.guidance.cardioTalk];
 }
 function guideHTML(){
  const r=current(),p=r?position(r).phase:timeline(conditionSource(active()?.session==='C'?active():{week:o.week(),programVersion:PROGRAM.programVersion,plan:{}}),choices())[0];
  const ref=r||{choices:choices()},copy=phaseCopy(p,ref),icon=ref.choices.modality==='row'?'rower':ref.choices.modality==='ski'?'ski':'treadmill';
  return `<div class="guide-heading"><p class="eyebrow">GUÍA AMPLIADA · ${r?'el reloj sigue':'planificar'}</p><h2 id="guideTitle">${h(p.label)}</h2><time id="conditionGuideClock">${r?restTime(position(r).remaining):''}</time></div><div class="guide-body">${visual(icon,p.label)}<p class="condition-effort">${h(p.effort)}</p>${copy.map(text=>`<p>${h(text)}</p>`).join('')}<p class="resource" data-resource-status="UNVERIFIED">UNVERIFIED · Vídeo no verificado. Ilustración de referencia; guía escrita disponible sin conexión.</p><details><summary>Seguridad</summary><p>${h(PROGRAM.guidance.safety)}</p><p>${h(PROGRAM.guidance.cardioAlternatives)}</p></details></div><div class="guide-dock">${r?.state==='running'&&!position(r).reached?'<button class="btn danger" id="guideStopCondition">Detener entrenamiento</button>':''}<button class="btn secondary" id="closeConditionGuide">Volver ${r?'al entrenamiento':'al plan'}</button></div>`;
 }
 function renderGuide(){
  const dialog=$('#conditionGuide');if(!dialog.open)return;
  const focused=document.activeElement?.id;$('#conditionGuideContent').innerHTML=guideHTML();
  $('#closeConditionGuide').onclick=()=>dialog.close();if($('#guideStopCondition'))$('#guideStopCondition').onclick=()=>{dialog.close();void stop();};
  if(focused&&$('#'+focused))$('#'+focused).focus({preventScroll:true});
 }
 function openGuide(){
  const dialog=$('#conditionGuide');dialog.showModal();renderGuide();$('#closeConditionGuide').focus({preventScroll:true});
 }
 function choices(){return {cooldown:Number($('#conditionCooldown')?.value||3),walk:Number($('#conditionWalk')?.value||15),modality:$('#conditionModality')?.value||'walk'};}
 async function begin(){
  if(pending)return;pending=true;const selected=choices();wakeWanted=!!$('#conditionWake')?.checked;
  $('#startSession').disabled=true;
  try{
   let a=active();
   if(!a){const ok=await o.write(raw=>store.start(raw,o.week(),'C'),'Sesión iniciada; comprobando reloj.');if(!ok)return;a=active();}
   snap=await timer.start(o.snapshot().raw,a.id,selected);localStop=null;manual=false;missed=false;lastPhase=null;warning('');
   o.notice('Entrenamiento iniciado · reloj guardado.');o.render();await requestWake();$('#conditionPhase')?.focus({preventScroll:true});
  }catch(_){warning('No se confirmó el inicio persistente del reloj. No se registró actividad. Vuelve a leer los datos antes de reintentar.');sync();o.render();}
  finally{pending=false;if($('#startSession'))$('#startSession').disabled=false;}
 }
 async function stop(){
  const r=current();if(!r||r.state!=='running')return;
  // Immediate local safety action, before waiting on a lock or persistence.
  const expected=snap.raw,t=Date.now();localStop={...r,stoppedAt:t,state:t>=r.endsAt?'time_reached':'stopped_early'};
  sound=false;silence();stopTicker();releaseWake();o.render();$('#conditionOutcomeTitle')?.focus({preventScroll:true});
  await persistStop(expected);
 }
 async function persistStop(expected=snap.raw){
  if(pending)return;
  if(localStop&&localStop.id!==snap.record?.id){warning('Otra sesión reemplazó este reloj. Vuelve a leer los datos; no se detuvo la sesión nueva.');return;}
  pending=true;
  try{snap=await timer.stop(expected);localStop=null;warning('');o.notice('Detención guardada · confirma resultado.');o.render();}
  catch(_){warning('Detenido en esta pantalla. No se confirmó la detención guardada: al reabrir podría reaparecer el reloj anterior. Reintenta guardar la detención.');o.render();}
  finally{pending=false;}
 }
 function form(a,r){
  const d=a.drafts?.['condition:1']||{},reached=!!r&&position(r).reached&&r.state!=='stopped_early',cycles=r?.snapshot.intervals??a.plan.conditioning?.intervals??(a.programVersion===PROGRAM.programVersion?PROGRAM.plan[a.week-1].intervals:null);
  return `<div class="condition-outcome">${!r?'<details><summary>Protocolo guardado de esta sesión</summary><p>'+h(a.plan.protocol||'Sin protocolo verificable; conserva el registro anterior.')+'</p></details>':''}<h2 id="conditionOutcomeTitle" tabindex="-1">${localStop?'Detención local · pendiente de guardar':reached?'Objetivo de tiempo alcanzado':r?'Entrenamiento detenido':'Declaración manual'}</h2><p>El reloj no demuestra actividad. Declara lo que realmente hiciste. Un parcial ocupa la sesión C de esta semana; no añade otra sesión.</p><p id="conditionOutcomeClockWarning" class="timer-warning" ${r?.clockWarning?'':'hidden'}>La hora del dispositivo cambió o no pudo verificarse. Revisa especialmente el tiempo y los ciclos reales.</p>${localStop?'<button class="btn secondary" id="retryConditionStop">Reintentar guardar detención</button>':''}<label for="conditionLevel">Resultado real</label><select id="conditionLevel"><option value="">Elige un resultado</option>${reached?'<option value="full">Completo · todas las fases elegidas</option>':''}<option value="partial">Parcial · hice parte del entrenamiento</option><option value="not_performed">No realizado · ninguna actividad</option></select><div class="reported-time"><label>Minutos reales<input id="conditionMinutes" inputmode="numeric" value="${h(d.reportMinutes||'')}" maxlength="4" placeholder="—"></label><label>Segundos adicionales<input id="conditionSeconds" inputmode="numeric" value="${h(d.reportSeconds||'')}" maxlength="2" placeholder="0–59"></label></div>${cycles===null?'<label for="conditionCycles">Ciclos reales del plan anterior</label><input id="conditionCycles" inputmode="numeric" maxlength="4" placeholder="—">':cycles?`<label for="conditionCycles">Ciclos realmente realizados</label><select id="conditionCycles"><option value="">Elige</option>${Array.from({length:cycles+1},(_,n)=>`<option value="${n}">${n}</option>`).join('')}</select>`:'<p>Sin ciclos: caminata continua.</p>'}<label for="conditionNote">Nota opcional</label><textarea id="conditionNote" maxlength="2000">${h(d.note||'')}</textarea><label class="review-check"><input type="checkbox" id="conditionReviewed" ${d.reviewed?'checked':''}> Confirmo la actividad, duración y ciclos reales; revisé cualquier cambio de hora.</label><p id="conditionFormError" role="alert" class="field-error"></p><button class="btn primary" id="saveConditionOutcome" ${localStop?'disabled':''}>Guardar resultado declarado</button><button class="text-button" id="cancelCondition">Cancelar inicio accidental sin registro</button></div>`;
 }
 function bindForm(a,r){
  const d=a.drafts?.['condition:1']||{};$('#conditionLevel').value=d.completionLevel||'';if($('#conditionCycles'))$('#conditionCycles').value=d.cyclesReported??'';
  const draft=()=>({weight:'',reps:'',note:$('#conditionNote').value,completionLevel:$('#conditionLevel').value,
   reportMinutes:$('#conditionMinutes').value,reportSeconds:$('#conditionSeconds').value,cyclesReported:$('#conditionCycles')?.value??'0',reviewed:$('#conditionReviewed').checked});
  for(const id of ['conditionLevel','conditionMinutes','conditionSeconds','conditionCycles','conditionNote','conditionReviewed'])if($('#'+id))$('#'+id).addEventListener('input',()=>{
   if(id==='conditionLevel'&&$('#conditionLevel').value==='not_performed'){$('#conditionMinutes').value='0';$('#conditionSeconds').value='0';if($('#conditionCycles'))$('#conditionCycles').value='0';}
   const value=draft();void o.write(raw=>store.draft(raw,a.id,'condition:1',value),'Declaración pendiente; aún sin confirmar.');
  });
  $('#saveConditionOutcome').onclick=async()=>{
   if(pending||localStop)return;const fields=draft(),level=fields.completionLevel;
   const validTime=/^\d+$/.test(fields.reportMinutes)&&/^\d+$/.test(fields.reportSeconds)&&Number(fields.reportSeconds)<60;
   const seconds=Number(fields.reportMinutes)*60+Number(fields.reportSeconds),cycles=Number(fields.cyclesReported);
   if(!level||!validTime||fields.cyclesReported===''||!fields.reviewed||level!=='not_performed'&&seconds===0
     ||level==='not_performed'&&(seconds!==0||cycles!==0)||level==='full'&&(seconds<r.durationMs/1000||cycles!==r.snapshot.intervals)){
    $('#conditionFormError').textContent='Elige el resultado y declara tiempo/ciclos reales. Completo requiere todas las fases elegidas; usa Parcial si hiciste menos. Confirma la revisión.';return;
   }
   pending=true;$('#saveConditionOutcome').disabled=true;
   const record={weight:'',reps:`${seconds} s · ${cycles} ciclos declarados`,note:fields.note,status:level==='not_performed'?'skipped':'done',
    completionLevel:level,actualReportedSeconds:seconds,cyclesReported:cycles,modality:r?.choices.modality||'walk',reviewed:true,clockReviewed:true,
    clockWarning:!!r?.clockWarning,reviewedAt:new Date().toISOString(),confirmedAt:new Date().toISOString(),
    conditionSnapshot:r?{programVersion:r.programVersion,sourceSHA256:r.sourceSHA256,phases:r.phases,choices:r.choices,startedAt:r.startedAt,endsAt:r.endsAt,stoppedAt:r.stoppedAt}:null};
   let optionalWarning=false;
   const ok=await o.write(async raw=>{const result=await timer.outcome(raw,a.id,snap.raw,record);optionalWarning=result.timerWarning;return result.snapshot;},'Resultado declarado guardado. Falta cerrar la sesión.');
   pending=false;if(ok){localStop=null;manual=false;sync();warning(optionalWarning?'Resultado confirmado. No se confirmó el cierre del reloj auxiliar; no afecta tu registro.':'');o.render();}else $('#saveConditionOutcome').disabled=false;
  };
  $('#cancelCondition').onclick=()=>cancel(a);
  if($('#retryConditionStop'))$('#retryConditionStop').onclick=()=>persistStop();
 }
 async function cancel(a){
  if(pending||!confirm('¿Fue un inicio accidental sin actividad? Se descartarán solo esta sesión sin registros confirmados y su declaración pendiente. El historial se conserva.'))return;
  pending=true;const ok=await o.write(raw=>timer.cancel(raw,a.id,snap.raw),'Inicio accidental cancelado sin historial.');pending=false;
  if(ok){localStop=null;manual=false;sync();o.render();}
 }
 function render(a,plan){
  const mine=a?.session==='C'&&a.week===o.week(),r=mine&&current()?.sessionId===a.id?current():null,log=mine&&a.logs['condition:1'];
  $('#sessionActions').innerHTML='';$('#sessionProgress').textContent='';$('#sessionDock').hidden=false;
  if(log){
   $('#sessionContent').innerHTML=`<article class="exercise"><p class="eyebrow">RESULTADO CONFIRMADO</p><h2>${log.completionLevel==='partial'?'Parcial':log.completionLevel==='full'?'Completo':log.status==='skipped'?'No realizado':'Registro anterior · cumplimiento no especificado'}</h2><p>${h(log.reps)}</p><p>${h(log.weight)} ${h(log.note)}</p><p>El resultado ya está guardado. Cierra la sesión para incorporarlo al historial.</p></article>`;
   $('#sessionDock').innerHTML='<button class="btn primary" id="finishSession">Cerrar sesión guardada</button>';
   $('#finishSession').onclick=async()=>{if(pending)return;pending=true;const ok=await o.write(raw=>store.finish(raw,a.id),'Sesión guardada en el historial.');pending=false;if(ok){sync();o.render();}};
   return;
  }
  if(r||mine&&manual){
   const p=r&&position(r),running=r?.state==='running'&&!p.reached&&!localStop;
   $('#sessionDock').hidden=true;
   $('#sessionContent').innerHTML=`<div class="condition-frame"><div class="condition-clock-panel"><p class="eyebrow">EJECUTAR · SEMANA ${a.week}</p><h2 id="conditionPhase" tabindex="-1">${r?h(p.phase.label):'Resultado real'}</h2><div class="rest-time" id="conditionClock">${r?restTime(p.remaining):'00:00'}</div><p id="conditionCycle"></p><p class="condition-effort" id="conditionEffort"></p></div><div class="condition-body">${running?`<p id="conditionNext"></p><progress id="conditionProgress" max="${r.durationMs}" value="${p.elapsed}" aria-label="Tiempo del protocolo, no actividad confirmada"></progress><aside class="pro-tip" data-pro-tip="condition"><strong>Pro tip 1%</strong><p id="conditionCoaching"></p></aside><p id="conditionMissed" class="timer-warning" ${missed?'':'hidden'}>Pudieron perderse indicaciones al salir. El reloj sigue por hora absoluta; verifica manualmente la actividad real al terminar.</p><p id="conditionClockWarning" class="timer-warning" hidden>La hora del dispositivo cambió o no pudo verificarse. El plazo no se modificó; revisa lo realmente realizado al terminar.</p><button class="btn secondary" id="openConditionGuide">Guía ampliada</button><button class="text-button" id="conditionSound">Sonido opcional: desactivado</button><p id="conditionCapability" class="secondary-copy"></p><p class="secondary-copy">Sin avisos garantizados con pantalla bloqueada o app suspendida. El plazo no cambia al visitar Hoy o la guía. Detén el entrenamiento si necesitas interrumpirlo.</p>`:form(a,r)}</div>${running?'<div class="condition-dock"><button class="btn danger" id="stopCondition">Detener entrenamiento</button></div>':''}</div>`;
   if(running){$('#stopCondition').onclick=stop;$('#openConditionGuide').onclick=openGuide;$('#conditionSound').onclick=toggleSound;}
   else bindForm(a,r);
   paint();return;
  }
  let source,phases;try{source=mine?conditionSource(a):{...PROGRAM.plan[o.week()-1],sourceSHA256:PROGRAM.sourceSHA256};phases=timeline(source);}catch(_){manual=true;warning('El plan anterior no tiene un reloj verificable. Conserva su prescripción y declara solo la actividad real; no se reconstruirá un protocolo nuevo.');render(a,plan);return;}
  $('#sessionContent').innerHTML=`<article class="exercise condition-plan" id="conditionPlan"><p class="eyebrow">PLANIFICAR · SIN RELOJ INICIADO</p><h2>${h(plan.title)}</h2><p class="condition-target">${h(source.effort)} · ${conditionRange(source)}</p><p>${h(plan.protocol)}</p><div class="condition-timeline">${phases.map(phase=>`<div><b>${h(phase.label)}${phase.cycle?' · ciclo '+phase.cycle+'/'+source.intervals:''}</b><span>${restTime(phase.seconds*1000)} · ${h(phase.effort)}</span></div>`).join('')}</div>${o.week()===6?`<label for="conditionWalk">Duración de caminata dentro de 15–20 min</label><select id="conditionWalk">${[15,16,17,18,19,20].map(n=>`<option value="${n}">${n} min</option>`).join('')}</select><p class="secondary-copy">15 min preseleccionados como opción de interfaz dentro del rango prescrito. Sin intervalos ni calentamiento extra.</p>`:`<label for="conditionCooldown">Cierre dentro de los 3–5 min prescritos</label><select id="conditionCooldown">${[3,4,5].map(n=>`<option value="${n}">${n} min</option>`).join('')}</select><p class="secondary-copy">3 min preseleccionados como opción de interfaz, no una nueva prescripción.</p><label for="conditionModality">Modalidad</label><select id="conditionModality"><option value="walk">Caminata / caminadora</option><option value="row">Remo · solo si dominas la técnica</option><option value="ski">SkiErg · solo si dominas la técnica</option></select>`}<button class="btn secondary" id="openConditionGuide">Guía ampliada</button><aside class="pro-tip" data-pro-tip="condition"><strong>Pro tip 1%</strong><p>${h(PROGRAM.guidance.cardioTalk)}</p></aside><details class="technique"><summary>Protocolo, alternativas y seguridad</summary><p>${h(plan.exercises[0].cue)}</p><p>${h(plan.exercises[0].alt)}</p><p>${h(PROGRAM.guidance[o.week()>=7?'cardioLater':'cardioEarly'])}</p><p>${h(PROGRAM.guidance.recovery)}</p><p>${h(PROGRAM.guidance.safety)}</p></details><label class="review-check"><input type="checkbox" id="conditionWake"> Intentar mantener la pantalla activa (opcional; puede no estar disponible).</label>${mine?'<button class="text-button" id="manualCondition">Declarar actividad manualmente sin reloj verificable</button><button class="text-button" id="cancelCondition">Cancelar inicio accidental sin registro</button>':''}</article>`;
  $('#openConditionGuide').onclick=openGuide;
  if($('#manualCondition'))$('#manualCondition').onclick=()=>{manual=true;o.render();};if($('#cancelCondition'))$('#cancelCondition').onclick=()=>cancel(a);
  if(a&&!mine){$('#sessionDock').innerHTML='<button class="btn primary" id="resumeSession">Continuar sesión activa</button>';$('#resumeSession').onclick=o.resume;}
  else if(o.completed()){$('#sessionDock').innerHTML='<button class="btn primary" id="showHistory">Ver sesión guardada</button>';$('#showHistory').onclick=o.history;}
  else{$('#sessionDock').innerHTML='<button class="btn primary" id="startSession">Comenzar entrenamiento</button>';$('#startSession').onclick=begin;}
 }
 function paint(){
  const r=current(),mini=$('#conditionMini');mini.hidden=!r||visible()&&active()?.week===o.week()&&active()?.id===r.sessionId;
  if(!r){stopTicker();releaseWake();return;}
  const p=position(r),running=r.state==='running'&&!p.reached&&!localStop;
  if(p.reached&&r.state==='running'&&!localStop&&reachRaw!==snap.raw){const expected=snap.raw;reachRaw=expected;void timer.reach(expected).then(result=>{if(snap.raw===expected){snap=result;paint();}}).catch(()=>warning('El plazo está cumplido, pero no se confirmó ese estado del reloj. No se guardó actividad automáticamente.'));}
  $('#conditionMiniClock').textContent=restTime(p.remaining);$('#conditionMiniState').textContent=running?'CONDICIÓN':p.reached?'TIEMPO ALCANZADO':'RESULTADO PENDIENTE';
  if(visible()&&$('#conditionClock')){
   $('#conditionClock').textContent=restTime(p.remaining);$('#conditionPhase').textContent=p.reached?'Objetivo de tiempo alcanzado':r.state==='stopped_early'?'Entrenamiento detenido':p.phase.label;
   $('#conditionCycle').textContent=r.snapshot.intervals?(p.phase.cycle?`Ciclo ${p.phase.cycle}/${r.snapshot.intervals}`:'Sin ciclo · '+p.phase.label):'Caminata continua · sin intervalos';
   $('#conditionEffort').textContent=p.phase.effort;
   if($('#conditionNext'))$('#conditionNext').textContent=r.phases[p.index+1]?'Después: '+r.phases[p.index+1].label+' · '+restTime(r.phases[p.index+1].seconds*1000):'Después: declarar lo realmente realizado';
   if($('#conditionProgress'))$('#conditionProgress').value=p.elapsed;
   if($('#conditionCoaching'))$('#conditionCoaching').textContent=phaseCopy(p.phase,r)[0];
   if($('#conditionOutcomeClockWarning'))$('#conditionOutcomeClockWarning').hidden=!r.clockWarning;
   if($('#conditionMissed'))$('#conditionMissed').hidden=!missed;if($('#conditionClockWarning'))$('#conditionClockWarning').hidden=!r.clockWarning;
   if($('#conditionSound')){$('#conditionSound').textContent='Sonido opcional: '+(sound?'activado':'desactivado');$('#conditionSound').setAttribute('aria-pressed',String(sound));}
   if($('#conditionCapability'))$('#conditionCapability').textContent=[soundMessage,wakeMessage].filter(Boolean).join(' ');
   if(!running&&$('#stopCondition')){sound=false;releaseWake();render(active(),active().plan);renderGuide();o.layout();return;}
  }
  if(lastPhase!==null&&lastPhase!==p.index){if(p.index===lastPhase+1&&['effort','easy'].includes(p.phase.kind))cue();$('#conditionAnnounce').textContent=p.phase.label+' · '+p.phase.effort;renderGuide();}
  lastPhase=p.index;
  if($('#conditionGuideClock'))$('#conditionGuideClock').textContent=restTime(p.remaining);
  if(document.visibilityState!=='hidden'&&running){if(ticker===null){anchor={wall:Date.now(),mono:performance.now()};ticker=setInterval(tick,250);document.documentElement.dataset.conditionTicker='running';}}
  else{stopTicker();releaseWake();}
 }
 $('#conditionMini').onclick=()=>o.open();
 return {render,sync,paint,executing:()=>visible()&&active()?.session==='C'&&active().week===o.week()&&!!(current()||manual),
  lifecycle:()=>{if(document.visibilityState==='hidden'){if(current())missed=true;silence();stopTicker();releaseWake();anchor=null;return;}
   const drift=anchor&&clockChanged(anchor.wall,anchor.mono,Date.now(),performance.now());sync({returning:true});if(drift)flagClock();if(visible())o.render();void requestWake();},
  pagehide:()=>{silence();stopTicker();releaseWake();anchor=null;},
  navigated:()=>{if(!visible())releaseWake();else void requestWake();paint();}
 };
}
