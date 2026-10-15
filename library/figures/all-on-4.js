// All-on-4 full-arch bridge in the lower jaw, in the jaw frame: +x = patient's left, +z anterior, y up; bridge-tooth CEJs at y = 0.
// poster: step 5
// The edentulous ridge is a signed-distance solid meshed with surface nets (local helpers, as in complete-denture.js). Two straight implants
// in front, two tilted ones behind (head tilted distally, apex in front of the mental foramen), multi-unit abutments (angled on the tilted
// ones so all four point up) and a screw-retained fixed bridge of 12 teeth (first molar to first molar) with acrylic gum.
const { clamp, lerp, smooth } = DK.util;

/* ---------- signed-distance helpers (local) ---------- */
const rnd = (a, b, r) => Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) + Math.min(Math.max(a + r, b + r), 0) - r;   // rounded intersection
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const table = (rows, s) => { if (s <= rows[0][0]) return rows[0].slice(1); const L = rows[rows.length - 1]; if (s >= L[0]) return L.slice(1);
  let i = 1; while (rows[i][0] < s) i++; const A = rows[i - 1], B = rows[i], t = (s - A[0]) / (B[0] - A[0]); return A.slice(1).map((v, k) => v + (B[k + 1] - v) * t); };
// Surface nets over f(x, y, z) (< 0 inside) in box [[x0,y0,z0],[x1,y1,z1]] with cell h; f is called column by column (x, z fixed).
function nets(f, box, h) {
  const a = box[0], b = box[1], nx = Math.ceil((b[0] - a[0]) / h) + 1, ny = Math.ceil((b[1] - a[1]) / h) + 1, nz = Math.ceil((b[2] - a[2]) / h) + 1;
  const V = new Float32Array(nx * ny * nz), id = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const x = a[0] + i * h, z = a[2] + k * h; for (let j = 0; j < ny; j++) V[id(i, j, k)] = f(x, a[1] + j * h, z); }
  const cx = nx - 1, cy = ny - 1, cell = new Int32Array(cx * cy * (nz - 1)).fill(-1), cid = (i, j, k) => i + cx * (j + cy * k);
  const pos = [], cv = new Float32Array(8), E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) { const v = V[id(i + (c & 1), j + ((c >> 1) & 1), k + (c >> 2))]; cv[c] = v; if (v < 0) inside++; }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (let e = 0; e < 12; e++) { const p = E[e][0], q = E[e][1], vp = cv[p], vq = cv[q]; if ((vp < 0) === (vq < 0)) continue;
      const t = vp / (vp - vq); sx += (p & 1) + t * ((q & 1) - (p & 1)); sy += ((p >> 1) & 1) + t * (((q >> 1) & 1) - ((p >> 1) & 1)); sz += (p >> 2) + t * ((q >> 2) - (p >> 2)); n++; }
    cell[cid(i, j, k)] = pos.length / 3; pos.push(a[0] + (i + sx / n) * h, a[1] + (j + sy / n) * h, a[2] + (k + sz / n) * h);
  }
  const idx = [], quad = (c0, c1, c2, c3, flip) => { if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) return; if (flip) idx.push(c0, c2, c1, c0, c3, c2); else idx.push(c0, c1, c2, c0, c2, c3); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const in0 = V[id(i, j, k)] < 0;
    if (in0 !== (V[id(i + 1, j, k)] < 0)) quad(cell[cid(i, j - 1, k - 1)], cell[cid(i, j, k - 1)], cell[cid(i, j, k)], cell[cid(i, j - 1, k)], !in0);
    if (in0 !== (V[id(i, j + 1, k)] < 0)) quad(cell[cid(i - 1, j, k - 1)], cell[cid(i - 1, j, k)], cell[cid(i, j, k)], cell[cid(i, j, k - 1)], !in0);
    if (in0 !== (V[id(i, j, k + 1)] < 0)) quad(cell[cid(i - 1, j - 1, k)], cell[cid(i, j - 1, k)], cell[cid(i, j, k)], cell[cid(i - 1, j, k)], !in0);
  }
  const P = new Float32Array(pos), N = new Float32Array(P.length), uv = new Float32Array(P.length / 3 * 2), eps = 0.03;
  for (let v = 0; v < P.length; v += 3) {   // project onto the exact surface; keep the exact normal
    let x = P[v], y = P[v + 1], z = P[v + 2], gx = 0, gy = 0, gz = 1;
    for (let it = 0; it < 2; it++) { const d = f(x, y, z); gx = f(x + eps, y, z) - d; gy = f(x, y + eps, z) - d; gz = f(x, y, z + eps) - d;
      const g2 = (gx * gx + gy * gy + gz * gz) / (eps * eps) || 1, s = clamp(d / g2, -h, h) / eps; x -= gx * s; y -= gy * s; z -= gz * s; }
    const gl = Math.hypot(gx, gy, gz) || 1; P[v] = x; P[v + 1] = y; P[v + 2] = z; N[v] = gx / gl; N[v + 1] = gy / gl; N[v + 2] = gz / gl;
    uv[v / 3 * 2] = (x - 0.6 * z) / 15; uv[v / 3 * 2 + 1] = (y + 0.35 * z + 0.2 * x) / 15;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  // smooth mesh normals: the field's gradient flips at its creases (a max / min of two shapes) and would sparkle there
  g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
// first point where f turns negative walking from p along dir (for label anchors on a surface)
function hit(f, p, dir, len) { let a = 0, b = null; for (let t = 0; t <= len; t += 0.25) { if (f(p[0] + dir[0] * t, p[1] + dir[1] * t, p[2] + dir[2] * t) < 0) { b = t; break; } a = t; }
  if (b === null) return p; for (let i = 0; i < 20; i++) { const m = (a + b) / 2; (f(p[0] + dir[0] * m, p[1] + dir[1] * m, p[2] + dir[2] * m) < 0 ? (b = m) : (a = m)); }
  return [p[0] + dir[0] * b, p[1] + dir[1] * b, p[2] + dir[2] * b]; }

/* ---------- an edentulous jaw and its complete denture, in the crown-up arch frame of DK.arch ---------- */
// The ridge follows the arch line the teeth stood on (s = arc length from the midline, d = signed distance, + toward cheek or lip).
function archSpine(arch, lastFdi, extend) {
  const sl = arch.slots[lastFdi], end = [sl.c[0] - sl.t[0] * sl.md / 2, sl.c[1] - sl.t[1] * sl.md / 2];
  const pts = []; for (let i = 0; i <= 40; i++) pts.push(arch.curve(end[0] * Math.sin(Math.PI / 2 * i / 40)));
  for (let k = 1; k <= 4; k++) pts.push([end[0] - sl.t[0] * extend * k / 4, end[1] - sl.t[1] * extend * k / 4]);
  const seg = []; let S = 0, sEnd = 0;
  pts.slice(1).forEach((q, i) => { const p = pts[i], l = Math.hypot(q[0] - p[0], q[1] - p[1]); seg.push({ x0: p[0], z0: p[1], tx: (q[0] - p[0]) / l, tz: (q[1] - p[1]) / l, l, s0: S }); S += l; if (i === 39) sEnd = S; });
  let memo = { x: NaN, z: NaN };
  const near = (x, z) => {
    if (x === memo.x && z === memo.z) return memo;
    const ax = Math.abs(x); let best = Infinity, r = null;
    seg.forEach((g, i) => { const wx = ax - g.x0, wz = z - g.z0, t = clamp(wx * g.tx + wz * g.tz, 0, g.l), dx = wx - g.tx * t, dz = wz - g.tz * t, dd = dx * dx + dz * dz;
      if (dd < best) { best = dd; r = { s: g.s0 + t, d: dx * -g.tz + dz * g.tx, past: i === seg.length - 1 ? wx * g.tx + wz * g.tz - g.l : -1e3 }; } });
    return (memo = Object.assign({ x, z }, r));
  };
  return { near, end, sEnd, S, pts };
}
// cfg: { arch, last, extend, upper (palate), rows: [[s, crestY, buccal half-width, lingual half-width]], th (mucosa), sulB / sulL (sulcus depth
// below the crest, buccal / lingual), base (thickness), ridgeShift (mm, + buccal), height (body: lower border or crop below the crest) }
function edentulous(cfg) {
  const sp = archSpine(cfg.arch, cfg.last, cfg.extend), near = sp.near, slots = Object.values(cfg.arch.slots);
  const gumMemo = { x: NaN, z: NaN };
  const gum = (x, z, n) => { // denture gum line (festoons, papillae) and the half-width of the tooth necks it wraps
    if (gumMemo.x === x && gumMemo.z === z) return gumMemo;
    let k = 0, w = 0, hb = 0;
    slots.forEach(sl => { const dx = x - sl.c[0], dz = z - sl.c[1], mes = dx * sl.t[0] + dz * sl.t[1], nr = dx * sl.n[0] + dz * sl.n[1];
      if (Math.abs(mes) > sl.md * 1.4 || Math.abs(nr) > 14) return;
      k = Math.max(k, Math.exp(-mes * mes / (sl.md * sl.md * 0.085))); const ww = Math.exp(-mes * mes / (sl.md * sl.md * 0.25)); w += ww; hb += ww * sl.spec.blC / 2; });
    const behind = Math.max(0, n.s - sp.sEnd);
    gumMemo.x = x; gumMemo.z = z; gumMemo.y = 2.1 - 1.8 * k - 1.3 * behind; gumMemo.hw = (w > 1e-3 ? hb / w : 4.6) + 0.55; return gumMemo;
  };
  const rowAt = s => table(cfg.rows, s);
  const sh = cfg.ridgeShift || 0;
  // bone
  const bone = (x, y, z) => {
    const n = near(x, z), [yT, oT, iT] = rowAt(n.s), d = n.d - sh, below = Math.max(0, yT - y);
    let b;
    if (!cfg.upper) { // mandibular body: broad flat ridge, walls widening to a thick, round lower border
      const yB = yT - cfg.height + 2.0 * Math.min(1, n.s / 60), t = clamp((y - yB) / (yT - yB), 0, 1), e = Math.pow(t, 1.3);
      const chin = 1.8 * Math.exp(-n.s * n.s / 80) * Math.exp(-Math.pow((t - 0.25) / 0.2, 2));
      const wo = oT + 1.9 * (1 - e) + chin, wi = iT + 1.9 * (1 - e) + 1.6 * Math.exp(-n.s * n.s / 120) * (1 - e);
      const fs = Math.max(d - wo, -wi - d);
      b = Math.max(rnd(fs, y - yT, 2.4), rnd(fs, yB - y, 3.6));
      return rnd(b, n.past, 0.6);   // cropped flat behind the retromolar pad
    }
    // maxilla: ridge band widening up to the crop, vaulted hard palate inside the arch, rounded tuberosities
    const wo = oT + 0.22 * below, wi = iT + 0.1 * below;
    const ridge = rnd(rnd(Math.max(d - wo, -wi - d), y - yT, 2.2), n.past, 4);
    const inward = Math.max(0, -n.d), r = inward / (inward + Math.sqrt(x * x + 9)), deep = 0.55 + 0.45 * smooth(-4, -26, z);
    const vault = yT - cfg.vault * Math.pow(r, 0.75) * deep;
    const plate = rnd(Math.max(Math.abs(y - (vault - 1.3)) - 1.3, n.d + 1.0), sp.end[1] - 5.5 - z, 1.5);
    b = smin(ridge, plate, 3);
    return rnd(b, (yT - cfg.height) - y, 0.8);   // cropped flat above
  };
  const vaultAt = (x, z, n) => { const yT = rowAt(n.s)[0], inward = Math.max(0, -n.d), r = inward / (inward + Math.sqrt(x * x + 9)), deep = 0.55 + 0.45 * smooth(-4, -26, z); return yT - cfg.vault * Math.pow(r, 0.75) * deep; };
  // rugae and incisive papilla (upper): small raised folds of the palatal mucosa behind the incisors
  const rugae = (x, z) => {
    const ax = Math.abs(x); let v = 0.75 * Math.exp(-Math.pow(ax / 1.4, 2) - Math.pow((z + 7.6) / 1.9, 2));
    for (let k = 0; k < 3; k++) { const zc = -10.2 - 3.3 * k - 0.16 * ax + 0.5 * Math.sin(ax * 0.9 + k); v = Math.max(v, 0.5 * Math.exp(-Math.pow((z - zc) / 0.75, 2)) * smooth(0.6, 1.8, ax) * smooth(10.5 - 1.2 * k, 7 - k, ax)); }
    return v;
  };
  const mucosa = (x, y, z) => {
    const n = near(x, z), yT = rowAt(n.s)[0], side = smooth(-2, 1.5, n.d - sh);
    const sul = yT - lerp(cfg.sulL, cfg.sulB, side);
    let lim = sul - y;
    if (cfg.upper && n.d < 0) lim = (vaultAt(x, z, n) - 1.4) - y;   // palatal side: the oral surface of the palate only (the limit runs inside the plate)
    let m = rnd(bone(x, y, z) - cfg.th, lim, 1.0);
    if (cfg.upper) m -= rugae(x, z) * smooth(-2.5, -4.5, n.d);
    return Math.max(m, cfg.upper ? -1e3 : n.past + 0.35);   // lower: ends just short of the bone's crop face
  };
  const notch = (n, side) => side * (2.8 * Math.exp(-n.s * n.s / 3.5) + 2.2 * Math.exp(-Math.pow(n.s - 22, 2) / 5)) + (1 - side) * (cfg.upper ? 0 : 3.2 * Math.exp(-n.s * n.s / 3.5));
  const postZ = sp.end[1] - 6.6;   // upper: posterior border across the palate, through the hamular notches
  const base = (x, y, z) => {
    const n = near(x, z), yT = rowAt(n.s)[0], m = mucosa(x, y, z);
    if (m > 9) return m - 6;
    const g = gum(x, z, n), hw = g.hw + 0.42 * Math.max(0, g.y - y);
    const saddle = rnd(Math.abs(n.d) - hw, y - g.y, 0.9);
    const env = smin(m - cfg.base, saddle, 2.0);
    const side = smooth(-1.5, 1.5, n.d), sul = yT - lerp(cfg.sulL, cfg.sulB, side);
    let border = (sul + 1.0 + notch(n, side)) - y;
    if (cfg.upper) border = lerp(-20, border, smooth(-3, 0, n.d));   // the upper base covers the whole palate: no lingual border
    let b = rnd(env, border, 1.0);
    if (cfg.upper) b = rnd(b, postZ - z, 1.2); else b = rnd(b, n.past + 3.5, 1.6);
    // the fitting surface is the mucosa itself (0.04 mm relief); the upper one carries the posterior palatal seal bead into the soft tissue
    let fit = 0.04 - m;
    fit = Math.max(fit, cfg.th - 0.5 - bone(x, y, z));   // never inside the bone (where the mucosa layer was cropped)
    if (cfg.upper && n.d < -1) fit = Math.max(fit, vaultAt(x, z, n) + 0.5 - y);   // nor on the nasal side of the palate
    return Math.max(b, fit);
  };
  return { near, gum, bone, mucosa, base, spine: sp, rowAt, vaultAt, postZ };
}

/* ---------- materials ---------- */
const ACRYLIC = 0xc4928d, ACRYLIC_CAP = 0xb4827e;
const acrylicMat = () => DK.mat('gingiva', { color: ACRYLIC, cap: ACRYLIC_CAP, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.22, bumpScale: 0.002, envMapIntensity: 0.7 });
const TRAB = DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture;   // the kit's trabecular cut texture
const meshOf = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; return m; };
const cutOnly = (geo, name) => { const mat = DK.mat('bone', { color: DK.COLORS.cancellous }); mat.visible = false; const m = meshOf(geo, mat, name); m.userData.cutOnly = true; return m; };
function buildJaw(J, box, name) {
  const bone = meshOf(nets(J.bone, box, 0.8), DK.mat('bone'), name + ' bone');
  const canc = cutOnly(nets((x, y, z) => J.bone(x, y, z) + 1.5, box, 0.9), name + ' cancellous bone');
  const muc = meshOf(nets(J.mucosa, box, 0.7), DK.mat('mucosa'), name + ' mucosa');
  return { bone, canc, muc };
}
function buildBase(J, box, name) { return meshOf(nets(J.base, box, 0.42), acrylicMat(), name); }
// fade a set of objects (story params): opacity, depth write and visibility together
function fader(objs) {
  const list = []; objs.forEach(o => o.traverse(m => { if (m.isMesh && !m.userData.cutOnly) list.push(m); }));
  return v => list.forEach(m => { const mt = m.material; if (mt.userData.op0 === undefined) mt.userData.op0 = mt.opacity;
    const op = mt.userData.op0 * v; if (mt.transparent !== op < 1) mt.needsUpdate = true; mt.transparent = op < 1; mt.opacity = op; mt.depthWrite = op > 0.6; m.visible = op > 0.02; });
}


/* ---------- the figure ---------- */
const fig = DK.figure({
  fov: 32,
  title: 'All-on-4 full arch',
  subtitle: 'Lower jaw. Four implants hold a fixed bridge; back two tilted about 30°.',
  view: { theta: 0.55, phi: 1.2, margin: 0.9 }
});
const resinTooth = (fdi, spec) => { const g = new THREE.Group(), c = DK.restorationCrown(spec, 'ceramic', { hollow: false }); c.name = 'Bridge tooth'; g.add(c); return { group: g, layers: { enamel: c }, spec }; };
const lowArch = DK.arch({ jaw: 'mandible', build: resinTooth, omit: [37, 47] });
const LOW = edentulous({ arch: lowArch, last: 37, extend: 13, upper: false, th: 2.2, sulB: 6.5, sulL: 8, base: 2.2, height: 19,
  rows: [[0, -5.0, 3.0, 3.4], [14, -5.0, 3.4, 3.5], [28, -5.1, 4.4, 3.8], [40, -5.2, 5.8, 4.2], [54, -4.8, 6.2, 4.6], [70, -4.2, 5.8, 4.6]] });
const near = LOW.spine.near;
const lowJaw = buildJaw(LOW, [[-38, -26, -60], [38, 3.2, 8]], 'Lower');

// arch-line helpers (patient's left, +x; mirror x for the right)
const P = LOW.spine.pts, cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
const atS = (s, d) => { let i = 1; while (i < P.length - 1 && cum[i] < s) i++; const a = P[i - 1], b = P[i], t = clamp((s - cum[i - 1]) / (cum[i] - cum[i - 1]), 0, 1), l = cum[i] - cum[i - 1];
  const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l; return [a[0] + (b[0] - a[0]) * t - tz * d, a[1] + (b[1] - a[1]) * t + tx * d]; };
const yT = s => LOW.rowAt(s)[0];
// inferior alveolar nerve in its canal, leaving the bone at the mental foramen below the premolars
const s34 = near(...lowArch.slots[34].c).s, s35 = near(...lowArch.slots[35].c).s, sMF = (s34 + s35) / 2 + 1.5;
const mfY = yT(sMF) - 7.5, mfOut = (() => { const q = atS(sMF, 14), c = atS(sMF, 0), dx = c[0] - q[0], dz = c[1] - q[1], l = Math.hypot(dx, dz); return hit(LOW.bone, [q[0], mfY, q[1]], [dx / l, 0, dz / l], 14); })();
const canal = [[66, 0, -11.5], [52, 0, -11.2], [40, 0, -10.6], [sMF + 6, 0, -9.6], [sMF + 2, 1.6, -8.4]].map(([s, d, dy]) => { const p = atS(s, d); return [p[0], yT(s) + dy, p[1]]; });
canal.push([mfOut[0], mfOut[1], mfOut[2]]);
const nerveMat = DK.mat('nerve');
const nerveL = DK.tube(canal, 1.1, nerveMat, { caps: true }), nerveR = DK.tube(canal.map(p => [-p[0], p[1], p[2]]), 1.1, nerveMat, { caps: true });
nerveL.name = nerveR.name = 'Nerve';
const lowJawG = new THREE.Group(); lowJawG.add(lowJaw.bone, lowJaw.canc, lowJaw.muc, nerveL, nerveR);

// ---- the four implants: platform on the crest; the back ones tilted distally so the apex lies in front of the foramen
const TILT = 30, FRONT = { d: 4.0, L: 13, s: 10 }, BACK = { d: 4.0, L: 15 };
BACK.s = sMF + 0.5;   // platform over the premolars, just behind the foramen; the body passes above it, apex ~6 mm in front of it
const UPV = new THREE.Vector3(0, 1, 0);
function site(s, side, tilt) {
  const p = atS(s, 0), q = atS(s + 0.5, 0), r = atS(s - 0.5, 0), tx = (q[0] - r[0]) * side, tz = q[1] - r[1], tl = Math.hypot(tx, tz);
  const x = p[0] * side, crest = hit(LOW.bone, [x, 4, p[1]], [0, -1, 0], 20)[1], muc = hit(LOW.mucosa, [x, 4, p[1]], [0, -1, 0], 20)[1];
  const a = tilt * Math.PI / 180, v = new THREE.Vector3(tx / tl * Math.sin(a), Math.cos(a), tz / tl * Math.sin(a)).normalize();   // head tilted toward the back
  return { x, z: p[1], crest, muc, v, q: new THREE.Quaternion().setFromUnitVectors(UPV, v) };
}
const sites = [site(FRONT.s, -1, 0), site(FRONT.s, 1, 0), site(BACK.s, -1, TILT), site(BACK.s, 1, TILT)];
sites.forEach((s, i) => { s.spec = i < 2 ? FRONT : BACK; s.tilted = i >= 2; s.top = new THREE.Vector3(s.x, s.crest, s.z); });
const implants = sites.map(s => { const m = DK.implant({ diameter: s.spec.d, length: s.spec.L, connection: 'conical' }); m.userData.site = s; fig.world.add(m); return m; });
const placeImp = (m, k) => { const s = m.userData.site, travel = (1 - k) * (s.spec.L + 4); m.visible = k > 0.001;
  m.position.copy(s.top).addScaledVector(s.v, travel); m.quaternion.copy(s.q).multiply(new THREE.Quaternion().setFromAxisAngle(UPV, -travel / 1.6 * Math.PI * 2)); };

// ---- multi-unit abutments: a collar along the implant, then a cone standing straight up (angled ones for the tilted implants)
const MUA_TOP = Math.max(...sites.map(s => s.muc)) + 1.6;
const muaMat = DK.mat('titanium');
const muas = sites.map(s => {
  const g = new THREE.Group(), base = new THREE.Group(); g.add(base);
  const low = DK.lathe([[0, -1.6], [1.25, -1.6], [1.45, 0], [2.0, 0], [2.0, s.tilted ? 1.6 : 0.8], [0, s.tilted ? 1.6 : 0.8]], 48, muaMat);
  low.quaternion.copy(s.q); base.add(low);
  const head = s.top.clone().addScaledVector(s.v, s.tilted ? 1.3 : 0.6), h = MUA_TOP - head.y;
  const up = DK.lathe([[0, 0], [2.05, 0], [2.3, h - 1.6], [2.3, h - 1.2], [1.9, h], [0, h]], 48, muaMat);
  up.position.copy(head).sub(s.top); base.add(up);
  g.userData = { s, low, up }; fig.world.add(g); return g;
});
const placeMua = (g, k) => { const s = g.userData.s; g.visible = k > 0.001; g.position.copy(s.top).add(new THREE.Vector3(0, (1 - k) * 8, 0)); };

// ---- the fixed bridge: 12 resin teeth on an acrylic gum, clear of the ridge by ~0.7 mm, ending behind the first molars
const sEnd = near(...lowArch.slots[36].c).s + lowArch.slots[36].md / 2;
const bridgeSD = (x, y, z) => { const n = near(x, z), yt = yT(n.s), m = LOW.mucosa(x, y, z);
  if (m > 9) return m - 6;
  const g = LOW.gum(x, z, n), hw = g.hw + 0.35 * Math.max(0, g.y - y);
  let b = rnd(Math.abs(n.d) - hw, y - g.y, 0.9);
  b = rnd(b, (yt + 0.6) - y, 1.2); b = rnd(b, n.s - sEnd - 0.4, 1.8);
  return Math.max(b, 0.7 - m); };
const bridgeBase = meshOf(nets(bridgeSD, [[-36, -7, -50], [36, 2.8, 7]], 0.42), acrylicMat(), 'Bridge gum');
const bridge = new THREE.Group(); bridge.add(bridgeBase, lowArch.group); fig.world.add(bridge);

// ---- parts and labels
const sl45 = lowArch.slots[45], pRidge = hit(LOW.mucosa, [sl45.c[0], 4, sl45.c[1]], [0, -1, 0], 14);
const sl34 = lowArch.slots[34], q34 = [sl34.c[0] + sl34.n[0] * 12, sl34.c[1] + sl34.n[1] * 12];
const pBridge = hit(bridgeSD, [q34[0], -1.2, q34[1]], [-sl34.n[0], 0, -sl34.n[1]], 12);
fig.part(lowJawG, { name: 'Lower jaw', label: false, info: 'Toothless lower jaw: the ridge covered by mucosa, with the nerve running inside the bone.' });
fig.part(lowJaw.muc, { inPlace: true, name: 'Ridge', anchor: pRidge, info: 'The toothless ridge. With All-on-4 nothing rests on it: the bridge is held by the implants alone.' });
fig.part(nerveL, { inPlace: true, name: 'Nerve', sub: 'exits at the mental foramen', anchor: canal[canal.length - 2], dim: false, info: 'The inferior alveolar nerve runs inside the jaw and leaves it at the mental foramen, below the premolars. The tilted implants stay in front of it.' });
fig.part(implants[1], { inPlace: true, name: 'Straight implant', anchor: [FRONT.d / 2, -FRONT.L * 0.5, 0], dim: false, info: `One of two upright implants in the front of the jaw (here about Ø${FRONT.d} × ${FRONT.L} mm; sizes vary by system and bone).` });
fig.part(implants[3], { inPlace: true, name: 'Tilted implant', sub: `about ${TILT}°`, anchor: [BACK.d / 2, -BACK.L * 0.55, 0], accent: true, dim: false, info: `Back implant tilted about ${TILT}° with its head toward the back: a longer implant fits in front of the nerve, and the bridge gets support further back without bone grafting.` });
[0, 2].forEach(i => fig.part(implants[i], { inPlace: true, name: i ? 'Tilted implant (right)' : 'Straight implant (right)', label: false, info: 'The matching implant on the other side.' }));
fig.part(muas[3], { inPlace: true, name: 'Angled abutment', anchor: () => { const u = muas[3].userData.up; return [u.position.x + 2.3, u.position.y + (MUA_TOP - sites[3].top.y - u.position.y) * 0.4, u.position.z]; }, dim: false, info: 'Multi-unit abutment. On a tilted implant it is angled, so its top points straight up like the front ones and one bridge fits all four.' });
fig.part(bridge, { inPlace: true, name: 'Fixed bridge', sub: '12 teeth', anchor: pBridge, info: 'One full-arch bridge, screwed onto the four abutments. It is fixed: only the dentist takes it off. Often fitted the same day as a provisional when the implants are stable enough (immediate loading).' });

// ---- params
fig.param('front', 0, k => { placeImp(implants[0], k); placeImp(implants[1], k); });
fig.param('back', 0, k => { placeImp(implants[2], k); placeImp(implants[3], k); });
fig.param('mua', 0, k => muas.forEach(g => placeMua(g, k)));
fig.param('bridge', 0, k => { bridge.visible = k > 0.001; bridge.position.y = (1 - k) * 16; });

fig.xray([lowJaw.bone, lowJaw.muc]);
fig.xrayToggle([], 'X-ray', false);
fig.view('Side', { theta: 1.35, phi: 1.32, zoom: 0.8, xray: 1, labels: ['Straight implant', 'Tilted implant', 'Nerve'] });
fig.view('Above', { theta: 0.0, phi: 0.35, zoom: 0.9, labels: ['Straight implant', 'Tilted implant'] });
fig.standardControls({ explode: false });

const left = [sites[3].x - 2, -7, sites[3].z + 1];
fig.procedure([
  { label: 'Toothless jaw', caption: 'A toothless lower jaw, with the nerve inside it.', beats: [
    { fov: 32, dur: 0, hold: 1.4, theta: 0.55, phi: 1.2, zoom: 0.85, labels: ['Ridge'] },
    { dur: 1.8, hold: 1.6, xray: 1, theta: 0.4, phi: 1.0, zoom: 0.8, labels: ['Nerve'], key: true }] },
  { label: 'Front implants', caption: 'Two straight implants go in at the front.', beats: [
    { dur: 1.2, hold: 0.2, theta: 0.3, phi: 1.05, zoom: 0.78, labels: [] },
    { dur: 2.8, hold: 1.6, set: { front: 1 }, labels: ['Straight implant'], key: true }] },
  { label: 'Tilted back implants', caption: 'The back two are tilted, so they miss the nerve and reach further back.', beats: [
    { fov: 30, dur: 1.8, hold: 0.2, theta: 1.25, phi: 1.3, zoom: 0.7, focus: left, labels: ['Nerve'] },
    { dur: 3.0, hold: 1.8, set: { back: 1 }, labels: ['Tilted implant', 'Straight implant', 'Nerve'], key: true }] },
  { label: 'Abutments', caption: 'Abutments, angled on the tilted implants, make all four point up.', beats: [
    { dur: 1.4, hold: 0.2, xray: 0.6, theta: 0.9, phi: 1.2, zoom: 0.7, focus: 'auto', labels: [] },
    { dur: 1.8, hold: 1.8, set: { mua: 1 }, labels: ['Angled abutment', 'Tilted implant'], key: true }] },
  { label: 'Fixed bridge', caption: 'One fixed bridge of 12 teeth is screwed onto the four abutments.', beats: [
    { dur: 2.0, hold: 0.3, set: { bridge: 1 }, xray: 0, theta: 0.6, phi: 1.2, zoom: 0.95, labels: ['Fixed bridge'] },
    { dur: 2.2, hold: 2.6, xray: 1, theta: 0.85, phi: 1.22, zoom: 0.78, labels: ['Fixed bridge', 'Straight implant', 'Tilted implant', 'Nerve'], key: true }] }
]);
fig.start();
