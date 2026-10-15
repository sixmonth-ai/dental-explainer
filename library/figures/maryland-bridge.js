// Story: a resin-bonded (Maryland) bridge replacing the missing upper right lateral incisor (FDI 12 = Universal 7): a tooth-coloured
// false tooth held by two thin metal wings bonded to the palatal enamel of 11 and 13. Crown up (model convention), the three
// teeth as a straight segment. Frame: +x = mesial (toward the midline) for all three, +z = labial, CEJ at y = 0. Sizes in mm.
// poster: end
// The pontic is DK.pontic over a healed ridge; each wing is a hand-built plate draped on the abutment's palatal surface
// (DK.crownSurface), WING mm thick; DK.connector bars join them. A labio-palatal cut through 11 shows the wing on the enamel.
const WING = 0.7;                   // metal wing thickness, classic 0.5–0.7 mm (dental-facts.md §18)
const CONN = { h: 3.0, w: 2.0 };    // connector at least about 3 mm high × 2 mm (§18, Kern 2023)
const s11 = DK.toothPreset(11), s12 = DK.toothPreset(12), s13 = DK.toothPreset(13);
const X11 = 0, X12 = -(s11.md / 2 + s12.md / 2), X13 = X12 - (s12.md / 2 + s13.md / 2);
const MID = (X11 + X13) / 2;
const CREST = -1.8, GUM_Y = 1.0, DIP = 1.4;   // healed ridge under the lost tooth, about 1.4 mm lower
const dip = x => -DIP * Math.exp(-Math.pow((x - X12) / 3.4, 2));
const GUM = { width: 31, height: 3.2, depth: 9.5, crest: 1.2 };
const ridgeY = z => GUM_Y + dip(X12) - GUM.crest * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(z / (GUM.depth * 0.45), 2)))) - 0.1;
const CUT = X11 - 2.2;              // labio-palatal cut through the distal half of 11 and its wing

const fig = DK.figure({
  fov: 30,
  title: 'Maryland bridge',
  subtitle: 'Replaces FDI 12 (Universal 7), upper right lateral incisor. Crown up.',
  view: { theta: 0.3, phi: 1.3, margin: 0.9 }
});

// --- context: bone and gum along the segment, the ridge healed where 12 was lost
const bone = DK.bone({ width: GUM.width, height: 17, depth: 9, cortical: 1.0, crest: 1.4, scallop: (x, z) => dip(x + MID) }); bone.position.set(MID, CREST - 1.2, 0);
const gum = DK.gingiva(Object.assign({ scallop: (x, z) => dip(x + MID), around: [{ x: X11 - MID, z: 0, md: s11.mdC, bl: s11.blC, rise: 0.8 }, { x: X13 - MID, z: 0, md: s13.mdC, bl: s13.blC, rise: 0.8 }] }, GUM));
gum.position.set(MID, GUM_Y - 1.0, 0);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Upper jaw bone (shown crown up).' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum, and the healed ridge where 12 was lost.' });

// --- the neighbours: real teeth (enamel, dentin, pulp)
const t11 = DK.tooth(s11), t13 = DK.tooth(s13);
t11.group.position.x = X11; t13.group.position.x = X13;
fig.part(t11.group, { name: 'Central 11', sub: 'barely touched', anchor: [-0.5, s11.crownL - 1.2, -0.6], info: 'Upper right central incisor. Its palatal enamel is only cleaned and roughened for bonding: little or no drilling.' });
fig.part(t13.group, { name: 'Canine 13', anchor: [0.6, s13.crownL - 1.6, -0.8], info: 'Upper right canine, the other neighbour.' });
fig.part(t11.layers.enamel, { inPlace: true, name: 'Enamel', anchor: () => [CUT - X11 + 0.15, s11.crownL * 0.62, s11.bl / 2 - 0.45], dim: false, when: (e, sec) => sec.enabled, info: 'The wing is glued to enamel, which bonds best. The tooth underneath stays whole.' });

// --- a closed plate between two grids (inner on the tooth, outer WING mm out), faces oriented outward
function plate(rows, cols, at) {
  const G = []; for (let i = 0; i <= rows; i++) { G.push([]); for (let j = 0; j <= cols; j++) G[i].push(at(i, j)); }
  const pos = [], idx = [], V = (i, j, s) => (s * (rows + 1) + i) * (cols + 1) + j;
  for (let s = 0; s < 2; s++) for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) pos.push(...G[i][j][s]);
  const P = k => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const tri = (a, b, c, ref) => { const n = new THREE.Vector3().crossVectors(P(b).sub(P(a)), P(c).sub(P(a))); if (n.dot(ref) >= 0) idx.push(a, b, c); else idx.push(a, c, b); };
  const quad = (a, b, c, d, ref) => { tri(a, b, c, ref); tri(a, c, d, ref); };
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const n = new THREE.Vector3(...G[i][j][2]);
    quad(V(i, j, 1), V(i + 1, j, 1), V(i + 1, j + 1, 1), V(i, j + 1, 1), n);
    quad(V(i, j, 0), V(i + 1, j, 0), V(i + 1, j + 1, 0), V(i, j + 1, 0), n.clone().negate());
  }
  const out = (a, b) => P(a).sub(P(b));
  for (let i = 0; i < rows; i++) {
    quad(V(i, 0, 0), V(i + 1, 0, 0), V(i + 1, 0, 1), V(i, 0, 1), out(V(i, 0, 0), V(i, 1, 0)));
    quad(V(i, cols, 0), V(i + 1, cols, 0), V(i + 1, cols, 1), V(i, cols, 1), out(V(i, cols, 0), V(i, cols - 1, 0)));
  }
  for (let j = 0; j < cols; j++) {
    quad(V(0, j, 0), V(0, j + 1, 0), V(0, j + 1, 1), V(0, j, 1), out(V(0, j, 0), V(1, j, 0)));
    quad(V(rows, j, 0), V(rows, j + 1, 0), V(rows, j + 1, 1), V(rows, j, 1), out(V(rows, j, 0), V(rows - 1, j, 0)));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const lerpN = (a, b, t) => a + (b - a) * t;
// wing on an abutment's palatal surface (tooth frame): from 1.5 mm above the CEJ to about 2 mm short of the edge, from the
// gap-side marginal ridge across about two thirds of the palatal face, corners rounded
function wing(spec, side) {   // side: +1 if the gap is mesial (+x), −1 if distal
  const L = DK.crownSurface(spec, -1), y0 = 1.5, y1 = spec.crownL - 2.2, hw = spec.mdC / 2;
  const xa = side * hw * 0.95, xb = -side * hw * 0.3, R = 22, C = 26;
  return plate(R, C, (i, j) => {
    const v = i / R, u = j / C, e = Math.abs(v * 2 - 1), k = e > 0.55 ? Math.sqrt(Math.max(0, 1 - ((e - 0.55) / 0.45) ** 2)) : 1;
    const xm = (xa + xb) / 2, x = xm + (lerpN(xb, xa, u) - xm) * Math.max(0.35, k), q = L.at(x, lerpN(y0, y1, v)), n = q.n;
    return [[q.p[0] + n[0] * 0.02, q.p[1] + n[1] * 0.02, q.p[2] + n[2] * 0.02], [q.p[0] + n[0] * WING, q.p[1] + n[1] * WING, q.p[2] + n[2] * WING], n];
  });
}

// --- the bridge: tooth-coloured pontic, metal wings and connectors, one piece
const METAL = DK.mat('steel', { color: 0xaeb0ac, roughness: 0.38, metalness: 0.7 });
const bridge = new THREE.Group(); bridge.name = 'Bridge';
const pontic = DK.pontic(s12, { design: 'modified ridge lap', ridgeY }, 'ceramic'); pontic.position.x = X12; bridge.add(pontic);
const w11 = new THREE.Mesh(wing(s11, -1), METAL); w11.position.x = X11; bridge.add(w11);   // the gap is distal of 11
const w13 = new THREE.Mesh(wing(s13, +1), METAL); w13.position.x = X13; bridge.add(w13);   // and mesial of 13
const YC = 4.6;
const edge = (spec, X, side) => { const q = DK.crownSurface(spec, -1).at(side * spec.mdC / 2 * 0.8, YC); return [X + q.p[0], q.p[2] + q.n[2] * WING * 0.6]; };
const e11 = edge(s11, X11, -1), e13 = edge(s13, X13, +1);
const ZP = -s12.bl / 2 + 1.2;   // palatal side of the pontic
const c11 = DK.connector(X12 + s12.md / 2 - 1.2, e11[0] + 0.6, YC, (e11[1] + ZP) / 2, CONN.h, CONN.w, 'ceramic'); c11.material = METAL; bridge.add(c11);
const c13 = DK.connector(e13[0] - 0.6, X12 - s12.md / 2 + 1.2, YC, (e13[1] + ZP) / 2, CONN.h, CONN.w, 'ceramic'); c13.material = METAL; bridge.add(c13);
// the pontic's palatal side carries a thin metal backing that joins the two connectors (as in a cast framework)

fig.part(bridge, { name: 'Bridge', label: false, explode: [0, 2, -9], info: 'One piece: a tooth-coloured false tooth on a metal framework with two wings.' });
fig.part(pontic, { inPlace: true, name: 'False tooth', sub: 'no root', anchor: [0, s12.crownL - 2.0, -s12.bl / 2 + 1.0], dim: false, info: 'The pontic replaces the missing lateral incisor. It rests lightly on the gum and has no root.' });
fig.part(w11, { inPlace: true, name: 'Wing', sub: `about ${WING} mm, glued on`, accent: true, anchor: () => { const q = DK.crownSurface(s11, -1).at(-s11.mdC * 0.12, s11.crownL * 0.45); return [q.p[0] + q.n[0] * WING, q.p[1], q.p[2] + q.n[2] * WING]; }, dim: false, info: 'A thin metal wing bonded to the back of the neighbour with resin cement. Only the enamel is roughened. One-wing designs on a single neighbour are also used and debond less often.' });
fig.part(w13, { inPlace: true, name: 'Wing on 13', label: false, info: 'The second wing, on the back of the canine.' });
fig.part(c11, { inPlace: true, name: 'Connector', anchor: [(X12 + e11[0]) / 2 + 1, YC + CONN.h / 2, (e11[1] + ZP) / 2], dim: false, info: 'Joins the false tooth to a wing. It has to be tall enough not to bend or break: about 3 mm high and 2 mm wide.' });
fig.part(c13, { inPlace: true, name: 'Connector 13', label: false, info: 'Joins the false tooth to the canine wing.' });

fig.enableSection([1, 0, 0], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [pontic], color: DK.COLORS.ceramicCap },
  { objects: [t11.layers.enamel, t13.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t11.layers.dentin, t11.layers.root, t13.layers.dentin, t13.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t11.layers.pulp, t13.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [w11, w13, c11, c13], color: 0x8e908c, kind: 'metal' }
]);
fig.standardControls({ explodeLabel: 'Lift off', section: { label: 'Cut', range: [X13 - 4, X11 + 4], offset: CUT } });
const FRONT = { theta: 0.3, phi: 1.3 }, BACK = { theta: Math.PI, phi: 1.22 };
fig.view('Front', Object.assign({ explode: 0, section: false, zoom: 0.66, focus: [MID, 4.6, 0], labels: ['False tooth', 'Central 11', 'Canine 13'] }, FRONT));
fig.view('Back', Object.assign({ explode: 0, section: false, zoom: 0.9, focus: [MID, 4.5, 0], labels: ['Wing', 'Connector', 'False tooth'] }, BACK));

// story: from the front it looks like a normal row of teeth → swing behind: the wings → the bridge lifts off: the neighbours are
// whole → a cut through 11: a thin wing on enamel → hero: straight on from the palate, wings on the backs of 11 and 13
fig.story([
  { dur: 0, hold: 1.4, theta: 0.3, phi: 1.3, zoom: 1.0, labels: [] },
  { dur: 1.8, hold: 2.0, theta: 0.12, zoom: 0.66, focus: [MID, 4.6, 0], labels: ['False tooth', 'Central 11', 'Canine 13'] },
  { dur: 2.8, hold: 2.0, theta: Math.PI - 0.35, phi: 1.2, zoom: 0.68, focus: [MID, 4.6, 0], labels: ['Wing', 'Connector'] },
  { dur: 2.2, hold: 2.0, explode: 1, labels: ['Central 11'] },
  { dur: 1.6, hold: 0.2, explode: 0, labels: [] },
  { fov: 26, dur: 2.0, hold: 0.2, theta: Math.PI / 2 + 0.25, phi: 1.35, zoom: 0.8, focus: [CUT, 5, -1], labels: [] },
  { dur: 0, hold: 0, section: true, offset: CUT + 6 },
  { dur: 2.0, hold: 2.4, offset: CUT, theta: Math.PI / 2 + 0.08, phi: 1.45, zoom: 0.42, focus: [CUT, 5.2, -2.2], labels: ['Wing', 'Enamel'] },
  { dur: 0.1, hold: 0, offset: CUT + 6, labels: [] },
  { fov: 30, dur: 2.4, hold: 2.8, section: false, theta: Math.PI, phi: 1.05, zoom: 0.6, focus: [MID, 4.8, 0], labels: ['Wing', 'Connector', 'False tooth', 'Central 11', 'Canine 13'] }   // teaching shot
]);
fig.start();
