// Silver amalgam filling (Class I) on the mandibular left first molar (FDI 36 = Universal 19), crown up in its socket; frame: +x mesial, +z buccal, CEJ at y = 0, procedure in a mesio-distal cut through the central pit.
// poster: step 6
// The point: amalgam does not bond, so the cavity is cut with walls that converge toward the surface (an undercut) and a
// floor about 0.5 mm into dentin for bulk (>= 1.5 mm thick); the amalgam is condensed in increments and carved.
// dental-facts.md §16: pulpal floor ~0.5 mm into dentin for amalgam, >= 1.5 mm thick, convergent walls for retention.
const FDI = 36;
const fig = DK.figure({
  fov: 26,
  title: 'Silver amalgam filling',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut front to back.',
  view: { theta: 0.5, phi: 1.0 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 16, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: five cusps, two roots.' });

// --- the lesion: pit-and-fissure caries into the dentin
const STAGE = 3.1;
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], size: 1.0, stage: STAGE, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);

// --- the amalgam cavity: floor ~0.5 mm into dentin, walls converging toward the surface (taper < 0)
const TAPER = -0.32;
const PREP = { class: 1, length: s.md * 0.44, depth: 0.5, taper: TAPER };
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const D = prep.dims, TOPF = s.crownL + 1.5;
const fill = DK.filling(tooth, PREP, 'amalgam'); fill.position.y = 0.06; tooth.group.add(fill);   // a hair proud of the enamel so the carved surface reads from above
const ysurf = tooth.group.userData.topGrid;

// --- the converging walls, drawn as two accent ribbons on the cut face (floor corner → surface corner)
const wallMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, depthTest: false });
const walls = new THREE.Group(); walls.renderOrder = 4;
const WALL = [-1, 1].map(sgn => {
  const x0 = D.center[0] + sgn * D.length / 2, y0 = D.floorY + 0.25;
  const x1 = D.center[0] + sgn * D.length / 2 * (1 + TAPER), y1 = ysurf(x1, 0);
  const len = Math.hypot(x1 - x0, y1 - y0), m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, len), wallMat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.14); m.rotation.z = Math.atan2(-(x1 - x0), y1 - y0); m.renderOrder = 4; walls.add(m);
  return { x0, y0, x1, y1 };
});
tooth.group.add(walls); walls.visible = false;
const wallDeg = Math.round(Math.atan2(Math.abs(WALL[0].x1 - WALL[0].x0), WALL[0].y1 - WALL[0].y0) * 180 / Math.PI);

const cutOn = (e, sec) => sec.enabled;
fig.part(M.affected, { inPlace: true, name: 'Decay', anchor: () => at(A.enamel + A.dentin * 0.25, SZ * 0.9, 0), dim: false, info: 'Pit-and-fissure caries: narrow at the groove, wider in the dentin.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-s.md / 2 + 1.0, s.crownL - 1.6, 0], info: 'Enamel, about 2 mm thick over the cusps.', when: cutOn });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [-2.8, 2.6, 0], info: 'Dentin under the enamel.', when: cutOn });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [1.2, 1.6, 0], dim: false, info: 'The nerve and blood supply, well clear of the floor.', when: cutOn });
fig.part(prep, { inPlace: true, name: 'Cavity', sub: 'wider at the floor', anchor: [D.center[0] - D.length / 2 + 0.6, D.floorY + 0.3, 0], dim: false, info: 'Floor about 0.5 mm into dentin so the amalgam is at least 1.5 mm thick; walls lean inward toward the surface.' });
fig.part(M.affected, { inPlace: true, name: 'Firm dentin left', anchor: () => [0.2, D.floorY - 0.3, 0], dim: false, info: 'Only soft, infected dentin is removed; firm dentin under the floor is left (selective removal, ICCC 2016).' });
fig.part(fill, { inPlace: true, name: 'Amalgam', sub: 'not bonded', anchor: [D.center[0] - 0.8, (D.floorY + s.crownL) / 2, 0], dim: false, info: 'An alloy of silver, tin and copper mixed with mercury. It does not stick to the tooth: the shape of the cavity holds it in. Intact amalgam fillings do not need replacing (FDA 2020).' });
fig.part(walls, { inPlace: true, name: 'Walls lean inward', sub: 'the shape locks it in', anchor: () => [WALL[1].x1 + 0.05, (WALL[1].y0 + WALL[1].y1) / 2 + 0.6, 0.14], accent: true, dim: false, info: `The side walls converge toward the surface (about ${wallDeg} degrees each here), so the set amalgam is wider at the floor than at the opening and cannot lift out. A bonded composite needs no such undercut.` });

// --- tools (fig.world, parked out of view)
const fissureBur = DK.bur({ shape: 'flat', diameter: 1.0, head: 4.0 }), roundBur = DK.bur({ shape: 'round', diameter: 1.6, head: 1.6, length: 14 });
const steel = DK.mat('steel', {});
const condenser = new THREE.Group();   // a smooth round plugger: flat nib, tapered neck, angled shank
const nib = DK.lathe([[0, 0], [0.75, 0], [0.75, 1.0], [0.45, 2.2], [0.4, 3.0], [0, 3.05]], 32, steel); condenser.add(nib);
condenser.add(DK.tube([[0, 2.9, 0], [0, 5, 0.3], [0, 7, 1.6], [0, 9, 4.2], [0, 10.5, 8]], 0.42, steel, { caps: true }));
const carver = new THREE.Group();   // a disc-shaped carver blade on a shank
const blade = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 32), steel); blade.rotation.z = Math.PI / 2; blade.position.y = 1.0; carver.add(blade);
carver.add(DK.tube([[0, 1.6, 0], [0, 4, 0.4], [0, 7, 2.2], [0, 10, 6.5]], 0.38, steel, { caps: true }));
[fissureBur, roundBur, condenser, carver].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(fissureBur, { inPlace: true, name: 'Bur', sub: 'shapes the undercut', anchor: [0, 5, 0], info: 'A pear-shaped (inverted-cone-like) carbide bur cuts a cavity that is wider at the floor than at the opening.' });
fig.part(roundBur, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 3, 0], info: 'A round bur at slow speed (or a hand excavator) lifts out the soft decay.' });
fig.part(condenser, { inPlace: true, name: 'Condenser', anchor: [0, 6, 0.6], info: 'Freshly mixed amalgam is pressed into the cavity in small increments, squeezing out excess mercury and filling every corner of the undercut.' });
fig.part(carver, { inPlace: true, name: 'Carver', anchor: [0, 5, 0.8], info: 'Before it sets, the surface is carved back to the grooves and cusps of the tooth.' });

// --- params
const b = { bx: 0, by: 40, bz: 0, which: 0, onStep: 0 };
const front = new THREE.Vector3(), free = new THREE.Vector3();
const placeBur = () => {
  const tool = b.which < 0.5 ? fissureBur : roundBur;
  fissureBur.visible = b.which < 0.5 && b.by < 30; roundBur.visible = b.which >= 0.5 && b.by < 30;
  free.set(b.bx, b.by, b.bz);
  if (b.onStep > 0) { front.fromArray(prep.front('step', 0.5)); tooth.group.localToWorld(front); fig.world.worldToLocal(front); free.lerp(front, b.onStep); }
  tool.position.copy(free);
};
fig.param('step', 0, v => { prep.set(v, 0); placeBur(); });
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; placeBur(); }));
fig.param('removed', 0, k => lesion.set(STAGE, { removed: k }));
fig.param('fill', 0, k => { fill.visible = k > 0.001; if (fill.visible) fill.slice(-1e9, k > 0.995 ? TOPF : D.floorY + (ysurf(D.center[0], 0) + 0.05 - D.floorY) * k); prep.visible = k < 0.99; });
fig.param('walls', 0, k => { wallMat.opacity = 0.95 * k; walls.visible = k > 0.02; });
const tl = { cx: 0, cy: 40, kx: 0, ky: 40 };
const placeTools = () => {
  condenser.visible = tl.cy < 30; condenser.position.set(tl.cx, tl.cy, 0.3);
  carver.visible = tl.ky < 30; carver.position.set(tl.kx, tl.ky, 0.3);
};
Object.keys(tl).forEach(k => fig.param(k, tl[k], v => { tl[k] = v; placeTools(); }));

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [prep], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [fill], color: DK.COLORS.amalgamCap, kind: 'metal' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });

// --- the procedure (camera on +z looks at the cut face: mesial on the viewer's right)
const TOP = s.crownL, fx = D.center[0], FC = [fx, TOP - 1.7, 0], park = { by: 40 };
const SURF = ysurf(fx, 0) + 0.05, lvl = k => D.floorY + (SURF - D.floorY) * k;   // condenser nib on top of the amalgam at fill level k
fig.procedure([
  { label: 'Decay in the groove', caption: 'A cavity in the central groove, into the dentin.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 0.95, zoom: 1.0, section: false, labels: [] },
    { fov: 26, dur: 2.2, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1.0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, offset: 0, labels: ['Enamel', 'Dentin', 'Pulp'] },
    { dur: 1.8, hold: 1.6, zoom: 0.62, focus: FC, labels: ['Decay', 'Enamel', 'Dentin'], key: true }] },
  { label: 'Cut an undercut', caption: 'The bur cuts a box wider at the floor than at the opening.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: fx - D.length / 2 + 0.6, by: TOP + 1.2, bz: 0 }, labels: ['Bur'] },
    { dur: 0.5, hold: 0, set: { onStep: 1 }, labels: ['Bur'] },
    { dur: 2.6, hold: 0.2, set: { step: 1 }, ease: 'linear', labels: ['Bur'] },
    { dur: 0.8, hold: 1.4, set: { onStep: 0, by: 40 }, labels: ['Cavity'], key: true }] },
  { label: 'Remove soft decay', caption: 'Only the soft decay is removed; firm dentin on the floor stays.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.55, focus: [fx, TOP - 2.1, 0], set: { which: 1, bx: fx + 0.6, by: D.floorY + 3.5, bz: 0.4 }, labels: ['Round bur'] },
    { dur: 1.8, hold: 0.2, set: { removed: 1, bx: fx - 0.3, by: D.floorY + 0.3 }, labels: ['Round bur'], key: true },
    { dur: 0.8, hold: 1.2, set: park, labels: ['Firm dentin left', 'Pulp'] }] },
  { label: 'Pack the amalgam', caption: 'Amalgam is pressed in, a little at a time, into every corner.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.62, focus: FC, set: { cx: fx - 1.0, cy: lvl(0) + 1.5 }, labels: ['Condenser'] },
    { dur: 0.9, hold: 0.1, set: { fill: 0.33, cx: fx - 1.0, cy: lvl(0.33) }, labels: ['Condenser'] },
    { dur: 0.7, hold: 0.1, set: { cx: fx + 1.0 }, labels: ['Condenser'] },
    { dur: 0.9, hold: 0.1, set: { fill: 0.66, cy: lvl(0.66) }, labels: ['Condenser', 'Amalgam'] },
    { dur: 0.7, hold: 0.1, set: { cx: fx - 0.8 }, labels: ['Condenser', 'Amalgam'] },
    { dur: 0.9, hold: 1.0, set: { fill: 1, cy: lvl(1) }, labels: ['Condenser', 'Amalgam'], key: true },
    { dur: 0.8, hold: 0.2, set: { cy: 40 }, labels: ['Amalgam'] }] },
  { label: 'Carve to shape', caption: 'Before it sets, the surface is carved back to the grooves.', beats: [
    { dur: 1.0, hold: 0, offset: 7, labels: [] },
    { dur: 0, hold: 0, section: false },
    { dur: 1.6, hold: 0.3, theta: 0.25, phi: 0.4, zoom: 0.62, focus: [0, TOP - 0.4, 0], set: { kx: fx - D.length / 2, ky: TOP + 0.6 }, labels: ['Carver'], key: true },
    { dur: 1.8, hold: 0.2, ease: 'linear', set: { kx: fx + D.length / 2 }, labels: ['Carver'] },
    { dur: 0.8, hold: 1.0, set: { ky: 40 }, labels: ['Amalgam'] }] },
  { label: 'Held by its shape', caption: 'No glue: the walls lean inward, so the set amalgam cannot lift out.', beats: [
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, theta: 0.06, phi: 1.42, zoom: 0.56, focus: [fx, TOP - 2.0, 0], offset: 0, labels: ['Amalgam'] },
    { dur: 1.0, hold: 2.4, set: { walls: 1 }, labels: ['Amalgam', 'Walls lean inward', 'Pulp'], key: true }] }
]);
fig.start();
