/* Results 1, interview (questions.js, ghost.js): the starter's opening branch (D9). Plain node + the jsdom the earlier
   harnesses used. Run: node tests/interview-start.cjs
   Covers: the startPoint screen after n01 and the fourteen follow-ups in the registry (route, tier, section, control,
   copy); n25 and n26 settled by the start and never a screen; which follow-ups each start shows; the tie-breaker only
   while two ideas still stand; the derived n25/n26 on every start, an older save included; every renderer mounts and
   writes its keys; a word for every new id; the endings under the new lines; no em dash and no "Next" in the new copy. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require(path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'))); } catch (e) { try { ({ JSDOM } = require('jsdom')); } catch (e2) { console.log('SKIP: jsdom not found (expected at ../labtest/node_modules/jsdom)'); process.exit(0); } }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) { pass++; console.log('ok  ' + msg); } else { fails.push(msg); console.log('FAIL ' + msg); } };

function page() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><input id="biz"><main><div id="q-body"></div><button id="next" disabled>Continue</button></main></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/' });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.HTMLElement.prototype.animate = function () { const p = Promise.resolve(); return { finished: p, cancel() {}, finish() {}, playState: 'finished', effect: { getComputedTiming: () => ({ endTime: 0 }) } }; };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.HTMLElement.prototype.releasePointerCapture = function () {};
  window.Element.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 320, height: 44, right: 320, bottom: 44 }; };
  window.PointerEvent = window.MouseEvent;
  window.Mercer = {};
  ['sectors.js', 'feel.js', 'ghost.js', 'founder.js', 'build.js'].forEach((f) => window.eval(src(f)));
  const M = window.Mercer;
  M.gbp = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
  M.count = (n) => Math.round(Number(n) || 0).toLocaleString('en-GB');
  M.flow = { forward() {}, backward() {} };
  const commits = [];
  // the flow's commit, as the flow harness has it: the value lands under the entry's key and derive runs
  M.commit = (id, value) => { commits.push({ id, value }); const q = M.SCHEMA_BY?.[id]; if (q) M.state[q.key] = value; else M.state[id] = value; try { M.derive?.(id); } catch (e) { fails.push(`derive(${id}) threw: ${e.message}`); } };
  M.state = fresh('starter');
  window.eval(src('questions.js'));
  window.eval(src('research.js'));
  const body = window.document.getElementById('q-body');
  const next = window.document.getElementById('next');
  const enable = () => { next.disabled = false; };
  let live = null;
  const mount = (id) => { try { live?.destroy?.(); } catch (e) { /* gone */ } next.disabled = true; body.innerHTML = ''; live = M.renderQuestion(id, body, enable); return live; };
  const type = (inp, text) => { inp.value = text; inp.dispatchEvent(new window.Event('input', { bubbles: true })); inp.dispatchEvent(new window.Event('blur')); };
  const buttons = () => [...body.querySelectorAll('button')];
  const press = (words) => { const b = buttons().find((x) => x.textContent.trim() === words) ?? buttons().find((x) => x.textContent.includes(words)); if (!b) throw new Error(`no button "${words}" among: ${buttons().map((x) => x.textContent.trim()).join(' | ')}`); b.click(); return b; };
  const lines = () => [...body.querySelectorAll('textarea, input[type="text"], input:not([type])')].filter((x) => !x.closest('[hidden]'));
  return { window, M, body, next, mount, type, press, buttons, lines, commits };
}
const fresh = (route) => ({ route, notSure: new Set(), na: new Set(), derived: {}, doing: [], tried: [], went: {}, asked: [], appetite: 'moderate', stack: {}, stackNames: {}, personalityAxes: [null, null, null, null] });
const NEW = ['startPoint', 's01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14'];
const ONE = ['s01', 's02', 's03', 's04', 's05'], FEW = ['s06', 's07', 's08', 's09'], TRIED = ['s10', 's11', 's12', 's13', 's14'];

(async () => {
  const P = page();
  const { M, body, next, mount, type, press, lines } = P;
  const R = M.registry, BY = M.SCHEMA_BY;
  const screens = (st) => { M.state = { ...fresh('starter'), ...st }; return M.screensFor('starter', 3); };

  /* ---- 1. the registry ---- */
  const missing = NEW.filter((id) => !BY[id]);
  ok(missing.length === 0, `every id of D9 is in the registry${missing.length ? `: missing ${missing.join(' ')}` : ''}`);
  ok(NEW.every((id) => BY[id] && BY[id].route.length === 1 && BY[id].route[0] === 'starter'), 'all of them are on the starter route only');
  ok(NEW.every((id) => BY[id]?.tier === 1), 'all of them are first pass (tier 1)');
  ok(NEW.every((id) => BY[id]?.section === 'foundations'), 'all of them sit in the starting point section for the flow to place');
  ok(NEW.every((id) => !BY[id]?.on && !BY[id]?.hidden), 'none is a rider or hidden: one focused question a screen');
  const controls = [...new Set(R.map((q) => q.control))];
  ok(controls.length <= 26, `the control family is still small (${controls.length})`);
  ok(BY.startPoint.control === 'stones' && BY.s01.control === 'multi' && BY.s06.control === 'line' && BY.s07.control === 'cards' && BY.s08.control === 'cards' && BY.s09.control === 'cards' && BY.s11.control === 'multi' && BY.s13.control === 'sliders' && BY.s14.control === 'slider' && BY.s02.control === 'line' && BY.s04.control === 'stones' && BY.s12.control === 'stones', 'the instruments are the kinds the table names');
  ok(BY.startPoint.opts === undefined && M.headline('startPoint').sub === 'Where are you starting?', 'the opening question asks where they are starting');
  ok(BY.s13.optional === true && BY.s14.optional === true && BY.s13.unsure === 'Skip' && BY.s14.unsure === 'Skip', 's13 and s14 are optional, with Skip');
  ok(BY.startPoint.invalidates.includes('n27') && BY.startPoint.invalidates.includes('plan') && BY.startPoint.affects.includes('plan'), 'a changed start invalidates the directions and the plan');
  ok(BY.s06.invalidates.includes('s07') && BY.s06.invalidates.includes('s08') && BY.s06.invalidates.includes('s09') && BY.s08.invalidates.includes('s07') && BY.s09.invalidates.includes('s07'), 'changed ideas invalidate their comparison and the tie-breaker');
  ok(BY.s01.invalidates.includes('n31') && BY.s04.invalidates.includes('n33') && BY.s05.invalidates.includes('n35') && BY.s11.invalidates.includes('n38') && BY.s14.invalidates.includes('n37') && BY.s12.invalidates.includes('n33'), 'each follow-up invalidates the later screen its answer moves');
  const refs = NEW.flatMap((id) => [...BY[id].satisfiedBy, ...BY[id].invalidates.filter((x) => x !== 'plan')]);
  ok(refs.every((x) => BY[x]), 'every id they name exists');
  /* n25 and n26 */
  ok(BY.n25.hidden === true && BY.n26.hidden === true && !M.schemaApplies('n25') && !M.schemaApplies('n26'), 'n25 and n26 are no longer screens');
  ok(BY.n25.satisfiedBy.includes('startPoint') && BY.n26.satisfiedBy.includes('startPoint'), 'both are satisfied by the starting point');
  ok(BY.n26.on === undefined, 'n26 no longer rides on n25');
  const all3 = screens({});
  ok(!all3.includes('n25') && !all3.includes('n26'), 'neither is on any walk at any tier');
  ok(all3.indexOf('startPoint') === all3.indexOf('n01') + 1, `the starting point follows n01 (${all3.slice(0, 4).join(' ')})`);
  ok(all3.indexOf('startPoint') > all3.indexOf('place'), 'and comes after the location, so the priced follow-up is asked with a currency known');

  /* ---- 2. the copy ---- */
  const words = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;
  const longTitle = NEW.filter((id) => words(M.headline(id).title) > 3);
  ok(longTitle.length === 0, `every new title is one to three words${longTitle.length ? `: ${longTitle.map((id) => `${id} "${M.headline(id).title}"`).join(', ')}` : ''}`);
  ok(NEW.every((id) => M.headline(id).sub.length > 8), 'every new screen asks a question');
  const copy = NEW.flatMap((id) => [M.headline(id).title, M.headline(id).sub, M.explain(id), ...((BY[id].opts ?? []).map((o) => o[1]))]);
  ok(copy.every((t) => !/\u2014/.test(t)), 'no em dash in the new copy');
  ok(copy.every((t) => !/\bNext\b/.test(t)), 'the new copy never says Next');
  ok(copy.every((t) => !/\d/.test(t)), 'no figure nobody supplied in the new copy');
  const optLabels = ['s04', 's05', 's12'].flatMap((id) => BY[id].opts.map((o) => o[1]));
  ok(optLabels.every((t) => words(t) <= 4), `option labels are short (${optLabels.join(' | ')})`);
  ok(BY.s04.opts.map((o) => o[0]).join(' ') === 'nobody asked paidonce paidmore' && BY.s12.opts.map((o) => o[0]).join(' ') === 'noreplies replies fewsales stopped' && BY.s05.opts.map((o) => o[0]).join(' ') === 'yes help notyet', 'the option values are the ones the table names');
  ok(M.headline('n25').sub.includes('Settled') && M.headline('n26').sub.includes('Settled'), 'the old rows say they are settled by the start');

  /* ---- 3. which follow-ups each start shows ---- */
  const none = screens({ startPoint: 'none' });
  ok(!NEW.slice(1).some((id) => none.includes(id)), 'no idea yet asks nothing new: the discovery prompts already establish it');
  const one = screens({ startPoint: 'one' });
  ok(ONE.every((id) => one.includes(id)) && ![...FEW, ...TRIED].some((id) => one.includes(id)), `one idea asks s01 to s05 and nothing of the other branches (${one.filter((id) => id.startsWith('s')).join(' ')})`);
  ok(one.indexOf('s01') < one.indexOf('s02') && one.indexOf('s02') < one.indexOf('s03') && one.indexOf('s03') < one.indexOf('s04') && one.indexOf('s04') < one.indexOf('s05'), 'in the order the table gives');
  const tried = screens({ startPoint: 'tried' });
  ok(TRIED.every((id) => tried.includes(id)) && ![...ONE, ...FEW].some((id) => tried.includes(id)), `already tried asks s10 to s14 and nothing else new (${tried.filter((id) => id.startsWith('s')).join(' ')})`);
  const fewEmpty = screens({ startPoint: 'few' });
  ok(fewEmpty.includes('s06') && !fewEmpty.includes('s08') && !fewEmpty.includes('s09') && !fewEmpty.includes('s07') && !fewEmpty.includes('s05'), 'a few ideas asks for the lines first; nothing compares ideas that are not there yet');
  const few3 = screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'] });
  ok(few3.includes('s08') && few3.includes('s09') && few3.indexOf('s08') < few3.indexOf('s09') && few3.indexOf('s09') < few3.indexOf('s07'), 'with ideas, which had demand and which is deliverable are asked before the tie-breaker');
  ok(few3.includes('s07') && !few3.includes('s05'), 'with neither answered, all three stand: the tie-breaker is asked and the small-version question waits');
  ok(!screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i0', s09: 'i0' }).includes('s07'), 'one idea named by both leaves one standing: no tie-breaker');
  ok(screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i0', s09: 'i0' }).includes('s05'), 'and the small-version question is asked for the chosen idea');
  ok(screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i0', s09: 'i1' }).includes('s07'), 'two different ideas named leaves two standing: the tie-breaker is asked');
  ok(!screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i1', s09: 'none' }).includes('s07'), 'one named and none for the other leaves one standing');
  ok(screens({ startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'none', s09: 'none' }).includes('s07'), 'none for both leaves all standing: the tie-breaker decides');
  ok(!screens({ startPoint: 'few', s06: ['Dog walking'], s08: 'none', s09: 'none' }).includes('s07'), 'one idea only never needs a tie-breaker');
  M.state = { ...fresh('starter'), startPoint: 'few', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i0', s09: 'i1' };
  ok(M.standingIdeas().map((x) => x.id).join(' ') === 'i0 i1' && M.chosenIdea() === null, 'standingIdeas names the two; nothing is chosen until the tie-breaker');
  M.state.s07 = 'i1';
  ok(M.chosenIdea()?.text === 'Cakes for events' && M.ownIdeaText() === 'Cakes for events' && M.schemaAnswered('s07'), 'the tie-breaker chooses, and the chosen idea is the visitor’s own idea in their words');
  M.state.s07 = 'i2';
  ok(!M.schemaAnswered('s07') && M.chosenIdea() === null, 'a tie-breaker pick that no longer stands is not an answer');
  M.state = { ...fresh('starter'), startPoint: 'few', s06: ['Dog walking', 'Cakes for events'], s08: 'i5', s09: 'i0' };
  ok(!M.schemaAnswered('s08') && M.schemaAnswered('s09') && M.chosenIdea()?.id === 'i0', 'a pick outside the list is not an answer; the other pick still chooses');

  /* ---- 4. derive: n25 and n26 follow the start, an older save included ---- */
  M.state = fresh('starter');
  mount('startPoint');
  ok(P.buttons().filter((b) => ['No idea yet', 'A few ideas', 'One idea', 'Already tried something'].includes(b.textContent.trim())).length === 4, 'the four starts are the choices');
  ok(lines().length === 0, 'no idea line until One idea is pressed');
  press('One idea');
  ok(M.state.startPoint === 'one' && M.state.n25 === 'yes' && M.state.derived.n25 === 'startPoint' && M.state.n26 === 'no', 'One idea: n25 is yes, derived from the start; n26 is no');
  ok(!next.disabled, 'Continue is open at once: the line is optional');
  ok(lines().length === 1, 'One idea opens the optional line for it');
  type(lines()[0], 'a bookkeeping service for local tradespeople');
  ok(M.state.n25Text === 'a bookkeeping service for local tradespeople' && M.ownIdeaText() === M.state.n25Text, 'the line writes the key the old idea screen wrote');
  press('Already tried something');
  ok(M.state.startPoint === 'tried' && M.state.n25 === 'no' && M.state.n26 === 'offered' && M.state.derived.n26 === 'startPoint', 'Already tried: n25 no (one or few is yes), n26 offered until what happened says it sold');
  ok(lines().length === 0, 'and the idea line is put away');
  M.commit('s12', 'fewsales');
  ok(M.state.n26 === 'sold', 'a few sales makes n26 sold');
  M.commit('s12', 'stopped');
  ok(M.state.n26 === 'sold', 'sales that stopped still sold');
  M.commit('s12', 'noreplies');
  ok(M.state.n26 === 'offered', 'no replies is offered, not sold');
  press('A few ideas');
  ok(M.state.n25 === 'yes' && M.state.n26 === 'no', 'A few ideas: n25 yes, n26 no');
  press('No idea yet');
  ok(M.state.n25 === 'no' && M.state.n26 === 'no', 'No idea yet: both no');
  // an older save answered n25 itself; the start replaces it, since nothing asks n25 any more
  M.state = { ...fresh('starter'), n25: 'yes', n25Text: 'cakes', n26: 'sold' };
  M.commit('startPoint', 'none');
  ok(M.state.n25 === 'no' && M.state.n26 === 'no' && M.state.derived.n25 === 'startPoint', 'an older save’s own n25 and n26 give way to the start');
  ok(M.state.n25Text === 'cakes', 'its idea text is kept');

  /* ---- 5. every renderer mounts and writes its keys ---- */
  M.state = { ...fresh('starter'), startPoint: 'one' };
  mount('s01');
  ok(P.buttons().some((b) => b.textContent.trim() === 'Tradespeople') && P.buttons().some((b) => b.textContent.trim() === 'Another group'), 'who would pay offers the groups the visitor is asked about elsewhere, plus Another group');
  press('Tradespeople');
  ok(Array.isArray(M.state.s01) && M.state.s01.includes('trades') && !next.disabled, 'a group picked is an answer');
  press('Another group');
  ok(M.state.s01.includes('other') && next.disabled && lines().length === 1, 'Another group opens a line and holds Continue until it is filled');
  type(lines()[0], 'small landlords');
  ok(M.state.s01Other === 'small landlords' && !next.disabled && M.schemaAnswered('s01'), 'the line fills it and Continue opens');
  ['s02', 's03'].forEach((id) => { mount(id); ok(lines().length === 1 && next.disabled, `${id} is one line, held until something is typed`); type(lines()[0], `an answer for ${id}`); ok(M.state[id] === `an answer for ${id}` && !next.disabled, `${id} writes its key`); });
  mount('s04'); press('Paid once');
  ok(M.state.s04 === 'paidonce' && !next.disabled, 's04 writes its value');
  mount('s05'); press('With help');
  ok(M.state.s05 === 'help' && !next.disabled, 's05 writes its value');
  M.state = { ...fresh('starter'), startPoint: 'few' };
  mount('s06');
  ok(lines().length === 3 && next.disabled, 'a few ideas: three lines, held until one is typed');
  type(lines()[0], 'Dog walking');
  ok(Array.isArray(M.state.s06) && M.state.s06.join('|') === 'Dog walking' && !next.disabled, 'the first line is the list');
  type(lines()[2], 'Spreadsheet help');
  ok(M.state.s06.join('|') === 'Dog walking|Spreadsheet help' && M.ideas().length === 2, 'a third line with the second empty makes a list of two, in order');
  type(lines()[1], 'Cakes for events');
  ok(M.state.s06.join('|') === 'Dog walking|Cakes for events|Spreadsheet help', 'all three, in the order typed');
  mount('s08');
  const cardWords = P.buttons().map((b) => b.textContent.trim());
  ok(cardWords.some((t) => t.includes('Dog walking')) && cardWords.some((t) => t.includes('Cakes for events')) && cardWords.some((t) => t.includes('None of them')), `s08 is the ideas plus None of them (${cardWords.join(' | ')})`);
  press('Cakes for events');
  ok(M.state.s08 === 'i1' && !next.disabled, 's08 writes the idea’s id');
  mount('s09'); press('None of them');
  ok(M.state.s09 === 'none' && M.schemaAnswered('s09'), 's09 takes None of them');
  ok(!M.schemaApplies('s07') && M.chosenIdea()?.id === 'i1', 'one stands: no tie-breaker, the idea is chosen');
  M.state.s09 = 'i2';
  ok(M.schemaApplies('s07'), 'two stand: the tie-breaker applies');
  mount('s07');
  const tie = P.buttons().map((b) => b.textContent.trim());
  ok(tie.some((t) => t.includes('Cakes for events')) && tie.some((t) => t.includes('Spreadsheet help')) && !tie.some((t) => t.includes('Dog walking')) && !tie.some((t) => t.includes('None')), `the tie-breaker offers only what still stands (${tie.join(' | ')})`);
  press('Spreadsheet help');
  ok(M.state.s07 === 'i2' && M.chosenIdea()?.text === 'Spreadsheet help' && M.schemaApplies('s05'), 'the pick chooses, and the small-version question follows for it');
  M.state = { ...fresh('starter'), startPoint: 'tried' };
  mount('s10'); type(lines()[0], 'dog walking, to neighbours');
  ok(M.state.s10 === 'dog walking, to neighbours' && M.ownIdeaText() === 'dog walking, to neighbours', 's10 is the tried idea in their words');
  mount('s11'); press('In person');
  ok(M.state.s11.includes('inperson') && !next.disabled, 's11 writes the channel');
  press('Another way');
  ok(next.disabled && lines().length === 1, 'Another way opens a line');
  type(lines()[0], 'a card in the newsagent window');
  ok(M.state.s11Other === 'a card in the newsagent window' && !next.disabled, 'and the line fills it');
  mount('s12'); press('Replies, no sales');
  ok(M.state.s12 === 'replies' && M.state.n26 === 'offered', 's12 writes what happened and settles n26');
  mount('s13');
  const sliders = [...body.querySelectorAll('input')].filter((x) => !x.closest('[hidden]'));
  ok(sliders.length === 3 && !next.disabled, 's13 is three figures and Continue is open at once: it is optional');
  ok(!M.schemaAnswered('s13'), 'untouched, it is not an answer');
  type(sliders[0], '40'); type(sliders[2], '0');
  ok(M.state.s13Saw === 40 && M.state.s13Bought === 0 && (M.state.s13Replied === undefined || M.state.s13Replied === null), `saw and bought are written, replied left alone (${M.state.s13Saw} / ${M.state.s13Replied} / ${M.state.s13Bought})`);
  ok(M.state.s13 && M.state.s13.saw === 40 && M.state.s13.bought === 0 && M.state.s13.replied === null && M.schemaAnswered('s13'), 'and the object holds the three, nought included');
  mount('s14');
  ok(!next.disabled && !M.schemaAnswered('s14'), 's14 opens Continue at once and is not an answer until a figure is given');
  const priceIn = body.querySelector('input');
  type(priceIn, '0');
  ok(M.state.s14 === 0 && M.schemaAnswered('s14'), 'nought is an answer: it was free');

  /* ---- 6. a word for every new id ---- */
  M.state = { ...fresh('starter'), startPoint: 'few', n25: 'yes', n25Text: 'cakes', s01: ['trades', 'other'], s01Other: 'small landlords', s02: 'late invoices', s03: 'a spreadsheet', s04: 'paidmore', s05: 'yes', s06: ['Dog walking', 'Cakes for events', 'Spreadsheet help'], s08: 'i1', s09: 'i2', s07: 'i2', s10: 'dog walking, to neighbours', s11: ['friends', 'inperson'], s12: 'stopped', s13Saw: 40, s13Replied: 6, s13Bought: 2, s13: { saw: 40, replied: 6, bought: 2 }, s14: 0 };
  const noWord = NEW.filter((id) => { const w = M.answerWord(id); return typeof w !== 'string' || !w.trim(); });
  ok(noWord.length === 0, `answerWord gives a word for every new id${noWord.length ? `: none for ${noWord.join(' ')}` : ''}`);
  const longWord = NEW.filter((id) => M.answerWord(id).length > 26);
  ok(longWord.length === 0, `and each is short${longWord.length ? `: ${longWord.map((id) => `${id} "${M.answerWord(id)}"`).join(', ')}` : ''}`);
  ok(M.answerWord('startPoint') === 'A few ideas' && M.answerWord('s06') === '3 ideas' && M.answerWord('s07') === 'Spreadsheet help' && M.answerWord('s08') === 'Cakes for events' && M.answerWord('s14') === 'Free' && M.answerWord('s13') === '40 / 6 / 2' && M.answerWord('s01') === '2 picked', `the words read as expected (${['startPoint', 's06', 's07', 's13', 's14'].map((id) => M.answerWord(id)).join(' | ')})`);
  const answers = Object.fromEntries(M.schemaAnswers().map((a) => [a.id, a.answer]));
  ok(NEW.every((id) => typeof answers[id] === 'string' && answers[id]), 'schemaAnswers carries every new id for the export');
  ok(answers.s13 === '40 saw it, 6 replied, 2 bought' && answers.s01 === 'Tradespeople, small landlords' && answers.s11 === 'Friends and contacts, In person' && answers.s12 === 'Sales, then it stopped' && answers.s04 === 'Paid more than once', `the long forms read as sentences (${answers.s13}; ${answers.s01})`);
  ok(M.answerWord('n25') === 'Yes: cakes', 'n25 still has its word for the brain and the export');
  M.state = { ...fresh('starter'), startPoint: 'one', n25Text: 'cakes' };
  ok(M.answerWord('startPoint') === 'One idea' && answers.startPoint === 'A few ideas' && M.schemaAnswers().find((a) => a.id === 'startPoint').answer === 'One idea: cakes', 'the start’s long form carries the idea line');

  /* ---- 7. the directions fallback and the permissions check read the idea from any start ---- */
  M.starter = null;
  M.state = { ...fresh('starter'), startPoint: 'tried', s10: 'cakes for events, to friends', s01: ['parents'], s04: 'paidonce' };
  let d = M.starterDirections();
  ok(d.alternatives.length === 1 && d.alternatives[0].name === 'cakes for events, to friends' && d.alternatives[0].buyer === 'parents', 'without the brain, a tried idea is the one card, for who they said would pay');
  ok(d.alternatives[0].unknown.startsWith('Whether more'), 'someone having paid changes the hardest unknown to whether more will');
  M.state = { ...fresh('starter'), startPoint: 'few', s06: ['Food stall'], n19: ['office'] };
  d = M.starterDirections();
  ok(d.alternatives.length === 1 && d.alternatives[0].name === 'Food stall' && d.alternatives[0].buyer === 'office workers', 'the chosen one of the few is the card, for the group they understand when no buyer was named');
  M.state = { ...fresh('starter'), startPoint: 'few', s06: ['Food stall', 'Cakes'] };
  ok(M.starterDirections().alternatives.length === 0, 'two still standing is no card: the comparison has not settled');
  M.state = { ...fresh('starter'), startPoint: 'few', s06: ['a food stall at the market'], n27: 'own', direction: { id: 'own', name: 'a food stall at the market' } };
  ok(M.schemaApplies('n41'), 'a food idea from the few triggers the permissions question');
  M.state = { ...fresh('starter'), startPoint: 'one', s02: 'they need someone to drive them to hospital', n27: 'own', direction: { id: 'own', name: 'lifts' } };
  ok(M.schemaApplies('n41'), 'the problem line is read for it too');

  /* ---- 8. the endings under the new lines (ghost.js) ---- */
  ok(['s02', 's03', 's06', 's10', 's01Other', 's11Other'].every((id) => M.ghostPhrases(id).length >= 3), 'each new free line has endings behind it');
  ok(['s02', 's03', 's06', 's10', 's01Other', 's11Other'].flatMap((id) => M.ghostPhrases(id)).every((t) => !/\u2014|\d{3,}|£/.test(t)), 'the endings carry no em dash and no figure');
  ok(M.SCHEMA_KEYS.includes('s01Other') && M.SCHEMA_KEYS.includes('s13Bought') && M.SCHEMA_KEYS.includes('n25Text') && M.SCHEMA_KEYS.includes('n26Result') && M.SCHEMA_KEYS.includes('startPoint'), 'every key the new screens write, and the two the old screen wrote, are saved keys');

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) { fails.forEach((f) => console.log(' - ' + f)); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
