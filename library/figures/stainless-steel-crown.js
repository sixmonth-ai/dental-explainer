// Library: a stainless steel crown on the lower left second primary molar (FDI 75 = Universal K), crown up in its bone with the second premolar (35) forming below; procedure in a mesio-distal cut. Frame: tooth frame mirrored (scale.x = -1, a left tooth), CEJ at y = 0, +z buccal; seen from the cheek, mesial is on the viewer's left.
// poster: step 4
// Teaching point: a preformed steel crown covers the whole of a badly decayed baby molar; the tooth is trimmed only a little
// (top and the two contact sides), the crown is cemented on and snaps under the bulge at the gum line, and it stays until
// the tooth falls out. Reductions are shown without numbers (dental-facts.md has none for primary crowns).
const FDI = 75, MX = -1;
const fig = DK.figure({
  fov: 26,
  title: 'Steel crown for a baby molar',
  subtitle: 'Lower left second baby molar, FDI 75 (Universal K), cut front to back.',
  view: { theta: 0.5, phi: 1.2 }
});

// --- the intact tooth (with decay), the prepared tooth (roots + morphing crown), successor and context
const intact = DK.tooth(FDI), s = intact.spec, LI = intact.layers;
const tooth = DK.tooth(s, { omit: ['enamel', 'dentin'] }), LT = tooth.layers;
const PREPC = { occlusal: 0.8, axial: 0.45, margin: 0.05 };                // light reduction, feather-edge margin
const prep = DK.prepMorph(s, PREPC); tooth.group.add(prep);
[intact, tooth].forEach(t => { t.group.scale.x = MX; });
const CREST = -1.4;
const bone = DK.bone({ width: 19, height: 21, depth: 12, cortical: 1.1, crest: 1.4 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 19, height: 3.0, depth: 12.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.1;
const succ = DK.tooth(DK.toothPreset(35, { develop: 0.06 })), ss = succ.spec;
succ.group.scale.x = MX; succ.group.position.set(0.2 * MX, -7.4 - ss.crownL, 0.2);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the baby molar.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth; the crown edge sits just under it.' });
fig.part(succ.group, { name: 'Adult premolar', sub: 'forming below', fit: false, anchor: [0, ss.crownL * 0.5, 0], dim: false,
  info: 'The second premolar (FDI 35) forms between the roots. The crowned baby molar holds its place until it falls out at about 11 to 13 years.' });
fig.part(intact.group, { name: 'Baby molar', label: false, info: 'Lower left second primary molar: thin enamel, a large pulp, and a bulge at the gum line.' });
fig.part(tooth.group, { name: 'Baby molar ', label: false, info: 'The baby molar being crowned.' });

// --- decay, the cleaned cavity and its filling
const lesion = DK.cariesLesion(intact, { site: 'occlusal', at: [0.15, 0.2], size: 1.6, stage: 4.0, reactionary: false });
const M = lesion.meshes, A = lesion.axis;
const CAV = { class: 1, center: [0.3, 0.2], length: s.md * 0.5, isthmus: s.bl * 0.4, depth: 1.0 };
const cav = DK.cavityPrep(intact, CAV); cav.set(0, 0);
const fill = DK.filling(intact, CAV, 'gic'); fill.position.y = 0.02; tooth.group.add(fill);
const FILL_CUT = s.crownL - PREPC.occlusal - 0.25;                          // after trimming, the filling is level with the trimmed top

// --- the steel crown: a thin shell of the tooth's own shape, cemented over the trimmed tooth
const SHELL = { axial: 0.2, occlusal: 0.25, margin: 0.2 };
const crown = DK.restorationCrown(s, 'steel', SHELL);
const cement = new THREE.Mesh(DK.crownGeometry(s, { side: SHELL.axial, top: SHELL.occlusal, reliefScale: 0.45, topScale: 0.9, cervical: 1 }), DK.mat('gic', { cap: DK.COLORS.gic }));
const seat = new THREE.Group(); seat.add(crown, cement); tooth.group.add(seat);

// label anchors in the cut plane (tooth frame)
const CUT = 1.15;
const cutOn = (e, sec) => sec.enabled;
fig.part(M.infected, { inPlace: true, name: 'Decay', sub: 'deep in the dentin', anchor: () => lesion.point(A.enamel + A.dentin * 0.35, 1.0, 12), dim: false, when: () => M.infected.visible && intact.group.visible,
  info: 'Thin baby enamel lets decay spread wide through the dentin; a big filling alone would not hold up.' });
fig.part(fill, { inPlace: true, name: 'Filling', sub: 'decay removed', anchor: [0.3, s.crownL - 1.9, CUT], dim: false, when: () => fill.visible,
  info: 'The decay is cleaned out and the hole filled (here glass ionomer) before the tooth is shaped.' });
fig.part(prep, { inPlace: true, name: 'Trimmed tooth', sub: 'top and sides', accent: true, anchor: [s.md / 2 - PREPC.axial - 0.1, s.crownL * 0.5, CUT], dim: false, when: () => prep.visible,
  info: 'Only a little is removed: the top is lowered and the front and back contacts are sliced so the crown slips past the neighbours. The cheek and tongue sides are mostly left.' });
fig.part(crown, { inPlace: true, name: 'Steel crown', sub: 'preformed', accent: false, anchor: [-(s.md / 2) + 0.4, s.crownL * 0.62, 1.6], dim: false, when: () => crown.visible,
  info: 'A ready-made stainless steel crown, chosen by size and trimmed and crimped so its edge hugs the tooth just under the gum. It covers every surface, so new decay cannot get in.' });
fig.part(cement, { inPlace: true, name: 'Cement', anchor: [s.md / 2 - 0.35, s.crownL * 0.35, CUT], dim: false, when: (e, sec) => sec.enabled && cement.visible && seat.position.y < 0.3,
  info: 'Glass-ionomer cement fills the space between the crown and the tooth and holds the crown on.' });
fig.part(LT.pulp, { inPlace: true, name: 'Pulp', sub: 'untouched', anchor: [0.4, 0.8, CUT], dim: false, when: (e, sec) => sec.enabled && LT.pulp.visible,
  info: 'The pulp is not touched when the decay stops short of it. If it reaches the pulp, a pulpotomy comes first.' });

// --- tools (fig.world), placed from tooth-frame points
const W = (x, y, z) => [x * MX, y, z];
const bur = DK.bur({ shape: 'taper', diameter: 1.2 });
const ball = DK.bur({ shape: 'round', diameter: 1.4, head: 1.4, length: 14 });
[bur, ball].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(bur, { inPlace: true, name: 'Bur', sub: 'trims the tooth', anchor: [0, 8, 0], info: 'A tapered diamond lowers the top and slices the contact sides.' });
fig.part(ball, { inPlace: true, name: 'Round bur', anchor: [0, 6, 0], info: 'Removes the decay.' });

// --- params
const cut = { inc: 0, ax: 0 };
const reshape = () => {
  const on = cut.inc > 0.001 || cut.ax > 0.001;
  intact.group.visible = !on; prep.visible = on; LT.root.visible = on; LT.pulp.visible = on;
  prep.set(cut.inc, cut.ax);
  if (fill.visible) fill.slice(-1e9, on ? FILL_CUT + (1 - cut.inc) * (PREPC.occlusal + 2) : 99);
};
fig.param('inc', 0, v => { cut.inc = v; reshape(); });
fig.param('ax', 0, v => { cut.ax = v; reshape(); });
fig.param('cav', 0, k => { cav.set(k, 0); lesion.set(4.0, { removed: Math.min(1, k * 1.2) }); });
fig.param('fill', 0, k => { fill.visible = k > 0.01; cav.visible = k < 0.99; if (fill.visible) fill.slice(-1e9, cav.dims.floorY + (s.crownL + 1.5 - cav.dims.floorY) * k); });
fig.param('crown', 0, k => { seat.visible = k > 0.001; seat.position.y = k > 0.001 ? (1 - k) * 8 : 0; });
fig.param('cem', 0, k => { cement.visible = k > 0.5; });
const b = { bx: 0, by: 40, bz: 0, tilt: 0, rx: 0, ry: 40 };
Object.keys(b).forEach(k => fig.param(k, b[k], v => {
  b[k] = v; bur.visible = b.by < 30; bur.position.set(...W(b.bx, b.by, b.bz)); bur.rotation.z = b.tilt * MX;
  ball.visible = b.ry < 30; ball.position.set(...W(b.rx, b.ry, CUT - 0.3));
}));

const T = [intact, tooth, succ];
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [cement], color: DK.COLORS.gic, kind: 'plain' },
  { objects: [LI.enamel, succ.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [LI.root, LI.dentin, LT.root, prep, succ.layers.root, succ.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [LI.pulp, LT.pulp, succ.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.reactionary], color: DK.COLORS.reactionary, kind: 'dentin' },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [cav], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [fill], color: DK.COLORS.gic, kind: 'plain' },
  { objects: [crown], color: DK.COLORS.steel }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });

// --- the procedure (camera on +z, the cheek side; mesial on the viewer's left)
const TOP = s.crownL, FC = [0, 3.0, CUT], HALF = s.md / 2;
const park = { by: 40, ry: 40 };
fig.procedure([
  { label: 'Badly decayed', caption: 'Decay has spread through a baby molar.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 1.2, zoom: 1.0, section: false, labels: ['Adult premolar'] },
    { fov: 26, dur: 2.0, hold: 0.1, theta: 0.04, phi: 1.45, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.3, offset: CUT, labels: [] },
    { dur: 1.8, hold: 1.8, zoom: 0.74, focus: FC, labels: ['Decay'], key: true }] },
  { label: 'Clean and fill', caption: 'The decay is removed and the hole filled.', beats: [
    { dur: 0.9, hold: 0.1, set: { rx: 1.2, ry: TOP + 1.4 }, labels: ['Round bur'] },
    { dur: 2.2, hold: 0.2, ease: 'linear', set: { cav: 1, rx: -0.6, ry: TOP - 2.2 }, labels: ['Round bur'] },
    { dur: 0.7, hold: 0.1, set: park, labels: [] },
    { dur: 1.6, hold: 1.6, set: { fill: 1 }, labels: ['Filling'], key: true }] },
  { label: 'Trim the tooth', caption: 'The top is lowered and the contact sides sliced.', beats: [
    { dur: 1.0, hold: 0.1, set: { bx: HALF + 1, by: TOP + 0.3, bz: CUT - 0.4, tilt: 1.35 }, labels: ['Bur'] },
    { dur: 1.8, hold: 0.1, ease: 'linear', set: { inc: 1, bx: -HALF - 1, by: TOP - PREPC.occlusal + 0.4 }, labels: ['Bur'] },
    { dur: 0.6, hold: 0, set: { bx: -HALF + 0.1, by: 0.2, tilt: 0.12 } },
    { dur: 1.2, hold: 0.1, set: { ax: 0.5 }, labels: ['Bur'] },
    { dur: 0.6, hold: 0, set: { bx: HALF - 0.1, tilt: -0.12 } },
    { dur: 1.2, hold: 0.1, set: { ax: 1 } },
    { dur: 0.7, hold: 1.6, set: park, labels: ['Trimmed tooth', 'Filling'], key: true }] },
  { label: 'Cement the crown', caption: 'The steel crown, filled with cement, is pressed on and snaps under the bulge.', beats: [
    { dur: 1.2, hold: 0.2, zoom: 0.9, focus: [0, 4.5, CUT], set: { cem: 1, crown: 0.35 }, labels: ['Steel crown'] },
    { dur: 1.8, hold: 1.8, zoom: 0.78, focus: FC, set: { crown: 1 }, labels: ['Steel crown', 'Cement', 'Trimmed tooth'], key: true }] },
  { label: 'Covered until it falls out', caption: 'The crown covers the whole tooth until it falls out naturally.', beats: [
    { dur: 2.6, hold: 2.6, theta: 0.3, phi: 1.36, zoom: 1.1, focus: [0, -3.2, CUT], drift: 0, labels: ['Steel crown', 'Pulp', 'Adult premolar'], key: true }] }
]);
fig.start();
