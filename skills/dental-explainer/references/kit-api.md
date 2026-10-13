# dentkit.js API

Global `DK`, built on three.js r128 (global `THREE`). Units are **millimetres**.

**Tooth frame** (every tooth and preset): `y` up = coronal, **CEJ at y = 0**, crown above, roots below; **+x = mesial**, **+z = buccal/labial**. Mandibular teeth sit naturally (crown up). For maxillary teeth in the mouth, set `group.scale.y = -1` (mirror; the renderer handles the flipped winding).

## Figure

```js
const fig = DK.figure({ title, subtitle, view: { theta, phi }, footer });
```
- `view.theta` (around y, 0 = camera on +z / buccal side), `view.phi` (from top; 1.57 = level). Leave `dist` out: the camera auto-fits the assembled state and follows the explode. **What it fits:** every regular part except those marked `fit: false`; `inPlace` parts never count. Give context blocks (bone, gingiva) `fit: false` when the subject is one tooth, so the camera frames the tooth. A figure made only of `inPlace` parts frames every visible mesh. `view.margin` (default 0.85) tightens (<0.85) or loosens (>0.85) that fit. Image frames fit 15% looser to leave room for the title.
- **Mode** comes from `build.py --mode` (`interactive` | `image`; also `?mode=` in the URL). The same script serves both: interactive is a page with a control panel; image is a framed stage (`--aspect 16:9 | 1:1 | 4:5 | 9:16`) with the title on top and the footer inside the frame. `fig.mode` reads it. Video is coming soon: the kit still contains it but treats `video` as `interactive` unless `window.DK_ENABLE_VIDEO` is set, so never build or offer it.
- `autoRotate: true` is opt-in and off by default.

| call | does |
|---|---|
| `fig.part(obj, {name, sub, info, anchor:[x,y,z] or (e, section)=>[x,y,z], explode:[dx,dy,dz], labelOffset:[px,py], label:true, when:(e, section)=>bool, inPlace:false, accent:false})` → part | Adds `obj` to the scene as a hoverable part with a leader-line label. `anchor` is in **`obj`'s own local frame**: for a marker mesh you position yourself, the anchor is `[0,0,0]`, not the marker's coordinates. `explode` is the displacement at explode = 1. `inPlace:true` annotates a sub-object already in the scene (for example `tooth.layers.pulp`), so hover names the layer and nothing moves. `when` hides the label unless it returns true. Function anchors and `when` are evaluated every frame and always receive a section object (`{enabled:false, offset:0}` before `enableSection`). `part.alpha` is the label's current opacity (0..1): use it to fade a marker with its label. `part.setAnchor(a)` changes the anchor later. `dim:false` keeps the label at full strength even when its anchor is hidden behind another part (a label is never dimmed by its own object, so two labels can share one mesh: "Prepared tooth" and "Margin" on one prep). `fit:false` leaves the part out of the camera fit (context blocks). `accent:true` draws the label, leader and dot in the brand accent: use it on the **one** thing the figure points at (the MB2 orifice, the implant, the active tool), never on several parts. |
| `fig.enableSection(removeToward, groups)` | Clipping plane with **solid cut faces** that carry a procedural material grain (dentinal tubules, enamel rods, cortical porosity, trabecular lattice, stippled gingiva, brushed metal), thin boundary lines between layers and a soft inner shadow at every cut edge. `removeToward` is the direction of the half that is cut away, for example `[0,0,1]` removes the buccal half so the camera on +z sees the cut. `groups` is ordered **outermost → innermost**: `[{objects:[…], color, texture?, kind?}]`. Each group's objects form one solid, and later groups paint over earlier ones. The grain is inferred from `color` (a `DK.COLORS.*Cap` value) or the material (metals); set `kind` (`'dentin' | 'enamel' | 'pulp' | 'cortical' | 'gingiva' | 'metal' | 'plain'`) to choose it explicitly, for example `kind:'dentin'` for a custom dentin colour. |
| `fig.standardControls({explode, explodeLabel, section:{label, on, range:[a,b], offset}, labels})` → `{explode, section, cut, labels, reset}` | Adds the panel controls: explode slider (`explode:false` to omit), cut toggle + slider, and a reset button (always last). `labels:true` adds a Labels toggle (off by default). `offset` and the range are positions along `removeToward` (mm). `fig.section.set(on, pos)` from your own code keeps the toggle and slider in sync. |
| `fig.view(label, state, dur?)` | A panel button that eases the figure to `state` (any story keys, below) in `dur` s (default 0.9). Use for the 1–2 views the point depends on. |
| `fig.xrayToggle([objs], 'X-ray', false)` | A panel button that fades context tissue to see-through. `fig.xray([objs], on)` registers objects without a button (then use `xray` in story beats or views). `fig.xrayOn` reads the state. |
| `fig.slider / fig.toggle / fig.button` | Custom panel controls: `(label, min, max, step, value, onInput)`, `(label, on, onChange)`, `(label, onClick)`. |
| `fig.setReadout([{k, v, cls:'ok'|'warn'}])` | A quiet row of numbers under the stage (interactive only). Use it only when a number is the point. `v` may be an array of segments `[{v:'healthy 1.5 mm ✓', cls:'ok'}, {v:'perio 5.0 mm ⚠', cls:'warn'}]`. **Compute every value from the same constants that place the geometry.** |
| `fig.story([shots])` | The motion, as a shot list. Each shot: `{dur, hold, theta, phi, zoom, focus, explode, section, offset, xray, ease, drift, labels, caption}`. Numbers ease with smootherstep over `dur` seconds (default 1.2; `ease: 'out' | 'in' | 'linear'` to change the curve), then the camera rests for `hold` (default 0.6) with a barely visible orbit drift and push-in (`drift: 0` pins it). `focus: [x, y, z]` (world mm) moves the orbit centre so a smaller `zoom` becomes a push-in on that part; `focus: 'auto'` returns to the fitted centre. Unset keys carry over; the first shot starts from the home view. `section:true` turns the cut on at `offset` in place — to **sweep** the cut in, turn it on at an offset outside the figure in a `dur: 0` shot, then move `offset` in the next. `xray` is 0..1. `labels` lists the part names to show (`'all'`, `[]`); they land as the move settles. `caption` is kept for the coming video mode and is not shown today. Interactive pages play the story once on load (any touch stops it); image shows its last frame. |
| `fig.param(name, value, fn)` | A number the story can animate. `fn(v)` updates the scene (move a drill, deepen an osteotomy, lower the bone). Beats set it with `set: { name: v }`; it eases like the camera. Objects a param moves go in `fig.world` with `inPlace: true` parts (explode resets regular parts). Stepping back or jumping to a step resets **every** param to that step's end, so a step only needs to set what it changes. |
| `fig.procedure([{label, caption, beats:[…]}], opts)` | Named clinical steps, each a few beats (a step without `beats` is one beat). `key: true` on a beat picks the storyboard frame. Interactive: a stepper (‹ n/N label › ▶) in the panel; forward plays the step, back eases to the previous step's end. The play button shows its state: ▶ when idle (plays from the current step, or from the start on the last step), a pressed ■ while anything plays (click to stop), with a progress line under the step name. Image: a numbered storyboard grid. (`caption` is stored for the coming video mode.) `fig.step` and `fig.goStep(i)` read and set the step. |
| `fig.goTo(state, dur)` | Ease from the current state to `state` (story keys). |
| `fig.onFrame((dt, e) => …)` | Per-frame hook. `e` is the eased explode amount 0..1. Update the readout only when a value changes. |
| `fig.section` | `{enabled, offset, plane, set(on, pos)}` after `enableSection`. Use `fig.section.plane` as `material.clippingPlanes = [plane]` for extra non-solid meshes that should be cut too. |
| `fig.orbit` | `{theta, phi, dist, zoom, target, auto}`. Prefer `fig.view` / `fig.goTo` over setting it directly (direct sets jump instead of easing). |
| `fig.exportPNG(scale)`, `fig.savePNG()`, `fig.seek(t)`, `fig.duration` | Export (used by the page's Download buttons and by `render.py`). `seek(t)` freezes the live loop and renders the story at time `t`, deterministically. |
| `fig.setState({home, explode, theta, phi, dist, section, offset})` | Jump to a state instantly (used by `check.py`). With auto-fit, `dist` is a zoom factor (1 = fitted). |
| `fig.steps` | `[{label, t}]`: each procedure step and the story time of its key frame. `fig.seek(t)` shows it (`check.py --step i`, `render.py --sheet`). |
| `fig.start()` | Call last. |

## Anatomy builders

| call | returns |
|---|---|
| `DK.toothPreset(fdi)` | Spec for permanent FDI 11–48: Wheeler crown and root lengths, MD/BL widths at the crown and cervix, cusps and grooves, roots, canals. `spec.maxillary`, `spec.approx` (true for third molars, which are approximated by second molars). |
| `DK.tooth(fdiOrSpec, {omit:['enamel','dentin','pulp']})` | `{group, layers:{enamel, dentin, root, pulp}, spec, mats}`. Enamel as a closed shell over the dentino-enamel junction (knife edge at the CEJ, ~1 mm on the sides, ~2 mm over cusps); `layers.dentin` is **one continuous body** (root or furcation dome + trunk flowing into the crown dentin, so a cut shows no seam at the CEJ); `layers.root` holds the extra roots of multi-rooted teeth (domed tops hidden in the trunk) and is empty for single-rooted teeth unless the crown is omitted; the pulp chamber's floor spans the orifices and the canals funnel into it. Crowns carry developmental grooves on the facial/lingual surfaces (`spec.sideGrooves`), roots carry longitudinal concavities (`root.concave: [{ang, depth, w}]`, furcation-facing by default, the mesial groove on an upper first premolar). Section-ready. `omit` leaves layers out: a crownless root for restorative figures, or no pulp for an obturated tooth. `layers.pulp.userData.chamber` is the chamber mesh and `layers.pulp.userData.canals` maps canal names to meshes (for example `.MB2`). **Single-rooted teeth:** the builder fits the root to the cervical outline (`ra = mdC/2`, `rb = blC/2`, `start = 0.5`) and writes that back into `spec.roots`. Read root sizes from `tooth.spec` after building, not from the preset. |
| `DK.PRESETS` | The named specs: maxCentral, maxLateral, maxCanine, maxPM1, maxPM2, maxM1, maxM2, mandCentral, mandLateral, mandCanine, mandPM1, mandPM2, mandM1, mandM2. Copy and edit one for variants, e.g. `Object.assign({}, DK.PRESETS.mandM1, {roots:[…3 roots…]})` for a radix entomolaris. |
| `DK.pdl(spec, gap=0.2, top=-1.4)` | Shell around the roots (PDL), starting at `top` (set it to the bone crest y when showing bone loss). Hide its material and use it only as a section group, as in the molar example. |
| `DK.bone({width, height, depth, cortical, crest, scallop, round})` | Alveolar ridge block (rounded vertical edges `round` mm, walls tapering to a domed crest `crest` mm high), crest at local y = 0. `scallop(x,z)` displaces the top (for example the dip between teeth). `.userData.layers.{cortical, cancellous}`. Cancellous is invisible except in section and carries a trabecular cap texture (`cancellous.userData.capTexture`). |
| `DK.gingiva({width, height, depth, crest, color, capColor, scallop, around, round})` | Soft-tissue block of the same shape, top at local y = 0. `around: [{x, z, md, bl, rise?, n?}]` lists the cervical outlines (block frame, mm; `md`/`bl` = the tooth's `spec.mdC`/`spec.blC`, or the emergence diameter of an abutment) that the tissue hugs: the top rises by `rise` (default 0.8 mm) into a free gingival margin along each outline and a papilla where two meet. Inflamed gingiva: `color: 0xb98a88` (a touch redder, still muted). |

Other useful spec fields: `spec.trunk` (root trunk depth, CEJ to furcation, multi-rooted teeth only), `spec.crownL`, `spec.rootL`, `spec.md`, `spec.bl`, `spec.mdC`, `spec.blC`. `DK.util` has `{clamp, lerp, smooth, ease}`.

**Bone loss:** lower the bone block (`bone.position.y = CEJ - lossMm`) for horizontal loss. Pass the same crest to `DK.pdl(spec, gap, crestY)`. Once the crest is deeper than `spec.trunk`, the furcation is visibly open. For a vertical defect, add a second, lower bone block on one side, or make a custom block with `DK.gridGeometry`.

**Comparisons** (healthy vs disease, before vs after): build two independent sets side by side along x, about 1.5 × the tooth MD width apart, each with its own bone, gingiva and PDL. Then pass both sets' objects into the same `enableSection` groups (one plane cuts both). Label each set once with a heading-style part ("Healthy", "Periodontitis"). In the readout, give one row per measurement and both values as segments.
| `DK.crownGeometry(spec, inset?)`, `DK.rootGeometry(root, scale?)`, `DK.rootRing(root, t, th, scale, L)` | Raw geometry for custom teeth (`scale.dome` rounds a root's top, `scale.flare` funnels a canal's orifice). `inset = {side, top, reliefScale, topScale, cervical}`: mm off the walls and the top, how much of the cusp relief survives (0..1), the occlusal-third height factor, and the inset at the cervix as a fraction of `side`. You rarely need it: use `DK.prep` / `DK.prepMorph`. |
| `DK.cuspRelief(cusps, fossaDepth, grooves)` | Occlusal relief. `cusps:[{x,z,h,w}]` in normalized crown coordinates (−1..1), `grooves:[[x1,z1,x2,z2,depth]]`. |

Root spec: `{x, z, len, ra, rb, taper, apex:[dx,dz], flare:[dx,dz], start}`. `ra` is the MD radius and `rb` the BL radius at the root start. `apex` is the apical curvature offset, for example a distal curve is `[-1.4, 0]`. For single-rooted teeth the builder fits the root to the cervical outline automatically. The centre line at depth `y` is `x + apex[0]·u² + flare[0]·sin(πu)` (same for z) with `u = −y/len`. Don't re-derive it; use `DK.canalAt` / `DK.canalPath`.

Canal spec (in `spec.canals`): `{root: index, dx, dz (offset from the root centre), r (radius MD), rbk (radius BL, for ribbon canals), name ('MB1','MB2','DB','P','MB','ML','D'…), short (mm the canal stops short of the others, e.g. a merging MB2)}`. Presets with named canals: maxM1/maxM2 (MB1, MB2, DB, P), mandM1/mandM2 (MB, ML, D).

| call | returns |
|---|---|
| `DK.canalAt(spec, nameOrIndex, y)` | `{x, z, r}`: canal centre and radius at depth `y` (negative below the CEJ). For orifice markers, labels, access outlines. |
| `DK.canalPath(spec, nameOrIndex, {from, to, n})` | `[[x,y,z],…]` along the canal, by default from its start to working length (0.5 mm short of the apex). For files, gutta-percha, irrigation needles. |

## Devices and materials

| call | returns |
|---|---|
| `DK.implant({diameter, length, pitch, threadDepth, collar, connection:'internal hex'|'conical', taper, starts})` | Threaded fixture, platform at y = 0, apex at −length. |
| `DK.abutment({platform, collarHeight, postHeight, postTopDiameter, emergence})` | Engaging hex below y = 0, transmucosal collar, post. |
| `DK.screw({diameter, length, headDiameter, headHeight, pitch})` | Abutment or prosthetic screw (gold coloured). Head from y = 0 up, thread down. |
| `DK.restorationCrown(fdiOrSpec, 'zirconia'|'ceramic'|'gold', {hollow:true, axial:1.2, occlusal:1.8, margin})` | Crown shaped like that tooth's crown, margin at y = 0. By default a **hollow shell** whose inside matches `DK.prep` / `DK.prepMorph` with the same `{axial, occlusal, margin}`, so it reads correctly in section. `{hollow:false}` gives a solid crown, as on an implant abutment. |
| `DK.prep(fdiOrSpec, {axial, occlusal, margin, material:'dentin'|'composite', maxY, minY})` | Prepared stump: the crown shape inset by `axial` mm on the walls and `occlusal` mm on top (defaults 1.2 / 1.8); `margin` is the finish-line width in mm (default 0.4 × axial, a light chamfer; 1.0 for a rounded shoulder). The walls keep the crown's own convergence (a slight taper). `maxY: 2` gives a 2 mm ferrule of own dentin; `{material:'composite', minY: 2}` gives the core above it. |
| `DK.prepMorph(fdiOrSpec, {axial, occlusal, margin})` → mesh | **Crown preparation you can animate.** One closed crown mesh; `m.set(incisal, axial)` (each 0..1) eases it from the intact crown to the finished prep, tinting enamel → dentin. The axial reduction is **uniform on every wall** (labial, lingual and proximal together): show it as one step, not separate labial / lingual steps. Drive it with params: `fig.param('inc', 0, v => prep.set(v, null))`. Add it to `DK.tooth(fdi, {omit:['enamel','dentin']}).group` (root + pulp), and show the full `DK.tooth(fdi)` (with enamel) until the first cut. Section group: with dentin. See `examples/crown-prep-13.js`. |
| `DK.bur({shape:'taper'|'flat'|'wheel'|'flame'|'round', diameter, head, length})` | Diamond bur. **Tip at y = 0**, shank up +y: `position` is where it cuts, `rotation.x` tilts it about the tip. `taper` = tapered round-end (axial walls, chamfer), `flat` = flat-end taper (shoulder), `wheel` = football (lingual concavity), `flame` = finishing. |
| `DK.post({length, exposed, d0, d1, material:'fiber'|'steel'|'titanium'})` | Tapered post: top at y = 0, `length` into the root, `exposed` mm up into the core. |
| `DK.guttaPercha(spec, nameOrIndex, {from, to})` | Root filling following the canal (closed solid, section-ready). `from` = y of its coronal end (below the post). |
| `DK.threaded({length, coreRadius, threadDepth, pitch, collar, collarRadius, bodyTaper, apexTaper, starts, profile:'square'})` | Generic helical-thread geometry (files, pins, mini-screws). |
| `DK.drill({diameter, length, shank, bands})` | Surgical twist drill: flutes from y = 0 down to the tip at −length, shank above, depth bands measured from the tip. Tip at depth d below the crest: `drill.position.y = crestY − d + length`. |
| `DK.osteotomy({color})` | Implant bed as a closed cylinder (top at y = 0) for a section group after the bone, so the cut face shows the hole. `osteotomy.set(radius, depth)`; depth 0 hides it. |
| `DK.lathe([[r,y],…], segments, mat)` | Turned parts (posts, burs, handpiece heads, healing abutments). Points go bottom → top. `segments = 6` gives a hex. |
| `DK.tube([[x,y,z],…], radius, mat, {taper:t=>s, caps:true})` | Canals, nerves, vessels, archwires, files. |
| `DK.mat(name, {color, cap, opacity, roughness, metalness, bump, map})` | Presets: enamel, dentin, root, pulp, gingiva, bone, titanium, titaniumDark, gold, steel, zirconia, ceramic, nerve, artery, vein, pdl, gutta, composite, caries, rubberDam, fiber, cement. Presets carry procedural bump/albedo textures (enamel perikymata, cementum streaks, bone pores, gingival stipple) and view-dependent tints (cool translucent rims on enamel and ceramics, a warm core on enamel and gingiva). `cap` is the colour used on cut faces. |
| `DK.texture(kind)` | Tileable procedural textures (`'pores'`, `'stipple'`, `'streaks'`, `'perikymata'`, `'grain'`) for your own materials; geometry from the kit carries seamless UVs. |
| `DK.COLORS` | Palette hex values (enamelCap, dentinCap, pulpCap, corticalCap, gingivaCap, nerve, artery, vein, pdl, gutta, accent, accentDark …). The palette is deliberately restrained — muted ivories, greys and dusty tones from the brand's off-white / ink world — so a figure reads as one calm object. Keep custom colours in that family; loud reds, candy pinks or saturated oranges break the look. |
| `fig.accent`, `fig.accentHex`, `fig.dark` | The brand accent for the current theme as a linear `THREE.Color` (for a marker material) and as CSS hex, plus whether the page is in dark mode. One accent per figure: the thing the viewer must find. A second, warm emphasis (`0xB4541A`) is allowed only when a figure truly needs two. |
| `DK.mm(v)` | Formats a number as `"2.5 mm"`. |

## Topic modules

<!-- topic: arch -->
### Primary teeth, third molars, arch layouts and numbering charts
_(reserved)_
<!-- end topic: arch -->

<!-- topic: caries -->
### Caries and direct restorations
_(reserved)_
<!-- end topic: caries -->

<!-- topic: perio -->
### Periodontal disease
_(reserved)_
<!-- end topic: perio -->

<!-- topic: prosth -->
### Fixed prosthetics: bridges, veneers, inlays and onlays
_(reserved)_
<!-- end topic: prosth -->

<!-- topic: ortho -->
### Orthodontics: brackets, archwires, aligners, tooth movement
_(reserved)_
<!-- end topic: ortho -->

<!-- topic: endo -->
### Endodontic instruments and root canal treatment
Instruments have their **tip at the origin** and point up +y when straight, like `DK.bur`. They are flexible: `tool.insert(path, depth)` bends the metal part along `path` (points from a coronal reference down the canal, see `DK.canalAccessPath`) with the tip `depth` mm along it (arc length; negative = above the first point, straight), and places the handle, stop and hub on the straight extension; `tool.straight()` resets. Drive `depth` with a `fig.param`; park a tool at a large negative depth and hide it. Examples: `examples/root-canal-36.js` (procedure), `examples/endo-files.js` (sizes and tapers).

| call | returns |
|---|---|
| `DK.isoColor(size)` → `{name, hex}`, `DK.ISO_COLORS` | ISO 3630-1 handle colour: 06 pink, 08 grey, 10 purple, then white → yellow → red → blue → green → black for 15–40, 45–80, 90–140 (150 white). Hues are the real ones, toned to the palette. |
| `DK.fileDiameter(size, taper, d)` | Diameter (mm) `d` mm from the tip: D0 = size/100, plus `taper` × d. D16 = D0 + 16 × taper. Use it for every readout so numbers match the geometry. |
| `DK.endoFile({kind:'K'|'rotary'|'spreader'|'plugger', size, taper, length:21|25|31, flutes:16, stop})` → group | K-file: twisted-square flutes, ISO-coloured handle at `length`. Rotary: triangular NiTi flutes (default taper .06), Ø2.35 latch shank with the ISO ring. Spreader (pointed) and plugger (flat tip) are smooth. `stop` = rubber stop at that many mm from the tip (the working length). `g.handle`, `g.stop`, `g.body`, `g.spec {D0, D16, iso}`. |
| `DK.irrigationNeedle({gauge:30, length:25, vent:'side'|'open'})` | 27–31 G needle (OD from the gauge), closed rounded tip with a side vent 0.9 mm up, Luer hub at `length`. |
| `DK.gpCone({size, taper, length:28})` | Gutta-percha cone matching a file; `cone.insert(path, depth)` seats it. Swap it for `DK.rootFilling` once seated. |
| `DK.canalAccessPath(spec, canal, {ref:[x,y,z], short:0.5})` → `{points, wl, orifice, apex, toY}` | The path every instrument follows: straight from `ref` (the cusp tip the stop rests on) to the orifice, then down the canal to working length (`short` mm from the apex). `wl` is the working length in mm, computed from the geometry. |
| `DK.accessOutline(spec, {mb2})` → `{plane, points, shape}` | Outline of the access cavity by tooth type: triangle (base buccal, MB1–DB–P) or rhomboid (`mb2:true`) for maxillary molars, trapezoid wider mesially for mandibular molars, oval (bucco-lingual) for premolars, a lingual triangle (base incisal) or oval for anterior teeth. |
| `DK.accessCavity(fdiOrSpec, {material:'void'|'composite', lift, bottomScale, floorY, k})` → mesh | The removable volume: a prism from the real crown surface (raycast, `lift` mm proud so it reads as the opening) to the chamber. `m.set(k)` deepens it 0 → 1 as the bur works. Put it in a section group **after the pulp** with the same dark `color` as the chamber void; build a second one with `material:'composite'` for the coronal restoration (a later group). `m.opening`, `m.floor`, `m.outline`. |
| `DK.canalShape(spec, canal, {size, taper, short, from, color})` → mesh | The canal as a closed solid from the orifice to working length; `m.set(k)` morphs it from the untouched canal (0) to a continuously tapering preparation of `size`/`taper` at the apex (1). `m.radiusAt(y)`, `m.wlY`. Section group after the pulp. |
| `DK.rootFilling(spec, canal, {size, taper, from})` → mesh | Gutta-percha filling the finished shape exactly (same as `DK.canalShape` at k = 1 in `gutta`). Group after the canal space. `DK.guttaPercha` remains for an untouched canal (post-and-core figures). |
| `DK.periapicalLesion({radius, color, seed})` → mesh | Apical periodontitis: an irregular closed blob to centre on an apex (a section group after the cancellous bone, before the tooth). `m.set(k)` scales it; animate k → 0 for healing. Dark enough to read as a radiolucency in the X-ray state. |
| `DK.capColor(fig.section, groupIndex, hex)` | Recolour a cut face later: a pulp going necrotic, a canal filling with irrigant. |

Pitfalls: the chamber and the canals exist twice (pulp, then a dark "void" copy); keep exactly one visible, and hide the void canals when the fillings appear or the filling sits inside a dark shell in X-ray. The kit's crowns carry cusp relief above `crownL`, so a working length measured from a cusp tip comes out ~1 mm longer than Wheeler's tooth length. In a mesio-distal cut, place the cut through the canal you treat (`offset` = the canal's z) and say which canal in the subtitle.
<!-- end topic: endo -->

## Pitfalls
- Section groups must be **closed solids**. Tubes need `caps` unless they end flush at the bone face (implant example). Canals that should show red in a cut need their own group after dentin.
- Do not put the same mesh in two section groups.
- Keep parts that should not be cut (an implant inside sectioned bone) out of the section groups. They then stand in front of the cut face, which reads well.
- Anything with negative scale (mirrored maxillary teeth) still works with sections.
- **Section group order for restorations:** tissue around first (bone, gingiva), then the restoration from outside in: crown, then own tooth (root and ferrule), then core, then root filling, then post. A later group paints over an earlier one wherever they overlap on the cut.
- **Cut faces aren't hoverable.** Hover only reaches surfaces in front of the cut. For something that exists only on the cut (an orifice), add a small marker mesh as its own `fig.part`.
- **Colours are sRGB hex; convert them.** `DK.mat` and section caps do it for you. For any material you create yourself, pass `DK.color(0x0E3A5C)`, not the raw hex: three r128 treats raw hex as linear and the colour comes out washed out.
- **Overlay markers and outlines** that must keep an exact colour (orifices, access outlines, arrows): use `new THREE.MeshBasicMaterial({ color: DK.color(hex), toneMapped: false })`. The lit presets are tone-mapped and wash out. Draw outlines as flat ribbons (see `examples/mb2-16.js`): `THREE.Line` is always 1 px. Lift markers ~0.1 mm above a cut face, which is drawn with a polygon offset and would otherwise cover them.
- **Labels dim when their anchor is behind another part** (anchor inside a neighbouring mesh, e.g. a pulp label inside the enamel of another part). Move the anchor to the surface, or pass `dim:false`.
- **Procedures:** a tool parked out of view should be hidden (`visible = false`) as well as moved, or it can stretch the camera fit of a figure without regular parts.
- Maxillary single-tooth figures: crown up (extracted-tooth / model convention, the textbook default), also with bone and gingiva around it; mirror into the jaw only when the jaw is the point. Say which in the subtitle.
