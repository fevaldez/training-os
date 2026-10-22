# PR-A Offline-first — cierre LIVE RC6.4.0 y runbook histórico

**Estado vigente (2026-10-21, America/Monterrey):** PR-A ENTREGADO, PR #7 MERGED, `4.0.0-rc6.4.0` LIVE VERIFIED. Este documento no autoriza nuevas acciones. El CSE y los prompts originales del 19-oct se conservan como archivo histórico.
**Source desplegado:** `5b69389c5a8d0a1257a33c157b4da5488899080c`; candidate `80f09b93b7261a8aada93936431c6c2e2131a6e3`; baseline pre-merge `8dd621d05ef66baa9773518c4a45ac3bdd7ed5d1`.
**Objetivo verificable:** una instalación/carga **previamente completada** de Training OS puede abrirse de nuevo y ejecutar/guardar una sesión sin conectividad, en Safari y Home Screen compatibles, sin perder historial/datos, con actualización controlada y restauración de funcionamiento al reconectar.  
**Exclusiones explícitas:** no garantiza primera visita sin conexión, no repara DNS/TLS/red celular al hacer la primera descarga, no promete inmunidad a evicción o borrado del navegador/OS, no proporciona sync cloud/multi-device, no habilita uso de videos remotos offline, no crea SaaS.

## Cierre vigente y uso de este runbook

El [checkpoint canónico actualizado](../../TRAINING_OS_RETOMA_2026-10-19.md) contiene los ocho hashes servidos, incident log reconciliado, lecciones, backlog priorizado y **prompt exacto para retomar en Codex o ChatGPT**. Reutilizar esos resultados; no volver a ejecutar el CSE, M0–M4 ni los prompts H–J por encontrarlos aquí. Si el Draft PR documental sigue sin integrar, leer ambos archivos desde `codex/rc640-live-checkpoint`; después del merge, leerlos desde main y distinguir SHA documental de source desplegado.

### Hitos cerrados y procedencia

| Gate | Resultado registrado | Evidencia |
|---|---|---|
| Registro original | COMPLETADO | [PR #6 MERGED](https://github.com/fevaldez/training-os/pull/6) |
| Implementación/CI PR-A | COMPLETADO | [PR #7 MERGED](https://github.com/fevaldez/training-os/pull/7); [candidate CI #39705646023 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39705646023) |
| Runtime tras QA de Preview | Identidad de release únicamente | Parent `ef39ab5acf5cfc38dbd161265b6b1742339b7249` → candidate RC6.4.0: cinco referencias de release del HTML, `version.json`, worker regenerado y assertions de identidad; runtime funcional sin delta nuevo |
| Merge y CI de main | COMPLETADO | Merge `5b69389c5a8d0a1257a33c157b4da5488899080c`, ancestros conservados; [#39716304405 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39716304405), job deploy SKIPPED |
| Publicación protegida | COMPLETADO | Un dispatch [#39716512481 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39716512481), `approved_sha` exacto y `publish=true`; aprobación humana registrada `fevaldez`; deployment `7242896994` SUCCESS |
| HTTP/artefacto de producción | PASS técnico | [Producción](https://fevaldez.github.io/training-os/), release RC6.4.0; ocho hashes, tamaños, MIME y ruta correctos; archive exacto al source. Tabla completa en checkpoint canónico |
| Instalación/control en Pages | PASS técnico | Contexto Chromium nuevo desechable, scope `/training-os/`, build `4647f32b6a4de08888090f212bbdcbbaa77f4999ecb8447b3387ec3c0446b94e`, siete entradas íntegras de Cache API, arranque controlado y cold-tab relaunch offline PASS |
| Safari y Home Screen físicos | PASS reportado por owner | Respuesta final “Both Safari and Home Screen passed” en este chat: RC6.4.0, historia/sesión intactas, instalación lista y relanzamiento en modo avión. Atestación, no medición remota |

No se afirma un número físico de diez relanzamientos, cinco interrupciones, ni pruebas físicas de cuota/evicción que no figuran en la respuesta del owner. La matriz F original contiene **criterios propuestos**, no resultados completados por inferencia. La QA Vercel aislada no demostró por sí sola migración del origen Pages; el smoke fresco de Pages y la confirmación del propietario son evidencia posterior diferenciada.

### Contrato realmente entregado

- Cache-first de una versión coherente, con siete assets públicos permitidos y `sw.js` como octavo archivo del pipeline; manifest de build con tamaños/SHA-256/MIME y digest de runtime, sin hash circular del worker.
- Instalación completa validada y readback; parcial falla sin false-ready. Registro/control y cache completo deben coincidir para indicar “Disponible sin conexión”.
- Scope `/training-os/` y fetch de rutas/URLs exactas; otros caminos, métodos y orígenes usan red. Videos son online-only. La identidad PWA no cambió.
- Activación normal diferida hasta cerrar clientes controlados; no `skipWaiting`, `clients.claim`, reload forzado ni borrado global. Se conservan caches anteriores/ajenos; un update fallido no elimina la versión activa válida.
- Las dos rutinas de cleanup se retiraron del HTML nuevo; esto no impide que una pestaña legacy aún abierta ejecute su código anterior. Conservar trabajo y cerrar clientes viejos es parte del cutover.
- SW no guarda datos personales; `fv4.*`, journals, locks, campos desconocidos y motor/prescripciones se preservaron. No backend, sync cloud/multidispositivo ni SaaS.

### Límites y riesgos que NO se cerraron

1. **Post-boot “Script error”: OPEN/UNKNOWN.** Riesgo residual aceptado para este release; no se declara inocuo. El smoke Chromium no lo reprodujo, lo cual no es RCA ni cierre. Detener release work si aparece crash reproducible, persistencia rota o fallo offline warm-installed.
2. **Main sin protección: OPEN**, aceptado para esta integración controlada. El hold Pages se verificó con reviewer `fevaldez`, self-review permitido, bypass deshabilitado y main-only; no sustituye branch protection. Cambios de settings requieren aprobación exacta nueva y reviewer elegible sin deadlock.
3. **Primera carga 5G: OPEN/UNKNOWN.** Warm-install offline no repara primera descarga, DNS/TLS/CDN/ruta ni acredita culpable. Solo investigar en una reproducción con `index.html`/`version.json` y WARP en la misma ventana de fallo; sin nuevo research general.
4. **Evicción/cuota y rollback de datos:** cache puede desaparecer; conservar restores/exports privados por almacén. Un shell anterior no garantiza compatibilidad con persistencia escrita después. Preferir recuperación/forward-fix compatible; no rollback HTML ciego.
5. **Almacenes/contextos:** Safari, Home Screen y dispositivos no sincronizan automáticamente. No cache clearing, desinstalación, unregister ni force activation como troubleshooting.

### Próxima misión y recuperación

Prioridad: (1) reproducción causal acotada del Script error, (2) propuesta/aprobación de protección main, (3) RCA 5G solo al reproducirse, (4) compatibilidad/recovery de versiones, (5) una mejora de producto elegida por owner. El checkpoint canónico especifica evidencia, responsable y límites; no se inicia ninguna por leerlo.

Para una incidencia, preservar sesión/historia, backups y señales no sensibles; detener nuevas publicaciones si hay impacto de integridad o disponibilidad demostrable. No subir datos privados. Para retomar normalmente, guardar trabajo, cerrar clientes viejos, reabrir online y medir readiness antes de probar modo avión; un tab viejo no implica deployment fallido.

## Archivo del diseño y run guide original (A–K)

**Las secciones siguientes documentan el razonamiento y la secuencia del 2026-10-19, previos a PR #7.** Sus referencias a cleanup presente, siete assets, PR-A pendiente, matrices vacías y prompts de implementación/revisión son históricas. No son instrucciones vigentes, autorización para nuevas acciones ni evidencia física del release actual. No ejecutar los prompts H–J sin una nueva misión explícita; PR-A ya se implementó y publicó.

## A. CSE — self-evaluation crítico y contradicciones de diseño

### Supuesto 1: "Basta añadir `sw.js`"
**FALSO**: el HTML RC6.3.1 elimina Service Workers y Cache API al arranque **por duplicado**:
- `index.html` ~L130–138 en `tosReliabilityBootstrap()` desregistra registros cuyo `scope` incluye `/training-os/` y borra cachés con nombres `training-os`/`fv-training-os`.
- `index.html` ~L140 repite la operación.
- `scripts/test_reliability_rc621.py` exige expresamente ese cleanup legacy.
- `release-pages.yml` ~L108–114 hace `_site` con **siete** assets fijos; un worker añadido al árbol Git **no** sería publicado.
**Implicación P0:** un worker nuevo sería eliminado al abrir la aplicación, dando falso “offline ready”; la ruta de actualización y el release fijo deben migrarse simultáneamente. Probar el cleanup anterior en el **mismo contexto de origen simulado**, no en origen de producción.

### Supuesto 2: "Si `version.json` carga en 5G, el hosting está perfecto"
**NO DEMOSTRADO.** `version.json` es pequeño (266 bytes) y el `index.html` inline ~154 KB. Fallos intermitentes de documento podrían ser CDN/ruta/operador/HTTP/TLS/IPv6 o del navegador. WARP mejora la ruta pero no identifica causa. Ni el engine ni el Service Worker (cuando no está instalado) pueden reparar la primera descarga. Ejecutar RCA de red en paralelo **solo si** se vuelve a presentar, sin bloquear diseño PR-A.

### Supuesto 3: "Service Worker = datos persistentes para siempre"
**FALSO.** WebKit documenta cuotas y evicción a nivel de origen; las PWA Home Screen y Safari tienen contextos de almacenamiento separados. Cache API es para shell, no para historia. `localStorage`/journal existentes siguen con las mismas limitaciones; la protección sigue dependiendo de export/restore probado. Referencias: https://webkit.org/blog/14403/updates-to-storage-policy/ y https://webkit.org/blog/14787/webkit-features-in-safari-17-2/.

### Supuesto 4: "Actualización inmediata es segura"
**NO.** `skipWaiting()` y `clients.claim()` pueden introducir nueva lógica bajo clientes que siguen ejecutando HTML viejo. No hacer force activation por defecto; preparar versión completa, retener último cache bueno hasta terminar sesiones, pedir actualización explícita solo con writes confirmados y sin conflicto entre pestañas. Referencia: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting.

### Supuesto 5: "Rollback del HTML restaura el estado"
**FALSO.** Versiones anteriores pueden no entender journal/locks o nueva estructura. Congelar writes, exportar estados divergentes, preferir forward-fix. No hacer rollback ciego de app ni borrar caches validados. Conservar un shell anterior no equivale a garantizar compatibilidad de almacenamiento.

### Supuesto 6: "Los tests Chromium PASS validan iPhone"
**FALSO.** Safari y Home Screen soportan SW/Cache API pero tienen diferencias de partición/evicción/lifecycle. Éxito final exige pruebas físicas en iPhone con Wi-Fi, red celular, modo avión, cierre completo, relanzamiento y cambio de versión. WebKit: https://webkit.org/blog/8090/workers-at-your-service/.

### Supuesto 7: "Cambiar hosting evitará fallos"
**NO demostrado y peligroso para datos.** Nuevo origen implica almacenamiento distinto. Mantener `https://fevaldez.github.io/training-os/`, mismo `manifest.id`, `scope` y `start_url` y no migrar historial a otro dominio como parte de PR-A.

## B. Matriz completa de huecos, severidad y aceptación

Etiquetas: `B`=bloqueante antes de publicar, `R`=riesgo explícito con test, `D`=deuda para otro PR.

| ID | Gate | Hueco observado o riesgo | Evidencia mínima/aceptación | Prioridad |
|---|---|---|---|---|
| A-01 | código | Doble cleanup SW/cache actual elimina futura PWA | Reemplazo acotado, migración solo LEGACY y nunca caches PR-A; test de upgrade en estado viejo | **B** |
| A-02 | tests | Test `test_reliability_rc621.py` exige limpieza incompatible | Cambiar afirmación a contrato seguro; RED→GREEN, sin eliminar cobertura contra legacy | **B** |
| A-03 | artefacto | `_site` publica exactamente siete archivos; no worker | Lista allowlist ampliada explícitamente, hash/size verification y MIME `application/javascript`; ninguna data privada | **B** |
| A-04 | CI | Workflow path filters no incluyen SW/offline tests | PR validation, main push validation y manual release verifican cambios SW y suite offline; guard anti-autodeploy | **B** |
| A-05 | integridad | Cache parcial/descarga HTML corrupta/200 portal cautivo | Precache transaccional, respuesta HTTP válida, verificación de tamaño/tipo/hash; cache anterior retenido | **B** |
| A-06 | arranque | Primera instalación no controlada por SW | `offline-ready` solo después de instalación completa y cliente controlado; no false PASS inicial | **B** |
| A-07 | rutas | `/training-os/` y `/training-os/index.html` pueden diferir | Offline navigation fallback exacto a shell validado dentro del scope; no interceptar otro path | **B** |
| A-08 | privacidad | Intercepción de rutas de otros proyectos y contenido remoto | `scope=/training-os/`, allowlist exacta; cross-origin/YouTube network-only, no historial en Cache API | **B** |
| A-09 | datos | Cache/PWA introduce lecturas stale frente a journals | Mantener `fv4.history`, `fv4.active`, backup/journal/locks, desconocidos, idempotencia; ninguna migración de datos | **B** |
| A-10 | concurrencia | Clientes previos, pestañas y Home Screen con versiones diferentes | Test de actualización con sesión activa, otras tabs, locks y writes; no activar worker nuevo a mitad de sesión | **B** |
| A-11 | storage | Safari y Home Screen NO comparten storage local | Dos matrices QA por contexto; respaldos/restauraciones separados; no reclamar sync | **B** |
| A-12 | recuperación | Cuota, evicción, Cache API falla | `QuotaExceededError` no borra datos; no false-ready; fail closed; respaldo funciona; indicar necesidad online para reinstalar | **B** |
| A-13 | shell | Inicio offline necesita 7 activos + worker bajo mismo origen | Hacer warm load online, comprobar control y luego cortar red/kill/relaunch con test | **B** |
| A-14 | update | SW nuevo puede servir HTML viejo o viceversa | Cache namespace por release/SHA; activación voluntaria; recuperación de versión inconsistente | **B** |
| A-15 | observabilidad | Sin métricas/sync, el indicador de red podría mentir | Estado medido por control y disponibilidad local de shell; diagnóstico mínimo sin PII, sin telemetría externa | R |
| A-16 | Safari | Page lifecycle, foreground/background, OS suspension | iPhone físico Safari y Home Screen, red celular/WARP/mode avión, cold/warm start, forzado cierre; no pérdida confirmada | **B** |
| A-17 | restore | Export/import offline con estados y planes personalizados | Datos sintéticos export/restore completos antes/después de reboot, rechazar bytes inválidos sin writes | **B** |
| A-18 | compatibilidad | iOS/OS eviction no controlable | Documentar como limitación, verificar advertencia y path de recuperación; no prometer persistencia absoluta | R |
| A-19 | seguridad | Caché permite shell viejo con una vulnerabilidad conocida | Check de versión seguro al reconectar, política update sin sobrescritura RAM, opción de corrección delante | R |
| A-20 | release | Main sin branch protection, gate scroll 19/20 inestable | Registrar deuda; controles existentes de manual-only/SHA/environment se mantienen; fixes separados si no bloquean release PR-A | R |
| A-21 | delivery | PR #3 histórico PRE-RELEASE y #4 Draft stale | No merge de ramas antiguas, no reutilizar artefactos SHA antiguos; PR-A desde latest verified main | **B** |
| A-22 | privacy | Same-origin futuro Home Gym | No SW interceptando `/homegym` ni nombres ajenos; no acceso al historial por vías nuevas; multiuser fuera de alcance | R |
| A-23 | tiempos | “Offline” se confunde con WARP/no internet/airplane | Probar desconexión real modo avión, no `navigator.onLine` como evidencia única | **B** |
| A-24 | prueba de entrega | QA Vercel tiene origen distinto de Pages, y hash de assets no prueba cache listo | QA aislada + simular upgrade en mismo origen sintético + aprobación iPhone real antes de Pages; final smoke posrelease | **B** |
| A-25 | CSS/media | Videos externos pueden impedir render o retrasar boot | Sin dependencia de streaming ni fonts/CDNs remotos para shell; videos marcados online-only | R |
| A-26 | rollback | Worker y caché pueden sobrevivir a HTML rollback o borrarse inadecuadamente | Procedimiento rollback con desactivación compatible, export previa, no `caches.delete` global; test de versión | **B** |
| A-27 | monitoring | Incidente 5G intermitente sigue sin RCA | Capturar dos rutas durante **misma ventana de fallo** y WARP, mediciones HTTP sin datos sensibles | D, independiente de PR-A |
| A-28 | headers | Metas HTML `Cache-Control` no demuestran headers HTTP reales; Cache API es otro mecanismo | Verificar headers reales, respuestas/no-store, SW update headers y almacenamiento offline tras cache.put; no inferir política por `<meta>` | R |
| A-29 | QA host | Safari dentro de ChatGPT/in-app webview no equivale al Safari completo ni al modo standalone | QA físico abrir explícitamente en Safari y Home Screen; no aceptar navegador integrado como único PASS | **B** |

**Resultado CSE:** no hay razón técnica para rehacer el motor workout ni incorporar backend. Los bloqueos de PR-A son entrega atómica, SW cleanup legacy, compatibilidad con storage y QA físico. Es imposible demostrar “todos los defectos futuros”; estos 29 riesgos cubren los vectores evidenciados y los escenarios previsibles para este PR. Nuevos defectos verificables reabren solo su gate.

## C. Arquitectura objetivo mínima (sin SaaS)

```
https://fevaldez.github.io/training-os/
          │
          ├── /training-os/sw.js   (nuevo, solo scope /training-os/)
          │     ├── install: precache inmutable de assets permitidos; integridad y atomicidad
          │     ├── activate: conmutación versionada SIN borrar otro origen/datos
          │     └── fetch: navigation exacta -> shell validado offline;
          │                assets permitidos -> caché validada;
          │                otros caminos/cross-origin -> red normal
          │
          ├── index.html (runtime actual, lógica y storage inalterados)
          ├── version.json (identidad/hash release)
          ├── manifest.webmanifest (misma identidad/scope)
          └── 4 icons inmutables

localStorage existente: fv4.history / fv4.active / journals / locks
                   ↑ intacto; SW NUNCA almacena historial en Cache API

GitHub PR CI (read-only) → main push validate only → manual
workflow_dispatch approved_sha=HEAD + publish=true → Pages human review
```

**Política de fetch sugerida:** pre-cache shell y assets de versión exacta; usar shell cacheada en navegación bajo alcance **cuando offline**. En línea, estrategia elegida debe evitar cargar HTML de versión incompatible con SW: evaluar `cache-first` con actualización explícita/versión fija frente a `network-first` con fallback y control de consistencia. Elegir mediante tests de upgrade, no por preferencia. Nunca actualizar la pestaña con sesión activa automáticamente. `version.json` de red no es una condición para abrir offline tras warm-install.

**Integridad:** crear manifest/allowlist de activos con hashes a partir del commit (puede ser metadata de build dentro del SW; evitar dependencia circular). La instalación solo se declara completa si todas las respuestas requeridas pasan verificación, sin servir placeholders/portal cautivo. Mantener último release bueno; no eliminar cachés del nuevo/activo release al migrar legacy. Un fallo de actualización deja versión anterior operativa si conserva compatibilidad con datos.

## C.1. Optimización anti-stalling — 5 familias de pruebas, NO 29 ejecuciones

La matriz de 29 riesgos es para cobertura y trazabilidad, **no** implica 29 auditorías, 29 chats ni 29 runs de CI. Consolidar la evidencia en estas cinco familias, ejecutando la suite completa **una sola vez contra el SHA final del PR**:

1. **Compatibilidad/instalación:** cleanup viejo + migración + cache íntegra (A-01–A-07, A-21, A-28).
2. **Seguridad/datos:** aislamiento exacto, `fv4.*`, journals, history, locks, backups, cuota (A-08–A-12, A-17–A-19, A-22).
3. **Lifecycle/versiones:** offline cold restart, actualización con sesión, rollback sin wipe, clientes viejos (A-13–A-15, A-26).
4. **Release/QA:** artifact y SHA, CI, HTTPS/MIME, Safari + Home Screen + cuota/fuerza cierre (A-16, A-20, A-23–A-25, A-29).
5. **Operador 5G:** RCA separada y opcional, únicamente con reproducción simultánea del fallo (A-27). **No bloquea** PR-A si cumple su contrato warm-installed offline.

**Criterios medibles propuestos (no resultados observados):** 0 fallos en 10 relanzamientos desconectados consecutivos por contexto Safari y Home Screen después de warm-install; 0 pérdidas/duplicados en historiales sintéticos comparados byte/lógicamente tras 5 eventos de interrupción/actualización; 100% de hashes en artefacto publicado; 0 activaciones automáticas disruptivas de sesión; 0 persistencias alteradas por el SW. Estos umbrales no sustituyen el caso de cuota/evicción y no implican fiabilidad estadística del 100%.

**Economía de proceso:** 1 PR de runtime, 1 revisión independiente focalizada, 1 preview del SHA final, 1 QA físico del propietario, 1 autorización de merge y otra de deploy. Si una prueba falla, reejecutar **solo el delta** y la regresión requerida, luego CI final; no reabrir auditorías cerradas.

## D. Divide & conquer — roles, chats, modelos, permisos

El usuario exige mínimo de chats, no procesos redundantes. **Un chat de implementación y otro de aceptación, más el hilo release existente para el gate de producción.** Los nombres de modelo son preferencias sujetas a opciones realmente disponibles; usar equivalente con razonamiento alto sin inventar configuraciones.

| Etapa | Chat Codex exacto | Modelo / effort | Permisos y límites | Salida |
|---|---|---|---|---|
| 0 registro | `Prepare Track A release readiness` | GPT-6 / High | `workspace-write`, `on-request`, **solo documentos** en rama `codex/rc631-pr-a-handoff-20261019` | Un Draft PR documental; CI; sin release |
| 1 implementación PR-A | **Chat nuevo: `Implement PR-A Offline-first`** en proyecto `training-os-release` | GPT-6.1 Sol / High si disponible | `workspace-write`, `on-request`, worktree nuevo desde `main` verificado; **requiere autorización explícita de código** | Una rama `codex/pr-a-offline-first`, un Draft PR, RED→GREEN y CI |
| 2 aceptación independiente | `G2 Independent Review` | GPT-6 / High (Astra/High si existe) | **read-only**, sin commits; revisión SOLO de diff y matrices A-01..29 | GO/NO-GO de PR-A con bloqueos demostrados |
| 3 staging/release | `Prepare Track A release readiness` | GPT-6 / High | Acceso de release `on-request`; QA Preview & merge **solo autorizados separadamente** | Una QA Preview por SHA, iPhone PASS, merge/deploy controlados |

**No crear un cuarto chat de producto ni PR de refactor, observabilidad invasiva o Home Gym.** Si Codex no puede acceder al repo o permisos, detener con una sola acción del propietario, sin autenticaciones en bucle.

## E. Secuencia de ejecución, hitos y gates

### M0 — Registro de documentos (SIN código)
- Verificar SHA actual de `main` y leer `AGENTS.md`.
- Crear rama `codex/rc631-pr-a-handoff-20261019` desde baseline vivo y **únicamente** agregar `TRAINING_OS_RETOMA_2026-10-19.md` y `docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md`.
- Abrir Draft PR. Comparar nombres de archivos y confirmar ningún cambio a runtime, workflows, scripts, versiones o datos.
- No merge ni release de documentación; owner autorizará por separado si quiere integrarlo.

### M1 — PR-A contrato y RED mínimo (después de autorización de implementación)
- Comprobar `main`, exact-hash `index.html`, `AGENTS.md` y no cambios desde release; si `main` cambió, usar nuevo HEAD y señalar delta.
- Reproducir RED: no abrir en modo avión tras primera visita actual; demostrar limpieza SW doble; gate de siete assets sin worker; `test_reliability_rc621.py` obliga cleanup.
- Escribir tests que fallan en baseline: instalación offline no operativa, worker eliminado en reload, update con sesión/pestaña y empaquetado incompleto.
- No repetir N1/N2/engine sin cambios hasta regressions finales requeridas.

### M2 — Código mínimo + GREEN
- Añadir SW solo para scope apropiado y un registro seguro no destructivo; retirar/reemplazar las **dos** rutinas legacy que borran worker/cache nueva. Mantener rechazo/acotamiento de workers viejos ajenos.
- Extender allowlist y pipeline Pages, controles de integridad, SHA/version, PR validation y manual release gates para worker nuevo; preservando approvals y no autodeploy.
- No tocar `fv4` schema/journals, timers, sets/reps, programación, gym data, manifest `id`/`start_url`/`scope`, ni dependencias remotas.
- Offline shell idempotente, actualización sin auto-activation durante sesión, soporte de fallo/rollback sin borrar historial.
- Agregar pruebas green de todo A-01..29 bloqueante; full required CI una vez en final HEAD y un set reducido de browser real.

### M3 — Revisión/Preview y aceptación física
- Revisión independiente solo del delta con una sola lista de contraejemplos reproducibles y criterios de aceptación. No reabrir G2/N1/N2.
- Publicar **solamente con autorización** una Preview aislada del HEAD final, controlar el mismo `scope` en `/training-os/`, MIME SW, HTTPS y hashes servidos.
- Desplegar baseline RC6.3.1 y después PR-A en mismo **origen desechable de QA** para verificar migración del cleanup antiguo. No poner datos reales en QA.
- Prueba física iPhone en Safari y Home Screen; usar datos sintéticos. Antes de todo test destructivo, exportar/restaurar el estado de prueba y validar persistencia. No desinstalar producción.

### M4 — Gate de release y seguimiento
- Owner confirma SHA+QA+respaldo privado+clientes previos; autoriza merge únicamente cuando corresponda.
- Integrar un PR, esperar CI en `main`, verificar que no hubo autodeploy, nueva aprobación separada `workflow_dispatch`, `approved_sha`, `publish=true` y reviewer `fevaldez`.
- Después release verificar offline readiness y primera reconexión **en dispositivo real** junto con historia, sesión, programaciones, cache y versión. Si falla, detener cambios y preservar datos; no forzar rollback HTML antiguo.

## F. Matriz física de aceptación (PASS/FAIL/UNKNOWN, no inferir)

| Prueba | Safari | Home Screen | Criterio |
|---|---|---|---|
| Primera carga ONLINE y warm-install de SW | ___ | ___ | Shell, cache completo y control por worker confirmados; sin false-ready |
| Modo avión tras warm-install; abrir URL/start_url | ___ | ___ | App abre, muestra rutina; no red necesaria |
| Cerrar por completo y relanzar en modo avión | ___ | ___ | App abre sin timeout ni wipe de storage; conservar sesión |
| Completar set offline (peso positivo/zero explícito) | ___ | ___ | Commit y lectura persistente tras relanzar, no duplicados |
| Omitir partner biserie, cooldown y guardar offline | ___ | ___ | Sin `next.ei`/`malformed`, registros/skips/tiempos intactos |
| Exportar respaldo sintético offline y restaurarlo en contexto separado | ___ | ___ | Campos históricos, unknown, unidades y progreso intactos |
| Abrir otras tabs activas / cambio de versión mientras sesión | ___ | ___ | Sin actualización disruptiva ni escrituras obsoletas |
| Red celular intermitente tras instalación, WARP on/off | ___ | ___ | Si no hay red, shell cacheado abre; no atribuir causa del operador |
| Reconectar; actualizar a versión nueva con guardado confirmado | ___ | ___ | Sin reescribir historial ni romper locks/journals |
| Falla de precache/quota/evicción simulada | ___ | ___ | No false-ready, no borrado de historial, recuperación guiada |
| Vieja versión instalada con legacy SW/cache | ___ | ___ | Migración no desregistra nuevo worker ni borra cache activo |
| Enlace externo de video con app offline | ___ | ___ | Falla informativa/online-required; no bloquea render shell |

**Criterio objetivo de GO:** 0 fallos P0/P1 demostrados en escenarios bloqueantes, CI y navegadores de PR-A PASS en **el mismo HEAD**, pruebas físicas Safari **y** Home Screen completas, respaldo/restore probado, y publicación protegida. Una sola prueba exitosa con Wi-Fi **no** es offline acceptance. No convertir `UNKNOWN` en `PASS` por conveniencia.

## G. Pre-mortem (top risks, mecanismos de mitigación)

| Riesgo | Señal temprana | Defensa |
|---|---|---|
| HTML de arranque elimina SW cada vez | `navigator.serviceWorker.controller === null` tras reload / cache missing | Reemplazar cleanup duplicado y prueba de migración legacy |
| Offline funciona en Chromium, no en iPhone | Modo avión y Home Screen falla | Dos matrices Safari/Home Screen físicas, con cold restart |
| Quota/Eviction causa pantalla vacía | Cache API rechazado, `SW install` failed | Instalación atómica/fail-closed, export, diagnóstico no PII, re-warm online |
| Nuevo HTML y SW incompatible con active-session | Session corrupta o salto de datos tras update | Pin de versión y activación diferida sin `skipWaiting` automático |
| Pipeline publica HTML nuevo sin `sw.js` | MIME 404 o cache-old | Allowlist explícita y hash de 8+ assets en artifact y served |
| Serving stale shell en red celular y confusión de release | Versión visible difiere `version.json` y HEAD | Verificar versión shell/caché y política update explícita |
| Cualquier SW atrapa otro piloto same-origin | Captura de rutas fuera `/training-os/` | Registro/scope y fetch match exactos; tests de aislamiento |
| Repetición del falso gate 19/20 | CI bloquea release por timing | Workstream de deuda independiente, no bajar cobertura silenciosamente |

## H. Prompt Codex M0 — registrar estos dos documentos (autorización documental existente)

**En chat exacto `Prepare Track A release readiness`**; GPT-6 / High, workspace-write + on-request. Adjuntar ambos Markdown tal cual; no usar copy/paste parcial.

```text
TRAINING OS — REGISTER LIVE + OFFLINE-FIRST HANDOFF (DOCS ONLY)
Repository: fevaldez/training-os
Historical production baseline: ba5e4f7ee405d96c5e9100b297bc5481bf183e80
Attachments:
- TRAINING_OS_RETOMA_2026-10-19.md
- PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md

Use the SAME "Prepare Track A release readiness" conversation. Read AGENTS.md.
Verify current main; if advanced, compare before continuing and stop if milestone material changed.
Create isolated branch codex/rc631-pr-a-handoff-20261019 from exact verified main.
Place files exactly at:
- TRAINING_OS_RETOMA_2026-10-19.md
- docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md
Perform a read-only factual link/SHA check; do not rewrite source-supported history silently.
Commit and push ONLY these two Markdown files, open ONE Draft PR against main.
Report PR URL, full commit SHA, two-file changed manifest and CI.
NO changes to index, version, manifest, worker, workflows, tests, production data or credentials.
NO merge, Ready, tag, deploy, release, PR-A code or additional research.
STOP after Draft PR and checkpoint.
```

## I. Prompt Codex M1–M2 — implementación PR-A (NO EJECUTAR sin autorización expresa)

**Abrir nuevo chat Codex `Implement PR-A Offline-first`**, dentro de `training-os-release`; GPT-6.1 Sol / High, workspace-write, on-request. Leer ambos documentos ya versionados. No utilizar un prompt de implementación como sustituto de la autorización de código.

```text
TRAINING OS — PR-A OFFLINE-FIRST, BOUNDED IMPLEMENTATION
Precondition: owner explicitly authorizes PR-A runtime/workflow changes in this chat.
Repository fevaldez/training-os. Read AGENTS.md, current main, and
TRAINING_OS_RETOMA_2026-10-19.md + docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md
from the exact registered Draft documentation PR (or main after separately approved integration).

MISSION: one isolated branch codex/pr-a-offline-first based on verified current main;
one Draft PR, no production or staging deployments unless separately authorized.

GATE 1 RED: reproduce double SW cleanup, fixed seven-asset packaging, offline cold-relaunch fail;
validate storage/source invariants and demonstrate baseline fail from real code.
GATE 2 minimal design/implementation: safe legacy cleanup migration, narrow service-worker
scope, atomic versioned precache, complete verified app-shell allowlist, offline navigation,
no caching personal history, no schema/runtime workout changes, safe activation with active
session and multiple tabs, safe update fallback, correct Pages artifact allowlist and CI triggers.
GATE 3 GREEN: deterministic SW install/update/failure/eviction tests, legacy upgrade,
no-session-loss/locks/skip/weight, offline browser smoke and full required suites once final.
GATE 4: commit/push only branch; Draft PR, exact-head CI, evidence table A-01..A-29
PASS/FAIL/UNKNOWN, changed-file manifest, 8+ served-asset plan, physical iPhone test matrix.

STOP on any unmitigated P0/P1 gate; never mark Safari/Home Screen physical tests PASS remotely.
No extra feature work, CI weakening, real user files, automatic skipWaiting/clients.claim,
Ready, merge, Pages deploy, tag, PR-A approval inference or paid services.
```

## J. Prompt independiente M3 — revisión (DESPUÉS de implementación, no antes)

**Chat exacto `G2 Independent Review`**, GPT-6 / High o Astra/High disponible, read-only.

```text
TRAINING OS — INDEPENDENT PR-A DELTA ACCEPTANCE
Read the registered PR-A CSE runbook, candidate Draft PR diff and exact-head test artifacts.
Check independently only A-01..A-29 relevant gates, especially old SW/cache cleanup,
versioned cache, Pages artifact, Safari/Home Screen unknowns, concurrent old clients,
persistence and recovery, and first-online-load limits.
Create minimal reproductions of any suspected P0/P1; do not repeat original N1/N2 audit.
Return PASS/FAIL/UNKNOWN, exact source lines/SHAs and smallest corrective actions.
No code, commits, staging, merge or release. No acceptance of physical iPhone by inference.
```

## K. Sources (primary vs inference)

**Source-derived GitHub:**
- Code cleanup: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/index.html#L130-L142
- Cleanup test: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/scripts/test_reliability_rc621.py
- Release `_site` allowlist: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/.github/workflows/release-pages.yml#L108-L133
- Current manifest: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/manifest.webmanifest
- Repo-specific operational policy: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/AGENTS.md

**External authority and limitations:**
- WebKit storage quotas and eviction: https://webkit.org/blog/14403/updates-to-storage-policy/
- WebKit first-party Home Screen storage isolation: https://webkit.org/blog/14787/webkit-features-in-safari-17-2/
- WebKit service workers and Cache API: https://webkit.org/blog/8090/workers-at-your-service/
- MDN service worker lifecycle / offline / updates: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- MDN skipWaiting risk: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting

**Inferences, not confirmed causes:** 5G operator/CDN/DNS/IPv6/TLS/Routing, predicted iOS SW stability, rollback compatibility. Reproduce before claiming root cause.

---
**Acceptance of this DOCUMENT does not approve runtime code or future publication.** Do not turn every UNKNOWN into work; only those affecting a P0/P1 safety gate block shipping.
