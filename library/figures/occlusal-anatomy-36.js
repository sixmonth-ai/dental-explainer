// Library: mandibular left first molar (FDI 36 = Universal 19), crown up, ending on the occlusal (chewing) surface seen from above with the buccal side up. Tooth frame: CEJ at y = 0, +x mesial, +z buccal.
// poster: end
// Teaching point: five cusps (three buccal, two lingual) around a central fossa, joined by grooves and pits; the grooves are where decay starts.
const fig = DK.figure({
  fov: 30,
  title: 'Cusps and grooves of a molar',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19). Buccal side up.',
  view: { theta: 0.7, phi: 1.2 }
});

const tooth = DK.tooth(36);
const s = tooth.spec, L = tooth.layers;
tooth.group.updateMatrixWorld(true);

// the occlusal surface as a height field, by casting rays straight down onto the enamel
const enamelMeshes = []; L.enamel.traverse(o => { if (o.isMesh) enamelMeshes.push(o); });
const ray = new THREE.Raycaster();
const surfY = (x, z) => { ray.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(enamelMeshes, false)[0]; return h ? h.point.y : s.crownL; };
const at = (xn, zn, lift = 0) => { const x = xn * s.md / 2, z = zn * s.bl / 2; return [x, surfY(x, z) + lift, z]; };

fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar (Universal 19): the first permanent tooth to erupt, at about 6 years, behind the baby teeth.' });

// --- grooves: the preset's own groove lines (normalised crown coordinates), draped on the enamel as accent ribbons that draw in
const GROOVES = [
  { name: 'central', pts: [[0.72, 0.0], [0.22, 0.01], [0.05, 0.0], [-0.38, 0.02], [-0.72, 0.02]] },
  { name: 'mesiobuccal', pts: [[0.22, 0.01], [0.23, 0.45], [0.25, 0.9]] },
  { name: 'distobuccal', pts: [[-0.38, 0.02], [-0.39, 0.45], [-0.4, 0.85]] },
  { name: 'lingual', pts: [[0.05, 0.0], [0.05, -0.48], [0.05, -0.9]] }
];
const grooveMat = new THREE.MeshBasicMaterial({ color: fig.accent.clone(), toneMapped: false, transparent: true });
const dense = pts => { const out = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 8; k++) { const t = k / 8; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); } out.push(pts[pts.length - 1]); return out; };
const grooves = GROOVES.map(g => {
  const path = dense(g.pts).map(([xn, zn]) => at(xn, zn, 0.1));
  const m = DK.tube(path, 0.075, grooveMat, { segments: 120, radial: 8 });
  m.userData.path = path; m.userData.k = 1;
  tooth.group.add(m); return m;
});
// draw a groove in: rebuild its tube along the first k of its path (cheap: a few hundred vertices)
const grow = (m, k) => {
  k = Math.round(DK.util.clamp(k, 0, 1) * 40) / 40; m.visible = k > 0.01;
  if (!m.visible || k === m.userData.k) return;
  const P = m.userData.path, n = Math.max(2, Math.round(1 + (P.length - 1) * k)), pts = P.slice(0, n);
  const old = m.geometry; m.geometry = DK.tube(pts, 0.075, grooveMat, { segments: Math.max(8, Math.round(120 * k)), radial: 8 }).geometry; old.dispose();
  m.userData.k = k;
};
// pits: small discs where the grooves meet (central, mesial and distal pits)
const pitMat = grooveMat;
const pits = [[0.05, 0.0], [0.72, 0.0], [-0.72, 0.02]].map(([xn, zn]) => {
  const p = at(xn, zn, 0.12), m = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 12), pitMat);
  m.scale.y = 0.45; m.position.set(...p); tooth.group.add(m); return m;
});

// --- cusp names as quiet text on the cusp tips (five leader labels would crowd the occlusal view)
const CUSPS = [['MB', 0.5, 0.45], ['DB', -0.05, 0.5], ['D', -0.62, 0.3], ['ML', 0.45, -0.45], ['DL', -0.38, -0.45]];
const ink = '#3A3832', halo = null;   // the letters always sit on white enamel, so dark ink in both themes
const cuspTags = CUSPS.map(([t, xn, zn]) => {
  const sp = DK.textSprite(t, { height: 0.85, color: ink, halo, weight: 500 });
  sp.position.set(...at(xn, zn, 1.3)); sp.material.transparent = true; sp.material.depthTest = false; sp.renderOrder = 10;
  tooth.group.add(sp); return sp;
});

// --- labels
const CF = at(0, 0, 0.1);
fig.part(grooves[0], { inPlace: true, name: 'Grooves and pits', sub: 'where decay starts', accent: true, dim: false, anchor: at(0.05, -0.62, 0.1), labelOffset: [-170, 70],
  info: 'Deep, narrow fissures trap plaque where toothbrush bristles cannot reach. Most decay in children starts here, which is why molars are often sealed.' });
fig.part(pits[0], { inPlace: true, name: 'Central fossa', dim: false, anchor: [0, 0, 0], labelOffset: [200, -90],
  info: 'The hollow in the middle of the crown, where the grooves meet in the central pit. The opposing upper cusp rests here when the teeth close.' });
fig.part(L.enamel, { inPlace: true, name: 'Buccal cusps', sub: 'three', anchor: at(-0.05, 0.62, 0.05), labelOffset: [0, -40], dim: false,
  info: 'Mesiobuccal, distobuccal and distal: the three cusps on the cheek side. They are the working cusps of the lower molar.' });
fig.part(L.enamel, { inPlace: true, name: 'Lingual cusps', sub: 'two, taller', anchor: at(0.05, -0.62, 0.05), labelOffset: [0, 40], dim: false,
  info: 'Mesiolingual and distolingual: the two cusps on the tongue side, the tallest and most pointed on this tooth.' });

// --- params
fig.param('tags', 0, k => cuspTags.forEach((sp, i) => { const a = DK.util.clamp(k * CUSPS.length - i, 0, 1); sp.visible = a > 0.01; sp.material.opacity = a; }));
fig.param('grooves', 0, k => { grooves.forEach((m, i) => grow(m, DK.util.clamp(i === 0 ? k * 2 : (k - 0.5) * 2, 0, 1))); pits.forEach(p => { p.visible = k > 0.4; }); });

fig.standardControls({ explode: false });
fig.view('Occlusal', { theta: Math.PI - 0.12, phi: 0.32, zoom: 0.62, focus: [0, s.crownL, 0], set: { tags: 1, grooves: 1 }, labels: ['Grooves and pits', 'Central fossa'] });
fig.view('Buccal', { theta: 0, phi: 1.45, zoom: 1, focus: 'auto', labels: ['Buccal cusps'] });

// story: the whole molar → tilt over the crown → the five cusps named one by one → the grooves draw in between them, meeting
// at the pits → hero: straight down on the chewing surface, buccal side up
const TOP = [0, s.crownL - 0.6, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.7, phi: 1.2, zoom: 1.05, set: { tags: 0, grooves: 0 }, labels: [], caption: 'A lower first molar.' },
  { fov: 30, dur: 2.2, hold: 1.6, theta: 0.15, phi: 1.45, zoom: 1.0, labels: ['Buccal cusps'], caption: 'From the cheek: three buccal cusps.' },
  { fov: 26, dur: 2.6, hold: 0.3, theta: Math.PI - 0.5, phi: 0.6, zoom: 0.68, focus: TOP, labels: ['Lingual cusps'], caption: 'Over the top: two taller lingual cusps.' },
  { dur: 2.2, hold: 1.2, theta: Math.PI - 0.2, phi: 0.3, set: { tags: 1 }, labels: [], caption: 'Five cusps.' },
  { dur: 2.6, hold: 1.8, phi: 0.18, ease: 'linear', set: { grooves: 1 }, labels: ['Grooves and pits'], caption: 'Grooves run between them and meet in pits.' },
  { dur: 2.0, hold: 2.8, theta: Math.PI - 0.12, phi: 0.32, zoom: 0.54, drift: 0, labels: ['Grooves and pits', 'Central fossa'], caption: '' }
]);
fig.onFrame(() => {});
fig.start();
