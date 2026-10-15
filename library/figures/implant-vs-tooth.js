// Library: a natural lower left second premolar (FDI 35) next to an implant replacing the first molar (FDI 36) in the same bone, mesio-distal cut.
// poster: end
// Teaching point: the tooth's root hangs in a thin periodontal ligament (accent band on the cut); the implant has no ligament, the bone
// grows directly onto the titanium. Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0, mm.
const CREST = -1.8, GUM_Y = 1.1;
const PDL = 0.22;                                  // about 0.2 mm, within the measured 0.15-0.38 mm (dental-facts.md §6)
const IMPLANT = { diameter: 4.1, length: 10 };
const s35 = DK.toothPreset(35), s36 = DK.toothPreset(36);
const X35 = s36.md / 2 + s35.md / 2;               // contact-to-contact spacing
const CUT = 0;                                     // through the root and implant axes

const fig = DK.figure({
  fov: 26,
  title: 'Implant vs natural tooth',
  subtitle: 'Tooth 35 next to an implant at 36 (FDI). Mesio-distal cut.',
  view: { theta: 0, phi: 1.5, margin: 0.9 }
});
const accentHex = fig.dark ? DK.COLORS.accentDark : DK.COLORS.accent;

// ---------------- context ----------------
const bone = DK.bone({ width: 24, height: 16.5, depth: 11, cortical: 1.2, crest: 1.6 }); bone.position.set(3.2, CREST, 0);
const gum = DK.gingiva({ width: 24, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: X35 - 3.2, z: 0, md: s35.mdC, bl: s35.blC, rise: 0.8 }, { x: -3.2, z: 0, md: 5.6, bl: 5.6, rise: 0.6 }] });
gum.position.set(3.2, GUM_Y, 0);

// ---------------- the natural tooth and its ligament ----------------
const t35 = DK.tooth(35); t35.group.position.x = X35;
const pdl = DK.pdl(t35.spec, PDL, CREST);           // a shell around the root from the crest down: shown only on the cut
pdl.traverse(m => { if (m.isMesh) m.userData.cutOnly = true; });
t35.group.add(pdl);

// ---------------- the implant, abutment and crown ----------------
const site = new THREE.Group();
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); implant.position.y = CREST;
const abut = DK.abutment({ platform: IMPLANT.diameter, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 }); abut.position.y = CREST;
const crown = DK.restorationCrown(36, 'zirconia', { hollow: false }); crown.position.y = 0.2;
site.add(implant, abut, crown);

// ---------------- parts ----------------
const cz = sec => (sec.enabled ? sec.offset : CUT) + 0.1;
const onCut = (e, sec) => sec.enabled;
const r35 = t35.spec.roots[0];
fig.part(bone, { name: 'Bone', label: false, info: 'Jaw bone: a cortical shell over spongy bone.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth and the implant abutment.' });
fig.part(t35.group, { name: 'Natural tooth', sub: '35', anchor: [0, s35.crownL + 0.6, 0], info: 'Lower left second premolar (FDI 35, Universal 20). Its root sits in a socket lined by a ligament, not in direct contact with bone.' });
fig.part(site, { name: 'Implant', sub: 'replacing 36', anchor: [0, s36.crownL + 0.8, 0], info: 'A titanium implant with abutment and crown, replacing the lower left first molar (FDI 36, Universal 19).' });
fig.part(pdl, { inPlace: true, name: 'Ligament', sub: 'about 0.2 mm', accent: true, dim: false, when: onCut,
  anchor: (e, sec) => [-(r35.ra * 0.62 + PDL / 2), -6, cz(sec)], labelOffset: [190, 40],
  info: 'The periodontal ligament (0.15-0.38 mm): fibres that sling the root in its socket, cushion biting forces, let the tooth move slightly and sense pressure.' });
fig.part(implant, { inPlace: true, name: 'Fused to bone', sub: 'no ligament', dim: false,
  anchor: [-IMPLANT.diameter / 2 + 0.15, -5.5, 0.6], labelOffset: [-170, 30],
  info: 'Osseointegration: bone grows directly onto the titanium surface. With no ligament the implant cannot move like a tooth and has no pressure sense of its own.' });

// ---------------- section: one mesio-distal plane through both ----------------
fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: accentHex, kind: 'plain' },
  { objects: [t35.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t35.layers.root, t35.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t35.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [crown], color: DK.COLORS.zirconiaCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: CUT } });
fig.xray([bone, gum], false);
fig.view('Tooth', { focus: [X35, -7, 0], zoom: 0.66, theta: 0.06, phi: 1.5, section: true, offset: CUT, labels: ['Ligament', 'Natural tooth'] });
fig.view('Implant', { focus: [0, -7, 0], zoom: 0.66, theta: -0.06, phi: 1.5, section: true, offset: CUT, labels: ['Fused to bone', 'Implant'] });

// ---------------- story ----------------
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.6, phi: 1.22, zoom: 1.05, section: false, xray: 0.75, labels: ['Natural tooth', 'Implant'], caption: 'A natural tooth next to an implant, in the same bone.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: 0, phi: 1.5, zoom: 1, xray: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.0, offset: CUT, labels: ['Natural tooth', 'Implant'], caption: 'Cut through both.' },
  { dur: 2.2, hold: 2.6, zoom: 0.66, focus: [X35, -7, 0], theta: 0.06, labels: ['Ligament'], caption: 'The tooth hangs in a thin ligament that cushions it and senses pressure.' },
  { dur: 2.4, hold: 2.6, zoom: 0.66, focus: [0, -7, 0], theta: -0.06, labels: ['Fused to bone'], caption: 'The implant has none: bone grows straight onto the titanium.' },
  { dur: 2.2, hold: 2.6, zoom: 1, focus: 'auto', theta: 0, phi: 1.5, drift: 0, labels: ['Natural tooth', 'Implant', 'Ligament', 'Fused to bone'] }
]);
fig.start();
