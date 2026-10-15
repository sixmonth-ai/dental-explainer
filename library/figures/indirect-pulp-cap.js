// Deep filling near the nerve (indirect pulp capping, selective caries removal) on the mandibular right first molar (FDI 46 = Universal 30), crown up in its socket; frame: +x mesial, +z buccal, CEJ at y = 0, procedure in a mesio-distal cut through the central pit.
// poster: step 6
// A deep occlusal lesion (inner third of dentin, reactionary dentin on the pulp wall). The edges are cut to hard dentin;
// over the pulp the soft decay is lifted out but a thin layer of demineralised dentin is deliberately left (ICCC 2016:
// selective removal in deep lesions, non-selective removal no longer advocated), lined with glass ionomer (optional,
// weak recommendation), and sealed under composite placed in <= 2 mm increments. dental-facts.md §16.
const FDI = 46;
const fig = DK.figure({
  fov: 26,
  title: 'Deep filling near the nerve',
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

// --- a deep pit-and-fissure lesion into the inner third of dentin
const STAGE = 4.3;
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0], size: 1.05, stage: STAGE, reactionary: true });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);
const DEJY = A.origin[1] - A.dej;   // y of the DEJ on the lesion axis

// --- the cavity in two parts: the outline, just into dentin, with its edges on hard dentin; then the excavation over
// the pulp, which stops where the soft decay ends (the demineralised dentin below it stays)
const PREP = { class: 1, length: s.md * 0.42, floorY: DEJY - A.dentin * 0.18 };
const DIG = { class: 1, length: SZ * 2.3, isthmus: SZ * 1.6, floorY: DEJY - A.dentin * 0.56 };
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const dig = DK.cavityPrep(tooth, DIG); tooth.group.add(dig);
const D = prep.dims, G = dig.dims, TOPF = s.crownL + 1.5, LINER = 0.5;
const liner = DK.filling(tooth, DIG, 'gic'); liner.slice(-1e9, G.floorY + LINER); liner.position.y = 0.02; tooth.group.add(liner);
const MID = (D.floorY + s.crownL - 0.6) / 2;
const SHADES = [DK.COLORS.compositeCap, DK.COLORS.compositeLight];
// two increments, each the union of the excavation and the outline sliced to its own height range
const INC = [[G.floorY + LINER, MID], [MID, TOPF]];
const comp = (opts, c) => { const f = DK.filling(tooth, opts, 'composite'); f.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = DK.color(c); } }); f.position.y = 0.06; tooth.group.add(f); return f; };
const fills = SHADES.map(c => [comp(PREP, c), comp(DIG, c)]);
const left = A.origin[1] - A.pulp;   // pulp roof on the axis
const leftMm = Math.max(0, G.floorY - left);

const cutOn = (e, sec) => sec.enabled;
fig.part(M.infected, { inPlace: true, name: 'Deep decay', sub: 'close to the pulp', anchor: () => at(A.enamel + A.dentin * 0.3, SZ * 0.8, 0), dim: false, info: 'A deep lesion in the inner third of the dentin. Digging out every bit of stained dentin here would open the pulp.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-s.md / 2 + 1.0, s.crownL - 1.6, 0], info: 'Enamel, about 2 mm thick over the cusps.', when: cutOn });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', sub: 'the nerve', anchor: [1.6, 1.4, 0], dim: false, info: 'Nerves and blood vessels. Kept closed, it stays alive and can lay down new dentin under the filling.', when: cutOn });
fig.part(prep, { inPlace: true, name: 'Edges', sub: 'cleaned to hard dentin', anchor: [D.center[0] - D.length / 2 + 0.15, (D.floorY + s.crownL) / 2, 0], dim: false, info: 'Around the edges every bit of decay is removed down to hard, sound dentin, so the filling seals tight.' });
fig.part(M.affected, { inPlace: true, name: 'Thin layer left', sub: 'shields the nerve', anchor: () => [G.center[0] + 0.3, G.floorY - leftMm * 0.4, 0], accent: true, dim: false, info: `Over the pulp the softened dentin is deliberately left (about ${DK.mm(leftMm)} here) and sealed in. Cut off from food, the bacteria left behind stop, and the pulp is not exposed (selective removal, ICCC 2016).` });
fig.part(liner, { inPlace: true, name: 'Liner', sub: 'glass ionomer', anchor: [G.center[0] - G.length / 2 + 0.4, G.floorY + LINER * 0.5, 0], dim: false, info: 'A thin glass-ionomer layer over the deepest part. Optional: it may protect the thin dentin from the filling resin (a weak recommendation).' });
fig.part(fills[0][0], { inPlace: true, name: 'Composite', sub: 'bonded, in layers', anchor: [D.center[0] - 1.0, (MID + TOPF) / 2 - 0.6, 0], dim: false, info: 'A bonded composite placed in layers of 2 mm or less, each light-cured, seals the cavity.' });

// --- tools (fig.world, parked out of view)
const fissureBur = DK.bur({ shape: 'flat', diameter: 1.0, head: 4.0 }), roundBur = DK.bur({ shape: 'round', diameter: 1.6, head: 1.6, length: 14 });
const light = DK.curingLight({ tip: 4 });
const steel = DK.mat('steel', {});
const tip = new THREE.Group();   // a fine applicator tip for the liner
tip.add(DK.tube([[0, 0, 0], [0, 1.6, 0.2], [0, 3.2, 1.2], [0, 4.8, 3.2], [0, 6.0, 6.5]], 0.32, steel, { caps: true }));
const hub = DK.lathe([[0.45, 0], [0.9, 1.5], [1.1, 9], [0, 9.2]], 24, DK.mat(0xd9d3c8, { roughness: 0.5 })); hub.position.set(0, 6.0, 6.5); hub.rotation.x = Math.PI / 2 - 0.25; tip.add(hub);
[fissureBur, roundBur, light, tip].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(fissureBur, { inPlace: true, name: 'Bur', sub: 'high speed', anchor: [0, 5, 0], info: 'Opens the cavity and cleans the edges back to hard dentin.' });
fig.part(roundBur, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 3, 0], info: 'A round bur at slow speed (or a hand excavator) lifts out the soft decay, stopping before the pulp.' });
fig.part(tip, { inPlace: true, name: 'Liner tip', anchor: [0, 3.2, 1.2], info: 'The liner is flowed onto the floor over the pulp.' });
fig.part(light, { inPlace: true, name: 'Curing light', sub: 'each layer', anchor: [0, 6, 0], info: 'Blue LED light sets each layer in seconds.' });

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
fig.param('removed', 0, k => lesion.set(STAGE, { removed: k }));
fig.param('liner', 0, k => { liner.visible = k > 0.01; if (liner.visible) liner.slice(-1e9, G.floorY + LINER * k); });
fig.param('fill', 0, k => {   // 0..1 over the two increments; the voids hide once the last one is flush
  fills.forEach((pair, i) => { const ki = Math.min(1, Math.max(0, k * 2 - i)), [a, b2] = INC[i]; pair.forEach(f => { f.visible = ki > 0.001; if (f.visible) f.slice(i ? a : -1e9, a + (b2 - a) * ki); }); });
  prep.visible = dig.visible = k < 0.99;
});
const tl = { tx: 0, ty: 40, ly: 40, cure: 0 };
const placeTools = () => {
  tip.visible = tl.ty < 30; tip.position.set(tl.tx, tl.ty, 0.3);
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
  { objects: [M.reactionary], color: DK.COLORS.reactionary, kind: 'dentin' },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [prep, dig], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [liner], color: DK.COLORS.gic, kind: 'plain' },
  ...fills.map((pair, i) => ({ objects: pair, color: SHADES[i], kind: 'plain' }))
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });

// --- the procedure (camera on +z looks at the cut face: mesial on the viewer's right)
const TOP = s.crownL, fx = D.center[0], FC = [fx, TOP - 2.4, 0], park = { by: 40 };
fig.procedure([
  { label: 'Deep decay', caption: 'The decay has reached deep into the dentin, close to the nerve.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 0.95, zoom: 1.0, section: false, labels: [] },
    { fov: 26, dur: 2.2, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1.0, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, offset: 0, labels: ['Enamel', 'Pulp'] },
    { dur: 1.8, hold: 1.8, zoom: 0.62, focus: FC, labels: ['Deep decay', 'Pulp'], key: true }] },
  { label: 'Clean the edges', caption: 'The bur opens the cavity and cleans its edges back to hard dentin.', beats: [
    { dur: 1.0, hold: 0.1, set: { which: 0, bx: fx - D.length / 2 + 0.6, by: TOP + 1.2, bz: 0 }, labels: ['Bur'] },
    { dur: 0.5, hold: 0, set: { onStep: 1 }, labels: ['Bur'] },
    { dur: 2.8, hold: 0.2, set: { step: 1 }, ease: 'linear', labels: ['Bur'] },
    { dur: 0.8, hold: 1.4, set: { onStep: 0, by: 40 }, labels: ['Edges', 'Deep decay'], key: true }] },
  { label: 'Leave a thin layer', caption: 'Over the nerve, the soft decay comes out but a thin layer is left on purpose.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.52, focus: [fx, G.floorY + 0.8, 0], set: { which: 1, bx: fx + 0.5, by: D.floorY + 3.5, bz: 0.4 }, labels: ['Round bur'] },
    { dur: 0.6, hold: 0, set: { by: D.floorY + 0.7 }, labels: ['Round bur'] },
    { dur: 2.2, hold: 0.2, ease: 'linear', set: { dig: 1, removed: 1, bx: fx - 0.3, by: G.floorY + 0.8 }, labels: ['Round bur'] },
    { dur: 0.8, hold: 2.0, set: park, labels: ['Thin layer left', 'Pulp'], key: true }] },
  { label: 'Line the floor', caption: 'A thin liner covers the deepest part.', beats: [
    { dur: 0.9, hold: 0.1, set: { tx: G.center[0] + 0.8, ty: G.floorY + 0.7 }, labels: ['Liner tip'] },
    { dur: 1.6, hold: 0.2, set: { liner: 1, tx: G.center[0] - 0.8 }, labels: ['Liner tip'] },
    { dur: 0.8, hold: 1.4, set: { ty: 40 }, labels: ['Liner', 'Thin layer left'], key: true }] },
  { label: 'Fill in layers', caption: 'Bonded composite in layers, each light-cured.', beats: [
    { dur: 1.2, hold: 0.1, zoom: 0.66, focus: [fx, TOP - 1.4, 0], set: { fill: 0.5 }, labels: ['Composite'] },
    { dur: 0.6, hold: 0, set: { ly: TOP + 2.4 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0.7, set: { cure: 1 }, labels: ['Composite', 'Curing light'] },
    { dur: 0.25, hold: 0, set: { cure: 0 } },
    { dur: 1.2, hold: 0.1, set: { fill: 1, ly: TOP + 5 }, labels: ['Composite'] },
    { dur: 0.4, hold: 0, set: { ly: TOP + 2.4 } },
    { dur: 0.25, hold: 0.9, set: { cure: 1 }, labels: ['Composite', 'Curing light'], key: true },
    { dur: 0.3, hold: 0, set: { cure: 0 } },
    { dur: 0.8, hold: 0.3, set: { ly: 40 }, labels: ['Composite'] }] },
  { label: 'Sealed, nerve intact', caption: 'Sealed in, the decay left behind stops; the nerve stays closed and alive.', beats: [
    { dur: 2.2, hold: 2.4, theta: 0.08, phi: 1.4, zoom: 0.6, focus: [fx, TOP - 2.6, 0], labels: ['Composite', 'Liner', 'Thin layer left', 'Pulp'], key: true }] }
]);
fig.start();
