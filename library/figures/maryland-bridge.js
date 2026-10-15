// Story: a resin-bonded (Maryland) bridge replacing the missing upper right lateral incisor (FDI 12 = Universal 7), held by
// two thin wings bonded to the palatal enamel of 11 and 13. Teeth in the mouth (crowns down, DK.arch 'jaw' placement).
// poster: end
// Arch frame: +x = patient's left, +z = anterior, y up; the patient's right (11, 12, 13) is at −x. The pontic is DK.pontic in 12's
// own frame; the wings are hand-built plates draped on each abutment's palatal surface (DK.crownSurface), 0.7 mm thick.
// Everything of the bridge is moved into the world with each tooth's matrix, so it explodes as one piece. Sizes in mm.
const WING = 0.7;                          // zirconia wing thickness (dental-facts.md §18, Kern 2023)
const CONN = { h: 3.2, w: 2.2 };           // connector ≥ 3 mm high × 2 mm (Kern 2023); ≈ 7 mm²
const fig = DK.figure({
  fov: 34,
  title: 'Maryland bridge',
  subtitle: 'Replaces FDI 12 (Universal 7), upper right lateral incisor, in the mouth. Wings schematic.',
  view: { theta: -0.35, phi: 1.85, margin: 0.95 }
});

// --- teeth: 11 and 13 at their natural slots (12's slot left empty); 12's slot from a second, crown-only layout
const build = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', form: 'straight', teeth: [13, 11], build });
const ref = DK.arch({ jaw: 'maxilla', placement: 'jaw', form: 'straight', teeth: [13, 12, 11], build });
fig.part(arch.group, { name: 'Teeth', label: false, info: 'Upper right central incisor (11) and canine (13), the two neighbours of the gap.' });
arch.group.updateMatrixWorld(true); ref.group.updateMatrixWorld(true);
const T11 = arch.teeth.find(t => t.fdi === 11), T13 = arch.teeth.find(t => t.fdi === 13), R12 = ref.teeth.find(t => t.fdi === 12);
const s11 = T11.spec, s13 = T13.spec, s12 = R12.spec;
const ridge = DK.gingivaArch(arch);
ridge.traverse(m => { if (m.isMesh && m.material.emissive) { m.material.emissive = DK.color(0x5a3c3a); m.material.emissiveIntensity = 0.55; } });   // lift the palatal side, which faces away from the key light
fig.part(ridge, { name: 'Gum', label: false, fit: false, info: 'Gum and the healed ridge where 12 was lost.' });
fig.part(T11.tooth.group, { inPlace: true, name: 'Central 11', anchor: [0.8, s11.crownL - 0.5, 0], info: 'Upper right central incisor: an abutment. Only its palatal enamel is roughened for bonding.' });
fig.part(T13.tooth.group, { inPlace: true, name: 'Canine 13', anchor: [-0.6, s13.crownL - 0.8, 0], info: 'Upper right canine: the other abutment.' });

// --- a closed plate between two grids (inner on the tooth, outer 0.7 mm out): faces oriented outward
function plate(rows, cols, at) {   // at(i, j) → [inner[3], outer[3], n[3]]
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
// wing on the palatal surface of an abutment (tooth frame): from 1.2 mm above the CEJ to ~2 mm short of the edge, covering the
// half of the palatal face next to the gap and a little beyond, with rounded ends
function wing(spec, side) {   // side: +1 if the gap is mesial (+x), −1 if distal
  const L = DK.crownSurface(spec, -1), y0 = 1.4, y1 = spec.crownL - 2.0, hw = spec.mdC / 2;
  const xa = side * hw * 0.92, xb = -side * hw * 0.35, R = 18, C = 22;
  return plate(R, C, (i, j) => {
    const v = i / R, u = j / C, e = Math.abs(v * 2 - 1), k = e > 0.6 ? Math.sqrt(Math.max(0, 1 - ((e - 0.6) / 0.4) ** 2)) : 1;
    const xm = (xa + xb) / 2, x = xm + (lerpN(xb, xa, u) - xm) * Math.max(0.25, k), y = lerpN(y0, y1, v), q = L.at(x, y);
    const n = q.n; return [[q.p[0] + n[0] * 0.02, q.p[1] + n[1] * 0.02, q.p[2] + n[2] * 0.02], [q.p[0] + n[0] * WING, q.p[1] + n[1] * WING, q.p[2] + n[2] * WING], n];
  });
}
function lerpN(a, b, t) { return a + (b - a) * t; }

// --- the bridge: pontic in 12's frame, wings in 11's and 13's, connectors between, all moved into the world
const ZR = DK.mat('zirconia', { color: fig.dark ? 0xb7c6d3 : 0xd3dde6 });   // the bridge in a pale accent tint so it reads apart from the teeth
const bridge = new THREE.Group(); bridge.name = 'Bridge';
const toWorld = (obj, toothGroup) => { obj.updateMatrix(); obj.applyMatrix4(toothGroup.matrixWorld); bridge.add(obj); return obj; };
const pontic = toWorld(DK.pontic(s12, { design: 'modified ridge lap', ridgeY: -0.9 }, 'zirconia'), R12.tooth.group); pontic.material = ZR;
const w11 = toWorld(new THREE.Mesh(wing(s11, -1), ZR), T11.tooth.group);   // gap distal of 11
const w13 = toWorld(new THREE.Mesh(wing(s13, +1), ZR), T13.tooth.group);   // gap mesial of 13
// connectors: a rounded bar from the wing's gap-side edge to the pontic's palatal-proximal corner (world points)
const W = (g, p) => g.localToWorld(new THREE.Vector3(...p));
const yC = 0.5;   // fraction of the crown height
function connector(a, b, up) {
  const d = b.clone().sub(a), len = d.length(), x = d.clone().normalize(), z = new THREE.Vector3().crossVectors(x, up).normalize(), y = new THREE.Vector3().crossVectors(z, x);
  const g = new THREE.SphereGeometry(1, 28, 18); g.scale(len / 2 + 0.5, CONN.h / 2, CONN.w / 2);
  const m = new THREE.Mesh(g, ZR); m.matrixAutoUpdate = true;
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); m.position.copy(a).add(b).multiplyScalar(0.5); bridge.add(m); return m;
}
const up = new THREE.Vector3(0, -1, 0);   // crowns hang down in the mouth: the long axis runs along −y
const p11 = (() => { const q = DK.crownSurface(s11, -1).at(-s11.mdC / 2 * 0.85, s11.crownL * yC); return W(T11.tooth.group, [q.p[0] + q.n[0] * WING * 0.5, q.p[1], q.p[2] + q.n[2] * WING * 0.5]); })();
const p13 = (() => { const q = DK.crownSurface(s13, -1).at(s13.mdC / 2 * 0.85, s13.crownL * yC); return W(T13.tooth.group, [q.p[0] + q.n[0] * WING * 0.5, q.p[1], q.p[2] + q.n[2] * WING * 0.5]); })();
const pm = (sg) => W(R12.tooth.group, [sg * (s12.md / 2 - 0.7), s12.crownL * yC, -s12.bl / 2 + 2.0]);
const c11 = connector(p11, pm(+1), up), c13 = connector(p13, pm(-1), up);

const PAL = [0, 0, -9];   // lift off toward the palate
fig.part(bridge, { name: 'Bridge', label: false, explode: PAL, info: 'One piece of zirconia: the false tooth and its two wings.' });
fig.part(pontic, { inPlace: true, name: 'False tooth', sub: 'no root', anchor: [0, s12.crownL - 0.6, 0], dim: false, info: 'The pontic replaces the missing lateral incisor. It rests lightly on the gum and has no root.' });
fig.part(w11, { inPlace: true, name: 'Wing', sub: `about ${WING} mm, bonded`, accent: true, anchor: () => { const q = DK.crownSurface(s11, -1).at(-s11.mdC * 0.15, s11.crownL * 0.5); return [q.p[0] + q.n[0] * WING, q.p[1], q.p[2] + q.n[2] * WING]; }, dim: false, info: 'A thin wing glued to the back of the neighbour with resin cement. Only the enamel is roughened, with little or no drilling. Designs with a single wing on one neighbour are also common and debond less often.' });
fig.part(w13, { inPlace: true, name: 'Wing on 13', label: false, info: 'The second wing, bonded to the back of the canine.' });
fig.part(c11, { inPlace: true, name: 'Connector', sub: 'at least 3 by 2 mm', anchor: [0, 0, 0], dim: false, info: 'Joins the false tooth to a wing. It must be tall enough not to break (zirconia: at least about 3 mm high and 2 mm wide).' });
fig.part(c13, { inPlace: true, name: 'Connector 13', label: false, info: 'Joins the false tooth to the canine wing.' });

const FRONT = { theta: -0.35, phi: 1.85 }, BACK = { theta: Math.PI + 0.35, phi: 2.05 };
fig.standardControls({ explodeLabel: 'Lift off', section: false });
fig.view('Front', Object.assign({ explode: 0, zoom: 1, labels: ['False tooth'] }, FRONT));
fig.view('Back', Object.assign({ explode: 0, zoom: 1, labels: ['Wing', 'Connector', 'False tooth'] }, BACK));

// story: from the front the gap is filled and it looks like a tooth → swing round behind: the wings → the bridge lifts off:
// the neighbours are barely touched → it bonds back → hero from behind and below: wings on the backs of 11 and 13
fig.story([
  { dur: 0, hold: 1.4, theta: -0.35, phi: 1.85, zoom: 1.05, labels: [] },
  { dur: 2.0, hold: 2.0, theta: -0.15, zoom: 0.95, labels: ['False tooth', 'Central 11', 'Canine 13'] },
  { dur: 2.8, hold: 2.0, theta: Math.PI + 0.45, phi: 2.05, zoom: 1, labels: ['Wing', 'Connector'] },
  { dur: 2.2, hold: 2.2, explode: 1, labels: ['Central 11', 'Canine 13'] },
  { dur: 1.8, hold: 0.4, explode: 0, labels: [] },
  { dur: 1.8, hold: 2.8, theta: Math.PI + 0.35, phi: 2.05, zoom: 0.95, labels: ['Wing', 'Connector', 'False tooth', 'Central 11', 'Canine 13'] }   // teaching shot
]);
fig.start();
