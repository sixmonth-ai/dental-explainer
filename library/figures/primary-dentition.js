// Library: the 20 primary teeth as a chart, both arches seen from the occlusal (upper arch above, turned crown-up; lower below),
// poster: end
// the patient's right on the viewer's left. Arch frame: midline x = 0, patient's right at -x. FDI numbers, then Universal letters.
// Teaching point: 10 primary teeth per jaw (2 incisors, 1 canine, 2 molars per quadrant) and no premolars; numbered 51-85 (FDI) or A-T (Universal).
const DK_MODE_IMAGE = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 26,
  title: 'The 20 baby teeth',
  subtitle: 'Primary teeth, FDI 51–85 or Universal A–T. Patient’s right on the left.',
  view: { theta: 0, phi: 0.16, margin: DK_MODE_IMAGE ? 0.72 : 1.0 }   // a chart from above runs its depth up the screen: looser fit on the page, tighter in the framed image
});

const GAP = 9;   // mm between the two molar rows
const upper = DK.arch({ jaw: 'maxilla', dentition: 'primary', placement: 'chart', crownsOnly: true });
const lower = DK.arch({ jaw: 'mandible', dentition: 'primary', crownsOnly: true });
upper.group.position.z = -(upper.depth + GAP / 2);
lower.group.position.z = lower.depth + GAP / 2;

// numbers in three systems; one param cross-fades between them so the story can switch systems too
const ink = fig.dark ? '#F5F3EE' : '#0A0A08', halo = fig.dark ? 'rgba(14,14,12,0.9)' : 'rgba(241,238,230,0.9)', muted = fig.dark ? '#9C978D' : '#6E6A62';
const SYS = ['fdi', 'universal', 'palmer'], numbers = {};
SYS.forEach(sys => {
  numbers[sys] = [upper, lower].map(a => DK.toothNumbers(a, { system: sys, color: ink, halo, height: sys === 'palmer' ? 2.7 : 2.4, lift: 2.0 }));
  numbers[sys].forEach(g => g.traverse(o => { if (o.material) { o.material.transparent = true; o.material.depthWrite = false; } }));
});
[['R', -1], ['L', 1]].forEach(([txt, sgn]) => { const sp = DK.textSprite(txt, { height: 4.2, color: muted, halo: null, weight: 500 }); sp.position.set(sgn * (upper.width / 2 + 7), 2, 0); fig.world.add(sp); });

const sysButtons = {};
fig.param('sys', 0, v => {
  SYS.forEach((k, i) => { const a = Math.max(0, 1 - Math.abs(v - i) * 1.6); numbers[k].forEach(g => { g.visible = a > 0.01; g.traverse(o => { if (o.material) o.material.opacity = a; }); }); });
  const near = SYS[Math.round(v)]; Object.keys(sysButtons).forEach(k => sysButtons[k].setAttribute('aria-pressed', k === near));
});

fig.part(upper.group, { name: 'Upper arch', label: false, info: 'Ten upper primary teeth: quadrants 5 (right) and 6 (left) in FDI, letters A to J in Universal.' });
fig.part(lower.group, { name: 'Lower arch', label: false, info: 'Ten lower primary teeth: quadrants 7 (left) and 8 (right) in FDI, letters K to T in Universal.' });
const EXFOL = { 1: 'about 6-8 years', 2: 'about 7-9 years', 3: 'about 9-12 years', 4: 'about 9-12 years', 5: 'about 9-13 years' };
const SUCC = { 1: 'the permanent central incisor', 2: 'the permanent lateral incisor', 3: 'the permanent canine', 4: 'the first premolar', 5: 'the second premolar' };
[...upper.teeth, ...lower.teeth].forEach(t => {
  const f = t.fdi, p = f % 10;
  fig.part(t.tooth.group, { inPlace: true, name: DK.toothName(f), label: false,
    info: `FDI ${f} · Universal ${DK.toothNumber(f, 'universal')} · Palmer ${DK.toothNumber(f, 'palmer')}. Replaced by ${SUCC[p]} (${DK.successorOf(f)}); falls out at ${EXFOL[p]}.` });
});

// the point: the back teeth of a child are molars, and the premolars that replace them come later
const t84 = lower.teeth.find(t => t.fdi === 84), t85 = lower.teeth.find(t => t.fdi === 85), t54 = upper.teeth.find(t => t.fdi === 54), t55 = upper.teeth.find(t => t.fdi === 55);
// label anchors: markers between the two molars of a quadrant, in the arch's own frame
const between = (arch, a, b) => { const o = new THREE.Object3D(); o.position.set((a.slot.c[0] + b.slot.c[0]) / 2, Math.max(a.spec.crownL, b.spec.crownL) + 0.3, (a.slot.c[1] + b.slot.c[1]) / 2); arch.group.add(o); return o; };
fig.part(between(lower, t84, t85), { inPlace: true, name: 'Primary molars', sub: 'premolars replace them', accent: true, dim: false, anchor: [0, 0, 0], labelOffset: [-90, 60],
  info: 'Two primary molars per quadrant. There are no primary premolars: the permanent premolars erupt in their place at about 10-12 years.' });
fig.part(between(upper, t54, t55), { inPlace: true, name: 'Primary molars ', sub: 'two per quadrant', dim: false, anchor: [0, 0, 0], labelOffset: [-90, -60],
  info: 'The upper first primary molar has a form of its own; the second resembles a small permanent first molar.' });

[['FDI', 0], ['Universal', 1], ['Palmer', 2]].forEach(([label, i]) => { sysButtons[SYS[i]] = fig.button(label, () => fig.goTo({ set: { sys: i } }, 0.5)); });
fig.standardControls({ explode: false });

// story: both arches at an angle → the chart from above, FDI numbers → push in on the upper right quadrant (51-55 from the midline)
// → the numbers turn into Universal letters → the back of the lower right: molars, not premolars → hero chart with letters
const zU = upper.group.position.z + upper.depth / 2, zL = lower.group.position.z - lower.depth / 2;
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.45, phi: 0.95, zoom: 1.05, set: { sys: 0 }, labels: [], caption: 'A child’s full set: 20 primary teeth, 10 in each jaw.' },
  { fov: 26, dur: 2.4, hold: 1.6, theta: 0, phi: 0.16, zoom: 1, labels: [], caption: 'Seen as a chart: upper above, lower below, the patient’s right on the left.' },
  { dur: 2.0, hold: 2.0, zoom: 0.55, focus: [-upper.width / 4, 3, zU], labels: [], caption: 'FDI numbers the primary quadrants 5 to 8: the upper right runs 51 to 55 from the midline.' },
  { dur: 1.2, hold: 1.6, set: { sys: 1 }, caption: 'In the Universal system they are letters: A is the upper right second molar.' },
  { dur: 2.2, hold: 2.4, zoom: 0.6, focus: [-lower.width / 4, 3, zL], labels: ['Primary molars'], caption: 'Two molars behind each canine, and no premolars: those come with the adult teeth.' },
  { dur: 2.2, hold: 2.6, zoom: 1, focus: 'auto', theta: 0, phi: 0.16, drift: 0, set: { sys: 0 }, labels: ['Primary molars', 'Primary molars '], caption: '' }
]);
fig.start();
