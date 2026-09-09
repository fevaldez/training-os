#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, struct, sys

root = Path(__file__).resolve().parents[1]
version = json.loads((root/'version.json').read_text(encoding='utf-8'))
release = version['release']
html = (root/'index.html').read_text(encoding='utf-8')
workflow = (root/'.github/workflows/release-pages.yml').read_text(encoding='utf-8')

checks=[]
def check(name, ok):
    checks.append((name,bool(ok)))
    print(('PASS' if ok else 'FAIL')+' | '+name)

def png_dimensions(path):
    raw=path.read_bytes()[:24]
    if len(raw)<24 or raw[:8]!=b'\x89PNG\r\n\x1a\n' or raw[12:16]!=b'IHDR': return None
    return struct.unpack('>II',raw[16:24])

# Release integrity
check('release marker in index', release in html)
check('T·OS brand marker', 'T·OS' in html)
check('apple touch icon linked', 'rel="apple-touch-icon"' in html)
check('manifest linked', 'rel="manifest"' in html)
check('kg/lb control present', 'data-unit="kg"' in html and 'data-unit="lb"' in html)
check('rest skip present', 'Saltar descanso' in html)
check('active set flow present', 'Set activo' in html)
check('no stale Hombro + Brazos label', 'Hombro + Brazos' not in html)
check('standalone shoulder present', 'Hombro · standalone' in html)
check('shoulder standalone restored with press strength blocks', 'DB Shoulder Press' in html and 'Unilateral Landmine Press' in html)
check('shoulder standalone retains lateral rear-delt stability blocks', all(x in html for x in ('Machine Lateral Raise','Cable Lateral Raise','Chest-Supported Rear-Delt Row','Partial Lateral Raise','Face Pull + External Rotation')))
check('shoulder routine no longer carries incomplete-inventory note', 'inventario histórico exacto no está completamente recuperado' not in html)

# RC6 information architecture
check('Week tab removed', 'data-page="week"' not in html)
check('Week page removed', '<h1>Semana</h1>' not in html)
check('permanent MVP explainer removed', 'Una decisión a la vez.' not in html)
check('three-tab navigation present', html.count('data-page=') == 3 and all(f'data-page="{x}"' in html for x in ('today','program','progress')))
check('Today decision stack present', 'Mejor fit ahora' in html and 'id="todayDecision"' in html)
check('Today recommendation can express uncertainty instead of fake precision', 'Opciones casi equivalentes' in html and 'recommendationStrength' in html)
check('Today recommendation explains its signals', 'recommendationReasonsMarkup' in html and 'today-reasons' in html)
check('Today supports equipment-occupied reranking', 'Equipo ocupado' in html and 'markWorkoutBusyToday' in html and 'todayAvoidedWorkouts' in html)
check('recommendation uses weekly recency time and overlap signals', all(x in html for x in ('recommendationSignalsFromHistory','weeklyStateFromHistory','cabe en','solapa recuperación')))
check('active Today avoids duplicate recommendation with next-priority state', 'Después de esta sesión' in html)
check('weekly snapshot absorbed into Today', 'id="weekSnapshot"' in html and 'Esta semana' in html and 'Core 4 días' in html)
check('weekly rows expose done partial active pending semantics', all(x in html for x in ('DONE','PARCIAL','EN CURSO','PENDIENTE')))
check('Today time-fit controls are planner-derived and deduplicated', 'id="todayTimeChoice"' in html and 'distinctPlannerPresets' in html and 'data-today-preset' in html)

# Program Decision Cards + Arms
check('Program Decision Cards present', 'Decision cards' in html and 'renderProgramCard' in html)
check('Program decision metrics present', 'program-metrics' in html and all(x in html for x in ('Última','Semana','Tiempo','Anchor')))
check('qualitative core status labels present', all(x in html for x in ('ON TRACK','PARTIAL','RECENT','DUE')))
check('standalone Arms session present', 'Brazos · standalone' in html)
check('Arms includes biceps triceps forearm groups', all(x in html for x in ('"group": "Bíceps"','"group": "Tríceps"','"group": "Antebrazo"')))
check('Arms preserves heavy non-superset blocks', 'Cable Curl · barra/EZ' in html and 'Pressdown · barra/V' in html)
check('Arms contains sourced lying curl volume pair', 'Lying Cable Curl' in html and 'Rope Pushdown · volumen' in html)
check('Arms contains direct forearm pair', 'Behind-the-Back Cable Wrist Curl' in html and 'Cable Reverse Wrist Curl' in html)
check('Arms optional myo-rep finisher present', 'Myo-Rep Finisher · OPTIONAL' in html and '25–35 total' in html)
check('Arms is Flex not core', "const CORE_ORDER = ['chest','back','legs','shoulders']" in html and "const FLEX_ORDER = ['arms']" in html)
check('catch-up coverage avoids debt framing', 'No implica recuperar sets 1:1' in html or 'No intenta recuperar sets 1:1' in html)

# Planner
check('pre-workout planner surface present', 'id="plannerSheet"' in html and 'Plan de hoy' in html)
check('planner time presets are deduplicated by actual plan', 'distinctPlannerPresets' in html and 'resolveDistinctPreset' in html and 'data-plan-preset' in html)
check('planner per-exercise include exclude present', 'data-plan-toggle' in html and 'plan-toggle' in html)
check('planner changes are session scoped', 'Los cambios aplican solo a hoy; tu Programa base no se modifica.' in html)
check('planner estimates time', 'estimatePlanMinutes' in html and 'estimatedMin' in html)
check('planner stores included and excluded exercise indices', 'includedExerciseIndices' in html and 'excludedExerciseIndices' in html)
check('planner stores program full vs confirmed sets', 'fullSets' in html and 'confirmedSets' in html)
check('plan-aware workout sequence present', 'sessionSequence' in html and 'buildSequence(w,a?.plan?.includedExerciseIndices??null)' in html)
check('catch-up Arms planner preset present', "p==='catchup'" in html and 'catchUpArmsIndices' in html)
check('catch-up forearm explicitly optional', 'Antebrazo queda opcional' in html)

# Planned vs confirmed vs executed
check('history persists session plan snapshot', 'plan:{...plan,completedSets' in html)
check('execution adherence persisted', 'executionAdherencePct' in html)
check('history shows plan execution metric', '% ejecución' in html)
check('short plan can count against weekly core coverage', 'historyEntryConfirmedSets' in html and 'historyEntryAdherence' in html and "best>=.85" in html)

# Skip / recovery / state change visibility
check('skip action sheet present', 'id="skipSheet"' in html and 'id="skipOneSet"' in html and 'id="skipExercise"' in html)
check('skip set semantic status present', 'skipped_set' in html)
check('skip exercise semantic status present', 'skipped_exercise' in html)
check('skip set scrolls session to top', "scrollSessionTop('skip:set')" in html)
check('skip exercise scrolls session to top', "scrollSessionTop('skip:exercise')" in html)
check('other workout state changes also reset viewport', all(x in html for x in ("scrollSessionTop('set:complete')","scrollSessionTop('rest:next')","scrollSessionTop('biserie:partner')")))
check('scroll-top action is diagnosed', "diagnostics('session:scroll-top'" in html)
check('finish early control present', 'id="finishEarlyBtn"' in html and 'Finalizar y guardar' in html)
check('discard session destructive control present', 'class="btn danger" id="discardSessionBtn"' in html)

# Tempo invariant
check('legacy CPEP label removed', 'CPEP' not in html)
check('canonical E-PE-C-PC tempo helper present', 'E–PE–C–PC' in html and 'tempoView' in html)
check('single tempo markup helper used across execution states', html.count('tempoMarkup(e,false)') >= 3)
check('chronological execution label present', 'Ejecución desde el inicio' in html)
check('concentric-start exercise map present', 'CONCENTRIC_START_EXERCISES' in html)

# Memory + progression
check('intra-session load memory present', 'currentSessionPreviousSet' in html)
check('cross-session load memory present', 'previousSet(a.workoutKey,e.name,item.si)' in html)
check('memory prefill does not copy old reps/RIR', 'prefillFromMemory' in html)
check('two-exposure progression gate present', 'progressionDecisionFromExposures' in html and '2/2 exposiciones' in html)
check('progression is suggestion not silent auto-load', 'weightKg:source?(+source.weightKg||0):0' in html)
check('load memory context present', 'loadMemoryInsight' in html and 'Memoria de carga' in html)

# Readability / dark mode / next
check('semantic surface tokens present', '--surface:' in html and '--controlSelected:' in html and '--dangerSurface:' in html)
check('dark mode adaptive blue present', '--blue:#0a84ff' in html)
check('operational font sizes >=14 rules present', '.state-label{font-size:14px}' in html and '.spec{font-size:14px' in html and '.tip{font-size:16px' in html)
check('enriched next preview present', 'nextPreviewMarkup' in html and 'Siguiente ejercicio' in html and 'next-meta' in html)
check('discard button uses semantic danger style', '.danger{' in html and '--danger:' in html)

# Diagnostics
check('navigation diagnostics present', "diagnostics('nav:start'" in html and "diagnostics('nav:done'" in html and "diagnostics('nav:error'" in html)
check('scroll diagnostics present', "session:scroll-top" in html)

# CI / Node 24 maintenance
check('configure-pages Node24 major', 'actions/configure-pages@v6' in workflow)
check('upload-pages-artifact current major', 'actions/upload-pages-artifact@v5' in workflow)
check('deploy-pages Node24 major', 'actions/deploy-pages@v5' in workflow)
check('CI triggers when engine/UI tests change', '"scripts/test_engine.js"' in workflow and '"scripts/test_ui_static.js"' in workflow)
check('CI runs engine and UI tests', 'node scripts/test_engine.js' in workflow and 'node scripts/test_ui_static.js' in workflow)

for size in (180,192,512,1024):
    p=root/f'training-os-loop-v1-{size}.png'
    check(f'icon {size} exists',p.exists())
    if p.exists(): check(f'icon {size} valid PNG + dimensions',png_dimensions(p)==(size,size))

digest=hashlib.sha256((root/'index.html').read_bytes()).hexdigest()
check('index SHA matches version.json', digest==version['index_sha256'])
failed=[n for n,ok in checks if not ok]
print(f'TOTAL {len(checks)-len(failed)}/{len(checks)} PASS')
sys.exit(1 if failed else 0)
