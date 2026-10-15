// Library: upper right molars and premolar (FDI 15, 16, 17) in the jaw, crown down, under the maxillary sinus, seen from the cheek in a
// poster: end
// mesio-distal CBCT-style slab cut through the cheek-side (buccal) roots. Frame: +x mesial, +y apical (up, toward the sinus), +z buccal
// (toward the camera), CEJ at y = 0, mm. The slab's outline (alveolar crest, sinus floor, anterior and posterior sinus walls, cropped flat
// above) is traced here and extruded; the floor is computed from the teeth's own root tips so it hugs them with a thin layer of bone.
// Teaching point: the roots of the upper back teeth sit right under the sinus floor, so a swollen sinus lining can ache like a tooth (and
// a tooth infection can spread to the sinus).
const IMG = (window.DK_MODE || new URLSearchParams(location.search).get('mode')) === 'image';
const fig = DK.figure({
  fov: 20,
  title: 'Upper molar roots and the sinus',
  subtitle: 'FDI 15, 16, 17 (Universal 4, 3, 2), in the jaw, seen from the cheek.',
  view: { theta: 0, phi: 1.55, margin: IMG ? 0.7 : 0.92 }
});
const { lerp, smooth } = DK.util;
const SLAB = 5.6, TOP = 23, CREST = 1.8, CUT = 2.55;   // slab half-thickness (bucco-palatal), crop height, bone crest above the CEJ, cut through the buccal roots

// ---- teeth, crown down (built crown-up in a mirrored group, as DK.arch 'jaw' placement does)
const J = new THREE.Group(); J.scale.y = -1;
const TEETH = [{ fdi: 15, x: 0 }, { fdi: 16, x: 0 }, { fdi: 17, x: 0 }];
const md = f => DK.toothPreset(f).md;
TEETH[0].x = md(16) / 2 + md(15) / 2; TEETH[2].x = -(md(16) / 2 + md(17) / 2);
TEETH.forEach(t => { t.tooth = DK.tooth(t.fdi); t.tooth.group.position.x = t.x; J.add(t.tooth.group); t.pdl = DK.pdl(t.tooth.spec, 0.2, -CREST); t.pdl.traverse(m => { if (m.isMesh) m.material.visible = false; }); t.tooth.group.add(t.pdl); });
// root tips in the world frame (y up = apical)
const tips = [];
TEETH.forEach(t => t.tooth.spec.roots.forEach(r => tips.push({ fdi: t.fdi, x: t.x + r.x + (r.apex ? r.apex[0] : 0), y: r.len, z: r.z + (r.apex ? r.apex[1] : 0), buccal: r.z > 0.5 })));

// ---- the sinus floor: a gently curved base that rises toward the front and back walls, bumped up over every root tip (about 0.6 mm of bone)
const X0 = -17.5, X1 = 12.2;   // posterior and anterior extent of the sinus floor
const base = x => 10.6 + 6.5 * smooth(5.5, X1 + 0.6, x) + 7 * (1 - smooth(X0 - 0.4, -13.5, x));
const floorY = x => { let y = base(x); tips.forEach(p => { const d = (x - p.x) / 2.0; if (Math.abs(d) < 1) y = Math.max(y, p.y + 0.6 - 1.4 * d * d); }); return y; };
const FLOOR = []; for (let i = 0; i <= 120; i++) { const x = lerp(X1, X0, i / 120); FLOOR.push([x, floorY(x)]); }
// smooth the bumps a little (a running mean keeps the floor a continuous bony curve)
const SM = FLOOR.map((p, i) => { let s = 0, n = 0; for (let k = -2; k <= 2; k++) { const q = FLOOR[Math.min(FLOOR.length - 1, Math.max(0, i + k))]; s += q[1]; n++; } return [p[0], Math.max(p[1], s / n)]; });

// ---- bone outline (counter-clockwise): crest from back to front, anterior crop up, top crop, anterior sinus wall down, the floor back,
// the posterior wall up, top crop, the back of the tuberosity down to the crest
const XA = 14.8, XP = -20.2;
const ant = [[XA, TOP], [X1 + 1.2, TOP], [X1 + 0.9, 20.5], [X1 + 0.4, 18.2]], post = [[X0 - 0.3, 18.6], [X0 - 0.9, 21], [X0 - 1.2, TOP], [XP, TOP], [XP, 16], [XP + 0.6, 9], [XP + 2.0, 4], [XP + 3.6, CREST + 0.3]];
const crest = []; for (let i = 0; i <= 40; i++) { const x = lerp(XP + 4.4, XA, i / 40); const dip = TEETH.slice(0, 2).map(t => t.x - md(t.fdi) / 2).reduce((y, c) => Math.min(y, 0.7 * Math.abs(x - c)), 0.8); crest.push([x, CREST - 0.8 + Math.min(0.8, dip)]); }
const OUTLINE = crest.concat(ant, SM, post);
const shape = pts => { const s = new THREE.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; };
const slab = (pts, z0, z1) => { const g = new THREE.ExtrudeGeometry(shape(pts), { depth: z1 - z0, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, z0); g.computeVertexNormals(); return g; };
const bone = new THREE.Mesh(slab(OUTLINE, -SLAB, SLAB), DK.mat('bone', { cap: DK.COLORS.corticalCap }));
// cancellous core: between the crest and the floor, 0.9 mm in from both
const CORE = [[XP + 4.2, CREST + 1.2], [XA, CREST + 1.2], [XA, 15.6]].concat(SM.filter(p => p[0] < X1 - 0.6 && p[0] > X0 + 1.2).map(p => [p[0], p[1] - 0.9]), [[XP + 1.8, 15.2], [XP + 1.6, 8], [XP + 2.6, 4.2]]);
const core = new THREE.Mesh(slab(CORE, -SLAB + 0.8, SLAB - 0.8), DK.mat('bone', { color: DK.COLORS.cancellous })); core.material.visible = false;

// ---- sinus lining (Schneiderian membrane) over the floor and up the walls; `swell` thickens it (sinusitis)
const LINE = [[X1 + 1.05, TOP - 0.05], [X1 + 0.85, 20.5], [X1 + 0.35, 18.2]].concat(SM, [[X0 - 0.35, 18.6], [X0 - 0.95, 21], [X0 - 1.25, TOP - 0.05]]);
const offsetUp = (P, t) => P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dy / l * t(p), p[1] - dx / l * t(p)]; });
const S = { swell: 0 };
const thick = p => 0.45 + S.swell * 1.8 * (0.35 + 0.65 * smooth(TOP - 2, 12, p[1]));
const liningPts = () => LINE.map(p => [p[0], p[1] - 0.02]).concat(offsetUp(LINE, thick).reverse());
const lining = new THREE.Mesh(slab(liningPts(), -SLAB + 0.05, SLAB - 0.05), DK.mat('mucosa', { color: 0xd9a9a0, cap: 0xc98f86 }));
const rebuildLining = () => { const g = slab(liningPts(), -SLAB + 0.05, SLAB - 0.05), a = lining.geometry.attributes.position; if (g.attributes.position.count === a.count) { a.array.set(g.attributes.position.array); a.needsUpdate = true; lining.geometry.computeVertexNormals(); lining.geometry.computeBoundingSphere(); g.dispose(); } else { lining.geometry.dispose(); lining.geometry = g; } };
// the air space behind the cut: a dark back plate, as air reads on a CBCT slice
const AIR = offsetUp(LINE, () => 0.5).concat([[X0 - 1.3, TOP], [X1 + 1.1, TOP]]);
const air = new THREE.Mesh(new THREE.ShapeGeometry(shape(AIR)), new THREE.MeshStandardMaterial({ color: DK.color(fig.dark ? 0x1d1c19 : 0xcfc7b8), roughness: 1 }));
air.position.z = -SLAB + 0.02;   // follows the cut (onFrame), so the slice reads flat like a CBCT image instead of a tunnel

// ---- gum over the crest, around the necks (built crown-up in J like the teeth)
const gum = DK.gingiva({ width: XA - XP - 4.4, height: 2.9, depth: 2 * SLAB + 1.2, crest: 1.1, round: 0.6,
  around: TEETH.map(t => ({ x: t.x - (XA + XP + 4.4) / 2, z: 0, md: t.tooth.spec.mdC, bl: t.tooth.spec.blC, rise: 0.8 })) });
gum.position.set((XA + XP + 4.4) / 2, 0.9, 0); J.add(gum);

const frame = new THREE.Mesh(new THREE.BoxGeometry(XA - XP, TOP + 9, 2 * SLAB), new THREE.MeshBasicMaterial({ visible: false }));
frame.position.set((XA + XP) / 2, (TOP - 9) / 2 + 0.5, 0);
fig.part(frame, { name: 'frame', label: false });
fig.part(J, { name: 'Upper back teeth', label: false, fit: false, info: 'Upper right second premolar, first and second molar.' });
const jaw = new THREE.Group(); jaw.add(bone, core, lining, air);
fig.part(jaw, { name: 'Upper jaw', label: false, fit: false, info: 'The back of the upper jaw cut through the cheek-side roots, cropped above the sinus floor.' });

const onCut = (sec, x, y) => [x, y, sec.enabled ? sec.offset + 0.12 : SLAB + 0.1];
const t16 = TEETH[1], t17 = TEETH[2], mb16 = tips.find(p => p.fdi === 16 && p.buccal && p.x > t16.x), db16 = tips.find(p => p.fdi === 16 && p.buccal && p.x < t16.x);
fig.part(air, { inPlace: true, name: 'Sinus', sub: 'air space', anchor: [-2.5, 19.5, 0], dim: false,
  info: 'The maxillary sinus: an air space in the cheekbone, lined by a thin membrane. Its floor sits just above the roots of the upper back teeth.' });
fig.part(bone, { inPlace: true, name: 'Sinus floor', sub: 'thin bone over the roots', accent: true, dim: false, anchor: (e, sec) => onCut(sec, db16.x, floorY(db16.x) - 0.25), labelOffset: [-110, -70],
  info: 'Often only a thin layer of bone, sometimes just the lining, separates these root tips from the sinus.' });
fig.part(lining, { inPlace: true, name: 'Sinus lining', dim: false, anchor: (e, sec) => onCut(sec, -13.6, floorY(-13.6) + thick([0, floorY(-13.6)]) * 0.6), labelOffset: [-60, -60],
  info: 'The membrane that lines the sinus. In sinusitis it swells; the same nerves supply these teeth, so the pain is often felt as a toothache.' });
fig.part(lining, { inPlace: true, name: 'Swollen lining', sub: 'sinusitis can ache like a tooth', dim: false, when: () => S.swell > 0.5, anchor: (e, sec) => onCut(sec, 4.2, floorY(4.2) + thick([0, floorY(4.2)]) * 0.7), labelOffset: [90, -60],
  info: 'A swollen, inflamed sinus lining presses on the floor right above the roots: upper back teeth can ache, often several at once. The reverse also happens: an infected upper tooth can spread to the sinus.' });
fig.part(t16.tooth.group, { inPlace: true, name: '16', sub: 'upper first molar', anchor: [0, 3.8, t16.tooth.spec.bl / 2], labelOffset: [0, 70], dim: false,
  info: 'Upper right first molar, FDI 16 (Universal 3): three roots, two on the cheek side (cut here) and one on the palate side.' });
fig.part(t17.tooth.group, { inPlace: true, name: '17', sub: 'second molar', anchor: [0, 3.6, t17.tooth.spec.bl / 2], labelOffset: [0, 70], dim: false,
  info: 'Upper right second molar, FDI 17 (Universal 2). Its roots are often the closest of all to the sinus floor.' });
fig.part(TEETH[0].tooth.group, { inPlace: true, name: '15', label: false, info: 'Upper right second premolar, FDI 15 (Universal 4). One root, usually a little further from the sinus.' });
const tipMark = new THREE.Object3D(); jaw.add(tipMark);
fig.part(tipMark, { inPlace: true, name: 'Root tips', anchor: (e, sec) => onCut(sec, mb16.x, mb16.y - 0.4), labelOffset: [90, 40], dim: false,
  info: 'The tips of the cheek-side roots of 16, right under the floor of the sinus.' });

fig.onFrame(() => { const sec = fig.section; air.position.z = sec && sec.enabled ? Math.max(-SLAB + 0.02, sec.offset - 0.12) : -SLAB + 0.02; });
fig.param('swell', 0, k => { S.swell = k; rebuildLining(); });

// ---- section: mesio-distal through the buccal roots (the cheek half removed, camera on the cheek side)
const L = k => TEETH.map(t => t.tooth.layers[k]).filter(Boolean);
fig.enableSection([0, 0, 1], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone], color: DK.COLORS.corticalCap },
  { objects: [core], color: 0xffffff, texture: DK.bone({ width: 4, height: 4, depth: 4 }).userData.layers.cancellous.userData.capTexture },
  { objects: [lining], color: 0xc98f86, kind: 'gingiva' },
  { objects: TEETH.map(t => t.pdl), color: DK.COLORS.pdl, kind: 'plain' },
  { objects: L('enamel'), color: DK.COLORS.enamelCap },
  { objects: L('dentin').concat(L('root')), color: DK.COLORS.dentinCap },
  { objects: L('pulp'), color: DK.COLORS.pulpCap }
]);
air.material.clippingPlanes = [];
fig.xray([bone, lining], false);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-4, SLAB + 0.5], offset: CUT } });
fig.toggle('Sinusitis', false, v => fig.goTo({ set: { swell: v ? 1 : 0 } }, 1.2));

// ---- story: the back teeth in their jaw from the front-cheek side → the cut sweeps in through the cheek-side roots → straight on: the
// sinus above → push in on the root tips under the floor → the lining swells (sinusitis) → hero: the whole slice, roots under a swollen floor
const F = [db16.x + 1.5, floorY(db16.x) - 1.5, CUT];
fig.story([
  { fov: 28, dur: 0, hold: 1.6, theta: 0.6, phi: 1.32, zoom: 1.05, section: true, offset: SLAB + 0.6, xray: 0.85, set: { swell: 0 }, labels: ['16', '17'] },
  { dur: 2.0, hold: 0.2, theta: 0.35, phi: 1.42, xray: 0, labels: [] },
  { dur: 2.4, hold: 0.6, theta: 0.2, offset: CUT, labels: ['Sinus'] },
  { fov: 20, dur: 2.0, hold: 1.6, theta: 0, phi: 1.55, labels: ['Sinus', '16', '17'] },
  { dur: 2.2, hold: 2.4, zoom: 0.55, focus: F, labels: ['Sinus floor', 'Root tips'] },
  { dur: 2.4, hold: 2.0, set: { swell: 1 }, zoom: 0.7, focus: [F[0] - 2, F[1] + 2, CUT], labels: ['Swollen lining'] },
  { dur: 2.2, hold: 2.6, zoom: 1.0, focus: 'auto', theta: 0, phi: 1.55, drift: 0, labels: ['Sinus', 'Sinus floor', 'Swollen lining', '16', '17'] }
]);
fig.start();
