// Procedure: protrusion of the mandible on an average adult jaw (DK.mandible with the upper jaw, DK.maxilla), seen from the patient's left. The lower incisors slide down the palatal surfaces of the upper incisors to edge to edge (incisal guidance), which lifts the back teeth apart, while both condyles slide forward and down their eminences. Frame: DK.mandible (+x = patient's left, +z anterior, y up; lower CEJs at y = 0); the sagittal cut runs through the left central incisors.
// poster: end
// The incisal drop at each protrusion comes from the teeth themselves: for every millimetre forward the jaw opens just enough for
// the lower incisal edge (31) to stay on the palatal surface of 21 (ray cast once at build), and DK.jawPose turns that into the
// condyle travel down the eminence and the gap at the molars. All numbers in the readout come from the same pose.
const fig = DK.figure({
  fov: 32,
  title: 'Jaw moving forward',
  subtitle: "Protrusion, seen from the patient's left. Average adult jaw; values approximate.",
  view: { theta: Math.PI / 2 - 0.45, phi: 1.5, margin: 0.86 }
});

const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla, discs = m.discs, tmjL = mx.joints.left, tmjR = mx.joints.right;
m.group.updateMatrixWorld(true);
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult mandible with its teeth, under the upper jaw and both temporomandibular joints.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Maxilla', label: false, info: 'Upper jaw with the upper teeth, fixed to the skull.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The mandible moves as one rigid bone: both condyles travel forward together.' });

// ---------- incisal guidance from the teeth: the opening needed at each protrusion ----------
const up21 = mx.teeth.teeth.find(t => t.fdi === 21), lo31 = m.teeth.teeth.find(t => t.fdi === 31);
const worldVerts = mesh => { const p = mesh.geometry.attributes.position, out = [], v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) out.push(v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld).clone()); return out; };
const loV = worldVerts(lo31.tooth.layers.enamel), upV = worldVerts(up21.tooth.layers.enamel);
const loTop = Math.max(...loV.map(v => v.y));
const TIP = loV.filter(v => v.y > loTop - 0.35).reduce((a, b) => (b.z > a.z ? b : a));          // labial incisal corner of 31
const EDGE_Y = Math.min(...upV.map(v => v.y));                                                    // incisal edge of 21
const EDGE = upV.filter(v => v.y < EDGE_Y + 0.35).reduce((a, b) => (b.z > a.z ? b : a));        // its labial corner
const CUTX = TIP.x;                                                                               // the sagittal cut through 31 and 21
const rc = new THREE.Raycaster();
const lingualZ = y => {   // palatal surface of 21 at height y in the cut plane (ray from behind)
  rc.set(new THREE.Vector3(CUTX, y, -30), new THREE.Vector3(0, 0, 1)); const h = rc.intersectObject(up21.tooth.layers.enamel, false);
  return h.length ? h[0].point.z : null;
};
const tipAt = (p, d) => m.solve({ protrusion: p, disclude: d }).apply(TIP);
const fits = (p, d) => { const t = tipAt(p, d); if (t.y <= EDGE_Y + 0.05) return true; const z = lingualZ(t.y); return z === null || t.z <= z - 0.08; };
const STEP = 0.25, GUIDE = [];
let PE = 0;
for (let p = 0; p <= 9; p += STEP) {
  let lo = 0, hi = 4.5;
  if (fits(p, 0)) hi = 0; else for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; fits(p, mid) ? (hi = mid) : (lo = mid); }
  const d = Math.max(hi, GUIDE.length ? GUIDE[GUIDE.length - 1] : 0);
  GUIDE.push(d);
  if (tipAt(p, d).z >= EDGE.z - 0.15) { PE = p; break; }
}
if (!PE) PE = (GUIDE.length - 1) * STEP;
const discAt = p => { const f = Math.min(p / STEP, GUIDE.length - 1), i = Math.floor(f), a = f - i; return GUIDE[i] * (1 - a) + (GUIDE[Math.min(i + 1, GUIDE.length - 1)]) * a; };
console.log('edge to edge at', PE, 'mm, incisal drop', discAt(PE).toFixed(2));

// ---------- section through the left central incisors (sagittal) ----------
const teeth = [...m.teeth.teeth, ...mx.teeth.teeth].map(t => t.tooth.layers);
fig.enableSection([1, 0, 0], [
  { objects: m.bone, color: 0xCCC3B2, kind: 'plain' },
  { objects: mx.bone, color: 0xEAE5DA, kind: 'cortical' },
  { objects: teeth.map(l => l.enamel), color: DK.COLORS.enamelCap },
  { objects: teeth.flatMap(l => [l.dentin, l.root]), color: DK.COLORS.dentinCap },
  { objects: teeth.map(l => l.pulp), color: DK.COLORS.pulpCap },
  { objects: [discs.left.userData.disc, discs.right.userData.disc], color: 0xB89F98, kind: 'plain' },
  { objects: [...discs.left.userData.laminae, ...discs.right.userData.laminae], color: 0xD6C2BC, kind: 'plain' }
]);

// ---------- markers ----------
const accMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: true, depthTest: false });
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xc8c2b6 : 0x6f685d), toneMapped: false, transparent: true });
// the path of the lower incisal edge over the palatal surface of 21, on the cut face (drawn up to the current protrusion)
const guidePath = new THREE.Mesh(new THREE.BufferGeometry(), accMat); guidePath.renderOrder = 30; m.group.add(guidePath);
const guideHead = DK.arrow({ from: [0, 0, 0], to: [0, 0, 1], width: 0.35, head: 1.0, normal: [1, 0, 0], material: accMat }); guideHead.renderOrder = 30; m.group.add(guideHead);
const drawGuide = p => {
  const n = Math.max(2, Math.ceil(p / 0.2)), pts = [];
  for (let i = 0; i <= n; i++) { const q = p * i / n, t = tipAt(q, discAt(q)); pts.push([CUTX - 0.15, t.y, t.z]); }
  guidePath.visible = guideHead.visible = p > 0.4;
  if (!guidePath.visible) return;
  const g = DK.ribbon(pts.slice(0, -1), 0.35, [1, 0, 0]).geometry; guidePath.geometry.dispose(); guidePath.geometry = g;
  const a = pts[pts.length - 2], b = pts[pts.length - 1], dz = b[2] - a[2], dy = b[1] - a[1], L = Math.hypot(dz, dy) || 1;
  const fresh = DK.arrow({ from: a, to: [b[0], b[1] + dy / L * 0.7, b[2] + dz / L * 0.7], width: 0.35, head: 1.0, normal: [1, 0, 0], material: accMat });
  guideHead.geometry.dispose(); guideHead.geometry = fresh.geometry;
};
// condyle paths at the lateral poles (ink) and see-through rest ghosts of both condyles
const OFF = side => m.axes[side].clone().multiplyScalar(m.head.ml / 2 + 0.5);
const paths = {};
['left', 'right'].forEach(side => { const t = DK.tube([[0, 0, 0], [0, 0, 0.1]], 0.38, inkMat, { segments: 32, radial: 8 }); t.userData.noShadow = true; m.group.add(t); paths[side] = t; });
const tracePaths = p => ['left', 'right'].forEach(side => {
  const t = paths[side]; t.visible = p > 0.6; if (!t.visible) return;
  const o = OFF(side), pts = DK.condylePath(m, { protrusion: p, disclude: discAt(p) }, 20)[side].map(q => [q[0] + o.x, q[1] + o.y, q[2] + o.z]);
  const fresh = DK.tube(pts, 0.38, inkMat, { segments: 32, radial: 8 }); t.geometry.dispose(); t.geometry = fresh.geometry; t.children.forEach((c, i) => c.position.copy(fresh.children[i].position));
});
const ghostMat = DK.mat('bone', { opacity: 0.26 }); Object.assign(ghostMat, { depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const ghosts = ['left', 'right'].map(s => { const g = new THREE.Mesh(m.condyles[s].geometry, ghostMat); g.userData.noShadow = true; g.renderOrder = 2; g.visible = false; m.group.add(g); return g; });

// ---------- the pose ----------
let pose = m.solve({ protrusion: 0 }), prot = 0;
const M36 = (() => { const t = m.teeth.teeth.find(q => q.fdi === 36); const v = worldVerts(t.tooth.layers.enamel); const top = Math.max(...v.map(q => q.y)); return v.filter(q => q.y > top - 0.3)[0]; })();
const slider = fig.slider('Forward', 0, PE, 0.1, 0, v => fig.goTo({ set: { prot: v } }, 0));
fig.param('prot', 0, v => {
  prot = v; pose = m.pose({ protrusion: v, disclude: discAt(v) }); slider.value = v;
  drawGuide(v); tracePaths(v); ghosts.forEach(g => { g.visible = v > 0.6; });
});
fig.param('context', 0.85, v => DK.fadeMaterial(mx.maxilla.material, v));
[tmjR, tmjL].forEach(t => { t.userData.line.material.transparent = true; });
fig.param('fossa', 0.3, v => { [mx.temporal.left, mx.temporal.right].forEach(b => DK.fadeMaterial(b.material, v)); });
fig.param('line', 1, v => { [tmjR, tmjL].forEach(t => { t.userData.line.material.opacity = v; t.userData.line.visible = v > 0.01; }); });
fig.param('arches', 0.85, v => [mx.zygoma.left, mx.zygoma.right].forEach(b => DK.fadeMaterial(b.material, v)));

// ---------- labels ----------
const L = m.centres.left, headTop = side => { const c = m.centres[side]; return [c.x, c.y + m.head.si / 2, c.z]; };
fig.part(up21.tooth.group, { inPlace: true, name: 'Upper incisor', anchor: [0, up21.spec.crownL * 0.75, 2.6], labelOffset: [-60, -70], dim: false,
  info: 'Upper left central incisor, FDI 21 (Universal 9). Its palatal surface is the ramp the lower incisors slide down.' });
fig.part(lo31.tooth.group, { inPlace: true, name: 'Lower incisor', anchor: [0, lo31.spec.crownL * 0.45, 2.2], labelOffset: [-70, 70], dim: false,
  info: 'Lower left central incisor, FDI 31 (Universal 24).' });
const guidePart = fig.part(guidePath, { inPlace: true, name: 'Incisal guidance', sub: 'down the palatal surface', accent: true, anchor: () => { const t = tipAt(prot, discAt(prot)); return [CUTX - 0.15, t.y, t.z]; }, labelOffset: [-110, 40], dim: false, when: (e, sec) => guidePath.visible && sec.enabled && sec.offset < CUTX + 2,
  info: 'Anterior (incisal) guidance: the lower incisal edges slide down the palatal surfaces of the upper incisors to edge to edge. The steeper the overbite, the more the jaw has to drop.' });
fig.part(guideHead, { inPlace: true, name: 'Edge to edge', anchor: () => { const t = tipAt(prot, discAt(prot)); return [CUTX + 3, t.y, t.z + 0.6]; }, labelOffset: [-90, 50], dim: false, when: (e, sec) => prot >= PE - 0.05 && !sec.enabled,
  info: 'Edge to edge: the lower incisal edges meet the upper ones. Here the incisors carry the contact and every back tooth is apart.' });
const gapPart = fig.part(m.teeth.teeth.find(q => q.fdi === 46).tooth.group, { inPlace: true, name: 'Back teeth apart', sub: '', anchor: [0, 8.2, 0], labelOffset: [60, 70], dim: false, when: () => prot > 0.6,
  info: 'Because the incisors guide the jaw down as it comes forward, the premolars and molars separate (posterior disclusion), so they are not loaded sideways.' });
fig.part(m.condyles.left, { inPlace: true, name: 'Condyle', sub: 'forward and down', anchor: headTop('left'), labelOffset: [80, -70], dim: false,
  info: 'Both condyles slide forward and down the back slope of their articular eminences, carrying their discs with them.' });
fig.part(mx.temporal.left, { inPlace: true, name: 'Articular eminence', anchor: tmjL.userData.anchors.crest, labelOffset: [-80, -80], dim: false,
  info: 'The convex slope in front of the fossa. Its steepness sets how far the condyles drop on protrusion (sagittal condylar guidance, about 30 to 40 degrees, varies by person and method).' });
fig.part(discs.left, { inPlace: true, name: 'Disc', anchor: discs.left.userData.anchors.lateral, labelOffset: [90, 50], dim: false,
  info: 'The biconcave articular disc rides forward with the condyle, its thin middle zone between condyle and eminence.' });

let shown = '';
fig.onFrame(() => {
  const key = prot.toFixed(1); if (key === shown) return; shown = key;
  const gap = M36.y - pose.apply(M36).y, I = pose.incisal, C = pose.condyles.left;
  gapPart.sub = `about ${gap.toFixed(1)} mm`; gapPart.el.innerHTML = gapPart.name + '<small>' + gapPart.sub + '</small>';
  fig.setReadout(prot < 0.05 ? [{ k: 'Jaw', v: 'closed, teeth together' }] : [
    { k: 'Lower incisors', v: `${I.forward.toFixed(1)} mm forward, ${I.drop.toFixed(1)} mm down` + (prot >= PE - 0.05 ? ' (edge to edge)' : '') },
    { k: 'First molars apart', v: `${gap.toFixed(1)} mm` },
    { k: 'Condyles', v: `${C.forward.toFixed(1)} mm forward, ${C.down.toFixed(1)} mm down` }]);
});
fig.standardControls({ explode: false, section: { label: 'Incisor cut', on: false, range: [CUTX - 6, CUTX + 30], offset: CUTX } });

// ---------- procedure ----------
const INC = [CUTX, 7, 0];
const JOINT = { theta: Math.PI / 2, phi: 1.5, zoom: 0.2, fov: 28, focus: [L.x, L.y - 1, L.z + 5] };
const HERO = { theta: Math.PI / 2 - 0.2, phi: 1.55, zoom: 0.66, focus: [20, 8, -38], fov: 32 };
const QUIET = { context: 0.85, fossa: 0.1, arches: 0.25, line: 1 };
fig.procedure([
  { label: 'Teeth together', caption: 'Teeth together: the upper incisors overlap the lower ones and the condyles sit in their fossae.', beats: [
    Object.assign({ dur: 0, hold: 1.4, section: false, set: Object.assign({ prot: 0 }, QUIET), labels: ['Upper incisor', 'Lower incisor', 'Condyle'], key: true }, HERO)] },
  { label: 'Incisors guide', caption: 'The lower incisors slide forward and down the palatal surfaces of the upper incisors to edge to edge.', beats: [
    { dur: 0, hold: 0, section: true, offset: CUTX + 30 },
    { dur: 2.4, hold: 0.3, theta: Math.PI / 2, phi: 1.55, zoom: 0.3, fov: 26, focus: INC, offset: CUTX, labels: ['Upper incisor', 'Lower incisor'] },
    { dur: 3.0, hold: 1.8, set: { prot: PE }, labels: ['Incisal guidance', 'Upper incisor', 'Lower incisor'], key: true }] },
  { label: 'Back teeth part', caption: 'Guided down by the incisors, the back teeth lift apart.', beats: [
    { dur: 0, hold: 0, section: false },
    { dur: 2.2, hold: 0.3, theta: Math.PI / 2 - 0.15, phi: 1.57, zoom: 0.3, fov: 30, focus: [27, 8, -24], set: { prot: 0 }, labels: [] },
    { dur: 2.4, hold: 1.8, set: { prot: PE }, labels: ['Back teeth apart'], key: true }] },
  { label: 'Condyles slide', caption: 'Both condyles slide forward and down their eminences, each with its disc.', beats: [
    Object.assign({ dur: 2.4, hold: 0.3, set: { prot: 0, context: 0.04, fossa: 0.0, arches: 0.0, line: 1 }, labels: ['Disc', 'Articular eminence'] }, JOINT),
    { dur: 2.4, hold: 1.8, set: { prot: PE }, labels: ['Condyle', 'Disc', 'Articular eminence'], key: true }] },
  { label: 'Edge to edge', caption: 'At edge to edge: incisors touching, back teeth apart, condyles down the eminences.', beats: [
    Object.assign({ dur: 2.6, hold: 2.6, set: QUIET, labels: ['Edge to edge', 'Back teeth apart', 'Condyle'], key: true }, HERO)] }
]);
fig.view('Incisors', { theta: Math.PI / 2, phi: 1.55, zoom: 0.3, fov: 26, focus: INC, section: true, offset: CUTX, labels: ['Incisal guidance', 'Upper incisor', 'Lower incisor'] });
fig.view('Joint', Object.assign({ section: false, set: { context: 0.04, fossa: 0.0, arches: 0.0, line: 1 }, labels: ['Condyle', 'Disc', 'Articular eminence'] }, JOINT));
fig.start();
