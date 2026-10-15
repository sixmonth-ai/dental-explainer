// Comparison: four crown materials on the same mandibular left first molar (FDI 36 = Universal 19), side by side and cut by
// one mesio-distal section. Frame: +x = mesial (each tooth), +z = buccal, CEJ / margin at y = 0. mm.
// poster: end
// Each set has its own preparation, cut with that material's typical reductions, and a crown made with the same numbers so it
// seats exactly. The metal-ceramic crown carries a metal coping under its porcelain. The crowns lift to compare the stumps.
const FDI = 36;
const SETS = [   // typical reductions (dental-facts.md §14; gold and posterior glass-ceramic values are "about", see report)
  { key: 'gold', name: 'Gold', prep: { occlusal: 1.2, axial: 0.6, margin: 0.4 }, look: 'Gold colour, thin and tough', info: 'Cast gold alloy: the most conservative classic crown (about 1 to 1.5 mm on top, about 0.5 mm on the sides). Wears like enamel, but it is not tooth-coloured.' },
  { key: 'mc', name: 'Metal-ceramic', prep: { occlusal: 2.0, axial: 1.4, margin: 1.0 }, look: 'Porcelain over a metal coping', info: 'Porcelain fused to a metal coping: needs the most room (about 2 mm on top, about 1.2 to 1.5 mm on the sides, a shoulder) for metal plus porcelain. The coping can show as a grey line if the gum recedes.' },
  { key: 'zr', name: 'Zirconia', prep: { occlusal: 1.0, axial: 0.7, margin: 0.4 }, look: 'Strong, bright, opaque', info: 'Monolithic zirconia: very strong, so it can be thin (about 1 to 1.5 mm on top, 0.5 to 1 mm on the sides, a light chamfer). Opaque and bright.' },
  { key: 'ld', name: 'Lithium disilicate', prep: { occlusal: 1.5, axial: 1.2, margin: 1.0 }, look: 'Most lifelike, needs more bulk', info: 'Lithium disilicate glass-ceramic: the most translucent and lifelike, but it needs more thickness (about 1.5 mm or more on top, 1 to 1.5 mm on the sides, a rounded shoulder) and is bonded.' }
];
const COPING = 0.4;          // metal coping thickness under porcelain (about; textbook value, see report)
const GAP = 12.6;              // centre-to-centre spacing of the sets
const X = i => (i - 1.5) * GAP;

const fig = DK.figure({
  fov: 30,
  title: 'Crown materials compared',
  subtitle: 'FDI 36 (Universal 19). Typical thickness of each crown, cut through the middle.',
  view: { theta: 0.35, phi: 1.12, margin: 0.9 }
});

const spec = DK.toothPreset(FDI);
const bone = DK.bone({ width: 4 * GAP + 2, height: 14, depth: 12.5, cortical: 1.2, crest: 1.6 }); bone.position.y = -1.8;
const gum = DK.gingiva({ width: 4 * GAP + 2, height: 3.2, depth: 13.2, crest: 1.3, around: SETS.map((S, i) => ({ x: X(i), z: 0, md: spec.mdC - 2 * S.prep.margin, bl: spec.blC - 2 * S.prep.margin, rise: 0.8 })) }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum at the crown margins.' });

const mats = {
  gold: DK.mat('gold'),
  mc: DK.mat('ceramic', { color: 0xe9e5da }),
  zr: DK.mat('zirconia'),
  ld: DK.mat('ceramic', { color: 0xe4dac6, roughness: 0.25, clearcoat: 0.5 })
};
const caps = { gold: 0xb39a6c, mc: 0xd9d5ca, zr: 0xd2d3cd, ld: 0xd6c9ad };   // a step darker than the stage so each shell reads at thumbnail size
const metal = DK.mat('steel', { color: 0x8c8f8c, roughness: 0.45, metalness: 0.7 });
const sec = { crowns: [], copings: [], stumps: [], pulps: [] };
const sets = SETS.map((S, i) => {
  const t = DK.tooth(spec, { omit: ['enamel', 'dentin'] });
  const stump = DK.prep(t.spec, S.prep); t.group.add(stump);
  t.group.position.x = X(i);
  const crown = DK.restorationCrown(t.spec, 'ceramic', S.prep); crown.material = mats[S.key]; crown.material.userData.capColor = caps[S.key];
  const cap = new THREE.Group(); cap.add(crown); cap.position.x = X(i);
  let coping = null;
  if (S.key === 'mc') {   // a solid one coping-thickness bigger than the stump: in section it paints a metal band between porcelain and dentin
    coping = DK.prep(t.spec, { occlusal: S.prep.occlusal - COPING, axial: S.prep.axial - COPING, margin: S.prep.margin - COPING });
    coping.material = metal; cap.add(coping);
  }
  sec.crowns.push(crown); if (coping) sec.copings.push(coping); sec.stumps.push(stump, t.layers.root); sec.pulps.push(t.layers.pulp);
  fig.part(t.group, { name: S.name + ' prep', label: false, info: `Prepared for ${S.name.toLowerCase()}: about ${S.prep.occlusal} mm off the top and ${S.prep.axial} mm off the sides.` });
  const part = fig.part(cap, { name: S.name, sub: `top ~${S.prep.occlusal}, sides ~${S.prep.axial} mm`, anchor: [0.4, t.spec.crownL - 0.6, 1.2], explode: [0, 9, 0], dim: false, info: S.info });
  return { S, t, stump, crown, coping, cap, part };
});
const mcSet = sets[1], zrSet = sets[2];
fig.part(mcSet.coping, { inPlace: true, name: 'Metal coping', anchor: [-(spec.mdC / 2 - mcSet.S.prep.axial + COPING / 2) + 0.05, 2.4, 0], dim: false, when: (e, s) => s.enabled && e < 0.05, info: 'The metal shell that the porcelain is fired onto, about 0.3 to 0.5 mm thick.' });
fig.part(mcSet.stump, { inPlace: true, name: 'Most tooth removed', anchor: [0, spec.crownL - mcSet.S.prep.occlusal - 0.6, spec.blC / 2 - mcSet.S.prep.axial], dim: false, info: 'Metal plus porcelain needs the most room.' });
fig.part(zrSet.stump, { inPlace: true, name: 'Least tooth removed', anchor: [0, spec.crownL - zrSet.S.prep.occlusal - 0.6, spec.blC / 2 - zrSet.S.prep.axial], dim: false, accent: true, info: 'Strong monolithic zirconia can be thin, so less tooth is cut.' });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  ...sets.map(o => ({ objects: [o.crown], color: caps[o.S.key], kind: o.S.key === 'gold' ? 'metal' : 'plain' })),
  { objects: sec.copings, color: 0x8c8f8c, kind: 'metal' },
  { objects: sec.stumps, color: DK.COLORS.dentinCap },
  { objects: sec.pulps, color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explodeLabel: 'Lift crowns', section: { label: 'Cut', range: [-6, 6], offset: 1.0 } });
const NAMES = SETS.map(S => S.name);
const CUT = 1.0;   // through the buccal cusps, so the occlusal thickness reads over a cusp, not a groove
const HERO = { fov: 26, section: true, offset: CUT, theta: 0, phi: 1.48, zoom: 0.62, focus: [0, 1.6, 0], xray: 1, explode: 0, labels: NAMES.concat(['Metal coping']) };
fig.xray([bone, gum], false);
fig.view('Section', HERO);

// story: four crowned molars → push in on the look → crowns lift: different stumps → reseat, face the buccal side and sweep the
// cut in → hero: four shells of different thickness
fig.story([
  { dur: 0, hold: 1.4, theta: 0.35, phi: 1.12, zoom: 1, xray: 0, labels: [] },
  { dur: 2.0, hold: 2.0, theta: 0.25, phi: 1.2, zoom: 0.8, focus: [0, 4, 0], labels: NAMES },
  { dur: 2.4, hold: 2.4, theta: 0.3, phi: 0.95, zoom: 0.9, explode: 1, labels: ['Most tooth removed', 'Least tooth removed'] },
  { fov: 26, dur: 2.2, hold: 0.3, theta: 0, phi: 1.5, zoom: 0.8, explode: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.2, hold: 0.6, offset: CUT, labels: [] },
  Object.assign({ dur: 1.8, hold: 2.8 }, HERO)
]);
fig.start();
