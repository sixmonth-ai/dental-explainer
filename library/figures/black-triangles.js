// Black triangles between the upper central incisors (FDI 11 and 21 = Universal 8 and 9), in the mouth, crowns down, seen from the front.
// poster: end
// The papilla fills the space under the contact when the bone crest between the teeth is about 5 mm or less below the contact;
// when the crest drops (here by 4 mm, to about 9 mm) the papilla can no longer reach and a dark triangle opens (after Tarnow,
// Magner & Fletcher 1992; not yet in dental-facts.md, so the distances are "about"). Story: healthy front view, the gum fades to
// show the crest and the 5 mm gap, the interdental bone is lost, the papilla follows, the gum returns: a black triangle.
// Frame: built crown-up in the tooth frame (CEJ at y = 0, +x toward the patient's left, +z labial) and mirrored into the jaw
// (scale.y = -1), so in the world the crowns hang down and the patient's right (11) is on the viewer's left.
// Note: the kit draws a flat CEJ, so the interdental crest sits about 1.5 mm coronal to the drawn CEJ (in real teeth the CEJ
// curves about 3 mm incisally between incisors and the crest stays below it).
const { smooth, lerp, clamp } = DK.util;
const NEED = 5.0, LOSS = 4.0;          // about 5 mm contact to crest keeps the papilla; 4 mm interdental bone lost (to about 9 mm)
const PAP = 3.5;                       // the papilla then reaches about this far above the lowered crest

const fig = DK.figure({
  fov: 28,
  title: 'Black triangles between teeth',
  subtitle: 'Upper central incisors, FDI 11 and 21 (Universal 8 and 9), in the mouth.',
  view: { theta: 0.0, phi: 1.45, margin: 0.85 }
});
const flip = (o, y) => { o.scale.y = -1; o.position.y = -(y || 0); return o; };   // tooth frame (crown up) → in the mouth (crown down)

// ---------- teeth: 12 11 | 21 22 along x, contacts touching; left teeth mirrored (scale.x = -1)
const s11 = DK.toothPreset(11), s12 = DK.toothPreset(12);
const X11 = s11.md / 2 - 0.02, X12 = s11.md - 0.04 + s12.md / 2 - 0.05;
const mk = (fdi, x, rot, z) => { const t = DK.tooth(fdi, { omit: ['dentin', 'pulp', 'root'] });   // crowns only: the roots stay hidden in the gum flip(t.group); t.group.position.x = x; t.group.position.z = z || 0; if (x > 0) t.group.scale.x = -1; t.group.rotation.y = rot || 0; return t; };
const t11 = mk(11, -X11), t21 = mk(21, X11), t12 = mk(12, -X12, 0.32, -1.0), t22 = mk(22, X12, -0.32, -1.0);
// lowest point of the 11/21 contact: where the mesial surfaces close to within 0.05 mm (tooth frame y)
let CB = 0; for (let y = 2; y < s11.crownL; y += 0.05) { if (DK.toothSurfaceAt(s11, y, 0).x >= X11 - 0.025) { CB = y; break; } }
const CREST0 = CB - NEED, CREST1 = CREST0 - LOSS;   // interdental crest: health, after loss (tooth frame)
const FACIAL_CREST = -1.8, M0 = 1.0;                 // facial bone crest ~2 mm below the CEJ; gum margin ~1 mm on the enamel
fig.part(t11.group, { name: 'Tooth 11', label: false, fit: false, info: 'Upper right central incisor (Universal 8).' });
fig.part(t21.group, { name: 'Tooth 21', label: false, fit: false, info: 'Upper left central incisor (Universal 9).' });
fig.part(t12.group, { name: 'Tooth 12', label: false, fit: false, info: 'Upper right lateral incisor (Universal 7).' });
fig.part(t22.group, { name: 'Tooth 22', label: false, fit: false, info: 'Upper left lateral incisor (Universal 10).' });

// the camera frames the crowns and a band of gum above them (not the roots hidden in the gum): an invisible, unhoverable box
const frameBox = new THREE.Mesh(new THREE.BoxGeometry(17, s11.crownL + 4.5, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
frameBox.raycast = () => {}; frameBox.position.y = -(s11.crownL - 4.5) / 2;
fig.part(frameBox, { name: 'Frame', label: false });

// ---------- bone: crest ~2 mm below the CEJ on the facial, peaking between the teeth (interdental septa); loss only at 11/21
const pk = (x, w) => Math.exp(-Math.pow(x / w, 2));
const bone = DK.perioBone({ width: 29, height: 4.0, depth: 7.0, cortical: 0.8, crest: 1.0,
  scallop: (x, z) => smooth(3.9, 2.8, Math.abs(z)) * ((CREST0 - FACIAL_CREST) * pk(x, 1.25) + (CB - NEED + 0.3 - FACIAL_CREST) * (pk(x + X11 * 2 - 0.1, 1.2) + pk(x - X11 * 2 + 0.1, 1.2))),
  loss: (x, z) => -LOSS * pk(x, 1.6), level: 0 });
flip(bone, FACIAL_CREST);
fig.part(bone, { name: 'Bone', label: false, fit: false, info: 'The bone around the roots. Between two teeth it rises to a peak (the septum) that holds the papilla up.' });

// ---------- gum: one block whose top hugs every neck (margin on the enamel) and rises into a papilla in each embrasure.
// The 11/21 papilla reaches the contact in health and about PAP mm above the crest after the loss.
const G = { width: 30, height: 5.5, depth: 8.2, crest: 2.4, base: M0 - 0.9 };
const necks = [t11, t21, t12, t22].map(t => ({ x: t.group.position.x, z: t.group.position.z, a: t.spec.mdC / 2, b: t.spec.blC / 2, r: t.group.rotation.y }));
const tipOf = k => lerp(CB + 0.25, CREST1 + PAP, k);
const tip12 = CB + 0.1;
const gumTop = k => (x, z) => {
  let cuff = 0; necks.forEach(n => { const c = Math.cos(n.r), s = Math.sin(n.r), lx = (x - n.x) * c - (z - n.z) * s, lz = (x - n.x) * s + (z - n.z) * c;
    const rho = Math.pow(Math.pow(Math.abs(lx) / n.a, 2.3) + Math.pow(Math.abs(lz) / n.b, 2.3), 1 / 2.3); cuff = Math.max(cuff, 0.9 * smooth(1.7, 0.1, (rho - 1) * Math.min(n.a, n.b))); });
  const inZ = smooth(4.6, 3.6, Math.abs(z));          // papillae fill the embrasures and cover the bone peaks
  const p0 = (tipOf(k) - G.base - 0.9) * pk(x, 1.15) * inZ;
  const p1 = (tip12 - G.base - 0.9) * (pk(x + X11 * 2 - 0.1, 1.05) + pk(x - X11 * 2 + 0.1, 1.05)) * inZ;
  return cuff + Math.max(0, p0) + Math.max(0, p1);
};
const gum = new THREE.Mesh(DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(0)), DK.mat('gingiva'));
flip(gum, G.base);
const setGum = k => { const g2 = DK.blockGeometry(G.width, G.height, G.depth, G.crest, gumTop(k)), p = gum.geometry.attributes.position;
  p.array.set(g2.attributes.position.array); p.needsUpdate = true; gum.geometry.computeVertexNormals(); gum.geometry.computeBoundingSphere(); g2.dispose(); };
fig.part(gum, { name: 'Gum', label: false, fit: false, info: 'The gum. Between the teeth it forms the papilla, which is held up by the bone underneath.' });
fig.xray([gum]);

// ---------- the dark of the mouth behind the teeth (what shows through an open embrasure)
const cv = document.createElement('canvas'); cv.width = cv.height = 128;
{ const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 6, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
const mouth = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0x050403 : 0x16110f), alphaMap: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, toneMapped: false }));
mouth.position.set(0, -(CB - 1.2), -4.2); fig.world.add(mouth);

// ---------- the measurement: contact to crest, an ink bar in front of the 11/21 embrasure (seen through the faded gum)
const ink = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd9d4ca : 0x2a2724), toneMapped: false, transparent: true, opacity: 0 });
const bar = new THREE.Group(); fig.world.add(bar); flip(bar);
const ZB = 3.8;
const barLine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), ink), tickA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), ink), tickB = tickA.clone();
bar.add(barLine, tickA, tickB); bar.traverse(o => { o.userData.noShadow = true; o.castShadow = false; });
const setBar = crest => { barLine.scale.y = CB - crest; barLine.position.set(0, (CB + crest) / 2, ZB); tickA.position.set(0, CB, ZB); tickB.position.set(0, crest, ZB); };

// ---------- labels
const P = { k: 0 };
const crestY = () => CREST0 - LOSS * P.k;
const papPart = fig.part(gum, { inPlace: true, name: 'Papilla', sub: 'fills the space', anchor: () => [0, tipOf(P.k) - 1.0 - G.base, 2.9], labelOffset: [-120, 70], dim: false, info: 'The triangle of gum between two teeth. It stays full when the bone between the teeth is close enough to the contact (about 5 mm or less).' });
const cpPart = fig.part(t11.layers.enamel, { inPlace: true, name: 'Contact point', anchor: (() => { const q = DK.toothSurfaceAt(s11, CB + 0.3, 0.35); return [q.x, CB + 0.3, q.z]; })(), labelOffset: [-130, 20], dim: false, info: 'Where the two front teeth touch. The distance from its lowest point to the bone decides whether the papilla can fill the space.' });
const crestPart = fig.part(bone, { inPlace: true, name: 'Bone crest', sub: `${DK.mm(NEED)} below the contact`, anchor: () => [0, crestY() - FACIAL_CREST - 0.2, 3.6], labelOffset: [120, -30], dim: false, info: 'The tip of the bone between the two teeth. Gum disease, an extraction or orthodontic tooth movement can lower it, and lost bone does not grow back on its own.' });
const triPart = fig.part(mouth, { inPlace: true, name: 'Black triangle', sub: 'papilla cannot reach the contact', anchor: () => [0, CB - 1.2 - (tipOf(P.k) + CB) / 2, 4.2], accent: true, dim: false, info: 'An open space under the contact, dark because the mouth behind it is dark. It traps food, can affect speech and is an aesthetic concern.' });

// ---------- params
let lastKey = '';
fig.param('loss', 0, k => { P.k = k; bone.set(k); setGum(k); setBar(crestY());
  const d = CB - crestY(), key = d.toFixed(1);
  if (key !== lastKey) { lastKey = key; papPart.sub = k < 0.3 ? 'fills the space' : 'shrinks with the bone'; papPart.el.innerHTML = papPart.name + `<small>${papPart.sub}</small>`; crestPart.sub = `${DK.mm(d)} below the contact`; crestPart.el.innerHTML = crestPart.name + `<small>${crestPart.sub}</small>`;
    const ok = d <= NEED + 0.05; fig.setReadout([{ k: 'Contact to bone crest (papilla fills up to about 5 mm)', v: DK.mm(d) + (ok ? ' ✓' : ' ⚠'), cls: ok ? 'ok' : 'warn' }]); }
});
fig.param('bar', 0, v => { ink.opacity = v; bar.visible = v > 0.02; });
fig.slider('Bone loss', 0, LOSS, 0.1, 0, v => fig.goTo({ set: { loss: v / LOSS } }, 0.3));
fig.xrayToggle([gum], 'See the bone', false);

// ---------- story: healthy smile → gum fades to show the crest 5 mm below the contact → the bone drops, the papilla follows →
// the gum returns: a black triangle
const FOC = [0, -(CB - 2.5), 2];
fig.story([
  { dur: 0, hold: 1.4, theta: 0.42, phi: 1.42, zoom: 1.0, fov: 30, xray: 0, set: { loss: 0, bar: 0 }, labels: [], caption: 'Healthy front teeth: gum fills the space between them.' },
  { dur: 2.2, hold: 1.6, theta: 0.0, phi: 1.45, zoom: 0.85, focus: FOC, fov: 28, labels: ['Papilla', 'Contact point'], caption: 'The papilla reaches up to the contact point.' },
  { dur: 1.8, hold: 2.0, xray: 0.85, set: { bar: 1 }, theta: 0.12, labels: ['Contact point', 'Bone crest'], caption: 'Underneath, the bone sits about 5 mm below the contact.' },
  { dur: 2.6, hold: 1.8, set: { loss: 1 }, labels: ['Contact point', 'Bone crest'], caption: 'The bone between the teeth is lost.' },
  { dur: 1.8, hold: 0.2, xray: 0, set: { bar: 0 }, theta: 0.0, labels: [], caption: 'The papilla shrinks with it.' },
  { dur: 2.0, hold: 2.8, zoom: 0.95, focus: [0, -3.4, 2], labels: ['Black triangle', 'Papilla', 'Contact point'], caption: 'A dark triangle opens under the contact.' }
]);
fig.start();
