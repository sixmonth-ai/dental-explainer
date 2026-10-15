// Story: a two-unit cantilever bridge replacing the upper right lateral incisor, FDI 12 (Universal 7), from one abutment, the canine 13 (Universal 6), in the mouth.
// poster: end
// Arch frame (DK.arch maxilla, placement 'jaw': crowns down, left teeth mirrored): +x = patient's left, +z anterior, y up. Tooth frames: +x mesial,
// +z labial, CEJ at y = 0. The canine is prepared (DK.prep) for a full-coverage zirconia retainer; the pontic is DK.pontic (modified ridge lap) at
// 12's natural slot, joined to the retainer by one DK.connector on its distal side only. The mesial side of the pontic just touches 11, which is
// not prepared. Sizes in mm; the connector is sized for a zirconia cantilever (10 to 15 mm², dental-facts.md §18).
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };   // monolithic zirconia, typical (dental-facts.md §14)
const CONN = { h: 4.0, w: 3.0 };                           // 12 mm²: zirconia cantilever 10 to 15 mm² (§18)
const fig = DK.figure({
  fov: 34,
  title: 'Cantilever bridge',
  subtitle: 'Replaces FDI 12 (Universal 7) from one abutment: the canine, 13.',
  view: { theta: -0.35, phi: 1.85, margin: 0.8 }
});
const V = a => new THREE.Vector3(a[0], a[1], a[2]);

// --- the remaining teeth (crowns in the gum), 13 as a prepared stump
const crowns = (fdi, spec) => {
  if (fdi !== 13) return DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
  const g = new THREE.Group(), stump = DK.prep(spec, PREP); g.add(stump); return { group: g, layers: { enamel: stump }, spec, stump };
};
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [15, 14, 13, 11, 21, 22, 23], build: crowns });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Upper teeth, with the right lateral incisor (12) missing.' });
arch.group.updateMatrixWorld(true);
const T = f => arch.teeth.find(t => t.fdi === f);
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));
const gum = DK.gingivaArch(arch);
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum along the upper teeth. Where 12 was lost the ridge has healed flat.' });

// --- the missing tooth's slot (a placeholder arch gives its frame)
const slot12 = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [12], build: (f, spec) => ({ group: new THREE.Group(), layers: {}, spec }) });
slot12.group.updateMatrixWorld(true);
const f12 = slot12.teeth[0].tooth.group, s12 = slot12.teeth[0].spec, t13 = T(13), s13 = t13.spec, t11 = T(11), s11 = t11.spec;
// ridge under the pontic (12's frame): cast toward the gum from inside the crown
const rc = new THREE.Raycaster(), gumY = {};
[-2.4, -1.2, 0, 1.2, 2.4].forEach(z => {
  const o = f12.localToWorld(V([0, 4, z])), d = f12.localToWorld(V([0, -6, z])).sub(o).normalize();
  rc.set(o, d); const h = rc.intersectObject(gum, false);
  gumY[z] = h.length ? f12.worldToLocal(h[0].point.clone()).y : 0.6;
});
const ridgeY = z => { const ks = Object.keys(gumY).map(Number).sort((a, b) => a - b); const c = Math.max(ks[0], Math.min(ks[ks.length - 1], z));
  for (let i = 1; i < ks.length; i++) if (c <= ks[i]) { const u = (c - ks[i - 1]) / (ks[i] - ks[i - 1]); return gumY[ks[i - 1]] + (gumY[ks[i]] - gumY[ks[i - 1]]) * u - 0.1; } return gumY[ks[0]] - 0.1; };

// --- the bridge: retainer on 13, pontic at 12, one connector between them (one piece, held in each unit's tooth frame)
const bridge = new THREE.Group();
const inFrame = (frame, mesh) => { const h = new THREE.Group(); h.applyMatrix4(frame.matrixWorld); h.add(mesh); bridge.add(h); return h; };
const retainer = DK.restorationCrown(s13, 'zirconia', PREP); retainer.name = 'Retainer';
inFrame(t13.tooth.group, retainer);
const pontic = DK.pontic(s12, { design: 'modified ridge lap', ridgeY }, 'zirconia');
inFrame(f12, pontic);
// connector: in 12's frame, from inside the pontic's distal face to inside the canine's mesial face
const p13 = f12.worldToLocal(t13.tooth.group.localToWorld(V([s13.md / 2, 0, 0])));
const CY = 0.55 * Math.min(s12.crownL, s13.crownL);
const conn = DK.connector(p13.x - 0.7, -s12.md / 2 + 0.9, CY, -0.4, CONN.h, CONN.w, 'zirconia');
inFrame(f12, conn);
fig.part(bridge, { name: 'Bridge', label: false, explode: [0, -13, 0], info: 'One zirconia piece: a crown on the canine and a false tooth fixed to its side. It is cemented, not removable.' });
fig.part(retainer, { inPlace: true, name: 'Retainer', sub: 'crown on 13', anchor: [-0.6, s13.crownL * 0.5, s13.bl / 2 - 0.3], dim: false, info: 'A full crown cemented on the prepared canine. It is the only support: the whole bridge hangs from this tooth.' });
fig.part(pontic, { inPlace: true, name: 'Pontic', sub: 'replaces 12', anchor: [0.4, s12.crownL * 0.45, s12.bl / 2 - 0.2], accent: true, dim: false, info: 'The false tooth. It has no root and is not fixed to the gum or to 11: it hangs off the canine, so it suits a light-load gap like a missing lateral incisor.' });
fig.part(conn, { inPlace: true, name: 'Connector', sub: `${CONN.h} × ${CONN.w} mm, ${CONN.h * CONN.w} mm²`, anchor: [(p13.x - s12.md / 2) / 2 + 0.4, CY + CONN.h / 2 - 0.3, CONN.w / 2 - 0.2], dim: false, info: 'The joint on the canine side, the only one. It takes all the bending load: zirconia cantilevers need about 10 to 15 mm², taller rather than wider.' });

// --- neighbours and markers
fig.part(t11.tooth.group, { inPlace: true, name: '11 untouched', sub: 'no crown, no wing', anchor: [s11.md / 2 - 2.2, s11.crownL * 0.55, s11.bl / 2 - 0.3], dim: false, info: 'The central incisor is not prepared. The pontic only touches its side, so this end of the bridge is free.' });
fig.part(t13.tooth.stump, { inPlace: true, name: 'Prepared canine', sub: 'the only abutment', anchor: [0.3, s13.crownL * 0.45, s13.blC / 2 - PREP.axial + 0.1], dim: false, when: e => e > 0.5, info: 'The canine, reduced about 1 mm all round for the zirconia crown. Its long root (about 17 mm) makes it a strong abutment.' });
const gap = new THREE.Object3D(); gap.position.copy(f12.localToWorld(V([0, s12.crownL * 0.45, s12.bl / 2 - 0.5]))); fig.world.add(gap);
fig.part(gap, { inPlace: true, name: 'Missing 12', anchor: [0, 0, 0], dim: false, when: e => e > 0.6, info: 'Upper right lateral incisor, lost. A small tooth that takes little biting force.' });
// biting force on the pontic edge: the load is carried through the connector to the canine alone
const edge = f12.localToWorld(V([0, s12.crownL - 0.3, 0.6]));
const force = DK.arrow({ from: [edge.x, edge.y - 7, edge.z + 2.2], to: [edge.x, edge.y - 0.4, edge.z + 0.3], width: 0.7, head: 2.0, normal: [-0.3, 0, 1], color: fig.dark ? 0xd8d4cc : 0x3a3a36 });
fig.world.add(force);
fig.part(force, { inPlace: true, name: 'Bite', sub: 'carried by 13 alone', anchor: [edge.x, edge.y - 6.2, edge.z + 2.0], dim: false, when: () => force.visible, info: 'A bite on the pontic bends the bridge about the canine. Keep it out of heavy contact; that is why cantilevers suit light-load spaces.' });
fig.param('force', 0, k => { force.visible = k > 0.02; force.material.opacity = k; });

fig.standardControls({ explode: true, explodeLabel: 'Take off', section: false });

// story: the gap and the prepared canine → the bridge rises into place → push in on the one connector → round to the free end beside
// 11 → a bite on the pontic, carried by the canine alone → front three-quarter of the whole bridge (teaching shot)
const CF = f12.localToWorld(V([(p13.x - s12.md / 2) / 2, CY, 0])).toArray();
const PF = f12.localToWorld(V([0, s12.crownL * 0.5, 0])).toArray();
fig.view('Front', { theta: -0.08, phi: 1.72, zoom: 0.8, focus: PF, explode: 0, labels: ['Retainer', 'Pontic', '11 untouched'] });
fig.view('Side', { theta: -0.7, phi: 2.25, zoom: 0.62, focus: CF, explode: 0, labels: ['Connector', 'Retainer', 'Pontic'] });
fig.story([
  { dur: 0, hold: 1.6, theta: -0.2, phi: 1.78, zoom: 1, explode: 1, set: { force: 0 }, labels: ['Missing 12', 'Prepared canine'] },
  { dur: 2.4, hold: 1.4, explode: 0, theta: -0.4, phi: 1.86, labels: ['Pontic', 'Retainer'] },
  { dur: 2.2, hold: 2.2, zoom: 0.62, focus: CF, theta: -0.7, phi: 2.25, labels: ['Connector', 'Retainer'] },
  { dur: 2.4, hold: 2.0, zoom: 0.55, focus: [PF[0] + 2.5, PF[1], PF[2]], theta: 0.35, phi: 1.8, labels: ['11 untouched', 'Pontic'] },
  { dur: 1.8, hold: 2.2, zoom: 0.62, focus: PF, theta: -0.3, phi: 1.62, set: { force: 1 }, labels: ['Bite', 'Retainer'] },
  { dur: 2.4, hold: 3.0, zoom: 0.8, focus: [PF[0] + 2.5, PF[1] - 0.5, PF[2] - 1], theta: -0.32, phi: 1.8, set: { force: 0 }, labels: ['Retainer', 'Pontic', 'Connector', '11 untouched'] }   // teaching shot
]);
fig.start();
