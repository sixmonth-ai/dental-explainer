// Example: natural mandibular left first molar (FDI 36 = Universal 19) in its socket, with a movable mesio-distal section.
// Tooth frame: +x mesial, +z buccal, y up, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const fig = DK.figure({
  title: 'Lower first molar in section',
  subtitle: 'FDI 36 (Universal 19), mesio-distal cut.',
  view: { theta: 0.35, phi: 1.3 }
});

const tooth = DK.tooth(36);
const s = tooth.spec;
const CREST = -1.8;   // alveolar crest ~1.5–2 mm apical to the CEJ in health

const bone = DK.bone({ width: 22, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 });
bone.position.y = CREST;
const pdl = DK.pdl(s, 0.25); pdl.traverse(m => { if (m.isMesh) m.material.visible = false; }); // only seen in section
tooth.group.add(pdl);
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] });   // free gingival margin hugs the crown
gum.position.y = 1.2;

// whole objects (these move when exploded)
fig.part(bone, { name: 'Alveolar bone', sub: 'cortical shell, cancellous core', anchor: [10.5, -6, 4], explode: [0, -14, 0], info: 'Lamina dura lines the socket; the crest sits ~1.5–2 mm below the CEJ in health.' });
fig.part(gum, { name: 'Gingiva', anchor: [-9, 0.5, 5.4], explode: [0, -14, 0], info: 'Healthy probing depth ≤3 mm. Supracrestal attachment (JE ≈0.97 + CT ≈1.07 mm ≈ 2 mm) lies between sulcus and bone crest.' });
fig.part(tooth.group, { name: 'Tooth 36', sub: 'Universal #19', label: false, info: 'Mandibular left first molar: 5 cusps, 2 roots (mesial, distal), typically 3 canals.' });

// layer annotations (stay in place; hover shows these)
const L = tooth.layers;
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [3.5, 8.6, -2.2], info: 'Thickest over cusps (~2–2.5 mm), knife-edge at the CEJ. ~96% mineral; acellular — it cannot regenerate, only remineralise.' });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [-3.8, 4.5, 0], info: '~70% mineral, made by odontoblasts that line the pulp — so secondary and tertiary dentin can still form.', when: (e, sec) => sec && sec.enabled });
fig.part(L.pulp, { inPlace: true, name: 'Pulp chamber', sub: 'pulp horns under cusps', anchor: [1.2, 2.6, 0], info: 'Pulp horns follow the cusps; the mesio-lingual and mesio-buccal horns are the most prominent.', when: (e, sec) => sec && sec.enabled });
fig.part(L.root, { inPlace: true, name: 'Mesial root', sub: '2 canals: MB, ML', anchor: [s.roots[0].x + s.roots[0].apex[0] * 0.5 + 1.6, -9, 0], info: 'Broad bucco-lingually, flat mesio-distally, curves distally. Two canals in most teeth.' });
fig.part(pdl, { inPlace: true, name: 'PDL', sub: '0.15–0.38 mm', anchor: [-2.5 - 1.9 - 0.15, -8, 0], info: 'Periodontal ligament: thinnest at the root’s middle third. Shown slightly exaggerated (0.25 mm).', when: (e, sec) => sec && sec.enabled && e < 0.2 });

const sec = fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3.5, 3.5], offset: 1.5 } });

// story (a short film): establishing shot in the socket → orbit round as the cut sweeps in → push in on the pulp →
// tilt down and slide the cut lingually to the second canal → ease out to the hero shot
fig.story([
  { dur: 0, hold: 1.4, theta: 0.8, phi: 1.18, zoom: 1.08, labels: ['Alveolar bone', 'Gingiva'], caption: 'A lower first molar, seated in its socket.' },
  { dur: 2.4, hold: 0.2, theta: 0.1, phi: 1.42, zoom: 1, labels: [], caption: '' },
  { dur: 0, hold: 0, section: true, offset: 6.5 },
  { dur: 2.2, hold: 1.8, offset: 1.5, labels: ['Enamel', 'Dentin', 'Pulp chamber'], caption: 'Cut through the mesial root: enamel over dentin, pulp at the core.' },
  { dur: 1.8, hold: 2.0, zoom: 0.62, focus: [0, 3.2, 0], caption: 'Pulp horns reach up under the cusps. Dentin is alive; enamel is not.' },
  { dur: 2.0, hold: 2.2, zoom: 0.8, phi: 1.5, focus: [0, -6, 0], offset: -1.5, labels: ['Mesial root', 'PDL'], caption: 'Slide lingually: the mesial root carries a second canal.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', theta: 0.35, phi: 1.3, offset: 0.8, labels: ['Enamel', 'Pulp chamber', 'Mesial root', 'PDL', 'Alveolar bone'], caption: '' }
]);
fig.start();
