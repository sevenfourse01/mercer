/* Final 1, interview (questions.js, research.js, ghost.js, sectors.js). Plain node + the jsdom the earlier harnesses used.
   Run: node tests/interview-final1.cjs
   Covers: registry integrity after the reorder (D5, Task 15); location and currency known before anything geographic,
   priced or budgeted; the five proposals that replaced the blank questions (Task 13, D6) and the capacity ceiling
   (Task 18); the advantage profile traceable to answers (Task 11); goals and protected constraints that fit any size
   (Task 16); routes selected, then ranked, with no press-once-press-twice (Task 17); the control family (Task 09). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require(path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'))); } catch (e) { try { ({ JSDOM } = require('jsdom')); } catch (e2) { console.log('SKIP: jsdom not found (expected at ../labtest/node_modules/jsdom)'); process.exit(0); } }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) { pass++; console.log('ok  ' + msg); } else { fails.push(msg); console.log('FAIL ' + msg); } };

function page(extra) {
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
  M.count = (n) => { const v = Number(n); if (Number.isFinite(v) && Math.abs(v) < 10) { const r = Math.round(v * 10) / 10; if (r !== Math.round(r)) return r.toFixed(1); return String(Math.round(r) || 0); } return Math.round(v).toLocaleString('en-GB'); };
  M.flow = { forward() {}, backward() {} };
  const commits = [];
  M.commit = (id, value) => { commits.push({ id, value }); const q = M.SCHEMA_BY?.[id]; if (q) { M.state[q.key] = value; } else M.state[id] = value; try { M.derive?.(id); } catch (e) { /* the file's own rules */ } };
  extra?.(window, M);
  M.state = fresh('owner');
  window.eval(src('questions.js'));
  window.eval(src('research.js'));
  const body = window.document.getElementById('q-body');
  const next = window.document.getElementById('next');
  const enable = () => { next.disabled = false; };
  let live = null;
  const mount = (id) => { try { live?.destroy?.(); } catch (e) { /* gone */ } next.disabled = true; live = M.renderQuestion(id, body, enable); return live; };
  const type = (inp, text) => { inp.value = text; inp.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const blur = (inp) => inp.dispatchEvent(new window.Event('blur'));
  const press = (root, words) => { const b = [...root.querySelectorAll('button')].find((x) => x.textContent.trim() === words); if (!b) throw new Error(`no button "${words}"`); b.click(); return b; };
  return { window, document: window.document, M, body, next, mount, type, blur, press, commits };
}
const fresh = (route) => ({ route, notSure: new Set(), na: new Set(), derived: {}, doing: [], tried: [], went: {}, asked: [], appetite: 'moderate', stack: {}, stackNames: {}, personalityAxes: [null, null, null, null] });

(async () => {
  const P = page();
  const { M, body, next, mount, type, press } = P;

  /* ---- 1. the registry after the reorder (D5, Task 15) ---- */
  const R = M.registry;
  ok(Array.isArray(R) && R.length > 150 && R === M.SCHEMA, `M.registry is the one table (${R.length} entries)`);
  const ids = R.map((q) => q.id);
  ok(new Set(ids).size === ids.length, 'every id is unique');
  const badWhen = R.filter((q) => { try { return typeof q.when(M.state) !== 'boolean'; } catch (e) { return true; } });
  ok(badWhen.length === 0, `every when(state) is callable and boolean${badWhen.length ? `: ${badWhen.map((q) => q.id).join(' ')}` : ''}`);
  ok(R.every((q) => M.ROUTE_SECTIONS.includes(q.section)), 'every section is one of the six');
  ok(M.ROUTE_SECTIONS[0] === 'foundations' && M.ROUTE_SECTIONS[1] === 'aim', 'the business comes before the aim on both routes');
  ok(M.SECTION_NAMES.owner.foundations === 'Business' && M.SECTION_NAMES.starter.foundations === 'Starting point', 'the first stage is named Business for an owner and Starting point for a starter');
  ok(R.every((q) => typeof q.control === 'string' && q.control && Array.isArray(q.affects) && q.affects.length && Array.isArray(q.satisfiedBy) && Array.isArray(q.invalidates) && typeof q.unknownOk === 'boolean' && [1, 2, 3].includes(q.tier) && typeof q.unit === 'string'), 'every entry carries control, affects, satisfiedBy, invalidates, unknownOk, unit and a tier');
  ok(R.filter((q) => q.on).every((q) => M.SCHEMA_BY[q.on] && M.SCHEMA_BY[q.on].route.some((r) => q.route.includes(r))), 'every rider names a screen on its route');
  const refs = R.flatMap((q) => [...q.satisfiedBy.filter((x) => !x.startsWith('import:')), ...q.invalidates.filter((x) => x !== 'plan')]);
  const missing = refs.filter((x) => !M.SCHEMA_BY[x]);
  ok(missing.length === 0, `every satisfiedBy and invalidates id exists${missing.length ? `: ${[...new Set(missing)].join(' ')}` : ''}`);
  ok(R.filter((q) => q.satisfiedBy.some((x) => x.startsWith('import:'))).every((q) => q.satisfiedBy.filter((x) => x.startsWith('import:')).every((x) => M.research.FIELDS[x.slice(7)])), 'every import: field named in satisfiedBy is one the importer can find');
  const gone = M.SCHEMA_BY.canDeliverMore;
  ok(gone.hidden === true && gone.when(M.state) === false && gone.satisfiedBy.includes('turnedAway'), 'the hypothetical "could you deliver more" question is never asked again, and its title stays for answers already saved');
  ok(!M.screensFor('owner', 3).includes('canDeliverMore'), 'it is on no walk at any tier');
  ok(M.SCHEMA_BY.turnedAway && M.SCHEMA_BY.turnedAway.tier === 1, 'the observable question about last month replaces it');

  /* ---- 2. location and currency before anything geographic, priced or budgeted ---- */
  const PRICED = ['now', 'price', 'retainer', 'margin', 'spend', 'goal', 'fixedCosts', 'agencyFee', 'owed', 'ltv', 'listSize', 'n05', 'n06', 'n37'];
  const GEO = ['radius', 'market', 'deliveryMode', 'n18'];
  const ownerOrder = M.screensFor('owner', 3);
  const iPlace = ownerOrder.indexOf('place');
  ok(iPlace >= 0, 'the owner is asked for a location');
  const early = [...PRICED, ...GEO].filter((id) => ownerOrder.includes(id)).every((id) => ownerOrder.indexOf(id) > iPlace);
  ok(early, `every priced, budgeted or geographic owner screen comes after the location (${ownerOrder.slice(0, 5).join(' ')} ...)`);
  M.state = { ...fresh('starter'), route: 'starter' };
  const starterOrder = M.screensFor('starter', 3);
  const sPlace = starterOrder.indexOf('place');
  ok(sPlace >= 0 && [...PRICED, ...GEO].filter((id) => starterOrder.includes(id)).every((id) => starterOrder.indexOf(id) > sPlace), `the same holds on the starter route (${starterOrder.slice(0, 4).join(' ')} ...)`);
  ok(M.SCHEMA_BY.currency.on === 'place', 'the currency is settled on the location screen, not a screen of its own');

  /* ---- 3. the location screen: a searchable country, an optional town, a suggested currency ---- */
  M.state = fresh('owner');
  mount('place');
  const search = body.querySelector('.q-search-in');
  ok(Boolean(search) && search.type === 'search', 'the country is a searchable field');
  type(search, 'ire');
  const hit = [...body.querySelectorAll('.q-search-hits .stone')].map((b) => b.textContent.trim());
  ok(hit.includes('Ireland'), `typing a few letters finds the country (${hit.slice(0, 3).join(', ')})`);
  press(body, 'Ireland');
  ok(M.state.country === 'IE', 'pressing it holds the country');
  ok(M.state.currency === 'EUR' && M.state.derived.currency === 'place', 'the currency is suggested from the country and says so');
  ok(!next.disabled, 'the country alone lets the visitor continue');
  const curStones = [...body.querySelectorAll('.ui-stones[data-q="currency"] .stone')].map((b) => b.textContent.trim());
  ok(curStones.some((t) => t.includes('EUR')) && curStones.includes('Other currency'), `the suggested currency leads the row and Other currency is there (${curStones.join(' | ')})`);
  press(body, 'Other currency');
  const curSearch = [...body.querySelectorAll('.q-search-in')].pop();
  type(curSearch, 'rand');
  const curHits = [...body.querySelectorAll('.q-search-hits .stone')].map((b) => b.textContent.trim()).filter((t) => t.includes('ZAR'));
  ok(curHits.length === 1, `Other currency opens a searchable list (${curHits[0] ?? 'nothing found'})`);
  curHits.length && press(body, curHits[0]);
  ok(M.state.currency === 'ZAR' && M.state.derived.currency === undefined, 'a currency the visitor picks is their own answer, not a suggestion');

  /* ---- 4. the business screen (Task 15) ---- */
  M.state = fresh('owner');
  mount('biz');
  const lines = [...body.querySelectorAll('textarea, input[type="text"], input:not([type])')];
  ok(lines.length >= 2, 'the first screen takes a business name and a website');
  ok(M.headline('stage').sub.includes('trading'), 'the stage question asks how long it has been trading');
  const stageWords = M.SCHEMA_BY.stage.opts.map((o) => o[1]);
  ok(stageWords.join(' | ') === 'Not trading yet | Trading for under a year | Trading for a year or more', `the stage options say what they mean (${stageWords.join(' | ')})`);
  M.state = { ...fresh('owner'), bizStage: 'year' };
  ok(M.schemaApplies('yearsTrading') && M.schemaApplies('role'), 'trading a year or more unlocks the start date and the role question');
  M.state = { ...fresh('owner'), bizStage: 'under' };
  ok(!M.schemaApplies('yearsTrading') && !M.schemaApplies('role'), 'a business under a year is asked neither');

  /* ---- 5. goals and protected constraints that fit any size (Task 16) ---- */
  const winOpts = M.SCHEMA_BY.win.opts.map((o) => o[1]);
  ok(!winOpts.some((t) => /second location|another location/i.test(t)), 'no goal offers a second location');
  ok(winOpts.includes('Increase revenue') && winOpts.includes('Improve profit'), 'revenue and profit are separate goals');
  ok(winOpts.includes('Explore what is possible'), 'someone already performing well can explore');
  ok(M.headline('win').sub.includes('achieve next'), 'the goal question asks what to achieve next');
  M.state = { ...fresh('owner'), teamSize: 25, who: 12 };
  const bigWin = M.SCHEMA_BY.win.opts.filter((o) => typeof o[2] !== 'function' || o[2]()).map((o) => o[0]);
  ok(bigWin.includes('dependence'), 'a business with a team can choose to reduce dependence on particular people');
  const bigProtect = M.SCHEMA_BY.protected.opts.filter((o) => typeof o[2] !== 'function' || o[2]()).map((o) => o[1]);
  ok(bigProtect.includes('Service levels customers rely on') && bigProtect.includes('The jobs of the people here') && !bigProtect.includes('My existing income'), `a twenty-five person business is offered service levels and jobs, not a personal income (${bigProtect.join(', ')})`);
  M.state = { ...fresh('starter'), route: 'starter' };
  const smallProtect = M.SCHEMA_BY.protected.opts.filter((o) => typeof o[2] !== 'function' || o[2]()).map((o) => o[1]);
  ok(smallProtect.includes('Family or study time') && smallProtect.includes('My existing income') && !smallProtect.includes('Margins'), `a starter is offered study time and their existing income (${smallProtect.join(', ')})`);
  ok(M.SCHEMA_BY.protected.opts.some((o) => o[0] === 'other'), 'an unlisted constraint is always available');

  /* ---- 6. routes: selected first, then ranked, with no hidden second press (Task 17) ---- */
  M.state = { ...fresh('owner'), sector: 'professional', buyer: 'micro' };
  M.DIST_BY = M.DIST_BY ?? null;
  mount('channel');
  ok(!body.textContent.includes('Press once') && !body.textContent.includes('twice'), 'nothing on the screen teaches a press-once-press-twice rule');
  const pills = [...body.querySelectorAll('.ui-stones .stone')].filter((b) => !b.classList.contains('more'));
  ok(pills.length > 4, `the routes are on show, grouped by how warm they are (${pills.length} routes)`);
  pills[0].click();
  const first = M.state.doing.length;
  pills[0].click();
  ok(first === 1 && M.state.doing.length === 0, 'one press selects a route and a second press clears it, and that is all a press does');
  pills[0].click();
  ok(body.querySelector('.q-rank') === null && (M.state.channelRank ?? []).length <= 1, 'one route needs no ranking');
  pills[1].click();
  const rank = body.querySelector('.q-rank, .ui-rank');
  ok(Boolean(rank), 'a second route reveals the ranking step');
  const rankRows = [...body.querySelectorAll('.q-rank-row, .rank-item')];
  ok(rankRows.length === 2 && /^1/.test(rankRows[0].textContent.trim()), `the ranking is numbered (${rankRows.length} rows)`);
  const wasFirst = M.state.channelRank[0];
  const down = [...rankRows[0].querySelectorAll('button')].find((b) => /down/i.test(b.getAttribute('aria-label') ?? b.textContent) && !b.disabled);
  down.click();
  ok(M.state.channelRank.length === 2 && M.state.channelRank[1] === wasFirst, 'moving a route down writes the new order');
  ok(M.headline('channelRank').title.split(/\s+/).length <= 3, 'the ranking screen has a short title');

  /* ---- 7. an activity count only where the next move depends on it (Task 17) ---- */
  M.state = { ...fresh('owner'), doing: ['dm-linkedin'], channelRank: ['dm-linkedin'] };
  ok(M.schemaApplies('channelVolume'), 'a selected outreach route asks for the actual activity');
  ok(/LinkedIn/.test(M.headline('channelVolume').sub), `the count is asked in that route's own words (${M.headline('channelVolume').sub})`);
  M.state = { ...fresh('owner'), doing: ['referrals'] };
  mount('channelVolume');
  ok(body.querySelector('.ui-slider, .ui-sliders'), 'the count is a figure, not a band');
  M.state = { ...fresh('owner'), doing: ['maps'] };
  ok(!M.schemaApplies('channelVolume'), 'a route with no activity to count is not asked for one');

  /* ---- 8. capacity from last month's facts, and a ceiling that can be corrected (Task 18) ---- */
  M.state = { ...fresh('owner'), sector: 'professional', who: 2, servedNow: 10, jobHours: 6, hours: 30, turnedAway: 'no' };
  const est = M.capacityEstimate();
  ok(est && est.basis === 'hours' && est.value === Math.floor((2 * 30 * 4.3) / 6), `the ceiling comes from the visitor's own figures (${est && est.words})`);
  M.state = { ...fresh('owner'), who: 1, servedNow: 8, turnedAway: 'yes' };
  const est2 = M.capacityEstimate();
  ok(est2 && est2.basis === 'turnedAway' && est2.value === 8, 'work turned away last month is the ceiling, and the words say why');
  M.state = { ...fresh('owner'), who: 1, servedNow: 8, turnedAway: 'no' };
  ok(M.capacityEstimate().value === null, 'a month with nothing turned away does not pretend to show a ceiling');
  M.state = { ...fresh('owner'), sector: 'professional', who: 2, servedNow: 10, jobHours: 6, hours: 30, turnedAway: 'no' };
  mount('capacity');
  ok(body.textContent.includes('ceiling'), 'the capacity screen states the ceiling it will use');
  ok(!body.textContent.includes('three months') && !/most you could take on/i.test(body.querySelector('.q-estimate')?.textContent ?? ''), 'nobody is asked to guess three months ahead');
  press(body, 'Change the ceiling');
  ok(Boolean(body.querySelector('.q-other .ui-slider')), 'the ceiling can be corrected');
  ok(!M.headline('spend').sub.includes('hours') && M.SCHEMA_BY.changeHours.on === undefined, 'money and time are two questions, not one control');

  /* ---- 9. the proposals that replaced the blank questions (Task 13, D6) ---- */
  const DELETED = { n35: 'Can you deliver?', n37: 'What could you charge?', n39: 'What would persuade you to continue?', n40: 'What would make you stop?', n30: 'What skills or support do you need?' };
  Object.keys(DELETED).forEach((id) => ok(M.SCHEMA_BY[id].control === 'proposal', `${DELETED[id]} is a proposal, not a blank question (${id})`));
  const starter = () => ({
    ...fresh('starter'), route: 'starter', win: 'extra', goal: 800, months: 6, place: 'Leeds', country: 'GB', currency: 'GBP',
    n01: 'employed', interest: 'take the bike apart', interestPart: 'working out the fault', paidBefore: 'unpaid', paidWhat: 'fixed two neighbours’ bikes',
    n03: 10, n05: 300, n06: 10, n07: 'months', n10: ['fixing', 'teaching'], n11: ['fixing'], n11Example: 'rebuilt a wheel for a friend', n12: ['fixing'],
    workStyle: 'making', n16: ['laptop'], n17: ['none'], n19: ['parents'], n20: ['reliable'], n21: 'direct', n23: ['none'], n25: 'no',
    n27: 'd1', direction: { id: 'd1', name: 'Bike servicing for parents', recommended: true, buyer: 'parents with school-run bikes', offer: 'a spring service at their door', priceLow: 45, priceHigh: 80, priceBasis: 'three local shops’ published prices', assets: [] },
    n31: 'parents', n32: 'piece', n33: ['asked'], n34: 'conversation',
  });
  M.state = starter();
  const props = M.proposals();
  ok(props.length >= 4 && props.every((p) => p.lines.length && Array.isArray(p.basis)), `Mercer makes its own proposals (${props.map((p) => p.id).join(' ')})`);
  ok(props.every((p) => p.basis.every((b) => typeof b.words === 'string' && b.words)), 'every proposal says what it was built from');

  mount('n35');
  ok(Boolean(body.querySelector('.q-proposal')), 'the delivery screen states what Mercer would do');
  ok(body.querySelector('.q-prop-why').textContent.startsWith('Because you said:'), 'it names the answers behind it');
  ok(next.disabled, 'a proposal is not an answer until the visitor presses');
  press(body, 'I could do that');
  ok(M.state.n35 === 'yes' && !next.disabled, 'taking the proposal writes the answer the plan reads');
  ok(body.textContent.includes('Have you done this at this level before?'), 'the one decisive fact is still asked');
  M.state = { ...starter(), paidBefore: 'paid' };
  mount('n35');
  ok(!body.textContent.includes('Have you done this at this level before?'), 'and it is not asked when an earlier answer settled it');

  M.state = starter();
  mount('n35');
  press(body, 'Not quite');
  const gapLine = body.querySelector('.q-prop-edit textarea, .q-prop-edit input');
  type(gapLine, 'I have never done the pricing part');
  P.blur(gapLine);
  ok(M.state.n35 === 'gap' && M.state.n35Gap.includes('pricing'), 'a correction is taken and kept');

  M.state = starter();
  mount('n37');
  ok(body.textContent.includes('£45'), 'the price proposal names a figure with a basis');
  ok(body.querySelector('.q-prop-why').textContent.includes('three local shops'), 'and says where the range came from');
  press(body, 'Price it there');
  ok(M.state.n37 === 45, 'taking it writes the test price the plan reads');
  M.state = { ...starter(), direction: { id: 'd1', name: 'Bike servicing', recommended: true, buyer: 'parents', offer: 'a service', priceLow: null, priceHigh: null }, n27: 'd1' };
  mount('n37');
  ok(!/£\d/.test(body.querySelector('.q-prop-lead').textContent), 'with nothing researched, no price is invented');
  ok(body.textContent.includes('been paid') && body.textContent.includes('costs you'), 'the two facts a person can know are asked instead');

  M.state = starter();
  mount('n39');
  const mile = body.querySelector('.q-prop-lead').textContent;
  ok(/\d/.test(mile) && /week/.test(mile), `the milestone is concrete and dated (${mile})`);
  press(body, 'That would do it');
  ok(typeof M.state.n39 === 'string' && M.state.n39.length > 12, 'it is written as a sentence the plan can print');
  M.state = starter();
  mount('n39');
  press(body, 'Set my own');
  const own = body.querySelector('.q-prop-edit textarea, .q-prop-edit input');
  type(own, 'five people ask for a price');
  P.blur(own);
  ok(M.state.n39 === 'five people ask for a price' && M.state.n39Edited === true, 'the visitor can set their own and it is marked as theirs');

  M.state = starter();
  mount('n40');
  const stop = body.textContent;
  ok(stop.includes('£300') && /week/.test(stop), 'the stop rule is built from the budget and the time already given');
  press(body, 'That is the cap');
  ok(given(M.state.n40) && M.state.n40Weeks === 6, 'taking it writes the cap');
  M.state = { ...starter(), n05: 0 };
  mount('n40');
  ok(body.textContent.includes('time') && !body.textContent.includes('£0 or'), 'with nothing to spend, the cap is time and it says so');

  M.state = { ...starter(), n21: 'find', n16: [] };
  mount('n30');
  ok(body.querySelector('.q-proposal') && body.textContent.includes('reach the first few buyers'), 'the gap analysis is worked out, not asked for');
  press(body, 'That is fair');
  ok(Array.isArray(M.state.n30) && M.state.n30.includes('buyers'), 'it writes the support kinds the plan reads');
  ok(body.textContent.includes('willing to learn'), 'what to learn is asked here, once there is a direction to learn for');
  M.state = { ...fresh('starter'), route: 'starter' };
  ok(!M.schemaApplies('n30') && !M.schemaApplies('n15'), 'neither is asked before a direction is chosen');

  /* ---- 10. the advantage profile, every point traceable to an answer (Task 11) ---- */
  M.state = starter();
  const adv = M.advantage();
  ok(adv.points.length === 3, `three points (${adv.points.length})`);
  const answered = adv.points.every((p) => p.from.length && p.from.every((f) => M.SCHEMA_BY[f.id] && given(M.state[M.SCHEMA_BY[f.id].key])));
  ok(answered, 'every point names the question and the answer it came from');
  ok(adv.points.some((p) => /neighbours/.test(p.text)) && adv.points.some((p) => /wheel for a friend/.test(p.text)), 'the strongest evidence leads: work done for someone, and a result achieved');
  const advText = JSON.stringify(adv);
  ok(!/%|percentile|top \d|personality type|diagnos/i.test(advText), 'no percentile, no score, no diagnosis');
  ok(adv.label === 'Maker' && adv.labelSource === 'mercer' && adv.editable === true, `the label describes how they work and can be changed (${adv.label})`);
  const adv2 = M.setAdvantageLabel('Bike fixer');
  ok(adv2.label === 'Bike fixer' && adv2.labelSource === 'yours', 'the visitor can rename it');
  ok(M.setAdvantageLabel('').label === 'Maker', 'clearing it gives Mercer’s own back');
  M.state = { ...fresh('starter'), route: 'starter' };
  const none = M.advantage();
  ok(none.points.length === 0 && none.enough === false && none.label === null, 'with no answers there are no points and no label');

  /* ---- 11. the discovery prompts: concrete, and selected rather than all asked (Task 11) ---- */
  M.state = { ...fresh('starter'), route: 'starter' };
  const prompts = M.discoveryPrompts().map((p) => p.id);
  ['interest', 'paidBefore', 'workStyle', 'n10', 'n12', 'n16', 'n19', 'n22', 'n23'].forEach((id) => ok(prompts.includes(id), `the bank holds the ${id} prompt`));
  ok(/hour completely to yourself/.test(M.headline('interest').sub), 'the interest prompt is the concrete one');
  ok(/earned money, or helped someone/.test(M.headline('paidBefore').sub), 'the proven-attempt prompt asks about money or help');
  M.state = { ...starter(), n11: ['fixing'] };
  ok(!M.schemaApplies('bestAt'), 'a prompt whose evidence is already held is not asked');
  M.state = { ...fresh('starter'), route: 'starter', n10: ['fixing'] };
  ok(M.schemaApplies('bestAt'), 'and it is asked when that evidence is missing');
  M.state = { ...starter(), interest: 'take the bike apart', workStyle: 'making' };
  ok(M.schemaApplies('n13'), 'the ten enjoy-and-avoid tiles are asked whatever the shorter prompts said: they are the preference input the interest rubric reads (the cockpit brief, 8)');
  ok(M.SCHEMA_BY.n09.optional === true, 'the CV is optional');
  M.state = { ...fresh('starter'), route: 'starter' };
  mount('n01');
  ok([...body.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Read it from my CV instead'), 'the CV sits behind a press, so nobody is sent through an upload');
  ok(!body.querySelector('input[type="file"]'), 'and no file control is in the way until it is asked for');

  /* ---- 12. the control family (Task 09) ---- */
  const controls = [...new Set(M.registry.map((q) => q.control))].sort();
  ok(controls.length <= 26, `the controls are a small family (${controls.length}: ${controls.join(' ')})`);
  ok(M.SCHEMA_BY.market.control === 'dots' && M.SCHEMA_BY.deliveryMode.control === 'paths' && M.SCHEMA_BY.channelRank.control === 'rank', 'reach, delivery mode and ranking name the three controls feel builds');
  M.state = { ...fresh('owner'), sector: 'professional' };
  mount('market');
  ok(Boolean(body.querySelector('.ui-slider, .ui-dots')), 'reach falls back to a typed count where feel has no dot field');
  mount('deliveryMode');
  ok(Boolean(body.querySelector('.ui-paths, .ui-stones')), 'delivery mode is the direction diagram, or text choices without it');
  const modeWords = [...body.querySelectorAll('button')].map((b) => b.textContent.trim());
  ok(modeWords.includes('Goods are shipped') && modeWords.includes('A mix of these'), `the modes keep this file's words (${modeWords.join(' | ')})`);
  press(body, 'A mix of these');
  ok(Array.isArray(M.state.deliveryMode) && M.state.deliveryMode.length > 1, 'a mix stays a list, so a later question can still tell it is partly on site');
  ok(!body.textContent.includes('undefined'), 'no fallback leaks a missing word');

  /* ---- 12b. one active question: a rider is a screen of its own unless it is a displayed value (D4) ---- */
  const riders = M.registry.filter((q) => q.on);
  const ctx = riders.filter((q) => q.context === true).map((q) => q.id);
  ok(ctx.join(' ') === 'currency closeRate', `only a confirmed or suggested value is marked context: true (${ctx.join(' ') || 'none'})`);
  ok(riders.filter((q) => !q.context).every((q) => q.tier >= 1), 'every other rider carries its own tier, so flow can put it in the first pass or behind Refine');
  ok(M.SCHEMA_BY.changeHours.tier === 1 && !M.SCHEMA_BY.changeHours.on, 'the time question of Task 18 has a screen of its own in the first pass');
  ok(M.SCHEMA_BY.hours.key === 'hours' && M.SCHEMA_BY.weekGoes.on === 'hours', 'where the week goes rides on the hours question, so neither screen holds two');
  M.state = { ...fresh('owner'), hours: 30 };
  M.derive('hours');
  ok(M.state.changeHours === 20 && M.state.derived.changeHours === 'hours', 'the time is asked once: the other key follows and is marked derived');
  M.state = { ...fresh('owner'), changeHours: 6 };
  M.derive('changeHours');
  ok(M.state.hours === 6 && M.state.derived.hours === 'changeHours', 'and the same the other way round');
  // with a flow on the page, a host draws no rider that flow will ask; without one, the host still draws them
  M.isContextValue = (id) => M.SCHEMA_BY[id]?.context === true;
  M.state = { ...fresh('owner'), route: 'owner' };
  mount('goal');
  ok(!body.querySelector('.ui-dial') && !body.querySelector('.ui-arc'), 'the goal screen asks the figure only; the dial and the horizon are their own questions');
  mount('place');
  ok(Boolean(body.querySelector('.ui-stones[data-q="currency"]')), 'the currency still sits on the location screen, because it is a value shown for reference');
  delete M.isContextValue;
  mount('goal');
  ok(Boolean(body.querySelector('.ui-dial')), 'on a page with no flow to ask them, the host draws its riders as it did');

  /* ---- 13. every screen still mounts, on both routes ---- */
  const mountAll = (route, st) => {
    const bad = [];
    M.state = st;
    M.registry.filter((q) => q.route.includes(route)).forEach((q) => {
      M.state = { ...st };
      try { const c = M.renderQuestion(q.id, body, enableNoop); c?.destroy?.(); } catch (e) { bad.push(`${q.id}: ${e.message}`); }
    });
    return bad;
  };
  const enableNoop = () => {};
  const ownerBad = mountAll('owner', { ...fresh('owner'), sector: 'professional', bizStage: 'year', repeatWork: 'once', buyer: 'micro', doing: ['referrals', 'maps'], tried: ['ads-search'], price: 400, now: 9000 });
  ok(ownerBad.length === 0, `every owner screen mounts${ownerBad.length ? `: ${ownerBad.join(' | ')}` : ''}`);
  const starterBad = mountAll('starter', starter());
  ok(starterBad.length === 0, `every starter screen mounts${starterBad.length ? `: ${starterBad.join(' | ')}` : ''}`);

  /* ---- 14. the words ---- */
  const files = ['questions.js', 'research.js', 'ghost.js', 'sectors.js', 'build.js', 'questions.css'];
  files.forEach((f) => {
    const t = src(f);
    ok(!t.includes('—'), `no em dash in ${f}`);
    ok(!/\bactually\b/i.test(t), `no "actually" in ${f}`);
  });
  const longTitles = M.registry.filter((q) => !q.hidden).map((q) => M.headline(q.id).title).filter((t) => t.split(/\s+/).length > 3);
  ok(longTitles.length === 0, `every title is one to three words${longTitles.length ? `: ${longTitles.join(' | ')}` : ''}`);
  const sameSub = M.registry.filter((q) => !q.hidden).map((q) => ({ id: q.id, h: M.headline(q.id) })).filter((x) => x.h.sub && x.h.sub === x.h.title);
  ok(sameSub.length === 0, 'no subhead repeats its title');
  ok(!src('questions.js').includes('Press once'), 'the press-once-press-twice line is gone from the file');

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) { fails.forEach((f) => console.log('  FAIL ' + f)); process.exit(1); }
})();

function given(v) { return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length); }
