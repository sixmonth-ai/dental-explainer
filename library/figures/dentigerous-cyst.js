// Story: a dentigerous (follicular) cyst on an unerupted lower left third molar (FDI 38 = Universal 17), in a mesio-distal cut of the jaw: the thin follicle around the crown fills with fluid, the sac (attached at the neck of the tooth) slowly enlarges, thins and bulges the bone and pushes the tooth deeper toward the inferior alveolar canal. Frame: the quadrant group is mirrored (left side), neighbour 37 at the origin with its CEJ at y = 0, +x mesial in the tooth frame, camera on the buccal side.
// poster: end
const CREST = -1.8, GUM_TOP = 1.1, GUM_H = 3.4, CANAL_R = 1.4;
const BONE = { width: 46, height: 30, depth: 11.5, x: -4 };

const fig = DK.figure({
  fov: 26,
  title: 'Cyst around a wisdom tooth',
  subtitle: 'Dentigerous cyst on an unerupted lower left third molar, FDI 38 (Universal 17). Mesio-distal cut.',
  view: { theta: 0, phi: 1.45, margin: window.DK_MODE === 'image' ? 0.8 : 0.92 }
});

// ---------- teeth: 36, 37 and the unerupted, upright 38 deep in the bone ----------
const quad = new THREE.Group(); quad.scale.x = -1;
const t37 = DK.tooth(37), t36 = DK.tooth(36);
t36.group.position.x = t37.spec.md / 2 + t36.spec.md / 2;
const D0 = 12, D1 = 13.5;                            // depth below the occlusal plane of 37: before, and once the cyst has pushed it down
const imp = DK.impaction({ fdi: 38, neighbour: 37, angle: 0, depth: D0 });
const t38 = imp.tooth, s38 = imp.spec;
let apexY = 0;
t38.layers.dentin.geometry.computeBoundingBox(); apexY = t38.layers.dentin.geometry.boundingBox.min.y;
t38.layers.root.children.forEach(m => { m.geometry.computeBoundingBox(); apexY = Math.min(apexY, m.geometry.boundingBox.min.y + m.position.y); });
const XC = imp.group.position.x;

// ---------- bone (its buccal and lingual faces bulge over the cyst), canal, gum ----------
const bone = DK.bone({ width: BONE.width, height: BONE.height, depth: BONE.depth, cortical: 1.2, crest: 1.6 });
bone.position.set(BONE.x, CREST, 0);
const CANAL_Y = (t37.spec.crownL - s38.crownL - D1) + apexY - CANAL_R + 0.25;   // the pushed-down root tips end on the canal
const path = [[-27, CANAL_Y + 2.2, 0.6], [XC - 6, CANAL_Y + 0.9, 0.4], [XC, CANAL_Y, 0.2], [6, CANAL_Y - 0.9, 0], [19, CANAL_Y - 1.2, -0.2]];
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.7, DK.mat('nerve'), { caps: false });
const canal = new THREE.Group(); canal.add(lumen, nerve);
const gum = DK.gingiva({ width: BONE.width, height: GUM_H, depth: 12, crest: 1.4, around: [{ x: t36.group.position.x - BONE.x, z: 0, md: t36.spec.mdC, bl: t36.spec.blC }, { x: -BONE.x, z: 0, md: t37.spec.mdC, bl: t37.spec.blC }] });
gum.position.set(BONE.x, GUM_TOP, 0);
quad.add(bone, canal, gum, t36.group, t37.group, imp.group);

// ---------- the sac: attached at the neck of 38, enclosing the crown; lining + fluid, both closed solids ----------
const NY = 40, NT = 64;
function sacGeometry() {
  const g = new THREE.BufferGeometry(), pos = new Float32Array((NY * NT + 2) * 3), idx = [];
  for (let i = 0; i < NY - 1; i++) for (let j = 0; j < NT; j++) {
    const a = i * NT + j, b = i * NT + (j + 1) % NT, c = (i + 1) * NT + j, d = (i + 1) * NT + (j + 1) % NT;
    idx.push(a, c, b, b, c, d);
  }
  const B = NY * NT, Tp = B + 1;
  for (let j = 0; j < NT; j++) { idx.push(B, j, (j + 1) % NT); idx.push(Tp, (NY - 1) * NT + (j + 1) % NT, (NY - 1) * NT + j); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
// shape at growth k: radius per height (narrow at the neck, bulging round the crown, domed on top), drifting distally as it grows
function sacShape(g, k, grow) {
  const rc = s38.mdC / 2 + 0.15 + grow, R = DK.util.lerp(s38.md / 2 + 0.25, 8.6, k) + grow, y0 = -0.35 - grow * 0.6;
  const top = DK.util.lerp(s38.crownL + 0.3, s38.crownL + 3.1, k) + grow, yb = DK.util.lerp(s38.crownL * 0.55, s38.crownL * 0.5, k);
  const dx = DK.util.lerp(0, -2.4, k), zmax = DK.util.lerp(s38.bl / 2 + 0.45, 4.7, k) + grow;
  const p = g.attributes.position.array;
  for (let i = 0; i < NY; i++) {
    const v = i / (NY - 1), y = y0 + (top - y0) * v;
    let r;
    if (y <= yb) r = rc + (R - rc) * Math.sin(Math.PI / 2 * DK.util.clamp((y - y0) / (yb - y0), 0, 1));
    else r = R * Math.sqrt(Math.max(0, 1 - Math.pow((y - yb) / (top - yb), 2)));
    r = Math.max(r, 0.05);
    const sx = dx * DK.util.smooth(0, 1, (y - y0) / (top - y0)), rz = Math.min(r * 0.98, zmax * Math.max(0.05, r / R) + (r < R ? 0 : 0));
    for (let j = 0; j < NT; j++) {
      const a = j / NT * Math.PI * 2, o = (i * NT + j) * 3;
      p[o] = sx + r * Math.cos(a); p[o + 1] = y; p[o + 2] = -Math.min(rz, r) * Math.sin(a);
    }
  }
  const B = NY * NT * 3; p[B] = 0; p[B + 1] = y0; p[B + 2] = 0; p[B + 3] = dx; p[B + 4] = top; p[B + 5] = 0;
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
}
const liningMat = DK.mat('gingiva', { color: 0xC9A49C, cap: 0xB58C84, roughness: 0.6 });
const fluidMat = DK.mat('pulp', { color: 0xE9DFC6, cap: 0xEDE3CC, roughness: 0.2, clearcoat: 0.5 });
const lining = new THREE.Mesh(sacGeometry(), liningMat), fluid = new THREE.Mesh(sacGeometry(), fluidMat);
imp.group.add(lining, fluid);

// bone expansion: the buccal and lingual faces bulge out over the sac (cortex thinned and pushed out)
const bLayers = [bone.userData.layers.cortical, bone.userData.layers.cancellous].map(m => ({ m, base: m.geometry.attributes.position.array.slice(), nrm: m.geometry.attributes.normal.array.slice() }));
let lastBulge = 0;
function bulge(amount, cx, cy) {   // cx, cy in the quad frame
  if (amount < 1e-3 && lastBulge < 1e-3) return; lastBulge = amount;
  bLayers.forEach(({ m, base, nrm }) => {
    if (amount < 1e-3) { m.geometry.attributes.position.array.set(base); m.geometry.attributes.normal.array.set(nrm); m.geometry.attributes.position.needsUpdate = m.geometry.attributes.normal.needsUpdate = true; return; }
    const p = m.geometry.attributes.position.array, ox = bone.position.x + m.position.x, oy = bone.position.y + m.position.y, half = BONE.depth / 2;
    for (let i = 0; i < p.length; i += 3) {
      const z = base[i + 2], w = Math.abs(z) / half; if (w < 0.55) { p[i + 2] = z; continue; }
      const dxx = base[i] + ox - cx, dyy = base[i + 1] + oy - cy, gss = Math.exp(-(dxx * dxx) / (2 * 7 * 7) - (dyy * dyy) / (2 * 5.5 * 5.5));
      p[i + 2] = z + Math.sign(z) * amount * gss * DK.util.smooth(0.55, 1, w);
    }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
  });
}

let sacAnchor = [0, s38.crownL + 0.3, 0], grown = 0;
// ---------- parts ----------
fig.part(quad, { name: 'Jaw', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', sub: 'thinned and bulging', anchor: () => [XC - BONE.x - 2, -9, BONE.depth / 2 + 1.2], labelOffset: [-90, -70], dim: false, when: (e, sec) => !sec.enabled && grown > 0.5, info: 'As the cyst slowly enlarges, the bone around it is resorbed and the outer plate is pushed out into a smooth bulge.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'The tooth has not come through: the gum over it is closed.' });
fig.part(t36.group, { inPlace: true, name: '36', label: false, info: 'Lower left first molar (Universal 19).' });
fig.part(t37.group, { inPlace: true, name: '37', anchor: [0, 5.5, t37.spec.bl / 2], labelOffset: [0, -70], info: 'Lower left second molar (Universal 18). A large cyst can push on its roots.' });
fig.part(t38.group, { inPlace: true, name: '38', sub: 'unerupted', anchor: [0, s38.crownL * 0.45, 0.4], labelOffset: [-60, 110], dim: false, when: (e, sec) => sec.enabled, info: 'Lower left third molar (Universal 17) that never came through. Its crown sits inside the sac.' });
const sacPart = fig.part(fluid, { inPlace: true, name: 'Follicle', sub: 'thin sac round the crown', accent: true, anchor: () => sacAnchor, labelOffset: [100, -60], dim: false, when: (e, sec) => sec.enabled, info: 'Fluid collects between the crown and the follicle that formed it. The sac stays attached at the neck of the tooth and grows slowly, often without pain, and is usually found on an X-ray.' });
fig.part(canal, { inPlace: true, name: 'Nerve canal', sub: 'inferior alveolar', anchor: [6, CANAL_Y - 1.3, 0.4], labelOffset: [30, 60], dim: false, when: (e, sec) => sec.enabled, info: 'Carries the nerve to the lower teeth, lip and chin. The cyst pushes the tooth down toward it.' });

// ---------- the growth param: sac size, tooth depth, bone bulge ----------
fig.param('cyst', 0, k => {
  grown = k;
  imp.set({ angle: 0, depth: DK.util.lerp(D0, D1, DK.util.smooth(0.3, 1, k)) });
  sacShape(lining.geometry, k, DK.util.lerp(0.28, 0.5, k)); sacShape(fluid.geometry, k, 0);
  const bb = fluid.geometry.boundingBox;
  sacAnchor = [bb.min.x + 1.6 * (1 - k) + 3.2 * k, (bb.min.y + bb.max.y) / 2 + 2.0 * k + 2.0, 0.3];
  const cyQ = imp.group.position.y + (bb.min.y + bb.max.y) / 2, cxQ = imp.group.position.x + (bb.min.x + bb.max.x) / 2;
  bulge(3.0 * DK.util.smooth(0.25, 1, k), cxQ, cyQ);
});
let shownSub = '';
fig.onFrame(() => {
  const s = grown > 0.25 ? ['Cyst', 'fluid-filled sac'] : ['Follicle', 'thin sac round the crown'];
  if (s[1] !== shownSub) { shownSub = s[1]; sacPart.name = s[0]; sacPart.sub = s[1]; sacPart.el.innerHTML = s[0] + '<small>' + s[1] + '</small>'; }
});

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  { objects: [lining], color: 0xB58C84, kind: 'gingiva' },
  { objects: [fluid], color: 0xEDE3CC, kind: 'plain' },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [t36.layers.enamel, t37.layers.enamel, t38.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t36.layers.root, t36.layers.dentin, t37.layers.root, t37.layers.dentin, t38.layers.root, t38.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t36.layers.pulp, t37.layers.pulp, t38.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.slider('Cyst', 0, 1, 0.01, 0, v => fig.goTo({ set: { cyst: v } }, 0));
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 6], offset: 0 } });
fig.view('Bulge', { theta: 0.5, phi: 0.55, zoom: 1.0, focus: 'auto', section: false, labels: ['Bone', '37'] });

// story: the jaw, closed → the cut sweeps in on a buried 38 with a thin follicle → fluid fills it, the sac grows →
// push in on the tooth pushed down onto the canal → the outside of the jaw: a bulge → hero cut
quad.updateMatrixWorld(true);
const W = v => new THREE.Vector3(v[0], v[1], v[2]).applyMatrix4(quad.matrixWorld);
const C = W([XC - 1.5, -12, 0]), APEX = W([XC, CANAL_Y + 3, 0]);
fig.story([
  { dur: 0, hold: 1.3, theta: 0.6, phi: 1.2, zoom: 1.05, section: false, set: { cyst: 0 }, labels: ['37'], caption: 'Behind 37, nothing shows in the mouth.' },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 1.4, theta: 0, phi: 1.45, zoom: 0.8, focus: [C.x, C.y, 0], offset: 0, labels: ['38', 'Follicle'], caption: 'Under the bone, a wisdom tooth that never came through, wrapped in a thin follicle.' },
  { dur: 3.2, hold: 1.4, zoom: 0.85, set: { cyst: 1 }, labels: ['Cyst', '38'], caption: 'Fluid collects round the crown and the sac slowly grows.' },
  { dur: 2.0, hold: 1.8, zoom: 0.62, focus: [APEX.x, APEX.y, 0], labels: ['Nerve canal', '38'], caption: 'It pushes the tooth down toward the nerve canal.' },
  { dur: 0, hold: 0, section: false },
  { dur: 2.4, hold: 1.8, theta: 0.5, phi: 0.55, zoom: 1.0, focus: 'auto', labels: ['Bone'], caption: 'Outside, the jaw bulges where the bone has thinned.' },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 2.4, theta: 0.1, phi: 1.42, zoom: 0.92, focus: [C.x - 2, C.y + 1, 0], offset: 0, drift: 0, labels: ['Cyst', '38', '37', 'Nerve canal'], caption: '' }
]);
fig.start();
