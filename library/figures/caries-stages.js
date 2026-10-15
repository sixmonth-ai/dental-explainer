// Caries progression on the mandibular left first molar (FDI 36 = Universal 19), crown up, mesio-distal cut through the central pit; one stage per step, each with the treatment it needs.
// poster: step 6
// One DK.cariesLesion driven by a `stage` param (0 sound → 5 pulp exposure, ICDAS 0 → 6, dental-facts.md §16). Each step
// names the stage and the treatment that stage calls for (ICCMS: initial → non-operative, moderate → minimally invasive,
// extensive → restoration; pulp exposure → root canal treatment). Frame: +x = mesial, +z = buccal, CEJ at y = 0. Sizes in mm.
const FDI = 36;
const fig = DK.figure({
  fov: 26,
  title: 'How a cavity reaches the nerve',
  subtitle: 'FDI 36 (Universal 19), lower left first molar, cut in half. Stages follow ICDAS.',
  view: { theta: 0.45, phi: 1.3 }
});

// --- the tooth in its socket (bone and gingiva are context: they don't drive the camera)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 22, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum tissue around the neck of the tooth.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: five cusps, two roots. The pits and grooves on its chewing surface are where decay most often starts.' });

// --- the lesion: a pit-and-fissure lesion at the central pit
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], stage: 0 });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);   // tooth-frame point d mm below the surface, r mm off the axis (k = 0: mesial, 12: distal)
const cut = (e, sec) => sec.enabled;

fig.part(L.enamel, { inPlace: true, name: 'Enamel', sub: 'hard outer layer', anchor: [-4.2, s.crownL - 1.4, 0], when: cut, info: 'The hardest tissue in the body, but it has no living cells: once it is lost it never grows back.' });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', sub: 'softer, full of tiny tubes', anchor: [3.8, 3.6, 0], when: cut, info: 'Softer than enamel, with microscopic tubes that lead to the pulp. Decay spreads faster here.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', sub: 'the nerve', anchor: [1.0, 1.8, 0], when: cut, info: 'The living core of the tooth: nerve and blood vessels. It becomes inflamed and painful when bacteria get close.' });
fig.part(M.enamel, { inPlace: true, name: 'White spot', sub: 'fluoride can reverse it', anchor: () => at(A.enamel * 0.55, SZ * 0.5, 0), accent: true, dim: false, info: 'Acid from plaque dissolves mineral under an intact surface. At this stage fluoride, a sealant and good brushing can stop or reverse it (ICDAS 1–2).' });
fig.part(M.cavity, { inPlace: true, name: 'Small hole', sub: 'sealant or small filling', anchor: () => at(0.1, 0, 0), dim: false, info: 'The surface has broken down (ICDAS 3). It can no longer heal; it is sealed or given a small filling.' });
fig.part(M.infected, { inPlace: true, name: 'Decay in dentin', sub: 'needs a filling', anchor: () => at(A.enamel + A.dentin * 0.22, SZ * 0.75, 0), dim: false, info: 'Soft, infected dentin. In dentin the decay spreads sideways under the enamel, so the damage is bigger than the hole you can see.' });
fig.part(M.affected, { inPlace: true, name: 'Spread under the enamel', sub: 'bigger than the hole', anchor: () => at(A.enamel + A.dentin * 0.42, SZ * 0.6, 12), dim: false, info: 'Softened but still firm dentin. The lesion is widest where enamel meets dentin, hollowing out the enamel above it.' });
fig.part(M.reactionary, { inPlace: true, name: 'Pulp defending itself', sub: 'deep filling', anchor: () => at(A.enamel + A.dentin + 0.25, SZ * 0.4, 12), dim: false, info: 'The pulp lays down a layer of new dentin under a slow lesion. A deep filling now has to protect the pulp.' });
const exposed = fig.part(M.infected, { inPlace: true, name: 'Decay reaches the pulp', sub: 'root canal treatment', anchor: () => at(A.enamel + A.dentin * 0.9, 0.2, 12), accent: true, dim: false, info: 'Bacteria reach the pulp: pulpitis, then the pulp dies. The usual treatment is a root canal; if the tooth cannot be saved, an extraction.' });

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
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0 } });

// --- one stage per step (camera on +z looks at the cut face: mesial on the viewer's right)
const FOCUS = [0, s.crownL - 2.7, 0];
fig.procedure([
  { label: 'Healthy tooth', caption: 'A healthy lower first molar: enamel, dentin and the pulp inside.', beats: [
    { dur: 0, hold: 1.0, theta: 0.45, phi: 1.3, zoom: 1.05, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 1.4, theta: 0, phi: 1.45, zoom: 1, offset: 0, labels: ['Enamel', 'Dentin', 'Pulp'], key: true }] },
  { label: 'White spot: fluoride', caption: 'Acid dissolves mineral under an intact surface. Still reversible with fluoride.', beats: [
    { dur: 1.4, hold: 0.2, zoom: 0.56, focus: FOCUS, labels: [] },
    { dur: 1.8, hold: 1.6, set: { stage: 1 }, labels: ['White spot', 'Enamel'], key: true }] },
  { label: 'Small hole: small filling', caption: 'The surface breaks down; it can no longer heal.', beats: [
    { dur: 1.8, hold: 1.6, set: { stage: 2 }, labels: ['Small hole', 'Dentin'], key: true }] },
  { label: 'Into dentin: filling', caption: 'In dentin the decay spreads sideways and hollows out the enamel.', beats: [
    { dur: 2.0, hold: 1.6, set: { stage: 3 }, labels: ['Decay in dentin', 'Spread under the enamel'], key: true }] },
  { label: 'Deep: deep filling', caption: 'The pulp lays down new dentin as the decay closes in.', beats: [
    { dur: 2.0, hold: 1.6, set: { stage: 4, inflamed: 0.35 }, labels: ['Pulp defending itself', 'Pulp'], key: true }] },
  { label: 'Pulp reached: root canal', caption: 'Bacteria reach the pulp: a root canal treatment, or an extraction.', beats: [
    { dur: 2.0, hold: 0.4, set: { stage: 5, inflamed: 1 }, labels: ['Pulp'] },
    { dur: 2.0, hold: 2.2, zoom: 0.64, phi: 1.4, theta: 0.12, focus: [0, s.crownL - 3.4, 0], labels: ['Decay reaches the pulp', 'Pulp'], key: true }] }
]);
fig.start();
