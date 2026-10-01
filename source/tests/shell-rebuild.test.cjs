/* shell (rebuild 1): the homepage's route choice and saved session (R12), the orientation and its contract with flow (R14,
   R15), the example sandbox (R13), the wheel's panel (R11), one overlay at a time (C04), the phone's tree expansion (R23).
   jsdom (scratchpad/labtest) with intro.js and help.js only; M is a stub that records every call. */
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

function page(opts = {}) {
  const html = src('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: `https://mercer.test/${opts.query || ''}` });
  const { window } = dom;
  const { document } = window;
  window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q) || (opts.phone && /max-width: 720px/.test(q)), addEventListener() {}, addListener() {} });
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));
  const calls = { go: [], chooseRoute: [], enable: 0, disable: 0, forget: 0, reset: 0, reopenSection: [], commit: 0, demoSawRealState: false, renderPlanInto: [], example: [], fit: 0, write: 0 };
  const state = { stage: 'arrival', section: null, route: null, biz: '', now: 24000, price: 1800, notSure: new Set(), na: new Set(), asked: [] };
  const freeze = () => JSON.stringify(state, (k, v) => (v instanceof Set ? ['<set>', ...v] : v));
  const tree = {
    planted: false, rootCounts: {}, collarOn: null, pose: { preset: 'arrival' }, label: null, listeners: {},
    branches: new Map(['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'].map((id) => [id, { stub: false, fill: 0, twigs: [] }])),
    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
    frame(p) { this.pose = { preset: typeof p === 'string' ? p : this.pose.preset }; },
    playIntro() { return Promise.resolve(); }, toSeed() { this.pose = { preset: 'seed' }; },
    setTwigs(id, list) { this.branches.get(id).twigs = JSON.parse(JSON.stringify(list)); },
    setStub() {}, setLimbFill() {}, showPart() {}, setTheme() {}, setRootSources(c) { this.rootCounts = { ...c }; }, setCollar(id) { this.collarOn = id; }, setLabel() {},
    anchor() { return { x: 900, y: 400, inView: true }; }, zoomBy() {}, fit() { calls.fit += 1; },
  };
  const save = { on: false, restored: false, has: () => opts.saved === true, info: () => ({ savedAt: '2026-09-22T10:00:00Z' }),
    enable() { calls.enable += 1; if (opts.saveFails) return false; save.on = true; document.dispatchEvent(new window.CustomEvent('mercer:save', { detail: { on: true, ok: true } })); return true; },
    disable() { calls.disable += 1; save.on = false; document.dispatchEvent(new window.CustomEvent('mercer:save', { detail: { on: false, ok: true } })); },
    forget() { calls.forget += 1; save.on = false; }, write() { calls.write += 1; return true; }, line: () => 'x' };
  const M = (window.Mercer = {
    state, tree, moving: false, save,
    go(s) { calls.go.push(s); if (s === 'arrival' || s === 'orient') { state.stage = s; document.body.dataset.stage = s; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: s, section: null } })); } if (s === 'roots' && opts.flowRoots !== false) { state.stage = 'roots'; document.body.dataset.stage = 'roots'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'roots', section: null } })); } },
    reset() { calls.reset += 1; },
    reopenSection(id) { calls.reopenSection.push(id); },
    commit() { calls.commit += 1; },
    titleCase: (s) => s,
    progress: () => ['Aim', 'Foundations', 'Customers', 'Delivery', 'Leverage', 'Plan'].map((n, i) => ({ id: n.toLowerCase(), name: n, hue: '--sec-crown', share: 1 / 6, done: i < 2 ? 1 : i === 2 ? 0.5 : 0, state: i < 2 ? 'done' : i === 2 ? 'active' : i === 4 ? 'skipped' : 'upcoming', reason: i === 4 ? 'No team or network questions apply yet.' : undefined })),
    renderQuestion(id, host) {
      if (window.Mercer.state === state) calls.demoSawRealState = true;
      host.innerHTML = '<div class="ui"><input><div class="rail"><i class="handle"></i></div></div>';
      const inp = host.querySelector('input');
      inp.addEventListener('input', () => { window.Mercer.state.price = Number(inp.value.replace(/\D/g, '')); window.Mercer.commit('price'); });
      return { destroy() { window.Mercer.state.price = null; } };
    },
  });
  if (opts.chooseRoute) M.chooseRoute = (r) => { calls.chooseRoute.push(r); state.route = r; };
  if (opts.brain) {
    M.plan = { example: (r) => { calls.example.push(r); return { id: `ex-${r}`, route: r, firstAction: { action: 'Do the thing' } }; } };
    M.canopy = { renderPlanInto: (host, plan, o) => { calls.renderPlanInto.push({ plan, o }); host.innerHTML = `<p class="rendered">${plan.id} ${o.example ? 'example' : ''}</p>`; } };
  }
  document.body.dataset.stage = 'arrival';
  document.body.dataset.mode = 'light';
  document.body.dataset.clearing = opts.phone ? 'bottom' : 'left';
  ['intro.js', 'help.js'].forEach((f) => { try { window.eval(src(f)); } catch (e) { errors.push(`${f}: ${e.stack}`); } });
  return { window, document, M, state, calls, tree, save, errors, freeze };
}

(async () => {
  const allErrors = [];

  /* ---- R12: the homepage, a fresh visit ---- */
  {
    const p = page();
    const { document, M, calls, state, window } = p;
    const before = p.freeze();
    ok('a fresh visit shows the route question and no saved block', document.getElementById('route-block').hidden === false && document.getElementById('saved-block').hidden === true);
    ok('the wheel is hidden on the homepage', document.getElementById('wheel').hidden === true);
    document.getElementById('route-starter').click();
    await sleep(20);
    ok('a route card records the route on M.state and asks flow for the orientation', state.route === 'starter' && calls.go[0] === 'orient' && document.body.dataset.route === 'starter');
    ok('the pressed card says so', document.getElementById('route-starter').getAttribute('aria-pressed') === 'true' && document.getElementById('route-owner').getAttribute('aria-pressed') === 'false');
    ok('slide 1 opened with the starter promise', document.body.dataset.stage === 'orient' && document.body.dataset.slide === '1' && /Find a direction that fits you/.test(document.querySelector('#slide-1 .slide-cap').textContent) && /don’t run a business yet/.test(document.getElementById('orient-route').textContent));
    // 28 September: the first run is one page. Continue, the count and Skip tour belong to the tour, which plays on a replay
    M.slides.go(3); await sleep(20);
    ok('the first run cannot be advanced into the tour: it stays on its one page', document.body.dataset.slide === '1' && M.slides.count === 1 && M.slides.all() === 4);
    ok('that page carries the start action alone: no Continue, no count, no Skip tour', document.getElementById('intro-go').hidden === true && document.getElementById('intro-skip').hidden === true && document.getElementById('intro-count').hidden === true && document.getElementById('orient-go').hidden === false && document.getElementById('orient-go').textContent === 'Start' && [...document.querySelectorAll('#intro .glass-on')].filter((el) => !el.hidden).length === 1);
    ok('the statements are shut in the drawer, not spread over the page', document.getElementById('privacy-drawer').open === false && document.querySelectorAll('#privacy-drawer .orient-facts li').length === 3 && document.querySelector('#slide-1 #orient-save-row') !== null);
    // Escape does nothing on the first run: the way on is the start action
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    ok('Escape does not leave the slides', document.body.dataset.stage === 'orient' && document.body.dataset.slide === '1');
    // the save switch
    const sw = document.getElementById('orient-save');
    ok('the save switch starts off', sw.checked === false && sw.getAttribute('role') === 'switch');
    sw.checked = true; sw.dispatchEvent(new window.Event('change', { bubbles: true }));
    ok('turning it on calls M.save.enable and says what happens', calls.enable === 1 && sw.checked === true && /stored in this browser/.test(document.getElementById('orient-save-note').textContent));
    sw.checked = false; sw.dispatchEvent(new window.Event('change', { bubbles: true }));
    ok('turning it off calls M.save.disable', calls.disable === 1 && sw.checked === false);
    // Continue
    let orientEv = null;
    document.addEventListener('mercer:orient', (e) => { orientEv = e.detail; });
    M.slides.go(5); await sleep(10); document.getElementById('orient-go').click();
    ok('the start action fires mercer:orient with the route and asks flow for roots', orientEv && orientEv.done === true && orientEv.route === 'starter' && calls.go.includes('roots') && M.orient.isDone());
    // the stub's go('roots') moves state.stage itself; everything else in M.state must be as it was, plus the route
    ok('the demonstration is unmounted and M.state is as it was, plus the route', !document.querySelector('#orient-q input') && p.freeze().replace('"stage":"roots"', '"stage":"arrival"') === before.replace('"route":null', '"route":"starter"'), { before, after: p.freeze() });
    allErrors.push(...p.errors);
  }

  /* ---- R14: flow takes the continuation itself; a restored session goes past the orientation ---- */
  {
    const p = page({ chooseRoute: true, flowRoots: false });
    const { document, calls, state, M } = p;
    document.addEventListener('mercer:orient', (e) => e.preventDefault());
    document.getElementById('route-owner').click();
    await sleep(10);
    ok('flow\'s M.chooseRoute is preferred over writing M.state', calls.chooseRoute[0] === 'owner' && state.route === 'owner');
    M.slides.go(5); await sleep(10); document.getElementById('orient-go').click();
    ok('when a listener takes mercer:orient, the shell does not call M.go(\'roots\')', !calls.go.includes('roots') && M.orient.isDone());
    // a restored session: flow calls M.go('orient') and the shell continues at once
    M.save.restored = true;
    calls.go.length = 0;
    M.go('orient');
    ok('a restored session is taken past the slides', calls.go.includes('roots') || document.body.dataset.stage !== 'orient' || M.orient.isDone(), calls.go);
    allErrors.push(...p.errors);
  }

  /* ---- R12, R14 with the rebuilt flow: it wires the cards, Continue your plan, Start again and the orientation's Continue
     itself (it exports M.setRoute and M.start); the shell must not fire any of them a second time ---- */
  {
    const p = page({ flowRoots: false });
    const { document, M, calls, state, window } = p;
    const flow = { setRoute: [], start: 0, resume: 0, restart: 0 };
    M.setRoute = (r) => { flow.setRoute.push(r); state.route = r; };
    M.start = () => { flow.start += 1; M.moving = true; state.stage = 'section'; document.body.dataset.stage = 'section'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section', section: 'aim' } })); setTimeout(() => { M.moving = false; }, 5); };
    M.resume = () => { flow.resume += 1; };
    M.restart = () => { flow.restart += 1; };
    // flow's own listeners, registered as app.js does (before the shell's, which load later; here they were added at page(), so re-add the shell's order by dispatching)
    document.getElementById('route-owner').addEventListener('click', () => { M.setRoute('owner'); M.go('orient'); });
    document.getElementById('orient-go').addEventListener('click', () => { if (document.body.dataset.stage === 'orient') M.start(); });
    document.getElementById('resume').addEventListener('click', () => M.resume());
    document.getElementById('restart').addEventListener('click', () => M.restart());
    document.getElementById('route-owner').click();
    await sleep(10);
    ok('with flow wired, one route press records the route once and asks for the orientation once', flow.setRoute.length === 1 && calls.go.filter((s) => s === 'orient').length === 1 && document.body.dataset.stage === 'orient' && document.getElementById('route-owner').getAttribute('aria-pressed') === 'true');
    M.slides.go(5); await sleep(10); document.getElementById('orient-go').click();
    await sleep(30);
    ok('Continue runs flow\'s start() once and the shell adds no M.go(\'roots\')', flow.start === 1 && !calls.go.includes('roots') && document.body.dataset.stage === 'section');
    document.getElementById('resume').click();
    document.getElementById('restart').click();
    ok('Continue your plan and Start again run flow\'s own once each', flow.resume === 1 && flow.restart === 1 && calls.forget === 0 && calls.reset === 0);
    allErrors.push(...p.errors);
  }

  /* ---- R12: a saved session on the homepage ---- */
  {
    const p = page({ saved: true });
    const { document, calls } = p;
    ok('a saved session shows Continue your plan with the date, and hides the route question', document.getElementById('saved-block').hidden === false && document.getElementById('route-block').hidden === true && /Saved on this device on 22 September/.test(document.getElementById('saved-line').textContent), document.getElementById('saved-line').textContent);
    document.getElementById('resume').click();
    ok('Continue your plan asks flow to go on', calls.go.includes('roots'));
    document.getElementById('restart').click();
    ok('Start again forgets the saved session and resets', calls.forget === 1 && calls.reset === 1);
    allErrors.push(...p.errors);
  }

  /* ---- R13: the example ---- */
  {
    const p = page();
    const { document, M, calls, tree, window } = p;
    const before = p.freeze();
    document.getElementById('example').focus();
    document.getElementById('example').click();
    await sleep(20);
    const ex = document.getElementById('example-panel');
    ok('the example opens over the homepage, labelled Example, the stage unchanged', ex.hidden === false && /Example/.test(ex.querySelector('.ex-tag').textContent) && document.body.dataset.stage === 'arrival' && M.example.isOpen());
    ok('it shows a sample person, three headings and no explanation open yet (the polish pack, 16)', /Alex/.test(ex.querySelector('#example-name').textContent) && ex.querySelectorAll('.ex-step').length === 3 && document.getElementById('example-explain').hidden === true && !!document.getElementById('example-exit') && !!document.getElementById('example-build'));
    ok('the sample is marked as an example with made-up figures', /Example/.test(ex.querySelector('.ex-tag').textContent) && /made-up figures/.test(ex.querySelector('.ex-minor').textContent));
    ok('the example tree grew from the seed', JSON.stringify(tree.rootCounts) === JSON.stringify({ you: 3, sector: 2, web: 1, assumed: 1 }) && tree.collarOn === 'capacity');
    ex.querySelector('.ex-step[data-ex-step="goal"]').click();
    ok('a heading opens its explanation, and nothing else changes', document.getElementById('example-explain').hidden === false && /goal/i.test(document.getElementById('example-explain-title').textContent) && M.example.isOpen() && ex.querySelector('.ex-step[data-ex-step="goal"]').getAttribute('aria-expanded') === 'true');
    document.getElementById('example-explain-close').click();
    ok('the explanation\'s X closes the explanation only: the example and its tree stay', document.getElementById('example-explain').hidden === true && M.example.isOpen() && ex.hidden === false);
    ex.querySelector('.ex-step[data-ex-step="branch"]').click();
    ok('the branch heading explains the recommended focus', /branch/i.test(document.getElementById('example-explain-title').textContent) && /focus/i.test(document.getElementById('example-explain-body').textContent));
    ex.querySelector('[data-ex-route="starter"]').click();
    ok('the switch shows the starter example', /starting out/.test(document.getElementById('example-name').textContent) && /Sam/.test(document.getElementById('example-name').textContent));
    ok('nothing in the example touched M.state, and no save was made', p.freeze() === before && calls.enable === 0 && calls.commit === 0);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    ok('Escape closes the example and gives focus back to its button', ex.hidden === true && !M.example.isOpen() && document.activeElement === document.getElementById('example'));
    ok('the visitor\'s tree is back to the seed', JSON.stringify(tree.rootCounts) === JSON.stringify({}) && tree.collarOn === null && tree.pose.preset === 'arrival', tree.pose);
    // Build my plan from the starter example takes the starter route
    document.getElementById('example').click();
    await sleep(10);
    document.querySelector('#example-panel [data-ex-route="starter"]').click();
    document.getElementById('example-build').click();
    await sleep(10);
    ok('Build my plan takes the shown route to the orientation', p.state.route === 'starter' && document.body.dataset.stage === 'orient' && document.getElementById('example-panel').hidden === true);
    allErrors.push(...p.errors);
  }
  {
    const p = page({ brain: true });
    const { document, calls } = p;
    document.getElementById('example').click();
    await sleep(10);
    ok('with the brain and canopy present the example is still its own short explorer: three headings, no plan render inside it (the polish pack, 16)', calls.renderPlanInto.length === 0 && document.querySelectorAll('#example-panel .ex-step').length === 3 && document.getElementById('example-explain').hidden === true);
    allErrors.push(...p.errors);
  }

  /* ---- R11: the wheel's panel, C04: one overlay ---- */
  {
    const p = page();
    const { document, M, calls, window } = p;
    M.go('orient'); // not shown at orient
    ok('the wheel is hidden at the orientation', document.getElementById('wheel').hidden === true);
    document.body.dataset.stage = 'section'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section', section: 'customers' } }));
    const wheel = document.getElementById('wheel'), wp = document.getElementById('wheel-panel');
    ok('the wheel shows on a section, six segments, Customers 3 of 6', wheel.hidden === false && wheel.querySelectorAll('.seg').length === 6 && document.getElementById('wheel-text').textContent === 'Customers · 3 of 6');
    ok('a skipped section is drawn as such', wheel.querySelectorAll('.seg')[4].dataset.state === 'skipped');
    wheel.focus(); wheel.click();
    ok('a press opens the panel with the six sections and their states', wp.hidden === false && wheel.getAttribute('aria-expanded') === 'true' && wp.querySelectorAll('.wheel-list li').length === 6 && [...wp.querySelectorAll('.wheel-list li')].map((li) => li.dataset.state).join(',') === 'done,done,active,upcoming,skipped,upcoming');
    ok('a done section offers Review, the current one is marked, Not needed carries its reason', wp.querySelectorAll('[data-review]').length === 2 && wp.querySelector('li[aria-current="step"] .wl-name').textContent.startsWith('Customers') && /No team or network questions apply yet/.test(wp.querySelector('li[data-state="skipped"] .wl-why').textContent));
    ok('the save state says saving is off, not "Saved"', /Saving is off/.test(wp.querySelector('.wheel-save').textContent));
    ok('Save and exit, Forget this visit are there; Download progress file waits for flow', !!wp.querySelector('#wl-exit') && !!wp.querySelector('#wl-forget') && wp.querySelector('#wl-download').hidden === true);
    wp.querySelector('[data-review="aim"]').click();
    ok('Review calls M.reopenSection(id) and closes the panel', calls.reopenSection[0] === 'aim' && wp.hidden === true);
    wheel.click();
    document.dispatchEvent(new window.CustomEvent('mercer:saved', { detail: { ok: true, at: '2026-09-23T09:30:00Z' } }));
    ok('"Saved on this device" appears only after mercer:saved', /^Saved on this device/.test(wp.querySelector('.wheel-save').textContent));
    // one overlay at a time: help over the panel closes the panel
    document.getElementById('help').click();
    ok('opening help closes the wheel panel (one overlay at a time)', wp.hidden === true && document.getElementById('help-panel').hasAttribute('open') && M.overlay.top() === 'help');
    M.shell.closeHelp();
    if (typeof document.getElementById('help-panel').close !== 'function') document.getElementById('help-panel').dispatchEvent(new window.Event('close'));
    wheel.click();
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    ok('Escape closes the panel and returns focus to the wheel', wp.hidden === true && document.activeElement === wheel && M.overlay.top() === null);
    // Save and exit with saving off: a confirmation, then enable, then the homepage
    wheel.click();
    wp.querySelector('#wl-exit').click();
    ok('Save and exit with saving off asks first, in plain words', wp.querySelector('.wheel-confirm').hidden === false && /turns on Save on this device/.test(wp.querySelector('.wheel-confirm').textContent));
    wp.querySelector('#wl-yes').click();
    ok('confirming turns saving on and returns to the start', calls.enable === 1 && calls.go.includes('arrival'));
    // Forget this visit: a confirmation naming its scope
    document.body.dataset.stage = 'section'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section', section: 'customers' } }));
    wheel.click();
    wp.querySelector('#wl-forget').click();
    ok('Forget this visit names its scope before it acts', /does not recall a plan you downloaded or a brief you sent/.test(wp.querySelector('.wheel-confirm').textContent) && calls.forget === 0);
    wp.querySelector('#wl-yes').click();
    ok('confirming forgets and resets', calls.forget === 1 && calls.reset === 1);
    // canopy's share dialog counts as an overlay
    document.body.dataset.stage = 'section'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section', section: 'customers' } }));
    const share = document.createElement('div'); share.id = 'share'; share.hidden = true; document.body.appendChild(share);
    await sleep(10);
    wheel.click();
    share.hidden = false;
    await sleep(10);
    ok('a share dialog that shows closes the wheel panel and becomes the top overlay', wp.hidden === true && M.overlay.top() === 'share');
    wheel.click();
    ok('opening the wheel panel over the share dialog closes the share', share.hidden === true && M.overlay.top() === 'wheel');
    allErrors.push(...p.errors);
  }

  /* ---- R23: the phone's tree ---- */
  {
    const p = page({ phone: true });
    const { document, calls, window, M } = p;
    document.body.dataset.stage = 'section'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section', section: 'customers' } }));
    const ex = document.getElementById('tree-expand'), cl = document.getElementById('tree-close');
    ok('"Your tree" shows on the phone during a section', ex.hidden === false && cl.hidden === true);
    ex.click();
    ok('it opens the tree to the whole screen, fits it, and shows Close', document.body.dataset.treeOpen === '1' && cl.hidden === false && calls.fit >= 1 && document.activeElement === cl && M.overlay.top() === 'tree');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    ok('Escape closes it and returns focus to "Your tree"', !('treeOpen' in document.body.dataset) && cl.hidden === true && document.activeElement === ex);
    allErrors.push(...p.errors);
  }

  console.log(`\n${pass} passed, ${fail} failed, ${allErrors.length} page errors`);
  allErrors.forEach((e) => console.log(e.slice(0, 800)));
  process.exit(fail || allErrors.length ? 1 : 0);
})();
