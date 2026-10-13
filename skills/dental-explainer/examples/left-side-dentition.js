// Example: the patient's left permanent teeth (quadrants 2 and 3), arch straightened, seen from the buccal side.
// Seen from the patient's left cheek, anterior is to the viewer's LEFT. Left-quadrant teeth are mirrored mesio-distally
// (scale.x = −1: a preset tooth has right-side chirality), and maxillary teeth crown-down (scale.y = −1), as in the mouth.
const fig = DK.figure({
  title: 'Permanent teeth, left side',
  subtitle: 'Buccal view. FDI numbers, Universal below. Third molars not shown.',
  view: { theta: 0, phi: 1.5 }
});

const UPPER_CEJ = 21;          // upper CEJs sit above the lower crowns + the upper crowns (arch straightened, no overbite)
const universal = fdi => { const q = Math.floor(fdi / 10), p = fdi % 10; return q === 1 ? 9 - p : q === 2 ? 8 + p : q === 3 ? 25 - p : 24 + p; };

function row(quadrant, y0, mirror) {
  let x = 0;                   // midline contact
  for (let p = 1; p <= 7; p++) {
    const fdi = quadrant * 10 + p, t = DK.tooth(fdi), s = t.spec;
    x += s.md / 2;             // tooth centre (distal is +x, screen-right)
    t.group.position.set(x, y0, 0);
    t.group.scale.x = -1;      // left quadrant: mesial (+x in the tooth frame) now points to the midline at x = 0
    if (mirror) t.group.scale.y = -1;
    x += s.md / 2;
    const nRoots = s.roots.length;
    fig.part(t.group, {
      name: String(fdi), sub: `#${universal(fdi)}`, anchor: [0, s.crownL * 0.6, 0], labelOffset: [0, mirror ? -120 : 120],
      explode: [0, mirror ? 10 : -10, 0],
      info: `${s.name}. FDI ${fdi} = Universal ${universal(fdi)}. ${nRoots} root${nRoots > 1 ? 's' : ''}; crown ${s.crownL} mm, root ${s.rootL} mm, MD ${s.md} mm.`
    });
  }
}
row(3, 0, false);                                   // mandibular, crowns up
row(2, UPPER_CEJ, true);         // maxillary, crowns down
fig.standardControls({ explodeLabel: 'Open' });
// story: closed arch → open the jaws so every root is visible
// story (a short film): the whole side → the jaws open with a slight turn → push in on the molars → glide to the front teeth → back out
fig.story([
  { dur: 0, hold: 1.4, theta: 0, phi: 1.5, zoom: 1.02, caption: 'The left side of the permanent dentition, seen from the cheek.' },
  { dur: 2.4, hold: 2.0, theta: 0.22, phi: 1.42, explode: 0.4, caption: 'Open the jaws: upper molars have three roots, lower molars two.' },
  { dur: 2.0, hold: 2.2, zoom: 0.55, focus: [44, 10.5, 0], caption: 'Molars: broad crowns on two or three roots.' },
  { dur: 2.6, hold: 2.2, zoom: 0.55, focus: [9, 10.5, 0], caption: 'Incisors and canines: single, long roots.' },
  { dur: 2.2, hold: 2.0, zoom: 1, focus: 'auto', theta: 0, phi: 1.5, caption: '' }
]);
fig.start();
