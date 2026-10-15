# Building a library figure

The library is a public catalog of pre-built dental figures on sixmonth.ai/dental-explainer. Each figure is one script in `library/figures/<slug>.js`, written against the dental-explainer kit exactly like the skill's own examples. Dentists, dental students and patients will open these, rotate them and download them, so every figure must be **anatomically right and look finished**. Accuracy first, then beauty; both are required.

Repo root: `/Users/joehachem/Developer/sixmonthai/dental-explainer`. Skill: `skills/dental-explainer/`. Python with Playwright: `.venv/bin/python` (use it for every script; plain `python3` has no Playwright).

## Before you build (once per batch)

1. Read `skills/dental-explainer/SKILL.md` in full. It is the house method; follow it (sections 2 to 5, craft rules, accuracy checklist, what the kit can't do). Skip "Ask first" and "Deliver": you never ask, you decide.
2. Read `references/dental-facts.md` §1–14, plus the section for your topics, and `references/kit-api.md`.
3. Read the topic file(s) in `references/topics/` for your figures and the closest examples in `examples/*.js`.

## For each figure

The catalog entry (`library/catalog.json`) gives the slug, title, the teeth, the kind (story / procedure / comparison) and the teaching point. The title and teaching point are a starting brief: improve them if the anatomy or the figure says otherwise (and report what you changed).

1. Plan as SKILL.md §2–3 says (teaching point, coverage, numbers from the facts file, geometry, story or procedure, text review).
2. Write `library/figures/<slug>.js`. First line: a comment saying what the figure is and its frame, like the examples. Second line: `// poster: <state>` naming the frame that best sums the figure up for a thumbnail card: `end` (the story's final teaching shot) or `step N` (1-based, the key beat of step N of a procedure).
3. Build and check in `library/build/<slug>/` (gitignored):
   ```
   .venv/bin/python skills/dental-explainer/scripts/build.py library/figures/<slug>.js -o library/build/<slug>/<slug>.html --mode interactive --title "<title>"
   .venv/bin/python skills/dental-explainer/scripts/check.py library/build/<slug>/<slug>.html --out library/build/<slug>/shots
   .venv/bin/python skills/dental-explainer/scripts/build.py library/figures/<slug>.js -o library/build/<slug>/<slug>-image.html --mode image --title "<title>"
   .venv/bin/python skills/dental-explainer/scripts/render.py library/build/<slug>/<slug>-image.html -o library/build/<slug>/<slug>.png
   .venv/bin/python skills/dental-explainer/scripts/render.py library/build/<slug>/<slug>-image.html -o library/build/<slug>/<slug>-dark.png --dark
   ```
   Add `--no-webkit` to check.py: Playwright's WebKit segfaults on this machine (known, logged in KIT-GAPS.md). check.py must print `OK`. **Look at `shots/sheet.png` and both PNGs** with the Read tool. Fix and re-check until a demanding clinician would put it in a lecture: no labels off their part, no parts poking through others, no empty or cropped framing, nothing that reads as a toy (a bent tube for a bone, a sphere for an organ), light and dark both readable, the 390 px mobile shot readable.
4. Run the SKILL.md accuracy checklist against the figure and fix what fails. Tooth numbers in the subtitle state their system (FDI, with Universal in brackets when it helps patients).

## What review sent back in wave 1 (avoid these)

- **Cluttered teaching shot**: ghost outlines of context bones, stray translucent shapes, out-of-focus teeth filling a third of the frame. Hide context that does not carry the point; the last frame should read at a glance.
- **Subject cropped** by the frame edge in the final frame or storyboard panels. Leave margin on every side.
- **Unrecognisable shapes at thumbnail size**: a sinus that reads as a pipe, an incisor that reads as a box. Prefer a clean section slab seen straight on (like a CBCT slice) when 3D context confuses; check each storyboard panel at its small size.
- **Clinical numbers not in dental-facts.md**: if you must use one, say "about" and list it in your report with its source.

## Rules

- Keep helper scripts and temporary files under `library/build/<slug>/`, not the shared scratchpad (other agents overwrite it).

- Write only `library/figures/<slug>.js` for your own slugs and files under `library/build/`. **Never edit** `assets/dentkit.js`, the examples, the references, `catalog.json` or anything else shared: other agents are working in parallel.
- If the kit lacks a structure, build it inside the figure script from real outlines (`DK.sweepGeometry`, `DK.lathe`, extruded traced outlines, `DK.tooth` presets placed one by one). Keep helpers local to the script.
- If a figure cannot be made honestly with the kit (the result would mislead or look like a toy), stop on that one and report it as `skipped` with the reason, rather than shipping it.
- Interactive pages: 2–4 controls, ≤ 6 labels per frame, a story or procedure as SKILL.md describes. Keep the built-in footer.
- No em dashes (—) in titles, subtitles, labels, hover text or captions. Use a comma, colon or period. (Website copy rule.)

## Report (your final message)

One block per figure:
```
<slug>: done | skipped
title: <final title>   (if changed)
poster: <state>
point: <one sentence>
checked: <what you looked at and fixed, one line>
kit gap: <a builder the kit should get, if you had to hand-build something; else none>
```
