import { PROGRAM } from './program.mjs';
import { createConditionStore, CONDITION_KEY, conditionSource, conditionRange, timeline, position, clockChanged, stoppedCondition, guidedResult } from './condition.mjs';
import { restTime } from './rest.mjs';
export { CONDITION_KEY, conditionRange };
export function createConditionUI(o) {
 const {$,h,visual,store}=o,timer=createConditionStore(localStorage,navigator.locks);
 let snap={raw:null,record:null},ticker=null,pending=false,localStop=null,manual=false,missed=false,lastPhase=null,anchor=null,reachRaw=null;
 const cueKey='home-gym.v1.condition.view';let hiddenPhase=null,stopIntent=null;
 let tone=null,audio=null,sound=false,soundMessage='',wake=null,wakeWanted=false,wakePending=false,wakeMessage='Pantalla: control del dispositivo.';
 const current=()=>localStop||snap.record;
 const visible=()=>o.view()==='condicion';
 const active=()=>o.snapshot().data.active;
 const warning=text=>{const el=$('#conditionWarning');el.hidden=!text;el.textContent=text||'';};
 function stopTicker(){if(ticker!==null)clearInterval(ticker);ticker=null;document.documentElement.dataset.conditionTicker='stopped';}
 function releaseWake(){const held=wake;wake=null;if(held)void held.release().catch(()=>{});}
 async function requestWake(){
  if(!wakeWanted||wake||wakePending||!visible()||document.visibilityState==='hidden'||current()?.state!=='running')return;
  if(!navigator.wakeLock){wakeMessage='Pantalla: función opcional no disponible.';return;}
  wakePending=true;
  try{const held=await navigator.wakeLock.request('screen');
   if(!visible()||document.visibilityState==='hidden'||current()?.state!=='running'){await held.release();return;}
   wake=held;wakeMessage='Pantalla activa mientras el navegador lo permita.';
   wake.addEventListener('release',()=>{wake=null;wakeMessage='Pantalla: el dispositivo liberó el bloqueo.';paint();});
  }catch(_){wakeMessage='Pantalla: no se pudo mantener activa; usa el control del dispositivo.';}
  finally{wakePending=false;}
 }
 function silence(){if(tone){try{tone.stop()}catch(_){}tone=null;}}
 function cue(){
  if(!sound||document.visibilityState==='hidden'||audio?.state!=='running'||localStop||!visible())return;
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
 function remember(background=false){
  const r=current();if(!r)return;const p=position(r);
  const marker={id:r.id,sessionId:r.sessionId,index:lastPhase??p.index,reached:p.reached,background,missed};
  if(background)hiddenPhase=marker;
  try{localStorage.setItem(cueKey,JSON.stringify(marker));}catch(_){/* Cue hints are optional; never touch the workout. */}
 }
 function sync({returning=false}={}){
  try{
   const before=snap.record;snap=timer.read();
   if(localStop&&(localStop.sessionId!==active()?.id||snap.record?.id!==localStop.id||!['running','paused'].includes(snap.record?.state)))localStop=null;
   if(before?.id!==snap.record?.id){lastPhase=null;manual=false;missed=false;}
   if(returning&&snap.record){
    let seen=hiddenPhase;try{seen??=JSON.parse(localStorage.getItem(cueKey));}catch(_){}
    const p=position(snap.record);
    if(seen?.id===snap.record.id&&seen.sessionId===snap.record.sessionId){
     missed=!!seen.missed||!!seen.background&&(seen.index!==p.index||!seen.reached&&p.reached);
    }
    hiddenPhase=null;
   }
   if(snap.unusable)warning('El reloj anterior no se pudo verificar. Puedes ajustar y guardar tu actividad sin modificar el historial.');
   if(snap.record&&Date.now()<snap.record.updatedAt&&!snap.record.clockWarning)flagClock();
  }catch(_){warning('No se pudo leer el reloj guardado. Vuelve a leer los datos antes de continuar.');}
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
  return `<div class="guide-heading"><p class="eyebrow">GUÍA AMPLIADA · ${r?position(r).reached?'tiempo alcanzado':r.state==='paused'?'en pausa':r.state==='stopped_early'?'finalizado':'el reloj sigue':'planificar'}</p><h2 id="guideTitle">${r&&position(r).reached?'Objetivo de tiempo alcanzado':h(p.label)}</h2><time id="conditionGuideClock">${r?restTime(position(r).remaining):''}</time></div><div class="guide-body">${visual(icon,p.label)}<p class="condition-effort">${h(p.effort)}</p>${copy.map(text=>`<p>${h(text)}</p>`).join('')}<p class="resource" data-resource-status="UNVERIFIED">UNVERIFIED · Vídeo no verificado. Ilustración de referencia; guía escrita disponible sin conexión.</p><details><summary>Seguridad</summary><p>${h(PROGRAM.guidance.safety)}</p><p>${h(PROGRAM.guidance.cardioAlternatives)}</p></details></div><div class="guide-dock">${['running','paused'].includes(r?.state)&&!position(r).reached?'<button class="btn danger" id="guideStopCondition">Finalizar</button>':''}<button class="btn secondary" id="closeConditionGuide">Volver ${r?'al entrenamiento':'al plan'}</button></div>`;
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
   o.notice('Entrenamiento iniciado · reloj guardado.');o.render();void requestWake();$('#conditionPhase')?.focus({preventScroll:true});
  }catch(_){warning('No se confirmó el inicio persistente del reloj. No se registró actividad. Vuelve a leer los datos antes de reintentar.');sync();o.render();}
  finally{pending=false;if($('#startSession'))$('#startSession').disabled=false;}
 }
 async function control(action){
  if(pending||localStop||!current()||current().sessionId!==active()?.id)return;pending=true;
  const expected=snap.raw;
  try{
   snap=action==='pause'?await timer.pause(expected):action==='resume'?await timer.resume(expected):await timer.advance(expected,action);
   if(stopIntent?.id===snap.record.id)stopIntent.raw=snap.raw;
   warning('');anchor={wall:Date.now(),mono:performance.now()};paint();remember();renderGuide();void requestWake();
  }catch(_){warning('No se confirmó el cambio del reloj. Vuelve a leer los datos; el registro del entrenamiento sigue intacto.');}
  finally{pending=false;if(localStop)void persistStop();}
 }
 async function stop(){
  const r=current();if(!r||!['running','paused'].includes(r.state))return;
  if(r.sessionId!==active()?.id){warning('Otra sesión está activa. Vuelve a leer los datos.');return;}
  stopIntent={id:r.id,sessionId:r.sessionId,raw:snap.raw,at:Date.now()};
  localStop=stoppedCondition(r,stopIntent.at);sound=false;silence();stopTicker();releaseWake();
  o.render();$('#conditionOutcomeTitle')?.focus({preventScroll:true});await persistStop();
 }
 async function persistStop(){
  if(pending)return;pending=true;
  try{
   if(!stopIntent||stopIntent.id!==snap.record?.id||stopIntent.sessionId!==active()?.id)throw Error('stale-condition');
   snap=await timer.stop(stopIntent.raw,stopIntent.at);localStop=null;stopIntent=null;warning('');
   if($('#saveConditionOutcome')){$('#saveConditionOutcome').disabled=false;$('#retryConditionStop')?.remove();}
   else o.render();
  }
  catch(_){warning('Detenido aquí. No se confirmó la detención guardada. Reintenta guardarla antes de cerrar.');}
  finally{pending=false;}
 }
 function form(a,r){
  const d=a.drafts?.['condition:1']||{},g=guidedResult(r),cycles=r?.snapshot.intervals??a.plan.conditioning?.intervals??0;
  const level=d.completionLevel||g.level,seconds=Number.isFinite(Number(d.reportMinutes))&&d.reportMinutes!==undefined&&d.reportMinutes!==''?Number(d.reportMinutes)*60+Number(d.reportSeconds||0):g.seconds;
  return `<div class="condition-outcome"><h2 id="conditionOutcomeTitle" tabindex="-1">${localStop?'Entrenamiento detenido':positionSafe(r)?'Tiempo completado':'Tu resumen'}</h2><p class="condition-summary">${restTime(g.seconds*1000)} de tiempo guiado${g.cycles?' · '+g.cycles+' ciclos completos':''}${g.advancedMs?' · fases adelantadas':''}</p><p class="secondary-copy">${r?.clockWarning?'La hora del dispositivo cambió; el tiempo es una estimación. ':''}Guarda lo realizado o ajusta los detalles.</p>${!r?'<details><summary>Protocolo guardado</summary><p>'+h(a.plan.protocol||'Conserva el plan anterior; registra solo lo realizado.')+'</p></details>':''}${missed?'<p id="conditionOutcomeMissed" class="timer-warning">Cambió la fase mientras estabas fuera. Revisa lo realizado.</p>':''}${localStop?'<button class="btn secondary" id="retryConditionStop">Reintentar guardar detención</button>':''}<details id="conditionDetails"><summary>Ajustar detalles</summary><label for="conditionLevel">Resultado</label><select id="conditionLevel">${g.level==='full'?'<option value="full">Completo</option>':''}<option value="partial">Parcial</option><option value="not_performed">No realizado</option></select><div class="reported-time"><label>Minutos<input id="conditionMinutes" inputmode="numeric" value="${h(Math.floor(seconds/60))}" maxlength="4"></label><label>Segundos<input id="conditionSeconds" inputmode="numeric" value="${h(seconds%60)}" maxlength="2"></label></div><label for="conditionCycles">Ciclos</label><select id="conditionCycles">${Array.from({length:cycles+1},(_,n)=>`<option value="${n}">${n}</option>`).join('')}</select><label for="conditionNote">Nota opcional</label><textarea id="conditionNote" maxlength="2000">${h(d.note||'')}</textarea></details><p id="conditionFormError" role="alert" class="field-error"></p><button class="text-button" id="cancelCondition">Cancelar inicio accidental</button></div>`;
 }
 const positionSafe=r=>!!r&&position(r).reached;
 function bindForm(a,r){
  const d=a.drafts?.['condition:1']||{},g=guidedResult(r);let detailsEdited=!!d.detailsEdited;
  $('#conditionLevel').value=d.completionLevel||g.level;$('#conditionCycles').value=d.cyclesReported??g.cycles;
  const draft=()=>({weight:'',reps:'',note:$('#conditionNote').value,completionLevel:$('#conditionLevel').value,
   reportMinutes:$('#conditionMinutes').value,reportSeconds:$('#conditionSeconds').value,cyclesReported:$('#conditionCycles').value,reviewed:true,detailsEdited:true});
  const label=()=>{const level=$('#conditionLevel').value;$('#saveConditionOutcome').textContent=level==='full'?'Finalizar y guardar':level==='not_performed'?'Guardar sin actividad':'Guardar parcial';};label();
  for(const id of ['conditionLevel','conditionMinutes','conditionSeconds','conditionCycles','conditionNote'])$('#'+id).addEventListener('input',()=>{
   detailsEdited=true;
   if(id==='conditionLevel'&&$('#conditionLevel').value==='not_performed'){$('#conditionMinutes').value='0';$('#conditionSeconds').value='0';$('#conditionCycles').value='0';}
   label();const value=draft();void o.write(raw=>store.draft(raw,a.id,'condition:1',value),'Detalles pendientes.');
  });
  $('#saveConditionOutcome').onclick=async()=>{
   if(pending||localStop)return;const fields=draft(),level=fields.completionLevel;
   const validTime=/^\d+$/.test(fields.reportMinutes)&&/^\d+$/.test(fields.reportSeconds)&&Number(fields.reportSeconds)<60;
   const seconds=Number(fields.reportMinutes)*60+Number(fields.reportSeconds),cycles=Number(fields.cyclesReported);
   if(!validTime||level!=='not_performed'&&seconds===0||level==='not_performed'&&(seconds!==0||cycles!==0)){
    $('#conditionDetails').open=true;$('#conditionFormError').textContent='Revisa el tiempo indicado o elige No realizado.';return;
   }
   pending=true;$('#saveConditionOutcome').disabled=true;
   const record={weight:'',reps:`${seconds} s ${detailsEdited?'declarados':'guiados'} · ${cycles} ciclos`,note:fields.note,status:level==='not_performed'?'skipped':'done',
    completionLevel:level,actualReportedSeconds:seconds,cyclesReported:cycles,modality:r?.choices.modality||'walk',reviewed:true,clockReviewed:true,
    durationBasis:detailsEdited?'reported':'guided',clockWarning:!!r?.clockWarning,
    reviewedAt:new Date().toISOString(),confirmedAt:new Date().toISOString()};
   const ok=await o.write(raw=>timer.finalize(raw,a.id,snap.raw,record),'Sesión guardada en el historial.');pending=false;
   if(ok){localStop=null;manual=false;sync();o.history();}else if($('#saveConditionOutcome'))$('#saveConditionOutcome').disabled=false;
  };
  $('#cancelCondition').onclick=()=>cancel(a);
  if($('#retryConditionStop'))$('#retryConditionStop').onclick=persistStop;
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
   const p=r&&position(r),playing=r&&['running','paused'].includes(r.state)&&!p.reached&&!localStop;
   $('#sessionDock').hidden=true;
   $('#sessionContent').innerHTML=`<div class="condition-frame"><div class="condition-clock-panel" ${playing?'':'hidden'}><div class="condition-phase-copy"><h2 id="conditionPhase" tabindex="-1"></h2><p><span id="conditionCycle"></span> · <span class="condition-effort" id="conditionEffort"></span></p></div><div id="conditionClock" role="timer" aria-live="off">${r?restTime(p.remaining):'00:00'}</div><p id="conditionNext"></p><progress id="conditionProgress" max="${r?.durationMs||1}" value="${p?.elapsed||0}" aria-label="Avance del protocolo"></progress></div><div class="condition-body">${playing?`<aside class="pro-tip" data-pro-tip="condition"><strong>Pro tip 1%</strong><p id="conditionCoaching"></p></aside><p id="conditionMissed" class="timer-warning" hidden>Cambió la fase mientras estabas fuera. Revisa lo realizado.</p><p id="conditionClockWarning" class="timer-warning" hidden>La hora cambió. Puedes ajustar el tiempo al finalizar.</p><button class="btn secondary" id="openConditionGuide">Guía ampliada</button><div class="condition-options"><button class="text-button" id="conditionSound">Sonido desactivado</button>${r.phases.some((x,i)=>i>p.index&&x.kind==='cooldown')?'<button class="text-button" id="conditionCooldownNow">Ir al cierre suave</button>':''}</div><p id="conditionCapability" class="secondary-copy"></p>`:form(a,r)}</div><div class="condition-dock">${playing?'<button class="btn primary" id="pauseCondition">Pausar</button><button class="btn secondary" id="nextCondition">Siguiente fase</button><button class="btn quiet" id="skipCondition">Omitir fase</button><button class="btn condition-finish" id="stopCondition" aria-label="Finalizar y detener ahora">Finalizar</button>':`<button class="btn primary" id="saveConditionOutcome" ${localStop?'disabled':''}>Guardar parcial</button>`}</div></div>`;
   if(playing){
    $('#stopCondition').onclick=stop;$('#pauseCondition').onclick=()=>control(current()?.state==='paused'?'resume':'pause');
    $('#nextCondition').onclick=()=>control('next');$('#skipCondition').onclick=()=>control('skip');
    if($('#conditionCooldownNow'))$('#conditionCooldownNow').onclick=()=>control('cooldown');
    $('#openConditionGuide').onclick=openGuide;$('#conditionSound').onclick=toggleSound;
   }else bindForm(a,r);
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
  const p=position(r),playing=['running','paused'].includes(r.state)&&!p.reached&&!localStop,running=playing&&r.state==='running';
  if(p.reached&&r.state==='running'&&!localStop&&reachRaw!==snap.raw){const expected=snap.raw;reachRaw=expected;void timer.reach(expected).then(result=>{if(snap.raw===expected){snap=result;paint();}}).catch(()=>warning('Tiempo alcanzado; no se confirmó el estado del reloj. No se guardó actividad automáticamente.'));}
  $('#conditionMiniClock').textContent=restTime(p.remaining);$('#conditionMiniState').textContent=r.state==='paused'?'EN PAUSA':playing?'CONDICIÓN':'RESUMEN PENDIENTE';
  if(visible()&&$('#conditionClock')){
   $('#conditionClock').textContent=restTime(p.remaining);$('#conditionPhase').textContent=(r.state==='paused'?'En pausa · ':'')+p.phase.label;
   $('#conditionCycle').textContent=r.snapshot.intervals?(p.phase.cycle?`Ciclo ${p.phase.cycle}/${r.snapshot.intervals}`:'Semana '+r.week):'Sin intervalos';
   $('#conditionEffort').textContent=p.phase.effort;
   $('#conditionNext').textContent=r.phases[p.index+1]?'Después: '+r.phases[p.index+1].label+' · '+restTime(r.phases[p.index+1].seconds*1000):'Después: resumen';
   $('#conditionProgress').value=p.elapsed;
   if($('#conditionCoaching'))$('#conditionCoaching').textContent=phaseCopy(p.phase,r)[0];
   if($('#conditionMissed'))$('#conditionMissed').hidden=!missed;if($('#conditionClockWarning'))$('#conditionClockWarning').hidden=!r.clockWarning;
   if($('#pauseCondition')){$('#pauseCondition').textContent=r.state==='paused'?'Reanudar':'Pausar';$('#pauseCondition').setAttribute('aria-pressed',String(r.state==='paused'));}
   if($('#conditionSound')){$('#conditionSound').textContent='Sonido '+(sound?'activado':'desactivado');$('#conditionSound').setAttribute('aria-pressed',String(sound));}
   if($('#conditionCapability'))$('#conditionCapability').textContent=[soundMessage,wakeWanted?wakeMessage:''].filter(Boolean).join(' ');
   if(!playing&&$('#stopCondition')){sound=false;releaseWake();render(active(),active().plan);renderGuide();o.layout();return;}
  }
  if(lastPhase!==null&&lastPhase!==p.index){
   if(running&&p.index===lastPhase+1&&['effort','easy'].includes(p.phase.kind))cue();
   $('#conditionAnnounce').textContent=p.phase.label+' · '+p.phase.effort;renderGuide();
  }
  if(lastPhase!==p.index&&document.visibilityState!=='hidden'){lastPhase=p.index;remember();}
  if($('#conditionGuideClock'))$('#conditionGuideClock').textContent=restTime(p.remaining);
  if(document.visibilityState!=='hidden'&&running){if(ticker===null){anchor={wall:Date.now(),mono:performance.now()};ticker=setInterval(tick,250);document.documentElement.dataset.conditionTicker='running';}}
  else{stopTicker();releaseWake();}
 }
 $('#conditionMini').onclick=()=>o.open();
 return {render,sync,paint,executing:()=>visible()&&active()?.session==='C'&&active().week===o.week()&&!!(current()||manual),
  lifecycle:()=>{if(document.visibilityState==='hidden'){remember(true);silence();stopTicker();releaseWake();anchor=null;return;}
   const drift=anchor&&clockChanged(anchor.wall,anchor.mono,Date.now(),performance.now());sync({returning:true});if(drift)flagClock();
   if(visible()&&!$('#conditionDetails')?.open&&(!current()||!$('#conditionClock')))o.render();void requestWake();},
  pagehide:()=>{remember(true);silence();stopTicker();releaseWake();anchor=null;},
  navigated:()=>{if(!visible())releaseWake();else void requestWake();paint();}
 };
}
