// Story: why a root-filled mandibular left first molar (FDI 36 = Universal 19) gets a crown. A large MOD filling over the access
// poster: end
// leaves thin cusp walls; in a bucco-lingual cut through the mesial root, a bite wedges them and a lingual cusp cracks; then the
// tooth is prepared, built up with a core and covered by a crown that holds the cusps together.
// Frame: +x = mesial, +z = buccal, CEJ at y = 0. Camera on +x looks at the cut face (mesial half removed). Sizes in mm.
const FDI = 36;
const CAV = { isthmus: 4.2, depth: 2.8, boxes: ['mesial', 'distal'], boxFloor: 1.0 };   // wide MOD: marginal ridges lost
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };                                // monolithic zirconia, typical (§14)
const FERRULE = 2.0;                                                                     // own dentin collar, 1.5 to 2 mm (§12)
const SHAPE = { size: 25, taper: 0.06 };
const fig = DK.figure({
  fov: 30,
  title: 'Why a root canal tooth needs a crown',
  subtitle: 'FDI 36 (Universal 19), lower left first molar. Cut through the mesial root.',
  view: { theta: 0.7, phi: 1.12 }
});
const dark = fig.dark, INK = dark ? 0xd9d4ca : 0x3a3a36;

// --- context
const roots = DK.tooth(FDI, { omit: ['enamel', 'dentin'] }), s = roots.spec;
const bone = DK.bone({ width: 20, height: 14.6, depth: 13, crest: 1.6 }); bone.position.y = -1.8;
const gum = DK.gingiva({ width: 20, height: 3.2, depth: 13.6, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the two roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the neck of the tooth.' });
fig.part(roots.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar after root canal treatment: the pulp is gone, the roots stay.' });
roots.layers.pulp.visible = false;   // pulp removed by the treatment

// --- after the root canal, before the crown: MOD cavity over the access, filled with composite; root fillings in all 3 canals
const prep = DK.inlayPrep(s, CAV); roots.group.add(prep);
const fill = DK.inlay(s, CAV, 'composite'); roots.group.add(fill);
const access = DK.accessCavity(s, { material: 'composite', lift: 0, grow: 1.25 }); roots.group.add(access);
const chamber = roots.layers.pulp.userData.chamber;
const chamberFill = new THREE.Mesh(chamber.geometry, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberFill.position.copy(chamber.position); roots.group.add(chamberFill);
// a touch deeper than the kit's composite ivory so the filling outline reads against enamel in 3D (cut faces keep compositeCap)
const FILL_MAT = DK.mat('composite', { color: 0xd9cbab, cap: DK.COLORS.compositeCap }); [fill, access].forEach(o => { o.material = FILL_MAT; });
const fillings = ['MB', 'ML', 'D'].map(n => { const f = DK.rootFilling(s, n, SHAPE); roots.group.add(f); return f; });

// --- with the crown: own dentin collar (ferrule), composite core, zirconia crown
const ferrule = DK.prep(s, Object.assign({ maxY: FERRULE }, PREP));
const core = DK.prep(s, Object.assign({ material: 'composite', minY: FERRULE }, PREP));
[ferrule, core].forEach(o => roots.group.add(o));
const crown = DK.restorationCrown(s, 'zirconia', PREP); fig.world.add(crown);

// --- where the cut runs and what sits on it
const CUT = DK.canalAt(s, 'MB', -3).x, MK = CUT + 0.12;   // markers lifted just in front of the cut face
roots.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster();
const floorAt = z => { rc.set(new THREE.Vector3(CUT, 20, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects([prep.enamel, prep.dentin], false); return h.length ? h[0].point.y : s.crownL - CAV.depth; };
const FLOOR = floorAt(0), WALL = CAV.isthmus / 2;
const lingual = y => DK.crownSurface(s, -1).at(CUT, y).p[2];
const buccal = y => DK.crownSurface(s, 1).at(CUT, y).p[2];
// the crack: from the lingual internal line angle of the cavity, obliquely through the lingual cusp, out below the gum line
const innerLingual = y => { rc.set(new THREE.Vector3(CUT, y, -20), new THREE.Vector3(0, 0, 1)); const h = rc.intersectObjects([fill, access, chamberFill], false); return h.length ? h[0].point.z : -WALL; };
const CY0 = Math.min(FLOOR, s.crownL - 3.2);
const C0 = [innerLingual(CY0) + 0.05, CY0], C1 = [lingual(-0.6) + 0.15, -0.6], crackPts = [];
for (let i = 0; i <= 14; i++) { const t = i / 14, j = (i % 2 ? 1 : -1) * 0.12 * Math.sin(Math.PI * t); crackPts.push([MK, C0[1] + (C1[1] - C0[1]) * t + j, C0[0] + (C1[0] - C0[0]) * t + j * 0.6]); }
const crack = DK.ribbon(crackPts, 0.16, [1, 0, 0], { color: 0x3b2f2a, name: 'Crack' });
crack.renderOrder = 20; roots.group.add(crack);
const CRACK_MID = crackPts[7];
const TOP = s.crownL + 0.6, mkArrow = (from, to, w) => { const a = DK.arrow({ from, to, width: w || 0.45, head: 1.1, normal: [1, 0, 0], color: INK }); a.renderOrder = 21; roots.group.add(a); return a; };
const bite = mkArrow([MK, TOP + 5, 0], [MK, TOP, 0], 0.55);
const wedgeY = s.crownL - 1.6;
const wedge = [mkArrow([MK, wedgeY, buccal(wedgeY) + 0.3], [MK, wedgeY, buccal(wedgeY) + 2.3], 0.35), mkArrow([MK, wedgeY, lingual(wedgeY) - 0.3], [MK, wedgeY, lingual(wedgeY) - 2.3], 0.35)];

// --- labels
const midMB = DK.canalAt(s, 'MB', -6);
fig.part(fill, { inPlace: true, name: 'Filling', sub: 'fills the access and lost walls', anchor: [CUT - 0.4, s.crownL - 0.3, 0.4], dim: false, when: () => fill.visible, info: 'A large composite filling replaces the roof of the pulp chamber and both marginal ridges. It seals, but it does not hold the cusps together.' });
fig.part(prep.enamel, { inPlace: true, name: 'Thin walls', sub: 'cusps left standing', anchor: () => [MK, s.crownL - 2.2, buccal(s.crownL - 2.2) - 0.9], dim: false, when: (e, sec) => sec.enabled && prep.enamel.visible, info: 'Access and the lost marginal ridges leave the cusps as thin walls, so biting levers them apart.' });
fig.part(fillings[0], { inPlace: true, name: 'Root fillings', sub: 'all 3 canals', anchor: [midMB.x, -6, midMB.z], dim: false, when: (e, sec) => sec.enabled, info: 'Gutta-percha seals the cleaned canals (MB and ML in this cut, D behind). The roots stay; only the pulp was removed.' });
fig.part(bite, { inPlace: true, name: 'Biting force', anchor: () => [MK, TOP + 3.5, 0], dim: false, when: () => bite.visible, info: 'Chewing loads a lower molar with tens to hundreds of newtons, many times a day.' });
fig.part(crack, { inPlace: true, name: 'Crack', sub: 'cusp splits off', anchor: () => CRACK_MID, dim: false, when: () => crack.visible && crackState.k > 0.6, info: 'A crack that runs below the gum can make the tooth impossible to save. Covering the cusps prevents it.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'covers and holds the cusps', anchor: () => [MK, s.crownL - 0.4 + crown.position.y, buccal(s.crownL - 1.2) - 0.5], dim: false, accent: true, when: () => crown.visible, info: 'A full crown wraps every cusp, so a bite pushes them together instead of apart. Uncrowned root-filled back teeth are lost more often (about six times in one large study; not in every analysis).' });
fig.part(core, { inPlace: true, name: 'Core', sub: 'composite build-up', anchor: () => [MK, FERRULE + 1.8, -0.6], dim: false, when: (e, sec) => sec.enabled && core.visible, info: 'Rebuilds the missing inside of the tooth into a shape the crown can sit on. A molar usually needs no post.' });
fig.part(ferrule, { inPlace: true, name: 'Own tooth', sub: `${FERRULE} mm collar under the crown`, anchor: () => [MK, 1.0, lingual(1.0) + 0.8], dim: false, when: (e, sec) => sec.enabled && ferrule.visible, info: 'A 1.5 to 2 mm collar of sound dentin that the crown hugs (the ferrule). It resists splitting more than any post.' });

// --- params
const crackState = { k: 0 };
fig.param('crowned', 0, v => { const on = v > 0.5; [prep, fill, access].forEach(o => { o.visible = !on; }); [ferrule, core].forEach(o => { o.visible = on; }); });
fig.param('crownY', 14, y => { crown.position.y = y; crown.visible = y < 13.5; });
fig.param('force', 0, v => { bite.visible = v > 0.05; bite.material.opacity = v; });
fig.param('wedge', 0, v => wedge.forEach(a => { a.visible = v > 0.05; a.material.opacity = v; }));
const NI = (crackPts.length - 1) * 6;
fig.param('crack', 0, k => { crackState.k = k; crack.visible = k > 0.02; crack.geometry.setDrawRange(0, Math.round(k * (crackPts.length - 1)) * 6 || 0); });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: DK.COLORS.zirconiaCap },
  { objects: [prep.enamel], color: DK.COLORS.enamelCap },
  { objects: [prep.dentin, roots.layers.root, ferrule], color: DK.COLORS.dentinCap },
  { objects: [fill, access, chamberFill, core], color: DK.COLORS.compositeCap, kind: 'plain' },
  { objects: fillings, color: DK.COLORS.gutta }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
const SIDE = { fov: 26, section: true, offset: CUT, theta: Math.PI / 2 - 0.3, phi: 1.34, zoom: 1, focus: 'auto' };
fig.view('Filling only', Object.assign({ set: { crowned: 0, crownY: 14, force: 1, wedge: 1, crack: 1 } }, SIDE));
fig.view('With crown', Object.assign({ set: { crack: 0, wedge: 0, crowned: 1, crownY: 0, force: 1 } }, SIDE));

// story: the filled molar → turn to the mesial and sweep the cut in → a bite wedges the thin walls → a cusp cracks below the
// gum → back in time: prepared, built up, crowned → the same bite on the crown (teaching shot)
fig.story([
  { dur: 0, hold: 1.4, theta: 0.7, phi: 1.12, zoom: 1.05, section: false, labels: ['Filling'] },
  { fov: 26, dur: 2.2, hold: 0.2, theta: Math.PI / 2 - 0.3, phi: 1.34, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: CUT + 8 },
  { dur: 2.2, hold: 2.2, offset: CUT, labels: ['Filling', 'Thin walls', 'Root fillings'] },
  { dur: 1.6, hold: 1.8, set: { force: 1, wedge: 1 }, labels: ['Biting force', 'Thin walls'] },
  { dur: 1.8, hold: 2.4, zoom: 0.78, focus: [CUT, 3, -1.5], set: { crack: 1 }, labels: ['Crack'] },
  { dur: 1.4, hold: 0.2, zoom: 1, focus: 'auto', set: { force: 0, wedge: 0, crack: 0 }, labels: [] },
  { dur: 1.0, hold: 1.4, set: { crowned: 1 }, labels: ['Core', 'Own tooth'] },
  { dur: 1.8, hold: 0.6, set: { crownY: 0 }, labels: ['Crown'] },
  { dur: 1.8, hold: 2.8, theta: Math.PI / 2 - 0.42, phi: 1.3, zoom: 1.08, set: { force: 1 }, labels: ['Crown', 'Core', 'Own tooth', 'Root fillings', 'Biting force'] }   // teaching shot
]);
fig.start();
