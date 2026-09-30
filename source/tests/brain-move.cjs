/* brain, results round 1: D3 (the move, the why, the sequence, the start, the fit, held to their budgets at
   generation), the generic-action rejection of the brief's section 7, D11's rebuild from the same builder, D12 (an
   owner whose win is time gets actions ranked for fewer hours) and D13's prompt half (the writing instruction in
   SHARED, the stage fields validated before they are layered on). Synthetic fixtures; nothing here calls a provider.
   Plain node, no framework: `node tests/brain-move.cjs`. */
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
const owner = (over) => ({ route: 'owner', currency: 'GBP', notSure: new Set(), na: new Set(), imported: [], ...over });
const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
const EM_DASH = String.fromCharCode(8212);
const NO_DASH = (o) => assert.ok(!JSON.stringify(o).includes(EM_DASH), 'no em dash anywhere in the plan');

/* the joinery case of the owner line: £9,000 a month now, £3,200 a sale, £16,000 in 9 months, 12 enquiries and 4 wins
   a month (a third close), capacity 3 jobs a month, four hours a week to change anything */
const JOINERY = owner({ biz: 'Hartley Joinery', sector: 'construction', trade: 'Joinery', win: 'income', goal: 16000, months: 9, now: 9000, price: 3200, enquiries: 12, closeRate: 4 / 12, capacity: 3, canDeliverMore: 'no', breaksFirst: 'me', changeHours: 4, hours: 4, budget: 200, repeatWork: 'once', buyer: 'consumer', followUps: 1, responseTime: 'days', reviews: 'few', priceRaised: 'long' });
/* an owner whose win is time: the business runs through her, plenty of enquiries, room to grow */
const TIME = owner({ sector: 'beauty', win: 'time', now: 6000, price: 45, repeatWork: 'repeat', buyer: 'consumer', canDeliverMore: 'change', breaksFirst: 'me', hours: 45, changeHours: 4, delegation: 'none', holiday: 'stops', enquiries: 30, closeRate: 0.6, capacity: 120, access: ['contacts'], reviews: 'many' });

/* ---------------- the budgets: words and fits ---------------- */
test('M.plan.words counts words and M.plan.fits is the budget check', () => {
  const M = fresh();
  assert.strictEqual(M.plan.words('  Follow up  every open quote. '), 5);
  assert.strictEqual(M.plan.words(''), 0);
  assert.ok(M.plan.fits('one two three', 3) && !M.plan.fits('one two three four', 3));
  assert.ok(M.plan.BUDGET.headline === 12 && M.plan.BUDGET.support === 24 && M.plan.BUDGET.whyCard === 60 && M.plan.BUDGET.actionCard === 90);
});

/* ---------------- D3: the joinery move ---------------- */
test('joinery: the headline is an action of at most 12 words, the support at most 24, with the goal label from the answers', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  const mv = pl.move;
  assert.ok(mv && typeof mv.headline === 'string', 'move exists');
  assert.ok(M.plan.fits(mv.headline, 12), `headline within 12: "${mv.headline}" (${words(mv.headline)})`);
  assert.ok(/^[A-Z][a-z]+ /.test(mv.headline) && /\.$/.test(mv.headline), 'an action sentence, capitalised, one full stop');
  assert.ok(!M.plan.generic(mv.headline), 'the headline is not generic advice');
  assert.ok(M.plan.fits(mv.support, 24), `support within 24: "${mv.support}"`);
  assert.ok(/£16,000 a month in 9 months/.test(mv.goalLabel), `goal label carries the target: "${mv.goalLabel}"`);
  assert.ok(M.plan.fits(mv.goalLabel, 10));
  assert.strictEqual(typeof mv.hypothesis, 'boolean');
  assert.ok(['pricing', 'capacity', 'demand', 'conversion', 'control', 'margin', 'retention'].includes(mv.branchId), `branch is a tree limb: ${mv.branchId}`);
  assert.ok(Array.isArray(mv.evidenceIds) && mv.evidenceIds.length >= 1, 'the move cites evidence');
  assert.strictEqual(mv.actionId, pl.firstAction.id);
  NO_DASH(pl);
});

test('joinery: the constraint is delivery, so the move is on the price or the capacity limb, never lead generation, and the goal path is real', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  assert.ok(['offer', 'capacity'].includes(pl.firstAction.area), `first area ${pl.firstAction.area}`);
  assert.ok(!['channel', 'buyer'].includes(pl.firstAction.area));
  assert.ok(pl.goalPath && pl.goalPath.goal === 16000 && pl.goalPath.months === 9, 'the goal path reads the £16,000 in 9 months target');
});

test('joinery: the why is up to three facts of four-word labels and forty-word texts, one uncertainty, a mission line and a card under 65 words', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  const w = pl.why;
  assert.ok(w.facts.length >= 2 && w.facts.length <= 3, `two or three facts (${w.facts.length})`);
  w.facts.forEach((f) => {
    assert.ok(M.plan.fits(f.label, 4), `label within 4: "${f.label}"`);
    assert.ok(M.plan.fits(f.text, 40), `text within 40: "${f.text}"`);
    assert.ok(f.part === 'roots' || typeof f.part === 'string', 'a part on the tree');
    assert.ok(Array.isArray(f.evidenceIds) && f.evidenceIds.length === 1);
    assert.ok(f.answerId === null || typeof f.answerId === 'string');
    assert.ok(!/^[a-z]+$/.test(f.label), `a label is words, never an id: "${f.label}"`);
  });
  assert.ok(w.uncertainty && M.plan.fits(w.uncertainty.text, 40), `uncertainty within 40: "${w.uncertainty.text}"`);
  assert.ok(M.plan.fits(w.mission, 30) && /income/.test(w.mission), `mission within 30 and about their goal: "${w.mission}"`);
  assert.ok(M.plan.fits(w.card, 65), `card within 65: ${words(w.card)}`);
  assert.ok(pl.evidence.some((e) => e.id === w.facts[0].evidenceIds[0]), 'a fact resolves to the plan’s evidence set');
});

test('joinery: the Today card is under 90 words, has a task, at most three steps, labelled time and cost, done when, and a copyable asset with a verb', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  const t = pl.sequence.today;
  assert.ok(t && t.kind === 'today');
  assert.ok(M.plan.fits(t.task, 12), `task within 12: "${t.task}"`);
  assert.ok(!M.plan.generic(t.task));
  assert.ok(t.steps.length >= 1 && t.steps.length <= 3, 'at most three steps');
  assert.ok(/hour/.test(t.time) && t.estimated === true, `time is compact and labelled: ${t.time}`);
  assert.ok(String(t.cost) === t.costLabel && /Nothing to buy|£/.test(String(t.cost)), 'cost prints as its label');
  assert.ok(typeof t.doneWhen === 'string' && t.doneWhen.length > 8);
  assert.ok(t.asset && t.asset.kind && /^(Copy|Open) /.test(t.asset.label) && ['copy', 'open'].includes(t.asset.mode) && typeof t.asset.text === 'string' && t.asset.text.length > 40, `a working asset with a verb: ${t.asset && t.asset.label}`);
  assert.ok(!/Learn more/.test(JSON.stringify(pl.sequence)), 'no button is "Learn more"');
  assert.ok(M.plan.fits(t.card, 90), `today card within 90: ${words(t.card)}`);
  assert.ok(/Done when:/.test(t.card) && /Time:/.test(t.card) && /Cost:/.test(t.card));
  const wk = pl.sequence.week;
  assert.ok(wk.kind === 'week' && M.plan.fits(wk.task, 12) && M.plan.fits(wk.card, 90) && wk.steps.length <= 3);
  const rv = pl.sequence.review;
  assert.ok(rv.afterDays > 0 && rv.continueIf && rv.changeIf && rv.labelledAs === 'proposed test criteria', 'the review is an elapsed time with continue and change criteria labelled as proposed');
});

test('every action card carries the D3 additions, three steps at most, the full steps in details and a card under 90 words', () => {
  const M = fresh();
  [M.plan.build(JOINERY), M.plan.build(TIME), M.plan.example('owner'), M.plan.example('starter')].forEach((pl) => {
    pl.actions.forEach((k) => {
      assert.ok(M.plan.fits(k.task, 12), `${k.id} task within 12: "${k.task}"`);
      assert.ok(k.steps.length <= 3 && k.details.steps.length >= k.steps.length, `${k.id} steps capped, full list kept`);
      assert.ok(typeof k.time === 'string' && typeof k.costLabel === 'string' && typeof k.estimated === 'boolean');
      assert.ok(k.cost && typeof k.cost === 'object' && 'oneOff' in k.cost && String(k.cost) === k.costLabel, `${k.id} cost stays the object the totals read and prints as its label`);
      assert.ok(k.prerequisite === null || typeof k.prerequisite === 'string');
      assert.ok(k.asset === null || (k.asset.kind === k.assetKind && k.asset.label && k.asset.mode), `${k.id} asset is { kind, label, mode, text }`);
      assert.ok(k.details && Array.isArray(k.details.dependencies) && Array.isArray(k.details.evidence) && 'contingency' in k.details);
      assert.ok(M.plan.fits(k.card, 90), `${k.id} card within 90 (${words(k.card)})`);
      assert.ok(k.branchId, 'each action knows its limb');
    });
  });
});

test('alternatives are at most two, each with a trade-off under 30 words and a useable flag; the rest stays on considered', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  assert.ok(pl.alternatives.length <= 2);
  pl.alternatives.forEach((a) => { assert.ok(M.plan.fits(a.tradeoff, 30), `tradeoff within 30: "${a.tradeoff}"`); assert.strictEqual(typeof a.useable, 'boolean'); });
  assert.ok(Array.isArray(pl.considered) && pl.considered.length >= pl.alternatives.length);
});

test('the start stage: the fixed headline, a situation-specific sentence under 30 words with no price or promised outcome, and an honest CTA', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  assert.strictEqual(pl.start.headline, 'Put your plan into action.');
  assert.ok(M.plan.fits(pl.start.sentence, 30), `sentence within 30: "${pl.start.sentence}"`);
  assert.ok(/^TMA can /.test(pl.start.sentence) && !/£|guarantee|will double/.test(pl.start.sentence));
  assert.ok(['book', 'download'].includes(pl.start.cta));
  assert.ok(pl.start.cta === 'download' && pl.start.destination === null, 'no booking destination in a node harness, so the CTA is the download');
  assert.ok(/sends nothing/.test(pl.start.note));
});

test('fit: the pre-display check names hours, budget, skills, capacity, prior attempts and access, and the joinery move fits', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  const f = pl.fit;
  assert.strictEqual(f.ok, true);
  ['hours', 'budget', 'skills', 'capacity', 'prior', 'access'].forEach((k) => assert.ok(f[k] && 'ok' in f[k] && typeof f[k].text === 'string', `fit.${k}`));
  assert.ok(Array.isArray(f.notes) && f.notes.length === 0);
  assert.strictEqual(f.hours.ok, true, 'two hours in a fortnight fits four hours a week');
});

test('an unknown action id still gets a headline within budget, rewritten at a clause, never clipped mid-word', () => {
  const M = fresh();
  const long = 'Define the outreach list of forty small businesses in the county and send the first twenty messages by hand this week';
  const s = M.plan.shorten(long, 12);
  assert.ok(s && M.plan.fits(s, 12) && long.startsWith(s), `a clause-level cut: "${s}"`);
  assert.strictEqual(M.plan.shorten('one two three four five six seven eight nine ten eleven twelve thirteen', 12), null, 'no separator: the caller falls back rather than clipping');
});

/* ---------------- section 7: the generic-action rejection ---------------- */
test('generic actions are rejected unless the task, audience, channel, scope and output are all named', () => {
  const M = fresh();
  ['Improve your marketing', 'Explore AI', 'Build a brand', 'Do market research', 'Grow your business', 'Leverage social media', 'Raise awareness of your brand', ''].forEach((t) => assert.ok(M.plan.generic(t), `generic: "${t}"`));
  ['Follow up every open quote before chasing new enquiries.', 'Send the outreach message to five parent contacts by WhatsApp this week and log the replies', 'Raise the price on new work from next Monday.', 'Do market research by holding five conversations with local parents this week, written up'].forEach((t) => assert.ok(!M.plan.generic(t), `specific: "${t}"`));
  [M.plan.build(JOINERY), M.plan.build(TIME), M.plan.example('owner'), M.plan.example('starter')].forEach((pl) => {
    assert.ok(!M.plan.generic(pl.move.headline), pl.move.headline);
    pl.actions.forEach((k) => assert.ok(!M.plan.generic(k.task), `${k.id}: ${k.task}`));
    assert.ok(!M.plan.generic(pl.sequence.today.task) && !M.plan.generic(pl.sequence.week.task));
  });
});

/* ---------------- D12: the fewer-hours owner ---------------- */
test('an owner whose win is time gets actions ranked for fewer hours: no lead generation as a primary, the first action takes hours off her, and the mission says so', () => {
  const M = fresh();
  const pl = M.plan.build(TIME);
  assert.strictEqual(pl.signals.rankedFor, 'fewer hours');
  const primaries = pl.actions.filter((k) => k.status === 'primary');
  assert.ok(primaries.length >= 2);
  assert.ok(primaries.every((k) => !['channel', 'buyer'].includes(k.area)), `no lead-gen primary: ${primaries.map((k) => k.area).join(', ')}`);
  assert.ok(['delegation', 'process', 'capacity'].includes(pl.firstAction.area), `first area ${pl.firstAction.area}`);
  const waits = pl.actions.filter((k) => k.status === 'waits');
  assert.ok(waits.some((k) => /time back/.test(k.waitReason)), 'a lead-gen action waits with the time reason');
  assert.ok(/time/.test(pl.why.mission) && /hours/.test(pl.why.mission), pl.why.mission);
  assert.ok(/time|hours/i.test(pl.move.support) || /hand over|checklist|limit/i.test(pl.move.headline), pl.move.headline);
  /* the same business asking for income is ranked differently */
  const income = M.plan.build({ ...TIME, win: 'income' });
  assert.strictEqual(income.signals.rankedFor, null);
  assert.ok(!income.actions.some((k) => k.status === 'waits' && /time back/.test(k.waitReason)));
});

test('with a time goal, of two actions with the same evidence the cheaper in hours ranks first', () => {
  const M = fresh();
  const pl = M.plan.build(TIME);
  const primaries = pl.actions.filter((k) => k.status === 'primary');
  const first = primaries[0];
  assert.ok(first.effort.hours <= Math.max(...primaries.map((k) => k.effort.hours)), 'the first action is not the most expensive in hours');
  assert.ok(pl.sequence.today.time && /hour/.test(pl.sequence.today.time));
});

/* ---------------- D11: rebuild from the same builder ---------------- */
test('Use this direction on an owner alternative rebuilds from the same builder with that action first, and the move changes with it', () => {
  const M = fresh();
  const base = M.plan.build(JOINERY);
  const alt = base.alternatives.find((a) => a.useable);
  assert.ok(alt, 'a useable alternative exists');
  const used = M.plan.build({ ...JOINERY, preferredAction: alt.id });
  assert.strictEqual(used.firstAction.id, alt.id, 'the preferred action leads');
  assert.notStrictEqual(used.move.headline, base.move.headline, 'the headline follows the action');
  assert.strictEqual(used.signals.preferred, alt.id);
  const viaOpts = M.plan.build(JOINERY, { prefer: alt.id });
  assert.strictEqual(viaOpts.firstAction.id, alt.id, 'opts.prefer does the same');
  /* a waiting action cannot be promoted past its wait reason */
  const waiting = base.actions.find((k) => k.status === 'waits');
  if (waiting) assert.notStrictEqual(M.plan.build({ ...JOINERY, preferredAction: waiting.id }).firstAction.id, waiting.id);
});

test('a changed answer rebuilds the facts, the move and the download from the one plan, and M.plan.rebuild takes the same options', () => {
  const M = fresh(JOINERY);
  const a = M.plan.build(JOINERY);
  const b = M.plan.build({ ...JOINERY, priceRaised: 'recent', canDeliverMore: 'yes', breaksFirst: 'demand', enquiries: 3, closeRate: 0.5, capacity: 8 });
  assert.notStrictEqual(a.firstAction.id, b.firstAction.id, 'the answers moved the first action');
  assert.notDeepStrictEqual(a.why.facts.map((f) => f.label), b.why.facts.map((f) => f.label));
  assert.ok(b.move.headline && M.plan.fits(b.move.headline, 12));
  const r = M.plan.rebuild({ prefer: a.alternatives[0]?.id });
  assert.ok(r.plan && r.stale === false && r.plan.move);
});

/* ---------------- D13: the prompt half ---------------- */
test('the writing instruction of the brief is in SHARED verbatim and exported for M.planInstruction', () => {
  const M = fresh();
  const lines = ['Lead with the single most useful next move for this user.', 'Write an action headline, not a topic heading or motivational statement.', 'Keep alternatives secondary. Do not generate an unranked menu of suggestions.', 'When evidence is weak, give a precise discovery action and name the uncertainty.', 'Do not invent prices, results, sources, buyer access or existing capabilities.', 'Return the established structured plan schema, with valid evidence references.'];
  lines.forEach((l) => assert.ok(M.model.PROMPTS.shared.includes(l), l));
  assert.strictEqual(M.model.WRITING, M.plan.WRITING, 'plan.js and model.js carry the same text');
  assert.ok(M.model.buildInput('ownerPlan', { evidence: [], calculator: { metrics: [] } }).includes('"move"'), 'the plan call asks for the stage fields');
  assert.ok(!M.model.PROMPTS.shared.includes(EM_DASH));
});

test('a plan reply with the stage fields is validated for the budgets and the generic rule before it is layered on', () => {
  const M = fresh();
  const ctx = { revision: 3, evidence: [{ id: 'enquiries', state: 'user', value: 12 }, { id: 'capacity', state: 'user', value: 3 }], calculator: { metrics: [] }, registry: [], constraints: {} };
  const action = { title: 'Raise the price on new work', intended_result: 'r', why_now: 'w', steps: ['s'], owner_role: 'You', time_required: '2 hours', one_off_cost: 'unknown', recurring_cost: 'unknown', dependencies: [], evidence_ids: ['enquiries'], success_measure: 'm', review_or_stop_condition: 'c', asset: null };
  const good = () => ({ advantage_summary: [{ point: 'Booked out', evidence_ids: ['capacity'] }], goal_summary: 'g', primary_finding: 'Delivery is the constraint', recap: 'Raise the price on new work.', detail: 'd', supporting_evidence_ids: ['enquiries'], material_unknowns: [], recommended_first_action: action, alternatives_considered: [], sequenced_actions: [action], resource_totals: { hours: '2 hours', one_off_cost: 'unknown', recurring_cost: 'unknown' }, supported_scenarios: [], success_measures: ['m'], review_conditions: ['c'], implementation_assets: [],
    move: { goal_label: 'A bigger income', headline: 'Raise the price on new work from Monday.', support: 'You cannot deliver more, so each job has to earn more.', hypothesis: false },
    why: { facts: [{ label: '12 enquiries a month', text: 'You said 12 enquiries reach you a month.', evidence_ids: ['enquiries'] }], uncertainty: { label: 'Price resistance', text: 'Whether buyers push back is not known.' }, mission: 'You asked for a bigger income.', card: 'You said 12 enquiries reach you a month. Whether buyers push back is not known.' },
    sequence: { today: { task: 'Set the new price on the quote template', steps: ['Set it'], done_when: 'Written', card: 'Set the new price on the quote template. Done when: written.' }, week: { task: 'Send every new quote at the new price', steps: ['Send'], done_when: 'Sent', card: 'Send every quote at the new price.' }, review: { after_days: 14, continue_if: 'Half accepted', change_if: 'Fewer than half' } },
    start_sentence: 'TMA can review the new price against your last ten quotes before they go out.' });
  assert.ok(M.model.validate('ownerPlan', good(), ctx, { partial: true }).ok, 'the good reply passes');
  const overrun = good(); overrun.move.headline = 'Raise the price on all of the new work that comes in from next Monday morning onwards.';
  assert.ok(M.model.validate('ownerPlan', overrun, ctx, { partial: true }).errors.some((e) => e.code === 'length' && /move.headline/.test(e.detail)), 'a 15-word headline is a length error');
  const gen = good(); gen.move.headline = 'Improve your marketing.';
  assert.ok(M.model.validate('ownerPlan', gen, ctx, { partial: true }).errors.some((e) => e.code === 'generic'), 'a generic headline is rejected');
  const genAction = good(); genAction.recommended_first_action = { ...action, title: 'Explore AI' };
  assert.ok(M.model.validate('ownerPlan', genAction, ctx, { partial: true }).errors.some((e) => e.code === 'generic'), 'a generic action title is rejected');
  const promise = good(); promise.start_sentence = 'TMA will double your revenue for £500.';
  assert.ok(M.model.validate('ownerPlan', promise, ctx, { partial: true }).errors.some((e) => e.code === 'promise' || e.code === 'number'), 'a promised outcome or price in the start sentence is rejected');
  const fat = good(); fat.why.card = Array(70).fill('word').join(' ');
  assert.ok(M.model.validate('ownerPlan', fat, ctx, { partial: true }).errors.some((e) => e.code === 'length' && /why.card/.test(e.detail)));
  const steps = good(); steps.sequence.today.steps = ['a', 'b', 'c', 'd'];
  assert.ok(M.model.validate('ownerPlan', steps, ctx, { partial: true }).errors.some((e) => e.code === 'length' && /steps/.test(e.detail)));
});

test('withModel layers only the stage fields that pass the budgets and the generic rule; the deterministic plan is untouched', () => {
  const M = fresh();
  const pl = M.plan.build(JOINERY);
  const value = { move: { headline: 'Raise the price on new work from Monday.', support: 'You cannot deliver more, so each job has to earn more.' }, why: { card: 'Two facts and one unknown.', mission: Array(40).fill('word').join(' ') }, sequence: { today: { task: 'Improve your marketing', steps: [] }, week: { task: 'Send every new quote at the new price', steps: ['Send'] } }, start_sentence: 'TMA can review the price with you.' };
  const withIt = M.plan.withModel(pl, 'ownerPlan', value, pl.revision);
  const L = withIt.model.layered;
  assert.strictEqual(L.move.headline, 'Raise the price on new work from Monday.');
  assert.strictEqual(L.why.card, 'Two facts and one unknown.');
  assert.strictEqual(L.why.mission, null, 'a mission over 30 words is dropped, not clipped');
  assert.strictEqual(L.sequence.today, null, 'a generic today task is dropped');
  assert.ok(L.sequence.week && L.sequence.week.task);
  assert.ok(L.start && L.start.sentence);
  assert.strictEqual(withIt.move.headline, pl.move.headline, 'the deterministic move stands');
  assert.ok(!('layered' in (pl.model ?? {})), 'the original plan object is not mutated');
  const stale = M.plan.withModel(pl, 'ownerPlan', value, pl.revision + 1);
  assert.ok(stale.model.stale && !stale.model.layered, 'a reply for another revision layers nothing');
});

test('modelContext carries the budgets and the deterministic stages for the model to rewrite within them', () => {
  const M = fresh(JOINERY);
  const pl = M.plan.build(JOINERY);
  const ctx = M.plan.modelContext(pl);
  assert.deepStrictEqual(ctx.budgets, M.plan.BUDGET);
  assert.ok(ctx.plan.move && ctx.plan.move.headline === pl.move.headline && ctx.plan.sequence.today.task === pl.sequence.today.task && ctx.plan.fit);
});

/* ---------------- the sample plans ---------------- */
test('both example plans carry the four stages within their budgets and every figure is the sample’s own', () => {
  const M = fresh();
  ['owner', 'starter'].forEach((r) => {
    const pl = M.plan.example(r);
    assert.ok(pl.example === true && pl.move && pl.why && pl.sequence && pl.start && pl.fit);
    assert.ok(M.plan.fits(pl.move.headline, 12) && M.plan.fits(pl.move.support, 24) && M.plan.fits(pl.why.card, 65) && M.plan.fits(pl.sequence.today.card, 90), `${r} within budgets`);
    assert.ok(pl.sequence.today.asset && pl.sequence.today.asset.text, `${r} today has its asset`);
    NO_DASH(pl);
    assert.ok(!/\bNext\b/.test(JSON.stringify([pl.move, pl.sequence.today.asset.label, pl.start])), 'no "Next" in a control word');
  });
});

console.log(`\n${n - failed} of ${n} passed`);
process.exitCode = failed ? 1 : 0;
