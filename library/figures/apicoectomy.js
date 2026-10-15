// Procedure: apicoectomy (root-end surgery) on a root-filled maxillary right central incisor (FDI 11 = Universal 8) with a lesion that has not healed, crown up (model convention), in a labio-palatal cut through the canal. Frame: +x mesial, +z labial, CEJ at y = 0, mm; camera on the mesial side (labial on the viewer's left).
// poster: step 3
// A submarginal labial flap folds down, a bone window opens over the apex and the lesion is curetted; about 3 mm of the root tip is cut off square to the long axis (the tooth is clipped by a resection plane and the tip leaves through the window); the canal end is prepared about 3 mm deep and filled with a calcium-silicate cement; the flap goes back and the bone fills in. The 3 mm values are surgical teaching (Kim & Kratchman 2006), not in dental-facts.md, so they are given as "about".
const FDI = 11, CREST = -1.6, RESECT = 3, RETRO = 3;
const SHAPE = { size: 40, taper: 0.06 };

const fig = DK.figure({
  fov: 26,
  title: 'Apicoectomy',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up, cut front to back.',
  view: { theta: Math.PI / 2, phi: 1.42, margin: 0.92 }
});

// --- tooth, bone, soft tissue
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const root = s.roots[0], CUT = DK.canalAt(s, 0, -6).x;
const BONE_Z = -1.6, BONE_D = 11.5, BF = BONE_Z + BONE_D / 2;               // labial bone surface at z = BF
const bone = DK.bone({ width: 11, height: 19, depth: BONE_D, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, BONE_Z);
const gum = DK.gingiva({ width: 11, height: 3.0, depth: BONE_D + 1.1, crest: 1.2, around: [{ x: 0, z: -BONE_Z, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.set(0, 1.1, BONE_Z);
// submarginal flap: labial mucosa below the attached gingiva, hinged at its apical edge so it folds out and down
const FLAP_TOP = -1.7, FLAP_BOT = -20.4, FLAP_T = 1.0;
const flapPivot = new THREE.Group(); flapPivot.position.set(0, FLAP_BOT, BF);
const flap = DK.gingiva({ width: 11, height: FLAP_TOP - FLAP_BOT, depth: FLAP_T, crest: 0.2, round: 0.5, material: 'mucosa' }); flap.position.set(0, FLAP_TOP - FLAP_BOT, FLAP_T / 2 + 0.02);
flapPivot.add(flap); fig.world.add(flapPivot);
const APEX = [root.x + root.apex[0], -root.len, root.z + root.apex[1]];
const lesion = DK.periapicalLesion({ radius: 2.6, seed: 4, color: 0x7d6761 }); lesion.position.set(APEX[0], APEX[1] - 0.6, APEX[2] + 0.2);
const HOLE = fig.dark ? DK.voidColor(fig) : 0xb9b0a1;                      // the surgical cavity: a recess a step deeper than the stage
const crypt = DK.periapicalLesion({ radius: 2.8, seed: 4, color: HOLE }); crypt.position.copy(lesion.position); crypt.set(0);
const cryptRim = DK.periapicalLesion({ radius: 2.95, seed: 4, color: DK.RIM }); cryptRim.position.copy(lesion.position); cryptRim.set(0); cryptRim.userData.cutOnly = true;
const RES_Y = APEX[1] + RESECT;                                            // resection level
const WIN_Y = APEX[1] + 1.2, WIN_R = 2.9;
const window_ = DK.osteotomy({ color: HOLE }); window_.rotation.x = Math.PI / 2; window_.position.set(CUT, WIN_Y, BF + 0.05); window_.userData.cutOnly = true;
const windowRim = DK.osteotomy({ color: DK.RIM }); windowRim.rotation.x = Math.PI / 2; windowRim.position.copy(window_.position); windowRim.userData.cutOnly = true;
// the mouth of the window on the labial bone surface: a dark recess disc with an ink rim, cut by the section plane like the bone
const mouth = new THREE.Group(); mouth.position.set(CUT, WIN_Y, BF + 0.04);
const mouthDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0x1b1a17 : 0x8f8679), toneMapped: false }));
const mouthRing = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.07, 64), new THREE.MeshBasicMaterial({ color: DK.color(DK.RIM), toneMapped: false })); mouthRing.position.z = 0.01;
mouth.add(mouthDisc, mouthRing); mouth.visible = false;
[lesion, cryptRim, crypt, windowRim, window_, mouth].forEach(o => tooth.group.add(o));
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the root; the plate on the lip side is thin.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum margin around the tooth stays in place with a submarginal flap.' });
fig.part(tooth.group, { name: 'Tooth 11', label: false, info: 'Upper right central incisor with a root canal filling that has not cured the infection at the root tip.' });
fig.part(lesion, { inPlace: true, name: 'Lesion', sub: 'not healing', anchor: [0.3, -0.7, 1.0], accent: true, dim: false, when: () => lesion.visible && lesion.userData.k > 0.4, info: 'Apical periodontitis that persists after root canal treatment, often from bacteria in the last few millimetres of the canal or its side branches. Apicoectomy is the option when retreatment from the crown is not practical, for example under a good crown or post.' });
fig.part(flap, { inPlace: true, name: 'Flap', anchor: [0, -2.5, FLAP_T / 2], dim: false, when: () => flapState.a > 0.15 && flapState.a < 0.7, info: 'After local anaesthesia the gum and lining are cut and lifted off the bone; here a flap below the gum margin, so the margin around a crown is not disturbed.' });
fig.part(mouth, { inPlace: true, name: 'Bone window', anchor: [0, 0.8, 0.05], dim: false, when: () => mouth.visible && st.heal < 0.5, info: 'A small opening in the thin outer bone gives access to the root tip; the inflamed tissue around it is scraped out (curettage).' });

// --- the old treatment: root filling, and the bonded palatal access seal (a channel along the old access line)
L.pulp.visible = false;
// --- the access line: from the orifice up through the chamber to the palatal surface near the cingulum
const probe = new THREE.Mesh(DK.crownGeometry(s), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); probe.updateMatrixWorld();
const rc = new THREE.Raycaster();
const surfZ = y => { rc.set(new THREE.Vector3(CUT, y, 0), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(probe); return h.length ? h[h.length - 1].point.z : -s.bl / 2; };
const SHORT = 0.5, ENTRY_Y = s.crownL * 0.5;
const ent = new THREE.Vector3(CUT, ENTRY_Y, surfZ(ENTRY_Y));
const cs0 = DK.canalPath(s, 0, { n: 4 })[0], ORI = new THREE.Vector3(cs0[0], cs0[1], cs0[2]);
const AX = ent.clone().sub(ORI).normalize();             // the straight-line access direction (out of the tooth)

// the access channel: a closed solid along AX whose top follows the real palatal surface (raycast, like DK.accessCavity) and whose
// floor deepens with k from the surface (0) to just above the orifice (1). rTop / rBot: radius at the surface / at the floor.
const N = 48, U = new THREE.Vector3(1, 0, 0).addScaledVector(AX, -AX.x).normalize(), V = new THREE.Vector3().crossVectors(AX, U).normalize();
const BOT = ORI.clone().addScaledVector(AX, 1.2);
function surfaceAlong(from) { rc.set(from, AX); const h = rc.intersectObject(probe); return h.length ? h[0].point : from.clone().addScaledVector(AX, 8); }
function channel(mat, rTop, rBot, lift) {
  const ring = r => { const top = [], bot = []; for (let j = 0; j < N; j++) { const a = j / N * Math.PI * 2, d = U.clone().multiplyScalar(Math.cos(a)).addScaledVector(V, Math.sin(a));
      const b = BOT.clone().addScaledVector(d, rBot * r), t = surfaceAlong(BOT.clone().addScaledVector(d, rTop * r)); top.push(t.addScaledVector(AX, lift)); bot.push(b); } return { top, bot }; };
  const R = ring(1), cTop = surfaceAlong(BOT.clone()).addScaledVector(AX, lift);
  const W = 3, pos = new Float32Array((N * (W + 1) + 2) * 3), idx = [], at = (w, j) => w * N + (j % N), cT = N * (W + 1), cB = cT + 1;
  for (let w = 0; w < W; w++) for (let j = 0; j < N; j++) idx.push(at(w, j), at(w, j + 1), at(w + 1, j + 1), at(w, j), at(w + 1, j + 1), at(w + 1, j));
  for (let j = 0; j < N; j++) { idx.push(cT, at(0, j + 1), at(0, j)); idx.push(cB, at(W, j), at(W, j + 1)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); let flip = null;
  m.set = k => { k = Math.max(0, Math.min(1, k)); m.userData.k = k; m.visible = k > 0.02; let cx = new THREE.Vector3();
    for (let j = 0; j < N; j++) for (let w = 0; w <= W; w++) { const p = R.top[j].clone().lerp(R.bot[j], k * w / W); pos.set([p.x, p.y, p.z], at(w, j) * 3); if (w === W) cx.add(p); }
    cx.multiplyScalar(1 / N); pos.set([cTop.x, cTop.y, cTop.z], cT * 3); pos.set([cx.x, cx.y, cx.z], cB * 3);
    if (flip === null) { let vol = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); for (let i = 0; i < idx.length; i += 3) { A.fromArray(pos, idx[i] * 3); B.fromArray(pos, idx[i + 1] * 3); C.fromArray(pos, idx[i + 2] * 3); vol += A.dot(B.clone().cross(C)); }
      flip = vol < 0; if (flip) { for (let i = 0; i < idx.length; i += 3) { const tt = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tt; } g.setIndex(idx); } }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); return m; };
  m.set(1); m.set(0); return m;
}
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const filling = DK.rootFilling(s, 0, Object.assign({ from: ORI.y - 0.5 }, SHAPE));
const seal = channel(DK.mat('composite', { cap: DK.COLORS.compositeCap }), 1.1, 0.8, 0.02); seal.set(1);
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
// root-end cavity (about 3 mm up the canal from the cut), first empty, then filled with calcium-silicate cement
const RETRO_C = DK.canalAt(s, 0, RES_Y + RETRO / 2), RETRO_R = DK.fileDiameter(SHAPE.size, SHAPE.taper, RESECT + RETRO / 2) / 2 + 0.25;
const ACC = fig.dark ? DK.COLORS.accentDark : DK.COLORS.accent;
const retro = new THREE.Mesh(new THREE.CylinderGeometry(RETRO_R, RETRO_R * 0.92, RETRO + 0.4, 28), DK.mat('pdl', { color: ACC, cap: ACC, roughness: 0.8 }));
retro.position.set(RETRO_C.x, RES_Y + RETRO / 2 - 0.2, RETRO_C.z);
[filling, seal, chamberResto, retro].forEach(o => tooth.group.add(o));
const midY = -6.5, mid = DK.canalAt(s, 0, midY);
fig.part(filling, { inPlace: true, name: 'Root filling', anchor: [CUT, midY, mid.z], dim: false, when: () => st.retro < 0.5, info: 'The existing gutta-percha root filling; the tooth keeps it.' });
fig.part(retro, { inPlace: true, name: 'Root-end filling', sub: 'seals from below', anchor: [0, -0.4, RETRO_R], accent: true, dim: false, when: () => retro.visible && st.mta > 0.5, info: `The canal end is cleaned out about ${RETRO} mm deep with a fine ultrasonic tip and filled with a calcium-silicate (bioceramic) cement, so bacteria left in the root cannot leak out of the tip.` });

// --- the cut-off root tip: a copy of root dentin and filling below the resection plane, which leaves through the window
const KEEP = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e5);           // the tooth keeps y ≥ RES_Y once resected
const TIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), RES_Y);         // the tip is y ≤ RES_Y
const tip = new THREE.Group(); tooth.group.add(tip);
const tipMats = [];
[[L.dentin, DK.mat('root')], [filling, DK.mat('gutta')]].forEach(([src, mat]) => src.traverse(m => {
  if (!m.isMesh) return; const c = new THREE.Mesh(m.geometry, mat.clone()); m.updateMatrix(); c.matrix.copy(m.matrix); c.matrixAutoUpdate = false; tip.add(c); tipMats.push(c.material); }));
// close the tip's cut face: the convex outline of the root where the resection plane slices the dentin mesh, plus the filling's dot
function sliceHull(mesh, y) {
  const g = mesh.geometry, P = g.attributes.position, I = g.index ? g.index.array : null, n = I ? I.length : P.count, pts = [];
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let i = 0; i < n; i += 3) { for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(P, I ? I[i + k] : i + k).applyMatrix4(mesh.matrix);
    for (let k = 0; k < 3; k++) { const a = v[k], b = v[(k + 1) % 3]; if ((a.y - y) * (b.y - y) < 0) { const u = (y - a.y) / (b.y - a.y); pts.push([a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u]); } } }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
  pts.forEach(p => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
  pts.slice().reverse().forEach(p => { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); });
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
const capAt = (hull, mat, lift) => { const sh = new THREE.Shape(hull.map(p => new THREE.Vector2(p[0], -p[1]))); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat); m.rotation.x = -Math.PI / 2; m.position.y = RES_Y - 0.01 + lift; return m; };
L.dentin.updateMatrix(); filling.updateMatrix();
const capD = capAt(sliceHull(L.dentin, RES_Y), DK.mat('dentin'), 0), capG = capAt(sliceHull(filling, RES_Y), DK.mat('gutta'), 0.02);
tip.add(capD, capG); tipMats.push(capD.material, capG.material);
tip.visible = false;
fig.part(tip, { inPlace: true, name: 'Root tip', sub: `about ${RESECT} mm`, anchor: [APEX[0], APEX[1] + 0.8, APEX[2] + 1.4], dim: false, when: () => tip.visible && st.tip < 0.9, info: `About ${RESECT} mm of the apex is cut off square to the root, removing most of the side branches of the canal, where bacteria hide.` });
const healMark = new THREE.Object3D(); healMark.position.set(CUT, WIN_Y - 0.5, BF - 1.0); tooth.group.add(healMark);
fig.part(healMark, { inPlace: true, name: 'Bone heals', anchor: [0, 0, 0], dim: false, when: () => st.heal > 0.5, info: 'Bone fills the window and the old lesion over months; a radiograph about a year later checks healing.' });

// --- instruments: a surgical bur that cuts across the root through the window (tip at its origin, shank toward the lip)
const bur = DK.bur({ shape: 'flat', diameter: 1.2, head: 4.0, length: 18 });
bur.rotation.x = Math.PI / 2; fig.world.add(bur);
fig.part(bur, { inPlace: true, name: 'Surgical bur', anchor: [0, 9, 0], info: 'A fine bur under saline spray cuts the root end flat, with little or no bevel.' });

// --- params
const st = { tip: 0, retro: 0, mta: 0, heal: 0 }, flapState = { a: 0 };
fig.param('flap', 0, a => { flapState.a = a; flapPivot.rotation.x = a * Math.PI * 0.96; flap.traverse(m => { if (m.isMesh && !m.userData.isStencil && m.material) { m.material.transparent = a > 0.02; m.material.opacity = 1 - 0.3 * a; m.material.depthWrite = a < 0.5; } }); });
fig.param('window', 0, k => { const r = WIN_R * Math.min(1, k * 1.5), d = (BF - APEX[2]) * k + 0.3 * k; window_.set(r, d); windowRim.set(r + 0.15, d); mouth.visible = k > 0.02; mouth.scale.setScalar(Math.max(r, 0.01)); });
fig.param('lesion', 1, k => lesion.set(k));
fig.param('crypt', 0, k => { crypt.set(k); cryptRim.set(k); });
fig.param('resect', 0, v => { KEEP.constant = v > 0.5 ? -RES_Y : 1e5; tip.visible = v > 0.5 && st.tip < 0.98; });
fig.param('tip', 0, k => { st.tip = k; tip.position.set(0, 0.8 * k, 8 * k); tipMats.forEach(m => { m.transparent = k > 0.02; m.opacity = Math.max(0, 1 - 0.3 * k - Math.max(0, k - 0.8) / 0.2 * 0.7); m.depthWrite = k < 0.3; }); tip.visible = KEEP.constant < 1e4 && k < 0.98; });
fig.param('retro', 0, v => { st.retro = v; retro.visible = v > 0.5; });
fig.param('mta', 0, v => { st.mta = v; const c = DK.color(v > 0.5 ? ACC : HOLE); retro.material.color.copy(c); if (fig.section) DK.capColor(fig.section, RETRO_GROUP, v > 0.5 ? ACC : HOLE); });
fig.param('heal', 0, v => { st.heal = v; });
fig.param('bur', 30, z => { bur.visible = z < 25; bur.position.set(CUT, RES_Y, z); });

const RETRO_GROUP = 12;
fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lesion], color: 0x8a736d, kind: 'gingiva' },
  { objects: [windowRim, cryptRim], color: DK.RIM, kind: 'plain' },
  { objects: [window_, crypt], color: HOLE, kind: 'plain' },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [flap], color: DK.COLORS.mucosaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [filling], color: DK.COLORS.gutta },
  { objects: [seal, chamberResto], color: DK.COLORS.compositeCap, kind: 'plain' },
  { objects: [retro], color: ACC, kind: 'plain' }
]);
// the resection: tooth layers (and their stencil copies) also keep only y ≥ RES_Y; the tip copy keeps only y ≤ RES_Y and the cut plane
[L.dentin, L.root, filling].forEach(o => o.traverse(m => { if (m.isMesh && m.material.clippingPlanes) m.material.clippingPlanes = m.material.clippingPlanes.concat([KEEP]); }));
tipMats.forEach(m => { m.clippingPlanes = [TIP]; });
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
fig.xray([bone, gum, flap, L.enamel, L.dentin, L.root], false);
fig.view('X-ray', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });

// --- the procedure (camera on +x looks at the cut face; labial on the left)
const SIDE = Math.PI / 2, FOCUS_TOOTH = [CUT, -6.5, 0.5], FOCUS_APEX = [CUT, APEX[1] + 2, 1.5];
fig.procedure([
  { label: 'Lesion not healing', caption: 'Despite a root canal filling, infection persists at the root tip.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: SIDE - 0.75, phi: 1.3, zoom: 1.0, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { fov: 26, dur: 2.4, hold: 0.4, theta: SIDE, phi: 1.42, zoom: 0.95, focus: FOCUS_TOOTH, offset: CUT, labels: ['Root filling'] },
    { dur: 1.4, hold: 2.0, labels: ['Root filling', 'Lesion'], key: true }] },
  { label: 'Flap and window', caption: 'The gum is folded back and a small window is made in the bone over the tip.', beats: [
    { dur: 2.2, hold: 0.4, zoom: 0.95, focus: FOCUS_TOOTH, theta: SIDE - 0.5, set: { flap: 1 }, labels: ['Flap'] },
    { dur: 1.8, hold: 0.2, set: { window: 1 }, labels: ['Bone window'] },
    { dur: 1.6, hold: 1.8, set: { lesion: 0, crypt: 1 }, labels: ['Bone window'], key: true }] },
  { label: 'Root tip removed', caption: `About ${RESECT} mm of the root tip is cut off.`, beats: [
    { dur: 1.4, hold: 0.1, set: { bur: BF + 2 }, labels: ['Surgical bur'] },
    { dur: 1.8, hold: 0.2, set: { bur: APEX[2] - 1.2, resect: 1 }, labels: ['Surgical bur'] },
    { dur: 1.0, hold: 0.2, set: { bur: 30 }, labels: ['Root tip'] },
    { dur: 1.8, hold: 1.6, set: { tip: 0.8 }, labels: ['Root tip'], key: true },
    { dur: 0.8, hold: 0.2, set: { tip: 1 }, labels: [] }] },
  { label: 'Seal the root end', caption: 'The canal end is cleaned out and sealed with a bioceramic filling.', beats: [
    { dur: 1.2, hold: 0.6, theta: SIDE - 0.35, set: { retro: 1 }, labels: [] },
    { dur: 1.2, hold: 2.0, set: { mta: 1 }, labels: ['Root-end filling'], key: true }] },
  { label: 'Healing', caption: 'The flap is stitched back and the bone fills in over months.', beats: [
    { dur: 1.8, hold: 0.2, zoom: 0.95, focus: FOCUS_TOOTH, theta: SIDE, set: { flap: 0 }, labels: ['Root-end filling'] },
    { dur: 2.4, hold: 2.6, set: { window: 0, crypt: 0, heal: 1 }, labels: ['Root-end filling', 'Root filling', 'Bone heals'], key: true }] }
]);
fig.start();
