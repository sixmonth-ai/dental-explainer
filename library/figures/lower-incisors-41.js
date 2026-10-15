// Library: the mandibular right central and lateral incisors (FDI 41 = Universal 25, FDI 42 = Universal 26), crown up, side by side as in the arch (42 distal, on the viewer's left from labial), then cut horizontally across the roots like a CBCT axial slice. Tooth frame: CEJ at y = 0, +x mesial, +z labial.
// poster: end
// Teaching point: the smallest teeth in the mouth, with narrow crowns and roots flattened from side to side; the canal is a labio-lingual ribbon that splits into a labial and a lingual canal in about a quarter of lower laterals and a fifth of centrals.
const fig = DK.figure({
  fov: 30,
  title: 'Lower incisors',
  subtitle: 'FDI 41 and 42 (Universal 25 and 26), crown up.',
  view: { theta: 0.55, phi: 1.36 }
});
const { lerp, smooth } = DK.util;

const t41 = DK.tooth(41), t42 = DK.tooth(42);
const s41 = t41.spec, s42 = t42.spec;
const GAP = 1.6;                                            // a little space between the crowns so each reads on its own
t42.group.position.x = -(s41.md / 2 + s42.md / 2 + GAP);    // 42 is distal of 41
[t41, t42].forEach(t => t.group.updateMatrixWorld(true));
const X42 = t42.group.position.x;

// 42: the kit's single ribbon canal is replaced by a labial and a lingual canal that split under the chamber and join near the apex
// (Vertucci type III, the most common two-canal pattern in lower incisors)
const L42 = t42.layers, R42 = s42.roots[0], mat = t42.mats.pulp;
L42.pulp.children.forEach(m => { if (m !== L42.pulp.userData.chamber) m.visible = false; });
// each canal follows the root's centre line bowed labially or lingually (flare: zero at the chamber and the apex, widest at mid-root)
const canal42 = side => new THREE.Mesh(DK.rootGeometry(Object.assign({}, R42, { ra: 0.3, rb: 0.32, taper: 0.55, start: -0.4, flare: [0, side * 1.0] }),
  { k: 1, add: 0, minR: 0.08, endShort: 0.4, dome: true, flare: 1.0 }), mat);
const labial = canal42(1), lingual = canal42(-1);
const SPREAD = y => Math.sin(Math.PI * DK.util.clamp(-y / R42.len, 0, 1));
[labial, lingual].forEach(m => t42.group.add(m));

const CUT = -4.5;   // the axial slice: in the coronal half of the roots, where the two canals of 42 run apart
const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hitW = (objs, from, dir, lift = 0.05) => {   // world coordinates
  ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
  return h ? [h.point.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
};
const local = (t, p) => p ? [p[0] - t.group.position.x, p[1], p[2]] : null;

fig.part(t41.group, { name: 'Central 41', sub: `${s41.md} mm wide`, anchor: [0, s41.crownL + 0.6, 0], labelOffset: [40, -50], dim: false, when: (e, sec) => !sec.enabled || sec.offset > 6,
  info: 'Lower right central incisor (Universal 25): the narrowest tooth in the mouth, about 5 mm wide, and wider front to back than side to side.' });
fig.part(t42.group, { name: 'Lateral 42', sub: `${s42.md} mm wide`, anchor: [0, s42.crownL + 0.6, 0], labelOffset: [-40, -50], dim: false, when: (e, sec) => !sec.enabled || sec.offset > 6,
  info: 'Lower right lateral incisor (Universal 26): a little wider and longer than the central, its crown slightly twisted toward the canine.' });

// the root of 41 seen from mesial: its labio-lingual width
const rootSide = local(t41, hitW([t41.layers.dentin, t41.layers.root], [20, -6, 0], [-1, 0, 0])) || [s41.mdC / 2, -6, 0];
fig.part(t41.layers.dentin, { inPlace: true, name: 'Flat root', sub: 'wide front to back', dim: false,
  anchor: (e, sec) => {
    if (!sec.enabled) return rootSide;
    const p = local(t41, hitW([t41.layers.dentin, t41.layers.root], [0, CUT + 0.05, -20], [0, 0, 1], -0.35));
    return p ? [p[0], CUT + 0.05, p[2]] : [0, CUT, -1.8];
  }, labelOffset: [80, -40],
  info: 'The root is flattened from side to side: narrow mesio-distally, wide labio-lingually, with a shallow groove down each side. In a horizontal slice it is a narrow oval.' });
const c41 = DK.canalAt(s41, 0, CUT);
const ribbon = new THREE.Object3D(); ribbon.position.set(c41.x, CUT + 0.05, c41.z); t41.group.add(ribbon);
fig.part(ribbon, { inPlace: true, name: 'One canal', sub: 'a flat ribbon', anchor: [0, 0, 0], labelOffset: [100, 40], dim: false,
  when: (e, sec) => sec.enabled && sec.offset < -1,
  info: 'Most lower incisors have one canal, but it is a ribbon: wide labio-lingually and thin mesio-distally, so a round file cleans only its middle.' });
const c42 = DK.canalAt(s42, 0, CUT);
const lingMark = new THREE.Object3D(); lingMark.position.set(c42.x, CUT + 0.05, c42.z - SPREAD(CUT)); t42.group.add(lingMark);
fig.part(lingMark, { inPlace: true, name: 'Second canal', sub: 'lingual, about 1 in 4', anchor: [0, 0, 0], labelOffset: [-90, 40], accent: true, dim: false,
  when: (e, sec) => sec.enabled && sec.offset < -1,
  info: 'A second, lingual canal: pooled CBCT data find it in 25.3% of lower laterals and 20.4% of lower centrals. It splits off behind the labial canal and is missed unless the access opening reaches far enough lingually.' });

// orientation words on the slice, like the side markers of a CBCT view
const word = (txt, x, z, h = 0.62) => { const sp = DK.textSprite(txt, { height: h, color: fig.dark ? '#9C978D' : '#6E6A62', halo: null, weight: 600 }); sp.position.set(x, CUT + 0.1, z); fig.world.add(sp); return sp; };
const words = [word('Lingual', X42 / 2, -4.0), word('Labial', X42 / 2, 4.7), word('42', X42, 3.4, 0.75), word('41', 0, 3.4, 0.75)];
fig.onFrame(() => { const on = !!(fig.section && fig.section.enabled && fig.section.offset < -1 && fig.orbit.phi < 0.45); words.forEach(w => { w.visible = on; }); });
const both = f => [f(t41), f(t42)].flat();
fig.enableSection([0, 1, 0], [
  { objects: both(t => [t.layers.enamel]), color: DK.COLORS.enamelCap },
  { objects: both(t => [t.layers.root, t.layers.dentin]), color: DK.COLORS.dentinCap },
  { objects: [t41.layers.pulp, L42.pulp.userData.chamber], color: DK.COLORS.pulpCap },
  { objects: [labial], color: DK.COLORS.pulpCap },
  { objects: [lingual], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Slice', on: false, range: [-12, 10], offset: CUT } });
fig.view('Slice', { theta: 0.25, phi: 0.5, zoom: 0.7, focus: [X42 / 2, CUT, 0], section: true, offset: CUT, labels: ['One canal', 'Second canal', 'Flat root'] });

// story: the two incisors turning → from the lip: two narrow crowns → from the side: the root is wide front to back →
// rise above them → the slice sweeps down through the crowns into the roots → push in: a ribbon canal and, in 42, two canals → hero
const FOCUS = [X42 / 2, CUT, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.55, phi: 1.36, zoom: 1.08, section: false, labels: [], caption: 'The two lower incisors on the right side.' },
  { fov: 30, dur: 2.2, hold: 2.0, theta: 0.02, phi: 1.5, zoom: 1.0, labels: ['Central 41', 'Lateral 42'], caption: 'The smallest teeth: crowns only about 5 mm wide.' },
  { dur: 2.4, hold: 2.0, theta: 1.25, phi: 1.5, labels: ['Flat root'], caption: 'From the side the root is wide: it is flattened, not round.' },
  { dur: 2.2, hold: 0.2, theta: 0.3, phi: 0.62, zoom: 0.8, focus: [X42 / 2, -1, 0], labels: [] },
  { dur: 0, hold: 0, section: true, offset: 11 },
  { fov: 28, dur: 2.6, hold: 0.8, offset: CUT, zoom: 0.7, focus: [X42 / 2, CUT, 0], labels: [], caption: 'Slice across the roots, like a CBCT image.' },
  { dur: 2.2, hold: 2.4, zoom: 0.55, focus: FOCUS, labels: ['One canal', 'Second canal'], caption: 'A flat ribbon canal, and sometimes a second, lingual canal.' },
  { fov: 26, dur: 2.4, hold: 2.6, theta: 0.0, phi: 0.3, zoom: 0.5, focus: [X42 / 2, CUT, -0.2], drift: 0, labels: ['Flat root', 'One canal', 'Second canal'], caption: '' }
]);
fig.start();
