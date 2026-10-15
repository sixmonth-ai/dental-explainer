// Library: the same mandibular left first molar (FDI 36 = Universal 19) young and old, side by side, crown up, cut mesio-distally through the mesiobuccal canal. In the older tooth the young pulp's outline is painted as secondary dentin, with the smaller pulp left inside it. Frame: CEJ at y = 0, +x mesial, +z buccal; the two teeth sit side by side along x, camera on the buccal side.
// poster: end
// Teaching point: odontoblasts keep laying down secondary dentin for life, mostly on the roof and floor of the chamber, so the pulp chamber flattens and the canals narrow: older teeth feel less and their canals are harder to find and negotiate. Schematic proportions; the amount varies widely between people.
const fig = DK.figure({
  fov: 30,
  title: 'The pulp shrinks with age',
  subtitle: 'Lower first molar, FDI 36 (Universal 19), young and older. Schematic.',
  view: { theta: 0.4, phi: 1.34 }
});

const spec = DK.toothPreset(36), GAP = 4.5, X = spec.md / 2 + GAP / 2;
// the distal canal drawn as the wide bucco-lingual ribbon it often is, so one mesio-distal cut shows it beside the mesiobuccal canal
spec.canals = spec.canals.map(c => c.name === 'D' ? Object.assign({}, c, { rbk: 2.1 }) : c);
const young = DK.tooth(spec);
// the older tooth: the same tooth with narrower canals and a flattened chamber
const oldSpec = Object.assign({}, spec);
oldSpec.canals = spec.canals.map(c => Object.assign({}, c, { r: c.r * 0.55, rbk: c.rbk ? c.rbk * 0.75 : c.rbk }));
const old = DK.tooth(oldSpec);
young.group.position.x = -X; old.group.position.x = X;
const LY = young.layers, LO = old.layers;

// flatten the old chamber: the roof comes down most; the horns all but disappear
const ch = LO.pulp.userData.chamber;
ch.geometry = ch.geometry.clone(); ch.geometry.computeBoundingBox();
const bb = ch.geometry.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, yb = bb.min.y;
ch.geometry.translate(-cx, -yb, -cz); ch.geometry.scale(0.95, 0.42, 0.78); ch.geometry.translate(cx, yb + 0.1, cz);
ch.geometry.computeVertexNormals();

// secondary dentin: the young pulp's outline inside the old tooth, painted on the cut only
const SEC = 0xb39c76;
const ghosts = []; young.group.updateMatrixWorld(true);
LY.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) { const g = new THREE.Mesh(m.geometry, DK.mat('dentin', { color: SEC, cap: SEC })); g.userData.cutOnly = true;
  m.updateMatrixWorld(true); const mw = m.matrixWorld.clone(); const inv = new THREE.Matrix4().copy(young.group.matrixWorld).invert(); g.applyMatrix4(inv.multiply(mw)); old.group.add(g); ghosts.push(g); } });
[young, old].forEach(t => t.group.updateMatrixWorld(true));

const CUT = 1.4;   // through the chamber, the mesiobuccal canal and the buccal part of the distal ribbon
const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hitLocal = (t, layer, from, dir, lift = 0) => {
  const o = new THREE.Vector3(...from).add(t.group.position);
  ray.set(o, new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(meshesOf(layer), false)[0];
  return h ? [h.point.x - t.group.position.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
};

fig.part(young.group, { name: 'Young', anchor: (e, sec) => [0, spec.crownL + 1.2, sec.enabled ? CUT - 0.3 : 0], labelOffset: [0, -40], dim: false,
  info: 'A young adult molar: a tall pulp chamber with horns reaching up under the cusps, and wide canals.' });
fig.part(old.group, { name: 'Older', anchor: (e, sec) => [0, spec.crownL + 1.2, sec.enabled ? CUT - 0.3 : 0], labelOffset: [0, -40], dim: false,
  info: 'The same tooth decades later: the chamber is low and flat and the canals are thin, sometimes too thin to see on a radiograph.' });

const hornY = hitLocal(young, LY.pulp, [2.2, 30, CUT], [0, -1, 0], 0.3) || [2.2, 4.5, CUT];
fig.part(LY.pulp, { inPlace: true, name: 'Pulp horns', sub: 'close to the cusps', anchor: [hornY[0], hornY[1], CUT + 0.02], labelOffset: [-110, -30], dim: false,
  when: (e, sec) => sec.enabled, info: 'In a young tooth the pulp horns reach high under the cusps, so deep cavities and preparations come close to them, and the tooth reacts briskly to cold.' });
const chTop = hitLocal(old, ch, [0, 30, CUT], [0, -1, 0]) || [0, 2, CUT];
const secPt = [chTop[0] - 0.4, chTop[1] + 1.0, CUT + 0.02];
const secMark = new THREE.Object3D(); secMark.position.set(...secPt); old.group.add(secMark);
fig.part(secMark, { inPlace: true, name: 'Secondary dentin', sub: 'laid down for life', anchor: [0, 0, 0], labelOffset: [110, -50], accent: true, dim: false,
  when: (e, sec) => sec.enabled, info: 'Odontoblasts lining the pulp keep adding dentin slowly throughout life, most on the roof and floor of the chamber. It fills the space the young pulp once had (darker band).' });
const yC = -6, cOld = DK.canalAt(oldSpec, 'MB', yC);
const canalMark = new THREE.Object3D(); canalMark.position.set(cOld.x, yC, CUT + 0.02); old.group.add(canalMark);
fig.part(canalMark, { inPlace: true, name: 'Narrow canals', anchor: [0, 0, 0], labelOffset: [110, 20], dim: false,
  when: (e, sec) => sec.enabled, info: 'The canals narrow too, and orifices can be hidden under the new dentin: harder to locate and negotiate during a root canal treatment.' });

fig.enableSection([0, 0, 1], [
  { objects: [LY.enamel, LO.enamel], color: DK.COLORS.enamelCap },
  { objects: [LY.root, LY.dentin, LO.root, LO.dentin], color: DK.COLORS.dentinCap },
  { objects: ghosts, color: SEC, kind: 'dentin' },
  { objects: [LY.pulp, LO.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 5], offset: CUT } });

// story: two lower molars turning, identical from outside → straight from the cheek → the cut sweeps in → push in on the young
// chamber (tall, horns high) → slide to the older one (flat chamber, secondary dentin, thin canals) → hero: both, cut
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.4, phi: 1.34, zoom: 1.05, section: false, labels: ['Young', 'Older'], caption: 'The same molar, young and older: alike from outside.' },
  { fov: 28, dur: 2.2, hold: 0.6, theta: 0.02, phi: 1.48, zoom: 1.0, labels: ['Young', 'Older'] },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { fov: 26, dur: 2.4, hold: 1.4, offset: CUT, labels: ['Young', 'Older'], caption: 'Cut open, the pulps differ.' },
  { dur: 2.0, hold: 2.0, zoom: 0.55, focus: [-X, 1.5, 0], labels: ['Pulp horns'], caption: 'Young: a tall chamber, horns under the cusps.' },
  { dur: 2.2, hold: 2.4, focus: [X, 0, 0], zoom: 0.62, labels: ['Secondary dentin', 'Narrow canals'], caption: 'Older: secondary dentin flattens the chamber and narrows the canals.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: 0.1, phi: 1.46, zoom: 1.0, focus: 'auto', drift: 0, labels: ['Young', 'Older', 'Pulp horns', 'Secondary dentin', 'Narrow canals'], caption: '' }
]);
fig.start();
