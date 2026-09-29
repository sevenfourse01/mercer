/* feel.js: sound, motion, one grade ramp, and the M.ui instrument library. Shared as M.feel and M.ui.
   Loads before app.js and reads every late export lazily (M.SECTIONS, M.ghost, M.STACK, M.QUADRANT, M.DIST_BY, M.TYPES, M.TYPE_AXES).

   M.feel.play(name, { x, x2, grade, key, step, gain, pan })
        names: tap next open close reveal grow done leaf estimate na root wave whoosh close3 plant powerup rise beat discopen back
        x, x2 are screen fractions 0..1 (x2 = glide target); grade 1..5 for leaf/estimate; key a note name for close3/beat; step 0.. for beat
   M.feel.panOf(elOrXY) -> 0..1
   M.feel.key(sectionId) -> note name (from M.SECTIONS[].key; 'C' when unknown)
   M.feel.scene(name, { ms, fade, level }) / M.feel.scene(false) / M.feel.cue(opts) -> { stop() } / M.feel.silence()
        sound belongs to moments (final 1, task 05): entering a cutscene plays ONE bird cue of 2 to 4 s at a low
        ceiling and fades it. There is no loop under questions or results. Leaving, muting, hiding the tab and
        teardown all stop it; a second cue cancels the first, so re-entering never stacks. No sound on pointer move.
   M.feel.birds = { start(opts), cue(opts), stop(), level(0..1), fade(level, ms), allowed (bool, settable), running() }
        start() is kept as a name for cue(): one bounded cue, never the old ambient bed. fade(0, ms) is a leave
        (the waiting phrases go); fade(1, ms) only sets the ceiling for the next cue and schedules nothing.
   M.feel.pulse(fromEl, delayMs) -> bool: one pulse along a line from fromEl towards #core, drawn in #flight (the CV socket's power-up)
   M.feel.toggle / bindDrop / reveal / grade / paintGrade / gradeColor / gauge / possessive / muted / setMuted / mountSwitch / reduced / EASE / measure  (v11, kept)

   M.ui.<name>(host, opts) -> { el, get(), set(v, silent), clear(silent), focus(), destroy() }
        common opts: { id, value, hue: '--sec-*', onInput(v), onCommit(v), label, unit, scale: [lo, hi], log, na, readout(v) -> string }
        commit fires on release, Enter or blur, never on drag; Enter also dispatches a bubbling 'mercer:enter' { id, value } from the component;
        arrows step (Shift x10), Escape reverts to the last committed value; the moving part is painted with var(--hue).
        Every instrument carries one <output class="ui-readout"> directly under its control: opts.readout(value) when given, else its
        own words for its kind, else (no value yet) what it measures, in the ghost colour; hidden when there is nothing to say.
        One thumb (.handle, 14 px) and one focus ring on all of them. On a touch a rail, ring, arc, trough or dial lets a vertical
        scroll through (touch-action: pan-y) and starts a drag only once the finger runs along it; pointercancel puts the value back.
        Figures (refine 1): `unit` is on show from the start wherever a figure shows: a currency sign leads, every other unit follows
        (slider, pair, field, ring, kept ring, ten stones, fee, capacity). A typed figure beyond the rail is kept as typed and keeps
        its decimals (fmtKeep). Text that is no figure stays in the field with a line beside it (.ui-note): opts.invalidWords rewords
        it, opts.validate(value, text, index) -> sentence adds the caller's own rule, the field's opts.rangeWords(min, max) rewords its range.
   M.ui.hint(el, text, key) -> { el, shown, dismiss(), destroy() }: a one-time line with a short leader; hint.seen(key)
   M.ui.filePick(opts | host, opts) -> the same shape plus pick(file): one local .txt, .md or .csv read with FileReader; opts.onText(text, fileName)
   M.ui.sorter: opts.bins of any length with the caller's labels; opts.items [[id, label]] makes the discs named tiles; opts.partial
   Rebuild 1:
     Suggested values: opts.suggested: true with opts.value shows the value as a proposal (a "suggested" tag, .suggested on the
        root, the figure in --ink-2) until the visitor changes it or the flow's Continue calls accept(); clear() (Not sure) discards
        it. Every instrument returns suggested(), accepted(), accept() and suggest(v) as well; get() is the value as always.
     M.ui.cards(host, opts) or cards(opts): whole-surface choice cards: options [[v, label, sub?]] or [{ v, label, sub }], multi,
        exclusive [values that stand alone], columns, lead (the "Choose one or more" line; false for none). Two options make an
        either/or; five make a row of three over a centred row of two; at 480 and under they stack. Stones share the picking:
        opts.exclusive and opts.lead work on M.ui.stones too.
     M.ui.clientCards(host, opts): one to five compact anonymous best-client cards; get() is always an array ([] for none);
        opts.max, fields, cardWords, addWords, firstWords, removeWords, moveWords, unit. Up / Down / Remove by tap, Shift+arrows.
     M.ui.sort: opts.order: true ranks inside each zone (Up and Down by tap, Shift+Up / Shift+Down), opts.topWords names the
        top positions; the value shape is unchanged.
     The fee's three figures are typed (.fee-faces, three .face-col); a typed figure may sit between the marks or beyond the
        rail; the ring's centre figure is typed too (.ring-face beside the slider box). Rails are continuous while in hand and
        snap to a mark on release. A rail's end label is aligned inward (.tick-lab.at-start / .at-end).
   Final 1 (task 09), three more instruments from the same pieces. Each one keeps the shared shape above and adds nothing
   to it that an old caller has to know:
     M.ui.dots(host, opts): the dot-density field. opts { scale: [lo, hi], unit ('people'), per, maxDots (120), columns,
        now, nowWords, caption, restWords }. get() is the number, or [lo, hi] when a range is typed. The count is live
        above the field (.dots-count, aria-live), the key line says what one dot is, and the field's own line says the
        dots are a size and not real people or leads. The typed figure and the rail are both the whole control;
        the dots are aria-hidden. Also count(), per(), lit().
     M.ui.paths(host, opts): delivery mode. Default options visit | travel | remote | ship | mixed, each a labelled text
        choice; the drawing above them (aria-hidden) shows the two marks and one labelled path in the answer's direction.
        opts { options, youWords, themWords, lead, clearable }. get() is the option's value.
     M.ui.rank(host, opts): the choices become a numbered list. opts { options, max, lead, orderWords, moveWords,
        removeWords }. get() is an array of ids in rank order. Up, Down and Remove on every line (Shift+Up / Shift+Down
        from the keyboard), the position written beside each one.
     M.ui.slider opts.now (with opts.nowWords): the baseline marked on the target's own rail, its unit written out
        ("Now £4,800"); setNow(v) moves it later, now() reads it. The typed figure above the rail is the alternative. */
(() => {
  'use strict';
  const M = (window.Mercer = window.Mercer ?? {});
  const doc = document;
  const EASE = 'cubic-bezier(.2, .75, .1, 1)';
  const DUR = 220;
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

  /* ================= sound: synthesised, quiet, only after a gesture ================= */
  const KEY = 'mercer-sound';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === 'off'; } catch (e) {}
  let ctx = null, bus = null, noise = null, gestured = false;
  const last = {};
  let growStep = 0;

  /** master gain 0.05 behind a soft lowpass, and half a second of white noise for the swishes */
  function chain(ac) {
    const master = ac.createGain();
    master.gain.value = 0.05;
    const soften = ac.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 6800;
    soften.Q.value = 0.5;
    soften.connect(master);
    master.connect(ac.destination);
    const len = Math.floor(ac.sampleRate * 0.5);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return { bus: soften, noise: buf };
  }
  function boot() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      ({ bus, noise } = chain(ctx));
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      birds.wake();
    } catch (e) { ctx = null; bus = null; }
  }
  const onGesture = () => { gestured = true; if (!muted) boot(); };
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((t) => window.addEventListener(t, onGesture, { capture: true, passive: true }));

  /** screen x as a fraction 0..1, from an element or a point */
  function panOf(src) {
    const W = window.innerWidth || 1;
    if (!src) return 0.5;
    if (typeof src === 'number') return clamp(src > 1 ? src / W : src, 0, 1);
    if (src.getBoundingClientRect) { const r = src.getBoundingClientRect(); return clamp((r.left + r.width / 2) / W, 0, 1); }
    if (isNum(src.x)) return clamp(src.x > 1 ? src.x / W : src.x, 0, 1);
    return 0.5;
  }
  /** pan = clamp((x - 0.5) x 1.6, -0.7, 0.7); +-0.4 on a phone */
  function panValue(x) {
    if (!isNum(x)) return 0;
    const lim = (window.innerWidth || 1440) <= 480 ? 0.4 : 0.7;
    return clamp((Number(x) - 0.5) * 1.6, -lim, lim);
  }
  /** the voice's outlet: a gain, then one panner made from the CURRENT ctx (measure() swaps it), or two crossfaded when x2 is given */
  function outlet(t0, dur, o = {}) {
    const g = ctx.createGain();
    g.gain.value = isNum(o.gain) ? Number(o.gain) : 1;
    if (!ctx.createStereoPanner) { g.connect(bus); return g; }
    const p1 = ctx.createStereoPanner();
    p1.pan.value = isNum(o.pan) ? clamp(Number(o.pan), -1, 1) : panValue(o.x);
    if (!isNum(o.x2)) { g.connect(p1); p1.connect(bus); g.p1 = p1; return g; }
    const p2 = ctx.createStereoPanner();
    p2.pan.value = panValue(o.x2);
    const g1 = ctx.createGain(), g2 = ctx.createGain();
    g1.gain.setValueAtTime(1, t0); g1.gain.linearRampToValueAtTime(0, t0 + dur);
    g2.gain.setValueAtTime(0, t0); g2.gain.linearRampToValueAtTime(1, t0 + dur);
    g.connect(g1); g1.connect(p1); p1.connect(bus);
    g.connect(g2); g2.connect(p2); p2.connect(bus);
    g.p1 = p1; g.p2 = p2;
    return g;
  }

  /** one enveloped oscillator: clean attack, exponential release */
  function tone(t0, f, { f2, type = 'sine', a = 0.006, d = 0.14, g = 0.5, to = bus, hold = 0 } = {}) {
    const o = ctx.createOscillator(), e = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a + d);
    e.gain.setValueAtTime(0.0001, t0);
    e.gain.linearRampToValueAtTime(g, t0 + a);
    if (hold) e.gain.setValueAtTime(g, t0 + a + hold);
    e.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + d);
    o.connect(e);
    e.connect(to);
    o.start(t0);
    o.stop(t0 + a + hold + d + 0.02);
    return o;
  }
  /** filtered noise with a moving band: the airy swish */
  function air(t0, from, tof, { a = 0.05, d = 0.16, g = 0.8, q = 1.1, to = bus } = {}) {
    const n = ctx.createBufferSource();
    n.buffer = noise;
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(from, t0);
    bp.frequency.exponentialRampToValueAtTime(tof, t0 + a + d);
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, t0);
    e.gain.linearRampToValueAtTime(g, t0 + a);
    e.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    n.connect(bp);
    bp.connect(e);
    e.connect(to);
    n.start(t0, Math.random() * 0.2);
    n.stop(t0 + a + d + 0.02);
  }
  /** a lowpass that opens or closes over the voice, feeding `to` */
  function lowpass(t0, from, tof, ms, to) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(from, t0);
    if (tof && tof !== from) lp.frequency.exponentialRampToValueAtTime(tof, t0 + ms / 1000);
    lp.connect(to);
    return lp;
  }

  const NOTE = { C: 261.63, 'C#': 277.18, Db: 277.18, D: 293.66, 'D#': 311.13, Eb: 311.13, E: 329.63, F: 349.23, 'F#': 369.99, Gb: 369.99, G: 392, 'G#': 415.3, Ab: 415.3, A: 440, 'A#': 466.16, Bb: 466.16, B: 493.88 };
  const noteHz = (name, octave = 4) => (NOTE[String(name ?? 'C').trim()] ?? NOTE.C) * Math.pow(2, octave - 4);
  const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  const PENTA = [783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];
  const LEAF = [392, 493.88, 587.33, 783.99, 987.77]; // G4 B4 D5 G5 B5 by grade
  const gradeIx = (g) => clamp(Math.round(Number(g) || 3), 1, 5) - 1;

  /* every voice: len in seconds (for the crossfade and the offline render) and run(t, to, o) */
  const SOUNDS = {
    tap: { len: 0.08, run(t, to) { tone(t, 1760, { f2: 1320, type: 'triangle', a: 0.002, d: 0.045, g: 0.35, to }); } },
    next: { len: 0.3, run(t, to) { tone(t, 587.33, { a: 0.012, d: 0.15, g: 0.42, to }); tone(t + 0.075, 880, { a: 0.012, d: 0.19, g: 0.38, to }); } },
    back: { len: 0.3, run(t, to) { tone(t, 880, { a: 0.012, d: 0.15, g: 0.35, to }); tone(t + 0.075, 587.33, { a: 0.012, d: 0.19, g: 0.33, to }); } },
    open: { len: 0.25, run(t, to) { air(t, 700, 2600, { a: 0.06, d: 0.15, g: 0.8, to }); tone(t + 0.02, 660, { f2: 880, a: 0.03, d: 0.13, g: 0.07, to }); } },
    close: { len: 0.25, run(t, to) { air(t, 2600, 700, { a: 0.03, d: 0.16, g: 0.7, to }); tone(t, 880, { f2: 620, a: 0.02, d: 0.13, g: 0.06, to }); } },
    reveal: { len: 0.4, run(t, to) {
      const lp = lowpass(t, 480, 2400, 170, to);
      tone(t, 440, { a: 0.14, d: 0.16, g: 0.3, to: lp });
      tone(t, 443, { a: 0.15, d: 0.15, g: 0.12, to: lp });
      tone(t, 659.25, { a: 0.16, d: 0.14, g: 0.16, to: lp });
    } },
    grow: { len: 0.25, run(t, to) {
      const f = PENTA[growStep++ % PENTA.length];
      tone(t, f, { type: 'triangle', a: 0.003, d: 0.19, g: 0.3, to });
      tone(t, f * 2, { a: 0.002, d: 0.07, g: 0.05, to });
    } },
    done: { len: 0.5, run(t, to, o) {
      const notes = [523.25, 659.25, 783.99];
      if (o.octave) notes.push(1046.5);
      notes.forEach((f, i) => {
        tone(t + i * 0.085, f, { a: 0.01, d: o.octave ? 0.3 : 0.15, g: 0.4, to });
        tone(t + i * 0.085, f * 2, { a: 0.01, d: 0.07, g: 0.045, to });
      });
    } },
    // commit: a triangle pluck by grade through lowpass 3.2 kHz, and a whispered air as the flight ends
    leaf: { len: 0.62, run(t, to, o) {
      const lp = lowpass(t, 3200, 3200, 0, to);
      tone(t, LEAF[gradeIx(o.grade)], { type: 'triangle', a: 0.004, d: 0.16, g: 0.42, to: lp });
      air(t + 0.5, 1200, 3000, { a: 0.02, d: 0.07, g: 0.22, q: 1.4, to });
    } },
    estimate: { len: 0.25, run(t, to, o) {
      const lp = lowpass(t, 3200, 3200, 0, to);
      tone(t, LEAF[gradeIx(o.grade)] / 2, { type: 'triangle', a: 0.004, d: 0.16, g: 0.25, to: lp });
    } },
    na: { len: 0.15, run(t, to) { air(t, 2600, 800, { a: 0.02, d: 0.1, g: 0.5, to }); } },
    root: { len: 0.45, run(t, to) {
      const lp = lowpass(t, 900, 900, 0, to);
      tone(t, 110, { a: 0.01, d: 0.38, g: 0.5, to: lp });
      tone(t, 220, { a: 0.01, d: 0.38, g: 0.15, to: lp });
    } },
    wave: { len: 0.65, run(t, to) {
      // the envelope follows the bark wave: up over the first third, down over the rest
      tone(t, 110, { a: 0.2, d: 0.4, g: 0.25, to });
      tone(t, 220, { a: 0.2, d: 0.4, g: 0.075, to });
    } },
    whoosh: { len: 0.72, run(t, to) {
      air(t, 300, 2400, { a: 0.12, d: 0.58, g: 0.35, q: 0.9, to });
      tone(t, 220, { f2: 330, a: 0.1, d: 0.6, g: 0.1, to });
    } },
    close3: { len: 0.5, run(t, to, o) {
      const r = noteHz(o.key, 4);
      [r, r * 1.5, r * 2].forEach((f, i) => {
        tone(t + i * 0.09, f, { a: 0.01, d: 0.22, g: 0.36, to });
        tone(t + i * 0.09, f * 2, { a: 0.01, d: 0.12, g: 0.05, to });
      });
    } },
    plant: { len: 2.4, run(t, to, o) {
      // four notes spread across the field, each on its own panner
      const pans = [-0.5, -0.2, 0.2, 0.5];
      [261.63, 329.63, 392, 523.25].forEach((f, i) => {
        const at = t + i * 0.12;
        const out = o.pannable ? outlet(at, 0, { pan: pans[i], gain: 1 }) : to;
        tone(at, f, { a: 0.02, d: 1.8, g: 0.3, to: out });
      });
      air(t, 300, 2000, { a: 0.3, d: 0.6, g: 0.3, to });
    } },
    powerup: { len: 1.2, run(t, to) {
      const lp = lowpass(t, 400, 2400, 700, to);
      tone(t, 200, { f2: 900, type: 'sawtooth', a: 0.05, d: 0.65, g: 0.3, to: lp });
      tone(t, 110, { a: 0.2, d: 0.9, g: 0.25, to });
    } },
    rise: { len: 3.6, run(t, to) {
      [261.63, 329.63, 392, 523.25].forEach((f, i) => {
        const at = t + i * 0.4;
        const lp = lowpass(at, 500, 2600, 1200, to);
        tone(at, f, { a: 0.08, hold: 1.2, d: 2, g: 0.3, to: lp });
      });
    } },
    beat: { len: 1.0, run(t, to, o) {
      const semi = MAJOR[clamp(Math.round(Number(o.step) || 0), 0, MAJOR.length - 1)];
      const f = noteHz(o.key, 4) * Math.pow(2, semi / 12);
      tone(t, f, { a: 0.006, d: 0.9, g: 0.4, to });
      tone(t, f * 2, { a: 0.006, d: 0.7, g: 0.12, to });
      tone(t, f * 3, { a: 0.006, d: 0.5, g: 0.06, to });
    } },
    discopen: { len: 0.12, run(t, to) { tone(t, 1320, { f2: 990, a: 0.004, d: 0.09, g: 0.3, to }); } },
  };
  const GAP = { tap: 0.03 };
  let whooshLive = null; // { out, until }
  /* no sound belongs to pointer movement (task 05): while a finger or a mouse runs along a control, play() is a
     no-op. drag() clears the flag before it hands over the release, so the sound of a confirmed action still lands */
  let dragLive = false;

  function play(name, o = {}) {
    const V = SOUNDS[name];
    if (muted || !gestured || !V || doc.hidden || dragLive) return;
    if (!ctx) boot();
    if (!ctx || !bus) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    try {
      if (name === 'grow') {
        const prev = last.grow ?? -9;
        if (now - prev > 1.5) growStep = 0;
        const at = Math.max(now + 0.005, prev + 0.07);
        if (at - now > 0.3) return;
        last.grow = at;
        V.run(at, outlet(at, 0, o), o);
        return;
      }
      if (name === 'whoosh' && whooshLive && now < whooshLive.until) {
        // never two whooshes in a row: the running one retargets its pan
        const p = whooshLive.out.p2 ?? whooshLive.out.p1;
        if (p) p.pan.setTargetAtTime(panValue(isNum(o.x2) ? o.x2 : o.x), now, 0.08);
        return;
      }
      if (last[name] !== undefined && now - last[name] < (GAP[name] ?? 0.05)) return;
      last[name] = now;
      const t = now + 0.005;
      const out = outlet(t, V.len, o);
      if (name === 'whoosh') whooshLive = { out, until: t + V.len };
      V.run(t, out, name === 'plant' ? { ...o, pannable: true } : o);
    } catch (e) {}
  }
  /** renders one sound offline and measures it: { peak, ms }. Plays nothing. */
  async function measure(name, o = {}) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const V = SOUNDS[name];
    if (!OAC || !V) return null;
    const rate = 44100;
    const oc = new OAC(1, Math.ceil(rate * (V.len + 0.3)), rate);
    const keep = { ctx, bus, noise, growStep };
    try {
      ctx = oc;
      ({ bus, noise } = chain(oc));
      V.run(0, outlet(0, V.len, o), name === 'plant' ? { ...o, pannable: true } : o);
    } finally { ({ ctx, bus, noise, growStep } = keep); }
    const d = (await oc.startRendering()).getChannelData(0);
    let peak = 0, end = 0;
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; if (a > 0.0002) end = i; }
    return { peak: Math.round(peak * 10000) / 10000, ms: Math.round((end / rate) * 1000) };
  }
  /** the key of a section, from M.SECTIONS */
  function key(sectionId) {
    const s = (M.SECTIONS ?? []).find((x) => x.id === sectionId);
    return s?.key ?? 'C';
  }

  /* ---------- birds: one bounded cue for a moment, never an ambient bed (task 05) ----------
     A cutscene opens and M.feel.scene('crown') (or M.feel.cue()) plays two to four seconds of quiet birdsong, then
     fades it. Nothing loops: there is no bed under an ordinary question and none under someone reading a result.
     Every cue stops on leaving the scene, on mute, when the tab goes away and on teardown, and a second cue cancels
     the first, so re-entering never stacks instances. birds.start() is the old name for that same one cue. */
  const CUE = { peak: 0.12, min: 2000, max: 4000, fade: 900 };
  const birds = (() => {
    const VOICES = [
      { lo: 2400, hi: 4200, pan: -0.5 },
      { lo: 2400, hi: 4200, pan: -0.15 },
      { lo: 2400, hi: 4200, pan: 0.3 },
      { lo: 1100, hi: 1600, pan: 0.6, answer: true },
    ];
    let on = false, allowed = false, level = 1, gainNode = null, timers = [], token = 0, pending = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const gate = () => on && allowed && !muted && doc.visibilityState === 'visible' && ctx && ctx.state === 'running';
    function node() {
      if (!ctx) return null;
      if (!gainNode || gainNode.context !== ctx) {
        gainNode = ctx.createGain();
        // silent until a cue ramps it: the node's existence never makes a sound
        gainNode.gain.value = 0;
        gainNode.connect(bus);
      }
      return gainNode;
    }
    function chirp(t, v, f0, dur, to) {
      const car = ctx.createOscillator();
      car.type = 'sine';
      car.frequency.setValueAtTime(f0, t);
      car.frequency.linearRampToValueAtTime(f0 * rnd(0.96, 1.08), t + dur);
      const mod = ctx.createOscillator();
      const mHz = rnd(40, 90);
      mod.frequency.value = mHz;
      const mg = ctx.createGain();
      mg.gain.value = mHz * rnd(0.6, 1.4);
      mod.connect(mg);
      mg.connect(car.frequency);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = clamp(f0, 1800, 5000);
      bp.Q.value = 1.2;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0.0001, t);
      e.gain.linearRampToValueAtTime(1, t + 0.04);
      e.gain.setValueAtTime(1, t + Math.max(0.04, dur - 0.05));
      e.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.09);
      car.connect(bp);
      bp.connect(e);
      e.connect(to);
      car.start(t); mod.start(t);
      car.stop(t + dur + 0.12); mod.stop(t + dur + 0.12);
    }
    function phrase(v) {
      const g = node();
      if (!g) return;
      let to = g;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = v.pan + rnd(-0.08, 0.08); p.connect(g); to = p; }
      const n = 2 + Math.floor(Math.random() * 4);
      let t = ctx.currentTime + 0.02;
      let f = rnd(v.lo, v.hi);
      for (let i = 0; i < n; i++) {
        const dur = rnd(0.06, 0.14);
        chirp(t, v, f, dur, to);
        t += dur + rnd(0.09, 0.16);
        f *= rnd(0.98, 1.05);
      }
    }
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    /** the gain walks down to nothing rather than cutting, so a stop is silence and not a click */
    function drop(ms) {
      if (!gainNode || !ctx) return;
      try {
        const t = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), t);
        gainNode.gain.linearRampToValueAtTime(0, t + Math.max(0.01, ms / 1000));
      } catch (e) {}
    }
    /** one cue: three or four phrases inside a 2 to 4 s window at a low ceiling, then a fade to nothing. It schedules
        no repeat, so the birds cannot outlast the moment that asked for them. A cue while one runs cancels that one
        first (the token retires its timers), so re-entering a cutscene never layers two */
    function cue(o = {}) {
      clearTimers();
      const mine = ++token;
      on = true;
      pending = false;
      if (isNum(o.level)) level = clamp(Number(o.level), 0, 1);
      if (!gate()) { pending = true; return api; }   // no context yet, or not allowed: the cue waits for wake()
      const g = node();
      if (!g) { pending = true; return api; }
      const span = clamp(isNum(o.ms) ? Number(o.ms) : rnd(CUE.min, CUE.max), 800, 6000);
      const fadeMs = Math.max(200, isNum(o.fade) ? Number(o.fade) : CUE.fade);
      const peak = CUE.peak * level;
      try {
        const t0 = ctx.currentTime;
        g.gain.cancelScheduledValues(t0);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + 0.25);
        g.gain.setValueAtTime(peak, t0 + span / 1000);
        g.gain.linearRampToValueAtTime(0, t0 + (span + fadeMs) / 1000);
      } catch (e) {}
      const alive = () => token === mine && gate();
      [80, rnd(520, 900), rnd(1050, 1550)].forEach((ms, i) => {
        if (ms > span - 150) return;
        timers.push(setTimeout(() => { if (alive()) phrase(VOICES[i % 3]); }, ms));
      });
      timers.push(setTimeout(() => { if (alive()) phrase(VOICES[3]); }, Math.max(240, span * 0.6)));
      // the window is over: no timer is left and nothing is sounding
      timers.push(setTimeout(() => { if (token === mine) { on = false; clearTimers(); } }, span + fadeMs + 120));
      return api;
    }
    const api = {
      /** the old name: still one cue, never a loop */
      start(o) { return cue(o ?? {}); },
      cue,
      stop() { token++; on = false; pending = false; clearTimers(); drop(80); },
      running: () => on,
      level(l) {
        level = clamp(Number(l) || 0, 0, 1);
        if (level <= 0) { api.stop(); return; }
        if (gainNode && ctx) { try { gainNode.gain.cancelScheduledValues(ctx.currentTime); gainNode.gain.setTargetAtTime(CUE.peak * level, ctx.currentTime, 0.05); } catch (e) {} }
      },
      /** a fade to nothing is a leave: the waiting phrases go with it and the cue is over. A fade back up only sets the
          ceiling for the next cue; it schedules no phrase, so browsing a result stays silent */
      fade(l, ms = 1000) {
        level = clamp(Number(l) || 0, 0, 1);
        if (level <= 0) { token++; on = false; pending = false; clearTimers(); }
        if (!gainNode || !ctx) return;
        try {
          const t = ctx.currentTime;
          gainNode.gain.cancelScheduledValues(t);
          gainNode.gain.setValueAtTime(Math.max(0, gainNode.gain.value), t);
          gainNode.gain.linearRampToValueAtTime(level <= 0 ? 0 : CUE.peak * level, t + Math.max(0.01, ms / 1000));
        } catch (e) {}
      },
      // the context arrived after the ask (the first gesture): the waiting cue plays now, once
      wake() { if (on && pending) cue(); },
      get allowed() { return allowed; },
      set allowed(v) { allowed = !!v; if (allowed && on && pending) cue(); },
    };
    return api;
  })();

  /* the switch in the top bar: the static #sound when the shell provides it, else a button before #mode */
  const SPEAKER = '<path d="M3.5 8.1v3.8h2.9l4 3.2V4.9l-4 3.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>';
  const ICON_ON = `<svg viewBox="0 0 20 20" aria-hidden="true">${SPEAKER}<path d="M13.3 7.5a3.5 3.5 0 0 1 0 5M15.4 5.4a6.5 6.5 0 0 1 0 9.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const ICON_OFF = `<svg viewBox="0 0 20 20" aria-hidden="true">${SPEAKER}<path d="M13.4 8.1l3.8 3.8M17.2 8.1l-3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  let btn = null;
  function paintSwitch() {
    if (!btn) return;
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.setAttribute('aria-pressed', String(!muted));
    btn.title = muted ? 'Sound off' : 'Sound on';
  }
  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(KEY, muted ? 'off' : 'on'); } catch (e) {}
    // the mute works at once and everywhere: a cue in the air stops before the context is suspended under it
    if (muted) { sceneName = null; birds.stop(); }
    if (muted && ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    if (!muted && gestured) boot();
    paintSwitch();
  }

  /* ---------- the moments sound belongs to (task 05) ----------
     M.feel.scene(name) on entering a cutscene: one cue, and a second call for the same scene while it sounds is
     ignored, so a replay cannot layer birdsong. M.feel.scene(false) (or leaving, or muting, or the tab going away,
     or M.feel.silence() at teardown) is silence. Nothing here forces audio: with no gesture yet, or with sound off,
     every call is a no-op that leaves the preference alone. */
  let sceneName = null;
  function scene(name, o = {}) {
    if (!name) { sceneName = null; birds.stop(); return null; }
    const n = String(name);
    if (sceneName === n && birds.running()) return n;
    sceneName = n;
    birds.allowed = true;
    birds.cue(o);
    return n;
  }
  /** the cue on its own, for a moment that is not a whole scene; the handle stops it early */
  function cue(o = {}) {
    birds.allowed = true;
    birds.cue(o);
    return { stop: () => birds.stop() };
  }
  /** teardown, and anything else that must leave nothing sounding */
  function silence() { sceneName = null; birds.stop(); }
  const sceneOf = () => sceneName;
  // the tab goes away, or the page does: the cue goes with it rather than waiting to be heard on return
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) silence(); });
  window.addEventListener('pagehide', silence);
  function mountSwitch() {
    if (btn && btn.isConnected) return btn;
    btn = doc.getElementById('sound');
    if (!btn) {
      const mode = doc.getElementById('mode');
      if (!mode || !mode.parentNode) return null;
      btn = doc.createElement('button');
      btn.id = 'sound';
      mode.parentNode.insertBefore(btn, mode);
    }
    btn.type = 'button';
    btn.classList.add('feel-sound');
    btn.setAttribute('aria-label', 'Sound');
    if (!btn.dataset.feelBound) {
      btn.dataset.feelBound = '1';
      btn.addEventListener('click', () => { setMuted(!muted); if (!muted) play('tap', { x: panOf(btn) }); });
    }
    paintSwitch();
    return btn;
  }
  if (!mountSwitch() && doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mountSwitch, { once: true });

  /* ================= motion: collapsibles ================= */
  const want = new WeakMap();
  const running = new WeakMap();
  let dropN = 0;
  const isOpen = (body) => (want.has(body) ? want.get(body) : !body.hidden);

  function toggle(body, open, head, o = {}) {
    if (!body) return Promise.resolve(false);
    const next = typeof open === 'boolean' ? open : !isOpen(body);
    const was = isOpen(body);
    body.setAttribute('data-feel-drop', '');
    if (head) {
      head.setAttribute('aria-expanded', String(next));
      if (body.id) head.setAttribute('aria-controls', body.id);
    }
    const prev = running.get(body);
    if (next === was) {
      if (prev) return prev.done;
      body.hidden = !next;
      want.set(body, next);
      return Promise.resolve(next);
    }
    want.set(body, next);
    if (!o.silent) play(next ? 'open' : 'close', { x: panOf(head ?? body) });

    const fromH = body.hidden ? 0 : body.getBoundingClientRect().height;
    const fromO = body.hidden ? 0 : parseFloat(getComputedStyle(body).opacity) || 0;
    const saved = prev ? prev.saved : { overflow: body.style.overflow, boxSizing: body.style.boxSizing };
    if (prev) { running.delete(body); prev.anim.cancel(); }
    const restore = () => { body.style.overflow = saved.overflow; body.style.boxSizing = saved.boxSizing; };

    if (o.instant || reduced()) {
      restore();
      body.hidden = !next;
      return Promise.resolve(next);
    }

    body.hidden = false;
    body.style.overflow = 'hidden';
    body.style.boxSizing = 'border-box';
    const cs = getComputedStyle(body);
    const natH = body.getBoundingClientRect().height;
    const box = { paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginTop: cs.marginTop, marginBottom: cs.marginBottom };
    const k = natH ? Math.min(1, fromH / natH) : (next ? 0 : 1);
    const part = (share) => Object.fromEntries(Object.entries(box).map(([p, v]) => [p, `${(parseFloat(v) || 0) * share}px`]));
    const from = { height: `${fromH}px`, minHeight: '0px', opacity: fromO, ...part(k) };
    const to = next
      ? { height: `${natH}px`, minHeight: '0px', opacity: 1, ...part(1) }
      : { height: '0px', minHeight: '0px', opacity: 0, ...part(0) };
    const dur = Math.round(DUR * Math.max(0.35, next ? 1 - k : k));
    const anim = body.animate([from, to], { duration: dur, easing: EASE });
    const guard = setTimeout(() => { try { if (anim.playState === 'running') anim.finish(); } catch (e) {} }, dur + 160);
    const done = anim.finished.then(() => {
      clearTimeout(guard);
      if (running.get(body)?.anim !== anim) return isOpen(body);
      running.delete(body);
      restore();
      if (!next) body.hidden = true;
      return next;
    }, () => { clearTimeout(guard); return isOpen(body); });
    running.set(body, { anim, done, saved });
    return done;
  }

  const bound = new WeakMap();
  function bindDrop(head, body) {
    if (!head || !body) return null;
    if (!body.id) body.id = `feel-drop-${++dropN}`;
    head.setAttribute('aria-controls', body.id);
    const isButton = head.tagName === 'BUTTON';
    if (isButton && !head.getAttribute('type')) head.type = 'button';
    if (!isButton) {
      if (!head.hasAttribute('role')) head.setAttribute('role', 'button');
      if (!head.hasAttribute('tabindex')) head.tabIndex = 0;
    }
    toggle(body, false, head, { silent: true, instant: true });
    if (!bound.has(head)) {
      const flip = (e) => { const b = bound.get(head); if (!b) return; if (e && head.tagName !== 'BUTTON') e.preventDefault(); toggle(b, undefined, head); };
      head.addEventListener('click', flip);
      if (!isButton) head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    }
    bound.set(head, body);
    return {
      open: () => toggle(body, true, head),
      close: () => toggle(body, false, head),
      toggle: () => toggle(body, undefined, head),
      isOpen: () => isOpen(body),
    };
  }

  /* ================= motion: a question arrives ================= */
  const revealing = new WeakMap();
  function stopReveal(el) {
    const r = revealing.get(el);
    if (!r) return;
    revealing.delete(el);
    r.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
  }
  function reveal(el, o = {}) {
    if (!el) return Promise.resolve();
    if (!o.silent) play('next', { x: panOf(el), gain: o.gain });
    stopReveal(el);
    el.classList?.remove('pending');
    el.querySelectorAll?.('.pending').forEach((x) => x.classList.remove('pending'));
    const ease = 'cubic-bezier(.2, .7, .2, 1)';
    const anims = [reduced()
      ? el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: ease, fill: 'backwards' })
      : el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: ease, fill: 'backwards' })];
    const token = { anims };
    revealing.set(el, token);
    const guard = setTimeout(() => anims.forEach((a) => { try { if (a.playState === 'running') a.finish(); } catch (e) {} }), 400);
    return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
      clearTimeout(guard);
      if (revealing.get(el) === token) revealing.delete(el);
    });
  }

  /* ================= one grade for every number ================= */
  function grade(value, low, high, o = {}) {
    if (value === null || value === undefined || value === '' || high === null || high === undefined) return null;
    const v = Number(value), lo = low === null || low === undefined ? 0 : Number(low), hi = Number(high);
    if (![v, lo, hi].every(Number.isFinite)) return null;
    if (hi === lo) return v < lo ? 1 : v > hi ? 5 : 3;
    const t = o.log && lo > 0 && hi > 0 && v > 0
      ? (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))
      : (v - lo) / (hi - lo);
    return Math.max(1, Math.min(5, 1 + Math.floor(t * 5)));
  }
  function paintGrade(el, value, low, high, o) {
    const g = grade(value, low, high, o);
    if (!el) return g;
    if (g) el.setAttribute('data-grade', String(g));
    else el.removeAttribute('data-grade');
    return g;
  }
  function gradeColor(g) {
    const n = Math.max(1, Math.min(5, Math.round(Number(g) || 3)));
    return getComputedStyle(doc.body ?? doc.documentElement).getPropertyValue(`--grade-${n}`).trim();
  }

  /* ================= the v11 slim gauge (kept for callers that still use it) ================= */
  const nf1 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
  const fmtValue = (v, unit) => {
    if (!isNum(v)) return '';
    const n = nf1.format(Number(v));
    if (unit === '£') return `£${n}`;
    if (unit === '%') return `${n}%`;
    return unit ? `${n} ${unit}` : n;
  };
  const gauges = new WeakMap();
  function gauge(host, opts = {}) {
    if (!host) return { el: null, set() {} };
    const had = gauges.get(host);
    if (had && had.el.isConnected) { had.set(opts.value ?? null, opts); return had; }
    const cfg = { value: null, low: null, high: null, max: null, min: 0, unit: '', label: '', lowLabel: '', highLabel: '', format: null, ...opts };
    const g = doc.createElement('div');
    g.className = 'feel-gauge';
    g.setAttribute('role', 'meter');
    g.innerHTML = '<div class="fg-track"><div class="fg-fill feel-fill"></div><i class="fg-tick" data-at="low"></i><i class="fg-tick" data-at="high"></i><i class="fg-mark"></i></div><output class="fg-read"></output><div class="fg-scale" aria-hidden="true"><span data-at="low"></span><span data-at="high"></span></div>';
    host.appendChild(g);
    const $ = (s) => g.querySelector(s);
    const fill = $('.fg-fill'), mark = $('.fg-mark'), read = $('.fg-read');
    const tLo = $('.fg-tick[data-at="low"]'), tHi = $('.fg-tick[data-at="high"]');
    const sLo = $('.fg-scale [data-at="low"]'), sHi = $('.fg-scale [data-at="high"]');
    const num = (x) => (isNum(x) ? Number(x) : null);
    function paint() {
      const v = num(cfg.value), lo = num(cfg.low), hi = num(cfg.high), min = num(cfg.min) ?? 0;
      const top = num(cfg.max) ?? (Math.max(v ?? 0, hi !== null ? hi * 1.25 : 0) * 1.1 || 1);
      const pct = (x) => `${clamp(((x - min) / ((top - min) || 1)) * 100, 0, 100)}%`;
      const text = cfg.format ? (v === null ? '' : String(cfg.format(v))) : fmtValue(v, cfg.unit);
      g.toggleAttribute('data-empty', v === null);
      fill.style.width = v === null ? '0%' : pct(v);
      mark.style.left = v === null ? '0%' : pct(v);
      [[tLo, sLo, lo, cfg.lowLabel], [tHi, sHi, hi, cfg.highLabel]].forEach(([tick, lab, x, words]) => {
        tick.hidden = x === null;
        lab.hidden = x === null || !words;
        if (x !== null) { tick.style.left = pct(x); lab.style.left = pct(x); lab.textContent = words || ''; }
      });
      g.toggleAttribute('data-scale', Boolean((lo !== null && cfg.lowLabel) || (hi !== null && cfg.highLabel)));
      paintGrade(g, v, lo ?? min, hi ?? top);
      read.textContent = text;
      g.setAttribute('aria-label', cfg.label || 'Level');
      g.setAttribute('aria-valuemin', String(min));
      g.setAttribute('aria-valuemax', String(Math.round(top * 100) / 100));
      if (v === null) { g.removeAttribute('aria-valuenow'); g.setAttribute('aria-valuetext', 'Not set'); }
      else { g.setAttribute('aria-valuenow', String(clamp(v, min, top))); g.setAttribute('aria-valuetext', text); }
    }
    const api = {
      el: g,
      set(value, bounds) {
        cfg.value = value;
        if (bounds && typeof bounds === 'object') ['low', 'high', 'max', 'min', 'unit', 'label', 'lowLabel', 'highLabel', 'format'].forEach((k) => { if (k in bounds) cfg[k] = bounds[k]; });
        paint();
      },
    };
    paint();
    gauges.set(host, api);
    return api;
  }

  function possessive(name, what = 'tree') {
    const n = String(name ?? '').replace(/\s+/g, ' ').trim();
    return n ? `${n}’s ${what}` : `Your ${what}`;
  }

  M.feel = Object.assign(M.feel ?? {}, {
    play, panOf, key, birds, toggle, bindDrop, grade, paintGrade, gradeColor, gauge, reveal, possessive,
    muted: () => muted, setMuted, mountSwitch, reduced, EASE, measure,
    scene, cue, silence, sceneOf,
  });

  /* =====================================================================================
     M.ui: the instruments. Pure DOM, one value each, 44 px targets, commit on release.
     ===================================================================================== */
  const nf0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
  const nfd = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
  const ce = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const svgEl = (tag, attrs = {}) => { const e = doc.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v))); return e; };
  const fmtNum = (v, dp) => {
    if (!isNum(v)) return '';
    const n = Number(v);
    if (isNum(dp)) return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: dp });
    return Math.abs(n) < 10 && n !== Math.round(n) ? nfd.format(n) : nf0.format(n);
  };
  /** "20k", "1.5k", "2m" for tick labels */
  const shortNum = (v) => {
    if (!isNum(v)) return '';
    const n = Number(v), a = Math.abs(n);
    if (a >= 1e6) return `${fmtNum(n / 1e6, 1)}m`;
    if (a >= 1e3) return `${fmtNum(n / 1e3, 1)}k`;
    return fmtNum(n, 1);
  };
  /** a figure as it was given: 37.5 stays "37.5" and 1250000.75 stays "1,250,000.75". Up to four decimals are kept; a
      longer tail is the noise of a drag on a log scale and falls back to fmtNum's rule. `dp`, when passed, decides */
  const fmtKeep = (v, dp) => {
    if (!isNum(v)) return '';
    if (isNum(dp)) return fmtNum(v, dp);
    const n = Number(v), s = String(n);
    const d = s.includes('e') ? 0 : (s.split('.')[1] ?? '').length;
    return d > 0 && d <= 4 ? n.toLocaleString('en-GB', { maximumFractionDigits: d }) : fmtNum(n);
  };
  /** the unit always travels with the figure: £ and the other currency signs lead, % closes up, words follow a space */
  const leads = (unit) => typeof unit === 'string' && /^[£$€]$/.test(unit);
  const withUnit = (v, unit, dp) => {
    const s = fmtKeep(v, dp);
    if (!s) return '';
    if (leads(unit)) return `${unit}${s}`;
    if (unit === '%') return `${s}%`;
    return unit ? `${s} ${unit}` : s;
  };
  /** typed figures: "4,800", "£4.8k", "2m", "1.2bn", "25%", and "12." while the decimals are still to come */
  function parseNum(s) {
    const t = String(s ?? '').replace(/[£$€,\s]/g, '').replace(/%$/, '').toLowerCase();
    const m = /^(\d+\.?\d*|\.\d+)(k|m|bn|b)?$/.exec(t);
    if (!m) return null;
    let v = parseFloat(m[1]);
    if (m[2] === 'k') v *= 1e3;
    if (m[2] === 'm') v *= 1e6;
    if (m[2] === 'bn' || m[2] === 'b') v *= 1e9;
    return Number.isFinite(v) ? v : null;
  }
  const snapMoney = (v) => { const s = v < 2000 ? 50 : v < 20000 ? 100 : 1000; return Math.round(v / s) * s; };
  const snapCount = (v) => { const s = v < 20 ? 1 : v < 200 ? 5 : v < 2000 ? 10 : 100; return Math.round(v / s) * s; };
  /** while a thumb is dragged the figure follows the finger (three significant figures, one decimal under 10), so the
      rail reads as continuous; the snap to the rail's marks happens once on release (brief 4.4) */
  const fineOf = (v) => (!isNum(v) ? v : Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Number(Number(v).toPrecision(3)));
  // a step of 0.1 must give 12.6, never 12.600000000000001
  const snapFor = (opts) => (opts.snap === false ? (v) => v : typeof opts.snap === 'function' ? opts.snap : opts.unit === '£' ? snapMoney : isNum(opts.step) ? (v) => Number((Math.round(v / opts.step) * opts.step).toFixed(6)) : snapCount);
  /** value <-> 0..1 across a domain, log or linear */
  function scaleFns(lo, hi, log) {
    if (log && lo > 0 && hi > 0) {
      const a = Math.log(lo), b = Math.log(hi);
      return { toT: (v) => clamp((Math.log(Math.max(Number(v) || lo, 1e-9)) - a) / (b - a), 0, 1), fromT: (t) => Math.exp(a + clamp(t, 0, 1) * (b - a)) };
    }
    return { toT: (v) => clamp(((Number(v) || 0) - lo) / ((hi - lo) || 1), 0, 1), fromT: (t) => lo + clamp(t, 0, 1) * (hi - lo) };
  }
  /** pointer drag with capture. start(e, { grip }) may return false to refuse the press; move(ev); end(ev, { grip, moved })
      on release; cancel(ev) when the browser takes the pointer away (it falls back to end when a caller has none).
      A mouse starts at once, as it always has. A finger or a pen on a control with a `mode` starts only when the movement
      says it is meant:  'x' after 6 px that run mostly along the rail;  'ring' after a run mostly along the ring round
      o.centre(): 20 px from the ring itself, 6 px from its thumb. The controls carry touch-action: pan-y, so a touch that
      turns into a vertical scroll is taken by the browser (pointercancel, at about 15 px) before anything has started:
      nothing changes and nothing commits. Where along-the-ring is also up-and-down (a ring's sides) the 20 px lets the
      browser decide first; there the drag starts from the thumb, which carries touch-action: none (`o.grip`). A still
      touch that lifts is a tap: start and end run together at the lift. */
  function drag(target, h, o = {}) {
    target.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      // a press on a typed figure inside the control is a press to type, never the start of a drag
      if (e.target?.closest?.('input, textarea, [data-no-drag]')) return;
      const grip = !!(o.grip && e.target?.closest?.(o.grip));
      const coarse = !!e.pointerType && e.pointerType !== 'mouse';
      const waits = coarse && !!o.mode;
      const x0 = e.clientX, y0 = e.clientY;
      let live = false, moved = false;
      const begin = () => { if (h.start && h.start(e, { grip }) === false) return false; live = true; return true; };
      if (!waits && !begin()) return;
      e.preventDefault();
      try { target.setPointerCapture(e.pointerId); } catch (x) {}
      const meant = (ev) => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (o.mode === 'ring') {
          const k = o.centre?.() ?? null;
          const ux = k ? x0 - k.x : 0, uy = k ? y0 - k.y : 0, len = Math.hypot(ux, uy);
          if (!len) return false;
          const along = Math.abs(dy * ux - dx * uy) / len, across = Math.abs(dx * ux + dy * uy) / len;
          return along > (grip ? 6 : 20) && along > across;
        }
        return Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy);
      };
      let refused = false;
      const mv = (ev) => {
        if (refused) return;
        if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 3) moved = true;
        if (!live) { if (!meant(ev)) return; if (!begin()) { refused = true; return; } }
        dragLive = true;
        h.move?.(ev);
      };
      const up = (ev) => {
        dragLive = false;
        target.removeEventListener('pointermove', mv);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        if (refused) return;
        const lost = ev.type === 'pointercancel';
        if (!live) {
          // never started: a scroll the browser took, a wander that ran along nothing, or a tap (a still touch that lifts)
          if (lost || Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10 || !begin()) return;
        }
        if (lost && h.cancel) h.cancel(ev); else h.end?.(ev, { grip, moved });
      };
      target.addEventListener('pointermove', mv);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    });
  }
  /** the centre of a box on screen, for the ring rule above */
  const centreOfBox = (box) => () => { const b = box.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
  const tap = (el) => play('tap', { x: panOf(el) });
  /** "At most" -> "at most" for the middle of a readout; an acronym ("CV") keeps its capitals */
  const lowerFirst = (s) => { const t = String(s ?? ''); return /^[A-Z](?=[a-z ]|$)/.test(t) ? t[0].toLowerCase() + t.slice(1) : t; };
  const sameValue = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const gradeOpacity = (g) => (g ? 0.24 + 0.19 * (g - 1) : 0.24);
  /** a typed figure's placeholder is "0", whatever the scale: no figure is on screen before the visitor gives one.
      Words may stand in (the field's `placeholder`); a string that holds any digit from 1 to 9 is refused */
  const placeholderOf = (p) => (typeof p === 'string' && p.trim() && !/[1-9]/.test(p) ? p : '0');
  /* Not sure and N/A are not answers: a press on either (or on anything marked data-no-commit) holds back the
     blur commit of whatever is pending in the control, which reverts to its last committed value instead */
  const SKIP = '#unsure, #na, [data-no-commit]';
  let skipUntil = 0;
  doc.addEventListener('pointerdown', (e) => { skipUntil = e.target?.closest?.(SKIP) ? performance.now() + 800 : 0; }, true);
  // the press is over at its click (or 800 ms on, when it slid off the button): the next question commits as usual
  doc.addEventListener('click', () => { if (skipUntil) setTimeout(() => { skipUntil = 0; }, 0); }, true);
  const skipping = () => performance.now() < skipUntil;
  let tagSeq = 0;

  /** the shared shell: value, committed, input/commit/revert/enter, keys, set/get/focus/destroy */
  function make(name, host, opts, build) {
    const el = ce('div', `ui ui-${name}`);
    el.style.setProperty('--hue', opts.hue ? `var(${opts.hue})` : 'var(--tint, currentColor)');
    if (opts.id) el.dataset.q = opts.id;
    if (opts.label) el.setAttribute('aria-label', opts.label);
    /* the readout: one <output class="ui-readout"> per instrument, directly under the control, the same type everywhere.
       It prints opts.readout(value) when the caller passes one, else the instrument's own words for its kind (c.words),
       else, with no value yet, what the control measures (c.rest) in the ghost colour. Nothing to say: it is hidden.
       A build may place c.out itself; otherwise it lands last. The sliders already speak through aria-valuetext, so the
       readout is a silent region unless the build turns it on (the table, the socket). */
    const out = ce('output', 'ui-readout');
    out.hidden = true;
    out.setAttribute('aria-live', 'off');
    /* a suggested starting value (opts.suggested: true with opts.value): shown in the control with a "suggested" tag beside
       it and .suggested on the root, so it reads as a proposal, not the visitor's answer. It stays a suggestion until the
       visitor moves or types it (any change of their own), or the flow's Continue calls accept(). Not sure (clear) discards
       it. suggested() and accepted() say which; get() is the value as always, so every old reader still works */
    const tag = ce('span', 'ui-suggested', opts.suggestedWords ?? 'suggested');
    tag.id = `ui-sugg-${++tagSeq}`;
    tag.hidden = true;
    const c = {
      el, opts, name, out, tag,
      value: opts.value === undefined ? null : opts.value,
      committed: opts.value === undefined ? null : opts.value,
      suggested: !!opts.suggested && opts.value !== undefined && opts.value !== null,
      suggestedValue: opts.suggested ? opts.value : undefined,
      cleanup: [],
      words: null,
      rest: null,
      /** the visitor has made the value their own: the suggestion tag goes */
      touch() { c.suggested = false; },
      say() {
        const empty = typeof c.isEmpty === 'function' ? !!c.isEmpty() : el.classList.contains('empty');
        let text = '';
        if (typeof opts.readout === 'function') { try { const r = opts.readout(c.value); if (typeof r === 'string') text = r.trim(); } catch (e) { text = ''; } }
        if (!text) {
          try { const r = empty ? c.rest?.() : c.words?.(c.value); if (typeof r === 'string') text = r.trim(); } catch (e) { text = ''; }
        }
        // written only when the words change, so a live readout speaks once per change
        if (out.textContent !== text) out.textContent = text;
        out.hidden = !text;
        out.classList.toggle('ghost', empty && !!text);
        // a value that no longer matches the suggestion is the visitor's (typed paths write c.value and call say)
        if (c.suggested && !sameValue(c.value, c.suggestedValue)) c.suggested = false;
        tag.hidden = !c.suggested;
        el.classList.toggle('suggested', c.suggested);
        // beside a typed figure the tag describes that figure while it shows
        const inp = tag.parentNode?.classList?.contains('face') ? tag.parentNode.querySelector('input.figure') : null;
        if (inp) {
          const ids = (inp.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== tag.id);
          if (c.suggested) ids.push(tag.id);
          if (ids.length) inp.setAttribute('aria-describedby', ids.join(' ')); else inp.removeAttribute('aria-describedby');
        }
      },
      /** typed inputs: write every input from c.value whether or not it has focus. Called after an arrow step, an Escape
          and a cancelled drag, never from an input event, so it cannot fight the visitor's typing */
      sync() {},
      /** a drag remembers where it began; the returned function puts that value back (pointercancel) and commits nothing */
      hold() { const v = c.value; return () => { c.value = v; c.paint(); c.sync(); opts.onInput?.(v); }; },
      paint() {},
      input(v, silent) {
        c.value = v;
        if (!silent) c.touch();
        c.paint();
        if (!silent) opts.onInput?.(v);
      },
      commit(force) {
        if (c.clearing) return false;
        if (skipping()) { if (!sameValue(c.value, c.committed)) { c.value = c.committed; c.paint(); } return false; }
        if (!force && sameValue(c.value, c.committed)) return false;
        c.committed = c.value;
        c.touch();
        el.classList.add('committed');
        setTimeout(() => el.classList.remove('committed'), 260);
        opts.onCommit?.(c.value);
        return true;
      },
      revert() { c.value = c.committed; c.paint(); c.sync(); opts.onInput?.(c.value); },
      enter() {
        c.commit();
        el.dispatchEvent(new CustomEvent('mercer:enter', { bubbles: true, detail: { id: opts.id ?? null, value: c.value } }));
      },
      /** arrows step, Shift x10, Enter commits, Escape reverts; `horizontal` false leaves left/right to a text caret.
          A step or a revert made from inside a typed figure is written into it (c.sync), so the text never goes stale */
      keys(target, h) {
        target.addEventListener('keydown', (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey) return;
          // keys typed into a figure inside the control (the ring's centre) are the figure's own, bound separately
          if (e.target !== target && e.target?.matches?.('input, textarea')) return;
          const big = e.shiftKey ? 10 : 1;
          const horiz = h.horizontal !== false;
          if (e.key === 'ArrowUp' || (horiz && e.key === 'ArrowRight')) { if (h.step) { e.preventDefault(); h.step(big, e); c.sync(); } }
          else if (e.key === 'ArrowDown' || (horiz && e.key === 'ArrowLeft')) { if (h.step) { e.preventDefault(); h.step(-big, e); c.sync(); } }
          else if (e.key === 'Enter') { if (h.enter ? h.enter(e) !== false : true) { e.preventDefault(); c.enter(); } }
          else if (e.key === 'Escape') { e.preventDefault(); c.revert(); h.escape?.(e); }
          else h.other?.(e);
        });
      },
      onBlur(target) { target.addEventListener('blur', () => c.commit()); },
      fmt: (v) => withUnit(v, opts.unit, opts.decimals),
    };
    const built = build(c) || {};
    if (!out.parentNode) el.appendChild(out);
    // the "suggested" tag stands beside the first typed figure where there is one (so its going moves nothing), else on
    // its own line just above the readout
    if (!tag.parentNode) {
      const faces = el.querySelectorAll('.face');
      const f = faces.length === 1 && !faces[0].classList.contains('ring-face') ? faces[0] : null;
      if (f) f.insertBefore(tag, f.querySelector('.ui-note')); else el.insertBefore(tag, out);
    }
    // every paint ends by writing the readout; typed-input handlers, which skip paint, call c.say() themselves
    const paintBuilt = c.paint;
    c.paint = () => { paintBuilt(); c.say(); };
    host?.appendChild(el);
    c.paint();
    /** back to no value: nothing committed, nothing fired unless asked, typed text gone (Not sure, N/A). A suggestion
        that was never accepted goes with it */
    const clear = (silent = true) => {
      c.clearing = true;
      try {
        built.onSet?.(null);
        c.value = null;
        c.committed = null;
        c.suggested = false;
        const a = doc.activeElement;
        if (a && a !== doc.body && el.contains(a)) a.blur?.();
        c.value = null;
        built.onClear?.();
        el.classList.remove('committed', 'active');
        c.paint();
      } finally { c.clearing = false; }
      if (!silent) opts.onInput?.(null);
    };
    const set = (v, silent, asSuggestion) => {
      if (v === null || v === undefined) { clear(!!silent); return; }
      // onSet may translate what was passed (the dial takes { working } without a level); it sees the old value still in c.value
      const r = built.onSet ? built.onSet(v) : undefined;
      const nv = r === undefined ? v : r;
      c.value = nv === undefined ? null : nv;
      c.committed = c.value;
      c.suggested = !!asSuggestion && c.value !== null;
      c.suggestedValue = c.suggested ? c.value : undefined;
      c.paint();
      if (!silent) opts.onInput?.(c.value);
    };
    const api = {
      el,
      get: () => c.value,
      clear,
      /** a given value, the visitor's (or restored as accepted): any suggestion is over */
      set: (v, silent) => set(v, silent, false),
      /** a proposed value: shown with the tag until the visitor changes it or accept() is called */
      suggest: (v, silent = true) => set(v, silent, true),
      /** Continue accepting the suggestion as it stands: the tag goes, the value is committed as the visitor's and
          onCommit hears it once. Returns the value. With no suggestion pending it changes nothing */
      accept() {
        if (!c.suggested) return c.value;
        c.suggested = false;
        c.committed = c.value;
        c.paint();
        opts.onCommit?.(c.value);
        return c.value;
      },
      suggested: () => c.suggested,
      accepted: () => !c.suggested,
      focus: () => (built.focus ? built.focus() : el.querySelector('input,button,[tabindex]')?.focus()),
      destroy() { c.cleanup.forEach((f) => { try { f(); } catch (e) {} }); built.destroy?.(); el.remove(); },
    };
    // an instrument may add a method of its own (setNow on a rail, count() on the dot field); it can never shadow one
    // of the nine above, so every caller written against the shared shape still reads the same
    if (built.api) Object.keys(built.api).forEach((k) => { if (!(k in api)) api[k] = built.api[k]; });
    return api;
  }

  /* ---------- the display face: a typed figure with the unit beside it ---------- */
  let faceSeq = 0;
  function face(c, { unit = c.opts.unit, size, label, placeholder, index = 0, digitsOnly = false, minCh = 0, parse, format, invalidWords } = {}) {
    // `parse` and `format` let one instrument read a shape of its own through the same field (the dot field's range);
    // left out, the field is the figure it has always been
    const P = typeof parse === 'function' ? parse : parseNum;
    const F = typeof format === 'function' ? format : (v) => fmtKeep(v, c.opts.decimals);
    const wrap = ce('label', 'face');
    // the unit is on show from the start, empty or not: a currency sign leads the figure, every other unit follows it
    if (leads(unit)) wrap.appendChild(ce('span', 'unit', unit));
    const inp = ce('input', 'figure tabular');
    inp.type = 'text';
    inp.inputMode = 'decimal';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.setAttribute('aria-label', label ?? c.opts.label ?? 'Figure');
    if (size) inp.maxLength = size;
    wrap.appendChild(inp);
    if (unit && !leads(unit)) wrap.appendChild(ce('span', 'unit', unit));
    // the unit describes the field, so a screen reader hears it after the name ("Hours worked, hours a week")
    const unitEl = wrap.querySelector('.unit');
    if (unitEl) unitEl.id = `ui-unit-${++faceSeq}`;
    /* the validation line: beside the figure, polite, and it never touches what was typed. It is written when the field
       is left or Enter is pressed, and re-read on each keystroke only while it is on show, so it goes the moment the
       text is a figure again. Words: opts.invalidWords for text that is no figure; opts.validate(value, text, index)
       may return a sentence of its own for a figure the caller cannot take (it changes nothing else) */
    const note = ce('span', 'ui-note');
    note.id = `ui-note-${++faceSeq}`;
    note.hidden = true;
    note.setAttribute('role', 'status');
    wrap.appendChild(note);
    // "0" in the ghost colour until a figure is typed or dragged; never a number drawn from the scale
    const ph = placeholderOf(placeholder);
    inp.placeholder = ph;
    const size$ = () => {
      const n = inp.value.length;
      // minCh: the field is as wide as the digits it takes from the start, so its rule shows where a whole year goes
      const least = Math.max(1.6, ph.length + 0.4, minCh);
      inp.style.minWidth = `${least}ch`;
      inp.style.width = `${Math.max(least, n + 0.4)}ch`;
      // a long figure steps down a size rather than running out of the clearing (the unit stays beside it)
      if (n > 13) wrap.dataset.len = 'xl'; else if (n > 9) wrap.dataset.len = 'l'; else delete wrap.dataset.len;
    };
    const say = (msg) => {
      const text = typeof msg === 'string' ? msg.trim() : '';
      if (note.textContent !== text) note.textContent = text;
      note.hidden = !text;
      if (text) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
      // the "suggested" tag, when it stands beside this figure, describes it too
      const sugg = wrap.querySelector('.ui-suggested');
      const by = [unitEl?.id, sugg && !sugg.hidden ? sugg.id : '', text ? note.id : ''].filter(Boolean).join(' ');
      if (by) inp.setAttribute('aria-describedby', by); else inp.removeAttribute('aria-describedby');
    };
    const api = {
      el: wrap, inp, note,
      bad: false,
      /** an instrument's own rule for a figure it cannot take: (value) -> sentence or '' */
      extra: null,
      size: () => size$(),
      /** writes the figure. Text that is no figure stays as typed (api.bad) until it is edited, set, cleared or, with
          `force`, reverted by Escape. A line on show is read again against what is now in the field */
      show(v, force) {
        const known = v !== null && v !== undefined && F(v) !== '';
        if (!known && api.bad && !force) return;
        api.bad = false;
        inp.value = F(v);
        size$();
        if (!note.hidden) api.check();
      },
      read: () => P(inp.value),
      say,
      check(extra) {
        const raw = inp.value.trim(), v = P(raw);
        api.bad = !!raw && (v === null || v === undefined);
        let msg = api.bad ? (c.opts.invalidWords ?? invalidWords ?? (digitsOnly ? 'Digits only' : 'Figures only, such as 4,800 or 4.8k')) : '';
        if (!msg) { const x = typeof extra === 'string' ? extra : api.extra?.(v); if (typeof x === 'string') msg = x; }
        if (!msg && typeof c.opts.validate === 'function') { try { const r = c.opts.validate(v, raw, index); if (typeof r === 'string') msg = r; } catch (e) { msg = ''; } }
        say(msg);
        return !msg;
      },
      reset() { api.bad = false; say(''); inp.value = ''; size$(); },
    };
    inp.addEventListener('input', () => { size$(); if (!note.hidden) api.check(); });
    inp.addEventListener('blur', () => api.check());
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') api.check(); });
    size$();
    say('');
    return api;
  }
  /** a rail: 2 px track, a band from 0 (or between two handles), ticks, and handles */
  function rail(c, { ticks = [], handles = 1, band = true, cls = '' } = {}) {
    const box = ce('div', `rail-box ${cls}`);
    const r = ce('div', 'rail');
    box.appendChild(r);
    const bandEl = band ? r.appendChild(ce('i', 'band')) : null;
    const tickEls = ticks.map((t) => {
      const i = ce('i', 'tick');
      i.style.left = `${t.t * 100}%`;
      r.appendChild(i);
      if (t.label) {
        const l = ce('span', 'tick-lab small', t.label);
        l.style.left = `${t.t * 100}%`;
        // a label at either end of the rail is aligned inward, so it never hangs past the rail into the clipped edge
        if (t.t >= 0.98) l.classList.add('at-end'); else if (t.t <= 0.02) l.classList.add('at-start');
        box.appendChild(l);
      }
      return i;
    });
    const hs = [];
    for (let i = 0; i < handles; i++) {
      const h = ce('button', 'handle');
      h.type = 'button';
      h.setAttribute('role', 'slider');
      r.appendChild(h);
      hs.push(h);
    }
    /* the baseline and the target share one rail: a "Now" marker stands on it beside the handle, with its figure and
       its unit written out ("Now £4,800"), so the two are read together and the target control is still the handle.
       The typed figure above the rail is the alternative, as it is on every rail. setNow(t, words) moves or hides it */
    const nowMark = ce('i', 'now-mark');
    const nowLab = ce('span', 'now-lab small');
    nowMark.hidden = true;
    nowLab.hidden = true;
    r.appendChild(nowMark);
    box.appendChild(nowLab);
    const setNow = (t, words) => {
      const has = isNum(t) && typeof words === 'string' && words.trim();
      nowMark.hidden = !has;
      nowLab.hidden = !has;
      if (!has) return;
      const pct = `${clamp(t, 0, 1) * 100}%`;
      nowMark.style.left = pct;
      nowLab.style.left = pct;
      nowLab.textContent = words.trim();
      nowLab.classList.toggle('at-end', t >= 0.9);
      nowLab.classList.toggle('at-start', t <= 0.1);
    };
    const tOf = (e) => { const b = r.getBoundingClientRect(); return b.width ? clamp((e.clientX - b.left) / b.width, 0, 1) : 0; };
    return { box, r, band: bandEl, ticks: tickEls, handles: hs, tOf, setNow, nowMark, nowLab };
  }

  /* ---------- 1. figure slider: typed figure over a 320 x 2 rail on the schema's log scale ---------- */
  function slider(host, opts = {}) {
    return make('slider', host, opts, (c) => {
      const [lo, hi] = opts.scale ?? [1, 1000];
      const log = opts.log !== false && lo > 0;
      const [dLo, dHi] = opts.range ?? (log ? [lo / 4, hi * 4] : [0, hi * 1.5]);
      const S = scaleFns(dLo, dHi, log);
      const snap = snapFor(opts);
      const f = face(c);
      const R = rail(c, { ticks: [{ t: S.toT(lo), label: leads(opts.unit) ? `${opts.unit}${shortNum(lo)}` : shortNum(lo) }, { t: S.toT(hi), label: leads(opts.unit) ? `${opts.unit}${shortNum(hi)}` : shortNum(hi) }] });
      const h = R.handles[0];
      h.setAttribute('aria-label', opts.label ?? 'Figure');
      c.el.append(f.el, R.box);
      /* opts.now: today's figure marked on the same rail as the target, always with its unit. opts.nowWords reworks
         the leader ("Now", "Last month"); setNow(v) moves it when the baseline is confirmed later */
      let nowVal = null;
      const nowLead = typeof opts.nowWords === 'string' ? opts.nowWords : 'Now';
      const setNow = (v) => {
        nowVal = isNum(v) ? Number(v) : null;
        R.setNow(nowVal === null ? null : S.toT(nowVal), nowVal === null ? '' : `${nowLead} ${withUnit(nowVal, opts.unit, opts.decimals)}`);
        // the handle says what it is measured against, so the marker is not sight-only
        if (nowVal === null) h.removeAttribute('aria-describedby');
        h.setAttribute('aria-label', nowVal === null ? (opts.label ?? 'Figure') : `${opts.label ?? 'Figure'}, ${lowerFirst(nowLead)} ${withUnit(nowVal, opts.unit, opts.decimals)}`);
      };
      setNow(opts.now);
      const step = (n) => {
        const v = isNum(c.value) ? Number(c.value) : dLo;
        const nv = log ? v * Math.exp(0.01 * n * Math.log(dHi / dLo)) : v + 0.01 * n * (dHi - dLo);
        // a typed figure beyond the rail is walked back from where it stands, never thrown to the rail's end
        c.input(Math.max(0, snap(clamp(nv, Math.min(dLo, v), Math.max(dHi, v)))));
      };
      let dragging = false, undo = null;
      drag(R.box, {
        start() { undo = c.hold(); dragging = true; c.el.classList.add('active'); },
        // continuous while in hand; the snap to a mark waits for the release
        move(e) { c.input(Math.max(0, fineOf(S.fromT(R.tOf(e))))); },
        // a press on the handle that never moved leaves the figure where it was
        end(e, i) { if (!i?.grip || i.moved) c.input(Math.max(0, snap(S.fromT(R.tOf(e))))); dragging = false; c.el.classList.remove('active'); c.commit(); h.focus({ preventScroll: true }); },
        cancel() { undo?.(); dragging = false; c.el.classList.remove('active'); },
      }, { mode: 'x', grip: '.handle' });
      c.sync = () => f.show(c.value, true);
      c.keys(h, { step });
      c.keys(f.inp, { step, horizontal: false });
      f.inp.addEventListener('input', () => { const v = f.read(); c.value = v; paintRail(); c.say(); opts.onInput?.(v); });
      f.inp.addEventListener('focus', () => c.el.classList.add('active'));
      f.inp.addEventListener('blur', () => { c.el.classList.remove('active'); if (isNum(c.value)) c.value = Math.max(0, Number(c.value)); c.paint(); c.commit(); });
      h.addEventListener('focus', () => c.el.classList.add('active'));
      h.addEventListener('blur', () => { c.el.classList.remove('active'); c.commit(); });
      function paintRail() {
        const has = isNum(c.value);
        const t = has ? S.toT(c.value) : 0;
        h.style.left = `${t * 100}%`;
        R.band.style.width = `${t * 100}%`;
        R.band.style.opacity = String(gradeOpacity(grade(c.value, lo, hi, { log })));
        c.el.classList.toggle('empty', !has);
        h.setAttribute('aria-valuemin', String(dLo));
        h.setAttribute('aria-valuemax', String(dHi));
        if (has) { h.setAttribute('aria-valuenow', String(c.value)); h.setAttribute('aria-valuetext', c.fmt(c.value)); } else { h.removeAttribute('aria-valuenow'); h.setAttribute('aria-valuetext', 'Not set'); }
      }
      c.paint = () => { if (doc.activeElement !== f.inp || dragging) f.show(c.value); paintRail(); };
      return { focus: () => f.inp.focus(), onClear() { f.reset(); }, api: { setNow, now: () => nowVal } };
    });
  }

  /* ---------- 2. pair slider: one rail, two ring handles that cannot cross, a tinted band between ---------- */
  function pair(host, opts = {}) {
    return make('pair', host, opts, (c) => {
      const [lo, hi] = opts.scale ?? [1, 1000];
      const log = opts.log !== false && lo > 0;
      const [dLo, dHi] = opts.range ?? (log ? [lo / 4, hi * 4] : [0, hi * 1.5]);
      const S = scaleFns(dLo, dHi, log);
      const snap = snapFor(opts);
      const desc = opts.order === 'desc';           // second <= first (enquiries: all, then quoted)
      const labels = opts.labels ?? ['', ''];
      const faces = ce('div', 'faces');
      const fA = face(c, { label: labels[0] || opts.label });
      const fB = face(c, { label: labels[1] || opts.label, index: 1 });
      const capA = ce('span', 'cap small', labels[0]), capB = ce('span', 'cap small', labels[1]);
      const colA = ce('div', 'face-col'), colB = ce('div', 'face-col');
      colA.append(fA.el, capA); colB.append(fB.el, capB);
      faces.append(colA, colB);
      const R = rail(c, { handles: 2, ticks: [{ t: S.toT(lo) }, { t: S.toT(hi) }] });
      R.handles.forEach((h, i) => { h.classList.add('ring'); h.setAttribute('aria-label', labels[i] || opts.label || 'Handle'); });
      const bandText = ce('span', 'band-text small');
      R.box.appendChild(bandText);
      c.el.append(faces, R.box);
      const cur = () => (Array.isArray(c.value) ? [...c.value] : [c.value ?? null, null]);
      let secondShown = isNum(cur()[1]);
      const bound = (v, i) => {
        const [a, b] = cur();
        if (i === 0 && isNum(b)) return desc ? Math.max(v, b) : Math.min(v, b);
        if (i === 1 && isNum(a)) return desc ? Math.min(v, a) : Math.max(v, a);
        return v;
      };
      // `fine`: the figure follows the finger while in hand; the snap to a mark happens on release
      const setAt = (i, v, fine) => { const arr = cur(); arr[i] = Math.max(0, (fine ? fineOf : snap)(bound(v, i))); c.input(arr); };
      let active = 0, dragging = false, undo = null;
      drag(R.box, {
        start(e) {
          const t = R.tOf(e), [a, b] = cur();
          active = secondShown && isNum(b) && Math.abs(S.toT(b) - t) < Math.abs(S.toT(a ?? dLo) - t) ? 1 : 0;
          if (secondShown && !isNum(b) && isNum(a)) active = 1;
          undo = c.hold();
          dragging = true;
          c.el.classList.add('active');
        },
        move(e) { setAt(active, S.fromT(R.tOf(e)), true); },
        end(e, i) { if (!i?.grip || i.moved) setAt(active, S.fromT(R.tOf(e))); dragging = false; c.el.classList.remove('active'); commitPair(); R.handles[active].focus({ preventScroll: true }); },
        cancel() { undo?.(); dragging = false; c.el.classList.remove('active'); },
      }, { mode: 'x', grip: '.handle' });
      c.sync = () => { const [a, b] = cur(); fA.show(a, true); fB.show(b, true); };
      // the readout says both figures in words; before any figure, what the two handles are
      const figOf = (v) => (leads(opts.unit) ? `${opts.unit}${fmtKeep(v, opts.decimals)}` : fmtKeep(v, opts.decimals));
      const sayOne = (v, lab) => (lab ? `${figOf(v)} ${lowerFirst(lab)}` : figOf(v));
      c.words = () => { const [a, b] = cur(); return !isNum(a) ? '' : isNum(b) ? `${sayOne(a, labels[0])}, ${sayOne(b, labels[1])}` : sayOne(a, labels[0]); };
      c.rest = () => (labels[0] && labels[1] ? `${labels[0]}, then ${lowerFirst(labels[1])}` : '');
      function commitPair() {
        const [a] = cur();
        if (c.commit() && isNum(a) && !secondShown) { secondShown = true; c.paint(); }
      }
      const stepFor = (i) => (n) => {
        const v = isNum(cur()[i]) ? Number(cur()[i]) : (isNum(cur()[0]) ? Number(cur()[0]) : dLo);
        setAt(i, log ? v * Math.exp(0.01 * n * Math.log(dHi / dLo)) : v + 0.01 * n * (dHi - dLo));
      };
      [[R.handles[0], fA, 0], [R.handles[1], fB, 1]].forEach(([h, f, i]) => {
        c.keys(h, { step: stepFor(i), enter() { commitPair(); return true; } });
        c.keys(f.inp, { step: stepFor(i), horizontal: false, enter() { commitPair(); return true; } });
        f.inp.addEventListener('input', () => { const arr = cur(); arr[i] = f.read(); c.value = arr; paintRail(); c.say(); opts.onInput?.(arr); });
        f.inp.addEventListener('blur', () => { const arr = cur(); if (isNum(arr[i])) arr[i] = Math.max(0, bound(Number(arr[i]), i)); c.value = arr; c.paint(); commitPair(); });
        h.addEventListener('blur', () => commitPair());
        [h, f.inp].forEach((x) => { x.addEventListener('focus', () => { active = i; c.el.classList.add('active'); }); x.addEventListener('blur', () => c.el.classList.remove('active')); });
      });
      function paintRail() {
        const [a, b] = cur();
        const tA = isNum(a) ? S.toT(a) : 0, tB = isNum(b) ? S.toT(b) : tA;
        R.handles[0].style.left = `${tA * 100}%`;
        R.handles[1].style.left = `${tB * 100}%`;
        R.handles[1].hidden = !secondShown;
        colB.hidden = !secondShown;
        const l = Math.min(tA, tB), w = Math.abs(tB - tA);
        R.band.style.left = `${l * 100}%`;
        R.band.style.width = `${(secondShown && isNum(b) ? w : 0) * 100}%`;
        const words = opts.band && isNum(a) && isNum(b) ? opts.band(a, b) : '';
        bandText.textContent = words || '';
        bandText.hidden = !words;
        bandText.style.left = `${((l + w / 2) * 100)}%`;
        c.el.classList.toggle('empty', !isNum(a));
        [[R.handles[0], a], [R.handles[1], b]].forEach(([h, v]) => { if (isNum(v)) { h.setAttribute('aria-valuenow', String(v)); h.setAttribute('aria-valuetext', c.fmt(v)); } else h.removeAttribute('aria-valuenow'); });
      }
      c.paint = () => {
        const [a, b] = cur();
        if (isNum(b)) secondShown = true;
        if (doc.activeElement !== fA.inp || dragging) fA.show(a);
        if (doc.activeElement !== fB.inp || dragging) fB.show(b);
        paintRail();
      };
      return {
        focus: () => fA.inp.focus(),
        // set([a, null]) keeps the second figure on show: the first is already given
        onSet(v) { secondShown = Array.isArray(v) && (isNum(v[1]) || isNum(v[0])); },
        onClear() { fA.reset(); fB.reset(); },
      };
    });
  }

  /* ---------- 3. fee slider: min and max rings, a pushed average marker, three typed figures above, log £100..£20,000 ----------
     Rebuild 1: the three figures are typed, in the pair's language (a figure with its caption in a .face-col, three
     across), instead of spans floating over the thumbs, which printed over one another whenever the thumbs were close
     (the start positions included) and could not be typed into. A typed figure may sit between the marks and beyond
     the rail (the thumb waits at the rail's end); it is never snapped, and the true figure is what commits. The order
     min <= typical <= max holds by pushing the other figures, never by changing the one typed. A drag is continuous
     and snaps to a mark on release. Nothing is written before the visitor gives a figure (the thumbs rest at `start`). */
  function fee(host, opts = {}) {
    return make('fee', host, opts, (c) => {
      const [dLo, dHi] = opts.range ?? [100, 20000];
      const S = scaleFns(dLo, dHi, true);
      const snap = opts.snap === false ? (v) => v : snapMoney;
      const unit = opts.unit ?? '£';
      const start = { min: opts.start?.min ?? 500, max: opts.start?.max ?? 2000, avg: opts.start?.avg ?? 1000 };
      const words = opts.words ?? ['Lowest', 'Typical', 'Highest'];
      const KEYS = ['min', 'avg', 'max'];
      const figs = ce('div', 'faces fee-faces');
      const F = {};
      KEYS.forEach((k, i) => {
        const f = face(c, { unit, label: words[i], index: i });
        const col = ce('div', `face-col fee-col ${k}`);
        col.append(f.el, ce('span', 'cap small', words[i]));
        figs.appendChild(col);
        F[k] = f;
      });
      const tickOf = (x) => (leads(unit) ? `${unit}${shortNum(x)}` : unit === '%' ? `${shortNum(x)}%` : shortNum(x));
      const R = rail(c, { handles: 3, ticks: [{ t: 0, label: tickOf(dLo) }, { t: 1, label: tickOf(dHi) }] });
      const [hMin, hAvg, hMax] = R.handles;
      const H = { min: hMin, avg: hAvg, max: hMax };
      hMin.classList.add('ring'); hMax.classList.add('ring'); hAvg.classList.add('avg');
      // DOM order min, avg, max so Tab cycles that way
      R.r.append(hMin, hAvg, hMax);
      KEYS.forEach((k, i) => H[k].setAttribute('aria-label', words[i]));
      c.el.append(figs, R.box);
      const cur = () => (c.value && typeof c.value === 'object' ? { ...c.value } : null);
      /** a figure from the rail: clamped to the rail, ordered by stopping at its neighbour (as the thumbs always did).
          `fine` while in hand, snapped on release */
      const setPart = (k, raw, fine) => {
        const v = cur() ?? { ...start };
        const x = (fine ? fineOf : snap)(clamp(raw, dLo, dHi));
        if (k === 'min') { v.min = Math.min(x, v.max); if (v.avg < v.min) v.avg = v.min; }
        else if (k === 'max') { v.max = Math.max(x, v.min); if (v.avg > v.max) v.avg = v.max; }
        else v.avg = clamp(x, v.min, v.max);
        c.input(v);
      };
      /** a typed figure: kept exactly (two decimals at most, never below 0, beyond the rail allowed); the others are
          pushed so the order holds. Called when the field is left or Enter pressed */
      const setTyped = (k, raw) => {
        const v = cur() ?? { ...start };
        const x = Math.max(0, Math.round(Number(raw) * 100) / 100);
        v[k] = x;
        if (k === 'min') { if (v.max < x) v.max = x; if (v.avg < x) v.avg = x; }
        else if (k === 'max') { if (v.min > x) v.min = x; if (v.avg > x) v.avg = x; }
        else { if (v.min > x) v.min = x; if (v.max < x) v.max = x; }
        c.value = v;
        c.touch();
      };
      let active = 'avg';
      const keyOf = (t) => {
        const v = cur() ?? start;
        const d = { min: Math.abs(S.toT(v.min) - t), avg: Math.abs(S.toT(v.avg) - t), max: Math.abs(S.toT(v.max) - t) };
        return Object.keys(d).sort((a, b) => d[a] - d[b])[0];
      };
      let undo = null;
      drag(R.box, {
        start(e) { undo = c.hold(); active = e.target.classList.contains('handle') ? (e.target === hMin ? 'min' : e.target === hMax ? 'max' : 'avg') : keyOf(R.tOf(e)); c.el.classList.add('active'); },
        move(e) { setPart(active, S.fromT(R.tOf(e)), true); },
        end(e, i) { c.el.classList.remove('active'); if (!i?.grip || i.moved) setPart(active, S.fromT(R.tOf(e))); c.commit(); H[active].focus({ preventScroll: true }); },
        cancel() { undo?.(); c.el.classList.remove('active'); },
      }, { mode: 'x', grip: '.handle' });
      // the readout: the three figures in one line once one is given; before that, what the three are
      c.words = () => { const v = cur(); return v ? `${withUnit(v.min, unit)} to ${withUnit(v.max, unit)}, ${lowerFirst(words[1])} ${withUnit(v.avg, unit)}` : ''; };
      c.rest = () => `${words[0]}, ${lowerFirst(words[1])}, ${lowerFirst(words[2])}`;
      c.sync = () => { const v = cur(); KEYS.forEach((k) => F[k].show(v ? v[k] : null, true)); };
      KEYS.forEach((k) => {
        const h = H[k], f = F[k];
        const step = (n) => { const v = cur() ?? start; const from = v[k] * Math.exp(0.01 * n * Math.log(dHi / dLo)); setPart(k, clamp(from, Math.min(dLo, v[k]), Math.max(dHi, v[k]))); };
        c.keys(h, { step });
        c.keys(f.inp, { step, horizontal: false });
        h.addEventListener('focus', () => { active = k; c.el.classList.add('active'); });
        h.addEventListener('blur', () => { c.el.classList.remove('active'); c.commit(); });
        // typing: the figure is the value on every keystroke (the thumb follows), unordered until the field is left
        f.inp.addEventListener('input', () => { const v = cur() ?? { ...start }; v[k] = f.read(); c.value = v; paintRail(); c.say(); opts.onInput?.(v); });
        f.inp.addEventListener('focus', () => { active = k; c.el.classList.add('active'); });
        f.inp.addEventListener('blur', () => {
          c.el.classList.remove('active');
          const v = cur();
          if (v && isNum(v[k])) setTyped(k, v[k]);
          // text that is no figure stays in the field with its line (face); the value keeps the last figure this part had
          else if (v) { v[k] = (c.committed && isNum(c.committed[k])) ? c.committed[k] : start[k]; c.value = v; }
          c.paint();
          c.commit();
        });
      });
      function paintRail() {
        const v = cur(), s = v ?? start;
        c.el.classList.toggle('empty', !v);
        // the thumbs rest at `start` so each can be grabbed; a figure beyond the rail parks its thumb at the end
        const at = (k) => S.toT(isNum(s[k]) ? s[k] : start[k]);
        const tMin = at('min'), tAvg = at('avg'), tMax = at('max');
        hMin.style.left = `${tMin * 100}%`; hAvg.style.left = `${tAvg * 100}%`; hMax.style.left = `${tMax * 100}%`;
        R.band.style.left = `${Math.min(tMin, tMax) * 100}%`; R.band.style.width = `${Math.abs(tMax - tMin) * 100}%`;
        KEYS.forEach((k) => {
          const h = H[k], x = s[k];
          h.setAttribute('aria-valuemin', String(dLo)); h.setAttribute('aria-valuemax', String(dHi));
          if (v && isNum(x)) { h.setAttribute('aria-valuenow', String(x)); h.setAttribute('aria-valuetext', withUnit(x, unit)); }
          else { h.removeAttribute('aria-valuenow'); h.removeAttribute('aria-valuetext'); }
        });
      }
      c.paint = () => {
        const v = cur();
        // a field holding text that is no figure keeps that text (and its line) until it is edited or reverted
        KEYS.forEach((k) => { if (doc.activeElement !== F[k].inp) F[k].show(F[k].bad ? null : (v ? v[k] : null)); });
        paintRail();
      };
      return { focus: () => F.min.inp.focus(), onClear() { KEYS.forEach((k) => F[k].reset()); } };
    });
  }

  /* ---------- 4. stones and cards: one choice instrument in two looks ----------
     stones: glass pills in one row, at most six, the rest folded under "more" (as before).
     cards (rebuild 1, C11 and C12): whole-surface choice cards in a grid: a label, an optional second line (sub), a mark
     in the corner. The selected state changes the whole surface and is carried by aria-checked, aria-pressed and the
     mark. Two options: two substantial cards for an either/or. One of several: radio cards, no auto-advance (Continue
     confirms; Enter on a focused card is the keyboard's Continue, as on every instrument). multi: checkbox cards with
     "Choose one or more" above them (opts.lead rewords it, lead: false leaves it out; stones say it too) and
     opts.exclusive values (None, Not sure) that stand alone: picking one clears the rest, picking any other clears it.
     The grid (opts.columns, else 2 for two or four options, 3 otherwise) centres a short last row: five cards are a row
     of three over a centred row of two, never one orphan under four. At 480 and under the cards stack in one readable
     column. Both looks share the picking, the roving, the exclusive rule and the value shape (v, or v[] with multi). */
  /** Up and Down beside a row: the tap alternative to a drag or a key, shared by the sorting zones and the ranked list.
      At either end the button is aria-disabled and does nothing, so focus never drops out of the control */
  function moveButtons(nameOf, move, { words = ['Move up', 'Move down'], cls = 'ui-moves' } = {}) {
    const el = ce('span', cls);
    const mk = (dir, word, glyph) => {
      const m = ce('button', `sort-move ${dir}`);
      m.type = 'button';
      m.innerHTML = glyph;
      m.setAttribute('aria-label', `${word}: ${nameOf()}`);
      m.addEventListener('click', () => {
        if (m.getAttribute('aria-disabled') === 'true') return;
        if (move(dir === 'up' ? -1 : 1)) tap(m);
        m.focus({ preventScroll: true });
      });
      return m;
    };
    const up = mk('up', words[0], CHEVRON_UP), down = mk('down', words[1], CHEVRON_DOWN);
    el.append(up, down);
    return {
      el, up, down,
      /** which of the two is spent: at the top nothing goes up, at the bottom nothing goes down */
      ends(atTop, atEnd) { up.setAttribute('aria-disabled', String(!!atTop)); down.setAttribute('aria-disabled', String(!!atEnd)); },
      name(words2) { up.setAttribute('aria-label', `${words[0]}: ${words2}`); down.setAttribute('aria-label', `${words[1]}: ${words2}`); },
    };
  }
  const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEVRON_UP = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 12.5l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEVRON_DOWN = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CROSS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  function choice(name, host, opts) {
    return make(name, host, opts, (c) => {
      const cards = name === 'cards';
      const options = (opts.options ?? []).map((o) => (Array.isArray(o) ? { v: o[0], label: o[1], sub: o[2] } : o));
      const multi = !!opts.multi;
      const exclusive = (opts.exclusive ?? []).map(String);
      const isExcl = (v) => exclusive.includes(String(v));
      const foldAt = cards ? Infinity : (opts.foldAt ?? 6);
      const leadWords = opts.lead === false ? '' : typeof opts.lead === 'string' ? opts.lead : multi ? 'Choose one or more' : '';
      const lead = leadWords ? ce('p', 'ui-lead small', leadWords) : null;
      if (lead) { lead.id = `ui-lead-${++tagSeq}`; c.el.appendChild(lead); }
      const row = ce('div', cards ? 'card-grid' : 'stone-row');
      row.setAttribute('role', multi ? 'group' : 'radiogroup');
      if (opts.label) row.setAttribute('aria-label', opts.label);
      if (lead) row.setAttribute('aria-describedby', lead.id);
      const btns = options.map((o, i) => {
        const b = ce('button', cards ? 'card' : 'stone');
        b.type = 'button';
        if (cards) {
          const body = ce('span', 'card-body');
          body.appendChild(ce('span', 'card-label', o.label));
          if (o.sub) body.appendChild(ce('span', 'card-sub small', o.sub));
          const mark = ce('i', 'card-mark');
          mark.setAttribute('aria-hidden', 'true');
          mark.innerHTML = TICK;
          b.append(body, mark);
        } else b.textContent = o.label;
        b.dataset.v = String(o.v);
        if (isExcl(o.v)) b.classList.add('exclusive');
        b.setAttribute('role', multi ? 'checkbox' : 'radio');
        if (i >= foldAt) b.classList.add('folded');
        row.appendChild(b);
        return b;
      });
      if (cards) {
        const n = options.length;
        const cols = clamp(Number(opts.columns) || (n <= 2 ? Math.max(n, 1) : n === 4 ? 2 : 3), 1, 4);
        row.style.setProperty('--tracks', String(cols * 2));
        c.el.dataset.cols = String(cols);
        if (n === 2 && !multi) c.el.classList.add('either');
        // every card spans two of 2 x cols tracks, so a short last row can start a track in: centred, never an orphan
        const r = n % cols;
        if (r && n > cols) for (let j = 0; j < r; j++) btns[n - r + j].style.setProperty('--col', String(1 + (cols - r) + 2 * j));
      }
      let more = null, unfolded = options.length <= foldAt;
      if (!unfolded) {
        more = ce('button', 'stone more', opts.moreWords ?? 'more');
        more.type = 'button';
        more.addEventListener('click', () => {
          const held = doc.activeElement === more;
          unfolded = true; more.hidden = true; btns.forEach((b) => b.classList.remove('folded')); tap(more);
          // "more" is gone: focus goes on to the first stone it opened, never to the page
          if (held) btns[foldAt]?.focus({ preventScroll: true });
        });
        more.addEventListener('keydown', (e) => rove(e, more));
        row.appendChild(more);
      }
      /** arrows rove the visible stones ("more" included). Up and Down wrap. Left at the first stone and Right at the last
          are left alone, unprevented, so they bubble to the page's Back and Next */
      const rove = (e, from) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return false;
        const vis = [...btns.filter((x) => !x.classList.contains('folded')), ...(more && !more.hidden ? [more] : [])];
        const j = vis.indexOf(from);
        const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
        const flat = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
        if (j < 0 || (flat && (fwd ? j === vis.length - 1 : j === 0))) return false;
        e.preventDefault();
        vis[(j + (fwd ? 1 : -1) + vis.length) % vis.length].focus();
        return true;
      };
      c.el.appendChild(row);
      const isOn = (v) => (multi ? Array.isArray(c.value) && c.value.some((x) => sameValue(x, v)) : sameValue(c.value, v));
      const pick = (o, b) => {
        if (multi) {
          let arr = Array.isArray(c.value) ? [...c.value] : [];
          const ix = arr.findIndex((x) => sameValue(x, o.v));
          if (ix >= 0) arr.splice(ix, 1);
          // an exclusive option (None, Not sure) stands alone; any other option puts it away
          else if (isExcl(o.v)) arr = [o.v];
          else { arr = arr.filter((x) => !isExcl(x)); if (isNum(opts.max) && arr.length >= Number(opts.max)) return; arr.push(o.v); }
          c.input(arr);
        } else c.input(isOn(o.v) && opts.clearable ? null : o.v);
        tap(b);
        c.commit();
      };
      btns.forEach((b, i) => {
        b.addEventListener('click', () => pick(options[i], b));
        b.addEventListener('keydown', (e) => {
          if (e.key === ' ') { e.preventDefault(); pick(options[i], b); }
          else if (e.key === 'Enter') { e.preventDefault(); if (!isOn(options[i].v)) pick(options[i], b); c.enter(); }
          else if (e.key === 'Escape') { e.preventDefault(); c.revert(); }
          else rove(e, b);
        });
      });
      c.paint = () => {
        let first = true;
        btns.forEach((b, i) => {
          const on = isOn(options[i].v);
          b.setAttribute('aria-checked', String(on));
          b.setAttribute('aria-pressed', String(on));
          if (on && b.classList.contains('folded')) { unfolded = true; if (more) more.hidden = true; btns.forEach((x) => x.classList.remove('folded')); }
          b.tabIndex = (on || (first && !hasOn())) ? 0 : -1;
          if (b.tabIndex === 0) first = false;
        });
        c.el.classList.toggle('empty', !hasOn());
      };
      const hasOn = () => options.some((o) => isOn(o.v));
      return { focus: () => (btns.find((b) => b.tabIndex === 0) ?? btns[0])?.focus() };
    });
  }
  const stones = (host, opts = {}) => choice('stones', host, opts);
  /** M.ui.cards(host, opts) or M.ui.cards(opts): opts.options [[v, label, sub?]] or [{ v, label, sub }], multi, exclusive,
      columns, lead, plus the shared opts */
  const cards = (a, b) => (a && typeof a === 'object' && !('nodeType' in a) ? choice('cards', a.host ?? null, a) : choice('cards', a, b ?? {}));

  /* ---------- 5. ten stones: tap the nth or drag across; "<1" before, "10+" as the tenth ---------- */
  function tenStones(host, opts = {}) {
    return make('ten', host, opts, (c) => {
      const row = ce('div', 'stone-row ten-row');
      row.setAttribute('role', 'radiogroup');
      if (opts.label) row.setAttribute('aria-label', opts.label);
      const items = [];
      if (opts.pre) items.push({ v: opts.preValue ?? 0.5, label: opts.pre });
      for (let i = 1; i <= 10; i++) items.push({ v: i, label: i === 10 && opts.plus ? opts.plus : String(i) });
      const btns = items.map((o) => { const b = ce('button', 'stone ten', o.label); b.type = 'button'; b.setAttribute('role', 'radio'); row.appendChild(b); return b; });
      c.el.appendChild(row);
      // the unit ("in 10") closes the row, outside the radiogroup's buttons
      if (opts.unit) { const u = ce('span', 'unit ten-unit', opts.unit); u.setAttribute('aria-hidden', 'true'); row.appendChild(u); if (opts.label) row.setAttribute('aria-label', `${opts.label}, ${opts.unit}`); }
      const ixOf = (v) => items.findIndex((o) => sameValue(o.v, v));
      const pick = (i) => { c.input(items[i].v); };
      let dragging = false, lastI = -1, undo = null;
      const atPoint = (e) => { const t = doc.elementFromPoint(e.clientX, e.clientY); const i = btns.indexOf(t?.closest?.('.stone')); return i; };
      drag(row, {
        start(e) { undo = c.hold(); dragging = true; lastI = -1; const i = atPoint(e); if (i >= 0) { lastI = i; pick(i); tap(btns[i]); } },
        move(e) { const i = atPoint(e); if (i >= 0 && i !== lastI) { lastI = i; pick(i); } },
        end() { dragging = false; c.commit(); if (lastI >= 0) btns[lastI].focus({ preventScroll: true }); },
        cancel() { dragging = false; undo?.(); },
      }, { mode: 'x' });
      btns.forEach((b, i) => {
        b.addEventListener('click', () => { if (!dragging) { pick(i); tap(b); c.commit(); } });
        c.keys(b, {
          step(n) { const cur = ixOf(c.value); const j = clamp((cur < 0 ? -1 : cur) + Math.sign(n), 0, items.length - 1); pick(j); btns[j].focus(); },
          other(e) { if (e.key === ' ') { e.preventDefault(); pick(i); c.commit(); } },
        });
        b.addEventListener('blur', () => c.commit());
      });
      c.paint = () => {
        const on = ixOf(c.value);
        btns.forEach((b, i) => { b.setAttribute('aria-checked', String(i === on)); b.classList.toggle('filled', on >= 0 && i <= on && !(opts.pre && i === 0 && on !== 0)); b.tabIndex = i === Math.max(on, 0) ? 0 : -1; });
        c.el.classList.toggle('empty', on < 0);
      };
      return { focus: () => btns[Math.max(ixOf(c.value), 0)].focus() };
    });
  }

  /* ---------- ring base: an SVG circle with a filled arc, dragged round from the top ---------- */
  function ringBase(c, { size = 160, stroke = 8, segments = 0, gapDeg = 4 } = {}) {
    const box = ce('div', 'ring-ctl');
    box.tabIndex = 0;
    box.setAttribute('role', 'slider');
    if (c.opts.label) box.setAttribute('aria-label', c.opts.label);
    const r = (size - stroke) / 2 - 2;
    const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'ring-svg', 'aria-hidden': 'true' });
    const circ = 2 * Math.PI * r;
    const track = svgEl('circle', { cx: size / 2, cy: size / 2, r, class: 'ring-track', 'stroke-width': stroke, fill: 'none' });
    const fill = svgEl('circle', { cx: size / 2, cy: size / 2, r, class: 'ring-fill', 'stroke-width': stroke, fill: 'none', transform: `rotate(-90 ${size / 2} ${size / 2})` });
    if (segments) {
      const seg = circ / segments, gap = (gapDeg / 360) * circ;
      track.setAttribute('stroke-dasharray', `${seg - gap} ${gap}`);
      track.setAttribute('stroke-dashoffset', String(gap / 2));
      track.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    }
    svg.append(track, fill);
    // the thumb is the one .handle every instrument shares: an HTML disc placed over the ring, a 44 px grip round it
    const knob = ce('i', 'handle knob ring-knob');
    const centre = ce('div', 'ring-centre');
    box.append(svg, centre, knob);
    const tOf = (e) => {
      const b = box.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
      let a = Math.atan2(dx, -dy);
      if (a < 0) a += 2 * Math.PI;
      return a / (2 * Math.PI);
    };
    const paintT = (t) => {
      const tt = clamp(t, 0, 1);
      fill.setAttribute('stroke-dasharray', `${circ * tt} ${circ}`);
      const a = tt * 2 * Math.PI;
      knob.style.left = `${((size / 2 + r * Math.sin(a)) / size) * 100}%`;
      knob.style.top = `${((size / 2 - r * Math.cos(a)) / size) * 100}%`;
    };
    /** the drag both rings share: round from the top with no wrap. A press on the thumb moves nothing until the pointer
        moves (the offset between the press and the thumb is kept); a press on the ring goes to that angle. On a touch
        the drag starts only once the finger runs along the ring, so a scroll that begins on it changes nothing */
    const turn = (fromT, tOfValue) => {
      let lastT = 0, off = 0, undo = null;
      const at = (ev) => { let t = tOf(ev) - off; t -= Math.floor(t); return t; };
      drag(box, {
        start(e, i) {
          undo = c.hold();
          c.el.classList.add('active');
          off = 0;
          if (i?.grip) { lastT = isNum(c.value) ? clamp(tOfValue(c.value), 0, 1) : 0; off = tOf(e) - lastT; return; }
          lastT = tOf(e);
          c.input(fromT(lastT));
        },
        move(ev) {
          // no wrap: crossing the top from either side sticks at the end
          let t = at(ev);
          if (lastT > 0.75 && t < 0.25) t = 1; else if (lastT < 0.25 && t > 0.75) t = 0; else lastT = t;
          c.input(fromT(t));
        },
        end() { c.el.classList.remove('active'); c.commit(); box.focus({ preventScroll: true }); },
        cancel() { undo?.(); c.el.classList.remove('active'); },
      }, { mode: 'ring', centre: centreOfBox(box), grip: '.handle' });
    };
    return { box, svg, centre, tOf, paintT, turn };
  }

  /* ---------- 6. ring: 0..100 in steps of 5, the figure inside ---------- */
  function ring(host, opts = {}) {
    return make('ring', host, opts, (c) => {
      const min = opts.min ?? 0, max = opts.max ?? 100, step = opts.step ?? 5;
      const unit = opts.unit ?? '%';
      const R = ringBase(c, { size: opts.size ?? 160 });
      /* rebuild 1: the figure in the centre is typed as well as turned. A typed figure is kept as it is (between the
         ring's steps, or beyond its range with a line saying the range: opts.rangeWords(min, max) rewords it); the arc
         shows it clamped. Text that is no figure stays with its line (face). The ring's own keys stay on the ring */
      const f = face(c, { unit, label: opts.label ?? 'Figure', placeholder: '0' });
      f.el.classList.add('ring-face');
      f.inp.setAttribute('aria-label', opts.label ?? 'Figure');
      const un = f.el.querySelector('.unit');
      // the figure stands over the ring's centre as a sibling of the slider box, never inside it: a role="slider"
      // has presentational children, so a field inside it would be lost to a screen reader
      const wrap = ce('div', 'ring-wrap');
      wrap.append(R.box, f.el);
      c.el.appendChild(wrap);
      const fromT = (t) => clamp(Math.round((min + t * (max - min)) / step) * step, min, max);
      R.turn(fromT, (v) => (Number(v) - min) / ((max - min) || 1));
      const rangeLine = (v) => {
        if (!isNum(v) || (v >= min && v <= max)) return '';
        if (typeof opts.rangeWords === 'function') { try { const r = opts.rangeWords(min, max); if (typeof r === 'string') return r; } catch (e) {} }
        return `From ${withUnit(min, unit)} to ${withUnit(max, unit)}`;
      };
      f.extra = rangeLine;
      const stepBy = (n) => { const v = isNum(c.value) ? Number(c.value) : min; c.input(clamp(v + n * step, Math.min(min, v), Math.max(max, v))); };
      c.keys(R.box, { step: stepBy });
      c.keys(f.inp, { step: stepBy, horizontal: false });
      R.box.addEventListener('blur', () => c.commit());
      f.inp.addEventListener('input', () => { const v = f.read(); c.value = v; paintArc(); c.say(); opts.onInput?.(v); });
      f.inp.addEventListener('focus', () => c.el.classList.add('active'));
      f.inp.addEventListener('blur', () => { c.el.classList.remove('active'); if (isNum(c.value)) c.value = Math.max(0, Math.round(Number(c.value) * 100) / 100); c.paint(); c.commit(); });
      c.sync = () => f.show(c.value, true);
      function paintArc() {
        const has = isNum(c.value);
        R.paintT(has ? (Number(c.value) - min) / (max - min || 1) : 0);
        // the unit is on show before any figure, in the ghost colour: it says what the ring measures
        if (un) un.classList.toggle('ghost', !has);
        c.el.classList.toggle('empty', !has);
        R.box.setAttribute('aria-valuemin', String(min)); R.box.setAttribute('aria-valuemax', String(max));
        if (has) { R.box.setAttribute('aria-valuenow', String(c.value)); R.box.setAttribute('aria-valuetext', withUnit(c.value, unit)); } else R.box.removeAttribute('aria-valuenow');
      }
      c.paint = () => { if (doc.activeElement !== f.inp) f.show(c.value); paintArc(); };
      return { focus: () => R.box.focus(), onClear() { f.reset(); } };
    });
  }

  /* ---------- 7. kept ring: 100 segments, pence kept of £1; a cost well under it when a price is known ---------- */
  function keptRing(host, opts = {}) {
    return make('kept', host, opts, (c) => {
      const R = ringBase(c, { size: opts.size ?? 160, segments: 100, gapDeg: 1 });
      const fig = ce('span', 'figure tabular'), un = ce('span', 'unit', 'p');
      R.centre.append(fig, un);
      c.el.appendChild(R.box);
      const price = isNum(opts.price) ? Number(opts.price) : null;
      let well = null, costInp = null, costOf = null;
      if (price) {
        const w = ce('div', 'cost-well small');
        const [w1, w2] = opts.costWords ?? ['costs', 'of'];
        w.appendChild(ce('span', 'w', w1));
        const lab = ce('label', 'well-in');
        lab.appendChild(ce('span', 'unit', '£'));
        costInp = ce('input', 'tabular');
        costInp.type = 'text'; costInp.inputMode = 'decimal'; costInp.placeholder = '0';
        costInp.setAttribute('aria-label', `${w1} ${w2} £${fmtNum(price)}`);
        lab.appendChild(costInp);
        w.append(lab, ce('span', 'w', `${w2} £${fmtNum(price)}`));
        costOf = (m) => Math.round(price * (1 - m));
        costInp.addEventListener('input', () => { const v = parseNum(costInp.value); if (isNum(v)) c.input(clamp(1 - v / price, 0, 1)); });
        costInp.addEventListener('blur', () => { c.paint(); c.commit(); });
        c.keys(costInp, { horizontal: false, step(n) { c.input(clamp((isNum(c.value) ? Number(c.value) : 0) + n * 0.01, 0, 1)); } });
        well = w;
        c.el.appendChild(w);
      }
      const fromT = (t) => Math.round(clamp(t, 0, 1) * 100) / 100;
      R.turn(fromT, (v) => Number(v));
      if (costInp) c.sync = () => { costInp.value = isNum(c.value) ? fmtNum(costOf(clamp(Number(c.value), 0, 1))) : ''; };
      c.keys(R.box, { step(n) { c.input(clamp(Math.round(((isNum(c.value) ? Number(c.value) : 0) + n * 0.01) * 100) / 100, 0, 1)); } });
      R.box.addEventListener('blur', () => c.commit());
      c.paint = () => {
        const has = isNum(c.value);
        const m = has ? clamp(Number(c.value), 0, 1) : 0;
        R.paintT(m);
        fig.textContent = has ? String(Math.round(m * 100)) : '';
        un.hidden = false;
        un.classList.toggle('ghost', !has);
        c.el.classList.toggle('empty', !has);
        R.box.setAttribute('aria-valuemin', '0'); R.box.setAttribute('aria-valuemax', '100');
        if (has) { R.box.setAttribute('aria-valuenow', String(Math.round(m * 100))); R.box.setAttribute('aria-valuetext', `${Math.round(m * 100)}p`); } else R.box.removeAttribute('aria-valuenow');
        if (costInp && doc.activeElement !== costInp) costInp.value = has ? fmtNum(costOf(m)) : '';
      };
      return { focus: () => R.box.focus() };
    });
  }

  /* ---------- arc base: a half ring with detents; the knob snaps to the nearest ---------- */
  function arcBase(c, options, { width = 240, label } = {}) {
    const box = ce('div', 'arc-ctl');
    box.tabIndex = 0;
    box.setAttribute('role', 'slider');
    box.setAttribute('aria-label', label ?? c.opts.label ?? '');
    const H = width / 2 + 16, cx = width / 2, cy = width / 2 + 4, r = width / 2 - 14;
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${H}`, class: 'arc-svg', 'aria-hidden': 'true' });
    const pt = (t) => { const a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    const arcPath = (t0, t1) => { const [x0, y0] = pt(t0), [x1, y1] = pt(t1); return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`; };
    const track = svgEl('path', { d: arcPath(0, 1), class: 'arc-track', fill: 'none', 'stroke-width': 2 });
    const fill = svgEl('path', { d: '', class: 'arc-fill', fill: 'none', 'stroke-width': 3 });
    svg.append(track, fill);
    const n = options.length;
    const tOfIx = (i) => (n > 1 ? i / (n - 1) : 0.5);
    options.forEach((o, i) => {
      const [x, y] = pt(tOfIx(i));
      const a = Math.PI * (1 - tOfIx(i));
      svg.appendChild(svgEl('line', { class: 'arc-tick', x1: x - 4 * Math.cos(a), y1: y + 4 * Math.sin(a), x2: x + 4 * Math.cos(a), y2: y - 4 * Math.sin(a), 'stroke-width': 1.5 }));
    });
    // the face holds the drawing and the shared .handle thumb, so the thumb's place is a share of the drawing alone
    const face$ = ce('div', 'arc-face');
    const knob = ce('i', 'handle knob arc-knob');
    // a figure (the months arc's) stands inside the arc, on its foot line; a plain arc leaves this empty and hidden
    const word = ce('div', 'arc-word');
    face$.append(svg, word, knob);
    // what the two ends mean, at the arc's feet
    const ends = ce('div', 'arc-ends small');
    ends.setAttribute('aria-hidden', 'true');
    if (n > 1) ends.append(ce('span', 'arc-end', options[0].label ?? ''), ce('span', 'arc-end', options[n - 1].label ?? ''));
    box.append(face$, ends);
    const ixOf = (e) => {
      const b = face$.getBoundingClientRect();
      const sx = (b.width / width) || 1;
      const dx = (e.clientX - b.left) / sx - cx, dy = cy - (e.clientY - b.top) / sx;
      let a = Math.atan2(Math.max(dy, 0), dx);
      const t = 1 - a / Math.PI;
      return clamp(Math.round(t * (n - 1)), 0, n - 1);
    };
    /** the arc's centre on screen (the middle of its foot line), for the ring rule in drag() */
    const centre = () => { const b = face$.getBoundingClientRect(); const sx = (b.width / width) || 1; return { x: b.left + cx * sx, y: b.top + cy * sx }; };
    const paintIx = (i, ghost) => {
      const t = i < 0 ? 0 : tOfIx(i);
      const [x, y] = pt(t);
      knob.style.left = `${(x / width) * 100}%`; knob.style.top = `${(y / H) * 100}%`;
      fill.setAttribute('d', i < 0 ? '' : arcPath(0, Math.max(t, 0.001)));
      box.classList.toggle('ghost', !!ghost);
    };
    return { box, face: face$, word, ixOf, paintIx, centre };
  }

  /* ---------- 8. arc: presets on a half ring (cycle, stay, leadTime) ---------- */
  function arcPick(name, host, opts, extras = {}) {
    return make(name, host, opts, (c) => {
      const options = (opts.options ?? []).map((o) => (Array.isArray(o) ? { v: o[0], label: o[1] } : o));
      const A = arcBase(c, options, { width: opts.width });
      c.el.appendChild(A.box);
      const ixOf = (v) => options.findIndex((o) => sameValue(o.v, v));
      const pick = (i) => { if (i !== ixOf(c.value)) { c.input(options[i].v); tap(A.box); } };
      let undo = null;
      drag(A.box, {
        // a press on the figure under the arc is not a press on the arc
        // and a press on the thumb moves nothing until the pointer does (unless nothing is chosen yet: then it chooses)
        start(e, i) { if (e.target?.closest?.('.arc-word')) return false; undo = c.hold(); c.el.classList.add('active'); if (!i?.grip || ixOf(c.value) < 0) pick(A.ixOf(e)); return true; },
        move(e) { pick(A.ixOf(e)); },
        end() { c.el.classList.remove('active'); c.commit(); A.box.focus({ preventScroll: true }); },
        cancel() { undo?.(); c.el.classList.remove('active'); },
      }, { mode: 'ring', centre: A.centre, grip: '.handle' });
      c.keys(A.box, { step(n) { const i = ixOf(c.value); pick(clamp((i < 0 ? (extras.ghostIx ?? 0) : i) + Math.sign(n), 0, options.length - 1)); } });
      A.box.addEventListener('blur', () => c.commit());
      // a plain arc says its option in the readout; with nothing chosen it says what the two ends are.
      // The months arc keeps its figure under the arc (extras.words) and leaves the readout to the caller
      if (!extras.words) {
        c.words = (v) => options[ixOf(v)]?.label ?? '';
        c.rest = () => (options.length > 1 ? `${options[0].label} to ${lowerFirst(options[options.length - 1].label)}` : '');
      }
      A.word.hidden = !extras.words;
      c.paint = () => {
        const i = ixOf(c.value);
        const ghost = i < 0 && isNum(extras.ghostIx);
        A.paintIx(ghost ? extras.ghostIx : i, ghost);
        const o = ghost ? options[extras.ghostIx] : options[i];
        A.word.innerHTML = '';
        if (o && extras.words) {
          const w = extras.words(o);
          if (w.big) A.word.appendChild(ce('span', 'figure-s tabular', w.big));
          if (w.small) A.word.appendChild(ce('span', 'sub', w.small));
        }
        c.el.classList.toggle('empty', i < 0);
        if (i >= 0) A.box.setAttribute('aria-valuetext', options[i].label); else A.box.removeAttribute('aria-valuetext');
      };
      return { focus: () => A.box.focus() };
    });
  }
  const arc = (host, opts = {}) => arcPick('arc', host, opts);
  /* ---------- 9. months arc: 1..12 with the month name under the figure; ghost at 12 until touched ---------- */
  function monthsArc(host, opts = {}) {
    const options = [];
    for (let i = 1; i <= 12; i++) options.push({ v: i, label: `${i} ${i === 1 ? (opts.monthWord ?? 'month') : (opts.monthsWord ?? 'months')}` });
    return arcPick('months', host, { ...opts, options }, {
      ghostIx: 11,
      words: (o) => ({ big: o.label, small: opts.monthName ? opts.monthName(o.v) : '' }),
    });
  }

  /* ---------- 10. capacity: four stones for who, then the trough (now fill, capacity end), the unit word at the right ---------- */
  function capacity(host, opts = {}) {
    return make('capacity', host, opts, (c) => {
      const whoOpts = (opts.whoOptions ?? [[1, 'Only me'], [2, 'Me and one or two'], [5, 'Three to ten'], [12, 'Over ten']]).map((o) => ({ v: o[0], label: o[1] }));
      const cur = () => ({ who: null, servedNow: null, capacity: null, ...(c.value && typeof c.value === 'object' ? c.value : {}) });
      const whoRow = stones(null, { options: whoOpts.map((o) => [o.v, o.label]), hue: opts.hue, label: opts.whoLabel, value: cur().who, onInput(v) { c.input({ ...cur(), who: v }); }, onCommit() { c.commit(); } });
      c.el.appendChild(whoRow.el);
      const maxOf = () => { const w = cur().who ?? 1; return opts.max ? opts.max(w) : Math.max(10, (opts.typical ?? 20) * w * 1.5); };
      const snap = (v) => Math.max(0, Math.round(v));
      const trough = ce('div', 'trough');
      const fillEl = ce('i', 'trough-fill');
      const roomEl = ce('span', 'band-text small');
      const hNow = ce('button', 'handle now'), hCap = ce('button', 'handle cap');
      [hNow, hCap].forEach((h) => { h.type = 'button'; h.setAttribute('role', 'slider'); });
      hNow.setAttribute('aria-label', opts.nowLabel ?? 'Now');
      hCap.setAttribute('aria-label', opts.capLabel ?? 'At most');
      trough.append(fillEl, roomEl, hNow, hCap);
      const wrap = ce('div', 'trough-wrap');
      const unitEl = ce('span', 'unit', opts.unit ?? '');
      const figs = ce('div', 'faces');
      const fNow = face(c, { unit: '', label: opts.nowLabel ?? 'Now' }), fCap = face(c, { unit: '', label: opts.capLabel ?? 'At most' });
      const colA = ce('div', 'face-col'), colB = ce('div', 'face-col');
      colA.append(fNow.el, ce('span', 'cap small', opts.nowLabel ?? 'Now'));
      colB.append(fCap.el, ce('span', 'cap small', opts.capLabel ?? 'At most'));
      figs.append(colA, colB);
      wrap.append(trough, unitEl);
      c.el.append(figs, wrap);
      const tOf = (e) => { const b = trough.getBoundingClientRect(); return b.width ? clamp((e.clientX - b.left) / b.width, 0, 1) : 0; };
      /* a drag stays on the trough; a typed figure beyond it is kept as typed (`free`: two decimals at most, never below
         0), and the handle waits at the trough's end. An arrow step from such a figure walks back from where it stands */
      const setPart = (k, raw, free) => {
        const v = cur();
        const x = free ? Math.max(0, Math.round(raw * 100) / 100) : snap(clamp(raw, 0, Math.max(maxOf(), isNum(v[k]) ? Number(v[k]) : 0)));
        if (k === 'servedNow') v.servedNow = isNum(v.capacity) ? Math.min(x, v.capacity) : x;
        else { v.capacity = x; if (isNum(v.servedNow) && v.servedNow > x) v.servedNow = x; }
        c.input(v);
      };
      let active = 'capacity', undo = null;
      drag(trough, {
        start(e) {
          const v = cur(), t = tOf(e), m = maxOf();
          const dNow = isNum(v.servedNow) ? Math.abs(v.servedNow / m - t) : 9, dCap = isNum(v.capacity) ? Math.abs(v.capacity / m - t) : 9;
          active = e.target === hNow ? 'servedNow' : e.target === hCap ? 'capacity' : (dNow < dCap ? 'servedNow' : 'capacity');
          if (!isNum(v.capacity) && e.target !== hNow) active = 'capacity';
          undo = c.hold();
          c.el.classList.add('active');
        },
        move(e) { setPart(active, tOf(e) * maxOf()); },
        end(e, i) { c.el.classList.remove('active'); if (!i?.grip || i.moved) setPart(active, tOf(e) * maxOf()); c.commit(); (active === 'servedNow' ? hNow : hCap).focus({ preventScroll: true }); },
        cancel() { undo?.(); c.el.classList.remove('active'); },
      }, { mode: 'x', grip: '.handle' });
      c.sync = () => { const v = cur(); fNow.show(v.servedNow, true); fCap.show(v.capacity, true); };
      [['servedNow', hNow, fNow], ['capacity', hCap, fCap]].forEach(([k, h, f]) => {
        c.keys(h, { step(n) { setPart(k, (cur()[k] ?? 0) + n * Math.max(1, Math.round(maxOf() / 100))); } });
        c.keys(f.inp, { horizontal: false, step(n) { setPart(k, (cur()[k] ?? 0) + n * Math.max(1, Math.round(maxOf() / 100))); } });
        f.inp.addEventListener('input', () => { const v = cur(); v[k] = f.read(); c.value = v; paintTrough(); c.say(); opts.onInput?.(v); });
        f.inp.addEventListener('blur', () => { const v = cur(); if (isNum(v[k])) setPart(k, Number(v[k]), true); c.paint(); c.commit(); });
        h.addEventListener('blur', () => c.commit());
      });
      function paintTrough() {
        const v = cur(), m = maxOf();
        const tNow = isNum(v.servedNow) ? clamp(v.servedNow / m, 0, 1) : 0, tCap = isNum(v.capacity) ? clamp(v.capacity / m, 0, 1) : 0;
        fillEl.style.width = `${tNow * 100}%`;
        hNow.style.left = `${tNow * 100}%`;
        hCap.style.left = `${tCap * 100}%`;
        trough.style.setProperty('--cap', `${tCap * 100}%`);
        const room = isNum(v.servedNow) && isNum(v.capacity) ? Math.max(0, v.capacity - v.servedNow) : null;
        const words = room !== null && opts.room ? opts.room(room) : '';
        roomEl.textContent = words;
        roomEl.hidden = !words;
        roomEl.style.left = `${((tNow + tCap) / 2) * 100}%`;
        c.el.classList.toggle('empty', !isNum(v.capacity));
        [[hNow, v.servedNow], [hCap, v.capacity]].forEach(([h, x]) => { h.setAttribute('aria-valuemin', '0'); h.setAttribute('aria-valuemax', String(Math.round(m))); if (isNum(x)) h.setAttribute('aria-valuenow', String(x)); else h.removeAttribute('aria-valuenow'); });
      }
      c.paint = () => {
        const v = cur();
        if (!sameValue(whoRow.get(), v.who)) whoRow.set(v.who, true);
        if (doc.activeElement !== fNow.inp) fNow.show(v.servedNow);
        if (doc.activeElement !== fCap.inp) fCap.show(v.capacity);
        paintTrough();
      };
      return { focus: () => whoRow.focus(), destroy: () => whoRow.destroy(), onClear() { fNow.reset(); fCap.reset(); } };
    });
  }

  /* ---------- 11. routes shelves: four shelves of pills; once = doing, twice = tried, thrice = clear ---------- */
  function shelves(host, opts = {}) {
    return make('shelves', host, opts, (c) => {
      const Q = opts.quadrant ?? M.QUADRANT ?? { warm11: [], warm1m: [], cold11: [], cold1m: [] };
      const BINS = ['warm11', 'warm1m', 'cold11', 'cold1m'];
      const headers = opts.headers ?? { warm11: 'Warm, one to one', warm1m: 'Warm, one to many', cold11: 'Cold, one to one', cold1m: 'Cold, one to many' };
      const explain = opts.explain ?? {};
      const nameOf = opts.names ?? ((id) => M.DIST_BY?.[id]?.name ?? id);
      const engineOf = opts.engineOf ?? ((id) => M.DIST_BY?.[id]?.engine ?? null);
      const chanName = opts.channelNames ?? ((e) => M.CHANNEL_NAME?.[e] ?? e);
      const hidden = new Set(opts.hidden ?? []);
      const foldAt = opts.foldAt ?? 6;
      const went = (opts.wentOptions ?? [['worked', 'Worked'], ['mixed', 'Mixed'], ['none', 'No result']]);
      const cur = () => ({ doing: [], tried: [], went: {}, channel: null, ...(c.value && typeof c.value === 'object' ? c.value : {}) });
      const search = ce('input', 'search');
      search.type = 'search'; search.autocomplete = 'off';
      search.placeholder = opts.searchPlaceholder || 'Search a route';
      search.setAttribute('aria-label', opts.searchLabel || search.placeholder);
      const keyLine = ce('p', 'small key-line', opts.keyLine ?? 'Press once: doing now. Twice: tried.');
      c.el.append(search, keyLine);
      const pills = new Map(); // id -> { b, bin, row }
      /* an accordion: one shelf open at a time, Warm one to one on entry. A header press opens that shelf's explanation and
         pills together and closes the others (a press on the open one closes it). A closed shelf keeps its header and every
         pill already in doing or tried, so an answer is never out of sight; a pill pressed while its shelf is closed stays
         where it is until the shelves next move, so nothing shifts under the finger and focus is never lost. A search query
         opens every shelf with a hit. The value, the single commit, Main route and the search are as they were. */
      let openBin = BINS.includes(opts.open) ? opts.open : 'warm11';
      let query = '';
      const hits = new Map();
      const isOpenBin = (bin) => bin === openBin || (!!query && (hits.get(bin) ?? 0) > 0);
      const applyOpen = () => {
        shelfEls.forEach((s) => {
          const open = isOpenBin(s.dataset.bin);
          s.classList.toggle('open', open);
          s.head.setAttribute('aria-expanded', String(open));
          s.ex.hidden = !open || !s.ex.textContent.trim();
          // closed with nothing chosen in it: the header alone
          let any = false;
          pills.forEach((p) => { if (p.bin === s.dataset.bin && (chosen(p.b) || p.b.classList.contains('keep'))) any = true; });
          s.classList.toggle('bare', !open && !any);
        });
      };
      const openShelf = (bin, head) => {
        const before = new Map(shelfEls.map((s) => [s, s.getBoundingClientRect().height]));
        const was = openBin;
        openBin = bin;
        pills.forEach((p) => p.b.classList.remove('keep'));
        applyOpen();
        if (head && was !== bin) play(bin ? 'open' : 'close', { x: panOf(head) });
        if (reduced()) return;
        // each shelf that changed height eases from the old to the new; the pills themselves are not moved or faded
        shelfEls.forEach((s) => {
          const h0 = before.get(s), h1 = s.getBoundingClientRect().height;
          if (!h0 || !h1 || Math.abs(h0 - h1) < 2 || typeof s.animate !== 'function') return;
          s.style.overflow = 'hidden';
          const done = () => { s.style.overflow = ''; };
          try { s.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: DUR, easing: EASE }).finished.then(done, done); } catch (e) { done(); }
        });
      };
      /** arrows rove the pills on show in one shelf, as they do a row of stones: Up and Down wrap, Left at the first and
          Right at the last bubble to the page's Back and Next */
      const chosen = (b) => b.dataset.state === 'doing' || b.dataset.state === 'tried';
      /** on show or not, by the same rules feel.css draws with (no layout read) */
      const shown = (b, s) => (b.classList.contains('more')
        ? !b.hidden && s.classList.contains('open')
        : !b.classList.contains('folded') && (chosen(b) || b.classList.contains('keep') || (!b.classList.contains('miss') && s.classList.contains('open'))));
      const rovePills = (e, b, row) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return;
        const s = row.parentElement;
        const vis = [...row.querySelectorAll('.stone.pill, .stone.more')].filter((x) => shown(x, s));
        const j = vis.indexOf(b);
        const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
        const flat = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
        if (j < 0 || (flat && (fwd ? j === vis.length - 1 : j === 0))) return;
        e.preventDefault();
        vis[(j + (fwd ? 1 : -1) + vis.length) % vis.length].focus();
      };
      const shelfEls = BINS.map((bin) => {
        const s = ce('section', `shelf shelf-${bin}`);
        s.dataset.bin = bin;
        const head = ce('button', 'shelf-head eyebrow', headers[bin]);
        head.type = 'button';
        const ex = ce('p', 'explain small', explain[bin] ?? '');
        const row = ce('div', 'stone-row wrap');
        row.id = `shelf-${bin}-${++dropN}`;
        head.setAttribute('aria-controls', row.id);
        s.append(head, ex, row);
        s.head = head; s.ex = ex;
        head.addEventListener('click', () => openShelf(isOpenBin(bin) && openBin === bin ? null : bin, head));
        // Up and Down move between the four headers (Enter and Space open, as any button)
        head.addEventListener('keydown', (e) => {
          if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || e.altKey || e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          const k = BINS.indexOf(bin);
          shelfEls[(k + (e.key === 'ArrowDown' ? 1 : -1) + BINS.length) % BINS.length]?.head.focus();
        });
        const ids = (Q[bin] ?? []).filter((id) => !hidden.has(id));
        ids.forEach((id, i) => {
          const b = ce('button', 'stone pill', nameOf(id));
          b.type = 'button';
          b.dataset.id = id;
          if (i >= foldAt) b.classList.add('folded');
          row.appendChild(b);
          const wentRow = ce('div', 'went-row');
          wentRow.hidden = true;
          row.appendChild(wentRow);
          pills.set(id, { b, bin, wentRow, i });
          b.addEventListener('click', () => press(id));
          b.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); c.enter(); } else if (e.key === 'Escape') { e.preventDefault(); c.revert(); } else rovePills(e, b, row); });
        });
        if (ids.length > foldAt) {
          const more = ce('button', 'stone more', opts.moreWords ?? 'more');
          more.type = 'button';
          more.addEventListener('click', () => {
            const held = doc.activeElement === more;
            const opened = ids.map((id) => pills.get(id).b).filter((b) => b.classList.contains('folded'));
            s.classList.add('unfolded'); more.hidden = true; tap(more);
            filter();
            // "more" is gone: focus goes on to the first pill it opened, never to the page
            if (held) opened[0]?.focus({ preventScroll: true });
          });
          more.addEventListener('keydown', (e) => rovePills(e, more, row));
          row.appendChild(more);
          s.more = more;
        }
        c.el.appendChild(s);
        return s;
      });
      const mainWrap = ce('div', 'main-route');
      mainWrap.hidden = true;
      mainWrap.appendChild(ce('span', 'eyebrow', opts.mainWords ?? 'Main route'));
      const mainRow = ce('div', 'stone-row');
      mainWrap.appendChild(mainRow);
      c.el.appendChild(mainWrap);
      function press(id) {
        const v = cur();
        const p = pills.get(id);
        // pressed on a closed shelf (or while a search hides it): it stays on show, whatever the press makes of it,
        // until the shelves next move or the search changes
        if (!isOpenBin(p.bin) || p.b.classList.contains('miss')) p.b.classList.add('keep');
        const isDoing = v.doing.includes(id), isTried = v.tried.includes(id);
        v.doing = v.doing.filter((x) => x !== id);
        v.tried = v.tried.filter((x) => x !== id);
        if (!isDoing && !isTried) v.doing.push(id);
        else if (isDoing) v.tried.push(id);
        else { delete v.went[id]; }
        const engines = [...new Set(v.doing.map(engineOf).filter(Boolean))];
        if (v.channel && !engines.includes(v.channel)) v.channel = null;
        tap(p.b);
        c.input(v);
        c.commit();
      }
      function paintWent(id, p) {
        const v = cur();
        const tried = v.tried.includes(id);
        p.wentRow.hidden = !tried;
        if (!tried) { p.wentRow.innerHTML = ''; return; }
        if (!p.wentRow.childElementCount) {
          went.forEach(([wv, wl]) => {
            const b = ce('button', 'stone small', wl);
            b.type = 'button'; b.dataset.v = wv;
            b.addEventListener('click', () => { const vv = cur(); vv.went = { ...vv.went, [id]: wv }; tap(b); c.input(vv); c.commit(); });
            p.wentRow.appendChild(b);
          });
        }
        p.wentRow.querySelectorAll('.stone').forEach((b) => b.setAttribute('aria-pressed', String(v.went[id] === b.dataset.v)));
      }
      let mainKey = '';
      function paintMain() {
        const v = cur();
        const engines = [...new Set(v.doing.map(engineOf).filter(Boolean))];
        mainWrap.hidden = engines.length < 2;
        const key = engines.length < 2 ? '' : engines.join('|');
        // the row is rebuilt only when the routes in it change: a press on one of its stones keeps the stone, and the focus
        if (key !== mainKey) {
          mainKey = key;
          mainRow.innerHTML = '';
          if (key) engines.forEach((e) => {
            const b = ce('button', 'stone', chanName(e));
            b.type = 'button';
            b.dataset.e = e;
            b.addEventListener('click', () => { const vv = cur(); vv.channel = e; tap(b); c.input(vv); c.commit(); });
            mainRow.appendChild(b);
          });
        }
        mainRow.querySelectorAll('.stone').forEach((b) => b.setAttribute('aria-pressed', String(v.channel === b.dataset.e)));
      }
      const filter = () => {
        const q = search.value.trim().toLowerCase();
        BINS.forEach((bin) => hits.set(bin, 0));
        pills.forEach((p, id) => {
          const hit = !q || nameOf(id).toLowerCase().includes(q);
          if (q && hit) hits.set(p.bin, (hits.get(p.bin) ?? 0) + 1);
          p.b.classList.toggle('miss', !hit);
          if (q) p.b.classList.remove('folded');
          else p.b.classList.toggle('folded', p.i >= foldAt && !p.b.closest('.shelf').classList.contains('unfolded') && !cur().doing.includes(id) && !cur().tried.includes(id));
        });
        shelfEls.forEach((s) => { if (s.more) s.more.hidden = !!q || s.classList.contains('unfolded'); });
        // a query opens every shelf with a hit; with the field empty again the one open shelf is as it was left
        query = q;
        applyOpen();
      };
      search.addEventListener('input', () => { pills.forEach((p) => p.b.classList.remove('keep')); filter(); });
      search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); c.enter(); } });
      c.paint = () => {
        const v = cur();
        pills.forEach((p, id) => {
          const st = v.doing.includes(id) ? 'doing' : v.tried.includes(id) ? 'tried' : '';
          p.b.dataset.state = st;
          p.b.setAttribute('aria-pressed', String(!!st));
          if (st) p.b.classList.remove('folded');
          paintWent(id, p);
        });
        paintMain();
        filter();
        c.el.classList.toggle('empty', !v.doing.length && !v.tried.length);
      };
      return { focus: () => search.focus() };
    });
  }

  /* ---------- 12. 80/20 sorter: five discs into five bins; drag, tap then bin, or 1..5 ----------
     Any number of bins with the caller's labels (opts.bins). With opts.items ([[id, label], ...]) the discs are named
     tiles instead of numbers (decision rights: five decisions into three bins); the value is then
     [{ id, bin, route }] in item order, and a map { id: bin } is read as a value too. opts.partial commits on every
     placing (a half-sorted answer counts); without it the commit waits for the last disc, as it always has. */
  function sorter(host, opts = {}) {
    return make('sorter', host, opts, (c) => {
      const bins = (opts.bins ?? [['warm11', 'Warm 1-1'], ['warm1m', 'Warm 1-many'], ['cold11', 'Cold 1-1'], ['cold1m', 'Cold 1-many'], ['unknown', 'Can\'t say']]).map((b) => ({ id: b[0], label: b[1] }));
      const items = Array.isArray(opts.items) && opts.items.length ? opts.items.map((t) => (Array.isArray(t) ? { id: t[0], label: t[1] } : t)) : null;
      const N = items ? items.length : (opts.count ?? 5);
      const cur = () => {
        const val = c.value, arr = Array.isArray(val) ? val : [];
        const map = items && val && typeof val === 'object' && !Array.isArray(val) ? val : null;
        const out = [];
        for (let i = 0; i < N; i++) {
          const a = map ? { bin: map[items[i].id] ?? null } : (items ? (arr.find((x) => x && x.id === items[i].id) ?? arr[i]) : arr[i]);
          const e = a && typeof a === 'object' ? { bin: a.bin ?? null, route: a.route ?? null } : { bin: null, route: null };
          out.push(items ? { id: items[i].id, ...e } : e);
        }
        return out;
      };
      const discWord = opts.discWord ?? 'Client';
      const nameOf = (i) => (items ? items[i].label : `${discWord} ${i + 1}`);
      if (items) c.el.classList.add('named');
      const tray = ce('div', 'disc-tray');
      const discs = [];
      for (let i = 0; i < N; i++) {
        const d = ce('button', items ? 'disc-n named' : 'disc-n', items ? items[i].label : String(i + 1));
        d.type = 'button';
        d.setAttribute('aria-label', nameOf(i));
        d.setAttribute('aria-pressed', 'false');
        d.dataset.i = String(i);
        tray.appendChild(d);
        discs.push(d);
      }
      const binsEl = ce('div', 'bins');
      binsEl.style.setProperty('--bins', String(bins.length));
      const binEls = bins.map((b) => {
        const w = ce('div', `bin bin-${b.id}`);
        w.dataset.bin = b.id;
        w.setAttribute('role', 'button');
        w.setAttribute('aria-label', b.label);
        w.tabIndex = 0;
        w.appendChild(ce('span', 'bin-lab eyebrow', b.label));
        w.appendChild(ce('div', 'bin-discs'));
        binsEl.appendChild(w);
        return w;
      });
      const menu = ce('div', 'route-menu');
      menu.hidden = true;
      menu.setAttribute('role', 'group');
      c.el.append(tray, binsEl, menu);
      /* the keyboard path: Space or Enter on a disc picks it up and focus goes to the bins; arrows move between the bins;
         Space or Enter on a bin places it and focus goes on to the next disc still in the tray. On a placed disc the same
         key opens its routes and focus goes into them; Escape closes and returns. 1..5 place at once, Backspace lifts.
         Every move that re-parents or hides the focused element puts focus back on a disc: it never falls to the page,
         where the next arrow would be Back or Next. Once all five are placed, Enter on a disc is the page's Enter. */
      let armed = -1;
      const focusOn = (x) => { try { x?.focus({ preventScroll: true }); } catch (e) {} };
      const inside = () => { const a = doc.activeElement; return !!a && a !== doc.body && c.el.contains(a); };
      const setArmed = (i) => { armed = i; discs.forEach((d, j) => d.setAttribute('aria-pressed', String(j === i))); c.el.classList.toggle('armed', i >= 0); };
      const closeMenu = (back) => { const held = menu.contains(doc.activeElement); menu.hidden = true; if (held && back) focusOn(back); };
      const complete = () => cur().every((x) => x.bin);
      const binOf = (i) => binEls.find((x) => x.dataset.bin === cur()[i].bin) ?? null;
      const place = (i, binId, o = {}) => {
        const held = inside();
        const v = cur();
        if (v[i].bin !== binId) { v[i] = { ...v[i], bin: binId, route: null }; }
        c.input(v);
        setArmed(-1);
        menu.hidden = true;
        if (opts.partial || v.every((x) => x.bin)) c.commit();
        // c.paint has moved the disc into its bin, which blurs it: focus goes to the next disc in the tray, or back on this one
        if (held || o.focus) focusOn((o.focus === 'next' ? discs.find((d, j) => !v[j].bin) : null) ?? discs[i]);
      };
      const lift = (i) => {
        const held = inside();
        const v = cur();
        v[i] = { ...v[i], bin: null, route: null };
        c.input(v);
        setArmed(-1);
        menu.hidden = true;
        if (opts.partial) c.commit();
        if (held) focusOn(discs[i]);
      };
      const openMenu = (i, byKey) => {
        const v = cur();
        const bin = v[i].bin;
        const routes = bin && bin !== 'unknown' && opts.routesFor ? (opts.routesFor(bin) ?? []) : [];
        menu.innerHTML = '';
        if (!routes.length) { menu.hidden = true; return false; }
        menu.setAttribute('aria-label', nameOf(i));
        menu.dataset.i = String(i);
        const rows = [...routes.map((r) => (typeof r === 'string' ? { id: r, name: r } : r)), { id: 'other', name: opts.anotherWords ?? 'Another way' }];
        rows.forEach((r) => {
          const b = ce('button', 'stone', r.name);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(v[i].route === r.id));
          b.addEventListener('click', () => { const vv = cur(); vv[i].route = r.id; tap(b); c.input(vv); setArmed(-1); menu.hidden = true; focusOn(discs[i]); if (vv.every((x) => x.bin)) c.commit(); });
          menu.appendChild(b);
        });
        const clear = ce('button', 'stone small', opts.clearWords ?? 'Clear');
        clear.type = 'button';
        clear.addEventListener('click', () => { tap(clear); lift(i); });
        menu.appendChild(clear);
        const b = binEls.find((x) => x.dataset.bin === bin);
        if (b) b.appendChild(menu); else c.el.appendChild(menu);
        menu.hidden = false;
        if (byKey) focusOn(menu.querySelector('button'));
        return true;
      };
      // inside the routes: arrows move between them, Escape closes and goes back to the disc; neither reaches the page
      menu.addEventListener('keydown', (e) => {
        const i = Number(menu.dataset.i) || 0;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setArmed(-1); closeMenu(discs[i]); return; }
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault(); e.stopPropagation();
        const items = [...menu.querySelectorAll('button')];
        const j = items.indexOf(doc.activeElement);
        focusOn(items[(j + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]);
      });
      discs.forEach((d, i) => {
        let moved = false, ghost = null, sx = 0, sy = 0;
        const drop = () => { d.classList.remove('lifting'); binEls.forEach((b) => b.classList.remove('over')); if (ghost) { ghost.remove(); ghost = null; } };
        drag(d, {
          start(e) { moved = false; sx = e.clientX; sy = e.clientY; ghost = null; },
          move(e) {
            if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
            if (!moved) { moved = true; ghost = d.cloneNode(true); ghost.classList.add('disc-ghost'); ghost.removeAttribute('aria-pressed'); doc.body.appendChild(ghost); d.classList.add('lifting'); }
            ghost.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
            binEls.forEach((b) => b.classList.remove('over'));
            const over = doc.elementFromPoint(e.clientX, e.clientY)?.closest?.('.bin');
            if (over) over.classList.add('over');
          },
          end(e) {
            drop();
            if (moved) {
              const over = doc.elementFromPoint(e.clientX, e.clientY)?.closest?.('.bin');
              if (over && c.el.contains(over)) { place(i, over.dataset.bin, { focus: 'self' }); tap(over); }
              return;
            }
            // a tap: arm it, or open the routes of a placed disc
            const v = cur();
            if (v[i].bin) { if (armed === i) { setArmed(-1); menu.hidden = true; } else { setArmed(i); openMenu(i); } }
            else { setArmed(armed === i ? -1 : i); menu.hidden = true; }
            tap(d);
            focusOn(d);
          },
          // the browser took the pointer away: the ghost goes and nothing is placed
          cancel() { drop(); },
        });
        d.addEventListener('keydown', (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey) return;
          const n = Number(e.key);
          if (e.key !== ' ' && n >= 1 && n <= bins.length) { e.preventDefault(); place(i, bins[n - 1].id, { focus: 'next' }); tap(d); }
          else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (e.key === 'Enter' && armed < 0 && menu.hidden && complete()) { c.enter(); return; }
            tap(d);
            if (armed === i) { setArmed(-1); closeMenu(d); return; }
            setArmed(i);
            // a placed disc offers its routes first; with none to offer, or from the tray, the bins come next
            if (cur()[i].bin && openMenu(i, true)) return;
            menu.hidden = true;
            focusOn(binOf(i) ?? binEls[0]);
          }
          // Escape first puts a held disc down (or closes the routes); with nothing held it reverts, as everywhere
          else if (e.key === 'Escape') { e.preventDefault(); if (armed >= 0 || !menu.hidden) { setArmed(-1); menu.hidden = true; } else c.revert(); focusOn(d); }
          else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); lift(i); }
          else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); focusOn(discs[(i + (e.key === 'ArrowRight' ? 1 : -1) + N) % N]); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); focusOn(binOf(i) ?? binEls[0]); }
        });
      });
      binEls.forEach((b, k) => {
        b.addEventListener('click', (e) => { if (e.target.closest('.disc-n') || e.target.closest('.route-menu')) return; if (armed >= 0) { place(armed, b.dataset.bin, { focus: 'self' }); tap(b); } });
        b.addEventListener('keydown', (e) => {
          // keys on a disc or in the routes inside this bin are theirs
          if (e.target !== b || e.altKey || e.metaKey || e.ctrlKey) return;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (armed >= 0) { place(armed, b.dataset.bin, { focus: 'next' }); tap(b); }
            else focusOn(b.querySelector('.disc-n'));
          }
          else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            focusOn(binEls[(k + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + binEls.length) % binEls.length]);
          }
          else if (e.key === 'Escape') {
            e.preventDefault();
            const back = armed >= 0 ? discs[armed] : (discs.find((d, j) => !cur()[j].bin) ?? discs[0]);
            setArmed(-1); menu.hidden = true;
            focusOn(back);
          }
        });
      });
      const routeName = (bin, id) => {
        if (!id) return '';
        if (id === 'other') return opts.anotherWords ?? 'Another way';
        const r = (opts.routesFor?.(bin) ?? []).map((x) => (typeof x === 'string' ? { id: x, name: x } : x)).find((x) => x.id === id);
        return r?.name ?? id;
      };
      c.paint = () => {
        const v = cur();
        binEls.forEach((b) => {
          const ids = v.map((x, i) => (x.bin === b.dataset.bin ? i : -1)).filter((i) => i >= 0);
          b.classList.toggle('filled', ids.length > 0);
          const holder = b.querySelector('.bin-discs');
          ids.forEach((i) => { if (discs[i].parentElement !== holder) holder.appendChild(discs[i]); });
          let names = b.querySelector('.bin-routes');
          const words = ids.map((i) => routeName(b.dataset.bin, v[i].route)).filter(Boolean).join(', ');
          if (words) { if (!names) { names = ce('span', 'bin-routes small'); b.insertBefore(names, holder.nextSibling); } names.textContent = words; }
          else names?.remove();
          // the bin says what it holds: "Warm 1-1: 1, 3"
          const lab = bins.find((x) => x.id === b.dataset.bin)?.label ?? '';
          b.setAttribute('aria-label', ids.length ? `${lab}: ${ids.map((i) => (items ? items[i].label : i + 1)).join(', ')}` : lab);
        });
        v.forEach((x, i) => {
          if (!x.bin && discs[i].parentElement !== tray) {
            // back to the tray in number order, so the tray reads 1..5 however the discs were lifted
            const after = discs.slice(i + 1).find((d) => d.parentElement === tray) ?? null;
            tray.insertBefore(discs[i], after);
          }
          discs[i].classList.toggle('placed', !!x.bin);
          const binLab = x.bin ? bins.find((b) => b.id === x.bin)?.label : '';
          const route = x.bin ? routeName(x.bin, x.route) : '';
          discs[i].setAttribute('aria-label', [nameOf(i), binLab, route].filter(Boolean).join(', '));
        });
        c.el.classList.toggle('empty', !v.some((x) => x.bin));
        c.el.classList.toggle('complete', v.every((x) => x.bin));
      };
      return { focus: () => (discs.find((d) => !d.classList.contains('placed')) ?? discs[0]).focus() };
    });
  }

  /* ---------- 13. ledger: one row per STACK category; ghost from its eg list; a £ well after two characters; Tab moves down ---------- */
  function ledger(host, opts = {}) {
    return make('ledger', host, opts, (c) => {
      const rows = opts.rows ?? M.STACK ?? [];
      const cur = () => ({ names: {}, fees: {}, ...(c.value && typeof c.value === 'object' ? { names: { ...(c.value.names ?? {}) }, fees: { ...(c.value.fees ?? {}) } } : {}) });
      const list = ce('div', 'ledger-rows');
      list.style.setProperty('--rows', String(opts.visible ?? 6));
      c.el.appendChild(list);
      const inputs = [];
      const feeWord = opts.feeWords ?? '/month';
      rows.forEach((r, i) => {
        const row = ce('div', 'ledger-row');
        row.dataset.id = r.id;
        const lab = ce('label', 'ledger-lab', r.name);
        const nameIn = ce('input', 'ledger-name');
        nameIn.type = 'text'; nameIn.autocomplete = 'off'; nameIn.spellcheck = false;
        nameIn.id = `ledger-${r.id}-${++dropN}`;
        lab.htmlFor = nameIn.id;
        if (opts.prefill?.[r.id]) nameIn.placeholder = opts.prefill[r.id];
        const well = ce('label', 'well-in fee-well');
        well.hidden = true;
        well.appendChild(ce('span', 'unit', '£'));
        const feeIn = ce('input', 'tabular');
        feeIn.type = 'text'; feeIn.inputMode = 'decimal'; feeIn.placeholder = '0';
        feeIn.setAttribute('aria-label', `${r.name} £${feeWord}`);
        well.appendChild(feeIn);
        well.appendChild(ce('span', 'unit', feeWord));
        row.append(lab, nameIn, well);
        list.appendChild(row);
        inputs.push({ id: r.id, nameIn, feeIn, well });
        // the category's examples as ghost text; the set id is tried in the forms (e) may use
        if (typeof M.ghost === 'function') {
          for (const setId of [`software.${r.id}`, `software:${r.id}`, `software-${r.id}`, 'software']) {
            M.ghost(nameIn, setId);
            if (nameIn.parentElement?.classList.contains('ghost-wrap')) break;
          }
        }
        const paintWell = () => { well.hidden = nameIn.value.trim().length < 2 && !isNum(cur().fees[r.id]); };
        nameIn.addEventListener('input', () => {
          const v = cur();
          const t = nameIn.value.trim();
          if (t) v.names[r.id] = t; else { delete v.names[r.id]; delete v.fees[r.id]; feeIn.value = ''; }
          c.value = v; paintWell(); c.el.classList.toggle('empty', !Object.keys(v.names).length); c.say(); opts.onInput?.(v);
        });
        feeIn.addEventListener('input', () => { const v = cur(); const n = parseNum(feeIn.value); if (isNum(n)) v.fees[r.id] = n; else delete v.fees[r.id]; c.value = v; c.say(); opts.onInput?.(v); });
        // Escape first belongs to a ghost suggestion on show (ghost.js drops it on the same key): seen on the way down, before
        // ghost.js hears it, so that press only dismisses the suggestion; the next Escape reverts
        let tailUp = false;
        row.addEventListener('keydown', (e) => { if (e.key === 'Escape') tailUp = !!row.querySelector('.ghost-hint:not([hidden])'); }, true);
        [nameIn, feeIn].forEach((inp) => {
          inp.addEventListener('blur', () => { c.commit(); });
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); c.enter(); }
            else if (e.key === 'Escape') { if (e.defaultPrevented || tailUp) { tailUp = false; return; } e.preventDefault(); c.revert(); }
            else if (e.key === 'Tab' && !e.shiftKey && inp === nameIn) {
              // Tab moves down; the fee well is reached with the right arrow from the end of the name
              const next = inputs[i + 1]?.nameIn;
              if (next) { e.preventDefault(); c.commit(); next.focus(); }
            } else if (e.key === 'ArrowRight' && inp === nameIn && !well.hidden && !e.defaultPrevented && nameIn.selectionStart === nameIn.value.length) { e.preventDefault(); feeIn.focus(); }
            else if (e.key === 'ArrowDown' && inputs[i + 1]) { e.preventDefault(); (inp === nameIn ? inputs[i + 1].nameIn : (inputs[i + 1].well.hidden ? inputs[i + 1].nameIn : inputs[i + 1].feeIn)).focus(); }
            else if (e.key === 'ArrowUp' && inputs[i - 1]) { e.preventDefault(); (inp === nameIn ? inputs[i - 1].nameIn : (inputs[i - 1].well.hidden ? inputs[i - 1].nameIn : inputs[i - 1].feeIn)).focus(); }
          });
        });
      });
      c.paint = () => {
        const v = cur();
        inputs.forEach(({ id, nameIn, feeIn, well }) => {
          if (doc.activeElement !== nameIn) nameIn.value = v.names[id] ?? '';
          if (doc.activeElement !== feeIn) feeIn.value = isNum(v.fees[id]) ? fmtNum(v.fees[id]) : '';
          well.hidden = nameIn.value.trim().length < 2 && !isNum(v.fees[id]);
        });
        c.el.classList.toggle('empty', !Object.keys(v.names).length);
      };
      // an Escape revert writes every row from the value, the focused one too (paint alone leaves the focused text be)
      c.sync = () => {
        const v = cur();
        inputs.forEach(({ id, nameIn, feeIn, well }) => {
          nameIn.value = v.names[id] ?? '';
          feeIn.value = isNum(v.fees[id]) ? fmtNum(v.fees[id]) : '';
          well.hidden = nameIn.value.trim().length < 2 && !isNum(v.fees[id]);
        });
      };
      return { focus: () => inputs[0]?.nameIn.focus() };
    });
  }

  /* ---------- 14. sort: six tiles; drag left to "good at", right to "avoid" (60 px), or tap once / twice ----------
     Rebuild 1 (E40, E41): opts.order: true makes the order inside each zone part of the answer. Each placed tile gets
     Up and Down (tap, 44 px) beside it and takes Shift+Up / Shift+Down on the keyboard; the top position in each zone is
     labelled from opts.topWords (['Most energising', 'Most draining']). The value shape is unchanged: strengths[] and
     avoids[] in zone order. Without `order` the instrument is as it was. */
  function sort(host, opts = {}) {
    return make('sort', host, opts, (c) => {
      const tiles = (opts.tiles ?? []).map((t) => (Array.isArray(t) ? { id: t[0], label: t[1] } : t));
      const zones = opts.zones ?? ['good at', 'avoid'];
      const order = !!opts.order;
      const topWords = opts.topWords ?? ['First', 'First'];
      const moveWords = opts.moveWords ?? ['Move up', 'Move down'];
      const cur = () => ({ strengths: [], avoids: [], ...(c.value && typeof c.value === 'object' ? { strengths: [...(c.value.strengths ?? [])], avoids: [...(c.value.avoids ?? [])] } : {}) });
      const grid = ce('div', 'sort-grid');
      const left = ce('div', 'sort-zone left'), mid = ce('div', 'sort-mid'), right = ce('div', 'sort-zone right');
      left.appendChild(ce('span', 'eyebrow', zones[0]));
      right.appendChild(ce('span', 'eyebrow', zones[1]));
      const topL = ce('span', 'sort-top small', topWords[0]), topR = ce('span', 'sort-top small', topWords[1]);
      if (order) { left.appendChild(topL); right.appendChild(topR); c.el.classList.add('ordered'); }
      grid.append(left, mid, right);
      c.el.appendChild(grid);
      const setTo = (id, side) => {
        const v = cur();
        v.strengths = v.strengths.filter((x) => x !== id);
        v.avoids = v.avoids.filter((x) => x !== id);
        if (side === 'left') v.strengths.push(id);
        if (side === 'right') v.avoids.push(id);
        c.input(v);
        c.commit();
      };
      const sideOf = (id) => { const v = cur(); return v.strengths.includes(id) ? 'left' : v.avoids.includes(id) ? 'right' : ''; };
      /** one step up (-1) or down (+1) inside the tile's zone; at either end nothing moves */
      const shift = (id, by) => {
        const v = cur(), side = sideOf(id);
        if (!side) return false;
        const arr = side === 'left' ? v.strengths : v.avoids;
        const i = arr.indexOf(id), j = i + by;
        if (i < 0 || j < 0 || j >= arr.length) return false;
        arr.splice(i, 1); arr.splice(j, 0, id);
        c.input(v);
        c.commit();
        return true;
      };
      const tileEls = tiles.map((t) => {
        const b = ce('button', 'tile', t.label);
        b.type = 'button';
        b.dataset.id = t.id;
        let sx = 0, sy = 0, dx = 0, far = 0, moved = false;
        const settle = () => { b.style.transform = ''; b.classList.remove('to-left', 'to-right'); };
        // setTo() re-parents the tile (c.paint), which blurs it: every path puts focus straight back on it, so the next
        // arrow is still the tile's and never the page's Back or Next
        const hold = () => b.focus({ preventScroll: true });
        drag(b, {
          start(e) { sx = e.clientX; sy = e.clientY; dx = 0; far = 0; moved = false; },
          move(e) {
            dx = e.clientX - sx;
            far = Math.max(far, Math.hypot(dx, e.clientY - sy));
            if (Math.abs(dx) > 4) moved = true;
            b.style.transform = `translateX(${dx}px)`; b.classList.toggle('to-left', dx < -60); b.classList.toggle('to-right', dx > 60);
          },
          end() {
            settle();
            if (moved) { if (dx < -60) setTo(t.id, 'left'); else if (dx > 60) setTo(t.id, 'right'); }
            // a press that wandered off (up or down, say) and let go is not a tap
            else if (far <= 10) { const s = sideOf(t.id); setTo(t.id, s === '' ? 'left' : s === 'left' ? 'right' : ''); }
            tap(b);
            hold();
          },
          cancel() { settle(); },
        }, { mode: 'x' });
        b.addEventListener('keydown', (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey) return;
          // Shift with Up or Down moves the tile inside its zone (order); the keys alone move focus between tiles
          if (order && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); if (shift(t.id, e.key === 'ArrowUp' ? -1 : 1)) tap(b); hold(); return; }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setTo(t.id, sideOf(t.id) === 'right' ? '' : 'left'); hold(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); setTo(t.id, sideOf(t.id) === 'left' ? '' : 'right'); hold(); }
          else if (e.key === ' ') { e.preventDefault(); const s = sideOf(t.id); setTo(t.id, s === '' ? 'left' : s === 'left' ? 'right' : ''); hold(); }
          else if (e.key === 'Enter') { e.preventDefault(); c.enter(); }
          else if (e.key === 'Escape') { e.preventDefault(); c.revert(); hold(); }
          else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = tileEls.indexOf(b); tileEls[(i + (e.key === 'ArrowDown' ? 1 : -1) + tileEls.length) % tileEls.length].focus(); }
        });
        return b;
      });
      /* with `order`, each tile travels in a .sort-item with Up and Down beside it (shown inside a zone): the tap
         alternative to any drag or key for the ranking. At the top or bottom the button is aria-disabled and does
         nothing, so focus never drops */
      const wraps = new Map();
      const itemOf = (b) => {
        if (!order) return b;
        let w = wraps.get(b);
        if (w) return w;
        w = ce('div', 'sort-item');
        const moves = moveButtons(() => b.textContent, (by) => shift(b.dataset.id, by), { words: moveWords, cls: 'sort-moves' });
        w.append(b, moves.el);
        wraps.set(b, w);
        return w;
      };
      const byId = (id) => tileEls.find((x) => x.dataset.id === id);
      c.paint = () => {
        const v = cur();
        // each zone holds its tiles in the value's order: the k-th tile sits k places after the zone's headings
        const settle = (zone, ids) => {
          const head = order ? 2 : 1; // the eyebrow, then the top-position label when ordered
          ids.forEach((id, k) => {
            const b = byId(id);
            if (!b) return;
            const item = itemOf(b);
            const at = zone.children[head + k] ?? null;
            if (at !== item) zone.insertBefore(item, at);
          });
        };
        settle(left, v.strengths);
        settle(right, v.avoids);
        tileEls.forEach((b) => {
          const s = sideOf(b.dataset.id);
          const item = itemOf(b);
          if (!s && item.parentElement !== mid) mid.appendChild(item);
          b.dataset.side = s;
          // the tile says where it lies: "Selling, good at", and with an order "Selling, good at, 2 of 3"
          const word = b.textContent;
          const arr = s === 'left' ? v.strengths : s === 'right' ? v.avoids : null;
          const pos = arr ? arr.indexOf(b.dataset.id) : -1;
          b.setAttribute('aria-label', s ? `${word}, ${zones[s === 'left' ? 0 : 1]}${order && arr.length > 1 ? `, ${pos + 1} of ${arr.length}` : ''}` : word);
          if (order && item !== b) {
            const up = item.querySelector('.sort-move.up'), down = item.querySelector('.sort-move.down');
            up.setAttribute('aria-disabled', String(!arr || pos <= 0));
            down.setAttribute('aria-disabled', String(!arr || pos >= arr.length - 1));
          }
        });
        c.el.classList.toggle('empty', !v.strengths.length && !v.avoids.length);
      };
      return { focus: () => tileEls[0]?.focus() };
    });
  }

  /* ---------- 15. table ring: you at the centre, four seats on the ring, one dotted seat outside for an agency;
     one caption line under it says what the taps mean as they happen ---------- */
  function tableRing(host, opts = {}) {
    return make('table', host, opts, (c) => {
      const size = opts.size ?? 160, cx = size / 2 + 20, cy = size / 2 + 20, r = size / 2 - 2;
      const W = size + 40;
      const words = opts.seatWords ?? { you: 'You', seat: 'Seat', agency: 'Agency' };
      /** opts.caption({ seats, agency, help, n }) -> string; n = seats pressed beside you */
      const captionOf = typeof opts.caption === 'function' ? opts.caption : (s) => {
        const base = s.n === 0 ? 'On your own' : s.n === 1 ? 'One person beside you' : `A team of ${s.n}`;
        return s.agency ? `${base} and an agency` : base;
      };
      const box = ce('div', 'table-ring');
      box.setAttribute('role', 'group');
      if (opts.label) box.setAttribute('aria-label', opts.label);
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${W}`, class: 'table-svg', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('circle', { cx, cy, r, class: 'table-line', fill: 'none', 'stroke-width': 1 }));
      box.appendChild(svg);
      // you, at the centre: a press says "nobody else" (clears the seats and commits alone), so the resting caption can be given as an answer.
      // It is .table-you, not a .seat: the five .seat elements keep their order (partner, three team seats, the agency)
      const you = ce('button', 'table-you');
      you.type = 'button';
      you.setAttribute('aria-pressed', 'false');
      you.setAttribute('aria-label', words.you ?? 'You');
      you.style.left = `${(cx / W) * 100}%`;
      you.style.top = `${(cy / W) * 100}%`;
      box.appendChild(you);
      const seats = [];
      const seatAt = (angleDeg, dist, cls, label, i) => {
        const a = (angleDeg - 90) * Math.PI / 180;
        const x = cx + dist * Math.cos(a), y = cy + dist * Math.sin(a);
        const b = ce('button', `seat ${cls}`);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', label);
        b.style.left = `${(x / W) * 100}%`;
        b.style.top = `${(y / W) * 100}%`;
        b.dataset.i = String(i);
        box.appendChild(b);
        seats.push(b);
        return b;
      };
      [0, 90, 180, 270].forEach((deg, i) => seatAt(deg, r, i === 0 ? 'seat-partner' : 'seat-team', `${words.seat} ${i + 1}`, i));
      seatAt(30, r + 26, 'seat-agency', words.agency, 4);
      // the caption is this instrument's readout: the same <output class="ui-readout"> every instrument has, spoken here
      // (the seats are toggles with no value text of their own). opts.readout(value) wins over opts.caption(state)
      const cap = c.out;
      cap.classList.add('table-cap');
      cap.setAttribute('aria-live', 'polite');
      c.el.append(box, cap);
      const cur = () => ({ seats: [false, false, false, false], agency: false, ...(c.value && typeof c.value === 'object' ? { seats: [...(c.value.seats ?? [false, false, false, false])], agency: !!c.value.agency } : {}) });
      const nOf = (v) => v.seats.filter(Boolean).length;
      const helpOf = (v) => { const n = nOf(v); return v.agency ? 'agency' : n === 0 ? 'alone' : n === 1 ? 'partner' : 'team'; };
      const flip = (i) => {
        const v = cur();
        if (i === 4) v.agency = !v.agency; else v.seats[i] = !v.seats[i];
        c.input({ ...v, help: helpOf(v) });
        c.commit();
      };
      const alone = () => {
        c.input({ seats: [false, false, false, false], agency: false, help: 'alone' });
        c.commit();
      };
      const keysFor = (b, press) => (e) => {
        if (e.key === ' ') { e.preventDefault(); press(); tap(b); }
        else if (e.key === 'Enter') { e.preventDefault(); if (b === you && !c.value) press(); c.enter(); }
        else if (e.key === 'Escape') { e.preventDefault(); c.revert(); }
        else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) && !e.altKey && !e.metaKey && !e.ctrlKey) {
          // Up and Down wrap round you and the seats; Left at you (the first) and Right at the last seat are left
          // alone, unprevented, so they bubble to the page's Back and Next
          const vis = [you, ...seats].filter((s) => !s.hidden);
          const j = vis.indexOf(b);
          const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
          const flat = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
          if (j < 0 || (flat && (fwd ? j === vis.length - 1 : j === 0))) return;
          e.preventDefault();
          vis[(j + (fwd ? 1 : -1) + vis.length) % vis.length].focus();
        }
      };
      seats.forEach((b, i) => {
        b.addEventListener('click', () => { flip(i); tap(b); });
        b.addEventListener('keydown', keysFor(b, () => flip(i)));
      });
      you.addEventListener('click', () => { alone(); tap(you); });
      you.addEventListener('keydown', keysFor(you, alone));
      c.paint = () => {
        const v = cur();
        const given = !!c.value;
        seats.forEach((b, i) => {
          const on = i === 4 ? v.agency : !!v.seats[i];
          b.setAttribute('aria-pressed', String(on));
          if (i > 0 && i < 4) b.hidden = !!opts.solo;
          b.tabIndex = 0;
        });
        const help = helpOf(v);
        you.setAttribute('aria-pressed', String(given && help === 'alone'));
        c.el.classList.toggle('empty', !given);
        box.dataset.help = given ? help : '';
      };
      // the caption reads the ring as it stands; ghost colour until a press has made it an answer. c.say() writes it only
      // when the words change, so the live region speaks once per press; a hook that throws leaves the line empty
      const line = () => { const v = cur(); return captionOf({ seats: [...v.seats], agency: v.agency, help: helpOf(v), n: nOf(v) }); };
      c.words = line;
      c.rest = line;
      return { focus: () => seats[0].focus() };
    });
  }

  /* ---------- 16. two-sided stones: four rows of two, and "Know your letters" opens the sixteen ---------- */
  function twoSided(host, opts = {}) {
    return make('two', host, opts, (c) => {
      const axes = opts.axes ?? M.TYPE_AXES ?? [];
      const types = opts.types ?? M.TYPES ?? [];
      const cur = () => { const v = c.value && typeof c.value === 'object' ? c.value : {}; return { axes: Array.isArray(v.axes) ? [...v.axes] : [null, null, null, null], code: v.code ?? null }; };
      const rows = axes.map((ax, i) => {
        const row = ce('div', 'two-row');
        row.setAttribute('role', 'radiogroup');
        const a = ce('button', 'stone side', ax.aq), b = ce('button', 'stone side', ax.bq);
        [a, b].forEach((x) => { x.type = 'button'; x.setAttribute('role', 'radio'); });
        a.dataset.l = ax.a; b.dataset.l = ax.b;
        const pick = (letter, el) => {
          const v = cur();
          v.axes[i] = v.axes[i] === letter ? null : letter;
          v.code = v.axes.every(Boolean) ? v.axes.join('') : null;
          tap(el);
          c.input(v);
          if (v.code) c.commit();
        };
        a.addEventListener('click', () => pick(ax.a, a));
        b.addEventListener('click', () => pick(ax.b, b));
        [a, b].forEach((x, j) => x.addEventListener('keydown', (e) => {
          if (e.key === ' ') { e.preventDefault(); pick(x.dataset.l, x); }
          else if (e.key === 'Enter') { e.preventDefault(); c.enter(); }
          else if (e.key === 'Escape') { e.preventDefault(); c.revert(); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); (j ? a : b).focus(); }
          else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const k = (i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length; rows[k].row.querySelector('.stone').focus(); }
        }));
        row.append(a, b);
        c.el.appendChild(row);
        return { row, a, b, ax };
      });
      const know = ce('button', 'stone know', opts.knowWords ?? 'Know your letters');
      know.type = 'button';
      const grid = ce('div', 'type-grid');
      grid.hidden = true;
      types.forEach((t) => {
        const code = Array.isArray(t) ? t[0] : t.code;
        const b = ce('button', 'stone type', code);
        b.type = 'button';
        b.setAttribute('aria-label', Array.isArray(t) ? `${t[0]}, ${t[1]}` : code);
        b.addEventListener('click', () => { c.input({ axes: code.split(''), code }); tap(b); c.commit(); });
        grid.appendChild(b);
      });
      const kd = bindDrop(know, grid);
      c.el.append(know, grid);
      c.paint = () => {
        const v = cur();
        rows.forEach(({ a, b, ax }, i) => { a.setAttribute('aria-checked', String(v.axes[i] === ax.a)); b.setAttribute('aria-checked', String(v.axes[i] === ax.b)); a.setAttribute('aria-pressed', String(v.axes[i] === ax.a)); b.setAttribute('aria-pressed', String(v.axes[i] === ax.b)); });
        grid.querySelectorAll('.type').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === v.code)));
        c.el.classList.toggle('empty', !v.axes.some(Boolean));
        c.el.classList.toggle('complete', !!v.code);
      };
      return { focus: () => rows[0]?.a.focus(), destroy: () => kd?.close?.() };
    });
  }

  /** one pulse along a line from an element towards the Core (#core, which the tree places beside the trunk), drawn in the
      page's flight layer (#flight: fixed, above the clearing, no pointer events). A 1 px line draws out, one dot rides it,
      both fade: about a second, flat colour, nothing else. Nothing is drawn when the layer or the Core is missing or not
      on screen (the lab page), or under prefers-reduced-motion. Returns whether it ran. */
  function pulseToCore(fromEl, delay = 0) {
    if (reduced() || !fromEl) return false;
    const layer = doc.getElementById('flight'), core = doc.getElementById('core');
    if (!layer || !core || core.dataset.placed === '0') return false;
    let shown = true;
    try { shown = getComputedStyle(core).visibility !== 'hidden'; } catch (e) {}
    const a = fromEl.getBoundingClientRect(), b = core.getBoundingClientRect();
    if (!shown || !a.width || !b.width || !b.height) return false;
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0;
    if (Math.hypot(dx, dy) < 24) return false;
    const W = window.innerWidth || 1, H = window.innerHeight || 1;
    const svg = svgEl('svg', { class: 'feel-pulse', width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
    const line = svgEl('line', { class: 'feel-pulse-line', x1: x0, y1: y0, x2: x0 + dx, y2: y0 + dy, pathLength: 1 });
    const dot = svgEl('circle', { class: 'feel-pulse-dot', cx: x0, cy: y0, r: 3.5 });
    svg.append(line, dot);
    if (typeof line.animate !== 'function') return false;
    layer.appendChild(svg);
    const dur = 900;
    const gone = () => svg.remove();
    try {
      const la = line.animate([
        { strokeDashoffset: 1, opacity: 0.55 },
        { strokeDashoffset: 0, opacity: 0.55, offset: 0.5 },
        { strokeDashoffset: 0, opacity: 0.55, offset: 0.75 },
        { strokeDashoffset: 0, opacity: 0 },
      ], { duration: dur, delay, easing: 'linear', fill: 'both' });
      const da = dot.animate([
        { transform: 'translate(0px, 0px)', opacity: 0 },
        { transform: `translate(${dx * 0.05}px, ${dy * 0.05}px)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
      ], { duration: dur, delay, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'both' });
      Promise.all([la.finished, da.finished]).then(gone, gone);
    } catch (e) { gone(); return false; }
    setTimeout(gone, delay + dur + 400);
    return true;
  }

  /* ---------- 17. CV socket: the power-up; paste, drop or tap; Later beside it; Clear reverses ---------- */
  function socket(host, opts = {}) {
    return make('socket', host, opts, (c) => {
      const slot = ce('div', 'socket-slot');
      slot.tabIndex = 0;
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', opts.label ?? 'CV');
      const face$ = ce('div', 'socket-face');
      face$.append(ce('span', 'eyebrow', opts.words ?? 'CV'), ce('span', 'sub small', opts.sub ?? 'Paste it, or not'));
      // the well: an empty ring at rest, a place a stone plainly goes. Filled, the stone sits in it and the ring is whole
      const well = ce('span', 'socket-well');
      well.setAttribute('aria-hidden', 'true');
      const ringSvg = svgEl('svg', { viewBox: '0 0 44 44', class: 'socket-ring' });
      ringSvg.append(
        svgEl('circle', { cx: 22, cy: 22, r: 19, class: 'socket-track', fill: 'none', 'stroke-width': 2 }),
        svgEl('circle', { cx: 22, cy: 22, r: 19, class: 'socket-fill', fill: 'none', 'stroke-width': 2, pathLength: 1, transform: 'rotate(-90 22 22)' }),
      );
      const disc = ce('i', 'socket-disc');
      well.append(ringSvg, disc);
      const ta = ce('textarea', 'socket-text');
      ta.rows = 6;
      ta.hidden = true;
      ta.setAttribute('aria-label', opts.label ?? 'CV');
      slot.append(face$, well, ta);
      const row = ce('div', 'socket-row');
      const later = ce('button', 'stone', opts.laterWords ?? 'Later');
      later.type = 'button';
      const clear = ce('button', 'stone', opts.clearWords ?? 'Clear');
      clear.type = 'button';
      clear.hidden = true;
      row.append(slot, later, clear);
      c.el.appendChild(row);
      const has = () => typeof c.value === 'string' && c.value.trim().length > 0;
      c.isEmpty = () => !has();
      // the readout says the CV is in, by its length: the visitor's own text, no figure of Mercer's
      c.out.setAttribute('aria-live', 'polite');
      c.words = (v) => { const n = String(v ?? '').trim().split(/\s+/).filter(Boolean).length; return n ? `${fmtNum(n)} ${n === 1 ? 'word' : 'words'} added` : ''; };
      let editing = false, seatTimer = null;
      /** the power-up, shown with restraint: the stone drops into the well and settles, the well's ring draws round it, and
          one pulse runs along a line from the stone towards the Core (when the page has the flight layer and the Core is
          on screen; otherwise the moment stays inside the socket). Flat colour, no glow, no blur, no particles; under
          prefers-reduced-motion the socket simply shows as filled */
      const seat = () => {
        if (reduced()) return;
        clearTimeout(seatTimer);
        slot.classList.remove('seating');
        void slot.offsetWidth; // restart the keyframes on a second paste
        slot.classList.add('seating');
        seatTimer = setTimeout(() => slot.classList.remove('seating'), 900);
        pulseToCore(disc, 380);
      };
      c.cleanup.push(() => clearTimeout(seatTimer));
      const fill = (text) => {
        const t = String(text ?? '').trim();
        if (!t) return;
        editing = false;
        c.input(t);
        c.commit();
        seat();
        play('powerup', { x: panOf(slot) });
        opts.onPaste?.(t);
        slot.focus({ preventScroll: true });
      };
      const open = () => { if (has() || editing) return; editing = true; c.paint(); ta.focus(); };
      slot.addEventListener('click', (e) => { if (e.target !== ta) open(); });
      slot.addEventListener('keydown', (e) => { if (e.target === ta) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      slot.addEventListener('paste', (e) => { if (has()) return; const t = e.clipboardData?.getData('text'); if (t && t.trim()) { e.preventDefault(); fill(t); } });
      slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('over');
        const t = e.dataTransfer?.getData('text');
        if (t && t.trim()) { fill(t); return; }
        const f = e.dataTransfer?.files?.[0];
        if (f && /^text\/|\.(txt|md|csv)$/i.test(f.type || f.name)) { const rd = new FileReader(); rd.onload = () => fill(String(rd.result ?? '')); rd.readAsText(f); }
      });
      ta.addEventListener('blur', () => { const t = ta.value.trim(); if (t) fill(t); else { editing = false; c.paint(); } });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); ta.value = ''; editing = false; c.paint(); slot.focus(); } });
      later.addEventListener('click', () => { tap(later); opts.onLater?.(); c.el.dispatchEvent(new CustomEvent('mercer:later', { bubbles: true, detail: { id: opts.id ?? null } })); });
      // Clear hides itself: focus goes back to the slot, never to the page
      clear.addEventListener('click', () => { tap(clear); ta.value = ''; c.input(''); c.commit(); opts.onClear?.(); slot.focus({ preventScroll: true }); });
      c.paint = () => {
        const on = has();
        if (on) editing = false;
        slot.classList.toggle('filled', on);
        slot.classList.toggle('editing', editing);
        clear.hidden = !on;
        later.hidden = on;
        ta.hidden = !editing;
        face$.hidden = editing;
        // "Paste it, or not" is an invitation: once the CV is in, the readout under the slot says so instead
        if (face$.lastElementChild) face$.lastElementChild.hidden = on;
        well.hidden = editing;
        if (!editing) ta.value = '';
        if (!on) slot.classList.remove('seating');
        slot.setAttribute('aria-pressed', String(on));
      };
      return { focus: () => slot.focus() };
    });
  }

  /* ---------- 18. dial: five detents on a 96 px ring, the level word under it, a line under that; set({ working: true }) runs the arc ---------- */
  function dial(host, opts = {}) {
    return make('dial', host, opts, (c) => {
      const levels = (opts.levels ?? [['none', 'None'], ['boutique', 'Boutique'], ['moderate', 'Moderate'], ['aggressive', 'Aggressive'], ['maximum', 'Maximum']]).map((l) => (Array.isArray(l) ? { id: l[0], word: l[1] } : l));
      const size = opts.size ?? 96, cx = size / 2, cy = size / 2, r = size / 2 - 8;
      const box = ce('div', 'dial-ctl');
      box.tabIndex = 0;
      box.setAttribute('role', 'slider');
      box.setAttribute('aria-label', opts.label ?? '');
      box.setAttribute('aria-valuemin', '0'); box.setAttribute('aria-valuemax', String(levels.length - 1));
      const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'dial-svg', 'aria-hidden': 'true' });
      const pt = (deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
      const arcD = (d0, d1) => { const [x0, y0] = pt(d0), [x1, y1] = pt(d1); return `M ${x0} ${y0} A ${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
      svg.appendChild(svgEl('circle', { cx, cy, r, class: 'dial-track', fill: 'none', 'stroke-width': 2 }));
      const fillP = svgEl('path', { d: '', class: 'dial-fill', fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round' });
      svg.appendChild(fillP);
      const detents = [-120, -60, 0, 60, 120];
      detents.forEach((deg) => { const [x, y] = pt(deg); const a = (deg - 90) * Math.PI / 180; svg.appendChild(svgEl('line', { class: 'dial-tick', x1: x - 3 * Math.cos(a), y1: y - 3 * Math.sin(a), x2: x + 3 * Math.cos(a), y2: y + 3 * Math.sin(a), 'stroke-width': 1.5 })); });
      const work = svgEl('circle', { cx, cy, r: r + 5, class: 'dial-work', fill: 'none', 'stroke-width': 1 });
      work.setAttribute('stroke-dasharray', `${2 * Math.PI * (r + 5) * 0.2} ${2 * Math.PI * (r + 5)}`);
      svg.appendChild(work);
      // the box is the dial's face alone (the drawing and the shared .handle thumb): a press on the words under it is not a
      // press on the dial. Under the face: the readout (the level word, or opts.readout), then the caller's line
      const knob = ce('i', 'handle knob dial-knob');
      const line = ce('div', 'dial-line small');
      box.append(svg, knob);
      c.out.classList.add('dial-word'); // the old hook for the level word, kept on the readout that now carries it
      c.el.append(box, c.out, line);
      c.words = (v) => levels[ixOf(v)]?.word ?? '';
      c.rest = () => (levels.length > 1 ? `${levels[0].word} to ${lowerFirst(levels[levels.length - 1].word)}` : '');
      // a readout that already carries the line's words leaves the line out, so nothing is said twice
      const sayReadout = c.say;
      c.say = () => { sayReadout(); const l = line.textContent; line.hidden = !l || (c.out.textContent ?? '').includes(l); };
      let working = false;
      const ixOf = (id) => levels.findIndex((l) => l.id === id);
      const ixAt = (e) => {
        const b = box.querySelector('.dial-svg').getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        let deg = Math.atan2(dx, -dy) * 180 / Math.PI; // 0 at top, clockwise
        deg = clamp(deg, -120, 120);
        return detents.reduce((best, d, i) => (Math.abs(d - deg) < Math.abs(detents[best] - deg) ? i : best), 0);
      };
      const pick = (i) => { const id = levels[i]?.id; if (id && id !== c.value) { c.input(id); tap(box); } };
      let undo = null;
      drag(box, {
        // a press on the thumb moves nothing until the pointer does (unless no level is set yet: then it sets one)
        start(e, i) { undo = c.hold(); box.classList.add('active'); c.el.classList.add('active'); if (!i?.grip || ixOf(c.value) < 0) pick(ixAt(e)); },
        move(e) { pick(ixAt(e)); },
        end() { box.classList.remove('active'); c.el.classList.remove('active'); c.commit(); box.focus({ preventScroll: true }); },
        cancel() { undo?.(); box.classList.remove('active'); c.el.classList.remove('active'); },
      }, { mode: 'ring', centre: centreOfBox(box), grip: '.handle' });
      c.keys(box, { step(n) { const i = ixOf(c.value); pick(clamp((i < 0 ? 2 : i) + Math.sign(n), 0, levels.length - 1)); } });
      box.addEventListener('blur', () => c.commit());
      c.paint = () => {
        const i = ixOf(c.value);
        const deg = i < 0 ? 0 : detents[i];
        const [kx, ky] = pt(deg);
        knob.style.left = `${(kx / size) * 100}%`; knob.style.top = `${(ky / size) * 100}%`;
        fillP.setAttribute('d', i <= 0 ? '' : arcD(-120, deg));
        // the arc's colour walks from mist to the hue by level
        const p = i < 0 ? 0 : Math.round((i / (levels.length - 1)) * 100);
        fillP.style.stroke = `color-mix(in oklab, var(--ink-3, currentColor) ${100 - p}%, var(--hue) ${p}%)`;
        knob.style.background = i >= 0 ? `color-mix(in oklab, var(--ink-3, currentColor) ${100 - p}%, var(--hue) ${p}%)` : '';
        let l = '';
        if (i >= 0 && opts.line) { try { l = opts.line(levels[i].id) ?? ''; } catch (e) { l = ''; } }
        line.textContent = typeof l === 'string' ? l : '';
        box.classList.toggle('working', working);
        c.el.classList.toggle('empty', i < 0);
        if (i >= 0) { box.setAttribute('aria-valuenow', String(i)); box.setAttribute('aria-valuetext', levels[i].word); }
        else { box.removeAttribute('aria-valuenow'); box.removeAttribute('aria-valuetext'); }
      };
      return {
        focus: () => box.focus(),
        onSet(v) {
          // set('moderate'), or set({ working }) / set({ level, working, line }); an object without a level keeps the level
          if (!v || typeof v !== 'object') return undefined;
          if ('working' in v) working = !!v.working;
          if (typeof v.line === 'function') opts.line = v.line;
          return 'level' in v ? v.level : c.value;
        },
      };
    });
  }

  /* ---------- 19. line: one growing line with ghost completion ---------- */
  function line(host, opts = {}) {
    return make('line', host, opts, (c) => {
      const ta = ce('textarea', 'line-in');
      ta.rows = 1;
      ta.maxLength = opts.max ?? 600;
      ta.setAttribute('aria-label', opts.label ?? '');
      if (opts.placeholder) ta.placeholder = opts.placeholder;
      c.el.appendChild(ta);
      if (typeof M.ghost === 'function' && (opts.ghost ?? opts.id)) M.ghost(ta, opts.ghost ?? opts.id);
      const grow = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; };
      ta.addEventListener('input', () => { c.value = ta.value.trim() ? ta.value : ''; grow(); c.el.classList.toggle('empty', !c.value); c.say(); opts.onInput?.(c.value); });
      ta.addEventListener('blur', () => c.commit());
      // Escape first belongs to a ghost suggestion on show (seen on the way down, before ghost.js drops it on the same key)
      let tailUp = false;
      c.el.addEventListener('keydown', (e) => { if (e.key === 'Escape') tailUp = !!c.el.querySelector('.ghost-hint:not([hidden])'); }, true);
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); c.enter(); }
        else if (e.key === 'Escape') { if (e.defaultPrevented || tailUp) { tailUp = false; return; } e.preventDefault(); c.revert(); }
      });
      // an Escape revert writes the committed words back into the line while it still has focus
      c.sync = () => { ta.value = typeof c.value === 'string' ? c.value : ''; grow(); };
      c.paint = () => { if (doc.activeElement !== ta) { ta.value = typeof c.value === 'string' ? c.value : ''; } grow(); c.el.classList.toggle('empty', !(typeof c.value === 'string' && c.value.trim())); };
      return { focus: () => ta.focus() };
    });
  }

  /* ---------- 20. field: a few digits, no rail ---------- */
  function field(host, opts = {}) {
    return make('field', host, opts, (c) => {
      // `placeholder` may be a word; a figure is never shown before one is typed, so anything else reads "0"
      const f = face(c, { size: opts.digits ?? 4, unit: opts.unit ?? '', placeholder: opts.placeholder, digitsOnly: true, minCh: (opts.digits ?? 4) + 0.4 });
      f.inp.inputMode = 'numeric';
      c.el.appendChild(f.el);
      /* the field takes digits alone; a letter is dropped as it is typed and the line beside the field says why. A figure
         outside min..max is kept exactly as typed and the line gives the range (opts.rangeWords(min, max) to reword it).
         Nothing here clears the field */
      const lo = opts.min, hi = opts.max;
      const rangeLine = (v) => {
        if (!isNum(v) || ((!isNum(lo) || v >= lo) && (!isNum(hi) || v <= hi))) return '';
        if (typeof opts.rangeWords === 'function') { try { const r = opts.rangeWords(lo, hi); if (typeof r === 'string') return r; } catch (e) {} }
        return isNum(lo) && isNum(hi) ? `From ${lo} to ${hi}` : isNum(lo) ? `${lo} or more` : `${hi} or less`;
      };
      f.inp.addEventListener('input', () => {
        const raw = f.inp.value;
        const kept = raw.replace(/[^\d]/g, '').slice(0, opts.digits ?? 4);
        if (kept !== raw) f.inp.value = kept;
        const v = parseNum(kept);
        c.value = v;
        c.el.classList.toggle('empty', !isNum(v));
        c.say(); opts.onInput?.(v); f.size();
        if (kept !== raw && /[^\d\s,]/.test(raw)) f.say(c.opts.invalidWords ?? 'Digits only');
        // a whole figure (every digit given) that is out of range is answered at once; a part-typed one waits for the blur
        else if (!f.note.hidden || kept.length >= (opts.digits ?? 4)) f.check();
      });
      f.extra = rangeLine;
      f.inp.addEventListener('blur', () => c.commit());
      // an arrow step or an Escape made inside the field is written into it: what is on screen is what Enter commits
      c.sync = () => { f.inp.value = isNum(c.value) ? String(c.value) : ''; f.size(); if (!f.note.hidden) f.check(); };
      c.keys(f.inp, { horizontal: false, step(n) { const v = isNum(c.value) ? Number(c.value) : (opts.start ?? 0); c.input(clamp(v + n, opts.min ?? 0, opts.max ?? 9999)); } });
      c.paint = () => { if (doc.activeElement !== f.inp) { f.inp.value = isNum(c.value) ? String(c.value) : ''; f.size(); if (!f.note.hidden) f.check(); } c.el.classList.toggle('empty', !isNum(c.value)); };
      return { focus: () => f.inp.focus(), onClear() { f.reset(); } };
    });
  }

  /* ---------- 21. hint: one line with a short leader, once per key, gone at the first touch ----------
     M.ui.hint(el, text, key) -> { el, shown, dismiss(), destroy() }. Flat: a 16 px hairline and 13 px words, no bubble.
     On an instrument with a typed figure it stands beside the figure (inside .face, where nothing sits to its right, so
     its going moves nothing); on any other container it is the last child and keeps its line after it goes, so nothing
     shifts under a finger; beside a bare input or button it follows it. The first pointer press, keystroke (Tab and the
     modifier keys apart) or input inside `el` dismisses it, and the key is spent: a later call returns shown: false and
     draws nothing. Kept in memory for the session, as the answers are. A question drawn twice before anyone could read
     the hint (the old element gone within 1.5 s, untouched) gets it again; while one is on screen a second call for
     the same key returns that one. It fades over 160 ms; under prefers-reduced-motion it appears and goes at once. */
  const hints = new Map();
  const NO_HINT = { el: null, shown: false, dismiss() {}, destroy() {} };
  function hint(el, text, key) {
    const words = typeof text === 'string' ? text.trim() : '';
    if (!el || !el.nodeType || !words) return NO_HINT;
    const k = String(key ?? words);
    const old = hints.get(k);
    if (old) {
      if (old.spent) return NO_HINT;
      if (old.h.isConnected) return old.api;
      if (performance.now() - old.at >= 1500) { old.spent = true; return NO_HINT; }
      old.api.destroy();
    }
    const h = ce('span', 'ui-hint');
    h.setAttribute('role', 'note');
    h.dataset.hint = k;
    const lead = ce('i', 'ui-hint-lead');
    lead.setAttribute('aria-hidden', 'true');
    h.append(lead, ce('span', 'ui-hint-text', words));
    const faceEl = el.classList?.contains('face') ? el : el.querySelector?.('.face');
    const bare = /^(INPUT|TEXTAREA|SELECT|BUTTON|IMG|CANVAS)$/.test(el.tagName ?? '');
    if (faceEl) { h.classList.add('beside'); faceEl.insertBefore(h, faceEl.querySelector('.ui-note')); }
    else if (bare) { h.classList.add('beside'); el.insertAdjacentElement('afterend', h); }
    else { h.classList.add('under'); el.appendChild(h); }
    const still = reduced();
    if (still) h.classList.add('still');
    const rec = { h, at: performance.now(), spent: false, api: null };
    const evs = ['pointerdown', 'keydown', 'input'];
    const off = () => evs.forEach((t) => el.removeEventListener(t, on, true));
    const gone = () => { if (h.classList.contains('under')) h.classList.add('gone'); else h.remove(); };
    function on(e) {
      if (e.type === 'keydown' && ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      rec.api.dismiss();
    }
    rec.api = {
      el: h,
      shown: true,
      dismiss() {
        if (rec.spent) return;
        rec.spent = true;
        off();
        if (still || reduced()) { gone(); return; }
        h.classList.add('off');
        setTimeout(gone, 200);
      },
      destroy() { off(); h.remove(); },
    };
    evs.forEach((t) => el.addEventListener(t, on, true));
    hints.set(k, rec);
    return rec.api;
  }
  /** has this key's hint been dismissed (or outlived its element)? */
  hint.seen = (key) => !!hints.get(String(key))?.spent;
  /** tests and the lab only: forget one key, or all of them */
  hint.reset = (key) => { if (key === undefined) { hints.forEach((r) => r.api.destroy()); hints.clear(); } else { hints.get(String(key))?.api.destroy(); hints.delete(String(key)); } };

  /* ---------- 22. file pick: one local text file, read in the browser with FileReader ----------
     M.ui.filePick(opts) or M.ui.filePick(host, opts) -> { el, get, set, clear, focus, destroy, pick(file) }.
     opts: accept ('.txt,.md,.csv'), maxBytes (1 MB), onText(text, fileName), onRemove(), words, removeWords, sub,
     drop (false turns the drop target off), plus the shared id / hue / label / readout / onInput / onCommit.
     The value is { name, text } or null. Nothing leaves the page: there is no upload and no fetch. A file of another
     type is refused before it is read, with a plain line (a PDF or a Word file gets its own words); a file already
     chosen stays chosen. The button is a button: Enter or Space opens the picker; Remove hands focus back to it.
     pick(file) is what the picker and the drop both call; it resolves true once the text has been handed over. */
  function filePick(a, b) {
    const hostGiven = !!(a && a.nodeType);
    const opts = (hostGiven ? b : a) ?? {};
    const host = hostGiven ? a : (opts.host ?? null);
    let pickFn = null;
    const api = make('file', host, opts, (c) => {
      const exts = String(opts.accept ?? '.txt,.md,.csv').split(',').map((x) => x.trim().toLowerCase()).filter((x) => x.startsWith('.'));
      const listed = exts.length > 1 ? `${exts.slice(0, -1).join(', ')} or ${exts[exts.length - 1]}` : (exts[0] ?? '');
      const max = isNum(opts.maxBytes) ? Number(opts.maxBytes) : 1048576;
      const row = ce('div', 'file-row');
      const btn = ce('button', 'stone file-btn', opts.words ?? 'Choose a file');
      btn.type = 'button';
      if (opts.label) btn.setAttribute('aria-label', `${opts.label}: ${opts.words ?? 'Choose a file'}`);
      const inp = ce('input', 'file-in');
      inp.type = 'file';
      inp.accept = exts.join(',');
      inp.tabIndex = -1;
      inp.setAttribute('aria-hidden', 'true');
      const name = ce('span', 'file-name');
      const rm = ce('button', 'stone small file-clear', opts.removeWords ?? 'Remove');
      rm.type = 'button';
      rm.hidden = true;
      row.append(btn, inp, name, rm);
      const sub = ce('p', 'file-sub small', opts.sub ?? `${listed}. PDF and Word files are not read.`);
      const note = ce('p', 'ui-note file-note');
      note.setAttribute('role', 'status');
      note.hidden = true;
      c.el.append(row, sub, note);
      const say = (msg) => { const t = typeof msg === 'string' ? msg : ''; if (note.textContent !== t) note.textContent = t; note.hidden = !t; };
      const wordsIn = (t) => (String(t ?? '').trim().match(/\S+/g) ?? []).length;
      c.words = (v) => (v && typeof v === 'object' && v.name ? `${fmtNum(wordsIn(v.text))} words read in this browser` : '');
      c.isEmpty = () => !(c.value && typeof c.value === 'object' && c.value.name);
      pickFn = (file) => new Promise((resolve) => {
        if (!file) { resolve(false); return; }
        const fname = String(file.name ?? '');
        const ext = (/\.[^.\\/]+$/.exec(fname)?.[0] ?? '').toLowerCase();
        inp.value = '';
        if (!exts.includes(ext)) {
          const office = /^\.(pdf|docx?|rtf|odt|pages)$/.test(ext) || /pdf|msword|officedocument|opendocument/.test(String(file.type ?? ''));
          say(office ? `PDF and Word files are not read. Choose a ${listed} file, or paste the text.` : `Only ${listed} files are read.`);
          resolve(false);
          return;
        }
        if (isNum(file.size) && file.size > max) { say(`That file is over ${fmtNum(max / 1048576, 1)} MB. Paste the part that matters.`); resolve(false); return; }
        const FR = window.FileReader;
        if (typeof FR !== 'function') { say('This browser cannot read files. Paste the text.'); resolve(false); return; }
        const fr = new FR();
        btn.setAttribute('aria-busy', 'true');
        fr.onerror = () => { btn.removeAttribute('aria-busy'); say('That file could not be read. Paste the text.'); resolve(false); };
        fr.onload = () => {
          btn.removeAttribute('aria-busy');
          const text = typeof fr.result === 'string' ? fr.result : '';
          // a binary file with a text name: refuse it rather than hand over noise
          if (text.slice(0, 4000).includes('\u0000')) { say(`That file is not plain text. Choose a ${listed} file, or paste the text.`); resolve(false); return; }
          say('');
          c.input({ name: fname, text });
          c.commit(true);
          try { opts.onText?.(text, fname); } catch (e) {}
          resolve(true);
        };
        try { fr.readAsText(file); } catch (e) { fr.onerror(); }
      });
      btn.addEventListener('click', () => { tap(btn); inp.click(); });
      inp.addEventListener('change', () => { pickFn(inp.files?.[0]); });
      rm.addEventListener('click', () => { tap(rm); say(''); c.input(null); c.commit(true); try { opts.onRemove?.(); } catch (e) {} btn.focus({ preventScroll: true }); });
      if (opts.drop !== false) {
        const over = (e) => { e.preventDefault(); c.el.classList.add('over'); };
        c.el.addEventListener('dragenter', over);
        c.el.addEventListener('dragover', over);
        c.el.addEventListener('dragleave', () => c.el.classList.remove('over'));
        c.el.addEventListener('drop', (e) => { e.preventDefault(); c.el.classList.remove('over'); pickFn(e.dataTransfer?.files?.[0]); });
      }
      c.paint = () => {
        const has = !c.isEmpty();
        name.textContent = has ? c.value.name : '';
        name.hidden = !has;
        rm.hidden = !has;
        c.el.classList.toggle('empty', !has);
      };
      return { focus: () => btn.focus(), onClear() { inp.value = ''; say(''); } };
    });
    api.pick = (file) => pickFn(file);
    return api;
  }

  /* ---------- 23. client cards: one to five compact anonymous best-client cards (E13, E14) ----------
     M.ui.clientCards(host, opts) -> the shared shape; get() is an array of cards, [] allowed (none):
       { label, buyer, bought, found, valuable: [], value: number | null, ease }
     Fields: a short anonymous label (never a name), the type of buyer, what they bought, how they found the business,
     what made them valuable (one or more), the approximate value if known (typed, optional), how easy the work was.
     opts: max (5), unit ('£'), fields ({ buyer | found | valuable | ease: { label, options }, label | bought: { label,
     placeholder }, value: { label } } to pass COPY's words), cardWords ('Client'), addWords, firstWords, removeWords,
     moveWords, plus the shared opts. One card is added at a time (focus lands in its label); Remove takes one away;
     Up and Down (44 px, tap) reorder, as does Shift+Up / Shift+Down on a card's heading. Every field change is an
     input; the array commits whenever a field commits. Blank cards stay in the array: the caller decides what counts. */
  const blankClient = () => ({ label: '', buyer: null, bought: '', found: null, valuable: [], value: null, ease: null });
  const normClient = (x) => ({ ...blankClient(), ...(x && typeof x === 'object' ? x : {}), valuable: Array.isArray(x?.valuable) ? [...x.valuable] : [] });
  function clientCards(host, opts = {}) {
    const api = make('clients', host, opts, (c) => {
      const max = clamp(Number(opts.max) || 5, 1, 12);
      const unit = opts.unit ?? '£';
      const F = opts.fields ?? {};
      const words = {
        card: opts.cardWords ?? 'Client',
        add: opts.addWords ?? 'Add another client',
        first: opts.firstWords ?? 'Add a client',
        remove: opts.removeWords ?? 'Remove',
        move: opts.moveWords ?? ['Move up', 'Move down'],
        none: opts.noneWords ?? 'No clients added yet',
      };
      const DEF = {
        label: { label: 'A label for them, not a name', placeholder: 'Such as "the cafe" or "first retainer"' },
        buyer: { label: 'Type of buyer', options: [['individual', 'An individual'], ['business', 'A business'], ['organisation', 'An organisation']] },
        bought: { label: 'What they bought', placeholder: 'The service or product' },
        found: { label: 'How they found you', options: [['referral', 'Referral'], ['search', 'Search'], ['social', 'Social or content'], ['outbound', 'Outreach'], ['marketplace', 'Marketplace'], ['walkin', 'Walk-in'], ['partner', 'Partner'], ['other', 'Other']] },
        valuable: { label: 'What made them valuable', options: [['margin', 'Good margin'], ['easy', 'Easy to serve'], ['repeat', 'Repeat work'], ['quick', 'Quick decisions'], ['enjoyable', 'Enjoyable work'], ['referrals', 'Referrals']] },
        value: { label: 'Approximate value, if known' },
        ease: { label: 'How easy the work was', options: [['easy', 'Easy'], ['mixed', 'Mixed'], ['hard', 'Hard']] },
      };
      const fieldOf = (k) => ({ ...DEF[k], ...(F[k] ?? {}) });
      const blank = blankClient;
      const cur = () => (Array.isArray(c.value) ? c.value.map(normClient) : []);
      const list = ce('div', 'cc-list');
      const foot = ce('div', 'cc-foot');
      const addBtn = ce('button', 'stone cc-add');
      addBtn.type = 'button';
      const count = ce('span', 'cc-count small');
      foot.append(addBtn, count);
      c.el.append(list, foot);
      const rows = [];
      const write = (i, k, v) => { const arr = cur(); if (!arr[i]) return; arr[i][k] = v; c.value = arr; c.touch(); c.say(); opts.onInput?.(arr); };
      const commit = () => c.commit();
      /** one card: heading with its number and the three buttons, then the seven fields */
      const buildRow = (i) => {
        const el = ce('article', 'cc-card');
        const head = ce('div', 'cc-head');
        const title = ce('h4', 'cc-title', `${words.card} ${i + 1}`);
        title.tabIndex = 0;
        const tools = ce('div', 'cc-tools');
        const mk = (cls, label, glyph) => { const b = ce('button', `cc-btn ${cls}`); b.type = 'button'; b.innerHTML = glyph; b.setAttribute('aria-label', label); return b; };
        const up = mk('up', words.move[0], CHEVRON_UP), down = mk('down', words.move[1], CHEVRON_DOWN), rm = mk('remove', words.remove, CROSS);
        tools.append(up, down, rm);
        head.append(title, tools);
        el.appendChild(head);
        const ctls = {};
        const fieldWrap = (k, control) => {
          const w = ce('div', `cc-field cc-${k}`);
          const lab = ce('span', 'cc-lab small', fieldOf(k).label);
          lab.id = `cc-lab-${++tagSeq}`;
          w.append(lab, control);
          el.appendChild(w);
          return lab;
        };
        const text = (k) => {
          const inp = ce('input', 'cc-text');
          inp.type = 'text';
          inp.autocomplete = 'off';
          inp.spellcheck = false;
          inp.maxLength = 120;
          inp.placeholder = fieldOf(k).placeholder ?? '';
          const lab = fieldWrap(k, inp);
          inp.setAttribute('aria-labelledby', lab.id);
          inp.addEventListener('input', () => write(rowIx(el), k, inp.value));
          inp.addEventListener('blur', commit);
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); c.enter(); } else if (e.key === 'Escape') { e.preventDefault(); c.revert(); } });
          ctls[k] = { set(v) { if (doc.activeElement !== inp) inp.value = typeof v === 'string' ? v : ''; }, focus: () => inp.focus() };
        };
        const pills = (k, multi) => {
          const f = fieldOf(k);
          // every chip on show: a card is already a form, and an option behind "more" is an option missed
          const s = stones(null, { options: f.options, multi, hue: opts.hue, label: f.label, exclusive: f.exclusive, lead: false, foldAt: Infinity, onInput(v) { write(rowIx(el), k, v); }, onCommit: commit });
          fieldWrap(k, s.el);
          ctls[k] = { set(v) { if (!sameValue(s.get(), v)) s.set(v, true); }, focus: () => s.focus(), destroy: () => s.destroy() };
        };
        const money = () => {
          const well = ce('label', 'well-in cc-money');
          if (leads(unit)) well.appendChild(ce('span', 'unit', unit));
          const inp = ce('input', 'tabular');
          inp.type = 'text';
          inp.inputMode = 'decimal';
          inp.autocomplete = 'off';
          inp.placeholder = '0';
          well.appendChild(inp);
          if (unit && !leads(unit)) well.appendChild(ce('span', 'unit', unit));
          const note = ce('span', 'ui-note');
          note.hidden = true;
          note.setAttribute('role', 'status');
          const wrap = ce('div', 'cc-money-row');
          wrap.append(well, note);
          const lab = fieldWrap('value', wrap);
          inp.setAttribute('aria-labelledby', lab.id);
          const check = () => { const raw = inp.value.trim(); const bad = !!raw && parseNum(raw) === null; note.textContent = bad ? (opts.invalidWords ?? 'Figures only, such as 4,800 or 4.8k') : ''; note.hidden = !bad; if (bad) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); };
          inp.addEventListener('input', () => { write(rowIx(el), 'value', parseNum(inp.value)); if (!note.hidden) check(); });
          inp.addEventListener('blur', () => { check(); commit(); });
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); c.enter(); } else if (e.key === 'Escape') { e.preventDefault(); c.revert(); } });
          ctls.value = { set(v) { if (doc.activeElement !== inp) { inp.value = isNum(v) ? fmtKeep(v) : ''; check(); } }, focus: () => inp.focus() };
        };
        text('label');
        pills('buyer', false);
        text('bought');
        pills('found', false);
        pills('valuable', true);
        money();
        pills('ease', false);
        up.addEventListener('click', () => { if (up.getAttribute('aria-disabled') === 'true') return; move(rowIx(el), -1); tap(up); up.focus({ preventScroll: true }); });
        down.addEventListener('click', () => { if (down.getAttribute('aria-disabled') === 'true') return; move(rowIx(el), 1); tap(down); down.focus({ preventScroll: true }); });
        rm.addEventListener('click', () => { tap(rm); remove(rowIx(el)); });
        title.addEventListener('keydown', (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey) return;
          if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(rowIx(el), e.key === 'ArrowUp' ? -1 : 1); title.focus({ preventScroll: true }); }
          else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(rowIx(el)); }
        });
        return { el, ctls, title, up, down, rm };
      };
      const rowIx = (el) => rows.findIndex((r) => r.el === el);
      const renumber = () => {
        rows.forEach((r, i) => {
          r.title.textContent = `${words.card} ${i + 1}`;
          r.el.setAttribute('aria-label', `${words.card} ${i + 1} of ${rows.length}`);
          r.up.setAttribute('aria-disabled', String(i === 0));
          r.down.setAttribute('aria-disabled', String(i === rows.length - 1));
        });
        const n = rows.length;
        addBtn.textContent = n ? words.add : words.first;
        addBtn.hidden = n >= max;
        count.textContent = n ? `${n} of ${max}` : words.none;
        c.el.classList.toggle('empty', !n);
      };
      /** the rows follow the value: a different count rebuilds them (set, clear), the same count only refreshes fields */
      const reconcile = () => {
        const arr = cur();
        if (rows.length !== arr.length) {
          rows.splice(0).forEach((r) => { Object.values(r.ctls).forEach((x) => x.destroy?.()); r.el.remove(); });
          arr.forEach((_, i) => { const r = buildRow(i); rows.push(r); list.appendChild(r.el); });
        }
        arr.forEach((card, i) => Object.entries(rows[i].ctls).forEach(([k, ctl]) => ctl.set(card[k])));
        renumber();
      };
      const add = () => {
        const arr = cur();
        if (arr.length >= max) return;
        arr.push(blank());
        c.value = arr;
        c.touch();
        const r = buildRow(arr.length - 1);
        rows.push(r);
        list.appendChild(r.el);
        renumber();
        c.say();
        opts.onInput?.(arr);
        c.commit();
        r.ctls.label.focus();
      };
      const remove = (i) => {
        const arr = cur();
        if (i < 0 || i >= arr.length) return;
        arr.splice(i, 1);
        c.value = arr;
        c.touch();
        const [r] = rows.splice(i, 1);
        Object.values(r.ctls).forEach((x) => x.destroy?.());
        r.el.remove();
        renumber();
        c.say();
        opts.onInput?.(arr);
        c.commit();
        // focus stays inside: the next card's heading, the one before, or the add button
        (rows[i]?.title ?? rows[i - 1]?.title ?? addBtn).focus({ preventScroll: true });
      };
      const move = (i, by) => {
        const arr = cur(), j = i + by;
        if (i < 0 || j < 0 || j >= arr.length) return false;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        c.value = arr;
        c.touch();
        const [r] = rows.splice(i, 1);
        rows.splice(j, 0, r);
        // the card's element is still in the list while the reference is found: moving down means after the one below
        const ref = by > 0 ? list.children[j]?.nextSibling ?? null : list.children[j] ?? null;
        list.insertBefore(r.el, ref);
        renumber();
        c.say();
        opts.onInput?.(arr);
        c.commit();
        return true;
      };
      addBtn.addEventListener('click', () => { tap(addBtn); add(); });
      c.isEmpty = () => !cur().length;
      c.words = () => { const n = cur().length; return n === 1 ? `1 ${words.card.toLowerCase()}` : `${n} ${words.card.toLowerCase()}s`; };
      c.rest = () => words.none;
      c.paint = () => reconcile();
      return {
        focus: () => { if (rows[0]) rows[0].ctls.label.focus(); else addBtn.focus(); },
        onClear() { rows.splice(0).forEach((r) => { Object.values(r.ctls).forEach((x) => x.destroy?.()); r.el.remove(); }); },
        destroy() { rows.forEach((r) => Object.values(r.ctls).forEach((x) => x.destroy?.())); },
      };
    });
    // get() is always an array in the card shape: [] for none (or nothing yet: the root carries .empty then)
    const raw = api.get;
    api.get = () => (Array.isArray(raw()) ? raw().map(normClient) : []);
    return api;
  }

  /* =====================================================================================
     Final 1, task 09: three more instruments, built from the pieces already here.
     They share make() (value, commit, keys, readout, suggestions), face() (the typed alternative with its unit),
     rail() (the 44 px track and its thumb), the .stone picking row and moveButtons() (the Up and Down pair).
     Nothing here invents a gesture: a drag is always optional, and every answer can be typed or tapped.
     ===================================================================================== */

  /** the picking row behind paths and rank: labelled text choices, 44 px, arrows rove, Space picks, Enter continues.
      It is the whole control in its own right; a diagram beside it only shows what the choice means */
  function optionButtons(c, options, o = {}) {
    const multi = !!o.multi;
    const row = ce('div', `stone-row ${o.cls ?? ''}`.trim());
    row.setAttribute('role', multi ? 'group' : 'radiogroup');
    if (o.label) row.setAttribute('aria-label', o.label);
    if (o.describedBy) row.setAttribute('aria-describedby', o.describedBy);
    const btns = options.map((op) => {
      const b = ce('button', 'stone');
      b.type = 'button';
      b.textContent = op.label;
      b.dataset.v = String(op.v);
      b.setAttribute('role', multi ? 'checkbox' : 'radio');
      b.setAttribute('aria-checked', 'false');
      row.appendChild(b);
      return b;
    });
    /** arrows rove the row; at either end a left or right press is left alone, so it reaches the page's Back and Next */
    const rove = (e, from) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return false;
      const j = btns.indexOf(from);
      const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const flat = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
      if (j < 0 || (flat && (fwd ? j === btns.length - 1 : j === 0))) return false;
      e.preventDefault();
      btns[(j + (fwd ? 1 : -1) + btns.length) % btns.length].focus();
      return true;
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => { o.pick?.(options[i], b); tap(b); });
      b.addEventListener('keydown', (e) => {
        if (e.key === ' ') { e.preventDefault(); o.pick?.(options[i], b); tap(b); }
        else if (e.key === 'Enter') { e.preventDefault(); if (o.enter?.(options[i], b) !== false) c.enter(); }
        else if (e.key === 'Escape') { e.preventDefault(); c.revert(); }
        else rove(e, b);
      });
    });
    return {
      row, btns,
      /** on(value) -> bool; the row keeps one tab stop, on the chosen option or the first */
      paint(on) {
        let first = true, any = false;
        btns.forEach((b, i) => {
          const is = !!on(options[i].v);
          if (is) any = true;
          b.setAttribute('aria-checked', String(is));
          b.setAttribute('aria-pressed', String(is));
        });
        btns.forEach((b, i) => {
          const is = on(options[i].v);
          b.tabIndex = is || (first && !any) ? 0 : -1;
          if (b.tabIndex === 0) first = false;
        });
      },
      focus() { (btns.find((b) => b.tabIndex === 0) ?? btns[0])?.focus(); },
    };
  }
  const normOpts = (list) => (list ?? []).map((o) => (Array.isArray(o) ? { v: o[0], label: o[1], sub: o[2] } : o)).filter((o) => o && o.v !== undefined);
  /** fn(host, opts) called as fn(opts): the same instrument, built but not yet mounted (the shape cards already takes) */
  const hostOpts = (fn) => (a, b) => (a && typeof a === 'object' && !('nodeType' in a) ? fn(a.host ?? null, a) : fn(a, b ?? {}));

  /* ---------- 24. dot density: how many people you could reach ----------
     A field of dots with the count live above it, a rail under it to change that count, and the same typed figure every
     other instrument has, with its unit. The dots are a picture of a size and say so in their own label: they are not
     people, not leads and not a list anybody holds. A typed range ("2,000 to 4,000") is read as a range and the field
     shows the span; get() is then [lo, hi], else the number. Nothing about a dot is clickable as a person. */
  /** "2,400", or a range: "2000-4000", "2,000 to 4,000". A range gives [lo, hi] in order, a figure gives the number */
  const parseCount = (s) => {
    const raw = String(s ?? '').trim();
    if (!raw) return null;
    const parts = raw.split(/\s*(?:to|–|—|\.\.|-)\s*/i).filter((x) => x !== '');
    if (parts.length === 2) {
      const a = parseNum(parts[0]), b = parseNum(parts[1]);
      if (!isNum(a) || !isNum(b)) return null;
      return a <= b ? [Math.max(0, a), Math.max(0, b)] : [Math.max(0, b), Math.max(0, a)];
    }
    return parseNum(raw);
  };
  const isRange = (v) => Array.isArray(v) && isNum(v[0]) && isNum(v[1]);
  const countOf = (v) => (isRange(v) ? Number(v[1]) : isNum(v) ? Number(v) : null);
  const fmtCount = (v) => (isRange(v) ? `${fmtNum(v[0])} to ${fmtNum(v[1])}` : fmtKeep(v));
  /** a round number of people to a dot: 1, 2, 5, 10, 25, 50, 100 and up, so the key line reads plainly */
  const perDot = (hi, maxDots) => {
    const want = Math.max(1, (isNum(hi) ? Number(hi) : 1000) / Math.max(1, maxDots));
    const steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    return steps.find((s) => s >= want) ?? steps[steps.length - 1];
  };
  function dots(host, opts = {}) {
    return make('dots', host, opts, (c) => {
      const unit = opts.unit ?? 'people';
      const [lo, hi] = opts.scale ?? [10, 10000];
      const log = opts.log !== false && lo > 0;
      const [dLo, dHi] = opts.range ?? [Math.max(0, log ? lo / 2 : 0), hi * 2];
      const S = scaleFns(Math.max(log ? 1 : 0, dLo), dHi, log);
      const maxDots = clamp(Number(opts.maxDots) || 120, 20, 400);
      // one dot is a round number taken from the top of the labelled range, so the key line reads plainly and a dot
      // means the same thing however the figure moves
      const per = isNum(opts.per) ? Math.max(1, Number(opts.per)) : perDot(hi, maxDots);
      const cols = clamp(Number(opts.columns) || 20, 6, 30);

      /* the live count is the figure itself: it is typed, it follows the rail while it is dragged, and it carries its
         unit beside it. The readout under the control says what the field measures before there is a figure, and
         stands out of the way once there is one, so the count is never printed twice */
      c.out.classList.add('dots-count');

      const fieldWrap = ce('div', 'dots-field');
      fieldWrap.setAttribute('aria-hidden', 'true');   // the rail and the typed figure carry the value
      fieldWrap.style.setProperty('--cols', String(cols));
      const dotEls = [];
      for (let i = 0; i < maxDots; i++) { const d = ce('i', 'dot'); fieldWrap.appendChild(d); dotEls.push(d); }
      const keyLine = ce('p', 'dots-key small', `Each dot is ${fmtNum(per)} ${per === 1 ? unit.replace(/s$/, '') : unit}`);
      // the claim the dots must never make, in the control's own words, never in a paragraph elsewhere
      const note = ce('p', 'ui-note dots-claim', opts.caption ?? 'The dots show a size, not real people. They are not leads and nobody is listed here.');

      const f = face(c, {
        unit,
        label: opts.typedLabel ?? `${opts.label ?? 'How many people'}, type a number or a range`,
        parse: parseCount, format: fmtCount, minCh: 5,
        invalidWords: 'A number, such as 2,000, or a range such as 2,000 to 4,000',
      });
      const R = rail(c, { ticks: [{ t: S.toT(lo), label: shortNum(lo) }, { t: S.toT(hi), label: shortNum(hi) }] });
      const h = R.handles[0];
      h.setAttribute('aria-label', opts.label ?? 'How many people');
      if (isNum(opts.now)) R.setNow(S.toT(opts.now), `${opts.nowWords ?? 'Now'} ${withUnit(opts.now, unit)}`);
      c.el.append(f.el, fieldWrap, keyLine, R.box, note);

      const words = (v) => {
        if (isRange(v)) return `${fmtNum(v[0])} to ${fmtNum(v[1])} ${unit}`;
        return isNum(v) ? `${fmtNum(v)} ${unit}` : '';
      };
      // the handle speaks the count while it is dragged (aria-valuetext), as every rail does; the readout is the
      // empty state alone, so a screen reader hears the figure once, not twice
      c.words = () => '';
      c.rest = () => opts.restWords ?? `How many ${unit} you could reach`;

      const setTop = (n, fine) => {
        const v = Math.max(0, fine ? fineOf(n) : Math.round(n));
        // a range keeps its span: the rail moves the top and the floor follows it
        if (isRange(c.value)) { const [a, b] = c.value; const gap = b > 0 ? a / b : 0; c.input([Math.max(0, Math.round(v * gap)), v]); }
        else c.input(v);
      };
      let dragging = false, undo = null;
      drag(R.box, {
        start() { undo = c.hold(); dragging = true; c.el.classList.add('active'); },
        move(e) { setTop(S.fromT(R.tOf(e)), true); },
        end(e, i) { if (!i?.grip || i.moved) setTop(S.fromT(R.tOf(e))); dragging = false; c.el.classList.remove('active'); c.commit(); h.focus({ preventScroll: true }); },
        cancel() { undo?.(); dragging = false; c.el.classList.remove('active'); },
      }, { mode: 'x', grip: '.handle' });
      const step = (n) => {
        const v = countOf(c.value) ?? Math.max(1, dLo);
        setTop(log ? v * Math.exp(0.02 * n * Math.log(dHi / Math.max(1, dLo))) : v + 0.02 * n * (dHi - dLo));
      };
      c.keys(h, { step });
      c.keys(f.inp, { step, horizontal: false });
      f.inp.addEventListener('input', () => { const v = f.read(); c.value = v; paintAll(); c.say(); opts.onInput?.(v); });
      [h, f.inp].forEach((x) => {
        x.addEventListener('focus', () => c.el.classList.add('active'));
        x.addEventListener('blur', () => { c.el.classList.remove('active'); c.commit(); });
      });
      c.sync = () => f.show(c.value, true);

      function paintAll() {
        const top = countOf(c.value);
        const floor = isRange(c.value) ? Number(c.value[0]) : top;
        const has = isNum(top);
        const lit = has ? clamp(Math.round(top / per), top > 0 ? 1 : 0, maxDots) : 0;
        const sure = has ? clamp(Math.round((floor ?? top) / per), 0, lit) : 0;
        dotEls.forEach((d, i) => {
          d.classList.toggle('on', i < sure);
          d.classList.toggle('maybe', i >= sure && i < lit);
        });
        fieldWrap.classList.toggle('capped', has && top / per > maxDots);
        const t = has ? S.toT(Math.max(top, 0)) : 0;
        h.style.left = `${t * 100}%`;
        R.band.style.width = `${t * 100}%`;
        c.el.classList.toggle('empty', !has);
        h.setAttribute('aria-valuemin', String(Math.round(dLo)));
        h.setAttribute('aria-valuemax', String(Math.round(dHi)));
        if (has) { h.setAttribute('aria-valuenow', String(top)); h.setAttribute('aria-valuetext', words(c.value)); }
        else { h.removeAttribute('aria-valuenow'); h.setAttribute('aria-valuetext', 'Not set'); }
      }
      c.paint = () => { if (doc.activeElement !== f.inp || dragging) f.show(c.value); paintAll(); };
      c.isEmpty = () => !isNum(countOf(c.value));
      return {
        focus: () => f.inp.focus(),
        onClear() { f.reset(); },
        onSet(v) { return v === null ? null : isRange(v) ? [Math.max(0, Number(v[0])), Math.max(0, Number(v[1]))] : isNum(v) ? Math.max(0, Number(v)) : null; },
        /** the live count as a figure, whatever shape the value has: the top of a range, else the number */
        api: { count: () => countOf(c.value), per: () => per, lit: () => dotEls.filter((d) => d.classList.contains('on') || d.classList.contains('maybe')).length },
      };
    });
  }

  /* ---------- 25. delivery mode: who travels to whom ----------
     Two marks, your business and one customer, and one labelled path between them that takes the direction of the
     answer. The labelled text choices under it are the control: the drawing follows them, never the other way about. */
  const DELIVERY = [
    { v: 'visit', label: 'Customers come to us', line: 'They travel to you', dir: 'in' },
    { v: 'travel', label: 'We travel to customers', line: 'You travel to them', dir: 'out' },
    { v: 'remote', label: 'We work remotely', line: 'Nobody travels', dir: 'both', dash: true },
    { v: 'ship', label: 'We send what we sell', line: 'It goes to them', dir: 'out', parcel: true },
    { v: 'mixed', label: 'A mix of these', line: 'Both ways', dir: 'both' },
  ];
  function paths(host, opts = {}) {
    return make('paths', host, opts, (c) => {
      const given = normOpts(opts.options);
      const options = given.length ? given : DELIVERY;
      const byV = (v) => options.find((o) => sameValue(o.v, v)) ?? null;
      const youWords = opts.youWords ?? 'Your business';
      const themWords = opts.themWords ?? 'Customer';

      const svg = svgEl('svg', { class: 'paths-map', viewBox: '0 0 320 128', role: 'img' });
      svg.setAttribute('aria-hidden', 'true');
      const mark = (x, kind, words) => {
        const g = svgEl('g', { class: `pm-mark ${kind}`, transform: `translate(${x} 20)` });
        if (kind === 'you') {
          g.appendChild(svgEl('path', { class: 'pm-roof', d: 'M-2 14 L22 1 L46 14' }));
          g.appendChild(svgEl('rect', { class: 'pm-body', x: 2, y: 14, width: 40, height: 30, rx: 5 }));
          g.appendChild(svgEl('rect', { class: 'pm-door', x: 17, y: 28, width: 10, height: 16, rx: 2 }));
        } else {
          g.appendChild(svgEl('circle', { class: 'pm-body', cx: 22, cy: 13, r: 8 }));
          g.appendChild(svgEl('path', { class: 'pm-body', d: 'M8 44 a14 14 0 0 1 28 0' }));
        }
        const t = svgEl('text', { class: 'pm-name', x: 22, y: 60, 'text-anchor': 'middle' });
        t.textContent = words;
        g.appendChild(t);
        return g;
      };
      svg.appendChild(mark(14, 'you', youWords));
      svg.appendChild(mark(262, 'them', themWords));
      const track = svgEl('path', { class: 'pm-track', d: 'M74 44 L246 44' });
      const headOut = svgEl('path', { class: 'pm-head out', d: 'M238 38 L247 44 L238 50' });
      const headIn = svgEl('path', { class: 'pm-head in', d: 'M82 38 L73 44 L82 50' });
      const parcel = svgEl('rect', { class: 'pm-parcel', x: 153, y: 37, width: 14, height: 14, rx: 2 });
      const lineWords = svgEl('text', { class: 'pm-line', x: 160, y: 30, 'text-anchor': 'middle' });
      svg.append(track, headOut, headIn, parcel, lineWords);
      c.el.appendChild(svg);

      const lead = opts.lead === false ? null : ce('p', 'ui-lead small', typeof opts.lead === 'string' ? opts.lead : 'Choose how the work reaches them');
      if (lead) { lead.id = `ui-lead-${++tagSeq}`; c.el.appendChild(lead); }
      const pickRow = optionButtons(c, options, {
        cls: 'paths-row',
        label: opts.label ?? 'How the work reaches the customer',
        describedBy: lead?.id,
        pick(o) { c.input(sameValue(c.value, o.v) && opts.clearable ? null : o.v); c.commit(); },
      });
      c.el.appendChild(pickRow.row);

      // the chosen words are on the pressed choice already: the readout adds the direction, not a second copy of them
      c.words = () => byV(c.value)?.line ?? '';
      c.rest = () => opts.restWords ?? 'How the work reaches the customer';
      c.paint = () => {
        const o = byV(c.value);
        pickRow.paint((v) => sameValue(c.value, v));
        c.el.classList.toggle('empty', !o);
        const dir = o?.dir ?? '';
        track.classList.toggle('dashed', !!o?.dash);
        track.classList.toggle('set', !!o);
        headOut.style.display = dir === 'out' || dir === 'both' ? '' : 'none';
        headIn.style.display = dir === 'in' || dir === 'both' ? '' : 'none';
        parcel.style.display = o?.parcel ? '' : 'none';
        lineWords.textContent = o ? o.line : '';
        svg.setAttribute('aria-label', o ? `${youWords} and ${lowerFirst(themWords)}: ${lowerFirst(o.line)}` : `${youWords} and ${lowerFirst(themWords)}`);
      };
      return { focus: () => pickRow.focus() };
    });
  }

  /* ---------- 26. rank: what is chosen becomes an ordered list ----------
     Pick from the row; each pick joins a numbered list under it, in the order it will be worked through. Up and Down
     move a line, Remove takes it out, and the number beside each line is the answer, written not implied. */
  function rank(host, opts = {}) {
    return make('rank', host, opts, (c) => {
      const options = normOpts(opts.options);
      const labelOf = (id) => options.find((o) => sameValue(o.v, id))?.label ?? String(id);
      const max = isNum(opts.max) ? Number(opts.max) : 0;
      const moveWords = opts.moveWords ?? ['Move up', 'Move down'];
      const removeWords = opts.removeWords ?? 'Remove';
      const cur = () => (Array.isArray(c.value) ? c.value.filter((id) => options.some((o) => sameValue(o.v, id))) : []);

      const lead = opts.lead === false ? null : ce('p', 'ui-lead small', typeof opts.lead === 'string' ? opts.lead : 'Choose the ones you will use');
      if (lead) { lead.id = `ui-lead-${++tagSeq}`; c.el.appendChild(lead); }
      const pickRow = optionButtons(c, options, {
        multi: true,
        cls: 'rank-row',
        label: opts.label ?? 'Choices',
        describedBy: lead?.id,
        pick(o) {
          const arr = cur();
          const i = arr.findIndex((x) => sameValue(x, o.v));
          if (i >= 0) arr.splice(i, 1);
          else { if (max && arr.length >= max) return; arr.push(o.v); }
          c.input(arr);
          c.commit();
        },
      });
      c.el.appendChild(pickRow.row);

      const orderLead = ce('p', 'rank-lead small', opts.orderWords ?? 'In order, most important first');
      orderLead.id = `ui-rank-${++tagSeq}`;
      const list = ce('ol', 'rank-list');
      list.setAttribute('aria-labelledby', orderLead.id);
      c.el.append(orderLead, list);

      /** one step up or down; at either end nothing moves and nothing is said */
      const shift = (id, by) => {
        const arr = cur();
        const i = arr.indexOf(id), j = i + by;
        if (i < 0 || j < 0 || j >= arr.length) return false;
        arr.splice(i, 1);
        arr.splice(j, 0, id);
        c.input(arr);
        c.commit();
        return true;
      };
      const drop = (id) => { c.input(cur().filter((x) => x !== id)); c.commit(); };
      const rows = new Map();
      const rowFor = (id) => {
        let r = rows.get(id);
        if (r) return r;
        const li = ce('li', 'rank-item');
        const n = ce('span', 'rank-n tabular');
        const name = ce('span', 'rank-name', labelOf(id));
        const moves = moveButtons(() => labelOf(id), (by) => shift(id, by), { words: moveWords, cls: 'ui-moves' });
        const out = ce('button', 'rank-drop');
        out.type = 'button';
        out.textContent = removeWords;
        out.setAttribute('aria-label', `${removeWords}: ${labelOf(id)}`);
        out.addEventListener('click', () => { drop(id); tap(out); pickRow.focus(); });
        li.append(n, name, moves.el, out);
        // Shift with Up or Down is the keyboard's short way, the same as in the sorting zones
        li.addEventListener('keydown', (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey) return;
          if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const held = doc.activeElement;
            const cls = held?.className ?? '';
            if (shift(id, e.key === 'ArrowUp' ? -1 : 1)) tap(li);
            const back = rows.get(id)?.li?.querySelector(cls.includes('down') ? '.sort-move.down' : cls.includes('up') ? '.sort-move.up' : '.sort-move.up');
            back?.focus({ preventScroll: true });
          } else if (e.key === 'Enter') { e.preventDefault(); c.enter(); }
        });
        r = { li, n, moves, out };
        rows.set(id, r);
        return r;
      };

      // the numbered list is the answer on screen: repeating it under the control would say everything twice
      c.words = () => '';
      c.rest = () => opts.restWords ?? 'Nothing chosen yet';
      c.paint = () => {
        const arr = cur();
        pickRow.paint((v) => arr.some((x) => sameValue(x, v)));
        arr.forEach((id, i) => {
          const r = rowFor(id);
          r.n.textContent = String(i + 1);
          r.moves.ends(i === 0, i === arr.length - 1);
          r.li.setAttribute('aria-label', `${i + 1} of ${arr.length}, ${labelOf(id)}`);
          const at = list.children[i] ?? null;
          if (at !== r.li) list.insertBefore(r.li, at);
        });
        [...rows.entries()].forEach(([id, r]) => { if (!arr.includes(id) && r.li.parentNode) r.li.remove(); });
        list.hidden = !arr.length;
        orderLead.hidden = !arr.length;
        c.el.classList.toggle('empty', !arr.length);
      };
      return {
        focus: () => pickRow.focus(),
        onSet(v) { return Array.isArray(v) ? v.filter((id) => options.some((o) => sameValue(o.v, id))) : v === null ? null : []; },
      };
    });
  }

  M.feel.pulse = pulseToCore;
  M.ui = Object.assign(M.ui ?? {}, {
    slider, pair, fee, stones, cards, tenStones, ring, keptRing, arc, capacity, shelves, sorter, ledger, sort, tableRing, twoSided, socket, dial, monthsArc, line, field,
    clientCards, hint, filePick,
    // (host, opts) as every instrument takes, and (opts) alone as cards does, so a caller that builds before it mounts works
    dots: hostOpts(dots), paths: hostOpts(paths), rank: hostOpts(rank),
    parseNum, parseCount, fmtNum, fmtKeep, fmtCount, withUnit, shortNum,
  });
})();
