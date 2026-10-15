// Library: maxillary right first premolar (FDI 14 = Universal 5), crown up (extracted-tooth convention), with a bucco-palatal cut. Tooth frame: CEJ at y = 0, +x mesial, +z buccal.
// poster: end
// Teaching point: the upper first premolar usually has two roots, buccal and palatal, each with its own canal; the lower premolars usually have one.
const fig = DK.figure({
  fov: 30,
  title: 'Upper first premolar, two roots',
  subtitle: 'FDI 14 (Universal 5), crown up.',
  view: { theta: 0.9, phi: 1.35 }
});

const tooth = DK.tooth(14);
const s = tooth.spec, L = tooth.layers;
const [B, P] = s.roots;
tooth.group.updateMatrixWorld(true);

const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hit = (objs, from, dir, lift = 0.05) => {
  ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
  return h ? [h.point.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
};
const rootAt = (r, u) => ({ x: r.x + r.apex[0] * u * u, y: -r.len * u, z: r.z + r.apex[1] * u * u });
const CUT = 0;   // bucco-palatal cut through the middle of both roots; the mesial half is removed and the camera looks from mesial

fig.part(tooth.group, { name: 'Tooth 14', label: false, info: 'Upper right first premolar (Universal 5): two cusps, usually two roots and two canals.' });

// pulp chamber, built here: the kit's is a flat-topped block with a wide floor. In a bucco-palatal section the chamber of an upper
// first premolar is tall and narrow mesio-distally, with two horns under the cusps (the buccal one higher) and the two canal
// orifices at its buccal and palatal ends. The kit's canals are kept and funnel into this floor.
const chamberOld = L.pulp.userData.chamber; L.pulp.remove(chamberOld);
const [cB, cP] = [DK.canalAt(s, 0, -0.8), DK.canalAt(s, 1, -0.8)];
const ZC = (cB.z + cP.z) / 2, HALF = (cB.z - cP.z) / 2 + 0.78;   // floor reaches just past both orifice funnels
const FLOOR = -1.2, ROOF = s.crownL * 0.5;
// the chamber's bucco-palatal outline (z, y), swept mesio-distally and rounded off at both ends, so a cut at x = 0 shows the outline itself
function chamberOutline() {
  const H = HALF, Hr = HALF * 0.72, ZB = Hr * 0.55, pts = [];
  const g = (z, c) => Math.exp(-Math.pow((z - c) / 0.45, 2));
  const roof = z => ROOF - 0.7 * Math.pow(Math.abs(z) / Hr, 4) + 1.0 * g(z, ZB) + 0.55 * g(z, -ZB);   // buccal (+z) horn higher
  for (let i = 0; i <= 8; i++) pts.push([-H + 2 * H * i / 8, FLOOR]);                 // floor, palatal to buccal
  for (let i = 1; i <= 8; i++) { const k = i / 8; pts.push([H + (Hr - H) * k, FLOOR + (roof(Hr) - FLOOR) * k]); }   // buccal wall
  for (let i = 1; i < 24; i++) { const z = Hr - 2 * Hr * i / 24; pts.push([z, roof(z)]); }                        // roof with two horns
  for (let i = 0; i < 8; i++) { const k = i / 8; pts.push([-Hr + (Hr - H) * k, roof(-Hr) + (FLOOR - roof(-Hr)) * k]); }   // palatal wall
  let c = pts;
  for (let pass = 0; pass < 3; pass++) {   // Chaikin: round the corners
    const n = []; c.forEach((p, i) => { const q = c[(i + 1) % c.length]; n.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); }); c = n;
  }
  return c;
}
function chamberGeometry() {
  const out = chamberOutline(), N = out.length, ROWS = 40, A = 1.2, P2 = 2.6;
  const cz = ZC, cy = (FLOOR + ROOF) / 2;
  return DK.gridGeometry(ROWS, N, (i, j) => {
    const u = -1 + 2 * i / ROWS, sc = Math.pow(1 - Math.pow(Math.abs(u), P2), 1 / P2);
    const [z, y] = out[N - 1 - j];
    return [A * u, cy + (y - cy) * sc, cz + (z - ZC) * sc];
  }, null, null);
}
const chamber = new THREE.Mesh(chamberGeometry(), tooth.mats.pulp);
L.pulp.add(chamber); L.pulp.userData.chamber = chamber;
// the kit's canals flare into bulbs at their orifices; rebuild them without the flare, same centre lines and radii
Object.values(L.pulp.userData.canals).forEach(m => L.pulp.remove(m));
const canals = s.canals.map(c => {
  const r = s.roots[c.root], cs = Object.assign({}, r, { x: r.x + c.dx, z: r.z + c.dz, ra: c.r, rb: c.r, taper: 0.7, start: -1.4, apex: r.apex });
  const m = new THREE.Mesh(DK.rootGeometry(cs, { k: 1, add: 0, minR: 0.08, endShort: 0.4, dome: true, flare: 1.0 }), tooth.mats.pulp);
  L.pulp.add(m); return m;
});
tooth.group.updateMatrixWorld(true);

// labels: each root names its length and its canal; on the cut the anchor moves onto the canal
const bA = rootAt(B, 0.6), pA = rootAt(P, 0.6);
const yB = -B.len * 0.55, yP = -P.len * 0.55, kB = DK.canalAt(s, 0, yB), kP = DK.canalAt(s, 1, yP);
fig.part(L.root, { inPlace: true, name: 'Buccal root', sub: `${B.len} mm, one canal`, dim: false, labelOffset: [-70, 0],
  anchor: (e, sec) => sec.enabled ? [CUT + 0.05, yB, kB.z] : [CUT, bA.y, bA.z + B.rb * 0.85],
  info: 'The cheek-side root, with one canal. The two roots split in the middle or apical third.' });
fig.part(L.root, { inPlace: true, name: 'Palatal root', sub: `${P.len} mm, one canal`, dim: false, labelOffset: [70, 0],
  anchor: (e, sec) => sec.enabled ? [CUT + 0.05, yP, kP.z] : [CUT, pA.y, pA.z - P.rb * 0.85],
  info: 'The palate-side root, with one canal. Two canals is the most common pattern (Vertucci type IV), but a single root or canal occurs, and the share varies widely between populations.' });
const tipB = hit([L.enamel], [CUT, 40, s.bl * 0.25], [0, -1, 0]) || [0, s.crownL, 2];
const tipP = hit([L.enamel], [CUT, 40, -s.bl * 0.25], [0, -1, 0]) || [0, s.crownL, -2];
fig.part(L.enamel, { inPlace: true, name: 'Buccal cusp', sub: 'the taller', anchor: tipB, labelOffset: [-60, -30],
  info: 'The longer, sharper cusp, taller than the palatal cusp.' });
fig.part(L.enamel, { inPlace: true, name: 'Palatal cusp', anchor: tipP, labelOffset: [60, -30], info: 'The shorter palatal cusp, its tip slightly mesial.' });

fig.enableSection([1, 0, 0], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [chamber], color: DK.COLORS.pulpCap },
  { objects: canals, color: DK.COLORS.pulpCap }   // own group: where a canal's funnel overlaps the chamber it paints over it
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 4], offset: CUT } });
fig.view('Mesial', { theta: Math.PI / 2, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Buccal root', 'Palatal root'] });
fig.view('Buccal', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Buccal root', 'Buccal cusp'] });

// story: the tooth turning → from the cheek, one crown over what looks like one root → round to mesial: two roots, buccal and palatal →
// the cut sweeps in from mesial → push in on the split: a canal in each root → hero, the cut seen from mesial three-quarter
const SPLIT = [0, -B.len * 0.5, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.9, phi: 1.35, zoom: 1.15, section: false, labels: [], caption: 'An upper first premolar, crown up.' },
  { fov: 30, dur: 2.2, hold: 1.8, theta: 0.03, phi: 1.5, zoom: 1.15, labels: ['Buccal cusp'], caption: 'From the cheek: one crown, and the roots hide behind each other.' },
  { dur: 2.6, hold: 2.2, theta: Math.PI / 2, labels: ['Buccal root', 'Palatal root'], caption: 'Turn it: two roots, buccal and palatal.' },
  { dur: 0, hold: 0, section: true, offset: 5 },
  { fov: 26, dur: 2.2, hold: 1.8, offset: CUT, labels: ['Buccal cusp', 'Palatal cusp'], caption: 'Cut through both roots.' },
  { dur: 2.0, hold: 2.2, zoom: 0.78, focus: SPLIT, labels: ['Buccal root', 'Palatal root'], caption: 'A canal in each root.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: Math.PI / 2 - 0.4, phi: 1.4, zoom: 1.12, focus: 'auto', drift: 0, labels: ['Buccal cusp', 'Palatal cusp', 'Buccal root', 'Palatal root'], caption: '' }
]);
fig.start();
