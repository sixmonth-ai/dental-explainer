// Furcation involvement on the lower left first molar (FDI 36 = Universal 19): Hamp Classes I, II and III side by side, seen from
// poster: end
// the buccal with the gum taken away and the buccal bone cut back, so both roots, the root trunk and the furcation show. The bone between the roots
// drops further by class and a probe enters horizontally from the buccal: under 3 mm (I), 3 mm or more but blind (II), through
// and through (III) (dental-facts.md §13, §17). Frame: each tooth +x = mesial, +z = buccal, y up, CEJ at y = 0; sets along x.
const CREST = -1.8;            // healthy crest, ~2 mm below the CEJ
const HORIZ = 1.6;             // general horizontal loss: the buccal crest sits just below the furcation entrance
const SPACE = 17;              // set spacing along x
const CUT = 1.6;               // the buccal plate is cut back to this z (mm buccal of the tooth centre)
const CLASSES = [
  { name: 'Class I', sub: 'probe enters under 3 mm', depth: 1.8, drop: 1.0, info: 'Hamp Class I: horizontal loss into the furcation of less than 3 mm; the bone between the roots is still nearly intact.' },
  { name: 'Class II', sub: '3 mm or more, not through', depth: 4.6, drop: 2.6, info: 'Hamp Class II: the probe goes in 3 mm or more but meets bone before the other side: a cul-de-sac.' },
  { name: 'Class III', sub: 'through and through', depth: 99, drop: 3.8, info: 'Hamp Class III: bone is gone right across the furcation, buccal to lingual. A Stage III complexity factor.' }
];
const { smooth, lerp } = DK.util;

const fig = DK.figure({
  fov: 30,
  title: 'Furcation classes',
  subtitle: 'Hamp classes, FDI 36 (Universal 19), seen from the buccal.',
  view: { theta: 0.3, phi: 1.4, margin: 0.9 }
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
  const xc = (i - 1) * SPACE;
  const t = DK.tooth(36), s = t.spec; t.group.position.x = xc;
  const through = c.depth > s.blC;
  const loss = DK.boneLoss({ horizontal: HORIZ,
    furcations: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, roots: s.roots, from: through ? 'through' : 'buccal', depth: c.depth, bottom: -(s.trunk + c.drop + CREST), width: 1.7 }] });
  const bone = DK.perioBone({ width: 15, height: 15.5, depth: 11.6, cortical: 1.2, crest: 1.4, loss, level: 1 }); bone.position.set(xc, CREST, 0);
  const crestAt = (x, z) => CREST + bone.crestAt(x, z);
  const gum = DK.perioGingiva(s, { margin: 0.8, crest: crestAt(0, 0) - 0.8, width: 15.6, depth: 13.4 }); gum.position.x = xc;
  gum.material.transparent = true;
  const pdl = DK.perioPdl(s, 0.22, r => Math.min(crestAt(r.x + r.ra + 0.2, 0), crestAt(r.x - r.ra - 0.2, 0)) + 0.2); t.group.add(pdl);
  const probe = furcationProbe();
  const pivot = new THREE.Group(); pivot.add(probe); fig.world.add(pivot);
  const yProbe = -(s.trunk + Math.min(0.75, c.drop * 0.5));                 // just under the furcation roof
  const tipIn = s.blC / 2 + 0.2 - Math.min(c.depth, s.blC + 0.6);          // z of the tip at full insertion
  return Object.assign({ t, s, bone, gum, pdl, pivot, probe, xc, yProbe, tipIn, through }, c);
});

// probes slide in from outside the buccal surface (param 0 = parked outside, 1 = fully in); gum fades away (param gum 1 → 0)
const P = { probe: 0 };
const place = () => sets.forEach(S => {
  const z = lerp(S.s.blC / 2 + 4, S.tipIn, P.probe);
  S.pivot.position.set(S.xc, S.yProbe, z); S.pivot.visible = P.probe > 0.02;
});
fig.param('probe', 1, v => { P.probe = v; place(); });
fig.param('gum', 0, v => sets.forEach(S => { S.gum.material.opacity = v; S.gum.material.depthWrite = v > 0.6; S.gum.visible = v > 0.02; }));

// ---------- parts
sets.forEach((S, i) => {
  fig.part(S.t.group, { name: S.name, label: false, info: 'Lower left first molar: mesial and distal roots joined by a root trunk about 3 mm long.' });
  fig.part(S.bone, { name: 'Bone', label: false, info: 'Alveolar bone, here also lost between the roots.' });
  fig.part(S.gum, { name: 'Gum', label: false, fit: false, info: 'Gum still covers the furcation in Classes I to III; it is taken away here to show the bone.' });
  fig.part(S.bone, { inPlace: true, name: S.name, sub: S.sub, anchor: (e, sec) => [0, -14.8, sec.enabled ? sec.offset + 0.1 : 5.8], labelOffset: [0, 40], accent: i === 2, dim: false, info: S.info });
  fig.part(S.probe, { inPlace: true, name: 'Probe', label: false, info: 'A curved furcation probe (schematic, 1 mm ticks) slid in horizontally from the cheek side.' });
});
const mid = sets[1];
fig.part(mid.t.layers.dentin, { inPlace: true, name: 'Root trunk', sub: 'CEJ to the furcation', anchor: (e, sec) => [-0.4, -mid.s.trunk / 2, sec.enabled ? sec.offset + 0.1 : mid.s.blC / 2 - 0.1], labelOffset: [-40, -120], dim: false, info: 'About 3 mm on a lower first molar. The shorter the trunk, the sooner bone loss reaches the furcation.' });
fig.part(sets[2].bone, { inPlace: true, name: 'Furcation', sub: 'open right through', anchor: (e, sec) => [0, -(sets[2].s.trunk + 1.6) - CREST, sec.enabled ? sec.offset + 0.1 : 3.0], labelOffset: [130, -120], when: (e, sec) => sec.enabled, dim: false, info: 'Between the roots the bone is gone from cheek side to tongue side: light shows through.' });

const pick = f => sets.map(f);
fig.enableSection([0, 0, 1], [
  { objects: pick(S => S.gum), color: DK.COLORS.gingivaCap },
  { objects: pick(S => S.bone.userData.layers.cortical), color: DK.COLORS.corticalCap },
  ...sets.map(S => ({ objects: [S.bone.userData.layers.cancellous], color: 0xffffff, texture: S.bone.userData.layers.cancellous.userData.capTexture })),
  { objects: pick(S => S.pdl), color: DK.COLORS.pdl },
  { objects: pick(S => S.t.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: [].concat(...sets.map(S => [S.t.layers.root, S.t.layers.dentin])), color: DK.COLORS.dentinCap },
  { objects: pick(S => S.t.layers.pulp), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut back', on: true, range: [-2, 7], offset: CUT } });
fig.view('Buccal', { section: true, offset: CUT, theta: 0.3, phi: 1.4, zoom: 1, focus: 'auto', set: { probe: 1, gum: 0 }, labels: ['Class I', 'Class II', 'Class III', 'Root trunk'] });
fig.view('From above', { section: false, theta: 0.25, phi: 0.75, zoom: 1, focus: 'auto', set: { probe: 0, gum: 0 }, labels: ['Class I', 'Class II', 'Class III'] });
fig.toggle('Gum', false, on => fig.goTo({ set: { gum: on ? 1 : 0 } }, 0.6));

// ---------- story: three molars in their gum → the gum is taken away: roots, trunk and furcations → probes slide in → Class III
// seen through → hero buccal view with all three classes
fig.story([
  { dur: 0, hold: 1.4, theta: 0.7, phi: 1.25, zoom: 1.0, section: false, set: { probe: 0, gum: 1 }, labels: [], caption: 'Three lower first molars with periodontitis.' },
  { dur: 2.0, hold: 0.6, theta: 0.45, phi: 1.32, set: { gum: 0 }, labels: [], caption: 'The gum is taken away to show the bone.' },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.4, hold: 1.6, offset: CUT, theta: 0.3, phi: 1.4, labels: ['Root trunk'], caption: 'The cheek-side bone is cut back: two roots, a short trunk, and bone lost between them.' },
  { dur: 2.6, hold: 2.4, set: { probe: 1 }, labels: ['Class I', 'Class II', 'Class III'], caption: 'A probe slid in from the cheek side reads how far the loss goes.' },
  { dur: 2.0, hold: 2.2, zoom: 0.5, theta: 0.12, phi: 1.45, focus: [SPACE, -4, 0], labels: ['Furcation'], caption: 'Class III: the probe passes right through.' },
  { dur: 2.2, hold: 2.6, focus: 'auto', zoom: fig.mode === 'image' ? 0.85 : 1, theta: 0.3, phi: 1.4, labels: ['Class I', 'Class II', 'Class III', 'Root trunk'] }
]);
fig.start();
