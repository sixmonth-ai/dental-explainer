// Library: the inferior alveolar nerve in its canal, average adult mandible (DK.mandible) seen from the patient's LEFT, bone fading to see-through.
// poster: end
// Jaw frame: origin at the lower incisor contact (CEJ level), +x = patient's left, +y up, +z anterior. Lower left molars 36, 37, 38 (FDI).
// Teaching point: the nerve enters the canal at the mandibular foramen on the inner ramus, runs under the molar roots and leaves at the
// mental foramen below the premolars. Canal course, height and foramen position vary between people; this is one average course.
const fig = DK.figure({
  fov: 34,
  title: 'The nerve canal in the lower jaw',
  subtitle: 'Patient’s left side, molars 36–38 (FDI). The canal’s course varies.',
  view: { theta: 1.15, phi: 1.3, margin: 0.86 }
});

const TEETH = [31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];
const m = DK.mandible({ teeth: TEETH });
const boneMat = m.body.material;
fig.part(m.group, { name: 'Mandible', label: false, info: 'Average adult lower jaw with its teeth.' });
fig.part(m.body, { inPlace: true, name: 'Mandibular body', label: false, info: 'The tooth-bearing body of the jaw. The canal runs inside it, closer to the lingual side under the molars.' });

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// --- a few landmarks from the jaw itself
const slot = {}; m.teeth.teeth.forEach(t => { slot[t.fdi] = t; });
// outward (buccal) normal of the arch at a tooth, from its neighbours' slots
const normalAt = fdi => {
  const q = Math.floor(fdi / 10), p = fdi % 10, a = slot[q * 10 + Math.max(1, p - 1)].slot.c, b = slot[q * 10 + Math.min(8, p + 1)].slot.c;
  const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz), c = slot[fdi].slot.c;
  let nx = tz / l, nz = -tx / l; if (nx * c[0] + nz * (c[1] + 30) < 0) { nx = -nx; nz = -nz; }
  return [nx, nz];
};
// a point under a tooth at height y, `off` mm buccal (+) or lingual (-) of the arch line; `dm` mm mesial (toward the next tooth forward)
const under = (fdi, y, off, dm) => {
  const c = slot[fdi].slot.c, n = normalAt(fdi), f = slot[Math.floor(fdi / 10) * 10 + Math.max(1, fdi % 10 - 1)].slot.c;
  const fl = Math.hypot(f[0] - c[0], f[1] - c[1]) || 1, k = (dm || 0) / fl;
  return V(c[0] + n[0] * off + (f[0] - c[0]) * k, y, c[1] + n[1] * off + (f[1] - c[1]) * k);
};
// march from an inner point along a direction until it leaves the bone (m.sdf is the bone's signed distance, rest pose)
const surfaceFrom = (p, d) => { const q = p.clone(), step = d.clone().normalize().multiplyScalar(0.1); for (let i = 0; i < 300 && m.sdf(q.x, q.y, q.z) < 0; i++) q.add(step); return q; };
const gradient = p => { const e = 0.3, f = (x, y, z) => m.sdf(x, y, z); return V(f(p.x + e, p.y, p.z) - f(p.x - e, p.y, p.z), f(p.x, p.y + e, p.z) - f(p.x, p.y - e, p.z), f(p.x, p.y, p.z + e) - f(p.x, p.y, p.z - e)).normalize(); };
// the left ramus plane (as DK.mandible draws it): u forward from the posterior border, w lateral
const RP = [48.5, -84], RA = [-0.342, 0.94], RN = [0.94, 0.342];
const ramusAt = (u, y, w) => V(RP[0] + RA[0] * u + RN[0] * w, y, RP[1] + RA[1] * u + RN[1] * w);

// mandibular foramen: on the inner face of the ramus, about the height of the occlusal plane, a little behind its centre
const F_IN = ramusAt(17, 5, -0.6), F = surfaceFrom(F_IN, V(-RN[0], 0, -RN[1]));
// mental foramen: on the buccal face below the second premolar, about midway down the body
const M_IN = under(35, -15.2, 1.2, 1.0), M = surfaceFrom(M_IN, V(normalAt(35)[0], 0.25, normalAt(35)[1]));

// --- the canal: in at the foramen, down and forward through the ramus, under the molar roots (lingual half of the body), on to the
// premolars where it divides: the mental canal turns up, back and out to the foramen; the thin incisive branch runs on to the incisors
const MAIN = [F.clone().addScaledVector(V(-RN[0], 0, -RN[1]), 1.2), F, F_IN, ramusAt(19.5, 0, -0.4), ramusAt(23, -5.5, -0.2),
  under(38, -12.6, -0.9), under(37, -14.8, -0.9), under(36, -16.4, -0.5), under(35, -16.6, 0.2), under(34, -16.4, 0.3, -1.2)];
const LOOP = [MAIN[MAIN.length - 1], under(34, -15.9, 1.0, -2.6), M_IN, M];
const INCISIVE = [MAIN[MAIN.length - 1], under(34, -16.8, 0.2, 1.5), under(33, -17.2, 0.2), under(32, -17.4, 0), under(31, -17.4, 0, 1.2)];
const arr = pts => pts.map(p => p.toArray());
const smooth = pts => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(80);
const lumenMat = DK.mat('pdl', { color: 0xf0dcc4 }), nerveMat = DK.mat('nerve');
const canal = new THREE.Group(); canal.name = 'Inferior alveolar canal';
const mainPts = smooth(MAIN), loopPts = smooth(LOOP), incPts = smooth(INCISIVE);
const lumen = DK.tube(arr(mainPts.slice(4)), 1.25, lumenMat, { caps: true });
const nerve = DK.tube(arr(mainPts), 0.75, nerveMat, { caps: true });
const mental = DK.tube(arr(loopPts), 0.6, nerveMat, { caps: true, taper: t => 1 - 0.25 * t });
const incisive = DK.tube(arr(incPts), 0.42, nerveMat, { caps: true, taper: t => 1 - 0.5 * t });
canal.add(lumen, nerve, mental, incisive);
// the mental nerve fans out of the foramen toward the lip and chin, just over the bone
const nM = gradient(M), fwd = V(-normalAt(35)[1], 0, normalAt(35)[0]); if (fwd.z < 0) fwd.negate();
[[1.0, 4.2], [1.1, 0.6], [0.8, -3.2]].forEach(([f, up]) => {   // to the lip (up), the chin (down) and between
  const pts = [M.clone().addScaledVector(nM, 0.3), M.clone().addScaledVector(nM, 1.1).addScaledVector(fwd, 1.6 * f).add(V(0, up * 0.25, 0)), M.clone().addScaledVector(nM, 1.0).addScaledVector(fwd, 6 * f).add(V(0, up, 0))];
  canal.add(DK.tube(arr(smooth(pts)), 0.36, nerveMat, { caps: true, taper: t => 1 - 0.55 * t }));
});
// the two openings, drawn as quiet rims on the bone surface
const rimMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0x9c978d : 0x6e6a62), toneMapped: false, transparent: true });
const rim = (p, r) => { const g = new THREE.Mesh(new THREE.TorusGeometry(r, 0.18, 8, 40), rimMat); g.position.copy(p); g.lookAt(p.clone().add(gradient(p))); g.position.addScaledVector(gradient(p), 0.1); return g; };
const rimF = rim(F, 1.7), rimM = rim(M, 1.4);
canal.add(rimF, rimM);
canal.traverse(o => { o.userData.noShadow = true; });
// the same on the right side, mirrored (shown only while the bone is opaque: seen through the bone it would cross the left one)
const right = canal.clone(); right.scale.x = -1; right.name = 'Right canal';
m.group.add(canal, right);
const rightTeeth = m.teeth.teeth.filter(t => Math.floor(t.fdi / 10) === 4).map(t => t.tooth.group);

// --- labels
const t38 = slot[38], t36 = slot[36];
const apex38 = under(38, -t38.spec.rootL - 0.2, 0);
fig.part(nerve, { inPlace: true, name: 'Inferior alveolar nerve', sub: 'in the mandibular canal', accent: true, dim: false, anchor: arr([under(37, -14.8, -0.9)])[0], labelOffset: [40, 80],
  info: 'Sensory nerve to the lower teeth, gums, lower lip and chin, running with an artery and vein in a bony canal. What a lower block anaesthetises, and what implants and third-molar surgery must stay clear of (about 2 mm is the usual safety margin for an implant).' });
fig.part(rimF, { inPlace: true, name: 'Mandibular foramen', sub: 'entry, inner ramus', dim: false, anchor: [0, 0, 0], labelOffset: [60, -70],
  info: 'Where the nerve enters the canal, on the inner surface of the ramus about level with the occlusal plane. The target area of an inferior alveolar nerve block.' });
fig.part(rimM, { inPlace: true, name: 'Mental foramen', sub: 'exit, below the premolars', dim: false, anchor: [0, 0, 0], labelOffset: [-60, 70],
  info: 'Where the mental nerve leaves the bone to supply the lower lip and chin. Usually below or between the premolars; its position varies, so it is located on a radiograph before surgery there.' });
fig.part(t38.tooth.group, { inPlace: true, name: 'Molar roots', sub: 'just above the canal', dim: false, anchor: [0, -t38.spec.rootL * 0.7, 0], labelOffset: [40, -90],
  info: 'Lower third molar (FDI 38, Universal 17). Its roots can lie close to or touch the canal, which is why the canal is checked on a radiograph or CBCT before removal.' });
fig.part(incisive, { inPlace: true, name: 'Incisive branch', label: false, info: 'The nerve continues forward inside the bone to the canine and incisors.' });
m.teeth.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: DK.toothName(t.fdi), label: false, info: `FDI ${t.fdi}, Universal ${DK.toothNumber(t.fdi, 'universal')}.` }));

// --- the bone fades to see-through so the canal shows (one param, used by the story and the buttons)
fig.param('bone', 1, v => { DK.fadeMaterial(boneMat, v); const solid = v >= 0.6; right.visible = solid; rightTeeth.forEach(g => { g.visible = solid; }); });
fig.button('See-through', () => fig.goTo({ set: { bone: boneMat.opacity > 0.6 ? 0.22 : 1 } }, 0.7));
const LEFT = { theta: Math.PI / 2 + 0.06, phi: 1.5 };
const SIDE = { theta: LEFT.theta, phi: LEFT.phi, zoom: 0.62, focus: [40, -4, -40], set: { bone: 0.22 }, labels: ['Mandibular foramen', 'Inferior alveolar nerve', 'Mental foramen', 'Molar roots'] };
fig.view('Side', SIDE);
const INSIDE = { theta: -Math.PI / 2 + 0.55, phi: 1.4, zoom: 0.5, focus: [F.x, F.y - 4, F.z + 4], set: { bone: 0.3 }, labels: ['Mandibular foramen', 'Inferior alveolar nerve'] };
fig.view('Inside', INSIDE);
fig.standardControls({ explode: false });

// story: the jaw → the bone turns see-through and the canal appears → inside the ramus: where the nerve goes in →
// along under the molar roots → out at the mental foramen → hero: the whole course from the side
const c36 = t36.slot.c;
fig.story([
  { dur: 0, hold: 1.4, theta: 0.9, phi: 1.25, zoom: 1.0, set: { bone: 1 }, labels: ['Mental foramen'], caption: 'The lower jaw. A nerve runs through it, inside the bone.' },
  { dur: 2.4, hold: 1.8, theta: LEFT.theta, phi: LEFT.phi, zoom: 0.66, focus: [40, -4, -40], set: { bone: 0.22 }, labels: ['Inferior alveolar nerve'], caption: 'Seen through the bone: the inferior alveolar nerve in its canal.' },
  { dur: 2.8, hold: 2.2, theta: INSIDE.theta, phi: INSIDE.phi, zoom: INSIDE.zoom, focus: INSIDE.focus, set: { bone: 0.3 }, labels: ['Mandibular foramen'], caption: 'It enters on the inner side of the ramus, at the mandibular foramen.' },
  { dur: 2.6, hold: 2.4, theta: LEFT.theta + 0.1, phi: 1.45, zoom: 0.4, focus: [c36[0] + 3, -9, c36[1] - 6], set: { bone: 0.22 }, labels: ['Molar roots', 'Inferior alveolar nerve'], caption: 'It runs forward under the molar roots, closest to the third molar.' },
  { dur: 2.0, hold: 2.2, zoom: 0.38, focus: [M.x, M.y + 2, M.z - 2], labels: ['Mental foramen'], caption: 'Below the premolars it leaves the bone at the mental foramen, to the lip and chin.' },
  { dur: 2.4, hold: 2.6, theta: LEFT.theta, phi: LEFT.phi, zoom: 0.62, focus: [40, -4, -40], drift: 0, labels: SIDE.labels, caption: '' }
]);
fig.start();
