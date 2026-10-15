// Procedure: guided bone regeneration (ridge augmentation) at the missing upper right central incisor (FDI 11 = Universal 8), in the jaw
// poster: step 4
// (crest down), seen in a labio-palatal cut. The edentulous anterior maxilla is a traced sagittal outline (thin, labially concave ridge
// leaning toward the lip, palate behind it) swept into a 6 mm CBCT-style slab cropped flat above. Steps: a ridge too thin for an implant,
// the lip-side gum lifted as a flap, particulate graft packed on the lip side, a collagen membrane over it, the flap closed and months of
// healing, then the implant in the wider ridge. Frame: +x = mesial, +z = labial, crest at y = 0 (up = into the jaw), mm.
const L = 3;                                    // half-thickness of the slab (mesio-distal)
const TOP = 17.5;                               // flat crop above the ridge
const G = 2.3;                                  // horizontal gain on the lip side (graft thickness at mid-height)
const IMPLANT = { diameter: 3.5, length: 12, lead: 1.6 };
const AX = { z: 0.1, tilt: 0.16 };              // implant axis: crest point and lean toward the palate (follows the ridge)
const HINGE_Y = 12.5;                           // the flap stays attached above this (vestibule)
const MEMB = 0.35;                              // collagen membrane thickness as drawn

const fig = DK.figure({
  fov: 28,
  title: 'Building up a thin ridge',
  subtitle: 'Missing upper right central incisor, FDI 11 (Universal 8). In the jaw.',
  view: { theta: 0.75, phi: 1.36 }
});
const { smooth, lerp, clamp } = DK.util;

// ---------- outlines in the cut plane, (z, y): labial +z, up +y ----------
const curve = (pts, n) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal'); return c.getSpacedPoints(n).map(v => [v.x, v.y]); };
const LAB = curve([[-0.1, 0], [0.7, 0.08], [1.15, 0.5], [1.3, 2], [0.9, 4.5], [0.5, 7], [0.75, 9.5], [1.5, 12.5], [2.3, 15.5], [2.6, TOP]], 90);
const PAL = curve([[-0.1, 0], [-0.95, 0.1], [-1.7, 0.5], [-2.7, 2], [-3.5, 4.5], [-4.5, 7.5], [-5.9, 10], [-7.9, 12.5], [-10.7, 13.8], [-15, 14.4]], 70);
const OUT = LAB.concat([[-15, TOP]], PAL.slice(1).reverse());
const zAt = (P, y) => { for (let i = P.length - 1; i > 0; i--) { const a = P[i - 1], b = P[i]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return null; };
const labZ = y => zAt(LAB, y), palZ = y => zAt(PAL, y);

// ---------- a swept solid: an outline carried along x, closed with end caps ----------
const area = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function sweep(x0, x1, outline) {
  const pos = [], idx = [], P0 = outline(), flip = area(P0) < 0, P = flip ? P0.slice().reverse() : P0, n = P.length;
  [x0, x1].forEach(x => P.forEach(p => pos.push(x, p[1], p[0])));
  for (let j = 0; j < n; j++) { const a = j, b = n + j, c = n + (j + 1) % n, d = (j + 1) % n; idx.push(a, b, d, b, c, d); }
  [[x0, -1], [x1, 1]].forEach(([x, sgn]) => {
    const base = pos.length / 3; P.forEach(p => pos.push(x, p[1], p[0]));
    THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []).forEach(t => {
      const [a, b, c] = t, A = P[a], B = P[b], C = P[c], nx = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      (nx * sgn > 0) ? idx.push(base + a, base + b, base + c) : idx.push(base + a, base + c, base + b);
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const refresh = (mesh, g) => { const p = mesh.geometry.attributes.position; p.array.set(g.attributes.position.array); p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere(); g.dispose(); };
const offsetPath = (P, t) => P.map((p, i) => {   // offset to the left of the walking direction by t(i, p) mm
  const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1, k = typeof t === 'function' ? t(i, p) : t;
  return [p[0] - dy / l * k, p[1] + dz / l * k];
});

// ---------- bone: cortical outline and a cancellous core ----------
const boneMesh = new THREE.Mesh(sweep(-L, L, () => OUT), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
const ys = (a, b, n) => Array.from({ length: n }, (_, i) => lerp(a, b, i / (n - 1)));
const CORE = ys(1.8, 15.6, 30).map(y => [labZ(y) - 0.7, y]).concat([[-9.5, 15.6], [-9.5, 14.2]], ys(12.4, 1.8, 24).map(y => [palZ(y) + 0.8, y]));
const core = new THREE.Mesh(sweep(-L + 0.6, L - 0.6, () => CORE), DK.mat('bone', { color: DK.COLORS.cancellous })); core.material.visible = false;
const jaw = new THREE.Group(); jaw.add(boneMesh, core);

// ---------- the graft: the lip-side surface pushed out by gain(y) (zero at the crest midline and above the vestibule) ----------
const gain = (z, y) => G * (1 - smooth(6.5, HINGE_Y, y)) * (0.72 + 0.28 * smooth(0, 2.5, y)) * smooth(-0.1, 1.2, z);
const LABG = LAB.filter(p => p[1] <= HINGE_Y);                               // the lip side from the crest midline up to the vestibule
const pushed = (k, extra) => LABG.map(p => [p[0] + k * gain(p[0], p[1]) + (extra ? extra(p) : 0), p[1]]);
const st = { fill: 0, cover: 0, lift: 0, mk: 1 };
const graftOutline = () => { const outer = pushed(Math.max(st.fill, 0.02), p => 0.03); return LABG.map(p => [p[0] - 0.02, p[1]]).concat(outer.reverse()); };
const graftMat = DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 });
const graft = new THREE.Mesh(sweep(-L + 0.05, L - 0.05, graftOutline), graftMat);
const newBone = new THREE.Mesh(sweep(-L + 0.05, L - 0.05, () => LABG.map(p => [p[0] - 0.02, p[1]]).concat(pushed(1, () => 0.03).reverse())), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
newBone.visible = false;

// ---------- the membrane: a thin collagen sheet on the graft, a little past it on the crest ----------
const memCover = p => smooth(-0.8, 0.2, p[0]) * (1 - smooth(11.6, 12.4, p[1]));   // where the membrane lies along the lip-side path
const MPATH = curve([[-0.9, 0.12], [-0.4, 0.02]], 6).concat(LABG.filter(p => p[1] <= 12.3));
const memIn = MPATH.map(p => [p[0] + gain(p[0], p[1]) + 0.04, p[1] - (p[0] < 0 ? 0.04 : 0)]);
const memOut = offsetPath(memIn, -MEMB);
const membrane = new THREE.Mesh(sweep(-L + 0.2, L - 0.2, () => memIn.concat(memOut.slice().reverse())), DK.mat('mucosa', { color: 0xe9e1d2, cap: 0xe4dccb, roughness: 0.8, clearcoat: 0 }));
const memHolder = new THREE.Group(); memHolder.add(membrane);

// ---------- gum: the palatal side stays; the lip side is a flap hinged at the vestibule ----------
const thick = p => 1.25 - 0.35 * smooth(2, 10, p[1]);
const PALG = PAL.slice();
const palOuter = offsetPath(PALG, (i, p) => 1.3 + 1.6 * smooth(7, 14, p[1]));
const gumPal = new THREE.Mesh(sweep(-L, L, () => palOuter.concat(PALG.slice().reverse().map(p => [p[0], p[1] - 0.02]))), DK.mat('mucosa'));
// the vestibule above the hinge (fixed)
const LABU = LAB.filter(p => p[1] >= HINGE_Y - 0.6 && p[1] <= 15.8);
const gumUp = new THREE.Mesh(sweep(-L, L, () => offsetPath(LABU, -0.9).concat(LABU.slice().reverse().map(p => [p[0] + 0.02, p[1]]))), DK.mat('mucosa'));
// the flap: inner surface on the bone, or over the graft and membrane once it is closed over them
const LABF = PAL.filter(p => p[0] > -0.7 && p[0] < -0.12).reverse().concat(LAB.filter(p => p[1] <= HINGE_Y + 0.6));   // from just past the crest midline                          // the flap overlaps the fixed lining a little at the hinge
const flapIn = () => LABF.map(p => [p[0] + st.cover * (gain(p[0], p[1]) + (MEMB + 0.06) * st.mk * memCover(p)) + 0.03, p[1] - (p[0] < 0 ? 0.03 : 0)]);
const flapOutline = () => { const I = flapIn(); return I.concat(offsetPath(I, (i, p) => thick(p) * -1).reverse()); };
const flap = new THREE.Mesh(sweep(-L, L, flapOutline), DK.mat('mucosa'));
const hingeZ = labZ(HINGE_Y);
const flapPivot = new THREE.Group(); flapPivot.position.set(0, HINGE_Y, hingeZ + 0.5); flap.position.set(0, -HINGE_Y, -hingeZ - 0.5); flapPivot.add(flap);

// ---------- implant and its ghost (both point up, along the ridge) ----------
const axisHolder = () => { const h = new THREE.Group(); h.position.set(0, 0.3, AX.z); h.rotation.x = -AX.tilt; return h; };
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'conical' }); implant.rotation.x = Math.PI;
const impHolder = axisHolder(); impHolder.add(implant);
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
const R = IMPLANT.diameter / 2;
const ghost = new THREE.Mesh(DK.lathe([[0, -IMPLANT.length], [0.9, -IMPLANT.length], [R, -IMPLANT.length + 1.4], [R, 0], [0, 0]], 40), ghostMat);
ghost.rotation.x = Math.PI; ghost.renderOrder = 998;
const ghostHolder = axisHolder(); ghostHolder.add(ghost);
[graft, newBone, memHolder, flapPivot, impHolder, ghostHolder].forEach(o => fig.world.add(o));

// lip-side bone in front of the implant, a third of the way up its body (from the same constants as the geometry)
const edgeAt = y => AX.z - (y - 0.3) * Math.tan(AX.tilt) + R / Math.cos(AX.tilt);
const Y3 = 4;
const labialBefore = labZ(Y3) - edgeAt(Y3), labialAfter = labZ(Y3) + gain(5, Y3) - edgeAt(Y3);
const widthBefore = labZ(Y3) - palZ(Y3), widthAfter = widthBefore + gain(5, Y3);

// ---------- parts ----------
const onCut = (sec, dz) => (sec.enabled ? sec.offset : 0) + (dz || 0.1);
const frameBox = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 19, 16), new THREE.MeshBasicMaterial({ visible: false })); frameBox.position.set(0, 7, 0.5);
fig.part(frameBox, { name: 'frame', label: false });
fig.part(jaw, { name: 'Upper jaw', label: false, fit: false, info: 'Front of the upper jaw where 11 was lost: the ridge leans toward the lip, the palate lies behind it. Cropped above.' });
fig.part(gumPal, { name: 'Gum', label: false, fit: false, info: 'Gum on the palate side and over the crest.' });
fig.part(gumUp, { name: 'Gum', label: false, fit: false, info: 'Lining of the lip side, above the flap.' });
fig.part(boneMesh, { inPlace: true, name: 'Thin ridge', sub: `about ${widthBefore.toFixed(0)} mm wide`, anchor: (e, sec) => [onCut(sec), Y3, palZ(Y3) + 0.6], labelOffset: [90, 40], dim: false, info: 'After a front tooth is lost, the lip-side bone shrinks first. What is left can be too thin to hold an implant inside bone.' });
fig.part(ghost, { inPlace: true, name: 'Implant needs', sub: 'threads would show', anchor: [R, -5.5, 0], accent: true, dim: false, info: `An implant of about Ø${IMPLANT.diameter} mm here would sit partly outside the bone on the lip side.` });
fig.part(flap, { inPlace: true, name: 'Gum flap', anchor: (e, sec) => { const p = LABF[Math.floor(LABF.length * 0.45)]; return [onCut(sec), p[1], p[0] + 1.1]; }, dim: false, info: 'The gum on the lip side is lifted off the bone as a flap, attached higher up so it keeps its blood supply.' });
fig.part(graft, { inPlace: true, name: 'Bone graft', sub: 'granules', anchor: (e, sec) => [onCut(sec), 6, labZ(6) + gain(5, 6) * Math.max(st.fill, 0.3) * 0.6], accent: true, dim: false, info: 'Bone substitute granules (often mixed with the patient\'s own bone chips) packed against the lip side of the ridge.' });
fig.part(membrane, { inPlace: true, name: 'Membrane', sub: 'collagen', anchor: (e, sec) => [onCut(sec), 8.5, labZ(8.5) + gain(5, 8.5) + MEMB * 0.5], dim: false, info: 'A thin membrane over the graft holds the granules still and keeps the faster-growing gum tissue out, so bone fills the space. Collagen membranes resorb on their own.' });
fig.part(newBone, { inPlace: true, name: 'New bone', sub: 'months later', anchor: (e, sec) => [onCut(sec), 6.5, labZ(6.5) + gain(5, 6.5) * 0.55], dim: false, info: 'Over about 6 months new bone grows through the graft, and the ridge is wider.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `about ${labialAfter.toFixed(0)} mm of bone in front`, anchor: [R + 0.05, -4, 0], dim: false, info: `About ${labialAfter.toFixed(1)} mm of bone now covers the implant on the lip side; about 2 mm is the usual aim (dental-facts §7).` });

// ---------- params ----------
fig.param('ghost', 0, k => { ghostMat.opacity = 0.5 * k; ghost.visible = k > 0.01; });
fig.param('lift', 0, a => { st.lift = a; flapPivot.rotation.x = -a; });
fig.param('fill', 0, g => { st.fill = g; graft.visible = g > 0.01; refresh(graft, sweep(-L + 0.05, L - 0.05, graftOutline)); });
fig.param('memb', 0, k => { memHolder.visible = k > 0.01; memHolder.position.set(0, -2.5 * (1 - k), 6 * (1 - k)); });
fig.param('cover', 0, k => { st.cover = k; refresh(flap, sweep(-L, L, flapOutline)); });
fig.param('heal', 0, k => { newBone.visible = k > 0.5; graft.visible = st.fill > 0.01 && k <= 0.5; if (k > 0.5) memHolder.visible = false; st.mk = 1 - k; refresh(flap, sweep(-L, L, flapOutline)); });   // the membrane resorbs
fig.param('implant', 0, k => { const travel = (1 - k) * (IMPLANT.length + 4); implant.visible = k > 0.001; implant.position.y = -travel; implant.rotation.y = travel / IMPLANT.lead * Math.PI * 2; });
graft.visible = false; memHolder.visible = false;

// ---------- section: labio-palatal through the site (mesial half removed, camera on +x: lip side on the left) ----------
const trab = DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture;
const granules = (() => {
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.fillStyle = '#b8a688'; c.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) { const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), sh = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { c.beginPath(); for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); c.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = `rgb(${sh},${sh - 6},${sh - 20})`; c.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 4; return t;
})();
fig.enableSection([1, 0, 0], [
  { objects: [gumPal, gumUp, flap], color: DK.COLORS.mucosaCap },
  { objects: [boneMesh], color: DK.COLORS.corticalCap },
  { objects: [core], color: 0xffffff, texture: trab },
  { objects: [graft], color: 0xfaf3e4, texture: granules },
  { objects: [newBone], color: 0xffffff, texture: trab },
  { objects: [membrane], color: 0xe4dccb, kind: 'plain' }
]);
ghostMat.clippingPlanes = [];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-2.5, 2.5], offset: 0 } });

// ---------- procedure ----------
const CUTV = { theta: Math.PI / 2 - 0.12, phi: 1.5 };
const IMG = fig.mode === 'image';
const HERO = { theta: CUTV.theta, phi: CUTV.phi, zoom: IMG ? 0.76 : 0.9, focus: [0, IMG ? 5.6 : 5.0, 0.4] };
const LIFT = 0.55;
fig.procedure([
  { label: 'Thin ridge', caption: 'The ridge is too thin: an implant would show through on the lip side.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.85, phi: 1.3, zoom: 1.05, section: true, offset: 0, labels: [] },
    Object.assign({ fov: 26, dur: 2.4, hold: 1.0, labels: ['Thin ridge'] }, HERO),
    { dur: 1.8, hold: 2.0, set: { ghost: 1 }, labels: ['Thin ridge', 'Implant needs'], key: true }] },
  { label: 'Flap lifted', caption: 'The gum on the lip side is lifted off the bone.', beats: [
    { dur: 1.0, hold: 0.1, set: { ghost: 0 }, labels: [] },
    { dur: 2.4, hold: 1.8, set: { lift: LIFT }, labels: ['Gum flap'], key: true }] },
  { label: 'Graft', caption: 'Bone graft granules are packed against the lip side.', beats: [
    { dur: 1.0, hold: 0.1, zoom: HERO.zoom * 0.9, focus: [0, HERO.focus[1], 1.4], labels: [] },
    { dur: 2.8, hold: 0.3, set: { fill: 1 }, labels: ['Bone graft'] },
    { dur: 1.0, hold: 1.6, labels: ['Bone graft'], key: true }] },
  { label: 'Membrane', caption: 'A membrane covers the graft and keeps the gum out.', beats: [
    { dur: 2.2, hold: 0.3, set: { memb: 1 }, labels: ['Membrane'] },
    { dur: 1.0, hold: 1.8, labels: ['Membrane', 'Bone graft'], key: true }] },
  { label: 'Closed and healed', caption: 'The flap is closed over it; months later the graft has become bone.', beats: [
    Object.assign({ dur: 2.4, hold: 0.4, set: { lift: 0, cover: 1 }, labels: ['Gum flap'] }, HERO),
    { dur: 1.6, hold: 0.2, set: { heal: 1 }, labels: [] },
    { dur: 1.0, hold: 1.8, labels: ['New bone'], key: true }] },
  { label: 'Implant', caption: 'The implant now sits fully in bone.', beats: [
    { dur: 2.8, hold: 0.3, set: { implant: 1 }, labels: ['Implant'] },
    Object.assign({ dur: 1.6, hold: 2.6, labels: ['Implant', 'New bone'], key: true }, HERO)] }
]);
fig.start();
