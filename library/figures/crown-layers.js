// Story: what sits under a crown on the mandibular left first molar (FDI 36 = Universal 19). The crown lifts off its cement
// and the prepared stump, then a mesio-distal cut shows the shell, the cement line and the patient's own dentin and pulp.
// poster: end
// Frame: +x = mesial, +z = buccal, CEJ (= crown margin) at y = 0. All sizes in mm.
const FDI = 36;
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };   // monolithic zirconia, typical (dental-facts.md §14)
const CEMENT = 0.15;                                        // real luting cement is a film of tens of microns: drawn thicker to be seen
const fig = DK.figure({
  fov: 32,
  title: 'What is under a crown',
  subtitle: 'FDI 36 (Universal 19), lower left first molar. Zirconia crown.',
  view: { theta: 0.6, phi: 1.25 }
});

// --- context
const tooth = DK.tooth(FDI, { omit: ['enamel', 'dentin'] }), s = tooth.spec;   // roots + pulp; the crown part is the prep below
const bone = DK.bone({ width: 20, height: 18, depth: 13, crest: 1.6 }); bone.position.y = -1.8;
const gum = DK.gingiva({ width: 20, height: 3.2, depth: 13.6, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the two roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The crown edge sits at or just under the gum line.' });

// --- the layers: own tooth (prepared stump + roots), cement film, crown shell
const stump = DK.prep(s, PREP);
tooth.group.add(stump);
const cement = DK.prep(s, { axial: PREP.axial - CEMENT, occlusal: PREP.occlusal - CEMENT, margin: PREP.margin - CEMENT });
cement.material = DK.mat('cement');
const crown = DK.restorationCrown(s, 'zirconia', PREP);
const capOf = new THREE.Group(); capOf.add(crown); capOf.add(cement);   // crown and cement lift as one piece

const TOP = s.crownL - PREP.occlusal;   // approximate height of the stump top
fig.part(tooth.group, { name: 'Your tooth', sub: 'shaped down about 1 to 1.5 mm', anchor: [-1.2, TOP - 1.6, s.blC / 2 - 1.6], accent: true, info: 'The prepared tooth (stump) is still your own tooth: dentin with the living pulp inside. It can decay at the edge, so it still needs cleaning.' });
fig.part(stump, { inPlace: true, name: 'Margin', sub: 'where crown meets tooth', anchor: [s.mdC / 2 - PREP.margin / 2 - 0.1, 0.25, s.blC / 2 - 1.4], dim: false, info: 'The finish line around the neck of the tooth. The crown edge seals here; plaque collects here first.' });
fig.part(capOf, { name: 'Crown', sub: 'a hollow shell', anchor: [s.md / 2 - 1.6, s.crownL - 1.5, s.bl / 2 - 0.9], explode: [0, 11, 0], info: 'A shell of zirconia shaped like the original tooth, about 1 to 1.5 mm thick, cemented over the stump.' });
fig.part(cement, { inPlace: true, name: 'Cement', sub: 'a thin film, drawn thicker', anchor: () => [-s.mdC / 2 + PREP.axial - CEMENT / 2 + 0.05, 2.6, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Luting cement fills the few hundredths of a millimetre between crown and stump and holds them together.' });
fig.part(tooth.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0.3, 1.6, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Nerve and blood vessels. Preparation leaves a layer of dentin over it, so the tooth stays alive under the crown.' });
fig.part(tooth.layers.root, { inPlace: true, name: 'Roots', anchor: [s.roots[0].x + 0.4, -7, 0], dim: false, when: (e, sec) => sec.enabled, info: 'The two roots in the bone are untouched by the crown.' });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: DK.COLORS.zirconiaCap },
  { objects: [cement], color: DK.COLORS.cement, kind: 'plain' },
  { objects: [tooth.layers.root, stump], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explodeLabel: 'Lift crown', section: { label: 'Cut', range: [-3, 3], offset: 0 } });
fig.xray([bone, gum], false);
fig.onFrame((dt, e) => { cement.visible = e < 0.02; });   // the cement film shows only with the crown seated (a lifted solid would read as a block)

// story: the crowned tooth → the crown lifts → push in on the stump and margin → reseat a little, turn to the front and sweep
// the cut in → the hero shot: crown shell, cement, own tooth and pulp in one section
fig.story([
  { dur: 0, hold: 1.4, theta: 0.6, phi: 1.25, zoom: 1.05, labels: ['Crown'] },
  { dur: 2.4, hold: 2.2, theta: 0.9, phi: 1.12, explode: 1, labels: ['Crown', 'Your tooth'] },
  { dur: 2.0, hold: 2.2, zoom: 0.62, focus: [0, TOP - 2, 0], theta: 0.75, labels: ['Your tooth', 'Margin'] },
  { fov: 26, dur: 2.2, hold: 0.3, zoom: 1, focus: 'auto', theta: 0.05, phi: 1.45, explode: 0.32, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 2.4, offset: 0, labels: ['Crown', 'Your tooth', 'Pulp'] },
  { dur: 2.0, hold: 2.6, theta: 0.32, phi: 1.36, explode: 0, labels: ['Crown', 'Cement', 'Your tooth', 'Pulp', 'Roots'] }   // teaching shot
]);
fig.start();
