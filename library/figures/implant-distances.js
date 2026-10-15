// Library: the three implant safety distances, implants replacing the lower left first and second molars (FDI 36, 37) next to 35, seen in a mesio-distal cut like a CBCT slice.
// poster: end
// Each implant carries a 1.5 mm safety sleeve (tinted on the cut): a sleeve must not touch a root (1.5 mm to a tooth) or the next sleeve
// (1.5 + 1.5 = 3 mm between implants); the canal carries a 2 mm zone the apex must stay out of. Frame: +x = mesial, +z = buccal, CEJ y = 0, mm.
const CREST = -1.8, GUM_Y = 1.1;
const TO_TOOTH = 1.5, BETWEEN = 3.0, TO_CANAL = 2.0;            // dental-facts.md §7
const s35 = DK.toothPreset(35), s36 = DK.toothPreset(36), s37 = DK.toothPreset(37);
const X35 = s36.md / 2 + s35.md / 2, XA = 0, XB = -(s36.md / 2 + s37.md / 2);   // 36 and 37 sites, contact-to-contact spacing
const IA = { diameter: 4.1, length: 10 }, IB = { diameter: 4.1, length: 8 };     // the canal rises distally, so the 37 implant is shorter
const CANAL_R = 1.25;

const fig = DK.figure({
  fov: 26,
  title: 'Implant safety distances',
  subtitle: 'Implants at 36 and 37 (FDI), next to tooth 35. Mesio-distal cut.',
  view: { theta: 0, phi: 1.5, margin: 0.92 }
});
const tint = fig.dark ? 0x4a6884 : 0xa9bccd;                      // the safety zones: a quiet tint of the accent

// ---------------- canal: rises toward the ramus (distal, -x) ----------------
const canalCurve = new THREE.CatmullRomCurve3([[18.5, -18.5], [9, -17.7], [0, -15.8], [-10.75, -13.7], [-21.5, -12.4]].map(p => new THREE.Vector3(p[0], p[1], -0.3)));
const canalPts = canalCurve.getSpacedPoints(120);
const canalY = x => { for (let i = 1; i < canalPts.length; i++) { const a = canalPts[i - 1], b = canalPts[i]; if ((a.x - x) * (b.x - x) <= 0) return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); } return canalPts[0].y; };
const P = canalPts.map(p => p.toArray());
const lumen = DK.tube(P, CANAL_R, DK.mat('pdl', { color: 0xf0dcc4, cap: 0xf0dcc4 }), { caps: false });
const nerve = DK.tube(P.map(p => [p[0], p[1] - 0.15, p[2]]), 0.7, DK.mat('nerve'), { caps: false });
const canal = new THREE.Group(); canal.add(lumen, nerve);

// ---------------- bone, gum, tooth 35 ----------------
const bone = DK.bone({ width: 40, height: 22.5, depth: 11, cortical: 1.2, crest: 1.6 }); bone.position.set(-1.5, CREST, 0);
const gum = DK.gingiva({ width: 40, height: 3.4, depth: 11.6, crest: 1.4, around: [
  { x: X35 + 1.5, z: 0, md: s35.mdC, bl: s35.blC, rise: 0.8 }, { x: XA + 1.5, z: 0, md: 5.6, bl: 5.6, rise: 0.6 }, { x: XB + 1.5, z: 0, md: 5.6, bl: 5.6, rise: 0.6 }] });
gum.position.set(-1.5, GUM_Y, 0);
const t35 = DK.tooth(35); t35.group.position.x = X35;

// ---------------- the two implants, each restored with abutment and crown ----------------
const site = (x, I, fdi) => {
  const g = new THREE.Group(); g.position.x = x;
  const imp = DK.implant({ diameter: I.diameter, length: I.length, connection: 'internal hex' }); imp.position.y = CREST;
  const abut = DK.abutment({ platform: I.diameter, collarHeight: 2.0, postHeight: 3.5, emergence: 5.6 }); abut.position.y = CREST;
  const crown = DK.restorationCrown(fdi, 'zirconia', { hollow: false }); crown.position.y = 0.2;
  g.add(imp, abut, crown); g.userData = { imp, crown };
  return g;
};
const A = site(XA, IA, 36), B = site(XB, IB, 37);

// ---------------- safety zones: exist only on the cut face ----------------
const zoneMat = () => { const m = DK.mat('pdl', { color: tint, cap: tint }); return m; };
const sleeve = (x, I) => {   // a 1.5 mm ring around the implant from the crest to the apex (closed solid)
  const R = I.diameter / 2, y0 = CREST - I.length + 0.6, y1 = CREST - 0.05;
  const m = DK.lathe([[R - 0.05, y0], [R + TO_TOOTH, y0], [R + TO_TOOTH, y1], [R - 0.05, y1], [R - 0.05, y0]], 64, zoneMat());
  m.position.x = x; return m;
};
const zA = sleeve(XA, IA), zB = sleeve(XB, IB);
const zCanal = DK.tube(P, CANAL_R + TO_CANAL, zoneMat(), { caps: false });   // ends flush with the bone faces
[zA, zB, zCanal].forEach(m => { m.userData.cutOnly = true; fig.world.add(m); });

// ---------------- distances, from the same constants ----------------
const R35 = t35.spec.roots[0];
const to35 = (X35 + R35.x - R35.ra) - (XA + IA.diameter / 2);                // at the crest, where the 35 root is widest
const between = (XA - IA.diameter / 2) - (XB + IB.diameter / 2);
const clearA = (CREST - IA.length) - (canalY(XA) + CANAL_R), clearB = (CREST - IB.length) - (canalY(XB) + CANAL_R);
const clear = Math.min(clearA, clearB);

// ---------------- parts ----------------
const onCut = (e, sec) => sec.enabled;
const cz = sec => (sec.enabled ? sec.offset : 0) + 0.1;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jaw bone: a cortical shell over spongy bone.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth and the implant abutments.' });
fig.part(canal, { name: 'Nerve canal', sub: 'inferior alveolar', anchor: [-16, canalY(-16) - 0.6, 0], dim: false, info: 'The inferior alveolar canal carries the nerve to the lower teeth, lip and chin. An implant touching it can numb the lip.' });
fig.part(t35.group, { name: '35', sub: 'natural tooth', anchor: [0, s35.crownL + 0.6, 0], info: 'Lower left second premolar (FDI 35, Universal 20). Its root and ligament need room: keep an implant at least 1.5 mm away.' });
fig.part(A, { name: 'Implant 36', sub: `Ø${IA.diameter} × ${IA.length} mm`, anchor: [0, s36.crownL + 0.8, 0], info: 'Implant replacing the lower left first molar.' });
fig.part(B, { name: 'Implant 37', sub: `Ø${IB.diameter} × ${IB.length} mm, shorter`, anchor: [0, s37.crownL + 0.8, 0], info: 'Implant replacing the lower left second molar. The canal is higher here, so the implant is shorter to keep its distance.' });
fig.part(zA, { inPlace: true, name: '≥ 1.5 mm to a tooth', sub: `here ${DK.mm(to35)}`, dim: false, when: onCut,
  anchor: (e, sec) => [IA.diameter / 2 + TO_TOOTH * 0.5, CREST - 3.2, cz(sec)], labelOffset: [210, 70],
  info: 'At least 1.5 mm of bone between an implant and a neighbouring root, so neither the root nor its ligament is damaged and the bone between them survives.' });
fig.part(zB, { inPlace: true, name: '≥ 3 mm between implants', sub: `here ${DK.mm(between)}`, dim: false, when: onCut,
  anchor: (e, sec) => [(XA - XB) / 2, CREST - 3.2, cz(sec)], labelOffset: [-30, -270],
  info: 'Two 1.5 mm sleeves that must not overlap: at least 3 mm of bone between implants (Tarnow 2000) keeps the crest and the papilla between them.' });
fig.part(zCanal, { inPlace: true, name: '≥ 2 mm above the canal', sub: `here ${DK.mm(clear)}`, dim: false, when: onCut,
  anchor: (e, sec) => [XA + 4.2, canalY(XA + 4.2) + CANAL_R + TO_CANAL * 0.5, cz(sec)], labelOffset: [140, 50],
  info: 'The conventional safety margin between the implant tip and the nerve canal is about 2 mm, measured on a CBCT before drilling.' });

// ---------------- section: mesio-distal through the implant axes ----------------
const ZG = { color: tint, kind: 'plain' };
fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  Object.assign({ objects: [zCanal] }, ZG),
  Object.assign({ objects: [zA, zB] }, ZG),
  { objects: [lumen], color: 0xf0dcc4 }, { objects: [nerve], color: DK.COLORS.nerve },
  { objects: [t35.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t35.layers.root, t35.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t35.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [A.userData.crown, B.userData.crown], color: DK.COLORS.zirconiaCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, 4], offset: 0 } });
fig.xrayToggle([bone, gum], 'X-ray', false);
const tag = (v, min) => ({ v: DK.mm(v) + (v >= min ? ' ✓' : ' ⚠'), cls: v >= min ? 'ok' : 'warn' });
fig.setReadout([
  Object.assign({ k: 'To 35 root (≥ 1.5)' }, tag(to35, TO_TOOTH)),
  Object.assign({ k: 'Between implants (≥ 3)' }, tag(between, BETWEEN)),
  Object.assign({ k: 'Implant tip to canal (≥ 2)' }, tag(clear, TO_CANAL))
]);

// ---------------- story ----------------
const RULES = ['≥ 1.5 mm to a tooth', '≥ 3 mm between implants', '≥ 2 mm above the canal'];
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.6, phi: 1.22, zoom: 1.05, section: false, xray: 0.8, labels: ['35', 'Implant 36', 'Implant 37'], caption: 'Two implants replace the lower first and second molars, next to tooth 35.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: 0, phi: 1.5, zoom: 1, xray: 0, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.4, offset: 0, labels: ['35', 'Nerve canal'], caption: 'Cut through the implants, like a CBCT slice: the neighbour root and the nerve canal.' },
  { dur: 2.0, hold: 2.2, zoom: 0.72, focus: [X35 / 2, -6, 0], theta: 0.06, labels: ['≥ 1.5 mm to a tooth'], caption: 'At least 1.5 mm of bone to the neighbouring root.' },
  { dur: 2.0, hold: 2.2, zoom: 0.72, focus: [(XA + XB) / 2, -5, 0], theta: -0.06, labels: ['≥ 3 mm between implants'], caption: 'At least 3 mm between two implants.' },
  { dur: 2.0, hold: 2.2, zoom: 0.72, focus: [XA - 3, -11.5, 0], theta: 0, labels: ['≥ 2 mm above the canal', 'Nerve canal'], caption: 'About 2 mm between the implant tip and the nerve canal.' },
  { dur: 2.2, hold: 2.6, zoom: 1, focus: 'auto', theta: 0, phi: 1.5, drift: 0, labels: RULES.concat(['35', 'Nerve canal']) }
]);
fig.start();
