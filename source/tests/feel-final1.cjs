/* final 1, feel: task 05 (sound belongs to moments) and task 09 (the small family of meaningful controls).
   Task 05: the cue plays once on entering a cutscene and stops on leaving, on mute, on a hidden tab and on teardown;
   re-entering never stacks; nothing loops under a question or a result; no sound on pointer movement.
   Task 09: the dot field reports a live count and takes a typed count or range; ranking works from the keyboard;
   the Now marker renders with its unit; the delivery paths are labelled with a text alternative.
   Plain node + the jsdom installed for the fix-3 harness (scratchpad/labtest). Run: node tests/feel-final1.cjs
   Layout is stubbed: every box is 320 x 44 at 0,0. The Web Audio API is a recording stub, so what is scheduled is
   read back rather than heard. */
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require(path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'))); } catch (e) { ({ JSDOM } = require('jsdom')); }

const FEEL_JS = fs.readFileSync(path.join(ROOT, 'feel.js'), 'utf8');
const FEEL_CSS = fs.readFileSync(path.join(ROOT, 'feel.css'), 'utf8');

/* ---------- a recording Web Audio stub: every node, every ramp and every source start is kept ---------- */
function audioStub(win, log) {
  const param = (name, node) => ({
    value: 0,
    setValueAtTime(v, t) { this.value = v; log.ramps.push({ node: node.kind, name, to: v, t, how: 'set' }); return this; },
    linearRampToValueAtTime(v, t) { this.value = v; log.ramps.push({ node: node.kind, name, to: v, t, how: 'linear' }); return this; },
    exponentialRampToValueAtTime(v, t) { this.value = v; log.ramps.push({ node: node.kind, name, to: v, t, how: 'exp' }); return this; },
    setTargetAtTime(v, t) { this.value = v; log.ramps.push({ node: node.kind, name, to: v, t, how: 'target' }); return this; },
    cancelScheduledValues() { return this; },
  });
  const mk = (kind, ctx) => {
    const n = { kind, context: ctx, connect() {}, disconnect() {} };
    log.nodes.push(kind);
    if (kind === 'gain') n.gain = param('gain', n);
    if (kind === 'osc' || kind === 'buffer') {
      n.frequency = param('frequency', n);
      n.type = 'sine';
      n.start = (t) => { log.starts.push({ kind, t }); };
      n.stop = () => {};
      n.loop = false;
      n.buffer = null;
    }
    if (kind === 'filter') { n.frequency = param('frequency', n); n.Q = param('Q', n); n.type = 'lowpass'; }
    if (kind === 'pan') n.pan = param('pan', n);
    return n;
  };
  function AC() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
    this.createGain = () => mk('gain', this);
    this.createOscillator = () => mk('osc', this);
    this.createBiquadFilter = () => mk('filter', this);
    this.createStereoPanner = () => mk('pan', this);
    this.createBufferSource = () => mk('buffer', this);
    this.createBuffer = (ch, len) => ({ getChannelData: () => new Float32Array(len) });
    this.resume = () => Promise.resolve();
    this.suspend = () => { this.state = 'suspended'; return Promise.resolve(); };
    log.contexts++;
  }
  win.AudioContext = AC;
}

function boot({ reduced = false, storage = {}, audio = true } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><main id="m"></main><button id="unsure">Not sure</button></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
  const { window } = dom;
  window.matchMedia = (q) => ({ matches: reduced && /reduce/.test(q), addEventListener() {}, removeEventListener() {} });
  window.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, finish() {} }; };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.HTMLElement.prototype.releasePointerCapture = function () {};
  window.Element.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 320, height: 44, right: 320, bottom: 44 }; };
  window.PointerEvent = window.MouseEvent;
  Object.entries(storage).forEach(([k, v]) => window.localStorage.setItem(k, v));
  const log = { ramps: [], starts: [], nodes: [], contexts: 0 };
  // one bird phrase builds exactly one panner, so panners are the count of phrases in the air
  log.phrases = () => log.nodes.filter((k) => k === 'pan').length;
  if (audio) audioStub(window, log);
  window.Mercer = {};
  window.eval(FEEL_JS);
  window.__log = log;
  return window;
}

const fails = [];
let passed = 0;
const ok = (cond, msg) => { if (cond) passed++; else fails.push(msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  /* =============================== task 05: sound belongs to moments =============================== */

  /* ---------- the cue plays once on entering a cutscene ---------- */
  {
    const w = boot();
    const log = w.__log;
    const M = w.Mercer;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));   // the gesture that lets audio exist at all
    ok(log.contexts === 1, 'cue: the audio context is built at the first gesture, never before');
    const before = log.starts.length;
    M.feel.scene('crown', { ms: 2400, fade: 600 });
    ok(M.feel.birds.running() === true, 'cue: entering a cutscene starts one cue');
    await sleep(140);
    ok(log.starts.length > before, 'cue: a phrase sounds within the first moments of the cutscene');
    // the cue's own bus: up to a low ceiling over the first quarter second, held, then down to nothing
    const gains = log.ramps.filter((r) => r.node === 'gain' && r.how === 'linear');
    const rise = gains.find((g) => g.t > 0.2 && g.t < 0.3);
    ok(rise && rise.to > 0 && rise.to <= 0.12 + 1e-9, `cue: the cue rises to a low ceiling (${rise && rise.to} <= 0.12)`);
    const down = gains.filter((g) => g.to === 0);
    ok(down.length > 0 && down.some((g) => g.t >= 2.4 && g.t <= 3.2), 'cue: the gain is scheduled to nothing at the end of a 2.4 s window plus its fade');
    ok(/CUE = \{ peak: 0\.12, min: 2000, max: 4000/.test(FEEL_JS) && !/0\.18 \* level/.test(FEEL_JS), 'cue: the window is 2 to 4 s and the old ambient level is gone');
  }

  /* ---------- it stops on leaving, and re-entering does not stack ---------- */
  {
    const w = boot();
    const M = w.Mercer;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    M.feel.scene('crown', { ms: 3000 });
    M.feel.scene(false);
    ok(M.feel.birds.running() === false, 'leave: leaving the cutscene is silence');
    const after = w.__log.starts.length;
    await sleep(160);
    ok(w.__log.starts.length === after, 'leave: no phrase sounds after the leave, however long the window was');

    // re-entering: one live cue, never two
    const p0 = w.__log.phrases();
    M.feel.scene('crown', { ms: 3000 });
    M.feel.scene('crown', { ms: 3000 });
    M.feel.scene('crown', { ms: 3000 });
    await sleep(140);
    const grew = w.__log.phrases() - p0;
    ok(grew === 1, `re-entry: three entries to the same scene sound one phrase in the first beat, not three (${grew})`);
    ok(M.feel.sceneOf() === 'crown', 're-entry: the scene is named, so a second call for the same scene is known to be the same');
    // and a different scene, entered straight after, replaces rather than layers
    const p1 = w.__log.phrases();
    M.feel.scene('reveal', { ms: 3000 });
    await sleep(140);
    ok(w.__log.phrases() - p1 === 1, 're-entry: moving to another cutscene cancels the first cue rather than stacking a second');
  }

  /* ---------- nothing loops: a cue ends by itself and schedules no repeat ---------- */
  {
    const w = boot();
    const M = w.Mercer;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    M.feel.cue({ ms: 900, fade: 200 });
    await sleep(1400);
    ok(M.feel.birds.running() === false, 'no loop: the cue is over by itself once its window and fade have passed');
    const after = w.__log.starts.length;
    await sleep(300);
    ok(w.__log.starts.length === after, 'no loop: nothing is scheduled after the cue ends');
    ok(!/schedule\(i\)/.test(FEEL_JS) && !/rnd\(4000, 11000\)/.test(FEEL_JS), 'no loop: the old 4 to 11 s ambient scheduler is gone from the source');
  }

  /* ---------- questions and results: the level can be raised without a bed starting ---------- */
  {
    const w = boot();
    const M = w.Mercer;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    const before = w.__log.starts.length;
    // what canopy.js does while someone reads a result, and what app.js does between sections
    M.feel.birds.fade(1, 2000);
    M.feel.birds.level(1);
    await sleep(200);
    ok(w.__log.starts.length === before, 'browsing: raising the level schedules no birdsong (no bed under questions or results)');
    ok(M.feel.birds.running() === false, 'browsing: and the birds are not running');
    // a fade to nothing is a leave
    M.feel.scene('crown', { ms: 3000 });
    M.feel.birds.fade(0, 1200);
    ok(M.feel.birds.running() === false, 'browsing: fade(0) ends the cue, so app.js leaving a scene is silence');
  }

  /* ---------- mute, the hidden tab and teardown ---------- */
  {
    const w = boot();
    const M = w.Mercer;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    M.feel.scene('crown', { ms: 4000 });
    M.feel.setMuted(true);
    ok(M.feel.birds.running() === false, 'mute: muting stops the cue at once');
    const n = w.__log.starts.length;
    await sleep(160);
    ok(w.__log.starts.length === n, 'mute: and nothing sounds afterwards');
    ok(w.localStorage.getItem('mercer-sound') === 'off', 'mute: the preference persists');
    M.feel.setMuted(false);
    M.feel.scene('crown', { ms: 4000 });
    ok(M.feel.birds.running() === true, 'mute: unmuting lets a later cutscene sound again');

    // the tab goes away
    Object.defineProperty(w.document, 'visibilityState', { value: 'hidden', configurable: true });
    Object.defineProperty(w.document, 'hidden', { value: true, configurable: true });
    w.document.dispatchEvent(new w.Event('visibilitychange'));
    ok(M.feel.birds.running() === false, 'hidden tab: backgrounding the tab stops the cue');
    Object.defineProperty(w.document, 'visibilityState', { value: 'visible', configurable: true });
    Object.defineProperty(w.document, 'hidden', { value: false, configurable: true });

    // teardown
    M.feel.scene('crown', { ms: 4000 });
    M.feel.silence();
    ok(M.feel.birds.running() === false && M.feel.sceneOf() === null, 'teardown: silence() leaves no cue and no scene');
  }

  /* ---------- never on pointer movement ---------- */
  {
    const w = boot();
    const M = w.Mercer;
    const doc = w.document;
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    const host = doc.createElement('div');
    doc.getElementById('m').appendChild(host);
    const sl = M.ui.slider(host, { scale: [1000, 100000], unit: '£' });
    const box = sl.el.querySelector('.rail-box');
    const pt = (t, x) => box.dispatchEvent(new w.MouseEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: 20, button: 0 }));
    const n0 = w.__log.starts.length;
    pt('pointerdown', 40);
    for (let x = 60; x < 260; x += 20) pt('pointermove', x);
    ok(w.__log.starts.length === n0, 'movement: running a handle along a rail makes no sound at all');
    pt('pointerup', 260);
    ok(w.__log.starts.length >= n0, 'movement: the release is free to sound (the flag is cleared before the end handler)');
    ok(!/move\([^)]*\)\s*\{[^}]*\btap\(/.test(FEEL_JS), 'movement: no drag move handler calls tap()');
  }

  /* ---------- audio is never forced ---------- */
  {
    const w = boot({ storage: { 'mercer-sound': 'off' } });
    const M = w.Mercer;
    M.feel.scene('crown');
    ok(w.__log.contexts === 0, 'permission: with sound off, entering a cutscene builds no audio context');
    const w2 = boot();
    w2.Mercer.feel.scene('crown');
    ok(w2.__log.contexts === 0 && w2.__log.starts.length === 0, 'permission: with no gesture yet, a cutscene plays nothing (no autoplay)');
    w2.dispatchEvent(new w2.MouseEvent('pointerdown', { bubbles: true }));
    await sleep(140);
    ok(w2.__log.starts.length > 0, 'permission: the waiting cue plays once the visitor has acted, and only then');
  }

  /* =============================== task 09: the control family =============================== */
  const w = boot();
  const { document } = w;
  const M = w.Mercer;
  const host = () => { const d = document.createElement('div'); document.getElementById('m').appendChild(d); return d; };
  const key = (el, k, extra = {}) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));
  const type = (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const rec = () => { const r = { inputs: [], commits: [] }; r.opts = { onInput: (v) => r.inputs.push(v), onCommit: (v) => r.commits.push(v) }; return r; };
  const lastCommit = (r) => r.commits[r.commits.length - 1];

  /* ---------- dots: a live count and a typed alternative ---------- */
  {
    const r = rec();
    const d = M.ui.dots(host(), { ...r.opts, id: 'reach', label: 'People you could reach', scale: [50, 20000] });
    ok(d.el.classList.contains('ui-dots') && d.el.querySelector('.dots-field'), 'dots: one instrument with a field of dots');
    const count = d.el.querySelector('.dots-count');
    ok(count && count.tagName === 'OUTPUT' && count.textContent === 'How many people you could reach', 'dots: before a figure, the control says what it measures');
    ok(d.el.querySelector('.dots-field').getAttribute('aria-hidden') === 'true', 'dots: the dots themselves are decoration; the rail and the figure carry the value');

    const inp = d.el.querySelector('input.figure');
    const h0 = d.el.querySelector('.handle');
    ok(inp && d.el.querySelector('.face .unit')?.textContent === 'people', 'dots: the typed alternative shows its unit from the start');
    type(inp, '2400');
    ok(d.get() === 2400, 'dots: a typed count is the value');
    // the live count is the figure with its unit; the handle speaks it while it is dragged
    ok(inp.value === '2400' && h0.getAttribute('aria-valuetext') === '2,400 people', `dots: the count is live and carries its unit (got "${h0.getAttribute('aria-valuetext')}")`);
    ok(count.textContent === '', 'dots: and it is never printed a second time under the control');
    const lit = [...d.el.querySelectorAll('.dot.on')].length;
    ok(lit > 0 && lit <= 120, `dots: the field lights dots for that count (${lit})`);
    ok(d.count() === 2400 && d.per() >= 1, 'dots: count() and per() report the figure and the key');
    const keyLine = d.el.querySelector('.dots-key');
    ok(keyLine && /^Each dot is [\d,]+ people$/.test(keyLine.textContent), `dots: the key says what one dot is (got "${keyLine?.textContent}")`);

    // the required claim, in the control's own words
    const claim = d.el.querySelector('.dots-claim');
    ok(claim && /not real people/i.test(claim.textContent) && /not leads|nobody is listed/i.test(claim.textContent), 'dots: the field says in its own label that the dots are not real people or leads');

    // a typed range
    type(inp, '2,000 to 4,000');
    inp.dispatchEvent(new w.Event('blur', { bubbles: false }));
    ok(Array.isArray(d.get()) && d.get()[0] === 2000 && d.get()[1] === 4000, `dots: a typed range is read as a range (got ${JSON.stringify(d.get())})`);
    ok(h0.getAttribute('aria-valuetext') === '2,000 to 4,000 people', `dots: the live count says the range (got "${h0.getAttribute('aria-valuetext')}")`);
    ok([...d.el.querySelectorAll('.dot.maybe')].length > 0, 'dots: the span between the two figures is shown at a lower weight');
    ok(lastCommit(r)[1] === 4000, 'dots: the range commits');

    // the keyboard path on the rail
    const h = d.el.querySelector('.handle');
    ok(h && h.getAttribute('role') === 'slider' && h.getAttribute('aria-valuetext'), 'dots: the rail handle is a slider that says its value');
    const was = d.count();
    h.focus(); key(h, 'ArrowRight');
    ok(d.count() > was, 'dots: arrows change the count from the keyboard');
    // dots are never a person: no dot is focusable or clickable
    ok([...d.el.querySelectorAll('.dot')].every((x) => x.tagName === 'I' && !x.hasAttribute('tabindex')), 'dots: no dot is a target, so no dot can read as a person to click');
    ok(/\.ui \.dot \{[^}]*width: 7px/.test(FEEL_CSS) && !/\.ui \.dot[^{]*\{[^}]*box-shadow/.test(FEEL_CSS), 'dots: flat dots, no glow');
    // text that is no figure stays as typed, with the rule beside it
    type(inp, 'lots of them');
    inp.dispatchEvent(new w.Event('blur', { bubbles: false }));
    const note = d.el.querySelector('.ui-note:not(.dots-claim)');
    ok(inp.value === 'lots of them' && note && !note.hidden && /range such as 2,000 to 4,000/.test(note.textContent), 'dots: words are kept as typed and the line says what the field takes, including a range');
    d.clear();
    ok(d.get() === null && d.el.classList.contains('empty') && count.textContent !== '', 'dots: cleared, the readout says what the control measures');
  }

  /* ---------- paths: labelled directions with a text alternative ---------- */
  {
    const r = rec();
    const p = M.ui.paths(host(), { ...r.opts, id: 'delivery', label: 'How the work reaches the customer' });
    const btns = [...p.el.querySelectorAll('.paths-row .stone')];
    ok(btns.length === 5 && btns.map((b) => b.dataset.v).join() === 'visit,travel,remote,ship,mixed', 'paths: five labelled text choices: visit, travel, remote, ship, mixed');
    ok(btns.every((b) => b.getAttribute('role') === 'radio' && b.textContent.trim().length > 6), 'paths: each is a radio with words, not an icon alone');
    const svg = p.el.querySelector('svg.paths-map');
    ok(svg && svg.getAttribute('aria-hidden') === 'true', 'paths: the drawing is aria-hidden; the choices are the control');
    const names = [...svg.querySelectorAll('.pm-name')].map((t) => t.textContent);
    ok(names.includes('Your business') && names.includes('Customer'), 'paths: the two marks are labelled in the drawing');

    click(btns[0]);
    ok(p.get() === 'visit' && lastCommit(r) === 'visit', 'paths: a text choice picks and commits');
    const lineWords = svg.querySelector('.pm-line');
    ok(lineWords.textContent === 'They travel to you', 'paths: the path is labelled with the direction it means');
    ok(svg.querySelector('.pm-head.in').style.display !== 'none' && svg.querySelector('.pm-head.out').style.display === 'none', 'paths: customers coming to you points the arrow inward');
    click(btns[1]);
    ok(svg.querySelector('.pm-head.out').style.display !== 'none' && svg.querySelector('.pm-head.in').style.display === 'none', 'paths: travelling to them turns the arrow round');
    click(btns[2]);
    ok(svg.querySelector('.pm-track').classList.contains('dashed') && lineWords.textContent === 'Nobody travels', 'paths: remote is a dashed path, labelled');
    click(btns[3]);
    ok(svg.querySelector('.pm-parcel').style.display !== 'none', 'paths: shipping puts a parcel on the path');
    // keyboard
    btns[0].focus();
    key(btns[0], 'ArrowRight');
    ok(document.activeElement === btns[1], 'paths: arrows rove the choices');
    key(btns[1], ' ');
    ok(p.get() === 'travel', 'paths: Space picks the focused choice');
    let entered = 0;
    p.el.addEventListener('mercer:enter', () => entered++);
    key(btns[1], 'Enter');
    ok(entered === 1, 'paths: Enter is the keyboard\'s Continue');
    ok(btns.every((b) => !/[\u{1F300}-\u{1FAFF}]/u.test(b.textContent)), 'paths: the choices are words, no emoji');
  }

  /* ---------- rank: an explicitly ordered list ---------- */
  {
    const r = rec();
    const k = M.ui.rank(host(), { ...r.opts, id: 'channels', label: 'Channels', options: [['email', 'Email'], ['search', 'Search'], ['referral', 'Referrals'], ['events', 'Events']] });
    const btn = (v) => k.el.querySelector(`.rank-row .stone[data-v="${v}"]`);
    const list = k.el.querySelector('ol.rank-list');
    ok(list && list.hidden, 'rank: nothing is ranked before anything is chosen');
    click(btn('search'));
    click(btn('email'));
    ok(JSON.stringify(k.get()) === '["search","email"]', 'rank: choices join the list in the order they are picked');
    ok(!list.hidden && list.children.length === 2, 'rank: the list appears with a line for each');
    const nums = [...list.querySelectorAll('.rank-n')].map((x) => x.textContent);
    ok(nums.join() === '1,2', 'rank: the position is written beside each line, not implied by height');
    const names = [...list.querySelectorAll('.rank-name')].map((x) => x.textContent);
    ok(names.join() === 'Search,Email', 'rank: the lines are in the value\'s order');

    // up and down by tap
    const rowOf = (label) => [...list.children].find((li) => li.querySelector('.rank-name').textContent === label);
    const up = rowOf('Email').querySelector('.sort-move.up');
    ok(up && up.getAttribute('aria-label') === 'Move up: Email', 'rank: the move controls name what they move');
    ok(rowOf('Search').querySelector('.sort-move.up').getAttribute('aria-disabled') === 'true', 'rank: the top line cannot go up');
    ok(rowOf('Email').querySelector('.sort-move.down').getAttribute('aria-disabled') === 'true', 'rank: the bottom line cannot go down');
    click(up);
    ok(JSON.stringify(k.get()) === '["email","search"]', 'rank: Up moves a line by tap');
    ok([...list.querySelectorAll('.rank-name')].map((x) => x.textContent).join() === 'Email,Search', 'rank: and the list is redrawn in the new order');

    // the keyboard path
    click(btn('referral'));
    const emailRow = rowOf('Email');
    emailRow.querySelector('.sort-move.down').focus();
    key(emailRow.querySelector('.sort-move.down'), 'ArrowDown', { shiftKey: true });
    ok(JSON.stringify(k.get()) === '["search","email","referral"]', 'rank: Shift and Down move a line from the keyboard');
    const searchUp = rowOf('Search').querySelector('.sort-move.up');
    searchUp.focus();
    key(searchUp, 'ArrowUp', { shiftKey: true });
    ok(JSON.stringify(k.get()) === '["search","email","referral"]', 'rank: at the top, Shift and Up change nothing and focus stays put');
    ok(k.el.contains(document.activeElement), 'rank: focus never drops out of the control');
    // the numbers keep up
    ok([...list.querySelectorAll('.rank-n')].map((x) => x.textContent).join() === '1,2,3', 'rank: the numbers are rewritten after every move');

    // remove, and unpicking
    const drop = rowOf('Email').querySelector('.rank-drop');
    ok(drop.getAttribute('aria-label') === 'Remove: Email', 'rank: Remove names its line too');
    click(drop);
    ok(JSON.stringify(k.get()) === '["search","referral"]', 'rank: Remove takes a line out');
    ok(btn('email').getAttribute('aria-checked') === 'false', 'rank: and the choice above goes back to unchosen');
    click(btn('search'));
    ok(JSON.stringify(k.get()) === '["referral"]', 'rank: unpicking a choice removes its line');
    ok(lastCommit(r).join() === 'referral', 'rank: every change commits, so Continue can enable');
    // restoring a saved answer
    k.set(['events', 'search']);
    ok([...list.querySelectorAll('.rank-name')].map((x) => x.textContent).join() === 'Events,Search', 'rank: a saved order is restored in order');
    ok(k.el.querySelector('.rank-row .stone[data-v="events"]').getAttribute('aria-checked') === 'true', 'rank: and the choices above show what is in it');
    ok(/\.ui-rank \.rank-item \{[^}]*min-height: 44px/.test(FEEL_CSS), 'rank: each line is a 44 px row');
  }

  /* ---------- the Now marker on the target's own rail ---------- */
  {
    const s = M.ui.slider(host(), { id: 'goal', label: 'Monthly revenue', unit: '£', scale: [1000, 50000], now: 4800 });
    const mark = s.el.querySelector('.now-mark'), lab = s.el.querySelector('.now-lab');
    ok(mark && !mark.hidden && lab && !lab.hidden, 'now: the baseline is marked on the same rail as the target');
    ok(lab.textContent === 'Now £4,800', `now: the marker is written out with its unit (got "${lab.textContent}")`);
    ok(mark.style.left && mark.style.left !== '0%', 'now: it stands where the figure falls on the rail');
    const h = s.el.querySelector('.handle');
    ok(/Monthly revenue, now £4,800/i.test(h.getAttribute('aria-label')), 'now: the target control says what it is measured against');
    ok(s.now() === 4800, 'now: the baseline can be read back');
    s.setNow(6200);
    ok(s.el.querySelector('.now-lab').textContent === 'Now £6,200', 'now: it moves when the baseline is confirmed later');
    s.setNow(null);
    ok(s.el.querySelector('.now-mark').hidden, 'now: with no baseline there is no marker');
    // the typed alternative is the same field every rail has
    const s2 = M.ui.slider(host(), { unit: '£', scale: [1000, 50000], now: 4800, nowWords: 'Last month' });
    ok(s2.el.querySelector('.now-lab').textContent === 'Last month £4,800', 'now: the leader can be reworded');
    const inp = s2.el.querySelector('input.figure');
    type(inp, '9000');
    ok(s2.get() === 9000 && s2.el.querySelector('.now-lab').textContent === 'Last month £4,800', 'now: typing the target leaves the baseline alone');
    ok(/\.ui \.now-mark \{[^}]*pointer-events: none/.test(FEEL_CSS), 'now: the marker is a mark, not a second thumb');
  }

  /* ---------- the family shares its pieces, and every signature still holds ---------- */
  {
    const uiNames = ['slider', 'pair', 'fee', 'stones', 'cards', 'tenStones', 'ring', 'keptRing', 'arc', 'capacity', 'shelves', 'sorter', 'ledger', 'sort', 'tableRing', 'twoSided', 'socket', 'dial', 'monthsArc', 'line', 'field', 'clientCards', 'hint', 'filePick', 'dots', 'paths', 'rank'];
    ok(uiNames.every((n) => typeof M.ui[n] === 'function'), 'family: every M.ui instrument is still exported, with the three new ones');
    const feelNames = ['play', 'panOf', 'key', 'birds', 'pulse', 'toggle', 'bindDrop', 'reveal', 'grade', 'paintGrade', 'gradeColor', 'gauge', 'possessive', 'muted', 'setMuted', 'mountSwitch', 'reduced', 'EASE', 'measure', 'scene', 'cue', 'silence', 'sceneOf'];
    ok(feelNames.every((n) => M.feel[n] !== undefined), 'family: every M.feel entry is still exported, with the moments added');
    ['start', 'cue', 'stop', 'level', 'fade', 'running'].forEach((n) => ok(typeof M.feel.birds[n] === 'function', `family: M.feel.birds.${n}() is still callable`));
    // the shared shape: each new instrument answers the same nine calls
    [['dots', {}], ['paths', {}], ['rank', { options: [['a', 'A']] }]].forEach(([n, o]) => {
      const c = M.ui[n](host(), o);
      ok(['el', 'get', 'set', 'clear', 'focus', 'destroy', 'suggest', 'accept', 'suggested'].every((k) => c[k] !== undefined), `family: ${n} keeps the shared instrument shape`);
      c.destroy();
    });
    // built before it is mounted, as cards can be
    [['dots', {}], ['paths', {}], ['rank', { options: [['a', 'A']] }]].forEach(([n, o]) => {
      const c = M.ui[n](o);
      ok(c.el && c.el.classList.contains(`ui-${n}`) && !c.el.parentNode, `family: M.ui.${n}({ opts }) builds without a host`);
    });
    // one picking row and one move pair behind them all
    ok(/function optionButtons\(/.test(FEEL_JS) && /function moveButtons\(/.test(FEEL_JS), 'family: one picking row and one Up/Down pair are shared, not copied per control');
    const moveUses = (FEEL_JS.match(/moveButtons\(/g) || []).length;
    ok(moveUses >= 3, `family: the sorting zones and the ranked list use that same pair (${moveUses} references)`);
    ok(!/blur\(/.test(FEEL_CSS) && !/text-shadow/.test(FEEL_CSS), 'family: no glow and no blur anywhere in feel.css');
    // reduced motion reaches the new parts
    const reduceBlock = FEEL_CSS.slice(FEEL_CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
    ok(/\.ui \.dot(,| \{)/.test(reduceBlock), 'family: the dot field settles without motion under reduced motion');
    const rw = boot({ reduced: true });
    const rh = rw.document.getElementById('m');
    const rd = rw.Mercer.ui.dots(rh, { value: 2400, scale: [50, 20000] });
    const rk = rw.Mercer.ui.rank(rh, { options: [['a', 'A'], ['b', 'B']], value: ['a', 'b'] });
    ok(rw.Mercer.feel.reduced() === true && rd.get() === 2400 && rk.get().join() === 'a,b', 'family: the new controls carry the same answers under reduced motion');
    rw.Mercer.ui.paths(rh, { value: 'remote' });
    ok(rh.querySelectorAll('.ui').length === 3, 'family: and they all build there');
    // 44 px targets are a rule of the stylesheet, not of one control
    ok(/\.ui-rank \.rank-drop \{[^}]*min-height: 44px/.test(FEEL_CSS) && /\.ui \.sort-move \{[^}]*height: 44px/.test(FEEL_CSS), 'family: Remove, Up and Down are all 44 px');
  }

  console.log(fails.map((f) => `  FAIL ${f}`).join('\n'));
  console.log(`feel-final1: ${passed} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
