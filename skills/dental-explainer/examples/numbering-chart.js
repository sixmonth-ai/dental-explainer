// Example: full-mouth numbering chart. Both permanent arches from the occlusal, laid out like a chart: the upper arch above
// (turned crown-up, DK.arch placement 'chart'), the lower arch below, the patient's right on the viewer's left. FDI numbers sit on
// the teeth; the Universal and Palmer buttons swap them. Hover a tooth for its name and all three numbers.
const fig = DK.figure({
  title: 'Tooth numbering chart',
  subtitle: 'FDI on the teeth; Universal and Palmer on the buttons. Patient’s right is on the left.',
  view: { theta: 0, phi: 0.16, margin: 1.08 }   // seen from above, the chart's depth runs up the screen: the auto-fit needs a looser margin
});

const GAP = 11;                                 // mm between the two molar rows
const upper = DK.arch({ jaw: 'maxilla', thirdMolars: true, placement: 'chart', crownsOnly: true });
const lower = DK.arch({ jaw: 'mandible', thirdMolars: true, crownsOnly: true });
upper.group.position.z = -(upper.depth + GAP / 2);   // incisors at the top of the chart, molars toward the middle
lower.group.position.z = lower.depth + GAP / 2;      // incisors at the bottom

// text colours follow the theme
const ink = fig.dark ? '#F5F3EE' : '#0A0A08', halo = fig.dark ? 'rgba(14,14,12,0.9)' : 'rgba(241,238,230,0.9)', muted = fig.dark ? '#9C978D' : '#6E6A62';
const numbers = {};
['fdi', 'universal', 'palmer'].forEach(sys => {
  numbers[sys] = [upper, lower].map(a => DK.toothNumbers(a, { system: sys, color: ink, halo, height: sys === 'palmer' ? 3.4 : 3.1, lift: 2.4 }));
  numbers[sys].forEach(g => { g.visible = sys === 'fdi'; });
});
// patient's side markers, between the arches
[['R', -1], ['L', 1]].forEach(([txt, s]) => { const sp = DK.textSprite(txt, { height: 5, color: muted, halo: null, weight: 500 }); sp.position.set(s * (upper.width / 2 + 9), 2, 0); fig.world.add(sp); });

fig.part(upper.group, { name: 'Upper arch', label: false, info: 'Maxillary teeth seen from below: quadrants 1 (right) and 2 (left).' });
fig.part(lower.group, { name: 'Lower arch', label: false, info: 'Mandibular teeth seen from above: quadrants 3 (left) and 4 (right).' });
[...upper.teeth, ...lower.teeth].forEach(t => {
  const f = t.fdi, extra = f % 10 === 8 ? ' Highly variable; missing in about a quarter of people.' : '';
  fig.part(t.tooth.group, { inPlace: true, name: DK.toothName(f), label: false, info: `FDI ${f} · Universal ${DK.toothNumber(f, 'universal')} · Palmer ${DK.toothNumber(f, 'palmer')}.${extra}` });
});

// panel: numbering system (one of three), the two arches, reset
const sysButtons = {};
const choose = sys => { Object.keys(numbers).forEach(k => { numbers[k].forEach(g => { g.visible = k === sys; }); sysButtons[k].setAttribute('aria-pressed', k === sys); }); };
[['FDI', 'fdi'], ['Universal', 'universal'], ['Palmer', 'palmer']].forEach(([label, sys]) => { sysButtons[sys] = fig.button(label, () => choose(sys)); });
choose('fdi');
const zU = upper.group.position.z + upper.depth / 2, zL = lower.group.position.z - lower.depth / 2;
fig.view('Upper', { theta: 0, phi: 0.16, zoom: 0.62, focus: [0, 4, zU] });
fig.view('Lower', { theta: 0, phi: 0.16, zoom: 0.62, focus: [0, 4, zL] });
fig.standardControls({ explode: false });

// story: both arches at an angle → the chart from above → the upper right quadrant (numbers 11–18 run from the midline) →
// the lower left (31–38) → back out to the whole chart
fig.story([
  { dur: 0, hold: 1.4, theta: 0.45, phi: 0.95, zoom: 1.05, caption: 'Both arches, as a chart: upper above, lower below.' },
  { dur: 2.4, hold: 1.6, theta: 0, phi: 0.16, zoom: 1, caption: 'Seen from the occlusal. The patient’s right is on the left.' },
  { dur: 2.0, hold: 2.2, zoom: 0.5, focus: [-22, 4, zU], caption: 'FDI: quadrant 1 is the upper right; 11 to 18 run from the midline back.' },
  { dur: 2.4, hold: 2.2, zoom: 0.5, focus: [22, 4, zL], caption: 'Quadrant 3 is the lower left: 31 to 38.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0, phi: 0.16, drift: 0, caption: '' }
]);
fig.start();
