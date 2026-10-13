#!/usr/bin/env python3
"""Optional verification (only where Python Playwright + Chromium exist): load a figure, fail on JS errors,
and save screenshots of the states that matter, plus ONE contact sheet (sheet.png) to look at before delivering.

usage: python3 check.py figure.html [--out shots/] [--three-local three.min.js] [--dark] [--offset MM]
       [--state 'name={"explode":0.5,"section":true,"offset":1.2,"theta":0.3,"phi":0.4,"xray":true}' ...] [--only]
       [--step 2 ...] [--seek 4.5 ...]
States shot by default, only where the figure has the feature:
  procedures: every step's key frame (what the stepper shows at the end of each step);
  otherwise:  assembled, exploded (explode slider), section (cut), top, xray (x-ray objects);
  plus one mobile (390 px) shot.
--step i / --seek t add a step's key frame or any story time. Custom --state keys: explode, section, offset, theta, phi,
dist (zoom factor, <1 = closer), xray, click (list of button labels to press), step, seek. --only shoots just the custom ones.
Uses the GPU when there is one (--soft forces software GL). three.js is cached after the first run; if it can't load,
prints "SKIP: ..." and exits 2.
"""
import argparse, base64, json, pathlib, sys, time

DEFAULT = [
    ("assembled", {"explode": 0, "section": False}),
    ("exploded", {"explode": 1, "section": False, "_needs": "explode"}),
    ("section", {"explode": 0, "section": True, "offset": 0, "_needs": "section"}),
    ("top", {"explode": 0, "phi": 0.35, "section": False}),
    ("xray", {"explode": 0, "section": False, "xray": True, "_needs": "xray"}),
]


def shoot(pg, st, offset):
    f = "window.__dkFig"
    if "seek" in st or "step" in st:
        t = st["seek"] if "seek" in st else pg.evaluate(f"{f}.steps[{int(st['step'])}].t")
        pg.evaluate(f"{f}.seek({t})")
        if st.get("click"):
            pg.evaluate(f"{f}.thaw()")
        for label in st.get("click", []):   # a view button at a procedure moment, e.g. {"step":2,"click":["Orifices"]}
            pg.get_by_role("button", name=label, exact=True).first.click()
        pg.wait_for_timeout(1300 if st.get("click") else 120)
        return
    if st.get("section") and "offset" not in st:
        st = dict(st, offset=offset)
    pg.evaluate(f"{f}.setState({json.dumps(dict({'home': True}, **{k: v for k, v in st.items() if not k.startswith('_') and k != 'click'}))})")
    pg.evaluate(f"{f}.xray(null, {str(bool(st.get('xray'))).lower()})")
    for label in st.get("click", []):   # press custom buttons by their text, e.g. "click":["Gingiva"]
        pg.get_by_role("button", name=label, exact=True).first.click()
    pg.wait_for_timeout(350)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("--out", default="shots"); ap.add_argument("--three-local"); ap.add_argument("--dark", action="store_true"); ap.add_argument("--offset", type=float, default=0)
    ap.add_argument("--state", action="append", default=[]); ap.add_argument("--only", action="store_true")
    ap.add_argument("--step", action="append", type=int, default=[]); ap.add_argument("--seek", action="append", type=float, default=[])
    ap.add_argument("--soft", action="store_true")
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("SKIP: Playwright is not installed. Rely on the checklist."); sys.exit(2)
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import _browser
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    url = pathlib.Path(a.page).resolve().as_uri()
    custom = [(s.split("=", 1)[0], json.loads(s.split("=", 1)[1])) for s in a.state]
    custom += [(f"step{i + 1}", {"step": i}) for i in a.step] + [(f"t{t:g}", {"seek": t}) for t in a.seek]
    errors, shots = [], []; t_start = time.time()
    three = _browser.three_path(a.three_local)
    with sync_playwright() as p:
        b, gl = _browser.launch(p, a.soft)
        print(f"renderer: {gl}", flush=True)
        for width, tag in [(1100, ""), (390, "-mobile")]:
            pg = b.new_page(viewport={"width": width, "height": 900}, color_scheme="dark" if a.dark else "light")
            if "SwiftShader" in gl or "swiftshader" in gl.lower():
                pg.set_default_timeout(180000)   # software GL (CI): shots of heavy figures take far longer than on a GPU
            pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
            _browser.route_three(pg, three)
            pg.goto(url)
            if not pg.evaluate("typeof THREE !== 'undefined'"):
                print("SKIP: three.js did not load (no access to cdnjs?). Use --three-local or rely on the checklist.")
                b.close(); sys.exit(2)
            try:
                pg.wait_for_function("window.__dkReady === true", timeout=90000)   # software GL compiles every shader on the first frame
            except Exception:
                print("FAIL: the figure never finished starting.")
                print("\n".join(errors) or "(no JS error was reported)"); b.close(); sys.exit(1)
            has = pg.evaluate("(() => { const f = window.__dkFig; return { section: !!f.section, explode: !f.noExplode && !!f.explodeSlider, xray: !!f.hasXray, steps: (f.steps || []).map(s => s.label) }; })()")
            if has["steps"]:
                defaults = [(f"step{i + 1}-{lbl.lower().replace(' ', '-')[:20]}", {"step": i}) for i, lbl in enumerate(has["steps"])]
            else:
                defaults = [(n, s) for n, s in DEFAULT if not s.get("_needs") or has[s["_needs"]]]
            states = (custom if a.only else defaults + custom) if not tag else (custom[-1:] if a.only and custom else defaults[-1:])
            for name, st in states:
                shoot(pg, st, a.offset)
                f = out / f"{name}{tag}.png"
                pg.screenshot(path=str(f), full_page=True)
                shots.append(f); print("shot", f, flush=True)
            pg.close()
        # one contact sheet of every shot, so a single look covers the whole check
        b.close()   # the sheet is plain HTML: shoot it in a fresh browser without WebGL (a software-GL browser that ran heavy figures can fail to capture)
        b = p.chromium.launch()
        imgs = "".join(f'<figure><img src="data:image/png;base64,{base64.b64encode(s.read_bytes()).decode()}"><figcaption>{s.stem}</figcaption></figure>' for s in shots)
        pg = b.new_page(viewport={"width": 1800, "height": 900})
        pg.set_content(f"""<style>body{{margin:0;background:#fff;font:600 15px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}}
            figure{{margin:0}}img{{width:100%;max-height:640px;object-fit:contain;object-position:top;border:1px solid #ddd}}figcaption{{padding:2px 4px}}</style>{imgs}""")
        pg.screenshot(path=str(out / "sheet.png"), full_page=True); print("sheet", out / "sheet.png")
        b.close()
    if errors:
        print("\n".join(errors)); sys.exit(1)
    print(f"OK: no JS errors ({len(shots)} shots in {time.time() - t_start:.1f}s)")

if __name__ == "__main__":
    main()
