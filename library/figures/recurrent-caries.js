// Recurrent (secondary) caries under an old mesio-occlusal amalgam on the mandibular right first molar (FDI 46 = Universal 30), with 45 in contact, crown up in the jaw; frame: tooth 46's, +x mesial (toward 45), +z buccal, CEJ at y = 0; story ending in a mesio-distal cut through the box.
// poster: end
// The old filling has a small gap at the gingival margin of its proximal box (where recurrent caries is most often found);
// a new smooth-surface lesion (DK.cariesLesion site 'mesial') starts on the tooth just below that margin and spreads into
// the dentin under the filling. The gap is the prep (a hole) left showing between the box floor and a filling whose
// gingival floor sits a little higher. dental-facts.md §16 (lesion shapes, Class II box).
const fig = DK.figure({
  fov: 30,
  title: 'Decay under an old filling',
  subtitle: 'Lower right first molar, FDI 46 (Universal 30), with 45 in front of it.',
  view: { theta: 0.6, phi: 0.95 }
});

// --- teeth: 46 with the filling, 45 in contact mesially
const tooth = DK.tooth(46), s = tooth.spec, L = tooth.layers;
const t45 = DK.tooth(45), s45 = t45.spec; t45.group.position.x = s.md / 2 + s45.md / 2 - 0.15; DK.inFront(t45.group);
const X45 = t45.group.position.x, CX = X45 / 2;
const CREST = -1.8;
const bone = DK.bone({ width: 24, height: 16, depth: 11.5, cortical: 1.3, crest: 1.5 }); bone.position.set(CX, CREST, 0);
const gum = DK.gingiva({ width: 24, height: 3.2, depth: 12.2, crest: 1.3, around: [{ x: -CX, z: 0, md: s.mdC, bl: s.blC }, { x: X45 - CX, z: 0, md: s45.mdC, bl: s45.blC }] }); gum.position.set(CX, 1.2, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The gum papilla under the contact.' });
fig.part(tooth.group, { name: 'Tooth 46', label: false, info: 'Lower right first molar with an old two-surface filling (top and front).' });
fig.part(t45.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar, in contact with the molar.' });

// --- the old filling: a mesio-occlusal amalgam; its box floor sits GAP mm above the prepared floor (the leak)
const G = s.crownL * 0.3, GAP = 0.32;
const PREP = { class: 2, side: 'mesial', depth: 0.4, box: { gingivalY: G, axial: 0.6 } };
const FILL = { class: 2, side: 'mesial', depth: 0.4, box: { gingivalY: G + GAP, axial: 0.6 } };
const prep = DK.cavityPrep(tooth, PREP); tooth.group.add(prep);
const fill = DK.filling(tooth, FILL, 'amalgam'); tooth.group.add(fill);
fill.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = DK.color(0x9c9fa0); m.material.roughness = 0.55; } });   // dulled with age
const D = prep.dims;
prep.slice(-1e9, G + GAP + 0.02);   // only the sliver under the filling stays empty: that is the gap
[prep.step, prep.box].forEach(m => { m.userData.cutOnly = true; });   // it paints only its cut face; in 3D the filling covers it
fill.position.y = 0.05;   // a hair proud of the enamel it replaces, so the old surface reads cleanly

// --- the new lesion: on the tooth just below the margin, spreading in under the box
const lesion = DK.cariesLesion(tooth, { site: 'mesial', at: G - 0.35, size: 1.45, stage: 0, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);
M.cavity.material.depthTest = true; M.cavity.material.needsUpdate = true;   // the small breakdown stays hidden in 3D, shows in the cut

const cutOn = (e, sec) => sec.enabled;
const ST = { v: 0 };
const XM = s.md / 2;
fig.part(fill, { inPlace: true, name: 'Old filling', sub: 'amalgam', anchor: [D.center[0] - 0.6, s.crownL - 0.5, 0], dim: false, info: 'A two-surface amalgam placed years ago. Fillings do not decay, but the tooth around their edges can.' });
fig.part(prep, { inPlace: true, name: 'Gap at the edge', sub: 'bacteria get in', anchor: [(D.axialX + XM) / 2 + 0.3, G + GAP / 2, 0], labelOffset: [150, -70], accent: true, dim: false, info: 'With time a margin can open up: wear, a chipped edge, or shrinkage. Plaque collects in the gap below the contact, where cleaning is hardest.' });
fig.part(M.enamel, { inPlace: true, name: 'New decay starts', anchor: () => at(A.enamel * 0.5, SZ * 0.3, 12), dim: false, when: () => ST.v < 2, info: 'Recurrent (secondary) caries: a new lesion on the tooth at the edge of a restoration, most often at the gum-side margin of a filling between the teeth.' });
fig.part(M.affected, { inPlace: true, name: 'Decay under the filling', anchor: () => at(A.enamel + A.dentin * 0.3, SZ * 0.15, 0), labelOffset: [-60, 110], dim: false, when: () => ST.v >= 2, info: 'It spreads along the dentin under the filling, hidden from view; the filling itself can look intact. Usually the filling is replaced or repaired.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [1.4, 1.6, 0], dim: false, info: 'The nerve: the decay is heading toward it.', when: cutOn });

fig.param('stage', 0, v => { ST.v = v; lesion.set(v); });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel, t45.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.dentin, L.root, t45.layers.dentin, t45.layers.root], color: DK.COLORS.dentinCap },
  { objects: [M.enamel], color: DK.COLORS.chalk, kind: 'enamel' },
  { objects: [M.affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [L.pulp, t45.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [M.infected], color: DK.COLORS.cariesSoft, kind: 'plain' },
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [prep], color: DK.COLORS.cariesSoft, kind: 'plain' },   // the gap: dark with plaque, not empty space
  { objects: [fill], color: DK.COLORS.amalgamCap, kind: 'metal' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });

// --- story: an old filling that looks fine, the margin under the contact, the cut, the new lesion, spreading under it
const MARGIN = [XM - 0.3, G + 0.6, 0];
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.6, phi: 0.75, zoom: 0.95, section: false, labels: ['Old filling'], caption: 'A molar with an old filling.' },
  { fov: 26, dur: 2.4, hold: 0.4, theta: 0.03, phi: 1.42, zoom: 0.7, focus: [XM - 1.5, s.crownL * 0.5, 0], labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.2, offset: 0, labels: ['Old filling', 'Pulp'], caption: 'Cut through the filling.' },
  { dur: 2.0, hold: 1.8, zoom: 0.56, focus: MARGIN, labels: ['Gap at the edge'], caption: 'A tiny gap has opened at the edge.' },
  { dur: 2.0, hold: 1.4, set: { stage: 1.3 }, labels: ['Gap at the edge', 'New decay starts'], caption: 'Bacteria in the gap start new decay.' },
  { dur: 2.6, hold: 0.4, zoom: 0.6, focus: [XM - 2.0, G + 0.8, 0], set: { stage: 3.0 }, labels: ['Decay under the filling'], caption: 'It spreads underneath, out of sight.' },
  { dur: 2.0, hold: 2.6, theta: 0.08, zoom: 0.62, focus: [XM - 2.2, G + 1.2, 0], labels: ['Old filling', 'Gap at the edge', 'Decay under the filling', 'Pulp'], caption: 'The filling looks fine; the tooth under it does not.' }
]);
fig.start();
