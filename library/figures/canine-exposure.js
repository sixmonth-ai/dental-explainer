// Procedure: an impacted upper right canine (FDI 13, Universal 6) brought into the arch. Upper teeth 15–21 in the mouth (DK.arch maxilla 'jaw', crowns down),
// poster: step 3
// seen from the front and the patient's right. Arch frame: +x = patient's left, +z anterior, y up (roots up). The canine sits high in the bone, tipped
// toward the lateral incisor, here on the cheek side; braces hold its space open. Steps: the crown is uncovered (a window in the gum and bone over it),
// a bracket with a gold chain is bonded to it, the chain is tied to the archwire and tightened over months, and the canine ends in line. The bone is a
// translucent ridge built here along the arch (the kit has no maxillary alveolus for a segment); the uncovering is a cap of tissue that is removed.
// Brackets at MBT-style heights (facts §19), 0.022 in slots, 0.016 in NiTi wire. Exposure technique (open or closed) varies; this shows an open window.
const fig = DK.figure({
  fov: 32,
  title: 'Bringing down an impacted canine',
  subtitle: 'Upper right canine (FDI 13, Universal 6), here on the cheek side.',
  view: { theta: -0.5, phi: 1.72, margin: 0.8 }
});
const V = (x, y, z) => new THREE.Vector3(x, y, z), SLOT = '0.022', WIRE = '0.016';
const HEIGHT = { 1: 5.0, 2: 4.5, 3: 5.0, 4: 4.5, 5: 4.0 };
const TEETH = [15, 14, 13, 12, 11, 21];
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: TEETH });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Upper right teeth and the left central incisor, in the mouth.' });
arch.group.updateMatrixWorld(true);
const T = f => arch.teeth.find(t => t.fdi === f), t13 = T(13), g13 = t13.tooth.group, s13 = t13.spec;
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// --- brackets on every tooth (13's bonded later), archwire through the slots (13's slot at its final place)
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.5, metalness: 0.65 });
const wirePts = [], brackets = {};
arch.teeth.forEach(({ fdi, tooth: t, spec: sp }) => {
  const b = DK.bracket(sp, { slot: SLOT, height: HEIGHT[fdi % 10] });
  wirePts.push(t.group.localToWorld(V(...b.wirePoint(DK.wireSize(WIRE).d))).toArray());
  t.group.add(b); brackets[fdi] = b;
  if (fdi !== 13) { const lig = DK.ligature(b, { color: 0xb9b4aa }); t.group.add(lig); fig.part(b, { inPlace: true, name: 'Bracket ' + fdi, label: false, info: 'Braces on the other teeth hold the space open and give the chain something to pull from.' }); }
});
const wire = DK.archwire(wirePts, { size: WIRE, material: 'niti', overhang: 1.5 });
fig.world.add(wire);
const W13 = V(...wirePts[TEETH.indexOf(13)]);
fig.part(wire, { inPlace: true, name: 'Archwire', anchor: V(...wirePts[1]).lerp(V(...wirePts[2]), 0.5).toArray(), labelOffset: [-80, 70], dim: false,
  info: 'A light, flexible wire through the braces. The chain is tied to it and tightened a little at each visit.' });
const b13 = brackets[13];
fig.part(b13, { inPlace: true, name: 'Bracket', sub: 'bonded to the crown', anchor: [b13.userData.width / 2, 0, b13.userData.face], labelOffset: [90, 60], dim: false, when: () => b13.visible,
  info: 'A small bracket (or button) glued to the exposed crown during the operation.' });

// --- the canine's two poses: in line (as placed by DK.arch) and impacted (high in the bone, crown tipped toward 12)
const P1 = g13.position.clone(), Q1 = g13.quaternion.clone();
const sl = arch.slots[13], nOut = V(sl.n[0], 0, sl.n[1]).normalize(), tMes = V(sl.t[0], 0, sl.t[1]).normalize();
const P0 = P1.clone().add(V(0, -15, 0))   // arch.group is mirrored in y (crowns down): local −y is up in the mouth
  .addScaledVector(tMes, 1.6).addScaledVector(nOut, 0.6);
const Q0 = new THREE.Quaternion().setFromAxisAngle(nOut, -0.36).multiply(Q1);
let pullK = 0;
fig.param('pull', 0, k => { pullK = k; g13.position.lerpVectors(P0, P1, k); g13.quaternion.slerpQuaternions(Q0, Q1, k); });
fig.part(g13, { inPlace: true, name: 'Canine', sub: 'in line', accent: true, anchor: () => [0, s13.crownL * 0.45, s13.bl / 2], labelOffset: [-110, 60], dim: false, when: () => pullK > 0.95,
  info: 'The canine in its place in the arch. Braces finish lining it up, and a retainer keeps it there.' });
fig.part(g13, { inPlace: true, name: 'Impacted canine', accent: true, anchor: () => [0, s13.crownL * 0.55, s13.bl / 2], labelOffset: [-110, -60], dim: false, when: () => pullK < 0.95,
  info: 'The upper canine erupts around age 11–12. When it is stuck, it stays in the bone and the baby canine may stay in the mouth.' });

// --- bone: a translucent ridge along the arch from the crest (1.6 mm above the CEJs) up past the canine's apex
const sl15 = arch.slots[15], sl21 = arch.slots[21];
const endPt = (q, s) => [q.c[0] + s * q.t[0] * (q.md / 2 + 1.2), q.c[1] + s * q.t[1] * (q.md / 2 + 1.2)];
const spinePts = [endPt(sl15, -1), ...TEETH.map(f => arch.slots[f].c), endPt(sl21, 1)].map(c => V(c[0], 0, c[1]));
const spine = new THREE.CatmullRomCurve3(spinePts, false, 'centripetal');
const CREST = 1.6, TOP = 34;
const boneGeo = DK.sweepGeometry(spine, (s, t) => { const [a, b] = DK.roundedRect((TOP - CREST) / 2, 5.4, 5.0)(s); const y = a + (TOP + CREST) / 2, u = (y - CREST) / (TOP - CREST), e = 0.45 + 0.55 * DK.util.smooth(0, 0.1, t) * DK.util.smooth(1, 0.9, t);
  return [CREST + (y - CREST) * (0.6 + 0.4 * e), b * e * (1 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.4)))]; }, { segments: 160, radial: 48 });
const boneMat = DK.mat('bone', { opacity: 0.26 }); boneMat.transparent = true; boneMat.depthWrite = false;
const bone = new THREE.Mesh(boneGeo, boneMat); bone.renderOrder = 2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The upper jaw bone (drawn see-through, like an X-ray).' });
// gum on the erupted teeth
const gumArch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [15, 14, 12, 11, 21], build: (fdi, spec) => ({ group: new THREE.Group(), layers: {}, spec }) });
gumArch.group.updateMatrixWorld(true);
const gum = DK.gingivaArch(gumArch);
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum (schematic).' });
const spaceMark = new THREE.Object3D(); spaceMark.position.set(sl.c[0] + nOut.x * 4, 2.2, sl.c[1] + nOut.z * 4); fig.world.add(spaceMark);
fig.part(spaceMark, { inPlace: true, name: 'Space kept open', anchor: [0, 0, 0], labelOffset: [-60, 80], dim: false, when: () => pullK < 0.3,
  info: 'The gap where the canine belongs, held open by the braces.' });

// --- the cover over the crown: gum and bone on its cheek side, removed to make a window
const crownMid = () => g13.localToWorld(V(0, s13.crownL * 0.55, s13.bl / 2 + 0.2));
const capMat = DK.mat('bone'); capMat.transparent = true; capMat.depthWrite = false;
const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
cap.renderOrder = 3; fig.world.add(cap);
g13.position.copy(P0); g13.quaternion.copy(Q0); arch.group.updateMatrixWorld(true);
{ const c = crownMid(), up = new THREE.Vector3().subVectors(g13.localToWorld(V(0, 1, s13.bl / 2 + 0.2)), c).normalize();
  cap.position.copy(c).addScaledVector(nOut, -0.6); cap.quaternion.setFromUnitVectors(V(0, 1, 0), nOut); cap.scale.set(5.0, 1.0, 5.0); }
fig.param('open', 0, k => { cap.visible = k < 0.98; capMat.opacity = 0.7 * (1 - k); cap.scale.y = 1.0 * (1 - 0.7 * k); });
fig.part(cap, { inPlace: true, name: 'Gum and bone over it', anchor: [0, 1, 0], labelOffset: [-120, 30], dim: false, when: () => cap.visible,
  info: 'Under local anaesthetic the surgeon opens a small window in the gum and bone over the crown.' });

// --- gold chain from the bracket to the archwire: links re-laid every frame between the two ends
const gold = DK.mat('gold');
const LINK = 0.95, links = [];
for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 8, 18), gold); m.scale.set(1, 1.45, 1); m.visible = false; fig.world.add(m); links.push(m); }
const chainMid = new THREE.Object3D(); fig.world.add(chainMid);
let chainOn = 0;
const layChain = () => {
  const A = b13.localToWorld(V(0, -b13.userData.tall / 2 - 0.2, b13.userData.face - 0.2)), B = W13.clone().addScaledVector(nOut, 0.3);
  const d = B.clone().sub(A), L = d.length() * chainOn, dir = d.clone().normalize(), n = chainOn > 0.01 ? Math.max(1, Math.floor(L / LINK)) : 0;
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), spin = new THREE.Quaternion().setFromAxisAngle(dir, Math.PI / 2);
  links.forEach((m, i) => { m.visible = i < n && L > 0.6; if (!m.visible) return; m.position.copy(A).addScaledVector(dir, (i + 0.5) * LINK); m.quaternion.copy(q); if (i % 2) m.quaternion.premultiply(spin); });
  chainMid.position.copy(A).addScaledVector(dir, Math.min(L, d.length()) * 0.5);
};
fig.param('bond', 0, k => { b13.visible = k > 0.5; chainOn = Math.max(0, Math.min(1, (k - 0.5) * 2)); });
fig.onFrame(() => layChain());
fig.part(chainMid, { inPlace: true, name: 'Gold chain', sub: 'tied to the wire', anchor: [0, 0, 0], labelOffset: [110, -30], dim: false, when: () => links[0].visible,
  info: 'A fine gold chain bonded with the bracket. Tied to the archwire and tightened at visits, it guides the canine down gently.' });

fig.view('Front', { theta: 0, phi: 1.7, zoom: 1, focus: 'auto' });

// --- procedure: each step settles on the canine, acts, then rests
const F0 = () => crownMid().toArray();
const FA = (() => { let x = 0, z = 0; TEETH.forEach(f => { x += arch.slots[f].c[0]; z += arch.slots[f].c[1]; }); return [x / TEETH.length, 1, z / TEETH.length]; })();
const FC = V(sl.c[0], 8, sl.c[1]).toArray(), FIN = V(sl.c[0], -2, sl.c[1]).toArray();
fig.procedure([
  { label: 'Stuck canine', caption: 'The canine is stuck high in the bone; braces hold its space open.', beats: [
    { dur: 0, hold: 1.0, theta: -0.2, phi: 1.68, zoom: 1.15, focus: [FA[0], 6, FA[2]], set: { pull: 0, open: 0, bond: 0 }, labels: [] },
    { dur: 2.2, hold: 2.4, theta: -0.5, phi: 1.62, zoom: 1.05, labels: ['Impacted canine', 'Space kept open'], key: true }] },
  { label: 'Uncover', caption: 'A small window is opened in the gum and bone over the crown.', beats: [
    { dur: 1.8, hold: 0.8, theta: -0.62, phi: 1.55, zoom: 0.82, focus: FC, labels: ['Gum and bone over it'] },
    { dur: 1.8, hold: 2.0, set: { open: 1 }, labels: ['Impacted canine'], key: true }] },
  { label: 'Bracket and chain', caption: 'A bracket with a gold chain is glued to the crown and tied to the wire.', beats: [
    { dur: 1.0, hold: 0.4, set: { bond: 0.52 }, labels: ['Bracket'] },
    { dur: 2.0, hold: 2.2, set: { bond: 1 }, zoom: 0.82, labels: ['Bracket', 'Gold chain'], key: true }] },
  { label: 'Pull into place', caption: 'Over months the chain is tightened and the canine comes down.', beats: [
    { dur: 3.2, hold: 2.2, set: { pull: 0.6 }, theta: -0.5, phi: 1.68, zoom: 0.92, focus: FA, labels: ['Gold chain', 'Archwire'], key: true }] },
  { label: 'In line', caption: 'The canine joins the arch and is lined up with the braces.', beats: [
    { dur: 2.6, hold: 0.4, set: { pull: 1, bond: 0.5 }, labels: [] },
    { dur: 1.8, hold: 2.6, theta: -0.4, phi: 1.7, zoom: 0.92, focus: FA, labels: ['Canine', 'Archwire'], key: true }] }
]);
fig.start();
