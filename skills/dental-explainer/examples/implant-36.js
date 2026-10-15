// Example: single implant replacing the mandibular left first molar (FDI 36), with neighbours 35 and 37.
// Frame: +x = mesial, +z = buccal, y up. Neighbour CEJs at y = 0. All sizes in mm.
const fig = DK.figure({
  fov: 34,
  title: 'Implant replacing tooth 36',
  subtitle: 'FDI 36 (Universal 19), lower left first molar.',
  view: { theta: 0.75, phi: 1.22 }
});

const CREST = -1.8;               // alveolar crest, below neighbouring CEJs
const IMPLANT = { diameter: 4.1, length: 10 };
const CANAL_Y = CREST - IMPLANT.length - 4.0, CANAL_R = 1.5;

// --- context: bone, canal, gingiva, neighbours
const bone = DK.bone({ width: 34, height: 19, depth: 11, cortical: 1.2, crest: 1.6 });
bone.position.set(-1, CREST, 0);
const canal = new THREE.Group(); canal.name = 'Inferior alveolar canal';
const path = [[-18, CANAL_Y - 0.6, 0.4], [-6, CANAL_Y, 0.2], [6, CANAL_Y + 0.3, 0], [16, CANAL_Y + 0.9, -0.2]];
const tubeOpts = { caps: false };
const lumen = DK.tube(path, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), tubeOpts);
const nerve = DK.tube(path.map(p => [p[0], p[1] - 0.2, p[2] - 0.1]), 0.75, DK.mat('nerve'), tubeOpts);
const artery = DK.tube(path.map(p => [p[0], p[1] + 0.75, p[2] + 0.35]), 0.32, DK.mat('artery'), tubeOpts);
const vein = DK.tube(path.map(p => [p[0], p[1] + 0.6, p[2] - 0.55]), 0.36, DK.mat('vein'), tubeOpts);
canal.add(lumen, nerve, artery, vein);
const gum = DK.gingiva({ width: 34, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: 1 + 5.5 + 3.5, z: 0, md: 5, bl: 7, rise: 0.8 }, { x: 1 - 5.5 - 5.25, z: 0, md: 8, bl: 9, rise: 0.8 }, { x: 1, z: 0, md: 5.6, bl: 5.6, rise: 0.6 }] });
gum.position.set(-1, 1.1, 0);

const t35 = DK.tooth(35); t35.group.position.x = 5.5 + 3.5;      // contact-to-contact spacing
const t37 = DK.tooth(37); t37.group.position.x = -(5.5 + 5.25);

// --- the restoration stack (bottom → top)
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' });
implant.position.y = CREST;
const abut = DK.abutment({ platform: 4.1, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 });
abut.position.y = CREST;
const screw = DK.screw({ diameter: 2.0, length: 8 });
screw.position.y = CREST + 2.0 + 3.5 - 0.4 - 1.6;
const crown = DK.restorationCrown(36, 'zirconia');
crown.position.y = 0.2;

// --- parts (anchor = local point the leader line touches)
fig.part(bone, { name: 'Alveolar bone', sub: 'cortical + cancellous', anchor: [16.5, -4, 3], info: 'Cortical plates surround cancellous (trabecular) bone. Aim for ≥1.5–2 mm of bone buccal and lingual to the implant.' });
fig.part(canal, { name: 'Inferior alveolar canal', sub: 'nerve, artery, vein', anchor: [-14, CANAL_Y - 0.4, 1.5], info: 'Conventional safety margin: ≥2 mm between implant apex and the canal. Paraesthesia risk rises when the implant reaches the canal.' });
fig.part(gum, { name: 'Gingiva', anchor: [12, -0.2, 5.6], info: 'Peri-implant soft tissue seals around the abutment collar (transmucosal part).' });
fig.part(t35.group, { name: '35', sub: '2nd premolar', anchor: [0, 6, 2], label: true, info: 'Mandibular second premolar: usually one root, one canal (≈24% have two or more).' });
fig.part(t37.group, { name: '37', sub: '2nd molar', anchor: [0, 6, 2], info: 'Mandibular second molar: two roots (mesial, distal), often closer together than on the first molar.' });
fig.part(implant, { name: 'Implant body', sub: 'Ø4.1 × 10 mm', anchor: [2.2, -5, 0], explode: [0, 0, 0], accent: true, info: 'Titanium fixture, threaded into bone. Osseointegration typically 3–6 months before conventional loading.' });
fig.part(abut, { name: 'Abutment', sub: 'internal hex', anchor: [2.8, 1.6, 0], explode: [0, 9, 0], info: 'Transmucosal connector. The hex engages the implant so the abutment cannot rotate.' });
fig.part(screw, { name: 'Abutment screw', anchor: [1.3, 0.8, 0], explode: [0, 19, 0], info: 'Holds the abutment to the implant. Tightening torque is manufacturer-specific (e.g. 35 Ncm for one major system).' });
fig.part(crown, { name: 'Crown', sub: 'zirconia, cement-retained', anchor: [-3, 6.5, 4.5], explode: [0, 29, 0], info: 'Restores occlusion; shaped like the lost 36 (5 cusps, wider mesio-distally than bucco-lingually).' });

// --- section: bucco-lingual cut through the implant axis; the mesial half (+x) is cut away
fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve }, { objects: [artery], color: DK.COLORS.artery }, { objects: [vein], color: DK.COLORS.vein },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [t35.layers.enamel], color: DK.COLORS.enamelCap }, { objects: [t35.layers.root, t35.layers.dentin], color: DK.COLORS.dentinCap }, { objects: [t35.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ section: { label: 'Cut', range: [-4, 6], offset: 0 } });
fig.xrayToggle([bone, gum, lumen], 'X-ray', false);

// --- readout: every number is computed from the geometry above
const R = IMPLANT.diameter / 2;
const apexY = CREST - IMPLANT.length;
const toCanal = apexY - (CANAL_Y + CANAL_R);                 // canal path passes y = CANAL_Y near x = 0
const r35 = t35.spec.roots[0], r37m = t37.spec.roots[0];      // 37: roots[0] is the mesial root
const to35 = (t35.group.position.x + r35.x - r35.ra) - R;      // at the cervical level (roots taper apically)
const to37v = Math.abs((t37.group.position.x + r37m.x + r37m.ra)) - R;
const buccal = 11 * 0.86 / 2 - R;
const tag = (v, min) => ({ v: DK.mm(v) + (v >= min ? ' ✓' : ' ⚠'), cls: v >= min ? 'ok' : 'warn' });
fig.setReadout([
  Object.assign({ k: 'To 35 root (≥1.5)' }, tag(to35, 1.5)),
  Object.assign({ k: 'To 37 root (≥1.5)' }, tag(to37v, 1.5)),
  Object.assign({ k: 'Apex → canal (≥2)' }, tag(toCanal, 2)),
  Object.assign({ k: 'Buccal bone at crest (≥1.5)' }, tag(buccal, 1.5))
]);
// story (a short film): establishing shot → the stack lifts as the camera orbits → push in on the screw → reassemble and
// turn to the buccal side as the cut sweeps through the axis → push in on the apex and the nerve canal
const STACK = ['Crown', 'Abutment screw', 'Abutment', 'Implant body'];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.75, phi: 1.22, zoom: 1.05, labels: [], caption: 'A single implant replacing the lower first molar.' },
  { dur: 2.4, hold: 2.2, theta: 1.0, phi: 1.15, explode: 0.75, labels: STACK, caption: 'Four parts, lifted in the order they go in.' },
  { dur: 1.8, hold: 2.0, zoom: 0.6, focus: [0, 9, 0], labels: ['Abutment screw', 'Abutment'], caption: 'The screw clamps the abutment into the implant; the hex stops it turning.' },
  { fov: 26, dur: 2.0, hold: 0.3, zoom: 1, focus: 'auto', theta: 1.3, phi: 1.38, explode: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 2.2, offset: 0, labels: ['Implant body', 'Inferior alveolar canal', 'Alveolar bone'], caption: 'Cut through the axis: the apex stays at least 2 mm above the nerve canal.' },
  { dur: 1.8, hold: 2.6, zoom: 0.7, focus: [0, -6.5, 0], labels: ['Implant body', 'Inferior alveolar canal'], caption: `${DK.mm(toCanal)} of bone between the apex and the canal.` }
]);
fig.start();
