// Library: endodontic access outlines of four tooth types side by side, crown up, seen from where the access is cut: 11 tipped over
// poster: end
// so its palatal surface faces up (lingual access), 14, 16 and 36 from the occlusal, buccal toward the viewer. Each opening is DK.accessCavity
// (outline from DK.accessOutline, which joins that tooth's canal orifices) drawn as a dark recess with an accent rim; the X-ray state fades
// the crowns so the pulp chamber and the orifice dots show under each outline. Tooth frames: CEJ at y = 0, +x mesial, +z buccal; 36 is
// mirrored (a left tooth). Teaching point: each tooth type has its own access outline, set by where its canal orifices are.
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 12,
  title: 'Access cavity shapes',
  subtitle: 'FDI 11, 14, 16, 36 (Universal 8, 5, 3, 19), crown up, seen from the access side.',
  view: { theta: 0, phi: 0.12, margin: IMG ? 0.66 : 0.72 }
});
const { lerp } = DK.util;

const TEETH = [
  { fdi: 11, name: 'Upper central incisor', sub: 'triangle, base incisal', opts: {},
    info: 'Upper central incisor (FDI 11): one canal. The access is cut on the palatal surface, a triangle with its base toward the incisal edge so the pulp horns are removed.' },
  { fdi: 14, name: 'Upper first premolar', sub: 'oval, cheek to palate', opts: {},
    info: 'Upper first premolar (FDI 14): usually two canals, buccal and palatal, so the oval runs bucco-palatally between them.' },
  { fdi: 16, name: 'Upper first molar', sub: 'rhomboid, takes in MB2', opts: { mb2: true },
    info: 'Upper first molar (FDI 16): MB1, MB2, DB and P. MB2 is present in most of these teeth, so the classic triangle is extended to a rhomboid toward it, in the mesial two-thirds of the crown.' },
  { fdi: 36, name: 'Lower first molar', sub: 'trapezoid, wider mesially', opts: {},
    info: 'Lower first molar (FDI 36): two mesial canals (MB, ML) and one distal, so the outline is wider on the mesial side and reaches distally only as far as the distal canal.' }
];
const NARROW = !IMG && window.innerWidth < 640;   // phones: a 2 x 2 grid instead of a row
const GAP = 14.5, CAM = 180;   // CAM: about the hero camera's distance (mm) at fov 12
// DK.accessOutline orders a lower molar's trapezoid MB, ML, D+, D-, which crosses itself, and draws the incisor triangle base-cervical; sort the corners around their centre and
// round them the same way (Minkowski offset, as in the kit). Patched for this page only, around the DK.accessCavity calls below.
function rounded(corners, m, n) {
  const K = corners.length, out = [], total = corners.reduce((a, c, i) => { const d = corners[(i + 1) % K]; return a + Math.hypot(d[0] - c[0], d[1] - c[1]); }, 0) + 2 * Math.PI * m;
  for (let i = 0; i < K; i++) {
    const a = corners[i], b = corners[(i + 1) % K], p = corners[(i + K - 1) % K];
    const inAng = Math.atan2(a[1] - p[1], a[0] - p[0]) - Math.PI / 2, out0 = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
    let sw = out0 - inAng; while (sw < 0) sw += 2 * Math.PI; while (sw > 2 * Math.PI) sw -= 2 * Math.PI;
    const na = Math.max(2, Math.round(n * (sw * m) / total));
    for (let j = 0; j < na; j++) { const ang = inAng + sw * j / (na - 1); out.push([a[0] + m * Math.cos(ang), a[1] + m * Math.sin(ang)]); }
    const ne = Math.max(1, Math.round(n * Math.hypot(b[0] - a[0], b[1] - a[1]) / total)), nx = Math.cos(out0) * m, ny = Math.sin(out0) * m;
    for (let j = 1; j < ne; j++) { const t = j / ne; out.push([a[0] + (b[0] - a[0]) * t + nx, a[1] + (b[1] - a[1]) * t + ny]); }
  }
  return out;
}
const kitOutline = DK.accessOutline;
const fixedOutline = (spec, o) => {
  const r = kitOutline(spec, o);
  // the lingual frame's second axis (axis x mesial) points apically, so the kit's incisor triangle comes out base-cervical: flip it base-incisal
  if (r.plane === 'lingual') return Object.assign({}, r, { points: r.points.map(p => [p[0], -p[1]]).reverse() });
  if (r.shape !== 'trapezoid') return r;
  const cs = spec.canals, d = cs.findIndex(c => c.name === 'D'), at = k => { const p = DK.canalAt(spec, k, -0.5); return [p.x, p.z]; };
  const dw = 0.55 * (cs[d].rbk || cs[d].r), D = at(d);
  const pts = cs.map((c, k) => k).filter(k => k !== d).map(at).concat([[D[0], D[1] + dw], [D[0], D[1] - dw]]);
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  pts.sort((a, b) => Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx));
  return { plane: 'occlusal', points: rounded(pts, 0.85, (o && o.n) || 48), shape: 'trapezoid' };
};
const voidMat = DK.mat('pdl', { color: DK.voidColor(fig), roughness: 0.95 });
const rimMat = new THREE.MeshBasicMaterial({ color: fig.accent.clone(), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const dotMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd9a49a : 0x9a4f45), toneMapped: false, transparent: true, depthTest: false, depthWrite: false });
const row = new THREE.Group(), clear = [], sets = [];
TEETH.forEach((T, i) => {
  const tooth = DK.tooth(T.fdi), s = tooth.spec, L = tooth.layers;
  const holder = new THREE.Group(); holder.position.x = NARROW ? (i % 2 - 0.5) * GAP : (i - 1.5) * GAP; if (NARROW) holder.position.z = (Math.floor(i / 2) - 0.5) * 17; holder.add(tooth.group); row.add(holder);
  if (T.fdi === 36) tooth.group.scale.x = -1;   // a left tooth: mirror image of the preset
  if (T.fdi === 11) { holder.rotation.x = Math.PI / 2 * 0.86; holder.position.y = 3.2; holder.position.z += -5.5; }   // palatal surface up, crown toward the viewer
  // aim each other tooth's long axis at the hero camera (above, slightly in front): the orifice dots on the chamber floor then sit under
  // the opening on screen instead of drifting sideways by perspective
  else holder.rotation.set(0.12, 0, Math.atan(holder.position.x / CAM));
  // the opening: the access volume as a dark recess (its top follows the crown surface), and its outline as a ribbon
  DK.accessOutline = fixedOutline; const cav = DK.accessCavity(s, Object.assign({ lift: 0.03 }, T.opts)); DK.accessOutline = kitOutline; cav.material = voidMat; tooth.group.add(cav);
  const N = cav.outline.points.length, P = cav.geometry.attributes.position, ring = [];
  const out = cav.outline.plane === 'lingual' ? (() => { const o = new THREE.Vector3(0, s.crownL * 0.42, 0), t = new THREE.Vector3(0, s.crownL * 0.4, -s.bl / 2); return t.sub(o).normalize(); })() : new THREE.Vector3(0, 1, 0);
  for (let j = 0; j <= N; j++) { const v = new THREE.Vector3().fromBufferAttribute(P, 4 * N + (j % N)).addScaledVector(out, 0.06); ring.push([v.x, v.y, v.z]); }
  const rim = DK.ribbon(ring, 0.32, out.toArray(), { material: rimMat }); rim.renderOrder = 6; tooth.group.add(rim);
  // orifice dots on the chamber floor (posterior teeth), drawn through the crown
  const floorY = -(s.trunk ? 1.2 : 0.4) + 1.0, dots = [];
  if (cav.outline.plane === 'occlusal') (s.canals || []).forEach((c, k) => {
    const p = DK.canalAt(s, k, floorY), d = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), dotMat); d.rotation.x = -Math.PI / 2; d.position.set(p.x, floorY, p.z); d.renderOrder = 5; tooth.group.add(d); dots.push(d);
  });
  clear.push(L.enamel, L.dentin, L.root);
  sets.push({ T, tooth, holder, cav, rim, dots, s, out, top: new THREE.Vector3().fromBufferAttribute(P, 0) });
});

fig.part(row, { name: 'Four teeth', label: false, info: 'Access outlines by tooth type.' });
sets.forEach(st => {
  const lab = st.top.clone().addScaledVector(st.out, 0.2);
  fig.part(st.tooth.group, { inPlace: true, name: st.T.name, sub: st.T.sub, anchor: lab.toArray(), labelOffset: [0, st.T.fdi === 11 ? -95 : 95], dim: false, info: st.T.info });
});
// MB2 called out on 16: its orifice dot
const s16 = sets[2], mb2i = s16.s.canals.findIndex(c => c.name === 'MB2');
if (mb2i >= 0) fig.part(s16.dots[mb2i], { inPlace: true, name: 'MB2', accent: true, anchor: [0, 0, 0], labelOffset: [55, -70], dim: false,
  info: 'The second mesiobuccal canal: about 1.9 mm palatal to MB1, often under a dentin shelf. A triangular outline misses it.' });

// the outlines appear with one param; the X-ray state fades the crowns and shows the orifice dots
fig.param('open', 1, k => sets.forEach(st => { st.cav.visible = k > 0.02; st.cav.scale.setScalar(1); voidMat.transparent = k < 1; voidMat.opacity = k; rimMat.opacity = k; }));
const enamel0 = sets[1].tooth.layers.enamel;
fig.onFrame(() => { const op = enamel0.material.opacity, a = DK.util.clamp((1 - op) / 0.6, 0, 1); dotMat.opacity = a; sets.forEach(st => st.dots.forEach(d => { d.visible = a > 0.02; })); });

fig.xrayToggle(clear, 'X-ray', false);
fig.standardControls({ explode: false });

// story: four teeth from the side → up over them as the crowns turn see-through (chambers and orifice dots) → the outlines open
// over the dots → push in on the molars (rhomboid with MB2, trapezoid) → then incisor and premolar → hero: all four from above
const X = i => sets[i].holder.position.x;
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.35, phi: 1.2, zoom: 1.0, xray: 0, set: { open: 0 }, labels: [], caption: 'An incisor, a premolar, an upper and a lower molar.' },
  { fov: 12, dur: 2.4, hold: 1.4, theta: 0, phi: 0.12, xray: 1, labels: [], caption: 'Under each crown, the pulp chamber and its canal openings.' },
  { dur: 1.8, hold: 1.4, set: { open: 1 }, labels: [], caption: 'The access is shaped to reach every opening.' },
  { dur: 2.2, hold: 2.4, zoom: 0.55, focus: [(X(2) + X(3)) / 2, 5, 0], labels: ['Upper first molar', 'Lower first molar', 'MB2'], caption: 'Upper molar: a rhomboid that takes in MB2. Lower molar: wider mesially.' },
  { dur: 2.2, hold: 2.2, zoom: 0.55, focus: [(X(0) + X(1)) / 2, 5, 0], labels: ['Upper central incisor', 'Upper first premolar'], caption: 'Incisor: a palatal triangle. Premolar: an oval from cheek to palate.' },
  { dur: 2.2, hold: 2.6, zoom: 1.0, focus: 'auto', xray: 0.55, drift: 0, labels: ['Upper central incisor', 'Upper first premolar', 'Upper first molar', 'Lower first molar', 'MB2'], caption: '' }
]);
fig.start();
