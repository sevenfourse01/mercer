/* econ.js (Mercer 12, final pack, owner: econ). Tasks 25 to 32 and 34's engine half.

   D1: this file owns every number. engine.js stays frozen and is at most an optional demand view; where the two
   disagree this file wins and the engine's figure is not shown. The reason is in notes/econ-audit.md: the frozen
   engine has no cost side, no cash schedule, no backlog, no hours and no cohorts, so Tasks 26 to 32 cannot be
   expressed inside it at any parameter setting.

   API (notes/final-1.md section 2): window.Mercer.econ = { audit, model, baseline, scenario, requirements,
   compare, constraints, fixtures }. econ.calc holds the named arithmetic rules the fixtures check directly.

   Three rules run through everything here:
     1. Unknown is never zero and never an industry average. An unknown input makes the figure that depends on it
        null and adds an entry to unmetRequirements. It never quietly becomes a number.
     2. Every rate carries its numerator, denominator, period, segment and source. A rate with no denominator
        cannot be applied.
     3. The goal never enters the baseline or a scenario. It enters requirements() only, as inverse arithmetic.

   No probability of hitting a goal is produced anywhere (D3). No scenario in this build may claim
   validated_forecast (D2); MODE_NOTES.validated_forecast says why in the mode's own words. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});

const MODEL_VERSION = 'econ-1.0';
/* a month is not four weeks. Task 25 asks for consistent aggregation, so every week-to-month conversion goes
   through this one constant and is marked as a conversion wherever it is used */
const WEEKS_PER_MONTH = 52 / 12;
const DEFAULT_HORIZON = 12;
const MAX_HORIZON = 36;

/* ---------------------------------------------------------------- 1. figures: value, state and basis (Task 25) */
const OBSERVED = 'observed', ESTIMATED = 'estimated', UNKNOWN = 'unknown';
const STATE_RANK = { observed: 0, estimated: 1, unknown: 2 };

/** one figure. An estimate must carry a basis; an estimate without one is recorded as such rather than promoted */
function fig(value, state, basis) {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) {
    return { value: null, state: UNKNOWN, basis: basis ?? null };
  }
  const st = state === OBSERVED ? OBSERVED : state === UNKNOWN ? UNKNOWN : ESTIMATED;
  /* a known figure always carries a basis: a number with no account of where it came from is the thing this
     module exists to stop */
  return { value: n, state: st, basis: basis || (st === OBSERVED ? 'a figure you gave' : 'estimated, basis not recorded') };
}
const unknownFig = (basis) => ({ value: null, state: UNKNOWN, basis: basis ?? null });
const isKnown = (f) => !!f && f.value !== null && f.state !== UNKNOWN;
const numOf = (f) => (isKnown(f) ? f.value : null);
/** the weakest state among figures: one unknown makes the result unknown */
function weakest(figs) {
  let worst = OBSERVED;
  for (const f of figs) { const s = f?.state ?? UNKNOWN; if (STATE_RANK[s] > STATE_RANK[worst]) worst = s; }
  return worst;
}
/** arithmetic that refuses to invent: any unknown input returns unknown, never 0 */
function combine(fn, figs, basis) {
  if (figs.some((f) => !isKnown(f))) return unknownFig(basis ?? 'depends on a value that is not known');
  return fig(fn(...figs.map((f) => f.value)), weakest(figs), basis);
}
const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : n);
/* null, undefined and '' are not numbers. Number(null) is 0, and letting that through would turn "not known"
   into zero, which is the one thing this module exists to stop */
const nn = (n) => (n === null || n === undefined || n === '' || (Array.isArray(n) && !n.length) ? null : (Number.isFinite(Number(n)) ? Number(n) : null));
const sum = (xs) => xs.reduce((a, b) => a + (Number(b) || 0), 0);
const money = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : `£${Math.round(Number(n) || 0).toLocaleString('en-GB')}`);
const plural = (n, one, many) => `${n} ${Math.abs(n) === 1 ? one : many}`;

/* ---------------------------------------------------------------- 2. rates keep their provenance (Task 31) */
/** a rate is never a bare number here: applying one needs its denominator, its period and where it came from */
function rate({ value, numerator, denominator, period, segment, source, state, basis }) {
  const num = nn(numerator), den = nn(denominator);
  const v = nn(value) !== null ? Number(value) : (num !== null && den ? num / den : null);
  const observed = num !== null && den !== null && den > 0;
  const per = period ?? null;
  const known = v !== null && Number.isFinite(v);
  return {
    value: known ? v : null,
    numerator: num, denominator: den,
    period: per, segment: segment ?? null, unit: 'share of the denominator, 0 to 1',
    source: source ?? (observed ? 'observed in this business' : null),
    state: !known ? UNKNOWN : (state ?? (observed ? OBSERVED : ESTIMATED)),
    /* the basis always names the numerator, denominator and period, so the rate cannot be read as a promise
       or moved to another period by mistake */
    basis: basis || (!known ? null
      : `${num !== null && den !== null ? `${num} of ${den}` : `${Math.round(v * 1000) / 10}%`} ${segment ? `of ${segment}` : ''}${per ? `, measured over one ${per}` : ''}${observed && den < 20 ? `. ${den} is a small sample and is not a rate to project forward` : ''}`.replace(/\s+/g, ' ').trim()),
    /* a rate from a handful of events is an observation, not a projectable rate. Fixture G: two wins from two
       enquiries is an observed 2/2 and cannot pass a rule that promises 100% future conversion */
    sample: den,
    projectable: v !== null && (den === null || den >= 20) && v < 1,
    projectableReason: den !== null && den < 20 ? `${den} in the denominator is too small a sample to project`
      : v !== null && v >= 1 ? 'a rate of 1 or more cannot be projected forward as a certainty' : null,
  };
}
const rateKnown = (r) => !!r && r.value !== null && r.state !== UNKNOWN;

/* ---------------------------------------------------------------- 3. the named arithmetic rules (Task 33) */
const calc = {
  /** Fixture G. Known overlap subtracts once. Unknown overlap returns bounds, never a guessed point */
  uniqueReach(channels, overlaps) {
    const list = (channels || []).map((c) => ({ id: c.id, reach: nn(c.reach) ?? 0 }));
    const total = sum(list.map((c) => c.reach));
    const largest = list.reduce((a, c) => Math.max(a, c.reach), 0);
    const pairs = overlaps || [];
    const knownAll = list.length <= 1 || (pairs.length >= (list.length * (list.length - 1)) / 2 && pairs.every((p) => nn(p.people) !== null));
    if (knownAll) {
      const shared = sum(pairs.map((p) => nn(p.people) ?? 0));
      const unique = total - shared;
      return { unique: fig(unique, OBSERVED, 'sum of reach less the known overlaps'), lower: unique, upper: unique, overlapKnown: true };
    }
    /* same eligible population, overlap unknown: the union is at least the largest channel and at most the sum */
    return {
      unique: unknownFig('channel overlap is not known, so unique reach is a range, not a figure'),
      lower: largest, upper: total, overlapKnown: false,
      note: `unique reach is between ${largest} and ${total} people until the overlap is known`,
    };
  },

  /** Task 29. Acquisition is counted once: in the per-unit figure or the period budget, never both */
  breakEvenUnits({ price, variableCost, contributionPerUnit, fixedCosts, acquisitionPerPeriod, acquisitionPerUnit, targetOperatingResult }) {
    const perUnitAcq = nn(acquisitionPerUnit) ?? 0;
    const periodAcq = nn(acquisitionPerPeriod) ?? 0;
    if (perUnitAcq > 0 && periodAcq > 0) {
      return { units: null, reason: 'acquisition is given both per unit and per period; count it once', doubleCounted: true };
    }
    const contrib = nn(contributionPerUnit) !== null ? Number(contributionPerUnit)
      : (nn(price) !== null && nn(variableCost) !== null ? Number(price) - Number(variableCost) - perUnitAcq : null);
    const fixed = nn(fixedCosts);
    if (contrib === null || fixed === null) return { units: null, reason: 'not enough is known to work out a break-even volume' };
    const target = nn(targetOperatingResult) ?? 0;
    const needed = fixed + periodAcq + target;
    /* Fixture G: zero or negative unit contribution with positive fixed costs has no volume-only break-even.
       Not Infinity, not a large number: no answer under these assumptions */
    if (contrib <= 0) {
      return { units: null, contributionPerUnit: contrib, reason: needed > 0
        ? 'unit contribution is zero or below, so volume alone does not reach break-even under these assumptions'
        : 'unit contribution is zero or below' };
    }
    return { units: Math.ceil(needed / contrib), exact: needed / contrib, contributionPerUnit: contrib, reason: null };
  },

  /** Fixture G. Zero acquired customers makes the ratio undefined, never £0 */
  cac({ spend, customersAcquired }) {
    const s = nn(spend), c = nn(customersAcquired);
    if (s === null || c === null) return { value: null, defined: false, reason: 'acquisition spend or acquired customers is not known' };
    if (c === 0) return { value: null, defined: false, reason: s > 0 ? 'acquisition spend with no acquired customers has no cost per customer' : 'no spend and no customers' };
    return { value: s / c, defined: true, reason: null };
  },

  /** Fixture E. Delivery hours are what is left after every other committed use of the same hours */
  deliveryCapacity({ availableHours, commitments, hoursPerUnit, period }) {
    const avail = nn(availableHours);
    const committed = sum((commitments || []).map((c) => nn(c.hours) ?? 0));
    const per = nn(hoursPerUnit);
    if (avail === null || per === null || per <= 0) {
      return { availableForDelivery: null, capacityUnits: null, overcommitted: false, reason: 'available hours or hours per unit is not known' };
    }
    const left = avail - committed;
    /* a negative balance is overcommitment, not spare capacity, and it is not quietly clamped away */
    return {
      availableForDelivery: Math.max(0, left), capacityUnits: Math.floor(Math.max(0, left) / per),
      overcommitted: left < 0, shortfallHours: left < 0 ? -left : 0,
      period: period ?? 'week', committedHours: committed, reason: null,
    };
  },

  /** Fixture H. Earliest dates come from the dependency chain, not from a fixed ramp */
  criticalPath(steps) {
    const byId = new Map((steps || []).map((s) => [s.id, s]));
    const finish = new Map();
    const resolve = (id, seen = new Set()) => {
      if (finish.has(id)) return finish.get(id);
      if (seen.has(id)) throw new Error(`econ.calc.criticalPath: circular dependency at ${id}`);
      seen.add(id);
      const s = byId.get(id);
      if (!s) return 0;
      const after = (s.after || []).map((a) => resolve(a, seen));
      const start = after.length ? Math.max(...after) : 0;
      const end = start + (nn(s.weeks) ?? 0);
      finish.set(id, end);
      return end;
    };
    const out = (steps || []).map((s) => ({ id: s.id, label: s.label ?? s.id, weeks: nn(s.weeks), finishWeek: resolve(s.id) }));
    const last = out.reduce((a, s) => Math.max(a, s.finishWeek), 0);
    return { steps: out, finishWeek: last, finishMonth: last / WEEKS_PER_MONTH, byId: Object.fromEntries(out.map((s) => [s.id, s.finishWeek])) };
  },

  /** Fixture I, first half. Each path is clipped at capacity and only then averaged */
  expectedDelivered(demandPaths, capacity, weights) {
    const cap = nn(capacity);
    if (cap === null) return { expected: null, reason: 'capacity is not known' };
    const w = weights && weights.length === demandPaths.length ? weights : demandPaths.map(() => 1 / demandPaths.length);
    const total = sum(w);
    const clipped = demandPaths.map((d) => Math.min(nn(d) ?? 0, cap));
    const expected = sum(clipped.map((d, i) => d * w[i])) / total;
    const averageDemand = sum(demandPaths.map((d, i) => (nn(d) ?? 0) * w[i])) / total;
    return { expected, clipThenAverage: expected, averageThenClip: Math.min(averageDemand, cap), paths: clipped };
  },

  /** Fixture I, second half. A cumulative figure comes from path totals, never from summed monthly quantiles */
  summarisePaths(paths, quantile = 0.5) {
    const months = paths.length ? paths[0].length : 0;
    const monthly = [];
    for (let i = 0; i < months; i += 1) monthly.push(calc.quantile(paths.map((p) => p[i]), quantile));
    const totals = paths.map((p) => sum(p));
    return {
      monthlyQuantiles: monthly,
      sumOfMonthlyQuantiles: sum(monthly),
      quantileOfPathTotals: calc.quantile(totals, quantile),
      pathTotals: totals,
      note: 'a cumulative figure is the quantile of the path totals; summing monthly quantiles is not the same number',
    };
  },
  /** the lower of the two middle values on an even count, so three paths of 100, 100, 120 give 100 */
  quantile(values, q) {
    const v = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!v.length) return null;
    return v[Math.min(v.length - 1, Math.max(0, Math.floor(q * (v.length - 1))))];
  },

  /** Fixture D. Billing timing decides what is earned; the closing base decides the run rate */
  recurringMonth({ openingCustomers, cancellations, starts, reactivations, pricePerMonth, cancelBeforeBilling = true, startsBilledThisMonth = false }) {
    const open = nn(openingCustomers), canc = nn(cancellations) ?? 0, st = nn(starts) ?? 0, re = nn(reactivations) ?? 0, price = nn(pricePerMonth);
    if (open === null || price === null) return { closingCustomers: null, closingMRR: null, earnedRevenue: null, reason: 'the opening base or the price is not known' };
    const closing = open + st + re - canc;
    if (closing < 0) return { closingCustomers: null, closingMRR: null, earnedRevenue: null, reason: 'cancellations exceed the opening base plus starts' };
    const billed = open - (cancelBeforeBilling ? canc : 0) + (startsBilledThisMonth ? st + re : 0);
    return {
      closingCustomers: closing, closingMRR: closing * price,
      billedCustomers: billed, earnedRevenue: billed * price,
      note: 'closing run rate is not the month\'s earned revenue',
    };
  },

  /** Fixture D, second half. Money paid upfront is cash once, at the start, and revenue evenly over the months
      it covers. It is never a recurring run rate repeated every month */
  prepayment({ amount, months, startMonth }) {
    const a = nn(amount), m = nn(months);
    if (a === null || m === null || m <= 0) return { cashMonth1: null, revenuePerMonth: null, reason: 'the amount or the number of months it covers is not known' };
    const per = a / m;
    return {
      cashMonth1: a, cash: a, startMonth: Math.max(1, nn(startMonth) ?? 1),
      revenuePerMonth: per, monthlyRevenue: per, runRate: per, months: m,
      note: 'cash lands once at the start; the run rate is the monthly service, not the amount collected',
    };
  },

  /** Fixture B. A discount needs the volume that holds contribution, not the volume that holds revenue */
  volumeToHoldContribution({ price, newPrice, variableCost, units }) {
    const p = nn(price), np = nn(newPrice), vc = nn(variableCost), u = nn(units);
    if ([p, np, vc, u].some((x) => x === null)) return { units: null, reason: 'price, new price, variable cost or volume is not known' };
    const before = (p - vc) * u, after = np - vc;
    if (after <= 0) return { units: null, contributionBefore: before, contributionPerUnitAfter: after, reason: 'at the lower price a unit makes no contribution, so no volume holds it' };
    const needed = before / after;
    return { units: Math.ceil(needed), exact: needed, contributionBefore: before, contributionPerUnitAfter: after, multiple: needed / u };
  },
};

/* ---------------------------------------------------------------- 4. reading the state (Task 25: define the scope) */
const inSet = (c, k) => (!c ? false : typeof c.has === 'function' ? c.has(k) : Array.isArray(c) ? c.includes(k) : !!c[k]);
const given = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length);
const declined = (s, k) => inSet(s.notSure, k) || inSet(s.na, k);
const sVal = (s, k) => (given(s[k]) && !declined(s, k) ? s[k] : null);
const sNum = (s, k) => { const v = sVal(s, k); const n = Number(v); return v !== null && Number.isFinite(n) ? n : null; };
const lower = (t) => String(t ?? '').toLowerCase();
const words = (s, ...ks) => ks.map((k) => lower(sVal(s, k))).join(' ');

/** the economics of a run, read once. state.econ is the explicit form; the questionnaire keys are the fallback.
    state.goal is deliberately not read here: a goal cannot change a baseline or a scenario (Task 32) */
function readInputs(state) {
  const s = state || {};
  const e = s.econ || {};
  const currency = s.currency || e.currency || 'GBP';
  const horizon = Math.max(1, Math.min(MAX_HORIZON, nn(e.horizonMonths) ?? nn(s.months) ?? DEFAULT_HORIZON));
  /* monthly for ordinary planning; weekly where a short launch or tight cash timing needs it (Task 25). Every
     figure in a run is in the scope's own period, so nothing is silently converted at four weeks to the month */
  const scopePeriod = e.period === 'week' ? 'week' : 'month';

  /* price and variable cost. A margin is only a way to estimate a variable cost, and it says so in the basis */
  const price = e.price !== undefined ? fig(e.price, e.priceState ?? OBSERVED, e.priceBasis ?? 'given as the effective price')
    : sNum(s, 'price') !== null ? fig(sNum(s, 'price'), OBSERVED, 'the price you gave')
    : sNum(s, 'retainerValue') !== null ? fig(sNum(s, 'retainerValue'), OBSERVED, 'the monthly retainer you gave')
    : unknownFig('no price has been given');
  let variableCost;
  if (e.variableCost !== undefined) variableCost = fig(e.variableCost, e.variableCostState ?? OBSERVED, e.variableCostBasis ?? 'given as the cost of delivering one unit');
  else if (sNum(s, 'margin') !== null && isKnown(price)) {
    variableCost = fig(price.value * (1 - sNum(s, 'margin')), ESTIMATED, `estimated from the ${Math.round(sNum(s, 'margin') * 100)}% margin you gave, applied to the price`);
  } else variableCost = unknownFig('the cost of delivering one unit is not known');

  const salesPerMonth = e.salesPerMonth !== undefined ? fig(e.salesPerMonth, e.salesState ?? OBSERVED, e.salesBasis ?? 'given')
    : sNum(s, 'salesPerMonth') !== null ? fig(sNum(s, 'salesPerMonth'), OBSERVED, 'the sales a month you gave')
    : unknownFig('how many you sell in a month is not known');
  const statedRevenue = e.statedRevenue !== undefined ? fig(e.statedRevenue, OBSERVED, 'the monthly revenue you gave')
    : sNum(s, 'now') !== null ? fig(sNum(s, 'now'), OBSERVED, 'the monthly revenue you gave')
    : unknownFig('monthly revenue has not been given');

  /* costs. There is no default fixed cost: an unknown fixed cost makes the operating result unknown, which is the
     honest answer and the reason a scenario can be contribution-only */
  const fixedCosts = e.fixedCostsPerMonth !== undefined ? fig(e.fixedCostsPerMonth, e.fixedCostsState ?? OBSERVED, e.fixedCostsBasis ?? 'given as the monthly fixed cost')
    : unknownFig('monthly fixed costs are not known');
  const acquisitionPerMonth = e.acquisitionPerMonth !== undefined ? fig(e.acquisitionPerMonth, e.acquisitionState ?? OBSERVED, e.acquisitionBasis ?? 'given as the monthly acquisition spend')
    : sNum(s, 'budget') !== null ? fig(sNum(s, 'budget'), OBSERVED, 'the monthly growth spend you gave')
    : unknownFig('monthly acquisition spend is not known');
  const acquisitionPerUnit = e.acquisitionPerUnit !== undefined ? fig(e.acquisitionPerUnit, ESTIMATED, e.acquisitionPerUnitBasis ?? 'given as an acquisition cost per sale') : unknownFig(null);
  /* a step cost runs from its first month to its last, or to the end of the horizon. toMonth exists so a one-month
     outlay is a one-month outlay, not a cost that quietly repeats */
  const stepCosts = (e.stepCosts || []).map((c) => ({
    id: c.id, label: c.label ?? c.id, amountPerMonth: nn(c.amountPerMonth) ?? 0, oneOff: nn(c.oneOff) ?? 0,
    fromMonth: Math.max(1, nn(c.fromMonth) ?? 1), toMonth: nn(c.toMonth), reason: c.reason ?? null,
  }));

  /* demand. Opportunities and a win rate, or sales directly. Nothing is derived from a market size */
  const winRate = e.winRate !== undefined ? rate({ value: e.winRate.value ?? e.winRate, numerator: e.winRate.numerator, denominator: e.winRate.denominator, period: e.winRate.period ?? 'month', segment: e.winRate.segment ?? 'qualified opportunities', source: e.winRate.source, state: e.winRate.state, basis: e.winRate.basis ?? 'given' })
    : sNum(s, 'closeRate') !== null ? rate({ value: sNum(s, 'closeRate'), denominator: sNum(s, 'enquiries'), numerator: sNum(s, 'enquiries') !== null ? sNum(s, 'enquiries') * sNum(s, 'closeRate') : null, period: 'month', segment: 'qualified enquiries', source: 'your answer', state: OBSERVED, basis: 'the close rate you gave, applied to qualified enquiries only' })
    : rate({ value: null });
  const opportunitiesPerMonth = e.opportunitiesPerMonth !== undefined ? fig(e.opportunitiesPerMonth, e.opportunitiesState ?? OBSERVED, e.opportunitiesBasis ?? 'given as qualified opportunities a month')
    : sNum(s, 'enquiries') !== null ? fig(sNum(s, 'enquiries'), OBSERVED, 'the enquiries a month you gave')
    : unknownFig('qualified opportunities a month are not known');

  /* resources. Hours are the default unit; a unit-count resource declares its own */
  /* a resource with perUnit 0 is real time that is used for something else (administration, sales) but does not
     constrain delivery. It still appears in the schedule, so hours moved out of it are visible */
  let resources = (e.resources || []).map((r) => ({
    id: r.id, name: r.name ?? r.id, unit: r.unit ?? 'hours', period: r.period ?? scopePeriod,
    availablePerPeriod: fig(r.availablePerPeriod, r.availableState ?? OBSERVED, r.availableBasis ?? 'given'),
    commitments: (r.commitments || []).map((c) => ({ id: c.id, label: c.label ?? c.id, amount: nn(c.amount) ?? nn(c.hours) ?? 0, note: c.note ?? null })),
    perUnit: fig(r.perUnit, r.perUnitState ?? OBSERVED, r.perUnitBasis ?? 'given as the resource one delivered unit takes'),
    shared: r.shared !== false,
  }));
  if (!resources.length) {
    /* the questionnaire's capacity answer, in its own unit: completed jobs a month, not hours. It is one
       resource with a perUnit of 1, so the constraint arithmetic is the same shape either way */
    const who = sNum(s, 'who'), capPer = sNum(s, 'capacity');
    const total = who !== null && capPer !== null ? who * capPer : capPer;
    if (total !== null) {
      resources = [{
        id: 'delivery', name: 'Delivery', unit: 'completed jobs', period: 'month',
        availablePerPeriod: fig(total, OBSERVED, who !== null ? `${who} people at ${capPer} a month each, from your answers` : 'the capacity you gave'),
        commitments: sNum(s, 'servedNow') !== null ? [{ id: 'existing', label: 'Work already committed', amount: sNum(s, 'servedNow'), note: 'the customers you already serve each month' }] : [],
        perUnit: fig(1, OBSERVED, 'one completed job takes one unit of this capacity'),
        shared: true,
      }];
    }
  }

  /* cash. Nothing here has a default: unknown cash is unknown, never unlimited funding */
  const c = e.cash || {};
  const termWords = words(s, 'terms');
  const termLag = /sixty|60/.test(termWords) ? 2 : /thirty|30/.test(termWords) ? 1 : /on completion|immediate|up ?front|on the day/.test(termWords) ? 0 : null;
  const cash = {
    opening: c.opening !== undefined ? fig(c.opening, c.openingState ?? OBSERVED, c.openingBasis ?? 'given as cash available today') : unknownFig('cash available today is not known'),
    minimumBuffer: fig(nn(c.minimumBuffer) ?? 0, c.minimumBuffer === undefined ? ESTIMATED : OBSERVED, c.minimumBuffer === undefined ? 'no minimum buffer was chosen, so zero is used and the choice is shown' : 'the buffer you chose'),
    receiptLagMonths: c.receiptLagMonths !== undefined ? fig(c.receiptLagMonths, OBSERVED, 'given as the wait between delivering and being paid')
      : termLag !== null ? fig(termLag, ESTIMATED, `read from the payment terms you gave (${termWords.trim()})`) : unknownFig('when customers pay is not known'),
    paymentLagMonths: fig(nn(c.paymentLagMonths) ?? 0, c.paymentLagMonths === undefined ? ESTIMATED : OBSERVED, c.paymentLagMonths === undefined ? 'assumed paid in the month incurred' : 'given'),
    openingReceivables: c.openingReceivables !== undefined ? fig(c.openingReceivables, OBSERVED, 'given as money owed to you')
      : sNum(s, 'owed') !== null ? fig(sNum(s, 'owed'), OBSERVED, 'the money owed to you that you gave') : unknownFig(null),
    openingPayables: c.openingPayables !== undefined ? fig(c.openingPayables, OBSERVED, 'given as money you owe') : unknownFig(null),
    scheduled: (c.scheduled || []).map((p) => ({ id: p.id, label: p.label ?? p.id, month: Math.max(1, nn(p.month) ?? 1), amount: nn(p.amount) ?? 0, kind: p.kind ?? 'payment' })),
    confirmedFunding: (c.confirmedFunding || []).map((f) => ({ id: f.id, label: f.label ?? f.id, month: Math.max(1, nn(f.month) ?? 1), amount: nn(f.amount) ?? 0 })),
    prepayments: (c.prepayments || []).map((p) => ({ id: p.id, label: p.label ?? p.id, amount: nn(p.amount) ?? 0, months: Math.max(1, nn(p.months) ?? 1), startMonth: Math.max(1, nn(p.startMonth) ?? 1) })),
  };

  /* recurring, when the model is a subscription or retainer */
  const rec = e.recurring ? {
    openingCustomers: fig(e.recurring.openingCustomers, OBSERVED, 'given as the customers you start with'),
    pricePerMonth: fig(e.recurring.pricePerMonth, OBSERVED, 'given as the monthly price'),
    startsPerMonth: fig(e.recurring.startsPerMonth, e.recurring.startsState ?? ESTIMATED, e.recurring.startsBasis ?? 'assumed monthly starts'),
    cancellationsPerMonth: fig(e.recurring.cancellationsPerMonth, e.recurring.cancellationsState ?? ESTIMATED, e.recurring.cancellationsBasis ?? 'assumed monthly cancellations'),
    reactivationsPerMonth: fig(nn(e.recurring.reactivationsPerMonth) ?? 0, ESTIMATED, 'assumed none unless given'),
    cancelBeforeBilling: e.recurring.cancelBeforeBilling !== false,
    startsBilledThisMonth: e.recurring.startsBilledThisMonth === true,
    servicingHoursPerCustomer: e.recurring.servicingHoursPerCustomer !== undefined ? fig(e.recurring.servicingHoursPerCustomer, OBSERVED, 'given') : unknownFig(null),
  } : null;

  /* channels and the list they draw down */
  const channels = (e.channels || []).map((ch) => ({
    id: ch.id, name: ch.name ?? ch.id,
    listSize: ch.listSize !== undefined ? fig(ch.listSize, ch.listState ?? ESTIMATED, ch.listBasis ?? 'given as the people this route can reach') : unknownFig('the size of this list is not known'),
    contactsPerMonth: fig(ch.contactsPerMonth, OBSERVED, 'given as unique people contacted each month'),
    messagesPerContact: fig(nn(ch.messagesPerContact) ?? 1, ESTIMATED, 'messages sent to each person; more messages are not more people'),
    opportunityRate: rate(ch.opportunityRate || { value: null }),
    costPerContact: ch.costPerContact !== undefined ? fig(ch.costPerContact, OBSERVED, 'given') : unknownFig(null),
    startMonth: Math.max(1, nn(ch.startMonth) ?? 1),
    replenishPerMonth: fig(nn(ch.replenishPerMonth) ?? 0, ESTIMATED, 'new people entering the list each month; zero unless stated'),
  }));
  const overlaps = (e.channelOverlaps || []).map((o) => ({ a: o.a, b: o.b, people: nn(o.people) }));

  /* reach, where the run models it directly: people, with the overlap between routes named or left as a range */
  const reach = e.reach ? { channels: e.reach.channels || [], overlaps: e.reach.overlaps || [] } : null;
  /* acquisition spend against acquired customers, so cost per customer is defined or explicitly undefined */
  const acquired = e.acquisition ? { spend: nn(e.acquisition.spend), customersAcquired: nn(e.acquisition.customersAcquired) } : null;
  /* the critical path, from the actual dependencies of the work, not a fixed ramp (Task 28, Fixture H) */
  const criticalPathSteps = Array.isArray(e.criticalPath) ? e.criticalPath : null;

  return {
    currency, horizonMonths: horizon, period: scopePeriod,
    revision: nn(s.revision) ?? nn(M.revision) ?? 0,
    reach, acquired, criticalPathSteps,
    completionStepId: e.completionStep ?? 'deliver', receiptStepId: e.receiptStep ?? 'paid',
    scope: {
      entity: e.entity ?? sVal(s, 'businessName') ?? 'this business',
      offers: e.offers ?? [e.offerName ?? sVal(s, 'offer') ?? 'the main offer'],
      currency, taxBasis: e.taxBasis ?? 'net of collected sales tax; no jurisdiction rate is applied',
      period: scopePeriod, horizonMonths: horizon,
      startDate: e.startDate ?? null,
      unit: e.unit ?? 'completed jobs',
      excluded: ['financing', 'tax', 'owner withdrawals', 'depreciation'],
    },
    price, variableCost, salesPerMonth, statedRevenue,
    fixedCosts, acquisitionPerMonth, acquisitionPerUnit, stepCosts,
    opportunitiesPerMonth, winRate,
    demandPerMonth: e.demandPerMonth !== undefined ? fig(e.demandPerMonth, e.demandState ?? ESTIMATED, e.demandBasis ?? 'given as the demand a month') : unknownFig(null),
    /* a dated demand series, where demand is not the same every month. It wins over demandPerMonth */
    demandByMonth: Array.isArray(e.demandByMonth) ? e.demandByMonth.map((x) => nn(x)) : null,
    demandGrowthPerMonth: fig(nn(e.demandGrowthPerMonth) ?? 0, ESTIMATED, 'demand carried forward flat unless a trend is given'),
    excessDemand: e.excessDemand ?? 'backlog', // 'backlog' | 'decline' | 'lose'
    openingBacklog: fig(nn(e.openingBacklog) ?? 0, e.openingBacklog === undefined ? ESTIMATED : OBSERVED, e.openingBacklog === undefined ? 'assumed none unless stated' : 'given'),
    resources, cash, recurring: rec, channels, overlaps,
    /* Task 27. A customer can order more than once without becoming more than one customer, and a customer who
       comes back is neither new nor a continuing one. All three are counted separately or not at all */
    repeatPurchase: e.repeatPurchase ? {
      eligibleCustomers: fig(e.repeatPurchase.eligibleCustomers, e.repeatPurchase.eligibleState ?? OBSERVED, e.repeatPurchase.eligibleBasis ?? 'given as the customers who could buy again'),
      ordersPerCustomerPerMonth: fig(e.repeatPurchase.ordersPerCustomerPerMonth, e.repeatPurchase.frequencyState ?? ESTIMATED, e.repeatPurchase.frequencyBasis ?? 'given as how often an eligible customer buys again'),
    } : null,
    reactivationsPerMonth: e.reactivationsPerMonth !== undefined ? fig(e.reactivationsPerMonth, ESTIMATED, 'given as customers who come back after a gap') : unknownFig(null),
    lags: {
      setupWeeks: nn(e.setupWeeks) ?? 0,
      outreachToWinWeeks: nn(e.outreachToWinWeeks) ?? (sNum(s, 'cycle') !== null ? sNum(s, 'cycle') / 7 : 0),
      winToDeliveryWeeks: nn(e.winToDeliveryWeeks) ?? 0,
      deliveryToPaymentWeeks: nn(e.deliveryToPaymentWeeks) ?? null,
    },
    ownerHoursPerMonth: e.ownerHoursPerMonth !== undefined ? fig(e.ownerHoursPerMonth, OBSERVED, 'given') : unknownFig(null),
    raw: s,
  };
}

/* ---------------------------------------------------------------- 5. the operating model (Task 26) */
const MODELS = ['project', 'appointment', 'product', 'recurring', 'digital', 'enterprise'];
const MODEL_MECHANICS = {
  project: { unit: 'completed jobs', special: ['backlog', 'sales cycle', 'delivery time', 'milestone payments'] },
  appointment: { unit: 'booked slots', special: ['opening availability', 'occupancy', 'cancellations and no-shows', 'unused slots expire'] },
  product: { unit: 'fulfilled units', special: ['stock', 'lead times', 'landed cost', 'returns', 'shipping and payment fees'] },
  recurring: { unit: 'active customers', special: ['cohort retention', 'onboarding', 'servicing load', 'billing timing'] },
  digital: { unit: 'purchases or active memberships', special: ['support and moderation workload', 'refunds', 'platform fees'] },
  enterprise: { unit: 'contracts', special: ['buying stages', 'concentration', 'procurement delay', 'staged delivery'] },
};
/** chosen by how the offer is sold and delivered, not by the industry name. A coaching business can land in four
    of these six; the ladder below is ordered so the mechanic that dominates the economics wins */
function model(state) {
  const s = state || {};
  const explicit = s.econ?.model;
  if (explicit && MODELS.includes(explicit)) return explicit;
  const sold = words(s, 'payModel', 'repeatWork', 'howSold', 'billing');
  const delivered = words(s, 'deliveryMode', 'howDelivered', 'fulfilment');
  const all = `${sold} ${delivered} ${words(s, 'offer', 'sector', 'trade', 'whatYouSell')}`;
  const cycleDays = nn(s.cycle);

  /* 1. billing that repeats on a schedule sets the whole shape: a stock of customers, starts and cancellations */
  if (/retainer|subscription|membership|monthly plan|per month|recurring|licence|license/.test(sold)) return 'recurring';
  /* 2. a perishable slot: capacity that expires unsold, sold by the appointment, seat, room-night or table */
  if (/appointment|booking|slot|seat|table|room ?night|session|class|treatment|consultation|cover|venue|salon|clinic|restaurant/.test(all)) return 'appointment';
  /* 3. a physical unit that must be bought, stocked and shipped before it can be sold */
  if (/stock|inventory|ship|postage|courier|units|wholesale|retail|ecommerce|e-commerce|product we make|manufactur/.test(all)) return 'product';
  /* 4. a thing bought once and downloaded or joined, where delivery is support and moderation, not unlimited */
  if (/download|course|template|ebook|e-book|community|app store|digital product|membership site|saas self.?serve/.test(all)) return 'digital';
  /* 5. a long, staged sale to named accounts: procurement delay and start dates dominate */
  if (/tender|procurement|framework|enterprise|named account|contract award|rfp|bid/.test(all) || (cycleDays !== null && cycleDays >= 90)) return 'enterprise';
  /* 6. otherwise: work sold as a job, scheduled and completed */
  return 'project';
}

/* ---------------------------------------------------------------- 6. the reconciled baseline (Task 25) */
function baseline(state) {
  const inp = readInputs(state);
  const mode = model(state);
  const scope = { ...inp.scope, model: mode, unit: inp.scope.unit === 'completed jobs' ? MODEL_MECHANICS[mode].unit : inp.scope.unit };

  const sales = isKnown(inp.salesPerMonth) ? inp.salesPerMonth
    : (isKnown(inp.opportunitiesPerMonth) && rateKnown(inp.winRate)
      ? fig(inp.opportunitiesPerMonth.value * inp.winRate.value, ESTIMATED, `qualified opportunities a month times the win rate (${inp.winRate.numerator ?? '?'} of ${inp.winRate.denominator ?? '?'})`)
      : unknownFig('how many you sell in a month is not known'));
  const builtRevenue = combine((a, b) => a * b, [sales, inp.price], 'sales a month times the price');
  const variableCostTotal = combine((a, b) => a * b, [sales, inp.variableCost], 'sales a month times the cost of delivering one');
  const contribution = combine((a, b) => a - b, [builtRevenue, variableCostTotal], 'revenue less the cost of delivering it');
  const operatingResult = combine((a, b, c) => a - b - c, [contribution, inp.fixedCosts, isKnown(inp.acquisitionPerMonth) ? inp.acquisitionPerMonth : fig(0, ESTIMATED, 'no acquisition spend recorded')],
    'contribution less fixed costs and acquisition spend');

  /* the gap is exposed, never closed. No balancing multiplier exists anywhere in this file */
  let reconciliation = null;
  if (isKnown(inp.statedRevenue) && isKnown(builtRevenue)) {
    const gap = inp.statedRevenue.value - builtRevenue.value;
    reconciliation = {
      stated: inp.statedRevenue.value, built: builtRevenue.value, gap: round2(gap),
      resolved: Math.abs(gap) < 0.005 * Math.max(1, Math.abs(inp.statedRevenue.value)),
      note: Math.abs(gap) < 0.005 * Math.max(1, Math.abs(inp.statedRevenue.value))
        ? 'your sales and price account for the revenue you gave'
        : `${plural(numOf(sales) ?? 0, 'sale', 'sales')} at ${money(numOf(inp.price) ?? 0)} account for ${money(builtRevenue.value)}. You gave ${money(inp.statedRevenue.value)}, so ${money(Math.abs(gap))} is ${gap > 0 ? 'unaccounted for' : 'more than the revenue you gave'}. It could be another offer, a timing difference, tax, a refund or a typing slip. Until it is explained, only the part your sales and price account for is used.`,
      candidates: ['another offer or product line', 'a timing difference between delivery and the month it was counted', 'sales tax included or excluded', 'refunds or discounts', 'an input error'],
    };
  } else if (isKnown(inp.statedRevenue) && !isKnown(builtRevenue)) {
    reconciliation = { stated: inp.statedRevenue.value, built: null, gap: null, resolved: false, note: 'the revenue you gave cannot yet be rebuilt from sales and price, so it is carried as a stated total only', candidates: [] };
  }

  const values = {
    price: inp.price, variableCost: inp.variableCost, sales, revenue: builtRevenue,
    statedRevenue: inp.statedRevenue, contribution, fixedCosts: inp.fixedCosts,
    acquisitionPerMonth: inp.acquisitionPerMonth, operatingResult,
    openingCash: inp.cash.opening, receiptLagMonths: inp.cash.receiptLagMonths,
    opportunitiesPerMonth: inp.opportunitiesPerMonth,
    winRate: inp.winRate,
  };
  /* unique reach, where the run names the routes and what they have in common. A known overlap subtracts once;
     an unknown one is a range with no point estimate inside it (Fixture G) */
  if (inp.reach) {
    const u = calc.uniqueReach(inp.reach.channels, inp.reach.overlaps);
    values.uniqueReach = u.overlapKnown
      ? { ...u.unique, unit: 'people', low: u.lower, high: u.upper, bounds: { low: u.lower, high: u.upper }, overlapKnown: true }
      : { value: null, state: UNKNOWN, basis: u.note, unit: 'people', low: u.lower, high: u.upper, bounds: { low: u.lower, high: u.upper }, range: [u.lower, u.upper], overlapKnown: false };
  }
  /* cost per acquired customer. Zero acquired customers makes it undefined, and undefined is not zero */
  if (inp.acquired) {
    const c = calc.cac(inp.acquired);
    values.cac = c.defined
      ? fig(c.value, OBSERVED, `${money(inp.acquired.spend)} of acquisition spend over ${plural(inp.acquired.customersAcquired, 'acquired customer', 'acquired customers')}`)
      : { value: null, state: UNKNOWN, basis: c.reason, unit: `${inp.currency} per acquired customer` };
  }
  const unknowns = Object.entries(values).filter(([, f]) => !isKnown(f)).map(([k]) => k);

  return {
    scope, currency: inp.currency, period: inp.period, unit: scope.unit, model: mode,
    sales: numOf(sales), price: numOf(inp.price), revenue: numOf(builtRevenue),
    variableCost: numOf(variableCostTotal), contribution: numOf(contribution),
    fixedCosts: numOf(inp.fixedCosts), operatingResult: numOf(operatingResult),
    resources: inp.resources.map((r) => ({
      id: r.id, name: r.name, unit: r.unit, period: r.period,
      available: numOf(r.availablePerPeriod), committed: sum(r.commitments.map((c) => c.amount)),
      perUnit: numOf(r.perUnit), shared: r.shared,
    })),
    commitments: inp.resources.flatMap((r) => r.commitments.map((c) => ({ resource: r.id, id: c.id, label: c.label, amount: c.amount, note: c.note }))),
    cash: isKnown(inp.cash.opening) || isKnown(inp.cash.receiptLagMonths)
      ? { opening: numOf(inp.cash.opening), terms: numOf(inp.cash.receiptLagMonths), minimumBuffer: numOf(inp.cash.minimumBuffer) }
      : null,
    reconciliation,
    values, unknowns,
    winRate: inp.winRate,
    modelMechanics: MODEL_MECHANICS[mode],
    inputRevision: inp.revision, modelVersion: MODEL_VERSION,
  };
}

/* ---------------------------------------------------------------- 7. output modes (Task 31, D2) */
const MODE_NOTES = {
  requirements: 'Goal requirements. This is inverse arithmetic: what the target would take. It is not a prediction of demand.',
  illustrative: 'Illustrative scenario. If these assumptions hold, this is what the economics could look like. No likelihood is implied.',
  operating_scenario: 'Grounded operating scenario. Under these stated operating assumptions, this is the scenario. Observed inputs do not make any intervention proven.',
  /* D2 and Task 31. This is unreachable in this build and the code says so rather than leaving a gap that a later
     change could quietly fill. Reaching it needs a historical series, a rolling-origin backtest at the horizons
     actually shown, a comparison against a simple baseline, and reported error and interval coverage. Mercer has
     none of those: there is no stored series of earlier predictions and outcomes to test against */
  validated_forecast: 'Not available in this build. A validated forecast needs a historical series, a rolling-origin backtest at the horizons shown, a comparison against a simple baseline such as recent level, and reported error and interval coverage. Mercer stores none of those yet, so no scenario here may claim it.',
};
/* the short label that goes beside a figure on screen (Task 34). The numerical view is Scenarios, never Forecast */
const MODE_LABEL = {
  requirements: 'Goal requirements',
  illustrative: 'Illustrative scenario',
  operating_scenario: 'Grounded operating scenario',
  validated_forecast: 'Not available in this build',
};
const VALIDATED_FORECAST_UNREACHABLE = true;
/* Task 31. This build has no simulation: the model is deterministic and inspectable, so there is no seed, no
   draw count and no convergence check to report. Saying so is the honest answer; reporting a draw count from a
   model with no draws would be the dishonest one. Downside, base and favourable are assumption sets, chosen by
   changing stated inputs, and they are not calibrated percentiles */
const SIMULATION = {
  used: false, draws: 0, seed: null, convergence: null,
  note: 'deterministic. No draws, no seed, no interval and no probability of reaching a goal. Alternatives are assumption sets: change a stated input and the whole schedule is recomputed with its constraints.',
};

/** the mode is a property of the scenario, chosen by evidence, never by how many questions were answered */
function chooseMode(base, inp, hasPlan) {
  const drivers = [inp.price, inp.variableCost, hasPlan ? inp.fixedCosts : inp.fixedCosts];
  const reconciled = !base.reconciliation || base.reconciliation.resolved;
  const observedDrivers = drivers.every((f) => f && f.state === OBSERVED);
  const observedVolume = base.values.sales?.state === OBSERVED || (inp.opportunitiesPerMonth.state === OBSERVED && inp.winRate.state === OBSERVED);
  if (reconciled && observedDrivers && observedVolume) {
    return { mode: 'operating_scenario', reason: 'the baseline is reconciled and the drivers behind this scenario are figures you gave' };
  }
  const why = [];
  if (!reconciled) why.push('the baseline does not yet reconcile');
  if (!observedDrivers) why.push('at least one of price, cost or fixed costs is estimated or not known');
  if (!observedVolume) why.push('the volume is estimated rather than observed');
  return { mode: 'illustrative', reason: why.join('; ') || 'the evidence does not yet support a grounded operating scenario' };
}

/* ---------------------------------------------------------------- 8. the plan: actions applied to the schedule */
const ACTION_DRIVERS = ['marketing', 'capacity', 'price', 'conversion', 'retention', 'automation', 'hiring', 'channel'];
function readActions(plan) {
  const list = Array.isArray(plan) ? plan : Array.isArray(plan?.actions) ? plan.actions : [];
  return list.map((a, i) => ({
    id: a.id ?? `action-${i + 1}`, label: a.label ?? a.id ?? `Action ${i + 1}`,
    driver: ACTION_DRIVERS.includes(a.driver) ? a.driver : 'marketing',
    change: a.change || {},
    setupCost: nn(a.setupCost) ?? 0, recurringCost: nn(a.recurringCost) ?? 0,
    resourceUse: a.resourceUse || {},
    startMonth: Math.max(1, nn(a.startMonth) ?? 1),
    rampMonths: Math.max(0, nn(a.rampMonths) ?? 0),
    prerequisites: a.prerequisites || [],
    evidence: a.evidence ?? 'assumed',
    assumptionIds: a.assumptionIds || [],
    mechanism: a.mechanism ?? null,
    reviewMetric: a.reviewMetric ?? null,
  }));
}
/** 0 before the start month, then a straight ramp to 1 over rampMonths. An action with no ramp is full from its
    start month; nothing is full before it starts */
function rampShare(action, month) {
  if (month < action.startMonth) return 0;
  if (!action.rampMonths) return 1;
  const since = month - action.startMonth + 1;
  return Math.min(1, since / (action.rampMonths + 1));
}

/* ---------------------------------------------------------------- 9. the monthly schedule */
/** one pass over the horizon. Everything a scenario shows comes from here: demand, delivery, backlog, resources,
    costs and cash. Each cost is applied once, in one place */
function buildSchedule(inp, actions, base) {
  const H = inp.horizonMonths;
  const unmet = [];
  const need = (id, text) => { if (!unmet.some((u) => u.id === id)) unmet.push({ id, text }); };

  /* --- the levels a plan can move, read once at their baseline values --- */
  const basePrice = numOf(inp.price);
  const baseVariable = numOf(inp.variableCost);
  const baseFixed = numOf(inp.fixedCosts);
  const baseAcquisition = numOf(inp.acquisitionPerMonth) ?? 0;
  const baseOpportunities = numOf(inp.opportunitiesPerMonth);
  const baseWinRate = rateKnown(inp.winRate) ? inp.winRate.value : null;
  const baseDemand = numOf(inp.demandPerMonth) !== null ? numOf(inp.demandPerMonth)
    : (baseOpportunities !== null && baseWinRate !== null ? baseOpportunities * baseWinRate : numOf(base.values.sales));
  if (basePrice === null) need('price', 'a price for what you sell');
  if (baseVariable === null) need('variableCost', 'what it costs you to deliver one');
  if (baseFixed === null) need('fixedCosts', 'your fixed costs for a month');
  if (baseDemand === null && !inp.demandByMonth) need('demand', 'how many people want to buy in a month');

  /* --- resources, in monthly terms, with their existing commitments kept on the left of the constraint --- */
  const resources = inp.resources.map((r) => {
    /* a resource declared in the scope's own period needs no conversion. Only a mismatch converts, and it goes
       through WEEKS_PER_MONTH so a month is never four weeks by accident */
    const toPeriod = r.period === inp.period ? 1 : (r.period === 'week' ? WEEKS_PER_MONTH : 1 / WEEKS_PER_MONTH);
    return {
      id: r.id, name: r.name, unit: r.unit, period: r.period, shared: r.shared,
      availablePerMonth: isKnown(r.availablePerPeriod) ? r.availablePerPeriod.value * toPeriod : null,
      committedPerMonth: sum(r.commitments.map((c) => c.amount)) * toPeriod,
      commitments: r.commitments,
      perUnit: numOf(r.perUnit),
      addedPerMonth: new Array(H + 1).fill(0),    // from capacity and hiring actions
      removedPerMonth: new Array(H + 1).fill(0),  // hours this resource gives up, once
      freedPerMonth: new Array(H + 1).fill(0),    // hours freed here, before any redeployment
      redeployedPerMonth: new Array(H + 1).fill(0), // hours received from elsewhere, once
      extraUsePerMonth: new Array(H + 1).fill(0), // actions that consume the same resource
    };
  });
  if (!resources.length) need('resources', 'what limits how much work you can complete');
  const byResource = new Map(resources.map((r) => [r.id, r]));

  /* --- channels: unique people reached, a list that can run out --- */
  const channels = inp.channels.map((ch) => ({
    id: ch.id, name: ch.name, listSize: numOf(ch.listSize), reached: 0, exhaustedMonth: null,
    contactsPerMonth: numOf(ch.contactsPerMonth) ?? 0, messagesPerContact: numOf(ch.messagesPerContact) ?? 1,
    opportunityRate: ch.opportunityRate, costPerContact: numOf(ch.costPerContact),
    startMonth: ch.startMonth, replenish: numOf(ch.replenishPerMonth) ?? 0,
    multiplier: 1, extraContacts: new Array(H + 1).fill(0),
  }));

  /* --- apply each action to the levels it moves. An action with no demand effect only adds its cost --- */
  let price = basePrice, variable = baseVariable, fixed = baseFixed;
  const demandMultiplierByMonth = new Array(H + 1).fill(1);
  const demandAddByMonth = new Array(H + 1).fill(0);
  const acquisitionByMonth = new Array(H + 1).fill(baseAcquisition);
  const stepByMonth = new Array(H + 1).fill(0);
  const oneOffByMonth = new Array(H + 1).fill(0);
  const priceByMonth = new Array(H + 1).fill(basePrice);
  const winRateByMonth = new Array(H + 1).fill(baseWinRate);
  const dependencies = [];
  const assumptionIds = [];

  for (const c of inp.stepCosts) {
    const last = c.toMonth === null || c.toMonth === undefined ? H : Math.min(H, c.toMonth);
    for (let m = c.fromMonth; m <= last; m += 1) stepByMonth[m] += c.amountPerMonth;
    if (c.oneOff) oneOffByMonth[c.fromMonth] += c.oneOff;
  }

  for (const a of actions) {
    assumptionIds.push(...a.assumptionIds);
    if (a.startMonth > 1 || a.rampMonths > 0 || a.prerequisites.length) {
      dependencies.push({ action: a.id, startMonth: a.startMonth, rampMonths: a.rampMonths, prerequisites: a.prerequisites, earliestEffectMonth: a.startMonth });
    }
    for (let m = 1; m <= H; m += 1) {
      const share = rampShare(a, m);
      if (!share) continue;
      /* every action's recurring cost lands as a step cost, once, from its start month */
      acquisitionByMonth[m] += (a.driver === 'marketing' || a.driver === 'channel') ? (nn(a.change.spendDelta) ?? 0) * share : 0;
      if (a.driver !== 'marketing' && a.driver !== 'channel') stepByMonth[m] += a.recurringCost * share;
      else stepByMonth[m] += 0;
      if (a.driver === 'marketing' || a.driver === 'channel') stepByMonth[m] += a.recurringCost * share;

      if (a.change.opportunitiesDelta !== undefined && baseOpportunities !== null) demandAddByMonth[m] += (nn(a.change.opportunitiesDelta) ?? 0) * share * (winRateByMonth[m] ?? 1);
      if (a.change.opportunitiesMultiplier !== undefined) demandMultiplierByMonth[m] *= 1 + ((nn(a.change.opportunitiesMultiplier) ?? 1) - 1) * share;
      if (a.change.demandDelta !== undefined) demandAddByMonth[m] += (nn(a.change.demandDelta) ?? 0) * share;
      if (a.change.demandMultiplier !== undefined) demandMultiplierByMonth[m] *= 1 + ((nn(a.change.demandMultiplier) ?? 1) - 1) * share;
      if (a.change.winRate !== undefined) winRateByMonth[m] = nn(a.change.winRate);
      if (a.change.price !== undefined) priceByMonth[m] = nn(a.change.price);

      /* capacity and hiring add resource, never sales. A resource that arrives cannot create demand */
      const add = a.change.resourceDelta || (a.driver === 'capacity' || a.driver === 'hiring' ? a.change.resources : null);
      if (add) {
        const lead = Math.max(0, nn(a.change.leadTimeMonths) ?? 0);
        if (m >= a.startMonth + lead) {
          for (const [rid, amount] of Object.entries(add)) {
            const r = byResource.get(rid);
            if (r) r.addedPerMonth[m] += (nn(amount) ?? 0) * share;
          }
        }
      }
      /* automation frees hours. The hours leave the task they were freed from, once, and they only reach delivery
         if the plan says to redeploy them. They do not also become cash: a cash saving needs a real expense to
         fall, which is `expenseRemovedPerMonth` and is stated separately (Task 28) */
      if (a.driver === 'automation' && a.change.hoursSaved) {
        for (const [rid, hours] of Object.entries(a.change.hoursSaved)) {
          const from = byResource.get(rid);
          if (!from) continue;
          const supervision = (nn(a.change.supervisionHours?.[rid]) ?? 0) * share;
          const freed = (nn(hours) ?? 0) * share - supervision;
          from.freedPerMonth[m] += freed;
          from.removedPerMonth[m] += freed;
          const target = a.change.redeployTo ? byResource.get(a.change.redeployTo) : (a.change.redeploy === true ? from : null);
          if (target) target.redeployedPerMonth[m] += freed;
        }
      }
      /* an action that consumes hours of its own says so, and the hours are spent once */
      for (const [rid, amount] of Object.entries(a.resourceUse)) {
        const r = byResource.get(rid);
        if (r) r.extraUsePerMonth[m] += (nn(amount) ?? 0) * share;
      }
      if (a.change.contactsDelta && a.change.channel) {
        const ch = channels.find((x) => x.id === a.change.channel);
        if (ch) ch.extraContacts[m] += (nn(a.change.contactsDelta) ?? 0) * share;
      }
    }
    if (a.setupCost) oneOffByMonth[a.startMonth] += a.setupCost;
    if (a.change.expenseRemovedPerMonth !== undefined && baseFixed !== null) {
      for (let m = Math.max(1, a.startMonth); m <= H; m += 1) stepByMonth[m] -= (nn(a.change.expenseRemovedPerMonth) ?? 0) * rampShare(a, m);
    }
  }

  /* --- the sales cycle, in whole months, so today's outreach is not today's delivered work (Task 27) --- */
  const cycleWeeks = inp.lags.outreachToWinWeeks + inp.lags.winToDeliveryWeeks;
  const cycleMonths = Math.round(cycleWeeks / WEEKS_PER_MONTH);
  const setupMonths = Math.round(inp.lags.setupWeeks / WEEKS_PER_MONTH);
  /* new customers won in month m arrive for delivery in month m + cycleMonths. A month past the horizon is an
     open opportunity, not a lost one, and it is reported rather than dropped */
  const newCustomersByMonth = new Array(H + 2).fill(0);
  let openAfterHorizon = 0;

  /* where the work has an explicit dependency chain, the earliest completed unit is the end of that chain, not
     month one and not a fixed ramp (Fixture H). Nothing is delivered or collected before it */
  let criticalPath = null;
  if (inp.criticalPathSteps && inp.criticalPathSteps.length) {
    const cp = calc.criticalPath(inp.criticalPathSteps);
    const completionWeek = cp.byId[inp.completionStepId] ?? cp.finishWeek;
    const receiptWeek = cp.byId[inp.receiptStepId] ?? cp.finishWeek;
    const toPeriods = (weeks) => Math.max(1, Math.ceil(weeks / (inp.period === 'week' ? 1 : WEEKS_PER_MONTH)));
    criticalPath = {
      steps: cp.steps,
      earliestCompletionWeek: completionWeek, earliestReceiptWeek: receiptWeek,
      earliestDeliveryMonth: toPeriods(completionWeek), earliestReceiptMonth: toPeriods(receiptWeek),
      note: 'derived from the dependencies given, not from a fixed ramp',
    };
  }
  const firstDeliveryMonth = criticalPath ? criticalPath.earliestDeliveryMonth : 1;

  /* --- the months --- */
  const months = [];
  let backlog = numOf(inp.openingBacklog) ?? 0;
  let recurringCustomers = inp.recurring && isKnown(inp.recurring.openingCustomers) ? inp.recurring.openingCustomers.value : null;
  const receipts = new Array(H + 2).fill(0);
  const receiptLag = numOf(inp.cash.receiptLagMonths);
  const paymentLag = numOf(inp.cash.paymentLagMonths) ?? 0;
  const payments = new Array(H + 2).fill(0);
  if (receiptLag === null && isKnown(inp.cash.opening)) need('receiptLag', 'how long customers take to pay');

  for (const p of inp.cash.prepayments) {
    receipts[p.startMonth] += p.amount;                 // cash lands once, at the start
  }
  for (const p of inp.cash.scheduled) {
    if (p.kind === 'receipt') receipts[p.month] += p.amount; else payments[p.month] += p.amount;
  }
  for (const f of inp.cash.confirmedFunding) receipts[f.month] += f.amount;
  if (isKnown(inp.cash.openingReceivables)) receipts[1] += inp.cash.openingReceivables.value;
  if (isKnown(inp.cash.openingPayables)) payments[1] += inp.cash.openingPayables.value;

  let cash = numOf(inp.cash.opening);
  const cashKnown = cash !== null;

  for (let m = 1; m <= H; m += 1) {
    const openingBacklog = backlog;
    const openingCustomersThisMonth = recurringCustomers;
    /* a channel's own contribution first, because a win in this month is demand for a later one.
       Unique people, not messages sent, and a list that can run out (Task 27) */
    let channelOpportunities = 0, channelReachable = true, grossReached = 0, uniqueReachedNow = 0, overlapKnown = true;
    const reachedByChannel = [];
    for (const ch of channels) {
      if (m < ch.startMonth + setupMonths) continue;
      const want = ch.contactsPerMonth + ch.extraContacts[m];
      const left = ch.listSize === null ? Infinity : Math.max(0, ch.listSize + ch.replenish * (m - 1) - ch.reached);
      const reachedNow = Math.min(want, left);
      if (ch.listSize !== null && reachedNow < want && ch.exhaustedMonth === null) ch.exhaustedMonth = m;
      ch.reached += reachedNow;
      grossReached += reachedNow;
      reachedByChannel.push({ id: ch.id, reach: reachedNow });
      if (rateKnown(ch.opportunityRate)) channelOpportunities += reachedNow * ch.opportunityRate.value;
      else channelReachable = false;
    }
    /* the same person reached by two routes is one person. A known overlap subtracts once; an unknown overlap
       is a bound, and the unreduced figure is not used as if the routes were independent */
    if (reachedByChannel.length > 1) {
      const u = calc.uniqueReach(reachedByChannel, inp.overlaps.map((o) => ({ ...o, people: o.people === null ? null : o.people / Math.max(1, H) })));
      overlapKnown = u.overlapKnown;
      uniqueReachedNow = u.overlapKnown ? u.unique.value : null;
      if (u.overlapKnown && grossReached > 0) channelOpportunities *= uniqueReachedNow / grossReached;
      else if (!u.overlapKnown) need('channelOverlap', 'how many people your routes reach in common, so they are not counted twice');
    } else uniqueReachedNow = grossReached;

    if (channels.length && channelReachable && baseWinRate !== null && overlapKnown) {
      const wins = channelOpportunities * (winRateByMonth[m] ?? baseWinRate);
      const landsIn = m + cycleMonths;
      if (landsIn <= H) newCustomersByMonth[landsIn] += wins; else openAfterHorizon += wins;
    }

    /* demand for delivery this month: new customers whose sale has closed, repeat orders from the eligible base,
       and customers who have come back. Each is counted once and reported separately */
    const monthBase = inp.demandByMonth ? (inp.demandByMonth[m - 1] ?? 0) : baseDemand;
    let demand = monthBase === null || monthBase === undefined ? null : monthBase * demandMultiplierByMonth[m] + demandAddByMonth[m];
    if (demand !== null && numOf(inp.demandGrowthPerMonth)) demand *= (1 + numOf(inp.demandGrowthPerMonth)) ** (m - 1);
    const newCustomers = newCustomersByMonth[m];
    const repeatOrders = inp.repeatPurchase && isKnown(inp.repeatPurchase.eligibleCustomers) && isKnown(inp.repeatPurchase.ordersPerCustomerPerMonth)
      ? inp.repeatPurchase.eligibleCustomers.value * inp.repeatPurchase.ordersPerCustomerPerMonth.value : 0;
    const reactivated = numOf(inp.reactivationsPerMonth) ?? 0;
    if (newCustomers || repeatOrders || reactivated) demand = (demand ?? 0) + newCustomers + repeatOrders + reactivated;
    /* nothing can be completed before the dependency chain allows it */
    if (demand !== null && m < firstDeliveryMonth) demand = 0;

    /* recurring: the stock identity, with billing timing kept explicit */
    let recurringRow = null;
    if (inp.recurring && recurringCustomers !== null) {
      const r = calc.recurringMonth({
        openingCustomers: recurringCustomers,
        cancellations: numOf(inp.recurring.cancellationsPerMonth) ?? 0,
        starts: numOf(inp.recurring.startsPerMonth) ?? 0,
        reactivations: numOf(inp.recurring.reactivationsPerMonth) ?? 0,
        pricePerMonth: numOf(inp.recurring.pricePerMonth),
        cancelBeforeBilling: inp.recurring.cancelBeforeBilling,
        startsBilledThisMonth: inp.recurring.startsBilledThisMonth,
      });
      recurringRow = r;
      recurringCustomers = r.closingCustomers;
    }

    /* delivery: resource by resource, converted into deliverable units in each resource's own terms */
    const resourceRows = {};
    let capacityUnits = Infinity, bindingResource = null;
    for (const r of resources) {
      const available = r.availablePerMonth === null ? null
        : Math.max(0, r.availablePerMonth + r.addedPerMonth[m] + r.redeployedPerMonth[m] - r.removedPerMonth[m]);
      const committed = r.committedPerMonth + r.extraUsePerMonth[m];
      resourceRows[r.id] = { needed: null, available, committed, unit: r.unit, period: r.period, freed: r.freedPerMonth[m], redeployed: r.redeployedPerMonth[m] };
      if (available === null || r.perUnit === null || r.perUnit <= 0) continue;
      const forDelivery = available - committed;
      const units = forDelivery / r.perUnit;
      if (units < capacityUnits) { capacityUnits = units; bindingResource = r.id; }
    }
    const capacity = Number.isFinite(capacityUnits) ? Math.max(0, capacityUnits) : null;

    const wanted = demand === null ? null : demand + backlog;
    /* completed work is a whole number; expected demand is not. The floor is taken once, here, not at each stage */
    let delivered = wanted === null ? null : (capacity === null ? wanted : Math.min(wanted, Math.floor(capacity)));
    if (delivered !== null && capacity === null) delivered = wanted;
    let declinedUnits = 0, lostUnits = 0;
    if (wanted !== null && delivered !== null) {
      const excess = wanted - delivered;
      if (excess > 0) {
        if (inp.excessDemand === 'decline') { declinedUnits = excess; backlog = 0; }
        else if (inp.excessDemand === 'lose') { lostUnits = excess; backlog = 0; }
        else backlog = excess;
      } else backlog = 0;
    }

    for (const r of resources) {
      const row = resourceRows[r.id];
      if (row && r.perUnit !== null && delivered !== null) row.needed = delivered * r.perUnit + row.committed;
      /* a resource whose need or availability cannot be stated is not reported as if it could: it leaves the
         schedule and appears as a missing requirement instead of a figure */
      if (row && (row.needed === null || row.available === null)) {
        delete resourceRows[r.id];
        need(`resource:${r.id}`, `what ${r.name} has available and what one unit of work takes from it`);
      }
    }

    const rowPrice = priceByMonth[m] ?? price;
    let revenue = null, variableCostTotal = null;
    if (inp.recurring && recurringRow && recurringRow.earnedRevenue !== null) {
      revenue = recurringRow.earnedRevenue;
      variableCostTotal = baseVariable !== null && recurringRow.billedCustomers !== null ? baseVariable * recurringRow.billedCustomers : null;
    } else if (delivered !== null && rowPrice !== null) {
      revenue = delivered * rowPrice;
      variableCostTotal = baseVariable === null ? null : delivered * baseVariable;
    }
    /* a prepayment is earned evenly over the months it covers, never booked again as a run rate */
    let prepaidEarnedThisMonth = 0;
    for (const p of inp.cash.prepayments) {
      if (m >= p.startMonth && m < p.startMonth + p.months) { revenue = (revenue ?? 0) + p.amount / p.months; prepaidEarnedThisMonth += p.amount / p.months; }
    }

    /* a prepayment's cash landed when it was collected. Its earned twelfth must not be collected a second time */
    const revenueToCollect = revenue === null ? null : revenue - prepaidEarnedThisMonth;
    const contribution = revenue === null || variableCostTotal === null ? null : revenue - variableCostTotal;
    const acquisitionCost = acquisitionByMonth[m];
    const acquisitionPerUnitCost = isKnown(inp.acquisitionPerUnit) && delivered !== null ? inp.acquisitionPerUnit.value * delivered : 0;
    const fixedCost = fixed;
    const stepCost = stepByMonth[m];
    const operatingResult = contribution === null || fixedCost === null ? null
      : contribution - acquisitionCost - acquisitionPerUnitCost - fixedCost - stepCost;

    /* cash: incurred costs are recognised above, their payment is scheduled here, and each one lands once */
    if (revenueToCollect !== null && receiptLag !== null) receipts[m + Math.round(receiptLag)] += revenueToCollect;
    const cashCostsThisMonth = (variableCostTotal ?? 0) + acquisitionCost + acquisitionPerUnitCost + (fixedCost ?? 0) + stepCost;
    payments[m + Math.round(paymentLag)] += cashCostsThisMonth;
    payments[m] += oneOffByMonth[m];
    const monthReceipts = receipts[m];
    const monthPayments = payments[m];
    if (cashKnown) cash = cash + monthReceipts - monthPayments;

    const row = {
      month: m, dates: null, period: inp.period,
      demand: demand === null ? null : round2(demand),
      /* the order stock, in the brief's terms: opening + accepted - fulfilled - cancelled = closing */
      openingBacklog: round2(openingBacklog),
      accepted: demand === null ? null : round2(demand),
      fulfilled: delivered === null ? null : round2(delivered),
      cancelledOrders: round2(declinedUnits + lostUnits),
      delivered: delivered === null ? null : round2(delivered),
      backlog: round2(backlog), declined: round2(declinedUnits), lost: round2(lostUnits),
      capacity: capacity === null ? null : round2(capacity), bindingResource,
      revenue: revenue === null ? null : round2(revenue),
      variableCost: variableCostTotal === null ? null : round2(variableCostTotal),
      contribution: contribution === null ? null : round2(contribution),
      acquisitionCost: round2(acquisitionCost + acquisitionPerUnitCost),
      fixedCost: fixedCost === null ? null : round2(fixedCost),
      stepCost: round2(stepCost),
      operatingResult: operatingResult === null ? null : round2(operatingResult),
      receipts: round2(monthReceipts), payments: round2(monthPayments),
      closingCash: cashKnown ? round2(cash) : null,
      resources: resourceRows,
      customers: { newFromAcquisition: round2(newCustomers), repeatOrders: round2(repeatOrders), reactivatedCustomers: round2(reactivated) },
      reach: { gross: round2(grossReached), unique: uniqueReachedNow === null ? null : round2(uniqueReachedNow), overlapKnown },
      channels: channels.map((ch) => ({ id: ch.id, uniqueReached: ch.reached, listSize: ch.listSize, exhaustedMonth: ch.exhaustedMonth })),
    };
    /* the customer stock is published only where there is one, so no scenario reports a closing count it has
       not built from an opening count, starts, reactivations and cancellations */
    if (recurringRow && recurringRow.closingCustomers !== null) {
      Object.assign(row, {
        openingCustomers: round2(openingCustomersThisMonth),
        starts: round2(numOf(inp.recurring.startsPerMonth) ?? 0),
        reactivations: round2(numOf(inp.recurring.reactivationsPerMonth) ?? 0),
        cancellations: round2(numOf(inp.recurring.cancellationsPerMonth) ?? 0),
        closingCustomers: round2(recurringRow.closingCustomers),
        billedCustomers: round2(recurringRow.billedCustomers),
        /* a run rate, not the month's revenue: the two are different numbers and both are shown */
        closingMRR: round2(recurringRow.closingMRR),
      });
    }
    months.push(row);
  }

  /* a step that waits on another is a dependency the reader can see, whether it came from an action or from the
     critical path of the work itself */
  if (criticalPath) {
    for (const s of inp.criticalPathSteps) {
      if ((s.after || []).length) dependencies.push({ step: s.id, label: s.label ?? s.id, weeks: nn(s.weeks), after: s.after, finishWeek: criticalPath.steps.find((x) => x.id === s.id)?.finishWeek ?? null });
    }
  }
  return {
    months, resources, channels, unmetRequirements: unmet, dependencies, assumptionIds, receiptLag, cashKnown,
    cycleMonths, setupMonths, openAfterHorizon: round2(openAfterHorizon), criticalPath,
  };
}

/* ---------------------------------------------------------------- 10. dates (D7: generated, never hardcoded) */
function monthDates(startDate, index) {
  const base = startDate ? new Date(startDate) : new Date();
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + index, 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const fmt = (x) => `${x.getUTCDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  return { from: d.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), label: `${d.getUTCDate()} to ${fmt(end)}` };
}

/* ---------------------------------------------------------------- 11. scenario (Tasks 27 to 31, 34) */
function scenario(state, plan) {
  const inp = readInputs(state);
  const base = baseline(state);
  const actions = readActions(plan);
  const built = buildSchedule(inp, actions, base);
  const H = inp.horizonMonths;

  built.months.forEach((row, i) => { row.dates = monthDates(inp.scope.startDate, i); });

  const knownMonths = built.months.filter((m) => m.operatingResult !== null);
  const totals = {
    revenue: built.months.every((m) => m.revenue === null) ? null : sum(built.months.map((m) => m.revenue ?? 0)),
    contribution: built.months.every((m) => m.contribution === null) ? null : sum(built.months.map((m) => m.contribution ?? 0)),
    operatingResult: knownMonths.length === built.months.length ? round2(sum(built.months.map((m) => m.operatingResult))) : null,
    cashLow: built.cashKnown ? Math.min(...built.months.map((m) => m.closingCash)) : null,
    fundingRequired: null,
    ownerHours: isKnown(inp.ownerHoursPerMonth) ? inp.ownerHoursPerMonth.value * H : null,
  };
  /* Task 29. Computed on the schedule before any additional financing, with confirmed funding already in it.
     A modelled shortfall is a planning signal, never an authorised overdraft, and nothing here fills it */
  if (built.cashKnown) {
    const buffer = numOf(inp.cash.minimumBuffer) ?? 0;
    totals.fundingRequired = Math.max(0, buffer - totals.cashLow);
  }

  /* baseline versus plan, over the same horizon and the same assumptions. Hours are counted too, because unpaid
     founder labour is a cost of a plan even when it never reaches the operating result (Task 29) */
  const hoursNeeded = (rows) => sum(rows.map((m) => sum(Object.values(m.resources || {}).filter((r) => /hour/i.test(r.unit || '')).map((r) => r.needed ?? 0))));
  let baselineVsPlan = { revenue: null, operatingResult: null, ownerHours: null };
  if (actions.length) {
    const flat = buildSchedule(inp, [], base);
    const bRevenue = sum(flat.months.map((m) => m.revenue ?? 0));
    const bResult = flat.months.every((m) => m.operatingResult !== null) ? sum(flat.months.map((m) => m.operatingResult)) : null;
    const bHours = hoursNeeded(flat.months), pHours = hoursNeeded(built.months);
    baselineVsPlan = {
      revenue: totals.revenue === null ? null : round2(totals.revenue - bRevenue),
      operatingResult: totals.operatingResult === null || bResult === null ? null : round2(totals.operatingResult - bResult),
      ownerHours: bHours || pHours ? round2(pHours - bHours) : null,
      baselineRevenue: round2(bRevenue), baselineOperatingResult: bResult === null ? null : round2(bResult),
      baselineOwnerHours: bHours || null, planOwnerHours: pHours || null,
    };
  }

  const binding = constraintsOf(built.months);
  const modeChoice = chooseMode(base, inp, actions.length > 0);

  /* feasibility. A plan that goes below its buffer is a funding-requirements illustration, not a recommendation */
  let feasibility = 'feasible_under_assumptions';
  const reasons = [];
  if (built.unmetRequirements.length) {
    feasibility = 'not_established';
    reasons.push(...built.unmetRequirements.map((u) => `not established: ${u.text} is not known`));
  }
  if (totals.fundingRequired !== null && totals.fundingRequired > 0) {
    feasibility = 'blocked';
    reasons.push(`blocked on cash: the lowest scheduled balance is ${money(totals.cashLow)} and ${money(totals.fundingRequired)} of additional funding is required before this plan can be run. Nothing here supplies it`);
  }
  /* Task 29. If a material cash figure is unknown, cash feasibility is incomplete and the plan is not described
     as funded. Unknown cash is never read as zero funding required, and never as unlimited funding */
  if (!built.cashKnown && (inp.raw?.econ?.cash || inp.cash.scheduled.length || inp.cash.prepayments.length)) {
    if (feasibility === 'feasible_under_assumptions') feasibility = 'not_established';
    reasons.push('cash feasibility is incomplete: cash available today has not been given, so no cash schedule was built and no funding requirement can be stated');
  } else if (!built.cashKnown && isKnown(inp.price)) {
    reasons.push('no cash schedule was built: cash available today has not been given');
  }
  const overcommitted = built.months.filter((m) => Object.values(m.resources).some((r) => r.needed !== null && r.available !== null && r.needed > r.available + 1e-9));
  if (overcommitted.length) reasons.push(`existing commitments and planned work exceed the resource available in ${plural(overcommitted.length, 'month', 'months')}`);

  const sensitivities = buildSensitivities(inp, base, actions, totals);
  const limiting = findLimiting(inp, base, built, totals, binding, sensitivities);

  const sc = {
    id: plan?.id ?? (actions.length ? `plan-${actions.map((a) => a.id).join('+')}` : 'baseline'),
    mode: modeChoice.mode, modeLabel: MODE_LABEL[modeChoice.mode], modeNote: MODE_NOTES[modeChoice.mode], modeReason: modeChoice.reason,
    simulation: SIMULATION, interval: null, probability: null,
    scope: base.scope, units: base.unit, currency: inp.currency, period: inp.period,
    openingCash: numOf(inp.cash.opening), cash: { opening: numOf(inp.cash.opening), minimumBuffer: numOf(inp.cash.minimumBuffer) },
    criticalPath: built.criticalPath,
    inputRevision: inp.revision, modelVersion: MODEL_VERSION,
    assumptionIds: [...new Set(built.assumptionIds)],
    evidenceIds: Object.entries(base.values).filter(([, f]) => f && f.state === OBSERVED).map(([k]) => k),
    months: built.months, totals, baselineVsPlan,
    binding, unmetRequirements: built.unmetRequirements, dependencies: built.dependencies,
    sensitivities, limiting,
    /* Task 34's last two outputs: the evidence that could change the recommendation, and the one fact worth
       asking for. One fact, not every missing field */
    whatWouldChangeThis: whatWouldChange(inp, base, built, sensitivities, modeChoice),
    suggestedFact: suggestFact(inp, base, built, sensitivities),
    timing: { salesCycleMonths: built.cycleMonths, setupMonths: built.setupMonths, openOpportunitiesBeyondHorizon: built.openAfterHorizon },
    feasibility, reasons,
    reconciliation: base.reconciliation,
    channels: built.channels.map((ch) => ({ id: ch.id, name: ch.name, listSize: ch.listSize, uniqueReached: round2(ch.reached), exhaustedMonth: ch.exhaustedMonth })),
    finding: null, firstAction: null, detail: null,
    validatedForecastAvailable: !VALIDATED_FORECAST_UNREACHABLE,
  };
  Object.assign(sc, plainWords(sc, base, actions));
  sc.invariants = checkInvariants(sc, inp);
  if (sc.invariants.violations.length) {
    sc.feasibility = 'not_established';
    sc.reasons.push(...sc.invariants.violations.map((v) => `invariant: ${v}`));
  }
  return sc;
}

/** one binding row per resource per month, in the resource's own unit */
function constraintsOf(months) {
  const out = [];
  for (const m of months) {
    for (const [id, r] of Object.entries(m.resources || {})) {
      if (r.needed === null || r.available === null) continue;
      out.push({ resource: id, needed: round2(r.needed), available: round2(r.available), binding: r.needed >= r.available - 1e-9, month: m.month, unit: r.unit });
    }
  }
  return out;
}
function constraints(sc) { return sc?.binding ?? constraintsOf(sc?.months ?? []); }

/** driver sensitivities in meaningful units, each one a rerun of the same schedule with the constraints reapplied */
function buildSensitivities(inp, base, actions, totals) {
  if (totals.operatingResult === null) return [];
  const out = [];
  const tryOne = (driver, unit, step, mutate) => {
    const clone = JSON.parse(JSON.stringify({ ...inp, raw: null, winRate: inp.winRate }));
    clone.raw = inp.raw;
    mutate(clone);
    try {
      const s = buildSchedule(clone, actions, base);
      if (s.months.some((m) => m.operatingResult === null)) return;
      const after = sum(s.months.map((m) => m.operatingResult));
      out.push({ driver, unit, step, effect: round2(after - totals.operatingResult) });
    } catch (e) { /* a driver that cannot be moved is simply not listed */ }
  };
  if (isKnown(inp.price)) tryOne('price', `${inp.currency} per unit`, +0.1 * inp.price.value, (c) => { c.price = fig(inp.price.value * 1.1, ESTIMATED, 'price 10% higher, demand held: a price rise may change how many buy'); });
  if (isKnown(inp.variableCost)) tryOne('cost of delivering one', `${inp.currency} per unit`, +0.1 * inp.variableCost.value, (c) => { c.variableCost = fig(inp.variableCost.value * 1.1, ESTIMATED, 'cost 10% higher'); });
  if (isKnown(inp.demandPerMonth) || isKnown(inp.opportunitiesPerMonth)) {
    tryOne('demand', 'units a month', '+10%', (c) => {
      if (isKnown(inp.demandPerMonth)) c.demandPerMonth = fig(inp.demandPerMonth.value * 1.1, ESTIMATED, 'demand 10% higher');
      else c.opportunitiesPerMonth = fig(inp.opportunitiesPerMonth.value * 1.1, ESTIMATED, 'opportunities 10% higher');
    });
  }
  const r0 = inp.resources[0];
  if (r0 && isKnown(r0.availablePerPeriod)) {
    tryOne('capacity', r0.unit, '+10%', (c) => { c.resources[0].availablePerPeriod = fig(r0.availablePerPeriod.value * 1.1, ESTIMATED, 'capacity 10% higher'); });
  }
  return out.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
}

/** the handful of assumptions actually driving the result, so "What needs to be true" can open onto something
    real rather than a list of every field (Task 34) */
function whatWouldChange(inp, base, built, sensitivities, modeChoice) {
  const out = [];
  for (const [k, f] of Object.entries(base.values)) {
    if (!f || f.state !== ESTIMATED) continue;
    out.push({ id: k, what: `${k} is estimated, not observed`, basis: f.basis, wouldChangeIf: 'you give the figure you actually see' });
  }
  if (base.reconciliation && !base.reconciliation.resolved) {
    out.push({ id: 'reconciliation', what: 'the revenue given and the revenue your sales and price account for are different numbers', basis: base.reconciliation.note, wouldChangeIf: 'the difference is explained or one figure is corrected' });
  }
  for (const u of built.unmetRequirements) out.push({ id: u.id, what: `${u.text} is not known`, basis: null, wouldChangeIf: 'you give it' });
  for (const s of sensitivities.slice(0, 3)) {
    out.push({ id: `sensitivity:${s.driver}`, what: `${s.driver} ${typeof s.step === 'string' ? s.step : `by ${round2(s.step)}`} moves the operating result by ${money(s.effect)}`, basis: 'the same schedule rerun with the constraints reapplied', wouldChangeIf: 'the driver turns out different from the figure used' });
  }
  if (modeChoice.mode !== 'operating_scenario') out.push({ id: 'mode', what: `this is an ${MODE_LABEL[modeChoice.mode].toLowerCase()}`, basis: modeChoice.reason, wouldChangeIf: 'the baseline reconciles and the drivers are figures you gave' });
  return out;
}

/** one fact, chosen because it could change the decision. Never a request for every missing field (Task 32) */
function suggestFact(inp, base, built, sensitivities) {
  if (built.unmetRequirements.length) {
    const u = built.unmetRequirements[0];
    return { id: u.id, ask: u.text, why: 'without it there is no figure to act on', kind: 'fact' };
  }
  if (base.reconciliation && !base.reconciliation.resolved) {
    return { id: 'reconciliation', ask: 'where the unexplained revenue comes from', why: 'until it is explained only part of the business is being modelled', kind: 'fact' };
  }
  const top = sensitivities[0];
  if (top && Math.abs(top.effect) > 0) {
    return { id: `sensitivity:${top.driver}`, ask: `a measured figure for ${top.driver}`, why: `it moves the operating result by ${money(top.effect)}, more than anything else tested`, kind: 'fact' };
  }
  return { id: 'test', ask: 'a small bounded test of the change you are least sure about', why: 'nothing tested moves the result enough to settle it on the figures given', kind: 'experiment' };
}

/** Task 32. The limiting mechanism, not the lowest-looking score. An operating bottleneck is something the
    business can act on; an evidence gap is the model not being able to tell two explanations apart, and the
    answer to that is one fact or one small test, never a longer questionnaire */
function findLimiting(inp, base, built, totals, binding, sensitivities) {
  if (built.unmetRequirements.length) {
    const u = built.unmetRequirements[0];
    return { kind: 'evidence_gap', what: `the model cannot separate the possible explanations while ${u.text} is not known`, resolvedBy: `give ${u.text}`, competing: built.unmetRequirements.map((x) => x.text) };
  }
  if (base.reconciliation && !base.reconciliation.resolved) {
    return { kind: 'evidence_gap', what: 'the revenue given and the revenue the sales and price account for are different numbers', resolvedBy: 'say where the difference comes from, or correct one of the figures', competing: base.reconciliation.candidates };
  }
  if (totals.fundingRequired) {
    return { kind: 'operating_bottleneck', what: 'cash timing', detail: `the lowest scheduled balance is ${money(totals.cashLow)} against a buffer of ${money(numOf(inp.cash.minimumBuffer) ?? 0)}`, resolvedBy: 'payment terms, spending, scope, or confirmed funding' };
  }
  const bound = binding.filter((b) => b.binding);
  if (bound.length) {
    const first = bound[0];
    const r = inp.resources.find((x) => x.id === first.resource);
    /* where one shared resource binds, contribution per unit of that resource compares offers on the thing that
       is actually scarce. It is not a universal ranking rule and it does not replace demand or commitments */
    const contributionPerUnit = isKnown(inp.price) && isKnown(inp.variableCost) ? inp.price.value - inp.variableCost.value : null;
    const perResource = contributionPerUnit !== null && r && numOf(r.perUnit) ? contributionPerUnit / numOf(r.perUnit) : null;
    return {
      kind: 'operating_bottleneck', what: first.resource,
      detail: `${first.resource} is fully used from month ${first.month}: ${round2(first.needed)} needed against ${round2(first.available)} ${first.unit} available`,
      scarceResource: perResource === null ? null : { id: first.resource, unit: r.unit, contributionPerUnitOfResource: round2(perResource) },
      resolvedBy: 'more of that resource, less demand on it, or a higher contribution from each unit of it',
    };
  }
  const weakDemand = built.months.every((m) => m.capacity === null || m.demand === null || m.demand < m.capacity * 0.6);
  if (weakDemand && built.months.some((m) => m.capacity !== null)) {
    return { kind: 'operating_bottleneck', what: 'demand', detail: 'capacity is not the limit: there is room to deliver more than is being asked for', resolvedBy: 'more qualified demand, a better conversion, or a smaller cost base' };
  }
  if (sensitivities.length && Math.abs(sensitivities[0].effect) > 0) {
    return { kind: 'operating_bottleneck', what: sensitivities[0].driver, detail: `${sensitivities[0].driver} moves the operating result more than anything else tested`, resolvedBy: null };
  }
  return { kind: 'evidence_gap', what: 'nothing tested moves the result enough to call it the limit', resolvedBy: 'a bounded test on the driver you are least sure about', competing: [] };
}

/** the plain sentences. One finding, one next action, the rest behind detail (Task 34) */
function plainWords(sc, base, actions) {
  const m1 = sc.months[0] || {};
  const bind = sc.binding.filter((b) => b.binding);
  const firstBind = bind[0] ?? null;
  let finding;
  if (sc.reconciliation && !sc.reconciliation.resolved && sc.reconciliation.gap !== null) {
    finding = `${money(Math.abs(sc.reconciliation.gap))} of the revenue you gave is not explained by your sales and price.`;
  } else if (sc.totals.fundingRequired) {
    finding = `This plan needs ${money(sc.totals.fundingRequired)} of funding before it can run: the lowest scheduled balance is ${money(sc.totals.cashLow)}.`;
  } else if (firstBind) {
    finding = `${firstBind.resource} limits what can be completed from month ${firstBind.month}.`;
  } else if (sc.totals.operatingResult !== null) {
    finding = `Over ${plural(sc.months.length, 'month', 'months')} this scenario gives an operating result of ${money(sc.totals.operatingResult)} before financing, tax and owner withdrawals.`;
  } else {
    finding = `Not enough is known to put a figure on the result: ${sc.unmetRequirements.map((u) => u.text).join(', ')}.`;
  }
  /* the next action answers the finding, in the same order, so the two sentences are about the same thing */
  let firstAction;
  if (sc.reconciliation && !sc.reconciliation.resolved && sc.reconciliation.gap !== null) firstAction = 'Say where the unexplained revenue comes from, or correct the figure.';
  else if (sc.totals.fundingRequired) firstAction = 'Change the payment terms, the spending or the scope, or confirm the funding, before starting.';
  else if (firstBind) firstAction = `Decide what happens to the work beyond ${firstBind.available} ${firstBind.unit}: queue it, decline it or add resource.`;
  else if (sc.unmetRequirements.length) firstAction = `Give ${sc.unmetRequirements[0].text}.`;
  else firstAction = actions.length ? `Start with ${actions[0].label}.` : 'Nothing is blocking this scenario under the assumptions given.';
  const detail = [
    `Mode: ${sc.mode}. ${sc.modeNote}`,
    `Scope: ${base.scope.entity}, ${base.scope.period} periods, ${sc.months.length} months, ${base.scope.taxBasis}. Excluded: ${base.scope.excluded.join(', ')}.`,
    m1.revenue !== null ? `Month one: ${m1.delivered} ${sc.units} delivered, ${money(m1.revenue)} revenue, ${m1.contribution !== null ? `${money(m1.contribution)} contribution` : 'contribution not known'}.` : null,
    sc.totals.cashLow !== null ? `Lowest scheduled cash balance: ${money(sc.totals.cashLow)}.` : 'No cash schedule was built: cash available today has not been given.',
  ].filter(Boolean).join(' ');
  return { finding, firstAction, detail };
}

/* ---------------------------------------------------------------- 12. goal requirements (Task 32) */
/** inverse arithmetic. The goal is used here and nowhere else: it never touches a baseline or a scenario.
    A required denominator that is unknown or nonpositive returns the missing requirement, never a default */
function requirements(state, goal) {
  const inp = readInputs(state);
  const base = baseline(state);
  const g = typeof goal === 'number' ? { kind: 'revenue', amount: goal } : (goal || {});
  const kind = g.kind ?? 'revenue';
  const amount = nn(g.amount);
  const horizon = Math.max(1, Math.min(MAX_HORIZON, nn(g.horizonMonths) ?? inp.horizonMonths));
  const gaps = [];
  const required = { sales: null, opportunities: null, resource: null, cash: null };
  const notes = [];

  if (amount === null) {
    return { required, gaps: [{ id: 'goal', text: 'no target amount was given' }], verdict: 'not_supported', mode: 'requirements', modeNote: MODE_NOTES.requirements, reason: 'no target amount was given', currency: inp.currency, modelVersion: MODEL_VERSION };
  }

  const price = numOf(inp.price);
  const periodCosts = nn(g.periodCosts) ?? numOf(inp.fixedCosts);
  const contributionPerSale = nn(g.contributionPerSale)
    ?? (price !== null && numOf(inp.variableCost) !== null
      ? price - numOf(inp.variableCost) - (isKnown(inp.acquisitionPerUnit) ? inp.acquisitionPerUnit.value : 0)
      : null);

  if (kind === 'revenue') {
    if (price === null || price <= 0) gaps.push({ id: 'price', text: 'a price for what you sell, so the target can be turned into sales' });
    else required.sales = Math.ceil(amount / price);
  } else if (kind === 'contribution') {
    /* Fixture B. The volume that holds a contribution, not the volume that holds revenue: a 10% discount at a
       £30 unit contribution needs 50% more sales, never 10% */
    if (contributionPerSale === null) gaps.push({ id: 'contribution', text: 'what one sale contributes after the costs of delivering and winning it' });
    else if (contributionPerSale <= 0) {
      gaps.push({ id: 'contribution', text: 'one sale contributes nothing at these prices and costs, so no volume reaches the target' });
      notes.push('volume alone does not reach this target under the current economics');
    } else required.sales = Math.ceil(amount / contributionPerSale);
  } else if (kind === 'operating_result' || kind === 'profit') {
    if (contributionPerSale === null) gaps.push({ id: 'contribution', text: 'what one sale contributes after the costs of delivering and winning it' });
    else if (contributionPerSale <= 0) {
      gaps.push({ id: 'contribution', text: 'one sale contributes nothing at these prices and costs, so no volume reaches the target' });
      notes.push('volume alone does not reach this target under the current economics');
    } else if (periodCosts === null) gaps.push({ id: 'fixedCosts', text: 'your fixed costs for a month' });
    else required.sales = Math.ceil((periodCosts + amount) / contributionPerSale);
  } else {
    gaps.push({ id: 'kind', text: `a target of kind "${kind}" is not supported` });
  }

  const winRate = rateKnown(inp.winRate) ? inp.winRate.value : nn(g.winRate);
  if (required.sales !== null) {
    if (winRate === null || winRate <= 0) gaps.push({ id: 'winRate', text: 'how often a qualified opportunity becomes a sale' });
    else required.opportunities = Math.ceil(required.sales / winRate);
    const r0 = inp.resources[0];
    if (r0 && numOf(r0.perUnit) !== null) required.resource = { id: r0.id, unit: r0.unit, amount: round2(required.sales * numOf(r0.perUnit)) };
    else gaps.push({ id: 'resource', text: 'what one completed unit of work takes from your time or capacity' });
    if (numOf(inp.variableCost) !== null) required.cash = round2(required.sales * numOf(inp.variableCost));
  }

  /* check the requirement against reality: capacity, opportunities available, cash, and the sales cycle */
  const capacityUnits = (() => {
    const r0 = inp.resources[0];
    if (!r0 || !isKnown(r0.availablePerPeriod) || numOf(r0.perUnit) === null || numOf(r0.perUnit) <= 0) return null;
    const toMonth = r0.period === 'week' ? WEEKS_PER_MONTH : 1;
    const available = r0.availablePerPeriod.value * toMonth;
    const committed = sum(r0.commitments.map((c) => c.amount)) * toMonth;
    return Math.floor((available - committed) / numOf(r0.perUnit));
  })();
  if (required.sales !== null && capacityUnits !== null && required.sales > capacityUnits) {
    gaps.push({ id: 'capacity', text: `${plural(required.sales - capacityUnits, 'more sale', 'more sales')} of capacity a month than you have (${capacityUnits} available, ${required.sales} required)`, shortfall: required.sales - capacityUnits, unit: 'sales a month' });
  }
  if (required.opportunities !== null && isKnown(inp.opportunitiesPerMonth) && required.opportunities > inp.opportunitiesPerMonth.value) {
    gaps.push({ id: 'opportunities', text: `${Math.ceil(required.opportunities - inp.opportunitiesPerMonth.value)} more qualified opportunities a month than you have (${inp.opportunitiesPerMonth.value} now, ${required.opportunities} required)`, shortfall: Math.ceil(required.opportunities - inp.opportunitiesPerMonth.value), unit: 'qualified opportunities a month' });
  }
  if (required.cash !== null && isKnown(inp.cash.opening) && required.cash > inp.cash.opening.value) {
    gaps.push({ id: 'cash', text: `${money(required.cash - inp.cash.opening.value)} more cash than you have available before the receipts arrive`, shortfall: round2(required.cash - inp.cash.opening.value), unit: inp.currency });
  }
  const cycleWeeks = inp.lags.setupWeeks + inp.lags.outreachToWinWeeks + inp.lags.winToDeliveryWeeks;
  if (cycleWeeks > horizon * WEEKS_PER_MONTH) {
    gaps.push({ id: 'timing', text: `the first completed work is ${round2(cycleWeeks)} weeks away, which is beyond the ${plural(horizon, 'month', 'months')} you asked about`, unit: 'weeks' });
  }

  const blocking = gaps.filter((x) => ['price', 'contribution', 'fixedCosts', 'winRate', 'resource', 'kind', 'goal'].includes(x.id));
  const hard = gaps.filter((x) => x.id === 'timing' || (x.id === 'contribution' && contributionPerSale !== null && contributionPerSale <= 0));
  const verdict = hard.length ? 'not_supported' : blocking.length ? 'not_supported' : gaps.length ? 'requires_changes' : 'supported';

  return {
    required, gaps, verdict, mode: 'requirements', modeNote: MODE_NOTES.requirements,
    currency: inp.currency, horizonMonths: horizon, modelVersion: MODEL_VERSION,
    target: { kind, amount, periodCosts, contributionPerSale, winRate },
    /* said plainly, and never as a prediction. Eighteen sales required is not eighteen customers buying */
    statement: required.sales !== null
      ? `${money(amount)} ${kind === 'revenue' ? 'of revenue' : 'of operating result'} a month requires about ${plural(required.sales, 'sale', 'sales')}${required.opportunities !== null ? `, which needs about ${plural(required.opportunities, 'qualified opportunity', 'qualified opportunities')}` : ''}. That is what the target would take, not what is expected to happen.`
      : `The target cannot be turned into a requirement yet: ${gaps.map((x) => x.text).join('; ')}.`,
    alternative: verdict === 'not_supported' && required.sales !== null && capacityUnits !== null
      ? { milestone: `a staged target of ${plural(capacityUnits, 'sale', 'sales')} a month, which is what current capacity supports`, sales: capacityUnits }
      : null,
    notes,
  };
}

/* ---------------------------------------------------------------- 13. comparing interventions (Task 30) */
/** each action against the same baseline, over the same horizon, after costs, delays and interactions.
    The combination is recomputed, never added up: Fixture A is the reason */
function compare(state, actions) {
  const list = readActions(actions);
  if (!list.length) return [];
  const baseSc = scenario(state, []);
  const baseResult = baseSc.totals.operatingResult;
  const baseCash = baseSc.totals.cashLow;

  const isolated = new Map();
  for (const a of list) {
    const sc = scenario(state, { id: `only-${a.id}`, actions: [a] });
    isolated.set(a.id, sc);
  }
  const combined = list.length > 1 ? scenario(state, { id: 'combined', actions: list }) : null;

  return list.map((a) => {
    const sc = isolated.get(a.id);
    const incrementalOperatingResult = sc.totals.operatingResult === null || baseResult === null ? null : round2(sc.totals.operatingResult - baseResult);
    const incrementalCash = sc.totals.cashLow === null || baseCash === null ? null : round2(sc.totals.cashLow - baseCash);
    const interactions = [];
    if (combined && combined.totals.operatingResult !== null && baseResult !== null) {
      const sumIsolated = sum(list.map((x) => (isolated.get(x.id).totals.operatingResult ?? baseResult) - baseResult));
      const joint = combined.totals.operatingResult - baseResult;
      const interaction = round2(joint - sumIsolated);
      if (Math.abs(interaction) > 0.005) {
        interactions.push({
          with: list.filter((x) => x.id !== a.id).map((x) => x.id),
          effect: interaction,
          note: interaction > 0
            ? `run together these actions are worth ${money(interaction)} more than adding them separately: one removes the limit that held the other back`
            : `run together these actions are worth ${money(-interaction)} less than adding them separately: they use the same time or money`,
        });
      }
    }
    const constraintsHit = [...new Set(sc.binding.filter((b) => b.binding).map((b) => b.resource))];
    /* a what-if calculation is not evidence that the action causes the change (Task 30) */
    const evidence = {
      state: a.evidence,
      note: a.evidence === 'observed' ? 'the size of this change is taken from something observed in this business'
        : a.evidence === 'external' ? 'the size of this change comes from outside this business and may not transfer'
        : 'the size of this change is assumed, not measured',
      breakEvenEffect: incrementalOperatingResult !== null && incrementalOperatingResult < 0 && (a.setupCost || a.recurringCost)
        ? `this action pays for itself only if it produces at least ${money(-incrementalOperatingResult)} more operating result over the horizon than modelled`
        : null,
      suggestedTest: a.evidence !== 'observed' ? 'run a small bounded test before committing, and review against the metric named on the action' : null,
    };
    return {
      action: a.id, label: a.label, driver: a.driver, mechanism: a.mechanism,
      incrementalOperatingResult, incrementalCash,
      startsMonth: a.startMonth, earliestEffectMonth: a.startMonth + a.rampMonths,
      setupCost: a.setupCost, recurringCost: a.recurringCost,
      constraintsHit, interactions, evidence,
      assumptionIds: a.assumptionIds,
      feasibility: sc.feasibility, mode: sc.mode,
      combinedOperatingResult: combined ? combined.totals.operatingResult : null,
    };
  });
}

/* ---------------------------------------------------------------- 14. invariants (Task 33) */
function checkInvariants(sc, inp) {
  const v = [];
  const near = (a, b) => Math.abs(a - b) < 0.01;

  let backlog = numOf(inp.openingBacklog) ?? 0;
  for (const m of sc.months) {
    if (m.demand !== null && m.delivered !== null) {
      /* stocks reconcile: opening + accepted - fulfilled - declined - lost = closing */
      const accepted = m.demand;
      const closing = backlog + accepted - m.delivered - m.declined - m.lost;
      if (!near(closing, m.backlog)) v.push(`backlog does not reconcile in month ${m.month}: ${backlog} + ${accepted} - ${m.delivered} - ${m.declined} - ${m.lost} is ${round2(closing)}, not ${m.backlog}`);
      backlog = m.backlog;
      /* adding capacity cannot create sales beyond demand */
      if (m.delivered > m.demand + (backlog === 0 ? 0 : Infinity) + 1e-9 && m.backlog === 0 && m.declined === 0 && m.lost === 0) {
        v.push(`month ${m.month} delivers ${m.delivered} against demand of ${m.demand}: capacity cannot create sales beyond demand`);
      }
    }
    if (m.delivered !== null && m.delivered < -1e-9) v.push(`month ${m.month} delivers a negative number of units`);
    if (m.recurring && m.recurring.closingCustomers !== null && m.recurring.closingCustomers < 0) v.push(`month ${m.month} has a negative customer count`);
    if (m.revenue !== null && m.variableCost !== null && m.contribution !== null && !near(m.revenue - m.variableCost, m.contribution)) {
      v.push(`month ${m.month}: contribution is not revenue less variable cost`);
    }
    if (m.contribution !== null && m.fixedCost !== null && m.operatingResult !== null
      && !near(m.contribution - m.acquisitionCost - m.fixedCost - m.stepCost, m.operatingResult)) {
      v.push(`month ${m.month}: the operating result does not equal contribution less acquisition, fixed and step costs`);
    }
    /* hours cannot be spent twice: across all resources in a month, no more hours are redeployed than were freed */
    const rows = Object.values(m.resources || {});
    const freed = sum(rows.map((r) => r.freed ?? 0));
    const redeployed = sum(rows.map((r) => r.redeployed ?? 0));
    if (redeployed > freed + 1e-9) v.push(`month ${m.month}: ${round2(redeployed)} hours are redeployed but only ${round2(freed)} were freed`);
  }
  /* cash reconciles month to month */
  if (sc.totals.cashLow !== null) {
    let running = numOf(inp.cash.opening);
    for (const m of sc.months) {
      running = running + m.receipts - m.payments;
      if (!near(running, m.closingCash)) { v.push(`cash does not reconcile in month ${m.month}`); break; }
    }
    const low = Math.min(...sc.months.map((m) => m.closingCash));
    if (!near(low, sc.totals.cashLow)) v.push('the lowest scheduled balance is not the minimum of the closing balances');
    const buffer = numOf(inp.cash.minimumBuffer) ?? 0;
    if (!near(Math.max(0, buffer - low), sc.totals.fundingRequired)) v.push('the additional funding required is not the buffer less the lowest scheduled balance');
  }
  /* unknown is never a number */
  if (!isKnown(inp.fixedCosts) && sc.totals.operatingResult !== null) v.push('an operating result was produced although fixed costs are not known');
  if (!isKnown(inp.cash.opening) && sc.totals.cashLow !== null) v.push('a cash low was produced although opening cash is not known');
  /* the goal never reaches a scenario */
  if (sc.scope && Object.prototype.hasOwnProperty.call(sc.scope, 'goal')) v.push('a goal reached the scenario scope');
  return { violations: v, checked: ['stocks reconcile', 'no negative counts', 'contribution identity', 'operating result identity', 'freed hours counted once', 'cash reconciles', 'funding requirement', 'unknown is not a number', 'the goal stays out'] };
}

/* ---------------------------------------------------------------- 15. the audit, as data (Task 25) */
/* the long form, with the reasoning, is notes/econ-audit.md. These are the same findings so the two cannot drift */
const AUDIT_FINDINGS = [
  ['E01', 'Blank monthly revenue is modelled as £100,000 a month', 'engine-pretty.js 5405 (fi=1e5), applied 5415', 'high', 'replace'],
  ['E02', 'Blank prospect count becomes 20,000 firms, so depletion can never bind', 'engine-pretty.js 3538 and 4792', 'high', 'replace'],
  ['E03', 'A stated close rate is multiplied by 0.72 before use, while the page prints the typed figure', 'engine-pretty.js 2912 biasFactors, 3104-3114, echoed at 5561', 'high', 'replace'],
  ['E04', 'Every prior is synthetic and says so in its own metadata', 'engine-pretty.js 2878-2899', 'high', 'replace'],
  ['E05', 'A blank growth budget becomes max(£500, 5% of revenue)', 'engine-pretty.js 5417', 'medium', 'replace'],
  ['E06', 'Blank team size and capacity become 3 people at 30 customers a month', 'engine-pretty.js 5405 (mi, hi)', 'medium', 'replace'],
  ['E07', 'A real £0 growth spend is sent to the engine as a penny', 'app.js 197', 'medium', 'replace'],
  ['E08', 'M4 makes revenue a straight multiple of spend, with no capacity or cost term', 'engine-pretty.js 3811-3845', 'high', 'replace'],
  ['E09', 'More marketing can never lower the result, because there is no result', 'engine.js has no cost side', 'high', 'replace'],
  ['E10', 'Price behaves as a pure multiplier on revenue, with demand held constant', 'plan.js 345-348', 'medium', 'replace'],
  ['E11', 'A twelve-month ceiling is printed beside a monthly headline', 'app.js 572, plan.js 267', 'high', 'replace'],
  ['E12', 'New customers, repeat orders and reactivations are not separated', 'engine-pretty.js 3129; no stock identity anywhere', 'high', 'replace'],
  ['E13', 'Reach is not deduplicated across channels, and four of eight channels never draw the list down', 'engine-pretty.js 2906 contactWeights, 5419-5427', 'high', 'replace'],
  ['E14', 'Initial outreach and follow-ups sit inside one opaque contact-to-reply rate', 'engine-pretty.js 3760-3810', 'medium', 'replace'],
  ['E15', 'Existing load is derived from revenue divided by price and then used as a binding constraint', 'engine-pretty.js 3397-3403, 4790; warning at app.js 597', 'medium', 'replace'],
  ['E16', 'The utilisation knee is a fixed 0.85 for every business', 'engine-pretty.js 2914, used 4790', 'medium', 'replace'],
  ['E17', 'The contact frequency cap is a fixed 4 a quarter and the horizon a fixed 12 months', 'engine-pretty.js 3773, 4792, 5353; app.js 919', 'medium', 'replace'],
  ['E18', 'Channel caps and TMA capacity are reported but cannot bind on this surface', 'engine-pretty.js 5423-5426, 4269-4277', 'low', 'keep as a scope note'],
  ['E19', 'There is no cost of any kind except the marketing budget; gross margin times revenue is exported as money kept', 'canopy.js 3259', 'high', 'replace'],
  ['E20', 'There is no cash schedule: no opening cash, terms, receipts, payments or funding requirement', 'engine.js, absent', 'high', 'replace'],
  ['E21', 'There is no backlog: demand above capacity stops appearing instead of queueing or being declined', 'engine-pretty.js 4133-4189', 'high', 'replace'],
  ['E22', 'Founder time is not modelled: the same hour can acquire and serve a customer', 'engine.js, absent', 'high', 'replace'],
  ['E23', 'Implementation delay is a fixed three-month ramp, not a critical path', 'engine-pretty.js 2914 rampLagMonths', 'high', 'replace'],
  ['E24', 'Payment timing does not exist; payback is a revenue payback, not a cash payback', 'canopy.js 1758', 'high', 'replace'],
  ['E25', 'The share of synthetic draws above the goal is shown as odds of reaching it', 'app.js 385-395', 'high', 'replace'],
  ['E26', 'Interval widening uses unsourced multipliers and the result is still shown as a share of runs', 'engine-pretty.js 3255', 'high', 'replace'],
  ['E27', 'The goal correctly never enters the engine, but the page presents the comparison as an outcome', 'engine-pretty.js 5441; app.js 370-383', 'medium', 'replace'],
  ['E28', 'Levers are separate plus or minus 10% reruns, presented as a list that reads as additive', 'plan.js 267-270', 'medium', 'replace'],
  ['E29', 'Cost per customer and return per pound have no undefined branch', 'canopy.js 2532', 'medium', 'replace'],
  ['E30', 'plan().acv and plan().close echo the typed input, not the posterior the simulation used', 'engine-pretty.js 5561', 'low', 'keep'],
].map(([id, what, where, severity, disposition]) => ({ id, what, where, severity, keep: disposition === 'keep', replace: disposition === 'replace', disposition }));

const CANNOT_EXPRESS = [
  'an operating result: there is no cost side, so profit, contribution and break-even do not exist',
  'a cash schedule: no opening cash, terms, receipts, payments, closing balance or funding requirement',
  'a backlog or waitlist: excess demand vanishes instead of queueing, being declined or being lost',
  'a resource schedule in hours: capacity is customers a month, and sales time and delivery time are the same hour',
  'cohorts: no opening base, starts, cancellations or reactivations, and no billing timing',
  'inventory, lead time, returns, shipping and payment fees',
  'step costs and hiring lag: a new server appears instantly and free',
  'a per-scenario output mode: one report, one implied strength of claim',
  'deduplicated reach across channels, or an exhaustible list for channels with contact weight zero',
  'business-model-specific mechanics: appointments, enterprise and product all run through one meeting funnel',
  'a horizon other than twelve months, or a weekly schedule',
  'sales tax: there is no VAT basis anywhere',
];

function audit() {
  return {
    findings: AUDIT_FINDINGS,
    scope: {
      audited: ['engine.js (frozen, via the line-broken copy scratchpad/engine-pretty.js)', 'plan.js', 'app.js call sites', 'canopy.js display and export'],
      note: 'the written audit is notes/econ-audit.md',
      cannotExpress: CANNOT_EXPRESS,
      modelVersion: MODEL_VERSION,
      high: AUDIT_FINDINGS.filter((f) => f.severity === 'high').length,
      total: AUDIT_FINDINGS.length,
    },
  };
}

/* ---------------------------------------------------------------- 15b. path arithmetic and staleness */
/** Fixture I. Each path is clipped at capacity and only then averaged. Clipping the average first reports ten
    where the answer is five, and that is the whole point of the case */
function expectedDelivered(demand, capacityArg, weightsArg) {
  const states = Array.isArray(demand) ? demand : (demand?.states ?? demand?.demand ?? []);
  const capacity = Array.isArray(demand) ? capacityArg : demand?.capacity;
  const weights = Array.isArray(demand) ? weightsArg : demand?.weights;
  const r = calc.expectedDelivered(states, capacity, weights);
  return r.expected;
}
/** Fixture I. A cumulative figure is the median of the path totals, never the sum of the monthly medians */
function medianOfPathTotals(paths, quantile) {
  return calc.summarisePaths(paths, quantile ?? 0.5).quantileOfPathTotals;
}
/** Task 33's last invariant. A result computed against an older revision cannot overwrite a newer answer, and
    the screen, the export and the TMA brief all check the same stamp */
function isStale(result, currentRevision) {
  const was = nn(result && result.inputRevision);
  const now = nn(currentRevision !== undefined ? currentRevision : M.revision);
  if (was === null || now === null) return false;
  return was < now;
}

/* ---------------------------------------------------------------- 16. the worked fixtures (Task 33) */
/* These are the brief's own numbers, transcribed, with the inputs in the shape this module reads. They are a data
   table on purpose: the tests feed `inputs` to the API and compare with `expected`, so nothing here can quietly
   agree with a wrong implementation. They are synthetic calculation cases, not forecasts or benchmarks. */
function fixtures() {
  const st = (econ) => ({ currency: 'GBP', econ });

  /* A. One offer at £1,000, £300 to deliver, so £700 a job. 20% of qualified enquiries convert. Acquisition is
     separately resourced and does not draw on the delivery hours here. Excess same-period demand is declined. */
  const winRate20 = { value: 0.2, numerator: 20, denominator: 100, period: 'month', segment: 'qualified enquiries', source: 'assumed for this synthetic case', state: 'estimated', basis: '20 of 100 qualified enquiries, measured over one month, assumed for this synthetic case' };
  const A = (over) => st(Object.assign({
    price: 1000, variableCost: 300, fixedCostsPerMonth: 2500, acquisitionPerMonth: 1000,
    opportunitiesPerMonth: 100, winRate: winRate20,
    excessDemand: 'decline', horizonMonths: 1, unit: 'completed jobs',
    resources: [{ id: 'delivery', name: 'Delivery', unit: 'completed jobs', period: 'month', availablePerPeriod: 12, perUnit: 1 }],
  }, over || {}));
  const A_STAFF = [{ id: 'extra-staff', label: 'Extra staff', amountPerMonth: 2000, fromMonth: 1, reason: 'a step cost that arrives before it fills with revenue' }];
  const A_BIGGER = [{ id: 'delivery', name: 'Delivery', unit: 'completed jobs', period: 'month', availablePerPeriod: 24, perUnit: 1 }];

  /* C. Opening cash £2,000. £6,000 of goods and £1,000 of operating costs are paid before any receipt; £10,000
     of goods is delivered in month one and collected in month two. */
  const C = (cash) => st({
    horizonMonths: 2, price: 10000, variableCost: 6000, demandByMonth: [1, 0], fixedCostsPerMonth: 0, unit: 'orders',
    stepCosts: [{ id: 'operating', label: 'Operating costs, month one only', amountPerMonth: 1000, fromMonth: 1, toMonth: 1 }],
    resources: [{ id: 'delivery', name: 'Delivery', unit: 'orders', period: 'month', availablePerPeriod: 1, perUnit: 1 }],
    cash,
  });

  /* E. Twenty working hours a week: four sales, three administration, three implementation, ten for delivery, at
     two hours a job. The brief states this case weekly, so the whole run is weekly. */
  const E = (demand, deliveryHours, adminHours) => st({
    period: 'week', horizonMonths: 1, price: 500, variableCost: 0, fixedCostsPerMonth: 0, acquisitionPerMonth: 0,
    demandPerMonth: demand, unit: 'completed jobs',
    resources: [
      { id: 'delivery', name: 'Delivery', unit: 'hours', period: 'week', availablePerPeriod: deliveryHours, perUnit: 2 },
      { id: 'administration', name: 'Administration', unit: 'hours', period: 'week', availablePerPeriod: adminHours, perUnit: 0 },
      { id: 'sales', name: 'Sales', unit: 'hours', period: 'week', availablePerPeriod: 4, perUnit: 0 },
      { id: 'implementation', name: 'Implementation', unit: 'hours', period: 'week', availablePerPeriod: 3, perUnit: 0 },
    ],
  });
  /* the automation carries no fee in this case, because the case is about hours. A real fee is counted separately */
  const AUTOMATE = [{
    id: 'automate-admin', label: 'Automate two hours of administration', driver: 'automation',
    mechanism: 'the admin task stops taking those hours and the hours move to delivery',
    change: { hoursSaved: { administration: 2 }, redeployTo: 'delivery' },
    setupCost: 0, recurringCost: 0, evidence: 'assumed', reviewMetric: 'hours spent on that task next week',
  }];

  return [
    {
      id: 'A', title: 'Marketing can reduce profit; combined effects are not additive',
      note: 'the joint improvement is £5,400 a month while the isolated changes add to only £2,600',
      state: A(), plan: null,
      actions: [
        { id: 'more-marketing', label: 'Double the marketing', driver: 'marketing',
          mechanism: 'twice the spend brings twice the qualified enquiries in this synthetic case',
          change: { spendDelta: 1000, opportunitiesDelta: 100 }, evidence: 'assumed',
          reviewMetric: 'qualified enquiries a month' },
        { id: 'more-capacity', label: 'Extra staff', driver: 'capacity',
          mechanism: 'twelve more jobs of delivery capacity, at a fixed £2,000 a month',
          change: { resourceDelta: { delivery: 12 } }, recurringCost: 2000, evidence: 'assumed',
          reviewMetric: 'jobs completed a month' },
      ],
      variants: {
        baseline: { state: A() },
        marketing: { state: A({ opportunitiesPerMonth: 200, acquisitionPerMonth: 2000 }) },
        capacity: { state: A({ resources: A_BIGGER, stepCosts: A_STAFF }) },
        both: { state: A({ opportunitiesPerMonth: 200, acquisitionPerMonth: 2000, resources: A_BIGGER, stepCosts: A_STAFF }) },
        /* a loss-making month, so nothing can pass by clamping a negative result at zero */
        loss: { state: A({ acquisitionPerMonth: 20000 }) },
      },
      expected: {
        baseline: { demand: 20, capacity: 12, delivered: 12, marketing: 1000, fixedCosts: 2500, revenue: 12000, operatingResult: 4900 },
        marketing: { demand: 40, capacity: 12, delivered: 12, marketing: 2000, fixedCosts: 2500, revenue: 12000, operatingResult: 3900 },
        capacity: { demand: 20, capacity: 24, delivered: 20, marketing: 1000, fixedCosts: 4500, revenue: 20000, operatingResult: 8500 },
        both: { demand: 40, capacity: 24, delivered: 24, marketing: 2000, fixedCosts: 4500, revenue: 24000, operatingResult: 10300 },
        jointImprovement: 5400, sumOfIsolatedImprovements: 2600,
        incrementalMarketing: -1000, incrementalCapacity: 3600, interaction: 2800,
      },
    },
    {
      id: 'B', title: 'A 10% discount can require 50% more volume',
      note: 'at £90 against a £70 cost a sale contributes £20, so £3,000 of contribution needs 150 sales, not 110',
      state: st({ price: 100, variableCost: 70, salesPerMonth: 100, horizonMonths: 1, unit: 'sales' }),
      variants: {
        full: { state: st({ price: 100, variableCost: 70, salesPerMonth: 100, horizonMonths: 1, unit: 'sales' }) },
        discounted: {
          state: st({ price: 90, variableCost: 70, salesPerMonth: 100, horizonMonths: 1, unit: 'sales' }),
          goal: { kind: 'contribution', amount: 3000, horizonMonths: 1 },
        },
      },
      inputs: { discount: { price: 100, newPrice: 90, variableCost: 70, units: 100 } },
      expected: { contributionAtFullPrice: 3000, salesAtFullPrice: 100, contributionPerUnitAfter: 20, salesRequired: 150, wrongAnswer: 110 },
    },
    {
      id: 'C', title: 'Profit does not fund the first outlay automatically',
      note: 'later receipts do not erase the earlier gap; the scheduled plan is not executable without funding',
      state: C({ opening: 2000, minimumBuffer: 0, receiptLagMonths: 1, paymentLagMonths: 0 }),
      variants: {
        zeroBuffer: { state: C({ opening: 2000, minimumBuffer: 0, receiptLagMonths: 1, paymentLagMonths: 0 }) },
        buffer500: { state: C({ opening: 2000, minimumBuffer: 500, receiptLagMonths: 1, paymentLagMonths: 0 }) },
        /* the same case with cash available today not known: no funding figure at all, never £0 */
        cashUnknown: { state: C({ minimumBuffer: 0, receiptLagMonths: 1, paymentLagMonths: 0 }) },
      },
      expected: { operatingResultMonth1: 3000, receiptsMonth1: 0, paymentsMonth1: 7000, closingCashMonth1: -5000, closingCashMonth2: 5000, cashLow: -5000, fundingRequiredZeroBuffer: 5000, fundingRequired500Buffer: 5500, feasibility: 'blocked' },
    },
    {
      id: 'D', title: 'Recurring revenue is not month-end customers multiplied blindly',
      note: 'closing MRR is a run rate; the month earns from the ninety customers who were billed',
      state: st({
        horizonMonths: 1, unit: 'active customers',
        recurring: { openingCustomers: 100, pricePerMonth: 50, startsPerMonth: 20, cancellationsPerMonth: 10, reactivationsPerMonth: 0, cancelBeforeBilling: true, startsBilledThisMonth: false },
      }),
      variants: {
        recurring: {
          state: st({
            horizonMonths: 1, unit: 'active customers',
            recurring: { openingCustomers: 100, pricePerMonth: 50, startsPerMonth: 20, cancellationsPerMonth: 10, reactivationsPerMonth: 0, cancelBeforeBilling: true, startsBilledThisMonth: false },
          }),
        },
        /* one customer pays £1,200 upfront for twelve months delivered evenly */
        upfront: {
          state: st({
            horizonMonths: 12, price: 100, variableCost: 0, demandPerMonth: 0, fixedCostsPerMonth: 0, acquisitionPerMonth: 0, unit: 'months of service',
            resources: [{ id: 'delivery', name: 'Delivery', unit: 'months of service', period: 'month', availablePerPeriod: 1, perUnit: 1 }],
            cash: { opening: 0, minimumBuffer: 0, receiptLagMonths: 0, prepayments: [{ id: 'annual', label: 'Twelve months paid upfront', amount: 1200, months: 12, startMonth: 1 }] },
          }),
        },
      },
      inputs: {
        month: { openingCustomers: 100, cancellations: 10, starts: 20, reactivations: 0, pricePerMonth: 50, cancelBeforeBilling: true, startsBilledThisMonth: false },
        prepayment: { amount: 1200, months: 12, startMonth: 1 },
      },
      expected: { closingCustomers: 110, closingMRR: 5500, billedCustomers: 90, earnedRevenue: 4500, wrongRevenue: 5500, upfrontCashMonth1: 1200, upfrontRevenuePerMonth: 100 },
    },
    {
      id: 'E', title: 'Founder time and automation cannot be spent twice',
      note: 'ten delivery hours at two hours a job is five jobs, not ten; freed hours move, they are not created',
      state: E(10, 10, 3),
      variants: {
        base: { state: E(10, 10, 3) },
        adminSaved: { state: E(10, 10, 3), plan: AUTOMATE },
        demand4: { state: E(4, 10, 3) },
        demand4Saved: { state: E(4, 10, 3), plan: AUTOMATE },
      },
      inputs: {
        /* the same twenty hours either way: the two administration hours move to delivery, they are not created */
        before: { availableHours: 20, commitments: [{ id: 'sales', hours: 4 }, { id: 'administration', hours: 3 }, { id: 'implementation', hours: 3 }], hoursPerUnit: 2, period: 'week' },
        after: { availableHours: 20, commitments: [{ id: 'sales', hours: 4 }, { id: 'administration', hours: 1 }, { id: 'implementation', hours: 3 }], hoursPerUnit: 2, period: 'week' },
        demandUnits: 4,
      },
      expected: { deliveryHoursBefore: 10, capacityBefore: 5, wrongCapacity: 10, deliveryHoursAfter: 12, adminHoursAfter: 1, capacityAfter: 6, hoursTotalEitherWay: 13, deliveredAtDemandFour: 4 },
    },
    {
      id: 'F', title: 'Goal requirements expose an infeasible target',
      note: 'a requirement of eighteen sales is not a prediction that eighteen customers will buy',
      state: st({
        price: 1000, variableCost: 750, fixedCostsPerMonth: 1500, horizonMonths: 1, unit: 'sales',
        winRate: { value: 0.2, numerator: 20, denominator: 100, period: 'month', segment: 'qualified opportunities', source: 'assumed for this synthetic case', state: 'estimated', basis: '20 of 100 qualified opportunities, measured over one month' },
        opportunitiesPerMonth: 40,
        resources: [{ id: 'delivery', name: 'Delivery', unit: 'sales', period: 'month', availablePerPeriod: 15, perUnit: 1 }],
      }),
      goal: { kind: 'operating_result', amount: 3000, periodCosts: 1500, contributionPerSale: 250, horizonMonths: 1 },
      expected: { requiredSales: 18, requiredOpportunities: 90, capacity: 15, capacityShortfall: 3, verdict: 'requires_changes', mode: 'requirements' },
    },
    {
      id: 'G', title: 'Channel overlap, reconciliation and undefined ratios',
      note: 'five separate rules: unique reach, bounded reach, a reconciliation gap, no break-even and an undefined ratio',
      state: st({ salesPerMonth: 10, price: 500, statedRevenue: 6000, horizonMonths: 1, unit: 'sales' }),
      variants: {
        overlapKnown: {
          state: st({ horizonMonths: 1, unit: 'sales', reach: { channels: [{ id: 'email', reach: 600 }, { id: 'other', reach: 700 }], overlaps: [{ a: 'email', b: 'other', people: 200 }] } }),
        },
        overlapUnknown: {
          state: st({ horizonMonths: 1, unit: 'sales', reach: { channels: [{ id: 'email', reach: 600 }, { id: 'other', reach: 700 }], overlaps: [] } }),
        },
        reconciliation: { state: st({ salesPerMonth: 10, price: 500, statedRevenue: 6000, horizonMonths: 1, unit: 'sales' }) },
        zeroContribution: {
          state: st({ price: 70, variableCost: 70, fixedCostsPerMonth: 2000, salesPerMonth: 50, horizonMonths: 1, unit: 'sales' }),
          goal: { kind: 'operating_result', amount: 1000, horizonMonths: 1 },
        },
        noCustomers: {
          state: st({ horizonMonths: 1, unit: 'sales', acquisitionPerMonth: 1000, acquisition: { spend: 1000, customersAcquired: 0 } }),
        },
        twoOfTwo: {
          state: st({ horizonMonths: 1, unit: 'sales', opportunitiesPerMonth: 2, winRate: { numerator: 2, denominator: 2, period: 'month', segment: 'enquiries', source: 'observed in this business', state: 'observed' } }),
        },
      },
      inputs: {
        reach: { channels: [{ id: 'email', reach: 600 }, { id: 'other', reach: 700 }], overlaps: [{ a: 'email', b: 'other', people: 200 }] },
        reachUnknownOverlap: { channels: [{ id: 'email', reach: 600 }, { id: 'other', reach: 700 }], overlaps: [] },
        breakEven: { price: 70, variableCost: 70, fixedCosts: 2000 },
        cac: { spend: 1000, customersAcquired: 0 },
        winRate: { numerator: 2, denominator: 2, period: 'month', segment: 'enquiries', source: 'observed in this business' },
      },
      expected: { uniqueReach: 1100, wrongReach: 1300, boundLow: 700, boundHigh: 1300, built: 5000, stated: 6000, gap: 1000, breakEvenUnits: null, cacDefined: false, observedWinRate: 1, projectable: false },
    },
    {
      id: 'H', title: 'Growth has a critical path',
      note: 'two weeks of setup, four to a win, two to completed delivery, four to payment: week eight and week twelve',
      state: st({
        horizonMonths: 6, price: 5000, variableCost: 2000, fixedCostsPerMonth: 1000, acquisitionPerMonth: 0,
        demandPerMonth: 2, unit: 'completed jobs',
        resources: [{ id: 'delivery', name: 'Delivery', unit: 'completed jobs', period: 'month', availablePerPeriod: 5, perUnit: 1 }],
        cash: { opening: 10000, minimumBuffer: 0, receiptLagMonths: 1, paymentLagMonths: 0 },
        criticalPath: [
          { id: 'setup', label: 'Setup before outreach can start', weeks: 2, after: [] },
          { id: 'win', label: 'Outreach to a win', weeks: 4, after: ['setup'] },
          { id: 'deliver', label: 'Win to completed delivery', weeks: 2, after: ['win'] },
          { id: 'paid', label: 'Completed delivery to payment', weeks: 4, after: ['deliver'] },
        ],
        completionStep: 'deliver', receiptStep: 'paid',
      }),
      inputs: {
        steps: [
          { id: 'setup', label: 'Setup before outreach can start', weeks: 2, after: [] },
          { id: 'win', label: 'Outreach to a win', weeks: 4, after: ['setup'] },
          { id: 'deliver', label: 'Win to completed delivery', weeks: 2, after: ['win'] },
          { id: 'paid', label: 'Completed delivery to payment', weeks: 4, after: ['deliver'] },
        ],
      },
      expected: { completionWeek: 8, receiptWeek: 12, deliveredMonth1: 0, receiptsMonth1: 0, revenueMonth1: 0 },
    },
    {
      id: 'I', title: 'Summarise after calculating the paths',
      note: 'these synthetic weights test arithmetic; they are not probabilities for a real business',
      state: st({ horizonMonths: 2, unit: 'completed jobs' }),
      demand: { states: [0, 20], weights: [0.5, 0.5], capacity: 10 },
      paths: [[0, 100], [100, 0], [60, 60]],
      inputs: { demandPaths: [0, 20], capacity: 10, weights: [0.5, 0.5], paths: [[0, 100], [100, 0], [60, 60]] },
      expected: { expectedDelivered: 5, wrongIfAveragedFirst: 10, sumOfMonthlyMedians: 120, medianOfPathTotals: 100 },
    },
  ];
}

/* ---------------------------------------------------------------- 17. export */
const econ = {
  MODEL_VERSION, MODES: Object.keys(MODE_NOTES), MODE_NOTES, MODE_LABEL, MODELS, MODEL_MECHANICS,
  VALIDATED_FORECAST_UNREACHABLE, SIMULATION,
  audit, model, baseline, scenario, requirements, compare, constraints, fixtures,
  expectedDelivered, medianOfPathTotals, isStale,
  calc, readInputs, chooseMode, checkInvariants,
  fig, rate, monthDates,
};
M.econ = econ;
})();
