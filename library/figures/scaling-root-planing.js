// Deep cleaning (scaling and root planing) at the mesial site of a lower left first molar (FDI 36 = Universal 19), mesio-distal
// cut: a probe finds the pocket, a curette scales the dark subgingival tartar off the root, then planes the root smooth, and
// the gum settles back against the clean root. The lost bone stays lost (dental-facts.md §17). Patient-facing procedure.
// poster: step 2
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const CREST = -1.8;                                                   // where the crest sat in health
const SICK = { margin: 1.4, base: -4.2, inflamed: 1 };                // swollen margin, pocket base on the root: PD 5.6 mm
const HEALED = { margin: 0.4, base: -3.6, inflamed: 0 };              // the gum shrinks and tightens; the pocket is shallower

const fig = DK.figure({
  fov: 26,
  title: 'Deep cleaning',
  subtitle: 'Scaling and root planing, lower first molar, FDI 36 (Universal 19).',
  view: { theta: 0.12, phi: 1.42 }
});

// --- tooth, bone (lowered by periodontitis), gingiva, pocket
const tooth = DK.tooth(36), s = tooth.spec;
const MR = s.roots.reduce((b, r, i) => (r.x > s.roots[b].x ? i : b), 0);   // the mesial root
const mesial = DK.toothSurfaceAt(s, -0.5, 0).x;
const loss = DK.boneLoss({ horizontal: 1.4, defects: [{ x: mesial + 0.5, z: 0, depth: 2.4, rx: 3.2, rz: 4.5, walls: 3 }] });
const bone = DK.perioBone({ width: 17, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6, loss, level: 1 }); bone.position.y = CREST;
const crestAt = (x, z) => CREST + bone.crestAt(x, z);
const crestM = crestAt(mesial + 0.2, 0), deepest = Math.min(crestM, crestAt(0, 0), crestAt(-mesial, 0));
const gum = DK.perioGingiva(s, { margin: SICK.margin, crest: deepest - 0.5, inflamed: SICK.inflamed, width: 17.6, depth: 13.2 });
const pocket = DK.pocket(s, { margin: SICK.margin, base: SICK.base, width: 0.32 }); tooth.group.add(pocket);
const pdl = DK.perioPdl(s, 0.25, r => Math.min(crestAt(r.x + r.ra + 0.2, 0), crestAt(r.x - r.ra - 0.2, 0)) + 0.2); tooth.group.add(pdl);

// --- deposits on the mesial root surface as single closed bands (local helper): outer wall t(y, th) mm off the surface,
// inner wall 0.3 mm inside the tooth (hidden). m.keep(y0) shows only the part below y0 shrinking to nothing as y0 falls.
function rootDeposit(o, mat) {
  const R = 18, C = 40, rows = 2 * R + 2, base = [], dir = [], thick = [], ys = [];
  const centre = y => { const a = DK.toothSurfaceAt(s, y, 0, MR), b = DK.toothSurfaceAt(s, y, Math.PI, MR); return [(a.x + b.x) / 2, (a.z + b.z) / 2]; };
  const g = DK.gridGeometry(rows, C, () => [0, 0, 0]);
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= C; j++) {
    const v = (j % C) / C, th = DK.util.lerp(-o.span, o.span, v), edge = Math.sin(Math.PI * v);
    let y, t, inner = false;
    if (i <= R) { const u = i / R; y = DK.util.lerp(o.bot, o.top, u); t = o.thick(u, th) * Math.pow(edge, 0.6) * Math.pow(Math.sin(Math.PI * u), 0.5); }
    else if (i <= 2 * R + 1) { const u = (i - R - 1) / R; y = DK.util.lerp(o.top, o.bot, u); inner = true; }
    else { y = o.bot; t = 0; }
    const q = DK.toothSurfaceAt(s, y, th, MR), c = centre(y), dx = q.x - c[0], dz = q.z - c[1], d = Math.hypot(dx, dz) || 1;
    base.push(q.x, y, q.z); dir.push(dx / d, 0, dz / d); thick.push(inner ? -0.3 : t); ys.push(inner);
  }
  const pos = g.attributes.position, m = new THREE.Mesh(g, mat);
  m.keep = k => {   // k: 1 = the whole deposit, 0 = gone (removed from the coronal end down... the curette pulls it off)
    const cut = DK.util.lerp(o.bot - 0.6, o.top + 0.6, k);
    for (let n = 0; n < pos.count; n++) {
      const y = base[3 * n + 1], f = ys[n] ? 1 : DK.util.smooth(cut + 0.5, cut - 0.5, y), off = ys[n] ? -0.3 : thick[n] * f - 0.06;
      pos.setXYZ(n, base[3 * n] + dir[3 * n] * off, y, base[3 * n + 2] + dir[3 * n + 2] * off);
    }
    pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); m.visible = k > 0.01; return m;
  };
  return m.keep(1);
}
const wave = (th, u, k) => 1 + 0.3 * Math.sin(9 * th + 11 * u + k) + 0.2 * Math.sin(17 * th - 6 * u + 2 * k);
const calcMat = DK.mat('bone', { color: 0x5e4a3c, cap: 0x6a5545, roughness: 0.9, bumpScale: 0.08 });
const calculus = rootDeposit({ bot: SICK.base + 0.4, top: SICK.margin - 1.3, span: 1.0, thick: (u, th) => 0.95 * wave(th, u, 1) }, calcMat);
tooth.group.add(calculus);
// what scaling leaves: a thin, rough film of fine deposit and contaminated surface that root planing smooths away (schematic)
const filmMat = DK.mat('bone', { color: 0x7a6656, cap: 0x7a6656, roughness: 0.95, bumpScale: 0.12 });
const film = rootDeposit({ bot: SICK.base + 0.25, top: SICK.margin - 1.0, span: 1.1, thick: (u, th) => 0.3 * wave(th, u, 4) }, filmMat);
tooth.group.add(film);

// --- instruments (fig.world, placed by params): the probe, and a curette built here from its real shape
const probe = DK.probe({ type: 'UNC-15' }); probe.rotation.y = Math.PI;
function curette() {   // Gracey-style curette: a curved blade with a rounded toe (tip at the origin), a bent shank and a handle
  const grp = new THREE.Group(), steel = DK.mat('steel', { cap: 0x9ea4aa });
  const blade = DK.tube([[0, 0, 0], [-0.35, 0.9, 0], [-0.45, 2.0, 0], [-0.3, 3.0, 0], [0, 3.8, 0]], 0.42, steel, { taper: t => 0.75 + 0.25 * Math.min(1, t * 3), caps: true });
  blade.scale.z = 0.5; grp.add(blade);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10), steel); toe.scale.z = 0.5; grp.add(toe);
  grp.add(DK.tube([[0, 3.8, 0], [0.25, 6, 0], [0.2, 10, 0], [-2.2, 15, 0], [-2.6, 18, 0]], 0.36, steel, { taper: t => 1 + 0.5 * t, caps: true }));
  const handle = DK.lathe([[0, 0], [0.9, 0], [1.6, 2.5], [2.6, 6], [2.9, 10], [2.9, 38], [2.4, 41], [0, 41]], 32, DK.mat('steel', { color: 0xb9bcbf, roughness: 0.45, metalness: 0.7, bump: 'streaks', bumpScale: 0.02 }));
  handle.position.set(-2.6, 18, 0); grp.add(handle);
  return grp;
}
const scaler = curette(); scaler.rotation.y = Math.PI;   // blade curving toward the root, handle away from the tooth (mesially)
const pPivot = new THREE.Group(), sPivot = new THREE.Group(); pPivot.add(probe); sPivot.add(scaler); fig.world.add(pPivot, sPivot);

// --- parts
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots, mesial and distal.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Bone already lost to gum disease. A deep cleaning stops the loss; the bone does not grow back on its own.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Before: red, swollen, bleeding. After: firmer and tighter against the clean root.' });
const z0 = sec => (sec.enabled ? sec.offset : 0) + 0.1;
const P = { margin: SICK.margin, base: SICK.base, probe: 30, sc: 30, scTilt: 0 };
const surfAt = y => DK.toothSurfaceAt(s, y, 0).x;
const pocketPart = fig.part(pocket, { inPlace: true, name: 'Pocket', sub: `${DK.mm(SICK.margin - SICK.base)} deep`, anchor: (e, sec) => [surfAt(P.base) + 1.0, (P.base + P.margin) / 2 - 0.8, z0(sec)], labelOffset: [120, 40], when: (e, sec) => sec.enabled, dim: false, info: 'The gap between gum and root that gum disease opens up. A healthy one is 3 mm or less.' });
fig.part(calculus, { inPlace: true, name: 'Tartar', sub: 'on the root, under the gum', anchor: (e, sec) => [surfAt(-1.6) + 0.3, -1.6, z0(sec)], labelOffset: [150, -80], when: (e, sec) => sec.enabled, dim: false, info: 'Hard, dark deposit stuck to the root. Bacteria live on it, so the gum cannot heal while it is there.' });
fig.part(probe, { inPlace: true, name: 'Probe', sub: 'measures the pocket', anchor: [0, 11.5, 0], info: 'A thin ruler with millimetre marks, slid gently to the bottom of the pocket.' });
fig.part(scaler, { inPlace: true, name: 'Curette', sub: 'hand scaler', anchor: [0, 12, 0], accent: true, info: 'A curved blade with a rounded toe that slides under the gum and pulls tartar off the root.' });
fig.part(film, { inPlace: true, name: 'Rough root', anchor: (e, sec) => [surfAt(-2.2) + 0.2, -2.2, z0(sec)], labelOffset: [130, -30], when: (e, sec) => sec.enabled, dim: false, info: 'Fine deposit and roughness left after scaling. Root planing smooths it, so plaque has less to hold on to.' });
const gumPart = fig.part(gum, { inPlace: true, name: 'Gum', sub: 'healing', anchor: (e, sec) => [surfAt(Math.max(P.margin, 0.2)) + 1.5, P.margin - 0.6, z0(sec)], labelOffset: [120, -50], when: (e, sec) => sec.enabled, dim: false, info: 'With the root clean, the swelling goes down and the gum tightens against it: a shallower pocket.' });
fig.part(bone, { inPlace: true, name: 'Lost bone', sub: 'does not grow back', anchor: (e, sec) => [mesial + 2.6, crestM - 0.3, z0(sec)], labelOffset: [120, -10], when: (e, sec) => sec.enabled, dim: false, info: 'Cleaning stops further loss but does not rebuild the bone already lost.' });

fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [pocket], color: 0x4a403c },
  { objects: [film], color: 0x7a6656, kind: 'plain' },
  { objects: [calculus], color: 0x6a5545, kind: 'plain' },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.root, tooth.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 0.6 } });

// --- params
const front = () => (fig.section.enabled ? fig.section.offset + 0.35 : s.blC / 2 + 0.4);
const placeTool = (pivot, tipY, depthOff, tilt, park) => {   // tip on the root surface at height tipY, leaning along the root
  const x0 = surfAt(tipY) + depthOff, top = surfAt(Math.max(P.margin, 0)) + depthOff;
  pivot.position.set(x0, tipY, front()); pivot.rotation.z = -Math.atan2(top - x0, Math.max(1, P.margin - tipY)) + tilt; pivot.visible = !park;
};
const place = () => {
  placeTool(pPivot, P.base + P.probe, 1.05, 0, P.probe > 25);
  placeTool(sPivot, P.base + 0.15 + P.sc, 0.55, P.scTilt, P.sc > 25);
};
fig.param('probe', 30, v => { P.probe = v; place(); });
fig.param('sc', 30, v => { P.sc = v; place(); });
fig.param('scTilt', 0, v => { P.scTilt = v; place(); });
fig.param('calc', 1, k => calculus.keep(k));
fig.param('film', 1, k => film.keep(k));
fig.param('margin', SICK.margin, v => { P.margin = v; gum.set({ margin: v }); pocket.set(v, null); place(); });
fig.param('base', SICK.base, v => { P.base = v; pocket.set(null, v); place(); });
fig.param('inflamed', 1, v => { gum.set({ inflamed: v }); fig.section.caps[0].material.uniforms.uColor.value.copy(DK.color(DK.COLORS.gingivaCap)).lerp(DK.color(DK.COLORS.gingivaInflamedCap), v); });
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged(); place(); };
fig.onFrame(() => { const pd = P.margin - P.base, sub = pd > 4.5 ? `${DK.mm(pd)} deep` : 'shallower'; if (pocketPart.sub !== sub) { pocketPart.sub = sub; pocketPart.el.innerHTML = pocketPart.name + `<small>${sub}</small>`; } });

// --- the procedure: one camera on the mesial site, so the storyboard reads as a series
const CAM = { theta: 0.12, phi: 1.42, zoom: fig.mode === 'image' ? 0.5 : 0.55, focus: [3.4, fig.mode === 'image' ? 0.3 : -0.9, 0] };   // storyboard panels fit looser, so they push in further
const OUT = 30, low = SICK.base + 0.15;
const strokes = (from, to, n, extra) => {   // working strokes: the blade goes to the bottom, then pulls up along the root
  const beats = [];
  for (let i = 0; i < n; i++) {
    const k = (i + 1) / n;
    beats.push({ dur: 0.5, hold: 0, set: { sc: 0, scTilt: 0.06 }, labels: extra.labels });
    beats.push(Object.assign({ dur: 0.7, hold: i === n - 1 ? 0.8 : 0.05, set: Object.assign({ sc: 2.6, scTilt: -0.04 }, extra.set(DK.util.lerp(from, to, k))), labels: extra.labels }, i === extra.key ? { key: true, hold: 0.9 } : {}));
  }
  return beats;
};
fig.procedure([
  { label: 'Pocket', caption: 'Tartar under the gum has opened a deep pocket along the root.', beats: [
    { dur: 0, hold: 0.6, theta: 0.5, phi: 1.3, zoom: 1, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    Object.assign({ dur: 2.0, hold: 0.4, offset: 0.6, labels: ['Tartar'] }, CAM),
    { dur: 1.4, hold: 1.6, set: { probe: 0 }, labels: ['Probe', 'Pocket', 'Tartar'], key: true },
    { dur: 0.8, hold: 0.2, set: { probe: OUT }, labels: ['Pocket', 'Tartar'] }] },
  { label: 'Scaling', caption: 'A curette slides under the gum and pulls the tartar off the root.', beats: [
    { dur: 1.0, hold: 0.2, set: { sc: 3 }, labels: ['Curette', 'Tartar'] },
    ...strokes(1, 0, 3, { key: 0, set: k => ({ calc: k }), labels: ['Curette', 'Tartar'] }),
    { dur: 0.8, hold: 0.2, set: { sc: OUT }, labels: [] }] },
  { label: 'Root planing', caption: 'The root surface is planed smooth, so plaque has less to cling to.', beats: [
    { dur: 0.8, hold: 0.4, set: { sc: 3 }, labels: ['Rough root'] },
    ...strokes(1, 0, 2, { key: 0, set: k => ({ film: k }), labels: ['Curette', 'Rough root'] }),
    { dur: 0.8, hold: 0.2, set: { sc: OUT }, labels: [] }] },
  { label: 'Healing', caption: 'Weeks later the gum is calmer and tighter. The lost bone stays lost.', beats: [
    { dur: 2.4, hold: 0.4, set: { margin: HEALED.margin, base: HEALED.base, inflamed: HEALED.inflamed }, labels: ['Gum'] },
    { dur: 1.2, hold: 2.0, labels: ['Gum', 'Pocket', 'Lost bone'], key: true }] }
]);
fig.start();
