// Procedure: how an extraction socket heals, lower right first molar (FDI 46 = Universal 30) between 45 and 47, mesio-distal cut seen from the cheek side. Frame: tooth frame of 46 (+x mesial, +z buccal, CEJ at y = 0, mm); 45 at +x, 47 at -x.
// poster: step 5
// Blood clot (day 1) → granulation tissue (about week 1) → gum closes over it (about weeks 2 to 4) → woven bone fills the socket from its
// floor and walls (about weeks 4 to 8) → bone matures and the crest settles a little (about months 3 to 6). Timings are approximate
// (human biopsy series, Amler 1969; Cardaropoli 2003 in dogs; ridge change, Schropp 2003); not in dental-facts.md, so shown as "about".
const CREST = -1.8, GUM_TOP = 1.1, GUM_H = 3.4;
const s46 = DK.toothPreset(46), s45 = DK.toothPreset(45), s47 = DK.toothPreset(47);
const X45 = s46.md / 2 + s45.md / 2 + 0.2, X47 = -(s46.md / 2 + s47.md / 2 + 0.2);
const BONE_TOP = CREST - 0.7;                       // where the new bone ends: a little below the old crest (the ridge settles)

const fig = DK.figure({
  fov: 28,
  title: 'How a socket heals',
  subtitle: 'After removing a lower right first molar, FDI 46 (Universal 30). Times approximate.',
  view: { theta: 0.55, phi: 1.2, margin: 0.9 }
});

// ---------- context: bone, gum and the neighbours ----------
const bone = DK.bone({ width: 36, height: 21, depth: 11, cortical: 1.2, crest: 1.6 });
bone.position.y = CREST;
const gum = DK.gingiva({ width: 36, height: GUM_H, depth: 11.6, crest: 1.4, around: [
  { x: X45, z: 0, md: s45.mdC, bl: s45.blC }, { x: 0, z: 0, md: s46.mdC, bl: s46.blC }, { x: X47, z: 0, md: s47.mdC, bl: s47.blC }] });
gum.position.y = GUM_TOP;
const t45 = DK.tooth(45), t47 = DK.tooth(47), t46 = DK.tooth(46);
t45.group.position.x = X45; t47.group.position.x = X47;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the socket: a cortical shell over spongy (trabecular) bone.' });
fig.part(gum, { name: 'Gum', sub: 'grows across', fit: false, anchor: (e, s) => [-2.2, GUM_TOP - 0.6, (s.enabled ? s.offset : 0) + 0.1], labelOffset: [-40, -70], dim: false,
  info: 'Gum edges creep across the socket and close it, usually within about 2 to 4 weeks.' });
fig.part(t45.group, { name: '45', label: false, fit: false, info: 'Lower right second premolar (Universal 29).' });
fig.part(t47.group, { name: '47', label: false, fit: false, info: 'Lower right second molar (Universal 31).' });
const frame = new THREE.Mesh(new THREE.BoxGeometry(30, 24, 11), new THREE.MeshBasicMaterial({ visible: false }));   // what the camera frames: the three teeth and the socket
frame.position.y = -5.5;
fig.part(frame, { name: 'frame', label: false });
fig.world.add(t46.group);
fig.part(t46.group, { inPlace: true, name: 'Tooth 46', sub: 'to be removed', anchor: [0, s46.crownL + 0.4, 0], dim: false, info: 'Lower right first molar: two roots, mesial and distal.' });

// ---------- the socket: what the two roots and the trunk leave behind ----------
const rootGeos = DK.tooth(46, { omit: ['enamel', 'dentin', 'pulp'] }).layers.root.children.map(m => m.geometry);
const collarGeo = (add, top) => DK.rootGeometry({ x: 0, z: 0, len: top - CREST + 0.6, ra: s46.mdC / 2 + 0.25 + add, rb: s46.blC / 2 + 0.25 + add, taper: 0.1, start: top }, { k: 1, add: 0, minR: 0.3 });
const bodyGeos = add => rootGeos.map(g => DK.inflateGeometry(g, 0.25 + add));
const sock = new THREE.Group(); fig.world.add(sock);
const cutOnly = (geo, name) => { const m = new THREE.Mesh(geo, DK.mat('cavity')); m.userData.cutOnly = true; m.name = name; sock.add(m); return m; };
const rims = bodyGeos(0.3).map(g => cutOnly(g, 'Socket wall'));            // the socket wall, drawn as an ink outline in the cut
const voids = bodyGeos(0).map(g => cutOnly(g, 'Empty socket'));
const gumHole = cutOnly(collarGeo(0, GUM_TOP + 0.75), 'Gum opening');       // the opening through the gum
const gumRim = cutOnly(collarGeo(0.3, GUM_TOP + 0.7), 'Gum opening rim');

// a tissue that fills the socket up to a level (vertices clamped: a closed solid with a flat top), plus its plug through the gum
const fillOf = (mat, inset, plugTop) => {
  const g = new THREE.Group(), body = bodyGeos(-inset).map(geo => new THREE.Mesh(geo, mat));
  body.forEach(m => { m.userData.y0 = Float32Array.from(m.geometry.attributes.position.array); g.add(m); });
  const plug = plugTop ? new THREE.Mesh(collarGeo(-inset, plugTop), mat) : null;
  if (plug) g.add(plug);
  g.userData = { body, plug, level: 99 };
  g.setLevel = (lo, hi) => {   // keep only lo < y < hi
    body.forEach(m => { const p = m.geometry.attributes.position, y0 = m.userData.y0; for (let i = 0; i < p.count; i++) p.setY(i, Math.max(lo, Math.min(hi, y0[i * 3 + 1]))); p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); });
  };
  sock.add(g); return g;
};
const clotMat = DK.mat('pulp', { color: 0x7a3c37, cap: 0x7a3c37, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const granMat = DK.mat('gingiva', { color: 0xc4918a, cap: 0xc89a90, roughness: 0.6 });
const newBoneMat = DK.mat('bone', { color: 0xe9dfca, cap: 0xf3ead8 });
const clot = fillOf(clotMat, 0.02, GUM_TOP + 1.3), gran = fillOf(granMat, 0.04, GUM_TOP + 1.2), nb = fillOf(newBoneMat, 0.06, 0);
const woven = (() => {   // woven bone in the cut: a looser, paler lattice than the old trabeculae
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#e8d9c2'; x.fillRect(0, 0, N, N);
  x.strokeStyle = '#fbf6ec'; x.lineCap = 'round';
  for (let k = 0; k < 260; k++) {
    const cx = rnd() * N, cy = rnd() * N, a = rnd() * Math.PI, L = 14 + rnd() * 34;
    x.lineWidth = 4 + rnd() * 6;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { x.beginPath(); x.moveTo(cx + ox, cy + oy); x.quadraticCurveTo(cx + ox + Math.cos(a + 0.6) * L * 0.6, cy + oy + Math.sin(a + 0.6) * L * 0.6, cx + ox + Math.cos(a) * L, cy + oy + Math.sin(a) * L); x.stroke(); }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 6; return t;
})();

// labels on the cut face (anchors follow the cut)
const onCut = (x, y) => (e, s) => [x, y, (s.enabled ? s.offset : 0) + 0.12];
const mesialRoot = s46.roots.reduce((a, r) => r.x > a.x ? r : a, s46.roots[0]), distalRoot = s46.roots.reduce((a, r) => r.x < a.x ? r : a, s46.roots[0]);
fig.part(clot, { inPlace: true, name: 'Blood clot', sub: 'day 1', anchor: onCut(0, -2.6), labelOffset: [0, -110], dim: false,
  info: 'Within minutes the socket fills with blood that clots. The clot seals the wound and is the scaffold the healing grows into; rinsing hard, spitting, straws and smoking can dislodge it.' });
fig.part(gran, { inPlace: true, name: 'Healing tissue', sub: 'about week 1', anchor: onCut(mesialRoot.x + 0.3, -6), labelOffset: [120, 30], dim: false,
  info: 'Granulation tissue: new vessels and young connective tissue replace the clot from the socket walls inward during the first week. A whitish-yellow film on top is normal at this stage.' });
const nbPart = fig.part(nb, { inPlace: true, name: 'New bone', sub: 'about weeks 4 to 8', accent: true, anchor: onCut(distalRoot.x + 0.3, -8.5), labelOffset: [-120, 40], dim: false,
  info: 'Woven bone grows in from the floor and walls of the socket. By about 6 to 8 weeks it fills most of the socket; over the following months it is remodelled into mature bone.' });
fig.part(rims[0], { inPlace: true, name: 'Socket wall', anchor: onCut(mesialRoot.x + mesialRoot.ra + 0.6, -9), labelOffset: [110, 40], dim: false,
  info: 'The bony wall of the socket. The new tissue grows from it; it is remodelled away as the socket turns into bone.' });

// ---------- params ----------
fig.param('out', 0, k => { t46.group.visible = k < 0.999; t46.group.position.y = 20 * k * k; t46.group.rotation.z = 0.1 * Math.sin(Math.min(k * 4, 1) * Math.PI); });
fig.param('clot', -20, v => { clot.visible = v > -15; clot.setLevel(-30, v); clot.userData.plug.visible = v > CREST; });
let MAT = 0;
fig.param('gran', -20, v => { gran.visible = v > -15 && MAT < 0.5; clot.visible = clot.visible && v < GUM_TOP + 1.9; gran.setLevel(-30, v); gran.userData.plug.visible = v > CREST; });
fig.param('bone', -20, v => { nb.visible = v > -15; nb.setLevel(-30, v); });
fig.param('close', 0, k => { [gumHole, gumRim, clot.userData.plug, gran.userData.plug].forEach(o => o.scale.set(1 - 0.999 * k, 1, 1 - 0.999 * k)); gumHole.visible = gumRim.visible = k < 0.98; });
fig.param('mature', 0, k => {   // the woven bone remodels into ordinary trabecular bone; the socket outline fades
  [...rims, ...voids].forEach(r => { r.visible = k < 0.5; }); MAT = k; gran.visible = gran.visible && k < 0.5; clot.visible = clot.visible && k < 0.5;
  const sub = k > 0.5 ? 'matures over months' : 'about weeks 4 to 8'; if (nbPart.sub !== sub) { nbPart.sub = sub; nbPart.el.innerHTML = nbPart.name + '<small>' + sub + '</small>'; }
  if (!(fig.section && fig.section.caps)) return;
  const u = fig.section.caps[NBCAP].material.uniforms, trab = bone.userData.layers.cancellous.userData.capTexture;
  u.uMap.value = k > 0.5 ? trab : woven; u.uMapScale.value = 1 / ((k > 0.5 ? trab.mm : woven.mm) || 6); u.uColor.value.copy(DK.color(k > 0.5 ? 0xffffff : 0xf3ead8));
});

// ---------- section: mesio-distal (buccal half removed, camera on +z) ----------
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [...rims, gumRim], color: DK.RIM, kind: 'plain' },
  { objects: [...voids, gumHole], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [clot], color: 0x7a3c37, kind: 'plain' },
  { objects: [gran], color: 0xc89a90, kind: 'gingiva' },
  { objects: [nb], color: 0xf3ead8, texture: woven },
  { objects: [t45.layers.enamel, t47.layers.enamel, t46.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t45.layers.dentin, t45.layers.root, t47.layers.dentin, t47.layers.root, t46.layers.dentin, t46.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t45.layers.pulp, t47.layers.pulp, t46.layers.pulp], color: DK.COLORS.pulpCap }
]);
const NBCAP = 7;
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

// ---------- procedure ----------
const CUT = { theta: 0.08, phi: 1.4 }, SOCK = [0, -6.5, 0];
fig.procedure([
  { label: 'Before', caption: 'A lower molar that has to come out.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.55, phi: 1.2, zoom: 1.05, section: false, set: { out: 0, clot: -20, gran: -20, bone: -20, close: 0, mature: 0 }, labels: ['Tooth 46'] },
    { fov: 28, dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.4, hold: 1.4, theta: CUT.theta, phi: CUT.phi, zoom: 1.0, offset: 0, labels: ['Tooth 46'], key: true }] },
  { label: 'Clot', caption: 'The tooth is out and the socket fills with blood that clots.', beats: [
    { dur: 2.2, hold: 0.1, set: { out: 1 }, labels: [] },
    { dur: 1.8, hold: 1.8, zoom: 0.8, focus: SOCK, set: { clot: GUM_TOP + 2 }, labels: ['Blood clot', 'Socket wall'], key: true }] },
  { label: 'Healing tissue', caption: 'In the first week soft healing tissue replaces the clot.', beats: [
    { dur: 2.6, hold: 1.8, theta: CUT.theta + 0.12, set: { gran: GUM_TOP + 2 }, labels: ['Healing tissue'], key: true }] },
  { label: 'Gum closes', caption: 'Over two to four weeks the gum grows across; bone starts at the floor.', beats: [
    { dur: 2.4, hold: 1.8, theta: CUT.theta - 0.05, set: { close: 1, bone: -11.5 }, labels: ['Gum', 'Healing tissue'], key: true }] },
  { label: 'New bone', caption: 'Woven bone fills the socket from the floor and walls up.', beats: [
    { dur: 2.8, hold: 2.0, zoom: 0.85, theta: CUT.theta + 0.1, set: { bone: BONE_TOP }, labels: ['New bone', 'Healing tissue', 'Gum'], key: true }] },
  { label: 'Months later', caption: 'Over months the new bone matures; the ridge settles a little lower and narrower.', beats: [
    { dur: 1.6, hold: 0.2, zoom: 0.9, focus: [0, -5.5, 0], theta: CUT.theta, phi: CUT.phi, labels: [] },
    { dur: 1.6, hold: 2.4, set: { mature: 1 }, labels: ['New bone'], key: true }] }
]);
fig.start();
