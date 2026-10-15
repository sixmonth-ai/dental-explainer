// Procedure: measuring the working length of the mandibular right second premolar (FDI 45 = Universal 29), crown up, in a mesio-distal cut through its one canal. Frame: +x mesial, +z buccal, CEJ at y = 0, mm; camera on the buccal side looks at the cut face.
// poster: step 3
// The canal ends in a short apical funnel: it narrows to the apical constriction (minor foramen), then widens again to the major
// foramen at the root surface. The working length runs from the buccal cusp tip (where the rubber stop rests) to the constriction,
// SHORT mm short of the radiographic apex (dental-facts §8: 0.5 to 1 mm; Kuttler 0.5 mm young, about 0.8 mm older). The apex
// locator reads the foramen, the file is pulled back to the constriction and the stop is set; shaping then stops at that length.
const FDI = 45, CREST = -1.6, SHORT = 0.5;
const SHAPE = { size: 30, taper: 0.06 };              // a common final size for a straight premolar canal; sizes vary by case

const fig = DK.figure({
  fov: 26,
  title: 'Measuring working length',
  subtitle: 'Lower right second premolar, FDI 45 (Universal 29), cut through the canal.',
  view: { theta: 0, phi: 1.45, margin: 0.98 }
});

// --- tooth and context
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const bone = DK.bone({ width: 9.5, height: 18.5, depth: 10.5, cortical: 1.1, crest: 1.4 }); bone.position.y = CREST;
const gum = DK.gingiva({ width: 9.5, height: 3.0, depth: 11.2, crest: 1.2, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = 1.1;
const pdl = DK.pdl(s, 0.2, CREST); pdl.traverse(m => { if (m.isMesh) m.material.visible = false; }); tooth.group.add(pdl);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the root.' });
fig.part(gum, { name: 'Gingiva', label: false, fit: false, info: 'In treatment a rubber dam covers the gum and isolates the tooth.' });
fig.part(tooth.group, { name: 'Tooth 45', label: false, info: 'Lower second premolar: one root, one canal in about 9 of 10 teeth.' });

// --- reference point: the buccal cusp tip (highest crown vertex on the buccal half)
const crownG = DK.crownGeometry(s), cp = crownG.attributes.position; let REF = [0, 0, 0];
for (let i = 0; i < cp.count; i++) { const y = cp.getY(i); if (cp.getZ(i) > 0 && y > REF[1]) REF = [cp.getX(i), y, cp.getZ(i)]; }
REF[1] += 0.05;
const full = DK.canalAccessPath(s, 0, { ref: REF, short: 0 });           // cusp tip → orifice → down the canal to the root tip
const PATH = full.points, L0 = full.wl, WL = L0 - SHORT;                    // arc length to the apex, and to the constriction
const pointAt = d => { let acc = 0; for (let i = 1; i < PATH.length; i++) { const a = PATH[i - 1], b = PATH[i], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (acc + l >= d) { const t = (d - acc) / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; } acc += l; } return PATH[PATH.length - 1].slice(); };
const APEX = full.apex, CON = pointAt(WL), CUT = DK.canalAt(s, 0, -7).z;

// --- canal space: access opening, emptied chamber and canal down to the constriction, then the apical funnel (tissue)
const EMPTY = DK.voidColor(fig), CANAL_INK = 0x5f5750;
const chamberGeo = L.pulp.userData.chamber.geometry, chamberPos = L.pulp.userData.chamber.position;
const access = DK.accessCavity(s, { k: 1, color: EMPTY });
const accessRim = DK.accessCavity(s, { k: 1, material: 'ink', grow: 1.05, lift: 0.01 });
const chamberVoid = new THREE.Mesh(chamberGeo, DK.mat('pdl', { color: EMPTY, cap: EMPTY, roughness: 0.95 })); chamberVoid.position.copy(chamberPos);
const chamberRim = new THREE.Mesh(DK.inflateGeometry(chamberGeo, 0.12), DK.mat('pdl', { color: DK.RIM, cap: DK.RIM })); chamberRim.position.copy(chamberPos); chamberRim.userData.cutOnly = true;
const canal = DK.canalShape(s, 0, Object.assign({ color: CANAL_INK, short: SHORT }, SHAPE));
// apical funnel: from the constriction (narrowest) widening to the major foramen at the root surface
const fPts = []; for (let i = 0; i <= 12; i++) fPts.push(new THREE.Vector3(...pointAt(WL - 0.05 + (SHORT + 0.35) * i / 12)));
const fCurve = new THREE.CatmullRomCurve3(fPts), R_CON = 0.11, R_FOR = 0.3;
const funnelGeo = new THREE.TubeGeometry(fCurve, 16, 1, 20, false), fp = funnelGeo.attributes.position, fn = funnelGeo.attributes.normal;
{ const rings = 17, cols = 21; for (let i = 0; i < rings; i++) { const t = i / (rings - 1), c = fCurve.getPointAt(t), r = R_CON + (R_FOR - R_CON) * Math.pow(t, 1.6);
    for (let j = 0; j < cols; j++) { const k = i * cols + j; fp.setXYZ(k, c.x + fn.getX(k) * r, c.y + fn.getY(k) * r, c.z + fn.getZ(k) * r); } } }
const capOf = (p, n, r) => { const g = new THREE.CircleGeometry(r, 20); const m = new THREE.Mesh(g); m.position.copy(p); m.lookAt(p.clone().add(n)); m.updateMatrix(); g.applyMatrix4(m.matrix); return g; };
const fEnd = fCurve.getPointAt(1), fTan = fCurve.getTangentAt(1), fStart = fCurve.getPointAt(0), sTan = fCurve.getTangentAt(0).negate();
const funnel = new THREE.Group();
[funnelGeo, capOf(fEnd, fTan, R_FOR), capOf(fStart, sTan, R_CON)].forEach(g => { g.computeVertexNormals(); funnel.add(new THREE.Mesh(g, DK.mat('pulp', { cap: DK.COLORS.pulpCap }))); });
[accessRim, chamberRim, access, chamberVoid, canal, funnel].forEach(o => tooth.group.add(o));
L.pulp.visible = false;   // the pulp has been removed down the canal; the funnel past the constriction keeps its tissue

// --- markers (flat ribbons just in front of the cut face)
const Z = CUT + 0.12, ink = () => new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd8d2c6 : 0x3b3833), toneMapped: false });
const acc = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });
const bar = (x0, y0, x1, y1, w, mat) => { const len = Math.hypot(x1 - x0, y1 - y0), m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, Z); m.rotation.z = Math.atan2(y1 - y0, x1 - x0); return m; };
const conMark = bar(CON[0] - 0.55, CON[1], CON[0] + 0.55, CON[1], 0.09, acc);
const MX = Math.max(CON[0], APEX[0]) + 1.9;                                 // measuring bar beside the root (mesial side)
const apexTick = bar(APEX[0] + 0.35, APEX[1], MX + 0.35, APEX[1], 0.05, ink());
const conTick = bar(CON[0] + 0.6, CON[1], MX + 0.35, CON[1], 0.05, ink());
const gapBar = bar(MX, CON[1], MX, APEX[1], 0.07, ink());
const marks = new THREE.Group(); [conMark, apexTick, conTick, gapBar].forEach(m => marks.add(m)); tooth.group.add(marks);
fig.part(conMark, { inPlace: true, name: 'Apical constriction', sub: 'working length ends here', anchor: [-0.5, 0, 0], accent: true, dim: false, when: () => marks.visible && st.con > 0.5, info: 'The narrowest point of the canal (minor foramen), where the pulp meets the periodontal tissue. Instruments and the root filling stop here.' });
fig.part(funnel, { inPlace: true, name: 'Major foramen', anchor: () => [fEnd.x, fEnd.y, Z], dim: false, when: () => st.con > 0.5 || st.foramen > 0.5, info: 'Where the canal opens on the root surface. It can lie up to 3 mm to the side of the anatomical apex, so it is not the end of the root.' });
fig.part(apexTick, { inPlace: true, name: 'Radiographic apex', anchor: [(MX - APEX[0]) / 2 - 0.1, 0, 0], dim: false, when: () => marks.visible && st.apexLabel > 0.5, info: 'The tip of the root as it shows on the radiograph.' });
fig.part(gapBar, { inPlace: true, name: `${SHORT} mm`, anchor: [0.05, 0, 0], dim: false, labelOffset: [40, 0], when: () => marks.visible && st.con > 0.5 && gapBar.visible, info: 'The constriction lies about 0.5 to 1 mm short of the radiographic apex (0.5 mm in young teeth, nearer 0.8 mm in older ones).' });

// --- instruments
const kfile = DK.endoFile({ kind: 'K', size: 15, length: 25, stop: WL });
const rotary = DK.endoFile({ kind: 'rotary', size: SHAPE.size, taper: SHAPE.taper, length: 25, stop: WL });
[kfile, rotary].forEach(o => fig.world.add(o));
fig.part(kfile.handle, { inPlace: true, name: 'K-file 15', anchor: [0, 6, 0], info: 'A fine stainless-steel hand file (tip 0.15 mm). An electronic apex locator, clipped to the file and to the lip, reads where its tip is.' });
fig.part(kfile.stop, { inPlace: true, name: 'Rubber stop', sub: 'on the cusp tip', anchor: [1.3, 0, 0], dim: false, when: () => kfile.stop.visible, info: 'Set at the working length; it rests on the buccal cusp tip, the reference point every later instrument uses.' });
const sz = `${SHAPE.size}/.${String(Math.round(SHAPE.taper * 100)).padStart(2, '0')}`;
fig.part(rotary.handle, { inPlace: true, name: `Rotary file ${sz}`, anchor: [0, 6, 0], info: 'Every shaping file carries a stop at the same length, so the shape ends at the constriction.' });
const mid = DK.canalAt(s, 0, -6);
fig.part(canal, { inPlace: true, name: 'Shaped to length', anchor: [mid.x + 0.2, -6, CUT], dim: false, when: () => canal.userData.k > 0.5, info: 'A continuously tapering shape that ends at working length; the foramen keeps its original size and position.' });
const wlLabel = new THREE.Object3D(); wlLabel.position.set(REF[0], REF[1], REF[2]); tooth.group.add(wlLabel);
fig.part(wlLabel, { inPlace: true, name: 'Working length', sub: `${DK.mm(WL)}, cusp tip to constriction`, anchor: [0, 0, 0], dim: false, labelOffset: [-110, 10], when: () => st.wl > 0.5, info: 'Measured from the reference cusp to the apical constriction with an apex locator, and checked on a radiograph.' });

// --- params
const st = { con: 0, foramen: 0, apexLabel: 0, wl: 0 };
const place = (tool, d) => { tool.visible = d > -25; if (tool.visible) tool.insert(PATH, d); };
fig.param('kfile', -40, d => place(kfile, d));
fig.param('rotary', -40, d => place(rotary, d));
fig.param('stop', 0, v => { kfile.stop.visible = v > 0.5; });
fig.param('shape', 0, k => canal.set(k));
fig.param('marks', 0, v => { marks.visible = v > 0.5; gapBar.visible = conTick.visible = conMark.visible = st.con > 0.5; });
fig.param('con', 0, v => { st.con = v; gapBar.visible = conTick.visible = conMark.visible = v > 0.5; });
fig.param('foramen', 0, v => { st.foramen = v; });
fig.param('apexLabel', 0, v => { st.apexLabel = v; });
fig.param('wl', 0, v => { st.wl = v; });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: fig.dark ? 0xbdb5a6 : 0xe4dccb, kind: 'plain' },   // plain cut face: the apex push-in reads on a calm ground
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: funnel.children, color: DK.COLORS.pulpCap },
  { objects: [accessRim, chamberRim], color: DK.RIM, kind: 'plain' },
  { objects: [access, chamberVoid], color: EMPTY, kind: 'plain' },
  { objects: [canal], color: CANAL_INK, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: CUT } });
fig.xray([bone, gum, L.enamel, L.dentin, L.root, access, chamberVoid, canal], false);
fig.view('Radiograph', { theta: 0, phi: 1.5, zoom: 1.0, focus: 'auto', section: false, xray: 1 });
fig.view('Apex', { theta: 0, phi: 1.5, zoom: 0.3, focus: [APEX[0] + 0.8, APEX[1] + 0.6, CUT], section: true, offset: CUT, xray: 0 });
fig.setReadout([
  { k: 'Working length', v: `${DK.mm(WL)} (cusp tip to constriction)` },
  { k: 'To the radiographic apex', v: `${DK.mm(L0)} · ${SHORT} mm longer` }
]);

// --- the procedure (camera on +z looks at the cut face; mesial on the viewer's right)
const FOCUS_TOOTH = [0, -3.5, CUT], FOCUS_APEX = [APEX[0] + 0.7, APEX[1] + 2.8, CUT];
fig.procedure([
  { label: 'Estimate on X-ray', caption: 'A radiograph gives the tooth length and the position of the root tip.', beats: [
    { fov: 34, dur: 0, hold: 1.2, theta: 0.6, phi: 1.25, zoom: 1.0, section: false, xray: 0, labels: [] },
    { fov: 26, dur: 2.4, hold: 0.2, theta: 0, phi: 1.5, zoom: 0.95, focus: [0, -4.4, CUT], xray: 1, set: { marks: 1 }, labels: [] },
    { dur: 1.0, hold: 2.0, set: { apexLabel: 1 }, labels: ['Radiographic apex'], key: true }] },
  { label: 'File to the apex', caption: 'A fine file goes down the canal until the apex locator reads the foramen.', beats: [
    { dur: 1.6, hold: 0, xray: 0, focus: 'auto', set: { apexLabel: 0, marks: 0 }, labels: [] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { dur: 2.0, hold: 0.2, offset: CUT, zoom: 0.9, focus: FOCUS_TOOTH, set: { kfile: -1.5 }, labels: ['K-file 15'] },
    { dur: 2.8, hold: 0.2, set: { kfile: L0 - 1.5 }, labels: ['K-file 15'] },
    { dur: 2.2, hold: 1.8, zoom: 0.36, focus: FOCUS_APEX, set: { kfile: L0, foramen: 1 }, labels: ['Major foramen'], key: true }] },
  { label: 'Back to the constriction', caption: `The file comes back ${SHORT} mm, to the narrowest point of the canal.`, beats: [
    { dur: 1.8, hold: 0.3, set: { kfile: WL, marks: 1, con: 1, apexLabel: 1 }, labels: ['Major foramen'] },
    { dur: 1.0, hold: 2.6, labels: ['Apical constriction', 'Major foramen', 'Radiographic apex', `${SHORT} mm`], key: true }] },
  { label: 'Set the stop', caption: 'The rubber stop is set on the cusp tip: that distance is the working length.', beats: [
    { dur: 2.4, hold: 0.2, zoom: 1.15, xray: 0, focus: [0, -2.2, CUT], set: { foramen: 0, apexLabel: 0 }, labels: [] },
    { dur: 0.8, hold: 2.2, set: { stop: 1, wl: 1 }, labels: ['Rubber stop', 'Working length'], key: true },
    { dur: 1.0, hold: 0.2, set: { kfile: -40, stop: 0, wl: 0 }, labels: ['Apical constriction'] }] },
  { label: 'Shape to length', caption: 'Every shaping file stops at the same length; the constriction is left intact.', beats: [
    { dur: 1.0, hold: 0.1, zoom: 0.9, focus: FOCUS_TOOTH, set: { rotary: -1.5 }, labels: [`Rotary file ${sz}`] },
    { dur: 2.6, hold: 0.3, set: { rotary: WL, shape: 1 }, labels: [`Rotary file ${sz}`] },
    { dur: 1.0, hold: 0.2, set: { rotary: -40 }, labels: ['Shaped to length'] },
    { dur: 2.2, hold: 2.4, zoom: 0.86, focus: [0, -5.2, CUT], labels: ['Shaped to length', 'Apical constriction', 'Major foramen'], key: true }] }
]);
fig.start();
