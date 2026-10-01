/* intro.js (Mercer 12, owner (a) shell): the homepage (S0), the five introduction slides, and the example.
   Rewritten in Refine 1, rebuilt in Rebuild 1, and rebuilt again for the final pack's Task 04.

   R12 The homepage (#arrival) is TMA's, with the Mercer panel inside it: the route choice (#route-owner, #route-starter),
       Explore an example (#example), and Continue your plan (#resume) with the saved date and Start again (#restart) when a
       saved session exists (M.save.has()). A route press records the route (M.chooseRoute / M.setRoute / M.state.route,
       whichever flow provides) and moves on with M.go('orient'). The green Mercer entry in the top bar (#mercer-go)
       focuses the panel at arrival and opens the wheel's panel on the journey. Nothing here writes a business name: the
       owner route asks it on its first screen (#biz stays on the page, unseen, for old readers).
   04  The five slides (#intro, one #slide-N each): Purpose, Your tree, Your answers, Your result, Before you begin.
       The reader drives them: Back, Continue, a plain count, Skip tour (which goes to slide 5, accepting nothing on their
       behalf). A slide's sentence reveals in short phrases, never letter by letter; Show all text, a press inside the
       slide, or reduced motion brings every phrase in at once, and Continue never waits for it. Nothing auto-advances.
       Slide 3 mounts the real price instrument in a sandbox (M.state and M.commit stood in for), so no sample answer can
       reach the session. Slide 5 carries the method and privacy statements, the Disclaimer, the device-saving choice and
       the start action (#orient-go), each once. M.orient.done() is the contract with flow, unchanged: a cancelable
       `mercer:orient` event, then M.start() or M.go('roots') if the stage has not already moved. A restored session
       (M.save.restored) is taken past the slides at once.
       Replay from Help (M.intro.open({ replay: true })) plays the same deck over any stage that is not moving: the stage,
       the answers and the tree are read first and put back exactly, and slide 5 does not offer the saving choice again.
   R13 Explore an example (#example-panel): a sandbox over the homepage. It asks M.plan.example(route) and renders with
       M.canopy.renderPlanInto(host, plan, { example: true }); without either it shows a working static example (a
       decision, its basis, a marked assumption that can be changed, four labelled branches to inspect, the first action
       card). An owner/starter switch, Build my plan (the chosen route's next step), and Back to the start. Nothing in it
       reads or writes M.state, the save, or the share payload; every figure is labelled Example. The example tree stands
       beside it and the visitor's tree (the seed) is put back on the way out.
   R15 The words about privacy say what the page does and nothing more.
   Switches: ?intro=off skips the slides, ?intro=N (1..5) opens the deck at slide N, ?route=owner|starter chooses a route
   on load, ?orient=off skips the slides (tests only). */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});
const doc = document;
const $ = (s, r = doc) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reduce = () => (typeof M.feel?.reduced === 'function' ? M.feel.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? 0 : ms));
const KEY = 'mercer-intro-seen';
const tree = () => (M.tree && typeof M.tree.frame === 'function' ? M.tree : null);
const play = (name, o) => { try { M.feel?.play?.(name, o); } catch (e) { /* sound is a nicety */ } };
const panOf = (el) => { try { return M.feel?.panOf?.(el) ?? 0.5; } catch (e) { return 0.5; } };
const phone = () => doc.body.dataset.clearing === 'bottom';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const stageNow = () => (typeof M.stage === 'string' ? M.stage : doc.body.dataset.stage) || '';
const stageIs = (s) => stageNow() === s;
const dispatch = (name, detail, cancelable) => { const ev = new CustomEvent(name, { detail, cancelable: !!cancelable }); doc.dispatchEvent(ev); return ev; };

const params = new URLSearchParams(location.search);
const ask = params.get('intro');
let compact = false;
try { compact = !!localStorage.getItem(KEY); } catch (e) { compact = false; }
if (ask === 'full') compact = false;
if (ask === 'compact') compact = true;
const startAt = /^[1-5]$/.test(ask ?? '') ? Number(ask) : null;

const routeNow = () => (M.state?.route === 'starter' ? 'starter' : M.state?.route === 'owner' ? 'owner' : chosenRoute || 'owner');
const bizName = () => String(M.state?.biz ?? '').trim() || (routeNow() === 'starter' ? 'Your idea' : 'Your business');
const tc = (s) => { try { return typeof M.titleCase === 'function' ? String(M.titleCase(s)) : s; } catch (e) { return s; } };
const ROUTE_WORD = { owner: 'I run a business', starter: 'I don’t run a business yet' };

/* ---------- the words ---------- */
/* R8: the Disclaimer, one text for help and (results' side) the plan */
const DISCLAIMER = {
  lines: [
    'Mercer’s results are estimates and suggestions, not guarantees.',
    'They depend on the quality and completeness of what you supply.',
    'Benchmarks and assumptions may not fit your situation exactly.',
    'This is strategic guidance, not legal, tax, accounting, investment or regulated financial advice.',
  ],
  full: [
    'Mercer builds its findings and its plan from your answers, from benchmarks it names, and from assumptions it states where you gave no figure. Where it forecasts, the ranges show how wide the uncertainty is. They do not promise that any outcome will happen.',
    'Every figure you did not supply is marked as a benchmark or as an assumption, so you can see what the plan rests on and replace it. Check anything that matters with a qualified adviser before you act on it.',
  ],
};
M.DISCLAIMER = DISCLAIMER;
/** the labelled block: heading "Disclaimer", four sentences, the full version behind a native disclosure */
M.disclaimerBlock = () => {
  const box = doc.createElement('section');
  box.className = 'disclaimer';
  box.setAttribute('aria-label', 'Disclaimer');
  box.innerHTML = `<h3>Disclaimer</h3><ul>${DISCLAIMER.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <details><summary>Read the full version</summary>${DISCLAIMER.full.map((p) => `<p>${esc(p)}</p>`).join('')}</details>`;
  return box;
};
/* R15: the four things the page does with what you type, said once, the same words everywhere the shell says them */
const PRIVACY = [
  'Mercer sends none of your answers anywhere. The page loads its fonts and its drawing and PDF libraries from Google Fonts, jsDelivr and cdnjs when it opens.',
  'Ask Claude is optional. If you use it, your briefing goes to the host’s model, after you agree.',
  'Downloads are files saved on your device.',
  'If you turn on Save on this device, your answers are stored in this browser.',
];
M.PRIVACY = PRIVACY;

const DEMO = (() => {
  let title = 'Sale value', sub = 'One sale, on average';
  try {
    const h = M.headline?.('price');
    if (h && h.title) { title = String(h.title); if (h.sub) sub = String(h.sub); }
  } catch (e) { /* the COPY words */ }
  return { title, sub };
})();
/* Task 04: the named parts slide 2 reveals, one at a time. `key` is what tree.anchor takes; `part` is what showPart
   lights. Three of them, not nine: the slide says what the picture is, and Help carries the whole key. */
const PARTS = [
  { id: 'roots', key: 'roots', part: 'roots', name: 'Roots', mean: 'Where each figure came from' },
  { id: 'branches', key: { limb: 'demand', t: 0.55 }, part: 'branches', name: 'Limbs', mean: 'Customers, offer, delivery and leverage' },
  { id: 'marker', key: 'crown', part: null, name: 'Goal marker', mean: 'The height you are aiming at' },
];

/* demo twigs. BUDS: every limb pale, nothing answered. FULL: the four source colours and a few buds. No figure. */
const FULL_TWIGS = {
  pricing: [{ id: 'd1', state: 'leaf', grade: 4, kind: 'you' }, { id: 'd2', state: 'leaf', grade: 3, kind: 'sector' }, { id: 'd3', state: 'bud' }],
  demand: [{ id: 'd4', state: 'leaf', grade: 3, kind: 'you' }, { id: 'd5', state: 'leaf', grade: 2, kind: 'web' }, { id: 'd6', state: 'bud' }],
  conversion: [{ id: 'd7', state: 'leaf', grade: 3, kind: 'sector' }, { id: 'd8', state: 'bud' }],
  capacity: [{ id: 'd9', state: 'leaf', grade: 3, kind: 'you' }, { id: 'd10', state: 'estimate', grade: 2, kind: 'assumed' }],
  margin: [{ id: 'd11', state: 'leaf', grade: 2, kind: 'sector' }, { id: 'd12', state: 'bud' }],
  retention: [{ id: 'd13', state: 'leaf', grade: 2, kind: 'assumed' }, { id: 'd14', state: 'leaf', grade: 3, kind: 'you' }],
};
const LIMBS = Object.keys(FULL_TWIGS);
const budsOf = (limb) => FULL_TWIGS[limb].map((x) => ({ id: x.id, state: 'bud' }));
const DEMO_ROOTS = { you: 3, sector: 2, web: 1, assumed: 1 };
/* the six sections of the rebuilt journey (R2), the fallback where flow's M.sectionsFor is not there */
const SECTIONS = {
  owner: [['aim', 'Aim', '--sec-crown'], ['foundations', 'Foundations', '--sec-ground'], ['customers', 'Customers', '--sec-reach'], ['delivery', 'Delivery', '--sec-delivery'], ['leverage', 'Leverage', '--sec-you'], ['plan', 'Plan', '--sec-crown']],
  starter: [['aim', 'Aim', '--sec-crown'], ['foundations', 'Foundations', '--sec-ground'], ['customers', 'Opportunities', '--sec-reach'], ['delivery', 'Test', '--sec-delivery'], ['leverage', 'Launch', '--sec-you'], ['plan', 'Plan', '--sec-crown']],
};
const sectionsOf = (route) => {
  try { const s = M.sectionsFor?.(route); if (Array.isArray(s) && s.length === 6) return s.map((x) => [x.id, x.name, x.hue]); } catch (e) { /* the fallback */ }
  return SECTIONS[route] || SECTIONS.owner;
};
/** the wheel during the demonstration: Aim done, Foundations under way */
function demoProgress(secondDone) {
  return sectionsOf(routeNow()).map(([id, name, hue], i) => ({ id, name, hue, share: 1 / 6, done: i === 0 ? 1 : i === 1 ? secondDone : 0, state: i === 0 ? 'done' : i === 1 ? 'active' : 'upcoming' }));
}
const paintRing = (list) => { try { (M.shell?.paintWheel ?? M.shell?.paintRing)?.(list); } catch (e) { /* the wheel is help.js's */ } };

/* ---------- Task 04: the five slides. The words are in index.html so they are read whether or not this file runs; this
   file drives the slide the reader is on, the phrase reveal and the two demonstrations. ---------- */
const host = $('#intro');
if (!host) return;
/* Declan Murphy's note of 28 September: a five step tour before the first question kills the momentum, and a glossary
   of limbs and roots ahead of any answer fights the reader. So the deck has two lengths. The first run plays slide 1
   alone: its purpose, the device-saving choice, the start action and the shut privacy drawer. The tour (slides 2 to 4,
   the tree, an answer, a result) plays on a replay from Help, where a reader has asked for it. Nothing is deleted:
   every word is still reachable, and the tree names its own parts as they are drawn instead. */
const ALL_SLIDES = [...host.querySelectorAll('.slide')];
const TOUR_ONLY = new Set(['slide-2', 'slide-3', 'slide-4']);
let slides = ALL_SLIDES;
let N = slides.length;
let LAST = N - 1;
/** the deck to play: the tour on a replay or when a reader asked for a slide inside it, the single page otherwise */
function setDeck(full) {
  slides = full ? ALL_SLIDES : ALL_SLIDES.filter((s) => !TOUR_ONLY.has(s.id));
  N = slides.length;
  LAST = N - 1;
  ALL_SLIDES.forEach((s) => { if (!slides.includes(s)) s.hidden = true; });
  if (countEl) countEl.hidden = N < 2;
  return N;
}
const capOf = (i) => slides[i] && slides[i].querySelector('.slide-cap');
const goBtn = $('#intro-go', host), startBtn = $('#orient-go', host), backBtn = $('#intro-back', host);
const skipBtn = $('#intro-skip', host), allBtn = $('#intro-all', host), countEl = $('#intro-count', host);
setDeck(false);
/* the overlay the tree slide draws on: leader lines and small labels beside the part they name. Never read aloud: the
   same three names and meanings stand in the slide's own list, so nothing is lost without it */
const over = doc.createElement('div');
over.id = 'intro-over';
over.setAttribute('aria-hidden', 'true');
over.innerHTML = '<svg id="intro-lines"></svg>';
doc.body.appendChild(over);
const linesEl = $('#intro-lines', over);

/* ---------- state ---------- */
let at = -1;
let seq = 0;
let running = false;
let grown = null;
let demoRoots = false;
let birdsOn = false;
let finished = false;
let replay = null; // { stage, snap, focus } while the deck plays over another stage
let chosenRoute = null; // the card pressed on the homepage, until flow's state carries it

function go(stage) {
  if (typeof M.go === 'function') { try { M.go(stage); } catch (e) { /* fall through */ } }
  if (doc.body.dataset.stage !== stage) {
    doc.body.dataset.stage = stage;
    dispatch('mercer:stage', { stage, section: null });
  }
}

/* ---------- R2 (C14): the tree wears the visitor's mode on the shell's own pages ----------
   app.js's themeTree may still ask for the dark palette on arrival and intro (the old night scene). This runs after it (a
   mutation callback follows the synchronous call), so the visitor's mode is the last word; a no-op once flow's themeTree
   follows data-mode everywhere. */
function themeTree() {
  if (!(stageIs('arrival') || stageIs('intro') || stageIs('orient'))) return;
  try { tree()?.setTheme?.(doc.body.dataset.mode === 'dark' ? 'dark' : 'light'); } catch (e) { /* optional */ }
}
try { new MutationObserver(() => { themeTree(); ground.ink(); }).observe(doc.body, { attributes: true, attributeFilter: ['data-mode', 'data-stage'] }); } catch (e) { /* no observer */ }

/* ---------- R3: the ground under the seed ---------- */
const seedAt = () => (phone() ? { x: 0.5, y: 0.13 } : { x: 0.76, y: 0.58 });
function frameSeed(ms) {
  const t = tree();
  if (!t || t.planted) return;
  try { t.frame('arrival', { at: seedAt(), ms: ms ?? 0 }); } catch (e) { /* the default frame */ }
}
const ground = (() => {
  const cv = $('#ground');
  const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  let raf = 0, t0 = 0, w = 0, h = 0, rgb = '18, 28, 46', dark = false, roots = null;
  /* a fixed root map: seven roots fanning down and out from the seed, each forking twice. Unit space, seed at 0,0 */
  function buildRoots() {
    let s = 0.3719;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out = [];
    const grow = (x, y, ang, len, gen) => {
      const pts = [[x, y]];
      const steps = 5;
      for (let i = 0; i < steps; i++) { ang += (rnd() - 0.5) * 0.5; x += Math.cos(ang) * len / steps; y += Math.max(0.12, Math.sin(ang)) * len / steps * 0.42; pts.push([x, y]); }
      out.push({ pts, gen });
      if (gen < 2) { grow(x, y, ang - 0.35 - rnd() * 0.3, len * 0.62, gen + 1); grow(x, y, ang + 0.35 + rnd() * 0.3, len * 0.62, gen + 1); }
    };
    for (let i = 0; i < 7; i++) grow(0, 0, Math.PI * (0.06 + (0.88 * i) / 6) + (rnd() - 0.5) * 0.2, 0.2 + rnd() * 0.08, 0);
    return out;
  }
  function ink() {
    dark = doc.body.dataset.mode === 'dark';
    rgb = dark ? '233, 238, 246' : '18, 28, 46';
    if (!raf && on()) draw(performance.now());
  }
  const on = () => !!ctx && stageIs('arrival') && !example.open;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(now) {
    raf = 0;
    if (!on()) { if (ctx && w && h) ctx.clearRect(0, 0, w, h); return; }
    if (w !== window.innerWidth || h !== window.innerHeight) size();
    const still = reduce();
    const age = still ? 1e6 : now - t0;
    let sx = seedAt().x * w, sy = seedAt().y * h;
    try { const a = tree()?.anchor?.('seed'); if (a && isFinite(a.x) && isFinite(a.y) && !tree().planted) { sx = a.x; sy = a.y; } } catch (e) { /* the frame's own point */ }
    const hy = sy - h * 0.035; // the horizon, just behind the seed
    const R = Math.hypot(w, h) * 0.62;
    const a0 = dark ? 0.13 : 0.15;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    // the grid: lines running to the horizon, and lines across that drift toward the viewer, one cell in 14 s
    const fade = ctx.createRadialGradient(sx, hy, 0, sx, hy, R);
    fade.addColorStop(0, `rgba(${rgb}, 0)`);
    fade.addColorStop(0.07, `rgba(${rgb}, 0)`);
    fade.addColorStop(0.24, `rgba(${rgb}, ${a0})`);
    fade.addColorStop(0.62, `rgba(${rgb}, ${a0 * 0.45})`);
    fade.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.strokeStyle = fade;
    ctx.beginPath();
    const span = Math.max(w, h) * 2.2;
    for (let j = -16; j <= 16; j++) { ctx.moveTo(sx, hy); ctx.lineTo(sx + (j / 16) * span, h + 40); }
    const phase = still ? 0 : (age / 14000) % 1;
    for (let k = 1; k <= 22; k++) {
      const z = k - phase;
      const y = hy + (h + 40 - hy) / (1 + z * 0.42);
      if (y < hy + 3) continue;
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();
    // the root map: drawn in over the first 2.4 s, then still
    roots = roots || buildRoots();
    const U = Math.min(w, h) * (phone() ? 0.9 : 1.05);
    const p = clamp(age / 2400, 0, 1);
    roots.forEach((r) => {
      const k = clamp(p * 3 - r.gen, 0, 1);
      if (k <= 0) return;
      ctx.strokeStyle = `rgba(${rgb}, ${(dark ? 0.3 : 0.34) * (1 - r.gen * 0.27)})`;
      ctx.beginPath();
      const n = (r.pts.length - 1) * k;
      r.pts.forEach(([x, y], i) => {
        if (i > Math.ceil(n)) return;
        let px = x, py = y;
        if (i > n) { const [qx, qy] = r.pts[i - 1]; const f = n - (i - 1); px = qx + (x - qx) * f; py = qy + (y - qy) * f; }
        if (i === 0) ctx.moveTo(sx + px * U, sy + py * U); else ctx.lineTo(sx + px * U, sy + py * U);
      });
      ctx.stroke();
      if (k >= 1 && r.gen === 2) {
        const [ex, ey] = r.pts[r.pts.length - 1];
        ctx.fillStyle = `rgba(${rgb}, ${dark ? 0.34 : 0.38})`;
        ctx.beginPath(); ctx.arc(sx + ex * U, sy + ey * U, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    });
    if (!still) raf = requestAnimationFrame(draw);
  }
  function start() { if (!ctx || raf) return; t0 = t0 || performance.now(); size(); ink(); if (!raf) raf = requestAnimationFrame(draw); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (ctx && w && h) ctx.clearRect(0, 0, w, h); }
  window.addEventListener('resize', () => { if (on() && !raf) draw(performance.now()); });
  return { start, stop, ink };
})();

/* ---------- the tree through the beats ---------- */
const SEEK = [0.25, 0.6, 0.85, 1, 1];
let growT0 = 0, growMs = 0, grownDone = false;
function limbsReadyIn(t) {
  if (grownDone || t.planted || reduce()) return 0;
  return Math.max(300, growT0 + 0.75 * growMs - performance.now());
}
/** in a replay the tree belongs to the visitor: it is changed only when it could be read first, so it can be put back */
const mayTouch = () => !replay || !!replay.snap;
function setLabel(text) { if (!mayTouch()) return; try { tree()?.setLabel?.('pricing', text); } catch (e) { /* optional */ } }
/* R6: the visitor's trunk is pale until revenue is known; the demonstration tree shows it resolved. The tree keeps that in
   trunkDemo, which playIntro sets from opts.trunkKnown and any frame but 'intro' or 'arrival' clears, so it is set again
   here after the tutorial's own frames. Cleared on the way out, where the page's own setTrunkKnown is the last word. */
function demoTrunk(on) { const t = tree(); if (!t || !('trunkDemo' in t) || !mayTouch()) return; try { t.trunkDemo = !!on; t.start?.(); } catch (e) { /* optional */ } }
function setAllTwigs(t, how, force) {
  if (!force && !mayTouch()) return;
  LIMBS.forEach((limb) => {
    try { t.setStub?.(limb, false); } catch (e) { /* optional */ }
    try { t.setTwigs(limb, how === 'full' ? FULL_TWIGS[limb] : how === 'buds' ? budsOf(limb) : []); } catch (e) { /* optional */ }
    // a limb is as long as its section is answered: the demonstration tree stands full grown, and (d) sets its own fill at Roots
    try { t.setLimbFill?.(limb, how === 'none' ? 0 : 1); } catch (e) { /* optional */ }
  });
}
function treeAt(i) {
  const t = tree();
  if (!t) return;
  let sought = false;
  if (!t.planted && !grown) {
    growMs = reduce() ? 1 : i === 0 ? 10400 : 2800;
    growT0 = performance.now();
    grownDone = false;
    try { if (mayTouch() && typeof t.setRootSources === 'function') { t.setRootSources(DEMO_ROOTS); demoRoots = true; } } catch (e) { demoRoots = false; }
    // the whole-tree frame beside the clearing ('planting'), so the tree grows where it will stand for the interview
    try { grown = t.playIntro(growMs, i === 0 ? { phases: { roots: 1, trunk: 1, limbs: 1, leaves: 1 }, leaves: 1, preset: 'planting', trunkKnown: true } : { leaves: 1, preset: 'planting', trunkKnown: true }); } catch (e) { grown = null; }
    if (grown && typeof grown.then === 'function') grown.then(() => { grownDone = true; }, () => { grownDone = true; });
    else grownDone = true;
    try { const b = M.feel?.birds; if (b && !replay) { b.allowed = true; b.start(); b.level(0.5); birdsOn = true; } } catch (e) { /* sound is a nicety */ }
  } else if (!t.planted && !grownDone && typeof t.introSeek === 'function') {
    try { t.introSeek(SEEK[i] ?? 1); sought = true; } catch (e) { sought = false; }
  } else if (t.planted && replay && mayTouch() && !demoRoots) {
    try { t.setRootSources?.(DEMO_ROOTS); demoRoots = true; } catch (e) { /* optional */ }
    try { t.frame('planting', { ms: 900, yaw: typeof t.yaw === 'number' ? t.yaw : undefined }); } catch (e) { /* stays where it is */ }
  }
  demoTrunk(true);
  try { t.showPart?.(null); } catch (e) { /* optional */ }
  if (mayTouch()) { try { t.setCollar?.(i === 3 ? 'capacity' : null); } catch (e) { /* optional */ } }
  return sought;
}
/* Task 06 (D11): the halo comes in with the tree on slide 2 and stays through the slides, the questions and the results.
   help.js owns it; this only says when the shell's own pages want it. */
const halo = (on) => { try { M.shell?.halo?.(!!on); } catch (e) { /* the halo is help.js's */ } };

/* ---------- leader labels on the tree ---------- */
let plates = [];
let leadRaf = 0, leadTimers = [];
function clearPlates() {
  plates.forEach((p) => { p.el.remove(); p.line.remove(); p.dot.remove(); });
  plates = [];
  cancelAnimationFrame(leadRaf); leadRaf = 0;
  leadTimers.forEach(clearTimeout); leadTimers = [];
}
const NS = 'http://www.w3.org/2000/svg';
function addPlate(spec) {
  if (plates.some((p) => p.spec.id === spec.id)) return;
  const el = doc.createElement('div');
  el.className = 'lead-plate plate';
  if (spec.dot) el.dataset.from = spec.dot;
  el.innerHTML = `<b>${esc(spec.name)}</b><span>${esc(spec.mean)}</span>`;
  over.appendChild(el);
  const line = doc.createElementNS(NS, 'line'), dot = doc.createElementNS(NS, 'circle');
  dot.setAttribute('r', '3');
  if (spec.dot) { line.dataset.from = spec.dot; dot.dataset.from = spec.dot; }
  linesEl.append(line, dot);
  plates.push({ spec, el, line, dot });
  placePlates();
  if (reduce()) { leadTimers.push(setTimeout(placePlates, 200), setTimeout(placePlates, 700), setTimeout(placePlates, 1500)); }
  else if (!leadRaf) { const loop = () => { leadRaf = plates.length ? requestAnimationFrame(loop) : 0; placePlates(); }; leadRaf = requestAnimationFrame(loop); }
}
/* Task 02: these labels are part of the tree, so they keep to the tree region and nothing else. A label whose part has
   drifted into the question region is not drawn there and its leader is not drawn either: the same three names stand in
   the slide's own list, so nothing is lost. The region comes from help.js, which measures it; without help.js the
   layout's own share stands in. */
function treeRegion() {
  try { const r = M.shell?.regions?.(); if (r && r.tree && r.tree.right > r.tree.left) return r.tree; } catch (e) { /* the fallback */ }
  const vw = window.innerWidth, vh = window.innerHeight;
  return phone() ? { left: 0, top: 56, right: vw, bottom: Math.round(vh * 0.52) } : { left: Math.min(792, vw * 0.55), top: 66, right: vw, bottom: vh };
}
function placePlates() {
  const t = tree();
  if (!t || !plates.length) return;
  const R = treeRegion();
  const minX = R.left + 8, maxX = R.right - 8, minY = R.top + 12, maxY = R.bottom - 8;
  if (maxX - minX < 80 || maxY - minY < 60) return;
  let cx = (R.left + R.right) / 2;
  try { const a = t.anchor('trunk'); if (a && isFinite(a.x)) cx = a.x; } catch (e) { /* the region's own middle */ }
  const placed = [];
  plates.map((p) => { let a = null; try { a = t.anchor(p.spec.key); } catch (e) { a = null; } return { p, a }; })
    .sort((m, n) => (m.a?.y ?? 0) - (n.a?.y ?? 0))
    .forEach(({ p, a }) => {
      const w = p.el.offsetWidth, h = p.el.offsetHeight;
      // the part itself must be in the tree region, and there must be room for its label there
      const ok = a && isFinite(a.x) && isFinite(a.y) && a.inView !== false
        && a.x >= R.left && a.x <= R.right && a.y >= R.top && a.y <= R.bottom
        && maxY - minY >= h + 8;
      p.el.hidden = !ok; p.line.style.display = ok ? '' : 'none'; p.dot.style.display = ok ? '' : 'none';
      if (!ok) return;
      const side = a.x >= cx ? 1 : -1;
      const under = String(p.spec.key).startsWith('root');
      let x = under ? a.x + side * 18 - (side < 0 ? w : 0) : side > 0 ? a.x + 44 : a.x - 44 - w;
      let y = under ? a.y + 30 : a.y - h / 2;
      x = clamp(x, minX, Math.max(minX, maxX - w));
      y = clamp(y, minY, Math.max(minY, maxY - h));
      // no plate on another: the later one (lower anchor) moves down, or up when the floor is reached
      for (let guard = 0; guard < 12; guard++) {
        const hit = placed.find((r) => x < r.x + r.w + 6 && x + w + 6 > r.x && y < r.y + r.h + 6 && y + h + 6 > r.y);
        if (!hit) break;
        y = hit.y + hit.h + 6;
        if (y + h > maxY) { y = clamp(hit.y - h - 6, minY, Math.max(minY, maxY - h)); x = clamp(x + (side > 0 ? 1 : -1) * (hit.w + 12), minX, Math.max(minX, maxX - w)); }
      }
      placed.push({ x, y, w, h });
      p.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      const ex = clamp(a.x, x, x + w), ey = clamp(a.y, y, y + h);
      p.line.setAttribute('x1', a.x); p.line.setAttribute('y1', a.y); p.line.setAttribute('x2', ex); p.line.setAttribute('y2', ey);
      p.dot.setAttribute('cx', a.x); p.dot.setAttribute('cy', a.y);
    });
}
window.addEventListener('resize', () => { if (plates.length) placePlates(); });

/* ---------- the demo question: the real component, in a sandbox ----------
   M.state and M.commit are stood in for while `fn` runs, and put back whatever happens. questions.js reads both at call
   time, so a mount or an input event inside here can neither read nor write a visitor's answer. */
const demoState = () => ({ price: null, priceMix: null, notSure: new Set(), na: new Set(), asked: [], derived: {}, route: 'owner' });
function sandbox(fn, box) {
  const hadState = Object.prototype.hasOwnProperty.call(M, 'state'), hadCommit = Object.prototype.hasOwnProperty.call(M, 'commit');
  const s = M.state, c = M.commit;
  M.state = box.state || (box.state = demoState());
  M.commit = () => {};
  M.demoMount = true; // feel and interview can tell a demo mount from a live one (a first-use hint should skip it)
  try { return fn(); } catch (e) { return null; } finally {
    if (hadState) M.state = s; else delete M.state;
    if (hadCommit) M.commit = c; else delete M.commit;
    delete M.demoMount;
  }
}
/** a demo of the price instrument in `hostEl`: mount(), type(text), unmount(), and the live input and handle */
function makeDemo(hostEl, insight) {
  const d = { ctl: null, input: null, handle: null, box: { state: null } };
  d.unmount = () => {
    if (d.ctl) { const c = d.ctl; d.ctl = null; sandbox(() => c.destroy?.(), d.box); }
    hostEl.innerHTML = '';
    d.input = null; d.handle = null;
    if (insight) { insight.textContent = ''; insight.classList.remove('enter'); }
  };
  d.mount = () => {
    d.unmount();
    d.box.state = demoState();
    if (typeof M.renderQuestion === 'function') d.ctl = sandbox(() => M.renderQuestion('price', hostEl, () => {}), d.box);
    d.input = $('input', hostEl);
    d.handle = $('.handle', hostEl);
    if (!d.input) {
      // the instruments are not loaded (a bare shell): a still of the same two parts, from base.css's own classes
      hostEl.innerHTML = '<label class="face"><span class="unit">£</span><input class="figure tabular" placeholder="0" tabindex="-1"></label><div class="rail"><i class="fill"></i><i class="handle"></i></div>';
      d.input = $('input', hostEl); d.handle = $('.handle', hostEl);
    }
  };
  /** write the figure as a visitor's typing would: the instrument's own input handler moves the rail and the readout */
  d.type = (text) => {
    if (!d.input) return;
    sandbox(() => { d.input.value = text; d.input.dispatchEvent(new Event('input', { bubbles: false })); }, d.box);
    if (!d.ctl) { // the still: move its own handle
      const v = Number(String(text).replace(/[^\d.]/g, '')) || 0;
      const k = clamp(Math.log(Math.max(v, 25) / 25) / Math.log(80000 / 25), 0, 1);
      if (d.handle) d.handle.style.left = `${k * 100}%`;
      const f = $('.fill', hostEl); if (f) f.style.width = `${k * 100}%`;
    }
  };
  d.active = (on) => { $('.ui', hostEl)?.classList.toggle('active', !!on); };
  d.insight = (text) => {
    if (!insight) return;
    insight.textContent = text;
    insight.classList.remove('enter'); void insight.offsetWidth; if (text) insight.classList.add('enter');
  };
  return d;
}
const leafTwigs = (grade) => [{ id: 'd1', state: 'leaf', grade, kind: 'you' }, { id: 'd2', state: 'bud' }, { id: 'd3', state: 'bud' }];

/* ---------- Task 04: the phrase reveal ----------
   A slide's sentence arrives in short phrases, never one letter at a time. Each phrase is a span that turns on in turn.
   Show all text turns every phrase on at once, Continue is never waiting on it, and reduced motion has them all on from
   the start. Nothing here advances a slide: only a press does that. */
const REVEAL_MS = 260;
let revealTimers = [];
function splitPhrases(el) {
  if (el.dataset.split === '1') return;
  const text = el.textContent.trim();
  // sentence first, then the longer clauses inside it: short phrases, never single words
  const parts = text.split(/(?<=[.:;?])\s+/).flatMap((s) => (s.length > 72 ? s.split(/(?<=,)\s+/) : [s])).filter(Boolean);
  el.innerHTML = parts.map((p, i) => `<span class="ph">${i ? ' ' : ''}${esc(p)}</span>`).join('');
  el.dataset.split = '1';
}
function stopReveal() { revealTimers.forEach(clearTimeout); revealTimers = []; }
/** every phrase on this slide, at once. Called by Show all text, by any press inside the slide, and on the way out */
function revealAll(i) {
  stopReveal();
  const s = slides[i];
  if (!s) return;
  s.querySelectorAll('.slide-say').forEach((el) => { el.classList.add('all'); el.querySelectorAll('.ph').forEach((p) => p.classList.add('on')); });
  if (allBtn) allBtn.hidden = true;
}
function startReveal(i) {
  stopReveal();
  const s = slides[i];
  if (!s) return;
  const says = [...s.querySelectorAll('.slide-say')];
  says.forEach(splitPhrases);
  const phrases = says.flatMap((el) => { el.classList.remove('all'); return [...el.querySelectorAll('.ph')]; });
  phrases.forEach((p) => p.classList.remove('on'));
  if (reduce() || !phrases.length) { revealAll(i); return; }
  phrases.forEach((p, k) => { if (k === 0) { p.classList.add('on'); return; } revealTimers.push(setTimeout(() => p.classList.add('on'), k * REVEAL_MS)); });
  if (allBtn) allBtn.hidden = phrases.length < 2;
  revealTimers.push(setTimeout(() => { if (allBtn) allBtn.hidden = true; }, phrases.length * REVEAL_MS));
}

/* ---------- slide 2: the three parts, named on the tree one at a time ---------- */
let partTimers = [];
function stopParts() { partTimers.forEach(clearTimeout); partTimers = []; }
function showParts(token) {
  stopParts();
  const list = host.querySelectorAll('#slide-parts li');
  list.forEach((li) => li.classList.remove('on'));
  clearPlates();
  const t = tree();
  const step = (k) => {
    if (token !== seq || !running) return;
    const spec = PARTS[k];
    if (!spec) { try { t?.showPart?.(null); } catch (e) { /* optional */ } return; }
    list[k]?.classList.add('on');
    try { if (spec.part) t?.showPart?.(spec.part); } catch (e) { /* optional */ }
    addPlate(spec);
  };
  if (reduce()) { PARTS.forEach((_, k) => step(k)); try { t?.showPart?.(null); } catch (e) { /* optional */ } return; }
  PARTS.forEach((_, k) => { partTimers.push(setTimeout(() => step(k), k * 900)); });
  partTimers.push(setTimeout(() => step(PARTS.length), PARTS.length * 900));
}

/* ---------- slide 4: a small sample result, marked Example, that can be opened ---------- */
const EXAMPLE_RESULT = {
  owner: {
    decision: 'Raise the day rate by a tenth before taking on more work.',
    basis: 'Every billable hour is already sold, and buyers are not the constraint.',
    action: 'Raise the day rate to £660 for new work',
    rows: [['Why first', 'It moves the constraint, hours, without a new hire.'], ['Done when', 'Three new projects closed at the new rate.'], ['Measure', 'Close rate and revenue per billable hour, monthly.']],
  },
  starter: {
    decision: 'Test a bookkeeping tidy-up service for small trades businesses.',
    basis: 'It needs no budget, reaches buyers you already know, and can be tested in two weeks.',
    action: 'Offer a fixed-fee tidy-up to five trades contacts',
    rows: [['Why first', 'It tests demand with people who already trust you.'], ['Done when', 'Two paid tidy-ups delivered.'], ['Measure', 'Yeses out of five asked, and the hours each took.']],
  },
};
function resultSlide(r) {
  const box = $('#slide-result', host);
  if (!box) return;
  const x = EXAMPLE_RESULT[r] || EXAMPLE_RESULT.owner;
  box.innerHTML = `
    <p class="example-tag">Example</p>
    <div class="slide-result">
      <p class="sr-decision"><b>${esc(x.decision)}</b></p>
      <p class="sr-basis">${esc(x.basis)}</p>
      <button type="button" class="sr-open" id="slide-result-open" aria-expanded="false" aria-controls="slide-result-body">First action · ${esc(x.action)}</button>
      <dl id="slide-result-body" hidden>${x.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    </div>`;
  $('#slide-result-open', box)?.addEventListener('click', (e) => {
    const b = e.currentTarget, body = $('#slide-result-body', box);
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    if (body) body.hidden = !open;
    play(open ? 'open' : 'close', { x: panOf(b) });
  });
}

/* ---------- the slides ---------- */
const SLIDE_CAP = {
  owner: 'Find what is holding your business back, and leave with a plan to address it.',
  starter: 'Find a direction that fits you, and leave with a plan to test and launch it.',
};
function setSlide(i) {
  slides.forEach((s, k) => { s.hidden = k !== i; });
  host.dataset.slide = String(i + 1);
  doc.body.dataset.slide = String(i + 1);
  if (countEl) countEl.textContent = `${i + 1} of ${N}`;
  if (backBtn) backBtn.disabled = i <= 0;
  // every slide but the last moves on with Continue; the last carries the start action, the only thing that begins a journey
  if (goBtn) goBtn.hidden = i >= LAST;
  if (startBtn) { startBtn.hidden = i < LAST; startBtn.textContent = replay ? 'Done' : 'Start'; }
  if (skipBtn) skipBtn.hidden = i >= LAST;
  // a replay must leave everything as it was: the device-saving choice is not offered again inside one
  const saveRow = $('#orient-save-row', host);
  if (saveRow) saveRow.hidden = !!replay;
  const saveNote = $('#orient-save-note', host);
  if (saveNote && replay) saveNote.textContent = '';
}
function goTo(i, again) {
  i = clamp(i, 0, LAST);
  if (i === at && !again) return;
  at = i;
  seq += 1;
  const token = seq;
  stopParts();
  clearPlates();
  setSlide(i);
  host.scrollTop = 0;
  startReveal(i);
  treeAt(i);
  const t = tree();
  play('reveal');
  if (i !== 2) closeOrientDemo();
  if (i === 0) { halo(false); if (t && mayTouch()) setAllTwigs(t, replay ? 'full' : 'none'); setLabel(''); }
  if (i >= 1) {
    halo(true);
    if (t) { (async () => { await wait(limbsReadyIn(t)); if (token === seq && running) setAllTwigs(t, i === 1 ? 'buds' : 'full'); })(); }
  }
  if (i === 1) { setLabel(''); showParts(token); }
  if (i === 2) { setLabel(`${tc('The offer')} · ${tc(DEMO.title)}`); playOrientDemo(routeNow()); }
  if (i === 3) { setLabel(''); resultSlide(routeNow()); }
  if (i === 4) { setLabel(''); paintSaveToggle(); }
  paintRing(i >= 3 ? demoProgress(1).map((s) => ({ ...s, done: 1, state: 'done' })) : i >= 2 ? demoProgress(0.34) : demoProgress(0).map((s, k) => (k === 0 ? { ...s, done: 0, state: 'active' } : { ...s, state: 'upcoming' })));
  // the caption takes the focus so a screen reader starts at the new slide; the controls keep their place under it
  const cap = capOf(i);
  if (cap) cap.focus({ preventScroll: true });
}
function next() { if (at >= LAST) return; play('tap', { x: panOf(goBtn) }); goTo(at + 1); }
function back() { if (at <= 0) return; play('back'); goTo(at - 1); }
/** Skip tour: straight to the last slide, where the notice, the disclaimer and the start action are. It accepts nothing
    on the reader's behalf: they still press Start themselves. */
function skipTour() { if (at >= LAST) return; play('tap', { x: panOf(skipBtn) }); goTo(LAST); }

/* ---------- a replay: the tree is read before it is touched, and put back after ---------- */
function snapshotTree(t) {
  try {
    if (!t || !t.branches || typeof t.branches.forEach !== 'function') return null;
    const limbs = {};
    t.branches.forEach((b, id) => {
      const twigs = (b.twigs || []).map((tw) => (tw && tw.state ? { id: tw.id, state: tw.state, grade: tw.grade, kind: tw.kind, parts: tw.sprigs?.sig ? String(tw.sprigs.sig).split(',').map(Number) : undefined } : null));
      while (twigs.length && !twigs[twigs.length - 1]) twigs.pop();
      limbs[id] = { stub: !!b.stub, fill: b.fill, twigs };
    });
    return { limbs, roots: { ...(t.rootCounts || {}) }, collar: t.collarOn ?? null, preset: t.pose?.preset ?? null, planted: !!t.planted, label: t.label ? { part: t.label.part ?? null, text: t.label.text ?? '' } : null };
  } catch (e) { return null; }
}
function restoreTree(t, snap) {
  if (!t || !snap) return;
  try {
    if (!snap.planted) { t.toSeed?.(); }
    Object.entries(snap.limbs).forEach(([id, l]) => {
      try { t.setTwigs(id, l.twigs); } catch (e) { /* optional */ }
      try { t.setStub?.(id, l.stub); } catch (e) { /* optional */ }
      try { if (snap.planted) t.setLimbFill?.(id, l.fill); } catch (e) { /* optional */ }
    });
    if ('trunkDemo' in t) t.trunkDemo = false;
    t.setRootSources?.(snap.roots);
    t.setCollar?.(snap.collar);
    t.showPart?.(null);
    if (snap.label) t.setLabel?.(snap.label.part, snap.label.text);
    if (snap.preset) t.frame?.(snap.preset, { ms: reduce() ? 0 : 900 });
  } catch (e) { /* as far as it got */ }
}
const REPLAY_FROM = ['arrival', 'orient', 'roots', 'section', 'explore', 'harvest', 'plan'];
const HIDE_IN_REPLAY = ['#clearing', '#discs', '#tree-tools', '#inspect', '#tree-hint', '#arrival', '#wheel', '#tree-expand'];
/** a replay is voluntary and safe: the stage, the answers, the save and the tree are read first and put back on the way
    out, nothing in the slides writes M.state or M.commit, and slide 5 does not offer the device-saving choice again. */
function openReplay() {
  if (running || example.open) return false;
  setDeck(true); // a reader who asks for the replay is asking for the tour
  const st = stageNow();
  if (!REPLAY_FROM.includes(st) || M.moving) return false;
  try { M.overlay?.closeAll?.(); } catch (e) { /* none open */ }
  const af = doc.activeElement;
  replay = { stage: st, snap: snapshotTree(tree()), focus: af && af !== doc.body && !af.closest('#help-panel') ? af : $('#help') };
  doc.body.dataset.replay = '1';
  HIDE_IN_REPLAY.forEach((s) => { const el = $(s); if (el) el.inert = true; });
  finished = false; running = true; at = -1; grown = null; grownDone = !!tree()?.planted; demoRoots = false;
  ground.stop();
  doc.addEventListener('keydown', onKey, true);
  goTo(0);
  return true;
}
function closeReplay() {
  const r = replay;
  running = false; finished = true; seq++;
  stopReveal(); stopParts(); clearPlates(); closeOrientDemo();
  doc.removeEventListener('keydown', onKey, true);
  restoreTree(tree(), r.snap);
  if (!r.snap?.planted) frameSeed(reduce() ? 0 : 900);
  demoRoots = false; grown = null;
  replay = null;
  setDeck(false); // back to the single page for anything that opens the deck later
  delete doc.body.dataset.replay;
  delete doc.body.dataset.slide;
  HIDE_IN_REPLAY.forEach((s) => { const el = $(s); if (el) el.inert = false; });
  if (stageIs('arrival')) ground.start();
  halo(JOURNEY_HALO.includes(stageNow()));
  paintRing();
  try { (r.focus && r.focus.isConnected ? r.focus : $('#help'))?.focus?.({ preventScroll: true }); } catch (e) { /* no focus */ }
}
/* Task 06 (D11): where the halo belongs once the slides are done. The same frame through questioning and the results */
const JOURNEY_HALO = ['roots', 'section', 'close', 'explore', 'harvest', 'plan', 'ready'];

/* ---------- how it ends ---------- */
function quietBirds() {
  if (!birdsOn) return;
  birdsOn = false;
  try { const b = M.feel?.birds; if (b) { b.fade?.(0, 1200); b.allowed = false; } } catch (e) { /* sound is a nicety */ }
}
function leaveTree() {
  const t = tree();
  stopReveal(); stopParts(); clearPlates(); closeOrientDemo();
  if (t) {
    setAllTwigs(t, 'none');
    setLabel('');
    try { t.showPart?.(null); } catch (e) { /* optional */ }
    try { t.setCollar?.(null); } catch (e) { /* optional */ }
    demoTrunk(false);
    if (demoRoots) { demoRoots = false; try { t.setRootSources?.({}); } catch (e) { /* optional */ } }
  }
  delete doc.body.dataset.slide;
  paintRing();
}
/** the start action on slide 5, and the way out of a replay. Nothing else begins a journey: no timer, no key, no slide */
function finish() {
  if (replay) { closeReplay(); return; }
  if (finished) return;
  finished = true;
  running = false;
  seq++;
  try { localStorage.setItem(KEY, '1'); } catch (e) { /* the slides again next time */ }
  leaveTree(); // before the stage moves, so the counts (d) sends from the visitor's own answers are the last word
  quietBirds();
  doc.removeEventListener('keydown', onKey, true);
  halo(true);
  orientDone();
}

/* ---------- keys: the arrows turn a slide. Nothing advances on its own, and Enter or space on a control is that
   control's own press. Escape leaves a replay; on the first run it does nothing, because the way on is the start action
   on slide 5. In a replay no key reaches the stage underneath. ---------- */
function onKey(e) {
  if (!running) return;
  if (replay) e.stopPropagation();
  if ($('#help-panel')?.open || $('#about-panel')?.open) return;
  const tg = e.target;
  if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
  if (e.key === 'Escape') { if (replay) { e.preventDefault(); play('tap'); closeReplay(); } return; }
  const onControl = tg && (tg.tagName === 'BUTTON' || tg.tagName === 'SUMMARY' || tg.tagName === 'A');
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || ((e.key === ' ' || e.key === 'Enter') && !onControl)) { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); back(); }
}

/* ---------- the slides' wiring ---------- */
goBtn?.addEventListener('click', next);
backBtn?.addEventListener('click', back);
skipBtn?.addEventListener('click', skipTour);
allBtn?.addEventListener('click', () => { play('tap', { x: panOf(allBtn) }); revealAll(at); });
/* a press anywhere in a slide brings the rest of its words in at once: nobody waits to read */
host.addEventListener('pointerdown', (e) => { if (running && !e.target.closest('.intro-nav')) revealAll(at); });
doc.addEventListener('keydown', onKey, true);
/** M.intro.open(): the slides as a page (the orientation, or a stage an older flow calls 'intro'); { replay: true }: over the stage */
function start(o) {
  if (o && o.replay) return openReplay();
  if (running) return false;
  finished = false;
  running = true;
  if (startAt !== null && startAt > 1) setDeck(true); // ?intro=2..5 asks for a slide inside the tour
  goTo(startAt !== null ? clamp(startAt - 1, 0, LAST) : 0);
  return true;
}
/** the slides as a page from arrival (kept for tests and ?intro=N) */
function begin() {
  if (running) return;
  if (ask === 'off') { finished = false; running = true; finish(); return; }
  running = true;
  go('intro');
  if (startAt !== null && startAt > 1) setDeck(true);
  if (at < 0) goTo(startAt !== null ? clamp(startAt - 1, 0, LAST) : 0);
}

/* ============ R12: the homepage ============ */
/* flow (app.js) wires the route cards, Continue your plan, Start again, the orientation's Continue and its switch itself
   when it is the rebuilt one (it exports M.setRoute). Then the shell's listeners on those controls only paint; without
   flow's wiring (an older app.js, a test page) the shell drives through the fallbacks below. */
const flowWired = () => typeof M.setRoute === 'function';
const routeBlock = $('#route-block'), savedBlock = $('#saved-block'), savedLine = $('#saved-line');
const cardOwner = $('#route-owner'), cardStarter = $('#route-starter');
const panelEl = $('#mercer-panel');
/** a saved session, by whichever save flow provides: hasSaved() or has() (v2), restored (v1), or the key itself */
function readSaved() {
  try { const raw = localStorage.getItem('mercer-answers'); if (!raw) return null; const d = JSON.parse(raw); return d && typeof d === 'object' ? d : null; } catch (e) { return null; }
}
function hasSaved() {
  try { if (typeof M.save?.hasSaved === 'function') return !!M.save.hasSaved(); } catch (e) { /* fall through */ }
  try { if (typeof M.save?.has === 'function') return !!M.save.has(); } catch (e) { /* fall through */ }
  if (M.save?.restored) return true;
  const d = readSaved();
  return !!(d && (d.schema === 2 || d.on === true));
}
function savedWhen() {
  let at = null;
  try { at = M.save?.info?.()?.savedAt ?? null; } catch (e) { at = null; }
  if (!at) { const d = readSaved(); at = d?.savedAt ?? d?.at ?? null; }
  const dt = at ? new Date(at) : null;
  if (!dt || isNaN(dt.getTime())) return '';
  try { return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); } catch (e) { return ''; }
}
function paintSaved() {
  if (!savedBlock || !routeBlock) return;
  const saved = hasSaved();
  savedBlock.hidden = !saved;
  routeBlock.hidden = saved; // the binary question is not asked twice: Start again brings it back
  if (saved && savedLine) { const when = savedWhen(); savedLine.textContent = when ? `Saved on this device on ${when}.` : 'Saved on this device.'; }
}
function pressCard(route) {
  [cardOwner, cardStarter].forEach((c) => c?.setAttribute('aria-pressed', String(route === (c === cardOwner ? 'owner' : 'starter'))));
}
function recordRoute(route) {
  chosenRoute = route;
  let done = false;
  try { if (typeof M.setRoute === 'function') { M.setRoute(route); done = true; } } catch (e) { done = false; }
  if (!done) { try { if (typeof M.chooseRoute === 'function') { M.chooseRoute(route); done = true; } } catch (e) { done = false; } }
  if (!done && M.state && typeof M.state === 'object') M.state.route = route;
  doc.body.dataset.route = route;
  if (!done) dispatch('mercer:route', { route });
}
/** the route choice: record it, then the orientation. Flow's go('orient') shows the page; without one the shell sets the stage */
function chooseRoute(route) {
  if (route !== 'owner' && route !== 'starter') return;
  if (M.moving) return;
  pressCard(route);
  play('tap', { x: panOf(route === 'owner' ? cardOwner : cardStarter) });
  recordRoute(route);
  go('orient');
  if (!stageIs('orient')) { doc.body.dataset.stage = 'orient'; dispatch('mercer:stage', { stage: 'orient', section: null }); }
}
/* a press on a card: flow's own listener moves the page when flow is wired; the shell only shows the press then */
cardOwner?.addEventListener('click', () => { if (flowWired()) { pressCard('owner'); doc.body.dataset.route = 'owner'; return; } chooseRoute('owner'); });
cardStarter?.addEventListener('click', () => { if (flowWired()) { pressCard('starter'); doc.body.dataset.route = 'starter'; return; } chooseRoute('starter'); });
/** Continue your plan: flow's own listener (M.resume) when wired; otherwise the first open step of the old flow */
$('#resume')?.addEventListener('click', () => {
  if (flowWired()) return;
  play('tap');
  try { if (typeof M.resume === 'function') { M.resume(); return; } } catch (e) { /* fall through */ }
  const ev = dispatch('mercer:resume', {}, true);
  if (ev.defaultPrevented) return;
  try { if (M.save?.restore && !M.save.restored) M.save.restore(); } catch (e) { /* stays */ }
  const route = M.state?.route;
  if (route === 'owner' || route === 'starter') { chosenRoute = route; doc.body.dataset.route = route; }
  go('roots');
});
/** Start again: flow's own listener (M.restart) when wired; otherwise the saved session is forgotten and the page starts fresh */
$('#restart')?.addEventListener('click', () => {
  if (flowWired()) return;
  play('tap');
  try { M.save?.forget?.({ confirmed: true }); } catch (e) { /* the key stays; the page still restarts */ }
  try { const fn = M.restart ?? M.reset; if (typeof fn === 'function') { fn(); paintSaved(); pressCard(null); return; } } catch (e) { /* reload instead */ }
  try { location.reload(); } catch (e) { paintSaved(); }
});
/** Explore an example */
$('#example')?.addEventListener('click', () => example.openPanel());
/** the green Mercer entry: the panel at arrival (never past the route choice); the wheel's panel on the journey */
$('#mercer-go')?.addEventListener('click', () => {
  if (stageIs('arrival') || !doc.body.dataset.stage) {
    try { panelEl?.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { /* no scroll */ }
    panelEl?.focus({ preventScroll: true });
    return;
  }
  try { M.shell?.openWheel?.(); } catch (e) { /* no panel */ }
});
// the polish pack, 15: a restart repaints the homepage too, so the route cards come back in place of Continue my plan
['mercer:save', 'mercer:saved', 'mercer:restored', 'mercer:forget', 'mercer:restart'].forEach((ev) => doc.addEventListener(ev, paintSaved));

/* ============ Task 04: slide 3's demonstration, and slide 5's contract with flow ============ */
const ORIENT_DEMO = {
  owner: { q: 'Sale value', figure: '2,400', part: 'Offer · Sale value', plan: 'Raise the day rate by a tenth', was: 'Ask past clients for referrals', range: 'a specific move, with the revenue it models' },
  starter: { q: 'Price to test', figure: '600', part: 'Test · Offer price', plan: 'Offer it to five people at £600', was: 'Build the website first', range: 'the smallest test that produces an answer' },
};
const orient = { done: false, route: null, seq: 0 };
const orientDemoHost = $('#orient-demo');
let odemo = null;
function orientDemoHTML(r) {
  const d = ORIENT_DEMO[r];
  return `
    <div class="od-step" data-step="answer"><span class="od-label">1 · You answer</span>
      <div class="od-q" data-demo="1" aria-hidden="true" inert><div class="body" id="orient-q"></div></div>
      <span class="od-sub">${esc(d.q)}</span></div>
    <i class="od-arrow" aria-hidden="true"></i>
    <div class="od-step" data-step="tree"><span class="od-label">2 · The tree shows it</span>
      <svg class="od-twig" viewBox="0 0 150 64" aria-hidden="true"><path class="wood" d="M4 60 C 40 58, 70 40, 146 8"/><path class="wood" d="M62 44 C 70 30, 84 26, 96 26"/><ellipse class="leaf" cx="102" cy="26" rx="9" ry="5"/><ellipse class="leaf" cx="120" cy="17" rx="9" ry="5"/><ellipse class="leaf" cx="86" cy="36" rx="8" ry="4.5"/><ellipse class="leaf" cx="138" cy="9" rx="8" ry="4.5"/></svg>
      <span class="od-sub">${esc(d.part)}</span></div>
    <i class="od-arrow" aria-hidden="true"></i>
    <div class="od-step" data-step="plan"><span class="od-label">3 · The plan improves (an example)</span>
      <p class="od-plan"><span class="od-was">${esc(d.was)}</span><b>${esc(d.plan)}</b><span>${esc(d.range)}</span></p></div>`;
}
/** slide 3: a sample answer typed into the real instrument in a sandbox, then the labelled branch it changes, then the
    plan line it replaces. The sample lives in its own state object: M.state and M.commit are stood in for while the
    instrument is mounted and while each character is typed, so nothing here can read or write the visitor's session. */
async function playOrientDemo(r) {
  if (!orientDemoHost) return;
  const token = ++orient.seq;
  const d = ORIENT_DEMO[r] || ORIENT_DEMO.owner;
  orientDemoHost.innerHTML = orientDemoHTML(r);
  const qh = $('#orient-q', orientDemoHost);
  odemo = makeDemo(qh, null);
  odemo.mount();
  const twig = $('.od-twig', orientDemoHost), planEl = $('.od-plan', orientDemoHost);
  const onTree = () => { const t = tree(); if (t && mayTouch()) { try { t.setTwigs('pricing', leafTwigs(3)); } catch (e) { /* optional */ } } };
  if (reduce()) { odemo.type(d.figure); twig?.classList.add('on'); planEl?.classList.add('on'); onTree(); return; }
  await wait(700);
  // the reader can press Continue mid-demonstration: every step after an await checks the run is still the current one
  // and that the demo is still mounted, so a torn-down host is never typed into
  const live = () => token === orient.seq && odemo && orientDemoHost && orientDemoHost.isConnected;
  if (!live()) return;
  const parts = []; for (let i = 1; i <= d.figure.replace(/,/g, '').length; i++) parts.push(d.figure.replace(/,/g, '').slice(0, i));
  for (const p of parts) { if (!live()) return; odemo.type(p); await wait(160); }
  if (!live()) return;
  odemo.type(d.figure);
  await wait(500);
  if (!live()) return;
  twig?.classList.add('on');
  onTree();
  await wait(900);
  if (!live()) return;
  planEl?.classList.add('on');
}
function paintSaveToggle() {
  const sw = $('#orient-save'), noteEl = $('#orient-save-note');
  if (!sw) return;
  const on = !!M.save?.on;
  sw.checked = on;
  sw.setAttribute('aria-checked', String(on));
  if (noteEl && !noteEl.dataset.hold) noteEl.textContent = on ? PRIVACY[3].replace('If you turn on Save on this device, your', 'Your') : '';
}
/** the deck opened as the page before the first question: the route's promise on slide 1, slide 1 shown, the tree framed */
function openOrient() {
  const r = routeNow();
  orient.route = r;
  orient.done = false;
  if ($('#orient-route')) $('#orient-route').textContent = `Mercer · ${ROUTE_WORD[r]}`;
  const cap = capOf(0); if (cap) cap.textContent = SLIDE_CAP[r] || SLIDE_CAP.owner;
  const noteEl = $('#orient-save-note'); if (noteEl) { delete noteEl.dataset.hold; noteEl.classList.remove('is-error'); }
  paintSaveToggle();
  try { M.overlay?.closeAll?.(); } catch (e) { /* none open */ }
  frameSeed(0);
  finished = false; running = true; at = -1; grown = null; grownDone = !!tree()?.planted; demoRoots = false;
  goTo(0);
  host.scrollTop = 0;
}
function closeOrientDemo() { orient.seq++; if (odemo) { odemo.unmount(); odemo = null; } if (orientDemoHost) orientDemoHost.innerHTML = ''; }
/** the start action on slide 5: the slides are done; flow continues. The order: the cancelable mercer:orient event;
    then, a tick later, if the stage is still 'orient' and nothing is moving (flow's own #orient-go listener, when wired,
    has taken the page on by then), M.start() where flow exports it, else M.go('roots'). Usable by flow directly. */
function orientDone() {
  if (orient.done && !stageIs('orient') && !stageIs('intro')) return true;
  orient.done = true;
  running = false;
  try { sessionStorage.setItem('mercer-orient', orient.route || routeNow()); } catch (e) { /* this page only */ }
  const ev = dispatch('mercer:orient', { done: true, route: orient.route || routeNow() }, true);
  closeOrientDemo();
  delete doc.body.dataset.slide;
  if (ev.defaultPrevented) return true;
  const carryOn = () => {
    if (!(stageIs('orient') || stageIs('intro')) || M.moving) return;
    if (typeof M.start === 'function') { try { M.start(); return; } catch (e) { /* the fallback */ } }
    go('roots');
  };
  if (flowWired()) setTimeout(carryOn, 0); else carryOn();
  return true;
}
startBtn?.addEventListener('click', () => {
  if (M.moving) return;
  play('tap', { x: panOf(startBtn) });
  if (replay) { closeReplay(); return; }
  try { localStorage.setItem(KEY, '1'); } catch (e) { /* the slides again next time */ }
  quietBirds();
  orientDone();
});
$('#orient-method')?.addEventListener('click', () => { try { M.shell?.openHelp?.('privacy'); } catch (e) { /* no help */ } });
$('#orient-save')?.addEventListener('change', (e) => {
  const sw = e.currentTarget, noteEl = $('#orient-save-note');
  const want = !!sw.checked;
  let ok = false;
  try {
    if (flowWired()) ok = want ? !!M.save?.on && !M.save?.failed : true; // flow's own listener turned it on or off already
    else if (want) ok = M.save?.enable ? M.save.enable() !== false : false;
    else { if (typeof M.save?.disable === 'function') M.save.disable(); else M.save?.forget?.({ confirmed: true }); ok = true; }
  } catch (err) { ok = false; }
  if (want && !ok) {
    try { if (flowWired()) M.save?.disable?.(); } catch (err) { /* stays as flow left it */ }
    sw.checked = false;
    if (noteEl) { noteEl.dataset.hold = '1'; noteEl.classList.add('is-error'); noteEl.textContent = 'This browser would not store it. Saving stayed off.'; }
    sw.setAttribute('aria-checked', 'false');
    return;
  }
  if (noteEl) { delete noteEl.dataset.hold; noteEl.classList.remove('is-error'); }
  paintSaveToggle();
  play(want ? 'done' : 'tap', { gain: 0.4 });
});
doc.addEventListener('mercer:save', () => { if (stageIs('orient') || stageIs('intro')) paintSaveToggle(); });
M.orient = {
  open: openOrient, done: orientDone, isDone: () => orient.done, route: () => orient.route,
  close: () => { closeOrientDemo(); },
};
/* Task 04: the slides, for tests and for anything that needs to know where the reader is */
M.slides = { get count() { return N; }, all: () => ALL_SLIDES.length, at: () => at + 1, go: (n) => goTo(clamp(Number(n) - 1, 0, LAST)), skip: skipTour, revealAll: () => revealAll(at) };

/* ============ R13: the example ============ */
const exPanel = $('#example-panel');
const EX = {
  owner: {
    name: 'Example: a design studio', what: 'Decision', decision: 'Raise the day rate by a tenth before taking on more work.',
    basis: 'The studio sells 32 billable hours a week and turns work away. Buyers are not the constraint; hours are. A tenth on the rate loses fewer clients than it gains in margin, on the studio’s own close rate.',
    assumption: { label: 'Sample assumption: the day rate', a: '£600 a day', b: '£660 a day' },
    branches: [
      { id: 'customers', name: 'Customers', hue: '--sec-reach', finding: 'Eleven enquiries a month, four won. Most come from referrals, so demand holds when the rate rises.' },
      { id: 'offer', name: 'Offer', hue: '--sec-offer', finding: 'A day rate below the benchmark for the studio’s experience. This is the branch the decision changes.' },
      { id: 'delivery', name: 'Delivery', hue: '--sec-delivery', finding: 'Every billable hour is sold. This is the constraint: more work needs more hours or a higher rate.' },
      { id: 'leverage', name: 'Leverage', hue: '--sec-you', finding: 'One founder does sales, delivery and onboarding. Onboarding is the first task to hand on.' },
    ],
    action: { title: 'Raise the day rate to £660 for new work', why: 'It moves the constraint (hours) without a new hire, and the client list can bear it.', steps: 'Tell current clients the new rate from next quarter; quote it on every new enquiry; watch the close rate for two months.', done: 'Three new projects closed at the new rate.', measure: 'Close rate and revenue per billable hour, monthly.', change: 'If the close rate falls below one in four for two months, hold the rate and hand on onboarding first.' },
    figures: { a: ['+£2,100 to +£3,900 a month', '£38,000 to £61,000'], b: ['+£2,300 to +£4,300 a month', '£40,000 to £64,000'] },
  },
  starter: {
    name: 'Example: someone starting out', what: 'Direction', decision: 'Test a bookkeeping tidy-up service for small trades businesses.',
    basis: 'The person has ten hours a week, bookkeeping experience and a network of trades contacts. Of three directions, this one needs no budget, reaches buyers they already know, and can be tested in two weeks.',
    assumption: { label: 'Sample assumption: hours a week', a: '10 hours', b: '16 hours' },
    branches: [
      { id: 'foundations', name: 'Foundations', hue: '--sec-ground', finding: 'Ten hours a week, no budget, bookkeeping skill, a trades network. These set the directions that stay in.' },
      { id: 'opportunities', name: 'Opportunities', hue: '--sec-reach', finding: 'Three directions compared on access, evidence, speed and cost. Bookkeeping for trades wins on access and speed.' },
      { id: 'test', name: 'Test', hue: '--sec-delivery', finding: 'A fixed-fee tidy-up offered to five contacts. Two paid yeses would show demand.' },
      { id: 'launch', name: 'Launch', hue: '--sec-you', finding: 'A one-page offer sheet, a booking link and a simple checklist. No website first.' },
    ],
    action: { title: 'Offer a fixed-fee tidy-up to five trades contacts', why: 'It tests demand with people who already trust the person, in the hours they have.', steps: 'Write the one-page offer; message five contacts; book the first two; deliver and ask what they would pay again.', done: 'Two paid tidy-ups delivered.', measure: 'Yeses out of five asked; hours each took.', change: 'If nobody says yes, change the buyer, not the skill: try small agencies next.' },
    figures: { a: ['a first answer inside two weeks', '5 asked, 2 paid'], b: ['a first answer inside ten days', '8 asked, 3 paid'] },
  },
};
const example = { open: false, route: 'owner', snap: null, focus: null, local: null };
function exampleFallbackHTML(r) {
  const x = EX[r];
  return `
    <div class="ex-decide"><span class="ex-what">${esc(x.what)} · Example</span><h3>${esc(x.decision)}</h3><p>${esc(x.basis)}</p></div>
    <div class="ex-assume" role="group" aria-labelledby="ex-assume-label"><span class="t-label" id="ex-assume-label">${esc(x.assumption.label)} (example: change it)</span>
      <button type="button" class="stone" data-ex-assume="a" aria-pressed="true">${esc(x.assumption.a)}</button>
      <button type="button" class="stone" data-ex-assume="b" aria-pressed="false">${esc(x.assumption.b)}</button>
      <span class="small ex-figure" id="ex-figure">Example: ${esc(x.figures.a[0])}</span></div>
    <div><span class="t-label">Inspect a branch (example)</span>
      <div class="ex-branches" role="group" aria-label="Branches">${x.branches.map((b) => `<button type="button" class="stone" data-ex-branch="${b.id}" aria-pressed="false" style="--hue: var(${b.hue})">${esc(b.name)}</button>`).join('')}</div>
      <p class="ex-finding" id="ex-finding" aria-live="polite"></p></div>
    <div class="ex-card"><button type="button" id="ex-card-open" aria-expanded="false" aria-controls="ex-card-body">First action · Example: ${esc(x.action.title)}</button>
      <dl id="ex-card-body" hidden>
        <dt>Why first</dt><dd>${esc(x.action.why)}</dd>
        <dt>Steps</dt><dd>${esc(x.action.steps)}</dd>
        <dt>Done when</dt><dd>${esc(x.action.done)}</dd>
        <dt>Measure</dt><dd>${esc(x.action.measure)}</dd>
        <dt>Change course if</dt><dd>${esc(x.action.change)}</dd>
        <dt>Example figure</dt><dd><b id="ex-figure-2">${esc(x.figures.a[1])}</b></dd>
      </dl></div>`;
}
function wireFallback(hostEl, r) {
  const x = EX[r];
  example.local = { assume: 'a', branch: null, cardOpen: false };
  hostEl.querySelectorAll('[data-ex-assume]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.exAssume;
    example.local.assume = k;
    hostEl.querySelectorAll('[data-ex-assume]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const f1 = $('#ex-figure', hostEl), f2 = $('#ex-figure-2', hostEl);
    if (f1) f1.textContent = `Example: ${x.figures[k][0]}`;
    if (f2) f2.textContent = x.figures[k][1];
    play('tick', { x: panOf(b) });
  }));
  hostEl.querySelectorAll('[data-ex-branch]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.exBranch;
    const was = b.getAttribute('aria-pressed') === 'true';
    hostEl.querySelectorAll('[data-ex-branch]').forEach((o) => o.setAttribute('aria-pressed', String(o === b && !was)));
    example.local.branch = was ? null : id;
    const f = $('#ex-finding', hostEl);
    const br = x.branches.find((q) => q.id === id);
    if (f) f.textContent = was || !br ? '' : `Example · ${br.name}: ${br.finding}`;
    try { const t = tree(); const limb = { customers: 'demand', offer: 'pricing', delivery: 'capacity', leverage: 'trunk', foundations: 'roots', opportunities: 'demand', test: 'pricing', launch: 'trunk' }[id]; if (t && example.snap) t.showPart?.(was ? null : limb === 'roots' ? 'roots' : limb === 'trunk' ? 'trunk' : 'branches'); } catch (e) { /* optional */ }
    play('tap', { x: panOf(b) });
  }));
  $('#ex-card-open', hostEl)?.addEventListener('click', (e) => {
    const b = e.currentTarget, body = $('#ex-card-body', hostEl);
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    if (body) body.hidden = !open;
    example.local.cardOpen = open;
    play(open ? 'open' : 'close', { x: panOf(b) });
  });
}
function renderExample(r) {
  example.route = r;
  exPanel.querySelectorAll('[data-ex-route]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.exRoute === r)));
  const w = EX_WHO[r] ?? EX_WHO.owner;
  const nameEl = $('#example-name', exPanel); if (nameEl) nameEl.textContent = w.who;
  const chip = $('.ex-chip', exPanel); if (chip) chip.textContent = w.initials;
  closeExplanation();
  try { if (example.snap) tree()?.showPart?.(null); } catch (e) { /* optional */ }
}
/** one explanation at a time; its X closes the explanation and nothing else */
function openExplanation(step) {
  const r = example.route, box = $('#example-explain', exPanel);
  if (!box) return;
  const x = exampleExplain(r, step);
  $('#example-explain-title', box).textContent = x.title;
  $('#example-explain-body', box).textContent = x.body;
  box.hidden = false;
  exPanel.querySelectorAll('.ex-step').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.exStep === step)));
  example.local = { ...(example.local ?? {}), step };
  try { tree()?.showPart?.(x.part); } catch (e) { /* optional */ }
  play('open');
}
function closeExplanation(refocus) {
  const box = exPanel ? $('#example-explain', exPanel) : null;
  if (!box || box.hidden) return;
  box.hidden = true;
  const step = example.local?.step;
  exPanel.querySelectorAll('.ex-step').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (example.local) example.local.step = null;
  try { tree()?.showPart?.(null); } catch (e) { /* optional */ }
  if (refocus && step) { try { $(`.ex-step[data-ex-step="${step}"]`, exPanel)?.focus({ preventScroll: true }); } catch (e) { /* no focus */ } }
  play('close');
}
/* the polish pack, 16: the example is a short explorable introduction. A labelled sample person, three headings, one
   explanation open at a time in its own panel (its X closes the explanation only), the tree explorable throughout,
   and two separate ways out: Build my plan and Exit example. */
const EX_WHO = {
  owner: { initials: 'AJ', who: 'Alex, who runs a small design studio', tag: 'A sample business with made-up figures, not a client' },
  starter: { initials: 'SR', who: 'Sam, starting out with ten hours a week', tag: 'A sample person with made-up figures, not a client' },
};
const EX_STEPS = [['goal', 'A goal to grow towards.'], ['roots', 'Roots built from real inputs.'], ['branch', 'One branch worth focusing on.']];
function exampleExplain(r, step) {
  const x = EX[r], w = EX_WHO[r];
  if (step === 'goal') return { title: 'The goal', body: r === 'owner' ? `${w.who.split(',')[0]} wants more profit without more hours. The goal sits at the top of the tree as the line the plan grows towards; every move is measured against it.` : `${w.who.split(',')[0]} wants a first paid test inside a month. The goal sits at the top of the tree; every direction is measured against it.`, part: 'crown' };
  if (step === 'roots') return { title: 'The roots', body: `${x.basis} The roots are the facts and resources the direction stands on: the answers given, with what each one came from.`, part: 'roots' };
  const b = x.branches.find((q) => q.id === (r === 'owner' ? 'delivery' : 'opportunities')) ?? x.branches[0];
  return { title: `The branch: ${b.name}`, body: `${b.finding} ${x.decision} The highlighted path from the roots to this branch is the recommended focus, based on the answers.`, part: b.id };
}
function exampleHTML() {
  const r = example.route, w = EX_WHO[r] ?? EX_WHO.owner;
  return `
    <div class="ex-head"><h2 id="example-title">Explore an example</h2><button type="button" class="help-close" id="example-close" aria-label="Exit the example"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5l-10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>
    <p class="ex-persona"><span class="ex-chip" aria-hidden="true">${esc(w.initials)}</span><span><b id="example-name">${esc(w.who)}</b><span class="ex-minor"><span class="ex-tag">Example</span> ${esc(w.tag)}. Nothing you do here is kept.</span></span></p>
    <div class="ex-switch" role="group" aria-label="Which example"><span class="t-label">Show</span>
      <button type="button" class="stone" data-ex-route="owner" aria-pressed="${r === 'owner' ? 'true' : 'false'}">A business owner</button>
      <button type="button" class="stone" data-ex-route="starter" aria-pressed="${r === 'starter' ? 'true' : 'false'}">Someone starting out</button></div>
    <ol class="ex-steps" aria-label="What the tree shows">${EX_STEPS.map(([k, words], i) => `<li><button type="button" class="ex-step" data-ex-step="${k}" aria-expanded="false"><span class="ex-n">${i + 1}</span><span>${esc(words)}</span></button></li>`).join('')}</ol>
    <div class="ex-explain" id="example-explain" role="region" aria-labelledby="example-explain-title" hidden>
      <div class="ex-explain-head"><h3 id="example-explain-title"></h3><button type="button" class="help-close" id="example-explain-close" aria-label="Close this explanation"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5l-10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>
      <p id="example-explain-body"></p>
      <p class="ex-minor" id="example-explain-tree">Drag the tree to turn it, or press a part to see what it carries.</p>
    </div>
    <div class="ex-host" id="example-host" hidden></div>
    <div class="ex-acts"><button type="button" class="glass glass-on" id="example-build">Build my plan</button><button type="button" class="glass" id="example-exit">Exit example</button></div>`;
}
function exampleHTMLOld() {
  return `
    <div class="ex-head"><h2 id="example-title">Explore an example</h2><button type="button" class="help-close" id="example-close" aria-label="Back to the start"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>
    <span class="ex-tag" id="example-name">Example</span>
    <p class="ex-minor">A sample business, not a client, with made-up figures. Nothing you do here is kept.</p>
    <div class="ex-switch" role="group" aria-label="Which example"><span class="t-label">Show</span>
      <button type="button" class="stone" data-ex-route="owner" aria-pressed="true">A business owner</button>
      <button type="button" class="stone" data-ex-route="starter" aria-pressed="false">Someone starting out</button></div>
    <div class="ex-host" id="example-host"></div>
    <div class="ex-acts"><button type="button" class="glass glass-on" id="example-build">Build my plan</button><button type="button" class="glass" id="example-exit">Back to the start</button></div>`;
}
function growExampleTree() {
  const t = tree();
  if (!t) return;
  example.snap = snapshotTree(t);
  if (!example.snap) return;
  try { t.setRootSources?.(DEMO_ROOTS); } catch (e) { /* optional */ }
  let p = null;
  try { p = t.planted ? null : t.playIntro(reduce() ? 1 : 2400, { leaves: 1, preset: 'planting', trunkKnown: true }); } catch (e) { p = null; }
  const fill = () => { if (!example.open) return; setAllTwigs(t, 'full', true); try { t.setCollar?.('capacity'); } catch (e) { /* optional */ } try { if ('trunkDemo' in t) { t.trunkDemo = true; t.start?.(); } } catch (e) { /* optional */ } };
  if (p && typeof p.then === 'function') p.then(fill, fill); else fill();
  if (t.planted) { try { t.frame('planting', { ms: reduce() ? 0 : 900 }); } catch (e) { /* stays */ } }
}
function openExample(route) {
  if (!exPanel || example.open || running) return false;
  if (M.moving) return false;
  example.open = true;
  example.route = route === 'starter' ? 'starter' : (route === 'owner' ? 'owner' : routeNow());
  example.focus = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : $('#example');
  exPanel.innerHTML = exampleHTML();
  exPanel.hidden = false;
  ground.stop();
  try { M.overlay?.open?.('example', { close: closeExample, el: exPanel, opener: example.focus }); } catch (e) { /* no registry */ }
  exPanel.querySelectorAll('[data-ex-route]').forEach((b) => b.addEventListener('click', () => { if (example.route !== b.dataset.exRoute) { play('tap', { x: panOf(b) }); renderExample(b.dataset.exRoute); } }));
  $('#example-close', exPanel)?.addEventListener('click', () => closeExample(true));
  $('#example-exit', exPanel)?.addEventListener('click', () => closeExample(true));
  $('#example-build', exPanel)?.addEventListener('click', () => { const r = example.route; closeExample(false); chooseRoute(r); });
  // the three headings open one explanation each; the explanation's own X closes only the explanation
  exPanel.querySelectorAll('.ex-step').forEach((b) => b.addEventListener('click', () => { if (b.getAttribute('aria-expanded') === 'true') closeExplanation(true); else openExplanation(b.dataset.exStep); }));
  $('#example-explain-close', exPanel)?.addEventListener('click', () => closeExplanation(true));
  // Escape closes an open explanation first; a second Escape leaves the example
  exPanel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const box = $('#example-explain', exPanel); if (box && !box.hidden) closeExplanation(true); else closeExample(true); } });
  renderExample(example.route);
  growExampleTree();
  play('open');
  $('#example-title', exPanel)?.setAttribute('tabindex', '-1');
  $('#example-title', exPanel)?.focus({ preventScroll: true });
  return true;
}
function closeExample(refocus) {
  if (!exPanel || !example.open) return;
  example.open = false;
  const t = tree();
  if (t && example.snap) { restoreTree(t, example.snap); if (!example.snap.planted) frameSeed(reduce() ? 0 : 900); }
  example.snap = null; example.local = null;
  exPanel.hidden = true; exPanel.innerHTML = '';
  try { M.overlay?.close?.('example', { silent: true }); } catch (e) { /* no registry */ }
  if (stageIs('arrival')) ground.start();
  play('close');
  if (refocus !== false) { try { (example.focus && example.focus.isConnected ? example.focus : $('#example'))?.focus?.({ preventScroll: true }); } catch (e) { /* no focus */ } }
  example.focus = null;
}
example.openPanel = openExample;
example.close = closeExample;
M.example = { open: openExample, close: closeExample, isOpen: () => example.open, route: () => example.route };

/* ---------- the stage: what the shell's pages do when the stage changes ---------- */
doc.addEventListener('mercer:stage', (e) => {
  const s = e.detail?.stage;
  // app.js frames the tree's own arrival pose right after it dispatches the stage, so the seed is asked for again a tick later
  if (s === 'arrival') { ground.start(); frameSeed(0); setTimeout(() => { if (stageIs('arrival') && !example.open) frameSeed(600); }, 0); paintSaved(); pressCard(null); } else ground.stop();
  if (s !== 'arrival' && example.open) closeExample(false);
  if (s === 'orient') {
    // a restored session is taken past the orientation; a fresh journey reads it
    if (M.save?.restored || params.get('orient') === 'off') { orient.route = routeNow(); orientDone(); return; }
    openOrient();
  } else if (orient.seq) closeOrientDemo();
  if (s === 'intro' && !running) openOrient();
  if (s && s !== 'intro' && s !== 'orient' && s !== 'arrival' && running && !replay) {
    // the stage left the slides by another road: everything the demonstration put on the tree goes with it. This runs
    // inside the stage change, before (d) seeds the tree and paints the visitor's own root counts, so those stand.
    running = false; finished = true; seq++; doc.removeEventListener('keydown', onKey, true);
    leaveTree();
    if (s === 'roots') quietBirds();
  }
  // Task 06 (D11): the halo stays from the slides' tree through questioning and the results
  if (s && !replay) halo(JOURNEY_HALO.includes(s));
});
try { const mq = window.matchMedia('(max-width: 720px)'); const re = () => { if (stageIs('arrival') || stageIs('orient')) frameSeed(0); }; if (mq.addEventListener) mq.addEventListener('change', re); else mq.addListener(re); } catch (e) { /* one frame */ }
/* R8: the Disclaimer stands once, on slide 5, with the start action and the device-saving choice. The same text is in
   Help; nothing repeats it on an answer or an action card. */
try { const slot = $('#intro-disclaimer'); if (slot) slot.appendChild(M.disclaimerBlock()); } catch (e) { /* the four lines are in help too */ }
setSlide(0);
if (stageIs('arrival') || !doc.body.dataset.stage) { frameSeed(0); themeTree(); ground.start(); paintSaved(); }
/* a page opened straight at a slide (a test switch); ?route= chooses a route on load */
if (startAt !== null && stageIs('arrival')) begin();
else if ((params.get('route') === 'owner' || params.get('route') === 'starter') && stageIs('arrival')) chooseRoute(params.get('route'));
else if (stageIs('orient')) openOrient();

M.intro = { open: start, running: () => running, replaying: () => !!replay, finish, begin, beat: () => at + 1, slide: () => at + 1 };
})();
