/* shell (final pack): Task 02's header and layout regions, Task 04's five slides and their controls, Task 06's life
   without moving the task, Task 07's chunked Help and the in-page About TMA.
   jsdom (scratchpad/labtest) with intro.js, help.js and about.js only; M is a stub that records every call, and its
   renderQuestion is the worst instrument there could be: it writes M.state and calls M.commit on every input. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM = null;
for (const at of [path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'), 'jsdom']) { try { ({ JSDOM } = require(at)); break; } catch (e) { /* next */ } }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass += 1; console.log('  ok  ', name); } else { fail += 1; console.log('  FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============ the files, read as text: what no browser is needed for ============ */
const html = src('index.html'), scene = src('scene.css'), base = src('base.css'), help = src('help.js'), intro = src('intro.js'), about = src('about.js');

/* ---- Task 02: the header is attached to the app shell, not to a content panel ---- */
{
  const openTag = /<header id="top"[^>]*>/.exec(html);
  ok('the header is one element, with a banner role', openTag && (html.match(/<header id="top"/g) || []).length === 1 && /role="banner"/.test(openTag[0]));
  // it stands at the page's top level: not inside the clearing, the homepage, the slides or the plan
  const before = html.slice(0, html.indexOf('<header id="top"'));
  const opened = (before.match(/<section\b/g) || []).length - (before.match(/<\/section>/g) || []).length;
  const openedMain = (before.match(/<main\b/g) || []).length - (before.match(/<\/main>/g) || []).length;
  ok('the header is outside every content panel that moves', opened === 0 && openedMain === 0, { opened, openedMain });
  ok('the TMA mark is the header\'s first child and the controls its last', /<header id="top"[^>]*>\s*<span class="wordmark" id="wordmark"/.test(html) && /<div id="switches">[\s\S]*?<\/div>\s*<\/header>/.test(html));
  ok('the header is fixed to the viewport, over everything, on one centre line', /#top \{[^}]*position: fixed[^}]*top: 0[^}]*z-index: 4/.test(scene) && /#top \{[^}]*align-items: center/.test(scene));
  ok('no stage rule hides or moves the header', !/data-stage[^{]*#top\b/.test(scene) && !/#top[^{]*\{[^}]*position: (absolute|static|relative)/.test(scene));
  ok('the header does not set its own height from --header-h (that would feed the measurement back)', !/#top \{[^}]*min-height: var\(--header-h\)/.test(scene));
  ok('the five regions are named once, with their own tokens', ['--header-h', '--region-side', '--region-top', '--clearing-w', '--keep-right', '--tree-left'].every((t) => new RegExp(`${t}:`).test(scene)));
  ok('every region under the header reserves its band', /#clearing \{[^}]*padding: var\(--region-top\)/.test(scene) && /#arrival, #intro \{[^}]*padding: var\(--region-top\)/.test(scene));
  ok('the tags layer is masked out of the question region, which stands at the right (the cockpit brief, 3.1)', /#stage \.tree-tags \{[\s\S]*?--keep-fade: linear-gradient\(to right, #000 0, #000 calc\(var\(--keep-right\) - 28px\), transparent var\(--keep-right\)\)/.test(scene) && /#stage \.tree-tags \{[\s\S]*?mask-image: var\(--keep-fade\)/.test(scene));
  ok('the phone stacks the regions and masks the other way round', /--keep-bottom: 52vh/.test(scene) && /--keep-fade: linear-gradient\(to bottom, #000 0, #000 calc\(var\(--keep-bottom\) - 28px\), transparent var\(--keep-bottom\)\)/.test(scene));
  ok('--keep-bottom is declared on :root, so the measured value can win', /:root \{ --keep-bottom: 52vh/.test(scene) && !/\.tree-tags \{[^}]*--keep-bottom:/.test(scene));
  ok('help.js measures the header and the question region and writes both back', /setProperty\('--header-h'/.test(help) && /setProperty\('--keep-right'/.test(help) && /setProperty\('--keep-bottom'/.test(help));
  ok('the question region is measured from whichever host is on screen', /QUESTION_HOSTS = \['#clearing', '#intro', '#arrival', '#example-panel'\]/.test(help));
  ok('long options, currencies and company names take space rather than shrinking', !/\.glass \{[^}]*white-space: nowrap/.test(base) && !/\.stone \{[^}]*white-space: nowrap/.test(base) && /#label, \.tree-tags \.tag, body > \.tag \{[^}]*max-width: min\(26ch, 30vw\)/.test(base));
  ok('320 gets an essential reflow, not smaller text', /@media \(max-width: 380px\)/.test(scene) && /#topnav \{ order: 3; flex-basis: 100%/.test(scene));
}

/* ---- Task 04, cut on Declan Murphy's note of 28 September: one page first, the tour on request ---- */
{
  const slides = [...html.matchAll(/<article class="slide" id="slide-(\d)"/g)].map((m) => m[1]);
  ok('four slides stand in the page: the one the first run plays, and the three of the tour', slides.join('') === '1234', slides);
  ok('slides 2 to 4 start hidden, so one slide shows at a time', (html.match(/<article class="slide" id="slide-\d" data-slide="\d" hidden>/g) || []).length === 3);
  ok('the first run plays slide 1 alone; the tour (2 to 4) is the replay deck', /TOUR_ONLY = new Set\(\['slide-2', 'slide-3', 'slide-4'\]\)/.test(intro) && /setDeck\(false\);/.test(intro) && /setDeck\(true\); \/\/ a reader who asks for the replay/.test(intro));
  ok('the count is not printed on a deck of one', /id="intro-count"[^>]*hidden>/.test(html) && /countEl\.hidden = N < 2/.test(intro));
  ok('the controls are Back, Continue and Skip tour', /id="intro-back"/.test(html) && /id="intro-go">Continue</.test(html) && /id="intro-skip">Skip tour</.test(html));
  ok('the reader can reveal every phrase at once', /id="intro-all" hidden>Show all text</.test(html) && /function revealAll\(/.test(intro));
  ok('the reveal is by phrase, never letter by letter', /function splitPhrases\(el\)/.test(intro) && /span class="ph"/.test(intro) && intro.includes('(?<=[.:;?])') && !/charAt\(i\)/.test(intro));
  ok('nothing auto-advances: only a press moves a slide', !/setTimeout\([^)]*\bnext\b/.test(intro) && !/setInterval/.test(intro));
  ok('the disclaimer, the method link and the privacy statements are shut inside one drawer on slide 1, once each', (html.match(/id="intro-disclaimer"/g) || []).length === 1 && (html.match(/id="orient-method"/g) || []).length === 1 && (html.match(/id="orient-save"/g) || []).length === 1 && (html.match(/id="orient-go"/g) || []).length === 1 && html.indexOf('id="privacy-drawer"') > html.indexOf('id="slide-1"') && html.indexOf('id="privacy-drawer"') < html.indexOf('id="slide-2"') && html.indexOf('id="intro-disclaimer"') > html.indexOf('id="privacy-drawer"'));
  ok('the drawer is a native disclosure, shut on arrival', /<details class="drawer" id="privacy-drawer">/.test(html) && !/id="privacy-drawer"[^>]*\sopen/.test(html) && /<summary>Privacy, and what this page does<\/summary>/.test(html));
  ok('the sample data is mounted through the sandbox, never the live state', /function sandbox\(fn, box\)/.test(intro) && /M\.commit = \(\) => \{\};/.test(intro) && /odemo = makeDemo\(qh, null\)/.test(intro));
  ok('no timing promise and no "Next"', !/fifteen minutes|15 minutes|takes about/i.test(html) && !/>Next</.test(html));
}

/* ---- Task 06: life without moving the task ---- */
{
  ok('the halo is a frame, held on the tree, with no number or scale', /#halo \{/.test(scene) && /body\[data-halo\] #halo/.test(scene) && /function placeHalo\(/.test(help) && !/score/i.test(scene.slice(scene.indexOf('#halo {'), scene.indexOf('#halo {') + 600).replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('the halo comes in with the tree slide and stays through questioning and the results', /JOURNEY_HALO = \['roots', 'section', 'close', 'explore', 'harvest', 'plan', 'ready'\]/.test(intro) && /if \(i >= 1\) \{\s*halo\(true\);/.test(intro));
  ok('the pointer depth moves decorative layers only, a few pixels, on a fine pointer', /\(hover: hover\) and \(pointer: fine\)/.test(scene) && /#ground \{ transform: translate3d\(calc\(var\(--px\) \* 6px\)/.test(scene) && /#halo \{ transform: translate3d\(calc\(var\(--px\) \* -4px\)/.test(scene) && !/#clearing \{[^}]*transform: translate3d/.test(scene));
  ok('touch gets press and focus response, with no hover dependency', /\.glass:active, \.stone:active, \.choice-card:active/.test(base) && /@media \(hover: none\)/.test(base));
  ok('the active progress segment wakes once on a stage change, then settles', /@keyframes seg-wake/.test(scene) && /#wheel\[data-wake="1"\] \.seg\[data-state="active"\] \.seg-track \{ animation: seg-wake 900ms/.test(scene) && /function wakeSegment\(/.test(help));
  ok('reduced motion gets a static equivalent', /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,700}#ground, #halo \{ transform: none/.test(scene) && /#wheel\[data-wake="1"\] \.seg\[data-state="active"\] \.seg-track \{ animation: none/.test(scene));
  ok('decorative animation suspends on a tab nobody is looking at', /body\[data-away\] #halo, body\[data-away\] #ground/.test(scene) && /doc\.body\.dataset\.away = '1'/.test(help));
  ok('the route buttons keep their label and reveal a short descriptor', /id="route-owner"[^>]*><b>I run a business<\/b><span class="card-more-word">Diagnose · Decide · Act<\/span>/.test(html) && /id="route-starter"[^>]*><b>I don't run a business yet<\/b><span class="card-more-word">Discover · Shape · Launch<\/span>/.test(html));
  ok('the descriptor reserves its space, so a press target never moves', /\.choice-card > \.card-more-word \{\s*opacity: 0; transition: opacity/.test(base) && /\.choice-card:hover > \.card-more-word,[\s\S]{0,200}\.choice-card:focus-visible > \.card-more-word/.test(base));
  ok('restrained edge light: one hairline, no blur and no shadow under the paper', /\.plate, \.mercer-panel \{ --edge: [^}]*box-shadow: inset 0 1px 0 var\(--edge\)/.test(base) && !/box-shadow:[^;]*\dpx\s+\dpx/.test(base.replace(/\/\*[\s\S]*?\*\//g, '').replace(/inset [^;]*/g, '')));
}

/* ---- Task 07: About TMA invents nothing and never leaves the page ---- */
{
  ok('About TMA is a panel in this page, opened by a button', /<dialog id="about-panel"/.test(html) && /<button[^>]*id="about-tma"[^>]*aria-controls="about-panel"/.test(html) && !/id="about-tma"[^>]*href=/.test(html));
  ok('it offers Return to my plan', /id="about-back">Return to my plan</.test(about));
  ok('nothing in it navigates away from the session', !/location\s*=|location\.href|location\.assign|location\.replace/.test(about) && (about.match(/target="_blank"/g) || []).length === 1 && /rel="noopener"/.test(about));
  const aboutCode = about.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/[^\n]*/gm, '');
  ok('it reads and writes nothing in the session', !/M\.state/.test(aboutCode) && !/M\.commit/.test(aboutCode) && !/M\.save/.test(aboutCode));
  ok('the founder note invents no achievement, affiliation or biography', !/award|founded in|years of experience|clients|featured in|worked with|ex-|veteran|expert|leading/i.test(about.replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('the mission is the approved wording', about.includes('TMA helps people turn their ambitions into businesses and systems that work.') && about.includes('TMA can work with you on the systems and routes to customers it needs.'));
  ok('help is chunked into the four headings', /head: 'Using Mercer'/.test(help) && /head: 'Your tree'/.test(help) && /head: 'Your information'/.test(help) && /head: 'Saving and downloads'/.test(help) && !/head: '(How to answer|The colours|Moving the tree)'/.test(help));
  ok('one explanation is open at a time', /function openGroup\(id\)/.test(help) && /const on = s\.id === `help-\$\{id\}`;/.test(help));
  ok('the older section names still find their heading', /GROUP_FOR = \{ privacy: 'info'/.test(help));
}

if (!JSDOM) { console.log(`\n${pass} passed, ${fail} failed (SKIP: jsdom not found, so the page was not run)`); process.exit(fail ? 1 : 0); }

/* ============ the page, run ============ */
function page(opts = {}) {
  const doc = src('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(doc, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://mercer.test/' });
  const { window } = dom;
  const { document } = window;
  window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q) || (opts.phone && /max-width: 720px/.test(q)), addEventListener() {}, addListener() {} });
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));
  const calls = { go: [], commit: 0, enable: 0, disable: 0, demoSawRealState: false, halo: [] };
  const state = { stage: 'section', section: 'customers', route: 'owner', biz: 'Rowan Joinery', draft: 'half a sen', price: 1800, notSure: new Set(['margin']), asked: ['biz', 'price'] };
  const freeze = () => JSON.stringify(state, (k, v) => (v instanceof Set ? ['<set>', ...v] : v));
  const tree = {
    planted: true, rootCounts: { you: 4 }, collarOn: null, pose: { preset: 'section', at: { x: 0.7, y: 0.6 } }, label: null, listeners: {},
    branches: new Map(['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'].map((id) => [id, { stub: false, fill: 1, twigs: [] }])),
    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); },
    frame(p) { this.pose = { preset: typeof p === 'string' ? p : this.pose.preset, at: this.pose.at }; },
    playIntro() { return Promise.resolve(); }, toSeed() {},
    setTwigs() {}, setStub() {}, setLimbFill() {}, showPart() {}, setTheme() {}, setRootSources(c) { this.rootCounts = { ...c }; },
    setCollar() {}, setLabel() {}, anchor() { return { x: 900, y: 400, inView: true }; }, zoomBy() {}, fit() {},
  };
  const save = { on: false, restored: false, has: () => false, enable() { calls.enable += 1; save.on = true; return true; }, disable() { calls.disable += 1; save.on = false; }, forget() {}, line: () => 'x' };
  const M = (window.Mercer = {
    state, tree, moving: false, save, stage: 'section',
    go(s) { calls.go.push(s); },
    titleCase: (s) => s,
    commit() { calls.commit += 1; },
    inspect: () => ({ title: 'Sale Value', words: '£1,800', source: 'Your answer', canChange: true }),
    reopen() {},
    progress: () => ['Aim', 'Foundations', 'Customers', 'Delivery', 'Leverage', 'Plan'].map((n, i) => ({ id: n.toLowerCase(), name: n, hue: '--sec-crown', share: 1 / 6, done: i < 2 ? 1 : 0, state: i < 2 ? 'done' : i === 2 ? 'active' : 'upcoming' })),
    renderQuestion(id, host) {
      if (window.Mercer.state === state) calls.demoSawRealState = true;
      host.innerHTML = '<div class="ui"><input><div class="rail"><i class="handle"></i></div></div>';
      const inp = host.querySelector('input');
      inp.addEventListener('input', () => { window.Mercer.state.price = Number(inp.value.replace(/\D/g, '')); window.Mercer.commit('price'); });
      return { destroy() { window.Mercer.state.price = null; } };
    },
  });
  document.body.dataset.stage = 'section';
  document.body.dataset.mode = 'light';
  document.body.dataset.clearing = opts.phone ? 'bottom' : 'left';
  ['intro.js', 'help.js', 'about.js'].forEach((f) => { try { window.eval(src(f)); } catch (e) { errors.push(`${f}: ${e.stack}`); } });
  return { window, document, M, state, calls, tree, save, errors, freeze };
}

(async () => {
  const allErrors = [];

  /* ---- Task 07: About TMA opens, says its piece, and returns to the plan with nothing lost ---- */
  {
    const p = page();
    const { document, M, calls, window } = p;
    const before = p.freeze();
    const openBtn = document.getElementById('about-tma'), panel = document.getElementById('about-panel');
    openBtn.focus();
    openBtn.click();
    ok('About TMA opens a panel over the page', panel.hasAttribute('open') && openBtn.getAttribute('aria-expanded') === 'true');
    ok('the stage under it did not move', document.body.dataset.stage === 'section' && calls.go.length === 0);
    const heads = [...panel.querySelectorAll('h3')].map((el) => el.textContent);
    ok('it says what TMA is for, who runs it and what it can help implement', JSON.stringify(heads) === JSON.stringify(['What TMA is for', 'Who runs it', 'What TMA can help implement']), heads);
    ok('it names the person who takes the calls', /Adam Attia/.test(panel.textContent));
    ok('it registers as an overlay, so nothing else stands over it', M.overlay.top() === 'about');
    ok('Return to my plan is the way back', !!panel.querySelector('#about-back') && panel.querySelector('#about-back').textContent === 'Return to my plan');
    panel.querySelector('#about-back').click();
    if (typeof panel.close !== 'function') panel.dispatchEvent(new window.Event('close'));
    ok('it closes and the plan is exactly as it was', !panel.hasAttribute('open') && p.freeze() === before && document.body.dataset.stage === 'section' && calls.go.length === 0);
    ok('focus returns to what opened it', document.activeElement === openBtn && openBtn.getAttribute('aria-expanded') === 'false');
    // Escape is the same door
    openBtn.click();
    panel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    if (typeof panel.close !== 'function') panel.dispatchEvent(new window.Event('close'));
    ok('Escape returns too, with the session untouched', !panel.hasAttribute('open') && p.freeze() === before);
    allErrors.push(...p.errors);
  }

  /* ---- Task 04: the five slides and their controls, over a live session ---- */
  {
    const p = page();
    const { document, M, calls } = p;
    const before = p.freeze();
    ok('the deck is not running until it is asked for', M.intro.running() === false);
    M.intro.open({ replay: true });
    await sleep(30);
    const go = document.getElementById('intro-go'), back = document.getElementById('intro-back');
    const count = document.getElementById('intro-count'), skip = document.getElementById('intro-skip');
    const start = document.getElementById('orient-go');
    // a replay is where the tour lives now (28 September): four slides, the first run's page and the three of the tour
    ok('it opens at slide 1, with Back off', M.intro.slide() === 1 && count.textContent === '1 of 4' && back.disabled === true);
    const caps = [];
    for (let i = 1; i <= 4; i += 1) {
      const shown = [...document.querySelectorAll('#intro .slide')].filter((s) => !s.hidden);
      ok(`slide ${i} is the only one shown`, shown.length === 1 && shown[0].id === `slide-${i}`);
      caps.push(shown[0].querySelector('.slide-cap').textContent.trim());
      ok(`slide ${i} counts itself plainly`, count.textContent === `${i} of 4`);
      if (i < 4) { go.click(); await sleep(40); }
    }
    ok('the four messages are Purpose, Your tree, Your answers, Your result', /^Find what is holding/.test(caps[0]) && caps[1] === 'This is your tree.' && caps[2] === 'Each answer makes the plan more useful.' && caps[3] === 'See your next move.', caps);
    ok('the last slide swaps Continue and Skip tour for the start action', go.hidden === true && skip.hidden === true && start.hidden === false);
    ok('nothing advanced on its own: the reader pressed every time', M.intro.slide() === 4 && calls.go.length === 0);
    back.click(); await sleep(30);
    ok('Back returns a slide', M.intro.slide() === 3 && document.getElementById('slide-3').hidden === false);
    ok('the sample result is marked Example and nothing in it reached the session', document.querySelector('#slide-result .example-tag').textContent === 'Example' && p.freeze() === before && calls.commit === 0);
    // Show all text ends the reveal at once, and Continue never waited on it
    M.slides.revealAll();
    ok('Show all text turns every phrase on at once', [...document.querySelectorAll('#slide-4 .ph')].every((el) => el.classList.contains('on')));
    // Skip tour goes to the notice, accepting nothing
    M.slides.go(1); await sleep(20);
    skip.click(); await sleep(30);
    ok('Skip tour goes to the last slide and accepts nothing on the reader\'s behalf', M.intro.slide() === 4 && calls.enable === 0 && calls.commit === 0 && p.freeze() === before);
    ok('a replay does not offer the device-saving choice again', document.getElementById('orient-save-row').hidden === true);
    start.click(); await sleep(40);
    ok('Done closes the replay and leaves the session byte for byte as it was', !M.intro.running() && p.freeze() === before && document.body.dataset.stage === 'section' && calls.go.length === 0);
    ok('the slides left nothing behind', !('slide' in document.body.dataset) && !('replay' in document.body.dataset) && document.querySelectorAll('.lead-plate').length === 0);
    allErrors.push(...p.errors);
  }

  /* ---- Task 02: the header stands in the same place on every stage ---- */
  {
    const p = page();
    const { document, M, window } = p;
    const top = document.getElementById('top');
    const stages = ['arrival', 'orient', 'roots', 'section', 'close', 'explore', 'harvest', 'plan'];
    const seen = [];
    stages.forEach((s) => {
      document.body.dataset.stage = s;
      M.stage = s;
      document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: s, section: null } }));
      seen.push({
        stage: s,
        parent: top.parentElement.tagName,
        first: top.firstElementChild.id,
        last: top.lastElementChild.id,
        inPanel: !!top.closest('#clearing, #arrival, #intro, #plan, #example-panel'),
        hidden: top.hidden,
      });
    });
    ok('the header keeps its parent, its first and last child, and is never inside a panel', seen.every((x) => x.parent === 'BODY' && x.first === 'wordmark' && x.last === 'switches' && !x.inPanel && !x.hidden), seen.filter((x) => x.parent !== 'BODY' || x.inPanel || x.hidden));
    ok('the mark and the controls sit in one row that every stage shares', document.getElementById('wordmark').parentElement === top && document.getElementById('switches').parentElement === top);
    // the regions the shell publishes
    const R = M.shell.regions();
    ok('the shell publishes the header, question and tree regions', R.header && R.question && R.tree && R.header.bottom >= 44);
    ok('the question region and the tree region do not overlap', R.tree.left >= R.question.right || R.question.left >= R.tree.right || R.tree.top >= R.question.bottom, R);
    ok('the halo follows the journey and is off before it', (() => {
      document.body.dataset.stage = 'arrival';
      document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'arrival' } }));
      const offAtArrival = !('halo' in document.body.dataset);
      document.body.dataset.stage = 'section';
      document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'section' } }));
      return offAtArrival && document.body.dataset.halo === '1';
    })());
    allErrors.push(...p.errors);
  }

  /* ---- Task 02: the phone stacks the regions ---- */
  {
    const p = page({ phone: true });
    const { M, document } = p;
    document.body.dataset.stage = 'section';
    M.shell.measure();
    const R = M.shell.regions();
    ok('on the phone the tree is above the question, not beside it', R.tree.bottom <= R.question.top && R.tree.left === R.question.left, R);
    allErrors.push(...p.errors);
  }

  console.log(`\n${pass} passed, ${fail} failed, ${allErrors.length} page errors`);
  allErrors.forEach((e) => console.log(String(e).slice(0, 600)));
  process.exit(fail || allErrors.length ? 1 : 0);
})();
