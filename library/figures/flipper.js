// Story: a flipper (removable acrylic partial denture) replacing a missing upper right central incisor, FDI 11 (Universal 8), on the upper arch 16–26
// poster: end
// in the mouth (DK.arch maxilla 'jaw': crowns down, left teeth mirrored). Arch frame: +x = patient's left, +z anterior, y up. The kit has no denture
// builder, so the flipper is built here: a 2 mm pink acrylic plate from the cervical third of the palatal crown surfaces vaulting to the midline (as in
// retainers.js), one acrylic tooth (the 11 preset crown) at the natural slot, and 0.7 mm steel ball clasps in the
// 15/16 and 25/26 embrasures. Plate and wire sizes are typical laboratory values, approximate. The flipper comes in from below, seats, and the camera
// visits the plate before ending on a three-quarter view from below with the tooth in the gap and the plate behind it. No labial flange (a ridge-lap
// tooth); many flippers have one. Sizes in mm.
const fig = DK.figure({
  fov: 34,
  title: 'Flipper tooth',
  subtitle: 'Replaces a missing upper front tooth, FDI 11 (Universal 8), while the site heals.',
  view: { theta: 0.5, phi: 2.05, margin: 0.74 }
});
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 21, 22, 23, 24, 25, 26], build: crowns });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Upper teeth, with the right central incisor (11) missing.' });
arch.group.updateMatrixWorld(true);
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));
const gum = DK.gingivaArch(arch);
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum along the upper teeth (schematic).' });
const T = f => arch.teeth.find(t => t.fdi === f);

// --- the flipper, built in the arch frame (world), as one group that comes out downward
const flipper = new THREE.Group();
const fake = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [11], build: crowns });   // the acrylic tooth at 11's natural slot
flipper.add(fake.group); fake.group.updateMatrixWorld(true);
const t11 = fake.teeth[0];
const acrylic = new THREE.MeshPhysicalMaterial({ color: DK.color(0xD9A9A6), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.35, metalness: 0.8 });
const onCrown = (t, side, x, h, off) => { const q = DK.crownSurface(t.spec, side).at(x, h); return t.tooth.group.localToWorld(V(q.p.map((v, k) => v + q.n[k] * off))).toArray(); };
const inTooth = (t, p) => t.tooth.group.localToWorld(V(p)).toArray();

// palatal plate: edge along the cervical third of the palatal surfaces, 16 → 11 (the acrylic tooth), mirrored to the left side
const edgePts = [];
[T(16), T(15), T(14), T(13), T(12), t11].forEach(t => { const w = t.spec.md / 2; for (let i = 0; i <= 6; i++) edgePts.push(V(onCrown(t, -1, -w + 2 * w * i / 6, 1.6, 0.15))); });
edgePts.reverse(); edgePts[0].x = 0;
const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
const NU = 60, NV = 40, Hmax = 10.5, TH = 2.0;
const plateG = DK.slabGeometry(NU, NV, (i, j) => {
  const u = i / NU, v = j / NV, e = edge.getPointAt(u), a = new THREE.Vector3(e.x, e.y, e.z), b = new THREE.Vector3(-e.x, e.y, e.z);
  const p = a.clone().lerp(b, v), mid = 1 - Math.abs(2 * v - 1);
  const vault = Hmax * DK.util.smooth(0, 0.55, u) * (1 - Math.pow(1 - mid, 2.6)) + 3.2 * (1 - Math.pow(1 - mid, 8)) * (1 - DK.util.smooth(0, 0.55, u)) * DK.util.smooth(0, 0.08, u);
  const y = p.y + vault;
  return [[p.x, y + TH * 0.5, p.z], [p.x, y - TH * 0.5, p.z]];
});
const plate = new THREE.Mesh(plateG, acrylic); flipper.add(plate);
const s11 = t11.spec;
// ball clasps in the 15/16 and 25/26 embrasures: from the plate over the contact to a ball in the buccal undercut
const clasp = t => { const s = t.spec, w = s.md / 2, L = s.crownL, g = new THREE.Group();
  const pts = [inTooth(t, [w - 0.2, 1.4, -s.bl / 2 - 1.6]), inTooth(t, [w + 0.15, L * 0.75, -s.bl / 2 + 0.9]), inTooth(t, [w + 0.25, L + 0.45, -1.0]), inTooth(t, [w + 0.25, L + 0.45, 1.2]),
    inTooth(t, [w + 0.15, L * 0.75, s.bl / 2 - 0.2]), inTooth(t, [w - 0.1, L * 0.38, s.bl / 2 + 0.25])];
  g.add(DK.tube(pts, 0.35, steel, { segments: 60, radial: 12 }));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), steel); ball.position.copy(V(pts[pts.length - 1])); g.add(ball);
  return g; };
const clasps = [clasp(T(16)), clasp(T(26))]; clasps.forEach(c => flipper.add(c));

fig.part(flipper, { name: 'Flipper', label: false, explode: [0, -15, 0], info: 'A removable acrylic plate with one false tooth. It clips in and out, and comes out for cleaning and at night if the dentist advises.' });
fig.part(fake.group, { inPlace: true, name: 'False tooth', sub: 'acrylic', accent: true, anchor: fake.group.worldToLocal(V(onCrown(t11, 1, 0.5, s11.crownL * 0.45, 0.1))).toArray(), labelOffset: [-110, 60], dim: false,
  info: 'An acrylic tooth matched to the neighbours, fixed in the plate. It fills the gap while the site heals or an implant integrates.' });
const pl = edge.getPointAt(0.8);
fig.part(plate, { inPlace: true, name: 'Acrylic plate', sub: 'against the palate', anchor: [0, pl.y + Hmax - TH / 2 + 0.2, pl.z], labelOffset: [90, -60], dim: false,
  info: 'Pink acrylic moulded to the palate. It carries the tooth and spreads the biting force over the roof of the mouth.' });
fig.part(clasps[1], { inPlace: true, name: 'Clasp', sub: 'wire between the back teeth', anchor: onCrown(T(26), 1, T(26).spec.md / 2 - 0.4, T(26).spec.crownL * 0.4, 0.8), labelOffset: [90, 50], dim: false,
  info: 'A steel wire with a small ball that sits between two back teeth and clicks the flipper into place.' });
const gapMark = new THREE.Object3D(); gapMark.position.copy(V(onCrown(t11, 1, 0, s11.crownL * 0.4, 0.2))); fig.world.add(gapMark);
fig.part(gapMark, { inPlace: true, name: 'Missing tooth', sub: 'FDI 11', anchor: [0, 0, 0], labelOffset: [-60, -90], dim: false, when: e => e > 0.6,
  info: 'The gap left by the lost tooth. The gum heals over the socket in the weeks that follow; an implant can be placed now or later.' });

fig.standardControls({ explode: true, explodeLabel: 'Take out', section: false });
fig.view('Palate', { theta: 0.2, phi: 2.7, zoom: 0.95, focus: 'auto', explode: 0, labels: ['Acrylic plate', 'Clasp', 'False tooth'] });

// story: the gap from the front → the flipper rises into place as the camera turns → front: the tooth fills the gap → from below: the plate and
// clasps → three-quarter from below (teaching shot)
const F11 = onCrown(t11, 1, 0, s11.crownL * 0.4, 0);
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.68, zoom: 1.0, explode: 1, labels: ['Missing tooth'] },
  { dur: 2.4, hold: 1.4, theta: 0.45, phi: 1.95, zoom: 1.05, labels: ['False tooth', 'Acrylic plate', 'Clasp'] },
  { dur: 2.4, hold: 1.8, explode: 0, theta: 0.1, phi: 1.7, zoom: 0.6, focus: F11, labels: ['False tooth'] },
  { dur: 2.6, hold: 2.2, theta: 0.2, phi: 2.7, zoom: 0.95, focus: 'auto', labels: ['Acrylic plate', 'Clasp'] },
  { dur: 2.2, hold: 2.8, theta: 0.3, phi: 2.4, zoom: 0.92, labels: ['False tooth', 'Acrylic plate', 'Clasp'], drift: 0 }
]);
fig.start();
