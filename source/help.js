/* help.js (Mercer 12, owner (a) shell, new in Refine 1, rebuilt in Rebuild 1): the shell's own small behaviours. Loaded last.
   C04  M.overlay: one top-level overlay at a time. help, the wheel's panel, the example, the inspect chip and the phone's
        opened tree register here; canopy's share dialog (#share) is watched and counted too. Opening one closes the
        others; Escape closes the top one and returns focus to what opened it.
   R11  #wheel, the progress wheel at the bottom right: six segments from M.progress() (equal segments, a section index),
        done filled, the current one outlined with the part answered filled, the rest translucent; "Customers · 3 of 6"
        beside it at desktop and in its accessible name everywhere. A press opens #wheel-panel upward: the section list
        (a done section opens for review through M.reopenSection(id); "Not needed" with its reason), the save state
        ("Saved on this device" only after a write that succeeded, from mercer:saved), Save and exit, Download progress
        file where flow provides it, Forget this visit with a confirmation that names its scope.
   R10  #help and #help-panel: a modal dialog (focus trapped, Escape closes, focus returns to what opened it). Opening it
        reads nothing and writes nothing in M.state. M.shell.openHelp('privacy') opens it at Method and privacy.
        "Show me the tree" calls M.intro.open({ replay: true }), which plays the tour the first run no longer shows,, which comes back with every answer as it was.
   C15  Help is short and names every way to do a thing: pointer, touch and keyboard.
   R7   M.privacyNote(el): the small line with a leader to the field it speaks for.
   R16  #tree-tools (zoom in, zoom out, fit) through M.tree, the #inspect chip from the tree's 'inspect' event with
        M.inspect(id) and a Change press (M.reopen), one first-use hint; R23: the phone's "Your tree" (#tree-expand) and
        Close (#tree-close), and body[data-keyboard] while the soft keyboard is up. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});
const doc = document;
const $ = (s, r = doc) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const stageNow = () => (typeof M.stage === 'string' ? M.stage : doc.body.dataset.stage) || '';
const tree = () => (M.tree && typeof M.tree === 'object' ? M.tree : M.T && typeof M.T === 'object' ? M.T : null);
const phone = () => doc.body.dataset.clearing === 'bottom';
const reduce = () => (typeof M.feel?.reduced === 'function' ? M.feel.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const play = (name, o) => { try { M.feel?.play?.(name, o); } catch (e) { /* sound is a nicety */ } };
const NS = 'http://www.w3.org/2000/svg';
const CLOSE_X = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const PRIVACY = () => (Array.isArray(M.PRIVACY) && M.PRIVACY.length === 4 ? M.PRIVACY : [
  'Mercer sends none of your answers anywhere. The page loads its fonts and its drawing and PDF libraries from Google Fonts, jsDelivr and cdnjs when it opens.',
  'Ask Claude is optional. If you use it, your briefing goes to the host’s model, after you agree.',
  'Downloads are files saved on your device.',
  'Your answers are saved in this browser as you go, so you can come back to them; Saving off in the wheel panel stops that.',
]);
const JOURNEY = ['roots', 'section', 'close', 'explore', 'harvest', 'plan'];
const HALO_STAGES = ['roots', 'section', 'close', 'explore', 'harvest', 'plan', 'ready'];

/* ============ Task 02: the layout regions ============
   scene.css names five regions and gives them starting values; this measures the two that can change under the page's
   feet, the header's real height and the question region's inner edge, and writes them back as --header-h and
   --keep-right. Everything that reserves space under the header, and the mask that keeps tree captions out of the
   question region, follow those two numbers, so a wrapped header, an enlarged text size or a rotated phone moves every
   region together instead of leaving one of them behind. M.shell.regions() hands the same rectangles to anyone placing
   something by hand: the tree's labels, the inspect chip, the slides' leader labels. */
const headEl = $('#top');
/* the question region is whichever of these hosts is on screen: the clearing during the interview and the results, the
   slides before it, the homepage, the example. One of them is always the box the words stand in; when none is (a stage
   between two, or a test page), the layout's own share stands in, so the region is never measured as nothing. */
const QUESTION_HOSTS = ['#clearing', '#intro', '#arrival', '#example-panel'];
const region = { header: { left: 0, top: 0, right: 0, bottom: 68 }, question: { left: 0, top: 68, right: 0, bottom: 0 }, tree: { left: 0, top: 68, right: 0, bottom: 0 } };
function questionRect() {
  for (const s of QUESTION_HOSTS) {
    const el = $(s);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}
function measureRegions() {
  const w = window.innerWidth, h = window.innerHeight;
  const hh = Math.max(44, Math.round(headEl ? headEl.getBoundingClientRect().height : 68));
  const root = doc.documentElement;
  root.style.setProperty('--header-h', `${hh}px`);
  region.header = { left: 0, top: 0, right: w, bottom: hh };
  const box = questionRect();
  if (phone()) {
    // the regions stack: the tree has the strip above the sheet, the question the rest
    const top = Math.round(box ? box.top : h * 0.52);
    region.question = { left: 0, top, right: w, bottom: h };
    region.tree = { left: 0, top: hh, right: w, bottom: top };
    root.style.setProperty('--keep-bottom', `${top}px`);
  } else {
    /* the cockpit brief, 3.1: three zones across. The chapter rail at the left edge, the question column at the right edge,
       the tree between them. --keep-right is the question column's inner edge (no caption is painted right of it) and
       --tree-left the rail's outer edge; a page whose question host spans the width (the results, where the column is the
       stage's own) reports the width, and the tree keeps its own column there. */
    const rail = $('#rail');
    const rr = rail && !rail.hidden ? rail.getBoundingClientRect() : null;
    let railW = rr && rr.width > 0 && rr.width < w * 0.5 ? Math.round(rr.right) : 0;
    const colW = Math.min(440, Math.max(360, Math.round(w * 0.3)));
    /* a host anchored at the left edge that stands most of the height (the example panel, the homepage's panel) is a
       column too: the tree keeps to its right and no question column is reserved at the right, so the example tree is
       never under the example's words. A short host at the top left (the example's collapsed bar) only lowers the tree's top. */
    const hosts = QUESTION_HOSTS.map((s) => $(s)).filter(Boolean).map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
    const columns = hosts.filter((r) => r.left <= 1 && r.right < w * 0.8 && r.height > h * 0.5);
    const leftHost = columns.length ? columns.reduce((a, b) => (b.right > a.right ? b : a)) : null;
    const bars = hosts.filter((r) => r.left <= 1 && r.top < hh + 8 && r.height < h * 0.3 && r.right < w * 0.8);
    const leftBar = bars.length ? bars.reduce((a, b) => (b.bottom > a.bottom ? b : a)) : null;
    if (leftHost) railW = Math.max(railW, Math.round(leftHost.right));
    const left = leftHost ? w : Math.round(box ? (box.left > 0 ? box.left : w) : w - colW);
    /* the polish pack, 12: at the results the stage navigator stands under the header, over the tree; the tree's region
       starts under it, so the goal line's label never runs under the navigator */
    const nav = $('#plan-nav');
    const nr = nav && !nav.hidden && nav.isConnected ? nav.getBoundingClientRect() : null; // a fixed navigator has no offsetParent
    let treeTop = nr && nr.height > 0 && nr.bottom > hh && nr.bottom < h * 0.4 ? Math.round(nr.bottom + 8) : hh;
    if (leftBar) treeTop = Math.max(treeTop, Math.round(leftBar.bottom + 8));
    region.question = { left, top: hh, right: w, bottom: h };
    region.tree = { left: railW, top: treeTop, right: left, bottom: h };
    root.style.setProperty('--keep-right', `${left}px`);
    root.style.setProperty('--tree-left', `${railW}px`);
  }
  return region;
}
const regions = () => ({ header: { ...region.header }, question: { ...region.question }, tree: { ...region.tree } });
/** true when `r` (a DOMRect or a plain box) reaches into the question region: what a label or a chip must not do */
function inQuestion(r) {
  const q = region.question;
  return !!r && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top;
}
window.addEventListener('resize', measureRegions);
/* the polish pack, 12: a stage change moves the regions too (the rail leaves at the results, the navigator arrives), so
   the measurement follows body[data-stage] and runs again once that stage's layout has settled */
try {
  if (typeof MutationObserver === 'function' && doc.body) {
    new MutationObserver(() => { measureRegions(); setTimeout(measureRegions, 450); }).observe(doc.body, { attributes: true, attributeFilter: ['data-stage'] });
  }
} catch (e) { /* the resize listener stands */ }
doc.addEventListener('mercer:stage', () => measureRegions());
doc.addEventListener('mercer:question', () => measureRegions());
try { if (typeof ResizeObserver === 'function' && headEl) new ResizeObserver(measureRegions).observe(headEl); } catch (e) { /* the resize listener stands */ }

/* ============ Task 06 (D11): the halo ============
   One decorative layer (#halo, scene.css) held on the tree's own centre. It comes in with the tree on the second slide
   and stays through questioning and the results, as a frame and a focus treatment. It never carries a number or a
   scale, so it cannot read as a score. Under reduced motion it is still; on a tab nobody is looking at it stops. */
const haloEl = $('#halo');
let haloOn = false, haloRaf = 0;
function placeHalo() {
  haloRaf = 0;
  if (!haloEl || !haloOn) return;
  const t = tree();
  const R = region.tree;
  let x = (R.left + R.right) / 2, y = (R.top + R.bottom) * 0.52;
  try { const a = t?.anchor?.('trunk'); if (a && isFinite(a.x) && isFinite(a.y)) { x = a.x; y = a.y - Math.min(220, (R.bottom - R.top) * 0.22); } } catch (e) { /* the region's own middle */ }
  const r = Math.round(Math.max(220, Math.min(560, (R.right - R.left) * 0.62)));
  const s = doc.documentElement.style;
  s.setProperty('--halo-x', `${Math.round(x)}px`);
  s.setProperty('--halo-y', `${Math.round(y)}px`);
  s.setProperty('--halo-r', `${r}px`);
}
const haloTick = () => { if (!haloRaf) haloRaf = requestAnimationFrame(placeHalo); };
function halo(on) {
  haloOn = !!on;
  if (haloOn) { doc.body.dataset.halo = '1'; measureRegions(); placeHalo(); }
  else delete doc.body.dataset.halo;
}
window.addEventListener('resize', haloTick);
doc.addEventListener('mercer:question', haloTick);
doc.addEventListener('mercer:stage', haloTick);
doc.addEventListener('mercer:treeview', haloTick);

/* ============ Task 06: a small pointer-responsive depth ============
   Only on a device with a fine pointer that can hover, and never under reduced motion. It writes --px and --py on body,
   between -1 and 1; scene.css moves two decorative layers by a few pixels from them. Nothing readable and nothing
   pressable is moved, so a moving pointer can never move a target or change an answer. On touch there is no hover to
   depend on: base.css answers a press instead. It stops on a tab nobody is looking at. */
(function depth() {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let raf = 0, nx = 0, ny = 0;
  const write = () => { raf = 0; doc.body.style.setProperty('--px', nx.toFixed(3)); doc.body.style.setProperty('--py', ny.toFixed(3)); };
  doc.addEventListener('pointermove', (e) => {
    if (reduce() || doc.hidden || e.pointerType !== 'mouse') return;
    nx = clamp((e.clientX / Math.max(1, window.innerWidth)) * 2 - 1, -1, 1);
    ny = clamp((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1, -1, 1);
    if (!raf) raf = requestAnimationFrame(write);
  }, { passive: true });
})();
/* decorative motion suspends when the tab is hidden, and the pointer's offset goes back to nothing */
doc.addEventListener('visibilitychange', () => {
  if (doc.hidden) { doc.body.dataset.away = '1'; doc.body.style.setProperty('--px', '0'); doc.body.style.setProperty('--py', '0'); }
  else { delete doc.body.dataset.away; haloTick(); }
});

/* ============ C04: one overlay at a time ============ */
const stack = []; // [{ name, close, el, opener }]
const overlay = {
  open(name, api) {
    if (!name || !api || typeof api.close !== 'function') return;
    // whatever else is open closes first (silently: the new one takes the focus)
    [...stack].forEach((o) => { if (o.name !== name) { try { o.close(false); } catch (e) { /* gone */ } overlay.close(o.name, { silent: true }); } });
    const at = stack.findIndex((o) => o.name === name);
    if (at >= 0) stack.splice(at, 1);
    stack.push({ name, close: api.close, el: api.el ?? null, opener: api.opener ?? null });
  },
  /** close(name): asks the overlay to close (its own close does the work); { silent } only drops the record */
  close(name, o) {
    const at = stack.findIndex((x) => x.name === name);
    if (at < 0) return false;
    const rec = stack[at];
    stack.splice(at, 1);
    if (!(o && o.silent)) { try { rec.close(true); } catch (e) { /* gone */ } }
    return true;
  },
  closeTop() { const top = stack[stack.length - 1]; if (!top) return false; overlay.close(top.name); return true; },
  closeAll() { [...stack].reverse().forEach((o) => overlay.close(o.name)); },
  top() { const top = stack[stack.length - 1]; return top ? top.name : null; },
  isOpen(name) { return stack.some((o) => o.name === name); },
};
M.overlay = overlay;
/* Escape closes the top overlay and goes no further. The help dialog and the share dialog handle their own Escape (they
   are dialogs with their own traps), so they are left to it; everything else is closed here */
doc.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const top = overlay.top();
  if (!top || top === 'help' || top === 'share') return;
  if (e.target && e.target.closest && e.target.closest('#help-panel, #share')) return;
  e.preventDefault(); e.stopPropagation();
  overlay.close(top);
}, true);
/* canopy's share dialog is a sibling overlay: counted when it shows, so nothing else opens over it and it closes under anything else */
(function watchShare() {
  let mo = null;
  const hook = (el) => {
    if (!el || el.dataset.overlayHooked) return;
    el.dataset.overlayHooked = '1';
    const sync = () => {
      if (!el.hidden) overlay.open('share', { el, close: () => { el.hidden = true; const sc = $('#share-scrim'); if (sc) sc.hidden = true; } });
      else if (overlay.isOpen('share')) overlay.close('share', { silent: true });
    };
    try { new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['hidden'] }); } catch (e) { /* no observer */ }
    sync();
  };
  hook($('#share'));
  try { mo = new MutationObserver(() => { const el = $('#share'); if (el) { hook(el); if (mo && el.dataset.overlayHooked) { mo.disconnect(); mo = null; } } }); mo.observe(doc.body, { childList: true }); } catch (e) { /* no observer */ }
})();
doc.addEventListener('mercer:stage', () => { if (overlay.top() && overlay.top() !== 'share') overlay.closeAll(); });

/* ============ R11: the wheel ============ */
const wheel = $('#wheel'), wheelFace = wheel ? $('.wheel-face', wheel) : null, wheelIndex = $('#wheel-index'), wheelText = $('#wheel-text');
const wheelPanel = $('#wheel-panel');
const R = 32, C = 2 * Math.PI * R, GAP = 3.6;
let segEls = [];
let lastStages = null;
function buildSegs(n) {
  if (!wheelFace) return;
  wheelFace.innerHTML = '';
  segEls = [];
  const g = doc.createElementNS(NS, 'g');
  g.setAttribute('transform', 'rotate(-90 40 40)');
  for (let i = 0; i < n; i++) {
    const seg = doc.createElementNS(NS, 'g');
    seg.setAttribute('class', 'seg');
    const mk = (cls, r) => { const c = doc.createElementNS(NS, 'circle'); c.setAttribute('cx', '40'); c.setAttribute('cy', '40'); c.setAttribute('r', String(r)); c.setAttribute('pathLength', C.toFixed(3)); c.setAttribute('class', cls); seg.appendChild(c); return c; };
    const track = mk('seg-track', R), fill = mk('seg-fill', R), edgeOut = mk('seg-edge', R + 4.5), edgeIn = mk('seg-edge', R - 4.5);
    g.appendChild(seg);
    segEls.push({ seg, track, fill, edges: [edgeOut, edgeIn] });
  }
  wheelFace.appendChild(g);
}
/* flow's rows: state done | active | upcoming, and (rebuild 1) reopened (a done section with a new follow-up), optional
   (only refinements remain), and notNeeded with a reason. The wheel draws reopened and optional as still to come. */
const stateOf = (s) => {
  if (s.state === 'skipped' || s.notNeeded === true || s.state === 'not-needed') return 'skipped';
  if (s.state === 'active') return 'active';
  if (s.state === 'reopened') return 'reopened';
  if (s.state === 'optional') return 'optional';
  if (s.state === 'done' || (+s.done || 0) >= 1) return 'done';
  return 'upcoming';
};
const drawnAs = (st) => (st === 'reopened' || st === 'optional' ? 'upcoming' : st);
/** the six equal segments, from the list given (the tutorial's demonstration) or M.progress() */
function fallbackStages() {
  const route = M.state?.route === 'starter' ? 'starter' : 'owner';
  let names = null;
  try { const s = M.sectionsFor?.(route); if (Array.isArray(s) && s.length) names = s.map((x) => ({ id: x.id, name: x.name, hue: x.hue })); } catch (e) { names = null; }
  if (!names) names = (route === 'starter' ? ['Aim', 'Foundations', 'Opportunities', 'Test', 'Launch', 'Plan'] : ['Aim', 'Foundations', 'Customers', 'Delivery', 'Leverage', 'Plan']).map((n, i) => ({ id: n.toLowerCase(), name: n, hue: ['--sec-crown', '--sec-ground', '--sec-reach', '--sec-delivery', '--sec-you', '--sec-crown'][i] }));
  return names.map((n, i) => ({ ...n, share: 1 / 6, done: 0, state: i === 0 ? 'active' : 'upcoming' }));
}
function readStages(list) {
  let stages = list;
  if (!stages) {
    if (M.intro?.running?.()) return lastStages; // the tutorial is showing its own wheel; it hands it back when it ends
    try { stages = typeof M.progress === 'function' ? M.progress() : null; } catch (e) { stages = null; }
  }
  if (!Array.isArray(stages) || !stages.length) stages = fallbackStages();
  return stages;
}
function wheelWords(stages) {
  const k = stages.findIndex((s) => stateOf(s) === 'active');
  let i = k;
  if (i < 0) { for (let j = stages.length - 1; j >= 0; j--) if (stateOf(stages[j]) === 'done') { i = j; break; } }
  if (i < 0) i = 0;
  return { i, name: String(stages[i].name ?? ''), n: stages.length, allDone: stages.every((s) => stateOf(s) === 'done' || stateOf(s) === 'skipped') };
}
function paintWheel(list) {
  if (!wheel) return;
  const stages = readStages(list);
  if (!stages) return;
  lastStages = stages;
  if (segEls.length !== stages.length) buildSegs(stages.length);
  const len = C / stages.length - GAP;
  stages.forEach((s, i) => {
    const { seg, track, fill, edges } = segEls[i];
    const st = drawnAs(stateOf(s));
    const done = st === 'done' ? 1 : st === 'active' ? clamp(+s.done || 0, 0, 1) : 0;
    const hue = typeof s.hue === 'string' && s.hue.startsWith('--') ? `var(${s.hue})` : s.hue || 'var(--tint)';
    const pos = i * (len + GAP) + GAP / 2;
    seg.dataset.state = st;
    seg.style.setProperty('--hue', hue);
    track.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${C.toFixed(2)}`);
    track.setAttribute('stroke-dashoffset', (-pos).toFixed(2));
    fill.setAttribute('stroke-dasharray', `${(len * done).toFixed(2)} ${C.toFixed(2)}`);
    fill.setAttribute('stroke-dashoffset', (-pos).toFixed(2));
    edges.forEach((c) => { c.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${C.toFixed(2)}`); c.setAttribute('stroke-dashoffset', (-pos).toFixed(2)); });
  });
  const w = wheelWords(stages);
  const words = `${w.name} · ${w.i + 1} of ${w.n}`;
  if (wheelText) wheelText.textContent = words;
  if (wheelIndex) wheelIndex.textContent = `${w.i + 1}/${w.n}`;
  wheel.setAttribute('aria-label', `Progress: ${w.name}, section ${w.i + 1} of ${w.n}${w.allDone ? ', all done' : ''}. Opens the section list`);
  if (wheelPanel && !wheelPanel.hidden) paintPanelList(stages);
}
function syncWheel() {
  if (!wheel) return;
  const show = JOURNEY.includes(stageNow()) && !M.intro?.running?.();
  wheel.hidden = !show;
  if (!show && wheelPanel && !wheelPanel.hidden) closeWheel(false);
}
/* Task 06: on a stage change the active segment lights once and then settles. One pass, never a perpetual flash, and
   nothing at all under reduced motion (the segment's own colour and the words in the panel carry the same meaning). */
let wakeTimer = 0;
function wakeSegment() {
  if (!wheel || reduce() || doc.hidden) return;
  clearTimeout(wakeTimer);
  delete wheel.dataset.wake;
  void wheel.offsetWidth;
  wheel.dataset.wake = '1';
  wakeTimer = setTimeout(() => { delete wheel.dataset.wake; }, 1000);
}
doc.addEventListener('mercer:progress', (e) => paintWheel(M.intro?.running?.() ? undefined : e.detail?.stages));
doc.addEventListener('mercer:question', () => paintWheel());
doc.addEventListener('mercer:stage', () => { syncWheel(); paintWheel(); wakeSegment(); });
doc.addEventListener('mercer:revision', () => paintWheel());

/* ---------- the save state, from the events flow sends: mercer:save { on, ok, reason? } after enable, disable, exit and
   forget, and after a write that failed; mercer:restored { at } when a copy came back; mercer:saved { ok, at } where a
   writer sends it. "Saved on this device" needs a write that succeeded (ok true) and nothing failed since. ---------- */
const saved = { ok: false, at: null, on: false, reason: '' };
const savedWords = () => {
  if (saved.on && saved.ok) { let when = ''; try { when = saved.at ? new Date(saved.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''; } catch (e) { when = ''; } return `Saved on this device${when ? ` at ${when}` : ''}.`; }
  if (saved.on && saved.reason) return `Save on this device is on, but the last write failed (${saved.reason}). Download a progress file to keep your answers.`;
  if (saved.on) return 'Save on this device is on. Nothing has been written yet.';
  return 'Saving is off. Closing this visit loses progress you have not downloaded.';
};
const markWrite = (d) => {
  if (d.ok === true) { saved.ok = true; saved.reason = ''; saved.at = d.at ?? d.savedAt ?? new Date().toISOString(); }
  else if (d.ok === false) { saved.ok = false; saved.reason = typeof d.reason === 'string' ? d.reason : 'not saved'; }
};
doc.addEventListener('mercer:saved', (e) => { const d = e.detail || {}; saved.on = true; markWrite({ ...d, ok: d.ok !== false }); paintPanelSave(); });
doc.addEventListener('mercer:save', (e) => { const d = e.detail || {}; saved.on = d.on !== false; if (!saved.on) { saved.ok = false; saved.at = null; saved.reason = ''; } else markWrite(d); paintPanelSave(); });
doc.addEventListener('mercer:restored', (e) => { saved.on = true; saved.ok = true; saved.reason = ''; saved.at = e.detail?.at ?? saved.at; paintPanelSave(); });
try { if (M.save?.on && M.save?.wrote) { saved.on = true; saved.ok = true; } else if (M.save?.on) saved.on = true; } catch (e) { /* no save yet */ }

/* ---------- the panel ---------- */
let wheelFocus = null;
function stateWord(st) { return st === 'done' ? 'Done' : st === 'active' ? 'Now' : st === 'skipped' ? 'Not needed' : st === 'reopened' ? 'Reopened' : st === 'optional' ? 'Optional' : 'To come'; }
function paintPanelList(stages) {
  const list = wheelPanel && $('.wheel-list', wheelPanel);
  if (!list) return;
  const canReview = typeof M.reopenSection === 'function';
  list.innerHTML = stages.map((s, i) => {
    const st = stateOf(s);
    const hue = typeof s.hue === 'string' && s.hue.startsWith('--') ? `var(${s.hue})` : s.hue || 'var(--tint)';
    const reason = st === 'skipped' && s.reason ? `<span class="wl-why">${esc(s.reason)}</span>` : '';
    const act = st === 'done' && canReview ? `<button type="button" class="glass wl-review" data-review="${esc(s.id)}" aria-label="Review ${esc(s.name)}">Review</button>` : `<span class="wl-state">${stateWord(st)}</span>`;
    return `<li data-state="${st}" style="--hue: ${hue}"${st === 'active' ? ' aria-current="step"' : ''}><i class="dot"></i><span class="wl-name">${esc(s.name)}<span class="sr-only">, ${i + 1} of ${stages.length}, ${stateWord(st)}</span></span>${act}${reason}</li>`;
  }).join('');
  list.querySelectorAll('[data-review]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.review;
    closeWheel(false);
    try { M.reopenSection(id); } catch (e) { /* stays */ }
  }));
}
function paintPanelSave() {
  const el = wheelPanel && $('.wheel-save', wheelPanel);
  if (!el) return;
  el.textContent = savedWords();
  el.classList.toggle('is-on', saved.on && saved.ok);
}
/* the progress file: flow's exportFile() gives the text (a download here), download() where a writer does it itself */
const canDownload = () => typeof (M.save?.download ?? M.save?.exportFile ?? M.progressFile?.download) === 'function';
function saveText(name, text) {
  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a'); a.href = url; a.download = name; doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (e) { return false; }
}
function downloadProgress() {
  try {
    if (typeof M.save?.download === 'function') return M.save.download() !== false;
    if (typeof M.progressFile?.download === 'function') return M.progressFile.download() !== false;
    if (typeof M.save?.exportFile === 'function') { const text = M.save.exportFile(); return typeof text === 'string' && saveText(`mercer-progress-${new Date().toISOString().slice(0, 10)}.json`, text); }
  } catch (e) { return false; }
  return false;
}
/** what the file holds, in a line, from flow's review() where it exists */
function reviewLine() {
  try { const r = M.save?.review?.(); if (r && Array.isArray(r.lines) && r.lines.length) return `It holds ${r.lines.join('; ')}.`; } catch (e) { /* no review */ }
  return 'It holds your answers and your plan so far, as a JSON file for this page to read back.';
}
function confirmBox(text, yes, onYes) {
  const box = $('.wheel-confirm', wheelPanel);
  if (!box) return;
  box.hidden = false;
  box.innerHTML = `<p>${esc(text)}</p><div class="wheel-acts"><button type="button" class="glass glass-on" id="wl-yes">${esc(yes)}</button><button type="button" class="glass" id="wl-no">Cancel</button></div>`;
  $('#wl-yes', box).addEventListener('click', onYes);
  $('#wl-no', box).addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; $('#wl-exit', wheelPanel)?.focus(); });
  $('#wl-yes', box).focus();
}
function sayError(text) {
  const box = $('.wheel-confirm', wheelPanel);
  if (!box) return;
  box.hidden = false;
  box.innerHTML = `<p class="is-error">${esc(text)}</p>`;
}
function leaveToStart() {
  closeWheel(false);
  try { M.go?.('arrival'); } catch (e) { /* stays */ }
  if (doc.body.dataset.stage !== 'arrival') { doc.body.dataset.stage = 'arrival'; try { doc.dispatchEvent(new CustomEvent('mercer:stage', { detail: { stage: 'arrival', section: null } })); } catch (e) { /* older browsers */ } }
}
const KEEP = () => (canDownload() ? ' Download a progress file to keep your answers.' : '');
/** Save and exit: the write completes first, then the homepage. flow's exit() does both where it exists. Saving off is
    turned on by this deliberate press, after the words say so. */
function saveAndExit() {
  const run = async () => {
    if (typeof M.save?.exit === 'function') {
      let r = null;
      try { r = await M.save.exit(); } catch (e) { r = { ok: false }; }
      if (r && r.ok === false) { sayError(r.reason || `The save did not complete. Your answers are still here.${KEEP()}`); return; }
      if (doc.body.dataset.stage !== 'arrival') leaveToStart(); else closeWheel(false);
      return;
    }
    let ok = false;
    try { if (!M.save?.on && M.save?.enable) ok = M.save.enable() !== false; else { const fn = M.save?.flush ?? M.save?.write; ok = typeof fn === 'function' ? fn() !== false : true; } } catch (e) { ok = false; }
    if (ok) leaveToStart(); else sayError(`The save did not complete. Your answers are still here.${KEEP()}`);
  };
  if (M.save?.on) { run(); return; }
  confirmBox('Saving is off. Save and exit turns on Save on this device, stores your answers in this browser, and returns to the start.', 'Turn on saving and exit', run);
}
/** Forget this visit: the confirmation names its scope (flow's own words where it has them), then flow's forget with
    { confirmed: true }, then a fresh page (M.restart, or a reload) */
function forgetVisit() {
  let scope = 'Reset progress removes the saved session from this browser, clears the answers on screen and returns to the start. It does not recall a plan you downloaded or a brief you sent.';
  try { const s = M.save?.forgetScope?.(); if (typeof s === 'string' && s) scope = `${s} The answers on screen go too.`; } catch (e) { /* the shell's words */ }
  confirmBox(scope, 'Reset progress', () => {
    try { M.save?.forget?.({ confirmed: true }); } catch (e) { /* the key may stay */ }
    closeWheel(false);
    try { const fn = M.restart ?? M.reset; if (typeof fn === 'function') { fn(); leaveToStart(); return; } } catch (e) { /* reload instead */ }
    try { location.reload(); } catch (e) { leaveToStart(); }
  });
}
/** Download progress file: a line on what it holds first, then the file */
function offerDownload() {
  confirmBox(`${reviewLine()} No source documents and no credentials.`, 'Download the file', () => {
    const box = $('.wheel-confirm', wheelPanel);
    if (downloadProgress()) { if (box) { box.hidden = true; box.innerHTML = ''; } play('done', { gain: 0.4 }); }
    else sayError('The file was not saved.');
  });
}
function panelHTML() {
  const route = M.state?.route === 'starter' ? 'I don’t run a business yet' : M.state?.route === 'owner' ? 'I run a business' : '';
  return `
    <div class="help-head"><h2 id="wheel-title">Where you are${route ? ` · ${esc(route)}` : ''}</h2><button type="button" class="help-close" aria-label="Close">${CLOSE_X}</button></div>
    <div class="wheel-body">
      <ol class="wheel-list" aria-label="Sections"></ol>
      <p class="wheel-note">A changed answer can reopen a finished section when a follow-up becomes relevant. Plan is done when the plan is ready.</p>
      <p class="wheel-save" aria-live="polite"></p>
      <div class="wheel-acts">
        <button type="button" class="glass" id="wl-exit">Save and exit</button>
        <button type="button" class="glass" id="wl-download"${canDownload() ? '' : ' hidden'}>Download progress file</button>
        <button type="button" class="glass" id="wl-forget">Reset progress</button>
      </div>
      <div class="wheel-confirm" hidden></div>
      ${phone() ? '<div class="wheel-acts"><button type="button" class="glass" id="wl-about">About TMA</button></div>' : ''}
    </div>`;
}
function openWheel(o) {
  if (!wheelPanel || !wheel || wheel.hidden) return false;
  if (!wheelPanel.hidden) return true;
  wheelFocus = o && o.from ? o.from : doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : wheel;
  wheelPanel.innerHTML = panelHTML();
  wheelPanel.hidden = false;
  wheel.setAttribute('aria-expanded', 'true');
  paintPanelList(lastStages || readStages() || fallbackStages());
  paintPanelSave();
  $('.help-close', wheelPanel).addEventListener('click', () => closeWheel(true));
  $('#wl-exit', wheelPanel).addEventListener('click', saveAndExit);
  $('#wl-download', wheelPanel)?.addEventListener('click', offerDownload);
  $('#wl-forget', wheelPanel).addEventListener('click', forgetVisit);
  // Task 07: About TMA opens inside this page. Nothing here leaves the session behind
  $('#wl-about', wheelPanel)?.addEventListener('click', () => { closeWheel(false); try { M.about?.open?.(); } catch (e) { /* no panel */ } });
  wheelPanel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...wheelPanel.querySelectorAll('button:not([disabled]):not([hidden]), a[href]')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = doc.activeElement;
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
  overlay.open('wheel', { el: wheelPanel, opener: wheelFocus, close: closeWheel });
  play('open', { x: 0.9 });
  ($('#wheel-title', wheelPanel).tabIndex = -1, $('#wheel-title', wheelPanel)).focus({ preventScroll: true });
  return true;
}
function closeWheel(refocus) {
  if (!wheelPanel || wheelPanel.hidden) return;
  wheelPanel.hidden = true;
  wheelPanel.innerHTML = '';
  wheel?.setAttribute('aria-expanded', 'false');
  overlay.close('wheel', { silent: true });
  if (refocus !== false) { try { (wheelFocus && wheelFocus.isConnected ? wheelFocus : wheel)?.focus?.({ preventScroll: true }); } catch (e) { /* no focus */ } }
  wheelFocus = null;
}
wheel?.addEventListener('click', () => (wheelPanel && !wheelPanel.hidden ? closeWheel(true) : openWheel({ from: wheel })));
doc.addEventListener('pointerdown', (e) => { if (wheelPanel && !wheelPanel.hidden && !e.target.closest?.('#wheel-panel, #wheel')) closeWheel(false); }, true);

/* ============ R7: the privacy note ============ */
const privacyLine = () => { try { const l = M.save?.line?.(); if (typeof l === 'string' && l) return l; } catch (e) { /* the default */ } return PRIVACY()[0]; };
/** M.privacyNote(el, { text }) puts the note straight after `el` (a field or an instrument) and returns it; a second
    call for the same element rewrites the one that is there. */
M.privacyNote = (el, o = {}) => {
  if (!el || !el.parentNode) return null;
  let n = el.nextElementSibling && el.nextElementSibling.classList.contains('privacy-note') ? el.nextElementSibling : null;
  if (!n) { n = doc.createElement('p'); n.className = 'privacy-note'; el.insertAdjacentElement('afterend', n); }
  n.textContent = typeof o.text === 'string' && o.text ? o.text : privacyLine();
  return n;
};
doc.addEventListener('mercer:question', (e) => {
  if (e.detail?.id !== 'now') return;
  const body = $('#q-body');
  if (!body || body.querySelector('.privacy-note')) return;
  M.privacyNote(body.querySelector('.ui') ?? body.lastElementChild);
});

/* ============ R10: help ============ */
const helpBtn = $('#help'), panel = $('#help-panel');
let lastFocus = null;
const REPLAY_FROM = ['arrival', 'orient', 'roots', 'section', 'explore', 'harvest', 'plan'];
/* Task 07: four headings, one concise explanation open at a time. Each heading is a button that opens its own panel and
   closes the one that was open, so nothing here is a wall of text; the essential control labels stay in the flow itself
   and are only repeated here where a key or a gesture needs naming. Every instruction names the pointer, touch and
   keyboard ways together, so none of it depends on a hover. */
const HELP_GROUPS = [
  { id: 'using', head: 'Using Mercer', body: (ph) => `
      <p>One question at a time, beside your tree. Press a question's title to see exactly what is being asked. Continue moves on, Back returns, and Not sure records that you do not know: Mercer then states what it assumed and marks it. Questions that do not apply to you are not asked.</p>
      <p>Every figure can be typed or dragged. Drag or swipe the rail for a quick figure; type for an exact one, even past the end of the rail. A suggested figure stays a suggestion until Continue accepts it.</p>
      <div class="help-specimen" aria-hidden="true"><span class="figure tabular">£2,400</span><div class="rail"><i class="fill"></i><i class="handle"></i></div></div>
      <p>When you are not typing, <kbd>←</kbd> and <kbd>→</kbd> move between questions and <kbd>Enter</kbd> confirms a figure.</p>
      <p>The wheel at the bottom right is the six sections of your route: done filled, the one you are in outlined, the rest to come. Press it${ph ? ' or tap it' : ''} for the list, to review a finished section, to save and exit, or to forget this visit. It is a section index, not a share of the work.</p>` },
  { id: 'tree', head: 'Your tree', body: (ph) => `
      <ul>
        <li><b>Roots</b> evidence and resources: where each figure came from</li>
        <li><b>Trunk</b> the business as it runs today; on the starting route, the direction you chose</li>
        <li><b>Limbs</b> in four groups: Customers, Offer, Delivery and Leverage</li>
        <li><b>Leaves</b> your answers, one twig to a question; pale means not answered yet</li>
        <li><b>Fruit</b> outcomes and milestones</li>
        <li><b>Goal marker</b> a ring at the height of your goal</li>
      </ul>
      <ul>
        <li><i class="key" style="--k: var(--you)"></i><b>Green</b> your own answers</li>
        <li><i class="key" style="--k: var(--sector)"></i><b>Amber</b> a benchmark, each with its source</li>
        <li><i class="key" style="--k: var(--web)"></i><b>Teal</b> from your website or a document you gave</li>
        <li><i class="key" style="--k: var(--estimate)"></i><b>Blue</b> an assumption, until you give your own figure</li>
        <li><i class="key" style="--k: var(--bud)"></i><b>Pale</b> not answered yet</li>
        <li><i class="key" style="--k: var(--action)"></i><b>Emerald</b> the way forward, and healthy growth</li>
        <li><i class="key" style="--k: var(--collar)"></i><b>Amber collar</b> the current constraint</li>
      </ul>
      <p>Drag or swipe to turn it. Zoom with the <b>+</b> and <b>-</b> buttons, a pinch, or <kbd>Ctrl</kbd> and scroll; Fit shows the whole tree. With the tree focused, the arrow keys turn it, <kbd>+</kbd> and <kbd>-</kbd> zoom and <kbd>0</kbd> fits. Press a leaf or a limb, or <kbd>Enter</kbd> on it, to see the answer behind it and change it.${ph ? ' Your tree opens it to the whole screen; Close returns.' : ''}</p>
      <p>The soft ring of colour behind the tree marks where your attention is. It is a frame, not a reading: it carries no score.</p>` },
  { id: 'info', head: 'Your information', body: () => `
      <p>Findings and the plan come from your answers, from benchmarks Mercer names, and from assumptions it states where you gave no figure. Where Mercer forecasts, it shows ranges; the Method under your plan shows the counts from the actual run.</p>
      <ul class="help-plain">${PRIVACY().map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      <div id="help-disclaimer"></div>` },
  { id: 'saving', head: 'Saving and downloads', body: () => `
      <p>Save on this device stores your answers in this browser, and only in this browser. It is off until you turn it on, in the introduction or in the section list under the wheel. With it off, moving around inside Mercer keeps your answers, but closing the tab loses them.</p>
      <p>Download progress file writes a file to your device that this page can read back later. Download plan and the implementation brief are files too: they go to your device, not to TMA. A brief reaches TMA only if you send it.</p>
      <p>Reset progress removes the saved session from this browser, clears the answers on screen and returns to the start. It asks first, and it names what it removes.</p>` },
];
function helpHTML() {
  const ph = phone();
  return `
  <div class="help-head"><h2 id="help-title" tabindex="-1">Help</h2><button type="button" class="help-close" aria-label="Close">${CLOSE_X}</button></div>
  <div class="help-body">
    ${HELP_GROUPS.map((g, i) => `
    <section id="help-${g.id}" class="help-group">
      <h3><button type="button" class="help-head-btn" data-group="${g.id}" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="help-${g.id}-body">${esc(g.head)}</button></h3>
      <div class="help-group-body" id="help-${g.id}-body"${i === 0 ? '' : ' hidden'}>${g.body(ph)}</div>
    </section>`).join('')}
    <div class="help-foot">
      <button type="button" class="glass" id="help-replay">Show me the tree</button>
      <p class="small" id="help-replay-note" hidden>Available when the page is not moving.</p>
    </div>
  </div>`;
}
/** one explanation open at a time. `id` opens that one; the others close. */
function openGroup(id) {
  if (!panel) return;
  panel.querySelectorAll('.help-group').forEach((s) => {
    const on = s.id === `help-${id}`;
    s.querySelector('.help-head-btn')?.setAttribute('aria-expanded', String(on));
    const body = s.querySelector('.help-group-body');
    if (body) body.hidden = !on;
  });
}
function focusables() { return [...panel.querySelectorAll('button:not([disabled]), summary, a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null); }
/* the names other files ask for, mapped onto the four groups: openHelp('privacy') still lands on the privacy words */
const GROUP_FOR = { privacy: 'info', info: 'info', method: 'info', answer: 'using', rails: 'using', wheel: 'using', using: 'using', tree: 'tree', colours: 'tree', move: 'tree', saving: 'saving', downloads: 'saving' };
function openHelp(section) {
  if (!panel || panel.open) { if (section && panel?.open) scrollHelpTo(section); return; }
  lastFocus = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : helpBtn;
  panel.innerHTML = helpHTML();
  const slot = $('#help-disclaimer', panel);
  try { if (slot && typeof M.disclaimerBlock === 'function') slot.replaceWith(M.disclaimerBlock()); else slot?.remove(); } catch (e) { slot?.remove(); }
  const can = REPLAY_FROM.includes(stageNow()) && !M.moving && !M.intro?.running?.() && !M.example?.isOpen?.() && typeof M.intro?.open === 'function';
  const rp = $('#help-replay', panel), rn = $('#help-replay-note', panel);
  if (rp) rp.disabled = !can;
  if (rn) rn.hidden = can;
  $('.help-close', panel)?.addEventListener('click', () => closeHelp());
  panel.querySelectorAll('.help-head-btn').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.group;
    const was = b.getAttribute('aria-expanded') === 'true';
    openGroup(was ? null : id);
    play(was ? 'close' : 'open', { gain: 0.3 });
  }));
  rp?.addEventListener('click', () => {
    lastFocus = helpBtn; // the slides give focus back to the help button when they close
    closeHelp();
    try { M.intro.open({ replay: true }); } catch (e) { /* stays where it was */ }
  });
  overlay.open('help', { el: panel, opener: lastFocus, close: closeHelp });
  try { if (typeof panel.showModal === 'function') panel.showModal(); else panel.setAttribute('open', ''); } catch (e) { panel.setAttribute('open', ''); }
  helpBtn?.setAttribute('aria-expanded', 'true');
  if (section) scrollHelpTo(section); else $('#help-title', panel)?.focus({ preventScroll: true });
}
function scrollHelpTo(section) {
  const id = GROUP_FOR[section] || section;
  const el = $(`#help-${id}`, panel);
  if (!el) { $('#help-title', panel)?.focus({ preventScroll: true }); return; }
  openGroup(id);
  const h = el.querySelector('.help-head-btn');
  if (h) h.focus({ preventScroll: true });
  try { el.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
}
function closeHelp() {
  if (!panel || !panel.open) return;
  overlay.close('help', { silent: true });
  try { if (typeof panel.close === 'function') panel.close(); else panel.removeAttribute('open'); } catch (e) { panel.removeAttribute('open'); }
  if (panel.hasAttribute('open')) panel.removeAttribute('open');
}
if (panel) {
  panel.addEventListener('close', () => {
    helpBtn?.setAttribute('aria-expanded', 'false');
    overlay.close('help', { silent: true });
    const back = lastFocus && lastFocus.isConnected ? lastFocus : helpBtn;
    try { back?.focus?.({ preventScroll: true }); } catch (e) { /* no focus */ }
  });
  // a press on the wash outside the paper closes it
  panel.addEventListener('click', (e) => { if (e.target === panel) closeHelp(); });
  // its keys are its own: nothing reaches the interview's arrows; Tab stays inside even where showModal is missing
  panel.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); closeHelp(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1], a = doc.activeElement;
    if (e.shiftKey && (a === first || !panel.contains(a) || a === $('#help-title', panel))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
}
helpBtn?.setAttribute('aria-expanded', 'false');
helpBtn?.addEventListener('click', () => (panel?.open ? closeHelp() : openHelp()));

/* ============ R16: the tree's controls ============ */
const tools = $('#tree-tools'), hint = $('#tree-hint'), chip = $('#inspect');
const HINT_KEY = 'mercer-tree-hint';
const canZoom = () => typeof tree()?.zoomBy === 'function';
function fitTree() {
  const t = tree();
  if (!t) return;
  // the tree owner's name for "show the whole tree again" is fit(); older builds keep fit() for the canvas size, which is harmless to call
  try { (t.fitView ?? t.zoomFit ?? t.fit)?.call(t); } catch (e) { /* stays */ }
}
function syncTools() {
  if (!tools) return;
  tools.hidden = !canZoom(); // no dead controls: they show once the tree can zoom
  if (!tools.hidden) maybeHint();
  syncExpand();
}
$('#tree-in')?.addEventListener('click', () => { try { tree()?.zoomBy?.(1.25); } catch (e) { /* stays */ } dismissHint(); });
$('#tree-out')?.addEventListener('click', () => { try { tree()?.zoomBy?.(0.8); } catch (e) { /* stays */ } dismissHint(); });
$('#tree-fit')?.addEventListener('click', () => { fitTree(); dismissHint(); });

let hintSeen = false;
try { hintSeen = sessionStorage.getItem(HINT_KEY) === '1'; } catch (e) { hintSeen = false; }
function maybeHint() {
  if (!hint || hintSeen || !hint.hidden) return;
  const st = stageNow();
  if (st !== 'section' && st !== 'explore') return;
  hint.innerHTML = `<span>${phone() ? 'Drag the tree to turn it and pinch to zoom.' : 'Drag the tree to turn it; zoom with the buttons or Ctrl and scroll.'} Press a leaf to see the answer behind it.</span><button type="button">Got it</button>`;
  hint.hidden = false;
  $('button', hint).addEventListener('click', dismissHint);
}
function dismissHint() {
  if (hintSeen && (!hint || hint.hidden)) return;
  hintSeen = true;
  try { sessionStorage.setItem(HINT_KEY, '1'); } catch (e) { /* this page only */ }
  if (hint) { hint.hidden = true; hint.innerHTML = ''; }
}
$('#stage')?.addEventListener('pointerdown', () => { if (hint && !hint.hidden) dismissHint(); closeChip(); }, { passive: true });

/* ---------- R23, the phone: the tree opened to the whole screen ---------- */
const expandBtn = $('#tree-expand'), closeTreeBtn = $('#tree-close');
function treeOpen() { return doc.body.dataset.treeOpen === '1'; }
function syncExpand() {
  if (!expandBtn) return;
  const show = phone() && JOURNEY.includes(stageNow()) && !!tree();
  expandBtn.hidden = !show;
  if (!show && treeOpen()) closeTree(false);
}
function openTree() {
  if (treeOpen() || !phone()) return false;
  doc.body.dataset.treeOpen = '1';
  expandBtn?.setAttribute('aria-expanded', 'true');
  if (closeTreeBtn) closeTreeBtn.hidden = false;
  overlay.open('tree', { el: $('#stage'), opener: expandBtn, close: closeTree });
  try { doc.dispatchEvent(new CustomEvent('mercer:treeview', { detail: { open: true } })); } catch (e) { /* older browsers */ }
  fitTree();
  play('open', { x: 0.5 });
  closeTreeBtn?.focus({ preventScroll: true });
  return true;
}
function closeTree(refocus) {
  if (!treeOpen()) return;
  delete doc.body.dataset.treeOpen;
  expandBtn?.setAttribute('aria-expanded', 'false');
  if (closeTreeBtn) closeTreeBtn.hidden = true;
  overlay.close('tree', { silent: true });
  try { doc.dispatchEvent(new CustomEvent('mercer:treeview', { detail: { open: false } })); } catch (e) { /* older browsers */ }
  fitTree();
  play('close', { x: 0.5 });
  if (refocus !== false) expandBtn?.focus({ preventScroll: true });
}
expandBtn?.addEventListener('click', openTree);
closeTreeBtn?.addEventListener('click', () => closeTree(true));
try { const mq = window.matchMedia('(max-width: 720px)'); const re = () => { syncExpand(); if (!mq.matches) closeTree(false); }; if (mq.addEventListener) mq.addEventListener('change', re); else mq.addListener(re); } catch (e) { /* one width */ }

/* ---------- the soft keyboard: the visual viewport shrinks; the wheel steps aside (scene.css reads body[data-keyboard]) ---------- */
(function keyboardWatch() {
  const vv = window.visualViewport;
  if (!vv) return;
  const sync = () => {
    const up = phone() && vv.height < window.innerHeight * 0.78;
    if (up) doc.body.dataset.keyboard = '1'; else delete doc.body.dataset.keyboard;
  };
  vv.addEventListener('resize', sync);
  sync();
})();

/* ============ R16: the inspect chip ============ */
let chipFor = null, chipFocus = null;
function closeChip(refocus) {
  if (!chip || chip.hidden) return;
  chip.hidden = true; chip.innerHTML = ''; chipFor = null;
  overlay.close('inspect', { silent: true });
  if (refocus && chipFocus && chipFocus.isConnected) { try { chipFocus.focus({ preventScroll: true }); } catch (e) { /* no focus */ } }
  chipFocus = null;
}
function openChip(d) {
  if (!chip || !d || d.id == null) { closeChip(); return; }
  let info = null;
  try { info = typeof M.inspect === 'function' ? M.inspect(d.id) : null; } catch (e) { info = null; }
  if (!info || !info.title) { closeChip(); return; }
  dismissHint();
  const from = { 'Your answer': 'you', 'Your website': 'web', 'From your website': 'web', 'From your document': 'web', 'Industry figure': 'sector', 'Benchmark': 'sector', 'Source': 'sector', 'Mercer’s estimate': 'assumed', 'Assumption': 'assumed' }[info.source] ?? null;
  chipFor = d.id;
  chip.innerHTML = `
    <div class="in-head"><span class="in-title">${esc(info.title)}</span><button type="button" class="in-close" aria-label="Close">${CLOSE_X}</button></div>
    ${info.words ? `<span class="in-words">${esc(info.words)}</span>` : ''}
    ${info.source ? `<span class="src"${from ? ` data-from="${from}"` : ''}>${esc(info.source)}</span>` : ''}
    ${info.canChange ? '<button type="button" class="glass in-change">Change</button>' : ''}`;
  chip.hidden = false;
  chip.setAttribute('aria-label', `${info.title}: this answer`);
  // Task 02: the chip is an inspector, so it counts in the tree's bounds: it stands beside the point that was tapped,
  // inside the tree region, under no part of the header and never over the question region.
  measureRegions();
  const w = chip.offsetWidth, h = chip.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  const R = treeOpen() ? { left: 12, top: region.header.bottom + 8, right: vw - 12, bottom: vh - 12 } : region.tree;
  const ceil = R.top + 8, floor = R.bottom - 8;
  const x = isFinite(d.x) ? d.x : (R.left + R.right) / 2, y = isFinite(d.y) ? d.y : (R.top + R.bottom) / 2;
  const right = R.right - 12, left0 = R.left + 12;
  const left = x + 16 + w <= right ? x + 16 : x - 16 - w;
  chip.style.transform = `translate(${Math.round(clamp(left, left0, Math.max(left0, right - w)))}px, ${Math.round(clamp(y - h / 2, ceil, Math.max(ceil, floor - h)))}px)`;
  $('.in-close', chip).addEventListener('click', () => closeChip(true));
  $('.in-change', chip)?.addEventListener('click', () => {
    const id = chipFor;
    closeChip();
    if (treeOpen()) closeTree(false);
    try { (M.reopen ?? M.showQuestion)?.(id); } catch (e) { /* stays */ }
  });
  overlay.open('inspect', { el: chip, opener: doc.activeElement, close: (refocus) => closeChip(refocus !== false) });
  // a keyboard visitor (the tree says so, or focus is on the stage) is taken to the chip; a pointer is left where it is
  if (d.keyboard || doc.activeElement?.closest?.('#stage')) {
    chipFocus = doc.activeElement;
    ($('.in-change', chip) ?? $('.in-close', chip)).focus({ preventScroll: true });
  }
}
chip?.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeChip(true); } });
doc.addEventListener('pointerdown', (e) => { if (chip && !chip.hidden && !e.target.closest?.('#inspect, #stage')) closeChip(); }, true);
doc.addEventListener('mercer:question', () => closeChip());
doc.addEventListener('mercer:stage', () => { closeChip(); syncTools(); if (treeOpen()) closeTree(false); });
window.addEventListener('resize', () => closeChip());
let wired = null;
function wireTree() {
  const t = tree();
  if (!t || wired === t || typeof t.on !== 'function') return;
  wired = t;
  try { t.on('inspect', (d) => { if (d && d.id != null) openChip(d); else closeChip(); }); } catch (e) { wired = null; }
}

M.shell = {
  paintWheel, paintRing: paintWheel, openHelp, closeHelp, openWheel, closeWheel, closeInspect: closeChip,
  openTree, closeTree, overlay,
  // Task 02: the layout regions, for anything placing a label, a caption or an inspector by hand
  regions, measure: measureRegions, inQuestion,
  // Task 06: the halo, a frame and a focus treatment, never a score
  halo, haloOn: () => haloOn,
};
wireTree();
measureRegions();
syncTools();
syncWheel();
paintWheel();
if (HALO_STAGES.includes(stageNow())) halo(true);
})();
