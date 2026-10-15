// Gum recession on the lower left canine (FDI 33 = Universal 22): the labial gum margin and the thin labial bone plate
// pull back past the CEJ and expose the root (no interproximal loss, Cairo RT1; dental-facts.md §17, Gingival recession).
// Story: healthy tooth, a labio-lingual cut shows the thin bone, the gum and bone recede, then the hero shot shows the
// exposed root beside the cut, with an accent line where the gum used to be. Patient-facing.
// poster: end
// Frame: tooth 33 mirrored (scale.x = -1, a preset tooth has right-side chirality), so world +x = distal; +z = labial; y up,
// CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const CREST = -1.8;          // healthy crest, ~2 mm below the CEJ
const M0 = 1.5;              // healthy labial margin, on the enamel
const M1 = -3.0;             // receded margin: 3 mm of root showing below the CEJ
const DEHISCENCE = 3.2;      // labial bone lost (mm), so the crest stays ~2 mm below the receded margin

const fig = DK.figure({
  fov: 30,
  title: 'Gum recession',
  subtitle: 'Lower left canine, FDI 33 (Universal 22).',
  view: { theta: 0.55, phi: 1.36 }
});

const tooth = DK.tooth(33), s = tooth.spec; tooth.group.scale.x = -1;
const LAB = s.blC / 2;

// --- bone: thin labial plate over the canine root; the recession takes a V of it (a dehiscence) on the labial side only
const BONE = { width: 14, height: 21, depth: s.blC + 2.4, cortical: 0.8, crest: 1.1 };
const bone = DK.perioBone(Object.assign({}, BONE, { loss: { defects: [{ x: 0, z: LAB + 0.9, depth: DEHISCENCE, rx: 2.8, rz: 2.2 }] }, level: 0 }));
bone.position.y = CREST;
const pdl = DK.perioPdl(s, 0.2, CREST + 0.2); tooth.group.add(pdl);

// --- gingiva: one block whose labial margin can recede (local helper around DK.blockGeometry; papillae stay: RT1)
const G = { width: 14.6, height: 8, depth: s.blC + 3.2, crest: 1.2, rise: 0.9 };
const cuff = (x, z) => { const a = s.mdC / 2, b = s.blC / 2, rho = Math.pow(Math.pow(Math.abs(x) / a, 2.3) + Math.pow(Math.abs(z) / b, 2.3), 1 / 2.3);
  return G.rise * DK.util.smooth(1.7, 0.1, (rho - 1) * Math.min(a, b)); };
const notch = (x, z) => Math.pow(Math.max(0, 1 - Math.pow(x / 3.0, 2)), 0.8) * DK.util.smooth(0.2, 2.2, z);   // V-shaped, labial only
const gumTop = k => (x, z) => cuff(x, z) - k * (M0 - M1) * notch(x, z);
const gum = new THREE.Mesh(DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(0)), DK.mat('gingiva'));
gum.position.y = M0 - G.rise;
const setGum = k => { const g2 = DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(k)), p = gum.geometry.attributes.position;
  p.array.set(g2.attributes.position.array); p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere(); g2.dispose(); };

// --- where the gum used to be: an accent line hugging the labial surface at the healthy margin
const lineMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0 });
const linePts = []; for (let i = 0; i <= 24; i++) { const th = DK.util.lerp(0.35, Math.PI - 0.35, i / 24), q = DK.toothSurfaceAt(s, M0 - 0.25, th), d = Math.hypot(q.x, q.z); linePts.push([q.x + q.x / d * 0.12, M0 - 0.25 - 0.35 * Math.pow(Math.sin(th), 3), q.z + q.z / d * 0.12]); }
const oldLine = DK.tube(linePts, 0.09, lineMat, { caps: true }); tooth.group.add(oldLine);

// --- parts
fig.part(tooth.group, { name: 'Canine 33', label: false, info: 'Lower left canine (Universal 22): the longest root in the lower jaw, under a thin plate of bone on the lip side.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The bone over the front of the root is often thinner than a millimetre, so it is quick to go.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Recession usually comes from brushing too hard, gum disease or a thin gum, often several of these together.' });
const cutOn = (e, sec) => sec.enabled;   // bone and gum are not mirrored: their local x is world x; the cut face is at x = offset
const zLab = (y) => DK.toothSurfaceAt(s, y, Math.PI / 2).z;
fig.part(bone, { inPlace: true, name: 'Thin bone', sub: 'on the lip side', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.12, CREST - 2.6, zLab(CREST - 2.6) + 0.55], when: cutOn, dim: false, info: 'A thin labial plate of bone over the root. When it goes, the gum over it follows.' });
const rootPart = fig.part(tooth.layers.dentin, { inPlace: true, name: 'Exposed root', sub: 'sensitive to cold', anchor: [1.2, -1.4, DK.toothSurfaceAt(s, -1.4, 1.2).z + 0.05], accent: true, dim: false, info: 'Root surface has no enamel. Once uncovered it can feel sensitive to cold, sweet or brushing, and it is softer and wears or decays more easily.' });
fig.part(oldLine, { inPlace: true, name: 'Gum line before', anchor: linePts[7], dim: false, info: 'Where the gum margin sat in health, on the enamel just above the CEJ.' });
fig.part(gum, { inPlace: true, name: 'Gum', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.12, M0 - 0.8, zLab(0) + 1.3], when: cutOn, dim: false, info: 'Healthy gum covers the root and seals around the neck of the tooth.' });

// --- section: labio-lingual through the middle of the canine (removes the +x half; camera on +x sees the cut)
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [tooth.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [tooth.layers.root, tooth.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
lineMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-4, 4], offset: 0 } });

// --- params: one number takes the gum and the labial bone back together
fig.param('rec', 0, k => {
  setGum(k); bone.set(k);
  pdl.set(CREST + bone.crestAt(0, LAB + 0.2) + 0.2);
  lineMat.opacity = DK.util.smooth(0.15, 0.6, k);
  oldLine.visible = k > 0.15;
});
fig.slider('Recession', 0, 1, 0.01, 1, v => fig.goTo({ set: { rec: v } }, 0.3));

// --- story: healthy canine → the cut shows the thin bone → gum and bone recede → the exposed root beside the cut
const HERO = { theta: 0.45, phi: 1.4, zoom: 0.8, focus: [-0.4, -0.6, 1.0], fov: 28 };
fig.story([
  { dur: 0, hold: 1.4, theta: 0.3, phi: 1.36, zoom: 1, section: false, labels: [], caption: 'A healthy lower canine: the gum covers the root.' },
  { dur: 2.2, hold: 0.2, theta: Math.PI / 2 - 0.15, phi: 1.42, zoom: 0.95, fov: 28, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.2, hold: 1.6, offset: 0, labels: ['Thin bone', 'Gum'], caption: 'Only a thin plate of bone lies over the front of the root.' },
  { dur: 2.6, hold: 1.6, set: { rec: 1 }, labels: ['Thin bone', 'Gum line before'], caption: 'The gum and the thin bone pull back.' },
  Object.assign({ dur: 2.4, hold: 2.6, labels: ['Exposed root', 'Gum line before', 'Thin bone'], caption: 'The root is exposed: the tooth looks longer and can feel sensitive.' }, HERO)
]);
fig.start();
