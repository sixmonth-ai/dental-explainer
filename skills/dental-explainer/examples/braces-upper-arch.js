// Example: a fixed appliance on the upper arch (FDI 16–26): twin brackets with 0.022 × 0.028 in slots at MBT-style heights,
// molar tubes on the first molars, elastomeric ligatures and a 0.019 × 0.025 in stainless-steel archwire.
// The upper teeth are in the mouth (crowns down, mirrored with scale.y = −1) seen from the front and slightly below,
// patient's right on the viewer's left. Figure frame: +x = patient's left, +z = anterior (labial of the incisors), y up. Sizes in mm.
// Appliance parts are built in each tooth's own frame (DK.bracket, DK.ligature, DK.molarTube) and then moved into the
// world with the tooth's matrix, so they can explode on their own. The gingiva is a ridge swept along the arch whose
// surface drops into a free gingival margin around every neck (papillae where two margins meet).
const SLOT = '0.022', WIRE = '0.019x0.025';
const HOME = { theta: 0.6, phi: 1.72 };
const fig = DK.figure({
  title: 'Fixed appliance on the upper arch',
  subtitle: 'FDI 16–26 in the mouth. 0.022 in slots, 0.019 × 0.025 in steel wire.',
  view: Object.assign({ margin: 0.46 }, HOME)
});

// --- arch form (private helper; a generic parabola-quartic, intercanine ≈ 33 mm, intermolar ≈ 48 mm, depth ≈ 22 mm)
const zOf = x => -(0.01347 * x * x + 4.13e-5 * Math.pow(x, 4));
const ARC = []; { let L = 0; for (let x = 0; x <= 40; x += 0.05) { if (x) L += Math.hypot(0.05, zOf(x) - zOf(x - 0.05)); ARC.push([x, L]); } }
const archAt = s => {   // s: arc length from the midline, signed (+ = patient's left) → {x, z, n: outward normal}
  const a = Math.abs(s); let k = ARC.findIndex(p => p[1] >= a); if (k < 1) k = 1;
  const x = (ARC[k - 1][0] + (a - ARC[k - 1][1]) / (ARC[k][1] - ARC[k - 1][1]) * 0.05) * Math.sign(s || 1);
  const dz = -(2 * 0.01347 * x + 4 * 4.13e-5 * Math.pow(x, 3)), n = new THREE.Vector3(-dz, 0, 1).normalize();
  return { x, z: zOf(x), n };
};
const HEIGHT = { 1: 5.0, 2: 4.5, 3: 5.0, 4: 4.5, 5: 4.5 };   // slot centre from the incisal edge / cusp tip (MBT chart, average crowns)
const TUBE_HEIGHT = 3.5;

// --- teeth along the arch, with their appliance parts
const teeth = [], brackets = [], wirePts = [];
const order = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], centres = {};
let sEnd = 0;   // arc length from the midline to the distal of the first molar
[1, 2].forEach(q => { let s = 0; for (let p = 1; p <= 6; p++) { const fdi = q * 10 + p, md = DK.toothPreset(fdi).md; centres[fdi] = (s + md / 2) * (q === 1 ? -1 : 1); s += md; } sEnd = s; });
order.forEach(fdi => {   // crowns only: the roots sit inside the ridge
  const t = DK.tooth(fdi, { omit: ['dentin', 'pulp', 'root'] }), sp = t.spec, q = Math.floor(fdi / 10), p = fdi % 10, a = archAt(centres[fdi]);
  t.group.position.set(a.x, 0, a.z); t.group.scale.set(q === 2 ? -1 : 1, -1, 1); t.group.rotation.y = Math.atan2(a.n.x, a.n.z);
  fig.part(t.group, { name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  t.group.updateMatrixWorld(true);
  const part = p === 6 ? DK.molarTube(sp, { slot: SLOT, height: TUBE_HEIGHT, hook: true }) : DK.bracket(sp, { slot: SLOT, height: HEIGHT[p] });
  wirePts.push(t.group.localToWorld(new THREE.Vector3(...part.wirePoint(DK.wireSize(WIRE).d))).toArray());
  const lig = p === 6 ? null : DK.ligature(part);
  [part, lig].forEach(o => { if (!o) return; o.updateMatrix(); o.applyMatrix4(t.group.matrixWorld); });   // into the world, exploding on their own
  const ex = a.n.clone().multiplyScalar(7);
  teeth.push({ fdi, t, a, part, lig, ex });
  if (p === 6) fig.part(part, { name: 'Molar tube', sub: 'bondable, with hook', label: fdi === 26, anchor: [0, 0, part.userData.face + 0.2], explode: ex.toArray(), labelOffset: [90, -40], info: 'A tube instead of a bracket on the first molar: the wire slides in from the front and stops at the distal end. The hook holds elastics.' });
  else {
    fig.part(part, { name: 'Bracket', sub: `twin, ${DK.SLOTS[SLOT].name} slot`, label: fdi === 21, anchor: [part.userData.width / 2 - 0.2, part.userData.tall / 2 - 0.12, part.userData.face + 0.05], dim: false, explode: ex.toArray(), labelOffset: [110, -70], info: `Stainless-steel twin bracket bonded at ${HEIGHT[p]} mm from the incisal edge (MBT-style chart). Four tie wings hold the ligature; the slot runs mesio-distally.` });
    fig.part(lig, { name: 'Ligature', sub: 'elastomeric O-ring', label: fdi === 21, anchor: [-(part.userData.width / 2 + 0.12), 0, part.userData.face + 0.3], explode: a.n.clone().multiplyScalar(11).toArray(), labelOffset: [-110, 40], info: 'Polyurethane O-ring stretched over the four tie wings; it holds the wire in the slot and is changed at each visit.' });
    brackets.push(part);
  }
});

// --- gingiva: a ridge swept along the arch; its lower face drops 0.8 mm into a free gingival margin around each neck
const HW = 3, cuff = (X, Z) => { let v = 0; teeth.forEach(o => { const g = o.t.group, ph = g.rotation.y, dx = X - g.position.x, dz = Z - g.position.z, lx = Math.cos(ph) * dx - Math.sin(ph) * dz, lz = Math.sin(ph) * dx + Math.cos(ph) * dz;
  const a = o.t.spec.mdC / 2, b = o.t.spec.blC / 2, rho = Math.pow(Math.pow(Math.abs(lx) / a, 2.3) + Math.pow(Math.abs(lz) / b, 2.3), 1 / 2.3); v += 0.8 * DK.util.smooth(1.6, 0.1, (rho - 1) * Math.min(a, b)); }); return Math.min(v, 1.1); };
const ridgeCurve = new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => { const a = archAt(-(sEnd + 2) + 2 * (sEnd + 2) * i / 40); return new THREE.Vector3(a.x, HW, a.z); }));   // ends just behind the first molars
const emin = (X, Z) => { let v = 0; teeth.forEach(o => { const g = o.t.group, ph = g.rotation.y, dx = X - g.position.x, dz = Z - g.position.z, lx = Math.cos(ph) * dx - Math.sin(ph) * dz, lz = Math.sin(ph) * dx + Math.cos(ph) * dz;
  if (lz > 0) v += Math.exp(-2.5 * Math.pow(lx / (o.t.spec.mdC / 2), 2)); }); return Math.min(v, 1); };   // alveolar eminences over the roots on the labial face
const rr = t => DK.roundedRect(HW, 4.8 + 1.9 * DK.util.smooth(0.5, 0.8, Math.abs(t - 0.5) * 2), 2.4);   // wider at the molars (BL 11 mm)
const ridge = new THREE.Mesh(DK.sweepGeometry(ridgeCurve, (s, t, f) => { let [a, b] = rr(t)(s); const X = f.P.x + f.U.x * a + f.N.x * b, Z = f.P.z + f.U.z * a + f.N.z * b, w = DK.util.smooth(-HW + 1.5, -HW + 0.2, a);
  if (w > 0) a -= w * cuff(X, Z); if (b > 0.3) b += 0.7 * emin(X, Z) * (1 - (a + HW) / (2 * HW)) * DK.util.smooth(0.3, 2.5, b); return [a, b]; }, { segments: 220, radial: 64 }), DK.mat('gingiva'));
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic); the free margin hugs every neck.' });

// --- the archwire through every slot (wire bottomed in the slot: centre = slot floor + half the wire depth)
const wire = DK.archwire(wirePts, { size: WIRE, material: 'steel', overhang: 1.2 });
fig.part(wire, { name: 'Archwire', sub: `${DK.wireSize(WIRE).name} stainless steel`, anchor: wirePts[3], explode: [0, 0, 16], labelOffset: [-120, 60], info: 'A rectangular working wire fills the slot, so the slot\'s built-in tip and torque are expressed. Initial alignment uses thin round NiTi wires (0.014 in).' });
// --- slot label on the bracket of 21 (the one thing to find when the bracket stands alone)
const b21 = teeth.find(t => t.fdi === 21).part;
fig.part(b21, { inPlace: true, name: 'Slot', sub: `${DK.SLOTS[SLOT].name}`, accent: true, anchor: [b21.userData.width / 2 + 0.1, 0, b21.userData.floor + 0.2], when: e => e > 0.6, labelOffset: [90, 70], info: `The slot: ${DK.SLOTS[SLOT].w.toFixed(3)} mm high, ${DK.SLOTS[SLOT].d.toFixed(3)} mm deep. The wire is bent to the arch form; the slot's angles do the rest.` });

fig.standardControls({ explode: true, explodeLabel: 'Lift off' });
fig.view('Occlusal', { theta: 0, phi: 2.75, zoom: 1 });
fig.view('Front', { theta: 0, phi: 1.72, zoom: 1 });

// --- story: the arch from the front → the parts lift off as the camera orbits → push in on one bare bracket (the slot) →
// everything seats again on that bracket (wire in the slot, ring over the wings) → ease out to the three-quarter hero shot
const t21 = teeth.find(t => t.fdi === 21), P21 = b21.position.clone(), N21 = t21.a.n;
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.72, zoom: 1, labels: [], caption: 'Brackets, tubes, ligatures and one archwire on the upper teeth.' },
  { dur: 2.4, hold: 2.0, theta: 0.7, phi: 1.5, explode: 1, labels: ['Bracket', 'Ligature', 'Archwire', 'Molar tube'], caption: 'Lifted off: the parts, in the order they go on.' },
  { dur: 2.0, hold: 2.2, zoom: 0.17, theta: 0.35, phi: 1.55, focus: P21.clone().addScaledVector(N21, 7).toArray(), labels: ['Slot', 'Bracket'], caption: 'The slot runs mesio-distally; its height and depth are standardised.' },
  { dur: 2.2, hold: 2.4, explode: 0, zoom: 0.2, focus: P21.toArray(), labels: ['Bracket', 'Ligature', 'Archwire'], caption: 'Seated: the wire lies in the slot and the ring over the wings holds it there.' },
  { dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: HOME.theta, phi: HOME.phi, labels: ['Archwire', 'Molar tube', 'Bracket'], caption: '' }
]);
fig.start();
