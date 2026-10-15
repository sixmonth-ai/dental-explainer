// Library: the periodontium around a lower left first molar (FDI 36 = Universal 19) in its socket, mesio-distal cut. Tooth frame: CEJ at y = 0, +x mesial, +z buccal.
// poster: end
// Teaching point: the tooth hangs in its socket by the periodontal ligament, a thin fibrous layer between the root's cementum and the
// bone lining the socket (lamina dura), and the gingiva seals the gap around the neck above the bone.
const CREST = -1.8;     // healthy crest ~1.5-2 mm apical to the CEJ (facts §13, §17)
const PDL = 0.3;        // PDL width, inside the measured 0.15-0.38 mm (facts §6)
const CEM = 0.16;       // cementum, drawn thicker than life so it reads at this scale
const LD = 0.55;        // lamina dura (the cortical lining of the socket), schematic thickness
const OFF = 1.3;        // the cut: buccal of the root centres, through the mesiobuccal and distal canals

const fig = DK.figure({
  fov: 26,
  title: 'What holds a tooth in',
  subtitle: 'FDI 36 (Universal 19), mesio-distal cut. Cementum drawn thicker than life.',
  view: { theta: 0.5, phi: 1.25 }
});

const tooth = DK.tooth(36);
const s = tooth.spec, L = tooth.layers;
const hide = g => { g.traverse(m => { if (m.isMesh) m.material = Object.assign(m.material.clone(), { visible: false }); }); return g; };
// three closed shells around the roots, used only for their cut faces: cementum (from the CEJ), PDL and lamina dura (from the crest)
const cementum = hide(DK.pdl(s, CEM, -0.05));
const pdl = hide(DK.pdl(s, CEM + PDL, CREST));
const dura = hide(DK.pdl(s, CEM + PDL + LD, CREST + 0.25));
tooth.group.add(cementum, pdl, dura);

const bone = DK.bone({ width: 22, height: 19, depth: 12.5, cortical: 1.3, crest: 1.6 });
bone.position.y = CREST;
const gum = DK.perioGingiva(s, { margin: 2.0, crest: CREST, width: 22.6, depth: 13.2 });   // margin on enamel ~2 mm above the CEJ
const sulcus = DK.pocket(s, { margin: 2.0, base: 0, width: 0.1 });                          // healthy sulcus: a hairline down to the CEJ
tooth.group.add(sulcus);

// principal fibres of the PDL, drawn on the cut face as fine strands across the ligament: crest fibres run down to the bone crest,
// oblique fibres (most of them) run from the cementum up to the bone, so the tooth hangs in a sling; apical fibres fan out at the apex
const fibreMat = new THREE.MeshBasicMaterial({ color: DK.color(fig.dark ? 0xd2c2ba : 0xe4d8cf), toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
const fibres = new THREE.Mesh(new THREE.BufferGeometry(), fibreMat);
fig.world.add(fibres);
const surf = (y, th, i) => DK.toothSurfaceAt(s, y, th, i);
// the root's outline on the cut itself: cast a ray in the cut plane from just outside the root back onto it
tooth.group.updateMatrixWorld(true);
const rootMeshes = []; [L.root, L.dentin].forEach(l => l.traverse(o => { if (o.isMesh) rootMeshes.push(o); }));
const caster = new THREE.Raycaster();
const cutX = (y, th, i, z) => { const g = surf(y, th, i).x, out = th === 0 ? 1 : -1;
  caster.set(new THREE.Vector3(g + out * 1.2, y, z), new THREE.Vector3(-out, 0, 0)); caster.far = 3;
  const h = caster.intersectObjects(rootMeshes, false)[0]; return h ? h.point.x : g; };
function fibreGeometry(z) {
  const v = [], W = 0.035, push = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), nx = -dy / l * W, ny = dx / l * W;
    [[ax - nx, ay - ny], [ax + nx, ay + ny], [bx + nx, by + ny], [ax - nx, ay - ny], [bx + nx, by + ny], [bx - nx, by - ny]].forEach(p => v.push(p[0], p[1], z)); };
  s.roots.forEach((r, i) => {
    const yEnd = -r.len + 1.0;
    [0, Math.PI].forEach(th => {
      const out = th === 0 ? 1 : -1, furcal = Math.sign(r.x) !== out;
      // on the side facing the other root, the ligament starts below the furcation, under the inter-radicular bone
      const yTop = furcal ? -(s.trunk + 0.9) : CREST - 0.2;
      for (let y = yTop; y > yEnd; y -= 0.42) {
        const px = cutX(y, th, i, z - 0.06), x0 = px + out * (CEM + 0.02), x1 = px + out * (CEM + PDL - 0.02);
        const k = (yTop - y) < 1.2 ? -0.16 : 0.2;   // crest fibres slope down to the crest; oblique fibres rise toward the bone
        push(x0, y, x1, y + k);
      }
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}
let fibreZ = null;

// parts
fig.part(tooth.group, { name: 'Tooth 36', label: false, info: 'Lower left first molar (Universal 19): two roots, mesial and distal, held in one socket each.' });
fig.part(bone, { name: 'Alveolar bone', anchor: [10.5, -8, 4], info: 'The tooth-bearing bone of the jaw: a cortical shell over spongy (cancellous) bone. The crest sits about 1.5-2 mm below the CEJ in health.' });
fig.part(gum, { name: 'Gingiva', sub: 'seals around the neck', anchor: [-7.5, 0.6, 5.6], labelOffset: [-30, -40], info: 'The gum attaches to the tooth just above the bone (supracrestal attachment, about 2 mm), sealing the ligament off from the mouth. A healthy sulcus probes 3 mm or less.' });

const cutZ = sec => (sec.enabled ? sec.offset : OFF) + 0.1;
const cutOn = (e, sec) => sec.enabled && Math.abs(sec.offset - OFF) < 1.2;
const M = s.roots[0];   // mesial root
const yMid = -M.len * 0.45, xm = () => surf(yMid, 0, 0).x;
fig.part(cementum, { inPlace: true, name: 'Cementum', sub: 'covers the root', dim: false, when: cutOn, anchor: (e, sec) => [xm() + CEM * 0.5, yMid - 1.6, cutZ(sec)], labelOffset: [-150, 40],
  info: 'A thin, bone-like layer over the root dentin. The ligament fibres are anchored in it; it is thicker toward the apex.' });
fig.part(pdl, { inPlace: true, name: 'Periodontal ligament', sub: '0.15-0.38 mm wide', accent: true, dim: false, when: cutOn, anchor: (e, sec) => [xm() + CEM + PDL * 0.5, yMid, cutZ(sec)], labelOffset: [150, -40],
  info: 'Collagen fibres slung between cementum and bone: the tooth hangs in them rather than resting on bone, so it can move very slightly and cushion bite forces. Thinnest at the middle third of the root.' });
fig.part(dura, { inPlace: true, name: 'Lamina dura', sub: 'socket wall', dim: false, when: cutOn, anchor: (e, sec) => [xm() + CEM + PDL + LD * 0.5, yMid + 2.2, cutZ(sec)], labelOffset: [150, -30],
  info: 'The dense bone lining the socket, where the other ends of the ligament fibres insert. It shows as a white line around the root on a radiograph.' });
fig.part(sulcus, { inPlace: true, name: 'Sulcus', sub: 'healthy, ≤ 3 mm', dim: false, when: cutOn, anchor: (e, sec) => [surf(1.0, 0).x + 0.1, 1.0, cutZ(sec)], labelOffset: [140, -50],
  info: 'The shallow groove between gum and tooth. At its base the junctional epithelium attaches the gum to the tooth near the CEJ.' });

fig.enableSection([0, 0, 1], [
  { objects: [bone.userData.layers.cortical], color: DK.COLORS.corticalCap },
  { objects: [bone.userData.layers.cancellous], color: 0xffffff, texture: bone.userData.layers.cancellous.userData.capTexture },
  { objects: [dura], color: DK.COLORS.corticalCap, kind: 'cortical' },
  { objects: [gum], color: DK.COLORS.gingivaCap },
  { objects: [pdl], color: DK.COLORS.pdl, kind: 'plain' },
  { objects: [sulcus], color: 0x4a403c },
  { objects: [cementum], color: DK.COLORS.cementum, kind: 'plain' },
  { objects: [L.enamel], color: DK.COLORS.enamelCap },
  { objects: [L.root, L.dentin], color: DK.COLORS.dentinCap },
  { objects: [L.pulp], color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-3.5, 3.5], offset: OFF } });
const ROOT_FOCUS = [surf(yMid, 0, 0).x + 0.5, yMid + 0.6, OFF];
fig.view('Ligament', { section: true, offset: OFF, theta: 0.05, phi: 1.5, zoom: 0.3, focus: ROOT_FOCUS, labels: ['Cementum', 'Periodontal ligament', 'Lamina dura'] });

fig.onFrame(() => {
  const sec = fig.section, on = sec.enabled && Math.abs(sec.offset - OFF) < 1.2;
  fibres.visible = on;
  if (on && sec.offset !== fibreZ) { fibreZ = sec.offset; fibres.geometry.dispose(); fibres.geometry = fibreGeometry(sec.offset + 0.06); }
});

// story: the molar in its bone and gum → the cut sweeps in → push in on the mesial root: cementum, ligament, socket wall →
// up to the neck: the gum seals above the bone → hero: the whole attachment in one frame
fig.story([
  { fov: 32, dur: 0, hold: 1.4, theta: 0.75, phi: 1.2, zoom: 1.05, section: false, labels: ['Gingiva', 'Alveolar bone'], caption: 'A lower molar in its socket.' },
  { fov: 26, dur: 2.2, hold: 0.2, theta: 0.08, phi: 1.45, zoom: 1, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 7 },
  { dur: 2.2, hold: 1.4, offset: OFF, labels: ['Gingiva', 'Alveolar bone'], caption: 'Cut through both roots.' },
  { dur: 2.2, hold: 2.6, theta: 0.04, phi: 1.5, zoom: 0.3, focus: ROOT_FOCUS, labels: ['Cementum', 'Periodontal ligament', 'Lamina dura'], caption: 'The root never touches the bone: ligament fibres span the gap from cementum to socket wall.' },
  { dur: 2.0, hold: 2.4, zoom: 0.36, focus: [surf(0, 0).x + 1.2, 0.2, OFF], labels: ['Sulcus', 'Gingiva'], caption: 'Above the bone, the gum attaches to the tooth and seals the ligament off.' },
  { dur: 2.4, hold: 2.6, zoom: 0.84, theta: 0.12, phi: 1.42, focus: [1.5, -4.2, OFF], drift: 0, labels: ['Gingiva', 'Cementum', 'Periodontal ligament', 'Lamina dura'], caption: '' }
]);
fig.start();
