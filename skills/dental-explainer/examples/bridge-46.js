// Example: a 3-unit zirconia bridge replacing the mandibular right first molar (FDI 46 = Universal 30) on prepared 45 and 47.
// Exploded assembly (the bridge lifts off its abutments as one piece), then a bucco-lingual cut through the pontic shows how
// its base meets the resorbed ridge. Panel buttons swap the pontic design. Frame: +x = mesial, +z = buccal, abutment CEJs at y = 0.
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };            // monolithic zirconia (dental-facts.md §14)
const MATERIAL = 'zirconia';
const t45s = DK.toothPreset(45), t46s = DK.toothPreset(46), t47s = DK.toothPreset(47);
const X45 = t46s.md / 2 + t45s.md / 2, X47 = -(t46s.md / 2 + t47s.md / 2), XP = 0;     // contact-to-contact spacing
const CREST = -1.8, GUM_Y = 1.1, DIP = 1.6;                                            // ridge resorbed ~1.6 mm under the lost tooth
const dip = x => -DIP * Math.exp(-Math.pow((x - XP) / 4.6, 2));
const GUM = { width: 36, height: 3.4, depth: 11.6, crest: 1.4 };
const ridgeY = z => GUM_Y + dip(XP) - GUM.crest * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(z / (GUM.depth * 0.45), 2)))) - 0.15;   // ridge top under the pontic (0.15 mm of tissue pressure)

const fig = DK.figure({
  title: 'Three-unit bridge replacing 46',
  subtitle: 'FDI 46 (Universal 30) on abutments 45 and 47. Monolithic zirconia.',
  view: { theta: 0.75, phi: 1.22 }
});

// --- context: resorbed ridge, gingiva, abutment roots
const bone = DK.bone({ width: 36, height: 19, depth: 11, cortical: 1.2, crest: 1.6, scallop: (x, z) => dip(x - 1) });
bone.position.set(-1, CREST, 0);
const gum = DK.gingiva(Object.assign({ scallop: (x, z) => dip(x - 1), around: [{ x: X45 + 1, z: 0, md: t45s.mdC, bl: t45s.blC, rise: 0.8 }, { x: X47 + 1, z: 0, md: t47s.mdC, bl: t47s.blC, rise: 0.8 }] }, GUM));
gum.position.set(-1, GUM_Y, 0);
const r45 = DK.tooth(t45s, { omit: ['enamel', 'dentin'] }), r47 = DK.tooth(t47s, { omit: ['enamel', 'dentin'] });
const p45 = DK.prep(r45.spec, PREP), p47 = DK.prep(r47.spec, PREP);
r45.group.add(p45); r47.group.add(p47); r45.group.position.x = X45; r47.group.position.x = X47;

// --- the bridge: two retainers on the preps, the pontic, two connectors (one piece)
const bridge = DK.bridge({
  material: MATERIAL, region: 'posterior',
  units: [{ spec: t45s, x: X45, role: 'abutment', prep: PREP }, { spec: t46s, x: XP, role: 'pontic' }, { spec: t47s, x: X47, role: 'abutment', prep: PREP }],
  pontic: { design: 'modified ridge lap', ridgeY }
});
const pontics = { 'Modified ridge lap': bridge.pontics[0] };
['ovate', 'sanitary'].forEach(d => { const p = DK.pontic(t46s, { design: d, ridgeY, depth: 1.2, clearance: 3 }, MATERIAL); p.position.x = XP; p.visible = false; bridge.add(p); pontics[d === 'ovate' ? 'Ovate' : 'Sanitary'] = p; });
const conn = bridge.connectors[0], CS = conn.size;

fig.part(bone, { name: 'Bone', label: false, explode: [0, 0, 0], info: 'Alveolar ridge: resorbed where 46 was lost.' });
fig.part(gum, { name: 'Ridge', anchor: [XP + 1, -2.3, 4.6], explode: [0, 0, 0], info: 'Edentulous ridge mucosa. The pontic rests on it lightly (or clears it); it has no root and is not attached to the gum.' });
fig.part(r45.group, { name: 'Abutment 45', sub: 'prepared', anchor: [0, 4.5, t45s.blC / 2 - PREP.axial], info: `Second premolar prepared for a full-coverage retainer: ~${PREP.axial} mm axial, ~${PREP.occlusal} mm occlusal.` });
fig.part(r47.group, { name: 'Abutment 47', sub: 'prepared', anchor: [0, 4.5, t47s.blC / 2 - PREP.axial], info: 'Second molar prepared for the distal retainer. Both preps need one path of insertion.' });
fig.part(bridge, { name: 'Bridge', label: false, explode: [0, 12, 0], info: 'One rigid piece: retainer – connector – pontic – connector – retainer, cemented on both abutments.' });
const ret45 = bridge.units.find(u => u.x === X45).mesh;
fig.part(ret45, { inPlace: true, name: 'Retainer', sub: 'crown on 45', anchor: [0, 5.5, t45s.bl / 2 - 0.2], info: 'The part of the bridge cemented to an abutment: here a full-coverage crown.' });
fig.part(bridge.pontics[0], { inPlace: true, name: 'Pontic', sub: 'replaces 46', anchor: [0, 5, t46s.bl / 2 - 0.4], dim: false, accent: true, info: 'The artificial tooth. Modified ridge lap: touches the ridge on the buccal slope only, convex and clear of it lingually so floss passes under it.' });
fig.part(conn, { inPlace: true, name: 'Connector', sub: `${CS.h} × ${CS.w} mm ≈ ${CS.area} mm²`, anchor: [0, CS.h / 2, CS.w / 2 - 0.1], info: 'Joins pontic to retainer. Zirconia needs about 12 mm² here (posterior 3-unit); lithium disilicate about 16 mm². Height matters more than width.' });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bridge], color: 0xe4e0d6 },
  { objects: [r45.layers.root, r47.layers.root, p45, p47], color: DK.COLORS.dentinCap },
  { objects: [r45.layers.pulp, r47.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ section: { label: 'Cut', range: [-6, 14], offset: XP } });
const btns = {};
Object.keys(pontics).forEach(k => { btns[k] = fig.button(k, () => { Object.keys(pontics).forEach(n => { pontics[n].visible = n === k; btns[n].setAttribute('aria-pressed', n === k); }); fig.parts.find(p => p.name === 'Pontic').obj = pontics[k]; }); });
btns['Modified ridge lap'].setAttribute('aria-pressed', 'true');
fig.xrayToggle([bone, gum], 'X-ray', false);

// story (a short film): the bridge in place → it lifts off its abutments → push in on a connector → reseat and turn to the
// mesial side as the cut sweeps through the pontic → the base of the pontic on the ridge
const CY = 0.55 * Math.min(t45s.crownL, t46s.crownL);   // connector centre height (DK.bridge default)
fig.story([
  { dur: 0, hold: 1.4, theta: 0.75, phi: 1.22, zoom: 1.05, labels: [], caption: 'A three-unit bridge replacing the lower right first molar.' },
  { dur: 2.4, hold: 2.2, theta: 1.0, phi: 1.15, explode: 0.8, labels: ['Retainer', 'Pontic', 'Connector', 'Abutment 45'], caption: 'Two retainers on the prepared teeth carry the pontic.' },
  { dur: 1.8, hold: 2.0, zoom: 0.5, focus: [X45 / 2, CY + 9.6, 0], labels: ['Connector'], caption: `The connector: ${CS.area} mm² of zirconia.` },
  { dur: 2.0, hold: 0.3, zoom: 1, focus: 'auto', theta: 1.45, phi: 1.3, explode: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 14 },
  { dur: 2.2, hold: 1.6, offset: XP, labels: ['Pontic', 'Ridge'], caption: 'Cut through the pontic: it rests on the ridge, it is not rooted in it.' },
  { dur: 1.8, hold: 2.6, zoom: 0.72, focus: [XP - 2, 2, 0], theta: 1.25, phi: 1.32, explode: 0.18, labels: ['Pontic', 'Ridge'], caption: 'Modified ridge lap: buccal contact only, convex and clear of the ridge lingually.' }
]);
fig.start();
