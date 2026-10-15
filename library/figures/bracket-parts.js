// Parts of a brace on the upper right central incisor (FDI 11 = Universal 8), in the mouth (crowns down), arch frame: +x = patient's left, +z anterior.
// poster: end
// The upper arch 16–26 carries twin brackets (0.022 in slots, MBT-style heights), molar tubes, elastomeric ligatures and a 0.019 × 0.025 in
// steel archwire, exactly as the braces example. Taking it apart leaves the brackets bonded: every ring lifts off
// along its tooth's outward normal and the wire drops out of the slots toward the incisal edges, so the last frame names every part on 11. Sizes in mm (dental-facts §9, §19).
const SLOT = '0.022', WIRE = '0.019x0.025';
const fig = DK.figure({
  fov: 34,
  title: 'Parts of a brace',
  subtitle: 'Upper right central incisor, FDI 11 (Universal 8), in the mouth.',
  view: { theta: 0.2, phi: 1.72, margin: 0.68 }
});
const HEIGHT = { 1: 5.0, 2: 4.5, 3: 5.0, 4: 4.5, 5: 4.0, 6: 3.5 };   // slot centre from the incisal edge / cusp tip, MBT-style average upper row (facts §19)

// --- the arch: enamel crowns only (the roots would sit inside the ridge)
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Maxillary teeth 16–26, in the mouth.' });
arch.group.updateMatrixWorld(true);
const teeth = [], wirePts = [];
arch.teeth.forEach(({ fdi, tooth: t, spec: sp, slot }) => {
  const p = fdi % 10, n = new THREE.Vector3(slot.n[0], 0, slot.n[1]), hero = fdi === 11;
  fig.part(t.group, { inPlace: true, name: hero ? 'Incisor 11' : String(fdi), label: false, info: `${sp.name}, FDI ${fdi}.` });
  const part = p === 6 ? DK.molarTube(sp, { slot: SLOT, height: HEIGHT[6], hook: true }) : DK.bracket(sp, { slot: SLOT, height: HEIGHT[p] });
  wirePts.push(t.group.localToWorld(new THREE.Vector3(...part.wirePoint(DK.wireSize(WIRE).d))).toArray());
  const lig = p === 6 ? null : DK.ligature(part);
  [part, lig].forEach(o => { if (!o) return; o.updateMatrix(); o.applyMatrix4(t.group.matrixWorld); });
  teeth.push({ fdi, t, n, part, lig });
  if (p === 6) { fig.part(part, { name: 'Molar tube', label: false, info: 'On the first molars a tube replaces the bracket: the wire ends in it.' }); return; }
  fig.part(part, { name: hero ? 'Bracket' : 'Bracket ' + fdi, sub: 'bonded to the enamel', label: hero, accent: false,
    anchor: [-part.userData.width / 2 - 0.05, -part.userData.tall / 2 + 0.3, part.userData.face - 0.3], dim: false,
    labelOffset: [-120, 50],
    info: `A stainless-steel twin bracket, glued to the front of the tooth ${HEIGHT[p]} mm from the edge (MBT-style chart). It is the handle the wire pushes on.` });
  fig.part(lig, { name: hero ? 'Ligature' : 'Ligature ' + fdi, sub: 'elastic ring', label: hero, dim: false, anchor: lig.userData.sidePoints[1],
    explode: n.clone().multiplyScalar(4).toArray(), labelOffset: [110, -40],
    info: 'A small elastic O-ring stretched over the four tie wings. It holds the wire down in the slot and is changed at each visit (the coloured "bands").' });
});
const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gum', label: false, fit: false, info: 'Gum around the necks of the teeth (schematic).' });

// --- the archwire through every slot
const wire = DK.archwire(wirePts, { size: WIRE, material: 'steel', overhang: 1.2 });
const i11 = teeth.findIndex(t => t.fdi === 11), T11 = teeth[i11], b11 = T11.part, N11 = T11.n;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
fig.part(wire, { name: 'Archwire', sub: `${DK.wireSize(WIRE).name} steel`, anchor: mid(wirePts[i11], wirePts[i11 - 1]), explode: [0, -4.2, 0], labelOffset: [-110, 70], dim: false,
  info: 'One wire runs through every bracket. Bent to the ideal arch shape, it slowly pulls the teeth into line. Treatment starts with thin round wires; stiffer rectangular ones like this come later.' });

// --- the parts of the bracket itself, on 11 (bracket frame: origin = slot centre, x mesio-distal, y along the tooth, z out of the tooth)
const u = b11.userData, wW = (u.width - u.gap) / 2, capH = u.tall / 2 - u.slot.w / 2;
fig.part(b11, { inPlace: true, name: 'Slot', sub: `${DK.SLOTS[SLOT].name}`, accent: true, anchor: [-u.width / 2 - 0.05, 0, u.floor + 0.25], dim: false, labelOffset: [-110, -10],
  when: e => e > 0.5, info: `The groove the wire sits in: ${DK.SLOTS[SLOT].w.toFixed(2)} mm high and ${DK.SLOTS[SLOT].d.toFixed(2)} mm deep (${DK.SLOTS[SLOT].name}). Its built-in angles tell the wire how to hold the tooth.` });
fig.part(b11, { inPlace: true, name: 'Tie wings', sub: 'hold the ring', anchor: [u.gap / 2 + wW * 0.7, capH + u.slot.w / 2 - 0.2, u.face - 0.1], dim: false, labelOffset: [90, 60],
  when: e => e > 0.5, info: 'Four small wings, two above and two below the slot. The ligature hooks under them.' });
fig.part(b11, { inPlace: true, name: 'Base', sub: 'glued with adhesive', anchor: [0, -u.tall / 2 - 0.1, u.floor - 0.62], dim: false, labelOffset: [70, 120],
  when: e => e > 0.5, info: 'A pad shaped to the curve of the tooth. The enamel is etched and the pad is bonded on with a resin adhesive; at the end it is popped off and the tooth polished.' });

fig.standardControls({ explode: true, explodeLabel: 'Take apart' });
fig.view('Front', { fov: 34, theta: 0, phi: 1.62, zoom: 1, focus: 'auto', explode: 0 });

// --- story: the whole arch → push in on 11 (bracket, wire, ring seated) → the brace on 11 comes apart → hero: every part named
const P11 = b11.position.clone(), F11 = P11.clone().addScaledVector(N11, 2.5).add(new THREE.Vector3(0, -1.6, 0));
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.62, zoom: 1, labels: [], caption: 'Braces on the upper teeth.' },
  { dur: 2.4, hold: 2.0, theta: -0.35, phi: 1.68, zoom: 0.3, focus: P11.toArray(), labels: ['Bracket', 'Archwire', 'Ligature'], caption: 'Each brace: a bracket, the wire and a ring.' },
  { dur: 2.4, hold: 0.4, theta: -0.45, phi: 1.78, zoom: 0.36, focus: F11.toArray(), explode: 1, labels: ['Bracket', 'Archwire', 'Ligature'], caption: 'Taken apart.' },
  { dur: 1.6, hold: 2.6, theta: -0.55, phi: 1.8, zoom: 0.35, labels: ['Bracket', 'Slot', 'Tie wings', 'Base', 'Archwire', 'Ligature'], caption: 'The wire sits in the slot; the ring hooks under the wings.' }
]);
fig.start();
