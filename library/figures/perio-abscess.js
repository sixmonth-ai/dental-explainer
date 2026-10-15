// Periodontal (gum) abscess on the lower right first molar (FDI 46 = Universal 30): story in a bucco-lingual cut through the mesial root.
// poster: end
// A deep buccal pocket beside a living tooth traps bacteria; pus collects in the pocket wall where the buccal bone has been lost and
// bulges the gum on the cheek side. The pulp is alive and the root tip is clear, unlike a tooth (periapical) abscess.
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0; the cut removes the mesial half, the camera on +x sees buccal on the left. mm.
const { lerp, smooth } = DK.util;
const CREST = -1.8;                                         // healthy crest, ~2 mm below the CEJ
const MARGIN = 1.6;                                         // swollen gingival margin, on the enamel
const BASE = -6.4;                                          // pocket base on the buccal of the mesial root: PD 8 mm
const BONE = { width: 15, height: 17.5, depth: 12.5, cortical: 1.3, crest: 1.6, round: 2.6 };
const SOFT = 1.3;                                           // soft tissue over the bone (gum and lining)

const fig = DK.figure({
  fov: 26,
  title: 'Gum abscess',
  subtitle: 'Lower right first molar, FDI 46 (Universal 30), cut cheek to tongue.',
  view: { theta: Math.PI / 2 - 0.5, phi: 1.3 }
});

// --- tooth (vital: normal pulp)
const tooth = DK.tooth(46), s = tooth.spec, L = tooth.layers;
const MR = s.roots.reduce((b, r, i) => (r.x > s.roots[b].x ? i : b), 0);   // the mesial root
const root = s.roots[MR];
const CUT = root.x + root.apex[0] * 0.2;                                   // the cut plane (x) down the mesial root
const buccalAt = y => DK.toothSurfaceAt(s, y, Math.PI / 2, MR).z;          // buccal surface of the mesial root at height y

// --- bone: mild horizontal loss and a deep buccal defect along the mesial root (the buccal plate is gone there)
const ZB = buccalAt(-4);
const loss = DK.boneLoss({ horizontal: 0.8, defects: [{ x: CUT, z: ZB + 0.6, depth: 6.4, rx: 2.6, rz: 2.4, profile: 'angular' }] });
const bone = DK.perioBone(Object.assign({}, BONE, { loss, level: 1 })); bone.position.y = CREST;
const crestAt = (x, z) => CREST + bone.crestAt(x, z);
const pdl = DK.perioPdl(s, 0.15, r => Math.min(crestAt(r.x + r.ra + 0.2, 0), crestAt(r.x, r.rb + 0.3)) + 0.2); pdl.visible = false;

// --- soft tissue: inflamed gingiva that also covers the bone (lining down the sides), and the pocket
const gum = DK.perioGingiva(s, { margin: MARGIN, crest: CREST - BONE.height + 0.6, inflamed: 0.75, width: BONE.width + 0.6, depth: BONE.depth + 2 * SOFT, round: 3.4 });
const site = th => Math.exp(-Math.pow((th - Math.PI / 2) / 0.55, 2));      // 1 at the buccal, 0 away from it
const pocket = DK.pocket(s, { margin: MARGIN, base: th => lerp(-0.6, BASE, site(th)), width: 0.45 }); tooth.group.add(pocket);

// --- the abscess: pus in the pocket wall, beside the root (not at its tip), pushing the gum out
const ZO = BONE.depth / 2 + SOFT;                                           // outer surface of the soft tissue on the cheek side
const AY = -4.4;                                                             // centre height of the collection
const pusHolder = new THREE.Group(); pusHolder.position.set(CUT, AY, ZB + 1.95); pusHolder.scale.set(0.9, 1.4, 0.55);
const pus = DK.periapicalLesion({ radius: 2.1, seed: 4, color: 0xc4a874 }); pusHolder.add(pus); fig.world.add(pusHolder);
const swellGeo = new THREE.SphereGeometry(1, 40, 28);
const swell = new THREE.Mesh(swellGeo, DK.mat('gingiva', { color: DK.COLORS.gingivaInflamed, cap: DK.COLORS.gingivaInflamedCap }));
swell.position.set(CUT, AY + 0.4, ZO - 0.9); fig.world.add(swell);

// --- the apex marker for "root tip clear": a quiet ring, in tissue ink
const APEX = [root.x + root.apex[0], -root.len, root.z + root.apex[1]];

// --- parts
const frame = new THREE.Mesh(new THREE.BoxGeometry(8, s.crownL + BONE.height - CREST + 0.5, BONE.depth + 2 * SOFT + 1.5), new THREE.MeshBasicMaterial({ visible: false }));   // what the camera frames: crown to the bottom of the bone
frame.position.set(CUT, (s.crownL + CREST - BONE.height) / 2, 0.4); fig.part(frame, { name: 'frame', label: false });
fig.part(tooth.group, { name: 'Tooth 46', label: false, fit: false, info: 'Lower right first molar: two roots, mesial and distal.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone. Gum disease has eaten away the thin bone on the cheek side of the root.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Red, swollen gum over the infected pocket.' });
const cutOn = (e, sec) => sec.enabled;
const zc = sec => (sec.enabled ? sec.offset : CUT) + 0.1;
fig.part(swell, { inPlace: true, name: 'Swollen gum', sub: 'on the side of the tooth', anchor: [0.2, 0.5, 0.9], labelOffset: [-120, -40], dim: false, info: 'A tender swelling on the gum beside the tooth, often with a bad taste. Pus may ooze from the gum edge when it is pressed.' });
fig.part(pocket, { inPlace: true, name: 'Deep pocket', sub: `about ${Math.round(MARGIN - BASE)} mm`, anchor: (e, sec) => [zc(sec), -1.2, buccalAt(-1.2) + 0.25], labelOffset: [-120, -70], when: cutOn, dim: false, info: 'A deep gum pocket from gum disease. When its opening tightens or food is forced in, bacteria are trapped inside.' });
fig.part(pus, { inPlace: true, name: 'Pus', sub: 'in the gum pocket wall', anchor: [0, -0.1, 0.2], labelOffset: [-130, 40], accent: true, dim: false, when: cutOn, info: 'The abscess: pus collects in the wall of the pocket, beside the root, and destroys more bone. Treatment drains and cleans the pocket.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp alive', sub: 'the nerve is healthy', anchor: (e, sec) => [zc(sec), 2.6, 0], labelOffset: [110, -50], when: cutOn, dim: false, info: 'Unlike a tooth abscess, the nerve of the tooth is usually alive: the problem is in the gum, not inside the tooth.' });
fig.part(L.root, { inPlace: true, name: 'Root tip clear', sub: 'unlike a tooth abscess', anchor: (e, sec) => [zc(sec), APEX[1] + 0.2, APEX[2] - 0.6], labelOffset: [120, 30], when: cutOn, dim: false, info: 'A tooth abscess starts from a dead nerve and sits at the root tip. A gum abscess sits along the side of the root, in the pocket.' });

// --- params: the abscess grows and the gum swells with it
fig.param('abscess', 1, k => { pus.set(k); swell.visible = k > 0.05; swell.scale.set(2.9 * (0.5 + 0.5 * k), 3.5 * (0.6 + 0.4 * k), 1.75 * k); });

// --- section: gingiva first, then the swelling, bone, PDL, pocket, pus, tooth
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaInflamedCap },
  { objects: [swell], color: DK.COLORS.gingivaInflamedCap, kind: 'gingiva' },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },

  { objects: [pocket], color: 0x4a403c },
  { objects: [pus], color: 0xc4a874, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: CUT } });
fig.view('Cheek side', { theta: Math.PI / 2 - 1.2, phi: 1.32, zoom: 0.9, focus: 'auto', section: false, labels: ['Swollen gum'] });

// --- story: the swelling on the cheek side, the cut sweeps in, the trapped pocket, the pus beside the root, the living tooth, hero
const SIDE = Math.PI / 2 - 0.08;
const ZK = fig.mode === 'image' ? 1 : 1.32;   // the interactive stage is wider and shorter than the image: pull back there
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: Math.PI / 2 - 1.05, phi: 1.22, zoom: 1.0 * ZK, section: false, labels: ['Swollen gum'], caption: 'A swelling on the gum beside a lower molar.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: SIDE, phi: 1.42, zoom: 1 * ZK, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8 },
  { dur: 2.2, hold: 1.0, offset: CUT, labels: ['Swollen gum'], caption: 'Cut through the root, cheek to tongue.' },
  { dur: 2.2, hold: 1.8, zoom: 0.62 * ZK, focus: [CUT, -2.4, 4.8], labels: ['Deep pocket'], caption: 'A deep gum pocket runs down the side of the root.' },
  { dur: 1.8, hold: 2.0, zoom: 0.6 * ZK, focus: [CUT, -4.2, 5.4], set: { abscess: 1 }, labels: ['Deep pocket', 'Pus'], caption: 'Pus collects in the pocket wall, beside the root.' },
  { dur: 2.2, hold: 1.8, zoom: 0.84 * ZK, focus: [CUT, -4.6, 0.5], theta: SIDE + 0.05, labels: ['Pulp alive', 'Root tip clear'], caption: 'The nerve is alive and the root tip is clear.' },
  { dur: 2.4, hold: 2.6, zoom: (fig.mode === 'image' ? 0.98 : 0.8) * ZK, focus: 'auto', theta: SIDE - 0.2, phi: 1.36, labels: ['Swollen gum', 'Deep pocket', 'Pus', 'Pulp alive', 'Root tip clear'] }
]);
fig.start();
