// Procedure: guided tissue regeneration (GTR) of a 3-wall intrabony defect on the mesial of the lower right first molar (FDI 46 = Universal 30),
// poster: step 4
// mesio-distal cut. The gum is lifted and the defect cleaned, bone graft fills it, a membrane is laid over it so the faster gum tissue stays
// out, the gum is closed, and months later new bone and attachment fill most of the defect. Regeneration works in contained (intrabony)
// defects, not in horizontal loss (dental-facts.md §17). Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0; the cut removes the buccal half. mm.
const { lerp, smooth, clamp } = DK.util;
const CREST = -1.8;                                         // where the crest sat in health
const HL = 1.0;                                             // horizontal loss around the tooth
const DEPTH = 6.8;                                          // the defect floor below the healthy crest
const SICK = { margin: 1.4, base: -6.6, inflamed: 0.9 };    // pocket into the defect: PD 8 mm at the mesial
const HEALED = { margin: 1.0, base: -3.2, inflamed: 0 };    // after regeneration: PD 4.2 mm
const FILL = 0.82;                                          // share of the defect depth the new bone fills
const BONE = { width: 17, height: 17.5, depth: 12.5, cortical: 1.3, crest: 1.6, round: 2.4 };

const fig = DK.figure({
  fov: 26,
  title: 'Regrowing lost bone',
  subtitle: 'Guided tissue regeneration, lower right first molar, FDI 46 (Universal 30).',
  view: { theta: 0.12, phi: 1.42 }
});

// --- tooth, bone with a mesial 3-wall defect, pocket
const tooth = DK.tooth(46), s = tooth.spec, L = tooth.layers;
const mesial = DK.toothSurfaceAt(s, -0.5, 0).x;
const DX = mesial + 0.5, RX = 3.1, OFF = 1.0;   // OFF: the cut plane (z), through the middle of the defect
const loss = DK.boneLoss({ horizontal: HL, defects: [{ x: DX, z: OFF, depth: DEPTH, rx: RX, walls: 3, profile: 'angular' }] });
const bone = DK.perioBone(Object.assign({}, BONE, { loss, level: 1 })); bone.position.y = CREST;
const crestAt = (x, z) => CREST + bone.crestAt(x, z);
const FLOOR = crestAt(mesial + 0.15, OFF), RIM = CREST - HL;     // the defect floor beside the root, and the surrounding crest
const pocket = DK.pocket(s, { margin: SICK.margin, base: th => lerp(-1.2, SICK.base, Math.exp(-Math.pow(Math.atan2(Math.sin(th), Math.cos(th)) / 0.7, 2))), width: 0.45 }); tooth.group.add(pocket);
const gum = DK.perioGingiva(s, { margin: SICK.margin, crest: FLOOR - 0.6, inflamed: SICK.inflamed, width: BONE.width + 0.6, depth: BONE.depth + 0.7, round: 2.7 });
fig.world.add(gum);

// --- the graft: a block just inside the bone whose top is the crest level; it rises from below, so it shows only in the defect
const GB = { width: BONE.width - 0.5, height: 9, depth: BONE.depth - 0.5, cortical: 0.4, crest: 1.6, round: 2.2 };
const graftBlock = (mat) => { const b = DK.perioBone(Object.assign({}, GB, { loss: { horizontal: HL + 0.12 }, level: 1 })); b.traverse(m => { if (m.isMesh) { m.material = mat; m.material.visible = true; } }); fig.world.add(b); return b; };
const granules = (() => {   // particulate graft: pale irregular granules in clot
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.fillStyle = '#b8a688'; c.fillRect(0, 0, N, N);
  for (let k = 0; k < 520; k++) { const cx = rnd() * N, cy = rnd() * N, r = 6 + rnd() * 20, sides = 5 + Math.floor(rnd() * 4), sh = 225 + Math.floor(rnd() * 28);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { c.beginPath(); for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + rnd() * 0.5, rr = r * (0.7 + rnd() * 0.4); c.lineTo(cx + ox + Math.cos(a) * rr, cy + oy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = `rgb(${sh},${sh - 6},${sh - 20})`; c.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.mm = 7; return t;
})();
const graft = graftBlock(DK.mat('bone', { color: 0xe6dcc6, cap: 0xf1e9d8, roughness: 0.95 }));
const newBone = graftBlock(DK.mat('bone', { cap: DK.COLORS.corticalCap }));
const graftLayers = b => [b.userData.layers.cortical, b.userData.layers.cancellous];

// --- the membrane: a thin sheet over the defect, from the root surface out past the rim, draped on the crest
const MEMB = 0.35, MX0 = mesial + 0.05, MX1 = Math.min(DX + RX + 1.4, BONE.width / 2 - 0.6), MZ = 4.6;
const membraneGeo = new THREE.BoxGeometry(1, 1, 1, 28, 1, 22);
const mp = membraneGeo.attributes.position, m0 = Float32Array.from(mp.array);
const membrane = new THREE.Mesh(membraneGeo, DK.mat('ceramic', { color: 0xede5d3, cap: 0xf3ecdc, roughness: 0.8 }));
const shapeMembrane = top => {   // top: the graft level the sheet rests on
  for (let i = 0; i < mp.count; i++) {
    const u = m0[3 * i] + 0.5, v = m0[3 * i + 1] + 0.5, w = m0[3 * i + 2] + 0.5;
    const x = lerp(MX0, MX1, u), z = lerp(-MZ, MZ, w) * (0.75 + 0.25 * Math.sin(Math.PI * u));
    const base = Math.max(crestAt(x, z), top) + 0.06 + 0.5 * smooth(0.25, 0, u);   // a little way up the root at its inner edge
    mp.setXYZ(i, x, base + MEMB * v, z);
  }
  mp.needsUpdate = true; membraneGeo.computeVertexNormals(); membraneGeo.computeBoundingSphere();
};
shapeMembrane(RIM - 0.1); fig.world.add(membrane);

// --- where the defect was: an outline on the cut face, shown once it has healed
const oldPts = []; for (let i = 0; i <= 40; i++) { const x = lerp(mesial + 0.1, DX + RX + 0.6, i / 40); oldPts.push([x, crestAt(x, OFF) + 0.02, OFF + 0.12]); }
const outlineMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
const oldDefect = DK.ribbon(oldPts, 0.22, [0, 0, 1], { material: outlineMat }); oldDefect.renderOrder = 999; oldDefect.visible = false; fig.world.add(oldDefect);

// --- parts
const frame = new THREE.Mesh(new THREE.BoxGeometry(BONE.width, s.crownL + BONE.height - CREST + 0.5, 6), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.set(0, (s.crownL + CREST - BONE.height) / 2, 0); fig.part(frame, { name: 'frame', label: false });
fig.part(tooth.group, { name: 'Tooth 46', label: false, fit: false, info: 'Lower right first molar: two roots, mesial and distal.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Bone around the molar, with a narrow defect along the mesial root.' });
const P = { gum: 0, fill: 0, memb: 0, heal: 0, margin: SICK.margin, base: SICK.base };
const zc = sec => (sec.enabled ? sec.offset : 0) + 0.1, cutOn = (e, sec) => sec.enabled;
const surfX = y => DK.toothSurfaceAt(s, y, 0).x;
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'The gum. It is lifted as a flap to reach the defect, then closed over the membrane.' });
const pocketPart = fig.part(pocket, { inPlace: true, name: 'Pocket', sub: `about ${Math.round(SICK.margin - SICK.base)} mm`, anchor: (e, sec) => [surfX(-2.5) + 0.3, -2.5, zc(sec)], labelOffset: [130, -70], when: (e, sec) => sec.enabled && P.gum < 0.1 && P.heal < 0.5, dim: false, info: 'A deep pocket reaching down into the bony defect beside the root.' });
fig.part(bone, { inPlace: true, name: 'Bony defect', sub: 'three bone walls', anchor: (e, sec) => [DX + 0.4, FLOOR + 2.0, zc(sec)], labelOffset: [140, 40], when: (e, sec) => sec.enabled && P.fill < 0.2, dim: false, info: 'A narrow, deep (intrabony) defect walled by bone on three sides and the root on the fourth: the kind that can regrow. Even, horizontal bone loss cannot.' });
fig.part(graft, { inPlace: true, name: 'Bone graft', anchor: (e, sec) => [DX + 0.4, FLOOR + 2.4, zc(sec)], labelOffset: [140, 40], when: (e, sec) => sec.enabled && P.fill > 0.5 && P.heal < 0.5, dim: false, info: 'Graft granules fill the defect and hold the space; new bone grows through them.' });
fig.part(membrane, { inPlace: true, name: 'Membrane', sub: 'keeps the gum out', anchor: (e, sec) => [DX + RX * 0.9, RIM + 0.35, zc(sec)], labelOffset: [130, -80], accent: true, when: (e, sec) => sec.enabled && P.memb > 0.5, dim: false, info: 'A thin barrier (often resorbable collagen). Gum cells grow much faster than bone; the membrane keeps them out of the defect so bone and the root attachment have time to regrow.' });
fig.part(oldDefect, { inPlace: true, name: 'Where the defect was', anchor: oldPts[30], labelOffset: [130, -30], accent: true, when: () => oldDefect.visible, dim: false, info: 'The outline of the bony defect before treatment. New bone now fills most of it.' });
fig.part(newBone, { inPlace: true, name: 'New bone', sub: 'most of the defect', anchor: (e, sec) => [DX + 0.5, FLOOR + 2.2, zc(sec)], labelOffset: [140, 60], when: (e, sec) => sec.enabled && P.heal > 0.5, dim: false, info: 'Months later, new bone, ligament and root attachment fill much of the defect. The fill is partial and varies from case to case.' });
fig.part(pocket, { inPlace: true, name: 'Shallower pocket', anchor: (e, sec) => [surfX(-1.2) + 0.3, -1.2, zc(sec)], labelOffset: [130, -70], when: (e, sec) => sec.enabled && P.heal > 0.5, dim: false, info: 'With the attachment rebuilt, the pocket is much shallower and easier to keep clean.' });

// --- params
const gumMat = gum.material;
const showPocket = () => { pocket.visible = P.gum < 0.02 && (P.fill < 0.01 || P.heal > 0.5); };
fig.param('gum', 0, k => { P.gum = k; gum.position.z = 15 * smooth(0, 1, k); gum.visible = k < 0.99; showPocket(); });
fig.param('fill', 0, k => { P.fill = k; graft.position.y = CREST - (1 - k) * (DEPTH + 0.6); newBone.position.y = CREST - (1 - FILL) * (DEPTH + 0.6) + 0.12; graft.visible = k > 0.01 && P.heal < 0.5; showPocket(); });
fig.param('memb', 0, k => { P.memb = k; membrane.visible = k > 0.01 && P.heal < 0.5; membrane.position.set(0, 5 * (1 - k), 3 * (1 - k)); });
fig.param('ghost', 0, k => { outlineMat.opacity = 0.9 * k; oldDefect.visible = k > 0.01; });
fig.param('heal', 0, k => { P.heal = k; graft.visible = P.fill > 0.01 && k < 0.5; newBone.visible = P.fill > 0.01 && k >= 0.5; membrane.visible = P.memb > 0.01 && k < 0.5; showPocket(); });
fig.param('margin', SICK.margin, v => { P.margin = v; gum.set({ margin: v }); pocket.set(v, null); });
fig.param('base', SICK.base, v => { P.base = v; pocket.set(null, th => lerp(-1.2, v, Math.exp(-Math.pow(Math.atan2(Math.sin(th), Math.cos(th)) / 0.7, 2)))); });
fig.param('inflamed', SICK.inflamed, v => { gum.set({ inflamed: v, crest: lerp(RIM - 0.4, FLOOR - 0.6, clamp(v / SICK.inflamed, 0, 1)) }); DK.capColor(fig.section, 0, v > 0.45 ? DK.COLORS.gingivaInflamedCap : DK.COLORS.gingivaCap); });

// --- section: gum, then graft and new bone (bone paints over them, so they show only in the defect), bone, membrane, pocket, tooth
fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaInflamedCap },
  { objects: [pocket], color: 0x4a403c },
  { objects: graftLayers(graft), color: 0xfaf3e4, texture: granules },
  { objects: graftLayers(newBone), color: 0xfff6e2, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [membrane], color: 0xf3ecdc, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: OFF } });

// --- procedure: one camera on the mesial defect, so the storyboard reads as a series
const ZK = fig.mode === 'image' ? 1 : 1.3;
const CAM = { theta: 0.12, phi: 1.42, zoom: 0.74 * ZK, focus: [DX - 0.4, -2.2, 0] };
fig.procedure([
  { label: 'Bony defect', caption: 'A deep, narrow defect in the bone beside the root, under a deep pocket.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.65, phi: 1.25, zoom: 1.0 * ZK, section: false, labels: [] },
    { fov: 26, dur: 2.0, hold: 0.1, theta: 0.12, phi: 1.42, zoom: 1.0 * ZK, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    { dur: 2.0, hold: 0.6, offset: OFF, labels: ['Pocket'] },
    Object.assign({ dur: 1.8, hold: 1.8, labels: ['Pocket', 'Bony defect'], key: true }, CAM)] },
  { label: 'Opened and cleaned', caption: 'The gum is lifted and the defect is cleaned out.', beats: [
    { dur: 2.4, hold: 0.2, set: { gum: 1 }, labels: [] },
    { dur: 1.0, hold: 1.8, labels: ['Bony defect'], key: true }] },
  { label: 'Bone graft', caption: 'Graft granules fill the defect.', beats: [
    { dur: 2.4, hold: 0.2, set: { fill: 1 }, labels: ['Bone graft'] },
    { dur: 1.0, hold: 1.6, labels: ['Bone graft'], key: true }] },
  { label: 'Membrane', caption: 'A membrane over the graft keeps the faster-growing gum out.', beats: [
    { dur: 2.0, hold: 0.2, set: { memb: 1 }, labels: ['Membrane'] },
    { dur: 1.0, hold: 2.0, zoom: 0.66 * ZK, labels: ['Membrane', 'Bone graft'], key: true }] },
  { label: 'Gum closed', caption: 'The gum is stitched back over the membrane.', beats: [
    Object.assign({ dur: 2.4, hold: 0.2, set: { gum: 0, inflamed: 0.3 }, labels: ['Membrane'] }, CAM),
    { dur: 1.0, hold: 1.6, labels: ['Membrane'], key: true }] },
  { label: 'Months later', caption: 'New bone and attachment fill most of the defect; the pocket is shallower.', beats: [
    { dur: 2.0, hold: 0.2, set: { heal: 1, inflamed: 0, margin: HEALED.margin, base: HEALED.base }, labels: [] },
    { dur: 2.0, hold: 2.6, zoom: 0.8 * ZK, focus: [DX - 1.2, -2.0, 0], set: { ghost: 1 }, labels: ['New bone', 'Where the defect was', 'Shallower pocket'], key: true }] }
]);
fig.start();
