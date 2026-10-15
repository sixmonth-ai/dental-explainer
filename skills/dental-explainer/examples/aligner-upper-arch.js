// Example: a clear aligner on the upper arch (FDI 16–26) with composite attachments: vertical rectangles on the canines
// (rotation), gingivally bevelled rectangles on the laterals (extrusion) and horizontal rectangles on the centrals (torque).
// Teeth from DK.arch (maxilla in the mouth: crowns down, left teeth mirrored). The aligner is ONE continuous shell
// (DK.alignerArch: rays cast from a spine through the crowns, 0.5 mm outside the enamel and the attachments, bridged across
// the contacts, trimmed at the gingival margin). A labio-lingual cut through 21 shows the shell over the enamel and the
// attachment inside its bump. Patient's right on the viewer's left. Arch frame: +x = patient's left, +z = anterior, y up. Sizes in mm.
const THICK = 0.5, HOME = { theta: 0.58, phi: 1.98 };
const fig = DK.figure({
  fov: 36,
  title: 'Clear aligner with attachments',
  subtitle: 'FDI 16–26 in the mouth. Shell ~0.5 mm; attachments are bonded composite.',
  view: Object.assign({ margin: 0.68 }, HOME)
});

// --- attachments per tooth (tooth frame: +x mesial, +z labial, y above the CEJ; gingival = −y)
const ATT = {
  3: s => ({ x: 0, y: s.crownL * 0.5, w: 2, h: 3, d: 1, bevel: null, why: 'Vertical rectangle on the canine: a grip for rotation and for keeping the crown from tipping.' }),
  2: s => ({ x: 0, y: s.crownL * 0.42, w: 3, h: 2, d: 1, bevel: 'gingival', why: 'Gingivally bevelled rectangle: the aligner pushes on the ledge that faces the gum, so it can extrude the lateral.' }),
  1: s => ({ x: 0, y: s.crownL * 0.45, w: 3, h: 2, d: 1, bevel: null, why: 'Horizontal rectangle: lets the aligner apply torque and holds it seated on the incisor.' })
};
// --- crowns with internal layers only on 21 for the cutaway; its short root stays inside the ridge
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26],
  build: (fdi, spec) => { spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 2.7) })); return DK.tooth(spec, { omit: fdi === 21 ? [] : ['dentin', 'pulp', 'root'] }); } });
fig.part(arch.group, { name: 'Upper arch', label: false, info: 'Maxillary teeth 16–26, in the mouth.' });
arch.group.updateMatrixWorld(true);
const teeth = [];
arch.teeth.forEach(({ fdi, tooth: t, spec: sp }) => {
  const p = fdi % 10;
  fig.part(t.group, { inPlace: true, name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  let att = null;
  if (ATT[p]) { const o = ATT[p](sp); att = DK.attachment(sp, o); t.group.add(att);
    fig.part(att, { inPlace: true, name: 'Attachment', sub: `composite, ${o.w} × ${o.h} × ${o.d} mm`, accent: true, label: fdi === 23, anchor: [0, 0, 0], labelOffset: [120, 40], info: o.why + ' Without attachments an aligner mostly tips crowns.' });
    att.userData.part.setAnchor(() => [o.x, o.y, DK.crownSurface(sp).at(0, o.y).p[2] + o.d]); }
  teeth.push({ fdi, t, att });
});
const t21 = teeth.find(t => t.fdi === 21), s21 = t21.t.spec, X21 = t21.t.group.getWorldPosition(new THREE.Vector3()).x;
// --- gingiva: a thin ridge along the arch with a free margin around each neck (DK.gingivaArch)
const ends = [teeth[0], teeth[teeth.length - 1]].map(o => { const s = arch.slots[o.fdi]; return [s.c[0] - s.t[0] * (s.md / 2 + 1), s.c[1] - s.t[1] * (s.md / 2 + 1)]; });
const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gingiva', label: false, fit: false, info: 'Attached gingiva and the alveolar ridge (schematic).' });

// --- the aligner: one shell cast from a spine through the middle of the crowns (world coordinates), glassy material
const spine = new THREE.CatmullRomCurve3([ends[0], ...teeth.map(o => arch.slots[o.fdi].c), ends[1]].map(c => new THREE.Vector3(c[0], -4.2, c[1])), false, 'centripetal');
const shell = DK.alignerArch(spine, teeth.map(o => o.t.layers.enamel).concat(teeth.filter(o => o.att).map(o => o.att)), { thickness: THICK, trimY: -0.9, segments: 220, around: 72 });
const onShell = (o, y, extra) => o.t.group.localToWorld(new THREE.Vector3(0, y, o.t.spec.bl / 2 + THICK + (extra || 0.1))).toArray();
const t22 = teeth.find(t => t.fdi === 22);
fig.part(shell, { name: 'Aligner', sub: `${THICK} mm shell`, anchor: onShell(t22, s21.crownL * 0.7), explode: [0, -10, 0], labelOffset: [-120, 70], info: 'Thermoformed polyurethane or PET-G, nominally 0.75 mm, ~0.4–0.55 mm after forming. Each aligner is built ~0.25 mm ahead of the teeth and worn ~22 h a day for 1–2 weeks.' });
fig.part(shell, { inPlace: true, name: 'Shell', sub: `${THICK} mm over the enamel`, anchor: onShell(t21, s21.crownL * 0.72, 0.15), labelOffset: [-100, -60], when: (e, sec) => sec.enabled, info: 'The shell stands a few hundredths of a millimetre off the enamel; the bump over the attachment is what grips the tooth.' });

// --- section through 21 (labio-lingual), the patient's left half (+x) removed, camera on +x
fig.enableSection([1, 0, 0], [
  { objects: [ridge], color: DK.COLORS.gingivaCap },
  ...teeth.map(o => ({ objects: [o.t.layers.enamel], color: DK.COLORS.enamelCap })),
  ...teeth.filter(o => o.fdi === 21).map(o => ({ objects: [o.t.layers.dentin, o.t.layers.root], color: DK.COLORS.dentinCap })),
  ...teeth.filter(o => o.fdi === 21).map(o => ({ objects: [o.t.layers.pulp], color: DK.COLORS.pulpCap })),
  { objects: teeth.filter(o => o.att).map(o => o.att), color: DK.COLORS.compositeCap, kind: 'plain' },
  { objects: [shell], color: 0xd9dee2, kind: 'plain' }
]);
fig.standardControls({ explode: true, explodeLabel: 'Lift off', section: { label: 'Cut', on: false, range: [X21 - 3, X21 + 3], offset: X21 } });
fig.view('Front', { fov: 36, theta: 0, phi: 1.66, zoom: 1, section: false });

// --- story: the arch with its aligner → the aligner drops away as the camera turns → push in on the canine attachment →
// seat it again → cut through the central incisor: the shell, the enamel and the attachment → ease out to the hero shot
const t23 = teeth.find(t => t.fdi === 23), P23 = t23.att.getWorldPosition(new THREE.Vector3()).toArray();
const P21 = t21.t.group.localToWorld(new THREE.Vector3(0, s21.crownL * 0.6, 0)).toArray();
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.66, zoom: 1, labels: ['Aligner'], caption: 'A clear aligner over the upper teeth.' },
  { dur: 2.4, hold: 1.8, theta: 0.6, phi: 1.5, explode: 1, labels: ['Aligner', 'Attachment'], caption: 'Lifted off: composite attachments stay on the teeth.' },
  { dur: 2.0, hold: 2.2, zoom: 0.22, theta: 0.7, phi: 1.55, focus: P23, labels: ['Attachment'], caption: 'Each attachment gives the plastic a ledge to push on.' },
  { fov: 26, dur: 2.0, hold: 1.2, explode: 0, zoom: 0.3, theta: 0.4, focus: P21, labels: ['Aligner'], caption: 'Seated: the shell bulges over every attachment.' },
  { dur: 0, hold: 0, section: true, offset: X21 + 7 },
  { dur: 2.2, hold: 2.6, theta: Math.PI / 2 - 0.15, phi: 1.5, zoom: 0.26, offset: X21, labels: ['Shell', 'Attachment'], caption: 'Cut through 21: 0.5 mm of plastic over the enamel, gripping the attachment.' },
  { fov: 36, dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: HOME.theta, phi: HOME.phi, section: false, labels: ['Aligner', 'Attachment'], caption: '' }
]);
fig.start();
