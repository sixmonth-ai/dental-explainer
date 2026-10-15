// Library: two mandibular left second molars (FDI 37 = Universal 18), crown up, side by side: the usual tooth with two roots (mesial and distal) and three canals, and the variant whose roots are fused on the buccal side into one root with a deep lingual groove, holding one C-shaped canal. Both are sliced horizontally across the roots like a CBCT axial view. Tooth frame: CEJ at y = 0, +x mesial, +z buccal; the teeth sit along world x.
// poster: end
// Teaching point: when the roots of a lower second molar fuse, the canals can join into one C-shaped ribbon (17.3% pooled worldwide, 39.6% in East Asian samples), which needs a different search, cleaning and filling than three round canals.
const fig = DK.figure({
  fov: 30,
  title: 'C-shaped canal',
  subtitle: 'Lower second molar, FDI 37 (Universal 18), crown up.',
  view: { theta: 0.5, phi: 1.32 }
});
const { lerp, smooth, clamp } = DK.util;

const base = DK.toothPreset(37), GAP = 4.5, X = base.md / 2 + GAP / 2;
const uSpec = DK.toothPreset(37); uSpec.roots = uSpec.roots.map(r => Object.assign({}, r, { apex: [r.apex[0] * 0.6, r.apex[1]] })); uSpec.canals = uSpec.canals.map(c => Object.assign({}, c, { short: 0.6 }));   // a gentler apical curve keeps the canals inside the roots
const usual = DK.tooth(uSpec);
// the fused root: one root on the whole cervical outline, a deep longitudinal groove on the lingual (th = -pi/2) and a shallow
// fusion line on the buccal (th = +pi/2)
const cSpec = Object.assign({}, DK.toothPreset(37), { trunk: 0,
  roots: [{ x: 0, z: 0, len: 13, ra: 4, rb: 4.5, taper: 0.55, apex: [-1.2, 0], concave: [{ ang: -Math.PI / 2, depth: 0.42, w: 0.42 }, { ang: Math.PI / 2, depth: 0.08, w: 0.35 }] }],
  canals: [{ root: 0, dx: 0, dz: 0, r: 0.4 }] });
const cTooth = DK.tooth(cSpec);
usual.group.position.x = -X; cTooth.group.position.x = X;
const LU = usual.layers, LC = cTooth.layers, sC = cTooth.spec, RC = sC.roots[0];
LC.pulp.children.forEach(m => { if (m !== LC.pulp.userData.chamber) m.visible = false; });

// the C-shaped canal: a thick arc wrapped round the tip of the lingual groove, open to the lingual, from the chamber floor to near the apex
const rootR = u => (1 - 0.55 * Math.pow(u, 0.85));             // the root's taper (same law as the kit's root rings)
function cCanal() {
  const ROWS = 60, HALF = 26, COLS = HALF * 2 + 12, y0 = -0.6, yA = -RC.len + 0.9, A0 = 1.95;
  const ring = u => {
    const y = lerp(y0, yA, u), c = DK.canalAt(sC, 0, y), k = rootR(clamp(-y / RC.len, 0, 1));
    const rb = RC.rb * k, cz = c.z - rb * 0.3, Rc = rb * 0.5, th = lerp(0.36, 0.18, u) * (1 - 0.6 * smooth(0.85, 1, u));
    const out = [];
    for (let j = 0; j <= HALF; j++) { const a = -A0 + 2 * A0 * j / HALF; out.push([c.x + (Rc + th) * Math.sin(a), y, cz + (Rc + th) * Math.cos(a)]); }   // outer arc, mesial end to distal end
    for (let j = 1; j < 6; j++) { const t = Math.PI * j / 6, a = A0, e = [Math.sin(a), Math.cos(a)], n = [Math.cos(a), -Math.sin(a)];   // rounded end
      out.push([c.x + Rc * e[0] + th * (Math.cos(t) * e[0] + Math.sin(t) * n[0]), y, cz + Rc * e[1] + th * (Math.cos(t) * e[1] + Math.sin(t) * n[1])]); }
    for (let j = HALF; j >= 0; j--) { const a = -A0 + 2 * A0 * j / HALF; out.push([c.x + (Rc - th) * Math.sin(a), y, cz + (Rc - th) * Math.cos(a)]); }   // inner arc back
    for (let j = 1; j < 6; j++) { const t = Math.PI * j / 6, a = -A0, e = [Math.sin(a), Math.cos(a)], n = [-Math.cos(a), Math.sin(a)];
      out.push([c.x + Rc * e[0] + th * (-Math.cos(t) * e[0] + Math.sin(t) * n[0]), y, cz + Rc * e[1] + th * (-Math.cos(t) * e[1] + Math.sin(t) * n[1])]); }
    return out;
  };
  const rings = []; for (let i = 0; i <= ROWS; i++) rings.push(ring(i / ROWS));
  const N = rings[0].length;
  const cen = r => { const s = [0, 0, 0]; r.forEach(p => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return s.map(v => v / r.length); };
  return DK.gridGeometry(ROWS, N, (i, j) => rings[ROWS - i][j], cen(rings[0]), cen(rings[ROWS]));
}
const cMesh = new THREE.Mesh(cCanal(), cTooth.mats.pulp);
cTooth.group.add(cMesh);
[usual, cTooth].forEach(t => t.group.updateMatrixWorld(true));

const NARROW = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) !== 'image' && window.innerWidth < 640;   // phones: the two teeth side by side need a wider frame
const ZW = NARROW ? 0.92 : 0.62;
const CUT = -4.5;   // the axial slice, in the coronal half of the roots
fig.part(usual.group, { name: 'Usual', sub: 'two roots, three canals', anchor: (e, sec) => [sec.enabled ? -2.0 : 0, sec.enabled ? Math.min(base.crownL + 1, sec.offset) : base.crownL + 1, sec.enabled ? -2.2 : 0], labelOffset: [-40, -60], dim: false,
  info: 'Lower left second molar (Universal 18) as usual: a mesial and a distal root, with three canals (mesiobuccal, mesiolingual, distal).' });
fig.part(cTooth.group, { name: 'C-shaped', sub: 'roots fused', anchor: (e, sec) => [sec.enabled ? 2.4 : 0, sec.enabled ? Math.min(base.crownL + 1, sec.offset) : base.crownL + 1, sec.enabled ? -1.6 : 0], labelOffset: [60, -90], dim: false,
  info: 'The same tooth with its roots fused on the buccal side. It is more common in lower second molars than in any other tooth: about 17% worldwide in a 2025 CBCT meta-analysis, and about 40% in East Asian samples.' });
const grooveY = -6.5, gc = DK.canalAt(sC, 0, grooveY), grooveMark = new THREE.Object3D();
grooveMark.position.set(gc.x, grooveY, gc.z - RC.rb * rootR(6.5 / 13) * 0.62); cTooth.group.add(grooveMark);
fig.part(grooveMark, { inPlace: true, name: 'Lingual groove', anchor: [0, 0, 0], labelOffset: [70, 30], dim: false, when: (e, sec) => !sec.enabled,
  info: 'Where the roots fail to separate, a deep groove runs down the lingual side of the single root; the canal wraps around it.' });
const cc = DK.canalAt(sC, 0, CUT), kk = rootR(-CUT / RC.len), cBuccal = new THREE.Object3D();
cBuccal.position.set(cc.x + 0.6, CUT + 0.05, cc.z - RC.rb * kk * 0.3 + RC.rb * kk * 0.5); cTooth.group.add(cBuccal);
fig.part(cBuccal, { inPlace: true, name: 'C-shaped canal', sub: 'one ribbon, open lingually', anchor: [0, 0, 0], labelOffset: [110, 50], accent: true, dim: false,
  when: (e, sec) => sec.enabled && sec.offset < -1,
  info: 'Instead of separate round canals, one continuous ribbon curves around the groove. Files leave its fins untouched, so cleaning relies on irrigation, and the thin dentin toward the groove is easy to perforate.' });
const mb = DK.canalAt(usual.spec, 'MB', CUT), uMark = new THREE.Object3D(); uMark.position.set(mb.x, CUT + 0.05, mb.z); usual.group.add(uMark);
fig.part(uMark, { inPlace: true, name: 'Three canals', anchor: [0, 0, 0], labelOffset: [-90, -40], dim: false,
  when: (e, sec) => sec.enabled && sec.offset < -1, info: 'The usual pattern: two canals in the mesial root and one in the distal root.' });

// orientation words on the slice, as on a CBCT view; shown only from above
const word = (txt, x, z, h = 0.75) => { const sp = DK.textSprite(txt, { height: h, color: fig.dark ? '#9C978D' : '#6E6A62', halo: null, weight: 600 }); sp.position.set(x, CUT + 0.1, z); fig.world.add(sp); return sp; };
const words = [word('Buccal', 0, 6.4), word('Lingual', 0, -6.6)];
fig.onFrame(() => { const on = !!(fig.section && fig.section.enabled && fig.section.offset < -1 && fig.orbit.phi < 0.45); words.forEach(w => { w.visible = on; }); });

fig.enableSection([0, 1, 0], [
  { objects: [LU.enamel, LC.enamel], color: DK.COLORS.enamelCap },
  { objects: [LU.root, LU.dentin, LC.root, LC.dentin], color: DK.COLORS.dentinCap },
  { objects: [LU.pulp, LC.pulp.userData.chamber], color: DK.COLORS.pulpCap },
  { objects: [cMesh], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Slice', on: false, range: [-11, 9], offset: CUT } });
fig.view('Lingual', { theta: Math.PI, phi: 1.45, zoom: 1, focus: 'auto', section: false, labels: ['Usual', 'C-shaped', 'Lingual groove'] });
fig.view('Slice', { theta: 0, phi: 0.3, zoom: ZW, focus: [0, CUT, 0], section: true, offset: CUT, labels: ['Three canals', 'C-shaped canal'] });

// story: two lower second molars → turn to the tongue side: two roots vs one fused root with a groove → rise above them → the slice
// sweeps down into the roots → push in on the C → hero: straight down on the slice, both teeth
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.45, phi: 1.34, zoom: 1.05, section: false, labels: ['Usual', 'C-shaped'], caption: 'Two lower second molars.' },
  { fov: 30, dur: 2.6, hold: 2.2, theta: Math.PI - 0.15, phi: 1.45, zoom: 1.0, labels: ['Lingual groove'], caption: 'From the tongue side: two roots, and two roots fused into one.' },
  { dur: 2.4, hold: 0.2, theta: 0.3, phi: 0.62, zoom: 0.85, focus: [0, -1, 0], labels: [] },
  { dur: 0, hold: 0, section: true, offset: 10 },
  { fov: 28, dur: 2.6, hold: 1.0, offset: CUT, zoom: NARROW ? 1.2 : 0.72, focus: [0, CUT, 0], labels: ['Three canals'], caption: 'Slice across the roots, like a CBCT image.' },
  { dur: 2.2, hold: 2.4, zoom: NARROW ? 0.6 : 0.48, focus: [X, CUT, -0.5], labels: ['C-shaped canal'], caption: 'One C-shaped canal wrapped round the groove.' },
  { fov: 26, dur: 2.4, hold: 2.6, theta: 0.0, phi: 0.3, zoom: ZW, focus: [0, CUT, -0.2], drift: 0, labels: ['Usual', 'C-shaped', 'Three canals', 'C-shaped canal'], caption: '' }
]);
fig.start();
