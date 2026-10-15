// Story: a mandibular advancement device for snoring and sleep apnea: two splints linked on each side hold the lower jaw forward, the tongue comes forward with it and the airway behind the tongue widens.
// poster: end
// Jaw frame (DK.mandible): +x = patient's left, +y up, +z anterior; lower CEJs at y = 0. The jaws are DK.mandible with DK.maxilla (upper: 'bone');
// each splint is a DK.alignerArch shell (about 2 mm) over one arch, the lower one riding on m.jaw; one connector rod per side runs from the upper
// splint at the first molar to the lower splint at the canine. The tongue, soft palate, throat wall and the airway are traced midline outlines
// (z, y) extruded across the midline: schematic soft tissue, shown only in the cut. The advance (6 mm forward, 7 mm open at the incisors) is a
// typical setting, not a prescription. A cut through 11 and 41 (patient's left half removed) is seen from the patient's left. Sizes in mm.
const ADV = { protrusion: 6, open: 7 };
const fig = DK.figure({
  fov: 32,
  title: 'Snoring and sleep apnea device',
  subtitle: 'Mandibular advancement splints. Side cut through 11 and 41; soft tissue schematic.',
  view: { theta: 0.95, phi: 1.42, margin: 0.8 }
});
const { lerp, smooth, clamp } = DK.util;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// --- the jaws
const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla;
fig.part(m.group, { name: 'Jaws', label: false, info: 'Upper and lower jaw with their teeth (average adult).' });
fig.part(m.body, { inPlace: true, name: 'Lower jaw', anchor: [-30, -22, -40], dim: false, when: (e, sec) => !sec.enabled, info: 'The mandible. The device holds it a few millimetres forward of where it rests in sleep.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', anchor: [-38, 34, -20], dim: false, when: (e, sec) => !sec.enabled, info: 'The upper jaw and its teeth. The upper splint anchors here; it does not move.' });
const lowT = m.teeth.teeth, upT = mx.teeth.teeth, LT = f => lowT.find(t => t.fdi === f), UT = f => upT.find(t => t.fdi === f);
m.group.updateMatrixWorld(true);

// --- splints: one shell per arch, cast over the crowns (built at rest; the lower one rides on the jaw)
const spineOf = (teeth, k) => { const pts = teeth.slice().sort((a, b) => { const pa = a.tooth.group.getWorldPosition(V(0, 0, 0)), pb = b.tooth.group.getWorldPosition(V(0, 0, 0)); return pa.x - pb.x; })
  .map(t => t.tooth.group.localToWorld(V(0, t.spec.crownL * k, 0)));
  // sort along the arch: patient's right molar → incisors → left molar (by x then lift the ends back)
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal'); };
const SPL = 2.0;
const upSpl = DK.alignerArch(spineOf(upT, 0.5), upT.map(t => t.tooth.layers.enamel), { thickness: SPL, trimY: 15.2, down: [0, -1, 0], segments: 220, around: 56, opacity: 0.5 });
const lowSpl = DK.alignerArch(spineOf(lowT, 0.5), lowT.map(t => t.tooth.layers.enamel), { thickness: SPL, trimY: 1.2, down: [0, 1, 0], segments: 220, around: 56, opacity: 0.5 });
const splMat = new THREE.MeshPhysicalMaterial({ color: DK.color(0xdfe6ea), roughness: 0.3, clearcoat: 0.6, transparent: true, opacity: 0.86 });
[upSpl, lowSpl].forEach(s => { s.material = splMat; s.traverse(o => { if (o !== s && o.material) o.material = splMat; }); s.renderOrder = 4; });
m.group.add(upSpl); m.jaw.add(lowSpl);

// connectors: a rod per side from the upper splint at the first molar to the lower splint at the canine, with a pivot at each end
const rodMat = DK.mat('steel', { roughness: 0.3 });
const buccal = (t, k, out) => { const s = t.spec, q = DK.crownSurface(s, 1).at(0, s.crownL * k); return t.tooth.group.localToWorld(V(q.p[0] + q.n[0] * out, q.p[1] + q.n[1] * out, q.p[2] + q.n[2] * out)); };
const sides = ['right', 'left'].map(side => {
  const u = UT(side === 'right' ? 16 : 26), l = LT(side === 'right' ? 43 : 33);
  const U = buccal(u, 0.45, SPL + 0.8), Lrest = buccal(l, 0.45, SPL + 0.8);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 20), rodMat), sleeve = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 20), rodMat);
  const pivots = [0, 1].map(() => new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 24), rodMat));
  const g = new THREE.Group(); g.add(rod, sleeve, ...pivots); m.group.add(g);
  return { side, U, Lrest, rod, sleeve, pivots, g, mid: U.clone() };
});
const placeRod = (mesh, a, b, r0, len) => { const d = b.clone().sub(a), L = d.length(); mesh.position.copy(a.clone().addScaledVector(d, (len ? len / 2 : L / 2) / L));
  mesh.scale.set(1, len || L, 1); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };

// --- midline soft tissue (schematic outlines, z then y), extruded across the midline
const slab = (pts, x0, x1, bevel) => {   // shape (-z, y) extruded along +x from x0 to x1
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(-p[0], p[1])));
  const b = bevel ?? 0, g = new THREE.ExtrudeGeometry(sh, { depth: x1 - x0 - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * 0.6, bevelSegments: 3, curveSegments: 16 });
  g.rotateY(Math.PI / 2); g.translate(x0 + b, 0, 0); g.computeVertexNormals(); return g; };
const spl = (pts, n) => new THREE.CatmullRomCurve3(pts.map(p => V(p[0], p[1], 0)), true, 'centripetal').getSpacedPoints(n).map(v => [v.x, v.y]);
// tongue (rides on the jaw): tip behind the lower incisors, dorsum under the palate, base down to the vallecula, floor forward to the chin
const TONGUE = spl([[-4, 6.5], [-10, 12.5], [-20, 19.5], [-31, 23], [-41, 21.5], [-49, 16.5], [-55, 9.5], [-59.5, 1], [-61.5, -8], [-61, -17], [-58.5, -23.5], [-52, -26.5], [-43, -25.5], [-27, -19], [-14, -13], [-9.5, -9.5], [-6.5, -3]], 140);
const HYOID = spl([[-46, -30.5], [-40, -29.8], [-37.5, -31.5], [-40, -33.6], [-46, -34], [-49, -32.4]], 40);
const EPIGLOTTIS = spl([[-58.5, -25], [-61.2, -17], [-64.2, -9.5], [-65.8, -8.6], [-63.6, -16], [-60.8, -24.5], [-59.5, -27]], 50);
const PALATE_SOFT = spl([[-42, 27.6], [-50, 25.5], [-57, 20.5], [-62.5, 13.5], [-64.5, 7.5], [-63, 4.5], [-60, 6.5], [-56, 12.5], [-50.5, 18], [-44.5, 21.8], [-41, 23.5]], 90);
const WALL = spl([[-72, 32], [-71.2, 18], [-71, 4], [-71.6, -12], [-72.8, -30], [-77.5, -31], [-77, -12], [-76.6, 4], [-76.8, 18], [-77.5, 32]], 90);
const muscle = DK.mat('gingiva', { color: 0xa97c76, cap: 0xa3766f, roughness: 0.75 });
const mucosa = DK.mat('gingiva', { color: 0xc99a94, cap: 0xc6958e, roughness: 0.7 });
const wallMat = DK.mat('gingiva', { color: 0xc9aaa3, cap: 0xc7a49d, roughness: 0.8 });
const tongue = new THREE.Mesh(slab(TONGUE, -21, 21, 2.5), muscle); m.jaw.add(tongue);
const softPal = new THREE.Mesh(slab(PALATE_SOFT, -16, 16, 1.0), mucosa); m.group.add(softPal);
const wall = new THREE.Mesh(slab(WALL, -24, 24, 1.0), wallMat); m.group.add(wall);
const hyoid = new THREE.Mesh(slab(HYOID, -14, 14, 0.8), DK.mat('bone')); m.jaw.add(hyoid);
const epi = new THREE.Mesh(slab(EPIGLOTTIS, -9, 9, 0.6), mucosa); m.jaw.add(epi);
const soft = [tongue, softPal, wall, hyoid, epi];

// airway: from the throat wall forward to the soft palate and the back of the tongue (follows the jaw), shown as an accent fill behind the cut
const XCUT = (mx.teeth.slots[11].c[0] + m.teeth.slots[41].c[0]) / 2;
const airMat = new THREE.MeshBasicMaterial({ color: fig.accent, transparent: true, opacity: fig.dark ? 0.5 : 0.24, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
const air = new THREE.Mesh(new THREE.BufferGeometry(), airMat); air.renderOrder = 6; m.group.add(air);
const tongueBack = TONGUE.filter(p => p[0] < -50 && p[1] < 12 && p[1] > -25).sort((a, b) => b[1] - a[1]);   // top → bottom
const palBack = PALATE_SOFT.filter(p => p[0] < -46 && (p[1] > 6 || p[0] < -62)).sort((a, b) => b[1] - a[1]).filter((p, i, A) => i === 0 || p[1] < A[i - 1][1]);
const airway = () => {
  const jm = m.jaw.matrix, tb = tongueBack.map(p => V(0, p[1], p[0]).applyMatrix4(jm)).map(v => [v.z, v.y]);
  const front = palBack.filter(p => p[1] > tb[0][1] + 0.5).concat(tb);
  const pts = [[-71.6, 27.5], [palBack[0][0] - 0.5, 27.5]].concat(front, [[-60, -25], [-64.6, -27.5], [-72.5, -27.5], [-71.6, -12], [-71, 4], [-71.2, 18]]);
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(-p[0], p[1]))), g = new THREE.ShapeGeometry(sh, 24); g.rotateY(Math.PI / 2); g.translate(XCUT - 0.8, 0, 0);
  const d = air.geometry; ['position', 'normal', 'uv'].forEach(k => { if (g.attributes[k]) d.setAttribute(k, g.attributes[k]); }); d.setIndex(g.index); d.clearGroups(); d.computeBoundingSphere(); g.dispose();
  // narrowest gap behind the tongue (mm), for the label
  let w = 99; tb.forEach(p => { if (p[1] < 4 && p[1] > -20) w = Math.min(w, Math.abs(-71.3 - p[0])); }); return w;
};

// --- parts
const st = { adv: 0, dev: 0, w: 0 };
const t11 = UT(11), t41 = LT(41);
const X = XCUT - 0.15;
fig.part(tongue, { inPlace: true, name: 'Tongue', sub: 'comes forward with the jaw', anchor: [X, 2, -36], dim: false, when: (e, sec) => sec.enabled, info: 'The tongue is anchored to the inside of the chin, so moving the lower jaw forward pulls its base away from the back of the throat.' });
fig.part(softPal, { inPlace: true, name: 'Soft palate', anchor: [X, 16, -55], dim: false, when: (e, sec) => sec.enabled, info: 'The soft palate and uvula. Their fluttering in a narrow airway is the sound of snoring.' });
const airLbl = new THREE.Object3D(); m.group.add(airLbl);
const airPart = fig.part(airLbl, { inPlace: true, name: 'Airway', sub: 'narrow in sleep', anchor: () => [X - 0.6, -10, (-71.3 + lerp(-62.2, -62.2 + ADV.protrusion, st.adv)) / 2], accent: true, dim: false, when: (e, sec) => sec.enabled,
  info: 'The airway behind the tongue. In sleep the muscles relax and the tongue falls back; in sleep apnea it closes for seconds at a time. Moving the jaw forward keeps it open.' });
fig.part(upSpl, { inPlace: true, name: 'Upper splint', anchor: () => upSpl.worldToLocal(buccal(UT(24), 0.5, SPL + 0.1)).toArray(), dim: false, when: (e, sec) => st.dev > 0.5 && !sec.enabled, info: 'A thin plastic splint moulded to the upper teeth.' });
fig.part(lowSpl, { inPlace: true, name: 'Lower splint', anchor: () => lowSpl.worldToLocal(buccal(LT(35), 0.5, SPL + 0.1).applyMatrix4(m.jaw.matrix)).toArray(), dim: false, when: (e, sec) => st.dev > 0.5 && !sec.enabled, info: 'The matching splint on the lower teeth. It is linked to the upper one, not free.' });
const cL = sides[1];
fig.part(cL.g, { inPlace: true, name: 'Connector', sub: 'holds the jaw forward', accent: true, anchor: () => cL.mid.toArray(), dim: false, when: (e, sec) => cL.g.visible && !sec.enabled,
  info: 'A link on each side between the two splints. It stops the lower jaw from dropping back and is adjusted in small steps until snoring stops.' });
fig.part(upSpl, { inPlace: true, name: 'Mouthpiece', sub: 'two linked splints', anchor: () => upSpl.worldToLocal(t11.tooth.group.localToWorld(V(0, t11.spec.crownL + SPL * 0.6, -1.5))).setX(X).toArray(), dim: false, when: (e, sec) => st.dev > 0.5 && sec.enabled,
  info: 'Upper and lower splints over the teeth, cut at the front teeth.' });
fig.part(t41.tooth.layers.dentin, { inPlace: true, name: 'Lower incisor', anchor: [0, 4, 0], dim: false, when: (e, sec) => sec.enabled && st.dev < 0.5, info: 'Lower right central incisor (FDI 41).' });

// --- params
const update = () => {
  m.pose({ protrusion: ADV.protrusion * st.adv, open: ADV.open * st.adv }); m.group.updateMatrixWorld(true);
  sides.forEach(c => { const L = c.Lrest.clone().applyMatrix4(m.jaw.matrix);
    placeRod(c.rod, c.U, L); placeRod(c.sleeve, c.U, L, 0, c.U.distanceTo(L) * 0.55);
    c.pivots[0].position.copy(c.U); c.pivots[1].position.copy(L);
    const n = c.side === 'left' ? V(1, 0, 0) : V(-1, 0, 0); c.pivots.forEach(p => p.quaternion.setFromUnitVectors(V(0, 1, 0), n));
    c.mid = c.U.clone().lerp(L, 0.5).add(V(c.side === 'left' ? 1.2 : -1.2, 0, 0)); c.g.visible = st.dev > 0.5; });
  splMat.opacity = 0.86 * st.dev; upSpl.visible = lowSpl.visible = st.dev > 0.02;
  st.w = airway();
  airPart.sub = st.adv > 0.5 ? 'held open' : 'narrow in sleep'; if (airPart.el) airPart.el.innerHTML = airPart.name + '<small>' + airPart.sub + '</small>';
};
fig.param('adv', 0, v => { st.adv = v; update(); });
fig.param('dev', 0, v => { st.dev = v; update(); });
update();

const boneMeshes = [...m.bone, ...mx.bone], keep = new Set([...soft, air, ...boneMeshes]);
[upSpl, lowSpl, t11.tooth.group, t41.tooth.group].forEach(o => o.traverse(c => keep.add(c)));
const hideList = []; m.group.traverse(o => { if (o.isMesh && !keep.has(o) && !sides.some(c => c.g === o || c.g.children.includes(o))) hideList.push(o); });
// --- section: through 11 and 41, the patient's left half removed; soft tissue only in the cut
const enamelOf = t => t.tooth.layers.enamel;
fig.enableSection([1, 0, 0], [
  { objects: [wall], color: 0xc7a49d, kind: 'gingiva' },
  { objects: [softPal], color: 0xc6958e, kind: 'gingiva' },
  { objects: [tongue], color: 0xa3766f, kind: 'plain' },
  { objects: [epi], color: 0xc6958e, kind: 'plain' },
  { objects: [hyoid], color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: mx.bone, color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: m.bone, color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: [upSpl], color: 0xc9d3d9, kind: 'plain' },
  { objects: [lowSpl], color: 0xc9d3d9, kind: 'plain' },
  { objects: [enamelOf(t11)], color: DK.COLORS.enamelCap },
  { objects: [enamelOf(t41)], color: DK.COLORS.enamelCap },
  { objects: [t11.tooth.layers.dentin, t41.tooth.layers.dentin, t11.tooth.layers.root, t41.tooth.layers.root].filter(Boolean), color: DK.COLORS.dentinCap },
  { objects: [t11.tooth.layers.pulp, t41.tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
// in the cut, the view becomes a clean midline slice: bone only on its cut face, only the cut incisors, no joints or side links
let lastOn = null;
fig.onFrame(() => { const on = fig.section.enabled; soft.forEach(s => s.visible = on); air.visible = on;
  sides.forEach(c => c.g.visible = st.dev > 0.5 && !on);
  if (on === lastOn) return; lastOn = on;
  boneMeshes.forEach(b => { b.material.visible = !on; });
  hideList.forEach(o => { if (on) { o.userData._v = o.visible; o.visible = false; } else if (o.userData._v !== undefined) o.visible = o.userData._v; }); });
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [XCUT - 1, 40], offset: XCUT } });
fig.view('Rest', { set: { adv: 0, dev: 0 } }, 1.2);
fig.view('Device', { set: { adv: 1, dev: 1 } }, 1.2);

// story: the jaws → the splints go on, linked at the sides → the lower jaw is held forward → back to sleep without the device, turn to the
// side and cut through the front teeth: the tongue lies against the throat → the device goes in and the jaw comes forward: the airway opens
const SIDE = { theta: Math.PI / 2 - 0.08, phi: 1.55 }, FOC = [XCUT, 4, -40];
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.95, phi: 1.42, zoom: 1, labels: ['Upper jaw', 'Lower jaw'] },
  { dur: 2.0, hold: 1.2, theta: 1.05, phi: 1.5, zoom: 0.62, focus: [10, 8, -20], set: { dev: 1 }, labels: ['Upper splint', 'Lower splint'] },
  { dur: 2.4, hold: 1.8, theta: 1.25, set: { adv: 1 }, labels: ['Connector', 'Lower splint'] },
  { dur: 2.2, hold: 0.2, theta: SIDE.theta, phi: SIDE.phi, zoom: 0.8, focus: FOC, set: { adv: 0, dev: 0 }, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 40 },
  { fov: 28, dur: 2.4, hold: 2.2, offset: XCUT, labels: ['Tongue', 'Soft palate', 'Airway'] },
  { dur: 1.2, hold: 0.2, set: { dev: 1 }, labels: ['Mouthpiece'] },
  { dur: 2.6, hold: 3.2, zoom: 0.74, focus: [XCUT, 2, -38], set: { adv: 1 }, labels: ['Airway', 'Tongue', 'Soft palate', 'Mouthpiece'] }   // teaching shot
]);
fig.start();
