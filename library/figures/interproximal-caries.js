// Interproximal (proximal) caries between the mandibular right second premolar and first molar (FDI 45 and 46 = Universal 29 and 30), crown up in the jaw; frame: tooth 46's, +x mesial (toward 45), +z buccal, CEJ at y = 0; story ending in a mesio-distal cut through the contact.
// poster: end
// A smooth-surface lesion on the mesial of 46 just below the contact with 45 (DK.cariesLesion site 'mesial'): a white
// spot under an intact surface (ICDAS 1-2), then into the outer dentin while the surface is barely broken. From above
// and from the cheek nothing shows; the cut (what a bitewing radiograph shows) reveals it. dental-facts.md §16.
const fig = DK.figure({
  fov: 30,
  title: 'Cavity between two teeth',
  subtitle: 'Lower right first molar and second premolar, FDI 46 and 45 (Universal 30 and 29).',
  view: { theta: 0.55, phi: 1.05 }
});

// --- the two teeth in contact (46 at the origin, 45 mesial to it on +x)
const tooth = DK.tooth(46), s = tooth.spec, L = tooth.layers;
const t45 = DK.tooth(45), s45 = t45.spec; t45.group.position.x = s.md / 2 + s45.md / 2 - 0.15; DK.inFront(t45.group);
const X45 = t45.group.position.x, CX = (X45 - s.md / 2 + 0.0) / 2 + s.md / 4;   // a centre between the two crowns
// the contact: where 46's mesial enamel bulges furthest (vertices near the mid-plane)
const contactY = (() => { const p = L.enamel.geometry.attributes.position; let bx = -1e9, by = 0; for (let i = 0; i < p.count; i++) { if (Math.abs(p.getZ(i)) < 0.6 && p.getY(i) > 1 && p.getX(i) > bx) { bx = p.getX(i); by = p.getY(i); } } return by; })();
const CONTACT = [s.md / 2 - 0.05, contactY, 0];

const CREST = -1.8;
const bone = DK.bone({ width: 24, height: 16, depth: 11.5, cortical: 1.3, crest: 1.5 }); bone.position.set(CX, CREST, 0);
const gum = DK.gingiva({ width: 24, height: 3.2, depth: 12.2, crest: 1.3, around: [{ x: -CX, z: 0, md: s.mdC, bl: s.blC }, { x: X45 - CX, z: 0, md: s45.mdC, bl: s45.blC }] }); gum.position.set(CX, 1.2, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'The gum papilla fills the space under the contact.' });
fig.part(tooth.group, { name: 'Tooth 46', anchor: [-1.5, s.crownL + 0.3, 0], info: 'Lower right first molar.' });
fig.part(t45.group, { name: 'Tooth 45', anchor: [0, s45.crownL + 0.3, 0], info: 'Lower right second premolar, touching the molar at the contact point.' });

// --- the lesion just below the contact
const lesion = DK.cariesLesion(tooth, { site: 'mesial', at: contactY - 1.3, size: 1.15, stage: 0, reactionary: false });
const M = lesion.meshes, A = lesion.axis, SZ = lesion.size;
const at = (d, r, k) => lesion.point(d, r, k);

const cutOn = (e, sec) => sec.enabled;
const hollow = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshBasicMaterial({ visible: false })); hollow.position.set(...CONTACT); tooth.group.add(hollow);
fig.part(hollow, { inPlace: true, name: 'Contact point', sub: 'a brush cannot reach below it', anchor: [0, 0, 0], dim: false, info: 'Where neighbouring teeth touch. Plaque sits in the small space just below it, out of reach of the toothbrush: only floss or interdental brushes clean it.' });
fig.part(M.enamel, { inPlace: true, name: 'White spot', sub: 'surface still intact', anchor: () => at(A.enamel * 0.45, SZ * 0.3, 0), dim: false, info: 'Acid from plaque dissolves mineral under an intact surface. At this stage it can still harden again with fluoride and flossing.' });
fig.part(M.affected, { inPlace: true, name: 'Decay', sub: 'in the dentin, unseen', anchor: () => at(A.enamel + A.dentin * 0.2, SZ * 0.55, 12), accent: true, dim: false, info: 'The lesion has crossed the enamel and spreads in the dentin while the surface is barely broken. A bitewing X-ray shows it as a dark shadow under the contact; from the mouth it is hidden by the neighbouring tooth.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [-s.md / 2 + 0.9, s.crownL - 1.6, 0], info: 'Enamel, the hard outer layer.', when: cutOn });
fig.part(L.dentin, { inPlace: true, name: 'Dentin', anchor: [-2.6, 2.4, 0], info: 'Dentin: softer than enamel, so decay spreads faster once it gets here.', when: cutOn });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [1.6, 1.5, 0], dim: false, info: 'The nerve, still well clear of the decay at this stage.', when: cutOn });
const occl = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshBasicMaterial({ visible: false })); occl.position.set(0.8, s.crownL - 0.6, 0.4); tooth.group.add(occl);
fig.part(occl, { inPlace: true, name: 'Looks sound', sub: 'nothing to see from above', anchor: [0, 0, 0], dim: false, info: 'Seen in the mouth, the chewing surfaces and the contact look healthy.' });

fig.param('stage', 0, v => lesion.set(v));

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
  { objects: [M.cavity], color: DK.holeCap(fig), kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: 0 } });
fig.view('From above', { theta: 0.35, phi: 0.38, zoom: 0.8, section: false, focus: [CX, s.crownL - 1, 0], labels: ['Looks sound', 'Contact point'] });

// --- story: two healthy-looking teeth, nothing from above, the hidden contact, the cut, the lesion grows into dentin
const FC = [s.md / 2 + 0.2, contactY - 1.6, 0];
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.55, phi: 1.05, zoom: 1.0, section: false, set: { stage: 2.5 }, labels: ['Tooth 46', 'Tooth 45'], caption: 'A lower molar and premolar, side by side.' },
  { dur: 2.4, hold: 1.8, theta: 0.3, phi: 0.42, zoom: 0.82, focus: [CX, s.crownL - 1, 0], labels: ['Looks sound', 'Contact point'], caption: 'From above, everything looks healthy.' },
  { fov: 26, dur: 2.4, hold: 0.4, theta: 0.02, phi: 1.45, zoom: 0.62, focus: FC, labels: ['Contact point'], caption: 'The teeth touch at the contact point.' },
  { dur: 0, hold: 0, section: true, offset: 7, set: { stage: 0 } },
  { dur: 2.2, hold: 0.8, offset: 0, labels: ['Contact point', 'Enamel', 'Dentin'], caption: 'Cut through, like a bitewing X-ray.' },
  { dur: 2.0, hold: 1.6, set: { stage: 1.1 }, labels: ['Contact point', 'White spot'], caption: 'Plaque below the contact starts a white spot.' },
  { dur: 2.4, hold: 0.4, set: { stage: 2.5 }, labels: ['Decay'], caption: 'It spreads into the dentin, still hidden.' },
  { dur: 2.2, hold: 2.6, zoom: 0.7, theta: 0.06, focus: [s.md / 2 - 0.6, contactY - 2.4, 0], labels: ['Contact point', 'Decay', 'Enamel', 'Pulp'], caption: 'Seen on an X-ray before it shows in the mouth.' }
]);
fig.start();
