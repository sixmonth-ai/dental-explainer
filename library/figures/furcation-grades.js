// Furcation involvement on the lower left first molar (FDI 36 = Universal 19), Hamp Classes I, II and III side by side, each cut
// bucco-lingually through the furcation (between the mesial and distal roots) with a probe entering horizontally from the buccal:
// < 3 mm (Class I), ≥ 3 mm but blind (Class II), through and through (Class III) (dental-facts.md §13, §17).
// poster: end
// Frame: each tooth's own frame is +x = mesial, +z = buccal, y up, CEJ at y = 0; the three sets sit along z (Class I nearest +z).
// The cut removes the mesial half (+x), so the camera on the mesial side (theta = π/2) sees the slab with buccal on the left.
const CREST = -1.8;            // healthy crest, ~2 mm below the CEJ
const HORIZ = 1.2;             // a little general horizontal loss in every set
const SPACE = 18.5;            // set spacing along z
const CLASSES = [
  { name: 'Class I', sub: 'probe enters under 3 mm', depth: 1.8, info: 'Hamp Class I: horizontal loss into the furcation of less than 3 mm.' },
  { name: 'Class II', sub: '3 mm or more, not through', depth: 4.6, info: 'Hamp Class II: the probe goes in 3 mm or more but meets bone before the other side: a cul-de-sac.' },
  { name: 'Class III', sub: 'through and through', depth: 99, info: 'Hamp Class III: bone is gone right across the furcation, buccal to lingual. A Stage III complexity factor.' }
];
const { smooth, lerp } = DK.util;

const fig = DK.figure({
  fov: 28,
  title: 'Furcation classes',
  subtitle: 'Hamp classes, FDI 36 (Universal 19), probed from the buccal.',
  view: { theta: Math.PI / 2 - 0.12, phi: 1.42, margin: 1.0 }
});

// curved furcation probe (schematic, Nabers-like; local helper): tip at the origin, an 11 mm straight working end along +z with
// 1 mm ticks, then a quarter bend up into a vertical shank, so it can enter a furcation horizontally from the buccal
function furcationProbe() {
  const g = new THREE.Group(), steel = DK.mat('steel', { cap: 0x9ea4aa }), ink = DK.mat('steel', { color: 0x1d1b18, metalness: 0.2, roughness: 0.7 });
  const pts = [], R = 3, L = 11;
  for (let i = 0; i <= 22; i++) pts.push([0, 0, L * i / 22]);
  for (let i = 1; i <= 16; i++) { const a = Math.PI / 2 * i / 16; pts.push([0, R - R * Math.cos(a), L + R * Math.sin(a)]); }
  for (let i = 1; i <= 10; i++) pts.push([0, R + 7 * i / 10, L + R]);
  g.add(DK.tube(pts, 0.25, steel, { caps: true, taper: t => 0.75 + 0.25 * Math.min(1, t * 6) }));
  for (let k = 1; k < L; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, k % 3 === 0 ? 0.5 : 0.14, 18), ink); r.rotation.x = Math.PI / 2; r.position.z = k; g.add(r); }
  const handle = DK.lathe([[0, 0], [0.5, 0.8], [0.6, 5], [0.45, 5.6]], 24, steel); handle.position.set(0, R + 7, L + R); g.add(handle);
  return g;
}
const sets = CLASSES.map((c, i) => {
  const zc = (1 - i) * SPACE;                                                // Class I at +z, Class III at -z
  const t = DK.tooth(36), s = t.spec; t.group.position.z = zc;
  const through = c.depth > s.blC;
  const loss = DK.boneLoss({ horizontal: HORIZ,
    furcations: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, roots: s.roots, from: through ? 'through' : 'buccal', depth: c.depth, bottom: -(s.trunk + 3.4 + CREST), width: 1.8 }] });
  const bone = DK.perioBone({ width: 15, height: 12, depth: 12.6, cortical: 1.2, crest: 1.4, loss, level: 1 }); bone.position.set(0, CREST, zc);
  const crestAt = (x, z) => CREST + bone.crestAt(x, z);
  const deepest = crestAt(0, 0) - 0.2;
  const gum = DK.perioGingiva(s, { margin: 0.8, crest: Math.min(deepest, crestAt(0, s.blC / 2 - 0.5)) - 0.6, width: 15.6, depth: 13.4 }); gum.position.z = zc;
  const pdl = DK.perioPdl(s, 0.22, r => Math.min(crestAt(r.x + r.ra + 0.2, 0), crestAt(r.x - r.ra - 0.2, 0), crestAt(r.x, 0)) + 0.2); t.group.add(pdl);
  // probe: horizontal, entering from the buccal at mid-furcation height; tip at its origin, working end turned toward +z
  const probe = furcationProbe();
  const pivot = new THREE.Group(); pivot.add(probe); fig.world.add(pivot);
  const yProbe = -(s.trunk + 1.1);
  const tipIn = s.blC / 2 + 0.1 - Math.min(c.depth, s.blC + 0.5);            // z of the tip at full insertion (tooth frame)
  return Object.assign({ t, s, bone, gum, pdl, pivot, probe, zc, yProbe, tipIn, through }, c);
});

// probes ride in front of the cut face and slide in from outside the buccal surface (param 0 = parked outside, 1 = fully in)
const cutX = () => (fig.section && fig.section.enabled ? fig.section.offset : 0) + 0.32;
const P = { probe: 0 };
const place = () => sets.forEach(S => {
  const z0 = S.s.blC / 2 + 3.5, z = lerp(z0, S.tipIn, P.probe);
  S.pivot.position.set(cutX(), S.yProbe, S.zc + z); S.pivot.visible = P.probe > 0.02;
});
fig.param('probe', 1, v => { P.probe = v; place(); });

// ---------- parts
sets.forEach((S, i) => {
  fig.part(S.t.group, { name: S.name, label: false, info: 'Lower left first molar: mesial and distal roots joined by a root trunk about 3 mm long.' });
  fig.part(S.bone, { name: 'Bone', label: false, fit: i === 1, info: 'Alveolar bone, here also lost between the roots.' });
  fig.part(S.gum, { name: 'Gum', label: false, fit: false, info: 'Gum still covers the furcation in Classes I to III.' });
  fig.part(S.bone, { inPlace: true, name: S.name, sub: S.sub, anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1, -11.3, 0], labelOffset: [0, 46], accent: i === 2, dim: false, info: S.info });
  fig.part(S.probe, { inPlace: true, name: 'Probe', label: false, info: 'A curved furcation probe (schematic, 1 mm ticks) slid in horizontally from the cheek side.' });
});
const mid = sets[1];
fig.part(mid.t.layers.dentin, { inPlace: true, name: 'Root trunk', sub: 'about 3 mm', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1, -mid.s.trunk / 2, -mid.s.blC / 2 + 0.6], labelOffset: [70, 40], when: (e, sec) => sec.enabled, dim: false, info: 'CEJ to the furcation entrance. The shorter the trunk, the sooner bone loss reaches the furcation.' });

// ---------- section: bucco-lingual through the furcation of all three (removes the mesial half)
const pick = (f) => sets.map(f);
fig.enableSection([1, 0, 0], [
  { objects: pick(S => S.gum), color: DK.COLORS.gingivaCap },
  { objects: pick(S => S.bone.userData.layers.cortical), color: DK.COLORS.corticalCap },
  ...sets.map(S => ({ objects: [S.bone.userData.layers.cancellous], color: 0xffffff, texture: S.bone.userData.layers.cancellous.userData.capTexture })),
  { objects: pick(S => S.pdl), color: DK.COLORS.pdl },
  { objects: pick(S => S.t.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: [].concat(...sets.map(S => [S.t.layers.root, S.t.layers.dentin])), color: DK.COLORS.dentinCap },
  { objects: pick(S => S.t.layers.pulp), color: DK.COLORS.pulpCap }
]);
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged && secChanged(); place(); };
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: -0.25 } });
fig.view('Probe', { section: true, offset: -0.25, theta: Math.PI / 2 - 0.12, phi: 1.42, zoom: 1, focus: 'auto', set: { probe: 1 }, labels: ['Class I', 'Class II', 'Class III'] });

// ---------- story: three molars → turn to the mesial side, the cut sweeps in through the furcation → probes slide in and read the class
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.25, zoom: 1.0, section: false, set: { probe: 0 }, labels: [], caption: 'Three lower first molars with bone lost between their roots.' },
  { dur: 2.6, hold: 0.2, theta: Math.PI / 2 - 0.12, phi: 1.42, zoom: 1, focus: 'auto', labels: [] },
  { dur: 0, hold: 0, section: true, offset: 9 },
  { dur: 2.2, hold: 1.4, offset: -0.25, labels: ['Root trunk'], caption: 'A cut through the furcation, from cheek side to tongue side.' },
  { dur: 2.6, hold: 2.6, set: { probe: 1 }, labels: ['Class I', 'Class II', 'Class III'], caption: 'A probe slid in from the cheek side reads how far the loss goes.' },
  { dur: 2.0, hold: 2.2, zoom: 0.5, focus: [0, -3, 0], labels: ['Class II'], caption: 'Class II: the probe goes in 3 mm or more, then meets bone.' },
  { dur: 2.0, hold: 2.4, focus: 'auto', zoom: fig.mode === 'image' ? 0.88 : 1, theta: Math.PI / 2 - 0.1, phi: 1.44, labels: ['Class I', 'Class II', 'Class III', 'Root trunk'] }
]);
fig.start();
