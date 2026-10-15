// Procedure: root canal retreatment of the mandibular left first molar (FDI 36 = Universal 19) whose old root fillings stop short and leak, with apical periodontitis on the mesial root; mesio-distal cut through the mesiobuccal canal (z = 1.5). Frame: +x mesial, +z buccal, CEJ at y = 0, mm; camera on the buccal side (mesial on the viewer's right).
// poster: step 3
// Old fillings: narrow (20/.02) gutta-percha ending 3 mm short of the apex in all three canals, under a leaking amalgam. Retreatment: the
// restoration comes out, the old gutta-percha is removed (a clipping plane eats it from the top down as the retreatment file advances),
// the canal is negotiated to its full working length, shaped, refilled and sealed; the lesion heals. Working length from DK.canalAccessPath.
const FDI = 36, CANAL = 'MB', CUT = 1.5, CREST = -1.8, SHORT = 0.5, OLD_SHORT = 3.0;
const SHAPE = { size: 25, taper: 0.06 }, OLD = { size: 20, taper: 0.02, short: OLD_SHORT };
const REF = [2.6, 8.8, 2.2];                             // the mesiobuccal cusp tip the rubber stop rests on (as in the kit's root-canal-36 example)
const SZ = `${SHAPE.size}/.${String(Math.round(SHAPE.taper * 100)).padStart(2, '0')}`;

const fig = DK.figure({
  fov: 26,
  title: 'Redoing a failed root canal',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut through the mesiobuccal canal.',
  view: { theta: 0, phi: 1.42, margin: 0.88 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const bone = DK.bone({ width: 22, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
const mesial = s.roots[0], apexM = [mesial.x + mesial.apex[0], -mesial.len, mesial.z];
const lesion = DK.periapicalLesion({ radius: 2.8, seed: 11, color: 0x7d6761 }); lesion.position.set(apexM[0] - 0.2, apexM[1] - 0.6, apexM[2]); tooth.group.add(lesion);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Soft tissue; a rubber dam isolates the tooth during treatment.' });
fig.part(lesion, { inPlace: true, name: 'Periapical lesion', sub: 'still there', anchor: [0.9, -0.3, 0.3], accent: true, dim: false, when: () => lesion.visible && lesion.userData.k > 0.3, info: 'Apical periodontitis that did not heal, or came back: bacteria survive in the unfilled end of the canal and get fresh supply through the leaking restoration.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: two roots, usually three canals (MB, ML, D). All three are retreated; the cut shows the mesiobuccal one.' });

// --- canal space: old fillings and old amalgam, the void left behind, the new shape, new fillings, new restoration
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750;
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const access = DK.accessCavity(s, { k: 1, color: EMPTY });
const accessRim = DK.accessCavity(s, { k: 1, material: 'ink', grow: 1.05, lift: 0.01 });
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const NAMES = ['MB', 'ML', 'D'];
const canals = NAMES.map(n => DK.canalShape(s, n, Object.assign({ color: CANAL_INK }, SHAPE)));          // the space after the old filling is out (k: 0 = old narrow shape → 1 = new preparation)
canals.forEach(c => c.set(0));
const oldFills = NAMES.map(n => DK.rootFilling(s, n, OLD));                                              // narrow and 3 mm short
const oldChamber = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); oldChamber.position.copy(chamberPos);
const amalgam = DK.accessCavity(s, { material: 'composite', lift: 0.16 }); amalgam.material = DK.mat('amalgam');
const fillings = NAMES.map(n => DK.rootFilling(s, n, SHAPE));
const resto = DK.accessCavity(s, { material: 'composite', lift: 0.16 });
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
const path = DK.canalAccessPath(s, CANAL, { ref: REF, short: SHORT }), WL = path.wl, PATH = path.points, END = PATH[PATH.length - 1];
const oldPath = DK.canalAccessPath(s, CANAL, { ref: REF, short: OLD_SHORT }), oldEndY = oldPath.toY, OLD_WL = oldPath.wl;
const wlMark = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false })); wlMark.position.set(END[0], END[1], END[2] + 0.25); wlMark.visible = false;
[accessRim, chamberRim, access, chamberVoid, ...canals, ...oldFills, oldChamber, amalgam, ...fillings, resto, chamberResto, wlMark].forEach(o => tooth.group.add(o));
L.pulp.visible = false;
const mb = canals[0], midY = -6, midMB = DK.canalAt(s, 'MB', midY), endOld = DK.canalAt(s, 'MB', oldEndY), lowY = -11, lowMB = DK.canalAt(s, 'MB', lowY);
fig.part(amalgam, { inPlace: true, name: 'Leaking filling', anchor: [amalgam.opening.x, amalgam.opening.y, amalgam.opening.z], dim: false, when: () => amalgam.visible, info: 'An old restoration with open margins lets saliva bacteria back into the root canal system.' });
fig.part(oldFills[0], { inPlace: true, name: 'Old root filling', sub: `${OLD_SHORT} mm short`, anchor: [endOld.x + 0.2, oldEndY + 0.8, CUT], dim: false, when: () => oldFills[0].visible && removal.h > 1, info: 'Narrow, under-prepared and stopping 3 mm short of the apex: the last part of the canal was never cleaned. A missed canal (often a second mesial or distal canal) is another common cause of failure.' });
fig.part(access, { inPlace: true, name: 'Access', anchor: [access.opening.x, access.opening.y, access.opening.z], dim: false, when: () => access.visible && !amalgam.visible && st.resto < 0.5, info: 'The old restoration is drilled out and the access reopened, so every canal orifice can be reached.' });
fig.part(mb, { inPlace: true, name: 'Full length', sub: 'cleaned and shaped', anchor: [lowMB.x + 0.25, lowY, CUT], dim: false, when: () => mb.visible && mb.userData.k > 0.5, info: `Shaped to ${SZ} all the way to working length, past where the old filling stopped.` });
fig.part(fillings[0], { inPlace: true, name: 'New root filling', anchor: [lowMB.x + 0.25, lowY, CUT], dim: false, when: () => fillings[0].visible, info: 'Gutta-percha and sealer to working length in all three canals.' });
fig.part(resto, { inPlace: true, name: 'New seal', anchor: [resto.opening.x, resto.opening.y, resto.opening.z], dim: false, when: () => resto.visible, info: 'A sealed core and then cuspal coverage (crown or onlay) protect the result; a leaking top is a common reason root canals fail.' });
const healMark = new THREE.Object3D(); healMark.position.set(apexM[0], apexM[1] - 1.2, CUT); tooth.group.add(healMark);
fig.part(healMark, { inPlace: true, name: 'Bone heals', anchor: [0, 0, 0], dim: false, when: () => lesion.userData.k < 0.05, info: 'Bone fills in over months to years; healing is checked on radiographs from about a year on.' });
fig.part(wlMark, { inPlace: true, name: 'Working length', sub: `${DK.mm(WL)}, ${DK.mm(WL - OLD_WL)} past the old filling`, anchor: [0, 0, 0], accent: true, dim: false, when: () => wlMark.visible, info: 'Negotiated again with a fine hand file and confirmed with an apex locator and a radiograph.' });

// --- instruments
const bur = DK.bur({ shape: 'round', diameter: 1.2, head: 1.2 });
const retreat = DK.endoFile({ kind: 'rotary', size: 25, taper: 0.08, length: 21, flutes: 16 });
const kfile = DK.endoFile({ kind: 'K', size: 15, length: 25, stop: WL });
const rotary = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25, stop: WL });
const cone = DK.gpCone(SHAPE);
[bur, retreat, kfile, rotary, cone].forEach(o => fig.world.add(o));
fig.part(bur, { inPlace: true, name: 'Bur', anchor: [0, 8, 0], info: 'Removes the old restoration and reopens the access cavity.' });
fig.part(retreat, { inPlace: true, name: 'Retreatment file', anchor: () => retreat.userData.points[30] || [0, 0, 0], info: 'A rotary file made for removing gutta-percha, often helped by heat or a solvent; hand files clear the last of it.' });
fig.part(kfile, { inPlace: true, name: 'K-file 15', anchor: () => kfile.userData.points[34] || [0, 0, 0], info: 'A fine hand file finds the way past the old filling to the full working length.' });
fig.part(rotary, { inPlace: true, name: `Rotary file ${SZ}`, anchor: () => rotary.userData.points[34] || [0, 0, 0], info: 'Shapes a continuous taper to working length.' });
fig.part(cone, { inPlace: true, name: 'Gutta-percha cone', anchor: () => cone.userData.points[40] || [0, 0, 0], info: 'A cone matching the new shape, seated with sealer to working length.' });

// --- params
// removal plane: the old gutta-percha survives only below y = removal.h (it is added to the old fillings' clipping planes below)
const removal = { plane: new THREE.Plane(new THREE.Vector3(0, -1, 0), 50), h: 50 };
const st = { amalgam: 1, oldfill: 1, fill: 0, resto: 0 };
const sync = () => { const out = st.amalgam < 0.5, filled = st.fill > 0.5, restored = st.resto > 0.5;
  amalgam.visible = !out; oldChamber.visible = !out;
  access.visible = chamberVoid.visible = out && !restored; accessRim.visible = chamberRim.visible = out;
  oldFills.forEach(f => { f.visible = st.oldfill > 0.5; }); canals.forEach(c => { c.visible = !filled; }); fillings.forEach(f => { f.visible = filled; });
  resto.visible = chamberResto.visible = restored; };
fig.param('amalgam', 1, v => { st.amalgam = v; sync(); });
fig.param('remove', 50, h => { removal.h = h; removal.plane.constant = h; st.oldfill = h > oldEndY + 0.15 ? 1 : 0; sync(); });
fig.param('shape', 0, k => canals.forEach(c => c.set(k)));
fig.param('fill', 0, v => { st.fill = v; sync(); });
fig.param('resto', 0, v => { st.resto = v; sync(); });
fig.param('lesion', 1, k => lesion.set(k));
fig.param('wlmark', 0, v => { wlMark.visible = v > 0.5; });
const place = (tool, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(PATH, d); };
fig.param('retreat', -40, d => place(retreat, d));
fig.param('kfile', -40, d => place(kfile, d));
fig.param('rotary', -40, d => place(rotary, d));
fig.param('cone', -40, d => place(cone, d));
fig.param('bur', 40, y => { bur.visible = y < 30; bur.position.set(access.opening.x + 0.2, y, access.opening.z + 0.3); bur.rotation.z = -0.25; });
sync();

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
  { objects: oldFills, color: DK.COLORS.gutta },
  { objects: [oldChamber], color: DK.COLORS.compositeCap, kind: 'plain' },
  { objects: [amalgam], color: DK.COLORS.amalgamCap, kind: 'metal' },
  { objects: fillings, color: DK.COLORS.gutta },
  { objects: [resto, chamberResto], color: DK.COLORS.compositeCap, kind: 'plain' }
]);
// old gutta-percha: clip the 3D mesh and its stencil copies by the removal plane too, so the cut face loses it from the top down
oldFills.forEach(f => f.traverse(m => { if (m.isMesh && m.material.clippingPlanes) m.material.clippingPlanes = m.material.clippingPlanes.concat([removal.plane]); }));
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: CUT } });
fig.xray([bone, gum, L.enamel, L.dentin, L.root], false);
fig.view('Radiograph', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });
fig.setReadout([
  { k: 'Old filling (MB)', v: `ends ${OLD_SHORT} mm short of the apex` },
  { k: 'New working length (MB)', v: `${DK.mm(WL)} · ${SHORT} mm short of the apex` }
]);

// --- the procedure
const ORI_WL = Math.hypot(...[0, 1, 2].map(i => PATH[1][i] - PATH[0][i]));
const FOCUS_CROWN = [0, 4, CUT], FOCUS_TOOTH = [0.4, -4.4, CUT], FOCUS_APEX = [1.6, -8.5, CUT];
fig.procedure([
  { label: 'Failed treatment', caption: 'The old fillings stop short and the restoration leaks; the lesion has not healed.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: 0.5, phi: 1.2, zoom: 1.05, section: false, xray: 0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    { fov: 26, dur: 2.4, hold: 0.6, theta: 0, phi: 1.42, zoom: 1.05, focus: FOCUS_TOOTH, offset: CUT, labels: ['Leaking filling'] },
    { dur: 1.6, hold: 2.2, labels: ['Leaking filling', 'Old root filling', 'Periapical lesion'], key: true }] },
  { label: 'Reopen', caption: 'The old restoration is drilled out to reach the canals again.', beats: [
    { dur: 1.6, hold: 0.1, zoom: 0.72, focus: FOCUS_CROWN, set: { bur: amalgam.opening.y + 3 }, labels: ['Bur'] },
    { dur: 2.0, hold: 0.2, set: { bur: access.floor.y + 1.2, amalgam: 0 }, labels: ['Bur'] },
    { dur: 1.2, hold: 1.6, set: { bur: 40 }, labels: ['Access'], key: true }] },
  { label: 'Remove old filling', caption: 'A retreatment file, with heat or solvent, takes the old gutta-percha out.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 1.0, focus: FOCUS_TOOTH, set: { retreat: -1.5 }, labels: ['Retreatment file'] },
    { dur: 2.4, hold: 1.8, set: { retreat: (ORI_WL + OLD_WL) / 2, remove: (path.orifice[1] + oldEndY) / 2 }, labels: ['Retreatment file', 'Old root filling'], key: true },
    { dur: 1.6, hold: 0.2, set: { retreat: OLD_WL - 1.0, remove: oldEndY + 1.0 }, labels: ['Retreatment file'] },
    { dur: 1.0, hold: 0.2, set: { retreat: -40, remove: oldEndY - 2 }, labels: [] }] },
  { label: 'Full length', caption: 'The canal is negotiated past the old end to working length and shaped.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.9, focus: FOCUS_APEX, set: { kfile: -1.5 }, labels: ['K-file 15'] },
    { dur: 2.4, hold: 0.4, set: { kfile: WL, wlmark: 1 }, labels: ['K-file 15', 'Working length'] },
    { dur: 0.9, hold: 0.1, set: { kfile: -40, rotary: -1.5 }, labels: [] },
    { dur: 2.6, hold: 0.3, set: { rotary: WL, shape: 1 }, labels: [`Rotary file ${SZ}`] },
    { dur: 0.9, hold: 1.8, set: { rotary: -40 }, labels: ['Full length', 'Working length'], key: true }] },
  { label: 'Refill', caption: 'Gutta-percha and sealer fill every canal to working length.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 1.05, focus: FOCUS_TOOTH, set: { cone: -1.5, wlmark: 0 }, labels: ['Gutta-percha cone'] },
    { dur: 2.4, hold: 0.4, set: { cone: WL }, labels: ['Gutta-percha cone'] },
    { dur: 0.6, hold: 1.8, set: { cone: -40, fill: 1 }, labels: ['New root filling'], key: true }] },
  { label: 'Seal and heal', caption: 'A sealed restoration, then a crown; the bone heals over months to years.', beats: [
    { dur: 1.4, hold: 0.8, zoom: 0.8, focus: FOCUS_CROWN, set: { resto: 1 }, labels: ['New seal'] },
    { dur: 2.0, hold: 0.2, zoom: 1.05, focus: FOCUS_TOOTH, labels: ['New seal', 'New root filling'] },
    { dur: 2.4, hold: 2.6, set: { lesion: 0 }, labels: ['New seal', 'New root filling', 'Bone heals'], key: true }] }
]);
fig.start();
