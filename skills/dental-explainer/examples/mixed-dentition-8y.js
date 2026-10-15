// Example: mixed dentition at age 8, lower left quadrant from the buccal side, the jaw bone made see-through to show the
// permanent successors forming under the primary teeth. DK.arch picks the teeth from the AAPD chronology: 31, 32 and 36 have
// erupted; 73, 74, 75 remain (73's roots already resorbing); 33, 34, 35 and 37 are developing in the bone. Straight form,
// so the ordinary bone block fits. Left quadrant: mesial is toward the viewer's left, as seen from the patient's left.
const AGE = 8;
const fig = DK.figure({
  fov: 26,
  title: 'Mixed dentition at age 8',
  subtitle: 'Lower left, buccal view. Primary teeth 73–75 with their successors forming below.',
  view: { theta: 0.12, phi: 1.42 }
});

const arch = DK.arch({ jaw: 'mandible', dentition: 'mixed', age: AGE, side: 'left', form: 'straight', successors: true });
const CREST = -1.6, X0 = arch.halfLength / 2;   // the row runs from the midline (x = 0) back to +x
const BW = arch.halfLength + 24, BX = X0 + 6;   // long enough to hold the second molar crypt behind 36
const bone = DK.bone({ width: BW, height: 23, depth: 13, cortical: 1.2, crest: 1.5 });
bone.position.set(BX, CREST, 0);
const gum = DK.gingiva({ width: BW, height: 3.2, depth: 13.6, crest: 1.3, around: arch.teeth.map(t => ({ x: t.slot.c[0] - BX, z: t.slot.c[1], md: t.spec.mdC, bl: t.spec.blC, rise: 0.8 })) });
gum.position.set(BX, 1.2, 0);
fig.world.add(bone, gum);

fig.part(arch.group, { name: 'Teeth', label: false, info: '' });
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'Alveolar bone. The successors form in crypts below the primary roots.' });
fig.part(gum, { inPlace: true, name: 'Gingiva', label: false, info: 'Gingiva.' });
const erupted = [], forming = [];
arch.teeth.forEach(t => {
  const s = t.spec, prim = s.primary, res = t.resorb;
  erupted.push(String(t.fdi));
  fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), sub: prim ? (res > 0.05 ? `roots resorbing` : 'primary') : 'permanent', anchor: [0, s.crownL * 0.55, s.bl / 2], labelOffset: [0, -70],
    info: `${DK.toothName(t.fdi)}. ${prim ? `Universal ${DK.toothNumber(t.fdi, 'universal')}; exfoliates at about ${t.fdi % 10 <= 2 ? '6–8' : t.fdi % 10 === 3 ? '9–11' : t.fdi % 10 === 4 ? '10–12' : '11–13'} years${res > 0.05 ? `; roots about ${Math.round(res * 100)}% resorbed` : ''}.` : `Universal ${DK.toothNumber(t.fdi, 'universal')}; erupted.`}` });
});
arch.successors.forEach(d => {
  const s = d.spec; forming.push(String(d.fdi));
  fig.part(d.tooth.group, { inPlace: true, name: String(d.fdi), sub: d.under ? `under ${d.under}` : 'no predecessor', anchor: [0, s.crownL * 0.5, s.bl / 2], labelOffset: [0, 70], accent: d.fdi === 35,
    info: `${DK.toothName(d.fdi)}, crown complete, root ${Math.round(d.develop * 100)}% formed. ${d.under ? `Replaces ${d.under}; erupts at about ${d.fdi % 10 === 3 ? '9–11' : d.fdi % 10 === 4 ? '10–12' : '11–13'} years.` : 'Erupts at about 12–14 years behind the first molar.'}` });
});

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [...arch.teeth, ...arch.successors].map(t => t.tooth.layers.enamel), color: DK.COLORS.enamelCap },
  { objects: [...arch.teeth, ...arch.successors].flatMap(t => [t.tooth.layers.root, t.tooth.layers.dentin]), color: DK.COLORS.dentinCap },
  { objects: [...arch.teeth, ...arch.successors].map(t => t.tooth.layers.pulp), color: DK.COLORS.pulpCap }
]);
fig.xrayToggle([bone, gum], 'X-ray', false);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-4, 4], offset: 0 } });

const p35 = arch.successors.find(d => d.fdi === 35), f35 = p35 ? p35.tooth.group.position : { x: X0, y: -8, z: 0 };
// story: the quadrant in the jaw → bone fades to see the crypts → push in on 75 and the premolar between its roots → back out
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.2, zoom: 1.04, xray: 0, labels: erupted, caption: 'Age 8: permanent incisors and first molar in, primary canine and molars still at work.' },
  { dur: 2.4, hold: 1.6, theta: 0.12, phi: 1.42, zoom: 1, xray: 1, labels: forming, caption: 'Under them, the successors are forming: canine, two premolars, and the second molar behind.' },
  { dur: 2.0, hold: 2.4, zoom: 0.55, focus: [f35.x, f35.y + 6, 0], labels: ['75', '35'], caption: 'The premolar crown sits between the flared roots of the primary molar, which resorb as it rises.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.12, phi: 1.42, labels: ['73', ...forming], drift: 0, caption: '' }
]);
fig.start();
