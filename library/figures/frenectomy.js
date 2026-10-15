// Procedure: tongue-tie and lip-tie release, in a side view cut through the middle of the mouth (mouth a little open), face to the viewer's left. Frame (this figure only): +x anterior, +y up, z across (the cut is at z = 0 and the camera looks from -z); mm, origin near the lower incisor's cementoenamel junction with the jaw closed.
// poster: step 4
// Built from traced sagittal outlines, each a thin closed slab cut by the section plane: maxilla with the hard palate and the
// mandibular symphysis (cortical shell over cancellous bone), the upper and lower lips and chin, gingiva and alveolar mucosa,
// palatal mucosa, the tongue with the genioglossus fanning from the genial tubercles, the floor of the mouth, and the two frena
// (lingual: tongue to floor of mouth; labial: upper lip to the gum between the upper central incisors). The cut runs through
// 11 and 41 so their crowns and roots read in section. Soft tissue is schematic; sizes are average adult proportions.
const fig = DK.figure({
  fov: 16,
  title: 'Tongue-tie and lip-tie release',
  subtitle: 'Side view, cut through the middle of the mouth. Soft tissue schematic.',
  view: { theta: Math.PI, phi: Math.PI / 2, margin: 0.9 }
});
const V2 = (x, y) => new THREE.Vector2(x, y);
const D2R = Math.PI / 180;
const spline = (pts, n, closed) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), closed, 'centripetal').getSpacedPoints(n).map(v => V2(v.x, v.y));
const ccw = pts => THREE.ShapeUtils.isClockWise(pts) ? pts.slice().reverse() : pts;
const offsetIn = (pts, d) => { const n = pts.length, out = []; for (let i = 0; i < n; i++) { const p = pts[(i - 1 + n) % n], q = pts[(i + 1) % n], t = V2(q.x - p.x, q.y - p.y).normalize(); out.push(V2(pts[i].x - t.y * d, pts[i].y + t.x * d)); } return out; };
const slabGeo = (pts, depth, bevel) => {
  const sh = new THREE.Shape(ccw(pts)), b = bevel ?? 0.5;
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 12 });
  g.translate(0, 0, -depth / 2); g.clearGroups(); g.computeVertexNormals(); return g;
};
const live = (mat) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.set = (pts, depth, bevel) => {
  const g = slabGeo(pts, depth, bevel), d = m.geometry; d.setAttribute('position', g.attributes.position); d.setAttribute('normal', g.attributes.normal);
  if (g.attributes.uv) d.setAttribute('uv', g.attributes.uv); d.setIndex(g.index); d.computeBoundingSphere(); d.computeBoundingBox(); g.dispose(); }; return m; };
const lerpPts = (A, B, k) => A.map((a, i) => [a[0] + (B[i][0] - a[0]) * k, a[1] + (B[i][1] - a[1]) * k]);

// ---------- the lower jaw is drawn closed and turned open about a hinge far behind the frame ----------
const HINGE = [-85, 22], OPEN = -10 * D2R;
const low = p => { const dx = p[0] - HINGE[0], dy = p[1] - HINGE[1], c = Math.cos(OPEN), s = Math.sin(OPEN); return [HINGE[0] + dx * c - dy * s, HINGE[1] + dx * s + dy * c]; };

// ---------- bone ----------
const MAXILLA = [[3.2, 17.9], [2.1, 21], [1.0, 24.5], [0.6, 27.5], [2.6, 30.6], [5.4, 32.2], [2.0, 32.6], [-6, 32.2], [-20, 31.8], [-40, 31.2], [-49, 30.4], [-51, 28.4], [-49, 26.4], [-45, 26.6], [-32, 25.6], [-22, 24.6], [-14, 23.3], [-8.4, 20.8], [-5.4, 18.4], [-2.3, 15.2]];
const SYMPH = [[2.0, -2.3], [1.4, -5.5], [0.0, -9], [-1.4, -12.2], [-0.6, -15.5], [1.6, -19.5], [2.6, -23], [1.6, -26.4], [-2.2, -29.4], [-7, -31], [-11.5, -29.8], [-14, -26.5], [-15.2, -22.5], [-14.2, -19.5], [-12.6, -17.2], [-9.6, -11.5], [-6.6, -5.8], [-4.4, -2.4], [-3.1, -0.6]];
const maxPts = spline(MAXILLA, 260, true), symPts = spline(SYMPH.map(low), 260, true);
const boneMat = DK.mat('bone');
const bones = [maxPts, symPts].map(p => new THREE.Mesh(slabGeo(p, 30, 0.6), boneMat));
const bonesIn = [maxPts, symPts].map(p => new THREE.Mesh(slabGeo(offsetIn(ccw(p), 1.1), 29, 0.3), DK.mat('bone')));
fig.world.add(...bones, ...bonesIn);

// ---------- teeth: 11 (crown down, tilted forward) and 41 (crown up), cut labio-lingually ----------
function placeTooth(t, cej, tiltDeg, upper) {
  const a = tiltDeg * D2R, up = upper ? new THREE.Vector3(-Math.sin(a), Math.cos(a), 0) : new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
  const lab = upper ? new THREE.Vector3(Math.cos(a), Math.sin(a), 0) : new THREE.Vector3(Math.cos(a), -Math.sin(a), 0);
  const yAxis = upper ? up.clone().negate() : up;                 // tooth +y (coronal) points down for 11
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), yAxis, lab); m.setPosition(cej[0], cej[1], 0);
  m.decompose(t.group.position, t.group.quaternion, t.group.scale); fig.world.add(t.group);
}
const t11 = DK.tooth(11), t41 = DK.tooth(41);
placeTooth(t11, [1.27, 15.2], 28, true);
const L_CEJ = low([0, 0]); placeTooth(t41, L_CEJ, 20 + OPEN / D2R, false);

// ---------- gingiva and lining mucosa (thin layers over the bone) ----------
const gumMat = DK.mat('gingiva');
const UGUM = [[4.4, 16.3], [3.9, 18.1], [2.8, 21], [1.7, 24.5], [1.6, 26.4], [0.8, 26.8], [0.0, 24.4], [1.0, 21], [2.1, 18.4], [2.6, 17.0]];        // labial gum and alveolar mucosa of 11 up to the fold of the vestibule
const PGUM = [[-1.5, 13.9], [-2.4, 15.0], [-5.4, 18.4], [-8.4, 20.8], [-14, 23.3], [-22, 24.6], [-32, 25.6], [-45, 26.6], [-49, 26.4], [-50.5, 25.2], [-49, 24.3], [-45, 24.4], [-32, 23.4], [-22, 22.4], [-14.6, 21.2], [-9.2, 19.0], [-6.3, 17.0], [-4.6, 16.4], [-3.2, 14.6]];   // palatal mucosa with the incisive papilla
const LGUM = [[2.3, -0.4], [2.7, -1.9], [1.9, -5.4], [0.6, -8.9], [-0.6, -11.6], [0.4, -12.2], [1.0, -9.2], [2.6, -5.4], [3.3, -2.2], [3.0, -0.5]].map(low);   // labial gum of 41 down to the lower vestibule
const ugum = new THREE.Mesh(slabGeo(spline(UGUM, 120, true), 30, 0.3), gumMat);
const pgum = new THREE.Mesh(slabGeo(spline(PGUM, 160, true), 30, 0.3), gumMat);
const lgum = new THREE.Mesh(slabGeo(spline(LGUM, 120, true), 30, 0.3), gumMat);
fig.world.add(ugum, pgum, lgum);
const SOFTP = [[-48.6, 30.2], [-56, 28.8], [-64, 25.4], [-71, 19.6], [-75.5, 13], [-76.8, 8.4], [-74.6, 7.2], [-71.6, 10.6], [-66.4, 16.2], [-59, 20.8], [-52, 23.4], [-48.6, 24.4]];
const softPal = new THREE.Mesh(slabGeo(spline(SOFTP, 120, true), 30, 0.4), gumMat); fig.world.add(softPal);

// ---------- lips and chin ----------
const lipMat = DK.mat('gingiva', { color: 0xD6B3A6, cap: 0xD1AB9D, roughness: 0.75 });
const FORNIX_U = [1.2, 26.9];
const ULIP = [[1.6, 27.4], [3.0, 32.6], [5, 46], [6, 70], [24, 70], [21, 46], [16, 36], [13.0, 31], [13.6, 28.5], [15.2, 23.5], [16.9, 18.6], [17.7, 14.0], [17.0, 9.6], [14.7, 6.1], [11.4, 4.4], [8.7, 4.6], [7.7, 6.8], [7.2, 10.2], [6.2, 13.8], [5.0, 17.2], [3.6, 21.0], [2.4, 24.6]];
const ULIP_INNER = [[8.7, 4.6], [7.7, 6.8], [7.2, 10.2], [6.2, 13.8], [5.0, 17.2], [3.6, 21.0], [2.4, 24.6], [1.6, 27.0]];   // mucosal surface, lip edge → fold
const ulipHold = new THREE.Group(); ulipHold.position.set(FORNIX_U[0], FORNIX_U[1], 0); fig.world.add(ulipHold);
const ulip = new THREE.Mesh(slabGeo(spline(ULIP, 220, true), 30, 0.5), lipMat); ulip.position.set(-FORNIX_U[0], -FORNIX_U[1], 0); ulipHold.add(ulip);
const LLIP = [[0.2, -11.0], [1.2, -8.4], [2.6, -4.4], [3.6, -0.4], [4.3, 3.6], [4.8, 6.9], [7.2, 7.9], [10.6, 7.2], [13.1, 4.4], [14.0, 0], [12.6, -5.2], [10.0, -10.6], [13.4, -16.0], [14.2, -22.0], [12.0, -29.0], [6, -35.5], [-10, -41], [-40, -49], [-120, -62], [-120, -42], [-40, -37], [-12, -32.4], [-4.2, -31.4], [0.2, -29.6], [3.5, -25.8], [3.8, -21.6], [1.8, -17.2], [0.5, -13.0]];
const llip = new THREE.Mesh(slabGeo(spline(LLIP.map(low), 220, true), 30, 0.5), lipMat);
fig.world.add(llip);

// ---------- floor of the mouth (mucosa and the tissue under it, between the jaw and the genioglossus) ----------
const floorMat = DK.mat('gingiva', { color: 0xD9C2BB, cap: 0xD6BEB6, roughness: 0.8 });
const J = [-15.4, -18.3];   // where the floor of the mouth meets the underside of the tongue (deep end of the frenum)
const FLOOR_TOP = [[-7.6, -13.4], [-8.8, -15.2], [-10.8, -17.1], [-13.0, -18.9], [-14.6, -19.0], J];   // mucosal surface, gum → J
const FLOOR = [...FLOOR_TOP, [-18.5, -24.8], [-21.4, -29.8], [-23.2, -32.6], [-31, -36.4], [-45, -38.4], [-70, -40], [-110, -40], ...[[-110, -58], [-40, -39.5], [-12, -34.5], [-9, -31.5], [-13.6, -26.5], [-14.6, -22.5], [-13.4, -19.2], [-11.4, -15.6]].map(low)];
// the floor outline sits on the opened jaw: the points above are already in the opened frame except the lingual gum, which hugs 41
const floor = new THREE.Mesh(slabGeo(spline(FLOOR, 160, true), 30, 0.3), floorMat);
fig.world.add(floor);

// ---------- tongue: three postures with matching control points (rest, trying to lift while tied, lifted to the palate) ----------
const BACK = [[-18.5, -24.8], [-21.4, -29.8], [-23.2, -32.6], [-31, -36.4], [-45, -38.4], [-70, -40], [-110, -40], [-110, 19], [-75, 19.6], [-66, 19.8]];
const T_REST = { v: [[-3.5, -8.2], [-4.6, -10.4], [-6.8, -12.0], [-9.4, -13.4], [-11.8, -14.8], [-13.8, -16.4], J],
  d: [[-57, 20], [-46, 20.8], [-35, 20], [-24, 17], [-15.5, 10.5], [-9.4, 2.8], [-5.6, -4.2]] };
const T_TIED = { v: [[-5.2, -6.6], [-6.0, -9.6], [-7.7, -11.9], [-9.9, -13.6], [-12.0, -15.0], [-13.9, -16.5], J],
  d: [[-57, 20.6], [-46, 21.6], [-35, 21.6], [-24.5, 19.8], [-16, 15.6], [-10.4, 8.0], [-7.2, -0.6]] };
const T_UP = { v: [[-5.8, 15.4], [-4.6, 13.2], [-4.5, 9.5], [-5.8, 3.5], [-8.2, -3.0], [-11.8, -10.5], J],
  d: [[-57, 20.4], [-47, 21.6], [-37, 22.2], [-27, 21.8], [-18.5, 20.6], [-12, 18.6], [-8.2, 17.0]] };
const tongueMat = DK.mat('gingiva', { color: 0xB98A82, cap: 0xAE7F77, roughness: 0.65 });
const tongue = live(tongueMat); fig.world.add(tongue);
const st = { lift: 0, free: 0, cut: 0, lip: 0, lcut: 0 };
let ventral = null;   // spaced points along the underside of the tongue, tip → J
function tonguePose() {
  const tgt = { v: lerpPts(T_TIED.v, T_UP.v, st.free), d: lerpPts(T_TIED.d, T_UP.d, st.free) };
  const v = lerpPts(T_REST.v, tgt.v, st.lift), d = lerpPts(T_REST.d, tgt.d, st.lift);
  // closed outline: tip → underside → J → genioglossus → base → back → dorsum → tip
  tongue.set(spline([...v, ...BACK, ...d], 320, true), 34, 0.6);
  ventral = spline(v, 80, false);
}

// ---------- the two frena ----------
const frenMat = DK.mat('gingiva', { color: 0xF4E4DD, cap: 0xF4E4DD, roughness: 0.85 });
const lingual = live(frenMat), labial = live(frenMat);
fig.world.add(lingual, labial);
// lingual frenum: a web between the underside of the tongue (from the attachment back to J) and the floor of the mouth (J forward
// to its attachment), with a concave free edge. Tongue-tie: attached near the tip and to the gum behind 41. Released: both ends
// sit much deeper, so the tongue tip is free.
const floorCurve = spline(FLOOR_TOP.slice().reverse(), 60, false);   // J → gum
function lingualPose() {
  const k = st.cut, uTongue = 0.10 + 0.55 * k, uFloor = 0.86 - 0.5 * k;
  const iT = Math.round(uTongue * (ventral.length - 1)), iF = Math.round(uFloor * (floorCurve.length - 1));
  const top = ventral.slice(iT), bot = floorCurve.slice(1, iF + 1);
  const a = top[0], b = bot[bot.length - 1], mid = V2((a.x + b.x) / 2, (a.y + b.y) / 2), dir = V2(b.x - a.x, b.y - a.y), len = dir.length();
  const n = V2(-dir.y, dir.x).normalize(), sag = Math.min(1.2, len * 0.12);   // free edge bows in toward J
  const toJ = V2(J[0] - mid.x, J[1] - mid.y); if (n.dot(toJ) < 0) n.multiplyScalar(-1);
  const edge = spline([[b.x, b.y], [mid.x + n.x * sag, mid.y + n.y * sag], [a.x, a.y]], 24, false).slice(1, -1);
  lingual.set([...top, ...bot, ...edge], 1.4, 0.2);
}
// labial frenum: from the fold of the vestibule down between the lip and the gum. Lip-tie: it reaches the gum margin between the
// upper central incisors. Released: it ends high on the lining mucosa.
const gumSurf = spline([[1.2, 26.9], [1.7, 24.5], [2.8, 21], [3.9, 18.1], [4.4, 16.3]], 60, false);   // fold → gum margin of 11
const rotL = (p, a) => { const dx = p[0] - FORNIX_U[0], dy = p[1] - FORNIX_U[1], c = Math.cos(a), s = Math.sin(a); return [FORNIX_U[0] + dx * c - dy * s, FORNIX_U[1] + dx * s + dy * c]; };
function labialPose() {
  const a = st.lip * 30 * D2R;
  const lipIn = spline(ULIP_INNER.slice().reverse().map(p => rotL(p, a)), 60, false);   // fold → lip edge
  const k = st.lcut, uGum = 0.92 - 0.6 * k, uLip = 0.62 - 0.42 * k;
  const g = gumSurf.slice(0, Math.round(uGum * 59) + 1), l = lipIn.slice(1, Math.round(uLip * 59) + 1);
  const ge = g[g.length - 1], le = l[l.length - 1], mid = V2((ge.x + le.x) / 2, (ge.y + le.y) / 2);
  const edge = spline([[le.x, le.y], [mid.x - 0.2, mid.y + 0.9], [ge.x, ge.y]], 20, false).slice(1, -1);
  labial.set([...g.reverse(), ...l, ...edge].reverse(), 1.4, 0.2);
  ulipHold.rotation.z = a;
}

// ---------- scissors (two blades that close on the frenum), drawn just in front of the cut ----------
const steel = DK.mat('steel');
function bladeGeo(flip) {
  const pts = [[0, 0], [5, 0.25 * flip], [12, 0.9 * flip], [24, 1.4 * flip], [26, 0.2 * flip], [12, -0.25 * flip], [4, -0.35 * flip]].map(p => V2(p[0], p[1]));
  return slabGeo(pts, 0.5, 0.12);
}
const scissors = new THREE.Group(), bladeA = new THREE.Mesh(bladeGeo(1), steel), bladeB = new THREE.Mesh(bladeGeo(-1), steel);
scissors.add(bladeA, bladeB); scissors.position.z = -1.6; scissors.visible = false; fig.world.add(scissors);
// tip of the blades at a target point, handles out through the open mouth (toward +x, a little down)
function placeScissors(tip, ang, open) {
  scissors.position.set(tip[0], tip[1], -1.6); scissors.rotation.z = ang;
  bladeA.rotation.z = open * 0.22; bladeB.rotation.z = -open * 0.22;
}

// ---------- params ----------
const refresh = () => { tonguePose(); lingualPose(); labialPose(); };
fig.param('lift', 0, v => { st.lift = v; refresh(); });
fig.param('free', 0, v => { st.free = v; refresh(); });
fig.param('cut', 0, v => { st.cut = v; refresh(); });
fig.param('lip', 0, v => { st.lip = v; refresh(); });
fig.param('lcut', 0, v => { st.lcut = v; refresh(); });
const SC_L = { tip: [-8.6, -13.2], ang: 48 * D2R };
fig.param('sc', -1, k => {   // lingual snip: -1 parked, 0 open at the frenum, 1 closed
  scissors.visible = k > -0.99; if (!scissors.visible) return;
  const out = Math.max(0, -k) * 30, open = 1 - DK.util.clamp(k, 0, 1);
  placeScissors([SC_L.tip[0] + out * Math.cos(SC_L.ang), SC_L.tip[1] + out * Math.sin(SC_L.ang)], SC_L.ang, open);
});
const SC_U = { tip: [3.4, 21.0], ang: -62 * D2R };
fig.param('scu', -1, k => {
  if (k <= -0.99) { if (st.scu) scissors.visible = false; st.scu = false; return; }
  st.scu = true; scissors.visible = true;
  const out = Math.max(0, -k) * 30, open = 1 - DK.util.clamp(k, 0, 1);
  placeScissors([SC_U.tip[0] + out * Math.cos(SC_U.ang), SC_U.tip[1] + out * Math.sin(SC_U.ang)], SC_U.ang, open);
});
refresh();

// ---------- labels ----------
const frame = new THREE.Mesh(new THREE.BoxGeometry(62, 46, 4), new THREE.MeshBasicMaterial({ visible: false })); frame.position.set(-11, -3, 0);
fig.part(frame, { name: 'frame', label: false });
fig.part(tongue, { inPlace: true, name: 'Tongue', anchor: [-34, 6, -0.2], labelOffset: [-40, -90], dim: false,
  info: 'A muscle that needs to lift, push forward and sweep the mouth for feeding, swallowing and speech.' });
fig.part(lingual, { inPlace: true, name: 'Tongue-tie', sub: 'short frenum near the tip', accent: true, dim: false, when: () => st.cut < 0.5,
  anchor: () => { const p = lingual.geometry.boundingBox; return p ? [(p.min.x + p.max.x) / 2, (p.min.y + p.max.y) / 2, -0.75] : [-9, -14, 0]; }, labelOffset: [-70, 90],
  info: 'The lingual frenum is the fold of tissue under the tongue. When it is short or attached near the tip, it holds the tip down.' });
fig.part(lingual, { inPlace: true, name: 'Released', sub: 'tip free to lift', accent: true, dim: false, when: () => st.cut >= 0.5,
  anchor: () => { const p = ventral[Math.round(0.35 * (ventral.length - 1))]; return [p.x, p.y, -0.75]; }, labelOffset: [-60, 90],
  info: 'After the snip the fold is shorter and attached further back, so the tip of the tongue can reach the roof of the mouth.' });
fig.part(labial, { inPlace: true, name: 'Lip-tie', sub: 'frenum down to the gum', dim: false, when: () => st.lcut < 0.5,
  anchor: () => { const p = labial.geometry.boundingBox; return p ? [(p.min.x + p.max.x) / 2, (p.min.y + p.max.y) / 2 - 1, -0.75] : [3, 20, 0]; }, labelOffset: [-60, -90],
  info: 'The upper labial frenum joins the lip to the gum. A lip-tie reaches down to the gum between the front teeth and can stop the lip lifting.' });
fig.part(labial, { inPlace: true, name: 'Lip released', dim: false, when: () => st.lcut >= 0.5,
  anchor: () => { const p = labial.geometry.boundingBox; return p ? [(p.min.x + p.max.x) / 2, p.min.y + 0.6, -0.75] : [3, 22, 0]; }, labelOffset: [-60, -90],
  info: 'Released, the fold ends high in the gum-lip groove and the lip moves freely.' });
fig.part(floor, { inPlace: true, name: 'Floor of mouth', anchor: [-17.5, -23.5, -0.2], labelOffset: [60, 80], dim: false,
  info: 'The soft floor under the tongue; the lingual frenum rises from it in the midline.' });
fig.part(ulip, { inPlace: true, name: 'Upper lip', anchor: [12.5, 20, -0.2], labelOffset: [-70, 70], dim: false, info: 'The upper lip; its frenum runs up to the groove between lip and gum.' });
fig.part(t11.group, { inPlace: true, name: 'Upper front tooth', label: false, info: 'Upper right central incisor, FDI 11 (Universal 8), cut through its middle.' });
fig.part(t41.group, { inPlace: true, name: 'Lower front tooth', label: false, info: 'Lower right central incisor, FDI 41 (Universal 25), cut through its middle.' });

// ---------- section: sagittal (the half toward the camera is removed) ----------
fig.enableSection([0, 0, -1], [
  { objects: [ulip, llip], color: 0xD1AB9D, kind: 'gingiva' },
  { objects: [floor], color: 0xD6BEB6, kind: 'gingiva' },
  { objects: [tongue], color: 0xAE7F77, kind: 'gingiva' },
  { objects: [lingual, labial], color: 0xF4E4DD, kind: 'plain' },
  { objects: [ugum, pgum, lgum, softPal], color: DK.COLORS.gingivaCap },
  { objects: bones, color: 0xC4B393, kind: 'cortical' },
  { objects: bonesIn, color: 0xDDCFB3, kind: 'cortical' },
  { objects: [t11.layers.enamel, t41.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t11.layers.root, t11.layers.dentin, t41.layers.root, t41.layers.dentin], color: DK.COLORS.dentinCap },
  { objects: [t11.layers.pulp, t41.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: false });

// ---------- procedure ----------
const HERO = { theta: Math.PI, phi: Math.PI / 2, zoom: 1, fov: 16, focus: 'auto' };
const TONGUE = { theta: Math.PI, phi: Math.PI / 2, zoom: 0.5, fov: 16, focus: [-9, -9, 0] };
const LIP = { theta: Math.PI, phi: Math.PI / 2, zoom: 0.55, fov: 16, focus: [2, 18, 0] };
fig.procedure([
  { label: 'Tongue-tie', caption: 'A short frenum ties the tip of the tongue to the floor of the mouth.', beats: [
    { dur: 0, hold: 1.2, theta: Math.PI + 0.5, phi: 1.35, zoom: 1.15, fov: 22, section: true, offset: 0, set: { lift: 0, free: 0, cut: 0, lip: 0, lcut: 0, sc: -1, scu: -1 }, labels: ['Tongue', 'Upper lip'] },
    Object.assign({ dur: 2.4, hold: 1.8, labels: ['Tongue', 'Tongue-tie', 'Lip-tie', 'Floor of mouth'], key: true }, HERO)] },
  { label: 'Tip held down', caption: 'When the tongue tries to lift, the frenum holds its tip down.', beats: [
    Object.assign({ dur: 1.8, hold: 0.2, labels: ['Tongue-tie'] }, TONGUE),
    { dur: 2.2, hold: 1.6, set: { lift: 1 }, labels: ['Tongue-tie'], key: true },
    { dur: 1.4, hold: 0.2, set: { lift: 0 }, labels: ['Tongue-tie'] }] },
  { label: 'Snip', caption: 'The thin frenum is snipped close to the floor of the mouth.', beats: [
    { dur: 1.2, hold: 0.1, set: { sc: 0 }, labels: ['Tongue-tie'] },
    { dur: 1.6, hold: 0.6, set: { sc: 1, cut: 1 }, labels: ['Released'], key: true },
    { dur: 0.9, hold: 0.1, set: { sc: -0.98 }, labels: ['Released'] },
    { dur: 0, hold: 0, set: { sc: -1 } }] },
  { label: 'Tongue lifts', caption: 'Released, the tip of the tongue can reach the roof of the mouth.', beats: [
    { dur: 0, hold: 0, set: { free: 1 } },
    Object.assign({ dur: 2.6, hold: 2.0, set: { lift: 1 }, labels: ['Released', 'Tongue'], key: true }, { theta: Math.PI, phi: Math.PI / 2, zoom: 0.85, fov: 16, focus: [-8, 2, 0] })] },
  { label: 'Lip-tie', caption: 'A lip-tie runs down to the gum between the front teeth.', beats: [
    Object.assign({ dur: 2.0, hold: 0.2, set: { lift: 0 }, labels: ['Lip-tie'] }, LIP),
    { dur: 1.8, hold: 1.4, set: { lip: 0.5 }, labels: ['Lip-tie', 'Upper lip'], key: true }] },
  { label: 'Lip freed', caption: 'Releasing it lets the lip lift freely.', beats: [
    { dur: 1.0, hold: 0.1, set: { scu: 0 }, labels: [] },
    { dur: 1.4, hold: 0.4, set: { scu: 1, lcut: 1 }, labels: ['Lip released'] },
    { dur: 0.9, hold: 0.1, set: { scu: -0.98 }, labels: ['Lip released'] },
    { dur: 0, hold: 0, set: { scu: -1 } },
    Object.assign({ dur: 2.2, hold: 2.2, set: { lip: 1 }, labels: ['Lip released', 'Upper lip', 'Released', 'Tongue'], key: true }, HERO)] }
]);
fig.view('Side view', HERO);
fig.start();
