// Library: a primary lower second molar (FDI 75 = Universal K) with its successor premolar (35) forming between its roots, beside a permanent lower first molar (FDI 36 = Universal 19), both crown up and at true size, cut mesio-distally through the buccal cusps. Frame: CEJs at y = 0, +x mesial, +z buccal; the two sets sit side by side along x.
// poster: end
// Teaching point: the baby molar has thin enamel, large pulp horns close to the surface and thin roots that flare apart to cradle the premolar forming below.
const fig = DK.figure({
  fov: 30,
  title: 'Baby molar vs adult molar',
  subtitle: 'FDI 75 (Universal K) and FDI 36 (Universal 19), true size.',
  view: { theta: 0.45, phi: 1.32 }
});

const GAP = 7;                                            // mm between the two crowns
const baby = DK.tooth(75), sb = baby.spec, LB = baby.layers;
const adult = DK.tooth(36), sa = adult.spec, LA = adult.layers;
const XB = -(sb.md / 2 + GAP / 2), XA = sa.md / 2 + GAP / 2;
baby.group.position.x = XB; adult.group.position.x = XA;

// the successor: a lower second premolar crown, root just begun, in the space between the primary molar's roots
const succ = DK.tooth(DK.toothPreset(35, { develop: 0.06 })), ss = succ.spec, LS = succ.layers;
const SUCC_TOP = -7.0;                                     // cusp tip below the furcation, inside the root spread
succ.group.position.set(XB - 0.3, SUCC_TOP - ss.crownL, 0.2);
[baby, adult, succ].forEach(t => t.group.updateMatrixWorld(true));

const CUT = 1.4;   // mesio-distal cut through the buccal cusps and the mesiobuccal pulp horns; the buccal part is removed, camera on +z
const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
// a point on a layer's surface in the plane of the cut, in that tooth's local frame
const hitLocal = (tooth, layer, from, dir) => {
  const g = tooth.group, o = new THREE.Vector3(...from).add(g.position);
  ray.set(o, new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(meshesOf(layer), false)[0];
  return h ? [h.point.x - g.position.x, h.point.y - g.position.y, h.point.z - g.position.z] : null;
};

fig.part(baby.group, { name: 'Baby molar', sub: 'primary, 75', anchor: [0, sb.crownL + 1.0, 0], labelOffset: [0, -70], dim: false,
  info: 'Lower left second primary molar (FDI 75, Universal K): erupts at about 20 to 30 months, falls out at about 11 to 13 years, replaced by the second premolar.' });
fig.part(adult.group, { name: 'Adult molar', sub: 'permanent, 36', anchor: [0, sa.crownL + 1.0, 0], labelOffset: [0, -50], dim: false,
  info: 'Lower left first permanent molar (FDI 36, Universal 19): erupts at about 6 years behind the baby molars and replaces no tooth.' });
fig.part(succ.group, { name: 'Premolar', sub: 'forming between the roots', anchor: [0, ss.crownL * 0.45, -0.2], labelOffset: [-110, 30], dim: false,
  info: 'The second premolar (FDI 35) forms between the flared roots of the baby molar. As it erupts, at about 11 to 12 years, the baby molar roots resorb and the tooth falls out.' });

// enamel: on the outer edge of the cut, distal side, at mid-crown height
const eB = hitLocal(baby, LB.enamel, [-20, sb.crownL * 0.62, CUT], [1, 0, 0]);
const eA = hitLocal(adult, LA.enamel, [20, sa.crownL * 0.72, CUT], [-1, 0, 0]);
fig.part(LB.enamel, { inPlace: true, name: 'Thin enamel', sub: 'about 1 mm', anchor: eB ? [eB[0] + 0.35, eB[1], CUT + 0.02] : [-sb.md / 2, 4, CUT], labelOffset: [-110, -40], dim: false,
  when: (e, sec) => sec.enabled, info: 'Primary enamel is thin (about 0.5 to 1 mm) and even, so decay reaches the dentin quickly.' });
fig.part(LA.enamel, { inPlace: true, name: 'Thick enamel', sub: '2 to 2.5 mm over the cusps', anchor: eA ? [eA[0] - 0.4, eA[1], CUT + 0.02] : [sa.md / 2, 5, CUT], labelOffset: [90, -20], dim: false,
  when: (e, sec) => sec.enabled, info: 'Permanent enamel is about 2 to 2.5 mm thick over the cusps and thins to a knife edge at the CEJ.' });
// pulp horn: top of the baby molar's pulp on the cut, mesial half
const hB = hitLocal(baby, LB.pulp, [-sb.md * 0.16, 30, CUT], [0, -1, 0]);   // the distal horn, on the side of the label
fig.part(LB.pulp, { inPlace: true, name: 'Pulp horns', sub: 'high, close to the surface', accent: true, dim: false, anchor: hB ? [hB[0], hB[1] - 0.25, CUT + 0.02] : [1.5, sb.crownL * 0.7, CUT], labelOffset: [-170, 40],
  when: (e, sec) => sec.enabled, info: 'A large pulp with tall, pointed horns, the mesial one highest, under a thin shell of dentin: easy to expose when a cavity is drilled.' });
const rB = sb.roots[0];
fig.part(LB.root, { inPlace: true, name: 'Flared roots', sub: 'thin, spread apart', dim: false, anchor: [rB.x + rB.apex[0] * 0.5 + rB.flare[0] + rB.ra * 0.7, -rB.len * 0.62, 0.6], labelOffset: [70, 40],
  info: 'Long, slender roots with almost no root trunk: the furcation sits just below the CEJ and the roots spread to make room for the premolar.' });

const groups = (pick) => [baby, adult, succ].map(t => pick(t.layers)).flat();
fig.enableSection([0, 0, 1], [
  { objects: groups(l => [l.enamel]), color: DK.COLORS.enamelCap },
  { objects: groups(l => [l.root, l.dentin]), color: DK.COLORS.dentinCap },
  { objects: groups(l => [l.pulp]), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 5.5], offset: CUT } });
fig.view('Crowns', { theta: 0.05, phi: 1.45, zoom: 0.62, focus: [0, 3.2, 0], section: true, offset: CUT, labels: ['Thin enamel', 'Thick enamel', 'Pulp horns'] });

// story: the pair at an angle → straight on from the cheek, true size: the baby molar is smaller, bell-shaped, roots flared round a
// premolar → the cut sweeps in → push in across both crowns (thin vs thick enamel, the high pulp horns) → hero: whole pair in section
const CROWNS = [0, 3.4, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.5, theta: 0.45, phi: 1.32, zoom: 1.05, section: false, labels: ['Baby molar', 'Adult molar'], caption: 'A baby molar and an adult molar, true size.' },
  { fov: 30, dur: 2.4, hold: 2.2, theta: 0.03, phi: 1.5, zoom: 1, labels: ['Flared roots', 'Premolar'], caption: 'The baby molar’s thin roots flare apart around the premolar that will replace it.' },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { fov: 26, dur: 2.4, hold: 0.6, offset: CUT, labels: [] },
  { dur: 2.2, hold: 2.4, zoom: 0.6, focus: CROWNS, labels: ['Thin enamel', 'Thick enamel'], caption: 'Thin enamel on the baby molar, thick on the adult one.' },
  { dur: 1.8, hold: 2.2, zoom: 0.48, focus: [XB, 3.4, 0], labels: ['Pulp horns'], caption: 'And its pulp horns reach close to the surface.' },
  { fov: 28, dur: 2.4, hold: 2.8, theta: 0.12, phi: 1.44, zoom: 1, focus: 'auto', drift: 0, labels: ['Baby molar', 'Adult molar', 'Thin enamel', 'Thick enamel', 'Pulp horns', 'Premolar'], caption: '' }
]);
fig.start();
