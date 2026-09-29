// Refine 1: setTrunkKnown (R6), the zoom clamp and fit() (R16), the keyboard, 'inspect', the control section's anchor,
// frame and twigs, reduced motion. Real three r147, fake DOM, a clock the test drives (tests/tree-harness.cjs).
const { make } = require('./tree-harness.cjs');
let fails = 0, n = 0;
const ok = (cond, msg) => { n++; if (!cond) fails++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];
const PALE = 0.22;

function grown(opts) {
  const h = make(opts);
  const t = h.tree;
  t.frame('arrival'); h.step(100);
  t.frame('roots'); h.step(600);
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.playIntro(900, { leaves: 0 }); h.step(1400);
  LIMBS.forEach((id, i) => { t.setStub(id, false); t.setLimbFill(id, 1); t.setTwigs(id, Array.from({ length: 6 }, (_, k) => ({ id: `${id}${k}`, state: k === 5 ? 'bud' : 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' }))); });
  t.setRootBalance(0.7);
  t.frame('offer'); h.step(3000);
  return h;
}

/* ---------- R6: the trunk ---------- */
{
  const h = make({});
  const t = h.tree;
  ok(typeof t.setTrunkKnown === 'function', 'setTrunkKnown exists');
  t.frame('roots'); h.step(300);
  t.playIntro(900, { leaves: 0 }); h.step(1500);
  ok(t.planted && near(t.mat.bark.opacity, PALE, 0.001) && t.mat.bark.transparent === true, `a fresh tree's trunk stands pale after the planting (opacity ${t.mat.bark.opacity.toFixed(3)})`);
  const stub = t.branches.get('pricing');
  ok(near(stub.mat.opacity, t.mat.bark.opacity, 0.001), `the same opacity as a limb's stub (${stub.mat.opacity.toFixed(3)})`);
  ok(t.mat.bark.emissive.getHex() === 0 && t.mat.bark.type === stub.mat.type, 'same material treatment, nothing emissive');
  t.setTrunkKnown(true); h.step(200);
  const mid = t.mat.bark.opacity;
  ok(mid > PALE + 0.05 && mid < 0.99, `it resolves by easing, not a cut (${mid.toFixed(3)} after 200 ms)`);
  h.step(3000);
  ok(t.mat.bark.opacity === 1 && t.mat.bark.transparent === false, 'and ends fully resolved (opaque bark again)');
  t.setTrunkKnown(false); h.step(3000);
  ok(near(t.mat.bark.opacity, PALE, 0.01), 'an answer taken back makes it pale again');
  // the control twigs' wood follows the trunk
  t.setTwigs('control', [{ id: 'ownership', state: 'leaf', grade: 3, kind: 'you' }]); h.step(600);
  ok(near(t.ctl.mat.opacity, PALE, 0.01), 'the control twigs wear the trunk\'s pale bark');
  // the intro's demonstration tree shows a resolved trunk, and only while the intro or the arrival frames it
  t.toSeed(); h.step(100);
  t.frame('intro'); t.playIntro(1200, { phases: { roots: 1, trunk: 1, limbs: 1, leaves: 1 }, leaves: 1, preset: 'intro' }); h.step(1600);
  ok(t.mat.bark.opacity === 1, 'the intro\'s own tree shows the trunk resolved');
  t.frame('arrival'); h.step(300);
  ok(t.mat.bark.opacity === 1, 'still resolved when the arrival frames the standing tree');
  t.toSeed(); t.frame('roots'); h.step(300); t.playIntro(900, { leaves: 0 }); h.step(1500);
  ok(near(t.mat.bark.opacity, PALE, 0.001), 'after the intro the visitor\'s own planting is pale again');
  // a page that never calls setTrunkKnown is asked through Mercer.trunkKnown()
  const h2 = make({});
  let known = false;
  h2.win.Mercer.trunkKnown = () => known;
  h2.tree.frame('roots'); h2.step(200); h2.tree.playIntro(600, { leaves: 0 }); h2.step(1200);
  ok(near(h2.tree.mat.bark.opacity, PALE, 0.001), 'Mercer.trunkKnown() false: pale');
  known = true; h2.step(3000);
  ok(h2.tree.mat.bark.opacity === 1, 'Mercer.trunkKnown() true: resolved without a call');
  // reduced motion: a cut
  const h3 = make({ reduce: true });
  h3.tree.frame('roots'); h3.step(100); h3.tree.playIntro(600, { leaves: 0 }); h3.step(200);
  h3.tree.setTrunkKnown(true); h3.step(20);
  ok(h3.tree.mat.bark.opacity === 1, 'reduced motion: the trunk resolves in one frame');
}

/* ---------- R16: zoom, the clamp, fit ---------- */
[[1440, 900], [390, 844], [768, 1024], [1920, 1080]].forEach(([W, H]) => {
  const h = grown({ w: W, h: H });
  const t = h.tree;
  const r0 = t.frameReport();
  ok(r0.inside === true, `${W}: the stage's own frame holds the whole tree inside the usable viewport (${r0.tree.left}..${r0.tree.right} x ${r0.tree.top}..${r0.tree.bottom})`);
  const U = r0.usable;
  const held = (r) => {
    const v = r.view, bw = v.right - v.left, bh = v.bottom - v.top, uw = U.right - U.left, uh = U.bottom - U.top, e = 2;
    const x = bw <= uw ? v.left >= U.left - e && v.right <= U.right + e : v.left <= U.left + e && v.right >= U.right - e;
    const y = bh <= uh ? v.top >= U.top - e && v.bottom <= U.bottom + e : v.top <= U.top + e && v.bottom >= U.bottom - e;
    return x && y;
  };
  // zoom in hard about each corner of the screen, then about a point far outside it: the tree never leaves
  let worst = true;
  [[0, 0], [W, 0], [0, H], [W, H], [-4000, 9000], [W / 2, H / 2]].forEach(([cx, cy]) => {
    t.fit(); h.step(800);
    for (let i = 0; i < 12; i++) { t.zoomBy(1.4, { x: cx, y: cy }); h.step(120); const r = t.frameReport(); if (r.zoom.asked > 1.3 && !held(r) && t.zoom.k === t.zoom.tk) worst = false; }
    h.step(800);
    if (!held(t.frameReport())) worst = false;
  });
  ok(worst, `${W}: zoomed about every corner and a point far off screen, the tree never leaves the usable viewport`);
  ok(t.zoomLevel() === h.GT.ZOOM.max && t.frameReport().zoom.k === h.GT.ZOOM.max, `${W}: zoom stops at ${h.GT.ZOOM.max}`);
  for (let i = 0; i < 30; i++) t.zoomBy(0.5);
  h.step(1000);
  let r = t.frameReport();
  ok(r.zoom.k === 1 && r.zoom.x === 0 && r.zoom.y === 0, `${W}: zooming out stops at 1 with no pan left over: the stage's own frame`);
  // fit()
  t.zoomBy(2.2, { x: U.right - 10, y: U.top + 10 }); h.step(1000);
  ok(t.frameReport().zoom.k > 2, `${W}: zoomed to ${t.frameReport().zoom.k}`);
  const back = t.fit(); h.step(1000);
  r = t.frameReport();
  ok(back === true && r.zoom.k === 1 && r.zoom.x === 0 && r.zoom.y === 0 && r.view.top === r.tree.top && r.view.left === r.tree.left, `${W}: fit() returns to the stage's own frame (and still answers true, as the old sizing call did)`);
  ok(JSON.stringify(r.tree) === JSON.stringify(r0.tree), `${W}: the frame after fit() is the frame before any zoom`);
});
{
  const h = grown({});
  const t = h.tree, c = t.canvas;
  // zoom about the pointer: the anchor under it stays put
  const a0 = t.anchor('pricing');
  t.zoomBy(1.0001, a0); // warm
  t.fit(); h.step(500);
  const a = t.anchor({ limb: 'pricing', t: 0.5 });
  c.dispatch('wheel', { ctrlKey: true, deltaY: -300, deltaMode: 0, clientX: a.x, clientY: a.y }); h.step(1200);
  const b = t.anchor({ limb: 'pricing', t: 0.5 });
  const Z = t.frameReport().zoom;
  ok(Z.k > 1.5, `Ctrl + wheel zooms (k ${Z.k})`);
  ok(near(a.x, b.x, 1.5) && near(a.y, b.y, 1.5), `about the pointer: the point under it moved ${Math.hypot(a.x - b.x, a.y - b.y).toFixed(2)} px`);
  const ev = c.dispatch('wheel', { ctrlKey: true, deltaY: -100, clientX: a.x, clientY: a.y });
  ok(ev.prevented === true, 'Ctrl + wheel is taken from the page');
  t.fit(); h.step(800);
  const plain = c.dispatch('wheel', { deltaY: -300, clientX: a.x, clientY: a.y }); h.step(300);
  ok(plain.prevented === false && t.zoomLevel() === 1, 'a plain wheel is left to the page: no zoom, not prevented');
  const meta = c.dispatch('wheel', { metaKey: true, deltaY: -300, clientX: a.x, clientY: a.y }); h.step(600);
  ok(meta.prevented && t.zoomLevel() > 1, 'Cmd + wheel zooms too');
  // a stage change starts from its own frame; the same stage keeps the zoom
  t.frame('offer'); ok(t.zoomLevel() > 1, 'frame() of the stage already in play keeps the zoom');
  t.frame('money'); ok(t.zoomLevel() === 1, 'a new stage starts from its own frame');
  h.step(2000);
  // pinch: two pointers, zoom follows the fingers, no tap comes out, drag still turns
  let taps = 0; t.on('select', () => taps++); t.on('inspect', () => taps++);
  const yaw0 = t.yaw;
  c.dispatch('pointerdown', { pointerId: 1, clientX: 900, clientY: 400 });
  c.dispatch('pointerdown', { pointerId: 2, clientX: 1000, clientY: 400 });
  c.dispatch('pointermove', { pointerId: 2, clientX: 1100, clientY: 400 });
  ok(near(t.zoom.k, 2, 0.01) && t.zoom.k === t.zoom.tk, `a pinch from 100 to 200 px doubles the zoom at once (${t.zoom.k.toFixed(2)})`);
  c.dispatch('pointerup', { pointerId: 2, clientX: 1100, clientY: 400 });
  c.dispatch('pointerup', { pointerId: 1, clientX: 900, clientY: 400 });
  ok(taps === 0 && t.yaw === yaw0, 'the pinch neither taps nor turns');
  // Final 1 (Task 21) changed one thing here: while the visitor is zoomed in, the same drag pans instead of turning, so a
  // branch can be brought to the middle. At zoom 1, which is every questioning screen, the drag turns as R16 left it.
  const panX = t.zoom.tx;
  c.dispatch('pointerdown', { pointerId: 4, clientX: 900, clientY: 400 });
  c.dispatch('pointermove', { pointerId: 4, clientX: 950, clientY: 400 });
  c.dispatch('pointerup', { pointerId: 4, clientX: 950, clientY: 400 });
  ok(t.yaw === yaw0 && t.zoom.tx !== panX, 'zoomed in, a drag pans and does not turn');
  t.fit(); h.step(600);
  c.dispatch('pointerdown', { pointerId: 3, clientX: 900, clientY: 400 });
  c.dispatch('pointermove', { pointerId: 3, clientX: 950, clientY: 400 });
  c.dispatch('pointerup', { pointerId: 3, clientX: 950, clientY: 400 });
  ok(near(t.yaw - yaw0, 50 * 0.008, 1e-6), 'a drag turns as before');
  t.zoomBy(2); h.step(400); // back where the pinch left it, for the event check below
  // events
  const seen = []; t.on('zoom', (z) => seen.push(z.k));
  t.fit(); t.zoomBy(h.GT.ZOOM.step);
  ok(seen.length === 2 && seen[0] === 1 && near(seen[1], 1.25, 1e-9), `'zoom' tells the shell where it stands (${seen.join(', ')})`);
  // before the planting nothing zooms
  const h0 = make({}); h0.tree.frame('roots'); h0.step(300);
  ok(h0.tree.zoomBy(2) === 1, 'no zoom before the tree is planted');
  // reduced motion: a cut
  const hr = grown({ reduce: true });
  hr.tree.zoomBy(2);
  ok(hr.tree.zoom.k === 2, 'reduced motion: zoomBy is a cut');
  hr.tree.fit();
  ok(hr.tree.zoom.k === 1 && hr.tree.zoom.x === 0, 'reduced motion: fit() is a cut');
  // the snapshot is the stage's own frame
  const hs = grown({});
  hs.tree.zoomBy(3); hs.step(900);
  let offs = null;
  const orig = hs.tree.camera.setViewOffset.bind(hs.tree.camera);
  hs.tree.camera.setViewOffset = (...a2) => { offs = a2; return orig(...a2); };
  hs.tree.snapshot();
  ok(offs && offs[4] === 1440 && offs[5] === 900, 'snapshot() renders the unzoomed frame');
  hs.step(50);
  ok(near(hs.tree.camera.view.width, 1440 / 3, 0.5), 'and the next frame is zoomed again');
}

/* ---------- R16: the keyboard on the stage host, 'inspect' ---------- */
{
  const h = grown({});
  const t = h.tree, st = h.stage;
  ok(st.getAttribute('tabindex') === '0' && !!st.getAttribute('aria-label') && st.getAttribute('aria-hidden') == null && st.getAttribute('role') === 'group', 'the stage host is focusable, named, and no longer aria-hidden');
  ok(t.canvas.getAttribute('aria-hidden') === 'true', 'the canvas stays hidden from a screen reader');
  const key = (k, extra = {}) => st.dispatch('keydown', { key: k, target: st, ...extra });
  const y0 = t.yaw;
  let e = key('ArrowRight'); h.step(2500);
  ok(e.stopped && e.prevented && near(t.yaw - y0, h.GT.ZOOM.turn, 0.02), `Right turns the tree by ${h.GT.ZOOM.turn} rad, eased (${(t.yaw - y0).toFixed(3)}), and the key stops at the stage`);
  key('ArrowLeft'); h.step(2500);
  ok(near(t.yaw, y0, 0.03), 'Left turns it back');
  e = key('+'); h.step(800); ok(e.stopped && near(t.zoomLevel(), 1.25, 1e-9), '+ zooms in');
  key('='); h.step(800); ok(near(t.zoomLevel(), 1.5625, 1e-9), '= zooms in too (the same key unshifted)');
  key('-'); h.step(800); ok(near(t.zoomLevel(), 1.25, 1e-9), '- zooms out');
  e = key('0'); h.step(800); ok(e.stopped && t.zoomLevel() === 1, '0 fits');
  e = key('+', { ctrlKey: true }); ok(!e.stopped && !e.prevented && t.zoomLevel() === 1, 'Ctrl + is left to the browser');
  e = key('a'); ok(!e.stopped, 'other keys pass through');
  e = key('Tab'); ok(!e.stopped && !e.prevented, 'Tab is never trapped');
  const inner = new h.El('button'); st.appendChild(inner);
  e = st.dispatch('keydown', { key: 'ArrowRight', target: inner }); ok(!e.stopped, 'a key on a control inside the stage is that control\'s');
  // parts: Down moves the focus, Enter inspects
  const got = []; t.on('inspect', (x) => got.push(x)); const tw = []; t.on('twig', (x) => tw.push(x));
  key('ArrowDown'); h.step(50);
  ok(t.focusAt === 0 && t.focusParts[0].id === 'trunk' && t.focusEl.style.opacity === '1' && /translate3d/.test(t.focusEl.style.transform), 'Down focuses the first part (the trunk) and the ring stands on it');
  ok(t.liveEl.textContent.length > 0 && t.liveEl.getAttribute('role') === 'status', `the live line names it ("${t.liveEl.textContent}")`);
  key('ArrowDown'); key('ArrowDown'); h.step(50);
  const part = t.focusParts[t.focusAt];
  ok(part.kind === 'twig' && part.id === 'pricing0', `then the first limb, then its first twig (${part.kind} ${part.id})`);
  e = key('Enter');
  const a = t.anchor({ limb: 'pricing', twig: 0 });
  ok(e.stopped && got.length === 1 && got[0].id === 'pricing0' && got[0].kind === 'twig' && near(got[0].x, a.x, 1) && near(got[0].y, a.y, 1) && got[0].key === true, `Enter emits 'inspect' { id, kind: 'twig', x, y } at the twig (${JSON.stringify(got[0])})`);
  for (let i = 0; i < 5; i++) key('ArrowDown');
  ok(t.focusParts[t.focusAt].id === 'pricing5', 'five more: the unanswered twig');
  key(' ');
  ok(tw.length === 1 && tw[0].id === 'pricing5' && got.length === 2 && got[1].state === 'bud', 'Space on a bud emits \'twig\' then \'inspect\', as a tap does');
  key('ArrowUp'); ok(t.focusParts[t.focusAt].id === 'pricing4', 'Up goes back');
  e = key('Escape'); ok(e.stopped && t.focusAt === -1 && t.focusEl.style.opacity === '0', 'Escape lets the part go');
  e = key('Escape'); ok(!e.stopped, 'a second Escape is the page\'s');
  key('ArrowUp'); ok(t.focusParts[t.focusAt].kind === 'root', 'Up from nothing starts at the far end: a root bundle');
  key('Enter'); ok(got[got.length - 1].kind === 'root' && ['you', 'sector', 'web', 'assumed'].includes(got[got.length - 1].id), `a root inspects as { kind: 'root', id: source } (${got[got.length - 1].id})`);
  st.dispatch('blur', {}); ok(t.focusAt === -1, 'leaving the stage drops the part focus');
  // a tap
  t.frame('offer'); h.step(1500);
  got.length = 0; tw.length = 0;
  const sel = []; t.on('select', (x) => sel.push(x));
  const tip = t.anchor({ limb: 'pricing', twig: 2 });
  const tap = (x, y) => { t.canvas.dispatch('pointerdown', { pointerId: 9, clientX: x, clientY: y }); t.canvas.dispatch('pointerup', { pointerId: 9, clientX: x, clientY: y }); };
  tap(tip.x + 3, tip.y - 2);
  ok(got.length === 1 && got[0].id === 'pricing2' && got[0].kind === 'twig' && near(got[0].x, tip.x, 1) && sel.length === 1 && tw.length === 0, `a tap on an answered twig: 'select' still fires, then 'inspect' for the twig (${JSON.stringify(got[0])})`);
  const bud = t.anchor({ limb: 'pricing', twig: 5 });
  tap(bud.x, bud.y);
  ok(tw.length === 1 && tw[0].id === 'pricing5' && got.length === 2 && got[1].id === 'pricing5', 'a tap on a bud: \'twig\' is kept, \'inspect\' is added');
  tap(5, 5);
  ok(got.length === 2, 'a tap on the sky inspects nothing');
}

/* ---------- the control section ---------- */
{
  const h = grown({});
  const t = h.tree;
  ok(h.GT.PRESETS.includes('control'), 'PRESETS has \'control\' (app.js looks for it)');
  const a = t.anchor('control'), b = t.anchor({ limb: 'trunk', t: 0.8 }), mid = t.anchor('trunk'), top = t.anchor('top');
  ok(a && b && near(a.x, b.x, 0.01) && near(a.y, b.y, 0.01), 'anchor(\'control\') and anchor({ limb: \'trunk\', t: 0.8 }) are the same point');
  ok(a.y < mid.y && a.y > top.y, `on the trunk's upper third: above its middle, below its top (${Math.round(top.y)} < ${Math.round(a.y)} < ${Math.round(mid.y)})`);
  const p1 = t.frame('control'); h.step(1500);
  const r1 = t.frameReport();
  ok(p1.preset === 'control' && r1.kind === 'trunk' && r1.inside && r1.anchors.control.inView, 'frame(\'control\') is the trunk\'s frame, the whole tree inside, the anchor in view');
  t.frame('offer'); h.step(1500);
  const p2 = t.frame({ limb: 'trunk', t: 0.8 }); h.step(1500);
  ok(p2.preset === 'control' && near(p2.yaw % (Math.PI * 2), p1.yaw % (Math.PI * 2), 1e-6), 'frame({ limb: \'trunk\', t: 0.8 }) is the same frame');
  ok(t.frame({ limb: 'demand', t: 0.35 }).preset === 'reach' && t.frame({ limb: 'trunk', t: 0.3 }).preset === 'you', 'other parts name their own frames; a pose object still works');
  ok(t.frame({ dist: 1.0, ms: 0 }).preset === 'you', 'frame({ dist }) is still a pose, not a part');
  // twigs like any other section
  t.frame('control'); h.step(1500);
  const before = t.leafMesh.count;
  t.setTwigs('control', Array.from({ length: 10 }, (_, k) => ({ id: `ctl${k}`, state: k < 7 ? 'leaf' : k === 7 ? 'bud' : k === 8 ? 'ring' : 'cut', grade: 3, kind: k % 2 ? 'sector' : 'you' })));
  h.step(3000);
  const c = t.ctl.twigs;
  ok(c[0] && c[0].f === 1 && c[0].mesh.visible && c[7].bud.visible && c[8].ring.visible && c[9].cut.visible && near(c[9].f, 0.4, 0.01), 'ten control twigs stand on the trunk: leaves, a bud, a ring, a cut');
  ok(t.leafMesh.count === before + 7 * (6 + 8 * 3), `their leaves are drawn (${t.leafMesh.count - before} more)`);
  const tipA = t.anchor({ limb: 'control', twig: 0 }), trunkX = t.anchor({ limb: 'trunk', t: 0.7 });
  ok(tipA && Math.hypot(tipA.x - trunkX.x, tipA.y - trunkX.y) > 8, 'a control twig\'s tip stands off the trunk');
  const ys = c.slice(0, 10).map((x) => x.curve.getPointAt(0).y);
  ok(ys.every((y) => y >= 2.4 * 0.6 && y <= 2.4), `every one leaves the trunk's upper third (y ${ys[0].toFixed(2)}..${ys[9].toFixed(2)} of 2.40)`);
  const got = []; t.on('inspect', (x) => got.push(x)); const sel = []; t.on('select', (x) => sel.push(x));
  t.canvas.dispatch('pointerdown', { pointerId: 4, clientX: tipA.x, clientY: tipA.y }); t.canvas.dispatch('pointerup', { pointerId: 4, clientX: tipA.x, clientY: tipA.y });
  ok(got.length === 1 && got[0].id === 'ctl0' && got[0].limb === 'control', 'a tap on one inspects it');
  let flew = null; t.flight({ x: 10, y: 10 }, 'control', 3, '51%', 'you').then(() => { flew = true; }); h.step(900);
  ok(!!t.ctl.twigs[3] && (!!h.doc.querySelector('.flyer') || !!h.el('flight')), 'flight() to a control twig builds the twig it flies to and puts a flyer on the page');
  t.select('control'); ok(t.selected === 'trunk', 'select(\'control\') selects the trunk');
  // the cap holds with everything on
  LIMBS.forEach((id) => t.setTwigs(id, Array.from({ length: 12 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 5, kind: 'you' }))));
  t.setTwigs('control', Array.from({ length: 12 }, (_, k) => ({ id: `ctl${k}`, state: 'leaf', grade: 5, kind: 'you' })));
  t.setCrownLeaves(1); h.step(5000);
  ok(t.leafMesh.count === t.leafCap && t.leafCap === 34 * 64 + 84 * 46, `every twig on all seven hosts and a full crown: ${t.leafMesh.count} leaves, exactly the cap`);
  t.toSeed(); h.step(100);
  ok(t.ctl.twigs.every((x) => !x || !x.state) && t.zoomLevel() === 1, 'toSeed() clears the control twigs and the zoom');
}

/* ---------- the flat tree honours all of it ---------- */
{
  const h = make({ flat: true });
  const t = h.tree;
  const trunk = () => t.svg.querySelector('.flat-trunk');
  t.playIntro(10, { leaves: 0 });
  ok(trunk() && trunk().getAttribute('opacity') === String(PALE), 'flat: the trunk is pale on a fresh tree');
  t.setTrunkKnown(true);
  ok(trunk().getAttribute('opacity') === '1', 'flat: setTrunkKnown(true) resolves it');
  t.toSeed(); t.playIntro(10, { preset: 'intro' });
  ok(trunk().getAttribute('opacity') === '1', 'flat: the intro\'s tree shows it resolved');
  t.setTrunkKnown(false); t.frame('offer');
  ok(trunk().getAttribute('opacity') === String(PALE), 'flat: and the interview\'s does not');
  ok(t.zoomBy(2) === 2 && /scale\(2/.test(t.svg.style.transform) && t.zoomBy(100) === 4 && t.fit() === true && t.zoomLevel() === 1 && t.svg.style.transform === '', 'flat: zoomBy clamps at 4, fit() returns to 1');
  t.setTwigs('control', [{ id: 'ownership', state: 'leaf', grade: 3, kind: 'you' }, { id: 'ownShare', state: 'bud', grade: 1, kind: 'you' }]);
  const dots = t.svg.querySelectorAll('[data-limb="control"]');
  ok(dots.length === 2, 'flat: control twigs are drawn on the trunk');
  const got = []; t.on('inspect', (x) => got.push(x)); const tw = []; t.on('twig', (x) => tw.push(x));
  dots[0].dispatch('click', {}); dots[1].dispatch('click', {});
  ok(got.length === 2 && got[0].id === 'ownership' && got[0].kind === 'twig' && tw.length === 1 && tw[0].id === 'ownShare', 'flat: a click inspects; a bud still emits \'twig\' first');
  t.svg.clientWidth = 1440; t.svg.clientHeight = 900; // the fake DOM lays nothing out
  ok(t.anchor('control') && t.anchor({ limb: 'trunk', t: 0.8 }).y === t.anchor('control').y && t.anchor('control').y < t.anchor('trunk').y, 'flat: anchor(\'control\') stands above the trunk\'s middle');
  const st = h.stage;
  ok(st.getAttribute('tabindex') === '0', 'flat: the stage host is focusable');
  let e = st.dispatch('keydown', { key: '+', target: st }); ok(e.stopped && t.zoomLevel() === 1.25, 'flat: + zooms');
  e = st.dispatch('keydown', { key: '0', target: st }); ok(e.stopped && t.zoomLevel() === 1, 'flat: 0 fits');
  st.dispatch('keydown', { key: 'ArrowDown', target: st }); st.dispatch('keydown', { key: 'Enter', target: st });
  ok(got.length === 3 && got[2].kind === 'limb' && got[2].id === 'trunk' && got[2].key === true, 'flat: Down then Enter inspects the first part');
}

console.log(fails ? `\n${fails} of ${n} FAILED` : `\nall ${n} passed`);
process.exit(fails ? 1 : 0);
