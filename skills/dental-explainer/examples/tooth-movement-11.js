// Example: orthodontic tooth movement on a maxillary central incisor (FDI 11 = Universal 8), crown up, labio-lingual cut.
// A force on the crown first tips the tooth about a point near its centre of resistance (pressure at the cervical lingual and
// the apical labial PDL), a force through the centre of resistance moves it bodily (pressure along the whole lingual side),
// and bone then remodels: resorption on the pressure side, apposition on the tension side, so the socket follows the root.
// The socket (DK.pdl) stays fixed in bone while the tooth moves inside it (DK.moveTooth), so the cut shows the PDL compressed
// on one side and widened on the other. PDL width is exaggerated (0.5 mm; real 0.15–0.38 mm). Frame: +x mesial, +z labial, CEJ at y = 0.
const FDI = 11, CREST = -1.8, GAP = 0.5;
const fig = DK.figure({
  fov: 26,
  title: 'How a tooth moves through bone',
  subtitle: 'FDI 11 (Universal 8), crown up, labio-lingual cut. PDL width exaggerated.',
  view: { theta: Math.PI / 2, phi: 1.45 }
});

// --- context: bone and gingiva (fit: false), the socket (fixed in bone, seen only on the cut)
const tooth = DK.tooth(FDI), s = tooth.spec, r = s.roots[0];
const bone = DK.bone({ width: 16, height: 20, depth: 13, crest: 1.5 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 16, height: 3.2, depth: 13.6, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = -0.4;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone. It is remodelled, not pushed aside: resorbed where the PDL is compressed, deposited where it is stretched.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false });
const socket = DK.pdl(s, GAP, CREST); socket.traverse(m => { if (m.isMesh) m.material.visible = false; });
fig.world.add(socket);
const CRES = DK.centreOfResistance(s, CREST, 0.4);   // ~40% of the root below the crest

// --- the tooth, moved inside its socket by params (a holder keeps it a regular part so the camera frames it)
const holder = new THREE.Group(); holder.add(tooth.group);
fig.part(holder, { name: 'Incisor 11', label: false, info: 'Upper right central incisor: crown 10.5 mm, root 13 mm.' });
fig.part(socket, { inPlace: true, name: 'PDL', sub: 'periodontal ligament', anchor: [0.15, -6, s.blC / 2 + GAP / 2], info: 'The periodontal ligament suspends the root in its socket: 0.15–0.38 mm wide (drawn wider here). Its cells drive the remodelling.' });
const cres = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ color: DK.color(0x8a857c), toneMapped: false }));
cres.position.set(0.25, CRES, 0); tooth.group.add(cres);
fig.part(cres, { inPlace: true, name: 'Centre of resistance', sub: '~40% of the root below the crest', anchor: [0.2, 0, 0], labelOffset: [-110, 36], info: 'A single force at the crown rotates the tooth about a point near here; a force whose line passes through it moves the tooth bodily (that needs a couple from a rectangular wire in the slot).' });

// --- markers: pressure / tension zones along the root surface (children of the tooth, lifted off the cut face)
const sc = { k: 1, add: 0, minR: 0.05 }, L = r.len, start = r.start;
const tOf = y => DK.util.clamp((start - y) / (L + start), 0, 0.985);
const outline = (th, y0, y1, n) => Array.from({ length: n + 1 }, (_, i) => { const p = DK.rootRing(r, DK.util.lerp(tOf(y0), tOf(y1), i / n), th, sc, L); return [0.16, p[1], p[2]]; });
const LAB = Math.PI / 2, LIN = 3 * Math.PI / 2, APEX = -L + 0.6;
const zone = (th, y0, y1) => { const m = DK.ribbon(outline(th, y0, y1, 24), 0.34, [1, 0, 0], { color: fig.accent, alpha: 0 }); tooth.group.add(m); return m; };
const zones = { linTop: zone(LIN, CREST - 0.2, CRES), linBot: zone(LIN, CRES, APEX), labTop: zone(LAB, CREST - 0.2, CRES), labBot: zone(LAB, CRES, APEX) };
const TENSION = DK.color(0x8a857c);
fig.part(zones.linTop, { inPlace: true, name: 'Pressure side', sub: 'PDL compressed → resorption', accent: true, anchor: [0.2, 0, 0], labelOffset: [90, 50], anchorIndex: 0, info: 'Compressed PDL: blood flow drops, osteoclasts remove the socket wall ("frontal resorption" under light force). Heavy force kills the ligament locally (hyalinisation) and bone must be removed from behind ("undermining resorption"), which delays movement.' });
fig.part(zones.labTop, { inPlace: true, name: 'Tension side', sub: 'PDL stretched → apposition', anchor: [0.2, 0, 0], labelOffset: [-110, 50], info: 'Stretched PDL fibres: osteoblasts lay down new bone on the socket wall, so the socket follows the root.' });
zones.linTop.userData.part.setAnchor(() => { const p = DK.rootRing(r, tOf((CREST + CRES) / 2), LIN, sc, L); return [0.2, p[1], p[2] - 0.1]; });
zones.labTop.userData.part.setAnchor(() => { const p = DK.rootRing(r, tOf((CREST + CRES) / 2), LAB, sc, L); return [0.2, p[1], p[2] + 0.1]; });

// --- force arrow (world) and the new-bone strip on the labial socket wall (rebuilt as the socket moves)
const arrowMat = new THREE.MeshBasicMaterial({ color: DK.color(0x7a766e), toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false });
const arrow = DK.arrow({ from: [0.2, 6.5, s.bl / 2 + 4.6], to: [0.2, 6.5, s.bl / 2 + 0.8], width: 0.5, head: 1.2, normal: [1, 0, 0], material: arrowMat });
fig.world.add(arrow);
fig.part(arrow, { inPlace: true, name: 'Force', sub: 'light, continuous', anchor: [0, 0.3, 3.6], labelOffset: [-90, -50], info: 'Optimal forces are light: about 35–60 g for tipping and 70–120 g for bodily movement (Proffit). More force does not move teeth faster.' });
// remodelling: thin layers on the socket wall (children of the socket, so they follow it): new bone on the tension side,
// the resorbing front on the pressure side (accent)
const wallPts = (th, out) => outline(th, CREST - 1.0, APEX + 0.2, 24).map(p => [0.14, p[1], p[2] + out * (GAP + 0.17)]);
const newBone = DK.ribbon(wallPts(LAB, 1), 0.34, [1, 0, 0], { color: 0xb9ab86, alpha: 0, name: 'New bone' }); socket.add(newBone);
const resorb = DK.ribbon(wallPts(LIN, -1), 0.34, [1, 0, 0], { color: fig.accent, alpha: 0, name: 'Resorbing front' }); socket.add(resorb);
fig.part(newBone, { inPlace: true, name: 'Apposition', sub: 'new bone on the tension side', anchor: wallPts(LAB, 1)[10], labelOffset: [-110, 40], info: 'Osteoblasts line the stretched side with new bone, so the socket wall keeps its distance to the root.' });
fig.part(resorb, { inPlace: true, name: 'Resorption', sub: 'bone removed on the pressure side', accent: true, anchor: wallPts(LIN, -1)[10], labelOffset: [100, 40], info: 'Osteoclasts resorb the socket wall ahead of the moving root. The tooth moves about 1 mm a month; bone turns over, it is not pushed aside.' });

// --- params
const st = { tip: 0, shift: 0, socket: 0, mode: 0, zones: 0 };
const place = () => DK.moveTooth(tooth.group, { tip: st.tip, pivotY: CRES, shift: st.shift });
const paint = () => { const k = st.mode, a = st.zones;   // mode 0: tipping (diagonal pressure); mode 1: bodily (whole lingual side)
  const set = (z, press) => { z.material.color.copy(fig.accent).lerp(TENSION, 1 - press); z.material.opacity = 0.9 * a; };
  set(zones.linTop, 1); set(zones.labBot, 1 - k); set(zones.labTop, 0); set(zones.linBot, k); };
fig.param('tip', 0, v => { st.tip = v; place(); });
fig.param('shift', 0, v => { st.shift = v; place(); });
fig.param('socket', 0, v => { st.socket = v; socket.position.z = v; });
fig.param('mode', 0, v => { st.mode = v; paint(); });
fig.param('zones', 0, v => { st.zones = v; paint(); });
fig.param('arrow', 0, v => { arrowMat.opacity = v; arrow.visible = v > 0.01; });
fig.param('newBone', 0, v => { newBone.material.opacity = 0.95 * v; resorb.material.opacity = 0.9 * v; });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [socket], color: DK.COLORS.pdl, kind: 'plain' },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.dentin, tooth.layers.root], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });

// --- the steps (camera on +x: labial on the viewer's left, lingual on the right)
const TIP = -0.07;   // ~4°: crown ~1.2 mm lingually, apex ~0.4 mm labially
fig.procedure([
  { label: 'Force on the crown', caption: 'A light force from the wire pushes the crown lingually.', beats: [
    { dur: 0, hold: 0.6, theta: Math.PI / 2, phi: 1.45, zoom: 1, section: true, offset: 0, labels: ['PDL'] },
    { dur: 1.6, hold: 1.4, zoom: 1, focus: 'auto', set: { arrow: 1 }, labels: ['Force', 'PDL', 'Centre of resistance'], key: true }] },
  { label: 'Tipping', caption: 'One force at the crown: the tooth rotates near its centre of resistance.', beats: [
    { dur: 2.0, hold: 0.2, theta: Math.PI / 2 + 0.06, set: { tip: TIP, mode: 0, zones: 1 }, labels: ['Force'] },
    { dur: 1.2, hold: 2.2, labels: ['Pressure side', 'Tension side', 'Centre of resistance'], key: true }] },
  { label: 'Bodily movement', caption: 'Force plus a counter-moment: the whole root moves the same way.', beats: [
    { dur: 2.0, hold: 0.2, theta: Math.PI / 2 - 0.06, set: { tip: 0, shift: -0.36, mode: 1 }, labels: ['Force'] },
    { dur: 1.2, hold: 2.2, labels: ['Pressure side', 'Tension side', 'Centre of resistance'], key: true }] },
  { label: 'Bone remodels', caption: 'Resorption ahead of the root, apposition behind it: the socket follows.', beats: [
    { dur: 2.8, hold: 0.2, theta: Math.PI / 2, set: { shift: -1.4, socket: -1.05, newBone: 1, zones: 0 }, labels: ['Resorption', 'Apposition'] },
    { dur: 1.4, hold: 2.4, set: { socket: -1.4, arrow: 0 }, labels: ['Resorption', 'Apposition', 'PDL'], key: true }] }
]);
fig.start();
