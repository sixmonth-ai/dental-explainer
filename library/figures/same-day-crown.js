// Procedure: a same-day (chairside CAD/CAM) ceramic crown on the mandibular left first molar (FDI 36 = Universal 19), between 35 and 37.
// poster: step 4
// Straight segment, crowns up. Frame: +x = mesial (35 side), +z = buccal, CEJ at y = 0. Five steps: the tooth is prepared (DK.prepMorph,
// typical glass-ceramic reductions, dental-facts.md §14), an intraoral scanner passes over it and a digital model builds up behind it (accent
// overlays revealed by a moving clip plane), the crown is designed on that model (accent ghost), milled from a ceramic block in the office (the
// block is cut away along its length by two burs, the crown left on a sprue), and seated. The milling station is drawn above the tooth,
// schematic; the scanner head is a generic shape. Sizes in mm.
const PREP = { occlusal: 1.8, axial: 1.2, margin: 1.0 };   // glass-ceramic (lithium disilicate), typical: rounded shoulder about 1 mm (§14)
const s35 = DK.toothPreset(35), s36 = DK.toothPreset(36), s37 = DK.toothPreset(37);
const X35 = s36.md / 2 + s35.md / 2, X37 = -(s36.md / 2 + s37.md / 2);
const STATION = [0, 36, 0];   // where the block is milled (schematic, above the tooth)
const fig = DK.figure({
  fov: 30,
  title: 'Same-day crown',
  subtitle: 'FDI 36 (Universal 19), lower left first molar. Glass-ceramic, milled in the office.',
  view: { theta: 0.55, phi: 1.15, margin: 0.85 }
});
const { lerp, clamp, smooth } = DK.util;

// --- context
const W = X35 - X37 + 12, MIDX = (X35 + X37) / 2;
const bone = DK.bone({ width: W, height: 14, depth: 12.5, cortical: 1.2, crest: 1.6 }); bone.position.set(MIDX, -1.8, 0);
const gum = DK.gingiva({ width: W, height: 3.2, depth: 13.2, crest: 1.3, around: [
  { x: X35 - MIDX, z: 0, md: s35.mdC, bl: s35.blC }, { x: -MIDX, z: 0, md: s36.mdC, bl: s36.blC }, { x: X37 - MIDX, z: 0, md: s37.mdC, bl: s37.blC }] });
gum.position.set(MIDX, 1.2, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the teeth.' });
const t35 = DK.tooth(s35), t37 = DK.tooth(s37);
t35.group.position.x = X35; t37.group.position.x = X37;
fig.part(t35.group, { name: '35', label: false, fit: false, info: 'Lower left second premolar.' });
fig.part(t37.group, { name: '37', label: false, fit: false, info: 'Lower left second molar.' });

// --- the tooth: intact until the first cut, then the morphing prep
const intact = DK.tooth(s36), s = intact.spec;
const tooth = DK.tooth(s, { omit: ['enamel', 'dentin'] }), prep = DK.prepMorph(s, PREP); tooth.group.add(prep);
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
const TOP = s.crownL;
fig.part(intact.group, { name: 'Molar 36', anchor: [0.6, TOP - 1.4, s.bl / 2 - 0.4], info: 'Lower left first molar, before treatment.' });
fig.part(tooth.group, { name: 'Molar', label: false, info: 'Lower left first molar being prepared.' });
fig.part(prep, { inPlace: true, name: 'Prepared tooth', sub: 'about 1.2 to 1.8 mm removed', anchor: [0.6, TOP - PREP.occlusal - 1.6, s.blC / 2 - PREP.axial + 0.05], dim: false,
  info: 'An even layer is removed so the ceramic is thick enough, ending in a rounded shoulder at the gum line.' });

// --- scan: the digital model builds up behind the scanner head (accent copies of the scanned surfaces, clipped at the head)
const scanPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -50);
const scanMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, clippingPlanes: [scanPlane] });
const wireMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, wireframe: true, depthWrite: false, toneMapped: false, clippingPlanes: [scanPlane] });
const overlay = (geo, parent) => { [scanMat, wireMat].forEach(m => { const o = new THREE.Mesh(geo, m); o.scale.setScalar(1.004); o.renderOrder = 3; parent.add(o); }); };
overlay(prep.geometry, tooth.group); overlay(t35.layers.enamel.geometry, t35.group); overlay(t37.layers.enamel.geometry, t37.group);
const digital = new THREE.Object3D(); digital.position.set(-1, TOP - 1.2, s.bl / 2 - 1); fig.world.add(digital);
fig.part(digital, { inPlace: true, name: 'Digital model', sub: '3D scan', anchor: [0, 0, 0], accent: true, dim: false, when: () => scanMat.opacity > 0.05,
  info: 'The scanner records the prepared tooth, its neighbours and the bite as a 3D model on the screen. No impression tray, no putty.' });

// scanner head (generic): a rounded head with a window facing the teeth, the body rising toward the front of the mouth
const plastic = DK.mat('steel', { color: 0xe7e4dd, metalness: 0.0, roughness: 0.45 });
const roundedBox = (lx, ly, lz, r) => { const sh = new THREE.Shape(), a = lx / 2 - r, b = lz / 2 - r;
  sh.moveTo(-a, -lz / 2); sh.lineTo(a, -lz / 2); sh.absarc(a, -b, r, -Math.PI / 2, 0); sh.lineTo(lx / 2, b); sh.absarc(a, b, r, 0, Math.PI / 2); sh.lineTo(-a, lz / 2); sh.absarc(-a, b, r, Math.PI / 2, Math.PI); sh.lineTo(-lx / 2, -b); sh.absarc(-a, -b, r, Math.PI, 1.5 * Math.PI);
  const g = new THREE.ExtrudeGeometry(sh, { depth: ly - 2 * r * 0.6, bevelEnabled: true, bevelThickness: r * 0.6, bevelSize: r * 0.6, bevelSegments: 4, curveSegments: 10 });
  g.rotateX(-Math.PI / 2); g.translate(0, -ly / 2 + r * 0.6, 0); g.computeVertexNormals(); return g; };
const wand = new THREE.Group();
const head = new THREE.Mesh(roundedBox(19, 9, 14, 3), plastic); head.position.y = 4.5; wand.add(head);
const body = new THREE.Mesh(roundedBox(62, 11, 16, 4.5), plastic); body.position.set(38, 9.5, 0); body.rotation.z = 0.2; wand.add(body);
const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), new THREE.MeshBasicMaterial({ color: DK.color(0x2c3134), toneMapped: false, side: THREE.DoubleSide }));
win.rotation.x = Math.PI / 2; win.position.set(-1, -0.05, 0); wand.add(win);
wand.scale.setScalar(0.68); plastic.transparent = true; plastic.opacity = 0.9;
fig.world.add(wand); wand.visible = false;
fig.part(wand, { inPlace: true, name: 'Scanner', sub: 'intraoral camera', anchor: [2, 9, 7], dim: false, when: () => wand.visible,
  info: 'An intraoral scanner: a small camera that takes thousands of images as it passes over the teeth and stitches them into a 3D model.' });

// --- design: the crown drawn on the digital model
const designMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
const design = new THREE.Mesh(DK.restorationCrown(s, 'ceramic', Object.assign({ hollow: false }, PREP)).geometry, designMat);
const designW = new THREE.Mesh(design.geometry, new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, wireframe: true, depthWrite: false, toneMapped: false }));
tooth.group.add(design); tooth.group.add(designW); design.visible = designW.visible = false;
fig.part(design, { inPlace: true, name: 'Crown design', sub: 'on screen', anchor: [0.8, TOP - 0.6, s.bl / 2 - 0.5], accent: true, dim: false, when: () => design.visible && designMat.opacity > 0.1,
  info: 'Software proposes the crown shape from the scan: it fits the margin, touches the neighbours and meets the opposite teeth. The dentist adjusts it.' });

// --- mill: a ceramic block on a metal holder, cut away along its length by two burs; the crown stays on a short sprue
const BX = 16, BY = 12, BZ = 14;   // block, about the size of a chairside crown block
const station = new THREE.Group(); station.position.set(...STATION); fig.world.add(station);
const blockMat = DK.mat('ceramic', { color: 0xe4ddcf, roughness: 0.55 });
const block = new THREE.Mesh(new THREE.BoxGeometry(1, BY, BZ), blockMat); station.add(block);
const holder = DK.lathe([[0, 0], [3, 0], [3, 3], [2.2, 3.4], [2.2, 9], [0, 9]], 40, DK.mat('steel')); holder.rotation.z = Math.PI / 2; holder.position.x = -BX / 2 + 0.2; station.add(holder);
const sprue = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2.6, 20), blockMat); sprue.rotation.z = Math.PI / 2; sprue.position.set(-s.md / 2 - 0.9, 0, 0); station.add(sprue);
const burA = DK.bur({ shape: 'taper', diameter: 1.4, length: 16 }), burB = DK.bur({ shape: 'taper', diameter: 1.0, length: 16 });
burA.rotation.x = Math.PI / 2 + 0.0; burB.rotation.x = -Math.PI / 2;   // tips toward the block from buccal and lingual
station.add(burA, burB);
const CROWN_Y = -s.crownL / 2;      // crown centred in the block
const crown = DK.restorationCrown(s, 'ceramic', PREP); fig.world.add(crown);
fig.part(station, { inPlace: true, name: 'Ceramic block', sub: 'milled in minutes', anchor: [-3.5, BY / 2, BZ / 2], dim: false, when: () => station.visible,
  info: 'A factory-made block of glass-ceramic (often lithium disilicate) clamped in a milling unit in the practice. Diamond burs carve the designed crown out of it; some materials are then fired to full strength.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'ceramic', anchor: () => [0.6, TOP - 1.4, s.bl / 2 - 0.5], dim: false, when: () => crown.visible,
  info: 'The milled crown, polished or glazed and bonded on the same day: no temporary crown and no second visit.' });

// --- params
const cut = { inc: 0, ax: 0 };
const reshape = () => { const on = cut.inc > 0.001 || cut.ax > 0.001; intact.group.visible = !on; tooth.group.visible = true; prep.visible = on; prep.set(cut.inc, cut.ax); };
fig.param('inc', 0, v => { cut.inc = v; reshape(); });
fig.param('ax', 0, v => { cut.ax = v; reshape(); });
const ghost = new THREE.Mesh(DK.crownGeometry(s), ghostMat); tooth.group.add(ghost);
fig.part(ghost, { inPlace: true, name: 'Removed', anchor: [0, TOP - 0.3, s.bl / 2 - 1], dim: false, when: () => ghost.visible, info: 'Outline of the original crown: the space the new crown fills.' });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.2 * k; ghost.visible = k > 0.01; });
const b = { burX: 0, burY: 40, burZ: 0, burTilt: 0 };
const bur = DK.bur({ shape: 'taper', diameter: 1.4 }); fig.world.add(bur);
fig.part(bur, { inPlace: true, name: 'Diamond bur', anchor: [0, 10, 0], dim: false, when: () => bur.visible, info: 'Tapered round-end diamond with water spray: it shapes the walls and the rounded shoulder.' });
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; bur.visible = b.burY < 30; bur.position.set(b.burX, b.burY, b.burZ); bur.rotation.x = b.burTilt; }));
const X0 = X37 - s37.md / 2 + 2, X1 = X35 + s35.md / 2 - 2;
fig.param('scan', 0, u => { const x = lerp(X0, X1, u); wand.position.set(x, TOP + 3.4, 0); wand.visible = u > 0.001 && u < 0.999; scanPlane.constant = u < 0.999 ? x - 4 : 50; });
fig.param('digital', 0, k => { scanMat.opacity = 0.2 * k; wireMat.opacity = 0.1 * k; });
fig.param('design', 0, k => { designMat.opacity = 0.42 * k; designW.material.opacity = 0; design.visible = designW.visible = k > 0.01; });
const mill = { k: 0, show: 0 }, cr = { k: 0, seat: 0 };
const millUpdate = () => {
  const k = mill.k, xr = lerp(BX / 2, -s.md / 2 - 2.0, k), xl = -BX / 2;   // the block remains from its holder end (xl) to the cutting front (xr)
  station.visible = mill.show > 0.01; block.visible = xr - xl > 0.05;
  block.scale.x = Math.max(0.01, xr - xl); block.position.x = (xr + xl) / 2;
  blockMat.transparent = mill.show < 1; blockMat.opacity = mill.show;
  const run = k > 0.001 && k < 0.999; burA.visible = burB.visible = run;
  const wob = Math.sin(k * 60) * 3;
  burA.position.set(xr, wob, BZ / 2 - 1.2); burB.position.set(xr, -wob, -BZ / 2 + 1.2);
  sprue.visible = mill.show > 0.01 && k > 0.6 && cr.k < 0.02;
};
fig.param('mill', 0, k => { mill.k = k; millUpdate(); crown.visible = k > 0.02 && (mill.show > 0.01 || cr.k > 0.01); });
fig.param('block', 0, k => { mill.show = k; millUpdate(); });
const crownUpdate = () => {   // crown: 0 = in the block at the station, 1 = 12 mm above the prep; seat lowers it onto the prep
  const from = [STATION[0], STATION[1] + CROWN_Y, STATION[2]], t = smooth(0, 1, cr.k), arc = Math.sin(Math.PI * t) * 4;
  crown.position.set(lerp(from[0], 0, t), lerp(from[1], 12, t) + arc - 12 * cr.seat, lerp(from[2], 0, t));
  crown.visible = mill.k > 0.02 && (mill.show > 0.01 || cr.k > 0.01);
  millUpdate();
};
fig.param('crown', 0, k => { cr.k = k; crownUpdate(); });
fig.param('seat', 0, k => { cr.seat = k; crownUpdate(); });
crownUpdate();

fig.onFrame(() => { crown.visible = mill.k > 0.02 && (mill.show > 0.01 || cr.k > 0.01); });
fig.standardControls({ explode: false, section: false });

// --- procedure: camera on the buccal three-quarter for the prep, above for the scan, up to the station for the mill, back down to seat
const park = { burY: 40 };
const FOC = [0, 4, 0], FST = [STATION[0], STATION[1] - 1, STATION[2]];
fig.procedure([
  { label: 'Prepare', caption: 'The molar is shaped down about 1.5 to 2 mm, ending in a rounded shoulder.', beats: [
    { fov: 30, dur: 0, hold: 0.8, theta: 0.55, phi: 1.15, zoom: 1, focus: 'auto', labels: ['Molar 36'] },
    { dur: 1.2, hold: 0.1, zoom: 0.8, focus: FOC, set: { burX: 5, burY: TOP + 0.4, burZ: 1.5, burTilt: -1.1 }, labels: ['Diamond bur'] },
    { dur: 1.8, hold: 0.1, set: { inc: 1, ghost: 1, burX: -5, burY: TOP - PREP.occlusal + 0.1 } },
    { dur: 0.6, hold: 0, set: { burX: -5, burY: 0.6, burZ: s.blC / 2 - PREP.axial + 1.4, burTilt: 0.1 } },
    { dur: 1.6, hold: 0.1, set: { ax: 1, burX: 5, burZ: s.blC / 2 - PREP.axial + 0.7 } },
    { dur: 0.7, hold: 1.4, set: park, labels: ['Prepared tooth', 'Removed'], key: true }] },
  { label: 'Scan', caption: 'An intraoral scanner records the prepared tooth and its neighbours in 3D.', beats: [
    { dur: 1.4, hold: 0.2, theta: 0.7, phi: 1.2, zoom: 1.3, focus: [MIDX, 6, 0], set: { ghost: 0 }, labels: [] },
    { dur: 0, hold: 0, set: { scan: 0.001, digital: 1 } },
    { dur: 3.0, hold: 0.2, set: { scan: 0.62 }, labels: ['Scanner', 'Digital model'], key: true },
    { dur: 1.4, hold: 0.2, set: { scan: 1 } },
    { dur: 0.6, hold: 1.0, labels: ['Digital model'] }] },
  { label: 'Design', caption: 'The crown is designed on the screen to fit the margin, the neighbours and the bite.', beats: [
    { dur: 1.6, hold: 0.2, theta: 0.8, phi: 1.05, zoom: 0.95, focus: FOC, labels: [] },
    { dur: 1.6, hold: 1.8, set: { design: 1, digital: 0.6 }, labels: ['Crown design', 'Digital model'], key: true }] },
  { label: 'Mill', caption: 'A milling unit in the office carves the crown from a ceramic block.', beats: [
    { dur: 2.0, hold: 0.2, theta: 0.6, phi: 1.25, zoom: 1.05, focus: FST, set: { design: 0, digital: 0, block: 1 }, labels: ['Ceramic block'] },
    { dur: 3.2, hold: 0.2, set: { mill: 0.62 }, labels: ['Ceramic block'], key: true },
    { dur: 1.6, hold: 1.2, set: { mill: 1 }, labels: ['Ceramic block', 'Crown'] }] },
  { label: 'Fit', caption: 'The crown is tried in, polished or glazed, and bonded the same day.', beats: [
    { dur: 0.6, hold: 0, set: { block: 0 } },
    { dur: 2.4, hold: 0.2, zoom: 0.95, focus: [0, 8, 0], theta: 0.5, phi: 1.15, set: { crown: 1 }, labels: ['Crown'] },
    { dur: 1.6, hold: 0.2, set: { seat: 1 } },
    { dur: 1.8, hold: 2.2, zoom: 0.85, focus: FOC, theta: 0.6, phi: 1.2, labels: ['Crown'], key: true }] }
]);
fig.start();
