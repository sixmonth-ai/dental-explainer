// Example: the patient's left permanent teeth (quadrants 2 and 3), arch straightened, seen from the buccal side.
// Anterior is to the viewer's right. Maxillary teeth are mirrored crown-down (scale.y = −1), as in the mouth.
const fig = DK.figure({
  fig: 'Fig. 3 · Dentition · Quadrants 2 & 3',
  title: 'Permanent teeth of the left side',
  subtitle: 'Each tooth is built from average Wheeler dimensions. Hover a tooth for its FDI and Universal numbers and its typical roots. Note the maxillary canine’s long root, the two-rooted upper first premolar, and three-rooted upper vs two-rooted lower molars.',
  view: { theta: 0, phi: 1.5 }, autoRotate: false
});

const UPPER_CEJ = 21;          // upper CEJs sit above the lower crowns + the upper crowns (arch straightened, no overbite)
const universal = fdi => { const q = Math.floor(fdi / 10), p = fdi % 10; return q === 1 ? 9 - p : q === 2 ? 8 + p : q === 3 ? 25 - p : 24 + p; };

function row(quadrant, y0, mirror) {
  let x = 0;                   // midline contact
  for (let p = 1; p <= 7; p++) {
    const fdi = quadrant * 10 + p, t = DK.tooth(fdi), s = t.spec;
    x -= s.md / 2;             // tooth centre (distal is −x on screen-left)
    t.group.position.set(x, y0, 0);
    if (mirror) t.group.scale.y = -1;
    x -= s.md / 2;
    const nRoots = s.roots.length;
    fig.part(t.group, {
      name: String(fdi), sub: `#${universal(fdi)}`, anchor: [0, s.crownL * 0.6, 0], labelOffset: [0, mirror ? -150 : 150],
      explode: [0, mirror ? 10 : -10, 0],
      info: `${s.name}. FDI ${fdi} = Universal ${universal(fdi)}. ${nRoots} root${nRoots > 1 ? 's' : ''}; crown ${s.crownL} mm, root ${s.rootL} mm, MD ${s.md} mm.`
    });
  }
}
row(3, 0, false);                                   // mandibular, crowns up
row(2, UPPER_CEJ, true);         // maxillary, crowns down
fig.standardControls();
fig.setReadout([
  { k: 'Shown', v: '14 of 16 left teeth (third molars omitted)' },
  { k: 'Full permanent set', v: '32 (8 per quadrant)' },
  { k: 'Numbering', v: 'FDI label, Universal below' }
]);
fig.start();
