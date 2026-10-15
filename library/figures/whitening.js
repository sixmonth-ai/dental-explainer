// How peroxide whitening works on an upper right central incisor (FDI 11 = Universal 8), crown up (model convention), in a
// poster: end
// labio-lingual cut: a peroxide gel on the labial surface, peroxide passing through the enamel into the dentin, and the
// coloured stain molecules there broken down into smaller, paler pieces, so the dentin (which sets most of the tooth's
// colour) looks lighter. Molecules are drawn hugely enlarged and schematic. Patient-facing story.
// Frame: +x = mesial, +z = labial, y up, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const fig = DK.figure({
  fov: 28,
  title: 'How teeth whitening works',
  subtitle: 'Upper central incisor, FDI 11 (Universal 8), crown up.',
  view: { theta: 0.85, phi: 1.25 }
});

const tooth = DK.tooth(11), s = tooth.spec, L = tooth.layers;
const { lerp, smooth, clamp } = DK.util;

// --- context: bone and gingiva around the root (fit: false, so the camera frames the tooth)
const bone = DK.bone({ width: 15, height: 15, depth: s.blC + 3, cortical: 0.9, crest: 1.2 }); bone.position.y = -1.8;
const gum = DK.gingiva({ width: 15.4, height: 3.4, depth: s.blC + 3.8, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.y = 0.6;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The bone around the root (tooth shown crown up).' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Whitening gel is kept off the gum, which it can irritate.' });

// --- colour: dentin sets most of a tooth's shade through the translucent enamel. It starts a little yellow and lightens.
const YELLOW = { dentin: 0xc8a46c, enamel: 0xe4d2a6 }, WHITE = { dentin: 0xd8cbb0, enamel: 0xf1eee8 };
const dentinMats = [L.dentin.material], enamelMat = L.enamel.material;

// --- the gel: a closed layer over the labial face of the crown (local helper; a solid, so its cut face reads as a layer)
function labialLayer(yBot, yTop, thick, span) {
  const R = 14, C = 48, rows = 2 * R + 2;
  const put = (y, th, off) => { const q = DK.toothSurfaceAt(s, y, th), d = Math.hypot(q.x, q.z) || 1; return [q.x + q.x / d * off, y, q.z + q.z / d * off]; };
  return DK.gridGeometry(rows, C, (i, j) => {
    const v = (j % C) / C, th = lerp(Math.PI / 2 - span, Math.PI / 2 + span, v), edge = Math.pow(Math.sin(Math.PI * v), 0.35);
    if (i <= R) { const u = i / R; return put(lerp(yBot, yTop, u), th, thick * edge * Math.pow(Math.sin(Math.PI * Math.min(1, 0.03 + u * 0.97)), 0.3) - 0.05); }
    if (i <= 2 * R + 1) { const u = (i - R - 1) / R; return put(lerp(yTop, yBot, u), th, -0.25); }
    return put(yBot, th, -0.05);
  });
}
const gelMat = new THREE.MeshStandardMaterial({ color: DK.color(0xf0f6f8), emissive: DK.color(0x8aa3aa), emissiveIntensity: 0.6, roughness: 0.1, metalness: 0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const gel = new THREE.Mesh(labialLayer(0.9, s.crownL * 0.93, 0.55, 1.15), gelMat); tooth.group.add(gel);

// --- which points of the mid-labiolingual plane (x = 0) lie in enamel, in dentin (not pulp): ray parity on the real meshes
const probes = [];
const meshesOf = obj => { const out = []; obj.updateMatrixWorld(true); obj.traverse(m => { if (m.isMesh) out.push(m); }); return out; };
const probeOf = m => { const p = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); p.matrixAutoUpdate = false; p.matrixWorld.copy(m.matrixWorld); return p; };
tooth.group.updateMatrixWorld(true);
const solid = obj => meshesOf(obj).map(probeOf);
const ENAMEL = solid(L.enamel), DENTIN = solid(L.dentin), PULP = solid(L.pulp);
const ray = new THREE.Raycaster(), dir = new THREE.Vector3(0.0123, 0.0347, 0.9993).normalize();   // across the crown, so open ends (chamber floor) never break the parity
const inside = (meshes, p) => meshes.some(m => { ray.set(p, dir); return ray.intersectObject(m, false).length % 2 === 1; });
const P = new THREE.Vector3();
const nearPulp = (y, z) => [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]].some(([dy, dz]) => { P.set(0, y + dy, z + dz); return inside(PULP, P); });
const where = (y, z) => { if (nearPulp(y, z)) return 'pulp'; P.set(0, y, z); if (inside(ENAMEL, P)) return 'enamel'; if (inside(DENTIN, P)) return 'dentin'; return 'out'; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// --- stain molecules (chromogens): small clusters of 3 to 4 linked beads, most in the dentin, a few in the enamel
const stainMat = new THREE.MeshBasicMaterial({ color: DK.color(0x7a4a22), toneMapped: false, transparent: true });
const paleMat = new THREE.MeshBasicMaterial({ color: DK.color(0xf4ecd9), toneMapped: false, transparent: true, opacity: 0 });
const molecules = new THREE.Group(), peroxide = new THREE.Group(); tooth.group.add(molecules, peroxide);
const bead = new THREE.SphereGeometry(1, 12, 8), stains = [];
for (let tries = 0, n = 0; tries < 900 && n < 34; tries++) {
  const y = lerp(1.2, s.crownL - 1.2, rnd()), z = lerp(-s.bl / 2, s.bl / 2, rnd()), w = where(y, z);
  if (w === 'out' || w === 'pulp' || (w === 'enamel' && rnd() > 0.15)) continue;
  if (stains.some(t => Math.hypot(t.y - y, t.z - z) < 0.75)) continue;
  const grp = new THREE.Group(); grp.position.set(0, y, z); const k = 3 + (rnd() < 0.5 ? 1 : 0), parts = [];
  for (let i = 0; i < k; i++) {
    const a = i / k * Math.PI * 2 + rnd(), r = 0.13, dark = new THREE.Mesh(bead, stainMat), pale = new THREE.Mesh(bead, paleMat);
    const off = new THREE.Vector3(0, Math.sin(a) * 0.19, Math.cos(a) * 0.19);
    [dark, pale].forEach(m => { m.scale.setScalar(r); m.position.copy(off); grp.add(m); });
    parts.push({ dark, pale, off });
  }
  molecules.add(grp); stains.push({ y, z, grp, parts, depth: s.bl / 2 - z + 0.4 * rnd(), w }); n++;
}
// --- peroxide: small beads that start in the gel and spread through the enamel into the dentin (and a little toward the pulp)
const perMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0 });
const pers = [];
for (let tries = 0; tries < 1200 && pers.length < 30; tries++) {
  const y = lerp(1.4, s.crownL - 1.0, rnd()), z = lerp(-0.6, s.bl / 2 - 0.2, rnd()), w = where(y, z);
  if (w !== 'enamel' && w !== 'dentin') continue;
  const surf = DK.toothSurfaceAt(s, y, Math.PI / 2).z, m = new THREE.Mesh(bead, perMat); m.scale.setScalar(0.065);
  const start = new THREE.Vector3(0, y + 0.3 * (rnd() - 0.5), surf + 0.12 + 0.3 * rnd()), end = new THREE.Vector3(0, y, z);
  peroxide.add(m); pers.push({ m, start, end, delay: (surf - z) / s.bl * 0.55 + 0.1 * rnd() });
}

// --- parts
fig.part(tooth.group, { name: 'Central incisor 11', label: false, info: 'Upper right central incisor (Universal 8). Shown crown up.' });
fig.part(gel, { inPlace: true, name: 'Whitening gel', sub: 'peroxide', anchor: [0.8, s.crownL * 0.62, DK.toothSurfaceAt(s, s.crownL * 0.62, Math.PI / 2 - 0.12).z + 0.45], dim: false, info: 'A gel of hydrogen peroxide (or carbamide peroxide, which releases it), in a tray or applied at the dentist.' });
const onCut = (e, sec) => sec.enabled && Math.abs(sec.offset) < 0.4;
const near = (pick) => { const t = stains.filter(pick).sort((a, b) => a.y - b.y)[0] || stains[0]; return t; };
const sD = near(t => t.w === 'dentin' && t.z < -0.9 && t.y > s.crownL * 0.3), sB = near(t => t.w === 'dentin' && t.z > 0.3 && t.y > s.crownL * 0.3);   // one left intact (far from the gel), one broken down
fig.part(sB.grp, { inPlace: true, name: 'Broken down', sub: 'smaller, paler pieces', anchor: [0.15, 0, 0], when: onCut, dim: false, info: 'Oxidised by the peroxide into smaller molecules that reflect less colour. The tooth structure itself is not bleached away.' });
fig.part(sD.grp, { inPlace: true, name: 'Stain molecules', sub: 'colour from inside the tooth', anchor: [0.15, 0, 0], when: onCut, dim: false, info: 'Large coloured organic molecules from food, drink, tobacco and age. Drawn hugely enlarged.' });
const pT = pers.slice().sort((a, b) => (b.end.z - a.end.z))[Math.floor(pers.length * 0.35)];
fig.part(peroxide, { inPlace: true, name: 'Peroxide', sub: 'passes through the enamel', anchor: () => [0.15, pT.m.position.y, pT.m.position.z], when: onCut, accent: true, dim: false, info: 'Peroxide is a small molecule: it diffuses through enamel and dentin and oxidises the stain molecules it meets.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', sub: 'see-through', anchor: [0.15, s.crownL * 0.45, -s.blC / 2 + 0.25], when: onCut, dim: false, info: 'Enamel is translucent, so the colour of the dentin under it shows through. Whitening does not remove or soften enamel.' });
const dentinPart = fig.part(L.dentin, { inPlace: true, name: 'Dentin', sub: 'sets the tooth colour', anchor: [0.15, s.crownL * 0.2, -0.9], when: onCut, dim: false, info: 'Most of the visible change happens here. Fillings and crowns do not whiten. Some sensitivity during treatment is common and usually passes.' });

// --- section: labio-lingual through the middle of the crown; camera on +x looks at the cut (labial on the viewer's right)
fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [gel], color: 0xd4dcde, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
gelMat.clippingPlanes = [fig.section.plane];
const DENTIN_CAP = 5;   // index of the dentin group above
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3, 3], offset: 0 } });

// --- params
const tint = k => {   // 0 = stained, 1 = whitened
  const d = DK.color(YELLOW.dentin).lerp(DK.color(WHITE.dentin), k), e = DK.color(YELLOW.enamel).lerp(DK.color(WHITE.enamel), k);
  dentinMats.forEach(m => m.color.copy(d)); enamelMat.color.copy(e);
  fig.section.caps[DENTIN_CAP].material.uniforms.uColor.value.copy(DK.color(0xc4a675).lerp(DK.color(DK.COLORS.dentinCap), k).lerp(DK.color(0xe2d7bf), 0.45 * k));
};
const S = { gel: 0, flow: 0, bleach: 0 };
const update = () => {
  gelMat.opacity = 0.42 * S.gel; gel.visible = S.gel > 0.01;
  const showCut = fig.section.enabled && Math.abs(fig.section.offset) < 0.4, x = (fig.section.enabled ? fig.section.offset : 0) + 0.15;
  molecules.visible = peroxide.visible = showCut; molecules.position.x = peroxide.position.x = x;
  perMat.opacity = smooth(0, 0.15, S.flow) * (1 - 0.35 * S.bleach);
  pers.forEach(p => { const k = smooth(0, 1, clamp((S.flow - p.delay) / 0.45, 0, 1)); p.m.position.lerpVectors(p.start, p.end, k); });
  stains.forEach(t => { const k = smooth(0, 1, clamp((S.bleach - t.depth / s.bl * 0.85) / 0.4, 0, 1));
    t.parts.forEach(q => { const spread = 1 + 1.4 * k; q.dark.position.copy(q.off).multiplyScalar(spread); q.pale.position.copy(q.dark.position);
      q.dark.scale.setScalar(0.13 * (1 - 0.45 * k)); q.pale.scale.setScalar(0.13 * (1 - 0.6 * k)); }); t.k = k; });
  stainMat.opacity = 1; paleMat.opacity = 1;
  stains.forEach(t => t.parts.forEach(q => { q.dark.visible = t.k < 0.5; q.pale.visible = t.k >= 0.5; }));
  tint(S.bleach);
};
['gel', 'flow', 'bleach'].forEach(n => fig.param(n, 0, v => { S[n] = v; update(); }));
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged(); update(); };
update();   // the stained starting colour
fig.slider('Whitening', 0, 1, 0.01, 1, v => fig.goTo({ set: { gel: v > 0.02 ? 1 : 0, flow: Math.min(1, v * 1.6), bleach: clamp((v - 0.3) / 0.7, 0, 1) } }, 0.3));

// --- story: a yellowed tooth → gel on → the cut shows the stains → peroxide moves in → stains break down, dentin lightens
const SIDE = { theta: Math.PI / 2 - 0.12, phi: 1.42, zoom: 0.6, focus: [0, s.crownL * 0.4, 0], fov: 26 };
fig.story([
  { dur: 0, hold: 1.3, theta: 0.85, phi: 1.25, zoom: 0.8, focus: [0, s.crownL * 0.45, 0], section: false, labels: [], caption: 'A tooth that has darkened and yellowed.' },
  { dur: 1.8, hold: 1.2, theta: 0.55, phi: 1.32, set: { gel: 1 }, labels: ['Whitening gel'], caption: 'A peroxide gel goes on the front of the tooth.' },
  Object.assign({ dur: 2.2, hold: 0.1, labels: [] }, SIDE),
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.0, hold: 1.6, offset: 0, labels: ['Stain molecules', 'Enamel', 'Dentin'], caption: 'The colour comes from stain molecules, mostly in the dentin under the see-through enamel.' },
  { dur: 2.8, hold: 1.4, set: { flow: 1 }, labels: ['Whitening gel', 'Peroxide'], caption: 'Peroxide passes through the enamel into the dentin.' },
  { dur: 2.6, hold: 1.0, set: { bleach: 0.8 }, labels: ['Peroxide', 'Broken down'], caption: 'It breaks the stain molecules into smaller, paler pieces.' },
  { dur: 2.2, hold: 2.6, theta: Math.PI / 2 - 0.3, zoom: 0.6, labels: ['Whitening gel', 'Peroxide', 'Broken down', 'Stain molecules', 'Dentin'], caption: 'The dentin looks lighter, so the whole tooth does.' }
]);
fig.start();
