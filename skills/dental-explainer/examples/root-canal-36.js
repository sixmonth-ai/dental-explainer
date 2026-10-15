// Example procedure: root canal treatment of the mandibular left first molar (FDI 36 = Universal 19) with apical
// periodontitis on the mesial root, in a mesio-distal cut through the mesiobuccal canal (z = 1.5) so the file, the
// shaped canal and the root filling read on the cut face. The X-ray state bookends it: the lesion before, healed bone after.
// Every instrument bends along the same path (DK.canalAccessPath): cusp-tip reference → orifice → working length.
// Frame: +x = mesial, +z = buccal, CEJ at y = 0. All sizes in mm; working length is computed from the geometry.
const FDI = 36, CANAL = 'MB', CUT = 1.5, CREST = -1.8;
const SHAPE = { size: 25, taper: 0.06 };                 // final apical size and taper (common for a curved mesial canal; sizes vary by case)
const REF = [2.6, 8.8, 2.2];                             // reference point: the mesiobuccal cusp tip the rubber stop rests on
const SHORT = 0.5;                                       // working length ends 0.5 mm short of the apex (apical constriction)

const fig = DK.figure({
  fov: 26,
  title: 'Root canal treatment of 36',
  subtitle: 'FDI 36 (Universal 19), cut through the mesiobuccal canal.',
  view: { theta: 0, phi: 1.42, margin: 1.02 }
});

// --- the tooth and its context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const bone = DK.bone({ width: 22, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
const mesial = s.roots[0], apexM = [mesial.x + mesial.apex[0], -mesial.len, mesial.z];
const lesion = DK.periapicalLesion({ radius: 2.8, seed: 11, color: 0x7d6761 }); lesion.position.set(apexM[0] - 0.2, apexM[1] - 0.6, apexM[2]);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Soft tissue; a rubber dam isolates the tooth during treatment.' });
fig.part(lesion, { name: 'Periapical lesion', anchor: [0.9, -0.3, 0.3], accent: true, info: 'Apical periodontitis: bone around the apex replaced by inflamed tissue because the canal is infected; the radiolucency on a radiograph.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots, usually three canals (MB, ML, D).' });
fig.part(L.pulp, { inPlace: true, name: 'Necrotic pulp', anchor: [0.6, 1.4, 0], info: 'Dead, infected pulp. The tooth itself no longer feels, but the ligament around the apex does.', when: () => pulpState.necrosis > 0.5 && L.pulp.visible });

// --- the canal space: access cavity, de-roofed chamber, canals that widen as they are shaped, then the fillings
// empty space is painted in the stage tone with a thin ink rim (a slightly larger copy in the section group before it)
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750, FLUID = 0xb7c0c2, chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const access = DK.accessCavity(s, { k: 0, color: EMPTY });
const accessRim = DK.accessCavity(s, { k: 0, material: 'ink', grow: 1.05, lift: 0.01 });
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;   // a rim exists only on the cut face
const canals = ['MB', 'ML', 'D'].map(n => DK.canalShape(s, n, Object.assign({ color: CANAL_INK }, SHAPE)));
const fillings = ['MB', 'ML', 'D'].map(n => DK.rootFilling(s, n, SHAPE));
const resto = DK.accessCavity(s, { material: 'composite', lift: 0.16 });
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
const path = DK.canalAccessPath(s, CANAL, { ref: REF, short: SHORT }), WL = path.wl, PATH = path.points, END = PATH[PATH.length - 1];
const wlMark = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false })); wlMark.position.set(END[0], END[1], END[2] + 0.25); wlMark.visible = false;
[accessRim, chamberRim, access, chamberVoid, ...canals, ...fillings, resto, chamberResto, wlMark].forEach(o => tooth.group.add(o));
const mb = canals[0], midY = -6, midMB = DK.canalAt(s, 'MB', midY);
fig.part(access, { inPlace: true, name: 'Access cavity', anchor: [access.opening.x, access.opening.y, access.opening.z], dim: false, info: `${access.outline.shape[0].toUpperCase() + access.outline.shape.slice(1)} opening, wider mesially, that de-roofs the pulp chamber for straight-line access to all three canals.` });
fig.part(mb, { inPlace: true, name: 'Shaped canal', sub: `${SHAPE.size}/.${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')} at the apex`, anchor: [midMB.x + 0.3, midY, CUT], dim: false, info: 'Continuously tapering, narrowest at the apex; the foramen keeps its original size and position.', when: () => mb.visible && mb.userData.k > 0.5 });
fig.part(fillings[0], { inPlace: true, name: 'Root filling', sub: 'gutta-percha + sealer', anchor: [midMB.x + 0.3, midY, CUT], dim: false, info: 'Gutta-percha and sealer fill the shaped canal to working length; all three canals are filled.', when: () => fillings[0].visible });
fig.part(resto, { inPlace: true, name: 'Restoration', anchor: [resto.opening.x, resto.opening.y, resto.opening.z], dim: false, info: 'The coronal seal matters as much as the root filling; a root-treated molar usually gets cuspal coverage (crown or onlay) afterwards.', when: () => resto.visible });
const healMark = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshBasicMaterial({ visible: false })); healMark.position.set(apexM[0], apexM[1] - 1.2, CUT); tooth.group.add(healMark);
fig.part(healMark, { inPlace: true, name: 'Healed bone', anchor: [0, 0, 0], dim: false, info: 'Bone fills the lesion in over months to years; reviewed radiographically from a year on.', when: () => lesion.userData.k < 0.05 });
fig.part(wlMark, { inPlace: true, name: 'Working length', sub: `${DK.mm(WL)}, ${SHORT} mm short of the apex`, anchor: [0, 0, 0], accent: true, dim: false, info: 'Measured from the cusp tip to the apical constriction with an apex locator and a radiograph.', when: () => wlMark.visible });

// --- instruments (fig.world, bent along the canal path by params)
const bur = DK.bur({ shape: 'round', diameter: 1.2, head: 1.2 });
const kfile = DK.endoFile({ kind: 'K', size: 15, length: 25, stop: WL });
const rotary = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25, stop: WL });
const needle = DK.irrigationNeedle({ gauge: 30, length: 25 });
const cone = DK.gpCone({ size: SHAPE.size, taper: SHAPE.taper });
[bur, kfile, rotary, needle, cone].forEach(o => fig.world.add(o));
fig.part(bur, { inPlace: true, name: 'Access bur', anchor: [0, 8, 0], info: 'Round bur: through the enamel and dentin into the pulp chamber, then the roof is removed.' });
fig.part(kfile.handle, { inPlace: true, name: 'K-file 15', sub: 'white, .02 taper', anchor: [0, 6, 0], info: 'Stainless-steel hand file (D0 0.15 mm): scouts the canal and takes the working length.' });
fig.part(kfile.stop, { inPlace: true, name: 'Rubber stop', anchor: [1.3, 0, 0], info: 'Set at the working length; it rests on the cusp tip (reference point).' });
fig.part(rotary.handle, { inPlace: true, name: `Rotary file ${SHAPE.size}/.${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')}`, sub: 'NiTi', anchor: [0, 6, 0], info: `NiTi file with a .${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')} taper: D0 ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 0).toFixed(2)} mm, D16 ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 16).toFixed(2)} mm. Shapes a continuous funnel while following the curve.` });
fig.part(needle, { inPlace: true, name: 'Irrigation needle', sub: '30 G, side-vented', anchor: () => needle.userData.points[36] || [0, 0, 0], info: 'Sodium hypochlorite dissolves tissue and kills bacteria; EDTA then removes the smear layer. Placed 1–2 mm short of working length, never wedged.' });
fig.part(cone, { inPlace: true, name: 'Gutta-percha cone', sub: `${SHAPE.size}/.${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')}`, anchor: () => cone.userData.points[44] || [0, 0, 0], info: 'A cone matching the preparation, seated to working length with sealer (single cone), or compacted warm or laterally.' });

// --- params
const pulpState = { necrosis: 0 };
const PULP = DK.color(DK.COLORS.pulp), NECRO = DK.color(0x6b5d59);
fig.param('necrosis', 0, v => { pulpState.necrosis = v; L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(NECRO, v); }); DK.capColor(fig.section, 6, v > 0.5 ? 0x6e615d : DK.COLORS.pulpCap); });
fig.param('lesion', 1, k => lesion.set(k));
// what is in the canal space: pulp → empty (void) → root filling and restoration. One sync keeps the solids from overlapping.
const st = { pulp: 1, access: 0, fill: 0, resto: 0 };
const sync = () => { const gone = st.pulp < 0.5, filled = st.fill > 0.5, restored = st.resto > 0.5;
  L.pulp.visible = !gone; chamberVoid.visible = gone && !restored; chamberRim.visible = gone; canals.forEach(c => { c.visible = gone && !filled; }); fillings.forEach(f => { f.visible = filled; });
  access.visible = st.access > 0.02 && !restored; accessRim.visible = st.access > 0.02; resto.visible = chamberResto.visible = restored; };
fig.param('access', 0, k => { st.access = k; access.set(k); accessRim.set(k); sync(); });
fig.param('pulp', 1, v => { st.pulp = v; sync(); });
fig.param('shape', 0, k => canals.forEach(c => c.set(k)));
fig.param('fluid', 0, k => { [chamberVoid, access].forEach(o => o.material.color.copy(DK.color(EMPTY)).lerp(DK.color(FLUID), k)); canals.forEach(o => o.material.color.copy(DK.color(CANAL_INK)).lerp(DK.color(FLUID), k)); DK.capColor(fig.section, 8, k > 0.5 ? FLUID : EMPTY); DK.capColor(fig.section, 9, k > 0.5 ? FLUID : CANAL_INK); });
fig.param('fill', 0, v => { st.fill = v; sync(); });
fig.param('resto', 0, v => { st.resto = v; sync(); });
fig.param('wlmark', 0, v => { wlMark.visible = v > 0.5; });
const place = (tool, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(PATH, d); };
fig.param('kfile', -40, d => place(kfile, d));
fig.param('rotary', -40, d => place(rotary, d));
fig.param('needle', -40, d => place(needle, d));
fig.param('cone', -40, d => place(cone, d));
fig.param('bur', 40, y => { bur.visible = y < 30; bur.position.set(access.opening.x + 0.2, y, access.opening.z + 0.3); bur.rotation.z = -0.25; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lesion], color: 0x8a736d, kind: 'gingiva' },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [accessRim, chamberRim], color: DK.RIM, kind: 'plain' },
  { objects: [access, chamberVoid], color: EMPTY, kind: 'plain' },
  { objects: canals, color: CANAL_INK, kind: 'plain' },
  { objects: fillings, color: DK.COLORS.gutta },
  { objects: [resto, chamberResto], color: DK.COLORS.compositeCap, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: CUT } });
fig.xray([bone, gum, L.enamel, L.dentin, L.root], false);
fig.view('Radiograph', { theta: 0, phi: 1.5, zoom: 1.05, section: false, xray: 1 });
const sz = `${SHAPE.size}/.${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')}`;
fig.setReadout([
  { k: 'Working length (MB)', v: `${DK.mm(WL)} · ${SHORT} mm short of the apex` },
  { k: `Shaping file ${sz}`, v: `D0 ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 0).toFixed(2)} mm · D16 ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 16).toFixed(2)} mm` }
]);

// --- the procedure (camera on +z looks at the cut face; mesial is on the viewer's right)
const park = { kfile: -40, rotary: -40, needle: -40, cone: -40, bur: 40 };
const FOCUS_CROWN = [0, 4, CUT], FOCUS_TOOTH = [0.4, -3, CUT];
fig.procedure([
  { label: 'Diagnosis', caption: 'A lower first molar with apical periodontitis on the mesial root.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: 0.5, phi: 1.2, zoom: 1.05, section: false, xray: 0, labels: [] },
    { fov: 26, dur: 2.2, hold: 1.8, theta: 0, phi: 1.5, zoom: 1, xray: 1, set: { necrosis: 1 }, labels: ['Necrotic pulp', 'Periapical lesion'], key: true }] },
  { label: 'Access', caption: 'Through the occlusal surface into the pulp chamber; the pulp is removed.', beats: [
    { dur: 1.6, hold: 0, theta: 0, phi: 1.42, xray: 0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    { dur: 1.8, hold: 0.2, offset: CUT, zoom: 0.72, focus: FOCUS_CROWN, set: { bur: access.opening.y + 3 }, labels: ['Access bur'] },
    { dur: 1.8, hold: 0.2, set: { access: 1, bur: access.floor.y + 1.2 }, labels: ['Access bur'] },
    { dur: 1.2, hold: 1.4, zoom: 0.95, focus: FOCUS_TOOTH, set: { bur: 40, pulp: 0 }, labels: ['Access cavity'], key: true }] },
  { label: 'Working length', caption: `A size 15 file to ${DK.mm(WL)}: ${SHORT} mm short of the apex.`, beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.85, focus: [1.5, 0, CUT], set: { kfile: -1.5 }, labels: ['K-file 15'] },
    { dur: 2.4, hold: 0.2, set: { kfile: WL }, labels: ['K-file 15'] },
    { dur: 1.6, hold: 2.0, zoom: 1, focus: [0.8, -1.5, CUT], set: { wlmark: 1 }, labels: ['Rubber stop', 'Working length'], key: true },
    { dur: 0.9, hold: 0.2, set: { kfile: -40, wlmark: 0 }, labels: [] }] },
  { label: 'Shaping', caption: `A ${sz} NiTi file shapes a continuous taper to working length.`, beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.8, focus: [1.5, -1, CUT], set: { rotary: -1.5 }, labels: [`Rotary file ${sz}`] },
    { dur: 2.6, hold: 0.3, set: { rotary: WL, shape: 1 }, labels: [`Rotary file ${sz}`] },
    { dur: 0.9, hold: 1.6, zoom: 0.95, focus: FOCUS_TOOTH, set: { rotary: -40 }, labels: ['Shaped canal'], key: true }] },
  { label: 'Irrigation', caption: 'Sodium hypochlorite, then EDTA, through a side-vented needle short of the apex.', beats: [
    { dur: 1.0, hold: 0.1, set: { needle: -1.5 }, labels: ['Irrigation needle'] },
    { dur: 2.0, hold: 1.6, set: { needle: WL - 2, fluid: 1 }, labels: ['Irrigation needle'], key: true },
    { dur: 0.9, hold: 0.2, set: { needle: -40 }, labels: [] }] },
  { label: 'Obturation', caption: 'A matching gutta-percha cone and sealer fill the canal to working length.', beats: [
    { dur: 1.0, hold: 0.1, set: { fluid: 0, cone: -1.5 }, labels: ['Gutta-percha cone'] },
    { dur: 2.4, hold: 0.4, set: { cone: WL }, labels: ['Gutta-percha cone'] },
    { dur: 0.6, hold: 1.6, zoom: 0.95, focus: FOCUS_TOOTH, set: { cone: -40, fill: 1 }, labels: ['Root filling'], key: true }] },
  { label: 'Restoration', caption: 'A sealed coronal restoration; the bone heals over months to years.', beats: [
    { dur: 1.4, hold: 1.0, zoom: 0.8, focus: FOCUS_CROWN, set: { resto: 1 }, labels: ['Restoration'] },
    { dur: 2.0, hold: 0.2, zoom: 0.95, focus: FOCUS_TOOTH, labels: ['Restoration', 'Root filling'] },
    { dur: 2.4, hold: 2.4, set: { lesion: 0 }, labels: ['Restoration', 'Root filling', 'Healed bone'], key: true }] }
]);
fig.start();
