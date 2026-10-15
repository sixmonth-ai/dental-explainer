// Procedure: filling (obturating) the shaped canal of the mandibular right second premolar (FDI 45 = Universal 29) by single cone with sealer, in a mesio-distal cut through its one canal. Frame: +x mesial, +z buccal, CEJ at y = 0, mm; camera on the buccal side (mesial on the viewer's right).
// poster: step 5
// Starts after shaping (access open, canal 25/.06, empty): dry with paper points, master cone fit to working length (radiograph), sealer on the walls and the cone seated, excess seared and compacted at the orifice, then the coronal seal. Working length is computed from the geometry (DK.canalAccessPath).
const FDI = 45, CREST = -1.8, SHORT = 0.5;
const SHAPE = { size: 25, taper: 0.06 };                 // apical size / taper of the preparation (a common choice; sizes vary by case)
const SZ = `${SHAPE.size}/.${String(Math.round(SHAPE.taper * 100)).padStart(2, '0')}`;

const fig = DK.figure({
  fov: 26,
  title: 'Filling the root canal',
  subtitle: 'Lower right second premolar, FDI 45 (Universal 29), cut through its canal.',
  view: { theta: 0, phi: 1.42, margin: 1.0 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CUT = DK.canalAt(s, 0, -6).z;
const bone = DK.bone({ width: 15, height: 19.5, depth: 11, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 15, height: 3.2, depth: 11.8, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the root.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Soft tissue; a rubber dam isolates the tooth during treatment.' });
fig.part(tooth.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar: one root and, in about 9 of 10 teeth, one canal.' });

// --- reference point: the buccal cusp tip (highest point of the crown on the buccal half), where the rubber stops rest
const probe = new THREE.Mesh(DK.crownGeometry(s), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); probe.updateMatrixWorld();
const rc = new THREE.Raycaster(); let REF = [0, s.crownL, 1];
for (let x = -2; x <= 2; x += 0.25) for (let z = 0.4; z <= 3; z += 0.2) { rc.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(probe); if (h.length && h[0].point.y > REF[1]) REF = [x, h[0].point.y, z]; }
probe.geometry.dispose();
const path = DK.canalAccessPath(s, 0, { ref: REF, short: SHORT }), WL = path.wl, PATH = path.points, END = PATH[PATH.length - 1];
const ORIFICE_Y = path.orifice[1];

// --- the canal space after shaping: access + chamber empty, canal shaped and empty. Then sealer, gutta-percha, restoration.
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750, SEALER = 0xf0ebdf;
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const access = DK.accessCavity(s, { k: 1, color: EMPTY });
const accessRim = DK.accessCavity(s, { k: 1, material: 'ink', grow: 1.05, lift: 0.01 });
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const canal = DK.canalShape(s, 0, Object.assign({ color: CANAL_INK, k: 1 }, SHAPE));                       // the empty, shaped canal
const sealer = DK.canalShape(s, 0, Object.assign({ color: SEALER, k: 1 }, SHAPE));                         // sealer on the walls ...
const core = DK.canalShape(s, 0, Object.assign({ color: CANAL_INK, k: 1, scale: 0.62 }, SHAPE));          // ... around the still-empty lumen
const filling = DK.rootFilling(s, 0, Object.assign({ scale: 0.8, from: ORIFICE_Y }, SHAPE));               // gutta-percha inside a thin sealer film
const resto = DK.accessCavity(s, { material: 'composite', lift: 0.16 });
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
const wlMark = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false })); wlMark.position.set(END[0], END[1], END[2] + 0.3);
[accessRim, chamberRim, access, chamberVoid, canal, sealer, core, filling, resto, chamberResto, wlMark].forEach(o => tooth.group.add(o));
L.pulp.visible = false;
const fillY = () => (fig.orbit.zoom < 0.8 ? -2.5 : -11);
const midY = -7, mid = DK.canalAt(s, 0, midY), lowY = -11, low = DK.canalAt(s, 0, lowY);
fig.part(canal, { inPlace: true, name: 'Shaped canal', sub: `${SZ}, clean and empty`, anchor: [mid.x + 0.2, midY, CUT], dim: false, when: () => canal.visible, info: 'Shaped to a continuous taper and irrigated; the canal must be dry before it is filled.' });
fig.part(sealer, { inPlace: true, name: 'Sealer', sub: 'coats the walls', anchor: [mid.x - sealer.radiusAt(midY) * 0.82, midY, CUT], dim: false, when: () => sealer.visible, info: 'A flowable sealer (epoxy resin, zinc oxide eugenol or calcium silicate) fills the gaps between the gutta-percha and the dentin walls.' });
fig.part(filling, { inPlace: true, name: 'Root filling', sub: 'gutta-percha + sealer', anchor: () => [DK.canalAt(s, 0, fillY()).x + 0.1, fillY(), CUT], dim: false, when: () => filling.visible, info: 'Gutta-percha and sealer fill the shaped canal to working length. Lateral compaction, warm vertical compaction and carrier-based fillings are also used; all aim for a dense fill to length.' });
fig.part(resto, { inPlace: true, name: 'Coronal seal', anchor: [chamberPos.x, chamberPos.y + 1.2, CUT], dim: false, when: () => resto.visible, info: 'A sealed restoration stops saliva bacteria from leaking back down the filling; its quality matters as much as the root filling itself.' });
fig.part(wlMark, { inPlace: true, name: 'Working length', sub: `${DK.mm(WL)}, ${SHORT} mm short of the apex`, anchor: [0, 0, 0], accent: true, dim: false, when: () => wlMark.visible, info: 'Measured from the buccal cusp tip to the apical constriction; every instrument and the cone go to this length, never past the apex.' });

// --- instruments (fig.world, bent along the canal path by params)
const paper = DK.gpCone({ size: SHAPE.size, taper: 0.04 });
paper.traverse(m => { if (m.isMesh) m.material = DK.mat('pdl', { color: 0xeee8da, roughness: 0.95 }); });
const cone = DK.gpCone(SHAPE);
const plugger = DK.endoFile({ kind: 'plugger', size: 50, taper: 0.02, length: 21, flutes: 16 });
[paper, cone, plugger].forEach(o => fig.world.add(o));
fig.part(paper, { inPlace: true, name: 'Paper point', anchor: () => paper.userData.points[44] || [0, 0, 0], info: 'Sterile absorbent paper points, inserted to working length one after another until they come out dry.' });
fig.part(cone, { inPlace: true, name: 'Master cone', sub: `${SZ} gutta-percha`, anchor: () => cone.userData.points[46] || [0, 0, 0], info: 'A gutta-percha cone matching the last shaping file. It should reach working length and resist pulling out (tug-back); a radiograph confirms its position.' });
fig.part(plugger.handle, { inPlace: true, name: 'Heated plugger', anchor: [0, 4, 0], info: 'A heated instrument cuts the cone off at the canal orifice, and a cold plugger then compacts the softened gutta-percha vertically.' });

// --- params
const st = { fill: 0, sealer: 0, resto: 0 };
const sync = () => { const coated = st.sealer > 0.5, filled = st.fill > 0.5, restored = st.resto > 0.5;
  canal.visible = !coated; sealer.visible = coated; core.visible = coated && !filled; filling.visible = filled;
  access.visible = chamberVoid.visible = !restored; resto.visible = chamberResto.visible = restored; };
fig.param('sealer', 0, v => { st.sealer = v; sync(); });
fig.param('fill', 0, v => { st.fill = v; sync(); });
fig.param('resto', 0, v => { st.resto = v; sync(); });
fig.param('wlmark', 0, v => { wlMark.visible = v > 0.5; });
const place = (tool, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(PATH, d); };
fig.param('paper', -40, d => place(paper, d));
fig.param('cone', -40, d => place(cone, d));
const ORIFICE_D = DK.canalAccessPath(s, 0, { ref: REF }).points.slice(0, 2).reduce((a, p, i, arr) => i ? Math.hypot(p[0] - arr[0][0], p[1] - arr[0][1], p[2] - arr[0][2]) : 0, 0);
fig.param('plugger', -40, d => place(plugger, d));
fig.param('trim', 0, v => { cone.visible = cone.visible && v < 0.5; });   // the cone's excess is seared off: from then on only the filling shows
sync(); wlMark.visible = false;

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [accessRim, chamberRim], color: DK.RIM, kind: 'plain' },
  { objects: [access, chamberVoid], color: EMPTY, kind: 'plain' },
  { objects: [canal], color: CANAL_INK, kind: 'plain' },
  { objects: [sealer], color: SEALER, kind: 'plain' },
  { objects: [core], color: CANAL_INK, kind: 'plain' },
  { objects: [filling], color: DK.COLORS.gutta },
  { objects: [resto, chamberResto], color: DK.COLORS.compositeCap, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: CUT } });
fig.xray([bone, gum, L.enamel, L.dentin, L.root], false);
fig.view('Radiograph', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });
fig.setReadout([
  { k: 'Working length', v: `${DK.mm(WL)} from the buccal cusp tip · ${SHORT} mm short of the apex` },
  { k: `Master cone ${SZ}`, v: `tip ${DK.fileDiameter(SHAPE.size, SHAPE.taper, 0).toFixed(2)} mm · matches the last file` }
]);

// --- the procedure (camera on +z looks at the cut face)
const FOCUS_TOOTH = [0, -4.2, CUT], FOCUS_ROOT = [0, -7, CUT], FOCUS_CROWN = [0, 2.5, CUT];
fig.procedure([
  { label: 'Dry the canal', caption: 'The shaped, irrigated canal is dried with paper points to working length.', beats: [
    { fov: 34, dur: 0, hold: 0.8, theta: 0.5, phi: 1.25, zoom: 1.05, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 8 },
    { fov: 26, dur: 2.0, hold: 0.8, theta: 0, phi: 1.42, zoom: 0.9, offset: CUT, focus: FOCUS_TOOTH, labels: ['Shaped canal'] },
    { dur: 2.2, hold: 1.6, set: { paper: WL }, labels: ['Paper point'], key: true },
    { dur: 0.9, hold: 0.2, set: { paper: -40 }, labels: [] }] },
  { label: 'Cone fit', caption: `A ${SZ} gutta-percha cone goes to working length; a radiograph confirms it.`, beats: [
    { dur: 1.0, hold: 0.1, set: { cone: -1.5 }, labels: ['Master cone'] },
    { dur: 2.4, hold: 0.2, set: { cone: WL }, labels: ['Master cone'] },
    { dur: 2.0, hold: 1.8, zoom: 0.74, focus: [0, -8, CUT], theta: 0.05, set: { wlmark: 1 }, labels: ['Master cone', 'Working length'], key: true },
    { dur: 1.2, hold: 0.2, zoom: 1, focus: FOCUS_TOOTH, theta: 0, set: { cone: -40, wlmark: 0 }, labels: [] }] },
  { label: 'Sealer and cone', caption: 'Sealer coats the walls and the cone is seated to length.', beats: [
    { dur: 1.6, hold: 0.2, zoom: 0.62, focus: FOCUS_ROOT, labels: [] },
    { dur: 1.2, hold: 1.8, set: { sealer: 1 }, labels: ['Sealer'], key: true },
    { dur: 1.4, hold: 0.2, zoom: 1, focus: FOCUS_TOOTH, labels: [] },
    { dur: 2.4, hold: 1.2, set: { cone: WL }, labels: ['Master cone'] }] },
  { label: 'Sear and compact', caption: 'The excess is seared off at the orifice and the warm gutta-percha compacted.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.62, focus: [0, 1.5, CUT], set: { plugger: -2 }, labels: ['Heated plugger'] },
    { dur: 1.6, hold: 1.6, set: { plugger: ORIFICE_D + 0.6, trim: 1, fill: 1 }, labels: ['Heated plugger', 'Root filling'], key: true },
    { dur: 1.0, hold: 0.2, set: { plugger: -40 }, labels: [] },
    { dur: 1.8, hold: 1.4, zoom: 1, focus: FOCUS_TOOTH, set: { wlmark: 1 }, labels: ['Root filling', 'Sealer', 'Working length'] }] },
  { label: 'Coronal seal', caption: 'A sealed restoration closes the access so bacteria cannot leak back in.', beats: [
    { dur: 1.4, hold: 0.6, zoom: 0.8, focus: FOCUS_CROWN, set: { wlmark: 0 }, labels: [] },
    { dur: 1.2, hold: 0.8, set: { resto: 1 }, labels: ['Coronal seal'] },
    { dur: 2.2, hold: 2.4, zoom: 0.86, focus: [0, -3, CUT], set: { wlmark: 1 }, labels: ['Coronal seal', 'Root filling', 'Working length'], key: true }] }
]);
fig.start();
