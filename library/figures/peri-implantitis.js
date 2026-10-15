// Library: a healthy implant (viewer's left) next to the same implant with peri-implantitis (right), replacing the lower left first molar
// poster: end
// (FDI 36), cut by one mesio-distal section through both implant axes.
// The story lets the disease happen on the right: the gum swells and reddens and the bone melts away in a crater (saucer) around the
// implant, baring its threads. Frame: +x = mesial, +z = buccal, y up, implant platform at the crest (y = CREST), mm.
const CREST = -1.8, GUM_Y = 1.1;
const IMPLANT = { diameter: 4.1, length: 10 };
const ABUT = { platform: 4.1, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 };
const CRATER = { depth: 5.0, r: 4.8 };             // schematic circumferential defect: deepest at the implant, back to the crest 4.8 mm out
const GAP = 17, HX = -GAP / 2, DX = GAP / 2;       // healthy set (left), disease set (right)
const BONE = { width: 13, height: 15, depth: 11, cortical: 1.2, crest: 1.6 };

const fig = DK.figure({
  fov: 26,
  title: 'Peri-implantitis',
  subtitle: 'Implant replacing 36 (FDI), healthy and diseased. Mesio-distal cut.',
  view: { theta: 0, phi: 1.48, margin: 0.84 }
});

// ---------------- one set ----------------
const set = (x, loss) => {
  const bone = DK.perioBone(Object.assign({ loss, level: 0 }, BONE)); bone.position.set(x, CREST, 0);
  const gum = DK.gingiva({ width: BONE.width, height: 3.4, depth: BONE.depth + 0.6, crest: 1.4, around: [{ x: 0, z: 0, md: ABUT.emergence, bl: ABUT.emergence, rise: 0.6 }] });
  gum.position.set(x, GUM_Y, 0);
  // soft tissue that fills a defect: a cut-only column under the gum; bone, painted after it on the cut, covers what it still has
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(CRATER.r + 0.2, CRATER.r + 0.2, CRATER.depth + 1.0, 48), DK.mat('gingiva'));
  fill.position.set(x, CREST + 0.5 - (CRATER.depth + 1.0) / 2, 0); fill.userData.cutOnly = true; fig.world.add(fill); gum.userData.fill = fill;
  const site = new THREE.Group(); site.position.x = x;
  const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); implant.position.y = CREST;
  const abut = DK.abutment(ABUT); abut.position.y = CREST;
  const crown = DK.restorationCrown(36, 'zirconia', { hollow: false }); crown.position.y = 0.2;
  site.add(implant, abut, crown);
  return { bone, gum, site, implant, crown };
};
const H = set(HX, {});
const D = set(DX, { defects: [{ x: 0, z: 0, depth: CRATER.depth, rx: CRATER.r, rz: CRATER.r, profile: 'crater' }] });

// the disease as one number: 0 = healthy, 1 = the full crater and an inflamed, swollen margin
const cH = DK.color(DK.COLORS.gingiva), cI = DK.color(DK.COLORS.gingivaInflamed), cHc = DK.color(DK.COLORS.gingivaCap), cIc = DK.color(DK.COLORS.gingivaInflamedCap);
const gumMat = D.gum.material.clone(); D.gum.material = gumMat;
let capIndex = -1, sick = 0;
fig.param('disease', 0, k => {
  sick = k; D.bone.set(k);
  gumMat.color.copy(cH).lerp(cI, k);
  D.gum.scale.y = 1; D.gum.position.y = GUM_Y + 0.5 * k;            // the margin swells
  if (capIndex >= 0) [capIndex, capIndex + 2].forEach(i => { const c = fig.section.caps[i]; if (c) c.material.uniforms.uColor.value.copy(cHc).lerp(cIc, k); });
});

// bone level at the implant surface, from the same height field
const R = IMPLANT.diameter / 2;
const lossAt = k => -k * D.bone.userData.loss(R + 0.1, 0);
const LOSS = -D.bone.userData.loss(R + 0.1, 0);

// ---------------- parts ----------------
const onCut = (e, sec) => sec.enabled;
const cz = sec => (sec.enabled ? sec.offset : 0) + 0.1;
[H, D].forEach((S, i) => {
  fig.part(S.bone, { name: i ? 'Bone ' : 'Bone', label: false, fit: false, info: 'Jaw bone around the implant.' });
  fig.part(S.gum, { name: i ? 'Gum ' : 'Gum', label: false, fit: false, info: i ? 'Inflamed gum around the implant: red, swollen, bleeds when probed.' : 'Healthy gum sealing around the abutment.' });
});
fig.part(H.site, { name: 'Healthy', anchor: [0, 7.6, 0], dim: false, info: 'Bone up to the implant shoulder, firm pink gum sealing around the abutment.' });
fig.part(D.site, { name: 'Peri-implantitis', anchor: [0, 7.6, 0], dim: false, info: 'Infection around an implant: inflamed gum and progressive loss of the bone that holds it. It does not heal by itself.' });
fig.part(H.bone, { inPlace: true, name: 'Bone to the shoulder', dim: false, when: onCut,
  anchor: (e, sec) => [R + 1.0, -0.6, cz(sec)], labelOffset: [-200, -40], info: 'In health the bone reaches the top of the implant and holds every thread.' });
fig.part(D.bone, { inPlace: true, name: 'Bone crater', sub: 'around the threads', accent: true, dim: false, when: (e, sec) => sec.enabled && sick > 0.4,
  anchor: (e, sec) => [R + 1.6, D.bone.crestAt(R + 1.6, 0) - 0.6, cz(sec)], labelOffset: [230, 90],
  info: 'Peri-implantitis destroys bone all around the implant in a saucer or crater shape. Lost bone does not grow back on its own.' });
fig.part(D.implant, { inPlace: true, name: 'Exposed threads', dim: false, when: () => sick > 0.4, anchor: [R - 0.1, -2.6, 0.8], labelOffset: [250, -30],
  info: 'Threads that lost their bone carry a rough surface where plaque bacteria stick, which keeps the infection going.' });
fig.part(D.gum, { inPlace: true, name: 'Inflamed gum', dim: false, when: (e, sec) => sec.enabled && sick > 0.4,
  anchor: (e, sec) => [5.6, -0.9, cz(sec)], labelOffset: [150, -120], info: 'Red, swollen mucosa that bleeds on probing, often with pus. Inflammation alone, without bone loss, is peri-implant mucositis, which can still reverse.' });

// ---------------- section ----------------
fig.enableSection([0, 0, 1], [
  { objects: [H.gum], color: DK.COLORS.gingivaCap },
  { objects: [D.gum], color: DK.COLORS.gingivaCap },
  { objects: [H.gum.userData.fill], color: DK.COLORS.gingivaCap },
  { objects: [D.gum.userData.fill], color: DK.COLORS.gingivaCap },
  { objects: [H.bone.userData.layers.cortical, D.bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [H.bone.userData.layers.cancellous, D.bone.userData.layers.cancellous], color: 0xffffff, texture: H.bone.userData.layers.cancellous.userData.capTexture },
  { objects: [H.crown, D.crown], color: DK.COLORS.zirconiaCap }
]);
capIndex = 1;
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
fig.slider('Disease', 0, 1, 0.01, 0, v => fig.goTo({ set: { disease: v } }, 0.2));
fig.setReadout([{ k: 'Bone level at the implant', v: [{ v: 'healthy: at the shoulder ✓', cls: 'ok' }, { v: `peri-implantitis: about ${LOSS.toFixed(1)} mm lost ⚠`, cls: 'warn' }] }]);

// ---------------- story ----------------
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.32, phi: 1.22, zoom: 1.0, section: false, set: { disease: 0 }, labels: ['Healthy', 'Peri-implantitis'], caption: 'Two implants: one healthy, one about to become infected.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: 0, phi: 1.48, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.4, offset: 0, labels: ['Healthy', 'Bone to the shoulder'], caption: 'Cut through both: in health the bone holds the implant to its shoulder.' },
  { dur: 1.8, hold: 0.2, zoom: 0.7, focus: [DX, -2, 0], labels: ['Peri-implantitis'] },
  { dur: 3.2, hold: 2.2, set: { disease: 1 }, labels: ['Inflamed gum', 'Bone crater'], caption: 'Infection inflames the gum and eats the bone away in a crater around the implant.' },
  { dur: 1.8, hold: 2.0, zoom: 0.68, focus: [DX, -3.5, 0], theta: -0.08, labels: ['Exposed threads', 'Bone crater'], caption: 'The threads are left bare.' },
  { dur: 2.2, hold: 2.6, zoom: 1, focus: 'auto', theta: 0, drift: 0, labels: ['Healthy', 'Peri-implantitis', 'Bone to the shoulder', 'Bone crater', 'Exposed threads', 'Inflamed gum'] }
]);
fig.start();
