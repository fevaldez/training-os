import { PROGRAM } from './program.mjs';
import { createStore, KEY, prescription, emergency, schedule, setKeys } from './engine.mjs';
const $ = s => document.querySelector(s);
const all = s => [...document.querySelectorAll(s)];
const h = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const base = new URL('./', import.meta.url);
let snapshot, store, stale = false, selectedWeek = 1, selectedSession = 'A';
let writes = Promise.resolve();
const memoryDrafts = new Map();
function status(text, error = false) { $('#saveState').textContent = text; $('#saveState').classList.toggle('error', error); }
function go(id) { document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'}); }
const errors = {
 'stale-tab':'Otra pestaña cambió tus datos. Vuelve a leerlos antes de continuar.',
 'resolve-every-set':'Registra u omite explícitamente cada serie antes de terminar.',
 'lock-unavailable':'Este navegador no permite guardar con seguridad. Usa un navegador compatible y conserva tu respaldo.',
 'restore-requires-empty-store':'La restauración requiere un navegador sin progreso. Tus registros siguen intactos.',
 'wrong-backup':'Este archivo no es un respaldo de Home Gym.',
 'active-session-exists':'Termina la sesión activa antes de comenzar otra.'
};
function fail(e) {
 status(errors[e.message] || 'No se confirmó el guardado. Conserva esta pantalla, exporta un respaldo y vuelve a leer los datos antes de reintentar.', true);
 $('#refresh').hidden = false;
 $('#saveState').scrollIntoView({behavior:'instant',block:'center'});
 stale = true;
}
function mutate(fn, message = 'Guardado en este navegador.', renderUI = true) {
 const action = writes.then(async () => {
  if (stale) return false;
  try { snapshot = await fn(snapshot.raw); if(renderUI) render(); status(message); return true; }
  catch (e) { fail(e); return false; }
 });
 writes = action.catch(()=>false);
 return action;
}
const completed = (w, s) => snapshot.data.history.some(x => x.week === w && x.session === s);
function renderCalendar() {
 const w = selectedWeek, p = PROGRAM.plan[w-1], map = snapshot.data.calendar[w] || schedule(w);
 $('#phaseTag').textContent = p.phase;
 $('#weekHeadline').textContent = 'Semana ' + w + ' · ' + (w === 1 ? 'empezar fácil' : w === 2 ? 'repetir mejor' : w === 6 ? 'reducir fatiga' : w === 12 ? 'evaluar progreso' : 'progresar con control');
 $('#weekSubtitle').textContent = w === 6 ? 'Semana ligera: menos series y solo cardio suave.' : `Fuerza: RIR ${p.rir} · Condición: ${p.effort}.`;
 $('#weekSelect').value = w; $('#prevWeek').disabled = w === 1; $('#nextWeek').disabled = w === 12;
 $('#weeklyCount').textContent = ['A','B','C'].filter(s => completed(w,s)).length + '/3';
 $('#calendar').innerHTML = days.map((day,i) => {
  const s = Object.keys(map).find(k=>map[k]===i), done = s && completed(w,s);
  return `<button class="day ${s ? s === 'C' ? 'interval' : 'session' : ''} ${done ? 'done' : ''}" data-day-session="${s||''}" aria-label="${day}: ${s ? s==='C'?'Condición':'Fuerza '+s : 'Descanso o micro-pausas'}"><span class="name">${day}</span><strong>${s ? s==='C'?'Condición':'Fuerza '+s : i===6?'Descanso':'Micro-pausas'}</strong><small>${s ? s==='C'?'15–25 min':'35–45 min' : i===6?'Libre':'2–5 min'}</small><span class="check">${s ? done?'✓ Completado':'Abrir →' : ''}</span></button>`;
 }).join('');
 $('#roadmap').innerHTML = PROGRAM.plan.map(p => {const n=['A','B','C'].filter(s=>completed(p.week,s)).length;return `<button class="weekdot ${p.week===w?'selected':''} ${n===3?'done':''}" data-week="${p.week}" aria-label="Semana ${p.week}, ${n} de 3 sesiones" aria-current="${p.week===w?'true':'false'}"><span>${p.week}</span><span class="micro">${n}/3</span></button>`}).join('');
 $('#moveDays').innerHTML = ['A','C','B'].map(s => `<label class="plan-row">${s==='C'?'Condición':'Fuerza '+s}<select data-move="${s}" aria-label="Mover ${s==='C'?'Condición':'Fuerza '+s}">${days.map((d,i)=>`<option value="${i}" ${map[s]===i?'selected':''}>${d}</option>`).join('')}</select></label>`).join('');
 all('[data-day-session]').forEach(b=>b.onclick=()=>{if(b.dataset.daySession){selectedSession=b.dataset.daySession;renderSession();go('sesiones')}});
 all('[data-week]').forEach(b=>b.onclick=()=>{selectedWeek=Number(b.dataset.week);render()});
 all('[data-move]').forEach(select=>select.onchange=()=>mutate(raw=>store.move(raw,w,select.dataset.move,Number(select.value))));
}
function renderSession() {
 if(!snapshot)return;
 const a = snapshot.data.active, visible = a && a.week===selectedWeek && a.session===selectedSession;
 const done = completed(selectedWeek, selectedSession);
 const plan = visible ? a.plan : prescription(selectedWeek,selectedSession);
 all('[data-session]').forEach(b=>{b.classList.toggle('active',b.dataset.session===selectedSession);b.setAttribute('aria-selected',String(b.dataset.session===selectedSession))});
 $('#sessionEyebrow').textContent = 'Semana '+selectedWeek+' · '+PROGRAM.plan[selectedWeek-1].phase;
 $('#sessionTitle').textContent = plan.title;
 $('#sessionIntro').textContent = selectedSession==='C' ? 'Acondicionamiento de bajo impacto; los intervalos intensos se activan solo si hay tolerancia.' : PROGRAM.guidance.warmup+' '+PROGRAM.guidance.duration;
 let html = plan.protocol ? `<div class="callout">${h(plan.protocol)}</div>` : '';
 if(selectedSession==='C') html += `<p class="callout warn">${h(PROGRAM.guidance[selectedWeek>=7?'cardioLater':'cardioEarly'])}</p>`;
 html += plan.exercises.map(e=>`<article class="exercise" style="margin-top:12px"><h3>${h(e.name)}</h3><div class="meta">${h(e.gear)} · <b>${e.sets} ${selectedSession==='C'||plan.emergency?'registro':'series'}</b> × ${h(e.reps)}${e.rir?' · RIR '+h(e.rir):''}${e.tempo?' · Tempo '+h(e.tempo):''}${e.rest?' · Descanso '+h(e.rest):''}</div><p class="ex-tip">${h(e.cue)}<br><b>Alternativa:</b> ${h(e.alt)}</p>${visible?Array.from({length:e.sets},(_,i)=>{
 const key=e.id+':'+(i+1),log=a.logs[key],draft=(memoryDrafts.get(key)?.id===a.id?memoryDrafts.get(key).value:null)||a.drafts?.[key],value=draft||log;
 return `<div class="setrow" data-key="${key}" data-status="${draft?'pending':log?.status||'pending'}"><label class="field">${selectedSession==='C'||plan.emergency?'Registro':'Serie '+(i+1)+' · peso (unidad libre)'}<input data-field="weight" aria-label="${h(e.name)} ${i+1} peso" maxlength="100" value="${h(value?.weight)}" placeholder="Ej. 20 lb"></label><label class="field">${selectedSession==='C'||plan.emergency?'Resultado / duración':'Repeticiones'}<input data-field="reps" aria-label="${h(e.name)} ${i+1} resultado" maxlength="100" value="${h(value?.reps)}" placeholder="${h(e.reps)}"></label><label class="field" style="grid-column:1/-1">Nota / alternativa usada<input data-field="note" aria-label="${h(e.name)} ${i+1} nota" maxlength="2000" value="${h(value?.note)}"></label><div class="actions"><button class="btn primary" data-log-action="done">${log?.status==='done'?'✓ Guardada':'Guardar '+(selectedSession==='C'||plan.emergency?'registro':'serie')}</button><button class="btn outline" data-log-action="skipped">${log?.status==='skipped'?'Omitida ✓':'Omitir'}</button><span class="pill">${draft?'Borrador guardado · confirma la serie':log?'Guardado':'Pendiente'}</span></div></div>`;
 }).join(''):''}</article>`).join('');
 $('#sessionContent').innerHTML = html;
 let buttons='';
 if(visible) buttons=`<button class="btn primary" id="finishSession" ${setKeys(a.plan).every(k=>a.logs[k]&&!a.drafts?.[k]&&memoryDrafts.get(k)?.id!==a.id)?'':'disabled'}>Terminar y guardar sesión</button>`;
 else if(a) buttons=`<p class="callout">Hay una sesión en curso: semana ${a.week}, ${h(a.plan.title)}.</p><button class="btn primary" id="resumeSession">Continuar sesión activa</button>`;
 else if(done) buttons='<p class="callout">✓ Esta sesión ya está guardada. Puedes verla en tu seguimiento.</p>';
 else buttons='<button class="btn primary" id="startSession">Comenzar sesión</button>'+(selectedSession!=='C'?'<button class="btn outline" id="startEmergency">Usar Plan B en lugar de esta fuerza</button>':'');
 $('#sessionActions').innerHTML=buttons;
 $('#sessionProgress').textContent=visible?`${setKeys(a.plan).filter(k=>a.logs[k]&&!a.drafts?.[k]&&memoryDrafts.get(k)?.id!==a.id).length}/${setKeys(a.plan).length} registros resueltos. Puedes omitir una serie; no se registra como realizada.`:'';
 if($('#startSession')) $('#startSession').onclick=()=>mutate(raw=>store.start(raw,selectedWeek,selectedSession));
 if($('#startEmergency')) $('#startEmergency').onclick=()=>mutate(raw=>store.start(raw,selectedWeek,selectedSession,true));
 if($('#resumeSession')) $('#resumeSession').onclick=()=>{selectedWeek=a.week;selectedSession=a.session;render();go('sesiones')};
 if($('#finishSession')) $('#finishSession').onclick=()=>mutate(raw=>store.finish(raw,a.id),'Sesión guardada. Tu seguimiento está actualizado.');
 all('.setrow [data-field]').forEach(input=>input.oninput=()=>{
  const row=input.closest('[data-key]'), key=row.dataset.key;
  const value=Object.fromEntries([...row.querySelectorAll('[data-field]')].map(i=>[i.dataset.field,i.value]));
  const pending={id:a.id,value};memoryDrafts.set(key,pending);
  row.dataset.status='pending';$('#finishSession').disabled=true;
  row.querySelector('.pill').textContent='Guardando borrador…';
  mutate(raw=>store.draft(raw,a.id,key,value),'Borrador guardado. Confirma u omite la serie.',false).then(ok=>{
   if(ok&&memoryDrafts.get(key)===pending){memoryDrafts.delete(key);row.querySelector('.pill').textContent='Borrador guardado · confirma la serie';}
  });
 });
 all('[data-log-action]').forEach(b=>b.onclick=()=>{
  const row=b.closest('[data-key]');
  const value=Object.fromEntries([...row.querySelectorAll('[data-field]')].map(i=>[i.dataset.field,i.value]));
  value.status=b.dataset.logAction;
  if(value.status==='done'&&!value.reps.trim()){status('Anota las repeticiones, duración o resultado antes de guardar.',true);return}
  const scroll=window.scrollY;
  mutate(raw=>store.log(raw,a.id,row.dataset.key,value)).then(ok=>{if(ok)window.scrollTo({top:scroll,behavior:'instant'})});
 });
}
function renderHistory() {
 $('#totalCount').textContent=snapshot.data.history.length+'/36';
 $('#history').innerHTML=[...snapshot.data.history].reverse().map(entry=>`<details class="log"><summary>Semana ${entry.week} · ${h(entry.plan.title)} · ${Object.values(entry.logs).filter(s=>s.status==='done').length} realizados / ${Object.values(entry.logs).filter(s=>s.status==='skipped').length} omitidos</summary><p class="tiny">${h(entry.endedAt)} · Programa ${h(entry.programVersion)}</p>${entry.plan.exercises.map(e=>`<p class="small"><b>${h(e.name)}</b> · ${e.sets} × ${h(e.reps)} · RIR ${h(e.rir)} · Tempo ${h(e.tempo)} · Descanso ${h(e.rest)}</p>`).join('')}${Object.entries(entry.logs).map(([k,v])=>`<p class="small">${h(k)} · ${v.status==='done'?'Realizada':'Omitida'} · ${h(v.weight)} · ${h(v.reps)} · ${h(v.note)}</p>`).join('')}</details>`).join('');
 if(document.activeElement!==$('#feedback')) $('#feedback').value=snapshot.data.feedback;
}
function render() {if(snapshot){renderCalendar();renderSession();renderHistory()}}
function download(data) {
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='home-gym-respaldo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function offline() {
 if(!('serviceWorker' in navigator)){ $('#offlineStatus').textContent='Este navegador no permite instalar sin conexión.';return; }
 const statusOffline=text=>$('#offlineStatus').textContent=text;
 try {
  const r=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname,updateViaCache:'none'});
  const showUpdate=()=>{if(r.waiting)statusOffline('Actualización lista. Guarda tu sesión y respaldo; cierra todas las pestañas y vuelve a abrir.');};
  r.addEventListener('updatefound',()=>r.installing?.addEventListener('statechange',showUpdate));
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller){document.documentElement.dataset.offline='installed';statusOffline('Instalación completa. Cierra y vuelve a abrir para comprobar el uso sin conexión.');showUpdate();return;}
  const channel=new MessageChannel();
  const response=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('offline-status-timeout')),6000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)}});
  navigator.serviceWorker.controller.postMessage({type:'HOME_GYM_OFFLINE_STATUS'},[channel.port2]);
  const info=await response;
  if(info.ready){document.documentElement.dataset.offline='ready';statusOffline('Listo sin conexión en este navegador.');}
  else statusOffline('Instalación incompleta. Reconecta antes de cerrar.');
  showUpdate();
 } catch(_) { statusOffline('No se confirmó la instalación. Reconecta y vuelve a abrir; conserva tus datos.'); }
}
function boot() {
 // A pathname is not a privacy boundary. Refuse the FV hostname before any storage/SW access.
 if(location.hostname==='fevaldez.github.io'){
  status('Home Gym requiere un origen independiente. No se permite abrirlo en el origen de FV.',true);
  $('#offlineStatus').textContent='Instalación bloqueada en el origen FV.';
  document.documentElement.dataset.boot='blocked-origin';
  return;
 }
 for(let w=1;w<=12;w++) $('#weekSelect').add(new Option('Semana '+w,w));
 for(const [k,text] of Object.entries(PROGRAM.guidance)) if($('#'+k)) $('#'+k).textContent=text;
 $('#equipment').textContent='Equipo del programa: '+PROGRAM.equipment.join(', ')+'. No se confirma el rango total de cargas ni todos los anclajes.';
 $('#version').textContent=PROGRAM.title+' · '+PROGRAM.programVersion+' · Plantilla anónima. Inspiración: Tactical Barbell Mass; adaptación propia 2+1, sin reproducir sus plantillas.';
 $('#weekSelect').onchange=e=>{selectedWeek=Number(e.target.value);render()};
 $('#prevWeek').onclick=()=>{selectedWeek=Math.max(1,selectedWeek-1);render()};
 $('#nextWeek').onclick=()=>{selectedWeek=Math.min(12,selectedWeek+1);render()};
 all('[data-session]').forEach(b=>b.onclick=()=>{selectedSession=b.dataset.session;renderSession()});
 all('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
 $('#exportProgress').onclick=()=>{try{const backup=store.exportRaw();if(memoryDrafts.size){backup.unconfirmedDrafts=Object.fromEntries(memoryDrafts);try{const data=JSON.parse(backup.raw);for(const [k,d] of memoryDrafts)if(data.active?.id===d.id)data.active.drafts={...data.active.drafts,[k]:d.value};backup.raw=JSON.stringify(data);}catch(_){backup.unconfirmedDrafts=Object.fromEntries(memoryDrafts)} }download(backup);status('Respaldo descargado. Guárdalo en un lugar privado.')}catch(e){fail(e)}};
 $('#importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>4000000)throw Error('wrong-backup');const data=JSON.parse(await file.text());if(confirm('¿Restaurar este respaldo de Home Gym? Solo se admite en un navegador sin progreso.'))await mutate(raw=>store.restore(raw,data));}catch(e){fail(e)}finally{e.target.value=''}};
 $('#saveFeedback').onclick=()=>mutate(raw=>store.feedback(raw,$('#feedback').value));
 $('#refresh').onclick=()=>{try{snapshot=store.read();stale=false;$('#refresh').hidden=true;render();status('Datos guardados leídos. Puedes continuar.')}catch(e){fail(e)}};
 addEventListener('beforeunload',e=>{if(memoryDrafts.size){e.preventDefault();e.returnValue='';}});
 addEventListener('storage',e=>{if(e.key===KEY){stale=true;status('Otra pestaña cambió los datos. Vuelve a leerlos antes de continuar.',true);$('#refresh').hidden=false;}});
 try {
  store=createStore(localStorage,navigator.locks);snapshot=store.read();
  if(snapshot.data.active){selectedWeek=snapshot.data.active.week;selectedSession=snapshot.data.active.session;}
  render();status('Datos locales listos. Guarda cada serie para conservarla.');
  document.documentElement.dataset.boot='ready';
 } catch(e){fail(e);document.documentElement.dataset.boot='storage-error';}
 offline();
}
boot();
