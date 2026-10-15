// Procedure: a smile of six porcelain veneers on the upper front teeth, canine to canine (FDI 13 to 23 = Universal 6 to 11), in the mouth (crowns down), arch frame: +x = patient's left, +z anterior, y up; seen from the front, so the patient's right is on the viewer's left.
// poster: step 5
// Before: darker teeth with slightly worn edges (each enamel shell starts with its incisal edge partly reduced). A thin labial layer
// of enamel is removed from each tooth (DK.veneerPrep, depths by third from dental-facts.md §18: centrals 0.3/0.5/0.7, laterals
// 0.1/0.3/0.5, canines 0.4/0.6/0.8 mm, butt joint), then six ceramic shells (DK.veneer, same numbers) are bonded on: they bring
// back the full edge length and change the shade of the whole smile. Crowns only: the roots sit under the gum.
const TEETH = [13, 12, 11, 21, 22, 23];
const DEPTH = { 1: [0.3, 0.5, 0.7], 2: [0.1, 0.3, 0.5], 3: [0.4, 0.6, 0.8] };
const WORN = 0.45;                                   // fraction of the edge reduction already lost to wear before treatment
const ZF = window.innerWidth < window.innerHeight ? 1.5 : 1;   // a portrait phone stage is narrow: pull back so the whole smile fits
const HOME = { theta: 0, phi: 1.66 };   // focus and zoom are set per shot below

const fig = DK.figure({
  fov: 32,
  title: 'A full smile of veneers',
  subtitle: 'Six veneers, FDI 13 to 23 (Universal 6 to 11), in the mouth.',
  view: Object.assign({ margin: 0.62 }, HOME)
});

const before = DK.mat('enamel', { color: 0xdccaa3 });          // a darker, yellower starting shade
const ceramic = DK.mat('ceramic', { color: 0xf6f3ec });         // the new shade
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const units = [];
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: TEETH, build: (fdi, spec) => {
  const d = DEPTH[fdi % 10], V = { cervical: d[0], middle: d[1], incisal: d[2], edge: 1.5, type: 'butt' };
  const t = DK.tooth(spec, { omit: ['enamel', 'dentin', 'pulp', 'root'] });
  const prep = DK.veneerPrep(spec, V); prep.material = before; t.group.add(prep);
  const ghost = new THREE.Mesh(DK.crownGeometry(spec), ghostMat); ghost.visible = false; t.group.add(ghost);
  const veneer = DK.veneer(spec, V, 'ceramic'); veneer.material = ceramic; veneer.visible = false; t.group.add(veneer);
  units.push({ fdi, spec, prep, ghost, veneer, V });
  return t;
} });
fig.part(arch.group, { name: 'Upper front teeth', label: false, info: 'The six upper front teeth, canine to canine: the teeth that show in a smile.' });
const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gum', label: false, fit: false, info: 'The gum line stays where it is: the veneer edge sits at or just above it.' });

const U = fdi => units.find(u => u.fdi === fdi);
arch.group.updateMatrixWorld(true);
const FOCUS = (() => { const c = new THREE.Vector3(); arch.teeth.forEach(t => c.add(t.tooth.group.getWorldPosition(new THREE.Vector3()))); c.multiplyScalar(1 / arch.teeth.length); return [c.x, -5.0, c.z - 4]; })();   // middle of the six crowns
const u11 = U(11), u21 = U(21), u12 = U(12);
const mid = s => [0, s.crownL * 0.5, s.bl / 2 - 0.2];           // labial face, middle third (tooth frame: crown at +y, mirrored into the mouth)
fig.part(u11.prep, { inPlace: true, name: 'Darker, worn teeth', anchor: mid(u11.spec), labelOffset: [-120, -60], dim: false, when: () => st.prep < 0.1 && st.ven < 0.1, info: 'Teeth that have darkened and lost a little length at the edges. Whitening cannot change shape; veneers change both.' });
fig.part(u11.ghost, { inPlace: true, name: 'Thin layer removed', sub: 'about 0.3 to 0.7 mm', anchor: [0, u11.spec.crownL * 0.7, u11.spec.bl / 2 - 0.3], labelOffset: [-130, 40], accent: true, dim: false, when: () => st.ghost > 0.4, info: 'Only the front face is reduced, by less than a millimetre and deeper toward the edge, so the preparation stays in enamel, which bonds best. The back of the tooth is untouched.' });
fig.part(u21.veneer, { inPlace: true, name: 'Veneer', sub: 'a thin ceramic shell', anchor: [0, u21.spec.crownL * 0.45, u21.spec.bl / 2 + 0.1], labelOffset: [120, -50], dim: false, when: () => st.ven > 0.05 && st.ven < 0.97, info: 'Each veneer is a ceramic shell about 0.3 to 0.7 mm thick, made in the lab to the new shape and shade, then bonded to the enamel with resin cement. It is not a crown.' });
fig.part(u12.veneer, { inPlace: true, name: 'Six veneers', sub: 'new shape and shade', anchor: mid(u12.spec), labelOffset: [-120, 60], dim: false, when: () => st.ven > 0.97, info: 'Six veneers, canine to canine. When the smile is wide, eight to ten (adding premolars) keep the colour even toward the back. About 95% last 10 years; they can chip or come off and do not last forever.' });

// --- params: prep (labial then edge), ghost of the removed layer, veneers sliding in from the front
const st = { prep: 0, ghost: 0, ven: 0 };
const apply = () => units.forEach(u => u.prep.set(Math.min(1, st.prep * 1.4), Math.max(WORN, DK.util.clamp((st.prep - 0.55) / 0.45, 0, 1))));
fig.param('prep', 0, k => { st.prep = k; apply(); });
fig.param('ghost', 0, k => { st.ghost = k; ghostMat.opacity = 0.16 * k; units.forEach(u => { u.ghost.visible = k > 0.01; }); });
fig.param('ven', 0, k => { st.ven = k; units.forEach((u, i) => { const kk = DK.util.clamp(k * 1.5 - i * 0.1, 0, 1); u.veneer.visible = kk > 0.001; u.veneer.position.z = (1 - kk) * 7; }); });

fig.standardControls({ explode: false });
fig.view('Front', Object.assign({ zoom: 0.8 * ZF, focus: FOCUS, fov: 32 }, HOME));
fig.view('Side', { theta: 0.95, phi: 1.62, zoom: 0.8 * ZF, focus: FOCUS, fov: 30 });

fig.procedure([
  { label: 'Before', caption: 'Darker teeth with worn edges.', beats: [
    { dur: 0, hold: 1.2, theta: 0.5, phi: 1.6, zoom: 0.95 * ZF, focus: FOCUS, labels: [] },
    { dur: 2.2, hold: 2.0, ...HOME, zoom: 0.78 * ZF, labels: ['Darker, worn teeth'], key: true }] },
  { label: 'Thin preparation', caption: 'A thin layer of enamel is removed from the front of each tooth.', beats: [
    { dur: 1.8, hold: 0.2, theta: 0.45, phi: 1.62, zoom: 0.82 * ZF, labels: [] },
    { dur: 2.6, hold: 0.3, set: { prep: 1, ghost: 1 }, labels: ['Thin layer removed'] },
    { dur: 1.0, hold: 1.8, labels: ['Thin layer removed'], key: true }] },
  { label: 'Ceramic shells', caption: 'Six thin ceramic shells, made to the new shape and shade.', beats: [
    { dur: 1.2, hold: 0.1, set: { ghost: 0 }, labels: [] },
    { dur: 2.2, hold: 0.3, theta: 0.85, phi: 1.7, zoom: 0.9 * ZF, set: { ven: 0.55 }, labels: ['Veneer'] },
    { dur: 0.6, hold: 1.8, labels: ['Veneer'], key: true }] },
  { label: 'Bonded', caption: 'Each one is bonded onto its tooth.', beats: [
    { dur: 2.2, hold: 1.8, theta: 0.5, zoom: 0.82 * ZF, set: { ven: 1 }, labels: [], key: true }] },
  { label: 'New smile', caption: 'Shape and shade of the whole smile change together.', beats: [
    { dur: 2.2, hold: 2.6, ...HOME, zoom: 0.78 * ZF, labels: ['Six veneers'], key: true }] }
]);
fig.start();
