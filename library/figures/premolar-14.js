// Library: maxillary right first premolar (FDI 14 = Universal 5), crown up (extracted-tooth convention), with a bucco-palatal cut. Tooth frame: CEJ at y = 0, +x mesial, +z buccal.
// poster: end
// Teaching point: the upper first premolar usually has two roots, buccal and palatal, each with its own canal; the lower premolars usually have one.
const fig = DK.figure({
  fov: 30,
  title: 'Upper first premolar, two roots',
  subtitle: 'FDI 14 (Universal 5), crown up.',
  view: { theta: 0.9, phi: 1.35 }
});

const tooth = DK.tooth(14);
const s = tooth.spec, L = tooth.layers;
const [B, P] = s.roots;
tooth.group.updateMatrixWorld(true);

const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hit = (objs, from, dir, lift = 0.05) => {
  ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
  return h ? [h.point.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
};
const rootAt = (r, u) => ({ x: r.x + r.apex[0] * u * u, y: -r.len * u, z: r.z + r.apex[1] * u * u });
const CUT = 0;   // bucco-palatal cut through the middle of both roots; the mesial half is removed and the camera looks from mesial

fig.part(tooth.group, { name: 'Tooth 14', label: false, info: 'Upper right first premolar (Universal 5): two cusps, usually two roots and two canals.' });

// labels: roots on their outer surfaces, canals on the cut face (x = CUT), cusps on the enamel
const bA = rootAt(B, 0.6), pA = rootAt(P, 0.6);
fig.part(L.root, { inPlace: true, name: 'Buccal root', sub: `${B.len} mm`, anchor: [CUT, bA.y, bA.z + B.rb * 0.85], labelOffset: [60, 0],
  info: 'The cheek-side root. The two roots split in the middle or apical third of the root.' });
fig.part(L.root, { inPlace: true, name: 'Palatal root', sub: `${P.len} mm`, anchor: [CUT, pA.y, pA.z - P.rb * 0.85], labelOffset: [-60, 0],
  info: 'The palate-side root. A single-rooted upper first premolar occurs too, and three roots rarely.' });
const cb = DK.canalAt(s, 0, -B.len * 0.45), cp = DK.canalAt(s, 1, -P.len * 0.45);
const canalPart = fig.part(L.pulp, { inPlace: true, name: 'Two canals', sub: 'one in each root', anchor: [CUT + 0.05, -B.len * 0.45, cb.z], labelOffset: [70, 40], accent: true, dim: false,
  when: (e, sec) => sec.enabled, info: 'Two canals is the most common pattern (Vertucci type IV), but the share varies widely between populations. Both must be found and treated in a root canal.' });
fig.part(L.pulp, { inPlace: true, name: 'Palatal canal', anchor: [CUT + 0.05, -P.len * 0.45, cp.z], labelOffset: [-70, 40], dim: false,
  when: (e, sec) => sec.enabled, info: 'The palatal canal, usually the larger opening.' });
const tipB = hit([L.enamel], [CUT, 40, s.bl * 0.25], [0, -1, 0]) || [0, s.crownL, 2];
const tipP = hit([L.enamel], [CUT, 40, -s.bl * 0.25], [0, -1, 0]) || [0, s.crownL, -2];
fig.part(L.enamel, { inPlace: true, name: 'Buccal cusp', sub: 'the taller', anchor: tipB, labelOffset: [60, -30],
  info: 'The longer, sharper cusp, about 1 mm taller than the palatal cusp.' });
fig.part(L.enamel, { inPlace: true, name: 'Palatal cusp', anchor: tipP, labelOffset: [-60, -30], info: 'The shorter palatal cusp, its tip slightly mesial.' });

fig.enableSection([1, 0, 0], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 4], offset: CUT } });
fig.view('Mesial', { theta: Math.PI / 2, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Buccal root', 'Palatal root'] });
fig.view('Buccal', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Buccal root', 'Buccal cusp'] });

// story: the tooth turning → from the cheek, one crown over what looks like one root → round to mesial: two roots, buccal and palatal →
// the cut sweeps in from mesial → push in on the split: a canal in each root → hero, the cut seen from mesial three-quarter
const SPLIT = [0, -B.len * 0.5, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.9, phi: 1.35, zoom: 1.05, section: false, labels: [], caption: 'An upper first premolar, crown up.' },
  { fov: 30, dur: 2.2, hold: 1.8, theta: 0.03, phi: 1.5, zoom: 1, labels: ['Buccal cusp'], caption: 'From the cheek: one crown, and the roots hide behind each other.' },
  { dur: 2.6, hold: 2.2, theta: Math.PI / 2, labels: ['Buccal root', 'Palatal root'], caption: 'Turn it: two roots, buccal and palatal.' },
  { dur: 0, hold: 0, section: true, offset: 5 },
  { fov: 26, dur: 2.2, hold: 1.8, offset: CUT, labels: ['Buccal cusp', 'Palatal cusp'], caption: 'Cut through both roots.' },
  { dur: 2.0, hold: 2.2, zoom: 0.62, focus: SPLIT, labels: ['Two canals', 'Palatal canal'], caption: 'A canal in each root.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: Math.PI / 2 - 0.4, phi: 1.4, zoom: 1, focus: 'auto', drift: 0, labels: ['Buccal cusp', 'Buccal root', 'Palatal root', 'Two canals'], caption: '' }
]);
fig.start();
