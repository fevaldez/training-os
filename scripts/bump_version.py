#!/usr/bin/env python3
from pathlib import Path
import json, re, hashlib, sys
from datetime import date

if len(sys.argv) != 2:
    print("Usage: python scripts/bump_version.py <version>")
    raise SystemExit(1)

new = sys.argv[1].strip()
if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", new):
    print(f"ERROR: invalid semantic version: {new}")
    raise SystemExit(1)

root = Path(__file__).resolve().parents[1]
vpath = root/"version.json"
ipath = root/"index.html"

data = json.loads(vpath.read_text(encoding="utf-8"))
old = data["release"]

if new == old:
    print(f"ERROR: {new} is already the current release")
    raise SystemExit(1)

html = ipath.read_text(encoding="utf-8")
if old not in html:
    print(f"ERROR: current version {old} not found in index.html")
    raise SystemExit(1)

html = html.replace(old, new)
ipath.write_text(html, encoding="utf-8")

data["release"] = new
data["updated_at"] = date.today().isoformat()
data["index_sha256"] = hashlib.sha256(ipath.read_bytes()).hexdigest()
vpath.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print(f"Bumped {old} -> {new}")
print(f"index SHA256: {data['index_sha256']}")
