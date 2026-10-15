// Library: the maxillary right lateral incisor (FDI 12 = Universal 7) beside the central incisor (FDI 11 = Universal 8), both crown up (extracted-tooth convention), true size, then cut mesio-distally through the pulp. Tooth frame: CEJ at y = 0, +x mesial, +z labial; 11 sits mesial of 12 (on the viewer's right from labial).
// poster: end
// Teaching point: the lateral is a smaller copy of the central: a crown about 2 mm narrower (6.5 vs 8.5 mm) and 1.5 mm shorter, on a root as long (13 mm) but much slimmer, whose tip often bends distally; one canal.
const fig = DK.figure({
  fov: 30,
  title: 'Upper lateral incisor',
  subtitle: 'FDI 12 (Universal 7) beside 11, crown up, true size.',
  view: { theta: 0.5, phi: 1.4 }
});
const { smooth } = DK.util;

const meshesOf = o => { const a = []; o.traverse(m => { if (m.isMesh) a.push(m); }); return a; };
const ray = new THREE.Raycaster();

// one incisor with its pulp built here (as in incisor-11): the kit's incisor chamber is a flat-topped block, while a real one is a thin
// fan under the incisal edge, rising into small horns, narrowing into one canal
function incisor(fdi, x, horns, topK) {
  const t = DK.tooth(fdi, { omit: ['pulp'] }), s = t.spec, L = t.layers, R = s.roots[0];
  t.group.position.x = x; t.group.updateMatrixWorld(true);
  const hit = (objs, from, dir, lift = 0.05) => {   // in this tooth's frame
    const o = new THREE.Vector3(...from).add(t.group.position);
    ray.set(o, new THREE.Vector3(...dir).normalize());
    const h = ray.intersectObjects(objs.flatMap(meshesOf), false)[0];
    return h ? [h.point.x - x - dir[0] * lift, h.point.y - dir[1] * lift, h.point.z - dir[2] * lift] : null;
  };
  const zMid = y => { const a = hit([L.enamel], [0, y, 20], [0, 0, -1], 0), b = hit([L.enamel], [0, y, -20], [0, 0, 1], 0); return a && b ? (a[2] + b[2]) / 2 : 0; };
  const ZC = [0, 1.5, 3, 4.5, 6, 7.5].map(y => [y, zMid(y)]);
  const zCrown = y => { for (let i = 1; i < ZC.length; i++) if (y <= ZC[i][0]) { const [y0, z0] = ZC[i - 1], [y1, z1] = ZC[i]; return z0 + (z1 - z0) * DK.util.clamp((y - y0) / (y1 - y0), 0, 1); } return ZC[ZC.length - 1][1]; };
  const Y_TOP = s.crownL * topK, APEX_Y = -R.len + 0.5, W = s.mdC / 7 * 2.0;   // chamber half-width scales with the cervix
  const geo = (() => {
    const ROWS = 90, COLS = 56, sm = (a, b, v) => smooth(a, b, v);
    const topY = xn => Y_TOP - 0.6 * Math.pow(Math.abs(xn), 4) + horns.reduce((h, [c, k]) => h + k * Math.exp(-Math.pow((xn - c) / 0.26, 2)), 0);
    return DK.gridGeometry(ROWS, COLS, (i, j) => {
      const tt = i / ROWS, th = j / COLS * Math.PI * 2, cx = Math.cos(th), sz = Math.sin(th);
      const y0 = APEX_Y + (Y_TOP - APEX_Y) * tt;
      let a, b, px, pz;
      if (y0 < 0) { const c = DK.canalAt(s, 0, y0); a = Math.max(c.r * 1.25, 0.11); b = Math.max(c.r * 1.4, 0.11); px = c.x; pz = c.z; }
      else {
        const k = y0 / Y_TOP, c0 = DK.canalAt(s, 0, 0);
        a = 0.66 + (W - 0.66) * sm(-0.25, 1, k);
        b = 0.74 + (0.26 - 0.74) * sm(0, 1, k);
        px = c0.x * (1 - sm(0, 0.4, k)); pz = c0.z + (zCrown(y0) - c0.z) * sm(0, 0.5, k);
      }
      const w = Math.pow(sm(Y_TOP - 1.6, Y_TOP, y0), 1.3);
      const y = y0 + w * (topY(cx) - Y_TOP);
      const bt = b * (1 - 0.85 * sm(0.95, 1, tt));
      return [px + a * cx, y, pz + bt * sz];
    }, [0, Y_TOP + 0.2, zCrown(Y_TOP)], (c => [c.x, APEX_Y - 0.05, c.z])(DK.canalAt(s, 0, APEX_Y)));
  })();
  const pulp = new THREE.Group(); pulp.add(new THREE.Mesh(geo, t.mats.pulp)); t.group.add(pulp); L.pulp = pulp;
  t.group.updateMatrixWorld(true);
  return { t, s, L, R, hit, zCrown, x };
}
const s12 = DK.toothPreset(12), s11 = DK.toothPreset(11);
const X11 = s12.md / 2 + s11.md / 2 + 1.6;
const A = incisor(12, 0, [[0.5, 0.5], [-0.5, 0.42]], 0.58);          // lateral: two small horns, the mesial a little higher
const C = incisor(11, X11, [[0.62, 0.8], [0, 0.62], [-0.62, 0.68]], 0.6);   // central: three horns
const CUT = Math.round(((A.zCrown(3.5) + C.zCrown(4)) / 2) * 10) / 10;

fig.part(A.t.group, { name: 'Lateral 12', sub: `${A.s.md} mm wide`, anchor: (e, sec) => [0, A.s.crownL - 0.7, sec.enabled ? Math.min(0, sec.offset - 0.3) : 0], labelOffset: [-50, -50], dim: false,
  info: 'Upper right lateral incisor (Universal 7): a smaller copy of the central with rounder incisal corners. Its palatal pit, above the cingulum, traps plaque and is a common place for decay. It is also the tooth most often small and cone-shaped (a peg lateral) or missing.' });
fig.part(C.t.group, { name: 'Central 11', sub: `${C.s.md} mm wide`, anchor: (e, sec) => [0, C.s.crownL - 0.7, sec.enabled ? Math.min(0, sec.offset - 0.3) : 0], labelOffset: [50, -50], dim: false,
  info: 'Upper right central incisor (Universal 8): the widest front tooth, shown for scale.' });

const R = A.R, rU = 0.62, rootPt = [R.x + R.apex[0] * rU * rU - R.ra * 0.55 * (1 - 0.62 * rU), -R.len * rU, R.z + R.rb * 0.6];
fig.part(A.L.dentin, { inPlace: true, name: 'Slim root', sub: `${R.len} mm, tip bends distally`, anchor: rootPt, labelOffset: [-80, 50],
  info: 'As long as the central’s root (about 13 mm) but much thinner, and its tip often curves distally: easy to miss on a straight file.' });
const pHorn = A.hit([A.L.pulp], [0.9, 30, CUT], [0, -1, 0], 0.22) || [0.9, A.s.crownL * 0.6, CUT];
fig.part(A.L.pulp, { inPlace: true, name: 'Pulp horns', anchor: pHorn, labelOffset: [-70, -50], dim: false,
  when: (e, sec) => sec.enabled, info: 'A narrow pulp under the incisal edge, usually with two small horns rather than the central’s three.' });
const cy = -R.len * 0.45, cc = DK.canalAt(A.s, 0, cy);
fig.part(A.L.pulp, { inPlace: true, name: 'One canal', anchor: [cc.x, cy, CUT], labelOffset: [-90, -20], accent: true, dim: false,
  when: (e, sec) => sec.enabled, info: 'One canal, narrower than the central’s and following the distal bend of the root toward the apex.' });

const both = f => [f(A), f(C)].flat();
fig.enableSection([0, 0, 1], [
  { objects: both(T => [T.L.enamel]), color: DK.COLORS.enamelCap },
  { objects: both(T => [T.L.root, T.L.dentin]), color: DK.COLORS.dentinCap },
  { objects: both(T => [T.L.pulp]), color: DK.COLORS.pulpCap }
]);
fig.standardControls({ explode: false, section: { label: 'Cut', on: false, range: [-2.5, 4.5], offset: CUT } });
fig.view('Labial', { theta: 0, phi: 1.5, zoom: 1, focus: 'auto', section: false, labels: ['Lateral 12', 'Central 11', 'Slim root'] });

// story: the pair turning → straight from the lip: the lateral is narrower and shorter → push down onto the slim root with its distal
// bend → the cut sweeps in → push in on the lateral's pulp and canal → hero: both cut, three-quarter
fig.story([
  { fov: 34, dur: 0, hold: 1.4, theta: 0.5, phi: 1.4, zoom: 1.06, section: false, labels: [], caption: 'An upper lateral incisor beside the central.' },
  { fov: 30, dur: 2.2, hold: 2.2, theta: 0.02, phi: 1.5, zoom: 1.0, labels: ['Lateral 12', 'Central 11'], caption: 'About 2 mm narrower and shorter.' },
  { dur: 2.2, hold: 2.2, zoom: 0.7, focus: [0, -7, 0], labels: ['Slim root'], caption: 'A root as long, but slimmer, its tip bending distally.' },
  { fov: 26, dur: 1.8, hold: 0.2, zoom: 1.0, focus: 'auto', theta: 0.12, labels: [] },
  { dur: 0, hold: 0, section: true, offset: 4.5 },
  { dur: 2.2, hold: 1.4, offset: CUT, labels: [], caption: 'Cut open.' },
  { dur: 2.0, hold: 2.2, zoom: 0.6, focus: [0, 0, 0], labels: ['Pulp horns', 'One canal'], caption: 'A narrow pulp and one canal.' },
  { fov: 28, dur: 2.4, hold: 2.6, theta: 0.32, phi: 1.42, zoom: 1.04, focus: 'auto', drift: 0, labels: ['Lateral 12', 'Central 11', 'Slim root', 'Pulp horns', 'One canal'], caption: '' }
]);
fig.start();
