// Complete dentures, upper and lower, on edentulous (toothless) ridges, in the jaw frame: +x = patient's left, +z anterior, y up; lower denture-tooth CEJs at y = 0.
// poster: end
// The ridges, palate and denture bases are signed-distance solids meshed with surface nets (helpers below, local to this figure):
// the bone is a resorbed ridge, the mucosa a ~2 mm layer over it, and each denture base is the space between the mucosa (its fitting
// surface copies it exactly) and a shell ~2 mm outside it, with the gum festoons, frenum notches and (upper) the posterior palatal seal.
// The denture teeth are DK.arch crowns on the natural arch; the upper set is mirrored crown-down in occlusion with the lower one.
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
  fov: 34,
  title: 'Complete dentures',
  subtitle: 'Upper and lower full dentures on toothless ridges. Average adult.',
  view: { theta: 0.6, phi: 1.4, margin: 0.9 }
});

// lower: denture teeth on the arch (CEJ y = 0), ridge under them
// denture teeth are solid resin: a solid crown of each tooth's shape (no enamel / dentin layers), placed and mirrored by DK.arch
const resinTooth = (fdi, spec) => { const g = new THREE.Group(), c = DK.restorationCrown(spec, 'ceramic', { hollow: false }); c.name = 'Denture tooth'; g.add(c); return { group: g, layers: { enamel: c }, spec }; };
const lowArch = DK.arch({ jaw: 'mandible', build: resinTooth });
const LOW = edentulous({ arch: lowArch, last: 37, extend: 13, upper: false, th: 2.2, sulB: 6.5, sulL: 8, base: 2.2, height: 19,
  rows: [[0, -5.0, 3.0, 3.4], [14, -5.0, 3.4, 3.5], [28, -5.1, 4.4, 3.8], [40, -5.2, 5.8, 4.2], [54, -4.8, 6.2, 4.6], [70, -4.2, 5.8, 4.6]] });
// upper: crown-up in its own arch frame, mirrored crown-down and set in occlusion (2.5 mm overbite) like the kit's upper teeth
const upArch = DK.arch({ jaw: 'maxilla', build: resinTooth });
const UP = edentulous({ arch: upArch, last: 27, extend: 7, upper: true, th: 2.3, sulB: 8, sulL: 8, base: 2.0, height: 9.5, vault: 8.5, ridgeShift: -1.2,
  rows: [[0, -5.2, 3.0, 3.2], [16, -5.2, 3.6, 3.6], [30, -5.4, 4.6, 4.0], [46, -5.4, 5.4, 4.4], [62, -5.2, 6.2, 4.8]] });
const lowBox = [[-38, -26, -60], [38, 3.2, 8]], upBox = [[-40, -17.6, -58], [40, 3.2, 8]];
const lowJaw = buildJaw(LOW, lowBox, 'Lower'), upJaw = buildJaw(UP, upBox, 'Upper');
const lowBase = buildBase(LOW, [[-38, -14, -58], [38, 2.6, 7]], 'Lower denture base');
const upBase = buildBase(UP, [[-40, -16, -56], [40, 2.6, 7]], 'Upper denture base');

const HOLD = { y: DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, z: 2.6, rx: -0.05 };
const holder = () => { const g = new THREE.Group(); g.position.set(0, HOLD.y, HOLD.z); g.rotation.x = HOLD.rx; return g; };
const flipped = () => { const f = new THREE.Group(); f.scale.y = -1; return f; };
const upJawG = holder(), upDent = holder(), lowJawG = new THREE.Group(), lowDent = new THREE.Group();
const upJawF = flipped(); upJawG.add(upJawF); upJawF.add(upJaw.bone, upJaw.canc, upJaw.muc);
const upDentF = flipped(); upDent.add(upDentF); upDentF.add(upBase, upArch.group);
lowJawG.add(lowJaw.bone, lowJaw.canc, lowJaw.muc); lowDent.add(lowBase, lowArch.group);
const U = p => [p[0], -p[1], p[2]];   // crown-up upper point → holder frame (label anchors on upper parts)

// anchors on the real surfaces
const lowS = LOW.spine.near;
const slot = (arch, f) => arch.slots[f];
const s34 = slot(lowArch, 34), s45 = slot(lowArch, 45), s24 = slot(upArch, 24), s36 = slot(lowArch, 36), s16 = slot(upArch, 16), s32 = slot(lowArch, 32);
const out = (sl, k) => [sl.c[0] + sl.n[0] * k, sl.c[1] + sl.n[1] * k];
const pFlangeLow = (() => { const q = out(s34, 14); return hit(LOW.base, [q[0], -4.5, q[1]], [-s34.n[0], 0, -s34.n[1]], 14); })();
const pFlangeUp = (() => { const q = out(s24, 14); return hit(UP.base, [q[0], -4.5, q[1]], [-s24.n[0], 0, -s24.n[1]], 14); })();
const pRidge = (() => { const q = out(s45, 0); return hit(LOW.mucosa, [q[0], 4, q[1]], [0, -1, 0], 14); })();
const pSeal = hit(UP.base, [5, -24, UP.postZ + 0.6], [0, 1, 0], 30);          // the back edge, on the fitting surface
const pBorder = (() => { const q = out(s36, 12); return hit(LOW.base, [q[0], LOW.rowAt(lowS(q[0], q[1]).s)[0] - 4.5, q[1]], [-s36.n[0], 0, -s36.n[1]], 14); })();
const pBone = (() => { const n = lowS(s36.c[0], s36.c[1]); return [s36.c[0], LOW.rowAt(n.s)[0] - 9, s36.c[1]]; })();
// palate of the upper base at the midline: fitting-surface height along z (crown-up frame), for the label on the fitting surface and on the cut
const palY = []; for (let z = -50; z <= 6; z += 0.5) palY.push(hit(UP.base, [0, -26, z], [0, 1, 0], 32)[1]);
const palAt = z => palY[clamp(Math.round((z + 50) / 0.5), 0, palY.length - 1)];
const pPalate = [0, palAt(-20), -20];
// with the cut on, anchors in front of it would float over empty space: move them onto the cut face (z just behind the plane)
const crestX = (sp, z) => { const P = sp.pts; for (let i = 0; i < P.length - 1; i++) if (P[i][1] >= z && P[i + 1][1] <= z) { const t = (P[i][1] - z) / ((P[i][1] - P[i + 1][1]) || 1); return P[i][0] + (P[i + 1][0] - P[i][0]) * t; } return P[P.length - 1][0]; };
const onCut = (zOf, still, fn) => { let key = NaN, val = still;
  return (e, sec) => { if (!sec.enabled || zOf >= 1e3 || zOf < sec.offset) return still; if (sec.offset !== key) { key = sec.offset; val = fn(sec.offset - 0.25); } return val; }; };
const yTlow = (x, z) => LOW.rowAt(lowS(x, z).s)[0];
const cutRidge = z => { const x = -crestX(LOW.spine, z); return hit(LOW.mucosa, [x, 4, z], [0, -1, 0], 14); };
const cutBone = z => { const x = crestX(LOW.spine, z); return [x, yTlow(x, z) - 8, z]; };
const cutFlange = z => { const x = crestX(LOW.spine, z); return hit(LOW.base, [x + 14, yTlow(x, z) - 4.5, z], [-1, 0, 0], 14); };
const cutUpper = zw => { const z = zw - HOLD.z - 0.4, x = crestX(UP.spine, z); return U(hit(UP.base, [x + 14, -4.5, z], [-1, 0, 0], 14)); };

fig.part(upJawG, { name: 'Upper jaw', label: false, explode: [0, 22, 0], info: 'Toothless upper jaw: the ridge where the teeth stood and the hard palate, covered by firm mucosa. Cropped above the palate.' });
fig.part(upDent, { name: 'Upper denture', anchor: onCut(U(pFlangeUp)[2] + HOLD.z, U(pFlangeUp), cutUpper), explode: [0, 8, 0], info: 'Acrylic base with resin teeth. It covers the ridge and the whole hard palate, which gives it the most area for suction.' });
fig.part(lowDent, { name: 'Lower denture', anchor: pFlangeLow, explode: [0, -8, 0], info: 'Horseshoe-shaped around the tongue, so it has far less area to grip than the upper one and moves more.' });
fig.part(lowJawG, { name: 'Lower jaw', label: false, explode: [0, -22, 0], info: 'Toothless lower jaw. After the teeth are lost the ridge shrinks, faster in the lower jaw than in the upper.' });
fig.part(lowJaw.muc, { inPlace: true, name: 'Ridge', sub: 'gum over bone', anchor: onCut(pRidge[2], pRidge, cutRidge), dim: false, when: (e, sec) => e > 0.3 || sec.enabled, info: 'The toothless ridge: bone covered by about 2 mm of mucosa. The denture rests on it; nothing is fixed to it.' });
fig.part(lowJaw.bone, { inPlace: true, name: 'Bone', anchor: onCut(pBone[2], pBone, cutBone), dim: false, when: (e, sec) => sec.enabled, info: 'Jaw bone under the mucosa. It slowly shrinks once the teeth are gone, so dentures need relining over the years.' });
fig.part(upBase, { inPlace: true, name: 'Palate cover', sub: 'suction', accent: true, dim: false,
  anchor: (e, sec) => { if (!sec.enabled) return pPalate; const z = sec.offset - HOLD.z + 0.2; return [0, palAt(z) + 1.0, z]; },
  info: 'The upper base covers the hard palate. A thin film of saliva between base and mucosa, sealed all round, holds it by suction.' });
fig.part(upBase, { inPlace: true, name: 'Posterior seal', sub: 'post dam', anchor: pSeal, info: 'The back edge ends on the soft tissue where hard and soft palate meet; it is pressed slightly into that tissue (post dam) so air cannot break the suction.' });
fig.part(lowBase, { inPlace: true, name: 'Flange', sub: 'cheeks and tongue hold it', anchor: onCut(pBorder[2], pBorder, cutFlange), dim: false, info: 'The flanges reach into the folds of the cheek and tongue. Their shaped outer surfaces let the cheeks and tongue press the denture down onto the ridge.' });
fig.part(lowArch.group, { inPlace: true, name: 'Denture teeth', anchor: [s32.c[0] + s32.n[0] * 2.6, 6.5, s32.c[1] + s32.n[1] * 2.6], info: 'Acrylic or composite resin teeth, set where the natural teeth stood and meeting evenly on both sides so the dentures stay seated when you chew.' });

// params: fade a set out of the way (the upper jaw, to look down onto the fitting surface of the upper denture)
fig.param('upJaw', 1, fader([upJawG]));
fig.param('upDent', 1, fader([upDent]));
fig.param('lower', 1, fader([lowJawG, lowDent]));

fig.enableSection([0, 0, 1], [
  { objects: [upJaw.muc, lowJaw.muc], color: DK.COLORS.mucosaCap, kind: 'gingiva' },
  { objects: [upJaw.bone, lowJaw.bone], color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: [upJaw.canc, lowJaw.canc], color: 0xffffff, texture: TRAB },
  { objects: [upBase, lowBase], color: ACRYLIC_CAP, kind: 'plain' },
  { objects: [...upArch.teeth.map(t => t.tooth.layers.enamel), ...lowArch.teeth.map(t => t.tooth.layers.enamel)], color: DK.COLORS.ceramicCap, kind: 'plain' }
]);
const zCut = (s36.c[1] + s16.c[1] + HOLD.z) / 2;
const EX = 0.85, ALL = { upJaw: 1, upDent: 1, lower: 1 };
const HOME = { theta: 0.6, phi: 1.4, zoom: 1, fov: 34, explode: 0, focus: 'auto', section: false, set: ALL, labels: ['Upper denture', 'Lower denture', 'Ridge', 'Denture teeth'] };
const PALATE = { theta: 0.35, phi: 0.85, zoom: 0.62, explode: EX, focus: [0, HOLD.y + 8 * EX + 7, -17], section: false, set: { upJaw: 0, upDent: 1, lower: 0 }, labels: ['Palate cover', 'Posterior seal'] };
const LOWER = { theta: 0.25, phi: 0.5, zoom: 0.62, explode: EX, focus: [0, -8 * EX - 2, -18], section: false, set: { upJaw: 0, upDent: 0, lower: 1 }, labels: ['Lower denture', 'Flange'] };
const ctl = fig.standardControls({ explode: true, section: { label: 'Cut', range: [-48, 10], offset: zCut } });
fig.view('Palate', PALATE);
fig.view('Lower', LOWER);
ctl.reset.addEventListener('click', () => fig.goTo(HOME, 0.8));   // reset also brings every part back

fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.6, phi: 1.4, zoom: 1, explode: 0, labels: [], caption: 'Complete dentures replace all the teeth of a jaw.' },
  { dur: 2.4, hold: 2.0, theta: 0.8, phi: 1.28, explode: EX, labels: ['Upper denture', 'Lower denture', 'Ridge', 'Denture teeth'], caption: 'Each one rests on the toothless gum ridge. Nothing is fixed to the jaw.' },
  Object.assign({ dur: 2.8, hold: 2.4, caption: 'Seen from above, the side that fits the mouth: the upper denture covers the whole palate, a large sealed surface for suction.' }, PALATE),
  Object.assign({ dur: 2.6, hold: 2.0, caption: 'The lower one is a horseshoe around the tongue, held mostly by the cheeks and tongue.' }, LOWER),
  { fov: 28, dur: 2.4, hold: 0.2, theta: 0.5, phi: 1.4, zoom: 1, focus: 'auto', explode: 0, set: ALL, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 10 },
  { dur: 2.6, hold: 2.8, offset: zCut, theta: 0.42, phi: 1.36, zoom: 0.8, labels: ['Palate cover', 'Lower denture', 'Ridge', 'Bone'], caption: 'Cut across the molars: the bases sit on the mucosa, the upper one spans the palate.' }
]);
fig.start();
