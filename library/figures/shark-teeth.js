// Library: "shark teeth" in a 6 to 7 year old: the permanent lower central incisors (FDI 31, 41) erupting lingual to the retained primary central incisors (71, 81), then moving forward once the baby teeth fall out. Lower front segment 73 to 83 in the DK.arch frame (midline x = 0, patient's right at -x, +z labial, CEJs at y = 0); sagittal cut through 81 and 41 (removeToward -x, camera on the patient's right).
// poster: end
// Teaching point: a common, usually harmless pattern: the adult incisor comes in behind a baby tooth whose root has not
// dissolved yet; once the baby tooth falls out (or is taken out), the tongue usually moves the adult tooth forward into line.
// The forward movement is schematic; no distances are given (none in dental-facts.md).
const fig = DK.figure({
  fov: 30,
  title: 'Shark teeth in children',
  subtitle: 'Lower front teeth, age 6 to 7. FDI 31, 41 (Universal 24, 25) behind 71, 81.',
  view: { theta: 0.35, phi: 1.1 }
});

const RESORB = { 71: 0.55, 81: 0.55, 72: 0.3, 82: 0.3, 73: 0, 83: 0 };
const arch = DK.arch({ jaw: 'mandible', dentition: 'primary', teeth: [83, 82, 81, 71, 72, 73], toothOpts: f => ({ resorb: RESORB[f] || 0 }) });
fig.part(arch.group, { name: 'Baby teeth', label: false, info: 'The baby lower front teeth.' });
const T = f => arch.teeth.find(t => t.fdi === f);

// --- the adult central incisors, placed in the slots of 81 / 71 but behind them (lingual) and lower, crowns partly through
const LING = 4.6, DOWN = 4.6;                                  // lingual and apical offset of the erupting incisor, mm
const basis = (slot, local) => {
  const X = new THREE.Vector3(slot.t[0], 0, slot.t[1]), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(slot.n[0], 0, slot.n[1]);
  const m = new THREE.Matrix4().makeBasis(X, Y, Z), c = new THREE.Vector3(slot.c[0], 0, slot.c[1]).addScaledVector(X, local[0]).addScaledVector(Y, local[1]).addScaledVector(Z, local[2]);
  m.setPosition(c); return m;
};
const adults = [[41, 81], [31, 71]].map(([f, p]) => {
  const tooth = DK.tooth(DK.toothPreset(f, { develop: 0.55 })), slot = T(p).slot;
  const behind = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }, inLine = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() };
  basis(slot, [0, -DOWN, -LING]).decompose(behind.pos, behind.q, behind.s);
  basis(slot, [0, -2.2, -0.9]).decompose(inLine.pos, inLine.q, inLine.s);   // in line, still settling just behind the laterals
  tooth.group.position.copy(behind.pos); tooth.group.quaternion.copy(behind.q); tooth.group.scale.copy(behind.s);
  arch.group.add(tooth.group);
  return { fdi: f, tooth, behind, inLine, slot };
});
const [a41, a31] = adults;

// --- gum: a tall ridge that covers the roots and the lingual crowns' necks
const gum = DK.gingivaArch(arch, { height: 13, depth: 8, rise: 1.4 });
fig.world.add(gum);
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Gum over the jaw bone.' });

// --- labels
const s81 = T(81).spec, s41 = a41.tooth.spec;
fig.part(T(81).tooth.group, { inPlace: true, name: 'Baby tooth', sub: 'root not yet dissolved', anchor: [0, s81.crownL * 0.6, s81.bl / 2], dim: false, labelOffset: [0, -60],
  info: 'Baby lower right central incisor (FDI 81, Universal P). Its root dissolves as the adult tooth rises; here it has not dissolved enough, so the tooth is still firm.' });
fig.part(T(71).tooth.group, { inPlace: true, name: '71', label: false, info: 'Baby lower left central incisor (FDI 71, Universal O).' });
fig.part(a41.tooth.group, { inPlace: true, name: 'Adult tooth', sub: 'came in behind', accent: true, anchor: [0, s41.crownL * 0.75, -s41.bl / 2], dim: false, labelOffset: [0, -70],
  info: 'Adult lower right central incisor (FDI 41, Universal 25), usually in at about 6 to 7 years. It forms behind and below the baby tooth, so when the baby root lingers it comes up behind it.' });
fig.part(a31.tooth.group, { inPlace: true, name: '31', label: false, info: 'Adult lower left central incisor (FDI 31, Universal 24).' });

// ghost of where 41 came in, and an arrow to where it ends up (shown in the teaching shot)
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const ghost = new THREE.Mesh(DK.crownGeometry(s41), ghostMat); ghost.matrixAutoUpdate = true;
ghost.position.copy(a41.behind.pos); ghost.quaternion.copy(a41.behind.q); ghost.scale.copy(a41.behind.s); arch.group.add(ghost);
const arrowMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, toneMapped: false, depthTest: false });
const arrow = new THREE.Group();
{ const p0 = new THREE.Vector3(0, -DOWN + s41.crownL + 2.0, -LING), p1 = new THREE.Vector3(0, -2.2 + s41.crownL + 2.4, -0.9 - 0.2), dir = p1.clone().sub(p0), L = dir.length();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, L - 1.0, 12), arrowMat), head = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 16), arrowMat);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  shaft.quaternion.copy(q); head.quaternion.copy(q);
  shaft.position.copy(p0).addScaledVector(dir, (L - 1.0) / 2 / L); head.position.copy(p0).addScaledVector(dir, (L - 0.6) / L);
  arrow.add(shaft, head); arrow.renderOrder = 3; }
const am = basis(a41.slot, [0, 0, 0]); am.decompose(arrow.position, arrow.quaternion, arrow.scale); arch.group.add(arrow);
fig.part(arrow, { inPlace: true, name: 'Tongue pushes it forward', sub: 'over weeks to months', anchor: [0, -DOWN + s41.crownL + 2.0, -LING], dim: false, labelOffset: [-40, -50], when: () => arrowMat.opacity > 0.3,
  info: 'With the baby tooth gone, the tongue usually guides the adult incisor forward into line. If the baby tooth stays firm for weeks after the adult one shows, a dentist may take it out.' });

// --- params
const lerpPose = (a, k) => { a.tooth.group.position.lerpVectors(a.behind.pos, a.inLine.pos, k); a.tooth.group.quaternion.slerpQuaternions(a.behind.q, a.inLine.q, k); };
fig.param('forward', 0, k => adults.forEach(a => lerpPose(a, k)));
const babyMats = [];
[T(81), T(71)].forEach(t => t.tooth.group.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.transparent = true; babyMats.push(m); } }));
const home = { 81: T(81).tooth.group.position.y, 71: T(71).tooth.group.position.y };
fig.param('lost', 0, k => { [81, 71].forEach(f => { const g = T(f).tooth.group; g.position.y = home[f] + 9 * k; g.visible = k < 0.98; }); babyMats.forEach(m => { m.material.opacity = 1 - k; m.material.depthWrite = k < 0.5; }); });
fig.param('ghost', 0, k => { ghostMat.opacity = 0.22 * k; arrowMat.opacity = k; ghost.visible = arrow.visible = k > 0.01; });

const teethAll = [...arch.teeth.map(t => t.tooth), ...adults.map(a => a.tooth)];
fig.enableSection([-1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: teethAll.map(t => t.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: teethAll.flatMap(t => [t.layers.root, t.layers.dentin]), color: DK.COLORS.dentinCap },
  { objects: teethAll.map(t => t.layers.pulp), color: DK.COLORS.pulpCap }
]);
ghostMat.clippingPlanes = [fig.section.plane];
const CUT = -T(81).slot.c[0];                                  // the plane through 81 / 41 (position along -x)
fig.xray([gum], false);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-6, 8], offset: CUT } });

// story: front three-quarter, two rows → from above and behind: the second row → the cut sweeps in through 81 and 41: baby root
// still long, adult tooth behind → the baby tooth comes out → the adult tooth moves forward → teaching shot: the path, behind to in line
const SIDE = { theta: -Math.PI / 2 + 0.12, phi: 1.5 };
const F = [T(81).slot.c[0], 0.5, -1.5];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.35, phi: 1.1, zoom: 1.0, section: false, labels: ['Baby tooth'], caption: 'A child’s lower front teeth.' },
  { dur: 2.4, hold: 2.0, theta: 2.6, phi: 0.75, zoom: 0.9, labels: ['Adult tooth', 'Baby tooth'], caption: 'From behind: the adult incisors have come in behind the baby ones. Two rows, like a shark.' },
  { dur: 0, hold: 0, section: true, offset: 20 },
  { fov: 26, dur: 2.6, hold: 0.4, ...SIDE, zoom: 0.9, focus: F, offset: CUT, labels: [] },
  { dur: 1.6, hold: 2.2, zoom: 0.75, labels: ['Baby tooth', 'Adult tooth'], caption: 'The baby root has not dissolved, so the baby tooth is still in.' },
  { dur: 1.8, hold: 1.0, set: { lost: 1 }, labels: ['Adult tooth'], caption: 'Once the baby tooth comes out…' },
  { dur: 2.4, hold: 0.4, set: { forward: 1 }, labels: ['Adult tooth'], caption: '…the tongue usually moves the adult tooth forward.' },
  { dur: 1.8, hold: 2.8, zoom: 0.78, drift: 0, set: { ghost: 1 }, labels: ['Adult tooth', 'Tongue pushes it forward'], caption: '' }
]);
fig.start();
