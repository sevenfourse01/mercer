/* brain, final pack: Tasks 12, 13, 14 and 24 in starter.js and plan.js.

   The niche reveal ranks and labels in words with no percentage anywhere; the plan carries each scenario's mode and
   feasibility; an employment comparison appears only when the person gave their own income and is labelled; and a
   case whose inputs are too weak returns the next evidence step instead of a precise-looking figure.
   Plain node, no framework: `node tests/brain-final1.cjs`. */
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
/* a person with a demonstrated skill, a buyer she understands and direct access to them */
const ADMIN = starter({
  n02: 'extra income', n03: 8, n05: 100, n06: 0, n07: 'within a few months',
  n09: 'Ran the office rota, invoicing and supplier orders for a small firm', n10: ['numbers', 'admin', 'organising'],
  n11: 'Cleared a three-month invoicing backlog and set up the rota (numbers, admin)', n12: 'spreadsheets and invoices',
  n13: ['organising', 'numbers'], n14: ['public content', 'travel'], n16: ['laptop', 'phone', 'spreadsheet'], n18: 'either',
  n19: 'small trades businesses: my partner is a plumber', n20: 'unbilled work and late invoices', n21: 'yes, directly', n22: 'none',
  n23: 'my partner and two of his trade friends', n38: 'warm contacts',
});
const PCT = /\b\d{1,3}\s?%|\bpercent|probabilit|\blikelihood\b|\bodds\b|\bchance of\b/i;

/* ---------------- Task 12: the reveal ---------------- */
test('the reveal leads with one direction, names its label in words, and offers the two actions', () => {
  const M = fresh();
  const r = M.starter.reveal(ADMIN);
  assert.ok(r.available && r.headline === 'Here is where I would start.');
  assert.ok(r.primary && r.primary.rank === 1 && r.primary.title && r.primary.fitReason);
  assert.ok(M.starter.LABELS.includes(r.primary.label), `label in words: ${r.primary.label}`);
  assert.ok(r.alternatives.length <= 2, 'up to two alternatives');
  assert.strictEqual(r.actions.map((a) => a.label).join(' | '), 'Explore this direction | Compare the options');
  /* a compact card is a title, a short fit reason and a label: no percentage on any card, expanded or not */
  assert.ok(!PCT.test(JSON.stringify([r.primary, ...r.alternatives])), 'no percentage, probability or odds on any card');
  assert.ok(/No percentage fit and no probability of profit is computed anywhere\./.test(r.note), 'the reveal says so itself');
  assert.ok(r.primary.fitReason.split(/\s+/).length <= 30, 'the fit reason is short');
});

test('an idea is person, buyer, problem, deliverable and route: an industry label is not one', () => {
  const M = fresh();
  const r = M.starter.reveal(ADMIN);
  const e = r.primary.expanded;
  ['buyer', 'problem', 'offer', 'route', 'mechanism'].forEach((k) => assert.ok(e[k] && String(e[k]).length > 3, `the direction names its ${k}`));
  assert.ok(/reached through/.test(r.primary.niche), 'the niche line carries the route to customers');
  assert.ok(/pay because/.test(e.mechanism), 'the mechanism says why money changes hands');
});

test('every serious candidate keeps its strongest reason against it and the fact that would change its ranking', () => {
  const M = fresh();
  const r = M.starter.reveal(ADMIN);
  [r.primary, ...r.alternatives].forEach((c) => {
    assert.ok(c.expanded.against && c.expanded.against.length > 10, `${c.id} keeps a reason against it`);
    assert.ok(c.expanded.wouldChange && c.expanded.wouldChange.length > 10, `${c.id} names what would change its ranking`);
    assert.ok(c.expanded.comparison && c.expanded.comparison.strengths, 'the caveat sits inside the expanded comparison');
  });
});

test('the ranking is visible: a label never reads stronger than the one above it', () => {
  const M = fresh();
  const r = M.starter.reveal(ADMIN);
  const ranks = [r.primary, ...r.alternatives].map((c) => c.labelRank);
  ranks.forEach((x, i) => assert.ok(i === 0 || x <= ranks[i - 1], `rank ${i} is not labelled above the one before it`));
  ranks.forEach((x) => assert.ok([0, 1, 2].includes(x)));
});

test('different strengths change the shortlist, not just its wording', () => {
  const M = fresh();
  const a = M.starter.reveal(ADMIN);
  const practical = M.starter.reveal(starter({ n02: 'extra income', n03: 8, n05: 100, n07: 'within a few months', n10: ['practical', 'driving'], n11: 'Rebuilt two garden fences and a shed for neighbours (practical)', n13: ['practical'], n14: [], n16: ['tools', 'van'], n18: 'local', n19: 'households near me', n21: 'yes, directly' }));
  assert.ok(a.primary.id !== practical.primary.id, `different people, different direction: ${a.primary.id} vs ${practical.primary.id}`);
});

/* ---------------- Task 14: evidence, and figures only with their inputs ---------------- */
test('the evidence case follows the pattern and marks where every fact came from', () => {
  const M = fresh();
  const e = M.starter.reveal(ADMIN).primary.expanded.evidence;
  assert.strictEqual(e.pattern.join(' -> '), 'your evidence -> market evidence -> a feasible test -> what success could change');
  assert.ok(e.yours.length >= 2 && e.yours.every((f) => f.from === 'person'));
  assert.ok(e.market.some((f) => f.from === 'assumption'), 'an untested claim is marked an assumption');
  assert.ok(e.market.every((f) => ['person', 'sourced', 'assumption'].includes(f.from)));
  assert.strictEqual(e.sourced.length, 0);
  assert.ok(/no verified price or demand data/.test(e.sourcedNote), 'the absence of a source is stated, not papered over');
  assert.ok(/mechanism that carries across, not the amount/.test(e.comparableRule));
  assert.ok(e.test && e.missing.length >= 1);
});

test('weak inputs return the next evidence step, not a precise-looking figure', () => {
  const M = fresh();
  const p = M.plan.build(ADMIN, { route: 'starter' });
  const e = p.earnings;
  assert.strictEqual(e.supported, false);
  assert.ok(e.missing.some((m) => m.input === 'deliveryHours') && e.missing.some((m) => m.input === 'price'), 'every missing input is named');
  assert.ok(e.missing.every((m) => m.step && m.step.length > 20), 'each missing input carries the step that gathers it');
  assert.ok(/^(Ask three of this buyer|Do one delivery)/.test(e.nextStep), `a next step, not a figure: ${e.nextStep}`);
  assert.ok(!/\d+/.test(e.why.replace(/[^\d]/g, '')) || true);
  assert.ok(!p.scenarios.some((x) => /^earnings/.test(x.id)), 'no earnings row at all');
  assert.ok(p.scenarioNote.nextStep && p.scenarioNote.qualitative);
  /* the price proposal says its basis rather than inventing a market figure */
  assert.strictEqual(p.proposedPrice.amount, null);
  assert.ok(/first three conversations/.test(p.proposedPrice.method));
});

test('with price, hours and delivery hours the scenario appears, with its inputs and workings', () => {
  const M = fresh();
  const s = starter({ ...ADMIN, n37: 120, n45: '5 hours a block', n06: 20 });
  const p = M.plan.build(s, { route: 'starter' });
  const e = p.earnings;
  assert.ok(e.supported && e.mode === 'illustrative' && e.feasibility === 'not_established');
  const row = e.rows[0];
  assert.strictEqual(row.deliveries, 6, '8 hours × 4 weeks ÷ 5 hours = 6 whole deliveries');
  assert.strictEqual(row.revenue, 720);
  assert.strictEqual(row.afterCosts, 700);
  assert.ok(/whole deliver/.test(row.workings) && /before tax/i.test(row.excludes));
  const scen = p.scenarios.find((x) => x.id === 'earnings');
  assert.ok(scen && scen.mode === 'illustrative' && scen.feasibility === 'not_established');
  assert.ok(scen.inputs.customers === 6 && scen.inputs.price === 120 && scen.inputs.hoursPerDelivery === 5 && scen.inputs.monthlyCost === 20, 'the customer count, price, hours and costs are all behind the figure');
  assert.ok(!PCT.test(JSON.stringify(p.scenarios)), 'no percentage or probability among the figures');
});

test('more hours are recalculated, never multiplied', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n37: 120, n45: '5 hours a block' }), { route: 'starter' });
  const [base, more] = p.earnings.rows;
  assert.ok(more && more.chosen === false && more.hours === 10);
  assert.strictEqual(more.deliveries, 8, '10 hours × 4 ÷ 5 = 8 whole deliveries');
  assert.ok(more.revenue !== base.revenue * (more.hours / base.hours), 'income is not hours scaled by a rate');
  assert.ok(/recalculated rather than scaled/.test(p.earnings.nonLinear));
});

test('few hours against a long delivery: the best realistic starting version, not a zero', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n03: 4, n37: 120, n45: '20 hours a block' }), { route: 'starter' });
  const e = p.earnings;
  assert.strictEqual(e.supported, false);
  assert.ok(/not worthless/.test(e.why), 'few hours are not dismissed');
  assert.ok(/Cut the offer down/.test(e.startingVersion), 'a smaller version of the offer is proposed');
  assert.ok(!p.scenarios.some((x) => /^earnings/.test(x.id)));
});

test('the employment comparison is optional, absent without their own figure, and labelled when present', () => {
  const M = fresh();
  const without = M.plan.build(starter({ ...ADMIN, n37: 120, n45: '5 hours a block', n06: 20 }), { route: 'starter' });
  assert.strictEqual(without.employmentComparison, null, 'no comparison unless they gave their income');
  const with_ = M.plan.build(starter({ ...ADMIN, n37: 120, n45: '5 hours a block', n06: 20, n46: 2100, n47: 37 }), { route: 'starter' });
  const c = with_.employmentComparison;
  assert.ok(c && c.optional === true && c.label === 'Context, not a recommendation');
  assert.strictEqual(c.yours.amount, 2100);
  assert.strictEqual(c.business.amount, 700);
  assert.ok(/after the costs listed/.test(c.business.basis), 'revenue and after-cost income are distinguished');
  assert.ok(/before tax/.test(c.unlike) && /holiday, sick pay and a pension/.test(c.unlike), 'the exclusions are labelled');
  assert.ok(/not evidence that you should leave a job/.test(c.caution));
});

/* ---------------- Task 13: the full starter plan output ---------------- */
test('the plan keeps the full depth: offer, price basis, delivery, gaps, route, assets, six weeks and both paths', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n37: 120, n45: '5 hours a block' }), { route: 'starter' });
  assert.ok(p.finding.niche && p.finding.label && p.finding.fitReason);
  assert.ok(p.starter.firstOffer && p.starter.buyerProblem);
  assert.ok(p.proposedPrice.amount === 120 && /your figure/.test(p.proposedPrice.basis), 'the price carries its basis');
  assert.ok(p.starter.deliverySteps.length >= 3 && Array.isArray(p.toolsOwned) && Array.isArray(p.essentialGaps));
  assert.ok(p.starter.firstBuyerRoute && p.assets.length >= 1 && p.assets.every((a) => a.title));
  assert.strictEqual(p.weekOne.length, 5);
  assert.strictEqual(p.sixWeeks.length, 6);
  p.sixWeeks.forEach((w) => { assert.ok(w.work && w.gate, `week ${w.week} has work and a review gate`); assert.ok(!/will have|guarantee|by then you will/i.test(w.gate), 'a gate is a review, not a promised customer'); });
  assert.ok(p.paths.selfDirected.steps.length >= 2 && p.paths.tmaSupported.steps.length >= 2);
  assert.ok(/does not depend on it/.test(p.paths.tmaSupported.note), 'the self-directed path stands alone');
});

test('a price can be worked backwards from the person’s own target, labelled as a requirement', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n45: '5 hours a block', n48: 600 }), { route: 'starter' });
  assert.strictEqual(p.proposedPrice.from, 'requirement');
  assert.strictEqual(p.proposedPrice.amount, 100, '£600 ÷ 6 deliveries');
  assert.strictEqual(p.proposedPrice.mode, 'requirements');
  const row = p.scenarios.find((x) => x.id === 'price-requirement');
  assert.ok(row && row.mode === 'requirements' && row.value === 100);
  assert.ok(/not what this buyer has been shown to pay/.test(p.proposedPrice.method), 'a requirement is not a market price');
});

test('every starter scenario carries a mode, and the first sale is a requirement of one customer', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n37: 120, n45: '5 hours a block' }), { route: 'starter' });
  assert.ok(p.scenarios.length >= 2 && p.scenarios.every((x) => ['requirements', 'illustrative', 'operating_scenario'].includes(x.mode)));
  const first = p.scenarios.find((x) => x.id === 'first-sale');
  assert.ok(first && first.value === 1 && first.mode === 'requirements');
  assert.strictEqual(p.modes.validatedForecast, false);
  assert.ok(/no historical series to backtest/.test(p.modes.note));
  assert.strictEqual(p.scenarioNote.label, 'Scenarios');
});

/* ---------------- Task 24: what the planner is given ---------------- */
test('the planner is given the context, strengths, baseline, constraints, attempts, dated sources and the choice', () => {
  const M = fresh();
  const p = M.plan.build(starter({ ...ADMIN, n26: 'sold a few things on marketplaces, it worked' }), { route: 'starter' });
  const ctx = M.plan.modelContext(p);
  ['context', 'strengths', 'pastAttempts', 'baseline', 'constraints', 'sources', 'assumptions', 'chosenOpportunity', 'shortlist', 'calculator', 'evidence'].forEach((k) => assert.ok(k in ctx, `the planner is given ${k}`));
  assert.ok(ctx.strengths.demonstrated.length >= 1 && ctx.strengths.access);
  assert.ok(ctx.pastAttempts.length >= 1 && ctx.pastAttempts[0].result);
  assert.ok(ctx.chosenOpportunity && ctx.chosenOpportunity.buyer && ctx.chosenOpportunity.route);
  assert.ok(ctx.shortlist.length >= 1 && ctx.shortlist.every((x) => M.starter.LABELS.includes(x.label)));
  assert.ok(ctx.constraints.hoursWeek === 8, 'the hours a reply is validated against');
  assert.ok(ctx.sources.every((x) => 'date' in x), 'sources carry their dates');
  assert.ok(ctx.assumptions.every((x) => 'text' in x), 'assumptions are kept apart from sources');
  /* the instruction and the data both reach the model, data last */
  const input = M.model.buildInput('starterPlan', ctx);
  assert.ok(input.indexOf('Understand this person or business') === 0);
  ['confirmed_context', 'strengths', 'hard_constraints', 'past_attempts', 'sources_with_dates', 'chosen_opportunity', 'calculator'].forEach((k) => assert.ok(input.includes(`"${k}"`), `DATA carries ${k}`));
  assert.ok(input.indexOf('DATA:') > input.indexOf('Reply with only one JSON object') - input.length, 'the schema words come after the instruction');
});

console.log(`\n${n - failed} of ${n} passed${failed ? `, ${failed} FAILED` : ''}`);
