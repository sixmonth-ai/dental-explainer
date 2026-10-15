// Story: early childhood caries ("baby bottle tooth decay") on a toddler's 20 primary teeth, both arches in occlusion seen from the front. Frame: DK.arch frame (midline x = 0, patient's right at -x, anterior +z, y up); lower CEJs at y = 0, the upper arch crown-down above it.
// poster: end
// Milk or juice held in the mouth at night pools between the upper lip and the upper incisors; plaque bacteria turn its sugar into acid.
// Decay starts as chalky bands at the gum line of the upper incisors (white spots), then breaks down into brown cavities, then reaches the
// upper first molars; the lower incisors are covered by the tongue and bathed by saliva, so they are spared. Lesions are drawn as thin
// decals on the facial enamel (outside views only, no cut): schematic.
const fig = DK.figure({
  fov: 30,
  title: 'Baby bottle tooth decay',
  subtitle: 'Primary teeth of a toddler, front view. Patient’s right on the left.',
  view: { theta: 0.35, phi: 1.5, margin: 0.8 }
});

// ---------- the two arches in occlusion ----------
const lower = DK.arch({ jaw: 'mandible', dentition: 'primary', crownsOnly: true });
const upper = DK.arch({ jaw: 'maxilla', dentition: 'primary', placement: 'jaw', crownsOnly: true });
const find = (a, f) => a.teeth.find(t => t.fdi === f);
const u51 = find(upper, 51), l71 = find(lower, 71), l81 = find(lower, 81);
const OVERBITE = 1.5, OVERJET = 1.0;   // primary incisors meet with a small overlap (schematic)
upper.group.position.y = l71.spec.crownL + u51.spec.crownL - OVERBITE;
// put the upper incisors' palatal faces just in front of the lower incisors' labial faces
upper.group.position.z = (l71.slot.c[1] + l71.spec.bl / 2) - (u51.slot.c[1] - u51.spec.bl / 2) + OVERJET * 0.4;
const jaws = new THREE.Group(); jaws.add(lower.group, upper.group);
fig.world.add(jaws);
const gumL = DK.gingivaArch(lower), gumU = DK.gingivaArch(upper);
fig.world.add(gumL, gumU);

fig.part(jaws, { name: 'Teeth', label: false, info: 'A toddler’s 20 primary teeth: all are usually through by about 2½ to 3 years.' });
fig.part(gumU, { inPlace: true, name: 'Gum', label: false, fit: false, info: 'Gum around the upper teeth.' });
fig.part(gumL, { inPlace: true, name: 'Gum ', label: false, fit: false, info: 'Gum around the lower teeth.' });

// ---------- lesions: decals on the facial (labial / buccal) enamel ----------
// A thin slab over the crown surface from y0 to y1 (mm above the CEJ), across the facial face, lifted a hair off the enamel.
function decal(t, y0, y1, wFrac, lift, mat, flat) {
  const sp = t.spec, cs = DK.crownSurface(sp, 1), hw = sp.md / 2 * wFrac;
  const NU = 24, NV = 10;
  const g = DK.slabGeometry(NU, NV, (i, j) => {
    const u = 2 * i / NU - 1, x = hw * u;
    // a crescent hugging the gum line: tallest mid-facial, thinning toward the proximal edges, with a slightly wavy upper edge
    const top = flat ? y1 : y0 + (y1 - y0) * (0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - u * u))) * (1 + 0.06 * Math.sin(u * 7 + sp.md));
    const y = y0 + (top - y0) * j / NV;
    const s = cs.at(x, y), p = s.p, n = s.n;
    return [[p[0] + n[0] * 0.01, p[1] + n[1] * 0.01, p[2] + n[2] * 0.01], [p[0] + n[0] * lift, p[1] + n[1] * lift, p[2] + n[2] * lift]];
  });
  const m = new THREE.Mesh(g, mat); m.renderOrder = 3; t.tooth.group.add(m); return m;
}
const chalkMat = new THREE.MeshBasicMaterial({ color: DK.color(0xFFFFFF), toneMapped: false, transparent: true, opacity: 0 });
const haloMat = new THREE.MeshBasicMaterial({ color: DK.color(0xB09A74), toneMapped: false, transparent: true, opacity: 0 });
const brownMat = DK.mat('enamel', { color: 0x8C6A45, roughness: 0.8, clearcoat: 0, transparent: true, opacity: 0 });
const darkMat = DK.mat('enamel', { color: 0x4E3A27, roughness: 0.7, clearcoat: 0, transparent: true, opacity: 0 });
[haloMat, chalkMat, brownMat, darkMat].forEach(m => { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; m.depthWrite = false; });

const UPPER_FRONT = [51, 52, 61, 62].map(f => find(upper, f));
const spots = [], cavities = [], cores = [], halos = [];
UPPER_FRONT.forEach(t => {
  const cl = t.spec.crownL;
  halos.push(decal(t, 0.2, cl * 0.47, 0.92, 0.04, haloMat));
  spots.push(decal(t, 0.25, cl * 0.42, 0.86, 0.06, chalkMat));
  cavities.push(decal(t, 0.35, cl * 0.30, 0.66, 0.09, brownMat));
  cores.push(decal(t, 0.55, cl * 0.20, 0.42, 0.12, darkMat));
});
// upper canines and first molars follow later: white spots only (buccal, at the gum line)
const LATER = [53, 63, 54, 64].map(f => find(upper, f));
const laterHalos = LATER.map(t => decal(t, 0.2, t.spec.crownL * 0.43, 0.84, 0.04, haloMat));
const laterSpots = LATER.map(t => decal(t, 0.25, t.spec.crownL * 0.38, 0.8, 0.06, chalkMat));
const laterMat = brownMat.clone(); laterMat.opacity = 0;
const laterCav = LATER.map(t => decal(t, 0.35, t.spec.crownL * 0.26, 0.55, 0.09, laterMat));

// ---------- the milk pool: a thin film over the labial surfaces of the upper front teeth, under the lip ----------
const milkMat = new THREE.MeshPhysicalMaterial({ color: DK.color(0xE9DCBC), roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15, transparent: true, opacity: 0, depthWrite: false });
const milk = [53, 52, 51, 61, 62, 63].map(f => decal(find(upper, f), 0.0, find(upper, f).spec.crownL * 0.75, 1.02, 0.5, milkMat, true));

// ---------- labels ----------
const anchorOn = (t, y, x) => { const s = DK.crownSurface(t.spec, 1).at(x || 0, y); return [s.p[0] + s.n[0] * 0.2, s.p[1], s.p[2] + s.n[2] * 0.2]; };
const u61 = find(upper, 61), u54 = find(upper, 54);
fig.part(milk[3], { inPlace: true, name: 'Milk pools here', sub: 'behind the upper lip', anchor: anchorOn(u61, u61.spec.crownL * 0.55), labelOffset: [90, 70], dim: false,
  when: () => milkMat.opacity > 0.2, info: 'Milk, formula or juice sipped at night stays around the upper front teeth: saliva flow drops during sleep, so the sugar is not washed away.' });
fig.part(spots[2], { inPlace: true, name: 'White spots', sub: 'at the gum line', anchor: anchorOn(u61, 0.9, 0.6), labelOffset: [100, 60], dim: false,
  when: () => chalkMat.opacity > 0.5 && brownMat.opacity < 0.5, info: 'Chalky bands where plaque acid has dissolved enamel under the surface. At this stage fluoride and stopping night feeds can still harden it again.' });
fig.part(cavities[0], { inPlace: true, name: 'Upper front teeth', sub: 'decay first', accent: true, anchor: anchorOn(u51, 1.0), labelOffset: [-100, -70], dim: false,
  when: () => brownMat.opacity > 0.5, info: 'Upper primary incisors, FDI 51, 52, 61, 62 (Universal E, D, F, G). They are among the first teeth to erupt and the ones the pooled liquid touches longest, so they decay first: brown cavities along the gum line.' });
fig.part(laterCav[0], { inPlace: true, name: 'Canines and molars', sub: 'next', anchor: anchorOn(find(upper, 53), 1.0), labelOffset: [-90, -60], dim: false,
  when: () => laterMat.opacity > 0.5, info: 'The upper canines and first molars (FDI 53, 63, 54, 64) are usually affected next.' });
fig.part(l81.tooth.group, { inPlace: true, name: 'Lower front teeth', sub: 'shielded by the tongue', anchor: anchorOn(l81, l81.spec.crownL * 0.45), labelOffset: [-80, 70], dim: false,
  info: 'While sucking, the tongue lies over the lower incisors and saliva from glands under the tongue bathes them, so they are usually spared.' });

// ---------- params ----------
fig.param('milk', 0, v => { milkMat.opacity = 0.78 * v; milk.forEach(m => { m.visible = v > 0.01; }); });
fig.param('spot', 0, v => { chalkMat.opacity = 0.95 * v; haloMat.opacity = 0.85 * v; spots.concat(laterSpots, halos, laterHalos).forEach(m => { m.visible = v > 0.01; }); });
fig.param('later', 0, v => { laterMat.opacity = 0.9 * v; laterCav.forEach(m => { m.visible = v > 0.01; }); });
fig.param('cavity', 0, v => {
  brownMat.opacity = 0.95 * DK.util.clamp(v * 1.6, 0, 1); darkMat.opacity = 0.95 * DK.util.clamp(v * 1.6 - 0.6, 0, 1);
  cavities.forEach(m => { m.visible = v > 0.01; }); cores.forEach(m => { m.visible = v > 0.35; });
});

fig.standardControls({ explode: false });

const FRONT = { theta: 0, phi: 1.52 };
fig.story([
  { dur: 0, hold: 1.4, theta: 0.55, phi: 1.35, zoom: 1.05, set: { milk: 0, spot: 0, cavity: 0, later: 0 }, labels: ['Lower front teeth'] },
  Object.assign({ dur: 2.4, hold: 2.0, zoom: 0.7, focus: [0, 5, 3], set: { milk: 1 }, labels: ['Milk pools here'] }, FRONT),
  { dur: 2.2, hold: 2.0, zoom: 0.55, focus: [3, 8, 6], set: { spot: 1, milk: 0.4 }, labels: ['White spots'] },
  { dur: 2.4, hold: 2.0, set: { cavity: 1, milk: 0 }, labels: ['Upper front teeth'] },
  { dur: 2.4, hold: 2.6, theta: 0.22, phi: 1.5, zoom: 0.68, focus: [0, 4, 0], drift: 0, set: { later: 1 }, labels: ['Upper front teeth', 'Canines and molars', 'Lower front teeth'] }
]);
fig.start();
