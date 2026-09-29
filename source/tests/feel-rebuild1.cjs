/* rebuild 1, feel: C09 to C12, cards (single, multi, exclusive, five-option layout), suggested rail values, the fee rail's
   typed entry, clientCards round trip, the sorter's tap alternative, the ordered sort, the ring's typed figure, the snap
   on release, and the sound rules (no autoplay before a gesture, the mute persists).
   Plain node + the jsdom installed for the fix-3 harness (scratchpad/labtest). Run: node tests/feel-rebuild1.cjs
   Layout is stubbed: every box is 320 x 44 at 0,0. */
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require(path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'))); } catch (e) { ({ JSDOM } = require('jsdom')); }

const FEEL_JS = fs.readFileSync(path.join(ROOT, 'feel.js'), 'utf8');
const FEEL_CSS = fs.readFileSync(path.join(ROOT, 'feel.css'), 'utf8');

function boot({ reduced = false, storage = {} } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><main id="m"></main><button id="unsure">Not sure</button></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
  const { window } = dom;
  window.matchMedia = (q) => ({ matches: reduced && /reduce/.test(q), addEventListener() {}, removeEventListener() {} });
  window.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, finish() {} }; };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.HTMLElement.prototype.releasePointerCapture = function () {};
  window.Element.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 320, height: 44, right: 320, bottom: 44 }; };
  window.PointerEvent = window.MouseEvent;
  Object.entries(storage).forEach(([k, v]) => window.localStorage.setItem(k, v));
  window.Mercer = {};
  window.eval(FEEL_JS);
  return window;
}

const fails = [];
let passed = 0;
const ok = (cond, msg) => { if (cond) passed++; else fails.push(msg); };

(async () => {
  const window = boot();
  const { document } = window;
  const M = window.Mercer;
  const host = () => { const d = document.createElement('div'); document.getElementById('m').appendChild(d); return d; };
  const key = (el, k, extra = {}) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));
  const type = (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const ptr = (el, t, x, y = 20) => el.dispatchEvent(new window.MouseEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
  const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const rec = () => { const r = { inputs: [], commits: [] }; r.opts = { onInput: (v) => r.inputs.push(v), onCommit: (v) => r.commits.push(v) }; return r; };
  const lastCommit = (r) => r.commits[r.commits.length - 1];

  /* ---------- C09: endpoints and labels never clip ---------- */
  {
    const fee = M.ui.fee(host(), {});
    const labs = [...fee.el.querySelectorAll('.tick-lab')];
    ok(labs.length === 2 && labs[0].classList.contains('at-start') && labs[1].classList.contains('at-end'), 'C09: the fee rail\'s end labels are marked at-start / at-end (aligned inward)');
    ok(/\.ui \.tick-lab\.at-end \{ transform: translateX\(-100%\)/.test(FEEL_CSS), 'C09: the end label is pulled inside the rail in CSS');
    const sl = M.ui.slider(host(), { unit: '£', scale: [1000, 100000] });
    const sLabs = [...sl.el.querySelectorAll('.tick-lab')];
    ok(sLabs.length === 2 && !sLabs[1].classList.contains('at-end'), 'C09: a slider tick inside the rail (t = 0.75) keeps its centred label');
    const ten = M.ui.tenStones(host(), { pre: '<1', plus: '10+', label: 'Repeat purchases' });
    const stones = [...ten.el.querySelectorAll('.stone.ten')];
    ok(stones.length === 11 && stones[10].textContent === '10+', 'C09: eleven ten-stones, the last reads 10+');
    ok(/\.ui \.ten-row \{[^}]*flex-wrap: wrap/.test(FEEL_CSS), 'C09: the ten-stone row wraps at every width (never clipped at the clearing\'s edge)');
    ok(/\.ui \.stone\.ten \{[^}]*min-width: 44px[^}]*flex: 0 0 auto/.test(FEEL_CSS), 'C09: a ten-stone never shrinks under 44 px');
    click(stones[10]);
    ok(ten.get() === 10, 'C09: the 10+ stone is selectable and reads 10');
  }

  /* ---------- C10: option text wraps, nothing cropped ---------- */
  {
    ok(/\.ui \.stone \{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere/.test(FEEL_CSS), 'C10: pills wrap their words (base.css nowrap overridden) and break a word that cannot fit');
    ok(/\.ui \.stone \{[^}]*padding: 10px 16px/.test(FEEL_CSS), 'C10: a two-line pill has vertical padding, so it grows rather than crops');
    ok(/\.ui \.card \{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere/.test(FEEL_CSS), 'C10: cards wrap too');
    ok(/\.ui \.stone\.ten \{[^}]*white-space: nowrap/.test(FEEL_CSS) && /\.ui-two \.stone\.type \{[^}]*white-space: nowrap/.test(FEEL_CSS), 'C10: single figures (ten stones, the type codes) stay on one line');
    const c = M.ui.stones(host(), { options: [['a', 'A very long option label that would once have run out of its pill on a phone'], ['b', 'Short']] });
    ok(c.el.querySelectorAll('.stone').length === 2 && !c.el.querySelector('.stone').style.whiteSpace, 'C10: no inline nowrap on a stone');
  }

  /* ---------- C11: cards, single ---------- */
  {
    const r = rec();
    const c = M.ui.cards(host(), { ...r.opts, id: 'canDeliverMore', options: [['yes', 'Yes'], ['no', 'No'], ['changes', 'With changes']], label: 'Could you deliver more?' });
    const cards = [...c.el.querySelectorAll('button.card')];
    ok(c.el.classList.contains('ui-cards') && cards.length === 3, 'cards: one instrument, three whole-card buttons');
    ok(cards.every((b) => b.getAttribute('role') === 'radio' && b.getAttribute('aria-checked') === 'false' && b.querySelector('.card-mark svg')), 'cards: radio cards, unchecked, each with a mark');
    ok(c.el.querySelector('.card-grid').getAttribute('role') === 'radiogroup' && c.el.querySelector('.card-grid').getAttribute('aria-label') === 'Could you deliver more?', 'cards: a radiogroup with the question as its name');
    click(cards[1].querySelector('.card-label'));
    ok(c.get() === 'no', 'cards: a click anywhere on the card (its label span) picks it');
    ok(cards[1].getAttribute('aria-checked') === 'true' && cards[1].getAttribute('aria-pressed') === 'true' && cards[0].getAttribute('aria-checked') === 'false', 'cards: the state is carried by aria-checked and aria-pressed');
    ok(lastCommit(r) === 'no', 'cards: the pick commits (Continue can enable)');
    let entered = 0;
    c.el.addEventListener('mercer:enter', () => entered++);
    click(cards[2]);
    ok(c.get() === 'changes' && entered === 0, 'cards: no auto-advance on a pick (no mercer:enter from a click)');
    cards[2].focus(); key(cards[2], 'Enter');
    ok(entered === 1, 'cards: Enter on a focused card is the keyboard\'s Continue');
    ok(/\.ui \.card\[aria-checked="true"\] \{[^}]*box-shadow: inset 0 0 0 2px var\(--hue\)/.test(FEEL_CSS) && /\.ui \.card\[aria-checked="true"\] \.card-mark \{[^}]*background: var\(--hue\)/.test(FEEL_CSS), 'cards: the selected surface changes as a whole (fill and ring) and the mark fills');
    ok(!/blur\(/.test(FEEL_CSS) && !/text-shadow/.test(FEEL_CSS), 'cards: no glow, no blur anywhere in feel.css');
    // either/or: two substantial cards
    const two = M.ui.cards(host(), { options: [{ v: 'owner', label: 'I run a business', sub: 'Trading now, however small' }, { v: 'starter', label: 'I do not run a business yet' }] });
    ok(two.el.classList.contains('either') && two.el.dataset.cols === '2' && two.el.querySelector('.card-sub')?.textContent === 'Trading now, however small', 'cards: two options make an either/or of two substantial cards, with a second line');
    ok(/\.ui-cards\.either \.card \{[^}]*min-height: 96px/.test(FEEL_CSS), 'cards: either/or cards are substantial (96 px)');
    // the opts-only call shape
    const alone = M.ui.cards({ options: [['a', 'A'], ['b', 'B'], ['c', 'C']] });
    ok(alone.el.classList.contains('ui-cards') && !alone.el.parentNode && alone.el.querySelectorAll('.card').length === 3, 'cards: M.ui.cards({ options }) without a host builds too');
  }

  /* ---------- C11: cards, multi and exclusive ---------- */
  {
    const r = rec();
    const c = M.ui.cards(host(), { ...r.opts, multi: true, exclusive: ['none', 'unsure'], options: [['reviews', 'Reviews'], ['cases', 'Case studies'], ['demo', 'Demonstrations'], ['none', 'None yet'], ['unsure', 'Not sure']] });
    const by = (v) => c.el.querySelector(`.card[data-v="${v}"]`);
    const lead = c.el.querySelector('.ui-lead');
    ok(lead && lead.textContent === 'Choose one or more' && c.el.querySelector('.card-grid').getAttribute('aria-describedby') === lead.id, 'multi: "Choose one or more" stands above the cards and describes the group');
    ok([...c.el.querySelectorAll('.card')].every((b) => b.getAttribute('role') === 'checkbox'), 'multi: checkbox cards');
    click(by('reviews')); click(by('cases'));
    ok(JSON.stringify(c.get()) === '["reviews","cases"]', 'multi: two picks make an array');
    click(by('none'));
    ok(JSON.stringify(c.get()) === '["none"]' && by('reviews').getAttribute('aria-checked') === 'false', 'exclusive: None clears the others and stands alone');
    click(by('demo'));
    ok(JSON.stringify(c.get()) === '["demo"]' && by('none').getAttribute('aria-checked') === 'false', 'exclusive: a real option puts None away');
    click(by('unsure'));
    ok(JSON.stringify(c.get()) === '["unsure"]', 'exclusive: Not sure stands alone too');
    click(by('unsure'));
    ok(JSON.stringify(c.get()) === '[]', 'multi: a second press unpicks');
    ok(by('none').classList.contains('exclusive') && by('unsure').classList.contains('exclusive'), 'exclusive: marked on the card');
    ok(JSON.stringify(lastCommit(r)) === '[]' && r.commits.length === 6, 'multi: every pick commits');
    // the same rule on stones (the contract row: multiselect stones with exclusive None / Not sure)
    const s = M.ui.stones(host(), { multi: true, exclusive: ['none'], options: [['a', 'A'], ['b', 'B'], ['none', 'None']] });
    ok(s.el.querySelector('.ui-lead')?.textContent === 'Choose one or more', 'stones: multi stones say "Choose one or more" too');
    click(s.el.querySelector('[data-v="a"]')); click(s.el.querySelector('[data-v="none"]'));
    ok(JSON.stringify(s.get()) === '["none"]', 'stones: exclusive None on stones');
    click(s.el.querySelector('[data-v="b"]'));
    ok(JSON.stringify(s.get()) === '["b"]', 'stones: a pick puts None away');
    const quiet = M.ui.stones(host(), { multi: true, lead: false, options: [['a', 'A']] });
    ok(!quiet.el.querySelector('.ui-lead'), 'stones: lead: false leaves the line out');
    const single = M.ui.stones(host(), { options: [['a', 'A'], ['b', 'B']] });
    ok(!single.el.querySelector('.ui-lead') && single.el.querySelector('.stone-row').getAttribute('role') === 'radiogroup', 'stones: a single choice has no lead and is unchanged');
  }

  /* ---------- C12: five options form a deliberate layout ---------- */
  {
    const five = M.ui.cards(host(), { options: [['a', 'Price'], ['b', 'Trust'], ['c', 'Timing'], ['d', 'Unclear offer'], ['e', 'Slow response']] });
    const cards = [...five.el.querySelectorAll('.card')];
    ok(five.el.dataset.cols === '3' && five.el.querySelector('.card-grid').style.getPropertyValue('--tracks') === '6', 'C12: five cards take three columns (six tracks, each card spanning two)');
    ok(cards.slice(0, 3).every((b) => !b.style.getPropertyValue('--col')), 'C12: the first row of three flows naturally');
    ok(cards[3].style.getPropertyValue('--col') === '2' && cards[4].style.getPropertyValue('--col') === '4', 'C12: the last two start a track in, so the short row is centred (never one orphan under four)');
    ok(/\.ui \.card \{[^}]*grid-column: var\(--col, auto\) \/ span 2/.test(FEEL_CSS), 'C12: the card reads its start track from --col');
    ok(/@media \(max-width: 480px\) \{[\s\S]*\.ui \.card-grid \{ grid-template-columns: 1fr; \}[\s\S]*\.ui \.card \{ grid-column: auto; \}/.test(FEEL_CSS), 'C12: at 480 and under the cards stack in one column');
    const four = M.ui.cards(host(), { options: [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D']] });
    ok(four.el.dataset.cols === '2' && [...four.el.querySelectorAll('.card')].every((b) => !b.style.getPropertyValue('--col')), 'C12: four cards make two even rows');
    const seven = M.ui.cards(host(), { options: 'abcdefg'.split('').map((x) => [x, x]) });
    const sc = [...seven.el.querySelectorAll('.card')];
    ok(seven.el.dataset.cols === '3' && sc[6].style.getPropertyValue('--col') === '3' && !sc[5].style.getPropertyValue('--col'), 'C12: seven cards: the single last card sits centred in the middle');
    const forced = M.ui.cards(host(), { columns: 2, options: [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D'], ['e', 'E']] });
    ok(forced.el.dataset.cols === '2' && forced.el.querySelectorAll('.card')[4].style.getPropertyValue('--col') === '2', 'C12: opts.columns: 2 with five cards centres the fifth');
  }

  /* ---------- suggested rail values (R6) ---------- */
  {
    const r = rec();
    const c = M.ui.slider(host(), { ...r.opts, unit: '£', scale: [1000, 100000], value: 4000, suggested: true, label: 'Revenue' });
    const tag = c.el.querySelector('.ui-suggested'), inp = c.el.querySelector('input.figure');
    ok(tag && !tag.hidden && tag.textContent === 'suggested' && tag.parentElement.classList.contains('face'), 'suggested: the tag stands beside the figure');
    ok(c.el.classList.contains('suggested') && c.suggested() === true && c.accepted() === false && c.get() === 4000, 'suggested: the state reads as a suggestion; get() is still the number');
    ok(inp.value === '4,000' && (inp.getAttribute('aria-describedby') || '').split(' ').includes(tag.id), 'suggested: the figure shows and the tag describes it');
    ok(r.commits.length === 0, 'suggested: nothing commits by itself');
    // Continue accepts it
    const v = c.accept();
    ok(v === 4000 && c.accepted() && !c.suggested() && tag.hidden && !c.el.classList.contains('suggested'), 'suggested: accept() takes the value as the visitor\'s and drops the tag');
    ok(lastCommit(r) === 4000 && r.commits.length === 1, 'suggested: accept() commits once');
    ok(c.accept() === 4000 && r.commits.length === 1, 'suggested: a second accept() changes nothing');
  }
  {
    // the visitor changes it: their figure, no tag, no accept() needed
    const r = rec();
    const c = M.ui.slider(host(), { ...r.opts, unit: '£', scale: [1000, 100000], value: 4000, suggested: true });
    const inp = c.el.querySelector('input.figure'), tag = c.el.querySelector('.ui-suggested');
    type(inp, '5500');
    ok(!tag.hidden === false && c.suggested() === false, 'suggested: typing another figure ends the suggestion at once');
    inp.blur();
    ok(lastCommit(r) === 5500 && c.accepted(), 'suggested: the typed figure commits as the visitor\'s');
    // an arrow step is a change too
    const d = M.ui.slider(host(), { unit: '£', scale: [1000, 100000], value: 4000, suggested: true });
    const h = d.el.querySelector('.handle'); h.focus(); key(h, 'ArrowRight');
    ok(d.suggested() === false && d.get() !== 4000, 'suggested: an arrow step is the visitor\'s figure');
  }
  {
    // Not sure discards it
    const r = rec();
    const c = M.ui.slider(host(), { ...r.opts, unit: '£', scale: [1000, 100000], value: 4000, suggested: true });
    c.clear();
    ok(c.get() === null && !c.suggested() && c.el.querySelector('.ui-suggested').hidden && r.commits.length === 0, 'suggested: clear() (Not sure) discards the suggestion, commits nothing');
    // revisiting restores an accepted value plainly; suggest() proposes again
    c.set(4000);
    ok(c.get() === 4000 && c.accepted() && c.el.querySelector('.ui-suggested').hidden, 'suggested: set() is an accepted value, no tag');
    c.suggest(6000);
    ok(c.get() === 6000 && c.suggested() && !c.el.querySelector('.ui-suggested').hidden, 'suggested: suggest(v) proposes again');
    // on a ring and a fee the tag stands on its own line above the readout
    const ring = M.ui.ring(host(), { value: 35, suggested: true, unit: '%' });
    const rt = ring.el.querySelector('.ui-suggested');
    ok(rt && !rt.hidden && rt.parentElement === ring.el && rt.nextElementSibling === ring.el.querySelector('.ui-readout'), 'suggested: on a ring the tag sits on its own line above the readout');
    const fee = M.ui.fee(host(), { value: { min: 500, avg: 1000, max: 2000 }, suggested: true });
    ok(fee.el.querySelector('.ui-suggested').parentElement === fee.el && fee.suggested(), 'suggested: on the fee the tag sits on its own line (three figures, one suggestion)');
    ok(/\.ui\.suggested \.figure/.test(FEEL_CSS) && /\.ui \.ui-suggested \{[^}]*border: 1px solid/.test(FEEL_CSS), 'suggested: the figure prints in --ink-2 and the tag is a hairline pill');
    const plain = M.ui.slider(host(), { value: 4000, unit: '£', scale: [1000, 100000] });
    ok(plain.accepted() && plain.el.querySelector('.ui-suggested').hidden, 'suggested: a plain value is accepted from the start');
  }

  /* ---------- fee rail: typed entry ---------- */
  {
    const r = rec();
    const c = M.ui.fee(host(), { ...r.opts, id: 'retainer', words: ['Lowest', 'Typical', 'Highest'] });
    const inputs = [...c.el.querySelectorAll('.fee-faces input.figure')];
    const caps = [...c.el.querySelectorAll('.fee-faces .cap')].map((x) => x.textContent);
    ok(inputs.length === 3 && JSON.stringify(caps) === '["Lowest","Typical","Highest"]', 'fee: three typed figures with their captions');
    ok(inputs.every((i) => i.value === '' && i.placeholder === '0') && c.get() === null && c.el.classList.contains('empty'), 'fee: unwritten until the visitor gives a figure');
    ok([...c.el.querySelectorAll('.fee-faces .unit')].length === 3 && c.el.querySelector('.fee-faces .unit').textContent === '£', 'fee: the £ leads each figure');
    ok(inputs.map((i) => i.getAttribute('aria-label')).join('|') === 'Lowest|Typical|Highest', 'fee: each figure is named');
    ok(c.el.querySelector('.ui-readout').textContent === 'Lowest, typical, highest', 'fee: the readout names the three at rest');
    const [iMin, iAvg, iMax] = inputs;
    type(iAvg, '1250'); iAvg.blur();
    ok(c.get() && c.get().avg === 1250 && c.get().min === 500 && c.get().max === 2000, `fee: a typed typical is kept as typed, between the marks (${JSON.stringify(c.get())})`);
    ok(lastCommit(r) && lastCommit(r).avg === 1250, 'fee: the typed figure commits');
    ok(c.el.querySelector('.ui-readout').textContent === '£500 to £2,000, typical £1,250', `fee: the readout says the true figure (${c.el.querySelector('.ui-readout').textContent})`);
    // beyond the rail: kept, thumb parked at the end
    type(iMax, '35000'); iMax.blur();
    ok(c.get().max === 35000 && iMax.value === '35,000', 'fee: a figure beyond the rail (£35,000 over £20,000) is kept');
    ok(c.el.querySelector('.handle.ring:last-of-type').style.left === '100%' || [...c.el.querySelectorAll('.handle')][2].style.left === '100%', 'fee: its thumb waits at the rail\'s end');
    ok(lastCommit(r).max === 35000, 'fee: and it commits as typed');
    // the order holds by pushing the others, never by changing the figure typed
    type(iMin, '3000'); iMin.blur();
    ok(c.get().min === 3000 && c.get().avg === 3000, `fee: a lowest above the typical pushes the typical up, the typed figure stands (${JSON.stringify(c.get())})`);
    type(iMax, '2500'); iMax.blur();
    ok(c.get().max === 2500 && c.get().min === 2500 && c.get().avg === 2500, `fee: a highest under both pulls them down to it (${JSON.stringify(c.get())})`);
    // decimals survive
    type(iAvg, '37.5'); iAvg.blur();
    ok(c.get().avg === 37.5 && iAvg.value === '37.5' && c.get().min === 37.5, 'fee: 37.5 keeps its decimal');
    // text that is no figure stays with a line, the value keeps the last figure
    type(iMin, 'about 500'); iMin.blur();
    const note = iMin.parentElement.querySelector('.ui-note');
    ok(iMin.value === 'about 500' && !note.hidden && note.textContent === 'Figures only, such as 4,800 or 4.8k' && iMin.getAttribute('aria-invalid') === 'true', 'fee: words in the field stay, with the line beside them');
    ok(isFinite(c.get().min), 'fee: the value keeps a figure for that part');
    // Escape reverts to the last committed
    type(iMin, '900'); key(iMin, 'Escape');
    ok(c.get().min === lastCommit(r).min, 'fee: Escape reverts the typed figure');
    // arrows on the typed figure step along the rail
    type(iAvg, '1000'); iAvg.blur();
    iAvg.focus(); key(iAvg, 'ArrowUp');
    ok(c.get().avg > 1000 && iAvg.value !== '1,000', 'fee: ArrowUp inside the figure steps it and rewrites the field');
    // a press on a figure is never the start of a drag
    iAvg.blur();
    const before = r.inputs.length;
    ptr(iAvg, 'pointerdown', 10);
    ok(r.inputs.length === before && !c.el.classList.contains('active'), 'fee: a pointer press on a typed figure does not start a drag');
    // clear resets all three
    c.clear();
    ok(c.get() === null && inputs.every((i) => i.value === ''), 'fee: clear() empties the three figures');
    // a drag on the rail still works and snaps on release; the figures follow
    const box = c.el.querySelector('.rail-box');
    ptr(box, 'pointerdown', 200); ptr(box, 'pointermove', 240); ptr(box, 'pointerup', 240);
    const v = c.get();
    ok(v && [v.min, v.avg, v.max].every((x) => isFinite(x)) && inputs.every((i) => i.value !== ''), `fee: a drag writes all three figures (${JSON.stringify(v)})`);
    ok(v.avg % 50 === 0, 'fee: the released thumb snapped to a mark');
    ok(!/fee-figs|fee-fig\b/.test(FEEL_CSS), 'fee: the floating figures and their overlap rule are gone from feel.css');
  }

  /* ---------- the rail: continuous in hand, snapped on release ---------- */
  {
    const r = rec();
    const c = M.ui.slider(host(), { ...r.opts, unit: '£', scale: [1000, 100000] });
    const box = c.el.querySelector('.rail-box');
    ptr(box, 'pointerdown', 100); ptr(box, 'pointermove', 133);
    const mid = c.get();
    ptr(box, 'pointerup', 133);
    const end = c.get();
    ok(isFinite(mid) && String(mid).replace(/\.\d+$/, '').replace(/0+$/, '').length <= 3, `rail: while in hand the figure has three significant figures (${mid})`);
    ok(end % 50 === 0 || end % 100 === 0 || end % 1000 === 0, `rail: on release it sits on a mark (${end})`);
    ok(r.commits.length === 1 && lastCommit(r) === end, 'rail: one commit, on release');
    const p = M.ui.pair(host(), { unit: '£', scale: [100, 20000], labels: ['Now', 'At most'] });
    const pb = p.el.querySelector('.rail-box');
    ptr(pb, 'pointerdown', 100); ptr(pb, 'pointermove', 150); ptr(pb, 'pointerup', 150);
    ok(p.get()[0] % 50 === 0, `pair: snaps on release too (${p.get()[0]})`);
  }

  /* ---------- the ring: typed figure ---------- */
  {
    const r = rec();
    const c = M.ui.ring(host(), { ...r.opts, unit: '%', label: 'Margin' });
    const inp = c.el.querySelector('.ring-face input.figure');
    ok(inp && inp.getAttribute('aria-label') === 'Margin' && !c.el.querySelector('[role="slider"]').contains(inp), 'ring: a typed figure over the centre, outside the slider box (which has presentational children)');
    type(inp, '37.5'); inp.blur();
    ok(c.get() === 37.5 && lastCommit(r) === 37.5 && inp.value === '37.5', 'ring: 37.5 typed is kept, not rounded to the ring\'s step of 5');
    ok(c.el.querySelector('[role="slider"]').getAttribute('aria-valuenow') === '37.5', 'ring: the slider box says the typed figure');
    type(inp, '140'); inp.blur();
    const note = c.el.querySelector('.ring-face .ui-note');
    ok(c.get() === 140 && !note.hidden && note.textContent === 'From 0% to 100%', 'ring: a figure past the ring is kept with the range beside it');
    type(inp, '40'); inp.blur();
    ok(note.hidden && c.get() === 40, 'ring: back in range, the line goes');
    inp.focus(); key(inp, 'ArrowUp');
    ok(c.get() === 45 && inp.value === '45', 'ring: ArrowUp in the figure steps by the ring\'s step and rewrites the field');
    key(inp, 'ArrowRight');
    ok(c.get() === 45, 'ring: ArrowRight in the figure is the caret\'s, not a step');
    const box = c.el.querySelector('.ring-ctl');
    box.focus(); key(box, 'ArrowUp');
    ok(c.get() === 50, 'ring: the ring\'s own arrows still step');
    c.clear();
    ok(c.get() === null && inp.value === '', 'ring: clear() empties the figure');
  }

  /* ---------- clientCards: round trip ---------- */
  {
    const r = rec();
    const c = M.ui.clientCards(host(), { ...r.opts, max: 5, id: 'lastFive' });
    ok(c.el.classList.contains('ui-clients') && JSON.stringify(c.get()) === '[]' && c.el.classList.contains('empty'), 'clients: none to start, [] is the value');
    const add = c.el.querySelector('.cc-add');
    ok(add.textContent === 'Add a client' && c.el.querySelector('.cc-count').textContent === 'No clients added yet', 'clients: the add button and the count at rest');
    click(add);
    ok(c.get().length === 1 && c.el.querySelectorAll('.cc-card').length === 1 && document.activeElement === c.el.querySelector('.cc-text'), 'clients: one card added, focus in its label');
    ok(add.textContent === 'Add another client' && c.el.querySelector('.cc-count').textContent === '1 of 5', 'clients: the words change once one exists');
    const card = c.el.querySelector('.cc-card');
    const labs = [...card.querySelectorAll('.cc-lab')].map((x) => x.textContent);
    ok(labs.length === 7 && labs[0] === 'A label for them, not a name' && labs[1] === 'Type of buyer' && labs[2] === 'What they bought' && labs[3] === 'How they found you' && labs[4] === 'What made them valuable' && labs[5] === 'Approximate value, if known' && labs[6] === 'How easy the work was', `clients: the seven fields (${labs.join(' | ')})`);
    const [label, bought] = card.querySelectorAll('.cc-text');
    type(label, 'the cafe'); label.blur();
    click(card.querySelector('.cc-buyer [data-v="business"]'));
    type(bought, 'Monthly bookkeeping'); bought.blur();
    click(card.querySelector('.cc-found [data-v="referral"]'));
    click(card.querySelector('.cc-valuable [data-v="repeat"]')); click(card.querySelector('.cc-valuable [data-v="easy"]'));
    const money = card.querySelector('.cc-money input');
    type(money, '4.8k'); money.blur();
    click(card.querySelector('.cc-ease [data-v="easy"]'));
    const v = c.get()[0];
    ok(v.label === 'the cafe' && v.buyer === 'business' && v.bought === 'Monthly bookkeeping' && v.found === 'referral' && JSON.stringify(v.valuable) === '["repeat","easy"]' && v.value === 4800 && v.ease === 'easy', `clients: every field lands in the card (${JSON.stringify(v)})`);
    ok(lastCommit(r) && lastCommit(r)[0].ease === 'easy', 'clients: the array commits on every field commit');
    ok(c.el.querySelector(':scope > .ui-readout').textContent === '1 client', 'clients: the readout (the instrument\'s own, its last child) counts');
    // add a second, reorder by tap, remove
    click(add);
    const cards = () => [...c.el.querySelectorAll('.cc-card')];
    type(cards()[1].querySelector('.cc-text'), 'the dentist'); cards()[1].querySelector('.cc-text').blur();
    ok(c.get().length === 2 && c.get()[1].label === 'the dentist' && cards()[1].querySelector('.cc-title').textContent === 'Client 2', 'clients: a second card, numbered');
    ok(cards()[0].querySelector('.cc-btn.up').getAttribute('aria-disabled') === 'true' && cards()[1].querySelector('.cc-btn.down').getAttribute('aria-disabled') === 'true', 'clients: Up on the first and Down on the last do nothing');
    click(cards()[1].querySelector('.cc-btn.up'));
    ok(c.get()[0].label === 'the dentist' && c.get()[1].label === 'the cafe' && cards()[0].querySelector('.cc-text').value === 'the dentist', 'clients: Up by tap moves the card and its fields');
    ok(cards()[0].querySelector('.cc-title').textContent === 'Client 1' && document.activeElement === cards()[0].querySelector('.cc-btn.up'), 'clients: renumbered, focus kept on the pressed button');
    const t = cards()[0].querySelector('.cc-title'); t.focus(); key(t, 'ArrowDown', { shiftKey: true });
    ok(c.get()[1].label === 'the dentist', 'clients: Shift+Down on the heading moves it down');
    click(cards()[1].querySelector('.cc-btn.remove'));
    ok(c.get().length === 1 && c.get()[0].label === 'the cafe' && cards().length === 1 && document.activeElement === cards()[0].querySelector('.cc-title'), 'clients: Remove takes the card away, focus stays inside');
    // round trip through set / get
    const saved = JSON.parse(JSON.stringify(c.get()));
    const d = M.ui.clientCards(host(), { max: 5, value: saved });
    ok(JSON.stringify(d.get()) === JSON.stringify(saved) && d.el.querySelectorAll('.cc-card').length === 1 && d.el.querySelector('.cc-text').value === 'the cafe' && d.el.querySelector('.cc-money input').value === '4,800' && d.el.querySelector('.cc-valuable [data-v="repeat"]').getAttribute('aria-checked') === 'true', 'clients: a saved array mounts back into the same cards');
    d.set([...saved, { label: 'the school', buyer: 'organisation' }]);
    ok(d.get().length === 2 && d.get()[1].label === 'the school' && d.get()[1].value === null && JSON.stringify(d.get()[1].valuable) === '[]', 'clients: set() with a partial card fills the shape');
    d.clear();
    ok(JSON.stringify(d.get()) === '[]' && d.el.querySelectorAll('.cc-card').length === 0, 'clients: clear() (Not sure) leaves none');
    // the maximum
    const e = M.ui.clientCards(host(), { max: 2 });
    click(e.el.querySelector('.cc-add')); click(e.el.querySelector('.cc-add'));
    ok(e.get().length === 2 && e.el.querySelector('.cc-add').hidden, 'clients: at the maximum the add button goes');
    click(e.el.querySelector('.cc-add'));
    ok(e.get().length === 2, 'clients: and nothing more is added');
    // the caller's words
    const f = M.ui.clientCards(host(), { cardWords: 'Customer', fields: { buyer: { label: 'Who paid', options: [['x', 'X']] } } });
    click(f.el.querySelector('.cc-add'));
    ok(f.el.querySelector('.cc-title').textContent === 'Customer 1' && f.el.querySelector('.cc-buyer .cc-lab').textContent === 'Who paid' && f.el.querySelector('.cc-buyer [data-v="x"]'), 'clients: opts.fields and cardWords pass the caller\'s words');
    ok([...c.el.querySelectorAll('.cc-btn')].every((b) => b.getAttribute('aria-label')), 'clients: every icon button is named');
  }

  /* ---------- sorter: the tap alternative to a drag ---------- */
  {
    const r = rec();
    const c = M.ui.sorter(host(), { ...r.opts, routesFor: () => [] });
    const discs = [...c.el.querySelectorAll('.disc-n')], bins = [...c.el.querySelectorAll('.bin')];
    ptr(discs[0], 'pointerdown', 10); ptr(discs[0], 'pointerup', 10);
    ok(discs[0].getAttribute('aria-pressed') === 'true' && c.el.classList.contains('armed'), 'sorter: a tap on a disc arms it (no drag)');
    click(bins[2]);
    ok(c.get()[0].bin === 'cold11' && discs[0].classList.contains('placed') && !c.el.classList.contains('armed'), 'sorter: a tap on a bin places the armed disc');
    ok(bins[2].contains(discs[0]), 'sorter: the disc sits in its bin');
    for (let i = 1; i < 5; i++) { ptr(discs[i], 'pointerdown', 10); ptr(discs[i], 'pointerup', 10); click(bins[0]); }
    ok(c.get().every((x) => x.bin) && r.commits.length === 1, 'sorter: five taps and five bin presses complete the sort with one commit');
    // the keyboard path is still there
    const d = M.ui.sorter(host(), { partial: true, routesFor: () => [] });
    const dd = d.el.querySelector('.disc-n'); dd.focus(); key(dd, ' ');
    ok(document.activeElement.classList.contains('bin'), 'sorter: Space on a disc picks it up and focus goes to the bins');
    key(document.activeElement, 'Enter');
    ok(d.get()[0].bin === 'warm11', 'sorter: Enter on a bin places it');
  }

  /* ---------- sort: the tap alternative for the order (E41 energy) ---------- */
  {
    const r = rec();
    const c = M.ui.sort(host(), { ...r.opts, order: true, zones: ['Gives energy', 'Drains'], topWords: ['Most energising', 'Most draining'], tiles: [['sell', 'Selling'], ['make', 'Making'], ['admin', 'Admin'], ['people', 'Managing people']] });
    ok(c.el.classList.contains('ordered') && c.el.querySelector('.sort-zone.left .sort-top').textContent === 'Most energising' && c.el.querySelector('.sort-zone.right .sort-top').textContent === 'Most draining', 'sort: the top positions are named');
    const tile = (id) => c.el.querySelector(`.tile[data-id="${id}"]`);
    // tap once: left (already the tap alternative for the placing)
    ptr(tile('sell'), 'pointerdown', 10); ptr(tile('sell'), 'pointerup', 10);
    ptr(tile('make'), 'pointerdown', 10); ptr(tile('make'), 'pointerup', 10);
    ok(JSON.stringify(c.get().strengths) === '["sell","make"]', 'sort: two taps place two tiles in order');
    const item = (id) => tile(id).closest('.sort-item');
    ok(item('make') && item('make').querySelector('.sort-move.up') && item('make').parentElement.classList.contains('left'), 'sort: a placed tile carries Up and Down');
    ok(item('sell').querySelector('.sort-move.up').getAttribute('aria-disabled') === 'true' && item('make').querySelector('.sort-move.down').getAttribute('aria-disabled') === 'true', 'sort: the top cannot go up, the bottom cannot go down');
    click(item('make').querySelector('.sort-move.up'));
    ok(JSON.stringify(c.get().strengths) === '["make","sell"]', 'sort: Up by tap reorders the zone');
    const left = c.el.querySelector('.sort-zone.left');
    ok(left.children[2] === item('make') && left.children[3] === item('sell'), 'sort: the DOM follows the order');
    ok(tile('make').getAttribute('aria-label') === 'Making, Gives energy, 1 of 2' && tile('sell').getAttribute('aria-label') === 'Selling, Gives energy, 2 of 2', 'sort: each tile says its place');
    ok(lastCommit(r).strengths[0] === 'make', 'sort: the order commits');
    // Shift+Down on the keyboard
    tile('make').focus(); key(tile('make'), 'ArrowDown', { shiftKey: true });
    ok(JSON.stringify(c.get().strengths) === '["sell","make"]' && document.activeElement === tile('make'), 'sort: Shift+Down moves the tile and keeps focus on it');
    key(tile('make'), 'ArrowDown');
    ok(document.activeElement !== tile('make'), 'sort: a plain Down still moves focus');
    // the unordered sort is untouched
    const u = M.ui.sort(host(), { tiles: [['a', 'A'], ['b', 'B']] });
    ok(!u.el.classList.contains('ordered') && !u.el.querySelector('.sort-item') && !u.el.querySelector('.sort-top'), 'sort: without `order` no wrappers and no top words');
    ptr(u.el.querySelector('.tile'), 'pointerdown', 10); ptr(u.el.querySelector('.tile'), 'pointerup', 10);
    ok(u.get().strengths[0] === 'a' && u.el.querySelector('.sort-zone.left .tile'), 'sort: the tap path on the plain sort is as it was');
    ok(/\.ui \.sort-move \{[^}]*height: 44px/.test(FEEL_CSS), 'sort: Up and Down are 44 px tall');
  }

  /* ---------- sound: never before a gesture; the mute persists ---------- */
  {
    const w = boot();
    let made = 0;
    w.AudioContext = function () { made++; this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {};
      const node = () => ({ connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} }, frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 0 }, pan: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} }, start() {}, stop() {}, type: '' });
      this.createGain = node; this.createBiquadFilter = node; this.createOscillator = node; this.createStereoPanner = node; this.createBufferSource = () => ({ ...node(), buffer: null }); this.createBuffer = () => ({ getChannelData: () => new Float32Array(10) }); this.resume = () => Promise.resolve(); this.suspend = () => Promise.resolve(); };
    w.Mercer.feel.play('tap');
    w.Mercer.feel.play('done', { octave: true });
    ok(made === 0, 'sound: nothing plays and no AudioContext exists before a user gesture');
    w.Mercer.feel.birds.allowed = true; w.Mercer.feel.birds.start();
    ok(made === 0, 'sound: the birds cannot start a context either');
    w.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true }));
    w.Mercer.feel.play('tap');
    ok(made === 1, 'sound: after a gesture the context is built and the tap plays');
    w.Mercer.feel.setMuted(true);
    ok(w.localStorage.getItem('mercer-sound') === 'off' && w.Mercer.feel.muted() === true, 'sound: the mute is written to localStorage');
    const w2 = boot({ storage: { 'mercer-sound': 'off' } });
    ok(w2.Mercer.feel.muted() === true, 'sound: a fresh load reads the mute back');
    w2.Mercer.feel.setMuted(false);
    ok(w2.localStorage.getItem('mercer-sound') === 'on' && w2.Mercer.feel.muted() === false, 'sound: and unmuting persists too');
    const btn = w2.document.createElement('button'); btn.id = 'sound'; w2.document.body.appendChild(btn);
    w2.Mercer.feel.mountSwitch();
    ok(btn.getAttribute('aria-pressed') === 'true' && btn.title === 'Sound on' && btn.classList.contains('feel-sound'), 'sound: the switch reports its state');
  }

  /* ---------- motion and reduced motion ---------- */
  {
    // the instruments' own transitions; the v11 gauge (.feel-gauge, .feel-fill: results' meter) keeps its 500 ms fill
    const uiCss = FEEL_CSS.split('\n').filter((l) => /^\s*\.ui|^\.disc-ghost/.test(l)).join('\n');
    const durs = [...uiCss.matchAll(/transition:[^;]*?(\d*\.\d+)s/g)].map((m) => parseFloat(m[1]));
    ok(durs.length > 10 && durs.every((d) => d <= 0.3), `motion: every instrument transition is 300 ms or under (${Math.max(...durs) * 1000} ms at most)`);
    // one-shot animations only: the dial's "working" ring is an infinite progress indicator, not a transition
    const anims = [...uiCss.matchAll(/animation:([^;]*);/g)].filter((m) => !/infinite|none/.test(m[1])).map((m) => parseFloat(/(\d*\.\d+)s/.exec(m[1])?.[1] ?? '0'));
    ok(anims.every((d) => d <= 0.5), `motion: no one-shot instrument animation over half a second (${Math.max(...anims) * 1000} ms at most: the socket's seating)`);
    ok(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.ui \.card, \.ui \.card-mark/.test(FEEL_CSS), 'motion: cards honour reduced motion');
    ok(!/cursor|mousemove/.test(FEEL_JS.replace(/cursor: (grab|pointer|default|text)/g, '')) || !/mousemove/.test(FEEL_JS), 'motion: no cursor-following light (no mousemove handler in feel.js)');
    const w = boot({ reduced: true });
    ok(w.Mercer.feel.reduced() === true, 'motion: reduced() reads the preference');
  }

  /* ---------- the contract: every old name still there ---------- */
  {
    const names = ['slider', 'pair', 'fee', 'stones', 'cards', 'tenStones', 'ring', 'keptRing', 'arc', 'capacity', 'shelves', 'sorter', 'ledger', 'sort', 'tableRing', 'twoSided', 'socket', 'dial', 'monthsArc', 'line', 'field', 'clientCards', 'hint', 'filePick', 'parseNum', 'fmtNum', 'fmtKeep', 'withUnit', 'shortNum'];
    ok(names.every((n) => typeof M.ui[n] === 'function'), 'contract: every M.ui name, old and new, is a function');
    const feel = ['play', 'panOf', 'key', 'birds', 'pulse', 'toggle', 'bindDrop', 'reveal', 'grade', 'paintGrade', 'gradeColor', 'gauge', 'possessive', 'muted', 'setMuted', 'mountSwitch', 'reduced', 'EASE', 'measure'];
    ok(feel.every((n) => M.feel[n] !== undefined), 'contract: every M.feel name is still exported');
    const c = M.ui.slider(host(), { value: 5 });
    ok(['el', 'get', 'set', 'clear', 'focus', 'destroy', 'accept', 'suggest', 'accepted', 'suggested'].every((k) => k in c), 'contract: the instrument shape, plus accept / suggest / accepted / suggested');
  }

  console.log(`feel-rebuild1: ${passed} passed, ${fails.length} failed`);
  fails.forEach((f) => console.log(' - ' + f));
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
