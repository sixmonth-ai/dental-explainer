// Procedure: how an implant fuses to the bone (osseointegration), an implant replacing the mandibular left first molar (FDI 36 = Universal 19) seen in a mesio-distal cut, with a push-in on the threads where the bone meets the implant. Frame: +x = mesial, +z = buccal, y up, neighbour CEJs at y = 0, mm; camera on the buccal side (mesial on the viewer's right).
// poster: step 4
// The bed is drilled a touch wider than the implant core, so the threads bite into the bone and small spaces stay between them.
// Over time those spaces fill: blood clot first, then new bone that grows onto the implant surface and out to the old bone, until
// the implant is locked in (3 to 6 months before conventional loading, dental-facts.md §7). The clot-then-new-bone sequence is
// standard healing biology (qualitative, no numbers), shown schematically: the spaces are drawn as one ring around the core.
const CREST = -1.8;
const IMPLANT = { diameter: 4.1, length: 10, threadDepth: 0.5 };
const R = IMPLANT.diameter / 2, CORE = R - IMPLANT.threadDepth, BED = CORE + 0.3;   // bed radius between the core and the thread tips
const CANAL_Y = CREST - IMPLANT.length - 4.0, CANAL_R = 1.5;

const fig = DK.figure({
  fov: 26,
  title: 'How an implant fuses to bone',
  subtitle: 'Lower left first molar site, FDI 36 (Universal 19).',
  view: { theta: 0, phi: 1.45 }
});

// --- context: bone, canal, gingiva, neighbours (as in the implant-placement example)
const bone = DK.bone({ width: 34, height: 19, depth: 11, cortical: 1.2, crest: 1.6 });
bone.position.set(-1, CREST, 0);
const canal = new THREE.Group();
const path = [[-18, CANAL_Y - 0.6, 0.4], [-6, CANAL_Y, 0.2], [6, CANAL_Y + 0.3, 0], [16, CANAL_Y + 0.9, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.75, DK.mat('nerve'), { caps: false });
canal.add(lumen, nerve);
const gum = DK.gingiva({ width: 34, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: 1 + 5.5 + 3.5, z: 0, md: 5, bl: 7, rise: 0.8 }, { x: 1 - 5.5 - 5.25, z: 0, md: 8, bl: 9, rise: 0.8 }, { x: 1, z: 0, md: 5.0, bl: 5.0, rise: 0.6 }] });
gum.position.set(-1, 1.1, 0);
const t35 = DK.tooth(35); t35.group.position.x = 5.5 + 3.5;
const t37 = DK.tooth(37); t37.group.position.x = -(5.5 + 5.25);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone: a dense cortical shell over spongy (cancellous) bone.' });
fig.part(canal, { name: 'Nerve canal', label: false, fit: false, info: 'The inferior alveolar canal, kept at a safe distance below the implant.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum heals around the healing cap.' });
fig.part(t35.group, { name: '35', label: false, fit: false, info: 'Lower left second premolar (Universal 20).' });
fig.part(t37.group, { name: '37', label: false, fit: false, info: 'Lower left second molar (Universal 18).' });

// --- the implant (a regular part: the camera frames the site), healing cap, abutment and crown
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, threadDepth: IMPLANT.threadDepth, connection: 'internal hex' });
implant.position.y = CREST;
const frame = new THREE.Mesh(new THREE.BoxGeometry(16, 21, 10), new THREE.MeshBasicMaterial({ visible: false })); frame.position.set(0, -2.2, 0);
fig.part(frame, { name: 'frame', label: false });   // what the camera frames: crown to apex, a little of each neighbour
fig.part(implant, { fit: false, name: 'Implant', sub: `Ø${IMPLANT.diameter} × ${IMPLANT.length} mm`, anchor: [-R, -6.5, 0], labelOffset: [-90, 10], dim: false, info: 'A titanium screw in the jaw bone. On the day it goes in, it is held only by the threads biting into the bone.' });
const heal = DK.lathe([[0, 0], [2.05, 0], [2.3, 2.2], [2.3, 3.4], [2.0, 3.6], [0, 3.6]], 48, DK.mat('titanium'));
const abut = DK.abutment({ platform: IMPLANT.diameter, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 });
const crown = DK.restorationCrown(36, 'zirconia', { hollow: false });
[heal, abut, crown].forEach(o => fig.world.add(o));
fig.part(heal, { inPlace: true, name: 'Healing cap', anchor: [2.3, 2.4, 0], labelOffset: [80, -20], dim: false, info: 'Shapes the gum while the bone heals. The implant is not chewed on yet.' });
fig.part(crown, { inPlace: true, name: 'Crown', anchor: [-3, 6.5, 3], dim: false, info: 'Once the implant is fused to the bone, an abutment and a crown go on and it can take chewing forces.' });

// --- the spaces between the threads and what fills them (cut-only cylinders around the implant axis)
// one lathe profile for all three: the bed follows the implant, a constant gap outside the core, tapering in at the apex
const DEP = IMPLANT.length - 0.3, APX = IMPLANT.length * 0.24;
const bedProfile = [[0, -DEP], [CORE * 0.45 + 0.3, -DEP], [BED * 0.88, -DEP + APX * 0.6], [BED, -DEP + APX], [BED, 0], [0, 0]];
const ring = (color, kind) => { const m = DK.lathe(bedProfile.map(p => [p[0] / BED, p[1]]), 48, DK.mat('pdl', { color, cap: color })); m.position.y = CREST - 0.15; m.userData.cutOnly = true; fig.world.add(m); return m; };
const space = ring(fig.dark ? DK.holeCap(fig) : 0x4f4840), clot = ring(0x7a3c37), newBone = ring(0xd4bb8c);
space.scale.set(BED, 1, BED);
const sizeRing = (m, r, k) => { m.visible = k > 0.01; m.scale.set(Math.max(r, 0.01), Math.max(k, 0.01), Math.max(r, 0.01)); m.position.y = CREST - 0.15; };
fig.part(space, { inPlace: true, name: 'Spaces', sub: 'between the threads', anchor: [-1, -4.35, 0], labelOffset: [-110, -30], dim: false, when: () => st.clot < 0.3,
  info: 'The bed is drilled slightly wider than the core of the implant, so the threads cut into the bone and small spaces stay between them.' });
fig.part(clot, { inPlace: true, name: 'Blood clot', anchor: [-1, -4.35, 0], labelOffset: [-110, -30], dim: false, when: () => st.clot > 0.5 && st.bone < 0.5,
  info: 'Blood fills the spaces within minutes and clots: the scaffold that the bone-forming cells move into.' });
fig.part(newBone, { inPlace: true, name: 'New bone', sub: 'grows onto the implant', anchor: [-1, -4.35, 0], labelOffset: [-110, -30], accent: true, dim: false, when: () => st.bone > 0.1,
  info: 'Bone-forming cells lay new bone straight onto the roughened titanium surface and out to the old bone. When the spaces are filled the implant is locked in: osseointegration.' });

// --- params
const st = { clot: 0, bone: 0 };
fig.param('clot', 0, k => { st.clot = k; sizeRing(clot, BED, Math.min(1, k)); });
fig.param('bone', 0, k => { st.bone = k; sizeRing(newBone, DK.util.lerp(CORE - 0.05, BED, k), Math.min(1, k * 4)); });
fig.param('heal', 1, k => { heal.visible = k > 0.001; heal.position.y = CREST + (1 - k) * 8; });
fig.param('crown', 0, k => { abut.visible = crown.visible = k > 0.001; abut.position.y = CREST + (1 - k) * 10; crown.position.y = 0.2 + (1 - k) * 18; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [space], color: fig.dark ? DK.holeCap(fig) : 0x4f4840, kind: 'plain' },
  { objects: [clot], color: 0x7a3c37, kind: 'plain' },
  { objects: [newBone], color: 0xd4bb8c, kind: 'cortical' },
  { objects: [implant.children[0]], color: 0x9aa0a6, kind: 'metal' },
  { objects: [t35.layers.enamel, t37.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t35.layers.root, t35.layers.dentin, t37.layers.root, t37.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t35.layers.pulp, t37.layers.pulp], color: DK.COLORS.pulpCap }
]);
implant.children.slice(1).forEach(m => { m.material.clippingPlanes = [fig.section.plane]; });
implant.children[2].visible = false;   // the internal well: its clipped edge drew a stray line down the cut
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
fig.view('Threads', { section: true, offset: 0, theta: 0.1, phi: 1.5, zoom: 0.4, focus: [0, CREST - 4.2, 0], fov: 26 });

// --- the procedure: whole site → push in on the threads → the spaces fill over time → back out for the crown
const ZF = window.innerWidth < window.innerHeight ? 1.45 : 1;   // portrait phone stage: pull back on the wide shots
const CLOSE = { theta: 0.1, phi: 1.5, zoom: 0.5, focus: [0, CREST - 5.4, 0] };
fig.procedure([
  { label: 'Implant placed', caption: 'On the day it goes in, the implant is held only by its threads.', beats: [
    { fov: 32, dur: 0, hold: 1.0, theta: 0.6, phi: 1.25, zoom: 1.05 * ZF, section: false, labels: [] },
    { fov: 26, dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 1.0, theta: 0, phi: 1.45, zoom: ZF, offset: 0, labels: ['Implant', 'Healing cap'] },
    { dur: 2.4, hold: 1.8, ...CLOSE, labels: ['Implant', 'Spaces'], key: true }] },
  { label: 'First days', caption: 'Blood fills the spaces and clots.', beats: [
    { dur: 2.0, hold: 2.0, theta: 0.06, set: { clot: 1 }, labels: ['Blood clot', 'Implant'], key: true }] },
  { label: 'First weeks', caption: 'New bone starts to grow onto the implant surface.', beats: [
    { dur: 2.6, hold: 2.0, theta: 0.12, set: { bone: 0.6 }, labels: ['New bone', 'Implant'], key: true }] },
  { label: '3 to 6 months', caption: 'The spaces fill with bone and the implant is locked in.', beats: [
    { dur: 2.6, hold: 0.6, theta: 0.08, set: { bone: 1 }, labels: ['New bone', 'Implant'] },
    { dur: 1.6, hold: 2.0, zoom: 0.62 * ZF, focus: [0, CREST - 4.6, 0], labels: ['New bone', 'Implant'], key: true }] },
  { label: 'Crown', caption: 'Now it can carry a crown and chewing forces.', beats: [
    { dur: 2.0, hold: 0.2, theta: 0.3, phi: 1.35, zoom: ZF, focus: 'auto', set: { heal: 0 }, labels: [] },
    { dur: 1.8, hold: 2.4, set: { crown: 1 }, labels: ['Crown', 'Implant'], key: true }] }
]);
fig.start();
