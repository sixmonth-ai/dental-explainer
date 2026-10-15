// Angle's classes: the right buccal segment (upper 13–17 over lower 43–47) seen from the patient's right; jaw frame: +x = patient's left, +z anterior, y up.
// poster: step 2
// The upper teeth sit as in DK.mandible's occlusion (DK.arch 'jaw' placement in a holder, 2.5 mm overbite plane, slight tilt); the lower segment
// slides along z. Class I is set exactly from the geometry (the mesiobuccal cusp of 16 over the mesiobuccal groove of 46); Class II slides the
// lower teeth back until that cusp stands over the 45/46 contact (a full-cusp Class II); Class III slides them forward by the same amount.
// Incisors are left out: a population arch can't show the crossbite or crowding that comes with these bites (kit limit). Crowns only, in mm.
const fig = DK.figure({
  fov: 30,
  title: "Angle's bite classes",
  subtitle: "Patient's right side. First molars 16 over 46 (Universal 3 over 30).",
  view: { theta: -Math.PI / 2, phi: 1.52, margin: 0.8 }
});
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const scene = new THREE.Group();

// --- lower segment (crowns up) in a holder that slides along z
const lowHold = new THREE.Group(); scene.add(lowHold);
const low = DK.arch({ jaw: 'mandible', teeth: [43, 44, 45, 46, 47], build: crowns }); lowHold.add(low.group);
// --- upper segment, in occlusion like DK.mandible's upper teeth
const upHold = new THREE.Group(); scene.add(upHold);
const up = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [13, 14, 15, 16, 17], build: crowns }); upHold.add(up.group);
upHold.position.set(0, DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, 2.6); upHold.rotation.x = -0.05;
scene.updateMatrixWorld(true);
const ridgeL = DK.gingivaArch(low), ridgeU = DK.gingivaArch(up);   // world = scene frame here (scene at the origin)
lowHold.add(ridgeL); upHold.attach(ridgeU);
fig.part(scene, { name: 'Right side', label: false, info: 'Right canine, premolars and first two molars, upper and lower.' });
fig.part(ridgeL, { inPlace: true, name: 'Gum', label: false, info: 'Gum along the lower teeth (schematic).' });
fig.part(ridgeU, { inPlace: true, name: 'Gum', label: false, info: 'Gum along the upper teeth (schematic).' });
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
[...up.teeth, ...low.teeth].forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// --- the two landmarks, from the presets: the MB cusp of 16 (relief cusp x 0.42 of the half width) and the MB groove of 46 (side groove x 0.22)
const t16 = T(up, 16), t46 = T(low, 46), t45 = T(low, 45), s16 = t16.spec, s46 = t46.spec;
const cs16 = DK.crownSurface(s16, 1), cs46 = DK.crownSurface(s46, 1);
const xCusp = 0.42 * s16.md / 2, xGroove = 0.22 * s46.md / 2;
const toScene = (tooth, p) => scene.worldToLocal(tooth.group.localToWorld(new THREE.Vector3(...p)));
const cusp = toScene(t16.tooth, cs16.at(xCusp, cs16.yTop).p), groove = toScene(t46.tooth, cs46.at(xGroove, s46.crownL * 0.5).p);
const contact = toScene(t46.tooth, [s46.md / 2, s46.crownL * 0.6, 0]);   // 45/46 contact
const S1 = cusp.z - groove.z;                      // lower shift for Class I
const UNIT = cusp.z - contact.z - S1;               // to the 45/46 embrasure (negative: back)
const S2 = S1 + UNIT, S3 = S1 - UNIT;
fig.param('shift', S1, v => { lowHold.position.z = v; });

// --- markers: a vertical accent line down from the cusp tip (static, with the upper teeth); an ink line in the groove of 46 (moves with it)
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xc8c2b6 : 0x4f4b44), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const nCusp = cs16.at(xCusp, cs16.yTop - 1).n, out16 = [cusp.x - 0.5, cusp.y, cusp.z];   // just buccal of the cusp
const cuspLine = DK.ribbon([[out16[0], cusp.y + 2.4, cusp.z], [out16[0], cusp.y - 3.6, cusp.z]], 0.42, [1, 0, 0], { material: accentMat });
scene.add(cuspLine);
const gpts = []; for (let i = 0; i <= 10; i++) { const q = cs46.at(xGroove, 0.8 + (s46.crownL - 1.6) * i / 10); gpts.push(q.p.map((v, k) => v + q.n[k] * 0.12)); }
const grooveLine = DK.ribbon(gpts, 0.4, cs46.at(xGroove, s46.crownL * 0.5).n, { material: inkMat }); t46.tooth.group.add(grooveLine);
fig.part(cuspLine, { inPlace: true, name: 'Upper molar cusp', sub: 'mesiobuccal cusp of 16', accent: true, anchor: [out16[0], cusp.y + 2.0, cusp.z], labelOffset: [-60, -70], dim: false,
  info: 'The front cheek-side cusp of the upper first molar. Angle named the bite by where this cusp lands on the lower first molar.' });
fig.part(grooveLine, { inPlace: true, name: 'Lower molar groove', sub: 'buccal groove of 46', anchor: gpts[2], labelOffset: [70, 70], dim: false,
  info: 'The groove between the two front cheek-side cusps of the lower first molar. In a Class I bite the upper cusp sits right over it.' });
fig.part(lowHold, { inPlace: true, name: 'Lower teeth', sub: 'set back', anchor: [contact.x, contact.y - 4, contact.z - 14], labelOffset: [-40, 50], dim: false,
  when: () => lowHold.position.z < S1 - 1, info: 'Class II: the lower teeth (usually the lower jaw) sit too far back, so the upper front teeth stick out. Often treated with elastics, a functional appliance or braces.' });
fig.part(lowHold, { inPlace: true, name: 'Lower teeth ', sub: 'set forward', anchor: [contact.x, contact.y - 4, contact.z - 14], labelOffset: [-40, 50], dim: false,
  when: () => lowHold.position.z > S1 + 1, info: 'Class III: the lower teeth (usually the lower jaw) sit too far forward; the lower front teeth may close in front of the upper ones.' });

fig.view('Molars', { theta: -Math.PI / 2, phi: 1.5, zoom: 0.55, focus: [cusp.x, cusp.y - 0.5, cusp.z] });
fig.view('Whole side', { theta: -Math.PI / 2, phi: 1.52, zoom: 1, focus: 'auto' });

const F = [cusp.x, cusp.y - 0.8, cusp.z + 1];
fig.procedure([
  { label: 'Class I: cusp in the groove', caption: 'Class I: the upper molar cusp sits in the groove of the lower molar.', beats: [
    { dur: 0, hold: 1.0, theta: -1.15, phi: 1.4, zoom: 1, set: { shift: S1 }, labels: [] },
    { dur: 2.2, hold: 2.4, theta: -Math.PI / 2, phi: 1.52, zoom: 0.52, focus: F, labels: ['Upper molar cusp', 'Lower molar groove'], key: true }] },
  { label: 'Class II: lower teeth back', caption: 'Class II: the lower teeth sit back; the cusp lands in front of the groove.', beats: [
    { dur: 2.4, hold: 0.3, set: { shift: S2 }, labels: ['Upper molar cusp'] },
    { dur: 1.0, hold: 2.4, labels: ['Upper molar cusp', 'Lower molar groove', 'Lower teeth'], key: true }] },
  { label: 'Class III: lower teeth forward', caption: 'Class III: the lower teeth sit forward; the cusp lands behind the groove.', beats: [
    { dur: 3.2, hold: 0.3, set: { shift: S3 }, labels: ['Upper molar cusp'] },
    { dur: 1.0, hold: 2.4, labels: ['Upper molar cusp', 'Lower molar groove', 'Lower teeth '], key: true }] }
]);
fig.start();
