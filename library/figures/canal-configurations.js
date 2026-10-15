// Library: Vertucci's eight canal configurations (orifice to apex), each drawn in the same single root of an upper second premolar
// poster: end
// (FDI 15, crown up), shown as a cleared tooth: enamel and dentin turned see-through, the canal system dyed. Each tooth is turned so its
// bucco-palatal width faces the camera (where the canals split and join). Tooth frame: CEJ at y = 0, +z buccal; the row runs along world x.
// Teaching point: one root can hold one, two or three canals, which split and join in a few typical patterns (Vertucci 1984, types I to VIII).
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 26,
  title: 'How many canals in a root',
  subtitle: 'Vertucci types I to VIII, drawn in one upper premolar root (FDI 15), crown up.',
  view: { theta: 0, phi: 1.5, margin: IMG ? 0.6 : (window.innerWidth < 640 ? 0.9 : 0.76) }
});
const { lerp, smooth } = DK.util;

// a canal lane: offset f(u) in units of the lane spacing, u = 0 at the orifice, 1 at the apex. sw(a, b, u) eases 0 -> 1 between a and b.
const sw = (a, b, u) => smooth(a, b, u);
const split = (a, b) => u => sw(a, b, u), join = (a, b) => u => 1 - sw(a, b, u);
const TYPES = [
  { n: 'I', p: '1–1', lanes: [[0, () => 0]], info: 'One canal from the pulp chamber to the apex. The usual pattern in upper canines and most incisors.' },
  { n: 'II', p: '2–1', lanes: [[1, join(0.42, 0.68)], [-1, join(0.42, 0.68)]], info: 'Two canals leave the chamber and join before the apex, ending in one foramen.' },
  { n: 'III', p: '1–2–1', lanes: [[1, u => sw(0.14, 0.32, u) * (1 - sw(0.6, 0.8, u))], [-1, u => sw(0.14, 0.32, u) * (1 - sw(0.6, 0.8, u))]], info: 'One canal splits into two in the root, then they rejoin and exit as one.' },
  { n: 'IV', p: '2–2', lanes: [[1, () => 1], [-1, () => 1]], info: 'Two separate canals from the chamber to two separate foramina. Typical of two-canal upper first premolars.' },
  { n: 'V', p: '1–2', lanes: [[1, split(0.55, 0.8)], [-1, split(0.55, 0.8)]], info: 'One canal that divides near the apex into two, with two foramina: the split is easy to miss.' },
  { n: 'VI', p: '2–1–2', lanes: [[1, u => (1 - sw(0.18, 0.38, u)) + sw(0.58, 0.8, u)], [-1, u => (1 - sw(0.18, 0.38, u)) + sw(0.58, 0.8, u)]], info: 'Two canals merge in the root and divide again before the apex.' },
  { n: 'VII', p: '1–2–1–2', lanes: [[1, u => sw(0.08, 0.22, u) * (1 - sw(0.36, 0.5, u)) + sw(0.66, 0.84, u)], [-1, u => sw(0.08, 0.22, u) * (1 - sw(0.36, 0.5, u)) + sw(0.66, 0.84, u)]], info: 'One canal splits, rejoins, then splits again near the apex.' },
  { n: 'VIII', p: '3–3', lanes: [[1.15, () => 1], [0, () => 0], [-1.15, () => 1]], info: 'Three separate canals from the chamber to the apex: rare in a single root.' }
];

const spec0 = DK.toothPreset(15), GAP = spec0.blC + 2.0, ROWH = spec0.crownL + spec0.rootL + 10;
const NARROW = !IMG && window.innerWidth < 640;   // phones: two rows of four, so the row is not cut at the sides   // teeth side by side, bucco-palatal width facing the camera
const dye = new THREE.MeshStandardMaterial({ color: fig.accent.clone(), roughness: 0.45, metalness: 0, emissive: fig.accent.clone(), emissiveIntensity: 0.12 });
const row = new THREE.Group(), clear = [], sets = [];
TYPES.forEach((ty, i) => {
  const tooth = DK.tooth(15), s = tooth.spec, L = tooth.layers;
  const holder = new THREE.Group(), r = NARROW ? Math.floor(i / 4) : 0, c = NARROW ? i % 4 : i, nc = NARROW ? 4 : TYPES.length;
  holder.position.set((c - (nc - 1) / 2) * GAP, -r * ROWH, 0); holder.rotation.y = Math.PI / 2; holder.add(tooth.group); row.add(holder);
  // the preset's own pulp chamber stays (dyed); its single canal is replaced by this type's canals
  const pulp = L.pulp, chamber = pulp.userData.chamber;
  pulp.traverse(o => { if (o.isMesh) { o.material = dye; if (o !== chamber && o !== pulp && !o.userData.keep) o.visible = false; } });
  Object.values(pulp.userData.canals || {}).forEach(m => { m.visible = false; });
  if (chamber) chamber.visible = true;
  const y0 = -0.2, yA = -s.rootL + 0.35, rb = s.roots[0].rb;
  const centre = y => DK.canalAt(s, 0, y);
  const spacing = u => 1.0 + 0.5 * smooth(0, 0.22, u) - 1.0 * smooth(0.25, 1, u);   // inside the chamber floor at the orifices, widest in the coronal third, 0.5 mm at the apex
  const ptsOf = (side, f) => { const out = []; for (let k = 0; k <= 40; k++) { const u = k / 40, y = lerp(y0, yA, u), c = centre(y); out.push([c.x, y, c.z + side * spacing(u) * f(u)]); } return out; };
  const marks = {};
  ty.lanes.forEach(([side, f]) => {
    const two = ty.lanes.length > 1;
    const tube = DK.tube(ptsOf(side, f), two ? 0.24 : 0.3, dye, { taper: t => lerp(1, 0.45, t), segments: 80 });
    tooth.group.add(tube);
  });
  // landmark points for the push-in labels (tooth frame): where III splits and rejoins, where V divides
  const P = (u, side, f) => { const y = lerp(y0, yA, u), c = centre(y); return [c.x, y, c.z + side * spacing(u) * f]; };
  if (ty.n === 'III') { marks.split = P(0.26, 1, 0.7); marks.join = P(0.72, 1, 0.5); }
  if (ty.n === 'V') { marks.divide = P(0.74, 1, 0.8); }
  const tag = (txt, h, c, y) => { const sp = DK.textSprite(txt, { height: h, color: c, halo: null, weight: 650 }); sp.position.set(holder.position.x, holder.position.y + y, 0); row.add(sp); return sp; };
  tag(ty.n, 2.6, fig.dark ? '#F5F3EE' : '#0A0A08', -s.rootL - 2.6);
  tag(ty.p, 1.8, fig.dark ? '#9C978D' : '#6E6A62', -s.rootL - 5.0);
  clear.push(L.enamel, L.dentin, L.root);
  sets.push({ ty, tooth, holder, marks });
});

fig.part(row, { name: 'Eight types', label: false, info: 'Vertucci’s classification (1984, 2,400 cleared teeth): how the canals run from the pulp chamber to the apex.' });
sets.forEach(st => fig.part(st.tooth.group, { inPlace: true, name: `Type ${st.ty.n}`, sub: st.ty.p, label: false, info: `Type ${st.ty.n} (${st.ty.p}): ${st.ty.info}` }));
const on = (st, key) => { const o = new THREE.Object3D(); o.position.set(...st.marks[key]); st.tooth.group.add(o); return o; };
const S3 = sets[2], S5 = sets[4];
fig.part(on(S3, 'split'), { inPlace: true, name: 'Splits', anchor: [0, 0, 0], labelOffset: [-70, -30], dim: false, info: 'Here the single canal divides around a dentin island.' });
fig.part(on(S3, 'join'), { inPlace: true, name: 'Rejoins', anchor: [0, 0, 0], labelOffset: [-70, 30], dim: false, info: 'The two branches meet again and leave through one foramen.' });
fig.part(on(S5, 'divide'), { inPlace: true, name: 'Divides late', sub: 'two foramina', accent: true, anchor: [0, 0, 0], labelOffset: [80, 30], dim: false, info: 'A split in the apical third: a file that follows the main canal never enters the second branch.' });

fig.xray(clear, false);
fig.toggle('Cleared', false, v => fig.goTo({ xray: v ? 1 : 0 }, 0.6));
fig.standardControls({ explode: false });

// story: the eight premolars as they look → they clear and the dyed canals show → push in on types I to IV (one or two canals,
// joining) → slide to V to VIII (later splits, three canals) → back out: the eight patterns side by side
const X = i => sets[i].holder.position.x, Y = i => sets[i].holder.position.y - spec0.rootL * 0.45;
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.32, zoom: 1.0, xray: 0, labels: [], caption: 'Eight upper premolars that look alike.' },
  { dur: 2.4, hold: 1.8, theta: 0, phi: 1.5, xray: 1, labels: [], caption: 'Cleared and dyed, their canals tell them apart.' },
  { dur: 2.2, hold: 2.2, zoom: 0.62, focus: [(X(0) + X(3)) / 2, Y(0), 0], labels: ['Splits', 'Rejoins'], caption: 'One canal, two that join, one that splits and rejoins, two all the way.' },
  { dur: 2.4, hold: 2.4, zoom: 0.62, focus: [(X(4) + X(7)) / 2, Y(4), 0], labels: ['Divides late'], caption: 'Some divide late, some split twice, a few hold three.' },
  { dur: 2.2, hold: 2.6, theta: 0, phi: 1.52, zoom: 1.0, focus: 'auto', drift: 0, labels: [], caption: '' }
]);
fig.start();
