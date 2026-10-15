// Crowded teeth: the lower arch (FDI 47 to 37, crowns in their gum ridge). The back teeth drift forward, the arch gets shorter than the front teeth need, and the incisors overlap and turn to fit. Frame: the DK.arch mandibular frame (+x = patient's left, +z anterior, y up, CEJs at y = 0).
// poster: end
// The crowded positions are solved, not typed: each front tooth gets a turn and a step in or out (below), then slides along the arch
// from the midline until it no longer overlaps the teeth already placed (crown outlines as ellipses, MD × BL). The canines end up
// nearer the midline than in the aligned arch, and the back teeth move forward by the same amount, so the shortage shown is
// exactly the room the front teeth no longer have.
const fig = DK.figure({
  fov: 32,
  title: 'Crowded teeth',
  subtitle: 'Lower teeth from above, front at the bottom. FDI 47 to 37.',
  view: { theta: 0, phi: 0.5, margin: 0.8 }
});
const crowns = (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] });
const arch = DK.arch({ jaw: 'mandible', build: crowns });
const scene = new THREE.Group(); scene.add(arch.group);
fig.part(scene, { name: 'Lower teeth', label: false, info: 'The lower teeth from second molar to second molar.' });

// --- the arch line, by arc length from the midline (right side negative)
const W = arch.width, curvePts = [];
for (let i = -400; i <= 400; i++) { const c = arch.curve(W / 2 * i / 400 * 1.2); curvePts.push(c); }
const arc = [0]; for (let i = 1; i < curvePts.length; i++) arc.push(arc[i - 1] + Math.hypot(curvePts[i][0] - curvePts[i - 1][0], curvePts[i][1] - curvePts[i - 1][1]));
const mid = arc[400]; arc.forEach((v, i) => { arc[i] = v - mid; });
function at(s) {   // point, tangent (toward +x) and outward normal at arc length s
  let i = 1; while (i < arc.length - 1 && arc[i] < s) i++;
  const f = (s - arc[i - 1]) / (arc[i] - arc[i - 1]), a = curvePts[i - 1], b = curvePts[i];
  const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], tl = Math.hypot(b[0] - a[0], b[1] - a[1]), t = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
  return { p, t, n: [-t[1], t[0]] };   // t points toward +x; outward (away from the arch centre, +z at the midline) = (−t.z, t.x)
}
const sOf = c => { let best = 0, d = Infinity; for (let i = 0; i < curvePts.length; i++) { const e = Math.hypot(curvePts[i][0] - c[0], curvePts[i][1] - c[1]); if (e < d) { d = e; best = arc[i]; } } return best; };

// --- each tooth: aligned pose (from DK.arch) and its outline in plan
const teeth = arch.teeth.map(t => {
  const g = t.tooth.group, s0 = sOf(t.slot.c);
  return { fdi: t.fdi, t, g, s0, side: t.slot.side === 'right' ? -1 : 1, a: t.spec.md / 2, b: t.spec.bl / 2 * 0.8,
    pos0: g.position.clone(), q0: g.quaternion.clone(), ang0: Math.atan2(at(s0).t[1], at(s0).t[0]) };
});
const byFdi = f => teeth.find(k => k.fdi === f);
// plan outline of a tooth at arc length s, `off` mm outward (+) or inward (−), turned by `rot` (rad, about the vertical)
function outline(k, s, off, rot) {
  const f = at(s), c = [f.p[0] + f.n[0] * off, f.p[1] + f.n[1] * off], ang = Math.atan2(f.t[1], f.t[0]) + rot, out = [];
  for (let i = 0; i < 48; i++) { const u = i / 48 * Math.PI * 2, x = k.a * Math.cos(u), z = k.b * Math.sin(u); out.push([c[0] + x * Math.cos(ang) - z * Math.sin(ang), c[1] + x * Math.sin(ang) + z * Math.cos(ang)]); }
  return { c, ang, rot, pts: out, a: k.a, b: k.b };
}
const inside = (q, e) => { const dx = q[0] - e.c[0], dz = q[1] - e.c[1], x = dx * Math.cos(e.ang) + dz * Math.sin(e.ang), z = -dx * Math.sin(e.ang) + dz * Math.cos(e.ang); return (x * x) / (e.a * e.a) + (z * z) / (e.b * e.b) < 1; };
const overlaps = (e1, e2) => e1.pts.some(q => inside(q, e2)) || e2.pts.some(q => inside(q, e1));
// the crowding pattern (lower incisors are the classic site): 41 and 31 turned into a shallow V, 42 blocked out toward the tongue
// behind its neighbours, 32 turned on its long axis, the canines a little toward the lip
const PLAN = { 41: { off: 0.6, rot: 0.3 }, 31: { off: -1.3, rot: -0.35 }, 42: { off: -3.4, rot: 0.45 }, 32: { off: 0.9, rot: 0.55 }, 43: { off: 0.7, rot: -0.12 }, 33: { off: 0.5, rot: 0.1 } };
const placed = [], crowd = {}, lastS = { [-1]: 0, [1]: 0 };
[41, 31, 42, 32, 43, 33].forEach(f => {
  const k = byFdi(f), P = PLAN[f]; let s = lastS[k.side] + k.side * 0.05, e;
  for (let i = 0; i < 600; i++) { e = outline(k, s, P.off, P.rot); if (!placed.some(o => overlaps(e, o))) break; s += k.side * 0.05; }
  placed.push(e); crowd[f] = { s, e }; lastS[k.side] = s;
});
// how much shorter each side of the arch became: the canine's distal contact, crowded vs aligned
const distal = (k, s) => Math.abs(s) + k.a;
const short = side => { const k = byFdi(side < 0 ? 43 : 33); return distal(k, k.s0) - distal(k, crowd[k.fdi].s); };
const SHORT = { [-1]: short(-1), [1]: short(1) };
teeth.forEach(k => { if (!crowd[k.fdi]) crowd[k.fdi] = { s: k.s0 - k.side * SHORT[k.side], e: outline(k, k.s0 - k.side * SHORT[k.side], 0, 0) }; });

// --- crowded pose of each tooth, then a lerp between the two
const Y = new THREE.Vector3(0, 1, 0);
teeth.forEach(k => {
  const C = crowd[k.fdi], f = at(C.s), off = PLAN[k.fdi] ? PLAN[k.fdi].off : 0;
  k.pos1 = new THREE.Vector3(f.p[0] + f.n[0] * off, 0, f.p[1] + f.n[1] * off);
  const turn = (Math.atan2(f.t[1], f.t[0]) - k.ang0) + (PLAN[k.fdi] ? PLAN[k.fdi].rot : 0);
  k.q1 = new THREE.Quaternion().setFromAxisAngle(Y, -turn).multiply(k.q0);   // rotation about +y by −angle turns +x toward +z... in three's convention
});
// the gum for both states: the same grid, so it can morph vertex by vertex
const gumA = DK.gingivaArch(arch);
const slots1 = {};
// the ridge follows the arch line with only half of each tooth's step in or out, so it stays smooth under the staggered incisors
teeth.forEach(k => {
  const e = crowd[k.fdi].e, f = at(crowd[k.fdi].s), off = (PLAN[k.fdi] ? PLAN[k.fdi].off : 0) * 0.5, t = [f.t[0] * -k.side, f.t[1] * -k.side];
  slots1[k.fdi] = Object.assign({}, k.t.slot, { c: [f.p[0] + f.n[0] * off, f.p[1] + f.n[1] * off], t, n: [t[1], -t[0]] });
});
Object.values(slots1).forEach(sl => { const out = [sl.c[0], sl.c[1] + 20]; if (sl.n[0] * out[0] + sl.n[1] * out[1] < 0) sl.n = [-sl.n[0], -sl.n[1]]; });
const gumB = DK.gingivaArch({ group: arch.group, teeth: arch.teeth, slots: slots1 });
const gpA = Float32Array.from(gumA.geometry.attributes.position.array), gpB = gumB.geometry.attributes.position.array;
scene.add(gumA);
fig.part(gumA, { inPlace: true, name: 'Gum', label: false, info: 'Gum along the lower teeth (schematic).' });
teeth.forEach(k => fig.part(k.g, { inPlace: true, name: 'FDI ' + k.fdi, label: false, info: `${k.t.spec.name}, FDI ${k.fdi} (Universal ${DK.toothNumber(k.fdi, 'universal')}).` }));

let crowdNow = 0;
fig.param('crowd', 0, v => {
  crowdNow = v;
  teeth.forEach(k => { k.g.position.lerpVectors(k.pos0, k.pos1, v); k.g.quaternion.copy(k.q0).slerp(k.q1, v); });
  const P = gumA.geometry.attributes.position.array; for (let i = 0; i < P.length; i++) P[i] = gpA[i] + (gpB[i] - gpA[i]) * v;
  gumA.geometry.attributes.position.needsUpdate = true; gumA.geometry.computeVertexNormals();
});

// --- labels and readout (all from the solved geometry)
const need = [43, 42, 41, 31, 32, 33].reduce((a, f) => a + byFdi(f).t.spec.md, 0), lack = SHORT[-1] + SHORT[1];
const mm = v => v.toFixed(1) + ' mm';
const k42 = byFdi(42), k32 = byFdi(32), k46 = byFdi(46);
fig.part(k42.g, { inPlace: true, name: 'Pushed back', sub: 'no room in line', accent: true, anchor: [0, k42.t.spec.crownL, 0], labelOffset: [-90, -60], dim: false, when: () => crowdNow > 0.6,
  info: 'Lower right lateral incisor, FDI 42 (Universal 26). With no room left in the line it erupted behind its neighbours.' });
fig.part(k32.g, { inPlace: true, name: 'Turned', anchor: [0, k32.t.spec.crownL, 0], labelOffset: [90, -60], dim: false, when: () => crowdNow > 0.6,
  info: 'Lower left lateral incisor, FDI 32 (Universal 23), turned on its long axis to fit the space it has.' });
fig.part(k46.g, { inPlace: true, name: 'Back teeth', sub: 'drifted forward', anchor: [0, k46.t.spec.crownL, 0], labelOffset: [-90, 0], dim: false, when: () => crowdNow > 0.6,
  info: 'When the back teeth come forward (for example after baby molars are lost early), the arch gets shorter and the front teeth run out of room.' });
fig.part(arch.group, { inPlace: true, name: 'Arch', sub: `${mm(lack)} short`, anchor: [0, 3, -14], labelOffset: [0, -50], dim: false, when: () => crowdNow > 0.6,
  info: `The six front teeth need ${mm(need)} along the arch; this arch is ${mm(lack)} shorter. Room is made by widening the arch, slimming the teeth slightly between them (stripping) or taking out a tooth, then aligning with braces or aligners.` });
fig.setReadout([{ k: 'Front six teeth need', v: mm(need) }, { k: 'Arch short by', v: [{ v: mm(lack), cls: 'warn' }] }]);

fig.view('Aligned', { theta: 0, phi: 0.5, zoom: 1, focus: 'auto', set: { crowd: 0 }, labels: [] }, 1.4);
fig.view('Crowded', { theta: 0, phi: 0.5, zoom: 1, focus: 'auto', set: { crowd: 1 }, labels: ['Pushed back', 'Turned', 'Back teeth', 'Arch'] }, 1.4);

const FRONT = [0, 6, -4];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.0, zoom: 1, labels: [], caption: 'Lower teeth with room for all of them.' },
  { dur: 2.2, hold: 0.4, theta: 0, phi: 0.5, labels: [] },
  { dur: 3.0, hold: 1.4, set: { crowd: 1 }, labels: ['Back teeth', 'Arch'], caption: 'The back teeth drift forward and the arch gets shorter.' },
  { dur: 2.2, hold: 2.2, theta: 0.15, phi: 0.75, zoom: 0.55, focus: FRONT, labels: ['Pushed back', 'Turned'], caption: 'The front teeth overlap and turn to fit.' },
  { dur: 2.2, hold: 2.4, theta: 0, phi: 0.72, zoom: 0.8, focus: [0, 4, -12], labels: ['Pushed back', 'Turned', 'Back teeth', 'Arch'] }
]);
fig.start();
