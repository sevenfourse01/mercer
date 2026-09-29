/* about.js (Mercer 12, owner (a) shell, new for the final pack's Task 07): About TMA, a compact panel inside this same
   page. The header's About TMA press opens it; on the phone the wheel's section list opens it too. It says what TMA is
   for, who runs it, and what TMA can help put in place, and it ends with Return to my plan.

   Two rules hold this file down.

   1. The visitor never leaves. Nothing here navigates: the panel is a dialog over the page, the session stays exactly
      where it was, and Return to my plan closes it and gives the focus back to whatever opened it. The one outward link
      is a new tab, said so in its own words, so the Mercer tab is still there behind it.
   2. Nothing here is invented. Every statement is a fact already in this project: the company's own name (the mark's
      accessible name in index.html), the message on the homepage, the person the Book a call press books with
      (canopy.js's booking link), and what Mercer itself does. There is no biography, no list of achievements, no client
      count and no award, because the project holds none of those.

   It reads nothing from M.state and writes nothing to it, so opening and closing it cannot touch a single answer. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});
const doc = document;
const $ = (s, r = doc) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const play = (name, o) => { try { M.feel?.play?.(name, o); } catch (e) { /* sound is a nicety */ } };
const CLOSE_X = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

const panel = $('#about-panel');
const openBtn = $('#about-tma');
if (!panel) return;
let lastFocus = null;

/* the founder's name, from the booking link the plan already uses. Where the link is not there, the section stands
   without a name rather than inventing one. */
function founderName() {
  let url = '';
  try { url = String(M.BOOKING_URL ?? M.bookingUrl ?? ''); } catch (e) { url = ''; }
  if (!url) { try { url = String($('#hv-call')?.dataset?.href ?? ''); } catch (e) { url = ''; } }
  const m = /cal\.com\/([a-z]+)-([a-z]+)/i.exec(url);
  if (!m) return 'Adam Attia';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(m[1])} ${cap(m[2])}`;
}

/* what TMA can help put in place. Each line is something this project already builds or names, so none of it is a
   promise the company has not made here. */
const IMPLEMENT = [
  'The systems behind the plan: the tools, the automation and the handovers it depends on.',
  'The routes to customers it names, set up and running rather than listed.',
  'The measurements under each action, so you can tell whether it worked.',
];

function aboutHTML() {
  const who = founderName();
  return `
  <div class="help-head">
    <h2 id="about-title" tabindex="-1"><span class="about-mark"><svg class="logo" aria-hidden="true"><use href="#tma-mark"/></svg>About TMA</span></h2>
    <button type="button" class="help-close" aria-label="Return to my plan">${CLOSE_X}</button>
  </div>
  <div class="about-body">
    <section>
      <h3>What TMA is for</h3>
      <p class="about-what">TMA helps people turn their ambitions into businesses and systems that work. Mercer helps you see a direction and build a plan around your strengths. When you want help putting it into practice, TMA can work with you on the systems and routes to customers it needs.</p>
      <p class="small">TMA is The Mission Automation.</p>
    </section>
    <section>
      <h3>Who runs it</h3>
      <p>TMA is run by ${esc(who)}, who takes the calls booked from a plan. Mercer is TMA's own tool, given away so that a first conversation starts from a plan you already have rather than a blank page.</p>
    </section>
    <section>
      <h3>What TMA can help implement</h3>
      <ul>${IMPLEMENT.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      <p>Book a call sits under your plan when you have one. It is open to everyone.</p>
    </section>
  </div>
  <div class="about-foot">
    <button type="button" class="glass glass-on" id="about-back">Return to my plan</button>
    <a class="about-link" href="https://themissionautomation.com" target="_blank" rel="noopener">themissionautomation.com, in a new tab</a>
  </div>`;
}

function focusables() {
  return [...panel.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null);
}
function open() {
  if (panel.open) return true;
  lastFocus = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : openBtn;
  panel.innerHTML = aboutHTML();
  $('.help-close', panel)?.addEventListener('click', () => close());
  $('#about-back', panel)?.addEventListener('click', () => close());
  try { M.overlay?.open?.('about', { el: panel, opener: lastFocus, close }); } catch (e) { /* no registry */ }
  try { if (typeof panel.showModal === 'function') panel.showModal(); else panel.setAttribute('open', ''); } catch (e) { panel.setAttribute('open', ''); }
  openBtn?.setAttribute('aria-expanded', 'true');
  play('open');
  $('#about-title', panel)?.focus({ preventScroll: true });
  return true;
}
function close() {
  if (!panel.open) return;
  try { M.overlay?.close?.('about', { silent: true }); } catch (e) { /* no registry */ }
  try { if (typeof panel.close === 'function') panel.close(); else panel.removeAttribute('open'); } catch (e) { panel.removeAttribute('open'); }
  if (panel.hasAttribute('open')) panel.removeAttribute('open');
}
panel.addEventListener('close', () => {
  openBtn?.setAttribute('aria-expanded', 'false');
  panel.innerHTML = '';
  try { M.overlay?.close?.('about', { silent: true }); } catch (e) { /* no registry */ }
  play('close');
  // Return to my plan puts the visitor back exactly where they were, with the focus on what opened the panel
  const back = lastFocus && lastFocus.isConnected ? lastFocus : openBtn;
  try { back?.focus?.({ preventScroll: true }); } catch (e) { /* no focus */ }
  lastFocus = null;
});
// a press on the wash outside the paper returns as well
panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
// its keys are its own: nothing reaches the interview's arrows, and Tab stays inside even where showModal is missing
panel.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables();
  if (!f.length) { e.preventDefault(); return; }
  const first = f[0], last = f[f.length - 1], a = doc.activeElement;
  if (e.shiftKey && (a === first || !panel.contains(a) || a === $('#about-title', panel))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
});
openBtn?.setAttribute('aria-expanded', 'false');
openBtn?.addEventListener('click', () => (panel.open ? close() : open()));

M.about = { open, close, isOpen: () => !!panel.open };
})();
