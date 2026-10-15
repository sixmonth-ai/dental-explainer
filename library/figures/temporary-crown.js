// Story: a temporary crown on the prepared mandibular left first molar (FDI 36 = Universal 19), between 35 and 37, while the final crown is made.
// poster: end
// Straight segment, crowns up. Frame: +x = mesial (35 side), +z = buccal, CEJ at y = 0 for all three teeth. The stump is DK.prep with typical
// zirconia reductions (dental-facts.md §14); the temporary is a bis-acryl shell (DK.restorationCrown, composite) on the same prep numbers, seated on
// a temporary cement film drawn thicker than real. It comes down onto the stump, the camera visits the two contacts that hold the space, then a
// mesio-distal cut shows shell, cement, own dentin and the living pulp. Sizes in mm.
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };
const CEMENT = 0.15;
const s35 = DK.toothPreset(35), s36 = DK.toothPreset(36), s37 = DK.toothPreset(37);
const X35 = s36.md / 2 + s35.md / 2, X37 = -(s36.md / 2 + s37.md / 2);
const fig = DK.figure({
  fov: 30,
  title: 'Temporary crown',
  subtitle: 'FDI 36 (Universal 19), lower left first molar, between appointments.',
  view: { theta: 0.55, phi: 1.2, margin: 0.85 }
});

// --- context: bone and gum along the three teeth
const W = X35 - X37 + 12, MIDX = (X35 + X37) / 2;
const bone = DK.bone({ width: W, height: 14, depth: 12.5, cortical: 1.2, crest: 1.6 }); bone.position.set(MIDX, -1.8, 0);
const gum = DK.gingiva({ width: W, height: 3.2, depth: 13.2, crest: 1.3, around: [
  { x: X35 - MIDX, z: 0, md: s35.mdC, bl: s35.blC }, { x: -MIDX, z: 0, md: s36.mdC, bl: s36.blC }, { x: X37 - MIDX, z: 0, md: s37.mdC, bl: s37.blC }] });
gum.position.set(MIDX, 1.2, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The temporary is shaped to sit at the gum line so the gum stays healthy for the final crown.' });

// --- neighbours (whole teeth) and the prepared 36
const t35 = DK.tooth(s35), t37 = DK.tooth(s37);
t35.group.position.x = X35; t37.group.position.x = X37;
const tooth = DK.tooth(s36, { omit: ['enamel', 'dentin'] }), stump = DK.prep(s36, PREP); tooth.group.add(stump);
fig.part(t35.group, { name: '35', label: false, fit: false, info: 'Lower left second premolar, the front neighbour.' });
fig.part(t37.group, { name: '37', label: false, fit: false, info: 'Lower left second molar, the back neighbour.' });
fig.part(tooth.group, { name: 'Prepared tooth', sub: 'exposed dentin', anchor: [-1.0, s36.crownL - PREP.occlusal - 1.4, s36.blC / 2 - PREP.axial - 0.2], dim: false, when: (e, sec) => e > 0.4 || sec.enabled,
  info: 'The tooth after shaping: dentin is exposed and the tubules lead to the pulp, so without cover it is sensitive and can be damaged.' });

// --- temporary crown + cement (one piece that lifts)
const temp = DK.restorationCrown(s36, 'composite', PREP);
temp.material = DK.mat('composite', { color: 0xddd3c1, roughness: 0.5 });   // bis-acryl: a shade flatter than enamel
const cement = DK.prep(s36, { axial: PREP.axial - CEMENT, occlusal: PREP.occlusal - CEMENT, margin: PREP.margin - CEMENT });
cement.material = DK.mat('cement');
const cap = new THREE.Group(); cap.add(temp); cap.add(cement);
fig.part(cap, { name: 'Temporary crown', sub: 'acrylic, for a few weeks', anchor: [0.8, s36.crownL - 1.4, s36.bl / 2 - 0.6], accent: true, explode: [0, 11, 0], dim: false,
  info: 'A plastic (bis-acryl or acrylic) crown made at the chair. It covers the prepared tooth and keeps its neighbours and the opposing teeth from moving until the final crown is fitted.' });
fig.part(cement, { inPlace: true, name: 'Temporary cement', sub: 'soft on purpose', anchor: () => [-s36.mdC / 2 + PREP.axial - CEMENT / 2 + 0.05, 2.8, 0], dim: false, when: (e, sec) => sec.enabled,
  info: 'A weak cement (drawn thicker than real) so the temporary comes off easily at the next visit. It can also come off by itself: call the practice if it does.' });
fig.part(tooth.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0.2, 1.6, 0], dim: false, when: (e, sec) => sec.enabled,
  info: 'The living nerve. The temporary seals the cut dentin above it from cold, sweet and bacteria.' });
const contact = (x, sideMd) => { const o = new THREE.Object3D(); o.position.set(x, s36.crownL * 0.62, -0.3); fig.world.add(o); return o; };
const cM = contact(s36.md / 2), cD = contact(-s36.md / 2);
fig.part(cM, { inPlace: true, name: 'Contact', sub: 'holds the space', anchor: [0, 0, 0], dim: false, when: e => e < 0.2,
  info: 'The temporary touches 35 and 37 as the tooth did. Without it the neighbours can tip into the gap and the final crown would no longer fit.' });

// --- section: mesio-distal through the middle of the teeth
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [temp], color: 0xece6da, kind: 'plain' },
  { objects: [cement], color: DK.COLORS.cement, kind: 'plain' },
  { objects: [t35.layers.enamel, t37.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t35.layers.dentin, t37.layers.dentin, t35.layers.root, t37.layers.root, tooth.layers.root, stump], color: DK.COLORS.dentinCap },
  { objects: [t35.layers.pulp, t37.layers.pulp, tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explodeLabel: 'Take off', section: { label: 'Cut', range: [-4, 7], offset: 0 } });
fig.xray([bone, gum], false);
fig.onFrame((dt, e) => { cement.visible = e < 0.02; });
fig.view('Cut', { fov: 26, section: true, offset: 0, theta: 0.12, phi: 1.42, zoom: 0.78, focus: [0, 3, 0], explode: 0, labels: ['Temporary crown', 'Temporary cement', 'Prepared tooth', 'Pulp'] });

// story: the prepared tooth, uncovered → the temporary comes down → push in on the contact with 35 → turn to the front and sweep the cut in
// → push in on cement, dentin and pulp → ease out to the whole cut: the shell sealing the tooth, touching both neighbours (teaching shot)
fig.story([
  { fov: 30, dur: 0, hold: 1.6, theta: 0.55, phi: 1.2, zoom: 1, explode: 1, labels: ['Prepared tooth', 'Temporary crown'] },
  { dur: 2.4, hold: 1.4, explode: 0, theta: 0.75, phi: 1.12, labels: ['Temporary crown'] },
  { dur: 2.2, hold: 2.2, zoom: 0.55, focus: [s36.md / 2, s36.crownL * 0.65, 0], theta: 0.35, phi: 1.05, labels: ['Contact', 'Temporary crown'] },
  { fov: 26, dur: 2.2, hold: 0.2, zoom: 1, focus: 'auto', theta: 0.1, phi: 1.42, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.4, hold: 2.4, offset: 0, zoom: 0.62, focus: [1.5, 3.5, 0], labels: ['Temporary cement', 'Prepared tooth', 'Pulp'] },
  { dur: 2.2, hold: 3.0, zoom: 1.14, focus: [0, -1.2, 0], theta: 0.16, phi: 1.36, labels: ['Temporary crown', 'Temporary cement', 'Prepared tooth', 'Pulp', 'Contact'] }   // teaching shot
]);
fig.start();
