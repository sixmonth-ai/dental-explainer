// Library: the 20 primary teeth breaking through the gums in the usual order (AAPD chronology), both arches laid out as a chart
// seen from above and slightly in front (lower arch near, upper arch beyond it, crown-up, so neither hides the other).
// poster: step 2
// Frame: DK.arch frame (midline x = 0, patient's right at -x); lower arch toward +z, the upper arch in chart placement toward -z.
// Teaching point: the lower central incisors usually come through first (about 5 to 8 months), then the upper centrals,
// the laterals, the first molars, the canines and last the second molars. Ages are the AAPD ranges in dental-facts.md §5.
// Teeth are crowns only: at birth the crowns are forming and the roots have not started; roots are never shown after step 1.
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 30,
  title: 'Teething: which teeth come first',
  subtitle: 'Baby teeth, FDI 51 to 85. Patient’s right on the left. Typical ages (AAPD).',
  view: { theta: 0, phi: 0.62, margin: IMG ? 0.8 : 0.95 }
});

const GAP = 10;
const lower = DK.arch({ jaw: 'mandible', dentition: 'primary', crownsOnly: true });
const upper = DK.arch({ jaw: 'maxilla', dentition: 'primary', placement: 'chart', crownsOnly: true });
lower.group.position.z = lower.depth + GAP / 2;
upper.group.position.z = -(upper.depth + GAP / 2);
const both = new THREE.Group(); both.add(lower.group, upper.group);
fig.part(both, { name: 'Baby teeth', label: false, info: '20 primary teeth: 10 in each jaw.' });
both.updateMatrixWorld(true);

// --- gums: a low rounded ridge swept along each arch through the tooth centres; the crowns wait inside it
const RH = 3.6, RTOP = 0.4;                                   // ridge height (mm) and crest just over the necks
const gumMat = DK.mat('gingiva', {});
const ridge = arch => {
  const ts = arch.teeth.slice().sort((a, b) => a.slot.c[0] - b.slot.c[0]);
  const pts = ts.map(t => { const v = new THREE.Vector3(); t.tooth.group.getWorldPosition(v); v.y = RTOP - RH / 2; return v; });
  const ext = (a, b) => a.clone().add(a.clone().sub(b).setY(0).normalize().multiplyScalar(4));
  const path = [ext(pts[0], pts[1]), ...pts, ext(pts[pts.length - 1], pts[pts.length - 2])];
  const W = Math.max(...ts.map(t => t.spec.bl)) + 4.2, rr = DK.roundedRect(RH / 2, W / 2, RH / 2 - 0.05);
  // ends close down to a rounded tip, so the ridge does not stop in a flat cut
  const prof = (s, u) => { const [a, b] = rr(s), e = Math.min(1, Math.sqrt(Math.min(u, 1 - u) / 0.04)); return [a * (0.35 + 0.65 * e) + (RH / 2) * 0.65 * (1 - e) * 0.6, b * (0.3 + 0.7 * e)]; };
  return new THREE.Mesh(DK.sweepGeometry(new THREE.CatmullRomCurve3(path, false, 'centripetal'), prof, { segments: 220, up: [0, 1, 0] }), gumMat);
};
const gumL = ridge(lower), gumU = ridge(upper);
fig.world.add(gumL, gumU);
fig.part(gumL, { inPlace: true, name: 'Lower gums', label: false, fit: false, info: 'Before teeth come in, the gums are firm pads; the crowns are already forming underneath.' });
fig.part(gumU, { inPlace: true, name: 'Upper gums', label: false, fit: false, info: 'The upper gum pad.' });

// --- teeth: sink each crown inside the ridge, tint the ones erupting now in the accent
const all = [...lower.teeth, ...upper.teeth];
const AGES = { 1: ['6 to 10', '5 to 8'], 2: ['8 to 12', '7 to 10'], 3: ['16 to 20', '16 to 20'], 4: ['11 to 18', '11 to 18'], 5: ['20 to 30', '20 to 30'] };   // months, [upper, lower]
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(RTOP - RH));   // nothing of a waiting crown shows below the gum
const ENAMEL = DK.color(DK.COLORS.enamel || 0xf2efe8);
all.forEach(t => {
  t.home = t.tooth.group.position.y; t.sink = t.spec.crownL + 0.4;
  t.mats = []; t.tooth.group.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.clippingPlanes = [FLOOR]; t.mats.push({ m: m.material, c: m.material.color.clone() }); } });
  const p = t.fdi % 10;
  fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false,
    info: `${DK.toothName(t.fdi)} (FDI ${t.fdi}, Universal ${DK.toothNumber(t.fdi, 'universal')}): usually comes in at ${AGES[p][t.spec.maxillary ? 0 : 1]} months.` });
});
const GROUPS = [[71, 81], [51, 61], [72, 82, 52, 62], [54, 64, 74, 84], [53, 63, 73, 83], [55, 65, 75, 85]];
const byFdi = f => all.find(x => x.fdi === f);

// labels: markers just above the crowns (world points; placed before the params sink the teeth)
const marker = (fdis, name, sub, off) => {
  const v = new THREE.Vector3(), c = new THREE.Vector3(); let h = 0;
  fdis.forEach(f => { const t = byFdi(f); t.tooth.group.getWorldPosition(v); c.add(v); h = Math.max(h, t.spec.crownL); });
  c.multiplyScalar(1 / fdis.length);
  const o = new THREE.Object3D(); o.position.set(c.x, c.y + h + 0.6, c.z); fig.world.add(o);
  return fig.part(o, { inPlace: true, name, sub, anchor: [0, 0, 0], dim: false, labelOffset: off || [0, -40], info: '' });
};
marker([71, 81], 'Lower front teeth', `first, about ${AGES[1][1]} months`, [0, 60]);
marker([51, 61], 'Upper front teeth', `${AGES[1][0]} months`, [0, -50]);
marker([82], 'Laterals', `${AGES[2][1]} months lower, ${AGES[2][0]} upper`, [-60, 60]);
marker([84], 'First molars', `${AGES[4][1]} months`, [-70, 50]);
marker([83], 'Canines', `${AGES[3][1]} months, after the first molars`, [-80, 55]);
marker([85], 'Second molars', `${AGES[5][1]} months: all 20 in`, [-70, 50]);

const xr = { v: 0 };
// one param per group: 0 = inside the gum (hidden), 1 = through; 'now' = which group is tinted (1-based, 0 = none)
GROUPS.forEach((g, i) => fig.param('g' + i, 0, v => g.forEach(f => { const t = byFdi(f); t.tooth.group.position.y = t.home - t.sink * (1 - v); t.tooth.group.visible = v > 0.001 || fig.xrayOn || xr.v > 0.01; })));
fig.param('now', 0, v => {
  const k = Math.round(v), A = fig.accent;
  all.forEach(t => t.mats.forEach(({ m, c }) => m.color.copy(c)));
  if (k > 0) GROUPS[k - 1].forEach(f => byFdi(f).mats.forEach(({ m, c }) => m.color.copy(c).lerp(A, 0.85)));
});
fig.param('waiting', 0, v => { xr.v = v; GROUPS.forEach((g, i) => g.forEach(f => { const t = byFdi(f); if (t.tooth.group.position.y < t.home - t.sink + 0.01) t.tooth.group.visible = v > 0.01; })); });
fig.xray([gumL, gumU], false);
fig.standardControls({ explode: false });

// procedure: gums with the crowns waiting (X-ray) → lower centrals → upper centrals → laterals → first molars → canines → second molars
const zL = lower.group.position.z, zU = upper.group.position.z;
const FRONT = [0, 2, (zL + zU) / 2 + 4];
fig.procedure([
  { label: 'Gums', caption: 'At birth the crowns are forming, waiting under the gums.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: 0.35, phi: 0.8, zoom: 1.05, xray: 0, set: { waiting: 0, now: 0 }, labels: [] },
    { fov: 30, dur: 2.0, hold: 1.8, theta: 0, phi: 0.62, zoom: 1.0, xray: 0.7, set: { waiting: 1 }, labels: [], key: true },
    { dur: 1.2, hold: 0.3, xray: 0, set: { waiting: 0 } }] },
  { label: 'Lower front teeth', caption: 'The lower central incisors usually come through first.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.9, focus: [0, 2, zL - 8], labels: [] },
    { dur: 2.4, hold: 2.2, set: { g0: 1, now: 1 }, labels: ['Lower front teeth'], key: true }] },
  { label: 'Upper front teeth', caption: 'Then the upper central incisors.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.92, focus: FRONT, set: { now: 0 }, labels: [] },
    { dur: 2.2, hold: 2.0, set: { g1: 1, now: 2 }, labels: ['Upper front teeth'], key: true }] },
  { label: 'Laterals', caption: 'The lateral incisors follow, upper and lower.', beats: [
    { dur: 0.6, hold: 0, set: { now: 0 } },
    { dur: 2.2, hold: 2.0, set: { g2: 1, now: 3 }, labels: ['Laterals'], key: true }] },
  { label: 'First molars', caption: 'The first molars come in before the canines.', beats: [
    { dur: 1.6, hold: 0.1, zoom: 1.0, focus: 'auto', set: { now: 0 }, labels: [] },
    { dur: 2.2, hold: 2.0, set: { g3: 1, now: 4 }, labels: ['First molars'], key: true }] },
  { label: 'Canines', caption: 'Then the canines fill the gap in front of them.', beats: [
    { dur: 0.6, hold: 0, set: { now: 0 } },
    { dur: 2.2, hold: 2.0, set: { g4: 1, now: 5 }, labels: ['Canines'], key: true }] },
  { label: 'Second molars', caption: 'The second molars come last: all 20 baby teeth by about two and a half years.', beats: [
    { dur: 0.6, hold: 0, set: { now: 0 } },
    { dur: 2.2, hold: 2.4, set: { g5: 1, now: 6 }, labels: ['Second molars', 'Lower front teeth'], key: true }] }
]);
fig.start();
