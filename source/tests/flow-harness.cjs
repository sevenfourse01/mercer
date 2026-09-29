/* the flow owner's test harness (refine 1): the page in jsdom, app.js with or without questions.js, no browser.
   Usage: const H = require('./flow-harness.cjs'); const { M, window, document, ok, done } = H.boot({ questions: true });
   jsdom is the copy the earlier flow harnesses use (scratchpad/labtest). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const JSDOM_AT = [path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'), 'jsdom'];
let JSDOM = null;
for (const at of JSDOM_AT) { try { ({ JSDOM } = require(at)); break; } catch (e) { /* next */ } }
if (!JSDOM) { console.log('SKIP: jsdom not found at', JSDOM_AT[0]); process.exit(0); }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function boot(o = {}) {
  const html = src('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://mercer.test/' });
  const { window } = dom;
  const { document } = window;
  window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q), addEventListener() {}, addListener() {} });
  window.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, finish() {}, playState: 'finished' }; };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.Element.prototype.getBoundingClientRect = function () { return { left: 100, top: 100, width: 320, height: 44, right: 420, bottom: 144 }; };
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
  window.requestIdleCallback = (fn) => setTimeout(fn, 0);
  window.PointerEvent = window.MouseEvent;
  window.Mercer = {};
  if (o.storage) Object.entries(o.storage).forEach(([k, v]) => window.localStorage.setItem(k, v));
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));
  const load = (f) => { try { window.eval(src(f)); } catch (e) { errors.push(`${f}: ${e.stack}`); } };
  // the engine, with every forecast call counted from outside app.js
  window.eval(src('engine.js').replace('var MercerEngine=', 'window.MercerEngine='));
  const spy = { calls: 0, draws: 0 };
  const engine = window.MercerEngine;
  // the engine object is sealed, so the counting copy stands in front of it
  const counted = Object.create(engine);
  Object.defineProperty(counted, 'forecast', { value(...a) { const r = engine.forecast(...a); spy.calls += 1; spy.draws += r.months[0].length; return r; } });
  window.MercerEngine = counted;
  const files = o.questions
    ? ['tree3d.js', 'sectors.js', 'feel.js', 'ghost.js', 'founder.js', 'build.js', 'places.js', 'macro.js', 'app.js', 'questions.js', 'research.js']
    : ['sectors.js', 'places.js', 'macro.js', 'app.js'];
  files.forEach(load);
  const M = window.Mercer;
  let pass = 0, fail = 0;
  const ok = (name, cond, extra) => { if (cond) { pass += 1; console.log('  ok  ', name); } else { fail += 1; console.log('  FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = async () => { await sleep(20); while (M.moving) await sleep(20); await sleep(10); };
  const finish = () => { console.log(`\n${pass} passed, ${fail} failed, ${errors.length} page errors`); errors.forEach((e) => console.log(e.slice(0, 500))); process.exit(fail || errors.length ? 1 : 0); };
  return { M, window, document, ok, sleep, settle, finish, errors, spy, dom };
}
module.exports = { boot, ROOT };
