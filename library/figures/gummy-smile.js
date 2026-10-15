// Fixing a gummy smile: the upper front teeth (FDI 13 to 23 = Universal 6 to 11) in the mouth, crowns down, seen from the front.
// poster: step 3
// Excess gum covers about 3 mm of each crown (short, square-looking teeth). The new gum line is marked near the CEJ, the gum is
// trimmed back to it with a soft-tissue laser, and it heals with the full crowns showing (gingivectomy; dental-facts.md §6, §13).
// Frame: DK.arch maxilla in the mouth: +x = patient's left, +z = anterior (toward the viewer), y up, every CEJ at y = 0 (crowns
// hang down to -y). The gum is DK.gingivaArch (healthy margin ~0.5 mm on the enamel); the excess state is the same mesh slid
// coronally by EXCESS and pushed out of the crowns, and a trim front sweeps it back tooth by tooth.
const { smooth, lerp, clamp } = DK.util;
const EXCESS = 3.0;          // about 3 mm of extra gum over each crown (illustrative; varies by patient)

const fig = DK.figure({
  fov: 30,
  title: 'Fixing a gummy smile',
  subtitle: 'Upper front teeth, FDI 13 to 23 (Universal 6 to 11), in the mouth.',
  view: { theta: 0.0, phi: 1.74, margin: 0.8 }
});
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0 });

// ---------- teeth: crowns only (the roots sit inside the gum and are never seen from the front)
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [13, 12, 11, 21, 22, 23], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
fig.part(arch.group, { name: 'Upper front teeth', label: false, info: 'Upper canines, lateral and central incisors (FDI 13 to 23, Universal 6 to 11).' });
arch.group.updateMatrixWorld(true);
const T = {}; arch.teeth.forEach(t => { T[t.fdi] = t; fig.part(t.tooth.group, { inPlace: true, name: t.spec.name || String(t.fdi), label: false, info: `${t.spec.name || 'Tooth'}, FDI ${t.fdi}. Its full crown is about ${DK.mm(t.spec.crownL)} long.` }); });

// ---------- gum: the healthy ridge (margin ~0.5 mm on the enamel) and the same ridge built EXCESS mm further down the crowns.
// The excess ridge comes from a twin arch slid coronally whose cervical outlines are the crowns' outlines at that height (plus
// a little bulk), so its free margin hugs the enamel cleanly; both have the same mesh layout, so one can morph into the other.
const H = 8;                 // the attached gum band above the margins
const gum = DK.gingivaArch(arch, { height: H, depth: 3.4 });
const twin = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [13, 12, 11, 21, 22, 23], build: (fdi, spec) => ({ group: new THREE.Group(), layers: {}, spec }) });
twin.teeth.forEach(t => { const sp = t.spec, mx = DK.toothSurfaceAt(sp, EXCESS, 0).x, bz = DK.toothSurfaceAt(sp, EXCESS, Math.PI / 2).z; sp.mdC = 2 * Math.abs(mx) + 0.3; sp.blC = 2 * Math.abs(bz) + 0.8; });
fig.world.add(twin.group); twin.group.position.y -= EXCESS; twin.group.updateMatrixWorld(true);
const gumX = DK.gingivaArch(twin, { height: H + EXCESS, depth: 3.4 }); fig.world.remove(twin.group); gumX.geometry.dispose && 0;
const P0 = Float32Array.from(gum.geometry.attributes.position.array), P1 = Float32Array.from(gumX.geometry.attributes.position.array);
const X0 = -17, X1 = 17;     // trim front sweeps from the patient's right canine (-x) to the left one (+x)
const setGum = trim => {
  const p = gum.geometry.attributes.position, a = p.array, front = lerp(X0, X1, trim);
  for (let i = 0; i < a.length; i += 3) {
    const k = trim >= 1 ? 1 : trim <= 0 ? 0 : smooth(front + 1.2, front - 1.2, P0[i]);   // 1 = trimmed
    a[i] = lerp(P1[i], P0[i], k); a[i + 1] = lerp(P1[i + 1], P0[i + 1], k); a[i + 2] = lerp(P1[i + 2], P0[i + 2], k);
  }
  p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere();
};
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum over the upper front teeth. In a gummy smile it covers part of each crown, so the teeth look short and square.' });

// ---------- the planned gum line: an accent ribbon over each crown, near the CEJ (where healthy gum sits)
const lineMeshes = [];
arch.teeth.forEach(t => {
  const pts = []; for (let i = 0; i <= 28; i++) { const th = lerp(0.42, Math.PI - 0.42, i / 28), y = 0.75 + 1.25 * Math.pow(Math.abs(Math.cos(th)), 2.4), q = DK.toothSurfaceAt(t.spec, y, th), d = Math.hypot(q.x, q.z); pts.push([q.x + q.x / d * 0.1, y, q.z + q.z / d * 0.1]); }
  const m = DK.tube(pts, 0.13, accentMat, { caps: true }); m.renderOrder = 3; t.tooth.group.add(m); lineMeshes.push({ m, pts, t });
});

// ---------- the soft-tissue laser: a pen-style handpiece with a thin fibre tip (tip at the origin, pointing -y)
const laser = new THREE.Group(); fig.world.add(laser); laser.visible = false;
{
  const body = DK.mat('steel', { roughness: 0.35 }), ink = DK.mat('steel', { color: 0xa9a59c, metalness: 0.15, roughness: 0.55 });
  const fibre = DK.lathe([[0.0, 0], [0.22, 0.05], [0.22, 5.5], [0.5, 6.0], [0.5, 9.0]], 20, body);
  const hand = DK.lathe([[0.5, 9.0], [1.6, 11.0], [1.7, 14], [1.8, 24], [1.8, 30]], 32, ink);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({ color: DK.color(0xf3e7d0), toneMapped: false }));
  laser.add(fibre, hand, tip);
}
fig.part(laser, { inPlace: true, name: 'Laser', sub: 'trims the gum', anchor: [0, 16, 0], labelOffset: [-90, -40], dim: false, info: 'A soft-tissue laser (or a scalpel) cuts the gum along the marked line and seals it as it goes. Done under local anaesthetic.' });

// ---------- labels
const g11 = T[11], at11 = (y, th) => { const q = DK.toothSurfaceAt(g11.spec, y, th); return [q.x, y, q.z + 0.15]; };
const anc = new THREE.Object3D(); fig.world.add(anc);
const excessPart = fig.part(gum, { inPlace: true, name: 'Extra gum', sub: `covers about ${DK.mm(EXCESS)} of each crown`, anchor: () => { const p = new THREE.Vector3(...at11(0.6, Math.PI / 2 - 0.15)); p.z += 1.5; return g11.tooth.group.localToWorld(p).toArray(); }, labelOffset: [-130, -50], dim: false, info: 'The gum sits low on the enamel, often because it never moved up to its adult level after the teeth came in (altered passive eruption). The teeth underneath are normal length.' });
const lineL = lineMeshes.find(o => o.t.fdi === 21);
const linePart = fig.part(lineL.m, { inPlace: true, name: 'New gum line', sub: 'marked near the enamel edge', anchor: lineL.pts[14], labelOffset: [100, 60], accent: true, dim: false, info: 'The planned line follows where healthy gum sits, about where the enamel ends. Before trimming, the dentist checks that the bone is far enough below it; if not, a little bone is reshaped too (crown lengthening).' });
const crownPart = fig.part(g11.tooth.layers.enamel, { inPlace: true, name: 'Full crown', sub: `about ${DK.mm(g11.spec.crownL)} long`, anchor: at11(g11.spec.crownL * 0.55, Math.PI / 2), labelOffset: [-110, 40], dim: false, info: 'With the extra gum gone the whole crown shows, so the teeth look longer and narrower and less gum shows when smiling.' });
const healedPart = fig.part(gum, { inPlace: true, name: 'Healed gum', sub: 'about 2 weeks', anchor: () => { const t = T[22], q = DK.toothSurfaceAt(t.spec, -1.2, Math.PI / 2); return t.tooth.group.localToWorld(new THREE.Vector3(q.x, -1.2, q.z + 1.0)).toArray(); }, labelOffset: [100, 50], dim: false, info: 'The trimmed edge heals in a week or two. The result is stable when the bone sits at a healthy depth below the new gum line.' });

// ---------- params
let LAST = { trim: -1, heal: 0 };
fig.param('trim', 0, v => { LAST.trim = v; setGum(v); placeLaser(); });
fig.param('mark', 0, v => { accentMat.opacity = v; lineMeshes.forEach(o => { o.m.visible = v > 0.01; }); });
fig.param('laser', 0, v => { laser.visible = v > 0.5; placeLaser(); });
fig.param('heal', 0, v => { LAST.heal = v; });
// the laser tip rides along the marked line at the trim front
function placeLaser() {
  const x = lerp(X0, X1, clamp(LAST.trim, 0, 1));
  let best = null; lineMeshes.forEach(o => o.pts.forEach(p => { const w = o.t.tooth.group.localToWorld(new THREE.Vector3(...p)); const d = Math.abs(w.x - x); if (!best || d < best.d) best = { d, w }; }));
  laser.position.copy(best.w); laser.position.z += 0.25;
  laser.rotation.set(-0.55, 0, 0.25);        // tip into the gum line, handle down and toward the viewer (from below, like a hand)
  laser.rotation.x = Math.PI - 0.55;         // flip so the handle hangs below the teeth, toward the viewer
}
setGum(0);

fig.standardControls({ explode: false });

// ---------- procedure
const FRONT = { theta: 0.0, phi: 1.74, zoom: 0.86, focus: 'auto' };
fig.procedure([
  { label: 'Gum covers the teeth', caption: 'Extra gum covers part of each front tooth, so the teeth look short and square.', beats: [
    { dur: 0, hold: 1.4, theta: 0.42, phi: 1.8, zoom: 1.05, labels: [], set: { trim: 0, mark: 0, laser: 0, heal: 0 } },
    Object.assign({ dur: 2.4, hold: 2.2, labels: ['Extra gum'], key: true }, FRONT)] },
  { label: 'New gum line marked', caption: 'The new gum line is marked where healthy gum sits, about where the enamel ends.', beats: [
    { dur: 2.0, hold: 0.4, theta: 0.12, phi: 1.72, zoom: 0.72, focus: [2, 1.5, 6], labels: [] },
    { dur: 1.6, hold: 2.2, set: { mark: 1 }, labels: ['New gum line'], key: true }] },
  { label: 'Gum trimmed', caption: 'A laser trims the gum back to the line, tooth by tooth.', beats: [
    { dur: 0.6, hold: 0.2, set: { laser: 1 }, theta: 0.0, phi: 1.76, zoom: 0.95, focus: 'auto', labels: ['Laser'] },
    { dur: 3.6, hold: 0.4, set: { trim: 0.55 }, ease: 'linear', labels: ['Laser', 'New gum line'], key: true },
    { dur: 3.0, hold: 0.3, set: { trim: 1 }, ease: 'linear', labels: ['Laser', 'New gum line'] },
    { dur: 0.6, hold: 0.4, set: { laser: 0 }, labels: [] }] },
  { label: 'Full crowns show', caption: 'The gum heals at its new level and the full crowns show.', beats: [
    { dur: 1.4, hold: 0.2, set: { mark: 0, heal: 1 }, labels: [] },
    Object.assign({ dur: 2.2, hold: 2.6, labels: ['Full crown', 'Healed gum'], key: true }, FRONT)] }
]);
fig.start();
