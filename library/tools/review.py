#!/usr/bin/env python3
"""Contact sheet of built figures for review: each slug's image-mode PNG (light) beside its poster (dark).
usage: .venv/bin/python library/tools/review.py out.png slug [slug ...] [--posters DIR]"""
import sys, pathlib
from PIL import Image, ImageDraw
out, slugs = sys.argv[1], [a for a in sys.argv[2:] if not a.startswith("--")]
lib = pathlib.Path(__file__).resolve().parents[1]
W = 900; rows = []
for s in slugs:
    p = lib / "build" / s / f"{s}.png"
    im = Image.open(p).convert("RGB") if p.exists() else Image.new("RGB", (W, 500), "red")
    im = im.resize((W, round(im.height * W / im.width)))
    rows.append(im)
sheet = Image.new("RGB", (W * 2, sum((r.height + 1) // 2 * 1 for r in rows) + 10), "white")
cols = [0, 0]
sheet = Image.new("RGB", (W * 2, max(1, sum(r.height for r in rows))), "white")
for r in rows:
    c = 0 if cols[0] <= cols[1] else 1
    sheet.paste(r, (c * W, cols[c])); cols[c] += r.height
sheet = sheet.crop((0, 0, W * 2, max(cols)))
sheet.save(out)
