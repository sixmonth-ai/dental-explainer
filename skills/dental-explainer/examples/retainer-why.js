// Why a retainer after braces: a "why" figure (with vs without). One lower arch (34–44, crowns up) starts crowded,
// braces straighten it, ghosts show where the stretched gum fibres pull each tooth back, then the arch splits in two:
// without a retainer the incisors drift back toward crowding; with a wire bonded behind 33–43 they stay put.
// poster: step 5
// Arch frame: +x = patient's left, +z anterior (labial), y up. A tooth's own frame: y = long axis, +z labial.
// Crowding is drawn as rotations about the long axis plus labio-lingual shifts; relapse is partial (60 % of the way
// back), as it is clinically (dental-facts §19, Retention and relapse). Sizes in mm; rotations exaggerated slightly.
const fig = DK.figure({
  fov: 32,
  title: 'Why a retainer after braces',
  subtitle: 'Lower front teeth, FDI 43–33. Crowding simplified; real relapse is gradual.',
  view: { theta: 0, phi: 0.32, margin: 0.7 }
});
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const TEETH = [34, 33, 32, 31, 41, 42, 43, 44];
// Crowded starting position of each tooth: rotation about its long axis (rad) and labial (+) / lingual (-) shift.
const CROWD = {
  34: [0.05, 0.2], 33: [-0.14, 0.9], 32: [0.36, 0.7], 31: [-0.42, -1.5],
  41: [0.5, 1.4], 42: [-0.32, -0.9], 43: [0.16, 0.8], 44: [-0.05, 0.2]
};
const RELAPSE = 0.6;   // share of the original crowding that comes back without retention
const GAP = 23;        // each copy moves this far from the midline when the arch splits

const scene = new THREE.Group();
fig.part(scene, { name: 'Lower front teeth', label: false, info: 'The six lower front teeth and the first premolars, crowns up.' });

// The camera fits once, before the arch splits. An invisible box the size of the split layout makes it frame both
// copies on any screen shape; the single-arch steps zoom in (zoom < 1) instead.
const frameBox = new THREE.Mesh(new THREE.BoxGeometry(2 * GAP + 40, 2, 22), new THREE.MeshBasicMaterial({ visible: false }));
frameBox.position.set(0, 4, -9); frameBox.raycast = () => {};
fig.part(frameBox, { name: 'frame', label: false });

const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false });

// One copy of the arch: teeth that can be posed between crowded (1) and straight (0), its gum, and ghosts of the
// crowded positions. Both copies come from this function, so they start identical.
function makeArch() {
  const arch = DK.arch({ jaw: 'mandible', teeth: TEETH, build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
  const g = new THREE.Group(); g.add(arch.group); scene.add(g);
  g.updateMatrixWorld(true);
  const gum = DK.gingivaArch(arch); arch.group.add(gum);
  const base = new Map(arch.teeth.map(t => [t.fdi, { p: t.tooth.group.position.clone(), q: t.tooth.group.quaternion.clone() }]));
  const placeAt = (obj, fdi, k) => {          // k = share of the crowding (0 straight, 1 crowded)
    const b = base.get(fdi), [rot, dz] = CROWD[fdi];
    obj.quaternion.copy(b.q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot * k));
    obj.position.copy(b.p).add(new THREE.Vector3(0, 0, dz * k).applyQuaternion(b.q));
  };
  const pose = k => arch.teeth.forEach(t => placeAt(t.tooth.group, t.fdi, k));
  // ghosts: the crowns at their crowded positions, where the fibres pull them back to
  const ghosts = new THREE.Group(); arch.group.add(ghosts);
  arch.teeth.forEach(t => {
    if (Math.abs(CROWD[t.fdi][0]) < 0.1) return;
    const holder = new THREE.Group(); placeAt(holder, t.fdi, 1); ghosts.add(holder);
    const e = t.tooth.layers.enamel, m = new THREE.Mesh(e.geometry, ghostMat);
    m.position.copy(e.position); m.quaternion.copy(e.quaternion); m.scale.copy(e.scale);
    holder.add(m); holder.userData.fdi = t.fdi;
  });
  ghosts.visible = false;
  return { g, arch, gum, pose, ghosts, T: fdi => arch.teeth.find(t => t.fdi === fdi) };
}

const A = makeArch();   // without a retainer (stays on screen from the start)
const B = makeArch();   // with a retainer (appears when the arch splits)
A.pose(1); B.pose(0);
scene.updateMatrixWorld(true);

// ---- bonded retainer on B: 0.0175 in (0.44 mm) multistrand wire on the lingual middle third of 33–43, a composite pad per tooth
const onCrown = (t, side, x, h, off) => { const q = DK.crownSurface(t.spec, side).at(x, h); return t.tooth.group.localToWorld(V(q.p.map((v, k) => v + q.n[k] * off))); };
const toArch = p => B.arch.group.worldToLocal(p).toArray();
const front = [33, 32, 31, 41, 42, 43].map(B.T), H = t => t.spec.crownL * 0.45;
const lingPts = [];
front.forEach((t, i) => {
  const w = t.spec.md / 2;
  if (i === 0) lingPts.push(toArch(onCrown(t, -1, -w, H(t), 0.3)));
  lingPts.push(toArch(onCrown(t, -1, 0, H(t), 0.3)));
  if (i < front.length - 1) { const n = front[i + 1]; lingPts.push(toArch(onCrown(t, -1, w, H(t), 0.3).add(onCrown(n, -1, n.spec.md / 2, H(n), 0.3)).multiplyScalar(0.5))); }
  else lingPts.push(toArch(onCrown(t, -1, -w + 0.4, H(t), 0.3)));
});
const wire = DK.tube(lingPts, 0.22, DK.mat('steel', { color: DK.COLORS.steel, cap: 0x9ea4aa, roughness: 0.4 }), { segments: 120, radial: 10 });
B.arch.group.add(wire);
const pads = front.map(t => { const a = DK.attachment(t.spec, { side: -1, x: 0, y: H(t), w: 2.0, h: 1.8, d: 0.75 }); t.tooth.group.add(a); return a; });
const retainer = [wire, ...pads];

// ---- parts and labels
[[A, ''], [B, ' ']].forEach(([c, k]) => {
  c.arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: `${t.fdi}${k}`, label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
  fig.part(c.gum, { inPlace: true, name: `Gum${k}`, label: false, info: 'Gum (schematic).' });
});
// a label point on top of a tooth's crown, moving with the tooth
const crownTop = t => { const o = new THREE.Group(); o.position.set(0, t.spec.crownL * 0.9, 0); t.tooth.group.add(o); return o; };
// the side names sit behind each arch (the top of the frame, seen from above)
const tag = copy => { const o = new THREE.Group(); o.position.set(0, 4, -21); copy.arch.group.add(o); return o; };
fig.part(tag(A), { inPlace: true, name: 'No retainer', labelOffset: [0, -36], info: 'Nothing holds the teeth once the braces come off.' });
fig.part(tag(B), { inPlace: true, name: 'With retainer', labelOffset: [0, -36], info: 'A thin wire bonded behind the six front teeth holds them where the braces put them.' });
const t41 = A.T(41);
fig.part(crownTop(t41), { inPlace: true, name: 'Crowded', sub: 'before braces', labelOffset: [70, -60], dim: false,
  info: 'Crowded lower front teeth: rotated and overlapping.' });
fig.part(crownTop(A.T(31)), { inPlace: true, name: 'Crowding returns', sub: 'without a retainer', labelOffset: [-70, -60], dim: false,
  info: 'Without retention the fibres pull the teeth back part of the way; the lower front teeth crowd again. It happens gradually over months to years.' });
const g41 = A.ghosts.children.find(h => h.userData.fdi === 41);
fig.part(g41, { inPlace: true, name: 'Fibres pull back here', sub: 'toward the old position', anchor: [0, t41.spec.crownL * 0.9, 0], labelOffset: [80, -70], dim: false,
  info: 'Gum fibres around each tooth were stretched by the move. They take months, some longer than half a year, to reorganise, and until then they pull the tooth back.' });
fig.part(wire, { inPlace: true, name: 'Wire behind the teeth', sub: 'bonded retainer', anchor: lingPts[6], labelOffset: [90, 60], dim: false,
  info: 'A thin braided steel wire (about 0.44 mm) glued behind the lower front teeth. It cannot be seen from the front and stays in all the time.' });
fig.part(crownTop(B.T(41)), { inPlace: true, name: 'Still straight', labelOffset: [60, -70], dim: false,
  info: 'Held by the wire, the teeth stay where the braces put them.' });

// ---- the story's numbers
fig.param('crowd', 1, k => A.pose(k));                                         // A's crowding: 1 before braces, 0 straight, RELAPSE a year later
fig.param('ghost', 0, v => { A.ghosts.visible = v > 0.5; });
fig.param('split', 0, s => { A.g.position.x = -GAP * s; B.g.position.x = GAP * s; B.g.visible = s > 0.02; });
fig.param('wire', 0, v => retainer.forEach(o => { o.visible = v > 0.5; }));

const ABOVE = { theta: 0, phi: 0.32 };
fig.procedure([
  { label: 'Before braces', caption: 'The lower front teeth are crowded.', beats: [
    { dur: 0, hold: 0.6, ...ABOVE, zoom: 0.62, set: { crowd: 1, ghost: 0, split: 0, wire: 0 }, labels: [] },
    { dur: 1.8, hold: 2.0, theta: 0.1, phi: 0.4, zoom: 0.5, labels: ['Crowded'], key: true }] },
  { label: 'Braces straighten', caption: 'Braces move the teeth into a neat curve.', beats: [
    { dur: 2.6, hold: 1.6, ...ABOVE, zoom: 0.52, set: { crowd: 0 }, labels: [], key: true }] },
  { label: 'Fibres pull back', caption: 'The gum fibres were stretched; they pull each tooth toward where it was.', beats: [
    { dur: 0.6, hold: 0.2, set: { ghost: 1 }, labels: [] },
    { dur: 1.6, hold: 2.4, theta: 0.12, phi: 0.42, zoom: 0.5, labels: ['Fibres pull back here'], key: true }] },
  { label: 'Two paths', caption: 'Same teeth, two choices: no retainer, or a wire bonded behind them.', beats: [
    { dur: 0.5, hold: 0, set: { ghost: 0 }, labels: [] },
    { dur: 2.2, hold: 0.4, ...ABOVE, zoom: 1, set: { split: 1 }, labels: ['No retainer', 'With retainer'] },
    { dur: 0.6, hold: 2.0, set: { wire: 1 }, labels: ['No retainer', 'With retainer', 'Wire behind the teeth'], key: true }] },
  { label: 'A year later', caption: 'Without the retainer the crowding comes back; with it the teeth stay straight.', beats: [
    { dur: 3.0, hold: 0.4, set: { crowd: RELAPSE }, labels: ['No retainer', 'With retainer'] },
    { dur: 1.2, hold: 3.0, labels: ['No retainer', 'With retainer', 'Crowding returns', 'Still straight'], key: true }] }
]);
fig.view('From above', { ...ABOVE, zoom: 1, focus: 'auto' });
fig.view('From the tongue side', { theta: Math.PI, phi: 0.9, zoom: 1, focus: 'auto' });
fig.start();
