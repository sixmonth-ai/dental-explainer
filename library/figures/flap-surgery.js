// Procedure: periodontal flap surgery (pocket reduction) on the lower right first molar (FDI 46 = Universal 30), bucco-lingual cut through the mesial root.
// poster: step 3
// The gum is cut along the teeth and lifted as a buccal and a lingual flap, the tartar is scraped off the roots under direct view, the flaps are
// stitched back lower on the tooth, and it heals with a shallow pocket and a little more root showing. The lost bone does not come back.
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0; the cut removes the mesial half, the camera on +x sees buccal on the left. mm.
const { lerp, smooth, clamp } = DK.util;
const CREST = -1.8;                                         // where the crest sat in health
const LOSS = 3.4;                                           // horizontal bone loss
const BONE = { width: 15, height: 17.5, depth: 12.5, cortical: 1.3, crest: 1.6, round: 2.6 };
const PRE = { margin: 1.4, base: -4.3 };                    // swollen margin over a deep pocket: PD 5.7 mm
const SEWN = -2.6;                                          // the flap margin, stitched back lower on the tooth
const POST = { margin: -1.9, base: -3.9 };                  // healed: PD 2 mm, about 2 mm more root showing
const YB = -11.5;                                           // the flaps reach down to here (fold of the cheek and of the floor of the mouth)

const fig = DK.figure({
  fov: 26,
  title: 'Pocket reduction surgery',
  subtitle: 'Gum flap surgery, lower right first molar, FDI 46 (Universal 30).',
  view: { theta: Math.PI / 2 - 0.5, phi: 1.3 }
});

// --- tooth, bone (horizontal loss), pocket, deposits
const tooth = DK.tooth(46), s = tooth.spec, L = tooth.layers;
const MR = s.roots.reduce((b, r, i) => (r.x > s.roots[b].x ? i : b), 0), root = s.roots[MR];
const CUT = root.x + root.apex[0] * 0.2;
const bone = DK.perioBone(Object.assign({}, BONE, { loss: { horizontal: LOSS }, level: 1 })); bone.position.y = CREST;
const HB = BONE.depth / 2;
const boneTop = (x, z) => {                                  // the bone surface (tooth frame): domed crest, then the slightly tapering wall
  const w = 0.9 * HB, c = BONE.crest, az = Math.min(Math.abs(z), w - 1e-3);
  return CREST + bone.crestAt(x, z) - c + c * Math.sqrt(1 - Math.pow(az / w, 2));
};
const CRESTY = boneTop(CUT, DK.toothSurfaceAt(s, -4, Math.PI / 2, MR).z + 0.3);   // the crest beside the root, at the cut
const pocket = DK.pocket(s, { margin: PRE.margin, base: PRE.base, width: 0.42 }); tooth.group.add(pocket);
const calc = DK.calculus(s, { kind: 'sub', from: -1.3, to: PRE.base + 0.4, sides: ['buccal', 'lingual'], n: 16, size: 0.42, seed: 6 }); tooth.group.add(calc);
calc.children.forEach(m => { m.userData.s0 = m.scale.clone(); });

// --- the two flaps (buccal +1, lingual -1): a gum sheet that hugs the tooth above the crest and the bone below it, swept along x.
// Lifting folds the part above YH outward, off the tooth and the crest. Its margin height can be changed (stitched lower).
const toothZ = (y, side) => {                                // the tooth's widest buccal (lingual) outline at height y
  const th = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  if (y >= -0.2) return Math.abs(DK.toothSurfaceAt(s, y, th).z);
  return Math.max(...s.roots.map((r, i) => Math.abs(DK.toothSurfaceAt(s, y, th, i).z)), Math.abs(DK.toothSurfaceAt(s, Math.max(y, -s.trunk), th).z));
};
const halfMD = y => Math.abs(DK.toothSurfaceAt(s, Math.max(y, -s.trunk + 0.2), 0).x) + 0.2;
const T = 1.25;                                              // flap thickness over the bone
function flapOutline(x, side, margin) {
  const hz = HB + 0.12, ell = y => Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(x) / halfMD(y), 3)));
  const inner = [];
  const yc = Math.min(CRESTY + 0.2, margin - 0.3);
  for (let i = 0; i <= 10; i++) { const y = lerp(margin, yc, i / 10); inner.push([toothZ(y, side) * ell(y) + 0.05, y]); }
  const z0 = inner[inner.length - 1][0];
  for (let i = 1; i <= 10; i++) { const z = lerp(z0, hz * 0.93, i / 10); inner.push([z, Math.min(yc - 0.02 * i, boneTop(x, side * z) + 0.12)]); }
  for (let i = 1; i <= 10; i++) { const y = lerp(boneTop(x, side * hz * 0.93) - 0.6, YB, i / 10); inner.push([hz * lerp(0.95, 1, i / 10), y]); }
  const top = toothZ(margin, side) + 0.35, outer = [];
  for (let i = 0; i <= 18; i++) { const u = i / 18, y = lerp(YB, margin - 0.5, u); outer.push([lerp(hz + T, top + 1.05, smooth(0.55, 1, u)) + 0.15 * Math.sin(Math.PI * u), y]); }
  outer.push([top + 0.75, margin - 0.1], [top + 0.25, margin + 0.08]);
  const P = inner.concat(outer).map(p => [side * p[0], p[1]]);
  return P;
}
const area = P => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function sweep(x0, x1, rows, outline) {                      // a closed solid: outline(x) in (z, y) swept along x, capped at both ends
  const pos = [], idx = [], first = outline(x0), n = first.length, flip = area(first) < 0;
  const ring = x => { const P = outline(x); return flip ? P.slice().reverse() : P; };
  for (let i = 0; i <= rows; i++) { const x = lerp(x0, x1, i / rows); ring(x).forEach(p => pos.push(x, p[1], p[0])); }
  for (let i = 0; i < rows; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = (i + 1) * n + j, c = (i + 1) * n + (j + 1) % n, d = i * n + (j + 1) % n; idx.push(a, b, d, b, c, d); }
  [[x0, -1], [x1, 1]].forEach(([x, sg]) => {
    const P = ring(x), base = pos.length / 3; P.forEach(p => pos.push(x, p[1], p[0]));
    THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []).forEach(([a, b, c]) => {
      const A = P[a], B = P[b], C = P[c], nx = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      nx * sg > 0 ? idx.push(base + a, base + b, base + c) : idx.push(base + a, base + c, base + b);
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const X0 = -BONE.width / 2, X1 = BONE.width / 2;
const gumMat = DK.mat('gingiva', { color: DK.COLORS.gingivaInflamed });
const YH = CRESTY - 3.2;                                     // the flap folds here (just past the bone it has to show)
const bend = (P, side, open) => {                            // fold the part above YH outward about the outer surface at YH
  if (open < 1e-3) return P;
  const zh = side * (HB + T + 0.1);
  return P.map(([z, y]) => { const a = side * open * smooth(YH - 1.2, YH + 3.4, y), dz = z - zh, dy = y - YH, c = Math.cos(a), sn = Math.sin(a);
    return [zh + dz * c + dy * sn, YH + dy * c - dz * sn]; });
};
const flaps = [1, -1].map(side => {
  const mesh = new THREE.Mesh(sweep(X0, X1, 48, x => flapOutline(x, side, PRE.margin)), gumMat); fig.world.add(mesh);
  return { side, mesh };
});
const setFlaps = (open, margin) => flaps.forEach(f => {
  if (f.margin === margin && f.open === open) return; f.margin = margin; f.open = open;
  const g = sweep(X0, X1, 48, x => bend(flapOutline(x, f.side, margin), f.side, open)), p = f.mesh.geometry.attributes.position;
  p.array.set(g.attributes.position.array); p.needsUpdate = true; f.mesh.geometry.computeVertexNormals(); f.mesh.geometry.computeBoundingSphere(); g.dispose();
});

// --- curette (Gracey style: curved blade with a rounded toe, bent shank, handle), as in the deep-cleaning figure
function curette() {
  const grp = new THREE.Group(), steel = DK.mat('steel', { cap: 0x9ea4aa });
  const blade = DK.tube([[0, 0, 0], [-0.35, 0.9, 0], [-0.45, 2.0, 0], [-0.3, 3.0, 0], [0, 3.8, 0]], 0.42, steel, { taper: t => 0.75 + 0.25 * Math.min(1, t * 3), caps: true });
  blade.scale.z = 0.5; grp.add(blade);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10), steel); toe.scale.z = 0.5; grp.add(toe);
  grp.add(DK.tube([[0, 3.8, 0], [0.25, 6, 0], [0.2, 10, 0], [-2.2, 15, 0], [-2.6, 18, 0]], 0.36, steel, { taper: t => 1 + 0.5 * t, caps: true }));
  const handle = DK.lathe([[0, 0], [0.9, 0], [1.6, 2.5], [2.6, 6], [2.9, 10], [2.9, 38], [2.4, 41], [0, 41]], 32, DK.mat('steel', { color: 0xb9bcbf, roughness: 0.45, metalness: 0.7, bump: 'streaks', bumpScale: 0.02 }));
  handle.position.set(-2.6, 18, 0); grp.add(handle);
  return grp;
}
const cur = curette(); cur.rotation.y = Math.PI / 2;            // its bends now run in z: the blade curves toward the root, the handle away
const cPivot = new THREE.Group(); cPivot.add(cur); fig.world.add(cPivot);

// --- parts
const frame = new THREE.Mesh(new THREE.BoxGeometry(8, s.crownL + BONE.height - CREST + 0.5, BONE.depth + 2 * T + 1.5), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.set(CUT, (s.crownL + CREST - BONE.height) / 2, 0); fig.part(frame, { name: 'frame', label: false });
fig.part(tooth.group, { name: 'Tooth 46', label: false, fit: false, info: 'Lower right first molar: two roots, mesial and distal.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Bone already lost to gum disease. Surgery stops the loss and makes the area cleanable; it does not grow this bone back.' });
const zc = sec => (sec.enabled ? sec.offset : CUT) + 0.1, cutOn = (e, sec) => sec.enabled;
const P = { open: 0, margin: PRE.margin, base: PRE.base, cur: 30, curY: -2, calc: 1, inflamed: 1, sew: 0 };
const pocketPart = fig.part(pocket, { inPlace: true, name: 'Pocket', sub: 'about 6 mm', anchor: (e, sec) => [zc(sec), (P.margin + P.base) / 2, toothZ((P.margin + P.base) / 2, 1) + 0.25], labelOffset: [-120, -60], when: (e, sec) => sec.enabled && P.open < 0.05, dim: false, info: 'A deep gum pocket that a deep cleaning alone could not shrink. Probing depth is measured from the gum edge.' });
fig.part(calc, { inPlace: true, name: 'Tartar', sub: 'on the roots', anchor: (e, sec) => { const y = -2.6; return [zc(sec), y, toothZ(y, 1) + 0.35]; }, labelOffset: [-130, 40], when: (e, sec) => sec.enabled && P.calc > 0.3, dim: false, info: 'Hard deposit on the root surface under the gum. With the gum lifted it can be seen and removed completely.' });
fig.part(flaps[0].mesh, { inPlace: true, name: 'Gum flap', sub: 'lifted off the bone', anchor: (e, sec) => [zc(sec), YH + 2.5, HB + T + 2.6], labelOffset: [-110, -50], when: () => P.open > 0.3, dim: false, info: 'The gum is cut along the necks of the teeth and lifted off the bone in one piece, so the roots and bone can be seen.' });
fig.part(flaps[1].mesh, { inPlace: true, name: 'Stitched lower', sub: 'gum edge moved down', anchor: [CUT + 0.1, SEWN - 1.2, -(toothZ(SEWN, -1) + 0.9)], labelOffset: [110, -40], when: (e, sec) => sec.enabled && P.sew > 0.5 && P.inflamed > 0.5, dim: false, info: 'The flaps are put back lower on the tooth, close to the bone, and stitched. The pocket is now much shallower.' });
fig.part(cur, { inPlace: true, name: 'Curette', sub: 'cleans the root', anchor: [0, 12, 0], accent: true, info: 'A hand instrument with a curved blade. With the gum out of the way, the whole root surface can be seen and scraped clean.' });
fig.part(bone, { inPlace: true, name: 'Bone level', sub: 'lost bone stays lost', anchor: (e, sec) => [zc(sec), CRESTY - 0.4, HB - 2.2], labelOffset: [-130, 50], when: (e, sec) => sec.enabled && (P.open > 0.5 || P.inflamed < 0.5), dim: false, info: 'The bone lost to gum disease does not grow back after this surgery. The gum is moved down to meet it, so no deep pocket is left.' });
const healPart = fig.part(pocket, { inPlace: true, name: 'Shallow pocket', sub: 'about 2 mm', anchor: (e, sec) => [zc(sec), (P.margin + P.base) / 2, toothZ((P.margin + P.base) / 2, 1) + 0.2], labelOffset: [-130, -40], when: (e, sec) => sec.enabled && P.inflamed < 0.5, dim: false, info: 'After healing the pocket is shallow enough to keep clean at home. The price is that more root shows: teeth can look longer and feel sensitive.' });
fig.part(L.root, { inPlace: true, name: 'More root shows', anchor: (e, sec) => [zc(sec), -0.9, -toothZ(-0.9, -1) + 0.15], labelOffset: [120, -60], when: (e, sec) => sec.enabled && P.inflamed < 0.5, dim: false, info: 'The gum now sits lower, so part of the root is exposed above it.' });

// --- params
const front = () => (fig.section && fig.section.enabled ? fig.section.offset + 0.4 : s.md / 2 + 1);
const place = () => {
  const y = P.curY; cPivot.position.set(front(), y + P.cur, toothZ(y, 1) + 0.38); cPivot.rotation.x = 0.32; cPivot.visible = P.cur < 25;
};
fig.param('open', 0, k => { P.open = k; setFlaps(k * 1.25, P.margin); });
fig.param('margin', PRE.margin, v => { P.margin = v; pocket.set(v, null); setFlaps(P.open * 1.25, v); });
fig.param('base', PRE.base, v => { P.base = v; pocket.set(null, v); });
fig.param('cur', 30, v => { P.cur = v; place(); });
fig.param('curY', -2, v => { P.curY = v; place(); });
fig.param('calc', 1, k => { P.calc = k; calc.visible = k > 0.02; calc.children.forEach((m, i) => { const kk = clamp(k * calc.children.length - i * 0.6, 0, 1); m.scale.copy(m.userData.s0).multiplyScalar(Math.max(0.01, kk)); }); });
fig.param('sew', 0, k => { P.sew = k; });
fig.param('inflamed', 1, v => { P.inflamed = v; gumMat.color.copy(DK.color(DK.COLORS.gingiva)).lerp(DK.color(DK.COLORS.gingivaInflamed), v); DK.capColor(fig.section, 0, v > 0.5 ? DK.COLORS.gingivaInflamedCap : DK.COLORS.gingivaCap); });

fig.enableSection([1, 0, 0], [
  { objects: flaps.map(f => f.mesh), color: DK.COLORS.gingivaInflamedCap, kind: 'gingiva' },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pocket], color: 0x4a403c },
  { objects: [calc], color: 0x5a4a40, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
const onSec = fig.section.onChange; fig.section.onChange = () => { if (onSec) onSec(); place(); };

// --- procedure
const SIDE = Math.PI / 2 - 0.1;
const ZK = fig.mode === 'image' ? 1 : 1.3;
const CAM = { theta: SIDE, phi: 1.42, zoom: 0.92 * ZK, focus: 'auto' };
const CLOSE = { theta: SIDE, phi: 1.42, zoom: 0.9 * ZK, focus: [CUT, -0.6, 2.2] };
const strokes = [];
for (let i = 0; i < 3; i++) {
  strokes.push({ dur: 0.5, hold: 0, set: { cur: 0, curY: PRE.base + 0.6 }, labels: ['Curette', 'Tartar'] });
  strokes.push(Object.assign({ dur: 0.8, hold: i === 2 ? 0.8 : 0.05, set: { cur: 2.4, calc: 1 - (i + 1) / 3 }, labels: ['Curette', 'Tartar'] }, i === 1 ? { key: true } : {}));
}
fig.procedure([
  { label: 'Deep pocket', caption: 'A deep pocket with tartar on the root, too deep to clean from outside.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: Math.PI / 2 - 1.0, phi: 1.22, zoom: 1.0 * ZK, section: false, labels: [] },
    { fov: 26, dur: 2.2, hold: 0.1, theta: SIDE, phi: 1.42, zoom: 0.92 * ZK, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    Object.assign({ dur: 2.0, hold: 1.8, offset: CUT, labels: ['Pocket', 'Tartar'], key: true }, CAM)] },
  { label: 'Gum lifted', caption: 'The gum is cut along the tooth and lifted as a flap on each side.', beats: [
    { dur: 2.6, hold: 0.3, set: { open: 1 }, labels: ['Gum flap'] },
    Object.assign({ dur: 1.4, hold: 1.8, labels: ['Gum flap', 'Tartar', 'Bone level'], key: true }, CAM)] },
  { label: 'Roots cleaned', caption: 'With the roots in plain view, the tartar is scraped off.', beats: [
    Object.assign({ dur: 1.4, hold: 0.1, set: { cur: 3, curY: PRE.base + 0.6 }, labels: ['Curette', 'Tartar'] }, CLOSE),
    ...strokes,
    { dur: 0.8, hold: 0.2, set: { cur: 30 }, labels: [] }] },
  { label: 'Stitched lower', caption: 'The flaps go back lower on the tooth and are stitched.', beats: [
    Object.assign({ dur: 1.2, hold: 0.1, labels: [] }, CAM),
    { dur: 2.4, hold: 0.2, set: { open: 0, margin: SEWN, base: POST.base }, labels: ['Stitched lower'] },
    { dur: 1.2, hold: 1.8, theta: SIDE - 0.12, phi: 1.4, set: { sew: 1 }, labels: ['Stitched lower', 'Bone level'], key: true }] },
  { label: 'Healed', caption: 'Weeks later: a shallow pocket, a little more root showing, the same bone.', beats: [
    Object.assign({ dur: 1.6, hold: 0.1, set: { sew: 0 }, labels: [] }, CAM),
    { dur: 2.2, hold: 0.2, set: { inflamed: 0, margin: POST.margin }, labels: ['Shallow pocket'] },
    { dur: 1.4, hold: 2.4, theta: SIDE - 0.12, labels: ['Shallow pocket', 'More root shows', 'Bone level'], key: true }] }
]);
fig.start();
