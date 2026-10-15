// Class V filling at the gumline on the mandibular left first premolar (FDI 34 = Universal 21), crown up in its socket; frame: +x mesial, +z buccal, CEJ at y = 0; procedure in a bucco-lingual cut through the notch (camera on the mesio-buccal side).
// poster: step 5
// A wedge-shaped notch on the buccal neck of the tooth, half on enamel and half on root dentin, just above a slightly receded
// gum margin (Class V: gingival third of the facial or lingual surface, any tooth; dental-facts.md §16). The surface is cleaned
// and lightly roughened, bonded, filled with tooth-coloured composite (one small increment, <= 2 mm) and light-cured, flush
// with the tooth. The kit has no Class V prep, so the notch and its filling are built here from ray-cast tooth surfaces.
const FDI = 34;
const fig = DK.figure({
  fov: 26,
  title: 'Filling at the gumline',
  subtitle: 'Lower left first premolar, FDI 34 (Universal 21). Class V, cut cheek to tongue.',
  view: { theta: 0.9, phi: 1.3 }
});

// --- tooth and context: the gum has receded about 1 mm, the bone crest sits about 2 mm below it
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const MARGIN = -1.0, CREST = MARGIN - 1.8;
const bone = DK.bone({ width: 12, height: 15, depth: 10, cortical: 1.2, crest: 1.4 }); bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: MARGIN, crest: CREST, width: 12.4, depth: 10.6 });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone around the root.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum margin has pulled back a little, so the neck of the tooth shows.' });
fig.part(tooth.group, { name: 'Tooth 34', label: false, info: 'Lower left first premolar: one root, one canal.' });

// --- the outer surface of the tooth at height y, angle th (0 = mesial, pi/2 = buccal), by ray casting toward the long axis
tooth.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster(), solids = [L.enamel, L.dentin];
const surf = (y, th) => {
  const d = new THREE.Vector3(-Math.cos(th), 0, -Math.sin(th)), o = new THREE.Vector3(Math.cos(th) * 12, y, Math.sin(th) * 12);
  rc.set(o, d); const h = rc.intersectObjects(solids, true).filter(i => !i.object.userData.isStencil);
  const p = h.length ? h[0].point : o.clone().addScaledVector(d, 12 - s.blC / 2);
  return { p: [p.x, p.y, p.z], n: [d.x, d.y, d.z] };   // n points into the tooth
};

// --- the notch: a closed wedge-shaped solid between the outer surface and a V-shaped floor, crescent-shaped along the gum line
const TH0 = Math.PI / 2 - 0.75, TH1 = Math.PI / 2 + 0.75;   // mesio-distal extent around the buccal surface
const YT = 1.6, YB = -0.8, YA = 0.3, DEPTH = 1.35;        // occlusal edge, cervical edge, apex height (mm, tooth frame), depth at the middle
const NU = 30, NJ = 48, HALF = NJ / 2;
const shapeAt = th => { const u = (th - TH0) / (TH1 - TH0), b = Math.max(0, Math.sin(Math.PI * u)); return { g: Math.pow(b, 0.45), f: Math.pow(b, 0.7) }; };
// cache the surface points per row and height (one ray per pair)
const rows = [];
for (let i = 0; i <= NU; i++) {
  const th = TH0 + (TH1 - TH0) * i / NU, sh = shapeAt(th), yc = (YT + YB) / 2;
  const yT = yc + (YT - yc) * sh.g, yB = yc + (YB - yc) * sh.g, yA = yc + (YA - yc) * sh.g;
  const outer = [], inner = [];
  for (let j = 0; j < HALF; j++) {
    const t = j / HALF, y = yT + (yB - yT) * t; outer.push(Object.assign({ y }, surf(y, th)));
    const s2 = j / HALF, yi = yB + (yT - yB) * s2;
    const sp = yi < yA ? 0.5 * (yi - yB) / Math.max(1e-3, yA - yB) : 0.5 + 0.5 * (yi - yA) / Math.max(1e-3, yT - yA);
    const dv = DEPTH * sh.f * (1 - Math.pow(Math.abs(2 * sp - 1), 1.7));
    inner.push(Object.assign({ y: yi, d: dv }, surf(yi, th)));
  }
  const mid = surf((yT + yB) / 2, th);
  rows.push({ th, outer, inner, mid, yA });
}
const P = (q, d) => [q.p[0] + q.n[0] * d, q.p[1], q.p[2] + q.n[2] * d];
// fill k = 0..1: the outer face rises from the floor to the surface (composite flowing in); k = 1 with over > 0 gives the hole
function notchGeo(over, k) {
  const pos = (i, j) => {
    const r = rows[i];
    if (j < HALF) { const q = r.outer[j], inn = r.inner[HALF - 1 - j]; const dFloor = (inn ? inn.d : 0); return P(q, dFloor + (-over - dFloor) * k); }
    const q = r.inner[j - HALF]; return P(q, q.d);
  };
  const end = i => P(rows[i].mid, -over * 0.5);
  return DK.gridGeometry(NU, NJ, pos, end(NU), end(0));
}
const notch = DK.asHole(new THREE.Mesh(notchGeo(0.03, 1), DK.mat('cavity', {}))); notch.name = 'Notch'; tooth.group.add(notch);
const FILL_MAT = DK.mat('composite', { color: 0xdccfb2, cap: DK.COLORS.compositeCap });
const filling = DK.inFront(new THREE.Mesh(notchGeo(0.02, 0), FILL_MAT)); filling.name = 'Filling'; filling.visible = false; tooth.group.add(filling);
const setFill = k => { const g = notchGeo(0.02, k), p = filling.geometry.attributes.position; p.array.set(g.attributes.position.array); p.needsUpdate = true; filling.geometry.computeVertexNormals(); filling.geometry.computeBoundingSphere(); g.dispose(); };

// key points on the middle row (buccal, x ~ 0: in the cut plane)
const MID = rows[NU / 2], APEX = (() => { let best = MID.inner[0]; MID.inner.forEach(q => { if (q.d > best.d) best = q; }); return P(best, best.d); })();
const SURF_MID = P(MID.mid, 0);

// --- tools (fig.world, parked out of view)
const bur = DK.bur({ shape: 'round', diameter: 1.2, head: 1.2, length: 13 }); bur.rotation.x = Math.PI / 2 - 0.25;   // shank out to the cheek side, tilted up
const light = DK.curingLight({ tip: 4 }); light.rotation.x = Math.PI / 2 - 0.85; light.scale.setScalar(0.6);                                             // shines toward -z, into the buccal surface
const steel = DK.mat('steel', {});
const tip = new THREE.Group();   // a composite compule tip, nozzle at the origin, body out to the cheek side and up
tip.add(DK.tube([[0, 0, 0], [0, 0.4, 1.4], [0, 1.4, 2.8], [0, 3.2, 3.8], [0, 6.0, 4.4]], 0.45, steel, { caps: true }));
const hub = DK.lathe([[0.6, 0], [1.1, 1.2], [1.3, 9], [0, 9.2]], 24, DK.mat(0xd9d3c8, { roughness: 0.5 })); hub.position.set(0, 6.0, 4.4); hub.rotation.x = -0.25; tip.add(hub);
[bur, light, tip].forEach(o => fig.world.add(DK.inFront(o)));

// --- labels
const cutOn = (e, sec) => sec.enabled;
fig.part(notch, { inPlace: true, name: 'Notch', sub: 'at the gumline', anchor: (e, sec) => sec.enabled ? [0.1, APEX[1] + 0.2, (APEX[2] + SURF_MID[2]) / 2] : SURF_MID, dim: false, when: () => notch.visible, info: 'A wedge-shaped loss of tooth at the neck, half on enamel and half on root. Class V means the gingival third of the cheek-side or tongue-side surface, on any tooth. Brushing, acid, flexing or decay can all cause it.' });
fig.part(L.enamel, { inPlace: true, name: 'Enamel', anchor: [0.1, s.crownL * 0.55, s.bl / 2 - 0.5], labelOffset: [-60, -30], dim: false, when: cutOn, info: 'Enamel ends in a thin edge at the neck of the tooth (the CEJ).' });
fig.part(L.dentin, { inPlace: true, name: 'Root surface', sub: 'dentin, no enamel', anchor: [0.1, YB + 0.05, surf(YB + 0.05, Math.PI / 2).p[2] - 0.15], labelOffset: [-40, 60], dim: false, when: cutOn, info: 'Below the CEJ the tooth has no enamel. The exposed root dentin is cleaned and lightly roughened so the filling bonds to it.' });
fig.part(gum, { inPlace: true, name: 'Gum', anchor: (e, sec) => [(sec.enabled ? sec.offset : 0) + 0.1 - gum.position.x, MARGIN - 0.6 - gum.position.y, surf(MARGIN - 0.6, Math.PI / 2).p[2] + 0.8 - gum.position.z], dim: false, when: cutOn, info: 'The gum margin sits just below the notch. A filling here must stay clean and dry, so the gum is kept back while it is placed.' });
fig.part(L.pulp, { inPlace: true, name: 'Pulp', anchor: [0.1, 1.2, 0], dim: false, when: cutOn, info: 'The nerve stays well clear of a shallow notch.' });
fig.part(bur, { inPlace: true, name: 'Bur', sub: 'cleans and roughens', anchor: [0, 3.6, 0], info: 'A small round bur (or a pumice paste) cleans the surface and lightly roughens the glassy dentin. No healthy tooth needs to be cut away.' });
fig.part(tip, { inPlace: true, name: 'Composite', sub: 'tooth-coloured', anchor: [0, 2.6, 3.4], info: 'After etching and bonding, tooth-coloured composite is pressed into the notch. Glass ionomer is the other common choice here.' });
fig.part(light, { inPlace: true, name: 'Curing light', anchor: [0, 6, 0], info: 'Blue LED light sets the composite in seconds.' });
fig.part(filling, { inPlace: true, name: 'Filling', sub: 'flush with the tooth', anchor: (e, sec) => sec.enabled ? [0.1, APEX[1] + 0.25, (APEX[2] + SURF_MID[2]) / 2] : SURF_MID, accent: true, dim: false, when: () => filling.visible && fk.k > 0.9, info: 'Shaped and polished flush with the tooth: the neck is sealed, smooth to clean, and no longer catches the brush or feels cold.' });

// --- params
const fk = { k: 0 };
const b = { bu: 0, bo: 30 };   // bur: position along the notch (-1..1) and how far out (mm) it stands from the floor
const placeBur = () => {
  bur.visible = b.bo < 20;
  const fi = Math.round((b.bu + 1) / 2 * NU * 0.7 + NU * 0.15), r = rows[Math.min(NU, Math.max(0, fi))];
  let best = r.inner[0]; r.inner.forEach(q => { if (q.d > best.d) best = q; });
  const p = P(best, best.d - 0.55 - b.bo);   // round head (r 0.6) sitting on the floor
  bur.position.set(p[0], p[1], p[2]);
};
Object.keys(b).forEach(k => fig.param(k, b[k], v => { b[k] = v; placeBur(); }));
const tl = { ty: 30, ly: 30, cure: 0 };
const placeTools = () => {
  tip.visible = tl.ty < 20; tip.position.set(SURF_MID[0], SURF_MID[1] + 0.1, SURF_MID[2] + tl.ty);
  light.visible = tl.ly < 20; light.position.set(SURF_MID[0], SURF_MID[1] + 1.4 + tl.ly * 0.5, SURF_MID[2] + 1.4 + tl.ly); light.set(tl.cure);
};
Object.keys(tl).forEach(k => fig.param(k, tl[k], v => { tl[k] = v; placeTools(); }));
fig.param('fill', 0, k => { fk.k = k; filling.visible = k > 0.01; if (filling.visible) setFill(k); notch.visible = k < 0.99; });

fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap },
  { objects: [notch], color: DK.holeCap(fig), kind: 'plain' },
  { objects: [filling], color: DK.COLORS.compositeCap, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });

// --- the procedure: camera on the mesio-buccal side sees the cut face and the buccal surface of the distal half
const NECK = [0, 0.4, s.blC / 2 - 0.8], HERO = [0, 1.4, 0.6], FRAME = [0, 2.0, 0.9], CAM = { theta: 0.62, phi: 1.36 };
fig.procedure([
  { label: 'Notch at the gumline', caption: 'A wedge-shaped notch has worn into the neck of the tooth, just above the gum.', beats: [
    { fov: 32, dur: 0, hold: 1.4, theta: 0.35, phi: 1.3, zoom: 1.0, section: false, labels: [] },
    { dur: 2.0, hold: 1.0, theta: 0.2, phi: 1.42, zoom: 0.45, focus: NECK, labels: ['Notch'] },
    { fov: 26, dur: 2.0, hold: 0.2, theta: CAM.theta, phi: CAM.phi, zoom: 0.95, focus: 'auto', labels: [] },
    { dur: 0, hold: 0, section: true, offset: 6 },
    { dur: 2.2, hold: 0.4, offset: 0, labels: ['Enamel', 'Pulp'] },
    { dur: 1.8, hold: 1.8, zoom: 0.56, focus: FRAME, labels: ['Notch', 'Root surface', 'Gum'], key: true }] },
  { label: 'Clean the surface', caption: 'The surface is cleaned and lightly roughened so the filling can bond.', beats: [
    { dur: 1.0, hold: 0.1, set: { bu: -1, bo: 3 }, labels: ['Bur'] },
    { dur: 0.5, hold: 0, set: { bo: 0 }, labels: ['Bur'] },
    { dur: 2.4, hold: 0.2, ease: 'linear', set: { bu: 1 }, labels: ['Bur'], key: true },
    { dur: 0.8, hold: 0.6, set: { bo: 30 }, labels: ['Root surface'] }] },
  { label: 'Fill with composite', caption: 'After etching and bonding, tooth-coloured composite is pressed into the notch.', beats: [
    { dur: 1.0, hold: 0.1, set: { ty: 1.2 }, labels: ['Composite'] },
    { dur: 2.2, hold: 0.3, set: { fill: 1 }, labels: ['Composite'], key: true },
    { dur: 0.8, hold: 0.4, set: { ty: 30 }, labels: [] }] },
  { label: 'Light-cure', caption: 'Blue light sets it hard.', beats: [
    { dur: 0.9, hold: 0.1, set: { ly: 0 }, labels: ['Curing light'] },
    { dur: 0.3, hold: 1.2, set: { cure: 1 }, labels: ['Curing light'], key: true },
    { dur: 0.3, hold: 0, set: { cure: 0 } },
    { dur: 0.8, hold: 0.3, set: { ly: 30 }, labels: [] }] },
  { label: 'Sealed and smooth', caption: 'Polished flush, the neck of the tooth is sealed and smooth again.', beats: [
    { dur: 2.2, hold: 0.8, theta: 0.2, phi: 1.4, zoom: 0.45, focus: NECK, labels: ['Filling'] },
    { dur: 2.2, hold: 2.4, theta: CAM.theta, phi: CAM.phi, zoom: 0.54, focus: HERO, labels: ['Filling', 'Enamel', 'Root surface', 'Gum'], key: true }] }
]);
fig.start();
