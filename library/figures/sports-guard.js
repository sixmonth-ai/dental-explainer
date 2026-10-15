// Story: a custom sports mouthguard over the upper teeth (FDI 17 to 27), how it takes a blow to the front teeth and spreads it, and its thickness in a cut through 11.
// poster: end
// Jaw frame (as night-guard.js): +x = patient's left, +y up, +z anterior; the upper teeth crown-down in a holder (DK.arch maxilla, 'jaw'). The guard
// is one thick DK.alignerArch shell cast over the crowns and the gum (so it runs up over the gum into the fold), about 3 mm thick (typical; designs
// vary). A blow arrives at the upper central incisors; a vertex-colour wash shows the load spreading through the guard along the arch (schematic,
// not a stress analysis). A cut through 11 shows the guard wrapping the incisor. Sizes in mm.
const THICK = 3.0;
const fig = DK.figure({
  fov: 34,
  title: 'Sports mouthguard',
  subtitle: 'Custom guard over the upper teeth, FDI 17 to 27 (Universal 2 to 15).',
  view: { theta: 0.38, phi: 1.76, margin: 0.75 }
});
const { smooth, lerp } = DK.util;

// --- upper teeth (crowns on short roots inside the gum band), 11 complete for the cut
const build = (fdi, spec) => { spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 2.7) })); return DK.tooth(spec, { omit: fdi === 11 ? [] : ['dentin', 'pulp', 'root'] }); };
const upper = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27], build });
fig.part(upper.group, { name: 'Upper teeth', label: false, info: 'Upper teeth. The guard is made on a model of them, so it clips on and stays put.' });
upper.group.updateMatrixWorld(true);
upper.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));
const gum = DK.gingivaArch(upper, { height: 4.2 });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum over the upper teeth.' });
const T = f => upper.teeth.find(t => t.fdi === f);

// --- the guard: cast over enamel and gum, trimmed about 3 mm above the necks (into the fold, short of the lip attachment)
const spine = (() => { const ts = upper.teeth, s0 = upper.slots[ts[0].fdi], s1 = upper.slots[ts[ts.length - 1].fdi];
  const end = q => [q.c[0] - q.t[0] * (q.md / 2 + 1.2), q.c[1] - q.t[1] * (q.md / 2 + 1.2)];
  return new THREE.CatmullRomCurve3([end(s0), ...ts.map(t => upper.slots[t.fdi].c), end(s1)].map(c => new THREE.Vector3(c[0], 3.5, c[1])), false, 'centripetal'); })();
const guard = DK.alignerArch(spine, [...upper.teeth.map(t => t.tooth.layers.enamel), gum], { thickness: THICK, trimY: 2.4, down: [0, -1, 0], segments: 200, around: 64, smooth: 3 });
// material: a soft, slightly see-through EVA with per-vertex colour (the load wash)
const P = guard.geometry.attributes.position, nV = P.count, col = new Float32Array(nV * 3).fill(1);
guard.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
const base = DK.color(0xeef2f4), acc = DK.color(fig.dark ? 0x5a8fb8 : 0x3f7cb0);   // the accent family, light enough to read as a wash
guard.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, transparent: true, opacity: 0.93 });
const rimMat = new THREE.MeshPhysicalMaterial({ color: DK.color(0xe3e9ed), roughness: 0.38, clearcoat: 0.5, transparent: true, opacity: 0.8 });
guard.traverse(o => { if (o !== guard && o.material) { o.material = rimMat; } });
for (let k = 0; k < nV; k++) { col[k * 3] = base.r; col[k * 3 + 1] = base.g; col[k * 3 + 2] = base.b; }
const hold = new THREE.Group(); hold.add(guard); fig.world.add(hold);

// --- the blow and the spread: distance along the arch from the impact point (in front of 11/21)
const s11 = T(11), IMP = s11.tooth.group.localToWorld(new THREE.Vector3(s11.spec.md / 2 - 0.5, s11.spec.crownL * 0.6, s11.spec.bl / 2 + THICK));
const sAt = (() => { const pts = spine.getSpacedPoints(400); return (x, z) => { let bi = 0, bd = 1e9; pts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi / 400 * spine.getLength(); }; })();
const s0 = sAt(IMP.x, IMP.z), arcS = new Float32Array(nV);
for (let k = 0; k < nV; k++) arcS[k] = Math.abs(sAt(P.getX(k), P.getZ(k)) - s0);
const spread = k => {   // k 0..1: the front of the load moves out along the arch, its strength thinning as it spreads
  const R = 2 + 34 * k, peak = 0.95 / (1 + 0.5 * k);
  for (let v = 0; v < nV; v++) { const w = k <= 0 ? 0 : peak * (1 - smooth(R * 0.55, R, arcS[v]));
    col[v * 3] = lerp(base.r, acc.r, w); col[v * 3 + 1] = lerp(base.g, acc.g, w); col[v * 3 + 2] = lerp(base.b, acc.b, w); }
  guard.geometry.attributes.color.needsUpdate = true; };
const arrow = DK.arrow({ from: [IMP.x + 8, IMP.y - 11, IMP.z + 10], to: [IMP.x + 0.5, IMP.y - 0.8, IMP.z + 0.6], width: 1.2, head: 3.2, normal: [0.4, -0.15, 0.9], color: fig.dark ? 0xd8d4cc : 0x3a3a36 });
arrow.renderOrder = 20; fig.world.add(arrow); arrow.visible = false;

// --- parts
fig.part(guard, { inPlace: true, name: 'Mouthguard', sub: 'about 3 mm, soft', anchor: () => guard.worldToLocal(T(24).tooth.group.localToWorld(new THREE.Vector3(0, T(24).spec.crownL * 0.5, T(24).spec.bl / 2 + THICK))).toArray(), dim: false, when: () => hold.visible,
  info: 'A custom guard of soft, layered EVA plastic, moulded on a model of the upper teeth: about 3 to 4 mm over the front and biting surfaces (it varies by sport and design). It covers the teeth and the gum above them.' });
fig.part(arrow, { inPlace: true, name: 'Blow', anchor: [IMP.x + 6.5, IMP.y - 9, IMP.z + 8], dim: false, when: () => arrow.visible, info: 'A hit to the front teeth, the most common sports injury to the mouth.' });
const SP = s11.tooth.group.localToWorld(new THREE.Vector3(0, 0, 0)), spreadMark = new THREE.Object3D();
spreadMark.position.copy(T(23).tooth.group.localToWorld(new THREE.Vector3(0, T(23).spec.crownL * 0.4, T(23).spec.bl / 2 + THICK + 0.1))); fig.world.add(spreadMark);
fig.part(spreadMark, { inPlace: true, name: 'Force spread', sub: 'over many teeth', accent: true, anchor: [0, 0, 0], dim: false, when: () => st.spread > 0.3,
  info: 'The thick soft layer cushions the hit and spreads it along the arch, so no single tooth takes it all. It also keeps the lips and cheeks off the teeth.' });
fig.part(s11.tooth.layers.dentin, { inPlace: true, name: 'Incisor 11', anchor: [0, 5.5, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Upper right central incisor, cut lip to palate: the guard wraps its front, edge and back.' });
fig.part(guard, { inPlace: true, name: 'Over the gum', anchor: () => guard.worldToLocal(s11.tooth.group.localToWorld(new THREE.Vector3(0.6, -1.6, s11.spec.blC / 2 + THICK * 0.8))).toArray(), dim: false, when: (e, sec) => sec.enabled,
  info: 'The guard runs up over the gum toward the fold of the lip, so the front of the jaw is covered too.' });

// --- params
const st = { spread: 0 };
fig.param('guard', 0, k => { hold.position.y = -16 * (1 - k); hold.visible = k > 0.02; });
fig.param('blow', 0, k => { arrow.visible = k > 0.02; arrow.position.set(8 * (1 - k), -3 * (1 - k), 6 * (1 - k)); arrow.material.opacity = Math.min(1, k * 3); });
fig.param('spread', 0, k => { st.spread = k; spread(k); });

// --- cut lip to palate through 11 (patient's left half removed; camera on the patient's left)
const XCUT = s11.tooth.group.localToWorld(new THREE.Vector3(0, 0, 0)).x;
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [guard], color: 0xb3c2cc, kind: 'plain' },
  ...upper.teeth.map(t => ({ objects: [t.tooth.layers.enamel], color: DK.COLORS.enamelCap })),
  { objects: [s11.tooth.layers.dentin, s11.tooth.layers.root], color: DK.COLORS.dentinCap },
  { objects: [s11.tooth.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [XCUT - 2, XCUT + 30], offset: XCUT } });
fig.view('Without guard', { section: false, set: { guard: 0, blow: 0, spread: 0 } }, 1.2);
fig.view('With guard', { section: false, set: { guard: 1 } }, 1.2);

// story: the upper teeth from the front → the guard slides up onto them → turn to the side and cut through 11: thickness over tooth and gum →
// back to the front: a blow lands on the incisors → the load spreads through the guard along the arch (teaching shot)
const F11 = [IMP.x, IMP.y, IMP.z - 4];
fig.story([
  { dur: 0, hold: 1.4, theta: -0.1, phi: 1.72, zoom: 1, labels: [] },
  { dur: 2.2, hold: 1.2, theta: 0.35, phi: 1.88, set: { guard: 1 }, labels: ['Mouthguard'] },
  { fov: 28, dur: 2.2, hold: 0.2, theta: Math.PI / 2 - 0.3, phi: 1.62, labels: [] },
  { dur: 0, hold: 0, section: true, offset: XCUT + 30 },
  { dur: 2.4, hold: 2.4, offset: XCUT, theta: Math.PI / 2 - 0.18, zoom: 0.62, focus: [XCUT, 2, s11.slot.c[1] - 2], labels: ['Mouthguard', 'Incisor 11', 'Over the gum'] },
  { dur: 1.4, hold: 0, offset: XCUT + 30, labels: [] },
  { fov: 34, dur: 2.2, hold: 0.3, section: false, theta: 0.38, phi: 1.76, zoom: 0.86, focus: 'auto', labels: [] },
  { dur: 1.0, hold: 0.4, set: { blow: 1 }, labels: ['Blow'] },
  { dur: 2.6, hold: 3.0, set: { spread: 0.75 }, labels: ['Blow', 'Force spread', 'Mouthguard'] }   // teaching shot
]);
fig.start();
