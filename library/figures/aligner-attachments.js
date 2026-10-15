// Story: composite attachments on an upper arch (FDI 16–26 in the mouth, crowns down) under one clear aligner, ending on a horizontal cut
// poster: end
// at attachment height through 13 and 14, seen from below: the shell hugs each bump, so it has a flat face to push on and can turn the tooth.
// Arch frame (DK.arch, maxilla 'jaw'): +x = patient's left, +z anterior, y up (crowns point to −y). Attachments: a vertical rectangle on the
// canines and a bevelled vertical rectangle on the first premolars (facts §19: 3–3.5 × 1.5–2 × 1 mm; rotation needs attachments). Sizes in mm.
const THICK = 0.5, HOME = { theta: 0.58, phi: 1.98 };
const fig = DK.figure({
  fov: 34,
  title: 'Aligner attachments',
  subtitle: 'Upper teeth in the mouth. Bumps on FDI 13 and 14 (Universal 6 and 5).',
  view: Object.assign({ margin: 0.7 }, HOME)
});
const CUT_Y = 4.6;                                   // attachment centre height above the CEJ (tooth frame), the same on 13 and 14 so one cut meets both
const ATT = {
  3: { w: 2, h: 3, d: 1, bevel: null, name: 'Attachment', why: 'A vertical rectangle of tooth-coloured composite, bonded to the enamel. The aligner presses on its flat side and turns the canine.' },
  4: { w: 2, h: 3, d: 1, bevel: 'distal', name: 'Bevelled attachment', why: 'A bevelled rectangle: thick on one side, ramped on the other, so the aligner pushes on one face only. Bevelled shapes rotated teeth better than plain ones in a small study.' }
};
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26],
  build: (fdi, spec) => { spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 2.0) })); return DK.tooth(spec); } });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Maxillary teeth 16–26, in the mouth.' });
arch.group.updateMatrixWorld(true);
const teeth = arch.teeth.map(({ fdi, tooth: t, spec: sp }) => {
  fig.part(t.group, { inPlace: true, name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi} (Universal ${DK.toothNumber(fdi, 'universal')}).` });
  const o = ATT[fdi % 10]; let att = null;
  if (o) { att = DK.attachment(sp, { x: 0, y: CUT_Y, w: o.w, h: o.h, d: o.d, bevel: o.bevel }); t.group.add(att); }
  return { fdi, t, sp, att, o };
});
const T = f => teeth.find(o => o.fdi === f), t13 = T(13), t14 = T(14);
[t13, t14].forEach(o => {
  const tip = () => { const q = DK.crownSurface(o.sp).at(0, CUT_Y); return q.p.map((v, k) => v + q.n[k] * (o.o.d + 0.1)); };
  fig.part(o.att, { inPlace: true, name: o.o.name, sub: o.o.bevel ? 'on 14' : 'on 13', accent: o.fdi === 13, anchor: tip(), dim: false,
    labelOffset: o.fdi === 13 ? [-110, 60] : [-120, -40], info: o.o.why });
});
[23, 24].forEach(f => fig.part(T(f).att, { inPlace: true, name: 'Attachment ' + f, label: false, info: 'The same attachments on the left side.' }));

const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gum', label: false, fit: false, info: 'Gum along the upper teeth (schematic).' });

// --- one continuous aligner, cast over the crowns and the attachments
const ends = [teeth[0], teeth[teeth.length - 1]].map(o => { const s = arch.slots[o.fdi]; return [s.c[0] - s.t[0] * (s.md / 2 + 1), s.c[1] - s.t[1] * (s.md / 2 + 1)]; });
const spine = new THREE.CatmullRomCurve3([ends[0], ...teeth.map(o => arch.slots[o.fdi].c), ends[1]].map(c => new THREE.Vector3(c[0], -4.2, c[1])), false, 'centripetal');
const shell = DK.alignerArch(spine, teeth.map(o => o.t.layers.enamel).concat(teeth.filter(o => o.att).map(o => o.att)), { thickness: THICK, trimY: -0.9, segments: 220, around: 72 });
const W = (o, p) => o.t.group.localToWorld(new THREE.Vector3(...p)).toArray();
const t12 = T(12);
fig.part(shell, { name: 'Aligner', sub: 'clear plastic shell', anchor: W(t12, [0, t12.sp.crownL * 0.72, t12.sp.bl / 2 + THICK + 0.2]), explode: [0, -11, 0], labelOffset: [-110, 60],
  info: 'Thermoformed plastic, about 0.4–0.55 mm thick once formed. Each aligner is made slightly ahead of the teeth and worn about 22 hours a day.' });

// --- horizontal cut at attachment height (crowns point down: the incisal half, −y, is removed; the camera looks up from below)
const PLANE_Y = -CUT_Y;
fig.enableSection([0, -1, 0], [
  { objects: [ridge], color: DK.COLORS.gingivaCap },
  ...teeth.map(o => ({ objects: [o.t.layers.enamel], color: DK.COLORS.enamelCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.dentin, o.t.layers.root], color: DK.COLORS.dentinCap })),
  ...teeth.map(o => ({ objects: [o.t.layers.pulp], color: DK.COLORS.pulpCap })),
  { objects: teeth.filter(o => o.att).map(o => o.att), color: DK.COLORS.compositeCap, kind: 'plain' },
  { objects: [shell], color: 0xd9dee2, kind: 'plain' }
]);

// --- markers on the cut (0.15 mm below the plane, facing the camera): the push on 13's attachment and the turn it makes
const MY = PLANE_Y - 0.15, N = [0, -1, 0];
const c13 = new THREE.Vector3(); t13.t.group.getWorldPosition(c13);
const face13 = new THREE.Vector3(...W(t13, (() => { const q = DK.crownSurface(t13.sp).at(-t13.o.w / 2 - 0.05, CUT_Y); return q.p.map((v, k) => v + q.n[k] * 0.55); })()));
const out13 = new THREE.Vector3(...W(t13, [0, CUT_Y, 0])).sub(new THREE.Vector3(c13.x, PLANE_Y, c13.z));
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd8d3c8 : 0x3a3a36), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const tg = new THREE.Vector3(...W(t13, [1, CUT_Y, 0])).sub(new THREE.Vector3(...W(t13, [0, CUT_Y, 0]))).normalize();   // mesial direction of 13 in the world
const nrm = new THREE.Vector3(...W(t13, [0, CUT_Y, 1])).sub(new THREE.Vector3(...W(t13, [0, CUT_Y, 0]))).normalize();  // labial direction
const pushFrom = face13.clone().addScaledVector(tg, -3.2).addScaledVector(nrm, 0.9).setY(MY), pushTo = face13.clone().addScaledVector(tg, -0.45).addScaledVector(nrm, 0.35).setY(MY);
const push = DK.arrow({ from: pushFrom.toArray(), to: pushTo.toArray(), width: 0.55, head: 1.2, normal: N, material: accentMat });
// rotation arc around 13's long axis
const R = t13.sp.bl / 2 + 2.6, a0 = Math.atan2(nrm.z, nrm.x), arc = [];
for (let i = 0; i <= 24; i++) { const a = a0 + 0.25 - 1.25 * i / 24; arc.push([c13.x + R * Math.cos(a), MY, c13.z + R * Math.sin(a)]); }
const turnLine = DK.ribbon(arc.slice(0, -2), 0.32, N, { material: inkMat });
const turnHead = DK.arrow({ from: arc[arc.length - 4], to: arc[arc.length - 1], width: 0.32, head: 1.0, normal: N, material: inkMat });
const turn = new THREE.Group(); turn.add(turnLine, turnHead);
const markers = new THREE.Group(); markers.add(push, turn);
fig.world.add(markers);
fig.part(push, { inPlace: true, name: 'Push', sub: 'aligner on the flat face', accent: false, anchor: pushFrom.toArray(), labelOffset: [-100, 40], dim: false, when: () => markers.visible,
  info: 'The plastic is shaped slightly ahead of the tooth. Where it meets the flat face of the attachment, it pushes.' });
fig.part(turn, { inPlace: true, name: 'Tooth turns', anchor: arc[4], labelOffset: [-90, -50], dim: false, when: () => markers.visible,
  info: 'A push off the centre of the tooth turns it about its long axis. On a smooth, round crown the plastic would mostly slip.' });
fig.param('marks', 0, v => { markers.visible = v > 0.02; accentMat.opacity = inkMat.opacity = v; });

fig.standardControls({ explode: true, explodeLabel: 'Lift off', section: { label: 'Cut', on: false, range: [1.5, 8], offset: CUT_Y } });

// story: the aligner on the teeth → it drops away, the bumps stay → push in on 13 and 14 → it seats again → the cut rises to the
// attachments from below → the push and the turn (teaching shot)
const F13 = new THREE.Vector3(...W(t13, [-1.5, CUT_Y, 2])).toArray();
const c14 = new THREE.Vector3(); t14.t.group.getWorldPosition(c14);
const FC = [c13.x * 0.45, PLANE_Y, c13.z - 7];
fig.view('From below', { fov: 28, theta: 0.25, phi: 2.72, zoom: 0.92, focus: FC, section: true, offset: CUT_Y });
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.66, zoom: 1, set: { marks: 0 }, labels: ['Aligner'] },
  { dur: 2.4, hold: 1.6, theta: -0.55, phi: 1.6, explode: 1, labels: ['Aligner', 'Attachment'] },
  { dur: 2.2, hold: 2.2, zoom: 0.6, theta: -0.75, phi: 1.62, focus: F13, labels: ['Attachment', 'Bevelled attachment'] },
  { fov: 28, dur: 2.0, hold: 1.0, explode: 0, labels: ['Aligner'] },
  { dur: 0, hold: 0, section: true, offset: 12 },
  { dur: 2.6, hold: 1.0, theta: 0.25, phi: 2.72, zoom: 0.92, focus: FC, offset: CUT_Y, labels: ['Attachment', 'Bevelled attachment'] },
  { dur: 1.4, hold: 3.0, set: { marks: 1 }, labels: ['Attachment', 'Push', 'Tooth turns'], drift: 0 }
]);
fig.start();
