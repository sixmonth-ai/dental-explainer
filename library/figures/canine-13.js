// Library: maxillary right canine (FDI 13 = Universal 6), crown up (extracted-tooth convention), then beside a central incisor (11) for scale. Tooth frame: CEJ at y = 0, +x mesial, +z labial.
// poster: end
// Teaching point: one pointed cusp on top of the longest root in the mouth (about 17 mm against 13 mm for the central incisor), which is why the canine anchors the corner of the arch.
const fig = DK.figure({
  fov: 32,
  title: 'Upper canine, the longest root',
  subtitle: 'FDI 13 (Universal 6), crown up, beside a central incisor.',
  view: { theta: 0.55, phi: 1.38 }
});

const canine = DK.tooth(13), s = canine.spec, R = s.roots[0];
const inc = DK.tooth(11), si = inc.spec, Ri = si.roots[0];
const GAP = 3.5, INC_X = s.md / 2 + si.md / 2 + GAP;      // the incisor stands mesial to the canine, CEJs level
inc.group.position.x = INC_X;
canine.group.updateMatrixWorld(true); inc.group.updateMatrixWorld(true);

const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();
const hit = (objs, from, dir, lift = 0.05) => {
  ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir).normalize());
  const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
  return h ? [h.point.x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
};

// --- a length bar beside a root, CEJ to apex: a flat ribbon with end ticks (WebGL lines are 1 px)
function lengthBar(len, color, x, z) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.22), mat); g.add(bar);
  const t0 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.22), mat), t1 = t0.clone(); g.add(t0, t1);
  [bar, t0, t1].forEach(m => { m.castShadow = false; m.receiveShadow = false; });
  g.position.set(x, 0, z);
  g.userData.set = k => {                                   // k 0..1 draws the bar down from the CEJ
    const L = Math.max(len * k, 0.01); g.visible = k > 0.01;
    bar.scale.y = L; bar.position.y = -L / 2; t1.position.y = -L; t1.visible = k > 0.98;
  };
  g.userData.mat = mat; g.userData.set(0);
  return g;
}
const apexOf = r => [r.x + r.apex[0], -r.len, r.z + r.apex[1]];
const cApex = apexOf(R), iApex = apexOf(Ri);
const BAR_Z = 0;                                           // in the plane of the root axes, so both bars line up with their apices
const cBar = lengthBar(R.len, fig.accent.clone(), -s.md / 2 - 1.6, BAR_Z);
const iBar = lengthBar(Ri.len, DK.color(fig.dark ? 0x9c978d : 0x6e6a62), INC_X + si.md / 2 + 1.0, BAR_Z);
canine.group.add(cBar); fig.world.add(iBar);

fig.part(canine.group, { name: 'Tooth 13', label: false, info: 'Upper right canine (Universal 6): one cusp, one root, the longest tooth in the mouth (about 27 mm overall).' });
fig.part(inc.group, { name: 'Central incisor', sub: `root ${Ri.len} mm`, anchor: [0, -Ri.len * 0.55, Ri.rb * 0.9], labelOffset: [60, 0],
  info: 'Upper central incisor (FDI 11), shown for scale: crown 10.5 mm, root 13 mm.' });

const pTip = hit([canine.layers.enamel], [0.3, 40, 0.4], [0, -1, 0]) || [0, s.crownL + 1, 0];
const pMesSlope = hit([canine.layers.enamel], [s.md * 0.28, 40, 0.6], [0, -1, 0]) || pTip;
const pDisSlope = hit([canine.layers.enamel], [-s.md * 0.3, 40, 0.6], [0, -1, 0]) || pTip;
fig.part(canine.layers.enamel, { inPlace: true, name: 'Cusp tip', sub: 'one pointed cusp', anchor: pTip, labelOffset: [-70, -30],
  info: 'A single cusp. Its mesial slope is shorter than its distal slope, so the tip sits a little mesial of centre.' });
fig.part(canine.layers.enamel, { inPlace: true, name: 'Mesial slope', sub: 'shorter', anchor: pMesSlope, labelOffset: [70, -20],
  info: 'The shorter of the two cusp ridges, toward the midline.' });
fig.part(canine.layers.enamel, { inPlace: true, name: 'Distal slope', sub: 'longer', anchor: pDisSlope, labelOffset: [-80, 10],
  info: 'The longer cusp ridge, toward the premolars.' });
const rootPart = fig.part(cBar, { inPlace: true, name: 'Root', sub: `${R.len} mm, the longest`, accent: true, dim: false, anchor: [0, -R.len * 0.55, 0], labelOffset: [-70, 0],
  info: 'About 17 mm: the longest root in the dentition, anchored deep in the bone at the corner of the arch. That is why canines last and why they guide the jaw sideways.' });
fig.part(iBar, { inPlace: true, name: 'Incisor root', sub: `${Ri.len} mm`, dim: false, anchor: [0, -Ri.len * 0.55, 0], labelOffset: [70, 0], when: () => iBar.visible,
  info: 'The central incisor root, about 13 mm, for comparison.' });

// params: the canine's bar draws down; the incisor slides in beside it, then its bar draws
const incBase = inc.group.position.clone();
fig.param('cbar', 0, k => cBar.userData.set(k));
fig.param('ibar', 0, k => iBar.userData.set(k));
fig.param('inc', 0, k => {
  inc.group.visible = k > 0.01;
  inc.group.position.set(incBase.x + (1 - k) * 14, incBase.y, incBase.z);
});

const CUSP = [0, s.crownL - 0.5, 0];
fig.view('Labial', { theta: 0.03, phi: 1.45, zoom: 0.6, focus: CUSP, labels: ['Cusp tip', 'Mesial slope', 'Distal slope'] });
fig.view('Compare', { theta: 0.1, phi: 1.49, zoom: 1.04, focus: 'auto', set: { inc: 1, cbar: 1, ibar: 1 }, labels: ['Cusp tip', 'Root', 'Incisor root'] });
fig.standardControls({ explode: false });

// story: the canine alone → from the lip, the single pointed cusp → push in on the cusp slopes → from the distal, the root
// measured CEJ to apex → an incisor slides in beside it for scale → hero: both, front three-quarter, two lengths side by side
const MID = [0, (s.crownL - R.len) / 2, 0];   // the canine's own centre, while the incisor is still off stage
fig.story([
  { fov: 36, dur: 0, hold: 1.4, theta: 0.55, phi: 1.38, zoom: 1.2, focus: MID, set: { inc: 0, cbar: 0, ibar: 0 }, labels: [], caption: 'An upper canine, crown up.' },
  { fov: 30, dur: 2.2, hold: 1.6, theta: 0.03, phi: 1.5, zoom: 1.15, labels: ['Cusp tip'], caption: 'One pointed cusp.' },
  { dur: 2.0, hold: 2.2, zoom: 0.6, phi: 1.42, focus: CUSP, labels: ['Mesial slope', 'Distal slope'], caption: 'The mesial slope is shorter, so the tip sits mesial of centre.' },
  { dur: 2.4, hold: 0.3, theta: -0.45, phi: 1.5, zoom: 1.2, focus: MID, labels: [] },
  { dur: 2.2, hold: 2.0, ease: 'out', set: { cbar: 1 }, labels: ['Root'], caption: 'Its root runs about 17 mm into the bone, the longest in the mouth.' },
  { fov: 26, dur: 2.4, hold: 0.4, theta: 0.08, phi: 1.5, zoom: 1.04, focus: 'auto', set: { inc: 1 }, labels: ['Root', 'Central incisor'], caption: 'A central incisor for scale.' },
  { dur: 1.8, hold: 2.8, theta: 0.1, phi: 1.49, drift: 0, set: { ibar: 1 }, labels: ['Cusp tip', 'Root', 'Incisor root'], caption: '' }
]);
fig.start();
