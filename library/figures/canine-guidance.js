// Comparison as three steps: the jaw slides to the PATIENT'S RIGHT (working side) under canine guidance (only 13/43 touch, every other tooth apart) and under group function (43, 44, 45 and the mesiobuccal cusp of 46 share the contact). Frame: DK.mandible (+x = patient's left, +z anterior, y up); the camera looks at the patient's right side.
// poster: step 2
// The kit poses the jaw rigidly and has no cusp-by-cusp contact analysis: the disclusion is set per pattern (larger for canine guidance,
// near zero for group function) and the contacts are drawn as markers on the lower cusp tips. Facts §21 (guidance in lateral excursion).
const LAT = 5;                                   // mm the lower midline moves right (within the 8-12 mm normal range; guidance acts in the first few mm)
const DIS = { canine: 2.6, group: 0.25 };        // incisal drop added by the guidance (mm; schematic)
const fig = DK.figure({
  fov: 32,
  title: 'Canine guidance vs group function',
  subtitle: "Jaw moving to the patient's right. Average jaw; contacts schematic.",
  view: { theta: -1.2, phi: 1.45, margin: 0.86 }
});

let mode = 'canine', lat = 0, pose = null, shown = '';
const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla;
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult jaw seen from the patient\'s right, under the upper jaw.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'Upper jaw with its teeth; it does not move.' });
fig.part(m.body, { inPlace: true, name: 'Lower jaw', label: false, info: 'The lower jaw slides to the right; which teeth stay in contact depends on the guidance.' });
const lower = fdi => m.teeth.teeth.find(t => t.fdi === fdi), upperT = fdi => m.upper.teeth.find(t => t.fdi === fdi);

// cusp tips on the lower right teeth (their own frame): highest enamel point, on the buccal half for the posterior teeth
const tip = (t, filter) => { const p = t.tooth.layers.enamel.geometry.attributes.position, v = new THREE.Vector3(); let best = null;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); if (filter && !filter(v)) continue; if (!best || v.y > best.y) best = v.clone(); } return best; };
const t43 = lower(43), t44 = lower(44), t45 = lower(45), t46 = lower(46);
const spots = {
  43: tip(t43), 44: tip(t44, v => v.z > 0.5), 45: tip(t45, v => v.z > 0.5), 46: tip(t46, v => v.z > 0.8 && v.x > 1.0)
};
const dotMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, depthTest: false });
const dots = {};
Object.entries(spots).forEach(([fdi, p]) => {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 12), dotMat); d.position.copy(p).add(new THREE.Vector3(0, -0.5, 0.9)); d.renderOrder = 20; d.userData.noShadow = true; d.visible = false;
  lower(+fdi).tooth.group.add(d); dots[fdi] = d;
});
const canineDot = fig.part(dots[43], { inPlace: true, name: 'Canines touch', sub: 'they guide the jaw', anchor: [0, 0, 0], labelOffset: [70, -95], accent: true, dim: false, when: () => dots[43].visible && mode === 'canine',
  info: 'Canine guidance (canine-protected occlusion): in a side movement only the working-side canines touch; their long roots take the load and every other tooth separates.' });
fig.part(dots[44], { inPlace: true, name: 'Shared contact', sub: 'canine, premolars, first molar', anchor: [0, 0, 0], labelOffset: [-40, 110], accent: true, dim: false, when: () => dots[44].visible,
  info: 'Group function: the canine, both premolars and often the mesiobuccal cusp of the first molar share the contact on the working side. Common where canines are worn.' });
// a quiet ink gap mark between the upper and lower first molars (canine guidance only)
const gapAnchor = (() => { const s = spots[46]; return [s.x, s.y + 1.2, s.z + 0.4]; })();
fig.part(t46.tooth.group, { inPlace: true, name: 'Back teeth apart', sub: 'no contact', anchor: gapAnchor, labelOffset: [-60, 100], dim: false, when: () => mode === 'canine' && lat > LAT * 0.8,
  info: 'With canine guidance the premolars and molars separate as soon as the jaw moves sideways, which protects them from side loads.' });
fig.part(t43.tooth.group, { inPlace: true, name: 'Lower canine', label: false, info: 'Lower right canine, FDI 43 (Universal 27).' });
fig.part(upperT(13).tooth.group, { inPlace: true, name: 'Upper canine', label: false, info: 'Upper right canine, FDI 13 (Universal 6): the lower canine slides along its palatal slope.' });

// --- the pose: one number (mm to the right) and the guidance pattern
const apply = () => {
  pose = m.pose({ lateral: lat, side: 'right', disclude: DIS[mode] * Math.min(1, lat / 2.5) });
  const on = lat > 1.2;
  dots[43].visible = on; ['44', '45', '46'].forEach(f => { dots[f].visible = on && mode === 'group'; });
};
fig.param('lat', 0, v => { lat = v; apply(); });
fig.param('group', 0, v => { mode = v > 0.5 ? 'group' : 'canine'; apply(); });
fig.param('context', 0.85, v => { DK.fadeMaterial(mx.maxilla.material, v); [mx.zygoma.left, mx.zygoma.right].forEach(b => DK.fadeMaterial(b.material, v)); });
fig.onFrame(() => {
  const key = mode + lat.toFixed(1); if (key === shown) return; shown = key;
  fig.setReadout(lat < 0.2 ? [{ k: 'Jaw', v: 'closed, teeth together' }] : [
    { k: 'Lower midline', v: `${pose.incisal.lateral.toFixed(1)} mm right` },
    { k: mode === 'canine' ? 'Canine guidance' : 'Group function', v: mode === 'canine' ? 'canines only' : 'canine, premolars, first molar' }]);
});

// --- steps
const SIDE = { theta: -1.22, phi: 1.52, zoom: fig.mode === 'image' ? 0.23 : 0.34, fov: 28, focus: [-22, 5.5, -13] };   // image frames fit looser and wider
fig.procedure([
  { label: 'Teeth together', caption: 'Closed, the back teeth carry the bite.', beats: [
    { dur: 0, hold: 1.4, theta: -0.55, phi: 1.32, zoom: 0.95, fov: 34, focus: 'auto', set: { lat: 0, group: 0, context: 0.85 }, labels: [] },
    Object.assign({ dur: 2.2, hold: 1.0, labels: [], key: true }, SIDE)] },
  { label: 'Canine guidance', caption: 'Sliding right, only the canines touch; all other teeth come apart.', beats: [
    { dur: 0.8, hold: 0, set: { lat: 0, group: 0 }, labels: [] },
    { dur: 2.4, hold: 2.4, set: { lat: LAT }, theta: SIDE.theta - 0.06, labels: ['Canines touch', 'Back teeth apart'], key: true }] },
  { label: 'Group function', caption: 'Sliding right, the canine, premolars and first molar share the contact.', beats: [
    { dur: 1.6, hold: 0.1, set: { lat: 0 }, theta: SIDE.theta, labels: [] },
    { dur: 0, hold: 0, set: { group: 1 } },
    { dur: 2.4, hold: 2.4, set: { lat: LAT }, theta: SIDE.theta - 0.06, labels: ['Shared contact'], key: true }] }
]);
fig.view('Front', { theta: -0.2, phi: 1.45, zoom: 0.55, fov: 30, focus: [-8, 6, 0], labels: [] });
fig.start();
