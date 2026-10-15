// Periapical abscess on the mandibular left first molar (FDI 36 = Universal 19): story in a bucco-lingual cut through the distal root (frame: +x mesial, +z buccal, CEJ at y = 0; camera on the mesial side, buccal on the viewer's left).
// poster: end
// Deep decay has killed the pulp; infection leaves the root tip, destroys bone (DK.periapicalLesion, ~5 mm) and drains as pus through the buccal plate to a gum boil (sinus tract, schematic). Sizes in mm.
const FDI = 36;
const fig = DK.figure({
  fov: 26,
  title: 'Tooth abscess',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut cheek to tongue through the back root.',
  view: { theta: Math.PI / 2 - 0.5, phi: 1.3 }
});

// --- tooth, bone, and the soft tissue that covers the bone (gum and lining of the cheek side)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
// the distal root curves ~0.9 mm distally; tipping the tooth 4 degrees stands its canal upright in one cut plane
const root = s.roots[1], TILT = Math.atan2(-root.apex[0], root.len);
tooth.group.rotation.z = TILT;
const toWorld = (x, y, z) => [x * Math.cos(TILT) - y * Math.sin(TILT), x * Math.sin(TILT) + y * Math.cos(TILT), z];
const midC = DK.canalAt(s, 'D', -root.len * 0.5), CUT = toWorld(midC.x, -root.len * 0.5, 0)[0] - 0.08;   // the cut plane (x) down the distal canal
const CREST = -1.8, BONE_D = 12.5, SOFT = 1.3;
const bone = DK.bone({ width: 15, height: 19, depth: BONE_D, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 15.4, height: 17.5, depth: BONE_D + 2 * SOFT, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The jawbone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum and the lining of the mouth cover the bone.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots, usually three canals.' });

// --- the cause: decay into the pulp, which has died (lesion centred on the cut, in tooth coordinates)
const lesionC = DK.cariesLesion(tooth, { site: 'occlusal', at: [(CUT + 6 * Math.sin(TILT)) / (s.md / 2), 0], stage: 5, reactionary: false });
const M = lesionC.meshes;

// --- the abscess at the distal root tip
const APEX_L = [root.x + root.apex[0], -root.len, root.z], APEX = toWorld(...APEX_L);
const R_ABS = 2.5;
const abscess = DK.periapicalLesion({ radius: R_ABS, seed: 7, color: 0x8d7466 }); abscess.position.set(APEX_L[0] - 0.1, APEX_L[1] - 0.5, APEX_L[2]);
tooth.group.add(abscess);

// --- the sinus tract: pus tunnels from the abscess through the buccal plate to the gum surface (world frame, in the cut plane)
const ZS = BONE_D / 2 + SOFT;          // outer surface of the soft tissue on the buccal side
const EXIT_Y = -8.6;
const TRACT = [[CUT, APEX[1] - 0.2, 1.4], [CUT, APEX[1] + 0.9, 3.4], [CUT, APEX[1] + 2.6, 5.2], [CUT, EXIT_Y - 0.5, 6.5], [CUT, EXIT_Y, ZS + 0.75]];
const pusMat = DK.mat('pdl', { color: 0xc8b07c, cap: 0xc8b07c, roughness: 0.6 });
const segs = [];
for (let i = 0; i < TRACT.length - 1; i++) { const a = TRACT[i], b = TRACT[i + 1], mid = a.map((v, k) => (v + b[k]) / 2); segs.push(DK.tube([a, mid, b], 0.42, pusMat, { caps: true })); }
segs.forEach(m => { m.visible = false; fig.world.add(m); });
// the gum boil: a small raised swelling where the tract opens
const boil = DK.lathe([[0, -0.6], [1.9, -0.6], [1.9, -0.1], [1.55, 0.45], [0.95, 0.85], [0, 0.98]], 40, DK.mat('gingiva', { color: 0xc98e84, cap: 0xc98e84 }));
boil.rotation.x = Math.PI / 2; boil.position.set(CUT, EXIT_Y, ZS - 0.05); boil.scale.setScalar(0.01); boil.visible = false; fig.world.add(boil);

// --- labels
const cutOn = (e, sec) => sec.enabled;
const midCanal = DK.canalAt(s, 'MB', -6);
fig.part(M.cavity, { inPlace: true, name: 'Deep decay', anchor: () => lesionC.point(0.4, 0, 0), dim: false, info: 'Decay that reached the pulp let bacteria in.' });
fig.part(L.pulp, { inPlace: true, name: 'Dead pulp', sub: 'infected', anchor: [CUT + 2.2 * Math.sin(TILT), 2.2, 0], dim: false, when: cutOn, info: 'Once bacteria reach it, the pulp dies (necrosis). A dead pulp feels nothing itself; the pain comes from the tissues around the root tip.' });
fig.part(abscess, { inPlace: true, name: 'Abscess', sub: 'infection at the root tip', anchor: [0.2, -0.9, 0.0], labelOffset: [140, 20], accent: true, dim: false, info: 'Bacteria from the dead canal inflame the tissue at the root tip and destroy the bone around it: a dark area on an X-ray. Pus collects here; it often hurts to bite on the tooth.' });
fig.part(segs[2], { inPlace: true, name: 'Pus drains', sub: 'through the bone', anchor: [CUT, (TRACT[2][1] + TRACT[3][1]) / 2, (TRACT[2][2] + TRACT[3][2]) / 2], dim: false, when: () => segs[2].visible, info: 'Pus follows the path of least resistance through the thin outer plate of bone, a channel called a sinus tract. Draining can ease the pain, but the infection stays until the tooth is treated.' });
fig.part(boil, { inPlace: true, name: 'Gum boil', sub: 'where pus comes out', anchor: [0.1, 0.55, -1.0], labelOffset: [-90, -60], dim: false, when: () => boil.visible, info: 'A small pimple on the gum (parulis) where the tract opens. It may come and go, but it is a sign of infection: a root canal treatment or extraction removes the cause.' });

// --- params
const PULP = DK.color(DK.COLORS.pulp), NECRO = DK.color(0x6b5d59), PULP_GROUP = 10;
fig.param('necrosis', 0, v => { L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(NECRO, v); }); if (fig.section) DK.capColor(fig.section, PULP_GROUP, v > 0.5 ? 0x6e615d : DK.COLORS.pulpCap); });
fig.param('abscess', 0, k => abscess.set(k));
fig.param('tract', 0, k => segs.forEach((m, i) => { m.visible = k * segs.length > i + 0.15; }));
fig.param('boil', 0, k => { boil.visible = k > 0.02; boil.scale.setScalar(Math.max(0.01, k)); });

fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [abscess], color: 0x8d7466, kind: 'gingiva' },
  { objects: [boil], color: 0xc98e84, kind: 'gingiva' },
  { objects: segs, color: 0xc8b07c, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
fig.xray([gum, bone], false);
fig.view('Gum boil', { theta: Math.PI / 2 - 1.1, phi: 1.45, zoom: 0.6, focus: [CUT, EXIT_Y, ZS - 1], section: false });

// --- story: the decayed molar, the cut, the dead pulp, the abscess grows, pus tunnels out, the gum boil
const SIDE = Math.PI / 2 - 0.04;
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: Math.PI / 2 - 0.6, phi: 1.05, zoom: 1.0, section: false, xray: 0.75, labels: ['Deep decay'], caption: 'A lower molar with deep decay.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: SIDE, phi: 1.45, zoom: 1, xray: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7.5 },
  { dur: 2.2, hold: 1.2, offset: CUT, set: { necrosis: 1 }, labels: ['Deep decay', 'Dead pulp'], caption: 'Bacteria have killed the pulp.' },
  { dur: 2.4, hold: 1.6, zoom: 0.62, focus: [CUT, APEX[1] + 1, 1.5], set: { abscess: 1 }, labels: ['Abscess'], caption: 'The infection leaves the root tip and eats into the bone.' },
  { dur: 2.4, hold: 1.4, focus: [CUT, (APEX[1] + EXIT_Y) / 2, 3.5], set: { tract: 1 }, labels: ['Abscess', 'Pus drains'], caption: 'Pus tunnels out through the thin bone on the cheek side.' },
  { dur: 1.6, hold: 1.6, set: { boil: 1 }, labels: ['Pus drains', 'Gum boil'], caption: 'It opens on the gum as a small boil.' },
  { dur: 2.4, hold: 2.4, zoom: 1, focus: 'auto', theta: SIDE - 0.22, phi: 1.38, labels: ['Deep decay', 'Dead pulp', 'Abscess', 'Pus drains', 'Gum boil'] }
]);
fig.start();
