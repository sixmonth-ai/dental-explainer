// Rubber dam isolation of the mandibular left first molar (FDI 36 = Universal 19) with 35 and 37 in the gum; story. Frame: +x mesial (35 on +x, 37 on -x), +z buccal, CEJ of 36 at y = 0, mm.
// poster: end
// A steel molar clamp (hand-built: two jaws with forceps holes and four prongs that grip just above the gum, below the crown's
// widest point, joined by a bow over the distal contact) seats on 36; then the sheet comes down, its hole is stretched over the
// clamp and released, and it settles under the jaws onto the neck of the tooth. The sheet is a stretched membrane: a height field
// raycast over the neighbours' crowns and the gum, relaxed so it tents over them, held under the clamp and tucked in at the gum line.
const T = THREE, FDI = 36;
const fig = DK.figure({
  fov: 32,
  title: 'Rubber dam isolation',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19).',
  view: { theta: 0.55, phi: 1.02, margin: 1.05 }
});

// --- teeth and gum
const s35 = DK.toothPreset(35), s36 = DK.toothPreset(36), s37 = DK.toothPreset(37);
const X35 = s36.md / 2 + s35.md / 2, X37 = -(s36.md / 2 + s37.md / 2);
const t35 = DK.tooth(s35), t36 = DK.tooth(s36), t37 = DK.tooth(s37);
t35.group.position.x = X35; t37.group.position.x = X37;
const GUM_Y = 1.1, CREST = -1.8;
const bone = DK.bone({ width: 40, height: 16, depth: 11.5, cortical: 1.2, crest: 1.6 }); bone.position.set(-1, CREST, 0);
const gum = DK.gingiva({ width: 40, height: 3.4, depth: 12.4, crest: 1.4, around: [
  { x: X35 + 1, z: 0, md: s35.mdC, bl: s35.blC, rise: 0.8 }, { x: 1, z: 0, md: s36.mdC, bl: s36.blC, rise: 0.8 }, { x: X37 + 1, z: 0, md: s37.mdC, bl: s37.blC, rise: 0.8 }] });
gum.position.set(-1, GUM_Y, 0);
[bone, gum, t35.group, t36.group, t37.group].forEach(o => o.updateMatrixWorld(true));

// --- probes (all at build time, in the world frame = the 36 frame)
const rc = new T.Raycaster();
const hit = (o, d, objs) => { rc.set(new T.Vector3(...o), new T.Vector3(...d).normalize()); const h = rc.intersectObjects(objs, true); return h.length ? h[0].point : null; };
const crown36 = [t36.layers.enamel, t36.layers.dentin];
// distance from the 36 axis to its surface at height y, direction th (0 = mesial, pi/2 = buccal)
const radius36 = (y, th) => { const c = Math.cos(th), sn = Math.sin(th), p = hit([c * 16, y, sn * 16], [-c, 0, -sn], crown36); return p ? Math.hypot(p.x, p.z) : 4.5; };
const gumTop = (x, z) => { const p = hit([x, 30, z], [0, -1, 0], [gum]); return p ? p.y : GUM_Y; };

// --- the clamp (steel, built seated; the `clamp` param lifts it)
const steel = DK.mat('steel', { roughness: 0.38 });
const clamp = new T.Group();
const Y_J = 2.35;                                    // jaw level: just above the gum margin, under the crown's widest point
function jaw(th0, th1) {
  const n = 40, inner = [], outer = [], shape = new T.Shape(), th = u => th0 + (th1 - th0) * u;
  for (let i = 0; i <= n; i++) { const u = i / n, a = th(u), prong = Math.min(1, Math.min(u, 1 - u) / 0.12), gap = 0.06 + 0.5 * prong;
    const r = radius36(Y_J - 0.1, a) + gap, w = 0.7 + 1.15 * Math.sin(Math.PI * u);
    inner.push([r * Math.cos(a), -r * Math.sin(a)]); outer.push([(r + w) * Math.cos(a), -(r + w) * Math.sin(a)]); }
  inner.forEach((p, i) => i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1]));
  for (let i = n; i >= 0; i--) shape.lineTo(outer[i][0], outer[i][1]);
  shape.closePath();
  const am = th(0.5), rm = radius36(Y_J - 0.1, am) + 0.56 + 0.93, hole = new T.Path(); hole.absarc(rm * Math.cos(am), -rm * Math.sin(am), 0.45, 0, Math.PI * 2, true); shape.holes.push(hole);
  const g = new T.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 3, curveSegments: 24 });
  g.rotateX(-Math.PI / 2);                            // shape (x, -z) → world xz, extruded up +y
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); p.setY(i, p.getY(i) + Y_J); }
  g.computeVertexNormals();
  const m = new T.Mesh(g, steel); m.castShadow = true; clamp.add(m);
  // four prongs: short points at the jaw ends that touch the tooth just above the gum
  [0.06, 0.94].forEach(u => { const a = th(u), r = radius36(Y_J - 0.45, a);
    const pr = DK.lathe([[0.02, -0.75], [0.2, -0.35], [0.34, 0.05], [0.3, 0.3]], 16, steel);
    pr.position.set((r + 0.22) * Math.cos(a), Y_J, (r + 0.22) * Math.sin(a)); pr.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); clamp.add(pr); });
  return { mid: [rm * Math.cos(am), Y_J + 0.75, rm * Math.sin(am)] };
}
const JB = [0.62, Math.PI - 0.66], JL = [Math.PI + 0.66, 2 * Math.PI - 0.62];
const jawB = jaw(JB[0], JB[1]), jawL = jaw(JL[0], JL[1]);
// the bow: a flat steel strip from the distal ends of both jaws, up through the embrasures and over the 36/37 contact
const end = a => { const r = radius36(Y_J, a) + 0.9; return [r * Math.cos(a), Y_J + 0.35, r * Math.sin(a)]; };
const eB = end(JB[1] - 0.04), eL = end(JL[0] + 0.04), XB = -s36.md / 2 - 0.55;
const bowPts = [eB, [XB + 0.2, Y_J + 1.0, 5.7], [XB, 5.2, 6.0], [XB, 8.0, 4.4], [XB, 8.9, 0], [XB, 8.0, -4.4], [XB, 5.2, -6.0], [XB + 0.2, Y_J + 1.0, -5.7], eL].map(p => new T.Vector3(...p));
const bowCurve = new T.CatmullRomCurve3(bowPts, false, 'centripetal');
const bow = new T.Mesh(DK.sweepGeometry(bowCurve, DK.roundedRect(0.85, 0.42, 0.3), { segments: 140, radial: 28, up: [1, 0, 0] }), steel); bow.castShadow = true; clamp.add(bow);
clamp.updateMatrixWorld(true);
const BOW_TOP = [XB, 8.9 + 0.45, 0];

// --- the rubber dam: a polar grid from the 36 neck outward
const NT = 128, NR = 60, DMAX = 90;
const thAt = j => j / NT * Math.PI * 2;
const rim = [], dirs = [];
for (let j = 0; j < NT; j++) { const a = thAt(j), c = Math.cos(a), sn = Math.sin(a);
  const r0 = radius36(1.6, a), yr = gumTop((r0 + 0.35) * c, (r0 + 0.35) * sn) - 0.2, r = radius36(yr, a) + 0.06;
  rim.push([r * c, yr, r * sn]); dirs.push([c, sn]); }
const dist = i => DMAX * Math.pow(i / (NR - 1), 1.9);
const ptXZ = (i, j, scale) => [rim[j][0] * scale + dirs[j][0] * dist(i), rim[j][2] * scale + dirs[j][1] * dist(i)];
const obstacles = [t35.layers.enamel, t37.layers.enamel];
const BASE = 1.7;                                    // the sheet lies on the gum at about this height
const inGum = o => { for (; o; o = o.parent) if (o === gum) return true; return false; };
const raw = [], ceil = [], H = [];
for (let i = 0; i < NR; i++) { raw.push([]); ceil.push([]); H.push([]);
  for (let j = 0; j < NT; j++) { const [x, z] = ptXZ(i, j, 1), d = hit([x, 40, z], [0, -1, 0], obstacles), u = hit([x, -30, z], [0, 1, 0], [clamp]);
    raw[i][j] = d ? Math.max(BASE, d.y + 0.3) : BASE; ceil[i][j] = u ? u.y - 0.22 : 1e9; H[i][j] = i === 0 ? rim[j][1] : raw[i][j]; } }
const OUT = BASE;                                     // far from the teeth the sheet lies loose at about gum level
for (let j = 0; j < NT; j++) H[NR - 1][j] = OUT;
for (let it = 0; it < 120; it++) for (let i = 1; i < NR - 1; i++) for (let j = 0; j < NT; j++) {
  const a = (H[i - 1][j] + H[i + 1][j] + H[i][(j + 1) % NT] + H[i][(j + NT - 1) % NT]) / 4;
  H[i][j] = Math.min(ceil[i][j], Math.max(raw[i][j], a)); }
// geometry: double-sided sheet; vertex positions morph between the stretched flat sheet (k = 0) and the draped one (k = 1)
const pos = new Float32Array(NR * NT * 3), idx = [];
for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NT; j++) { const a = i * NT + j, b = i * NT + (j + 1) % NT, c = (i + 1) * NT + j, d = (i + 1) * NT + (j + 1) % NT; idx.push(a, c, b, b, c, d); }
const sheetGeo = new T.BufferGeometry(); sheetGeo.setAttribute('position', new T.BufferAttribute(pos, 3)); sheetGeo.setIndex(idx);
const damMat = new T.MeshStandardMaterial({ color: DK.color(fig.dark ? 0x434b4d : DK.COLORS.rubberDam), roughness: 0.62, metalness: 0, side: T.DoubleSide });
const sheet = new T.Mesh(sheetGeo, damMat); sheet.userData.noShadow = true;   // receives the clamp's shadow but casts none (no self-shadow banding)
const rimTube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rim.map(p => new T.Vector3(...p)), true), 160, 0.13, 8, true), damMat);
rimTube.userData.noShadow = true;
const dam = new T.Group(); dam.add(sheet, rimTube);
const U = DK.util;
function setDam(k) {
  dam.visible = k > 0.01; rimTube.visible = k > 0.97;
  const ky = U.smooth(0, 0.6, k), kx = U.smooth(0.42, 1, k);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) {
    const [xa, za] = ptXZ(i, j, 2.05), [xb, zb] = ptXZ(i, j, 1), n = (i * NT + j) * 3;
    pos[n] = xa + (xb - xa) * kx; pos[n + 2] = za + (zb - za) * kx;
    pos[n + 1] = 13 + (H[i][j] - 13) * ky; }
  sheetGeo.attributes.position.needsUpdate = true; sheetGeo.computeVertexNormals(); sheetGeo.computeBoundingSphere();
}
const vtx = (i, j) => { const n = (i * NT + j) * 3; return [pos[n], pos[n + 1], pos[n + 2]]; };
const jMesialBuccal = Math.round(NT * 0.05), jBuccal = Math.round(NT * 0.25);
fig.world.add(dam, clamp);

// --- parts
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the teeth.' });
fig.part(t35.group, { name: '35', label: false, fit: false, info: 'Lower left second premolar, covered by the dam.' });
fig.part(t37.group, { name: '37', label: false, fit: false, info: 'Lower left second molar, covered by the dam.' });
fig.part(t36.group, { name: 'Tooth 36', sub: 'dry, isolated', anchor: [1.6, 6.6, 3.2], info: 'Lower left first molar (Universal 19). Only this crown is exposed: the field stays dry and free of saliva and its bacteria.', when: () => damK > 0.9 });
fig.part(clamp, { inPlace: true, name: 'Clamp', anchor: BOW_TOP, info: 'A steel clamp: four prongs grip the tooth just above the gum, under its widest point, and the bow crosses behind it. It anchors the sheet.' });
fig.part(sheet, { inPlace: true, name: 'Rubber dam', anchor: () => vtx(19, Math.round(NT * 0.12)), accent: true, dim: false, when: () => damK > 0.9, info: 'A thin latex or latex-free sheet over the mouth: saliva stays out of the tooth, and files, irrigant and debris cannot reach the throat. Standard of care in root canal treatment.' });
fig.part(rimTube, { inPlace: true, name: 'Sealed at the gum line', anchor: () => vtx(0, jMesialBuccal), dim: false, when: () => damK > 0.9, info: 'The edge of the hole is tucked under the clamp jaws and turned into the gum crevice, so fluid cannot creep past the neck of the tooth.' });

// --- params
let damK = 0;
const CLAMP_UP = 14;
fig.param('clamp', CLAMP_UP, d => { clamp.position.y = d; clamp.visible = d < CLAMP_UP - 0.05; });
fig.param('dam', 0, k => { damK = k; setDam(k); bone.visible = gum.visible = k < 0.75; });   // the sheet covers gum and bone once it is down

fig.standardControls({ explode: false });
fig.view('Bare tooth', { set: { dam: 0, clamp: CLAMP_UP }, theta: 0.55, phi: 1.02, zoom: 1, focus: 'auto', labels: [] }, 1.4);
fig.view('Isolated', { set: { clamp: 0, dam: 1 }, theta: 0.32, phi: 0.86, zoom: 0.82, focus: [-0.8, 3.2, 0], labels: ['Rubber dam', 'Clamp', 'Tooth 36'] }, 1.6);

// --- story
fig.story([
  { dur: 0, hold: 1.4, theta: 0.75, phi: 1.12, zoom: 1.05, fov: 34, labels: [] },
  { dur: 2.4, hold: 0.9, theta: 0.42, phi: 1.08, zoom: 0.82, focus: [-0.6, 4.5, 0], fov: 30, set: { clamp: 0 }, labels: ['Clamp'] },
  { dur: 2.8, hold: 0.8, theta: 0.62, phi: 0.92, zoom: 1.08, focus: 'auto', set: { dam: 1 }, labels: ['Rubber dam'] },
  { dur: 2.2, hold: 2.2, theta: 0.75, phi: 0.95, zoom: 0.64, focus: [3.6, 3.4, 1.4], labels: ['Sealed at the gum line'] },
  { dur: 2.4, hold: 2.6, theta: 0.32, phi: 0.86, zoom: 0.82, focus: [-0.8, 3.2, 0], fov: 32, labels: ['Rubber dam', 'Clamp', 'Tooth 36'] }
]);
fig.start();
