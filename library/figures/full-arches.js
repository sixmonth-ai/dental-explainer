// Library: the full permanent dentition, 32 teeth (16 per arch, third molars included), upper arch closed over the lower. Jaw frame:
// poster: end
// +x = patient's left, +z anterior, y up, lower CEJs at y = 0. The upper arch sits crown down in a holder placed as in DK.mandible's occlusion
// (about 2.5 mm overbite, 2.6 mm forward, slight tilt); the explode lifts it to open the bite. Crowns on the gum only (no roots or bone).
// Teaching point: 16 teeth in each arch, and when you bite the upper teeth close outside the lower ones: in front at the incisors, on the
// cheek side at the back teeth.
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 34,
  title: 'Upper and lower teeth together',
  subtitle: '32 adult teeth, third molars included. Patient’s right on the left.',
  view: { theta: 0.55, phi: 1.32, margin: IMG ? 0.62 : 0.74 }
});
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });

// ---- the two arches (crowns), the upper one in occlusion
const lowHold = new THREE.Group(), upHold = new THREE.Group();
const low = DK.arch({ jaw: 'mandible', thirdMolars: true, build: crowns }); lowHold.add(low.group);
const up = DK.arch({ jaw: 'maxilla', placement: 'jaw', thirdMolars: true, build: crowns }); upHold.add(up.group);
const OB = 2.5;   // overbite of DK.mandible's occlusion
upHold.position.set(0, DK.toothPreset(31).crownL - OB + DK.toothPreset(11).crownL, 2.6); upHold.rotation.x = -0.05;
lowHold.updateMatrixWorld(true); upHold.updateMatrixWorld(true);
const gumL = DK.gingivaArch(low), gumU = DK.gingivaArch(up);
lowHold.attach(gumL); upHold.attach(gumU);

const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
// a point `out` mm outside a tooth's slot, at arch height y (in the arch's own frame), mapped into its holder
const outside = (arch, fdi, y, out) => { const s = T(arch, fdi).slot; return [s.c[0] + s.n[0] * out, y, s.c[1] + s.n[1] * out]; };
const upPt = (fdi, y, out) => { const p = outside(up, fdi, y, out); return [p[0], -p[1], p[2]]; };   // the upper arch group is mirrored in y

fig.part(lowHold, { name: 'Lower arch', sub: '16 teeth', anchor: outside(low, 44, -2.2, 3.4), labelOffset: [-60, 60], explode: [0, -3, 0],
  info: 'The lower (mandibular) arch: 16 teeth, numbered 31 to 38 on the patient’s left and 41 to 48 on the right (FDI).' });
fig.part(upHold, { name: 'Upper arch', sub: '16 teeth', anchor: upPt(14, 2.6, 3.6), labelOffset: [-60, -60], explode: [0, 13, -2],
  info: 'The upper (maxillary) arch: 16 teeth, numbered 11 to 18 on the patient’s right and 21 to 28 on the left (FDI). It is a little wider and deeper than the lower arch.' });
fig.part(gumL, { inPlace: true, name: 'Gum', label: false, info: 'Gum around the lower teeth.' });
fig.part(gumU, { inPlace: true, name: 'Gum', label: false, info: 'Gum around the upper teeth.' });
const KIND = { 1: 'cutting', 2: 'cutting', 3: 'tearing', 4: 'crushing', 5: 'crushing', 6: 'grinding', 7: 'grinding', 8: 'grinding' };
[...up.teeth, ...low.teeth].forEach(t => fig.part(t.tooth.group, { inPlace: true, name: DK.toothName(t.fdi), label: false,
  info: `FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}), a ${KIND[t.fdi % 10]} tooth.${t.fdi % 10 === 8 ? ' Third molars vary most and are missing in about a quarter of people, which leaves 28.' : ''}` }));

// the overlap, labelled where it is made: upper incisor edges in front of the lower incisors; upper molar cheek cusps outside the lower ones
const s11 = T(up, 11).spec, s16 = T(up, 16).spec;
const mark = (hold, p) => { const o = new THREE.Object3D(); o.position.set(p[0], p[1], p[2]); hold.add(o); return o; };
fig.part(mark(upHold, upPt(11, s11.crownL - 1.0, s11.bl / 2 + 0.3)), { inPlace: true, name: 'Upper front teeth', sub: 'close in front of the lower', accent: true, dim: false, anchor: [0, 0, 0], labelOffset: [110, 50],
  info: 'When you bite, the upper incisors close in front of the lower ones and hide the top of them (overbite and overjet).' });
fig.part(mark(upHold, upPt(16, s16.crownL - 1.2, s16.bl / 2 + 0.3)), { inPlace: true, name: 'Upper back teeth', sub: 'cusps outside the lower', dim: false, anchor: [0, 0, 0], labelOffset: [-90, -60],
  info: 'At the back, the cheek-side cusps of the upper teeth close outside the lower ones, and the lower cheek-side cusps rest in the grooves of the upper teeth.' });
fig.part(mark(upHold, upPt(18, 3, s16.bl / 2 - 1)), { inPlace: true, name: 'Third molars', sub: 'often missing', dim: false, anchor: [0, 0, 0], labelOffset: [-70, -50],
  info: 'Wisdom teeth come in at about 17 to 21 years, if at all: at least one is missing in about a quarter of people.' });

fig.standardControls({ explode: true, explodeLabel: 'Open' });
fig.view('Front', { theta: 0, phi: 1.52, zoom: 0.62, explode: 0, focus: [0, 9, 2] });
fig.view('Open', { theta: 0.12, phi: 1.42, zoom: 1, explode: 1, focus: 'auto' });

// story: closed bite in three-quarter → the bite opens and the camera rises to show both arches, 16 teeth each → it closes again,
// push in from the front on the incisors → orbit to the right side, push in on the molars → hero: three-quarter, closed, both arches named
const s46 = T(low, 46).slot, F16 = upPt(16, s16.crownL - 1.5, 0);
fig.story([
  { dur: 0, hold: 1.4, theta: 0.55, phi: 1.32, zoom: 1.0, explode: 0, labels: [], caption: 'Your adult teeth: an upper and a lower arch.' },
  { dur: 2.4, hold: 2.2, theta: 0.12, phi: 1.42, zoom: 1.0, explode: 1, labels: ['Upper arch', 'Lower arch'], caption: 'Sixteen teeth in each, 32 in all.' },
  { dur: 2.2, hold: 0.2, theta: 0.0, phi: 1.5, explode: 0, labels: [] },
  { dur: 1.8, hold: 2.2, zoom: 0.55, focus: [0, 9, 3], labels: ['Upper front teeth'], caption: 'When you bite, the upper front teeth close in front of the lower ones.' },
  { dur: 2.6, hold: 2.2, theta: -1.25, phi: 1.5, zoom: 0.68, focus: [F16[0], 8, F16[2]], labels: ['Upper back teeth'], caption: 'At the back, the upper cusps sit outside the lower ones.' },
  { dur: 2.4, hold: 2.6, theta: -0.62, phi: 1.36, zoom: 1.0, focus: 'auto', drift: 0, labels: ['Upper arch', 'Lower arch', 'Upper front teeth', 'Upper back teeth'], caption: '' }
]);
fig.start();
