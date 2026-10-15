// Procedure: how the jaw opens, seen in a sagittal section through the patient's LEFT temporomandibular joint from the left side, face to the viewer's left: the condyle first turns in place (about the first 20 to 25 mm at the incisors), then slides forward and down the articular eminence with its disc. Frame (this figure only): +x anterior, +y up, z lateral; the condyle centre at rest is the origin, mm; the slab is cut at z = 0 and the camera looks from -z.
// poster: step 4
// Built from traced sagittal outlines (temporal bone with fossa, eminence, postglenoid process and ear canal; condyle, neck, sigmoid notch
// and coronoid process; biconcave disc 2 / 1 / 3 mm; retrodiscal tissue; both heads of the lateral pterygoid), each a thin closed slab cut
// by the section plane. Jaw rotation and condyle travel per mm of opening come from the kit's DK.jawPose (average jaw, facts §21).
const fig = DK.figure({
  fov: 14,
  title: 'How the jaw opens',
  subtitle: "Patient's left jaw joint, side view, face to the left. Values approximate.",
  view: { theta: Math.PI, phi: Math.PI / 2, margin: 0.9 }
});
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
fig.world.add(temporal, temporalIn, condyle);
const frame = new THREE.Mesh(new THREE.BoxGeometry(30, 28, 4), new THREE.MeshBasicMaterial({ visible: false })); frame.position.set(1.5, -0.5, 0);
fig.part(frame, { name: 'frame', label: false });

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
fig.world.add(disc);

// ---------- soft tissue that changes shape: retrodiscal tissue, the two heads of the lateral pterygoid ----------
const retroMat = DK.mat('gingiva', { color: 0xD3BDB6, cap: 0xD6C2BC, roughness: 0.8 });
const muscleMat = DK.mat('gingiva', { color: 0xA97C76, cap: 0xA3766F, roughness: 0.75 });
const retro = live(retroMat), supHead = live(muscleMat), infHead = live(muscleMat);
fig.world.add(retro, supHead, infHead);

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
const pivot = new THREE.Group(); fig.world.add(pivot); fig.world.remove(condyle); pivot.add(condyle);
const placeCondyle = () => { pivot.position.set(st.c.x - C0.x, st.c.y - C0.y, 0); pivot.rotation.z = st.rot; };
const discPivot = new THREE.Group(); fig.world.add(discPivot); fig.world.remove(disc); discPivot.add(disc);
const placeDisc = () => { discPivot.position.set(st.dc.x - C0.x, st.dc.y - C0.y, 0); discPivot.rotation.z = st.dpsi; };

// ---------- motion markers: a turn arrow inside the head (hinge), the path of the condyle centre and its resting outline ----------
const accMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 1, side: THREE.DoubleSide, depthTest: false });
const turn = new THREE.Group(); turn.renderOrder = 30; pivot.add(turn);
const arcPts = Array.from({ length: 25 }, (_, i) => { const a = (150 - 105 * i / 24) * D2R; return [2.5 * Math.cos(a), 2.5 * Math.sin(a), -0.3]; });
const arcEnd = 32 * D2R;
turn.add(DK.ribbon(arcPts, 0.42, [0, 0, 1], { material: accMat }),
  DK.arrow({ from: arcPts[23], to: [2.5 * Math.cos(arcEnd) + 0.9 * Math.sin(arcEnd), 2.5 * Math.sin(arcEnd) - 0.9 * Math.cos(arcEnd), -0.3], width: 0.42, head: 1.4, normal: [0, 0, 1], material: accMat }));
turn.children.forEach(m => { m.renderOrder = 30; });
const path = new THREE.Mesh(new THREE.BufferGeometry(), accMat); path.renderOrder = 30; fig.world.add(path);
const pathHead = DK.arrow({ from: [0, 0, 0], to: [1, 0, 0], width: 0.45, head: 1.6, normal: [0, 0, 1], material: accMat }); pathHead.renderOrder = 30; fig.world.add(pathHead);
const drawPath = mm => {   // from rest to the current opening, only once the condyle has left its resting place
  const a = look('fwd', mm); path.visible = pathHead.visible = a > 0.6; if (!path.visible) return;
  const pts = []; for (let i = 0; i <= 30; i++) { const m2 = ROT_ONLY + (mm - ROT_ONLY) * i / 30, c = centreAt(m2); pts.push([c.x - C0.x, c.y - C0.y, -0.3]); }
  const g = DK.ribbon(pts.slice(0, -2), 0.45, [0, 0, 1]).geometry; path.geometry.dispose(); path.geometry = g;
  const p = pts[pts.length - 3], q = pts[pts.length - 1], d = V2(q[0] - p[0], q[1] - p[1]).normalize();
  const fresh = DK.arrow({ from: p, to: [q[0] + d.x * 0.6, q[1] + d.y * 0.6, -0.3], width: 0.45, head: 1.6, normal: [0, 0, 1], material: accMat });
  pathHead.geometry.dispose(); pathHead.geometry = fresh.geometry;
};
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(0x6f685d), toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false });
const restOutline = DK.ribbon(Array.from({ length: 41 }, (_, i) => { const a = (-20 + 220 * i / 40) * D2R; return [R * Math.cos(a), R * Math.sin(a), -0.25]; }), 0.22, [0, 0, 1], { material: inkMat });
restOutline.renderOrder = 29; fig.world.add(restOutline);

const render = () => { update(); placeCondyle(); placeDisc(); drawPath(st.open); restOutline.visible = look('fwd', st.open) > 1.2 && showGhost; };
let showGhost = false;
fig.param('open', 0, v => { st.open = v; render(); });
fig.param('turnArrow', 0, v => { accMat.opacity = 1; turn.visible = v > 0.5; });
fig.param('ghost', 0, v => { showGhost = v > 0.5; render(); });

// ---------- labels (anchors on the cut face; moving parts carry local anchors) ----------
fig.part(temporal, { inPlace: true, name: 'Articular eminence', anchor: [12.6, 1.0, -0.12], labelOffset: [-110, -50], dim: false,
  info: 'Convex ridge of the temporal bone in front of the fossa, about 7 mm high. On wide opening the condyle and its disc slide down its back slope.' });
fig.part(temporal, { inPlace: true, name: 'Glenoid fossa', anchor: [0.4, 8.6, -0.12], labelOffset: [60, -70], dim: false,
  info: 'The socket in the temporal bone that houses the condyle and disc when the teeth are together, about 6 mm deep.' });
fig.part(temporal, { inPlace: true, name: 'Ear canal', anchor: [-14.2 - C0.x, -1.8 - C0.y + 4.4, -0.12], labelOffset: [70, -60], dim: false,
  info: 'The external ear canal lies just behind the joint: put a fingertip in front of the ear and open wide to feel the condyle slide forward.' });
const condylePart = fig.part(condyle, { inPlace: true, name: 'Condyle', sub: 'seated in the fossa', anchor: [0.5, -3.5, -0.12], labelOffset: [110, 40], dim: false,
  info: 'The rounded top of the lower jaw: about 20 mm wide and 9 mm front to back. It turns first, then slides forward down the eminence.' });
fig.part(disc, { inPlace: true, name: 'Disc', sub: 'rides on the condyle', anchor: [(RIN + 1.5) * Math.cos(78 * D2R), (RIN + 1.5) * Math.sin(78 * D2R), -0.12], labelOffset: [-80, -90], dim: false,
  info: 'Biconcave fibrocartilage pad: posterior band about 3 mm, thin middle about 1 mm, anterior band about 2 mm. The head turns under it; disc and head slide down the eminence together.' });
fig.part(turn, { inPlace: true, name: 'Turns in place', sub: 'first 20 to 25 mm', accent: true, anchor: [2.5 * Math.cos(95 * D2R), 2.5 * Math.sin(95 * D2R), -0.3], labelOffset: [-40, -110], dim: false, when: () => turn.visible,
  info: 'Early opening is a hinge movement: the condyle rotates under the disc (lower joint space) and stays in the fossa, up to about 20 to 25 mm between the incisors.' });
const pathPart = fig.part(pathHead, { inPlace: true, name: 'Slides forward', sub: 'down the eminence', accent: true, anchor: () => { const c = centreAt(st.open); return [c.x - C0.x, c.y - C0.y, -0.3]; }, labelOffset: [-150, 30], dim: false, when: () => pathHead.visible,
  info: 'Past about 20 to 25 mm the condyle and disc translate forward and down the back slope of the eminence (upper joint space), about 10 mm at a wide opening.' });
fig.part(infHead, { inPlace: true, name: 'Lateral pterygoid', sub: 'pulls it forward', anchor: () => { const p = infHead.geometry.boundingBox; return p ? [Math.min(18, p.max.x - 4), (p.min.y + p.max.y) / 2, -0.12] : [15, -10, 0]; }, labelOffset: [-20, 120], dim: false,
  info: 'The lateral pterygoid muscle pulls the condyle (lower head) and the disc (upper head) forward as the mouth opens wide.' });
fig.part(restOutline, { inPlace: true, name: 'At rest', anchor: [R * Math.cos(150 * D2R), R * Math.sin(150 * D2R), -0.25], labelOffset: [80, -60], dim: false, when: () => restOutline.visible,
  info: 'Where the condyle sat with the teeth together.' });
let shown = '';
fig.onFrame(() => {
  const mm = st.open, a = look('fwd', mm), key = mm.toFixed(0);
  if (key === shown) return; shown = key;
  const sub = mm < 0.5 ? 'seated in the fossa' : a < 0.05 ? 'turns in place' : 'slides with the disc';
  condylePart.sub = sub; condylePart.el.innerHTML = condylePart.name + '<small>' + sub + '</small>';
  const c = centreAt(mm);
  fig.setReadout(mm < 0.5 ? [{ k: 'Mouth', v: 'closed, teeth together' }] : [
    { k: 'Opening at the incisors', v: `${mm.toFixed(0)} mm` },
    { k: 'Condyle', v: a < 0.05 ? `turned ${look('rot', mm).toFixed(0)}°, still in the fossa` : `${a.toFixed(1)} mm forward, ${(C0.y - c.y).toFixed(1)} mm down` }]);
});

// ---------- section: sagittal (the lateral half, toward the camera, is removed) ----------
fig.enableSection([0, 0, -1], [
  { objects: [temporal, condyleOut], color: 0xC4B393, kind: 'cortical' },
  { objects: [temporalIn, condyleIn], color: 0xDDCFB3, kind: 'cortical' },
  { objects: [retro], color: 0xD6C2BC, kind: 'gingiva' },
  { objects: [supHead, infHead], color: 0xA3766F, kind: 'gingiva' },
  { objects: [disc], color: 0xB89F98, kind: 'plain' }
]);
const slider = fig.slider('Open', 0, OPEN, 1, 0, v => fig.goTo({ set: { open: v } }, 0));
fig.onFrame(() => { if (Math.abs(+slider.value - st.open) > 0.5) slider.value = st.open; });
fig.standardControls({ explode: false, section: false });
render();

// ---------- procedure ----------
const HERO = { theta: Math.PI, phi: Math.PI / 2, zoom: 1, fov: 14, focus: 'auto' };
const WIDE = { theta: Math.PI, phi: Math.PI / 2, zoom: 1.25, fov: 14, focus: [6, -6, 0] };
fig.procedure([
  { label: 'Teeth together', caption: 'Teeth together: the condyle sits in its fossa with the disc on top.', beats: [
    { dur: 0, hold: 1.2, theta: Math.PI + 0.55, phi: 1.3, zoom: 1.3, fov: 22, focus: [6, -6, 0], section: true, offset: 0, set: { open: 0, turnArrow: 0, ghost: 0 }, labels: ['Condyle', 'Ear canal'] },
    Object.assign({ dur: 2.4, hold: 1.8, labels: ['Condyle', 'Disc', 'Articular eminence', 'Ear canal'], key: true }, WIDE)] },
  { label: 'Turns', caption: 'For the first 20 to 25 mm the condyle only turns in its socket, like a hinge.', beats: [
    Object.assign({ dur: 1.6, hold: 0.1, set: { turnArrow: 1 }, labels: ['Turns in place'] }, HERO),
    { dur: 2.6, hold: 1.8, set: { open: ROT_ONLY }, labels: ['Turns in place', 'Condyle'], key: true }] },
  { label: 'Slides', caption: 'Opening wider, the condyle and its disc slide forward and down the eminence.', beats: [
    { dur: 1.0, hold: 0, set: { turnArrow: 0, ghost: 1 }, labels: ['Condyle'] },
    { dur: 3.0, hold: 1.6, set: { open: OPEN }, focus: [4, -2, 0], zoom: 1.0, labels: ['Slides forward', 'Articular eminence', 'Disc'], key: true }] },
  { label: 'Wide open', caption: 'Wide open, about 45 mm: the condyle sits under the crest of the eminence.', beats: [
    Object.assign({ dur: 2.2, hold: 2.4, labels: ['Slides forward', 'At rest', 'Disc', 'Condyle'], key: true }, WIDE)] }
]);
fig.view('Joint', HERO);
fig.start();
