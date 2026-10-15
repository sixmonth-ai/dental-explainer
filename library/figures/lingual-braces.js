// Story: lingual braces on the upper arch (FDI 16 to 26): brackets and molar tubes bonded on the palatal surfaces, with the archwire running inside the arch, so nothing shows from the front. Arch frame: +x = patient's left, +z anterior, y up; teeth crown-down in the mouth (DK.arch maxilla, placement 'jaw').
// poster: end
// The kit seats brackets on the facial surface only; here each bracket and tube is built by DK.bracket / DK.molarTube, its bonding
// pad is replaced by one contoured to the palatal crown surface (DK.crownSurface(spec, -1)), and the part is re-seated square to
// that surface. Lingual systems use custom low-profile brackets, commonly with 0.018 in slots; the twin shape here is schematic.
const SLOT = '0.018', WIRE = '0.016';
const fig = DK.figure({
  fov: 34,
  title: 'Braces behind the teeth',
  subtitle: "Upper teeth FDI 16 to 26, from the palate. Patient's right on the right.",
  view: { theta: Math.PI, phi: 2.55, margin: 0.72 }
});
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const arch = DK.arch({ jaw: 'maxilla', placement: 'jaw', teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], build: (fdi, spec) => DK.tooth(spec, { omit: ['dentin', 'pulp', 'root'] }) });
fig.part(arch.group, { name: 'Upper teeth', label: false, info: 'Upper teeth 16 to 26, in the mouth.' });
arch.group.updateMatrixWorld(true);
const ridge = DK.gingivaArch(arch);
fig.part(ridge, { name: 'Gum', label: false, fit: false, info: 'Gum along the upper teeth (schematic).' });

// --- a part re-seated on the palatal surface: new contoured pad, square to the palatal surface at height y0 above the CEJ
const frameAt = c => { const Z = V(...c.n).normalize(), Y = V(0, 1, 0).sub(Z.clone().multiplyScalar(Z.y)).normalize(), X = new THREE.Vector3().crossVectors(Y, Z).normalize();
  const R = new THREE.Matrix4().makeBasis(X, Y, Z), Ri = R.clone().transpose(), P0 = V(...c.p); return { P0, R, Z, toLocal: p => V(...p).sub(P0).applyMatrix4(Ri) }; };
const steel = DK.mat('steel', { cap: 0x9ea4aa, roughness: 0.52, metalness: 0.65 });
function lingual(sp, y0, tube) {
  const part = tube ? DK.molarTube(sp, { slot: SLOT, hook: false, length: 3.2 }) : DK.bracket(sp, { slot: SLOT, tall: 2.6, width: Math.min(3.0, Math.max(2.4, sp.md * 0.36)) });
  const pad = part.children.find(c => c.name === 'Base'); if (pad) part.remove(pad);
  const S = DK.SLOTS[SLOT], zc = (tube ? 0.65 : 0.85) + S.d / 2, surf = DK.crownSurface(sp, -1), c = surf.at(0, y0), F = frameAt(c);
  const w = tube ? 4.0 : part.userData.width + 0.3, h = tube ? S.w + 2.4 : part.userData.tall + 0.3, thick = 0.3;
  const g = DK.slabGeometry(8, 8, (i, j) => { const u = i / 8 * 2 - 1, v = j / 8 * 2 - 1, q = surf.at(c.p[0] + u * w / 2, y0 + v * h / 2), l = F.toLocal(q.p);
    return [[l.x, l.y, Math.min(l.z, thick - 0.1) - 0.04 - zc], [l.x, l.y, thick - zc]]; });
  part.add(new THREE.Mesh(g, steel));
  part.quaternion.setFromRotationMatrix(F.R); part.position.copy(F.P0).add(F.Z.clone().multiplyScalar(zc)); part.updateMatrix();
  return part;
}

const wirePts = [], parts = [];
arch.teeth.forEach(({ fdi, tooth: t, spec: sp }) => {
  const p = fdi % 10, tube = p === 6;
  const y0 = tube ? sp.crownL * 0.45 : p <= 3 ? sp.crownL * 0.42 : sp.crownL * 0.5;   // palatal middle third (incisors and canine: just incisal to the cingulum)
  const part = lingual(sp, y0, tube);
  wirePts.push(t.group.localToWorld(V(...part.wirePoint(DK.wireSize(WIRE).d))).toArray());
  const lig = tube ? null : DK.ligature(part, { color: 0xb9b4aa });
  t.group.add(part); if (lig) t.group.add(lig);
  parts.push({ fdi, part, t });
  fig.part(t.group, { inPlace: true, name: String(fdi), label: false, info: `${sp.name}, FDI ${fdi} (Universal ${DK.toothNumber(fdi, 'universal')}).` });
});
const wire = DK.archwire(wirePts, { size: WIRE, material: 'niti', overhang: 1.0 });
fig.part(wire, { name: 'Archwire', sub: 'inside the arch', fit: false, anchor: (() => { const a = wirePts[3], b = wirePts[4]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; })(), labelOffset: [-110, 70], dim: false,
  info: 'The wire runs along the tongue side of the teeth. Its shape has steps at the canines because the inside of the arch is not as smooth as the outside.' });
const b11 = parts.find(o => o.fdi === 11), b21 = parts.find(o => o.fdi === 21), t26 = parts.find(o => o.fdi === 26);
fig.part(b11.part, { inPlace: true, name: 'Bracket', sub: 'bonded on the tongue side', accent: true, anchor: [0, 0, 0.7], labelOffset: [110, -70], dim: false,
  info: 'A small metal bracket glued to the inside surface of the tooth. Lingual brackets are usually made to fit each tooth; they are hidden from view but the tongue feels them at first.' });
fig.part(t26.part, { inPlace: true, name: 'Molar tube', anchor: [0, 0, 0.6], labelOffset: [90, 40], dim: false, info: 'The wire ends in a tube on the inside of the first molar.' });
const t11 = b11.t, s11 = arch.teeth.find(o => o.fdi === 11).spec;
fig.part(t11.group, { inPlace: true, name: 'From the front', sub: 'no braces to see', anchor: [0, s11.crownL * 0.55, s11.bl / 2 - 0.4], labelOffset: [120, -90], dim: false, info: 'Seen from the front, the teeth look as they would without braces.' });
fig.view('Front', { theta: 0, phi: 1.62, zoom: 1, focus: 'auto' });
fig.view('Palate', { theta: Math.PI, phi: 2.55, zoom: 1, focus: 'auto' });
fig.standardControls({ explode: false });

// story: from the front nothing shows → orbit round to the tongue side → the brackets appear behind the front teeth → push in on one
// bracket → ease out under the arch: brackets and wire all along the inside (teaching shot)
const P11 = b11.t.group.localToWorld(V(0, 0, 0)).toArray();
const F11 = (() => { const w = b11.part.getWorldPosition(V(0, 0, 0)); return [w.x + 2, w.y, w.z]; })();
fig.story([
  { dur: 0, hold: 1.6, theta: 0.25, phi: 1.62, zoom: 0.9, labels: ['From the front'] },
  { dur: 2.0, hold: 0.8, theta: 0, phi: 1.62, zoom: 0.8, labels: ['From the front'] },
  { dur: 3.0, hold: 1.6, theta: Math.PI - 0.5, phi: 2.05, zoom: 1.05, labels: ['Bracket', 'Archwire'] },
  { dur: 2.0, hold: 2.0, theta: Math.PI - 0.25, phi: 2.05, zoom: 0.32, focus: F11, labels: ['Bracket', 'Archwire'] },
  { dur: 2.4, hold: 2.6, theta: Math.PI, phi: 2.55, zoom: 1, focus: 'auto', drift: 0, labels: ['Bracket', 'Archwire', 'Molar tube'] }
]);
fig.start();
