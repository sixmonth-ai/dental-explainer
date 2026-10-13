// Example: a lithium-disilicate onlay on the mandibular left first molar (FDI 36 = Universal 19): an MOD cavity with the two
// buccal cusps covered. The onlay lifts off the prep on explode; a bucco-lingual cut through the central fossa shows the isthmus
// width and depth, the reduced buccal cusp against the intact lingual cusp, and the pulp horns below. Frame: +x = mesial, +z = buccal, CEJ at y = 0. Sizes in mm.
const FDI = 36;
const CAV = { isthmus: 2.5, depth: 1.8, boxes: ['mesial', 'distal'], boxFloor: 1.0, cusps: ['buccal'], reduction: 1.5 };   // ceramic partial-crown rules (dental-facts.md §18)

const fig = DK.figure({
  title: 'Onlay on a lower first molar',
  subtitle: 'FDI 36 (Universal 19). MOD cavity, buccal cusps covered. Lithium disilicate.',
  view: { theta: 0.55, phi: 1.2 }
});

const roots = DK.tooth(FDI, { omit: ['enamel', 'dentin'] }), s = roots.spec;      // roots and pulp
const prep = DK.inlayPrep(s, CAV); roots.group.add(prep);                           // carved enamel shell + dentin body
const onlay = DK.inlay(s, CAV, 'lithium disilicate');
const CREST = -1.8;
const bone = DK.bone({ width: 22, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;

fig.part(bone, { name: 'Bone', label: false, fit: false, explode: [0, -8, 0], info: 'Alveolar bone around the two roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, explode: [0, -8, 0], info: 'The box floor stays about 1 mm above the gum line.' });
fig.part(roots.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: 5 cusps, 2 roots.' });
fig.part(prep.enamel, { inPlace: true, name: 'Prepared tooth', sub: 'MOD, buccal cusps reduced', anchor: [0, 6.2, s.bl / 2 - 0.3], info: `Occlusal isthmus ≥ ${CAV.isthmus} mm wide and ${CAV.depth} mm deep, proximal boxes, buccal cusps reduced ${CAV.reduction} mm. Walls diverge ~6–10°, internal angles rounded, no bevels.` });
fig.part(prep.enamel, { inPlace: true, name: 'Proximal box', sub: `floor ${CAV.boxFloor} mm above the CEJ`, anchor: [s.md / 2 - 0.3, CAV.boxFloor + 1.2, 0], dim: false, info: 'The box opens through the contact so the margin can be finished and cleaned.' });
fig.part(prep.dentin, { inPlace: true, name: 'Dentin', anchor: [0, 4.2, -3.2], info: 'The pulpal floor sits in dentin, well above the pulp horns.', when: (e, sec) => sec && sec.enabled });
fig.part(onlay, { name: 'Onlay', sub: 'lithium disilicate', anchor: [-1, s.crownL + 0.2, s.bl / 2 - 1.5], explode: [0, 9, 0], accent: true, info: 'A bonded ceramic partial crown: it fills the cavity and covers the weakened buccal cusps (≥ 1.5 mm of ceramic). An inlay would stay inside the cusps.' });
fig.part(roots.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0, 1.5, 0], info: 'Pulp horns under the cusps; keep the floor at least ~1 mm away.', when: (e, sec) => sec && sec.enabled });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [onlay], color: 0xe4e0d6 },
  { objects: [prep.enamel], color: DK.COLORS.enamelCap },
  { objects: [prep.dentin, roots.layers.root], color: DK.COLORS.dentinCap },
  { objects: [roots.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ section: { label: 'Cut', range: [-5, 5], offset: 0 } });
fig.view('Occlusal', { theta: 0.3, phi: 0.35, zoom: 0.85, explode: 1, section: false });

// story (a short film): the restored molar → the onlay lifts off → from above, the cavity outline → reseat and turn to the
// buccal side as the cut sweeps in → push in on the isthmus, box and cusp coverage
fig.story([
  { dur: 0, hold: 1.4, theta: 0.55, phi: 1.2, zoom: 1.05, labels: [], caption: 'A lower first molar restored with a ceramic onlay.' },
  { dur: 2.4, hold: 1.8, theta: 0.5, phi: 0.95, explode: 1, labels: ['Onlay', 'Prepared tooth'], caption: 'The onlay lifts off: it fills the cavity and covers the buccal cusps.' },
  { dur: 2.0, hold: 2.0, theta: 0.3, phi: 0.35, zoom: 0.8, focus: [0, 4, 0], labels: ['Prepared tooth', 'Proximal box'], caption: 'From above: the MOD outline, isthmus and boxes.' },
  { dur: 2.2, hold: 0.3, zoom: 1, focus: 'auto', theta: 1.5, phi: 1.4, explode: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.2, hold: 1.8, offset: 0, labels: ['Onlay', 'Dentin', 'Pulp'], caption: 'Cut through the central fossa: the isthmus is 1.8 mm deep, in dentin.' },
  { dur: 1.8, hold: 2.6, zoom: 0.62, focus: [0, 5, 0], theta: 1.35, explode: 0.22, labels: ['Onlay', 'Prepared tooth', 'Pulp'], caption: 'The buccal cusp is covered by 1.5 mm of ceramic; the lingual cusp keeps its enamel.' }
]);
fig.start();
