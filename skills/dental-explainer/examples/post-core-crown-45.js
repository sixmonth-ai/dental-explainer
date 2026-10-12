// Example: root-filled mandibular right second premolar (FDI 45 = Universal 29) restored with gutta-percha, fibre post,
// composite core and a crown wrapping a 2 mm ferrule. Tooth frame: +x mesial, +z buccal, CEJ (= crown margin) at y = 0.
const FDI = 45, FERRULE = 2.0, POST_IN_ROOT = 8, GP_SEAL_MIN = 4;
const spec = DK.toothPreset(FDI);
const fig = DK.figure({
  title: 'Root filling, post, core, crown',
  subtitle: 'FDI 45 (Universal 29), lower right second premolar.',
  view: { theta: 0.5, phi: 1.3 }
});

const tooth = DK.tooth(spec, { omit: ['enamel', 'dentin', 'pulp'] });   // root only: crown already lost
const s = tooth.spec;
const ferrule = DK.prep(s, { maxY: FERRULE });                            // own dentin collar above the margin
const core = DK.prep(s, { material: 'composite', minY: FERRULE });
core.material.color.copy(DK.color(0xc9d2d8));   // composite tinted grey-blue for contrast (say so in the hover text)
const workingLen = s.rootL - 0.5;
const gpTop = -POST_IN_ROOT - 0.2;
const gp = DK.guttaPercha(s, 0, { from: gpTop });
const post = DK.post({ length: POST_IN_ROOT, exposed: 4.5, d0: 1.5, d1: 1.0 });
const crown = DK.restorationCrown(s, 'ceramic');
const bone = DK.bone({ width: 16, height: 19, depth: 11, crest: 1.5 }); bone.position.y = -1.8;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 11.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;

fig.part(bone, { name: 'Bone', anchor: [7.8, -8, 3], explode: [0, -12, 0], info: 'Alveolar bone around the root.' });
fig.part(gum, { name: 'Gingiva', anchor: [-7.6, 0.4, 5.6], explode: [0, -12, 0], info: 'Soft tissue; the crown margin sits at or just below the gum line.' });
fig.part(tooth.group, { name: 'Your root', sub: '1 root, 1 canal', anchor: [2.4, -7, 0], info: 'The patient’s own root stays in the bone. Lower second premolars usually have one root; about a quarter have two or more canals.' });
fig.part(ferrule, { name: 'Ferrule', sub: `${FERRULE} mm of own tooth`, anchor: [3, 1, 0], accent: true, info: 'A 1.5–2 mm high, ~1 mm thick collar of sound dentin that the crown wraps. It improves fracture resistance more than any post.' });
fig.part(gp, { name: 'Root filling', sub: 'gutta-percha', anchor: () => [DK.canalAt(s, 0, -12).x, -12, DK.canalAt(s, 0, -12).z], explode: [0, 0, 0], info: `Seals the cleaned canal to the apex. At least ${GP_SEAL_MIN} mm must stay apically after post-space preparation (articles quote 4–6 mm).`, when: (e, sec) => (sec && sec.enabled) || fig.xrayOn });
fig.part(post, { name: 'Fibre post', sub: 'glass fibre, bonded', anchor: [0.8, 2.5, 0], explode: [0, 9, 0], info: 'Only retains the core. A post does not strengthen the root; it is used when too little crown is left to hold a core.' });
fig.part(core, { name: 'Core', sub: 'composite build-up', anchor: [-2.6, 4, 0], explode: [0, 17, 0], info: 'Rebuilds the missing crown into a preparation shape the crown can sit on. (Tinted blue here for contrast; real composite is tooth-coloured.)' });
fig.part(crown, { name: 'Crown', sub: 'ceramic, full coverage', anchor: [-3.4, 6.5, 2.5], explode: [0, 26, 0], info: 'Covers the whole tooth and wraps the ferrule, holding everything together under biting forces.' });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: 0xf7f4ec },
  { objects: [tooth.layers.root, ferrule], color: DK.COLORS.dentinCap },
  { objects: [core], color: 0xbfc8ce },
  { objects: [gp], color: DK.COLORS.gutta },
  { objects: [post], color: 0xbfb9a6 }
]);
fig.standardControls({ section: { label: 'Cut', range: [-2.5, 2.5], offset: 0 } });

// story: lift the layers in the order they go in → back together → cut to show the ferrule
fig.story([
  { dur: 0, hold: 0.8, labels: [] },
  { dur: 1.6, hold: 2.0, explode: 0.8, labels: ['Crown', 'Core', 'Fibre post', 'Root filling'], caption: 'Four layers, lifted in the order they go in.' },
  { dur: 1.2, hold: 0.3, explode: 0, labels: [] },
  { dur: 1.4, hold: 2.4, theta: 0, phi: 1.45, section: true, offset: 0, labels: ['Ferrule', 'Fibre post', 'Root filling'], caption: 'The 2 mm ferrule, not the post, resists fracture.' }
]);

const seal = workingLen - POST_IN_ROOT - 0.2;
const ok = (v, min) => ({ v: DK.mm(v) + (v >= min ? ' ✓' : ' ⚠'), cls: v >= min ? 'ok' : 'warn' });
fig.setReadout([
  Object.assign({ k: 'Ferrule height (≥1.5)' }, ok(FERRULE, 1.5)),
  Object.assign({ k: `Apical seal (≥${GP_SEAL_MIN})` }, ok(seal, GP_SEAL_MIN))
]);
fig.start();
