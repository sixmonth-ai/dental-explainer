// White spot lesion on the upper right central incisor (FDI 11 = Universal 8), crown up (model convention), after braces; story ending on a labio-palatal cut through the spot. Frame: +x mesial, +z labial, CEJ at y = 0, mm.
// poster: end
// A twin bracket sits at an MBT-style height (slot 5.0 mm from the incisal edge, dental-facts §19). Plaque held at the gum side
// of the bracket demineralises the enamel there: one DK.cariesLesion on the labial surface at the white-spot stage (ICDAS 1–2,
// dental-facts §16), a chalky body under a surface that stays intact. The bracket comes off, the spot shows, the cut reveals that
// the loss is under the surface and stops in enamel, and the spot shrinks (remineralisation is possible while the surface is intact).
const FDI = 11, BRACKET_H = 5.0;
const fig = DK.figure({
  fov: 28,
  title: 'White spots on teeth',
  subtitle: 'Upper right front tooth, FDI 11 (Universal 8), crown up.',
  view: { theta: 0.35, phi: 1.4, margin: 0.95 }
});

// --- tooth in its socket (context is quiet and does not drive the camera)
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.6;
const bone = DK.bone({ width: 11, height: 15, depth: 11.5, cortical: 1.0, crest: 1.4 }); bone.position.set(0, CREST, -1.4);
const gum = DK.gingiva({ width: 11, height: 3.0, depth: 12.6, crest: 1.2, around: [{ x: 0, z: 1.4, md: s.mdC, bl: s.blC, rise: 0.9 }] }); gum.position.set(0, 1.0, -1.4);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the root.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the neck of the tooth.' });
fig.part(tooth.group, { name: 'Tooth 11', label: false, info: 'Upper right central incisor, the front tooth everyone sees when you smile.' });

// --- the white spot: on the labial surface between the bracket and the gum line (where plaque sits during braces)
const SPOT_Y = 2.8;
const lesion = DK.cariesLesion(tooth, { site: 'buccal', at: SPOT_Y, size: 1.5, stage: 0, reactionary: false });
// a thin ink rim round the spot on the cut face (rebuilt with the lesion), so chalk reads against the pale enamel
const rim = new THREE.Mesh(new THREE.BufferGeometry(), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); rim.userData.cutOnly = true; tooth.group.add(rim);
const M = lesion.meshes, A = lesion.axis;
// The kit's chalky body only paints the cut face here; in 3D the spot is a matte, soft-edged patch draped on the enamel
// (the kit body has a hard rim that reads as a sticker), sized from the same lesion so the two agree.
M.enamel.userData.cutOnly = true;
L.enamel.traverse(m => { if (m.isMesh && m.material && m.material.color) m.material.color.lerp(DK.color(0xe4d4b0), 0.7); });   // living enamel is ivory, the spot chalk white
tooth.group.updateMatrixWorld(true);
const spotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = rnd() * 52, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r * 0.9, R = 26 + rnd() * 34;
    const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); return t; })();
const spotMat = new THREE.MeshStandardMaterial({ color: DK.color(0xfbfaf6), roughness: 1, metalness: 0, transparent: true, alphaMap: spotTex, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const spot = (() => { const XH = 1.25 * lesion.size * 1.25, YH = 0.8 * lesion.size * 1.25, N = 28, pos = [], uv = [], idx = [], rc = new THREE.Raycaster();
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1, v = j / N * 2 - 1, x = u * XH, y = SPOT_Y + v * YH;
    rc.set(new THREE.Vector3(x, y, 12), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(L.enamel, true).filter(q => !q.object.userData.isStencil)[0];
    const p = h ? h.point.clone().add(h.face.normal.clone().multiplyScalar(0.02)) : new THREE.Vector3(x, y, s.bl / 2); pos.push(p.x, p.y, p.z); uv.push(i / N, j / N); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, spotMat); m.renderOrder = 3; m.castShadow = m.receiveShadow = false; return m; })();
tooth.group.add(spot);
const at = (d, r, k) => lesion.point(d, r, k);   // k = 6: toward the incisal edge, 18: toward the gum (E1 = +y)

// --- the bracket (bonded at mid-crown; it lifts straight off the surface when the braces come off)
const bracket = DK.bracket(s, { slot: '0.022', height: BRACKET_H });
tooth.group.add(bracket);
const B0 = bracket.position.clone(), BN = new THREE.Vector3(0, 0, 1).applyQuaternion(bracket.quaternion);
fig.part(bracket, { inPlace: true, name: 'Bracket', anchor: [bracket.userData.width / 2 - 0.2, bracket.userData.tall / 2 - 0.1, bracket.userData.face + 0.05], dim: false, when: () => bracket.visible, info: 'A brace is glued to the tooth. Plaque collects in the corner between the brace and the gum, where it is hard to brush.' });

// --- labels
const cutOn = (e, sec) => sec.enabled;
const SURF = at(0.02, 0, 0);
fig.part(M.enamel, { inPlace: true, name: 'White spot', sub: 'early decay', anchor: (e, sec) => sec.enabled ? at(A.enamel * 0.45, lesion.size * 0.25, 12) : SURF, accent: true, dim: false, when: () => M.enamel.visible && lesion.userData.stage > 0.5, info: 'Acid from plaque has dissolved mineral inside the enamel, so it scatters light and looks chalky white. The tooth surface is still whole (ICDAS 1 to 2).' });
const surfMark = new THREE.Object3D(); surfMark.position.fromArray(at(-0.03, lesion.size * 0.35, 0)); tooth.group.add(surfMark);
fig.part(surfMark, { inPlace: true, name: 'Surface intact', sub: 'so it can still repair', anchor: [0, 0, 0], dim: false, when: (e, sec) => sec.enabled && lesion.userData.stage > 0.5, info: 'The outer skin of enamel stays hard over the spot. As long as there is no hole, saliva and fluoride can put mineral back.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [0, s.crownL * 0.62, 2.6], dim: false, when: cutOn, info: 'The hard outer layer. It has no living cells, so it cannot regrow, but early mineral loss can be repaired.' });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [0, -1.2, 1.9], dim: false, when: cutOn, info: 'The softer layer under the enamel. A white spot has not reached it yet.' });

// --- params
fig.param('stage', 0, v => { lesion.set(v); spotMat.opacity = Math.min(1, v * 1.1); spot.visible = v > 0.02; spot.scale.setScalar(1); const k = 0.55 + 0.45 * Math.min(v, 1); spot.scale.set(1, 1, 1); spotMat.alphaMap.repeat.set(1 / k, 1 / k); spotMat.alphaMap.offset.set(0.5 - 0.5 / k, 0.5 - 0.5 / k); rim.visible = M.enamel.visible; if (rim.visible) { rim.geometry.dispose(); rim.geometry = DK.inflateGeometry(M.enamel.geometry, 0.05); } });
fig.param('off', 0, d => { bracket.visible = d < 9; bracket.position.copy(B0).addScaledVector(BN, d); });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [rim], color: DK.RIM, kind: 'plain' },
  { objects: [M.enamel], color: 0xfdfcf8, kind: 'plain' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
spotMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
fig.view('Front', { theta: 0.15, phi: 1.45, zoom: 0.75, focus: [0, 4, 2], section: false, labels: ['White spot'] });

// --- story: braces on → spot forms by the bracket → bracket off → turn and cut → push in on the spot → it hardens again
const SIDE = Math.PI / 2, SPOT = [0, SPOT_Y + 0.4, 2.4], FRONT = [0, 4.2, 2.6];
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.55, phi: 1.35, zoom: 1.0, section: false, set: { stage: 0, off: 0 }, labels: ['Bracket'] },
  { dur: 2.2, hold: 0.4, theta: 0.15, phi: 1.45, zoom: 0.7, focus: FRONT, labels: ['Bracket'] },
  { dur: 2.4, hold: 0.6, set: { stage: 1 }, labels: ['Bracket'] },
  { dur: 1.6, hold: 1.8, set: { off: 10 }, labels: ['White spot'] },
  { fov: 26, dur: 2.4, hold: 0.2, theta: SIDE - 0.25, phi: 1.42, zoom: 0.95, focus: 'auto', labels: [] },
  { dur: 0, hold: 0, section: true, offset: 5 },
  { dur: 2.2, hold: 1.0, offset: 0, labels: ['Enamel', 'Dentin'] },
  { dur: 2.2, hold: 2.2, theta: SIDE - 0.35, zoom: 0.5, focus: SPOT, labels: ['White spot', 'Surface intact'] },
  { dur: 2.4, hold: 2.6, theta: SIDE - 0.7, zoom: 0.55, focus: [0, 4.9, 1.0], set: { stage: 0.8 }, labels: ['White spot', 'Surface intact', 'Enamel', 'Dentin'] }
]);
fig.start();
