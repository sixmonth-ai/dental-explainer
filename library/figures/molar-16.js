// Library: maxillary right first molar (FDI 16 = Universal 3), crown up (extracted-tooth convention). Tooth frame: CEJ at y = 0, +x mesial, +z buccal.
// poster: end
// Teaching point: three roots (mesiobuccal, distobuccal, palatal; the palatal is the longest) under a crown crossed by the oblique ridge.
const fig = DK.figure({
  fov: 30,
  title: 'Upper first molar, three roots',
  subtitle: 'FDI 16 (Universal 3), crown up.',
  view: { theta: 0.7, phi: 1.25 }
});

const tooth = DK.tooth(16);
const s = tooth.spec, L = tooth.layers;
const [MB, DB, P] = s.roots;
tooth.group.updateMatrixWorld(true);

// a root's centre line at depth fraction u (0 = root start, 1 = apex), as the kit draws it
const rootAt = (r, u) => ({ x: r.x + r.apex[0] * u * u + r.flare[0] * Math.sin(Math.PI * u), y: -r.len * u, z: r.z + r.apex[1] * u * u + r.flare[1] * Math.sin(Math.PI * u) });

fig.part(tooth.group, { name: 'Tooth 16', label: false, info: 'Upper right first molar (Universal 3): 4 main cusps, 3 roots in about 96% of teeth.' });

// root labels: anchors on each root's outer surface, two thirds of the way down
const a1 = rootAt(MB, 0.62), a2 = rootAt(DB, 0.62), a3 = rootAt(P, 0.62);
fig.part(L.root, { inPlace: true, name: 'Mesiobuccal root', sub: `${MB.len} mm`, anchor: [a1.x + MB.ra * 0.7, a1.y, a1.z + MB.rb * 0.7], labelOffset: [40, 10],
  info: 'Broad bucco-palatally, flat mesio-distally, curving distally at the apex. Carries MB1 and, in most teeth, a second canal (MB2).' });
fig.part(L.root, { inPlace: true, name: 'Distobuccal root', sub: `${DB.len} mm`, anchor: [a2.x - DB.ra * 0.7, a2.y, a2.z + DB.rb * 0.7], labelOffset: [-40, 10],
  info: 'The shortest and narrowest of the three, roughly round in section. One canal in about 98% of teeth.' });
fig.part(L.root, { inPlace: true, name: 'Palatal root', sub: `longest, ${P.len} mm`, anchor: [a3.x, a3.y, a3.z - P.rb * 0.8], labelOffset: [0, 30],
  info: 'The longest root, angled toward the palate. One wide canal in over 99% of teeth.' });

// oblique ridge: from the mesiopalatal cusp across the crown to the distobuccal cusp, draped on the enamel by casting rays down
const enamelMeshes = []; L.enamel.traverse(o => { if (o.isMesh) enamelMeshes.push(o); });
const ray = new THREE.Raycaster();
const surfY = (x, z) => { ray.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(enamelMeshes, false)[0]; return h ? h.point.y : null; };
const MP_CUSP = [0.35 * s.md / 2, -0.42 * s.bl / 2], DB_CUSP = [-0.42 * s.md / 2, 0.48 * s.bl / 2];
const ridgePts = [], RIDGE_BOW = 0.9;   // mm toward distal at the middle
for (let i = 0; i <= 24; i++) {
  // a gentle curve bowing distally, so it runs over the ridge between the cusps rather than down the central pit
  const t = 0.1 + 0.8 * i / 24, bow = 4 * t * (1 - t) * RIDGE_BOW;
  const x = MP_CUSP[0] + (DB_CUSP[0] - MP_CUSP[0]) * t - bow, z = MP_CUSP[1] + (DB_CUSP[1] - MP_CUSP[1]) * t, y = surfY(x, z);
  if (y !== null) ridgePts.push([x, y + 0.14, z]);
}
const ridgeMat = new THREE.MeshBasicMaterial({ color: fig.accent.clone(), toneMapped: false, transparent: true });
const ridge = DK.tube(ridgePts, 0.16, ridgeMat, { caps: true });
tooth.group.add(ridge);
const mid = ridgePts[Math.floor(ridgePts.length / 2)];
const ridgePart = fig.part(ridge, { inPlace: true, name: 'Oblique ridge', accent: true, anchor: [mid[0], mid[1], mid[2]], labelOffset: [0, -60], dim: false,
  info: 'Joins the mesiopalatal and distobuccal cusps across the occlusal surface. Unique to maxillary molars, and largest on the first molar.' });

// cusp labels for the occlusal view
const cuspAt = (cx, cz) => { const x = cx * s.md / 2, z = cz * s.bl / 2; return [x, (surfY(x, z) ?? s.crownL) + 0.1, z]; };
fig.part(L.enamel, { inPlace: true, name: 'Mesiopalatal cusp', sub: 'the largest', anchor: cuspAt(0.35, -0.42), labelOffset: [40, 40], info: 'The largest cusp of the tooth. A Carabelli cusp or groove may sit on its palatal surface.' });
fig.part(L.enamel, { inPlace: true, name: 'Distobuccal cusp', anchor: cuspAt(-0.42, 0.48), labelOffset: [-40, -40], info: 'The buccal end of the oblique ridge.' });

const ROOTS = ['Mesiobuccal root', 'Distobuccal root', 'Palatal root'];
fig.standardControls({ explode: false });
fig.view('Buccal', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', labels: ['Mesiobuccal root', 'Distobuccal root'] });
fig.view('Mesial', { theta: Math.PI / 2, phi: 1.5, zoom: 1, focus: 'auto', labels: ['Mesiobuccal root', 'Palatal root'] });
fig.view('Occlusal', { theta: 0, phi: 0.12, zoom: 0.62, focus: [0, s.crownL, 0], labels: ['Oblique ridge', 'Mesiopalatal cusp', 'Distobuccal cusp'] });

fig.onFrame(() => { ridgeMat.opacity = 0.35 + 0.65 * ridgePart.alpha; });

// story: the tooth turning → buccal side (two buccal roots) → the mesial side (the palatal root splays away, the longest) →
// over the crown (the oblique ridge) → hero: three-quarter from above, roots and ridge together
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.7, phi: 1.25, zoom: 1.05, labels: [], caption: 'An upper first molar, crown up.' },
  { fov: 30, dur: 2.2, hold: 2.0, theta: 0.05, phi: 1.5, zoom: 1, labels: ['Mesiobuccal root', 'Distobuccal root'], caption: 'From the cheek side: two buccal roots.' },
  { dur: 2.4, hold: 2.2, theta: 1.5, phi: 1.5, labels: ['Mesiobuccal root', 'Palatal root'], caption: 'From the front: the palatal root splays toward the palate. It is the longest.' },
  { fov: 26, dur: 2.4, hold: 2.4, theta: 0.2, phi: 0.18, zoom: 0.62, focus: [0, s.crownL, 0], labels: ['Oblique ridge', 'Mesiopalatal cusp', 'Distobuccal cusp'], caption: 'On the crown, the oblique ridge runs from the mesiopalatal to the distobuccal cusp.' },
  { fov: 30, dur: 2.4, hold: 2.6, theta: 0.85, phi: 0.82, zoom: 1, focus: 'auto', drift: 0, labels: [...ROOTS, 'Oblique ridge'], caption: '' }
]);
fig.start();
