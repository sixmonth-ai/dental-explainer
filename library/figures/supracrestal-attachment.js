// Biologic width (supracrestal tissue attachment) on the upper right central incisor (FDI 11 = Universal 8), crown up, labio-
// poster: end
// lingual cut: above the bone crest the gum is attached to the tooth by connective tissue (~1.07 mm) and junctional epithelium
// (~0.97 mm), about 2 mm together, with the sulcus (~0.69 mm) above them (Gargiulo 1961; dental-facts.md §6, §13, §14).
// The story then seats a crown whose margin sits inside that attachment, 0.8 mm above the bone, and the gum turns inflamed.
// Frame: +x = mesial, +z = labial, y up, CEJ at y = 0. The cut removes the mesial half (+x); the camera on +x sees it, labial left.
const { smooth, lerp } = DK.util;
const SULCUS = 0.69, JE = 0.97, CT = 1.07;          // Gargiulo, Wentz & Orban 1961 means (mm)
const CREST = -1.8;                                  // healthy crest, ~2 mm below the CEJ
const CT_TOP = CREST + CT, JE_TOP = CT_TOP + JE, MARGIN = JE_TOP + SULCUS;   // -0.73, 0.24, 0.93 (gingival margin on enamel)
const EDGE = -1.0;                                   // the crown margin placed too deep: 0.8 mm above the crest, inside the attachment

const fig = DK.figure({
  fov: 26,
  title: 'Biologic width',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), crown up.',
  view: { theta: Math.PI / 2 - 0.12, phi: 1.42 }
});
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });

// ---------- natural tooth, and the crowned tooth (root + pulp, a prep and a crown moved down to EDGE)
const tooth = DK.tooth(11), s = tooth.spec;
const restored = DK.tooth(11, { omit: ['enamel', 'dentin'] });
const SX = DK.toothSurfaceAt(s, EDGE, 0).x / DK.toothSurfaceAt(s, 0, 0).x, SZ = DK.toothSurfaceAt(s, EDGE, Math.PI / 2).z / DK.toothSurfaceAt(s, 0, Math.PI / 2).z;
const SY = (s.crownL - EDGE) / s.crownL;
const PREP = { axial: 1.2, occlusal: 1.8, margin: 0.8 };                       // typical anterior ceramic crown (§14)
const prep = DK.prep(s, PREP), crown = DK.restorationCrown(s, 'ceramic', PREP);
const gPrep = new THREE.Group(); gPrep.position.y = EDGE; gPrep.scale.set(SX, SY, SZ); gPrep.add(prep); restored.group.add(gPrep);
const gCrown = new THREE.Group(); gCrown.position.y = EDGE; gCrown.scale.set(SX, SY, SZ); gCrown.add(crown); restored.group.add(gCrown);
restored.layers.pulp.scale.set(0.9, 0.85, 0.9);                                 // keep the pulp horn inside the prepared tooth

// ---------- bone, gum, PDL and the attachment layers (bands hugging the tooth, seen on the cut)
const bone = DK.bone({ width: 12, height: 15, depth: s.blC + 3.0, cortical: 0.8, crest: 1.0 }); bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: MARGIN + 0.55, crest: CREST - 0.6, width: 12.6, depth: s.blC + 4.4 });
const pdl = DK.perioPdl(s, 0.2, CREST + 0.2); fig.world.add(pdl);
// band(y0, y1, w): a closed collar hugging the tooth surface between heights y0 (bottom) and y1 (top), w(u) mm thick (u = 0 at
// the bottom, 1 at the top), its inner wall just inside the tooth so the tooth paints over it on the cut (local helper)
function band(y0, y1, w, color) {
  const K = 10, C = 96, loop = [];
  for (let k = 0; k < K; k++) loop.push([k / K, 1]);              // outer wall, bottom → top
  for (let k = 0; k < 3; k++) loop.push([1, 1 - k / 3]);          // top edge, outward → inward
  for (let k = 0; k < K; k++) loop.push([1 - k / K, 0]);          // inner wall, top → bottom
  for (let k = 0; k < 3; k++) loop.push([0, k / 3]);              // bottom edge, inward → outward
  loop.push(loop[0]);
  const g = DK.gridGeometry(loop.length - 1, C, (i, j) => {
    const [u, o] = loop[i], y = lerp(y0, y1, u), th = j / C * Math.PI * 2, q = DK.toothSurfaceAt(s, y, th), d = Math.hypot(q.x, q.z) || 1, off = lerp(-0.06, w(u), o);
    return [q.x + q.x / d * off, y, q.z + q.z / d * off];
  });
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, DK.mat('pdl', { color, cap: color })); m.material.visible = false; return m;   // only its cut face shows
}
const sulcus = band(JE_TOP, MARGIN, u => 0.04 + 0.12 * u, 0x4a403c);
const je = band(CT_TOP, JE_TOP, u => 0.12 + 0.38 * u, 0xe6c9bd);
const ct = band(CREST + 0.05, CT_TOP, () => 0.6, 0xc58f87);
[sulcus, je, ct].forEach(b => fig.world.add(b));

// a bracket on the cut face, labial to the gum, spanning the attachment (CT + JE): the one accent
const zLab = DK.toothSurfaceAt(s, 0, Math.PI / 2).z, zLin = DK.toothSurfaceAt(s, 0, -Math.PI / 2).z, zBr = zLin - 2.6;   // bracket on the palatal side
const bracket = new THREE.Group();
const bar = (w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), accentMat); m.rotation.y = Math.PI / 2; m.position.set(x, y, z); bracket.add(m); };
bar(0.14, JE_TOP - CREST, 0, (JE_TOP + CREST) / 2, zBr);
bar(0.7, 0.14, 0, JE_TOP, zBr + 0.35);
bar(0.7, 0.14, 0, CREST, zBr + 0.35);
fig.world.add(bracket);

// ---------- parts
fig.part(tooth.group, { name: 'Tooth 11', label: false, info: 'Upper right central incisor (Universal 8), shown crown up.' });
fig.part(restored.group, { name: 'Crowned tooth', label: false, info: 'The same tooth with a crown whose edge was placed too deep under the gum.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The thin labial plate of bone over an upper incisor.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gingiva: in health pink, firm and knife-edged on the enamel.' });
const onCut = (e, sec) => sec.enabled;
const cx = () => (fig.section && fig.section.enabled ? fig.section.offset : 0) + 0.12;
const zAt = (y, out) => DK.toothSurfaceAt(s, y, Math.PI / 2).z + out;
fig.part(sulcus, { inPlace: true, name: 'Sulcus', sub: `mean ${SULCUS} mm`, anchor: () => [cx(), (MARGIN + JE_TOP) / 2, zAt((MARGIN + JE_TOP) / 2, 0.08)], labelOffset: [-150, -50], when: onCut, dim: false, info: 'The shallow groove between gum and tooth. Not part of the attachment; a probe reads it as 1 to 3 mm in health.' });
fig.part(je, { inPlace: true, name: 'Junctional epithelium', sub: `mean ${JE.toFixed(2)} mm`, anchor: () => [cx(), (JE_TOP + CT_TOP) / 2, zAt((JE_TOP + CT_TOP) / 2, 0.2)], labelOffset: [-190, -10], when: onCut, dim: false, info: 'A collar of epithelium that seals the gum onto the tooth surface (Gargiulo 1961 mean 0.97 mm).' });
fig.part(ct, { inPlace: true, name: 'Connective tissue', sub: `mean ${CT.toFixed(2)} mm`, anchor: () => [cx(), (CT_TOP + CREST) / 2, zAt((CT_TOP + CREST) / 2, 0.25)], labelOffset: [-190, 40], when: onCut, dim: false, info: 'Collagen fibres running from the root cementum into the gum, just above the bone (Gargiulo 1961 mean 1.07 mm). The least variable layer.' });
fig.part(bracket, { inPlace: true, name: 'Supracrestal attachment', sub: `about ${(JE + CT).toFixed(1)} mm`, anchor: [0, (JE_TOP + CREST) / 2, zBr], labelOffset: [150, 0], accent: true, when: onCut, dim: false, info: 'Junctional epithelium plus connective tissue, about 2 mm above the bone (2.04 mm in Gargiulo 1961). The 2017 classification renamed "biologic width" to supracrestal tissue attachment.' });
fig.part(bone, { inPlace: true, name: 'Bone crest', anchor: () => [cx(), -0.5 - 0.1, zAt(CREST - 0.5, 0.45)], labelOffset: [-170, 70], when: onCut, dim: false, info: 'About 1.5 to 2 mm below the CEJ in health.' });
fig.part(crown, { inPlace: true, name: 'Crown edge', sub: `${DK.mm(EDGE - CREST)} above the bone`, anchor: [0, 0.15, DK.toothSurfaceAt(s, 0.15, Math.PI / 2).z], labelOffset: [-150, -40], dim: false, info: 'A crown or filling edge placed into the supracrestal attachment: the body keeps trying to re-form it, so the gum stays inflamed or the bone resorbs. A common guideline keeps about 3 mm from the edge to the bone.' });
fig.part(gum, { inPlace: true, name: 'Inflamed gum', sub: 'red, swollen, bleeds', anchor: () => [cx(), MARGIN - 1.0 - gum.position.y, zAt(MARGIN - 1.0, 1.1)], labelOffset: [-140, -70], when: (e, sec) => sec.enabled && P.crown > 0.5, dim: false, info: 'Chronic inflammation next to a margin that invades the attachment. Over time the bone may recede or a pocket forms.' });

// ---------- section: labio-lingual through the incisor (removes the mesial half)
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [ct], color: 0xc58f87, kind: 'gingiva' },
  { objects: [je], color: 0xe6c9bd, kind: 'plain' },
  { objects: [sulcus], color: 0x4a403c },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.root, tooth.layers.dentin, restored.layers.root], color: DK.COLORS.dentinCap },
  { objects: [prep], color: DK.COLORS.dentinCap, kind: 'dentin' },
  { objects: [crown], color: DK.COLORS.ceramicCap },
  { objects: [tooth.layers.pulp, restored.layers.pulp], color: DK.COLORS.pulpCap }
]);
accentMat.clippingPlanes = [];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });
const placeBracket = () => { bracket.position.x = cx(); bracket.visible = !!fig.section.enabled; };
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged && secChanged(); placeBracket(); }; placeBracket();

// ---------- param: 0 = natural tooth, 1 = crown with its edge inside the attachment, gum inflamed
const P = { crown: 0 };
const capTint = (k) => fig.section.caps[0].material.uniforms.uColor.value.copy(DK.color(DK.COLORS.gingivaCap)).lerp(DK.color(DK.COLORS.gingivaInflamedCap), k);
fig.param('crown', 0, k => {
  P.crown = k; const on = k > 0.02;
  tooth.group.visible = !on; restored.group.visible = on;
  gCrown.position.y = EDGE + (1 - Math.min(1, k * 1.6)) * 8;
  const inf = smooth(0.6, 1, k); gum.set({ inflamed: inf }); capTint(inf);
});
fig.view('Attachment', { section: true, offset: 0, theta: Math.PI / 2 - 0.1, phi: 1.45, zoom: 0.36, focus: [0, -0.4, 0.6], set: { crown: 0 }, labels: ['Sulcus', 'Junctional epithelium', 'Connective tissue', 'Supracrestal attachment'] });
fig.view('Deep crown edge', { section: true, offset: 0, theta: Math.PI / 2 - 0.1, phi: 1.45, zoom: 0.38, focus: [0, -0.4, 0.6], set: { crown: 1 }, labels: ['Crown edge', 'Supracrestal attachment', 'Inflamed gum'] });

// ---------- story: the incisor → the cut → push in on the layers → the ~2 mm bracket → a crown edge pushed into it → inflamed
const SIDE = { theta: Math.PI / 2 - 0.1, phi: 1.45 };
fig.story([
  { dur: 0, hold: 1.3, theta: 0.6, phi: 1.3, zoom: 1, section: false, set: { crown: 0 }, labels: [], caption: 'An upper front tooth in its gum and bone.' },
  Object.assign({ dur: 2.2, hold: 0.2, labels: [] }, SIDE),
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.0, hold: 0.8, offset: 0, labels: ['Bone crest'], caption: 'A cut from lip side to palate.' },
  { dur: 2.2, hold: 2.2, zoom: 0.44, focus: [0, -0.4, 0.6], labels: ['Sulcus', 'Junctional epithelium', 'Connective tissue'], caption: 'Above the bone, the gum is attached to the tooth in two layers.' },
  { dur: 1.2, hold: 2.0, zoom: 0.48, labels: ['Supracrestal attachment', 'Bone crest'], caption: 'Together they are about 2 mm: the biologic width.' },
  { dur: 1.6, hold: 0.2, zoom: 0.62, focus: [0, 1.5, zLab], labels: [] },
  { dur: 2.4, hold: 0.6, set: { crown: 1 }, labels: ['Crown edge'], caption: 'A crown whose edge reaches into that attachment...' },
  { dur: 2.0, hold: 2.8, zoom: 0.5, focus: [0, 2.6, 0.6], labels: ['Crown edge', 'Supracrestal attachment', 'Inflamed gum'], caption: '...keeps the gum inflamed.' }
]);
fig.start();
