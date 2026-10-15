// Story: a temporary anchorage device (orthodontic mini-screw) in the upper right buccal bone between the roots of 15 and 16, used as a fixed anchor to pull the canine (13) back into the space of an extracted first premolar (14). Arch frame: +x = patient's left, +z anterior, y up; the upper teeth sit crown-down (CEJ y = 0, roots up), seen from the patient's right.
// poster: end
// Teeth from DK.arch (maxilla in the mouth, 14 left out as the extraction space); the alveolar bone and the gum over it are swept
// along the arch here (the kit has no maxillary bone for an arch segment). Brackets at MBT-style heights (facts §19), 0.022 in slots,
// 0.019 x 0.025 in steel wire. Mini-screw about 1.6 mm wide and 8 mm long, placed about 5 mm above the bone crest, angled about 30°
// upward: typical values (not in dental-facts.md), so the subtitle and hover text say "about". The NiTi coil spring is drawn here.
const fig = DK.figure({
  fov: 30,
  title: 'Orthodontic mini-screw',
  subtitle: "Upper right side, FDI 12 to 17 (Universal 7 to 2), 14 extracted.",
  view: { theta: -Math.PI / 2 + 0.35, phi: 1.62, margin: window.DK_MODE === 'image' ? 0.72 : 0.8 }
});
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SLOT = '0.022', WIRE = '0.019x0.025';
const HEIGHT = { 1: 5.0, 2: 4.5, 3: 5.0, 4: 4.5, 5: 4.0, 6: 3.5, 7: 3.0 };   // slot centre from the cusp tip, MBT-style average upper row (facts §19)

// ---------- teeth: upper right 11 to 17 without 14 (in the mouth: crowns down) ----------
const scene = new THREE.Group();
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [17, 16, 15, 13, 12] });
scene.add(arch.group); scene.updateMatrixWorld(true);
fig.part(scene, { name: 'Upper right side', label: false, info: 'Upper right teeth with braces; the first premolar (14) was taken out to make room.' });
const T = fdi => arch.teeth.find(t => t.fdi === fdi);
arch.teeth.forEach(t => fig.part(t.tooth.group, { inPlace: true, name: String(t.fdi), label: false, info: `${t.spec.name}, FDI ${t.fdi} (Universal ${DK.toothNumber(t.fdi, 'universal')}).` }));

// ---------- alveolar bone and gum, swept along the arch (slot centres of 17 → 11, extended at both ends) ----------
const S = f => arch.slots[f];
const slotOf = f => S(f) || null;
const ORDER = [17, 16, 15, 14, 13, 12];
const allSlots = DK.arch({ jaw: 'maxilla', placement: 'jaw', side: 'right', build: () => ({ group: new THREE.Group() }) }).slots;   // includes the empty 14 slot
const cs = ORDER.map(f => allSlots[f].c);
const e0 = allSlots[17], e1 = allSlots[12];
const pathXZ = [[e0.c[0] - e0.t[0] * (e0.md / 2 + 1.0), e0.c[1] - e0.t[1] * (e0.md / 2 + 1.0)], ...cs, [e1.c[0] + e1.t[0] * (e1.md / 2 - 0.2), e1.c[1] + e1.t[1] * (e1.md / 2 - 0.2)]];
const spine = new THREE.CatmullRomCurve3(pathXZ.map(c => V(c[0], 0, c[1])), false, 'centripetal');
const CREST = 1.6, BONE_H = 19;                                  // crest about 1.5 to 2 mm above the CEJ in health (facts §13)
const halfW = t => 4.9 + 1.3 * DK.util.smooth(0.25, 0.6, 1 - t);   // bucco-palatal half-width: narrower at the front, wider over the molars
const PAL = 0.8;                                                   // the ridge centre sits a little palatal to the crowns (palatal roots)
const buccalW = t => halfW(t) - PAL;
const ridgeGeo = (inflate, y0, y1, rTop) => DK.sweepGeometry(spine, (s, t, f) => {
  const hh = (y1 - y0) / 2, [a, b] = DK.roundedRect(hh, halfW(t) + inflate, Math.min(rTop || 2.4, hh))(s);
  const out = V(f.P.x, 0, f.P.z + 22).normalize(), sg = Math.sign(f.N.x * out.x + f.N.z * out.z) || 1;
  const y = a + y0 + hh, k = 0.9 + 0.1 * DK.util.smooth(CREST - 1, CREST + 5, y);   // the ridge narrows toward the crest
  return [y, (b - sg * PAL) * k]; }, { segments: 160, radial: 48 });
const bone = new THREE.Mesh(ridgeGeo(0, CREST, CREST + BONE_H, 4.5), DK.mat('bone', { opacity: 0.92 }));
bone.material.transparent = true;
scene.add(bone);
const gumMat = DK.mat('gingiva');
const gum = new THREE.Mesh(ridgeGeo(0.6, 0.2, 6.4, 1.2), gumMat);
scene.add(gum);
const margin = DK.gingivaArch(arch, { height: 3.0 });
scene.add(margin);
fig.part(bone, { inPlace: true, name: 'Bone', label: false, info: 'The alveolar bone of the upper jaw that holds the roots.' });
fig.part(gum, { inPlace: true, name: 'Gum', label: false, info: 'Attached gum over the bone (schematic).' });
fig.part(margin, { inPlace: true, name: 'Gum ', label: false, info: 'Gum margin around the necks of the teeth.' });
fig.xray([bone], false);

// ---------- braces on 17, 16, 15, 13, 12, 11; one steel wire ----------
const wirePts = [], parts = {};
arch.teeth.forEach(({ fdi, tooth: t, spec: sp }) => {
  const p = fdi % 10;
  const part = p >= 6 ? DK.molarTube(sp, { slot: SLOT, height: HEIGHT[p], hook: false }) : DK.bracket(sp, { slot: SLOT, height: HEIGHT[p] });
  wirePts.push(t.group.localToWorld(V(...part.wirePoint(DK.wireSize(WIRE).d))).toArray());
  t.group.add(part); parts[fdi] = part;
  if (p < 6) t.group.add(DK.ligature(part));
  fig.part(part, { inPlace: true, name: (p >= 6 ? 'Tube ' : 'Bracket ') + fdi, label: false, info: 'Bonded to the tooth; the wire runs through its slot.' });
});
const wire = DK.archwire(wirePts, { size: WIRE, material: 'steel', overhang: 1.2 }); scene.add(wire);
fig.part(wire, { inPlace: true, name: 'Archwire', label: false, info: 'A stiff steel wire: the canine slides back along it.' });
// canine hook (on the distal-gingival wing of the 13 bracket: gingival = toward +y in the world, crowns are down)
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.45, metalness: 0.7 });
const b13 = parts[13], u13 = b13.userData;
const hk = DK.tube([[-u13.width / 2 + 0.45, -u13.tall / 2 + 0.3, u13.face - 0.35], [-u13.width / 2 + 0.45, -u13.tall / 2 - 0.8, u13.face + 0.05], [-u13.width / 2 + 0.45, -u13.tall / 2 - 1.4, u13.face + 0.6]], 0.26, steel, { segments: 12, radial: 10 });
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), steel); ball.position.set(-u13.width / 2 + 0.45, -u13.tall / 2 - 1.45, u13.face + 0.68);
b13.add(hk, ball);

// ---------- the mini-screw, between the roots of 15 and 16 ----------
const s15 = allSlots[15], s16 = allSlots[16];
const cx = s16.c[0] + s16.t[0] * (s16.md / 2), cz = s16.c[1] + s16.t[1] * (s16.md / 2);   // the 15/16 contact, in the arch plane
const nrm = V(s16.n[0], 0, s16.n[1]).add(V(s15.n[0], 0, s15.n[1])).normalize();          // outward (buccal)
const ENTRY_Y = CREST + 5.0, TILT = 30 * Math.PI / 180, LEN = 8, DIA = 1.6;
const tSpine = (() => { let best = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const p = spine.getPointAt(i / 400), d = (p.x - cx) ** 2 + (p.z - cz) ** 2; if (d < bd) { bd = d; best = i / 400; } } return best; })();
const boneSurf = V(cx, ENTRY_Y, cz).addScaledVector(nrm, buccalW(tSpine));                   // entry point on the buccal bone surface
const axisIn = nrm.clone().multiplyScalar(-Math.cos(TILT)).add(V(0, Math.sin(TILT), 0)).normalize();   // into the bone, tipped up toward the apices
const screw = new THREE.Group();
const ti = DK.mat('titanium');
const body = new THREE.Mesh(DK.threaded({ length: LEN, coreRadius: DIA / 2 - 0.22, threadDepth: 0.22, pitch: 0.75, collar: 0, apexTaper: 0.25, starts: 1, cols: 48 }), ti);
const collar = DK.lathe([[DIA / 2 - 0.05, 0], [DIA / 2 + 0.05, 0.6], [DIA / 2 + 0.05, 1.8], [1.35, 2.0], [1.4, 2.4], [1.05, 2.55], [1.05, 3.0], [1.25, 3.1], [1.25, 3.6], [0.9, 3.85], [0.01, 3.9]], 40, ti);
screw.add(body, collar);   // local: +y out of the bone, threads down to y = -LEN
// cross slot in the head (where the spring hooks on)
const slotMat = new THREE.MeshStandardMaterial({ color: DK.color(0x5b5e62), roughness: 0.6, metalness: 0.4 });
[0, Math.PI / 2].forEach(r => { const g = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.42, 0.42), slotMat); g.position.y = 3.62; g.rotation.y = r; screw.add(g); });
const SHOW_OUT = 2.2;                                                                    // collar through the gum, head about 2 mm out
const qScrew = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), axisIn.clone().negate());
screw.quaternion.copy(qScrew);
scene.add(screw);
const screwHead = () => (screw.updateWorldMatrix(true, false), scene.worldToLocal(screw.localToWorld(V(0, 3.4, 0))));   // scene frame
const hookAt = () => (ball.updateWorldMatrix(true, false), scene.worldToLocal(ball.localToWorld(V(0, 0, 0))));
const placeScrew = k => {   // 0 = held outside, 1 = fully in; it turns as it advances
  screw.visible = k > 0.001;
  const depth = LEN * DK.util.clamp(k, 0, 1), out = 9 * (1 - DK.util.smooth(0, 0.15, k));
  screw.position.copy(boneSurf).addScaledVector(axisIn, depth - LEN).addScaledVector(axisIn, -out);
  const spin = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), k * 10 * Math.PI);
  screw.quaternion.copy(qScrew).multiply(spin);
};
fig.param('screw', 1, placeScrew); placeScrew(1);
// clinical check: the closest root surface to the screw axis (printed once for the builder)
(() => {
  const a = boneSurf.clone(), b = boneSurf.clone().addScaledVector(axisIn, LEN), ab = b.clone().sub(a); let dmin = 1e9, who = '';
  [15, 16].forEach(f => { const g = T(f).tooth.group; g.updateWorldMatrix(true, true); g.traverse(m => { if (!m.isMesh || !m.geometry) return; const p = m.geometry.attributes.position, w = V(0, 0, 0);
    for (let i = 0; i < p.count; i += 3) { w.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); scene.worldToLocal(w); if (w.y < 1) continue; const t = DK.util.clamp(w.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1); const d = w.distanceTo(a.clone().addScaledVector(ab, t)); if (d < dmin) { dmin = d; who = String(f); } } }); });
  window.__tadClearance = { mm: +(dmin - DIA / 2).toFixed(2), tooth: who };
})();

// ---------- NiTi coil spring from the screw head to the canine hook ----------
const springMat = DK.mat('steel', { color: 0xb4b8bc, cap: 0x9ea4aa, roughness: 0.35, metalness: 0.8 });
const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat); scene.add(spring);
let reach = 1;
const buildSpring = () => {
  const A = screwHead(), B0 = hookAt(), B = A.clone().lerp(B0, reach);
  const d = B.clone().sub(A), L = d.length(); if (L < 0.5) { spring.visible = false; return; } d.normalize();
  const u = V(0, 1, 0).cross(d).normalize(), w = d.clone().cross(u).normalize(), pts = [];
  const eye = 1.2, coilL = Math.max(0.5, L - 2 * eye), turns = Math.max(3, Math.round(coilL / 0.55)), R = 0.48;
  pts.push(A.toArray()); pts.push(A.clone().addScaledVector(d, eye * 0.6).toArray());
  for (let i = 0; i <= turns * 16; i++) { const s = i / (turns * 16), a = s * turns * Math.PI * 2, c = A.clone().addScaledVector(d, eye + coilL * s).addScaledVector(u, Math.cos(a) * R).addScaledVector(w, Math.sin(a) * R); pts.push(c.toArray()); }
  pts.push(B.clone().addScaledVector(d, -eye * 0.6).toArray()); pts.push(B.toArray());
  const m = DK.tube(pts, 0.13, springMat, { segments: pts.length * 2, radial: 8 });
  spring.geometry.dispose(); spring.geometry = m.geometry; spring.visible = reach > 0.02;
};
fig.param('reach', 1, v => { reach = v; buildSpring(); }); buildSpring();

// ---------- the canine slides back along the wire (schematic: months of pull), the screw does not move ----------
const t13 = T(13), home13 = t13.tooth.group.position.clone(), back = V(-s15.t[0], 0, -s15.t[1]).normalize();
const SPACE = DK.toothPreset(14).md;
fig.param('retract', 0, k => { t13.tooth.group.position.copy(home13).addScaledVector(back, k * 3.0); buildSpring(); });

// ---------- labels ----------
const sp15 = T(15).spec, sp16 = T(16).spec;
const rootMid = (f, y) => { const s = allSlots[f]; return V(s.c[0], y, s.c[1]).addScaledVector(nrm, 1.8); };
const gapTag = new THREE.Object3D(); gapTag.position.copy(V(cx, CREST + 8.5, cz).addScaledVector(nrm, 2.2)); scene.add(gapTag);
fig.part(gapTag, { inPlace: true, name: 'Space between roots', sub: '15 and 16', anchor: [0, 0, 0], labelOffset: [-60, -90], dim: false,
  info: 'Between the second premolar and first molar roots there is usually a few millimetres of bone: the classic place for a mini-screw.' });
fig.part(screw, { inPlace: true, name: 'Mini-screw', sub: 'about 1.6 × 8 mm', accent: true, anchor: [0, 3.0, 0], labelOffset: [-130, -40], dim: false,
  info: 'A small titanium screw (temporary anchorage device), about 1.4 to 2 mm wide and 6 to 10 mm long. It is held by the bone, not fused to it, and is unscrewed when treatment ends.' });
fig.part(spring, { inPlace: true, name: 'Coil spring', sub: 'pulls the canine back', anchor: () => { const A = screwHead(), B = hookAt(); return [(A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2]; }, labelOffset: [-20, -90], dim: false, when: () => reach > 0.95,
  info: 'A nickel-titanium coil spring stretched from the screw head to a hook on the canine bracket gives a light, steady pull.' });
fig.part(t13.tooth.group, { inPlace: true, name: '13', sub: 'canine', anchor: [0, t13.spec.crownL * 0.75, t13.spec.bl / 2], labelOffset: [40, 80], dim: false, info: 'Upper right canine (Universal 6). It slides back along the wire into the extraction space.' });
fig.part(T(16).tooth.group, { inPlace: true, name: '16', sub: 'first molar', anchor: [0, sp16.crownL * 0.4, sp16.bl / 2], labelOffset: [30, 90], dim: false, info: 'Upper right first molar (Universal 3). Without the screw, pulling on the canine would drag this tooth forward too.' });
const gapMark = new THREE.Object3D(); { const a = allSlots[14]; gapMark.position.set(a.c[0] + a.n[0] * 3.5, -3, a.c[1] + a.n[1] * 3.5); } scene.add(gapMark);
fig.part(gapMark, { inPlace: true, name: 'Extraction space', anchor: [0, 0, 0], labelOffset: [0, 90], dim: false, info: `Where the first premolar (14) was, about ${SPACE.toFixed(0)} mm wide.` });

fig.button('X-ray', () => fig.goTo({ xray: fig.xrayOn ? 0 : 1 }, 0.8));
fig.view('Side', { theta: -Math.PI / 2, phi: 1.6, zoom: 1, focus: 'auto', xray: 0 });
fig.standardControls({ explode: false });

// story: the right side with braces and a gap → see-through bone: roots, and the bone between 15 and 16 → the screw threads in there
// → from above, through the bone: it sits between the roots → a spring from its head to the canine → the canine slides back, the screw holds
const MID = [cx, CREST + 4, cz];
const s13 = allSlots[13], END = [(cx + s13.c[0]) / 2, 3.5, (cz + s13.c[1]) / 2];
fig.story([
  { dur: 0, hold: 1.4, theta: -Math.PI / 2 + 0.55, phi: 1.7, zoom: 1.05, xray: 0, set: { screw: 0, reach: 0, retract: 0 }, labels: ['Extraction space', '13'] },
  { dur: 2.2, hold: 1.8, theta: -Math.PI / 2 + 0.1, phi: 1.5, zoom: 0.78, focus: MID, xray: 1, labels: ['Space between roots'] },
  { dur: 2.6, hold: 1.2, set: { screw: 1 }, labels: ['Mini-screw', 'Space between roots'] },
  { dur: 2.2, hold: 2.0, theta: Math.atan2(nrm.x, nrm.z), phi: 1.5, zoom: 0.5, focus: [cx, CREST + 7, cz], labels: ['Mini-screw', 'Space between roots'] },
  { dur: 2.2, hold: 0.6, theta: -Math.PI / 2 + 0.25, phi: 1.62, zoom: 0.94, focus: END, xray: 0.7, labels: ['Mini-screw', '13'] },
  { dur: 1.8, hold: 1.0, set: { reach: 1 }, labels: ['Coil spring', 'Mini-screw', '13'] },
  { dur: 3.0, hold: 2.6, set: { retract: 1 }, drift: 0, labels: ['Mini-screw', 'Coil spring', '13', '16'] }
]);
fig.start();
