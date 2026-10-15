// Gap between the upper front teeth (midline diastema): the upper front teeth 13 to 23 (crowns down, in their gum) with a low labial frenum running into the gap and small lateral incisors. Frame: the DK.arch maxillary frame in 'jaw' placement (+x = patient's left, +z anterior (labial), y up; crowns point down, the CEJs at y = 0).
// poster: end
const GAP = 2.0;          // mm between the central incisors (schematic; a midline diastema is anything from a hairline up)
const SMALL = 0.78;       // the lateral incisors drawn at 78 % of the average size (about 5 mm wide instead of 6.5): small laterals, on purpose
const fig = DK.figure({
  fov: 30,
  title: 'Gap between front teeth',
  subtitle: "Upper front teeth FDI 13 to 23 (Universal 6 to 11), bite closed. Patient's right on the left.",
  view: { theta: 0.45, phi: 1.5, margin: 0.8 }
});
const FDI = [13, 12, 11, 21, 22, 23];
const lateral = f => f % 10 === 2;
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: FDI, build: crowns });
const scene = new THREE.Group(); scene.add(arch.group);
const T = f => arch.teeth.find(t => t.fdi === f);
// the lower front teeth in a normal bite underneath, for context: the inverse of the upper-teeth holder DK.mandible uses
// (upper CEJ plane 2.5 mm overbite above the lower incisal edges, 2.6 mm forward, tilted 0.05 rad)
const lowHold = new THREE.Group(); scene.add(lowHold);
const lowArch = DK.arch({ jaw: 'mandible', teeth: [43, 42, 41, 31, 32, 33], build: crowns }); lowHold.add(lowArch.group);
{ const H = new THREE.Matrix4().makeRotationX(-0.05).setPosition(0, DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, 2.6); lowHold.applyMatrix4(H.invert()); }

// --- place the six teeth along the arch line by chord steps from the midline (as DK.arch does), with a gap at the midline
// and the laterals at scale k; the canines then sit wherever the smaller laterals leave them
function layout(gap, k) {
  const out = {};
  [-1, 1].forEach(s => {
    let prev = arch.curve(0), x = 0;
    if (gap > 0) { let lo = 0, hi = gap; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, q = arch.curve(s * m); (Math.hypot(q[0] - prev[0], q[1] - prev[1]) < gap / 2 ? lo = m : hi = m); } x = (lo + hi) / 2; prev = arch.curve(s * x); }
    FDI.filter(f => (s < 0) === (Math.floor(f / 10) === 1)).sort((a, b) => a % 10 - b % 10).forEach(f => {
      const w = T(f).spec.md * (lateral(f) ? k : 1); let lo = x, hi = x + w + 1;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, q = arch.curve(s * m); (Math.hypot(q[0] - prev[0], q[1] - prev[1]) < w ? lo = m : hi = m); }
      const next = arch.curve(s * (lo + hi) / 2), c = [(prev[0] + next[0]) / 2, (prev[1] + next[1]) / 2];
      const tx = prev[0] - next[0], tz = prev[1] - next[1], tl = Math.hypot(tx, tz), t = [tx / tl, tz / tl];
      let n = [t[1], -t[0]]; if (n[0] * c[0] + n[1] * (c[1] + arch.depth / 2) < 0) n = [-n[0], -n[1]];
      out[f] = { c, t, n, md: w, side: s < 0 ? 'right' : 'left' }; prev = next; x = (lo + hi) / 2;
    });
  });
  return out;
}
const A = layout(0, 1), B = layout(GAP, SMALL);
const pose = (sl, k) => {
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(sl.t[0], 0, sl.t[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(sl.n[0], 0, sl.n[1]));
  m.scale(new THREE.Vector3(k, k, k)); m.setPosition(sl.c[0], 0, sl.c[1]);
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); m.decompose(p, q, s); return { p, q, s };
};
const poses = FDI.map(f => ({ g: T(f).tooth.group, a: pose(A[f], 1), b: pose(B[f], lateral(f) ? SMALL : 1) }));

// --- gum: a tall ridge (like a study model) for both layouts; same grid, so it morphs vertex by vertex
const GUM = { height: 5.5, depth: 3.4, rise: 2.0 };
scene.updateMatrixWorld(true);
const specB = f => lateral(f) ? Object.assign({}, T(f).spec, { md: T(f).spec.md * SMALL, mdC: T(f).spec.mdC * SMALL, bl: T(f).spec.bl * SMALL, blC: T(f).spec.blC * SMALL }) : T(f).spec;
const gumA = DK.gingivaArch({ group: arch.group, teeth: arch.teeth, slots: A }, GUM);
const gumB = DK.gingivaArch({ group: arch.group, teeth: arch.teeth.map(t => Object.assign({}, t, { spec: specB(t.fdi) })), slots: B }, GUM);
const gA = Float32Array.from(gumA.geometry.attributes.position.array), gB = gumB.geometry.attributes.position.array;
scene.add(gumA);
const gumLow = DK.gingivaArch(lowArch, { height: 5 }); scene.add(gumLow);

// --- the labial frenum: a thin fold of lining tissue on the midline, from high on the gum down into the papilla between the
// central incisors (a low attachment). Built against the gum's labial surface (ray cast at x = 0), standing out up to ~2.4 mm.
const gumGeoB = new THREE.Mesh(gumB.geometry, gumA.material); gumGeoB.updateMatrixWorld(true);
const ray = new THREE.Raycaster(), surf = [];
gumB.geometry.computeBoundingBox();
const bbB = gumB.geometry.boundingBox, yLow = bbB.min.y, yHigh = bbB.max.y;
const frenTop = yHigh - 0.6, frenBot = yLow + 1.2;   // frame y: up is apical for these crown-down teeth
for (let i = 0; i <= 24; i++) {
  const y = frenBot + (frenTop - frenBot) * i / 24; ray.set(new THREE.Vector3(0, y, 40), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(gumGeoB)[0]; surf.push([y, hit ? hit.point.z : null]);
}
const ok = surf.filter(s => s[1] !== null);
const NV = ok.length, NU = 16, fpos = [], fidx = [];
ok.forEach(([y, z], j) => {
  const u = j / (NV - 1), stand = 0.25 + 1.5 * Math.pow(u, 0.9), half = 0.3 + 0.2 * u;   // a thin fold, standing out more toward the lip
  for (let i = 0; i <= NU; i++) { const a = i / NU * Math.PI; fpos.push(-half * Math.cos(a), y, z - 0.3 + stand * Math.sin(a)); }
});
for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; fidx.push(a, c, b, b, c, d); }
const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3)); fg.setIndex(fidx); fg.computeVertexNormals();
const frenum = new THREE.Mesh(fg, DK.mat('gingiva', { color: 0xC98F88, side: THREE.DoubleSide, roughness: 0.45, clearcoat: 0.3 }));
scene.add(frenum);
gumB.geometry.dispose();

let open = 0;
fig.param('gap', 0, v => {
  open = v;
  poses.forEach(o => { o.g.position.lerpVectors(o.a.p, o.b.p, v); o.g.quaternion.copy(o.a.q).slerp(o.b.q, v); o.g.scale.lerpVectors(o.a.s, o.b.s, v); });
  const P = gumA.geometry.attributes.position.array; for (let i = 0; i < P.length; i++) P[i] = gA[i] + (gB[i] - gA[i]) * v;
  gumA.geometry.attributes.position.needsUpdate = true; gumA.geometry.computeVertexNormals();
  frenum.visible = true;
});

// --- parts and labels
fig.part(scene, { name: 'Upper front teeth', label: false, info: 'Upper canines, lateral and central incisors in their gum.' });
fig.part(gumA, { inPlace: true, name: 'Gum', label: false, info: 'Gum around the upper front teeth (schematic).' });
fig.part(gumLow, { inPlace: true, name: 'Lower gum', label: false, info: 'Gum around the lower front teeth (schematic).' });
lowArch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: 'FDI ' + t.fdi, label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: 'FDI ' + t.fdi, label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));
const t11 = T(11), t21 = T(21), t22 = T(22);
const gapPart = new THREE.Object3D(); scene.add(gapPart);
fig.part(gapPart, { inPlace: true, name: 'Gap', sub: 'diastema', accent: true, labelOffset: [80, 70], dim: false, when: () => open > 0.6,
  anchor: () => { const a = t11.tooth.group.localToWorld(new THREE.Vector3(0, t11.spec.crownL * 0.45, 2.2)), b = t21.tooth.group.localToWorld(new THREE.Vector3(0, t21.spec.crownL * 0.45, 2.2)); return [(a.x + b.x) / 2, (a.y + b.y) / 2, Math.max(a.z, b.z)]; },
  info: 'A space between the upper central incisors. Common and harmless in young children; it often closes when the canines erupt. In adults it can be closed with braces or aligners, or with bonding, usually with a retainer afterwards.' });
const fA = ok[Math.round(NV * 0.55)];
fig.part(frenum, { inPlace: true, name: 'Low frenum', sub: 'tissue into the gap', anchor: [0, fA[0], fA[1] + 1.6], labelOffset: [90, -60], dim: false,
  info: 'The labial frenum is the fold that ties the upper lip to the gum. When it attaches low, down between the front teeth, its fibres can hold them apart. A small surgery (frenectomy) is sometimes done, usually with or after orthodontics.' });
fig.part(t22.tooth.group, { inPlace: true, name: 'Small lateral', sub: 'smaller than average', anchor: [0, t22.spec.crownL * 0.5, 2.6], labelOffset: [80, 60], dim: false, when: () => open > 0.6,
  info: 'Upper left lateral incisor, FDI 22 (Universal 10), drawn smaller than average (narrow or peg-shaped laterals are a common variation). Small teeth leave spare room, so the front teeth space out.' });

fig.view('Front', { theta: 0, phi: 1.52, zoom: 0.8, focus: 'auto', set: { gap: 1 }, labels: ['Gap', 'Low frenum', 'Small lateral'] });
fig.view('Closed', { theta: 0, phi: 1.52, zoom: 0.8, focus: 'auto', set: { gap: 0 }, labels: [] });

const M = [0, 6, 1];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.45, phi: 1.5, zoom: 1, labels: [], caption: 'The upper front teeth.' },
  { dur: 2.2, hold: 0.2, theta: 0, phi: 1.52, zoom: 0.85, labels: [] },
  { dur: 2.4, hold: 1.6, set: { gap: 1 }, labels: ['Gap'], caption: 'A gap opens between the two front teeth.' },
  { dur: 2.2, hold: 2.0, theta: 0.25, phi: 1.85, zoom: 0.5, focus: [0, 2, 3], labels: ['Low frenum'], caption: 'A low frenum can hold them apart.' },
  { dur: 2.2, hold: 2.0, theta: 0.55, phi: 1.52, zoom: 0.5, focus: [11, -4, -3], labels: ['Small lateral'], caption: 'Small side teeth leave spare room.' },
  { dur: 2.4, hold: 2.4, theta: 0.22, phi: 1.52, zoom: 0.88, focus: 'auto', labels: ['Gap', 'Low frenum', 'Small lateral'] }
]);
fig.start();
