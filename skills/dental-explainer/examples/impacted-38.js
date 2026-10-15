// Example: an impacted mandibular left third molar (FDI 38 = Universal 17) against 37, in a mesio-distal cut of the jaw with the
// inferior alveolar canal below. DK.impaction poses the tooth by Winter's angulation (angle to the long axis of 37) and Pell & Gregory
// depth (occlusal surface vs the occlusal plane and cervical line of 37); the buttons re-pose it live and the readout names the class.
// Left quadrant: the group is mirrored (scale.x = −1) so mesial points to the viewer's left, as seen from the patient's left.
const fig = DK.figure({
  fov: 26,
  title: 'Impacted lower third molar',
  subtitle: 'FDI 38 (Universal 17) in a mesio-distal cut. Third molars vary; this is one typical pose.',
  view: { theta: 0, phi: 1.45 }
});

const CREST = -1.8, CANAL_Y = -17.5, CANAL_R = 1.4;
const quad = new THREE.Group(); quad.scale.x = -1;   // left-side chirality
const t37 = DK.tooth(37), t36 = DK.tooth(36);
t36.group.position.x = t37.spec.md / 2 + t36.spec.md / 2;
const imp = DK.impaction({ fdi: 38, neighbour: 37, angulation: 'mesioangular', depth: 'B' });
const t38 = imp.tooth;
const bone = DK.bone({ width: 46, height: 24, depth: 11.5, cortical: 1.2, crest: 1.6 });
bone.position.set(-4, CREST, 0);
const path = [[-24, CANAL_Y - 0.8, 0.6], [-10, CANAL_Y, 0.3], [4, CANAL_Y + 0.4, 0], [16, CANAL_Y + 1.0, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.7, DK.mat('nerve'), { caps: false });
const canal = new THREE.Group(); canal.add(lumen, nerve);
const gum = DK.gingiva({ width: 46, height: 3.4, depth: 12, crest: 1.4, around: [{ x: 4 + t36.group.position.x, z: 0, md: t36.spec.mdC, bl: t36.spec.blC }, { x: 4, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
gum.position.set(-4, 1.1, 0);
quad.add(bone, canal, gum, t36.group, t37.group, imp.group);

fig.part(quad, { name: 'Jaw', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'Mandibular body. The ascending ramus begins just behind the third molar.' });
fig.part(gum, { inPlace: true, name: 'Gingiva', label: false, info: 'An operculum of gingiva often covers a partly erupted third molar.' });
fig.part(t36.group, { inPlace: true, name: '36', label: false, info: 'Lower left first molar (Universal 19).' });
fig.part(t37.group, { inPlace: true, name: '37', anchor: [0, 5.5, t37.spec.bl / 2], labelOffset: [0, -70], info: 'Lower left second molar (Universal 18). The reference for both classifications: its long axis and its occlusal plane.' });
fig.part(t38.group, { inPlace: true, name: '38', sub: 'third molar', accent: true, anchor: [0, 4.5, t38.spec.bl / 2], labelOffset: [40, -80], info: 'Lower left third molar (Universal 17): short fused roots, crown leaning against 37.' });
fig.part(canal, { inPlace: true, name: 'Inferior alveolar canal', anchor: [-12, CANAL_Y - 1, 0], labelOffset: [-10, 70], info: 'Carries the inferior alveolar nerve and vessels; its closeness to the roots is what the radiograph and CBCT are checked for.' });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [t36.layers.enamel, t37.layers.enamel, t38.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t36.layers.root, t36.layers.dentin, t37.layers.root, t37.layers.dentin, t38.layers.root, t38.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t36.layers.pulp, t37.layers.pulp, t38.layers.pulp], color: DK.COLORS.pulpCap }
]);

// the pose as two numbers the buttons and the story animate
fig.param('angle', imp.angle, a => imp.set({ angle: a }));
fig.param('depth', imp.depthMm, d => imp.set({ depth: d }));
const DEPTH = { A: 0, B: t37.spec.crownL * 0.5, C: t37.spec.crownL + 1 };
[['Vertical', 0], ['Mesioangular', 45], ['Horizontal', 90], ['Distoangular', -35]].forEach(([l, a]) => fig.button(l, () => fig.goTo({ set: { angle: a } }, 1.0)));
['A', 'B', 'C'].forEach(k => fig.button('Depth ' + k, () => fig.goTo({ set: { depth: DEPTH[k] } }, 0.8)));   // Pell & Gregory depth
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
let shown = '';
fig.onFrame(() => { const k = imp.winter + imp.pellGregory; if (k !== shown) { shown = k; fig.setReadout([{ k: 'Winter', v: imp.winter + ` (${Math.round(imp.angle)}°)` }, { k: 'Pell & Gregory depth', v: imp.pellGregory }]); } });

// story: the jaw from the side → the cut sweeps in → push in on the crown wedged against 37 → down to the apices and the canal → hero
fig.story([
  { dur: 0, hold: 1.4, theta: 0.55, phi: 1.2, zoom: 1.05, section: false, labels: ['37', '38'], caption: 'A lower third molar that never made it: tilted forward against the second molar.' },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 1.4, theta: 0, phi: 1.45, zoom: 1, offset: 0, labels: ['37', '38'], caption: 'Mesioangular (Winter): its long axis leans about 45° toward 37.' },
  { dur: 2.0, hold: 2.0, zoom: 0.6, focus: [8, 2, 0], labels: ['38'], caption: 'Pell & Gregory B: the occlusal surface sits between the occlusal plane and the cervical line of 37.' },
  { dur: 2.2, hold: 2.2, zoom: 0.7, focus: [8, -11, 0], phi: 1.5, labels: ['Inferior alveolar canal'], caption: 'The fused roots end close to the inferior alveolar canal.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.12, phi: 1.4, labels: ['37', '38', 'Inferior alveolar canal'], drift: 0, caption: '' }
]);
fig.start();
