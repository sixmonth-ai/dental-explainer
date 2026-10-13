// Example: a clear aligner on the upper arch (FDI 16–26) with composite attachments: vertical rectangles on the canines
// (rotation), gingivally bevelled rectangles on the laterals (extrusion) and horizontal rectangles on the centrals (torque).
// The aligner is ONE continuous shell (DK.alignerArch: rays cast from a spine through the crowns, 0.5 mm outside the enamel
// and the attachments, bridged across the contacts, trimmed at the gingival margin). A labio-lingual cut through 21 shows
// the shell over the enamel and the attachment inside its bump. Upper teeth in the mouth (crowns down), patient's right on
// the viewer's left. Figure frame: +x = patient's left, +z = anterior, y up. Sizes in mm.
const THICK = 0.5, HOME = { theta: 0.6, phi: 1.72 };
const fig = DK.figure({
  title: 'Clear aligner with attachments',
  subtitle: 'FDI 16–26 in the mouth. Shell ~0.5 mm; attachments are bonded composite.',
  view: Object.assign({ margin: 0.46 }, HOME)
});

// --- arch form (private helper, as in braces-upper-arch.js)
const zOf = x => -(0.01347 * x * x + 4.13e-5 * Math.pow(x, 4));
const ARC = []; { let L = 0; for (let x = 0; x <= 40; x += 0.05) { if (x) L += Math.hypot(0.05, zOf(x) - zOf(x - 0.05)); ARC.push([x, L]); } }
const archAt = s => { const a = Math.abs(s); let k = ARC.findIndex(p => p[1] >= a); if (k < 1) k = 1;
  const x = (ARC[k - 1][0] + (a - ARC[k - 1][1]) / (ARC[k][1] - ARC[k - 1][1]) * 0.05) * Math.sign(s || 1);
  const dz = -(2 * 0.01347 * x + 4 * 4.13e-5 * Math.pow(x, 3)); return { x, z: zOf(x), n: new THREE.Vector3(-dz, 0, 1).normalize() }; };

// --- attachments per tooth (tooth frame: +x mesial, +z labial, y above the CEJ; gingival = −y)
const ATT = {
  3: s => ({ x: 0, y: s.crownL * 0.5, w: 2, h: 3, d: 1, bevel: null, why: 'Vertical rectangle on the canine: a grip for rotation and for keeping the crown from tipping.' }),
  2: s => ({ x: 0, y: s.crownL * 0.42, w: 3, h: 2, d: 1, bevel: 'gingival', why: 'Gingivally bevelled rectangle: the aligner pushes on the ledge that faces the gum, so it can extrude the lateral.' }),
  1: s => ({ x: 0, y: s.crownL * 0.45, w: 3, h: 2, d: 1, bevel: null, why: 'Horizontal rectangle: lets the aligner apply torque and holds it seated on the incisor.' })
};
const teeth = [], order = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], centres = {};
let sEnd = 0;
[1, 2].forEach(q => { let s = 0; for (let p = 1; p <= 6; p++) { const fdi = q * 10 + p, md = DK.toothPreset(fdi).md; centres[fdi] = (s + md / 2) * (q === 1 ? -1 : 1); s += md; } sEnd = s; });
order.forEach(fdi => {
  const spec = DK.toothPreset(fdi); spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 4.2) }));   // roots stay inside the 6 mm ridge (its top corners are rounded)
  const t = DK.tooth(spec), sp = t.spec, q = Math.floor(fdi / 10), p = fdi % 10, a = archAt(centres[fdi]);
  t.group.position.set(a.x, 0, a.z); t.group.scale.set(q === 2 ? -1 : 1, -1, 1); t.group.rotation.y = Math.atan2(a.n.x, a.n.z);
  fig.part(t.group, { name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  t.group.updateMatrixWorld(true);
  let att = null;
  if (ATT[p]) { const o = ATT[p](sp); att = DK.attachment(sp, o); t.group.add(att);
    fig.part(att, { inPlace: true, name: 'Attachment', sub: `composite, ${o.w} × ${o.h} × ${o.d} mm`, accent: true, label: fdi === 23, anchor: [0, 0, 0], labelOffset: [120, 40], info: o.why + ' Without attachments an aligner mostly tips crowns.' });
    att.userData.part.setAnchor(() => [o.x, o.y, DK.crownSurface(sp).at(0, o.y).p[2] + o.d]); }
  teeth.push({ fdi, t, a, att });
});
const t21 = teeth.find(t => t.fdi === 21), s21 = t21.t.spec, X21 = t21.t.group.position.x;

// --- gingiva: a ridge swept along the arch, its lower face dropping into a free margin around each neck (see braces example)
const HW = 3, cuff = (X, Z) => { let v = 0; teeth.forEach(o => { const g = o.t.group, ph = g.rotation.y, dx = X - g.position.x, dz = Z - g.position.z, lx = Math.cos(ph) * dx - Math.sin(ph) * dz, lz = Math.sin(ph) * dx + Math.cos(ph) * dz;
  const a = o.t.spec.mdC / 2, b = o.t.spec.blC / 2, rho = Math.pow(Math.pow(Math.abs(lx) / a, 2.3) + Math.pow(Math.abs(lz) / b, 2.3), 1 / 2.3); v += 0.8 * DK.util.smooth(1.6, 0.1, (rho - 1) * Math.min(a, b)); }); return Math.min(v, 1.1); };
const ridgeCurve = new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => { const a = archAt(-(sEnd + 2) + 2 * (sEnd + 2) * i / 40); return new THREE.Vector3(a.x, HW, a.z); }));   // ends just behind the first molars
const emin = (X, Z) => { let v = 0; teeth.forEach(o => { const g = o.t.group, ph = g.rotation.y, dx = X - g.position.x, dz = Z - g.position.z, lx = Math.cos(ph) * dx - Math.sin(ph) * dz, lz = Math.sin(ph) * dx + Math.cos(ph) * dz;
  if (lz > 0) v += Math.exp(-2.5 * Math.pow(lx / (o.t.spec.mdC / 2), 2)); }); return Math.min(v, 1); };   // alveolar eminences over the roots on the labial face
const rr = t => DK.roundedRect(HW, 4.8 + 1.9 * DK.util.smooth(0.5, 0.8, Math.abs(t - 0.5) * 2), 2.4);   // wider at the molars (BL 11 mm)
const ridge = new THREE.Mesh(DK.sweepGeometry(ridgeCurve, (s, t, f) => { let [a, b] = rr(t)(s); const X = f.P.x + f.U.x * a + f.N.x * b, Z = f.P.z + f.U.z * a + f.N.z * b, w = DK.util.smooth(-HW + 1.5, -HW + 0.2, a);
  if (w > 0) a -= w * cuff(X, Z); if (b > 0.3) b += 0.7 * emin(X, Z) * (1 - (a + HW) / (2 * HW)) * DK.util.smooth(0.3, 2.5, b); return [a, b]; }, { segments: 220, radial: 64 }), DK.mat('gingiva'));
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic).' });

// --- the aligner: one shell cast from a spine through the middle of the crowns (world coordinates)
const spine = new THREE.CatmullRomCurve3(Array.from({ length: 49 }, (_, i) => { const a = archAt(-sEnd - 1 + (2 * sEnd + 2) * i / 48); return new THREE.Vector3(a.x, -4.2, a.z); }));
const shell = DK.alignerArch(spine, teeth.map(o => o.t.layers.enamel).concat(teeth.filter(o => o.att).map(o => o.att)), { thickness: THICK, trimY: -0.9, segments: 150, around: 44 });
const onShell = (o, y, extra) => o.t.group.localToWorld(new THREE.Vector3(0, y, o.t.spec.bl / 2 + THICK + (extra || 0.1))).toArray();
const t22 = teeth.find(t => t.fdi === 22);
fig.part(shell, { name: 'Aligner', sub: `${THICK} mm shell`, anchor: onShell(t22, s21.crownL * 0.7), explode: [0, -10, 0], labelOffset: [-120, 70], info: 'Thermoformed polyurethane or PET-G, nominally 0.75 mm, ~0.4–0.55 mm after forming. Each aligner is built ~0.25 mm ahead of the teeth and worn ~22 h a day for 1–2 weeks.' });
fig.part(shell, { inPlace: true, name: 'Shell', sub: `${THICK} mm over the enamel`, anchor: onShell(t21, s21.crownL * 0.72, 0.15), labelOffset: [-100, -60], when: (e, sec) => sec.enabled, info: 'The shell stands a few hundredths of a millimetre off the enamel; the bump over the attachment is what grips the tooth.' });

// --- section through 21 (labio-lingual), the patient's left half (+x) removed, camera on +x
fig.enableSection([1, 0, 0], [
  { objects: [ridge], color: DK.COLORS.gingivaCap },
  ...teeth.map(o => ({ objects: [o.t.layers.enamel], color: DK.COLORS.enamelCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.dentin, o.t.layers.root], color: DK.COLORS.dentinCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.pulp], color: DK.COLORS.pulpCap })),
  { objects: teeth.filter(o => o.att).map(o => o.att), color: 0xe2dac8, kind: 'plain' },
  { objects: [shell], color: 0xd9dee2, kind: 'plain' }
]);
fig.standardControls({ explode: true, explodeLabel: 'Lift off', section: { label: 'Cut', on: false, range: [X21 - 3, X21 + 3], offset: X21 } });
fig.view('Front', { theta: 0, phi: 1.72, zoom: 1, section: false });

// --- story: the arch with its aligner → the aligner drops away as the camera turns → push in on the canine attachment →
// seat it again → cut through the central incisor: the shell, the enamel and the attachment → ease out to the hero shot
const t23 = teeth.find(t => t.fdi === 23), P23 = t23.att.getWorldPosition(new THREE.Vector3()).toArray();
const P21 = t21.t.group.localToWorld(new THREE.Vector3(0, s21.crownL * 0.6, 0)).toArray();
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.72, zoom: 1, labels: ['Aligner'], caption: 'A clear aligner over the upper teeth.' },
  { dur: 2.4, hold: 1.8, theta: 0.7, phi: 1.5, explode: 1, labels: ['Aligner', 'Attachment'], caption: 'Lifted off: composite attachments stay on the teeth.' },
  { dur: 2.0, hold: 2.2, zoom: 0.22, theta: 0.7, phi: 1.55, focus: P23, labels: ['Attachment'], caption: 'Each attachment gives the plastic a ledge to push on.' },
  { dur: 2.0, hold: 1.2, explode: 0, zoom: 0.3, theta: 0.4, focus: P21, labels: ['Aligner'], caption: 'Seated: the shell bulges over every attachment.' },
  { dur: 0, hold: 0, section: true, offset: X21 + 7 },
  { dur: 2.2, hold: 2.6, theta: Math.PI / 2 - 0.15, phi: 1.5, zoom: 0.26, offset: X21, labels: ['Shell', 'Attachment'], caption: 'Cut through 21: 0.5 mm of plastic over the enamel, gripping the attachment.' },
  { dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: HOME.theta, phi: HOME.phi, section: false, labels: ['Aligner', 'Attachment'], caption: '' }
]);
fig.start();
