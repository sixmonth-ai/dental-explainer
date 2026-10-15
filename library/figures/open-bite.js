// Anterior open bite: both arches in occlusion (crowns in their gum ridges, like a study model); the front teeth part vertically while the back teeth stay closed. Frame: the DK.arch mandibular frame (+x = patient's left, +z anterior, y up, lower CEJs at y = 0).
// poster: end
const GAP = 3.0;          // mm between the incisal edges at full open bite (schematic; open bites range from a hairline to several mm)
const fig = DK.figure({
  fov: 32,
  title: 'Open bite',
  subtitle: "Teeth closed together, seen from the front: patient's right on the left.",
  view: { theta: 0.55, phi: 1.42, margin: 0.78 }
});
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const scene = new THREE.Group();
const low = DK.arch({ jaw: 'mandible', build: crowns }); scene.add(low.group);
const upHold = new THREE.Group(); scene.add(upHold);
const up = DK.arch({ jaw: 'maxilla', placement: 'jaw', build: crowns }); upHold.add(up.group);
const OVERBITE = 2.5;     // the normal bite: upper incisors overlap the lower by ~2.5 mm, as in DK.mandible's occlusion
upHold.position.set(0, DK.toothPreset(31).crownL - OVERBITE + DK.toothPreset(11).crownL, 2.6); upHold.rotation.x = -0.05;
scene.updateMatrixWorld(true);
const gumL = DK.gingivaArch(low), gumU = DK.gingivaArch(up);   // world = scene frame (scene at the origin)
scene.add(gumL); upHold.attach(gumU);
fig.part(scene, { name: 'Teeth', label: false, info: 'Upper and lower teeth, second molar to second molar, closed together.' });
fig.part(gumU, { inPlace: true, name: 'Upper gum', label: false, info: 'Gum along the upper teeth (schematic).' });
fig.part(gumL, { inPlace: true, name: 'Lower gum', label: false, info: 'Gum along the lower teeth (schematic).' });
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
[...up.teeth, ...low.teeth].forEach(t => fig.part(t.tooth.group, { inPlace: true, name: 'FDI ' + t.fdi, label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// --- opening: the front teeth (and their gum) move apart vertically, upper up and lower down, fading out toward the premolars;
// the molars and second premolars do not move, so the back teeth stay in contact. Weight by arch depth z: 1 for incisors, ~0.7 at
// the canines, ~0.1 at the first premolars, 0 behind.
const w = z => DK.util.smooth(-13, -4, z);
const SPLIT = (OVERBITE + GAP) / 2;                // each arch moves half of the total vertical change
const ups = up.teeth.map(t => ({ g: t.tooth.group, k: w(t.slot.c[1]) })), lows = low.teeth.map(t => ({ g: t.tooth.group, k: w(t.slot.c[1]) }));
const gU = gumU.geometry.attributes.position, gU0 = Float32Array.from(gU.array), gL = gumL.geometry.attributes.position, gL0 = Float32Array.from(gL.array);
let open = 0;
fig.param('open', 0, v => {
  open = v; const d = SPLIT * v;
  ups.forEach(b => { b.g.position.y = -d * b.k; });          // up.group is mirrored in y: local −y is up in the world
  lows.forEach(b => { b.g.position.y = -d * b.k; });
  for (let i = 0; i < gU.count; i++) gU.array[3 * i + 1] = gU0[3 * i + 1] + d * w(gU0[3 * i + 2] - 2.6);
  for (let i = 0; i < gL.count; i++) gL.array[3 * i + 1] = gL0[3 * i + 1] - d * w(gL0[3 * i + 2]);
  [gumU, gumL].forEach(m => { m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); });
});

// --- labels
const t11 = T(up, 11), t41 = T(low, 41), t16 = T(up, 16), t46 = T(low, 46);
const edgeU = () => t11.tooth.group.localToWorld(new THREE.Vector3(0, t11.spec.crownL, 0)), edgeL = () => t41.tooth.group.localToWorld(new THREE.Vector3(0, t41.spec.crownL, 0));
const gapMark = new THREE.Object3D(); scene.add(gapMark);
fig.part(gapMark, { inPlace: true, name: 'Gap', sub: 'front teeth do not meet', accent: true, labelOffset: [90, -70], dim: false, when: () => open > 0.6,
  anchor: () => { scene.updateMatrixWorld(true); const a = edgeU(), b = edgeL(); return [0, (a.y + b.y) / 2, Math.max(a.z, b.z) + 0.6]; },
  info: 'With the back teeth together the front teeth still do not touch, so biting into a sandwich or an apple is hard. Common causes: a long thumb or dummy habit, the tongue resting between the front teeth, or the way the jaws grew.' });
fig.part(t11.tooth.group, { inPlace: true, name: 'Front teeth', sub: 'overlap', anchor: [0, t11.spec.crownL - 1.2, 3.2], labelOffset: [90, -70], dim: false, when: () => open < 0.4,
  info: 'Normally the upper front teeth overlap the lower ones by about 2 to 3 mm when the back teeth close.' });
fig.part(t16.tooth.group, { inPlace: true, name: 'Back teeth', sub: 'touch', anchor: [0, t16.spec.crownL - 1.5, 5.6], labelOffset: [-80, -60], dim: false,
  info: 'The molars meet as usual. In an open bite all the chewing happens on the back teeth.' });

fig.view('Front', { theta: 0, phi: 1.52, zoom: 0.62, focus: [0, 9, -3] });
fig.view('Side', { theta: -Math.PI / 2, phi: 1.52, zoom: 1, focus: 'auto' });

const FRONT = [0, 9, -2];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.55, phi: 1.42, zoom: 1, labels: [], caption: 'Upper and lower teeth, closed together.' },
  { dur: 2.2, hold: 1.8, theta: 0.1, phi: 1.52, zoom: 0.6, focus: FRONT, labels: ['Front teeth'], caption: 'Normally the upper front teeth overlap the lower ones.' },
  { dur: 2.6, hold: 1.8, set: { open: 1 }, labels: ['Gap'], caption: 'In an open bite the front teeth do not meet.' },
  { dur: 2.6, hold: 2.2, theta: -1.45, phi: 1.5, zoom: 0.95, focus: 'auto', labels: ['Gap', 'Back teeth'], caption: 'The back teeth still touch.' },
  { dur: 2.4, hold: 2.4, theta: -0.62, phi: 1.5, zoom: 0.84, labels: ['Gap', 'Back teeth'] }
]);
fig.start();
