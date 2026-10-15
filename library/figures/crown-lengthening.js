// Crown lengthening on a broken lower right second premolar (FDI 45 = Universal 29), bucco-lingual cut (CBCT-style slice): the
// poster: step 4
// tooth is broken below the gum, so a crown edge on sound tooth would sit almost on the bone. A flap is opened, bone is removed
// around the root with a round bur until the planned crown edge is about 3 mm above the crest, the gum heals lower, and the
// crown fits with its edge on sound tooth (dental-facts.md §6, §12, §13, §14).
// Frame: +x = mesial, +z = buccal, y up, CEJ at y = 0. The cut removes the mesial half (+x); the camera on the mesial side sees it.
const { smooth, lerp, clamp } = DK.util;
const CREST = -1.8;          // healthy crest, ~2 mm below the CEJ
const EDGE = -1.4;           // planned crown edge (finish line) on the root, below the fracture
const TOP = 0.6;             // the broken tooth: sound tooth ends here (2 mm above the planned edge, a ferrule of 1.5 to 2 mm, §12)
const GAP_NEEDED = 3.0;      // about 3 mm from the crown edge to the bone (common clinical guideline, §6)
const REMOVE = (EDGE - GAP_NEEDED) - CREST;     // bone to remove (negative: down), here 2.6 mm
const M0 = 1.6, M1 = -0.9;   // gingival margin before (over the broken edge) and after healing (sound tooth now shows)

const fig = DK.figure({
  fov: 28,
  title: 'Crown lengthening',
  subtitle: 'FDI 45 (Universal 29), lower right second premolar, cut cheek to tongue.',
  view: { theta: Math.PI / 2 - 0.15, phi: 1.42 }
});
const accentMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false });

// ---------- the broken tooth: root (root-filled) plus a stump of sound tooth up to TOP
const tooth = DK.tooth(45, { omit: ['enamel', 'dentin', 'pulp'] }), s = tooth.spec;
const gp = DK.guttaPercha(s, 0, { from: -2.4 }); tooth.group.add(gp);
// the stump and the crown are built at the CEJ by the kit (margin at y = 0); a local transform moves that margin down to EDGE,
// narrows it to the root's width there and stretches it so the crown's top stays at the natural occlusal height
const rootAt = DK.toothSurfaceAt(s, EDGE, 0).x / DK.toothSurfaceAt(s, 0, 0).x, rootAtZ = DK.toothSurfaceAt(s, EDGE, Math.PI / 2).z / DK.toothSurfaceAt(s, 0, Math.PI / 2).z;
const SY = (s.crownL - EDGE) / s.crownL;
const shifted = () => { const g = new THREE.Group(); g.position.y = EDGE; g.scale.set(rootAt, SY, rootAtZ); tooth.group.add(g); return g; };
const PREP = { axial: 1.0, occlusal: 1.5, margin: 0.5 };   // typical for monolithic zirconia (§14)
const broken = DK.prep(s, { axial: 0.04, occlusal: 0, margin: 0.02, maxY: (TOP - EDGE) / SY });
// a fracture, not a cut: roughen the top of the broken stump a little
{ const p = broken.geometry.attributes.position, yT = (TOP - EDGE) / SY; for (let i = 0; i < p.count; i++) { if (p.getY(i) > yT - 0.02) p.setY(i, yT - 0.35 * (0.5 + 0.5 * Math.sin(p.getX(i) * 2.1 + p.getZ(i) * 1.3)) - 0.25 * smooth(-1, 3, p.getZ(i))); } broken.geometry.computeVertexNormals(); }
const prep = DK.prep(s, Object.assign({ maxY: (TOP - EDGE) / SY }, PREP));
const core = DK.prep(s, Object.assign({ material: 'composite', minY: (TOP - EDGE) / SY }, PREP));   // build-up above the sound tooth
const crown = DK.restorationCrown(s, 'zirconia', PREP);
const gStump = shifted(); gStump.add(broken, prep, core); prep.visible = false; core.visible = false;
const gCrown = shifted(); gCrown.add(crown);

// ---------- bone and gum
const near = (x, z) => { const a = s.mdC / 2 * rootAt, b = s.blC / 2 * rootAtZ, rho = Math.hypot(x / a, z / b); return (rho - 1) * Math.min(a, b); };   // ~mm outside the root
const bone = DK.perioBone({ width: 14, height: 15, depth: 11, cortical: 1.1, crest: 1.3, loss: (x, z) => REMOVE * (1 - 0.35 * smooth(0.5, 6, near(x, z))), level: 0 });
bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: M0, crest: CREST + REMOVE - 0.8, width: 14.6, depth: 11.8 });
const pdl = DK.perioPdl(s, 0.2, CREST + 0.2); tooth.group.add(pdl);

// ---------- planned crown edge: an accent ring around the root at EDGE (clipped by the cut)
const ring = []; for (let i = 0; i <= 64; i++) { const th = i / 64 * Math.PI * 2, q = DK.toothSurfaceAt(s, EDGE, th), d = Math.hypot(q.x, q.z) || 1; ring.push([q.x + q.x / d * 0.08, EDGE, q.z + q.z / d * 0.08]); }
const edgeRing = DK.tube(ring, 0.16, accentMat, { caps: true }); tooth.group.add(edgeRing);

// ---------- the bur (fig.world): round bur trimming the crest on the buccal side, in front of the cut face
const bur = DK.bur({ shape: 'round', diameter: 1.4, length: 9 }); fig.world.add(bur); bur.visible = false;

// ---------- parts
fig.part(tooth.group, { name: 'Tooth 45', label: false, info: 'Lower right second premolar (Universal 29), broken below the gum and root-filled.' });
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Alveolar bone around the root.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the tooth. In surgery it is lifted as a flap, then stitched back lower.' });
const cutX = sec => (sec.enabled ? sec.offset : 0) + 0.1;
const zB = y => DK.toothSurfaceAt(s, y, Math.PI / 2).z;
fig.part(broken, { inPlace: true, name: 'Broken tooth', sub: 'edge under the gum', anchor: [0, (TOP - EDGE) / SY - 0.4, -1.5], labelOffset: [-60, -60], dim: false, info: 'The tooth has broken down below the gum line. A crown needs about 1.5 to 2 mm of sound tooth above its edge to hold on to.' });
const edgePart = fig.part(edgeRing, { inPlace: true, name: 'Crown edge', sub: 'planned', anchor: ring[16], labelOffset: [80, -30], accent: true, dim: false, info: 'Where the crown will end, on sound tooth about 2 mm below the broken edge.' });
const P = { bone: 0 };
const crestBuccal = () => CREST + bone.crestAt(0, zB(EDGE) + 0.5);
const gapNow = () => EDGE - crestBuccal();
const bonePart = fig.part(bone, { inPlace: true, name: 'Bone crest', anchor: (e, sec) => [cutX(sec), bone.crestAt(0, zB(EDGE) + 0.9) - 0.25, zB(EDGE) + 0.9], labelOffset: [90, 50], when: (e, sec) => sec.enabled, dim: false, info: 'The crown edge should stay about 3 mm above the bone so the gum can attach between them (about 2 mm of attachment plus the sulcus). Closer, and the gum stays inflamed.' });
fig.part(bur, { inPlace: true, name: 'Bur', sub: 'removes bone', anchor: [0, 3, 0], labelOffset: [90, -40], dim: false, info: 'A round bur under water spray trims the bone around the root, then hand instruments smooth it.' });
fig.part(gum, { inPlace: true, name: 'Gum', sub: 'stitched back lower', anchor: (e, sec) => [cutX(sec), M1 - 1.2 - gum.position.y, zB(0) + 1.6], labelOffset: [90, 30], when: (e, sec) => sec.enabled, dim: false, info: 'The gum flap is stitched back at the new, lower level and heals over a few weeks before the crown is made.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'edge on sound tooth', anchor: [0, s.crownL * 0.75, -s.blC / 2], labelOffset: [-80, -30], dim: false, info: 'The crown wraps sound tooth, with its edge about 3 mm above the bone.' });

// ---------- section: bucco-lingual through the root (removes the mesial half)
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [pdl], color: DK.COLORS.pdl },
  { objects: [crown], color: DK.COLORS.zirconiaCap },
  { objects: [tooth.layers.root, broken, prep], color: DK.COLORS.dentinCap },
  { objects: [core], color: DK.COLORS.compositeCap },
  { objects: [gp], color: DK.COLORS.gutta }
]);
accentMat.clippingPlanes = [fig.section.plane];
fig.standardControls({ explode: false, section: { label: 'Cut', on: true, range: [-3, 3], offset: 0 } });

// ---------- params
const placeBur = () => {   // the bur rides on the buccal crest, a little outside the root, in front of the cut face
  const k = P.bone, z = zB(EDGE) + lerp(1.6, 0.8, k), y = CREST + bone.crestAt(0, z) + 0.7;
  bur.position.set(cutX(fig.section) + 0.9, y, z); bur.rotation.set(0, 0, 0.35); bur.rotation.x = 0.5;
};
fig.param('bone', 0, k => { P.bone = k; bone.set(k); pdl.set(CREST + bone.crestAt(0, zB(EDGE) + 0.3) + 0.2); placeBur(); });
fig.param('bur', 0, v => { bur.visible = v > 0.5; placeBur(); });
fig.param('gum', 0, k => gum.set({ margin: lerp(M0, M1, k) }));
fig.param('flap', 0, v => { gum.visible = v < 0.5; });   // flap lifted: the gum is out of the way while the bone is trimmed
fig.param('crown', 0, k => { gCrown.position.y = EDGE + (1 - k) * 9; crown.visible = k > 0.01; prep.visible = core.visible = k > 0.01; broken.visible = k <= 0.01; });
const secChanged = fig.section.onChange; fig.section.onChange = () => { secChanged && secChanged(); placeBur(); };

// ---------- readout and live label: crown edge to bone, computed from the same constants and the bone param
let last = '';
fig.onFrame(() => {
  const g = gapNow(), key = g.toFixed(1); if (key === last) return; last = key;
  const ok = g >= GAP_NEEDED - 0.05;
  bonePart.sub = `${DK.mm(g)} below the crown edge`; bonePart.el.innerHTML = bonePart.name + `<small>${bonePart.sub}</small>`;
  fig.setReadout([{ k: 'Crown edge to bone (about 3 mm needed)', v: DK.mm(g) + (ok ? ' ✓' : ' ⚠'), cls: ok ? 'ok' : 'warn' }]);
});

// ---------- the procedure
const SIDE = { theta: Math.PI / 2 - 0.12, phi: 1.42 };
const CAM = Object.assign({ zoom: 0.48, focus: [0, -1.4, 0.3] }, SIDE);
fig.procedure([
  { label: 'Too little tooth', caption: 'The tooth is broken below the gum: a crown edge on sound tooth would sit almost on the bone.', beats: [
    { dur: 0, hold: 1.2, theta: 0.55, phi: 1.3, zoom: 1, section: false, labels: ['Broken tooth'], set: { bone: 0, gum: 0, crown: 0, bur: 0, flap: 0 } },
    Object.assign({ dur: 2.2, hold: 0.2, labels: [] }, SIDE),
    { dur: 0, hold: 0, section: true, offset: 7 },
    Object.assign({ dur: 2.0, hold: 2.2, offset: 0, labels: ['Crown edge', 'Bone crest', 'Broken tooth'], key: true }, CAM)] },
  { label: 'Bone trimmed', caption: 'The gum is lifted as a flap and bone is removed around the root.', beats: [
    { dur: 0.8, hold: 0.4, set: { flap: 1 }, labels: ['Crown edge', 'Bone crest'] },
    { dur: 0.6, hold: 0, set: { bur: 1 }, labels: ['Bur'] },
    { dur: 2.6, hold: 0.8, set: { bone: 1 }, labels: ['Bur', 'Crown edge', 'Bone crest'], key: true },
    { dur: 0.6, hold: 0.6, set: { bur: 0 }, labels: ['Crown edge', 'Bone crest'] }] },
  { label: 'Gum heals lower', caption: 'The gum is stitched back lower and heals: more sound tooth shows.', beats: [
    { dur: 0, hold: 0, set: { gum: 1 } },
    { dur: 0.8, hold: 0.2, set: { flap: 0 }, labels: [] },
    { dur: 1.2, hold: 2.0, labels: ['Gum', 'Crown edge', 'Bone crest'], key: true }] },
  { label: 'Crown fitted', caption: 'The crown wraps sound tooth with its edge about 3 mm above the bone.', beats: [
    { dur: 2.2, hold: 0.2, set: { crown: 0.02 }, labels: [] },
    { dur: 2.0, hold: 0.3, set: { crown: 1 }, labels: ['Crown'] },
    Object.assign({ dur: 1.6, hold: 2.4, labels: ['Crown', 'Crown edge', 'Bone crest'], key: true }, CAM, { zoom: 0.62, focus: [0, 1.2, 0.3] })] }
]);
fig.start();
