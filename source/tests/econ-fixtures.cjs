/* econ-fixtures.cjs (Mercer 12, final round, owner: fixtures): Task 33's worked cases A to I, written from
   notes/FINAL-PACK.md. The brief's figures are the specification. Every expected number below is the one the
   brief states; a failing check means econ.js or its fixture pack must change, never this file.
   Plain node, no framework: `node tests/econ-fixtures.cjs`.

   These are SYNTHETIC calculation fixtures, not forecasts, market benchmarks or promises. GBP; one-month
   periods unless the case states otherwise; prices net of collected sales tax; demand and capacity are
   completed same-period jobs; comparisons at steady operation after any stated ramp. Financing, tax and
   owner withdrawals sit outside the operating result. Every specified cost is counted once.

   econ.js is loaded defensively: a missing file, a throw at load, a missing function or a missing fixture
   reports that check as "not implemented yet" naming what it wanted, instead of crashing the run.

   HOW THIS FINDS THE CASES. econ.fixtures() may return either
     an array of  { id: 'A'..'I', title, state, plan, goal, actions, variants: { name: { state, goal } } }
     or an object keyed by id:  { A: { title, inputs: { ... }, expected: { ... } }, ... }
   For each figure the file names the variant it wants and every alias it will accept, so a rename shows up
   as a clear message rather than a silent skip. The states, inputs and goals it asks for, by case:

     A  inputs.baseline | marketing/moreMarketing | capacity/moreCapacity | both   -> econ.scenario
        case.actions (the marketing and capacity actions)                         -> econ.compare
     B  inputs.discount/priceChange { price, newPrice, variableCost, units }       -> calc.volumeToHoldContribution
     C  the case state, plus the same state at a £500 minimum cash buffer          -> econ.scenario
     D  inputs.month (the recurring month) and inputs.prepayment                   -> calc.recurringMonth
     E  inputs.before | after, and inputs.demandUnits                              -> calc.deliveryCapacity
     F  inputs.state and inputs.goal                                               -> econ.requirements
     G  inputs.reach | reachUnknownOverlap | reconciliation | breakEven | cac | winRate
     H  inputs.steps                                                               -> calc.criticalPath
     I  inputs.demandPaths + inputs.capacity, and inputs.paths                     -> calc.expectedDelivered,
                                                                                      calc.summarisePaths */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
class CustomEvent { constructor(type, o) { this.type = type; this.detail = o && o.detail; } }

function loadEcon() {
  const file = path.join(root, 'econ.js');
  if (!fs.existsSync(file)) return { econ: null, M: null, why: 'not implemented yet: econ.js does not exist at the project root' };
  const M = { state: {}, revision: 1 };
  const window = { Mercer: M, matchMedia: () => ({ matches: false }), innerWidth: 1440, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout };
  const el = () => ({ setAttribute() {}, removeAttribute() {}, appendChild() {}, addEventListener() {}, style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} } });
  const document = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, createElement: el, createElementNS: el, querySelector: () => null, querySelectorAll: () => [], body: el() };
  const ctx = vm.createContext({
    window, document, CustomEvent, console, AbortController, Intl, URLSearchParams, setTimeout, clearTimeout,
    performance: { now: () => 0 }, requestAnimationFrame: (f) => f(0), cancelAnimationFrame() {},
    navigator: { platform: 'Win32', language: 'en-GB' }, location: { search: '', hash: '' },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  });
  try { vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: 'econ.js' }); }
  catch (e) { return { econ: null, M, why: `not implemented yet: econ.js failed to load (${e.message})` }; }
  if (!M.econ) return { econ: null, M, why: 'not implemented yet: econ.js loaded but did not define window.Mercer.econ' };
  return { econ: M.econ, M, why: '' };
}
const { econ, why } = loadEcon();

let n = 0, failed = 0;
const test = (name, fn) => { n += 1; try { fn(); console.log(`ok ${n} ${name}`); } catch (e) { failed += 1; console.log(`not ok ${n} ${name}\n   ${e.message}`); } };

const show = (v) => { if (v === undefined) return 'undefined'; if (v === null) return 'null'; if (typeof v === 'number' || typeof v === 'boolean') return String(v); try { const s = JSON.stringify(v); return s && s.length > 220 ? `${s.slice(0, 220)}...` : s; } catch (e) { return String(v); } };
const num = (v) => { if (typeof v === 'number') return v; if (v && typeof v === 'object' && typeof v.value === 'number') return v.value; return NaN; };
const gbp = (v) => (typeof v === 'number' ? `${v < 0 ? '-' : ''}£${Math.abs(v).toLocaleString('en-GB')}` : show(v));
const plain = (v) => (typeof v === 'number' ? String(v) : show(v));
function eq(actual, expected, label, fmt = plain) {
  const a = num(actual);
  if (!Number.isFinite(a) || Math.abs(a - expected) > 0.005) throw new Error(`${label}: expected ${fmt(expected)}, got ${Number.isFinite(a) ? fmt(a) : show(actual)}`);
}
function ne(actual, wrong, label, fmt = plain) {
  const a = num(actual);
  if (Number.isFinite(a) && Math.abs(a - wrong) <= 0.005) throw new Error(`${label}: got ${fmt(a)}, the wrong answer the brief names`);
}
function ok(cond, message) { if (!cond) throw new Error(message); }
const look = (obj, paths) => { for (const p of paths) { const v = String(p).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj); if (v !== undefined) return v; } return undefined; };
const keyLike = (obj, re) => { if (!obj || typeof obj !== 'object') return undefined; const k = Object.keys(obj).find((x) => re.test(x)); return k === undefined ? undefined : obj[k]; };
const clone = (v) => { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } };

const need = (name) => {
  if (!econ) throw new Error(why);
  if (typeof econ[name] !== 'function') throw new Error(`not implemented yet: econ.${name}() is missing`);
  return econ[name].bind(econ);
};
/* a worked-case helper, on econ.calc or econ itself */
const helper = (names) => {
  if (!econ) throw new Error(why);
  for (const home of [econ.calc, econ]) if (home) for (const nm of names) if (typeof home[nm] === 'function') return home[nm].bind(home);
  throw new Error(`not implemented yet: econ needs one of ${names.map((x) => `${x}()`).join(', ')}, on econ.calc or econ`);
};
const attempt = (fn, argSets, what) => {
  const errs = [];
  for (const args of argSets) { try { const out = fn.apply(null, args); if (out !== undefined && out !== null) return out; errs.push('returned nothing'); } catch (e) { errs.push(e.message); } }
  throw new Error(`${what}: no call shape worked (${errs.join('; ')})`);
};

/* ---- the fixture pack: an array of cases, or an object keyed by A to I ---- */
let CASES = null;
const cases = () => {
  if (CASES) return CASES;
  const raw = need('fixtures')();
  const map = new Map();
  const add = (id, c) => { if (c && typeof c === 'object') map.set(String(id).toUpperCase(), c); };
  if (Array.isArray(raw)) raw.forEach((c) => c && c.id && add(c.id, c));
  else if (raw && typeof raw === 'object') {
    const list = raw.cases || raw.fixtures || raw.list;
    if (Array.isArray(list)) list.forEach((c) => c && c.id && add(c.id, c));
    else Object.keys(raw).forEach((k) => { if (/^[A-I]$/i.test(k)) add(k, raw[k]); });
  }
  if (!map.size) throw new Error(`not implemented yet: econ.fixtures() published no cases A to I (it returned ${show(raw)})`);
  CASES = map;
  return map;
};
const useCase = (id) => { const c = cases().get(id); if (!c) throw new Error(`not implemented yet: econ.fixtures() has no case ${id} (it published ${[...cases().keys()].join(', ')})`); return Object.assign({}, c, { id }); };
const parts = (c) => [c.variants, c.scenarios, c.states, c.inputs].filter((x) => x && typeof x === 'object' && !Array.isArray(x));
const held = (c) => parts(c).reduce((a, o) => a.concat(Object.keys(o)), []);
const slot = (c, names) => { for (const nm of names) for (const o of parts(c)) if (o[nm] !== undefined) return o[nm]; return undefined; };
const asState = (v) => (v && typeof v === 'object' && !Array.isArray(v) && v.state !== undefined ? v.state : v);
const stateOf = (c, names, what) => {
  const v = slot(c, names);
  if (v !== undefined) return asState(v);
  if (names.includes('*')) {
    if (c.state !== undefined) return c.state;
    if (c.inputs && c.inputs.state !== undefined) return c.inputs.state;
    if (c.inputs && typeof c.inputs === 'object') return c.inputs;
  }
  throw new Error(`not implemented yet: fixture ${c.id} has no ${what || names[0]} state (wanted ${names.filter((x) => x !== '*').join(' or ')}; the case holds ${held(c).join(', ') || 'nothing'})`);
};
const dataOf = (c, names, what) => {
  const v = slot(c, names);
  if (v === undefined) throw new Error(`not implemented yet: fixture ${c.id} has no ${what || names[0]} inputs (wanted ${names.join(' or ')}; the case holds ${held(c).join(', ') || 'nothing'})`);
  return v;
};
const goalOf = (c, names) => {
  for (const nm of names) { const v = slot(c, [nm]); if (v && typeof v === 'object' && v.goal !== undefined) return v.goal; }
  if (c.goal !== undefined) return c.goal;
  if (c.inputs && c.inputs.goal !== undefined) return c.inputs.goal;
  throw new Error(`not implemented yet: fixture ${c.id} has no goal for econ.requirements (wanted case.goal or case.inputs.goal)`);
};
const scenarioOf = (c, names, what) => {
  const state = stateOf(c, names, what);
  const plan = slot(c, names) && slot(c, names).plan;
  const sc = need('scenario')(state, plan);
  if (!sc || !Array.isArray(sc.months) || !sc.months.length) throw new Error(`fixture ${c.id}/${what || names[0]}: econ.scenario returned no months (${show(sc)})`);
  return sc;
};
const month1 = (c, names, what) => scenarioOf(c, names, what).months[0];
/* the fixed cost of a period, however econ splits it between a standing cost and a step cost */
const period = (m) => num(m.fixedCost) + (Number.isFinite(num(m.stepCost)) ? num(m.stepCost) : 0);
/* the same state at a stated minimum cash buffer */
const withBuffer = (state, amount, label) => {
  const s = clone(state);
  const paths = [['econ', 'cash', 'minimumBuffer'], ['cash', 'minimumBuffer'], ['econ', 'cash', 'buffer'], ['econ', 'minimumBuffer'], ['minimumBuffer'], ['buffer']];
  for (const p of paths) {
    let o = s;
    let i = 0;
    for (; i < p.length - 1 && o && typeof o === 'object'; i += 1) o = o[p[i]];
    if (i === p.length - 1 && o && typeof o === 'object' && o[p[i]] !== undefined) { o[p[i]] = amount; return s; }
  }
  throw new Error(`not implemented yet: ${label} needs the same case at a £${amount} minimum cash buffer (a buffer500 variant, or a minimum buffer field on the state for this to set)`);
};

if (why) console.log(`# ${why} — every check below reports it rather than crashing\n`);

test('econ.fixtures() publishes the nine Task 33 cases, A to I', () => {
  const ids = [...cases().keys()];
  const missing = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].filter((x) => !ids.includes(x));
  ok(!missing.length, `missing case${missing.length > 1 ? 's' : ''} ${missing.join(', ')}; econ.fixtures() published ${ids.join(', ') || 'nothing'}`);
});

/* ---------------- Fixture A: marketing can reduce profit; combined effects are not additive ----------------
   £1,000 offer, £300 variable cost a job (£700 contribution), 20% conversion of qualified enquiries, base
   fixed cost £2,500, extra staff add £2,000 and take capacity from twelve jobs to twenty-four. Acquisition is
   separately resourced: it does not draw on delivery hours here. Excess same-period demand is declined. */

const A_BASE = ['baseline', 'base'];
const A_MKT = ['marketing', 'moreMarketing', 'marketingOnly'];
const A_CAP = ['capacity', 'moreCapacity', 'capacityOnly'];
const A_BOTH = ['both', 'combined'];

test('A baseline: 100 enquiries, demand 20, capacity 12, delivered 12, revenue £12,000, operating result £4,900', () => {
  const m = month1(useCase('A'), A_BASE, 'baseline');
  eq(m.demand, 20, 'A baseline demand (100 qualified enquiries at 20%)');
  eq(m.delivered, 12, 'A baseline delivered jobs (capacity 12 caps demand 20)');
  eq(m.revenue, 12000, 'A baseline revenue', gbp);
  eq(m.operatingResult, 4900, 'A baseline operating result', gbp);
});

test('A more marketing only: delivery stays 12 and the operating result falls to £3,900', () => {
  const m = month1(useCase('A'), A_MKT, 'more marketing');
  eq(m.demand, 40, 'A marketing-only demand (200 qualified enquiries at 20%)');
  eq(m.delivered, 12, 'A marketing-only delivered jobs (capacity is still 12)');
  eq(m.revenue, 12000, 'A marketing-only revenue', gbp);
  eq(m.acquisitionCost, 2000, 'A marketing-only marketing cost', gbp);
  eq(m.operatingResult, 3900, 'A marketing-only operating result', gbp);
});

test('A more capacity only: delivered 20, held at demand not at the new capacity of 24; operating result £8,500', () => {
  const m = month1(useCase('A'), A_CAP, 'more capacity');
  eq(m.delivered, 20, 'A capacity-only delivered jobs (demand 20 caps capacity 24)');
  ne(m.delivered, 24, 'A capacity-only delivered jobs');
  eq(m.revenue, 20000, 'A capacity-only revenue', gbp);
  eq(period(m), 4500, 'A capacity-only fixed cost, base £2,500 plus the £2,000 step, counted once', gbp);
  eq(m.operatingResult, 8500, 'A capacity-only operating result', gbp);
});

test('A both: delivered 24, revenue £24,000, operating result £10,300', () => {
  const m = month1(useCase('A'), A_BOTH, 'both');
  eq(m.demand, 40, 'A combined demand');
  eq(m.delivered, 24, 'A combined delivered jobs (capacity 24 caps demand 40)');
  eq(m.revenue, 24000, 'A combined revenue', gbp);
  eq(m.operatingResult, 10300, 'A combined operating result', gbp);
});

test('A both: every figure ties, each cost counted once (£16,800 contribution, £2,000 marketing, £4,500 fixed)', () => {
  const m = month1(useCase('A'), A_BOTH, 'both');
  eq(m.variableCost, 7200, 'A combined variable cost (24 jobs at £300)', gbp);
  eq(m.contribution, 16800, 'A combined contribution (24 jobs at £700)', gbp);
  eq(m.acquisitionCost, 2000, 'A combined marketing cost, spent once not £1,000 + £2,000', gbp);
  eq(period(m), 4500, 'A combined fixed cost, spent once not £2,500 + £4,500', gbp);
  eq(num(m.contribution) - num(m.acquisitionCost) - period(m), 10300, 'A combined operating result rebuilt from its parts', gbp);
});

test('A: the joint improvement is £5,400 a month while the isolated changes add to only £2,600', () => {
  const c = useCase('A');
  const base = num(month1(c, A_BASE, 'baseline').operatingResult);
  const mkt = num(month1(c, A_MKT, 'more marketing').operatingResult);
  const cap = num(month1(c, A_CAP, 'more capacity').operatingResult);
  const both = num(month1(c, A_BOTH, 'both').operatingResult);
  eq(both - base, 5400, 'A joint improvement over the baseline', gbp);
  eq((mkt - base) + (cap - base), 2600, 'A sum of the two isolated improvements', gbp);
  ok(Math.abs((both - base) - ((mkt - base) + (cap - base))) > 0.005, `A: the combined case must be recomputed, but the joint improvement ${gbp(both - base)} is exactly the sum of the isolated ones`);
});

test('A: econ.compare returns -£1,000 and +£3,600 for the isolated actions and declares their interaction', () => {
  const c = useCase('A');
  const actions = c.actions || (c.inputs && c.inputs.actions);
  ok(Array.isArray(actions) && actions.length >= 2, `not implemented yet: fixture A needs the marketing and capacity actions on the case (case.actions), in the shape econ.compare takes; got ${show(actions)}`);
  const rows = need('compare')(stateOf(c, A_BASE.concat('*'), 'baseline'), actions);
  ok(Array.isArray(rows) && rows.length >= 2, `econ.compare returned ${show(rows)}, expected a row for each action`);
  const got = rows.map((r) => num(r.incrementalOperatingResult)).sort((a, b) => a - b);
  eq(got[0], -1000, 'A incremental operating result of more marketing alone', gbp);
  eq(got[got.length - 1], 3600, 'A incremental operating result of more capacity alone', gbp);
  rows.forEach((r) => ok(Array.isArray(r.interactions) && r.interactions.length > 0, `A: the ${show(r.action)} row must declare its interaction with the other action, got ${show(r.interactions)}`));
});

/* ---------------- Fixture B: a 10% discount can require 50% more volume ---------------- */

const B_IN = ['discount', 'priceChange', 'volume', 'pricing'];

test('B: £100 price, £70 variable cost, 100 sales give £3,000 contribution', () => {
  const c = useCase('B');
  let inputs; try { inputs = dataOf(c, B_IN, 'the price change'); } catch (e) { inputs = c.inputs; }
  ok(inputs && typeof inputs === 'object', `not implemented yet: fixture B needs { price, newPrice, variableCost, units }, got ${show(inputs)}`);
  const f = helper(['volumeToHoldContribution', 'volumeToHold', 'discountVolume']);
  const out = attempt(f, [[inputs]], 'B volumeToHoldContribution');
  eq(look(out, ['contributionBefore', 'contribution']), 3000, 'B contribution at £100 on 100 sales', gbp);
});

test('B: at £90 the same £3,000 contribution needs 150 sales, never 110', () => {
  const c = useCase('B');
  let inputs; try { inputs = dataOf(c, B_IN, 'the price change'); } catch (e) { inputs = c.inputs; }
  const f = helper(['volumeToHoldContribution', 'volumeToHold', 'discountVolume']);
  const out = attempt(f, [[inputs]], 'B volumeToHoldContribution');
  eq(look(out, ['contributionPerUnitAfter', 'contributionPerUnit', 'unitContributionAfter']), 20, 'B contribution a sale after the 10% discount', gbp);
  eq(look(out, ['units', 'required', 'sales', 'requiredUnits']), 150, 'B sales required to hold £3,000 contribution after a 10% discount');
  ne(look(out, ['units', 'required', 'sales', 'requiredUnits']), 110, 'B sales required after a 10% discount');
});

/* ---------------- Fixture C: profit does not fund the first outlay automatically ----------------
   Opening cash £2,000; £6,000 of goods and £1,000 of operating costs are paid before any receipt;
   £10,000 of goods is delivered and paid for in the following month. */

const C_ZERO = ['zeroBuffer', 'noBuffer', 'default', '*'];
const C_500 = ['buffer500', 'withBuffer'];

test('C: the operating result is £3,000 even though nothing has been collected', () => {
  const m = month1(useCase('C'), C_ZERO, 'zero buffer');
  eq(m.revenue, 10000, 'C revenue earned in the month of delivery', gbp);
  eq(m.operatingResult, 3000, 'C operating result (£10,000 less £6,000 of goods and £1,000 of operating costs)', gbp);
});

test('C: month one collects nothing and closes at -£5,000; the scheduled cash low is -£5,000', () => {
  const sc = scenarioOf(useCase('C'), C_ZERO, 'zero buffer');
  const m = sc.months[0];
  eq(m.receipts, 0, 'C receipts in month one (customers pay the following month)', gbp);
  eq(m.payments, 7000, 'C payments in month one (£6,000 of goods and £1,000 of operating costs)', gbp);
  eq(m.closingCash, -5000, 'C closing cash in month one', gbp);
  eq(look(sc, ['totals.cashLow', 'cashLow', 'totals.lowestCash']), -5000, 'C lowest scheduled cash balance', gbp);
});

test('C: funding required is £5,000 at a zero minimum buffer', () => {
  const sc = scenarioOf(useCase('C'), C_ZERO, 'zero buffer');
  eq(look(sc, ['totals.fundingRequired', 'fundingRequired', 'totals.additionalFundingRequired']), 5000, 'C additional funding required at a zero buffer', gbp);
});

test('C: funding required is £5,500 with a £500 minimum buffer', () => {
  const c = useCase('C');
  let sc;
  try { sc = scenarioOf(c, C_500, 'the £500 buffer'); }
  catch (e) { sc = need('scenario')(withBuffer(stateOf(c, C_ZERO, 'zero buffer'), 500, 'fixture C')); }
  ok(sc && Array.isArray(sc.months), `fixture C at a £500 buffer: econ.scenario returned ${show(sc)}`);
  eq(look(sc, ['totals.fundingRequired', 'fundingRequired', 'totals.additionalFundingRequired']), 5500, 'C additional funding required with a £500 buffer', gbp);
  eq(look(sc, ['totals.cashLow', 'cashLow', 'totals.lowestCash']), -5000, 'C lowest scheduled cash balance, unchanged by the buffer', gbp);
});

test('C: later receipts do not erase the earlier gap, so the plan is not executable as scheduled', () => {
  const sc = scenarioOf(useCase('C'), C_ZERO, 'zero buffer');
  ok(sc.feasibility !== 'feasible_under_assumptions', `C feasibility: expected blocked or not_established while £5,000 is unfunded, got ${show(sc.feasibility)}`);
  ok(Array.isArray(sc.reasons) && sc.reasons.length > 0, 'C: the scenario must give the reason it is not executable');
  ok(!/\bloan\b|\boverdraft\b|\bTMA\b/i.test(JSON.stringify(sc.totals || {})), 'C: the gap must not be filled with a hypothetical loan');
});

/* ---------------- Fixture D: recurring revenue is not month-end customers multiplied blindly ----------------
   100 customers at £50; ten cancel before billing; twenty start at the end of the month and first pay next month. */

const D_MONTH = ['month', 'recurring', 'recurringMonth'];
const D_PRE = ['prepayment', 'upfront', 'prepaid'];

test('D: closing active customers are 110 and closing MRR is £5,500', () => {
  const inputs = dataOf(useCase('D'), D_MONTH, 'the recurring month');
  const f = helper(['recurringMonth', 'recurring', 'subscriptionMonth']);
  const out = attempt(f, [[inputs]], 'D recurringMonth');
  eq(look(out, ['closingCustomers', 'customers.closing', 'closingActiveCustomers']), 110, 'D closing active customers (100 - 10 + 20)');
  eq(look(out, ['closingMRR', 'closingMrr', 'mrr.closing', 'runRate']), 5500, 'D closing MRR', gbp);
});

test('D: the month earns £4,500 from the ninety full-month customers, not £5,500', () => {
  const inputs = dataOf(useCase('D'), D_MONTH, 'the recurring month');
  const f = helper(['recurringMonth', 'recurring', 'subscriptionMonth']);
  const out = attempt(f, [[inputs]], 'D recurringMonth');
  eq(look(out, ['billedCustomers', 'billed', 'fullMonthCustomers']), 90, 'D customers billed for the full month');
  eq(look(out, ['earnedRevenue', 'revenue', 'recognisedRevenue']), 4500, 'D revenue earned in the month', gbp);
  ne(look(out, ['earnedRevenue', 'revenue', 'recognisedRevenue']), 5500, 'D revenue earned in the month');
});

test('D: £1,200 upfront is £1,200 of cash and £100 a month of service revenue, never £1,200 of recurring revenue', () => {
  const c = useCase('D');
  const pre = dataOf(c, D_PRE, 'the prepayment');
  const f = helper(['prepayment', 'deferredRevenue', 'spreadPrepayment', 'recurringMonth']);
  const out = attempt(f, [[pre], [pre, 1]], 'D prepayment');
  const cash = look(out, ['cashMonth1', 'cash', 'receiptsMonth1', 'prepaymentCashMonth1', 'receipts']);
  const revenue = look(out, ['revenuePerMonth', 'monthlyRevenue', 'earnedRevenue', 'prepaymentRevenuePerMonth', 'serviceRevenue']);
  ok(cash !== undefined && revenue !== undefined, `not implemented yet: fixture D needs the prepayment spread (£1,200 of cash in month one, £100 a month of service revenue); the helper returned ${show(out)}`);
  eq(cash, 1200, 'D cash received at the start of the twelve-month service', gbp);
  eq(revenue, 100, 'D service revenue a month, and the recurring run rate', gbp);
  ne(revenue, 1200, 'D service revenue a month', gbp);
});

/* ---------------- Fixture E: founder time and automation cannot be spent twice ----------------
   Twenty working hours a week: four sales, three administration, three implementation, ten for delivery.
   Two hours a job. The figures below are the brief's weekly period. */

const E_BEFORE = ['before', 'base'];
const E_AFTER = ['after', 'adminSaved'];

test('E: ten delivery hours at two hours a job is five jobs of capacity, not ten', () => {
  const inputs = dataOf(useCase('E'), E_BEFORE, 'the founder week');
  const f = helper(['deliveryCapacity', 'capacity', 'resourceCapacity']);
  const out = attempt(f, [[inputs]], 'E deliveryCapacity');
  eq(look(out, ['availableForDelivery', 'deliveryHours', 'available', 'hours']), 10, 'E delivery hours available (20 less 4 sales, 3 admin, 3 implementation)');
  eq(look(out, ['capacityUnits', 'capacity', 'units', 'jobs']), 5, 'E delivery capacity in jobs a week');
  ne(look(out, ['capacityUnits', 'capacity', 'units', 'jobs']), 10, 'E delivery capacity in jobs a week');
});

test('E: saving two admin hours raises capacity to six only because the hours are redeployed to delivery', () => {
  const c = useCase('E');
  const f = helper(['deliveryCapacity', 'capacity', 'resourceCapacity']);
  const out = attempt(f, [[dataOf(c, E_AFTER, 'the founder week after the saving')]], 'E deliveryCapacity');
  eq(look(out, ['availableForDelivery', 'deliveryHours', 'available', 'hours']), 12, 'E delivery hours once two admin hours are redeployed');
  eq(look(out, ['capacityUnits', 'capacity', 'units', 'jobs']), 6, 'E capacity after redeployment');
  const before = attempt(f, [[dataOf(c, E_BEFORE, 'the founder week')]], 'E deliveryCapacity');
  const total = (x) => num(look(x, ['availableForDelivery', 'deliveryHours', 'available'])) + num(look(x, ['committedHours', 'committed', 'commitments']));
  ok(!Number.isFinite(total(before)) || Math.abs(total(before) - total(out)) <= 0.005, `E: the twenty working hours must only move between uses, they went from ${total(before)} to ${total(out)}`);
});

test('E: with four jobs of demand output stays four; freed time creates no revenue and no cash saving', () => {
  const c = useCase('E');
  const demand = look(c, ['inputs.demandUnits', 'demandUnits', 'inputs.demand', 'demand']);
  ok(Number.isFinite(num(demand)), `not implemented yet: fixture E needs the four jobs of demand (case.inputs.demandUnits), got ${show(demand)}`);
  eq(demand, 4, 'E demand in jobs');
  let delivered;
  try {
    const m = month1(c, ['demand4', 'demandFour', 'demandLimited'], 'four jobs of demand');
    delivered = m.delivered;
    eq(m.delivered, 4, 'E delivered jobs with demand at four and capacity at six');
  } catch (e) {
    const f = helper(['deliveredAtDemand', 'delivered', 'fulfilled']);
    const out = attempt(f, [[num(demand), 6], [{ demand: num(demand), capacity: 6 }]], 'E delivered at four jobs of demand');
    delivered = look(out, ['delivered', 'value', 'units']);
    eq(delivered, 4, 'E delivered jobs with demand at four and capacity at six');
  }
  ne(delivered, 6, 'E delivered jobs with demand at four');
});

/* ---------------- Fixture F: goal requirements expose an infeasible target ----------------
   Target operating result £3,000 a month, included period costs £1,500, contribution £250 a sale,
   a 20% qualified-opportunity win rate and capacity for fifteen sales. */

const fRequirements = () => { const c = useCase('F'); return need('requirements')(stateOf(c, ['state', '*'], 'the business'), goalOf(c, ['goal'])); };

test('F: the requirement is eighteen sales', () => {
  const r = fRequirements();
  ok(r && r.required, `econ.requirements returned ${show(r)} for fixture F`);
  eq(r.required.sales, 18, 'F sales required for a £3,000 operating result ((1,500 + 3,000) / 250)');
});

test('F: eighteen sales at a 20% win rate require ninety qualified opportunities', () => {
  eq(fRequirements().required.opportunities, 90, 'F qualified opportunities required');
});

test('F: fifteen sales of capacity leaves a gap of three sales', () => {
  const r = fRequirements();
  ok(Array.isArray(r.gaps) && r.gaps.length, `F: expected a gap of three sales of capacity, got gaps ${show(r.gaps)}`);
  const sizes = r.gaps.map((g) => { const direct = num(look(g, ['shortfall', 'gap', 'short', 'missing'])); return Number.isFinite(direct) ? direct : num(g.needed) - num(g.available); });
  ok(sizes.some((x) => Number.isFinite(x) && Math.abs(x - 3) <= 0.005), `F capacity gap: expected 3 sales, got ${show(sizes)}`);
});

test('F: this is reported as a requirement gap, never as £3,000 of forecast profit', () => {
  const r = fRequirements();
  ok(r.mode === 'requirements', `F mode: expected "requirements", got ${show(r.mode)}`);
  ok(r.verdict === 'requires_changes' || r.verdict === 'not_supported', `F verdict: expected requires_changes or not_supported, got ${show(r.verdict)}`);
  const forecast = look(r, ['forecast', 'forecastOperatingResult', 'expectedOperatingResult', 'projected']);
  ok(forecast === undefined, `F: a requirements answer must not carry a forecast operating result, got ${show(forecast)}`);
});

/* ---------------- Fixture G: channel overlap, reconciliation and undefined ratios ---------------- */

const reachOf = (c, names, what) => {
  const inputs = dataOf(c, names, what);
  const f = helper(['uniqueReach', 'reach', 'dedupeReach']);
  return attempt(f, [[inputs.channels, inputs.overlaps], [inputs], [inputs.channels, inputs.overlaps || []]], `G ${what}`);
};

test('G: 600 and 700 with 200 known overlaps is a unique reach of 1,100, not 1,300', () => {
  const out = reachOf(useCase('G'), ['reach', 'reachKnownOverlap', 'overlapKnown'], 'unique reach with a known overlap');
  const v = look(out, ['unique.value', 'unique', 'value', 'uniqueReach']);
  eq(v, 1100, 'G unique reach with a known overlap of 200');
  ne(v, 1300, 'G unique reach with a known overlap of 200');
});

test('G: an unknown overlap gives a bounded 700 to 1,300, never one confident figure', () => {
  const out = reachOf(useCase('G'), ['reachUnknownOverlap', 'overlapUnknown', 'reachUnknown'], 'unique reach with an unknown overlap');
  eq(look(out, ['lower', 'low', 'min', 'range.0']), 700, 'G lower bound of unique reach when the overlap is unknown');
  eq(look(out, ['upper', 'high', 'max', 'range.1']), 1300, 'G upper bound of unique reach when the overlap is unknown');
  const v = look(out, ['unique.value', 'value', 'uniqueReach']);
  ok(!Number.isFinite(num(v)), `G: an unknown overlap cannot produce one figure for unique reach, got ${show(v)}`);
  const state = look(out, ['unique.state', 'state']);
  ok(state === undefined || state !== 'observed', `G: an unknown overlap cannot be an observed reach, got state ${show(state)}`);
});

test('G: ten sales at £500 against £6,000 of reported revenue exposes a £1,000 reconciliation gap', () => {
  const c = useCase('G');
  const b = need('baseline')(stateOf(c, ['reconciliation', 'reconcile'], 'the reconciliation case'));
  ok(b && b.reconciliation, `not implemented yet: fixture G needs baseline.reconciliation, got ${show(b && b.reconciliation)}`);
  eq(b.reconciliation.built, 5000, 'G revenue rebuilt from ten sales at £500', gbp);
  eq(b.reconciliation.stated, 6000, 'G revenue the user stated', gbp);
  eq(b.reconciliation.gap, 1000, 'G reconciliation gap', gbp);
  ok(typeof b.reconciliation.note === 'string' && b.reconciliation.note.length > 0, 'G: the gap must carry a note saying it is unexplained, not a balancing multiplier');
  ok(!/1\.2|multiplier/i.test(b.reconciliation.note), `G: the gap must not be closed with a multiplier: ${show(b.reconciliation.note)}`);
});

test('G: £70 price against £70 variable cost has no volume-only break-even, and no huge number stands in for one', () => {
  const inputs = dataOf(useCase('G'), ['breakEven', 'breakeven', 'zeroContribution'], 'the break-even case');
  const f = helper(['breakEvenUnits', 'breakEven', 'breakeven']);
  const out = attempt(f, [[inputs]], 'G breakEvenUnits');
  const units = look(out, ['units', 'value', 'required', 'sales']);
  ok(!Number.isFinite(num(units)), `G break-even: expected no number at zero unit contribution, got ${show(units)}`);
  eq(look(out, ['contributionPerUnit', 'unitContribution']), 0, 'G unit contribution at a £70 price and a £70 variable cost', gbp);
  ok(/contribution/i.test(String(look(out, ['reason', 'note', 'why']) || '')), `G: the answer must name the zero unit contribution as the reason, got ${show(look(out, ['reason', 'note']))}`);
});

test('G: acquisition spend with zero acquired customers leaves CAC undefined, never £0', () => {
  const inputs = dataOf(useCase('G'), ['cac', 'acquisition', 'noCustomers'], 'the CAC case');
  const f = helper(['cac', 'costPerCustomer', 'acquisitionCost']);
  const out = attempt(f, [[inputs]], 'G cac');
  const v = look(out, ['value', 'cac', 'costPerCustomer']);
  ok(num(v) !== 0, 'G CAC: expected undefined with zero acquired customers, got £0');
  ok(!Number.isFinite(num(v)), `G CAC: expected no figure at all, got ${show(v)}`);
  const defined = look(out, ['defined', 'isDefined']);
  ok(defined === undefined || defined === false, `G CAC: expected defined:false, got ${show(defined)}`);
});

test('G: two wins from two enquiries is an observed rate that keeps its denominator, not a promise', () => {
  const inputs = dataOf(useCase('G'), ['winRate', 'rate', 'twoOfTwo'], 'the observed win rate');
  const f = helper(['rate', 'makeRate', 'asRate']);
  const out = attempt(f, [[inputs]], 'G rate');
  eq(out, 1, 'G observed win rate from two enquiries');
  eq(look(out, ['numerator', 'wins']), 2, 'G numerator of the observed win rate');
  eq(look(out, ['denominator', 'enquiries', 'sample']), 2, 'G denominator of the observed win rate');
  ok(look(out, ['period']) !== undefined, 'G: the rate must keep the period it was measured over');
  ok(out.state === 'observed', `G win rate state: expected "observed", got ${show(out.state)}`);
  ok(out.projectable === false, `G: a rate from two enquiries cannot be projected forward as 100%, got projectable ${show(out.projectable)}`);
});

/* ---------------- Fixture H: growth has a critical path ----------------
   Two weeks of setup, four weeks outreach to a win, two weeks to completed delivery, four weeks to payment. */

const hPath = () => {
  const c = useCase('H');
  const steps = dataOf(c, ['steps', 'path', 'criticalPath'], 'the dependency steps');
  const f = helper(['criticalPath', 'path', 'schedule']);
  return { out: attempt(f, [[steps], [{ steps }]], 'H criticalPath'), steps };
};
/* the payment step is the one that ends the path; completion is the last step before it */
const endWeeks = ({ out, steps }) => {
  const byId = look(out, ['byId', 'finishWeeks', 'weeks']) || {};
  const list = (Array.isArray(steps) ? steps : []).map((s) => ({ id: s.id, label: `${s.id} ${s.label || ''}`, week: num(look(out, [`byId.${s.id}`])) || num(look((look(out, ['steps']) || []).find((x) => x && x.id === s.id) || {}, ['finishWeek', 'week'])) }));
  const paying = list.filter((s) => /pay|receipt|cash|collect/i.test(s.label));
  const doing = list.filter((s) => !/pay|receipt|cash|collect/i.test(s.label));
  return {
    completion: doing.length ? Math.max(...doing.map((s) => s.week)) : num(look(out, ['completionWeek', 'earliestCompletionWeek'])),
    receipt: num(look(out, ['finishWeek', 'receiptWeek', 'earliestReceiptWeek'])) || (paying.length ? Math.max(...paying.map((s) => s.week)) : NaN),
    byId,
  };
};

test('H: the earliest completion is week eight', () => {
  const w = endWeeks(hPath());
  ok(Number.isFinite(w.completion), `not implemented yet: fixture H needs the week the work is completed (a completionWeek, or the finish week of the delivery step); got ${show(w.byId)}`);
  eq(w.completion, 8, 'H earliest completion, in weeks');
});

test('H: the earliest receipt is week twelve', () => {
  const w = endWeeks(hPath());
  ok(Number.isFinite(w.receipt), `not implemented yet: fixture H needs the week the money arrives (a receiptWeek or the path's finish week); got ${show(w.byId)}`);
  eq(w.receipt, 12, 'H earliest receipt, in weeks');
});

test('H: none of that cash lands in month one', () => {
  const w = endWeeks(hPath());
  ok(w.receipt > 4, `H: a receipt in week ${show(w.receipt)} would fall inside month one; the brief puts it in week 12`);
  const months = num(look(hPath().out, ['finishMonth', 'receiptMonth']));
  if (Number.isFinite(months)) ok(months > 1, `H: the receipt must not fall in month one, got month ${months}`);
});

/* ---------------- Fixture I: summarise after calculating the paths ---------------- */

test('I: demand of zero or twenty against capacity ten gives expected delivered work of five, not ten', () => {
  const c = useCase('I');
  const states = look(c, ['inputs.demandPaths', 'demandPaths', 'inputs.demand.states', 'demand.states', 'inputs.demand']);
  const capacity = look(c, ['inputs.capacity', 'capacity', 'inputs.demand.capacity', 'demand.capacity']);
  ok(states !== undefined && capacity !== undefined, `not implemented yet: fixture I needs the two demand states and the capacity (inputs.demandPaths and inputs.capacity), got ${show(states)} and ${show(capacity)}`);
  const f = helper(['expectedDelivered', 'expectedDeliveredWork', 'deliveredExpectation']);
  const out = attempt(f, [[states, capacity], [{ states, capacity, weights: [0.5, 0.5] }], [states, capacity, [0.5, 0.5]]], 'I expectedDelivered');
  const got = typeof out === 'number' ? out : look(out, ['expected', 'clipThenAverage', 'value']);
  eq(got, 5, 'I expected delivered work (each path clipped at capacity, then averaged)');
  ne(got, 10, 'I expected delivered work');
  const wrong = look(out, ['averageThenClip']);
  if (wrong !== undefined) eq(wrong, 10, 'I the figure clipping the average demand would wrongly give');
});

test('I: the median of the path totals is 100, not the 120 from summing monthly medians', () => {
  const c = useCase('I');
  const paths = look(c, ['inputs.paths', 'paths']);
  ok(Array.isArray(paths) && paths.length === 3, `not implemented yet: fixture I needs case.inputs.paths = [[0,100],[100,0],[60,60]], got ${show(paths)}`);
  const f = helper(['summarisePaths', 'summarizePaths', 'medianOfPathTotals', 'pathTotalMedian']);
  const out = attempt(f, [[paths], [paths, 0.5]], 'I summarisePaths');
  const got = typeof out === 'number' ? out : look(out, ['quantileOfPathTotals', 'medianOfPathTotals', 'median', 'p50']);
  eq(got, 100, 'I median of the three path totals (100, 100, 120)');
  ne(got, 120, 'I median of the path totals');
  const summed = look(out, ['sumOfMonthlyQuantiles', 'sumOfMonthlyMedians']);
  if (summed !== undefined) eq(summed, 120, 'I the sum of the monthly medians, which must never be reported as the total');
});

console.log(`\n${n - failed} of ${n} passed${failed ? `, ${failed} FAILED` : ''}`);
process.exit(failed ? 1 : 0);
