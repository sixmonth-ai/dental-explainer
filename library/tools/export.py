#!/usr/bin/env python3
"""Export the figure library for the website: figure scripts, the kit, posters and a public catalog.

usage: .venv/bin/python library/tools/export.py --out ../marketing-website-2/public/dental-explainer [--only slug ...] [--no-posters]

Writes into --out:
  dentkit.<hash>.js            the kit, content-hashed so browsers can cache it for good
  figures/<slug>.<hash>.js     one figure script each
  posters/<slug>-<theme>[-480].<hash>.webp   the poster frame (stage only, no labels or controls), 4:3,
                               both themes, 960 and 480 px wide, content-hashed so they can be cached for good
  search.<hash>.json           the search phrasings and synonyms, loaded after the page is up
  catalog.json                 what the page bundles: titles, categories, file names (kept small)
Rendered posters are kept in library/build/posters/ (gitignored), so an export only redraws what changed.
A figure's poster frame comes from its `// poster: end | step N` line (default: end of the story).
Posters are re-rendered only when the figure script or the kit changed, unless --force.
"""
from __future__ import annotations
import argparse, hashlib, io, json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SKILL = ROOT / "skills" / "dental-explainer"
sys.path.insert(0, str(SKILL / "scripts"))
import _browser  # noqa: E402

KIT = SKILL / "assets" / "dentkit.js"
LIB = ROOT / "library"
POSTER_W, POSTER_H = 960, 720
CACHE = LIB / "build" / "posters"
STAGE_W, STAGE_H = 2000, 1500


def h(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:10]


def source(fig: dict) -> pathlib.Path:
    return ROOT / fig["src"] if fig.get("src") else LIB / "figures" / f"{fig['slug']}.js"


def poster_state(js: str) -> str:
    m = re.search(r"^//\s*poster:\s*(.+)$", js, re.M)
    return m.group(1).strip() if m else "end"


SHELL = """<!doctype html><html data-theme="{theme}"><head><meta charset="utf-8">
<style>.dk-panel,.dk-head,.dk-foot,.dk-readout,.dk-info,.dk-label,.dk-labels,.dk-actions,.dk-ov{{display:none!important}}
body{{margin:0}}.dk{{padding:0!important;max-width:none!important}}.dk-stage{{height:{h}px!important;border-radius:0!important}}</style>
</head><body><script>window.DK_MODE='interactive';window.DK_POSTER=true;</script>
<script src="{cdn}"></script><script>{kit}</script><script>{fig}</script></body></html>"""


def subject_box(im, empty):
    from PIL import ImageChops, ImageFilter
    diff = ImageChops.difference(im, empty).convert("L").point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MedianFilter(5))
    return diff.getbbox() or (0, 0, im.width, im.height)


def autocrop(im, empty):
    """Frame the subject: find what differs from the stage background, pad it, and cut a centred 4:3 box."""
    from PIL import Image, ImageChops, ImageFilter
    W, H = im.size
    box = subject_box(im, empty)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    w = max(box[2] - box[0], (box[3] - box[1]) * 4 / 3) * 1.18
    w = min(max(w, W * 0.3), W, H * 4 / 3); hh = w * 3 / 4
    x0 = min(max(cx - w / 2, 0), W - w); y0 = min(max(cy - hh / 2, 0), H - hh)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + hh))).resize((POSTER_W, POSTER_H), Image.LANCZOS)


# Home camera, pulled back so the whole subject is on the stage (autocrop then frames it). Figures that fit
# themselves take `dist` as a zoom factor; figures with a fixed view.dist take it in mm, so scale that instead.
PULL_BACK = "f.setState({home: true}); const d0 = f.orbit.dist; f.setState({dist: 1.7}); if (f.orbit.dist === 1.7) f.orbit.dist = d0 * 1.6;"


def render_posters(figs, kit_js: str, out: pathlib.Path):
    from playwright.sync_api import sync_playwright
    from PIL import Image
    tmp = LIB / "build" / "_posters"; tmp.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, gl = _browser.launch(p)
        print(f"renderer: {gl}", flush=True)
        three = _browser.three_path(None)
        for fig, js in figs:
            state = poster_state(js)
            for theme in ("light", "dark"):
                page = tmp / f"{fig['slug']}-{theme}.html"
                page.write_text(SHELL.format(theme=theme, h=STAGE_H, cdn=_browser.CDN, kit=kit_js, fig=js))
                pg = b.new_page(viewport={"width": STAGE_W, "height": STAGE_H}, device_scale_factor=1, color_scheme=theme)
                errors = []
                pg.on("pageerror", lambda e: errors.append(str(e)))
                _browser.route_three(pg, three)
                pg.goto(page.as_uri())
                try:
                    pg.wait_for_function("window.__dkReady === true", timeout=90000)
                except Exception:
                    raise SystemExit(f"{fig['slug']} ({theme}): the figure never finished starting. {errors[:1]}")
                m = re.match(r"step\s+(\d+)", state)
                if m:
                    pg.evaluate(f"(() => {{ const f = window.__dkFig; const s = f.steps[{int(m.group(1)) - 1}] || f.steps[f.steps.length - 1]; f.seek(s.t); {PULL_BACK} }})()")
                else:
                    pg.evaluate("(() => { const f = window.__dkFig; if (f.duration) f.seek(f.duration); " + PULL_BACK + " })()")
                for _ in range(4):   # pull back until nothing touches the stage edge
                    pg.wait_for_timeout(600)
                    png = pg.locator(".dk-stage").screenshot()
                    pg.evaluate("window.__dkFig.scene.visible = false")
                    pg.wait_for_timeout(150)
                    empty = pg.locator(".dk-stage").screenshot()   # the bare stage, to tell the subject from the backdrop
                    pg.evaluate("window.__dkFig.scene.visible = true")
                    box = subject_box(Image.open(io.BytesIO(png)).convert("RGB"), Image.open(io.BytesIO(empty)).convert("RGB"))
                    if box[0] > 4 and box[1] > 4 and box[2] < STAGE_W - 4 and box[3] < STAGE_H - 4:
                        break
                    pg.evaluate("(() => { const f = window.__dkFig, d = f.orbit.dist; f.setState({dist: f.orbit.zoom * 1.45}); if (f.orbit.dist !== d) f.orbit.dist = d * 1.45; })()")
                pg.close()
                if errors:
                    raise SystemExit(f"{fig['slug']} ({theme}): JS error: {errors[0]}")
                autocrop(Image.open(io.BytesIO(png)).convert("RGB"), Image.open(io.BytesIO(empty)).convert("RGB")).save(CACHE / f"{fig['slug']}-{theme}.webp", "WEBP", quality=82, method=6)
            print(f"poster {fig['slug']} ({state})", flush=True)
        b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--no-posters", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out).resolve()
    (out / "figures").mkdir(parents=True, exist_ok=True)
    (out / "posters").mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)

    cat = json.loads((LIB / "catalog.json").read_text())
    search = json.loads((LIB / "search.json").read_text()) if (LIB / "search.json").exists() else {"synonyms": [], "queries": {}}
    # what each cached poster was drawn from (figure + kit hash), kept out of the public catalog
    state_file = CACHE / "state.json"
    prev = {k: {"_hash": v} for k, v in json.loads(state_file.read_text()).items()} if state_file.exists() else {}

    kit_bytes = KIT.read_bytes(); kit_js = kit_bytes.decode()
    kit_name = f"dentkit.{h(kit_bytes)}.js"
    for old in out.glob("dentkit.*.js"):
        if old.name != kit_name:
            old.unlink()
    (out / kit_name).write_bytes(kit_bytes)

    figures, todo, keep, phrasings = [], [], set(), {}
    for fig in cat["figures"]:
        src = source(fig)
        if not (fig.get("src") or fig.get("published")) or not src.exists():
            continue   # not built, or built but not reviewed yet: catalog.json marks a figure "published": true once it is
        data = src.read_bytes(); js = data.decode()
        name = f"{fig['slug']}.{h(data)}.js"
        keep.add(name)
        (out / "figures" / name).write_bytes(data)
        steps = len(re.findall(r"\blabel\s*:\s*['\"]", js.split("fig.procedure", 1)[1])) if "fig.procedure" in js else 0
        entry = {
            "slug": fig["slug"], "title": fig["title"], "category": fig["category"], "audience": fig["audience"],
            "teeth": fig.get("teeth", []), "point": fig.get("point", ""), "procedure": "fig.procedure" in js,
            "script": f"figures/{name}", "priority": fig.get("priority", 2),
        }
        figures.append(entry)
        stale = prev.get(fig["slug"], {}).get("_hash") != f"{h(data)}{h(kit_bytes)}"
        posters_missing = not (CACHE / f"{fig['slug']}-dark.webp").exists()
        if (a.only is None or fig["slug"] in a.only) and (a.force or stale or posters_missing):
            todo.append((fig, js))
        # remember what the posters were drawn from; unchanged when they were not redrawn this run
        phrasings[fig["slug"]] = list(dict.fromkeys(fig.get("queries", []) + search["queries"].get(fig["slug"], [])))
        entry["_hash"] = prev.get(fig["slug"], {}).get("_hash") if (a.no_posters and stale) else f"{h(data)}{h(kit_bytes)}"
    for old in (out / "figures").glob("*.js"):
        if old.name not in keep:
            old.unlink()

    if todo and not a.no_posters:
        render_posters(todo, kit_js, out)
    shutil.rmtree(LIB / "build" / "_posters", ignore_errors=True)

    # posters: two widths per theme, named by content so the CDN and browsers can keep them for good
    from PIL import Image
    keep_posters = set()
    for entry in figures:
        entry["poster"] = {}
        for theme in ("light", "dark"):
            src_png = CACHE / f"{entry['slug']}-{theme}.webp"
            if not src_png.exists():
                continue
            im = Image.open(src_png)
            for w, key in ((960, theme), (480, theme + "Sm")):
                buf = io.BytesIO()
                (im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)).save(buf, "WEBP", quality=80 if w == 480 else 82, method=6)
                data = buf.getvalue(); name = f"{entry['slug']}-{theme}{'-480' if w == 480 else ''}.{h(data)}.webp"
                if not (out / "posters" / name).exists():
                    (out / "posters" / name).write_bytes(data)
                keep_posters.add(name); entry["poster"][key] = f"posters/{name}"
    for old in (out / "posters").glob("*.webp"):
        if old.name not in keep_posters:
            old.unlink()

    search_bytes = json.dumps({"synonyms": search["synonyms"], "queries": phrasings}, ensure_ascii=False, separators=(",", ":")).encode()
    search_name = f"search.{h(search_bytes)}.json"
    for old in out.glob("search.*.json"):
        if old.name != search_name:
            old.unlink()
    (out / search_name).write_bytes(search_bytes)
    state_file.write_text(json.dumps({e["slug"]: e.pop("_hash") for e in figures}, indent=0))
    public = {"kit": kit_name, "search": search_name, "categories": cat["categories"], "figures": figures}
    (out / "catalog.json").write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")))
    print(f"exported {len(figures)} figures ({len(todo)} posters rendered) to {out}")


if __name__ == "__main__":
    main()
