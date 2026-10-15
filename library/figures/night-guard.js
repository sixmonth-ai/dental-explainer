// Story: a hard occlusal splint (night guard) over the upper teeth (FDI 17–27), the lower teeth (37–47) closing and grinding
// poster: end
// on its flat underside, then a midline cut through 11 and 41 seen from the patient's left: the guard between the teeth.
// Jaw frame: +x = patient's left, +y up, +z anterior; lower CEJs at y = 0. Upper teeth crown-down in a holder (2.5 mm overbite,
// 2.6 mm forward, as DK.mandible places them). The guard is cast on the upper crowns (DK.alignerArch) and its occlusal side is
// flattened to one plane; the lower jaw hinges open about the condylar axis until its teeth just meet that plane. Sizes in mm.
const THICK = 1.6, HINGE = [0, 30.5, -83.9];
const HOME = { theta: 0.62, phi: 1.62 };
const fig = DK.figure({
  fov: 34,
  title: 'Night guard',
  subtitle: 'Hard acrylic splint over the upper teeth, FDI 17 to 27 (Universal 2 to 15).',
  view: Object.assign({ margin: 0.72 }, HOME)
});

// --- teeth: crowns on short roots inside the gum band; the first molars complete (they are cut)
const shortRoots = (fdi, spec) => { spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 2.7) })); return DK.tooth(spec, { omit: fdi === 11 || fdi === 41 ? [] : ['dentin', 'pulp', 'root'] }); };
const upperHold = new THREE.Group();
const upper = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27], build: shortRoots });
// DK.arch seats every CEJ at y = 0, which leaves the long canine (and lower first premolar) cusps standing well above the
// occlusal plane; sink them apically to a natural curve so the arches meet as a mouth does (positions only, sizes untouched)
const SINK = { 13: 3.2, 23: 3.2, 14: 0.6, 24: 0.6, 33: 2.0, 43: 2.0, 34: 1.8, 44: 1.8, 35: 1.0, 45: 1.0 };
const sink = arch => arch.teeth.forEach(t => { if (SINK[t.fdi]) t.tooth.group.position.y -= SINK[t.fdi]; });
sink(upper);
upperHold.add(upper.group); upperHold.updateMatrixWorld(true);
const upperGum = DK.gingivaArch(upper, { height: 3.8 }); upperHold.add(upperGum);

// --- the guard (built while the holder is at the origin, so world = holder frame; crowns point to −y)
const spinePts = (() => { const T = upper.teeth, s0 = upper.slots[T[0].fdi], s1 = upper.slots[T[T.length - 1].fdi];
  const end = q => [q.c[0] - q.t[0] * (q.md / 2 + 1), q.c[1] - q.t[1] * (q.md / 2 + 1)];
  return [end(s0), ...T.map(t => upper.slots[t.fdi].c), end(s1)].map(c => new THREE.Vector3(c[0], -4.2, c[1])); })();
const spine = new THREE.CatmullRomCurve3(spinePts, false, 'centripetal');
const guard = DK.alignerArch(spine, upper.teeth.map(t => t.tooth.layers.enamel), { thickness: THICK, trimY: -1.7, segments: 200, around: 64 });
// smooth the biting side: across each row of the shell the outer occlusal vertices come down to that row's lowest point, so the
// cusps and fossae of the upper teeth are filled in to one smooth flat-topped surface that follows the arch along its length
{
  const g = guard.geometry, P = g.attributes.position, UV = g.attributes.uv, n = P.count;
  let N1 = 1; while (N1 < n && !(UV.getX(N1) === 0 && UV.getY(N1) === 0)) N1++;
  guard.userData.N1 = N1;
  const isOuter = k => k < N1 || (k >= 2 * N1 && [1, 2].includes((k - 2 * N1) % 4));
  const rowOf = k => Math.round(UV.getX(k) * 1e4), raw = new Map();
  for (let k = 0; k < N1; k++) { const i = rowOf(k), y = P.getY(k); if (!raw.has(i) || y < raw.get(i)) raw.set(i, y); }
  const keys = [...raw.keys()].sort((x, y) => x - y), W = 10;
  const lowest = keys.map((key, i) => Math.min(...keys.slice(Math.max(0, i - W), i + W + 1).map(k2 => raw.get(k2))));
  const level = new Map(keys.map((key, i) => { const win = lowest.slice(Math.max(0, i - W), i + W + 1); return [key, win.reduce((a, b) => a + b, 0) / win.length]; }));
  const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let k = 0; k < n; k++) { if (!isOuter(k)) continue;
    const w = 1 - sm(0.14, 0.28, Math.abs(UV.getY(k) - 0.5)), y = P.getY(k), yp = level.get(rowOf(k));
    if (yp !== undefined && y > yp) P.setY(k, y + (yp - y) * w); }
  P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
}
guard.material.opacity = 0.62; guard.material.color = DK.color(0xc9d8e2); guard.material.roughness = 0.12;   // clear acrylic with a faint blue-grey tint, so the shell reads against enamel
guard.traverse(o => { if (o !== guard && o.material) o.material.opacity = 0.75; });
const guardHold = new THREE.Group(); guardHold.add(guard); upperHold.add(guardHold);
upperHold.position.set(0, DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, 2.6); upperHold.rotation.x = -0.05;
upperHold.updateMatrixWorld(true);

// --- lower jaw: pivots about the condylar hinge axis; an inner group carries the side-to-side grinding shift
const lowerHold = new THREE.Group(), pivot = new THREE.Group(), slide = new THREE.Group(), inner = new THREE.Group();
pivot.position.set(...HINGE); inner.position.set(-HINGE[0], -HINGE[1], -HINGE[2]);
lowerHold.add(pivot); pivot.add(slide); slide.add(inner);
const lower = DK.arch({ jaw: 'mandible', teeth: [37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47], build: shortRoots });
sink(lower);
inner.add(lower.group); lowerHold.updateMatrixWorld(true);
const lowerGum = DK.gingivaArch(lower, { height: 3.8 }); inner.add(lowerGum);

// --- how far the jaw opens: the smallest hinge angle at which no lower tooth is inside the guard (0.05 mm clear). Test: each
// lower enamel vertex against the nearest vertex of the guard's outer surface and its outward normal (a 1 mm hash grid)
const lowerVerts = [];
lower.teeth.forEach(t => { const e = t.tooth.layers.enamel, p = e.geometry.attributes.position; for (let k = 0; k < p.count; k += 2) lowerVerts.push({ e, v: new THREE.Vector3().fromBufferAttribute(p, k) }); });
const grid = new Map(), key = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
{ const g = guard.geometry, P = g.attributes.position, N = g.attributes.normal;
  for (let k = 0; k < guard.userData.N1; k++) { const c = [P.getX(k), P.getY(k), P.getZ(k), N.getX(k), N.getY(k), N.getZ(k)], h = key(c[0], c[1], c[2]); if (!grid.has(h)) grid.set(h, []); grid.get(h).push(c); } }
const pen = ang => { pivot.rotation.x = ang; lowerHold.updateMatrixWorld(true); let m = -1; const q = new THREE.Vector3();
  lowerVerts.forEach(({ e, v }) => { q.copy(v).applyMatrix4(e.matrixWorld); upperHold.worldToLocal(q);
    let best = null, bd = 9; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const cell = grid.get(key(q.x + dx, q.y + dy, q.z + dz)); if (cell) for (const c of cell) { const d = (c[0] - q.x) ** 2 + (c[1] - q.y) ** 2 + (c[2] - q.z) ** 2; if (d < bd) { bd = d; best = c; } } }
    if (best) m = Math.max(m, -((q.x - best[0]) * best[3] + (q.y - best[1]) * best[4] + (q.z - best[2]) * best[5])); });
  return m; };
let lo = 0, hi = 0.3; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (pen(mid) > -0.05) lo = mid; else hi = mid; }
const BITE = hi, WIDE = BITE + 0.1;
// with the jaw at that angle, bring the guard's biting surface down onto the lower teeth wherever a gap is left (the
// anterior platform the lower incisors close on, the fossae between cusps): every lower tooth then meets acrylic
{
  pivot.rotation.x = BITE; lowerHold.updateMatrixWorld(true);
  const g = guard.geometry, P = g.attributes.position, UV = g.attributes.uv, N1 = guard.userData.N1, rowOf = k => Math.round(UV.getX(k) * 1e4);
  const rowPts = new Map(); for (let k = 0; k < N1; k++) { const r = rowOf(k); if (Math.abs(UV.getY(k) - 0.5) < 0.02) rowPts.set(r, [P.getX(k), P.getZ(k)]); }
  const rk = [...rowPts.keys()].sort((a, b) => a - b), top = new Map(), q = new THREE.Vector3();
  lowerVerts.forEach(({ e, v }) => { q.copy(v).applyMatrix4(e.matrixWorld); upperHold.worldToLocal(q);
    let best = null, bd = 9; rk.forEach(r => { const c = rowPts.get(r), d = (c[0] - q.x) ** 2 + (c[1] - q.z) ** 2; if (d < bd) { bd = d; best = r; } });
    if (best !== null && (!top.has(best) || q.y > top.get(best))) top.set(best, q.y); });
  const W = 4, mx = rk.map((r, i) => { let m = -Infinity; for (let j = Math.max(0, i - W); j <= Math.min(rk.length - 1, i + W); j++) if (top.has(rk[j])) m = Math.max(m, top.get(rk[j])); return m; });
  // smooth the level along the arch (a long moving minimum then a mean), so the biting surface is one continuous ramp, never stepped
  const W2 = 14, mn = mx.map((_, i) => Math.min(...mx.slice(Math.max(0, i - W2), i + W2 + 1).filter(Number.isFinite)));
  const lvl = new Map(rk.map((r, i) => { const win = mn.slice(Math.max(0, i - W2), i + W2 + 1).filter(Number.isFinite); return [r, win.reduce((a, b) => a + b, 0) / win.length + 0.05]; }));
  const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const isOuter = k => k < N1 || (k >= 2 * N1 && [1, 2].includes((k - 2 * N1) % 4));
  for (let k = 0; k < P.count; k++) { if (!isOuter(k)) continue; const yp = lvl.get(rowOf(k)); if (!(yp > -Infinity)) continue;
    const w = 1 - sm(0.18, 0.32, Math.abs(UV.getY(k) - 0.5)), y = P.getY(k); if (y > yp) P.setY(k, y + (yp - y) * w); }
  P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}
pivot.rotation.x = 0; lowerHold.updateMatrixWorld(true);

// --- parts
const XCUT = (upper.slots[11].c[0] + lower.slots[41].c[0]) / 2;   // the midline cut runs through 11 and 41
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
const u11 = T(upper, 11), l41 = T(lower, 41), P13 = T(upper, 13), P43 = T(lower, 43);
const facial = (t, k, hold) => () => { const s = t.spec, q = t.tooth.group.localToWorld(new THREE.Vector3(0, s.crownL * k, s.bl / 2)); return hold.worldToLocal(q).toArray(); };
fig.part(upperHold, { name: 'Upper teeth', anchor: facial(P13, 0.5, upperHold), info: 'Upper teeth, in the mouth. The guard is made on a model of these teeth and clips over them.' });
fig.part(lowerHold, { fit: false, name: 'Lower teeth', anchor: facial(P43, 0.5, lowerHold), info: 'Lower teeth. With the guard in, they meet smooth acrylic instead of the upper teeth.' });
upper.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
lower.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
fig.part(upperGum, { inPlace: true, name: 'Upper gum', label: false, info: 'Gum around the upper teeth.' });
fig.part(lowerGum, { inPlace: true, name: 'Lower gum', label: false, info: 'Gum around the lower teeth.' });
const P24 = T(upper, 24), P14 = T(upper, 14);
const onGuard = (e, sec) => { const on = sec && sec.enabled, t = on ? u11 : P24, s = t.spec, q = t.tooth.group.localToWorld(on ? new THREE.Vector3(0, s.crownL + 2.2, -1.2) : new THREE.Vector3(0, s.crownL * 0.75, s.bl / 2 + THICK + 0.1)); if (on) q.x = XCUT + 0.1; return guard.worldToLocal(q).toArray(); };
fig.part(guard, { inPlace: true, name: 'Night guard', sub: 'hard acrylic, about 2 mm', anchor: onGuard, accent: true, dim: false, when: () => guard.visible, info: 'A hard acrylic splint made to fit the upper teeth, about 2 mm thick over the biting surfaces (it varies by design). Grinding wears the guard, not the enamel. It protects the teeth; it does not stop the grinding.' });
const P26 = T(upper, 26);
fig.part(guard, { inPlace: true, name: 'Biting surface', sub: 'smooth, flat acrylic', anchor: () => guard.worldToLocal(P26.tooth.group.localToWorld(new THREE.Vector3(0, P26.spec.crownL + 2.4, 0))).toArray(), dim: false, when: (e, sec) => guard.visible && !sec.enabled, info: 'The lower teeth meet this smooth surface, so they slide instead of locking into the upper cusps. Wear marks appear here, not on the enamel.' });
fig.part(u11.tooth.layers.dentin, { inPlace: true, name: 'Upper incisor', anchor: [0, 6, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Upper right central incisor (FDI 11), cut lip to palate: the guard wraps its edge.' });
fig.part(l41.tooth.layers.dentin, { inPlace: true, name: 'Lower incisor', anchor: [0, 5.5, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Lower right central incisor (FDI 41): its edge rests on the acrylic, not on the upper tooth.' });

// --- params
fig.param('open', 0, a => { pivot.rotation.x = a; });
fig.param('grind', 0, x => { slide.position.x = x; });
fig.param('guard', 0, k => { guardHold.position.y = -14 * (1 - k); guard.visible = k > 0.02; guard.material.opacity = 0.62 * Math.min(1, k * 3); });
// the lower jaw drops away for the hero view of the guard on the upper arch from below
fig.param('away', 0, v => { slide.position.y = -38 * v; inner.visible = v < 0.98; });

// --- cut along the midline through 11 and 41 (patient's left half removed; camera on the patient's left looks at the cut)
const cutTeeth = [u11, l41];
fig.enableSection([1, 0, 0], [
  { objects: [upperGum, lowerGum], color: DK.COLORS.gingivaCap },
  { objects: [guard], color: 0xd6dde1, kind: 'plain' },
  ...[...upper.teeth, ...lower.teeth].map(t => ({ objects: [t.tooth.layers.enamel], color: DK.COLORS.enamelCap })),
  { objects: cutTeeth.flatMap(t => [t.tooth.layers.dentin, t.tooth.layers.root]), color: DK.COLORS.dentinCap },
  { objects: cutTeeth.map(t => t.tooth.layers.pulp), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [XCUT - 2, XCUT + 30], offset: XCUT } });
fig.view('Without guard', { section: false, set: { guard: 0, open: 0, grind: 0, away: 0 } }, 1.2);
fig.view('With guard', { section: false, set: { guard: 1, open: BITE, grind: 0, away: 0 } }, 1.2);
fig.view('Guard alone', { section: false, theta: 0.5, phi: 2.32, zoom: 1, focus: 'auto', set: { guard: 1, away: 1 }, labels: ['Night guard', 'Biting surface', 'Upper teeth'] }, 1.4);

// story: teeth together → the jaw opens and the guard goes in → the jaw closes on it → grinding slides on the acrylic →
// turn to the patient's left and sweep the cut to the midline → the guard between upper and lower incisors and the right side
// of both arches behind (teaching shot)
const SIDE = 0.9, FOCUS = [XCUT, 7, -12];
fig.story([
  { dur: 0, hold: 1.4, theta: HOME.theta, phi: HOME.phi, zoom: 1, labels: ['Upper teeth', 'Lower teeth'] },
  { dur: 1.6, hold: 0.2, set: { open: WIDE }, labels: [] },
  { dur: 2.0, hold: 0.6, set: { guard: 1 }, labels: ['Night guard'] },
  { dur: 1.4, hold: 1.4, set: { open: BITE }, labels: ['Night guard', 'Lower teeth'] },
  { dur: 1.0, hold: 0, theta: HOME.theta - 0.3, set: { grind: SIDE }, labels: ['Night guard'] },
  { dur: 1.6, hold: 0, set: { grind: -SIDE } },
  { dur: 1.0, hold: 0.8, set: { grind: 0 } },
  { fov: 30, dur: 2.2, hold: 0.2, theta: Math.PI / 2 - 0.35, phi: 1.5, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: XCUT + 30 },
  { dur: 2.6, hold: 2.4, offset: XCUT, theta: Math.PI / 2 - 0.22, phi: 1.52, zoom: 0.74, focus: FOCUS, labels: ['Night guard', 'Upper incisor', 'Lower incisor'] },
  { dur: 1.6, hold: 0, offset: XCUT + 30, labels: [] },
  { fov: 34, dur: 2.6, hold: 3.0, section: false, zoom: 1, focus: 'auto', theta: 0.5, phi: 2.32, set: { away: 1 }, labels: ['Night guard', 'Biting surface', 'Upper teeth'] }   // teaching shot: the guard on the upper arch from below
]);
fig.start();
