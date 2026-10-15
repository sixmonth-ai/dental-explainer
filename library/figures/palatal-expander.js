// Rapid palatal expander (Hyrax type) on the upper jaw, seen from below; jaw frame: +x = patient's left, +z anterior, y up (DK.mandible frame).
// poster: step 3
// The upper jaw is DK.maxilla (bone with every upper tooth on its roots; the lower jaw, zygomatic arches and temporal bones are removed). It is
// split at the midline into two halves (clipping planes on two copies of the bone), each carrying its own teeth, bands and arms. Turning the
// screw pushes the halves apart: they swing about a fulcrum high above the palate and open slightly more at the front, so the suture opens in a
// V (wider toward the mouth and toward the front) and a gap appears between the central incisors. The kit has no expander, so the screw body,
// guide pins, arms (1.4 mm wire) and bands (DK.band) are built here. Screw rates differ by brand (often ~0.2–0.25 mm per quarter turn). mm.
const OPEN = 6;                                            // screw opening at the end of the activation, mm (approximate)
const fig = DK.figure({
  fov: 32,
  title: 'Palatal expander',
  subtitle: 'Upper jaw from below. Bands on 14, 16, 24, 26 (FDI).',
  view: { theta: 0, phi: 2.62, margin: 0.78 }
});
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const m = DK.mandible({ teeth: false, upper: 'bone', maxilla: { disc: false, opacity: 1 } });
const mx = m.maxilla;
// keep only the upper jaw: drop the mandible, arches, temporal bones and joint guides
[m.jaw, mx.zygoma.left, mx.zygoma.right, mx.temporal.left, mx.temporal.right, ...Object.values(mx.joints)].forEach(o => { if (o && o.parent) o.parent.remove(o); });
fig.part(m.group, { name: 'Upper jaw', label: false, info: 'The maxilla: two bones joined in the midline of the palate by the midpalatal suture.' });
m.group.updateMatrixWorld(true);
// a soft fill from below: the figure is seen from the mouth side, which the kit's key light (from above) leaves in shadow
const fill = new THREE.DirectionalLight(0xffffff, 0.55); fill.position.set(10, -60, 30); fig.world.add(fill);

// --- the two halves: a copy of the bone each, clipped at the midline, plus that side's teeth
const halves = [-1, 1].map(s => {
  const g = new THREE.Group(); g.matrixAutoUpdate = false; m.group.add(g);
  const mat = DK.mat('bone'); mat.side = THREE.DoubleSide;
  const base = new THREE.Plane(new THREE.Vector3(s, 0, 0), 0), plane = base.clone(); mat.clippingPlanes = [plane];
  const bone = new THREE.Mesh(mx.maxilla.geometry, mat); bone.name = s < 0 ? 'Right maxilla' : 'Left maxilla'; g.add(bone);
  return { s, g, mat, base, plane, bone, teeth: [] };
});
mx.maxilla.visible = false;
const half = s => halves[s < 0 ? 0 : 1];
mx.teeth.teeth.forEach(t => { const h = half(t.slot.c[0]); h.g.attach(t.tooth.group); h.teeth.push(t); });
const T = fdi => mx.teeth.teeth.find(t => t.fdi === fdi);
halves.forEach(h => {
  fig.part(h.bone, { inPlace: true, name: h.bone.name, label: false, info: (h.s < 0 ? "Patient's right" : "Patient's left") + ' half of the upper jaw. It moves outward with its teeth as the screw is turned.' });
  h.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
});
m.group.updateMatrixWorld(true);

// --- where the screw goes: midline, level with the second premolars, 2 mm below the bone of the palate (the mucosa is not drawn)
const zs = T(15).tooth.group.getWorldPosition(new THREE.Vector3()).z;
const ray = new THREE.Raycaster(new THREE.Vector3(0, -20, zs), new THREE.Vector3(0, 1, 0)); mx.maxilla.visible = true;
const hit = ray.intersectObject(mx.maxilla, false)[0]; mx.maxilla.visible = false;
const yPal = hit ? hit.point.y : 26, ys = yPal - 3.4;
const SC = m.group.worldToLocal(new THREE.Vector3(0, ys, zs));

// --- appliance parts
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.32, metalness: 0.85 });
const block = s => { const g = DK.sweepGeometry(new THREE.LineCurve3(V([s * 1.6, ys, zs]), V([s * 5.6, ys, zs])), DK.roundedRect(1.5, 4.2, 0.8), { segments: 6, radial: 32, up: [0, 1, 0] }); return new THREE.Mesh(g, steel); };
halves.forEach(h => { h.block = block(h.s); h.g.add(h.block); });
const centre = new THREE.Group(); m.group.add(centre);
const rod = DK.tube([[-5, ys, zs], [5, ys, zs]], 1.05, steel, { segments: 8, radial: 20 }); centre.add(rod);
const hub = DK.tube([[-1.5, ys, zs], [1.5, ys, zs]], 1.55, steel, { segments: 4, radial: 24 }); centre.add(hub);
const holeMat = new THREE.MeshBasicMaterial({ color: DK.color(0x2a2824), toneMapped: false });
const hole = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), holeMat); hole.rotation.x = Math.PI / 2; hole.position.set(0, ys - 1.56, zs); hub.add(hole);   // the key hole, facing the mouth
const pins = [-2.8, 2.8].map(dz => { const p = DK.tube([[-6.5, ys, zs + dz], [6.5, ys, zs + dz]], 0.55, steel, { segments: 6, radial: 14 }); centre.add(p); return p; });
// bands on the first premolars and first molars, with an arm from each band's palatal side to its half of the screw body
const onCrown = (t, side, x, h, off) => { const q = DK.crownSurface(t.spec, side).at(x, h); return t.tooth.group.localToWorld(V(q.p.map((v, k) => v + q.n[k] * off))); };
const bands = [], arms = [];
[14, 16, 24, 26].forEach(fdi => {
  const t = T(fdi), b = DK.band(t.spec, { bottom: 0.9, top: t.spec.crownL - 2.2 }); t.tooth.group.add(b); bands.push(b);
  const h = half(t.slot.c[0]), p0 = onCrown(t, -1, 0, t.spec.crownL * 0.55, 0.2), up = p0.clone(); up.y = (p0.y + ys) / 2 + 2.5; up.x *= 0.82;
  const end = V([h.s * 4.6, ys, zs + (fdi % 10 === 4 ? 3.2 : -3.2)]);
  const arm = DK.tube([p0.toArray(), up.toArray(), V([(up.x + end.x) / 2, ys + 1.2, (up.z + end.z) / 2]).toArray(), end.toArray()], 0.7, steel, { segments: 40, radial: 12 });
  h.g.add(arm); arms.push(arm);
});
const P = SC.toArray();
fig.part(hub, { inPlace: true, name: 'Screw', sub: 'turned with a key', accent: true, anchor: [0, ys - 1.5, zs], labelOffset: [-120, 60], dim: false,
  info: 'Each turn of the key pushes the two halves of the screw apart a fraction of a millimetre (often about 0.2–0.25 mm; it depends on the screw). Usually turned once or twice a day for a few weeks.' });
fig.part(bands[1], { inPlace: true, name: 'Band', sub: 'cemented to the molar', anchor: (() => { const t = T(16), q = DK.crownSurface(t.spec, 1).at(0, t.spec.crownL * 0.5); return q.p.map((v, k) => v + q.n[k] * 0.2); })(), labelOffset: [-100, -40], dim: false,
  info: 'Steel rings cemented around the first molars and first premolars carry the push to the teeth and, through them, to the bone.' });
fig.part(arms[3], { inPlace: true, name: 'Arm', sub: 'stiff wire to the band', anchor: (() => { const t = T(26), p = onCrown(t, -1, 0, t.spec.crownL * 0.55, 0.2); return [p.x * 0.86, (p.y + ys) / 2 + 2.3, p.z]; })(), labelOffset: [110, -30], dim: false,
  info: 'Thick wires soldered to the bands and set into the screw body.' });
fig.part(m.group, { inPlace: true, name: 'Midpalatal suture', sub: 'opens in the middle', anchor: [0, yPal - 0.2, zs - 11], labelOffset: [110, 50], dim: false,
  when: () => st.open > 1.5, info: 'In children and teenagers the two halves of the upper jaw are joined by a seam of fibrous tissue. The expander splits it open; new bone then fills the gap while the expander is held in place for a few months.' });
const tipOf = fdi => { const t = T(fdi); return t.tooth.group.localToWorld(V([0, t.spec.crownL - 0.6, 0.6])); };
fig.part(m.group, { inPlace: true, name: 'Gap', sub: 'between the front teeth', anchor: () => tipOf(11).add(tipOf(21)).multiplyScalar(0.5).toArray(), labelOffset: [100, 40], dim: false,
  when: () => st.open > 1.5, info: 'A gap opens between the upper front teeth as the jaw widens: the sign the suture has opened. It mostly closes by itself over the following weeks.' });

// --- the opening: each half swings out about a fulcrum high above the palate (more opening toward the mouth) and a little more at the front
const st = { open: 0, turn: 0 }, PIV = V([0, yPal + 46, zs]), ZF = tipOf(11).z - zs;
function pose() {
  const d = st.open, a = Math.asin(Math.min(0.9, d / (2 * (PIV.y - ys)))), b = Math.atan(0.25 * d / 2 / ZF);
  halves.forEach(h => {
    const M = new THREE.Matrix4().makeTranslation(PIV.x, PIV.y, PIV.z).multiply(new THREE.Matrix4().makeRotationZ(h.s * a)).multiply(new THREE.Matrix4().makeRotationY(h.s * b)).multiply(new THREE.Matrix4().makeTranslation(-PIV.x, -PIV.y, -PIV.z));
    h.g.matrix.copy(M); h.g.updateMatrixWorld(true);
    h.plane.copy(h.base).applyMatrix4(h.g.matrixWorld);
  });
  hub.rotation.x = st.turn; hub.position.set(0, ys * (1 - Math.cos(st.turn)) + zs * Math.sin(st.turn), zs * (1 - Math.cos(st.turn)) - ys * Math.sin(st.turn));   // spin the hub about its own axis (x through (ys, zs))
}
fig.param('open', 0, v => { st.open = v; pose(); });
fig.param('turn', 0, v => { st.turn = v; pose(); });
pose();

const below = { theta: 0, phi: 2.62 };
fig.view('From below', Object.assign({ zoom: 1, focus: 'auto' }, below));
fig.view('Front', { theta: 0, phi: 1.75, zoom: 1, focus: 'auto' });
fig.procedure([
  { label: 'Expander fitted', caption: 'Bands on the molars and premolars, a screw in the middle of the palate.', beats: [
    { dur: 0, hold: 0.8, theta: 0.5, phi: 2.2, zoom: 1, set: { open: 0, turn: 0 }, labels: [] },
    { dur: 2.2, hold: 2.4, theta: 0.15, phi: 2.62, zoom: 0.56, focus: [0, ys, zs + 4], labels: ['Screw', 'Band', 'Arm'], key: true }] },
  { label: 'Screw turned daily', caption: 'Each turn of the key opens the screw a fraction of a millimetre.', beats: [
    { dur: 1.6, hold: 0.2, zoom: 0.42, focus: P, theta: 0.1, phi: 2.75, labels: ['Screw'] },
    { dur: 3.0, hold: 1.8, set: { open: OPEN * 0.5, turn: Math.PI * 4 }, labels: ['Screw'], key: true }] },
  { label: 'Suture opens', caption: 'The two halves of the upper jaw move apart; a gap opens between the front teeth.', beats: [
    { dur: 2.0, hold: 0.2, zoom: 0.58, focus: [0, ys, zs + 6], theta: 0, phi: 2.5, labels: [] },
    { dur: 3.0, hold: 2.6, set: { open: OPEN, turn: Math.PI * 8 }, labels: ['Midpalatal suture', 'Gap', 'Screw'], key: true }] }
]);
fig.start();
