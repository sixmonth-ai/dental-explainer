// Three retainers after braces, one per step: a clear (vacuum-formed) retainer and a Hawley retainer on the upper arch 16–26 (in the mouth, crowns
// poster: step 2
// down), and a bonded lingual wire on the lower front teeth 33–43 (crowns up). Arch frame: +x = patient's left, +z anterior, y up; both arches
// share the origin and only one is shown at a time. The kit has no Hawley or bonded-retainer builder, so they are built here from the crown
// surfaces: the acrylic plate is a 2 mm slab from the cervical third of the palatal surfaces vaulting to the midline, the labial bow and Adams
// clasps are 0.7 mm steel wire swept through points on the crowns, and the bonded wire runs along the lingual middle third under composite pads.
// Wire and plate sizes are typical laboratory values, approximate. Sizes in mm.
const fig = DK.figure({
  fov: 34,
  title: 'Types of retainers',
  subtitle: 'Removable on the upper teeth, bonded on the lower front teeth.',
  view: { theta: 0.55, phi: 1.95, margin: 0.72 }
});
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const scene = new THREE.Group();
fig.part(scene, { name: 'Teeth', label: false, info: 'Upper and lower teeth after orthodontic treatment.' });

// ---------------- upper arch (crowns down) ----------------
const upper = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
scene.add(upper.group); scene.updateMatrixWorld(true);
const gumU = DK.gingivaArch(upper); scene.add(gumU);
upper.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
fig.part(gumU, { inPlace: true, name: 'Gum', label: false, info: 'Gum (schematic).' });
const UT = fdi => upper.teeth.find(t => t.fdi === fdi);
// a point on a crown, h mm above the CEJ in the tooth frame (toward the biting edge), `off` mm out along the surface normal; side +1 facial, -1 palatal
const onCrown = (t, side, x, h, off) => { const q = DK.crownSurface(t.spec, side).at(x, h); return t.tooth.group.localToWorld(V(q.p.map((v, k) => v + q.n[k] * off))).toArray(); };
const inTooth = (t, p) => t.tooth.group.localToWorld(V(p)).toArray();

// --- 1. clear retainer: one continuous 0.6 mm shell over the crowns (no attachments: it only holds)
const ends = [UT(16), UT(26)].map(o => { const s = upper.slots[o.fdi]; return [s.c[0] - s.t[0] * (s.md / 2 + 1), s.c[1] - s.t[1] * (s.md / 2 + 1)]; });
const spine = new THREE.CatmullRomCurve3([ends[0], ...upper.teeth.map(o => upper.slots[o.fdi].c), ends[1]].map(c => new THREE.Vector3(c[0], -4.2, c[1])), false, 'centripetal');
const essix = DK.alignerArch(spine, upper.teeth.map(o => o.tooth.layers.enamel), { thickness: 0.6, trimY: -0.9, segments: 200, around: 64 });
scene.add(essix);
const t22 = UT(22);
fig.part(essix, { inPlace: true, name: 'Clear retainer', sub: 'vacuum-formed plastic', anchor: onCrown(t22, 1, 0, t22.spec.crownL * 0.62, 0.75), labelOffset: [-110, 70], dim: false,
  info: 'A thin clear shell made on a model of the finished teeth. Worn at night (often full-time at first), it holds every tooth in place. Removable.' });

// --- 2. Hawley retainer: palatal acrylic plate + labial bow + Adams clasps on the first molars
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.35, metalness: 0.8 });
const acrylic = new THREE.MeshPhysicalMaterial({ color: DK.color(0xE2C4C0), roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.9 });
acrylic.userData.capColor = 0xE2C4C0;
const hawley = new THREE.Group(); scene.add(hawley);
// palatal edge of the plate: the cervical third of the palatal crown surfaces, 16 → 11 (right side), resampled; the left side is its mirror (x → -x)
const edgePts = [];
[16, 15, 14, 13, 12, 11].forEach(f => { const t = UT(f), w = t.spec.md / 2; for (let i = 0; i <= 6; i++) edgePts.push(V(onCrown(t, -1, -w + 2 * w * i / 6, 1.6, 0.15))); });
edgePts.reverse();   // from the midline back to 16
edgePts[0].x = 0;
const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
const NU = 60, NV = 40, Hmax = 10.5, TH = 2.0;
const plateG = DK.slabGeometry(NU, NV, (i, j) => {
  const u = i / NU, v = j / NV, e = edge.getPointAt(u), a = new THREE.Vector3(e.x, e.y, e.z), b = new THREE.Vector3(-e.x, e.y, e.z);
  const p = a.clone().lerp(b, v), mid = 1 - Math.abs(2 * v - 1);           // 0 at the teeth, 1 at the midline
  const vault = Hmax * DK.util.smooth(0, 0.55, u) * (1 - Math.pow(1 - mid, 2.6)) + 3.2 * (1 - Math.pow(1 - mid, 8)) * (1 - DK.util.smooth(0, 0.55, u)) * DK.util.smooth(0, 0.08, u);
  const y = p.y + vault;
  return [[p.x, y + TH * 0.5, p.z], [p.x, y - TH * 0.5, p.z]];
});
const plate = new THREE.Mesh(plateG, acrylic); hawley.add(plate);
// wire helper: 0.7 mm steel through points
const wire = (pts, r) => DK.tube(pts, r || 0.35, steel, { segments: Math.max(48, pts.length * 14), radial: 12 });
// labial bow, canine to canine, a U-loop on each canine, tags crossing the canine–premolar embrasure into the plate
const bowSide = (c, pm) => {   // c: canine, pm: first premolar (in the canine's own frame; works mirrored)
  const s = c.spec, w = s.md / 2, L = s.crownL;
  return [inTooth(c, [-w - 0.3, 1.0, -s.bl / 2 - 1.2]), inTooth(c, [-w - 0.2, L * 0.82, -s.bl / 2 + 0.6]), inTooth(c, [-w - 0.2, L * 0.86, 0.3]),
    onCrown(c, 1, -w + 0.2, L * 0.8, 0.5), onCrown(c, 1, -w + 0.7, 2.4, 0.55), onCrown(c, 1, -0.2, 1.4, 0.6), onCrown(c, 1, 0.9, 2.4, 0.55), onCrown(c, 1, 1.1, L * 0.5, 0.5)];
};
const bowPts = [...bowSide(UT(13)), onCrown(UT(12), 1, 0, UT(12).spec.crownL * 0.5, 0.5), onCrown(UT(11), 1, -1.5, UT(11).spec.crownL * 0.5, 0.45), onCrown(UT(11), 1, 2.5, UT(11).spec.crownL * 0.5, 0.45),
  onCrown(UT(21), 1, 2.5, UT(21).spec.crownL * 0.5, 0.45), onCrown(UT(21), 1, -1.5, UT(21).spec.crownL * 0.5, 0.45), onCrown(UT(22), 1, 0, UT(22).spec.crownL * 0.5, 0.5), ...bowSide(UT(23)).reverse()];
const bow = wire(bowPts); hawley.add(bow);
// Adams clasp on a first molar: tags over the mesial and distal embrasures, two arrowheads in the buccal undercuts, a bridge between them
const adams = t => {
  const s = t.spec, w = s.md / 2, L = s.crownL;
  return wire([inTooth(t, [w + 0.4, 1.0, -s.bl / 2 - 1.5]), inTooth(t, [w + 0.3, L * 0.85, -s.bl / 2 + 1.0]), inTooth(t, [w + 0.3, L * 0.9, 1.0]),
    onCrown(t, 1, w - 0.6, L * 0.8, 0.45), onCrown(t, 1, w - 1.1, 1.0, 0.35), onCrown(t, 1, w - 1.9, 0.9, 0.35), onCrown(t, 1, w - 2.4, L * 0.65, 0.9),
    onCrown(t, 1, -w + 2.4, L * 0.65, 0.9), onCrown(t, 1, -w + 1.9, 0.9, 0.35), onCrown(t, 1, -w + 1.1, 1.0, 0.35), onCrown(t, 1, -w + 0.6, L * 0.8, 0.45),
    inTooth(t, [-w - 0.5, L * 0.85, 1.0]), inTooth(t, [-w - 0.6, L * 0.8, -s.bl / 2 + 1.0]), inTooth(t, [-w - 0.3, 1.0, -s.bl / 2 - 1.5])]);
};
const clasps = [adams(UT(16)), adams(UT(26))]; clasps.forEach(c => hawley.add(c));
const pl = edge.getPointAt(0.62);
fig.part(plate, { inPlace: true, name: 'Acrylic plate', sub: 'against the palate', anchor: [pl.x * 0.45, pl.y + Hmax * 0.6 - TH / 2, pl.z], labelOffset: [90, -60], dim: false,
  info: 'Hard acrylic moulded to the palate; it carries the wires. It can be adjusted, and it lets the back teeth settle together.' });
fig.part(bow, { inPlace: true, name: 'Labial bow', sub: 'wire across the front', anchor: onCrown(UT(21), 1, 0.5, UT(21).spec.crownL * 0.5, 0.5), labelOffset: [-70, 70], dim: false,
  info: 'A steel wire (about 0.7 mm) across the front teeth, with an adjustment loop at each canine. It keeps the front teeth from moving forward.' });
fig.part(clasps[1], { inPlace: true, name: 'Clasp', sub: 'Adams clasp on 26', anchor: onCrown(UT(26), 1, 0, UT(26).spec.crownL * 0.65, 0.9), labelOffset: [80, 50], dim: false,
  info: 'Steel clasps hook under the bulge of the first molars and click the retainer into place.' });

// ---------------- lower arch (crowns up), bonded retainer 33–43 ----------------
const lower = DK.arch({ jaw: 'mandible', teeth: [35, 34, 33, 32, 31, 41, 42, 43, 44, 45], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
scene.add(lower.group); scene.updateMatrixWorld(true);
const gumL = DK.gingivaArch(lower); scene.add(gumL);
lower.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
fig.part(gumL, { inPlace: true, name: 'Gum ', label: false, info: 'Gum (schematic).' });
const LT = fdi => lower.teeth.find(t => t.fdi === fdi);
const bonded = new THREE.Group(); scene.add(bonded);
const front = [33, 32, 31, 41, 42, 43].map(LT), H = t => t.spec.crownL * 0.45;
const lingPts = [];
front.forEach((t, i) => { const w = t.spec.md / 2;
  if (i === 0) lingPts.push(onCrown(t, -1, w - 2 * w, H(t), 0.3));      // distal end of 33 (mirrored frame: x = -w is distal)
  lingPts.push(onCrown(t, -1, 0, H(t), 0.3));
  if (i < front.length - 1) { const n = front[i + 1], a = V(onCrown(t, -1, w, H(t), 0.3)), b = V(onCrown(n, -1, n.spec.md / 2, H(n), 0.3)); lingPts.push(a.add(b).multiplyScalar(0.5).toArray()); }
  else lingPts.push(onCrown(t, -1, -w + 0.4, H(t), 0.3)); });
const fixedWire = DK.tube(lingPts, 0.23, DK.mat('steel', { color: DK.COLORS.steel, cap: 0x9ea4aa, roughness: 0.4 }), { segments: 120, radial: 10 });
bonded.add(fixedWire);
const pads = front.map(t => { const a = DK.attachment(t.spec, { side: -1, x: 0, y: H(t), w: 2.0, h: 1.8, d: 0.75 }); t.tooth.group.add(a); return a; });
fig.part(fixedWire, { inPlace: true, name: 'Bonded wire', sub: 'behind the front teeth', anchor: lingPts[4], labelOffset: [-90, -70], dim: false,
  info: 'A thin (often braided) wire glued behind the six lower front teeth. It stays in all the time and cannot be seen; clean under it with floss threaders.' });
fig.part(pads[3], { inPlace: true, name: 'Composite', sub: 'bonds the wire to each tooth', anchor: [0, 0, 0], labelOffset: [90, -60], dim: false, info: 'Tooth-coloured composite glued to the enamel holds the wire on each tooth.' });
pads[3].userData.part.setAnchor(() => DK.crownSurface(LT(41).spec, -1).at(0, H(LT(41)) + 0.9).p.map((v, k) => v + DK.crownSurface(LT(41).spec, -1).at(0, H(LT(41)) + 0.9).n[k] * 0.7));

// ---------------- which retainer is on show (0..1 each), and the arches that carry them
const show = (objs, v) => objs.forEach(o => { o.visible = v > 0.5; });
fig.param('essix', 1, v => show([essix], v));
fig.param('lift', 0, v => { essix.position.y = -v; });   // the clear retainer slides off the crowns (incisally = -y)
fig.param('hawley', 0, v => show([hawley], v));
fig.param('lower', 0, v => { show([lower.group, gumL, bonded], v); show([upper.group, gumU], 1 - v); if (v > 0.5) { essix.visible = false; hawley.visible = false; } });

const FR = V(onCrown(LT(41), -1, 0, H(LT(41)), 0)).add(new THREE.Vector3(0, 0, -5)).toArray();   // behind the incisors, so the whole lower arch stays in frame
fig.procedure([
  { label: 'Clear retainer', caption: 'A clear plastic retainer, worn at night.', beats: [
    { dur: 0, hold: 0.8, theta: 0.15, phi: 1.7, zoom: 1, set: { essix: 1, hawley: 0, lower: 0 }, labels: [] },
    { dur: 2.0, hold: 0.6, theta: 0.5, phi: 1.9, zoom: 0.78, labels: ['Clear retainer'] },
    { dur: 1.8, hold: 2.4, set: { lift: 6 }, labels: ['Clear retainer'], key: true }] },
  { label: 'Hawley retainer', caption: 'A Hawley retainer: an acrylic plate with wires.', beats: [
    { dur: 1.6, hold: 0.2, set: { essix: 0, hawley: 1, lift: 0 }, theta: 0.3, phi: 2.3, zoom: 0.85, labels: [] },
    { dur: 1.6, hold: 2.6, theta: 0.42, phi: 2.55, zoom: 0.78, labels: ['Acrylic plate', 'Labial bow', 'Clasp'], key: true }] },
  { label: 'Bonded retainer', caption: 'A bonded wire behind the lower front teeth, fixed.', beats: [
    { dur: 0.8, hold: 0, zoom: 1.1, set: { lower: 1, hawley: 0 }, labels: [] },
    { dur: 2.2, hold: 2.6, theta: Math.PI - 0.12, phi: 0.72, zoom: 0.5, focus: FR, labels: ['Bonded wire', 'Composite'], key: true }] }
]);
fig.view('Front', { theta: 0, phi: 1.6, zoom: 1, focus: 'auto' });
fig.start();
