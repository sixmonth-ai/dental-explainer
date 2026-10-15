// Posterior crossbite: a coronal slice (like a CBCT slice) through both upper and lower first molars and the jaws around them; the upper jaw narrows until the upper molars close inside the lower ones. Frame: the DK.arch mandibular frame (+x = patient's left, +z anterior, y up, lower CEJs at y = 0).
// poster: end
const fig = DK.figure({
  fov: 28,
  title: 'Crossbite',
  subtitle: "Slice through the first molars (FDI 16, 26 over 46, 36), from the front: patient's right on the left.",
  view: { theta: 0.62, phi: 1.28, margin: 0.8 }
});

// --- the four first molars, placed exactly as in the arches (upper in occlusion as in DK.mandible's upper teeth)
const scene = new THREE.Group();
const low = DK.arch({ jaw: 'mandible', teeth: [46, 36] }); scene.add(low.group);
const upHold = new THREE.Group(); scene.add(upHold);
const up = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 26] }); upHold.add(up.group);
upHold.position.set(0, DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, 2.6); upHold.rotation.x = -0.05;
scene.updateMatrixWorld(true);
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
const t16 = T(up, 16), t46 = T(low, 46);
const cejU = t16.tooth.group.getWorldPosition(new THREE.Vector3()), cejL = t46.tooth.group.getWorldPosition(new THREE.Vector3());
const xU = Math.abs(cejU.x), xL = Math.abs(cejL.x), yU = cejU.y, zMol = (cejU.z + cejL.z) / 2;
const bU = t16.spec.bl / 2, bL = t46.spec.bl / 2, CREST = 1.8;   // crest ~1.8 mm from the CEJ (facts §13)

// --- jaw outlines in this coronal plane (right half, x < 0; mirrored for the left). Schematic shapes sized from the teeth:
// lower: the mandibular body under the molar, crest to lower border ~27 mm; upper: the alveolar process around the molar roots,
// the bony palate (vault about 12 mm above the upper CEJs, about 3 mm thick) and the nasal floor; cut flat above (no sinus).
const lowerHalf = () => {
  const b = -xL - bL - 0.9, l = -xL + bL + 0.9, y0 = -CREST;
  return [[l, y0], [l - 0.2, y0 - 6], [l + 0.4, y0 - 12], [l + 0.3, y0 - 19], [l - 1.6, y0 - 24.5], [(l + b) / 2 + 0.5, y0 - 26.5], [b + 2.0, y0 - 25.4], [b - 0.6, y0 - 20], [b - 1.4, y0 - 12], [b - 0.8, y0 - 5], [b, y0]];
};
// the upper outline from the midline of the vault round the right half and back to the midline on the nasal floor; d = how far the half moves in
const upperHalf = d => {
  const p = -xU + bU + 0.9 + d, bc = -xU - bU - 0.9 + d, y0 = yU + CREST, vault = yU + 12, top = yU + 15.5;
  const pal = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pal.push([p * u, vault - (vault - y0) * Math.pow(u, 2.2)]); }   // vault: midline → palatal crest
  return [...pal, [bc, y0], [bc - 1.4, y0 + 6], [bc - 1.6, top], [p - 1.0, top], [p * 0.55, vault + 2.6], [0, vault + 2.4]];
};
const mirror = pts => pts.map(([x, y]) => [-x, y]).reverse();
function inset(pts, d) {   // offset a closed polygon inward by d (vertex normals; the outlines are smooth enough)
  const n = pts.length, area = pts.reduce((a, p, i) => { const q = pts[(i + 1) % n]; return a + p[0] * q[1] - q[0] * p[1]; }, 0), s = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n], tx = c[0] - a[0], ty = c[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [p[0] - s * ty / l * d, p[1] + s * tx / l * d];
  });
}
const DEPTH = 13, Z0 = zMol - DEPTH / 2;
function slab(pts, mat, depth) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: depth ?? DEPTH, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, Z0 - (depth ?? DEPTH) / 2 + DEPTH / 2); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const ref = DK.bone({}), cortMat = ref.userData.layers.cortical.material, cancMat = ref.userData.layers.cancellous.material;
const capTex = ref.userData.layers.cancellous.userData.capTexture;
const jawLow = new THREE.Group(); scene.add(jawLow); jawLow.add(low.group);
const mandR = slab(lowerHalf(), cortMat), mandL = slab(mirror(lowerHalf()), cortMat);
const mandRi = slab(inset(lowerHalf(), 1.3), cancMat, DEPTH - 2), mandLi = slab(inset(mirror(lowerHalf()), 1.3), cancMat, DEPTH - 2);
jawLow.add(mandR, mandL, mandRi, mandLi);
const upper = { outer: slab(upperHalf(0).concat(mirror(upperHalf(0))), cortMat), inner: slab(inset(upperHalf(0).concat(mirror(upperHalf(0))), 1.3), cancMat, DEPTH - 2) };
scene.add(upper.outer, upper.inner);
// gum: a soft band over each crest, from just above the CEJ down the bone ~4 mm (both sides of the tooth)
const gumMat = DK.mat('gingiva');
const gumBand = (x, yc, dir, half) => {   // dir +1: crowns up (lower), -1: crowns down (upper); band around one tooth neck
  const yt = yc + dir * 0.7, yb = yc - dir * (CREST + 2.6);
  return [[x - half - 2.0, yb], [x - half - 1.3, yc - dir * CREST * 0.5], [x - half + 0.3, yt], [x + half - 0.3, yt], [x + half + 1.3, yc - dir * CREST * 0.5], [x + half + 2.0, yb]];
};
const orient = pts => { const n = pts.length; const a = pts.reduce((s, p, i) => { const q = pts[(i + 1) % n]; return s + p[0] * q[1] - q[0] * p[1]; }, 0); return a < 0 ? pts.slice().reverse() : pts; };
const gumsLow = [-1, 1].map(s => slab(orient(gumBand(s * xL, 0, 1, bL)), gumMat, DEPTH - 0.4));
const gumsUp = [-1, 1].map(s => slab(orient(gumBand(s * xU, yU, -1, bU)), gumMat, DEPTH - 0.4));
gumsLow.forEach(g => jawLow.add(g)); gumsUp.forEach(g => scene.add(g));

fig.part(scene, { name: 'Slice', label: false, info: 'A slice through both jaws at the first molars, like one image of a CBCT scan.' });
fig.part(upper.outer, { inPlace: true, name: 'Upper jaw', sub: 'narrow', anchor: [0, yU + 13.2, zMol + DEPTH / 2 + 0.6], labelOffset: [0, -60], dim: false, when: () => narrow > 0.6,
  info: 'The upper jaw (maxilla) with the roof of the mouth. A narrow upper jaw is the usual cause of a back-teeth crossbite, often with mouth breathing or a long thumb habit. In children it can be widened with a palatal expander.' });
fig.part(upper.outer, { inPlace: true, name: 'Upper jaw ', anchor: [0, yU + 13.2, zMol + DEPTH / 2 + 0.6], labelOffset: [0, -60], dim: false, when: () => narrow < 0.4,
  info: 'The upper jaw (maxilla) with the roof of the mouth (palate).' });
fig.part(mandR, { inPlace: true, name: 'Lower jaw', label: false, info: 'The lower jaw (mandible) under the first molar.' });
fig.part(mandL, { inPlace: true, name: 'Lower jaw', label: false, info: 'The lower jaw (mandible) under the first molar.' });
[...up.teeth, ...low.teeth].forEach(t => fig.part(t.tooth.group, { inPlace: true, name: 'FDI ' + t.fdi, label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// --- narrowing: each upper half moves toward the midline by NARROW; the palate between them narrows (and its vault looks higher).
// Normal: the upper molar's cheek-side cusps close outside the lower molar. NARROW puts the upper buccal cusp (~0.25 × BL buccal of
// the molar's centre) over the lower central fossa: a full crossbite.
const NARROW = (xU - xL) + 0.25 * t16.spec.bl;
const OPEN = 3.0;   // mm the lower jaw drops while the cusps pass each other
const upTeeth = up.teeth.map(t => ({ g: t.tooth.group, x: t.tooth.group.position.x }));
const gumU0 = gumsUp.map(g => g.position.x);
let narrow = 0;
function rebuildUpper(d) {
  const o = upperHalf(d).concat(mirror(upperHalf(d)));
  [[upper.outer, o, DEPTH], [upper.inner, inset(o, 1.3), DEPTH - 2]].forEach(([m, pts, dep]) => {
    const n = slab(pts, cortMat, dep).geometry, a = m.geometry.attributes;   // same vertex count: copy in place (the cut caps share this geometry)
    a.position.array.set(n.attributes.position.array); a.normal.array.set(n.attributes.normal.array);
    a.position.needsUpdate = a.normal.needsUpdate = true; m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox(); n.dispose();
  });
}
fig.param('narrow', 0, v => {
  narrow = v; const d = NARROW * v;
  upTeeth.forEach(b => { b.g.position.x = b.x - Math.sign(b.x) * d; });   // holder-frame x = world x (mirroring is in y only)
  gumsUp.forEach((g, i) => { g.position.x = gumU0[i] + (i ? -d : d); });
  rebuildUpper(d);
  jawLow.position.y = -OPEN * Math.sin(Math.PI * DK.util.clamp(v, 0, 1));
});

// --- labels for the right-side pair (viewer's left)
fig.part(t16.tooth.group, { inPlace: true, name: 'Upper molar', sub: 'closes inside the lower', accent: true, anchor: [0, t16.spec.crownL * 0.5, 0], labelOffset: [-90, -50], dim: false, when: () => narrow > 0.6,
  info: 'Upper right first molar, FDI 16 (Universal 3). In a crossbite its cheek-side cusps close inside the lower molar instead of outside it.' });
fig.part(t16.tooth.group, { inPlace: true, name: 'Upper molar ', sub: 'closes outside the lower', anchor: [0, t16.spec.crownL * 0.5, 0], labelOffset: [-90, -50], dim: false, when: () => narrow < 0.4,
  info: 'Upper right first molar, FDI 16 (Universal 3). Normally its cheek-side cusps close just outside the lower molar.' });
fig.part(t46.tooth.group, { inPlace: true, name: 'Lower molar', anchor: [0, t46.spec.crownL * 0.5, 0], labelOffset: [-90, 50], dim: false,
  info: 'Lower right first molar, FDI 46 (Universal 30).' });

// --- the cut: the front of the slice, so the layers show
const L = k => [...up.teeth, ...low.teeth].map(t => t.tooth.layers[k]).filter(Boolean);
fig.enableSection([0, 0, 1], [
  { objects: [...gumsUp, ...gumsLow], color: DK.COLORS.gingivaCap },
  { objects: [upper.outer, mandR, mandL], color: DK.COLORS.corticalCap },
  { objects: [upper.inner, mandRi, mandLi], color: 0xffffff, texture: capTex },
  { objects: L('enamel'), color: DK.COLORS.enamelCap },
  { objects: L('dentin').concat(L('root')), color: DK.COLORS.dentinCap },
  { objects: L('pulp'), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [zMol - 4, zMol + 8], offset: zMol + 2.2 } });
const FRONT = { theta: 0, phi: 1.57, zoom: 1, focus: 'auto', section: true, offset: zMol + 2.2 };
fig.view('Normal bite', Object.assign({ set: { narrow: 0 }, labels: ['Upper jaw ', 'Upper molar ', 'Lower molar'] }, FRONT), 1.6);
fig.view('Crossbite', Object.assign({ set: { narrow: 1 }, labels: ['Upper jaw', 'Upper molar', 'Lower molar'] }, FRONT), 1.6);

const yMid = yU / 2, R = [-(xU + xL) / 2, yMid, zMol];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.62, phi: 1.28, zoom: 1, section: false, labels: [], caption: 'A slice through both jaws at the first molars.' },
  { dur: 2.2, hold: 0.1, theta: 0, phi: 1.57, labels: [] },
  { dur: 0, hold: 0, section: true, offset: zMol + DEPTH },
  { dur: 2.0, hold: 1.8, offset: zMol + 2.2, labels: ['Upper jaw ', 'Upper molar ', 'Lower molar'], caption: 'Normally the upper back teeth close just outside the lower ones.' },
  { dur: 3.2, hold: 1.6, set: { narrow: 1 }, labels: ['Upper jaw'], caption: 'When the upper jaw is narrow, its back teeth close inside the lower ones.' },
  { dur: 2.2, hold: 2.2, zoom: 0.5, focus: R, labels: ['Upper molar', 'Lower molar'], caption: 'The upper molar now bites inside the lower molar.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', labels: ['Upper jaw', 'Upper molar', 'Lower molar'] }
]);
fig.start();
