// Procedure: lower jaw setback by bilateral sagittal split osteotomy (BSSO) for an underbite, on an average adult jaw (DK.mandible with the upper jaw), seen mostly from the patient's right. Frame: DK.mandible (+x = patient's left, +z anterior, y up, lower CEJs at y = 0); the lower jaw starts lengthened (schematic Class III), is split behind the second molars, the tooth-bearing part slides back, the overlapping bone is trimmed and plates hold it.
// poster: step 4
// The split is drawn with clipping planes on copies of the kit's bone surface: the condyle-ramus part (proximal segment: condyle,
// ramus and the outer cortex back from the cut) stays seated; the tooth-bearing part (distal segment: the body in front of the cut
// plus the inner half of the ramus below a horizontal cut above the nerve entry) moves. Cut faces are back faces in a flat bone tone.
const D = 6.5;            // mm the lower teeth sit forward in the underbite and move back at surgery (schematic, as in the underbite figure)
const fig = DK.figure({
  fov: 34,
  title: 'Lower jaw surgery',
  subtitle: "Split osteotomy to set back an underbite. From the patient's right; schematic.",
  view: { theta: -1.2, phi: 1.42, margin: 0.8 }
});

const m = DK.mandible({ teeth: true, upper: 'bone', maxilla: { crop: 37 } });
const mx = m.maxilla, C = m.centres.right;
[mx.zygoma.left, mx.zygoma.right, mx.temporal.left, mx.temporal.right, ...Object.values(mx.joints), ...Object.values(m.discs || {}).flatMap(d => [d, ...(d.userData.laminae || []), ...(d.userData.pterygoid || [])])].forEach(o => { if (o && o.parent) o.parent.remove(o); });
DK.fadeMaterial(mx.maxilla.material, 1);
fig.part(m.group, { name: 'Jaws', label: false, info: 'Average adult upper and lower jaw with their teeth.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'The upper jaw stays where it is in this operation.' });
m.group.updateMatrixWorld(true);

// ---------- the lengthened jaw: bone stretched forward from the condyles, teeth forward by D ----------
m.body.geometry.computeBoundingBox();
const chinZ = m.body.geometry.boundingBox.max.z, Cz = C.z;
const S = 1 + D / (chinZ - Cz);                      // the chin comes forward by exactly D
const srcBones = [m.body, m.rami.left, m.rami.right];

// lateral surface of the rest jaw at (y, z) on one side (sg = +1 left, -1 right), by ray casting the original surface
const rc = new THREE.Raycaster();
const latX = (sg, y, z) => { rc.set(new THREE.Vector3(sg * 90, y, z), new THREE.Vector3(-sg, 0, 0)); const h = rc.intersectObjects(srcBones, false); return h.length ? h[0].point.x : null; };
const topY = (x, z) => { rc.set(new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(srcBones, false); return h.length ? h[0].point.y : null; };

// ---------- the cuts (rest frame of the bone) ----------
const ZCUT = -44;                                    // vertical cut down the outer cortex, just behind the second molar (37/47 distal ≈ -42.8)
const YH = 10;                                       // horizontal cut on the inner ramus, above the nerve's entry (lingula)
const ZBACK = -71;                                   // the inner part of the split ends here (behind the lingula)
const XS0 = 37.2, XSK = 0.12;
const xs = z => XS0 - XSK * (z + 55);                // the split runs inside the bone just within the outer cortex, nearly parallel to the slide
const P = (nx, ny, nz, c) => { const n = new THREE.Vector3(nx, ny, nz), l = n.length(); return new THREE.Plane(n.divideScalar(l), c / l); };
const keepFront = () => P(0, 0, 1, -ZCUT), keepBack = (z) => P(0, 0, -1, z ?? ZCUT);
const keepLat = sg => P(sg, 0, XSK, -(XS0 - XSK * 55)), keepMed = sg => P(-sg, 0, -XSK, (XS0 - XSK * 55));
const keepSide = sg => P(sg, 0, 0, 0), keepBelow = () => P(0, -1, 0, YH), keepAbove = () => P(0, 1, 0, -YH);

// ---------- segments: holders carry the stretch; the distal holder also moves back and opens a little ----------
const proxH = new THREE.Group(), distG = new THREE.Group(), distH = new THREE.Group();
[proxH, distH].forEach(h => { h.scale.z = S; h.position.z = Cz * (1 - S); });
distG.add(distH); m.jaw.add(proxH, distG);
m.jaw.remove(m.teeth.group); distG.add(m.teeth.group);
srcBones.forEach(b => { b.visible = false; });
const CAP = 0xA99F8B;
const pieces = [];
function piece(holder, planes, trim) {
  srcBones.forEach(src => {
    const mat = src.material.clone(); mat.clippingPlanes = planes.map(p => p.clone()); mat.clipShadows = true;
    const front = new THREE.Mesh(src.geometry, mat);
    const back = new THREE.Mesh(src.geometry, new THREE.MeshBasicMaterial({ color: DK.color(CAP), side: THREE.BackSide, clippingPlanes: mat.clippingPlanes }));
    back.userData.noShadow = true;
    holder.add(front, back);
    pieces.push({ holder, planes, mat, trim, front });
  });
}
const left = 1, right = -1;
// distal (tooth-bearing): the body in front of the cut, and on each side the inner ramus below the horizontal cut
piece(distH, [keepFront()]);
[left, right].forEach(sg => piece(distH, [keepBack(), keepSide(sg), keepMed(sg), keepBelow(), P(0, 0, 1, -ZBACK)]));
// proximal (condyle side): outer cortex back from the cut (trimmed as the distal part slides back), inner ramus above the cut, inner ramus behind the split
[left, right].forEach(sg => {
  piece(proxH, [keepBack(), keepSide(sg), keepLat(sg), P(0, -1, 0, 1)], true);   // outer cortex of the body: trimmed
  piece(proxH, [keepBack(), keepSide(sg), keepLat(sg), P(0, 1, 0, -1)]);          // outer ramus above it: untouched
  piece(proxH, [keepBack(), keepSide(sg), keepMed(sg), keepAbove()]);
  piece(proxH, [keepBack(ZBACK), keepSide(sg), keepMed(sg), keepBelow()]);
});
let trimMm = 0;
const syncClip = () => {
  pieces.forEach(pc => {
    pc.holder.updateWorldMatrix(true, false);
    pc.planes.forEach((p, i) => {
      const q = pc.mat.clippingPlanes[i]; q.copy(p);
      if (pc.trim && i === 0) q.constant = ZCUT - trimMm / S;          // the outer cortex is cut back by the setback
      q.applyMatrix4(pc.holder.matrixWorld);
    });
  });
};

// ---------- cut lines (accent ribbons on the bone surface; built in the rest frame, carried by the proximal holder) ----------
const cutMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false });
const cutLines = new THREE.Group(); proxH.add(cutLines);
[left, right].forEach(sg => {
  const top = [];
  for (let z = ZCUT; z > -66; z -= 0.6) { const x = sg * xs(z), y = topY(x, z); if (y === null) continue; if (y > YH + 1) break; top.push([x, y + 0.25, z]); }
  const vert = [];
  for (let y = (top[0] ? top[0][1] - 0.6 : -1); y > -26; y -= 0.6) { const x = latX(sg, y, ZCUT); if (x === null) break; vert.push([x + sg * 0.25, y, ZCUT]); }
  if (top.length > 1) cutLines.add(DK.ribbon(top, 0.8, [0, 1, 0], { material: cutMat }));
  if (vert.length > 1) cutLines.add(DK.ribbon(vert, 0.8, [sg, 0, 0], { material: cutMat }));
  cutLines.userData['v' + sg] = vert;
});
cutLines.traverse(o => { o.userData.noShadow = true; o.renderOrder = 5; });

// ---------- plates and screws across the outer cut, after the setback (static: built in the jaw frame at their final place) ----------
const ti = DK.mat('titanium');
const plates = new THREE.Group(); m.jaw.add(plates);
const toRestProx = z => Cz + (z - Cz) / S;                    // world z → rest z on the condyle part
const toRestDist = z => Cz + (z + D - Cz) / S;               // world z → rest z on the moved tooth-bearing part
const JUNC = Cz + S * (ZCUT - Cz) - D;                        // where the two parts meet on the outer cortex after the move
const surfRaw = (sg, y, z) => latX(sg, y, z < JUNC ? toRestProx(z) : toRestDist(z));
const grids = {};
function surfX(sg, y, z) {   // bilinear lookup on a small grid of casts around the plate (casting every vertex is too slow)
  const G = grids[sg] || (grids[sg] = { z0: JUNC - 11, y0: -12, n: 45, m: 19, v: [] });
  const fz = DK.util.clamp((z - G.z0) / 0.5, 0, G.n - 1.001), fy = DK.util.clamp((y - G.y0) / 0.5, 0, G.m - 1.001);
  const at = (i, j) => { const k = i * G.m + j; if (G.v[k] === undefined) G.v[k] = surfRaw(sg, G.y0 + j * 0.5, G.z0 + i * 0.5) ?? null; return G.v[k]; };
  const i = Math.floor(fz), j = Math.floor(fy), a = fz - i, b = fy - j;
  const v = [at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)];
  if (v.some(x => x === null)) return v.find(x => x !== null) ?? null;
  return (v[0] * (1 - a) + v[1] * a) * (1 - b) + (v[2] * (1 - a) + v[3] * a) * b;
}
function plate(sg, yc) {
  const HOLES = [-7.5, -3.2, 3.2, 7.5], R = 2.1, W = 1.35, T = 0.7;
  const half = u => { let h = W; HOLES.forEach(c => { const d = u - c; if (Math.abs(d) < R) h = Math.max(h, Math.sqrt(R * R - d * d)); }); return h; };
  const pts = []; const u0 = HOLES[0] - R, u1 = HOLES[3] + R;
  for (let u = u0; u <= u1 + 1e-6; u += 0.25) pts.push(new THREE.Vector2(u, half(u)));
  for (let u = u1; u >= u0 - 1e-6; u -= 0.25) pts.push(new THREE.Vector2(u, -half(u)));
  const sh = new THREE.Shape(pts);
  HOLES.forEach(c => { const h = new THREE.Path(); h.absarc(c, 0, 0.75, 0, Math.PI * 2, true); sh.holes.push(h); });
  const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2, curveSegments: 16 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {   // (u, v, w) → bent onto the outer cortex
    const u = p.getX(i), v = p.getY(i), w = p.getZ(i), z = JUNC + u, y = yc + v, x = surfX(sg, y, z) ?? surfX(sg, yc, z);
    p.setXYZ(i, x + sg * (w + 0.1), y, z);
  }
  g.computeVertexNormals();
  if (sg < 0) { const a = p.array; for (let i = 0; i < a.length; i += 9) for (let k = 0; k < 3; k++) { const t = a[i + 3 + k]; a[i + 3 + k] = a[i + 6 + k]; a[i + 6 + k] = t; } g.computeVertexNormals(); }
  const mesh = new THREE.Mesh(g, ti); plates.add(mesh);
  HOLES.forEach(c => {
    const z = JUNC + c, x = surfX(sg, yc, z);
    const head = DK.lathe([[0.01, 0], [0.95, 0], [1.0, 0.25], [0.85, 0.65], [0.45, 0.9], [0.01, 0.95]], 24, ti);
    head.rotation.z = -sg * Math.PI / 2; head.position.set(x + sg * 0.55, yc, z); plates.add(head);
  });
  return mesh;
}
const plateR = plate(right, -7.5), plateL = plate(left, -7.5);
plates.visible = false;

// ---------- pose of the tooth-bearing part ----------
const st = { back: 0, gape: 0 };
const hinge = new THREE.Vector3(0, C.y, C.z), axis = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion();
function applyPose() {
  q.setFromAxisAngle(axis, st.gape);
  const piv = hinge.clone().sub(hinge.clone().applyQuaternion(q));
  distG.quaternion.copy(q); distG.position.copy(piv).add(new THREE.Vector3(0, 0, -D * st.back));
  m.teeth.group.position.z = D;                              // teeth sit D forward in the long jaw; the group carries them back
  trimMm = D * st.back;
  syncClip();
}
fig.param('back', 0, v => { st.back = v; st.gape = 0.075 * Math.sin(Math.PI * DK.util.clamp(v, 0, 1)); applyPose(); });
fig.param('cuts', 0, v => { cutMat.opacity = v; cutLines.visible = v > 0.01; });
fig.param('plates', 0, v => { plates.visible = v > 0.01; plates.children.forEach(c => { c.material.transparent = v < 0.99; c.material.opacity = v; }); });
fig.onFrame(() => syncClip());
applyPose();

// ---------- labels ----------
const t11 = mx.teeth.teeth.find(t => t.fdi === 11), t41 = m.teeth.teeth.find(t => t.fdi === 41);
fig.part(t41.tooth.group, { inPlace: true, name: 'Lower front teeth', anchor: [0, t41.spec.crownL - 1.5, 2.6], labelOffset: [80, 50], dim: false,
  info: 'Lower right central incisor, FDI 41 (Universal 25). In the underbite it closes in front of the upper incisors.' });
fig.part(t11.tooth.group, { inPlace: true, name: 'Upper front teeth', anchor: [0, t11.spec.crownL - 2, 3.0], labelOffset: [80, -60], dim: false,
  info: 'Upper right central incisor, FDI 11 (Universal 8). After surgery it closes just in front of the lower incisors again.' });
const vR = cutLines.userData['v-1'];
fig.part(cutLines, { inPlace: true, name: 'Cut lines', sub: 'behind the teeth', accent: true, anchor: vR[Math.floor(vR.length * 0.45)], labelOffset: [-110, 60], dim: false, when: () => cutMat.opacity > 0.5,
  info: 'Schematic cut lines of a sagittal split: along the front edge of the ramus, down the outer cortex behind the second molar, and (inside, not seen here) across the inner ramus above where the nerve enters. The bone is then split lengthwise.' });
fig.part(proxH, { inPlace: true, name: 'Jaw joint', sub: 'stays seated', anchor: [C.x, C.y + m.head.si / 2, C.z], labelOffset: [70, -60], dim: false,
  info: 'The back part with the condyle (proximal segment) stays where it is, so the jaw joint keeps its normal position.' });
fig.part(distH, { inPlace: true, name: 'Tooth-bearing part', sub: 'slides back', anchor: [-20, -18, -8], labelOffset: [-40, 70], dim: false,
  info: 'The front part carrying the teeth and the nerve (distal segment) slides back until the lower teeth fit behind the upper ones.' });
fig.part(plateR, { inPlace: true, name: 'Plates and screws', sub: 'hold it while it heals', anchor: [surfX(right, -7.5, JUNC + 5.35) - 1.0, -7.5, JUNC + 5.35], labelOffset: [-90, -70], dim: false, when: () => plates.visible,
  info: 'Small titanium plates and screws across the cut on each side hold the two parts while the bone heals. They usually stay in place.' });

// ---------- procedure ----------
const SIDE = { theta: -Math.PI / 2 + 0.08, phi: 1.5, zoom: 0.58, focus: [-30, 4, -38] };
const CLOSE = { theta: -0.95, phi: 1.6, zoom: 0.6, focus: [-12, 3, -14] };
const CUT = { theta: -Math.PI / 2 + 0.35, phi: 1.32, zoom: 0.5, focus: [-36, 0, -48] };
fig.procedure([
  { label: 'Underbite', caption: 'The lower jaw is too long: its front teeth close in front of the upper ones.', beats: [
    { dur: 0, hold: 1.2, theta: -1.2, phi: 1.42, zoom: 1, focus: 'auto', set: { back: 0, cuts: 0, plates: 0 }, labels: [] },
    Object.assign({ dur: 2.4, hold: 1.8, labels: ['Upper front teeth', 'Lower front teeth'], key: true }, CLOSE)] },
  { label: 'Cut lines', caption: 'Inside the mouth, the jaw is cut on each side behind the last molar.', beats: [
    Object.assign({ dur: 2.4, hold: 0.2, labels: [] }, CUT),
    { dur: 1.4, hold: 1.8, set: { cuts: 1 }, labels: ['Cut lines'], key: true }] },
  { label: 'Slide back', caption: 'The bone is split; the tooth-bearing part slides back, the joint part stays.', beats: [
    Object.assign({ dur: 2.0, hold: 0.2, set: { cuts: 0 }, labels: ['Jaw joint', 'Tooth-bearing part'] }, SIDE),
    { dur: 3.0, hold: 1.6, set: { back: 1 }, labels: ['Jaw joint', 'Tooth-bearing part'], key: true }] },
  { label: 'Plates', caption: 'Small plates and screws hold the parts together while the bone heals.', beats: [
    Object.assign({ dur: 2.0, hold: 0.2, set: { cuts: 0.25 }, labels: [] }, CUT),
    { dur: 1.4, hold: 1.8, set: { plates: 1, cuts: 0 }, labels: ['Plates and screws'], key: true }] },
  { label: 'New bite', caption: 'The lower front teeth now close behind the upper ones.', beats: [
    Object.assign({ dur: 2.6, hold: 2.4, labels: ['Upper front teeth', 'Lower front teeth', 'Plates and screws'], key: true }, { theta: -1.0, phi: 1.5, zoom: 0.62, focus: [-12, 2, -20] })] }
]);
fig.start();
