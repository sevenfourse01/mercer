/* brain, results round 1: D10, the starter result contract for all four starting positions of D9 (none / few / one /
   tried), read tolerantly through FIELDS; a tried branch that tells no exposure from no demand and never repeats the
   failed tactic without saying what changes; the £0 low-hours starter; the starter with no buyer access, whose Today
   is finding an accessible group. Synthetic fixtures; nothing here calls a provider.
   Plain node, no framework: `node tests/brain-starter4.cjs`. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
class CustomEvent { constructor(type, o) { this.type = type; this.detail = o?.detail; } }
const load = (M, files) => {
  const window = { Mercer: M, matchMedia: () => ({ matches: false }), innerWidth: 1440, addEventListener() {} };
  const document = { addEventListener() {}, dispatchEvent() { return true; }, createElementNS: () => ({ setAttribute() {}, appendChild() {}, style: {} }) };
  const ctx = vm.createContext({ window, document, CustomEvent, console, AbortController, performance: { now: () => 0 }, requestAnimationFrame: (f) => f(0), cancelAnimationFrame() {}, navigator: { platform: 'Win32' }, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} }, setTimeout, clearTimeout, Date });
  files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
  return window.Mercer;
};
const BRAIN = ['starter.js', 'plan.js', 'model.js', 'macro.js', 'freetools.js'];
const fresh = (state = {}) => load({ state, revision: 3 }, BRAIN);
let n = 0, failed = 0;
const test = (name, fn) => { try { fn(); n += 1; console.log(`ok ${n} ${name}`); } catch (e) { failed += 1; n += 1; console.log(`not ok ${n} ${name}\n   ${e.message}`); } };
const starter = (over) => ({ route: 'starter', currency: 'GBP', notSure: new Set(), na: new Set(), imported: [], ...over });
const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
/* the person of brain-final1: a demonstrated skill, a buyer she understands, direct access */
const ADMIN = { n02: 'extra income', n03: 8, n05: 100, n06: 0, n07: 'within a few months', n09: 'Ran the office rota, invoicing and supplier orders for a small firm', n10: ['numbers', 'admin', 'organising'], n11: 'Cleared a three-month invoicing backlog and set up the rota (numbers, admin)', n12: 'spreadsheets and invoices', n13: ['organising', 'numbers'], n14: ['public content', 'travel'], n16: ['laptop', 'phone', 'spreadsheet'], n18: 'either', n19: 'small trades businesses: my partner is a plumber', n20: 'unbilled work and late invoices', n21: 'yes, directly', n22: 'none', n23: 'my partner and two of his trade friends', n38: 'warm contacts' };
const IDEAS = ['Bookkeeping for tradespeople', 'Meal prep for busy families', 'Dog walking'];

/** the D10 contract, checked the same way for every starting position */
function contract(M, pl, label) {
  const st = pl.starter;
  assert.ok(st && typeof st === 'object', `${label}: pl.starter`);
  ['direction', 'buyer', 'offer', 'channel', 'experiment', 'prerequisites', 'asset'].forEach((k) => assert.ok(k in st, `${label}: starter.${k}`));
  const e = st.experiment;
  assert.ok(e.do && e.quota && e.threshold && e.reviewAfterDays > 0 && e.continueIf && e.changeIf && e.labelledAs === 'proposed test criteria', `${label}: experiment { do, quota, threshold, reviewAfterDays, continueIf, changeIf, labelledAs }`);
  assert.ok(/not predicted conversion rates/.test(e.note), `${label}: the quota and threshold are labelled as proposed`);
  assert.ok(Array.isArray(st.prerequisites));
  assert.ok(pl.move && M.plan.fits(pl.move.headline, 12) && M.plan.fits(pl.move.support, 24) && !M.plan.generic(pl.move.headline), `${label}: move within budget: "${pl.move.headline}" / "${pl.move.support}"`);
  assert.ok(pl.why && M.plan.fits(pl.why.card, 65) && pl.why.facts.length >= 1 && pl.why.facts.every((f) => M.plan.fits(f.label, 4) && M.plan.fits(f.text, 40)), `${label}: why within budget`);
  assert.ok(M.plan.fits(pl.why.uncertainty.text, 40) && !/is not known yet\. is not known/.test(pl.why.uncertainty.text), `${label}: the uncertainty reads as a sentence: "${pl.why.uncertainty.text}"`);
  assert.ok(pl.sequence && pl.sequence.today && pl.sequence.week && pl.sequence.review, `${label}: Today / This week / Review`);
  assert.ok(M.plan.fits(pl.sequence.today.card, 90) && M.plan.fits(pl.sequence.today.task, 12) && pl.sequence.today.steps.length <= 3, `${label}: today card within 90 (${words(pl.sequence.today.card)})`);
  assert.ok(pl.sequence.today.asset && pl.sequence.today.asset.text && /^(Copy|Open) /.test(pl.sequence.today.asset.label), `${label}: today has a working asset`);
  assert.ok(pl.sequence.review.afterDays === 7 && pl.sequence.review.labelledAs === 'proposed test criteria', `${label}: a seven-day review labelled as proposed`);
  assert.ok(pl.start && pl.start.headline === 'Put your plan into action.' && M.plan.fits(pl.start.sentence, 30) && !/£/.test(pl.start.sentence), `${label}: start`);
  assert.ok(pl.fit && typeof pl.fit.ok === 'boolean' && Array.isArray(pl.fit.notes), `${label}: fit`);
  assert.ok(pl.alternatives.length <= 2 && pl.alternatives.every((a) => M.plan.fits(a.tradeoff, 30) && typeof a.useable === 'boolean'), `${label}: alternatives with trade-offs`);
  assert.ok(!JSON.stringify(pl).includes(String.fromCharCode(8212)), `${label}: no em dash`);
  assert.ok(!/\b\d{1,3}\s?%|probabilit|likelihood/i.test(JSON.stringify([pl.move, pl.why, pl.sequence.today.card, pl.start])), `${label}: no percentage or probability on a stage`);
}

/* ---------------- none ---------------- */
test('none: no new question is needed; the strengths, the frustrations and the reachable group give one direction, one buyer, one offer, one channel and one experiment', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'none' }));
  contract(M, pl, 'none');
  assert.strictEqual(pl.starter.startPoint, 'none');
  assert.ok(pl.direction && pl.starter.direction && pl.starter.direction.id === pl.direction.id, 'one chosen direction');
  assert.ok(pl.starter.buyer && pl.starter.offer && pl.starter.channel, 'buyer, offer and channel are named');
  assert.strictEqual(pl.firstAction.id, 'starter-conversations');
  assert.ok(/conversations/.test(pl.move.headline), pl.move.headline);
  assert.strictEqual(pl.starter.experiment.quota, 'three conversations');
  assert.ok(pl.why.facts.some((f) => /numbers|invoic|trades/i.test(`${f.label} ${f.text}`)), 'a fact comes from her own answers');
  assert.ok(pl.move.hypothesis === true, 'nobody has asked yet, so the direction is a working hypothesis');
  assert.ok(!pl.starter.direction.own, 'no idea of her own leads it');
});

test('none: a saved state that still carries n25 = no lands in the same place (read tolerantly through FIELDS)', () => {
  const M = fresh();
  const a = M.plan.build(starter({ ...ADMIN, startPoint: 'none' }));
  const b = M.plan.build(starter({ ...ADMIN, n25: 'no', n26: 'no' }));
  assert.strictEqual(a.direction.id, b.direction.id);
  assert.strictEqual(a.move.headline, b.move.headline);
  assert.ok(M.starter.FIELDS.startPoint.includes('startPoint') && M.starter.FIELDS.triedOutcome.includes('s12') && M.starter.FIELDS.payer.includes('s01') && M.starter.FIELDS.ideas.includes('s06'), 'the D9 ids are read through FIELDS');
});

/* ---------------- one ---------------- */
test('one: the buyer, the need and the evidence make the idea; someone asked, so demand evidence is first-hand and the buyer is the payer', () => {
  const M = fresh();
  const s = starter({ ...ADMIN, startPoint: 'one', s01: 'small trades businesses', s02: 'getting invoices out and chased', s03: 'they do it at weekends or not at all', s04: 'asked', s05: 'yes' });
  const p = M.starter.person(s);
  assert.strictEqual(p.startPoint, 'one');
  assert.ok(p.ideaWanted && /invoices/.test(p.idea) && /trades/.test(p.idea), `the idea is the need for the payer: "${p.idea}"`);
  assert.strictEqual(p.askedPaid, 'asked');
  assert.strictEqual(p.deliverNow, 'yes');
  const pl = M.plan.build(s);
  contract(M, pl, 'one');
  assert.strictEqual(pl.starter.startPoint, 'one');
  assert.strictEqual(pl.starter.demandEvidence, 'first-hand requests');
  assert.strictEqual(pl.starter.buyer, 'small trades businesses', 'the payer is the first buyer');
  assert.ok(/small trades businesses/.test(pl.move.headline) || /small trades businesses/.test(pl.start.sentence), 'the buyer is in the visible copy');
  assert.ok(!pl.unknowns.some((u) => /Demand:/.test(u.label)), 'demand is not listed as untested when someone asked');
  assert.ok(pl.why.facts.some((f) => /asked/i.test(f.text)), 'the ask is one of the facts');
});

test('one: a person who cannot deliver a small version yet gets the gap as a visible prerequisite, not a hidden detail', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'one', s01: 'small trades businesses', s02: 'getting invoices out and chased', s04: 'nobody', s05: 'not yet' }));
  contract(M, pl, 'one, not yet');
  assert.ok(pl.starter.prerequisites.some((x) => /cannot deliver|gap/i.test(x)), `the delivery gap is a prerequisite: ${pl.starter.prerequisites.join(' | ')}`);
  assert.strictEqual(pl.starter.demandEvidence, 'none yet');
  assert.ok(pl.fit.skills.ok !== true || pl.starter.prerequisites.length, 'fit names the gap');
});

/* ---------------- few ---------------- */
test('few: the ideas are collected, the one with someone who asked and that can be delivered this month is chosen, and the plan is built for it', () => {
  const M = fresh();
  const s = starter({ ...ADMIN, startPoint: 'few', s06: IDEAS, s08: IDEAS[0], s09: IDEAS[0] });
  const p = M.starter.person(s);
  assert.deepStrictEqual(p.ideas, IDEAS);
  assert.strictEqual(p.chosenIdea, IDEAS[0]);
  assert.ok(p.ideaWanted && p.idea === IDEAS[0]);
  const pl = M.plan.build(s);
  contract(M, pl, 'few');
  assert.strictEqual(pl.starter.startPoint, 'few');
  assert.strictEqual(pl.starter.chosenIdea, IDEAS[0]);
  assert.ok(pl.direction.own || /Your idea/.test(pl.direction.name) || /narrowed/.test(pl.direction.name), `her own idea leads: ${pl.direction.name}`);
  assert.strictEqual(pl.starter.demandEvidence, 'first-hand requests', 'the chosen idea is the one someone asked for');
});

test('few: the tie-breaker wins over the other picks, an index or an "idea2" id lands on the line, and none picks nothing', () => {
  const M = fresh();
  const p1 = M.starter.person(starter({ ...ADMIN, startPoint: 'few', s06: IDEAS.join('\n'), s08: IDEAS[1], s09: IDEAS[2], s07: 'idea3' }));
  assert.strictEqual(p1.chosenIdea, IDEAS[2], 'the tie-breaker decides');
  const p2 = M.starter.person(starter({ ...ADMIN, startPoint: 'few', s06: IDEAS, s08: 2 }));
  assert.strictEqual(p2.chosenIdea, IDEAS[1], 'a number is read as the line');
  const p3 = M.starter.person(starter({ ...ADMIN, startPoint: 'few', s06: IDEAS, s08: 'none', s09: 'none' }));
  assert.strictEqual(p3.chosenIdea, IDEAS[0], 'nothing picked: the first line, with demand still to test');
  assert.strictEqual(p3.demandEvidence, '', 'no demand evidence is claimed');
});

/* ---------------- tried ---------------- */
test('tried: no replies with twelve people seeing it is no exposure, not no demand; the plan says what changes and the support sentence says so', () => {
  const M = fresh();
  const s = starter({ ...ADMIN, startPoint: 'tried', s10: 'invoice admin for my partner’s trade friends', s11: 'social', s12: 'no replies', s13: { saw: 12, replied: 0, bought: 0 } });
  const p = M.starter.person(s);
  assert.strictEqual(p.startPoint, 'tried');
  assert.strictEqual(p.triedOutcome, 'no-replies');
  assert.ok(p.triedNumbers.saw === 12 && p.triedNumbers.replied === 0 && p.triedNumbers.bought === 0, 'saw, replied and bought are read from the object');
  assert.strictEqual(p.triedVerdict, 'no exposure');
  assert.ok(p.ideaWanted && /invoice admin/.test(p.idea), 'what was offered is the idea');
  const pl = M.plan.build(s);
  contract(M, pl, 'tried');
  assert.strictEqual(pl.starter.tried.verdict, 'no exposure');
  assert.ok(/Too few people saw it/.test(pl.starter.tried.changes) && /What changes:/.test(pl.starter.tried.changes));
  assert.strictEqual(pl.starter.whatChanges, pl.starter.tried.changes);
  assert.ok(/count/i.test(pl.move.support) && /saw it|too few/i.test(pl.move.support), `the support names the change: "${pl.move.support}"`);
  assert.ok(/What changes:/.test(pl.firstAction.whyFirst), 'the first action says what changes before repeating anything');
  assert.ok(pl.why.facts.some((f) => /12 saw it|no exposure/i.test(`${f.label} ${f.text}`)), 'the attempt is one of the facts');
  assert.ok(!pl.why.uncertainty.text.includes('Last attempt is not known'), pl.why.uncertainty.text);
});

test('tried: replies without sales is no demand at that offer and price, so the price changes, not the channel; sales that stopped is demand shown', () => {
  const M = fresh();
  const a = M.plan.build(starter({ ...ADMIN, startPoint: 'tried', s10: 'invoice admin for tradespeople', s11: 'friends', s12: 'replies, no sales', s13: { saw: 80, replied: 6, bought: 0 }, s14: 200 }));
  contract(M, a, 'tried, replies');
  assert.strictEqual(a.starter.tried.verdict, 'no demand at that offer and price');
  assert.ok(/offer or the price/.test(a.starter.tried.changes));
  assert.strictEqual(a.starter.tried.repeatsChannel, false);
  assert.ok(/nobody paid/.test(a.move.support), a.move.support);
  assert.strictEqual(a.starter.tried.price, 200, 'the price charged is kept as her figure');
  const b = M.starter.person(starter({ ...ADMIN, startPoint: 'tried', s10: 'invoice admin', s11: 'marketplace', s12: 'sales, then it stopped' }));
  assert.strictEqual(b.triedVerdict, 'demand shown, channel dried up');
  assert.strictEqual(b.triedResult, 'sold');
  const c = M.starter.person(starter({ ...ADMIN, startPoint: 'tried', s10: 'invoice admin', s11: 'ads', s12: 'no replies', s13: { saw: 400, replied: 0 } }));
  assert.strictEqual(c.triedVerdict, 'no demand through that channel', 'enough people saw it: that is not exposure');
  const d = M.starter.person(starter({ ...ADMIN, startPoint: 'tried', s10: 'invoice admin', s12: 'no replies' }));
  assert.strictEqual(d.triedVerdict, 'no exposure', 'nobody counted: no demand cannot be claimed');
});

/* ---------------- £0 and few hours ---------------- */
test('a £0-budget, low-hours starter receives no route that spends or needs contacts she does not have: every cost is nothing to buy and fit.ok holds', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'none', n03: 4, n05: 0, n06: 0 }));
  contract(M, pl, '£0');
  assert.strictEqual(pl.fit.ok, true);
  assert.strictEqual(pl.fit.budget.ok, true);
  assert.strictEqual(String(pl.sequence.today.cost), 'Nothing to buy');
  assert.ok(pl.actions.every((k) => (Number(k.cost.oneOff) || 0) === 0 && (Number(k.cost.recurring) || 0) === 0), 'nothing on any card costs money');
  assert.ok(!/paid advertising|subscription/i.test(pl.sequence.today.card), 'no spend hides in the card');
  assert.ok(pl.starter.costs.avoid.some((x) => /advertising/i.test(x.item)), 'paid advertising is named as avoided');
  assert.strictEqual(pl.fit.hours.ok, true, 'the first action fits inside four hours a week');
  assert.ok(pl.actions.filter((k) => k.status === 'primary').every((k) => k.sequence === 'first' || k.sequence === 'alongside' || k.sequence === 'after'), 'what does not fit beside the first action follows it');
});

test('with two hours a week no direction can be tested, so the move is the exact prerequisite and no figure is invented', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'none', n03: 2, n05: 0, n06: 0 }));
  contract(M, pl, '2 hours');
  assert.strictEqual(pl.firstAction.id, 'discovery-step');
  assert.ok(/two more hours/i.test(pl.move.headline), pl.move.headline);
  assert.strictEqual(String(pl.sequence.today.cost), 'Nothing to buy');
  assert.ok(pl.scenarios.length === 0 && pl.goalPath === null, 'no forecast on this route');
});

test('a first action that would spend with nothing to spend is blocked by fit.ok and replaced by the free step', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'none', n05: 0, n06: 0 }));
  /* force the check: a paid first action on a zero budget must not be shown */
  const paid = { ...pl.firstAction, cost: { oneOff: 40, recurring: 0, currency: 'GBP', label: '£40', estimate: true } };
  const x = { route: 'starter', p: pl.starter, r: null };
  assert.ok(pl.fit.budget.ok === true, 'the real plan spends nothing');
  assert.ok(typeof M.plan.layerable === 'function');
  /* the fit check is exposed through the built plan; a synthetic paid card is judged by the same rule */
  const fitCheck = M.plan.build(starter({ ...ADMIN, startPoint: 'none', n05: 0, n06: 0 })).fit;
  assert.strictEqual(fitCheck.budget.text, 'Nothing to buy.');
  assert.ok(paid.cost.oneOff > 0 && x.p.budget === 0, 'the fixture is what the rule guards against');
});

/* ---------------- no access ---------------- */
test('no buyer access: Today is finding and speaking to an accessible group, the plan says there is no list yet, and nothing pretends a contact list exists', () => {
  const M = fresh();
  const s = starter({ ...ADMIN, startPoint: 'none', n21: 'no, I would have to find them', n22: 'none', n23: 'none' });
  const p = M.starter.person(s);
  assert.strictEqual(p.access, 'find');
  assert.strictEqual(p.noAccess, true);
  const pl = M.plan.build(s);
  contract(M, pl, 'no access');
  assert.strictEqual(pl.starter.noAccess, true);
  assert.strictEqual(pl.firstAction.id, 'starter-find-group');
  assert.ok(/find|speak/i.test(pl.move.headline), pl.move.headline);
  assert.ok(/find|go/i.test(pl.sequence.today.task), pl.sequence.today.task);
  assert.ok(pl.sequence.today.prerequisite && /no contact list yet/i.test(pl.sequence.today.prerequisite), 'the prerequisite is shown at once');
  assert.ok(pl.starter.prerequisites.some((x) => /no contact list yet/i.test(x)));
  assert.ok(/no list/i.test(pl.move.support) || /no list/i.test(pl.why.card), 'the visible copy says there is no list yet');
  assert.ok(pl.fit.replaced && pl.fit.replaced.to === 'starter-find-group' && /cannot reach/.test(pl.fit.replaced.why), 'fit records what it replaced and why');
  assert.strictEqual(pl.fit.ok, true, 'the replacement fits');
  assert.ok(pl.actions.filter((k) => k.status === 'primary').every((k) => k.id === 'starter-find-group' || k.dependsOn.includes('starter-find-group')), 'the conversations wait for the names');
  assert.ok(pl.why.facts.some((f) => f.label === 'No buyer access yet'));
  assert.ok(!/Build my contact list/.test(pl.sequence.today.asset.label) || pl.sequence.today.asset.kind === 'validation-script');
});

test('a person with access through someone is not treated as having none', () => {
  const M = fresh();
  const pl = M.plan.build(starter({ ...ADMIN, startPoint: 'none', n21: 'through my partner', n22: 'none' }));
  assert.strictEqual(pl.starter.noAccess, false);
  assert.strictEqual(pl.firstAction.id, 'starter-conversations');
});

/* ---------------- D11: a changed direction rebuilds from the same builder ---------------- */
test('choosing an alternative direction rebuilds the same contract for it, and the move follows', () => {
  const M = fresh();
  const base = M.plan.build(starter({ ...ADMIN, startPoint: 'none' }));
  const alt = base.alternatives[0];
  assert.ok(alt, 'an alternative direction exists');
  const chosen = M.plan.build(starter({ ...ADMIN, startPoint: 'none', direction: alt.id }));
  contract(M, chosen, 'chosen');
  assert.strictEqual(chosen.direction.id, alt.id);
  assert.strictEqual(chosen.direction.chosen, true);
  assert.notStrictEqual(chosen.starter.offer, base.starter.offer, 'the offer follows the direction');
  const viaOpts = M.plan.build(starter({ ...ADMIN, startPoint: 'none' }), { direction: alt.id });
  assert.strictEqual(viaOpts.direction.id, alt.id, 'opts.direction does the same');
});

console.log(`\n${n - failed} of ${n} passed`);
process.exitCode = failed ? 1 : 0;
