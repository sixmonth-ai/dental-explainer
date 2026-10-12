#!/usr/bin/env python3
"""Assemble a standalone dental figure page: three.js r128 (cdnjs) + dentkit.js inlined + the figure script.

usage: python3 build.py figure.js -o figure.html [--title "Page title"] [--offline]
  --offline inlines the bundled three.js (assets/vendor) so the page works with no network (~650 KB instead of ~60 KB).
"""
import argparse, pathlib, html

HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / "assets" / "dentkit.js"
VENDOR = HERE.parent / "assets" / "vendor" / "three.r128.min.js"
CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"

def build(fig_js: str, title: str, three_local: str | None = None) -> str:
    kit = KIT.read_text()
    three = f"<script>{pathlib.Path(three_local).read_text()}</script>" if three_local else f'<script src="{CDN}"></script>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title></head>
<body>
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
    ap.add_argument("--three-local"); ap.add_argument("--offline", action="store_true")
    a = ap.parse_args()
    if a.offline and not a.three_local: a.three_local = str(VENDOR)
    src = pathlib.Path(a.figure)
    out = pathlib.Path(a.out) if a.out else src.with_suffix(".html")
    out.write_text(build(src.read_text(), a.title, a.three_local))
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
