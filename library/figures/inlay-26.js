// Procedure: a lithium-disilicate MO inlay on the maxillary left first molar (FDI 26 = Universal 14), crown up (model convention).
// poster: step 5
// The cavity is cut inside the cusps (DK.cavityPrep drawn as a hole, the bur on its growing edge), a bucco-lingual cut through the
// isthmus shows the walls opening outward, then the lab-made inlay (the same solid, in ceramic) comes down and seats.
// Frame: +x = mesial, +z = buccal, CEJ at y = 0. Camera on +x looks at the cut face (buccal on the viewer's left). mm.
const FDI = 26;
const CUT = 0.9;   // bucco-lingual cut through the isthmus, mesial of the central fossa

const fig = DK.figure({
  fov: 30,
  title: 'How an inlay fits',
  subtitle: 'FDI 26 (Universal 14), upper left first molar, crown up. Lithium disilicate.',
  view: { theta: 0.45, phi: 0.95 }
});

const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const TOP = s.crownL + (s.relief ? s.relief(0, 0) : 0);   // central fossa height
// ceramic inlay rules (dental-facts.md §18): floor ≥ 1.5 mm below the fossa (here 1.8), isthmus ≥ 2.5 mm, walls opening outward,
// box floor about 1 mm above the CEJ, no bevels. The occlusal part stays mesial of the oblique ridge.
const PREP = { class: 2, side: 'mesial', isthmus: 2.5, length: 5.0, center: [0.8, 0], floorY: TOP - 1.8, taper: 0.22, box: { gingivalY: 1.2, width: 3.6, axial: 0.45 } };
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const D = prep.dims;
const inlay = DK.filling(tooth, PREP, 'composite'); inlay.name = 'Inlay';
const ceramic = DK.mat('ceramic', { color: 0xe6ddca, clearcoat: 0.5, roughness: 0.25 });
inlay.traverse(m => { if (m.isMesh) m.material = ceramic; });
fig.world.add(inlay);

fig.part(tooth.group, { name: 'Molar 26', anchor: [-2.8, s.crownL - 0.6, s.bl / 2 - 0.6], info: 'Upper left first molar: 4 cusps, 3 roots (mesiobuccal, distobuccal, palatal).' });
fig.part(prep, { inPlace: true, name: 'Cavity', sub: 'inside the cusps', anchor: [D.center[0] - 0.6, D.floorY + 0.15, 0], dim: false, when: () => prep.visible && (prep.userData.kStep || 0) > 0.7, info: `About ${PREP.isthmus} mm wide and 1.8 mm deep, running into a box on the mesial side. Every cusp keeps its full height: that makes it an inlay, not an onlay. The oblique ridge on the distal half is left whole.` });
fig.part(prep, { inPlace: true, name: 'Walls lean outward', sub: 'no undercuts', anchor: () => [CUT + 0.12, D.floorY + 1.0, -(PREP.isthmus / 2) * (1 + PREP.taper * 0.55)], dim: false, when: (e, sec) => sec.enabled && prep.visible, info: 'Each wall opens a few degrees (about 6 to 10 degrees in total) so the rigid inlay slides straight in. Inner corners are rounded; the edges are not bevelled for ceramic.' });
fig.part(L.enamel, { inPlace: true, name: 'Cusps untouched', anchor: () => [CUT + 0.12, s.crownL - 0.9, s.bl / 2 - 1.3], dim: false, when: (e, sec) => sec.enabled, info: 'The cusps keep their own enamel. If a cusp wall were thin (under about 2 mm), it would be covered and the restoration would become an onlay.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [CUT, 2.6, 0.6], dim: false, when: (e, sec) => sec.enabled, info: 'The floor stays in dentin, clear of the pulp horns.' });
fig.part(inlay, { inPlace: true, name: 'Inlay', sub: 'one piece of ceramic', accent: true, anchor: () => [D.center[0] - 0.8, TOP + 0.25 + inlay.position.y, 0], dim: false, when: () => inlay.visible, info: 'Made in a lab or milled from a scan, then bonded in with resin cement. It fills the cavity like a filling, but it is made outside the mouth.' });

// --- the bur, kept on the cavity's growing edge
const bur = DK.bur({ shape: 'taper', diameter: 1.2, head: 6 }); fig.world.add(DK.inFront(bur));
fig.part(bur, { inPlace: true, name: 'Diamond bur', anchor: [0, 8, 0], info: 'A tapered diamond: its taper gives the walls their outward slope.' });
const b = { bx: 0, by: 40, bz: 0, on: 0, which: 0 };
const front = new THREE.Vector3(), free = new THREE.Vector3();
const placeBur = () => {
  bur.visible = b.by < 30; free.set(b.bx, b.by, b.bz);
  if (b.on > 0) { front.fromArray(prep.front(b.which > 0.5 ? 'box' : 'step', 0.5)); free.lerp(front, b.on); }
  bur.position.copy(free);
};
const st = { step: 0, box: 0 };
fig.param('step', 0, v => { st.step = v; prep.set(v, st.box); placeBur(); });
fig.param('box', 0, v => { st.box = v; prep.set(st.step, v); placeBur(); });
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; placeBur(); }));
fig.param('inlay', 0, k => { inlay.visible = k > 0.001; inlay.position.y = (1 - k) * 7; prep.visible = k < 0.999; });

fig.enableSection([1, 0, 0], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.dentin, L.root], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [prep], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [inlay], color: fig.dark ? 0x9fb3c4 : 0xc9d4de, kind: 'plain' }   // a pale accent tint: the one thing the figure points at
]);
fig.standardControls({ explode: false, section: { label: 'Cut', range: [-5, 5], offset: CUT } });

// --- procedure
const SIDE = Math.PI / 2, park = { by: 40, on: 0 };
fig.procedure([
  { label: 'Molar', caption: 'An upper first molar that needs more than a small filling.', beats: [
    { dur: 0, hold: 1.2, theta: 0.45, phi: 0.95, zoom: 1, section: false, set: { step: 0, box: 0 }, labels: ['Molar 26'] },
    { dur: 2.0, hold: 1.0, theta: 0.3, phi: 0.62, zoom: 0.8, focus: [0, s.crownL - 1, 0], labels: ['Molar 26'], key: true }] },
  { label: 'Shaping', caption: 'The dentist shapes a cavity inside the cusps.', beats: [
    { dur: 1.0, hold: 0.1, set: { bx: -1.5, by: s.crownL + 1, bz: 0 }, labels: ['Diamond bur'] },
    { dur: 0.6, hold: 0, set: { on: 1, which: 0 } },
    { dur: 2.2, hold: 0.1, set: { step: 1 }, labels: ['Diamond bur'] },
    { dur: 0.3, hold: 0, set: { which: 1 } },
    { dur: 1.8, hold: 0.1, set: { box: 1 } },
    { dur: 0.8, hold: 1.8, set: park, labels: ['Cavity'], key: true }] },
  { label: 'Walls lean out', caption: 'Cut open: the walls lean outward so the inlay can slide in.', beats: [
    { fov: 26, dur: 2.0, hold: 0.2, theta: SIDE, phi: 1.38, zoom: 0.9, focus: [CUT, 4, 0], labels: [] },
    { dur: 0, hold: 0, section: true, offset: CUT + 8 },
    { dur: 2.0, hold: 0.3, offset: CUT, labels: ['Pulp'] },
    { dur: 1.6, hold: 2.0, zoom: 0.62, focus: [CUT, D.floorY + 0.4, 0], labels: ['Walls lean outward', 'Cusps untouched'], key: true }] },
  { label: 'Inlay made', caption: 'The lab makes a ceramic inlay that matches the cavity.', beats: [
    { fov: 30, dur: 1.8, hold: 0.2, section: false, theta: 0.5, phi: 0.85, zoom: 0.85, focus: [0, s.crownL + 1.5, 0], labels: [] },
    { dur: 1.6, hold: 1.8, set: { inlay: 0.4 }, labels: ['Inlay', 'Cavity'], key: true }] },
  { label: 'Bonded', caption: 'Bonded in: a filling made in one piece, the cusps left whole.', beats: [
    { dur: 1.8, hold: 1.0, set: { inlay: 1 }, labels: ['Inlay'] },
    { fov: 26, dur: 2.0, hold: 0.2, theta: SIDE - 0.3, phi: 1.3, zoom: 0.85, focus: [CUT, 4, 0], labels: [] },
    { dur: 0, hold: 0, section: true, offset: CUT + 8 },
    { dur: 2.0, hold: 2.6, offset: CUT, zoom: 0.72, focus: [CUT, 4.4, 0], labels: ['Inlay', 'Cusps untouched', 'Pulp'], key: true }] }
]);
fig.start();
