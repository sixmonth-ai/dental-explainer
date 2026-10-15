// Story: an implant replacing the maxillary right central incisor (FDI 11 = Universal 8) between 12 and 21, crown up (model convention), ending in a labio-palatal cut (CBCT-style slice) through the implant axis. Frame: tooth frame of 11 (+x mesial, toward 21; +z labial; CEJ of the neighbours at y = 0), mm; camera on the mesial side for the cut (labial on the viewer's left).
// poster: end
// The point: in the front the implant is set palatal to where the root was (tilted slightly toward the palate) so about 2 mm of
// labial bone stays in front of it (dental-facts.md §7, 1.8 to 2 mm), and deep, its platform about 3 mm under the planned gum line,
// so the crown can emerge like a tooth. The 3 mm depth is surgical teaching (Buser, Martin & Belser 2004), not in dental-facts.md,
// so it is shown as "about". The ridge is DK.bone warped to the incisor's labio-palatal profile: a thin labial plate over the
// root position and a thick palatal side.
const CREST = -2.0;                                   // bone crest at the site, ~2 mm below the neighbours' CEJs (§13)
const IMPLANT = { diameter: 3.75, length: 12 };       // regular diameter (§7, 3.75 to 4.5 mm), length in the common range
const TILT = 0.12;                                    // rad: apex toward the palate (~7°)
const GUM_Y = 0.2, RISE = 0.8, MARGIN = GUM_Y + RISE;  // free gingival margin over the crown
const BONE_GOAL = 2.0;                                // labial bone wanted in front of the implant, mm (§7)

const fig = DK.figure({
  fov: 30,
  title: 'Front tooth implant',
  subtitle: 'Replaces FDI 11 (Universal 8), upper right central incisor. Crown up.',
  view: { theta: 0.55, phi: 1.32, margin: 0.9 }
});

const s11 = DK.toothPreset(11), s12 = DK.toothPreset(12), s21 = DK.toothPreset(21);
const X12 = -(s11.md / 2 + s12.md / 2), X21 = s11.md / 2 + s21.md / 2;
const MID = (X12 + X21) / 2, WIDTH = X21 - X12 + 9;

// ---------- the ridge: labio-palatal profile of an upper incisor site (tooth-frame y) ----------
const labRoot = y => DK.toothSurfaceAt(s11, Math.max(y, -s11.rootL + 0.6), Math.PI / 2).z;
const LAB = y => {                                   // labial bone surface: a thin plate over the root position, flaring above the apex
  const plate = labRoot(y) + 0.9, u = DK.util.smooth(-9, -15, y);
  return DK.util.lerp(plate, 4.2 + 0.08 * (-15 - y), u);
};
const PAL = y => -4.5 - 3.2 * DK.util.smooth(CREST, -16, y);   // palatal surface: thick bone sloping toward the palate
const bone = DK.bone({ width: WIDTH, height: 16, depth: 10, cortical: 1.0, crest: 1.4 });
bone.position.set(MID, CREST, 0);
function warp(mesh, d, inset, yOff) {                // map the block's z ∈ [−d/2, d/2] onto [PAL + inset, LAB − inset] at each height
  const p = mesh.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + yOff, z = p.getZ(i), u = (z + d / 2) / d;
    const top = Math.min(1, Math.max(0, (y - (CREST - 1.4)) / 1.4));   // keep the domed crest rounded
    const lab = LAB(Math.min(y, CREST - 0.4)) - inset * (1 - 0.3 * top), pal = PAL(y) + inset * (1 - 0.3 * top);
    const c = (lab + pal) / 2, h = (lab - pal) / 2;
    p.setZ(i, c + (u * 2 - 1) * h);
  }
  p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
}
const L = bone.userData.layers;
warp(L.cortical, 10, 0, CREST);
warp(L.cancellous, 8, 1.0, CREST - 1.0);

const GUM_H = 5.6, GUM_D = 10;
const gum = DK.gingiva({ width: WIDTH + 0.6, height: GUM_H, depth: GUM_D, crest: 1.3, around: [
  { x: X12 - MID, z: 0, md: s12.mdC, bl: s12.blC, rise: RISE }, { x: -MID, z: 0, md: s11.mdC, bl: s11.blC, rise: RISE }, { x: X21 - MID, z: 0, md: s21.mdC, bl: s21.blC, rise: RISE }] });
gum.position.set(MID, GUM_Y, 0);
(() => {                                             // drape the gum over the ridge: ~1.2 mm thick on the lip side, ~2 mm palatally
  const p = gum.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + GUM_Y, u = (p.getZ(i) + GUM_D / 2) / GUM_D, yy = Math.min(y, CREST - 0.4);
    const t = DK.util.smooth(GUM_Y - GUM_H, GUM_Y - GUM_H + 3.0, y);   // thins to nothing where it meets the bone below
    const lab = Math.max(LAB(yy) + 0.05 + 1.15 * t, s11.blC / 2 + 0.6), pal = Math.min(PAL(yy) - 0.05 - 1.55 * t, -s11.blC / 2 - 0.6);
    p.setZ(i, (lab + pal) / 2 + (u * 2 - 1) * (lab - pal) / 2);
  }
  p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere();
})();
// ---------- neighbours ----------
const t12 = DK.tooth(12), t21 = DK.tooth(21);
t12.group.position.x = X12; t21.group.position.x = X21; t21.group.scale.x = -1;   // 21 is a left tooth: mirrored in 11's frame

// ---------- the implant, abutment and crown ----------
const R = IMPLANT.diameter / 2, YM = CREST - 1.0;                   // labial bone measured 1 mm below the crest
const ZIMP = LAB(YM) - BONE_GOAL - R + (CREST - YM) * Math.sin(TILT);   // axis position at the platform, so the bone at YM is BONE_GOAL
const fixture = new THREE.Group(); fixture.position.set(0, CREST, ZIMP); fixture.rotation.x = TILT;
const implant = DK.implant({ diameter: IMPLANT.diameter, length: IMPLANT.length, connection: 'conical' });
const abut = DK.abutment({ platform: IMPLANT.diameter, collarHeight: 2.6, postHeight: 5.5, postTopDiameter: 3.0, emergence: 5.4 });
fixture.add(implant, abut);
const crown = DK.restorationCrown(11, 'ceramic', { hollow: false }); crown.position.y = 0.05;
const site = new THREE.Group(); site.add(fixture, crown);
const toLabial = LAB(YM) - (ZIMP - (CREST - YM) * Math.sin(TILT) + R);   // measured back from the geometry
const depth = MARGIN - CREST;

// ---------- the natural root that was here: a quiet ghost ----------
// its labio-palatal outline at the cut (root from the labial CEJ round the apex to the palatal CEJ), drawn on the cut face
const ghost = new THREE.Group();
const outlinePts = [];
for (let i = 0; i <= 40; i++) { const y = -s11.rootL * Math.pow(i / 40, 0.9); outlinePts.push([DK.toothSurfaceAt(s11, Math.min(-0.05, y), Math.PI / 2).z, y]); }
for (let i = 40; i >= 0; i--) { const y = -s11.rootL * Math.pow(i / 40, 0.9); outlinePts.push([DK.toothSurfaceAt(s11, Math.min(-0.05, y), -Math.PI / 2).z, y]); }
const ghostMat = new THREE.MeshBasicMaterial({ color: DK.color(0x2b2925), transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const ghostFill = new THREE.MeshBasicMaterial({ color: DK.color(0x2b2925), transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
(() => {
  const pos = [], idx = [], n = outlinePts.length, w = 0.09;
  for (let i = 0; i < n; i++) {
    const a = outlinePts[Math.max(0, i - 1)], b = outlinePts[Math.min(n - 1, i + 1)], dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1;
    const nz = -dy / l * w, ny = dz / l * w, p = outlinePts[i];
    pos.push(0, p[1] + ny, p[0] + nz, 0, p[1] - ny, p[0] - nz);
    if (i < n - 1) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const line = new THREE.Mesh(g, ghostMat); line.renderOrder = 999; ghost.add(line);
  const sh = new THREE.Shape(outlinePts.map(p => new THREE.Vector2(p[0], p[1])));
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(sh), ghostFill); fill.rotation.y = -Math.PI / 2; fill.renderOrder = 998; ghost.add(fill);
})();
ghost.visible = false; fig.world.add(ghost);
// ---------- labial bone bracket on the cut face ----------
const inkMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xe8e2d6 : 0x2b2925), toneMapped: false, side: THREE.DoubleSide });
const bracket = new THREE.Group();
const z0 = ZIMP - (CREST - YM) * Math.sin(TILT) + R, z1 = LAB(YM);
const boneInk = new THREE.MeshBasicMaterial({ color: DK.color(0x2b2925), toneMapped: false, side: THREE.DoubleSide });   // on the light bone cut in both themes
const bar = (w, h, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), boneInk); m.rotation.y = Math.PI / 2; m.position.set(0, y, z); bracket.add(m); };
bar(z1 - z0, 0.16, YM, (z0 + z1) / 2); bar(0.16, 0.9, YM, z0); bar(0.16, 0.9, YM, z1);
bracket.visible = false; fig.world.add(bracket);
// depth bracket: platform to gum line, just labial of the crown
const dBr = new THREE.Group();
const ZD = LAB(CREST - 0.4) + 2.4;
const dbar = (w, h, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), inkMat); m.rotation.y = Math.PI / 2; m.position.set(0, y, z); dBr.add(m); };
dbar(0.16, depth, (MARGIN + CREST) / 2, ZD); dbar(0.9, 0.16, MARGIN, ZD); dbar(0.9, 0.16, CREST, ZD);
dBr.visible = false; fig.world.add(dBr);

// ---------- parts ----------
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'Upper jaw bone at the front (shown crown up): a thin plate on the lip side, thick bone toward the palate.' });
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'Gum around the crowns. Its scalloped line is what people see when the patient smiles.' });
fig.part(t12.group, { name: '12', anchor: [0, s12.crownL - 1, s12.bl / 2 - 0.6], info: 'Upper right lateral incisor (Universal 7).' });
fig.part(t21.group, { name: '21', anchor: [0, s21.crownL - 1, s21.bl / 2 - 0.6], info: 'Upper left central incisor (Universal 9): the implant crown has to match it.' });
fig.part(site, { name: 'Implant tooth', label: false, info: 'Implant, abutment and crown replacing 11.' });
fig.part(crown, { inPlace: true, name: 'Crown', sub: 'ceramic', anchor: [0, s11.crownL * 0.62, s11.bl / 2 - 0.3], info: 'A ceramic crown shaped like the lost central incisor, on a titanium abutment.' });
fig.part(implant, { inPlace: true, name: 'Implant', sub: `Ø${IMPLANT.diameter} × ${IMPLANT.length} mm, set palatal`, anchor: [0, -6.5, -R], labelOffset: [90, 0], accent: true, dim: false, info: 'In the front, the implant is placed toward the palate rather than where the root was, tilted slightly so its apex engages the thicker palatal bone.' });
fig.part(abut, { inPlace: true, name: 'Abutment', anchor: [0, 1.4, -2.4], labelOffset: [80, 10], dim: false, when: (e, sec) => sec.enabled, info: 'Connects the crown to the implant and shapes the emergence through the gum.' });
fig.part(ghost, { inPlace: true, name: 'Where the root was', anchor: [0, -7, DK.toothSurfaceAt(s11, -7, Math.PI / 2).z], labelOffset: [-110, 30], dim: false, when: () => ghost.visible && ghostMat.opacity > 0.3, info: 'The natural root sat right against the thin labial plate. An implant in that same spot would leave almost no bone in front of it.' });
fig.part(bracket, { inPlace: true, name: 'Labial bone', sub: `${DK.mm(toLabial)} in front`, anchor: [0, YM + 0.1, z1], labelOffset: [-110, 20], dim: false, when: () => bracket.visible, info: 'About 1.8 to 2 mm of bone in front of the implant keeps the thin labial plate, and the gum over it, from shrinking back and showing metal.' });
fig.part(dBr, { inPlace: true, name: 'Platform depth', sub: `about ${Math.round(depth)} mm under the gum line`, anchor: [0, (MARGIN + CREST) / 2, ZD], labelOffset: [-100, -20], dim: false, when: () => dBr.visible, info: 'The implant top sits about 3 mm below the planned gum margin of the crown, so the crown widens gradually through the gum like a natural tooth.' });

// ---------- section: labio-palatal through 11 (mesial half removed, camera on +x) ----------
fig.enableSection([1, 0, 0], [
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [L.cortical], color: DK.COLORS.corticalCap },
  { objects: [L.cancellous], color: 0xffffff, texture: L.cancellous.userData.capTexture },
  { objects: [crown], color: DK.COLORS.ceramicCap },
  { objects: [t12.layers.enamel, t21.layers.enamel], color: DK.COLORS.enamelCap },
  { objects: [t12.layers.dentin, t12.layers.root, t21.layers.dentin, t21.layers.root], color: DK.COLORS.dentinCap },
  { objects: [t12.layers.pulp, t21.layers.pulp], color: DK.COLORS.pulpCap }
]);
fig.xray([L.cortical, gum], false);
fig.standardControls({ explode: false, section: { label: 'Cut', range: [-3, 3], offset: 0 } });
const CUTVIEW = { theta: Math.PI / 2 - 0.08, phi: 1.44 };
fig.view('Lip to palate', Object.assign({ section: true, offset: 0, xray: 0, zoom: 0.95, focus: [0, -4, 0], fov: 26, set: { ghost: 1, marks: 1 }, labels: ['Implant', 'Labial bone', 'Platform depth', 'Where the root was'] }, CUTVIEW));

// ---------- params ----------
fig.param('ghost', 0, k => { ghostMat.opacity = 0.75 * k; ghostFill.opacity = 0.12 * k; ghost.visible = k > 0.01 && !!(fig.section && fig.section.enabled); });
fig.param('marks', 0, k => { bracket.visible = dBr.visible = k > 0.5; });
fig.onFrame(() => { const x = (fig.section && fig.section.enabled ? fig.section.offset : 0) + 0.1; bracket.position.x = dBr.position.x = ghost.position.x = x + 0.02; });

// ---------- story: the smile → see through to the implant → cut lip to palate → where the root was → the two numbers ----------
fig.story([
  { dur: 0, hold: 1.4, theta: 0.42, phi: 1.32, zoom: 1.0, section: false, set: { ghost: 0, marks: 0 }, labels: [], caption: 'A missing upper front tooth, replaced by an implant crown.' },
  { dur: 2.0, hold: 1.6, theta: 0.12, zoom: 0.86, focus: [0, 4, 0], labels: ['Crown', '12', '21'], caption: 'From the front it should look like its neighbours.' },
  { dur: 2.2, hold: 1.8, theta: 0.9, phi: 1.36, zoom: 1.0, focus: 'auto', xray: 1, labels: ['Implant'], caption: 'Inside the bone, an implant carries it.' },
  { fov: 26, dur: 2.0, hold: 0.1, ...CUTVIEW, zoom: 0.95, focus: [0, -4, 0], labels: [] },
  { dur: 0, hold: 0, section: true, offset: 8, xray: 0 },
  { dur: 2.2, hold: 1.2, offset: 0, labels: ['Implant', 'Crown'], caption: 'A cut from lip to palate, like a CBCT slice.' },
  { dur: 1.4, hold: 2.2, set: { ghost: 1 }, labels: ['Implant', 'Where the root was'], caption: 'The implant sits toward the palate, not where the root was.' },
  { dur: 1.8, hold: 2.8, zoom: 0.9, focus: [0, -3.2, 0.6], set: { ghost: 1, marks: 1 }, labels: ['Implant', 'Labial bone', 'Platform depth', 'Where the root was'], caption: 'That keeps bone in front of it, and deep enough for a natural gum line.' }
]);
fig.start();
