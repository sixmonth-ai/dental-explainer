// Procedure: lateral-window sinus lift at the missing upper right first molar (FDI 16 = Universal 3), in the jaw (crest down, sinus above),
// poster: step 5
// seen in a bucco-palatal cut. The posterior maxilla is built from a traced coronal outline (alveolar ridge, thin lateral sinus wall, medial
// wall, palate) swept into a 6 mm CBCT-style slab cropped across the sinus; the sinus is the air space inside it. Steps: too little bone for an implant, a side window in the
// lateral wall, the sinus membrane lifted, graft packed under it, the implant in the new bone. Frame: +x = mesial, +z = buccal, crest at y = 0, mm.
const L = 3;                                   // half-thickness of the slab (mesio-distal): a CBCT-style coronal slice
const FLOOR = 3.9;                             // residual bone height under the sinus at the site (crest to floor)
const LIFT = 8;                                // membrane elevation at the centre: new height ~12 mm
const IMPLANT = { diameter: 4.8, length: 10, lead: 1.6 };
const WIN = { x: L + 0.2, y0: 5.8, y1: 11 };       // the window: ±x half-width, bottom and top heights (on the lateral wall)
const MEMB = 0.7;                              // sinus membrane thickness (drawn about 1 mm; normal is under 1 mm)

const fig = DK.figure({
  fov: 30,
  title: 'Sinus lift',
  subtitle: 'Missing upper right first molar, FDI 16 (Universal 3). In the jaw.',
  view: { theta: 0.62, phi: 1.36 }
});
const { smooth, lerp } = DK.util;

// ---------- outlines in the cut plane, (z, y): buccal +z, up +y ----------
const curve = (pts, n) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal'); return c.getSpacedPoints(n).map(v => [v.x, v.y]); };
// bone, one outline counter-clockwise from the crest: buccal alveolar wall and the thin lateral sinus wall up to a flat crop, back down the
// inside of the sinus (lateral wall, floor over the ridge, medial wall), up the lateral nasal wall, the nasal floor and palate (cut flat), the palatal ridge
const TOP = 23.5;   // cropped well above the frame: the walls run off the top of every shot
const SIN = curve([[13.7, TOP], [12.1, 19.5], [11.3, 17.5], [8.3, 13], [5.6, 8.8], [4.4, 5.6], [3.0, 4.3], [1.0, FLOOR], [-1.0, FLOOR], [-3.0, 4.6], [-4.4, 6.6], [-5.6, 10.5], [-7.2, 15.5], [-8.3, 19.5], [-9.0, TOP]], 90);
const LINING_PTS = [[-7.2, 15.5], [-5.6, 10.5], [-4.4, 6.6], [-3.0, 4.6], [-1.0, FLOOR], [1.0, FLOOR], [3.0, 4.3], [4.4, 5.6], [5.6, 8.8], [8.3, 13]];
const OUT = curve([[0, 0], [2.4, 0.2], [4.2, 1.3], [5.3, 3.4], [6.2, 6.5], [7.6, 10], [10, 14], [12.9, 18.5], [13.5, 19.5], [15.1, TOP]], 60)
  .concat(SIN, curve([[-10.4, TOP], [-9.7, 19.5], [-9.4, 17.5], [-8.6, 15.5], [-8.0, 13.9]], 12), curve([[-11, 13.6], [-12, 13.5]], 3),
    curve([[-12, 10.2], [-11.5, 10.1], [-8.6, 9.2], [-6.4, 7.2], [-5.2, 4.2], [-4.2, 1.6], [-2.5, 0.3]], 30));
const at = (pts, y, side) => {                 // z on a wall outline at height y (side: +1 buccal, -1 medial)
  let best = null; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1] && Math.sign(a[0] + b[0]) === side) { const z = lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); if (best === null || side * z > side * best) best = z; } }
  return best;
};
const zOut = y => at(OUT, y, 1), zIn = y => at(SIN.filter(p => p[1] < 16), y, 1);

// ---------- a swept solid: an outline (a function of x) carried along x, closed with end caps ----------
const area = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function sweep(x0, x1, rows, outline, hole) {   // hole: an optional constant inner outline (a tunnel along x)
  const pos = [], idx = [], first = outline(x0), n = first.length, flip = area(first) < 0;
  const ring = x => { const P = outline(x); return flip ? P.slice().reverse() : P; };
  const H = hole ? (area(hole) > 0 ? hole.slice().reverse() : hole) : null;   // holes run clockwise
  const band = (rowFn, m) => { const b0 = pos.length / 3;
    for (let i = 0; i <= rows; i++) { const x = lerp(x0, x1, i / rows); rowFn(x).forEach(p => pos.push(x, p[1], p[0])); }
    for (let i = 0; i < rows; i++) for (let j = 0; j < m; j++) { const a = b0 + i * m + j, b = b0 + (i + 1) * m + j, c = b0 + (i + 1) * m + (j + 1) % m, d = b0 + i * m + (j + 1) % m; idx.push(a, b, d, b, c, d); } };
  band(ring, n); if (H) band(() => H, H.length);
  [[x0, -1], [x1, 1]].forEach(([x, sgn]) => {   // caps, own vertices so the edge stays crisp
    const P = H ? ring(x).concat(H) : ring(x), base = pos.length / 3; P.forEach(p => pos.push(x, p[1], p[0]));
    const v2 = Q => Q.map(p => new THREE.Vector2(p[0], p[1]));
    THREE.ShapeUtils.triangulateShape(v2(ring(x)), H ? [v2(H)] : []).forEach(t => {
      const [a, b, c] = t, A = P[a], B = P[b], C = P[c], nx = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      (nx * sgn > 0) ? idx.push(base + a, base + b, base + c) : idx.push(base + a, base + c, base + b);
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const offsetPath = (P, t) => P.map((p, i) => {   // offset a path to its left (walking direction), by t(i) mm
  const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1, k = typeof t === 'function' ? t(i) : t;
  return [p[0] - dy / l * k, p[1] + dz / l * k];
});

// ---------- bone: cortical shell (the outline) and a cancellous core in the ridge ----------
const boneMesh = new THREE.Mesh(sweep(-L, L, 1, () => OUT), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
const CORE = curve([[-3.4, 1.4], [-1.5, 0.95], [1.5, 0.95], [3.4, 1.4], [4.4, 2.6], [4.2, 3.4], [3.0, 3.2], [1, FLOOR - 1.0], [-1, FLOOR - 1.0], [-3.0, 3.3], [-4.5, 3.8], [-4.6, 2.6]], 40);
const core = new THREE.Mesh(sweep(-L + 0.6, L - 0.6, 1, () => CORE), DK.mat('bone', { color: DK.COLORS.cancellous })); core.material.visible = false;
const jaw = new THREE.Group(); jaw.add(boneMesh, core);
// gum over the ridge: from the buccal fold (flap reflected above it) round the crest onto the palate
const gumPath = curve([[5.6, 4.6], [5.0, 2.6], [4.2, 1.3], [2.4, 0.2], [0, 0], [-2.5, 0.3], [-4.2, 1.6], [-5.2, 4.2], [-6.4, 7.2], [-8.6, 9.2], [-11.5, 10.1], [-11.9, 10.15]], 50);
const gumOuter = offsetPath(gumPath, i => { const u = i / (gumPath.length - 1); return 0.9 + 1.1 * Math.exp(-Math.pow((u - 0.33) / 0.2, 2)) + (u > 0.6 ? 0.8 * smooth(0.6, 0.8, u) : 0); });
const gum = new THREE.Mesh(sweep(-L, L, 1, () => gumOuter.concat(gumPath.slice().reverse().map(p => [p[0], p[1] + 0.02]))), DK.mat('mucosa'));

// ---------- the sinus membrane: a lining over the floor and lower walls; lifting raises it into a dome ----------
const lining = curve(LINING_PTS, 60);
const domeY = (z, x) => FLOOR + LIFT * (1 - 0.32 * Math.pow(z / 5, 2)) * 1;
const lift = { k: 0 };
const membraneOutline = x => {
  const base = offsetPath(lining, 0.03), top = offsetPath(lining, MEMB + 0.03);
  const up = (p, q) => { const d = (Math.max(p[1], domeY(p[0], x)) - p[1]) * lift.k; return [q[0], q[1] + d]; };
  return base.map((p, i) => up(p, p)).concat(top.map((q, i) => up(base[i], q)).reverse());
};
// offsetPath walks the lining from medial to lateral, so a positive offset moves into the sinus (upward over the floor)
const membraneMat = DK.mat('mucosa', { color: 0xd9a9a0, cap: 0xc98f86 });
const membrane = new THREE.Mesh(sweep(-L + 0.1, L - 0.1, 4, membraneOutline), membraneMat);
const rebuildMembrane = () => { const g = sweep(-L + 0.1, L - 0.1, 4, membraneOutline); membrane.geometry.attributes.position.array.set(g.attributes.position.array); membrane.geometry.attributes.position.needsUpdate = true; membrane.geometry.computeVertexNormals(); membrane.geometry.computeBoundingSphere(); g.dispose(); };

// ---------- graft under the lifted membrane (fill fraction animates) ----------
const fill = { g: 0 };
const floorY = z => { let y = null; for (let i = 0; i < SIN.length - 1; i++) { const a = SIN[i], b = SIN[i + 1]; if ((a[0] - z) * (b[0] - z) <= 0 && a[1] < 9.6 && b[1] < 9.6 && a[0] !== b[0]) { const v = lerp(a[1], b[1], (z - a[0]) / (b[0] - a[0])); y = y === null ? v : Math.min(y, v); } } return y; };
const GZ = Array.from({ length: 34 }, (_, i) => lerp(-4.35, 4.55, i / 33));
const graftOutline = x => {
  const bottom = GZ.map(z => [z, floorY(z) + 0.02]);
  const top = GZ.map((z, i) => [z, Math.max(bottom[i][1] + 0.03, FLOOR + (domeY(z, x) - FLOOR) * fill.g - 0.04)]).reverse();
  return bottom.concat(top);
};
const granules = (() => {   // particulate graft: pale irregular granules in clot
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.fillStyle = '#b8a688'; c.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) { const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), sh = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { c.beginPath(); for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); c.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = `rgb(${sh},${sh - 6},${sh - 20})`; c.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 7; return t;
})();
const graft = new THREE.Mesh(sweep(-L + 0.1, L - 0.1, 4, graftOutline), DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 }));
const rebuildGraft = () => { graft.visible = fill.g > 0.01; const g = sweep(-L + 0.1, L - 0.1, 4, graftOutline); graft.geometry.attributes.position.array.set(g.attributes.position.array); graft.geometry.attributes.position.needsUpdate = true; graft.geometry.computeVertexNormals(); graft.geometry.computeBoundingSphere(); g.dispose(); };

// ---------- the window in the lateral wall: a void through the wall (cut face) and a dark opening on the outer surface ----------
const wallBand = (y0, y1, grow) => { const ys = Array.from({ length: 16 }, (_, i) => lerp(y0, y1, i / 15)); return ys.map(y => [zOut(y) + grow, y]).concat(ys.slice().reverse().map(y => [zIn(y) - 0.1, y])); };
const holeMat = () => DK.mat('cavity', { color: DK.voidColor(fig), cap: DK.holeCap(fig) });
const windowVoid = new THREE.Mesh(sweep(-WIN.x, WIN.x, 1, () => wallBand(WIN.y0, WIN.y1, 0.05)), holeMat()); windowVoid.userData.cutOnly = true;
const windowFace = new THREE.Mesh(sweep(-WIN.x, WIN.x, 1, () => wallBand(WIN.y0, WIN.y1, 0.06)), new THREE.MeshStandardMaterial({ color: DK.color(fig.dark ? 0x1a1917 : 0x6f665c), roughness: 0.9 }));

// ---------- tools and implant ----------
const bur = DK.bur({ shape: 'round', diameter: 2.3 }); bur.rotation.x = Math.PI / 2;   // shank toward the cheek (+z)
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); implant.rotation.x = Math.PI;   // apex up, into the jaw
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
const ghost = new THREE.Mesh(DK.lathe([[0, -IMPLANT.length], [1.0, -IMPLANT.length], [IMPLANT.diameter / 2, -IMPLANT.length + 1.4], [IMPLANT.diameter / 2, 0], [0, 0]], 40), ghostMat);
ghost.rotation.x = Math.PI; ghost.renderOrder = 998;
[membrane, graft, windowVoid, windowFace, bur, implant, ghost].forEach(o => fig.world.add(o));

// ---------- parts ----------
const onCut = (sec, dz) => (sec.enabled ? sec.offset : 0) + (dz || 0.1);
const frameBox = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 22.5, 26), new THREE.MeshBasicMaterial({ visible: false })); frameBox.position.set(0, 8.6, 0.75);   // what the camera frames: ridge, floor, walls
fig.part(frameBox, { name: 'frame', label: false });
fig.part(jaw, { name: 'Upper jaw', label: false, fit: false, info: 'Back of the upper jaw: the ridge where 16 was, the thin side wall of the sinus and the palate. Cropped across the sinus.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the ridge. For the side window it is lifted as a flap (not shown) and closed again at the end.' });
fig.part(boneMesh, { inPlace: true, name: 'Sinus', sub: 'air space', anchor: (e, sec) => [onCut(sec), 13.5, 1.5], dim: false, info: 'The maxillary sinus: an air space above the upper back teeth. After a tooth is lost it often expands down into the ridge.' });
fig.part(core, { inPlace: true, name: 'Bone left', sub: `about ${FLOOR.toFixed(0)} mm`, anchor: (e, sec) => [onCut(sec), 1.9, 2.6], dim: false, info: `Only about ${FLOOR.toFixed(0)} mm of bone between the gum side and the sinus floor: too little to hold a standard implant.` });
fig.part(ghost, { inPlace: true, name: 'Implant needs', sub: `about ${IMPLANT.length} mm`, anchor: [-IMPLANT.diameter / 2, -7.5, 0], accent: true, dim: false, info: 'A standard implant here is about 8 to 10 mm long: it would end in the sinus.' });
fig.part(windowFace, { inPlace: true, name: 'Side window', anchor: [WIN.x - 1, (WIN.y0 + WIN.y1) / 2 + 1, zOut((WIN.y0 + WIN.y1) / 2 + 1) + 0.1], dim: false, info: 'A small window is opened in the thin side wall of the sinus, with a round bur or a piezo tip, without tearing the membrane behind it.' });
fig.part(membrane, { inPlace: true, name: 'Sinus membrane', anchor: (e, sec) => [onCut(sec), FLOOR + LIFT * lift.k + MEMB / 2 + 0.05, -1.6], dim: false, info: 'The thin lining of the sinus (Schneiderian membrane). It is peeled gently off the floor and lifted like a tent; a tear has to be repaired. It lines the whole sinus; only its lower part is drawn.' });
fig.part(graft, { inPlace: true, name: 'Bone graft', anchor: (e, sec) => [onCut(sec), FLOOR + 2.4, 1.6], dim: false, info: 'Graft granules fill the space under the lifted membrane. Over the following months new bone grows through them.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `about ${(FLOOR + LIFT).toFixed(0)} mm of bone now`, anchor: [IMPLANT.diameter / 2 + 0.1, -6.5, 0], accent: true, info: `With about ${(FLOOR + LIFT).toFixed(0)} mm of bone height an implant of normal length fits. It goes in at the same visit if the remaining bone holds it firmly, otherwise after the graft heals (often 6 to 9 months).` });
fig.part(bur, { inPlace: true, name: 'Round bur', anchor: [0, 6, 0], info: 'A round diamond (or a piezo tip) thins the wall until the bluish membrane shows through.' });

// ---------- params ----------
const P = { burT: -1, win: 0 };
const burAt = t => { const y = lerp(WIN.y0 + 0.6, WIN.y1 - 0.6, 0.5 - 0.5 * Math.cos(t * Math.PI * 3)); return [0.6, y, zOut(y) + 0.25]; };   // up and down the window, at the cut
fig.param('burT', -1, t => { bur.visible = t >= 0; if (t >= 0) { const [x, y, z] = burAt(Math.min(t, 1)); bur.position.set(x, y, z); } });
fig.param('win', 0, k => { windowVoid.visible = windowFace.visible = k > 0.5; });
fig.param('lift', 0, k => { lift.k = k; rebuildMembrane(); });
fig.param('fill', 0, g => { fill.g = g; rebuildGraft(); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.5 * k; ghost.visible = k > 0.01; });
fig.param('implant', 0, k => { const travel = (1 - k) * (IMPLANT.length + 4); implant.visible = k > 0.001; implant.position.y = -travel; implant.rotation.y = travel / IMPLANT.lead * Math.PI * 2; });

// ---------- section: bucco-palatal through the site (mesial half removed, camera on the mesial-buccal side) ----------
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.mucosaCap },
  { objects: [boneMesh], color: DK.COLORS.corticalCap },
  { objects: [core], color: 0xffffff, texture: DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture },
  { objects: [windowVoid], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [graft], color: 0xfaf3e4, texture: granules },
  { objects: [membrane], color: 0xc98f86, kind: 'gingiva' }
]);
windowFace.material.clippingPlanes = [fig.section.plane];
ghostMat.clippingPlanes = [];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-2.5, 2.5], offset: 0 } });

// ---------- procedure ----------
const CUTV = { theta: Math.PI / 2 - 0.1, phi: 1.5 };
const ZK = fig.mode === 'image' ? 1 : 1.3;   // the interactive stage is shorter than a storyboard panel: pull back a little there
const HERO = { theta: CUTV.theta, phi: CUTV.phi, zoom: 0.68 * ZK, focus: [0, 7.2, 0.75] };   // the ridge, floor, window and lift fill the frame; the walls run off the top
fig.procedure([
  { label: 'Too little bone', caption: 'The sinus has dropped toward the ridge: about 4 mm of bone is left.', beats: [
    { fov: 30, dur: 0, hold: 1.2, theta: 1.0, phi: 1.36, zoom: 1.05, section: true, offset: 0, labels: ['Sinus'] },
    { fov: 26, dur: 2.2, hold: 1.2, theta: CUTV.theta, phi: CUTV.phi, zoom: 0.5 * ZK, focus: [0, 3, 0], labels: ['Bone left'] },
    Object.assign({ dur: 2.0, hold: 2.0, set: { ghost: 1 }, labels: ['Sinus', 'Bone left', 'Implant needs'], key: true }, HERO)] },
  { label: 'Side window', caption: 'Through a gum flap, a small window is opened in the side wall of the sinus.', beats: [
    { dur: 1.6, hold: 0.1, zoom: 0.48 * ZK, focus: [0, 8.5, 5], set: { ghost: 0, burT: 0 }, labels: ['Round bur'] },
    { dur: 3.0, hold: 0.1, set: { burT: 1 }, labels: ['Round bur'] },
    Object.assign({ dur: 1.6, hold: 1.6, set: { burT: -1, win: 1 }, labels: ['Side window'], key: true }, HERO)] },
  { label: 'Lift membrane', caption: 'The membrane is peeled off the sinus floor and lifted like a tent.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.58 * ZK, focus: [0, 7, 0], labels: ['Sinus membrane'] },
    { dur: 2.6, hold: 0.4, set: { lift: 1 }, labels: ['Sinus membrane'] },
    Object.assign({ dur: 1.4, hold: 1.6, labels: ['Sinus membrane', 'Side window'], key: true }, HERO)] },
  { label: 'Graft', caption: 'Bone graft granules fill the new space under the membrane.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.58 * ZK, focus: [0, 7, 0], labels: [] },
    { dur: 2.6, hold: 0.3, set: { fill: 1 }, labels: ['Bone graft'] },
    Object.assign({ dur: 1.4, hold: 1.6, labels: ['Bone graft', 'Sinus membrane'], key: true }, HERO)] },
  { label: 'Implant', caption: 'An implant of normal length now fits, at once or after the graft heals.', beats: [
    { dur: 1.2, hold: 0.1, set: { win: 0 }, zoom: 0.6 * ZK, focus: [0, 6, 0], labels: [] },
    { dur: 2.8, hold: 0.3, set: { implant: 1 }, labels: ['Implant'] },
    Object.assign({ dur: 1.8, hold: 2.6, labels: ['Implant', 'Bone graft', 'Sinus membrane'], key: true }, HERO)] }
]);
fig.start();
