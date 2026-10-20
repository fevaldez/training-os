# Training OS — checkpoint canónico de continuidad, 2026-10-19

**Propósito:** retoma autosuficiente del estado real, bitácora de incidentes, acciones de ingeniería y enlaces verificables. Documento de evidencia **no autoriza implementar, fusionar ni desplegar**. Leer conjuntamente con [`docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md`](docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md).

**Repo:** https://github.com/fevaldez/training-os  
**Producción:** https://fevaldez.github.io/training-os/  
**Baseline histórico verificado:** `main` = `ba5e4f7ee405d96c5e9100b297bc5481bf183e80`; `version.json.release=4.0.0-rc6.3.1`, `index_sha256=1038abc5977ec71e655439374b31f34e49b5734416cbabdba59136501f07b99e`. Verificado en GitHub el 2026-10-19; no significa que todo acceso móvil sea exitoso.  
**Release:** PR #5 integrado: https://github.com/fevaldez/training-os/pull/5 ; Actions run #39079900201 con `validate` y `deploy` SUCCESS: https://github.com/fevaldez/training-os/actions/runs/39079900201. Control humano del entorno Pages reportado por Codex.  
**Prueba de datos:** propietario informó integridad de historial y sesión activa en iPhone después del release; confirmó backup restaurado privadamente y antiguos clientes con escritura cerrados. No subir respaldos al repositorio.

## 1. Estado de producto — KNOW / ASSUME / UNKNOWN

| Clase | Elemento | Evidencia y consecuencia |
|---|---|---|
| KNOW | RC6.3.1 se publicó correctamente | PR #5 MERGED; SHA de `main`; Actions run #39079900201 PASS; siete assets SHA-256 verificados durante release |
| KNOW | Durabilidad PR-S1 mejorada | Correcciones contra pérdida de sesión por escrituras fallidas, journals/recuperación, concurrencia entre pestañas; pruebas N1/N2 independientes PASS históricas, suites preservadas |
| KNOW | P0 biserie corregido | `next.ei` indefinido y `malformed · fv4.active` al omitir segundo ejercicio; reproducciones RED, GREEN con hotfix, QA físico del propietario |
| KNOW | Peso en blanco no se asume cero; se evita scroll/flicker descrito | Correcciones M5 y pruebas del propietario; **no** implica ausencia de otros problemas de Safari |
| KNOW | Publicación protegida | `release-pages.yml`: push a `main` valida; solo `workflow_dispatch` correcto puede desplegar, condicionado a SHA y aprobación de entorno; el control de rama `main` seguía sin protección según preflight |
| KNOW | Fallas intermitentes de carga usando datos celulares | 2026-10-18 captura Safari: “server stopped responding”; el propietario reportó Wi-Fi OK y red móvil intermitente, a veces funciona, a veces no |
| KNOW | `version.json` descarga en datos celulares sin WARP; con WARP abre HTML/app | Pruebas de usuario del 2026-10-19. WARP modifica el camino de red; **no** demuestra por sí solo un problema de DNS o un culpable específico |
| KNOW | `index.html` es HTML/CSS/JS inline de ~154 KB | Lectura GitHub 2026-10-19; sin dependencias externas JS para arranque; manifest estable `/training-os/` |
| KNOW | PR-A offline-first no implementado | `index.html` desregistra SW y elimina cachés al iniciar; Pages empaqueta siete assets y omite `sw.js` actualmente |
| ASSUME | Red/transporte/CDN/operador o carga del documento es sospecha de mayor prioridad que motor workout | Inferencia por capturas y controles; necesita captura cuando se reproduzca el fallo, no se declara causa confirmada |
| UNKNOWN | Por qué falla la red móvil intermitentemente | No existen aún trazas simultáneas de `index.html`, `version.json`, respuesta HTTP/TLS/DNS y WARP para **la misma ventana de fallo** |
| UNKNOWN | Durabilidad del cache/SW en Safari/iOS real bajo evicción/cuota | Depende de navegador, modo Home Screen y almacenamiento; PR-A debe probar, no prometer garantía |
| UNKNOWN | Protección efectiva actual de `main` posterior al release | Preflight anterior informó protección vacía; cualquier cambio posterior requiere read-back, sin suponer que quedó corregido |

## 2. Timeline e incident log — nivel C / exposición de negocio

**Impactos confirmados:** release en vivo, historial/sesión intactos según propietario, despliegue fallido anterior no llegó a producción. **No está confirmada pérdida de entrenamientos reales, ni horas/honorarios exactos; no inventar métricas financieras.**

| ID | Severidad | Hecho, raíz/evidencia | Impacto / resolución / estado |
|---|---|---|---|
| INC-01 | P0 integridad | Sesión podía perderse tras fallo de escritura de historial; N1 journal obsoleto revivía; N2 lector RC4 rechazaba RIR histórico | Corregidos en PR-S1, N1/N2 aceptación independiente; preservar regresiones |
| INC-02 | P1 dato/UX | Entrada de peso vacía avanzaba como 0; movimientos de pantalla en iPhone | Validación de carga explícita y correcciones de foco/scroll incluidas en RC6.3.1 |
| INC-03 | P0 app | Crash al omitir partner de biserie (`next.ei`) y luego `malformed · fv4.active` en Preview | RED→GREEN, 22/22 browser, iPhone owner PASS; no publicar previo RC6.3 defectuoso |
| INC-04 | P1 gobernanza | Riesgo de autodeploy, `main` no protegido | Workflow protegido/manual y aprobación humana del entorno Pages implantados; **branch protection P1 abierta** |
| INC-05 | P1 proceso | Workflow patch aplicado contra `main` viejo sin `tests/storage_g3.test.js` | Corregido con PR combinado contra SHA compatible; verificar base exacta antes de aplicar patches |
| INC-06 | P2 tool/auth | Vercel preflight HTTP 403, credencial reportada caducada | Recuperación de acceso; QA Preview aislada publicada y verificada; evitar auth retries ciegos |
| INC-07 | P1 CI flake | Gate scroll requería `>=20` filas: 20 PASS en main run #39073827915, 19 FAIL en primer dispatch #39074019619 aunque posición/foco/estado final estables | Reintento manual único #39079900201 PASS; **test sigue con deuda de determinismo** |
| INC-08 | P1 lead time | Múltiples aprobaciones, auditorías innecesarias y handoffs ambiguos entre 14–17 oct | Release exitoso; corrección de proceso: una misión delimitada/uno o dos gates, evidencia reusable por SHA |
| INC-09 | P1 rollback | HTML RC6.2.1 puede leer de forma distinta datos del nuevo protocolo | **No rollback ciego**; respaldos privados y preferir forward-fix; contrato de compatibilidad pendiente |
| **INC-10** | **P0 disponibilidad / investigación** | **18–19 oct: apertura celular intermitente; error Safari “server stopped responding”, Wi-Fi sí, `version.json` celular OK en prueba, WARP OK, algunos intentos celulares OK** | **OPEN:** no existe RCA confirmada; no modificar hosting ni cambiar origen; PR-A reduce dependencia en arranques **posteriores a instalación válida**, no primera descarga |
| **INC-11** | **P0 riesgo de implementación futura** | **Dos rutinas en `index.html` desregistran SW y borran `caches` al iniciar; `scripts/test_reliability_rc621.py` exige ese cleanup. `release-pages.yml` empaqueta 7 assets sin worker.** | **OPEN hasta PR-A:** reemplazar migración destructiva y sus pruebas con un contrato versionado/seguro; una simple incorporación de SW fallaría |
| INC-12 | P2 documentación | PR #3 contiene handoffs PRE-RELEASE Draft basados en B y no integrados en main; antiguo checkpoint 17-oct se intentó publicar pero permiso GitHub 403 | Este checkpoint prevalece; almacenar en rama documental, no fusionar docs históricos sin reconciliar |

## 3. Decisiones ejecutivas y reglas vigentes

1. **Congelar producción** RC6.3.1 mientras no haya fallo de integridad ni autorización de cambio; no limpiar cache ni reinstalar para resolver el incidente celular.
2. **No atribuir el incidente de red a DNS** sin datos; `version.json` OK no prueba que `index.html` y el arranque estén disponibles. WARP ayuda temporalmente pero solo cambia ruta/transporte.
3. **PR-A OFFLINE-FIRST P0 es próximo trabajo de fiabilidad**, diseño y QA en rama/worktree aislado. No confundir funcionalidad offline post-primera-carga con fiabilidad de primera apertura sobre red móvil.
4. PR-A no añade backend, cuentas, sincronización multi-dispositivo, ni SaaS. **Home Screen y Safari mantienen almacenes distintos**; no asumir migración automática de datos.
5. Mantener operaciones de publicación `workflow_dispatch`/`approved_sha` + aprobación humana. Cambios a workflow, archivos de `_site`, manifest o scripts requieren revisión de impacto de release y aprobación separada.
6. No incluir datos de workout reales, respaldos, capturas con identificadores privados ni valores de secretos en PRs públicos.
7. Rama `main` actualmente no debe suponerse protegida; tarea pequeña P1 separada de PR-A. No bloquear indefinidamente PR-A por gobernanza salvo riesgo concreto del merge.

## 4. Acciones concretas priorizadas (no ejecutadas por este documento)

| Secuencia | Responsable / hilo | Qué hacer y criterio de éxito | No hacer |
|---|---|---|---|
| 0 — registro | Codex `Prepare Track A release readiness` | Commit **solo de estos dos Markdown** en rama `codex/rc631-pr-a-handoff-20261019`, Draft PR a main; confirmar cero cambios a app/workflow | No merge, no deploy |
| 1 — diseño cerrado PR-A | Chat nuevo Codex `Implement PR-A Offline-first` (High) | Leer CSE enlazado y validar únicamente hipótesis UNKNOWN que bloquean un código seguro; adaptar gates al código real | No reabrir N1/N2 o auditoría de durabilidad completa |
| 2 — implementación acotada | Mismo chat de ingeniería; autorización separada | Compatibilidad de limpieza legacy, SW precache atomizada/versionada, allowlist, offline-ready, empaquetado Pages, tests | No tocar datos reales/PR-HG/producción |
| 3 — QA independiente | `G2 Independent Review` reutilizado solo para delta de PR-A | RED→GREEN, concurrencia/cutover/cache, compatibilidad de almacenamiento, escenarios iPhone y SHA; un único informe de bloqueos | No auditorías generales duplicadas |
| 4 — staging iPhone | Owner + Codex release, preview aislada autorizada | Wifi primer warm/control, airplane relaunch, 5G/WARP, Safari vs Home Screen, actualización/rollback no destructivo, historia/restauración privada | No limpiar datos, no publicar sin go |
| 5 — release PR-A | Codex release, autorización explícita | Merge único, CI main, manual approval, siete/ocho assets según manifiesto aprobado, served hashes, smoke real | No autodeploy ni rollback HTML ciego |
| Paralelo no bloqueante | Owner sólo cuando vuelva a fallar 5G | `index.html` y `version.json` durante **misma** falla, WARP A/B, operador 4G/5G y fecha; capturar screenshot sin datos personales | No usar un resultado OK aislado como RCA |
| Próximo mantenimiento | Codex separado | Main branch protection y flake de 19/20 tests; scope independiente y menor costo | No mezclar con SW y data engine |
| Backlog posterior | Producto | Timer bajo demanda, videos verificables, preview/upcoming, loop feedback, motor reutilizable Home Gym V0 sin SaaS | No mezclar con PR-A |

## 5. Prompt mínimo de retoma de este proyecto

> Retoma Training OS desde `TRAINING_OS_RETOMA_2026-10-19.md` y `docs/architecture/PR_A_OFFLINE_FIRST_CSE_RUNBOOK_2026-10-19.md` del Draft PR documental (hasta que se apruebe el merge de documentación). Estado histórico confirmado: RC6.3.1 LIVE, `main=ba5e4f7ee405d96c5e9100b297bc5481bf183e80`, release Actions #39079900201 SUCCESS, iPhone propietario PASS; PR #5 merged. Incidente INC-10: abrir por 4G/5G falla intermitentemente aunque `version.json` sin WARP y Training OS con WARP funcionan; causa exacta UNKNOWN. INC-11: limpieza de SW/caches en dos bloques de `index.html` y test legacy obligatorio; `release-pages.yml` aún solo incluye siete assets. Prioridad: PR-A offline-first **warm-installed only** sin tocar datos, no RCA especulativa de operador. No repetir auditorías cerradas; leer AGENTS.md, verificar únicamente cambios vivos, pedir autorización antes de código, merge o despliegue. Divide & conquer con CSE y gates de dispositivo real.

## 6. Enlaces fuentes

- Producción: https://fevaldez.github.io/training-os/
- Repo: https://github.com/fevaldez/training-os
- Release run: https://github.com/fevaldez/training-os/actions/runs/39079900201
- CI pre-release: https://github.com/fevaldez/training-os/actions/runs/39036051811
- Primer dispatch scroll 19/20: https://github.com/fevaldez/training-os/actions/runs/39074019619
- PR integrado: https://github.com/fevaldez/training-os/pull/5
- Antigua documentación NO vigente: https://github.com/fevaldez/training-os/pull/3
- Fuente cleanup: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/index.html#L130-L142
- Fuente empaquetado Pages: https://github.com/fevaldez/training-os/blob/ba5e4f7ee405d96c5e9100b297bc5481bf183e80/.github/workflows/release-pages.yml#L100-L135
- WebKit almacenamiento/evicción: https://webkit.org/blog/14403/updates-to-storage-policy/
- WebKit aislamiento Home Screen: https://webkit.org/blog/14787/webkit-features-in-safari-17-2/

**Regla C-level:** evidencia real > confianza declarativa. Ningún porcentaje subjetivo sustituye QA físico, read-back y verificación de hashes; no puede garantizarse ausencia de todas las fallas futuras.
