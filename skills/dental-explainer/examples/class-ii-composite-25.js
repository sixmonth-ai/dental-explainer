// Example procedure: a Class II (mesio-occlusal) composite on the maxillary left second premolar (FDI 25 = Universal 13),
// crown up (model convention), with the first premolar (24) mesial to it so the proximal lesion sits below the contact.
// Seen in a mesio-distal cut: the lesion, the occlusal step and proximal box, selective caries removal (firm dentin left),
// the matrix band and wedge, three composite increments, the finished restoration.
// DK.cavityPrep (the hole) and DK.filling (the composite) share the same PREP numbers, so the filling seats exactly.
// Frame: +x = mesial, +z = buccal, CEJ at y = 0. All sizes in mm (dental-facts.md §16).
const FDI = 25;
const fig = DK.figure({
  title: 'Class II composite on a premolar',
  subtitle: 'FDI 25 (Universal 13), crown up, mesio-distal cut. Selective caries removal, composite in increments.',
  view: { theta: 0.5, phi: 1.3 }
});

// --- teeth and context (bone and gingiva are context: fit: false)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const t24 = DK.tooth(24), s24 = t24.spec; t24.group.position.x = s.md / 2 + s24.md / 2 - 0.15; DK.inFront(t24.group);   // in contact with 25; may stand in front of the box
const bone = DK.bone({ width: 26, height: 17, depth: 11, crest: 1.5 }); bone.position.set(3.4, -3.3, 0);
const gum = DK.gingiva({ width: 26, height: 3.0, depth: 11.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC }, { x: t24.group.position.x, z: 0, md: s24.mdC, bl: s24.blC }] }); gum.position.set(3.4, -1.9, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone (shown crown up).' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The papilla fills the embrasure below the contact.' });
fig.part(tooth.group, { name: 'Premolar 25', label: false, info: 'Upper left second premolar: one root, one broad canal.' });
fig.part(t24.group, { name: '24', anchor: [0, 6, s24.bl / 2], info: 'Upper left first premolar, in contact with 25. The box must clear it by ~0.5 mm.' });

// --- the lesion: a proximal lesion just below the contact, into the middle third of dentin (ICDAS 4 / RB4)
const LESION_Y = 4.0, STAGE = 3.7;   // just apical to the contact (crest of curvature ≈ 4.6 mm on this crown)
const lesion = DK.cariesLesion(tooth, { site: 'mesial', at: LESION_Y, size: 1.1, stage: STAGE, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
fig.part(M.affected, { inPlace: true, name: 'Lesion', sub: 'under the contact', anchor: () => lesion.point(A.enamel + 0.3, SZ * 0.5, 0), accent: true, dim: false, info: 'Proximal caries starts just below the contact point. Enamel cone apex at the DEJ; dentin cone spread along the DEJ.' });
fig.part(M.affected, { inPlace: true, name: 'Firm dentin left', sub: 'affected, remineralisable', anchor: () => lesion.point(A.enamel + A.dentin * 0.72, 0.1, 0), dim: false, info: 'Selective removal: only soft, infected dentin is removed. Firm, affected dentin over the pulp is left to remineralise (ICCC 2016).' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [0, 3, 0], info: 'Removing all stained dentin here would risk exposing the pulp.', when: (e, sec) => sec.enabled });

// --- preparation and filling share PREP; the prep is drawn as a hole (inner walls, light cap in section)
const PREP = { class: 2, side: 'mesial', depth: 0.2, box: { gingivalY: 2.7, width: 3.4, axial: 0.35 } };   // axial wall just inside the DEJ: the firm dentin beyond it stays
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const fill = DK.filling(tooth, PREP, 'composite'); tooth.group.add(fill);
const D = prep.dims;
const band = DK.matrixBand(tooth, { side: 'mesial', bottom: D.gingivalY - 1.2, height: s.crownL - D.gingivalY + 1.6 }); tooth.group.add(band);
const wedge = DK.wedge({ length: 9 }); wedge.position.set(s.md / 2 + 0.75, D.gingivalY - 1.6, 0); tooth.group.add(wedge);
fig.part(prep, { inPlace: true, name: 'Box', sub: `gingival floor ${DK.mm(D.gingivalY)} above the CEJ`, anchor: [(D.axialX + s.md / 2) / 2, D.gingivalY + 0.3, 0], dim: false, info: 'Proximal box: gingival floor clears the neighbour by ~0.5 mm, axial wall ~0.5 mm inside the DEJ, walls diverge slightly gingivally.' });
fig.part(prep, { inPlace: true, name: 'Occlusal step', anchor: [D.center[0] - 1.2, D.floorY + 0.2, 0], dim: false, info: 'Through the marginal ridge along the central groove; pulpal floor just below the DEJ, kept narrow.' });
fig.part(fill, { inPlace: true, name: 'Composite', sub: 'placed in ~2 mm increments', anchor: [(D.axialX + s.md / 2) / 2, D.gingivalY + 1.2, 0], dim: false, info: 'Each increment is light-cured before the next: a 2 mm layer cures fully and shrinks less against the walls.' });
fig.part(band, { inPlace: true, name: 'Matrix band', sub: 'sectional, wedged', anchor: [s.md / 2 + 0.3, s.crownL * 0.75, s.bl * 0.3], info: 'Rebuilds the missing proximal wall so the composite can be packed against it and a tight contact forms.' });
fig.part(wedge, { inPlace: true, name: 'Wedge', anchor: [0, 0.4, 3.5], info: 'Seals the gingival margin of the band and separates the teeth slightly.' });

// --- tools (fig.world, parked out of view)
const fissureBur = DK.bur({ shape: 'flat', diameter: 1.0, head: 4.5 }), roundBur = DK.bur({ shape: 'round', diameter: 2.3, head: 2.3, length: 14 });   // ISO 023 round bur, slow speed
[fissureBur, roundBur].forEach(b => fig.world.add(DK.inFront(b)));
fig.part(fissureBur, { inPlace: true, name: 'Fissure bur', anchor: [0, 6, 0], info: 'Flat-ended diamond: outline, depth and the box walls at high speed with water.' });
fig.part(roundBur, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 3, 0], info: 'Large round bur at slow speed (or a hand excavator) peels soft dentin without over-cutting.' });

// --- params
const st = { step: 0, box: 0 };
fig.param('step', 0, v => { st.step = v; prep.set(v, st.box); });
fig.param('box', 0, v => { st.box = v; prep.set(st.step, v); });
fig.param('removed', 0, k => lesion.set(STAGE, { removed: k }));
fig.param('fill', 0, k => { fill.visible = k > 0.001; prep.visible = k < 0.99; fill.slice(-1e9, lerp3(D.gingivalY, s.crownL + 1.5, k)); });   // the void hides once the last increment is flush
fig.param('band', 0, k => { band.visible = wedge.visible = k > 0.001; band.position.y = (1 - k) * 12; wedge.position.z = (1 - k) * 14; });
function lerp3(a, b, k) { return a + (b - a) * k; }
const b = { bx: 0, by: 40, bz: 0, tilt: 0, which: 0 };
const placeBur = () => { const tool = b.which < 0.5 ? fissureBur : roundBur; fissureBur.visible = b.which < 0.5 && b.by < 30; roundBur.visible = b.which >= 0.5 && b.by < 30; tool.position.set(b.bx, b.by, b.bz); tool.rotation.x = b.tilt; tool.rotation.z = 0; };
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; placeBur(); }));

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel, t24.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.dentin, L.root, t24.layers.dentin, t24.layers.root], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp, t24.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [prep], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [fill], color: 0xe6dac0, kind: 'plain' }   // warm ivory, ungrained: reads as a material, not tooth
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

// --- the procedure (camera on +z looks at the cut face: mesial and tooth 24 are on the viewer's right)
const TOP = s.crownL, park = { by: 40 }, XM = s.md / 2;
const F1 = [2.5, 4.5, 0];
fig.procedure([
  { label: 'Decay under the contact', caption: 'A proximal lesion below the contact with 24, into dentin.', beats: [
    { dur: 0, hold: 1.0, theta: 0.5, phi: 1.3, zoom: 1.05, section: false, labels: ['24'] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 1.4, theta: 0, phi: 1.45, zoom: 0.62, focus: F1, offset: 0, labels: ['Lesion', 'Pulp'], key: true }] },
  { label: 'Occlusal step', caption: 'The fissure bur opens the central groove through the marginal ridge, just into dentin.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: D.center[0] - 1.5, by: TOP + 0.5, bz: 1.3, tilt: 0 }, labels: ['Fissure bur'] },
    { dur: 2.0, hold: 0.2, set: { step: 1, bx: D.axialX + 0.6, by: D.floorY }, labels: ['Fissure bur'] },
    { dur: 0.8, hold: 1.0, set: park, labels: ['Occlusal step'], key: true }] },
  { label: 'Proximal box', caption: 'The box drops from the marginal ridge to a gingival floor that clears 24, axial wall just inside the DEJ.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: (D.axialX + XM) / 2, by: TOP + 0.5, bz: 1.3 }, labels: ['Fissure bur'] },
    { dur: 2.0, hold: 0.2, set: { box: 1, by: D.gingivalY }, labels: ['Fissure bur'] },
    { dur: 0.8, hold: 1.0, set: park, labels: ['Box'], key: true }] },
  { label: 'Selective caries removal', caption: 'Soft, infected dentin is removed; firm dentin over the pulp stays.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.5, focus: [2.2, 3.6, 0], set: { which: 1, bx: D.axialX + 0.8, by: TOP - 1.5, bz: 1.3 }, labels: ['Round bur'] },
    { dur: 1.8, hold: 0.2, set: { removed: 1, bx: D.axialX - 0.1, by: LESION_Y + 0.2 }, labels: ['Round bur'] },
    { dur: 0.8, hold: 1.2, set: park, labels: ['Firm dentin left', 'Pulp'], key: true }] },
  { label: 'Matrix and wedge', caption: 'A sectional band and a wedge rebuild the missing wall.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.62, focus: F1, theta: 0.35, phi: 1.35, labels: [] },
    { dur: 1.6, hold: 1.2, set: { band: 1 }, labels: ['Matrix band', 'Wedge'], key: true }] },
  { label: 'Composite in increments', caption: 'Three increments, each light-cured, fill the box then the step.', beats: [
    { dur: 1.0, hold: 0.1, theta: 0, phi: 1.45, labels: [] },
    { dur: 1.2, hold: 0.3, set: { fill: 0.3 }, labels: ['Composite'] },
    { dur: 1.2, hold: 0.3, set: { fill: 0.62 }, labels: ['Composite'] },
    { dur: 1.2, hold: 1.0, set: { fill: 1 }, labels: ['Composite', 'Matrix band'], key: true }] },
  { label: 'Finished', caption: 'Band off, contact restored, firm dentin sealed under the composite.', beats: [
    { dur: 1.0, hold: 0.1, set: { band: 0 }, labels: [] },
    { dur: 2.2, hold: 2.2, theta: 0.3, phi: 1.3, zoom: 0.7, focus: [2, 4, 0], labels: ['Composite', 'Pulp'], key: true }] }
]);
fig.start();
