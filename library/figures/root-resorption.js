// Comparison: internal vs external root resorption on the maxillary right central incisor (FDI 11 = Universal 8), crown up (model convention), two teeth side by side cut by one mesio-distal plane through the canal, seen from the labial like a periapical radiograph. Frame: +x mesial, +z labial, CEJ at y = 0, mm.
// poster: end
// Left: internal (inflammatory) resorption, a smooth oval widening of the canal in the middle third (a closed ellipsoid centred on the
// canal, painted as pulp-derived granulation tissue). Right: external (inflammatory) resorption, an irregular crater eaten into the
// mesial root surface from the ligament side (DK.periapicalLesion blob centred on the root surface), the canal running past it intact.
// Lesion sizes are schematic (about 2 to 3 mm), not from dental-facts.md.
const FDI = 11, CREST = -1.6, GAP = 13;                  // GAP: centre-to-centre distance of the two teeth
const LES_Y = -5.6;                                        // both lesions in the middle third of the 13 mm root

const fig = DK.figure({
  fov: 26,
  title: 'Internal vs external root resorption',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up.',
  view: { theta: 0.1, phi: 1.45, margin: 0.82 }
});

function makeSet(cx) {
  const tooth = DK.tooth(FDI), s = tooth.spec;
  tooth.group.position.x = cx;
  const bone = DK.bone({ width: 11.5, height: 13.2, depth: 10.5, cortical: 1.0, crest: 1.4 }); bone.position.set(cx, CREST, 0);
  const gum = DK.gingiva({ width: 11.5, height: 3.0, depth: 11.4, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.set(cx, 1.1, 0);
  return { tooth, s, L: tooth.layers, bone, gum, cx };
}
const I = makeSet(-GAP / 2), E = makeSet(GAP / 2);

// --- internal: a smooth oval ballooning of the canal (symmetric about the canal centre line)
const cI = DK.canalAt(I.s, 0, LES_Y);
const rootHalfI = DK.toothSurfaceAt(I.s, LES_Y, 0).x - cI.x;                 // MD half-width of the root at that level
const internal = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), DK.mat('pulp'));
const IR = [Math.min(1.35, rootHalfI - 0.8), 2.2, 1.1];                      // leaves about 1 mm of root wall on each side
internal.position.set(cI.x, LES_Y, cI.z);
I.tooth.group.add(internal);

// --- external: an irregular crater from the root surface inward, the canal untouched
const surfE = DK.toothSurfaceAt(E.s, LES_Y + 0.4, 0);
const extGroup = new THREE.Group(); extGroup.position.set(surfE.x - 0.15, LES_Y + 0.4, 0); extGroup.scale.set(1, 1.45, 1);
const external = DK.periapicalLesion({ radius: 1.7, seed: 3, color: 0x8a736d });
extGroup.add(external); E.tooth.group.add(extGroup);
const cE = DK.canalAt(E.s, 0, LES_Y);

// --- parts
[I, E].forEach(S => {
  fig.part(S.bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the root.' });
  fig.part(S.gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the neck of the tooth.' });
});
fig.part(I.tooth.group, { name: 'Internal', sub: 'from inside the canal', anchor: [0, I.s.crownL + 1.2, 0], info: 'Internal resorption: inflamed pulp tissue activates clast cells on the canal wall, which eat the dentin outward. Rare; often after trauma. In the crown it can show as a pink spot.' });
fig.part(E.tooth.group, { name: 'External', sub: 'from the root surface', anchor: [0, E.s.crownL + 1.2, 0], info: 'External resorption: cells from the ligament side eat into the root surface, for example after trauma, orthodontic forces or an infected canal next to damaged cementum. Much more common than internal.' });
const zc = sec => (sec.enabled ? sec.offset : 0) + 0.1;
fig.part(internal, { inPlace: true, name: 'Canal balloons out', sub: 'smooth and symmetric', anchor: (e, sec) => [-0.75, 0.25, (zc(sec) - cI.z) / IR[2]], labelOffset: [-110, -30], accent: true, dim: false, when: () => internal.visible && internal.scale.y > IR[1] * 0.5, info: 'On a radiograph: a smooth, round or oval widening of the canal itself; the canal outline disappears into it. It stays in the same place on an angled second radiograph.' });
fig.part(external, { inPlace: true, name: 'Crater in the root', sub: 'canal wall intact', anchor: (e, sec) => [0.55, 0.2, zc(sec) / 1.6], labelOffset: [90, -40], dim: false, when: () => (external.userData.k || 0) > 0.5, info: 'On a radiograph: an irregular, ragged defect over the root; the canal outline can be traced straight through it. It shifts against the canal on an angled second radiograph.' });
const canalMark = new THREE.Object3D(); canalMark.position.set(cE.x, LES_Y - 2.6, 0); E.tooth.group.add(canalMark);
fig.part(canalMark, { inPlace: true, name: 'Canal unchanged', anchor: (e, sec) => [0, 0, zc(sec) - cE.z], labelOffset: [-80, 40], dim: false, when: () => (external.userData.k || 0) > 0.5, info: 'The pulp and canal are not part of external resorption, so the tooth can still respond normally to pulp tests early on.' });

// --- params: each lesion grows from nothing
fig.param('int', 1, k => { internal.visible = k > 0.02; internal.scale.set(Math.max(0.01, IR[0] * k), Math.max(0.01, IR[1] * k), Math.max(0.01, IR[2] * k)); });
fig.param('ext', 1, k => external.set(k));

fig.enableSection([0, 0, 1], [
  { objects: [I.bone.userData.layers.cortical, E.bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [I.bone.userData.layers.cancellous], color: 0xffffff, texture: I.bone.userData.layers.cancellous.userData.capTexture },
  { objects: [E.bone.userData.layers.cancellous], color: 0xffffff, texture: E.bone.userData.layers.cancellous.userData.capTexture },
  { objects: [I.gum, E.gum], color: DK.COLORS.gingivaCap },
  { objects: [I.L.enamel, E.L.enamel], color: DK.COLORS.enamelCap },
  { objects: [I.L.root, I.L.dentin, E.L.root, E.L.dentin], color: DK.COLORS.dentinCap },
  { objects: [external], color: 0x8a736d, kind: 'gingiva' },
  { objects: [I.L.pulp, E.L.pulp], color: DK.COLORS.pulpCap },
  { objects: [internal], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0 } });
fig.xray([I.bone, E.bone, I.gum, E.gum, I.L.enamel, I.L.dentin, I.L.root, E.L.enamel, E.L.dentin, E.L.root], false);
const ALL = ['Internal', 'External', 'Canal balloons out', 'Crater in the root'];
fig.view('Radiograph', { theta: 0, phi: 1.52, zoom: 1, focus: 'auto', section: false, xray: 1, labels: ALL });

// --- story: two incisors → the cut sweeps in → internal grows → external grows → the radiograph comparison
const FI = [-GAP / 2, -3.8, 0], FE = [GAP / 2 + 0.8, -3.8, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.55, phi: 1.25, zoom: 1.02, section: false, xray: 0, set: { int: 0, ext: 0 }, labels: ['Internal', 'External'], caption: 'Two upper front teeth; resorption will eat each root from a different side.' },
  { fov: 26, dur: 2.2, hold: 0.1, theta: 0.06, phi: 1.47, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 0.4, offset: 0, labels: [] },
  { dur: 2.0, hold: 0.1, zoom: 0.74, focus: FI, theta: 0.04, labels: ['Internal'] },
  { dur: 2.4, hold: 1.8, set: { int: 1 }, labels: ['Canal balloons out'], caption: 'Internal: the canal wall is eaten outward, a smooth oval in the canal.' },
  { dur: 2.2, hold: 0.1, zoom: 0.74, focus: FE, theta: 0.1, labels: ['External'] },
  { dur: 2.4, hold: 1.8, set: { ext: 1 }, labels: ['Crater in the root', 'Canal unchanged'], caption: 'External: a ragged crater from the root surface; the canal runs past it.' },
  { dur: 2.4, hold: 2.6, zoom: 1, focus: 'auto', theta: 0.05, phi: 1.5, labels: ALL, caption: 'Internal: a smooth balloon in the canal. External: a ragged crater beside an intact canal.' }
]);
fig.start();
