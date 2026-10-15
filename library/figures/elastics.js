// Story: Class II elastics on the patient's right side, braces on upper 13–16 and lower 43–46, seen from the right (jaw frame: +x = patient's left, +z anterior, y up).
// poster: end
// The arches sit in occlusion as in angle-classes.js (DK.arch 'jaw' placement for the upper teeth in a holder, 2.5 mm overbite plane). The bite starts as
// a full-cusp Class II (the mesiobuccal cusp of 16 over the 45/46 contact); an elastic hooked from the upper canine bracket to the lower first molar tube
// pulls the upper teeth back a little and the lower teeth forward until that cusp sits in the buccal groove of 46 (Class I). Brackets at MBT-style heights
// (facts §19), 0.022 in slots, 0.019 × 0.025 in steel wires. The canine hook is drawn here (the kit's molar tube has its own). Months of wear in reality.
const fig = DK.figure({
  fov: 30,
  title: 'Rubber bands with braces',
  subtitle: "Patient's right side. Elastic from upper canine to lower first molar (FDI 13 to 46).",
  view: { theta: -Math.PI / 2, phi: 1.52, margin: 0.8 }
});
const SLOT = '0.022', WIRE = '0.019x0.025', V = (x, y, z) => new THREE.Vector3(x, y, z);
const UH = { 3: 5.0, 4: 4.5, 5: 4.0, 6: 3.5 }, LH = { 3: 5.0, 4: 4.0, 5: 4.0, 6: 3.5 };   // slot centre from the cusp tip, MBT-style average rows (facts §19)
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const scene = new THREE.Group();
const lowHold = new THREE.Group(); scene.add(lowHold);
const low = DK.arch({ jaw: 'mandible', teeth: [43, 44, 45, 46, 47], build: crowns }); lowHold.add(low.group);
const upHold = new THREE.Group(); scene.add(upHold);
const up = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [13, 14, 15, 16, 17], build: crowns }); upHold.add(up.group);
const UP0 = new THREE.Vector3(0, DK.toothPreset(31).crownL - 2.5 + DK.toothPreset(11).crownL, 2.6);
upHold.position.copy(UP0); upHold.rotation.x = -0.05;
scene.updateMatrixWorld(true);
const ridgeL = DK.gingivaArch(low), ridgeU = DK.gingivaArch(up);
lowHold.add(ridgeL); upHold.attach(ridgeU);
fig.part(scene, { name: 'Right side', label: false, info: 'Right canine, premolars and first two molars, upper and lower, with braces.' });
fig.part(ridgeL, { inPlace: true, name: 'Gum', label: false, info: 'Gum along the lower teeth (schematic).' });
fig.part(ridgeU, { inPlace: true, name: 'Gum ', label: false, info: 'Gum along the upper teeth (schematic).' });
const T = (arch, fdi) => arch.teeth.find(t => t.fdi === fdi);
[...up.teeth, ...low.teeth].forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// --- appliance: brackets / tubes in each tooth's frame (children of the tooth, so they move with their arch), a wire per arch
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.5, metalness: 0.65 });
const hookTip = mesh => { const p = mesh.geometry.attributes.position; let lo = Infinity; for (let i = 0; i < p.count; i++) lo = Math.min(lo, p.getY(i));
  const c = V(0, 0, 0); let n = 0; for (let i = 0; i < p.count; i++) if (p.getY(i) < lo + 0.25) { c.add(V(p.getX(i), p.getY(i), p.getZ(i))); n++; } return c.multiplyScalar(1 / n); };
const fit = (arch, hold, H) => {
  const wire = [], hooks = {};
  arch.teeth.forEach(({ fdi, tooth: t, spec: sp }) => {
    const p = fdi % 10; if (!H[p]) return;
    const part = p === 6 ? DK.molarTube(sp, { slot: SLOT, height: H[6], hook: true }) : DK.bracket(sp, { slot: SLOT, height: H[p] });
    wire.push(hold.worldToLocal(t.group.localToWorld(V(...part.wirePoint(DK.wireSize(WIRE).d)))));
    if (p === 6) { const hk = part.children[part.children.length - 1]; hooks[fdi] = { obj: hk, tip: hookTip(hk) }; }
    if (p === 3 && arch === up) {   // ball hook on the distal-gingival wing of the canine bracket
      const u = part.userData, x = -u.width / 2 + 0.45, y0 = -u.tall / 2;
      const hk = DK.tube([[x, y0 + 0.3, u.face - 0.35], [x, y0 - 0.8, u.face + 0.05], [x, y0 - 1.4, u.face + 0.6]], 0.26, steel, { segments: 12, radial: 10 });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), steel); ball.position.set(x, y0 - 1.45, u.face + 0.68);
      part.add(hk, ball); hooks[fdi] = { obj: ball, tip: V(0, 0, 0) };
    }
    if (p !== 6) { const lig = DK.ligature(part, { color: 0xb9b4aa }); t.group.add(lig); }
    t.group.add(part);
    fig.part(part, { inPlace: true, name: (p === 6 ? 'Molar tube ' : 'Bracket ') + fdi, label: false, info: p === 6 ? 'Tube on the first molar; its hook holds the elastic.' : 'Steel bracket bonded to the tooth; the wire runs through its slot.' });
  });
  const w = DK.archwire(wire.map(v => v.toArray()), { size: WIRE, material: 'steel', overhang: 1.2 }); hold.add(w);
  return { wire: w, pts: wire, hooks };
};
const UA = fit(up, upHold, UH), LA = fit(low, lowHold, LH);
fig.part(UA.wire, { inPlace: true, name: 'Archwire', label: false, info: 'A stiff rectangular steel wire, so the elastic moves each arch as one block.' });
fig.part(LA.wire, { inPlace: true, name: 'Archwire ', label: false, info: 'A stiff rectangular steel wire, so the elastic moves each arch as one block.' });
const hookWorld = h => { h.obj.updateWorldMatrix(true, false); return h.obj.localToWorld(h.tip.clone()); };

// --- the bite landmarks (from angle-classes.js): MB cusp of 16 and buccal groove of 46
const t16 = T(up, 16), t46 = T(low, 46), s16 = t16.spec, s46 = t46.spec, cs16 = DK.crownSurface(s16, 1), cs46 = DK.crownSurface(s46, 1);
const xCusp = 0.42 * s16.md / 2, xGroove = 0.22 * s46.md / 2;
const toScene = (tooth, p) => scene.worldToLocal(tooth.group.localToWorld(V(...p)));
const cusp = toScene(t16.tooth, cs16.at(xCusp, cs16.yTop).p), groove = toScene(t46.tooth, cs46.at(xGroove, s46.crownL * 0.5).p);
const contact = toScene(t46.tooth, cs46.at(s46.md / 2 * 0.95, s46.crownL * 0.6).p);   // 45/46 buccal embrasure
const S1 = cusp.z - groove.z, UNIT = cusp.z - contact.z - S1;   // Class I shift of the lower teeth, and one cusp unit (negative: back)
const UPBACK = 0.25;                                             // share of the correction taken by the upper teeth (schematic)
const D = -UNIT;                                                   // one cusp of Class II, mm
fig.param('fix', 0, k => { lowHold.position.z = S1 - D * (1 - UPBACK) * (1 - k); upHold.position.z = UP0.z + D * UPBACK * (1 - k); });

const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xc8c2b6 : 0x4f4b44), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const nCuspOut = -0.5;
const cuspLine = DK.ribbon([[cusp.x + nCuspOut, cusp.y + 1.6, cusp.z], [cusp.x + nCuspOut, cusp.y - 2.6, cusp.z]], 0.4, [1, 0, 0], { material: inkMat });
upHold.attach(cuspLine);
const gpts = []; for (let i = 0; i <= 10; i++) { const q = cs46.at(xGroove, s46.crownL - 2.0 + 1.5 * i / 10); gpts.push(q.p.map((v, k) => v + q.n[k] * 0.15)); }
const grooveLine = DK.ribbon(gpts, 0.5, cs46.at(xGroove, s46.crownL * 0.5).n, { material: inkMat }); t46.tooth.group.add(grooveLine);
fig.part(cuspLine, { inPlace: true, name: 'Upper molar cusp', anchor: [cusp.x + nCuspOut, cusp.y + 2.0, cusp.z],
  labelOffset: [-70, -80], dim: false, info: 'The front cheek-side cusp of the upper first molar. In a good (Class I) bite it sits in the groove of the lower molar.' });
fig.part(grooveLine, { inPlace: true, name: 'Lower molar groove', anchor: gpts[8], labelOffset: [70, 90], dim: false,
  info: 'The groove between the two front cheek-side cusps of the lower first molar.' });

// --- the elastic: a stretched loop from the canine hook to the molar hook, rebuilt when the teeth or the band move
const bandMat = new THREE.MeshStandardMaterial({ color: fig.accent, roughness: 0.55, metalness: 0 });
const band = new THREE.Mesh(new THREE.BufferGeometry(), bandMat); scene.add(band);
let reach = 1;
const loop = () => {
  const A = scene.worldToLocal(hookWorld(UA.hooks[13])), B0 = scene.worldToLocal(hookWorld(LA.hooks[46]));
  const B = A.clone().lerp(B0, reach), d = B.clone().sub(A); const L = d.length(); d.normalize();
  const side = new THREE.Vector3().crossVectors(d, V(1, 0, 0)).normalize(), out = V(-1, 0, 0), h = 0.55, pts = [];
  const bow = t => out.clone().multiplyScalar(1.5 * Math.sin(Math.PI * t) * Math.min(1, L / 8));
  for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + Math.PI * i / 10; pts.push(A.clone().addScaledVector(side, h * Math.sin(a)).addScaledVector(d, h * Math.cos(a))); }
  for (let i = 1; i < 14; i++) { const t = i / 14; pts.push(A.clone().lerp(B, t).addScaledVector(side, -h).add(bow(t))); }
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + Math.PI * i / 10; pts.push(B.clone().addScaledVector(side, h * Math.sin(a)).addScaledVector(d, h * Math.cos(a))); }
  for (let i = 1; i < 14; i++) { const t = 1 - i / 14; pts.push(A.clone().lerp(B, t).addScaledVector(side, h).add(bow(t))); }
  pts.push(pts[0].clone());
  const m = DK.tube(pts.map(p => p.toArray()), 0.3, bandMat, { segments: 160, radial: 10 });
  band.geometry.dispose(); band.geometry = m.geometry;
};
fig.param('reach', 1, v => { reach = Math.max(0.02, v); band.visible = v > 0.01; loop(); });
fig.onFrame(() => { if (band.visible) loop(); });
const bandMid = new THREE.Object3D(); scene.add(bandMid);
fig.onFrame(() => { const A = scene.worldToLocal(hookWorld(UA.hooks[13])), B = scene.worldToLocal(hookWorld(LA.hooks[46])); bandMid.position.copy(A.lerp(B, 0.55)).add(V(-1.2, 0, 0)); });
fig.part(bandMid, { inPlace: true, name: 'Elastic', sub: 'canine to molar', accent: true, anchor: [0, 0, 0], labelOffset: [110, -120], dim: false, when: () => band.visible && reach > 0.9,
  info: 'A small latex or synthetic rubber band. The patient hooks it on and changes it daily; it only works while it is worn.' });
fig.part(UA.hooks[13].obj, { inPlace: true, name: 'Hook on canine', anchor: [0, 0, 0], labelOffset: [40, -70], dim: false, info: 'A small hook on the upper canine bracket.' });
fig.part(LA.hooks[46].obj, { inPlace: true, name: 'Hook on molar', anchor: LA.hooks[46].tip.toArray(), labelOffset: [60, 60], dim: false, info: 'The hook on the lower first molar tube.' });

// --- pull arrows: upper teeth back, lower teeth forward (ink, flat, on the cheek side)
const xOut = Math.min(cusp.x, contact.x) - 4;
const arrows = new THREE.Group(); scene.add(arrows);
arrows.add(DK.arrow({ from: [xOut, cusp.y + 9.5, cusp.z + 1], to: [xOut, cusp.y + 9.5, cusp.z - 5], width: 0.55, head: 1.6, normal: [-1, 0, 0], material: inkMat }));
arrows.add(DK.arrow({ from: [xOut, contact.y - 7.5, groove.z - 4], to: [xOut, contact.y - 7.5, groove.z + 2], width: 0.55, head: 1.6, normal: [-1, 0, 0], material: inkMat }));
const arrowTag = new THREE.Object3D(); arrowTag.position.set(xOut, contact.y - 7.5, groove.z - 1); arrows.add(arrowTag);
fig.part(arrowTag, { inPlace: true, name: 'Lower teeth forward', sub: 'upper teeth back', anchor: [0, 0, 0], labelOffset: [150, 0], dim: false, when: () => arrows.visible,
  info: 'Class II elastics pull the lower teeth forward and the upper teeth back. Bone remodels around the roots as they move; growth helps in children.' });
fig.param('arrows', 0, v => { arrows.visible = v > 0.02; inkMat.opacity = 1; });

fig.view('Side', { theta: -Math.PI / 2, phi: 1.52, zoom: 1, focus: 'auto' });
fig.button('Before', () => fig.goTo({ set: { fix: 0 } }, 1.2));
fig.button('After', () => fig.goTo({ set: { fix: 1 } }, 1.6));

// story: braces, three-quarter view → round to the side: the cusp sits ahead of the groove (Class II) → the elastic stretches from the canine hook
// to the molar hook → it pulls: lower teeth forward, upper back → the cusp lands in the groove (teaching shot)
const FM = [cusp.x, cusp.y - 0.8, (cusp.z + groove.z) / 2];
fig.story([
  { dur: 0, hold: 1.4, theta: -0.75, phi: 1.5, zoom: 1.05, set: { fix: 0, reach: 0, arrows: 0 }, labels: [] },
  { dur: 2.4, hold: 2.0, theta: -Math.PI / 2, phi: 1.52, zoom: 0.62, focus: FM, labels: ['Upper molar cusp', 'Lower molar groove'] },
  { dur: 2.0, hold: 1.0, zoom: 1, focus: 'auto', labels: ['Hook on canine', 'Hook on molar'] },
  { dur: 2.0, hold: 1.6, set: { reach: 1 }, labels: ['Elastic', 'Hook on canine', 'Hook on molar'] },
  { dur: 0.8, hold: 0.2, set: { arrows: 1 }, labels: ['Elastic', 'Lower teeth forward'] },
  { dur: 3.2, hold: 1.0, set: { fix: 1 }, labels: ['Elastic', 'Lower teeth forward'] },
  { dur: 1.6, hold: 3.0, zoom: 0.72, set: { arrows: 0 }, labels: ['Elastic', 'Upper molar cusp', 'Lower molar groove'], drift: 0 }
]);
fig.start();
