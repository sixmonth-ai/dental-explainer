// Procedure: a knocked-out (avulsed) upper right central incisor, FDI 11 (Universal 8), crown up (model convention), with 12 and 21 beside it. Frame: tooth frame of 11 (+x mesial, toward 21; +z labial; CEJ at y = 0, mm). The cut is labio-palatal through 11 (mesial half removed, camera on +x: labial on the viewer's left).
// poster: step 1
// The tooth leaves its socket with the periodontal ligament torn: living ligament cells stay on the root surface and on the socket wall.
// Hold it by the crown (never the root), put it back in the socket at once, and the dentist splints it to its neighbours with a
// flexible splint for about 2 weeks. Cells on a dry root die within about an hour (IADT 2020 guidelines; not in dental-facts.md, shown as "about").
const CREST = -1.6, GUM_TOP = 1.1;
const s11 = DK.toothPreset(11), s12 = DK.toothPreset(12), s21 = DK.toothPreset(21);
const X21 = s11.md / 2 + s21.md / 2 + 0.1, X12 = -(s11.md / 2 + s12.md / 2 + 0.1);
const OUT = { y: 17, z: 11, tilt: 0.75 };            // where the knocked-out tooth hangs (mm, rad)

const fig = DK.figure({
  fov: 30,
  title: 'Knocked-out tooth',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up.',
  view: { theta: 0.45, phi: 1.25, margin: 0.95 }
});

// ---------- context: bone, gum and the two neighbours ----------
const bone = DK.bone({ width: 30, height: 17, depth: 11, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, -1.4);
const gum = DK.gingiva({ width: 30, height: 3.0, depth: 12.2, crest: 1.2, around: [
  { x: X12, z: 0.4, md: s12.mdC, bl: s12.blC, rise: 0.9 }, { x: 0, z: 1.4, md: s11.mdC, bl: s11.blC, rise: 0.9 }, { x: X21, z: 1.0, md: s21.mdC, bl: s21.blC, rise: 0.9 }] });
gum.position.set(0, GUM_TOP, -1.4);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the front teeth; the plate on the lip side is thin.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the front teeth.' });
const t12 = DK.tooth(12), t21 = DK.tooth(21), t11 = DK.tooth(11);
t12.group.position.set(X12, 0, -0.7); t12.group.rotation.y = -0.2;
t21.group.position.set(X21, 0, -0.2); t21.group.scale.x = -1; t21.group.rotation.y = 0.12;   // 21 is the mirror of 11 across the midline
fig.part(t12.group, { name: '12', label: false, fit: false, info: 'Upper right lateral incisor (Universal 7).' });
fig.part(t21.group, { name: '21', label: false, fit: false, info: 'Upper left central incisor (Universal 9).' });
const frame = new THREE.Mesh(new THREE.BoxGeometry(12, 34, 30), new THREE.MeshBasicMaterial({ visible: false }));   // the socket and the tooth above it
frame.position.set(0, 4, 4);
fig.part(frame, { name: 'frame', label: false });

// ---------- the tooth with its ligament cells (moves) ----------
const lig = DK.pdl(t11.spec, 0.12, -0.6);
const ligMat = DK.mat('pdl', { color: 0xc0908a, roughness: 0.6, opacity: 0.5 }); ligMat.depthWrite = false; lig.traverse(m => { if (m.isMesh) m.material = ligMat; });
t11.group.add(lig);
fig.world.add(t11.group);
fig.part(t11.group, { inPlace: true, name: 'Tooth 11', anchor: [0, s11.crownL + 0.3, 0], dim: false, info: 'Upper right central incisor: one root, about 13 mm long.' });
const rc = new THREE.Raycaster();
const ligAnchor = (() => { lig.updateMatrixWorld(true); rc.set(new THREE.Vector3(0, -6, 30), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(lig, true); return h.length ? h[0].point.toArray() : [0, -6, 3]; })();
const ligPart = fig.part(lig, { inPlace: true, name: 'Ligament cells', sub: 'on the root', accent: true, anchor: ligAnchor, labelOffset: [-110, 30], dim: false,
  info: 'The torn periodontal ligament: a film of living cells on the root surface that can reattach the tooth. Kept wet they survive; on a dry root most are dead within about an hour.' });
const crownAnchor = (() => { t11.group.updateMatrixWorld(true); rc.set(new THREE.Vector3(0, s11.crownL * 0.55, 30), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(t11.layers.enamel, true); return h.length ? h[0].point.toArray() : [0, 6, 3.5]; })();
fig.part(t11.layers.enamel, { inPlace: true, name: 'Hold the crown', sub: 'not the root', anchor: crownAnchor, labelOffset: [-110, -40], dim: false,
  info: 'Pick the tooth up by the white crown only. Touching, scrubbing or wiping the root damages the cells it needs to reattach. If it is dirty, rinse it briefly in cold water or milk.' });

// ---------- the socket the tooth leaves: empty space in the cut, lined by torn ligament ----------
const sock = new THREE.Group(); fig.world.add(sock);
const rootGeo = DK.pdl(t11.spec, 0.2, CREST).children[0].geometry;
const collar = add => DK.rootGeometry({ x: 0, z: 0, len: GUM_TOP + 1.0 - CREST + 0.5, ra: s11.mdC / 2 + 0.2 + add, rb: s11.blC / 2 + 0.2 + add, taper: 0.1, start: GUM_TOP + 1.0 }, { k: 1, add: 0, minR: 0.3 });
const cutOnly = geo => { const m = new THREE.Mesh(geo, DK.mat('cavity')); m.userData.cutOnly = true; sock.add(m); return m; };
const lining = [cutOnly(DK.inflateGeometry(rootGeo, 0.22))];
const voids = [cutOnly(rootGeo.clone()), cutOnly(collar(0))];
fig.part(voids[0], { inPlace: true, name: 'Empty socket', sub: 'lined with ligament', anchor: (e, s) => [(s.enabled ? s.offset : 0) + 0.1, -7, 0], labelOffset: [110, 40], dim: false,
  when: () => outK > 0.5, info: 'The socket keeps the other half of the torn ligament. Put the tooth back the right way round (front surface facing the lips) and bite gently on a cloth.' });

// ---------- the splint (dentist): a light flexible wire bonded to the labial surfaces of 12, 11 and 21 ----------
const labialPoint = (t, y) => { t.group.updateMatrixWorld(true); const p = t.group.localToWorld(new THREE.Vector3(0, y, 0)); rc.set(new THREE.Vector3(p.x, p.y, 40), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(t.layers.enamel, true); return h.length ? h[0].point : p; };
const splint = new THREE.Group(); fig.world.add(splint);
const SY = s11.crownL * 0.55;
const pts = [labialPoint(t12, SY * 0.95), labialPoint(t11, SY), labialPoint(t21, SY)];
const wirePts = [pts[0].clone().add(new THREE.Vector3(-1.6, 0, -0.6)), pts[0], pts[1], pts[2], pts[2].clone().add(new THREE.Vector3(1.6, 0, -0.5))].map(p => [p.x, p.y, p.z + 0.75]);
splint.add(DK.tube(new THREE.CatmullRomCurve3(wirePts.map(p => new THREE.Vector3(...p))).getPoints(40).map(v => v.toArray()), 0.22, DK.mat('steel'), { caps: true }));
const compMat = DK.mat('composite');
pts.forEach(p => { const d = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 16), compMat); d.scale.set(1.25, 1, 0.5); d.position.set(p.x, p.y, p.z + 0.35); splint.add(d); });
splint.visible = false;
fig.part(splint, { inPlace: true, name: 'Flexible splint', sub: 'about 2 weeks', anchor: [pts[1].x, pts[1].y - 1.6, pts[1].z + 0.9], labelOffset: [40, 90], accent: true, dim: false,
  info: 'A thin wire bonded to the neighbouring teeth holds the tooth while the ligament reattaches, usually for about 2 weeks. A root canal treatment usually follows for an adult tooth.' });

// ---------- params ----------
let outK = 0;
fig.param('out', 0, k => {
  outK = k; const e = k * k * (3 - 2 * k);
  t11.group.position.set(0, OUT.y * e, OUT.z * Math.sin(Math.PI / 2 * k)); t11.group.rotation.x = OUT.tilt * e; t11.group.rotation.y = 0.5 * e;
});
fig.param('ctx', 1, v => { bone.visible = gum.visible = sock.visible = v > 0.5; });
fig.param('nb', 1, v => { t12.group.visible = t21.group.visible = v > 0.5; });
fig.param('splint', 0, v => { splint.visible = v > 0.02; splint.scale.setScalar(0.6 + 0.4 * v); splint.position.z = 2 * (1 - v); });

// ---------- section: labio-palatal through 11 (mesial half removed). The tooth itself is not cut, so it stands whole in its socket. ----------
fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: lining, color: 0xa87a76, kind: 'plain' },
  { objects: voids, color: DK.holeCap(fig), kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 3], offset: 0 } });

// ---------- procedure ----------
const SIDE = { theta: Math.PI / 2 - 0.35, phi: 1.38 };
fig.procedure([
  { label: 'Knocked out', caption: 'A blow knocks the tooth out of its socket; the ligament tears.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.45, phi: 1.25, zoom: 0.95, section: false, set: { out: 0, nb: 1, splint: 0, ctx: 1 }, labels: ['Tooth 11'] },
    { dur: 1.4, hold: 0, theta: SIDE.theta, phi: SIDE.phi, fov: 28, set: { nb: 0 }, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    { dur: 1.6, hold: 0.1, offset: 0, labels: [] },
    { dur: 1.6, hold: 1.8, set: { out: 1 }, labels: ['Ligament cells', 'Empty socket'], key: true }] },
  { label: 'Hold the crown', caption: 'Pick it up by the crown only; never touch or scrub the root.', beats: [
    { dur: 2.0, hold: 2.2, zoom: 0.5, focus: [0, OUT.y + 1, OUT.z - 2.5], theta: SIDE.theta + 0.25, set: { ctx: 0 }, labels: ['Hold the crown', 'Ligament cells'], key: true }] },
  { label: 'Back in fast', caption: 'Push it straight back into the socket, within minutes. If that is not possible, keep it in milk or in the cheek and go to a dentist now.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.72, focus: [0, 0, 1], theta: SIDE.theta, set: { ctx: 1 }, labels: ['Empty socket'] },
    { dur: 2.2, hold: 1.8, set: { out: 0 }, labels: ['Ligament cells', 'Tooth 11'], key: true }] },
  { label: 'Splint', caption: 'The dentist splints it to its neighbours for about two weeks while the ligament reattaches.', beats: [
    { dur: 0, hold: 0, section: false },
    { dur: 2.0, hold: 0.2, theta: 0.25, phi: 1.32, zoom: 0.74, focus: [1.2, 2, 0], set: { nb: 1 }, labels: [] },
    { dur: 1.6, hold: 2.4, set: { splint: 1 }, labels: ['Flexible splint'], key: true }] }
]);
fig.start();
