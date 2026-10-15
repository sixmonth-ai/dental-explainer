// Library: the 20 primary teeth breaking through the gum pads in the usual order (AAPD chronology), both arches, mouth open, seen from the front and the side. Frame: DK.arch frame (midline x = 0, patient's right at -x, anterior +z); lower CEJs at y = 0, the upper arch crown-down above it.
// poster: step 2
// Teaching point: the lower central incisors usually come through first (about 5 to 8 months), then the upper centrals,
// the laterals, the first molars, the canines and last the second molars. Ages are the AAPD ranges in dental-facts.md §5.
// Unerupted teeth sit under the gum with their roots partly formed (develop 0.4); the gum pad is a smooth swept ridge.
const fig = DK.figure({
  fov: 32,
  title: 'Teething: which teeth come first',
  subtitle: 'Baby teeth, FDI 51 to 85. Ages are typical ranges (AAPD).',
  view: { theta: 0.25, phi: 1.38, margin: 0.95 }
});

const OPEN = 17;                                            // upper CEJ level: a baby's mouth, open
const opts = { dentition: 'primary', toothOpts: () => ({ develop: 0.4 }) };
const lower = DK.arch(Object.assign({ jaw: 'mandible' }, opts));
const upper = DK.arch(Object.assign({ jaw: 'maxilla', placement: 'jaw' }, opts));
upper.group.position.set(0, OPEN, 1.2);
const both = new THREE.Group(); both.add(lower.group, upper.group);
fig.part(both, { name: 'Baby teeth', label: false, info: '20 primary teeth: 10 in each jaw.' });
both.updateMatrixWorld(true);

// --- gum pads: a rounded ridge swept along each arch through the tooth centres, its crest just over the necks
const gumMat = DK.mat('gingiva', {});
const pad = (arch, sign) => {
  const pts = arch.teeth.slice().sort((a, b) => a.slot.c[0] - b.slot.c[0]).map(t => { const v = new THREE.Vector3(); t.tooth.group.getWorldPosition(v); return v; });
  const first = pts[0], last = pts[pts.length - 1], H = 15, Wd = sign > 0 ? 9.5 : 10.5;
  const ext = (a, b) => a.clone().add(a.clone().sub(b).setY(0).normalize().multiplyScalar(8));
  const rr = DK.roundedRect(H / 2, Wd / 2, Wd * 0.45);
  const path = [ext(first, pts[1]), ...pts, ext(last, pts[pts.length - 2])].map(v => new THREE.Vector3(v.x, v.y - sign * (H / 2 - 0.6), v.z));
  const g = DK.sweepGeometry(new THREE.CatmullRomCurve3(path, false, 'centripetal'), (sp, t) => { const [a, b] = rr(sp), e = Math.min(1, Math.sqrt(Math.min(t, 1 - t) / 0.03) * 0.85 + 0.15); return [a * (0.6 + 0.4 * e) + sign * (H / 2) * 0.4 * (1 - e), b * e]; }, { segments: 200, up: [0, 1, 0] });
  return new THREE.Mesh(g, gumMat);
};
const padL = pad(lower, 1), padU = pad(upper, -1);
fig.world.add(padL, padU);
fig.part(padL, { inPlace: true, name: 'Gum pads', label: false, info: 'Before teeth come in, the jaws are covered by firm gum pads; the crowns are already formed underneath.' });
fig.part(padU, { inPlace: true, name: 'Upper gum pad', label: false, info: 'The upper gum pad.' });

// --- eruption: each tooth starts sunk below the gum surface and rises along its own axis
const all = [...lower.teeth, ...upper.teeth];
const AGES = {   // AAPD eruption ranges in months (dental-facts.md §5): [maxillary, mandibular]
  1: ['6 to 10', '5 to 8'], 2: ['8 to 12', '7 to 10'], 3: ['16 to 20', '16 to 20'], 4: ['11 to 18', '11 to 18'], 5: ['20 to 30', '20 to 30'] };
all.forEach(t => { t.home = t.tooth.group.position.y; t.sink = t.spec.crownL + 2.4; });
const NAMES = { 1: 'central incisor', 2: 'lateral incisor', 3: 'canine', 4: 'first molar', 5: 'second molar' };
all.forEach(t => {
  const p = t.fdi % 10, max = t.spec.maxillary;
  fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false,
    info: `${DK.toothName(t.fdi)} (FDI ${t.fdi}, Universal ${DK.toothNumber(t.fdi, 'universal')}): usually comes in at ${AGES[p][max ? 0 : 1]} months.` });
});
// labels: one marker per pair, just outside the crowns (world points)
const marker = (fdis, name, sub, accent, off) => {
  const ts = fdis.map(f => all.find(x => x.fdi === f)), v = new THREE.Vector3(), c = new THREE.Vector3();
  ts.forEach(t => { t.tooth.group.getWorldPosition(v); c.add(v); }); c.multiplyScalar(1 / ts.length);
  const max = ts[0].spec.maxillary, h = ts[0].spec.crownL * 0.6;
  const o = new THREE.Object3D(); o.position.set(c.x, c.y + (max ? -h : h), c.z + ts[0].spec.bl / 2); fig.world.add(o);
  return fig.part(o, { inPlace: true, name, sub, accent, anchor: [0, 0, 0], dim: false, labelOffset: off || [0, 0], info: '' });
};
marker([71, 81], 'Lower front teeth', `first, about ${AGES[1][1]} months`, true, [0, 70]);
marker([51, 61], 'Upper front teeth', `${AGES[1][0]} months`, false, [0, -70]);
marker([72, 82], 'Lower laterals', `${AGES[2][1]} months`, false, [60, 60]);
marker([52, 62], 'Upper laterals', `${AGES[2][0]} months`, false, [60, -60]);
marker([74], 'First molars', `${AGES[4][1]} months`, false, [60, 50]);
marker([73], 'Canines', `${AGES[3][1]} months, after the first molars`, false, [60, 60]);
marker([75], 'Second molars', `${AGES[5][1]} months: all 20 in`, false, [60, 50]);

// one param per group of teeth (u = upper, l = lower), 0 = under the gum, 1 = through
const groups = { l1: [71, 81], u1: [51, 61], l2: [72, 82], u2: [52, 62], m1: [54, 64, 74, 84], c: [53, 63, 73, 83], m2: [55, 65, 75, 85] };
Object.keys(groups).forEach(k => fig.param(k, 0, v => groups[k].forEach(f => { const t = all.find(x => x.fdi === f); t.tooth.group.position.y = t.home - t.sink * (1 - v); })));

fig.xray([padL, padU], false);
fig.standardControls({ explode: false });

// procedure: gum pads (X-ray: the crowns are waiting) → lower centrals → upper centrals → laterals → first molars → canines → second molars
const FRONT = { theta: 0.12, phi: 1.42 }, SIDE = { theta: 0.95, phi: 1.36 };
const C = [0, OPEN / 2, 8];
fig.procedure([
  { label: 'Gum pads', caption: 'At birth the crowns are already formed, waiting under the gums.', beats: [
    { fov: 34, dur: 0, hold: 1.2, theta: 0.4, phi: 1.3, zoom: 1.0, xray: 0, labels: [] },
    { dur: 2.0, hold: 1.8, xray: 0.75, labels: [], key: true },
    { dur: 1.4, hold: 0.4, xray: 0 }] },
  { label: 'Lower front teeth', caption: 'The lower central incisors usually come through first.', beats: [
    { fov: 30, dur: 1.4, hold: 0.2, ...FRONT, zoom: 0.8, focus: C, labels: [] },
    { dur: 2.4, hold: 2.2, set: { l1: 1 }, labels: ['Lower front teeth'], key: true }] },
  { label: 'Upper front teeth', caption: 'Then the upper central incisors.', beats: [
    { dur: 2.2, hold: 2.0, set: { u1: 1 }, labels: ['Upper front teeth'], key: true }] },
  { label: 'Laterals', caption: 'The lateral incisors follow, upper and lower.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.9 },
    { dur: 2.2, hold: 2.0, set: { l2: 1, u2: 1 }, labels: ['Lower laterals', 'Upper laterals'], key: true }] },
  { label: 'First molars', caption: 'The first molars come in before the canines.', beats: [
    { dur: 1.8, hold: 0.1, ...SIDE, zoom: 0.85, focus: [10, OPEN / 2, 0], labels: [] },
    { dur: 2.2, hold: 2.0, set: { m1: 1 }, labels: ['First molars'], key: true }] },
  { label: 'Canines', caption: 'Then the canines fill the gap in front of them.', beats: [
    { dur: 2.2, hold: 2.0, set: { c: 1 }, labels: ['Canines'], key: true }] },
  { label: 'Second molars', caption: 'The second molars come last: all 20 baby teeth by about two and a half years.', beats: [
    { dur: 2.2, hold: 1.2, set: { m2: 1 }, labels: ['Second molars'] },
    { dur: 2.4, hold: 2.4, theta: 0.5, phi: 1.36, zoom: 1.0, focus: 'auto', labels: ['Lower front teeth', 'Second molars'], key: true }] }
]);
fig.start();
