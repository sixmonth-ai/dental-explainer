// Procedure: anterior disc displacement with reduction (the clicking jaw), drawn as a sagittal section through the patient's LEFT temporomandibular joint seen from the left side, face to the viewer's left. Frame (this figure only): +x anterior, +y up, z lateral; the condyle centre at rest is the origin, mm; the slab is cut at z = 0 and the camera looks from -z.
// poster: step 4
// DK.articularDisc always stays on its condyle, so the joint is built here from traced sagittal outlines (temporal bone with fossa,
// eminence, postglenoid process and ear canal; condyle and neck; biconcave disc 2 / 1 / 3 mm; retrodiscal tissue; both heads of the
// lateral pterygoid), each a thin closed slab cut by the section plane so it reads like a textbook sagittal TMJ illustration.
// Disc and band sizes from dental-facts §21; the click is drawn, not simulated.
const fig = DK.figure({
  fov: 14,
  title: 'Clicking jaw: disc displacement',
  subtitle: "Patient's left jaw joint, side view, face to the left. Schematic.",
  view: { theta: Math.PI, phi: Math.PI / 2, margin: 0.9 }
});
const V2 = (x, y) => new THREE.Vector2(x, y);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;

// ---------- outlines (x anterior, y up) ----------
const spline = (pts, n, closed) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), closed, 'centripetal').getSpacedPoints(n).map(v => V2(v.x, v.y));
// the articular surface of the temporal bone, posterior → anterior: tympanic plate, postglenoid process, fossa roof, eminence, preglenoid plane
const SURF = [[-40, -11], [-22, -10.5], [-15.5, -8.5], [-10.5, -5.2], [-8.2, -2.4], [-7.0, -0.2], [-6.2, 1.6], [-5.2, 4.4], [-3.4, 7.0], [-0.8, 8.3], [1.8, 8.0], [4.4, 6.2], [6.9, 3.4], [9.2, 1.2], [11.2, 0.3], [13.2, 0.8], [16, 2.4], [21, 4.0], [30, 5.0], [42, 5.6]];
const surf = spline(SURF, 260, false);
const S = x => {   // height of the articular surface at x (joint region, where it is a function of x)
  for (let i = 1; i < surf.length; i++) { const a = surf[i - 1], b = surf[i]; if (a.x <= x && b.x >= x && a.x > -6.5) return a.y + (b.y - a.y) * (x - a.x) / Math.max(1e-6, b.x - a.x); }
  return 50;
};
// the cerebral surface: the fossa roof is a thin plate (about 2 mm) under the middle cranial fossa; the eminence and the bone around the ear canal are thick
const TOP = [[42, 9.6], [26, 10.0], [15, 11.2], [7.5, 10.9], [2.5, 10.3], [-2, 10.4], [-6.5, 11.8], [-11, 13.2], [-17, 15.6], [-26, 19], [-40, 22]];
const temporalPts = surf.concat(spline(TOP, 120, false));
const meatus = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => { const a = -i / n * Math.PI * 2; return V2(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); });
const R = 4.5;                                      // radius of the condylar head in this section (about 9 mm front to back, facts §21)
const condylePts = (() => {
  const head = []; for (let a = 8; a <= 172; a += 4) head.push([R * Math.cos(a * D2R), R * Math.sin(a * D2R)]);
  const post = [[-4.55, -1.6], [-4.25, -5], [-4.6, -9], [-5.4, -15], [-6.6, -26], [-7.4, -46]];
  const ant = [[36, -46], [36, -6], [26, -5.5], [19, -9.5], [13, -13.2], [8.4, -12], [5.4, -8.6], [4.1, -5.2], [3.7, -3.6], [4.5, -1.2]];
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

// ---------- pose: the condyle rotates first, then slides down the eminence; the disc either rides on it or lies in front ----------
const toWorld = (p, c, ang) => V2(c.x + p.x * Math.cos(ang) - p.y * Math.sin(ang), c.y + p.x * Math.sin(ang) + p.y * Math.cos(ang));
const discPts = discOutline;
const clearY = (cx, ang, pts, margin) => {   // highest centre y at x = cx for which `pts` (local, turned by ang) stay under the articular surface
  let y = 1e9; pts.forEach(p => { const w = toWorld(p, V2(cx, 0), ang); const s = S(w.x); if (s < 49) y = Math.min(y, s - w.y - margin); }); return y;
};
const headPts = Array.from({ length: 37 }, (_, i) => V2(R * Math.cos((10 + i * 4.4) * D2R), R * Math.sin((10 + i * 4.4) * D2R)));
const AMAX = 10.5, ROTMAX = 27;
const psiN = o => 22 * D2R * smooth(0.3, 1, o);   // the disc turns back on the head as the condyle slides forward
const centreAt = o => { const a = AMAX * smooth(0.3, 1, o); return V2(a, Math.min(clearY(a, psiN(o), discPts, 0.15), clearY(a, 0, headPts, 1.4))); };
const C0 = centreAt(0);
// the displaced disc: turned forward and pushed down the slope, its posterior band in front of the head
const PSI_D = -52 * D2R;
const displacedAt = c => {
  let best = null;
  for (let dx = 0.6; dx < 9; dx += 0.15) {
    const x = c.x + dx, y = clearY(x, PSI_D, discPts, 0.15);
    const ok = discPts.every(p => toWorld(p, V2(x, y), PSI_D).distanceTo(c) > R + 0.15);
    if (ok) { best = V2(x, y); break; }
  }
  return best || V2(c.x + 9, clearY(c.x + 9, PSI_D, discPts, 0.15));
};
const D0 = displacedAt(C0);
const st = { open: 0, seat: 1, c: C0.clone(), rot: 0, dc: C0.clone(), dpsi: 0 };
const update = () => {
  const o = st.open, c = centreAt(o), rot = -ROTMAX * D2R * o;
  st.c = c; st.rot = rot;
  const dN = c, psN = psiN(o);
  const dD = (() => { const p = displacedAt(c); return p.x > D0.x ? p : D0; })();
  const k = st.seat;
  st.dc = V2(dD.x + (dN.x - dD.x) * k, dD.y + (dN.y - dD.y) * k); st.dpsi = PSI_D + (psN - PSI_D) * k;
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
  supHead.set(band([aFront, fwd(aFront, 4, -1.4), M(Math.max(aFront.x + C0.x + 10, 19), -4.6), M(Math.max(aFront.x + C0.x + 22, 42), -6.5)], 0.7, 1.5), 10, 0.3);
  infHead.set(band([fovea, fwd(fovea, 5, -2.6), M(Math.max(fovea.x + C0.x + 13, 21), -11.5), M(Math.max(fovea.x + C0.x + 26, 44), -13.5)], 1.2, 2.6), 12, 0.3);
};
// everything is placed relative to the rest centre: shift the static pieces so the condyle centre at rest is the origin
[temporal, temporalIn].forEach(m => m.position.set(-C0.x, -C0.y, 0));
// the condyle's outline is drawn around its own centre: put the pivot there
const pivot = new THREE.Group(); fig.world.add(pivot); fig.world.remove(condyle); pivot.add(condyle);
const placeCondyle = () => { pivot.position.set(st.c.x - C0.x, st.c.y - C0.y, 0); pivot.rotation.z = st.rot; };
const discPivot = new THREE.Group(); fig.world.add(discPivot); fig.world.remove(disc); discPivot.add(disc);
const placeDisc = () => { discPivot.position.set(st.dc.x - C0.x, st.dc.y - C0.y, 0); discPivot.rotation.z = st.dpsi; };

// the click: a ring that flashes where the head passes under the posterior band
const clickMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false });
const ring = DK.ribbon(Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return [Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0]; }), 0.38, [0, 0, 1], { material: clickMat });
ring.renderOrder = 30; ring.visible = false; fig.world.add(ring);

const render = () => { update(); placeCondyle(); placeDisc(); };
fig.param('open', 0, v => { st.open = v; render(); });
fig.param('seat', 1, v => { st.seat = v; render(); });
fig.param('click', 0, v => {
  ring.visible = v > 0.01 && v < 0.99; clickMat.opacity = Math.sin(Math.PI * v);
  const back = toWorld(V2((RIN + 1.5) * Math.cos(100 * D2R), (RIN + 1.5) * Math.sin(100 * D2R)), st.dc, st.dpsi);
  ring.position.set(back.x - C0.x, back.y - C0.y, -0.3); ring.scale.setScalar(0.6 + 0.8 * v);
});

// ---------- labels (anchors on the cut face; moving parts carry local anchors) ----------
fig.part(temporal, { inPlace: true, name: 'Articular eminence', anchor: [12.6, 1.0, -0.12], labelOffset: [-60, -95], dim: false,
  info: 'Convex ridge of the temporal bone in front of the fossa, about 7 mm high. On wide opening the condyle and its disc slide down its back slope.' });
fig.part(temporal, { inPlace: true, name: 'Glenoid fossa', anchor: [0.4, 8.6, -0.12], labelOffset: [60, -70], dim: false,
  info: 'The socket in the temporal bone that houses the condyle and disc when the teeth are together, about 6 mm deep.' });
fig.part(temporal, { inPlace: true, name: 'Ear canal', anchor: [-14.2 - C0.x, -1.8 - C0.y + 4.4, -0.12], labelOffset: [70, -60], dim: false,
  info: 'The external ear canal lies just behind the joint, which is why jaw-joint pain is often felt as earache.' });
fig.part(condyle, { inPlace: true, name: 'Condyle', anchor: [0.5, -3.5, -0.12], labelOffset: [110, 40], dim: false,
  info: 'The rounded top of the lower jaw: about 20 mm wide and 9 mm front to back. It turns first, then slides forward down the eminence.' });
const discPart = fig.part(disc, { inPlace: true, name: 'Disc', sub: 'on the condyle', accent: true, anchor: [(RIN + 1.5) * Math.cos(78 * D2R), (RIN + 1.5) * Math.sin(78 * D2R), -0.12], labelOffset: [-80, -90], dim: false,
  info: 'Biconcave fibrocartilage pad: posterior band about 3 mm, thin middle about 1 mm, anterior band about 2 mm. Normally the condyle works against its thin middle in every position.' });
fig.part(retro, { inPlace: true, name: 'Retrodiscal tissue', anchor: () => { const p = toWorld(V2(-3.0, 5.6), st.c, 0); return [p.x - C0.x, p.y - C0.y, -0.12]; }, labelOffset: [95, -45], dim: false,
  info: 'Loose, vascular and innervated tissue behind the disc. With the disc displaced, the condyle presses on it: a common source of pain.' });
fig.part(supHead, { inPlace: true, name: 'Lateral pterygoid', anchor: () => { const p = supHead.geometry.boundingBox; return p ? [Math.min(17, p.max.x - 3), (p.min.y + p.max.y) / 2 + 0.5, -0.12] : [15, -2, 0]; }, labelOffset: [-40, 80], dim: false,
  info: 'Jaw muscle in front of the joint: its upper head attaches to the front of the disc, its lower head to the condylar neck and pulls the condyle forward on opening.' });
fig.part(ring, { inPlace: true, name: 'Click', sub: 'disc pops back on', accent: false, anchor: [0, 0, 0], labelOffset: [100, -70], dim: false, when: () => ring.visible,
  info: 'The click: the condyle jumps over the thick posterior band onto the thin middle of the disc, which is back in place for the rest of the opening.' });
fig.onFrame(() => {
  const sub = st.seat < 0.5 ? 'in front of the condyle' : 'on the condyle';
  if (discPart.sub !== sub) { discPart.sub = sub; discPart.el.innerHTML = discPart.name + '<small>' + sub + '</small>'; }
});

// ---------- section: sagittal (the lateral half, toward the camera, is removed) ----------
fig.enableSection([0, 0, -1], [
  { objects: [temporal, condyleOut], color: 0xC4B393, kind: 'cortical' },
  { objects: [temporalIn, condyleIn], color: 0xDDCFB3, kind: 'cortical' },
  { objects: [retro], color: 0xD6C2BC, kind: 'gingiva' },
  { objects: [supHead, infHead], color: 0xA3766F, kind: 'gingiva' },
  { objects: [disc], color: 0xB89F98, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-6, 6], offset: 0 } });
render();

// ---------- procedure ----------
const HERO = { theta: Math.PI, phi: Math.PI / 2, zoom: 1, fov: 14, focus: 'auto' };
fig.procedure([
  { label: 'Healthy joint', caption: 'Teeth together: the disc sits on top of the condyle, its thick back band at 12 o\'clock.', beats: [
    { dur: 0, hold: 1.2, theta: Math.PI + 0.55, phi: 1.3, zoom: 1.08, fov: 22, section: true, offset: 0, set: { open: 0, seat: 1, click: 0 }, labels: ['Condyle', 'Glenoid fossa', 'Ear canal'] },
    Object.assign({ dur: 2.4, hold: 2.0, labels: ['Disc', 'Condyle', 'Articular eminence', 'Ear canal'], key: true }, HERO)] },
  { label: 'Disc slips forward', caption: 'In a clicking joint the disc has slipped in front of the condyle; the condyle now presses on the tissue behind it.', beats: [
    { dur: 2.2, hold: 2.2, set: { seat: 0 }, zoom: 0.9, focus: [2, 0.5, 0], labels: ['Disc', 'Retrodiscal tissue', 'Lateral pterygoid'], key: true }] },
  { label: 'Opening', caption: 'Opening, the condyle turns and starts to slide; it pushes against the back of the disc.', beats: [
    { dur: 2.4, hold: 1.0, set: { open: 0.5 }, zoom: 0.95, focus: [3, -0.5, 0], labels: ['Condyle', 'Disc'], key: true }] },
  { label: 'Click', caption: 'The condyle jumps over the thick back band onto the thin middle: the disc pops back on. That is the click.', beats: [
    { dur: 0.35, hold: 0, set: { seat: 1, open: 0.56, click: 0.5 }, labels: ['Click', 'Disc'], key: true },
    { dur: 0.6, hold: 1.4, set: { click: 1 }, labels: ['Disc', 'Condyle'] }] },
  { label: 'Wide open', caption: 'For the rest of the opening disc and condyle slide down the eminence together.', beats: [
    { dur: 2.4, hold: 2.0, set: { open: 1, click: 0 }, zoom: 0.95, focus: [4, -1.5, 0], labels: ['Disc', 'Articular eminence', 'Condyle'], key: true }] },
  { label: 'Closing', caption: 'Near the end of closing the disc slips forward again, often with a softer second click.', beats: [
    { dur: 2.4, hold: 0.1, set: { open: 0.06 }, zoom: 1, focus: 'auto', labels: ['Disc'] },
    { dur: 0.4, hold: 0, set: { seat: 0, open: 0 }, labels: ['Disc'] },
    { dur: 0.8, hold: 2.2, labels: ['Disc', 'Retrodiscal tissue'], key: true }] }
]);
fig.start();
