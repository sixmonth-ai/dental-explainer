// Comparison: two sockets of a removed lower left third molar (FDI 38 = Universal 17) a few days after extraction, side by side in one mesio-distal cut: normal healing (the socket filled by a blood clot) and a dry socket (clot lost, the bony wall bare, gum edges inflamed). Frame per set: mirrored left quadrant, 37 at the origin with its CEJ at y = 0, socket centred where 38 stood.
// poster: end
const CREST = -1.8, GUM_TOP = 1.1, GUM_H = 3.4;
const GAP = 34;                                      // centre-to-centre spacing of the two jaws (mm)
const s38 = DK.toothPreset(38), s37 = DK.toothPreset(37);
const SX = -(s37.md / 2 + s38.md / 2 + 0.3);         // socket centre, distal to 37

const fig = DK.figure({
  fov: 28,
  title: 'Dry socket',
  subtitle: 'Socket of a removed lower left third molar, FDI 38 (Universal 17), days after. Mesio-distal cut.',
  view: { theta: 0.2, phi: 1.36, margin: window.DK_MODE === 'image' ? 0.8 : 0.95 }
});
const ACC = fig.dark ? 0x5A8FB8 : 0x0E3A5C;

// the socket a 38 leaves: its roots and trunk (+ ligament space) and a collar up through the gum
const rootsOf = DK.tooth(DK.toothPreset(38), { omit: ['enamel', 'dentin', 'pulp'] });
const rootGeos = rootsOf.layers.root.children.map(m => m.geometry);
function socketGeos(add) {
  const parts = rootGeos.map(g => DK.inflateGeometry(g, 0.25 + add));
  parts.push(DK.rootGeometry({ x: 0, z: 0, len: 2.6, ra: s38.mdC / 2 + 0.25 + add, rb: s38.blC / 2 + 0.25 + add, taper: 0.12, n0: 2.3, start: GUM_TOP - 0.05 }, { k: 1, add: 0, minR: 0.3 }));
  return parts;
}
const clotMat = DK.mat('pulp', { color: 0x7a3c37, cap: 0x7a3c37, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const G = { cortical: [], cancellous: [], gum: [], gumInf: [], enamel: [], dentin: [], pulp: [], rimInk: [], rimBare: [], voids: [], clot: [] };

function jaw(cx, dry) {
  const quad = new THREE.Group(); quad.scale.x = -1; quad.position.x = cx;
  const t37 = DK.tooth(37);
  const bone = DK.bone({ width: 27, height: 19, depth: 11.5, cortical: 1.2, crest: 1.6 });
  bone.position.set(-6, CREST, 0);
  const gum = DK.gingiva(Object.assign({ width: 27, height: GUM_H, depth: 12, crest: 1.4, around: [{ x: 6, z: 0, md: s37.mdC, bl: s37.blC }] }, dry ? { color: DK.COLORS.gingivaInflamed } : {}));
  gum.position.set(-6, GUM_TOP, 0);
  const sock = new THREE.Group(); sock.position.x = SX;
  const rims = socketGeos(0.3).map(g => new THREE.Mesh(g, DK.mat('cavity')));
  const voids = socketGeos(0).map(g => new THREE.Mesh(g, DK.mat('cavity')));
  [...rims, ...voids].forEach(m => { m.userData.cutOnly = true; sock.add(m); });
  quad.add(bone, gum, t37.group, sock);
  G.cortical.push(bone.userData.layers.cortical); G.cancellous.push(bone.userData.layers.cancellous);
  (dry ? G.gumInf : G.gum).push(gum);
  G.enamel.push(t37.layers.enamel); G.dentin.push(t37.layers.root, t37.layers.dentin); G.pulp.push(t37.layers.pulp);
  (dry ? G.rimBare : G.rimInk).push(...rims); G.voids.push(...voids);
  let clot = null, walls = null;
  if (!dry) {   // the clot: fills the socket and domes a little over the gum
    const cg = socketGeos(-0.12); clot = new THREE.Group();
    cg.forEach(g => { const m = new THREE.Mesh(g, clotMat); clot.add(m); G.clot.push(m); });
    sock.add(clot);
  } else {      // the empty socket's inner walls, seen from above through the gum opening
    walls = new THREE.Group();
    socketGeos(0).forEach(g => walls.add(DK.asHole(new THREE.Mesh(g, DK.mat('cavity', { color: 0xd8cfbd })))));
    sock.add(walls);
  }
  fig.part(quad, { name: dry ? 'Dry socket' : 'Normal healing', sub: dry ? 'clot lost, bone bare' : 'clot fills the socket', anchor: [SX, GUM_TOP + 5.5, 0], labelOffset: [0, -30], accent: dry, dim: false,
    info: dry ? 'Alveolar osteitis: the clot breaks down or is dislodged, leaving the bony wall of the socket bare. Severe throbbing pain typically starts 2 to 4 days after the extraction, often with a bad taste or smell. More common after lower wisdom tooth removal and in smokers.'
      : 'Normal healing: within minutes the socket fills with blood that clots. The clot protects the bone and is the scaffold that gum and then new bone grow into over the following weeks.' });
  fig.part(bone, { inPlace: true, name: dry ? 'Bone (dry)' : 'Bone', label: false, info: 'Jawbone around the socket.' });
  fig.part(t37.group, { inPlace: true, name: dry ? '37 (dry)' : '37', label: false, info: 'Lower left second molar (Universal 18).' });
  fig.part(gum, { inPlace: true, name: dry ? 'Inflamed gum' : 'Gum', label: false, info: dry ? 'The gum edges around a dry socket are often red and sore, with no clot between them.' : 'Gum edges around the clot; they grow across it over one to two weeks.' });
  return { quad, sock, clot, walls, rims };
}
const H = jaw(-GAP / 2, false), D = jaw(GAP / 2, true);

fig.part(H.clot.children[0], { inPlace: true, name: 'Blood clot', anchor: [0, -5, 0.3], labelOffset: [70, 40], dim: false, info: 'A dark red jelly-like clot. Avoid rinsing hard, spitting, drinking through a straw and smoking for the first days so it stays in place.' });
fig.part(D.rims[0], { inPlace: true, name: 'Bare bone', sub: 'the painful part', anchor: (() => { const g = D.rims[0].geometry; g.computeBoundingBox(); return [g.boundingBox.min.x + 0.5, -5.5, 0.3]; })(), labelOffset: [80, 40], accent: false, dim: false, info: 'Without its clot the socket wall is exposed bone, open to food and saliva: this is what hurts. A dentist rinses it and may place a soothing dressing; it heals from the edges over one to two weeks.' });

fig.enableSection([0, 0, 1], [
  { objects: G.cortical, color: DK.COLORS.corticalCap },
  { objects: G.cancellous, color: 0xffffff, texture: G.cancellous[0].userData.capTexture },
  { objects: G.gum, color: DK.COLORS.gingivaCap },
  { objects: G.gumInf, color: DK.COLORS.gingivaInflamedCap },
  ...G.rimInk.map(m => ({ objects: [m], color: DK.RIM, kind: 'plain' })),
  ...G.rimBare.map(m => ({ objects: [m], color: ACC, kind: 'plain' })),
  ...G.voids.map(m => ({ objects: [m], color: DK.holeCap(fig), kind: 'plain' })),
  ...G.clot.map(m => ({ objects: [m], color: 0x7a3c37, kind: 'plain' })),
  { objects: G.enamel, color: DK.COLORS.enamelCap },
  { objects: G.dentin, color: DK.COLORS.dentinCap },
  { objects: G.pulp, color: DK.COLORS.pulpCap }
]);
D.walls.children.forEach(m => { m.material.clippingPlanes = [fig.section.plane]; });
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-5, 5], offset: 0 } });
fig.view('From above', { theta: 0.15, phi: 0.55, zoom: 0.9, section: false, labels: ['Normal healing', 'Dry socket'] });

const fH = [-GAP / 2 - SX, -4, 0], fD = [GAP / 2 - SX, -4, 0];
fig.story([
  { dur: 0, hold: 1.6, theta: 0.2, phi: 0.6, zoom: 0.95, fov: 34, section: false, labels: ['Normal healing', 'Dry socket'] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 1.2, theta: 0.2, phi: 1.36, zoom: 1, fov: 28, offset: 0, labels: ['Normal healing', 'Dry socket'] },
  { dur: 2.2, hold: 2.0, zoom: 0.6, focus: fH, theta: 0.1, labels: ['Blood clot'] },
  { dur: 2.2, hold: 2.2, focus: fD, theta: -0.05, labels: ['Bare bone'] },
  { dur: 2.4, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.2, phi: 1.36, drift: 0, labels: ['Normal healing', 'Dry socket', 'Blood clot', 'Bare bone'] }
]);
fig.start();
