// Story: a flexible (nylon, metal-free) partial denture on a lower arch missing 35, 36, 45 and 46 (Kennedy Class III, modification 1).
// poster: end
// The arch is shown with its two gaps, the denture seats from above, then the camera visits a gum-coloured clasp wrapping the neck of an
// abutment and the nylon lingual flange that joins both sides, lifts the denture out and ends on the whole appliance in place.
// Built like library/figures/partial-denture.js, with the metal frame replaced: no rests, no metal bar; translucent pink nylon saddles,
// clasps and lingual flange. Clasp and flange sizes are typical laboratory shapes, schematic.
// Arch frame (DK.arch, mandible): midline x = 0, patient's right at −x, +z anterior, crowns up, CEJs at y = 0. Tooth frames:
// +x mesial, +z buccal. The ridge, gum, saddles and framework are drawn here from the arch slots (the kit has no denture yet).
const PRESENT = [37, 34, 33, 32, 31, 41, 42, 43, 44, 47], MISSING = [35, 36, 45, 46];
const ABUT = { 37: 1, 47: 1, 34: -1, 44: -1 };            // abutments: +1 = the gap is mesial, −1 = the gap is distal
const fig = DK.figure({
  fov: 34,
  title: 'Flexible partial denture',
  subtitle: 'Lower arch missing FDI 35, 36, 45, 46 (Universal 20, 19, 29, 30). No metal.',
  view: { theta: 0.5, phi: 0.95, margin: 0.78 }
});
const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// --- remaining teeth, placed at their natural slots; the full arch only lends its slots (where the missing teeth were)
const arch = DK.arch({ jaw: 'mandible', teeth: PRESENT, build: (fdi, spec) => { spec.roots = spec.roots.map(r => Object.assign({}, r, { len: Math.min(r.len, 4) })); return DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }); } });
const full = DK.arch({ jaw: 'mandible', teeth: [37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47], build: (fdi, spec) => ({ group: new THREE.Group(), layers: {}, spec }) });
const S = full.slots, tooth = fdi => arch.teeth.find(t => t.fdi === fdi);
fig.part(arch.group, { name: 'Your teeth', label: false, info: 'The remaining natural teeth. The ones next to each gap carry the denture.' });
arch.group.updateMatrixWorld(true);
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi}.` }));

// --- gum: the kit's scalloped gum on each run of teeth, and an alveolar ridge (mucosa) under the whole arch, low and rounded
// where the teeth are missing
const runs = [[37], [34, 33, 32, 31, 41, 42, 43, 44], [47]].map(list => {
  const a = DK.arch({ jaw: 'mandible', teeth: list, build: (fdi, spec) => ({ group: new THREE.Group(), layers: {}, spec }) });
  a.group.updateMatrixWorld(true); const g = DK.gingivaArch(a, { height: 4.2 }); return g; });
const ends = q => [[q.c[0] - q.t[0] * (q.md / 2 + 0.6), q.c[1] - q.t[1] * (q.md / 2 + 0.6)]];
const order = [37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47];
const spinePts = [...ends(S[37]), ...order.map(f => S[f].c), ...[[S[47].c[0] - S[47].t[0] * (S[47].md / 2 + 0.6), S[47].c[1] - S[47].t[1] * (S[47].md / 2 + 0.6)]]];
const spine = new THREE.CatmullRomCurve3(spinePts.map(c => V(c[0], 0, c[1])), false, 'centripetal');
const gapW = p => { let d = Infinity; MISSING.forEach(f => { const c = S[f].c; d = Math.min(d, Math.hypot(p.x - c[0], p.z - c[1]) - S[f].md / 2); }); return 1 - sm(-1.5, 1.2, d); };
const CREST = -0.6, BASE = -11;
const ridgeGeo = DK.sweepGeometry(spine, (s, t, f) => {
  const g = gapW(f.P), top = CREST * g + -2.8 * (1 - g), hw = 4.6 + 0.4 * g, H = top - BASE;
  const [a, b] = DK.roundedRect(H / 2, hw, Math.min(2.6, hw - 0.1))(s), y = a + (top + BASE) / 2; return [y, b * (1 + 0.22 * sm(top, BASE, y))];   // flares toward the base like the alveolar process
}, { segments: 260, radial: 48 });
const ridge = new THREE.Mesh(ridgeGeo, DK.mat('gingiva'));
const gum = new THREE.Group(); [ridge, ...runs].forEach(o => gum.add(o));
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum and the alveolar ridge. Where teeth are lost the ridge shrinks into a low, rounded crest.' });
const gapMark = new THREE.Object3D(); gapMark.position.set(S[36].c[0] + S[36].n[0] * 0.5, CREST + 0.3, S[36].c[1] + S[36].n[1] * 0.5); gum.add(gapMark);
fig.part(gapMark, { inPlace: true, name: 'Missing teeth', anchor: [0, 0, 0], dim: false, when: () => !denture.visible, info: 'The gap left by lost teeth: here two on each side.' });

// --- the denture (one piece, world frame of the arch): saddles of pink acrylic with replacement teeth, and the metal frame
const denture = new THREE.Group();
const ACRYLIC = DK.mat('gingiva', { color: 0xd39598, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15 });   // nylon: glossy, a little see-through
ACRYLIC.transparent = true; ACRYLIC.opacity = 0.86;
const METAL = ACRYLIC;
// saddles: a sweep along the arch between the abutments, wrapping the ridge crest with short flanges
const saddle = (from, to) => {
  const pts = [], n = 16, a = S[from], b = S[to];
  const pa = [a.c[0] + a.t[0] * (a.md / 2), a.c[1] + a.t[1] * (a.md / 2)], pb = [b.c[0] - b.t[0] * (b.md / 2), b.c[1] - b.t[1] * (b.md / 2)];
  // follow the spine between the two contact points
  let ta = 0, tb = 0, da = Infinity, db = Infinity; for (let i = 0; i <= 400; i++) { const p = spine.getPointAt(i / 400); const d1 = Math.hypot(p.x - pa[0], p.z - pa[1]), d2 = Math.hypot(p.x - pb[0], p.z - pb[1]); if (d1 < da) { da = d1; ta = i / 400; } if (d2 < db) { db = d2; tb = i / 400; } }
  for (let i = 0; i <= n; i++) pts.push(spine.getPointAt(ta + (tb - ta) * i / n));
  const c = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(DK.sweepGeometry(c, (s, t) => { const e = 0.8 + 0.2 * Math.pow(Math.sin(Math.PI * t), 0.35), [u, v] = DK.roundedRect(2.3, 5.7, 2.2)(s); return [(u - 1.4) * e + 0.9 * (1 - e) * 0, v * e * (1 + 0.12 * Math.max(0, -u) / 2.3)]; }, { segments: 40, radial: 40 }), ACRYLIC);
};
const saddles = [saddle(37, 34), saddle(44, 47)];
saddles.forEach(s => denture.add(s));
// replacement teeth: crowns of 35, 36, 45, 46 at their slots, necks sunk into the acrylic
const fakeTeeth = DK.arch({ jaw: 'mandible', teeth: [37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47], build: (fdi, spec) => MISSING.includes(fdi) ? DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) : { group: new THREE.Group(), layers: {}, spec } });
fakeTeeth.group.position.y = 0.3; denture.add(fakeTeeth.group);
const replacement = fakeTeeth.teeth.filter(t => MISSING.includes(t.fdi));

// nylon clasps: a broad band of the base material wrapping the buccal neck of each abutment, from the saddle round to the far line angle,
// lying over the gum margin (that is why it is gum-coloured), thinning toward its tip. Built in the abutment's tooth frame.
const clasps = {};
Object.keys(ABUT).map(Number).forEach(fdi => {
  const t = tooth(fdi), s = t.spec, g = ABUT[fdi], md = s.md / 2, B = DK.crownSurface(s, 1);
  const pts = [], n = 16;
  pts.push([g * (md + 1.8), 0.6, s.bl / 2 - 1.4]);
  for (let i = 0; i <= n; i++) { const u = i / n, x = g * (md - 0.4) - g * u * (2 * md - 1.6), q = B.at(x, 1.7);
    pts.push([q.p[0] + q.n[0] * 0.6, 1.5, q.p[2] + q.n[2] * 0.6]); }
  const curve = new THREE.CatmullRomCurve3(pts.map(p => t.tooth.group.localToWorld(V(...p))));
  const geo = DK.sweepGeometry(curve, (q, u) => { const k = 1 - 0.45 * Math.pow(u, 1.5), [a, b] = DK.roundedRect(2.1 * k, 0.55, 0.5)(q); return [a, b]; }, { segments: 60, radial: 28 });
  const m = new THREE.Mesh(geo, ACRYLIC); denture.add(m);
  clasps[fdi] = { mesh: m, tip: t.tooth.group.localToWorld(V(...pts[Math.round(n * 0.55)])).toArray() };
});
// lingual flange: a nylon plate against the lingual gum and ridge behind the front teeth, from saddle to saddle (the major connector)
const barPts = [];
for (let i = 0; i <= 60; i++) { const u = 0.15 + 0.7 * i / 60, p = spine.getPointAt(u), tg = spine.getTangentAt(u), nIn = V(-tg.z, 0, tg.x);
  if (nIn.x * (0 - p.x) + nIn.z * (-24 - p.z) < 0) nIn.negate();
  barPts.push(p.clone().addScaledVector(nIn, 5.4).setY(-3.6)); }
const barCurve = new THREE.CatmullRomCurve3(barPts);
const bar = new THREE.Mesh(DK.sweepGeometry(barCurve, s => { const [a, b] = DK.roundedRect(3.3, 0.8, 0.75)(s); return [a, b + 0.35 * a]; }, { segments: 160, radial: 28 }), ACRYLIC);
denture.add(bar);
const BAR_MID = barCurve.getPointAt(0.5).toArray(), BAR_LBL = barCurve.getPointAt(0.74).setY(-0.7).toArray();
fig.part(denture, { name: 'Flexible partial', label: false, explode: [0, 13, 0], fit: false, info: 'One removable appliance in thin flexible nylon: pink base, gum-coloured clasps and replacement teeth, with no metal. It bends to slip over the teeth and comes out for cleaning.' });
const c34 = clasps[34];
fig.part(c34.mesh, { inPlace: true, name: 'Clasp', sub: 'gum-coloured nylon', anchor: c34.tip, accent: true, dim: false, info: 'A soft band of the same nylon that hugs the neck of the tooth and the gum below it. It grips the undercut without a visible metal arm.' });
fig.part(bar, { inPlace: true, name: 'Lingual flange', sub: 'joins both sides', anchor: BAR_LBL, dim: false, info: 'Nylon plate along the gum on the tongue side. It replaces the metal bar of a cast partial and ties the two sides together.' });
fig.part(saddles[0], { inPlace: true, name: 'Nylon base', sub: 'flexes, no metal', anchor: () => { const c = S[35].c; return [c[0] + S[35].n[0] * 4.8, -1.2, c[1] + S[35].n[1] * 4.8]; }, dim: false, info: 'Thin, flexible nylon (polyamide) that rests on the gum and holds the teeth. It has no rests, so the gum carries the bite more than with a metal partial.' });
const r36 = replacement.find(t => t.fdi === 36);
fig.part(r36.tooth.group, { inPlace: true, name: 'Replacement teeth', anchor: [0, r36.spec.crownL * 0.6, r36.spec.bl / 2], dim: false, info: 'Acrylic teeth set in the nylon where 35 and 36 (and 45, 46) were lost.' });

// --- params: the denture appears (seat), the explode lifts it out
fig.param('show', 0, v => { denture.visible = v > 0.5; });
fig.standardControls({ explode: true, explodeLabel: 'Lift out', section: false });
fig.view('Tongue side', { theta: Math.PI - 0.3, phi: 0.72, zoom: 0.66, focus: [BAR_MID[0], -1, BAR_MID[2] - 6], explode: 0, labels: ['Lingual flange'] });
fig.view('From above', { theta: 0.1, phi: 0.36, zoom: 1, focus: 'auto', explode: 0, labels: ['Clasp', 'Lingual flange', 'Nylon base', 'Replacement teeth'] });

// story: the arch with two gaps → the denture comes down and clicks in → push in on a gum-coloured clasp → round to the tongue side for the
// flange → lift it out (one piece) → three-quarter front view with the clasps over the gum (teaching shot)
const C34 = c34.tip, FOC34 = [C34[0], 1.5, C34[2]];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 0.95, zoom: 1, explode: 1, set: { show: 0 }, labels: ['Missing teeth'] },
  { dur: 0, hold: 0, set: { show: 1 } },
  { dur: 2.4, hold: 1.2, explode: 0, theta: 0.6, labels: ['Flexible partial', 'Replacement teeth'] },
  { dur: 2.2, hold: 2.4, zoom: 0.5, focus: FOC34, theta: 0.75, phi: 1.2, labels: ['Clasp'] },
  { dur: 2.6, hold: 2.2, zoom: 0.66, focus: [BAR_MID[0], -1, BAR_MID[2] - 6], theta: Math.PI - 0.3, phi: 0.72, labels: ['Lingual flange'] },
  { dur: 2.4, hold: 1.8, zoom: 1, focus: 'auto', theta: 0.5, phi: 1.0, explode: 0.75, labels: ['Clasp', 'Nylon base', 'Replacement teeth'] },
  { dur: 2.4, hold: 2.8, explode: 0, theta: 0.3, phi: 0.55, zoom: 0.95, labels: ['Clasp', 'Lingual flange', 'Nylon base', 'Replacement teeth'] }   // teaching shot
]);
fig.start();
