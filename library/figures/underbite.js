// Underbite (skeletal Class III): an average adult jaw (DK.mandible with the upper jaw), the lower jaw grows longer and its front teeth close in front of the upper ones. Frame: DK.mandible (+x = patient's left, +z anterior, y up); seen from the patient's right.
// poster: end
const GROW = 0.085;       // the lower jaw's body and rami lengthen by this fraction, measured from the condyles (schematic)
const SHIFT = 6.5;        // mm the lower teeth come forward with it: about one premolar width, a full-unit Class III at the molars (schematic)
const fig = DK.figure({
  fov: 34,
  title: 'Underbite',
  subtitle: 'Seen from the right. Average adult jaw; lower jaw lengthened, schematic.',
  view: { theta: -1.05, phi: 1.45, margin: 0.8 }
});

const m = DK.mandible({ teeth: true, upper: 'bone', maxilla: { crop: 37 } });
const mx = m.maxilla, Cz = m.centres.left.z, Cy = m.centres.left.y;
fig.part(m.group, { name: 'Jaws', label: false, info: 'Average adult upper and lower jaw with their teeth.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'The upper jaw (maxilla), cut flat below the eyes. In an underbite it is often normal or a little short.' });

// --- context: only the upper jaw and the two jaws' teeth (no arches, joints or discs: the story is the jaw length)
[mx.zygoma.left, mx.zygoma.right, mx.temporal.left, mx.temporal.right, ...Object.values(mx.joints), ...Object.values(m.discs || {}).flatMap(d => [d, ...(d.userData.laminae || []), ...(d.userData.pterygoid || [])])].forEach(o => { if (o && o.parent) o.parent.remove(o); });
DK.fadeMaterial(mx.maxilla.material, 1);

// --- a growth arrow under the chin: from the average chin to the grown one (ink, follows the param)
m.body.geometry.computeBoundingBox();
const bb = m.body.geometry.boundingBox, chinZ = bb.max.z, lowY = bb.min.y;
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xc8c2b6 : 0x4f4b44), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const arrowHold = new THREE.Group(); m.group.add(arrowHold);
function drawArrow(len) {
  arrowHold.clear();
  if (len < 1.2) return;
  arrowHold.add(DK.arrow({ from: [0, lowY - 3, chinZ], to: [0, lowY - 3, chinZ + len], width: 1.2, head: 3.6, normal: [-1, 0, 0], material: inkMat }));
}

// --- grow: body and rami stretch forward from the condyles (the joints stay in their sockets); the lower teeth ride forward
const stretch = [m.body, m.rami.left, m.rami.right];
const open = new THREE.Quaternion(), axis = new THREE.Vector3(1, 0, 0), pivot = new THREE.Vector3(0, Cy, Cz);
let grow = 0, gape = 0;
function applyJaw() {
  const s = 1 + GROW * grow;
  stretch.forEach(b => { b.scale.z = s; b.position.z = Cz * (1 - s); });
  m.teeth.group.position.z = SHIFT * grow;
  // hinge open about the condyles so the incisors pass each other on the way
  open.setFromAxisAngle(axis, gape);
  const p = pivot.clone().sub(pivot.clone().applyQuaternion(open));
  m.jaw.quaternion.copy(open); m.jaw.position.copy(p); m.jaw.updateMatrix();
  drawArrow(GROW * grow * (chinZ - Cz));
}
// the jaw opens a little while it grows, so the front teeth pass each other instead of through each other
fig.param('grow', 0, v => { grow = v; gape = 0.09 * Math.sin(Math.PI * DK.util.clamp(v, 0, 1)); applyJaw(); });

// --- labels
const t11 = mx.teeth.teeth.find(t => t.fdi === 11), t41 = m.teeth.teeth.find(t => t.fdi === 41);
fig.part(m.body, { inPlace: true, name: 'Lower jaw', sub: 'grown longer', anchor: [-30, -10, -20], labelOffset: [-60, 60], dim: false,
  when: () => grow > 0.5, info: 'In most underbites the lower jaw grows longer than average (sometimes the upper jaw is short). It runs in families and keeps growing into the late teens.' });
fig.part(t41.tooth.group, { inPlace: true, name: 'Lower front teeth', accent: true, anchor: [0, t41.spec.crownL - 1.5, 2.6], labelOffset: [70, 50], dim: false,
  info: 'Lower right central incisor, FDI 41 (Universal 25). In an underbite it closes in front of the upper incisors.' });
fig.part(t11.tooth.group, { inPlace: true, name: 'Upper front teeth', anchor: [0, t11.spec.crownL - 2, 3.0], labelOffset: [70, -60], dim: false,
  info: 'Upper right central incisor, FDI 11 (Universal 8). Normally it sits just in front of the lower incisors and overlaps them by about 2 to 3 mm.' });

fig.view('Normal bite', { theta: -0.62, phi: 1.62, zoom: 0.42, focus: [-3, 5, 0], set: { grow: 0 }, labels: ['Upper front teeth', 'Lower front teeth'] }, 1.4);
fig.view('Underbite', { theta: -0.55, phi: 1.62, zoom: 0.72, focus: [-4, 0, -10], set: { grow: 1 }, labels: ['Upper front teeth', 'Lower front teeth', 'Lower jaw'] }, 1.4);

const CLOSE = { theta: -0.62, phi: 1.62, zoom: 0.42, focus: [-3, 5, 0] };   // front teeth, from the front right and a little below
fig.story([
  { dur: 0, hold: 1.4, theta: -1.05, phi: 1.45, zoom: 1, labels: [], caption: 'An average jaw with a normal bite.' },
  Object.assign({ dur: 2.4, hold: 2.0, labels: ['Upper front teeth', 'Lower front teeth'], caption: 'Normally the upper front teeth close just in front of the lower ones.' }, CLOSE),
  { dur: 2.2, hold: 0.2, theta: -Math.PI / 2, phi: 1.52, zoom: 0.95, focus: 'auto', labels: [] },
  { dur: 3.2, hold: 1.8, set: { grow: 1 }, labels: ['Lower jaw'], caption: 'In an underbite the lower jaw grows longer.' },
  Object.assign({ dur: 2.4, hold: 2.2, labels: ['Upper front teeth', 'Lower front teeth'], caption: 'Its front teeth now close in front of the upper ones.' }, CLOSE),
  { dur: 2.4, hold: 2.4, theta: -0.55, phi: 1.62, zoom: 0.72, focus: [-4, 0, -10], labels: ['Lower jaw', 'Lower front teeth', 'Upper front teeth'] }
]);
fig.start();
