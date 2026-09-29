/* results-harness.cjs: the jsdom page the results tests share. Plain node + jsdom (read from ../labtest/node_modules), the
   real engine, the real app.js, the real index.html; fetch, XHR and sendBeacon are trapped; every file the page hands to the
   browser is recorded. Exported: { window, document, M, state, saves, clicks, network, errors, blobText, sleep, ok, done } */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const jsdomAt = [path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'), 'jsdom'].find((p) => { try { require.resolve(p); return true; } catch (e) { return false; } });
if (!jsdomAt) { console.log('SKIP: jsdom not found (expected at ../labtest/node_modules/jsdom)'); process.exit(0); }
const { JSDOM } = require(jsdomAt);
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
module.exports = function harness(o = {}) {
  let html = src('index.html').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  if (o.planShell) html = html.replace(/<section id="harvest"[\s\S]*?<\/section>/, '<section id="plan" aria-label="Your plan"></section>'); // the rebuilt shell's empty container
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/' });
  const { window } = dom;
  const { document } = window;
  window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q), addEventListener() {}, addListener() {}, removeEventListener() {} });
  window.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, finish() {}, playState: 'finished' }; };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
  window.requestIdleCallback = (fn) => setTimeout(fn, 0);
  window.PointerEvent = window.MouseEvent;
  const saves = [];
  window.URL.createObjectURL = (blob) => { saves.push(blob); return 'blob:x'; };
  window.URL.revokeObjectURL = () => {};
  const clicks = [];
  window.HTMLAnchorElement.prototype.click = function () { clicks.push(this.download || this.href); };
  const network = [];
  window.fetch = (...a) => { network.push(['fetch', String(a[0])]); return Promise.reject(new Error('no network in tests')); };
  window.XMLHttpRequest = function () { network.push(['xhr']); throw new Error('no network in tests'); };
  window.navigator.sendBeacon = (...a) => { network.push(['beacon', String(a[0])]); return false; };
  const clip = [];
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async (t) => { clip.push(t); } }, configurable: true });
  window.Mercer = {};
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
  const load = (f) => { try { window.eval(src(f)); } catch (e) { errors.push(`${f}: ${e.stack}`); } };
  window.eval(src('engine.js').replace('var MercerEngine=', 'window.MercerEngine='));
  const files = ['tree3d.js', 'sectors.js', 'feel.js', 'ghost.js', 'founder.js', 'build.js', 'places.js', 'data/land110.js', 'app.js', 'map.js', 'questions.js', 'research.js', 'archetypes.js', 'macro.js', 'freetools.js'];
  /* econ.js owns every figure once it lands (final pack D1); canopy reads it with ?. and falls back when it is absent, so it
     is loaded only when the file exists and o.noEcon has not asked for the fallback path to be exercised */
  ['plan.js', 'starter.js', 'model.js'].forEach((f) => { if (fs.existsSync(path.join(ROOT, f))) files.push(f); });
  if (!o.noEcon && fs.existsSync(path.join(ROOT, 'econ.js'))) files.push('econ.js');
  files.push('canopy.js');
  files.forEach(load);
  const M = window.Mercer;
  let pass = 0, fail = 0;
  const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra === undefined ? '' : JSON.stringify(extra, null, 0).slice(0, 500)); } };
  const done = () => { console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); };
  const blobText = (b) => new Promise((res) => { const fr = new window.FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsText(b); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  return { window, document, M, state: M.state, saves, clicks, network, clip, errors, blobText, sleep, ok, done, $, $$, text, src };
};
