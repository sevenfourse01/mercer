/* Rebuild 1, interview (questions.js, research.js, ghost.js). Plain node + the jsdom the fix-3 harness used (../labtest).
   Run: node tests/interview-rebuild1.cjs
   Covers: the registry's integrity (R5); the starter bank N01 to N44 and its gating on two fixtures (R4); the owner
   gates that replace N/A (C16); the words (R24); the Package suggestion list (C02); the file reader with stubbed
   pdf.js and mammoth (R20); the importer's save and restore round trip; best clients as positioning only; customer
   profiles; enquiries and the close rate on one screen; the multiselects with a primary. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let JSDOM;
try { ({ JSDOM } = require(path.resolve(ROOT, '..', 'labtest', 'node_modules', 'jsdom'))); } catch (e) { try { ({ JSDOM } = require('jsdom')); } catch (e2) { console.log('SKIP: jsdom not found (expected at ../labtest/node_modules/jsdom)'); process.exit(0); } }
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) { pass++; console.log('ok  ' + msg); } else { fails.push(msg); console.log('FAIL ' + msg); } };

/** a page with the interview loaded; `extra` runs before questions.js (stubs) */
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
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const P = page();
  const { M, body, next, mount, type, blur, press } = P;

  /* ---- 1. the registry (R5) ---- */
  const R = M.registry;
  ok(Array.isArray(R) && R.length > 150 && R === M.SCHEMA, `M.registry is the one table (${R.length} entries)`);
  const ids = R.map((q) => q.id);
  ok(new Set(ids).size === ids.length, 'every id is unique');
  const BAD_WHEN = R.filter((q) => { try { const v = q.when(M.state); return typeof v !== 'boolean'; } catch (e) { return true; } });
  ok(BAD_WHEN.length === 0, `every when(state) is callable and boolean${BAD_WHEN.length ? `: ${BAD_WHEN.map((q) => q.id).join(' ')}` : ''}`);
  ok(R.every((q) => Array.isArray(q.route) && q.route.length && q.route.every((r) => r === 'owner' || r === 'starter')), 'every route is owner, starter or both');
  ok(R.every((q) => M.ROUTE_SECTIONS.includes(q.section)), 'every section is one of the six');
  ok(R.every((q) => typeof q.control === 'string' && q.control && Array.isArray(q.affects) && q.affects.length && Array.isArray(q.satisfiedBy) && Array.isArray(q.invalidates) && typeof q.unknownOk === 'boolean' && [1, 2, 3].includes(q.tier) && typeof q.unit === 'string'), 'every entry carries control, affects, satisfiedBy, invalidates, unknownOk, unit and a tier');
  ok(R.filter((q) => q.on).every((q) => M.SCHEMA_BY[q.on] && M.SCHEMA_BY[q.on].route.some((r) => q.route.includes(r))), 'every rider names a screen on its route');
  const refs = R.flatMap((q) => [...q.satisfiedBy.filter((x) => !x.startsWith('import:')), ...q.invalidates.filter((x) => x !== 'plan')]);
  const missing = refs.filter((x) => !M.SCHEMA_BY[x]);
  ok(missing.length === 0, `every satisfiedBy and invalidates id exists${missing.length ? `: ${[...new Set(missing)].join(' ')}` : ''}`);
  ok(R.filter((q) => q.satisfiedBy.some((x) => x.startsWith('import:'))).every((q) => q.satisfiedBy.filter((x) => x.startsWith('import:')).every((x) => M.research.FIELDS[x.slice(7)])), 'every import: field named in satisfiedBy is a field the importer can find');
  ok(['M.Q', 'M.SCHEMA_BY', 'M.renderQuestion', 'M.headline', 'M.founderProfile', 'M.controlProfile', 'M.bestClients', 'M.customerProfiles', 'M.sectionQuestions'].every((k) => typeof (k === 'M.Q' || k === 'M.SCHEMA_BY' ? M[k.slice(2)] : M[k.slice(2)]) === (k === 'M.Q' || k === 'M.SCHEMA_BY' ? 'object' : 'function')), 'M.Q, M.SCHEMA_BY, M.renderQuestion, M.headline, the profiles, M.bestClients and M.customerProfiles are exported');
  ok(M.sectionQuestions('roots').includes('sector') && M.sectionQuestions('foundations').includes('sector') && !M.sectionQuestions('foundations').includes('appetite') && !M.sectionQuestions('foundations').includes('months'), 'sectionQuestions answers by the old id and the new one; riders are left out');

  /* ---- 2. the starter bank (R4) ---- */
  const N = Array.from({ length: 44 }, (_, i) => `n${String(i + 1).padStart(2, '0')}`);
  ok(N.every((id) => M.SCHEMA_BY[id] && M.SCHEMA_BY[id].route.includes('starter') && !M.SCHEMA_BY[id].route.includes('owner')), 'n01 to n44 are all registry entries on the starter route only');
  const secOf = (id) => M.SCHEMA_BY[id].section;
  /* final 1, Task 10 and Task 13: the stages moved. The person and their resources are the starting point; who they
     understand and the direction are the opportunities; the offer, the test and the gap analysis are the test stage
     (N15, N24 and N30 came here with the gap proposal, which cannot exist before a direction); launch and plan stand */
  const STAGE_OF = { n15: 'delivery', n24: 'delivery', n30: 'delivery' };
  const stageWanted = (id, i) => STAGE_OF[id] ?? (i < 18 ? ['foundations', 'aim'] : i < 30 ? ['customers'] : i < 40 ? ['delivery'] : i < 43 ? ['leverage'] : ['plan']);
  const misplaced = N.filter((id, i) => { const want = stageWanted(id, i); return !(Array.isArray(want) ? want : [want]).includes(secOf(id)); });
  ok(misplaced.length === 0, `every starter question is in its Task 10 stage${misplaced.length ? `: ${misplaced.map((id) => `${id} in ${secOf(id)}`).join(', ')}` : ''}`);
  const starterKeys = R.filter((q) => q.route.includes('starter')).map((q) => q.key);
  ok(!['now', 'price', 'margin', 'repeat', 'retention', 'retainerValue', 'ownership', 'ownShare', 'ltv', 'topShare', 'yearsTrading'].some((k) => starterKeys.includes(k)), 'no revenue, retention, lifetime or ownership question on the starter route');
  ok(M.SCHEMA_BY.n02.satisfiedBy.includes('win') && M.SCHEMA_BY.n08.satisfiedBy.includes('protected') && M.SCHEMA_BY.n43.satisfiedBy.includes('n16') && M.SCHEMA_BY.n07.satisfiedBy.includes('months'), 'N02, N07, N08 and N43 are satisfied by earlier answers');
  const straightforward = () => ({ ...fresh('starter'), win: 'extra', goal: 800, months: 6, protected: ['income'], place: 'Leeds', currency: 'GBP', n01: 'employed', n09: 'five years in customer service', n03: 12, n03Pattern: 'variable', n18: 'either', n05: 300, n06: 10, n10: ['writing', 'organising', 'talking'], n11: ['organising'], n12: ['organising'], n13: ['writing'], n14: ['calls'], n16: ['laptop', 'phone'], n17: ['none'], n19: ['owners', 'parents'], n20: ['paperwork'], n21: 'direct', n23: ['none'], startPoint: 'none', n25: 'no', n27: 'd1', direction: { id: 'd1', name: 'Admin support for tradespeople', recommended: true, assets: ['offer sheet'] }, n31: 'owners', n32: 'monthly', n33: ['asked'], n34: 'conversation', n35: 'yes', n37: 150, n39: 'first', n40: 'weeks', n40Weeks: 6 });
  const knotty = () => ({ ...fresh('starter'), win: 'main', goal: 2500, months: 12, protected: ['family', 'savings'], place: 'Dublin', currency: 'EUR', n01: 'between', n03: 30, n03Pattern: 'predictable', n18: 'remote', n05: 0, n10: ['tech'], n11: ['tech'], n12: ['tech'], n15: ['selling'], n13: ['build'], n14: ['calls', 'content'], n16: ['laptop'], n17: ['qualification'], n19: ['office'], n20: ['tech'], n21: 'find', n22: 'social', n22Size: 400, n23: ['collaborator'], n24: 'notasked', startPoint: 'tried', s10: 'a booking app for barbers, to two shops', s11: ['inperson'], s12: 'replies', n25: 'yes', n25Text: 'a booking app for barbers', n26: 'built', n26Result: 'two shops tried it', n27: 'none', n28: ['selling'], n29: 'with', n30: ['sales'], n31: 'other', n31Other: 'independent barbers', n32: 'product', n38: ['communities'], n33: ['assumption'], n34: 'sample', n35: 'gap', n35Gap: 'never sold anything', n36: ['hours'], n37: 30, n39: 'three', n40: 'budget' });
  const screens = (st) => { M.state = st; return M.screensFor('starter', 3).filter((id) => id !== 'readiness'); };
  const s1 = screens(straightforward());
  ok(s1.length >= 12 && s1.length <= 24, `a straightforward starter sees ${s1.length} screens (12 to 24, everything at tier 3): ${s1.join(' ')}`);
  const s2 = screens(knotty());
  // results 1, D9: a starter who already tried something answers what, where, what happened and two optional counts, so the branch runs to 28
  ok(s2.length >= 12 && s2.length <= 28, `a starter who tried something, with no direct access and one skill, sees ${s2.length} screens (12 to 28, everything at tier 3): ${s2.join(' ')}`);
  M.state = knotty();
  ok(M.schemaApplies('n30') && !M.schemaApplies('n15'), 'None of these still gets the gap analysis, and nothing to learn until there is a direction (Task 13)');
  // results 1, D9: tried-before is settled by the starting point; what was tried, where and what happened are screens of their own
  ok(M.sectionQuestions('customers').includes('n27') && M.schemaApplies('n22') && !M.schemaApplies('n26') && M.schemaApplies('s10') && M.schemaApplies('s11') && M.schemaApplies('s12') && M.schemaApplies('n28') && M.schemaApplies('n29'), 'the audience, the tried screens, puts-off and alone-or-with apply for the knotty starter; tried-before itself is never a screen');
  M.state = straightforward();
  ok(M.schemaApplies('n15') && M.schemaApplies('n30'), 'with a direction chosen, the gap analysis is made and what to learn is asked against it');
  ok(!M.schemaApplies('n22') && !M.schemaApplies('n26') && !M.schemaApplies('n28') && !M.schemaApplies('n29') && !M.schemaApplies('n04') && !M.schemaApplies('n42'), 'and none of the other riders applies; a direction with assets skips N42');
  M.state = { ...straightforward(), n03: 8 };
  ok(M.schemaApplies('n04'), 'when time is tight, when it falls is asked');
  const owner1 = { ...fresh('owner'), win: 'income', goal: 30000, months: 12, protected: ['none'], place: 'Leeds', sector: 'construction', trade: 'Joinery', sells: ['oneoff'], sellsPrimary: 'oneoff', repeatWork: 'once', bizStage: 'established', payModel: ['perjob'], now: 20000, season: 'steady', price: 2500, margin: 0.4, buyers: ['consumer'], buyer: 'consumer', deliveryMode: ['travel'], help: 'alone', decides: 'me' };
  M.state = owner1;
  const o1 = M.screensFor('owner', 1).filter((id) => id !== 'readiness');
  ok(o1.length <= 20, `an established one-off trade owner has ${o1.length} tier-1 screens (Task 15 adds the business and the location): ${o1.join(' ')}`);
  console.log(`   owner tier 2: ${M.screensFor('owner', 2).length} screens; tier 3: ${M.screensFor('owner', 3).length}`);

  /* ---- 3. the owner gates that replace N/A (C16, brief 2.3 items 5 to 7) ---- */
  M.state = { ...fresh('owner'), bizStage: 'pre' };
  ok(!M.schemaApplies('now') && !M.schemaApplies('volume') && !M.schemaApplies('bestWorst') && !M.schemaApplies('season') && !M.schemaApplies('enquiries') && !M.schemaApplies('lastFive'), 'before launch: no revenue, volume, swing, enquiries or best-customer question is asked');
  M.state = { ...fresh('owner'), deliveryMode: ['remote'] };
  ok(!M.schemaApplies('radius'), 'a remote business is not asked about a radius');
  M.state = { ...fresh('owner'), deliveryMode: ['shipped'] };
  ok(!M.schemaApplies('radius'), 'nor is one that ships goods');
  M.state = { ...fresh('owner'), deliveryMode: ['visit', 'remote'] };
  ok(M.schemaApplies('radius'), 'customers who visit bring the radius question back');
  const cq = M.sectionQuestions('customers');
  ok(cq.indexOf('deliveryMode') >= 0 && cq.indexOf('radius') > cq.indexOf('deliveryMode'), 'how you deliver comes before where they are');
  M.state = { ...fresh('owner'), buyer: 'consumer', buyers: ['consumer'] };
  ok(!M.schemaApplies('decider'), 'individuals: who decides is not asked');
  M.state = { ...fresh('owner'), buyer: 'micro', buyers: ['micro'] };
  ok(M.schemaApplies('decider'), 'businesses: it is');
  M.state = { ...fresh('owner'), help: 'alone' };
  ok(!M.schemaApplies('delegation') && !M.schemaApplies('teamSize') && !M.schemaApplies('keyPeople') && !M.schemaApplies('influence'), 'a solo operator is not asked about handing over, team size, key people or who runs the day');
  M.state = { ...fresh('owner'), decides: 'me' };
  ok(!M.schemaApplies('ownership') && !M.schemaApplies('retain') && !M.schemaApplies('unresolved'), 'and one who decides alone is not asked the shared-ownership questions');
  M.state = { ...fresh('owner'), season: 'steady', bizStage: 'established', now: 5000 };
  ok(!M.schemaApplies('bestWorst') && M.schemaApplies('yearsTrading'), 'fairly steady months: no best-and-worst; the year started is asked of anyone trading a year or more (Task 15)');
  M.state = { ...fresh('owner'), repeatBand: 'oneoff', repeatWork: 'once' };
  ok(!M.schemaApplies('returned') && !M.schemaApplies('stay') && !M.schemaApplies('returnGap'), 'one-off buyers: no returning-customer questions');
  M.state = { ...fresh('owner'), repeatBand: 'often', repeatWork: 'repeat' };
  ok(M.schemaApplies('returned') && M.schemaApplies('stay'), 'customers who buy again: they are asked');
  const multiMiss = R.filter((q) => (q.type === 'multi' || q.control === 'multi') && !q.on && !q.hidden && !/one or more/i.test(M.headline(q.id).sub)).map((q) => q.id);
  ok(multiMiss.length === 0, `every multiselect that stands on its own says Choose one or more${multiMiss.length ? ': ' + multiMiss.join(' ') : ''}`);
  ok(['repeatWork', 'buyer', 'payModel', 'deliveryMode', 'protected', 'access', 'wontDo'].every((id) => /one or more/.test(M.headline(id).sub)), 'what you sell, who pays, how paid, how delivered, protected, access and limits are all one-or-more');

  /* ---- 4. the words (R24, brief 2.3 item 5) ---- */
  const titles = R.map((q) => M.headline(q.id).title.toLowerCase());
  ok(!titles.some((t) => /ideal prospect|territory|ownership|prospect/.test(t)), 'no title says ideal prospect, territory or ownership');
  const longTitles = R.filter((q) => !q.hidden && !q.on && q.id !== 'biz').map((q) => M.headline(q.id).title).filter((t) => !t || t.split(/\s+/).length > 3);
  ok(longTitles.length === 0, `every screen title is one to three words${longTitles.length ? ': ' + longTitles.join(' | ') : ''}`);
  const strings = ['questions.js', 'research.js', 'ghost.js', 'build.js', 'sectors.js', 'questions.css'].map((f) => [f, src(f)]);
  strings.forEach(([f, s]) => ok(!/—/.test(s) && !/\bactually\b/i.test(s) && !/Mercy/.test(s), `${f}: no em dash, no "actually", no "Mercy"`));
  ok(!R.some((q) => /\bNext\b/.test(`${M.headline(q.id).title} ${M.headline(q.id).sub} ${M.explain(q.id)}`)), 'no title, subhead or explanation says Next; the button is Continue');
  ok(!/15 minutes|ideal prospect|no website reader/i.test(src('questions.js') + src('research.js')), 'no "15 minutes", no "ideal prospect", no "no website reader"');
  ok(/This page does not fetch websites/.test(M.research.URL_WORDS) && (src('research.js').match(/does not fetch websites/g) || []).length === 1, 'the address sentence exists once, at the moment of use');

  /* ---- 5. the Package suggestion list (C02) ---- */
  M.state = fresh('owner');
  mount('included');
  const box = body.querySelector('textarea');
  const menu = body.querySelector('.ghost-list');
  ok(box && menu && menu.hidden, 'the list is there and closed before focus');
  box.focus();
  box.dispatchEvent(new P.window.Event('focus'));
  ok(!menu.hidden && menu.querySelectorAll('[role="option"]').length >= 3 && box.getAttribute('aria-expanded') === 'true', 'focus opens it with the suggestions');
  box.dispatchEvent(new P.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  const first = menu.querySelector('[role="option"]');
  ok(first.getAttribute('aria-selected') === 'true' && box.getAttribute('aria-activedescendant') === first.id, 'ArrowDown moves to the first option');
  box.dispatchEvent(new P.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  ok(menu.hidden && box.value === first.textContent && M.state.included === first.textContent && P.document.activeElement === box && next.disabled === false, 'Enter takes it, writes state.included, closes the list and keeps focus on the line');
  type(box, 'the');
  ok(!menu.hidden, 'typing opens it again with what fits');
  box.dispatchEvent(new P.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  ok(menu.hidden && box.value === 'the' && P.document.activeElement === box, 'Escape closes it, keeps the typing and the focus');
  type(box, 'a ');
  ok(!menu.hidden, 'open once more');
  P.document.body.dispatchEvent(new P.window.MouseEvent('mousedown', { bubbles: true }));
  ok(menu.hidden, 'a press outside closes it');
  type(box, '');
  box.dispatchEvent(new P.window.Event('focus'));
  const second = menu.querySelectorAll('[role="option"]')[1];
  second.click();
  ok(M.state.included === second.textContent && menu.hidden && P.document.activeElement === box, 'a press on an option writes the answer and hands focus back to the line');

  /* ---- 6. the file reader with stubbed libraries (R20) ---- */
  const W = P.window;
  const mkFile = (name, content, type) => new W.File([content], name, { type });
  let pdfCalls = 0;
  W.pdfjsLib = { GlobalWorkerOptions: {}, getDocument: (o) => { pdfCalls++; const text = Buffer.from(o.data).toString('utf8'); return { promise: Promise.resolve({ numPages: text ? 2 : 1, getPage: (n) => Promise.resolve({ getTextContent: () => Promise.resolve({ items: text ? [{ str: `Page ${n}: ${text}`, transform: [1, 0, 0, 1, 0, 700] }] : [] }) }), destroy() {} }) }; } };
  W.mammoth = { extractRawText: ({ arrayBuffer }) => Promise.resolve({ value: Buffer.from(arrayBuffer).toString('utf8') }) };
  const r1 = await M.research.readFile(mkFile('accounts.pdf', 'Monthly revenue: £18,500. We are a team of 4.', 'application/pdf'));
  ok(r1.ok && r1.kind === 'pdf' && r1.words > 5 && pdfCalls === 1 && W.pdfjsLib.GlobalWorkerOptions.workerSrc && /pdf\.worker\.min\.js/.test(W.pdfjsLib.GlobalWorkerOptions.workerSrc), 'a text PDF is read through pdf.js with the worker set from cdnjs');
  ok(r1.added.some((f) => f.field === 'now' && f.value === 18500) && r1.added.some((f) => f.field === 'team' && f.value === 4), 'its finds join the list with their quotes');
  const r2 = await M.research.readFile(mkFile('scan.pdf', '', 'application/pdf'));
  ok(!r2.ok && /No text found in this file/.test(r2.error), 'a scanned PDF says "No text found in this file"');
  const r3 = await M.research.readFile(mkFile('cv.docx', 'Gross margin 42%. Established in March 2012.', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
  ok(r3.ok && r3.kind === 'docx' && r3.added.some((f) => f.field === 'founded' && f.value === 2012 && f.month === 3), 'a .docx is read through mammoth');
  const r4 = await M.research.readFile(mkFile('notes.txt', 'About 30 enquiries a month come in.', 'text/plain'));
  ok(r4.ok && r4.kind === 'txt' && r4.added.some((f) => f.field === 'enquiries' && f.value === 30), 'a .txt still reads through FileReader');
  const big = { name: 'big.pdf', type: 'application/pdf', size: 11 * 1048576 };
  const r5 = await M.research.readFile(big);
  ok(!r5.ok && /over 10 MB/.test(r5.error), 'a file over 10 MB is refused with a plain line');
  const r6 = await M.research.readFile(mkFile('old.doc', 'x', 'application/msword'));
  ok(!r6.ok && /\.docx/.test(r6.error), 'an old .doc is refused and told what to do');
  W.mammoth = { extractRawText: () => Promise.reject(new Error('corrupt')) };
  const r7 = await M.research.readFile(mkFile('bad.docx', 'x y z', ''));
  ok(!r7.ok && /could not be opened/.test(r7.error), 'a broken .docx fails softly');
  // the import step: a failed read leaves the paste box and Continue alone
  M.state = fresh('owner');
  mount('import');
  const paste = body.querySelectorAll('textarea')[1];
  type(paste, 'Prices from £450 per session.');
  const fileIn = body.querySelector('.q-file-in');
  ok(fileIn && /\.pdf/.test(fileIn.accept) && /\.docx/.test(fileIn.accept), 'the import step accepts pdf and docx');
  ok(/scanned PDF/.test(body.querySelector('.file-sub').textContent) && !/PDF and Word files are not read/.test(body.textContent), 'the step no longer says PDF and Word are not read');
  await body.querySelector('.q-file').dispatchEvent(Object.assign(new W.Event('drop', { bubbles: true, cancelable: true }), { dataTransfer: { files: [mkFile('scan.pdf', '', 'application/pdf')] } }));
  await tick(20);
  ok(/No text found/.test(body.querySelector('.file-note').textContent) && paste.value === 'Prices from £450 per session.' && next.disabled === false, 'a scanned PDF dropped on the step: the message shows, the pasted text stays, Continue stays open');
  ok(body.querySelectorAll('.import-says').length === 1 && /read in this browser/.test(body.querySelector('.import-says').textContent), 'one line says what is read here');

  /* ---- 7. the importer round trip: confirmed and excluded finds survive save and restore ---- */
  const P2 = page();
  P2.M.state = { ...fresh('owner'), now: 20000 };
  P2.mount('import');
  const r = P2.M.research.readText('Monthly revenue £18,500. Gross margin 42%. We are a team of 6. Established in 2012.', 'notes');
  ok(r.added.length === 4, `four finds from the text (${r.added.length})`);
  const found = P2.M.research.found();
  const fNow = found.find((f) => f.field === 'now'), fMargin = found.find((f) => f.field === 'margin'), fTeam = found.find((f) => f.field === 'team');
  ok(P2.body.querySelector('.found-row.found-conflict') && /Found £18,500 a month; you answered £20,000/.test(P2.body.querySelector('.found-conflict .found-held').textContent) && [...P2.body.querySelectorAll('.found-conflict button')].map((b) => b.textContent).join('|') === 'Use £18,500 a month|Keep £20,000', 'a find that disagrees with an answer shows both values and two presses');
  P2.press(P2.body.querySelector('.found-conflict'), 'Keep £20,000');
  ok(P2.M.state.now === 20000 && P2.M.research.found().find((f) => f.field === 'now').status === 'excluded', 'Keep leaves the answer and excludes the find');
  P2.M.research.confirm(fMargin.id);
  P2.M.research.exclude(fTeam.id);
  ok(P2.M.state.margin === 0.42 && P2.M.state.teamSize === undefined, 'confirm writes the margin; the excluded team figure is never written');
  const saved = JSON.parse(JSON.stringify(P2.M.state.imported));
  ok(Array.isArray(saved) && saved.length === 4 && saved.find((f) => f.field === 'margin').status === 'confirmed' && saved.find((f) => f.field === 'team').status === 'excluded' && saved.find((f) => f.field === 'now').status === 'excluded' && saved.every((f) => f.quote.length <= 160), 'state.imported holds the four finds with their statuses and short quotes');
  // a new page (a reload): research.js starts empty and re-seeds from the restored state
  const P3 = page();
  P3.M.state = { ...fresh('owner'), now: 20000, margin: 0.42, imported: saved };
  const back = P3.M.research.found();
  ok(back.length === 4 && back.find((f) => f.field === 'margin').status === 'confirmed' && back.find((f) => f.field === 'team').status === 'excluded' && back.find((f) => f.field === 'now').status === 'excluded', 'after a restore the list comes back with confirmed and excluded intact');
  ok(P3.M.research.foundFor('teamSize') === null && P3.M.research.foundFor('now') === null && P3.M.research.foundFor('yearsTrading')?.value === 2012, 'excluded finds are never offered again; the untouched one still is');
  P3.mount('import');
  ok(P3.body.querySelectorAll('.found-row').length === 4 && P3.body.querySelector('.found-row[data-status="confirmed"] .found-lab').textContent === 'Margin', 'and the step draws them with their statuses');
  P3.mount('teamSize');
  ok(!P3.body.querySelector('.found-offer'), 'the excluded team figure does not show on its question');

  /* ---- 8. best customers: positioning only (brief 1.2, 18.2) ---- */
  M.state = { ...fresh('owner'), now: 20000, price: 2500, ltv: 6000, buyer: 'micro', buyers: ['micro'] };
  mount('lastFive');
  ok(body.querySelector('.ui-clients') && body.querySelector('.client-none') && next.disabled === true, 'feel\'s cards mount with a No customers yet press beside them and Continue held');
  press(body, 'Add a customer');
  press(body, 'Add another customer');
  const cards = body.querySelectorAll('.cc-card');
  ok(cards.length === 2 && body.querySelector('.client-none').hidden, 'two cards; No customers yet steps aside');
  press(cards[0], 'Small businesses'); press(cards[0], 'Referral'); press(cards[0], 'Repeat work'); press(cards[0], 'Easy');
  press(cards[1], 'Small businesses'); press(cards[1], 'Referral'); press(cards[1], 'Referrals'); press(cards[1], 'Easy');
  const fig = cards[0].querySelector('.cc-money input');
  type(fig, '9000'); blur(fig);
  ok(next.disabled === false && Array.isArray(M.state.lastFive) && M.state.lastFive.length === 2 && M.state.lastFive[0].bin === 'warm11' && M.state.lastFive[0].value === 9000 && M.state.lastFive[0].valuable.includes('repeat'), 'the cards commit with a bin for the old readers and the value on the card');
  // the fallback of my own, for a page without feel's cards
  const P4 = page((w, m) => { w.__noCards = true; });
  delete P4.M.ui.clientCards;
  P4.M.state = { ...fresh('owner'), now: 20000 };
  P4.mount('lastFive');
  P4.press(P4.body, 'Add a customer');
  const fb = P4.body.querySelector('.client-card');
  P4.press(fb, 'Individuals'); P4.press(fb, 'Search');
  ok(P4.body.querySelector('.client-cards') && P4.M.state.lastFive.length === 1 && P4.M.state.lastFive[0].bin === 'cold1m' && P4.next.disabled === false, 'without feel\'s cards, the fallback cards do the same job');
  ok(M.state.price === 2500 && M.state.ltv === 6000 && M.state.now === 20000 && M.state.derived.price === undefined, 'no price, lifetime value or revenue moved: the cards are positioning only');
  const bc = M.bestClients();
  ok(bc.count === 2 && bc.warm === 2 && bc.baseline === false && bc.positioning.some((s) => /2 of your 2 best came by referral/.test(s)) && bc.positioning.some((s) => /easy work/.test(s)) && bc.positioning.some((s) => /All 2 are small businesses/.test(s)), `M.bestClients() speaks in words: ${bc.positioning.join(' ')}`);
  ok(!JSON.stringify(bc).includes('2500') && !JSON.stringify(bc).includes('6000'), 'and carries no price or lifetime figure');
  M.state = { ...fresh('owner'), now: 20000 };
  mount('lastFive');
  press(body, 'No customers yet');
  ok(M.state.bestNone === true && Array.isArray(M.state.lastFive) && M.state.lastFive.length === 0 && next.disabled === false && M.schemaAnswered('lastFive'), 'No customers yet is an answer');

  /* ---- 9. suggested customer groups (brief 6.4) ---- */
  M.state = { ...fresh('owner'), sector: 'professional', trade: 'Bookkeeping', place: 'Leeds', radius: 'county', price: 400, buyers: ['micro', 'consumer'], buyer: 'micro', buyerPrimary: 'micro', trigger: 'deadline', lastFive: [{ buyer: 'micro', found: 'referral', bin: 'warm11', valued: ['easy', 'repeat'] }] };
  const profiles = M.customerProfiles();
  ok(profiles.length >= 2 && profiles.length <= 3 && profiles.every((p) => p.id && p.title && /\.$/.test(p.text) && p.basis.length), `two or three profiles, each with a basis: ${profiles.map((p) => p.text).join(' | ')}`);
  ok(/^Firms of two to twenty people within about 30 miles of Leeds who need bookkeeping and pay a few hundred at a time/.test(profiles[0].text) && /against a date/.test(profiles[0].text), `the first reads the offer, the place, the price and the trigger back in plain words (${profiles[0].text})`);
  ok(!profiles.some((p) => /ideal prospect|segment/i.test(p.text)), 'no jargon in them');
  mount('segment');
  const cardBtns = body.querySelectorAll('.q-cards-part button[role="radio"]');
  ok(cardBtns.length === profiles.length + 1 && [...cardBtns].pop().textContent.includes('None of these'), 'the cards are the profiles plus None of these');
  cardBtns[0].click();
  ok(M.state.segment === profiles[0].id && M.state.segmentWords === profiles[0].text && next.disabled === false, 'a press picks the profile and puts its words in the line to edit');
  ok(body.querySelector('.q-narrow .q-cap') && /Who normally decides to buy/.test(body.querySelector('.q-narrow .q-cap').textContent), 'a business buyer with no decider yet gets that as the one narrowing choice');
  press(body.querySelector('.q-narrow'), 'The owner');
  ok(M.state.narrowKind === 'decider' && M.state.narrow === 'owner', 'the narrowing answer is kept with its kind');
  [...cardBtns].pop().click();
  ok(M.state.segment === 'none' && next.disabled === true, 'None of these holds Continue until words are given');
  const wordsBox = body.querySelector('.q-other textarea');
  type(wordsBox, 'new landlords with one flat'); blur(wordsBox);
  ok(M.state.segmentWords === 'new landlords with one flat' && next.disabled === false, 'their own words are the answer');
  M.state = fresh('owner');
  ok(M.customerProfiles().length === 0, 'with nothing said there are no profiles');

  /* ---- 10. enquiries and the close rate on one screen (E22) ---- */
  M.state = { ...fresh('owner'), now: 20000, price: 500 };
  mount('enquiries');
  const figs = body.querySelectorAll('input.figure');
  ok(figs.length === 2 && body.querySelector('.q-part .stone-row'), 'two counts and a period on one screen');
  type(figs[0], '40'); blur(figs[0]);
  ok(next.disabled === false && M.state.enquiries === 40 && M.state.closeRate === undefined, 'enquiries alone: no close rate is invented');
  type(figs[1], '10'); blur(figs[1]);
  ok(M.state.wins === 10 && M.state.closeRate === 0.25 && M.state.derived.closeRate === 'enquiries' && /10 of 40: about 3 in 10/.test(body.querySelector('.q-check').textContent), 'the close rate is read from the two counts and labelled as derived');
  press(body, 'A quarter');
  ok(M.state.enquiryPeriod === 'quarter' && M.state.enquiries === 13.3 && M.state.wins === 3.3 && M.state.closeRate === 0.25, 'a quarter: the page keeps monthly figures, the rate stays');
  ok(M.SCHEMA_BY.closeRate.on === 'enquiries' && !M.sectionQuestions('customers').includes('closeRate'), 'close rate rides on the enquiries screen and is never asked alone');
  M.state = { ...fresh('owner'), enquiries: 30, closeRate: 0.5 };
  mount('closeRate');
  ok(body.querySelector('.ui-tenstones, .ui-tenStones, [data-q="closeRate"]'), 'the ten stones still render for an old order list');

  /* ---- 11. multiselects with a primary (E02, E12), the currency, the reach, who decides ---- */
  M.state = fresh('owner');
  mount('repeatWork');
  press(body, 'A one-off service');
  ok(M.state.sells.join() === 'oneoff' && M.state.repeatWork === 'once' && next.disabled === false && body.querySelector('.q-primary').hidden, 'one kind sold: it is the primary and the pattern is once');
  press(body, 'A subscription');
  ok(M.state.sells.length === 2 && !body.querySelector('.q-primary').hidden && next.disabled === true, 'two kinds: the Most often row appears and Continue waits');
  press(body.querySelector('.q-primary'), 'A subscription');
  ok(M.state.sellsPrimary === 'subscription' && M.state.repeatWork === 'retainer' && next.disabled === false, 'the primary sets the pattern: a subscription is a retainer');
  mount('buyer');
  press(body, 'Individuals'); press(body, 'Small businesses');
  press(body.querySelector('.q-primary'), 'Small businesses');
  ok(M.state.buyers.length === 2 && M.state.buyer === 'micro', 'who pays: two picked, state.buyer is the primary');
  mount('place');
  const placeBox = body.querySelector('textarea');
  type(placeBox, 'Dublin'); blur(placeBox);
  ok(M.state.currency === 'EUR' && M.state.derived.currency === 'place' && /Suggested from your country: € EUR/.test(body.querySelector('.q-suggested').textContent), 'a town with no country picked still suggests its currency, and says it is a suggestion');
  press(body, '£ GBP');
  ok(M.state.currency === 'GBP' && M.state.derived.currency === undefined, 'a press makes the currency the visitor\'s own');
  mount('market');
  const reachFig = body.querySelector('input.figure');
  type(reachFig, '60'); blur(reachFig);
  ok(M.state.reach === 60 && M.state.market === 720 && M.state.derived.market === 'reach', 'reach this month is kept; the engine pool is twelve months of it, tagged as calculated');
  ok(/They do not need to have agreed to buy/.test(M.explain('market')) && /realistically reach this month/.test(M.headline('market').sub), 'the reach question carries the brief\'s wording');
  mount('decisionRights');
  press(body, 'Me');
  ok(M.state.decides === 'me' && M.state.decisionRights.pricing === 'you' && body.querySelector('.q-other').hidden, 'Me: every decision is yours, no sorter');
  press(body, 'Shared with others');
  ok(M.state.decides === 'shared' && !body.querySelector('.q-other').hidden && body.querySelector('.ui-sorter'), 'Shared opens the five decisions');
  mount('volume');
  M.state.now = 20000; M.state.price = 500;
  const vFig = body.querySelector('input.figure');
  type(vFig, '10'); blur(vFig);
  ok(M.state.volume === 10 && M.state.volumePeriod === 'month' && /revenue divided by sale value says about 40/.test(body.querySelector('.q-check').textContent) && M.state.now === 20000 && M.state.price === 500, 'a volume that disagrees with revenue and price is said, and neither is changed');
  ok(R.every((q) => q.unsure !== 'N/A' && !/N\/A/.test(M.headline(q.id).title + M.headline(q.id).sub + M.explain(q.id))), 'no question offers N/A: what does not apply is not asked');

  /* ---- 12. the founder and control profiles still build from the new keys ---- */
  M.state = { ...fresh('owner'), strengths: ['selling'], avoids: ['numbers'], energy: { gives: ['selling'], drains: ['numbers'] }, decides: 'shared', decisionRights: { pricing: 'you', hiring: 'shared' }, help: 'team', holiday: 'stops' };
  const fp = M.founderProfile(), cp = M.controlProfile();
  ok(fp.keep.length === 1 && fp.delegate.length === 1 && cp.current.decisionRights.pricing === 'you' && cp.actions.length >= 1, 'both profiles build');

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) { console.log(fails.map((f) => ' - ' + f).join('\n')); process.exitCode = 1; }
})().catch((e) => { console.error(e); process.exitCode = 1; });
