// Example: a fixed appliance on the upper arch (FDI 16–26): twin brackets with 0.022 × 0.028 in slots at MBT-style heights,
// molar tubes on the first molars, elastomeric ligatures and a 0.019 × 0.025 in stainless-steel archwire.
// The teeth come from DK.arch (maxilla in the mouth: crowns down, left teeth mirrored, contacts touching), seen from the
// front and slightly below with the patient's right on the viewer's left. Arch frame: +x = patient's left, +z = anterior, y up.
// Appliance parts are built in each tooth's own frame (DK.bracket, DK.ligature, DK.molarTube), then moved into the world
// with the tooth's matrix so they can explode on their own. The gingiva is a thin ridge swept along the arch whose lower face
// drops into a free gingival margin around every neck, with a papilla where two margins meet. Sizes in mm.
const SLOT = '0.022', WIRE = '0.019x0.025';
const HOME = { theta: 0.45, phi: 1.66 };
const fig = DK.figure({
  title: 'Fixed appliance on the upper arch',
  subtitle: 'FDI 16–26 in the mouth. 0.022 in slots, 0.019 × 0.025 in steel wire.',
  view: Object.assign({ margin: 0.6 }, HOME)
});
const HEIGHT = { 1: 5.0, 2: 4.5, 3: 5.0, 4: 4.5, 5: 4.5 };   // slot centre from the incisal edge / cusp tip (MBT chart, average crowns)
const TUBE_HEIGHT = 3.5;

// --- the arch: crowns only (the roots sit inside the ridge)
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
fig.part(arch.group, { name: 'Upper arch', label: false, info: 'Maxillary teeth 16–26, in the mouth.' });
arch.group.updateMatrixWorld(true);
const teeth = [], wirePts = [];
arch.teeth.forEach(({ fdi, tooth: t, spec: sp, slot }) => {
  const p = fdi % 10, n = new THREE.Vector3(slot.n[0], 0, slot.n[1]);   // outward normal in the arch frame
  fig.part(t.group, { inPlace: true, name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  const part = p === 6 ? DK.molarTube(sp, { slot: SLOT, height: TUBE_HEIGHT, hook: true }) : DK.bracket(sp, { slot: SLOT, height: HEIGHT[p] });
  wirePts.push(t.group.localToWorld(new THREE.Vector3(...part.wirePoint(DK.wireSize(WIRE).d))).toArray());
  const lig = p === 6 ? null : DK.ligature(part);
  [part, lig].forEach(o => { if (!o) return; o.updateMatrix(); o.applyMatrix4(t.group.matrixWorld); });   // into the world, exploding on their own
  teeth.push({ fdi, t, n, part, lig });
  if (p === 6) fig.part(part, { name: 'Molar tube', sub: 'bondable, with hook', label: fdi === 26, anchor: [0, 0, part.userData.face + 0.2], explode: n.clone().multiplyScalar(7).toArray(), labelOffset: [90, -40], info: 'A tube instead of a bracket on the first molar: the wire slides in from the front and stops at the distal end. The hook holds elastics.' });
  else {
    fig.part(part, { name: 'Bracket', sub: `twin, ${DK.SLOTS[SLOT].name} slot`, label: fdi === 21, anchor: [part.userData.width / 2 - 0.2, part.userData.tall / 2 - 0.12, part.userData.face + 0.05], dim: false, explode: n.clone().multiplyScalar(7).toArray(), labelOffset: [110, -70], info: `Stainless-steel twin bracket bonded at ${HEIGHT[p]} mm from the incisal edge (MBT-style chart). Four tie wings hold the ligature; the slot runs mesio-distally.` });
    fig.part(lig, { name: 'Ligature', sub: 'elastomeric O-ring', label: fdi === 21, anchor: [-(part.userData.width / 2 + 0.12), 0, part.userData.face + 0.3], explode: n.clone().multiplyScalar(11).toArray(), labelOffset: [-110, 40], info: 'Polyurethane O-ring stretched over the four tie wings; it holds the wire in the slot and is changed at each visit.' });
  }
});

// --- gingiva: a thin ridge swept along the arch (from the distal of 16 to the distal of 26); its lower face drops 0.9 mm
// into a free gingival margin around each neck (summed cuffs make the papillae), with low eminences over the roots
const HW = 2.2, RISE = 0.9, tmp = new THREE.Vector3();
const local = (o, X, Z) => o.t.group.worldToLocal(tmp.set(X, 0, Z));
const cuff = (X, Z) => { let v = 0; teeth.forEach(o => { const l = local(o, X, Z), a = o.t.spec.mdC / 2, b = o.t.spec.blC / 2, rho = Math.pow(Math.pow(Math.abs(l.x) / a, 2.3) + Math.pow(Math.abs(l.z) / b, 2.3), 1 / 2.3); v += RISE * DK.util.smooth(1.5, 0.1, (rho - 1) * Math.min(a, b)); }); return Math.min(v, 1.35 * RISE); };
const emin = (X, Z) => { let v = 0; teeth.forEach(o => { const l = local(o, X, Z); if (l.z > 0) v += Math.exp(-2.5 * Math.pow(l.x / (o.t.spec.mdC / 2), 2)); }); return Math.min(v, 1); };
const ends = [teeth[0], teeth[teeth.length - 1]].map(o => { const s = arch.slots[o.fdi]; return [s.c[0] - s.t[0] * (s.md / 2 + 1), s.c[1] - s.t[1] * (s.md / 2 + 1)]; });
const ridgePts = [ends[0], ...teeth.map(o => arch.slots[o.fdi].c), ends[1]].map(c => new THREE.Vector3(c[0], HW, c[1]));
const ridgeCurve = new THREE.CatmullRomCurve3(ridgePts, false, 'centripetal');
const rr = t => DK.roundedRect(HW, 4.0 + 1.8 * DK.util.smooth(0.55, 0.85, Math.abs(t - 0.5) * 2), 1.9);   // wider at the molars (BL 11 mm)
const ridge = new THREE.Mesh(DK.sweepGeometry(ridgeCurve, (s, t, f) => { let [a, b] = rr(t)(s); const X = f.P.x + f.U.x * a + f.N.x * b, Z = f.P.z + f.U.z * a + f.N.z * b, w = DK.util.smooth(-HW + 1.3, -HW + 0.15, a);
  if (w > 0) a -= w * cuff(X, Z); if (b > 0.3) b += 0.5 * emin(X, Z) * (1 - (a + HW) / (2 * HW)) * DK.util.smooth(0.3, 2.2, b); return [a, b]; }, { segments: 240, radial: 64 }), DK.mat('gingiva'));
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic); the free margin hugs every neck.' });

// --- the archwire through every slot (wire bottomed in the slot: centre = slot floor + half the wire depth)
const wire = DK.archwire(wirePts, { size: WIRE, material: 'steel', overhang: 1.2 });
fig.part(wire, { name: 'Archwire', sub: `${DK.wireSize(WIRE).name} stainless steel`, anchor: wirePts[3], explode: [0, 0, 16], labelOffset: [-120, 60], info: 'A rectangular working wire fills the slot, so the slot\'s built-in tip and torque are expressed. Initial alignment uses thin round NiTi wires (0.014 in).' });
// --- slot label on the bracket of 21 (the one thing to find when the bracket stands alone)
const t21 = teeth.find(t => t.fdi === 21), b21 = t21.part;
fig.part(b21, { inPlace: true, name: 'Slot', sub: `${DK.SLOTS[SLOT].name}`, accent: true, anchor: [b21.userData.width / 2 + 0.1, 0, b21.userData.floor + 0.2], when: e => e > 0.6, labelOffset: [90, 70], info: `The slot: ${DK.SLOTS[SLOT].w.toFixed(3)} mm high, ${DK.SLOTS[SLOT].d.toFixed(3)} mm deep. The wire is bent to the arch form; the slot's angles do the rest.` });

fig.standardControls({ explode: true, explodeLabel: 'Lift off' });
fig.view('Occlusal', { theta: 0, phi: 2.75, zoom: 1 });
fig.view('Front', { theta: 0, phi: 1.66, zoom: 1 });

// --- story: the arch from the front → the parts lift off as the camera orbits → push in on one bare bracket (the slot) →
// everything seats again on that bracket (wire in the slot, ring over the wings) → ease out to the three-quarter hero shot
const P21 = b21.position.clone(), N21 = t21.n;
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.66, zoom: 1, labels: [], caption: 'Brackets, tubes, ligatures and one archwire on the upper teeth.' },
  { dur: 2.4, hold: 2.0, theta: 0.6, phi: 1.5, explode: 1, labels: ['Bracket', 'Ligature', 'Archwire', 'Molar tube'], caption: 'Lifted off: the parts, in the order they go on.' },
  { dur: 2.0, hold: 2.2, zoom: 0.17, theta: 0.35, phi: 1.55, focus: P21.clone().addScaledVector(N21, 7).toArray(), labels: ['Slot', 'Bracket'], caption: 'The slot runs mesio-distally; its height and depth are standardised.' },
  { dur: 2.2, hold: 2.4, explode: 0, zoom: 0.2, focus: P21.toArray(), labels: ['Bracket', 'Ligature', 'Archwire'], caption: 'Seated: the wire lies in the slot and the ring over the wings holds it there.' },
  { dur: 2.2, hold: 2.0, zoom: fig.mode === 'image' ? 1.35 : 1, focus: 'auto', theta: HOME.theta, phi: HOME.phi, labels: ['Archwire', 'Molar tube', 'Bracket'], caption: '' }
]);
fig.start();
