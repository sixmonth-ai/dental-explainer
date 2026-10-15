// The jaw joint (TMJ): the condyle in its glenoid fossa with the biconcave articular disc between them; on opening it first rotates, then slides forward and down the eminence with its disc. Frame: DK.mandible (+x = patient's left, +z anterior, y up); the story ends on a sagittal cut through the LEFT joint, mouth open.
// poster: end
const OPEN = 45;                                  // mm interincisal opening at the end (normal adult maximum about 40-55 mm, facts §21)
const ROT = 22;                                   // mm: the kit's pure-rotation phase (about 20-25 mm, facts §21)
const fig = DK.figure({
  title: 'The jaw joint',
  subtitle: "Patient's left joint, seen from the side. Average adult; values approximate.",
  view: { theta: 0.62, phi: 1.28, margin: 0.86 }
});

// --- the jaw under the upper jaw, zygomatic arches and temporal bone; both discs ride on their condyles
const m = DK.mandible({ teeth: true, upper: 'bone' });
const mx = m.maxilla, discs = m.discs, tmjL = mx.joints.left, L = m.centres.left;
const W = 0.5 / m.axes.left.x;                    // along the condyle axis to the sagittal cut (x = L.x + 0.5)
fig.part(m.group, { name: 'Jaw', label: false, info: 'Average adult mandible with its teeth, hinged to the skull at two temporomandibular joints.' });
fig.part(mx.maxilla, { inPlace: true, name: 'Upper jaw', label: false, info: 'Maxilla with the upper teeth, cut flat below the orbits. It does not move: only the lower jaw does.' });
fig.part(mx.temporal.right, { inPlace: true, name: 'Right joint', label: false, info: 'The right temporomandibular joint (drawn see-through). Both joints always work together: the mandible is one bone.' });
fig.part(m.body, { inPlace: true, name: 'Mandible', label: false, info: 'The lower jaw: one rigid bone hinged at both joints, so the two condyles always move together.' });
fig.part(m.upper.holder, { inPlace: true, name: 'Upper teeth', label: false, info: 'Upper teeth, fixed to the skull.' });

// temporal bone of the left joint: the fossa (the socket) and the eminence (the slope in front of it)
fig.part(tmjL, { inPlace: true, name: 'Glenoid fossa', sub: 'socket in the skull', anchor: (e, s) => s.enabled ? tmjL.userData.at(-1, W) : tmjL.userData.anchors.roof, labelOffset: [110, -45], dim: false,
  info: 'Hollow in the temporal bone, just in front of the ear canal, that houses the condyle and disc when the teeth are together. About 6 mm deep.' });
const eminObj = new THREE.Group(); m.group.add(eminObj);
fig.part(eminObj, { inPlace: true, name: 'Articular eminence', sub: 'slope in front', anchor: (e, s) => s.enabled ? tmjL.userData.at(m.eminence.length * 0.8, W) : tmjL.userData.anchors.crest, labelOffset: [-100, -80], dim: false,
  info: 'Convex ridge of the temporal bone in front of the fossa, about 7 mm high. On wide opening the condyle and its disc slide down its back slope.' });

// the disc and the condyle
fig.part(discs.left, { inPlace: true, name: 'Articular disc', sub: 'thick, thin, thick', anchor: discs.left.userData.anchors.lateral, labelOffset: [-140, -10], dim: false,
  info: 'Biconcave fibrocartilage pad between the condyle and the skull: posterior band about 3 mm, thin middle about 1 mm, anterior band about 2 mm. It moves with the condyle; clicking joints usually involve a displaced disc.' });
const headSide = L.clone().addScaledVector(m.axes.left, m.head.ml / 2 - 0.6).add(new THREE.Vector3(0, -1.5, 0)).toArray();   // lateral pole, visible from the side
const condyle = fig.part(m.condyles.left, { inPlace: true, name: 'Condyle', sub: 'seated in the fossa', anchor: (e, s) => s.enabled ? [L.x + 0.5, L.y, L.z] : headSide, labelOffset: [-120, 85], dim: false,
  info: 'Rounded top of the jaw, about 20 mm wide and 9 mm front to back. In early opening it turns in place; past about 20-25 mm it slides forward with its disc.' });
fig.part(discs.left, { inPlace: true, name: 'Retrodiscal tissue', sub: 'behind the disc', anchor: (() => { const a = discs.left.userData.anchors.posteriorBand; return [a[0], a[1] - 2, a[2] - 5]; })(),
  labelOffset: [-80, 40], dim: false, info: 'Loose, vascular and innervated tissue tying the back of the disc to the fossa and the condylar neck. It stretches as the condyle moves forward.' });

fig.enableSection([1, 0, 0], [
  { objects: m.bone, color: 0xCCC3B2, kind: 'plain' },
  { objects: mx.bone, color: 0xEAE5DA, kind: 'cortical' },
  { objects: [discs.left.userData.disc, discs.right.userData.disc], color: 0xB89F98, kind: 'plain' },
  { objects: [...discs.left.userData.laminae, ...discs.right.userData.laminae], color: 0xD6C2BC, kind: 'plain' }
]);

// the condyle at rest (see-through ghost), shown once it has left the fossa
const ghostMat = DK.mat('bone', { opacity: 0.36 }); Object.assign(ghostMat, { depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, clippingPlanes: [fig.section.plane] });
const ghost = new THREE.Mesh(m.condyles.left.geometry, ghostMat); ghost.userData.noShadow = true; ghost.renderOrder = 2; ghost.visible = false; m.group.add(ghost);

// the path of the condyle centre (accent): drawn just outside the cut, or at the lateral pole when the joint is whole
const pathMat = new THREE.MeshBasicMaterial({ color: fig.accent, toneMapped: false, depthTest: false, transparent: true, opacity: 1 });
const path = DK.tube([L.toArray(), [L.x, L.y, L.z + 0.1]], 0.4, pathMat, { segments: 48, radial: 10 }); path.userData.noShadow = true; path.renderOrder = 10; path.visible = false; m.group.add(path);
const pathPart = fig.part(path, { inPlace: true, name: 'Condyle path', sub: 'forward and down', accent: true, anchor: L.toArray(), labelOffset: [120, 50], dim: false,
  info: 'Path of the centre of the condyle from rest to wide opening: forward and down the back slope of the eminence.' });
let open = 0, cut = null;
const POLE = m.axes.left.clone().multiplyScalar(m.head.ml / 2 + 0.5);
const tracePath = () => {
  const on = fig.section.enabled, off = on ? new THREE.Vector3(fig.section.offset + 0.9 - L.x, 0, 0) : POLE;
  // the centre stays put during pure rotation: drop repeated points (a zero-length span breaks the tube)
  const raw = DK.condylePath(m, { open: Math.max(open, ROT + 1.5) }, 48).left, pts = [];
  raw.forEach(q => { const p = [q[0] + off.x, q[1] + off.y, q[2] + off.z], l = pts[pts.length - 1]; if (!l || Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]) > 0.25) pts.push(p); });
  if (pts.length < 3) return;
  const fresh = DK.tube(pts, 0.4, pathMat, { segments: 48, radial: 10 });
  path.geometry.dispose(); path.geometry = fresh.geometry; path.children.forEach((c, i) => c.position.copy(fresh.children[i].position));
  path.visible = open > ROT + 1; pathPart.setAnchor(pts[Math.round(pts.length * 0.55)]); cut = on;
};

// --- one number drives the jaw: the interincisal opening in mm
let pose = m.pose({ open: 0 }), shown = '';
const slider = fig.slider('Open', 0, OPEN, 0.5, 0, v => fig.goTo({ set: { open: v } }, 0));
fig.param('open', 0, v => { open = v; pose = m.pose({ open: v }); slider.value = v; ghost.visible = v > ROT + 1; tracePath(); });
fig.param('context', 0.85, v => [mx.maxilla, mx.zygoma.left, mx.zygoma.right].forEach(b => { DK.fadeMaterial(b.material, v); b.visible = v > 0.02; }));
// the hero view: the upper teeth and the far (right) joint hidden so only the left joint reads
fig.param('upper', 1, v => { m.upper.holder.visible = v > 0.5; });
fig.param('far', 1, v => { mx.temporal.right.visible = mx.joints.right.visible = v > 0.5; discs.right.visible = v > 0.5; });
fig.param('fossa', 0.3, v => { [mx.temporal.left, mx.temporal.right].forEach(b => { DK.fadeMaterial(b.material, v); b.visible = v > 0.02; }); });
fig.onFrame(() => {
  if (fig.section.enabled !== cut) tracePath();
  const C = pose.condyles.left, key = open.toFixed(1) + C.forward.toFixed(1);
  if (key === shown) return; shown = key;
  const sub = open < 0.5 ? 'seated in the fossa' : open <= ROT ? 'rotates in place' : 'slides forward with the disc';
  condyle.sub = sub; condyle.el.innerHTML = condyle.name + '<small>' + sub + '</small>';
  fig.setReadout(open < 0.5 ? [{ k: 'Jaw', v: 'closed, teeth together' }] : [
    { k: 'Opening at the incisors', v: `${pose.incisal.drop.toFixed(0)} mm` },
    { k: 'Condyle', v: open <= ROT ? 'rotating in the fossa' : `${C.forward.toFixed(1)} mm forward, ${C.down.toFixed(1)} mm down` }]);
});

// --- the story: whole jaw → the left joint closed → rotation → translation → the cut through the open joint
const J = [L.x, L.y + 1, L.z + 5], SIDE = Math.PI / 2 - 0.12;
const parts4 = ['Condyle', 'Articular disc', 'Glenoid fossa', 'Articular eminence'];
fig.story([
  { dur: 0, hold: 1.4, labels: [], set: { open: 0, context: 0.85, fossa: 0.3, upper: 1, far: 1 } },
  { dur: 2.4, hold: 2.2, theta: SIDE, phi: 1.42, zoom: 0.3, fov: 28, focus: J, set: { context: 0.1, fossa: 0.14 }, labels: parts4 },
  { dur: 2.2, hold: 1.6, set: { open: ROT }, labels: ['Condyle', 'Glenoid fossa'] },
  { dur: 2.6, hold: 1.8, zoom: 0.36, focus: [L.x, L.y - 1, L.z + 8], set: { open: OPEN }, labels: ['Condyle', 'Articular eminence', 'Condyle path'] },
  { dur: 2.4, hold: 1.8, theta: SIDE + 0.1, phi: 1.5, zoom: 0.8, focus: [L.x, L.y - 28, L.z + 26], set: { context: 0.35, fossa: 0.18 }, labels: ['Condyle'] },
  { dur: 2.2, hold: 2.6, theta: SIDE, phi: 1.5, zoom: 0.8, focus: [L.x, L.y - 30, L.z + 14], set: { context: 0, fossa: 0, upper: 0, far: 0 }, labels: ['Condyle', 'Articular disc', 'Glenoid fossa', 'Articular eminence', 'Condyle path'] }
]);
fig.view('Whole jaw', { theta: 0.62, phi: 1.28, zoom: 1, fov: 32, focus: 'auto', section: false, set: { context: 0.85, fossa: 0.3, upper: 1, far: 1 }, labels: [] });
fig.view('Joint', { theta: SIDE, phi: 1.42, zoom: 0.3, fov: 28, focus: J, section: false, set: { context: 0, fossa: 0.22, upper: 0, far: 0 }, labels: parts4 });
fig.view('Cut', { theta: SIDE + 0.06, phi: 1.5, zoom: 0.36, fov: 28, focus: [L.x, L.y - 1, L.z + 8], section: true, offset: L.x + 0.5, set: { context: 0.25, fossa: 0.1 },
  labels: ['Condyle', 'Articular disc', 'Articular eminence', 'Retrodiscal tissue'] });
fig.start();
