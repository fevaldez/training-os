#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
manifest=(root/'manifest.webmanifest').read_text(encoding='utf-8')
checks=[]
def check(name,ok): checks.append((name,bool(ok)))
check('no target=_blank in app', 'target="_blank"' not in html and "target='_blank'" not in html)
check('no window.open in app', re.search(r'\bwindow\.open\s*\(',html) is None)
check('video action stays inside shell', 'data-video-url=' in html and 'navigator.share' in html and 'shareExternalUrl' in html)
check('standalone external-navigation guard present', "external:block" in html and "display-mode: standalone" in html)
check('launch lifecycle diagnostics present', 'tos.reliability.v1' in html and "pageshow" in html and "pagehide" in html and "visibilitychange" in html)
check('legacy cleanup replaced by same-scope registration', "register(BASE+'sw.js',{scope:BASE,updateViaCache:'none'})" in html and 'unregister()' not in html)
check('startup preserves all caches and workout storage', 'caches.delete' not in html and 'TOS_OFFLINE_STATUS' in html)
check('single rest CTA id', html.count('id="dockStart"')==1 and 'id="startNext"' not in html)
check('rest CTA is fixed safe-area dock', '.rest-dock{position:fixed' in html and 'safe-area-inset-bottom' in html)
check('rest waiting state uses semantic control color', '.rest-dock button.waiting{background:var(--control);color:var(--label)}' in html)
check('explicit PWA identity preserved', all(x in manifest for x in ['"id": "/training-os/"','"scope": "/training-os/"','"start_url": "/training-os/"']))
check('no insecure URL literal', 'http://' not in html and 'http://' not in manifest)
for name,ok in checks: print(f"{'PASS' if ok else 'FAIL'} | {name}")
p=sum(1 for _,ok in checks if ok)
print(f"TOTAL {p}/{len(checks)} PASS")
sys.exit(0 if p==len(checks) else 1)
