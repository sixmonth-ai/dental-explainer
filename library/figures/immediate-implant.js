// Procedure: an immediate implant in the maxillary right central incisor (FDI 11 = Universal 8), crown up (model convention), in a labio-palatal cut through the socket (CBCT-style slice). Frame: tooth frame of 11 (+x mesial, toward 21; +z labial; CEJ at y = 0), mm; camera on the mesial side for the cut (labial on the viewer's left).
// poster: step 5
// The tooth that cannot be kept comes out without a flap, keeping the thin labial wall; a drill makes room in the palatal wall of the
// socket and beyond the root tip; the implant goes in against the palatal wall, so a gap stays between it and the labial wall; bone
// graft granules fill that gap; a healing cap goes on and the gum heals around it. Diameters and the implant length are typical,
// not system values (dental-facts.md §7: regular diameter 3.75 to 4.5 mm; drill sequence is manufacturer-specific). The ridge is
// DK.bone warped to the incisor's labio-palatal profile, as in implant-11.
const CREST = -1.8;                                   // healthy crest, ~2 mm below the CEJ (§13)
const IMPLANT = { diameter: 3.75, length: 13, lead: 1.6 };
const TILT = 0.12;                                    // rad: apex toward the palate (~7°)
const PLAT = CREST - 0.6;                             // platform a little below the labial crest
const GUM_Y = 0.2, RISE = 0.8;
const PDL = 0.25, DRILL_D = 3.0;

const fig = DK.figure({
  fov: 26,
  title: 'Implant on extraction day',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8). Crown up.',
  view: { theta: 0.55, phi: 1.32, margin: 0.9 }
});

const t11 = DK.tooth(11), s11 = t11.spec, s12 = DK.toothPreset(12), s21 = DK.toothPreset(21);
const X12 = -(s11.md / 2 + s12.md / 2), X21 = s11.md / 2 + s21.md / 2;
const MID = (X12 + X21) / 2, WIDTH = X21 - X12 + 9;

// ---------- the ridge: labio-palatal profile of an upper incisor site ----------
const labRoot = y => DK.toothSurfaceAt(s11, Math.max(y, -s11.rootL + 0.6), Math.PI / 2).z;
const LAB = y => DK.util.lerp(labRoot(y) + 0.9, 4.2 + 0.08 * (-15 - y), DK.util.smooth(-9, -15, y));   // thin labial plate over the root
const PAL = y => -4.5 - 3.2 * DK.util.smooth(CREST, -16, y);                                             // thick palatal bone
const bone = DK.bone({ width: WIDTH, height: 18, depth: 10, cortical: 1.0, crest: 1.4 });
bone.position.set(MID, CREST, 0);
function warp(mesh, d, inset, yOff) {
  const p = mesh.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + yOff, u = (p.getZ(i) + d / 2) / d;
    const top = Math.min(1, Math.max(0, (y - (CREST - 1.4)) / 1.4));
    const lab = LAB(Math.min(y, CREST - 0.4)) - inset * (1 - 0.3 * top), pal = PAL(y) + inset * (1 - 0.3 * top);
    p.setZ(i, (lab + pal) / 2 + (u * 2 - 1) * (lab - pal) / 2);
  }
  p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
}
const L = bone.userData.layers;
warp(L.cortical, 10, 0, CREST);
warp(L.cancellous, 8, 0.8, CREST - 1.0);
const GUM_H = 5.6, GUM_D = 10;
const gum = DK.gingiva({ width: WIDTH + 0.6, height: GUM_H, depth: GUM_D, crest: 1.3, around: [
  { x: X12 - MID, z: 0, md: s12.mdC, bl: s12.blC, rise: RISE }, { x: -MID, z: 0, md: s11.mdC, bl: s11.blC, rise: RISE }, { x: X21 - MID, z: 0, md: s21.mdC, bl: s21.blC, rise: RISE }] });
gum.position.set(MID, GUM_Y, 0);
(() => {
  const p = gum.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + GUM_Y, u = (p.getZ(i) + GUM_D / 2) / GUM_D, yy = Math.min(y, CREST - 0.4);
    const t = DK.util.smooth(GUM_Y - GUM_H, GUM_Y - GUM_H + 3.0, y);
    const lab = Math.max(LAB(yy) + 0.05 + 1.15 * t, s11.blC / 2 + 0.6), pal = Math.min(PAL(yy) - 0.05 - 1.55 * t, -s11.blC / 2 - 0.6);
    p.setZ(i, (lab + pal) / 2 + (u * 2 - 1) * (lab - pal) / 2);
  }
  p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere();
})();

const t12 = DK.tooth(12), t21 = DK.tooth(21);
t12.group.position.x = X12; t21.group.position.x = X21; t21.group.scale.x = -1;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Upper jaw bone at the front (shown crown up): a thin plate on the lip side, thick bone toward the palate.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the front teeth.' });
fig.part(t12.group, { name: '12', label: false, fit: false, info: 'Upper right lateral incisor (Universal 7).' });
fig.part(t21.group, { name: '21', label: false, fit: false, info: 'Upper left central incisor (Universal 9).' });
const frame = new THREE.Mesh(new THREE.BoxGeometry(9, 27, 12), new THREE.MeshBasicMaterial({ visible: false }));   // what the camera frames: the site, crown to implant tip
frame.position.set(0, -3.6, -1.2);
fig.part(frame, { name: 'frame', label: false });
fig.part(bone, { inPlace: true, name: 'Thin labial wall', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1, CREST - 3.5, LAB(CREST - 3.5) - 0.35], labelOffset: [-110, 20], dim: false,
  info: 'The bone on the lip side of an upper incisor root is usually thin. Keeping it intact is why the tooth is removed gently, without a flap.' });

// ---------- the socket: the space the root leaves, shown on the cut ----------
const R0 = s11.roots[0];
const sockGeo = DK.rootGeometry(Object.assign({}, R0, { start: 0.95 }), { k: 1, add: PDL, minR: 0.3, endShort: -PDL });
const voidCap = new THREE.Mesh(sockGeo, DK.mat('cavity')); voidCap.userData.cutOnly = true; voidCap.visible = false;
const voidRim = new THREE.Mesh(DK.rootGeometry(Object.assign({}, R0, { start: 0.95 }), { k: 1, add: PDL + 0.12, minR: 0.4, endShort: -PDL - 0.12 }), DK.mat('cavity')); voidRim.userData.cutOnly = true; voidRim.visible = false;
const voidWalls = DK.asHole(new THREE.Mesh(sockGeo, DK.mat('cavity'))); voidWalls.visible = false;
[voidRim, voidCap, voidWalls].forEach(o => fig.world.add(o));
fig.part(voidCap, { inPlace: true, name: 'Empty socket', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1, -6.5, 0.2], labelOffset: [110, 0], dim: false, when: () => voidCap.visible, info: 'The fresh socket the root leaves. Its walls are kept: the implant goes straight into it.' });

// ---------- implant site: a tilted frame at the platform; drill, bed and implant live in it ----------
const R = IMPLANT.diameter / 2, YM = CREST - 1.0;
const ZIMP = (labRoot(YM) + PDL) - 2.0 - R;   // ~2 mm gap to the labial socket wall near the crest
const site = new THREE.Group(); site.position.set(0, PLAT, ZIMP); site.rotation.x = TILT; fig.world.add(site);
const axisZ = y => ZIMP - (PLAT - y) * Math.tan(TILT);                            // implant axis z at height y (world)
const gapAt = YM, gap = (labRoot(gapAt) + PDL) - (axisZ(gapAt) + R);
const bed = DK.osteotomy(); site.add(bed);
const drill = DK.drill({ diameter: DRILL_D, length: 16, shank: 8 }); site.add(drill);
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'conical' }); site.add(implant);
const heal = DK.lathe([[0, 0], [R, 0], [2.4, 1.6], [2.4, 3.4], [2.1, 3.6], [0, 3.6]], 48, DK.mat('titanium')); site.add(heal);
fig.part(drill, { inPlace: true, name: 'Drill', sub: 'into the palatal wall', anchor: [0, 2, 0], labelOffset: [90, -30], dim: false, info: 'The bed is drilled along the palatal wall of the socket and into the bone beyond the root tip, where the implant gets its grip. Drill sizes depend on the implant system.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `Ø${IMPLANT.diameter} × ${IMPLANT.length} mm`, anchor: [-0.3, -8, -R], labelOffset: [100, 10], dim: false, info: 'Placed against the palatal wall and anchored in the bone beyond the old root tip, not in the middle of the socket.' });
fig.part(heal, { inPlace: true, name: 'Healing cap', anchor: [2.4, 2.4, 0], labelOffset: [90, -20], dim: false, info: 'A healing abutment shapes the gum while the implant integrates, usually over 3 to 6 months (conventional loading, §7).' });

// ---------- the bone graft: fills the socket around the implant up to the crest ----------
const granules = (() => {   // particulate graft texture: pale irregular granules (~0.3 to 1 mm) in a darker matrix
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#b8a688'; x.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) {
    const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), shade = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      x.beginPath();
      for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); x.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); }
      x.closePath(); x.fillStyle = `rgb(${shade},${shade - 6},${shade - 20})`; x.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 5; return t;
})();
const graft = new THREE.Mesh(sockGeo.clone(), DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 }));
graft.userData.y0 = Float32Array.from(graft.geometry.attributes.position.array);
const setFill = level => {
  graft.visible = level > -s11.rootL;
  const p = graft.geometry.attributes.position, y0 = graft.userData.y0;
  for (let i = 0; i < p.count; i++) p.setY(i, Math.min(y0[i * 3 + 1], level));
  p.needsUpdate = true; graft.geometry.computeVertexNormals(); graft.geometry.computeBoundingSphere();
};
fig.world.add(graft);
fig.part(graft, { inPlace: true, name: 'Bone graft', sub: 'fills the gap', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1, CREST - 2.6, (labRoot(CREST - 2.6) + axisZ(CREST - 2.6) + R) / 2 + 0.1], labelOffset: [-120, 30], accent: true, dim: false,
  info: 'Bone substitute granules packed into the gap between the implant and the thin labial wall. They support that wall while new bone grows in, which limits the shrinkage that follows any extraction.' });
const gapMark = new THREE.Object3D(); gapMark.position.set(0.1, CREST - 2.6, (labRoot(CREST - 2.6) + axisZ(CREST - 2.6) + R) / 2); fig.world.add(gapMark);
fig.part(gapMark, { inPlace: true, name: 'Gap', sub: `about ${gap.toFixed(1)} mm`, anchor: [0, 0, 0], labelOffset: [-120, 30], dim: false, when: () => st.implant > 0.9 && st.fill < CREST - 6, info: 'The implant is narrower than the socket and sits toward the palate, so a gap is left on the lip side. Left empty, the thin wall in front of it would collapse more.' });

// ---------- params ----------
const st = { implant: 0, fill: -20 };
fig.param('out', 0, k => {
  t11.group.position.y = 24 * k * k; t11.group.visible = k < 0.999;
  voidCap.visible = voidRim.visible = k > 0.05; voidWalls.visible = k > 0.5 && st.implant < 0.05;
});
const DRILL_DEPTH = IMPLANT.length;
fig.param('drill', -20, d => { drill.visible = d > -15; drill.position.y = -d + 16; });
fig.param('bed', 0, d => bed.set(DRILL_D / 2, d));
fig.param('implant', 0, k => {
  st.implant = k; const travel = (1 - k) * (IMPLANT.length + 4);
  implant.visible = k > 0.001; implant.position.y = travel; implant.rotation.y = -travel / IMPLANT.lead * Math.PI * 2;
  voidWalls.visible = voidWalls.visible && k < 0.05;
  if (k > 0.9) bed.visible = false;   // the implant fills its bed
});
fig.param('fill', -20, v => { st.fill = v; setFill(v); });
fig.param('heal', 0, k => { heal.visible = k > 0.001; heal.position.y = (1 - k) * 8; if (k > 0.6) voidCap.visible = voidRim.visible = false; });   // the gum closes over the grafted socket

fig.world.add(t11.group);
fig.part(t11.group, { inPlace: true, name: 'Tooth 11', sub: 'cannot be kept', anchor: [0, s11.crownL * 0.6, s11.bl / 2 - 0.4], labelOffset: [-90, -30], dim: false, info: 'An upper front tooth that cannot be saved, for example after a root fracture. The bone around it is still intact.' });

// ---------- section: labio-palatal (mesial half removed, camera on +x) ----------
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.cortical], color: DK.COLORS.corticalCap },
  { objects: [L.cancellous], color: 0xffffff, texture: L.cancellous.userData.capTexture },
  { objects: [voidRim], color: DK.RIM, kind: 'plain' },
  { objects: [voidCap], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [bed], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [graft], color: 0xfaf3e4, texture: granules },
  { objects: [t11.layers.enamel, t12.layers.enamel, t21.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t11.layers.dentin, t11.layers.root, t12.layers.dentin, t12.layers.root, t21.layers.dentin, t21.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t11.layers.pulp, t12.layers.pulp, t21.layers.pulp], color: DK.COLORS.pulpCap }
]);
voidWalls.material.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });
fig.onFrame(() => { const cut = !!(fig.section && fig.section.enabled); t12.group.visible = t21.group.visible = !cut; });   // neighbours only in the 3D view: the cut reads alone

// ---------- the procedure (camera on +x looks at the cut: labial on the viewer's left) ----------
const SIDE = { theta: Math.PI / 2 - 0.1, phi: 1.42 };
const FOC = [0, -4.5, -0.8];
fig.procedure([
  { label: 'Tooth to remove', caption: 'An upper front tooth that cannot be saved.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 1.3, zoom: 1.25, focus: [0, 3, 0], section: false, labels: ['Tooth 11'] },
    { dur: 2.0, hold: 0.1, ...SIDE, zoom: 1, focus: FOC, labels: [] },
    { fov: 26, dur: 0, hold: 0, section: true, offset: 8 },
    { dur: 2.2, hold: 1.8, offset: 0, labels: ['Tooth 11', 'Thin labial wall'], key: true }] },
  { label: 'Gentle extraction', caption: 'The tooth comes out without a flap, keeping the thin labial wall.', beats: [
    { dur: 2.4, hold: 0.3, set: { out: 1 }, labels: [] },
    { dur: 1.2, hold: 1.8, labels: ['Empty socket', 'Thin labial wall'], key: true }] },
  { label: 'Drill', caption: 'The drill makes room along the palatal wall and past the root tip.', beats: [
    { dur: 1.2, hold: 0.1, set: { drill: 0 }, labels: ['Drill'] },
    { dur: 2.4, hold: 0.6, set: { drill: DRILL_DEPTH, bed: DRILL_DEPTH }, labels: ['Drill'], key: true },
    { dur: 1.0, hold: 0.1, set: { drill: -20 }, labels: [] }] },
  { label: 'Implant', caption: 'The implant threads in against the palatal wall, leaving a gap in front.', beats: [
    { dur: 0.6, hold: 0.1, set: { implant: 0.05 }, labels: ['Implant'] },
    { dur: 2.8, hold: 0.3, set: { implant: 1 }, labels: ['Implant'] },
    { dur: 1.4, hold: 1.8, zoom: 0.8, focus: [0, CREST - 3, 0.5], labels: ['Implant', 'Gap', 'Thin labial wall'], key: true }] },
  { label: 'Bone graft', caption: 'Graft granules fill the gap between implant and labial wall.', beats: [
    { dur: 2.6, hold: 0.3, set: { fill: CREST + 0.1 }, labels: ['Bone graft'] },
    { dur: 1.2, hold: 2.0, labels: ['Bone graft', 'Implant', 'Thin labial wall'], key: true }] },
  { label: 'Healing cap', caption: 'A healing cap goes on; the gum heals around it over the coming months.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 1, focus: FOC, labels: [] },
    { dur: 1.6, hold: 2.4, set: { heal: 1 }, labels: ['Healing cap', 'Bone graft', 'Implant'], key: true }] }
]);
fig.start();
