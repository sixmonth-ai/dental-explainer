// Procedure: socket (ridge) preservation after extracting the lower right first molar (FDI 46 = Universal 30), seen in a bucco-lingual cut.
// poster: step 5
// The tooth comes out, the empty socket is packed with bone graft granules, the gum closes, and months later the ridge still has its width
// (an accent outline shows the typical collapse without a graft); an implant then goes into the kept bone. Camera on +x (mesial) looks at
// the cut: buccal (+z) on the viewer's left. Frame: +x = mesial, +z = buccal, CEJ at y = 0, mm.
const CREST = -1.8, GUM_Y = 1.1;
const BONE = { width: 14, height: 22, depth: 11, cortical: 1.2, crest: 1.6 };
const CUT = 2.0;                                   // through the mesial root
const LOSS = { width: 3.8, height: 1.2 };          // typical ridge change ~6 months after extraction without a graft (about; Tan et al. 2012 review)
const IMPLANT = { diameter: 4.8, length: 10, lead: 1.6 };

const fig = DK.figure({
  fov: 28,
  title: 'Bone graft after extraction',
  subtitle: 'Socket preservation, lower right first molar, FDI 46 (Universal 30).',
  view: { theta: 0.75, phi: 1.25 }
});
const s = DK.toothPreset(46);

// ---------- context: bone and gum around the tooth ----------
const bone = DK.bone(BONE); bone.position.y = CREST;
const gum = DK.gingiva({ width: 14, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] });
gum.position.y = GUM_Y;
const tooth = DK.tooth(46);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the molar: a thin cortical wall on the cheek side over spongy bone.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the ridge.' });
const frame = new THREE.Mesh(new THREE.BoxGeometry(BONE.width, 23.5, BONE.depth), new THREE.MeshBasicMaterial({ visible: false }));   // what the camera frames: ridge + crown
frame.position.y = -6.6;
fig.part(frame, { name: 'frame', label: false });
fig.part(tooth.group, { name: 'Tooth 46', sub: 'to be removed', fit: false, anchor: [0, s.crownL + 0.5, 0], info: 'Lower right first molar: two roots, mesial and distal.' });
fig.part(bone, { inPlace: true, name: 'Thin cheek-side wall', anchor: (e, sec) => [(sec.enabled ? sec.offset : CUT) + 0.1, -3.2, 4.85], dim: false,
  info: 'The bone on the cheek side of a molar socket is thin and depends on the tooth. Without it, it is the first to shrink away.' });

// ---------- the socket: an empty space that only shows on the cut ----------
const prism = (md, bl, y0, y1, rows) => DK.gridGeometry(rows, 64, (i, j) => {   // superellipse prism (cervical outline of the tooth); y1 may be a function of z
  const th = j / 64 * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), n = 2.6, z = bl / 2 * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n);
  const top = typeof y1 === 'function' ? y1(z) : y1;
  return [md / 2 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y0 + (top - y0) * i / rows, z];
}, [0, typeof y1 === 'function' ? y1(0) : y1, 0], [0, y0, 0]);
const gumTop = z => GUM_Y + 0.8 - 1.4 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(z / 5.4, 2)))) - 0.12;   // just under the gum surface over the socket
const holeMat = () => DK.mat('cavity', { color: DK.voidColor(fig), cap: DK.holeCap(fig) });
const socket = DK.pdl(s, 0.25, CREST);                                      // the root sockets
socket.traverse(m => { if (m.isMesh) m.material = holeMat(); });
const neck = new THREE.Mesh(prism(s.mdC + 0.5, s.blC + 0.5, -(s.trunk + 0.4), CREST + 0.05, 6), holeMat());   // the trunk part, bone level
const gumHole = new THREE.Mesh(prism(s.mdC + 0.5, s.blC + 0.5, CREST + 0.05, gumTop, 4), holeMat());   // the opening through the gum
socket.add(neck);
[socket, gumHole].forEach(o => { o.userData.cutOnly = true; o.visible = false; fig.world.add(o); });
fig.part(neck, { inPlace: true, name: 'Empty socket', anchor: (e, sec) => [(sec.enabled ? sec.offset : CUT) + 0.1, -6, 0.4], dim: false, info: 'The hole the roots leave. Left alone it fills with clot and then bone, but the ridge around it shrinks as it heals.' });

// ---------- bone graft: granules packed into the socket (a fill level the step animates) ----------
const granules = (() => {   // particulate graft texture: irregular pale granules (~0.3–1 mm) in a darker clot
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#b8a688'; x.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) {
    const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), shade = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      x.beginPath();
      for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); x.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); }
      x.closePath(); x.fillStyle = `rgb(${shade},${shade - 6},${shade - 20})`; x.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 7; return t;
})();
const graftMat = DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 });
const graft = new THREE.Group();
s.roots.forEach(r => graft.add(new THREE.Mesh(DK.pdl(s, 0.25, CREST).children[s.roots.indexOf(r)].geometry.clone(), graftMat)));
graft.add(new THREE.Mesh(prism(s.mdC + 0.5, s.blC + 0.5, -(s.trunk + 0.4), CREST + 0.25, 10), graftMat));
graft.children.forEach(m => { m.userData.y0 = Float32Array.from(m.geometry.attributes.position.array); });
const setFill = level => {   // clamp every vertex to the fill level: the graft is a closed solid with a flat top
  graft.visible = level > -15.5;
  graft.children.forEach(m => { const p = m.geometry.attributes.position, y0 = m.userData.y0; for (let i = 0; i < p.count; i++) p.setY(i, Math.min(y0[i * 3 + 1], level)); p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); });
};
fig.world.add(graft);
fig.part(graft, { inPlace: true, name: 'Bone graft', sub: 'granules', anchor: (e, sec) => [(sec.enabled ? sec.offset : CUT) + 0.1, -5, -0.6], dim: false,
  info: 'Bone substitute granules packed into the socket. They hold the space and act as a scaffold that new bone grows through over the following months.' });

// ---------- the outline of the ridge without a graft (accent) ----------
const D2 = BONE.depth / 2 * 0.92;
const collapse = [[-D2 - 0.05, CREST - 9], [-D2, CREST - 4], [-D2 + 0.4, CREST - 2.1], [-D2 + 1.6, CREST - 1.35], [-1.2, CREST - LOSS.height], [0.4, CREST - LOSS.height - 0.25],
  [D2 - LOSS.width + 0.2, CREST - 2.1], [D2 - LOSS.width, CREST - 3.6], [D2 - LOSS.width * 0.55, CREST - 6.5], [D2 - 0.1, CREST - 10]];
const ribbon = (pts, w) => {   // flat band along a (z, y) polyline, in the plane x = 0
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(0, p[1], p[0]))), n = 120, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const P = curve.getPointAt(i / n), T = curve.getTangentAt(i / n), N = new THREE.Vector3(0, -T.z, T.y).normalize().multiplyScalar(w / 2);
    pos.push(P.x, P.y + N.y, P.z + N.z, P.x, P.y - N.y, P.z - N.z); if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
};
const lineMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthTest: false });
const outline = new THREE.Mesh(ribbon(collapse, 0.32), lineMat); outline.renderOrder = 999; outline.visible = false; fig.world.add(outline);
// the bone that would be lost: between today's ridge (graft top and buccal wall) and the collapsed outline, tinted
const lost = new THREE.Shape();
const lostPts = collapse.slice(2).concat([[D2, CREST - 10], [D2, CREST - 2.0], [D2 - 0.7, CREST - 0.9], [D2 - 2.2, CREST + 0.2], [0, CREST + 0.25], [-D2 + 2.2, CREST - 0.1], [-D2 + 0.9, CREST - 1.2]]);
lostPts.forEach((p, i) => i ? lost.lineTo(p[0], p[1]) : lost.moveTo(p[0], p[1]));
const fillMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false });
const lostFill = new THREE.Mesh(new THREE.ShapeGeometry(lost, 24), fillMat); lostFill.rotation.y = -Math.PI / 2; lostFill.renderOrder = 998; outline.add(lostFill);
fig.part(outline, { inPlace: true, name: 'Lost without a graft', sub: `about ${LOSS.width} mm of width`, anchor: [0, CREST - 3.0, D2 - 1.3], labelOffset: [-60, 80], accent: true, dim: false,
  info: `Typical healing without a graft: in the first 6 months the ridge loses about ${LOSS.width} mm of width (mostly on the cheek side) and about ${LOSS.height} mm of height. A graft reduces this loss; it does not stop it completely.` });
fig.part(bone, { inPlace: true, name: 'Ridge kept', anchor: (e, sec) => [(sec.enabled ? sec.offset : CUT) + 0.1, CREST - 0.9, 3.6], dim: false, info: 'With the socket grafted, the ridge keeps most of its width and height: room for an implant of normal size.' });

// ---------- the implant at the end ----------
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' });
const heal = DK.lathe([[0, 0], [IMPLANT.diameter / 2, 0], [2.6, 2.6], [2.6, 3.9], [2.3, 4.1], [0, 4.1]], 48, DK.mat('titanium'));
[implant, heal].forEach(o => { o.visible = false; fig.world.add(o); });
fig.part(implant, { inPlace: true, name: 'Implant', sub: 'in the kept bone', anchor: [IMPLANT.diameter / 2 + 0.1, -5, 0], info: `An implant (here about Ø${IMPLANT.diameter} × ${IMPLANT.length} mm) placed once the graft has healed, usually after about 4 to 6 months.` });

// ---------- params ----------
fig.param('out', 0, k => { tooth.group.visible = k < 0.999; tooth.group.position.y = 22 * k * k; tooth.group.rotation.x = 0.12 * Math.sin(Math.min(k * 4, 1) * Math.PI); socket.visible = k > 0.02; gumHole.visible = k > 0.02; });
fig.param('fill', -16, setFill);
fig.param('close', 0, k => { gumHole.scale.set(1 - k, 1, 1 - k); gumHole.visible = gumHole.visible && k < 0.98; });
fig.param('ghost', 0, k => { lineMat.opacity = k; fillMat.opacity = 0.34 * k; outline.visible = k > 0.01; });
fig.param('implant', 0, k => {
  const travel = (1 - k) * (IMPLANT.length + 4);
  implant.visible = heal.visible = k > 0.001; implant.position.y = CREST + travel; implant.rotation.y = -travel / IMPLANT.lead * Math.PI * 2;
  heal.position.y = CREST + travel;
});
fig.onFrame(() => { outline.position.x = (fig.section.enabled ? fig.section.offset : CUT) + 0.12; });

// ---------- section: bucco-lingual (mesial half removed, camera on +x) ----------
fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [socket, gumHole], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [graft], color: 0xfaf3e4, texture: granules },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.dentin, tooth.layers.root], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });

// ---------- procedure ----------
const CUTVIEW = { theta: Math.PI / 2 - 0.55, phi: 1.32 };
fig.procedure([
  { label: 'Tooth to remove', caption: 'A lower molar that cannot be saved.', beats: [
    { fov: 32, dur: 0, hold: 1.0, theta: 0.75, phi: 1.25, zoom: 1.3, section: false, labels: ['Tooth 46'] },
    { fov: 28, dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.4, hold: 1.6, theta: CUTVIEW.theta, phi: CUTVIEW.phi, zoom: 1.3, offset: CUT, labels: ['Tooth 46', 'Thin cheek-side wall'], key: true }] },
  { label: 'Extraction', caption: 'The tooth is removed as gently as possible, keeping the socket walls.', beats: [
    { dur: 2.4, hold: 0.2, set: { out: 1 }, labels: [] },
    { dur: 1.4, hold: 1.6, zoom: 1.12, focus: [0, -6.6, 0], labels: ['Empty socket', 'Thin cheek-side wall'], key: true }] },
  { label: 'Graft', caption: 'The socket is packed with bone graft granules.', beats: [
    { dur: 2.6, hold: 0.4, set: { fill: CREST + 0.25 }, labels: ['Bone graft'] },
    { dur: 1.0, hold: 1.4, labels: ['Bone graft'], key: true }] },
  { label: 'Gum closes', caption: 'The gum closes over the graft while it heals.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 1.12, focus: [0, -6.6, 0], labels: [] },
    { dur: 2.0, hold: 1.4, set: { close: 1 }, labels: ['Bone graft'], key: true }] },
  { label: 'Months later', caption: 'Months later the ridge has kept its width; without a graft it would have shrunk.', beats: [
    { dur: 1.6, hold: 0.2, zoom: 1.15, focus: [0, -6.6, 0], labels: ['Ridge kept'] },
    { dur: 1.6, hold: 2.4, set: { ghost: 1 }, labels: ['Ridge kept', 'Lost without a graft', 'Bone graft'], key: true }] },
  { label: 'Implant', caption: 'An implant of normal size fits in the kept bone.', beats: [
    { dur: 1.4, hold: 0.1, set: { ghost: 0 }, offset: 0, labels: [] },
    { dur: 2.8, hold: 0.3, set: { implant: 1 }, labels: ['Implant'] },
    { dur: 1.8, hold: 2.2, theta: CUTVIEW.theta - 0.1, phi: 1.3, zoom: 1.3, focus: 'auto', labels: ['Implant', 'Bone graft'], key: true }] }
]);
fig.start();
