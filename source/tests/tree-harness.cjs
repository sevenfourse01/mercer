// Headless harness for tree3d.js: real three r147 (the local copy), a fake DOM, a fake renderer, a clock we drive.
// make({ w, h, reduce }) -> { tree, GT, doc, win, step(ms), clock(), el(id) }
const fs = require('fs'), path = require('path'), vm = require('vm');
// three r147: MERCER_THREE, else the local copy kept beside the project folder (scratchpad/mercer-round4/vendor)
const THREE_PATH = process.env.MERCER_THREE || [path.join(__dirname, '..', 'vendor', 'three.min.js'), path.join(__dirname, '..', '..', 'mercer-round4', 'vendor', 'three.min.js')].find((f) => fs.existsSync(f));
if (!THREE_PATH) { console.log('SKIP: no local three.min.js (set MERCER_THREE to a copy of three r147)'); process.exit(0); }
const THREE_SRC = fs.readFileSync(THREE_PATH, 'utf8');
const TREE_PATH = path.join(__dirname, '..', 'tree3d.js');

function make(opts = {}) {
  const W = opts.w || 1440, H = opts.h || 900;
  let now = 1000;
  const state = { reduce: !!opts.reduce };
  const byId = {};

  class Style {
    setProperty(k, v) { this[k] = String(v); }
    removeProperty(k) { delete this[k]; }
    getPropertyValue(k) { return this[k] || ''; }
  }
  class El {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.style = new Style();
      this.dataset = {};
      this.attrs = {};
      this._cls = new Set();
      this.listeners = {};
      this._text = '';
      this.clientWidth = 0; this.clientHeight = 0;
      this.offsetWidth = 0; this.offsetHeight = 0;
      const self = this;
      this.classList = {
        add: (...c) => c.forEach((x) => self._cls.add(x)),
        remove: (...c) => c.forEach((x) => self._cls.delete(x)),
        toggle: (c, on) => { if (on === undefined) on = !self._cls.has(c); if (on) self._cls.add(c); else self._cls.delete(c); return on; },
        contains: (c) => self._cls.has(c),
      };
    }
    get parentElement() { return this.parentNode; }
    get className() { return [...this._cls].join(' '); }
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get id() { return this.attrs.id || ''; }
    set id(v) { this.attrs.id = v; byId[v] = this; }
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
    set textContent(v) { this.children.forEach((c) => { c.parentNode = null; }); this.children = []; this._text = String(v == null ? '' : v); }
    get firstChild() { return this.children[0] || null; }
    get isConnected() { let e = this; while (e) { if (e === doc.body) return true; e = e.parentNode; } return false; }
    set innerHTML(html) {
      this.textContent = '';
      const re = /<(\w+)((?:\s+[\w-]+="[^"]*")*)\s*><\/\1>/g;
      let m;
      while ((m = re.exec(String(html)))) {
        const c = new El(m[1]);
        const ar = /([\w-]+)="([^"]*)"/g;
        let a;
        while ((a = ar.exec(m[2]))) c.setAttribute(a[1], a[2]);
        this.appendChild(c);
      }
    }
    appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
    insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; const i = this.children.indexOf(ref); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; }
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    setAttribute(k, v) { if (k === 'class') this.className = v; else if (k === 'id') this.id = v; else { this.attrs[k] = String(v); if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-(\w)/g, (_, ch) => ch.toUpperCase())] = String(v); } }
    removeAttribute(k) { if (k === 'class') this._cls = new Set(); else { delete this.attrs[k]; if (k.startsWith('data-')) delete this.dataset[k.slice(5).replace(/-(\w)/g, (_, ch) => ch.toUpperCase())]; } }
    hasAttribute(k) { return this.attrs[k] !== undefined; }
    contains(o) { let e = o; while (e) { if (e === this) return true; e = e.parentNode; } return false; }
    getAttribute(k) { return k === 'class' ? this.className : this.attrs[k] === undefined ? null : this.attrs[k]; }
    addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
    removeEventListener() {}
    dispatch(ev, e = {}) { const evt = { target: this, stopped: false, prevented: false, stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; }, ...e }; (this.listeners[ev] || []).forEach((fn) => fn(evt)); return evt; }
    focus() { doc.activeElement = this; let e = this; while (e) { (e.listeners.focusin || []).forEach((fn) => fn({ target: this })); e = e.parentNode; } }
    matches(sel) {
      // supports: tag, .class, #id, [attr="v"], [attr] and chains of them (no combinators)
      const parts = sel.match(/(^[\w-]+)|(\.[\w-]+)|(#[\w-]+)|(\[[\w-]+(?:="[^"]*")?\])/g) || [];
      return parts.every((p) => {
        if (p[0] === '.') return this._cls.has(p.slice(1));
        if (p[0] === '#') return this.id === p.slice(1);
        if (p[0] === '[') { const m = /\[([\w-]+)(?:="([^"]*)")?\]/.exec(p); const key = m[1]; const val = key.startsWith('data-') ? this.dataset[key.slice(5).replace(/-(\w)/g, (_, ch) => ch.toUpperCase())] : this.attrs[key]; return m[2] === undefined ? val !== undefined : String(val) === m[2]; }
        return this.tagName === p.toUpperCase();
      });
    }
    closest(sel) { let e = this; while (e) { if (e.matches && e.matches(sel)) return e; e = e.parentNode; } return null; }
    _walk(fn) { for (const c of this.children) { if (fn(c) === true) return true; if (c._walk(fn)) return true; } return false; }
    querySelectorAll(sel) {
      const chain = sel.trim().split(/\s+/); // descendant combinators only
      const out = [];
      this._walk((c) => {
        if (!c.matches(chain[chain.length - 1])) return;
        let e = c.parentNode, i = chain.length - 2;
        while (i >= 0 && e) { if (e.matches(chain[i])) i--; e = e.parentNode; }
        if (i < 0) out.push(c);
      });
      return out;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    getBoundingClientRect() { return { left: this._left || 0, top: this._top || 0, width: this.clientWidth, height: this.clientHeight, right: (this._left || 0) + this.clientWidth, bottom: (this._top || 0) + this.clientHeight }; }
    getClientRects() { return this.isConnected && !this._hidden ? [this.getBoundingClientRect()] : []; }
    setPointerCapture() {}
    getContext(kind) {
      if (kind === '2d') return { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, fillStyle: '', getImageData: () => ({ data: [0, 0, 0, 0] }) };
      return {};
    }
    toDataURL() { return 'data:,'; }
  }

  const doc = {
    currentScript: null,
    hidden: false,
    activeElement: null,
    documentElement: new El('html'),
    body: null,
    head: new El('head'),
    createElement: (t) => new El(t),
    createElementNS: (ns, t) => new El(t),
    getElementById: (id) => { const e = byId[id]; return e && e.isConnected ? e : null; },
    querySelector: (sel) => doc.body.querySelector(sel),
    querySelectorAll: (sel) => doc.body.querySelectorAll(sel),
    addEventListener() {},
  };
  doc.body = new El('body');
  doc.activeElement = doc.body;
  doc.body.dataset.clearing = opts.clearing || (W < 721 ? 'bottom' : 'left');
  const stage = new El('div'); stage.id = 'stage'; stage.setAttribute('aria-hidden', 'true'); stage.clientWidth = W; stage.clientHeight = H;
  doc.body.appendChild(stage);
  if (opts.discsHost !== false) { const d = new El('div'); d.id = 'discs'; d.setAttribute('role', 'group'); doc.body.appendChild(d); }
  if (opts.label !== false) { const l = new El('div'); l.id = 'label'; l.className = 'tag'; l.offsetWidth = opts.labelW || 150; l.offsetHeight = 18; doc.body.appendChild(l); }
  const panel = new El('main'); panel.id = 'clearing'; doc.body.appendChild(panel);
  const eyebrow = new El('div'); eyebrow.id = 'eyebrow'; panel.appendChild(eyebrow);
  const ename = new El('span'); ename.className = 'name'; eyebrow.appendChild(ename);
  const qt = new El('button'); qt.id = 'q-title'; panel.appendChild(qt);

  const win = {
    innerWidth: W, innerHeight: H, devicePixelRatio: 1,
    matchMedia: () => ({ get matches() { return state.reduce; } }),
    Mercer: {},
    addEventListener() {},
  };
  const ctx = {
    window: win, document: doc, console,
    performance: { now: () => now },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout: (fn, ms) => { timers.push({ at: now + (ms || 0), fn }); return timers.length; },
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].fn = null; },
    getComputedStyle: () => ({ getPropertyValue: () => '', backgroundColor: '' }),
    CSS: { escape: (s) => String(s).replace(/"/g, '\\"') },
    Float32Array, Uint16Array, Uint32Array, Math, JSON, Map, Set, Promise, Array, Object, String, Number, Infinity, NaN, isNaN, parseInt, parseFloat, Symbol, Error, Date, RegExp,
  };
  const timers = [];
  ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(THREE_SRC, ctx, { filename: 'three.min.js' });
  const T = ctx.THREE;
  win.THREE = T;
  // no GPU: a renderer that does nothing
  T.WebGLRenderer = class { constructor() { this.outputEncoding = 0; this.toneMapping = 0; this.toneMappingExposure = 1; } getContext() { return {}; } setClearColor() {} setPixelRatio() {} setSize() {} render(scene, camera) { scene.updateMatrixWorld(); if (camera.parent === null) camera.updateMatrixWorld(); } };
  ctx.getComputedStyle = () => ({ getPropertyValue: () => '', backgroundColor: '' });
  win.getComputedStyle = ctx.getComputedStyle;
  vm.runInContext(fs.readFileSync(TREE_PATH, 'utf8'), ctx, { filename: 'tree3d.js' });
  const GT = win.GrowthTree;
  const tree = opts.flat ? GT.flat(stage) : new GT();
  if (!opts.flat) { if (!tree.ok) throw new Error('tree not ok'); tree.mount(stage, 'stage'); tree.canvas.clientWidth = W; tree.canvas.clientHeight = H; }
  const step = (ms, dt = 16) => {
    const end = now + ms;
    while (now < end) {
      now += dt;
      timers.forEach((t) => { if (t.fn && t.at <= now) { const f = t.fn; t.fn = null; f(); } });
      tree.raf = 0;
      tree.tick(now);
    }
  };
  return { tree, GT, T, doc, win, stage, step, clock: () => now, el: (id) => byId[id], state, El, panel, qt, ename, ctx };
}
module.exports = { make };
