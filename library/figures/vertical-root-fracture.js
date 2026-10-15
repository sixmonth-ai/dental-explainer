// Vertical root fracture of a root-filled mandibular right second premolar (FDI 45 = Universal 29) restored with a post, core and crown, in its socket; frame: +x mesial, +z buccal, CEJ at y = 0. Story from the mesio-buccal side with the bone and gum turning see-through.
// poster: end
// The fracture runs along the root from cheek to tongue side (plane x = 0, through the canal), widest toward the apex here.
// Bacteria in the crack inflame the tissue beside it: a narrow, deep bony defect on the buccal along the crack line (an
// isolated deep pocket that a probe finds at one spot only) and bone loss that wraps from the apex up one side of the root
// (the "J-shaped" radiolucency). The tooth usually cannot be kept. Restorative numbers follow examples/post-core-crown-45
// (dental-facts.md §12); defect sizes are schematic.
const FDI = 45, FERRULE = 2.0, POST_IN_ROOT = 8;
const fig = DK.figure({
  fov: 30,
  title: 'Vertical root fracture',
  subtitle: 'Lower right second premolar, FDI 45 (Universal 29), root-filled with a post and crown.',
  view: { theta: 0.5, phi: 1.25 }
});

// --- the restored tooth: own root, ferrule, composite core, fibre post, root filling, crown
const tooth = DK.tooth(FDI, { omit: ['enamel', 'dentin', 'pulp'] }), s = tooth.spec;
const ferrule = DK.prep(s, { maxY: FERRULE });
const core = DK.prep(s, { material: 'composite', minY: FERRULE });
const gp = DK.guttaPercha(s, 0, { from: -POST_IN_ROOT - 0.2 });
const post = DK.post({ length: POST_IN_ROOT, exposed: 4.5, d0: 1.5, d1: 1.0 });
const crown = DK.restorationCrown(s, 'ceramic');
[ferrule, core, gp, post, crown].forEach(o => tooth.group.add(o));
fig.part(tooth.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar after root canal treatment, restored with a fibre post, a core and a crown. Root-filled teeth are the ones that fracture this way most often.' });

// --- bone (with a narrow buccal defect along the crack that grows in) and gum
const CREST = -1.8, LAB = s.blC / 2, DEF = 6.4;
const bone = DK.perioBone({ width: 13, height: 19, depth: s.blC + 4.2, cortical: 1.1, crest: 1.3, level: 0,
  loss: { defects: [{ x: 0, z: LAB + 0.7, depth: DEF, rx: 1.1, rz: 2.2 }] } });
bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: 1.2, crest: CREST, width: 13.4, depth: s.blC + 4.8 });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the root.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum often looks normal; a small swelling or a sinus tract can appear next to the crack.' });

// --- the fracture: a thin sheet in the plane x = 0 across the root (cheek to tongue), from near the apex up to the cervical third
tooth.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster();
const probes = []; tooth.layers.root.traverse(m => { if (m.isMesh && !m.userData.isStencil) probes.push(m); }); tooth.layers.dentin && tooth.layers.dentin.traverse(m => { if (m.isMesh && !m.userData.isStencil && !probes.includes(m)) probes.push(m); });
const ferruleMeshes = []; ferrule.traverse(m => { if (m.isMesh) ferruleMeshes.push(m); });
const rootSpan = y => {   // buccal and lingual surfaces of the root at height y in the plane x = 0
  const hit = sg => { rc.set(new THREE.Vector3(0, y, sg * 20), new THREE.Vector3(0, 0, -sg)); const h = rc.intersectObjects(probes.concat(ferruleMeshes), false); return h.length ? h[0].point.z : null; };
  const b = hit(1), l = hit(-1); return b != null && l != null ? [l, b] : null;
};
const Y0 = -s.rootL + 0.9, Y1 = -2.2, NR = 44, NT = 18;
const rows = []; for (let i = 0; i <= NR; i++) { const y = Y0 + (Y1 - Y0) * i / NR; rows.push({ y, span: rootSpan(y) }); }
let lastSpan = rows.find(r => r.span).span; rows.forEach(r => { if (r.span) lastSpan = r.span; else r.span = [lastSpan[0], lastSpan[0]]; });
const crackMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const crackGeo = k => DK.slabGeometry(NR, NT, (i, j) => {
  const r = rows[i], top = Y0 + (Y1 - Y0) * k, on = r.y <= top + 1e-6;
  const a = r.span[0] - 0.05, b = r.span[1] + 0.05, z = on ? a + (b - a) * j / NT : (a + b) / 2, y = on ? r.y : top;
  const w = 0.07 + 0.13 * DK.util.smooth(Y1, Y0 + 1, r.y);
  return [[-w / 2, y, z], [w / 2, y, z]];
});
const crack = new THREE.Mesh(crackGeo(1), crackMat); crack.renderOrder = 4; tooth.group.add(crack);
const setCrack = k => { crack.visible = k > 0.02; const g = crackGeo(Math.max(0.02, k)), p = crack.geometry.attributes.position; p.array.set(g.attributes.position.array); p.needsUpdate = true; crack.geometry.computeBoundingSphere(); g.dispose(); };

// --- the J-shaped bone loss: around the apex and up the mesial side of the root (a radiolucency in the bone)
const lesMat = DK.mat('pdl', { color: 0x5e5450, roughness: 0.9, transparent: true, opacity: 0.5, depthWrite: false });
const apexY = -s.rootL, RS = y => Math.abs(DK.toothSurfaceAt(s, y, 0).x);
const jPts = [[-1.1, apexY + 0.9, 0.2], [-0.4, apexY - 0.35, 0.3], [0.7, apexY - 0.25, 0.4], [RS(apexY + 1.8) + 0.45, apexY + 1.8, 0.5], [RS(apexY + 4.2) + 0.45, apexY + 4.2, 0.6], [RS(apexY + 7.2) + 0.4, apexY + 7.2, 0.7]];
const curve = new THREE.CatmullRomCurve3(jPts.map(p => new THREE.Vector3(...p)));
const jPath = curve.getPoints(40).map(v => v.toArray());
const jLesion = DK.tube(jPath, 0.75, lesMat, { caps: true, taper: u => (1.25 - 0.75 * u) * (1 + 0.14 * Math.sin(u * 23) + 0.08 * Math.sin(u * 41 + 1)) });
const apical = DK.periapicalLesion({ radius: 1.4, seed: 3 }); apical.material = lesMat; apical.position.set(0, apexY - 0.2, 0.3);
const bL = new THREE.Group(); bL.add(jLesion, apical); tooth.group.add(bL);
const setLoss = k => { bone.set(k); bL.visible = k > 0.02; lesMat.opacity = 0.5 * DK.util.smooth(0, 0.6, k); jLesion.geometry.setDrawRange(0, Math.ceil(jLesion.geometry.index.count * Math.min(1, k * 1.1) / 6) * 6); apical.set(Math.min(1, k * 1.6)); apical.scale.setScalar(1.4 * Math.max(0.05, Math.min(1, k * 1.6))); };

// --- the probe (fig.world): walks along the buccal gum margin and drops into the narrow pocket over the crack
const MARGIN = 1.2, POCKET = CREST - DEF + 1.0;   // pocket base about 1 mm above the bottom of the bony defect
const probe = DK.probe({ type: 'UNC-15' }); probe.rotation.y = Math.PI;   // handle bends away to the mesial side, off the tooth
const pivot = new THREE.Group(); pivot.add(probe); fig.world.add(DK.inFront(pivot));
const P = { px: -3, depth: 0, out: 30 };
const pdAt = x => { const f = Math.exp(-Math.pow(x / 0.9, 2)); return 2 + (MARGIN - POCKET - 2) * f; };   // 2 mm sulcus away from the crack
const placeProbe = () => {
  pivot.visible = P.out < 20;
  const tipY = MARGIN - Math.min(P.depth, pdAt(P.px)) + P.out, th = Math.PI / 2 - P.px / LAB;
  const q = DK.toothSurfaceAt(s, Math.max(Math.min(tipY, MARGIN), -s.rootL + 1), th), qt = DK.toothSurfaceAt(s, MARGIN, th);
  pivot.position.set(q.x + Math.cos(th) * 0.3, tipY, q.z + Math.sin(th) * 0.3);
  pivot.rotation.set(Math.atan2(qt.z - q.z, Math.max(1, MARGIN - tipY)), 0, -0.2);
};
Object.keys(P).forEach(k => fig.param(k, P[k], v => { P[k] = v; placeProbe(); }));
fig.param('crack', 0, setCrack);
fig.param('loss', 0, setLoss);
setCrack(0); setLoss(0);

// --- labels
const xr = () => fig.xrayOn;
fig.part(crown, { inPlace: true, name: 'Crown', anchor: [-1.6, s.crownL * 0.6, s.bl / 2 - 0.4], info: 'A ceramic crown over a composite core.' });
fig.part(post, { inPlace: true, name: 'Post', sub: 'in the root canal', anchor: [0, -3.5, 0], dim: false, when: xr, info: 'A post retains the core; it does not strengthen the root. Wedging forces from posts, and the loss of dentin from canal shaping, raise the risk of a root fracture.' });
fig.part(gp, { inPlace: true, name: 'Root filling', anchor: () => { const c = DK.canalAt(s, 0, -11); return [c.x, -11, c.z]; }, dim: false, when: xr, info: 'Gutta-percha seals the canal below the post.' });
fig.part(crack, { inPlace: true, name: 'Fracture', sub: 'along the root', anchor: () => [0, Y0 + (Y1 - Y0) * 0.45, rows[Math.round(NR * 0.45)].span[1] + 0.05], accent: true, dim: false, when: () => crack.visible, info: 'A crack along the length of the root, from the canal out to the cheek and tongue sides. It is often invisible on X-rays and confirmed only by looking at the root.' });
fig.part(bL, { inPlace: true, name: 'J-shaped bone loss', anchor: () => jPath[30], labelOffset: [110, 40], dim: false, when: () => bL.visible && lesMat.opacity > 0.35, info: 'Bone breaks down beside the crack: on an X-ray a dark band runs from the tip of the root up one side (a J shape), or around both sides (a halo).' });
fig.part(pivot, { inPlace: true, name: 'Narrow, deep pocket', sub: 'at one spot only', anchor: () => [0, 13, 0], dim: false, when: () => pivot.visible && P.depth > 4, info: 'The probe sinks deep right over the crack, but a millimetre to either side the reading is normal. An isolated narrow, deep pocket next to a root-filled tooth is a classic sign of a vertical root fracture.' });

fig.xray([bone, gum], false);
// the root fades half-way with them (its own param), so the post, the root filling and the crack plane show through it
const rootMeshes = []; [tooth.layers.root, ferrule, core].forEach(o => o.traverse(m => { if (m.isMesh && !m.userData.isStencil) rootMeshes.push(m); }));
fig.param('see', 0, k => rootMeshes.forEach(m => { m.material.transparent = k > 0.01; m.material.opacity = 1 - 0.38 * k; m.material.depthWrite = k < 0.5; m.material.needsUpdate = true; }));
fig.standardControls({ explode: false });
fig.view('Radiograph', { xray: 1, theta: 0.05, phi: 1.5, zoom: 0.95, focus: 'auto', set: { see: 1, crack: 1, loss: 1, out: 30 } });

// --- story: the restored tooth → bone and gum turn see-through → the crack runs up the root → bone breaks down beside it
// (J shape) → a probe finds one narrow, deep pocket over the crack → the teaching shot
const ROOT = [0.4, -7, 1.0];
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.35, phi: 1.3, zoom: 1.0, xray: 0, labels: ['Crown'] },
  { fov: 28, dur: 2.2, hold: 1.4, theta: 0.6, phi: 1.35, zoom: 1.15, xray: 1, set: { see: 1 }, labels: ['Post', 'Root filling'] },
  { dur: 1.6, hold: 0.2, zoom: 0.75, focus: ROOT, labels: [] },
  { dur: 2.6, hold: 1.6, set: { crack: 1 }, labels: ['Fracture'] },
  { dur: 2.6, hold: 1.8, theta: 0.75, set: { loss: 1 }, labels: ['Fracture', 'J-shaped bone loss'] },
  { dur: 1.6, hold: 0.2, zoom: 0.9, focus: [0.4, -3.5, 1.4], theta: 0.45, set: { out: 0, px: -3.2, depth: 2 }, labels: [] },
  { dur: 1.8, hold: 0.3, ease: 'linear', set: { px: 0 }, labels: [] },
  { dur: 1.6, hold: 1.8, set: { depth: 9 }, labels: ['Narrow, deep pocket', 'Fracture'] },
  { dur: 2.4, hold: 2.8, theta: 0.55, phi: 1.32, zoom: 0.98, focus: [0.4, -3.6, 0.8], labels: ['Fracture', 'Narrow, deep pocket', 'J-shaped bone loss', 'Root filling'] }
]);
fig.start();
