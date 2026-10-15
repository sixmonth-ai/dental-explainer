// Brushing at the gumline on the lower left first molar (FDI 36 = Universal 19) with its neighbours 35 and 37, crowns up in the jaw.
// poster: step 2
// Plaque collects in a band along the gum margin. The brush is set with its bristles at about 45 degrees to the tooth, tips
// aimed into the gumline (the Bass technique), moved in short gentle strokes, and the band comes off. A cheek-to-tongue cut
// through 36 shows the bristle tips reaching the sulcus at 45 degrees. Brushing angle and technique are standard teaching, not in
// dental-facts.md (§6 sulcus, §13 healthy margin).
// Frame: tooth 36's, mirrored (scale.x = -1: a preset tooth has right-side chirality), so world +x = distal (toward 37), -x =
// mesial (toward 35 and the front of the mouth); +z = buccal; y up, CEJ at y = 0. The cut removes the distal half (+x).
const { smooth, lerp, clamp } = DK.util;
const ANGLE = Math.PI / 4;         // about 45 degrees between the bristles and the long axis of the tooth
const M = 1.0;                     // gum margin, about 1 mm up on the enamel (healthy)
const PH = 1.9;                    // height of the plaque band above the margin (illustrative)

const fig = DK.figure({
  fov: 30,
  title: 'Brushing at the gumline',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19).',
  view: { theta: 0.45, phi: 1.2 }
});
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide });

// ---------- teeth: 35 | 36 | 37 in a row, contacts touching (left teeth mirrored)
const t36 = DK.tooth(36), s = t36.spec; t36.group.scale.x = -1;
const t35 = DK.tooth(35), t37 = DK.tooth(37);
const X35 = -(s.md / 2 + t35.spec.md / 2 - 0.15), X37 = s.md / 2 + t37.spec.md / 2 - 0.15;
t35.group.scale.x = -1; t35.group.position.x = X35; t37.group.scale.x = -1; t37.group.position.x = X37;
fig.part(t36.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar (Universal 19).' });
fig.part(t35.group, { name: 'Tooth 35', label: false, fit: false, info: 'Lower left second premolar (Universal 20).' });
fig.part(t37.group, { name: 'Tooth 37', label: false, fit: false, info: 'Lower left second molar (Universal 18).' });

// ---------- bone and gum
const CX = (X35 + X37) / 2;
const bone = DK.bone({ width: 36, height: 9, depth: 11.5, cortical: 1.2, crest: 1.4 }); bone.position.set(CX, -1.8, 0);
const gum = DK.gingiva({ width: 36.6, height: 5.2, depth: 12.4, crest: 1.3, around: [
  { x: X35 - CX, z: 0, md: t35.spec.mdC, bl: t35.spec.blC }, { x: -CX, z: 0, md: s.mdC, bl: s.blC }, { x: X37 - CX, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
gum.position.set(CX, M - 0.8, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Healthy gum: its edge sits on the enamel and a shallow groove (the sulcus) runs between it and the tooth.' });
const sulcus = DK.pocket(s, { margin: M, base: 0, width: 0.18 }); t36.group.add(sulcus);

// ---------- plaque: a soft band on the buccal surface of 36 along the gum margin (a closed lens-shaped solid)
const plaqueMat = DK.mat('composite', { color: 0xc6a456, roughness: 0.95, cap: 0xc2a05a }); plaqueMat.transparent = true;
const TH0 = 0.35, TH1 = Math.PI - 0.35, ROWS = 40, COLS = 20;
const plaqueGeo = k => DK.gridGeometry(ROWS, COLS, (i, j) => {
  const u = i / ROWS, th = lerp(TH0, TH1, u), end = Math.sin(Math.PI * u), sa = j / COLS * Math.PI * 2;
  const H = PH * (0.35 + 0.65 * Math.pow(end, 0.5)), t = Math.max(0.02, 0.5 * k * Math.pow(end, 0.6));
  const y = M - 0.15 + H / 2 - (H / 2) * Math.cos(sa), d = -0.06 + (t + 0.06) * (0.5 + 0.5 * Math.sin(sa)) * (0.45 + 0.55 * smooth(M + H + 0.1, M + 0.55 * H, y));
  const q = DK.toothSurfaceAt(s, y, th), r = Math.hypot(q.x, q.z) || 1;
  return [q.x + q.x / r * d, y, q.z + q.z / r * d];
}, [DK.toothSurfaceAt(s, M + 0.5, TH1).x, M + 0.5, DK.toothSurfaceAt(s, M + 0.5, TH1).z], [DK.toothSurfaceAt(s, M + 0.5, TH0).x, M + 0.5, DK.toothSurfaceAt(s, M + 0.5, TH0).z]);
const plaque = new THREE.Mesh(plaqueGeo(1), plaqueMat); t36.group.add(plaque);
const setPlaque = k => { const g2 = plaqueGeo(k), p = plaque.geometry.attributes.position; p.array.set(g2.attributes.position.array); p.needsUpdate = true; plaque.geometry.computeVertexNormals(); g2.dispose(); plaqueMat.opacity = smooth(0, 0.35, k); plaque.visible = k > 0.02; };

// ---------- the toothbrush: tips of the bristles at the local origin, bristles along +y to the head, handle along -x
const brush = new THREE.Group(); fig.world.add(brush); brush.visible = false;
const brushMats = [];
{
  const nylon = new THREE.MeshStandardMaterial({ color: DK.color(0xeeeae2), roughness: 0.6, metalness: 0 }), body = DK.mat('composite', { color: 0x8f9aa3, roughness: 0.45, cap: 0x8f9aa3 });
  brushMats.push(nylon, body);
  const BL = 10, ROWSN = 4, TUFTS = 12, SP = 1.75;
  // each row of tufts ends where it meets the tooth or the gum (the bristles press on the surface): solve its tip along the bristle
  const zS = y => DK.toothSurfaceAt(s, y, Math.PI / 2).z;
  const outer = y => y >= M ? zS(y) : Math.min(6.25, zS(M) + (M - y) * 0.5);   // tooth above the margin, gum below
  const P0y = M - 0.15, P0z = zS(M - 0.15) + 0.45, ca = Math.cos(ANGLE), sa = Math.sin(ANGLE);
  for (let r = 0; r < ROWSN; r++) {
    const zr = (r - 1) * SP;            // row 1 at the sulcus, row 0 on the enamel above it, rows 2 and 3 down over the gum
    let lo = -6, hi = 8; for (let it = 0; it < 40; it++) { const y0 = (lo + hi) / 2, wy = P0y + y0 * ca - zr * sa, wz = P0z + y0 * sa + zr * ca; if (wz - outer(wy) > 0.05) hi = y0; else lo = y0; }
    const y0 = (lo + hi) / 2, g = DK.lathe([[0, y0], [0.42, y0 + 0.12], [0.62, y0 + 0.45], [0.66, y0 + 1.0], [0.66, BL]], 14);
    for (let k = 0; k < TUFTS; k++) { const m = new THREE.Mesh(g, nylon); m.position.set((k - (TUFTS - 1) / 2) * SP, 0, zr); brush.add(m); }
  }
  const headShape = new THREE.Shape(), hw = TUFTS * SP / 2 + 0.9, hd = ROWSN * SP / 2 + 0.9, rr = 3;
  headShape.moveTo(-hw + rr, -hd); headShape.lineTo(hw - rr, -hd); headShape.quadraticCurveTo(hw, -hd, hw, -hd + rr); headShape.lineTo(hw, hd - rr); headShape.quadraticCurveTo(hw, hd, hw - rr, hd); headShape.lineTo(-hw + rr, hd); headShape.quadraticCurveTo(-hw, hd, -hw, hd - rr); headShape.lineTo(-hw, -hd + rr); headShape.quadraticCurveTo(-hw, -hd, -hw + rr, -hd);
  const headGeo = new THREE.ExtrudeGeometry(headShape, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 4, curveSegments: 10 });
  headGeo.rotateX(-Math.PI / 2); const head = new THREE.Mesh(headGeo, body); head.position.set(0, BL + 0.8, SP / 2); brush.add(head);
  // neck and handle: a tapered bar running toward the front of the mouth (-x), rising a little out of the mouth
  const zc = SP / 2; const neck = DK.tube([[-hw + 1, BL + 2.4, zc], [-hw - 10, BL + 3.2, zc], [-hw - 30, BL + 5.5, zc], [-hw - 70, BL + 9, zc]], 2.2, body, { taper: t => 0.7 + 0.6 * t, caps: true });
  brush.add(neck);
  brush.userData.hw = hw;
}
fig.part(brush, { inPlace: true, name: 'Bristles', sub: 'tips into the gumline', anchor: [-3, 0.6, 0], labelOffset: [-90, 70], dim: false, info: 'A soft brush, held so the bristles point at the gum at about 45 degrees. The tips slip just under the gum edge, where plaque starts.' });

// ---------- the 45 degree marker (accent): the long axis of the tooth and the bristle direction meeting at the gumline, with an arc
const angleGrp = new THREE.Group(); fig.world.add(angleGrp);
const zB = y => DK.toothSurfaceAt(s, y, Math.PI / 2).z;
const TIP = [0.15, M - 0.15, zB(M - 0.15) + 0.45];
{
  const ribbon = (pts, w) => DK.tube(pts, w, accentMat, { caps: true });
  const L = 6.5, a = [TIP[0], TIP[1], TIP[2]];
  angleGrp.add(ribbon([a, [a[0], a[1] + L, a[2]]], 0.07));                                                     // along the tooth's long axis
  angleGrp.add(ribbon([a, [a[0], a[1] + L * Math.cos(ANGLE), a[2] + L * Math.sin(ANGLE)]], 0.07));             // along the bristles
  const arc = []; for (let i = 0; i <= 20; i++) { const t = i / 20 * ANGLE; arc.push([a[0], a[1] + 3.6 * Math.cos(t), a[2] + 3.6 * Math.sin(t)]); }
  angleGrp.add(ribbon(arc, 0.07));
}
angleGrp.visible = false;
const anglePart = fig.part(angleGrp, { inPlace: true, name: 'About 45°', sub: 'to the tooth', anchor: (e, sec) => [0.15, TIP[1] + 3.6 * Math.cos(ANGLE / 2), TIP[2] + 3.6 * Math.sin(ANGLE / 2)], labelOffset: [90, -60], accent: true, dim: false, info: 'The bristles meet the tooth at about 45 degrees, aimed at the gum edge, so they reach into the groove between gum and tooth.' });

// ---------- other labels
const cutX = sec => (sec.enabled ? sec.offset : 0);
const plaquePart = fig.part(plaque, { inPlace: true, name: 'Plaque', sub: 'builds up at the gumline', anchor: (() => { const q = DK.toothSurfaceAt(s, M + 0.8, Math.PI / 2 - 0.35); return [q.x, M + 0.8, q.z + 0.2]; })(), labelOffset: [-90, -50], dim: false, info: 'A soft, sticky film of bacteria. It collects along the gum edge, where a brush held flat skips over it; left there it inflames the gum and hardens into tartar.' });
const strokePart = fig.part(brush, { inPlace: true, name: 'Short strokes', sub: 'gentle, a tooth or two at a time', anchor: [8, 12, 0], labelOffset: [70, -60], dim: false, info: 'Small back-and-forth movements of a few millimetres, keeping the angle, then move on to the next teeth. Scrubbing hard does not clean better and can wear the gum back.' });
const cleanPart = fig.part(t36.layers.enamel, { inPlace: true, name: 'Clean gumline', anchor: (() => { const q = DK.toothSurfaceAt(s, M + 0.9, Math.PI / 2 - 0.35); return [q.x, M + 0.9, q.z]; })(), labelOffset: [-90, -50], dim: false, info: 'The plaque along the gum edge is gone. Brush the inner (tongue) side the same way, then clean between the teeth with floss or interdental brushes.' });
const sulcusPart = fig.part(sulcus, { inPlace: true, name: 'Gum groove', sub: 'sulcus', anchor: (e, sec) => [-(cutX(sec) + 0.1), M - 0.5, zB(M - 0.5) + 0.2], labelOffset: [100, 60], when: (e, sec) => sec.enabled, dim: false, info: 'The shallow groove between the gum and the tooth, about 1 mm deep (a probe reads up to 3 mm in health). The bristle tips reach into its opening.' });

// ---------- section: cheek-to-tongue through 36, removing the distal half (+x); camera on the distal side
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [sulcus], color: 0x4a403c },
  { objects: [plaque], color: 0xc2a05a, kind: 'plain' },
  { objects: [t36.layers.enamel, t35.layers.enamel, t37.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t36.layers.dentin, t36.layers.root, t35.layers.dentin, t35.layers.root, t37.layers.dentin, t37.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t36.layers.pulp, t35.layers.pulp, t37.layers.pulp], color: DK.COLORS.pulpCap }
]);
brushMats.forEach(m => { m.clippingPlanes = [fig.section.plane]; m.side = THREE.DoubleSide; });
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-4, 4], offset: 0 } });

// ---------- params: the brush comes in from the cheek side, sets at 45 degrees, strokes along the teeth, and leaves
const B = { in: 0, stroke: 0 };
const placeBrush = () => {
  const k = B.in, sx = Math.sin(B.stroke * Math.PI * 2 * 5) * 1.3 * smooth(0, 0.08, B.stroke) * smooth(1, 0.92, B.stroke);
  brush.rotation.set(ANGLE, 0, 0);
  // bristle tips on the gumline: one row in the sulcus, the others on the enamel above it
  const tipX = -1.5 + sx, tipY = M - 0.15, tipZ = zB(M - 0.15) + 0.45;
  brush.position.set(tipX, tipY + (1 - k) * 4, tipZ + (1 - k) * 12);
  brush.visible = k > 0.01;
};
fig.param('in', 0, v => { B.in = v; placeBrush(); });
fig.param('stroke', 0, v => { B.stroke = v; placeBrush(); });
fig.param('plaque', 1, k => setPlaque(k));
fig.param('angle', 0, v => { accentMat.opacity = v; angleGrp.visible = v > 0.02; });
setPlaque(1);

// ---------- procedure
const HOME = { theta: 0.45, phi: 1.2, zoom: 1.0, focus: 'auto', fov: 30 };
const SIDE = { theta: Math.PI / 2 - 0.1, phi: 1.45, zoom: 0.78, focus: [0, M + 0.8, 2.4], fov: 26 };
fig.procedure([
  { label: 'Plaque at the gumline', caption: 'Plaque collects in a band along the gum edge.', beats: [
    Object.assign({ dur: 0, hold: 1.2, labels: [], section: false, set: { in: 0, stroke: 0, plaque: 1, angle: 0 } }, HOME, { theta: 0.75, phi: 1.1 }),
    { dur: 2.2, hold: 2.2, theta: 0.2, phi: 1.32, zoom: 0.62, focus: [0, M + 0.8, 3], labels: ['Plaque'], key: true }] },
  { label: 'Bristles at 45°', caption: 'Tilt the brush so the bristles point at the gum, at about 45 degrees.', beats: [
    { dur: 2.0, hold: 0.3, set: { in: 1 }, theta: 0.35, phi: 1.25, zoom: 0.8, focus: 'auto', labels: ['Bristles'] },
    Object.assign({ dur: 2.0, hold: 0.2, labels: [] }, SIDE, { zoom: 0.9, focus: 'auto' }),
    { dur: 0, hold: 0, section: true, offset: 7 },
    Object.assign({ dur: 2.2, hold: 0.3, offset: 0, labels: ['Bristles', 'Gum groove'] }, SIDE),
    { dur: 1.0, hold: 2.4, set: { angle: 1 }, labels: ['About 45°', 'Bristles', 'Gum groove'], key: true }] },
  { label: 'Short strokes', caption: 'Small back-and-forth strokes, a tooth or two at a time.', beats: [
    { dur: 0.6, hold: 0, set: { angle: 0 }, labels: [] },
    { dur: 0, hold: 0, section: false },
    { dur: 2.0, hold: 0.2, labels: ['Short strokes'], theta: 1.3, phi: 1.05, zoom: 1.05, focus: 'auto', fov: 30 },
    { dur: 4.0, hold: 0.4, ease: 'linear', set: { stroke: 1, plaque: 0 }, labels: ['Short strokes'], key: true }] },
  { label: 'Clean gumline', caption: 'The band at the gum edge comes off. Then the inner side, the same way.', beats: [
    { dur: 1.6, hold: 0.2, set: { in: 0, stroke: 0 }, labels: [] },
    { dur: 2.0, hold: 2.6, theta: 0.2, phi: 1.32, zoom: 0.62, focus: [0, M + 0.8, 3], labels: ['Clean gumline'], key: true }] }
]);
fig.start();
