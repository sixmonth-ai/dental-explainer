// Comparison: two ways to replace a missing lower right first molar (FDI 46 = Universal 30), side by side and cut by one mesio-distal section.
// poster: end
// Left set: a 3-unit zirconia bridge on 45 and 47 prepared as abutments (the bridge lifts to show the cut-down teeth and a ghost of what
// was removed). Right set: a single implant with abutment and crown, 45 and 47 intact. Frame: +x = mesial, +z = buccal, CEJs at y = 0, mm.
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };          // monolithic zirconia (dental-facts.md §14)
const IMPLANT = { diameter: 4.1, length: 10 };
const s45 = DK.toothPreset(45), s46 = DK.toothPreset(46), s47 = DK.toothPreset(47);
const X45 = s46.md / 2 + s45.md / 2, X47 = -(s46.md / 2 + s47.md / 2);   // contact-to-contact spacing within each set
const GAP = 36;                                                    // centre-to-centre spacing of the two sets
const BX = -GAP / 2, IX = GAP / 2;                                 // bridge set (viewer's left), implant set (viewer's right)
const CREST = -1.8, GUM_Y = 1.1, DIP = 1.6;                        // ridge resorbed ~1.6 mm under the pontic
const dip = x => -DIP * Math.exp(-Math.pow(x / 4.6, 2));
const GUM = { width: 31, height: 3.4, depth: 11.6, crest: 1.4 };
const BONE = { width: 30.4, height: 19, depth: 11, cortical: 1.2, crest: 1.6 };
const MID = (X45 + X47) / 2;                                       // centre of the three-tooth span
const ridgeY = z => GUM_Y + dip(0) - GUM.crest * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(z / (GUM.depth * 0.45), 2)))) - 0.15;

const fig = DK.figure({
  fov: 30,
  title: 'Implant or bridge?',
  subtitle: 'Replacing the lower right first molar, FDI 46 (Universal 30).',
  view: { theta: 0.42, phi: 1.24, margin: 0.92 }
});

// ---------------- bridge set ----------------
const boneB = DK.bone(Object.assign({ scallop: (x, z) => dip(x + MID) }, BONE)); boneB.position.set(BX + MID, CREST, 0);
const gumB = DK.gingiva(Object.assign({ material: 'mucosa', scallop: (x, z) => dip(x + MID),
  around: [{ x: X45 - MID, z: 0, md: s45.mdC - 2 * PREP.margin, bl: s45.blC - 2 * PREP.margin, rise: 0.8 }, { x: X47 - MID, z: 0, md: s47.mdC - 2 * PREP.margin, bl: s47.blC - 2 * PREP.margin, rise: 0.8 }] }, GUM));
gumB.position.set(BX + MID, GUM_Y, 0);
const r45 = DK.tooth(s45, { omit: ['enamel', 'dentin'] }), r47 = DK.tooth(s47, { omit: ['enamel', 'dentin'] });
const p45 = DK.prep(r45.spec, PREP), p47 = DK.prep(r47.spec, PREP);
r45.group.add(p45); r47.group.add(p47);
r45.group.position.x = BX + X45; r47.group.position.x = BX + X47;
const bridge = DK.bridge({
  material: 'zirconia', region: 'posterior',
  units: [{ spec: s45, x: X45, role: 'abutment', prep: PREP }, { spec: s46, x: 0, role: 'pontic' }, { spec: s47, x: X47, role: 'abutment', prep: PREP }],
  pontic: { design: 'modified ridge lap', ridgeY }
});
bridge.position.x = BX;
// ghost of each abutment's original crown: what the preparation removed
const ghostMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const g45 = new THREE.Mesh(DK.crownGeometry(s45), ghostMat), g47 = new THREE.Mesh(DK.crownGeometry(s47), ghostMat);
r45.group.add(g45); r47.group.add(g47);

// ---------------- implant set ----------------
const boneI = DK.bone(BONE); boneI.position.set(IX + MID, CREST, 0);
const gumI = DK.gingiva(Object.assign({ around: [{ x: X45 - MID, z: 0, md: s45.mdC, bl: s45.blC, rise: 0.8 }, { x: X47 - MID, z: 0, md: s47.mdC, bl: s47.blC, rise: 0.8 }, { x: -MID, z: 0, md: 5.6, bl: 5.6, rise: 0.6 }] }, GUM));
gumI.position.set(IX + MID, GUM_Y, 0);
const t45 = DK.tooth(45), t47 = DK.tooth(47);
t45.group.position.x = IX + X45; t47.group.position.x = IX + X47;
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' });
implant.position.set(IX, CREST, 0);
const abut = DK.abutment({ platform: 4.1, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 });
abut.position.set(IX, CREST, 0);
const crown = DK.restorationCrown(46, 'zirconia', { hollow: false });
crown.position.set(IX, 0.2, 0);

// ---------------- parts ----------------
const top45 = s45.crownL + 1.2;
fig.part(boneB, { name: 'Bone', label: false, fit: false, info: 'Jaw bone. Where a tooth is lost and nothing replaces its root, the ridge slowly shrinks.' });
fig.part(boneI, { name: 'Bone ', label: false, fit: false, info: 'Jaw bone around the implant. The implant fuses with it over a few months.' });
fig.part(gumB, { name: 'Gum', label: false, fit: false, info: 'The gum over the empty ridge. The false tooth rests on it lightly; it is not attached to it.' });
fig.part(gumI, { name: 'Gum ', label: false, fit: false, info: 'Gum around the implant and its neighbours.' });
fig.part(r45.group, { name: 'Bridge', anchor: e => [MID - X45, top45 + 3.6 + 11 * e, 0], dim: false, info: 'Three crowns joined in one piece: two on the filed-down neighbours, a false tooth between them.' });
fig.part(r47.group, { name: 'Abutment 47', label: false, info: 'Lower right second molar, filed down to carry the back crown of the bridge.' });
fig.part(t45.group, { name: 'Implant', anchor: e => [MID - X45, top45 + 3.6 + 11 * e, 0], dim: false, info: 'A titanium screw replaces the root; a crown sits on top. The neighbouring teeth are not touched.' });
fig.part(t47.group, { name: '47', label: false, info: 'Lower right second molar: untouched.' });
fig.part(bridge, { name: 'Bridge crowns', label: false, explode: [0, 11, 0], info: 'One rigid zirconia piece, cemented onto both prepared teeth.' });
fig.part(p47, { inPlace: true, name: 'Neighbours filed down', sub: 'shaded: what is removed', anchor: [-s47.mdC / 2 + PREP.axial + 0.4, 2.6, 0.3], labelOffset: [-150, -10], when: (e, sec) => e > 0.3 || sec.enabled, accent: true, dim: false, info: `To hold the bridge, both neighbours lose about ${PREP.axial} mm from every side and ${PREP.occlusal} mm from the top, healthy or not.` });
fig.part(bridge.pontics[0], { inPlace: true, name: 'False tooth', sub: 'no root', anchor: [0, 1.4, s46.bl / 2 - 0.6], dim: false, info: 'The pontic: carried by its neighbours, resting on the gum. Nothing replaces the root, so the bone under it is not loaded.' });
fig.part(implant, { name: 'Implant body', sub: 'replaces the root', anchor: [IMPLANT.diameter / 2, -5.5, 0], explode: [0, 0, 0], info: `Titanium implant, about Ø${IMPLANT.diameter} × ${IMPLANT.length} mm here, placed in the bone where the root was.` });
fig.part(abut, { name: 'Abutment', label: false, explode: [0, 0, 0], info: 'Connects the crown to the implant through the gum.' });
fig.part(crown, { name: 'Implant crown', label: false, explode: [0, 0, 0], info: 'A single crown on the implant, cleaned like a natural tooth.' });
fig.part(t45.layers.enamel, { inPlace: true, name: 'Neighbours untouched', sub: '45 and 47', anchor: [0, 3.2, s45.bl / 2 - 0.2], dim: false, info: 'An implant needs nothing from the teeth next to it: their enamel stays whole.' });

// ---------------- section: one mesio-distal plane through both sets ----------------
fig.enableSection([0, 0, 1], [
  { objects: [gumB], color: DK.COLORS.mucosaCap },
  { objects: [gumI], color: DK.COLORS.gingivaCap },
  { objects: [boneB.userData.layers.cortical, boneI.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [boneB.userData.layers.cancellous, boneI.userData.layers.cancellous], color: 0xffffff, texture: boneB.userData.layers.cancellous.userData.capTexture },
  { objects: [bridge], color: DK.COLORS.zirconiaCap },
  { objects: [t45.layers.enamel, t47.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [r45.layers.root, r47.layers.root, p45, p47, t45.layers.root, t45.layers.dentin, t47.layers.root, t47.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [r45.layers.pulp, r47.layers.pulp, t45.layers.pulp, t47.layers.pulp], color: DK.COLORS.pulpCap }
]);
ghostMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explodeLabel: 'Lift bridge', section: { label: 'Cut', range: [-5, 6], offset: 0.6 } });
fig.xrayToggle([boneB, boneI, gumB, gumI], 'X-ray', false);
fig.onFrame((dt, e) => { ghostMat.opacity = 0.24 * DK.util.smooth(0.15, 0.7, e); g45.visible = g47.visible = e > 0.12; });

// ---------------- story ----------------
const BOTH = ['Bridge', 'Implant'];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.42, phi: 1.24, zoom: 1.02, labels: BOTH, caption: 'Two ways to replace a missing lower molar.' },
  { dur: 2.4, hold: 2.2, theta: 0.3, phi: 1.2, zoom: 0.62, focus: [BX + MID, 6, 0], explode: 0.85, labels: ['Neighbours filed down', 'False tooth'], caption: 'A bridge needs both neighbours filed down to carry it.' },
  { dur: 2.2, hold: 2.0, theta: -0.1, zoom: 0.62, focus: [IX + MID, 2, 0], xray: 0.85, labels: ['Implant body', 'Neighbours untouched'], caption: 'An implant replaces the root and leaves the neighbours alone.' },
  { fov: 26, dur: 2.0, hold: 0.2, theta: 0.05, phi: 1.42, zoom: 1, focus: 'auto', xray: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.4, hold: 2.8, offset: 0.6, explode: 0.85, zoom: 0.8, focus: [0, -0.6, 0], labels: ['Bridge', 'Implant', 'Neighbours filed down', 'False tooth', 'Implant body', 'Neighbours untouched'], caption: 'Cut through both: filed-down teeth and a false tooth with no root, or an implant root and untouched neighbours.' }
]);
fig.start();
