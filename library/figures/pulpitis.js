// Pulpitis: deep decay in the mandibular left first molar (FDI 36 = Universal 19) inflames the pulp, which is boxed in by dentin; story in a mesio-distal cut (frame: +x mesial, +z buccal, CEJ at y = 0).
// poster: end
// Deep occlusal lesion (DK.cariesLesion, ICDAS 6 / deep dentin), pulp reddening and throbbing on the cut face, pressure arrows against the chamber walls, the narrow apical foramen. Sizes in mm.
const FDI = 36;
const fig = DK.figure({
  fov: 26,
  title: 'Why a toothache throbs',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut front to back.',
  view: { theta: 0.45, phi: 1.3 }
});

// --- tooth in its socket
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 20, height: 18, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 20, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots, a large pulp chamber under the cusps.' });

// --- deep decay at the central pit, close to the pulp
const STAGE = 4.75;
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0.22, 0], stage: STAGE });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);

// --- the pulp chamber: arrows that push out against its walls, read off the chamber's own bounds
const chamber = L.pulp.userData.chamber; chamber.geometry.computeBoundingBox();
const bb = chamber.geometry.boundingBox.clone().translate(chamber.position);
const CX = (bb.min.x + bb.max.x) / 2, CY = (bb.min.y + bb.max.y) / 2 + 0.2;
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(0x3a3733), toneMapped: false, transparent: true, opacity: 0, depthTest: false });
function arrow(from, to) {   // a flat arrow in the cut plane (z just in front of the cut face)
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy), w = 0.16, hw = 0.42, hl = 0.55;
  const sh = new THREE.Shape([[0, -w / 2], [len - hl, -w / 2], [len - hl, -hw], [len, 0], [len - hl, hw], [len - hl, w / 2], [0, w / 2]].map(p => new THREE.Vector2(p[0], p[1])));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), inkMat); m.position.set(from[0], from[1], 0.12); m.rotation.z = Math.atan2(dy, dx); m.renderOrder = 3; return m;
}
const arrows = new THREE.Group();
[[[CX - 0.6, CY], [bb.min.x + 0.35, CY]], [[CX + 0.6, CY], [bb.max.x - 0.35, CY]], [[CX - 1.4, CY + 0.3], [CX - 1.6, bb.max.y - 0.5]], [[CX + 1.4, CY + 0.3], [CX + 1.6, bb.max.y - 0.5]]].forEach(([a, b]) => arrows.add(arrow(a, b)));
tooth.group.add(arrows);

// --- the narrow way in and out: the apical foramen of the distal root (on the cut, z = 0)
const distal = s.roots[1], APEX = [distal.x + distal.apex[0], -distal.len + 0.25, 0.1];
const apexMark = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshBasicMaterial({ visible: false })); apexMark.position.set(...APEX); tooth.group.add(apexMark);

// --- labels
const cutOn = (e, sec) => sec.enabled;
fig.part(M.cavity, { inPlace: true, name: 'Deep decay', anchor: () => at(0.3, 0, 0), dim: false, info: 'A cavity into the inner dentin. Bacteria and their toxins reach the pulp through the dentin tubules long before the decay breaks into it.' });
fig.part(M.infected, { inPlace: true, name: 'Decay', sub: 'close to the pulp', anchor: () => at(A.enamel + A.dentin * 0.55, SZ * 0.35, 12), dim: false, info: 'Soft, infected dentin reaching toward the pulp horn.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', sub: 'nerves and blood vessels', anchor: [bb.min.x + 0.9, bb.min.y + 0.6, 0.1], labelOffset: [-90, 40], dim: false, when: (e, sec) => sec.enabled && pst.inflamed < 0.5, info: 'Living tissue: nerves and blood vessels inside the tooth.' });
fig.part(L.pulp, { inPlace: true, name: 'Inflamed pulp', sub: 'swells, but cannot expand', anchor: [bb.min.x + 0.9, bb.min.y + 0.6, 0.1], labelOffset: [-90, 40], accent: true, dim: false, when: (e, sec) => sec.enabled && pst.inflamed >= 0.5, info: 'Pulpitis: the inflamed pulp fills with blood and fluid. Boxed in by dentin, the pressure rises with every heartbeat and presses on the nerves: a throbbing ache, often worse lying down. Once it is irreversible, the usual treatments are a root canal or extraction.' });
fig.part(L.dentin, { inPlace: true, name: 'Hard walls', sub: 'dentin', anchor: [bb.max.x + 0.9, CY + 0.2, 0.1], dim: false, when: cutOn, info: 'The pulp is enclosed in dentin, which does not give: unlike a swollen finger, the pulp has no room to swell.' });
fig.part(apexMark, { inPlace: true, name: 'Root-tip opening', sub: 'about 0.3 mm', anchor: [0, 0, 0], dim: false, when: cutOn, info: 'Blood enters and leaves the pulp only through tiny openings at the root tips, so the swelling cannot drain away. (Opening size approximate.)' });

// --- params: inflammation, the pulse, the arrows
const pst = { inflamed: 0, throb: 0 };
const PULP = DK.color(DK.COLORS.pulp), HOT = DK.color(0x93574f), PEAK = DK.color(0xa84a40);
const CAP0 = DK.color(DK.COLORS.pulpCap), CAPHOT = DK.color(0x9c5a52), CAPPEAK = DK.color(0xb04a40);
const tmp = new THREE.Color(), tmpCap = new THREE.Color();
const paint = () => {
  tmp.copy(PULP).lerp(HOT, pst.inflamed).lerp(PEAK, pst.throb * pst.inflamed);
  L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(tmp); });
  tmpCap.copy(CAP0).lerp(CAPHOT, pst.inflamed).lerp(CAPPEAK, pst.throb * pst.inflamed);
  if (fig.section && fig.section.caps[PULP_GROUP]) fig.section.caps[PULP_GROUP].material.uniforms.uColor.value.copy(tmpCap);
};
const PULP_GROUP = 10;
fig.param('inflamed', 0, v => { pst.inflamed = v; paint(); });
fig.param('throb', 0, v => { pst.throb = v; paint(); arrows.scale.setScalar(1); });
fig.param('arrows', 0, v => { inkMat.opacity = 0.85 * v; arrows.visible = v > 0.02; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [M.reactionary], color: DK.COLORS.reactionary, kind: 'dentin' },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }   // last: the decay stops at the pulp wall
]);
paint();
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0 } });
fig.view('Pulp', { theta: 0, phi: 1.45, zoom: 0.6, focus: [CX, CY, 0], section: true, offset: 0, labels: ['Inflamed pulp', 'Hard walls', 'Deep decay'] });

// --- story: the decayed molar, the cut, the pulp inflames, no room to swell, one small way out, the throb
const FOCUS_PULP = [CX, CY + 0.6, 0];
const pulse = (n) => { const a = []; for (let i = 0; i < n; i++) { a.push({ dur: 0.18, hold: 0.05, drift: 0, ease: 'out', set: { throb: 1 } }); a.push({ dur: 0.55, hold: 0.12, drift: 0, set: { throb: 0 } }); } return a; };
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.7, phi: 0.95, zoom: 1.0, section: false, labels: ['Deep decay'], caption: 'A lower molar with a deep cavity.' },
  { fov: 26, dur: 2.2, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.6, offset: 0, labels: ['Decay', 'Pulp'], caption: 'The decay has nearly reached the pulp.' },
  { dur: 2.0, hold: 1.4, zoom: 0.6, focus: FOCUS_PULP, set: { inflamed: 1 }, labels: ['Inflamed pulp', 'Decay'], caption: 'Bacterial toxins inflame the pulp.' },
  { dur: 1.0, hold: 1.8, set: { arrows: 1 }, labels: ['Inflamed pulp', 'Hard walls'], caption: 'It swells, but the dentin walls do not give.' },
  { dur: 2.2, hold: 2.0, zoom: 0.62, focus: [APEX[0] + 1, APEX[1] + 3, 0], labels: ['Root-tip opening'], caption: 'Blood gets in and out only through a tiny opening.' },
  { dur: 2.2, hold: 0.2, zoom: 0.95, theta: 0.12, phi: 1.4, focus: [0, -2.5, 0], labels: ['Inflamed pulp', 'Hard walls', 'Deep decay', 'Root-tip opening'] },
  ...pulse(3),
  { dur: 0.3, hold: 1.0, drift: 0, set: { throb: 0.6 }, labels: ['Inflamed pulp', 'Hard walls', 'Deep decay', 'Root-tip opening'], caption: 'Each heartbeat raises the pressure: the pain throbs.' }
]);
fig.start();
