/* econ-invariants.cjs (Mercer 12, final round, owner: fixtures): the structural rules of Task 33's
   "Required invariants", enforced over every scenario and baseline the fixture pack can build, and over the
   worked cases that carry a rule on their own. Written from notes/FINAL-PACK.md; the brief is the
   specification and no check here is softened to match an implementation.
   Plain node, no framework: `node tests/econ-invariants.cjs`.

   The invariants, in the brief's order:
     stocks reconcile (customers, backlog, inventory, receivables/payables, cash)
     rates stay in their domains, counts do not go negative, a loss is still allowed
     unknown is never silently zero, unlimited funding or an assured customer
     every rate and volume keeps its unit, period, segment and provenance
     adding capacity cannot create sales beyond demand
     adding marketing with no extra fulfilled business lowers the operating result
     freed time does not become hours, cash and revenue at once
     combined actions spend shared time and cash once
     a goal value cannot change the baseline
     path totals come before quantiles
     a stale response cannot overwrite a newer revision, and one version serves UI, export and TMA

   It reads the same econ.fixtures() pack as econ-fixtures.cjs, in either container shape (see that file's
   header). Three things it wants that the pack does not have to carry for the other suite, each named in
   the failure message when it is missing:
     a variant of C with opening cash unknown  - so unknown cash cannot become £0 of funding required
     a variant that runs at a loss             - so nothing proves the operating result is not clamped at 0
     econ.isStale(result, currentRevision)     - so an older response cannot overwrite a newer answer */

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
const { econ, M, why } = loadEcon();

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
function ok(cond, message) { if (!cond) throw new Error(message); }
const look = (obj, paths) => { for (const p of paths) { const v = String(p).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj); if (v !== undefined) return v; } return undefined; };
const clone = (v) => { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } };

const need = (name) => {
  if (!econ) throw new Error(why);
  if (typeof econ[name] !== 'function') throw new Error(`not implemented yet: econ.${name}() is missing`);
  return econ[name].bind(econ);
};
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
const goalOf = (c) => {
  if (c.goal !== undefined) return c.goal;
  if (c.inputs && c.inputs.goal !== undefined) return c.inputs.goal;
  throw new Error(`not implemented yet: fixture ${c.id} has no goal for econ.requirements`);
};
const scenarioOf = (c, names, what) => {
  const sc = need('scenario')(stateOf(c, names, what));
  if (!sc || !Array.isArray(sc.months) || !sc.months.length) throw new Error(`fixture ${c.id}/${what || names[0]}: econ.scenario returned no months (${show(sc)})`);
  return sc;
};
const month1 = (c, names, what) => scenarioOf(c, names, what).months[0];
const period = (m) => num(m.fixedCost) + (Number.isFinite(num(m.stepCost)) ? num(m.stepCost) : 0);

/* every state in the pack that econ.scenario turns into a real schedule; a state that yields no revenue
   figure is not a scenario state and is left out rather than scanned as if it were one */
let SCENARIOS = null;
const everyScenario = () => {
  if (SCENARIOS) return SCENARIOS;
  const scenario = need('scenario');
  const out = [];
  cases().forEach((c, id) => {
    const seen = new Set();
    const tryOne = (label, st) => {
      if (!st || typeof st !== 'object' || Array.isArray(st) || seen.has(st)) return;
      seen.add(st);
      try {
        const sc = scenario(st);
        if (sc && Array.isArray(sc.months) && sc.months.length && Number.isFinite(num(sc.months[0].revenue))) out.push({ id: `${id}/${label}`, sc });
      } catch (e) { /* a state econ cannot build is reported by the fixtures suite, not here */ }
    };
    tryOne('default', c.state);
    parts(c).forEach((o) => Object.keys(o).forEach((k) => tryOne(k, asState(o[k]))));
    if (c.inputs && c.inputs.econ) tryOne('inputs', c.inputs);
  });
  if (!out.length) throw new Error('not implemented yet: no fixture state produced a scenario with a monthly schedule');
  SCENARIOS = out;
  return out;
};
let BASELINES = null;
const everyBaseline = () => {
  if (BASELINES) return BASELINES;
  const baseline = need('baseline');
  const out = [];
  cases().forEach((c, id) => {
    const seen = new Set();
    const tryOne = (label, st) => {
      if (!st || typeof st !== 'object' || Array.isArray(st) || seen.has(st)) return;
      seen.add(st);
      try {
        const b = baseline(st);
        if (b && b.values && Object.keys(b.values).length) out.push({ id: `${id}/${label}`, b });
      } catch (e) { /* reported by the fixtures suite */ }
    };
    tryOne('default', c.state);
    parts(c).forEach((o) => Object.keys(o).forEach((k) => tryOne(k, asState(o[k]))));
    if (c.inputs && c.inputs.econ) tryOne('inputs', c.inputs);
  });
  if (!out.length) throw new Error('not implemented yet: no fixture state produced a baseline with a values map');
  BASELINES = out;
  return out;
};
/* walk every month of every scenario; `seen` counts the months that actually carried the fields, so a rule
   cannot pass simply because nothing reports the stock it governs */
const eachMonth = (fn) => { let seen = 0; everyScenario().forEach(({ id, sc }) => sc.months.forEach((m, i) => { if (fn(m, `${id} month ${i + 1}`, sc, i) === true) seen += 1; })); return seen; };
/* every rate-like value a baseline publishes, wherever it keeps them */
const rateValues = (b) => {
  const out = [];
  Object.entries(b.values || {}).forEach(([k, v]) => { if (/rate|conversion|churn|retention|share|uptake|attach|win/i.test(k)) out.push([k, v]); });
  [['winRate', b.winRate], ['closeRate', b.closeRate]].forEach(([k, v]) => { if (v && typeof v === 'object') out.push([k, v]); });
  Object.entries(b.rates || {}).forEach(([k, v]) => out.push([k, v]));
  return out;
};

const A_BASE = ['baseline', 'base'];
const A_MKT = ['marketing', 'moreMarketing', 'marketingOnly'];
const A_CAP = ['capacity', 'moreCapacity', 'capacityOnly'];
const A_BOTH = ['both', 'combined'];

if (why) console.log(`# ${why} — every check below reports it rather than crashing\n`);

/* ---------------- Stocks reconcile ---------------- */

test('cash reconciles: closing = opening + receipts + financing - payments, every month', () => {
  let carried = null;
  let last = '';
  const seen = eachMonth((m, where, sc, i) => {
    if (!Number.isFinite(num(m.closingCash))) return false;
    if (last !== where.split(' month ')[0]) { carried = null; last = where.split(' month ')[0]; }
    const open = i === 0 ? num(look(sc, ['openingCash', 'cash.opening', 'totals.openingCash', 'scope.openingCash'])) : carried;
    carried = num(m.closingCash);
    if (!Number.isFinite(open)) return false;
    const fin = Number.isFinite(num(m.financing)) ? num(m.financing) : 0;
    const want = open + num(m.receipts) + fin - num(m.payments);
    if (!Number.isFinite(want)) throw new Error(`${where}: the cash identity has a missing term (receipts ${show(m.receipts)}, payments ${show(m.payments)})`);
    if (Math.abs(want - num(m.closingCash)) > 0.005) throw new Error(`${where} closing cash: expected ${gbp(want)} from opening ${gbp(open)} + receipts ${gbp(num(m.receipts))} - payments ${gbp(num(m.payments))}, got ${gbp(num(m.closingCash))}`);
    return true;
  });
  ok(seen > 0, 'not implemented yet: no scenario month reported a cash schedule (opening cash, receipts, payments, closing cash)');
});

test('the customer base reconciles: closing = opening + starts + reactivations - cancellations', () => {
  const inputs = dataOf(useCase('D'), ['month', 'recurring', 'recurringMonth'], 'the recurring month');
  const out = attempt(helper(['recurringMonth', 'recurring', 'subscriptionMonth']), [[inputs]], 'D recurringMonth');
  const open = num(look(inputs, ['openingCustomers', 'opening']));
  const starts = num(look(inputs, ['starts', 'newCustomers'])) || 0;
  const back = num(look(inputs, ['reactivations'])) || 0;
  const gone = num(look(inputs, ['cancellations', 'churned'])) || 0;
  const closing = look(out, ['closingCustomers', 'customers.closing']);
  ok(Number.isFinite(open), `not implemented yet: the recurring case must state its opening customer count, got ${show(inputs)}`);
  eq(closing, open + starts + back - gone, `D closing customers from opening ${open} + starts ${starts} + reactivations ${back} - cancellations ${gone}`);
  eq(closing, 110, 'D closing active customers');
  eachMonth((m, where) => {
    const c2 = look(m, ['closingCustomers', 'customers.closing', 'recurring.closingCustomers']);
    if (c2 === undefined || c2 === null) return false;
    const o2 = num(look(m, ['openingCustomers', 'customers.opening', 'recurring.openingCustomers']));
    if (!Number.isFinite(o2)) return false;
    const want = o2 + (num(look(m, ['starts', 'customers.starts'])) || 0) + (num(look(m, ['reactivations'])) || 0) - (num(look(m, ['cancellations', 'churned'])) || 0);
    if (Math.abs(want - num(c2)) > 0.005) throw new Error(`${where} closing customers: expected ${want}, got ${num(c2)}`);
    return true;
  });
});

test('orders reconcile: demand becomes delivered, declined, lost or backlog, and none of it vanishes', () => {
  const seen = eachMonth((m, where) => {
    if (!Number.isFinite(num(m.demand)) || !Number.isFinite(num(m.delivered))) return false;
    const opening = num(look(m, ['openingBacklog', 'backlog.opening'])) || 0;
    const closing = Number.isFinite(num(m.backlog)) ? num(m.backlog) : num(look(m, ['closingBacklog', 'backlog.closing']));
    if (!Number.isFinite(closing)) return false;
    ok(closing >= 0, `${where} closing backlog: expected zero or more, got ${closing}`);
    const declined = num(look(m, ['declined', 'cancelledOrders', 'backlog.declined'])) || 0;
    const lost = num(look(m, ['lost', 'lostSales'])) || 0;
    /* what arrives in the period is the demand; where a module reports accepted orders instead, that is
       what it took on, and the declined and lost are already outside it */
    const accepted = num(look(m, ['acceptedOrders', 'accepted', 'backlog.accepted']));
    const arriving = Number.isFinite(num(m.demand)) ? num(m.demand) : accepted + declined + lost;
    const want = opening + arriving - num(m.delivered) - declined - lost;
    if (Math.abs(want - closing) > 0.005) throw new Error(`${where}: demand ${num(m.demand)} and an opening backlog of ${opening} must end as delivered ${num(m.delivered)}, declined ${declined}, lost ${lost} and a closing backlog of ${want}, but the closing backlog is ${closing}`);
    return true;
  });
  ok(seen > 0, 'not implemented yet: no scenario month reported demand, delivered work and a backlog together');
});

test('each month rebuilds from its parts: revenue - variable cost = contribution, less acquisition and fixed = operating result', () => {
  const seen = eachMonth((m, where) => {
    if (!Number.isFinite(num(m.operatingResult))) return false;
    if (Number.isFinite(num(m.variableCost)) && Number.isFinite(num(m.contribution))) {
      const want = num(m.revenue) - num(m.variableCost);
      if (Math.abs(want - num(m.contribution)) > 0.005) throw new Error(`${where} contribution: expected ${gbp(want)} from revenue ${gbp(num(m.revenue))} less variable cost ${gbp(num(m.variableCost))}, got ${gbp(num(m.contribution))}`);
    }
    const acq = Number.isFinite(num(m.acquisitionCost)) ? num(m.acquisitionCost) : 0;
    const want = num(m.contribution) - acq - period(m);
    if (!Number.isFinite(want)) return false;
    if (Math.abs(want - num(m.operatingResult)) > 0.005) throw new Error(`${where} operating result: expected ${gbp(want)} from contribution ${gbp(num(m.contribution))} less acquisition ${gbp(acq)} and fixed ${gbp(period(m))}, got ${gbp(num(m.operatingResult))}`);
    return true;
  });
  ok(seen > 0, 'not implemented yet: no scenario month reported an operating result to rebuild');
});

test('the totals are the months: revenue and operating result sum, and the cash low is the lowest closing balance', () => {
  let seen = 0;
  everyScenario().forEach(({ id, sc }) => {
    if (!sc.totals) return;
    seen += 1;
    ['revenue', 'contribution', 'operatingResult'].forEach((k) => {
      if (!Number.isFinite(num(sc.totals[k])) || sc.months.some((m) => !Number.isFinite(num(m[k])))) return;
      const want = sc.months.reduce((t, m) => t + num(m[k]), 0);
      if (Math.abs(want - num(sc.totals[k])) > 0.005) throw new Error(`${id} totals.${k}: expected ${gbp(want)} summed over ${sc.months.length} month(s), got ${gbp(num(sc.totals[k]))}`);
    });
    const lows = sc.months.map((m) => num(m.closingCash)).filter(Number.isFinite);
    if (lows.length && Number.isFinite(num(sc.totals.cashLow))) {
      const want = Math.min(...lows);
      if (Math.abs(want - num(sc.totals.cashLow)) > 0.005) throw new Error(`${id} totals.cashLow: expected ${gbp(want)}, the lowest scheduled closing balance, got ${gbp(num(sc.totals.cashLow))}`);
    }
  });
  ok(seen > 0, 'not implemented yet: no scenario carried a totals block');
});

/* ---------------- Rates and counts stay in their domains ---------------- */

test('every rate stays in its domain, and a rate above 1 declares that it is a percentage', () => {
  let seen = 0;
  everyBaseline().forEach(({ id, b }) => {
    rateValues(b).forEach(([k, v]) => {
      const x = num(v);
      if (!Number.isFinite(x)) return;
      seen += 1;
      ok(x >= 0, `${id} ${k}: a rate cannot be negative, got ${x}`);
      const pct = /%|percent/i.test(String((v && (v.unit || v.basis)) || ''));
      ok(x <= (pct ? 100 : 1), `${id} ${k}: expected a rate within 0 to 1, got ${x} with no percentage unit declared`);
    });
  });
  ok(seen > 0, 'not implemented yet: no baseline published a rate (a win rate, conversion or churn) to check the domain of');
});

test('counts never go negative: customers, demand, delivered, capacity and resources', () => {
  const seen = eachMonth((m, where) => {
    let any = false;
    ['demand', 'delivered', 'capacity', 'backlog', 'closingCustomers', 'openingCustomers'].forEach((k) => {
      const x = num(m[k]);
      if (!Number.isFinite(x)) return;
      any = true;
      ok(x >= 0, `${where} ${k}: expected zero or more, got ${x}`);
    });
    Object.entries(m.resources || {}).forEach(([k, r]) => {
      any = true;
      ok(!Number.isFinite(num(r.available)) || num(r.available) >= 0, `${where} resource ${k}: available cannot be negative, got ${show(r.available)}`);
      ok(!Number.isFinite(num(r.needed)) || num(r.needed) >= 0, `${where} resource ${k}: needed cannot be negative, got ${show(r.needed)}`);
    });
    return any;
  });
  ok(seen > 0, 'not implemented yet: no scenario month reported demand, delivery or resource counts');
});

test('a loss-making month stays negative, never clamped to zero', () => {
  let losses = 0;
  eachMonth((m, where) => {
    const acq = Number.isFinite(num(m.acquisitionCost)) ? num(m.acquisitionCost) : 0;
    const rebuilt = num(m.contribution) - acq - period(m);
    if (!Number.isFinite(rebuilt) || rebuilt >= 0) return false;
    losses += 1;
    if (num(m.operatingResult) !== 0 && Math.abs(num(m.operatingResult) - rebuilt) <= 0.005) return true;
    throw new Error(`${where}: the month runs at ${gbp(rebuilt)} but reports an operating result of ${gbp(num(m.operatingResult))}`);
  });
  ok(losses > 0, 'not implemented yet: no fixture state runs at a loss, so nothing proves the operating result is not clamped at zero; add a loss-making variant');
});

/* ---------------- Unknown is never zero ---------------- */

test('no value is both unknown and zero; an unknown value carries no figure at all', () => {
  let seen = 0;
  everyBaseline().forEach(({ id, b }) => {
    Object.entries(b.values || {}).forEach(([k, v]) => {
      if (!v || v.state !== 'unknown') return;
      seen += 1;
      ok(v.value !== 0, `${id} ${k}: unknown was written as 0`);
      ok(!Number.isFinite(num(v)), `${id} ${k}: an unknown value must carry no figure, got ${show(v.value)}`);
    });
  });
  ok(seen > 0, 'not implemented yet: no baseline published an unknown value (fixture G’s CAC with no acquired customers is one)');
});

test('unknown opening cash is not read as zero funding required or as unlimited funding', () => {
  const c = useCase('C');
  let state;
  try { state = stateOf(c, ['cashUnknown', 'unknownCash'], 'the unknown-cash variant'); }
  catch (e) {
    state = clone(stateOf(c, ['zeroBuffer', 'noBuffer', 'default', '*'], 'zero buffer'));
    const cash = look(state, ['econ.cash', 'cash']);
    ok(cash && typeof cash === 'object' && cash.opening !== undefined, `not implemented yet: fixture C needs a variant with opening cash unknown (case.variants.cashUnknown); the case state holds ${show(Object.keys(state || {}))}`);
    cash.opening = null;
  }
  const sc = need('scenario')(state);
  const funding = look(sc, ['totals.fundingRequired', 'fundingRequired']);
  ok(num(funding) !== 0, 'C with unknown opening cash: funding required was reported as £0');
  ok(!Number.isFinite(num(funding)), `C with unknown opening cash: expected unknown, got ${show(funding)}`);
  ok(sc.feasibility !== 'feasible_under_assumptions', `C with unknown opening cash: cash feasibility is incomplete, expected blocked or not_established, got ${show(sc.feasibility)}`);
});

test('every published value declares its state as observed, estimated or unknown, with a basis where it is known', () => {
  let seen = 0;
  everyBaseline().forEach(({ id, b }) => {
    Object.entries(b.values || {}).forEach(([k, v]) => {
      seen += 1;
      ok(v && ['observed', 'estimated', 'unknown'].includes(v.state), `${id} ${k}: expected a state of observed, estimated or unknown, got ${show(v && v.state)}`);
      if (v.state !== 'unknown') ok(typeof v.basis === 'string' && v.basis.length > 0, `${id} ${k}: a known value must carry its basis, got ${show(v.basis)}`);
    });
  });
  ok(seen > 0, 'not implemented yet: no baseline published a values map');
});

/* ---------------- Units, periods and provenance ---------------- */

test('every baseline states its scope, currency, period and unit, and every scenario its units and currency', () => {
  everyBaseline().forEach(({ id, b }) => {
    ['scope', 'currency', 'period', 'unit'].forEach((k) => ok(b[k] !== undefined && b[k] !== null && b[k] !== '', `${id} baseline.${k} is ${show(b[k])}: a figure without its scope, currency, period or unit cannot be compared`));
  });
  everyScenario().forEach(({ id, sc }) => {
    ['units', 'currency', 'scope'].forEach((k) => ok(sc[k] !== undefined && sc[k] !== null && sc[k] !== '', `${id} scenario.${k} is ${show(sc[k])}`));
  });
});

test('a rate carries the period and denominator it was measured over, so no monthly figure is read as annual', () => {
  let seen = 0;
  everyBaseline().forEach(({ id, b }) => {
    rateValues(b).forEach(([k, v]) => {
      if (!v || v.state === 'unknown') return;
      seen += 1;
      const stated = v.period || v.per || '';
      ok(stated || /month|week|year|quarter|per\s/i.test(String(v.basis || '')), `${id} ${k}: no period on the rate and none in its basis ${show(v.basis)}`);
      if (v.denominator !== undefined) ok(Number.isFinite(num(v.denominator)) && num(v.denominator) > 0, `${id} ${k}: a rate keeps a positive denominator, got ${show(v.denominator)}`);
    });
  });
  ok(seen > 0, 'not implemented yet: no baseline published a rate to check the period of');
});

test('closing MRR is a run rate: the month earns £4,500, never the £5,500 run rate', () => {
  const inputs = dataOf(useCase('D'), ['month', 'recurring', 'recurringMonth'], 'the recurring month');
  const out = attempt(helper(['recurringMonth', 'recurring', 'subscriptionMonth']), [[inputs]], 'D recurringMonth');
  const mrr = look(out, ['closingMRR', 'closingMrr', 'mrr.closing', 'runRate']);
  const earned = look(out, ['earnedRevenue', 'revenue', 'recognisedRevenue']);
  eq(mrr, 5500, 'D closing MRR', gbp);
  eq(earned, 4500, 'D revenue earned in the month', gbp);
  ok(Math.abs(num(earned) - num(mrr)) > 0.005, `D: the month's earned revenue ${gbp(num(earned))} is the closing run rate; a run rate is not recognised revenue`);
});

/* ---------------- Capacity, demand and marketing ---------------- */

test('delivered work never exceeds demand plus the opening backlog, in any month of any scenario', () => {
  const seen = eachMonth((m, where) => {
    if (!Number.isFinite(num(m.delivered)) || !Number.isFinite(num(m.demand))) return false;
    const carried = num(look(m, ['openingBacklog', 'backlog.opening'])) || 0;
    ok(num(m.delivered) <= num(m.demand) + carried + 0.005, `${where}: delivered ${num(m.delivered)} against demand ${num(m.demand)} and a carried backlog of ${carried}; capacity cannot create sales`);
    return true;
  });
  ok(seen > 0, 'not implemented yet: no scenario month reported both demand and delivered work');
});

test('adding capacity alone leaves delivery at demand: twenty jobs, not the twenty-four now available', () => {
  const m = month1(useCase('A'), A_CAP, 'more capacity');
  eq(m.demand, 20, 'A capacity-only demand');
  eq(m.delivered, 20, 'A capacity-only delivered jobs, held at demand');
  eq(m.revenue, 20000, 'A capacity-only revenue', gbp);
});

test('adding marketing with no extra fulfilled business lowers the operating result by exactly the extra spend', () => {
  const c = useCase('A');
  const base = month1(c, A_BASE, 'baseline');
  const mkt = month1(c, A_MKT, 'more marketing');
  eq(mkt.delivered, num(base.delivered), 'A marketing-only delivered jobs, unchanged by the extra spend');
  const extra = num(mkt.acquisitionCost) - num(base.acquisitionCost);
  eq(extra, 1000, 'A extra marketing spend', gbp);
  const drop = num(base.operatingResult) - num(mkt.operatingResult);
  ok(drop > 0, `A: more marketing with no extra fulfilled business must lower the operating result, it moved by ${gbp(-drop)}`);
  eq(drop, extra, 'A fall in the operating result from the extra marketing spend', gbp);
});

/* ---------------- Freed time, and shared time and cash ---------------- */

test('freed time moves between uses rather than being created: twenty working hours before and after', () => {
  const c = useCase('E');
  const f = helper(['deliveryCapacity', 'capacity', 'resourceCapacity']);
  const before = attempt(f, [[dataOf(c, ['before', 'base'], 'the founder week')]], 'E deliveryCapacity');
  const after = attempt(f, [[dataOf(c, ['after', 'adminSaved'], 'the founder week after the saving')]], 'E deliveryCapacity');
  const hours = (x) => num(look(x, ['availableForDelivery', 'deliveryHours', 'available']));
  const committed = (x) => num(look(x, ['committedHours', 'committed', 'commitments']));
  eq(hours(before), 10, 'E delivery hours before the saving');
  eq(hours(after), 12, 'E delivery hours after the saving');
  ok(Number.isFinite(committed(before)) && Number.isFinite(committed(after)), `not implemented yet: fixture E needs the committed hours alongside the delivery hours, so the twenty can be shown to move rather than grow; got ${show(before)}`);
  eq(hours(before) + committed(before), 20, 'E the founder week before the saving, in hours');
  eq(hours(after) + committed(after), 20, 'E the founder week after the saving, in hours');
});

test('freed time does not become hours, cash and revenue at once', () => {
  const c = useCase('E');
  const demand = num(look(c, ['inputs.demandUnits', 'demandUnits', 'inputs.demand']));
  ok(Number.isFinite(demand), `not implemented yet: fixture E needs the four jobs of demand (case.inputs.demandUnits), got ${show(demand)}`);
  let before;
  let after;
  try { before = month1(c, ['demand4', 'demandFour', 'demandLimited'], 'four jobs of demand'); after = month1(c, ['demand4Saved', 'demandFourSaved'], 'four jobs of demand after the saving'); }
  catch (e) { throw new Error(`not implemented yet: fixture E needs a pair of scenario states at four jobs of demand, before and after the two admin hours are freed (case.variants.demand4 and demand4Saved), so the revenue and the cost can be shown not to move: ${e.message}`); }
  eq(after.delivered, num(before.delivered), 'E delivered jobs once two admin hours are freed, with demand at four');
  eq(after.revenue, num(before.revenue), 'E revenue once two admin hours are freed', gbp);
  eq(period(after), period(before), 'E period cost once two admin hours are freed (no wage falls by itself)', gbp);
});

test('combined actions spend the shared cash once: £2,000 of marketing and £4,500 of fixed cost, not £3,000 and £7,000', () => {
  const c = useCase('A');
  const both = month1(c, A_BOTH, 'both');
  const mkt = month1(c, A_MKT, 'more marketing');
  const cap = month1(c, A_CAP, 'more capacity');
  eq(both.acquisitionCost, 2000, 'A combined marketing cost', gbp);
  ok(Math.abs(num(both.acquisitionCost) - (num(mkt.acquisitionCost) + num(cap.acquisitionCost))) > 0.005, `A: the combined marketing cost ${gbp(num(both.acquisitionCost))} is the sum of the two variants, so the shared spend was counted twice`);
  eq(period(both), 4500, 'A combined fixed cost', gbp);
  ok(Math.abs(period(both) - (period(mkt) + period(cap))) > 0.005, `A: the combined fixed cost ${gbp(period(both))} is the sum of the two variants, so the base £2,500 was counted twice`);
});

test('the combined case is recomputed, not added: £5,400 against the £2,600 the isolated changes give', () => {
  const c = useCase('A');
  const base = num(month1(c, A_BASE, 'baseline').operatingResult);
  const joint = num(month1(c, A_BOTH, 'both').operatingResult) - base;
  const isolated = (num(month1(c, A_MKT, 'more marketing').operatingResult) - base) + (num(month1(c, A_CAP, 'more capacity').operatingResult) - base);
  eq(joint, 5400, 'A joint improvement', gbp);
  eq(isolated, 2600, 'A sum of the isolated improvements', gbp);
  ok(Math.abs(joint - isolated) > 0.005, 'A: the joint improvement equals the sum of the isolated ones, so nothing was recomputed');
});

/* ---------------- A goal cannot change the baseline ---------------- */

test('a goal value cannot change the baseline, however large the target', () => {
  const c = useCase('F');
  const state = stateOf(c, ['state', '*'], 'the business');
  const goal = goalOf(c);
  const before = JSON.stringify(need('baseline')(state));
  need('requirements')(state, goal);
  const bigger = clone(goal);
  if (bigger && typeof bigger === 'object') Object.keys(bigger).forEach((k) => { if (typeof bigger[k] === 'number') bigger[k] *= 10; });
  need('requirements')(state, bigger);
  const after = JSON.stringify(need('baseline')(state));
  ok(before === after, 'F: the baseline changed after a goal was set, so the target is feeding back into its own starting point');
});

test('econ.requirements does not mutate the state it was given', () => {
  const c = useCase('F');
  const state = stateOf(c, ['state', '*'], 'the business');
  const before = JSON.stringify(state);
  need('requirements')(state, goalOf(c));
  ok(JSON.stringify(state) === before, 'F: econ.requirements wrote the goal back into the state it was given');
});

/* ---------------- Path totals before quantiles ---------------- */

test('path totals come before quantiles: the median of the totals is 100, not the 120 from monthly medians', () => {
  const c = useCase('I');
  const paths = look(c, ['inputs.paths', 'paths']);
  ok(Array.isArray(paths) && paths.length === 3, `not implemented yet: fixture I needs case.inputs.paths, got ${show(paths)}`);
  const out = attempt(helper(['summarisePaths', 'summarizePaths', 'medianOfPathTotals', 'pathTotalMedian']), [[paths], [paths, 0.5]], 'I summarisePaths');
  const got = typeof out === 'number' ? out : look(out, ['quantileOfPathTotals', 'medianOfPathTotals', 'median', 'p50']);
  eq(got, 100, 'I median of the path totals');
  const monthly = paths[0].map((_, i) => { const col = paths.map((p) => p[i]).sort((a, b) => a - b); return col[Math.floor(col.length / 2)]; }).reduce((t, x) => t + x, 0);
  eq(monthly, 120, 'I the sum of the monthly medians, the figure that must never be reported as the total');
  ok(Math.abs(num(got) - monthly) > 0.005, 'I: the cumulative figure was summed from the monthly medians');
});

test('each path is clipped at capacity before averaging: expected delivered work is five, not ten', () => {
  const c = useCase('I');
  const states = look(c, ['inputs.demandPaths', 'demandPaths', 'inputs.demand.states', 'demand.states']);
  const capacity = look(c, ['inputs.capacity', 'capacity', 'inputs.demand.capacity']);
  ok(states !== undefined && capacity !== undefined, `not implemented yet: fixture I needs the demand states and the capacity, got ${show(states)} and ${show(capacity)}`);
  const out = attempt(helper(['expectedDelivered', 'expectedDeliveredWork', 'deliveredExpectation']), [[states, capacity], [{ states, capacity, weights: [0.5, 0.5] }]], 'I expectedDelivered');
  const got = typeof out === 'number' ? out : look(out, ['expected', 'clipThenAverage', 'value']);
  eq(got, 5, 'I expected delivered work');
  const wrong = look(out, ['averageThenClip']);
  if (wrong !== undefined) ok(Math.abs(num(got) - num(wrong)) > 0.005, `I: the reported figure ${show(got)} is the one from clipping the average demand, not from clipping each path`);
});

/* ---------------- Revisions and one version everywhere ---------------- */

test('every scenario stamps its input revision, model version and mode, and none claims a validated forecast', () => {
  const MODES = ['requirements', 'illustrative', 'operating_scenario', 'validated_forecast'];
  everyScenario().forEach(({ id, sc }) => {
    ok(sc.inputRevision !== undefined && sc.inputRevision !== null, `${id}: the scenario carries no inputRevision, so a stale result cannot be detected`);
    ok(typeof sc.modelVersion === 'string' && sc.modelVersion.length > 0, `${id}: the scenario carries no modelVersion, got ${show(sc.modelVersion)}`);
    ok(MODES.includes(sc.mode), `${id} mode: expected one of ${MODES.join(', ')}, got ${show(sc.mode)}`);
    ok(sc.mode !== 'validated_forecast', `${id}: nothing in this build may claim a validated forecast, there is no historical series to backtest against`);
  });
});

test('the same input gives the same result, so the screen, the export and the TMA brief share one scenario', () => {
  const c = useCase('A');
  const state = stateOf(c, A_BASE.concat('*'), 'baseline');
  const a = need('scenario')(state);
  const b = need('scenario')(state);
  eq(b.inputRevision, num(a.inputRevision), 'A input revision on a second identical call');
  ok(a.modelVersion === b.modelVersion, `A model version differs between two identical calls: ${show(a.modelVersion)} then ${show(b.modelVersion)}`);
  ok(JSON.stringify(a.totals) === JSON.stringify(b.totals), 'A: two identical calls returned different totals');
  ok(JSON.stringify(a.months) === JSON.stringify(b.months), 'A: two identical calls returned different monthly schedules');
});

test('a stale response cannot overwrite a newer revision', () => {
  const c = useCase('A');
  const state = stateOf(c, A_BASE.concat('*'), 'baseline');
  const older = need('scenario')(state);
  const newerState = clone(state);
  newerState.revision = Number.isFinite(num(newerState.revision)) ? num(newerState.revision) + 1 : 2;
  if (M) M.revision = (num(M.revision) || 1) + 1;
  const newer = need('scenario')(newerState);
  ok(num(newer.inputRevision) > num(older.inputRevision), `the newer scenario must carry the higher input revision, got ${show(older.inputRevision)} then ${show(newer.inputRevision)}`);
  const name = ['isStale', 'staleAgainst', 'accept', 'supersedes'].find((x) => econ && typeof econ[x] === 'function');
  ok(name, 'not implemented yet: econ needs isStale(result, currentRevision) (or accept(result, currentRevision)) so an older response cannot overwrite a newer answer');
  const asks = /stale/i.test(name);
  const oldVerdict = !!econ[name](older, newer.inputRevision);
  const newVerdict = !!econ[name](newer, newer.inputRevision);
  ok(asks ? oldVerdict : !oldVerdict, `econ.${name}: the older result at revision ${show(older.inputRevision)} must be rejected against revision ${show(newer.inputRevision)}`);
  ok(asks ? !newVerdict : newVerdict, `econ.${name}: the current result at revision ${show(newer.inputRevision)} must be kept`);
});

console.log(`\n${n - failed} of ${n} passed${failed ? `, ${failed} FAILED` : ''}`);
process.exit(failed ? 1 : 0);
