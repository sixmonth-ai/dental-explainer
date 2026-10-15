// Dentin hypersensitivity on the mandibular left first premolar (FDI 34 = Universal 21) with buccal gum recession; story in a bucco-lingual cut (frame: +x mesial, +z buccal, CEJ at y = 0; camera on the mesial side, buccal on the viewer's left).
// poster: end
// Hydrodynamic theory (Brännström): cold on exposed root dentin moves the fluid in open tubules, which excites the nerve endings at the pulp. Tubules and fluid drawn enlarged (real tubules are ~1–3 µm wide). Sizes in mm.
const FDI = 34, CUT = 0;
const fig = DK.figure({
  fov: 26,
  title: 'Why teeth are sensitive',
  subtitle: 'Lower left first premolar, FDI 34 (Universal 21), with gum recession.',
  view: { theta: Math.PI / 2 - 0.7, phi: 1.3 }
});

// --- tooth, receded gum, bone crest lowered with it
const tooth = DK.tooth(FDI), s = tooth.spec, L = tooth.layers;
const MARGIN = -2.6;                      // gum margin 2.6 mm below the CEJ: that much root is exposed
const CREST = MARGIN - 1.8;               // bone stays ~2 mm below the margin
const bone = DK.bone({ width: 12, height: 15, depth: 10, cortical: 1.2, crest: 1.4 }); bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: MARGIN, crest: CREST, width: 12.4, depth: 10.6 });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Jawbone; it recedes with the gum.' });
let gumZ = s.blC / 2;
fig.part(gum, { name: 'Gum recession', sub: `${DK.mm(-MARGIN)} of root exposed`, anchor: () => [CUT + 0.1 - gum.position.x, MARGIN - 0.5 - gum.position.y, gumZ + 0.5 - gum.position.z], labelOffset: [-90, 30], dim: false, info: 'The gum has pulled back from the crown (brushing too hard, gum disease, thin gums), exposing root surface that is not covered by enamel.' });
fig.part(tooth.group, { name: 'Tooth 34', label: false, info: 'Lower left first premolar: one root, one canal.' });

// --- measure the real surfaces in the cut plane: root surface (buccal) and pulp wall, by ray casting
tooth.group.updateMatrixWorld(true);
const rc = new THREE.Raycaster(), dir = new THREE.Vector3(0, 0, -1);
const hitZ = (obj, y, from) => { rc.set(new THREE.Vector3(CUT, y, from), dir); const h = rc.intersectObject(obj, true).filter(i => !i.object.userData.isStencil); return h.length ? h[0].point.z : null; };
const TUB_Y = [-0.3, -0.6, -0.9, -1.2, -1.5, -1.8, -2.1, -2.4];
gumZ = hitZ(L.dentin, MARGIN - 0.5, 20) || gumZ;
const tubules = TUB_Y.map(y => ({ y, zo: hitZ(L.dentin, y, 20), zi: hitZ(L.pulp, y, 20) })).filter(t => t.zo != null && t.zi != null);

// tubules: thin flat ribbons lying on the cut face (enlarged), slightly S-shaped as in root dentin
const LIFT = CUT + 0.1;
const tubMat = new THREE.MeshBasicMaterial({ color: DK.color(0x4d4540), toneMapped: false, transparent: true, opacity: 0, depthTest: false });
const flowMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, transparent: true, opacity: 0, depthTest: false });
const tubPath = (t, u) => { const z = t.zo + (t.zi - t.zo) * u; return [LIFT, t.y + 0.12 * Math.sin(Math.PI * u), z]; };
function ribbon(t, w, mat) {
  const n = 16, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const p = tubPath(t, i / n); pos.push(p[0], p[1] - w / 2, p[2], p[0], p[1] + w / 2, p[2]); if (i < n) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; m.renderOrder = 3; return m;
}
const tubGroup = new THREE.Group(), flowGroup = new THREE.Group();
tubules.forEach(t => tubGroup.add(ribbon(t, 0.07, tubMat)));
// fluid: a short column in each tubule that slides toward the pulp
const beads = tubules.map(t => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), flowMat); m.renderOrder = 4; m.scale.set(1, 1, 1); m.rotation.y = Math.PI / 2; flowGroup.add(m); return { m, t }; });
const beads2 = tubules.map(t => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), flowMat); m.renderOrder = 4; m.rotation.y = Math.PI / 2; flowGroup.add(m); return { m, t }; });
fig.world.add(tubGroup); fig.world.add(flowGroup);

// the nerve: a bundle up the canal that fans out under the dentin (schematic), on the cut
const canalPts = DK.canalPath(s, 0, { n: 14 }).map(p => [CUT, p[1], p[2]]).reverse();   // apex → chamber
const nTop = canalPts[canalPts.length - 1];
const nerveMat = DK.mat('nerve', {});
const nerve = new THREE.Group();
nerve.add(DK.tube(canalPts, 0.16, nerveMat, { caps: true, taper: u => 1 - 0.3 * u }));
tubules.forEach((t, i) => { if (i % 2) return; const end = [CUT, t.y, t.zi - 0.08]; const start = [CUT, Math.min(nTop[1], t.y - 2.2), 0.1]; nerve.add(DK.tube([start, [CUT, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2 + 0.05], end], 0.07, nerveMat, { caps: true })); });
nerve.traverse(m => { if (m.isMesh) { m.renderOrder = 3; m.material.depthTest = false; m.material.transparent = true; m.material.opacity = 0; } });
fig.world.add(nerve);

// the cold: a drop of iced water on the exposed root
const drop = DK.lathe([[0, -0.9], [0.55, -0.75], [0.85, -0.35], [0.8, 0.15], [0.5, 0.55], [0.18, 0.9], [0, 1.15]], 32, DK.mat('enamel', { color: 0x86a6bf, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.92 }));
const T0 = tubules[Math.floor(tubules.length / 2)];
drop.rotation.x = Math.PI / 2 + 0.3; drop.position.set(CUT - 0.75, T0.y, T0.zo + 0.55); drop.rotation.z = 0; drop.visible = false; fig.world.add(drop);

// --- labels
const cutOn = (e, sec) => sec.enabled;
const mid = tubules[1];
fig.part(L.enamel, { inPlace: true, name: 'Enamel', sub: 'seals the crown', anchor: [CUT, s.crownL * 0.55, s.bl / 2 - 0.4], labelOffset: [-60, -30], dim: false, info: 'Enamel has no tubules, so a covered crown does not feel cold this way.' });
fig.part(tubGroup, { inPlace: true, name: 'Open tubules', sub: 'shown enlarged', anchor: () => tubPath(mid, 0.45), dim: false, when: () => tubMat.opacity > 0.3, info: 'Dentin is full of microscopic fluid-filled tubes (about 1–3 µm wide) running from the root surface to the pulp. Exposed root loses its thin cementum, leaving them open.' });
fig.part(drop, { inPlace: true, name: 'Cold', anchor: [0, 0, 0], dim: false, when: () => drop.visible, info: 'Cold drinks, air or sweet food on exposed dentin.' });
fig.part(flowGroup, { inPlace: true, name: 'Fluid moves', anchor: () => beads[beads.length - 1].m.position.toArray(), accent: true, dim: false, when: () => flowMat.opacity > 0.3, info: 'Cold makes the fluid in the tubules shift quickly. That movement, not the cold itself, tugs on nerve endings at the inner end (the hydrodynamic theory). Sensitivity toothpastes plug or calm the tubules.' });
fig.part(nerve, { inPlace: true, name: 'Nerve', sub: 'a sharp, short twinge', anchor: () => { const t = tubules[0]; return [CUT, t.y - 0.3, t.zi - 0.3]; }, dim: false, when: () => nerveOn > 0.3, info: 'Nerve fibres in the pulp reach just into the inner tubules. The fluid shift fires them: a sharp pain that stops when the stimulus goes. A lingering ache points to something else, such as decay or a crack.' });

// --- params
let nerveOn = 0;
const NERVE = DK.color(DK.COLORS.nerve), HOT = DK.color(0xe6c56a);
fig.param('tubules', 0, v => { tubMat.opacity = 0.9 * v; tubGroup.visible = v > 0.01; });
fig.param('cold', 0, v => { drop.visible = v > 0.02; drop.scale.setScalar(Math.max(0.01, 0.75 * v)); });
fig.param('flow', 0, v => {
  flowMat.opacity = v > 0.001 ? 1 : 0; flowGroup.visible = v > 0.001;
  beads.forEach(b => b.m.position.fromArray(tubPath(b.t, 0.12 + 0.8 * v)));
  beads2.forEach(b => b.m.position.fromArray(tubPath(b.t, 0.02 + 0.8 * v)));
});
fig.param('nerve', 0, v => { nerveOn = v; nerve.traverse(m => { if (m.isMesh) m.material.opacity = Math.min(1, v * 2); }); nerveMat.color.copy(NERVE).lerp(HOT, Math.max(0, v - 0.5) * 2); });

fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3.5, 3.5], offset: CUT } });

// --- story
const SIDE = Math.PI / 2 - 0.04, ROOT = [CUT, -1.4, (T0.zo + T0.zi) / 2];
fig.story([
  { fov: 34, dur: 0, hold: 1.6, theta: Math.PI / 2 - 0.8, phi: 1.3, zoom: 1.0, section: false, labels: ['Gum recession'], caption: 'The gum has pulled back, exposing the root.' },
  { fov: 26, dur: 2.4, hold: 0.2, theta: SIDE, phi: 1.45, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 6 },
  { dur: 2.2, hold: 1.2, offset: CUT, labels: ['Enamel', 'Gum recession'], caption: 'Enamel covers the crown, but not the root.' },
  { dur: 2.2, hold: 1.6, zoom: 0.5, focus: ROOT, set: { tubules: 1 }, labels: ['Open tubules'], caption: 'Exposed root dentin is full of open tubules.' },
  { dur: 1.0, hold: 0.8, set: { cold: 1 }, labels: ['Cold', 'Open tubules'], caption: 'Something cold touches it.' },
  { dur: 1.6, hold: 1.0, set: { flow: 1 }, labels: ['Cold', 'Fluid moves'], caption: 'The fluid in the tubules shifts toward the pulp.' },
  { dur: 1.0, hold: 1.4, set: { nerve: 1 }, labels: ['Fluid moves', 'Nerve'], caption: 'Nerve endings fire: a sharp twinge.' },
  { dur: 2.4, hold: 2.6, zoom: 0.64, focus: [CUT, 0.9, ROOT[2] - 0.2], theta: SIDE - 0.1, phi: 1.45, labels: ['Gum recession', 'Open tubules', 'Cold', 'Fluid moves', 'Nerve'] }
]);
fig.start();
