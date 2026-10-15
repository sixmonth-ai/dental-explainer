// Procedure: a simple (forceps) extraction of the lower right second premolar, FDI 45 (Universal 29), in a bucco-lingual cut through its root: an elevator loosens it in the ligament space, forceps grip the root, rocking stretches the socket, the tooth comes out and a blood clot fills the socket. Frame: tooth frame of 45 (+x mesial, +z buccal, CEJ at y = 0), camera on the mesial side looking at the cut.
// poster: step 4
const CREST = -1.8, GUM_TOP = 1.1;
const PDL = 0.25;                     // ligament space around the root (mm, drawn a touch wider than the 0.15-0.38 mm average so it reads)
const PIVOT = -9.5;                   // rocking centre, apical third of the root
const ROCK = 8;                       // degrees of bucco-lingual rocking at the peak

const fig = DK.figure({
  fov: 28,
  title: 'Simple tooth extraction',
  subtitle: 'Lower right second premolar, FDI 45 (Universal 29), cut cheek to tongue.',
  view: { theta: Math.PI / 2, phi: 1.45, margin: window.DK_MODE === 'image' ? 0.72 : 0.92 }
});

// ---------- context: bone, gingiva, neighbours ----------
const t45 = DK.tooth(45), s = t45.spec, R = s.roots[0];
const t44 = DK.tooth(44), t46 = DK.tooth(46);
t44.group.position.x = s.md / 2 + t44.spec.md / 2;
t46.group.position.x = -(s.md / 2 + t46.spec.md / 2);
const bone = DK.bone({ width: 30, height: 22, depth: 10.6, cortical: 1.2, crest: 1.4 });
bone.position.set(-2.5, CREST, 0);
const gum = DK.gingiva({ width: 30, height: 3.4, depth: 11.2, crest: 1.3, around: [
  { x: 2.5, z: 0, md: s.mdC, bl: s.blC }, { x: 2.5 + t44.group.position.x, z: 0, md: t44.spec.mdC, bl: t44.spec.blC }, { x: 2.5 + t46.group.position.x, z: 0, md: t46.spec.mdC, bl: t46.spec.blC }] });
gum.position.set(-2.5, GUM_TOP, 0);
const jaw = new THREE.Group(); jaw.add(bone, gum, t44.group, t46.group);
fig.part(jaw, { name: 'Jaw', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', anchor: [9, -6, 5.3], labelOffset: [-60, 40], info: 'Jawbone around the root. Its socket wall is thin and springy enough to stretch a little.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Gingiva: it is gently separated from the tooth before the instruments go in.' });
fig.part(t44.group, { inPlace: true, name: '44', label: false, info: 'Lower right first premolar (Universal 28).' });
fig.part(t46.group, { inPlace: true, name: '46', label: false, info: 'Lower right first molar (Universal 30).' });

// ---------- the socket: the space the root leaves (ligament space now, the whole hole later) ----------
const sockRoot = Object.assign({}, R, { start: 1.6 });
const sockGeo = DK.rootGeometry(sockRoot, { k: 1, add: PDL, minR: 0.3, endShort: -PDL });
const voidCap = new THREE.Mesh(sockGeo, DK.mat('cavity')); voidCap.userData.cutOnly = true;      // paints the gap on the cut face
const voidWalls = DK.asHole(new THREE.Mesh(sockGeo, DK.mat('cavity')));                        // the empty socket's inner walls once the tooth is out
voidWalls.visible = false;
const clotGeo = DK.rootGeometry(Object.assign({}, R, { start: 0.2 }), { k: 1, add: PDL * 0.6, minR: 0.3, endShort: -PDL * 0.5 });
clotGeo.computeBoundingBox(); const CLOT_Y0 = clotGeo.boundingBox.min.y; clotGeo.translate(0, -CLOT_Y0, 0);
const clot = new THREE.Mesh(clotGeo, DK.mat('pulp', { color: 0x7a3c37, cap: 0x7a3c37, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 }));
clot.position.y = CLOT_Y0; clot.visible = false;
const socket = new THREE.Group(); socket.add(voidCap, voidWalls, clot);
fig.world.add(socket);
fig.part(voidCap, { inPlace: true, name: 'Socket', sub: 'stretched by rocking', anchor: (e, sec) => [0.2, -6, -(R.rb + PDL) * 0.98], labelOffset: [90, 30], dim: false, info: 'The bony socket. Rocking presses the root against its thin walls, which give a little, and tears the ligament fibres that hold the tooth.' });
fig.part(clot, { inPlace: true, name: 'Blood clot', anchor: [0.2, 6, 0], labelOffset: [80, -40], dim: false, info: 'The socket fills with blood that clots within minutes. The clot protects the bone and is the scaffold the new bone grows into over the following weeks.' });

// ---------- the tooth and the forceps ride on one carrier that rocks about the apical third ----------
const carrier = new THREE.Group(); carrier.position.y = PIVOT; fig.world.add(carrier);
const held = new THREE.Group(); held.position.y = -PIVOT; carrier.add(held);
held.add(t45.group);
fig.part(t45.group, { inPlace: true, name: '45', sub: 'single root', anchor: [0, s.crownL - 0.3, 0], labelOffset: [-70, -50], info: 'Lower right second premolar (Universal 29): one cone-shaped root, which is why it can be rocked and turned out of its socket.' });

const steel = DK.mat('steel');
// a curved blade or beak: an annular sector (inner radius r, thickness th, opening ang) extruded `len` mm down from y = 0, centred on +z
function plate(r, th, ang, len, cz) {
  const sh = new THREE.Shape(), a0 = Math.PI / 2 - ang / 2, a1 = Math.PI / 2 + ang / 2, n = 18;
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const p = [(r + th) * Math.cos(a), cz + (r + th) * Math.sin(a)]; i ? sh.lineTo(...p) : sh.moveTo(...p); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; sh.lineTo(r * Math.cos(a), cz + r * Math.sin(a)); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2, curveSegments: 4, steps: 6 });
  g.rotateX(Math.PI / 2);                                   // extrusion runs down −y, sector lies in xz
  const p = g.attributes.position;                          // the working end thins and narrows to the tip
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = DK.util.clamp(-y / len, 0, 1), k = 1 - 0.28 * t * t; p.setX(i, p.getX(i) * k); }
  g.computeVertexNormals(); return new THREE.Mesh(g, steel);
}

// lower premolar forceps: two beaks hugging the root buccally and lingually, arms meeting at the hinge above the tooth
const BEAK = { r: 3.0, th: 0.75, ang: 1.75, len: 4.0, cz: 0.6, top: 0.9 };   // tips reach just past the bone crest
const HINGE = [0, 24, 0];
const forceps = new THREE.Group(); held.add(forceps);
const arms = [1, -1].map(side => {
  const pivot = new THREE.Group(); pivot.position.set(...HINGE); forceps.add(pivot);
  const arm = new THREE.Group(); arm.position.set(-HINGE[0], -HINGE[1], -HINGE[2]); pivot.add(arm);
  const beak = plate(BEAK.r, BEAK.th, BEAK.ang, BEAK.len, BEAK.cz); beak.position.y = BEAK.top; beak.rotation.x = side * 0.05;
  const z0 = BEAK.cz + BEAK.r + BEAK.th / 2;
  const shank = DK.tube([[0, BEAK.top - 0.3, z0], [0, 3, z0 + 0.5], [0, 10, z0 + 0.6], [0, 18, 2.6], [0, HINGE[1], 0.9], [0, HINGE[1] + 6, -1.2], [0, HINGE[1] + 22, -3.4]], 0.85, steel, { segments: 60, radial: 12 });
  shank.scale.set(1.7, 1, 1);                               // a flat bar, wider mesio-distally than thick
  const g = new THREE.Group(); g.add(beak, shank); if (side < 0) g.rotation.y = Math.PI; arm.add(g);
  return pivot;
});
const hinge = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 4.6, 24), steel); hinge.rotation.z = Math.PI / 2; hinge.position.set(...HINGE); forceps.add(hinge);
fig.part(forceps, { inPlace: true, name: 'Forceps', sub: 'beaks on the root', anchor: [0, -2.5, -(BEAK.cz + BEAK.r + BEAK.th)], labelOffset: [90, -20], accent: true, dim: false, info: 'Extraction forceps: the beaks slide under the gum and grip the root, not the crown, so the force goes where the tooth is held in the bone.' });

// elevator: a straight elevator with a concave blade, wedged into the ligament space at the mesio-buccal corner
const elevator = new THREE.Group(); fig.world.add(elevator);
const blade = plate(1.25, 0.42, 1.9, 4.6, -1.25); blade.position.y = 4.6; blade.rotation.y = Math.PI;   // concave face toward the root
const shaft = DK.lathe([[0.9, 4.4], [1.25, 6.5], [1.25, 20], [2.2, 23], [2.6, 27], [2.7, 60], [0, 60.4]], 32, steel);
elevator.add(blade, shaft);
const EL = { tip: [1.75, -3.6, 2.85], tilt: [0.32, 0, -0.42] };     // tip in the mesio-buccal ligament space; shaft leans out over the neighbour
elevator.rotation.set(EL.tilt[0], EL.tilt[1], EL.tilt[2]); elevator.rotation.order = 'ZXY';
fig.part(elevator, { inPlace: true, name: 'Elevator', sub: 'wedged into the ligament', anchor: [0, 1.5, 0.6], labelOffset: [-90, -60], accent: true, dim: false, info: 'A straight elevator: its blade goes into the thin ligament space between root and bone and is turned, which tears the fibres and starts to lift the tooth.' });

// ---------- params ----------
fig.param('elev', -20, d => {   // d = depth of the blade tip below the CEJ along the shaft; < 0 = parked out of view
  elevator.visible = d > -12;
  const up = new THREE.Vector3(0, 1, 0).applyEuler(elevator.rotation);
  elevator.position.set(EL.tip[0], EL.tip[1], EL.tip[2]).addScaledVector(up, -(d - 3.6) + 0);
  elevator.position.y += 0; elevator.userData.d = d;
});
fig.param('turn', 0, a => { blade.rotation.y = Math.PI + a * 0.5; });
fig.param('loose', 0, k => { held.position.y = -PIVOT + 0.35 * k; });
fig.param('fc', -1, k => {      // forceps: -1 parked, 0 open above, 1 seated and closed on the root
  forceps.visible = k > -0.5;
  const seat = DK.util.clamp(k, 0, 1);
  forceps.position.y = (1 - seat) * 14;
  const open = 0.16 * (1 - DK.util.smooth(0.7, 1, seat));
  arms[0].rotation.x = -open; arms[1].rotation.x = open;
});
fig.param('rock', 0, a => { carrier.rotation.x = a * Math.PI / 180; });
fig.param('widen', 0, k => { const f = 1 + 0.14 * k; voidCap.scale.set(f, 1 + 0.02 * k, f); voidWalls.scale.copy(voidCap.scale); });
fig.param('lift', 0, d => { carrier.position.set(0, PIVOT + d, 0.12 * d); voidWalls.visible = d > 4; t45.group.visible = forceps.visible || d < 1; });
fig.param('clot', 0, k => { clot.visible = k > 0.01; clot.scale.set(1, Math.max(0.02, k), 1); voidWalls.visible = voidWalls.visible && k < 0.98; });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [voidCap], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [clot], color: 0x7a3c37, kind: 'plain' },
  { objects: [t44.layers.enamel, t45.layers.enamel, t46.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t44.layers.root, t44.layers.dentin, t45.layers.root, t45.layers.dentin, t46.layers.root, t46.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t44.layers.pulp, t45.layers.pulp, t46.layers.pulp], color: DK.COLORS.pulpCap }
]);
voidWalls.material.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });

fig.procedure([
  { label: 'Tooth 45', caption: 'The tooth sits in its bony socket, held by a thin ligament.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: 0.75, phi: 1.2, zoom: 1.05, section: false, labels: ['45'] },
    { fov: 28, dur: 0, hold: 0, section: true, offset: 6 },
    { dur: 2.4, hold: 1.6, theta: Math.PI / 2, phi: 1.45, zoom: 1, offset: 0, labels: ['45', 'Bone'], key: true }] },
  { label: 'Elevator', caption: 'An elevator is wedged into the ligament space and turned.', beats: [
    { dur: 1.4, hold: 0.2, theta: Math.PI / 2 - 0.12, zoom: 0.85, focus: [0, 0, 1], set: { elev: -2 }, labels: ['Elevator'] },
    { dur: 1.8, hold: 0.3, set: { elev: 3.6 }, labels: ['Elevator'] },
    { dur: 1.4, hold: 1.0, set: { turn: 1, loose: 1, widen: 0.25 }, labels: ['Elevator'], key: true },
    { dur: 0.9, hold: 0.1, set: { elev: -20, turn: 0 }, labels: [] }] },
  { label: 'Forceps', caption: 'Forceps beaks slide under the gum and grip the root.', beats: [
    { dur: 1.2, hold: 0.1, theta: Math.PI / 2 - 0.3, phi: 1.38, zoom: 1, focus: [0, 2, 0], set: { fc: 0 }, labels: ['Forceps'] },
    { dur: 2.0, hold: 1.2, set: { fc: 1 }, labels: ['Forceps'], key: true }] },
  { label: 'Rocking', caption: 'Slow rocking toward the cheek and tongue stretches the socket.', beats: [
    { dur: 1.1, hold: 0.1, theta: Math.PI / 2 - 0.12, phi: 1.45, zoom: 0.9, focus: [0, -2, 0], set: { rock: ROCK, widen: 0.5 }, labels: ['Socket'] },
    { dur: 1.4, hold: 0.1, set: { rock: -ROCK, widen: 0.75 }, labels: ['Socket'] },
    { dur: 1.4, hold: 1.0, set: { rock: ROCK, widen: 1 }, labels: ['Socket', 'Forceps'], key: true },
    { dur: 1.2, hold: 0.3, set: { rock: 0 }, labels: ['Socket', 'Forceps'] }] },
  { label: 'Out', caption: 'Once loose, the tooth is lifted out of the socket.', beats: [
    { dur: 2.2, hold: 0.6, zoom: 1.05, focus: [0, 6, 0], set: { lift: 22, rock: 4 }, labels: ['45'] },
    { dur: 0.6, hold: 0.1, set: { fc: -1, lift: 40 }, labels: [] },
    { dur: 1.8, hold: 1.6, theta: Math.PI / 2 - 0.22, phi: 1.1, zoom: 0.8, focus: [0, -3, 0], labels: ['Socket'], key: true }] },
  { label: 'Blood clot', caption: 'Blood fills the socket and clots: the start of healing.', beats: [
    { dur: 2.2, hold: 0.4, set: { clot: 1 }, labels: ['Blood clot'] },
    { dur: 1.8, hold: 2.2, theta: Math.PI / 2 - 0.15, phi: 1.3, zoom: 0.95, focus: [0, -2, 0], labels: ['Blood clot', 'Bone'], key: true }] }
]);
fig.start();
