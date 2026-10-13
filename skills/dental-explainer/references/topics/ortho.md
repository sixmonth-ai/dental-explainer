# Orthodontics: brackets, archwires, aligners, tooth movement

Facts: `references/dental-facts.md` §19. Read it before planning.

## Building a figure

Read dental-facts.md §9 and §19 first (slot and wire sizes are in **inches**, forces in grams, the PDL must be exaggerated to be seen).
- **Fixed appliance** (brackets, tubes, ligatures, archwire, power chain): copy `examples/braces-upper-arch.js`. Teeth from `DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16…26] })` (crown-down in the mouth, left teeth mirrored), a thin scalloped ridge swept along `arch.slots`, `DK.bracket` at MBT-style heights (§19) with `DK.ligature`, `DK.molarTube` on the first molars, `DK.archwire` through each part's `wirePoint()`; parts explode along each tooth's outward normal, the wire forward. Say the slot and wire size in the subtitle; call heights "MBT-style", never universal. A single tooth with a bracket: build it in the tooth frame and label slot, wings, base.
- **Tooth movement** (tipping vs bodily, pressure and tension sides, remodelling): copy `examples/tooth-movement-11.js`. A procedure of 4 steps (force → tipping → bodily → bone remodels) on a labio-lingual cut, the socket (`DK.pdl`) fixed while `DK.moveTooth` moves the tooth about `DK.centreOfResistance`; accent only on the pressure side. Subtitle must say "PDL width exaggerated".
- **Aligners**: copy `examples/aligner-upper-arch.js`. One `DK.alignerArch` shell over the arch (0.5 mm, cast from a spine through the crowns), `DK.attachment` with the bevel that matches the movement (gingival bevel = extrusion); `DK.aligner` for a single tooth. The cut through an incisor is the teaching shot. Never show an aligner without attachments when the movement needs them.
- Watch for: brackets "at the gum line"; rectangular steel as a first wire; a single force drawn as bodily movement; bone "pushed aside"; slot sizes quoted in mm.

## Kit API

Appliance parts are built in the **tooth frame** (CEJ y = 0, +x mesial, +z labial; gingival = −y) and seat exactly on the crown surface of the preset, so they follow the tooth's transform (mirroring, arch rotation). Inch sizes are converted for you.

| call | returns |
|---|---|
| `DK.SLOTS['0.022' \| '0.018']` | `{w, d, name}`: slot height and depth in mm (0.559 × 0.711; 0.457 × 0.635). |
| `DK.wireSize('0.014' \| '0.019x0.025' \| {h, d})` | `{h, d, round, name}` in mm: `h` is the occluso-gingival height, `d` the labio-lingual depth. |
| `DK.crownSurface(spec, side=1).at(x, y)` | `{p:[x,y,z], n:[nx,ny,nz]}` on the facial (`side` −1: lingual) crown surface at MD offset `x` and height `y` above the CEJ. |
| `DK.bracket(fdiOrSpec, {slot:'0.022', height, x, width, tall:3, pad:0.3, material:'steel'\|'ceramic'})` → group | Twin bracket on a bonding base that hugs the crown. **The group's origin is the slot centre**; `height` is the slot centre from the incisal edge / cusp tip (default mid-crown = Andrews' FA point; MBT-style values in dental-facts §19). `grp.wirePoint(wireDepthMm)` → the wire's centre line point in the **tooth frame** (wire bottomed in the slot). `userData: {slot, width, tall, floor, face, normal, height}` (floor / face are z offsets from the slot centre). |
| `DK.molarTube(fdiOrSpec, {slot, height, length:4, hook:true, band:0})` → group | Buccal tube with gingival hook, same frame and `wirePoint()` as a bracket; `band: 0.15` seats it on a `DK.band` instead of a pad. |
| `DK.band(fdiOrSpec, {thickness:0.15, bottom:0.8, top})` → mesh | Steel band around the crown between the two heights. |
| `DK.ligature(bracket, {r:0.22, color})` → mesh | Elastomeric O-ring around the four tie wings, positioned like the bracket (add it to the same parent). |
| `DK.powerChain([brackets], {r, color})` → group | Rings joined by links, built in **world** coordinates from the brackets' current world transforms (place them first). |
| `DK.archwire([[x,y,z]…], {size:'0.019x0.025', material:'steel'\|'niti'\|'tma', overhang:1.5, up:[0,1,0]})` → mesh | Round or rectangular wire swept through the points (any frame; use each bracket's `wirePoint()` mapped to the world). Closed solid; `userData.curve` is the CatmullRom. |
| `DK.attachment(fdiOrSpec, {x, y, w:3, h:2, d:1, bevel:'gingival'\|'occlusal'\|'mesial'\|'distal'\|null, side:1})` → mesh | Composite aligner attachment on the facial surface; `bevel` names the side the thick ledge faces. `userData.spec` feeds `DK.aligner`'s `bumps`. |
| `DK.aligner(fdiOrSpec, {thickness:0.5, gap:0.05, bumps:[att.userData.spec…], opacity})` → mesh | Translucent closed shell over one crown, trimmed at the CEJ, bulging over the attachments. One shell per tooth; group them. Section-ready (`kind:'plain'`). |
| `DK.alignerArch(spineCurve, [enamel meshes, attachments], {thickness:0.5, gap, segments:150, around:44, sweep, trimY:-0.9, down:[0,-1,0], smooth:2})` → mesh | **One continuous aligner over a whole arch**, in world coordinates: rays from a spine curve through the middle of the crowns are cast around the arch against the crown meshes; the shell lies `thickness` outside the farthest hit (attachments included), bridges the contacts and is trimmed where it reaches `trimY` (the gingival margin). ~1–4 s to build; prefer it to per-tooth `DK.aligner` shells for an arch. `down` is the direction of the incisal edges (`[0,1,0]` for crowns-up teeth, then `trimY` is the margin height). |
| `DK.sweepGeometry(curve, (s, t, {P, U, N}) => [a, b], …)` | The profile callback also receives the position `t` along the curve and the frame, so a sweep can vary along the arch: the arch examples drop the ridge's lower face into a free gingival margin around each neck and raise eminences over the roots. |
| `DK.centreOfResistance(spec, crestY, fraction=0.4)` → y | Centre of resistance of a single-rooted tooth: `fraction` of the root below the crest. |
| `DK.moveTooth(group, {tip, pivotY, shift})` | Rotates the tooth `tip` rad about the x axis through `(0, pivotY, 0)` (negative tips the crown lingually) and shifts it `shift` mm along z. Keep the socket (`DK.pdl(spec, gap, crest)`) fixed in the world, so a cut shows the PDL compressed on one side and widened on the other; translate the socket afterwards to show remodelling. |
| `DK.ribbon(points, width, normal, {color, alpha, material, name})`, `DK.arrow({from, to, width, head, normal, color, alpha, material})` | Flat overlay markers (zones along a root, a force arrow) with exact colours; put them 0.1–0.2 mm in front of a cut face. |
| `DK.sweepGeometry(curve, profile, {segments, radial, closed, up})`, `DK.roundedRect(hw, hd, r)`, `DK.slabGeometry(nu, nv, fn, wrapU)` | Building blocks: a profile swept along a THREE curve (a gingival ridge along an arch: `DK.roundedRect(3, 5.6, 1.6)`), and a closed slab between an inner and an outer grid. |

Pitfalls:
- A regular `fig.part` resets its object's position every frame, so a tooth moved by `DK.moveTooth` must sit inside a holder group that is the part (see `examples/tooth-movement-11.js`).
- To explode brackets, ligatures or aligner shells separately, build them in the tooth frame, then `obj.updateMatrix(); obj.applyMatrix4(tooth.group.matrixWorld)` and register them as world parts (the braces and aligner examples do this).
- Per-tooth `DK.aligner` shells overlap at the contacts (doubled edges); use `DK.alignerArch` for an arch. With `DK.aligner`, pass the attachments' `userData.spec` as `bumps` or the shell cuts through them.
- Arch examples: place the teeth with `DK.arch` (register `arch.group` as the regular part, teeth `inPlace`), then build the appliance parts in each tooth's frame and move them into the world with `tooth.group.matrixWorld` (left teeth are mirrored, which the decomposed scale carries). The gingival ridge is a sweep along `arch.slots[].c` whose cuff function uses `tooth.group.worldToLocal`; `view.margin` ≈ 0.6 keeps 16–26 in frame with some air, and the hero view is a three-quarter shot from slightly below (`theta` 0.45, `phi` 1.66) for a maxillary arch.
- Inside the kit, keep topic helpers uniquely named: function declarations are hoisted across topic blocks, so two `function sweepGeometry` definitions silently replace each other (the ortho sweep is `orthoSweep`, exported as `DK.sweepGeometry`).
- Crowns-only teeth (`DK.tooth(fdi, {omit:['dentin','pulp','root']})`) are hollow in section; for a cut through an arch keep full teeth and shorten `spec.roots[].len` so the roots stay inside the ridge.
