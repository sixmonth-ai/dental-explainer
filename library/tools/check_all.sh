#!/bin/sh
# Rebuild every published library figure with the current kit and run check.py on it (WebKit pass included).
cd "$(dirname "$0")/../.." || exit 1
PY=.venv/bin/python
for slug in $($PY -c "import json;print(' '.join(f['slug'] for f in json.load(open('library/catalog.json'))['figures'] if f.get('published')))"); do
  d=library/build/$slug; mkdir -p $d
  $PY skills/dental-explainer/scripts/build.py library/figures/$slug.js -o $d/$slug.html --mode interactive >/dev/null
  r=$($PY skills/dental-explainer/scripts/check.py $d/$slug.html --out $d/shots 2>&1 | tail -1)
  echo "$slug: $r"
done
