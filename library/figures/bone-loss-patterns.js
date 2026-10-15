// Horizontal vs vertical bone loss on the lower right second premolar and first molar (FDI 45 and 46 = Universal 29 and 30),
// poster: end
// two sets side by side cut by one mesio-distal section: on the left the crest is lowered evenly across both teeth, on the right
// it stays near its healthy level except for an angular (infrabony) defect along the mesial root of 46 (dental-facts.md §13, §17).
// Frame: +x = mesial (45 sits mesial of 46), +z = buccal, y up, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const CREST = -1.8;          // healthy crest, ~2 mm below the CEJ
const HORIZ = 3.5;           // horizontal set: crest lowered 3.5 mm everywhere
const DEFECT = 5.0;          // vertical set: angular defect 5 mm deep beside the mesial root of 46 (≥ 3 mm: a Stage III complexity factor)
const MARGIN = 1.0;          // gingival margin on the enamel in both sets
const GAP = 25;              // centre-to-centre spacing of the two sets
const X46 = -4.2, X45 = 4.8; // tooth centres within a set (contact between them)
const { smooth, lerp } = DK.util;

const fig = DK.figure({
  fov: 26,
  title: 'Horizontal vs vertical bone loss',
  subtitle: 'FDI 46 and 45 (Universal 30 and 29), mesio-distal cut.',
  view: { theta: 0.22, phi: 1.4, margin: 0.86 }
});
const ink = fig.dark ? 0xd9d3c6 : 0x3d3a34;
const lineMat = new THREE.MeshBasicMaterial({ color: DK.color(ink), toneMapped: false, transparent: true, opacity: 0.75 });

// ---------- one set: 46 and 45 in one bone block, with its own bone loss
function makeSet(cx, loss) {
  const t46 = DK.tooth(46), t45 = DK.tooth(45), s46 = t46.spec, s45 = t45.spec;
  t46.group.position.x = cx + X46; t45.group.position.x = cx + X45;
  const BX = (X46 + X45) / 2 - 0.6, BW = 22;                                   // block centre (set frame) and width
  const bone = DK.perioBone({ width: BW, height: 17, depth: 11.6, cortical: 1.2, crest: 1.4, loss: (x, z) => loss(x + BX, z), level: 1 });
  bone.position.set(cx + BX, CREST, 0);
  const crestAt = (x, z) => CREST + bone.crestAt(x - BX, z);                    // set frame → tooth-frame height
  let deepest = 0; for (let x = -BW / 2; x <= BW / 2; x += 0.25) deepest = Math.min(deepest, crestAt(x + BX, 0));
  const gum = DK.gingiva({ width: BW + 0.6, height: MARGIN - 0.9 - deepest + 0.8, depth: 12.4, crest: 1.2, color: DK.COLORS.gingiva,
    around: [{ x: X46 - BX, z: 0, md: s46.mdC, bl: s46.blC, rise: 0.9 }, { x: X45 - BX, z: 0, md: s45.mdC, bl: s45.blC, rise: 0.9 }] });
  gum.position.set(cx + BX, MARGIN - 0.9, 0);
  const pdl46 = DK.perioPdl(s46, 0.22, r => Math.min(crestAt(X46 + r.x + r.ra + 0.2, 0), crestAt(X46 + r.x - r.ra - 0.2, 0)) + 0.2); t46.group.add(pdl46);
  const pdl45 = DK.perioPdl(s45, 0.22, r => Math.min(crestAt(X45 + r.ra + 0.2, 0), crestAt(X45 - r.ra - 0.2, 0)) + 0.2); t45.group.add(pdl45);
  const set = k => { bone.set(k);
    pdl46.set(r => Math.min(crestAt(X46 + r.x + r.ra + 0.2, 0), crestAt(X46 + r.x - r.ra - 0.2, 0)) + 0.2);
    pdl45.set(r => Math.min(crestAt(X45 + r.ra + 0.2, 0), crestAt(X45 - r.ra - 0.2, 0)) + 0.2); };
  return { t46, t45, s46, s45, bone, gum, pdls: [pdl46, pdl45], crestAt, BX, BW, cx, set };
}

// horizontal: an even drop; vertical: a narrow V against the mesial root of 46, sloping up to the crest at 45
const mesial46 = X46 + DK.toothSurfaceAt(DK.tooth(46).spec, -2.5, 0).x;       // mesial root surface of 46 near the crest
const H = makeSet(-GAP / 2, () => -HORIZ);
const V = makeSet(GAP / 2, (x, z) => {
  const u = x < mesial46 ? (mesial46 - x) / 0.8 : (x - mesial46) / 2.6;         // steep on the root side, a long slope toward 45
  return -DEFECT * Math.max(0, 1 - Math.hypot(u, z / 3.4)) - 0.4 * smooth(6, 0, Math.abs(x - mesial46));
});

// ---------- healthy-level reference: a dashed line across the cut face at the healthy crest, broken where the roots are
const cutZ = () => (fig.section && fig.section.enabled ? fig.section.offset : 0) + 0.12;
function healthyLine(S) {
  const g = new THREE.Group(); const y = CREST, gaps = [];
  [[S.t46, S.s46, X46], [S.t45, S.s45, X45]].forEach(([t, sp, X]) => {
    sp.roots.forEach(r => { const a = DK.toothSurfaceAt(sp, y, Math.PI, sp.roots.length > 1 ? sp.roots.indexOf(r) : undefined).x, b = DK.toothSurfaceAt(sp, y, 0, sp.roots.length > 1 ? sp.roots.indexOf(r) : undefined).x; gaps.push([X + Math.min(a, b) - 0.15, X + Math.max(a, b) + 0.15]); });
  });
  const x0 = S.BX - S.BW / 2 + 0.5, x1 = S.BX + S.BW / 2 - 0.5, dash = 0.55, gapL = 0.35;
  for (let x = x0; x < x1; x += dash + gapL) {
    const a = x, b = Math.min(x + dash, x1); if (gaps.some(([p, q]) => b > p && a < q)) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 0.14), lineMat); m.position.set(S.cx + (a + b) / 2, y, 0); g.add(m);
  }
  fig.world.add(g); return g;
}
const lineH = healthyLine(H), lineV = healthyLine(V);
fig.onFrame(() => { const z = cutZ(), on = fig.section.enabled; [lineH, lineV].forEach(g => { g.position.z = z; g.visible = on; }); });

// ---------- parts
const cutOn = (e, sec) => sec.enabled;
const zc = sec => (sec.enabled ? sec.offset : 0) + 0.1;
fig.part(H.t46.group, { name: 'Horizontal', sub: 'crest lowered evenly', anchor: [X45 - X46 + 0.0 - 4.5, H.s46.crownL + 1.6, 0], info: 'Horizontal bone loss: the crest drops evenly across the teeth and stays parallel to the line joining their CEJs. The most common pattern.' });
fig.part(V.t46.group, { name: 'Vertical', sub: 'angular defect beside one root', anchor: [X45 - X46 - 4.5, V.s46.crownL + 1.6, 0], info: 'Vertical (angular) bone loss: bone is lost down one root faster than next to it, leaving a V-shaped infrabony defect.' });
fig.part(H.t45.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar (Universal 29): one root.' });
fig.part(V.t45.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar (Universal 29): one root.' });
[H, V].forEach(S => { fig.part(S.bone, { name: 'Bone', label: false, info: 'Alveolar bone: cortical shell over cancellous bone. Lost bone does not grow back by itself.' });
  fig.part(S.gum, { name: 'Gum', label: false, fit: false, info: 'The gum fills the space where bone has been lost: a pocket.' }); });
fig.part(lineH, { inPlace: true, name: 'Healthy bone level', sub: '~2 mm below the CEJ', anchor: [H.cx + H.BX - H.BW / 2 + 1.2, CREST, 0], labelOffset: [-60, -70], when: cutOn, dim: false, info: 'In health the crest sits about 1.5 to 2 mm below the CEJ.' });
fig.part(H.bone, { inPlace: true, name: 'Even loss', sub: `${DK.mm(HORIZ)} across both teeth`, anchor: (e, sec) => [(mesial46 + X45) / 2 - H.BX + 0.3, H.bone.crestAt(0, 0) - 0.5, zc(sec)], labelOffset: [40, 90], when: cutOn, dim: false, info: 'The crest is lower everywhere by about the same amount, so it still runs parallel to the CEJs.' });
fig.part(V.bone, { inPlace: true, name: 'Angular defect', sub: `${DK.mm(DEFECT)} deep beside the 46 root`, anchor: (e, sec) => [mesial46 - V.BX + 0.35, V.bone.crestAt(mesial46 + 0.35 - V.BX, 0) + 0.6, zc(sec)], labelOffset: [90, 110], when: cutOn, accent: true, dim: false, info: 'An infrabony defect: the pocket base lies below the crest of the neighbouring bone. Walls of bone around it can sometimes be regenerated; horizontal loss cannot.' });

// ---------- section: one mesio-distal plane through both sets (gingiva first, so it fills every defect)
fig.enableSection([0, 0, 1], [
  { objects: [H.gum, V.gum], color: DK.COLORS.gingivaCap },
  { objects: [H.bone.userData.layers.cortical, V.bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [H.bone.userData.layers.cancellous], color: 0xffffff, texture: H.bone.userData.layers.cancellous.userData.capTexture },
  { objects: [V.bone.userData.layers.cancellous], color: 0xffffff, texture: V.bone.userData.layers.cancellous.userData.capTexture },
  { objects: H.pdls.concat(V.pdls), color: DK.COLORS.pdl },
  { objects: [H.t46.layers.enamel, H.t45.layers.enamel, V.t46.layers.enamel, V.t45.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [H.t46.layers.root, H.t46.layers.dentin, H.t45.layers.root, H.t45.layers.dentin, V.t46.layers.root, V.t46.layers.dentin, V.t45.layers.root, V.t45.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [H.t46.layers.pulp, H.t45.layers.pulp, V.t46.layers.pulp, V.t45.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0.4 } });
fig.view('Horizontal', { focus: [-GAP / 2 + 0.3, -2.5, 0], zoom: 0.62, theta: 0.08, phi: 1.47, set: { h: 1, v: 1 }, labels: ['Horizontal', 'Even loss', 'Healthy bone level'] });
fig.view('Vertical', { focus: [GAP / 2 + 0.3, -2.5, 0], zoom: 0.62, theta: 0.08, phi: 1.47, set: { h: 1, v: 1 }, labels: ['Vertical', 'Angular defect'] });

// ---------- params: each set loses its bone in its own pattern (0 = healthy, 1 = the full loss)
fig.param('h', 1, k => H.set(k));
fig.param('v', 1, k => V.set(k));

// ---------- story: both pairs → the cut sweeps in → even loss → the angular defect → hero shot
fig.story([
  { dur: 0, hold: 1.4, theta: 0.6, phi: 1.24, zoom: 1.04, section: false, set: { h: 0, v: 0 }, labels: ['Horizontal', 'Vertical'], caption: 'The same two lower teeth, with two patterns of bone loss.' },
  { dur: 2.2, hold: 0.2, theta: 0.12, phi: 1.45, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.0, offset: 0.4, labels: ['Healthy bone level'], caption: 'One cut through both: healthy bone, about 2 mm below the CEJ.' },
  { dur: 2.0, hold: 0.2, zoom: 0.62, focus: [-GAP / 2 + 0.3, -2.5, 0], theta: 0.06, labels: ['Healthy bone level'] },
  { dur: 2.4, hold: 2.0, set: { h: 1 }, labels: ['Even loss', 'Healthy bone level'], caption: 'Horizontal: the crest drops evenly across both teeth.' },
  { dur: 2.2, hold: 0.2, zoom: 0.62, focus: [GAP / 2 + 0.3, -2.5, 0], theta: 0.16, labels: [] },
  { dur: 2.4, hold: 2.2, set: { v: 1 }, labels: ['Angular defect'], caption: 'Vertical: a V-shaped defect down one root.' },
  { dur: 2.2, hold: 2.6, zoom: fig.mode === 'image' ? 0.8 : 1, focus: 'auto', theta: 0.22, phi: 1.4, labels: ['Horizontal', 'Vertical', 'Even loss', 'Angular defect', 'Healthy bone level'] }
]);
fig.start();
