// Library: maxillary right central incisor (FDI 11 = Universal 8), crown up (extracted-tooth convention), with a mesio-distal cut. Tooth frame: CEJ at y = 0, +x mesial, +z labial.
// poster: end
// Teaching point: a wide, flat labial face (8.5 mm), a wedge-shaped profile ending at the palatal cingulum, one conical root (13 mm), and a pulp that reaches up under the incisal edge in three horns.
const fig = DK.figure({
  fov: 30,
  title: 'Upper central incisor',
  subtitle: 'FDI 11 (Universal 8), crown up.',
  view: { theta: 0.6, phi: 1.4 }
});

const tooth = DK.tooth(11, { omit: ['pulp'] });
const s = tooth.spec, L = tooth.layers, R = s.roots[0];
tooth.group.updateMatrixWorld(true);

// surface points by casting a ray at the tooth (tooth frame; the group sits at the origin)
const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hit = (objs, from, dir, lift = 0.05) => {
  ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
  if (!h) return null;
  return [h.point.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift];
};
const ENAMEL = [L.enamel], CROWN = s.crownL;

// pulp, built here: the kit's incisor chamber is a flat-topped block. A real upper central's pulp is a fan, wide mesio-distally and
// thin labio-palatally, rising under the incisal edge in three horns (one per labial lobe) and narrowing into one canal.
const Y_TOP = CROWN * 0.6, APEX_Y = -R.len + 0.5;          // horns about 4 mm under the incisal edge in an adult tooth
const HORNS = [[0.62, 0.8], [0, 0.62], [-0.62, 0.68]];      // [x (normalised MD, + mesial), height mm]: the mesial horn highest
const zMid = y => {                                          // the crown's labio-palatal middle at height y
  const a = hit(ENAMEL, [0, y, 20], [0, 0, -1], 0), b = hit(ENAMEL, [0, y, -20], [0, 0, 1], 0);
  return a && b ? (a[2] + b[2]) / 2 : 0;
};
const ZC = [0, 1.5, 3, 4.5, 6, 7.5].map(y => [y, zMid(y)]);
const zCrown = y => { for (let i = 1; i < ZC.length; i++) if (y <= ZC[i][0]) { const [y0, z0] = ZC[i - 1], [y1, z1] = ZC[i]; return z0 + (z1 - z0) * DK.util.clamp((y - y0) / (y1 - y0), 0, 1); } return ZC[ZC.length - 1][1]; };
function pulpGeometry() {
  const ROWS = 90, COLS = 56, sm = (a, b, v) => DK.util.smooth(a, b, v);
  const topY = xn => Y_TOP - 0.7 * Math.pow(Math.abs(xn), 4) + HORNS.reduce((h, [c, k]) => h + k * Math.exp(-Math.pow((xn - c) / 0.24, 2)), 0);
  return DK.gridGeometry(ROWS, COLS, (i, j) => {
    const t = i / ROWS, th = j / COLS * Math.PI * 2, cx = Math.cos(th), sz = Math.sin(th);
    const y0 = APEX_Y + (Y_TOP - APEX_Y) * t;
    let a, b, x, z;
    if (y0 < 0) { const c = DK.canalAt(s, 0, y0); a = Math.max(c.r * 1.3, 0.12); b = Math.max(c.r * 1.45, 0.12); x = c.x; z = c.z; }
    else {
      const k = y0 / Y_TOP, c0 = DK.canalAt(s, 0, 0);
      a = 0.72 + (2.0 - 0.72) * sm(-0.25, 1, k);
      b = 0.8 + (0.28 - 0.8) * sm(0, 1, k);
      x = c0.x * (1 - sm(0, 0.4, k)); z = c0.z + (zCrown(y0) - c0.z) * sm(0, 0.5, k);
    }
    const w = Math.pow(sm(Y_TOP - 1.8, Y_TOP, y0), 1.3);               // the upper rows bend into the horned roof
    const y = y0 + w * (topY(cx) - Y_TOP);
    const bt = b * (1 - 0.85 * sm(0.95, 1, t));                         // a thin, rounded roof edge labio-palatally
    return [x + a * cx, y, z + bt * sz];
  }, [0, Y_TOP + 0.25, zCrown(Y_TOP)], (c => [c.x, APEX_Y - 0.05, c.z])(DK.canalAt(s, 0, APEX_Y)));
}
const pulpMesh = new THREE.Mesh(pulpGeometry(), tooth.mats.pulp);
const pulp = new THREE.Group(); pulp.add(pulpMesh); tooth.group.add(pulp); L.pulp = pulp;
tooth.group.updateMatrixWorld(true);

fig.part(tooth.group, { name: 'Tooth 11', label: false, info: 'Upper right central incisor (Universal 8): the widest front tooth, one root and one canal.' });

const pLabial = hit(ENAMEL, [0.6, CROWN * 0.55, 20], [0, 0, -1]) || [0, CROWN * 0.55, s.bl / 2];
const pCingulum = hit(ENAMEL, [20, 2.0, zMid(2.0) - s.blC / 2 + 0.7], [-1, 0, 0]) || [0, 2.2, -s.bl / 2];   // on the mesial profile, where the bulge shows
const pEdge = hit(ENAMEL, [-1.2, 30, 0.2], [0, -1, 0]) || [0, CROWN, 0];
const pRoot = [R.x + R.apex[0] * 0.3 + R.ra * 0.62, -R.len * 0.55, R.z + R.apex[1] * 0.3 + R.rb * 0.5];
// top of the pulp chamber: the middle horn, on the cut plane (z = 0)
const CUT = Math.round(zCrown(4) * 10) / 10;   // the mesio-distal cut runs through the middle of the pulp fan
const pHorn = hit([L.pulp], [1.4, 30, CUT], [0, -1, 0], 0.25) || [1.4, CROWN * 0.65, CUT];
const pCanal = (c => [c.x, -R.len * 0.45, CUT])(DK.canalAt(s, 0, -R.len * 0.45));

fig.part(L.enamel, { inPlace: true, name: 'Labial face', sub: `${s.md} mm wide`, anchor: pLabial, labelOffset: [-70, -30],
  info: 'The broad, gently convex face toward the lip, the widest crown of the front teeth (about 8.5 mm mesio-distally).' });
fig.part(L.enamel, { inPlace: true, name: 'Cingulum', sub: 'palatal bulge', anchor: pCingulum, labelOffset: [70, 30],
  info: 'The rounded bulge on the palatal side of the crown, in its cervical third. Above it lies the shallow palatal fossa, where a pit sometimes forms.' });
fig.part(L.enamel, { inPlace: true, name: 'Incisal edge', anchor: pEdge, labelOffset: [-50, -40],
  info: 'The thin cutting edge. Newly erupted incisors carry three small bumps (mamelons) here that wear away.' });
fig.part(L.dentin, { inPlace: true, name: 'Root', sub: `single, conical, ${R.len} mm`, anchor: pRoot, labelOffset: [60, 10],
  info: 'One straight, cone-shaped root, about 13 mm long, roughly triangular to round in cross-section.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp horns', sub: 'under the incisal edge', anchor: pHorn, labelOffset: [60, -40], accent: true, dim: false,
  when: (e, sec) => sec.enabled, info: 'The pulp chamber rises into three small horns toward the incisal edge, one under each developmental lobe. They are large in young teeth.' });
fig.part(L.pulp, { inPlace: true, name: 'Root canal', sub: 'one canal', anchor: pCanal, labelOffset: [-60, 0], dim: false,
  when: (e, sec) => sec.enabled, info: 'Nearly always a single canal from the chamber to the apex.' });

fig.enableSection([0, 0, 1], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-2.5, 4.5], offset: CUT } });
fig.view('Labial', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Labial face', 'Incisal edge', 'Root'] });
fig.view('Mesial', { theta: Math.PI / 2, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Cingulum', 'Labial face', 'Root'] });

// story: the tooth turning → straight on from the lip (the wide face) → from the side (the wedge and the cingulum) →
// back round to the lip side as the cut sweeps in (pulp horns) → push in under the edge → hero: three-quarter, cut open
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.6, phi: 1.4, zoom: 1.05, section: false, labels: [], caption: 'An upper central incisor, crown up.' },
  { fov: 30, dur: 2.2, hold: 2.0, theta: 0.02, phi: 1.5, zoom: 1.14, labels: ['Labial face', 'Incisal edge'], caption: 'From the lip: a wide, flat face.' },
  { dur: 2.4, hold: 2.2, theta: Math.PI / 2, phi: 1.5, labels: ['Cingulum', 'Root'], caption: 'From the side: a wedge, with the cingulum bulging palatally and one conical root.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: 0.15, phi: 1.45, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 4.5 },
  { dur: 2.2, hold: 1.8, offset: CUT, labels: ['Pulp horns', 'Root canal'], caption: 'Cut open: one canal, and the pulp rising under the edge.' },
  { dur: 2.0, hold: 2.0, zoom: 0.6, focus: [0, CROWN * 0.6, 0], labels: ['Pulp horns'], caption: 'Three pulp horns, one under each lobe.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: 0.6, phi: 1.36, zoom: 1.08, focus: 'auto', drift: 0, labels: ['Incisal edge', 'Cingulum', 'Pulp horns', 'Root canal', 'Root'], caption: '' }
]);
fig.start();
