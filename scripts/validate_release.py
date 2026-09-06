#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, struct, sys

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

check("release marker in index", release in html)
check("T·OS brand marker", "T·OS" in html)
check("apple touch icon linked", 'rel="apple-touch-icon"' in html)
check("manifest linked", 'rel="manifest"' in html)
check("no stale Hombro + Brazos label", "Hombro + Brazos" not in html)
check("standalone shoulder present", "Hombro · standalone" in html)
check("kg/lb control present", 'data-unit="kg"' in html and 'data-unit="lb"' in html)
check("rest skip present", "Saltar descanso" in html)
check("active set flow present", "Set activo" in html)
check("workout chooser present", 'id="chooseWorkout"' in html and "Elegir rutina" in html)
check("workout picker present", 'id="workoutPicker"' in html and 'data-pick-workout' in html)
check("recommendation is explicitly optional", "puedes elegir cualquier sesión" in html)
check("least-recently-trained recommendation helper present", "recommendedWorkoutKeyFromHistory" in html)
check("skip set control present", 'id="skipSet"' in html and "Omitir set" in html)
check("finish early control present", 'id="finishEarlyBtn"' in html and "Finalizar y guardar" in html)
check("discard session control present", 'id="discardSessionBtn"' in html and "Descartar sesión" in html)
check("skipped status persisted", "status:'skipped'" in html)

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
