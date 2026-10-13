// Example: brackets on the lower front teeth, canine to canine (FDI 43–33), in the aligning stage: twin 0.022 in brackets
// at MBT-style lower heights, elastomeric ligatures and a round 0.014 in NiTi wire. Teeth from DK.arch (mandible, crowns
// up, left teeth mirrored), seen from the front and slightly above, patient's right on the viewer's left. The gingiva is
// DK.gingivaArch below the crowns. Image-friendly: the story ends on the hero shot. Sizes in mm.
const SLOT = '0.022', WIRE = '0.014';
const HOME = { theta: 0.52, phi: 1.20 };
const fig = DK.figure({
  title: 'Brackets on the lower front teeth',
  subtitle: 'FDI 43–33 in the mouth. 0.022 in slots, 0.014 in NiTi aligning wire.',
  view: Object.assign({ margin: 0.76 }, HOME)
});
const HEIGHT = { 1: 4.0, 2: 4.0, 3: 5.0 };   // slot centre from the incisal edge / cusp tip: MBT-style chart, average lower crowns (facts §19)

const arch = DK.arch({ jaw: 'mandible', teeth: [43, 42, 41, 31, 32, 33], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
fig.part(arch.group, { name: 'Lower front teeth', label: false, info: 'Mandibular canines and incisors, FDI 43–33.' });
arch.group.updateMatrixWorld(true);
const teeth = [], wirePts = [];
arch.teeth.forEach(({ fdi, tooth: t, spec: sp, slot }) => {
  const p = fdi % 10, n = new THREE.Vector3(slot.n[0], 0, slot.n[1]);
  fig.part(t.group, { inPlace: true, name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  const br = DK.bracket(sp, { slot: SLOT, height: HEIGHT[p] }), lig = DK.ligature(br);
  wirePts.push(t.group.localToWorld(new THREE.Vector3(...br.wirePoint(DK.wireSize(WIRE).d))).toArray());
  [br, lig].forEach(o => { o.updateMatrix(); o.applyMatrix4(t.group.matrixWorld); });
  teeth.push({ fdi, t, n, br, lig });
  fig.part(br, { name: 'Bracket', sub: `twin, ${DK.SLOTS[SLOT].name} slot`, label: fdi === 31, anchor: [br.userData.width / 2 - 0.2, br.userData.tall / 2 - 0.12, br.userData.face + 0.05], dim: false, explode: n.clone().multiplyScalar(6).toArray(), labelOffset: [110, -60], info: `Twin bracket bonded ${HEIGHT[p]} mm from the incisal edge (MBT-style lower chart). Lower incisors are the narrowest teeth, so their brackets are the smallest.` });
  fig.part(lig, { name: 'Ligature', sub: 'elastomeric O-ring', dim: false, label: fdi === 42, anchor: lig.userData.sidePoints[0], explode: n.clone().multiplyScalar(9).toArray(), labelOffset: [-110, 40], info: 'Polyurethane O-ring over the four tie wings; it holds the wire in the slot.' });
});
const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic).' });
const wire = DK.archwire(wirePts, { size: WIRE, material: 'niti', overhang: 1.5 });
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
fig.part(wire, { name: 'Archwire', sub: `${DK.wireSize(WIRE).name} NiTi, round`, anchor: mid(wirePts[2], wirePts[3]), explode: [0, 0, 10], labelOffset: [-110, 60], info: 'A thin superelastic NiTi wire aligns crowded teeth with light continuous force; rectangular steel wires come later.' });

fig.standardControls({ explode: true, explodeLabel: 'Lift off' });
fig.view('Front', { theta: 0, phi: 1.5, zoom: 1 });
const b31 = teeth.find(t => t.fdi === 31).br;
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.5, zoom: 1, labels: [], caption: 'Brackets and an aligning wire on the lower front teeth.' },
  { dur: 2.2, hold: 2.0, theta: 0.5, phi: 1.35, explode: 1, labels: ['Bracket', 'Ligature', 'Archwire'], caption: 'Lifted off: bracket, ring, wire.' },
  { dur: 2.0, hold: 2.2, explode: 0, zoom: 0.3, focus: b31.position.toArray(), labels: ['Bracket', 'Ligature'], caption: 'Seated: the wire sits in the slot under the ring.' },
  { dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: HOME.theta, phi: HOME.phi, labels: ['Bracket', 'Archwire', 'Ligature'], caption: '' }
]);
fig.start();
