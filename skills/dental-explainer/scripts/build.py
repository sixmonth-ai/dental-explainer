#!/usr/bin/env python3
"""Assemble a standalone dental figure page: three.js r128 (cdnjs) + dentkit.js inlined + the figure script.

usage: python3 build.py figure.js -o figure.html [--title "Page title"] [--mode interactive|image|video] [--aspect 16:9|1:1|4:5|9:16] [--three-local three.min.js]
  --mode sets how the page presents the figure (default interactive). image and video pages carry a Download button;
  scripts/render.py turns them into a .png or .mp4 directly.
  --three-local inlines a local three.js r128 file instead of loading it from cdnjs.
"""
from __future__ import annotations
import argparse, pathlib, html

HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / "assets" / "dentkit.js"
CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"

def build(fig_js: str, title: str, three_local: str | None = None, mode: str = "interactive", aspect: str = "16:9") -> str:
    kit = KIT.read_text()
    three = f"<script>{pathlib.Path(three_local).read_text()}</script>" if three_local else f'<script src="{CDN}"></script>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title></head>
<body>
<script>window.DK_MODE = {mode!r}; window.DK_ASPECT = {aspect!r};</script>
{three}
<script>
{kit}
</script>
<script>
{fig_js}
</script>
</body></html>
"""

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("figure")
    ap.add_argument("-o", "--out")
    ap.add_argument("--title", default="Dental figure")
    ap.add_argument("--three-local")
    ap.add_argument("--mode", choices=["interactive", "image", "video"], default="interactive")
    ap.add_argument("--aspect", choices=["16:9", "1:1", "4:5", "9:16", "4:3"], default="16:9")
    a = ap.parse_args()
    src = pathlib.Path(a.figure)
    out = pathlib.Path(a.out) if a.out else src.with_suffix(".html")
    out.write_text(build(src.read_text(), a.title, a.three_local, a.mode, a.aspect))
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
