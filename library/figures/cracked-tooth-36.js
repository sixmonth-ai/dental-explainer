// Cracked tooth: a mesio-distal crack in the mandibular left first molar (FDI 36 = Universal 19), story in a bucco-lingual cut (frame: +x mesial, +z buccal, CEJ at y = 0; camera on the mesial side, buccal on the viewer's left).
// poster: end
// The crack runs along the central groove through both marginal ridges and down toward the pulp roof; biting wedges the cusps apart and opens it (gap exaggerated), release snaps it shut and the pulp fires. Crack built locally from ray-cast tooth surfaces. Sizes in mm.
const FDI = 36, CUT = 0.6, ZC = 0;   // cut plane (x) just mesial of the central pit; crack plane z = 0 along the central groove
const fig = DK.figure({
  fov: 26,
  title: 'Cracked tooth',
  subtitle: 'Lower left first molar, FDI 36 (Universal 19), cut cheek to tongue. Gap exaggerated.',
  view: { theta: Math.PI / 2 - 0.6, phi: 1.0 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const CREST = -1.8;
const bone = DK.bone({ width: 15, height: 17, depth: 12.5, cortical: 1.3, crest: 1.6 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 15.4, height: 3.2, depth: 13.2, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.2;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the roots.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'Gingiva around the molar.' });
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar: lower molars are the teeth that crack most often, usually front to back through the central groove.' });

// --- measure the tooth: occlusal surface, proximal surfaces and pulp roof along the crack plane (ray casts, tooth frame)
tooth.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster();
const cast = (objs, o, d) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d)); const h = rc.intersectObjects(objs, true); return h.length ? h[0].point : null; };
const crownObjs = [L.enamel, L.dentin];
const topAt = x => { const p = cast(crownObjs, [x, 30, ZC], [0, -1, 0]); return p ? p.y : s.crownL; };
const roofAt = x => { const p = cast([L.pulp], [x, 30, ZC], [0, -1, 0]); return p ? p.y : null; };
const sideAt = (y, sg) => { const p = cast(crownObjs, [sg * 30, y, ZC], [-sg, 0, 0]); return p ? p.x : sg * s.mdC / 2; };
let roofMin = 1e9; for (let x = -1.5; x <= 1.5; x += 0.25) { const r = roofAt(x); if (r != null) roofMin = Math.min(roofMin, r); }
const Y_DEEP = roofMin + 0.45, Y_END = 1.3;           // stops ~0.5 mm short of the pulp roof; runs down the proximal surfaces to ~1.3 mm above the CEJ
const XT = s.md / 2 - 0.35;
const NU = 44, NV = 14, COLS = 2 * (NV + 1);
const rowsU = [];
for (let i = 0; i <= NU; i++) {
  const u = -1 + 2 * i / NU, xr = u * XT, a = Math.abs(u);
  const yb = Y_DEEP + (Y_END - Y_DEEP) * Math.pow(Math.min(1, Math.max(0, (a - 0.25) / 0.75)), 1.6);
  rowsU.push({ u, yb, yt: topAt(xr) + 0.03 });
}
// the crack as a closed thin wedge: widest at the surface, a hairline at its depth
function crackPos(W) {
  return (i, j) => {
    const r = rowsU[i], front = j <= NV, v = front ? j / NV : (COLS - 1 - j) / NV, y = r.yb + (r.yt - r.yb) * v;
    const sg = r.u >= 0 ? 1 : -1, xs = Math.abs(sideAt(y, sg)) + 0.03, x = sg * Math.min(Math.abs(r.u) * (XT + 0.4), xs);
    const w = W * (0.12 + 0.88 * v * v) / 2;
    return [x, y, ZC + (front ? w : -w)];
  };
}
const capPt = i => { const r = rowsU[i]; const sg = r.u >= 0 ? 1 : -1, y = (r.yb + r.yt) / 2; return [sg * Math.min(XT + 0.4, Math.abs(sideAt(y, sg)) + 0.03), y, ZC]; };
const W0 = 0.07, W1 = 0.4;
const crackGeo = DK.gridGeometry(NU, COLS, crackPos(W0), capPt(NU), capPt(0));
const crackMat = new THREE.MeshStandardMaterial({ color: DK.color(0x3a3430), roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const crack = new THREE.Mesh(crackGeo, crackMat); crack.name = 'Crack'; tooth.group.add(crack);
const setCrack = W => { const g = DK.gridGeometry(NU, COLS, crackPos(W), capPt(NU), capPt(0)); crackGeo.attributes.position.array.set(g.attributes.position.array); crackGeo.attributes.position.needsUpdate = true; crackGeo.computeVertexNormals(); g.dispose(); };

// --- force arrows on the cut (flat, in the y-z plane just in front of the cut face)
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd8d2c6 : 0x3a3733), toneMapped: false, transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide });
function arrow(from, to, w) {   // from/to: [y, z]; a flat arrow lying in the plane x = CUT + 0.12
  const dy = to[0] - from[0], dz = to[1] - from[1], len = Math.hypot(dy, dz), hw = w * 1.4, hl = w * 2.2;
  const sh = new THREE.Shape([[0, -w / 2], [len - hl, -w / 2], [len - hl, -hw], [len, 0], [len - hl, hw], [len - hl, w / 2], [0, w / 2]].map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ShapeGeometry(sh), P = g.attributes.position, d = [dy / len, dz / len], n = [-dz / len, dy / len];
  for (let i = 0; i < P.count; i++) { const a = P.getX(i), b = P.getY(i); P.setXYZ(i, CUT + 0.12, from[0] + a * d[0] + b * n[0], from[1] + a * d[1] + b * n[1]); }
  const m = new THREE.Mesh(g, inkMat); m.renderOrder = 3; return m;
}
const TOPC = topAt(CUT);
const bite = arrow([TOPC + 3.4, ZC], [TOPC + 0.5, ZC], 0.32);
const cuspB = arrow([s.crownL - 0.6, s.bl / 2 - 0.4], [s.crownL - 0.6, s.bl / 2 + 1.4], 0.22);
const cuspL = arrow([s.crownL - 0.6, -s.bl / 2 + 0.4], [s.crownL - 0.6, -s.bl / 2 - 1.4], 0.22);
const arrows = new THREE.Group(); [bite, cuspB, cuspL].forEach(a => arrows.add(a)); arrows.visible = false; fig.world.add(arrows);

// --- labels
const cutOn = (e, sec) => sec.enabled;
fig.part(crack, { inPlace: true, name: 'Crack', sub: 'runs toward the pulp', anchor: (e, sec) => sec.enabled ? [CUT + 0.1, (Y_DEEP + TOPC) / 2, ZC] : [XT * 0.55, topAt(XT * 0.55) + 0.05, ZC], accent: true, dim: false, info: 'A crack along the central groove, through the marginal ridges and down toward the pulp. Too fine to see on most X-rays; dentists find it with a bite test, a light or dye. Often treated with a crown that holds the cusps together; a crack that splits the root cannot be saved.' });
fig.part(arrows, { inPlace: true, name: 'Biting', sub: 'pushes the cusps apart', anchor: () => [CUT + 0.12, TOPC + 2.6, ZC], dim: false, when: () => inkMat.opacity > 0.3, info: 'A hard bite wedges into the groove and flexes the cusps on either side: the crack opens by a few micrometres (drawn much wider here).' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', sub: 'nerves and vessels', anchor: [CUT + 0.1, roofMin - 0.6, ZC - 1.0], dim: false, when: (e, sec) => sec.enabled && pz.zap < 0.3, info: 'The living core of the tooth.' });
fig.part(L.pulp, { inPlace: true, name: 'Sharp pain on release', sub: 'the crack snaps shut', anchor: [CUT + 0.1, roofMin - 0.6, ZC - 1.0], dim: false, when: (e, sec) => sec.enabled && pz.zap >= 0.3, info: 'When the bite is released the crack closes quickly; the fluid in it and in the dentin tubules shifts and fires the pulp nerves. A sharp pain on letting go is a classic sign of a cracked tooth. If the crack reaches the pulp it can inflame and die.' });

// --- params
const pz = { zap: 0 };
const PULP = DK.color(DK.COLORS.pulp), HOT = DK.color(0xa3554b), CAP0 = DK.color(DK.COLORS.pulpCap), CAPHOT = DK.color(0xa9524a), PULP_GROUP = 6;
const tmp = new THREE.Color();
fig.param('open', 0, k => setCrack(W0 + (W1 - W0) * k));
fig.param('force', 0, k => { inkMat.opacity = 0.85 * k; arrows.visible = k > 0.02; });
fig.param('zap', 0, k => { pz.zap = k; L.pulp.traverse(m => { if (m.isMesh && !m.userData.isStencil) m.material.color.copy(PULP).lerp(HOT, k); }); if (fig.section && fig.section.caps[PULP_GROUP]) fig.section.caps[PULP_GROUP].material.uniforms.uColor.value.copy(tmp.copy(CAP0).lerp(CAPHOT, k)); });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [crack], color: 0x3a3430, kind: 'plain' },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4.5, 4.5], offset: CUT } });
fig.view('Chewing surface', { theta: 0.2, phi: 0.35, zoom: 0.85, section: false, focus: [0, s.crownL, 0], labels: ['Crack'] });

// --- story
const SIDE = Math.PI / 2 - 0.04, CROWN = [CUT, s.crownL * 0.55, ZC];
fig.story([
  { fov: 34, dur: 0, hold: 1.6, theta: Math.PI / 2 - 0.7, phi: 0.75, zoom: 0.95, section: false, labels: ['Crack'], caption: 'A fine crack along the chewing surface.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: SIDE, phi: 1.45, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 6.5 },
  { dur: 2.2, hold: 1.6, offset: CUT, labels: ['Crack', 'Pulp'], caption: 'Inside, it runs down toward the pulp.' },
  { dur: 1.8, hold: 0.3, zoom: 0.6, focus: CROWN, labels: ['Crack'] },
  { dur: 1.2, hold: 1.6, set: { force: 1, open: 1 }, labels: ['Biting', 'Crack'], caption: 'Biting pushes the cusps apart and opens the crack.' },
  { dur: 0.25, hold: 0.2, ease: 'in', set: { force: 0, open: 0 }, labels: ['Crack'] },
  { dur: 0.35, hold: 1.8, set: { zap: 1 }, labels: ['Sharp pain on release'], caption: 'Letting go snaps it shut: a sharp pain.' },
  { dur: 2.4, hold: 2.6, zoom: 0.66, focus: [CUT, s.crownL * 0.5, ZC], theta: SIDE - 0.1, phi: 1.4, set: { force: 1, open: 0.7, zap: 0.85 }, labels: ['Biting', 'Crack', 'Sharp pain on release'] }
]);
fig.start();
