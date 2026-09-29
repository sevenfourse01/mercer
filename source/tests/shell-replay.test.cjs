/* shell (refine 1, rebuild 1): opening help and replaying How Mercer works leave M.state untouched (R4, R10), the demo
   question never reaches a visitor's answers, the tree is put back, the wheel paints six segments (R11), the privacy note (R7).
   The page in jsdom (the copy the other harnesses use, scratchpad/labtest) with intro.js and help.js only; M is a stub
   whose renderQuestion is the worst instrument there could be: it writes M.state and calls M.commit on every input. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM = null;
for (const at of [path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'), 'jsdom']) { try { ({ JSDOM } = require(at)); break; } catch (e) { /* next */ } }
if (!JSDOM) { console.log('SKIP: jsdom not found'); process.exit(0); }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass += 1; console.log('  ok  ', name); } else { fail += 1; console.log('  FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const html = src('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://mercer.test/?intro=full' });
  const { window } = dom;
  const { document } = window;
  // reduced motion: every wait in the tutorial is 0 ms and the demonstration is a still, so the walk is quick
  window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q), addEventListener() {}, addListener() {} });
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));

  /* ---- the stub page state ---- */
  const state = { stage: 'section', section: 'offer', biz: 'Test Co', now: 24000, price: 1800, sector: 'consulting', notSure: new Set(['margin']), na: new Set(), asked: ['now', 'price'] };
  const freeze = () => JSON.stringify(state, (k, v) => (v instanceof Set ? ['<set>', ...v] : v));
  const calls = { commit: 0, go: 0, reopen: 0, demoSawRealState: false, demoMounts: 0, enable: 0 };
  const twigLog = {};
  const mkBranch = (twigs) => ({ stub: false, fill: 0.5, twigs });
  const tree = {
    planted: true, rootCounts: { you: 5, sector: 1, web: 0, assumed: 2 }, collarOn: 'margin', pose: { preset: 'offer' }, label: { part: 'pricing', text: 'The Offer · Sale Value' },
    branches: new Map([
      ['pricing', mkBranch([{ id: 'price', state: 'leaf', grade: 3, kind: 'you' }, { id: 'retainer', state: 'bud', grade: 1, kind: 'you' }])],
      ['demand', mkBranch([])], ['conversion', mkBranch([])], ['capacity', mkBranch([])], ['margin', mkBranch([])], ['retention', mkBranch([])],
    ]),
    listeners: {},
    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
    frame(p) { this.pose = { preset: typeof p === 'string' ? p : this.pose.preset }; },
    setTwigs(id, list) { twigLog[id] = JSON.parse(JSON.stringify(list)); },
    setStub() {}, setLimbFill() {}, showPart() {}, setCoreHost() {}, setTheme() {},
    setRootSources(c) { this.rootCounts = { ...c }; },
    setCollar(id) { this.collarOn = id; },
    setLabel(part, text) { this.label = { part, text }; },
    anchor() { return { x: 900, y: 400, inView: true, front: true }; },
    zoomBy() {}, fit() {},
  };
  const M = (window.Mercer = {
    state, tree, stage: 'section', moving: false,
    commit() { calls.commit += 1; },
    go() { calls.go += 1; },
    reopen() { calls.reopen += 1; },
    titleCase: (s) => s,
    headline: () => ({ title: 'Sale value', sub: 'One sale, on average' }),
    progress: () => [
      { id: 'foundation', name: 'Foundation', hue: '--sec-ground', share: 0.25, done: 1, state: 'done' },
      { id: 'market', name: 'Market', hue: '--sec-offer', share: 0.25, done: 0.4, state: 'active' },
      { id: 'economics', name: 'Economics', hue: '--sec-close', share: 0.15, done: 0, state: 'upcoming' },
      { id: 'growth', name: 'Growth', hue: '--sec-clients', share: 0.15, done: 0, state: 'upcoming' },
      { id: 'leadership', name: 'Leadership', hue: '--sec-you', share: 0.12, done: 0, state: 'upcoming' },
      { id: 'forecast', name: 'Forecast', hue: '--sec-crown', share: 0.08, done: 0, state: 'upcoming' },
    ],
    inspect: (id) => ({ title: 'Sale Value', words: '£1,800', source: 'Your answer', canChange: id === 'price' }),
    // the worst instrument: it reads the state at mount, and writes the state and commits on every input
    renderQuestion(id, host) {
      calls.demoMounts += 1;
      if (window.Mercer.state === state) calls.demoSawRealState = true;
      host.innerHTML = '<div class="ui"><input><div class="rail"><i class="handle"></i></div></div>';
      const inp = host.querySelector('input');
      inp.addEventListener('input', () => { window.Mercer.state.price = Number(inp.value.replace(/\D/g, '')); window.Mercer.commit('price', window.Mercer.state.price); });
      return { el: host.firstChild, focus() {}, destroy() { window.Mercer.state.price = null; } };
    },
  });
  document.body.dataset.stage = 'section';
  document.body.dataset.mode = 'light';
  document.body.dataset.clearing = 'left';
  ['intro.js', 'help.js'].forEach((f) => { try { window.eval(src(f)); } catch (e) { errors.push(`${f}: ${e.stack}`); } });

  const before = freeze();

  /* ---- R11: the wheel ---- */
  const wheel = document.getElementById('wheel');
  ok('the wheel is six segments and shows on a section', wheel.querySelectorAll('.seg').length === 6 && wheel.hidden === false);
  ok('done, active and upcoming are marked', ['done', 'active', 'upcoming', 'upcoming', 'upcoming', 'upcoming'].every((s, i) => wheel.querySelectorAll('.seg')[i].dataset.state === s));
  ok('the active section is the accessible name, the words beside and the index in the middle', wheel.getAttribute('aria-label') === 'Progress: Market, section 2 of 6. Opens the section list' && document.getElementById('wheel-text').textContent === 'Market · 2 of 6' && document.getElementById('wheel-index').textContent === '2/6', wheel.getAttribute('aria-label'));
  ok('a segment wears its section hue', wheel.querySelectorAll('.seg')[1].style.getPropertyValue('--hue') === 'var(--sec-offer)');
  const saveProgress = M.progress; M.progress = undefined;
  M.shell.paintWheel();
  ok('with no M.progress six equal sections stand in, the first active', wheel.querySelectorAll('.seg').length === 6 && wheel.querySelectorAll('.seg')[0].dataset.state === 'active' && /Aim, section 1 of 6/.test(wheel.getAttribute('aria-label')), wheel.getAttribute('aria-label'));
  M.progress = saveProgress; M.shell.paintWheel();

  /* ---- Task 07: help, four headings, one explanation open at a time ---- */
  const helpBtn = document.getElementById('help'), panel = document.getElementById('help-panel');
  helpBtn.focus();
  helpBtn.click();
  ok('help opens', panel.hasAttribute('open'));
  const heads = [...panel.querySelectorAll('.help-head-btn')].map((el) => el.textContent);
  ok('help has the four headings, in order', JSON.stringify(heads) === JSON.stringify(['Using Mercer', 'Your tree', 'Your information', 'Saving and downloads']), heads);
  ok('one explanation is open at a time', panel.querySelectorAll('.help-group-body:not([hidden])').length === 1 && panel.querySelectorAll('.help-head-btn[aria-expanded="true"]').length === 1);
  panel.querySelectorAll('.help-head-btn')[2].click();
  ok('opening one closes the one that was open', panel.querySelectorAll('.help-group-body:not([hidden])').length === 1 && panel.querySelectorAll('.help-head-btn')[2].getAttribute('aria-expanded') === 'true' && panel.querySelectorAll('.help-head-btn')[0].getAttribute('aria-expanded') === 'false');
  panel.querySelectorAll('.help-head-btn')[2].click();
  ok('pressing the open one closes it, and none is left open', panel.querySelectorAll('.help-group-body:not([hidden])').length === 0);
  ok('help carries the four Disclaimer sentences', panel.querySelectorAll('.disclaimer li').length === 4 && !!panel.querySelector('.disclaimer details'));
  ok('Your information carries the four statements and nothing about tracking or accounts', panel.querySelectorAll('#help-info .help-plain li').length === 4 && !/tracking|no account/i.test(panel.querySelector('#help-info .help-plain').textContent));
  ok('help names touch and keyboard ways beside the pointer ones (C15)', /swipe/.test(panel.textContent) && /pinch/.test(panel.textContent) && /arrow keys/.test(panel.textContent) && !/hover/i.test(panel.textContent));
  ok('the tour is offered by name', !!panel.querySelector('#help-replay') && !panel.querySelector('#help-replay').disabled && panel.querySelector('#help-replay').textContent === 'Show me the tree');
  ok('opening help leaves M.state untouched', freeze() === before);
  panel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  if (typeof panel.close !== 'function') panel.dispatchEvent(new window.Event('close')); // jsdom without dialog.close(): the native event, by hand
  ok('Escape closes help', !panel.hasAttribute('open'));
  ok('focus returns to the help button', document.activeElement === helpBtn);

  /* ---- Task 04: the five slides, replayed over a live session ---- */
  helpBtn.click();
  panel.querySelector('#help-replay').click();
  if (typeof panel.close !== 'function') panel.dispatchEvent(new window.Event('close'));
  await sleep(30);
  ok('the slides are running as a replay', M.intro.running() && M.intro.replaying() && document.body.dataset.replay === '1');
  ok('the stage underneath did not move', document.body.dataset.stage === 'section' && state.stage === 'section' && calls.go === 0);
  ok('it opens at slide 1 of 4: the first run page, then the three of the tour', M.intro.slide() === 1 && document.getElementById('intro-count').textContent === '1 of 4');
  ok('a replay does not offer the device-saving choice again', document.getElementById('orient-save-row').hidden === true);
  const goBtn = document.getElementById('intro-go');
  ok('the forward press says Continue', goBtn.textContent === 'Continue' && goBtn.hidden === false);
  ok('the start action is not offered before the last slide', document.getElementById('orient-go').hidden === true);
  goBtn.click(); await sleep(60);
  ok('slide 2 is the tree, and names roots, limbs and the goal marker', M.intro.slide() === 2 && [...document.querySelectorAll('#slide-parts li b')].map((el) => el.textContent).join(',') === 'Roots,Limbs,Goal marker');
  ok('slide 2 puts those three names on the tree', document.querySelectorAll('.lead-plate').length === 3);
  goBtn.click(); await sleep(60);
  ok('slide 3 mounts the sample question with M.renderQuestion', M.intro.slide() === 3 && calls.demoMounts >= 1 && !!document.querySelector('#orient-q input'));
  ok('the sample host is inert and hidden from a screen reader', document.querySelector('#orient-demo .od-q').hasAttribute('inert') && document.querySelector('#orient-demo .od-q').getAttribute('aria-hidden') === 'true');
  ok('the sample figure was typed', document.querySelector('#orient-q input').value === '2,400');
  ok('the sample never saw the real state', calls.demoSawRealState === false);
  ok('the sample answer opened a labelled branch through tree.setTwigs', (twigLog.pricing || []).some((t) => t && t.state === 'leaf' && String(t.id).startsWith('d')));
  ok('the wheel shows the demonstration', /Foundations, section 2 of 6/.test(wheel.getAttribute('aria-label')), wheel.getAttribute('aria-label'));
  goBtn.click(); await sleep(60);
  ok('slide 4 is the sample result, marked Example, and it opens', M.intro.slide() === 4 && document.querySelector('#slide-result .example-tag').textContent === 'Example' && document.querySelectorAll('#slide-result-body dt').length === 3 && document.getElementById('slide-result-body').hidden === true);
  document.getElementById('slide-result-open').click();
  ok('the sample action opens on a press', document.getElementById('slide-result-body').hidden === false && document.getElementById('slide-result-open').getAttribute('aria-expanded') === 'true');
  document.getElementById('intro-back').click(); await sleep(40);
  ok('Back goes back', M.intro.slide() === 3);
  goBtn.click(); await sleep(40);
  const startBtn = document.getElementById('orient-go');
  ok('slide 4 is the last of the tour, and the notice now stands in the drawer on slide 1', M.intro.slide() === 4 && document.getElementById('intro-count').textContent === '4 of 4' && document.querySelectorAll('#privacy-drawer .disclaimer').length === 1 && document.querySelectorAll('#privacy-drawer .orient-facts li').length === 3);
  ok('Continue and Skip tour give way to the start action on the last slide', goBtn.hidden === true && startBtn.hidden === false && document.getElementById('intro-skip').hidden === true);
  ok('in a replay the start action says Done', startBtn.textContent === 'Done');
  startBtn.click(); await sleep(40);

  ok('the replay has closed', !M.intro.running() && !M.intro.replaying() && !('replay' in document.body.dataset));
  ok('it returns to the stage it was opened from', document.body.dataset.stage === 'section' && state.stage === 'section' && calls.go === 0);
  ok('M.state is untouched, byte for byte', freeze() === before, { before, after: freeze() });
  ok('M.state is the same object, and M.commit is back', M.state === state && calls.commit === 0 && typeof M.commit === 'function' && (M.commit(), calls.commit === 1));
  ok('the visitor\'s twigs are back on the tree', JSON.stringify(twigLog.pricing) === JSON.stringify([{ id: 'price', state: 'leaf', grade: 3, kind: 'you' }, { id: 'retainer', state: 'bud', grade: 1, kind: 'you' }]), twigLog.pricing);
  ok('roots, collar, label and camera are back', JSON.stringify(tree.rootCounts) === JSON.stringify({ you: 5, sector: 1, web: 0, assumed: 2 }) && tree.collarOn === 'margin' && tree.label.text === 'The Offer · Sale Value' && tree.pose.preset === 'offer', { r: tree.rootCounts, c: tree.collarOn, l: tree.label, p: tree.pose });
  ok('the overlay is cleared', document.querySelectorAll('.lead-plate').length === 0 && !document.querySelector('#orient-q input'));
  ok('the wheel is the visitor\'s again', /Market, section 2 of 6/.test(wheel.getAttribute('aria-label')) && wheel.querySelectorAll('.seg')[2].dataset.state === 'upcoming', wheel.getAttribute('aria-label'));
  /* Skip tour goes to the notice and the start action, and accepts nothing on the way */
  ok('Skip tour goes to the last slide and leaves the session untouched', await (async () => {
    M.intro.open({ replay: true }); await sleep(30);
    document.getElementById('intro-skip').click(); await sleep(30);
    const at5 = M.intro.slide() === 4 && document.getElementById('orient-save-row').hidden === true && calls.enable === 0;
    document.getElementById('orient-go').click(); await sleep(30);
    return at5 && !M.intro.running() && freeze() === before && document.body.dataset.stage === 'section' && calls.go === 0;
  })());
  ok('Escape also closes a replay, state untouched', await (async () => { M.intro.open({ replay: true }); await sleep(30); document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await sleep(30); return !M.intro.running() && freeze() === before && document.body.dataset.stage === 'section'; })());
  ok('a replay is refused while the page is moving, or at the cutscene', (() => { M.moving = true; const a = M.intro.open({ replay: true }); M.moving = false; M.stage = 'cutscene'; const b = M.intro.open({ replay: true }); M.stage = 'section'; return a === false && b === false; })());

  /* ---- R7: the privacy note ---- */
  const body = document.getElementById('q-body');
  body.innerHTML = '<div class="ui"></div>';
  document.dispatchEvent(new window.CustomEvent('mercer:question', { detail: { id: 'now' } }));
  const note = body.querySelector('.privacy-note');
  ok('the first figure question carries the privacy note, after its instrument', !!note && note.previousElementSibling === body.querySelector('.ui') && note.textContent === 'Mercer sends none of your answers anywhere. The page loads its fonts and its drawing and PDF libraries from Google Fonts, jsDelivr and cdnjs when it opens.', note && note.textContent);
  document.dispatchEvent(new window.CustomEvent('mercer:question', { detail: { id: 'now' } }));
  ok('it is placed once', body.querySelectorAll('.privacy-note').length === 1);
  const again = M.privacyNote(body.querySelector('.ui'), { text: 'Read in this browser.' });
  ok('M.privacyNote(el) rewrites the note that is there', again === note && note.textContent === 'Read in this browser.');

  /* ---- R16: the chip ---- */
  tree.listeners.inspect?.forEach((fn) => fn({ id: 'price', x: 800, y: 300 }));
  const chip = document.getElementById('inspect');
  ok('a tapped leaf opens the chip with M.inspect\'s words', !chip.hidden && chip.querySelector('.in-title').textContent === 'Sale Value' && chip.querySelector('.in-words').textContent === '£1,800' && chip.querySelector('.src').dataset.from === 'you');
  chip.querySelector('.in-change').click();
  ok('Change calls M.reopen and closes the chip', calls.reopen === 1 && chip.hidden);
  ok('the tree tools show when the tree can zoom', document.getElementById('tree-tools').hidden === false);
  ok('nothing here changed M.state either', freeze() === before);

  console.log(`\n${pass} passed, ${fail} failed, ${errors.length} page errors`);
  errors.forEach((e) => console.log(e.slice(0, 600)));
  process.exit(fail || errors.length ? 1 : 0);
})();
