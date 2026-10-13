// Example comparison: a healthy lower first molar (FDI 36 = Universal 19) next to the same tooth with periodontitis, cut by one
// shared mesio-distal section. Two independent sets (tooth, bone, gingiva, PDL) side by side along x; the diseased set adds a
// pocket, bone loss (horizontal + a mesial angular defect), a through-and-through furcation and calculus.
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0. All sizes in mm (dental-facts.md §13 and §17).
const CREST = -1.8;                        // healthy crest, ~2 mm apical to the CEJ
const H = { margin: 2.0, base: 0 };        // healthy: margin on enamel, sulcus base at the CEJ → PD 2, CAL 0
const D = { margin: -1.0, baseM: -6.5, baseD: -3.6, horizontal: 3.0, defect: 6.0 };   // periodontitis: 1 mm recession, 5.5 mm mesial pocket
const GAP = 18;                            // centre-to-centre spacing of the two sets (~1.6 × MD width)

const fig = DK.figure({
  title: 'Healthy periodontium vs periodontitis',
  subtitle: 'FDI 36 (Universal 19), mesio-distal cut. Furcation involvement on the right.',
  view: { theta: 0.28, phi: 1.36 }
});

// ---------- healthy set (viewer's left) ----------
const tH = DK.tooth(36), s = tH.spec; tH.group.position.x = -GAP / 2;
const boneH = DK.bone({ width: 15.5, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 }); boneH.position.set(-GAP / 2, CREST, 0);
const gumH = DK.perioGingiva(s, { margin: H.margin, crest: CREST, width: 16.1, depth: 13.2 }); gumH.position.x = -GAP / 2;
const pdlH = DK.pdl(s, 0.25, CREST); tH.group.add(pdlH);
const sulcus = DK.pocket(s, { margin: H.margin, base: H.base, width: 0.1 });   // a hairline in health tH.group.add(sulcus);

// ---------- periodontitis set (viewer's right) ----------
const tD = DK.tooth(36); tD.group.position.x = GAP / 2;
const mesialSurface = DK.toothSurfaceAt(s, -0.5, 0).x;          // x of the mesial root-trunk surface just below the CEJ
const loss = DK.boneLoss({
  horizontal: D.horizontal,
  defects: [{ x: mesialSurface + 0.5, z: 0, depth: D.defect, rx: 3.2, rz: 4.5, walls: 3, profile: 'angular' }],   // 3-wall infrabony defect on the mesial
  furcations: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, roots: s.roots, from: 'through', bottom: -(s.trunk + 2.5 + CREST), width: 1.5 }]
});
const boneD = DK.perioBone({ width: 15.5, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6, loss }); boneD.position.set(GAP / 2, CREST, 0);
const crestAt = (x, z) => CREST + boneD.crestAt(x, z);            // crest height in the tooth frame
const deepest = crestAt(mesialSurface + 0.2, 0);                   // the mesial defect floor
const gumD = DK.perioGingiva(s, { margin: D.margin, crest: deepest - 0.6, inflamed: 1, width: 16.1, depth: 13.2 }); gumD.position.x = GAP / 2;
const pdlD = DK.perioPdl(s, 0.25, r => Math.min(crestAt(r.x + r.ra + 0.2, 0), crestAt(r.x - r.ra - 0.2, 0))); tD.group.add(pdlD);
const wrap = th => Math.abs(((th + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);   // angle from the mesial (0..π)
const pocket = DK.pocket(s, { margin: D.margin, base: th => DK.util.lerp(D.baseD, D.baseM, DK.util.smooth(1.4, 0.6, wrap(th))), width: 0.5 }); tD.group.add(pocket);
const calcSub = DK.calculus(s, { kind: 'sub', from: -1.6, to: -5.2, sides: ['mesial', 'distal'], n: 12, size: 0.42, seed: 3 }); tD.group.add(calcSub);
const calcSupra = DK.calculus(s, { kind: 'supra', from: 0.3, to: -0.7, sides: ['mesial', 'distal'], n: 6, size: 0.38, seed: 5 }); tD.group.add(calcSupra);

// ---------- parts ----------
fig.part(tH.group, { name: 'Healthy', anchor: [0, s.crownL + 1.3, 0], info: 'Sulcus ≤ 3 mm, no attachment loss, crest ~2 mm below the CEJ.' });
fig.part(tD.group, { name: 'Periodontitis', sub: 'consistent with Stage III', anchor: [0, s.crownL + 1.3, 0], info: 'Interdental CAL ≥ 5 mm, bone loss past the coronal third, furcation Class III: the local findings of Stage III. Staging needs the whole mouth.' });
[boneH, boneD].forEach(b => fig.part(b, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone: cortical shell over cancellous bone.' }));
fig.part(gumH, { name: 'Gingiva', label: false, fit: false, info: 'Healthy gingiva: coral pink, stippled, knife-edged margin on enamel.' });
fig.part(gumD, { name: 'Inflamed gingiva', label: false, fit: false, info: 'Red, swollen, bleeds on probing. Inflammation alone is gingivitis; attachment loss makes it periodontitis.' });
const cutOn = (e, sec) => sec && sec.enabled;
fig.part(sulcus, { inPlace: true, name: 'Sulcus', sub: 'PD 2 mm, CAL 0', anchor: (e, sec) => [mesialSurface + 0.4, 1.0, (sec.enabled ? sec.offset : 0) + 0.1], when: cutOn, dim: false, info: 'Healthy probing depth ≤ 3 mm; the probe stops in the junctional epithelium near the CEJ.' });
fig.part(pdlH, { inPlace: true, name: 'Bone crest', sub: '~2 mm below the CEJ', anchor: (e, sec) => [mesialSurface + 1.6, CREST - 0.3, (sec.enabled ? sec.offset : 0) + 0.1], when: cutOn, dim: false, info: 'In health the crest sits 1–2 mm apical to the CEJ, with ~2 mm of supracrestal attachment above it.' });
fig.part(pocket, { inPlace: true, name: 'Pocket', sub: `PD ${DK.mm(D.margin - D.baseM)}, CAL ${DK.mm(-D.baseM)}`, anchor: (e, sec) => [mesialSurface + 0.45, -3.6, (sec.enabled ? sec.offset : 0) + 0.1], when: cutOn, dim: false, accent: true, info: 'Probing depth is measured from the gingival margin; attachment loss (CAL) from the CEJ. Here the margin has receded 1 mm, so CAL = PD + 1.' });
fig.part(tD.layers.root, { inPlace: true, name: 'Furcation', sub: 'through-and-through (Class III)', anchor: (e, sec) => [0, -(s.trunk + 1.4), (sec.enabled ? sec.offset : 0) + 0.1], when: cutOn, dim: false, info: 'Bone lost between the roots, buccal to lingual: Hamp Class III. The trunk of a lower first molar is only ~2–4 mm, so furcations open early.' });
fig.part(boneD, { inPlace: true, name: 'Bone loss', sub: `${DK.mm(-deepest)} below the CEJ`, anchor: (e, sec) => [mesialSurface + 2.6, deepest - 0.4, (sec.enabled ? sec.offset : 0) + 0.1], when: cutOn, dim: false, info: 'Horizontal loss plus a mesial angular (infrabony) defect. Lost bone does not grow back by itself.' });
fig.part(calcSub, { inPlace: true, name: 'Calculus', sub: 'subgingival', anchor: [calcSub.children[0].position.x, calcSub.children[0].position.y, calcSub.children[0].position.z], dim: false, info: 'Mineralised biofilm on the root: dark, hard, inside the pocket. Supragingival calculus is paler and sits at the margin.' });

// ---------- section: one plane cuts both sets. Gingiva first so the bone, painted after it, fills what it still has.
fig.enableSection([0, 0, 1], [
  { objects: [gumH], color: DK.COLORS.gingivaCap },
  { objects: [gumD], color: 0xb8847f },   // inflamed: a touch redder on the cut too
  { objects: [boneH.userData.layers.cortical, boneD.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [boneH.userData.layers.cancellous], color: 0xffffff, texture: boneH.userData.layers.cancellous.userData.capTexture },
  { objects: [boneD.userData.layers.cancellous], color: 0xffffff, texture: boneD.userData.layers.cancellous.userData.capTexture },
  { objects: [pdlH, pdlD], color: DK.COLORS.pdl },
  { objects: [sulcus, pocket], color: 0x4a403c },
  { objects: [calcSub, calcSupra], color: 0x5a4a40 },
  { objects: [tH.layers.enamel, tD.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tH.layers.root, tH.layers.dentin, tD.layers.root, tD.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [tH.layers.pulp, tD.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 1.2 } });
fig.view('Healthy', { focus: [-GAP / 2, -1.5, 0], zoom: 0.62, theta: 0.1, phi: 1.45 });
fig.view('Periodontitis', { focus: [GAP / 2, -2.5, 0], zoom: 0.62, theta: 0.1, phi: 1.45 });

// ---------- readout: every value from the constants that placed the geometry
const mH = DK.perioMeasure({ margin: H.margin, base: H.base, crestY: CREST, rootL: s.rootL });
const mD = DK.perioMeasure({ margin: D.margin, base: D.baseM, crestY: deepest, rootL: s.rootL });
const row = (k, a, b, fmt) => ({ k, v: [{ v: fmt(a) + ' ✓', cls: 'ok' }, { v: fmt(b) + ' ⚠', cls: 'warn' }] });
fig.setReadout([
  row('Probing depth', mH.pd, mD.pd, DK.mm),
  row('Recession', Math.max(0, mH.recession), mD.recession, DK.mm),
  row('Attachment loss (CAL)', mH.cal, mD.cal, DK.mm),
  row('Bone loss', mH.rbl, mD.rbl, v => Math.round(v) + '% of root'),
  { k: 'Furcation', v: [{ v: 'closed ✓', cls: 'ok' }, { v: 'Class III ⚠', cls: 'warn' }] }
]);

// ---------- story: both teeth → the cut sweeps in → the healthy crest → the diseased pocket and furcation → hero shot
fig.story([
  { dur: 0, hold: 1.4, theta: 0.6, phi: 1.22, zoom: 1.05, section: false, labels: ['Healthy', 'Periodontitis'], caption: 'The same lower first molar, healthy and with periodontitis.' },
  { dur: 2.2, hold: 0.2, theta: 0.1, phi: 1.45, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.2, offset: 1.2, labels: ['Healthy', 'Periodontitis'], caption: 'One cut through both.' },
  { dur: 1.8, hold: 2.2, zoom: 0.6, focus: [-GAP / 2, -1, 0], labels: ['Sulcus', 'Bone crest'], caption: 'Health: a shallow sulcus and the crest ~2 mm below the CEJ.' },
  { dur: 2.2, hold: 2.4, zoom: 0.6, focus: [GAP / 2, -3, 0], labels: ['Pocket', 'Bone loss', 'Calculus'], caption: 'Disease: a deep pocket over bone that has been lost.' },
  { dur: 1.6, hold: 2.0, zoom: 0.5, focus: [GAP / 2, -4, 0], labels: ['Furcation'], caption: 'Bone is gone from between the roots: a through-and-through furcation.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.28, phi: 1.36, labels: ['Healthy', 'Periodontitis', 'Pocket', 'Furcation', 'Bone loss', 'Calculus'] }
]);
fig.start();
