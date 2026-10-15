// How to floss: the contact between the lower right first molar and second premolar (FDI 46 and 45 = Universal 30 and 29), crowns up.
// poster: step 2
// The floss is eased down through the contact, curved into a C against the mesial surface of 46, slid just under the gum and
// rubbed up and down, then curved against the distal surface of 45 and done again: both sides of every contact. Plaque on the
// two proximal surfaces below the contact comes off as it goes. Technique is standard patient teaching (not in dental-facts.md;
// §11 contact area, §13 healthy margin).
// Frame: tooth 46's, +x = mesial (toward 45), +z = buccal, y up, CEJ at y = 0. Floss height and wrap are params; the floss is
// rebuilt each frame from the crown outlines (DK.toothSurfaceAt), so it hugs each tooth.
const { smooth, lerp, clamp } = DK.util;
const M = 1.0;                       // gum margin on the cheek side, about 1 mm up on the enamel

const fig = DK.figure({
  fov: 30,
  title: 'How to floss',
  subtitle: 'Lower right first molar and second premolar, FDI 46 and 45 (Universal 30 and 29).',
  view: { theta: 0.35, phi: 0.95 }
});
const flossMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });

// ---------- teeth
const t46 = DK.tooth(46), s = t46.spec, t45 = DK.tooth(45), s5 = t45.spec;
const X45 = s.md / 2 + s5.md / 2 - 0.15; t45.group.position.x = X45;
const XC = s.md / 2 - 0.075;         // the contact plane between them
let CY = 0; { const p = t46.layers.enamel.geometry.attributes.position; let bx = -1e9; for (let i = 0; i < p.count; i++) { if (Math.abs(p.getZ(i)) < 0.6 && p.getY(i) > 1 && p.getX(i) > bx) { bx = p.getX(i); CY = p.getY(i); } } }
fig.part(t46.group, { name: 'Tooth 46', label: false, info: 'Lower right first molar (Universal 30).' });
fig.part(t45.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar (Universal 29).' });

// ---------- bone and gum (the papilla fills the space under the contact, up to about 1.5 mm below it)
const CX = X45 / 2, PAPTOP = CY - 1.6;
const bone = DK.bone({ width: 26, height: 9, depth: 11.5, cortical: 1.2, crest: 1.4 }); bone.position.set(CX, -1.8, 0);
const G0 = M - 0.8;
const gum = DK.gingiva({ width: 26.6, height: 5.2, depth: 12.4, crest: 1.3,
  around: [{ x: -CX, z: 0, md: s.mdC, bl: s.blC }, { x: X45 - CX, z: 0, md: s5.mdC, bl: s5.blC }],
  scallop: (x, z) => Math.max(0, PAPTOP - G0 - 1.08) * Math.exp(-Math.pow((x - (XC - CX)) / 1.25, 2)) * smooth(4.4, 3.0, Math.abs(z)) });
gum.position.set(CX, G0, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum, with the papilla filling the space under the contact.' });
fig.xray([gum]);

// ---------- plaque on the two surfaces that face each other, below the contact (closed lens-shaped films)
const plaqueMat = DK.mat('composite', { color: 0xc6a456, roughness: 0.95, cap: 0xc2a05a }); plaqueMat.transparent = true;
const film = (sp, thC, y0, y1, k) => DK.gridGeometry(24, 16, (i, j) => {
  const u = i / 24, th = thC + lerp(-0.75, 0.75, u), end = Math.sin(Math.PI * u), sa = j / 16 * Math.PI * 2;
  const yc = (y0 + y1) / 2, H = (y1 - y0) * (0.4 + 0.6 * Math.sqrt(end)), t = Math.max(0.02, 0.4 * k * Math.pow(end, 0.6));
  const y = yc - (H / 2) * Math.cos(sa), d = -0.06 + (t + 0.06) * (0.5 + 0.5 * Math.sin(sa));
  const q = DK.toothSurfaceAt(sp, y, th), r = Math.hypot(q.x, q.z) || 1; return [q.x + q.x / r * d, y, q.z + q.z / r * d];
}, null, null);
const mkPlaque = (tooth, thC) => { const m = new THREE.Mesh(film(tooth.spec, thC, PAPTOP - 1.2, CY - 0.7, 1), plaqueMat.clone()); tooth.group.add(m); m.userData.set = k => { const g2 = film(tooth.spec, thC, PAPTOP - 1.2, CY - 0.7, k), p = m.geometry.attributes.position; p.array.set(g2.attributes.position.array); p.needsUpdate = true; m.geometry.computeVertexNormals(); g2.dispose(); m.material.opacity = smooth(0, 0.3, k); m.visible = k > 0.02; }; return m; };
const pl46 = mkPlaque(t46, 0), pl45 = mkPlaque(t45, Math.PI);
fig.part(pl46, { inPlace: true, name: 'Plaque', sub: 'below the contact', anchor: (() => { const y = (PAPTOP + CY) / 2 - 0.6, q = DK.toothSurfaceAt(s, y, 0.55); return [q.x, y, q.z + 0.15]; })(), labelOffset: [-110, 40], dim: false, info: 'Plaque sits on the sides of the teeth below the contact, where the brush cannot reach. Left there it causes gum disease and decay between the teeth.' });

// ---------- the floss: a strand pulled tight between two hands above the teeth; at height h it runs cheek to tongue through
// the embrasure, wrap > 0 curves it into a C around 46's mesial surface, wrap < 0 around 45's distal surface
const F = { h: CY + 4, wrap: 0 };
const R = 0.16, NC = 41, NL = 10;
const flossPts = () => {
  const h = F.h, w = F.wrap, aw = Math.abs(w), core = [];
  const hy = clamp(h, 0.3, CY + 0.2);
  for (let i = 0; i < NC; i++) {
    const v = lerp(-1, 1, i / (NC - 1));
    const S = [XC, h, v * 5.2];
    let C = S;
    if (aw > 0.001) {
      const th = v * 1.35, q = w > 0 ? DK.toothSurfaceAt(s, hy, th) : DK.toothSurfaceAt(s5, hy, Math.PI - th), r = Math.hypot(q.x, q.z) || 1;
      const ox = w > 0 ? 0 : X45, cx = q.x + q.x / r * (R + 0.04), cz = q.z + q.z / r * (R + 0.04);
      C = [ox + cx, h, cz];
    }
    core.push([lerp(S[0], C[0], aw), h, lerp(S[2], C[2], aw)]);
  }
  const hand = sg => [XC - 6 * w, h + 40, sg * 18];   // the hands are far up and out of frame
  const lead = (a, b) => { const o = []; for (let i = 1; i <= NL; i++) { const t = i / NL; o.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); } return o; };
  return [...lead(core[0], hand(-1)).reverse(), ...core, ...lead(core[NC - 1], hand(1))];
};
let floss = DK.tube(flossPts(), R, flossMat); fig.world.add(floss);
const rebuild = () => { const n = DK.tube(flossPts(), R, flossMat); floss.geometry.dispose(); floss.geometry = n.geometry; };
const flossPart = fig.part(floss, { inPlace: true, name: 'Floss', sub: 'eased through the contact', anchor: () => { const p = flossPts()[NL + 6]; return [p[0], p[1], p[2]]; }, labelOffset: [90, -60], accent: true, dim: false, when: () => Math.abs(F.wrap) < 0.05, info: 'About 45 cm of floss wound round the middle fingers, a short taut piece between the thumbs and forefingers. Ease it through the contact with a gentle back-and-forth, never snap it into the gum.' });
const cPart = fig.part(floss, { inPlace: true, name: 'C-shape', sub: 'hugging the tooth', anchor: () => { const p = flossPts()[NL + Math.round(NC * 0.72)]; return [p[0], p[1], p[2]]; }, labelOffset: [100, -50], accent: true, dim: false, when: () => F.wrap > 0.5, info: 'Curve the floss into a C against one tooth so it wraps round the side, not just across the gap.' });
const underPart = fig.part(floss, { inPlace: true, name: 'Just under the gum', sub: 'up and down a few times', anchor: () => { const p = flossPts()[NL + Math.round(NC * 0.65)]; return [p[0], p[1], p[2]]; }, labelOffset: [110, 40], accent: true, dim: false, when: () => F.wrap > 0.5 && F.h < PAPTOP, info: 'Slide it gently into the shallow groove under the gum edge, then up and down the side of the tooth. A little bleeding at first usually settles within a week or two of daily flossing.' });
const otherPart = fig.part(floss, { inPlace: true, name: 'Other side', sub: 'same contact, next tooth', anchor: () => { const p = flossPts()[NL + Math.round(NC * 0.7)]; return [p[0], p[1], p[2]]; }, labelOffset: [110, -40], accent: true, dim: false, when: () => F.wrap < -0.5, info: 'Every contact has two surfaces: curve the floss against the neighbouring tooth and clean it the same way. Then a fresh piece of floss for the next contact.' });
const contactPart = fig.part(t46.layers.enamel, { inPlace: true, name: 'Contact point', anchor: (() => { const q = DK.toothSurfaceAt(s, CY, 0.3); return [q.x, CY, q.z]; })(), labelOffset: [-120, -40], dim: false, info: 'Where the two teeth touch. Below it is a small space filled by the gum papilla; that is where the floss works.' });

// ---------- params
fig.param('h', CY + 4, v => { F.h = v; rebuild(); });
fig.param('wrap', 0, v => { F.wrap = v; rebuild(); });
fig.param('show', 0, v => { floss.visible = v > 0.5; });
fig.param('p46', 1, k => pl46.userData.set(k));
fig.param('p45', 1, k => pl45.userData.set(k));
fig.standardControls({ explode: false });

// ---------- procedure
const UNDER = PAPTOP - 1.0, MID = (PAPTOP + CY) / 2;
const TOP = { theta: 0.55, phi: 0.5, zoom: 0.72, focus: [XC, CY, 0], fov: 30 };
const SIDE = { theta: 0.2, phi: 1.2, zoom: 0.62, focus: [XC, PAPTOP, 1.5], fov: 28 };
fig.procedure([
  { label: 'Slide between the teeth', caption: 'Ease the floss down through the contact with a gentle sawing motion.', beats: [
    { dur: 0, hold: 1.0, theta: 0.6, phi: 0.95, zoom: 1.0, focus: 'auto', xray: 0, labels: [], set: { h: CY + 4, wrap: 0, show: 1, p46: 1, p45: 1 } },
    { dur: 1.8, hold: 0.8, theta: 0.3, phi: 1.05, zoom: 0.72, focus: [XC, CY - 1, 1], labels: ['Plaque', 'Contact point'] },
    { dur: 2.2, hold: 1.6, set: { h: MID }, labels: ['Floss', 'Contact point'], key: true }] },
  { label: 'Curve it into a C', caption: 'Wrap it round the side of one tooth in a C.', beats: [
    Object.assign({ dur: 2.0, hold: 0.2, labels: [] }, TOP),
    { dur: 1.8, hold: 2.4, set: { wrap: 1 }, labels: ['C-shape'], key: true }] },
  { label: 'Just under the gum', caption: 'Slide it just under the gum, then up and down the tooth.', beats: [
    Object.assign({ dur: 2.0, hold: 0.2, xray: 0.6, labels: [] }, SIDE),
    { dur: 1.4, hold: 0.8, set: { h: UNDER }, labels: ['Just under the gum'], key: true },
    { dur: 1.0, hold: 0, set: { h: CY - 0.8, p46: 0.5 }, labels: ['Just under the gum'] },
    { dur: 1.0, hold: 0, set: { h: UNDER, p46: 0.15 } },
    { dur: 1.0, hold: 0.4, set: { h: MID, p46: 0 } }] },
  { label: 'Then the other tooth', caption: 'Curve it the other way, against the neighbour, and clean that side too.', beats: [
    Object.assign({ dur: 1.6, hold: 0.2, xray: 0, labels: [] }, TOP),
    { dur: 2.0, hold: 1.4, set: { wrap: -1 }, labels: ['Other side'], key: true },
    Object.assign({ dur: 1.6, hold: 0.2, xray: 0.6 }, SIDE),
    { dur: 1.0, hold: 0, set: { h: UNDER, p45: 0.6 } },
    { dur: 1.0, hold: 0, set: { h: CY - 0.8, p45: 0.2 } },
    { dur: 1.0, hold: 0.2, set: { h: MID, p45: 0 } },
    { dur: 1.4, hold: 0.2, set: { wrap: 0 }, xray: 0, labels: [] },
    { dur: 1.6, hold: 2.0, set: { h: CY + 4 }, theta: 0.3, phi: 1.05, zoom: 0.8, focus: [XC, CY - 1, 1], labels: ['Contact point'] }] }
]);
fig.start();
