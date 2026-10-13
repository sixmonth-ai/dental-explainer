// Example: a clear aligner on the upper arch (FDI 16–26) with composite attachments: vertical rectangles on the canines
// (rotation), gingivally bevelled rectangles on the laterals (extrusion) and horizontal rectangles on the centrals (torque).
// The aligner is one shell per crown (DK.aligner, 0.5 mm, bulging over each attachment), lifted off together; a labio-lingual
// cut through 21 shows the shell over the enamel and the attachment inside its bump. Upper teeth in the mouth (crowns down),
// patient's right on the viewer's left. Figure frame: +x = patient's left, +z = anterior, y up. Sizes in mm.
const THICK = 0.5;
const fig = DK.figure({
  title: 'Clear aligner with attachments',
  subtitle: 'FDI 16–26 in the mouth. Shell ~0.5 mm; attachments are bonded composite.',
  view: { theta: 0, phi: 1.7 }
});

// --- arch form (private helper, as in braces-upper-arch.js)
const zOf = x => -(0.01347 * x * x + 4.13e-5 * Math.pow(x, 4));
const ARC = []; { let L = 0; for (let x = 0; x <= 40; x += 0.05) { if (x) L += Math.hypot(0.05, zOf(x) - zOf(x - 0.05)); ARC.push([x, L]); } }
const archAt = s => { const a = Math.abs(s); let k = ARC.findIndex(p => p[1] >= a); if (k < 1) k = 1;
  const x = (ARC[k - 1][0] + (a - ARC[k - 1][1]) / (ARC[k][1] - ARC[k - 1][1]) * 0.05) * Math.sign(s || 1);
  const dz = -(2 * 0.01347 * x + 4 * 4.13e-5 * Math.pow(x, 3)); return { x, z: zOf(x), n: new THREE.Vector3(-dz, 0, 1).normalize() }; };
const ridgeCurve = new THREE.CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => { const x = -32 + i * 2; return new THREE.Vector3(x, 5.5, zOf(x)); }));
const ridge = new THREE.Mesh(DK.sweepGeometry(ridgeCurve, DK.roundedRect(5.5, 6, 2), { segments: 120, radial: 48 }), DK.mat('gingiva'));
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic).' });

// --- attachments per tooth (tooth frame: +x mesial, +z labial, y above the CEJ; gingival = −y)
const ATT = {
  3: s => ({ x: 0, y: s.crownL * 0.5, w: 2, h: 3, d: 1, bevel: null, why: 'Vertical rectangle on the canine: a grip for rotation and for keeping the crown from tipping.' }),
  2: s => ({ x: 0, y: s.crownL * 0.42, w: 3, h: 2, d: 1, bevel: 'gingival', why: 'Gingivally bevelled rectangle: the aligner pushes on the ledge that faces the gum, so it can extrude the lateral.' }),
  1: s => ({ x: 0, y: s.crownL * 0.45, w: 3, h: 2, d: 1, bevel: null, why: 'Horizontal rectangle: lets the aligner apply torque and holds it seated on the incisor.' })
};
const teeth = [], shells = [], order = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], centres = {};
[1, 2].forEach(q => { let s = 0; for (let p = 1; p <= 6; p++) { const fdi = q * 10 + p, md = DK.toothPreset(fdi).md; centres[fdi] = (s + md / 2) * (q === 1 ? -1 : 1); s += md; } });
order.forEach(fdi => {
  const spec = DK.toothPreset(fdi); spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 10) }));   // roots stay inside the ridge
  const t = DK.tooth(spec), sp = t.spec, q = Math.floor(fdi / 10), p = fdi % 10, a = archAt(centres[fdi]);
  t.group.position.set(a.x, 0, a.z); t.group.scale.set(q === 2 ? -1 : 1, -1, 1); t.group.rotation.y = Math.atan2(a.n.x, a.n.z);
  fig.part(t.group, { name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  t.group.updateMatrixWorld(true);
  let att = null, bumps = [];
  if (ATT[p]) { const o = ATT[p](sp); att = DK.attachment(sp, o); t.group.add(att); bumps = [att.userData.spec];
    fig.part(att, { inPlace: true, name: 'Attachment', sub: `composite, ${o.w} × ${o.h} × ${o.d} mm`, accent: true, label: fdi === 23, anchor: [0, 0, 0], labelOffset: [120, 40], info: o.why + ' Without attachments an aligner mostly tips crowns.' }); }
  if (att) att.userData.part.setAnchor(() => [att.userData.spec.x, att.userData.spec.y, DK.crownSurface(sp).at(0, att.userData.spec.y).p[2] + att.userData.spec.d]);
  const shell = DK.aligner(sp, { thickness: THICK, bumps }); shell.updateMatrix(); shell.applyMatrix4(t.group.matrixWorld);
  fig.part(shell, { name: 'Aligner', sub: `${THICK} mm shell`, label: fdi === 22, anchor: [0, sp.crownL * 0.75, sp.bl / 2 + THICK + 0.1], explode: [0, -10, 0], labelOffset: [-120, 70], info: 'Thermoformed polyurethane or PET-G, nominally 0.75 mm, ~0.4–0.55 mm after forming. Each aligner is built ~0.25 mm ahead of the teeth and worn ~22 h a day for 1–2 weeks.' });
  teeth.push({ fdi, t, a, att, shell }); shells.push(shell);
});
const t21 = teeth.find(t => t.fdi === 21), s21 = t21.t.spec, X21 = t21.t.group.position.x;
fig.part(t21.shell, { inPlace: true, name: 'Shell', sub: `${THICK} mm over the enamel`, anchor: [0.15, s21.crownL * 0.72, s21.bl / 2 + THICK + 0.1], labelOffset: [-100, -60], when: (e, sec) => sec.enabled, info: 'The shell stands a few hundredths of a millimetre off the enamel; the bump over the attachment is what grips the tooth.' });

// --- section through 21 (labio-lingual), the patient's left half (+x) removed, camera on +x
fig.enableSection([1, 0, 0], [
  { objects: [ridge], color: DK.COLORS.gingivaCap },
  ...teeth.map(o => ({ objects: [o.t.layers.enamel], color: DK.COLORS.enamelCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.dentin, o.t.layers.root], color: DK.COLORS.dentinCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.pulp], color: DK.COLORS.pulpCap })),
  { objects: teeth.filter(o => o.att).map(o => o.att), color: 0xe2dac8, kind: 'plain' },
  { objects: shells, color: 0xd9dee2, kind: 'plain' }
]);
fig.standardControls({ explode: true, explodeLabel: 'Lift off', section: { label: 'Cut', on: false, range: [X21 - 3, X21 + 3], offset: X21 } });
fig.view('Front', { theta: 0, phi: 1.7, zoom: 1, section: false });

// --- story: the arch with its aligner → the aligner drops away as the camera turns → push in on the canine attachment →
// seat it again → cut through the central incisor: the shell, the enamel and the attachment → ease out
const t23 = teeth.find(t => t.fdi === 23), P23 = t23.att.getWorldPosition(new THREE.Vector3()).toArray();
const P21 = t21.t.group.localToWorld(new THREE.Vector3(0, s21.crownL * 0.6, 0)).toArray();
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.7, zoom: 1.02, labels: ['Aligner'], caption: 'A clear aligner over the upper teeth.' },
  { dur: 2.4, hold: 1.8, theta: 0.55, phi: 1.5, explode: 1, labels: ['Aligner', 'Attachment'], caption: 'Lifted off: composite attachments stay on the teeth.' },
  { dur: 2.0, hold: 2.2, zoom: 0.22, theta: 0.7, phi: 1.55, focus: P23, labels: ['Attachment'], caption: 'Each attachment gives the plastic a ledge to push on.' },
  { dur: 2.0, hold: 1.2, explode: 0, zoom: 0.3, theta: 0.4, focus: P21, labels: ['Aligner'], caption: 'Seated: the shell bulges over every attachment.' },
  { dur: 0, hold: 0, section: true, offset: X21 + 7 },
  { dur: 2.2, hold: 2.6, theta: Math.PI / 2 - 0.15, phi: 1.5, zoom: 0.26, offset: X21, labels: ['Shell', 'Attachment'], caption: 'Cut through 21: 0.5 mm of plastic over the enamel, gripping the attachment.' },
  { dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: 0.3, phi: 1.65, section: false, labels: ['Aligner', 'Attachment'], caption: '' }
]);
fig.start();
