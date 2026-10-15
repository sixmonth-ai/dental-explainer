// Procedure: crestal (osteotome) sinus lift at the missing upper right first molar (FDI 16 = Universal 3), in the jaw (crest down, sinus above),
// poster: step 3
// seen in a bucco-palatal cut. The posterior maxilla is a traced coronal outline (ridge, lateral sinus wall, medial wall, palate) swept into a
// 6 mm CBCT-style slab cropped across the sinus. Steps: about 6 mm of bone under the sinus, a drill that stops about 1 mm short of the floor,
// an osteotome that taps the floor (and the membrane on it) up, graft pushed in through the same hole, then the implant.
// Frame: +x = mesial, +z = buccal, crest at y = 0, mm.
const L = 3;                                   // half-thickness of the slab (mesio-distal): a CBCT-style coronal slice
const FLOOR = 6;                               // residual bone height under the sinus at the site (crest to floor): about 6 mm
const TAP = 2;                                 // floor raised by the osteotome taps
const LIFT = 4;                                // final elevation at the centre after the graft: about 10 mm of height
const W = 3.2;                                 // the tent falls off over about W mm from the centre
const HOLE = 1.5;                              // osteotomy radius (Ø3 mm: drill and osteotome size are system-specific)
const SHORT = 1;                               // the drill stops about 1 mm short of the floor
const IMPLANT = { diameter: 4.1, length: 9, lead: 1.6 };
const MEMB = 0.6;                              // sinus membrane thickness as drawn (normal is under 1 mm)

const fig = DK.figure({
  fov: 30,
  title: 'Crestal sinus lift',
  subtitle: 'Missing upper right first molar, FDI 16 (Universal 3). In the jaw.',
  view: { theta: 0.62, phi: 1.36 }
});
const { smooth, lerp } = DK.util;

// ---------- outlines in the cut plane, (z, y): buccal +z, up +y ----------
const curve = (pts, n) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal'); return c.getSpacedPoints(n).map(v => [v.x, v.y]); };
const TOP = 23.5;   // cropped well above the frame
const SIN = curve([[13.7, TOP], [12.1, 19.5], [11.3, 17.5], [8.3, 13.5], [5.8, 10.2], [4.5, 8.0], [3.0, 6.6], [1.2, FLOOR], [-1.2, FLOOR], [-3.0, 6.7], [-4.5, 8.4], [-5.6, 11], [-7.2, 15.5], [-8.3, 19.5], [-9.0, TOP]], 100);
const LINING_PTS = [[-7.2, 15.5], [-5.6, 11], [-4.5, 8.4], [-3.0, 6.7], [-1.2, FLOOR], [1.2, FLOOR], [3.0, 6.6], [4.5, 8.0], [5.8, 10.2], [8.3, 13.5]];
const OUT = curve([[0, 0], [2.4, 0.2], [4.2, 1.3], [5.3, 3.4], [6.2, 6.5], [7.6, 10], [10, 14], [12.9, 18.5], [13.5, 19.5], [15.1, TOP]], 60)
  .concat(SIN, curve([[-10.4, TOP], [-9.7, 19.5], [-9.4, 17.5], [-8.6, 15.5], [-8.0, 13.9]], 12), curve([[-11, 13.6], [-12, 13.5]], 3),
    curve([[-12, 10.2], [-11.5, 10.1], [-8.6, 9.2], [-6.4, 7.2], [-5.2, 4.2], [-4.2, 1.6], [-2.5, 0.3]], 30));

// ---------- a swept solid: an outline (a function of x) carried along x, closed with end caps ----------
const area = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function sweep(x0, x1, rows, outline) {
  const pos = [], idx = [], first = outline(x0), n = first.length, flip = area(first) < 0;
  const ring = x => { const P = outline(x); return flip ? P.slice().reverse() : P; };
  for (let i = 0; i <= rows; i++) { const x = lerp(x0, x1, i / rows); ring(x).forEach(p => pos.push(x, p[1], p[0])); }
  for (let i = 0; i < rows; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = (i + 1) * n + j, c = (i + 1) * n + (j + 1) % n, d = i * n + (j + 1) % n; idx.push(a, b, d, b, c, d); }
  [[x0, -1], [x1, 1]].forEach(([x, sgn]) => {   // caps, own vertices so the edge stays crisp
    const P = ring(x), base = pos.length / 3; P.forEach(p => pos.push(x, p[1], p[0]));
    THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []).forEach(t => {
      const [a, b, c] = t, A = P[a], B = P[b], C = P[c], nx = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      (nx * sgn > 0) ? idx.push(base + a, base + b, base + c) : idx.push(base + a, base + c, base + b);
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const offsetPath = (P, t) => P.map((p, i) => {
  const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1, k = typeof t === 'function' ? t(i) : t;
  return [p[0] - dy / l * k, p[1] + dz / l * k];
});
const refresh = (mesh, g) => { const p = mesh.geometry.attributes.position; p.array.set(g.attributes.position.array); p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere(); g.dispose(); };

// ---------- bone: cortical shell (the outline) and a cancellous core in the ridge ----------
const boneMesh = new THREE.Mesh(sweep(-L, L, 1, () => OUT), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
const CORE = curve([[-3.4, 1.4], [-1.5, 0.95], [1.5, 0.95], [3.4, 1.4], [4.3, 2.8], [4.5, 4.4], [3.3, 5.4], [1, FLOOR - 1.0], [-1, FLOOR - 1.0], [-3.2, 5.6], [-4.4, 4.8], [-4.0, 2.8]], 40);
const core = new THREE.Mesh(sweep(-L + 0.6, L - 0.6, 1, () => CORE), DK.mat('bone', { color: DK.COLORS.cancellous })); core.material.visible = false;
const jaw = new THREE.Group(); jaw.add(boneMesh, core);
const gumPath = curve([[5.6, 4.6], [5.0, 2.6], [4.2, 1.3], [2.4, 0.2], [0, 0], [-2.5, 0.3], [-4.2, 1.6], [-5.2, 4.2], [-6.4, 7.2], [-8.6, 9.2], [-11.5, 10.1], [-11.9, 10.15]], 50);
const gumOuter = offsetPath(gumPath, i => { const u = i / (gumPath.length - 1); return 0.9 + 1.1 * Math.exp(-Math.pow((u - 0.33) / 0.2, 2)) + (u > 0.6 ? 0.8 * smooth(0.6, 0.8, u) : 0); });
const gum = new THREE.Mesh(sweep(-L, L, 1, () => gumOuter.concat(gumPath.slice().reverse().map(p => [p[0], p[1] + 0.02]))), DK.mat('mucosa'));

// ---------- the sinus membrane: a lining over the floor and lower walls; L mm of lift tents it up over the site ----------
const lining = curve(LINING_PTS, 70);
const st = { lift: 0, fill: 0 };
const domeY = z => FLOOR + st.lift * Math.exp(-Math.pow(Math.max(0, Math.abs(z) - HOLE) / (W - HOLE), 2));   // flat over the plug, tenting down either side
const membraneOutline = () => {
  const base = offsetPath(lining, 0.03), top = offsetPath(lining, MEMB + 0.03);
  const up = (p, q) => [q[0], q[1] + Math.max(0, domeY(p[0]) - p[1])];
  return base.map(p => up(p, p)).concat(top.map((q, i) => up(base[i], q)).reverse());
};
const membrane = new THREE.Mesh(sweep(-L + 0.1, L - 0.1, 2, membraneOutline), DK.mat('mucosa', { color: 0xd9a9a0, cap: 0xc98f86 }));

// ---------- the floor plug: the last ~1 mm of bone above the drill, tapped up in one piece ----------
const plug = new THREE.Mesh(new THREE.CylinderGeometry(HOLE - 0.05, HOLE - 0.05, SHORT, 40), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
plug.position.y = FLOOR - SHORT / 2;
const plugVoid = new THREE.Mesh(new THREE.CylinderGeometry(HOLE, HOLE, SHORT + 0.1, 40), DK.mat('cavity', { color: DK.voidColor(fig), cap: 0x6f645c }));
plugVoid.position.y = FLOOR - SHORT / 2 + 0.05; plugVoid.userData.cutOnly = true; plugVoid.visible = false;

// ---------- graft under the lifted membrane ----------
const floorY = z => { let y = null; for (let i = 0; i < SIN.length - 1; i++) { const a = SIN[i], b = SIN[i + 1]; if ((a[0] - z) * (b[0] - z) <= 0 && a[1] < 11 && b[1] < 11 && a[0] !== b[0]) { const v = lerp(a[1], b[1], (z - a[0]) / (b[0] - a[0])); y = y === null ? v : Math.min(y, v); } } return y; };
const GZ = Array.from({ length: 30 }, (_, i) => lerp(-3.6, 3.6, i / 29));
const graftOutline = () => {
  const bottom = GZ.map(z => [z, floorY(z) + 0.02]);
  const top = GZ.map((z, i) => [z, Math.max(bottom[i][1] + 0.03, FLOOR + (domeY(z) - FLOOR) * st.fill - 0.04)]).reverse();
  return bottom.concat(top);
};
const granules = (() => {   // particulate graft: pale irregular granules in clot
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.fillStyle = '#b8a688'; c.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) { const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), sh = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { c.beginPath(); for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); c.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = `rgb(${sh},${sh - 6},${sh - 20})`; c.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 5; return t;
})();
const graft = new THREE.Mesh(sweep(-L + 0.1, L - 0.1, 2, graftOutline), DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 }));

// ---------- the bed, the tools and the implant (all point up into the jaw) ----------
const GUM_BOTTOM = -2.6;                                       // the bed starts below the gum so the cut shows it through the gum too
const bed = DK.osteotomy(); bed.rotation.x = Math.PI; bed.position.y = GUM_BOTTOM;
const drill = DK.drill({ diameter: 2 * HOLE, length: 14, shank: 6, bands: [6, 8, 10] }); drill.rotation.x = Math.PI;
function osteotome() {   // straight osteotome: concave cupped tip at the origin, depth bands, shaft down to a knurled handle
  const grp = new THREE.Group(), steel = DK.mat('steel', { cap: 0x9ea4aa }), dark = DK.mat('titaniumDark');
  grp.add(DK.lathe([[0, -44], [3.2, -44], [3.4, -42], [3.4, -22], [2.6, -19], [1.2, -16], [HOLE - 0.02, -13], [HOLE - 0.02, -0.15], [HOLE - 0.1, 0], [1.15, -0.25], [0.6, -0.42], [0, -0.48]], 48, steel));
  [6, 8, 10].forEach(b => { const ring = new THREE.Mesh(new THREE.CylinderGeometry(HOLE + 0.01, HOLE + 0.01, 0.25, 40, 1, true), dark); ring.position.y = -b; grp.add(ring); });
  return grp;
}
const ost = osteotome();
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); implant.rotation.x = Math.PI;
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
const ghost = new THREE.Mesh(DK.lathe([[0, -IMPLANT.length], [1.0, -IMPLANT.length], [IMPLANT.diameter / 2, -IMPLANT.length + 1.4], [IMPLANT.diameter / 2, 0], [0, 0]], 40), ghostMat);
ghost.rotation.x = Math.PI; ghost.renderOrder = 998;
[membrane, graft, plug, plugVoid, bed, drill, ost, implant, ghost].forEach(o => fig.world.add(o));

// ---------- parts ----------
const onCut = (sec, dz) => (sec.enabled ? sec.offset : 0) + (dz || 0.1);
const frameBox = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 18, 20), new THREE.MeshBasicMaterial({ visible: false })); frameBox.position.set(0, 6.5, 0);
fig.part(frameBox, { name: 'frame', label: false });
fig.part(jaw, { name: 'Upper jaw', label: false, fit: false, info: 'Back of the upper jaw where 16 was: the ridge, the side wall of the sinus and the palate. Cropped across the sinus.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the ridge. The lift is done through the implant site itself, so no side window is needed.' });
fig.part(boneMesh, { inPlace: true, name: 'Sinus', sub: 'air space', anchor: (e, sec) => [onCut(sec), 14, 1.5], dim: false, info: 'The maxillary sinus: an air space above the upper back teeth. After a tooth is lost it often expands down into the ridge.' });
fig.part(core, { inPlace: true, name: 'Bone left', sub: `about ${FLOOR} mm`, anchor: (e, sec) => [onCut(sec), 2.4, 3.2], dim: false, info: `About ${FLOOR} mm of bone under the sinus: enough to hold an implant firmly, not enough for its full length.` });
fig.part(ghost, { inPlace: true, name: 'Implant needs', sub: `about ${IMPLANT.length} mm`, anchor: [-IMPLANT.diameter / 2, -7.2, 0], accent: true, dim: false, info: `An implant of about ${IMPLANT.length} mm would end in the sinus.` });
fig.part(drill, { inPlace: true, name: 'Drill', sub: `stops about ${SHORT} mm short`, anchor: [HOLE, -12.5, 0], info: 'The implant bed is drilled to just below the sinus floor, leaving a thin layer of bone between drill and membrane.' });
fig.part(ost, { inPlace: true, name: 'Osteotome', sub: 'tapped with a mallet', anchor: [HOLE, -6.5, 0], accent: true, info: 'A blunt instrument with a cupped tip. Light mallet taps break the thin floor and push it, with the membrane on it, up into the sinus.' });
fig.part(plug, { inPlace: true, name: 'Sinus floor', anchor: [0.1, 0, -0.9], dim: false, info: 'The last thin layer of bone over the bed. It is pushed up in one piece, so the membrane is never touched by a sharp drill.' });
fig.part(membrane, { inPlace: true, name: 'Sinus membrane', anchor: (e, sec) => [onCut(sec), domeY(-1.6) + MEMB / 2 + 0.05, -1.6], dim: false, info: 'The thin lining of the sinus (Schneiderian membrane). It is lifted a few millimetres like a tent; a tear has to be managed.' });
fig.part(graft, { inPlace: true, name: 'Bone graft', anchor: (e, sec) => [onCut(sec), FLOOR + 1.0, 2.2], dim: false, info: 'Graft granules are pushed up through the same hole with the osteotome, lifting the membrane further. New bone grows through them.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `about ${FLOOR + LIFT} mm of height now`, anchor: [IMPLANT.diameter / 2 + 0.1, -4.5, 0], accent: true, info: `Placed through the same hole, usually at the same visit when the remaining bone holds it firmly. About ${FLOOR + LIFT} mm of height under the lifted membrane.` });

// ---------- params ----------
fig.param('drill', -20, d => { drill.visible = d > -15; drill.position.y = d - 14; });                 // d = tip height above the crest
fig.param('bed', GUM_BOTTOM, d => bed.set(HOLE, Math.max(0, d - GUM_BOTTOM)));                                             // d = top of the bed
fig.param('ost', -30, d => { ost.visible = d > -25; ost.position.y = d; });                           // d = tip height
fig.param('lift', 0, v => { st.lift = v; refresh(membrane, sweep(-L + 0.1, L - 0.1, 2, membraneOutline)); plug.position.y = FLOOR - SHORT / 2 + v; plugVoid.visible = v > 0.05; plug.visible = true; });
fig.param('fill', 0, g => { st.fill = g; graft.visible = g > 0.01; refresh(graft, sweep(-L + 0.1, L - 0.1, 2, graftOutline)); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.5 * k; ghost.visible = k > 0.01; });
fig.param('implant', 0, k => { const travel = (1 - k) * (IMPLANT.length + 4); implant.visible = k > 0.001; implant.position.y = -travel; implant.rotation.y = travel / IMPLANT.lead * Math.PI * 2; });
graft.visible = false;

// ---------- section: bucco-palatal through the site (mesial half removed, camera on the mesial-buccal side) ----------
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.mucosaCap },
  { objects: [boneMesh], color: DK.COLORS.corticalCap },
  { objects: [core], color: 0xffffff, texture: DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture },
  { objects: [bed, plugVoid], color: 0x6f645c, kind: 'plain' },
  { objects: [graft], color: 0xfaf3e4, texture: granules },
  { objects: [membrane], color: 0xc98f86, kind: 'gingiva' },
  { objects: [plug], color: DK.COLORS.corticalCap }
]);
ghostMat.clippingPlanes = [];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-2.5, 2.5], offset: 0 } });

// ---------- procedure ----------
const CUTV = { theta: Math.PI / 2 - 0.1, phi: 1.5 };
const ZK = fig.mode === 'image' ? 1 : 1.25, FY = fig.mode === 'image' ? 6.2 : 4.2;   // the interactive stage has the step bar over its foot
const HERO = { theta: CUTV.theta, phi: CUTV.phi, zoom: 0.62 * ZK, focus: [0, FY, 0.5] };
const tap = (lift, key) => [   // one mallet tap: the osteotome jumps up, the floor and the membrane go with it
  { dur: 0.35, hold: 0.45, ease: 'out', set: { ost: FLOOR - SHORT + lift, lift }, labels: ['Osteotome', 'Sinus floor', 'Sinus membrane'] },
  Object.assign({ dur: 0.3, hold: key ? 1.8 : 0.2, set: { ost: FLOOR - SHORT + lift - 0.08 }, labels: ['Osteotome', 'Sinus floor', 'Sinus membrane'] }, key ? { key: true } : {})];
fig.procedure([
  { label: 'Too little bone', caption: 'About 6 mm of bone under the sinus: too short for the implant.', beats: [
    { fov: 30, dur: 0, hold: 1.2, theta: 1.0, phi: 1.36, zoom: 1.05, section: true, offset: 0, labels: ['Sinus'] },
    { fov: 26, dur: 2.2, hold: 1.0, theta: CUTV.theta, phi: CUTV.phi, zoom: 0.5 * ZK, focus: [0, FY - 3, 0], labels: ['Bone left'] },
    Object.assign({ dur: 2.0, hold: 2.0, set: { ghost: 1 }, labels: ['Sinus', 'Bone left', 'Implant needs'], key: true }, HERO)] },
  { label: 'Drill short of floor', caption: 'The bed is drilled to about 1 mm below the sinus floor.', beats: [
    Object.assign({ dur: 1.4, hold: 0.1, set: { ghost: 0, drill: -2 }, labels: ['Drill'] }, HERO),
    { dur: 2.6, hold: 0.4, set: { drill: FLOOR - SHORT, bed: FLOOR - SHORT }, labels: ['Drill'], key: true },
    { dur: 1.2, hold: 0.6, set: { drill: -20 }, labels: ['Sinus floor'] }] },
  { label: 'Tap the floor up', caption: 'An osteotome and light mallet taps push the floor and the membrane up.', beats: [
    { dur: 1.4, hold: 0.2, zoom: fig.mode === 'image' ? 0.6 : 0.52, focus: [0, fig.mode === 'image' ? 5.0 : FY + 0.8, 0.3], set: { ost: FLOOR - SHORT - 0.2 }, labels: ['Osteotome', 'Sinus floor'] },
    ...tap(0.7), ...tap(1.4), ...tap(TAP, true),
    { dur: 1.0, hold: 0.3, set: { ost: -30 }, labels: ['Sinus membrane'] }] },
  { label: 'Graft', caption: 'Graft granules pushed in through the hole lift the membrane further.', beats: [
    Object.assign({ dur: 1.2, hold: 0.1, labels: [] }, HERO),
    { dur: 2.8, hold: 0.3, set: { fill: 1, lift: LIFT }, labels: ['Bone graft', 'Sinus membrane'] },
    { dur: 1.0, hold: 1.6, labels: ['Bone graft', 'Sinus membrane'], key: true }] },
  { label: 'Implant', caption: 'The implant goes in through the same hole.', beats: [
    { dur: 2.8, hold: 0.3, set: { implant: 1 }, labels: ['Implant'] },
    Object.assign({ dur: 1.8, hold: 2.6, labels: ['Implant', 'Bone graft', 'Sinus membrane'], key: true }, HERO)] }
]);
fig.start();
