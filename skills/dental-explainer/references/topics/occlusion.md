# Occlusion, mandibular movement and the TMJ

Facts: `references/dental-facts.md` §21. Read it before planning.

## Building a figure

Facts: §21 (working vs non-working, Bennett movement, condylar guidance, ranges, the disc, AI mistakes), §1 (patient's right vs viewer's right).
- **Lateral excursion** ("which condyle is the working one", "what happens when I chew to the right", Bennett movement, working / non-working side): copy `examples/lateral-excursion.js`. `DK.mandible({ teeth: true, upper: true })` builds the jaw; `DK.tmj(m, 'right' | 'left')` adds the see-through fossa and eminence; one `fig.param('lateral', …)` calls `m.pose({ lateral, side })`, redraws the non-working condyle's path (`DK.condylePath`, accent) and the readout from the returned pose. Five steps: closed → move right (front view, the lower midline shifts) → working side (from above-lateral, turn arrow around the vertical axis) → non-working side (lateral view, the condyle slides down the eminence past its rest ghost) → from above (the path leaves the sagittal line at the Bennett angle). For a movement to the **left**, set `side: 'left'` and swap which condyle carries "working" / "non-working", the path (`.right`) and the camera sides (negate `theta`).
- **Protrusion** (both condyles forward and down, incisal guidance): same scaffold, drive `m.pose({ protrusion })` (0–8 mm), trace both condyles with `DK.condylePath(...).left/.right`; lateral view of one joint plus a front view.
- **Opening** (rotation then translation): drive `m.pose({ open })` (0–50 mm). Show a lateral view of one joint: up to ~22 mm the condyle only rotates in place, then it slides down the eminence; the readout is the incisal drop and the condyle's forward travel (`pose.working.forward`). Say "rotation first, then translation" in a step label, not a paragraph.
- **The bone itself** (mandible anatomy, landmarks): `DK.mandible({ teeth })` with `fig.part(m.group)` and `inPlace` labels on `m.body`, `m.rami.left`, `m.condyles.left`; anchors are frame points (coronoid tip ≈ `[±39, 29, −58]`, gonial angle ≈ `[±46, −15, −77]`, condyle top = centre + `head.si/2` in y).
- Watch for: the **patient's** right (front view: on the viewer's left) and say it in the subtitle; working = the side the jaw moves toward; the working condyle pivots but is not frozen (a fraction of a mm to ~2 mm side shift); the non-working condyle goes forward, **down** and **in**; never hide a condyle in an opaque fossa; numbers in the readout come from the pose, never typed in.

## Kit API

Frame: the `DK.arch` mandibular frame (origin at the lower incisor contact, CEJ level; **+x = patient's left**, +y up, +z anterior; the xz plane is the occlusal plane). Full table in `references/kit-api.md` → "Jaw, condyles and TMJ".

| call | returns |
|---|---|
| `DK.mandible(opts)` → `m` | The jaw: `m.group` (static frame, register it as the regular part), `m.jaw` (moving), `m.body`, `m.rami.{left,right}`, `m.condyles.{left,right}`, `m.teeth` (DK.arch), `m.upper` (static upper crowns, `m.upper.holder`), `m.centres.{left,right}` (rest condyle centres), `m.now` (current), `m.axes` (condyle long axes, lateral-pointing), `m.head` `{ml, ap, si}`, `m.incisal`, `m.eminence` `{inclination, height, length, drop(a)}`, `m.pose(o)`, `m.solve(o)`. |
| `DK.tmj(m, side, opts)` → group | See-through fossa + eminence plate with an ink profile line, keeping a joint space over the condyle and down the eminence. `userData.anchors.{roof, slope, crest, postglenoid}`, `userData.plate`, `userData.line`. |
| `DK.jawPose(m, {lateral, side, protrusion, open, shift, disclude})` → pose | Rigid pose; returns `working`, `nonWorking` (`forward`, `down`, `medial`, `travel`, `now`), `bennett`, `rotation`, `incisal` (`lateral`, `drop`, `forward`), `apply(v)`. |
| `DK.condylePath(m, pose, n)` → `{left, right, incisal}` | Point lists from rest to the pose, for path tubes. |

Pitfalls:
- **Framing.** Register `m.group` as the one regular part; everything else (`m.body`, condyles, plates, paths, guides) is `inPlace`. Never make every object `inPlace` (the camera would frame every mesh) and never `fig.part(m.jaw)` (a regular part's position is reset every frame, which would undo the pose).
- **Labels on moving parts:** the anchor is in the mesh's own frame, which for the bone is the rest-pose frame, so `[c.x, c.y + m.head.si / 2, c.z]` stays on top of the head as it moves. Condyle labels sit under the see-through plate, so give them `dim: false`; the path label too.
- **Paths:** the centre path is inside the head; draw it at the lateral pole (offset by `m.axes[side] × (m.head.ml / 2 + 0.5)`), as an accent `DK.tube`, rebuilt from `DK.condylePath` when the param changes. Mark the rest position with a see-through copy of `m.condyles[side].geometry` (`polygonOffset`, `depthWrite: false`), shown only once the jaw has moved.
- **Close-ups:** use `focus` on `m.centres[side]` with `zoom` 0.35–0.5; a joint seen from its own side (`theta ≈ ±π/2`) shows the eminence slope, from above (`phi ≈ 0.5–0.75`) the Bennett angle. Fade the plates (a `fossa` param on `plate.material.opacity`) for views from above. On phones the stage is narrow: keep the thing that matters (the non-working path) near the centre of `focus`.
- Values are population averages; the eminence inclination is measured to the kit's occlusal plane (FH-referenced textbook values differ by ~10°). Say "approximate" in the subtitle.
