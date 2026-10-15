// Story: the inferior alveolar nerve block on the patient's right. An average adult mandible (DK.mandible, jaw frame: +x = patient's left, +z anterior, y up, lower CEJs at y = 0) with the inferior alveolar nerve entering the mandibular foramen on the inner face of the ramus, running in its canal under the teeth and leaving at the mental foramen for the lip and chin; the lingual nerve runs just in front of it to the tongue. The needle comes from the opposite premolars and the anaesthetic is laid next to the nerve just above the foramen, numbing everything downstream. Nerves are drawn schematically on the average jaw; no soft tissue is shown.
// poster: end
const fig = DK.figure({
  fov: 34,
  title: 'Where the numbing shot goes',
  subtitle: "Lower jaw, patient's right side. Average adult jaw, nerves schematic.",
  view: { theta: 0, phi: 0.42, margin: window.DK_MODE === 'image' ? 0.8 : 0.9 }
});
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- the jaw ----------
const m = DK.mandible({ teeth: true });
fig.part(m.group, { name: 'Lower jaw', label: false, info: 'An average adult mandible with its teeth.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The nerve to the lower teeth runs inside this bone, so it cannot be numbed tooth by tooth the way upper teeth can: the injection goes to the nerve before it enters the bone.' });
fig.xray(m.bone, false);

// points on the right side (x < 0): the ramus plane and the bone surface from the jaw's own distance field
const RP = [-48.5, -84], RA = [0.342, 0.94], MED = [0.94, 0, 0.342];   // right ramus: posterior border, forward along it, medial normal
const ramusPt = (u, y) => V(RP[0] + RA[0] * u, y, RP[1] + RA[1] * u);
function toSurface(p, dir, off) {   // march from inside the bone along dir to its surface, then `off` mm beyond
  const d = V(...dir).normalize(), q = p.clone();
  for (let i = 0; i < 200 && m.sdf(q.x, q.y, q.z) < 0; i++) q.addScaledVector(d, 0.1);
  return q.addScaledVector(d, off || 0);
}
const slot = fdi => { const t = m.teeth.teeth.find(t => t.fdi === fdi); return V(t.slot.c[0], 0, t.slot.c[1]); };
const at = (p, y) => V(p.x, y, p.z);
const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);

const FY = 5;                                        // foramen height in the jaw frame (about the level of the lower biting surfaces)
const Fin = ramusPt(18, FY), F = toSurface(Fin, MED, 0);           // mandibular foramen, inner face of the right ramus
const T = toSurface(ramusPt(18.5, FY + 5), MED, 2.0);               // where the anaesthetic goes: beside the nerve, just above the foramen
const up = V(0, 1, 0), med = V(...MED), fwd = V(RA[0], 0, RA[1]);
// inferior alveolar nerve: down the inner face of the ramus, into the foramen, through the canal under the roots
const ianOut = [F.clone().addScaledVector(up, 17).addScaledVector(med, 3.2).addScaledVector(fwd, -2.5), F.clone().addScaledVector(up, 7).addScaledVector(med, 1.6), F.clone().addScaledVector(med, 0.2)];
const s47 = slot(47), s46 = slot(46), s45 = slot(45), s44 = slot(44), s43 = slot(43), s42 = slot(42);
const mentalIn = at(mid(s44, s45), -12.5), MF = toSurface(mentalIn, [-0.55, 0.18, 0.82], 0.3);   // mental foramen, buccal, below the premolars
const ianIn = [F.clone().addScaledVector(med, -1.5), ramusPt(27, -4).addScaledVector(med, -0.3), ramusPt(34, -10.5), at(s47, -13.6), at(s46, -14), at(s45, -13.4), mentalIn, MF];
const incisive = [mentalIn, at(s43, -12.6), at(s42, -12.2)];
const out = d => [MF.x + d[0], MF.y + d[1], MF.z + d[2]];
const mental = [[MF.toArray(), out([-1.6, 2.5, 2.2]), out([-2.4, 7, 4.5])], [MF.toArray(), out([-2.0, 0.8, 3.5]), out([-2.8, 1.5, 8])], [MF.toArray(), out([-2.2, -1.6, 2.6]), out([-3.0, -4.5, 6])]];
// lingual nerve: just in front of and medial to the inferior alveolar nerve, then forward under the tongue
const lin = [F.clone().addScaledVector(up, 17).addScaledVector(med, 4.2).addScaledVector(fwd, 3.5), F.clone().addScaledVector(up, 6).addScaledVector(med, 3.6).addScaledVector(fwd, 5.5),
  at(s47, -4.5).add(V(8.5, 0, -2)), at(s46, -6).add(V(13, 0, 2)), at(s45, -5).add(V(18, 0, 6))];   // below the lingual crest, then into the floor of the mouth

const nerveMat = DK.mat('nerve');
const numbMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });
const tube = (pts, r, mat, caps) => { const t = DK.tube(pts.map(p => Array.isArray(p) ? p : p.toArray()), r, mat, { caps: caps !== false, segments: 80, radial: 12 }); t.traverse(o => { o.userData.noShadow = true; }); m.group.add(t); return t; };
const nIanOut = tube(ianOut, 1.15, nerveMat), nIanIn = tube(ianIn, 1.05, nerveMat), nInc = tube(incisive, 0.6, nerveMat);
const nMental = mental.map(p => tube(p, 0.55, nerveMat)), nLing = tube(lin, 0.95, nerveMat);
const numbNerves = [nIanIn, nInc, ...nMental, nLing];
fig.part(nIanOut, { inPlace: true, name: 'Nerve to the teeth', sub: 'inferior alveolar', anchor: ianOut[0].toArray(), labelOffset: [-90, -40], dim: false, info: 'The inferior alveolar nerve enters the jaw through the mandibular foramen on the inner side of the ramus and runs under the roots of every lower tooth on that side.' });
fig.part(nIanIn, { inPlace: true, name: 'Lower teeth', sub: 'this side', anchor: at(s46, -14).toArray(), labelOffset: [-80, 60], dim: false, info: 'Inside the jaw the nerve sends a branch to each tooth on this side, back teeth to the midline.' });
fig.part(nMental[1], { inPlace: true, name: 'Lip and chin', sub: 'mental nerve', anchor: out([-2.8, 1.5, 8]), labelOffset: [-70, 40], dim: false, info: 'The mental nerve leaves the jaw below the premolars and supplies the lower lip and chin skin: the numb, fat-feeling lip after the injection.' });
fig.part(nLing, { inPlace: true, name: 'Tongue', sub: 'lingual nerve', anchor: lin[lin.length - 1].toArray(), labelOffset: [60, -40], dim: false, info: 'The lingual nerve runs just in front of the inferior alveolar nerve and is usually numbed by the same injection: that side of the tongue goes numb too.' });
const foramenMark = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.35, 10, 32), new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xa8a296 : 0x6d675d), toneMapped: false }));
foramenMark.position.copy(F); foramenMark.lookAt(F.clone().add(med)); m.group.add(foramenMark);
fig.part(foramenMark, { inPlace: true, name: 'Foramen', sub: 'where the nerve enters the bone', anchor: [0, 0, 0], labelOffset: [-60, 60], dim: false, info: 'The mandibular foramen, on the inner face of the ramus about level with the biting surfaces of the lower back teeth.' });

// ---------- needle and anaesthetic ----------
const contra = at(mid(slot(34), slot(35)), 8.5);
const dir = contra.clone().sub(T).normalize();      // the needle runs back from the opposite premolars to the target
const syringe = new THREE.Group(); m.group.add(syringe);
const steel = DK.mat('steel');
const needle = DK.lathe([[0, 0], [0.22, 0.6], [0.24, 26], [0.6, 26.2], [1.4, 27], [1.4, 31], [0, 31]], 16, steel);
const barrel = DK.lathe([[0, 31], [3.4, 31], [3.8, 33], [3.8, 62], [0, 62]], 32, DK.mat('steel', { roughness: 0.35 }));
const glass = DK.lathe([[0, 34], [3.1, 34], [3.1, 58], [0, 58]], 32, DK.mat('enamel', { opacity: 0.45, color: 0xe8ecef }));
const nGroup = new THREE.Group(); nGroup.add(needle, barrel, glass); syringe.add(nGroup);
nGroup.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
fig.part(syringe, { inPlace: true, name: 'Needle', sub: 'from the opposite side', anchor: dir.clone().multiplyScalar(46).toArray(), labelOffset: [90, 30], dim: false, info: 'The needle enters inside the cheek behind the last molar and is aimed from the premolars of the opposite side, so it reaches past the bony ridge of the ramus to the nerve.' });
const cloudMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0.42, depthWrite: false });
const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), cloudMat); cloud.position.copy(T).addScaledVector(up, -1.5); cloud.scale.set(4.2, 7.5, 4.2); cloud.visible = false; m.group.add(cloud);
fig.part(cloud, { inPlace: true, name: 'Anaesthetic', sub: 'beside the nerve', anchor: [0, 0.6, 0], labelOffset: [80, -70], accent: true, dim: false, info: 'The anaesthetic is laid next to the nerve just above the foramen, before it enters the bone. It soaks into the nerve over a few minutes and blocks every branch beyond it.' });

fig.param('needle', 0, k => {   // 0 = parked well back, 1 = tip at the target
  syringe.visible = k > 0.01; syringe.position.copy(T).addScaledVector(dir, (1 - k) * 34);
});
fig.param('dose', 0, k => { cloud.visible = k > 0.01; const s = 0.35 + 0.65 * k; cloud.scale.set(4.2 * s, 7.5 * s, 4.2 * s); });
fig.param('numb', 0, k => numbNerves.forEach((n, i) => { const on = k > 0.15 + 0.12 * Math.min(i, 3); n.traverse(o => { if (o.isMesh) o.material = on ? numbMat : nerveMat; }); }));

fig.xrayToggle([], 'See through bone', false);
fig.view('Injection site', { theta: 2.4, phi: 1.25, zoom: 0.45, focus: T.toArray(), xray: 0, labels: ['Foramen', 'Nerve to the teeth', 'Needle', 'Anaesthetic'] });

const Fa = F.toArray();
fig.story([
  { dur: 0, hold: 1.4, theta: -0.55, phi: 1.12, zoom: 1, xray: 0, labels: [] },
  { dur: 2.6, hold: 2.0, theta: 2.4, phi: 1.25, zoom: 0.45, focus: [Fa[0], Fa[1] + 4, Fa[2]], labels: ['Nerve to the teeth', 'Foramen'] },
  { dur: 2.6, hold: 2.4, theta: 0, phi: 0.42, zoom: 0.95, focus: 'auto', xray: 1, labels: ['Nerve to the teeth', 'Lower teeth', 'Lip and chin', 'Tongue'] },
  { dur: 2.4, hold: 0.4, theta: 2.4, phi: 1.25, zoom: 0.45, focus: T.toArray(), xray: 0.5, labels: ['Foramen'] },
  { dur: 2.0, hold: 0.8, set: { needle: 1 }, labels: ['Needle', 'Foramen'] },
  { dur: 1.8, hold: 1.6, set: { dose: 1 }, labels: ['Needle', 'Anaesthetic'] },
  { dur: 2.8, hold: 2.8, theta: 0, phi: 0.42, zoom: 0.95, focus: 'auto', xray: 1, set: { numb: 1 }, drift: 0, labels: ['Anaesthetic', 'Needle', 'Lower teeth', 'Lip and chin', 'Tongue'] }
]);
fig.start();
