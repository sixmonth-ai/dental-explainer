// Story: recurrent decay under a crown on the mandibular right first molar (FDI 46 = Universal 30). It starts at the distal crown
// margin by the gum, where plaque sits, and spreads under the crown along the prepared tooth toward the pulp, out of sight.
// poster: end
// Frame: +x = mesial, +z = buccal, CEJ (= crown margin) at y = 0. Mesio-distal cut, camera on +z: distal is on the viewer's left. mm.
// The lesion is hand-built: two thin solids (soft infected and firmer affected dentin) draped on the prepared tooth's distal
// surface, grown by one param. They are sampled by ray casts once at build, so they always follow the stump and root.
const FDI = 46;
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };   // monolithic zirconia, typical (dental-facts.md §14)
const CEMENT = 0.15;                                        // luting cement is tens of microns thick: drawn thicker to be seen

const fig = DK.figure({
  fov: 28,
  title: 'Decay under a crown',
  subtitle: 'FDI 46 (Universal 30), lower right first molar with a crown. Cut front to back.',
  view: { theta: -0.45, phi: 1.25 }
});

// --- context: bone and gum a little receded, so the distal margin sits right at the gum line
const roots = DK.tooth(FDI, { omit: ['enamel', 'dentin'] }), s = roots.spec;
const bone = DK.bone({ width: 20, height: 13, depth: 13, crest: 1.6 }); bone.position.y = -3.8;
const gum = DK.gingiva({ width: 20, height: 3.2, depth: 13.6, crest: 1.3, around: [{ x: 0, z: 0, md: s.mdC, bl: s.blC, rise: 0.8 }] }); gum.position.y = -1.6;
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the two roots.' });
fig.part(gum, { name: 'Gum', anchor: [-6.5, -1.2, 4.5], fit: false, info: 'Where the gum has pulled back a little, the crown edge and the root surface below it are open to plaque.' });

// --- own tooth (prepared stump + roots), cement film, crown
const stump = DK.prep(s, PREP); roots.group.add(stump);
const cement = DK.prep(s, { axial: PREP.axial - CEMENT, occlusal: PREP.occlusal - CEMENT, margin: PREP.margin - CEMENT }); cement.material = DK.mat('cement');
const crown = DK.restorationCrown(s, 'zirconia', PREP);
roots.group.add(cement); roots.group.add(crown);
fig.part(roots.group, { name: 'Tooth 46', label: false, info: 'Lower right first molar with a full crown: the prepared tooth under it is still living dentin and can decay.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'cannot decay itself', anchor: [1.2, s.crownL - 0.6, s.bl / 2 - 0.9], dim: false, info: 'Zirconia does not decay, and it looks perfect from outside. The tooth underneath can.' });
fig.part(roots.layers.pulp, { inPlace: true, name: 'Pulp', anchor: [0.8, 1.8, 0], dim: false, when: (e, sec) => sec.enabled, info: 'Nerve and blood vessels. Decay that reaches it causes pain and needs a root canal or extraction.' });

// --- the lesion, sampled on the distal surface of the stump (above the margin) and the root (below it)
roots.group.updateMatrixWorld(true);
const hitMeshes = []; roots.group.traverse(m => { if (m.isMesh && m !== crown && m !== cement) { let p = m, inPulp = false; while (p) { if (p === roots.layers.pulp) inPulp = true; p = p.parent; } if (!inPulp) hitMeshes.push(m); } });
const rc = new THREE.Raycaster(), NY = 44, NZ = 34, Y0 = -1.6, Y1 = 4.6, W = s.blC * 0.42;
const surf = [];   // surf[i][j] = x of the distal surface at (y, z), or null
for (let i = 0; i <= NY; i++) {
  surf.push([]);
  for (let j = 0; j <= NZ; j++) {
    const y = Y0 + (Y1 - Y0) * i / NY, z = -W + 2 * W * j / NZ;
    rc.set(new THREE.Vector3(-20, y, z), new THREE.Vector3(1, 0, 0));
    const h = rc.intersectObjects(hitMeshes, false); surf[i].push(h.length ? h[0].point.x : null);
  }
}
const MARGIN_Y = 0.15, lesion = { k: 0 };
// depth (mm into dentin, along +x) at grid cell for growth k: deepest just above the margin, tapering up under the crown and down the root
function depthAt(y, z, k, scale) {
  const up = 0.6 + 3.6 * k, down = 0.5 + 0.9 * k, dmax = (0.4 + 0.75 * k) * scale;
  const t = y >= MARGIN_Y ? (y - MARGIN_Y) / up : (MARGIN_Y - y) / down;
  const fy = t >= 1 ? 0 : Math.pow(1 - t * t, 0.75), wz = W * (0.45 + 0.55 * k), fz = Math.abs(z) >= wz ? 0 : Math.pow(1 - (z / wz) ** 2, 0.6);
  return dmax * fy * fz;
}
function lesionGeometry(k, scale) {
  const pos = [], idx = [], at = (i, j, side) => (side * (NY + 1) + i) * (NZ + 1) + j;
  for (let side = 0; side < 2; side++) for (let i = 0; i <= NY; i++) for (let j = 0; j <= NZ; j++) {
    const y = Y0 + (Y1 - Y0) * i / NY, z = -W + 2 * W * j / NZ, sx = surf[i][j] ?? -s.mdC / 2 + PREP.axial, d = depthAt(y, z, k, scale);
    const outer = sx - (d > 0.01 ? (y > MARGIN_Y ? 0.01 : 0.07) : 0);   // under the crown it fills the cement line too (the kit's cement film lies just inside the prep surface)
    pos.push(side ? sx + d : outer, y, z);
  }
  for (let i = 0; i < NY; i++) for (let j = 0; j < NZ; j++) {
    const a = at(i, j, 0), b = at(i + 1, j, 0), c = at(i + 1, j + 1, 0), d = at(i, j + 1, 0);
    idx.push(a, d, b, b, d, c);   // outer face (toward −x)
    const A = at(i, j, 1), B = at(i + 1, j, 1), C = at(i + 1, j + 1, 1), D = at(i, j + 1, 1);
    idx.push(A, B, D, B, C, D);   // inner face
  }
  const rim = (a0, b0, a1, b1) => idx.push(a0, a1, b0, b0, a1, b1);
  for (let i = 0; i < NY; i++) { rim(at(i, 0, 0), at(i + 1, 0, 0), at(i, 0, 1), at(i + 1, 0, 1)); rim(at(i + 1, NZ, 0), at(i, NZ, 0), at(i + 1, NZ, 1), at(i, NZ, 1)); }
  for (let j = 0; j < NZ; j++) { rim(at(0, j + 1, 0), at(0, j, 0), at(0, j + 1, 1), at(0, j, 1)); rim(at(NY, j, 0), at(NY, j + 1, 0), at(NY, j, 1), at(NY, j + 1, 1)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const infected = new THREE.Mesh(lesionGeometry(0, 1), DK.mat('cariesSoft'));
const affected = new THREE.Mesh(lesionGeometry(0, 1.4), DK.mat('cariesFirm'));
roots.group.add(affected); roots.group.add(infected);
Object.assign(infected.material, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });   // wins over the firmer zone and the root where they meet
const setLesion = k => {
  lesion.k = k; infected.visible = affected.visible = k > 0.02;
  [[infected, 1], [affected, 1.4]].forEach(([m, sc]) => {   // update in place: the section caps share this geometry
    const g = lesionGeometry(Math.max(k, 0.02), sc), p = m.geometry.attributes.position;
    p.array.set(g.attributes.position.array); p.needsUpdate = true; g.dispose(); m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox();
  });
};
fig.part(infected, { inPlace: true, name: 'Decay', sub: 'starts at the crown edge', accent: true, anchor: () => [(surf[Math.round((MARGIN_Y - Y0) / (Y1 - Y0) * NY)][NZ / 2] ?? -4) + 0.1, MARGIN_Y - 0.2, 0], dim: false, when: () => infected.visible, info: 'Plaque left at the edge of the crown dissolves the tooth at the seam. It is often painless and hidden until it is large.' });
fig.part(infected, { inPlace: true, name: 'Hidden spread', sub: 'under the crown', anchor: () => { const y = 0.6 + 2.6 * lesion.k, i = Math.round((y - Y0) / (Y1 - Y0) * NY), sx = surf[i][NZ / 2] ?? -4; return [sx + depthAt(y, 0, lesion.k, 1) * 0.5, y, 0]; }, dim: false, when: (e, sec) => sec.enabled && lesion.k > 0.45, info: 'Under the crown, decay runs along the softer dentin toward the pulp. It cannot be seen in the mouth; a bite-wing X-ray or loosening of the crown finds it.' });
fig.part(stump, { inPlace: true, name: 'Crown edge', anchor: [-(s.mdC / 2) + 0.25, 0.3, s.blC / 2 - 0.8], dim: false, info: 'The margin: the seam where crown meets tooth. Floss and brush here every day.' });

fig.param('decay', 1, setLesion);
fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [crown], color: DK.COLORS.zirconiaCap },
  { objects: [cement], color: DK.COLORS.cement, kind: 'plain' },
  { objects: [roots.layers.root, stump], color: DK.COLORS.dentinCap },
  { objects: [roots.layers.pulp], color: DK.COLORS.pulpCap },
  { objects: [affected], color: DK.COLORS.cariesFirm, kind: 'dentin' },
  { objects: [infected], color: DK.COLORS.cariesSoft, kind: 'plain' }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', range: [-3, 3], offset: 0 } });
fig.slider('Decay', 0, 1, 0.01, 1, v => fig.goTo({ set: { decay: v } }, 0.4));

// story: a crown that looks fine → the gum line at the back of the crown: a dark seam → cut sweeps in front to back → the decay
// spreads under the crown toward the pulp → hero: crown intact outside, tooth decayed inside
const DIST = [-s.mdC / 2, -0.3, 0];
fig.story([
  { dur: 0, hold: 1.4, theta: -0.45, phi: 1.25, zoom: 1.05, set: { decay: 0 }, labels: ['Crown'] },
  { dur: 2.2, hold: 2.2, theta: -1.1, phi: 1.35, zoom: 0.42, focus: DIST, set: { decay: 0.3 }, labels: ['Decay', 'Gum'] },
  { fov: 24, dur: 2.2, hold: 0.2, theta: 0, phi: 1.45, zoom: 0.95, focus: 'auto', labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.4, offset: 0, labels: ['Decay', 'Crown'] },
  { dur: 2.6, hold: 1.8, zoom: 0.7, focus: [-1.6, 2.2, 0], set: { decay: 1 }, labels: ['Hidden spread', 'Pulp'] },
  { dur: 1.8, hold: 2.8, theta: -0.3, phi: 1.36, zoom: 1.05, focus: [-0.6, -3.7, 0], labels: ['Crown', 'Decay', 'Hidden spread', 'Pulp'] }   // teaching shot
]);
fig.start();
