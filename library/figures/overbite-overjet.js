// Overbite vs overjet: upper right central incisor (FDI 11) over the lower right central incisor (FDI 41), seen from the patient's right with a
// poster: end
// mid-sagittal cut. Three pairs side by side along z (normal, large overjet, deep bite). Frame per pair: +x mesial (cut plane x = 0), +z labial
// (toward the lips), y up, origin at the labial incisal edge of 11. Each lower incisor is slid forward until its labial face touches the palatal
// face of 11 (unless the case pushes it back), so the overbite and overjet shown are measured off the geometry, never typed in.
// Incisor inclinations are typical (upper crown ~23° (5° in the deep bite, upright as in a Class II division 2), lower ~22° labial of vertical, interincisal angle ~135°); values approximate.
const PAIRS = [
  { key: 'n', name: 'Normal', ob: 2.2, back: 0, z: -27 },
  { key: 'j', name: 'Large overjet', ob: 2.2, back: 5.0, z: 0 },
  { key: 'b', name: 'Deep bite', ob: 5.2, back: 0, z: 27, tiltU: 5 * Math.PI / 180 }
];
const TILT_U = 23 * Math.PI / 180, TILT_L = 22 * Math.PI / 180;
const fig = DK.figure({
  fov: 28,
  title: 'Overbite vs overjet',
  subtitle: 'FDI 11 over 41 (Universal 8 over 25), seen from the right.',
  view: { theta: -Math.PI / 2, phi: 1.55, margin: 0.72 }
});
const INK = fig.dark ? 0xb9b3a7 : 0x5f5b53;
const basic = c => new THREE.MeshBasicMaterial({ color: c instanceof THREE.Color ? c : DK.color(c), toneMapped: false, side: THREE.DoubleSide, transparent: true, depthWrite: false });
const V = a => new THREE.Vector3(a[0], a[1], a[2]);

// --- a sagittal profile (x = 0) of a crown surface, in the pair frame: [[y, z]...] sorted by y
function profile(tooth, side) {
  const cs = DK.crownSurface(tooth.spec, side), out = [];
  for (let i = 0; i <= 40; i++) { const h = 0.2 + (cs.yTop - 0.2) * i / 40, p = tooth.group.localToWorld(V(cs.at(0, h).p)); out.push([p.y, p.z]); }
  return out.sort((a, b) => a[0] - b[0]);
}
const zAt = (prof, y) => { for (let i = 1; i < prof.length; i++) if (prof[i][0] >= y && prof[i - 1][0] <= y) { const t = (y - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0] || 1); return prof[i - 1][1] + t * (prof[i][1] - prof[i - 1][1]); } return null; };
const tipOf = (tooth, top) => { const a = tooth.group.localToWorld(V(DK.crownSurface(tooth.spec, 1).at(0, 99).p)), b = tooth.group.localToWorld(V(DK.crownSurface(tooth.spec, -1).at(0, 99).p)); return top ? (a.y > b.y ? a : b) : (a.y < b.y ? a : b); };

function buildPair(c) {
  const set = new THREE.Group();
  // upper incisor: crown down, crown tipped labially; labial incisal edge at the origin
  const U = DK.tooth(11), hu = new THREE.Group(); U.group.scale.y = -1; hu.add(U.group); hu.rotation.x = -(c.tiltU ?? TILT_U); set.add(hu); set.updateMatrixWorld(true);
  const eu = U.group.localToWorld(V(DK.crownSurface(U.spec, 1).at(0, 99).p)); hu.position.sub(eu); set.updateMatrixWorld(true);
  const edgeY = tipOf(U, false).y;                              // lowest point of the upper incisal edge
  // lower incisor: crown up, tipped labially; its incisal tip `ob` above the upper edge
  const L = DK.tooth(41), hl = new THREE.Group(); hl.add(L.group); hl.rotation.x = TILT_L; set.add(hl); set.updateMatrixWorld(true);
  hl.position.y = edgeY + c.ob - tipOf(L, true).y; set.updateMatrixWorld(true);
  // slide it forward until its labial face meets the palatal face of 11 (0.1 mm film), then back by `back`
  const pal = profile(U, -1), lab = profile(L, 1); let d = Infinity;
  lab.forEach(([y, z]) => { const zp = zAt(pal, y); if (zp !== null) d = Math.min(d, zp - z); });
  hl.position.z += d - 0.1 - c.back; set.updateMatrixWorld(true);
  const labL = profile(L, 1), tip = tipOf(L, true);
  const oj = 0 - zAt(labL, 0), ob = tip.y - edgeY;           // overjet at the level of the upper incisal edge; overbite edge to edge
  const apex = U.group.localToWorld(new THREE.Vector3(0, -U.spec.rootL + 0.3, 0)); c.apex = [0, apex.y + 0.6, apex.z];
  set.position.z = c.z;
  return Object.assign(c, { set, U, L, oj, ob, edgeY, tipY: tip.y, tipZ: tip.z, zl0: zAt(labL, 0) });
}
PAIRS.forEach(buildPair);

// --- dimension marks (flat ribbons just in front of the cut face, x = -0.15): overjet horizontal (accent), overbite vertical (ink)
const X = -0.15, N = [1, 0, 0];
function dims(c) {
  const g = new THREE.Group(), mj = basic(fig.accent), mb = basic(INK), mg = basic(INK); mg.opacity = 0.45;
  const bar = (pts, w, m) => g.add(DK.ribbon(pts.map(p => [X, p[0], p[1]]), w, N, { material: m }));
  const yJ = 0, zA = c.zl0, zB = 0;                                    // overjet: lower labial face → upper incisal edge
  bar([[yJ, zA], [yJ, zB]], 0.22, mj); bar([[yJ - 0.6, zA], [yJ + 0.6, zA]], 0.16, mj); bar([[yJ - 0.6, zB], [yJ + 0.6, zB]], 0.16, mj);
  const zO = 1.7, y0 = c.edgeY, y1 = c.tipY;                            // overbite: upper edge level → lower tip level, off to the labial
  bar([[y0, zO], [y1, zO]], 0.22, mb); bar([[y0, zO - 0.6], [y0, zO + 0.6]], 0.16, mb); bar([[y1, zO - 0.6], [y1, zO + 0.6]], 0.16, mb);
  bar([[y1, c.tipZ + 0.3], [y1, zO - 0.6]], 0.08, mg);                   // guide from the lower tip out to the bar
  g.visible = false; c.set.add(g); c.dims = g; c.zO = zO;
  return g;
}
PAIRS.forEach(dims);

// --- parts
const mm = v => v.toFixed(1) + ' mm';
const INFO = {
  n: 'The upper incisors cover about a third of the lower incisors and sit just in front of them: overbite and overjet each about 2–3 mm (approximate norms).',
  j: 'The upper incisors sit far in front of the lower ones ("buck teeth"). Common with a Class II bite or thumb sucking; prominent teeth are more easily injured.',
  b: 'The upper incisors hide most of the lower ones. Often seen with upright upper incisors (as here); in severe cases the lower incisors bite into the gum behind the upper teeth.'
};
PAIRS.forEach(c => {
    fig.part(c.set, { name: c.name, sub: `overbite ${mm(c.ob)}, overjet ${mm(c.oj)}`, anchor: c.apex, labelOffset: [0, -40], info: INFO[c.key] });
  fig.part(c.U.group, { inPlace: true, name: 'Upper incisor', label: false, info: 'Upper right central incisor, FDI 11 (Universal 8).' });
  fig.part(c.L.group, { inPlace: true, name: 'Lower incisor', label: false, info: 'Lower right central incisor, FDI 41 (Universal 25).' });
});
const P = PAIRS[0], cutOn = (e, sec) => sec.enabled;
fig.part(P.dims, { inPlace: true, name: 'Overjet', sub: 'front to back', accent: true, anchor: [X, -0.1, P.zl0 / 2], labelOffset: [-40, 70], when: cutOn, dim: false,
  info: 'Overjet: how far the upper incisor edge sits in front of the lower incisor, measured horizontally. About 2–3 mm is typical.' });
fig.part(P.dims.children[3], { inPlace: true, name: 'Overbite', sub: 'up and down', anchor: [X, (P.edgeY + P.tipY) / 2, P.zO], labelOffset: [70, -90], when: cutOn, dim: false,
  info: 'Overbite: how far the upper incisors overlap the lower ones vertically. About 2–3 mm (a third of the lower crown) is typical.' });

// --- cut: x = 0 through every pair (the half toward the camera, -x, removed)
const all = k => PAIRS.flatMap(c => [c.U.layers[k], c.L.layers[k]]).filter(Boolean);
fig.enableSection([-1, 0, 0], [
  { objects: all('enamel'), color: DK.COLORS.enamelCap },
  { objects: all('dentin').concat(all('root')), color: DK.COLORS.dentinCap },
  { objects: all('pulp'), color: DK.COLORS.pulpCap }
]);
fig.onFrame(() => { const on = fig.section.enabled; PAIRS.forEach(c => { c.dims.visible = on; }); });
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-1, 4], offset: 0 } });
fig.view('Side', { theta: -Math.PI / 2, phi: 1.55, zoom: 1, focus: 'auto', fov: 28 });

const row = (k, f) => ({ k, v: PAIRS.map(c => ({ v: `${c.name.toLowerCase()} ${mm(c[f])}`, cls: c.key === 'n' ? 'ok' : (f === 'oj' && c.key === 'j') || (f === 'ob' && c.key === 'b') ? 'warn' : '' })) });
fig.setReadout([row('Overbite', 'ob'), row('Overjet', 'oj')]);

// --- story: the three pairs in three-quarter view → the cut sweeps in from the side → push in on the normal pair (overbite, overjet)
// → ease out to the side view with every pair named
const F = [0, P.edgeY + 1.5, P.z - 1];
fig.story([
  { dur: 0, hold: 1.4, theta: -1.05, phi: 1.4, zoom: 1, section: false, labels: ['Normal', 'Large overjet', 'Deep bite'], caption: 'Upper and lower front teeth, three bites.' },
  { dur: 2.2, hold: 0.2, theta: -Math.PI / 2, phi: 1.55, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.0, hold: 0.8, offset: 0, labels: ['Normal', 'Large overjet', 'Deep bite'], caption: 'Cut down the middle of the teeth.' },
  { dur: 2.0, hold: 2.6, zoom: 0.42, focus: F, labels: ['Overbite', 'Overjet'], caption: 'Overbite is vertical overlap; overjet is horizontal.' },
  { dur: 2.2, hold: 2.4, zoom: 1, focus: 'auto', labels: ['Normal', 'Large overjet', 'Deep bite', 'Overbite', 'Overjet'], caption: '' }
]);
fig.start();
