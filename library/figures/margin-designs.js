// Comparison: four crown finish lines (margin designs) on the same schematic premolar-sized prepared tooth, side by side in bone and gum and cut by one bucco-lingual section through their axes. Frame: y up, finish line at y = 0, the four teeth along x, +z buccal; mm. Each tooth is a turned (lathe) solid: a schematic, not a specific tooth.
// poster: end
// Chamfer about 0.5 mm with zirconia (dental-facts.md §14: monolithic zirconia, light chamfer 0.3 to 0.5 mm); rounded shoulder about
// 1.0 mm with glass-ceramic (§14, ~1.0 mm); knife edge with cast metal (and monolithic zirconia: "feather edge possible", §14); bevelled
// shoulder with metal-ceramic, a metal collar over the bevel (§14 gives the facial shoulder for metal-ceramic; the bevel, about 0.5 mm
// at 45°, is standard teaching from Shillingburg, not in dental-facts.md, so it is "about"). Axial reduction about 1.2 mm, occlusal
// about 1.8 mm, walls with a slight taper.
const R0 = 3.5;                     // radius at the finish line (cervix of a premolar, ~7 mm wide)
const AX = 1.2, OCC = 1.8;          // axial and occlusal reduction, mm (§14, typical)
const TOP = 7.8, ROOT = 13;         // crown height above the finish line, root length
const TAPER = Math.tan(6 * Math.PI / 180);   // ~6° per wall (§14: 10 to 20° total convergence recommended)
const GAP = 8.8;
const { lerp } = DK.util;

const fig = DK.figure({
  fov: 26,
  title: 'Crown margin designs',
  subtitle: 'Schematic prepared tooth, cut cheek to tongue. Typical widths.',
  view: { theta: 0.5, phi: 1.3, margin: 0.8 }
});

// --- the unprepared outer contour (crown above the finish line, root below), [r, y]
const crownOuter = n => { const P = []; for (let i = 0; i <= n; i++) { const t = i / n, y = TOP * t;
  const r = t < 0.97 ? R0 + 0.45 * Math.sin(Math.min(1, t / 0.35) * Math.PI / 2) - 0.75 * Math.pow(Math.max(0, (t - 0.35) / 0.65), 2) : 0;
  P.push([Math.max(0, t >= 1 ? 0 : r * (t > 0.85 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.85) / 0.15, 2))) : 1)), y]); } return P; };
const rootOuter = n => { const P = []; for (let i = 0; i <= n; i++) { const t = i / n, y = -ROOT * (1 - t); P.push([Math.max(0.0, R0 * Math.pow(t, 0.45) * (1 - 0.15 * (1 - t))), y]); } return P; };
const arc = (cx, cy, r, a0, a1, n) => { const P = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return P; };

// --- the finish line + axial wall + occlusal of each prep, from the root surface at the margin up to the axis, [r, y]
const H = TOP - OCC;                                      // prep height
function wallFrom(rBase, yBase) {                         // tapered axial wall up to a rounded top
  const P = [], top = H, rTop = rBase - (top - 0.8 - yBase) * TAPER;
  for (let i = 1; i <= 8; i++) { const y = lerp(yBase, top - 0.8, i / 8); P.push([rBase - (y - yBase) * TAPER, y]); }
  arc(rTop - 0.8, top - 0.8, 0.8, 0, Math.PI / 2, 8).slice(1).forEach(p => P.push(p));
  P.push([0, top]); return P;
}
const X = i => (i - 1.5) * GAP;
const DESIGNS = [
  { key: 'chamfer', name: 'Chamfer', sub: 'about 0.5 mm, zirconia or metal', w: 0.5, mat: 'zirconia', y0: 0,
    finish: () => arc(R0, 0.5, 0.5, -Math.PI / 2, -Math.PI, 10).concat(wallFrom(R0 - 0.5 - 0.0, 0.5)),
    info: 'A curved finish line about 0.3 to 0.5 mm wide for monolithic zirconia (also cast metal, and the lingual of metal-ceramic). A clear line with little tooth removed.' },
  { key: 'shoulder', name: 'Shoulder', sub: 'about 1.0 mm, all-ceramic', w: 1.0, mat: 'ceramic', y0: 0,
    finish: () => [[R0, 0], [R0 - 1.0 + 0.35, 0]].concat(arc(R0 - 1.0 + 0.35, 0.35, 0.35, -Math.PI / 2, -Math.PI, 6).slice(1), wallFrom(R0 - 1.0, 0.35)),
    info: 'A flat ledge about 1 mm wide with a rounded inner angle. It gives glass-ceramic crowns the bulk they need at the edge to resist fracture.' },
  { key: 'knife', name: 'Knife edge', sub: 'least removal, metal', w: 0, mat: 'gold', y0: 0,
    finish: () => { const P = [[R0, 0]]; for (let i = 1; i <= 6; i++) { const t = i / 6; P.push([R0 - AX * Math.sin(t * Math.PI / 2), 2.4 * t]); } return P.concat(wallFrom(R0 - AX, 2.4)); },
    info: 'The axial wall tapers out to nothing at the margin. Least tooth removed, but the edge of the crown is very thin and the finish line hard to see: used for cast metal, and possible with monolithic zirconia.' },
  { key: 'bevel', name: 'Bevelled shoulder', sub: 'metal-ceramic, metal collar', w: 1.2, mat: 'metal-ceramic', y0: -0.5,
    finish: () => [[R0, -0.5], [R0 - 0.5, 0], [R0 - 1.2 + 0.35, 0]].concat(arc(R0 - 1.2 + 0.35, 0.35, 0.35, -Math.PI / 2, -Math.PI, 6).slice(1), wallFrom(R0 - 1.2, 0.35)),
    info: 'A shoulder whose outer edge is bevelled about 45°, so a thin metal collar covers the bevel and seals the margin. Used with metal-ceramic crowns; the bevel shows as a metal line.' }
];

// --- context: one bone block and one gum band across the row; margins just above the gum (supragingival)
const N = DESIGNS.length, CREST = -2.4, GUM_TOP = -0.35;
const SLAB = -7.8;                  // the block is cut flat here, like a specimen; roots are clipped at the same level
const bone = DK.bone({ width: GAP * N + 1, height: CREST - SLAB, depth: 11, cortical: 1.0, crest: 1.2 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: GAP * N + 1.6, height: 3.0, depth: 11.8, crest: 1.1, around: DESIGNS.map((d, i) => ({ x: X(i), z: 0, md: 2 * R0, bl: 2 * R0, rise: 0.5 })) });
gum.position.y = GUM_TOP - 0.5;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The finish lines sit at or just above the gum here; for esthetics they can go up to about 0.5 mm under it.' });

const SEG = 72;
const mats = { zirconia: DK.mat('zirconia'), ceramic: DK.mat('ceramic'), gold: DK.mat('gold'), metal: DK.mat('steel', { color: 0xaeb0ac, roughness: 0.38, metalness: 0.7 }) };
const groups = { tooth: [], pulp: [], ceramic: [], zirconia: [], metal: [], gold: [] };
const crowns = [];
DESIGNS.forEach((d, i) => {
  const g = new THREE.Group(); g.position.x = X(i); g.scale.z = 1.08;   // slightly oval, like a premolar cervix
  // prepared tooth: root surface up to the finish line, the finish line, wall, top
  const fin = d.finish(), root = rootOuter(24).filter(p => p[1] < fin[0][1] - 0.01);
  const toothProfile = root.concat(fin);
  const tooth = DK.lathe(toothProfile, SEG, DK.mat('dentin', { cap: DK.COLORS.dentinCap })); g.add(tooth);
  const pulp = DK.lathe([[0, -ROOT + 0.8], [0.25, -ROOT + 1.2], [0.5, -6], [0.95, 0], [1.2, 2.2], [1.0, 3.3], [0, 3.6]], SEG, DK.mat('pulp')); g.add(pulp);
  groups.tooth.push(tooth); groups.pulp.push(pulp);
  // crown: outer = the original contour from the finish line up; inner = the prep surface (finish line inward)
  const outer = crownOuter(40).filter(p => p[1] > fin[0][1] + 0.02);
  const inner = fin.slice().reverse();                                   // axis top → finish line
  const shell = [[fin[0][0], fin[0][1]]].concat(outer, inner);
  const crownGrp = new THREE.Group(); crownGrp.position.x = X(i); crownGrp.scale.z = 1.08;   // a regular part of its own (it explodes)
  if (d.mat === 'metal-ceramic') {
    const COP = 0.4;                                                       // metal coping thickness over the prep, collar at the margin
    const copOuter = fin.map((p, k) => {                                      // the prep surface pushed out along its normal by COP
      const a = fin[Math.max(0, k - 1)], b = fin[Math.min(fin.length - 1, k + 1)], dr = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dr, dy) || 1;
      return [Math.max(0, p[0] + dy / L * COP), p[1] - dr / L * COP];
    });
    copOuter[copOuter.length - 1][0] = 0;
    const collarTop = 1.0;                                                  // metal shows up to ~1 mm above the finish line
    const metalProfile = [[R0, -0.5], [R0 + 0.02, collarTop * 0.5], [R0 - 0.1, collarTop], [R0 - 1.2 + COP + 0.1, collarTop]].concat(
      copOuter.filter(p => p[1] > collarTop + 0.05)).concat(inner);
    const metal = DK.lathe(metalProfile, SEG, mats.metal); crownGrp.add(metal); groups.metal.push(metal);
    const porcOuter = outer.filter(p => p[1] > collarTop);
    const porcInner = copOuter.filter(p => p[1] > collarTop + 0.05).reverse();
    const porc = DK.lathe([[R0 - 0.1, collarTop]].concat(porcOuter, porcInner, [[R0 - 1.2 + COP + 0.1, collarTop], [R0 - 0.1, collarTop]]), SEG, mats.ceramic);
    crownGrp.add(porc); groups.ceramic.push(porc);
  } else {
    const m = DK.lathe(shell.concat([[fin[0][0], fin[0][1]]]), SEG, mats[d.mat]); crownGrp.add(m); groups[d.mat].push(m);
  }
  crowns.push(crownGrp);
  fig.world.add(g);
  d.g = g; d.crown = crownGrp; d.tooth = tooth;
});

// --- parts: one heading label per design (anchored at its finish line on the cut), the crowns lift on explode
DESIGNS.forEach((d, i) => {
  fig.part(d.g, { inPlace: true, name: d.name, sub: d.sub, anchor: [-(R0 - 0.2), d.y0 + 0.15, 0.05], labelOffset: [-40, 70], dim: false, info: d.info });
  fig.part(d.crown, { name: d.name + ' crown', label: false, explode: [0, 7, 0], info: d.info });
});
const frame = new THREE.Mesh(new THREE.BoxGeometry(GAP * N - 2, 15, 8), new THREE.MeshBasicMaterial({ visible: false })); frame.position.y = 1.6;
fig.part(frame, { name: 'frame', label: false });

// --- section: bucco-lingual through the four axes (the buccal half removed, camera on +z)
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: groups.tooth, color: DK.COLORS.dentinCap, kind: 'dentin' },
  { objects: groups.pulp, color: DK.COLORS.pulpCap },
  { objects: groups.zirconia, color: DK.COLORS.zirconiaCap },
  { objects: groups.ceramic, color: DK.COLORS.ceramicCap },
  { objects: groups.metal, color: 0x8e908c, kind: 'metal' },
  { objects: groups.gold, color: 0xb48a2c, kind: 'metal' }
]);
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SLAB);   // keep y ≥ SLAB
[...groups.tooth, ...groups.pulp].forEach(m => m.traverse(o => { if (o.isMesh && o.material.clippingPlanes) o.material.clippingPlanes = o.material.clippingPlanes.concat([FLOOR]); }));
fig.standardControls({ explode: true, explodeLabel: 'Lift crowns', section: { label: 'Cut', range: [-4, 4], offset: 0 } });
const ZF = window.innerWidth < window.innerHeight ? 1.7 : 1;   // portrait phone: pull back so all four fit
const FRONT = { theta: 0, phi: 1.5 };
fig.view('Margins', Object.assign({ section: true, offset: 0, explode: 0, zoom: 0.7 * ZF, focus: [0, 1.0, 0], labels: 'all' }, FRONT));

// --- story: four crowned teeth → crowns lift: four finish lines → the cut sweeps through → crowns seat: what each edge looks like
const ALL = DESIGNS.map(d => d.name);
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.3, zoom: 1.0 * ZF, section: false, explode: 0, labels: [] },
  { dur: 2.4, hold: 2.2, theta: 0.35, phi: 1.1, explode: 1, zoom: 0.95 * ZF, labels: ALL },
  { fov: 26, dur: 2.0, hold: 0.1, ...FRONT, zoom: 0.9 * ZF, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.2, hold: 1.4, offset: 0, labels: ALL },
  { dur: 2.0, hold: 2.0, explode: 0, labels: ALL },
  { dur: 2.0, hold: 2.8, zoom: 0.8 * ZF, focus: [0, 0.4, 0], labels: ALL }
]);
fig.start();
