// Comparison: an immature maxillary right central incisor (FDI 11 = Universal 8, root about two thirds formed, age about 8) beside a mature one, crown up, one mesio-distal cut through both canals. Frame: +x mesial, +z labial, CEJ at y = 0, mm; camera on the labial side, like a periapical radiograph.
// poster: end
// The immature root is the kit's developing root (DK.toothPreset(11, { develop })) with near-parallel outer walls; its canal is a
// hand-built solid that widens toward the end of the root (a blunderbuss canal), so the dentin walls thin to knife edges around a
// wide-open apex. The mature tooth keeps the preset: thick walls,
// the canal narrowing to a small apical foramen. A toggle adds an apexification plug (calcium-silicate cement) in the open apex.
const GAP = 13;                                   // centre-to-centre spacing (about 1.5 x the 8.5 mm crown width)
const AGE = 8, CROWN_DONE = 4.5, ROOT_DONE = 9.5; // years: 11 crown complete ~4.5, root complete ~9.5 (kit chronology; facts §5: incisor roots 9-11 y)
const DEVELOP = (AGE - CROWN_DONE) / (ROOT_DONE - CROWN_DONE);   // 0.7 of the root formed
const CREST = -1.6;
const XI = -GAP / 2, XM = GAP / 2;               // immature on the viewer's left, mature on the right

const fig = DK.figure({
  fov: 26,
  title: 'Immature tooth with an open apex',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up: age about 8 vs adult.',
  view: { theta: 0.1, phi: 1.42, margin: 0.9 }
});

// ---------- the immature tooth: short root, near-parallel walls
const spec = DK.toothPreset(11, { develop: DEVELOP });
spec.roots[0].taper = 0.22;                       // an unfinished root barely tapers
const imm = DK.tooth(spec), si = imm.spec, ri = si.roots[0];
imm.group.position.x = XI;
const L = ri.len, START = ri.start ?? 0.5;
// the canal: same centre line as the root, radius from ~45% of the root at the top to ~85% at the open end (walls thin apically)
const canalSpec = Object.assign({}, ri, { ra: ri.ra * 0.36, rb: ri.rb * 0.36, taper: 1 - ((1 - ri.taper) * 0.93) / 0.36 });
const canalGeo = DK.rootGeometry(canalSpec, { k: 1, add: 0, minR: 0.05, endShort: -0.2, dome: true });
const wideCanal = new THREE.Mesh(canalGeo, DK.mat("pulp")); wideCanal.userData.cutOnly = true; imm.group.add(wideCanal);
const tAt = y => (START - y) / (L + START);
const ring = (r, y, th) => DK.rootRing(r, tAt(y), th, { k: 1, add: 0, minR: 0.05 }, r.len);
const END_Y = -L, endC = ring(ri, END_Y + 0.05, 0), endCx = (ring(ri, END_Y + 0.05, 0)[0] + ring(ri, END_Y + 0.05, Math.PI)[0]) / 2;
const CUT_I = DK.canalAt(si, 0, -4).z;

// the open end: a marker at the centre of the root's open end for the label
const openMark = new THREE.Object3D(); openMark.position.set(endCx, END_Y + 0.3, 0); imm.group.add(openMark);

// apexification plug: the apical ~third of the wide canal filled with calcium-silicate cement (shown by the toggle)
const plugGeo = canalGeo.clone(), PLUG_TOP = END_Y + L * 0.36;
{ const p = plugGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.max(END_Y, Math.min(p.getY(i), PLUG_TOP))); plugGeo.computeVertexNormals(); }
const plug = new THREE.Mesh(plugGeo, DK.mat('cement', { color: 0xe4e1d8, cap: 0xe4e1d8 })); plug.visible = false; plug.userData.cutOnly = true; imm.group.add(plug);

// ---------- the mature tooth
const mat = DK.tooth(11), sm = mat.spec, rm = sm.roots[0];
mat.group.position.x = XM;
const apexM = DK.canalAt(sm, 0, -rm.len + 0.6);

// ---------- context: one bone block and gingiva around both
const bone = DK.bone({ width: 2 * GAP + 14, height: 14.8, depth: 10.5, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, -0.6);
const gum = DK.gingiva({ width: 2 * GAP + 14, height: 3.0, depth: 11.4, crest: 1.2,
  around: [{ x: XI, z: 0.6, md: si.mdC, bl: si.blC, rise: 0.9 }, { x: XM, z: 0.6, md: sm.mdC, bl: sm.blC, rise: 0.9 }] });
gum.position.set(0, 1.1, -0.6);

// ---------- parts
const zc = sec => (sec.enabled ? sec.offset : 0) + 0.12;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the teeth.' });
fig.part(imm.group, { name: 'Immature', sub: 'age about 8', anchor: [0, si.crownL + 1.9, 0], info: `A central incisor a year or so after it erupts: the root is only about ${Math.round(DEVELOP * 100 / 10) * 10}% formed and finishes at about 9 to 11 years.` });
fig.part(mat.group, { name: 'Mature', sub: 'adult', anchor: [0, sm.crownL + 1.9, 0], info: 'A fully formed central incisor: thick dentin walls and a canal that narrows to a small apical foramen.' });
const cutOn = (e, sec) => sec.enabled;
const wallY = -L * 0.62, wIn = ring(canalSpec, wallY, Math.PI)[0], wOut = ring(ri, wallY, Math.PI)[0];
fig.part(wideCanal, { inPlace: true, name: 'Thin walls', anchor: (e, sec) => [(wIn + wOut) / 2, wallY, zc(sec)], labelOffset: [-70, 0], when: cutOn, dim: false,
  info: 'Dentin is laid down from inside for years after eruption. Until then the walls are thin and fracture easily, so they cannot be shaped like a mature canal.' });
fig.part(openMark, { inPlace: true, name: 'Open apex', anchor: (e, sec) => [0, 0, zc(sec)], labelOffset: [-70, 40], accent: true, when: cutOn, dim: false,
  info: 'The root end is still wide open, wider than the canal above it (a blunderbuss apex). There is no constriction for files and a root filling to stop against.' });
const apexMark = new THREE.Object3D(); apexMark.position.set(apexM.x, -rm.len + 0.6, 0); mat.group.add(apexMark);
fig.part(apexMark, { inPlace: true, name: 'Narrow apex', anchor: (e, sec) => [0, 0, zc(sec)], labelOffset: [90, -70], when: cutOn, dim: false,
  info: 'The finished root narrows to a small apical foramen with a constriction just short of it: the stop that a normal root canal treatment shapes and fills to.' });
fig.part(plug, { inPlace: true, name: 'Apexification plug', sub: 'calcium-silicate cement', anchor: (e, sec) => [endCx, (END_Y + PLUG_TOP) / 2, zc(sec)], labelOffset: [-80, 0], when: () => plug.visible, dim: false,
  info: 'Apexification: a plug of calcium-silicate cement (such as MTA) closes the open end so the canal above can be filled. Regenerative treatment instead lets the root keep growing, thickening its walls.' });

// ---------- section: one mesio-distal plane through both canals
const CUT = (CUT_I + DK.canalAt(sm, 0, -4).z) / 2;
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [imm.layers.enamel, mat.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [imm.layers.root, imm.layers.dentin, mat.layers.root, mat.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [imm.layers.pulp, mat.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [wideCanal], color: DK.COLORS.pulpCap },
  { objects: [plug], color: 0xe4e1d8, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: CUT } });
fig.xray([bone, gum], false);
fig.param('plug', 0, v => { plug.visible = v > 0.5; });
fig.toggle('Apexification', false, v => fig.goTo({ set: { plug: v ? 1 : 0 }, labels: v ? ['Immature', 'Apexification plug'] : ['Immature', 'Mature', 'Thin walls', 'Open apex', 'Narrow apex'] }, 0.6));

// ---------- story: both teeth → the cut sweeps in → the open apex → the finished apex → side by side
const FOC_I = [XI + 1.2, -L * 0.45, CUT], FOC_M = [XM - 0.8, -rm.len * 0.55, CUT];
fig.story([
  { dur: 0, hold: 1.4, fov: 32, theta: 0.55, phi: 1.25, zoom: 1.02, section: false, xray: 0, labels: ['Immature', 'Mature'], caption: 'The same tooth at about 8 years and in an adult.' },
  { dur: 2.2, hold: 0.2, fov: 26, theta: 0.04, phi: 1.46, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 0.8, offset: CUT, labels: ['Immature', 'Mature'], caption: 'Cut through both canals.' },
  { dur: 2.2, hold: 2.2, zoom: 0.74, focus: FOC_I, theta: -0.06, labels: ['Thin walls', 'Open apex'], caption: 'Young root: thin walls and a wide-open end.' },
  { dur: 2.2, hold: 1.8, zoom: 0.74, focus: FOC_M, theta: 0.1, labels: ['Narrow apex'], caption: 'Finished root: thick walls narrowing to a small foramen.' },
  { dur: 2.4, hold: 2.6, zoom: 1, focus: 'auto', theta: 0.06, phi: 1.44, labels: ['Immature', 'Mature', 'Thin walls', 'Open apex', 'Narrow apex'], caption: 'No apical stop, so the young tooth needs apexification or regeneration.' }
]);
fig.start();
