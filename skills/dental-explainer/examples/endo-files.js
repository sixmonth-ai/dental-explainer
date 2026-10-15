// Example: ISO hand K-files 10–40 side by side (the colour cycle), then a 25/.02 K-file next to 25/.04 and 25/.06 NiTi
// rotary files: same tip, different taper. D0 and D16 are computed from the same constants that build the files
// (DK.fileDiameter). Files stand tip-down on a common baseline (tip at y = 0); the D16 line marks the end of the flutes.
const SIZES = [10, 15, 20, 25, 30, 35, 40], GAP = 4.2, LENGTH = 25, FLUTES = 16;
const TAPERS = [0.04, 0.06];                       // rotary tapers shown beside the 25/.02 hand file
const fig = DK.figure({
  fov: 26,
  title: 'ISO files: size, colour, taper',
  subtitle: `K-files 10–40 (.02), then 25/.02 beside 25/.04 and 25/.06 rotary files. ${LENGTH} mm files.`,
  view: { theta: 0.15, phi: 1.5, margin: 0.95 }
});

const files = [], X = i => (i - (SIZES.length + TAPERS.length - 1) / 2) * GAP;
SIZES.forEach((size, i) => {
  const f = DK.endoFile({ kind: 'K', size, taper: 0.02, length: LENGTH, flutes: FLUTES }); f.position.x = X(i); files.push(f);
  const iso = DK.isoColor(size);
  fig.part(f, { name: `${size}`, sub: iso.name, anchor: [0, LENGTH + 5.5, 2.3], labelOffset: [0, -34], info: `K-file ${size}: tip D0 ${DK.fileDiameter(size, 0.02, 0).toFixed(2)} mm, D16 ${DK.fileDiameter(size, 0.02, 16).toFixed(2)} mm, ${iso.name} handle. Twisted square section, .02 taper.` });
});
const rotary = TAPERS.map((taper, k) => {
  const f = DK.endoFile({ kind: 'rotary', size: 25, taper, length: LENGTH, flutes: FLUTES }); f.position.x = X(SIZES.length + k); files.push(f);
  const t = `.${Math.round(taper * 100).toString().padStart(2, '0')}`;
  fig.part(f, { name: `25/${t}`, sub: 'NiTi rotary', anchor: [0, LENGTH + 5.5, 1.3], labelOffset: [0, -34], accent: taper === 0.06, info: `Rotary file 25/${t}: same 0.25 mm tip as the red K-file, but D16 = ${DK.fileDiameter(25, taper, 16).toFixed(2)} mm. The red ring on the latch shank is the ISO size colour.` });
  return f;
});
// D16: the end of the 16 mm of cutting flutes, as a thin line across the row (a flat ribbon: WebGL lines are 1 px)
const W = (SIZES.length + TAPERS.length) * GAP, lineMat = new THREE.MeshBasicMaterial({ color: DK.color(0x9a948a), toneMapped: false, transparent: true, opacity: 0.8 });
const d16 = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.08), lineMat); d16.position.set(0, FLUTES, -1.2);
const d0 = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.08), lineMat.clone()); d0.position.set(0, 0, -1.2);
fig.part(d16, { name: 'D16', sub: '16 mm of flutes', anchor: [W / 2, 0, 0], info: 'The cutting flutes end 16 mm from the tip on every ISO file; the rest of the length is a smooth shaft.' });
fig.part(d0, { name: 'D0', sub: 'tip = size ÷ 100 mm', anchor: [W / 2, 0, 0], info: 'The ISO size is the tip diameter in hundredths of a millimetre: a size 25 is 0.25 mm at D0.' });

// taper slider: reshapes the last rotary file live, and the readout follows
const live = rotary[rotary.length - 1], liveSpec = live.spec;
const readout = taper => fig.setReadout([
  { k: 'K-file 25/.02', v: `D0 ${DK.fileDiameter(25, 0.02, 0).toFixed(2)} · D16 ${DK.fileDiameter(25, 0.02, 16).toFixed(2)} mm` },
  { k: `Rotary 25/.${Math.round(taper * 100).toString().padStart(2, '0')}`, v: `D0 ${DK.fileDiameter(25, taper, 0).toFixed(2)} · D16 ${DK.fileDiameter(25, taper, 16).toFixed(2)} mm`, cls: 'ok' }
]);
readout(TAPERS[TAPERS.length - 1]);
fig.standardControls({ explode: false });
fig.slider('Taper', 0.02, 0.08, 0.01, TAPERS[TAPERS.length - 1], v => {
  const nf = DK.endoFile({ kind: 'rotary', size: 25, taper: v, length: LENGTH, flutes: FLUTES });
  live.body.geometry.dispose(); live.body.geometry = nf.body.geometry; readout(v);
});
fig.view('Tips', { theta: 0.1, phi: 1.52, zoom: 0.28, focus: [X(SIZES.length) - 1, 3.5, 0] });

// story: the row → push in on the handles (colour cycle) → down the shafts to the flutes → the two 25s at the tip → hero
const x25 = X(3), xr = X(SIZES.length + 1);
fig.story([
  { dur: 0, hold: 1.4, theta: 0.5, phi: 1.3, zoom: 1.05, labels: [] },
  { dur: 2.2, hold: 2.0, theta: 0.15, phi: 1.5, zoom: 0.62, focus: [0, LENGTH + 6, 0], labels: SIZES.map(String) },
  { dur: 2.2, hold: 1.6, zoom: 0.75, focus: [0, 10, 0], labels: ['D16', 'D0'] },
  { dur: 2.2, hold: 2.4, theta: 0.1, phi: 1.52, zoom: 0.3, focus: [(x25 + xr) / 2 + 2, 4, 0], labels: ['25', '25/.04', '25/.06'] },
  { dur: 2.2, hold: 2.4, theta: 0.15, phi: 1.5, zoom: 1, focus: 'auto', labels: ['25', '25/.06', 'D16'] }
]);
fig.start();
