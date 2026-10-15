// Procedure: preparing the mandibular left first molar (FDI 36 = Universal 19) for a monolithic zirconia crown, seen in a
// bucco-lingual cut. Frame: +x = mesial, +z = buccal, CEJ / margin at y = 0. All sizes in mm.
// poster: step 3
// The crown is one DK.prepMorph mesh: occlusal reduction first, then the axial walls with a chamfer; the intact tooth (with its
// enamel layer) stands in until the first cut; a ghost of the original crown shows what was removed; the crown seats last.
const FDI = 36;
const PREP = { occlusal: 1.5, axial: 1.0, margin: 0.5 };   // monolithic zirconia, typical (dental-facts.md §14: 1.0–1.5 / 0.5–1.0 / light chamfer)

const fig = DK.figure({
  fov: 26,
  title: 'Preparing a molar for a crown',
  subtitle: 'FDI 36 (Universal 19), lower left first molar. Typical zirconia reductions.',
  view: { theta: 0.7, phi: 1.25 }
});

// --- context
const intact = DK.tooth(FDI), s = intact.spec;
const bone = DK.bone({ width: 20, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = -1.8;   // crest ~2 mm below the CEJ
const gum = DK.gingiva({ width: 20, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the two roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The margin is placed at or just above the gum line.' });

// --- the tooth being prepared
const tooth = DK.tooth(s, { omit: ['enamel', 'dentin'] });
const prep = DK.prepMorph(s, PREP); tooth.group.add(prep);
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const ghost = new THREE.Mesh(DK.crownGeometry(s), ghostMat); tooth.group.add(ghost);
const WALL = s.crownL - PREP.occlusal;   // occluso-cervical height left for retention
fig.part(intact.group, { name: 'Molar 36', anchor: [0, s.crownL - 1.2, s.bl / 2 - 0.2], info: 'Lower left first molar: 5 cusps, 2 roots (mesial and distal).' });
fig.part(tooth.group, { name: 'Molar', label: false, info: 'Lower left first molar being prepared.' });
fig.part(prep, { inPlace: true, name: 'Prepared tooth', sub: `~${PREP.occlusal} mm occlusal, ~${PREP.axial} mm axial`, anchor: [0, WALL - 1.6, s.blC / 2 - PREP.axial], accent: true, info: `An even layer is removed so the zirconia is thick enough everywhere. About ${WALL.toFixed(1)} mm of wall height stays: a molar needs at least 4 mm for retention. Walls keep a slight taper.` });
fig.part(prep, { inPlace: true, name: 'Chamfer', sub: `~${PREP.margin} mm finish line`, anchor: [0, 0.2, -(s.blC / 2 - PREP.margin / 2)], dim: false, info: 'A light chamfer at the gum line: the crown edge seals against it. Zirconia needs only a light chamfer.' });
fig.part(ghost, { inPlace: true, name: 'Removed tooth', anchor: [0, s.crownL - 0.3, s.bl / 2 - 1], dim: false, info: 'Outline of the original crown: the space the new crown fills.' });
fig.part(intact.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0, 2.2, 0], info: 'Enough dentin (about 1 mm or more) must stay over the pulp horns.', when: (e, sec) => sec.enabled });

// --- tools and the crown
const bur = DK.bur({ shape: 'taper', diameter: 1.4 });
const crown = DK.restorationCrown(s, 'zirconia', PREP);
[bur, crown].forEach(o => fig.world.add(o));
fig.part(bur, { inPlace: true, name: 'Diamond bur', sub: 'tapered, round end', anchor: [0, 10, 0], info: 'Tapered round-end diamond in a high-speed handpiece, with water spray. Its round end cuts the chamfer.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'zirconia', anchor: () => [0, s.crownL - 1.4 + crown.position.y, s.bl / 2 - 0.3], info: 'A monolithic zirconia crown that restores the original molar shape.' });

// --- params
const cut = { inc: 0, ax: 0 };
const reshape = () => { const on = cut.inc > 0.001 || cut.ax > 0.001; intact.group.visible = !on; tooth.group.visible = on; prep.set(cut.inc, cut.ax); };
fig.param('inc', 0, v => { cut.inc = v; reshape(); });
fig.param('ax', 0, v => { cut.ax = v; reshape(); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.2 * k; ghost.visible = k > 0.01; });
const b = { burX: 0, burY: 40, burZ: 0, burTilt: 0 };
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; bur.visible = b.burY < 30; bur.position.set(b.burX, b.burY, b.burZ); bur.rotation.x = b.burTilt; }));
fig.param('crown', 0, k => { crown.visible = k > 0.001; crown.position.y = (1 - k) * 12; });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: DK.COLORS.zirconiaCap },
  { objects: [intact.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [intact.layers.dentin, intact.layers.root, tooth.layers.root, prep], color: DK.COLORS.dentinCap },
  { objects: [intact.layers.pulp, tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
ghostMat.clippingPlanes = [fig.section.plane];
const CUT = 1.2;   // through the mesial cusps and pulp horns
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-5, 5], offset: CUT } });

// --- the procedure (camera on +x looks at the cut face: buccal (+z) on the viewer's left, lingual on the right)
const TOP = s.crownL, BUC = s.blC / 2 - PREP.axial + 0.7, LIN = -(s.blC / 2 - PREP.axial + 0.7);
const park = { burY: 40 };
const SIDE = Math.PI / 2;
fig.procedure([
  { label: 'Molar', caption: 'The lower first molar before preparation.', beats: [
    { fov: 32, dur: 0, hold: 0.8, theta: 0.7, phi: 1.25, zoom: 1, section: false, labels: ['Molar 36'] },
    { dur: 0, hold: 0, section: true, offset: CUT + 8 },
    { fov: 26, dur: 2.0, hold: 1.2, theta: SIDE, phi: 1.4, zoom: 0.68, focus: [CUT, 3.2, 0], offset: CUT, labels: ['Molar 36', 'Pulp'], key: true }] },
  { label: 'Occlusal', caption: `Chewing surface lowered about ${PREP.occlusal} mm, following the cusps.`, beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.62, focus: [CUT, TOP - 1.5, 0], set: { burX: 5, burY: TOP + 0.4, burZ: 1.5, burTilt: -1.1 }, labels: ['Diamond bur'] },
    { dur: 2.0, hold: 0.2, set: { inc: 1, ghost: 1, burX: -5, burY: TOP - PREP.occlusal + 0.1 }, labels: ['Diamond bur'] },
    { dur: 0.7, hold: 1.0, set: park, labels: ['Removed tooth', 'Prepared tooth'], key: true }] },
  { label: 'Axial walls', caption: `All walls reduced about ${PREP.axial} mm with a slight taper, ending in a chamfer.`, beats: [
    { dur: 1.1, hold: 0.1, zoom: 0.7, focus: [CUT, 3.5, 0], set: { burX: 5, burY: 0.3, burZ: BUC + 1.2, burTilt: 0.1 }, labels: ['Diamond bur'] },
    { dur: 1.4, hold: 0.1, set: { ax: 0.55, burX: -5, burZ: BUC }, labels: ['Diamond bur'] },
    { dur: 0.5, hold: 0, set: { burX: -5, burY: 0.3, burZ: LIN - 1.2, burTilt: -0.1 } },
    { dur: 1.4, hold: 0.1, set: { ax: 1, burX: 5, burZ: LIN } },
    { dur: 0.7, hold: 0.4, set: park, labels: [] },
    { dur: 2.0, hold: 1.8, theta: SIDE - 0.55, phi: 1.05, zoom: 0.68, focus: [0, 3.2, 0], labels: ['Prepared tooth', 'Removed tooth', 'Chamfer'], key: true }] },
  { label: 'Check', caption: 'Margin smooth and even, enough wall height, dentin left over the pulp.', beats: [
    { dur: 1.8, hold: 1.8, zoom: 0.6, focus: [CUT, 2.6, -0.8], theta: SIDE + 0.1, phi: 1.4, set: { ghost: 0.5 }, labels: ['Chamfer', 'Pulp', 'Prepared tooth'], key: true }] },
  { label: 'Crown', caption: 'The zirconia crown seats on the preparation.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.8, focus: [CUT, 4, 0], theta: SIDE, set: { ghost: 0 }, labels: [] },
    { dur: 1.6, hold: 0.3, set: { crown: 1 }, labels: ['Crown'] },
    { dur: 1.8, hold: 1.6, theta: 1.2, phi: 1.28, zoom: 0.72, focus: [0, 3.2, 0], labels: ['Crown', 'Prepared tooth'], key: true }] }
]);
fig.start();
