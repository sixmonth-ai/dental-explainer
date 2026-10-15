// Plaque and tartar on the lower central incisors (FDI 31 and 41 = Universal 24 and 25), seen from the tongue side, then in a
// poster: end
// labio-lingual cut through 41: a soft plaque film at the gumline hardens into pale supragingival calculus above the margin and
// dark subgingival calculus on the root inside a shallow pocket (dental-facts.md §17, Calculus). Patient-facing story.
// Frame: +x = toward the patient's left, +z = labial, y up, CEJ at y = 0. Tooth 41 natural (its mesial +x faces the midline),
// 31 mirrored (scale.x = -1). Sizes in mm (Wheeler averages via DK.toothPreset).
const MARGIN = 1.0;          // gingival margin on the enamel, slightly swollen
const CREST = -3.2;          // bone crest: a little lower than the healthy ~-1.8, where tartar has been sitting under the gum
const BASE_LING = -2.0;      // lingual pocket base (1.2 mm coronal to the crest: the supracrestal attachment stays)
const BASE_LAB = -0.3;       // labial: a near-normal sulcus

const fig = DK.figure({
  fov: 30,
  title: 'Plaque and tartar',
  subtitle: 'Lower front teeth, FDI 31 and 41 (Universal 24 and 25).',
  view: { theta: 0.55, phi: 1.3 }
});

// ---------- the two incisors, contact at the midline (x = 0)
const t41 = DK.tooth(41), s = t41.spec, XC = s.md / 2;
t41.group.position.x = -XC;
const t31 = DK.tooth(31); t31.group.position.x = XC; t31.group.scale.x = -1;

// ---------- bone, PDL, gingiva (context, fit: false)
const bone = DK.perioBone({ width: 15, height: 16, depth: 8.8, cortical: 0.9, crest: 1.0, loss: { horizontal: -CREST - 1.8 }, level: 1 });
bone.position.y = -1.8;
const gum = DK.gingiva({ width: 15.6, height: 3.8, depth: 9.6, crest: 1.2, color: DK.COLORS.gingivaInflamed,
  around: [{ x: -XC, z: 0, md: s.mdC, bl: s.blC, rise: 0.9 }, { x: XC, z: 0, md: s.mdC, bl: s.blC, rise: 0.9 }] });
gum.position.y = MARGIN - 0.9;
const pdls = [t41, t31].map(t => { const p = DK.perioPdl(t.spec, 0.2, CREST + 0.2); t.group.add(p); return p; });

// ---------- pockets: shallow labially, deeper lingually (th: 0 mesial, π/2 labial, -π/2 lingual)
const baseAt = th => DK.util.lerp(BASE_LAB, BASE_LING, DK.util.smooth(0.3, -0.9, Math.sin(th)));
const pockets = [t41, t31].map(t => { const p = DK.pocket(t.spec, { margin: MARGIN, base: baseAt, width: 0.14 }); t.group.add(p); return p; });

// ---------- deposits as single closed bands hugging the tooth (local helper): the outer wall sits thick(u, th) mm off the
// surface between heights bot and top(th), the inner wall 0.3 mm inside the tooth (hidden; the tooth paints over it in section).
// One solid per deposit, so the stencil cut stays clean. m.set(k) grows it from nothing (k = 0, outer wall inside the tooth).
function deposit(spec, o, mat) {
  const R = 18, C = 96, rows = 2 * R + 2, P = [[], []];
  const put = (arr, y, th, off) => { const q = DK.toothSurfaceAt(spec, y, th), d = Math.hypot(q.x, q.z) || 1; arr.push(q.x + q.x / d * off, y, q.z + q.z / d * off); };
  const g = DK.gridGeometry(rows, C, (i, j) => [0, 0, 0]), uv = [];
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= C; j++) {
    const th = (j % C) / C * Math.PI * 2, yt = o.top(th);
    [0, 1].forEach(k => {
      if (i <= R) { const u = i / R, t = o.thick(u, th); put(P[k], DK.util.lerp(o.bot, yt, u), th, k ? t - 0.06 : -0.06); }
      else if (i <= 2 * R + 1) { const u = (i - R - 1) / R; put(P[k], DK.util.lerp(yt, o.bot, u), th, -0.3); }
      else put(P[k], o.bot, th, -0.06);
    });
  }
  const pos = g.attributes.position; P[0] = Float32Array.from(P[0]); P[1] = Float32Array.from(P[1]);
  const m = new THREE.Mesh(g, mat);
  m.set = k => { for (let i = 0; i < pos.array.length; i++) pos.array[i] = P[0][i] + (P[1][i] - P[0][i]) * k; pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); m.visible = k > 0.01; return m; };
  return m.set(0);
}
const { smooth, lerp } = DK.util;
const lingual = th => smooth(-0.25, -0.8, Math.sin(th));                       // 1 on the lingual face, 0 labially
const proximal = th => smooth(0.7, 0.95, Math.abs(Math.cos(th)));               // toward the contacts
const wave = (th, u, seed) => 1 + 0.28 * Math.sin(7 * th + 9 * u + seed) + 0.18 * Math.sin(13 * th - 5 * u + 2 * seed);

// ---------- plaque: a thin soft film at the gumline, thicker lingually and between the teeth
const plaqueMat = new THREE.MeshStandardMaterial({ color: DK.color(0xe4d39b), roughness: 0.42, metalness: 0, transparent: true, opacity: 0, depthWrite: false });
const plaque = [t41, t31].map((t, i) => { const p = deposit(t.spec, { bot: MARGIN - 0.25,
  top: th => MARGIN + 1.3 + 1.1 * lingual(th) + 0.6 * Math.pow(Math.cos(th), 2) + 0.18 * Math.sin(5 * th + i) + 0.12 * Math.sin(11 * th + 2 * i),
  thick: (u, th) => 0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.02)), 0.6) * (1 - 0.4 * u) * wave(th, u, i) }, plaqueMat); t.group.add(p); return p; });
plaque.forEach(p => p.set(1));
const plaque41 = plaque[0], plaque31 = plaque[1];

// ---------- calculus: pale and chalky above the margin (lingual of the lower incisors, opposite the salivary ducts),
// dark and dense on the root inside the lingual pocket below it (dental-facts.md §17)
const calcMat = c => DK.mat('bone', { color: c, cap: c, roughness: 0.9, bumpScale: 0.08 });
const supraMat = calcMat(0xd6cba6), subMat = calcMat(0x5a4a40);
const supra = [t41, t31].map((t, i) => { const c = deposit(t.spec, { bot: MARGIN - 0.15,
  top: th => MARGIN + 1.5 + 0.5 * lingual(th) + 0.35 * Math.sin(3 * th + 2 * i) + 0.2 * Math.sin(8 * th + i),
  thick: (u, th) => 0.95 * Math.max(lingual(th), 0.6 * proximal(th)) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.95)), 0.55) * (1 - 0.35 * u) * wave(th, u, 3 + i) }, supraMat); t.group.add(c); return c; });
const sub = [t41, t31].map((t, i) => { const c = deposit(t.spec, { bot: BASE_LING + 0.45,
  top: th => MARGIN - 0.45 - 0.2 * Math.sin(4 * th + i),
  thick: (u, th) => 0.42 * Math.max(lingual(th), 0.5 * proximal(th) * lingual(th - 0.6 * Math.sign(Math.cos(th)))) * Math.pow(Math.sin(Math.PI * u), 0.5) * wave(th, u, 7 + i) }, subMat); t.group.add(c); return c; });

// ---------- parts
fig.part(t41.group, { name: 'Tooth 41', label: false, info: 'Lower right central incisor (Universal 25): one narrow root.' });
fig.part(t31.group, { name: 'Tooth 31', label: false, info: 'Lower left central incisor (Universal 24).' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The bone that holds the teeth. Tartar left under the gum keeps it inflamed, and bone lost this way does not grow back.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Plaque and tartar at the gumline make the gum red, swollen and quick to bleed.' });
// label anchors on the deposits of 41, in the lingual mid-line (local x = 0 = the cut plane), lifted onto the cut face when cut
const lingPt = (y, out) => { const q = DK.toothSurfaceAt(s, y, -Math.PI / 2); return { x: 0, y, z: q.z - out }; };
const SUPRA_AT = lingPt(MARGIN + 0.45, 0.3), SUB_AT = lingPt(-0.9, 0.12);
const onCut = (p, sec, dz) => sec.enabled ? [-sec.offset + XC - 0.1, p.y, p.z + (dz || 0)] : [p.x, p.y, p.z - 0.2];
const LING = -s.blC / 2, TONGUE = Math.PI + 0.45, HERO = 1.5 * Math.PI - 0.3;   // HERO: from the distal of 41, turned toward the tongue
fig.part(plaque41, { inPlace: true, name: 'Plaque', sub: 'soft, sticky film', anchor: [0.2, MARGIN + 2.2, LING - 0.6], dim: false, info: 'A film of bacteria that forms again every day. Brushing and flossing remove it while it is still soft.' });
fig.part(supra[0], { inPlace: true, name: 'Tartar above the gum', sub: 'hardened plaque', labelOffset: [-170, -40], anchor: (e, sec) => onCut(SUPRA_AT, sec), accent: true, dim: false, info: 'Supragingival calculus: plaque hardened by minerals from saliva, pale and chalky, most often behind the lower front teeth. A toothbrush cannot remove it.' });
fig.part(sub[0], { inPlace: true, name: 'Tartar below the gum', sub: 'only a cleaning removes it', labelOffset: [-150, 70], anchor: (e, sec) => onCut(SUB_AT, sec), when: (e, sec) => sec.enabled, dim: false, info: 'Subgingival calculus: dark, hard and stuck to the root inside the pocket, out of sight and out of reach of brushing and floss.' });
fig.part(gum, { inPlace: true, name: 'Gum', anchor: (e, sec) => [(sec.enabled ? -sec.offset : -XC) - 0.1, -2.2, LING - 2.6], when: (e, sec) => sec.enabled, dim: false, info: 'Red and swollen next to the tartar.' });

// ---------- section (offset is measured along removeToward, so +XC puts the cut at world x = -XC): labio-lingual, through the middle of 41 (removes its distal half; 31 stays whole behind the cut)
fig.enableSection([-1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaInflamedCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: pdls, color: DK.COLORS.pdl },
  { objects: pockets, color: 0x4a403c },
  { objects: sub, color: 0x5a4a40, kind: 'plain' },
  { objects: supra, color: 0xd6cba6, kind: 'plain' },
  { objects: [t41.layers.enamel, t31.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t41.layers.root, t41.layers.dentin, t31.layers.root, t31.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t41.layers.pulp, t31.layers.pulp], color: DK.COLORS.pulpCap }
]);
plaqueMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-2, 6], offset: XC } });
fig.view('Tongue side', { section: false, theta: Math.PI + 0.45, phi: 1.25, zoom: 0.8, focus: [0, 2.5, -1], labels: ['Plaque', 'Tartar above the gum'] });
fig.view('Under the gum', { section: true, offset: XC, theta: HERO, phi: 1.36, zoom: 0.55, fov: 26, focus: [-XC, 0.6, -2.0], labels: ['Tartar above the gum', 'Tartar below the gum', 'Gum'] });

// ---------- params: plaque builds up, then hardens into tartar
fig.param('plaque', 0, v => { plaqueMat.opacity = 0.8 * v; plaque.forEach(p => { p.visible = v > 0.01; }); });
fig.param('tartar', 0, k => { supra.concat(sub).forEach(m => m.set(k)); });

// ---------- story: clean teeth → plaque at the gumline → it hardens → the cut shows tartar under the gum too
fig.story([
  { dur: 0, hold: 1.3, theta: 0.55, phi: 1.3, zoom: 1, section: false, labels: [], caption: 'The lower front teeth.' },
  { dur: 2.4, hold: 0.2, theta: TONGUE, phi: 1.22, zoom: 0.8, focus: [0, 2.5, -1], labels: [] },
  { dur: 1.8, hold: 1.6, set: { plaque: 1 }, labels: ['Plaque'], caption: 'Plaque, a soft film of bacteria, collects at the gumline.' },
  { dur: 2.2, hold: 2.0, set: { tartar: 1, plaque: 0.45 }, theta: TONGUE - 0.25, labels: ['Tartar above the gum', 'Plaque'], caption: 'Left in place, it hardens into tartar.' },
  { dur: 2.2, hold: 0.1, theta: HERO, phi: 1.36, zoom: 0.9, focus: 'auto', fov: 26, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 9 },
  { dur: 2.2, hold: 0.6, offset: XC, set: { plaque: 0 }, labels: [], caption: 'A cut through one tooth.' },
  { dur: 2.0, hold: 2.6, zoom: 0.66, focus: [-XC, 0.2, -2.0], labels: ['Tartar above the gum', 'Tartar below the gum', 'Gum'], caption: 'Tartar also forms below the gum, where only a professional cleaning reaches it.' }
]);
fig.start();
