// Class I composite filling on the mandibular left first molar (FDI 36 = Universal 19), crown up in its socket; frame: +x mesial, +z buccal, CEJ at y = 0, procedure in a mesio-distal cut through the central pit.
// poster: step 5
// A pit-and-fissure lesion into the dentin (ICDAS 4-5), the occlusal cavity cut just past the DEJ, selective removal of
// soft dentin (firm dentin left, ICCC 2016), etch and bond, two composite increments (each <= 2 mm, light-cured), the
// finished filling. DK.cavityPrep (the hole) and DK.filling (the composite) share PREP, so the filling seats exactly.
// Sizes in mm (dental-facts.md §16).
const FDI = 36;
const fig = DK.figure({
  fov: 26,
  title: 'Class I composite filling',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut front to back.',
  view: { theta: 0.5, phi: 1.0 }
});

// --- tooth and context (bone and gingiva don't drive the camera)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 16, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: five cusps, two roots. Its central pit and grooves are where decay most often starts.' });

// --- the lesion: pit-and-fissure caries at the central pit, into the dentin (ICDAS 4-5)
const STAGE = 3.1;
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], size: 1.0, stage: STAGE, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);

// --- preparation and filling share PREP; the prep is drawn as a hole (inner walls, recessed cap in section)
const PREP = { class: 1, length: s.md * 0.42, depth: 0.3 };   // pulpal floor just past the DEJ: composite only needs to clear the caries
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const D = prep.dims, TOPF = s.crownL + 1.5;
const MID = (D.floorY + s.crownL - 0.6) / 2;   // the second increment starts about halfway up
const INC = [D.floorY, MID, TOPF];
const SHADES = [DK.COLORS.compositeCap, DK.COLORS.compositeLight];
const fills = SHADES.map(c => { const f = DK.filling(tooth, PREP, 'composite'); f.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = DK.color(c); } }); f.position.y = 0.06; tooth.group.add(f); return f; });
// etch gel: the same solid in a translucent blue, shown for one beat and rinsed away
const gel = DK.filling(tooth, PREP, 'composite');
gel.traverse(m => { if (m.isMesh) m.material = DK.mat('composite', { color: 0x7f9cb6, roughness: 0.3, clearcoat: 0.6 }); });
tooth.group.add(gel); gel.visible = false;
const wallMat = prep.step.material, WALL0 = wallMat.color.clone(), WALLBOND = DK.color(0xd9cba6);

const cutOn = (e, sec) => sec.enabled;
fig.part(M.affected, { inPlace: true, name: 'Decay', sub: 'spreads under the groove', anchor: () => at(A.enamel + A.dentin * 0.25, SZ * 0.9, 0), dim: false, info: 'Pit-and-fissure caries: narrow at the groove, wider in the dentin, so there is more decay inside than the small dark spot on top suggests.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-s.md / 2 + 1.0, s.crownL - 1.6, 0], info: 'Enamel: the hard outer layer, about 2 mm thick over the cusps.', when: cutOn });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [-2.8, 2.6, 0], info: 'Dentin under the enamel: softer, with tubules running to the pulp.', when: cutOn });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [1.2, 1.6, 0], info: 'The nerve and blood supply. Well clear of a small Class I cavity.', when: cutOn });
fig.part(prep, { inPlace: true, name: 'Cavity', sub: 'just past the enamel', anchor: [D.center[0] - D.length / 2 + 0.7, D.floorY + 0.25, 0], dim: false, info: 'The outline follows the decay along the groove; the floor goes just past the enamel-dentin junction. A bonded filling needs no extra cutting for retention.' });
fig.part(M.affected, { inPlace: true, name: 'Firm dentin left', anchor: () => [0.2, D.floorY - 0.35, 0], dim: false, info: 'Selective removal: soft, infected dentin is taken out; firm, affected dentin under the floor is left and sealed (ICCC 2016).' });
fig.part(gel, { inPlace: true, name: 'Etch gel', sub: 'then rinsed', anchor: [D.center[0] + 0.6, s.crownL - 0.6, 0], dim: false, info: 'Phosphoric acid gel roughens the enamel and opens the dentin surface; then it is rinsed and the cavity dried.' });
fig.part(prep, { inPlace: true, name: 'Bond', sub: 'thin resin on the walls', anchor: [D.center[0] - D.length / 2 + 0.25, (D.floorY + s.crownL) / 2, 0], dim: false, info: 'A thin adhesive resin soaks into the etched walls and is light-cured: the composite sticks to it, so the cavity needs no undercuts.' });
fig.part(fills[0], { inPlace: true, name: 'Composite', sub: 'two cured layers', anchor: [D.center[0] - 0.9, (MID + D.floorY) / 2, 0], accent: true, dim: false, info: 'Tooth-coloured resin placed in layers of 2 mm or less; each layer is light-cured before the next, so it sets through and shrinks less against the walls.' });

// --- tools (fig.world, parked out of view). Burs spin and throw chips while they cut (the kit does it).
const fissureBur = DK.bur({ shape: 'flat', diameter: 1.0, head: 4.0 }), roundBur = DK.bur({ shape: 'round', diameter: 1.6, head: 1.6, length: 14 });
const light = DK.curingLight({ tip: 4 });
// a microbrush: a thin bendable shaft with a small fibre tip
const brush = new THREE.Group();
const shaftMat = DK.mat(0xb9c6cf, { roughness: 0.5 }), tipMat = DK.mat(0xe9e4d8, { roughness: 0.95, bump: 'grain', bumpScale: 0.05 });
brush.add(DK.tube([[0, 0.45, 0], [0, 3, 0.4], [0, 6, 2.2], [0, 9, 5.6], [0, 11, 10]], 0.28, shaftMat, { caps: true }));
const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), tipMat); tipBall.position.y = 0.5; tipBall.scale.y = 1.15; brush.add(tipBall);
const syringe = new THREE.Group();
const steel = DK.mat('steel', {});
syringe.add(DK.tube([[0, 0, 0], [0, 1.6, 0.2], [0, 3.2, 1.2], [0, 4.8, 3.2], [0, 6.0, 6.5]], 0.32, steel, { caps: true }));
const hub = DK.lathe([[0.45, 0], [0.9, 1.5], [1.1, 9], [0, 9.2]], 24, DK.mat(0x8aa4bd, { roughness: 0.5 })); hub.position.set(0, 6.0, 6.5); hub.rotation.x = Math.PI / 2 - 0.25; syringe.add(hub);
[fissureBur, roundBur, light, brush, syringe].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(fissureBur, { inPlace: true, name: 'Bur', sub: 'high speed', anchor: [0, 5, 0], info: 'A small diamond or carbide bur with water spray opens the groove and follows the decay.' });
fig.part(roundBur, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 3, 0], info: 'A round bur at slow speed (or a hand excavator) lifts out the soft decay without over-cutting.' });
fig.part(syringe, { inPlace: true, name: 'Etch', anchor: [0, 3.2, 1.2], info: 'Acid etch gel is laid into the cavity from a fine tip.' });
fig.part(brush, { inPlace: true, name: 'Microbrush', sub: 'bonding agent', anchor: [0, 6, 2.2], info: 'The bonding agent is scrubbed onto the walls, air-thinned and light-cured.' });
fig.part(light, { inPlace: true, name: 'Curing light', sub: 'each layer', anchor: [0, 6, 0], info: 'Blue LED light (about 450-470 nm) sets each layer in seconds.' });

// --- params
const b = { bx: 0, by: 40, bz: 0, tilt: 0, which: 0, onStep: 0 };
const front = new THREE.Vector3(), free = new THREE.Vector3();
const placeBur = () => {
  const tool = b.which < 0.5 ? fissureBur : roundBur;
  fissureBur.visible = b.which < 0.5 && b.by < 30; roundBur.visible = b.which >= 0.5 && b.by < 30;
  free.set(b.bx, b.by, b.bz);
  if (b.onStep > 0) { front.fromArray(prep.front('step', 0.5)); tooth.group.localToWorld(front); fig.world.worldToLocal(front); free.lerp(front, b.onStep); }
  tool.position.copy(free); tool.rotation.x = b.tilt;
};
fig.param('step', 0, v => { prep.set(v, 0); placeBur(); });
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; placeBur(); }));
fig.param('removed', 0, k => lesion.set(STAGE, { removed: k }));
fig.param('gel', 0, k => { gel.visible = k > 0.02; if (gel.visible) gel.slice(-1e9, D.floorY + (TOPF - D.floorY) * Math.min(1, k)); });
fig.param('bond', 0, k => { wallMat.color.copy(WALL0).lerp(WALLBOND, k); });
fig.param('fill', 0, k => {   // 0..1 over the two increments; the void hides once the last one is flush
  fills.forEach((f, i) => { const ki = Math.min(1, Math.max(0, k * 2 - i)); f.visible = ki > 0.001; if (f.visible) f.slice(INC[i] - (i ? 0 : 1e9), INC[i] + (INC[i + 1] - INC[i]) * ki); });
  prep.visible = k < 0.99;
});
const tl = { sy: 40, sx: 0, my: 40, mx: 0, ly: 40, cure: 0 };
const placeTools = () => {
  syringe.visible = tl.sy < 30; syringe.position.set(tl.sx, tl.sy, 0.3);
  brush.visible = tl.my < 30; brush.position.set(tl.mx, tl.my, 0.3);
  light.visible = tl.ly < 30; light.position.set(D.center[0], tl.ly, 0.4); light.set(tl.cure);
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
  { objects: [gel], color: 0x8fa9c0, kind: 'plain' },
  ...fills.map((f, i) => ({ objects: [f], color: SHADES[i], kind: 'plain' }))
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });

// --- the procedure (camera on +z looks at the cut face: mesial on the viewer's right)
const TOP = s.crownL, FC = [D.center[0], TOP - 1.6, 0], park = { by: 40 };
const fx = D.center[0];
fig.procedure([
  { label: 'Decay in the groove', caption: 'A small dark spot in the central groove hides a wider lesion in the dentin.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 0.95, zoom: 1.0, section: false, labels: [] },
    { fov: 26, dur: 2.2, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1.0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, offset: 0, labels: ['Enamel', 'Dentin', 'Pulp'] },
    { dur: 1.8, hold: 1.6, zoom: 0.62, focus: FC, labels: ['Decay', 'Enamel', 'Dentin'], key: true }] },
  { label: 'Open the cavity', caption: 'A bur opens the groove and follows the decay just into the dentin.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: fx - D.length / 2 + 0.6, by: TOP + 1.2, bz: 0, tilt: 0 }, labels: ['Bur'] },
    { dur: 0.5, hold: 0, set: { onStep: 1 }, labels: ['Bur'] },
    { dur: 2.6, hold: 0.2, set: { step: 1 }, ease: 'linear', labels: ['Bur'], key: true },
    { dur: 0.8, hold: 1.0, set: { onStep: 0, by: 40 }, labels: ['Cavity'] }] },
  { label: 'Remove soft decay', caption: 'Only the soft decay is removed; firm dentin on the floor stays.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.55, focus: [fx, TOP - 2.0, 0], set: { which: 1, bx: fx + 0.6, by: D.floorY + 3.5, bz: 0.4 }, labels: ['Round bur'] },
    { dur: 1.8, hold: 0.2, set: { removed: 1, bx: fx - 0.3, by: D.floorY + 0.3 }, labels: ['Round bur'], key: true },
    { dur: 0.8, hold: 1.2, set: park, labels: ['Firm dentin left', 'Pulp'] }] },
  { label: 'Etch and bond', caption: 'Acid gel, rinse, then a thin bonding resin on every wall.', beats: [
    { dur: 0.9, hold: 0.1, zoom: 0.62, focus: FC, set: { sx: fx + 0.8, sy: TOP + 0.8 }, labels: ['Etch'] },
    { dur: 1.6, hold: 1.0, set: { gel: 1, sx: fx - 0.8 }, labels: ['Etch', 'Etch gel'], key: true },
    { dur: 0.8, hold: 0.2, set: { sy: 40 }, labels: ['Etch gel'] },
    { dur: 0.8, hold: 0.3, set: { gel: 0 }, labels: [] },
    { dur: 0.9, hold: 0.1, set: { mx: fx - 0.9, my: D.floorY + 0.15 }, labels: ['Microbrush'] },
    { dur: 1.4, hold: 0.2, set: { mx: fx + 0.9, bond: 1 }, labels: ['Microbrush'] },
    { dur: 0.8, hold: 1.0, set: { my: 40 }, labels: ['Bond'] }] },
  { label: 'Composite in layers', caption: 'Two layers of composite, each light-cured before the next.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.72, focus: [fx, TOP, 0], set: { fill: 0.5 }, labels: ['Composite'] },
    { dur: 0.6, hold: 0, set: { ly: TOP + 2.4 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0.7, set: { cure: 1 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0, set: { cure: 0 } },
    { dur: 1.2, hold: 0.1, set: { fill: 1, ly: TOP + 5 }, labels: ['Composite'] },
    { dur: 0.4, hold: 0, set: { ly: TOP + 2.4 } },
    { dur: 0.25, hold: 0.9, set: { cure: 1 }, labels: ['Composite', 'Curing light'], key: true },
    { dur: 0.3, hold: 0, set: { cure: 0 } },
    { dur: 0.8, hold: 0.3, set: { ly: 40 }, labels: ['Composite'] }] },
  { label: 'Finished', caption: 'Shaped to the grooves and polished: the filling is bonded and sealed.', beats: [
    { dur: 2.2, hold: 1.4, theta: 0.45, phi: 0.75, zoom: 0.8, focus: [0, TOP - 0.8, 0], section: true, labels: ['Composite'] },
    { dur: 2.2, hold: 2.2, theta: 0.08, phi: 1.4, zoom: 0.56, focus: [fx, TOP - 2.2, 0], labels: ['Composite', 'Firm dentin left', 'Pulp'], key: true }] }
]);
fig.start();
