// Example: maxillary right first molar (FDI 16 = Universal 3), crown up (extracted-tooth convention).
// Teaching point: MB2 opens ~1.9 mm palatal to MB1, outside the classic MB1–DB–P access triangle,
// and hides behind MB1 on a straight buccal radiograph.
const CUT = -2.6;   // axial cut just below the pulp-chamber floor, where the four orifices are separate

const fig = DK.figure({
  title: 'Why MB2 gets missed',
  subtitle: 'Upper first molar (FDI 16), crown up, cut at the canal orifices.',
  view: { theta: 0, phi: 1.5 }
});

const tooth = DK.tooth(16);
const s = tooth.spec, L = tooth.layers;
fig.part(tooth.group, { name: 'Tooth 16', label: false, info: 'Upper right first molar: 3 roots (MB, DB, P), 4 canals when MB2 is present.' });

// orifice markers that follow the cut and fade in with their labels
const at = (n, y) => DK.canalAt(s, n, y);
const markers = {}, labelOf = {};
const INFO = {
  MB1: 'Main mesiobuccal canal. The one a triangular access finds.',
  MB2: 'Present in about 57% (pooled) to 74% (worldwide CBCT) of upper first molars. Often under a dentin shelf.',
  DB: 'Distobuccal canal: 1 canal in about 98%.',
  P: 'Palatal canal: the widest, 1 canal in over 99%.'
};
const gap = Math.hypot(at('MB1', CUT).x - at('MB2', CUT).x, at('MB1', CUT).z - at('MB2', CUT).z);
['MB1', 'MB2', 'DB', 'P'].forEach(n => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(n === 'MB2' ? 0.42 : 0.34, 32), new THREE.MeshBasicMaterial({ color: n === 'MB2' ? DK.color(0xB4541A) : fig.accent.clone(), transparent: true, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; tooth.group.add(m); markers[n] = m;
  labelOf[n] = fig.part(m, { inPlace: true, name: n, sub: n === 'MB2' ? `${gap.toFixed(1)} mm palatal to MB1` : '', anchor: [0, 0, 0], info: INFO[n], accent: n === 'MB2',
    when: (e, sec) => sec.enabled });
});

// classic triangular access outline joining MB1, DB and P (a flat ribbon: WebGL lines are always 1 px)
const tri = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: fig.accent.clone(), transparent: true, toneMapped: false, side: THREE.DoubleSide }));
tooth.group.add(tri);
function ribbon(pts, w) {
  const v = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
    const q = [[a.x - nx, a.z - nz], [a.x + nx, a.z + nz], [b.x + nx, b.z + nz], [b.x - nx, b.z - nz]];
    [0, 1, 2, 0, 2, 3].forEach(k => v.push(q[k][0], a.y, q[k][1]));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}
let triY = null;

const sec = fig.enableSection([0, 1, 0], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-6, s.crownL], offset: CUT } });
const ORIFICES = { theta: 0.3, phi: 0.5, zoom: 0.8, section: true, offset: CUT, xray: 0 };
fig.view('Orifices', ORIFICES);
fig.view('Radiograph', { theta: 0, phi: 1.5, zoom: 1.1, section: false, xray: 1 });
fig.xray([L.enamel, L.dentin, L.root], false);

fig.story([
  { dur: 0, hold: 1.6, xray: 1, zoom: 1.25, labels: [], caption: 'On a buccal radiograph the MB root shows one canal.' },
  { dur: 1.8, hold: 0.4, theta: ORIFICES.theta, phi: ORIFICES.phi, zoom: ORIFICES.zoom, xray: 0, section: true, offset: s.crownL, caption: '' },
  { dur: 1.4, hold: 0.3, offset: CUT },
  { dur: 0.5, hold: 1.6, labels: ['MB1', 'DB', 'P'], caption: 'A triangular access finds three canals.' },
  { dur: 0.5, hold: 2.2, labels: ['MB1', 'DB', 'P', 'MB2'], caption: 'MB2 opens just palatal to MB1, outside the triangle.' }
]);

fig.onFrame(() => {
  const y = sec.offset, on = sec.enabled;
  Object.keys(markers).forEach(n => { const c = at(n, y), m = markers[n]; m.position.set(c.x, y + 0.12, c.z); m.visible = on; m.material.opacity = labelOf[n].alpha; });
  if (y !== triY) { triY = y; tri.geometry.dispose(); tri.geometry = ribbon(['MB1', 'DB', 'P', 'MB1'].map(n => { const c = at(n, y); return new THREE.Vector3(c.x, y + 0.08, c.z); }), 0.16); }
  tri.visible = on; tri.material.opacity = labelOf.MB1.alpha * 0.9;
});
fig.start();
