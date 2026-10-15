// Example: lateral excursion of the mandible to the PATIENT'S RIGHT. The right condyle is the working (laterotrusive) condyle:
// it pivots about a near-vertical axis with a small immediate side shift (Bennett movement). The left condyle is the non-working
// (mediotrusive, orbiting) condyle: it travels forward, down the articular eminence and medially. DK.mandible builds the jaw
// (body, rami, coronoid processes, condyles) with the lower teeth; `upper: 'bone'` adds DK.maxilla (the upper teeth on their roots in
// the maxilla, the zygomatic arches and the temporal bone with the fossa and eminence carved into it, both articular discs riding on
// their condyles); DK.jawPose moves the jaw rigidly and returns where each condyle went, so the path, the
// readout and the labels all come from the same pose. Frame (DK.arch): +x = patient's LEFT, +z anterior, y up; a front camera
// (theta 0) shows the patient's right on the viewer's LEFT. Values are population averages (dental-facts §21).
const MAX = 8;                                   // mm the lower midline moves to the right (a normal lateral excursion is ~8 mm or more)
const INK = 0x8a857c;                            // quiet guides (axis, sagittal line, midlines)
const fig = DK.figure({
  title: 'Jaw moving to the right',
  subtitle: "Patient's right = working side. Average adult jaw; values approximate.",
  view: { theta: 0.5, phi: 1.22, margin: 0.86 }
});

// --- the jaw (moves) under the maxilla, zygomatic arches and temporal bone (static, see-through); both discs ride on their condyles
const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla, discs = m.discs, tmjR = mx.joints.right, tmjL = mx.joints.left;
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult mandible with its teeth, under the upper jaw and the two temporomandibular joints.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Maxilla', label: false, info: 'Upper jaw: alveolar process with every upper tooth on its roots in a socket, the hard palate, tuberosities and the anterior nasal spine; the zygomatic buttress rises over the first molar. Cut flat below the orbits.' });
fig.part(mx.temporal.right, { inPlace: true, name: 'Right fossa', label: false, info: 'Glenoid fossa and articular eminence of the right temporal bone (drawn see-through).' });
const crestCut = tmjL.userData.at(m.eminence.length, 0.5 / m.axes.left.x);   // the crest on the section plane (x = L.x + 0.5)
fig.part(mx.temporal.left, { inPlace: true, name: 'Articular eminence', sub: 'left', anchor: (e, sec) => sec.enabled ? crestCut : tmjL.userData.anchors.crest, labelOffset: [-75, -80],
  info: 'The convex slope in front of the fossa, carved into the temporal bone. The non-working condyle slides down it with its disc, so that side of the jaw drops.' });
fig.part(discs.left, { inPlace: true, name: 'Articular disc', sub: 'moves with the condyle', anchor: discs.left.userData.anchors.lateral, labelOffset: [80, -65], dim: false,
  info: 'Biconcave fibrocartilage: a thick posterior band (about 3 mm) and an anterior band (about 2 mm) around a thin intermediate zone (about 1 mm). The condyle rotates beneath it (lower joint space); disc and condyle translate together down the eminence (upper joint space). Retrodiscal tissue behind.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The mandible moves as one rigid bone, so what one condyle does fixes what the other can do.' });
fig.part(m.upper.holder, { inPlace: true, name: 'Upper teeth', label: false, info: 'Maxillary teeth, fixed to the skull. The lower teeth slide across them; the canines guide the jaw apart.' });
fig.enableSection([1, 0, 0], [
  { objects: m.bone, color: 0xCCC3B2, kind: 'plain' },          // the condyle: a smooth, slightly darker cut
  { objects: mx.bone, color: 0xEAE5DA, kind: 'cortical' },      // fossa, eminence and temporal bone: pale, grained
  { objects: [discs.left.userData.disc, discs.right.userData.disc], color: 0xB89F98, kind: 'plain' },   // the disc: the darkest tone, so its 3 / 1 / 2 mm profile reads
  { objects: [...discs.left.userData.laminae, ...discs.right.userData.laminae], color: 0xD6C2BC, kind: 'plain' }
]);

// the two condyles move with the jaw: their anchors are frame points at rest (the top of each head)
const headTop = side => { const c = m.centres[side]; return [c.x, c.y + m.head.si / 2, c.z]; };
fig.part(m.condyles.right, { inPlace: true, name: 'Right condyle', sub: 'working: pivots', anchor: headTop('right'), labelOffset: [-80, -70], dim: false,
  info: 'Working (laterotrusive) condyle, on the side the jaw moves toward. It rotates about a near-vertical axis and shifts only slightly outward (Bennett movement). It does not stay perfectly still.' });
fig.part(m.condyles.left, { inPlace: true, name: 'Left condyle', sub: 'non-working: orbits', anchor: headTop('left'), labelOffset: [80, -70], dim: false,
  info: 'Non-working (mediotrusive, orbiting) condyle, on the side the jaw moves away from. It travels forward, down the articular eminence and medially.' });

// ghosts of both condyles at rest (static, see-through), shown once the jaw has moved
const ghostMat = DK.mat('bone', { opacity: 0.26 }); Object.assign(ghostMat, { depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const ghosts = ['left', 'right'].map(s => { const g = new THREE.Mesh(m.condyles[s].geometry, ghostMat); g.userData.noShadow = true; g.renderOrder = 2; g.visible = false; m.group.add(g); return g; });

// --- the non-working condyle's path: DK.condylePath traces its centre; drawn at the lateral pole so it stays outside the head
const OFF = m.axes.left.clone().multiplyScalar(m.head.ml / 2 + 0.5), POLE = m.centres.left.clone().add(OFF);
const pathMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });
const path = DK.tube([POLE.toArray(), POLE.clone().add(new THREE.Vector3(0, 0, 0.1)).toArray()], 0.42, pathMat, { segments: 48, radial: 10 });
path.userData.noShadow = true; m.group.add(path);
const pathPart = fig.part(path, { inPlace: true, name: 'Condyle path', sub: 'forward, down, in', accent: true, anchor: POLE.toArray(), labelOffset: [90, 40], dim: false,
  info: 'Path of the non-working condyle: forward and down the eminence (sagittal condylar guidance) and medially. Seen from above it leaves the sagittal plane at the Bennett angle.' });
const tracePath = v => {
  const pts = v > 0.05 ? DK.condylePath(m, { lateral: v, side: 'right' }, 24).left.map(p => [p[0] + OFF.x, p[1] + OFF.y, p[2] + OFF.z]) : [POLE.toArray(), POLE.clone().add(new THREE.Vector3(0, 0, 0.05)).toArray()];
  const fresh = DK.tube(pts, 0.42, pathMat, { segments: 48, radial: 10 });
  path.geometry.dispose(); path.geometry = fresh.geometry; path.children.forEach((c, i) => c.position.copy(fresh.children[i].position));
  path.visible = v > 0.3; pathPart.setAnchor(pts[pts.length - 1]);
};
// guides: a sagittal line from the condyle's resting place (the Bennett angle opens from it), the working condyle's vertical
// axis, and the two midlines (upper fixed, lower moving with the jaw)
const guideMat = new THREE.MeshBasicMaterial({ color: DK.color(INK), toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide });
const guide = (pts, r, parent) => { const g = DK.tube(pts, r, guideMat, { caps: false, segments: 4, radial: 8 }); g.userData.noShadow = true; parent.add(g); return g; };
const sagittal = guide([POLE.toArray(), POLE.clone().add(new THREE.Vector3(0, 0, 12)).toArray()], 0.2, m.group);
const axis = guide([[0, -9, 0], [0, 15, 0]], 0.24, m.group);
// a turn arrow above the working condyle (in the horizontal plane): the jaw swings its left side forward about the axis
const turn = new THREE.Group(); m.group.add(turn);
const arc = Array.from({ length: 25 }, (_, i) => { const a = (-60 + 110 * i / 24) * Math.PI / 180; return [8 * Math.cos(a), 10.5, 8 * Math.sin(a)]; });
const tipA = 62 * Math.PI / 180, tip = [8 * Math.cos(tipA) - 2.4 * Math.sin(tipA), 10.5, 8 * Math.sin(tipA) + 2.4 * Math.cos(tipA)];
turn.add(DK.ribbon(arc, 0.55, [0, 1, 0], { material: guideMat }), DK.arrow({ from: arc[23], to: tip, width: 0.55, head: 2.2, normal: [0, 1, 0], material: guideMat }));
turn.traverse(o => { o.userData.noShadow = true; });
fig.part(axis, { inPlace: true, name: 'Vertical axis', sub: 'the jaw turns about it', anchor: [0, 14, 0], labelOffset: [-90, -30], dim: false,
  info: 'In a lateral excursion the jaw turns about a near-vertical axis close to the working condyle.' });
const midMat = new THREE.MeshBasicMaterial({ color: DK.color(INK), toneMapped: false });
const up = m.upper.holder.position, Iz = m.incisal.z;
[[[0, up.y - 9.6, up.z + 1.9], [0, up.y - 6, up.z + 2.6]], [[0, 1.2, Iz + 2.9], [0, 5.6, Iz + 2.3]]].forEach((pts, i) => {
  const t = DK.tube(pts, 0.22, midMat, { caps: false, segments: 4, radial: 8 }); t.userData.noShadow = true; (i ? m.jaw : m.group).add(t); });

// --- the pose: one number (mm the lower midline moves right) drives the jaw, the path, the ghosts and the readout
let pose = null, shown = '';
const slider = fig.slider('Move right', 0, MAX, 0.1, 0, v => fig.goTo({ set: { lateral: v } }, 0));
fig.param('lateral', 0, v => {
  pose = m.pose({ lateral: v, side: 'right' }); tracePath(v); slider.value = v;
  axis.position.copy(pose.working.now); turn.position.copy(pose.working.now); ghosts.forEach(g => { g.visible = v > 0.3; });
});
fig.param('guides', 0, v => { guideMat.opacity = 0.9 * v; sagittal.visible = axis.visible = turn.visible = v > 0.01; });
[tmjR, tmjL].forEach(t => { t.userData.line.material.transparent = true; });
fig.param('context', 0.85, v => [mx.maxilla, mx.zygoma.left, mx.zygoma.right].forEach(b => DK.fadeMaterial(b.material, v)));
fig.param('fossa', 0.3, v => { [mx.temporal.left, mx.temporal.right].forEach(b => DK.fadeMaterial(b.material, v)); [tmjR, tmjL].forEach(t => { t.userData.line.material.opacity = Math.min(1, v / 0.3); }); });
fig.onFrame(() => {
  const N = pose.nonWorking, W = pose.working, key = N.travel.toFixed(1) + W.lateral.toFixed(2);
  if (key === shown) return; shown = key;
  const sub = pose.bennett > 0.5 ? `Bennett angle ≈ ${Math.round(pose.bennett)}°` : 'forward, down, in';
  pathPart.sub = sub; pathPart.el.innerHTML = pathPart.name + '<small>' + sub + '</small>';
  fig.setReadout(pose.incisal.lateral < 0.05 ? [{ k: 'Jaw', v: 'closed, teeth together' }] : [
    { k: 'Lower midline', v: `${pose.incisal.lateral.toFixed(1)} mm right` },
    { k: 'Left (non-working) condyle', v: `${N.travel.toFixed(1)} mm: ${N.forward.toFixed(1)} forward, ${N.down.toFixed(1)} down, ${N.medial.toFixed(1)} in` },
    { k: 'Bennett angle', v: `≈ ${Math.round(pose.bennett)}°` },
    { k: 'Right (working) condyle', v: `${W.lateral.toFixed(1)} mm side shift` }]);
});

// --- steps: closed → move right → the working side → the non-working side down the eminence → from above (Bennett angle)
const R = m.centres.right, L = m.centres.left;
fig.procedure([
  { label: 'Closed', caption: 'Teeth together; both condyles seated in their fossae.', beats: [
    { dur: 0, hold: 1.4, theta: 0.5, phi: 1.22, zoom: 1, focus: 'auto', set: { lower: 1, lateral: 0, guides: 0, context: 0.85, fossa: 0.22 }, section: false, labels: ['Right condyle', 'Left condyle'], key: true }] },
  { label: 'Move right', caption: "The lower jaw slides toward the patient's right; the lower midline follows.", beats: [
    { dur: 1.4, hold: 0.2, theta: 0.1, phi: 1.36, zoom: 0.92, labels: ['Right condyle', 'Left condyle'] },
    { dur: 2.4, hold: 1.8, set: { lateral: MAX }, labels: ['Right condyle', 'Left condyle'], key: true }] },
  { label: 'Working side', caption: 'The right condyle turns in place and shifts slightly outward.', beats: [
    { dur: 1.8, hold: 0.2, theta: -1.6, phi: 0.45, zoom: 0.45, focus: [R.x, R.y - 6, R.z + 6], set: { lower: 1, lateral: 0, guides: 1, context: 0.06, fossa: 0.05 }, labels: ['Right condyle', 'Vertical axis'] },
    { dur: 2.2, hold: 1.8, set: { lateral: MAX }, labels: ['Right condyle', 'Vertical axis'], key: true }] },
  { label: 'Non-working side', caption: 'The left condyle and its disc slide forward and down the eminence; rotation occurs below the disc.', beats: [
    { dur: 1.8, hold: 0.2, theta: Math.PI / 2 - 0.25, phi: 1.45, zoom: 0.26, focus: [L.x, L.y + 1, L.z + 5], set: { lower: 1, lateral: 0, guides: 0, context: 0.08, fossa: 0.12 }, labels: ['Articular disc', 'Articular eminence'] },
    { dur: 2.4, hold: 1.8, set: { lateral: MAX }, labels: ['Articular disc', 'Articular eminence', 'Condyle path'], key: true }] },
  { label: 'From above', caption: 'Seen from above, the path also runs medially: the Bennett angle.', beats: [
    { dur: 2.2, hold: 2.2, theta: 0.0, phi: 0.32, zoom: 0.92, focus: [0, R.y, R.z + 8], set: { guides: 1, context: 0.04, fossa: 0.04 }, labels: ['Right condyle', 'Left condyle', 'Condyle path'], key: true }] }
]);
fig.view('Palate', { theta: 0.3, phi: 2.9, zoom: 0.8, focus: [0, 25, -45], section: false, set: { lateral: 0, context: 0.85, fossa: 0.3, guides: 0, lower: 0 }, labels: [] });
fig.param('lower', 1, v => { m.jaw.visible = v > 0.5; });
fig.view('Section', { theta: Math.PI / 2, phi: 1.5, zoom: 0.15, focus: [L.x, L.y + 1, L.z + 4], section: true, offset: L.x + 0.5,
  set: { context: 0.3, fossa: 0.1, guides: 0, lower: 1 }, labels: ['Articular disc', 'Articular eminence'] });
fig.start();
