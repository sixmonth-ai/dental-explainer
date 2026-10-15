// Procedure: why a lower complete denture gets loose and how a reline fixes it, in a bucco-lingual section through the first-molar region of a toothless lower jaw.
// poster: step 4
// Frame (this figure only): x = mesio-distal (+x toward the front of the mouth), y up, z bucco-lingual (+z buccal / cheek side); the ridge crest at
// y = 0 before resorption. The ridge, its mucosa (about 2 mm), the acrylic base and the reline layer are traced cross-sections (outlines in z, y)
// extruded along x; the denture teeth are resin crowns of 37, 36 and 35. The cut at x = 0 runs through 36, seen from the front. The bone outline
// morphs from a healed ridge to a low resorbed one (shape only, schematic: resorption varies widely); the base keeps its old fitting surface, so a
// gap opens; the reline layer fills the space between the old fitting surface and the new gum. Sizes in mm, approximate.
const { lerp, clamp, smooth } = DK.util;
const L0 = -16, L1 = 12;                     // the slab runs from the second molar to the second premolar
const fig = DK.figure({
  fov: 28,
  title: 'Relining a loose denture',
  subtitle: 'Lower complete denture, cut across the first molar region. Schematic.',
  view: { theta: 1.15, phi: 1.32, margin: 0.85 }
});

// --- bone outline (z, y), healed (B0) and resorbed (B1); same point count so it can morph. Lower border cropped round.
const B0 = [[0, -22.6], [4.2, -22], [6.2, -19.5], [6.8, -14], [6.6, -9], [5.6, -5.5], [4.4, -2.6], [3.2, -0.7], [1.6, 0], [0, 0.15], [-1.6, 0], [-3.1, -0.8], [-4.1, -2.8], [-5.0, -6], [-5.8, -9.5], [-6.2, -12], [-6.0, -15], [-6.2, -19.5], [-4.2, -22]];
const B1 = [[0, -22.6], [4.2, -22], [6.2, -19.5], [6.8, -14], [6.6, -9.6], [6.1, -7.4], [5.0, -5.6], [3.4, -4.5], [1.7, -4.05], [0, -3.95], [-1.7, -4.05], [-3.3, -4.6], [-4.5, -5.8], [-5.3, -7.8], [-5.9, -10.2], [-6.2, -12], [-6.0, -15], [-6.2, -19.5], [-4.2, -22]];
const FIT = [4, 14];                          // indices of the bone outline the denture covers (buccal fold → lingual fold)
const MUC = [3, 15];                          // mucosa runs a little further down into the folds
const smoothPts = (pts, n, closed) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), closed, 'centripetal').getSpacedPoints(n).map(v => [v.x, v.y]);
const boneAt = r => B0.map((p, i) => [lerp(p[0], B1[i][0], r), lerp(p[1], B1[i][1], r)]);
// outward offset of an open or closed polyline (outline counter-clockwise: outward normal = (dy, -dx))
const offset = (pts, d, closed) => pts.map((p, i) => {
  const a = pts[closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1)];
  const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, dd = typeof d === 'function' ? d(p, i) : d;
  return [p[0] + ty / l * dd, p[1] - tx / l * dd]; });
const ccw = pts => { let s = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }); return s > 0 ? pts : pts.slice().reverse(); };

// sampled curves for a resorption state r
const N = 72;
const boneCurve = r => ccw(smoothPts(boneAt(r), 160, true));
const sub = (r, ix) => smoothPts(boneAt(r).slice(ix[0], ix[1] + 1), N, false);     // the covered stretch, buccal → lingual
const TH = 2.1;
const mucOuter = (r, ix) => offset(sub(r, ix), (p, i) => TH * (0.55 + 0.45 * Math.sin(Math.PI * clamp(i / (N - 1), 0, 1))) , false);
const FIT0 = mucOuter(0, FIT).map(p => [p[0], p[1] + 0.04]);                         // the denture's fitting surface: the gum as it was
const fitTop = FIT0.reduce((m, p) => Math.max(m, p[1]), -99);
const NECK = fitTop + 3.0, CEJ = fitTop + 2.3;                                       // gum festoon and the denture teeth's necks

// --- live slabs: an outline in (z, y) extruded along x; the geometry is replaced in place (the section keeps the same object)
const slabGeo = (pts, x0, x1) => {
  const sh = new THREE.Shape(ccw(pts).map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: x1 - x0, bevelEnabled: false, curveSegments: 4, steps: 1 });
  g.rotateY(-Math.PI / 2); g.translate(x1, 0, 0); g.computeVertexNormals(); return g;   // shape x → world z; extrusion → world x
};
const live = (mat, x0, x1) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.set = pts => {
  const g = slabGeo(pts, x0, x1), d = m.geometry; ['position', 'normal', 'uv'].forEach(k => { if (g.attributes[k]) d.setAttribute(k, g.attributes[k]); });
  d.setIndex(g.index); d.clearGroups(); d.computeBoundingSphere(); d.computeBoundingBox(); g.dispose(); }; return m; };

// --- jaw: cortical bone, cancellous core (cut face only), mucosa
const bone = live(DK.mat('bone'), L0, L1);
const cancMat = DK.mat('bone', { color: DK.COLORS.cancellous }); cancMat.visible = false;
const canc = live(cancMat, L0 + 0.5, L1 - 0.5); canc.userData.cutOnly = true;
const muc = live(DK.mat('mucosa'), L0, L1);
const jaw = new THREE.Group(); jaw.add(bone, canc, muc);
fig.part(jaw, { name: 'Jaw', label: false, info: 'A toothless lower jaw, cut across where the first molar used to be.' });
const TRAB = DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture;

// --- the denture: acrylic base with a fitting surface copied from the gum as it was, resin teeth, and (later) a reline layer
const ACRYLIC = 0xd8999c, ACRYLIC_CAP = 0xdca2a5, RELINE = 0xeed3c4, RELINE_CAP = 0xecd0bf;
const denture = new THREE.Group(), rocker = new THREE.Group(); denture.add(rocker);
const baseOuter = offset(FIT0, 2.4, false).map(p => { const neck = NECK - 0.32 * Math.pow(Math.max(0, Math.abs(p[0]) - 3.4), 2); return [p[0], Math.max(p[1], neck)]; });
const basePts = FIT0.concat(baseOuter.slice().reverse());
const base = new THREE.Mesh(slabGeo(smoothPts(basePts, 200, true), L0 + 0.4, L1 - 0.4), DK.mat('gingiva', { color: ACRYLIC, cap: ACRYLIC_CAP, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.22 }));
rocker.add(base);
const teeth = [37, 36, 35].map(f => { const s = DK.toothPreset(f), c = DK.restorationCrown(s, 'ceramic', { hollow: false });
  c.position.set(f === 36 ? 0 : f === 35 ? (DK.toothPreset(36).md + s.md) / 2 : -(DK.toothPreset(36).md + s.md) / 2, CEJ, 0); rocker.add(c); return c; });
const relineMesh = live(DK.mat('gingiva', { color: RELINE, cap: RELINE_CAP, roughness: 0.45 }), L0 + 0.4, L1 - 0.4); rocker.add(relineMesh);
fig.part(denture, { name: 'Denture', anchor: [-6, NECK - 0.6, 6.0], info: 'A lower complete denture: acrylic base and resin teeth. It is held by its fit on the gum and by the cheeks and tongue, nothing else.' });

// gap marker: a see-through accent fill between the old fitting surface and today's gum, on the cut face only
const gapMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
const gap = live(gapMat, -0.2, 0.3); rocker.add(gap);

// --- state
const st = { r: 0, k: 0, rock: 0, gap: 0 };
const update = () => {
  const r = st.r, bc = boneCurve(r);
  bone.set(bc); canc.set(offset(bc, -1.4, true));
  const mo = mucOuter(r, MUC), mi = offset(sub(r, MUC), -0.4, false);
  muc.set(mo.concat(mi.slice().reverse()));
  // reline: from the old fitting surface down toward today's gum by k (index-matched curves)
  const now = mucOuter(r, FIT);
  const inner = FIT0.map((p, i) => [lerp(p[0], now[i][0], st.k), lerp(p[1], now[i][1], st.k) + 0.03]);
  if (st.k > 0.01) { relineMesh.visible = true; relineMesh.set(FIT0.map(p => [p[0], p[1] + 0.1]).concat(inner.slice().reverse())); } else relineMesh.visible = false;
  const g = FIT0.map((p, i) => [lerp(p[0], now[i][0], Math.max(st.k, 0)), lerp(p[1], now[i][1], Math.max(st.k, 0))]);
  if (r > 0.03 && st.k < 0.98) { gap.visible = true; gap.set(g.concat(now.map(p => [p[0], p[1] + 0.02]).reverse())); } else gap.visible = false;
  gapMat.opacity = 0.28 * st.gap;
  rocker.rotation.x = st.rock * 0.07; rocker.position.y = -0.9 * Math.abs(st.rock) * r;
};
fig.param('resorb', 0, v => { st.r = v; update(); });
fig.param('reline', 0, v => { st.k = v; update(); });
fig.param('rock', 0, v => { st.rock = v; update(); });
fig.param('gap', 0, v => { st.gap = v; update(); });
update();

// --- labels (anchors on the cut face, x just behind the plane)
const X = -0.15;
const crest = () => { const b = boneAt(st.r)[9]; return [X, b[1] - 1.6, b[0]]; };
fig.part(bone, { inPlace: true, name: 'Bone', sub: 'shrinks over the years', anchor: () => [X, -12, -2], dim: false, info: 'Jaw bone. Once the teeth are gone the ridge slowly resorbs, fastest in the first year and faster in the lower jaw than the upper.' });
fig.part(muc, { inPlace: true, name: 'Gum', anchor: () => { const m = mucOuter(st.r, MUC)[Math.round(N * 0.3)]; return [X, m[1] - 0.7, m[0] - 0.2]; }, dim: false, info: 'The gum (mucosa) over the ridge: about 2 mm of firm tissue that the denture rests on.' });
fig.part(base, { inPlace: true, name: 'Denture base', sub: 'fitted to the old gum', anchor: [X, NECK - 1.2, -5.2], dim: false, info: 'Acrylic moulded to the gum as it was when the denture was made. Its fitting surface does not change when the ridge does.' });
const gapLbl = new THREE.Object3D(); rocker.add(gapLbl);
fig.part(gapLbl, { inPlace: true, name: 'Gap', sub: 'the ridge has shrunk', anchor: () => { const now = mucOuter(st.r, FIT), i = Math.round(N * 0.5); return [X, (FIT0[i][1] + now[i][1]) / 2, FIT0[i][0]]; }, dim: false, when: () => gap.visible && st.gap > 0.5,
  info: 'Space between the denture and the gum. The denture now rocks, food gets under it, and it rubs sore spots.' });
fig.part(relineMesh, { inPlace: true, name: 'Reline', sub: 'new fitting surface', accent: true, anchor: () => { const now = mucOuter(st.r, FIT), i = Math.round(N * 0.42); return [X, lerp(FIT0[i][1], now[i][1], 0.5), lerp(FIT0[i][0], now[i][0], 0.5)]; }, dim: false, when: () => relineMesh.visible && st.k > 0.6,
  info: 'Fresh acrylic added to the inside of the same denture, moulded to the gum as it is now: at the chair with a soft or hard material, or in the lab from an impression. The teeth stay.' });
fig.part(teeth[1], { inPlace: true, name: 'Denture tooth', anchor: [X, CEJ + 4.5, 2], dim: false, info: 'Resin tooth set where the first molar was. A reline keeps the teeth; only the fitting surface is renewed.' });

fig.enableSection([1, 0, 0], [
  { objects: [muc], color: DK.COLORS.mucosaCap, kind: 'gingiva' },
  { objects: [bone], color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: [canc], color: 0xffffff, texture: TRAB },
  { objects: [base], color: ACRYLIC_CAP, kind: 'plain' },
  { objects: [relineMesh], color: RELINE_CAP, kind: 'plain' },
  { objects: teeth, color: DK.COLORS.ceramicCap, kind: 'plain' }
]);
gapMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-14, 11], offset: 0 } });

// --- procedure: one cut, seen from the front of the mouth; the camera eases in on the fitting surface when it matters
const CUTV = { theta: 1.42, phi: 1.5 }, FOC = [0, -6.5, 0];
fig.procedure([
  { label: 'Good fit', caption: 'A new denture fits the gum closely all over.', beats: [
    { fov: 32, dur: 0, hold: 0.8, theta: 0.75, phi: 1.2, zoom: 1, section: false, labels: ['Denture'] },
    { dur: 0, hold: 0, section: true, offset: L1 },
    { fov: 28, dur: 2.2, hold: 1.6, offset: 0, theta: CUTV.theta, phi: CUTV.phi, zoom: 0.98, focus: FOC, labels: ['Denture base', 'Gum', 'Bone'], key: true }] },
  { label: 'Bone shrinks', caption: 'Over the years the ridge under the gum shrinks; the denture does not.', beats: [
    { dur: 3.2, hold: 0.2, set: { resorb: 1 }, labels: ['Bone', 'Gum'] },
    { dur: 1.2, hold: 1.8, zoom: 0.95, focus: [0, -6, 0], set: { gap: 1 }, labels: ['Gap', 'Denture base', 'Bone'], key: true }] },
  { label: 'Loose', caption: 'The denture rocks on the ridge, slips when chewing and rubs sore spots.', beats: [
    { dur: 0.7, hold: 0.1, set: { rock: 1 }, labels: ['Gap'] },
    { dur: 0.9, hold: 0.1, set: { rock: -1 } },
    { dur: 0.8, hold: 0.1, set: { rock: 0.8 }, key: true },
    { dur: 0.8, hold: 0.8, set: { rock: 0 } }] },
  { label: 'Reline', caption: 'New acrylic is added inside the denture and moulded to the gum as it is now.', beats: [
    { dur: 2.6, hold: 0.2, zoom: 0.95, focus: [0, -6, 0], set: { reline: 1, gap: 0 }, labels: ['Reline'] },
    { dur: 0.6, hold: 1.6, labels: ['Reline', 'Denture base', 'Gum'], key: true }] },
  { label: 'Fits again', caption: 'The same denture and teeth, now seated on the smaller ridge.', beats: [
    { fov: 30, dur: 2.4, hold: 2.4, theta: 1.1, phi: 1.32, zoom: 0.95, focus: [-2, -5, 0], labels: ['Reline', 'Denture tooth', 'Bone', 'Gum'], key: true }] }
]);
fig.start();
