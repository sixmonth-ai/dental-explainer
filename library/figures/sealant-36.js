// Fissure sealant on the mandibular left first molar (FDI 36 = Universal 19), a sound tooth in its socket; frame: +x mesial, +z buccal, CEJ at y = 0, procedure ending in a bucco-lingual cut through the fissure.
// poster: step 3
// Steps: the deep grooves, etch, resin flowed along the central, buccal and lingual grooves, light cure, then the cut. Sizes in mm (dental-facts.md §16: sealant fills the fissure to its rims + ~0.2 mm).
const FDI = 36, CUT = -0.9;   // bucco-lingual cut just distal to the central pit, through the central groove only
const fig = DK.figure({
  fov: 28,
  title: 'Fissure sealant',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19). Sound enamel, no drilling.',
  view: { theta: 0.9, phi: 0.75 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 15, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 15, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: erupts at about 6 years, and its grooves are where most childhood decay starts.' });

// --- the grooves the sealant follows (normalised crown coordinates, as in the preset's occlusal relief)
const GROOVES = {
  central: [[-0.74, 0.0], [-0.35, 0.02], [0, 0], [0.35, 0], [0.74, 0]],
  mb: [[0.2, 0.06], [0.23, 0.42], [0.25, 0.66]],
  db: [[-0.33, 0.06], [-0.37, 0.42], [-0.4, 0.62]],
  lingual: [[0.05, -0.06], [0.05, -0.4], [0.05, -0.64]]
};
const partial = (path, k) => {   // the first k (0..1) of a polyline, by length
  const seg = []; let tot = 0; for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(d); tot += d; }
  let left = Math.max(k, 0.06) * tot; const out = [path[0]];
  for (let i = 1; i < path.length; i++) { if (left >= seg[i - 1]) { out.push(path[i]); left -= seg[i - 1]; } else { const t = left / seg[i - 1]; out.push([path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t]); break; } }
  if (out.length < 2) out.push(path[1]); return out;
};
// a lens that grows along its groove: rebuilt geometry copied into the same mesh (keeps the section stencil in sync)
function growing(path, opts) {
  const m = DK.sealant(tooth, Object.assign({ path }, opts));
  m.userData.grow = k => {
    m.visible = k > 0.02; if (!m.visible) return;
    const g = DK.sealant(tooth, Object.assign({}, opts, { path: partial(path, k) })).geometry;
    m.geometry.attributes.position.array.set(g.attributes.position.array); m.geometry.attributes.position.needsUpdate = true;
    m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); g.dispose();
  };
  tooth.group.add(m); return m;
}
const SEAL = { width: 1.25, thickness: 0.2 };
const seal = { central: growing(GROOVES.central, SEAL) };
['mb', 'db', 'lingual'].forEach(n => { seal[n] = growing(GROOVES[n], { width: 1.0, thickness: 0.18 }); });
const sealMat = DK.mat('sealant', { color: 0xe6d6b4, roughness: 0.15, clearcoat: 0.9, cap: 0xd8c294 });
Object.values(seal).forEach(m => { m.material = sealMat; });
const ETCH = { width: 2.1, thickness: 0.45 };
const etchMat = DK.mat('composite', { color: 0x8ea6ba, roughness: 0.35, clearcoat: 0.6, transparent: true, opacity: 0.88 });
const etch = { central: growing(GROOVES.central, ETCH) };
['mb', 'db', 'lingual'].forEach(n => { etch[n] = growing(GROOVES[n], { width: 1.7, thickness: 0.4 }); });
Object.values(etch).forEach(m => { m.material = etchMat; DK.inFront(m); });

// top of the central groove at the pit, for labels and tool paths
const ysurf = tooth.group.userData.topGrid;
const gp = (xn, zn) => [xn * s.md / 2, ysurf(xn * s.md / 2, zn * s.bl / 2), zn * s.bl / 2];
const PIT = gp(0, 0), CUTP = gp(CUT / (s.md / 2), 0);

fig.part(L.enamel, { inPlace: true, name: 'Grooves', sub: 'too narrow for a toothbrush bristle', anchor: [gp(0.45, 0)[0], gp(0.45, 0)[1] + 0.05, 0], dim: false, info: 'Pits and fissures on the chewing surface trap plaque where brushing cannot reach: most decay in children starts here.', when: () => !seal.central.visible });
fig.part(etch.central, { inPlace: true, name: 'Etch gel', sub: 'then rinsed and dried', anchor: () => gp(-0.45, 0), dim: false, info: 'Mild acid (usually phosphoric acid gel) roughens the enamel for a few seconds so the resin can lock into it; then rinsed and dried. Sound enamel: nothing is drilled.' });
fig.part(seal.central, { inPlace: true, name: 'Sealant', sub: 'flows into the grooves', anchor: () => { const p = gp(-0.5, 0); return [p[0], p[1] + 0.1, p[2]]; }, accent: true, dim: false, info: 'A runny resin (or glass ionomer) flows into the etched fissures and seals them, about 0.2 mm above the rims. Reduces new occlusal decay by roughly three quarters in children (ADA/AAPD 2016). Checked at recalls; it can wear and be topped up.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [CUT, s.crownL - 1.2, -s.bl / 2 + 1.3], info: 'Sound enamel under the sealant: nothing is removed.', when: (e, sec) => sec.enabled });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [CUT, 3.4, 2.2], info: 'Dentin under the enamel.', when: (e, sec) => sec.enabled });

// --- tools: an applicator tip (tip at its origin, pointing down) and a curing light, parked out of view
const tipGrp = new THREE.Group();
const steel = DK.mat('steel', {});
tipGrp.add(DK.tube([[0, 0, 0], [0, 1.6, 0.2], [0, 3.2, 1.2], [0, 4.8, 3.2], [0, 6.0, 6.5]], 0.32, steel, { caps: true }));
const hub = DK.lathe([[0.45, 0], [0.9, 1.5], [1.1, 9], [0, 9.2]], 24, DK.mat(0xd9d3c8, { roughness: 0.5 })); hub.position.set(0, 6.0, 6.5); hub.rotation.x = Math.PI / 2 - 0.25; tipGrp.add(hub);
const light = DK.curingLight({ tip: 4 });
[tipGrp, light].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(tipGrp, { inPlace: true, name: 'Applicator tip', anchor: [0, 3.2, 1.2], info: 'A fine tip lays the gel or resin along each groove so it wets the fissure without trapping air.' });
fig.part(light, { inPlace: true, name: 'Curing light',  anchor: [0, 6, 0], info: 'Blue light sets the resin in seconds.' });

// --- params
const all = (o, k0, k1, k) => { const c = DK.util.clamp; o.central.userData.grow(c(k / k0, 0, 1)); ['mb', 'db', 'lingual'].forEach(n => o[n].userData.grow(c((k - k0) / (k1 - k0), 0, 1))); };
fig.param('etch', 0, k => all(etch, 0.6, 1, k));
fig.param('seal', 0, k => all(seal, 0.6, 1, k));
const tp = { x: 0, y: 40, z: 0 };
const placeTip = () => { tipGrp.visible = tp.y < 30; tipGrp.position.set(tp.x, tp.y, tp.z); };
['tx', 'ty', 'tz'].forEach((n, i) => fig.param(n, i === 1 ? 40 : 0, v => { tp['xyz'[i]] = v; placeTip(); }));
const lt = { y: 40, cure: 0 };
const placeLight = () => { light.visible = lt.y < 30; light.position.set(0, lt.y, 0.5); light.set(lt.cure); };
fig.param('ly', 40, v => { lt.y = v; placeLight(); });
fig.param('cure', 0, v => { lt.cure = v; placeLight(); });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [seal.central], color: 0xd8c294, kind: 'plain' }
]);
// pieces that are not on the cut are clipped with it (no cap), so nothing floats over the cut face
[seal.mb, seal.db, seal.lingual, ...Object.values(etch)].forEach(m => { m.material = m.material.clone(); m.material.clippingPlanes = [fig.section.plane]; });
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-4.5, 4.5], offset: CUT } });
fig.view('Chewing surface', { theta: 0.2, phi: 0.35, zoom: 0.85, section: false, focus: [0, s.crownL, 0] });

// --- the procedure (camera from above and mesial; the cut removes the mesial half, viewed from +x)
const TOP = s.crownL, OCC = [0, TOP - 0.5, 0];
const tipAt = (xn, zn) => { const p = gp(xn, zn); return { tx: p[0], ty: p[1] + 0.25, tz: p[2] }; };
const park = { ty: 40 };
fig.procedure([
  { label: 'Deep grooves', caption: 'A newly erupted molar: its grooves trap plaque where brushing cannot reach.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: 0.9, phi: 1.15, zoom: 1.05, section: false, labels: [] },
    { fov: 28, dur: 2.4, hold: 2.0, theta: 0.35, phi: 0.55, zoom: 0.72, focus: OCC, labels: ['Grooves'], key: true }] },
  { label: 'Clean and etch', caption: 'The grooves are cleaned, etched with a mild acid gel, rinsed and dried.', beats: [
    { dur: 1.0, hold: 0.1, set: Object.assign(tipAt(-0.74, 0), { ty: gp(-0.74, 0)[1] + 3 }), labels: ['Applicator tip'] },
    { dur: 0.5, hold: 0, set: tipAt(-0.74, 0), labels: ['Applicator tip'] },
    { dur: 2.2, hold: 0, ease: 'linear', set: Object.assign(tipAt(0.74, 0), { etch: 0.6 }), labels: ['Applicator tip'] },
    { dur: 1.2, hold: 0.2, ease: 'linear', set: Object.assign(tipAt(0.05, -0.64), { etch: 1 }), labels: ['Applicator tip'] },
    { dur: 0.8, hold: 1.4, set: park, labels: ['Etch gel'], key: true },
    { dur: 0.8, hold: 0.3, set: { etch: 0 }, labels: [] }] },
  { label: 'Flow the sealant', caption: 'A runny resin is laid along each groove and flows into it.', beats: [
    { dur: 1.0, hold: 0.1, set: Object.assign(tipAt(-0.74, 0), { ty: gp(-0.74, 0)[1] + 3 }), labels: ['Applicator tip'] },
    { dur: 0.5, hold: 0, set: tipAt(-0.74, 0), labels: ['Applicator tip'] },
    { dur: 2.6, hold: 0, ease: 'linear', set: Object.assign(tipAt(0.74, 0), { seal: 0.6 }), labels: ['Applicator tip', 'Sealant'] },
    { dur: 1.4, hold: 0.2, ease: 'linear', set: Object.assign(tipAt(0.25, 0.66), { seal: 1 }), labels: ['Applicator tip', 'Sealant'] },
    { dur: 1.2, hold: 1.6, theta: 0.5, phi: 0.7, set: park, labels: ['Sealant'], key: true }] },
  { label: 'Light cure', caption: 'Blue light sets the resin in seconds.', beats: [
    { dur: 1.0, hold: 0.1, theta: 0.95, phi: 1.12, zoom: 1.05, set: { ly: TOP + 2.6 }, labels: ['Curing light'] },
    { dur: 0.3, hold: 1.4, set: { cure: 1 }, labels: ['Curing light', 'Sealant'], key: true },
    { dur: 0.3, hold: 0, set: { cure: 0 } },
    { dur: 0.8, hold: 0.2, set: { ly: 40 }, labels: [] }] },
  { label: 'Sealed', caption: 'Cut across the groove: the resin fills the fissure to its rims. Nothing was drilled.', beats: [
    { dur: 0, hold: 0, section: true, offset: 6.5 },
    { dur: 2.4, hold: 0.3, theta: Math.PI / 2 - 0.12, phi: 1.2, zoom: 0.7, focus: [CUT, TOP - 1.5, 0], offset: CUT, labels: ['Enamel', 'Dentin'] },
    { dur: 2.0, hold: 1.6, zoom: 0.42, phi: 1.32, focus: [CUT, CUTP[1] - 0.7, 0], labels: ['Sealant', 'Enamel'] },
    { dur: 2.2, hold: 2.4, zoom: 0.52, theta: Math.PI / 2 - 0.2, phi: 0.98, focus: [CUT, TOP - 1.6, 0], labels: ['Sealant', 'Enamel', 'Dentin'], key: true }] }
]);
fig.start();
