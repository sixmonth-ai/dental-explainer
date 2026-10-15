// Comparison: the four Winter angulations of an impacted lower left third molar (FDI 38 = Universal 17) against 37, four jaws in a 2 × 2 grid cut by one mesio-distal section; each 38 carries its long axis, each 37 its own, so the angle reads directly. Frame per jaw: +x mesial (mirrored for the left side), y up, 37 CEJ at y = 0.
// poster: end
const CREST = -1.8, CANAL_Y = -17.5, CANAL_R = 1.4;
const COL = 44, ROW = 40;                         // spacing (mm) between the jaws
const ROWLAYOUT = typeof window === 'undefined' || window.DK_MODE === 'image' || window.innerWidth >= 700;   // one row on wide stages, 2 × 2 on phones
const SETS = [
  { key: 'Vertical', angle: 0, depth: 'B', pct: 26, at: [0, 0], sub: 'about 26% of impactions', info: 'Long axis roughly parallel to 37 (within about 10°). About a quarter of impacted lower third molars (Carter & Worthington 2016).' },
  { key: 'Mesioangular', angle: 45, depth: 'B', pct: 41, at: [1, 0], sub: 'most common, about 41%', info: 'Crown tilted forward against 37 (11 to 79°). The most common impaction, about 41%. Usually the more straightforward to remove of the angled impactions.' },
  { key: 'Horizontal', angle: 90, depth: 10, pct: 11, at: [0, 1], sub: 'about 11%', info: 'Lying on its side, crown against the root of 37 (80 to 100°). About 11%. The crown usually has to be cut off before the tooth can come out.' },
  { key: 'Distoangular', angle: -35, depth: 'B', pct: 12, at: [1, 1], sub: 'hardest to remove, about 12%', info: 'Crown tilted back toward the ramus (−11 to −79°). About 12%. The hardest lower angulation to remove: it comes out toward the ramus, so more bone has to be taken.' }
];

const fig = DK.figure({
  fov: 28,
  title: 'Wisdom tooth positions',
  subtitle: 'Lower left third molar, FDI 38 (Universal 17), mesio-distal cut. Third molars vary.',
  view: { theta: 0, phi: 1.5, margin: ROWLAYOUT ? 0.58 : 0.8 }
});

const ink = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xa8a296 : 0x6d675d), toneMapped: false });
const hot = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });
const axisLine = (y0, y1, mat, r) => { const t = DK.tube([[0, y0, 0.45], [0, y1, 0.45]], r, mat, { caps: true, segments: 4, radial: 10 }); t.userData.noShadow = true; return t; };

const G = { cortical: [], cancellous: [], lumen: [], nerve: [], gum: [], enamel: [], dentin: [], pulp: [] };
const jaws = SETS.map((S, i) => {
  const quad = new THREE.Group(); quad.scale.x = -1;          // left side: mesial toward the viewer's left
  if (ROWLAYOUT) quad.position.set((i - 1.5) * COL - 10, 0, 0); else quad.position.set(S.at[0] * COL - COL / 2 - 10, -S.at[1] * ROW + ROW / 2, 0);
  const t37 = DK.tooth(37);
  const imp = DK.impaction({ fdi: 38, neighbour: 37, angle: S.angle, depth: S.depth }), t38 = imp.tooth;
  const bone = DK.bone({ width: 38, height: 24, depth: 11.5, cortical: 1.2, crest: 1.6 });
  bone.position.set(-11, CREST, 0);
  const path = [[-29, CANAL_Y - 0.6, 0.5], [-16, CANAL_Y - 0.1, 0.3], [-2, CANAL_Y + 0.4, 0], [7.5, CANAL_Y + 0.9, -0.2]];
  const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
  const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.7, DK.mat('nerve'), { caps: false });
  const canal = new THREE.Group(); canal.add(lumen, nerve);
  const gum = DK.gingiva({ width: 38, height: 3.4, depth: 12, crest: 1.4, around: [{ x: 11, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
  gum.position.set(-11, 1.1, 0);
  // long axes: 37 in quiet ink, 38 in the accent (Winter's angle is the angle between them)
  t37.group.add(axisLine(-14, 11, ink, 0.16));
  imp.group.add(axisLine(-12.5, 10.5, hot, 0.22));
  quad.add(bone, canal, gum, t37.group, imp.group);
  G.cortical.push(bone.userData.layers.cortical); G.cancellous.push(bone.userData.layers.cancellous);
  G.lumen.push(lumen); G.nerve.push(nerve); G.gum.push(gum);
  G.enamel.push(t37.layers.enamel, t38.layers.enamel); G.dentin.push(t37.layers.root, t37.layers.dentin, t38.layers.root, t38.layers.dentin); G.pulp.push(t37.layers.pulp, t38.layers.pulp);

  fig.part(quad, { name: S.key, label: false, info: '' });
  fig.part(t38.group, { inPlace: true, name: S.key, sub: S.sub, anchor: [0, t38.spec.crownL + 0.5, 0.5], labelOffset: i === 2 ? [70, -80] : [0, -70], accent: i === 3, dim: false, info: 'Lower left third molar (FDI 38, Universal 17). ' + S.info });
  fig.part(t37.group, { inPlace: true, name: '37 ' + S.key, label: false, info: 'Lower left second molar (FDI 37, Universal 18). Winter\'s angle is measured from its long axis.' });
  fig.part(bone, { inPlace: true, name: 'Bone ' + S.key, label: false, info: 'Mandibular body; the ramus rises just behind the third molar.' });
  fig.part(gum, { inPlace: true, name: 'Gum ' + S.key, label: false, info: 'Gingiva over the ridge; a partly erupted third molar is often covered by a flap of it.' });
  if (i === 2) fig.part(canal, { inPlace: true, name: 'Nerve canal', sub: 'inferior alveolar', anchor: [-22, CANAL_Y - 1.2, 0.4], labelOffset: [-20, 60], info: 'Inferior alveolar canal: the nerve to the lower teeth, lip and chin. How close the roots come to it is what the X-ray or CBCT is checked for before removal.' });
  else fig.part(canal, { inPlace: true, name: 'Canal ' + S.key, label: false, info: 'Inferior alveolar canal, carrying the nerve to the lower teeth, lip and chin.' });
  return { quad, imp, t38 };
});

fig.enableSection([0, 0, 1], [
  { objects: G.cortical, color: DK.COLORS.corticalCap },
  { objects: G.cancellous, color: 0xffffff, texture: G.cancellous[0].userData.capTexture },
  { objects: G.lumen, color: 0xf0dcc4 }, { objects: G.nerve, color: DK.COLORS.nerve },
  { objects: G.gum, color: DK.COLORS.gingivaCap },
  { objects: G.enamel, color: DK.COLORS.enamelCap },
  { objects: G.dentin, color: DK.COLORS.dentinCap },
  { objects: G.pulp, color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-5, 5], offset: 0 } });

const names = SETS.map(S => S.key);
const focusOf = i => { const q = jaws[i].quad.position; return [q.x + 12, q.y - 2, 0]; };
fig.view('Mesioangular', { theta: 0.06, phi: 1.5, zoom: 0.5, focus: focusOf(1), labels: ['Mesioangular'] });
fig.view('Distoangular', { theta: -0.06, phi: 1.5, zoom: 0.5, focus: focusOf(3), labels: ['Distoangular'] });

fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.22, zoom: 1.04, fov: 34, section: false, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 1.4, theta: 0, phi: 1.5, zoom: 1, fov: 28, offset: 0, labels: names },
  { dur: 2.2, hold: 2.0, zoom: 0.52, focus: focusOf(1), theta: 0.08, labels: ['Mesioangular'] },
  { dur: 2.2, hold: 2.0, focus: focusOf(2), theta: -0.06, labels: ['Horizontal', 'Nerve canal'] },
  { dur: 2.0, hold: 2.0, focus: focusOf(3), theta: 0.06, labels: ['Distoangular'] },
  { dur: 2.4, hold: 2.4, zoom: 1, focus: 'auto', theta: 0, phi: 1.5, drift: 0, labels: names }
]);
fig.start();
