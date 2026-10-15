// Library: a three-unit implant bridge replacing the lower right second premolar, first molar and second molar (FDI 45, 46, 47) on two
// poster: end
// implants at 45 and 47; the 46 is a pontic (false tooth) with no implant under it. Story: empty ridge, the implants go in, abutments,
// the bridge comes down, then a mesio-distal cut. Frame: +x = mesial, +z = buccal, y up, crowns' margins near y = 0, mm.
const CREST = -1.8, GUM_Y = 1.1, DIP = 1.2;          // ridge a little lower under the pontic
const IMPLANT = { diameter: 4.1, length: 10, lead: 1.6 };
const s45 = DK.toothPreset(45), s46 = DK.toothPreset(46), s47 = DK.toothPreset(47);
const X45 = s46.md / 2 + s45.md / 2, X47 = -(s46.md / 2 + s47.md / 2);   // contact-to-contact spacing
const MID = (X45 + X47) / 2;
const CROWN_Y = 0.2;                                  // crown margins on the abutment shoulders
const dip = x => -DIP * Math.exp(-Math.pow(x / 4.6, 2));
const GUM = { width: 34, height: 4.6, depth: 11.6, crest: 1.4 };
const ridgeY = z => GUM_Y + dip(0) - GUM.crest * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(z / (GUM.depth * 0.45), 2)))) - 0.15;
const DROP = 8;                                      // how far above its seat the bridge starts

const fig = DK.figure({
  fov: 30,
  title: 'Implant-supported bridge',
  subtitle: 'Two implants replacing 45, 46 and 47 (FDI), lower right.',
  view: { theta: 0.55, phi: 1.22, margin: 0.92 }
});

// ---------------- the ridge ----------------
const bone = DK.bone({ width: 34, height: 15, depth: 11, cortical: 1.2, crest: 1.6, scallop: (x, z) => dip(x + MID) });
bone.position.set(MID, CREST, 0);
const gum = DK.gingiva(Object.assign({ material: 'mucosa', scallop: (x, z) => dip(x + MID),
  around: [{ x: X45 - MID, z: 0, md: 4.6, bl: 4.6, rise: 0.5 }, { x: X47 - MID, z: 0, md: 5.6, bl: 5.6, rise: 0.5 }] }, GUM));
gum.position.set(MID, GUM_Y, 0);

// ---------------- implants and abutments (moved by params) ----------------
const imp = [X45, X47].map(x => { const m = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); m.position.set(x, CREST, 0); return m; });
const abut = [[X45, 4.6], [X47, 5.6]].map(([x, em]) => { const m = DK.abutment({ platform: IMPLANT.diameter, collarHeight: 2.0, postHeight: 3.5, postTopDiameter: em > 5 ? 3.4 : 3.0, emergence: em }); m.position.set(x, CREST, 0); return m; });

// ---------------- the bridge: two crowns, the pontic, two connectors, one zirconia piece ----------------
const bridge = new THREE.Group(); bridge.name = 'Bridge';
const zr = DK.mat('zirconia');
const c45 = DK.restorationCrown(45, 'zirconia', { hollow: false }); c45.position.set(X45, CROWN_Y, 0);
const c47 = DK.restorationCrown(47, 'zirconia', { hollow: false }); c47.position.set(X47, CROWN_Y, 0);
const pontic = DK.pontic(s46, { design: 'modified ridge lap', ridgeY }, 'zirconia');
const CON = DK.CONNECTORS.zirconia.posterior, cy = 0.55 * Math.min(s45.crownL, s47.crownL);
const con1 = DK.connector(s46.md / 2 - 0.6, X45 - s45.md / 2 + 0.6, cy, 0, CON.h, CON.w, 'zirconia');
const con2 = DK.connector(X47 + s47.md / 2 - 0.6, -s46.md / 2 + 0.6, cy, 0, CON.h, CON.w, 'zirconia');
bridge.add(c45, c47, pontic, con1, con2);

[...imp, ...abut, bridge].forEach(o => fig.world.add(o));
fig.param('implants', 0, k => imp.forEach(m => {   // 0 = above the ridge, 1 = seated at the crest, turning in
  const travel = (1 - k) * (IMPLANT.length + 3); m.visible = k > 0.001; m.position.y = CREST + travel; m.rotation.y = -travel / IMPLANT.lead * Math.PI * 2;
}));
fig.param('abut', 0, k => abut.forEach(m => { m.visible = k > 0.001; m.position.y = CREST + (1 - k) * 7; }));
fig.param('bridge', 0, k => { bridge.visible = k > 0.001; bridge.position.y = (1 - k) * DROP; });

// what the camera frames: the ridge and the bridge seated (an invisible box, since the moving parts are in fig.world)
const frame = new THREE.Mesh(new THREE.BoxGeometry(32, 24, 11), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.set(MID, -4.2, 0);

// ---------------- parts ----------------
const onCut = (e, sec) => sec.enabled;
fig.part(frame, { name: 'frame', label: false });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone. The implants fuse with it over a few months before the bridge goes on.' });
fig.part(gum, { name: 'Gap', sub: 'three teeth missing', fit: false, anchor: [0, 0.2, GUM.depth / 2 - 1.2], dim: false, when: () => !bridge.visible || bridge.position.y > 6,
  info: 'Lower right second premolar, first molar and second molar missing (FDI 45, 46, 47; Universal 29, 30, 31).' });
fig.part(imp[0], { inPlace: true, name: 'Implant', sub: 'at 45', anchor: [IMPLANT.diameter / 2, -5, 0.5], dim: false, info: 'Titanium implant where the second premolar was.' });
fig.part(imp[1], { inPlace: true, name: 'Implant ', sub: 'at 47', anchor: [-IMPLANT.diameter / 2, -5, 0.5], dim: false, info: 'Titanium implant where the second molar was.' });
fig.part(abut[0], { inPlace: true, name: 'Abutment', label: false, info: 'Connects the bridge to the implant through the gum.' });
fig.part(abut[1], { inPlace: true, name: 'Abutment ', label: false, info: 'Connects the bridge to the implant through the gum.' });
fig.part(bridge, { inPlace: true, name: 'Bridge', sub: 'three teeth in one piece', anchor: [X45, s45.crownL + 0.6, 0], dim: false,
  info: 'Three crowns joined in one zirconia piece, fixed on the two implants (screwed or cemented).' });
fig.part(pontic, { inPlace: true, name: 'No implant here', sub: 'a false tooth on the gum', accent: true, dim: false, anchor: [0, 1.6, 0.8], labelOffset: [0, 190],
  info: 'The middle tooth (46) is a pontic: carried by its neighbours, resting lightly on the gum. It has no implant and no root.' });

// ---------------- section: mesio-distal, through the implant axes ----------------
fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.mucosaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [bridge], color: DK.COLORS.zirconiaCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', range: [-4, 6], offset: 0.6 } });
fig.xrayToggle([bone, gum], 'X-ray', false);
fig.button('Lift bridge', () => fig.goTo({ set: { bridge: bridge.position.y > 1 ? 1 : 0.55 } }, 0.8));

// ---------------- story ----------------
fig.story([
  { dur: 0, hold: 1.6, theta: 0.55, phi: 1.2, zoom: 1.0, section: false, set: { implants: 0, abut: 0, bridge: 0 }, labels: ['Gap'], caption: 'Three teeth missing at the back of the lower jaw.' },
  { dur: 1.4, hold: 0.1, xray: 0.8, theta: 0.4, labels: [] },
  { dur: 3.0, hold: 1.4, set: { implants: 1 }, labels: ['Implant', 'Implant '], caption: 'Two implants go in, one at each end of the gap.' },
  { dur: 1.4, hold: 0.4, zoom: 1.18, set: { abut: 1 }, labels: [] },
  { dur: 2.6, hold: 1.8, xray: 0, theta: 0.6, phi: 1.18, set: { bridge: 1 }, labels: ['Bridge'], caption: 'A three-tooth bridge is fixed on top of them.' },
  { fov: 26, dur: 2.2, hold: 0.2, zoom: 1, theta: 0, phi: 1.46, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.4, hold: 2.8, offset: 0.6, drift: 0, labels: ['Implant', 'Implant ', 'Bridge', 'No implant here'], caption: 'Two implants carry three teeth: the middle one rests on the gum.' }
]);
fig.start();
