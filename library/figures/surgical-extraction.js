// Procedure: surgical removal of an impacted, mesioangular lower left third molar (FDI 38 = Universal 17) in a mesio-distal cut of the jaw: gum flap, bone removed around the crown, the crown cut off at its neck, crown then roots lifted out, flap stitched back over the clot. Frame: the quadrant group is mirrored (left side), neighbour 37 at the origin with its CEJ at y = 0, +x mesial in the tooth frame, camera on the buccal side.
// poster: step 4
const CREST = -1.8, GUM_TOP = 1.1, GUM_H = 3.4, CANAL_Y = -17.5, CANAL_R = 1.4;
const ANGLE = 45;                                    // Winter: mesioangular

const fig = DK.figure({
  fov: 26,
  title: 'Surgical wisdom tooth removal',
  subtitle: 'Impacted lower left third molar, FDI 38 (Universal 17), mesio-distal cut.',
  view: { theta: 0, phi: 1.45, margin: window.DK_MODE === 'image' ? 0.78 : 0.92 }
});

// ---------- jaw: bone, nerve canal, gum (with the flap over 38 as its own piece), 36 and 37 ----------
const quad = new THREE.Group(); quad.scale.x = -1;
const t37 = DK.tooth(37), t36 = DK.tooth(36);
t36.group.position.x = t37.spec.md / 2 + t36.spec.md / 2;
const bone = DK.bone({ width: 46, height: 24, depth: 11.5, cortical: 1.2, crest: 1.6 });
bone.position.set(-4, CREST, 0);
const path = [[-26, CANAL_Y - 0.8, 0.6], [-10, CANAL_Y, 0.3], [4, CANAL_Y + 0.4, 0], [18, CANAL_Y + 1.0, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.7, DK.mat('nerve'), { caps: false });
const canal = new THREE.Group(); canal.add(lumen, nerve);
const SPLIT = -t37.spec.md / 2 - 0.15;              // incision line: along the crest, just distal to 37
const gum = DK.gingiva({ width: 19 - SPLIT, height: GUM_H, depth: 12, crest: 1.4, around: [{ x: t36.group.position.x - (19 + SPLIT) / 2, z: 0, md: t36.spec.mdC, bl: t36.spec.blC }, { x: -(19 + SPLIT) / 2, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
gum.position.set((19 + SPLIT) / 2, GUM_TOP, 0);
const FL = { x0: -27, x1: SPLIT };
const flapG = DK.gingiva({ width: FL.x1 - FL.x0, height: GUM_H, depth: 12, crest: 1.4 });
const HINGE = { y: GUM_TOP - GUM_H, z: 6 };          // the flap folds out to the cheek side about its buccal lower edge
const flap = new THREE.Group(); flap.position.set(0, HINGE.y, HINGE.z);
flapG.position.set((FL.x0 + FL.x1) / 2, GUM_TOP - HINGE.y, -HINGE.z); flap.add(flapG);

// ---------- 38: the crown and the roots as two pieces (so the cut can separate them), posed by DK.impaction ----------
const imp = DK.impaction({ fdi: 38, neighbour: 37, angle: ANGLE, depth: 'B' });
const s38 = imp.spec;
imp.group.remove(imp.tooth.group);                  // replaced by the two pieces below (same spec, same pose)
const crownSpec = Object.assign({}, s38, { trunk: 0.5, roots: s38.roots.map(r => Object.assign({}, r, { len: 0.7 })), canals: [], chamberY: 0.4 });
const crownPc = DK.tooth(crownSpec);
const rootPc = DK.tooth(s38, { omit: ['enamel', 'dentin'] });
rootPc.layers.pulp.remove(rootPc.layers.pulp.userData.chamber);
const crownHold = new THREE.Group(), rootHold = new THREE.Group();
crownHold.add(crownPc.group); rootHold.add(rootPc.group); imp.group.add(crownHold, rootHold);
quad.add(bone, canal, gum, flap, t36.group, t37.group, imp.group);
quad.updateMatrixWorld(true);

// ---------- the socket: what is empty once bone and tooth are gone (cut face only), clamped below the crest ----------
const toQuad = new THREE.Matrix4().copy(imp.group.matrix);
function clampedVoid(geo, local, top) {             // a geometry in the impaction frame → quad frame, flattened at y = top
  const g = geo.clone(); if (local) g.applyMatrix4(local); g.applyMatrix4(toQuad);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > top) p.setY(i, top);
  g.computeVertexNormals(); return g;
}
const voidMat = DK.mat('cavity');
const crownVoidGeo = clampedVoid(DK.crownGeometry(s38), null, CREST - 0.05);
crownVoidGeo.computeBoundingBox(); const CB = crownVoidGeo.boundingBox;
const crownVoid = new THREE.Mesh(crownVoidGeo, voidMat);
const rootVoids = rootPc.layers.root.children.map(m => new THREE.Mesh(clampedVoid(DK.inflateGeometry(m.geometry, 0.25), null, CREST - 0.05), voidMat));
// bone removed over and distal to the crown with a round bur (a gutter), grown downward by `bone`
const TR = { x0: CB.min.x - 2.4, x1: (CB.min.x + CB.max.x) / 2 + 0.6, y0: CB.min.y + 1.2, y1: CREST + 0.6 };
const troughGeo = new THREE.BoxGeometry(TR.x1 - TR.x0, TR.y1 - TR.y0, 9, 4, 6, 2); troughGeo.translate(0, -(TR.y1 - TR.y0) / 2, 0);
const trough = new THREE.Mesh(troughGeo, voidMat); trough.position.set((TR.x0 + TR.x1) / 2, TR.y1, 0);
// thin ink rims just outside each void, so the empty space reads against the pale bone in the light theme too
const rimMat = DK.mat('cavity');
const crownRim = new THREE.Mesh(clampedVoid(DK.inflateGeometry(DK.crownGeometry(s38), 0.22), null, CREST - 0.05), rimMat);
const rootRims = rootPc.layers.root.children.map(m => new THREE.Mesh(clampedVoid(DK.inflateGeometry(m.geometry, 0.47), null, CREST - 0.05), rimMat));
const troughRimGeo = new THREE.BoxGeometry(TR.x1 - TR.x0 + 0.44, TR.y1 - TR.y0 + 0.22, 9.2, 4, 6, 2); troughRimGeo.translate(0, -(TR.y1 - TR.y0 + 0.22) / 2, 0);
const troughRim = new THREE.Mesh(troughRimGeo, rimMat); troughRim.position.copy(trough.position);
[crownVoid, trough, ...rootVoids, crownRim, troughRim, ...rootRims].forEach(m => { m.userData.cutOnly = true; quad.add(m); });
// blood clot in the emptied socket (same outline, a step inside)
const clotMat = DK.mat('pulp', { color: 0x7a3c37, cap: 0x7a3c37, roughness: 0.35, clearcoat: 0.6 });
const clots = [crownVoid, trough, ...rootVoids].map(m => { const c = new THREE.Mesh(m.geometry, clotMat); c.position.copy(m.position); c.visible = false; quad.add(c); return c; });
// the bur's kerf through the neck of 38 (tooth frame), grown from the distal side by `cut`
const KF = { x0: -s38.mdC / 2 - 1.0, x1: s38.mdC / 2 + 0.8, y0: -0.35, y1: 0.55 };
const kerfGeo = new THREE.BoxGeometry(KF.x1 - KF.x0, KF.y1 - KF.y0, s38.blC + 2, 6, 1, 2); kerfGeo.translate((KF.x1 - KF.x0) / 2, (KF.y0 + KF.y1) / 2, 0);
const kerf = new THREE.Mesh(kerfGeo, voidMat); kerf.position.x = KF.x0; kerf.userData.cutOnly = true; imp.group.add(kerf);

// stitches over the incision, distal to 37 (black silk, bucco-lingual loops)
const silk = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0x23262b : 0x1d2026), toneMapped: false });
const stitches = new THREE.Group(); quad.add(stitches);
[SPLIT - 2.2, SPLIT - 6.2, SPLIT - 10.2].forEach(x => { const t = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.22, 8, 32, Math.PI * 2), silk); t.rotation.y = Math.PI / 2; t.position.set(x, GUM_TOP - 0.45, 0); stitches.add(t); });
stitches.visible = false;

// ---------- burs (fig.world, positioned in the quad frame through these helpers) ----------
const roundBur = DK.bur({ shape: 'round', diameter: 2.2, head: 2.2, length: 26 });
const fissure = DK.bur({ shape: 'taper', diameter: 1.4, head: 9, length: 30 });
quad.add(roundBur, fissure);

// ---------- parts ----------
fig.part(quad, { name: 'Jaw', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'Mandibular body; the ramus rises just behind the third molar.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Gingiva over the ridge.' });
fig.part(t36.group, { inPlace: true, name: '36', label: false, info: 'Lower left first molar (Universal 19).' });
fig.part(t37.group, { inPlace: true, name: '37', anchor: [0, 5.5, t37.spec.bl / 2], labelOffset: [0, -70], info: 'Lower left second molar (Universal 18). The impacted crown is wedged under its distal bulge.' });
fig.part(crownHold, { inPlace: true, name: '38', sub: 'impacted, mesioangular', anchor: [0, s38.crownL * 0.6, 0.6], labelOffset: [40, -80], accent: true, dim: false, info: 'Lower left third molar (Universal 17), tilted forward against 37. It cannot come straight out: the bulge of 37 is in the way.' });
fig.part(flapG, { inPlace: true, name: 'Gum flap', anchor: [0, 0, 0.3], labelOffset: [-40, -70], dim: false, info: 'An incision along the crest behind 37 lets the gum and the lining of the bone be lifted as one flap, so the bone underneath can be seen.' });
fig.part(trough, { inPlace: true, name: 'Bone removed', sub: 'around the crown', anchor: [0, -1.5, 0.2], labelOffset: [-70, -80], dim: false, info: 'A little bone is removed with a round bur around the crown, only as much as is needed to free it.' });
fig.part(kerf, { inPlace: true, name: 'Cut', sub: 'crown off at the neck', anchor: [KF.x1 - 1.2, 0.1, 0.4], labelOffset: [-90, 70], dim: false, info: 'The bur cuts the crown off at its neck. In pieces the tooth can be lifted out along paths the jaw allows, without levering on 37 or the bone.' });
fig.part(rootHold, { inPlace: true, name: 'Roots', anchor: [0, -6, 0.6], labelOffset: [60, 60], dim: false, info: 'The fused roots, lifted out on their own once the crown is gone.' });
fig.part(canal, { inPlace: true, name: 'Nerve canal', sub: 'inferior alveolar', anchor: [-12, CANAL_Y - 1, 0.4], labelOffset: [-10, 70], info: 'Carries the nerve to the lower teeth, lip and chin. Taking the tooth out in pieces avoids pressing the roots toward it.' });
fig.part(stitches, { inPlace: true, name: 'Stitches', anchor: [SPLIT - 6.2, GUM_TOP + 2.6, 0], labelOffset: [40, -60], dim: false, info: 'The flap is laid back and stitched; the socket under it fills with a blood clot that turns into bone over the following months.' });
fig.part(clots[0], { inPlace: true, name: 'Blood clot', anchor: [(CB.min.x + CB.max.x) / 2, (CB.min.y + CREST) / 2 - 1, 0.2], labelOffset: [-60, 80], dim: false, info: 'The clot fills the socket and protects the bone while it heals.' });

// ---------- params ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
fig.param('flap', 0, a => { flap.rotation.x = a * 2.6; });                       // 0 = in place, 1 = folded out over the cheek side
fig.param('bone', 0, k => { trough.visible = troughRim.visible = k > 0.01; trough.scale.y = troughRim.scale.y = Math.max(0.01, k); });
// round bur: works down the distal and occlusal side of the crown as the gutter deepens
fig.param('rb', -1, k => {
  roundBur.visible = k >= 0; if (k < 0) return;
  const kk = DK.util.clamp(k, 0, 1), y = TR.y1 - 0.4 - (TR.y1 - TR.y0 - 1.2) * kk, x = TR.x0 + 1.1 + 1.2 * Math.sin(kk * 9);
  roundBur.position.set(x, y, 1.2); roundBur.rotation.z = 0.35;
});
fig.param('rbOut', 0, d => { roundBur.position.y += d; });
// fissure bur along the neck of 38, entering from the distal-occlusal side in the plane of the cut
fig.param('cut', 0, k => { kerf.visible = k > 0.01; kerf.scale.x = Math.max(0.01, k); });
fig.param('fb', -1, k => {
  fissure.visible = k >= 0; if (k < 0) return;
  const front = KF.x0 + (KF.x1 - KF.x0) * DK.util.clamp(k, 0, 1) - 0.4 - (k < 0.02 ? 6 : 0);
  const p = v3(front, 0.1, 1.0).applyMatrix4(imp.group.matrix);
  fissure.position.copy(p); fissure.rotation.z = ANGLE * Math.PI / 180;   // shank along the tooth's distal (−x) axis
});
fig.param('crownOut', 0, d => { crownHold.visible = d < 20; crownHold.position.set(-0.75 * d, 0.6 * d, 0); crownHold.rotation.z = Math.min(d, 6) * 0.05; });
fig.param('rootOut', 0, d => {   // the roots rotate up into the space the crown left, then out
  rootHold.visible = d < 20; const r = Math.min(d, 6) / 6, o = Math.max(0, d - 6);
  rootHold.position.set(-0.75 * o, 4.0 * r + 0.6 * o, 0); rootHold.rotation.z = 0.12 * r;
});
fig.param('clot', 0, k => { clots.forEach(c => { c.visible = k > 0.5; }); if (k > 0.5) kerf.visible = false; });
fig.param('stitch', 0, k => { stitches.visible = k > 0.5; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  ...rootRims.map(m => ({ objects: [m], color: DK.RIM, kind: 'plain' })),
  { objects: [troughRim], color: DK.RIM, kind: 'plain' },
  { objects: [crownRim], color: DK.RIM, kind: 'plain' },
  ...rootVoids.map(m => ({ objects: [m], color: DK.holeCap(fig), kind: 'plain' })),   // (this order: the root voids first, or the crown and gutter caps drop out)
  { objects: [trough], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [crownVoid], color: DK.holeCap(fig), kind: 'plain' },
  ...clots.map(c => ({ objects: [c], color: 0x7a3c37, kind: 'plain' })),
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [flapG], color: DK.COLORS.gingivaCap },
  { objects: [t36.layers.enamel, t37.layers.enamel, crownPc.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t36.layers.root, t36.layers.dentin, t37.layers.root, t37.layers.dentin, crownPc.layers.root, crownPc.layers.dentin, rootPc.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t36.layers.pulp, t37.layers.pulp, crownPc.layers.pulp, rootPc.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [kerf], color: DK.holeCap(fig), kind: 'plain' }
]);
silk.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

const C38 = new THREE.Vector3((CB.min.x + CB.max.x) / 2, (CB.min.y + CB.max.y) / 2, 0).applyMatrix4(quad.matrixWorld);
const F = (dy) => [C38.x, C38.y + (dy || 0), 0];
fig.procedure([
  { label: 'Impacted 38', caption: 'The wisdom tooth is tilted forward under the bulge of 37.', beats: [
    { fov: 32, dur: 0, hold: 1.0, theta: 0.55, phi: 1.2, zoom: 1.05, section: false, labels: ['37', '38'] },
    { fov: 26, dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.4, hold: 1.6, theta: 0, phi: 1.45, zoom: 0.82, focus: F(-3), offset: 0, labels: ['37', '38', 'Nerve canal'], key: true }] },
  { label: 'Gum flap', caption: 'An incision behind 37 and the gum is lifted as a flap.', beats: [
    { dur: 1.6, hold: 0.1, zoom: 0.75, focus: F(3), theta: 0.55, phi: 0.95, offset: 7, labels: ['Gum flap'] },
    { dur: 0, hold: 0, section: false },
    { dur: 1.8, hold: 1.4, set: { flap: 1 }, labels: ['Gum flap', '38'], key: true }] },
  { label: 'Bone', caption: 'A round bur removes a little bone around the crown.', beats: [
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 1.8, hold: 0.1, theta: 0.05, phi: 1.45, zoom: 0.66, focus: F(1), offset: 0, set: { rb: 0 }, labels: [] },
    { dur: 2.6, hold: 0.6, set: { rb: 1, bone: 1 }, labels: ['Bone removed'], key: true },
    { dur: 0.8, hold: 0.1, set: { rb: -1 }, labels: ['Bone removed'] }] },
  { label: 'Cut tooth', caption: 'The crown is cut off at the neck of the tooth.', beats: [
    { dur: 1.0, hold: 0.1, set: { fb: 0 }, labels: [] },
    { dur: 2.6, hold: 1.0, set: { fb: 1, cut: 1 }, labels: ['Cut', '38'], key: true },
    { dur: 0.8, hold: 0.1, set: { fb: -1 }, labels: ['Cut'] }] },
  { label: 'Pieces out', caption: 'The crown comes out first, then the roots, without force on 37 or the jaw.', beats: [
    { dur: 1.8, hold: 0.4, zoom: 0.8, focus: F(4), set: { crownOut: 14 }, labels: ['38'] },
    { dur: 0.4, hold: 0, set: { crownOut: 30 }, labels: [] },
    { dur: 1.6, hold: 0.6, set: { rootOut: 6 }, labels: ['Roots', 'Nerve canal'], key: true },
    { dur: 1.4, hold: 0.2, set: { rootOut: 22 }, labels: [] }] },
  { label: 'Stitches', caption: 'The flap is stitched back over the clot that fills the socket.', beats: [
    { dur: 1.2, hold: 0.2, set: { clot: 1 }, labels: ['Blood clot'] },
    { dur: 1.6, hold: 0.2, set: { flap: 0 }, labels: ['Blood clot'] },
    { dur: 1.6, hold: 2.2, theta: 0.15, phi: 1.38, zoom: 0.85, focus: F(2), set: { stitch: 1 }, labels: ['Stitches', 'Blood clot', '37'], key: true }] }
]);
fig.start();
