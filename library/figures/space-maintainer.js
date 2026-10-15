// Library: band-and-loop space maintainer in the lower left quadrant of a 7-year-old after early loss of the first primary molar (74): band on 75, loop resting on the distal of 73, the first premolar (34) forming in the bone under the gap. Buccal view, straight arch form (DK.arch mixed, age 7) with the bone made see-through; frame: midline at x = 0, the row runs back to +x (mesial = -x), +z buccal, CEJs at y = 0.
// poster: end
// Teaching point: when a baby molar is lost early, the teeth behind it drift forward into the gap; a band and loop holds the
// space open until the premolar underneath comes in. No drift distances are given (not in dental-facts.md); the movement is schematic.
const AGE = 7;
const fig = DK.figure({
  fov: 28,
  title: 'Space maintainer',
  subtitle: 'Lower left, age 7: baby molar 74 (Universal L) lost early. FDI numbers.',
  view: { theta: 0.35, phi: 1.3 }
});

const arch = DK.arch({ jaw: 'mandible', dentition: 'mixed', age: AGE, side: 'left', form: 'straight', successors: true, omit: [74] });
const byFdi = f => arch.teeth.find(t => t.fdi === f) || arch.successors.find(t => t.fdi === f);
const t73 = byFdi(73), t75 = byFdi(75), t36 = byFdi(36), p34 = byFdi(34);
const CREST = -1.5, X0 = arch.halfLength / 2;
const XR = t36.slot.c[0] + t36.spec.md / 2 + 11, BW = XR + 2, BX = XR / 2 - 1;   // from the midline to just past the second-molar crypt
const bone = DK.bone({ width: BW, height: 19, depth: 13, cortical: 1.2, crest: 1.5 }); bone.position.set(BX, CREST, 0);
const gum = DK.gingiva({ width: BW, height: 3.2, depth: 13.6, crest: 1.3, around: arch.teeth.map(t => ({ x: t.slot.c[0] - BX, z: t.slot.c[1], md: t.spec.mdC, bl: t.spec.blC, rise: 0.8 })) });
gum.position.set(BX, 1.2, 0);
fig.world.add(bone, gum);
// the other successors stay as quiet context: faded, so the premolar under the gap reads first
arch.successors.filter(d => d.fdi !== 34).forEach(d => {
  const L = d.tooth.layers; [L.dentin, L.root, L.pulp].forEach(o => { if (o) o.visible = false; });
  L.enamel.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.3; m.material.depthWrite = false; } });
});
fig.part(arch.group, { name: 'Teeth', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'Jaw bone. The adult teeth form in it, under the baby teeth.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Gum.' });

// the gap where 74 stood: between the distal contact of 73 and the mesial contact of 75 (world x)
const s73 = t73.spec, s75 = t75.spec, s34 = p34.spec;
const xD73 = t73.slot.c[0] + s73.md / 2, xM75 = t75.slot.c[0] - s75.md / 2, GAP = xM75 - xD73, xGap = (xD73 + xM75) / 2;

const info = {
  73: 'Baby lower left canine (FDI 73, Universal M); falls out at about 9 to 12 years.',
  75: 'Baby lower left second molar (FDI 75, Universal K); carries the band. Falls out at about 11 to 13 years.',
  36: 'Adult lower left first molar (FDI 36, Universal 19); erupted at about 6 years behind the baby molars. It tips forward into a gap first.'
};
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), sub: t.spec.primary ? 'baby' : 'adult', anchor: [0, t.spec.crownL + 1.2, 0], dim: false, labelOffset: [0, -40],
  info: info[t.fdi] || `${DK.toothName(t.fdi)} (FDI ${t.fdi}, Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));
arch.successors.forEach(d => fig.part(d.tooth.group, { inPlace: true, name: String(d.fdi), label: d.fdi === 34, sub: d.fdi === 34 ? 'needs this space' : '', anchor: [0, d.spec.crownL * 0.5, d.spec.bl / 2], dim: false, labelOffset: [0, 60],
  info: d.fdi === 34 ? 'The first premolar (FDI 34) forms under the lost baby molar and comes in at about 10 to 12 years. It needs the full gap to come in straight.' : `${DK.toothName(d.fdi)}, forming.` }));

// --- a marker for the gap (a flat ink bracket above the gum, accent-free)
const ink = DK.color(fig.dark ? 0xc9c3b8 : 0x4a463f);
const gapMat = new THREE.MeshBasicMaterial({ color: ink, toneMapped: false, transparent: true, opacity: 0 });
const gapBar = new THREE.Group();
{ const yb = Math.max(s73.crownL, s75.crownL) + 1.8, zb = 4.6;
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), gapMat); m.position.set(x, y, zb); gapBar.add(m); };
  bar(GAP, 0.22, xGap, yb); bar(0.22, 1.4, xD73, yb); bar(0.22, 1.4, xM75, yb); }
fig.world.add(gapBar);
fig.part(gapBar, { inPlace: true, name: 'Gap', sub: 'where 74 was', anchor: [xGap, Math.max(s73.crownL, s75.crownL) + 1.8, 4.6], dim: false, labelOffset: [0, -40], when: () => gapMat.opacity > 0.3,
  info: 'Space left by a baby molar lost early to decay. The premolar under it will not come in for years.' });

// --- the appliance: a steel band around 75 and a loop of round wire to the distal surface of 73
const steel = DK.mat('steel', {});
const BAND_Y = 0.45 * s75.crownL, BAND_H = 3.0, BAND_T = 0.15;            // band stock 0.10-0.15 mm (dental-facts.md §19)
const app = new THREE.Group();
// band: a closed sweep around the crown at its widest, in 75's own frame (x mesial along the arch = -x world)
{ const a = s75.md / 2 + 0.05, b = s75.bl / 2 + 0.05, n = 2.5, pts = [];
  for (let i = 0; i < 48; i++) { const th = i / 48 * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    pts.push(new THREE.Vector3(t75.slot.c[0] - a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), BAND_Y, t75.slot.c[1] + b * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n))); }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const band = new THREE.Mesh(DK.sweepGeometry(curve, DK.roundedRect(BAND_H / 2, BAND_T / 2, 0.06), { closed: true, segments: 160, up: [0, 1, 0] }), steel);
  app.add(band); app.userData.band = band; }
// loop: soldered on the buccal and lingual of the band, runs forward about 1 mm above the gum, wraps the distal of 73 at its widest
const WIRE = 0.45, LY = 1.6, LZ = Math.min(s34.bl, s75.bl) / 2 - 0.2, xs = t75.slot.c[0] - 1.0, xe = xD73 - 0.05 + WIRE;
const loopPts = [[xs, BAND_Y - 0.6, LZ + 0.35], [xM75 - 0.6, LY + 0.3, LZ + 0.15], [xGap, LY, LZ], [xe + 1.6, LY + 0.4, LZ - 0.4],
  [xe + 0.2, LY + 0.9, LZ * 0.45], [xe, LY + 1.0, 0], [xe + 0.2, LY + 0.9, -LZ * 0.45], [xe + 1.6, LY + 0.4, -LZ + 0.4],
  [xGap, LY, -LZ], [xM75 - 0.6, LY + 0.3, -LZ - 0.15], [xs, BAND_Y - 0.6, -LZ - 0.35]].map(p => new THREE.Vector3(...p));
const loop = DK.tube(new THREE.CatmullRomCurve3(loopPts).getPoints(80).map(v => [v.x, v.y, v.z]), WIRE, steel, { caps: true });
app.add(loop);
fig.world.add(app);
fig.part(app.userData.band, { inPlace: true, name: 'Band', sub: 'cemented on 75', anchor: [t75.slot.c[0], BAND_Y + BAND_H / 2, s75.bl / 2 + 0.2], dim: false, labelOffset: [40, -50],
  info: 'A thin steel band fitted and cemented around the baby molar behind the gap.' });
fig.part(loop, { inPlace: true, name: 'Loop', sub: 'holds the space', accent: true, anchor: [xGap, LY, LZ], dim: false, labelOffset: [-30, 70],
  info: 'A stiff steel wire loop rests against the tooth in front of the gap, so the back teeth cannot drift forward. It is wide enough for the premolar to come up through it; then the appliance is removed.' });

// --- params: the back teeth drifting into the gap (schematic), the appliance arriving, X-ray
const home = {};
[t75, t36].forEach(t => { home[t.fdi] = { x: t.tooth.group.position.x, q: t.tooth.group.quaternion.clone() }; });
const tipAxis = new THREE.Vector3(0, 0, 1), tq = new THREE.Quaternion();
fig.param('drift', 0, k => {
  [[t75, 0.62, 0.20], [t36, 0.5, 0.17]].forEach(([t, frac, tip]) => {
    const g = t.tooth.group; g.position.x = home[t.fdi].x - GAP * frac * k;
    g.quaternion.copy(home[t.fdi].q).premultiply(tq.setFromAxisAngle(tipAxis, tip * k));   // crown tips forward (toward -x)
  });
});
fig.param('gap', 0, k => { gapMat.opacity = k; gapBar.visible = k > 0.01; });
fig.param('app', 1, k => { app.visible = k > 0.01; app.position.y = (1 - k) * 9; });
fig.xray([bone, gum], false);
fig.view('X-ray', { xray: 1 });
fig.standardControls({ explode: false });

// story: the quadrant with a gap → bone fades: the premolar waits below → without help the back teeth drift in and close it →
// back → the band and loop arrive → hero: the loop holding the gap over the premolar
const FG = [xGap + 2.5, -1.5, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.5, phi: 1.2, zoom: 0.8, focus: [xGap + 3, 2, 0], xray: 0, set: { gap: 0, drift: 0, app: 0 }, labels: ['73', '75', '36'], caption: 'A baby molar was lost early to decay.' },
  { fov: 28, dur: 2.2, hold: 1.8, theta: 0.12, phi: 1.42, zoom: 0.72, focus: [xGap + 3, 1, 0], set: { gap: 1 }, labels: ['Gap'], caption: 'It leaves a gap.' },
  { dur: 2.0, hold: 1.8, zoom: 0.8, focus: [xGap + 3, -4, 0], xray: 1, labels: ['Gap', '34'], caption: 'The adult premolar that needs this space is years away.' },
  { dur: 2.6, hold: 1.8, xray: 0.6, set: { drift: 1 }, labels: ['75', '36'], caption: 'Left alone, the back teeth tip forward and close the gap.' },
  { dur: 1.6, hold: 0.4, set: { drift: 0 }, labels: ['Gap'] },
  { dur: 2.2, hold: 1.6, theta: 0.42, phi: 1.2, zoom: 0.7, focus: [xGap + 3, 1.5, 0], set: { app: 1, gap: 0 }, labels: ['Band', 'Loop'], caption: 'A band and loop holds the space.' },
  { dur: 2.4, hold: 2.8, theta: 0.3, phi: 1.32, zoom: 0.68, focus: FG, xray: 1, drift: 0, labels: ['Band', 'Loop', '34'], caption: 'Until the premolar comes in.' }
]);
fig.start();
