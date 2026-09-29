/* brain, rebuild 1: model.js against a stub window.claude. The validator accepts a good reply and rejects a wrong number,
   a fake evidence id, a stale revision, a new link, an over-long insight; the call path hides on not_granted, backs off on
   rate_limited, never calls the host at load, runs the insight only once a plan call was granted, and discards a reply
   that lands after the answers changed. The live host cannot be exercised here: it exists only in the published
   artifact. Plain node: `node tests/brain-model.cjs`. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
class CustomEvent { constructor(type, o) { this.type = type; this.detail = o?.detail; } }
function harness(replies) {
  const calls = [];
  const queue = [...replies];
  const events = [];
  const sample = Object.assign(async () => ({ text: '', truncated: false }), {
    json: (input, opts) => new Promise((resolve, reject) => {
      calls.push({ input, opts });
      const next = queue.shift();
      const settle = () => {
        if (opts?.signal?.aborted) { reject({ code: 'cancelled', message: 'aborted' }); return; }
        if (next && next.__error) reject(next.__error); else resolve(next === undefined ? null : next.__value !== undefined ? next.__value : next);
      };
      if (next && next.__delay) setTimeout(settle, next.__delay); else setTimeout(settle, 0);
    }),
    limits: async () => ({ maxPromptBytes: 65536 }),
  });
  let uses = 0;
  const claude = { use: async (name) => { uses += 1; return name === 'sample' ? sample : null; } };
  const window = { Mercer: { state: {}, revision: 7 }, claude };
  const document = { addEventListener() {}, dispatchEvent(e) { events.push(e.detail); return true; } };
  const ctx = vm.createContext({ window, document, CustomEvent, console, AbortController, setTimeout, clearTimeout, Date });
  ['starter.js', 'plan.js', 'model.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
  return { M: window.Mercer, calls, events, uses: () => uses, queue };
}
let n = 0, failed = 0;
const clean = (v, what) => assert.ok(v.errors.length === 0, `${what}: ${JSON.stringify(v.errors)}`);
const test = async (name, fn) => { try { await fn(); n += 1; console.log(`ok ${n} ${name}`); } catch (e) { failed += 1; n += 1; console.log(`not ok ${n} ${name}\n   ${e.stack ?? e.message}`); } };

/* one evidence set and one calculator, shared by the cases */
const ctxOf = (M, over = {}) => ({
  revision: 7, route: 'owner', goal: 'A bigger income: £13,000 a month by month 9',
  evidence: [
    { id: 'now', state: 'user', label: 'Your answer', value: 9000 },
    { id: 'canDeliverMore', state: 'user', label: 'Your answer', value: 'no' },
    { id: 'calc:utilisation', state: 'calculated', label: 'Calculated', value: 83, unit: '%' },
    { id: 'calc:lever_price', state: 'calculated', label: 'Calculated', value: 3100, unit: 'GBP' },
    { id: 'src:cpi_annual', state: 'source', label: 'Source', value: 3.1, sourceTitle: 'ONS, Consumer price inflation, UK: August 2026', sourceUrl: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/august2026', sourceDate: '2026-09-16' },
  ],
  calculator: { metrics: [{ id: 'calc:utilisation', label: 'How full you are today', value: 83, unit: '%' }, { id: 'calc:lever_price', label: 'Price up 10%', value: 3100, unit: 'GBP' }, { id: 'calc:base', label: 'Revenue today', value: 9000, unit: 'GBP' }] },
  registry: ['capacity', 'price', 'hours'],
  ...over,
});
const goodInsight = { headline: 'Delivery, not demand, is the constraint', explanation: 'You are 83% full today and said you could not deliver more next month.', evidence_ids: ['calc:utilisation', 'canDeliverMore'], implication: 'Protect capacity before spending on lead generation.', next_question_id: 'capacity' };
const action = (over = {}) => ({ title: 'Raise the price on new work', intended_result: 'Each job earns more', why_now: 'You cannot deliver more, so the next revenue comes from each job.', steps: ['Set the new price from Monday', 'Rewrite the quote', 'Note acceptance on the next ten quotes'], owner_role: 'You', time_required: 'about 2 hours', one_off_cost: '£0', recurring_cost: '£0', dependencies: [], evidence_ids: ['canDeliverMore', 'calc:lever_price'], success_measure: 'Acceptance on the next ten quotes', review_or_stop_condition: 'Fewer than half accepted', asset: 'offer-sheet', ...over });
const goodPlan = () => ({ advantage_summary: [{ point: 'You are the only one of your size booked out this far ahead.', evidence_ids: ['calc:utilisation', 'canDeliverMore'] }], goal_summary: 'Reach £13,000 a month by month 9 from £9,000 today.', primary_finding: 'You are 83% full and cannot deliver more; capacity, not demand, is the constraint.', recap: 'You cannot deliver more, so the next revenue comes from each job. Raise the price on new work first.', detail: 'The utilisation reading and your own answer both point at delivery rather than demand. The price action needs no new enquiries and no spend.', supporting_evidence_ids: ['calc:utilisation', 'canDeliverMore'], material_unknowns: ['Close rate'], most_useful_missing_fact: { question_id: 'capacity', why_it_matters: 'It decides whether the limit is the right one.' }, recommended_first_action: action(), alternatives_considered: [{ title: 'Outreach list', why_not_first: 'More enquiries would wait, not buy.' }], sequenced_actions: [action(), action({ title: 'Set a weekly capacity limit', evidence_ids: ['canDeliverMore'], asset: 'booking-process' })], resource_totals: { hours: 'about 5 hours', one_off_cost: '£0', recurring_cost: '£0' }, proposed_delivery: null, proposed_pricing: null, supported_scenarios: [{ label: 'Price up 10%', metric: 'revenue added over twelve months', value: '£3,100', unit: 'GBP', period: 'twelve months', assumption: 'demand held constant', mode: 'illustrative', calculator_id: 'calc:lever_price' }], success_measures: ['Acceptance on the next ten quotes'], review_conditions: ['Fewer than half of ten quotes accepted'], implementation_assets: [{ kind: 'offer-sheet', title: 'Offer sheet', text: 'For: households' }], optional_tma_brief: null });
const direction = (over = {}) => ({ id: 'b2b-admin-ops', name: 'Admin support', buyer: 'trades', problem: 'late invoices', first_offer: 'ten hours a week', route_to_customers: 'your partner and his two trade friends', reason_it_fits: 'you ran invoicing', hard_constraints: ['8 hours a week'], evidence_of_demand: 'people already ask you', biggest_unknown: 'price', strongest_reason_against: 'Nobody has paid you for it yet.', what_would_change_the_ranking: 'What three of them last paid for the same job.', smallest_useful_test: 'one paid block', evidence_ids: ['now'], ...over });
const goodStarter = (over = {}) => ({ advantage_summary: [{ point: 'You have cleared an invoicing backlog for a real firm.', evidence_ids: ['now'] }], ranked_shortlist: [{ id: 'b2b-admin-ops', title: 'Admin support', label: 'Strong fit', fit_reason: 'You have done the work and can reach the buyer.' }, { id: 'freelance-skill', title: 'Freelance bookkeeping', label: 'Promising', fit_reason: 'Same skill, no route to the buyer yet.' }], recommended: direction(), alternatives: [direction({ id: 'freelance-skill' })], recap: 'Admin support for trades you can already reach. Sell one paid block before anything else.', detail: 'The buyer is one your partner introduces; the offer is a block of hours, not a retainer, until the hours per block are known.', most_useful_missing_fact: null, first_offer: 'x', proposed_pricing: { amount: 'unknown', basis: 'set in the first three conversations', mode: 'requirements' }, validation_test: 'x', first_buyer_route: 'x', delivery_steps: ['a'], startup_costs: [], monthly_costs: [], tools_already_owned: [], essential_gaps: [], week_one_plan: ['a'], thirty_day_validation_plan: ['a'], conditional_ninety_day_direction: 'x', success_and_stop_criteria: { continue_if: 'a', stop_if: 'b' }, copyable_assets: [], implementation_prompt: null, support_or_community_profile: { kinds_of_people: [], why: 'x', introduction_message: 'x', next_action: 'x' }, optional_tma_brief: null, ...over });

(async () => {
  await test('nothing calls the host at load', async () => {
    const h = harness([]);
    assert.strictEqual(h.uses(), 0);
    assert.strictEqual(h.calls.length, 0);
    assert.strictEqual(h.M.model.available().status, 'unknown');
    assert.ok(h.M.model.available().host);
  });
  await test('the prompts are the brief’s text, verbatim, and the input puts data after the instruction', async () => {
    const h = harness([]);
    const P = h.M.model.PROMPTS;
    assert.ok(P.shared.startsWith("You are Mercer, TMA's business planning assistant."));
    assert.ok(/Only reference evidence IDs that exist in the supplied evidence set\./.test(P.shared));
    assert.ok(/Use no more than about 45 words of visible copy in total\./.test(P.insight));
    assert.ok(/Do not steer to TMA as the only way to execute\./.test(P.ownerPlan));
    assert.ok(/must not receive a plan that silently requires paid subscriptions or advertising\./.test(P.starterPlan));
    assert.ok(/flag it for the planner rather than\nmaking it sound more confident\./.test(P.editorial));
    /* Task 24: the compact instruction is the model's instruction text, verbatim, and it leads every call */
    assert.ok(P.compact.startsWith('Understand this person or business before recommending the next move.'));
    assert.ok(P.compact.endsWith('Be encouraging through specificity. Make the next step clear.'));
    ['Ask for facts they can know.', 'Do not ask them to forecast their own future.', 'Do not default to AI,\nsoftware, courses or digital products.', 'Keep revenue, profit,\npersonal income, customer counts and delivery capacity distinct.', 'Never invent fit probabilities,\nmarket demand, prices, earnings guarantees or capabilities.'].forEach((t) => assert.ok(P.compact.includes(t), `verbatim: ${t}`));
    const input = h.M.model.buildInput('ownerPlan', ctxOf(h.M));
    assert.ok(input.indexOf(P.compact) === 0, 'the compact instruction heads the call');
    assert.ok(input.indexOf(P.shared) > 0 && input.indexOf(P.ownerPlan) > 0 && input.indexOf('DATA:') > input.indexOf(P.ownerPlan));
    assert.ok(/"evidence"/.test(input) && /"calculator"/.test(input) && /Reply with only one JSON object/.test(input));
    assert.ok(input.length < 65536);
  });
  await test('validator: a good insight, a good owner plan and a good starter plan pass', async () => {
    const h = harness([]);
    const c = ctxOf(h.M);
    clean(h.M.model.validate('insight', goodInsight, c, { revisionNow: 7 }), 'a good insight');
    assert.ok(h.M.model.validate('insight', null, c, { revisionNow: 7 }).ok, 'null is a valid "no insight"');
    clean(h.M.model.validate('ownerPlan', goodPlan(), c, { revisionNow: 7 }), 'a good owner plan');
    clean(h.M.model.validate('starterPlan', goodStarter(), { ...c, route: 'starter' }, { revisionNow: 7 }), 'a good starter plan');
  });
  await test('the reveal is ranked in words: a percentage fit, a probability or an out-of-order label is rejected', async () => {
    const h = harness([]);
    const c = { ...ctxOf(h.M), route: 'starter' };
    const pct = h.M.model.validate('starterPlan', goodStarter({ ranked_shortlist: [{ id: 'b2b-admin-ops', title: 'Admin support', label: '82% fit', fit_reason: 'x' }] }), c, { revisionNow: 7 });
    assert.ok(!pct.ok && pct.errors.some((e) => e.code === 'label'), JSON.stringify(pct.errors));
    const prob = h.M.model.validate('starterPlan', goodStarter({ detail: 'There is a 70% chance of success in the first year.' }), c, { revisionNow: 7 });
    assert.ok(!prob.ok && prob.errors.some((e) => e.code === 'label'), JSON.stringify(prob.errors));
    const order = h.M.model.validate('starterPlan', goodStarter({ ranked_shortlist: [{ id: 'a', title: 'A', label: 'Promising', fit_reason: 'x' }, { id: 'b', title: 'B', label: 'Strong fit', fit_reason: 'x' }] }), c, { revisionNow: 7 });
    assert.ok(!order.ok && order.errors.some((e) => e.code === 'label' && /ranked below/.test(e.detail)));
    const noAdvantage = h.M.model.validate('starterPlan', goodStarter({ advantage_summary: [{ point: 'You are good at this.', evidence_ids: [] }] }), c, { revisionNow: 7 });
    assert.ok(!noAdvantage.ok && noAdvantage.errors.some((e) => e.code === 'evidence'), 'an advantage point must reference evidence');
  });
  await test('feasibility: a cost over budget, an action over the hours and a missing qualification are all rejected', async () => {
    const h = harness([]);
    const c = { ...ctxOf(h.M), constraints: { budget: 300, oneOffBudget: 0, hoursWeek: 4, missingQualifications: ['DBS check'] } };
    const overBudget = h.M.model.validate('ownerPlan', { ...goodPlan(), recommended_first_action: action({ one_off_cost: '£9,000' }) }, c, { revisionNow: 7 });
    assert.ok(!overBudget.ok && overBudget.errors.some((e) => e.code === 'budget'), JSON.stringify(overBudget.errors));
    const overHours = h.M.model.validate('ownerPlan', { ...goodPlan(), recommended_first_action: action({ time_required: 'about 12 hours' }) }, c, { revisionNow: 7 });
    assert.ok(!overHours.ok && overHours.errors.some((e) => e.code === 'hours'), JSON.stringify(overHours.errors));
    const noQual = h.M.model.validate('starterPlan', goodStarter({ delivery_steps: ['Run the first session with a DBS check in place.'] }), { ...c, route: 'starter' }, { revisionNow: 7 });
    assert.ok(!noQual.ok && noQual.errors.some((e) => e.code === 'qualification'), JSON.stringify(noQual.errors));
    /* naming the same gap as a gap is not a conflict */
    clean(h.M.model.validate('starterPlan', goodStarter({ essential_gaps: ['DBS check: not held; apply before the first session.'] }), { ...c, route: 'starter' }, { revisionNow: 7 }), 'a named gap is allowed');
    /* inside the constraints, it passes */
    clean(h.M.model.validate('ownerPlan', goodPlan(), c, { revisionNow: 7 }), 'a plan inside budget and hours');
  });
  await test('validator: a wrong number is rejected; a supplied number in another form is not', async () => {
    const h = harness([]);
    const c = ctxOf(h.M);
    const bad = h.M.model.validate('insight', { ...goodInsight, explanation: 'You are 91% full today.' }, c, { revisionNow: 7 });
    assert.ok(!bad.ok && bad.errors.some((e) => e.code === 'number' && /91/.test(e.detail)), JSON.stringify(bad.errors));
    const price = h.M.model.validate('ownerPlan', { ...goodPlan(), primary_finding: 'A 10% rise adds £2,500 over twelve months.' }, c, { revisionNow: 7 });
    assert.ok(!price.ok && price.errors.some((e) => e.code === 'number' && /2,500/.test(e.detail)));
    clean(h.M.model.validate('insight', { ...goodInsight, explanation: 'Revenue today is £9,000 and a rise adds £3,100; three steps.' }, c, { revisionNow: 7 }), 'supplied figures in another form');
    clean(h.M.model.validate('insight', { ...goodInsight, explanation: 'CPI is 3.1% on the year.' }, c, { revisionNow: 7 }), 'a source row’s own figure');
  });
  await test('validator: a fake evidence id, a stale revision, a new link, a citation and an over-long insight are rejected', async () => {
    const h = harness([]);
    const c = ctxOf(h.M);
    const fake = h.M.model.validate('insight', { ...goodInsight, evidence_ids: ['calc:utilisation', 'made-up'] }, c, { revisionNow: 7 });
    assert.ok(!fake.ok && fake.errors.some((e) => e.code === 'evidence' && e.detail === 'made-up'));
    const stale = h.M.model.validate('insight', goodInsight, c, { revisionNow: 8 });
    assert.ok(!stale.ok && stale.errors.some((e) => e.code === 'stale'));
    const link = h.M.model.validate('insight', { ...goodInsight, implication: 'See https://example.com/benchmark for the figure.' }, c, { revisionNow: 7 });
    assert.ok(!link.ok && link.errors.some((e) => e.code === 'source'));
    clean(h.M.model.validate('insight', { ...goodInsight, implication: 'Source: https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/august2026' }, c, { revisionNow: 7 }), 'a link the evidence set holds');
    const cite = h.M.model.validate('insight', { ...goodInsight, explanation: 'According to a recent survey most firms raise prices yearly.' }, c, { revisionNow: 7 });
    assert.ok(!cite.ok && cite.errors.some((e) => e.code === 'citation'));
    const long = h.M.model.validate('insight', { ...goodInsight, explanation: Array(40).fill('word').join(' ') }, c, { revisionNow: 7 });
    assert.ok(!long.ok && long.errors.some((e) => e.code === 'length'));
    const reg = h.M.model.validate('insight', { ...goodInsight, next_question_id: 'nonsense' }, c, { revisionNow: 7 });
    assert.ok(!reg.ok && reg.errors.some((e) => e.code === 'registry'));
    const schema = h.M.model.validate('ownerPlan', { ...goodPlan(), sequenced_actions: 'no' }, c, { revisionNow: 7 });
    assert.ok(!schema.ok && schema.errors.some((e) => e.code === 'schema'));
    const extra = h.M.model.validate('ownerPlan', { ...goodPlan(), bonus_field: 1 }, c, { revisionNow: 7 });
    assert.ok(!extra.ok && extra.errors.some((e) => e.code === 'schema' && /unexpected/.test(e.detail)));
  });
  await test('validator: an edit may not add or drop a figure', async () => {
    const h = harness([]);
    const c = { ...ctxOf(h.M), text: 'You are 83% full today. A 10% rise adds £3,100 over twelve months.' };
    clean(h.M.model.validate('editorial', { text: 'You are 83% full. A 10% price rise adds £3,100 over twelve months.', flags: [] }, c, { revisionNow: 7 }), 'an edit that keeps every figure');
    const added = h.M.model.validate('editorial', { text: 'You are 83% full. A 10% rise adds £3,100, about £260 a month.' }, c, { revisionNow: 7 });
    assert.ok(!added.ok && added.errors.some((e) => e.code === 'number'));
    const dropped = h.M.model.validate('editorial', { text: 'You are full. A rise adds £3,100.' }, c, { revisionNow: 7 });
    assert.ok(!dropped.ok && dropped.errors.some((e) => e.code === 'dropped'));
  });
  await test('ownerPlan: a good reply resolves ok, grants, dispatches mercer:model, and the insight is then allowed', async () => {
    const h = harness([goodPlan(), goodInsight]);
    const c = ctxOf(h.M);
    const before = await h.M.model.sectionInsight(c);
    assert.strictEqual(before.code, 'not_ready', 'no insight before a plan call is granted');
    assert.strictEqual(h.calls.length, 0);
    const r = await h.M.model.ownerPlan(c);
    assert.ok(r.ok, JSON.stringify(r));
    assert.strictEqual(r.value.primary_finding, goodPlan().primary_finding);
    assert.strictEqual(h.calls[0].opts.modelTier, 'complex');
    assert.strictEqual(h.calls[0].opts.cache, true);
    assert.ok(h.calls[0].opts.signal instanceof AbortSignal);
    assert.deepStrictEqual({ ...h.events[h.events.length - 1] }, { kind: 'ownerPlan', revision: 7, ok: true, code: null });
    assert.strictEqual(h.M.model.available().status, 'granted');
    const i = await h.M.model.sectionInsight(c);
    assert.ok(i.ok && i.value.headline === goodInsight.headline);
    assert.strictEqual(h.calls[1].opts.modelTier, 'default');
  });
  await test('a bad reply gets one bounded repair, then fails cleanly; a bad insight gets no repair', async () => {
    const h = harness([{ ...goodPlan(), primary_finding: 'You are 91% full.' }, { ...goodPlan(), primary_finding: 'You are 91% full.' }, { ...goodInsight, evidence_ids: ['nope'] }]);
    const c = ctxOf(h.M);
    const r = await h.M.model.ownerPlan(c);
    assert.ok(!r.ok && r.code === 'invalid' && r.errors.some((e) => e.code === 'number'));
    assert.strictEqual(h.calls.length, 2, 'one call and one repair, no loop');
    assert.ok(/previous reply was rejected/.test(h.calls[1].input));
    assert.strictEqual(h.events[h.events.length - 1].ok, false);
    const i = await h.M.model.sectionInsight(c);
    assert.ok(!i.ok && i.code === 'invalid');
    assert.strictEqual(h.calls.length, 3, 'an insight is never repaired');
  });
  await test('not_granted hides the feature for the view; rate_limited backs off without looping', async () => {
    const h = harness([{ __error: { code: 'not_granted', message: 'declined' } }, goodPlan()]);
    const c = ctxOf(h.M);
    const r = await h.M.model.ownerPlan(c);
    assert.strictEqual(r.code, 'not_granted');
    assert.strictEqual(h.M.model.available().status, 'hidden');
    const again = await h.M.model.ownerPlan(c);
    assert.strictEqual(again.code, 'hidden');
    assert.strictEqual(h.calls.length, 1, 'no second call after a decline');
    const g = harness([{ __error: { code: 'rate_limited', message: 'slow down' } }, goodPlan()]);
    const r2 = await g.M.model.ownerPlan(ctxOf(g.M));
    assert.strictEqual(r2.code, 'rate_limited');
    assert.ok(r2.retryAt > Date.now());
    const r3 = await g.M.model.ownerPlan(ctxOf(g.M));
    assert.strictEqual(r3.code, 'rate_limited', 'inside the back-off nothing is sent');
    assert.strictEqual(g.calls.length, 1);
  });
  await test('a reply for an older revision is discarded, and a newer call of the same kind cancels the older one', async () => {
    const h = harness([{ __value: goodPlan(), __delay: 30 }]);
    const c = ctxOf(h.M);
    const pending = h.M.model.ownerPlan(c);
    h.M.revision = 8; // the answers changed while the model worked
    const r = await pending;
    assert.strictEqual(r.code, 'stale');
    assert.strictEqual(h.events[h.events.length - 1].ok, false);
    const g = harness([{ __value: goodPlan(), __delay: 40 }, goodPlan()]);
    const first = g.M.model.ownerPlan(ctxOf(g.M));
    const second = g.M.model.ownerPlan(ctxOf(g.M));
    const [a, b] = await Promise.all([first, second]);
    assert.strictEqual(a.code, 'cancelled');
    assert.ok(b.ok);
    assert.ok(g.calls[0].opts.signal !== g.calls[1].opts.signal, 'one controller per call');
  });
  await test('no host: every call reports unavailable and nothing throws', async () => {
    const h = harness([]);
    delete h.M.model; // reload without claude
    const window = { Mercer: { state: {}, revision: 1 } };
    const ctx = vm.createContext({ window, document: { addEventListener() {}, dispatchEvent() { return true; } }, CustomEvent, console, AbortController, setTimeout, Date });
    ['starter.js', 'plan.js', 'model.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
    const M = window.Mercer;
    assert.strictEqual(M.model.available().status, 'absent');
    const r = await M.model.ownerPlan(ctxOf(M, { revision: 1 }));
    assert.strictEqual(r.code, 'unavailable');
  });
  await test('plan.js hands the model its context and layers a validated reply without touching the deterministic plan', async () => {
    const h = harness([]);
    const M = h.M;
    M.state = { route: 'owner', notSure: new Set(), na: new Set(), imported: [], sector: 'construction', win: 'income', goal: 13000, months: 9, now: 9000, price: 1800, repeatWork: 'once', buyer: 'consumer', canDeliverMore: 'no', breaksFirst: 'me', hours: 4, changeHours: 4 };
    const { plan } = M.plan.current();
    const c = M.plan.modelContext(plan);
    assert.strictEqual(c.revision, 7);
    assert.ok(c.evidence.length >= 3 && c.evidence.every((e) => e.id && e.state));
    assert.ok(Array.isArray(c.calculator.metrics));
    const layered = M.plan.withModel(plan, 'ownerPlan', goodPlan());
    assert.ok(layered.model.ownerPlan.value.primary_finding && layered.firstAction === plan.firstAction);
    assert.strictEqual(plan.model, undefined, 'the original plan is untouched');
  });
  console.log(`\n${n - failed} of ${n} passed${failed ? `, ${failed} FAILED` : ''}`);
  process.exit(failed ? 1 : 0);
})();
