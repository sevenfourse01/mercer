/* The business's tree, in three dimensions. It is a chart in the shape of a real tree:
   roots = what Mercer knows, one bundle per source (your answers, industry figures, your website, estimates);
   the roots grow as wide as the crown when the answers were the visitor's own
   trunk + six limbs = the six ways a business grows (pricing, demand, conversion, capacity, margin, retention)
   a limb is a pale stub until its section is entered, then lengthens with the answered share
   twigs = questions: one slot each (twelve per limb); a bud while unanswered, a leaf cluster once answered,
   coloured by where the answer came from; a ring when nobody knows; cut when it does not apply
   on the results only: height = revenue, lit leaves = the share of runs that reach the goal, fruit = the margin kept.
   Nothing here counts anything; the page's words do that. */
(function () {
  'use strict';
  const T = window.THREE;
  const M = (window.Mercer = window.Mercer || {});
  const SELF = document.currentScript && document.currentScript.src;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const approach = (cur, target, dt, rate) => cur + (target - cur) * (1 - Math.exp(-dt * rate));
  const RM = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { return null; } })();
  const reduce = () => !!(RM && RM.matches);
  const lerp = (a, b, k) => a + (b - a) * k;

  /** the page's easing, cubic-bezier(.2,.75,.1,1), solved for x */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      x = clamp(x);
      let t = x;
      for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
      t = clamp(t);
      return sy(t);
    };
  }
  const EASE = bezier(0.2, 0.75, 0.1, 1);

  // six limbs keep their place on the trunk, so a limb is in the same place at every stage
  const LAYOUT = {
    pricing: { az: 0.3, h: 0.4, len: 1.34, e0: 0.32 },
    demand: { az: 2.7, h: 0.48, len: 1.3, e0: 0.38 },
    conversion: { az: 5.1, h: 0.57, len: 1.2, e0: 0.46 },
    capacity: { az: 1.22, h: 0.66, len: 1.06, e0: 0.56 },
    margin: { az: 3.62, h: 0.75, len: 0.92, e0: 0.68 },
    retention: { az: 6.02, h: 0.84, len: 0.78, e0: 0.82 },
  };
  const ORDER = Object.keys(LAYOUT);
  const SOURCES = {
    you: { az: 0.55 },
    sector: { az: 2.15 },
    web: { az: 3.75 },
    assumed: { az: 5.3 },
  };
  const SRC = Object.keys(SOURCES);
  const KINDS = ['you', 'sector', 'web', 'assumed', 'estimate'];
  const TWIG_STATES = ['bud', 'leaf', 'estimate', 'ring', 'cut'];
  const UNIT_H = 2.4;      // the trunk as built
  const H_TODAY = 1.05;    // results: the height that means today's revenue
  const H_GOAL = 2.7;      // results: the height that means the goal
  const S_REST = 0.9;      // before the results the tree stands at one size: its height means nothing yet
  const STUB_F = 0.4;      // a stub reaches 40% of its limb
  const FRUIT_SLOTS = 16;
  const LEAVES_PER = 64;   // leaves in a crown cluster
  const TWIG_SLOTS = 12;
  const TWIG_T0 = 0.14, TWIG_T1 = 0.94;
  const TWIG_R = 0.012;
  const TWIG_LEAVES = 46;  // 6 + 8 × 5
  const TWIG_BALL = 0.21;  // the widest a twig's cluster spreads (grade 5); a cluster reads as foliage from the section distance
  const TWIG_LEAF_K = 1.4; // a twig's leaves against the crown's own
  // sprigs: a twig whose answer is a sort into bins (the last five best clients by route kind) fans one short sprig per
  // non-zero bin. The sprigs share the twig's own leaves (8 per client, 40 at most, 6 stay at the tip), so the leaf cap holds.
  const SPRIG_BINS = 4;        // warm one to one, warm one to many, cold one to one, cold one to many: each bin keeps its place
  const SPRIG_T = [0.55, 0.9]; // where the sprigs leave their twig
  const SPRIG_PER = 8;         // leaves per client in a bin
  const SPRIG_MAX = 40;        // five clients
  const SPRIG_LAG = 300;       // ms a sprig's leaves wait for its wood
  const SPRIG_LEN = [0.18, 0.26]; // how long a sprig is, in the tree's own units (a twig is .15 to .27)
  const SPRIG_LEAF_K = 0.8;    // a sprig's leaves against the twig's own, so a tuft of eight reads as a tuft
  const SPRIG_FAN = [-0.26, 0.96, 2.18, 3.4]; // the four directions, as angles round the twig's upper side
  const BASE_CLUSTERS = ORDER.length * 5 + 4;
  // the camera fits its subject to the screen. Shares of the viewport; tune here, read the result with frameReport()
  const FIT = {
    // where the trunk base is pinned. On the phone the sheet starts at 56% of the height (52% on a screen 700 px tall or
    // less, scene.css): the root flare stands clear above it, and the tree takes everything from there up to the top bar.
    // At the crown the sheet starts at 48% (46%) with the disc row above it, so 'explore' stands higher when no card pins it.
    base: { landscape: { x: 0.64, y: 0.78 }, portrait: { x: 0.5, y: 0.455, yShort: 0.435, shortH: 700, yExplore: 0.34 } },
    // the phone's sheet, as scene.css lays it out (shares of the height): where it starts, where the disc row above it starts
    // at the crown, and how far under that line the root tips may run (the sheet's veil comes in over its first 24 px).
    // Roots deeper than that lift the base and the whole tree, root tips included, shares the room; a pinned base stays put.
    sheet: { top: 0.56, topShort: 0.52, explore: 0.41, exploreShort: 0.375, under: 0.04 },
    winH: { landscape: 1, portrait: 0.56 },   // the share of the height a sphere fit may use (the phone's sheet takes the rest)
    // top: where the crown's top stands in a whole-tree frame on the phone (a share of the height): under the top bar's band.
    // On the phone every frame but Roots is this one frame (base pinned, top at `top`): a section turns the tree, it does not zoom
    whole: { fill: 0.86, cy: 0.5, left: 0.46, shift: 0.03, top: 0.075 },
    // the intro (and an arrival with a tree standing) at 1440: the words sit under the tree, so it keeps to the top 58% of the height.
    // Merged over `whole` on landscape only; the phone's whole-tree frame already ends above its clearing
    intro: { fill: 0.52, cy: 0.33 },
    arrival: { x: 0.5, y: 0.42 },             // the seed, before anything grows
    // the Core stands beside the root flare, never on it: left of the trunk base (toward the clearing) at 1440, right of it on the phone.
    // w, h: the box scene.css gives #core; gap: from the base to the box's near edge; up: the box's centre above the base
    core: { landscape: { w: 148, h: 88, gap: 56, up: 30 }, portrait: { w: 56, h: 34, gap: 40, up: 17 } },
    // 1440, but for turn: on the phone the limb in play comes toward the viewer turned this far (radians) to the left, so
    // its length and its twigs are seen along it; at 0.35 it pointed at the camera and its clusters piled up on the trunk
    section: { fill: 0.62, tipX: 0.535, tipMinX: 0.52, tipY: [0.3, 0.45], delta: [0.3, 1.3], top: 0.05, minOfFull: 0.85, turn: 0.8 },
    trunk: { fill: 0.7, top: 0.06 },                                                                                       // 1440 only
    roots: { fill: 0.45, fillPortrait: 0.6, cy: 0.55, cyPortrait: 0.3, minR: 0.9, minD: 0.6 },
    // Rebuild 1 (C13): the fit keeps room for the persistent labels beside the tree and for the marker's label above the ring.
    // side: px reserved on each side of the tree's box while group labels show (`measured` x the widest small label, as
    // measured, when that is more: a label seldom stands at the very edge at full width); top: px above the ring for its
    // label. maxShare caps a side reserve at that share of the usable width, so a narrow screen keeps most of it for the tree
    labels: { side: 48, sidePortrait: 40, measured: 0.75, top: 36, maxShare: 0.16 },
  };
  // the live label: it stands beside the part it names, never on wood, leaves, a disc or the Core, and it is not shown when
  // it only repeats what the panel already says. Live at GrowthTree.LABEL
  const LABEL = {
    gap: 8,                                 // px kept between the label and anything it must not touch
    hold: 2,                                // px: the looser test for the place it already has, so a turning tree does not make it hop
    near: 14, far: 268,                     // px from the part to the label's near edge: where the search starts and gives up
    // the directions it may stand in: [x, y, handicap px]. x is outward: away from the trunk (toward the clearing at 1440,
    // right of the tree on the phone, for a part on the trunk's own line). The handicap is added to the distance when two
    // directions are compared, so beside-and-outward wins unless another place is that much nearer.
    dirs: [[1, 0, 0], [0.82, -0.57, 8], [0.82, 0.57, 8], [0, -1, 16], [0, 1, 16], [-0.82, -0.57, 40], [-0.82, 0.57, 40], [-1, 0, 56]],
    again: 1500,                            // ms between looks for a nearer place while the one it has still holds
    worth: 24,                              // px nearer a new place must be before the label leaves one that holds
    flip: 16,                               // px the part must stand off the trunk's line before the label changes side
    echo: ['#q-title', '#eyebrow .name'],   // the panel's own words: a label made only of these is not shown
    tight: 820,                             // px of stage width under which only the part in play is named: a phone, and a
                                            // tablet where the clearing takes 423 px and the tree is left about 200 px to
                                            // stand in. It is the width, not the tree's own height: a low baseline at the
                                            // results draws a short tree on a wide screen and that one keeps every name.

    minTree: 90,                            // px: hidden when the trunk as drawn stands shorter than this (a low baseline at the results is a small tree by design, and keeps its labels; the phone's results tree stands about 100 px)
    top: 56,                                // px: the top bar's band
  };
  // zoom (Refine 1, R16): a screen-space zoom over the stage's own frame, shown' = k * shown + (x, y) in px, made with the
  // camera's view offset, so every anchor, label, disc and ray follows it. Live at GrowthTree.ZOOM
  const ZOOM = {
    min: 1, max: 4,        // 1 is the stage's own frame: the whole tree is already in it, so there is nothing further out
    step: 1.25,            // one press of + or -, one press of a #tree-tools button
    rate: 14,              // 1/s: how fast the shown zoom closes on the asked one (a cut under reduced motion)
    wheel: 0.0016,         // per wheel delta unit with Ctrl or Cmd held (a mouse notch is about 100)
    pinchWheel: 0.01,      // a trackpad pinch arrives as small Ctrl+wheel deltas
    settle: 0.25,          // over the first 25% of zoom the pan is held toward the stage's own frame, so 1 always means "fitted"
    turn: 0.3,             // radians one Left or Right press turns the tree
    top: 56,               // px: the top bar's band, the usable viewport's top edge
    edge: 8,               // px kept from the screen's right edge
    tol: 0.005,            // a share of the height: a frame this close to the usable viewport's edge is left alone
  };
  // the unresolved state (R6): a limb's stub and a trunk Mercer does not know yet are the same bark at the same opacity
  const PALE_A = 0.22;
  // the control section (R18) stands on the trunk's upper third: its anchor, and the run of trunk its twigs leave from
  const CONTROL = { t: 0.8, t0: 0.66, t1: 0.985, L: 1.2, az0: 1.9, azStep: 2.39996 };
  // Rebuild 1 (R10): the six limbs read as four business groups; control is the trunk's upper third (Leverage)
  const GROUPS = { customers: ['demand', 'conversion', 'retention'], offer: ['pricing', 'margin'], delivery: ['capacity'], leverage: ['control'] };
  const GROUP_OF = {};
  Object.keys(GROUPS).forEach((g) => GROUPS[g].forEach((id) => { GROUP_OF[id] = g; }));
  // the persistent labels: business words, with a botanical word in the small type under them. Live at GrowthTree.GROUP_WORDS;
  // setGroupWords() re-words them for a route (the starter's trunk is the chosen concept)
  const GROUP_WORDS = {
    customers: { word: 'Customers', small: 'three limbs' },
    offer: { word: 'Offer', small: 'two limbs' },
    delivery: { word: 'Delivery', small: 'one limb' },
    leverage: { word: 'Leverage', small: 'upper trunk' },
    trunk: { word: 'Baseline', small: 'trunk' },
    roots: { word: 'Roots', small: 'evidence and resources' },
    crown: { word: 'Now', small: 'crown' },
  };
  // the parts that carry an evidence state (setPartState), and the driver word each limb shows in a label
  const PART_WORDS = { pricing: 'Pricing', demand: 'Demand', conversion: 'Conversion', capacity: 'Capacity', margin: 'Margin', retention: 'Retention', control: 'Control', trunk: 'Baseline', roots: 'Roots', crown: 'Crown' };
  const PARTS = Object.keys(PART_WORDS);
  // R9: the evidence words, one per state; never "verified". Live at GrowthTree.EVIDENCE
  const EVIDENCE = { user: 'Your answer', imported: 'From a source', source: 'From a source', assumed: 'Assumption', calculated: 'Calculated', unknown: 'Not known yet' };
  const STATES = Object.keys(EVIDENCE);
  // the goal marker (R10, brief 5.4): one linear mapping from value to crown height for the baseline, the scenario and the
  // target. u = value / target; the crown stands at H_TODAY + (H_GOAL - H_TODAY) x u, so value 0 is the floor (a seedling,
  // never nothing) and the target is H_GOAL. A scenario past the target rises past the ring up to `cap` x the target.
  // The ring's radius is the crown's own envelope at the target's size, so it is the crown's outline at that height.
  const METRIC = { floor: H_TODAY, goal: H_GOAL, cap: 2, upper: 0.7, ringPad: 1.0, tube: 0.007, alpha: 0.62, planAlpha: 0.42, rate: 5, ms: 480 };
  const VIEWS = ['current', 'plan'];
  // Task 20 (D12): the target is a thin muted red dashed line, always labelled. Muted, never the page's --error red, and
  // dashed where an error rule would be solid. A milestone (no scalar metric) keeps the neutral marker colour and a solid
  // hairline: it is not a goal line and must not borrow one. Live at GrowthTree.GOAL
  const GOAL = { dashes: 24, duty: 0.56, w: 0.012, light: 0x9a6a66, dark: 0xc08c86 };
  // Task 06 / D11: the halo. A frame and focus treatment carried from the first tree demonstration through questioning and
  // the results, and the one glow allowed. Three steps and no more, so it can never read as a score or a percentage, and
  // nothing in setMetric, setMetrics, setLimbFill or the answered share may touch it: haloWant reads the stage and the
  // focus only. Live at GrowthTree.HALO
  const HALO = {
    steps: ['off', 'ambient', 'focus'],
    alpha: { off: 0, ambient: 0.14, focus: 0.2 },  // the layer's own opacity: subtle at both ends, and the focus step is the brightest the tree ever goes
    spread: { ambient: 1.55, focus: 1.15 },        // the halo's radius against its subject's
    min: 96, max: 640,                             // px: never a dot, never the whole screen
    rate: 3.4,                                     // 1/s: how fast the shown strength closes on the asked one
    press: 0.035, pressMs: 420,                    // a press or a keyboard focus lifts it this much, then it settles
    depth: 7, inner: 0.42, depthRate: 5,           // Task 06: px the decorative layers move with the pointer, and the rate
  };
  // Task 21: the branch inspector and the Whole tree reset. One branch open at a time; the panel stands beside its branch,
  // inside the usable viewport, and never covers the part it names
  const BRANCH = { w: 244, gap: 18, pad: 12 };
  const STAGE_NAME ='Your tree. Left and right arrows turn it, plus and minus zoom, 0 fits it to the screen, up and down move between its parts, Enter opens one.';
  const Z_OUT = T && new T.Vector3(0, 0, 1);
  const Z_UP = T && new T.Vector3(0, 1, 0);
  const X_AXIS = T && new T.Vector3(1, 0, 0);

  // section presets: which limb, where on it, and the camera's pitch (SPEC §3); the distance is fitted, see solve()
  const SECTION_PRESET = {
    offer: { limb: 'pricing', pitch: 0.3 },
    reach: { limb: 'demand', t: 0.35, pitch: 0.3 },
    routes: { limb: 'demand', t: 0.8, pitch: 0.3 },
    close: { limb: 'conversion', pitch: 0.3 },
    delivery: { limb: 'capacity', pitch: 0.3 },
    money: { limb: 'margin', pitch: 0.38 },
    clients: { limb: 'retention', pitch: 0.42 },
  };
  const LIMB_SECTION = { pricing: 'offer', demand: 'reach', conversion: 'close', capacity: 'delivery', margin: 'money', retention: 'clients' };

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // cheap smooth noise on a ring and along a length, for bark
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  /** bark: a tube that narrows along its length, with ridges in the surface and in the colour.
      Its index runs ring by ring, so a draw range grows it from the base. radius(t) gives the radius at t. */
  function tube(curve, segs, radial, radius, seed, ridge = 0.07) {
    const pos = [], col = [], idx = [];
    const frames = curve.computeFrenetFrames(segs, false);
    const len = curve.getLength();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = curve.getPointAt(t);
      const N = frames.normals[i], B = frames.binormals[i];
      const r = radius(t);
      for (let j = 0; j <= radial; j++) {
        const jj = j % radial;
        const v = (jj / radial) * Math.PI * 2, s = Math.sin(v), c = -Math.cos(v);
        const ang = (jj / radial) * 12;
        const n = noise2(ang + seed, t * len * 5 + seed) * 0.65 + noise2(ang * 2.3 + seed * 3, t * len * 14) * 0.35;
        const k = 1 + ridge * (n - 0.5) * 2;
        const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
        pos.push(p.x + r * k * nx, p.y + r * k * ny, p.z + r * k * nz);
        const shade = 0.72 + 0.34 * n - 0.1 * clamp(1 - t * 4) * (1 - n);
        col.push(shade, shade * 0.985, shade * 0.97);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j, c = b + 1, d = a + 1;
        idx.push(a, b, d, b, c, d);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const nor = g.attributes.normal;
    for (let i = 0; i <= segs; i++) {
      const a = i * (radial + 1), b = a + radial;
      const x = nor.getX(a) + nor.getX(b), y = nor.getY(a) + nor.getY(b), z = nor.getZ(a) + nor.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      nor.setXYZ(a, x / l, y / l, z / l);
      nor.setXYZ(b, x / l, y / l, z / l);
    }
    g.userData = { segs, radial };
    return g;
  }
  const grow = (mesh, f) => {
    const { segs, radial } = mesh.geometry.userData;
    mesh.geometry.setDrawRange(0, Math.floor(clamp(f) * segs) * radial * 6);
    mesh.visible = f > 0.004;
  };
  const taper = (r0, r1, p = 0.9) => (t) => r0 + (r1 - r0) * Math.pow(t, p);

  /** one leaf: a blade folded along its midrib, base at the origin, pointing up +y */
  function leafGeometry() {
    const v = [
      0, 0, 0, 0, 0.5, 0, 0, 1, 0,
      -0.3, 0.2, 0.08, -0.36, 0.52, 0.1, -0.2, 0.82, 0.06,
      0.3, 0.2, 0.08, 0.36, 0.52, 0.1, 0.2, 0.82, 0.06,
    ];
    const idx = [0, 3, 1, 3, 4, 1, 1, 4, 5, 1, 5, 2, 0, 1, 6, 6, 1, 7, 1, 8, 7, 1, 2, 8];
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function radialTexture(stops) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([at, a]) => grd.addColorStop(at, `rgba(255,255,255,${a})`));
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }

  /** "ABC Consulting's tree"; UK style keeps the 's after a final s */
  function possessive(name) {
    const f = M.feel && M.feel.possessive;
    if (typeof f === 'function') { try { const out = f(name); if (out) return /tree$/i.test(out) ? out : `${out} tree`; } catch (e) { /* fall through */ } }
    const n = String(name || '').trim();
    return n ? `${n}’s tree` : 'Your tree';
  }

  const normWords = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
  /** an element's own words: its text nodes only, so a marker inside a title (the "minor" span) is not read as part of it */
  function ownText(el) {
    const kids = el.childNodes;
    if (!kids || !kids.length) return el.textContent || '';
    let s = '', any = false;
    for (let i = 0; i < kids.length; i++) if (kids[i].nodeType === 3) { s += kids[i].nodeValue; any = true; }
    return any ? s : el.textContent || '';
  }
  /** true when the label only repeats the panel: every part of it ("Section · Title") is one of LABEL.echo's elements' words,
      and that element is on screen. Case and spacing are not compared. Read when the label is set and a few times a second. */
  function labelEchoes(text) {
    const pieces = String(text || '').split(/\s+[·•|]\s+/).map(normWords).filter(Boolean);
    if (!pieces.length) return false;
    const words = [];
    LABEL.echo.forEach((sel) => {
      let el = null;
      try { el = document.querySelector(sel); } catch (e) { el = null; }
      if (!el || (typeof el.getClientRects === 'function' && !el.getClientRects().length)) return;
      const t = normWords(ownText(el));
      if (t) words.push(t);
    });
    return words.length > 0 && pieces.every((p) => words.includes(p));
  }

  /** leaves in a flattened ball round a point, fuller on top and on the outside; each keeps its own turn and shade */
  function leafBall(r, radius, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = r() * Math.PI * 2, v = Math.acos(1 - 1.7 * r()), rr = radius * (0.25 + 0.75 * Math.cbrt(r()));
      const off = new T.Vector3(Math.sin(v) * Math.cos(u) * rr * 1.15, Math.cos(v) * rr * 0.75, Math.sin(v) * Math.sin(u) * rr * 1.15);
      const face = off.clone().normalize().addScaledVector(Z_UP, 0.7).add(new T.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.9)).normalize();
      const q = new T.Quaternion().setFromUnitVectors(Z_OUT, face).multiply(new T.Quaternion().setFromAxisAngle(Z_OUT, r() * Math.PI * 2));
      out.push({ off, q, size: 0.055 + r() * 0.035, hs: (r() - 0.5) * 0.05, ls: (r() - 0.5) * 0.09, rank: r() });
    }
    return out;
  }

  /** a twig item's parts ([warm11, warm1m, cold11, cold1m]) as four whole counts that sum to five at most; null when there
      is nothing to draw (no array, or every bin empty) */
  function sprigCounts(parts) {
    if (!Array.isArray(parts)) return null;
    const out = [0, 0, 0, 0];
    let left = SPRIG_MAX / SPRIG_PER, any = false;
    for (let k = 0; k < SPRIG_BINS; k++) {
      const n = Math.min(left, Math.max(0, Math.round(+parts[k] || 0)));
      out[k] = n;
      left -= n;
      if (n) any = true;
    }
    return any ? out : null;
  }

  /** any CSS colour as 0xRRGGBB, or null. Hex and comma rgb() are read here; everything else (oklab, oklch, color-mix,
      space-separated rgb, names) is painted on a 1 x 1 canvas and read back, so three never sees a string it cannot parse.
      Cached by string. */
  const colourCache = new Map();
  let colourCtx = null;
  function cssHex(value) {
    const v = String(value == null ? '' : value).trim();
    if (!v || v === 'transparent' || /^(var|env)\(/.test(v)) return null;
    if (colourCache.has(v)) return colourCache.get(v);
    let hex = null;
    const h6 = /^#([0-9a-f]{6})$/i.exec(v), h3 = /^#([0-9a-f]{3})$/i.exec(v);
    const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i.exec(v);
    if (h6) hex = parseInt(h6[1], 16);
    else if (h3) hex = parseInt(h3[1].replace(/./g, (c) => c + c), 16);
    else if (rgb) {
      const a = rgb[4] === undefined ? 1 : parseFloat(rgb[4]) / (/%$/.test(rgb[4]) ? 100 : 1);
      if (a > 0.03) hex = (clamp(Math.round(+rgb[1]), 0, 255) << 16) | (clamp(Math.round(+rgb[2]), 0, 255) << 8) | clamp(Math.round(+rgb[3]), 0, 255);
    } else {
      try {
        if (!colourCtx) {
          const c = document.createElement('canvas');
          c.width = c.height = 1;
          colourCtx = c.getContext('2d', { willReadFrequently: true });
        }
        const g = colourCtx;
        g.fillStyle = '#010203';
        g.fillStyle = v;
        if (g.fillStyle !== '#010203') { // the browser took the value
          g.clearRect(0, 0, 1, 1);
          g.fillRect(0, 0, 1, 1);
          const d = g.getImageData(0, 0, 1, 1).data;
          if (d[3] > 8) hex = (d[0] << 16) | (d[1] << 8) | d[2];
        }
      } catch (e) { hex = null; }
    }
    if (colourCache.size > 400) colourCache.clear(); // a crossfading sky makes many strings
    colourCache.set(v, hex);
    return hex;
  }
  function cssColor(style, names, fallback) {
    for (const n of names) {
      const hex = cssHex(style.getPropertyValue(n));
      if (hex != null) return new T.Color().setHex(hex);
    }
    return new T.Color(fallback);
  }
  /** the page colour, resolved: body carries background: var(--sky), so its computed background is the sky */
  function skyColor(fallback) {
    try {
      const hex = cssHex(getComputedStyle(document.body).backgroundColor);
      if (hex != null) return new T.Color().setHex(hex);
    } catch (e) { /* fall through */ }
    return new T.Color(fallback);
  }
  const isDark = () => (document.body && document.body.dataset.mode) === 'dark' || document.documentElement.dataset.theme === 'dark';
  const clearing = () => {
    const c = document.body && document.body.dataset.clearing;
    if (c === 'bottom' || c === 'left') return c;
    return window.innerHeight > window.innerWidth ? 'bottom' : 'left';
  };
  /** the Core's centre from the projected trunk base: beside the flare (FIT.core), and the whole box inside a w x h canvas */
  function coreBeside(base, port, w, h) {
    const c = port ? FIT.core.portrait : FIT.core.landscape;
    const x = base.x + (port ? 1 : -1) * (c.w / 2 + c.gap), y = base.y - c.up;
    return { ...base, x: clamp(x, c.w / 2 + 4, Math.max(c.w / 2 + 4, w - c.w / 2 - 4)), y: clamp(y, c.h / 2 + 4, Math.max(c.h / 2 + 4, h - c.h / 2 - 4)) };
  }

  // the tree's own stylesheet: added once if the page has not linked it
  function linkStyles() {
    if (!SELF || document.querySelector('link[href*="tree.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = SELF.replace(/tree3d\.js(\?.*)?$/, 'tree.css$1');
    document.head.appendChild(l);
  }
  const flightLayer = () => {
    let el = document.getElementById('flight');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flight';
      el.className = 'flight-layer';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  };

  /** the flying value: a DOM element that lifts off the control and travels a cubic path to the twig.
      dest() is read every frame so a moving camera is followed. Resolves on arrival. */
  function flyDom(from, dest, text, kind, onArrive) {
    return new Promise((resolve) => {
      const layer = flightLayer();
      const el = document.createElement('span');
      el.className = 'flyer';
      el.dataset.kind = KINDS.includes(kind) ? kind : 'you';
      el.textContent = String(text == null ? '' : text);
      layer.appendChild(el);
      const rm = reduce();
      const ms = rm ? 120 : 620;
      const t0 = performance.now();
      const x0 = +from.x || 0, y0 = (+from.y || 0) - 8;
      const finish = () => { el.remove(); if (onArrive) onArrive(); resolve(); };
      const step = (now) => {
        const k = clamp((now - t0) / ms);
        const d = dest() || { x: x0, y: y0 };
        if (rm) {
          el.style.transform = `translate3d(${d.x.toFixed(1)}px, ${d.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(.3)`;
          el.style.opacity = String(1 - k);
        } else {
          const e = EASE(k);
          const p1x = x0, p1y = y0 - 90;
          const p2x = d.x + (x0 - d.x) * 0.3, p2y = d.y - 70;
          const u = 1 - e;
          const x = u * u * u * x0 + 3 * u * u * e * p1x + 3 * u * e * e * p2x + e * e * e * d.x;
          const y = u * u * u * y0 + 3 * u * u * e * p1y + 3 * u * e * e * p2y + e * e * e * d.y;
          const sc = 1 - 0.7 * e;
          const fade = k > (ms - 120) / ms ? 1 - (k - (ms - 120) / ms) / (120 / ms) : 1;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
          el.style.opacity = fade.toFixed(3);
        }
        if (k >= 1) finish(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /** discs placed on the tree with collision nudging (the v11 label placer, kept alive for the discs) */
  function nudgePlace(items, w, h, memo) {
    const placed = [];
    items.sort((a, b) => a.t.y - b.t.y).forEach((it) => {
      const bw = it.w, bh = it.h + 6;
      const prev = memo.get(it.id) || { x: it.t.x, y: it.t.y };
      let y = it.t.y;
      for (let guard = 0; guard < 8; guard++) {
        const hit = placed.find((q) => Math.abs(q.x - it.t.x) < (q.w + bw) / 2 + 6 && Math.abs(q.y - y) < bh);
        if (!hit) break;
        y = hit.y + bh;
      }
      const next = { x: prev.x + (it.t.x - prev.x) * 0.25, y: prev.y + (y - prev.y) * 0.25 };
      next.x = clamp(next.x, bw / 2 + 4, w - bw / 2 - 4);
      next.y = clamp(next.y, bh / 2 + 4, h - bh / 2 - 4);
      placed.push({ x: next.x, y: next.y, w: bw });
      memo.set(it.id, next);
      it.x = next.x;
      it.y = next.y;
    });
  }

  /** R16: the stage host takes the keyboard. tabindex 0, a name and a role unless the page gave its own; an aria-hidden host
      cannot hold the focus, so that goes (the canvas inside stays hidden from a screen reader; the tree's words are the
      live line and the inspect chip). One listener per host, whichever tree stands in it. */
  function stageHost(tree, el) {
    if (!el) return;
    el.__mercerStage = tree;
    if (el.__mercerStageBound) return;
    el.__mercerStageBound = true;
    if (el.getAttribute('tabindex') == null) el.setAttribute('tabindex', '0');
    if (el.getAttribute('role') == null) el.setAttribute('role', 'group');
    if (el.getAttribute('aria-label') == null && el.getAttribute('aria-labelledby') == null) el.setAttribute('aria-label', STAGE_NAME);
    if (el.getAttribute('aria-hidden') === 'true') { if (el.removeAttribute) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'false'); }
    el.classList.add('tree-host');
    el.addEventListener('keydown', (e) => { const t = el.__mercerStage; if (t && t.onKey) t.onKey(e, el); });
    el.addEventListener('blur', () => { const t = el.__mercerStage; if (t && t.setFocusPart) t.setFocusPart(-1); });
  }
  /** the keys, for either tree: true when the key was the stage's (the caller stops it there) */
  function stageKey(tree, e, el) {
    if (e.target !== el || e.ctrlKey || e.metaKey || e.altKey) return false; // a disc inside the stage keeps its own keys; Ctrl + and - stay the browser's
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight') tree.turnBy(key === 'ArrowLeft' ? -ZOOM.turn : ZOOM.turn);
    else if (key === 'ArrowUp' || key === 'ArrowDown') tree.stepFocus(key === 'ArrowDown' ? 1 : -1);
    else if (key === '+' || key === '=' || key === 'Add') tree.zoomBy(ZOOM.step, tree.focusPoint());
    else if (key === '-' || key === '_' || key === 'Subtract') tree.zoomBy(1 / ZOOM.step, tree.focusPoint());
    else if (key === '0') { if (tree.branchOpen) tree.wholeTree(); else tree.fit(); } // Task 21: 0 is the whole tree, from anywhere
    else if (key === 'Enter' || key === ' ' || key === 'Spacebar') { if (tree.focusAt < 0) tree.stepFocus(1); else tree.inspectFocus(); }
    else if (key === 'Escape' && (tree.branchOpen || tree.focusAt >= 0)) { if (tree.branchOpen) tree.collapseBranch({ refocus: true }); else tree.setFocusPart(-1); }
    else return false;
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  /** what a focused part is called, for the live line: the page's own title when it has one (Mercer.inspect), else plain words */
  function partName(part) {
    if (part.kind === 'group' && part.L && part.L.el) return part.L.el.getAttribute('aria-label') || part.L.text || part.id;
    try {
      const got = typeof M.inspect === 'function' ? M.inspect(part.id) : null;
      if (got && typeof got.title === 'string' && got.title) return got.title;
    } catch (e) { /* the page's own business */ }
    if (part.kind === 'root') return `Roots: ${part.id === 'you' ? 'your answers' : part.id === 'sector' ? 'industry figures' : part.id === 'web' ? 'your website' : 'Mercer\u2019s estimates'}`;
    const sec = part.kind === 'limb' ? (part.id === 'trunk' ? 'you' : LIMB_SECTION[part.id]) : null;
    const named = sec && Array.isArray(M.SECTIONS) ? M.SECTIONS.find((x) => x && x.id === sec) : null;
    if (named && named.name) return String(named.name);
    return part.kind === 'twig' ? `Answer: ${part.id}` : part.id === 'trunk' ? 'The trunk' : `Limb: ${part.id}`;
  }
  /** the focus ring and the live line, made once in the tree's overlay box */
  function focusDom(tree) {
    if (tree.focusEl || !tree.tags) return;
    const ring = document.createElement('div');
    ring.className = 'tree-focus';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.opacity = '0';
    const live = document.createElement('div');
    live.className = 'tree-live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    tree.tags.box.appendChild(ring);
    tree.tags.box.appendChild(live);
    tree.focusEl = ring;
    tree.liveEl = live;
  }

  /** Task 06 / D11: the halo's two decorative layers, made once and put behind the canvas so the tree draws over them.
      Nothing in here is text, takes the pointer or carries a figure, which is what lets the pointer depth move it. */
  function haloDom(tree, host) {
    const H = tree.halo;
    if (!host) return;
    if (!H.el) {
      const box = document.createElement('div');
      box.className = 'tree-halo';
      box.setAttribute('aria-hidden', 'true');
      box.dataset.level = 'ambient';
      const core = document.createElement('i');
      core.className = 'tree-halo-core';
      box.appendChild(core);
      H.el = box;
      H.inner = core;
    }
    if (H.el.parentElement !== host) {
      if (host.firstChild && host.insertBefore) host.insertBefore(H.el, host.firstChild);
      else host.appendChild(H.el);
    }
  }
  /** Task 21: the branch inspector. One panel, made once: the branch's name, its current state, its target or milestone and
      the action meant to close the gap, with a Close that gives the focus back to whatever opened it. */
  function branchDom(tree) {
    if (tree.branchEl || !tree.tags) return tree.branchEl;
    const el = document.createElement('div');
    el.className = 'tree-branch';
    el.setAttribute('role', 'group');
    el.style.opacity = '0';
    el.dataset.open = '0';
    const head = document.createElement('div');
    head.className = 'tree-branch-head';
    const name = document.createElement('b');
    name.className = 'tree-branch-name';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tree-branch-close';
    close.setAttribute('aria-label', 'Close this branch');
    close.textContent = '×';
    close.addEventListener('click', (e) => { if (e && e.stopPropagation) e.stopPropagation(); tree.collapseBranch({ refocus: true }); });
    head.appendChild(name);
    head.appendChild(close);
    el.appendChild(head);
    const rows = {};
    ['now', 'target', 'action'].forEach((k) => {
      const row = document.createElement('i');
      row.className = 'tree-branch-row';
      row.dataset.k = k;
      const key = document.createElement('span');
      key.className = 'tree-branch-k';
      const val = document.createElement('b');
      val.className = 'tree-branch-v';
      row.appendChild(key);
      row.appendChild(val);
      el.appendChild(row);
      rows[k] = { row, key, val };
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); tree.collapseBranch({ refocus: true }); } });
    tree.tags.box.appendChild(el);
    tree.branchEl = el;
    tree.branchRows = rows;
    tree.branchName = name;
    tree.branchClose = close;
    return el;
  }
  /** Task 21: the visible way back out. It stands only while the visitor is inside something (a branch open, or zoomed in),
      and the page may own it instead (setWholeControl(false), or its own #tree-tools). */
  function resetDom(tree) {
    if (tree.resetEl || !tree.tags) return tree.resetEl;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tree-whole';
    b.textContent = 'Whole tree';
    b.style.opacity = '0';
    b.dataset.on = '0';
    b.addEventListener('click', (e) => { if (e && e.stopPropagation) e.stopPropagation(); tree.wholeTree(); });
    tree.tags.box.appendChild(b);
    tree.resetEl = b;
    return b;
  }
  /** one label's state for the placer (Rebuild 1): the live label (the page's setLabel), a group's persistent label, the
      crown's, the marker's or the plan's. Made once each; the placer writes into it and allocates nothing per frame. */
  function labelRec(id, kind) {
    return { id, kind, part: null, key: '', text: '', el: null, timer: 0, pick: -1, reach: 0, found: -1, foundReach: 0, lookedAt: 0, failedAt: 0, side: 0,
      echo: false, echoAt: 0, w: 0, h: 0, sizedFor: null, sizedAt: 0, swapAt: 0, tx: NaN, ty: NaN, vis: null,
      on: false, ax: 0, ay: 0, mode: '', sig: '', limb: null, parts: null, rank: 0, inside: true, x0: 0, y0: 0, x1: 0, y1: 0 };
  }
  /** a persistent label's element: a button (Tab reaches it, a press inspects the group), the business word, the botanical
      word in the small type and, when expanded, one line per part with its value and evidence word */
  function groupDom(tree, L) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tree-group';
    el.dataset.group = L.id;
    el.dataset.mode = 'small';
    el.setAttribute('aria-hidden', 'true'); // until it shows
    el.tabIndex = -1; // the whole tree layer is aria-hidden: a focusable label inside it is a silent tab stop
    el.style.opacity = '0';
    el.innerHTML = '<b class="tree-group-word"></b><small class="tree-group-small"></small><span class="tree-group-parts"></span>';
    el.addEventListener('click', (e) => { if (e && e.stopPropagation) e.stopPropagation(); tree.inspectGroup(L, e); });
    tree.tags.box.appendChild(el);
    return el;
  }
  /** Task 20: a thin ring lying flat in the XZ plane at y = 0, drawn as `dashes` arcs of `duty` of their span and `w` wide.
      Two triangles a dash, so the goal line is cheap and reads as a line. dashes = 1, duty = 1 is the solid hairline a
      milestone wears, so the two markers are the same call and never the same drawing. */
  function ringGeo(r, w, dashes, duty) {
    const pos = [], idx = [], seg = 4, step = (Math.PI * 2) / dashes, span = step * duty;
    const r0 = Math.max(0.0005, r - w / 2), r1 = r + w / 2;
    for (let d = 0; d < dashes; d++) {
      const a0 = d * step, base = pos.length / 3;
      for (let s = 0; s <= seg; s++) {
        const a = a0 + (span * s) / seg, c = Math.cos(a), sn = Math.sin(a);
        pos.push(c * r0, 0, sn * r0, c * r1, 0, sn * r1);
      }
      for (let s = 0; s < seg; s++) { const q = base + s * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  }
  /** a value for a label: a number is printed with the page's own formatter when it has one (M.gbp for money), else plainly */
  function fmtValue(v, unit) {
    if (v == null || v === '') return '';
    if (typeof v === 'number' && isFinite(v)) {
      let s;
      if (unit === 'money' && typeof M.gbp === 'function') { try { s = M.gbp(v); } catch (e) { s = null; } }
      if (!s) { try { s = v.toLocaleString('en-GB', { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 }); } catch (e) { s = String(Math.round(v)); } }
      return unit && unit !== 'money' ? `${s} ${unit}` : s;
    }
    return String(v);
  }

  const THEMES = {
    light: { bark: 0x5e554d, leaf: 0x5a8a62, leafDry: 0x9a9670, shadow: 0x0e2036, shadowA: 0.16, fruit: 0xc98a2b, cutFace: 0xd9c8a8, spine: 0x14201b, spineA: 0.28, exposure: 1.0, hemi: 1.0, key: 1.2 },
    dark: { bark: 0x5b524b, leaf: 0x4a8a5c, leafDry: 0x76735d, shadow: 0x000000, shadowA: 0.3, fruit: 0xe3a24a, cutFace: 0xb9a888, spine: 0xeef3ef, spineA: 0.22, exposure: 0.92, hemi: 0.62, key: 1.05 },
  };

  class GrowthTree {
    constructor() {
      this.ok = false;
      this.listeners = {};
      if (!T || !T.WebGLRenderer) return;
      if (T.ColorManagement) T.ColorManagement.legacyMode = false;
      const canvas = document.createElement('canvas');
      let renderer = null;
      try {
        renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch (e) {
        return;
      }
      if (!renderer || !renderer.getContext()) return;
      this.ok = true;
      linkStyles();
      this.canvas = canvas;
      canvas.className = 'tree-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      this.renderer = renderer;
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;

      this.scene = new T.Scene();
      if (T.RoomEnvironment) {
        const pm = new T.PMREMGenerator(renderer);
        this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
        pm.dispose();
      }
      this.camera = new T.PerspectiveCamera(30, 1, 0.1, 120);
      this.world = new T.Group();
      this.scene.add(this.world);
      // soft daylight: a sky and ground fill, a warm key from the front left, a cool rim from behind
      this.hemi = new T.HemisphereLight(0xeef4ff, 0x6b6256, 1.0);
      this.scene.add(this.hemi);
      const key = new T.DirectionalLight(0xfff4e6, 1.2);
      key.position.set(-3, 6, 5);
      this.scene.add(key);
      this.key = key;
      const fill = new T.DirectionalLight(0xf2f6ff, 0.45);
      fill.position.set(4, 2, 6);
      this.scene.add(fill);
      const rim = new T.DirectionalLight(0xcfe4ff, 0.5);
      rim.position.set(4, 3, -4);
      this.scene.add(rim);

      this.pal = isDark() ? THEMES.dark : THEMES.light;
      this.src = {};
      this.waveU = { t: { value: -2 }, a: { value: 0 }, h: { value: UNIT_H } };
      this.readTokens();
      this.makeMaterials();
      this.capGeo = new T.SphereGeometry(1, 14, 10);
      this.capGeo.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(this.capGeo.attributes.position.count * 3).fill(0.86), 3));
      this.leafGeo = leafGeometry();
      this.fruitGeo = new T.SphereGeometry(1, 18, 12);
      this.budGeo = new T.SphereGeometry(1, 10, 8);
      this.ringGeo = new T.TorusGeometry(0.03, 0.005, 6, 24);
      this.cutGeo = new T.CircleGeometry(0.02, 14);
      this.dummy = new T.Object3D();
      this.tmpQ = new T.Quaternion();

      this.planted = false;
      this.metrics = { progress: 0, odds: 0, profit: 0, repeat: 0 };
      this.shown = { progress: 0, odds: 0, profit: 0, repeat: 0 };
      this.months = 12;
      this.lit = 12;
      this.yaw = 0.5;
      this.drag = null;
      this.dragLocked = false;
      this.velocity = 0;
      this.selected = null;
      this.hovered = null;
      this.mode = 'stage';
      this.encode = false;
      this.size = { w: 0, h: 0 };
      this.branches = new Map();
      this.trunkF = 0;
      this.leafK = 0;
      this.crownK = 0;
      this.scaleNow = 0.3;
      this.intro = null;
      this.part = null;
      this.dimK = { roots: 1, trunk: 1, branches: 1, leaves: 1 };
      this.name = '';
      this.rootCounts = null;
      this.rootBalance = null;
      this.cvStrand = false;
      this.collarOn = null;
      this.discs = [];
      this.discMemo = new Map();
      this.label = labelRec('live', 'live');
      // Rebuild 1: the persistent labels (four groups, the trunk, the roots), the crown's, the marker's and the plan's.
      // tagList is walked in rank order each frame; a label placed earlier is kept clear of by the ones after it
      this.tagList = [this.label];
      ['customers', 'offer', 'delivery', 'leverage'].forEach((g) => { const L = labelRec(g, 'group'); L.parts = GROUPS[g].slice(); this.tagList.push(L); });
      ['trunk', 'roots'].forEach((g) => { const L = labelRec(g, 'group'); L.parts = [g]; this.tagList.push(L); });
      this.tagList.push(labelRec('crown', 'crown'), labelRec('marker', 'marker'), labelRec('plan', 'plan'));
      this.tagsOn = 'auto';        // setGroupLabels: 'auto' | 'all' | 'none'
      this.groupWords = {};        // setGroupWords: a route's own words over GROUP_WORDS
      this.partState = {};         // setPartState, by part id: { name, value, state, unit }
      this.activeGroup = undefined; // setActiveGroup; undefined reads the live label's part and the selection
      this.groupsDirty = true;
      this.searchBudget = 0;
      // the goal marker (setMetric): undefined = never set (the older setMetrics progress rules the height), null = a
      // milestone (a labelled ring at a fixed height, nothing implies a number), else { baseline, scenario, target, ... }
      this.metric = undefined;
      this.metricLabel = '';
      this.view = 'current';       // setView: 'current' | 'plan'
      this.planK = 0;              // the plan silhouette shown, 0..1
      this.markerK = 0;            // the ring shown, 0..1
      this.ringR = 0; this.ringY = 0;
      this.markerKind = 'none';    // 'goal' (a numeric target: the dashed muted red line) | 'milestone' | 'none'
      this.nowLabel = '';          // Task 20: "Now: ..." in the target's own metric and unit, when the baseline is known
      this.hasBaseline = false;
      // Task 06 / D11: the halo. want: 'auto' (ambient, focus while a branch or a section is in play) or a step the page
      // pinned; part: 'auto' (the frame's own subject) or a part the page named. shown is eased; strength never reads a metric
      this.halo = { want: 'auto', part: 'auto', shown: 0, level: 'ambient', pressAt: 0, x: 0, y: 0, r: 0, tx: NaN, ty: NaN, tr: NaN, ta: NaN, el: null, inner: null, dx: 0, dy: 0, px: 0, py: 0, on: true };
      this.depthOn = null;         // setDepth(): null = decide from the device (a fine pointer that hovers, no reduced motion)
      // Task 21: the branch inspector (one open at a time) and the Whole tree reset
      this.branchInfo = {};        // setBranchInfo(part, { now, target, milestone, action, unit, horizon })
      this.branchOpen = null;      // the part whose panel stands open
      this.branchEl = null;
      this.branchOpener = null;    // what had the focus when it opened, so closing gives it back
      this.branchTx = NaN; this.branchTy = NaN;
      this.resetEl = null;         // the visible "Whole tree" control; the page may own it instead (setWholeControl(false))
      this.resetOn = null;
      this.wholeControl = true;
      this.inspectorOn = true;     // setInspector(false): the tree emits 'branch' and draws no panel of its own
      this.centred = false;        // setComposition('centred'): Task 19's results scene, the tree in the middle of the screen
      this.branchDirty = true;
      this.branchSig = '';
      this.resetTx = NaN; this.resetTy = NaN;
      this.ptrX = 0; this.ptrY = 0; this.ptrIn = false; // the pointer, for the depth (Task 06); never read as an answer
      // scratch for the labels' places: one vector, the things they must not touch as [x, y, r] in px, the labels already
      // placed this frame as boxes, the bounds every label keeps to, one box
      this.lv = new T.Vector3();
      this.obs = new Float32Array(3 * 420);
      this.lrects = new Float32Array(4 * 12);
      this.lrectN = 0;
      this.lbounds = new Float32Array(4);
      this.reserve = new Float32Array(3);
      this.coreBox = new Float32Array(4);
      this.lb = new Float32Array(4);
      this.sx = 0; this.sy = 0; this.sd = 1;
      this.coreHost = null;
      this.coreWanted = false;     // showCore(true): the Core is placed outside the intro (the main journey does not show it)
      this.lastPointer = 0;
      // R6: the trunk is pale until the page says today's revenue is known. trunkDemo: the intro's own tree shows it resolved
      this.trunkKnown = false;
      this.trunkKnownSet = false;
      this.trunkDemo = false;
      this.trunkK = 0;
      this.trunkAskAt = 0;
      // R16: the zoom asked for (tk, tx, ty) and the zoom shown (k, x, y); the tree's box and the usable viewport it is held to
      this.zoom = { k: 1, x: 0, y: 0, tk: 1, tx: 0, ty: 0, box: new Float32Array(4), use: new Float32Array(4), boxed: false };
      this.pinch = { a: -1, b: -1, ax: 0, ay: 0, bx: 0, by: 0, d: 0 };
      this.focusParts = null;
      this.focusAt = -1;
      this.lv2 = new T.Vector3();
      this.portrait = clearing() === 'bottom';
      // the camera: a pose eased 900 ms, pivoting about a target that sits at a fixed point of the screen
      // dist is world units once a preset has been fitted (abs); before that it is a share of the legacy whole-tree distance
      this.pose = { yaw: 0.5, pitch: 0.15, dist: 1.0, abs: false, fit: { kind: 'none' }, target: [0, 1.1, 0], scaled: true, at: { x: 0.5, y: 0.4 }, spin: 0, idleAfter: 0 };
      this.tween = null;
      this.cam = { dist: 9, pitch: 0.15, target: new T.Vector3() };

      this.buildGround();
      this.tree = new T.Group();
      this.world.add(this.tree);
      this.buildTrunk();
      this.buildRoots();
      this.buildLeaves();
      ORDER.forEach((id) => this.branches.set(id, this.buildBranch(id)));
      this.ctl = this.buildControl();
      this.twigHosts = [...this.branches.values(), this.ctl]; // everything that carries twigs: the six limbs and the trunk's upper third
      this.buildEnvelope();
      this.buildWood();
      this.layoutLeaves();
      this.buildMarker();
      this.buildPlan();
      this.crownProxy = new T.Mesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ visible: false }));
      this.crownProxy.userData.driver = 'crown';
      this.crownProxy.scale.setScalar(0.001);
      this.tree.add(this.crownProxy);
      this.bindPointer();
      this.raycaster = new T.Raycaster();
      this.tick = this.tick.bind(this);
      this.raf = 0;
      // Task 06: decorative animation is suspended while the tab is hidden (the frame loop stops itself; this is the CSS side)
      document.addEventListener('visibilitychange', () => { this.suspendDecor(document.hidden); if (!document.hidden) this.start(); });
    }

    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
    off(ev, fn) { this.listeners[ev] = (this.listeners[ev] || []).filter((f) => f !== fn); }
    emit(ev, v) { (this.listeners[ev] || []).forEach((fn) => fn(v)); }

    /** the page's own colours: the four sources, the unfinished bud, the collar, the sky */
    readTokens() {
      const st = getComputedStyle(document.body || document.documentElement);
      const dark = isDark();
      this.src = {
        you: cssColor(st, ['--you', '--tree-you', '--accent'], dark ? 0x6fb585 : 0x4c8a5e),
        sector: cssColor(st, ['--sector', '--tree-sector', '--amber'], dark ? 0xd99a3f : 0xb8791f),
        web: cssColor(st, ['--web', '--tree-web'], dark ? 0x4fb3c3 : 0x2a8c9c),
        assumed: cssColor(st, ['--estimate', '--tree-assumed', '--navy'], dark ? 0x8e9dc2 : 0x6f7fa3),
      };
      this.src.estimate = this.src.assumed;
      this.budCol = cssColor(st, ['--bud'], dark ? 0x3a4a42 : 0xb9c2bc);
      this.collarCol = cssColor(st, ['--collar', '--amber'], dark ? 0xe3a24a : 0xc57a10);
      // Rebuild 1: a milestone marker is structure (navy / ink), the plan silhouette is healthy growth (emerald / --you)
      this.markerCol = cssColor(st, ['--marker', '--ink-2', '--ink'], dark ? 0xc0cac3 : 0x3c4843);
      // Task 20 (D12): a numeric target is a muted red goal line. --error is never read here, so the line cannot become the
      // error red by a token change; a page that wants another tone sets --goal-line
      this.goalCol = cssColor(st, ['--goal-line', '--goal'], dark ? GOAL.dark : GOAL.light);
      this.planCol = cssColor(st, ['--plan', '--you', '--accent'], dark ? 0x6fb585 : 0x4c8a5e);
      this.fogColor = skyColor(dark ? 0x0b110e : 0xe8ede8);
    }

    /** the bark wave: a band of lightness that runs base to crown, added to every bark shader */
    hookWave(mat) {
      const U = this.waveU;
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uWaveT = U.t;
        sh.uniforms.uWaveA = U.a;
        sh.uniforms.uWaveH = U.h;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying float vWaveY;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaveY = (modelMatrix * vec4(transformed, 1.0)).y;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vWaveY;\nuniform float uWaveT;\nuniform float uWaveA;\nuniform float uWaveH;')
          .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 + uWaveA * exp(-pow((vWaveY / uWaveH - uWaveT) * 4.0, 2.0));');
      };
      mat.customProgramCacheKey = () => 'mercer-wave';
      return mat;
    }

    makeMaterials() {
      const std = (o) => new T.MeshStandardMaterial(o);
      const leaf = std({ color: 0xffffff, roughness: 0.74, metalness: 0, side: T.DoubleSide, envMapIntensity: 0.55 });
      this.mat = {
        bark: this.hookWave(std({ color: this.pal.bark, roughness: 0.93, metalness: 0, vertexColors: true, envMapIntensity: 0.5 })),
        leaf,
        fruit: std({ color: this.pal.fruit, roughness: 0.45, metalness: 0, envMapIntensity: 0.7 }),
        cutFace: std({ color: this.pal.cutFace, roughness: 0.8 }),
        bud: std({ color: this.budCol.clone(), roughness: 0.8, envMapIntensity: 0.4 }),
        collar: new T.MeshBasicMaterial({ color: this.collarCol.clone(), transparent: true, opacity: 0.9 }),
        seed: std({ color: 0x6b5236, roughness: 0.55, envMapIntensity: 0.6 }),
        shadow: new T.MeshBasicMaterial({ color: this.pal.shadow, transparent: true, opacity: this.pal.shadowA, depthWrite: false, map: radialTexture([[0, 1], [0.5, 0.6], [1, 0]]) }),
        spine: new T.LineDashedMaterial({ color: this.pal.spine, dashSize: 0.05, gapSize: 0.05, transparent: true, opacity: 0, depthWrite: false }),
      };
      this.mat.roots = {};
      SRC.forEach((id) => {
        this.mat.roots[id] = this.hookWave(std({ color: this.rootTint(id), roughness: 0.9, vertexColors: true, envMapIntensity: 0.45 }));
      });
    }
    /** a root is bark, tinted toward its source's colour */
    rootTint(id) {
      const bark = new T.Color(this.pal.bark), b = {}, h = {};
      bark.getHSL(b);
      this.src[id].getHSL(h);
      return new T.Color().setHSL(h.h, Math.min(0.22, h.s * 0.35), b.l * 1.12);
    }

    /* ---------- the ground: a small contact shadow where the roots meet it, and the seed ---------- */
    buildGround() {
      const g = new T.Group();
      const shade = new T.Mesh(new T.PlaneGeometry(1, 1), this.mat.shadow);
      shade.rotation.x = -Math.PI / 2;
      shade.position.y = 0.003;
      shade.scale.set(0.6, 0.6, 1);
      shade.renderOrder = 2;
      this.contact = shade;
      g.add(shade);
      this.seed = new T.Mesh(this.capGeo, this.mat.seed);
      this.seed.scale.set(0.07, 0.055, 0.07);
      this.seed.position.y = 0.05;
      g.add(this.seed);
      this.ground = g;
      this.world.add(g);
    }

    /* ---------- the trunk: bark, a flare at the soil, a leader at the top ---------- */
    buildTrunk() {
      const V = T.Vector3;
      this.trunkCurve = new T.CatmullRomCurve3([new V(0, -0.1, 0), new V(0.04, 0.6, 0.02), new V(-0.03, 1.22, -0.03), new V(0.03, 1.82, 0.02), new V(0, UNIT_H, 0)]);
      this.rT = (t) => (0.034 + 0.12 * Math.pow(1 - t, 1.2) + 0.055 * Math.exp(-Math.pow(Math.max(0, t - 0.04) / 0.06, 2))) * (t < 0.04 ? Math.sqrt(t / 0.04) : 1);
      this.trunk = new T.Mesh(tube(this.trunkCurve, 80, 30, this.rT, 1.3, 0.1), this.mat.bark);
      this.trunk.userData.driver = 'trunk';
      this.trunkCap = new T.Mesh(this.capGeo, this.mat.bark);
      this.tree.add(this.trunk, this.trunkCap);
      grow(this.trunk, 0);
      this.trunkCap.visible = false;
      const r = rng(5);
      this.leader = [0.9, 0.95, 0.985].map((t, i) => {
        const at = this.trunkCurve.getPointAt(t);
        const a = 1.1 + i * 2.2 + r() * 0.4;
        const out = new V(Math.cos(a), 0, Math.sin(a));
        const len = 0.42 - i * 0.07;
        const curve = new T.CatmullRomCurve3([
          at.clone(),
          at.clone().addScaledVector(out, len * 0.35).add(new V(0, len * 0.35, 0)),
          at.clone().addScaledVector(out, len * 0.6).add(new V(0, len * 0.75, 0)),
          at.clone().addScaledVector(out, len * 0.7).add(new V(0, len * 1.05, 0)),
        ]);
        const mesh = new T.Mesh(tube(curve, 14, 7, taper(this.rT(t) * 0.7, 0.005), 7 + i), this.mat.bark);
        mesh.userData.driver = 'trunk';
        grow(mesh, 0);
        this.tree.add(mesh);
        return { curve, mesh, f: 0, at: t };
      });
    }

    /* ---------- roots: one bundle per source, thicker the more it gives; as wide as the crown when the answers are the visitor's ---------- */
    buildRoots() {
      this.roots = SRC.map((id) => ({ id, strands: [], norm: 0, normShown: 0, built: -1, builtR: 0, builtCv: false, grown: 0, R: 0, D: 0 }));
    }
    rootStrands(g, norm, R) {
      const V = T.Vector3;
      g.strands.forEach((s) => { this.world.remove(s.mesh); s.mesh.geometry.dispose(); });
      g.strands = [];
      g.main = null;
      g.built = norm;
      g.builtR = R;
      g.builtCv = g.id === 'you' && this.cvStrand;
      if (norm <= 0.001) { g.R = 0; g.D = 0; return; }
      const az = SOURCES[g.id].az;
      const reach = R > 0 ? R : 0.6 + 0.8 * norm;
      const D = R > 0 ? 0.9 * reach : 0.36 + 0.66 * norm;
      const r0 = 0.022 + 0.048 * Math.sqrt(norm);
      g.R = reach;
      g.D = D;
      const r = rng(31 + SRC.indexOf(g.id) * 13);
      const strand = (a, reach, depth, rad, lag, from) => {
        const o = from || new V(Math.cos(a) * 0.05, 0.05, Math.sin(a) * 0.05);
        const curve = new T.CatmullRomCurve3([
          o,
          new V(o.x + Math.cos(a) * 0.22 * reach, from ? o.y - 0.08 * depth : -0.06, o.z + Math.sin(a) * 0.22 * reach),
          new V(o.x + Math.cos(a + 0.12) * 0.55 * reach, o.y - 0.4 * depth, o.z + Math.sin(a + 0.12) * 0.55 * reach),
          new V(o.x + Math.cos(a + 0.22) * 0.84 * reach, o.y - 0.78 * depth, o.z + Math.sin(a + 0.22) * 0.84 * reach),
          new V(o.x + Math.cos(a + 0.3) * reach, o.y - depth, o.z + Math.sin(a + 0.3) * reach),
        ]);
        const mesh = new T.Mesh(tube(curve, 32, 7, taper(rad, 0.003, 0.8), 3 + r() * 9, 0.12), this.mat.roots[g.id]);
        mesh.userData.driver = 'roots';
        mesh.userData.source = g.id;
        grow(mesh, 0);
        this.world.add(mesh);
        // four points along it, in the world's own space, for the label to keep clear of
        const wood = new Float32Array(12), wp = new V();
        for (let i = 0; i < 4; i++) { curve.getPointAt(0.25 + 0.25 * i, wp); wood[i * 3] = wp.x; wood[i * 3 + 1] = wp.y; wood[i * 3 + 2] = wp.z; }
        const s = { curve, mesh, lag, f: 0, wood };
        g.strands.push(s);
        return s;
      };
      const main = strand(az, reach, D, r0, 0);
      const left = strand(az - 0.42, reach * 0.72, D * 0.78, r0 * 0.62, 0.1);
      const right = strand(az + 0.4, reach * 0.66, D * 0.86, r0 * 0.58, 0.14);
      [[main, 0.45, 0.5], [left, 0.55, -0.6], [right, 0.5, 0.6]].forEach(([p, t, turn]) => {
        const from = p.curve.getPointAt(t);
        strand(az + turn, reach * 0.3, D * 0.35, r0 * 0.28, 0.3 + t * 0.3, from);
      });
      // the CV: one more strand on the visitor's own bundle
      if (g.builtCv) strand(az + 0.78, reach * 0.8, D * 0.7, r0 * 0.5, 0.5);
      g.main = main;
    }
    rootDepth() {
      let d = 0.25;
      this.roots.forEach((g) => { if (g.strands.length) d = Math.max(d, g.D); });
      return d;
    }

    /* ---------- limbs: the six ways a business grows. Each leaves the trunk low and turns upward, forks near its end,
       and carries twelve twig slots, one per question ---------- */
    buildBranch(id) {
      const V = T.Vector3;
      const lay = LAYOUT[id];
      const o = this.trunkCurve.getPointAt(lay.h);
      const out = new V(Math.cos(lay.az), 0, Math.sin(lay.az));
      const side = new V(-out.z, 0, out.x);
      const up = new V(0, 1, 0);
      const L = lay.len * 0.95;
      const r = rng(ORDER.indexOf(id) * 19 + 3);
      const e1 = lay.e0 + 0.52;
      const pts = [o.clone()];
      let p = o.clone();
      for (let k = 0; k < 4; k++) {
        const e = lay.e0 + ((e1 - lay.e0) * (k + 0.5)) / 4;
        p = p.clone().addScaledVector(out, (Math.cos(e) * L) / 4).addScaledVector(up, (Math.sin(e) * L) / 4).addScaledVector(side, ((r() - 0.5) * 0.18 * L) / 4);
        pts.push(p);
      }
      const curve = new T.CatmullRomCurve3(pts);
      const rt = this.rT(lay.h);
      const r0 = Math.min(rt * 0.8, 0.044);
      const radius = taper(r0, 0.006, 0.8);
      const mat = this.hookWave(this.mat.bark.clone());
      mat.transparent = true;
      const mesh = new T.Mesh(tube(curve, 40, 10, radius, 2 + ORDER.indexOf(id) * 3.7, 0.07), mat);
      mesh.userData.driver = id;
      const cap = new T.Mesh(this.capGeo, mat);
      cap.userData.driver = id;
      const b = { id, L, curve, mesh, cap, r0, radius, mat, out, side, up, subs: [], twigs: new Array(TWIG_SLOTS).fill(null), stub: true, stubK: 1, fill: 0, f: 0, hold: null };
      // the collar: the limit that binds first wears a thin band where the limb leaves the trunk
      {
        const t = 0.2;
        const at = curve.getPointAt(t), tan = curve.getTangentAt(t);
        b.collar = new T.Mesh(new T.TorusGeometry(radius(t) * 1.04 + 0.003, 0.0045, 6, 36), this.mat.collar);
        b.collar.position.copy(at);
        b.collar.quaternion.setFromUnitVectors(new V(0, 0, 1), tan);
        b.collar.visible = false;
      }
      // the spine: a faint dashed line along the whole limb while it is still a stub
      b.spine = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(40)), this.mat.spine.clone());
      b.spine.computeLineDistances();
      // two forks near the end are part of the limb
      const sub = (t, s, len, i) => {
        const at = curve.getPointAt(t);
        const tan = curve.getTangentAt(t).normalize();
        const dir = side.clone().multiplyScalar(s * 0.72).addScaledVector(up, 0.5).addScaledVector(tan, 0.38).normalize();
        const tw = new T.CatmullRomCurve3([
          at.clone(),
          at.clone().addScaledVector(dir, len * 0.4).add(new V(0, len * 0.05, 0)),
          at.clone().addScaledVector(dir, len * 0.75).add(new V(0, len * 0.14, 0)),
          at.clone().addScaledVector(dir, len).add(new V(0, len * 0.26, 0)),
        ]);
        const m = new T.Mesh(tube(tw, 14, 6, taper(radius(t) * 0.6, 0.004), 11 + i * 2.3, 0.05), mat);
        m.userData.driver = id;
        grow(m, 0);
        return { t, curve: tw, mesh: m, f: 0 };
      };
      b.subs.push(sub(0.64, 1, L * 0.36, 0), sub(0.8, -1, L * 0.28, 1));
      b.subs.forEach((s) => this.tree.add(s.mesh));
      this.tree.add(mesh, cap, b.collar, b.spine);
      grow(mesh, 0);
      return b;
    }

    /** the control section's host: the trunk's upper third carries twigs like a limb does. It is not a limb: it has no stub,
        no fill, no collar and no place in this.branches; its twigs stand round the trunk and select 'trunk' */
    buildControl() {
      const V = T.Vector3;
      const pts = [];
      for (let i = 0; i <= 4; i++) pts.push(this.trunkCurve.getPointAt(lerp(CONTROL.t0, CONTROL.t1, i / 4)));
      const mat = this.hookWave(this.mat.bark.clone());
      mat.transparent = true;
      // ensureTwig alternates the side's sign by slot; the sign is folded in here so slot i stands at its own azimuth
      const sides = [];
      for (let i = 0; i < TWIG_SLOTS; i++) { const a = CONTROL.az0 + CONTROL.azStep * i, sg = i % 2 ? 1 : -1; sides.push(new V(Math.cos(a) * sg, 0, Math.sin(a) * sg)); }
      return { id: 'control', driver: 'trunk', onTrunk: true, L: CONTROL.L, curve: new T.CatmullRomCurve3(pts), mat, side: sides[0], sideAt: (i) => sides[i], up: new V(0, 1, 0),
        subs: [], twigs: new Array(TWIG_SLOTS).fill(null), stub: false, stubK: 0, fill: 0, f: 0, hold: null };
    }
    /** a limb by id, or the control host for 'control' (twigs only) */
    twigHost(id) { return id === 'control' ? this.ctl : this.branches.get(id); }

    /** a twig slot's place on its limb */
    twigT(i) { return TWIG_T0 + ((TWIG_T1 - TWIG_T0) * i) / (TWIG_SLOTS - 1); }
    /** how far a twig's cluster spreads, by grade 1..5 */
    twigRadius(grade) { return 0.11 + 0.02 * grade; }
    /** where slot i's twig ends, in the tree's own space, whether or not the twig is built yet */
    twigTipLocal(b, i) {
      if (b.twigs[i]) return b.twigs[i].curve.getPointAt(1);
      const t = this.twigT(i);
      const at = b.curve.getPointAt(t);
      const tan = b.curve.getTangentAt(t).normalize();
      const len = b.L * (0.2 - 0.006 * i);
      const dir = (b.sideAt ? b.sideAt(i) : b.side).clone().multiplyScalar((i % 2 ? 1 : -1) * 0.8).addScaledVector(b.up, 0.45).addScaledVector(tan, 0.3).normalize();
      return at.addScaledVector(dir, len).add(new T.Vector3(0, len * 0.28, 0));
    }
    /** the twig for slot i, built the first time it is needed */
    ensureTwig(b, i) {
      if (b.twigs[i]) return b.twigs[i];
      const V = T.Vector3;
      const t = this.twigT(i);
      const at = b.curve.getPointAt(t);
      const tan = b.curve.getTangentAt(t).normalize();
      const s = i % 2 ? 1 : -1;
      const len = b.L * (0.2 - 0.006 * i);
      const dir = (b.sideAt ? b.sideAt(i) : b.side).clone().multiplyScalar(s * 0.8).addScaledVector(b.up, 0.45).addScaledVector(tan, 0.3).normalize();
      const curve = new T.CatmullRomCurve3([
        at.clone(),
        at.clone().addScaledVector(dir, len * 0.4).add(new V(0, len * 0.06, 0)),
        at.clone().addScaledVector(dir, len * 0.75).add(new V(0, len * 0.16, 0)),
        at.clone().addScaledVector(dir, len).add(new V(0, len * 0.28, 0)),
      ]);
      const mesh = new T.Mesh(tube(curve, 10, 5, taper(TWIG_R, 0.003), 23 + i * 1.7 + ORDER.indexOf(b.id) * 5, 0.05), b.mat);
      mesh.userData.driver = b.driver || b.id;
      grow(mesh, 0);
      this.tree.add(mesh);
      const tip = curve.getPointAt(1);
      const tipTan = curve.getTangentAt(1).normalize();
      const bud = new T.Mesh(this.budGeo, this.mat.bud);
      bud.position.copy(tip);
      bud.scale.setScalar(0.001);
      bud.userData.driver = b.driver || b.id;
      const ring = new T.Mesh(this.ringGeo, this.mat.bud);
      ring.position.copy(tip);
      ring.quaternion.setFromUnitVectors(new V(0, 0, 1), tipTan);
      ring.visible = false;
      ring.userData.driver = b.driver || b.id;
      const cutAt = curve.getPointAt(0.4), cutTan = curve.getTangentAt(0.4).normalize();
      const cut = new T.Mesh(this.cutGeo, this.mat.cutFace);
      cut.position.copy(cutAt);
      cut.quaternion.setFromUnitVectors(new V(0, 0, 1), cutTan);
      cut.visible = false;
      cut.userData.driver = b.driver || b.id;
      this.tree.add(bud, ring, cut);
      const seed = 400 + ORDER.indexOf(b.id) * TWIG_SLOTS + i;
      const grade = 3;
      const tw = { i, t, curve, mesh, bud, ring, cut, f: 0, shownAt: 0, openAt: 0, leafOn: false, state: null, grade, kind: 'you', born: 0, id: null,
        pos: tip.clone().add(new V(0, 0.05, 0)), radius: this.twigRadius(grade), leaves: leafBall(rng(seed), TWIG_BALL, TWIG_LEAVES), colours: null, count: 0,
        sprigs: null, homes: null };
      b.twigs[i] = tw;
      return tw;
    }
    /** the sprigs on a twig, from its bins' counts (sprigCounts) or null. Built when the counts change, removed when they go.
        True when anything changed, so the caller lets the leaves unfold again. */
    setSprigs(b, tw, counts) {
      const sig = counts ? counts.join(',') : '';
      if ((tw.sprigs ? tw.sprigs.sig : '') === sig) return false;
      this.dropSprigs(tw);
      if (!counts) return true;
      const V = T.Vector3;
      // short against a limb, but long enough that the four tufts stand apart from the twig's own and from each other
      const len = clamp(b.L * (0.2 - 0.006 * tw.i) * 1.25, SPRIG_LEN[0], SPRIG_LEN[1]);
      const list = [];
      for (let k = 0; k < SPRIG_BINS; k++) {
        const n = counts[k];
        if (!n) continue;
        const t = SPRIG_T[0] + ((SPRIG_T[1] - SPRIG_T[0]) * k) / (SPRIG_BINS - 1);
        const at = tw.curve.getPointAt(t);
        const tan = tw.curve.getTangentAt(t).normalize();
        const u = new V().crossVectors(tan, Z_UP).normalize(); // level, across the twig
        const v = new V().crossVectors(u, tan).normalize();    // across the twig, upward
        const a = SPRIG_FAN[k];
        const dir = tan.clone().multiplyScalar(0.5).addScaledVector(u, Math.cos(a) * 0.9).addScaledVector(v, Math.sin(a) * 0.9).normalize();
        const curve = new T.CatmullRomCurve3([
          at.clone(),
          at.clone().addScaledVector(dir, len * 0.5).add(new V(0, len * 0.05, 0)),
          at.clone().addScaledVector(dir, len).add(new V(0, len * 0.16, 0)),
        ]);
        const mesh = new T.Mesh(tube(curve, 6, 5, taper(TWIG_R * 0.6, 0.002), 61 + k * 3.1 + tw.i * 1.3, 0.04), b.mat);
        mesh.userData.driver = b.id;
        grow(mesh, 0);
        this.tree.add(mesh);
        const radius = 0.05 + 0.012 * n; // one client .062, five .11
        list.push({ bin: k, n, t, curve, mesh, f: 0, home: { pos: curve.getPointAt(1).add(new V(0, 0.02, 0)), radius, rk: radius / TWIG_BALL, lag: SPRIG_LAG, leafK: SPRIG_LEAF_K } });
      }
      tw.sprigs = { sig, list, openAt: 0, main: { pos: tw.pos, radius: tw.radius, rk: tw.radius / TWIG_BALL, lag: 0, leafK: 1 } };
      tw.homes = new Array(TWIG_LEAVES).fill(null);
      return true;
    }
    dropSprigs(tw) {
      if (!tw.sprigs) return;
      tw.sprigs.list.forEach((sp) => { this.tree.remove(sp.mesh); sp.mesh.geometry.dispose(); });
      tw.sprigs = null;
      tw.homes = null;
    }
    /** which leaf goes where on a twig with sprigs: the first leaves stay at the tip (6, or what the grade leaves over),
        then 8 per client on each sprig in bin order. The twig never draws more than TWIG_LEAVES. */
    layoutSprigs(tw) {
      const S = tw.sprigs;
      let onSprigs = 0;
      S.list.forEach((sp) => { onSprigs += sp.n * SPRIG_PER; });
      const main = clamp(tw.count - onSprigs, 6, TWIG_LEAVES - onSprigs);
      tw.count = main + onSprigs;
      tw.radius = 0.07 + 0.003 * main;
      S.main.radius = tw.radius;
      S.main.rk = tw.radius / TWIG_BALL;
      let j = 0;
      for (; j < main; j++) tw.homes[j] = S.main;
      S.list.forEach((sp) => { for (let q = 0; q < sp.n * SPRIG_PER; q++) tw.homes[j++] = sp.home; });
      for (; j < TWIG_LEAVES; j++) tw.homes[j] = null;
    }

    /* ---------- leaves: the crown's own clusters (results only) and one cluster per answered twig ---------- */
    buildLeaves() {
      this.leafCap = BASE_CLUSTERS * LEAVES_PER + (ORDER.length + 1) * TWIG_SLOTS * TWIG_LEAVES; // six limbs and the trunk's upper third (control)
      this.leafMesh = new T.InstancedMesh(this.leafGeo, this.mat.leaf, this.leafCap);
      this.fruitMesh = new T.InstancedMesh(this.fruitGeo, this.mat.fruit, FRUIT_SLOTS);
      [this.leafMesh, this.fruitMesh].forEach((m) => { m.count = 0; m.frustumCulled = false; this.tree.add(m); });
      this.leafMesh.setColorAt(0, new T.Color(1, 1, 1));
      this.clusters = [];
      this.leaves = [];
    }
    /** the crown's clusters: limb tips, the forks, the leaders and the trunk top */
    layoutLeaves() {
      const V = T.Vector3;
      const r = rng(97);
      this.clusters = [];
      const add = (owner, pos, radius, grown) => this.clusters.push({ owner, pos, radius, grown, k: -1 });
      this.branches.forEach((b) => {
        const tip = b.curve.getPointAt(1);
        add(b.id, tip.clone().add(new V(0, 0.06, 0)), 0.2 + 0.06 * b.L, () => clamp((b.f - 0.78) / 0.22));
        [0.58, 0.8].forEach((t) => add(b.id, b.curve.getPointAt(t).clone().add(new V(0, 0.1, 0)), 0.15 + 0.05 * b.L, () => clamp((b.f - t) / 0.2)));
        b.subs.forEach((s) => add(b.id, s.curve.getPointAt(1).clone().add(new V(0, 0.04, 0)), 0.17 + 0.05 * b.L, () => clamp((s.f - 0.6) / 0.4)));
      });
      this.leader.forEach((l) => add('trunk', l.curve.getPointAt(1).clone().add(new V(0, 0.05, 0)), 0.2, () => clamp((l.f - 0.6) / 0.4)));
      const top = this.trunkCurve.getPointAt(1);
      add('trunk', top.clone().add(new V(0, 0.22, 0)), 0.24, () => clamp((this.trunkF - 0.9) / 0.1));
      this.leaves = [];
      this.clusters.forEach((c, ci) => leafBall(r, c.radius, LEAVES_PER).forEach((lf) => { lf.c = ci; this.leaves.push(lf); }));
      this.leafLit = -1;
      this.recolourLeaves();
    }
    /** ambient shading: darker inside the crown and underneath, lighter at the top and the outside */
    leafShade(x, y, z, offY, radius) {
      return clamp(0.62 + 0.3 * clamp(Math.hypot(x, z) / 1.3) + 0.18 * clamp((y - 1.3) / 1.4) + 0.1 * clamp(offY / radius), 0.55, 1.15);
    }
    /** leaf colours: the crown in the theme's green; a twig's cluster in its source colour; on the results the leaves
        past the chance of reaching the goal are dry. A selected limb keeps its colour while the rest fall back a little. */
    recolourLeaves(litShare) {
      const base = new T.Color(this.pal.leaf), dry = new T.Color(this.pal.leafDry), c = new T.Color();
      const encode = typeof litShare === 'number';
      const fog = this.fogK || 0;
      const sel = this.fogOwner;
      const tint = (col, owner) => (fog > 0.001 && owner !== sel ? col.offsetHSL(0, -0.2 * fog, 0).lerp(this.fogColor, 0.08 * fog) : col);
      // setPartState('crown', { state: 'unknown' }): the crown's own leaves fade toward the sky (the pale treatment for foliage)
      const pale = this.crownPaleK || 0;
      this.leafColours = this.leaves.map((lf) => {
        const cl = this.clusters[lf.c];
        const ao = this.leafShade(cl.pos.x + lf.off.x, cl.pos.y + lf.off.y, cl.pos.z + lf.off.z, lf.off.y, cl.radius);
        const col = c.copy(encode && lf.rank >= litShare ? dry : base).clone().offsetHSL(lf.hs, 0, lf.ls).multiplyScalar(ao);
        if (pale > 0.001) col.lerp(this.fogColor, 0.62 * pale);
        return tint(col, cl.owner);
      });
      this.twigHosts.forEach((b) => b.twigs.forEach((tw) => {
        if (!tw || !(tw.state === 'leaf' || tw.state === 'estimate')) return;
        const src = this.src[tw.state === 'estimate' ? 'estimate' : tw.kind] || this.src.assumed;
        tw.colours = tw.leaves.map((lf, j) => {
          // a leaf on a sprig is shaded where it stands; its colour is still the twig's source
          const hm = (tw.homes && tw.homes[j]) || null;
          const at = hm ? hm.pos : tw.pos, rad = hm ? hm.radius : tw.radius, rk = rad / TWIG_BALL;
          const ao = this.leafShade(at.x + lf.off.x * rk, at.y + lf.off.y * rk, at.z + lf.off.z * rk, lf.off.y * rk, rad);
          const col = c.copy(src).clone().offsetHSL(lf.hs, 0, lf.ls * 0.6).multiplyScalar(0.85 + 0.25 * (ao - 0.6));
          if (encode && lf.rank >= litShare) col.lerp(dry, 0.55);
          return tint(col, b.id);
        });
      }));
      this.leafDirty = true;
    }

    /* ---------- Rebuild 1 (R10): the goal marker and the plan silhouette ---------- */
    /** the marker: a thin flat ring at the target height (a metric) or at a fixed height (a milestone). Its radius is the
        crown's envelope at that size, so it is the crown's outline at the target; remade by layoutMarker, never per frame */
    buildMarker() {
      // the crown's width near its top (the upper limbs' envelope), not the widest part low on the trunk: the ring is the
      // crown's outline where it stands, so the frame does not widen by the low limbs' reach
      this.envR = 0;
      this.env.forEach((e) => { if (e.y1 >= METRIC.upper * this.envTop) this.envR = Math.max(this.envR, e.r); });
      if (!this.envR) this.env.forEach((e) => { this.envR = Math.max(this.envR, e.r); });
      this.markerMat = new T.MeshBasicMaterial({ color: this.markerCol.clone(), transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
      this.marker = new T.Mesh(ringGeo(1, GOAL.w, 1, 1), this.markerMat);
      this.marker.visible = false;
      this.marker.renderOrder = 4;
      this.scene.add(this.marker);
      this.layoutMarker();
    }
    /** the plan silhouette: the wood (trunk, leaders, limbs, forks) and one sphere per crown cluster in one translucent flat
        material, in a group scaled to the scenario's height. Drawn over the tree, so a plan smaller than today still shows.
        Built once; setView eases it in and out. */
    buildPlan() {
      const mat = new T.MeshBasicMaterial({ color: this.planCol.clone(), transparent: true, opacity: 0, depthWrite: false, depthTest: false });
      this.planMat = mat;
      const g = new T.Group();
      const full = (src) => {
        const geo = src.geometry.clone();
        const { segs, radial } = src.geometry.userData;
        geo.setDrawRange(0, segs * radial * 6);
        const m = new T.Mesh(geo, mat);
        m.renderOrder = 5;
        return m;
      };
      g.add(full(this.trunk));
      this.leader.forEach((l) => g.add(full(l.mesh)));
      this.branches.forEach((b) => { g.add(full(b.mesh)); b.subs.forEach((s) => g.add(full(s.mesh))); });
      // the crown the plan would carry is one thin ring at the silhouette's own top, the target ring's twin in the plan's
      // colour. (Translucent balls over the live crown read as a haze round it, which is the glow the brief rules out.)
      const crown = new T.Mesh(new T.TorusGeometry(this.envR, METRIC.tube, 5, 128), mat);
      crown.rotation.x = Math.PI / 2;
      crown.position.y = this.envTop;
      crown.renderOrder = 5;
      g.add(crown);
      g.visible = false;
      this.plan = g;
      this.planOn = false;
      this.planT0 = 0;
      this.planFrom = 0;
      this.world.add(g);
    }
    /** the crown's scale for a value on the metric's axis (METRIC): linear, value 0 at the floor, the target at H_GOAL */
    metricScale(v) {
      const m = this.metric;
      if (!m) return METRIC.goal / UNIT_H;
      return (METRIC.floor + (METRIC.goal - METRIC.floor) * clamp((+v || 0) / m.target, 0, METRIC.cap)) / UNIT_H;
    }
    /** the crown's top for a value, in world units: what an inspector can state (heights are linear above a fixed floor) */
    heightOf(v) { return this.envTop * this.metricScale(v); }
    /** where the ring stands: the crown's top and width at the target's size (a milestone: at H_GOAL). Task 20: a numeric
        target is a dashed muted red line, a milestone a solid neutral hairline, so the two are told apart at a glance. */
    layoutMarker() {
      const sRing = this.metric ? this.metricScale(this.metric.target) : METRIC.goal / UNIT_H;
      const kind = this.metric ? 'goal' : this.metric === null ? 'milestone' : 'none';
      this.ringY = this.envTop * sRing;
      this.ringR = this.envR * sRing * METRIC.ringPad;
      if (!this.marker) return;
      if (Math.abs((this.ringBuiltR || 0) - this.ringR) > 0.0005 || kind !== this.markerKind) {
        this.ringBuiltR = this.ringR;
        this.marker.geometry.dispose();
        this.marker.geometry = kind === 'goal' ? ringGeo(this.ringR, GOAL.w, GOAL.dashes, GOAL.duty) : ringGeo(this.ringR, METRIC.tube * 2, 1, 1);
      }
      this.markerKind = kind;
      this.markerMat.color.copy(kind === 'goal' ? this.goalCol : this.markerCol);
      this.marker.position.y = this.ringY;
    }
    /** true when the marker (and the plan silhouette) is in play: a metric or a milestone was set and the tree encodes */
    markerShown() { return this.metric !== undefined && (this.encoding() || !!this.markerAlways); }
    /** the goal marker (R10, brief 5.4). setMetric({ baseline, scenario, target, label, unit }): one linear mapping from value
        to crown height for all three (METRIC, heightOf): the current crown stands at the baseline, a thin labelled ring at the
        target height, and setView('plan') shows a translucent silhouette at the scenario height; a scenario past the target
        rises past the ring and the frame still fits everything. `label` is the ring's whole text ("Target: £12,000 a month in
        12 months"); without it "Target: <target> <unit>" is made. `scenarioLabel` and `baselineLabel` name the other two.
        setMetric(null, 'First paying customer') or setMetric({ milestone: 'First paying customer' }) when there is no scalar
        metric: a labelled ring at a fixed height and nothing implies a number (the tree keeps its interview size, no leaf
        dries, no fruit). The marker shows once the tree encodes (the results); { always: true } shows it before that. */
    setMetric(m, opts) {
      const o = typeof opts === 'string' ? { label: opts } : opts || {};
      const scalar = m && typeof m === 'object' && isFinite(+m.target) && +m.target > 0 && m.milestone === undefined;
      if (scalar) {
        const target = +m.target;
        this.hasBaseline = isFinite(+m.baseline);
        this.metric = { baseline: this.hasBaseline ? Math.max(0, +m.baseline) : 0, scenario: m.scenario == null || !isFinite(+m.scenario) ? null : Math.max(0, +m.scenario), target,
          unit: m.unit == null ? '' : String(m.unit), label: m.label == null ? '' : String(m.label), horizon: m.horizon == null ? '' : String(m.horizon),
          scenarioLabel: m.scenarioLabel == null ? '' : String(m.scenarioLabel), baselineLabel: m.baselineLabel == null ? '' : String(m.baselineLabel) };
        // Task 20: Now and Target are written from one metric, one unit and one horizon, so the two can never disagree.
        // Now is shown only when a baseline was given: an unknown today is never printed as a figure.
        const hz = this.metric.horizon ? ` ${/^(by|in|over|within|before)\b/i.test(this.metric.horizon) ? this.metric.horizon : `by ${this.metric.horizon}`}` : '';
        this.metricLabel = this.metric.label || `Target: ${fmtValue(target, this.metric.unit)}${hz}`;
        this.nowLabel = this.metric.baselineLabel || (this.hasBaseline ? `Now: ${fmtValue(this.metric.baseline, this.metric.unit)}` : '');
      } else {
        this.hasBaseline = false;
        this.nowLabel = '';
        this.metric = null;
        const given = m && typeof m === 'object' ? (m.milestone != null ? String(m.milestone) : m.label != null ? String(m.label) : '') : '';
        const text = given || (o.label == null ? '' : String(o.label));
        this.metricLabel = text ? (/^(milestone|next)\b/i.test(text) ? text : `Milestone: ${text}`) : 'Next milestone';
      }
      this.markerAlways = !!o.always;
      this.layoutMarker();
      this.groupsDirty = true;
      this.refitAt = 0;
      this.refit(reduce() ? 0 : 900); // the ring and the scenario are part of the whole: the frame follows them
      this.start();
      return this.metric;
    }
    /** what setMetric holds: undefined (never set), null (a milestone) or the metric */
    getMetric() { return this.metric; }
    /** Task 20: Now and Target as the tree shows them, from one metric, one unit and one horizon. `now` is null when no
        baseline was given (nothing stands in for it), `kind` is 'goal' or 'milestone', and `same` says the pair was written
        from the one metric, which is the whole point of reading it from here rather than composing two labels elsewhere. */
    metricPair() {
      const m = this.metric;
      if (m === undefined) return null;
      if (m === null) return { kind: 'milestone', now: null, target: null, unit: '', horizon: '', nowText: '', targetText: this.metricLabel, same: true };
      return { kind: 'goal', now: this.hasBaseline ? m.baseline : null, target: m.target, unit: m.unit, horizon: m.horizon,
        nowText: this.nowLabel, targetText: this.metricLabel, scenario: m.scenario, same: true };
    }
    /** Task 20: what the tree's height means as it stands. 'outcome' only with a scalar metric set: without one the tree keeps
        one size, so answering more questions can never look like earning more money. */
    heightMeans() { return this.encoding() && this.metric ? 'outcome' : 'nothing'; }
    /** the results' Current / Plan view (brief 5.5): 'plan' shows the translucent silhouette at the scenario height over the
        current crown, eased over METRIC.ms (a cut under reduced motion); 'current' takes it away. Emits 'view' { view }. */
    setView(v) {
      const view = VIEWS.includes(v) ? v : 'current';
      if (view !== this.view) { this.view = view; this.groupsDirty = true; this.emit('view', { view }); this.start(); }
      return this.view;
    }
    getView() { return this.view; }

    /* ---------- what the page tells the tree ---------- */

    /** a limb is a pale stub until its section is entered */
    setStub(id, on) {
      const b = this.branches.get(id);
      if (b) b.stub = !!on;
    }
    /** the twigs on a limb, by slot: [{ id, state: 'bud'|'leaf'|'estimate'|'ring'|'cut', grade 1..5, kind, parts }] (index = slot,
        max 12). parts is optional: [warm11, warm1m, cold11, cold1m], the sorter's counts; a leaf twig that carries it fans one
        short sprig per non-zero bin, each with 8 of the twig's leaves per client. The sprigs go when the state is no longer
        'leaf' or parts is no longer sent. */
    setTwigs(id, list) {
      const b = this.twigHost(id);
      if (!b) return;
      const now = performance.now();
      const arr = Array.isArray(list) ? list.slice(0, TWIG_SLOTS) : [];
      for (let i = 0; i < TWIG_SLOTS; i++) {
        const q = arr[i];
        if (!q || !TWIG_STATES.includes(q.state)) {
          const old = b.twigs[i];
          if (old && (old.state || old.sprigs)) { old.state = null; old.count = 0; old.shownAt = 0; this.dropSprigs(old); this.leafDirty = true; }
          continue;
        }
        const tw = this.ensureTwig(b, i);
        const kind = KINDS.includes(q.kind) ? q.kind : 'you';
        const grade = clamp(Math.round(+q.grade || 3), 1, 5);
        const state = q.state;
        const leafy = state === 'leaf' || state === 'estimate';
        if (!tw.state) tw.shownAt = now;
        if (leafy && (tw.state !== state || !tw.born)) tw.born = now;
        if (tw.state !== state || tw.kind !== kind || tw.grade !== grade || tw.id !== q.id) this.leafDirty = true;
        tw.state = state;
        tw.kind = kind;
        tw.grade = state === 'estimate' ? 2 : grade;
        tw.id = q.id == null ? null : String(q.id);
        tw.count = leafy ? 6 + 8 * tw.grade : 0;
        tw.radius = this.twigRadius(tw.grade);
        if (this.setSprigs(b, tw, state === 'leaf' ? sprigCounts(q.parts) : null)) { this.leafDirty = true; if (leafy) tw.born = now; }
        if (tw.sprigs) this.layoutSprigs(tw);
      }
      if (this.leafDirty) { this.leafLit = -3; }
    }
    /** how much of the limb's section is answered, 0..1: the limb lengthens from the stub with it */
    setLimbFill(id, f) {
      const b = this.branches.get(id);
      if (b) b.fill = clamp(+f || 0);
    }
    /** the binding limb wears the collar; null clears it. Its group's label shows expanded (the critical constraint) */
    setCollar(id) { const was = this.collarOn; this.collarOn = this.branches.has(id) ? id : null; if (was !== this.collarOn) this.groupsDirty = true; }
    /** R9 / R10: the evidence behind a part. setPartState(part, { name, value, state, unit }) for the six limbs, 'control',
        'trunk', 'roots' and 'crown'; state is user | imported | source | assumed | calculated | unknown. The part's group label
        shows "name · value · evidence word" (EVIDENCE) when expanded, and the part's material follows the state: unknown is
        the pale, low-opacity bark of a stub (a pale trunk, pale roots, a crown faded toward the sky), anything evidence-backed
        is solid. null clears the part (the older setStub / setTrunkKnown calls rule it again). */
    setPartState(part, st) {
      const id = part === 'you' ? 'trunk' : String(part || '');
      if (!PARTS.includes(id)) return null;
      if (st == null) { delete this.partState[id]; }
      else {
        const o = typeof st === 'string' ? { state: st } : st;
        const state = STATES.includes(o.state) ? o.state : 'unknown';
        const cur = this.partState[id] || (this.partState[id] = { name: '', value: '', state: 'unknown', unit: '' });
        cur.name = o.name == null ? PART_WORDS[id] : String(o.name);
        cur.value = fmtValue(o.value, o.unit == null ? '' : String(o.unit));
        cur.unit = o.unit == null ? '' : String(o.unit);
        cur.state = state;
      }
      if (id === 'trunk') { const s = this.partState.trunk; if (s) { this.trunkKnown = s.state !== 'unknown'; this.trunkKnownSet = true; } }
      this.groupsDirty = true;
      this.branchDirty = true; // the inspector's Now line reads this part
      this.start();
      return this.partState[id] || null;
    }
    /** every part's state as set, by part id */
    partStates() { return this.partState; }
    /** which group's label is expanded during questioning: a group id, a part id (its group), or null for none. undefined
        (the default) reads the live label's part and the selection. The collar's group is always expanded too. */
    setActiveGroup(id) {
      const g = id == null ? id : GROUPS[id] ? id : GROUP_OF[id] || (id === 'trunk' || id === 'you' ? 'trunk' : id === 'roots' ? 'roots' : null);
      if (g !== this.activeGroup) { this.activeGroup = g; this.groupsDirty = true; this.start(); }
      return this.activeGroup;
    }
    /** the persistent labels: 'auto' (small, the active group and the constraint expanded; all expanded at the results),
        'all' (every label expanded), 'none' (no persistent label; the live label still shows) */
    setGroupLabels(mode) {
      const m = mode === 'all' || mode === 'none' ? mode : 'auto';
      if (m !== this.tagsOn) { this.tagsOn = m; this.groupsDirty = true; this.refitAt = 0; this.refit(reduce() ? 0 : 900); this.start(); } // the labels' room comes and goes with them
      return this.tagsOn;
    }
    /** a route's own words for the labels: setGroupWords({ trunk: { word: 'Concept', small: 'trunk' }, customers: { word: 'Opportunities' } }) */
    setGroupWords(map) {
      const m = map && typeof map === 'object' ? map : {};
      Object.keys(m).forEach((k) => {
        if (!GROUP_WORDS[k]) return;
        const v = m[k];
        if (v == null) { delete this.groupWords[k]; return; }
        const o = typeof v === 'string' ? { word: v } : v;
        this.groupWords[k] = { word: o.word == null ? GROUP_WORDS[k].word : String(o.word), small: o.small == null ? GROUP_WORDS[k].small : String(o.small) };
      });
      this.groupsDirty = true;
      this.start();
    }
    /** the group a part belongs to, or the part's own label id: 'customers' | 'offer' | 'delivery' | 'leverage' | 'trunk' | 'roots' | 'crown' | null */
    groupOf(part) {
      if (part && typeof part === 'object') {
        if (part.limb === 'control') return 'leverage';
        if (part.limb === 'trunk') return part.t !== undefined && +part.t >= CONTROL.t0 ? 'leverage' : 'trunk';
        return GROUP_OF[part.limb] || null;
      }
      if (part === 'trunk' || part === 'you') return 'trunk';
      if (part === 'roots' || part === 'crown') return part;
      return GROUP_OF[part] || (GROUPS[part] ? part : null);
    }
    /** the group in play, for the labels: the explicit one, else the live label's part, else the selection */
    activeGroupId() {
      if (this.activeGroup !== undefined) return this.activeGroup;
      const L = this.label;
      const fromLabel = L.part != null && L.text ? this.groupOf(L.part) : null;
      return fromLabel || (this.selected ? this.groupOf(this.selected) : null);
    }
    /** the limb a group's label stands by: the group's limb in play (the live label's or the selected one) else its first */
    groupLimb(L) {
      if (L.id === 'leverage' || !L.parts) return null;
      const lp = this.label.part, sel = this.selected;
      const live = lp && typeof lp === 'object' ? lp.limb : lp;
      if (live && L.parts.includes(live)) return live;
      if (sel && L.parts.includes(sel)) return sel;
      return L.parts[0];
    }
    /** older call: [{ id, state, weight }]; only 'binds' means anything now (the collar) */
    setDrivers(list) {
      (list || []).forEach((d) => { if (d && d.state === 'binds' && this.branches.has(d.id)) this.collarOn = d.id; });
    }
    /** results: progress 0..1+ from today's revenue to the goal, odds 0..1 of reaching it, profit 0..1, repeat 0..1 */
    setMetrics(m) { Object.assign(this.metrics, m || {}); }
    /** height, lit share and fruit read as numbers only once this is on (the crown stages set it) */
    setEncoding(on) { const v = !!on; if (v !== this.encode) { this.encode = v; this.groupsDirty = true; } }
    /** kept for older callers; the roots follow setRootSources and setRootBalance now */
    setRoots() {}
    /** how many facts came from each source: { you, sector, web, assumed, cv } */
    setRootSources(counts) {
      const c = counts || {};
      this.rootCounts = {};
      SRC.forEach((id) => { this.rootCounts[id] = Math.max(0, Math.round(+c[id] || 0)); });
      if (typeof c.cv === 'boolean') this.cvStrand = c.cv;
      this.roots.forEach((g) => { g.norm = clamp(Math.log1p(this.rootCounts[g.id]) / Math.log1p(24)); });
    }
    /** R_roots = crownRadius × ownShare; null returns the roots to their own sizing */
    setRootBalance(own) { this.rootBalance = own == null ? null : clamp(+own || 0); }
    /** the radius of the leaf envelope, in world units, from the live clusters */
    crownRadius() {
      let r = 0;
      this.clusters.forEach((c) => { if (c.k > 0.1) r = Math.max(r, Math.hypot(c.pos.x, c.pos.z) + c.radius * 0.6); });
      this.twigHosts.forEach((b) => b.twigs.forEach((tw) => { if (tw && tw.count && tw.kShown > 0.1) r = Math.max(r, Math.hypot(tw.pos.x, tw.pos.z) + tw.radius * 0.6); }));
      if (r === 0) this.branches.forEach((b) => { if (b.f > 0.05) { const p = b.curve.getPointAt(b.f); r = Math.max(r, Math.hypot(p.x, p.z)); } });
      return Math.max(0.4, r) * this.tree.scale.x;
    }
    /** the crown's own leaves (not answers): 0 during the interview, 1 for a full crown */
    setCrownLeaves(k) { this.crownTarget = clamp(+k || 0); }
    /** the bark wave, base to crown, 600 ms; the leaves lighten 6% for 300 ms */
    wave() { this.waveT0 = performance.now(); }
    setPlanted(v) { this.planted = !!v; if (v) this.trunkF = Math.max(this.trunkF, 0.999); }
    /** R6: is today's revenue known? Until it is, the trunk stands in the same pale, low-opacity bark as a limb's stub (no glow,
        nothing new drawn); when it turns true the trunk resolves at the stub's own rate (a cut under reduced motion).
        False on a fresh tree. The intro's demonstration tree shows a resolved trunk while the intro or the arrival frames it. */
    setTrunkKnown(on) { this.trunkKnown = !!on; this.trunkKnownSet = true; this.start(); return this.trunkKnown; }
    setMonths(total, lit) {
      this.months = Math.max(1, Math.min(12, Math.round(total)));
      this.lit = lit === undefined ? this.months : Math.max(0, Math.min(this.months, lit));
    }
    setTheme(mode) {
      this.pal = mode === 'dark' ? THEMES.dark : THEMES.light;
      const p = this.pal;
      this.readTokens();
      this.mat.bark.color.set(p.bark);
      this.branches.forEach((b) => { b.mat.color.set(p.bark); b.spine.material.color.set(p.spine); });
      SRC.forEach((id) => this.mat.roots[id].color.copy(this.rootTint(id)));
      this.mat.fruit.color.set(p.fruit);
      this.mat.cutFace.color.set(p.cutFace);
      this.mat.bud.color.copy(this.budCol);
      this.mat.collar.color.copy(this.collarCol);
      this.mat.shadow.color.set(p.shadow);
      this.mat.shadow.opacity = p.shadowA;
      this.renderer.toneMappingExposure = p.exposure;
      this.hemi.intensity = p.hemi;
      this.key.intensity = p.key;
      this.leafLit = -3;
    }
    /** the business name, for the possessive; nothing is drawn in the scene from it */
    setName(name) {
      this.name = String(name || '').trim();
      return possessive(this.name);
    }
    /** a selected limb keeps its colour while the other limbs ease back toward the sky; 'trunk' | 'roots' | 'crown' | limb | null */
    select(id) { const v = id === 'control' ? 'trunk' : id || null; if (v !== this.selected) { this.selected = v; this.groupsDirty = true; } } // the control section is the trunk's upper third
    /** kept for callers: nothing on the tree is highlighted by a legend now */
    highlight() {}
    /** for the intro beats: everything but one part fades back. 'roots' | 'trunk' | 'branches' | 'leaves' | null */
    showPart(part) { this.part = ['roots', 'trunk', 'branches', 'leaves'].includes(part) ? part : null; }
    /** older call: the v11 data map, routed to twigs by driver and to the roots by kind */
    setData(list) {
      const by = {};
      const counts = { you: 0, sector: 0, web: 0, assumed: 0 };
      (Array.isArray(list) ? list : []).forEach((q) => {
        if (!q) return;
        const kind = q.kind === 'skip' ? 'assumed' : SRC.includes(q.kind) ? q.kind : 'assumed';
        counts[kind] += 1;
        if (!this.branches.has(q.driver)) return;
        (by[q.driver] = by[q.driver] || []).push({ id: q.id, state: q.kind === 'skip' ? (q.value ? 'estimate' : 'ring') : 'leaf', grade: clamp(1 + Math.round((+q.size || 0) * 4), 1, 5), kind });
      });
      ORDER.forEach((id) => this.setTwigs(id, by[id] || []));
      this.setRootSources(counts);
    }
    /** older calls: the camera goes to a limb, the trunk or the roots */
    focusBranch(id) { this.frame(id && this.branches.has(id) ? LIMB_SECTION[id] : id === 'trunk' ? 'you' : id === 'roots' ? 'ground' : 'explore'); }
    focus(id) { this.focusBranch(id); }
    lockDrag(on) { this.dragLocked = !!on; if (on) this.drag = null; }

    /* ---------- the live label, the Core and the discs: DOM placed each frame ---------- */
    /** one label for the part in play; part = limb id | 'trunk' | 'roots' | 'crown' | { limb, t } | null */
    setLabel(part, text) {
      const L = this.label;
      if (!L.el) {
        L.el = document.getElementById('label');
        if (!L.el) {
          L.el = document.createElement('div');
          L.el.className = 'tag';
          L.el.innerHTML = '<i></i><span></span>';
          (this.tags ? this.tags.box : document.body).appendChild(L.el);
        }
      }
      L.part = part == null ? null : part;
      const key = part && typeof part === 'object' ? `${part.limb}@${part.t}@${part.twig}` : String(part);
      if (key !== L.key) { L.key = key; L.pick = -1; L.side = 0; L.swapAt = 0; this.groupsDirty = true; } // a new part: a new place, found afresh; the active group may change
      L.echoAt = 0; // the panel may have changed with this call: read it again on the next frame
      const next = String(text == null ? '' : text);
      if (next === L.text) return;
      this.groupsDirty = true;
      const span = L.el.querySelector('span') || L.el;
      if (L.timer) clearTimeout(L.timer);
      if (!L.text || reduce()) { span.textContent = next; L.text = next; return; }
      L.el.style.opacity = '0';
      L.vis = false;
      L.timer = setTimeout(() => { span.textContent = next; L.text = next; L.timer = 0; }, 120);
    }
    /** a point of the tree's (or the world's) own space on the screen, nothing allocated: this.sx, this.sy in px and this.sd,
        its distance from the camera. False when it is behind the camera. Call after the frame's render (the matrices are fresh). */
    toPx(space, x, y, z) {
      const v = this.lv;
      v.set(x, y, z);
      space.localToWorld(v);
      this.sd = Math.max(0.05, v.distanceTo(this.camera.position));
      v.project(this.camera);
      this.sx = ((v.x + 1) / 2) * this.size.w;
      this.sy = ((1 - v.y) / 2) * this.size.h;
      return v.z < 1;
    }
    /** one more thing the label must not touch, as [x, y, r] px in this.obs; n is the fill so far and comes back advanced */
    obsAt(n, space, x, y, z, rWorld, pxPerUnit) {
      if (n > this.obs.length - 3 || !this.toPx(space, x, y, z)) return n;
      this.obs[n] = this.sx;
      this.obs[n + 1] = this.sy;
      this.obs[n + 2] = Math.max(3, (rWorld * pxPerUnit) / this.sd);
      return n + 3;
    }
    /** everything drawn that a label could sit on, for this frame: the grown wood, the live leaf clusters (the crown's, the
        twigs', the sprigs'), the root strands and the discs. Returns the fill of this.obs. */
    labelObstacles() {
      const s = this.tree.scale.x;
      const f = (this.size.h / 2 / Math.tan((this.camera.fov * Math.PI) / 360)) * this.zoom.k; // px per unit at unit distance, as zoomed
      const ft = f * s; // a length in the tree's own space is s times as long in the world
      let n = 0;
      const tr = this.woodTrunk;
      for (let i = 0; i < tr.length; i += 5) if (tr[i + 4] <= this.trunkF + 0.03) n = this.obsAt(n, this.tree, tr[i], tr[i + 1], tr[i + 2], tr[i + 3], ft);
      for (let li = 0; li < this.limbList.length; li++) {
        const b = this.limbList[li];
        if (b.wood && b.f > 0.02) { const wd = b.wood; for (let i = 0; i < wd.length; i += 5) if (wd[i + 4] <= b.f + 0.04) n = this.obsAt(n, this.tree, wd[i], wd[i + 1], wd[i + 2], wd[i + 3], ft); }
        for (let i = 0; i < TWIG_SLOTS; i++) {
          const tw = b.twigs[i];
          if (!tw || !(tw.kShown > 0.1)) continue;
          n = this.obsAt(n, this.tree, tw.pos.x, tw.pos.y, tw.pos.z, tw.radius * 1.1, ft);
          if (tw.sprigs) for (let q = 0; q < tw.sprigs.list.length; q++) { const hm = tw.sprigs.list[q].home; n = this.obsAt(n, this.tree, hm.pos.x, hm.pos.y, hm.pos.z, hm.radius * 1.1, ft); }
        }
      }
      for (let i = 0; i < this.clusters.length; i++) { const c = this.clusters[i]; if (c.k > 0.1) n = this.obsAt(n, this.tree, c.pos.x, c.pos.y, c.pos.z, c.radius * 1.1 * c.k, ft); }
      for (let i = 0; i < this.roots.length; i++) {
        const g = this.roots[i];
        for (let q = 0; q < g.strands.length; q++) { const st = g.strands[q]; if (st.f < 0.3) continue; for (let k = 0; k < 12; k += 3) n = this.obsAt(n, this.world, st.wood[k], st.wood[k + 1], st.wood[k + 2], 0.05, f); }
      }
      for (let i = 0; i < this.discs.length; i++) { const d = this.discs[i]; if (d.r > 0 && n <= this.obs.length - 3) { this.obs[n] = d.x; this.obs[n + 1] = d.y; this.obs[n + 2] = d.r + 4; n += 3; } }
      // Rebuild 1: the marker ring (24 points round it) and the plan silhouette's wood at its own scale
      if (this.marker && this.marker.visible) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; n = this.obsAt(n, this.scene, Math.cos(a) * this.ringR, this.ringY, Math.sin(a) * this.ringR, 0.02, f); }
      if (this.plan && this.plan.visible) {
        const fp = f * this.plan.scale.x;
        for (let i = 0; i < tr.length; i += 5) n = this.obsAt(n, this.plan, tr[i], tr[i + 1], tr[i + 2], tr[i + 3], fp);
        for (let li = 0; li < this.limbList.length; li++) { const wd = this.limbList[li].wood; if (wd) for (let i = 0; i < wd.length; i += 10) n = this.obsAt(n, this.plan, wd[i], wd[i + 1], wd[i + 2], wd[i + 3], fp); }
      }
      // Task 21: the branch inspector and the Whole tree control, while they stand, are things a label must not sit under
      if (this.branchEl && this.branchEl.dataset.open === '1' && this.branchBox) n = this.boxObs(n, this.branchBox);
      if (this.resetEl && this.resetEl.dataset.on === '1' && this.resetBox) n = this.boxObs(n, this.resetBox);
      return n;
    }
    /** a box as a row of circles in this.obs, so the label placer keeps clear of it; nothing allocated */
    boxObs(n, B) {
      const r = Math.max(8, (B[3] - B[1]) / 2), cy = (B[1] + B[3]) / 2;
      for (let x = B[0] + r; x <= B[2] + r && n <= this.obs.length - 3; x += r) { this.obs[n] = Math.min(x, B[2]); this.obs[n + 1] = cy; this.obs[n + 2] = r; n += 3; }
      return n;
    }
    /** the label's box for direction d of LABEL.dirs at reach px from its part, into this.lb. The box hangs off that point by
        its near side: outward of it on a sideways direction, above it going up, below it going down, centred otherwise. */
    labelBox(L, d, reach, ax, ay, W, H) {
      const dir = LABEL.dirs[d], B = this.lb;
      const ux = dir[0] * L.side, uy = dir[1];
      const px = ax + ux * reach, py = ay + uy * reach;
      B[0] = ux > 0.3 ? px : ux < -0.3 ? px - W : px - W / 2;
      B[1] = uy > 0.3 ? py : uy < -0.3 ? py - H : py - H / 2;
      B[2] = B[0] + W;
      B[3] = B[1] + H;
    }
    /** this.lb against the bounds (this.lbounds), this.obs[0..n), the labels placed before this one this frame and the Core:
        0 when it is free with pad px to spare, -1 when it is out of bounds, else how deep (px) it sits in the first thing it touches */
    labelHit(n, pad) {
      const B = this.lb, O = this.obs, U = this.lbounds;
      if (B[0] < U[0] || B[2] > U[2] || B[1] < U[1] || B[3] > U[3]) return -1;
      for (let k = 0; k < n; k += 3) {
        const cx = O[k], cy = O[k + 1], r = O[k + 2] + pad;
        const dx = cx < B[0] ? B[0] - cx : cx > B[2] ? cx - B[2] : 0, dy = cy < B[1] ? B[1] - cy : cy > B[3] ? cy - B[3] : 0;
        const d2 = dx * dx + dy * dy;
        if (d2 < r * r) return r - Math.sqrt(d2) + 0.5;
      }
      const R = this.lrects;
      for (let k = 0; k < this.lrectN * 4; k += 4) {
        if (B[0] < R[k + 2] + pad && B[2] > R[k] - pad && B[1] < R[k + 3] + pad && B[3] > R[k + 1] - pad) {
          return Math.max(1, Math.min(R[k + 2] + pad - B[0], B[2] - (R[k] - pad), R[k + 3] + pad - B[1], B[3] - (R[k + 1] - pad)));
        }
      }
      const c = this.coreOn ? this.coreBox : null;
      if (c && B[0] < c[2] + pad && B[2] > c[0] - pad && B[1] < c[3] + pad && B[3] > c[1] - pad) return 6;
      return 0;
    }
    /** what a place costs: how far it is from the part, plus its direction's handicap (LABEL.dirs), so beside-and-outward wins a tie */
    labelCost(d, reach) { return reach + LABEL.dirs[d][2]; }
    /** the nearest free place: along each direction the box is pushed out from the part until it touches nothing, and the
        cheapest direction wins. The winner goes into L.found and L.foundReach; false when there is none within LABEL.far. */
    labelSearch(L, ax, ay, W, H, n) {
      const dirs = LABEL.dirs;
      let best = -1, bestCost = Infinity, bestReach = 0;
      for (let d = 0; d < dirs.length; d++) {
        let reach = LABEL.near;
        for (let guard = 0; guard < 96 && reach <= LABEL.far && this.labelCost(d, reach) < bestCost; guard++) {
          this.labelBox(L, d, reach, ax, ay, W, H);
          const hit = this.labelHit(n, LABEL.gap);
          if (hit === 0) { best = d; bestCost = this.labelCost(d, reach); bestReach = reach; break; }
          reach += hit < 0 ? 8 : Math.max(3, hit);
        }
      }
      L.found = best;
      L.foundReach = bestReach;
      return best >= 0;
    }
    hideLabel(L = this.label) {
      if (L.vis !== false) { L.vis = false; if (L.el) { L.el.style.opacity = '0'; if (L.kind !== 'live') L.el.setAttribute('aria-hidden', 'true'); } }
      L.swapAt = 0;
      L.on = false;
    }
    /** Task 02: the region the shell says the tree owns, in this canvas's own px, or null. M.shell.regions().tree is measured
        live (the header's real height and the question column's inner edge); --keep-right and --keep-bottom carry the same two
        numbers for a page without that module. Read twice a second, never per frame, and ignored when it leaves the tree less
        than a quarter of the screen (a stage between two layouts can measure a question host as the whole width). */
    treeRegion() {
      const now = performance.now();
      if (this.regionAt && now - this.regionAt < 500) return this.region;
      this.regionAt = now;
      const w = this.size.w, h = this.size.h;
      let box = null;
      try {
        const r = M.shell && typeof M.shell.regions === 'function' ? M.shell.regions().tree : null;
        if (r && isFinite(r.left) && isFinite(r.right) && isFinite(r.top) && isFinite(r.bottom)) box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      } catch (e) { box = null; }
      if (!box) {
        try {
          const st = getComputedStyle(document.documentElement);
          const kr = parseFloat(st.getPropertyValue('--keep-right')), kb = parseFloat(st.getPropertyValue('--keep-bottom'));
          const vw = window.innerWidth, vh = window.innerHeight;
          if (this.portrait && isFinite(kb) && kb > 0) box = { left: 0, top: 0, right: vw, bottom: kb };
          else if (!this.portrait && isFinite(kr) && kr > 0) box = { left: kr, top: 0, right: vw, bottom: vh };
        } catch (e) { box = null; }
      }
      if (box && this.canvas) { // viewport px into this canvas's own (the stage need not fill the window)
        let r = null;
        try { r = this.canvas.getBoundingClientRect(); } catch (e) { r = null; }
        if (r && (r.left || r.top)) { box.left -= r.left; box.right -= r.left; box.top -= r.top; box.bottom -= r.top; }
      }
      const wide = box && box.right - box.left >= 0.25 * (w || 1) && box.bottom - box.top >= 0.25 * (h || 1);
      const was = this.region;
      const next = wide ? box : null;
      // a region that moved (the header wrapped, the panel resized, the shell measured again) is a new fit
      if (!was !== !next || (was && next && (Math.abs(was.left - next.left) > 2 || Math.abs(was.top - next.top) > 2 || Math.abs(was.bottom - next.bottom) > 2))) this.regionMoved = true;
      this.region = next;
      return this.region;
    }
    /** the left edge (landscape) or the bottom edge (portrait) the tree and its labels keep to: the shell's measured region
        when there is one, else the preset's own share of the width. A preset that claims the whole screen (the intro, the
        arrival) keeps its own edge; every other stage takes whichever edge leaves the question column alone. */
    keepLeft(fit, w) {
      const own = (fit && fit.left !== undefined ? fit.left : FIT.whole.left) * w;
      const R = this.treeRegion();
      if (!R || this.portrait) return own;
      return fit && fit.as === 'intro' ? Math.min(own, R.left) : Math.max(own, R.left);
    }
    /** the bounds every label keeps to this frame: inside the screen, under the top bar, out of the question region (the
        shell's measured edge at 1440, the sheet on the phone); and the Core's box when it is placed */
    labelBounds() {
      const U = this.lbounds, w = this.size.w, h = this.size.h, port = this.portrait;
      // Task 02: the labels stand inside the region the shell publishes, whatever the camera is doing (the old rule read the
      // pose and let a caption sit 32 px inside the question column at 1440)
      U[0] = port ? 8 : Math.max(8, this.usable(this.pose.fit, w, h).left);
      U[2] = w - 8;
      U[1] = LABEL.top;
      // the phone keeps its own line (the sheet's veil fades over its first 24 px, so a caption may sit just into it): the
      // region's bottom already holds the tree itself, and tightening this band costs the goal line's label at 320
      U[3] = port ? (this.pose.at.y + 0.09) * h : h - 8;
      if (this.coreOn) {
        const k = port ? FIT.core.portrait : FIT.core.landscape, box = this.coreBox;
        box[0] = this.coreX - k.w / 2; box[1] = this.coreY - k.h / 2; box[2] = this.coreX + k.w / 2; box[3] = this.coreY + k.h / 2;
      }
    }
    /** one label's place for this frame, given its anchor (ax, ay) and the frame's obstacles. It stands at the nearest free
        place beside its part, on the side away from the trunk; it keeps that place while it stays free, looks for a nearer
        one now and then, and when it moves it fades out where it is and in at the new place (it never slides). A label that
        finds nowhere to stand without covering the tree is not shown. The search is rationed (searchBudget) so many labels
        never cost a frame. True when it shows; its box then goes into lrects so the labels after it keep clear. */
    placeTag(L, now, ax, ay, n) {
      const el = L.el;
      const W = L.w || L.text.length * 6.4 + 14, H = L.h || 16;
      // the side away from the trunk; a part on the trunk's own line looks toward the clearing at 1440, right of the tree on the phone
      this.toPx(this.tree, 0, UNIT_H * 0.5, 0);
      const off = ax - this.sx;
      const sd = Math.abs(off) > LABEL.flip ? (off < 0 ? -1 : 1) : L.side || (this.portrait ? 1 : -1);
      if (sd !== L.side) { L.side = sd; if (L.pick >= 0) L.pick = -2; } // -2: it has a place on the other side and must leave it
      let held = false;
      if (L.pick >= LABEL.dirs.length) L.pick = -1; // LABEL.dirs was edited live
      if (L.pick >= 0) { this.labelBox(L, L.pick, L.reach, ax, ay, W, H); held = this.labelHit(n, LABEL.hold) === 0; }
      // it looks for a place when it has none, when the one it has is taken, and every LABEL.again ms in case a nearer
      // one came free; a place that still holds is left only for one that is nearer by LABEL.worth
      let move = false;
      if ((!held || now - L.lookedAt > LABEL.again) && !(L.failedAt && now - L.failedAt < 250) && this.searchBudget > 0) {
        this.searchBudget--;
        L.lookedAt = now;
        if (this.labelSearch(L, ax, ay, W, H, n)) {
          L.failedAt = 0;
          move = !held || this.labelCost(L.found, L.foundReach) + LABEL.worth < this.labelCost(L.pick, L.reach);
        } else L.failedAt = now;
      }
      if (!held && !move) { // nowhere to stand without covering the tree: better unseen than on the bark
        // a group's expanded label that finds nowhere (a small phone at the results) falls back to its small form until the next stage
        if (L.kind === 'group' && L.mode === 'expanded' && L.failedAt === now && !L.shrunk) { L.shrunk = true; this.groupsDirty = true; }
        this.hideLabel(L);
        return false;
      }
      if (move) {
        if (L.vis && L.pick !== -1) { // on screen at another place: it fades out there, then comes in at the new one
          if (!L.swapAt) { L.swapAt = now + 130; el.style.opacity = '0'; }
          if (now < L.swapAt) { L.lookedAt = 0; L.on = false; return false; }
          L.vis = false;
        }
        L.pick = L.found;
        L.reach = L.foundReach;
        L.swapAt = 0;
      } else if (L.swapAt) { L.swapAt = 0; L.vis = false; } // the old place came free again while it was fading out: it stays
      this.labelBox(L, L.pick, L.reach, ax, ay, W, H);
      const B = this.lb;
      const tx = Math.round(B[0] * 2) / 2, ty = Math.round(B[1] * 2) / 2;
      if (tx !== L.tx || ty !== L.ty) { L.tx = tx; L.ty = ty; el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`; }
      const dir = LABEL.dirs[L.pick];
      const sideName = Math.abs(dir[1]) > 0.9 ? (dir[1] < 0 ? 'top' : 'bottom') : dir[0] * L.side < 0 ? 'left' : 'right';
      if (el.dataset.side !== sideName) el.dataset.side = sideName;
      if (!L.vis) { L.vis = true; el.style.opacity = '1'; if (L.kind !== 'live') { el.removeAttribute('aria-hidden'); el.tabIndex = 0; } }
      L.on = true;
      L.x0 = B[0]; L.y0 = B[1]; L.x1 = B[2]; L.y1 = B[3];
      L.inside = B[0] >= 0 && B[2] <= this.size.w && B[1] >= 0 && B[3] <= this.size.h;
      if (this.lrectN * 4 < this.lrects.length) { const R = this.lrects, k = this.lrectN * 4; R[k] = B[0]; R[k + 1] = B[1]; R[k + 2] = B[2]; R[k + 3] = B[3]; this.lrectN++; }
      return true;
    }
    /** the label's place for this frame. It stands at the nearest free place beside its part, on the side away from the
        trunk; it keeps that place while it stays free, looks for a nearer one now and then, and when it moves it fades out
        where it is and in at the new place (it never slides). Not shown when it only repeats the panel (LABEL.echo), when
        the tree stands small, or when there is nowhere to stand without covering the tree. */
    placeLabel(now, n) {
      const L = this.label, el = L.el;
      if (L.part == null || !L.text || L.timer) { this.hideLabel(); return; }
      if (!L.echoAt || now - L.echoAt > 300) { L.echoAt = now; L.echo = labelEchoes(L.text); }
      if (L.echo) { this.hideLabel(); return; }
      const a = this.anchor(L.part);
      if (!a || !a.inView || this.treeSmall) { this.hideLabel(); return; }
      if (L.sizedFor !== L.text || (!L.w && now - L.sizedAt > 250)) { L.sizedFor = L.text; L.sizedAt = now; L.w = el.offsetWidth || 0; L.h = el.offsetHeight || 0; }
      if (!L.w) { L.w = L.text.length * 7.5 + 14; L.h = L.h || 18; L.sizedFor = null; } // not laid out yet: an estimate, measured again
      this.placeTag(L, now, a.x, a.y, n);
    }
    /** true while the tree stands under LABEL.minTree px tall (the soil to the top of the trunk as drawn): no label then */
    measureTree() {
      this.toPx(this.world, 0, 0.05, 0);
      const baseY = this.sy;
      const tt = this.woodTrunk, ti = 5 * Math.round(clamp(this.trunkF) * 16);
      this.toPx(this.tree, tt[ti], tt[ti + 1], tt[ti + 2]);
      this.treeH = Math.abs(baseY - this.sy);
      this.treeSmall = this.treeH < LABEL.minTree;
      /* how many names the drawing can carry, decided here because it is the only place the tree is measured. When the
         answer changes (a resize, the tree growing, a new frame) the group labels are written again. */
      const tight = Boolean(this.size) && this.size.w < LABEL.tight;
      if (tight !== this.tight) { this.tight = tight; this.groupsDirty = true; }
      return this.treeSmall;
    }
    /** the persistent labels' words for this frame (only when something changed): which are expanded, each one's lines, its
        accessible name and its size (measured again when its words or mode change). The order they are placed in: the live
        label, the marker's, the crown's, the plan's, the active group, the constraint's group, the other groups, trunk, roots. */
    syncLabels(now) {
      this.groupsDirty = false;
      if (!this.tags) return;
      const enc = this.encoding(), act = this.activeGroupId(), col = this.collarOn ? GROUP_OF[this.collarOn] : null;
      const none = this.tagsOn === 'none', all = this.tagsOn === 'all';
      /* Declan Murphy, 28 September: "text bleeding over the tree". On a phone the drawing is about 180 px wide and six
         group words have nowhere to stand, so the placer puts them on the bark. Below LABEL.tight the tree names only the
         part in play, and never in the three-line expanded form; the rest of the picture is read by pressing a branch. */
      const tight = this.tight !== undefined ? this.tight : Boolean(this.size) && this.size.w < LABEL.tight;
      let smallW = 0;
      this.tagList.forEach((L) => {
        if (L.kind === 'live') { L.rank = 0; return; }
        if (!L.el) L.el = groupDom(this, L);
        let sig = '', word = '', small = '', mode = 'small';
        if (L.kind === 'group') {
          const words = this.groupWords[L.id] || GROUP_WORDS[L.id];
          word = words.word; small = words.small;
          const near = L.id === act || L.id === col;
          const off = none || (tight && !all && !near);
          const expanded = !off && !tight && (all || enc || near) && !L.shrunk;
          mode = expanded ? 'expanded' : 'small';
          // exactly 'off', because that is the signature the writer below reads to clear the mode and hide the label;
          // a group whose signature merely started with 'off' kept its mode and stayed on the tree
          sig = off ? 'off' : `${mode}|${word}|${small}`;
          if (expanded) for (let i = 0; i < L.parts.length; i++) { const p = L.parts[i], st = this.partState[p]; if (st) sig += `|${p}:${st.name}:${st.value}:${st.state}`; }
          L.rank = L.id === act ? 4 : L.id === col ? 5 : L.id === 'trunk' ? 8 : L.id === 'roots' ? 9 : 6;
        } else if (L.kind === 'marker') {
          const on = this.markerShown();
          word = on ? this.metricLabel : '';
          sig = on ? `marker|${this.markerKind}|${word}` : 'off'; // the kind rides in the signature: the goal line's label is not the milestone's
          L.rank = 1;
        } else if (L.kind === 'crown') {
          // Task 20: Now, in the target's own metric and unit (setMetric writes both), else the crown's own evidence line
          const st = this.partState.crown, now = this.nowLabel;
          const on = this.markerShown() && (now || st);
          if (on) { word = now || `${st.name}${st.value ? ` · ${st.value}` : ''}`; small = st ? EVIDENCE[st.state] : ''; }
          sig = on ? `crown|${word}|${small}` : 'off';
          mode = 'expanded';
          L.rank = 2;
        } else if (L.kind === 'plan') {
          const m = this.metric;
          const on = this.markerShown() && this.view === 'plan' && m && m.scenario != null;
          word = on ? m.scenarioLabel || `Plan: ${fmtValue(m.scenario, m.unit)}` : '';
          sig = on ? `plan|${word}` : 'off';
          mode = 'expanded';
          L.rank = 3;
        }
        if (sig !== L.sig) {
          L.sig = sig;
          L.text = word;
          L.mode = sig === 'off' ? '' : mode;
          const el = L.el;
          el.dataset.mode = L.mode || 'off';
          // Task 20: the goal line's label wears the dashed swatch and the muted red; a milestone's does not (tree.css)
          if (L.kind === 'marker') el.dataset.goal = this.markerKind === 'goal' ? '1' : '0';
          el.querySelector('.tree-group-word').textContent = word;
          el.querySelector('.tree-group-small').textContent = small;
          const parts = el.querySelector('.tree-group-parts');
          parts.textContent = '';
          let name = word;
          if (L.kind === 'group' && mode === 'expanded') {
            L.parts.forEach((p) => {
              const st = this.partState[p];
              if (!st) return;
              const line = document.createElement('i');
              line.className = 'tree-group-part';
              line.dataset.part = p;
              line.dataset.state = st.state;
              const b = document.createElement('b'); b.textContent = st.name; line.appendChild(b);
              if (st.value) { const v = document.createElement('span'); v.className = 'tree-group-value'; v.textContent = st.value; line.appendChild(v); }
              const em = document.createElement('em'); em.className = 'tree-group-evidence'; em.textContent = EVIDENCE[st.state]; line.appendChild(em);
              parts.appendChild(line);
              name += `; ${st.name}${st.value ? `, ${st.value}` : ''}, ${EVIDENCE[st.state].toLowerCase()}`;
            });
          } else if (small && mode === 'expanded') name += `, ${small}`;
          el.setAttribute('aria-label', name);
          L.w = 0; L.h = 0; L.sizedFor = null; L.sizedAt = 0;
          if (sig === 'off') this.hideLabel(L);
        }
        if (L.mode && (!L.w || (L.sizedFor !== L.sig && now - L.sizedAt > 250))) { L.sizedFor = L.sig; L.sizedAt = now; L.w = L.el.offsetWidth || 0; L.h = L.el.offsetHeight || 0; }
        if (L.kind === 'group' && L.mode === 'small') smallW = Math.max(smallW, L.w || L.text.length * 6.4 + 14);
      });
      this.smallW = smallW;
      this.tagList.sort((a, b) => a.rank - b.rank);
    }
    /** a persistent label's anchor for this frame into this.sx, this.sy (nothing allocated); false when it has none or it
        is behind the camera. Groups stand by their limb in play (else their first limb); Leverage by the trunk's upper third;
        the trunk's label low on the bare trunk; Roots at the root ball's middle; the crown's at the crown's top; the marker's
        at the ring's edge on the screen's right; the plan's at the silhouette's top. */
    tagAnchor(L) {
      const v = this.lv2;
      if (L.kind === 'group') {
        if (L.id === 'leverage') { if (this.trunkF < CONTROL.t0 + 0.05) return false; this.trunkCurve.getPointAt(Math.min(CONTROL.t, clamp(this.trunkF)), v); return this.toPx(this.tree, v.x, v.y, v.z); }
        if (L.id === 'trunk') { if (this.trunkF < 0.3) return false; this.trunkCurve.getPointAt(Math.min(0.3, clamp(this.trunkF)), v); return this.toPx(this.tree, v.x, v.y, v.z); }
        if (L.id === 'roots') {
          let any = false;
          for (let i = 0; i < this.roots.length && !any; i++) any = this.roots[i].strands.length > 0 && this.roots[i].grown > 0.3;
          if (!any) return false;
          return this.toPx(this.world, 0, -this.rootDepth() * 0.5, 0);
        }
        const limb = this.groupLimb(L), b = limb && this.branches.get(limb);
        if (!b || b.f < 0.2) return false;
        L.limb = limb;
        b.curve.getPointAt(clamp(Math.max(b.f, 0.05)), v);
        return this.toPx(this.tree, v.x, v.y, v.z);
      }
      if (L.kind === 'crown') return this.toPx(this.tree, 0, this.envTop - 0.1, 0);
      if (L.kind === 'marker') {
        if (this.markerK < 0.2) return false;
        // the top of the ring on the screen: its far point when the camera stands above the ring's plane, its near point
        // when below (the camera's own z axis gives the two); the label then stands above the ring, centred, when nothing is there
        const e = this.camera.matrixWorld.elements, bx = e[8], bz = e[10], l = Math.hypot(bx, bz) || 1;
        const okFar = this.toPx(this.scene, (-bx / l) * this.ringR, this.ringY, (-bz / l) * this.ringR);
        const fy = this.sy;
        const okNear = this.toPx(this.scene, (bx / l) * this.ringR, this.ringY, (bz / l) * this.ringR);
        if (okFar && (!okNear || fy < this.sy)) return this.toPx(this.scene, (-bx / l) * this.ringR, this.ringY, (-bz / l) * this.ringR);
        return okNear;
      }
      if (L.kind === 'plan') {
        if (this.planK < 0.5 || !this.metric || this.metric.scenario == null) return false;
        const ss = this.metricScale(this.metric.scenario);
        return this.toPx(this.world, 0, this.envTop * ss, 0);
      }
      return false;
    }
    /** a new stage or a new size: every group label may try its expanded form again */
    unshrink() { for (let i = 0; i < this.tagList.length; i++) if (this.tagList[i].shrunk) { this.tagList[i].shrunk = false; this.groupsDirty = true; } }
    /** the persistent labels for this frame: hidden before the planting and at the arrival. A small tree (the phone's results,
        a low baseline) keeps them: each is small, and one that finds no free place hides by itself. */
    placeTags(now, n) {
      const shown = this.tagsOn !== 'none' && (this.planted || this.intro) && this.pose.preset !== 'arrival';
      for (let i = 0; i < this.tagList.length; i++) {
        const L = this.tagList[i];
        if (L.kind === 'live') continue;
        if (!L.el || !L.mode || !shown || !this.tagAnchor(L)) { if (L.el) this.hideLabel(L); continue; }
        if (!L.w) { L.w = L.text.length * 6.4 + 14; L.h = L.mode === 'expanded' ? 34 : 16; } // not laid out yet: an estimate, measured again by syncLabels
        this.placeTag(L, now, this.sx, this.sy, n);
      }
    }
    /** a press on a persistent label: 'inspect' { id, kind: 'group', group, parts: [{ id, name, value, state }], x, y } */
    inspectGroup(L, e) {
      const parts = (L.parts || []).map((p) => { const st = this.partState[p]; return { id: p, name: st ? st.name : PART_WORDS[p], value: st ? st.value : '', state: st ? st.state : 'unknown' }; });
      const r = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
      const x = e && isFinite(e.clientX) && (e.clientX || e.clientY) ? e.clientX : (L.x0 + L.x1) / 2 + r.left, y = e && isFinite(e.clientY) && (e.clientX || e.clientY) ? e.clientY : (L.y0 + L.y1) / 2 + r.top;
      this.emit('inspect', { id: L.id, kind: 'group', group: L.id, parts, limb: L.limb || null, x, y });
    }
    /** the Core element, placed each frame at anchor('core'). Rebuild 1 (R10): the Core is out of the main journey. It is
        placed only while the intro's demonstration frames the tree ('intro' / 'arrival') or after showCore(true); anywhere
        else data-placed stays 0 (tree.css hides it), and the simulation chart lives under the crown card's Method (canopy). */
    setCoreHost(el) { this.coreHost = el || null; this.placeCore(); }
    /** showCore(true) places the Core outside the intro as well (the older journey); false (the default) keeps it hidden there */
    showCore(on) { this.coreWanted = !!on; this.placeCore(); return this.coreWanted; }
    coreAllowed() { const p = this.pose && this.pose.preset; return this.coreWanted || p === 'intro' || p === 'arrival'; }
    placeCore() {
      const el = this.coreHost;
      this.coreOn = false;
      if (!el) return;
      const a = this.coreAllowed() ? this.anchor('core') : null;
      if (a && a.inView) {
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        el.dataset.placed = '1';
        this.coreOn = true; this.coreX = a.x; this.coreY = a.y; // the label keeps clear of this box
      } else el.dataset.placed = '0';
    }
    /** where the disc buttons live. The stage is aria-hidden (it holds a canvas), so buttons inside it are hidden from a
        screen reader while still taking Tab: the layer goes into the page's #discs (role="group", outside the stage) when
        there is one, fixed over the canvas, and is placed each frame as before. No #discs (or one that is itself hidden
        from assistive technology): the tag layer over the canvas, as before. The page may empty #discs (canopy clears its
        phone row with innerHTML); the layer is put back on the next frame, with the focus if a disc held it. */
    seatDiscs() {
      const layer = this.tags && this.tags.discs;
      if (!layer) return;
      let host = document.getElementById('discs');
      if (host && typeof host.closest === 'function' && host.closest('[aria-hidden="true"]')) host = null;
      const want = host || this.tags.box;
      this.discSeat = want;
      if (layer.parentNode === want) return;
      want.appendChild(layer);
      layer.dataset.host = host ? 'page' : 'stage';
      layer.dataset.row = clearing() === 'bottom' ? '1' : '0';
      if (!host) ['left', 'top', 'width', 'height', 'right', 'bottom'].forEach((k) => { layer.style[k] = ''; });
      this.discBoxAt = 0;
      if (!layer._focusBound) {
        layer._focusBound = true;
        layer.addEventListener('focusin', (e) => { const el = e.target && e.target.closest ? e.target.closest('.disc') : null; this.discFocus = el ? el.dataset.id : null; });
        layer.addEventListener('focusout', () => { if (layer.isConnected) this.discFocus = null; });
      } else if (this.discFocus != null && (!document.activeElement || document.activeElement === document.body)) {
        const d = this.discs.find((x) => x.id === this.discFocus);
        if (d) { try { d.el.focus({ preventScroll: true }); } catch (e) { /* focus is a courtesy */ } }
      }
    }
    /** in the page's #discs the layer is fixed, so it takes the canvas's box; measured on a change of size and twice a second */
    boxDiscs(now) {
      const layer = this.tags && this.tags.discs;
      if (!layer || layer.dataset.host !== 'page' || !this.canvas) return;
      if (this.discBoxAt && now - this.discBoxAt < 500) return;
      this.discBoxAt = now || 1;
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return; // not laid out yet: tree.css keeps the layer over the whole viewport
      const box = this.discBox || (this.discBox = [NaN, NaN, NaN, NaN]);
      if (box[0] === r.left && box[1] === r.top && box[2] === r.width && box[3] === r.height) return;
      box[0] = r.left; box[1] = r.top; box[2] = r.width; box[3] = r.height;
      const st = layer.style;
      st.left = `${r.left}px`; st.top = `${r.top}px`; st.width = `${r.width}px`; st.height = `${r.height}px`; st.right = 'auto'; st.bottom = 'auto';
    }
    /** the discs on the results: [{ id, part, state: 'filled'|'hollow', scale, collar, mist, name, hue, label }]. Two kinds
        of circle and no third: a filled disc in the section's hue opens a card; a hollow ring in the same hue is an
        unfinished section (go back and answer). The older 'ring' (a card already opened) draws as filled and collar no longer
        rings the disc (the binding limb wears its collar on the wood, and its disc is 1.4 x); both stay readable as
        data-seen and data-bind. label is the accessible name when the page wants more than the name. */
    setDiscs(list) {
      if (!this.tags) this.ensureTags((this.canvas && this.canvas.parentElement) || this.host || document.body);
      const layer = this.tags.discs;
      this.seatDiscs();
      const keep = new Set();
      this.discs = (Array.isArray(list) ? list : []).map((d) => {
        if (!d || d.id == null) return null;
        const id = String(d.id);
        keep.add(id);
        let el = layer.querySelector(`.disc[data-id="${CSS.escape(id)}"]`);
        if (!el) {
          el = document.createElement('button');
          el.type = 'button';
          el.className = 'disc';
          el.dataset.id = id;
          el.innerHTML = '<span class="disc-name word"></span>';
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const d = this.discs.find((x) => x.id === id);
            this.emit('disc', { id, part: d ? d.part : el.dataset.part });
            this.emit('select', d && typeof d.part === 'string' ? d.part : d ? d.part.limb : null);
          });
          el.addEventListener('pointerenter', () => this.nameDisc(el, 1200));
          let press = 0;
          el.addEventListener('pointerdown', () => { press = setTimeout(() => this.nameDisc(el, 1200), 420); });
          ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(press)));
          layer.appendChild(el);
          el.style.opacity = '0';
          el.dataset.born = String(performance.now() + 60 * layer.children.length);
        }
        const part = typeof d.part === 'object' && d.part ? d.part : String(d.part || 'crown');
        el.dataset.part = typeof part === 'string' ? part : `${part.limb}@${part.t}`;
        const hollow = d.state === 'hollow';
        el.dataset.state = hollow ? 'hollow' : 'filled';
        el.classList.remove('ring', 'bind'); // base.css draws a third and a fourth kind of circle from these
        el.classList.toggle('hollow', hollow);
        el.classList.toggle('mist', !!d.mist);
        if (d.state === 'ring' || d.seen) el.dataset.seen = '1'; else delete el.dataset.seen;
        if (d.collar) el.dataset.bind = '1'; else delete el.dataset.bind;
        // applied in placeOverlays' transform string; tree.css divides the name by it. A binding disc sent without a scale takes 1.4
        const scale = clamp(+d.scale || (d.collar ? 1.4 : 1), 0.5, 2);
        el.style.setProperty('--disc-scale', String(scale));
        if (d.hue) el.style.setProperty('--hue', `var(${d.hue})`); else el.style.removeProperty('--hue');
        // the accessible name: label when the page sends one; else the name, which says "unfinished" for a hollow disc unless
        // the page already worded that itself (canopy sends unfinished: true with a name like "Finish: The offer")
        const name = d.name ? String(d.name) : id;
        el.setAttribute('aria-label', d.label ? String(d.label) : hollow && d.unfinished === undefined ? `${name}: unfinished` : name);
        el.querySelector('.disc-name').textContent = d.name ? String(d.name) : '';
        return { id, part, el, scale, x: 0, y: 0, r: 0 };
      }).filter(Boolean);
      [...layer.querySelectorAll('.disc')].forEach((el) => { if (!keep.has(el.dataset.id)) { el.remove(); this.discMemo.delete(el.dataset.id); } });
    }
    /** the disc key: every name beside its disc for ms, then they fade */
    showDiscNames(ms = 2400) {
      this.discs.forEach((d) => this.nameDisc(d.el, ms));
    }
    nameDisc(el, ms) {
      el.classList.add('named');
      clearTimeout(el._nameT);
      el._nameT = setTimeout(() => el.classList.remove('named'), ms);
    }
    /** a disc's name stands on its outer side (away from the trunk) and steps up or down by its own height until it
        overlaps no other name and no other disc. items carry { d, el, x, y, w, h }; tree.css reads data-side and --name-dy. */
    placeNames(items, axisX, w, h) {
      items.forEach((it) => {
        const side = it.x < axisX - 6 ? 'left' : 'right';
        it.side = side;
      });
      if (!items.some((it) => it.el.classList.contains('named'))) {
        items.forEach((it) => { if (it.el.dataset.side !== it.side) it.el.dataset.side = it.side; });
        return;
      }
      const hit = (a, b) => a.x0 < b.x1 + 4 && a.x1 > b.x0 - 4 && a.y0 < b.y1 + 2 && a.y1 > b.y0 - 2;
      const discBox = (it) => ({ x0: it.x - it.w / 2, x1: it.x + it.w / 2, y0: it.y - it.h / 2, y1: it.y + it.h / 2 });
      const taken = [];
      items.slice().sort((a, b) => a.y - b.y).forEach((it) => {
        const d = it.d;
        const span = it.el.querySelector('.disc-name');
        if (!d || !span || !span.textContent) return;
        if (!d.nameW) { d.nameW = span.offsetWidth || span.textContent.length * 7; d.nameH = span.offsetHeight || 16; }
        const nw = d.nameW, nh = d.nameH;
        let side = it.side;
        if (side === 'left' && it.x - it.w / 2 - 8 - nw < 4) side = 'right';
        if (side === 'right' && it.x + it.w / 2 + 8 + nw > w - 4) side = 'left';
        const boxAt = (dy) => {
          const x0 = side === 'left' ? it.x - it.w / 2 - 8 - nw : it.x + it.w / 2 + 8;
          return { x0, x1: x0 + nw, y0: it.y + dy - nh / 2, y1: it.y + dy + nh / 2 };
        };
        const free = (dy) => {
          const bx = boxAt(dy);
          if (bx.y0 < 4 || bx.y1 > h - 4) return false;
          return !taken.some((q) => hit(bx, q)) && !items.some((o) => o !== it && hit(bx, discBox(o)));
        };
        // the step it held last frame comes first, so a turning tree does not make the names hop
        const steps = [d.nameDy || 0, 0, nh, -nh, 2 * nh, -2 * nh, 3 * nh, -3 * nh];
        let dy = steps.find(free);
        if (dy === undefined) dy = d.nameDy || 0;
        taken.push(boxAt(dy));
        if (d.nameDy !== dy) { d.nameDy = dy; it.el.style.setProperty('--name-dy', `${dy}px`); }
        if (it.el.dataset.side !== side) it.el.dataset.side = side;
      });
    }

    /* ---------- the camera ---------- */
    limbYaw(az) {
      // the limb points into the clearing: screen-left at 1440 (solve() then turns it until the tip stands inside the tree's half),
      // toward the viewer and FIT.section.turn to the left at 390
      return this.portrait ? az - Math.PI / 2 - FIT.section.turn : az - Math.PI + 0.55;
    }
    baseAt() {
      if (!this.portrait) return { x: FIT.base.landscape.x, y: FIT.base.landscape.y };
      const P = FIT.base.portrait, h = this.size.h || window.innerHeight || 0;
      return { x: P.x, y: h && h <= P.shortH ? P.yShort : P.y };
    }
    /** the size the tree is heading for, so a frame is right when the move ends. Task 20: the height stands for the selected
        outcome only where that mapping is meaningful, which is when a scalar metric was set. A milestone, and a page that
        never set a metric, keep one size: the answered share (setMetrics progress) no longer grows the tree, because
        answering more questions must never look like earning more money. */
    scaleFinal() {
      if (!this.encoding()) return S_REST;
      if (this.metric) return this.metricScale(this.metric.baseline);     // R10: the current crown stands at the baseline
      return S_REST;
    }
    /** how far the roots reach and how deep they go, in world units */
    rootExtent() {
      let R = 0;
      this.roots.forEach((g) => { if (g.strands.length) R = Math.max(R, g.R); });
      return [R, this.rootDepth()];
    }
    /** the leaf envelope of the built tree, from the limb curves: rings of { r, y0, y1 } and the top */
    buildEnvelope() {
      const pad = TWIG_BALL + 0.05;
      this.env = [];
      let top = UNIT_H + 0.42;
      this.branches.forEach((b) => {
        [0.6, 1].forEach((t) => { const q = b.curve.getPointAt(t); this.env.push({ r: Math.hypot(q.x, q.z) + pad, y0: q.y - 0.12, y1: q.y + pad }); });
      });
      this.leader.forEach((l) => { top = Math.max(top, l.curve.getPointAt(1).y + 0.2); });
      this.env.forEach((e) => { top = Math.max(top, e.y1); });
      this.envTop = top;
    }
    /** the wood as points with a radius, in the tree's own space: [x, y, z, r, t] along the trunk and each limb, close enough
        together that nothing the size of the label fits between two of them. The label keeps clear of these. */
    buildWood() {
      const tmp = new T.Vector3();
      const sample = (curve, n, radius, from) => {
        const half = (curve.getLength() / n) * 0.55, a = [];
        for (let i = from; i <= n; i++) { const t = i / n; curve.getPointAt(t, tmp); a.push(tmp.x, tmp.y, tmp.z, Math.max(radius(t), half), t); }
        return new Float32Array(a);
      };
      this.woodTrunk = sample(this.trunkCurve, 16, this.rT, 0);
      this.branches.forEach((b) => { b.wood = sample(b.curve, 12, b.radius, 1); });
      this.limbList = this.twigHosts.slice(); // walked by index each frame the label shows: no iterator is made (the control host has no wood of its own)
    }
    /** subjects, as points in the turning world's own space. Rings, so a whole-tree frame does not depend on the yaw. */
    ringPoints(pts, r, y, n = 12) {
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
    }
    subjectWhole(s, withRoots) {
      const pts = [[0, 0, 0], [0, this.envTop * s, 0]];
      this.env.forEach((e) => { this.ringPoints(pts, e.r * s, e.y0 * s); this.ringPoints(pts, e.r * s, e.y1 * s); });
      this.ringPoints(pts, 0.16, 0);
      // R10: the marker ring and, when there is a scenario, the plan silhouette's top and width are part of the whole
      // (fit() includes the marker; a scenario past the target still fits), whichever view is shown
      if (this.markerShown()) {
        this.ringPoints(pts, this.ringR, this.ringY);
        const m = this.metric;
        if (m && m.scenario != null) { const ss = this.metricScale(m.scenario); pts.push([0, this.envTop * ss, 0]); this.ringPoints(pts, this.envR * ss, this.envTop * ss - 0.3); }
      }
      if (withRoots) {
        const [R, D] = this.rootExtent();
        const r = Math.max(R, 0.6), d = Math.max(D, 0.5);
        this.ringPoints(pts, r, -d);
        this.ringPoints(pts, r * 0.75, -d * 0.5);
      }
      return pts;
    }
    /** the limb in play (base to tEnd, with its twigs' clusters) and the trunk from the soil to the limb's base */
    subjectSection(limb, tEnd, s) {
      const b = this.branches.get(limb), lay = LAYOUT[limb];
      const pts = [[0, 0, 0]];
      const add = (v, dy = 0) => pts.push([v.x * s, (v.y + dy) * s, v.z * s]);
      for (let i = 1; i <= 3; i++) add(this.trunkCurve.getPointAt((lay.h * i) / 3));
      for (let i = 0; i <= 6; i++) add(b.curve.getPointAt((tEnd * i) / 6));
      for (let i = 0; i < TWIG_SLOTS; i++) if (this.twigT(i) <= tEnd + 0.05) add(this.twigTipLocal(b, i), 0.14);
      const tip = b.curve.getPointAt(tEnd);
      return { pts, tip: [tip.x * s, tip.y * s, tip.z * s] };
    }
    subjectTrunk(s) {
      const pts = [[0, 0, 0], [0, this.envTop * s, 0]]; // soil to the top of the crown: the trunk is read with its crown on
      for (let i = 1; i <= 4; i++) { const v = this.trunkCurve.getPointAt(i / 4); pts.push([v.x * s, v.y * s, v.z * s]); }
      this.leader.forEach((l) => { const v = l.curve.getPointAt(1); pts.push([v.x * s, v.y * s, v.z * s]); });
      return pts;
    }
    /** the root ball, seed to root tips; never smaller than a young root ball, so the seed's frame holds while rootlets arrive */
    subjectRoots() {
      const [R, D] = this.rootExtent();
      const r = Math.max(R, FIT.roots.minR), d = Math.max(D, FIT.roots.minD);
      const pts = [[0, 0.12, 0]];
      this.ringPoints(pts, r, -d);
      this.ringPoints(pts, r * 0.75, -d * 0.5);
      this.ringPoints(pts, r * 0.3, 0);
      return pts;
    }
    /** the camera's arithmetic without the camera: a point of the turning world to screen px, for a pose that is not shown yet */
    projector(yaw, pitch, dist, tgt, at, w, h) {
      const f = h / 2 / Math.tan((this.camera.fov * Math.PI) / 360);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const tx = tgt[0] * cy + tgt[2] * sy, tz = -tgt[0] * sy + tgt[2] * cy;
      return (x, y, z) => {
        const vx = x * cy + z * sy - tx, vy = y - tgt[1], vz = -x * sy + z * cy - tz;
        const depth = Math.max(0.05, dist - (vy * sp + vz * cp));
        return { x: at.x * w + (vx / depth) * f, y: at.y * h - ((vy * cp - vz * sp) / depth) * f, depth };
      };
    }
    extents(pts, yaw, pitch, dist, tgt, at, w, h) {
      const pr = this.projector(yaw, pitch, dist, tgt, at, w, h);
      const e = { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity };
      pts.forEach((q) => {
        const v = pr(q[0], q[1], q[2]);
        e.top = Math.min(e.top, v.y); e.bottom = Math.max(e.bottom, v.y); e.left = Math.min(e.left, v.x); e.right = Math.max(e.right, v.x);
      });
      return e;
    }
    /** a bounding sphere: the box's centre and the farthest point from it */
    boundSphere(pts) {
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      pts.forEach((q) => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], q[i]); hi[i] = Math.max(hi[i], q[i]); } });
      const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
      let r = 0;
      pts.forEach((q) => { r = Math.max(r, Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2])); });
      return { c, r };
    }
    /** the auto-fit: given the pose's yaw and pitch and what it must show (p.fit), set p.dist (world units), p.at and,
        for a section, p.yaw. Whole tree: the tree spans FIT.whole.fill of the height, centred. A section: the bounding sphere
        of limb + trunk fills FIT.section.fill, the base stays on its anchor, the tip stands inside the tree's half and its
        band (corrected once by distance). Roots: the root ball's sphere fills FIT.roots.fill, centred lower.
        The phone (clearing below): the whole tree, a section and the trunk are one frame, the base pinned above the sheet
        (FIT.base.portrait) and the crown's top at FIT.whole.top; a section only turns the tree. Root tips that would run
        more than FIT.sheet.under below the sheet's edge lift the base instead (never when the caller pins at.y). */
    solve(p) {
      const fit = p.fit;
      if (!fit || fit.kind === 'none') return p;
      const w = this.size.w || window.innerWidth || 1, h = this.size.h || window.innerHeight || 1;
      const port = this.portrait, B = this.baseAt();
      const s = this.scaleFinal();
      const tanH = Math.tan((this.camera.fov * Math.PI) / 360);
      const winH = port ? FIT.winH.portrait : FIT.winH.landscape;
      const tgt = [p.target[0], p.target[1] * (p.scaled ? s : 1), p.target[2]];
      const corrected = [];
      if (!fit.pinX) p.at.x = fit.baseX === undefined ? B.x : fit.baseX;
      if (!fit.pinY) p.at.y = port && fit.baseYPortrait !== undefined ? fit.baseYPortrait : B.y;
      const ext = (pts, D, yaw = p.yaw) => this.extents(pts, yaw, p.pitch, D, tgt, p.at, w, h);
      // more(x) says "x must grow"; the answer lies between lo and hi
      const bisect = (more, lo, hi, n = 22) => { for (let i = 0; i < n; i++) { const mid = (lo + hi) / 2; if (more(mid)) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      // dist = radius / tan(fov / 2) / fill, measured to the sphere's centre; the pose's distance runs from the pivot
      const sphereD = (sph, fill, yaw) => {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const vy = sph.c[1] - tgt[1];
        const vz = (-sph.c[0] * sy + sph.c[2] * cy) - (-tgt[0] * sy + tgt[2] * cy);
        return sph.r / (tanH * fill * winH) + vy * Math.sin(p.pitch) + vz * Math.cos(p.pitch);
      };
      // a whole-tree frame reads FIT.whole; fit.as names a row merged over it at 1440 ('intro': the tree in the top 58%, the words under it)
      const W = !port && fit.as && FIT[fit.as] ? { ...FIT.whole, ...FIT[fit.as] } : FIT.whole;
      // Rebuild 1 (C13): px kept beside the tree for the persistent labels and above the ring for its label
      const RS = this.labelReserve(p, w, h), resL = RS[0], resR = RS[1], resT = RS[2];
      const whole = () => {
        const pts = this.subjectWhole(s, !port);
        const want = Math.max(40, port ? Math.max(0.12, p.at.y - FIT.whole.top) * h - resT : W.fill * h);
        return { pts, D: bisect((D) => { const e = ext(pts, D); return e.bottom - e.top > want; }, 1, 80) };
      };
      const mul = fit.legacyMul != null ? fit.legacyMul : fit.mul || 1;
      let D = p.dist, fillTarget = null, tipPlan = null;
      // The phone has one frame: the base pinned above the sheet, the crown's top under the top bar, whatever is in play.
      // A section or the trunk turns and tilts the tree; it does not zoom (a closer frame cut the crown off at the top of
      // the screen, a sphere fit left the high limbs' tree a quarter smaller than the space). With the whole tree already
      // in view a pull-back (close-pull's 1.3, a card's distMul 1.15) has nothing to show, so only a push-in is taken.
      const band = port && (fit.kind === 'section' || fit.kind === 'trunk') && fit.legacyMul == null;

      if (fit.kind === 'whole' || fit.legacyMul != null || band) {
        const wd = whole();
        D = wd.D * (band ? Math.min(mul, 1) : mul);
        fillTarget = W.fill;
        if (fit.kind === 'whole' || band) {
          const centre = () => { if (port || fit.pinY) return; const e = ext(wd.pts, D); p.at.y += (W.cy * h - (e.top + e.bottom) / 2) / h; };
          centre();
          const left = (port ? 8 : this.keepLeft(fit.left === undefined ? { ...fit, left: W.left } : fit, w)) + resL, right = w - 8 - resR;
          let e = ext(wd.pts, D);
          if (!port && e.left < left && !fit.pinX) {
            const sh = Math.min(W.shift + resL / w, (left - e.left) / w); // the labels' room moves the base by as much again, so the tree is not shrunk to make it
            p.at.x += sh;
            corrected.push(`base x +${sh.toFixed(3)} (leaves at the clearing's edge)`);
            e = ext(wd.pts, D);
          }
          if (e.left < left - 1 || e.right > right) {
            D = bisect((d) => { const q = ext(wd.pts, d); return q.left < left || q.right > right; }, D, D * 2.5);
            corrected.push(resL || resR ? 'distance (width, with room for the labels)' : 'distance (width)');
            centre();
          }
          // the phone: root tips that would run far under the sheet (a short tree on deep roots, the results at low progress)
          // lift the base: the tree and its roots share the room from the top margin to just under the sheet's edge
          if (port && !fit.pinY) {
            const S = FIT.sheet, short = h <= FIT.base.portrait.shortH;
            const line = fit.baseYPortrait !== undefined ? (short ? S.exploreShort : S.explore) : short ? S.topShort : S.top;
            const floor = (line + S.under) * h, rooted = this.subjectWhole(s, true);
            if (ext(rooted, D).bottom > floor + 1) {
              const span = floor - FIT.whole.top * h;
              D = bisect((d) => { const q = ext(rooted, d); return q.bottom - q.top > span; }, D, D * 4);
              p.at.y += (FIT.whole.top * h - ext(rooted, D).top) / h;
              corrected.push('distance and base (root tips kept near the sheet\'s edge)');
            }
          }
        }
        if (band && fit.kind === 'section' && this.branches.has(fit.limb)) { // where the limb's tip lands, for frameReport()
          const sub = this.subjectSection(fit.limb, fit.t === undefined ? 1 : fit.t, s);
          const tp = this.projector(p.yaw, p.pitch, D, tgt, p.at, w, h)(sub.tip[0], sub.tip[1], sub.tip[2]);
          tipPlan = { x: Math.round(tp.x), y: Math.round(tp.y), xN: +(tp.x / w).toFixed(3), yN: +(tp.y / h).toFixed(3) };
        }
      } else if (fit.kind === 'section' && this.branches.has(fit.limb)) { // 1440 (the phone's sections are the frame above)
        const sub = this.subjectSection(fit.limb, fit.t === undefined ? 1 : fit.t, s);
        const sph = this.boundSphere(sub.pts);
        const az = LAYOUT[fit.limb].az;
        const tipAt = (yaw, d) => this.projector(yaw, p.pitch, d, tgt, p.at, w, h)(sub.tip[0], sub.tip[1], sub.tip[2]);
        const Dof = (yaw, m) => sphereD(sph, FIT.section.fill, yaw) * m;
        const tipBand = FIT.section.tipY;
        let yaw = p.yaw, m = 1;
        if (fit.t !== undefined && fit.t < 1) {
          // a part of a limb (Reach, Routes) is never framed much closer than the whole limb: the trunk must not become a wall
          const full = this.boundSphere(this.subjectSection(fit.limb, 1, s).pts);
          m = Math.max(1, (FIT.section.minOfFull * sphereD(full, FIT.section.fill, yaw)) / Dof(yaw, 1));
        }
        for (let pass = 0; pass < 2; pass++) {
          if (fit.solveYaw && !port) {
            // turn the limb toward the viewer until its tip stands inside the tree's half
            const [d0, d1] = FIT.section.delta, want = FIT.section.tipX * w;
            const xAt = (dl) => tipAt(az - Math.PI + dl, Dof(az - Math.PI + dl, m)).x;
            const dl = xAt(d0) >= want ? d0 : xAt(d1) < want ? d1 : bisect((d) => xAt(d) < want, d0, d1, 18);
            yaw = az - Math.PI + dl;
          }
          const ty = tipAt(yaw, Dof(yaw, m)).y;
          if (ty >= tipBand[0] * h && ty <= tipBand[1] * h) break;
          if (pass) break;
          const goal = ty < tipBand[0] * h ? tipBand[0] * h + 2 : tipBand[1] * h - 2;
          m = bisect((mm) => tipAt(yaw, Dof(yaw, mm)).y < goal, 0.4, 3, 20);
          corrected.push(`distance x${m.toFixed(2)} (tip into its band)`);
        }
        const e = ext(sub.pts, Dof(yaw, m), yaw);
        if (e.top < FIT.section.top * h) {
          m = bisect((mm) => ext(sub.pts, Dof(yaw, mm), yaw).top < FIT.section.top * h, m, m * 2.5, 18);
          corrected.push('distance (clusters under the top edge)');
        }
        p.yaw = yaw;
        D = Dof(yaw, m) * mul;
        fillTarget = FIT.section.fill;
        const tp = tipAt(yaw, D);
        tipPlan = { x: Math.round(tp.x), y: Math.round(tp.y), xN: +(tp.x / w).toFixed(3), yN: +(tp.y / h).toFixed(3) };
      } else if (fit.kind === 'trunk') {
        const pts = this.subjectTrunk(s), sph = this.boundSphere(pts);
        const D0 = sphereD(sph, FIT.trunk.fill, p.yaw);
        let m = 1;
        if (ext(pts, D0).top < FIT.trunk.top * h) {
          m = bisect((mm) => ext(pts, D0 * mm).top < FIT.trunk.top * h, 1, 2.5, 18);
          corrected.push('distance (top of the trunk)');
        }
        D = D0 * m * mul;
        fillTarget = FIT.trunk.fill;
      } else if (fit.kind === 'roots') {
        const pts = this.subjectRoots(), sph = this.boundSphere(pts);
        const fill = port ? FIT.roots.fillPortrait : FIT.roots.fill;
        D = sphereD(sph, fill, p.yaw) * mul;
        fillTarget = fill;
        if (!fit.pinY) {
          const e = ext(pts, D);
          p.at.y += ((port ? FIT.roots.cyPortrait : FIT.roots.cy) * h - (e.top + e.bottom) / 2) / h;
        }
      }
      // R16: whatever the subject, the whole tree (crown top to root tips) stays inside the usable viewport, the part of the
      // screen outside the clearing. A frame that would cut it (a section's close frame at 1440, every section at 768, the
      // trunk, Ground) pulls back until the tree fits and moves the base until it is inside; a pinned axis is not moved.
      // The phone's one frame already does this for itself, so only its Ground frame is held here. Not before the planting.
      let contained = false;
      if ((this.planted || this.intro) && (!port || fit.kind === 'roots')) {
        const U = this.usable(fit, w, h), all = this.subjectWhole(s, true), tol = ZOOM.tol * h;
        // Rebuild 1 (C13): the labels' room is part of what must fit (the marker's label above the ring, the small labels beside)
        if (!port) { U.left += resL; U.right -= resR; U.top += resT; }
        const uw = U.right - U.left, uh = U.bottom - U.top;
        const out = (q) => q.top < U.top - tol || q.bottom > U.bottom + tol || q.left < U.left - tol || q.right > U.right + tol;
        const seat = () => {
          const q = ext(all, D);
          if (!fit.pinY) p.at.y += (q.top < U.top ? U.top - q.top : q.bottom > U.bottom ? U.bottom - q.bottom : 0) / h;
          if (!fit.pinX) p.at.x += (q.left < U.left ? U.left - q.left : q.right > U.right ? U.right - q.right : 0) / w;
        };
        if (out(ext(all, D))) {
          const big = (q) => q.bottom - q.top > uh || q.right - q.left > uw;
          if (big(ext(all, D))) D = bisect((d) => big(ext(all, d)), D, D * 4);
          seat();
          if ((fit.pinX || fit.pinY) && out(ext(all, D))) { D = bisect((d) => out(ext(all, d)), D, D * 3); seat(); } // a pinned base: distance alone
          contained = true;
          corrected.push('distance and base (the whole tree kept inside the usable viewport)');
          if (tipPlan && fit.kind === 'section' && this.branches.has(fit.limb)) {
            const sub = this.subjectSection(fit.limb, fit.t === undefined ? 1 : fit.t, s);
            const tp = this.projector(p.yaw, p.pitch, D, tgt, p.at, w, h)(sub.tip[0], sub.tip[1], sub.tip[2]);
            tipPlan = { x: Math.round(tp.x), y: Math.round(tp.y), xN: +(tp.x / w).toFixed(3), yN: +(tp.y / h).toFixed(3) };
          }
        }
      }
      p.dist = Math.max(0.6, D);
      p.abs = true;
      const [rootR, rootD] = this.rootExtent();
      p.fit = { ...fit, s, rootR, rootD, w, h, fillTarget, corrected, tipPlan, contained, reserve: [resL, resR, resT], reserveCapped: this.reserveCapped, marker: this.markerShown() };
      return p;
    }
    /** Rebuild 1 (C13): px the fit keeps for the labels: [left, right, top]. Beside the tree, the widest small label as
        measured (never less than FIT.labels.side, never more than FIT.labels.maxShare of the usable width) while the
        persistent labels show; above the ring, FIT.labels.top for its label while the marker shows. Into this.reserve. */
    labelReserve(p, w, h) {
      const R = this.reserve, fit = p.fit || {};
      R[0] = 0; R[1] = 0; R[2] = 0;
      const port = this.portrait;
      this.reserveCapped = false;
      if (this.tagsOn !== 'none' && (this.planted || this.intro) && p.preset !== 'arrival') {
        const uw = port ? w - 16 : w - this.keepLeft(fit, w) - ZOOM.edge;
        const side = Math.max(port ? FIT.labels.sidePortrait : FIT.labels.side, FIT.labels.measured * ((this.smallW || 0) + LABEL.gap));
        const cap = FIT.labels.maxShare * uw;
        this.reserveCapped = side > cap;
        R[0] = Math.min(side, cap); R[1] = R[0];
      }
      if (this.markerShown() && p.preset !== 'arrival') R[2] = FIT.labels.top;
      return R;
    }
    /** a preset by name, or a pose { yaw, pitch, dist, target: [x,y,z], scaled, at: {x,y}, spin, idleAfter, ms, growLimb, distMul, then }.
        A caller's dist is a share of the whole-tree frame (1 = the tree at FIT.whole.fill); distMul multiplies the fitted distance. */
    resolvePreset(name, opts = {}) {
      const cur = this.pose;
      const port = this.portrait;
      const base = { target: [0, 0.02, 0], scaled: false, abs: true, dist: cur.abs ? cur.dist : cur.dist * this.fitDist(), at: this.baseAt(), spin: 0, idleAfter: 0, ms: 900 };
      let p = null, fit = { kind: 'none' };
      // arrival: a seed is framed close, at its own point (nothing to fit yet); with a tree standing (a visitor sent back to the
      // first screen) it takes the intro's frame, so the words under it never sit on the trunk
      if (name === 'arrival' && (this.planted || this.intro)) { p = { ...base, pitch: 0.15 }; fit = { kind: 'whole', baseX: FIT.arrival.x, left: 0.02, as: 'intro' }; }
      else if (name === 'arrival') p = { ...base, abs: false, pitch: 0.05, dist: 0.55, target: [0, 0.05, 0], at: { ...FIT.arrival } };
      else if (name === 'intro') { p = { ...base, pitch: 0.15, spin: 0.05 }; fit = { kind: 'whole', baseX: 0.5, left: 0.02, as: 'intro' }; }
      else if (name === 'roots' || name === 'ground') { p = { ...base, pitch: -0.35, target: [0, -0.4, 0], ms: 1200 }; fit = { kind: 'roots' }; }
      else if (name === 'planting') { p = { ...base, pitch: 0.12, yaw: cur.yaw + 0.9, ms: 3000 }; fit = { kind: 'whole' }; }
      else if (SECTION_PRESET[name] || LIMB_SECTION[name]) {
        const section = SECTION_PRESET[name] ? name : LIMB_SECTION[name];
        const sp = SECTION_PRESET[section];
        p = { ...base, yaw: this.limbYaw(LAYOUT[sp.limb].az), pitch: sp.pitch, section };
        fit = { kind: 'section', limb: sp.limb, t: sp.t === undefined ? 1 : sp.t, solveYaw: true };
        this.lastSection = section;
      } else if (name === 'you') { p = { ...base, yaw: 0.9, pitch: 0.1 }; fit = { kind: 'trunk' }; }
      // control: the trunk's upper third. The trunk's own frame, turned a third of the way round and looked at from a little higher
      else if (name === 'control') { p = { ...base, yaw: 0.9 + 2.1, pitch: 0.2 }; fit = { kind: 'trunk', part: 'control' }; }
      else if (name === 'close-pull') {
        const sp = SECTION_PRESET[this.lastSection || 'offer'];
        p = { ...base, yaw: this.limbYaw(LAYOUT[sp.limb].az), pitch: sp.pitch };
        fit = { kind: 'section', limb: sp.limb, t: 1, solveYaw: true, mul: 1.3 };
      } else if (name === 'cutscene') { p = { ...base, pitch: 0.02, spin: 0.06, encode: true, ms: 900, then: { pitch: 0.18, ms: 2400 } }; fit = { kind: 'whole', mul: 1.15 }; }
      else if (name === 'explore') { p = { ...base, pitch: 0.16, idleAfter: 6000, encode: true }; fit = { kind: 'whole', baseYPortrait: FIT.base.portrait.yExplore }; }
      else if (name === 'harvest') { p = { ...base, pitch: 0.2, encode: true }; fit = { kind: 'whole' }; }
      else p = { ...base, abs: !!cur.abs, pitch: cur.pitch, dist: cur.dist };
      // Task 19: at the results the tree is the composition, not the thing beside the panel. setComposition('centred') puts
      // the whole-tree frames in the middle of the screen with no clearing reserved; the sections keep their own frames, and
      // the phone is already centred. 'auto' (the default) is the clearing at the left, as every earlier round left it.
      if (this.centred && !port && fit.kind === 'whole' && fit.as !== 'intro') { fit.baseX = 0.5; fit.left = 0.02; }
      if (port && name !== 'arrival' && name !== 'intro') p.pitch += 0.08;
      if (p.yaw === undefined) p.yaw = cur.yaw;
      if (opts.yaw !== undefined) fit.solveYaw = false;
      if (opts.distMul) { if (fit.kind === 'none') p.dist *= opts.distMul; else fit.mul = (fit.mul || 1) * opts.distMul; }
      if (opts.dist !== undefined) { if (fit.kind === 'none') p.dist = +opts.dist; else fit.legacyMul = +opts.dist; }
      ['yaw', 'pitch', 'target', 'scaled', 'spin', 'idleAfter', 'ms', 'growLimb', 'then', 'encode'].forEach((k) => { if (opts[k] !== undefined) p[k] = opts[k]; });
      if (opts.at) { p.at = { ...p.at, ...opts.at }; if (opts.at.x !== undefined) fit.pinX = true; if (opts.at.y !== undefined) fit.pinY = true; }
      p.preset = name;
      p.fit = fit;
      return p;
    }
    /** move the camera: frame('offer'), frame('explore', { distMul: 1.15 }), frame({ dist: 1.0, ms: 2400 }), frame('offer', { growLimb: 'pricing' }) */
    frame(preset, opts = {}) {
      // a part, as the page names it for a label: { limb: 'trunk', t: 0.8 } is the control section's frame, { limb: 'demand', t: 0.35 } is Reach's
      if (preset && typeof preset === 'object' && preset.limb !== undefined) {
        const l = preset.limb, t = preset.t === undefined ? undefined : +preset.t;
        preset = l === 'control' ? 'control' : l === 'trunk' ? (t === undefined || t >= 0.6 ? 'control' : 'you')
          : l === 'demand' && t !== undefined ? (t >= 0.6 ? 'routes' : 'reach') : LIMB_SECTION[l] || 'explore';
      }
      let p;
      if (typeof preset === 'string') p = this.resolvePreset(preset, opts);
      else {
        const o = preset || {};
        const fit = { ...(this.pose.fit || { kind: 'none' }), solveYaw: false };
        p = { ...this.pose, ...o, at: o.at ? { ...this.pose.at, ...o.at } : { ...this.pose.at }, ms: o.ms === undefined ? 900 : o.ms, then: o.then };
        if (fit.kind === 'none') {
          if (o.distMul) p.dist = this.pose.dist * o.distMul;
        } else {
          if (o.dist !== undefined) fit.legacyMul = +o.dist;
          if (o.distMul) { if (fit.legacyMul != null) fit.legacyMul *= o.distMul; else fit.mul = (fit.mul || 1) * o.distMul; }
          p.dist = this.pose.dist;
        }
        if (o.at) { if (o.at.x !== undefined) fit.pinX = true; if (o.at.y !== undefined) fit.pinY = true; }
        p.fit = fit;
        p.preset = this.pose.preset;
      }
      if (typeof preset === 'string') {
        if (preset !== 'intro' && preset !== 'arrival') this.trunkDemo = false; // the demonstration tree is over
        if (preset !== this.pose.preset) this.zoomReset(false); // a new stage starts from its own frame
      } else if (preset && (preset.dist !== undefined || preset.distMul)) this.zoomReset(false);
      const rm = reduce();
      // reduced motion: a move in two parts (the cutscene's rise) goes straight to where it ends
      if (rm && p.then) {
        ['yaw', 'pitch', 'target', 'scaled', 'spin', 'idleAfter', 'encode'].forEach((k) => { if (p.then[k] !== undefined) p[k] = p.then[k]; });
        if (p.then.at) p.at = { ...p.at, ...p.then.at };
        p.then = null;
      }
      if (p.encode !== undefined && !!p.encode !== this.encode) { this.encode = !!p.encode; this.groupsDirty = true; }
      if (p.preset === 'roots') this.crownTarget = 0;
      if (p.preset !== this.pose.preset) { this.groupsDirty = true; this.unshrink(); } // the labels and the Core read the preset
      this.solve(p);
      const now = performance.now();
      const sp = this.shownPose;
      const from = sp ? { yaw: this.yaw, pitch: sp.pitch, dist: sp.dist, target: sp.target.slice(), scaled: false, at: { ...sp.at } }
        : { yaw: this.yaw, pitch: this.cam.pitch, dist: this.pose.abs ? this.pose.dist : this.pose.dist * this.fitDist(), target: this.pose.target.slice(), scaled: this.pose.scaled, at: { ...this.pose.at } };
      this.lastPointer = now;
      // yaw takes the short way round
      let dy = (p.yaw - from.yaw) % (Math.PI * 2);
      if (dy > Math.PI) dy -= Math.PI * 2;
      if (dy < -Math.PI) dy += Math.PI * 2;
      p.yaw = from.yaw + dy;
      // reduced motion: a move that turns the tree or changes its size by much is a cut; a small one is a 160 ms ease
      let ms = Math.max(0, p.ms === undefined ? 900 : p.ms);
      if (rm) {
        const toD = p.abs ? p.dist : p.dist * this.fitDist();
        const ratio = toD / Math.max(0.001, from.dist);
        const big = Math.abs(dy) > 0.25 || Math.abs(p.pitch - from.pitch) > 0.2 || ratio > 1.25 || ratio < 0.8
          || Math.abs(p.at.x - from.at.x) > 0.08 || Math.abs(p.at.y - from.at.y) > 0.08 || Math.abs(p.target[1] - from.target[1]) > 0.15;
        ms = big ? 0 : Math.min(ms, 160);
      }
      this.pose = { ...p, at: { ...p.at } };
      this.tween = { from, t0: now, ms, then: p.then || null };
      this.velocity = 0;
      this.idleAt = now;
      if (p.growLimb && this.branches.has(p.growLimb)) {
        const b = this.branches.get(p.growLimb);
        b.hold = { from: now, at: now + Math.max(0, ms - 500), ms: 500, start: Math.min(b.f, STUB_F) };
      }
      return this.pose;
    }
    /** fit the pose in play again (the tree changed size, the roots grew, the window changed) without touching yaw, pitch or spin */
    refit(ms = 900) {
      const p = this.pose;
      if (!p || !p.fit || p.fit.kind === 'none') return;
      const q = { ...p, at: { ...p.at }, fit: { ...p.fit, solveYaw: false } };
      this.solve(q);
      const changed = Math.abs(q.dist - p.dist) > 0.01 * p.dist || Math.abs(q.at.x - p.at.x) > 0.004 || Math.abs(q.at.y - p.at.y) > 0.004;
      p.fit = q.fit;
      if (!changed) return;
      const sp = this.shownPose;
      if (!this.tween && sp) {
        this.tween = { from: { yaw: this.yaw, pitch: sp.pitch, dist: sp.dist, target: sp.target.slice(), scaled: false, at: { ...sp.at } }, t0: performance.now(), ms: reduce() ? 0 : Math.max(0, ms), then: null, free: true };
      }
      p.dist = q.dist;
      p.at = q.at;
    }
    /* ---------- zoom and fit (R16) ---------- */
    /** the usable viewport for a fit: the part of the screen outside the clearing, px { left, top, right, bottom }. At 1440
        the clearing is the left 46% (the intro has none); on the phone it is the sheet, whose edge the root tips may pass by
        FIT.sheet.under; the top bar's band is never usable. */
    usable(fit, w, h) {
      const R = this.treeRegion();
      if (this.portrait) {
        const S = FIT.sheet, short = h <= FIT.base.portrait.shortH;
        const line = fit && fit.baseYPortrait !== undefined ? (short ? S.exploreShort : S.explore) : short ? S.topShort : S.top;
        // the shell's measured sheet line wins when it stands higher than the layout's own share (Task 02)
        const own = (line + S.under) * h;
        const top = Math.min(ZOOM.top, FIT.whole.top * h);
        return { left: 0, top: R ? Math.max(top, R.top) : top, right: w, bottom: R ? Math.min(own, R.bottom + S.under * h) : own };
      }
      return { left: this.keepLeft(fit, w), top: R ? Math.max(ZOOM.top, R.top) : ZOOM.top, right: w - ZOOM.edge, bottom: h };
    }
    /** the tree's box in the stage's own frame (the pose in play, unzoomed) and the usable viewport, into this.zoom. Read when
        a zoom is asked for, never per frame: the box is made of rings, so it does not change as the tree turns. */
    zoomBox() {
      const Z = this.zoom, w = this.size.w, h = this.size.h, p = this.pose;
      Z.boxed = false;
      if (!w || !p || !p.abs) return false;
      const s = this.scaleFinal();
      const e = this.extents(this.subjectWhole(s, true), p.yaw, p.pitch, p.dist, [p.target[0], p.target[1] * (p.scaled ? s : 1), p.target[2]], p.at, w, h);
      const U = this.usable(p.fit, w, h);
      Z.box[0] = e.left; Z.box[1] = e.top; Z.box[2] = e.right; Z.box[3] = e.bottom;
      Z.use[0] = U.left; Z.use[1] = U.top; Z.use[2] = U.right; Z.use[3] = U.bottom;
      Z.boxed = true;
      return true;
    }
    /** hold the asked zoom inside its limits: k between ZOOM.min and ZOOM.max, and the pan so the tree never leaves the usable
        viewport: on each axis a tree smaller than the viewport stays wholly inside it, a larger one covers it. At k = 1 the
        pan is nothing (the stage's own frame); it is let out over the first ZOOM.settle of zoom, so there is no jump at 1. */
    zoomClamp() {
      const Z = this.zoom;
      Z.tk = clamp(Z.tk, ZOOM.min, ZOOM.max);
      if (Z.tk <= 1.0005) { Z.tk = 1; Z.tx = 0; Z.ty = 0; return; }
      if (!Z.boxed) return;
      const m = clamp((Z.tk - 1) / ZOOM.settle);
      for (let a = 0; a < 2; a++) {
        const p0 = (Z.use[a] - Z.tk * Z.box[a]) * m, p1 = (Z.use[a + 2] - Z.tk * Z.box[a + 2]) * m;
        if (a) Z.ty = clamp(Z.ty, Math.min(p0, p1), Math.max(p0, p1)); else Z.tx = clamp(Z.tx, Math.min(p0, p1), Math.max(p0, p1));
      }
    }
    /** zoom by f about the canvas point (cx, cy): what is under that point stays under it, until a limit holds the pan.
        cut: the shown zoom follows at once (a pinch tracks the fingers; reduced motion always cuts). Returns the asked k. */
    zoomAt(f, cx, cy, cut) {
      const Z = this.zoom;
      if (!(f > 0) || !this.planted || this.intro || !this.size.w) return Z.tk;
      const was = Z.tk;
      const k = clamp(Z.tk * f, ZOOM.min, ZOOM.max), g = k / Z.tk;
      this.zoomBox();
      Z.tx = g * Z.tx + cx * (1 - g);
      Z.ty = g * Z.ty + cy * (1 - g);
      Z.tk = k;
      this.zoomClamp();
      if (cut || reduce()) { Z.k = Z.tk; Z.x = Z.tx; Z.y = Z.ty; }
      this.lastPointer = performance.now();
      if (Z.tk !== was) this.emit('zoom', { k: Z.tk, min: ZOOM.min, max: ZOOM.max });
      this.start();
      return Z.tk;
    }
    /** zoom in (f > 1) or out (f < 1), about `at` ({ x, y } in canvas px) or the middle of the usable viewport. The shell's
        #tree-tools buttons call zoomBy(GrowthTree.ZOOM.step) and zoomBy(1 / GrowthTree.ZOOM.step). Returns the zoom asked for. */
    zoomBy(f, at) {
      const w = this.size.w, h = this.size.h;
      let cx = w / 2, cy = h / 2;
      if (at && isFinite(+at.x) && isFinite(+at.y)) { cx = +at.x; cy = +at.y; }
      else if (w) { const U = this.usable(this.pose.fit, w, h); cx = (U.left + U.right) / 2; cy = (U.top + U.bottom) / 2; }
      return this.zoomAt(+f, cx, cy, false);
    }
    /** back to the stage's own frame (eased; a cut under reduced motion or when asked) */
    zoomReset(cut) {
      const Z = this.zoom;
      const was = Z.tk;
      Z.tk = 1; Z.tx = 0; Z.ty = 0;
      if (cut || reduce()) { Z.k = 1; Z.x = 0; Z.y = 0; }
      if (was !== 1) this.emit('zoom', { k: 1, min: ZOOM.min, max: ZOOM.max });
    }
    /** the zoom asked for: 1 is the stage's own frame */
    zoomLevel() { return this.zoom.tk; }

    /** the legacy whole-tree distance, kept for the seed at arrival (nothing to fit yet) */
    fitDist() {
      const vw = this.size.w || window.innerWidth || 1, vh = this.size.h || window.innerHeight || 1; // before the first sizing, the window
      const fov = (this.camera.fov * Math.PI) / 180, tanH = Math.tan(fov / 2), asp = Math.max(0.2, vw / Math.max(1, vh));
      const fit = (W, H) => Math.max(H / 2 / tanH, W / 2 / (tanH * asp));
      const s = this.scaleNow;
      const top = (UNIT_H + 0.6) * s, bottom = -this.rootDepth();
      const H = top - bottom + 0.45, W = Math.max(3.4 * s, 2.9);
      return fit(W, H) * 1.02;
    }
    /** what the camera achieved, for the console: tree.frameReport(). Projected anchors (px and shares of the viewport),
        the fill reached against the fill asked for, the subject's extents, the tip against its band, and what solve() corrected. */
    frameReport() {
      const w = this.size.w, h = this.size.h;
      if (!w) return null;
      const p = this.pose, sp = this.shownPose, fit = p.fit || { kind: 'none' };
      const port = this.portrait;
      const n3 = (v) => +(+v).toFixed(3);
      const pt = (a) => (a ? { x: Math.round(a.x), y: Math.round(a.y), xN: n3(a.x / w), yN: n3(a.y / h), front: a.front, inView: a.inView } : null);
      const anchors = {};
      ['seed', 'core', 'trunk', 'control', 'top', 'crown', 'roots'].concat(ORDER).forEach((k) => { anchors[k] = pt(this.anchor(k)); });
      SRC.forEach((id) => { anchors[`root:${id}`] = pt(this.anchor(`root:${id}`)); });
      const out = { preset: p.preset || null, kind: fit.kind, size: { w, h }, portrait: port, settled: !this.tween, scale: n3(this.tree.scale.x), scaleFittedFor: fit.s === undefined ? null : n3(fit.s),
        pose: { yaw: n3(p.yaw), pitch: n3(p.pitch), dist: n3(p.abs ? p.dist : p.dist * this.fitDist()), at: { x: n3(p.at.x), y: n3(p.at.y) } }, anchors, corrected: fit.corrected || [], planned: { tip: fit.tipPlan || null } };
      if (!sp) return out;
      const sNow = this.tree.scale.x;
      const prNow = this.projector(this.yaw, sp.pitch, sp.dist, sp.target, sp.at, w, h);
      const live = (pts) => this.extents(pts, this.yaw, sp.pitch, sp.dist, sp.target, sp.at, w, h);
      const box = (e) => ({ top: Math.round(e.top), bottom: Math.round(e.bottom), left: Math.round(e.left), right: Math.round(e.right), topN: n3(e.top / h), bottomN: n3(e.bottom / h), leftN: n3(e.left / w), rightN: n3(e.right / w) });
      const tree = live(this.subjectWhole(sNow, true));
      out.tree = { ...box(tree), spanN: n3((tree.bottom - tree.top) / h) }; // leaf envelope top to root tips, as a share of the height
      // R16: the usable viewport, whether the stage's own frame holds the whole tree inside it, and the tree as zoomed
      const U = this.usable(fit, w, h), Z = this.zoom, tolU = ZOOM.tol * h + 1;
      out.usable = { left: Math.round(U.left), top: Math.round(U.top), right: Math.round(U.right), bottom: Math.round(U.bottom) };
      out.inside = tree.top >= U.top - tolU && tree.bottom <= U.bottom + tolU && tree.left >= U.left - tolU && tree.right <= U.right + tolU;
      out.zoom = { k: n3(Z.k), x: Math.round(Z.x), y: Math.round(Z.y), asked: n3(Z.tk), min: ZOOM.min, max: ZOOM.max };
      out.view = box({ top: Z.k * tree.top + Z.y, bottom: Z.k * tree.bottom + Z.y, left: Z.k * tree.left + Z.x, right: Z.k * tree.right + Z.x });
      let achieved = null, subject = null, ok = true;
      const tanH = Math.tan((this.camera.fov * Math.PI) / 360);
      const winH = port ? FIT.winH.portrait : FIT.winH.landscape;
      const sphereFill = (pts) => { const sph = this.boundSphere(pts); return sph.r / (tanH * prNow(sph.c[0], sph.c[1], sph.c[2]).depth * winH); };
      // the phone's one frame (whole tree, a section, the trunk): the base to the crown's top against the room between them
      const phoneFrame = port && (fit.kind === 'whole' || fit.kind === 'section' || fit.kind === 'trunk');
      if (fit.kind === 'whole' || phoneFrame) {
        const e = live(this.subjectWhole(sNow, !port));
        subject = box(e);
        achieved = port ? ((e.bottom - e.top) / Math.max(1, (sp.at.y - FIT.whole.top) * h)) * FIT.whole.fill : (e.bottom - e.top) / h;
        const left = this.keepLeft(fit, w);
        ok = e.top >= 0 && e.bottom <= h && (port || e.left >= left - 2) && e.right <= w;
        if (port) out.room = { top: Math.round(FIT.whole.top * h), base: Math.round(sp.at.y * h), treeTop: Math.round(e.top), spare: Math.round(e.top - FIT.whole.top * h) };
        if (fit.kind === 'section' && this.branches.has(fit.limb)) {
          const sub = this.subjectSection(fit.limb, fit.t, sNow);
          const tp = prNow(sub.tip[0], sub.tip[1], sub.tip[2]);
          const inX = tp.x > 8 && tp.x < w - 8;
          out.tip = { x: Math.round(tp.x), y: Math.round(tp.y), xN: n3(tp.x / w), yN: n3(tp.y / h), band: { xMin: null, y: null }, inX, inY: true, note: 'on the phone a section is the whole-tree frame, turned' };
          ok = ok && inX;
        }
      } else if (fit.kind === 'section' && this.branches.has(fit.limb)) {
        const sub = this.subjectSection(fit.limb, fit.t, sNow);
        subject = box(live(sub.pts));
        achieved = sphereFill(sub.pts);
        const tp = prNow(sub.tip[0], sub.tip[1], sub.tip[2]);
        const band = FIT.section.tipY;
        const pulled = (fit.legacyMul != null ? fit.legacyMul : fit.mul || 1) !== 1 || !!fit.contained;
        const inX = tp.x > FIT.section.tipMinX * w;
        const inY = tp.y >= band[0] * h - 1 && tp.y <= band[1] * h + 1;
        out.tip = { x: Math.round(tp.x), y: Math.round(tp.y), xN: n3(tp.x / w), yN: n3(tp.y / h), band: { xMin: FIT.section.tipMinX, y: band }, inX, inY, note: fit.contained ? 'the frame pulled back to keep the whole tree in view' : pulled ? 'the band is set before the distance is multiplied' : '' };
        ok = inX && (inY || pulled);
      } else if (fit.kind === 'trunk') {
        const pts = this.subjectTrunk(sNow);
        subject = box(live(pts));
        achieved = sphereFill(pts);
      } else if (fit.kind === 'roots') {
        const pts = this.subjectRoots();
        const e = live(pts);
        subject = { ...box(e), centreN: n3((e.top + e.bottom) / 2 / h) };
        achieved = sphereFill(pts);
      }
      out.base = pt(this.anchor('seed'));
      out.fill = { asked: fit.fillTarget == null ? null : fit.fillTarget, achieved: achieved == null ? null : n3(achieved), times: fit.legacyMul != null ? fit.legacyMul : fit.mul || 1 };
      out.subject = subject;
      out.ok = ok;
      out.shown = { yaw: n3(this.yaw), pitch: n3(sp.pitch), dist: n3(sp.dist), at: { x: n3(sp.at.x), y: n3(sp.at.y) } };
      // Rebuild 1 (C13): the labels as placed (canvas px), the ones that found nowhere, the marker ring's box and the room kept
      out.reserve = fit.reserve ? [fit.reserve[0], fit.reserve[1], fit.reserve[2]] : [0, 0, 0];
      out.labels = this.tagList.filter((L) => L.on).map((L) => ({ id: L.id, kind: L.kind, mode: L.mode || 'live', text: L.text, x0: Math.round(L.x0), y0: Math.round(L.y0), x1: Math.round(L.x1), y1: Math.round(L.y1), inside: L.inside }));
      // a label in play is either placed (`labels`), changing place (`labelsMoving`: fading out here and in there, 130 ms) or
      // with nowhere free to stand (`labelsHidden`: it waits rather than sit on the tree or on another label)
      out.labelsMoving = this.tagList.filter((L) => L.kind !== 'live' && L.mode && !L.on && L.swapAt).map((L) => L.id);
      out.labelsHidden = this.tagList.filter((L) => L.kind !== 'live' && L.mode && !L.on && !L.swapAt).map((L) => L.id);
      out.viewMode = this.view; // 'current' | 'plan' (out.view is the tree's box as zoomed, as before)
      out.metric = this.metric === undefined ? undefined : this.metric === null ? null : { ...this.metric };
      if (this.markerShown()) {
        const ring = [];
        this.ringPoints(ring, this.ringR, this.ringY, 24);
        const e = live(ring);
        out.marker = { ...box(e), k: n3(this.markerK), label: this.metricLabel, y: n3(this.ringY), r: n3(this.ringR), inside: e.top >= U.top - tolU && e.bottom <= U.bottom + tolU && e.left >= U.left - tolU && e.right <= U.right + tolU };
        const m = this.metric;
        if (m && m.scenario != null) { const ss = this.metricScale(m.scenario); const sp2 = [[0, this.envTop * ss, 0]]; this.ringPoints(sp2, this.envR * ss, this.envTop * ss - 0.3); out.plan = { ...box(live(sp2)), k: n3(this.planK), scale: n3(ss) }; }
      } else out.marker = null;
      // Final 1: the goal line's kind and pair, the halo, the branch open and the way back
      out.markerKind = this.markerKind;
      out.pair = this.metricPair();
      out.heightMeans = this.heightMeans();
      out.halo = this.getHalo();
      out.depth = this.depthActive();
      out.branch = this.branchOpen ? { ...this.branchData(this.branchOpen), box: this.branchBox ? [Math.round(this.branchBox[0]), Math.round(this.branchBox[1]), Math.round(this.branchBox[2]), Math.round(this.branchBox[3])] : null } : null;
      out.whole = { shown: this.resetOn === true, inside: this.insideBranch() };
      return out;
    }
    /** the camera for this frame: the eased pose, the pivot at its screen point */
    placeCamera(now, dt) {
      const tw = this.tween, p = this.pose;
      let k = 1;
      if (tw) {
        k = tw.ms <= 0 ? 1 : EASE(clamp((now - tw.t0) / tw.ms));
        if (now - tw.t0 >= tw.ms) {
          this.tween = null;
          if (tw.then) this.frame({ ...tw.then });
        }
      }
      const f = tw ? tw.from : p;
      const yawTarget = tw ? lerp(f.yaw, p.yaw, k) : p.yaw;
      if (!this.drag) {
        if (tw && !tw.free) this.yaw = yawTarget;
        else {
          // reduced motion: the tree never turns by itself (the intro's and the cutscene's orbit, the crown's idle turn),
          // and a drag stops where the finger leaves it
          const rm = reduce();
          this.velocity = rm ? 0 : this.velocity * Math.exp(-dt * 3);
          const idle = p.idleAfter ? (now - this.lastPointer > p.idleAfter ? 0.05 : 0) : 0;
          const spin = (rm ? 0 : p.spin || idle) + this.velocity;
          this.yaw += spin * dt;
          p.yaw = this.yaw;
        }
      }
      const pitch = tw ? lerp(f.pitch, p.pitch, k) : p.pitch;
      const pd = p.abs ? p.dist : p.dist * this.fitDist();
      const dist = tw ? lerp(f.dist, pd, k) : pd;
      const at = tw ? { x: lerp(f.at.x, p.at.x, k), y: lerp(f.at.y, p.at.y, k) } : p.at;
      const s = this.scaleNow * (0.35 + 0.65 * this.trunkF);
      const tg = (pose) => [pose.target[0], pose.target[1] * (pose.scaled ? s : 1), pose.target[2]];
      const a = tw ? tg(f) : tg(p), b = tg(p);
      const tx = lerp(a[0], b[0], k), ty = lerp(a[1], b[1], k), tz = lerp(a[2], b[2], k);
      // the target in the turned world
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      const wx = tx * cy + tz * sy, wz = -tx * sy + tz * cy;
      this.shownPose = { pitch, dist, target: [tx, ty, tz], at: { x: at.x, y: at.y } };
      this.cam.pitch = pitch;
      this.cam.dist = dist;
      this.cam.target.set(wx, ty, wz);
      this.camera.position.set(wx, ty + Math.sin(pitch) * dist, wz + Math.cos(pitch) * dist);
      this.camera.lookAt(wx, ty, wz);
      // the zoom shown closes on the zoom asked for; k, x and y move by the same share, so the point zoomed about stays put
      const Z = this.zoom;
      if (Z.k !== Z.tk || Z.x !== Z.tx || Z.y !== Z.ty) {
        const a = reduce() ? 1 : 1 - Math.exp(-dt * ZOOM.rate);
        Z.k += (Z.tk - Z.k) * a; Z.x += (Z.tx - Z.x) * a; Z.y += (Z.ty - Z.y) * a;
        if (Math.abs(Z.k - Z.tk) < 0.0008 && Math.abs(Z.x - Z.tx) < 0.08 && Math.abs(Z.y - Z.ty) < 0.08) { Z.k = Z.tk; Z.x = Z.tx; Z.y = Z.ty; }
      }
      // shown = k * (full - offset): the pivot's screen point, then the zoom, both through the view offset
      const ox = (0.5 - at.x) * this.size.w - Z.x / Z.k, oy = (0.5 - at.y) * this.size.h - Z.y / Z.k;
      if (ox !== this.viewOx || oy !== this.viewOy || this.viewW !== this.size.w || this.viewH !== this.size.h || this.viewK !== Z.k) {
        this.viewOx = ox; this.viewOy = oy; this.viewW = this.size.w; this.viewH = this.size.h; this.viewK = Z.k;
        this.camera.setViewOffset(this.size.w, this.size.h, ox, oy, this.size.w / Z.k, this.size.h / Z.k);
        this.camera.updateProjectionMatrix();
      }
      this.world.rotation.y = this.yaw;
    }

    /* ---------- where it is shown ---------- */
    mount(el, mode) {
      if (!this.ok || !el) return;
      this.mode = mode || this.mode;
      haloDom(this, el); // D11: behind the canvas, so it is there from the first demonstration and through every stage after
      if (this.canvas.parentElement !== el) el.appendChild(this.canvas);
      this.ensureTags(el);
      this.host = el;
      stageHost(this, el);
      this.size = { w: 0, h: 0 };
      this.leafLit = -3;
      this.start();
    }
    start() { if (!this.raf) this.raf = requestAnimationFrame(this.tick); }
    /** R16: back to the stage's own frame (zoom 1, no pan). It still sizes the canvas to its host and returns whether there is
        room to draw, as it always has: the frame loop calls sizeToHost() itself now. */
    fit() {
      this.zoomReset(false);
      this.start();
      return this.sizeToHost();
    }
    sizeToHost() {
      const el = this.canvas.parentElement;
      if (!el) return false;
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      if (w !== this.size.w || h !== this.size.h) {
        this.size = { w, h };
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        const port = clearing() === 'bottom';
        this.unshrink(); // a new size: the labels try their expanded form again, and find their places afresh
        if (port !== this.portrait) {
          this.portrait = port;
          if (this.pose.preset && typeof this.pose.preset === 'string') this.frame(this.pose.preset, { ms: 400 });
        } else this.refit(400); // the bands are shares of the viewport: a new size is a new fit
      }
      return w > 2 && h > 2;
    }
    encoding() { return this.encode || this.mode === 'canopy'; }
    scaleTarget() { return this.scaleFinal(); } // Task 20: one rule for both, and the answered share is not in it
    ensureTags(el) {
      if (!this.tags) {
        const box = document.createElement('div');
        box.className = 'tree-tags';
        const discs = document.createElement('div');
        discs.className = 'tree-discs';
        box.appendChild(discs);
        this.tags = { box, discs };
        if (this.label.el && this.label.el.parentElement === document.body) box.appendChild(this.label.el);
      }
      if (this.tags.box.parentElement !== el) el.appendChild(this.tags.box);
    }

    /* ---------- the planting: seed, roots, trunk, limbs as stubs, then (if asked) the crown ---------- */
    /** playIntro(ms, { phases: { roots, trunk, limbs, leaves }, leaves: 0..1, preset, camera }) resolves when grown */
    playIntro(ms, opts = {}) {
      // the growth starts from the seed: trunk, limbs and twigs at nothing. Twigs keep their state and open again as their
      // limb reaches them; rootlets already shown (Roots) stay and the rest grow in.
      if (this.intro && this.intro.done) { const was = this.intro.done; this.intro = null; was(); }
      this.twigHosts.forEach((b) => {
        b.f = 0; b.hold = null;
        if (b.mesh) { grow(b.mesh, 0); b.cap.visible = false; }
        b.subs.forEach((s) => { s.f = 0; grow(s.mesh, 0); });
        b.twigs.forEach((tw) => {
          if (!tw) return;
          tw.f = 0; tw.openAt = 0; tw.leafOn = false; grow(tw.mesh, 0); tw.bud.scale.setScalar(0.001); tw.bud.visible = false; tw.ring.visible = false; tw.cut.visible = false;
          if (tw.sprigs) { tw.sprigs.openAt = 0; tw.sprigs.list.forEach((sp) => { sp.f = 0; grow(sp.mesh, 0); }); }
        });
      });
      this.roots.forEach((g) => { g.grown0 = g.grown; });
      this.leafDirty = true;
      this.leader.forEach((l) => { l.f = 0; grow(l.mesh, 0); });
      this.trunkF = 0;
      this.leafK = 0;
      this.crownK = 0;
      this.shown.odds = 0;
      this.shown.profit = 0;
      const ph = opts.phases || null;
      let win;
      if (ph) {
        const total = (+ph.roots || 0) + (+ph.trunk || 0) + (+ph.limbs || 0) + (+ph.leaves || 0) || 1;
        let acc = 0;
        win = {};
        ['roots', 'trunk', 'limbs', 'leaves'].forEach((k) => { const w = (+ph[k] || 0) / total; win[k] = [acc, acc + Math.max(w, 0.001)]; acc += w; });
      } else win = { roots: [0.02, 0.24], trunk: [0.16, 0.46], limbs: [0.3, 0.6], leaves: [0.6, 0.85] };
      const leaves = opts.leaves === undefined ? 1 : clamp(+opts.leaves || 0);
      this.crownTarget = leaves;
      this.intro = { t0: performance.now(), ms: reduce() ? 1 : Math.max(1, +ms || 3000), win, leaves };
      if (opts.camera !== false) this.frame(opts.preset || 'planting', { ms: this.intro.ms });
      // R6: the intro's own tree (preset 'intro') is a demonstration and shows a resolved trunk; the visitor's planting does not
      this.trunkDemo = opts.trunkKnown !== undefined ? !!opts.trunkKnown : opts.preset === 'intro';
      this.start();
      return new Promise((res) => { this.intro.done = res; });
    }
    /** the growth jumps ahead to fraction f (0..1) when it is behind, so the words and the tree agree when the visitor
        presses Next early. The gap closes over 280 ms (at once under reduced motion); the camera's move keeps step.
        Returns the fraction the growth stands at or is heading for; 1 when nothing is growing and the tree stands. */
    introSeek(f) {
      const it = this.intro;
      if (!it) return this.planted ? 1 : 0;
      const now = performance.now();
      const k = clamp((now - it.t0) / it.ms);
      const want = clamp(+f || 0);
      if (want <= k + 0.002) return k;
      const gap = (want - k) * it.ms;
      if (reduce()) this.shiftIntro(gap);
      else it.seek = { left: gap, rate: gap / 280 };
      this.start();
      return want;
    }
    shiftIntro(ms) {
      if (!this.intro || !(ms > 0)) return;
      this.intro.t0 -= ms;
      if (this.tween && !this.tween.free && this.tween.ms >= this.intro.ms * 0.9) this.tween.t0 -= ms; // the intro's own camera move
    }
    /** back to the seed: no trunk, no limbs, no twigs, no leaves, no fruit, no roots (rootlets return with setRootSources),
        no collar, no discs, nothing selected, height meaning nothing. Used when the intro ends and Roots begins. */
    toSeed() {
      if (this.intro) { const done = this.intro.done; this.intro = null; if (done) done(); }
      this.planted = false;
      this.trunkDemo = false;
      this.trunkK = this.trunkKnown ? 1 : 0;
      this.zoomReset(true);
      this.setFocusPart(-1);
      this.trunkF = 0;
      this.leafK = 0;
      this.crownK = 0;
      this.crownTarget = 0;
      grow(this.trunk, 0);
      this.trunkCap.visible = false;
      this.leader.forEach((l) => { l.f = 0; grow(l.mesh, 0); });
      this.twigHosts.forEach((b) => {
        b.f = 0; b.fill = 0; b.hold = null;
        if (b.mesh) {
          b.stub = true; b.stubK = 1;
          grow(b.mesh, 0);
          b.cap.visible = false;
          b.collar.visible = false;
          b.spine.visible = false;
        }
        b.subs.forEach((s) => { s.f = 0; grow(s.mesh, 0); });
        b.twigs.forEach((tw) => {
          if (!tw) return;
          tw.state = null; tw.count = 0; tw.shownAt = 0; tw.openAt = 0; tw.leafOn = false; tw.kShown = 0; tw.born = 0; tw.f = 0;
          this.dropSprigs(tw);
          grow(tw.mesh, 0);
          tw.bud.scale.setScalar(0.001);
          tw.bud.visible = false;
          tw.ring.visible = false;
          tw.cut.visible = false;
        });
      });
      this.rootCounts = null;
      this.cvStrand = false;
      this.rootBalance = null;
      this.rootRShown = undefined;
      this.roots.forEach((g) => { g.norm = 0; g.normShown = 0; g.grown = 0; g.grown0 = 0; this.rootStrands(g, 0, 0); g.built = -1; });
      this.collarOn = null;
      this.selected = null;
      this.part = null;
      this.encode = false;
      this.shown.progress = 0; this.shown.odds = 0; this.shown.profit = 0; this.shown.repeat = 0;
      this.scaleNow = S_REST;
      this.leafMesh.count = 0;
      this.fruitMesh.count = 0;
      this.fruitSlots = [];
      this.crownProxy.scale.setScalar(0.001);
      this.leafDirty = true;
      this.leafLit = -3;
      this.seed.visible = true;
      if (this.tags && this.discs.length) this.setDiscs([]);
      // Rebuild 1: the part states go with the tree (the intro's demonstration must not leak into the visitor's), the view
      // returns to current, the marker and the silhouette are out (the metric itself is the page's and stays)
      this.partState = {};
      this.view = 'current';
      this.planK = 0; this.planOn = false; this.markerK = 0;
      this.plan.visible = false;
      this.marker.visible = false;
      this.groupsDirty = true;
      this.start();
      return this;
    }

    /* ---------- pointer ---------- */
    bindPointer() {
      const c = this.canvas;
      c.style.touchAction = 'pan-y';
      const P = this.pinch;
      c.addEventListener('pointerdown', (e) => {
        this.lastPointer = performance.now();
        this.halo.pressAt = this.lastPointer; // Task 06: touch has no hover, so a press is the response it gets
        this.start();
        if (this.drag && this.drag.id !== e.pointerId && P.b < 0) {
          // a second finger: the turn ends and a pinch begins (R16); no tap comes out of it
          P.a = this.drag.id; P.ax = this.drag.x; P.ay = this.drag.y; P.b = e.pointerId; P.bx = e.clientX; P.by = e.clientY;
          P.d = Math.max(1, Math.hypot(P.bx - P.ax, P.by - P.ay));
          P.mx = (P.ax + P.bx) / 2; P.my = (P.ay + P.by) / 2;
          this.drag = null;
          this.velocity = 0;
          try { c.setPointerCapture(e.pointerId); } catch (err) { /* a synthetic pointer */ }
          return;
        }
        if (P.b >= 0) return; // a third finger
        this.drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId };
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* a synthetic pointer */ }
      });
      c.addEventListener('pointermove', (e) => {
        this.lastPointer = performance.now();
        const rc = c.getBoundingClientRect(); // Task 06: where the pointer is, for the decorative depth (it moves nothing else)
        this.ptrX = e.clientX - rc.left;
        this.ptrY = e.clientY - rc.top;
        this.ptrIn = true;
        if (P.b >= 0) {
          if (e.pointerId === P.a) { P.ax = e.clientX; P.ay = e.clientY; } else if (e.pointerId === P.b) { P.bx = e.clientX; P.by = e.clientY; } else return;
          const d = Math.max(1, Math.hypot(P.bx - P.ax, P.by - P.ay));
          const mx = (P.ax + P.bx) / 2, my = (P.ay + P.by) / 2;
          if (!this.dragLocked) {
            this.zoomAt(d / P.d, mx - rc.left, my - rc.top, true); // the fingers are followed, not eased after
            this.panBy(mx - P.mx, my - P.my);                      // Task 21: two fingers also move the view
          }
          P.d = d; P.mx = mx; P.my = my;
          return;
        }
        if (this.drag && this.drag.id === e.pointerId) {
          const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
          this.drag.x = e.clientX;
          this.drag.y = e.clientY;
          this.drag.moved += Math.abs(dx) + Math.abs(dy);
          // the tree turns from S3 on, never while a text field has focus (lockDrag). Task 21: once the visitor has zoomed
          // in, the same drag pans instead, so a branch can be brought to the middle and nobody is stuck against an edge
          if (this.planted && !this.intro && !this.dragLocked) {
            if (this.zoom.tk > 1.01) this.panBy(dx, dy);
            else {
              this.yaw += dx * 0.008;
              this.pose.yaw += dx * 0.008;
              if (this.tween) this.tween.from.yaw += dx * 0.008;
              this.velocity = dx * 0.5;
            }
          }
          return;
        }
        const hit = this.pick(e);
        c.style.cursor = hit ? 'pointer' : 'grab';
        if (hit !== this.hovered) { this.hovered = hit; this.emit('hover', hit); }
      });
      const end = (e) => {
        if (P.b >= 0 && (e.pointerId === P.a || e.pointerId === P.b)) { P.a = -1; P.b = -1; return; } // the pinch is over; the finger left down does nothing more
        if (!this.drag || this.drag.id !== e.pointerId) return;
        const click = this.drag.moved < 5;
        this.drag = null;
        if (!click) return;
        // an unanswered twig under the tap is reported first ('twig': { id, limb, slot, state }), so the page can send the
        // visitor back to that question before the limb's own 'select' opens anything
        const tw = this.pickTwig(e);
        if (tw) this.emit('twig', tw);
        this.emit('select', this.pick(e));
        // R16: and what was tapped, for the page's inspect chip: { id, kind: 'twig' | 'limb' | 'root', x, y } in viewport px.
        // Task 19: at the results the tree is the navigation surface, so a tap anywhere on a branch, leaves included, is that
        // branch, and one panel opens. During questioning a leaf is the answer it stands for, exactly as before.
        const ins = this.inspectAt(e);
        const asBranch = !!(ins && ins.kind === 'twig' && this.encoding() && this.inspectorOn !== false && this.branches.has(ins.limb));
        if (ins) this.emit('inspect', asBranch ? { id: ins.limb, kind: 'limb', x: ins.x, y: ins.y, twig: ins.id, slot: ins.slot } : ins);
        // Task 21, Inspect: the branch's own panel. At the results the camera goes with it; during questioning it does not,
        // and it opens only where the page has given that branch something to show
        const part = asBranch ? ins.limb : ins && ins.kind === 'limb' ? ins.id : null;
        if (part && this.inspectorOn !== false && (this.encoding() || this.branchInfo[this.branchPart(part)])) {
          this.expandBranch(part, { frame: this.encoding() });
        }
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('pointerleave', () => {
        this.ptrIn = false; // the depth settles back to nothing when the pointer leaves
        this.start();
        if (this.hovered) { this.hovered = null; this.emit('hover', null); }
      });
      // Ctrl or Cmd + wheel zooms about the pointer (a trackpad pinch arrives as one); a plain wheel is the page's, untouched
      c.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey) || this.dragLocked) return;
        e.preventDefault();
        const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 300 : 1);
        const fine = Math.abs(dy) < 40;
        const r = c.getBoundingClientRect();
        this.zoomAt(Math.exp(-dy * (fine ? ZOOM.pinchWheel : ZOOM.wheel)), e.clientX - r.left, e.clientY - r.top, fine);
      }, { passive: false });
    }
    /** R16, the keyboard on the focused stage host: Left and Right turn, + and - zoom, 0 fits, Up and Down move between the
        tree's parts, Enter (or Space) inspects the focused part, Escape lets it go. The key stops at the stage. */
    onKey(e, el) { return stageKey(this, e, el || this.host); }
    /** turn by d radians: a short eased turn, a single step under reduced motion. As the drag: not before the planting, not while locked */
    turnBy(d) {
      if (!this.planted || this.intro || this.dragLocked) return;
      this.lastPointer = performance.now();
      if (reduce()) {
        this.yaw += d; this.pose.yaw += d;
        if (this.tween) this.tween.from.yaw += d;
      } else this.velocity = d * 3; // placeCamera lets a velocity v die away over v / 3 radians
      this.start();
    }
    /** the parts a key can reach, in order: the trunk, each limb then its twigs, the control twigs, the root bundles */
    listParts() {
      const out = [];
      if (!this.planted) return out;
      if (this.trunkF > 0.5) out.push({ kind: 'limb', id: 'trunk' });
      this.twigHosts.forEach((b) => {
        if (b.mesh && b.f > 0.05) out.push({ kind: 'limb', id: b.id, b });
        b.twigs.forEach((tw, i) => { if (tw && tw.id && tw.state && tw.f > 0.3) out.push({ kind: 'twig', id: tw.id, b, tw, slot: i }); });
      });
      this.tagList.forEach((L) => { if (L.kind === 'group' && L.on) out.push({ kind: 'group', id: L.id, L }); }); // Rebuild 1: the labels, before the roots
      this.roots.forEach((g) => { if (g.strands.length && g.main) out.push({ kind: 'root', id: g.id, g }); });
      return out;
    }
    /** a part's point on the canvas into this.sx, this.sy; nothing allocated (the focus ring follows it every frame) */
    partPx(part) {
      const v = this.lv2;
      if (part.kind === 'group') { const L = part.L; this.sx = (L.x0 + L.x1) / 2; this.sy = (L.y0 + L.y1) / 2; return L.on; }
      if (part.kind === 'twig') { const q = part.tw.bud.position; return this.toPx(this.tree, q.x, q.y, q.z); }
      if (part.kind === 'root') { if (!part.g.main) return false; part.g.main.curve.getPointAt(0.86, v); return this.toPx(this.world, v.x, v.y, v.z); }
      if (part.id === 'trunk') this.trunkCurve.getPointAt(0.5 * clamp(this.trunkF), v);
      else part.b.curve.getPointAt(clamp(part.b.f * 0.6, 0.02, 1), v);
      return this.toPx(this.tree, v.x, v.y, v.z);
    }
    stepFocus(dir) {
      const was = this.focusAt >= 0 && this.focusParts ? this.focusParts[this.focusAt] : null;
      const list = this.listParts();
      this.focusParts = list;
      if (!list.length) { this.setFocusPart(-1); return; }
      let i = was ? list.findIndex((q) => q.kind === was.kind && q.id === was.id) : -1;
      i = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
      this.setFocusPart(i);
    }
    setFocusPart(i) {
      const list = this.focusParts || [];
      this.focusAt = i >= 0 && i < list.length ? i : -1;
      focusDom(this);
      if (this.focusAt < 0) { this.focusParts = null; if (this.focusEl) this.focusEl.style.opacity = '0'; if (this.liveEl) this.liveEl.textContent = ''; return; }
      if (this.liveEl) this.liveEl.textContent = partName(list[this.focusAt]);
      this.focusTx = NaN;
      this.halo.pressAt = performance.now(); // Task 06: the keyboard gets the same brief response as a press
      this.start();
    }
    /** the focused part's canvas point as { x, y }, or null: + and - zoom about it */
    focusPoint() {
      const part = this.focusAt >= 0 && this.focusParts ? this.focusParts[this.focusAt] : null;
      if (!part) return null;
      if (!this.frameFresh) this.scene.updateMatrixWorld();
      return this.partPx(part) ? { x: this.sx, y: this.sy } : null;
    }
    /** Enter on the focused part: what a tap on it gives ('twig' for an unanswered twig, then 'inspect') */
    inspectFocus() {
      const part = this.focusAt >= 0 && this.focusParts ? this.focusParts[this.focusAt] : null;
      if (part && part.kind === 'group') { this.inspectGroup(part.L, null); return; }
      const at = part && this.focusPoint();
      if (!at) return;
      const r = this.canvas.getBoundingClientRect();
      const out = { id: part.id, kind: part.kind, x: at.x + r.left, y: at.y + r.top, key: true };
      if (part.kind === 'twig') {
        out.limb = part.b.id; out.slot = part.slot; out.state = part.tw.state;
        if (part.tw.state === 'bud' || part.tw.state === 'ring') this.emit('twig', { id: part.id, limb: part.b.id, slot: part.slot, state: part.tw.state });
      }
      this.emit('inspect', out);
      // Task 21: Enter on a branch opens its inspector, as a tap does; the panel's Close gives this focus back
      if (part.kind === 'limb' && this.inspectorOn !== false && (this.encoding() || this.branchInfo[this.branchPart(part.id)])) {
        this.expandBranch(part.id, { frame: this.encoding(), key: true, opener: document.activeElement || this.host || null });
      }
    }
    /** the ring round the focused part follows it */
    placeFocus() {
      const part = this.focusAt >= 0 && this.focusParts ? this.focusParts[this.focusAt] : null;
      if (!part || !this.focusEl) return;
      const gone = part.kind === 'twig' ? !part.tw.state : part.kind === 'root' ? !part.g.strands.length : part.kind === 'group' ? !part.L.on : false;
      if (gone || !this.planted) { this.setFocusPart(-1); return; }
      if (!this.partPx(part)) { this.focusEl.style.opacity = '0'; return; }
      if (!(Math.abs(this.sx - this.focusTx) < 0.5 && Math.abs(this.sy - this.focusTy) < 0.5)) {
        this.focusTx = this.sx; this.focusTy = this.sy;
        this.focusEl.style.transform = `translate3d(${this.sx.toFixed(1)}px, ${this.sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
        this.focusEl.style.opacity = '1';
      }
    }
    /** what a tap landed on, for the page's inspect chip: the nearest twig that carries an id (within 22 px of its tip, or
        inside its leaves), else the limb, the trunk or the root bundle under the pointer. Viewport px. null for the crown or the sky. */
    inspectAt(e) {
      if (!this.planted || !this.size.w) return null;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (!this.frameFresh) this.scene.updateMatrixWorld();
      const ppu = (this.size.h / 2 / Math.tan((this.camera.fov * Math.PI) / 360)) * this.zoom.k * this.tree.scale.x;
      let best = null, bestD = 22, bx = 0, by = 0;
      for (let hi = 0; hi < this.twigHosts.length; hi++) {
        const b = this.twigHosts[hi];
        for (let i = 0; i < b.twigs.length; i++) {
          const tw = b.twigs[i];
          if (!tw || !tw.id || !tw.state || tw.f < 0.35) continue;
          const q = tw.bud.position;
          if (!this.toPx(this.tree, q.x, q.y, q.z)) continue;
          const tx = this.sx, ty = this.sy;
          let d = Math.hypot(tx - x, ty - y);
          if (tw.count && tw.kShown > 0.5 && this.toPx(this.tree, tw.pos.x, tw.pos.y, tw.pos.z)) {
            const rpx = Math.max(12, (tw.radius * ppu) / this.sd);
            d = Math.min(d, (22 * Math.hypot(this.sx - x, this.sy - y)) / rpx); // inside the cluster counts as within reach
          }
          if (d < bestD) { bestD = d; best = tw; bx = tx; by = ty; this.insHost = b; this.insSlot = i; }
        }
      }
      if (best) return { id: best.id, kind: 'twig', x: bx + r.left, y: by + r.top, limb: this.insHost.id, slot: this.insSlot, state: best.state };
      const hit = this.pickHit(e);
      if (!hit) return null;
      const driver = hit.object.userData.driver;
      if (driver === 'roots') return { id: hit.object.userData.source || 'you', kind: 'root', x: e.clientX, y: e.clientY };
      if (!driver) return null;
      const out = { id: driver, kind: 'limb', x: e.clientX, y: e.clientY };
      if (driver === 'trunk') out.part = this.tree.worldToLocal(this.lv2.copy(hit.point)).y / UNIT_H >= CONTROL.t0 ? 'control' : 'trunk';
      return out;
    }
    ray(e) {
      const r = this.canvas.getBoundingClientRect();
      const v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(v, this.camera);
      return this.raycaster;
    }
    /** the unanswered twig (a bud, or the ring of a Not sure) nearest the pointer, within 22 px of its tip on screen: a bud is
        a 6 px sphere, too small for a ray. { id, limb, slot, state } or null; only twigs the page gave an id. */
    pickTwig(e) {
      if (!this.planted || !this.size.w) return null;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (!this.frameFresh) this.scene.updateMatrixWorld();
      let best = null, bestD = 22;
      this.twigHosts.forEach((b) => b.twigs.forEach((tw, i) => {
        if (!tw || !tw.id || !(tw.state === 'bud' || tw.state === 'ring') || tw.f < 0.9) return;
        const p = tw.bud.position;
        if (!this.toPx(this.tree, p.x, p.y, p.z)) return;
        const d = Math.hypot(this.sx - x, this.sy - y);
        if (d < bestD) { bestD = d; best = { id: tw.id, limb: b.id, slot: i, state: tw.state }; }
      }));
      return best;
    }
    /** what is under the pointer: a limb id, 'trunk', 'roots', 'crown' or null */
    pick(e) {
      const hit = this.pickHit(e);
      if (hit) return hit.object.userData.driver || null;
      if (this.planted && this.crownProxy.scale.x > 0.01 && this.raycaster.intersectObject(this.crownProxy, false).length) return 'crown';
      return null;
    }
    /** the nearest wood under the pointer (three's intersection: object, point), or null */
    pickHit(e) {
      if (!this.planted) return null;
      const targets = [];
      this.branches.forEach((b) => {
        if (b.mesh.visible) targets.push(b.mesh, b.cap);
        b.subs.forEach((s) => { if (s.mesh.visible) targets.push(s.mesh); });
        b.twigs.forEach((tw) => { if (tw && tw.mesh.visible) targets.push(tw.mesh); });
      });
      if (this.trunk.visible) targets.push(this.trunk);
      this.leader.forEach((l) => { if (l.mesh.visible) targets.push(l.mesh); });
      this.roots.forEach((g) => g.strands.forEach((s) => { if (s.mesh.visible) targets.push(s.mesh); }));
      this.ctl.twigs.forEach((tw) => { if (tw && tw.mesh.visible) targets.push(tw.mesh); });
      return this.ray(e).intersectObjects(targets, false)[0] || null;
    }

    /** a named point on screen: a limb id (its tip), 'trunk', 'roots', 'crown', 'core', 'seed', 'top', 'root:<source>',
        { limb, t } (a point along a limb) or { limb, twig } (a twig tip). { x, y, front, inView } or null */
    anchor(part) {
      if (!this.size.w) return null;
      const V = T.Vector3;
      if (!this.frameFresh) this.scene.updateMatrixWorld();
      let w = null;
      if (part && typeof part === 'object' && part.limb === 'trunk') {
        // a point up the trunk: { limb: 'trunk', t: 0.8 } is the control section's; never above the trunk as grown
        w = this.tree.localToWorld(this.trunkCurve.getPointAt(Math.min(clamp(part.t === undefined ? CONTROL.t : +part.t), clamp(this.trunkF))).clone());
      } else if (part && typeof part === 'object') {
        const b = this.twigHost(part.limb);
        if (!b) return null;
        if (part.twig !== undefined) {
          const tw = b.twigs[part.twig | 0];
          w = this.tree.localToWorld(tw ? tw.curve.getPointAt(1).clone() : b.curve.getPointAt(this.twigT(part.twig | 0)).clone());
        } else w = this.tree.localToWorld(b.curve.getPointAt(clamp(part.t === undefined ? 1 : +part.t)).clone());
      } else if (part === 'roots') w = this.world.localToWorld(new V(0, -this.rootDepth() * 0.5, 0));
      else if (part === 'seed') w = this.world.localToWorld(new V(0, 0.05, 0));
      else if (part === 'core') w = this.world.localToWorld(new V(0, 0.02, 0)); // the trunk base; moved beside the flare below
      else if (part === 'top') w = this.tree.localToWorld(this.trunkCurve.getPointAt(clamp(this.trunkF)).clone());
      else if (part === 'trunk') w = this.tree.localToWorld(this.trunkCurve.getPointAt(0.5).clone());
      else if (part === 'control') w = this.tree.localToWorld(this.trunkCurve.getPointAt(Math.min(CONTROL.t, clamp(this.trunkF))).clone());
      else if (part === 'crown') w = this.tree.localToWorld(this.crownProxy.position.clone());
      else if (typeof part === 'string' && part.startsWith('root:')) {
        const g = this.roots.find((x) => x.id === part.slice(5));
        if (g && g.main) w = this.world.localToWorld(g.main.curve.getPointAt(0.86).clone());
      } else if (this.branches.has(part)) {
        const b = this.branches.get(part);
        w = this.tree.localToWorld(b.curve.getPointAt(clamp(Math.max(b.f, 0.05))).clone());
      }
      if (!w) return null;
      const toCam = this.camera.position.distanceTo(w);
      const centre = this.camera.position.distanceTo(new V(this.cam.target.x, w.y, this.cam.target.z));
      const p = w.clone().project(this.camera);
      const out = { x: ((p.x + 1) / 2) * this.size.w, y: ((1 - p.y) / 2) * this.size.h, front: toCam < centre + 0.4, inView: p.x > -1 && p.x < 1 && p.y > -1 && p.y < 1 && p.z < 1 };
      // the Core: inView still says whether the trunk base is on screen; the point is the box's centre, the box inside the canvas
      return part === 'core' ? coreBeside(out, this.portrait, this.size.w, this.size.h) : out;
    }

    /** the flying value: from a screen point to a twig; resolves on arrival. Then the page sets the twig's leaves. */
    flight(from, limbId, twigIndex, text, kind) {
      const b = this.twigHost(limbId);
      const i = clamp(twigIndex | 0, 0, TWIG_SLOTS - 1);
      if (b) this.ensureTwig(b, i);
      const dest = () => this.anchor(b ? { limb: limbId, twig: i } : 'trunk');
      return flyDom(from || { x: this.size.w / 2, y: this.size.h / 2 }, dest, text, kind, () => { if (b && b.twigs[i]) b.twigs[i].arrived = performance.now(); });
    }

    /** a still of the tree as it stands, for the report */
    snapshot() {
      if (!this.size.w) return null;
      const Z = this.zoom;
      if ((Z.k !== 1 || Z.x !== 0 || Z.y !== 0) && this.shownPose) { // the report's still is the stage's own frame, not the visitor's zoom
        const at = this.shownPose.at;
        this.camera.setViewOffset(this.size.w, this.size.h, (0.5 - at.x) * this.size.w, (0.5 - at.y) * this.size.h, this.size.w, this.size.h);
        this.camera.updateProjectionMatrix();
        this.viewOx = NaN; // the next frame sets the zoomed view again
      }
      this.renderer.render(this.scene, this.camera);
      try { return this.canvas.toDataURL('image/png'); } catch (e) { return null; }
    }

    /* ---------- every frame ---------- */
    /** one host's twigs for this frame (a limb, or the trunk's upper third): a twig opens over 240 ms once its host has grown
        past it, its bud, ring or cut face follows, its sprigs open, its leaves wait for it. Leafy twigs are pushed on anim.
        True when the leaves must be laid out again. */
    stepTwigs(b, now, dt, rm, anim) {
      let moved = false;
      for (let ti = 0; ti < b.twigs.length; ti++) {
        const tw = b.twigs[ti];
        if (!tw) continue;
        const shown = !!tw.state && b.f >= tw.t + 0.02;
        const target = shown ? (tw.state === 'cut' ? 0.4 : 1) : 0;
        if (!shown) tw.openAt = 0; else if (!tw.openAt) tw.openAt = now; // the 240 ms run from the moment the limb reaches the slot
        if (shown && tw.openAt) {
          const open = rm ? 1 : easeOut((now - tw.openAt) / 240);
          tw.f = Math.min(target, Math.max(tw.f > target ? approach(tw.f, target, dt, 6) : 0, open * target));
        } else tw.f = approach(tw.f, target, dt, 8);
        grow(tw.mesh, tw.f);
        const tipK = tw.f >= 0.98 ? 1 : 0;
        const budK = tw.state === 'bud' ? tipK : 0;
        tw.bud.scale.setScalar(Math.max(0.001, approach(tw.bud.scale.x, budK * 0.03, dt, 8)));
        tw.bud.visible = tw.bud.scale.x > 0.002;
        tw.ring.visible = tw.state === 'ring' && tipK === 1;
        tw.cut.visible = tw.state === 'cut' && tw.f >= 0.39;
        // sprigs open off a twig that stands, 240 ms each, 60 ms apart; their leaves wait SPRIG_LAG for the wood
        if (tw.sprigs) {
          const S = tw.sprigs;
          const open = tw.state === 'leaf' && tw.f >= 0.98;
          if (!open) S.openAt = 0; else if (!S.openAt) S.openAt = now;
          for (let q = 0; q < S.list.length; q++) {
            const sp = S.list[q];
            const f = !open ? 0 : rm ? 1 : easeOut((now - S.openAt - 60 * q) / 240);
            if (f !== sp.f) { sp.f = f; grow(sp.mesh, f); }
          }
        }
        // a cluster waits for its twig: on a limb that is still growing (the planting) the leaves unfold as the twig opens
        const leafOn = tw.count > 0 && tw.f >= 0.9;
        if (leafOn !== tw.leafOn) { tw.leafOn = leafOn; moved = true; if (leafOn && now - tw.born > 400) tw.born = now; }
        if (tw.count && tw.leafOn) {
          const age = now - tw.born;
          // 0..1 over the whole unfolding: the last leaf starts 22 ms x (count - 1) in and takes 700 ms. (It used to read 1
          // when the last leaf started, so the matrices stopped being written with the last leaves part open.)
          const kk = rm ? 1 : clamp(age / (22 * (tw.count - 1) + 700 + (tw.sprigs ? SPRIG_LAG : 0)));
          if (kk < 1 || tw.kShown !== 1) moved = true;
          tw.kShown = kk;
          anim.push(tw);
        } else if (tw.kShown) { tw.kShown = 0; moved = true; }
      }
      return moved;
    }

    tick(now) {
      this.raf = 0;
      if (!this.canvas.isConnected || document.hidden) return;
      const dt = this.last ? Math.min(0.05, Math.max(0, (now - this.last) / 1000)) : 1 / 60; // never negative: the easings diverge on a clock that steps back
      this.last = now;
      if (!this.sizeToHost()) { this.raf = requestAnimationFrame(this.tick); return; }
      const rm = reduce();
      if (this.intro && this.intro.seek) { // introSeek: the gap closes at its own rate
        const sk = this.intro.seek;
        const step = Math.min(sk.left, sk.rate * dt * 1000);
        this.shiftIntro(step);
        sk.left -= step;
        if (sk.left <= 0.5) this.intro.seek = null;
      }
      const k = this.intro ? clamp((now - this.intro.t0) / this.intro.ms) : null;
      const win = this.intro ? this.intro.win : null;
      const phase = (name, lag = 0, span = 1) => { const [a, b] = win[name]; return easeOut((k - a - (b - a) * lag) / ((b - a) * span)); };
      const encode = this.encoding() && k === null;
      const planted = this.planted || k !== null;
      if (!this.skyAt || now - this.skyAt > 400) { this.skyAt = now; const prev = this.fogColor.getHex(); this.fogColor = skyColor(this.fogColor.getHex()); if (this.fogColor.getHex() !== prev && this.fogK > 0.01) this.leafLit = -3; }

      const m = this.metrics, sh = this.shown;
      ['progress', 'profit', 'repeat'].forEach((key) => { sh[key] = k !== null ? m[key] : approach(sh[key], m[key], dt, 2.2); });
      sh.odds = k !== null ? m.odds : approach(sh.odds, m.odds, dt, 2.2);

      this.scaleNow = k !== null ? this.scaleTarget() : approach(this.scaleNow, this.scaleTarget(), dt, 2);
      this.trunkF = k !== null ? phase('trunk') : approach(this.trunkF, planted ? 1 : 0, dt, 2);
      const s = Math.max(0.001, this.scaleNow * (0.35 + 0.65 * this.trunkF));
      this.tree.scale.setScalar(s);
      this.waveU.h.value = Math.max(0.1, UNIT_H * s);

      // the frame follows the tree: a new height (the results' metrics) or a wider root ball is a new fit, eased in
      const pf = this.pose.fit;
      if (pf && pf.kind !== 'none' && pf.s !== undefined && (!this.refitAt || now - this.refitAt > 500)) {
        const [rR, rD] = this.rootExtent();
        // the marker (and its label's room) arriving or leaving is a new fit too, as is a change of the labels' width
        const ms = this.markerShown(), rs = pf.reserve, sm = Math.max(this.portrait ? FIT.labels.sidePortrait : FIT.labels.side, FIT.labels.measured * ((this.smallW || 0) + LABEL.gap));
        const labelsGrew = !!(rs && rs[0] > 0 && !pf.reserveCapped && sm > rs[0] + 6);
        this.treeRegion(); // Task 02: cached at 500 ms; a region that moved is a new fit, as a new size is
        const moved = this.regionMoved;
        this.regionMoved = false;
        if (moved || Math.abs(this.scaleFinal() - pf.s) > 0.02 || Math.abs(rD - pf.rootD) > 0.08 || Math.abs(rR - pf.rootR) > 0.1 || ms !== !!pf.marker || labelsGrew) { this.refitAt = now; this.refit(900); }
      }
      this.placeCamera(now, dt);

      // one part shown by easing the others back (the intro beats)
      const dim = this.dimK;
      Object.keys(dim).forEach((p) => { dim[p] = approach(dim[p], !this.part || this.part === p ? 1 : 0.13, dt, 4); });
      const fade = (mt, a) => {
        const t = a < 0.995;
        if (mt.transparent !== t) { mt.transparent = t; mt.needsUpdate = true; }
        mt.opacity = t ? a : 1;
      };
      // R6: until the page says today's revenue is known the trunk (and its leaders) is the same pale bark as a limb's stub;
      // it resolves at the stub's own rate, at once under reduced motion. The intro's demonstration tree shows it resolved.
      // A page that never calls setTrunkKnown is asked through Mercer.trunkKnown(), when it has one, a few times a second
      if (!this.trunkKnownSet && typeof M.trunkKnown === 'function' && now - this.trunkAskAt > 400) {
        this.trunkAskAt = now;
        try { this.trunkKnown = !!M.trunkKnown(); } catch (e) { /* the page's own business */ }
      }
      const trunkTo = this.trunkDemo || this.trunkKnown ? 1 : 0;
      this.trunkK = rm || this.trunkF < 0.02 ? trunkTo : approach(this.trunkK, trunkTo, dt, 2.6);
      fade(this.mat.bark, dim.trunk * lerp(PALE_A, 1, this.trunkK));
      // Rebuild 1 (setPartState): roots and the control host follow their own evidence state; unknown is the stub's pale bark
      const PS = this.partState;
      const rootsTo = PS.roots && PS.roots.state === 'unknown' ? 0 : 1;
      this.rootsK = this.rootsK === undefined || rm ? rootsTo : approach(this.rootsK, rootsTo, dt, 2.6);
      const ctlTo = PS.control ? (PS.control.state === 'unknown' ? 0 : 1) : trunkTo;
      this.ctlK = this.ctlK === undefined || rm || this.trunkF < 0.02 ? ctlTo : approach(this.ctlK, ctlTo, dt, 2.6);
      const crownTo = PS.crown && PS.crown.state === 'unknown' ? 1 : 0;
      this.crownPaleK = this.crownPaleK === undefined || rm ? crownTo : approach(this.crownPaleK, crownTo, dt, 2.6);
      if (this.crownPaleK < 0.004 && !crownTo) this.crownPaleK = 0;
      const cpa = this.crownPaleApplied || 0;
      if (Math.abs(this.crownPaleK - cpa) > 0.03 || (this.crownPaleK === 0 && cpa > 0)) { this.crownPaleApplied = this.crownPaleK; this.leafLit = -3; }
      SRC.forEach((id) => fade(this.mat.roots[id], dim.roots * lerp(PALE_A, 1, this.rootsK)));
      fade(this.mat.leaf, dim.leaves);
      fade(this.mat.fruit, dim.leaves);
      fade(this.mat.cutFace, dim.branches);
      fade(this.mat.bud, dim.branches);
      this.mat.collar.opacity = 0.9 * dim.branches;
      // R10: the goal marker eases in once the tree encodes; the plan silhouette (setView('plan')) eases in over METRIC.ms
      // from the crown's own size to the scenario's. Cuts under reduced motion.
      const markerOn = this.markerShown() && planted && k === null;
      this.markerK = rm ? (markerOn ? 1 : 0) : approach(this.markerK, markerOn ? 1 : 0, dt, METRIC.rate);
      if (this.markerK < 0.01 && !markerOn) this.markerK = 0;
      this.marker.visible = this.markerK > 0.005;
      this.markerMat.opacity = METRIC.alpha * this.markerK * dim.leaves;
      const planOn = markerOn && this.view === 'plan' && !!this.metric && this.metric.scenario != null;
      if (planOn !== this.planOn) { this.planOn = planOn; this.planT0 = now; this.planFrom = this.planK; }
      this.planK = rm ? (planOn ? 1 : 0) : lerp(this.planFrom, planOn ? 1 : 0, EASE(clamp((now - this.planT0) / METRIC.ms)));
      if (!this.metric || this.metric.scenario == null) this.planK = 0; // the scenario went: nothing to fade
      this.plan.visible = this.planK > 0.005;
      if (this.plan.visible) {
        const ss = this.metricScale(this.metric.scenario);
        this.plan.scale.setScalar(lerp(this.tree.scale.x, ss, this.planK));
        this.planMat.opacity = METRIC.planAlpha * this.planK * dim.leaves;
      }

      // roots: thicker as a source gives more; as wide as the crown when the answers are the visitor's own
      let R = 0;
      if (this.rootBalance != null) {
        const cr = this.crownRadius() / Math.max(0.001, s);
        R = Math.max(0.35, cr * this.rootBalance);
        this.rootRShown = this.rootRShown === undefined ? R : approach(this.rootRShown, R, dt, 2.5);
      } else this.rootRShown = undefined;
      const normMax = Math.max(0.001, ...this.roots.map((g) => g.norm));
      this.roots.forEach((g) => {
        g.normShown = k !== null ? g.norm : approach(g.normShown, g.norm, dt, 3);
        const want = g.normShown < 0.012 ? 0 : g.normShown;
        const wantR = this.rootRShown === undefined ? 0 : this.rootRShown * (0.5 + 0.5 * (g.normShown / normMax));
        const cvChanged = g.id === 'you' && g.builtCv !== this.cvStrand && want > 0;
        if (Math.abs(want - g.built) > 0.035 || (want === 0 && g.built > 0) || (want > 0 && g.built < 0) || (want > 0 && Math.abs(wantR - g.builtR) > 0.06) || cvChanged) this.rootStrands(g, want, wantR);
        g.grown = k !== null ? Math.max(g.grown0 || 0, phase('roots')) : approach(g.grown, g.strands.length ? 1 : 0, dt, 2);
        g.strands.forEach((st) => { st.f = clamp((g.grown - st.lag) / (1 - st.lag)); grow(st.mesh, st.f); });
      });

      // trunk
      grow(this.trunk, this.trunkF);
      if (this.trunkF > 0.01 && this.trunkF < 0.995) {
        const tp = this.trunkCurve.getPointAt(clamp(this.trunkF));
        this.trunkCap.position.copy(tp);
        this.trunkCap.scale.setScalar(this.rT(clamp(this.trunkF)));
        this.trunkCap.visible = true;
      } else this.trunkCap.visible = false;
      this.leader.forEach((l, i) => {
        l.f = k !== null ? phase('limbs', 0.5 + i * 0.1, 0.5) * (this.trunkF > l.at ? 1 : 0) : approach(l.f, this.trunkF > l.at ? 1 : 0, dt, 2.4);
        grow(l.mesh, l.f);
      });
      const seedScale = planted ? clamp(1 - (k !== null ? (this.trunkF - 0.05) / 0.1 : 1)) : 1;
      this.seed.visible = seedScale > 0.01;
      this.seed.scale.set(0.07 * seedScale, 0.055 * seedScale, 0.07 * seedScale);
      this.contact.scale.setScalar(Math.max(0.2, 0.6 * s));

      // a selected limb keeps its colour; the rest of the crown loses some colour and falls back toward the sky
      const selLimb = this.selected && this.branches.has(this.selected) ? this.selected : null;
      const fogTarget = k === null && selLimb ? 1 : 0;
      if (fogTarget) this.fogOwner = selLimb;
      this.fogK = approach(this.fogK || 0, fogTarget, dt, 3);
      if (Math.abs(this.fogK - (this.fogApplied || 0)) > 0.02 || (fogTarget && this.fogOwner !== this.fogAppliedTo) || (!fogTarget && this.fogK < 0.02 && this.fogApplied)) {
        this.fogApplied = this.fogK < 0.02 && !fogTarget ? 0 : this.fogK;
        if (!this.fogApplied) this.fogK = 0;
        this.fogAppliedTo = this.fogOwner;
        this.leafLit = -3;
      }
      const barkCol = this.barkCol || (this.barkCol = new T.Color());
      barkCol.set(this.pal.bark);

      // limbs: a pale stub until the section is entered, then as long as the answered share
      let order = 0;
      let moved = this.leafDirty;
      const anim = [];
      [...this.branches.values()].sort((a, b) => LAYOUT[a.id].h - LAYOUT[b.id].h).forEach((b) => {
        const gate = this.trunkF >= LAYOUT[b.id].h - 0.02 ? 1 : 0;
        let lastTwig = -1;
        b.twigs.forEach((tw) => { if (tw && tw.state) lastTwig = Math.max(lastTwig, tw.t); });
        const need = lastTwig >= 0 ? lastTwig + 0.06 : 0;
        const full = Math.max(b.stub ? STUB_F : STUB_F + (1 - STUB_F) * b.fill, need);
        if (k !== null) {
          b.f = phase('limbs', order * 0.08, 0.7) * full * gate;
        } else if (b.hold && now < b.hold.at + b.hold.ms) {
          if (now < b.hold.at) b.f = Math.min(b.f, Math.max(b.hold.start, STUB_F * gate));
          else b.f = lerp(b.hold.start, full * gate, easeOut((now - b.hold.at) / b.hold.ms));
        } else {
          b.hold = null;
          b.f = approach(b.f, full * gate, dt, b.f > full * gate ? 3.5 : 1.8);
        }
        order++;
        grow(b.mesh, b.f);
        const tp = b.curve.getPointAt(clamp(b.f, 0.001, 1));
        b.cap.position.copy(tp);
        b.cap.scale.setScalar(b.radius(clamp(b.f)));
        b.cap.visible = b.f > 0.01 && b.f < 0.99;
        // stub: bark at 22%, the dashed spine showing where the limb will run. A part state (setPartState) rules instead
        // when there is one: unknown is the same pale bark, anything evidence-backed is solid
        const ps = PS[b.id];
        const paleTo = ps ? (ps.state === 'unknown' ? 1 : 0) : b.stub ? 1 : 0;
        b.stubK = k !== null || rm ? paleTo : approach(b.stubK, paleTo, dt, 2.6);
        const inkA = lerp(1, PALE_A, b.stubK);
        b.mat.color.copy(barkCol).lerp(this.fogColor, this.selected && b.id !== this.selected ? 0.3 : 0.1 * (this.fogK || 0));
        b.mat.opacity = inkA * dim.branches;
        b.spine.material.opacity = this.pal.spineA * b.stubK * dim.branches * (b.f > 0.05 ? 1 : 0);
        b.spine.visible = b.spine.material.opacity > 0.01;
        b.collar.visible = this.collarOn === b.id && b.f > 0.15;
        b.subs.forEach((sb) => {
          const open = b.f > sb.t + 0.08;
          sb.f = k !== null ? phase('limbs', 0.6, 0.4) * (open ? 1 : 0) : approach(sb.f, open ? 1 : 0, dt, 2.4);
          grow(sb.mesh, sb.f);
        });
        // twigs: open 240 ms once shown, gated by the limb's growth
        if (this.stepTwigs(b, now, dt, rm, anim)) moved = true;
      });
      // the control section's twigs leave the trunk's upper third: they open as the trunk grows past them, and their wood is
      // the trunk's own bark, as pale as the trunk while today's revenue is unknown
      {
        const c = this.ctl;
        c.f = clamp((this.trunkF - CONTROL.t0) / (CONTROL.t1 - CONTROL.t0));
        c.mat.color.copy(barkCol).lerp(this.fogColor, this.selected && this.selected !== 'trunk' ? 0.3 : 0.1 * (this.fogK || 0));
        c.mat.opacity = lerp(PALE_A, 1, PS.control ? this.ctlK : this.trunkK) * dim.trunk;
        if (this.stepTwigs(c, now, dt, rm, anim)) moved = true;
      }

      // the crown's own leaves (results, or a full intro); a twig's leaves are the answers
      this.leafK = k !== null ? phase('leaves') : approach(this.leafK, planted ? 1 : 0, dt, 2);
      const crownTarget = this.crownTarget === undefined ? 0 : this.crownTarget;
      this.crownK = k !== null ? crownTarget : approach(this.crownK, crownTarget, dt, 2);
      this.clusters.forEach((c) => {
        const ck = c.grown() * this.leafK * this.crownK;
        if (Math.abs(ck - c.k) > 0.002) { c.k = ck; moved = true; }
      });
      // a milestone (setMetric(null)) implies no number: every leaf keeps its colour and no fruit hangs
      const numbers = encode && this.metric !== null;
      const litShare = numbers ? clamp(sh.odds) : 1;
      const litKey = numbers ? Math.round(litShare * 60) : -2;
      if (litKey !== this.leafLit) { this.leafLit = litKey; this.recolourLeaves(numbers ? litShare : undefined); moved = true; }
      if (moved) {
        this.leafDirty = false;
        let li = 0;
        const dm = this.dummy, q = this.tmpQ;
        let cx = 0, cz = 0, cy = 0, cn = 0, cr = 0;
        this.leaves.forEach((lf, j) => {
          const c = this.clusters[lf.c];
          if (c.k <= 0.01 || li >= this.leafCap) return;
          const dry = numbers && lf.rank >= litShare;
          dm.position.copy(c.pos).addScaledVector(lf.off, 0.4 + 0.6 * c.k);
          dm.quaternion.copy(lf.q);
          dm.scale.setScalar(lf.size * c.k * (dry ? 0.8 : 1));
          dm.updateMatrix();
          this.leafMesh.setMatrixAt(li, dm.matrix);
          this.leafMesh.setColorAt(li, this.leafColours[j]);
          li++;
          cx += c.pos.x; cy += c.pos.y; cz += c.pos.z; cn++;
        });
        this.twigHosts.forEach((b) => b.twigs.forEach((tw) => {
          if (!tw || !tw.count || !tw.colours || !tw.leafOn) return;
          const age = now - tw.born;
          const rk = tw.radius / TWIG_BALL;
          const homes = tw.homes;
          for (let j = 0; j < tw.count && li < this.leafCap; j++) {
            const lf = tw.leaves[j];
            const hm = homes ? homes[j] : null; // a leaf on a sprig stands round the sprig's tip and waits for its wood
            const kj = rm ? 1 : easeOut((age - 22 * j - (hm ? hm.lag : 0)) / 700);
            if (kj <= 0.001) continue;
            const dry = numbers && lf.rank >= litShare;
            dm.position.copy(hm ? hm.pos : tw.pos).addScaledVector(lf.off, (0.4 + 0.6 * kj) * (hm ? hm.rk : rk));
            dm.quaternion.copy(lf.q).multiply(q.setFromAxisAngle(X_AXIS, (1 - kj) * 0.2094));
            dm.scale.setScalar(lf.size * TWIG_LEAF_K * (hm ? hm.leafK : 1) * kj * (dry ? 0.8 : 1));
            dm.updateMatrix();
            this.leafMesh.setMatrixAt(li, dm.matrix);
            this.leafMesh.setColorAt(li, tw.colours[j]);
            li++;
          }
          if (tw.kShown > 0.1) { cx += tw.pos.x; cy += tw.pos.y; cz += tw.pos.z; cn++; }
        }));
        this.leafMesh.count = li;
        this.leafMesh.instanceMatrix.needsUpdate = true;
        if (this.leafMesh.instanceColor) this.leafMesh.instanceColor.needsUpdate = true;
        // the crown as a thing to tap: a sphere over the live clusters
        if (cn) {
          cx /= cn; cy /= cn; cz /= cn;
          this.clusters.forEach((c) => { if (c.k > 0.1) cr = Math.max(cr, Math.hypot(c.pos.x - cx, c.pos.y - cy, c.pos.z - cz) + c.radius * 0.6); });
          this.twigHosts.forEach((b) => b.twigs.forEach((tw) => { if (tw && tw.kShown > 0.1) cr = Math.max(cr, Math.hypot(tw.pos.x - cx, tw.pos.y - cy, tw.pos.z - cz) + tw.radius * 0.6); }));
          this.crownProxy.position.set(cx, cy, cz);
          this.crownProxy.scale.setScalar(Math.max(0.2, cr));
        } else this.crownProxy.scale.setScalar(0.001);
        // fruit hangs under the live clusters
        this.fruitSlots = [];
        const live = this.clusters.filter((c) => c.k > 0.3).map((c) => ({ pos: c.pos, radius: c.radius }))
          .concat(anim.filter((tw) => tw.kShown > 0.5).map((tw) => ({ pos: tw.pos, radius: tw.radius })));
        const fr = rng(211);
        for (let i = 0; i < FRUIT_SLOTS && live.length; i++) {
          const c = live[(i * 5) % live.length];
          this.fruitSlots.push({ pos: c.pos, off: new T.Vector3((fr() - 0.5) * c.radius * 1.2, -c.radius * (0.55 + fr() * 0.3), (fr() - 0.5) * c.radius * 1.2) });
        }
      }

      // fruit, results only: the margin kept; larger when customers come back (none for a milestone: nothing implies a number)
      const fruitN = numbers ? Math.round(clamp(sh.profit) * FRUIT_SLOTS) : 0;
      let fi = 0;
      const fruitSize = 0.04 + 0.03 * clamp(sh.repeat);
      (this.fruitSlots || []).forEach((sl, i) => {
        if (i >= fruitN) return;
        this.dummy.position.copy(sl.pos).add(sl.off);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.setScalar(fruitSize);
        this.dummy.updateMatrix();
        this.fruitMesh.setMatrixAt(fi++, this.dummy.matrix);
      });
      this.fruitMesh.count = fi;
      this.fruitMesh.instanceMatrix.needsUpdate = true;

      // the bark wave: base to crown over 600 ms; the leaves lighten for 300 ms
      if (this.waveT0) {
        const wk = (now - this.waveT0) / (rm ? 1 : 600);
        if (wk >= 1) { this.waveT0 = 0; this.waveU.a.value = 0; this.mat.leaf.color.setScalar(1); }
        else {
          this.waveU.t.value = -0.35 + 1.5 * wk;
          this.waveU.a.value = 0.16;
          this.mat.leaf.color.setScalar(wk < 0.5 ? 1.06 : 1);
        }
      }

      this.renderer.render(this.scene, this.camera);
      this.frameFresh = true;
      this.placeOverlays(now, dt);
      this.frameFresh = false;
      this.emit('frame', { now, k });

      if (this.intro && k >= 1) {
        const done = this.intro.done;
        this.intro = null;
        this.planted = true;
        if (done) done();
      }
      this.raf = requestAnimationFrame(this.tick);
    }

    /* ---------- Task 06 / D11: the halo, and the pointer depth ---------- */
    /** the halo's step for this frame: the one the page pinned, else ambient, and focus while a branch or a section is in
        play. It reads the stage and the focus only. No metric, no scenario, no answered share and no fit reaches it, so the
        halo cannot stand for a score; and there are three steps, so it cannot stand for a scale either. */
    haloLevel() {
      const H = this.halo;
      if (H.want !== 'auto') return H.want;
      if (this.branchOpen) return 'focus';
      return this.haloPart() === 'crown' ? 'ambient' : 'focus';
    }
    /** what the halo frames: the part the page named, else the branch open, else the section framed, else the crown, which
        is the whole composition */
    haloPart() {
      const H = this.halo;
      if (H.part && H.part !== 'auto') return H.part;
      if (this.branchOpen) return this.branchOpen;
      const p = this.pose, name = p && p.preset;
      if (name && SECTION_PRESET[name]) return SECTION_PRESET[name].limb;
      if (name === 'control' || name === 'you') return name === 'you' ? 'trunk' : 'control';
      if (name === 'roots' || name === 'ground') return 'roots';
      return 'crown';
    }
    /** Task 06 / D11, the one API the shell and the results call: setHalo('focus', { part: 'demand' }).
        level: 'auto' (the tree decides: ambient, focus while a branch or a section is in play), 'off', 'ambient', 'focus'.
        true and false are on and off; a number snaps to a step, because the halo has three states and no continuum and must
        never be handed a figure to show. opts.part: a limb, 'control', 'trunk', 'roots', 'crown', or 'auto' to follow the
        frame. opts.press lifts it briefly (a press or a keyboard focus does this by itself). Returns getHalo(). */
    setHalo(level, opts) {
      const H = this.halo, o = opts || {};
      if (level !== undefined && level !== null) {
        if (level === 'auto') H.want = 'auto';
        else if (level === true) H.want = 'ambient';
        else if (level === false) H.want = 'off';
        else if (typeof level === 'number' && isFinite(level)) H.want = level <= 0.01 ? 'off' : level < 0.7 ? 'ambient' : 'focus';
        else if (HALO.steps.indexOf(String(level)) >= 0) H.want = String(level);
      }
      if (o.part !== undefined) H.part = o.part === null ? 'auto' : String(o.part);
      if (o.press) H.pressAt = performance.now();
      this.start();
      return this.getHalo();
    }
    /** what the halo is doing: its step, what it frames, and the strength and circle shown (px). `alpha` is the layer's own
        opacity, at most HALO.alpha.focus: there is no scale here to read a number off. */
    getHalo() {
      const H = this.halo;
      return { level: this.haloLevel(), want: H.want, part: this.haloPart(), alpha: H.shown, x: H.x, y: H.y, r: H.r, shown: H.shown > 0.004 };
    }
    /** Task 06: the pointer depth. On a desktop pointer that hovers, the decorative layers move a few px with the pointer;
        text, inputs, the tree and every control stay where they are. Off under reduced motion, off while the tab is hidden,
        off on touch (no hover). setDepth(true | false) overrides; setDepth(null) gives the decision back. */
    setDepth(on) { this.depthOn = on === null || on === undefined ? null : !!on; if (!this.depthActive()) { this.halo.dx = 0; this.halo.dy = 0; } this.start(); return this.depthActive(); }
    depthActive() {
      if (reduce() || document.hidden) return false;
      if (this.depthOn !== null) return this.depthOn;
      try { return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (e) { return false; }
    }
    /** the tab went away (or came back): decorative animation stops and the parallax returns to nothing. The tree's own frame
        loop already stops on document.hidden; this is the CSS side, so nothing eases while nobody is looking. */
    suspendDecor(off) {
      const H = this.halo;
      if (off) { H.dx = 0; H.dy = 0; H.px = 0; H.py = 0; }
      if (H.el) H.el.dataset.anim = off ? '0' : '1';
    }
    /** the crown's spread in world units, as the halo needs it: no closures, nothing allocated */
    crownSpan() {
      let r = 0;
      const cl = this.clusters;
      for (let i = 0; i < cl.length; i++) { const c = cl[i]; if (c.k > 0.1) { const d = Math.hypot(c.pos.x, c.pos.z) + c.radius * 0.6; if (d > r) r = d; } }
      for (let i = 0; i < this.twigHosts.length; i++) {
        const tws = this.twigHosts[i].twigs;
        for (let j = 0; j < tws.length; j++) { const tw = tws[j]; if (tw && tw.kShown > 0.1) { const d = Math.hypot(tw.pos.x, tw.pos.z) + tw.radius * 0.6; if (d > r) r = d; } }
      }
      return Math.max(0.4, r) * this.tree.scale.x;
    }
    /** the halo's subject for this frame into this.haloX, this.haloY, this.haloR (canvas px). Two projections and scalars:
        nothing is allocated. False when there is nothing on screen to frame. */
    haloAim() {
      const w = this.size.w, h = this.size.h;
      if (!w) return false;
      const part = this.haloPart();
      const f = (h / 2 / Math.tan((this.camera.fov * Math.PI) / 360)) * this.zoom.k;
      const v = this.lv2;
      if (part === 'crown' || part === 'whole') {
        const p = this.crownProxy.position;
        if (!this.toPx(this.tree, p.x, p.y, p.z)) return false;
        this.haloX = this.sx; this.haloY = this.sy;
        this.haloR = (this.crownSpan() * f) / this.sd;
        return true;
      }
      if (part === 'roots') {
        if (!this.toPx(this.world, 0, -this.rootDepth() * 0.5, 0)) return false;
        this.haloX = this.sx; this.haloY = this.sy;
        this.haloR = (Math.max(0.5, this.rootExtent()[0]) * f) / this.sd;
        return true;
      }
      // a limb, the trunk or the control host: the run of wood from where it leaves the tree to where it has grown to
      let x0, y0, x1, y1;
      if (part === 'trunk' || part === 'control') {
        const t1 = part === 'control' ? Math.min(CONTROL.t, clamp(this.trunkF)) : Math.min(0.55, clamp(this.trunkF));
        const t0 = part === 'control' ? Math.min(CONTROL.t0, clamp(this.trunkF)) : 0.02;
        this.trunkCurve.getPointAt(t0, v);
        if (!this.toPx(this.tree, v.x, v.y, v.z)) return false;
        x0 = this.sx; y0 = this.sy;
        this.trunkCurve.getPointAt(t1, v);
        if (!this.toPx(this.tree, v.x, v.y, v.z)) return false;
        x1 = this.sx; y1 = this.sy;
      } else {
        const b = this.branches.get(part);
        if (!b || b.f < 0.05) return false;
        b.curve.getPointAt(0.02, v);
        if (!this.toPx(this.tree, v.x, v.y, v.z)) return false;
        x0 = this.sx; y0 = this.sy;
        b.curve.getPointAt(clamp(b.f), v);
        if (!this.toPx(this.tree, v.x, v.y, v.z)) return false;
        x1 = this.sx; y1 = this.sy;
      }
      this.haloX = (x0 + x1) / 2;
      this.haloY = (y0 + y1) / 2;
      this.haloR = Math.hypot(x1 - x0, y1 - y0) / 2 + 36;
      return true;
    }
    /** the halo, placed and eased. Written only when it has moved half a pixel or changed by a thousandth, so a still tree
        writes nothing; under reduced motion it stands still at its step, which is the static equivalent. */
    placeHalo(now, dt) {
      const H = this.halo;
      if (!H.el) return;
      const rm = reduce();
      const level = this.haloLevel();
      const aimed = this.haloAim();
      let a = HALO.alpha[level] === undefined ? 0 : HALO.alpha[level];
      if (!aimed || !this.halo.on) a = 0;
      if (!rm && H.pressAt && now - H.pressAt < HALO.pressMs && a > 0) a += HALO.press * (1 - (now - H.pressAt) / HALO.pressMs);
      H.shown = rm ? a : approach(H.shown, a, dt, HALO.rate);
      if (H.shown < 0.0015 && a === 0) H.shown = 0;
      if (aimed) {
        const spread = level === 'focus' ? HALO.spread.focus : HALO.spread.ambient;
        const r = clamp(this.haloR * spread, HALO.min, HALO.max);
        H.x = rm || H.r === 0 ? this.haloX : approach(H.x, this.haloX, dt, 6);
        H.y = rm || H.r === 0 ? this.haloY : approach(H.y, this.haloY, dt, 6);
        H.r = rm || H.r === 0 ? r : approach(H.r, r, dt, 4);
      }
      // Task 06: the pointer depth moves these two layers and nothing else, by a few px
      const on = this.depthActive();
      const wantX = on && this.ptrIn ? (this.ptrX / Math.max(1, this.size.w) - 0.5) * 2 * HALO.depth : 0;
      const wantY = on && this.ptrIn ? (this.ptrY / Math.max(1, this.size.h) - 0.5) * 2 * HALO.depth : 0;
      H.dx = rm ? 0 : approach(H.dx, wantX, dt, HALO.depthRate);
      H.dy = rm ? 0 : approach(H.dy, wantY, dt, HALO.depthRate);
      const tx = H.x + H.dx, ty = H.y + H.dy, tr = H.r;
      // the negated form, so the first frame (the last written values start as NaN) writes
      if (!(Math.abs(tx - H.tx) <= 0.5 && Math.abs(ty - H.ty) <= 0.5 && Math.abs(tr - H.tr) <= 0.5)) {
        H.tx = tx; H.ty = ty; H.tr = tr;
        H.el.style.width = `${(tr * 2).toFixed(1)}px`;
        H.el.style.height = `${(tr * 2).toFixed(1)}px`;
        H.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) translate(-50%, -50%)`;
        if (H.inner) H.inner.style.transform = `translate3d(${(H.dx * HALO.inner).toFixed(2)}px, ${(H.dy * HALO.inner).toFixed(2)}px, 0)`;
      }
      if (!(Math.abs(H.shown - H.ta) <= 0.002)) { H.ta = H.shown; H.el.style.opacity = H.shown.toFixed(3); }
      if (H.el.dataset.level !== level) H.el.dataset.level = level;
    }

    /* ---------- Task 20 and 21: the branch inspector, and the way back to the whole tree ---------- */
    /** the part a branch call names: a limb, 'control', 'trunk', 'roots', 'crown', or a section's name ('offer' is pricing) */
    branchPart(id) {
      const s = id == null ? '' : String(id);
      if (this.branches.has(s) || s === 'control' || s === 'trunk' || s === 'roots' || s === 'crown') return s === 'you' ? 'trunk' : s;
      if (s === 'you') return 'trunk';
      if (SECTION_PRESET[s]) return SECTION_PRESET[s].limb;
      return null;
    }
    /** the frame that shows a part */
    presetFor(part) {
      if (this.branches.has(part)) return LIMB_SECTION[part] || null;
      if (part === 'control') return 'control';
      if (part === 'trunk') return 'you';
      if (part === 'roots') return 'roots';
      return null;
    }
    /** Task 20: what a branch is, what it is aiming at, and the action meant to close the gap.
        setBranchInfo(part, { now, target, milestone, action, unit, horizon, state }). `now` and `target` may be numbers (they
        are printed in the part's own unit) or words; a branch with no numeric target that can be justified takes `milestone`
        or a qualitative `target`, and nothing here invents a percentage. null clears a part. */
    setBranchInfo(part, info) {
      const id = this.branchPart(part);
      if (!id) return null;
      if (info == null) { delete this.branchInfo[id]; }
      else {
        const o = info;
        this.branchInfo[id] = { now: o.now === undefined ? null : o.now, target: o.target === undefined ? null : o.target,
          milestone: o.milestone === undefined ? null : o.milestone, action: o.action === undefined ? null : o.action,
          unit: o.unit == null ? '' : String(o.unit), horizon: o.horizon == null ? '' : String(o.horizon), name: o.name == null ? '' : String(o.name) };
      }
      this.branchDirty = true;
      if (this.branchOpen === id) this.syncBranch(true);
      this.start();
      return this.branchInfo[id] || null;
    }
    /** what the inspector shows for a part, from what the tree was told: setBranchInfo first, then the part's evidence state
        (setPartState) for Now, then the page's own M.branch(id) when it has one. Nothing is made up: an unknown target says
        so in words. */
    branchData(part) {
      const id = this.branchPart(part);
      if (!id) return null;
      const info = this.branchInfo[id] || null;
      let page = null;
      if (!info || info.target == null || info.action == null || info.now == null) {
        try { page = typeof M.branch === 'function' ? M.branch(id) : null; } catch (e) { page = null; }
      }
      const st = this.partState[id] || null;
      const pick = (k) => (info && info[k] != null ? info[k] : page && page[k] != null ? page[k] : null);
      const unit = (info && info.unit) || (page && page.unit) || (st && st.unit) || '';
      const horizon = (info && info.horizon) || (page && page.horizon) || '';
      const nowV = pick('now');
      const targetV = pick('target');
      const milestone = pick('milestone');
      const action = pick('action');
      const name = (info && info.name) || (page && page.name) || (st && st.name) || PART_WORDS[id] || id;
      return { id, part: id, name, group: GROUP_OF[id] || null,
        now: nowV != null ? fmtValue(nowV, unit) : st && st.value ? String(st.value) : '',
        nowState: st ? st.state : 'unknown', evidence: st ? EVIDENCE[st.state] : EVIDENCE.unknown,
        target: targetV != null ? fmtValue(targetV, unit) : '', milestone: milestone != null ? String(milestone) : '',
        action: action != null ? String(action) : '', unit, horizon, open: this.branchOpen === id };
    }
    /** Task 19: how the stage is composed. 'centred' puts the whole-tree frames in the middle of the screen with no clearing
        reserved, for the results, where the tree is the composition and the navigation surface; 'auto' (the default) keeps
        the clearing at the left, as questioning needs. The phone is centred either way. Refits at once. */
    setComposition(mode) {
      const on = mode === 'centred' || mode === true;
      if (on === !!this.centred) return this.centred ? 'centred' : 'auto';
      this.centred = on;
      const p = this.pose && this.pose.preset;
      if (typeof p === 'string') this.frame(p, { ms: reduce() ? 0 : 700 });
      else this.refit(reduce() ? 0 : 700);
      this.start();
      return on ? 'centred' : 'auto';
    }
    composition() { return this.centred ? 'centred' : 'auto'; }
    /** the page may render the inspector itself: setInspector(false) leaves the tree emitting 'branch' and drawing nothing */
    setInspector(on) { this.inspectorOn = on !== false; if (!this.inspectorOn) this.syncBranch(true); return this.inspectorOn; }
    /** the page may own the Whole tree control: setWholeControl(false), or simply have a #tree-tools of its own */
    setWholeControl(on) { this.wholeControl = on !== false; this.syncBranch(true); return this.wholeControl; }
    /** Task 21, Inspect: open one branch. Its current state, its target or milestone, and the action meant to close the gap.
        One at a time: opening another closes the one before, and closing gives the focus back to whatever opened it. The
        camera frames the branch and the halo focuses it; the Whole tree control appears, so nobody is trapped inside. */
    expandBranch(id, opts) {
      const part = this.branchPart(id);
      if (!part) return null;
      const o = opts || {};
      const first = this.branchOpen !== part;
      // the peer panel closes without a word of its own: opening another branch is one event, not a close and an open
      if (first && this.branchOpen) this.collapseBranch({ refocus: false, keep: true, silent: true });
      this.branchOpen = part;
      if (first) this.branchOpener = o.opener !== undefined ? o.opener : (document.activeElement && document.activeElement !== document.body ? document.activeElement : this.host || null);
      if (o.frame !== false) { const pr = this.presetFor(part); if (pr && this.pose.preset !== pr) this.frame(pr, o.ms === undefined ? {} : { ms: o.ms }); }
      if (part !== 'crown') this.select(part);
      this.groupsDirty = true;
      this.syncBranch(true);
      const data = this.branchData(part);
      // the tree's own live line says what opened, so a screen reader hears the branch even though the panel is drawn on the canvas
      focusDom(this);
      if (this.liveEl && this.branchEl) this.liveEl.textContent = this.branchEl.getAttribute('aria-label') || data.name;
      if (o.key && this.branchClose && typeof this.branchClose.focus === 'function') { try { this.branchClose.focus({ preventScroll: true }); } catch (e) { /* the page's own business */ } }
      if (o.silent !== true) this.emit('branch', data);
      this.start();
      return data;
    }
    /** close the branch: the panel goes, the focus returns, the halo and the selection go back to the whole tree. The frame
        and the zoom are kept (the visitor's own state), and the Whole tree control is how the frame is given back. */
    collapseBranch(opts) {
      const o = opts || {};
      const was = this.branchOpen;
      if (!was) return null;
      this.branchOpen = null;
      if (!o.keep) this.select(null);
      this.groupsDirty = true;
      this.syncBranch(true);
      const back = this.branchOpener;
      this.branchOpener = null;
      if (o.refocus !== false && back && typeof back.focus === 'function' && back.isConnected !== false) {
        try { back.focus({ preventScroll: true }); } catch (e) { /* the page's own business */ }
      }
      if (o.silent !== true) this.emit('branch', null);
      this.start();
      return was;
    }
    /** what stands open, or null */
    openBranch() { return this.branchOpen; }
    /** Task 21: the way out. The branch closes, the zoom and the pan go, and a branch the visitor opened gives the whole tree
        back. Nobody can be trapped: this is what the Whole tree control calls, and the page may call it too. */
    wholeTree(opts) {
      const o = opts || {};
      const wasBranch = !!this.branchOpen;
      this.collapseBranch({ refocus: false, silent: true });
      this.zoomReset(false);
      const pr = o.preset || (this.encoding() ? 'explore' : 'explore');
      if (wasBranch || o.preset) this.frame(pr, o.ms === undefined ? {} : { ms: o.ms });
      if (o.focus !== false && this.host && typeof this.host.focus === 'function') {
        try { this.host.focus({ preventScroll: true }); } catch (e) { /* the page's own business */ }
      }
      this.emit('whole', { preset: wasBranch || o.preset ? pr : this.pose.preset, branch: wasBranch });
      this.start();
      return pr;
    }
    /** true while the visitor is inside something: a branch open, or zoomed in, or a section framed at the results */
    insideBranch() {
      if (this.branchOpen) return true;
      if (this.zoom.tk > 1.01) return true;
      const p = this.pose && this.pose.preset;
      return !!(this.encoding() && p && (SECTION_PRESET[p] || p === 'control' || p === 'you'));
    }
    /** the inspector's words and the reset control's presence. Called every frame: the path that changes nothing allocates
        nothing, and the words are only written again when something said so (branchDirty). */
    syncBranch(force) {
      if (!this.tags) return;
      const want = this.insideBranch() && this.wholeControl !== false && !this.pageTools();
      if (want !== this.resetOn) {
        this.resetOn = want;
        if (want) resetDom(this);
        if (this.resetEl) { this.resetEl.dataset.on = want ? '1' : '0'; this.resetEl.style.opacity = want ? '1' : '0'; this.resetTx = NaN; }
      }
      const id = this.inspectorOn === false ? null : this.branchOpen;
      if (!id) {
        if (this.branchEl && this.branchEl.dataset.open !== '0') { this.branchEl.dataset.open = '0'; this.branchEl.style.opacity = '0'; }
        return;
      }
      if (!force && !this.branchDirty) return;
      this.branchDirty = false;
      branchDom(this);
      const d = this.branchData(id);
      const sig = `${d.name}|${d.now}|${d.evidence}|${d.target}|${d.milestone}|${d.action}`;
      if (sig !== this.branchSig || force) {
        this.branchSig = sig;
        this.branchName.textContent = d.name;
        const rows = this.branchRows;
        const set = (k, key, val) => {
          const r = rows[k];
          r.row.dataset.on = val ? '1' : '0';
          r.key.textContent = key;
          r.val.textContent = val;
        };
        // Now: the branch's own state, with the evidence word it carries; never a figure nobody supplied
        set('now', 'Now', d.now || (d.nowState === 'unknown' ? 'Not known yet' : ''));
        // Target or milestone: a figure when one is justified, else the milestone in words, else said plainly
        set('target', d.milestone && !d.target ? 'Milestone' : 'Target', d.target || d.milestone || 'Not set yet');
        set('action', 'Next', d.action || '');
        this.branchEl.setAttribute('aria-label', `${d.name}. Now ${d.now || 'not known yet'}. ${d.milestone && !d.target ? 'Milestone' : 'Target'} ${d.target || d.milestone || 'not set yet'}.${d.action ? ` Next: ${d.action}.` : ''}`);
        this.branchW = 0;
      }
      this.branchEl.dataset.open = '1';
      this.branchEl.style.opacity = '1';
    }
    /** the page's own tools row, when it has one: the tree then draws no Whole tree control of its own. Looked for once a
        second, never per frame. */
    pageTools() {
      const now = performance.now();
      if (this.toolsAt && now - this.toolsAt < 1000) return this.toolsHas;
      this.toolsAt = now;
      const el = document.getElementById('tree-tools');
      this.toolsHas = !!(el && el.isConnected !== false);
      return this.toolsHas;
    }
    /** the inspector beside its branch, inside the usable viewport, never over the part it names. Portrait: centred under the
        tree, above the sheet's line. Written only when it has moved half a pixel. */
    /** the open branch's point on the canvas into this.sx, this.sy: the same projections the labels use, nothing allocated */
    branchPx(part) {
      const v = this.lv2;
      if (part === 'crown') { const p = this.crownProxy.position; return this.toPx(this.tree, p.x, p.y, p.z); }
      if (part === 'roots') return this.toPx(this.world, 0, -this.rootDepth() * 0.5, 0);
      if (part === 'trunk' || part === 'control') {
        this.trunkCurve.getPointAt(Math.min(part === 'control' ? CONTROL.t : 0.5, clamp(this.trunkF)), v);
        return this.toPx(this.tree, v.x, v.y, v.z);
      }
      const b = this.branches.get(part);
      if (!b) return false;
      b.curve.getPointAt(clamp(Math.max(b.f, 0.05)), v);
      return this.toPx(this.tree, v.x, v.y, v.z);
    }
    placeBranch(now) {
      const el = this.branchEl;
      if (!el || el.dataset.open !== '1') return;
      const w = this.size.w, h = this.size.h;
      const seen = this.branchPx(this.branchOpen);
      const a = seen ? { x: this.sx, y: this.sy, inView: this.sx > 0 && this.sx < w && this.sy > 0 && this.sy < h } : null;
      const U = this.usable(this.pose.fit, w, h);
      if (!this.branchW) { this.branchW = el.offsetWidth || BRANCH.w; this.branchH = el.offsetHeight || 96; }
      const bw = this.branchW, bh = this.branchH;
      let x, y;
      if (this.portrait || !a || !a.inView) {
        x = clamp((U.left + U.right) / 2 - bw / 2, BRANCH.pad, Math.max(BRANCH.pad, w - bw - BRANCH.pad));
        y = clamp(U.bottom - bh - BRANCH.pad, U.top + BRANCH.pad, Math.max(U.top + BRANCH.pad, h - bh - BRANCH.pad));
      } else {
        const right = a.x + BRANCH.gap + bw <= U.right - BRANCH.pad;
        x = right ? a.x + BRANCH.gap : a.x - BRANCH.gap - bw;
        y = a.y - bh / 2;
        x = clamp(x, U.left + BRANCH.pad, Math.max(U.left + BRANCH.pad, U.right - bw - BRANCH.pad));
        y = clamp(y, U.top + BRANCH.pad, Math.max(U.top + BRANCH.pad, U.bottom - bh - BRANCH.pad));
      }
      if (!(Math.abs(x - this.branchTx) <= 0.5 && Math.abs(y - this.branchTy) <= 0.5)) {
        this.branchTx = x; this.branchTy = y;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      this.branchBox = this.branchBox || new Float32Array(4);
      this.branchBox[0] = x; this.branchBox[1] = y; this.branchBox[2] = x + bw; this.branchBox[3] = y + bh;
    }
    /** the Whole tree control, under the tree and inside the usable viewport, so it belongs to the tree and not to the page's
        own corners (the shell keeps the bottom right for its tools and the wheel) */
    placeReset() {
      const el = this.resetEl;
      if (!el || el.dataset.on !== '1') return;
      const w = this.size.w, h = this.size.h;
      const U = this.usable(this.pose.fit, w, h);
      const bw = el.offsetWidth || 96, bh = el.offsetHeight || 26;
      const on = this.branchPx('trunk'); // the tree's own line, projected without allocating
      const cx = on && this.sx > U.left && this.sx < U.right ? this.sx : (U.left + U.right) / 2;
      const x = clamp(cx - bw / 2, U.left + BRANCH.pad, Math.max(U.left + BRANCH.pad, U.right - bw - BRANCH.pad));
      const y = clamp(U.bottom - bh - BRANCH.pad, U.top + BRANCH.pad, Math.max(U.top + BRANCH.pad, h - bh - 2));
      if (!(Math.abs(x - this.resetTx) <= 0.5 && Math.abs(y - this.resetTy) <= 0.5)) {
        this.resetTx = x; this.resetTy = y;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      this.resetBox = this.resetBox || new Float32Array(4); // made once; the labels keep clear of it
      this.resetBox[0] = x; this.resetBox[1] = y; this.resetBox[2] = x + bw; this.resetBox[3] = y + bh;
    }
    /** Task 21: pan the zoomed view by dx, dy px. At zoom 1 there is nothing to pan (the stage's own frame already holds the
        whole tree), so it does nothing; the zoom's own clamp keeps the tree on screen. */
    panBy(dx, dy) {
      const Z = this.zoom;
      if (Z.tk <= 1.0005 || !this.planted || this.intro) return false;
      this.zoomBox();
      Z.tx += +dx || 0;
      Z.ty += +dy || 0;
      this.zoomClamp();
      Z.x = Z.tx; Z.y = Z.ty; // the view follows the finger
      this.lastPointer = performance.now();
      this.start();
      return true;
    }

    /** the live label, the Core and the discs follow the tree */
    placeOverlays(now, dt) {
      const w = this.size.w, h = this.size.h;
      const port = this.portrait;
      this.placeHalo(now, dt === undefined ? 1 / 60 : dt); // D11: first, so the halo is under everything the tree writes after
      this.syncBranch(false);
      this.placeBranch(now);
      this.placeReset();
      this.placeCore();
      if (this.focusAt >= 0) this.placeFocus();
      // the labels: the live one beside its part, then the persistent ones (Rebuild 1), each clear of the tree, the discs,
      // the Core and the labels placed before it; none while the tree stands under 240 px tall. The frame's obstacles are
      // listed once; at most three labels search for a new place in one frame.
      if (this.groupsDirty) this.syncLabels(now);
      this.lrectN = 0;
      this.searchBudget = 3;
      this.measureTree();
      this.labelBounds();
      const wantTags = this.tags && this.tagsOn !== 'none' && (this.planted || this.intro) && this.pose.preset !== 'arrival';
      const n = (this.label.el && this.label.part != null && this.label.text) || wantTags ? this.labelObstacles() : 0;
      if (this.label.el) this.placeLabel(now, n);
      if (this.tags) this.placeTags(now, n);
      // the discs: collision-nudged on the tree at 1440; on the phone (f) draws its own row
      if (this.discs.length && this.tags) {
        const layer = this.tags.discs;
        if (layer.parentNode !== this.discSeat) this.seatDiscs(); // the page emptied #discs: the layer goes back
        if (port) { if (layer.dataset.row !== '1') layer.dataset.row = '1'; }
        else {
          if (layer.dataset.row !== '0') layer.dataset.row = '0';
          this.boxDiscs(now);
          const items = [];
          this.discs.forEach((d) => {
            const t = this.anchor(d.part);
            d.r = 0;
            if (!t || !t.inView) { d.el.style.opacity = '0'; return; }
            const size = (d.el.offsetWidth || 28) * d.scale;
            items.push({ id: d.id, d, t, w: size, h: size, el: d.el, front: t.front, born: +d.el.dataset.born || 0 });
          });
          nudgePlace(items, w, h, this.discMemo);
          const axis = this.anchor('trunk');
          this.placeNames(items, axis ? axis.x : w * FIT.base.landscape.x, w, h);
          items.forEach((it) => {
            const pop = reduce() ? 1 : easeOut((now - it.born) / 240);
            if (pop <= 0) { it.el.style.opacity = '0'; return; }
            it.d.x = it.x; it.d.y = it.y; it.d.r = it.w / 2; // where it stands, for the label to keep clear of
            // the disc's own scale (the binding disc is 1.4) rides in this string: an inline transform replaces base.css's .disc.bind scale
            it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${((0.6 + 0.4 * pop) * it.d.scale).toFixed(3)})`;
            it.el.style.opacity = String(pop * (it.front ? 1 : 0.6));
            it.el.classList.toggle('back', !it.front);
          });
        }
      }
    }
  }

  /* ---------- no WebGL: the same tree, flat, in an SVG; the same calls ---------- */
  class FlatTree {
    constructor(host) {
      this.ok = true;
      this.flat = true;
      this.listeners = {};
      this.planted = false;
      this.intro = null;
      this.branches = new Map();
      ORDER.forEach((id, i) => this.branches.set(id, { id, i, stub: true, fill: 0, twigs: new Array(TWIG_SLOTS).fill(null) }));
      this.counts = { you: 0, sector: 0, web: 0, assumed: 0 };
      this.balance = null;
      this.collarOn = null;
      this.selected = null;
      this.label = { part: null, text: '', el: null };
      this.discs = [];
      this.coreHost = null;
      this.discMemo = new Map();
      this.name = '';
      this.metrics = { progress: 0, odds: 0, profit: 0, repeat: 0 };
      this.pose = { preset: 'arrival' };
      // Refine 1: the pale trunk (R6), the zoom (R16: a scale about the drawing's middle, so the tree cannot leave), the control twigs
      this.trunkKnown = false;
      this.trunkKnownSet = false;
      this.trunkDemo = false;
      this.trunkAskAt = 0;
      this.zoomK = 1;
      this.focusAt = -1;
      this.focusParts = null;
      // Final 1: the halo, the branch inspector and the Whole tree control, as the 3D tree holds them
      this.halo = { want: 'auto', part: 'auto', shown: 0, level: 'ambient', pressAt: 0, x: 0, y: 0, r: 0, tx: NaN, ty: NaN, tr: NaN, ta: NaN, el: null, inner: null, dx: 0, dy: 0, px: 0, py: 0, on: true };
      this.depthOn = null;
      this.branchInfo = {};
      this.branchOpen = null;
      this.branchEl = null;
      this.branchOpener = null;
      this.branchDirty = true;
      this.branchSig = '';
      this.inspectorOn = true;
      this.wholeControl = true;
      this.resetEl = null;
      this.resetOn = null;
      this.branchTx = NaN; this.branchTy = NaN;
      this.resetTx = NaN; this.resetTy = NaN;
      this.ctl = { id: 'control', twigs: new Array(TWIG_SLOTS).fill(null) };
      // Rebuild 1: the part states, the group labels, the metric and the view, as the 3D tree (a repaint: cuts)
      this.partState = {};
      this.groupWords = {};
      this.tagsOn = 'auto';
      this.activeGroup = undefined;
      this.metric = undefined;
      this.metricLabel = '';
      this.markerAlways = false;
      this.view = 'current';
      this.coreWanted = false;
      this.tagList = [];
      ['customers', 'offer', 'delivery', 'leverage'].forEach((g) => { const L = labelRec(g, 'group'); L.parts = GROUPS[g].slice(); this.tagList.push(L); });
      ['trunk', 'roots'].forEach((g) => { const L = labelRec(g, 'group'); L.parts = [g]; this.tagList.push(L); });
      this.tagList.push(labelRec('marker', 'marker'), labelRec('plan', 'plan'));
      this.tagMemo = new Map();
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('class', 'tree-flat');
      this.svg.setAttribute('viewBox', '0 0 300 420');
      this.svg.setAttribute('aria-hidden', 'true');
      this.raf = 0;
      if (host) this.mount(host);
      linkStyles();
    }
    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
    off(ev, fn) { this.listeners[ev] = (this.listeners[ev] || []).filter((f) => f !== fn); }
    emit(ev, v) { (this.listeners[ev] || []).forEach((fn) => fn(v)); }
    mount(el) {
      if (!el) return;
      haloDom(this, el); // D11: the halo is behind the drawing here too, at every stage
      if (this.svg.parentElement !== el) el.appendChild(this.svg);
      this.ensureTags(el);
      this.host = el;
      stageHost(this, el);
      this.paint();
      this.start();
    }
    ensureTags(el) {
      if (!this.tags) {
        this.tags = { box: document.createElement('div'), discs: document.createElement('div') };
        this.tags.box.className = 'tree-tags';
        this.tags.discs.className = 'tree-discs';
        this.tags.box.appendChild(this.tags.discs);
      }
      if (el && this.tags.box.parentElement !== el) el.appendChild(this.tags.box);
    }
    start() { if (!this.raf) this.raf = requestAnimationFrame((t) => this.tick(t)); }
    tick(now) {
      this.raf = 0;
      if (!this.svg.isConnected) return;
      if (!this.trunkKnownSet && typeof M.trunkKnown === 'function' && now - this.trunkAskAt > 400) {
        this.trunkAskAt = now;
        let known = this.trunkKnown;
        try { known = !!M.trunkKnown(); } catch (e) { /* the page's own business */ }
        if (known !== this.trunkKnown) { this.trunkKnown = known; this.paint(); }
      }
      this.placeOverlays(now);
      this.emit('frame', { now, k: null });
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }
    // geometry in the 300 × 420 box: ground at y 300, trunk to y 90
    limbGeo(b) {
      const dir = b.i % 2 ? 1 : -1;
      const y0 = 300 - 210 * LAYOUT[b.id].h;
      const full = 22 + 70 * LAYOUT[b.id].len;
      const f = Math.max(b.stub ? STUB_F : STUB_F + (1 - STUB_F) * b.fill, ...b.twigs.filter((t) => t && t.state).map((t) => t.t + 0.06), 0);
      const at = (t) => ({ x: 150 + dir * full * t, y: y0 - full * t * 0.55 });
      return { dir, full, f, at };
    }
    paint() {
      const NS = 'http://www.w3.org/2000/svg';
      const el = (n, a) => { const e = document.createElementNS(NS, n); Object.keys(a).forEach((k) => e.setAttribute(k, a[k])); return e; };
      const svg = this.svg;
      svg.textContent = '';
      const planted = this.planted;
      const PS = this.partState;
      // roots by source, as wide as the crown when the answers are the visitor's own; pale when the roots' state is unknown
      const total = Math.max(1, SRC.reduce((n, id) => n + this.counts[id], 0));
      SRC.forEach((id, i) => {
        const n = this.counts[id];
        if (!n || !planted) return;
        const share = n / total;
        const dir = i % 2 ? 1 : -1, spread = 30 + 60 * (this.balance == null ? share : this.balance) * (0.5 + 0.5 * share), depth = spread * 0.9;
        svg.appendChild(el('path', { d: `M150 300 q ${dir * spread * 0.4} ${depth * 0.3} ${dir * spread} ${depth}`, class: 'flat-root', 'data-src': id, stroke: `var(--${id === 'assumed' ? 'estimate' : id})`, 'stroke-width': 2 + 4 * share, fill: 'none', 'stroke-linecap': 'round', opacity: PS.roots && PS.roots.state === 'unknown' ? PALE_A : 0.8 }));
      });
      svg.appendChild(el('line', { x1: 20, y1: 300, x2: 280, y2: 300, stroke: 'var(--line)', 'stroke-width': 1 }));
      if (!planted) { svg.appendChild(el('circle', { cx: 150, cy: 294, r: 5, fill: 'var(--soil, var(--ink-3))' })); return; }
      // the trunk's height: the metric's linear axis (the target at the full 210), a milestone at the interview size, else progress
      const top = 300 - 210 * this.heightRatio();
      // R10: the plan silhouette (setView('plan')): the trunk and the limbs again at the scenario's height, translucent, under the tree
      if (this.markerShown() && this.view === 'plan' && this.metric && this.metric.scenario != null) {
        const k = this.heightRatio(this.metric.scenario) / this.heightRatio();
        const g = el('g', { class: 'flat-plan', transform: `translate(150 300) scale(${k.toFixed(3)}) translate(-150 -300)`, opacity: METRIC.planAlpha, 'pointer-events': 'none' });
        g.appendChild(el('path', { d: `M150 300 L150 ${top}`, stroke: 'var(--plan, var(--you))', 'stroke-width': 7, 'stroke-linecap': 'round' }));
        this.branches.forEach((b) => { const q = this.limbGeo(b); const p0 = q.at(0), p1 = q.at(1); g.appendChild(el('path', { d: `M${p0.x} ${p0.y} L${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`, stroke: 'var(--plan, var(--you))', 'stroke-width': 3, 'stroke-linecap': 'round' })); });
        svg.appendChild(g);
      }
      // R10: the goal marker, a thin ring at the target's height (a milestone: the full height)
      // Task 20 (D12): a numeric target is a thin muted red dashed line, a milestone a solid neutral hairline; both labelled
      if (this.markerShown()) {
        const goal = this.markerKind === 'goal';
        const a = { cx: 150, cy: 90, rx: 72, ry: 7, fill: 'none', stroke: goal ? 'var(--goal-line, #9A6A66)' : 'var(--marker, var(--ink-2))', 'stroke-width': 1.2, opacity: METRIC.alpha, class: goal ? 'flat-marker flat-goal' : 'flat-marker' };
        if (goal) a['stroke-dasharray'] = '7 5';
        svg.appendChild(el('ellipse', a));
      }
      const trunkPale = PS.trunk ? PS.trunk.state === 'unknown' : !(this.trunkDemo || this.trunkKnown);
      svg.appendChild(el('path', { d: `M150 300 L150 ${top}`, stroke: 'var(--ink-2)', 'stroke-width': 7, 'stroke-linecap': 'round', class: 'flat-trunk', 'data-part': 'trunk', opacity: trunkPale ? PALE_A : 1 }));
      // one twig: its stroke from p to q and what stands at its end, by state; pale on a stub (and on an unknown trunk)
      const drawTwig = (p, q, tw, i, limbId, pale) => {
        svg.appendChild(el('path', { d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${q.x.toFixed(1)} ${q.y.toFixed(1)}`, stroke: 'var(--ink-2)', 'stroke-width': 1.2, opacity: pale ? PALE_A : 1 }));
        const hue = `var(--${tw.state === 'estimate' ? 'estimate' : tw.kind === 'assumed' ? 'estimate' : tw.kind})`;
        // sprigs: one short stroke per non-zero bin off the twig, a dot at its end sized by the count; the tip keeps a small dot
        if (tw.state === 'leaf' && tw.parts) {
          const dx = q.x - p.x, dy = q.y - p.y, dl = Math.hypot(dx, dy) || 1;
          tw.parts.forEach((n, k) => {
            if (!n) return;
            const t = SPRIG_T[0] + ((SPRIG_T[1] - SPRIG_T[0]) * k) / (SPRIG_BINS - 1), sd = k % 2 ? 1 : -1, sl = 4 + n;
            const x0 = p.x + dx * t, y0 = p.y + dy * t;
            const x1 = x0 + ((-dy / dl) * sd * 0.85 + (dx / dl) * 0.5) * sl, y1 = y0 + ((dx / dl) * sd * 0.85 + (dy / dl) * 0.5) * sl;
            svg.appendChild(el('path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`, stroke: 'var(--ink-2)', 'stroke-width': 0.8, class: 'flat-sprig', 'data-bin': k }));
            svg.appendChild(el('circle', { cx: x1.toFixed(1), cy: y1.toFixed(1), r: (0.9 + 0.45 * n).toFixed(2), fill: hue }));
          });
          svg.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 2.4, fill: hue, 'data-inspect': tw.id, 'data-limb': limbId, 'data-slot': i, 'data-state': tw.state }));
        } else if (tw.state === 'leaf' || tw.state === 'estimate') svg.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 2 + tw.grade * 0.9, fill: hue, 'data-inspect': tw.id, 'data-limb': limbId, 'data-slot': i, 'data-state': tw.state }));
        else if (tw.state === 'bud') svg.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 2.5, fill: 'var(--bud)', 'data-twig': tw.id, 'data-limb': limbId, 'data-slot': i, 'data-state': 'bud' }));
        else if (tw.state === 'ring') svg.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 3, fill: 'none', stroke: 'var(--bud)', 'stroke-width': 1.5, 'pointer-events': 'all', 'data-twig': tw.id, 'data-limb': limbId, 'data-slot': i, 'data-state': 'ring' }));
        else if (tw.state === 'cut') svg.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 1.5, fill: 'var(--ink-3)', 'data-inspect': tw.id, 'data-limb': limbId, 'data-slot': i, 'data-state': 'cut' }));
      };
      this.branches.forEach((b) => {
        const g = this.limbGeo(b);
        const p0 = g.at(0), p1 = g.at(g.f);
        const pale = PS[b.id] ? PS[b.id].state === 'unknown' : b.stub; // a part state rules the pale bark when there is one
        svg.appendChild(el('path', { d: `M${p0.x} ${p0.y} L${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`, stroke: 'var(--ink-2)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: pale ? PALE_A : 1, 'data-part': b.id }));
        if (b.stub) { const pe = g.at(1); svg.appendChild(el('path', { d: `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L${pe.x.toFixed(1)} ${pe.y.toFixed(1)}`, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.5 })); }
        if (this.collarOn === b.id) { const pc = g.at(0.2); svg.appendChild(el('circle', { cx: pc.x, cy: pc.y, r: 4, fill: 'none', stroke: 'var(--collar)', 'stroke-width': 2 })); }
        b.twigs.forEach((tw, i) => {
          if (!tw || !tw.state || g.f < tw.t + 0.02) return;
          const p = g.at(tw.t), side = i % 2 ? 1 : -1, len = tw.state === 'cut' ? 5 : 12;
          const q = { x: p.x + g.dir * len * 0.5, y: p.y - side * len };
          drawTwig(p, q, tw, i, b.id, pale);
        });
      });
      // the control section's twigs leave the trunk's upper third, alternate sides
      const ctlPale = PS.control ? PS.control.state === 'unknown' : trunkPale;
      this.ctl.twigs.forEach((tw, i) => {
        if (!tw || !tw.state) return;
        const y = 300 - (300 - top) * lerp(CONTROL.t0, CONTROL.t1, tw.t), side = i % 2 ? 1 : -1, len = tw.state === 'cut' ? 5 : 12;
        drawTwig({ x: 150, y }, { x: 150 + side * len, y: y - len * 0.45 }, tw, i, 'control', ctlPale);
      });
      const at = (ev, c) => (ev && isFinite(ev.clientX) && (ev.clientX || ev.clientY) ? { x: ev.clientX, y: ev.clientY } : this.toScreen(+c.getAttribute('cx') || 150, +c.getAttribute('cy') || 200));
      svg.querySelectorAll('[data-part]').forEach((p) => p.addEventListener('click', (ev) => {
        this.emit('select', p.dataset.part);
        const q = at(ev, p);
        this.emit('inspect', { id: p.dataset.part, kind: 'limb', x: q.x, y: q.y });
      }));
      svg.querySelectorAll('.flat-root').forEach((p) => p.addEventListener('click', (ev) => { const q = at(ev, p); this.emit('inspect', { id: p.dataset.src, kind: 'root', x: q.x, y: q.y }); }));
      // an answered twig: the limb's 'select', then 'inspect' (R16)
      svg.querySelectorAll('[data-inspect]').forEach((c) => c.addEventListener('click', (ev) => {
        const limb = c.dataset.limb, q = at(ev, c);
        this.emit('select', limb === 'control' ? 'trunk' : limb);
        this.emit('inspect', { id: c.dataset.inspect, kind: 'twig', x: q.x, y: q.y, limb, slot: +c.dataset.slot, state: c.dataset.state });
      }));
      // an unanswered twig, as the 3D tree reports it: 'twig' first, then the limb's 'select'
      svg.querySelectorAll('[data-twig]').forEach((c) => c.addEventListener('click', () => {
        if (c.dataset.twig) this.emit('twig', { id: c.dataset.twig, limb: c.dataset.limb, slot: +c.dataset.slot, state: c.dataset.state });
        this.emit('select', c.dataset.limb === 'control' ? 'trunk' : c.dataset.limb);
        if (c.dataset.twig) { const q = this.toScreen(+c.getAttribute('cx'), +c.getAttribute('cy')); this.emit('inspect', { id: c.dataset.twig, kind: 'twig', x: q.x, y: q.y, limb: c.dataset.limb, slot: +c.dataset.slot, state: c.dataset.state }); }
      }));
    }
    /** SVG box point to screen */
    toScreen(x, y) {
      const r = this.svg.getBoundingClientRect();
      const sc = Math.min(r.width / 300, r.height / 420);
      const ox = r.left + (r.width - 300 * sc) / 2, oy = r.top + (r.height - 420 * sc) / 2;
      return { x: ox + x * sc, y: oy + y * sc, front: true, inView: true };
    }
    anchor(part) {
      if (!this.svg.isConnected) return null;
      const pt = (x, y) => this.toScreen(x, y);
      if (part && typeof part === 'object' && (part.limb === 'trunk' || part.limb === 'control')) {
        const t = part.twig !== undefined ? lerp(CONTROL.t0, CONTROL.t1, this.twigT(part.twig | 0)) : part.t === undefined ? CONTROL.t : part.limb === 'control' ? lerp(CONTROL.t0, CONTROL.t1, clamp(+part.t)) : clamp(+part.t);
        return pt(150, 300 - 210 * t);
      }
      if (part && typeof part === 'object') {
        const b = this.branches.get(part.limb);
        if (!b) return null;
        const g = this.limbGeo(b);
        const t = part.twig !== undefined ? this.twigT(part.twig | 0) : part.t === undefined ? g.f : +part.t;
        const p = g.at(clamp(t));
        return pt(p.x, p.y);
      }
      if (part === 'roots') return pt(150, 330);
      if (part === 'seed') return pt(150, 294);
      if (part === 'core') return coreBeside(pt(150, 300), clearing() === 'bottom', window.innerWidth, window.innerHeight);
      if (part === 'trunk') return pt(150, 200);
      if (part === 'control') return pt(150, 300 - 210 * CONTROL.t);
      if (part === 'top' || part === 'crown') return pt(150, 100);
      if (typeof part === 'string' && part.startsWith('root:')) return pt(150 + (SRC.indexOf(part.slice(5)) % 2 ? 40 : -40), 340);
      const b = this.branches.get(part);
      if (b) { const g = this.limbGeo(b); const p = g.at(g.f); return pt(p.x, p.y); }
      return null;
    }
    twigT(i) { return TWIG_T0 + ((TWIG_T1 - TWIG_T0) * i) / (TWIG_SLOTS - 1); }
    setStub(id, on) { const b = this.branches.get(id); if (b) { b.stub = !!on; this.paint(); } }
    setTwigs(id, list) {
      const b = id === 'control' ? this.ctl : this.branches.get(id);
      if (!b) return;
      const arr = Array.isArray(list) ? list.slice(0, TWIG_SLOTS) : [];
      for (let i = 0; i < TWIG_SLOTS; i++) {
        const q = arr[i];
        b.twigs[i] = q && TWIG_STATES.includes(q.state) ? { id: q.id == null ? '' : String(q.id), t: this.twigT(i), state: q.state, grade: clamp(Math.round(+q.grade || 3), 1, 5), kind: KINDS.includes(q.kind) ? q.kind : 'you', parts: q.state === 'leaf' ? sprigCounts(q.parts) : null } : null;
      }
      this.paint();
    }
    setLimbFill(id, f) { const b = this.branches.get(id); if (b) { b.fill = clamp(+f || 0); this.paint(); } }
    setCollar(id) { this.collarOn = this.branches.has(id) ? id : null; this.paint(); }
    setDrivers(list) { (list || []).forEach((d) => { if (d && d.state === 'binds') this.collarOn = d.id; }); this.paint(); }
    setMetrics(m) { Object.assign(this.metrics, m || {}); this.paint(); }
    setEncoding(on) { this.encode = !!on; this.paint(); }
    setRoots() {}
    setRootSources(c) { SRC.forEach((id) => { this.counts[id] = Math.max(0, Math.round(+(c && c[id]) || 0)); }); this.paint(); }
    setRootBalance(own) { this.balance = own == null ? null : clamp(+own || 0); this.paint(); }
    crownRadius() { const r = this.svg.getBoundingClientRect(); return Math.max(40, r.width * 0.3); }
    setCrownLeaves() {}
    wave() { this.svg.classList.add('wave'); setTimeout(() => this.svg.classList.remove('wave'), 600); }
    setPlanted(v) { this.planted = !!v; this.paint(); }
    setMonths() {}
    setTheme() { this.paint(); }
    setName(name) { this.name = String(name || '').trim(); return possessive(this.name); }
    select(id) { this.selected = id === 'control' ? 'trunk' : id || null; } // the control section is the trunk's upper third
    highlight() {}
    showPart() {}
    setData(list) {
      const by = {};
      const counts = { you: 0, sector: 0, web: 0, assumed: 0 };
      (Array.isArray(list) ? list : []).forEach((q) => {
        if (!q) return;
        const kind = q.kind === 'skip' ? 'assumed' : SRC.includes(q.kind) ? q.kind : 'assumed';
        counts[kind] += 1;
        if (!this.branches.has(q.driver)) return;
        (by[q.driver] = by[q.driver] || []).push({ id: q.id, state: q.kind === 'skip' ? (q.value ? 'estimate' : 'ring') : 'leaf', grade: clamp(1 + Math.round((+q.size || 0) * 4), 1, 5), kind });
      });
      ORDER.forEach((id) => this.setTwigs(id, by[id] || []));
      this.setRootSources(counts);
    }
    focusBranch() {}
    focus() {}
    lockDrag() {}
    frame(preset, opts = {}) {
      if (typeof preset === 'string' && preset !== 'intro' && preset !== 'arrival' && this.trunkDemo) { this.trunkDemo = false; this.paint(); }
      if (typeof preset === 'string' && preset !== this.pose.preset) this.fit();
      this.pose = { preset: typeof preset === 'string' ? preset : this.pose.preset };
      if (opts.encode !== undefined || ['cutscene', 'explore', 'harvest'].includes(preset)) this.setEncoding(opts.encode === undefined ? true : opts.encode);
      return this.pose;
    }
    setLabel(part, text) {
      const L = this.label;
      if (!L.el) {
        L.el = document.getElementById('label');
        if (!L.el) { L.el = document.createElement('div'); L.el.className = 'tag'; L.el.innerHTML = '<i></i><span></span>'; (this.tags ? this.tags.box : document.body).appendChild(L.el); }
      }
      L.part = part == null ? null : part;
      L.text = String(text == null ? '' : text);
      L.echoAt = 0;
      (L.el.querySelector('span') || L.el).textContent = L.text;
    }
    setCoreHost(el) { this.coreHost = el || null; }
    setDiscs(list) { GrowthTree.prototype.setDiscs.call(this, list); }
    seatDiscs() { GrowthTree.prototype.seatDiscs.call(this); } // the flat tree's points are viewport points, and tree.css fixes the layer over the viewport
    showDiscNames(ms) { GrowthTree.prototype.showDiscNames.call(this, ms); }
    nameDisc(el, ms) { GrowthTree.prototype.nameDisc.call(this, el, ms); }
    flight(from, limbId, twigIndex, text, kind) {
      const i = clamp(twigIndex | 0, 0, TWIG_SLOTS - 1);
      const dest = () => this.anchor(this.branches.has(limbId) || limbId === 'control' ? { limb: limbId, twig: i } : 'trunk');
      return flyDom(from || { x: 0, y: 0 }, dest, text, kind, null);
    }
    playIntro(ms, opts = {}) {
      this.planted = true;
      const wait = reduce() ? 1 : Math.max(1, +ms || 3000);
      if (opts.camera !== false) this.frame(opts.preset || 'planting');
      this.trunkDemo = opts.trunkKnown !== undefined ? !!opts.trunkKnown : opts.preset === 'intro'; // the intro's own tree shows a resolved trunk
      this.paint();
      return new Promise((res) => setTimeout(res, wait));
    }
    snapshot() { return null; }
    /** the flat tree has no growth clock and no camera: these answer so the page's calls hold */
    introSeek() { return 1; }
    toSeed() {
      this.planted = false;
      this.encode = false;
      this.collarOn = null;
      this.selected = null;
      this.balance = null;
      this.branches.forEach((b) => { b.stub = true; b.fill = 0; b.twigs.fill(null); });
      this.ctl.twigs.fill(null);
      this.trunkDemo = false;
      this.setFocusPart(-1);
      this.fit();
      SRC.forEach((id) => { this.counts[id] = 0; });
      if (this.tags && this.discs.length) this.setDiscs([]);
      this.partState = {};
      this.view = 'current';
      this.groupsDirty = true;
      this.paint();
      return this;
    }
    refit() {}
    /** R6: the trunk is pale until today's revenue is known (a cut: the drawing is made again) */
    setTrunkKnown(on) { const v = !!on; this.trunkKnownSet = true; if (v !== this.trunkKnown) { this.trunkKnown = v; this.paint(); } return v; }
    /* ---------- Rebuild 1: the same calls as the 3D tree; every change is a repaint (a cut) ---------- */
    setPartState(part, st) { const out = GrowthTree.prototype.setPartState.call(this, part, st); this.paint(); return out; }
    partStates() { return this.partState; }
    setActiveGroup(id) { return GrowthTree.prototype.setActiveGroup.call(this, id); }
    setGroupLabels(mode) { return GrowthTree.prototype.setGroupLabels.call(this, mode); }
    setGroupWords(map) { GrowthTree.prototype.setGroupWords.call(this, map); }
    groupOf(part) { return GrowthTree.prototype.groupOf.call(this, part); }
    activeGroupId() { return GrowthTree.prototype.activeGroupId.call(this); }
    groupLimb(L) { return GrowthTree.prototype.groupLimb.call(this, L); }
    encoding() { return this.encode; }
    hideLabel(L) { GrowthTree.prototype.hideLabel.call(this, L || { vis: false }); }
    /** the metric's linear axis on the 300 x 420 drawing: the trunk's height as a share of the full 210 (the target). Task 20:
        a milestone, and a page with no metric, stand at the interview size; the answered share never moves the height. */
    heightRatio(v) {
      if (!this.encode) return 1;
      if (this.metric) return GrowthTree.prototype.metricScale.call(this, v === undefined ? this.metric.baseline : v) / (METRIC.goal / UNIT_H);
      return S_REST / (METRIC.goal / UNIT_H);
    }
    heightMeans() { return GrowthTree.prototype.heightMeans.call(this); }
    metricPair() { return GrowthTree.prototype.metricPair.call(this); }
    metricScale(v) { return GrowthTree.prototype.metricScale.call(this, v); }
    heightOf(v) { return 210 * this.heightRatio(v); }
    markerShown() { return this.metric !== undefined && (this.encode || !!this.markerAlways); }
    layoutMarker() { this.markerKind = this.metric ? 'goal' : this.metric === null ? 'milestone' : 'none'; }
    readTokens() {} // the flat tree takes every colour from the page's own tokens in the markup it writes
    setMetric(m, opts) { const out = GrowthTree.prototype.setMetric.call(this, m, opts); this.paint(); return out; }
    getMetric() { return this.metric; }
    setView(v) { const view = VIEWS.includes(v) ? v : 'current'; if (view !== this.view) { this.view = view; this.groupsDirty = true; this.emit('view', { view }); this.paint(); } return this.view; }
    getView() { return this.view; }
    showCore(on) { this.coreWanted = !!on; return this.coreWanted; }
    coreAllowed() { const p = this.pose && this.pose.preset; return this.coreWanted || p === 'intro' || p === 'arrival'; }
    inspectGroup(L, e) { GrowthTree.prototype.inspectGroup.call(this, L, e); }
    /* ---------- Final 1: the halo, the depth, the branch inspector and the Whole tree reset, as the 3D tree ---------- */
    // The halo is a static frame here, centred on the drawing: the flat tree redraws whole, so nothing eases and the pointer
    // depth stays off. Every call below has the same signature and the same return as the 3D tree's.
    haloLevel() { return GrowthTree.prototype.haloLevel.call(this); }
    haloPart() { return GrowthTree.prototype.haloPart.call(this); }
    setHalo(level, opts) { return GrowthTree.prototype.setHalo.call(this, level, opts); }
    getHalo() { return GrowthTree.prototype.getHalo.call(this); }
    setDepth(on) { this.depthOn = on === null || on === undefined ? null : !!on; return false; } // decorative depth needs a live frame loop
    depthActive() { return false; }
    suspendDecor(off) { if (this.halo.el) this.halo.el.dataset.anim = off ? '0' : '1'; }
    placeHalo() {
      const H = this.halo;
      if (!H.el) return;
      const r = this.svg.getBoundingClientRect();
      const level = this.haloLevel();
      const a = H.on ? (HALO.alpha[level] || 0) : 0;
      H.shown = a;
      H.x = r.left + r.width / 2;
      H.y = r.top + r.height * (this.haloPart() === 'roots' ? 0.78 : 0.42);
      H.r = clamp(r.width * 0.46, HALO.min, HALO.max);
      if (H.el.dataset.level !== level) H.el.dataset.level = level;
      // written only when it has moved: the flat tree's frame loop runs on, and a still drawing must cost nothing
      if (!(Math.abs(H.x - H.tx) <= 0.5 && Math.abs(H.y - H.ty) <= 0.5 && Math.abs(H.r - H.tr) <= 0.5)) {
        H.tx = H.x; H.ty = H.y; H.tr = H.r;
        H.el.style.width = `${(H.r * 2).toFixed(1)}px`;
        H.el.style.height = `${(H.r * 2).toFixed(1)}px`;
        H.el.style.transform = `translate3d(${H.x.toFixed(1)}px, ${H.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      if (!(Math.abs(a - H.ta) <= 0.002)) { H.ta = a; H.el.style.opacity = a.toFixed(3); }
    }
    branchPart(id) { return GrowthTree.prototype.branchPart.call(this, id); }
    presetFor(part) { return GrowthTree.prototype.presetFor.call(this, part); }
    setBranchInfo(part, info) { return GrowthTree.prototype.setBranchInfo.call(this, part, info); }
    branchData(part) { return GrowthTree.prototype.branchData.call(this, part); }
    setInspector(on) { return GrowthTree.prototype.setInspector.call(this, on); }
    setComposition(mode) { this.centred = mode === 'centred' || mode === true; return this.centred ? 'centred' : 'auto'; } // the flat tree draws in its own box either way
    composition() { return this.centred ? 'centred' : 'auto'; }
    setWholeControl(on) { return GrowthTree.prototype.setWholeControl.call(this, on); }
    expandBranch(id, opts) { return GrowthTree.prototype.expandBranch.call(this, id, opts); }
    collapseBranch(opts) { return GrowthTree.prototype.collapseBranch.call(this, opts); }
    openBranch() { return this.branchOpen; }
    pageTools() { return GrowthTree.prototype.pageTools.call(this); }
    syncBranch(force) { return GrowthTree.prototype.syncBranch.call(this, force); }
    insideBranch() {
      if (this.branchOpen) return true;
      if (this.zoomK > 1.01) return true;
      const p = this.pose && this.pose.preset;
      return !!(this.encode && p && (SECTION_PRESET[p] || p === 'control' || p === 'you'));
    }
    panBy() { return false; } // the flat tree's zoom is a scale about its own middle: there is nothing to pan off screen
    wholeTree(opts) {
      const o = opts || {};
      const wasBranch = !!this.branchOpen;
      this.collapseBranch({ refocus: false, silent: true });
      this.zoomK = 1;
      this.svg.style.transform = '';
      if (wasBranch || o.preset) this.frame(o.preset || 'explore');
      if (o.focus !== false && this.host && typeof this.host.focus === 'function') { try { this.host.focus({ preventScroll: true }); } catch (e) { /* the page's own business */ } }
      this.emit('whole', { preset: o.preset || this.pose.preset, branch: wasBranch });
      this.paint();
      return o.preset || this.pose.preset;
    }
    /** the panel under the drawing and the reset at its top right: the flat tree's overlay box is fixed over the viewport */
    placeBranch() {
      const el = this.branchEl;
      if (!el || el.dataset.open !== '1') return;
      const r = this.svg.getBoundingClientRect();
      const bw = el.offsetWidth || BRANCH.w, bh = el.offsetHeight || 96;
      const x = r.left + r.width / 2 - bw / 2, y = Math.max(BRANCH.pad, r.bottom - bh - BRANCH.pad);
      if (!(Math.abs(x - this.branchTx) <= 0.5 && Math.abs(y - this.branchTy) <= 0.5)) {
        this.branchTx = x; this.branchTy = y;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    }
    placeReset() {
      const el = this.resetEl;
      if (!el || el.dataset.on !== '1') return;
      const r = this.svg.getBoundingClientRect();
      const bw = el.offsetWidth || 96;
      const x = r.right - bw - BRANCH.pad, y = r.top + BRANCH.pad;
      if (!(Math.abs(x - this.resetTx) <= 0.5 && Math.abs(y - this.resetTy) <= 0.5)) {
        this.resetTx = x; this.resetTy = y;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    }
    /** the persistent labels, placed by their anchors with the discs' collision nudge (labels stack down when they meet) */
    placeTags(now) {
      if (!this.tags) return;
      if (this.groupsDirty) GrowthTree.prototype.syncLabels.call(this, now);
      const r = this.svg.getBoundingClientRect();
      const shown = this.tagsOn !== 'none' && this.planted && this.pose.preset !== 'arrival';
      const items = [];
      this.tagList.forEach((L) => {
        if (!L.el) return;
        let a = null;
        if (shown && L.mode) {
          if (L.kind === 'group') a = L.id === 'leverage' ? this.anchor('control') : L.id === 'trunk' ? this.toScreen(150, 260) : L.id === 'roots' ? this.anchor('roots') : this.anchor((L.limb = this.groupLimb(L)));
          else if (L.kind === 'marker' && this.markerShown()) a = this.toScreen(150, 83);
          else if (L.kind === 'plan' && this.markerShown() && this.view === 'plan' && this.metric && this.metric.scenario != null) a = this.toScreen(150, 300 - 210 * this.heightRatio(this.metric.scenario) - 10);
        }
        if (!a) { GrowthTree.prototype.hideLabel.call(this, L); return; }
        if (!L.w) { L.w = L.el.offsetWidth || L.text.length * 6.4 + 14; L.h = L.el.offsetHeight || (L.mode === 'expanded' ? 34 : 16); }
        const axis = this.anchor('trunk');
        const right = L.kind === 'marker' || L.kind === 'plan' ? null : !axis || a.x >= axis.x;
        const cx = right === null ? a.x : a.x + (right ? 1 : -1) * (L.w / 2 + 14), cy = right === null ? a.y - L.h / 2 - 6 : a.y;
        items.push({ id: L.id, L, t: { x: cx, y: cy }, w: L.w, h: L.h, el: L.el });
      });
      nudgePlace(items, window.innerWidth, window.innerHeight, this.tagMemo);
      items.forEach((it) => {
        const L = it.L, x0 = it.x - L.w / 2 - r.left, y0 = it.y - L.h / 2 - r.top; // the overlay box sits over the drawing
        L.el.style.transform = `translate3d(${x0.toFixed(1)}px, ${y0.toFixed(1)}px, 0)`;
        L.x0 = x0; L.y0 = y0; L.x1 = x0 + L.w; L.y1 = y0 + L.h;
        L.inside = x0 >= 0 && y0 >= 0 && L.x1 <= r.width && L.y1 <= r.height;
        if (!L.vis) { L.vis = true; L.el.style.opacity = '1'; L.el.removeAttribute('aria-hidden'); L.el.tabIndex = 0; }
        L.on = true;
      });
    }
    /** R16: the flat tree zooms about its own middle, so it cannot leave the screen; fit() is zoom 1. No turning: it has one side */
    zoomBy(f) {
      if (!(+f > 0) || !this.planted) return this.zoomK;
      const k = clamp(this.zoomK * +f, ZOOM.min, ZOOM.max);
      if (k !== this.zoomK) { this.zoomK = k; this.svg.style.transform = k === 1 ? '' : `scale(${k.toFixed(3)})`; this.emit('zoom', { k, min: ZOOM.min, max: ZOOM.max }); }
      return k;
    }
    fit() { if (this.zoomK !== 1) { this.zoomK = 1; this.svg.style.transform = ''; this.emit('zoom', { k: 1, min: ZOOM.min, max: ZOOM.max }); } return true; }
    zoomLevel() { return this.zoomK; }
    turnBy() {}
    onKey(e, el) { return stageKey(this, e, el || this.host); }
    listParts() {
      const out = [];
      if (!this.planted) return out;
      out.push({ kind: 'limb', id: 'trunk' });
      this.branches.forEach((b) => {
        out.push({ kind: 'limb', id: b.id });
        b.twigs.forEach((tw, i) => { if (tw && tw.id && tw.state) out.push({ kind: 'twig', id: tw.id, limb: b.id, slot: i, state: tw.state }); });
      });
      this.ctl.twigs.forEach((tw, i) => { if (tw && tw.id && tw.state) out.push({ kind: 'twig', id: tw.id, limb: 'control', slot: i, state: tw.state }); });
      SRC.forEach((id) => { if (this.counts[id]) out.push({ kind: 'root', id }); });
      return out;
    }
    partPoint(part) { return this.anchor(part.kind === 'twig' ? { limb: part.limb, twig: part.slot } : part.kind === 'root' ? `root:${part.id}` : part.id); }
    stepFocus(dir) { GrowthTree.prototype.stepFocus.call(this, dir); }
    setFocusPart(i) {
      const list = this.focusParts || [];
      this.focusAt = i >= 0 && i < list.length ? i : -1;
      focusDom(this);
      if (this.focusAt < 0) { this.focusParts = null; if (this.focusEl) this.focusEl.style.opacity = '0'; if (this.liveEl) this.liveEl.textContent = ''; return; }
      if (this.liveEl) this.liveEl.textContent = partName(list[this.focusAt]);
    }
    focusPoint() { return null; }
    inspectFocus() {
      const part = this.focusAt >= 0 && this.focusParts ? this.focusParts[this.focusAt] : null;
      const a = part && this.partPoint(part);
      if (!a) return;
      const out = { id: part.id, kind: part.kind, x: a.x, y: a.y, key: true };
      if (part.kind === 'twig') {
        out.limb = part.limb; out.slot = part.slot; out.state = part.state;
        if (part.state === 'bud' || part.state === 'ring') this.emit('twig', { id: part.id, limb: part.limb, slot: part.slot, state: part.state });
      }
      this.emit('inspect', out);
    }
    frameReport() {
      const r = this.svg.getBoundingClientRect();
      const anchors = {};
      ['seed', 'core', 'trunk', 'control', 'top', 'crown', 'roots'].concat(ORDER).forEach((k) => { const a = this.anchor(k); anchors[k] = a ? { x: Math.round(a.x), y: Math.round(a.y) } : null; });
      const labels = this.tagList.filter((L) => L.on).map((L) => ({ id: L.id, kind: L.kind, mode: L.mode, text: L.text, x0: Math.round(L.x0), y0: Math.round(L.y0), x1: Math.round(L.x1), y1: Math.round(L.y1), inside: L.inside }));
      const m = this.markerShown() ? this.toScreen(150, 90) : null;
      return { flat: true, preset: this.pose.preset || null, size: { w: Math.round(r.width), h: Math.round(r.height) }, anchors, fill: null, ok: true, labels,
        labelsMoving: [], labelsHidden: this.tagList.filter((L) => L.mode && !L.on).map((L) => L.id), viewMode: this.view, metric: this.metric === undefined ? undefined : this.metric === null ? null : { ...this.metric },
        marker: m ? { x: Math.round(m.x), y: Math.round(m.y), label: this.metricLabel, inside: m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom } : null,
        markerKind: this.markerKind, pair: this.metricPair(), heightMeans: this.heightMeans(), halo: this.getHalo(), depth: false,
        branch: this.branchOpen ? this.branchData(this.branchOpen) : null, whole: { shown: this.resetOn === true, inside: this.insideBranch() } };
    }
    placeOverlays(now) {
      this.placeHalo();
      this.syncBranch(false);
      this.placeBranch();
      this.placeReset();
      if (this.focusAt >= 0 && this.focusEl && this.focusParts) { // the ring round the focused part (viewport px: the overlay box is fixed over the viewport)
        const a = this.partPoint(this.focusParts[this.focusAt]);
        if (a) { this.focusEl.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -50%)`; this.focusEl.style.opacity = '1'; } else this.focusEl.style.opacity = '0';
      }
      const r = this.svg.getBoundingClientRect();
      const port = clearing() === 'bottom';
      const L = this.label;
      if (L.el) {
        const a = L.part != null && L.text ? this.anchor(L.part) : null;
        if (!L.echoAt || now - L.echoAt > 300) { L.echoAt = now; L.echo = labelEchoes(L.text); } // not shown when it only repeats the panel
        const show = a && r.height >= 240 && !L.echo;
        if (show) {
          // beside its part, on the side away from the trunk (the flat tree has no leaves to clear, so a fixed 18 px)
          const axis = this.anchor('trunk');
          const right = !port && axis && a.x > axis.x + LABEL.flip;
          const x = port ? a.x : a.x + (right ? 18 : -18), y = port ? a.y + 18 : a.y;
          L.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${port ? '-50%, 0' : right ? '0, -50%' : '-100%, -50%'})`;
          L.el.dataset.side = port ? 'bottom' : right ? 'right' : 'left';
        }
        L.el.style.opacity = show ? '1' : '0';
      }
      if (this.coreHost) {
        const a = this.coreAllowed() ? this.anchor('core') : null; // the intro's demonstration only (Rebuild 1), as the 3D tree
        if (a) this.coreHost.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        this.coreHost.dataset.placed = a ? '1' : '0';
      }
      this.placeTags(now);
      if (this.discs.length && this.tags) {
        if (this.tags.discs.parentNode !== this.discSeat) this.seatDiscs();
        if (port) { this.tags.discs.dataset.row = '1'; return; }
        this.tags.discs.dataset.row = '0';
        const memo = this.discMemo || (this.discMemo = new Map());
        const items = [];
        this.discs.forEach((d) => {
          const t = this.anchor(d.part);
          if (!t) { d.el.style.opacity = '0'; return; }
          const size = (d.el.offsetWidth || 28) * d.scale;
          items.push({ id: d.id, d, t, w: size, h: size, el: d.el, born: +d.el.dataset.born || 0 });
        });
        nudgePlace(items, window.innerWidth, window.innerHeight, memo);
        const axis = this.anchor('trunk');
        GrowthTree.prototype.placeNames.call(this, items, axis ? axis.x : window.innerWidth / 2, window.innerWidth, window.innerHeight);
        items.forEach((it) => {
          const pop = reduce() ? 1 : easeOut((now - it.born) / 240);
          it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${((0.6 + 0.4 * pop) * it.d.scale).toFixed(3)})`;
          it.el.style.opacity = String(pop);
        });
      }
    }
  }

  GrowthTree.LIMBS = ORDER.slice();
  GrowthTree.SOURCES = SRC.slice();
  GrowthTree.PRESETS = ['arrival', 'intro', 'roots', 'planting', 'offer', 'reach', 'routes', 'close', 'delivery', 'money', 'clients', 'you', 'control', 'ground', 'close-pull', 'cutscene', 'explore', 'harvest'];
  GrowthTree.TWIG_SLOTS = TWIG_SLOTS;
  /** the framing constants (shares of the viewport); solve() reads them live, so they can be tuned from the console */
  GrowthTree.FIT = FIT;
  /** where the live label may stand and which of the panel's words it must not repeat; read live, like FIT */
  GrowthTree.LABEL = LABEL;
  // zoom's limits and steps, and where the control section stands on the trunk: live, like FIT
  GrowthTree.ZOOM = ZOOM;
  GrowthTree.CONTROL = CONTROL;
  // Rebuild 1 (R10): the four business groups over the six limbs (control is the trunk's upper third), their words, the
  // evidence words per state, the parts that carry a state, and the metric's mapping; the tables are read live
  GrowthTree.GROUPS = GROUPS;
  GrowthTree.GROUP_OF = GROUP_OF;
  GrowthTree.GROUP_WORDS = GROUP_WORDS;
  GrowthTree.PART_WORDS = PART_WORDS;
  GrowthTree.PARTS = PARTS.slice();
  GrowthTree.EVIDENCE = EVIDENCE;
  GrowthTree.STATES = STATES.slice();
  GrowthTree.METRIC = METRIC;
  GrowthTree.VIEWS = VIEWS.slice();
  // Final 1: the halo's three steps and its numbers (Task 06 / D11), the goal line's (Task 20 / D12), and the inspector's
  GrowthTree.HALO = HALO;
  GrowthTree.GOAL = GOAL;
  GrowthTree.BRANCH = BRANCH;
  /** no WebGL: the flat tree in an SVG, with the same calls */
  GrowthTree.flat = (host) => new FlatTree(host);
  /** the tree that works here: WebGL when it can, flat otherwise */
  GrowthTree.make = (host) => { const t = new GrowthTree(); if (t.ok) { if (host) t.mount(host); return t; } return new FlatTree(host); };
  window.GrowthTree = GrowthTree;
  M.GrowthTree = GrowthTree;
})();
