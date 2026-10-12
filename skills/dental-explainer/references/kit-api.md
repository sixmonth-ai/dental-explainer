# dentkit.js API

Global `DK`, built on three.js r128 (global `THREE`). Units are **millimetres**.

**Tooth frame** (every tooth and preset): `y` up = coronal, **CEJ at y = 0**, crown above, roots below; **+x = mesial**, **+z = buccal/labial**. Mandibular teeth sit naturally (crown up). For maxillary teeth in the mouth, set `group.scale.y = -1` (mirror; the renderer handles the flipped winding).

## Figure

```js
const fig = DK.figure({ title, subtitle, view: { theta, phi }, footer });
```
- `view.theta` (around y, 0 = camera on +z / buccal side), `view.phi` (from top; 1.57 = level). Leave `dist` out: the camera auto-fits the assembled state and follows the explode. `view.margin` (default 0.85) tightens (<0.85) or loosens (>0.85) that fit. Image and video frames fit 15% looser to leave room for the title and caption.
- **Mode** comes from `build.py --mode` (`interactive` | `image` | `video`; also `?mode=` in the URL). The same script serves all three: interactive is a page with a control panel; image and video are a framed stage (`--aspect 16:9 | 1:1 | 4:5 | 9:16`) with the title on top, captions bottom-left and the footer inside the frame. `fig.mode` reads it.
- `autoRotate: true` is opt-in and off by default.

| call | does |
|---|---|
| `fig.part(obj, {name, sub, info, anchor:[x,y,z] or (e, section)=>[x,y,z], explode:[dx,dy,dz], labelOffset:[px,py], label:true, when:(e, section)=>bool, inPlace:false})` → part | Adds `obj` to the scene as a hoverable part with a leader-line label. `anchor` is in **`obj`'s own local frame**: for a marker mesh you position yourself, the anchor is `[0,0,0]`, not the marker's coordinates. `explode` is the displacement at explode = 1. `inPlace:true` annotates a sub-object already in the scene (for example `tooth.layers.pulp`), so hover names the layer and nothing moves. `when` hides the label unless it returns true. Function anchors and `when` are evaluated every frame and always receive a section object (`{enabled:false, offset:0}` before `enableSection`). `part.alpha` is the label's current opacity (0..1): use it to fade a marker with its label. `part.setAnchor(a)` changes the anchor later. `dim:false` keeps the label at full strength even when its anchor is hidden behind another part. |
| `fig.enableSection(removeToward, groups)` | Clipping plane with **solid, flat-coloured cut faces**. `removeToward` is the direction of the half that is cut away, for example `[0,0,1]` removes the buccal half so the camera on +z sees the cut. `groups` is ordered **outermost → innermost**: `[{objects:[…], color, texture?}]`. Each group's objects form one solid, and later groups paint over earlier ones. |
| `fig.standardControls({explode, explodeLabel, section:{label, on, range:[a,b], offset}, labels})` → `{explode, section, cut, labels, reset}` | Adds the panel controls: explode slider (`explode:false` to omit), cut toggle + slider, and a reset button (always last). `labels:true` adds a Labels toggle (off by default). `offset` and the range are positions along `removeToward` (mm). `fig.section.set(on, pos)` from your own code keeps the toggle and slider in sync. |
| `fig.view(label, state, dur?)` | A panel button that eases the figure to `state` (any story keys, below) in `dur` s (default 0.9). Use for the 1–2 views the point depends on. |
| `fig.xrayToggle([objs], 'X-ray', false)` | A panel button that fades context tissue to see-through. `fig.xray([objs], on)` registers objects without a button (then use `xray` in story beats or views). `fig.xrayOn` reads the state. |
| `fig.slider / fig.toggle / fig.button` | Custom panel controls: `(label, min, max, step, value, onInput)`, `(label, on, onChange)`, `(label, onClick)`. |
| `fig.setReadout([{k, v, cls:'ok'|'warn'}])` | A quiet row of numbers under the stage (interactive only). Use it only when a number is the point. `v` may be an array of segments `[{v:'healthy 1.5 mm ✓', cls:'ok'}, {v:'perio 5.0 mm ⚠', cls:'warn'}]`. **Compute every value from the same constants that place the geometry.** |
| `fig.story([beats])` | The motion. Each beat: `{dur, hold, theta, phi, zoom, explode, section, offset, xray, labels, caption}`. Numbers ease (cubic in-out) over `dur` seconds (default 1.2), then hold for `hold` (default 0.6). Unset keys carry over from the previous beat; the first beat starts from the figure's home view. `section:true` turns the cut on at `offset` in place; later beats can move `offset`. `xray` is 0..1 (or a boolean). `labels` is a list of part names to show (`'all'` for every label, `[]` for none). `caption` is one line, shown only in video. Interactive pages play the story once on load (any touch stops it); video loops it; image shows its last frame. |
| `fig.goTo(state, dur)` | Ease from the current state to `state` (story keys). |
| `fig.onFrame((dt, e) => …)` | Per-frame hook. `e` is the eased explode amount 0..1. Update the readout only when a value changes. |
| `fig.section` | `{enabled, offset, plane, set(on, pos)}` after `enableSection`. Use `fig.section.plane` as `material.clippingPlanes = [plane]` for extra non-solid meshes that should be cut too. |
| `fig.orbit` | `{theta, phi, dist, zoom, target, auto}`. Prefer `fig.view` / `fig.goTo` over setting it directly (direct sets jump instead of easing). |
| `fig.exportPNG(scale)`, `fig.savePNG()`, `fig.recordVideo()`, `fig.seek(t)`, `fig.duration` | Export (used by the page's Download buttons and by `render.py`). `seek(t)` freezes the live loop and renders the story at time `t`, deterministically. |
| `fig.setState({home, explode, theta, phi, dist, section, offset})` | Jump to a state instantly (used by `check.py`). With auto-fit, `dist` is a zoom factor (1 = fitted). |
| `fig.start()` | Call last. |

## Anatomy builders

| call | returns |
|---|---|
| `DK.toothPreset(fdi)` | Spec for permanent FDI 11–48: Wheeler crown and root lengths, MD/BL widths at the crown and cervix, cusps and grooves, roots, canals. `spec.maxillary`, `spec.approx` (true for third molars, which are approximated by second molars). |
| `DK.tooth(fdiOrSpec, {omit:['enamel','dentin','pulp']})` | `{group, layers:{enamel, dentin, root, pulp}, spec, mats}`. Enamel crown shell, dentin core, root(s) with cementum surface, pulp chamber and canals. Section-ready. `omit` leaves layers out: a crownless root for restorative figures, or no pulp for an obturated tooth. `layers.pulp.userData.chamber` is the chamber mesh and `layers.pulp.userData.canals` maps canal names to meshes (for example `.MB2`). **Single-rooted teeth:** the builder fits the root to the cervical outline (`ra = mdC/2`, `rb = blC/2`, `start = 0.5`) and writes that back into `spec.roots`. Read root sizes from `tooth.spec` after building, not from the preset. |
| `DK.PRESETS` | The named specs: maxCentral, maxLateral, maxCanine, maxPM1, maxPM2, maxM1, maxM2, mandCentral, mandLateral, mandCanine, mandPM1, mandPM2, mandM1, mandM2. Copy and edit one for variants, e.g. `Object.assign({}, DK.PRESETS.mandM1, {roots:[…3 roots…]})` for a radix entomolaris. |
| `DK.pdl(spec, gap=0.2, top=-1.4)` | Shell around the roots (PDL), starting at `top` (set it to the bone crest y when showing bone loss). Hide its material and use it only as a section group, as in the molar example. |
| `DK.bone({width, height, depth, cortical, crest})` | Alveolar block, crest at local y = 0. `.userData.layers.{cortical, cancellous}`. Cancellous is invisible except in section and carries a trabecular cap texture (`cancellous.userData.capTexture`). |
| `DK.gingiva({width, height, depth, crest, color, capColor})` | Soft-tissue block, top at local y = 0. Inflamed gingiva: `color: 0xd0606f`. |

Other useful spec fields: `spec.trunk` (root trunk depth, CEJ to furcation, multi-rooted teeth only), `spec.crownL`, `spec.rootL`, `spec.md`, `spec.bl`, `spec.mdC`, `spec.blC`. `DK.util` has `{clamp, lerp, smooth, ease}`.

**Bone loss:** lower the bone block (`bone.position.y = CEJ - lossMm`) for horizontal loss. Pass the same crest to `DK.pdl(spec, gap, crestY)`. Once the crest is deeper than `spec.trunk`, the furcation is visibly open. For a vertical defect, add a second, lower bone block on one side, or make a custom block with `DK.gridGeometry`.

**Comparisons** (healthy vs disease, before vs after): build two independent sets side by side along x, about 1.5 × the tooth MD width apart, each with its own bone, gingiva and PDL. Then pass both sets' objects into the same `enableSection` groups (one plane cuts both). Label each set once with a heading-style part ("Healthy", "Periodontitis"). In the readout, give one row per measurement and both values as segments.
| `DK.crownGeometry(spec)`, `DK.rootGeometry(root)` | Raw geometry for custom teeth. |
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
| `DK.restorationCrown(fdiOrSpec, 'zirconia'|'ceramic'|'gold', {hollow:true, axial:1.2, occlusal:1.8})` | Crown shaped like that tooth's crown, margin at y = 0. By default a **hollow shell** whose inside matches `DK.prep` with the same reductions, so it reads correctly in section. `{hollow:false}` gives a solid crown, as on an implant abutment. |
| `DK.prep(fdiOrSpec, {axial, occlusal, material:'dentin'|'composite', maxY, minY})` | Prepared stump. `maxY: 2` gives a 2 mm ferrule of own dentin; `{material:'composite', minY: 2}` gives the core above it. |
| `DK.post({length, exposed, d0, d1, material:'fiber'|'steel'|'titanium'})` | Tapered post: top at y = 0, `length` into the root, `exposed` mm up into the core. |
| `DK.guttaPercha(spec, nameOrIndex, {from, to})` | Root filling following the canal (closed solid, section-ready). `from` = y of its coronal end (below the post). |
| `DK.threaded({length, coreRadius, threadDepth, pitch, collar, collarRadius, bodyTaper, apexTaper, starts, profile:'square'})` | Generic helical-thread geometry (files, pins, mini-screws). |
| `DK.lathe([[r,y],…], segments, mat)` | Turned parts (posts, burs, handpiece heads, healing abutments). Points go bottom → top. `segments = 6` gives a hex. |
| `DK.tube([[x,y,z],…], radius, mat, {taper:t=>s, caps:true})` | Canals, nerves, vessels, archwires, files. |
| `DK.mat(name, {color, cap, opacity, roughness, metalness})` | Presets: enamel, dentin, root, pulp, gingiva, bone, titanium, titaniumDark, gold, steel, zirconia, ceramic, nerve, artery, vein, pdl, gutta, composite, caries, rubberDam. `cap` is the colour used on cut faces. |
| `DK.COLORS` | Palette hex values (enamelCap, dentinCap, pulpCap, corticalCap, gingivaCap, nerve, artery, vein, pdl, gutta …). |
| `DK.mm(v)` | Formats a number as `"2.5 mm"`. |

## Pitfalls
- Section groups must be **closed solids**. Tubes need `caps` unless they end flush at the bone face (implant example). Canals that should show red in a cut need their own group after dentin.
- Do not put the same mesh in two section groups.
- Keep parts that should not be cut (an implant inside sectioned bone) out of the section groups. They then stand in front of the cut face, which reads well.
- Anything with negative scale (mirrored maxillary teeth) still works with sections.
- **Section group order for restorations:** tissue around first (bone, gingiva), then the restoration from outside in: crown, then own tooth (root and ferrule), then core, then root filling, then post. A later group paints over an earlier one wherever they overlap on the cut.
- **Cut faces aren't hoverable.** Hover only reaches surfaces in front of the cut. For something that exists only on the cut (an orifice), add a small marker mesh as its own `fig.part`.
- **Overlay markers and outlines** that must keep an exact colour (orifices, access outlines, arrows): use `new THREE.MeshBasicMaterial({ color, toneMapped: false })`. The lit presets are tone-mapped and wash out. Draw outlines as flat ribbons (see `examples/mb2-16.js`): `THREE.Line` is always 1 px. Lift markers ~0.1 mm above a cut face, which is drawn with a polygon offset and would otherwise cover them.
- Maxillary single-tooth figures: crown up (extracted-tooth convention, the textbook default) unless the figure shows the tooth in the jaw; say which in the subtitle.
