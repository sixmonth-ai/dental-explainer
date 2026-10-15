// Gum graft (connective tissue graft under a coronally advanced flap) on the lower left canine (FDI 33 = Universal 22) with
// poster: step 4
// labial recession, labio-lingual cut: the exposed root, a strip of connective tissue taken from the palate, the graft laid over
// the root, then the gum flap drawn up over it so the root is covered (dental-facts.md §17, Gingival recession). Patient-facing.
// Frame: tooth 33 mirrored (scale.x = -1, a preset tooth has right-side chirality), so world +x = distal; +z = labial; y up,
// CEJ at y = 0. The cut removes the +x half; the camera on +x sees it with the labial side on the left. Sizes in mm.
const { smooth, lerp } = DK.util;
const CREST = -1.8;          // healthy crest, ~2 mm below the CEJ
const M0 = 1.5;              // healthy labial margin, on the enamel
const M1 = -3.0;             // receded margin: 3 mm of root showing below the CEJ
const DEHISCENCE = 3.2;      // labial bone lost with the recession (it stays lost: the graft covers the root, bone does not regrow)
const GRAFT = { top: -0.2, bottom: CREST - DEHISCENCE - 1.6, half: 1.05, thick: 0.9 };   // th half-width (rad) around the labial

const fig = DK.figure({
  fov: 30,
  title: 'Gum graft',
  subtitle: 'Lower left canine, FDI 33 (Universal 22). Graft from the palate.',
  view: { theta: 0.55, phi: 1.36 }
});

const tooth = DK.tooth(33), s = tooth.spec; tooth.group.scale.x = -1;
const LAB = s.blC / 2;

// --- bone with the labial dehiscence of the recession (kept through the whole procedure)
const BONE = { width: 14, height: 21, depth: s.blC + 2.4, cortical: 0.8, crest: 1.1 };
const bone = DK.perioBone(Object.assign({}, BONE, { loss: { defects: [{ x: 0, z: LAB + 0.9, depth: DEHISCENCE, rx: 2.8, rz: 2.2 }] }, level: 1 }));
bone.position.y = CREST;
const pdl = DK.perioPdl(s, 0.2, CREST + bone.crestAt(0, LAB + 0.2) + 0.2); tooth.group.add(pdl);

// --- gingiva whose labial margin can recede or be advanced (local helper around DK.blockGeometry, as in gum-recession)
const G = { width: 14.6, height: 8, depth: s.blC + 3.6, crest: 1.2, rise: 0.9 };
const cuff = (x, z) => { const a = s.mdC / 2, b = s.blC / 2, rho = Math.pow(Math.pow(Math.abs(x) / a, 2.3) + Math.pow(Math.abs(z) / b, 2.3), 1 / 2.3);
  return G.rise * DK.util.smooth(1.7, 0.1, (rho - 1) * Math.min(a, b)); };
const notch = (x, z) => Math.pow(Math.max(0, 1 - Math.pow(x / 3.0, 2)), 0.8) * DK.util.smooth(0.2, 2.2, z);
const gumTop = k => (x, z) => cuff(x, z) - k * (M0 - M1) * notch(x, z) + (1 - k) * 0.5 * notch(x, z) * thick(z);
const thick = z => DK.util.smooth(LAB - 0.5, LAB + 0.5, z);   // the advanced flap rides a little higher over the graft
const gum = new THREE.Mesh(DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(1)), DK.mat('gingiva'));
gum.position.y = M0 - G.rise;
const setGum = k => { const g2 = DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(k)), p = gum.geometry.attributes.position;
  p.array.set(g2.attributes.position.array); p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere(); g2.dispose(); };

// --- the connective tissue graft: a curved strip hugging the labial root surface (a deformed box: closed, section-ready)
const graftGeo = new THREE.BoxGeometry(1, 1, 1, 24, 20, 1), gp = graftGeo.attributes.position;
for (let i = 0; i < gp.count; i++) {
  const u = gp.getX(i) + 0.5, v = gp.getY(i) + 0.5, w = gp.getZ(i) + 0.5;
  const oval = Math.sqrt(Math.max(0.08, 1 - Math.pow(2 * u - 1, 6))), mid = (GRAFT.bottom + GRAFT.top) / 2;   // rounded strip outline
  const th = Math.PI / 2 + (u - 0.5) * 2 * GRAFT.half, y = mid + (v - 0.5) * (GRAFT.top - GRAFT.bottom) * oval;
  const edge = Math.min(1, Math.sin(Math.PI * u) * 1.6) * Math.min(1, Math.sin(Math.PI * v) * 2.2);   // thins to the borders
  const q = DK.toothSurfaceAt(s, Math.max(y, -s.rootL + 2), th), d = Math.hypot(q.x, q.z) || 1, off = 0.03 + w * GRAFT.thick * (0.25 + 0.75 * edge);
  gp.setXYZ(i, q.x + q.x / d * off, y, q.z + q.z / d * off);
}
graftGeo.computeVertexNormals();
const GRAFT_COL = 0xe2b9ae;
const graft = new THREE.Mesh(graftGeo, DK.mat('gingiva', { color: GRAFT_COL, cap: GRAFT_COL })); tooth.group.add(graft);
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0 });

// --- parts
fig.part(tooth.group, { name: 'Canine 33', label: false, info: 'Lower left canine (Universal 22) with gum recession on the lip side.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The thin bone over the root was lost with the recession. A graft covers the root; it does not rebuild this bone.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum around the tooth. In surgery it is loosened as a flap so it can be drawn up over the graft.' });
const cutOn = (e, sec) => sec.enabled;
const zLab = y => DK.toothSurfaceAt(s, y, Math.PI / 2).z;
const P = { graft: 0, flap: 0 };
const rootPart = fig.part(tooth.layers.dentin, { inPlace: true, name: 'Exposed root', anchor: [0.3, -1.5, zLab(-1.5) + 0.05], labelOffset: [-110, 20], when: () => P.flap < 0.5 && P.graft < 0.5, dim: false, info: 'Root surface uncovered by gum recession: sensitive, and softer than enamel.' });
fig.part(graft, { inPlace: true, name: 'Graft', sub: 'tissue from the palate', anchor: [0, -2.4, zLab(-2.4) + 0.7], labelOffset: [-130, -30], accent: true, dim: false, info: 'A thin strip of connective tissue taken from under the surface of the palate, laid over the exposed root and stitched in place.' });
fig.part(gum, { inPlace: true, name: 'Gum flap', sub: 'drawn up over the graft', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.12, M0 - 1.4 - gum.position.y, zLab(M0 - 1.4) + 1.6], labelOffset: [-120, -50], when: (e, sec) => sec.enabled && P.flap > 0.5, dim: false, info: 'The gum next to the recession is loosened and moved up (a coronally advanced flap) to cover the graft and bring it a blood supply.' });
fig.part(bone, { inPlace: true, name: 'Bone edge', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.12, bone.crestAt(0, zLab(CREST - DEHISCENCE) + 0.4) - 0.3, zLab(CREST - DEHISCENCE) + 0.6], labelOffset: [-120, 60], when: cutOn, dim: false, info: 'The bone stays where the recession left it; the graft and flap cover the root above it.' });

// --- section: labio-lingual through the middle of the canine (removes the +x half; camera on +x sees the cut)
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [graft], color: GRAFT_COL, kind: 'gingiva' },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.root, tooth.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });

// --- params: the graft arrives from outside (0) and settles on the root (1); the flap goes from receded (0) to covering (1)
fig.param('graft', 0, k => { P.graft = k; graft.visible = k > 0.01; graft.position.set(0, (1 - k) * 4.5, (1 - k) * 6); graft.rotation.x = (1 - k) * -0.5; });
fig.param('flap', 0, k => { P.flap = k; setGum(1 - k); });

// --- the procedure
const SIDE = { theta: Math.PI / 2 - 0.18, phi: 1.42 };
const CAM = Object.assign({ zoom: fig.mode === 'image' ? 0.66 : 0.8, focus: [0, 0.4, 1.0], fov: 28 }, SIDE);
fig.procedure([
  { label: 'Exposed root', caption: 'The gum has pulled back and the root shows.', beats: [
    { dur: 0, hold: 1.3, theta: 0.45, phi: 1.36, zoom: 0.85, focus: [0, 0.5, 1], section: false, set: { graft: 0, flap: 0 }, labels: ['Exposed root'] },
    Object.assign({ dur: 2.2, hold: 0.2, labels: [] }, SIDE),
    { dur: 0, hold: 0, section: true, offset: 6 },
    Object.assign({ dur: 2.0, hold: 2.0, offset: 0, labels: ['Exposed root', 'Bone edge'], key: true }, CAM)] },
  { label: 'Graft from the palate', caption: 'A thin strip of tissue is taken from the roof of the mouth.', beats: [
    { dur: 0.1, hold: 0, set: { graft: 0.02 }, labels: [] },
    { dur: 1.6, hold: 1.6, set: { graft: 0.35 }, labels: ['Graft'], key: true }] },
  { label: 'Graft over the root', caption: 'It is laid over the exposed root and stitched in place.', beats: [
    { dur: 2.2, hold: 2.0, set: { graft: 1 }, labels: ['Graft', 'Bone edge'], key: true }] },
  { label: 'Covered by the gum', caption: 'The gum is drawn up over the graft: the root is covered again.', beats: [
    { dur: 2.4, hold: 0.4, set: { flap: 1 }, labels: ['Gum flap'] },
    Object.assign({ dur: 1.6, hold: 2.4, labels: ['Gum flap', 'Graft', 'Bone edge'], key: true }, CAM)] }
]);
fig.start();
