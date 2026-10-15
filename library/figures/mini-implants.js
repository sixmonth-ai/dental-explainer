// Comparison: a standard implant (Ø4.1 mm) in a normal lower ridge next to a one-piece mini implant (Ø2.4 mm, ball head) in a thin ridge, two CBCT-style cheek-to-tongue slices.
// poster: end
// One cut (removeToward +x) through both implant axes; camera on +x sees the slices side by side: standard on the viewer's left (+z), mini on the right (-z).
// Each ridge: cortical shell over cancellous bone, crest at y = 0, gum on top. Sizes in mm (dental-facts.md §7: "mini" means under 2.5 mm, ITI 2018).
const STD = { d: 4.1, L: 10, ridge: 8.2 };       // standard implant in a ridge about 8 mm wide
const MINI = { d: 2.4, L: 10, ridge: 5.2 };      // mini implant in a ridge about 5 mm wide
const Z = 7.6;                                   // the two slices sit at z = +Z (standard) and -Z (mini)
const RIDGE_H = 17, GUM = 2.4, DIM_Y = -5;       // ridge height, gum thickness over the crest, height of the width bars
const AREA = 5 * Math.round(20 * MINI.d / STD.d);     // bone-contact surface of the mini as % of the standard (same length: π·d·L)

const fig = DK.figure({
  fov: 28,
  title: 'Mini implant vs standard implant',
  subtitle: 'Lower jaw, cut cheek to tongue. Same length, different width.',
  view: { theta: Math.PI / 2 - 0.08, phi: 1.45 }
});
const { lerp } = DK.util;

// ---------- the two ridges (crest at y = 0) with gum over them ----------
const ridge = (w, z) => {
  const bone = DK.bone({ width: 7, height: RIDGE_H, depth: w, cortical: 1.1, crest: 1.6 }); bone.position.z = z;
  const gum = DK.gingiva({ width: 7, height: GUM + 2.2, depth: w + 1.0, crest: 1.6, material: 'mucosa' }); gum.position.set(0, GUM, z);
  return { bone, gum };
};
const A = ridge(STD.ridge, Z), B = ridge(MINI.ridge, -Z);
// bone width at a height (DK.bone walls narrow by up to 10 % toward the crest)
const widthAt = (w, y) => w * lerp(1, 0.9, Math.pow((y + RIDGE_H) / RIDGE_H, 2.5));

// ---------- the implants ----------
const titanium = DK.mat('titanium');
const std = new THREE.Group();
std.add(DK.implant({ diameter: STD.d, length: STD.L, connection: 'internal hex' }));
std.add(DK.lathe([[0, 0], [STD.d / 2, 0], [2.3, GUM - 0.2], [2.3, GUM + 1.2], [2.0, GUM + 1.4], [0, GUM + 1.4]], 48, titanium));   // healing abutment through the gum
const mini = new THREE.Group();
mini.add(DK.implant({ diameter: MINI.d, length: MINI.L, connection: 'conical', collar: 0.6 }));
// one piece: a polished collar through the gum, a square drive and a ball head that clips into the denture
const ball = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * i / 16; ball.push([1.1 * Math.cos(a), GUM + 2.6 + 1.1 * Math.sin(a)]); }
mini.add(DK.lathe([[0, -0.02], [MINI.d / 2, -0.02], [MINI.d / 2, GUM - 0.2], [1.5, GUM + 0.1], [1.5, GUM + 0.7], [0.75, GUM + 1.0], [0.75, GUM + 1.4]].concat(ball.slice(3)), 48, titanium));
std.position.z = Z; mini.position.z = -Z;
[std, mini].forEach(o => fig.world.add(o));

// ---------- width bars on the cut face ----------
const barMat = () => new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd8d3c8 : 0x3a3a36), toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
const bar = (w, z) => {
  const half = widthAt(w, DIM_Y) / 2, m = barMat(), g = new THREE.Group();
  [[[0, DIM_Y, z - half], [0, DIM_Y, z + half]], [[0, DIM_Y - 0.7, z - half], [0, DIM_Y + 0.7, z - half]], [[0, DIM_Y - 0.7, z + half], [0, DIM_Y + 0.7, z + half]]]
    .forEach(p => g.add(DK.ribbon(p, 0.16, [1, 0, 0], { material: m })));
  g.children.forEach(c => { c.renderOrder = 999; }); g.userData.mat = m; g.visible = false; fig.world.add(g); return g;
};
const barA = bar(STD.ridge, Z), barB = bar(MINI.ridge, -Z);

// ---------- parts ----------
const frame = new THREE.Mesh(new THREE.BoxGeometry(7, RIDGE_H + GUM + 5, 2 * Z + STD.ridge + 1), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.set(0, (GUM + 4.5 - RIDGE_H) / 2, (STD.ridge - MINI.ridge) / 4); fig.part(frame, { name: 'frame', label: false });
[A, B].forEach(r => { fig.part(r.bone, { name: 'Jaw bone', label: false, fit: false, info: 'Lower jaw ridge where teeth were lost: a cortical shell over spongy bone.' }); fig.part(r.gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the ridge.' }); });
fig.part(std, { inPlace: true, name: 'Standard implant', sub: `Ø${STD.d} mm`, anchor: [-2.3, GUM + 0.8, 0], labelOffset: [-110, -30], info: `A standard implant, about ${STD.d} mm wide. It needs about 2 mm of bone on each side, so a ridge of about 8 mm.` });
fig.part(mini, { inPlace: true, name: 'Mini implant', sub: `Ø${MINI.d} mm, one piece`, anchor: [0, GUM + 2.6, -1.1], labelOffset: [110, -30], accent: true, info: `Mini implants are under about 2.5 to 3 mm wide. They fit thin bone, but have about ${AREA}% of the bone contact of a ${STD.d} mm implant of the same length, so they carry less chewing load; under 2.5 mm they fail more often. Often used in groups of four to hold a lower denture.` });
const zx = sec => (sec.enabled ? sec.offset : 0) + 0.15;
fig.part(barA, { inPlace: true, name: 'Bone', sub: `about ${Math.round(STD.ridge)} mm wide`, anchor: (e, sec) => [zx(sec), DIM_Y, Z + widthAt(STD.ridge, DIM_Y) / 2], labelOffset: [-100, 50], dim: false, when: () => barA.visible, info: 'A normal ridge: room for a standard implant with about 2 mm of bone on each side.' });
fig.part(barB, { inPlace: true, name: 'Thin bone', sub: `about ${Math.round(MINI.ridge)} mm wide`, anchor: (e, sec) => [zx(sec), DIM_Y, -Z - widthAt(MINI.ridge, DIM_Y) / 2], labelOffset: [100, -10], dim: false, when: () => barB.visible, info: 'A thin ridge: a standard implant would leave almost no bone around it. A mini fits without a bone graft.' });
fig.part(mini.children[0], { inPlace: true, name: 'Less surface', sub: `about ${AREA}% of the standard`, anchor: [0.2, -8.5, -MINI.d / 2], labelOffset: [120, 40], dim: false, when: () => mini.visible && mini.position.y < 0.5, info: `Bone holds an implant over its surface. Same length, ${MINI.d} vs ${STD.d} mm wide: about ${AREA}% of the surface, so less load per implant.` });

// ---------- params: the implants thread in from above ----------
const thread = (g, k, lead) => { const t = (1 - k) * 14; g.visible = k > 0.001; g.position.y = t; g.rotation.y = -t / lead * Math.PI * 2; };
fig.param('std', 1, k => thread(std, k, 1.6));
fig.param('mini', 1, k => thread(mini, k, 1.2));
fig.param('bars', 0, k => { [barA, barB].forEach(b => { b.visible = k > 0.01; b.userData.mat.opacity = k; }); });
fig.onFrame(() => { const x = (fig.section.enabled ? fig.section.offset : 0) + 0.12; barA.position.x = barB.position.x = x; });

// ---------- section: one cheek-to-tongue cut through both implant axes ----------
const trab = A.bone.userData.layers.cancellous.userData.capTexture;
fig.enableSection([1, 0, 0], [
  { objects: [A.gum, B.gum], color: DK.COLORS.mucosaCap },
  { objects: [A.bone.userData.layers.cortical, B.bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [A.bone.userData.layers.cancellous, B.bone.userData.layers.cancellous], color: 0xffffff, texture: trab }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });
fig.setReadout([
  { k: 'Width', v: [{ v: `standard Ø${STD.d} mm` }, { v: `mini Ø${MINI.d} mm` }] },
  { k: 'Bone needed', v: [{ v: `about ${Math.round(STD.ridge)} mm` }, { v: `about ${Math.round(MINI.ridge)} mm`, cls: 'ok' }] },
  { k: 'Bone contact', v: [{ v: '100%' }, { v: `about ${AREA}%`, cls: 'warn' }] }
]);

// ---------- story: two ridges, the implants go in, the cut, the thin ridge, the normal ridge, both ----------
const ZK = fig.mode === 'image' ? 1 : 1.2;   // the interactive stage is shorter: push in less
const SIDE = { theta: Math.PI / 2 - 0.08, phi: 1.45 };
fig.story([
  { fov: 32, dur: 0, hold: 1.2, theta: Math.PI / 2 - 0.75, phi: 1.2, zoom: 1.05, section: false, set: { std: 0, mini: 0 }, labels: [], caption: 'Two lower jaw ridges: one normal, one thin.' },
  { dur: 2.4, hold: 0.6, set: { std: 1, mini: 1 }, labels: ['Standard implant', 'Mini implant'], caption: 'A standard implant and a mini implant go in.' },
  Object.assign({ fov: 28, dur: 2.2, hold: 0.1, labels: [] }, SIDE),
  { dur: 0, hold: 0, section: true, offset: 5 },
  { dur: 2.2, hold: 1.0, offset: 0, set: { bars: 1 }, labels: ['Bone', 'Thin bone'], caption: 'Cut from cheek to tongue.' },
  { dur: 2.0, hold: 2.2, zoom: 0.62 * ZK, focus: [0, -2.5, -Z], labels: ['Mini implant', 'Thin bone'], caption: 'The mini fits thin bone.' },
  { dur: 1.6, hold: 2.0, labels: ['Mini implant', 'Less surface'], caption: 'But it has less surface for bone to hold.' },
  { dur: 2.2, hold: 2.0, focus: [0, -2.5, Z], labels: ['Standard implant', 'Bone'], caption: 'A standard implant needs a wider ridge.' },
  Object.assign({ dur: 2.2, hold: 2.6, zoom: 0.88, focus: 'auto', labels: ['Standard implant', 'Mini implant', 'Bone', 'Thin bone', 'Less surface'] }, SIDE)
]);
fig.start();
