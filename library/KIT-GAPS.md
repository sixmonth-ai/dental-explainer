# Kit gaps found while building the library

Builders the figure agents had to hand-build inside a figure script. Each is a candidate for `assets/dentkit.js`,
which would also help the skill on topics with no example.

- **Oblique ridge** on the 16/17 crown relief, and `DK.surfacePath(mesh, points)` for markers draped on enamel (molar-16).
- **`DK.periodontium`**: cementum, lamina dura and PDL fibres as layers with cut faces (periodontium).
- **`DK.mandibularCanal(m, {side})`** with mandibular and mental foramen anchors; the facts file has no canal or foramen measurements yet (ian-canal).
- **Anterior cavity preps** (Class III, IV, V) and a chip/corner-fracture builder; layered anterior composite increments (black-classes, class-iv-composite-11).
- **Masseter and temporalis** attached to `DK.mandible`/`DK.maxilla` that follow the pose; **tooth wear** (attrition facets with dentin islands) on `DK.tooth`/`DK.arch` (bruxism).
- `DK.tube` makes a degenerate, invisible tube from repeated points, which `DK.condylePath` returns during pure rotation (tmj-anatomy).
- Fixed: Playwright 1.64 WebKit (webkit-2370) segfaults on this Mac (macOS 26); the venv pins Playwright 1.60 (webkit-2287), which works.
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
- **tmj-anatomy shipped on a hand-built sagittal section** (shared with mouth-opening and disc-displacement; a `DK.tmjSection` builder would remove the duplication). Earlier note: held back after three passes: without a real temporal-bone section (fossa and eminence profile as a cut solid), the sagittal joint view reads as a translucent box. Needs `DK.temporalBone` / a fossa-eminence section builder before it can ship. Bruxism also lacks gingiva on `DK.mandible`/`DK.maxilla` arches (root necks show).
- Not in dental-facts.md: night guard about 2 mm thick; luting cement film thickness; Aquilino & Caplan 2002 survival ratio for crowned root-filled teeth.
- **maryland-bridge held back** after two passes: from the palate, the kit's anterior crowns read as slabs and cones, and hand-built wings read as thick blocks. Needs better anterior crown shapes (palatal concavity, cingulum, marginal ridges) and a draped `DK.bondedWing` before it can ship.
- **veneers-smile held back**: the after-veneer front teeth read as flat white blocks and the canines as cones, the same anterior crown-shape limit as maryland-bridge and class-iv-composite-11. Fixing the kit's anterior crown sampler (labial convexity, rounded incisal angles, palatal concavity, cingulum) would unblock all three.
- **Kit bugs in `DK.accessOutline`** (patched locally in access-outlines.js): the lower-molar trapezoid's corners are in self-crossing order (figure-8), and the lingual incisor triangle's base points cervical instead of incisal. Fix in the kit, then drop the local patches.
- Branching canal paths (Vertucci types) need a canal-path builder; `DK.tooth` canals cannot split or join.
- **black-triangles held back**: the gum reads as a block and the triangle is tiny, because the kit's anterior CEJ is flat (real incisors scallop about 3 mm incisally between teeth) and the crowns are wide at the neck. Needs a scalloped anterior CEJ, animatable papilla height on `DK.gingivaArch`, and the anterior crown-shape fix.
- Not in dental-facts.md: Tarnow 1992 papilla vs contact-to-crest distance; gummy smile excess about 3 mm, healing about 2 weeks; floss length 45 cm (ADA).
- The 11 preset's pulp chamber cuts as a rectangular block with no horns (root-resorption, open-apex, class-iv); incisor-11 replaced it with a hand-built fan. Fix the anterior pulp in `DK.tooth` (it has `pulpHorns: 3` but ignores it).
- Not in dental-facts.md: apexification MTA plug 3 to 5 mm; resorption hover claims (external more common, pink spot); endo-perio treatment order (Simon, Glick and Frank 1972).
- Not in dental-facts.md (wave 4): Miller mobility grades (0.2 / 1 mm); crestal sinus lift residual bone about 6 mm and gain 3 to 4 mm; ridge widening 4 to 6 mm and 6 months healing; mini implant widths; stitch removal 1 to 2 weeks. All "about", from standard teaching; add sources.
- Not in dental-facts.md (wave 4e): coronectomy root trim about 3 mm (Pogrel 2004); TAD size and placement (Papadopoulos 2007, Poggio 2006).
