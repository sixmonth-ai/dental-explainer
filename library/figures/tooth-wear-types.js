// Four kinds of tooth wear side by side on four copies of the mandibular left first premolar (FDI 34 = Universal 21); each tooth turned so its buccal faces world +x, cut bucco-lingually by one plane (world z = 0); frame per tooth: +x mesial, +z buccal, CEJ at y = 0.
// poster: end
// Erosion (acid): smooth, rounded thinning of the enamel on the chewing and cheek surfaces, cupped dentin. Attrition (grinding):
// a flat facet across the cusp with a dentin island. Abrasion (brushing): a shallow, rounded groove at the neck. Abfraction
// (flexing, the least certain cause): a sharp, deep wedge at the neck. The kit has no wear builder: each tooth's own enamel and
// dentin meshes are deformed in place (same vertices, so the cut faces follow), and the lost tissue is outlined on the cut.
// Shapes are schematic and qualitative; dental-facts.md has no wear numbers.
const FDI = 34, GAP = 12.5;
const fig = DK.figure({
  fov: 28,
  title: 'Four kinds of tooth wear',
  subtitle: 'Lower left first premolar, FDI 34 (Universal 21), cut cheek to tongue. Cheek side on the right.',
  view: { theta: 0.55, phi: 1.2 }
});

// --- deformations, in the tooth frame. Each returns the new [x, y, z] of a vertex at full wear (k = 1).
const TYPES = [
  { name: 'Erosion', sub: 'acid: smooth, rounded loss', info: 'Acid from drinks, food or the stomach softens enamel, which then wears away as smooth, rounded, shiny surfaces. Cusps become cupped and fillings can stand proud. Not caused by bacteria.' },
  { name: 'Attrition', sub: 'grinding: flat facet', info: 'Tooth-against-tooth wear, as in grinding: flat, polished facets that match the opposing teeth, with sharp edges and a dentin island in the middle once the enamel is through.' },
  { name: 'Abrasion', sub: 'brushing: shallow groove', info: 'Wear by something other than teeth, most often a hard brush and abrasive paste scrubbed across the neck: a broad, rounded, shallow groove, usually on the cheek side.' },
  { name: 'Abfraction', sub: 'flexing: sharp wedge', info: 'A sharp, deep, wedge-shaped notch at the neck. It is thought to start where the tooth flexes under heavy bite forces; this cause is still debated, and brushing and acid usually add to it.' }
];
const sm = (a, b, v) => DK.util.smooth(a, b, v);

const teeth = TYPES.map((T, i) => {
  const t = DK.tooth(FDI), s = t.spec, L = t.layers;
  t.group.position.set((i - 1.5) * GAP, 0, 0);
  t.group.rotation.y = Math.PI / 2;            // tooth +z (buccal) → world +x
  const meshes = [];
  [['enamel', L.enamel], ['dentin', L.dentin]].forEach(([kind, obj]) => obj.traverse(m => {
    if (!m.isMesh || m.userData.isStencil || meshes.some(q => q.geo === m.geometry)) return;
    meshes.push({ kind, geo: m.geometry, orig: Float32Array.from(m.geometry.attributes.position.array) });
  }));
  let top = -1e9, topZ = 0; meshes.filter(q => q.kind === 'enamel').forEach(q => { for (let j = 1; j < q.orig.length; j += 3) if (q.orig[j] > top) { top = q.orig[j]; topZ = q.orig[j + 1]; } });
  return { T, t, s, L, meshes, top, topZ };
});

// the four displacement fields (applied to every enamel and dentin vertex)
const inward = (x, z, d) => { const r = Math.hypot(x, z) || 1; return [x - x / r * d, z - z / r * d]; };
function deform(k, w, x, y, z, kind) {
  const s = w.s, i = TYPES.indexOf(w.T);
  if (i === 0) {   // erosion: enamel thinned on the occlusal and buccal surfaces, deepest on the cusps; dentin cupped under the cusp tips
    const occ = sm(s.crownL * 0.45, s.crownL * 0.95, y);
    let d = kind === 'enamel' ? 0.9 * sm(0.6, 3.2, y) * (0.5 + 0.5 * occ) : 0.55 * sm(w.top - 2.6, w.top - 0.9, y) * sm(-1.5, 0.5, z);
    d *= k; if (d <= 0) return [x, y, z];
    const c = [0, s.crownL * 0.35, 0], v = [x - c[0], y - c[1], z - c[2]], r = Math.hypot(...v) || 1;
    return [x - v[0] / r * d, y - v[1] / r * d, z - v[2] / r * d];
  }
  if (i === 1) {   // attrition: everything above a plane is ground flat (enamel just below the dentin so the island shows)
    const plane = w.top - 2.4 * k + 0.02, cap = kind === 'enamel' ? plane - 0.02 * k : plane;
    return [x, Math.min(y, cap), z];
  }
  if (i === 2) {   // abrasion: a broad, shallow, rounded groove at the buccal neck, mostly on root
    const ang = Math.atan2(z, x), wa = Math.pow(Math.max(0, Math.sin(ang)), 2.2);
    const d = k * 0.95 * wa * Math.exp(-Math.pow((y + 0.35) / 1.25, 2));
    const [nx, nz] = inward(x, z, d); return [nx, y, nz];
  }
  // abfraction: a deep, sharp V at the buccal neck, apex just above the CEJ
  const ang = Math.atan2(z, x), wa = Math.pow(Math.max(0, Math.sin(ang)), 3.5);
  const yA = 0.1, v = y >= yA ? 1 - (y - yA) / 1.6 : 1 - (yA - y) / 1.1;
  const d = k * 1.45 * wa * Math.max(0, v) * Math.max(0, v > 0 ? 1 : 0);
  const [nx, nz] = inward(x, z, d); return [nx, y, nz];
}
const wearK = [0, 0, 0, 0];
function applyWear(i, k) {
  const w = teeth[i]; wearK[i] = k;
  w.meshes.forEach(q => {
    const a = q.geo.attributes.position, o = q.orig;
    for (let j = 0; j < o.length; j += 3) { const p = deform(k, w, o[j], o[j + 1], o[j + 2], q.kind); a.array[j] = p[0]; a.array[j + 1] = p[1]; a.array[j + 2] = p[2]; }
    a.needsUpdate = true; q.geo.computeVertexNormals(); q.geo.computeBoundingSphere(); q.geo.computeBoundingBox();
  });
}

// --- the lost tissue on the cut face: rays in the plane x = 0 (tooth frame) toward the crown centre, before and after
const rc = new THREE.Raycaster();
const outline = (w) => {
  w.t.group.updateMatrixWorld(true);
  const objs = [w.L.enamel, w.L.dentin], C = new THREE.Vector3(0, TYPES.indexOf(w.T) < 2 ? w.s.crownL * 0.4 : 0.1, 0), pts = [];
  const N = 600, A0 = -1.25, A1 = Math.PI + 1.25;
  for (let n = 0; n <= N; n++) {
    const a = A0 + (A1 - A0) * n / N, dir = new THREE.Vector3(0, Math.sin(a), Math.cos(a));   // a = 0: buccal (+z), pi/2: up
    const o = C.clone().addScaledVector(dir, 16), oW = w.t.group.localToWorld(o.clone()), cW = w.t.group.localToWorld(C.clone());
    rc.set(oW, cW.clone().sub(oW).normalize());
    const h = rc.intersectObjects(objs, true).filter(q => !q.object.userData.isStencil);
    pts.push(h.length ? w.t.group.worldToLocal(h[0].point.clone()) : null);
  }
  for (let n = 0; n < pts.length; n++) if (!pts[n]) { const a = pts[n - 1], b = pts.slice(n + 1).find(Boolean); if (a && b) pts[n] = a.clone().lerp(b, 0.5); }
  return pts;
};
const LIFT = -0.12;   // just in front of the cut face (the camera side is the tooth's distal, -x)
const lossMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const edgeMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
teeth.forEach((w, i) => {
  const before = outline(w); applyWear(i, 1); const after = outline(w); applyWear(i, 0);
  const grp = new THREE.Group(); w.loss = grp; w.lossAnchor = null;
  let run = [];
  const flush = () => {
    if (run.length > 2) {
      const sh = new THREE.Shape(); const ring = run.map(r => r[0]).concat(run.map(r => r[1]).reverse());
      ring.forEach((p, n) => n ? sh.lineTo(p.z, p.y) : sh.moveTo(p.z, p.y));
      const g = new THREE.ShapeGeometry(sh), P = g.attributes.position;
      for (let n = 0; n < P.count; n++) { const zz = P.getX(n), yy = P.getY(n); P.setXYZ(n, LIFT, yy, zz); }
      const m = new THREE.Mesh(g, lossMat); m.renderOrder = 5; grp.add(m);
      const edge = DK.ribbon(run.map(r => [LIFT - 0.01, r[0].y, r[0].z]), 0.09, [1, 0, 0], { material: edgeMat }); edge.renderOrder = 6; grp.add(edge);
      const mid = run[Math.floor(run.length / 2)]; if (!w.lossAnchor) w.lossAnchor = [LIFT, (mid[0].y + mid[1].y) / 2, (mid[0].z + mid[1].z) / 2];
    }
    run = [];
  };
  const lost = before.map((p, n) => !!(p && after[n] && p.distanceTo(after[n]) > 0.06));
  before.forEach((p, n) => { const q = after[n], bridge = !lost[n] && p && q && run.length && lost.slice(n + 1, n + 4).some(Boolean); if (p && q && (lost[n] || bridge)) run.push([p, q]); else flush(); });
  flush();
  w.t.group.add(grp);
});

// --- parts and labels
const cutOn = (e, sec) => sec.enabled;
teeth.forEach((w, i) => {
  const s = w.s;
  const anchor = [[0, s.crownL + 0.6, 0.6], [0, w.top - 2.4, w.topZ], [0, -0.4, s.blC / 2 - 0.3], [0, 0.2, s.blC / 2 - 0.6]][i];
  fig.part(w.t.group, { name: w.T.name, sub: w.T.sub, anchor, labelOffset: i < 2 ? [-30, -110] : [70, 120], dim: false, info: w.T.info + ' Shown on a lower left first premolar (FDI 34, Universal 21).' });
});
fig.part(teeth[3].loss, { inPlace: true, name: 'Tooth lost', anchor: () => teeth[3].lossAnchor || [0, 0, 0], labelOffset: [110, -40], accent: true, dim: false, when: () => lossMat.opacity > 0.15, info: 'The tinted area marks the tooth that has worn away; its outline is the original surface. Enamel does not grow back, so wear is stopped and, if needed, repaired with a filling.' });

// --- section: one plane (world z = 0) cuts every tooth cheek to tongue; the camera on +z looks at the cut faces
const G = (k) => teeth.map(w => w.L[k]);
fig.enableSection([0, 0, 1], [
  { objects: G('enamel'), color: DK.COLORS.enamelCap },
  { objects: G('dentin').concat(G('root')), color: DK.COLORS.dentinCap },
  { objects: G('pulp'), color: DK.COLORS.pulpCap }
]);
lossMat.clippingPlanes = edgeMat.clippingPlanes = [];   // overlays sit in front of the cut face
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 3], offset: 0 } });

// --- params: the wear grows on all four together; the loss overlay fades in on the cut
fig.param('wear', 0, k => teeth.forEach((w, i) => applyWear(i, k)));
fig.param('loss', 0, k => { lossMat.opacity = 0.32 * k; edgeMat.opacity = 0.95 * k; teeth.forEach(w => { w.loss.visible = k > 0.01; }); });
fig.view('Profiles', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: true, offset: 0, set: { wear: 1, loss: 1 } });
fig.view('Surfaces', { theta: 0.55, phi: 1.2, zoom: 1, focus: 'auto', section: false, set: { wear: 1, loss: 0 } });

// --- story: four intact teeth → the wear eats in → turn to the cut, which sweeps in → the lost tissue lights up → push in on the
// crowns (erosion, attrition) and the necks (abrasion, abfraction) → all four, labelled (teaching shot)
const X = i => (i - 1.5) * GAP, ALL = TYPES.map(T => T.name);
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.6, phi: 1.2, zoom: 1.0, section: false, labels: [] },
  { dur: 2.6, hold: 1.6, theta: 0.5, phi: 1.15, set: { wear: 1 }, labels: ALL },
  { fov: 26, dur: 2.0, hold: 0.2, theta: 0.02, phi: 1.5, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.2, hold: 0.4, offset: 0, labels: [] },
  { dur: 1.4, hold: 1.0, set: { loss: 1 }, labels: ['Tooth lost'] },
  { dur: 2.2, hold: 2.2, zoom: 0.55, focus: [(X(0) + X(1)) / 2, 6.5, 0], labels: ['Erosion', 'Attrition'] },
  { dur: 2.2, hold: 2.2, zoom: 0.55, focus: [(X(2) + X(3)) / 2, 1.5, 0], labels: ['Abrasion', 'Abfraction', 'Tooth lost'] },
  { dur: 2.4, hold: 2.6, theta: 0.02, phi: 1.48, zoom: 0.86, focus: [0, 2.2, 0], labels: ALL.concat(['Tooth lost']) }
]);
fig.start();
