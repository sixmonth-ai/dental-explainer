// Teeth grinding (bruxism): the masseter clenches, the lower jaw grinds side to side with the teeth in contact, and the cusp tips and incisal edges wear into flat facets (enamel ground through to a dentin island). Frame: DK.mandible (+x = patient's left, +z anterior, y up); the story ends on the worn lower teeth seen from above (upper teeth hidden).
// poster: end
const GRIND = 4;                                  // mm the lower midline slides to each side while grinding (a normal full excursion is ~8 mm or more, facts §21)
const fig = DK.figure({
  title: 'Teeth grinding',
  subtitle: 'Lower teeth from above, upper teeth hidden. Wear and muscle schematic.',
  view: { theta: 0.75, phi: 1.3, margin: 0.86 }
});

const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla, L = m.centres.left;
let pose = m.pose({}), wearNow = 0, shown = '';
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult jaw with its teeth, its two joints and the left masseter.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'Maxilla with the upper teeth, cut flat below the orbits.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The lower jaw. In grinding the muscles press it up against the upper teeth and drag it from side to side.' });

// --- the left masseter, built from its attachments: origin along the lower border of the zygomatic arch (fixed), insertion on the
// lateral surface of the ramus down to the angle (moves with the jaw). Fibres run down and back. Inner face follows the ramus.
const NU = 22, NV = 26;
const ramusX = z => DK.util.clamp(39.5 + (-50 - z) * 0.34, 39.5, 50.5);       // lateral ramus surface (sampled from the kit's mandible)
const arcTop = u => [53, 34.5 - 2.5 * u, -33 - 36 * u];                          // lower border of the arch, front of zygoma → in front of the joint
const arcBot = u => [0, -12.5 + 4 * u * u, -51 - 28 * u];                         // lower border of the ramus → the gonial angle
const restPts = [], weights = [];
function sheet(outer) {
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    // a rounded (superellipse) outline instead of a sharp quadrilateral: squeeze the corners of the (u, v) square
    const sx = 2 * i / NU - 1, sy = 2 * j / NV - 1, r = Math.max(Math.abs(sx), Math.abs(sy)), q = r ? r / Math.pow(Math.pow(Math.abs(sx), 3) + Math.pow(Math.abs(sy), 3), 1 / 3) : 1;
    const u = (sx * q + 1) / 2, v = (sy * q + 1) / 2, T = arcTop(u), B = arcBot(u), z = T[2] + (B[2] - T[2]) * v, y = T[1] + (B[1] - T[1]) * v;
    const inner = Math.max(T[0] + (ramusX(B[2]) - T[0]) * Math.pow(v, 0.8), ramusX(z) * (v > 0.35 ? 1 : 0)) + 0.4;
    const th = 8 * (0.8 + 0.4 * Math.sin(Math.PI * v)) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(sx), 3) - Math.pow(Math.abs(sy), 3) * 0.9), 0.5) * (1 - 0.3 * v) * (1 + 0.07 * Math.sin(u * Math.PI * 2 * 9));   // fibre bundles: shallow ridges running down and back
    restPts.push([inner + (outer ? th : 0), y, z, th, u, v]); weights.push(Math.pow(v, 1.15));
  }
}
sheet(false); sheet(true);
const geo = new THREE.BufferGeometry(), N1 = (NU + 1) * (NV + 1);
const pos = new Float32Array(restPts.length * 3), uv = new Float32Array(restPts.length * 2), idx = [];
restPts.forEach((p, k) => { uv[2 * k] = p[4] * 7; uv[2 * k + 1] = p[5] * 0.6; });
for (let s = 0; s < 2; s++) for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
  const a = s * N1 + j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
  if (s) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
}
geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
const muscleMat = DK.mat('gingiva', { color: 0xA0695E, roughness: 0.55, clearcoat: 0.15, bump: 'streaks', bumpScale: 0.09, map: 'streaks', opacity: 0.9, side: THREE.DoubleSide });
const masseter = new THREE.Mesh(geo, muscleMat); masseter.userData.noShadow = true; m.group.add(masseter);
let clench = 0;
const tmp = new THREE.Vector3();
function shapeMuscle(pose) {
  restPts.forEach((p, k) => {
    const x = k >= N1 ? p[0] + 0.2 * clench * p[3] : p[0];   // the outer face bulges when the muscle contracts
    tmp.set(x, p[1], p[2]); const q = pose.apply(tmp), w = weights[k];
    pos[3 * k] = x + (q.x - x) * w; pos[3 * k + 1] = p[1] + (q.y - p[1]) * w; pos[3 * k + 2] = p[2] + (q.z - p[2]) * w;
  });
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
}
const masseterPart = fig.part(masseter, { inPlace: true, name: 'Masseter', sub: 'closing muscle', anchor: [0, 0, 0], labelOffset: [90, 40], dim: false,
  info: 'The main closing muscle, from the cheekbone arch to the angle of the jaw. In clenching and grinding it works hard for long periods, which is why bruxers wake with tired, aching jaw muscles.' });
const masseterAnchor = () => { const k = N1 + Math.round(NV * 0.55) * (NU + 1) + Math.round(NU * 0.55); return [pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]]; };

// --- wear: every crown is ground down by a flat plane from its tip (front teeth most). Enamel is clamped to the plane and the crown
// dentin to just above it, so where the facet reaches the dentin a dentin island shows inside an enamel rim, as in real attrition.
const WEAR = { 1: 2.4, 2: 2.4, 3: 2.8, 4: 0.9, 5: 0.8, 6: 0.6, 7: 0.6 };   // mm at full wear, by tooth position: a severe, schematic case (front teeth and canines wear most)
const CLOSE = 1.2;                                                            // mm the bite closes as the back teeth wear (upper + lower molar wear)
const worn = [];
[m.teeth, mx.teeth].forEach(arch => arch.teeth.forEach(t => {
  const L2 = t.tooth.layers, en = L2.enamel, de = L2.dentin; if (!en || !de) return;
  en.geometry.computeBoundingBox(); const yTop = en.geometry.boundingBox.max.y;
  const rec = g => ({ g, p: g.attributes.position.array.slice(), n: g.attributes.normal.array.slice() });
  worn.push({ fdi: t.fdi, yTop, mm: WEAR[t.fdi % 10] || 0.5, en: rec(en.geometry), de: rec(de.geometry) });
}));
function clampGeo(r, h) {
  const P = r.g.attributes.position.array, Nn = r.g.attributes.normal.array;
  for (let k = 0; k < P.length; k += 3) {
    const cut = r.p[k + 1] > h; P[k] = r.p[k]; P[k + 2] = r.p[k + 2]; P[k + 1] = cut ? h : r.p[k + 1];
    Nn[k] = cut ? 0 : r.n[k]; Nn[k + 1] = cut ? 1 : r.n[k + 1]; Nn[k + 2] = cut ? 0 : r.n[k + 2];
  }
  r.g.attributes.position.needsUpdate = true; r.g.attributes.normal.needsUpdate = true; r.g.computeBoundingSphere();
}
const holderY = m.upper.holder.position.y;
const setWear = w => { worn.forEach(t => { const h = t.yTop - t.mm * w; clampGeo(t.en, h); clampGeo(t.de, h + 0.04); }); m.upper.holder.position.y = holderY - CLOSE * w; m.upper.holder.updateMatrix(); };

// labels on the worn teeth (patient's left side, facing a camera on the left): lower canine 33 and upper canine 23
const toothOf = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
const t33 = toothOf(m.teeth, 33), t23 = toothOf(mx.teeth, 23), t31 = toothOf(m.teeth, 31);
const facetOf = fdi => worn.find(t => t.fdi === fdi);
const wear33 = fig.part(t33.tooth.group, { inPlace: true, name: 'Worn canine', sub: 'tip ground flat', accent: true, anchor: () => [0, facetOf(33).yTop - facetOf(33).mm * wearNow, 0], labelOffset: [150, 10], dim: false,
  info: 'Lower left canine (FDI 33, Universal 22). Grinding wears its pointed tip into a flat, shiny facet; once the enamel is through, the softer dentin wears faster.' });
fig.part(t23.tooth.group, { inPlace: true, name: 'Upper canine', sub: 'matching facet', anchor: () => [0, facetOf(23).yTop - facetOf(23).mm * wearNow, 0], labelOffset: [80, -70], dim: false,
  info: 'Upper left canine (FDI 23, Universal 11). Facets on upper and lower teeth fit together like puzzle pieces when the jaw is moved to the grinding position.' });
fig.part(t31.tooth.group, { inPlace: true, name: 'Incisal edges', sub: 'flattened, dentin showing', anchor: () => [0, facetOf(31).yTop - facetOf(31).mm * wearNow, 0], labelOffset: [-160, 10], dim: false,
  info: 'Lower incisors (FDI 31, 41). Worn edges become flat and short; the yellow dentin island in the middle is a typical sign of attrition. Enamel does not grow back.' });
const joint = fig.part(mx.temporal.left, { inPlace: true, name: 'Jaw joint', sub: 'loaded too', anchor: mx.joints.left.userData.anchors.roof, labelOffset: [-60, -60], dim: false,
  info: 'The temporomandibular joint takes the reaction to the clenching force. Long clenching can leave it sore; the figure does not show joint damage.' });

// --- params: grind (mm of the lower midline toward the patient's left, + ; right, -), clench (muscle bulge), wear (0..1)
let gNow = 0, oNow = 0;
const doPose = () => { pose = m.pose({ lateral: Math.abs(gNow), side: gNow >= 0 ? 'left' : 'right', open: oNow, disclude: 0.15 * Math.abs(gNow) }); shapeMuscle(pose); };
fig.param('grind', 0, g => { gNow = g; doPose(); });
fig.param('open', 0, o => { oNow = o; doPose(); });
fig.param('upper', 1, v => { m.upper.holder.visible = v > 0.5; });
fig.param('clench', 0, v => { clench = v; shapeMuscle(pose); });
const wearSlider = fig.slider('Years of grinding', 0, 1, 0.01, 0, v => fig.goTo({ set: { wear: v } }, 0));
fig.param('wear', 0, v => { wearNow = v; setWear(v); wearSlider.value = v; });
fig.param('context', 0.85, v => [mx.maxilla, mx.zygoma.left, mx.zygoma.right].forEach(b => { DK.fadeMaterial(b.material, v); b.visible = v > 0.02; }));
// the temporal bone, joint outlines and discs: hidden for the view from above so nothing floats over the arch
fig.param('skull', 1, v => { ['left', 'right'].forEach(k => { mx.temporal[k].visible = mx.joints[k].visible = v > 0.5; const d = m.discs[k]; [d, d.userData.disc, ...(d.userData.laminae || []), ...(d.userData.pterygoid || [])].forEach(o => { if (o) o.visible = v > 0.5; }); }); });
fig.param('muscle', 0.92, v => { muscleMat.opacity = v; muscleMat.depthWrite = v > 0.6; masseter.visible = v > 0.02; });
fig.button('Grind', () => playGrind());
function playGrind() {
  const beats = [GRIND, -GRIND, GRIND, -GRIND, 0].map(g => ({ dur: 0.9, hold: 0.05, set: { grind: g, clench: 1, open: 0, upper: 1 } }));
  let t = 0; beats.forEach(b => { setTimeout(() => fig.goTo(b, b.dur), t * 1000); t += b.dur + b.hold; });
}
fig.onFrame(() => {
  masseterPart.setAnchor(masseterAnchor());
  const key = wearNow.toFixed(2) + clench.toFixed(2);
  if (key === shown) return; shown = key;
  const sub = clench > 0.5 ? 'clenched, bulging' : 'closing muscle'; masseterPart.sub = sub; masseterPart.el.innerHTML = masseterPart.name + '<small>' + sub + '</small>';
});
doPose();

// --- the story: the jaw at rest → clench → grind side to side → the teeth wear flat → the hero three-quarter view
const F = [8, 6, 10];                               // the front teeth, slightly toward the patient's left
fig.story([
  { dur: 0, hold: 1.4, labels: [], set: { grind: 0, clench: 0, wear: 0, context: 0.85, muscle: 0.92, skull: 1 } },
  { dur: 1.6, hold: 1.6, theta: 1.05, phi: 1.36, zoom: 0.9, set: { clench: 1 }, labels: ['Masseter'] },
  { dur: 1.6, hold: 0.1, theta: 0.18, phi: 1.42, zoom: 0.55, focus: F, set: { context: 0.5, grind: GRIND, open: 0, upper: 1, skull: 1 }, labels: [] },
  { dur: 1.0, hold: 0.1, set: { grind: -GRIND }, labels: [] },
  { dur: 1.0, hold: 0.1, set: { grind: GRIND }, labels: [] },
  { dur: 1.0, hold: 0.4, set: { grind: -GRIND }, labels: [] },
  { dur: 1.2, hold: 0.3, set: { grind: 0 }, labels: [] },
  { dur: 2.0, hold: 0.4, theta: 0.3, phi: 0.62, zoom: 0.36, focus: [10, 6, -2], set: { open: 6, context: 0, upper: 0, muscle: 0, skull: 0 }, labels: [] },
  { dur: 3.0, hold: 2.8, theta: 0, phi: 0.1, zoom: 0.86, focus: [0, 6, -40], set: { open: 0, wear: 1 }, labels: ['Worn canine', 'Incisal edges'] }
]);
fig.view('Worn teeth', { theta: 0, phi: 0.1, zoom: 0.86, focus: [0, 6, -40], set: { grind: 0, open: 0, context: 0, upper: 0, muscle: 0, skull: 0 }, labels: ['Worn canine', 'Incisal edges'] });
fig.view('Whole jaw', { theta: 0.78, phi: 1.3, zoom: 0.78, focus: [22, 10, -30], set: { grind: 0, open: 0, upper: 1, context: 0.55, muscle: 0.9, skull: 1 }, labels: ['Worn canine', 'Incisal edges', 'Masseter', 'Jaw joint'] });
fig.start();
