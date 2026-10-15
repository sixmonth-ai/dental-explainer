// Procedure: root canal treatment of the maxillary right first premolar (FDI 14 = Universal 5), crown up (model convention), with bone and gum around it, in a bucco-palatal cut through both roots so the buccal and the palatal canal read on the cut face together. Frame: +x mesial, +z buccal, CEJ at y = 0, mm; camera on the mesial side (buccal on the viewer's left, palatal on the right).
// poster: step 5
// Six steps: an infected pulp with a lesion at the buccal root tip, access through the occlusal surface (an oval, long bucco-palatally), working length in each canal, shaping each canal (with irrigation), gutta-percha in both canals, and a sealed restoration while the bone heals. Every instrument bends along DK.canalAccessPath from the cusp tip over its canal.
const FDI = 14, CREST = -1.6, SHORT = 0.5;
const SHAPE = { size: 25, taper: 0.06 };             // a common final size for a premolar canal; sizes vary by case

const fig = DK.figure({
  fov: 26,
  title: 'Root canal on a premolar',
  subtitle: 'Upper right first premolar, FDI 14 (Universal 5), crown up, cut through both canals.',
  view: { theta: Math.PI / 2, phi: 1.42, margin: 1.0 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const [RB, RP] = s.roots;
const CUT = DK.canalAt(s, 0, -6).x;                    // the cut runs through the middle of both canals
const bone = DK.bone({ width: 10.5, height: 17.5, depth: 13.5, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, 0);
const gum = DK.gingiva({ width: 10.5, height: 3.0, depth: 14.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.set(0, 1.1, 0);
const apexB = [RB.x + RB.apex[0], -RB.len, RB.z + RB.apex[1]];
const lesion = DK.periapicalLesion({ radius: 2.4, seed: 7, color: 0x7d6761 }); lesion.position.set(apexB[0], apexB[1] - 0.6, apexB[2] + 0.2);
tooth.group.add(lesion);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the roots; the buccal plate over an upper premolar is thin.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth; a rubber dam isolates the tooth during treatment.' });
fig.part(tooth.group, { name: 'Tooth 14', label: false, info: 'Upper right first premolar: usually two roots, buccal and palatal, with one canal each.' });
fig.part(lesion, { inPlace: true, name: 'Infection', sub: 'at the root tip', anchor: [0.4, -0.4, 0.9], accent: true, dim: false, when: () => lesion.userData.k > 0.3,
  info: 'Apical periodontitis: bacteria in the dead canal inflame the tissue at the root tip and dissolve bone around it. It hurts on biting and shows as a dark area on an X-ray.' });
fig.part(L.pulp, { inPlace: true, name: 'Dead pulp', anchor: [CUT, 3.0, 0], dim: false, when: () => L.pulp.visible && pulpState.necrosis > 0.5,
  info: 'The pulp in the chamber and in both canals has died and is infected.' });

// --- reference points: the stop for each canal rests on the cusp tip above it (raycast the enamel, as the cusp relief rises above crownL)
tooth.group.updateMatrixWorld(true); const enamelMeshes0 = []; L.enamel.traverse(m => { if (m.isMesh) enamelMeshes0.push(m); });
const rc = new THREE.Raycaster();
const cuspTop = (x, z) => { rc.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(enamelMeshes0, false)[0]; return h ? [x, h.point.y, z] : [x, s.crownL, z]; };
const REF_B = cuspTop(CUT, s.bl * 0.25), REF_P = cuspTop(CUT, -s.bl * 0.25);
const pathB = DK.canalAccessPath(s, 0, { ref: REF_B, short: SHORT }), pathP = DK.canalAccessPath(s, 1, { ref: REF_P, short: SHORT });
const WL_B = pathB.wl, WL_P = pathP.wl;

// --- canal space: void copies, shaping, fillings, restoration
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750, FLUID = 0xb7c0c2;
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const GROW = 0.72;   // the kit's two-canal oval runs past the cusp tips; a real premolar access stays inside them, keeping both cusps
const access = DK.accessCavity(s, { k: 0, color: EMPTY, grow: GROW });
const accessRim = DK.accessCavity(s, { k: 0, material: 'ink', grow: GROW * 1.05, lift: 0.01 });
// the kit's access prism takes its top from the crown without its cusp relief (flat at crown height), so between the cusps it would
// stand proud of the fossa: drop the top rings onto the real enamel surface (the walls are rebuilt from the outer ring, which stays)
const enamelMeshes = []; L.enamel.traverse(m => { if (m.isMesh) enamelMeshes.push(m); });
function fitTop(m, lift) {
  const P = m.geometry.attributes.position, n = 5 * m.outline.points.length, d = new THREE.Vector3(0, -1, 0);
  for (let i = 0; i < n; i++) { rc.set(new THREE.Vector3(P.getX(i), 40, P.getZ(i)), d); const h = rc.intersectObjects(enamelMeshes, false)[0]; if (h) P.setY(i, h.point.y + lift); }
  P.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
}
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const canals = [0, 1].map(i => DK.canalShape(s, i, Object.assign({ color: CANAL_INK }, SHAPE)));
const fillings = [0, 1].map(i => DK.rootFilling(s, i, SHAPE));
const resto = DK.accessCavity(s, { material: 'composite', lift: 0.16, grow: GROW });
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
fitTop(access, 0.03); fitTop(accessRim, 0.01); fitTop(resto, 0.12);
const markMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });
const endB = pathB.points[pathB.points.length - 1], endP = pathP.points[pathP.points.length - 1];
const wlB = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), markMat); wlB.position.set(endB[0] + 0.25, endB[1], endB[2]); wlB.visible = false;
const wlP = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), markMat); wlP.position.set(endP[0] + 0.25, endP[1], endP[2]); wlP.visible = false;
[accessRim, chamberRim, access, chamberVoid, ...canals, ...fillings, resto, chamberResto, wlB, wlP].forEach(o => tooth.group.add(o));
const midY = -6.5, mB = DK.canalAt(s, 0, midY), mP = DK.canalAt(s, 1, midY);
fig.part(access, { inPlace: true, name: 'Opening', sub: 'oval, through the biting surface', anchor: [CUT, access.opening.y, access.opening.z], dim: false, when: () => access.visible,
  info: 'An oval opening, long from cheek to palate, removes the roof of the pulp chamber so both canal entrances are in view and each canal can be reached in a straight line.' });
fig.part(canals[0], { inPlace: true, name: 'Buccal canal', anchor: [CUT + 0.05, midY, mB.z], labelOffset: [-70, 0], dim: false, when: () => canals[0].visible && canals[0].userData.k > 0.5,
  info: 'The cheek-side canal, cleaned and shaped into a smooth taper to just short of the root tip.' });
fig.part(canals[1], { inPlace: true, name: 'Palatal canal', anchor: [CUT + 0.05, midY, mP.z], labelOffset: [70, 0], dim: false, when: () => canals[1].visible && canals[1].userData.k > 0.5,
  info: 'The palate-side canal, shaped the same way: both canals are treated, not only the one with the lesion.' });
fig.part(fillings[0], { inPlace: true, name: 'Two root fillings', sub: 'gutta-percha', anchor: [CUT + 0.05, midY, mB.z], labelOffset: [-70, 0], dim: false, when: () => fillings[0].visible,
  info: 'Gutta-percha and sealer fill both canals to their working lengths.' });
fig.part(resto, { inPlace: true, name: 'Seal', anchor: [CUT, resto.opening.y, resto.opening.z], dim: false, when: () => resto.visible,
  info: 'A sealed filling closes the opening at once; a root-filled premolar usually then gets cuspal coverage (a crown or onlay), because it can split under biting load.' });
const healMark = new THREE.Object3D(); healMark.position.set(CUT, apexB[1] - 1.4, apexB[2] + 0.4); tooth.group.add(healMark);
fig.part(healMark, { inPlace: true, name: 'Bone heals', anchor: [0, 0, 0], dim: false, when: () => lesion.userData.k < 0.05,
  info: 'With the infection gone, bone fills in over months to years; a follow-up X-ray about a year later checks it.' });
fig.part(wlB, { inPlace: true, name: 'Working length', sub: `${DK.mm(WL_B)} buccal, ${DK.mm(WL_P)} palatal`, anchor: [0, 0, 0], labelOffset: [-120, 0], accent: true, dim: false, when: () => wlB.visible,
  info: `Each canal gets its own length, measured from the cusp tip above it to ${SHORT} mm short of its apex with an apex locator and a radiograph.` });

// --- instruments (fig.world): bur, a K-file and a rotary file per canal, a needle, a cone per canal
const bur = DK.bur({ shape: 'round', diameter: 1.2, head: 1.2 });
const kB = DK.endoFile({ kind: 'K', size: 15, length: 25, stop: WL_B }), kP = DK.endoFile({ kind: 'K', size: 15, length: 25, stop: WL_P });
const rotB = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25, stop: WL_B }), rotP = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25, stop: WL_P });
const needle = DK.irrigationNeedle({ gauge: 30, length: 25 });
const coneB = DK.gpCone(SHAPE), coneP = DK.gpCone(SHAPE);
[bur, kB, kP, rotB, rotP, needle, coneB, coneP].forEach(o => fig.world.add(o));
const sz = `${SHAPE.size}/.${Math.round(SHAPE.taper * 100).toString().padStart(2, '0')}`;
fig.part(bur, { inPlace: true, name: 'Bur', anchor: [0, 7, 0], info: 'A round bur opens the occlusal surface and removes the roof of the pulp chamber. The tooth is numbed and isolated with a rubber dam first.' });
fig.part(kB.handle, { inPlace: true, name: 'K-file 15', sub: 'white', anchor: [0, 6, 0], info: 'A fine stainless-steel hand file (tip 0.15 mm) finds the way down each canal and takes its working length.' });
fig.part(rotB.handle, { inPlace: true, name: `Rotary file ${sz}`, anchor: [0, 6, 0], info: `A flexible nickel-titanium file shapes each canal into a continuous taper (tip ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 0).toFixed(2)} mm). Sodium hypochlorite rinses between files dissolve tissue and kill bacteria.` });
fig.part(needle, { inPlace: true, name: 'Rinse', sub: 'sodium hypochlorite', anchor: () => needle.userData.points[30] || [0, 0, 0], info: 'A side-vented 30 G needle, loose in the canal and short of working length, delivers the disinfecting rinse.' });
fig.part(coneB, { inPlace: true, name: 'Gutta-percha', anchor: () => coneB.userData.points[40] || [0, 0, 0], info: 'A gutta-percha cone matching the last file, coated in sealer, seated to working length in each canal.' });

// --- params
const pulpState = { necrosis: 0 };
const PULP = DK.color(DK.COLORS.pulp), NECRO = DK.color(0x6b5d59);
fig.param('necrosis', 0, v => { pulpState.necrosis = v; L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(NECRO, v); }); if (fig.section) DK.capColor(fig.section, 6, v > 0.5 ? 0x6e615d : DK.COLORS.pulpCap); });
fig.param('lesion', 1, k => lesion.set(k));
const st = { pulp: 1, access: 0, fill: 0, resto: 0 };
const sync = () => { const gone = st.pulp < 0.5, filled = st.fill > 0.5, restored = st.resto > 0.5;
  L.pulp.visible = !gone; chamberVoid.visible = gone && !restored; chamberRim.visible = gone; canals.forEach(c => { c.visible = gone && !filled; }); fillings.forEach(f => { f.visible = filled; });
  access.visible = st.access > 0.02 && !restored; accessRim.visible = st.access > 0.02; resto.visible = chamberResto.visible = restored; };
fig.param('access', 0, k => { st.access = k; access.set(k); accessRim.set(k); sync(); });
fig.param('pulp', 1, v => { st.pulp = v; sync(); });
fig.param('shapeB', 0, k => canals[0].set(k));
fig.param('shapeP', 0, k => canals[1].set(k));
fig.param('fluid', 0, k => { [chamberVoid, access].forEach(o => o.material.color.copy(DK.color(EMPTY)).lerp(DK.color(FLUID), k)); canals.forEach(o => o.material.color.copy(DK.color(CANAL_INK)).lerp(DK.color(FLUID), k)); if (fig.section) { DK.capColor(fig.section, 8, k > 0.5 ? FLUID : EMPTY); DK.capColor(fig.section, 9, k > 0.5 ? FLUID : CANAL_INK); } });
fig.param('fill', 0, v => { st.fill = v; sync(); });
fig.param('resto', 0, v => { st.resto = v; sync(); });
fig.param('wl', 0, v => { wlB.visible = wlP.visible = v > 0.5; });
const place = (tool, path, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(path, d); };
fig.param('kB', -40, d => place(kB, pathB.points, d));
fig.param('kP', -40, d => place(kP, pathP.points, d));
fig.param('rotB', -40, d => place(rotB, pathB.points, d));
fig.param('rotP', -40, d => place(rotP, pathP.points, d));
fig.param('needle', -40, d => place(needle, pathB.points, d));
fig.param('coneB', -40, d => place(coneB, pathB.points, d));
fig.param('coneP', -40, d => place(coneP, pathP.points, d));
fig.param('bur', 40, y => { bur.visible = y < 30; bur.position.set(CUT + 0.4, y, access.opening.z); });

fig.enableSection([1, 0, 0], [
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
fig.view('X-ray', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });
fig.setReadout([{ k: 'Working length', v: `buccal ${DK.mm(WL_B)} · palatal ${DK.mm(WL_P)} · ${SHORT} mm short of each apex` }]);

// --- the procedure (camera on +x looks at the cut face; buccal on the left, palatal on the right)
const SIDE = Math.PI / 2, FOCUS_TOOTH = [CUT, -2.8, 0];
fig.procedure([
  { label: 'Infected pulp', caption: 'The pulp has died and infection has reached the bone at the buccal root tip.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: SIDE - 0.7, phi: 1.3, zoom: 1.0, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { fov: 26, dur: 2.4, hold: 0.4, theta: SIDE, phi: 1.42, zoom: 0.95, focus: FOCUS_TOOTH, offset: CUT, labels: [] },
    { dur: 1.8, hold: 2.0, set: { necrosis: 1 }, labels: ['Dead pulp', 'Infection'], key: true }] },
  { label: 'Opening', caption: 'An oval opening through the biting surface removes the roof of the pulp chamber.', beats: [
    { dur: 1.8, hold: 0.2, zoom: 0.82, focus: [CUT, 2.5, 0], theta: SIDE + 0.1, set: { bur: access.opening.y + 3 }, labels: ['Bur'] },
    { dur: 2.2, hold: 0.4, set: { access: 1, bur: access.floor.y + 1.2 }, labels: ['Bur'] },
    { dur: 1.4, hold: 1.4, zoom: 0.95, focus: FOCUS_TOOTH, set: { bur: 40, pulp: 0 }, labels: ['Opening'], key: true }] },
  { label: 'Two lengths', caption: 'A fine file finds each canal and measures its length.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 1.15, focus: [CUT, -1.5, 0], theta: SIDE, set: { kB: -1.5 }, labels: ['K-file 15'] },
    { dur: 2.2, hold: 0.2, set: { kB: WL_B, kP: -1.5 }, labels: ['K-file 15'] },
    { dur: 2.2, hold: 0.2, set: { kP: WL_P }, labels: ['K-file 15'] },
    { dur: 1.2, hold: 1.8, set: { wl: 1 }, labels: ['Working length'], key: true },
    { dur: 0.9, hold: 0.2, set: { kB: -40, kP: -40, wl: 0 }, labels: [] }] },
  { label: 'Shaping both canals', caption: 'Rotary files shape each canal, with disinfecting rinses between files.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.95, focus: FOCUS_TOOTH, set: { rotB: -1.5 }, labels: [`Rotary file ${sz}`] },
    { dur: 2.4, hold: 0.2, set: { rotB: WL_B, shapeB: 1, rotP: -1.5 }, labels: [`Rotary file ${sz}`] },
    { dur: 2.4, hold: 0.2, set: { rotB: -40, rotP: WL_P, shapeP: 1 }, labels: [`Rotary file ${sz}`] },
    { dur: 1.0, hold: 0.1, set: { rotP: -40, needle: -1.5 }, labels: ['Rinse'] },
    { dur: 1.8, hold: 1.2, set: { needle: WL_B - 2, fluid: 1 }, labels: ['Rinse'] },
    { dur: 0.9, hold: 1.6, set: { needle: -40 }, labels: ['Buccal canal', 'Palatal canal'], key: true }] },
  { label: 'Filling both canals', caption: 'Gutta-percha and sealer fill each canal to its working length.', beats: [
    { dur: 1.0, hold: 0.1, set: { fluid: 0, coneB: -1.5, coneP: -1.5 }, labels: ['Gutta-percha'] },
    { dur: 2.4, hold: 0.4, set: { coneB: WL_B, coneP: WL_P }, labels: ['Gutta-percha'] },
    { dur: 0.6, hold: 1.8, set: { coneB: -40, coneP: -40, fill: 1 }, labels: ['Two root fillings'], key: true }] },
  { label: 'Sealing', caption: 'A sealed filling closes the opening; the bone heals over months.', beats: [
    { dur: 1.4, hold: 0.4, zoom: 0.82, focus: [CUT, 2.5, 0], set: { resto: 1 }, labels: ['Seal'] },
    { dur: 2.0, hold: 0.2, zoom: 0.95, focus: FOCUS_TOOTH, labels: ['Seal', 'Two root fillings'] },
    { dur: 2.4, hold: 2.6, theta: SIDE - 0.08, set: { lesion: 0 }, labels: ['Seal', 'Two root fillings', 'Bone heals'], key: true }] }
]);
fig.start();
