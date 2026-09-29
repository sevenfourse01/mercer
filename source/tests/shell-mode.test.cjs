/* shell (refine 1, rebuild 1): the theme is chosen before first paint (R2, C14), the cache key, the ids, the tokens, the
   markup of the rebuilt shell (R11, R12, R14, R6). Plain node: the two inline scripts are lifted out of index.html and run
   against stubs. No framework. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass += 1; console.log('  ok  ', name); } else { fail += 1; console.log('  FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };

const html = read('index.html');
const head = html.slice(0, html.indexOf('</head>'));
const bodyAt = html.indexOf('<body data-stage');
const headScript = (head.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
const afterBody = html.slice(bodyAt);
const firstInBody = afterBody.slice(afterBody.indexOf('>') + 1).trimStart();
const bodyScript = (firstInBody.match(/^<script>([\s\S]*?)<\/script>/) || [])[1] || '';

/* ---- where the scripts stand ---- */
ok('an inline script stands in <head>', headScript.length > 0);
ok('it comes before every stylesheet', head.indexOf('<script>') > -1 && head.indexOf('<script>') < head.indexOf('rel="stylesheet"'));
ok('it reads the stored mode', /localStorage\.getItem\('mercer-mode'\)/.test(headScript));
ok('it writes data-mode', /data-mode/.test(headScript));
ok('the first thing in <body> is the script that hands the mode to body', bodyScript.length > 0 && /document\.body\.setAttribute\('data-mode'/.test(bodyScript));

/* ---- what they do ---- */
function run({ stored, throws, theme, systemDark }) {
  const attrs = {}; if (theme) attrs['data-theme'] = theme;
  const bodyAttrs = {};
  const el = (bag) => ({ getAttribute: (k) => (k in bag ? bag[k] : null), setAttribute: (k, v) => { bag[k] = String(v); } });
  const document = { documentElement: el(attrs), body: el(bodyAttrs) };
  const window = { matchMedia: (q) => ({ matches: /dark/.test(q) ? !!systemDark : !systemDark }) };
  const localStorage = { getItem: (k) => { if (throws) throw new Error('blocked'); return k === 'mercer-mode' ? stored ?? null : null; } };
  const ctx = vm.createContext({ document, window, localStorage });
  vm.runInContext(headScript, ctx);
  const onHtml = attrs['data-mode'];
  vm.runInContext(bodyScript, ctx);
  return { onHtml, onBody: bodyAttrs['data-mode'] };
}
let r = run({ stored: 'dark', systemDark: false });
ok('stored dark wins over a light system', r.onHtml === 'dark' && r.onBody === 'dark', r);
r = run({ stored: 'light', systemDark: true, theme: 'dark' });
ok('stored light wins over a dark host and system', r.onHtml === 'light' && r.onBody === 'light', r);
r = run({ stored: null, systemDark: true });
ok('nothing stored: the system setting decides (dark)', r.onBody === 'dark', r);
r = run({ stored: null, systemDark: false });
ok('nothing stored: the system setting decides (light)', r.onBody === 'light', r);
r = run({ stored: null, systemDark: true, theme: 'light' });
ok('nothing stored: the host hint wins over the system', r.onBody === 'light', r);
r = run({ throws: true, systemDark: true });
ok('blocked storage does not throw and falls back', r.onBody === 'dark', r);
r = run({ stored: 'sepia', systemDark: false });
ok('a stored value that is not a mode is ignored', r.onBody === 'light', r);

/* ---- the tokens follow the mode on every stage ---- */
const css = read('base.css');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
ok('no token block is keyed on a stage', !/body\[data-stage="[^"]+"\][^{]*\{[^}]*--(ink|sky-base)\s*:/.test(rules));
ok('--sec-control stands in all five token blocks', (rules.match(/--sec-control:\s*#[0-9A-Fa-f]{6}/g) || []).length === 5);
['--action', '--attention', '--error'].forEach((t) => ok(`${t} stands in all five token blocks (R23)`, (rules.match(new RegExp(`${t}:\\s*#[0-9A-Fa-f]{6}`, 'g')) || []).length === 5));
ok('the filled control is emerald, not the section tint (R23)', /\.glass\.glass-on, \.glass-on \{ background: var\(--action\)/.test(rules));
ok('body[data-tint="--sec-control"] is wired', /body\[data-tint="--sec-control"\]/.test(rules));
const app = read('app.js');
ok('flow still writes body[data-mode] (what base.css reads)', /document\.body\.dataset\.mode\s*=\s*mode/.test(app));

/* ---- the cache key and the page ---- */
const local = [...html.matchAll(/(?:src|href)="([^"#:]+?\.(?:js|css))(\?[^"]*)?"/g)].map((m) => ({ file: m[1], q: m[2] || '' }));
ok('every local file carries the one cache key', local.length >= 30 && local.every((x) => x.q === local[0].q), local.filter((x) => x.q !== local[0].q));
const BRAIN = ['plan.js', 'starter.js', 'model.js'];
const missing = local.filter((x) => !fs.existsSync(path.join(ROOT, x.file)));
ok('every local file exists (the brain\'s three may still be on their way)', missing.every((x) => BRAIN.includes(x.file)), missing);
if (missing.length) console.log('  note  pending from brain:', missing.map((x) => x.file).join(', '));
const order = local.map((x) => x.file);
ok('plan.js, starter.js and model.js load after research.js and before canopy.js', order.indexOf('research.js') < order.indexOf('plan.js') && order.indexOf('plan.js') < order.indexOf('starter.js') && order.indexOf('starter.js') < order.indexOf('model.js') && order.indexOf('model.js') < order.indexOf('canopy.js'), order);
ok('help.js loads after intro.js', html.indexOf('help.js?v=') > html.indexOf('intro.js?v=') && html.indexOf('intro.js?v=') > -1);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
ok('no id twice', new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i));
['help', 'help-panel', 'tree-tools', 'inspect', 'veil', 'ground', 'back', 'unsure', 'next', 'wheel', 'wheel-panel', 'arrival', 'route-owner', 'route-starter', 'example', 'resume', 'restart', 'intro', 'slide-1', 'slide-4', 'privacy-drawer', 'intro-go', 'intro-back', 'intro-skip', 'intro-all', 'intro-count', 'orient-go', 'orient-save', 'about-panel', 'halo', 'plan', 'hv-md', 'hv-pdf', 'hv-call', 'hv-agent', 'hv-json', 'hv-private', 'agent', 'tree-expand', 'tree-close', 'mercer-go', 'about-tma', 'example-panel', 'biz'].forEach((id) => ok(`#${id} is on the page`, ids.includes(id)));
['na', 'ring', 'harvest', 'begin', 'orient', 'orient-back'].forEach((id) => ok(`#${id} is gone`, !ids.includes(id)));

/* ---- the copy on the page (R12, R24, R15) ---- */
ok('the homepage carries TMA\'s line', html.includes('Put your ambition to work.') && html.includes('TMA helps you start a business or make yours work better, with AI and systems built around you.'));
ok('the Mercer panel carries its lines', html.includes('Find your next move. Leave with a plan.') && html.includes('Do you own or run a business?') && html.includes('>I run a business<') && html.includes('>I don\'t run a business yet<') && html.includes('Explore an example') && html.includes('Continue your plan') && html.includes('Start again'));
ok('About TMA opens a panel in this page, never a link away from the session (Task 07)', /<button[^>]*id="about-tma"[^>]*aria-controls="about-panel"/.test(html) && !/id="about-tma"[^>]*href=/.test(html));
ok('no timing promise', !/fifteen minutes|15 minutes/i.test(html) && !/fifteen minutes|15 minutes/i.test(read('intro.js')) && !/fifteen minutes|15 minutes/i.test(read('help.js')));
ok('the foot row says Continue, and no control says Next', /id="next">Continue</.test(html) && !/>Next</.test(html) && !/'Next'/.test(read('intro.js')));
ok('slide 5 has one start action, the save switch and the method link, each once (Task 04)', (html.match(/id="orient-go"/g) || []).length === 1 && (html.match(/id="orient-save"/g) || []).length === 1 && /role="switch"/.test(html) && (html.match(/id="orient-method"/g) || []).length === 1);
ok('slide 5 carries the three statements', ['Your plan is built from your answers and the assumptions Mercer states.', 'Results are not guaranteed.', 'You choose whether to send a brief to TMA for review.'].every((s) => html.includes(s)));
ok('Your plan is the visible label (the heading canopy adopts)', /id="hv-title">Your plan</.test(html));
ok('the business name is not asked on the homepage (the input stays, unseen)', /<input id="biz"[^>]*hidden>/.test(html) && !/Your business name/.test(html));
ok('the wheel is a button with an accessible name, and the header has no ring', /<button type="button" id="wheel"[^>]*aria-label=/.test(html) && !/class="ring"/.test(html));
const intro = read('intro.js'), help = read('help.js');
const R15 = ['Mercer sends none of your answers anywhere. The page loads its fonts and its drawing and PDF libraries from Google Fonts, jsDelivr and cdnjs when it opens.', 'Ask Claude is optional. If you use it, your briefing goes to the host’s model, after you agree.', 'Downloads are files saved on your device.', 'If you turn on Save on this device, your answers are stored in this browser.'];
ok('the four privacy statements are in intro.js once as M.PRIVACY, and help reads them', R15.every((l) => intro.includes(l)) && /M\.PRIVACY/.test(help));
ok('no claim of tracking or accounts, no "verified"', !/no tracking|no account|verified/i.test(intro) && !/no tracking|no account|verified/i.test(help));
ok('the page carries the first run message and the tour three (Task 04, cut 28 September)', ['This is your tree.', 'Each answer makes the plan more useful.', 'See your next move.'].every((x) => html.includes(x)) && /Find what is holding your business back/.test(html) && !html.includes('Before you begin'));
const mine = ['index.html', 'base.css', 'scene.css', 'intro.js', 'intro.css', 'help.js', 'about.js'];
ok('no em or en dash in a shell file', mine.every((f) => !/[–—]/.test(read(f))), mine.filter((f) => /[–—]/.test(read(f))));
ok('no blur, backdrop-filter or uppercase in a shell stylesheet', ['base.css', 'scene.css', 'intro.css'].every((f) => !/backdrop-filter\s*:|blur\(|text-transform\s*:\s*uppercase/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, ''))));
const scene = read('scene.css');
ok('the clearing is 55% of the width and the veil follows (R23)', /--clearing-w: min\(792px, 55vw\)/.test(scene) && /#clearing \{[^}]*width: var\(--clearing-w\)/.test(scene) && /#veil \{[^}]*width: calc\(var\(--clearing-w\)/.test(scene));
ok('the wheel is 80 px at desktop and 52 px on the phone', /grid-template-columns: auto 80px; grid-template-rows: 80px/.test(read('scene.css')) && /grid-template-columns: 52px; grid-template-rows: 52px/.test(read('scene.css')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
