// Example: caries progression on the mandibular right first molar (FDI 46 = Universal 30), seen in a mesio-distal cut
// through the central pit. One DK.cariesLesion is driven by a `stage` param (0 sound → 5 pulp exposure, ICDAS 0 → 6);
// each step of the stepper is one stage, and the storyboard shows all six. The hero shot is the lesion's path to the pulp.
// Frame: +x = mesial, +z = buccal, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const FDI = 46;
const fig = DK.figure({
  title: 'How decay reaches the pulp',
  subtitle: 'FDI 46 (Universal 30), mesio-distal cut through the central pit. Stages follow ICDAS.',
  view: { theta: 0.45, phi: 1.3 }
});

// --- the tooth, in its socket (context blocks don't drive the camera)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 22, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone; the crest sits ~1.5–2 mm below the CEJ in health.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 46', label: false, info: 'Lower right first molar: 5 cusps, 2 roots. The central pit is a classic site for fissure caries.' });

// --- the lesion: a pit-and-fissure lesion at the central pit, elongated along the central groove
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], stage: 0 });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;   // A.enamel / A.dentin = thickness along the lesion axis (mm)
const at = (d, r, k) => lesion.point(d, r, k);   // tooth-frame point d mm below the surface, r mm off the axis (k = 0: mesial)

fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-4.2, s.crownL - 1.4, 0], info: 'Acellular and ~96 % mineral: it demineralises and remineralises but cannot regrow.', when: (e, sec) => sec.enabled });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [3.8, 3.6, 0], info: 'Tubules run from the DEJ to the pulp; once bacteria reach dentin the lesion spreads faster.', when: (e, sec) => sec.enabled });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [1.0, 1.8, 0], info: 'Living tissue. It lays down reactionary dentin under a slow lesion, and becomes inflamed when bacteria get close.', when: (e, sec) => sec.enabled });
fig.part(M.enamel, { inPlace: true, name: 'White spot', sub: 'ICDAS 1–2, surface intact', anchor: () => at(A.enamel * 0.55, SZ * 0.5, 0), accent: true, dim: false, info: 'Subsurface demineralisation under an intact surface layer. Non-cavitated: it can remineralise with fluoride and plaque control.' });
fig.part(M.cavity, { inPlace: true, name: 'Cavity', sub: 'ICDAS 3–6', anchor: () => at(0.1, 0, 0), dim: false, info: 'Once the surface breaks down the lesion can no longer remineralise: it needs sealing or restoring.' });
fig.part(M.infected, { inPlace: true, name: 'Infected dentin', sub: 'soft', anchor: () => at(A.enamel + A.dentin * 0.22, SZ * 0.75, 0), dim: false, info: 'Soft, bacteria-laden, irreversibly broken down. This is what a restoration must remove.' });
fig.part(M.affected, { inPlace: true, name: 'Affected dentin', sub: 'firm, spread along the DEJ', anchor: () => at(A.enamel + A.dentin * 0.42, SZ * 0.6, 12), dim: false, info: 'Demineralised but structurally intact and remineralisable; the lesion is widest at the DEJ, undermining the enamel.' });
fig.part(M.reactionary, { inPlace: true, name: 'Reactionary dentin', anchor: () => at(A.enamel + A.dentin + 0.25, SZ * 0.4, 12), dim: false, info: 'Tertiary dentin laid down by the pulp under a slow lesion: the pulp defends itself.' });

// --- params: the stage is one number; the pulp reddens as bacteria approach
const pulpBase = DK.color(DK.COLORS.pulp), pulpHot = DK.color(0x9e5a50);
fig.param('stage', 0, v => lesion.set(v));
fig.param('inflamed', 0, k => L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(pulpBase).lerp(pulpHot, k); }));

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.reactionary], color: DK.COLORS.reactionary, kind: 'dentin' },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.COLORS.cavity, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0 } });

// --- the stages, one per step (camera on +z looks at the cut face: mesial is on the viewer's right)
const FOCUS = [0, s.crownL - 3.0, 0];
fig.procedure([
  { label: 'Sound', caption: 'A healthy lower first molar.', beats: [
    { dur: 0, hold: 1.0, theta: 0.45, phi: 1.3, zoom: 1.05, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 1.2, theta: 0, phi: 1.45, zoom: 1, offset: 0, labels: ['Enamel', 'Dentin', 'Pulp'], key: true }] },
  { label: 'White spot', caption: 'Acid from plaque dissolves mineral under an intact surface. Still reversible.', beats: [
    { dur: 1.4, hold: 0.2, zoom: 0.62, focus: FOCUS, labels: [] },
    { dur: 1.8, hold: 1.6, set: { stage: 1 }, labels: ['White spot'], key: true }] },
  { label: 'Enamel breakdown', caption: 'The surface cavitates; the lesion reaches the dentin.', beats: [
    { dur: 1.8, hold: 1.4, set: { stage: 2 }, labels: ['Cavity', 'Infected dentin'], key: true }] },
  { label: 'Into dentin', caption: 'In dentin the lesion spreads sideways along the DEJ and undermines the enamel.', beats: [
    { dur: 2.0, hold: 1.6, set: { stage: 3 }, labels: ['Infected dentin', 'Affected dentin'], key: true }] },
  { label: 'Deep lesion', caption: 'The pulp lays down reactionary dentin as the lesion closes in.', beats: [
    { dur: 2.0, hold: 1.6, set: { stage: 4, inflamed: 0.35 }, labels: ['Reactionary dentin', 'Pulp'], key: true }] },
  { label: 'Pulp exposure', caption: 'Bacteria reach the pulp: pulpitis, then necrosis if untreated.', beats: [
    { dur: 2.0, hold: 0.4, set: { stage: 5, inflamed: 1 }, labels: ['Infected dentin', 'Pulp'] },
    { dur: 2.0, hold: 2.2, zoom: 0.7, phi: 1.4, theta: 0.12, focus: [0, s.crownL - 3.6, 0], labels: ['Cavity', 'Infected dentin', 'Affected dentin', 'Pulp'], key: true }] }
]);
fig.start();
