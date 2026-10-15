// Comparison: the lower right central incisor (FDI 41 = Universal 25) at three bone levels, labio-lingual cut, crown up: the less bone holds the root, the further the crown rocks.
// poster: end
// Three independent sets side by side along z (one cut, removeToward +x; camera on +x: healthy on the viewer's left, Grade 2 on the right). Each tooth sits in a holder
// and tips about its centre of resistance (DK.centreOfResistance of the bone it has left, DK.moveTooth) inside a fixed socket. Displacement at the incisal edge is to scale.
// Frame: +x mesial, +z labial, CEJ at y = 0, mm. Mobility grades (Miller) are not in dental-facts.md: given as "about".
const FDI = 41, GZ = 15;
const SETS = [
  { name: 'Healthy', sub: 'moves about 0.2 mm', crest: -1.8, disp: 0.15, gap: 0.2, z: GZ, crestName: 'Normal bone' },
  { name: 'Grade 1', sub: 'up to about 1 mm', crest: -5.3, disp: 0.8, gap: 0.3, z: 0, crestName: 'Bone loss' },
  { name: 'Grade 2', sub: 'over 1 mm', crest: -8.8, disp: 1.7, gap: 0.4, z: -GZ, crestName: 'Severe bone loss', accent: true }
];
const fig = DK.figure({
  fov: 26,
  title: 'Loose teeth and mobility grades',
  subtitle: 'Lower right central incisor, FDI 41 (Universal 25), cut lip to tongue. Movement to scale.',
  view: { theta: Math.PI / 2 - 0.06, phi: 1.48 }
});
const s0 = DK.toothPreset(FDI);
const LAB = Math.PI / 2, LIN = -Math.PI / 2;

// crown outline in the cut plane (tooth frame), traced from the built enamel and dentin meshes: labial face up, over the edge, lingual face down
const profile = (() => {
  const t = DK.tooth(FDI), bins = new Map(), STEP = 0.25, Y0 = -0.8, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  t.group.updateMatrixWorld(true);
  [t.layers.enamel, t.layers.dentin].forEach(o => o.traverse(m => {
    if (!m.isMesh) return; const g = m.geometry, p = g.attributes.position, ix = g.index ? g.index.array : null, n = ix ? ix.length : p.count;
    for (let i = 0; i < n; i += 3) {
      const v = [0, 1, 2].map(k => [a, b, c][k].fromBufferAttribute(p, ix ? ix[i + k] : i + k).applyMatrix4(m.matrixWorld).clone());
      for (let k = 0; k < 3; k++) { const P = v[k], Q = v[(k + 1) % 3]; if ((P.x <= 0) === (Q.x <= 0)) continue;
        const u = P.x / (P.x - Q.x), y = P.y + (Q.y - P.y) * u, z = P.z + (Q.z - P.z) * u; if (y < Y0) continue;
        const key = Math.round(y / STEP), e = bins.get(key) || [1e9, -1e9, -1e9]; bins.set(key, [Math.min(e[0], z), Math.max(e[1], z), Math.max(e[2], y)]); }
    }
  }));
  const keys = [...bins.keys()].sort((p, q) => p - q), top = keys[keys.length - 1], e = bins.get(top);
  const lab = keys.slice(0, -1).map(k => [0, k * STEP, bins.get(k)[1]]), lin = keys.slice(0, -1).map(k => [0, k * STEP, bins.get(k)[0]]).reverse();
  return lab.concat([[0, e[2], (e[0] + e[1]) / 2]], lin);
})();
const inkHex = fig.dark ? 0xc9c4b8 : 0x4a4740;

const sets = SETS.map(o => {
  const tooth = DK.tooth(FDI), s = tooth.spec;
  const bone = DK.bone({ width: 9, height: 14.6 + o.crest, depth: 7.6, cortical: 0.9, crest: 1.2 }); bone.position.set(0, o.crest, o.z);
  const gum = DK.gingiva({ width: 9, height: 3.2, depth: 8.2, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.set(0, o.crest + 1.4, o.z);
  const socket = DK.pdl(s, o.gap, o.crest); socket.traverse(m => { if (m.isMesh) m.material.visible = false; }); socket.position.z = o.z; fig.world.add(socket);
  const holder = new THREE.Group(); holder.position.z = o.z; holder.add(tooth.group);
  const pivot = DK.centreOfResistance(s, o.crest, 0.4), amp = o.disp / 2 / (s.crownL - pivot);   // disp = the whole swing at the edge, labial to lingual
  // the outline of the crown at the other end of its swing (labial), drawn on the cut face
  const ghostMat = new THREE.MeshBasicMaterial({ color: o.accent ? fig.accent : DK.color(inkHex), toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.position.z = o.z; outer.add(inner);
  const ring = DK.ribbon(profile, 0.16, [1, 0, 0], { material: ghostMat }); ring.renderOrder = 999; inner.add(ring);
  DK.moveTooth(inner, { tip: amp, pivotY: pivot }); outer.visible = false; fig.world.add(outer);
  const lossPct = Math.round(100 * (-o.crest - 2) / s.rootL);   // bone lost: CEJ-to-crest minus the normal ~2 mm, over the root length (§17)
  return Object.assign({}, o, { tooth, s, bone, gum, socket, holder, pivot, amp, outer, ghostMat, lossPct });
});

// ---------- parts ----------
const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 14.6 + s0.crownL + 6, 2 * GZ + 9), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.y = (s0.crownL + 6 - 14.6) / 2 - 1.5; fig.part(frame, { name: 'frame', label: false });
const zx = sec => (sec.enabled ? sec.offset : 0) + 0.12;
sets.forEach(k => {
  fig.part(k.holder, { name: k.name, sub: k.sub, anchor: [0, k.s.crownL + 1.6, 0], labelOffset: [0, -36], accent: !!k.accent, dim: false,
    info: k.name === 'Healthy' ? 'With full bone support a tooth moves only about 0.1 to 0.2 mm in its ligament: normal, not felt as loose.'
      : k.name === 'Grade 1' ? 'Grade 1 mobility: the crown moves up to about 1 mm sideways. Bone loss shortens the part of the root held in bone.'
      : 'Grade 2 mobility: more than about 1 mm sideways. Grade 3 also moves up and down when pressed. Lost bone does not grow back by itself.' });
  fig.part(k.bone, { name: k.name + ' bone', label: false, fit: false, info: 'Jaw bone around the root.' });
  fig.part(k.gum, { name: k.name + ' gum', label: false, fit: false, info: 'Gum. It follows the bone down as support is lost, so more root shows.' });
  fig.part(k.bone, { inPlace: true, name: k.crestName, dim: false,
    sub: k.name === 'Healthy' ? 'crest about 2 mm below the crown' : `about ${k.lossPct}% of the bone lost`,
    anchor: (e, sec) => [zx(sec), -(14.6 + k.crest) + 0.3, 0], labelOffset: [0, 52], when: (e, sec) => sec.enabled,
    info: 'The bone crest. Above it the root is held only by gum: the less root in bone, the further the crown rocks.' });
});

// ---------- params ----------
const rockAll = v => sets.forEach(k => DK.moveTooth(k.tooth.group, { tip: v * k.amp, pivotY: k.pivot }));
fig.param('rock', 0, rockAll);
fig.param('ghost', 0, v => sets.forEach(k => { k.outer.visible = v > 0.01; k.ghostMat.opacity = (k.accent ? 0.95 : 0.75) * v; }));
let rocking = false, phase = 0;
fig.onFrame(dt => {
  sets.forEach(k => { k.outer.position.x = zx(fig.section); });
  if (rocking) { phase += (dt || 0) * 3.2; rockAll(Math.sin(phase)); }
});

// ---------- section: one labio-lingual cut through the three teeth ----------
fig.enableSection([1, 0, 0], [
  { objects: sets.map(k => k.gum), color: DK.COLORS.gingivaCap },
  { objects: sets.map(k => k.bone.userData.layers.cortical), color: DK.COLORS.corticalCap },
  { objects: sets.map(k => k.bone.userData.layers.cancellous), color: 0xffffff, texture: sets[0].bone.userData.layers.cancellous.userData.capTexture },
  { objects: sets.map(k => k.socket), color: DK.COLORS.pdl, kind: 'plain' },
  { objects: sets.map(k => k.tooth.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: sets.flatMap(k => [k.tooth.layers.dentin, k.tooth.layers.root]), color: DK.COLORS.dentinCap },
  { objects: sets.map(k => k.tooth.layers.pulp), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-2.5, 2.5], offset: 0 } });
fig.toggle('Rock', false, v => { rocking = v; if (!v) rockAll(0); });

// ---------- story: three incisors, the cut, the bone levels, they rock, push-in on the loosest, the range of each ----------
const SIDE = { theta: Math.PI / 2 - 0.06, phi: 1.48 };
const heads = SETS.map(o => o.name), crests = SETS.map(o => o.crestName);
const rock = (v, extra) => Object.assign({ dur: 0.75, hold: 0, ease: 'linear', set: { rock: v }, drift: 0 }, extra || {});
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: Math.PI / 2 - 0.7, phi: 1.22, zoom: 1.05, section: false, set: { rock: 0, ghost: 0 }, labels: heads, caption: 'The same lower front tooth, three times.' },
  Object.assign({ fov: 26, dur: 2.2, hold: 0.1, zoom: 1, labels: [] }, SIDE),
  { dur: 0, hold: 0, section: true, offset: 4 },
  { dur: 2.2, hold: 1.8, offset: 0, labels: crests, caption: 'Less and less bone around the root.' },
  rock(1, { labels: heads, caption: 'Pushed from side to side, each tooth rocks.' }), rock(-1, { dur: 1.1 }), rock(1, { dur: 1.1 }), rock(-1, { dur: 1.1 }), rock(0, { hold: 0.6 }),
  { dur: 2.0, hold: 0.2, zoom: 0.55, focus: [0, 2.5, -GZ], labels: ['Grade 2', 'Severe bone loss'], caption: 'With most of the bone gone it moves furthest.' },
  rock(1, { dur: 1.0 }), rock(-1, { dur: 1.4 }), rock(1, { dur: 1.4 }), rock(-1, { dur: 1.4, hold: 0.8 }),
  Object.assign({ dur: 2.4, hold: 2.8, zoom: 0.9, focus: [0, -1.2, 0], set: { ghost: 1, rock: -1 }, labels: heads }, SIDE)
]);
fig.start();
