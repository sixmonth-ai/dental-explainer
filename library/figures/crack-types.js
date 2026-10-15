// Five kinds of cracked teeth (AAE classification) on five copies of the mandibular left first molar (FDI 36 = Universal 19), each turned to face its crack; frame per tooth: +x mesial, +z buccal, CEJ at y = 0. Story: solid teeth with fine crack lines, then a part see-through reveal of how far each crack runs.
// poster: end
// Craze line: in the enamel only. Fractured cusp: one cusp, oblique, from the chewing surface out at the neck. Cracked tooth:
// from the chewing surface mesio-distally down toward the pulp, incomplete. Split tooth: the same crack run to completion,
// through both marginal ridges and down into the roots, so the tooth comes apart in two. Vertical root fracture: starts in the
// root (usually of a root-filled tooth) and runs along it cheek to tongue. Classification after the AAE ("Cracking the cracked
// tooth code"); not in dental-facts.md, so the figure stays qualitative. Crack gaps are drawn far wider than real.
const FDI = 36, GAP = 14;
const fig = DK.figure({
  fov: 30,
  title: 'Five kinds of tooth cracks',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19). Each tooth turned to face its crack.',
  view: { theta: 0.2, phi: 1.25 }
});

const accentMat = (op, depth) => new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: op < 1, opacity: op, depthWrite: op >= 1 });
const rc = new THREE.Raycaster(); rc.params.Mesh = {};

// all solid intervals of a tooth along the line o + t·d (tooth frame), merged across enamel, dentin and roots
function intervals(w, o, d) {
  const g = w.t.group, oW = g.localToWorld(new THREE.Vector3(...o).addScaledVector(new THREE.Vector3(...d), -40)), dW = g.localToWorld(new THREE.Vector3(...o).add(new THREE.Vector3(...d))).sub(g.localToWorld(new THREE.Vector3(...o))).normalize();
  rc.set(oW, dW); const all = [];
  w.probes.forEach(p => {
    const h = rc.intersectObject(p, false).map(q => q.distance - 40).sort((a, b) => a - b);
    for (let i = 0; i + 1 < h.length; i += 2) all.push([h[i], h[i + 1]]);
  });
  all.sort((a, b) => a[0] - b[0]); const out = [];
  all.forEach(iv => { const l = out[out.length - 1]; if (l && iv[0] <= l[1] + 0.08) l[1] = Math.max(l[1], iv[1]); else out.push(iv.slice()); });
  return out;
}
// a crack sheet: rows r = r0..r1 along R from O; in each row the crack spans t in lim(r, interval) along D; thickness along N
function crackSheet(w, o) {
  const NR = o.nr || 40, NT = o.nt || 24, R = new THREE.Vector3(...o.R), D = new THREE.Vector3(...o.D), N = new THREE.Vector3().crossVectors(R, D).normalize();
  const rows = [];
  for (let i = 0; i <= NR; i++) {
    const r = o.r0 + (o.r1 - o.r0) * i / NR, base = new THREE.Vector3(...o.O).addScaledVector(R, r);
    const ivs = intervals(w, base.toArray(), o.D);
    let span = null;
    if (ivs.length && o.pick === 'hull') ivs.splice(0, ivs.length, [ivs[0][0], ivs[ivs.length - 1][1]]);
    if (ivs.length && o.pick === 'top') ivs.splice(0, ivs.length - 1);
    ivs.forEach(iv => { const l = o.lim(r, iv); if (l && l[1] > l[0] + 0.02 && (!span || l[1] - l[0] > span[1] - span[0])) span = l; });
    rows.push({ r, base, span });
  }
  // rows without tooth collapse onto the nearest valid row's edge (keeps one closed slab)
  let last = rows.find(q => q.span); if (!last) return null;
  rows.forEach(q => { if (q.span) last = q; else q.span = [last.span[0], last.span[0]]; });
  // the plane inside: a faint tint, so the depth reads without hiding the tooth
  const P = (i, j) => { const q = rows[i], t = q.span[0] + (q.span[1] - q.span[0]) * j / NT; return q.base.clone().addScaledVector(D, t).addScaledVector(N, o.shift || 0); };
  const geo = DK.slabGeometry(NR, NT, (i, j) => { const p = P(i, j); return [p.clone().addScaledVector(N, -0.004).toArray(), p.clone().addScaledVector(N, 0.004).toArray()]; });
  const tint = new THREE.Mesh(geo, accentMat(o.tint ?? 0.18)); tint.renderOrder = 5; w.t.group.add(tint);
  // its outline: a crisp line where it meets the surface and where it ends inside
  const loop = [];
  for (let j = 0; j <= NT; j++) loop.push(P(0, j));
  for (let i = 1; i <= NR; i++) loop.push(P(i, NT));
  for (let j = NT - 1; j >= 0; j--) loop.push(P(NR, j));
  for (let i = NR - 1; i >= 0; i--) loop.push(P(i, 0));
  const pts = []; loop.forEach(p => { if (!pts.length || p.distanceTo(pts[pts.length - 1]) > 0.04) pts.push(p); });
  const edge = DK.tube(pts.map(p => p.toArray()), o.line ?? 0.07, accentMat(o.lineOpacity ?? 1), { caps: true }); edge.renderOrder = 6; w.t.group.add(edge);
  return { tint, edge, rows };
}

const KINDS = [
  { name: 'Craze line', sub: 'enamel only', ry: -0.55, info: 'Fine lines in the enamel only, very common in adult teeth. They do not reach the dentin, cause no pain and need no treatment.' },
  { name: 'Fractured cusp', sub: 'one cusp breaks off', ry: Math.PI - 0.55, info: 'A crack under one cusp, usually next to a large filling, running from the chewing surface out to the neck. Often the cusp breaks off; the pulp is rarely involved, and a crown or onlay fixes it.' },
  { name: 'Cracked tooth', sub: 'center, toward the pulp', ry: 0.3, info: 'A crack from the chewing surface running front to back and downward, not yet complete. Sharp pain on biting and on release is typical. Caught early, a crown can hold it together; if it reaches the pulp, root canal treatment may also be needed.' },
  { name: 'Split tooth', sub: 'comes apart in two', ry: -Math.PI / 2 + 0.3, info: 'A cracked tooth that has run to completion: the crack crosses both marginal ridges and runs down into the roots, so the two halves move apart. The tooth can rarely be kept whole.' },
  { name: 'Vertical root fracture', sub: 'starts in the root', ry: -Math.PI / 2 + 0.55, info: 'A crack that starts in the root, usually of a root-filled tooth, and runs along it from cheek to tongue side. It causes a narrow, deep pocket and bone loss beside the root; the tooth or that root usually has to be removed.' }
];

const teeth = KINDS.map((K, i) => {
  const t = DK.tooth(FDI), s = t.spec, L = t.layers;
  t.group.position.set((i - 2) * GAP, 0, 0); t.group.rotation.y = K.ry; t.group.updateMatrixWorld(true);
  const probes = [];
  [L.enamel, L.dentin, L.root].forEach(obj => obj.traverse(m => {
    if (!m.isMesh || m.userData.isStencil) return;
    const p = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); p.visible = false; p.userData.probe = true;
    m.parent.add(p); p.position.copy(m.position); p.quaternion.copy(m.quaternion); p.scale.copy(m.scale); p.updateMatrixWorld(true); probes.push(p);
  }));
  return { K, t, s, L, probes };
});

// --- the five cracks
// 1 craze lines: short planes into the buccal enamel only (~0.6 mm deep), three of them
const c0 = teeth[0];
[[-2.6, 1.6, 5.2], [0.6, 0.8, 6.0], [3.0, 2.2, 5.0]].forEach(([x, y0, y1]) => crackSheet(c0, { O: [x, 0, 0], R: [0, 1, 0], D: [0, 0, 1], r0: y0, r1: y1, nr: 14, nt: 6, tint: 0.08, line: 0.03, lineOpacity: 0.55,
  lim: (r, iv) => iv[1] > 0 ? [iv[1] - 0.6 * Math.sin(Math.PI * (r - y0) / (y1 - y0)) ** 0.5, iv[1] + 0.04] : null, width: (r, t, f) => 0.03 + 0.09 * f }));
// 2 fractured cusp: an oblique plane under the mesiolingual cusp, from the chewing surface out at the lingual neck
const c1 = teeth[1], s1 = c1.s;
const fcA = new THREE.Vector3(0, s1.crownL + 1.2, -1.4), fcB = new THREE.Vector3(0, 0.2, -s1.blC / 2 - 0.4), fcV = fcB.clone().sub(fcA).normalize();
crackSheet(c1, { O: fcA.toArray(), R: fcV.toArray(), D: [1, 0, 0], r0: 0, r1: fcA.distanceTo(fcB) + 0.6, nr: 36, nt: 28,
  lim: (r, iv) => [Math.max(iv[0], 0.6), iv[1] + 0.04], width: (r) => 0.06 + 0.14 * (1 - r / fcA.distanceTo(fcB)) });
// 3 cracked tooth: front to back along the central groove, from the surface down toward the pulp roof; deeper along the
// marginal ridges, stopping short of the pulp
const c2 = teeth[2], s2 = c2.s;
const ROOF = (() => { let top = -1e9; const g = c2.t.group; for (let x = -2; x <= 2; x += 0.25) { const o = g.localToWorld(new THREE.Vector3(x, 30, 0)), d = g.localToWorld(new THREE.Vector3(x, 0, 0)).sub(o).normalize(); rc.set(o, d); const h = rc.intersectObject(c2.L.pulp, true).filter(q => !q.object.userData.isStencil); if (h.length) top = Math.max(top, g.worldToLocal(h[0].point.clone()).y); } return top > -1e8 ? top : 3; })();
const deep = (x, k) => { const a = Math.min(1, Math.abs(x) / (s2.md / 2)); return ROOF + 0.5 - (ROOF + 0.5 - k) * Math.pow(DK.util.smooth(0.35, 1, a), 1.4); };
crackSheet(c2, { O: [0, 0, 0], R: [1, 0, 0], D: [0, 1, 0], r0: -s2.md / 2 - 0.2, r1: s2.md / 2 + 0.2, nr: 48, nt: 18,
  pick: 'hull', lim: (r, iv) => iv[1] > 2 ? [Math.max(iv[0], deep(r, 1.0)), iv[1] + 0.04] : null, width: (r, t, f) => 0.04 + 0.16 * f * f });
// 4 split tooth: the same plane all the way through, so the tooth is in two halves, drawn pulled apart (gap exaggerated).
// A second copy of the tooth is the lingual half; each copy is clipped at its own z = 0 and capped with the fracture face.
const c3 = teeth[3], s3 = c3.s, SPLIT = 0.7;
const face = (() => {   // the full cross-section in the plane z = 0, sampled with the first copy (before anything moves)
  const NR = 60, NT = 30, rows = [];
  for (let i = 0; i <= NR; i++) { const x = -s3.md / 2 - 0.3 + (s3.md + 0.6) * i / NR, ivs = intervals(c3, [x, 0, 0], [0, 1, 0]); rows.push({ x, span: ivs.length ? [ivs[0][0], ivs[ivs.length - 1][1]] : null }); }
  let last = rows.find(q => q.span); rows.forEach(q => { if (q.span) last = q; else q.span = [last.span[0], last.span[0]]; });
  return DK.slabGeometry(NR, NT, (i, j) => { const q = rows[i], y = q.span[0] + (q.span[1] - q.span[0]) * j / NT; return [[q.x, y, -0.005], [q.x, y, 0.005]]; });
})();
const half2 = DK.tooth(FDI); half2.group.position.copy(c3.t.group.position); half2.group.rotation.y = KINDS[3].ry;
const zDir = new THREE.Vector3(Math.sin(KINDS[3].ry), 0, Math.cos(KINDS[3].ry));
c3.t.group.position.addScaledVector(zDir, SPLIT); half2.group.position.addScaledVector(zDir, -SPLIT);
const faceMat = DK.mat('dentin', {}); faceMat.side = THREE.DoubleSide;
[[c3.t, 1], [half2, -1]].forEach(([t, sg]) => {
  t.group.updateMatrixWorld(true);
  const o = t.group.localToWorld(new THREE.Vector3()), n = zDir.clone().multiplyScalar(sg);
  const plane = new THREE.Plane(n, -n.dot(o));
  t.group.traverse(m => { if (m.isMesh && m.material && !m.userData.probe) { m.material = m.material.clone(); m.material.clippingPlanes = [plane]; } });
  const cap = new THREE.Mesh(face, faceMat); cap.position.z = sg * 0.012; t.group.add(cap);
});
fig.part(half2.group, { name: 'Split tooth, tongue half', label: false, info: KINDS[3].info });
// 5 vertical root fracture: bucco-lingual through the mesial root of a root-filled tooth, along most of its length
const c4 = teeth[4], s4 = c4.s, mx = (DK.canalAt(s4, 'MB', -6).x + DK.canalAt(s4, 'ML', -6).x) / 2;
crackSheet(c4, { O: [mx, 0, 0], R: [0, 1, 0], D: [0, 0, 1], r0: -s4.rootL + 1.2, r1: -s4.trunk - 0.6, nr: 40, nt: 20,
  pick: 'hull', lim: (r, iv) => [iv[0] - 0.04, iv[1] + 0.04], width: (r) => 0.06 + 0.12 * DK.util.smooth(-s4.trunk - 0.6, -s4.rootL + 2, r) });
// the root filling: pulp removed, canals filled, chamber and access sealed
c4.L.pulp.visible = false;
['MB', 'ML', 'D'].forEach(n => c4.t.group.add(DK.guttaPercha(s4, n, { from: -s4.trunk + 0.2 })));
const ch = c4.L.pulp.userData.chamber, chFill = new THREE.Mesh(ch.geometry, DK.mat('composite', {})); chFill.position.copy(ch.position); c4.t.group.add(chFill);

// --- parts and labels (anchors in each tooth's own frame)
const anchors = [
  [0.6, 4.4, s1.bl / 2 + 0.05],
  [2.2, s1.crownL - 0.6, -s1.bl / 2 + 0.6],
  [0, s2.crownL + 0.6, 0.1],
  [0, s3.crownL * 0.5, s3.bl / 2],
  [mx, -s4.rootL * 0.55, DK.toothSurfaceAt(s4, -s4.rootL * 0.55, Math.PI / 2, 0).z]
];
teeth.forEach((w, i) => fig.part(w.t.group, { name: w.K.name, sub: w.K.sub, anchor: anchors[i], labelOffset: i % 2 ? [0, 130] : [0, -130], dim: false, info: w.K.info + ' Shown on a lower left first molar (FDI 36, Universal 19).' }));

// see-through state: the tooth tissue fades only part way, so each crack plane shows how far it runs
const fadeList = [];
teeth.concat([{ t: half2 }]).forEach(w => w.t.group.traverse(m => {
  if (!m.isMesh || m.userData.probe || m.userData.isStencil || !m.material || m.material.color === undefined) return;
  if (m.material.isMeshBasicMaterial) return;   // crack tints and lines stay as they are
  fadeList.push({ m, o: m.material === faceMat ? 0.92 : 0.76 });
}));
fadeList.push({ m: chFill, o: 0.76 });
fig.param('see', 0, k => fadeList.forEach(({ m, o }) => { const mat = m.material; mat.transparent = k > 0.01; mat.opacity = 1 - (1 - o) * k; mat.depthWrite = k < 0.5; mat.needsUpdate = true; }));
fig.standardControls({ explode: false });
fig.view('Surfaces', { set: { see: 0 }, theta: 0.2, phi: 1.25, zoom: 1, focus: 'auto' });
fig.view('How deep', { set: { see: 1 }, theta: 0.2, phi: 1.3, zoom: 1, focus: 'auto' });

// --- story: five solid teeth with fine lines on them → turn → X-ray: the depth of each crack → push in on pairs → all five
const X = i => (i - 2) * GAP, ALL = KINDS.map(K => K.name);
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.3, phi: 1.2, zoom: 1.0, labels: [] },
  { dur: 2.4, hold: 1.8, theta: 0.12, phi: 1.12, labels: ALL },
  { dur: 2.2, hold: 1.4, set: { see: 1 }, theta: 0.18, phi: 1.28, labels: [] },
  { fov: 28, dur: 2.2, hold: 2.2, zoom: 0.5, focus: [(X(0) + X(1)) / 2, 2.5, 0], labels: ['Craze line', 'Fractured cusp'] },
  { dur: 2.2, hold: 2.2, zoom: 0.5, focus: [(X(2) + X(3)) / 2, 0.5, 0], labels: ['Cracked tooth', 'Split tooth'] },
  { dur: 2.0, hold: 2.0, zoom: 0.45, focus: [X(4), -5, 0], labels: ['Vertical root fracture'] },
  { dur: 2.4, hold: 2.8, zoom: 0.72, theta: 0.18, phi: 1.28, focus: 'auto', labels: ALL }
]);
fig.start();
