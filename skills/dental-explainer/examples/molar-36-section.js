// Example: natural mandibular left first molar (FDI 36 = Universal 19) in its socket, with a movable mesio-distal section.
// Tooth frame: +x mesial, +z buccal, y up, CEJ at y = 0. Sizes in mm (Wheeler averages via DK.toothPreset).
const fig = DK.figure({
  fig: 'Fig. 2 · Tooth anatomy · FDI 36',
  title: 'Mandibular first molar in cross-section',
  subtitle: 'Turn on the section and slide the cut bucco-lingually: the mesial root carries two canals (MB, ML) side by side, the distal root usually one wide canal. Explode to drop the bone away from the roots.',
  view: { theta: 0.35, phi: 1.3 }
});

const tooth = DK.tooth(36);
const s = tooth.spec;
const CREST = -1.8;   // alveolar crest ~1.5–2 mm apical to the CEJ in health

const bone = DK.bone({ width: 22, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 });
bone.position.y = CREST;
const pdl = DK.pdl(s, 0.25); pdl.traverse(m => { if (m.isMesh) m.material.visible = false; }); // only seen in section
tooth.group.add(pdl);
const gum = DK.gingiva({ width: 22, height: 3.2, depth: 13.2, crest: 1.3 });
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
fig.standardControls({ section: { label: 'Section', on: true, range: [-3.5, 3.5], rangeLabel: 'Cut (lingual ↔ buccal, mm)', offset: 1.5 } });
fig.xrayToggle([bone, gum], 'X-ray bone', false);

const canalAt = z => (Math.abs(z - 1.5) < 0.9 ? 'MB' : Math.abs(z + 1.5) < 0.9 ? 'ML' : 'between MB and ML');
let lastKey = '';
fig.onFrame(() => {
  const z = sec.enabled ? sec.offset : null, key = String(z);
  if (key === lastKey) return; lastKey = key;
  fig.setReadout([
    { k: 'Tooth', v: 'FDI 36 · Universal 19 · Palmer lower-left 6' },
    { k: 'Crown / root', v: `${s.crownL} / ${s.rootL} mm` },
    { k: 'Roots', v: '2 (mesial, distal)' },
    { k: 'Canals (typical)', v: 'MB, ML, D (D may be 2)' },
    { k: 'Cut', v: z === null ? 'off' : `${DK.mm(z).replace(' mm', '')} mm ${z >= 0 ? 'buccal' : 'lingual'} · mesial canal: ${canalAt(z)}` }
  ]);
});
fig.start();
