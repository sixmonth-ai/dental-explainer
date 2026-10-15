// Example procedure: periodontal probing and staging on a lower first molar (FDI 36 = Universal 19), mesio-distal cut.
// A UNC-15 probe reads the mesial pocket while the tissues step from health through gingivitis to periodontitis Stages I–IV
// (2017 AAP/EFP). The bone (DK.perioBone), gingiva (DK.perioGingiva) and pocket (DK.pocket) are all driven by fig.param, and
// the readout (PD, recession, CAL, bone loss, stage) is computed from the same numbers with DK.perioMeasure / DK.perioStage.
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0. All sizes in mm (dental-facts.md §13 and §17).
const CREST = -1.8;                                                         // healthy crest
// each stage: gingival margin and pocket base at the mesial site (tooth frame), bone-loss level (0..1 of LOSS), inflammation
const STAGES = {
  health:     { margin: 2.0, base: 0.0, bone: 0.00, inflamed: 0 },          // PD 2, CAL 0
  gingivitis: { margin: 3.5, base: 0.0, bone: 0.00, inflamed: 1 },          // swollen margin: PD 3.5 but still CAL 0
  I:          { margin: 2.0, base: -2.0, bone: 0.22, inflamed: 0.6 },       // PD 4, CAL 2, bone loss < 15 %
  II:         { margin: 1.0, base: -4.0, bone: 0.50, inflamed: 0.7 },       // PD 5, CAL 4, 15–33 %
  III:        { margin: -1.0, base: -7.0, bone: 0.82, inflamed: 0.8 },      // PD 6, CAL 7, > 33 %, furcation Class III
  IV:         { margin: -2.0, base: -8.0, bone: 1.00, inflamed: 0.8 }       // PD 6, CAL 8 (+ tooth loss, mobility: not shown)
};
const fig = DK.figure({
  fov: 26,
  title: 'Probing a periodontal pocket',
  subtitle: 'FDI 36 (Universal 19), mesio-distal cut, UNC-15 probe at the mesial site.',
  view: { theta: 0.12, phi: 1.42 }
});

// --- tooth, bone, gingiva, pocket
const tooth = DK.tooth(36), s = tooth.spec;
const mesial = DK.toothSurfaceAt(s, -0.5, 0).x;                             // x of the mesial surface just below the CEJ
const LOSS = DK.boneLoss({                                                   // the full (Stage IV) loss; bone.set(k) morphs toward it
  horizontal: 3.2,
  defects: [{ x: mesial + 0.6, z: 0, depth: 7.0, rx: 3.4, rz: 4.5, walls: 3 }],
  furcations: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, roots: s.roots, from: 'through', bottom: -(s.trunk + 3.6 + CREST), width: 1.5 }]
});
const bone = DK.perioBone({ width: 17, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6, loss: LOSS, level: 0 }); bone.position.y = CREST;
const crestMesial = () => CREST + bone.crestAt(mesial + 0.2, 0);            // crest at the mesial surface, tooth frame
const gum = DK.perioGingiva(s, { margin: STAGES.health.margin, crest: CREST, width: 17.6, depth: 13.2 });   // its bottom follows the deepest crest (bone param)
const pocket = DK.pocket(s, { margin: STAGES.health.margin, base: 0, width: 0.1 }); tooth.group.add(pocket);
const pdl = DK.perioPdl(s, 0.25, CREST + 0.2); tooth.group.add(pdl);        // tops follow the crest (bone param)
const cej = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: DK.color(0x0A0A08), toneMapped: false })); tooth.group.add(cej);

const P = Object.assign({}, STAGES.health, { probe: 30 });                  // the live state; probe = tip height above the pocket base (30 = parked)
// --- the probe (fig.world, placed by params): tip at its origin, handle bent away from the tooth (mesially)
const probe = DK.probe({ type: 'UNC-15' }); probe.rotation.y = Math.PI;
const pivot = new THREE.Group(); pivot.add(probe); fig.world.add(pivot);
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Mandibular left first molar: 2 roots, root trunk ~3 mm.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone. Bone lost to periodontitis does not grow back on its own.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Health: pink, firm, PD ≤ 3 mm, < 10 % bleeding sites. Gingivitis: red, swollen, bleeds, but no attachment loss.' });
fig.part(probe, { inPlace: true, name: 'Probe', sub: 'UNC-15, 1 mm marks', anchor: [0, 11.5, 0], accent: true, info: 'Read the mark at the gingival margin. Bands at 4–5, 9–10 and 14–15 mm. Light force, about 0.2–0.25 N.' });
const z0 = (sec) => (sec.enabled ? sec.offset : 0) + 0.1;
const pocketLabel = fig.part(pocket, { inPlace: true, name: 'Pocket base', anchor: (e, sec) => [DK.toothSurfaceAt(s, P.base, 0).x + 0.6, P.base, z0(sec)], when: (e, sec) => sec.enabled, dim: false, info: 'Where the probe stops: in periodontitis about 0.3–0.5 mm into the inflamed connective tissue, below the junctional epithelium.' });
fig.part(gum, { inPlace: true, name: 'Gingival margin', anchor: (e, sec) => [DK.toothSurfaceAt(s, Math.max(P.margin, 0.2), Math.PI).x - 0.8, P.margin, z0(sec)], when: (e, sec) => sec.enabled, dim: false, info: 'Probing depth is measured from here, not from the CEJ.' });
fig.part(cej, { inPlace: true, name: 'CEJ', anchor: [0, 0, 0], dim: false, info: 'The fixed reference for attachment loss: CAL = CEJ to pocket base = PD + recession.' });
const crestLabel = fig.part(bone, { inPlace: true, name: 'Bone crest', anchor: (e, sec) => [mesial + 2.8, crestMesial() - 0.3, z0(sec)], when: (e, sec) => sec.enabled, dim: false, info: 'Radiographic bone loss is read from the CEJ: about 2 mm is normal; the rest is loss, as a share of root length.' });
fig.part(tooth.layers.root, { inPlace: true, name: 'Furcation', sub: 'Class III', anchor: (e, sec) => [0, -(s.trunk + 1.6), z0(sec)], when: (e, sec) => sec.enabled, dim: false, info: 'Bone lost between the roots, through and through (Hamp Class III): a Stage III complexity factor.' });

fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [pocket], color: 0x4a403c },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.root, tooth.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: 1.0 } });

// --- params: every change is a number the steps animate
const place = () => {                                                        // probe tip at the pocket base, leaning along the root; in front of the cut face
  const x0 = DK.toothSurfaceAt(s, P.base, 0).x + 0.45, top = DK.toothSurfaceAt(s, Math.max(P.margin, 0), 0).x + 0.45;
  pivot.position.set(x0, P.base + P.probe, fig.section.enabled ? fig.section.offset + 0.35 : 0);
  pivot.rotation.z = -Math.atan2(top - x0, Math.max(1, P.margin - P.base)); pivot.visible = P.probe < 25;
  cej.position.set(DK.toothSurfaceAt(s, 0, 0).x + 0.05, 0, fig.section.enabled ? fig.section.offset + 0.15 : s.blC / 2 + 0.15);
};
fig.param('probe', P.probe, v => { P.probe = v; place(); });
fig.param('margin', P.margin, v => { P.margin = v; gum.set({ margin: v }); pocket.set(v, null); place(); });
fig.param('base', P.base, v => { P.base = v; pocket.set(null, v); place(); });
fig.param('bone', 0, k => {                                                   // the crest drops; the gingiva fills what is lost; the PDL follows
  P.bone = k; bone.set(k);
  const deepest = Math.min(crestMesial(), CREST + bone.crestAt(0, 0), CREST + bone.crestAt(-mesial, 0));
  gum.set({ crest: deepest - 0.4 }); pdl.set(r => CREST + Math.min(bone.crestAt(r.x + r.ra + 0.2, 0), bone.crestAt(r.x - r.ra - 0.2, 0)) + 0.2);
});
fig.param('inflamed', 0, v => { P.inflamed = v; gum.set({ inflamed: v }); fig.section.caps[0].material.uniforms.uColor.value.copy(DK.color(DK.COLORS.gingivaCap)).lerp(DK.color(DK.COLORS.gingivaInflamedCap), v); });
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged(); place(); };

// --- readout: computed from the same numbers that place the geometry
let last = '';
fig.onFrame(() => {
  const m = DK.perioMeasure({ margin: P.margin, base: P.base, crestY: crestMesial(), rootL: s.rootL });
  const key = [m.pd, m.cal, m.rbl].map(v => v.toFixed(1)).join('|'); if (key === last) return; last = key;
  const vertical = Math.max(0, (CREST - crestMesial()) - 3.2 * P.bone);     // the angular part of the mesial defect (beyond the horizontal loss)
  const st = DK.perioStage({ cal: m.cal, rbl: m.rbl, pd: m.pd, furcation: P.bone > 0.75 ? 3 : 0, vertical, teethLost: P.bone >= 0.99 ? 5 : 0 });
  const warn = v => ({ cls: v ? 'warn' : 'ok' });
  const setSub = (part, sub) => { part.sub = sub; part.el.innerHTML = part.name + `<small>${sub}</small>`; };
  setSub(pocketLabel, `PD ${DK.mm(m.pd)} · CAL ${DK.mm(Math.max(0, m.cal))}`);
  setSub(crestLabel, `${DK.mm(m.boneLoss)} below CEJ · ${Math.round(m.rbl)}% of root`);
  fig.setReadout([
    Object.assign({ k: 'Probing depth', v: DK.mm(m.pd) }, warn(m.pd > 3)),
    Object.assign({ k: 'Recession', v: DK.mm(Math.max(0, m.recession)) }, warn(m.recession > 0)),
    Object.assign({ k: 'CAL', v: DK.mm(Math.max(0, m.cal)) }, warn(m.cal >= 1)),
    Object.assign({ k: 'Bone loss', v: Math.round(m.rbl) + '% of root' }, warn(m.rbl >= 1)),
    Object.assign({ k: 'Stage', v: st.stage ? st.stage : (m.pd > 3 ? 'none (pseudo-pocket)' : 'none') }, warn(!!st.stage))
  ]);
});

// --- the procedure: each step morphs the tissues with the probe out, then the probe goes in and reads the depth
const stage = (name, extra) => Object.assign({ margin: STAGES[name].margin, base: STAGES[name].base, bone: STAGES[name].bone, inflamed: STAGES[name].inflamed }, extra || {});
const OUT = { probe: 30 }, IN = { probe: 0 };
// one camera for every step: the whole crown, the probe's working end and the crest stay in frame, so the storyboard reads as a series
const CAM = { theta: 0.12, phi: 1.42, zoom: 0.8, focus: [1.2, -1.5, 0] };
fig.procedure([
  { label: 'Health', caption: 'A shallow sulcus: PD 2 mm, no attachment loss.', beats: [
    { dur: 0, hold: 0.6, theta: 0.12, phi: 1.42, zoom: 1, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    Object.assign({ dur: 1.8, hold: 0.3, offset: 1.0, labels: ['CEJ', 'Gingival margin'] }, CAM),
    { dur: 1.4, hold: 1.4, set: IN, labels: ['Probe', 'CEJ', 'Gingival margin', 'Pocket base'], key: true }] },
  { label: 'Gingivitis', caption: 'Swollen margin: a deeper reading, but the attachment is intact (reversible).', beats: [
    { dur: 0.8, hold: 0, set: OUT, labels: [] },
    { dur: 1.6, hold: 0.2, set: stage('gingivitis'), labels: ['Gingival margin'] },
    { dur: 1.2, hold: 1.4, set: IN, labels: ['Gingival margin', 'Pocket base', 'CEJ'], key: true }] },
  { label: 'Stage I', caption: 'Attachment loss begins: CAL 1–2 mm, bone loss in the coronal third (< 15 %).', beats: [
    { dur: 0.8, hold: 0, set: OUT, labels: [] },
    { dur: 1.8, hold: 0.2, set: stage('I'), labels: ['Bone crest'] },
    { dur: 1.2, hold: 1.4, set: IN, labels: ['Pocket base', 'CEJ', 'Bone crest'], key: true }] },
  { label: 'Stage II', caption: 'CAL 3–4 mm, bone loss 15–33 % of the root, PD up to 5 mm.', beats: [
    { dur: 0.8, hold: 0, set: OUT, labels: [] },
    { dur: 1.8, hold: 0.2, set: stage('II'), labels: ['Bone crest'] },
    { dur: 1.2, hold: 1.4, set: IN, labels: ['Pocket base', 'CEJ', 'Bone crest'], key: true }] },
  { label: 'Stage III', caption: 'CAL ≥ 5 mm, loss past the coronal third, PD ≥ 6 mm, furcation Class II–III, recession.', beats: [
    { dur: 0.8, hold: 0, set: OUT, labels: [] },
    { dur: 2.0, hold: 0.2, set: stage('III'), labels: ['Bone crest', 'Furcation'] },
    { dur: 1.2, hold: 1.6, set: IN, labels: ['Pocket base', 'Gingival margin', 'Furcation', 'Bone crest'], key: true }] },
  { label: 'Stage IV', caption: 'Stage III findings plus ≥ 5 teeth lost and failing function: a whole-mouth diagnosis.', beats: [
    { dur: 0.8, hold: 0, set: OUT, labels: [] },
    { dur: 2.0, hold: 0.2, set: stage('IV'), labels: ['Bone crest'] },
    { dur: 1.2, hold: 2.0, set: IN, labels: ['Pocket base', 'Gingival margin', 'CEJ', 'Bone crest'], key: true }] }
]);
fig.start();
