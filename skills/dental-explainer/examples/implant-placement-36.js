// Example procedure: placing a single implant in the healed site of the mandibular left first molar (FDI 36 = Universal 19),
// seen in a mesio-distal cut so the neighbouring roots and the inferior alveolar canal stay visible.
// Tools and parts that the steps move are added to fig.world and annotated with inPlace: true (explode would reset them).
// Frame: +x = mesial, +z = buccal, y up. Neighbour CEJs at y = 0. All sizes in mm.
const CREST = -1.8;                                  // alveolar crest
const IMPLANT = { diameter: 4.1, length: 10, lead: 1.6 };   // lead = advance per turn (0.8 mm pitch, 2 starts)
const CANAL_Y = CREST - IMPLANT.length - 4.0, CANAL_R = 1.5;
const PILOT = 2.0, FINAL = 3.5;                      // drill diameters; the final size is set by the implant system
const clearance = (CREST - IMPLANT.length) - (CANAL_Y + CANAL_R);

const fig = DK.figure({
  title: 'Placing an implant in 36',
  subtitle: 'FDI 36 (Universal 19), mesio-distal cut. Drill sizes vary by system.',
  view: { theta: 0, phi: 1.45 }
});

// --- context: bone, canal, gingiva, neighbours (regular parts: they frame the camera)
const bone = DK.bone({ width: 34, height: 19, depth: 11, cortical: 1.2, crest: 1.6 });
bone.position.set(-1, CREST, 0);
const canal = new THREE.Group();
const path = [[-18, CANAL_Y - 0.6, 0.4], [-6, CANAL_Y, 0.2], [6, CANAL_Y + 0.3, 0], [16, CANAL_Y + 0.9, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.75, DK.mat('nerve'), { caps: false });
canal.add(lumen, nerve);
const gum = DK.gingiva({ width: 34, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: 1 + 5.5 + 3.5, z: 0, md: 5, bl: 7, rise: 0.8 }, { x: 1 - 5.5 - 5.25, z: 0, md: 8, bl: 9, rise: 0.8 }] });
gum.position.set(-1, 1.1, 0);
const t35 = DK.tooth(35); t35.group.position.x = 5.5 + 3.5;
const t37 = DK.tooth(37); t37.group.position.x = -(5.5 + 5.25);

fig.part(bone, { name: 'Bone', label: false, info: 'Healed alveolar ridge: cortical shell over cancellous bone.' });
fig.part(canal, { name: 'Inferior alveolar canal', sub: `${clearance.toFixed(1)} mm below the implant`, anchor: [-13, CANAL_Y - 0.5, 0], info: 'Keep at least 2 mm between the implant apex and the canal.' });
fig.part(gum, { name: 'Gingiva', label: false, info: 'Soft tissue over the ridge.' });
fig.part(t35.group, { name: '35', anchor: [0, 6, 0], info: 'Lower second premolar. Keep at least 1.5 mm from its root.' });
fig.part(t37.group, { name: '37', anchor: [0, 6, 0], info: 'Lower second molar. Keep at least 1.5 mm from its mesial root.' });

// --- what the procedure moves (inPlace parts, positioned by params)
const hole1 = DK.osteotomy(), hole2 = DK.osteotomy();
hole1.position.y = hole2.position.y = CREST + 0.02;
const pilot = DK.drill({ diameter: PILOT, length: 14, shank: 6 });
const final = DK.drill({ diameter: FINAL, length: 14, shank: 6 });
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' });
const heal = DK.lathe([[0, 0], [2.05, 0], [2.3, 2.2], [2.3, 3.4], [2.0, 3.6], [0, 3.6]], 48, DK.mat('titanium'));
const abut = DK.abutment({ platform: 4.1, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 });
const crown = DK.restorationCrown(36, 'zirconia', { hollow: false });
[hole1, hole2, pilot, final, implant, heal, abut, crown].forEach(o => fig.world.add(o));

fig.part(pilot, { inPlace: true, name: 'Pilot drill', sub: `Ø${PILOT} mm`, anchor: [0, -6, 0], info: 'First drill: sets the position, angle and depth of the implant bed.' });
fig.part(final, { inPlace: true, name: 'Final drill', sub: `Ø${FINAL} mm (system-specific)`, anchor: [0, -6, 0], info: 'Sequential drills widen the bed; the final size depends on the implant system and bone density.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `Ø${IMPLANT.diameter} × ${IMPLANT.length} mm`, anchor: [IMPLANT.diameter / 2, -5, 0], accent: true, info: 'Threaded in to the depth of the bed.' });
fig.part(heal, { inPlace: true, name: 'Healing abutment', anchor: [2.3, 2, 0], info: 'Shapes the gingiva while the implant integrates.' });
fig.part(abut, { inPlace: true, name: 'Abutment', anchor: [2.8, 1.2, 0], info: 'Connects the crown to the implant; the hex stops it rotating.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'zirconia', anchor: [-3, 6.5, 0], info: 'Restores the occlusion of 36.' });

// --- params: every moving thing is a number the steps animate
const drillAt = (tool, d) => { tool.visible = d > -15; tool.position.y = CREST - d + 14; tool.rotation.y = d * 3; };  // d = tip depth below crest
fig.param('pilot', -20, d => drillAt(pilot, d));
fig.param('final', -20, d => drillAt(final, d));
fig.param('bed1', 0, d => hole1.set(PILOT / 2, d));
fig.param('bed2', 0, d => hole2.set(FINAL / 2, d));
fig.param('implant', 0, k => {   // 0 = hovering 3 mm above the crest, 1 = seated at the crest
  const travel = (1 - k) * (IMPLANT.length + 3);
  implant.visible = k > 0.001; implant.position.y = CREST + travel; implant.rotation.y = -travel / IMPLANT.lead * Math.PI * 2;
});
fig.param('heal', 0, k => { heal.visible = k > 0.001; heal.position.y = CREST + (1 - k) * 8; });
fig.param('crown', 0, k => {
  abut.visible = crown.visible = k > 0.001;
  abut.position.y = CREST + (1 - k) * 10; crown.position.y = 0.2 + (1 - k) * 18;
});

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [hole2], color: 0x6f645c }, { objects: [hole1], color: 0x6f645c },
  { objects: [t35.layers.enamel, t37.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t35.layers.root, t35.layers.dentin, t37.layers.root, t37.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t35.layers.pulp, t37.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

const D = IMPLANT.length;
// Each step is a few shots: the camera settles where the step's action is, the tool or part moves, the label lands.
fig.procedure([
  { label: 'Healed site', caption: 'The healed site of 36, between 35 and 37.', beats: [
    { dur: 0, hold: 1.0, theta: 0.55, phi: 1.25, zoom: 1.05, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.4, hold: 1.6, theta: 0, phi: 1.45, zoom: 1, offset: 0, labels: ['35', '37', 'Inferior alveolar canal'], key: true }] },
  { label: 'Pilot drill', caption: `Pilot drill to ${D} mm: position, angle, depth.`, beats: [
    { dur: 1.2, hold: 0.2, zoom: 0.92, focus: [0, 1, 0], phi: 1.38, set: { pilot: 0 }, labels: ['Pilot drill'] },
    { dur: 2.0, hold: 0.8, zoom: 0.85, focus: [0, -4, 0], set: { pilot: D, bed1: D }, labels: ['Pilot drill', 'Inferior alveolar canal'], key: true },
    { dur: 0.9, hold: 0.2, set: { pilot: -20 }, labels: [] }] },
  { label: 'Final drill', caption: 'Wider drills shape the bed to the implant.', beats: [
    { dur: 1.0, hold: 0.2, theta: 0.12, zoom: 0.92, focus: [0, 1, 0], set: { final: 0 }, labels: ['Final drill'] },
    { dur: 2.0, hold: 0.8, zoom: 0.85, focus: [0, -4, 0], set: { final: D, bed2: D }, key: true },
    { dur: 0.9, hold: 0.2, set: { final: -20 }, labels: [] }] },
  { label: 'Implant', caption: `Implant threaded in, ${clearance.toFixed(1)} mm above the canal.`, beats: [
    { dur: 0.8, hold: 0.1, theta: 0, set: { implant: 0.05 }, labels: ['Implant'] },
    { dur: 2.8, hold: 0.4, set: { implant: 1 }, labels: ['Implant'] },
    { dur: 1.6, hold: 1.6, zoom: 0.86, focus: [0, -6, 0], theta: 0.18, phi: 1.4, labels: ['Implant', 'Inferior alveolar canal'], key: true }] },
  { label: 'Healing', caption: 'Healing abutment: 3–6 months to integrate.', beats: [
    { dur: 1.6, hold: 0.2, zoom: 0.85, focus: [0, -2, 0], theta: 0.25, phi: 1.3, labels: [] },
    { dur: 1.2, hold: 1.8, set: { heal: 1 }, labels: ['Healing abutment'], key: true }] },
  { label: 'Crown', caption: 'Abutment and crown restore the tooth.', beats: [
    { dur: 0.6, hold: 0.1, set: { heal: 0 }, labels: [] },
    { dur: 1.8, hold: 0.4, set: { crown: 1 }, labels: ['Abutment', 'Crown'] },
    { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.5, phi: 1.2, labels: ['Crown', 'Implant'], key: true }] }
]);
fig.start();
