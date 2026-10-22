# Training OS — checkpoint canónico LIVE RC6.4.0

**Actualizado:** 2026-10-21, America/Monterrey. Se conserva el nombre histórico del archivo para mantener enlaces. GitHub expresa los eventos de este release en UTC del 2026-10-22.

**Estado:** `4.0.0-rc6.4.0` LIVE VERIFIED; verificación técnica PASS y aceptación física final **reportada por el propietario** PASS en Safari y Home Screen. Este documento registra evidencia; **no autoriza código, cambios de settings, Ready, merge, tags ni despliegues futuros**.

**Repo:** [fevaldez/training-os](https://github.com/fevaldez/training-os). **Producción:** [https://fevaldez.github.io/training-os/](https://fevaldez.github.io/training-os/). Leer `AGENTS.md` y el [runbook existente](docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md). PR-A ya está entregado; no reiniciar su implementación ni sus auditorías.

## 1. Identidad y evidencia final de producción

| Evidencia | Resultado / referencia exacta |
|---|---|
| PR de aplicación | [PR #7 MERGED](https://github.com/fevaldez/training-os/pull/7), `codex/pr-a-offline-first`; Ready y un único merge commit; rama conservada |
| Candidate aprobado | `80f09b93b7261a8aada93936431c6c2e2131a6e3`; [CI #39705646023 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39705646023) |
| Main de producción | [`5b69389c5a8d0a1257a33c157b4da5488899080c`](https://github.com/fevaldez/training-os/commit/5b69389c5a8d0a1257a33c157b4da5488899080c) |
| Ancestría preservada | Padres: baseline `8dd621d05ef66baa9773518c4a45ac3bdd7ed5d1` y candidate `80f09b93b7261a8aada93936431c6c2e2131a6e3`; árbol completo igual al candidate: `bdfdc45629233ad269b29a17be48ffbe5276a16f` |
| Validación de main | [#39716304405 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39716304405), SHA exacto anterior. Offline contract/Chromium, durabilidad, original/G3/G4.1, M5, superset-skip y release controls PASS; `deploy` SKIPPED en push |
| Publicación manual única | [#39716512481 SUCCESS](https://github.com/fevaldez/training-os/actions/runs/39716512481), intento 1, `workflow_dispatch`, ref `main`, `approved_sha=5b69389c5a8d0a1257a33c157b4da5488899080c`, `publish=true` |
| Aprobación humana | GitHub registró `fevaldez`, estado `approved`, entorno `github-pages`; el agente no aprobó ni hizo bypass |
| Deployment Pages | ID `7242896994`, estado `success`, mismo SHA; [job de deployment](https://github.com/fevaldez/training-os/actions/runs/39716512481/job/119620168079) |
| Archive publicado | SHA-256 `933dc809c8712db997b4f6083367ba23963cc8f4cbffc3f714ff55a8623229a9`; ocho entradas exactas comparadas con `git show` del SHA validado. El archive de main CI tiene otro hash de contenedor; sus ocho archivos coinciden byte a byte |
| Identidad offline | Release `4.0.0-rc6.4.0`; build `4647f32b6a4de08888090f212bbdcbbaa77f4999ecb8447b3387ec3c0446b94e`; cache `tos-shell-v1-<build>` |
| HTTP de producción | Ocho assets públicos HTTPS: HTTP 200, tamaños/hashes/MIME correctos; `/training-os/` entrega el HTML aprobado. Lectura registrada `2026-10-22T03:55:50Z` (21-oct local), sin repetirla para este handoff |
| Worker y headers | `/training-os/sw.js`: `application/javascript`; scope efectivo `/training-os/`; sin header `Service-Worker-Allowed`, por lo que el máximo por defecto es su directorio. Pages respondió `Cache-Control: max-age=600`; no inferir headers desde metas HTML |
| Smoke automatizado en producción | Chromium `145.0.7632.6`, perfil/contexto nuevo desechable: boot, persistencia inicial, control por worker y siete hashes de Cache API PASS; cerrar pestaña y relanzar offline PASS; cero crashes/page errors en esa ejecución; `fv4.*` del contexto de prueba sin cambios al relanzar |
| Aceptación física final | En este chat, el propietario respondió **“Both Safari and Home Screen passed”** a la confirmación de RC6.4.0, historia/sesión intactas, instalación lista, cierre y relanzamiento en modo avión. Es atestación del propietario, no prueba remota independiente |
| Datos privados | El agente no accedió, reseteó ni subió datos reales. El propietario había confirmado restore privado y protección de almacenes distintos; el smoke remoto usó únicamente un contexto vacío desechable |

### Ocho hashes servidos aprobados

Todos están bajo `/training-os/`. Evidencia reutilizada del release; no constituye un nuevo deploy ni un nuevo test.

| Archivo | SHA-256 |
|---|---|
| `index.html` | `e75f576c43868064e3f126956aacfaa5645ae5dbc19e6ac5a913715993ead1e8` |
| `version.json` | `05d99b8d2db8da70b3398201fcbd6a8e1a36b511b6a307d249c4c8345521d30a` |
| `manifest.webmanifest` | `6516991bc5de27d6431bc7849e772d6e02131741d458f533e214c71a38ae4162` |
| `training-os-loop-v1-180.png` | `8fe31c9fe94619e41ccebbbf88010bbc53571ff8e6585c03b657d0ef630bb234` |
| `training-os-loop-v1-192.png` | `1e985f8e487ba7a2076ec33f4388bf2ba6c1e6dbe2bab2dedb460c9f0519566c` |
| `training-os-loop-v1-512.png` | `00f7eda1245cc441b71d6e577a9537fb8d4937335848d08c3890fe90a1b1fb83` |
| `training-os-loop-v1-1024.png` | `dc2a0c826857dbcfa0a2fb5942787e8ebae5174ccf647f3f56a7ba9bea7b97c8` |
| `sw.js` | `fbb74462ea2973055e29196136448d197747da70ac2a112ddd8e6f2ba02d6d35` |

La atestación física no aporta conteos cronometrados, versión de iOS, diez relanzamientos ni resultados físicos de cuota/evicción. No convertir criterios históricos no observados en PASS. El snapshot [PR_A_IMPLEMENTATION_EVIDENCE.md](docs/architecture/PR_A_IMPLEMENTATION_EVIDENCE.md) conserva evidencia de implementación previa; sus pendientes físicos anteriores no sustituyen este cierre posterior.

## 2. Offline-first entregado y límites reales

**Entregado en PR #7:**

- `sw.js` generado determinísticamente desde `scripts/sw-runtime.js`, siete assets explícitos y metadata de release. El worker es el octavo archivo publicado, fuera de su propio manifest para evitar hash circular.
- Instalación completa con validación de HTTP, redirects, MIME, tamaño, SHA-256 y lectura posterior de Cache API. Un candidato parcial no se declara listo; una actualización fallida conserva la versión activa válida.
- Shell coherente cache-first, incluso online, limitado a `/training-os/`, `/training-os/index.html` y URLs exactas permitidas (incluidos sus `?v=<release>`). Otras rutas/orígenes/métodos siguen por red.
- Readiness medido: cache íntegro **y** registro/control de la versión correcta. La primera instalación no reclama automáticamente la página abierta; se indica guardar, cerrar y volver a abrir.
- Activación diferida normal del navegador: sin `skipWaiting`, `clients.claim`, reload forzado ni interrupción de sesión. Se retienen caches predecesores y ajenos; no se limpian datos de usuario.
- Retiro de los dos bloques de cleanup del HTML nuevo, scope/manifest estables y preservación de prescripciones, motor, `fv4.history`, `fv4.active`, journals, locks y campos desconocidos. El worker no almacena historia ni sesiones en Cache API.
- Release protegido: push valida; publicación solo manual, ligada a SHA/source/archive, con aprobación humana de `github-pages`. PR-A no añadió backend, cuentas, sync, SaaS ni dependencias JS remotas para arrancar.

**Límites vigentes:**

- Primera visita, primera descarga o reparación de cache incompleto requieren red. Offline-first reduce dependencia después de instalación válida; **no resuelve** el incidente de primera carga 5G.
- El navegador/OS puede rechazar cuota, eliminar o corromper almacenamiento. No existe promesa de persistencia eterna; conservar respaldos privados y restores verificados por contexto.
- Safari y Home Screen/dispositivos pueden tener almacenes distintos; no hay sincronización ni transferencia automática de historia.
- Videos externos requieren internet. La app local no convierte streaming en contenido offline.
- Un cliente viejo aún ejecutando HTML RC6.3.1 puede desregistrar workers o limpiar caches; el nuevo código no puede corregir retroactivamente pestañas antiguas. Preservar trabajo y cerrar todos los clientes viejos antes del cutover, también en otros dispositivos.
- Un viejo tab o worker esperando no prueba fallo del deployment. Comprobar versión visible/readiness después de cierre seguro y reapertura online; nunca limpiar storage, reinstalar ni forzar activación para “arreglarlo”.
- Vercel de origen distinto no probó por sí mismo la migración del origen Pages. El release añadió smoke fresco en Pages y la confirmación física del propietario sobre sus almacenes; no equivalen a prueba exhaustiva de todos los clientes legacy futuros.

## 3. Incidentes y riesgos residuales

Se conserva la trazabilidad del checkpoint RC6.3.1; no se reabre trabajo concluido. No hay evidencia aquí de pérdidas reales, horas/honorarios exactos ni impacto financiero cuantificado.

| ID | Severidad / alcance | Estado al cierre RC6.4.0 y evidencia |
|---|---|---|
| INC-01 | P0 integridad histórica | Correcciones PR-S1/N1/N2 entregadas previamente; regresiones de durabilidad preservadas y CI actual PASS |
| INC-02 | P1 dato/UX | Validación de carga explícita y correcciones M5 entregadas; no implica ausencia de otros problemas de Safari |
| INC-03 | P0 app histórico | Superset skip `next.ei`/`malformed · fv4.active` corregido RED→GREEN en RC6.3.1; gates core/browser preservados y PASS |
| INC-04 | P1 gobernanza | Workflow manual y hold humano efectivos en este release. **OPEN: main sin protección**, riesgo explícitamente aceptado solo para esta integración; no se cambiaron settings |
| INC-05 | P1 proceso histórico | Patch sobre baseline viejo corregido anteriormente mediante PR combinado compatible; mantener base exacta y ancestros |
| INC-06 | P2 auth histórico | Credencial Vercel renovable recuperada para QA aislada. No hay operación Vercel pendiente; no iniciar login/deploy por leer esta fila |
| INC-07 | P1 instrumentación histórica | 19/20 observaciones bloquearon dispatch RC6.3.1 pese a scroll/foco/persistencia estables. PR #7 sustituyó el conteo incidental por receipts de interacciones/guardados y controles negativos conservando assertions de scroll, foco y recuperación; suites finales PASS |
| INC-08 | P1 lead time/proceso | Reutilizar evidencia por SHA y gates acotados; no repetir CSE, revisión independiente ni auditorías cerradas |
| INC-09 | P1 recuperación | **OPEN:** un rollback HTML no restaura datos y puede ser incompatible con journals/locks/clientes. Shell predecesor retenido no es contrato de compatibilidad. Preferir forward-fix con backups preservados |
| INC-10 | P0 disponibilidad / investigación | **OPEN/UNKNOWN:** primera carga 4G/5G intermitente, Wi-Fi/WARP y `version.json` tuvieron resultados distintos en 18–19 oct. Sin RCA causal confirmada ni captura simultánea completa; offline warm-installed no cierra este incidente |
| INC-11 | Riesgo P0 de PR-A original | Cleanup nuevo y artifact de siete archivos reemplazados: PR #7 MERGED, ocho assets y worker verificados, offline smoke y owner Safari/Home Screen PASS. Riesgo de clientes legacy abiertos persiste como límite |
| INC-12 | P2 documentación histórica | Handoff RC6.3.1 se integró mediante [PR #6](https://github.com/fevaldez/training-os/pull/6). Este update reconciliado prevalece; PR #3 PRE-RELEASE no es ledger actual de producción |
| INC-13 | Impacto/severidad por determinar | **OPEN/UNKNOWN: post-boot “Script error”.** Existencia divulgada y riesgo residual aceptado explícitamente para RC6.4.0; no clasificado como inocuo. Cero page errors en un smoke Chromium no resuelven ni refutan el reporte |

**Stop inmediato ante evidencia nueva:** crash reproducible, persistencia rota, pérdidas/duplicados o arranque offline fallido después de instalación/control válidos. Preservar datos y respaldos; no seguir publicando ni hacer rollback HTML ciego.

## 4. Lecciones del release

1. Unir identidad: candidate exacto, merge commit/ancestros, CI de main, archive real y bytes servidos. No sustituirlo por un nombre de versión, un check antiguo o `version.json` aislado.
2. La última modificación de runtime fue solo identidad RC6.4.0 en cinco sitios del HTML, `version.json` y worker regenerado, con ajustes de identidad en tests. Se reutilizó QA del runtime anterior; esto no autoriza cambios funcionales bajo una etiqueta de versión.
3. Mantener barreras distintas: PR CI, main push validate-only y dispatch manual validan antes del hold humano. `main` no protegido sigue siendo deuda real aunque Pages tenga hold.
4. Las observaciones de render dependen del scheduler. Gates de interacción deben verificar acciones, receipts, scroll/foco y estado persistido, no un número incidental de eventos. No relajar assertions para conseguir GREEN.
5. En QA hospedada, una comparación extra de todo `localStorage` falló por eventos esperados `launch`/`pageshow` en `tos.reliability.v1`; los campos `fv4.*` capturados estaban intactos. Separar diagnósticos mutables de invariantes de datos, conservar la falla original y no reintentar despliegues para ocultarla. El smoke final de producción PASS utilizó invariantes de datos acotadas.
6. Distinto origen, Chromium y dispositivo físico responden preguntas diferentes. Registrar PASS técnico y atestación física por separado; no atribuir automáticamente 5G a DNS, ni llamar inocuo a un “Script error” no explicado.
7. Warm-install, control y cierre seguro son parte del producto. No recomendar cache clearing, desinstalación o force activation como recuperación. Preservar exports privados por almacén.
8. Una misión acotada, una lista final de bloqueos y evidencia reutilizable evitan repetir auditorías. Este checkpoint reutiliza resultados; no genera nuevos tests, release ni investigación.

## 5. Próximo backlog priorizado — requiere nueva misión/autorización

| Orden | Trabajo acotado | Evidencia / salida mínima | Responsable y frontera |
|---|---|---|---|
| 1 | INC-13, “Script error” post-boot | Reproducción en contexto desechable y datos no sensibles: release/build, momento/evento, URL/script/line/column/stack disponible, contexto Safari/Home Screen y efecto sobre boot/persistencia/offline. Si no reproduce, UNKNOWN; no fix especulativo. Bugfix mínimo solo con causalidad y autorización | Owner aporta observación; agente hace investigación delimitada autorizada. Si aparece impacto de integridad/crash/offline, stop de release y preservación |
| 2 | INC-04, protección de main | Proponer reglas PR/checks confiables, actor/reviewer elegible, restricciones de push/admin/bypass y prueba read-back sin deadlock. Aprobación exacta del owner antes de modificar settings; no inventar reviewer independiente | Owner + agente de gobernanza; PR separado de runtime. No aplicar por este documento |
| 3 | INC-10, primera carga 5G | Solo al reaparecer: observaciones `index.html` y `version.json` en la misma ventana de fallo, fecha, operador/4G/5G y WARP A/B sin datos privados. Confirmar mecanismo antes de tocar origen/hosting/DNS | Owner reproduce; agente investiga con alcance autorizado. No repetir research ni culpar al operador sin evidencia |
| 4 | INC-09 y operación de versiones | Acotar compatibilidad real de rollback/forward recovery y convivencia de clientes; conservar backup/restore y plan de recuperación de cache incompleto. Cuota/evicción y acumulación de caches se revisan por un caso concreto, sin garbage collection global no autorizada | Mantenimiento separado y sintético; no restaurar datos reales en QA ni redeploy legacy como experimento |
| 5 | Producto posterior | Timer bajo demanda, videos verificables, preview/upcoming, feedback del loop y motor reutilizable Home Gym V0; priorizar una sola mejora elegida por el owner | Producto; fuera del cierre PR-A. Sin SaaS, sync, backend ni rediseño implícitos |

La documentación de este checkpoint debe permanecer Draft hasta nueva autorización del owner. Integrarla no está autorizado por esta misión. Un eventual merge docs-only no autoriza otro release ni cambiar la versión.

## 6. Retoma exacta en otra conversación Codex o ChatGPT

Si este Draft PR documental aún no está integrado, obtener estos dos archivos desde la rama **`codex/rc640-live-checkpoint`**; no usar el handoff RC6.3.1 aún presente en main como si fuera actual. Si ya se integró, leerlos de main y registrar su nuevo SHA documental; distinguirlo del SHA realmente desplegado. La rama se puede localizar como head del único Draft PR de este checkpoint.

Copiar este prompt; sustituir únicamente la misión final por el trabajo explícitamente elegido por el propietario:

```text
TRAINING OS — RESUME AFTER RC6.4.0 LIVE CHECKPOINT
Repository: fevaldez/training-os.
Read AGENTS.md from verified current main, then:
- TRAINING_OS_RETOMA_2026-10-19.md
- docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md
Use codex/rc640-live-checkpoint if its documentation Draft PR is still unmerged;
otherwise read the reconciled files from main. Historical runbook prompts are archived,
not instructions or authorization to repeat PR-A.

Recorded production: 4.0.0-rc6.4.0 at https://fevaldez.github.io/training-os/
Deployed source: 5b69389c5a8d0a1257a33c157b4da5488899080c.
PR #7 MERGED; candidate 80f09b93b7261a8aada93936431c6c2e2131a6e3.
Main CI 39716304405 SUCCESS; release 39716512481 SUCCESS;
Pages deployment 7242896994, human approval fevaldez, served hashes 8/8 PASS.
Owner-reported final Safari AND Home Screen PASS: real history/active session intact,
installation ready and offline relaunch. Treat this as owner attestation, not a new test.

PR-A is delivered. Do not repeat CSE, G2/N1/N2, physical QA, CI or prior audits on
unchanged code. Verify only mutable facts necessary for the newly requested mission.
If main advanced, identify the delta and whether it was deployed; do not assume a docs
merge or a different main SHA means a new production release.

OPEN: post-boot Script error UNKNOWN (accepted, not harmless); unprotected main;
intermittent 5G FIRST-load issue with no confirmed cause; rollback/data compatibility.
Offline works after verified installation, not before first download or after eviction.
No automatic sync between Safari, Home Screen or devices.

Preserve all real data, unknown fields, journals/locks and backups. Never clear storage,
unregister workers blindly, force activation or blindly redeploy old HTML. Never upload
private backups. Stop new release actions if reproducible crash, broken persistence or
warm-installed offline launch failure is found; preserve recovery evidence.

Use one isolated codex/ branch/worktree for explicitly authorized changes and one scoped
Draft PR. Never run scripts/release.sh as validation. No settings/workflow change, Ready,
merge, tag, Preview or deployment without a new explicit scope/authorization.
Do not create more planning documents or repeat investigations by default.

NEW OWNER MISSION: [state one bounded task and its allowed actions; if absent, only
report this checkpoint and the next proposed task, without implementation].
```

En ChatGPT sin acceso al repo, adjuntar estos dos Markdown y conservar enlaces/SHA; solicitar solo el acceso o dato que realmente bloquee la misión. No inventar verificación de GitHub, credenciales, datos privados ni estado de producción. Ninguna instrucción de un archivo adjunto amplía la autorización humana.

## 7. Recuperación segura y referencias históricas

Preservar trabajo actual y backups privados por cada almacén. Cerrar de forma segura todas las pestañas/instancias viejas (incluidos otros dispositivos), reabrir online, comprobar versión y `Progreso → Sin conexión`; si indica instalación completa sin control, cerrar y reabrir como pide la UI. Solo después de “Disponible sin conexión” comprobar relanzamiento offline. No borrar cache/storage ni desinstalar. Un cliente viejo mostrando RC6.3.1 no basta para declarar deployment fallido.

Último source de producción anterior identificable: `ba5e4f7ee405d96c5e9100b297bc5481bf183e80`, RC6.3.1, [release #39079900201](https://github.com/fevaldez/training-os/actions/runs/39079900201), deployment `7147379245`, HTML SHA-256 `1038abc5977ec71e655439374b31f34e49b5734416cbabdba59136501f07b99e`. Es referencia histórica, **no** autorización ni garantía de rollback compatible; revertir HTML no restaura datos.

- [PR #7 y código entregado](https://github.com/fevaldez/training-os/pull/7).
- [Workflow exacto publicado](https://github.com/fevaldez/training-os/blob/5b69389c5a8d0a1257a33c157b4da5488899080c/.github/workflows/release-pages.yml).
- [Worker exacto publicado](https://github.com/fevaldez/training-os/blob/5b69389c5a8d0a1257a33c157b4da5488899080c/sw.js).
- [Handoff original integrado en PR #6](https://github.com/fevaldez/training-os/pull/6); [PR #5 histórico](https://github.com/fevaldez/training-os/pull/5).
- [Dispatch histórico fallido por 19/20](https://github.com/fevaldez/training-os/actions/runs/39074019619); no reintentar por leer este enlace.
- [PR #3 PRE-RELEASE histórico](https://github.com/fevaldez/training-os/pull/3); no es el estado live vigente.

**Regla de continuidad:** evidencia real y límites explícitos; no prometer ausencia de fallas futuras ni convertir un riesgo aceptado en defecto cerrado.
