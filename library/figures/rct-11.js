// Procedure: root canal treatment of the maxillary right central incisor (FDI 11 = Universal 8), crown up (model convention), in a labio-palatal cut through its one canal. Frame: +x mesial, +z labial, CEJ at y = 0, mm; camera on the mesial side (labial on the viewer's left, palatal on the right).
// poster: step 2
// Patient story in five steps: an infected pulp with a lesion at the root tip, access through the palatal surface (a straight channel from the cingulum area into the chamber, built here as a tapered solid along the file line), cleaning and shaping to working length, gutta-percha filling, and a bonded seal in the access while the bone heals.
const FDI = 11, CREST = -1.6, SHORT = 0.5;
const SHAPE = { size: 40, taper: 0.06 };              // a wide single canal; apical sizes vary by case and are not shown

const fig = DK.figure({
  fov: 26,
  title: 'Root canal on a front tooth',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up, cut front to back.',
  view: { theta: Math.PI / 2, phi: 1.42, margin: 0.95 }
});

// --- tooth and context (thin labial bone plate, thicker palatal bone)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const root = s.roots[0], CUT = DK.canalAt(s, 0, -6).x;
const bone = DK.bone({ width: 11, height: 17, depth: 11.5, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, -1.6);
const gum = DK.gingiva({ width: 11, height: 3.0, depth: 12.6, crest: 1.2, around: [{ x: 0, z: 1.6, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.set(0, 1.1, -1.6);
const APEX = [root.x + root.apex[0], -root.len, root.z + root.apex[1]];
const lesion = DK.periapicalLesion({ radius: 2.6, seed: 4, color: 0x7d6761 }); lesion.position.set(APEX[0], APEX[1] - 0.7, APEX[2]);
tooth.group.add(lesion);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the root; the plate on the lip side is thin.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth; a rubber dam isolates the tooth during treatment.' });
fig.part(tooth.group, { name: 'Tooth 11', label: false, info: 'Upper right central incisor: one root and nearly always one wide, fairly straight canal. A dead pulp can turn the crown grey.' });
fig.part(lesion, { inPlace: true, name: 'Infection', sub: 'at the root tip', anchor: [0.3, -0.6, -0.9], accent: true, dim: false, when: () => lesion.visible && lesion.userData.k > 0.3, info: 'Bacteria in the dead canal inflame the tissue at the root tip and dissolve bone around it. This is what hurts on biting, and it shows as a dark spot on an X-ray.' });
fig.part(L.pulp, { inPlace: true, name: 'Dead pulp', sub: 'infected', anchor: [CUT, 4.5, 0], dim: false, when: () => L.pulp.visible && pulpState.necrosis > 0.5, info: 'The nerve and blood vessels inside the tooth have died, often after a knock or deep decay.' });

// --- the access line: from the orifice up through the chamber to the palatal surface near the cingulum
const probe = new THREE.Mesh(DK.crownGeometry(s), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); probe.updateMatrixWorld();
const rc = new THREE.Raycaster();
const surfZ = y => { rc.set(new THREE.Vector3(CUT, y, 0), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(probe); return h.length ? h[h.length - 1].point.z : -s.bl / 2; };
const ENTRY_Y = s.crownL * 0.5;
const ent = new THREE.Vector3(CUT, ENTRY_Y, surfZ(ENTRY_Y));
const cs0 = DK.canalPath(s, 0, { n: 4 })[0], ORI = new THREE.Vector3(cs0[0], cs0[1], cs0[2]);
const AX = ent.clone().sub(ORI).normalize();             // the straight-line access direction (out of the tooth)
const REF = ent.clone().addScaledVector(AX, 2.0);        // a point just outside the opening: instruments come in along AX
const path = DK.canalAccessPath(s, 0, { ref: REF.toArray(), short: SHORT }), PATH = path.points, WL = path.wl;

// the access channel: a closed solid along AX whose top follows the real palatal surface (raycast, like DK.accessCavity) and whose
// floor deepens with k from the surface (0) to just above the orifice (1). rTop / rBot: radius at the surface / at the floor.
const N = 48, U = new THREE.Vector3(1, 0, 0).addScaledVector(AX, -AX.x).normalize(), V = new THREE.Vector3().crossVectors(AX, U).normalize();
const BOT = ORI.clone().addScaledVector(AX, 1.2);
function surfaceAlong(from) { rc.set(from, AX); const h = rc.intersectObject(probe); return h.length ? h[0].point : from.clone().addScaledVector(AX, 8); }
function channel(mat, rTop, rBot, lift) {
  const ring = r => { const top = [], bot = []; for (let j = 0; j < N; j++) { const a = j / N * Math.PI * 2, d = U.clone().multiplyScalar(Math.cos(a)).addScaledVector(V, Math.sin(a));
      const b = BOT.clone().addScaledVector(d, rBot * r), t = surfaceAlong(BOT.clone().addScaledVector(d, rTop * r)); top.push(t.addScaledVector(AX, lift)); bot.push(b); } return { top, bot }; };
  const R = ring(1), cTop = surfaceAlong(BOT.clone()).addScaledVector(AX, lift);
  const W = 3, pos = new Float32Array((N * (W + 1) + 2) * 3), idx = [], at = (w, j) => w * N + (j % N), cT = N * (W + 1), cB = cT + 1;
  for (let w = 0; w < W; w++) for (let j = 0; j < N; j++) idx.push(at(w, j), at(w, j + 1), at(w + 1, j + 1), at(w, j), at(w + 1, j + 1), at(w + 1, j));
  for (let j = 0; j < N; j++) { idx.push(cT, at(0, j + 1), at(0, j)); idx.push(cB, at(W, j), at(W, j + 1)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); let flip = null;
  m.set = k => { k = Math.max(0, Math.min(1, k)); m.userData.k = k; m.visible = k > 0.02; let cx = new THREE.Vector3();
    for (let j = 0; j < N; j++) for (let w = 0; w <= W; w++) { const p = R.top[j].clone().lerp(R.bot[j], k * w / W); pos.set([p.x, p.y, p.z], at(w, j) * 3); if (w === W) cx.add(p); }
    cx.multiplyScalar(1 / N); pos.set([cTop.x, cTop.y, cTop.z], cT * 3); pos.set([cx.x, cx.y, cx.z], cB * 3);
    if (flip === null) { let vol = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); for (let i = 0; i < idx.length; i += 3) { A.fromArray(pos, idx[i] * 3); B.fromArray(pos, idx[i + 1] * 3); C.fromArray(pos, idx[i + 2] * 3); vol += A.dot(B.clone().cross(C)); }
      flip = vol < 0; if (flip) { for (let i = 0; i < idx.length; i += 3) { const tt = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tt; } g.setIndex(idx); } }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); return m; };
  m.set(1); m.set(0); return m;
}

// --- canal space: void copies, shaping, filling, restoration
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750;
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const access = channel(DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 }), 1.1, 0.8, 0.02);
const accessRim = channel(DK.mat('pdl', { color: DK.RIM, cap: DK.RIM }), 1.12, 0.92, 0.0); accessRim.userData.cutOnly = true;
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const canal = DK.canalShape(s, 0, Object.assign({ color: CANAL_INK }, SHAPE));
const filling = DK.rootFilling(s, 0, Object.assign({ from: ORI.y - 0.5 }, SHAPE));
const resto = channel(DK.mat('composite', { cap: DK.COLORS.compositeCap }), 1.1, 0.8, 0.02);
const chamberResto = new THREE.Mesh(chamberGeo, DK.mat('composite', { cap: DK.COLORS.compositeCap })); chamberResto.position.copy(chamberPos);
[accessRim, chamberRim, access, chamberVoid, canal, filling, resto, chamberResto].forEach(o => tooth.group.add(o));
const midY = -6.5, mid = DK.canalAt(s, 0, midY);
const accessMid = ent.clone().lerp(ORI, 0.25);
fig.part(access, { inPlace: true, name: 'Opening', sub: 'from the back of the tooth', anchor: () => accessMid.toArray(), dim: false, when: () => access.visible, info: 'The dentist enters through the palatal (tongue) side, just above the bulge near the gum, so the visible front of the tooth stays intact. The opening is shaped so files can run straight down the canal.' });
fig.part(canal, { inPlace: true, name: 'Cleaned canal', anchor: [CUT, midY, mid.z], dim: false, when: () => canal.visible && canal.userData.k > 0.5, info: 'Files remove the dead pulp and shape the canal into a smooth taper; disinfecting rinses wash it out.' });
fig.part(filling, { inPlace: true, name: 'Root filling', sub: 'gutta-percha', anchor: [CUT, midY, mid.z], dim: false, when: () => filling.visible, info: 'A rubber-like material (gutta-percha) with a sealer fills the canal to just short of the root tip. The root stays in the bone.' });
fig.part(resto, { inPlace: true, name: 'Seal', sub: 'tooth-coloured filling', anchor: () => accessMid.toArray(), dim: false, when: () => resto.visible, info: 'A bonded, tooth-coloured filling seals the opening so bacteria cannot leak back in. A front tooth with enough sound tooth left often needs no crown.' });
const healMark = new THREE.Object3D(); healMark.position.set(CUT, APEX[1] - 1.6, APEX[2] - 0.6); tooth.group.add(healMark);
fig.part(healMark, { inPlace: true, name: 'Bone heals', anchor: [0, 0, 0], dim: false, when: () => lesion.userData.k < 0.05, info: 'With the source of infection gone, bone fills in over months; an X-ray about a year later checks the healing.' });

// --- instruments (fig.world): bur along the access line, a file and a cone bent along the canal path
const bur = DK.bur({ shape: 'round', diameter: 1.4, head: 1.4 });
const file = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25 });
const cone = DK.gpCone(SHAPE);
[bur, file, cone].forEach(o => fig.world.add(o));
bur.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), AX);
fig.part(bur, { inPlace: true, name: 'Bur', anchor: [0, 6, 0], info: 'A small round bur in the drill opens the palatal surface and removes the roof of the pulp chamber. The tooth is numbed first.' });
fig.part(file, { inPlace: true, name: 'File', anchor: () => file.userData.points[Math.min(34, file.userData.points.length - 1)] || [0, 0, 0], info: 'Fine, flexible files clean and shape the canal to just short of the root tip; their length is checked with an electronic apex locator and an X-ray.' });
fig.part(cone, { inPlace: true, name: 'Gutta-percha', anchor: () => cone.userData.points[40] || [0, 0, 0], info: 'A cone of gutta-percha matching the last file is coated in sealer and pushed to length.' });

// --- params
const pulpState = { necrosis: 0 };
const PULP = DK.color(DK.COLORS.pulp), NECRO = DK.color(0x6b5d59), ENAMEL = DK.color(DK.COLORS.enamel), GREY = DK.color(0xc9c4b8);
const PULP_GROUP = 6;
fig.param('necrosis', 0, v => { pulpState.necrosis = v;
  L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(NECRO, v); });
  L.enamel.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(ENAMEL).lerp(GREY, v * 0.6); });
  if (fig.section) DK.capColor(fig.section, PULP_GROUP, v > 0.5 ? 0x6e615d : DK.COLORS.pulpCap); });
fig.param('lesion', 1, k => lesion.set(k));
const st = { pulp: 1, access: 0, fill: 0, resto: 0 };
const sync = () => { const gone = st.pulp < 0.5, filled = st.fill > 0.5, restored = st.resto > 0.5;
  L.pulp.visible = !gone; chamberVoid.visible = gone && !restored; chamberRim.visible = gone; canal.visible = gone && !filled; filling.visible = filled;
  access.visible = st.access > 0.02 && !restored; accessRim.visible = st.access > 0.02; resto.visible = chamberResto.visible = restored; };
fig.param('access', 0, k => { st.access = k; access.set(k); accessRim.set(k); resto.set(1); sync(); });
fig.param('pulp', 1, v => { st.pulp = v; sync(); });
fig.param('shape', 0, k => canal.set(k));
fig.param('fill', 0, v => { st.fill = v; sync(); });
fig.param('resto', 0, v => { st.resto = v; sync(); });
const place = (tool, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(PATH, d); };
fig.param('file', -40, d => place(file, d));
fig.param('cone', -40, d => place(cone, d));
fig.param('bur', 30, d => { bur.visible = d < 25; bur.position.copy(ent).addScaledVector(AX, d); });   // d = mm of the bur tip outside (+) or inside (−) the palatal surface

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
  { objects: [canal], color: CANAL_INK, kind: 'plain' },
  { objects: [filling], color: DK.COLORS.gutta },
  { objects: [resto, chamberResto], color: DK.COLORS.compositeCap, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
fig.xray([bone, gum, L.enamel, L.dentin, L.root], false);
fig.view('X-ray', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });

// --- the procedure (camera on +x looks at the cut face; labial on the left, palatal on the right)
const SIDE = Math.PI / 2, FOCUS_TOOTH = [CUT, -3.6, -0.6], FOCUS_CROWN = [CUT, 4.0, -1.2], FOCUS_APEX = [CUT, -10, 0];
const ACCESS_DEPTH = ent.distanceTo(ORI) - 1.0;
fig.procedure([
  { label: 'Infected pulp', caption: 'The pulp has died and infection has reached the bone at the root tip.', beats: [
    { fov: 34, dur: 0, hold: 1.0, theta: SIDE - 0.7, phi: 1.3, zoom: 1.0, section: false, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { fov: 26, dur: 2.4, hold: 0.4, theta: SIDE, phi: 1.42, zoom: 0.92, focus: FOCUS_TOOTH, offset: CUT, labels: [] },
    { dur: 1.8, hold: 2.0, set: { necrosis: 1 }, labels: ['Dead pulp', 'Infection'], key: true }] },
  { label: 'Opening from behind', caption: 'A small opening through the back of the tooth reaches the pulp.', beats: [
    { dur: 1.8, hold: 0.2, zoom: 0.68, focus: FOCUS_CROWN, theta: SIDE + 0.12, set: { bur: 3 }, labels: ['Bur'] },
    { dur: 2.4, hold: 1.2, set: { bur: -ACCESS_DEPTH * 0.85, access: 1, pulp: 0 }, labels: ['Bur', 'Opening'], key: true },
    { dur: 1.2, hold: 1.2, set: { bur: 30 }, labels: ['Opening'] }] },
  { label: 'Cleaning the canal', caption: 'Files clean and shape the canal to just short of the root tip.', beats: [
    { dur: 1.4, hold: 0.1, zoom: 0.92, focus: FOCUS_TOOTH, theta: SIDE, set: { file: -1.5 }, labels: ['File'] },
    { dur: 2.8, hold: 1.6, set: { file: WL, shape: 1 }, labels: ['File', 'Cleaned canal'], key: true },
    { dur: 1.0, hold: 1.2, set: { file: -40 }, labels: ['Cleaned canal'] }] },
  { label: 'Filling', caption: 'Gutta-percha and sealer fill the canal.', beats: [
    { dur: 1.0, hold: 0.1, set: { cone: -1.5 }, labels: ['Gutta-percha'] },
    { dur: 2.4, hold: 0.4, set: { cone: WL }, labels: ['Gutta-percha'] },
    { dur: 0.8, hold: 1.8, set: { cone: -40, fill: 1 }, labels: ['Root filling'], key: true }] },
  { label: 'Sealing', caption: 'A bonded filling closes the opening; the bone heals over months.', beats: [
    { dur: 1.4, hold: 0.2, zoom: 0.72, focus: FOCUS_CROWN, set: { resto: 1 }, labels: ['Seal'] },
    { dur: 2.0, hold: 0.2, zoom: 0.92, focus: FOCUS_TOOTH, labels: ['Seal', 'Root filling'] },
    { dur: 2.4, hold: 2.6, theta: SIDE - 0.08, set: { lesion: 0 }, labels: ['Seal', 'Root filling', 'Bone heals'], key: true }] }
]);
fig.start();
