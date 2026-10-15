// Library: two implant crowns replacing the lower left first molar (FDI 36), screw-retained (viewer's left) and cement-retained (right),
// poster: end
// side by side and cut by one mesio-distal section through the implant axes.
// Left: crown and abutment are one piece, held by a screw reached through an access hole in the occlusal surface (sealed with composite);
// the screw backs out through the hole and the crown lifts off (explode). Right: no hole, the crown is cemented on the abutment and excess
// cement can be left at the margin under the gum. Frame: +x = mesial, +z = buccal, y up, implant platform at the crest, mm.
const CREST = -1.8, GUM_Y = 1.1;
const IMPLANT = { diameter: 4.1, length: 10 };
const ABUT = { platform: 4.1, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 };
const GAP = 17;                                     // centre-to-centre spacing of the two sets
const SX = -GAP / 2, CX = GAP / 2;                  // screw-retained set (left), cement-retained set (right)
const HOLE_R = 1.4;                                 // access channel radius (the screw head is Ø2.6)
const PLUG = 2.0;                                   // composite plug depth at the top of the channel
const s36 = DK.toothPreset(36);

const fig = DK.figure({
  fov: 26,
  title: 'Screw- vs cement-retained crown',
  subtitle: 'Implant crowns replacing 36 (FDI). Mesio-distal cut.',
  view: { theta: 0, phi: 1.48, margin: 0.84 }
});

// ---------------- one implant site (bone, gum, implant) ----------------
const siteBase = x => {
  const bone = DK.bone({ width: 13, height: 13, depth: 11, cortical: 1.2, crest: 1.6 }); bone.position.set(x, CREST, 0);
  const gum = DK.gingiva({ width: 13, height: 3.4, depth: 11.6, crest: 1.4, around: [{ x: 0, z: 0, md: ABUT.emergence, bl: ABUT.emergence, rise: 0.6 }] });
  gum.position.set(x, GUM_Y, 0);
  const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'internal hex' }); implant.position.set(x, CREST, 0);
  return { bone, gum, implant };
};
const L = siteBase(SX), R = siteBase(CX);
// abutment as one closed turned solid (section-ready): round engaging part in the implant, transmucosal collar, post
const abutment = grow => {
  const r = ABUT.platform / 2, ch = ABUT.collarHeight, ph = ABUT.postHeight, pt = 3.2, g = grow || 0;
  const prof = grow ? [[0, ch], [pt / 2 + 0.6 + g, ch + 0.3 - g], [pt / 2 + 0.2 + g, ch + ph * 0.9], [pt / 2 - 0.2 + g * 0.7, ch + ph + g], [0, ch + ph + g]]
    : [[0, -2.5], [r * 0.52, -2.5], [r * 0.52, -0.05], [r * 0.97, 0], [ABUT.emergence / 2, ch * 0.85], [ABUT.emergence / 2 * 0.97, ch], [pt / 2 + 0.6, ch + 0.3], [pt / 2 + 0.2, ch + ph * 0.9], [pt / 2 - 0.2, ch + ph], [0, ch + ph]];
  return DK.lathe(prof, 64, grow ? DK.mat('cement', { color: 0xe2ddd0, cap: 0xe2ddd0 }) : DK.mat('titanium', { cap: 0x8e939a }));
};

// the crown's occlusal fossa height above the margin (lowest point of the occlusal surface near the axis)
const crownGeo = DK.restorationCrown(36, 'zirconia', { hollow: false }).geometry;
let fossa = 1e9; { const p = crownGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > s36.crownL * 0.5 && x * x + z * z < 1.0) fossa = Math.min(fossa, y); } }
const CROWN_Y = 0.2;                                // crown margin on the abutment shoulder
const TOP = CROWN_Y + fossa + 0.45;                 // the plug's top: just proud of the occlusal fossa, so the hole reads from above
const HEAD_Y = CREST + ABUT.collarHeight + ABUT.postHeight - 0.4 - 1.6;   // screw head seat inside the abutment post

// ---------------- screw-retained: crown + abutment one piece, a screw through the access channel ----------------
const unitS = new THREE.Group(); unitS.position.x = SX;
const abutS = abutment(); abutS.position.y = CREST;
const crownS = new THREE.Mesh(crownGeo, DK.mat('zirconia')); crownS.position.y = CROWN_Y;
unitS.add(abutS, crownS);
const screw = DK.screw({ diameter: 2.0, length: 8 }); screw.position.set(SX, HEAD_Y, 0);
const screwMeshes = []; screw.traverse(m => { if (m.isMesh) screwMeshes.push(m); });
const channel = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, TOP - PLUG - (HEAD_Y + 1.6) + 0.02, 40), DK.mat('cavity', { color: DK.voidColor(fig), cap: DK.holeCap(fig) }));
channel.position.y = (TOP - PLUG + HEAD_Y + 1.6) / 2; channel.userData.cutOnly = true; unitS.add(channel);
const plug = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, PLUG + 0.06, 40), DK.mat('composite', { color: 0xcbbd9f, cap: DK.COLORS.compositeCap }));
plug.position.set(SX, TOP - PLUG / 2 + 0.03, 0);

// ---------------- cement-retained: abutment screwed in, crown cemented on it; excess cement at the margin ----------------
const abutC = abutment(); abutC.position.set(CX, CREST, 0);
const lute = abutment(0.12); lute.position.set(CX, CREST, 0);   // the cement layer between crown and abutment
const crownC = new THREE.Mesh(crownGeo, DK.mat('zirconia')); crownC.position.set(CX, CROWN_Y, 0);
const cement = new THREE.Group(); cement.position.set(CX, 0, 0);
{ const mat = DK.mat('cement', { color: 0xe2ddd0, cap: 0xe2ddd0 }); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rim = ABUT.emergence / 2;
  [[-0.12, 1.1], [0.08, 0.9], [0.6, 1.0], [1.2, 0.8], [3.0, 0.9], [3.2, 1.2], [2.3, 0.8]].forEach(([a, k]) => {
    const g = new THREE.IcosahedronGeometry(0.5 * k, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const f = 0.8 + rnd() * 0.4; p.setXYZ(i, p.getX(i) * f * 1.3, p.getY(i) * f * 0.8, p.getZ(i) * f); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); const r = rim + 0.1 + 0.25 * k;
    m.position.set(Math.cos(a) * r, CROWN_Y - 0.45 - 0.35 * rnd(), Math.sin(a) * r * 0.95); m.rotation.y = -a;
    cement.add(m);
  }); }

// ---------------- parts ----------------
const onCut = (e, sec) => sec.enabled;
const cz = sec => (sec.enabled ? sec.offset : 0) + 0.1;
[L, R].forEach((S, i) => {
  fig.part(S.bone, { name: i ? 'Bone ' : 'Bone', label: false, fit: false, info: 'Jaw bone around the implant.' });
  fig.part(S.gum, { name: i ? 'Gum ' : 'Gum', label: false, fit: false, info: 'Gum around the abutment.' });
});
fig.part(L.implant, { name: 'Implant', label: false, info: `Implant, about Ø${IMPLANT.diameter} × ${IMPLANT.length} mm. The same for both crowns.` });
fig.part(R.implant, { name: 'Implant ', label: false, info: `Implant, about Ø${IMPLANT.diameter} × ${IMPLANT.length} mm. The same for both crowns.` });
fig.part(unitS, { name: 'Screw-retained', sub: 'can be taken off', anchor: [-2.5, s36.crownL + 0.6, 0], labelOffset: [-200, -50], explode: [0, 8, 0], dim: false,
  info: 'Crown and abutment joined in one piece, held to the implant by a screw. It can be taken off and put back.' });
fig.part(screw, { name: 'Screw', sub: 'through the crown', anchor: [-0.6, -2.5, 0.6], labelOffset: [-250, 10], explode: [0, 17, 0], dim: false, when: (e, sec) => sec.enabled || e > 0.25,
  info: 'Prosthetic screw into the implant, tightened to the torque the implant maker specifies (it differs between systems).' });
fig.part(plug, { name: 'Access hole', sub: 'sealed with composite', anchor: [-HOLE_R * 0.5, PLUG / 2, 0.5], labelOffset: [-260, -20], explode: [0, 22, 0], accent: true, dim: false,
  info: 'The screw is reached through a hole in the chewing surface, sealed with a small filling. Remove the filling, unscrew, and the crown comes off.' });
fig.part(lute, { name: 'Cement', label: false, info: 'A thin layer of cement holds the crown on the abutment.' });
fig.part(abutC, { name: 'Abutment', label: false, info: 'Abutment screwed into the implant; the crown is cemented over it.' });
fig.part(crownC, { name: 'Cement-retained', sub: 'no hole', anchor: [0, s36.crownL + 1.0, 0], dim: false,
  info: 'A crown cemented on the abutment, like a crown on a tooth: an intact chewing surface, but it is not meant to come off.' });
fig.part(cement, { name: 'Excess cement', sub: 'under the gum', when: onCut, anchor: [cement.children[1].position.x, cement.children[1].position.y, cement.children[1].position.z], dim: false,
  info: 'Cement squeezed out at a margin below the gum is hard to see and remove; left behind, it is linked to inflammation and bone loss around the implant.' });

// ---------------- section: one mesio-distal plane through both implant axes ----------------
fig.enableSection([0, 0, 1], [
  { objects: [L.gum, R.gum], color: DK.COLORS.gingivaCap },
  { objects: [L.bone.userData.layers.cortical, R.bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [L.bone.userData.layers.cancellous, R.bone.userData.layers.cancellous], color: 0xffffff, texture: L.bone.userData.layers.cancellous.userData.capTexture },
  { objects: [crownS, crownC], color: DK.COLORS.zirconiaCap },
  { objects: [lute, ...cement.children], color: 0xe2ddd0, kind: 'plain' },
  { objects: [abutS, abutC], color: 0x8e939a, kind: 'metal' },
  { objects: [channel], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [plug], color: DK.COLORS.compositeCap },
  { objects: screwMeshes, color: 0xb48a2c, kind: 'metal' }
]);
fig.standardControls({ explodeLabel: 'Unscrew', section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
fig.view('Chewing surface', { fov: 30, theta: 0, phi: 0.35, zoom: 0.9, section: false, explode: 0, labels: ['Access hole', 'Cement-retained', 'Screw-retained'] });

// ---------------- story ----------------
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.35, phi: 0.62, zoom: 1.0, section: false, labels: ['Screw-retained', 'Cement-retained'], caption: 'Two ways to fix a crown on an implant.' },
  { dur: 2.2, hold: 1.6, zoom: 0.62, focus: [SX, TOP, 0], phi: 0.5, labels: ['Access hole'], caption: 'One has a small hole in its chewing surface, sealed with a filling.' },
  { fov: 26, dur: 2.4, hold: 0.2, zoom: 1, focus: 'auto', theta: 0, phi: 1.48, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.0, offset: 0, labels: ['Screw-retained', 'Cement-retained'], caption: 'Cut through both.' },
  { dur: 2.0, hold: 0.4, zoom: 0.7, focus: [SX, 4, 0], labels: ['Screw', 'Access hole'], caption: 'A screw runs through the hole into the implant.' },
  { dur: 2.4, hold: 2.0, explode: 0.6, focus: [SX, 8, 0], labels: ['Screw', 'Access hole', 'Screw-retained'], caption: 'Unscrewed, the crown lifts off: it can be repaired or cleaned and put back.' },
  { dur: 2.0, hold: 2.2, explode: 0, zoom: 0.7, focus: [CX, 1, 0], labels: ['Excess cement', 'Cement-retained'], caption: 'The cemented crown has no hole, but cement can squeeze out under the gum.' },
  { dur: 2.2, hold: 2.6, zoom: 1, focus: 'auto', explode: 0, drift: 0, labels: ['Screw-retained', 'Cement-retained', 'Screw', 'Access hole', 'Excess cement'] }
]);
fig.start();
