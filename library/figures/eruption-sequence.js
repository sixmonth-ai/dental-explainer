// Library: the order adult teeth come in, as a chart of both permanent arches seen from the occlusal at a tilt (upper arch above, turned
// poster: step 5
// crown-up with DK.arch 'chart' placement; lower arch below; the patient's right on the viewer's left). Teeth that have not come in yet are
// pale ghosts; each step brings one group in (the crowns rise into place and turn solid) and writes its eruption age beside each tooth.
// Ages are the ADA / AAPD ranges in dental-facts.md §5 (years). Arch frame: midline x = 0, patient's right at -x, mm.
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 28,
  title: 'When adult teeth come in',
  subtitle: 'Typical ages in years; every child varies. Patient’s right on the left.',
  view: { theta: 0, phi: 0.22, margin: IMG ? 0.72 : 1.14 }
});

// eruption ages (dental-facts §5), by position 1-8: [maxillary, mandibular]
const AGE = { 1: ['7–8', '6–7'], 2: ['8–9', '7–8'], 3: ['11–12', '9–10'], 4: ['10–11', '10–12'], 5: ['10–12', '11–12'], 6: ['6–7', '6–7'], 7: ['12–13', '11–13'], 8: ['17–21', '17–21'] };
// the five steps and the teeth (FDI positions per jaw) each brings in
const GROUPS = [
  { up: [6], low: [1, 6] },          // about 6: first molars and lower central incisors
  { up: [1, 2], low: [2] },          // 7 to 9: the other incisors
  { up: [3, 4, 5], low: [3, 4, 5] }, // 9 to 12: canines and premolars
  { up: [7], low: [7] },             // 11 to 13: second molars
  { up: [8], low: [8] }              // 17 to 21: third molars, if they come
];
const groupOf = fdi => { const q = Math.floor(fdi / 10), p = fdi % 10, upper = q === 1 || q === 2; return GROUPS.findIndex(g => (upper ? g.up : g.low).includes(p)); };

const GAP = 12;
const upper = DK.arch({ jaw: 'maxilla', thirdMolars: true, placement: 'chart', crownsOnly: true });
const lower = DK.arch({ jaw: 'mandible', thirdMolars: true, crownsOnly: true });
upper.group.position.z = -(upper.depth + GAP / 2);
lower.group.position.z = lower.depth + GAP / 2;
upper.group.updateMatrixWorld(true); lower.group.updateMatrixWorld(true);
const gumU = DK.gingivaArch(upper), gumL = DK.gingivaArch(lower);
fig.world.add(gumU, gumL);
fig.part(gumU, { inPlace: true, name: 'Gum', label: false, info: 'The gum. A tooth that has not come in yet is still under it (pale here).' });
fig.part(gumL, { inPlace: true, name: 'Gum', label: false, info: 'The gum. A tooth that has not come in yet is still under it (pale here).' });
fig.part(upper.group, { name: 'Upper teeth', label: false, info: 'The 16 upper adult teeth, seen from below and turned up like a chart.' });
fig.part(lower.group, { name: 'Lower teeth', label: false, info: 'The 16 lower adult teeth, seen from above.' });

const ink = fig.dark ? '#F5F3EE' : '#0A0A08', halo = fig.dark ? 'rgba(14,14,12,0.9)' : 'rgba(241,238,230,0.9)', muted = fig.dark ? '#9C978D' : '#6E6A62';
[['R', -1], ['L', 1]].forEach(([txt, s]) => { const sp = DK.textSprite(txt, { height: 4.6, color: muted, halo: null, weight: 500 }); sp.position.set(s * (upper.width / 2 + 10), 2, 0); fig.world.add(sp); });

// every tooth: its own (cloned) materials so it can fade, its group, and two age tags (ink, and accent while its group is the newest)
const all = [];
[[upper, 0], [lower, 1]].forEach(([arch, j]) => arch.teeth.forEach(t => {
  const mats = [];
  t.tooth.group.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); mats.push(o.material); } });
  const age = AGE[t.fdi % 10][j], s = t.slot, out = t.fdi % 10 >= 6 ? 9.0 : 8.2;
  const tag = c => { const sp = DK.textSprite(age, { height: 2.9, color: c, halo, weight: 650 }); sp.position.set(s.c[0] + s.n[0] * out, 1.2, s.c[1] + s.n[1] * out); sp.material.transparent = true; arch.group.add(sp); return sp; };
  const g = groupOf(t.fdi), rec = { t, mats, g, base: t.tooth.group.position.clone(), inkTag: tag(ink), accTag: tag(fig.accentHex) };
  all.push(rec);
  fig.part(t.tooth.group, { inPlace: true, name: DK.toothName(t.fdi), label: false,
    info: `FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}). Comes in at about ${age} years.${t.fdi % 10 >= 6 ? ' A molar: it comes in behind the baby teeth and replaces none.' : ' It replaces a baby tooth.'}${t.fdi % 10 === 8 ? ' Third molars vary most; about a quarter of people miss at least one.' : ''}` });
}));
const show = (r, k) => {   // k 0 = not in yet (ghost, 2 mm low), 1 = in
  const a = 0.28 + 0.72 * k;
  r.mats.forEach(m => { m.transparent = a < 0.999; m.opacity = a; m.depthWrite = a > 0.6; });
  r.t.tooth.group.position.y = r.base.y - 2.2 * (1 - k);
  r.k = k;
};
const P = GROUPS.map(() => 0);
GROUPS.forEach((_, i) => fig.param('g' + i, 0, k => { P[i] = k; all.filter(r => r.g === i).forEach(r => show(r, k)); }));
all.forEach(r => show(r, 0));
fig.onFrame(() => {
  const newest = P.reduce((n, k, i) => (k > 0.02 ? i : n), -1);
  all.forEach(r => { const k = P[r.g], cur = r.g === newest; r.inkTag.material.opacity = cur ? 0 : k; r.accTag.material.opacity = cur ? k : 0; r.inkTag.visible = !cur && k > 0.01; r.accTag.visible = cur && k > 0.01; });
});

// one label per step, on a tooth of the group that just came in (in the tooth's arch frame)
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
const mark = (arch, fdi) => { const t = T(arch, fdi), o = new THREE.Object3D(); o.position.set(t.slot.c[0], t.spec.crownL + 0.4, t.slot.c[1]); arch.group.add(o); return o; };
const L = [
  [lower, 46, 'First molars', '“six-year molars”', 'The first adult teeth, at about 6, come in behind the baby teeth without replacing any. The lower front teeth start at the same time.', [-80, 60]],
  [upper, 11, 'Front teeth', 'replace baby incisors', 'Between about 6 and 9 the incisors replace the baby front teeth, lower before upper.', [80, -70]],
  [lower, 44, 'Canines, premolars', 'replace baby canines, molars', 'From about 9 to 12 the canines come in and the premolars take the place of the baby molars.', [-80, 60]],
  [upper, 17, 'Second molars', '“twelve-year molars”', 'The second molars come in behind the first at about 11 to 13, the lower ones first.', [-70, -70]],
  [lower, 38, 'Wisdom teeth', 'often late or missing', 'Third molars come in at about 17 to 21, if at all: they are often impacted or missing.', [80, 60]]
];
L.forEach(([arch, fdi, name, sub, info, off], i) => fig.part(mark(arch, fdi), { inPlace: true, name, sub, info, anchor: [0, 0, 0], labelOffset: off, dim: false, accent: true }));
fig.standardControls({ explode: false });

// steps: each brings its group in while the camera eases toward it, then backs out to the whole chart
const zU = upper.group.position.z + upper.depth / 2, zL = lower.group.position.z - lower.depth / 2;
const HOME = { theta: 0, phi: 0.22, zoom: 1, focus: 'auto' };
const step = (label, caption, i, focus, extra) => ({ label, caption, beats: [
  Object.assign({ dur: 1.4, hold: 0.2, zoom: 0.78, focus, labels: [] }, extra || {}),
  { dur: 2.2, hold: 0.4, set: { ['g' + i]: 1 }, labels: [L[i][2]] },
  Object.assign({ dur: 1.6, hold: 1.8, labels: [L[i][2]], key: true }, HOME)] });
fig.procedure([
  step('About 6: first molars', 'The first molars come in behind the baby teeth, with the lower front teeth.', 0, [0, 2, 8], { fov: 28, theta: 0, phi: 0.22 }),
  step('6 to 9: incisors', 'The front teeth are replaced, lower before upper.', 1, [0, 2, -6]),
  step('9 to 12: canines, premolars', 'Canines and premolars replace the baby canines and molars.', 2, [0, 2, 0]),
  step('11 to 13: second molars', 'The second molars come in behind the first molars.', 3, [0, 2, 0]),
  step('17 to 21: wisdom teeth', 'Third molars come last, if they come at all.', 4, [0, 2, 0])
]);
fig.start();
