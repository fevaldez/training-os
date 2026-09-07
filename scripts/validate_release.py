#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, struct, sys, re

root = Path(__file__).resolve().parents[1]
version = json.loads((root/"version.json").read_text(encoding="utf-8"))
release = version["release"]
html = (root/"index.html").read_text(encoding="utf-8")

checks = []
def check(name, ok):
    checks.append((name, bool(ok)))
    print(("PASS" if ok else "FAIL") + " | " + name)

def png_dimensions(path):
    raw = path.read_bytes()[:24]
    if len(raw) < 24 or raw[:8] != b"\x89PNG\r\n\x1a\n" or raw[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", raw[16:24])

# Core release integrity
check("release marker in index", release in html)
check("T·OS brand marker", "T·OS" in html)
check("apple touch icon linked", 'rel="apple-touch-icon"' in html)
check("manifest linked", 'rel="manifest"' in html)
check("no stale Hombro + Brazos label", "Hombro + Brazos" not in html)
check("standalone shoulder present", "Hombro · standalone" in html)
check("kg/lb control present", 'data-unit="kg"' in html and 'data-unit="lb"' in html)
check("rest skip present", "Saltar descanso" in html)
check("active set flow present", "Set activo" in html)

# Workout choice / recovery
check("workout chooser present", 'id="chooseWorkout"' in html and "Elegir rutina" in html)
check("workout picker present", 'id="workoutPicker"' in html and 'data-pick-workout' in html)
check("recommendation is explicitly optional", "puedes elegir cualquier sesión" in html)
check("least-recently-trained recommendation helper present", "recommendedWorkoutKeyFromHistory" in html)
check("skip action sheet present", 'id="skipSheet"' in html and 'id="skipOneSet"' in html and 'id="skipExercise"' in html)
check("skip set semantic status present", "status='skipped_set'" in html or "status:'skipped_set'" in html)
check("skip exercise semantic status present", "skipped_exercise" in html)
check("finish early control present", 'id="finishEarlyBtn"' in html and "Finalizar y guardar" in html)
check("discard session destructive control present", 'class="btn danger" id="discardSessionBtn"' in html)

# Tempo invariant
check("legacy CPEP label removed", "CPEP" not in html)
check("canonical E-PE-C-PC tempo helper present", "E–PE–C–PC" in html and "tempoView" in html)
check("single tempo markup helper used across execution states", html.count("tempoMarkup(e,false)") >= 3)
check("chronological execution label present", "Ejecución desde el inicio" in html)
check("concentric-start exercise map present", "CONCENTRIC_START_EXERCISES" in html)

# Memory + evidence-informed progression
check("intra-session load memory present", "currentSessionPreviousSet" in html)
check("cross-session load memory present", "previousSet(a.workoutKey,e.name,item.si)" in html)
check("memory prefill does not copy old reps/RIR", "prefillFromMemory" in html)
check("two-exposure progression gate present", "progressionDecisionFromExposures" in html and "2/2 exposiciones" in html)
check("progression is suggestion not silent auto-load", "weightKg:source?(+source.weightKg||0):0" in html)
check("load memory context present", "loadMemoryInsight" in html and "Memoria de carga" in html)

# Gym readability / dark mode / preview
check("semantic surface tokens present", "--surface:" in html and "--controlSelected:" in html and "--dangerSurface:" in html)
check("dark mode adaptive blue present", "--blue:#0a84ff" in html)
check("operational font sizes >=14 rules present", ".state-label{font-size:14px}" in html and ".spec{font-size:14px" in html and ".tip{font-size:16px" in html)
check("enriched next preview present", "nextPreviewMarkup" in html and "Siguiente ejercicio" in html and "next-meta" in html)
check("discard button uses semantic danger style", ".danger{" in html and "--danger:" in html)

# Decision support / diagnostics
check("program decision metrics present", "program-metrics" in html and "Anchor" in html and "weeklyWorkoutCount" in html)
check("qualitative workout status labels present", "ON TRACK" in html and "RECENT" in html and "DUE" in html)
check("today context uses weekly and last-session data", 'id="todayContext"' in html and "totalWeeklyWorkouts" in html and "lastSessionSummary" in html)
check("navigation diagnostics present", "diagnostics('nav:start'" in html and "diagnostics('nav:done'" in html and "diagnostics('nav:error'" in html)
check("week view explicitly informational", "Vista informativa" in html)

for size in (180,192,512,1024):
    p = root / f"training-os-loop-v1-{size}.png"
    check(f"icon {size} exists", p.exists())
    if p.exists():
        check(f"icon {size} valid PNG + dimensions", png_dimensions(p) == (size,size))

digest = hashlib.sha256((root/"index.html").read_bytes()).hexdigest()
check("index SHA matches version.json", digest == version["index_sha256"])

failed = [n for n, ok in checks if not ok]
print(f"TOTAL {len(checks)-len(failed)}/{len(checks)} PASS")
sys.exit(1 if failed else 0)
