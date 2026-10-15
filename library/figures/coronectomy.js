// Procedure: coronectomy of a lower left third molar (FDI 38 = Universal 17) whose root tips lie on the inferior alveolar canal, in a mesio-distal cut of the jaw: gum flap, crown cut off at the neck, crown lifted out, the roots trimmed to about 3 mm below the bone crest and left in place with their pulp, flap stitched back. Frame: the quadrant group is mirrored (left side), neighbour 37 at the origin with its CEJ at y = 0, +x mesial in the tooth frame, camera on the buccal side.
// poster: step 5
const CREST = -1.8, GUM_TOP = 1.1, GUM_H = 3.4, CANAL_R = 1.4;
const TRIM = 3;                                      // roots reduced to about 3 mm below the crest (coronectomy teaching, Pogrel 2004)

const fig = DK.figure({
  fov: 26,
  title: 'Coronectomy',
  subtitle: 'Lower left third molar, FDI 38 (Universal 17), mesio-distal cut. Roots vary.',
  view: { theta: 0, phi: 1.45, margin: window.DK_MODE === 'image' ? 0.78 : 0.92 }
});

// ---------- 38 posed upright (vertical, Winter), crown just above the crest; crown and roots as two pieces ----------
const quad = new THREE.Group(); quad.scale.x = -1;
const t37 = DK.tooth(37), t36 = DK.tooth(36);
t36.group.position.x = t37.spec.md / 2 + t36.spec.md / 2;
const imp = DK.impaction({ fdi: 38, neighbour: 37, angle: 0, depth: 2.2 });
const s38 = imp.spec;
imp.group.remove(imp.tooth.group);
const crownSpec = Object.assign({}, s38, { trunk: 0.5, roots: s38.roots.map(r => Object.assign({}, r, { len: 0.7 })), canals: [], chamberY: 0.4 });
const crownPc = DK.tooth(crownSpec);
const rootPc = DK.tooth(s38, { omit: ['enamel', 'dentin'] });
rootPc.layers.pulp.remove(rootPc.layers.pulp.userData.chamber);
const crownHold = new THREE.Group(), rootHold = new THREE.Group();
crownHold.add(crownPc.group); rootHold.add(rootPc.group); imp.group.add(crownHold, rootHold);
imp.group.updateMatrix();
const toQuad = new THREE.Matrix4().copy(imp.group.matrix);
const PIV_Y = imp.group.position.y;                  // CEJ of 38 in the quad frame (upright tooth: tooth y + PIV_Y)

// root meshes (dentin + canals) whose tops are flattened at a height that the trim param lowers
const rootMeshes = rootPc.layers.root.children.slice();
const canalMeshes = []; rootPc.layers.pulp.traverse(m => { if (m.isMesh) canalMeshes.push(m); });
const clampables = rootMeshes.concat(canalMeshes).map(m => ({ m, base: m.geometry.attributes.position.array.slice() }));
let apexY = 0;                                       // deepest root point, tooth frame
rootMeshes.forEach(m => { m.geometry.computeBoundingBox(); apexY = Math.min(apexY, m.geometry.boundingBox.min.y + m.position.y); });
function clampRoots(top) {                           // top in the tooth frame
  clampables.forEach(({ m, base }) => {
    const p = m.geometry.attributes.position, oy = m.position.y;
    for (let i = 0; i < p.count; i++) p.array[i * 3 + 1] = Math.min(base[i * 3 + 1], top - oy);
    p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
  });
}

// ---------- jaw: bone, nerve canal touching the apices, gum (with the flap over 38 as its own piece), 36 and 37 ----------
const APEX_Q = apexY + PIV_Y, XC = imp.group.position.x;
const CANAL_Y = APEX_Q - CANAL_R + 0.55;             // the root tips dip into the top of the canal
const bone = DK.bone({ width: 46, height: 24, depth: 11.5, cortical: 1.2, crest: 1.6 });
bone.position.set(-4, CREST, 0);
// the canal runs down and forward from the ramus, lowest under the molars
const path = [[-27, CANAL_Y + 2.2, 0.6], [XC - 6, CANAL_Y + 0.9, 0.4], [XC, CANAL_Y, 0.2], [6, CANAL_Y - 0.9, 0], [19, CANAL_Y - 1.2, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.7, DK.mat('nerve'), { caps: false });
const canal = new THREE.Group(); canal.add(lumen, nerve);
const SPLIT = -t37.spec.md / 2 - 0.15;
const gum = DK.gingiva({ width: 19 - SPLIT, height: GUM_H, depth: 12, crest: 1.4, around: [{ x: t36.group.position.x - (19 + SPLIT) / 2, z: 0, md: t36.spec.mdC, bl: t36.spec.blC }, { x: -(19 + SPLIT) / 2, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
gum.position.set((19 + SPLIT) / 2, GUM_TOP, 0);
const FL = { x0: -27, x1: SPLIT };
const flapG = DK.gingiva({ width: FL.x1 - FL.x0, height: GUM_H, depth: 12, crest: 1.4, around: [{ x: XC - (FL.x0 + FL.x1) / 2, z: 0, md: s38.mdC, bl: s38.blC }] });
const HINGE = { y: GUM_TOP - GUM_H, z: 6 };
const flap = new THREE.Group(); flap.position.set(0, HINGE.y, HINGE.z);
flapG.position.set((FL.x0 + FL.x1) / 2, GUM_TOP - HINGE.y, -HINGE.z); flap.add(flapG);
// once the crown is gone the flap closes flat over the socket: a second, unscalloped flap swapped in
const flapFlat = DK.gingiva({ width: FL.x1 - FL.x0, height: GUM_H, depth: 12, crest: 1.4 });
flapFlat.position.copy(flapG.position); flapFlat.visible = false; flap.add(flapFlat);
quad.add(bone, canal, gum, flap, t36.group, t37.group, imp.group);
quad.updateMatrixWorld(true);

// ---------- the space the trimmed root top leaves in the bone (cut face only), with an ink rim ----------
const voidMat = DK.mat('cavity');
const rootGeosQ = rootMeshes.map(m => { const g = m.geometry.clone(); g.applyMatrix4(m.matrix); return g; });
function slabOf(geo, inflate) {                      // the root outline between two heights, as a solid in the quad frame
  const g = DK.inflateGeometry(geo, inflate); g.applyMatrix4(toQuad);
  return { g, base: g.attributes.position.array.slice() };
}
const voids = rootGeosQ.map(g => slabOf(g, 0.25)), rims = rootGeosQ.map(g => slabOf(g, 0.47));
const voidMeshes = voids.map(v => new THREE.Mesh(v.g, voidMat));
const rimMeshes = rims.map(v => new THREE.Mesh(v.g, DK.mat('cavity')));
function setSlab(s, lo, hi) {
  const p = s.g.attributes.position;
  for (let i = 0; i < p.count; i++) p.array[i * 3 + 1] = Math.max(lo, Math.min(hi, s.base[i * 3 + 1]));
  p.needsUpdate = true; s.g.computeBoundingSphere();
}
[...voidMeshes, ...rimMeshes].forEach(m => { m.userData.cutOnly = true; quad.add(m); });
const clotMat = DK.mat('pulp', { color: 0x7a3c37, cap: 0x7a3c37, roughness: 0.35, clearcoat: 0.6 });
const clots = voidMeshes.map(m => { const c = new THREE.Mesh(m.geometry, clotMat); c.visible = false; quad.add(c); return c; });

// the bur's kerf through the neck of 38 (tooth frame), grown from the distal side by `cut`
const KF = { x0: -s38.md / 2 - 1.0, x1: s38.md / 2 + 0.8, y0: -0.35, y1: 0.55 };
const kerfGeo = new THREE.BoxGeometry(KF.x1 - KF.x0, KF.y1 - KF.y0, s38.blC + 2, 6, 1, 2); kerfGeo.translate((KF.x1 - KF.x0) / 2, (KF.y0 + KF.y1) / 2, 0);
const kerf = new THREE.Mesh(kerfGeo, voidMat); kerf.position.x = KF.x0; kerf.userData.cutOnly = true; imp.group.add(kerf);

// stitches over the incision (black silk, bucco-lingual loops)
const silk = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0x23262b : 0x1d2026), toneMapped: false });
const stitches = new THREE.Group(); quad.add(stitches);
[SPLIT - 2.2, SPLIT - 6.2, SPLIT - 10.2].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.22, 8, 32, Math.PI * 2), silk); t.rotation.y = Math.PI / 2; t.position.set(x, GUM_TOP - 0.45, 0); stitches.add(t); });
stitches.visible = false;

// ---------- burs ----------
const roundBur = DK.bur({ shape: 'round', diameter: 2.2, head: 2.2, length: 26 });
const fissure = DK.bur({ shape: 'taper', diameter: 1.4, head: 9, length: 30 });
quad.add(roundBur, fissure);

// ---------- parts ----------
fig.part(quad, { name: 'Jaw', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'Mandibular body; the ramus rises just behind the third molar.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Gingiva over the ridge.' });
fig.part(t36.group, { inPlace: true, name: '36', label: false, info: 'Lower left first molar (Universal 19).' });
fig.part(t37.group, { inPlace: true, name: '37', anchor: [0, 5.5, t37.spec.bl / 2], labelOffset: [0, -70], info: 'Lower left second molar (Universal 18).' });
fig.part(crownHold, { inPlace: true, name: 'Crown', anchor: [0, s38.crownL * 0.6, 0.6], labelOffset: [40, -80], dim: false, info: 'Only the crown of the wisdom tooth is taken out. It is cut off at the neck and lifted away from the roots.' });
const rootPart = fig.part(rootHold, { inPlace: true, name: 'Roots', sub: 'touching the nerve canal', accent: true, anchor: [0, -4.5, 0.6], labelOffset: [70, -40], dim: false, info: 'The roots are left in the bone with their pulp, so they are never pulled across the nerve. Bone grows over them as the socket heals.' });
fig.part(flapG, { inPlace: true, name: 'Gum flap', anchor: [0, 0, 0.3], labelOffset: [-40, -70], dim: false, info: 'An incision along the crest behind 37 lets the gum and the lining of the bone be lifted as one flap.' });
fig.part(kerf, { inPlace: true, name: 'Cut', sub: 'at the neck', anchor: [KF.x1 - 1.6, 0.1, 0.4], labelOffset: [-110, 60], dim: false, info: 'A bur cuts the crown off at the neck of the tooth, at the level of the bone.' });
fig.part(canal, { inPlace: true, name: 'Nerve canal', sub: 'inferior alveolar', anchor: [6, CANAL_Y - 1.3, 0.4], labelOffset: [30, 60], info: 'Carries the nerve to the lower teeth, lip and chin. Pulling roots that lie on it can bruise or tear the nerve.' });
fig.part(voidMeshes[0], { inPlace: true, name: 'Trimmed', sub: 'about 3 mm below the bone', anchor: () => [XC, CREST - TRIM / 2, 0.3], labelOffset: [-120, -60], dim: false, when: () => trimShown, info: 'The top of the roots is ground down with a round bur to about 3 mm under the bone edge, so bone can heal over it.' });
fig.part(stitches, { inPlace: true, name: 'Stitches', anchor: [SPLIT - 6.2, GUM_TOP + 2.6, 0], labelOffset: [40, -60], dim: false, info: 'The flap is laid back and stitched over the blood clot that fills the space above the roots.' });

// ---------- params ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
let trimShown = false;
fig.param('flap', 0, a => { flap.rotation.x = a * 2.6; });
fig.param('cut', 0, k => { kerf.visible = k > 0.01; kerf.scale.x = Math.max(0.01, k); });
fig.param('fb', -1, k => {   // fissure bur along the neck of 38, from the distal side
  fissure.visible = k >= 0; if (k < 0) return;
  const front = KF.x0 + (KF.x1 - KF.x0) * DK.util.clamp(k, 0, 1) - 0.4 - (k < 0.02 ? 6 : 0);
  fissure.position.copy(v3(front, 0.1, 1.0).applyMatrix4(toQuad)); fissure.rotation.z = 1.2;
});
fig.param('crownOut', 0, d => { crownHold.visible = d < 20; crownHold.position.set(-0.4 * d, 0.9 * d, 0); crownHold.rotation.z = Math.min(d, 6) * 0.04; });
const TOP0 = KF.y0, TOP1 = CREST - TRIM - PIV_Y;     // root top before and after trimming (tooth frame)
fig.param('trim', 0, k => {
  const top = TOP0 + (TOP1 - TOP0) * DK.util.clamp(k, 0, 1);
  clampRoots(top); trimShown = k > 0.6;
  voids.forEach(s => setSlab(s, top + PIV_Y, CREST - 0.05)); rims.forEach(s => setSlab(s, top + PIV_Y - 0.22, CREST - 0.05));
  voidMeshes.concat(rimMeshes).forEach(m => { m.visible = k > 0.02; });
});
fig.param('rb', -1, k => {   // round bur grinding the root top down, sweeping across the root
  roundBur.visible = k >= 0; if (k < 0) return;
  const kk = DK.util.clamp(k, 0, 1), top = TOP0 + (TOP1 - TOP0) * kk;
  roundBur.position.copy(v3(-1.6 + 3.2 * (0.5 + 0.5 * Math.sin(kk * 11)), top + 1.0, 1.4).applyMatrix4(toQuad)); roundBur.rotation.z = -0.25;
});
fig.param('clot', 0, k => { clots.forEach(c => { c.visible = k > 0.5; }); if (k > 0.5) kerf.visible = false; flapG.visible = k < 0.5; flapFlat.visible = k > 0.5; });
fig.param('stitch', 0, k => { stitches.visible = k > 0.5; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  ...rimMeshes.map(m => ({ objects: [m], color: DK.RIM, kind: 'plain' })),
  ...voidMeshes.map(m => ({ objects: [m], color: DK.holeCap(fig), kind: 'plain' })),
  ...clots.map(c => ({ objects: [c], color: 0x7a3c37, kind: 'plain' })),
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [flapG, flapFlat], color: DK.COLORS.gingivaCap },
  { objects: [t36.layers.enamel, t37.layers.enamel, crownPc.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t36.layers.root, t36.layers.dentin, t37.layers.root, t37.layers.dentin, crownPc.layers.root, crownPc.layers.dentin, ...rootMeshes], color: DK.COLORS.dentinCap },
  { objects: [t36.layers.pulp, t37.layers.pulp, crownPc.layers.pulp, ...canalMeshes], color: DK.COLORS.pulpCap },
  { objects: [kerf], color: DK.holeCap(fig), kind: 'plain' }
]);
silk.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

let shownSub = '';
fig.onFrame(() => {
  const sub = trimShown ? 'left in place' : 'touching the nerve canal';
  if (sub !== shownSub) { shownSub = sub; rootPart.sub = sub; rootPart.el.innerHTML = rootPart.name + '<small>' + sub + '</small>'; }
});

const W = v => new THREE.Vector3(v[0], v[1], v[2]).applyMatrix4(quad.matrixWorld);
const C38 = W([XC, PIV_Y - 2, 0]);
const F = (dy) => [C38.x, C38.y + (dy || 0), 0];
const APEX = W([XC, CANAL_Y + 1, 0]);
fig.procedure([
  { label: 'Roots on the nerve', caption: 'The roots of the wisdom tooth lie on the nerve canal. Pulling them out could injure the nerve.', beats: [
    { fov: 32, dur: 0, hold: 1.0, theta: 0.55, phi: 1.2, zoom: 1.05, section: false, labels: ['37', 'Crown'] },
    { fov: 26, dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.4, hold: 1.0, theta: 0, phi: 1.45, zoom: 0.9, focus: F(-1), offset: 0, labels: ['Roots', 'Nerve canal'] },
    { dur: 2.0, hold: 1.8, zoom: 0.72, focus: [APEX.x, (APEX.y + C38.y) / 2, 0], labels: ['Roots', 'Nerve canal'], key: true }] },
  { label: 'Gum flap', caption: 'An incision behind 37 and the gum is lifted as a flap.', beats: [
    { dur: 1.8, hold: 0.1, zoom: 0.75, focus: F(5), theta: 0.55, phi: 0.95, offset: 7, labels: ['Gum flap'] },
    { dur: 0, hold: 0, section: false },
    { dur: 1.8, hold: 1.4, set: { flap: 1 }, labels: ['Gum flap', 'Crown'], key: true }] },
  { label: 'Cut the crown', caption: 'A bur cuts the crown off at the neck of the tooth.', beats: [
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 1.8, hold: 0.1, theta: 0.05, phi: 1.45, zoom: 0.66, focus: F(2), offset: 0, set: { fb: 0 }, labels: [] },
    { dur: 2.6, hold: 1.0, set: { fb: 1, cut: 1 }, labels: ['Cut', 'Crown'], key: true },
    { dur: 0.8, hold: 0.1, set: { fb: -1 }, labels: ['Cut'] }] },
  { label: 'Crown out', caption: 'Only the crown is lifted out. The roots do not move.', beats: [
    { dur: 2.0, hold: 0.8, zoom: 0.8, focus: F(5), set: { crownOut: 12 }, labels: ['Crown', 'Roots'], key: true },
    { dur: 0.6, hold: 0, set: { crownOut: 30 }, labels: ['Roots'] }] },
  { label: 'Trim the roots', caption: 'The root tops are ground down to about 3 mm below the bone.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.62, focus: F(0), set: { rb: 0 }, labels: [] },
    { dur: 2.6, hold: 0.6, set: { rb: 1, trim: 1 }, labels: ['Trimmed'], key: true },
    { dur: 0.8, hold: 0.1, set: { rb: -1 }, labels: ['Trimmed'] }] },
  { label: 'Roots stay', caption: 'The flap is stitched back. The roots stay, the nerve is untouched, and bone heals over them.', beats: [
    { dur: 1.2, hold: 0.2, set: { clot: 1 }, labels: [] },
    { dur: 1.6, hold: 0.2, set: { flap: 0 }, labels: [] },
    { dur: 1.8, hold: 2.4, theta: 0.12, phi: 1.4, zoom: 0.82, focus: F(-3), set: { stitch: 1 }, labels: ['Roots', 'Nerve canal', 'Stitches'], key: true }] }
]);
fig.start();
