#!/usr/bin/env python3
"""Mark reviewed figures as published in catalog.json (export.py only ships those).
usage: .venv/bin/python library/tools/publish.py slug [slug ...]"""
import json, pathlib, re, sys
p = pathlib.Path(__file__).resolve().parents[1] / "catalog.json"
s = p.read_text()
for slug in sys.argv[1:]:
    if f'"slug":"{slug}","published":true' in s:
        continue
    if f'{{"slug":"{slug}",' not in s:
        sys.exit(f"unknown slug {slug}")
    s = s.replace(f'{{"slug":"{slug}",', f'{{"slug":"{slug}","published":true,', 1)
json.loads(s); p.write_text(s)
print("published:", sum(1 for f in json.loads(s)["figures"] if f.get("published")))
