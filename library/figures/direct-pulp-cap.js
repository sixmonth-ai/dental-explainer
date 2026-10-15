// Direct pulp cap on the mandibular right first molar (FDI 46 = Universal 30), crown up in its socket; frame: +x mesial, +z buccal, CEJ at y = 0; procedure in a mesio-distal cut through the central pit.
// poster: step 4
// A deep occlusal lesion is cleaned out and leaves a small, clean opening into the pulp roof. The opening is covered with a
// calcium-silicate cement (MTA or similar), the cavity is sealed with bonded composite in <= 2 mm increments (dental-facts.md
// §16), and over the following weeks the pulp lays down a bridge of new hard tissue under the cap. Exposure and cap sizes are
// drawn schematically (no numbers in the facts file).
const FDI = 46;
const fig = DK.figure({
  fov: 26,
  title: 'Direct pulp cap',
  subtitle: 'Lower right first molar, FDI 46 (Universal 30), cut front to back.',
  view: { theta: 0.5, phi: 1.0 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 16, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 46', label: false, info: 'Lower right first molar: five cusps, two roots, a large pulp chamber under the cusps.' });

// --- a deep pit-and-fissure lesion reaching close to the pulp roof
const STAGE = 4.5;
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], size: 1.1, stage: STAGE, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);
const DEJY = A.origin[1] - A.dej, CX = A.origin[0], CZ = A.origin[2];
// pulp roof under the lesion, measured: the exposure opens at the highest point (a pulp horn side) within reach
tooth.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster();
const roofAt = (x, z) => { rc.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(L.pulp, true).filter(i => !i.object.userData.isStencil); return h.length ? h[0].point.y : -1e9; };
const ROOF0 = A.origin[1] - A.pulp, ROOF = Math.max(ROOF0, roofAt(CX - 0.3, CZ), roofAt(CX + 0.3, CZ));
let roofMax = ROOF; for (let x = CX - 1.2; x <= CX + 1.2; x += 0.1) roofMax = Math.max(roofMax, roofAt(x, CZ));   // in the cut plane, under the cavity floor

// --- the cavity: the outline just into dentin, then the excavation down to a thin floor over the pulp roof
const PREP = { class: 1, length: s.md * 0.44, floorY: DEJY - A.dentin * 0.18 };
const FLOOR = Math.max(ROOF + 0.7, roofMax + 0.35);
const DIG = { class: 1, length: SZ * 2.2, isthmus: SZ * 1.4, floorY: FLOOR };
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const dig = DK.cavityPrep(tooth, DIG); tooth.group.add(dig);
const D = prep.dims, G = dig.dims, TOPF = s.crownL + 1.5;
// the exposure: a small round opening through the last dentin into the pulp roof
const EXR = 0.5;
const expo = DK.asHole(DK.lathe([[0, ROOF - 0.05], [EXR * 0.8, ROOF - 0.05], [EXR, ROOF + 0.15], [EXR, FLOOR + 0.03], [0, FLOOR + 0.03]], 32, DK.mat('cavity', {})));
expo.position.set(CX, 0, CZ); tooth.group.add(expo);

// --- the cap: calcium-silicate cement plugging the opening and covering the floor around it
const CAP_C = 0xe9e6dc, CAP_CAP = 0xdedbd0, CAPH = 0.9;
const capMat = DK.mat('gic', { color: CAP_C, cap: CAP_CAP, roughness: 0.75 });
const plug = DK.lathe([[0, ROOF - 0.04], [EXR * 0.8 - 0.01, ROOF - 0.04], [EXR - 0.01, ROOF + 0.15], [EXR - 0.01, FLOOR + 0.2], [0, FLOOR + 0.2]], 32, capMat);
plug.position.set(CX, 0, CZ);
const layer = DK.filling(tooth, DIG, 'gic'); layer.traverse(m => { if (m.isMesh) m.material = capMat; });
const cap = new THREE.Group(); cap.add(plug, layer); cap.position.y = 0.02; tooth.group.add(DK.inFront(cap));
const setCap = k => { cap.visible = k > 0.01; plug.visible = k > 0.01; if (cap.visible) layer.slice(-1e9, FLOOR + CAPH * Math.min(1, Math.max(0.05, k))); };

// --- the dentin bridge: new hard tissue that forms under the cap
const bridge = DK.lathe([[0, ROOF - 0.75], [0.55, ROOF - 0.62], [0.9, ROOF - 0.35], [0.95, ROOF - 0.08], [0, ROOF - 0.02]], 32, DK.mat('reactionary', {}));
bridge.position.set(CX, 0, CZ); tooth.group.add(bridge);
const setBridge = k => { bridge.visible = k > 0.02; bridge.scale.set(Math.max(0.05, k), Math.max(0.05, k), Math.max(0.05, k)); bridge.position.y = ROOF * (1 - Math.max(0.05, k)); };

// --- composite in two increments above the cap
const MIDY = (FLOOR + CAPH + s.crownL - 0.6) / 2;
const SHADES = [DK.COLORS.compositeCap, DK.COLORS.compositeLight];
const INC = [[FLOOR + CAPH, MIDY], [MIDY, TOPF]];
const comp = (opts, c) => { const f = DK.filling(tooth, opts, 'composite'); f.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = DK.color(c); } }); f.position.y = 0.06; tooth.group.add(f); return f; };
const fills = SHADES.map(c => [comp(PREP, c), comp(DIG, c)]);

const cutOn = (e, sec) => sec.enabled;
fig.part(M.infected, { inPlace: true, name: 'Deep decay', sub: 'close to the pulp', anchor: () => at(A.enamel + A.dentin * 0.3, SZ * 0.8, 0), dim: false, info: 'Decay deep in the dentin, just above the pulp chamber.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', sub: 'the nerve, still healthy', anchor: [CX + 2.0, ROOF - 1.2, 0], dim: false, when: cutOn, info: 'Nerves and blood vessels. A pulp that is healthy or only mildly inflamed can heal if a small opening is sealed quickly.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-s.md / 2 + 1.0, s.crownL - 1.6, 0], info: 'Enamel, about 2 mm thick over the cusps.', when: cutOn });
fig.part(expo, { inPlace: true, name: 'Small exposure', sub: 'clean, pulp bleeds lightly', anchor: () => [CX + EXR + 0.2, (ROOF + FLOOR) / 2, 0], dim: false, when: () => expo.visible && ex.k > 0.5 && cap.visible === false, info: 'Removing the last decay opens a pinpoint into the pulp. Under a rubber dam the bleeding is rinsed and stopped before anything is placed.' });
fig.part(cap, { inPlace: true, name: 'Calcium silicate cap', sub: 'MTA or similar', anchor: () => [CX - 0.6, FLOOR + 0.45, 0], accent: true, dim: false, when: () => cap.visible, info: 'A calcium-silicate cement (MTA, or a similar material) is placed directly on the opening. It seals, is well tolerated by the pulp, and encourages it to wall off the opening with new hard tissue.' });
fig.part(fills[0][0], { inPlace: true, name: 'Composite', sub: 'bonded, in layers', anchor: [D.center[0] - 1.0, (MIDY + TOPF) / 2 - 0.6, 0], dim: false, when: () => fills[0][0].visible, info: 'A bonded filling placed in layers of 2 mm or less, each light-cured, seals the cap from the mouth. The seal decides whether the pulp heals.' });
fig.part(bridge, { inPlace: true, name: 'Dentin bridge', sub: 'forms over weeks', anchor: () => [CX + 0.95, ROOF - 0.4, 0], dim: false, when: () => bridge.visible && br.k > 0.6, info: 'Over the following weeks to months, pulp cells lay down a bridge of hard tissue under the cap. The tooth is checked for vitality and on X-rays afterwards.' });

// --- tools (fig.world, parked out of view)
const fissureBur = DK.bur({ shape: 'flat', diameter: 1.0, head: 4.0 }), roundBur = DK.bur({ shape: 'round', diameter: 1.6, head: 1.6, length: 14 });
const light = DK.curingLight({ tip: 4 });
const steel = DK.mat('steel', {});
const carrier = new THREE.Group();   // a small carrier that places the cement
carrier.add(DK.tube([[0, 0, 0], [0, 1.6, 0.2], [0, 3.2, 1.2], [0, 4.8, 3.2], [0, 6.0, 6.5]], 0.38, steel, { caps: true }));
const hub = DK.lathe([[0.45, 0], [0.9, 1.5], [1.1, 9], [0, 9.2]], 24, DK.mat(0xd9d3c8, { roughness: 0.5 })); hub.position.set(0, 6.0, 6.5); hub.rotation.x = Math.PI / 2 - 0.25; carrier.add(hub);
[fissureBur, roundBur, light, carrier].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(fissureBur, { inPlace: true, name: 'Bur', sub: 'high speed', anchor: [0, 5, 0], info: 'Opens the cavity.' });
fig.part(roundBur, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 3, 0], info: 'A round bur at slow speed (or a hand excavator) lifts out the soft decay.' });
fig.part(carrier, { inPlace: true, name: 'Carrier', anchor: [0, 3.2, 1.2], info: 'The cement is carried in and patted gently onto the opening, without pressing it into the pulp.' });
fig.part(light, { inPlace: true, name: 'Curing light', anchor: [0, 6, 0], info: 'Blue LED light sets each layer of composite.' });

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
fig.param('dig', 0, k => { dig.set(k, 0); placeBur(); });
fig.param('removed', 0, k => { lesion.set(STAGE, { removed: Math.min(1, k * 1.5) }); M.affected.visible = k < 0.95; });
const ex = { k: 0 }, br = { k: 0 };
fig.param('expo', 0, k => { ex.k = k; expo.visible = k > 0.02; expo.scale.set(Math.max(0.05, k), 1, Math.max(0.05, k)); });
fig.param('cap', 0, k => setCap(k));
fig.param('fill', 0, k => {
  fills.forEach((pair, i) => { const ki = Math.min(1, Math.max(0, k * 2 - i)), [a, b2] = INC[i]; pair.forEach(f => { f.visible = ki > 0.001; if (f.visible) f.slice(a, a + (b2 - a) * ki); }); });
  prep.visible = dig.visible = k < 0.99;
});
fig.param('bridge', 0, k => { br.k = k; setBridge(k); });
const tl = { tx: 0, ty: 40, ly: 40, cure: 0 };
const placeTools = () => {
  carrier.visible = tl.ty < 30; carrier.position.set(tl.tx, tl.ty, 0.3);
  light.visible = tl.ly < 30; light.position.set(D.center[0], tl.ly, 0.4); light.set(tl.cure);
};
Object.keys(tl).forEach(k => fig.param(k, tl[k], v => { tl[k] = v; placeTools(); }));
setCap(0); setBridge(0); expo.visible = false;

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [bridge], color: DK.COLORS.reactionary, kind: 'dentin' },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [prep, dig, expo], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [layer, plug], color: CAP_CAP, kind: 'plain' },
  ...fills.map((pair, i) => ({ objects: pair, color: SHADES[i], kind: 'plain' }))
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });

// --- the procedure (camera on +z looks at the cut face: mesial on the viewer's right)
const TOP = s.crownL, fx = D.center[0], FC = [fx, TOP - 2.4, 0], PULPF = [CX, (ROOF + FLOOR) / 2 + 0.6, 0], park = { by: 40 };
fig.procedure([
  { label: 'Deep decay', caption: 'The decay has reached deep into the dentin, right above the nerve.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 0.95, zoom: 1.0, section: false, labels: [] },
    { fov: 26, dur: 2.2, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1.0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, offset: 0, labels: ['Enamel', 'Pulp'] },
    { dur: 1.8, hold: 1.8, zoom: 0.62, focus: FC, labels: ['Deep decay', 'Pulp'], key: true }] },
  { label: 'Clean out the decay', caption: 'The cavity is opened and the soft decay lifted out.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: fx - D.length / 2 + 0.6, by: TOP + 1.2, bz: 0 }, labels: ['Bur'] },
    { dur: 0.5, hold: 0, set: { onStep: 1 }, labels: ['Bur'] },
    { dur: 2.4, hold: 0.2, set: { step: 1 }, ease: 'linear', labels: ['Bur'] },
    { dur: 0.8, hold: 0.1, set: { onStep: 0, by: 40 }, labels: [] },
    { dur: 1.0, hold: 0.1, zoom: 0.52, focus: PULPF, set: { which: 1, bx: CX + 0.5, by: D.floorY + 3.5, bz: 0.4 }, labels: ['Round bur'] },
    { dur: 0.6, hold: 0, set: { by: D.floorY + 0.7 }, labels: ['Round bur'] },
    { dur: 2.2, hold: 0.6, ease: 'linear', set: { dig: 1, removed: 1, bx: CX - 0.2, by: FLOOR + 0.8 }, labels: ['Round bur', 'Pulp'], key: true }] },
  { label: 'Small exposure', caption: 'The last bit of decay leaves a pinpoint opening into the pulp. The bleeding is rinsed and stopped.', beats: [
    { dur: 0.8, hold: 0.1, set: { by: FLOOR + 0.35, bx: CX }, labels: ['Round bur'] },
    { dur: 0.8, hold: 0.1, set: { expo: 1 }, labels: ['Round bur'] },
    { dur: 0.8, hold: 2.0, zoom: 0.42, focus: [CX, ROOF + 0.4, 0], set: park, labels: ['Small exposure', 'Pulp'], key: true }] },
  { label: 'Calcium silicate cap', caption: 'A calcium silicate cement is placed right on the opening.', beats: [
    { dur: 0.9, hold: 0.1, zoom: 0.5, focus: PULPF, set: { tx: CX + 0.6, ty: FLOOR + 0.6 }, labels: ['Carrier'] },
    { dur: 1.8, hold: 0.2, set: { cap: 1, tx: CX - 0.6 }, labels: ['Carrier'] },
    { dur: 0.8, hold: 2.0, set: { ty: 40 }, labels: ['Calcium silicate cap', 'Pulp'], key: true }] },
  { label: 'Seal with composite', caption: 'Bonded composite in layers seals the cap in.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.8, focus: [fx, TOP - 2.4, 0], set: { fill: 0.5 }, labels: ['Composite'] },
    { dur: 0.6, hold: 0, set: { ly: TOP + 3.4 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0.6, set: { cure: 1 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0, set: { cure: 0 } },
    { dur: 1.2, hold: 0.1, set: { fill: 1, ly: TOP + 5 }, labels: ['Composite'] },
    { dur: 0.4, hold: 0, set: { ly: TOP + 3.4 } },
    { dur: 0.25, hold: 0.9, set: { cure: 1 }, labels: ['Composite', 'Curing light'], key: true },
    { dur: 0.3, hold: 0, set: { cure: 0 } },
    { dur: 0.8, hold: 0.3, set: { ly: 40 }, labels: ['Composite'] }] },
  { label: 'Dentin bridge', caption: 'Weeks later, the pulp has walled off the opening with new hard tissue.', beats: [
    { dur: 2.0, hold: 0.3, theta: 0.08, phi: 1.4, zoom: 0.55, focus: [CX, ROOF + 1.6, 0], labels: ['Calcium silicate cap', 'Pulp'] },
    { dur: 2.2, hold: 2.6, set: { bridge: 1 }, labels: ['Composite', 'Calcium silicate cap', 'Dentin bridge', 'Pulp'], key: true }] }
]);
fig.start();
