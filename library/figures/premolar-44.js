// Library: two mandibular right first premolars (FDI 44 = Universal 28), crown up, seen from mesial and cut bucco-lingually through the canal: the usual one-canal tooth beside the variant whose canal divides in the root. Tooth frame: CEJ at y = 0, +x mesial, +z buccal; each tooth is turned so its mesial faces the camera (world +z), buccal on the viewer's left.
// poster: end
// Teaching point: one root, a tall buccal cusp and a tiny lingual cusp; in about a quarter of these teeth the canal divides into a buccal and a lingual canal in the root (Cleghorn 2007: 1 canal 75.8%, 2 or more 24.2%).
const fig = DK.figure({
  fov: 30,
  title: 'Lower first premolar',
  subtitle: 'FDI 44 (Universal 28), crown up, seen from mesial.',
  view: { theta: 0.6, phi: 1.36 }
});
const { lerp, smooth } = DK.util;
// the variant's two branches (offset in mm, +z buccal): the buccal one carries straight on, the lingual one leaves at a sharper angle
const branch = (side, u) => side > 0 ? 0.35 * smooth(0.5, 0.75, u) - 0.15 * smooth(0.8, 1, u) : -(1.15 * smooth(0.5, 0.7, u) - 0.7 * smooth(0.75, 1, u));
const GAP = 12.5;   // mm between the two teeth (world x)

const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const toLocal = (holder, p) => holder.worldToLocal(new THREE.Vector3(...p));

// canal material: the pulp's own
function build(xw, split) {
  const spec = DK.toothPreset(44); spec.roots = spec.roots.map(r => Object.assign({}, r, { apex: [0, 0] }));   // a straight root keeps the whole canal on the cut
  const tooth = DK.tooth(spec), s = tooth.spec, L = tooth.layers;
  const holder = new THREE.Group(); holder.position.x = xw; holder.rotation.y = -Math.PI / 2; holder.add(tooth.group);
  // the kit's single canal is replaced by tubes on the same centre line, so the variant can divide
  Object.values(L.pulp.userData.canals || {}).forEach(m => { m.visible = false; });
  L.pulp.children.forEach(m => { if (m !== L.pulp.userData.chamber) m.visible = false; });
  const R = s.roots[0], y0 = -0.4, yA = -R.len + 0.3;   // the canals open at the apical foramen
  const c = y => DK.canalAt(s, 0, y);
  const pt = (u, dz) => { const y = lerp(y0, yA, u), k = c(y); return [k.x, y, k.z + dz]; };
  const mat = tooth.mats.pulp, tubes = [];
  if (!split) {
    const pts = []; for (let i = 0; i <= 30; i++) pts.push(pt(i / 30, 0));
    tubes.push([DK.tube(pts, 0.42, mat, { taper: t => lerp(1, 0.32, t), segments: 80 })]);
  } else {
    const US = 0.5;   // the canal divides at mid-root
    const trunk = []; for (let i = 0; i <= 15; i++) trunk.push(pt(US * i / 15, 0));
    tubes.push([DK.tube(trunk, 0.42, mat, { taper: t => lerp(1, 0.62, t), segments: 50 })]);
    [1, -1].forEach(side => {
      const pts = []; for (let i = 0; i <= 20; i++) { const u = US + (1 - US) * i / 20; pts.push(pt(u, branch(side, u))); }
      tubes.push([DK.tube(pts, 0.25, mat, { taper: t => lerp(1, 0.6, t), segments: 50 })]);
    });
  }
  tubes.forEach(([m]) => tooth.group.add(m));
  holder.updateMatrixWorld(true);
  return { tooth, s, L, holder, tubes: tubes.map(t => t[0]), pt };
}
const A = build(-GAP / 2, false), B = build(GAP / 2, true);
[A, B].forEach(t => fig.part(t.holder, { name: t === A ? 'Usual' : 'Variant', label: false,
  info: t === A ? 'Lower right first premolar (Universal 28) with one root and one canal, the usual pattern (about 3 in 4).'
    : 'The same tooth with a canal that divides in the root into a buccal and a lingual canal (about 1 in 4).' }));

// surface points: cast in world space at a tooth, return the point in that tooth's frame
const hit = (t, layer, fromLocal, dirLocal, lift = 0.05) => {
  const o = t.tooth.group.localToWorld(new THREE.Vector3(...fromLocal));
  const d = new THREE.Vector3(...dirLocal).applyQuaternion(t.holder.quaternion).normalize();
  ray.set(o, d);
  const h = ray.intersectObjects(meshesOf(layer), false)[0];
  if (!h) return null;
  const p = t.tooth.group.worldToLocal(h.point.clone().addScaledVector(d, -lift));
  return [p.x, p.y, p.z];
};
const CUTL = DK.canalAt(A.s, 0, -A.s.roots[0].len * 0.55).x;   // local x of the canal at mid-root: the cut runs through it
const CUT = CUTL;                                             // local +x (mesial) is world +z, so the world offset is the same number
const tipB = hit(A, A.L.enamel, [CUTL, 30, A.s.bl * 0.17], [0, -1, 0]) || [0, A.s.crownL + 1.5, 1];
const tipL = hit(A, A.L.enamel, [CUTL, 30, -A.s.bl * 0.3], [0, -1, 0]) || [0, A.s.crownL - 1, -2];
fig.part(A.L.enamel, { inPlace: true, name: 'Buccal cusp', sub: 'tall', anchor: tipB, labelOffset: [-70, -30],
  info: 'The large, pointed buccal cusp does most of the work; the crown tilts toward the tongue so this cusp sits over the middle of the root.' });
fig.part(A.L.enamel, { inPlace: true, name: 'Lingual cusp', sub: 'tiny', anchor: tipL, labelOffset: [40, -50],
  info: 'A small, non-functional lingual cusp, much shorter than the buccal cusp: the lower first premolar looks almost like a small canine from the side.' });
const rootPt = (() => { const R = A.s.roots[0], y = -R.len * 0.62, k = DK.canalAt(A.s, 0, y); return [k.x, y, k.z + R.rb * 0.45]; })();
fig.part(A.L.dentin, { inPlace: true, name: 'One root', anchor: rootPt, labelOffset: [-70, 20], when: (e, sec) => !sec.enabled,
  info: 'One root in about 98% of lower first premolars (two roots 1.8%, three 0.2%).' });
const mid = A.pt(0.55, 0);
fig.part(A.tubes[0], { inPlace: true, name: 'One canal', sub: 'about 3 in 4', anchor: () => [mid[0], mid[1], mid[2]], labelOffset: [-80, 10], dim: false,
  when: (e, sec) => sec.enabled, info: 'A single canal from the pulp chamber to the apex in about three quarters of these teeth (75.8% in a review of more than 6,700 teeth).' });
const fork = B.pt(0.8, branch(-1, 0.8) - 0.1);
fig.part(B.tubes[2], { inPlace: true, name: 'Second canal', sub: 'about 1 in 4', anchor: () => fork, labelOffset: [80, 20], accent: true, dim: false,
  when: (e, sec) => sec.enabled, info: 'In about a quarter (24.2%) the canal divides in the middle or apical third into a buccal and a lingual canal. The lingual one leaves at a sharp angle and is easy to miss, so a file that follows the straight canal never enters it.' });

const both = f => [f(A), f(B)].flat();
fig.enableSection([0, 0, 1], [
  { objects: both(t => [t.L.enamel]), color: DK.COLORS.enamelCap },
  { objects: both(t => [t.L.root, t.L.dentin]), color: DK.COLORS.dentinCap },
  { objects: both(t => [t.L.pulp.userData.chamber]), color: DK.COLORS.pulpCap },
  { objects: [A.tubes[0], B.tubes[0]], color: DK.COLORS.pulpCap },
  { objects: [B.tubes[1]], color: DK.COLORS.pulpCap },
  { objects: [B.tubes[2]], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 4], offset: CUT } });
fig.view('Mesial', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Buccal cusp', 'Lingual cusp', 'One root'] });

// story: two lower first premolars turning → straight from mesial: a tall buccal cusp, a tiny lingual one, one root →
// the cut sweeps in: one canal in the usual tooth → push in on the variant: the canal divides → hero, both cut, three-quarter
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.7, phi: 1.32, zoom: 1.08, section: false, labels: [], caption: 'Two lower first premolars, crown up.' },
  { fov: 30, dur: 2.4, hold: 2.2, theta: 0.02, phi: 1.5, zoom: 1.0, labels: ['Buccal cusp', 'Lingual cusp', 'One root'], caption: 'From the side: a tall buccal cusp, a tiny lingual cusp, one root.' },
  { dur: 0, hold: 0, section: true, offset: 5 },
  { fov: 26, dur: 2.2, hold: 2.0, offset: CUT, labels: ['One canal'], caption: 'Cut open: most have one canal.' },
  { dur: 2.2, hold: 2.4, zoom: 0.62, focus: [GAP / 2, -8.5, 0], labels: ['Second canal'], caption: 'In about a quarter, it divides in the root.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: 0.3, phi: 1.42, zoom: 1.02, focus: 'auto', drift: 0, labels: ['Buccal cusp', 'Lingual cusp', 'One canal', 'Second canal'], caption: '' }
]);
fig.start();
