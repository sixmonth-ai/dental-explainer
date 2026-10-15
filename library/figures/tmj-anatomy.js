// Story: the jaw joint (TMJ) in anatomy. Opens on the whole jaw (DK.mandible + DK.maxilla) for orientation, then the bones dissolve into a sagittal section through the patient's LEFT joint seen from the left side (face to the viewer's left), which names the glenoid fossa, articular eminence, the disc's three bands, condyle, retrodiscal tissue and lateral pterygoid, mouth closed. Frame: DK.mandible (+x = patient's left, +z anterior, y up). The section is a slab group placed at the left condyle centre and turned so its own frame (+x anterior, +y up, -z lateral) maps onto the jaw frame.
// poster: end
// DK.articularDisc and DK.maxilla cannot show the joint as a clean sagittal section (it read as a box), so the joint is built from traced
// sagittal outlines (same build as mouth-opening and disc-displacement): temporal bone with a thin fossa roof under the cranial cavity,
// eminence, postglenoid process and ear canal; condyle, neck, sigmoid notch and coronoid; biconcave disc 2 / 1 / 3 mm; retrodiscal tissue;
// both heads of the lateral pterygoid. Sizes from dental-facts §21.
const fig = DK.figure({
  fov: 32,
  title: 'The jaw joint',
  subtitle: "Patient's left jaw joint, cut front to back, mouth closed. Average adult.",
  view: { theta: 0.62, phi: 1.28, margin: 0.86 }
});
// ---------- the whole jaw for orientation ----------
const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla, L = m.centres.left;
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult mandible under the upper jaw, hinged to the skull at two jaw joints, one in front of each ear.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'Maxilla with the upper teeth, cut flat below the orbits.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The lower jaw: one bone hinged at both joints, so the two joints always work together.' });
fig.part(m.condyles.left, { inPlace: true, name: 'Jaw joint', sub: 'in front of the ear', anchor: [L.x + m.head.ml / 2 - 1, L.y + 2, L.z], labelOffset: [90, -80], dim: false, when: () => mix < 0.2,
  info: 'The temporomandibular joint: the condyle of the lower jaw sits in a hollow of the skull just in front of the ear canal.' });
// ---------- the section slab, at the left condyle (slab frame: +x anterior, +y up, -z lateral) ----------
const slab = new THREE.Group(); slab.position.copy(L); slab.rotation.y = -Math.PI / 2; m.group.add(slab); slab.visible = false;
let mix = 0;
const V2 = (x, y) => new THREE.Vector2(x, y);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;

// ---------- outlines (x anterior, y up) ----------
const spline = (pts, n, closed) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), closed, 'centripetal').getSpacedPoints(n).map(v => V2(v.x, v.y));
// the articular surface of the temporal bone, posterior → anterior: tympanic plate, postglenoid process, fossa roof, eminence, preglenoid plane
const SURF = [[-70, -12], [-40, -11], [-22, -10.5], [-15.5, -8.5], [-10.5, -5.2], [-8.2, -2.4], [-7.0, -0.2], [-6.2, 1.6], [-5.2, 4.4], [-3.4, 7.0], [-0.8, 8.3], [1.8, 8.0], [4.4, 6.2], [6.9, 3.4], [9.2, 1.2], [11.2, 0.3], [13.2, 0.8], [16, 2.4], [21, 4.0], [30, 5.0], [42, 5.6], [60, 6.2], [90, 6.6]];
const surf = spline(SURF, 260, false);
const S = x => {   // height of the articular surface at x (joint region, where it is a function of x)
  for (let i = 1; i < surf.length; i++) { const a = surf[i - 1], b = surf[i]; if (a.x <= x && b.x >= x && a.x > -6.5) return a.y + (b.y - a.y) * (x - a.x) / Math.max(1e-6, b.x - a.x); }
  return 50;
};
// the cerebral surface: the fossa roof is a thin plate (about 2 mm) under the middle cranial fossa; the eminence and the bone around the ear canal are thick
const TOP = [[90, 9.0], [60, 9.3], [42, 9.6], [26, 10.0], [15, 11.2], [7.5, 10.9], [2.5, 10.3], [-2, 10.4], [-6.5, 11.8], [-11, 13.2], [-17, 15.6], [-26, 19], [-40, 22], [-70, 26]];
const temporalPts = surf.concat(spline(TOP, 120, false));
const meatus = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => { const a = -i / n * Math.PI * 2; return V2(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); });
const R = 4.5;                                      // radius of the condylar head in this section (about 9 mm front to back, facts §21)
const condylePts = (() => {
  const head = []; for (let a = 8; a <= 172; a += 4) head.push([R * Math.cos(a * D2R), R * Math.sin(a * D2R)]);
  const post = [[-4.55, -1.6], [-4.25, -5], [-4.6, -9], [-5.4, -15], [-6.6, -26], [-7.6, -46], [-8.6, -80]];
  const ant = [[26, -80], [27, -46], [28.5, -26], [29.8, -10], [29.2, -2.2], [27.4, 0.9], [25.2, -0.4], [21.5, -5.5], [17, -10.6], [13, -13.2], [8.4, -12], [5.4, -8.6], [4.1, -5.2], [3.7, -3.6], [4.5, -1.2]];   // ramus, coronoid process, sigmoid notch
  return spline(head.concat(post, ant), 360, true);
})();
const offsetIn = (pts, d) => {   // a closed polygon moved inward by d (counter-clockwise outline)
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) { const p = pts[(i - 1 + n) % n], q = pts[(i + 1) % n], t = V2(q.x - p.x, q.y - p.y).normalize(); out.push(V2(pts[i].x - t.y * d, pts[i].y + t.x * d)); }
  return out;
};
const ccw = pts => THREE.ShapeUtils.isClockWise(pts) ? pts.slice().reverse() : pts;

// a closed slab from an outline (optionally with holes), centred on z = 0
const slabGeo = (pts, depth, holes, bevel) => {
  const sh = new THREE.Shape(ccw(pts)); (holes || []).forEach(h => sh.holes.push(new THREE.Path(THREE.ShapeUtils.isClockWise(h) ? h : h.slice().reverse())));
  const b = bevel ?? 0.5;
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 12 });
  g.translate(0, 0, -depth / 2); g.clearGroups(); g.computeVertexNormals(); return g;
};
const live = (mat) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.set = (pts, depth, bevel) => {   // a slab whose outline changes: attributes replaced in place (the section keeps this geometry object)
  const g = slabGeo(pts, depth, null, bevel), d = m.geometry; d.setAttribute('position', g.attributes.position); d.setAttribute('normal', g.attributes.normal);
  if (g.attributes.uv) d.setAttribute('uv', g.attributes.uv); d.setIndex(g.index); d.computeBoundingSphere(); d.computeBoundingBox(); g.dispose(); }; return m; };

// ---------- bone: temporal bone and condyle, each a cortical shell over cancellous bone ----------
const boneMat = DK.mat('bone');
const hole = meatus(-14.2, -1.8, 3.6, 4.2, 48);
const temporal = new THREE.Mesh(slabGeo(temporalPts, 30, [hole], 0.8), boneMat);
const temporalIn = new THREE.Mesh(slabGeo(offsetIn(ccw(temporalPts), 1.1), 29, [meatus(-14.2, -1.8, 4.6, 5.2, 48)], 0.4), DK.mat('bone'));
const condyle = new THREE.Group();
const condyleOut = new THREE.Mesh(slabGeo(condylePts, 18, null, 0.6), boneMat);
const condyleIn = new THREE.Mesh(slabGeo(offsetIn(ccw(condylePts), 0.9), 17.4, null, 0.3), DK.mat('bone'));
condyle.add(condyleOut, condyleIn);
slab.add(temporal, temporalIn, condyle);

// ---------- the disc: biconcave, thick anterior band, thin intermediate zone, thick posterior band ----------
const TH = [[24, 0.7], [34, 1.6], [44, 2.0], [54, 1.6], [68, 1.0], [82, 1.3], [96, 2.6], [108, 3.0], [120, 2.4], [132, 0.9]];   // (angle around the head, thickness) mm
const thick = a => { for (let i = 1; i < TH.length; i++) if (a <= TH[i][0]) { const u = (a - TH[i - 1][0]) / (TH[i][0] - TH[i - 1][0]), s = u * u * (3 - 2 * u); return TH[i - 1][1] + (TH[i][1] - TH[i - 1][1]) * s; } return TH[TH.length - 1][1]; };
const RIN = R + 0.25;
const discOutline = (() => {
  const inner = [], outer = [];
  for (let a = 24; a <= 132; a += 2) { inner.push([RIN * Math.cos(a * D2R), RIN * Math.sin(a * D2R)]); outer.push([(RIN + thick(a)) * Math.cos(a * D2R), (RIN + thick(a)) * Math.sin(a * D2R)]); }
  return spline(inner.concat(outer.reverse()), 220, true);
})();
const discMat = DK.mat('pulp', { color: 0xBFA6A0, cap: 0xB89F98, roughness: 0.55 });
const disc = new THREE.Mesh(slabGeo(discOutline, 15, null, 0.4), discMat);
slab.add(disc);

// ---------- soft tissue that changes shape: retrodiscal tissue, the two heads of the lateral pterygoid ----------
const retroMat = DK.mat('gingiva', { color: 0xD3BDB6, cap: 0xD6C2BC, roughness: 0.8 });
const muscleMat = DK.mat('gingiva', { color: 0xA97C76, cap: 0xA3766F, roughness: 0.75 });
const retro = live(retroMat), supHead = live(muscleMat), infHead = live(muscleMat);
slab.add(retro, supHead, infHead);

// ---------- pose: the condyle rotates first, then slides down the eminence with the disc riding on it ----------
const toWorld = (p, c, ang) => V2(c.x + p.x * Math.cos(ang) - p.y * Math.sin(ang), c.y + p.x * Math.sin(ang) + p.y * Math.cos(ang));
const discPts = discOutline;
const clearY = (cx, ang, pts, margin) => {   // highest centre y at x = cx for which `pts` (local, turned by ang) stay under the articular surface
  let y = 1e9; pts.forEach(p => { const w = toWorld(p, V2(cx, 0), ang); const s = S(w.x); if (s < 49) y = Math.min(y, s - w.y - margin); }); return y;
};
const headPts = Array.from({ length: 37 }, (_, i) => V2(R * Math.cos((10 + i * 4.4) * D2R), R * Math.sin((10 + i * 4.4) * D2R)));
// per mm of opening at the incisors (from DK.jawPose, average jaw): jaw rotation (°) and forward travel of the condyle (mm)
const TAB = { mm: [0, 10, 22, 30, 40, 45], rot: [0, 6.9, 15.7, 20.3, 26.0, 29.4], fwd: [0, 0, 0, 3.71, 8.34, 10.66] };
const look = (k, mm) => { const M = TAB.mm; if (mm <= 0) return 0; for (let i = 1; i < M.length; i++) if (mm <= M[i]) return TAB[k][i - 1] + (TAB[k][i] - TAB[k][i - 1]) * (mm - M[i - 1]) / (M[i] - M[i - 1]); return TAB[k][M.length - 1]; };
const OPEN = 45, ROT_ONLY = 22;
const psiN = mm => 22 * D2R * look('fwd', mm) / TAB.fwd[TAB.fwd.length - 1];   // the disc turns back on the head as the condyle slides forward
const centreAt = mm => { const a = look('fwd', mm); return V2(a, Math.min(clearY(a, psiN(mm), discPts, 0.15), clearY(a, 0, headPts, 1.4))); };
const C0 = centreAt(0);
const st = { open: 0, c: C0.clone(), rot: 0, dc: C0.clone(), dpsi: 0 };
const update = () => {
  const mm = st.open, c = centreAt(mm), rot = -look('rot', mm) * D2R;
  st.c = c; st.rot = rot; st.dc = c; st.dpsi = psiN(mm);
  // retrodiscal tissue: from the back of the disc, along the fossa wall and the postglenoid process, down the back of the neck, and up over the head
  const dw = p => { const w = toWorld(p, st.dc, st.dpsi); return V2(w.x - C0.x, w.y - C0.y); };
  const cw = p => { const w = toWorld(p, c, rot); return V2(w.x - C0.x, w.y - C0.y); };
  const backTop = dw(V2((RIN + thick(130)) * Math.cos(130 * D2R), (RIN + thick(130)) * Math.sin(130 * D2R)));
  const backBot = dw(V2(RIN * Math.cos(128 * D2R), RIN * Math.sin(128 * D2R)));
  const top = []; surf.forEach(p => { const q = V2(p.x - C0.x, p.y - C0.y - 0.15); if (q.x < backTop.x - 0.4 && q.x > -6.4 - C0.x && q.y > -1.8) top.push(q); });
  top.reverse();
  const neck = [cw(V2(-4.75, -1.5)), cw(V2(-4.45, -4.6))];
  const over = []; const aEnd = Math.atan2(backBot.y - (c.y - C0.y), backBot.x - (c.x - C0.x)) / D2R;
  for (let a = 196; a >= Math.max(aEnd + 4, 20); a -= 6) over.push(cw(V2((R + 0.2) * Math.cos(a * D2R), (R + 0.2) * Math.sin(a * D2R))));
  retro.set([backTop, ...top, V2(-6.9 - C0.x, -1.9 - C0.y), ...neck, ...over, backBot], 13, 0.3);
  // lateral pterygoid: superior head to the front of the disc, inferior head to the pterygoid fovea of the neck
  const aFront = dw(V2((RIN + 1.0) * Math.cos(30 * D2R), (RIN + 1.0) * Math.sin(30 * D2R))), fovea = cw(V2(4.2, -4.4));
  const band = (pts, w0, w1) => {   // a tapered band along a smooth polyline (model coordinates in, figure coordinates out)
    const c = spline(pts.map(p => [p.x, p.y]), 40, false), L = [], Rr = [];
    c.forEach((p, i) => { const q = c[Math.min(i + 1, c.length - 1)], o = c[Math.max(i - 1, 0)], d = V2(q.x - o.x, q.y - o.y).normalize(), w = w0 + (w1 - w0) * i / (c.length - 1);
      L.push(V2(p.x - d.y * w, p.y + d.x * w)); Rr.push(V2(p.x + d.y * w, p.y - d.x * w)); });
    return L.concat(Rr.reverse());
  };
  const M = (x, y) => V2(x - C0.x, y - C0.y);
  const fwd = (p, dx, dy) => V2(p.x + dx, p.y + dy);
  supHead.set(band([aFront, fwd(aFront, 4, -1.4), M(Math.max(aFront.x + C0.x + 10, 19), -4.6), M(Math.max(aFront.x + C0.x + 22, 42), -6.5), M(90, -9)], 0.7, 1.5), 10, 0.3);
  infHead.set(band([fovea, fwd(fovea, 5, -2.6), M(Math.max(fovea.x + C0.x + 13, 21), -11.5), M(Math.max(fovea.x + C0.x + 26, 44), -13.5), M(90, -17)], 1.2, 2.6), 12, 0.3);
};
// everything is placed relative to the rest centre: shift the static pieces so the condyle centre at rest is the origin
[temporal, temporalIn].forEach(m => m.position.set(-C0.x, -C0.y, 0));
// the condyle's outline is drawn around its own centre: put the pivot there
const pivot = new THREE.Group(); slab.add(pivot); slab.remove(condyle); pivot.add(condyle);
const placeCondyle = () => { pivot.position.set(st.c.x - C0.x, st.c.y - C0.y, 0); pivot.rotation.z = st.rot; };
const discPivot = new THREE.Group(); slab.add(discPivot); slab.remove(disc); discPivot.add(disc);
const placeDisc = () => { discPivot.position.set(st.dc.x - C0.x, st.dc.y - C0.y, 0); discPivot.rotation.z = st.dpsi; };

const render = () => { update(); placeCondyle(); placeDisc(); };
render();

// ---------- labels on the cut face (slab frame: z = -0.12 is the cut face, toward the camera) ----------
const onCut = (x, y) => [x, y, -0.12];
fig.part(temporal, { inPlace: true, name: 'Glenoid fossa', sub: 'the socket', anchor: onCut(0.4 - C0.x, 8.3 - C0.y), labelOffset: [120, -60], dim: false, when: () => mix > 0.5,
  info: 'Hollow in the temporal bone, just in front of the ear canal, that houses the condyle and disc when the teeth are together. About 6 mm deep; its roof is a thin plate under the brain case.' });
fig.part(temporal, { inPlace: true, name: 'Articular eminence', sub: 'slope in front', anchor: onCut(11.6 - C0.x, 0.6 - C0.y), labelOffset: [-110, -60], dim: false, when: () => mix > 0.5,
  info: 'Convex ridge of the temporal bone in front of the fossa, about 7 mm high. On wide opening the condyle and its disc slide down its back slope.' });
fig.part(temporal, { inPlace: true, name: 'Ear canal', anchor: onCut(-14.2 - C0.x, -1.8 - C0.y + 4.4), labelOffset: [70, -60], dim: false, when: () => mix > 0.5,
  info: 'The external ear canal lies just behind the joint, which is why jaw-joint pain is often felt as earache.' });
fig.part(condyle, { inPlace: true, name: 'Condyle', sub: 'head of the jaw', anchor: [0.5, -3.5, -0.12], labelOffset: [110, 50], dim: false, when: () => mix > 0.5,
  info: 'The rounded top of the lower jaw: about 20 mm wide and 9 mm front to back, its long axis angled inward and back.' });
const bandAt = (a, k) => [(RIN + thick(a) * k) * Math.cos(a * D2R), (RIN + thick(a) * k) * Math.sin(a * D2R), -0.12];
fig.part(disc, { inPlace: true, name: 'Disc', sub: 'thick, thin, thick', accent: true, anchor: bandAt(76, 0.5), labelOffset: [-60, -100], dim: false, when: () => mix > 0.5,
  info: 'Biconcave pad of fibrocartilage between the condyle and the skull, splitting the joint into an upper and a lower space. No vessels or nerves in its central part.' });
fig.part(disc, { inPlace: true, name: 'Posterior band', sub: 'about 3 mm', anchor: bandAt(108, 0.5), labelOffset: [90, -80], dim: false, when: () => mix > 0.5,
  info: 'The thickest part of the disc, sitting on top of the condyle (about 12 o\'clock) when the teeth are together.' });
fig.part(disc, { inPlace: true, name: 'Intermediate zone', sub: 'about 1 mm', anchor: bandAt(70, 0.5), labelOffset: [-40, -110], dim: false, when: () => mix > 0.5,
  info: 'The thin middle of the disc: the condyle works against it in every position, between the head and the slope of the eminence.' });
fig.part(disc, { inPlace: true, name: 'Anterior band', sub: 'about 2 mm', anchor: bandAt(42, 0.5), labelOffset: [-110, -20], dim: false, when: () => mix > 0.5,
  info: 'The front band of the disc; the upper head of the lateral pterygoid attaches here.' });
fig.part(retro, { inPlace: true, name: 'Retrodiscal tissue', anchor: () => [-5.2, 2.6, -0.12], labelOffset: [100, -30], dim: false, when: () => mix > 0.5,
  info: 'Loose, vascular and innervated tissue tying the back of the disc to the fossa (upper layer) and to the condylar neck (lower layer). It fills the space behind the condyle as the jaw opens.' });
fig.part(infHead, { inPlace: true, name: 'Lateral pterygoid', sub: 'two heads', anchor: () => { const p = infHead.geometry.boundingBox; return p ? [Math.min(16, p.max.x - 4), (p.min.y + p.max.y) / 2, -0.12] : [15, -10, 0]; }, labelOffset: [-40, 90], dim: false, when: () => mix > 0.5,
  info: 'Jaw muscle in front of the joint: the upper head attaches to the front of the disc, the lower head to the condylar neck. It pulls the condyle forward when the mouth opens wide.' });

// ---------- section and the dissolve from the whole jaw to the cut ----------
fig.enableSection([1, 0, 0], [
  { objects: [temporal, condyleOut], color: 0xC4B393, kind: 'cortical' },
  { objects: [temporalIn, condyleIn], color: 0xDDCFB3, kind: 'cortical' },
  { objects: [retro], color: 0xD6C2BC, kind: 'gingiva' },
  { objects: [supHead, infHead], color: 0xA3766F, kind: 'gingiva' },
  { objects: [disc], color: 0xB89F98, kind: 'plain' }
]);
const CUT = L.x;
fig.param('mix', 0, k => {
  mix = k; slab.visible = k > 0.02;
  m.bone.forEach(b => DK.fadeMaterial(b.material, 1 - k));
  m.bone.forEach(b => { b.visible = k < 0.98; });
  mx.setOpacity(0.85 * (1 - k), 0.3 * (1 - k));
  [mx.maxilla, mx.zygoma.left, mx.zygoma.right, mx.temporal.left, mx.temporal.right].forEach(b => { b.visible = k < 0.98; });
  m.teeth.group.visible = m.upper.holder.visible = k < 0.35;
  m.group.children.forEach(c => { if (c !== slab && c !== m.jaw && c !== mx.maxilla) c.visible = k < 0.05 || (c === m.upper.holder && k < 0.35); });
});
fig.view('Whole jaw', { theta: 0.62, phi: 1.28, zoom: 1, fov: 32, focus: 'auto', section: false, set: { mix: 0 }, labels: ['Jaw joint'] });
const SEC = { theta: Math.PI / 2, phi: Math.PI / 2, fov: 14, zoom: fig.mode === 'image' ? 0.3 : 0.26, focus: [L.x, L.y - 0.5, L.z + (fig.mode === 'image' ? 8 : 2.5)] };   // image: the ramus clears the footer
const HERO6 = ['Glenoid fossa', 'Articular eminence', 'Disc', 'Condyle', 'Retrodiscal tissue', 'Lateral pterygoid'];
fig.view('Section', Object.assign({ section: true, offset: CUT, set: { mix: 1 }, labels: HERO6 }, SEC));
fig.standardControls({ explode: false });

// ---------- the story: whole jaw → the left joint → the cut → the disc up close → what holds it → the labelled hero ----------
fig.story([
  { dur: 0, hold: 1.4, theta: 0.62, phi: 1.28, zoom: 1, fov: 32, section: false, set: { mix: 0 }, labels: ['Jaw joint'] },
  { dur: 2.4, hold: 0.6, theta: Math.PI / 2 - 0.15, phi: 1.45, zoom: 0.42, fov: 24, focus: [L.x, L.y - 1, L.z + 3], labels: ['Jaw joint'] },
  { dur: 0, hold: 0, section: true, offset: CUT },
  Object.assign({ dur: 2.2, hold: 1.6, set: { mix: 1 }, labels: ['Condyle', 'Glenoid fossa', 'Ear canal'] }, SEC),
  { dur: 2.0, hold: 2.2, zoom: 0.16, focus: [L.x, L.y + 4.5, L.z + 1.5], labels: ['Posterior band', 'Intermediate zone', 'Anterior band'] },
  Object.assign({ dur: 2.0, hold: 1.8, labels: ['Retrodiscal tissue', 'Lateral pterygoid', 'Articular eminence'] }, SEC, { zoom: 0.32 }),
  Object.assign({ dur: 1.4, hold: 2.6, drift: 0, labels: HERO6 }, SEC)
]);
fig.start();
