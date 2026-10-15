// Library: pulpotomy of the lower left second primary molar (FDI 75 = Universal K), crown up in its bone with the second premolar (35) forming between its roots; procedure in a mesio-distal cut through the mesiobuccal canal. Frame: tooth frame mirrored (scale.x = -1, a left tooth), CEJ at y = 0, +z buccal; seen from the cheek, mesial is on the viewer's left.
// poster: step 3
// Teaching point: in a baby molar with decay into the pulp, only the inflamed pulp in the crown is removed; the pulp in the
// roots stays alive under a medicated dressing and a seal. No clinical numbers are shown (none in dental-facts.md for this procedure).
const FDI = 75, MX = -1;                                  // MX: a left tooth is the mirror image of the kit's right-handed preset
const fig = DK.figure({
  fov: 26,
  title: 'Baby tooth pulpotomy',
  subtitle: 'Lower left second baby molar, FDI 75 (Universal K), cut front to back.',
  view: { theta: 0.5, phi: 1.2 }
});

// --- tooth, successor and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
tooth.group.scale.x = MX;
const CREST = -1.4;
const bone = DK.bone({ width: 19, height: 21, depth: 12, cortical: 1.1, crest: 1.4 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 19, height: 3.0, depth: 12.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.1;
const succ = DK.tooth(DK.toothPreset(35, { develop: 0.06 })), ss = succ.spec;
succ.group.scale.x = MX; succ.group.position.set(0.2 * MX, -7.4 - ss.crownL, 0.2);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone around the baby molar.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth.' });
fig.part(succ.group, { name: 'Adult premolar', sub: 'forming below', fit: false, anchor: [0, ss.crownL * 0.5, 0], dim: false,
  info: 'The second premolar (FDI 35) forms between the baby molar roots and replaces it at about 11 to 13 years. Keeping the baby molar keeps its space.' });
fig.part(tooth.group, { name: 'Baby molar', label: false, info: 'Lower left second primary molar: thin enamel and a large pulp with high horns, so deep decay reaches the nerve quickly.' });

// --- decay into the pulp
const lesion = DK.cariesLesion(tooth, { site: 'occlusal', at: [0, 0.25], size: 1.25, stage: 4.4, reactionary: false });
const M = lesion.meshes, A = lesion.axis;

// --- the pulp in two parts: the crown pulp (chamber, inflamed) and the root pulp (canals, healthy)
const chamber = L.pulp.userData.chamber, canalMeshes = Object.values(L.pulp.userData.canals || {});
chamber.material = chamber.material.clone();
const chamberGeo = chamber.geometry, chamberPos = chamber.position;
const yCh = (() => { chamberGeo.computeBoundingBox(); const b = chamberGeo.boundingBox; return { lo: b.min.y + chamberPos.y, hi: b.max.y + chamberPos.y }; })();
// a copy of the chamber clamped to a y range (tooth frame): still a closed solid, so it caps in section
const clampGeo = (lo, hi) => { const g = chamberGeo.clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Math.min(hi, Math.max(lo, p.getY(i) + chamberPos.y)) - chamberPos.y); p.needsUpdate = true; g.computeVertexNormals(); return g; };

// --- empty space, dressing and seal (same conventions as the root canal example)
const EMPTY = DK.voidColor(fig);
// the opening: the whole roof of the chamber comes off, so the cavity spans the chamber (a deep Class I outline whose floor
// meets the chamber); the filling uses the same outline and seats exactly
const PREP = { class: 1, center: [0, 0.15], length: s.md * 0.56, isthmus: s.bl * 0.46, floorY: yCh.lo + 1.4, taper: -0.12 };
const access = DK.cavityPrep(tooth, PREP); access.set(0, 0);
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const MTA_C = 0xcfd2cc, MTA_TOP = yCh.lo + 1.6;
const mta = new THREE.Mesh(clampGeo(-99, MTA_TOP), DK.mat('gic', { color: MTA_C, cap: MTA_C, roughness: 0.8 })); mta.position.copy(chamberPos);
const sealCh = new THREE.Mesh(clampGeo(MTA_TOP, 99), DK.mat('gic', { cap: DK.COLORS.gic })); sealCh.position.copy(chamberPos);
const seal = DK.filling(tooth, PREP, 'gic'); seal.position.y = 0.02;
const pellet = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), DK.mat('gic', { color: 0xf3f1ea, cap: 0xf3f1ea, roughness: 1 }));
pellet.scale.set(2.0, 1.1, 1.7);
[chamberRim, access, chamberVoid, mta, sealCh, seal, pellet].forEach(o => tooth.group.add(o));

// label anchors in the cut plane (tooth frame; the mirror is applied by the group)
const CUT = 1.15;                                                       // through the mesiobuccal canal of the mesial root
const mb = DK.canalAt(s, 'MB', -3.2);
const cutOn = (e, sec) => sec.enabled;
fig.part(M.infected, { inPlace: true, name: 'Deep decay', sub: 'into the pulp', anchor: () => lesion.point(A.enamel + A.dentin * 0.4, 0.9, 12), dim: false, when: () => M.infected.visible,
  info: 'Decay through the thin enamel and dentin of a baby molar has reached the pulp in the crown.' });
fig.part(chamber, { inPlace: true, name: 'Crown pulp', sub: 'inflamed', anchor: [-1.6, yCh.lo + 1.4, CUT], dim: false, when: (e, sec) => sec.enabled && chamber.visible,
  info: 'The pulp in the crown is inflamed where the decay reached it. This is the part a pulpotomy removes.' });
fig.part(canalMeshes[0] || L.pulp, { inPlace: true, name: 'Root pulp', sub: 'alive', accent: true, anchor: [mb.x, -3.2, CUT], dim: false, when: cutOn,
  info: 'The pulp in the roots is still healthy. It is left in place, alive, so the tooth keeps its blood supply until it falls out.' });
fig.part(mta, { inPlace: true, name: 'Medicine dressing', sub: 'e.g. MTA', anchor: [0.8, (yCh.lo + MTA_TOP) / 2 + 0.2, CUT], dim: false, when: () => mta.visible,
  info: 'A medicated dressing such as MTA (a calcium-silicate cement) is pressed over the pulp stumps at the canal openings; it seals them and lets the root pulp heal.' });
fig.part(seal, { inPlace: true, name: 'Seal', sub: 'filling, then a crown', anchor: [-0.6, s.crownL - 1.0, CUT], dim: false, when: () => seal.visible,
  info: 'A glass-ionomer filling seals the tooth; a baby molar treated this way usually gets a stainless steel crown so it lasts until it falls out.' });
fig.part(pellet, { inPlace: true, name: 'Cotton pellet', anchor: [0, 1, 0], dim: false, when: () => pellet.visible,
  info: 'Pressed on the stumps for a few minutes. If the bleeding stops, the root pulp is healthy enough to keep.' });

// --- tools (fig.world), placed from tooth-frame points
const W = (x, y, z) => [x * MX, y, z];
const bur = DK.bur({ shape: 'round', diameter: 1.4, head: 1.4, length: 14 });
const slow = DK.bur({ shape: 'round', diameter: 1.8, head: 1.8, length: 14 });
const pliers = new THREE.Group();                                       // cotton pliers: two tapered steel beaks
{ const steel = DK.mat('steel', {}); [-1, 1].forEach(k => { const b = DK.tube([[k * 0.35, 0, 0], [k * 0.5, 4, 0.4], [k * 0.9, 12, 2.4], [k * 1.2, 22, 6.0]], 0.38, steel, { caps: true, taper: t => 0.6 + 0.6 * t }); pliers.add(b); }); }
const carrier = new THREE.Group();                                      // dressing carrier: a short steel tube on a bent shank
{ const steel = DK.mat('steel', {}); carrier.add(DK.lathe([[0.95, 0], [1.05, 0.2], [1.05, 3.0], [0.6, 3.6], [0.45, 4.2], [0, 4.25]], 28, steel));
  carrier.add(DK.tube([[0, 4.0, 0], [0, 7, 0.6], [0, 11, 3.2], [0, 18, 7.5]], 0.45, steel, { caps: true })); }
[bur, slow, pliers, carrier].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(bur, { inPlace: true, name: 'Bur', sub: 'high speed', anchor: [0, 6, 0], info: 'Removes the decay and the roof of the pulp chamber, after the tooth is numbed.' });
fig.part(slow, { inPlace: true, name: 'Round bur', sub: 'slow speed', anchor: [0, 6, 0], info: 'A large round bur at slow speed (or a sharp spoon) takes out the pulp in the crown down to the canal openings.' });
fig.part(pliers, { inPlace: true, name: 'Cotton pliers', anchor: [0, 12, 2.4], info: 'Places a damp cotton pellet on the stumps.' });
fig.part(carrier, { inPlace: true, name: 'Carrier', anchor: [0, 3, 0], info: 'Carries the dressing into the chamber.' });

// --- params
const PULP = DK.color(DK.COLORS.pulp), INFL = DK.color(0xb2655f);
const st = { pulp: 1, access: 0, mta: 0, seal: 0 };
const sync = () => {
  const gone = st.pulp < 0.5;
  chamber.visible = !gone; chamberVoid.visible = gone && st.seal < 0.5; chamberRim.visible = gone;
  access.visible = st.access > 0.02 && st.seal < 0.5;
  mta.visible = st.mta > 0.02; sealCh.visible = seal.visible = st.seal > 0.5;
};
fig.param('inflame', 0, v => { chamber.material.color.copy(PULP).lerp(INFL, v); DK.capColor(fig.section, 8, v > 0.5 ? 0xa86a62 : DK.COLORS.pulpCap); });
fig.param('access', 0, k => { st.access = k; access.set(k, 0); Object.values(M).forEach(m => { if (m) m.visible = k < 0.9; }); sync(); });
fig.param('pulp', 1, v => { st.pulp = v; sync(); });
fig.param('mta', 0, k => { st.mta = k; if (k > 0.02) { mta.geometry.dispose(); mta.geometry = clampGeo(-99, yCh.lo + (MTA_TOP - yCh.lo) * k); } sync(); });
fig.param('seal', 0, v => { st.seal = v; sync(); });
const t = { by: 40, bx: 0, sy: 40, sx: 0, py: 40, cy: 40, pel: 0 };
const place = () => {
  bur.visible = t.by < 30; bur.position.set(...W(t.bx, t.by, CUT - 0.2)); bur.rotation.z = 0.2 * MX;
  slow.visible = t.sy < 30; slow.position.set(...W(t.sx, t.sy, CUT - 0.3)); slow.rotation.z = -0.15 * MX;
  pliers.visible = t.py < 30; pliers.position.set(...W(0.2, t.py, CUT - 0.6));
  carrier.visible = t.cy < 30; carrier.position.set(...W(-0.8, t.cy, CUT - 0.6));
  pellet.visible = t.pel > 0.5; pellet.position.set(0.2, (t.pel > 0.5 && t.py < 30) ? t.py - 1.0 : yCh.lo + 1.2, CUT - 0.6);
};
Object.keys(t).forEach(k => fig.param(k, t[k], v => { t[k] = v; place(); }));

const T = [tooth, succ];
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: T.map(x => x.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: T.flatMap(x => [x.layers.root, x.layers.dentin]), color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [...canalMeshes, succ.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [chamber], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [chamberRim], color: DK.RIM, kind: 'plain' },
  { objects: [chamberVoid], color: EMPTY, kind: 'plain' },
  { objects: [access], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [mta], color: MTA_C, kind: 'plain' },
  { objects: [seal, sealCh], color: DK.COLORS.gic, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });

// --- the procedure (camera on +z, the cheek side; mesial on the viewer's left)
const TOP = s.crownL, FC = [0, 2.2, CUT], FT = [0, -3.2, CUT];
fig.procedure([
  { label: 'Decay in the nerve', caption: 'Decay in a baby molar has reached the pulp in the crown.', beats: [
    { fov: 32, dur: 0, hold: 1.2, theta: 0.5, phi: 1.2, zoom: 1.0, section: false, labels: ['Adult premolar'] },
    { fov: 26, dur: 2.0, hold: 0.1, theta: 0.04, phi: 1.45, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 7 },
    { dur: 2.2, hold: 0.4, offset: CUT, labels: ['Root pulp'] },
    { dur: 1.8, hold: 1.8, zoom: 0.74, focus: FC, set: { inflame: 1 }, labels: ['Deep decay', 'Crown pulp'], key: true }] },
  { label: 'Open the chamber', caption: 'The decay and the roof of the pulp chamber are removed.', beats: [
    { dur: 1.0, hold: 0.1, set: { bx: 0.6, by: TOP + 1.6 }, labels: ['Bur'] },
    { dur: 2.4, hold: 0.2, ease: 'linear', set: { access: 1, bx: -0.6, by: yCh.hi - 0.4 }, labels: ['Bur'] },
    { dur: 0.8, hold: 1.4, set: { by: 40 }, labels: ['Crown pulp'], key: true }] },
  { label: 'Remove the crown pulp', caption: 'The pulp in the crown is taken out down to the canal openings.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.72, focus: [0, 1.4, CUT], set: { sx: 1.4, sy: yCh.hi }, labels: ['Round bur'] },
    { dur: 2.2, hold: 0.2, ease: 'linear', set: { sx: -1.4, sy: yCh.lo + 0.9, pulp: 0 }, labels: ['Round bur'] },
    { dur: 0.8, hold: 0.2, set: { sy: 40 }, labels: [] },
    { dur: 1.6, hold: 2.0, zoom: 0.95, focus: [0, -0.8, CUT], labels: ['Root pulp'], key: true }] },
  { label: 'Stop the bleeding', caption: 'A damp cotton pellet on the stumps; the bleeding stops if the root pulp is healthy.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.74, focus: [0, 1.6, CUT], set: { pel: 1, py: TOP + 4 }, labels: ['Cotton pliers'] },
    { dur: 1.4, hold: 0.2, set: { py: yCh.lo + 2.2 }, labels: ['Cotton pliers'] },
    { dur: 0.8, hold: 1.6, set: { py: 40 }, labels: ['Cotton pellet', 'Root pulp'], key: true },
    { dur: 0.6, hold: 0.1, set: { pel: 0 }, labels: [] }] },
  { label: 'Medicine on the stumps', caption: 'A medicated dressing covers the pulp stumps.', beats: [
    { dur: 0.9, hold: 0.1, set: { cy: TOP + 2 }, labels: ['Carrier'] },
    { dur: 0.8, hold: 0, set: { cy: MTA_TOP + 0.6 }, labels: ['Carrier'] },
    { dur: 1.8, hold: 0.2, set: { mta: 1 }, labels: ['Carrier'] },
    { dur: 0.8, hold: 1.6, set: { cy: 40 }, labels: ['Medicine dressing', 'Root pulp'], key: true }] },
  { label: 'Seal the tooth', caption: 'A filling seals it; a steel crown usually follows.', beats: [
    { dur: 1.4, hold: 0.6, set: { seal: 1 }, labels: ['Seal'] },
    { dur: 2.4, hold: 2.6, theta: 0.08, phi: 1.42, zoom: 1.12, focus: FT, drift: 0, labels: ['Seal', 'Medicine dressing', 'Root pulp', 'Adult premolar'], key: true }] }
]);
fig.start();
