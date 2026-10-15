// G.V. Black's cavity classes I to VI as a plate: six maxillary right teeth (FDI 11–16), crown up, in a row, each turned to show the one site that defines its class. Tooth frames: +x = mesial, +z = facial, CEJ at y = 0, mm.
// poster: end
// Classes from dental-facts.md §16: I pits and fissures, II proximal of premolars and molars, III proximal of incisors and
// canines with the incisal angle intact, IV proximal of incisors and canines involving the incisal angle, V gingival third of
// the facial or lingual surface (any tooth), VI cusp tips and incisal edges (a later addition, not in Black's original).
// Lesions are DK.cariesLesion at a cavitated stage; the Class IV angle is lost (the figure's one cut plane paints its face).
const fig = DK.figure({
  fov: 30,
  title: "Black's cavity classes",
  subtitle: 'Upper right teeth 11 to 16 (FDI), crown up, each turned to its site.',
  view: { theta: 0, phi: 1.22 }
});

const GAP = 12.5;   // centre-to-centre spacing (mm)
const STAGE = 2.7;  // cavitated, into dentin: the opening is visible in 3D
const rows = [
  // class, FDI, turn about y (rad, negative brings the mesial toward the camera), tilt toward the camera (rad), lesion
  { cls: 'I',   fdi: 16, ry: 0,    rx: 0.55, lesion: { site: 'occlusal', at: [0, 0], size: 1.2 }, lo: [0, -110], sub: 'pits and fissures', info: 'Class I: pits and fissures. Occlusal surfaces of premolars and molars, buccal and lingual pits of molars, the lingual pit of upper incisors.' },
  { cls: 'II',  fdi: 15, ry: -1.05, rx: 0.1, lesion: { site: 'mesial', size: 1.1 }, lo: [0, 120], sub: 'proximal, back teeth', info: 'Class II: the mesial or distal surface of a premolar or molar, just below the contact (MO, DO, MOD preparations).' },
  { cls: 'III', fdi: 12, ry: -1.05, rx: 0.1, lesion: { site: 'mesial', size: 0.9 }, lo: [0, -120], sub: 'proximal, front teeth', info: 'Class III: the mesial or distal surface of an incisor or canine, with the incisal angle intact.' },
  { cls: 'IV',  fdi: 11, ry: -0.45, rx: 0.1, lesion: null, lo: [0, -100], sub: 'incisal angle lost', info: 'Class IV: a proximal lesion or fracture of an incisor or canine that includes the incisal angle.' },
  { cls: 'V',   fdi: 14, ry: 0,    rx: 0.1, lesion: { site: 'buccal', at: 1.4, size: 1.1 }, lo: [0, 130], sub: 'gingival third', info: 'Class V: the gingival third of the facial or lingual surface, on any tooth, front or back.' },
  { cls: 'VI',  fdi: 13, ry: 0,    rx: 0.35, lesion: { site: 'occlusal', at: [0.12, 0], size: 0.75 }, lo: [0, -90], sub: 'cusp tips, incisal edges', info: 'Class VI: the tip of a cusp or an incisal edge. A later addition, not in Black’s original five.' }
];

const universal = fdi => 9 - (fdi % 10);   // upper right: FDI 1x → Universal 9 − x
let iv = null;
rows.forEach((r, i) => {
  const t = DK.tooth(r.fdi), s = t.spec;
  t.group.position.set((i - 2.5) * GAP, 0, 0);
  t.group.rotation.set(r.rx, r.ry, 0, 'YXZ');
  let anchor;
  if (r.lesion) {
    const les = DK.cariesLesion(t, Object.assign({ stage: STAGE, reactionary: false }, r.lesion));
    anchor = les.point(0, 0);
  } else {
    iv = t; anchor = [3.0, 9.0, 0.6];
  }
  fig.part(t.group, { name: 'Class ' + r.cls, sub: r.sub, anchor, labelOffset: r.lo, dim: false,
    info: `${r.info} Shown on ${s.name.toLowerCase()} ${r.fdi} (Universal ${universal(r.fdi)}).` });
});

// Class IV: the mesio-incisal angle of 11 lost along an oblique plane (tooth frame), carried into the world frame
iv.group.updateMatrixWorld(true);
const Nt = new THREE.Vector3(0.78, 0.62, 0.3).normalize(), Ct = Nt.dot(new THREE.Vector3(1.0, 10.4, 0.4));
const plane = new THREE.Plane(Nt, -Ct).applyMatrix4(iv.group.matrixWorld);   // keeps the lost corner side
fig.enableSection([plane.normal.x, plane.normal.y, plane.normal.z], [
  { objects: [iv.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [iv.layers.dentin, iv.layers.root], color: DK.COLORS.dentinCap }
]);
const OFF = -plane.constant;
fig.section.set(true, OFF);
fig.standardControls({ explode: false });
fig.view('Facial', { theta: 0, phi: 1.22, zoom: 1, focus: 'auto' });
fig.view('From above', { theta: 0, phi: 0.75, zoom: 1, focus: 'auto' });

const X = i => (i - 2.5) * GAP, ALL = rows.map(r => 'Class ' + r.cls);
fig.story([
  { dur: 0, hold: 1.4, theta: 0.12, phi: 1.3, zoom: 1.04, section: true, offset: OFF, labels: [] },
  { dur: 2.2, hold: 2.0, theta: 0.05, phi: 1.05, zoom: 0.5, focus: [(X(0) + X(1)) / 2, 6, 0], labels: ['Class I', 'Class II'] },
  { dur: 2.4, hold: 2.0, theta: -0.05, phi: 1.2, zoom: 0.5, focus: [(X(2) + X(3)) / 2, 6, 0], labels: ['Class III', 'Class IV'] },
  { dur: 2.4, hold: 2.0, theta: 0.05, phi: 1.15, zoom: 0.5, focus: [(X(4) + X(5)) / 2, 5, 0], labels: ['Class V', 'Class VI'] },
  { dur: 2.4, hold: 2.4, theta: 0, phi: 1.22, zoom: 0.82, focus: 'auto', labels: ALL }
]);
fig.start();
