// Class IV composite on the maxillary right central incisor (FDI 11 = Universal 8), crown up (model convention): the chipped mesio-incisal corner rebuilt in layers. Frame: +x = mesial, +z = labial, CEJ at y = 0, mm.
// poster: step 4
// The chip is the figure's one cut plane: an oblique enamel-dentin fracture through the mesio-incisal corner (pulp not reached),
// so the fracture face shows enamel and dentin with the kit's section caps. The composite layers are copies of the tooth's own
// enamel and dentin shells kept only on the missing side of that plane, so together they rebuild the original crown exactly:
// palatal enamel shell, dentin-shade body, labial enamel layer (layering technique, standard teaching), each light-cured.
const FDI = 11;
const fig = DK.figure({
  fov: 28,
  title: 'Bonding a chipped front tooth',
  subtitle: 'FDI 11 (Universal 8), upper right central incisor, crown up.',
  view: { theta: 0.55, phi: 1.32 }
});

// --- the tooth, whole (crown and root), as an extracted-tooth model: the incisor outline reads best without a gum block
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
fig.part(tooth.group, { name: 'Central incisor 11', label: false, info: 'Upper right central incisor. Its corners are the most often chipped part of the front teeth.' });

// --- the fracture: one oblique plane from the incisal edge (1 mm mesial of the midline) to the mesial surface ~6 mm above the CEJ
const N = new THREE.Vector3(0.78, 0.62, 0.3).normalize();       // toward the lost corner: mesial, incisal and a little labial
const C = N.dot(new THREE.Vector3(1.0, 10.4, 0.4));              // plane position along N (mm)
const onPlane = (x, z) => [x, (C - N.x * x - N.z * z) / N.y, z];   // the fracture surface at (x, z)
const keepCorner = new THREE.Plane(N.clone(), -C);                // keeps N·p ≥ C: the missing side
const grow = () => new THREE.Plane(N.clone().negate(), C);        // keeps N·p ≤ g: a layer growing out of the fracture face

// composite layers: the tooth's own shells (same geometry and frame), restricted to the missing corner
function layer(src, hex, extraPlanes) {
  const m = DK.mat('composite', { color: hex, side: THREE.DoubleSide });
  const g = grow(); m.clippingPlanes = [keepCorner, g, ...(extraPlanes || [])];
  const mesh = new THREE.Mesh(src.geometry, m); mesh.position.copy(src.position); mesh.quaternion.copy(src.quaternion); mesh.scale.copy(src.scale);
  mesh.userData.grow = g; mesh.visible = false; tooth.group.add(mesh); return mesh;
}
const ENAMEL_SHADE = DK.COLORS.composite, DENTIN_SHADE = 0xd4b98c;   // ivory enamel shade and warm dentin shade while building; polished toward the tooth colour at the end
const shell = layer(L.enamel, ENAMEL_SHADE, [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.4)]);   // the palatal part of the enamel only (the incisal third sits labial of z = 0)
const body = layer(L.dentin, DENTIN_SHADE); body.scale.y *= 1.12;   // the dentin shade is built up close to the edge (under ~1 mm of enamel shade), as in layering
const outer = layer(L.enamel, ENAMEL_SHADE);
DK.inFront(shell); DK.inFront(body); DK.inFront(outer);
const setGrow = (mesh, k) => { mesh.visible = k > 0.002; mesh.userData.grow.constant = C + k * 6; };

// a see-through ghost of the lost corner (accent), shown while the tooth is still chipped
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, clippingPlanes: [keepCorner] });
const ghost = new THREE.Mesh(L.enamel.geometry, ghostMat); ghost.position.copy(L.enamel.position); ghost.scale.copy(L.enamel.scale); tooth.group.add(ghost);

const st = { comp: 0 };   // composite present: hides the fracture-face labels
const bare = () => st.comp < 0.05;
fig.part(ghost, { inPlace: true, name: 'Chipped corner', sub: 'enamel and dentin lost', anchor: [3.0, 9.4, 0.5], dim: false, when: bare, info: 'A fracture of enamel and dentin that stops short of the pulp. The broken corner is not reattached here; it is rebuilt in composite.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: onPlane(3.95, 0), dim: false, when: bare, info: 'Enamel: the bond to etched enamel is the strongest and seals the edge of the filling.' });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', sub: 'exposed', anchor: onPlane(2.6, 0.1), dim: false, when: bare, info: 'Exposed dentin is sensitive; it is sealed with the bonding agent before the composite goes on.' });
fig.part(shell, { inPlace: true, name: 'Palatal shell', sub: 'thin enamel shade', anchor: [3.4, 8.9, 0.38], dim: false, info: 'After a short bevel, etching and bonding, a thin layer of enamel-shade composite is built on the palatal side, often against a silicone guide taken from a wax-up. It sets the new edge and back wall.' });
fig.part(body, { inPlace: true, name: 'Dentin layer', sub: 'warmer, opaque', anchor: [3.0, 7.4, 0.35], dim: false, info: 'An opaque dentin-shade composite replaces the lost dentin, so the corner does not look grey or see-through.' });
fig.part(outer, { inPlace: true, name: 'Enamel layer', sub: 'translucent', anchor: [3.4, 8.2, 1.0], dim: false, info: 'A translucent enamel-shade layer covers the labial face and blends into the tooth over the bevel.' });
const finished = fig.part(outer, { inPlace: true, name: 'Composite', sub: 'shaped and polished to match', anchor: [3.2, 8.6, 0.95], accent: true, dim: false, info: 'The finished bonding: tooth-coloured composite in layers, bonded to enamel and dentin, polished to the shine and shape of the tooth.' });

// --- tools in fig.world (parked out of view and hidden)
const light = DK.curingLight(), bur = DK.bur({ shape: 'flame', diameter: 1.2, head: 6 });
[light, bur].forEach(o => fig.world.add(DK.inFront(o)));
fig.part(light, { inPlace: true, name: 'Curing light', sub: 'each layer', anchor: [0, 6, 0], info: 'Blue light sets each layer before the next one is added.' });
fig.part(bur, { inPlace: true, name: 'Finishing bur', anchor: [0, 6, 0], info: 'Fine finishing diamonds, discs and polishing points shape the outline and bring up the shine.' });

// --- params
const enamelC = DK.color(DK.COLORS.enamel), shades = { shell: DK.color(ENAMEL_SHADE), body: DK.color(DENTIN_SHADE), outer: DK.color(ENAMEL_SHADE) };
fig.param('ghost', 0, k => { ghostMat.opacity = 0.22 * k; ghost.visible = k > 0.01; });
fig.param('shell', 0, k => { setGrow(shell, k); st.comp = Math.max(k, st.comp); });
fig.param('body', 0, k => setGrow(body, k));
fig.param('outer', 0, k => { setGrow(outer, k); shell.visible = shell.visible && k < 0.999; });
fig.param('match', 0, k => { [['shell', shell], ['body', body], ['outer', outer]].forEach(([n, m]) => m.material.color.copy(shades[n]).lerp(enamelC, n === 'body' ? 0 : k)); });
fig.param('comp', 0, k => { st.comp = k; });
const lt = { ly: 40, cure: 0 };
const placeLight = () => { light.visible = lt.ly < 30; light.position.set(2.6, lt.ly, 0.6); light.set(lt.cure); };
fig.param('ly', 40, v => { lt.ly = v; placeLight(); });
fig.param('cure', 0, v => { lt.cure = v; placeLight(); });
const b = { bx: 4.2, by: 40, bz: 1.2 };
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; bur.visible = b.by < 30; bur.position.set(b.bx, b.by, b.bz); bur.rotation.set(0.55, 0, 0); }));

// the fracture is the figure's cut: section caps paint enamel and dentin on the fracture face
fig.enableSection([N.x, N.y, N.z], [
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.dentin, L.root], color: DK.COLORS.dentinCap }
]);
fig.section.set(true, C);
fig.standardControls({ explode: false });
fig.view('Labial', { theta: 0, phi: 1.45, zoom: 0.62, focus: [1.2, 7.2, 0], labels: null });
fig.view('Corner', { theta: 0.65, phi: 1.2, zoom: 0.62, focus: [2.0, 7.6, 0], labels: null });

// --- the procedure (camera on +z is labial; mesial is on the viewer's right)
const F = [0.6, 6.4, 0], TOP = s.crownL;
const cure = (labels, key) => [
  { dur: 0.6, hold: 0, set: { ly: TOP + 1.8 }, labels },
  { dur: 0.25, hold: 0.8, set: { cure: 1 }, labels: labels.concat(['Curing light']) },
  { dur: 0.25, hold: 0, set: { cure: 0 } },
  { dur: 0.7, hold: 0.8, set: { ly: 40 }, labels, key: !!key }];
fig.procedure([
  { label: 'Chipped corner', caption: 'The corner has broken off through enamel and dentin; the pulp is not reached.', beats: [
    { dur: 0, hold: 1.2, theta: 0.05, phi: 1.42, zoom: 1, section: true, offset: C, labels: [] },
    { dur: 2.2, hold: 0.6, theta: 0.25, phi: 1.36, zoom: 0.72, focus: F, set: { ghost: 1 }, labels: ['Chipped corner'] },
    { dur: 1.0, hold: 1.8, set: { ghost: 0 }, labels: ['Enamel', 'Dentin'], key: true }] },
  { label: 'Palatal shell', caption: 'After bevelling, etching and bonding, a thin enamel-shade shell rebuilds the palatal wall and edge.', beats: [
    { dur: 1.4, hold: 0.1, theta: 0.42, phi: 1.12, zoom: 0.72, set: { comp: 1 }, labels: [] },
    { dur: 1.8, hold: 0.4, set: { shell: 1 }, labels: ['Palatal shell'] },
    ...cure(['Palatal shell'], true)] },
  { label: 'Dentin layer', caption: 'An opaque dentin shade replaces the lost dentin.', beats: [
    { dur: 1.2, hold: 0.1, theta: 0.32, phi: 1.28, zoom: 0.72, labels: [] },
    { dur: 1.8, hold: 0.4, set: { body: 1 }, labels: ['Dentin layer', 'Palatal shell'] },
    ...cure(['Dentin layer', 'Palatal shell'], true)] },
  { label: 'Enamel layer', caption: 'A translucent enamel shade covers the labial face.', beats: [
    { dur: 1.0, hold: 0.1, theta: 0.22, phi: 1.36, zoom: 0.75, labels: [] },
    { dur: 1.8, hold: 0.4, set: { outer: 1 }, labels: ['Enamel layer'] },
    ...cure(['Enamel layer'], true)] },
  { label: 'Shaped and polished', caption: 'Shaped and polished: the corner matches the tooth.', beats: [
    { dur: 0.9, hold: 0.1, set: { by: 8.6, bx: 4.2, bz: 1.15 }, labels: ['Finishing bur'] },
    { dur: 1.8, hold: 0.1, set: { bx: 1.2, by: 9.2, bz: 1.0, match: 0.6 }, labels: ['Finishing bur'] },
    { dur: 0.8, hold: 0.2, set: { by: 40, match: 0.85 }, labels: [] },
    { dur: 2.4, hold: 2.4, theta: 0.22, phi: 1.4, zoom: 0.95, focus: [0.3, 3.5, 0], labels: ['Composite'], key: true }] }
]);
fig.start();
