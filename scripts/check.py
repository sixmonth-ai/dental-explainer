#!/usr/bin/env python3
"""Optional verification (only where Python Playwright + Chromium exist): load a figure, fail on JS errors,
and save screenshots of several states so Claude can LOOK at them before delivering.

usage: python3 check.py figure.html [--out shots/] [--three-local three.min.js] [--dark] [--offset MM]
       [--state 'name={"explode":0.5,"section":true,"offset":1.2,"theta":0.3,"phi":0.4,"xray":true}' ...]
Custom --state entries are shot in addition to the defaults (use --only to shoot just them).
State keys: explode, section, offset, theta, phi, dist (zoom factor, <1 = closer), xray, click (list of button labels to press).
States: assembled, exploded, sectioned (if the figure has a section), occlusal-ish view, mobile width.
"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright

CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
VENDOR = pathlib.Path(__file__).resolve().parent.parent / "assets" / "vendor" / "three.r128.min.js"  # used automatically (offline-safe)
STATES = [
    ("assembled", {"explode": 0, "section": False}),
    ("exploded", {"explode": 1, "section": False}),
    ("section", {"explode": 0, "section": True, "offset": 0}),
    ("side", {"explode": 0.5, "theta": 1.57, "phi": 1.45, "section": False}),
    ("top", {"explode": 0, "phi": 0.35, "section": False}),
    ("xray", {"explode": 0, "section": False, "xray": True}),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("--out", default="shots"); ap.add_argument("--three-local"); ap.add_argument("--dark", action="store_true"); ap.add_argument("--offset", type=float, default=0)
    ap.add_argument("--state", action="append", default=[]); ap.add_argument("--only", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    url = pathlib.Path(a.page).resolve().as_uri()
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        for width, tag in [(1100, ""), (390, "-mobile")]:
            pg = b.new_page(viewport={"width": width, "height": 900}, color_scheme="dark" if a.dark else "light")
            pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
            local = a.three_local or (str(VENDOR) if VENDOR.exists() else None)
            if local:
                pg.route(CDN, (lambda p: (lambda r: r.fulfill(path=p, content_type="application/javascript")))(local))
            pg.goto(url)
            pg.wait_for_function("window.__dkReady === true", timeout=20000)
            has_section = pg.evaluate("!!(window.__dkFig && window.__dkFig.section)")
            custom = [(s.split('=', 1)[0], __import__('json').loads(s.split('=', 1)[1])) for s in a.state]
            states = (custom if a.only else STATES + custom) if not tag else [STATES[0], STATES[2]]
            no_explode = pg.evaluate('!!window.__dkFig.noExplode')
            for name, st in states:
                if st.get("section") and not has_section:
                    continue
                if name == 'exploded' and no_explode:
                    continue
                st = dict(st, offset=a.offset) if st.get("section") else st
                pg.evaluate(f"window.__dkFig.setState({__import__('json').dumps(dict({'home': True}, **st))})")
                pg.evaluate(f"window.__dkFig.xray(null, {str(bool(st.get('xray'))).lower()})")
                for label in st.get('click', []):   # press custom buttons by their text, e.g. "click":["Gingiva"]
                    pg.get_by_role("button", name=label, exact=True).first.click()
                pg.wait_for_timeout(350)
                f = out / f"{name}{tag}.png"
                pg.screenshot(path=str(f), full_page=True)
                print("shot", f)
            pg.close()
        b.close()
    if errors:
        print("\n".join(errors)); sys.exit(1)
    print("OK: no JS errors")

if __name__ == "__main__":
    main()
