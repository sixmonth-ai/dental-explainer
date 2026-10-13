// Example procedure: a porcelain veneer on the maxillary right central incisor (FDI 11 = Universal 8), crown up (model
// convention), seen in a labio-lingual cut so the labial depths read against the enamel thickness on the cut face.
// The enamel shell is one DK.veneerPrep mesh that eases from the intact tooth to the finished prep (labial first, then the
// incisal edge); DK.veneer with the same numbers seats on it exactly. Frame: +x = mesial, +z = labial, CEJ at y = 0. Sizes in mm.
const FDI = 11;
const V = { cervical: 0.3, middle: 0.5, incisal: 0.7, edge: 1.5, type: 'butt' };   // enamel-preserving depths by third (dental-facts.md §18)

const fig = DK.figure({
  title: 'Preparing an incisor for a veneer',
  subtitle: 'FDI 11 (Universal 8), crown up. Labial 0.3–0.7 mm, incisal 1.5 mm, butt joint.',
  view: { theta: 1.1, phi: 1.3 }
});

// --- context: bone and gingiva around the root (fit: false, so the camera frames the tooth)
const tooth = DK.tooth(FDI, { omit: ['enamel'] }), s = tooth.spec;      // dentin, root and pulp; the enamel is the morphing prep
const bone = DK.bone({ width: 16, height: 17, depth: 11, crest: 1.5 }); bone.position.y = -3.4;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 11.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = -2.0;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the incisor root (shown crown up).' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The veneer margin stays at or just above the gingival margin.' });

// --- the tooth: enamel as a morphing prep over the dentin body, plus a ghost of the intact labial surface
const prep = DK.veneerPrep(s, V); tooth.group.add(prep);
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const ghost = new THREE.Mesh(DK.crownGeometry(s), ghostMat); tooth.group.add(ghost);
fig.part(tooth.group, { name: 'Central incisor 11', anchor: [0, 6, s.bl / 2], info: 'Upper right central incisor: the widest anterior crown, enamel ~0.3 mm thick at the cervix and ~1 mm at the incisal third.' });
fig.part(prep, { inPlace: true, name: 'Labial reduction', sub: `${V.cervical} → ${V.incisal} mm, in enamel`, anchor: [0, 6, s.blC / 2 - 0.5], accent: true, dim: false, info: 'Only the labial face is reduced, deeper toward the edge, so the prep stays in enamel: a veneer bonded to enamel lasts far longer than one on dentin.' });
fig.part(prep, { inPlace: true, name: 'Incisal edge', sub: `${V.edge} mm, butt joint`, anchor: [0, s.crownL - V.edge, 0.3], info: 'The edge is shortened and the veneer wraps it, which protects the thin ceramic from chipping.' });
fig.part(prep, { inPlace: true, name: 'Chamfer', sub: '~0.3 mm, at the gum line', anchor: [0, 0.5, s.blC / 2 - 0.1], info: 'A light chamfer at or just above the gingival margin, still in enamel.' });
fig.part(ghost, { inPlace: true, name: 'Removed enamel', anchor: [0, s.crownL - 1, s.bl / 2 - 0.5], dim: false, info: 'Outline of the intact tooth: the thin layer the veneer replaces.' });
fig.part(tooth.layers.dentin, { inPlace: true, name: 'Dentin', anchor: [0, 2.5, -2.3], info: 'Under the enamel. A veneer prep that reaches dentin bonds less reliably.', when: (e, sec) => sec && sec.enabled });

// --- tools and the veneer (fig.world, moved by params)
const bur = DK.bur({ shape: 'taper', diameter: 1.2 });
const veneer = DK.veneer(s, V, 'ceramic');
[bur, veneer].forEach(o => fig.world.add(o));
fig.part(bur, { inPlace: true, name: 'Diamond bur', sub: 'tapered, round end', anchor: [0, 10, 0], info: 'Depth cutters set 0.3 / 0.5 mm grooves first; a tapered diamond then joins them, following the two planes of the labial face.' });
fig.part(veneer, { inPlace: true, name: 'Veneer', sub: 'glass-ceramic, 0.3–0.7 mm', anchor: [0, s.crownL - 3, s.bl / 2 + 0.1], info: 'A thin ceramic shell bonded to the enamel with resin cement. It is not a crown: the lingual surface stays untouched.' });

// --- params
const cut = { fac: 0, inc: 0 };
fig.param('fac', 0, v => { cut.fac = v; prep.set(cut.fac, cut.inc); });
fig.param('inc', 0, v => { cut.inc = v; prep.set(cut.fac, cut.inc); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.2 * k; ghost.visible = k > 0.01; });
const b = { burX: 0, burY: 40, burZ: 0, burTilt: 0 };
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; bur.visible = b.burY < 30; bur.position.set(b.burX, b.burY, b.burZ); bur.rotation.x = b.burTilt; }));
fig.param('veneer', 0, k => { veneer.visible = k > 0.001; veneer.position.z = (1 - k) * 9; });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [veneer], color: 0xe4e0d6 },
  { objects: [prep], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.dentin, tooth.layers.root], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
ghostMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

// --- the procedure (camera on +x looks at the cut face: labial (+z) on the viewer's left)
const TOP = s.crownL, LAB = s.bl / 2, park = { burY: 40 };
fig.procedure([
  { label: 'Incisor', caption: 'The upper central incisor before preparation.', beats: [
    { dur: 0, hold: 0.8, theta: 1.1, phi: 1.3, zoom: 1, section: false, labels: ['Central incisor 11'] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { dur: 2.0, hold: 1.2, theta: Math.PI / 2, phi: 1.42, zoom: 0.7, focus: [0, 4.5, 0], offset: 0, labels: ['Central incisor 11', 'Dentin'], key: true }] },
  { label: 'Labial reduction', caption: `Labial face reduced ${V.cervical}–${V.incisal} mm, staying in enamel.`, beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.6, focus: [0, 5, 1], set: { burX: 3, burY: TOP - 1, burZ: LAB + 0.9, burTilt: -0.35 }, labels: ['Diamond bur'] },
    { dur: 2.2, hold: 0.2, set: { fac: 1, ghost: 1, burX: -3, burY: 0.6, burZ: LAB - 0.1, burTilt: 0.05 }, labels: ['Diamond bur'] },
    { dur: 0.7, hold: 1.2, set: park, labels: ['Labial reduction', 'Removed enamel', 'Dentin'], key: true }] },
  { label: 'Incisal edge', caption: `Edge shortened ${V.edge} mm for a butt joint.`, beats: [
    { dur: 1.1, hold: 0.1, zoom: 0.5, focus: [0, TOP - 1.5, 0], set: { burX: 3, burY: TOP + 0.5, burZ: 0.2, burTilt: -1.1 }, labels: ['Diamond bur'] },
    { dur: 1.6, hold: 0.2, set: { inc: 1, burX: -3, burY: TOP - V.edge + 0.1 }, labels: ['Diamond bur'] },
    { dur: 0.7, hold: 1.2, set: park, labels: ['Incisal edge', 'Removed enamel'], key: true }] },
  { label: 'Margin', caption: 'A light chamfer at the gum line, still in enamel.', beats: [
    { dur: 1.6, hold: 1.6, zoom: 0.5, focus: [0, 2.4, s.blC / 2 - 0.6], theta: Math.PI / 2 - 0.2, set: { ghost: 0.5 }, labels: ['Chamfer', 'Dentin'], key: true }] },
  { label: 'Veneer', caption: 'The ceramic shell bonded to the enamel.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.72, focus: [0, 4.5, 0], theta: Math.PI / 2, set: { ghost: 0 }, labels: [] },
    { dur: 1.6, hold: 0.3, set: { veneer: 1 }, labels: ['Veneer'] },
    { dur: 1.8, hold: 1.4, theta: 1.1, phi: 1.3, zoom: 0.8, labels: ['Veneer', 'Labial reduction'], key: true }] }
]);
fig.start();
