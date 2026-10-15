# Kit gaps found while building the library

Builders the figure agents had to hand-build inside a figure script. Each is a candidate for `assets/dentkit.js`,
which would also help the skill on topics with no example.

- **Oblique ridge** on the 16/17 crown relief, and `DK.surfacePath(mesh, points)` for markers draped on enamel (molar-16).
- **`DK.periodontium`**: cementum, lamina dura and PDL fibres as layers with cut faces (periodontium).
- **`DK.mandibularCanal(m, {side})`** with mandibular and mental foramen anchors; the facts file has no canal or foramen measurements yet (ian-canal).
- **Anterior cavity preps** (Class III, IV, V) and a chip/corner-fracture builder; layered anterior composite increments (black-classes, class-iv-composite-11).
- **Masseter and temporalis** attached to `DK.mandible`/`DK.maxilla` that follow the pose; **tooth wear** (attrition facets with dentin islands) on `DK.tooth`/`DK.arch` (bruxism).
- `DK.tube` makes a degenerate, invisible tube from repeated points, which `DK.condylePath` returns during pure rotation (tmj-anatomy).
- Playwright WebKit (1.64, webkit-2370) segfaults on launch on this Mac, so the iPhone pass of check.py has not run for any library figure.
- `DK.socket(spec, {gap})`: an empty extraction socket plus a graft with a fill level, and a particulate graft cap texture (socket-preservation).
- `DK.sinus` or a sinus option on `DK.maxilla`, a liftable Schneiderian membrane, and a sweep-with-hole builder (sinus-lift).
- The 11 preset crown outline is too rectangular (anteriorShape sampler); the distal incisal angle needs more rounding (class-iv-composite-11).
- Arches in occlusion with an adjustable front-back shift (Angle class) and incisor pairs with numeric overbite/overjet plus measurement bars (angle-classes, overbite-overjet).
- Hawley retainer, bonded lingual retainer, Hyrax expander, and a maxilla that splits at the midpalatal suture (retainers, palatal-expander).

## Numbers used that are not in dental-facts.md yet (shown as "about"; add with sources)
- Ridge loss without a socket graft: about 3.8 mm width, 1.2 mm height at 6 months (cited from memory as Tan 2012). Graft healing before implant 6 to 9 months.
- Residual bone under the sinus about 4 mm before a lateral lift, about 12 mm after.
- Overbite and overjet norms about 2 to 3 mm; incisor tilts.
- Rapid palatal expansion screw rate about 0.2 to 0.25 mm per turn.
- `DK.crack(tooth, {plane, depth, width})`; dentin-tubule and pulp-nerve overlays on a cut face; sinus-tract / parulis and a soft-tissue layer over bone; fissure-etch gel and path-growing sealant (cracked-tooth-36, sensitivity, periapical-abscess, sealant-36).
- `DK.forceps`, `DK.elevator`, `DK.syringe`, `DK.toothSplit` (crown and roots as separate solids), `DK.flap`, a section-ready "bone removed" void, nerve pathways on `DK.mandible` (canal, foramina, lingual nerve) (surgery figures).
- `DK.holeCap` is nearly the bone cut-face colour in the light theme: empty space in bone sections needs `DK.RIM` outlines. Section-group order affected cutOnly voids in surgical-extraction (workaround in the script).
- Not in dental-facts.md: dry socket onset 2 to 4 days and healing 1 to 2 weeks; mandibular foramen at about the occlusal level.
- Section-safe calculus deposit band (overlapping `DK.calculus` lumps break stencil caps); `DK.curette`; site-specific gingival margin (labial recession, papillae kept); an inside-a-layer sampler for placing particles in enamel/dentin/pulp (calculus, scaling-root-planing, gum-recession, whitening).
- Kit artefact: thin dark hairlines on incisor enamel/pulp-horn cut faces.
- Not in dental-facts.md: whitening mechanism (qualitative only, e.g. Joiner 2006).
