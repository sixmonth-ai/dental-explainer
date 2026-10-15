// Endo-perio lesion on the mandibular left first molar (FDI 36 = Universal 19), story in a mesio-distal cut through the mesiobuccal canal (frame: +x mesial, +z buccal, CEJ at y = 0; camera on the buccal side, mesial on the viewer's right).
// poster: end
// Deep decay kills the pulp and an apical lesion forms at the mesial root tip (DK.periapicalLesion, ~5 mm); a periodontal pocket with an
// angular bone defect runs down the mesial surface of the same root from the crest (DK.perioBone with a defect that follows the root,
// DK.pocket). The two grow toward each other and join into one combined lesion along the root. Healthy crest 1.8 mm below the CEJ (§13, §17). Sizes in mm.
const FDI = 36, CREST = -1.8, MARGIN = 1.2;
const { smooth, lerp } = DK.util;

const fig = DK.figure({
  fov: 26,
  title: 'Endo-perio lesion',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut through the mesial root.',
  view: { theta: 0.12, phi: 1.42, margin: 0.92 }
});

// --- tooth
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const mesial = s.roots[0], CUT = DK.canalAt(s, 'MB', -6).z;           // the cut runs down the mesiobuccal canal
const APEX = [mesial.x + mesial.apex[0], -mesial.len, CUT];
const XS = DK.toothSurfaceAt(s, -2.5, 0, 0).x;                         // mesial surface of the mesial root near the crest

// --- the endodontic side: deep decay, a necrotic pulp, an apical lesion
const decay = DK.cariesLesion(tooth, { site: 'occlusal', at: [0.32, CUT / (s.bl / 2)], stage: 5, reactionary: false });
const M = decay.meshes;
const R_LES = 2.6;
const lesion = DK.periapicalLesion({ radius: R_LES, seed: 5, color: 0x9a6e69 });
lesion.position.set(APEX[0] + 0.15, APEX[1] - 0.3, CUT); tooth.group.add(lesion);

// --- the periodontal side: an angular defect hugging the mesial root, from the crest to the apical lesion (block frame: crest at y = 0)
const BOTTOM = APEX[1] + R_LES * 0.15;                                  // the defect reaches the top of the apical lesion
const DEPTH = CREST - BOTTOM;
const XIN = mesial.x + mesial.apex[0] + 0.55;                         // inner edge: the root covers anything distal of here
const defect = (x, z) => {
  const ux = x > XS - 0.3 ? (x - XS + 0.3) / 3.6 : x < XIN ? (XIN - x) / 0.5 : 0, uz = (z - CUT) / 3.2;   // V: the mesial wall slopes 3.6 mm out to the crest
  return -DEPTH * Math.max(0, 1 - Math.hypot(ux, uz));
};
const bone = DK.perioBone({ width: 21, height: 16.3, depth: 12, cortical: 1.2, crest: 1.4, loss: defect, level: 0 });
bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: MARGIN, crest: BOTTOM - 0.4, width: 21.4, depth: 12.8, inflamed: 0 });
const pdl = DK.perioPdl(s, 0.22, CREST + 0.1); tooth.group.add(pdl); pdl.traverse(m => { if (m.isMesh) m.material.visible = false; });
// the pocket: a dark crack between the root and the soft tissue on the mesial surface, from the gingival margin down to its base (only seen in the cut)
const POCKET_COL = 0x4a403c, pocketMat = DK.mat('pdl', { color: POCKET_COL, cap: POCKET_COL }); pocketMat.visible = false;
const NY = 40, NR = 24, pocketGeo = new THREE.BufferGeometry(), pPos = new Float32Array((NY * NR + 2) * 3), pIdx = [];
for (let i = 0; i < NY - 1; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + (j + 1) % NR, c = a + NR, d = b + NR; pIdx.push(a, c, b, b, c, d); }
const cT = NY * NR, cB = cT + 1; for (let j = 0; j < NR; j++) { pIdx.push(cT, (j + 1) % NR, j); pIdx.push(cB, (NY - 1) * NR + j, (NY - 1) * NR + (j + 1) % NR); }
pocketGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pocketGeo.setIndex(pIdx);
const pocket = new THREE.Mesh(pocketGeo, pocketMat); tooth.group.add(pocket);
pocket.set = (top, base) => { base = Math.min(base, top - 0.4);
  for (let i = 0; i < NY; i++) { const u = i / (NY - 1), y = lerp(top, base, u), sx = DK.toothSurfaceAt(s, y, 0, y < -2 ? 0 : undefined).x, w = 0.5 * Math.pow(1 - u, 0.6) + 0.06;
    for (let j = 0; j < NR; j++) { const a = j / NR * Math.PI * 2; pPos.set([sx - 0.12 + (w + 0.12) * (0.5 + 0.5 * Math.cos(a)), y, CUT + 1.6 * Math.sin(a)], (i * NR + j) * 3); } }
  pPos.set([DK.toothSurfaceAt(s, top, 0).x + 0.1, top + 0.01, CUT], cT * 3); const sb = DK.toothSurfaceAt(s, base, 0, base < -2 ? 0 : undefined).x; pPos.set([sb, base - 0.01, CUT], cB * 3);
  pocketGeo.attributes.position.needsUpdate = true; pocketGeo.computeVertexNormals(); pocketGeo.computeBoundingSphere(); return pocket; };
pocket.set(MARGIN - 0.2, -0.1);
const calc = DK.calculus(s, { kind: 'sub', from: -0.6, to: -3.4, sides: ['mesial'], n: 9, size: 0.42, seed: 3 }); tooth.group.add(calc);

fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the bone; here inflamed over the pocket.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots (mesial and distal), usually three canals.' });

// --- labels (things that exist only on the cut anchor at the cut plane)
const cutOn = (e, sec) => sec.enabled;
const zc = sec => (sec.enabled ? sec.offset : CUT) + 0.1;
const st = { necrosis: 0, endo: 0, perio: 0 };
const crestY = () => CREST + bone.crestAt(XS + 0.6, CUT);
fig.part(M.cavity, { inPlace: true, name: 'Deep decay', anchor: () => decay.point(0.3, 0, 0), dim: false, info: 'Decay that reached the pulp let bacteria in.' });
fig.part(L.pulp, { inPlace: true, name: 'Necrotic pulp', anchor: (e, sec) => [-0.6, 1.6, zc(sec)], dim: false, when: (e, sec) => sec.enabled && st.necrosis > 0.5, info: 'The infected pulp has died. Bacteria and their products leave the canal at the apex (and through lateral canals).' });
fig.part(lesion, { inPlace: true, name: 'Periapical lesion', sub: 'from the pulp', anchor: [-0.7, 0.2, 0.1], labelOffset: [-140, 20], dim: false, when: () => st.endo > 0.3, info: 'Apical periodontitis: the infected canal destroys bone at the root tip. On a radiograph, a dark area at the apex.' });
const pocketMark = new THREE.Object3D(); tooth.group.add(pocketMark);
fig.part(pocketMark, { inPlace: true, name: 'Periodontal pocket', sub: 'from the gum', anchor: (e, sec) => [XS + 0.55, lerp(CREST - 0.6, crestY(), 0.35) - 0.6, zc(sec)], labelOffset: [120, -20], dim: false, when: (e, sec) => sec.enabled && st.perio > 0.15, info: 'Plaque and calculus on the root drive periodontitis down the mesial surface: the attachment and the bone beside the root are lost, an angular (vertical) defect.' });
const joinMark = new THREE.Object3D(); tooth.group.add(joinMark);
fig.part(joinMark, { inPlace: true, name: 'Lesions join', sub: 'one lesion along the root', anchor: (e, sec) => [XS - 0.2, BOTTOM + 0.2, zc(sec)], labelOffset: [130, 40], accent: true, dim: false, when: (e, sec) => sec.enabled && st.perio > 0.95 && st.endo > 0.95, info: 'Combined endo-periodontal lesion: the apical lesion and the pocket meet, so the pocket probes deep down to the apex. Treatment starts with the root canal; the periodontal part is then managed and reassessed.' });

// --- params
const PULP = DK.color(DK.COLORS.pulp), NECRO = DK.color(0x6b5d59);
let G_GUM = 0, G_PULP = 0;
fig.param('necrosis', 0, v => { st.necrosis = v; L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(NECRO, v); }); if (fig.section) DK.capColor(fig.section, G_PULP, v > 0.5 ? 0x6e615d : DK.COLORS.pulpCap); });
fig.param('endo', 0, k => { st.endo = k; lesion.set(k); });
const calcBits = calc.children;
fig.param('perio', 0, k => { st.perio = k; bone.set(k); pocket.set(MARGIN - 0.2 - 0.5 * smooth(0, 0.3, k), lerp(-0.1, BOTTOM + 0.5, k));
  gum.set({ inflamed: smooth(0, 0.35, k), margin: MARGIN - 0.5 * smooth(0, 0.3, k) });
  calcBits.forEach((c, i) => { c.visible = k > 0.05 + 0.25 * i / calcBits.length; });
  if (fig.section) DK.capColor(fig.section, G_GUM, k > 0.3 ? DK.COLORS.gingivaInflamedCap : DK.COLORS.gingivaCap); });

const groups = [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lesion], color: 0x9a6e69, kind: 'gingiva' },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [pocket], color: 0x4a403c, kind: 'plain' },
  { objects: [calc], color: 0x5a4a40, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' }
];
G_GUM = 0; G_PULP = groups.findIndex(g => g.objects[0] === L.pulp);
fig.enableSection([0, 0, 1], groups);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
fig.xray([gum, bone, L.enamel, L.dentin, L.root], false);
fig.view('Where they meet', { theta: 0.1, phi: 1.45, zoom: 0.72, focus: [XS - 0.8, BOTTOM + 2.6, CUT], section: true, offset: CUT, xray: 0, labels: ['Periapical lesion', 'Periodontal pocket', 'Lesions join'] });

// --- story: the molar → the cut → dead pulp → the apical lesion → the pocket coming down → they join → hero shot
const FOC_APEX = [APEX[0] + 0.8, APEX[1] + 1.5, CUT], FOC_CREST = [XS, -4.5, CUT], FOC_JOIN = [XS - 0.5, BOTTOM + 1.0, CUT];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.75, phi: 1.12, zoom: 1.0, section: false, xray: 0.6, labels: ['Deep decay'], caption: 'A lower molar with deep decay.' },
  { fov: 26, dur: 2.2, hold: 0.1, theta: 0.12, phi: 1.42, zoom: 1, xray: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7.5 },
  { dur: 2.2, hold: 1.4, offset: CUT, set: { necrosis: 1 }, labels: ['Deep decay', 'Necrotic pulp'], caption: 'Bacteria reach the pulp and it dies.' },
  { dur: 2.4, hold: 1.6, zoom: 0.62, focus: FOC_APEX, theta: 0.08, set: { endo: 1 }, labels: ['Periapical lesion'], caption: 'From the pulp: a lesion at the root tip.' },
  { dur: 2.0, hold: 0.1, zoom: 0.66, focus: FOC_CREST, theta: 0.16, labels: [] },
  { dur: 2.6, hold: 1.4, set: { perio: 0.6 }, labels: ['Periodontal pocket'], caption: 'From the gum: a pocket runs down the same root.' },
  { dur: 2.4, hold: 1.8, zoom: 0.6, focus: FOC_JOIN, set: { perio: 1 }, labels: ['Periodontal pocket', 'Lesions join'], caption: 'They meet and join into one lesion.' },
  { dur: 2.4, hold: 2.6, zoom: fig.mode === 'image' ? 1.05 : 1.1, focus: fig.mode === 'image' ? 'auto' : [0.3, -5.2, CUT], theta: 0.12, phi: 1.42, labels: ['Necrotic pulp', 'Periapical lesion', 'Periodontal pocket', 'Lesions join'] }
]);
fig.start();
