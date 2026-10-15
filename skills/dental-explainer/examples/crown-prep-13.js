// Example procedure: preparing the maxillary right canine (FDI 13 = Universal 6) for a glass-ceramic crown, crown up
// (model convention), seen in a labio-lingual cut so the reduction depths and the margin read on the cut face.
// The crown is one DK.prepMorph mesh that eases from the intact crown to the finished prep; the intact tooth (with its
// enamel layer) is shown until the first cut. Bone and gingiva are context (fit: false), so the camera frames the tooth.
// Frame: +x = mesial, +z = labial, CEJ / margin at y = 0. All sizes in mm.
const FDI = 13;
const PREP = { occlusal: 2.0, axial: 1.2, margin: 1.0 };   // typical glass-ceramic values (dental-facts.md §14)

const fig = DK.figure({
  fov: 26,
  title: 'Preparing a canine for a crown',
  subtitle: 'FDI 13 (Universal 6), crown up. Typical glass-ceramic reductions.',
  view: { theta: 1.15, phi: 1.3 }
});

// --- context
const intact = DK.tooth(FDI), s = intact.spec;
const bone = DK.bone({ width: 16, height: 19, depth: 11, crest: 1.5 }); bone.position.y = -3.4;   // crest ~2 mm below the CEJ
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 11.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = -2.0;   // free gingival margin at the CEJ = equigingival margin
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the canine root (shown crown up).' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The margin sits at the gingival margin here.' });

// --- the tooth being prepared: root + pulp, with the crown as a morphing prep; the intact tooth stands in until the first cut
const tooth = DK.tooth(s, { omit: ['enamel', 'dentin'] });
const prep = DK.prepMorph(s, PREP); tooth.group.add(prep);
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const ghost = new THREE.Mesh(DK.crownGeometry(s), ghostMat); tooth.group.add(ghost);   // outline of the original crown
fig.part(intact.group, { name: 'Canine 13', anchor: [0, 6, s.bl / 2], info: 'Upper right canine: the longest root in the mouth.' });
fig.part(tooth.group, { name: 'Canine', label: false, info: 'Upper right canine being prepared.' });
fig.part(prep, { inPlace: true, name: 'Prepared tooth', sub: `~${PREP.occlusal} mm incisal, ~${PREP.axial} mm axial`, anchor: [0, 6, s.blC / 2 - PREP.axial], accent: true, info: 'An even layer is removed so the crown is thick enough to be strong.' });
fig.part(prep, { inPlace: true, name: 'Margin', sub: `~${PREP.margin} mm rounded shoulder`, anchor: [0, 0.2, s.blC / 2 - PREP.margin / 2], info: 'The finish line the crown edge seals against, at the gingival margin.' });
fig.part(ghost, { inPlace: true, name: 'Removed tooth', anchor: [0, s.crownL - 0.4, 0], dim: false, info: 'Outline of the original crown: the space the crown fills.' });
fig.part(intact.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0, 3, 0], info: 'Enough dentin must stay over the pulp after preparation.' });

// --- tools and the crown (fig.world, moved by params)
const bur = DK.bur({ shape: 'taper', diameter: 1.4 });
const crown = DK.restorationCrown(s, 'ceramic', PREP);
[bur, crown].forEach(o => fig.world.add(o));
fig.part(bur, { inPlace: true, name: 'Diamond bur', sub: 'tapered, round end', anchor: [0, 10, 0], info: 'Tapered round-end diamond in a high-speed handpiece, with water spray.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'glass-ceramic', anchor: [0, s.crownL - 2, s.bl / 2], info: 'Restores the original canine contour.' });

// --- params: every change is a number the steps animate
const cut = { inc: 0, ax: 0 };
const reshape = () => { const on = cut.inc > 0.001 || cut.ax > 0.001; intact.group.visible = !on; tooth.group.visible = on; prep.set(cut.inc, cut.ax); };
fig.param('inc', 0, v => { cut.inc = v; reshape(); });
fig.param('ax', 0, v => { cut.ax = v; reshape(); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.2 * k; ghost.visible = k > 0.01; });
// the bur: tip position and tilt (rotation about x: + leans the shank labially); parked out of view above the tooth
const b = { burX: 0, burY: 40, burZ: 0, burTilt: 0 };
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; bur.visible = b.burY < 30; bur.position.set(b.burX, b.burY, b.burZ); bur.rotation.x = b.burTilt; }));
fig.param('crown', 0, k => { crown.visible = k > 0.001; crown.position.y = (1 - k) * 14; });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: DK.COLORS.ceramicCap },
  { objects: [intact.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [intact.layers.dentin, intact.layers.root, tooth.layers.root, prep], color: DK.COLORS.dentinCap },
  { objects: [intact.layers.pulp, tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
ghostMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

// --- the procedure (camera on +x looks at the cut face: labial (+z) is on the viewer's left, lingual on the right)
const TOP = s.crownL, LAB = s.blC / 2 - PREP.axial + 0.7, LIN = -(s.blC / 2 - PREP.axial + 0.7);
const park = { burY: 40 };
fig.procedure([
  { label: 'Canine', caption: 'The upper canine before preparation.', beats: [
    { fov: 34, dur: 0, hold: 0.8, theta: 1.15, phi: 1.3, zoom: 1, section: false, labels: ['Canine 13'] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { fov: 26, dur: 2.0, hold: 1.2, theta: Math.PI / 2, phi: 1.42, zoom: 0.7, focus: [0, 4, 0], offset: 0, labels: ['Canine 13', 'Pulp'], key: true }] },
  { label: 'Incisal', caption: `Incisal edge lowered about ${PREP.occlusal} mm.`, beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.55, focus: [0, TOP - 2, 0], set: { burX: 3, burY: TOP + 0.6, burZ: 0.6, burTilt: -0.9 }, labels: ['Diamond bur'] },
    { dur: 2.0, hold: 0.2, set: { inc: 1, ghost: 1, burX: -3, burY: TOP - PREP.occlusal + 0.2 }, labels: ['Diamond bur'] },
    { dur: 0.7, hold: 1.0, set: park, labels: ['Removed tooth', 'Prepared tooth'], key: true }] },
  { label: 'Labial & lingual', caption: `Walls reduced about ${PREP.axial} mm, slightly tapered.`, beats: [
    { dur: 1.1, hold: 0.1, zoom: 0.62, focus: [0, 4.5, 0], set: { burX: 3, burY: 0.4, burZ: LAB + 1.2, burTilt: -0.12 }, labels: ['Diamond bur'] },
    { dur: 1.4, hold: 0.1, set: { ax: 0.55, burX: -3, burZ: LAB }, labels: ['Diamond bur'] },
    { dur: 0.5, hold: 0, set: { burX: -3, burY: 0.4, burZ: LIN - 1.2, burTilt: 0.12 } },
    { dur: 1.4, hold: 0.1, set: { ax: 1, burX: 3, burZ: LIN } },
    { dur: 0.7, hold: 1.0, set: park, labels: ['Prepared tooth', 'Removed tooth'], key: true }] },
  { label: 'Margin', caption: 'A smooth rounded shoulder at the gum line.', beats: [
    { dur: 1.6, hold: 1.6, zoom: 0.5, focus: [0, 1.5, s.blC / 2 - 1], theta: Math.PI / 2 - 0.15, set: { ghost: 0.5 }, labels: ['Margin', 'Prepared tooth'], key: true }] },
  { label: 'Crown', caption: 'The crown restores the original shape.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.7, focus: [0, 4, 0], theta: Math.PI / 2, set: { ghost: 0 }, labels: [] },
    { dur: 1.6, hold: 0.3, set: { crown: 1 }, labels: ['Crown'] },
    { dur: 1.8, hold: 1.4, theta: 1.2, phi: 1.3, zoom: 0.8, labels: ['Crown', 'Prepared tooth'], key: true }] }
]);
fig.start();
