/* plan.js (Mercer 12, rebuild 1, owner: brain): the one Plan object (R17, brief 16.2).

   M.plan.build(state) returns the plan for either route, deterministic from the state and the engine's
   own plan and measure (app.js owns those: M.ensurePlanned, M.measured, M.result, the ladder it dispatches),
   the question owner's profiles (M.founderProfile, M.controlProfile, M.bestClients) and starter.js for the
   no-business route. One plan drives the recap, the plan view, both exports and the TMA brief (canopy.js
   renders it). Every action is the standard card of brief 13.3; every claim carries evidenceIds that resolve
   through M.plan.evidence(id) (a field id → M.evidence(id) when app.js provides it, else derived here;
   calc:… → the plan's own calculated entries; src:… → macro.js rows; assume:… → the plan's assumptions).
   Scenarios exist only where the engine supports them: a point estimate stays a point estimate, no bounds
   are invented, and the upsides of competing steps are never summed. "No constraint found within this
   model" is said with its scope, never "No limit". Currency prints through M.gbp. M.plan.example(route)
   is a fully formed sample plan flagged example: true; M.plan.current() gives { plan, stale } against
   M.revision. M.plan.ready(state) is the readiness of brief 6.3 with the decisive missing input named.
   Nothing here calls the host model; model.js does that on the "Build my plan" press, and
   M.plan.withModel(plan, kind, value) layers a validated reply onto a copy of the plan. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});

/* ---------------------------------------------------------------- reading the state */
const inSet = (c, k) => (!c ? false : typeof c.has === 'function' ? c.has(k) : Array.isArray(c) ? c.includes(k) : !!c[k]);
const given = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) && !(v instanceof Set && !v.size);
const S = (s) => s ?? M.state ?? {};
const out = (s, k) => inSet(s.notSure, k) || inSet(s.na, k);
const known = (s, k) => given(s[k]) && !out(s, k);
const val = (s, k) => (known(s, k) ? s[k] : null);
const num = (s, k) => { const v = val(s, k); const n = Number(v); return v !== null && Number.isFinite(n) ? n : null; };
const first = (s, ...ks) => { for (const k of ks) { if (known(s, k)) return { id: k, value: s[k] }; } return null; };
const arr = (v) => (Array.isArray(v) ? v : v instanceof Set ? [...v] : v && typeof v === 'object' ? Object.keys(v).filter((k) => v[k]) : given(v) ? [v] : []);
const has = (v, re) => arr(v).some((x) => re.test(String(x)));
const lower = (t) => String(t ?? '').toLowerCase();
const cap = (t) => { const x = String(t ?? ''); return x.charAt(0).toUpperCase() + x.slice(1); };
const listWords = (xs) => { const a = xs.filter(Boolean); return a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; };
const gbp = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : `£${Math.round(Number(n) || 0).toLocaleString('en-GB')}`);
const pct = (x) => `${Math.round(Number(x) * 100)}%`;
const count = (n) => (typeof M.count === 'function' ? M.count(n) : String(Math.round(Number(n) || 0)));
const revisionNow = () => (Number.isFinite(Number(M.revision)) ? Number(M.revision) : 0);
const ukOn = (s) => { try { if (typeof M.ukBenchmarks === 'function') return !!M.ukBenchmarks(); } catch (e) { /* below */ } return (s.currency ?? 'GBP') === 'GBP'; };
const registryIds = () => (Array.isArray(M.registry) ? M.registry.map((q) => q.id).filter(Boolean) : []);
const labelOf = (id) => { try { const q = Array.isArray(M.registry) ? M.registry.find((x) => x.id === id) : null; if (q?.label) return q.label; if (q?.title) return q.title; const h = typeof M.headline === 'function' ? M.headline(id) : null; return h?.title ?? h ?? id; } catch (e) { return id; } };

/* ---------------------------------------------------------------- provenance (brief 10.4, R9) */
const STATE_LABEL = { user: 'Your answer', imported: 'From your website/document', source: 'Source', assumed: 'Assumption', calculated: 'Calculated', unknown: 'Not known yet' };
const STATES = Object.keys(STATE_LABEL);
/** the words a visitor would recognise for an answer: never a stored id (a chosen profile is "p1" in state) */
function shownValue(s, id, raw) {
  try { const w = M.answerWord?.(id); if (typeof w === 'string' && w.trim()) return w.trim(); } catch (e) { /* the raw value below */ }
  return raw instanceof Set ? [...raw] : raw;
}
/** a modelled figure is only worth printing when it is big enough to act on: under a hundredth of a year's revenue,
    or under £100, it reads as the payoff for the whole action and is not one (review, copy finding 1) */
const material = (v, r) => { const n = Math.abs(Number(v) || 0); if (!n) return false; const year = (Number(r?.now) || 0) * 12; return n >= 100 && (!year || n >= year * 0.01); };
function fieldEvidence(s, id) {
  if (typeof M.evidence === 'function') {
    try { const e = M.evidence(id); if (e && (typeof e === 'string' || e.state)) { const st = typeof e === 'string' ? e : e.state; return { id, state: STATES.includes(st) ? st : 'unknown', label: STATE_LABEL[st] ?? STATE_LABEL.unknown, value: e.value ?? (known(s, id) ? shownValue(s, id, s[id]) : null), sourceTitle: e.sourceTitle ?? null, sourceUrl: e.sourceUrl ?? null, sourceDate: e.sourceDate ?? null, retrievedAt: e.retrievedAt ?? null, excerpt: e.excerpt ?? null, question: labelOf(id) }; } } catch (e) { /* derived below */ }
  }
  const imp = arr(s.imported).find((f) => f && (f.field === id || f.id === id || f.key === id) && !f.excluded && f.state !== 'excluded' && (f.confirmed || f.state === 'confirmed' || f.confirmed === undefined));
  if (known(s, id)) {
    const st = imp ? 'imported' : 'user';
    return { id, state: st, label: STATE_LABEL[st], value: shownValue(s, id, s[id]), sourceTitle: imp?.sourceTitle ?? imp?.source ?? null, sourceUrl: imp?.url ?? imp?.sourceUrl ?? null, sourceDate: imp?.sourceDate ?? null, retrievedAt: imp?.retrievedAt ?? null, excerpt: imp?.excerpt ?? imp?.quote ?? null, question: labelOf(id) };
  }
  return { id, state: 'unknown', label: STATE_LABEL.unknown, value: null, question: labelOf(id) };
}
/** an evidence collector: every id a plan cites lands in one list with its full object */
function collector(s) {
  const map = new Map();
  const put = (e) => { if (e && !map.has(e.id)) map.set(e.id, e); return e ? e.id : null; };
  return {
    field: (id) => (known(s, id) || out(s, id) ? put(fieldEvidence(s, id)) : put(fieldEvidence(s, id))),
    calc: (id, title, value, unit, basis) => put({ id: `calc:${id}`, state: 'calculated', label: STATE_LABEL.calculated, title, value, unit: unit ?? null, basis: basis ?? null }),
    assume: (id, title, text, value) => put({ id: `assume:${id}`, state: 'assumed', label: STATE_LABEL.assumed, title, text, value: value ?? null, editable: true }),
    src: (rowId) => { try { const e = M.macro?.evidenceFor?.(rowId); return e ? put(e) : null; } catch (e) { return null; } },
    all: () => [...map.values()],
    has: (id) => map.has(id),
  };
}
function resolveEvidence(id, plan) {
  const p = plan ?? cache.plan;
  const hit = p?.evidence?.find((e) => e.id === id);
  if (hit) return hit;
  if (/^src:/.test(id)) { try { return M.macro?.evidenceFor?.(id) ?? null; } catch (e) { return null; } }
  if (/^(calc|assume):/.test(id)) return null;
  return fieldEvidence(S(), id);
}

/* ---------------------------------------------------------------- the owner route: signals */
const WORRY = (v) => lower(v);
const HOLDUP = (v) => lower(arr(v).join(' '));
function readOwner(s, eng, econ) {
  const r = { evidence: {}, reasons: {} };
  const E = (k, ...ids) => { r.evidence[k] = (r.evidence[k] ?? []).concat(ids.filter(Boolean)); };
  const goalRaw = lower(val(s, 'win') ?? val(s, 'goalWhy') ?? val(s, 'goalKind'));
  r.goalKind = /time|free|hours|step back/.test(goalRaw) ? 'time' : /predict|steady|stable|reliab/.test(goalRaw) ? 'predictability' : /sell|exit/.test(goalRaw) ? 'sell' : /last|outlast|legacy/.test(goalRaw) ? 'lasts' : /beat|compet/.test(goalRaw) ? 'beat' : /grow|bigger|more|scale/.test(goalRaw) ? 'growth' : /income|profit|money|revenue/.test(goalRaw) ? 'income' : goalRaw ? 'other' : null;
  r.goalWords = { time: 'your time back', predictability: 'predictable revenue', sell: 'a business you can sell', lasts: 'a business that outlasts you', beat: 'beating a competitor', growth: 'growth', income: 'a bigger income', other: String(val(s, 'successWords') ?? val(s, 'win') ?? 'what you said you want') }[r.goalKind] ?? null;
  r.goal = num(s, 'goal'); r.months = num(s, 'months') ?? 12; r.now = num(s, 'now'); r.price = num(s, 'price') ?? num(s, 'retainerValue'); r.margin = num(s, 'margin');
  /* the polish pack, 3 and 4: the one-off amount is the question's own key (oneOff; the older names are read too), and the
     hours the plan may spend are the extra hours (changeHours) only: the hours a week the owner already works in the
     business (hours) are what the plan competes with, never time it can use */
  r.budget = num(s, 'budget'); r.oneOffBudget = num(s, 'oneOff') ?? num(s, 'changeBudget') ?? num(s, 'oneOffBudget'); r.hours = num(s, 'changeHours'); r.weekHours = num(s, 'hours');
  r.who = num(s, 'who') ?? num(s, 'teamSize'); r.capacity = num(s, 'capacity'); r.servedNow = num(s, 'servedNow');
  r.enquiries = num(s, 'enquiries'); r.closeRate = num(s, 'closeRate'); r.market = num(s, 'market');
  const stage = lower(val(s, 'stage'));
  r.preRevenue = /launch|prepar|pre/.test(stage) || (r.now !== null && r.now === 0 && !/estab|first/.test(stage));
  r.repeatWork = lower(val(s, 'repeatWork') ?? val(s, 'payModel'));
  r.recurring = /retainer|subscription/.test(r.repeatWork) || /retainer|subscription/.test(lower(val(s, 'payModel')));
  r.deliveryMode = lower(val(s, 'deliveryMode'));
  r.remote = /online|remote|shipped/.test(r.deliveryMode) && !/mixed|visit|travel/.test(r.deliveryMode);
  r.solo = r.who === 1 || (r.who === null && val(s, 'help') === 'alone');
  r.protected = arr(val(s, 'protected'));

  /* demand: strong or weak, each signal an evidence id */
  let strong = 0, weak = 0;
  const cdm = lower(val(s, 'canDeliverMore'));
  if (cdm === 'no' || /^no\b/.test(cdm)) { strong += 2; E('demandStrong', 'canDeliverMore'); }
  else if (/change|with/.test(cdm)) { strong += 1; E('demandStrong', 'canDeliverMore'); }
  else if (cdm === 'yes' || /^yes/.test(cdm)) { weak += 1; E('demandWeak', 'canDeliverMore'); }
  const bf = lower(val(s, 'breaksFirst'));
  if (/^(me|team|skill|space|stock|suppliers|systems|premises|equipment)/.test(bf)) { strong += 1; E('demandStrong', 'breaksFirst'); E('capacity', 'breaksFirst'); }
  if (/demand|nothing|room|customers/.test(bf)) { weak += 2; E('demandWeak', 'breaksFirst'); }
  if (/cash/.test(bf)) E('cash', 'breaksFirst');
  /* the polish pack, 10.1: how easily capacity can change, not only where it binds today. easy: spare capacity or an
     existing helper, tool, supplier or partner; slow: hiring, buying or building first; none: quality or margin would slip */
  r.moreWork = lower(val(s, 'moreWork')) || null;
  r.moreWorkAmount = num(s, 'moreWorkAmount'); r.moreWorkLead = lower(val(s, 'moreWorkLead')) || null; r.moreWorkCost = num(s, 'moreWorkCost');
  r.capacityFlex = r.moreWork === 'spare' || r.moreWork === 'helper' ? 'easy' : r.moreWork === 'hire' ? 'slow' : r.moreWork === 'no' ? 'none' : null;
  if (r.moreWork) E('capacity', 'moreWork');
  /* the polish pack, 10.3: the stage that gives first, in the business's own terms (a product's stock, making or shipping;
     a subscription's build or support); a bespoke service is counted once, at delivery */
  const stockL = lower(val(s, 'stockLimit')), buildL = lower(val(s, 'buildLimit'));
  r.stageLimit = stockL && stockL !== 'none' ? { stage: stockL, words: { stock: 'stock or materials', make: 'making time', ship: 'packing and shipping' }[stockL] ?? stockL } : buildL && buildL !== 'none' ? { stage: buildL, words: { build: 'the first build', support: 'support and updates', sales: 'finding subscribers' }[buildL] ?? buildL } : null;
  if (stockL) E('capacity', 'stockLimit');
  if (buildL) E('capacity', 'buildLimit');
  const worry = WORRY(val(s, 'worry'));
  if (/deliver|quality|keep up/.test(worry)) { strong += 1; E('demandStrong', 'worry'); }
  if (/sales|demand|customers|enquir/.test(worry)) { weak += 1; E('demandWeak', 'worry'); }
  if (/cash/.test(worry)) E('cash', 'worry');
  if (/control|me|myself/.test(worry)) E('delegation', 'worry');
  const holdup = HOLDUP(val(s, 'holdup'));
  if (/deliver|schedul|capacity|doing the work|backlog|wait/.test(holdup)) { strong += 1; E('demandStrong', 'holdup'); E('process', 'holdup'); }
  if (/respon|reply|answer/.test(holdup)) E('response', 'holdup');
  if (/quote|proposal|follow/.test(holdup)) E('followUp', 'holdup');
  if (/invoic|payment|paid/.test(holdup)) E('cash', 'holdup');
  const lead = lower(val(s, 'leadTime'));
  if (/weeks|month/.test(lead)) { strong += 1; E('demandStrong', 'leadTime'); }
  /* the only figure the demand reading takes is econ's: how full the binding resource already is */
  const util = typeof econ?.utilisation?.value === 'number' && Number.isFinite(econ.utilisation.value) ? econ.utilisation.value : null;
  if (util !== null && util >= 0.75) { strong += 1; E('demandStrong', 'calc:utilisation'); }
  if (util !== null && util <= 0.4 && r.capacity !== null) { weak += 1; E('demandWeak', 'calc:utilisation'); }
  /* the frozen engine is a demand reading only (D1): it can lean the diagnosis, and it carries no figure into the plan */
  if (eng?.binding === 'client_capacity') { strong += 2; E('demandStrong', 'assume:demand_reading'); }
  if (eng?.binding === 'market_depletion') { weak += 1; E('demandWeak', 'assume:demand_reading'); }
  if (r.enquiries !== null && r.capacity !== null && r.closeRate !== null && r.enquiries * r.closeRate > 0.8 * r.capacity) { strong += 1; E('demandStrong', 'enquiries', 'capacity'); }
  if (r.enquiries !== null && r.enquiries <= 3) { weak += r.enquiries === 0 ? 2 : 1; E('demandWeak', 'enquiries'); }
  if (val(s, 'hiring') === 'now') { strong += 1; E('demandStrong', 'hiring'); }
  const went = val(s, 'went') ?? {};
  const flops = Object.keys(went && typeof went === 'object' ? went : {}).filter((k) => went[k] === 'flop');
  if (flops.length) { weak += 0.5; E('demandWeak', 'went'); }
  if (r.goal !== null && r.now !== null && r.goal > r.now * 1.3 && (cdm === 'yes' || /nothing|room/.test(bf))) { weak += 1; }
  r.demand = strong - weak >= 2 ? 'strong' : weak - strong >= 2 ? 'weak' : strong > weak ? 'leaning strong' : weak > strong ? 'leaning weak' : 'unknown';
  r.demandScore = { strong, weak };

  /* room to grow: none, some, plenty */
  r.room = cdm === 'no' || /^no\b/.test(cdm) || (util !== null && util >= 0.85) ? 'none' : cdm === 'yes' || /^yes/.test(cdm) || /nothing|room/.test(bf) || (util !== null && util <= 0.5) ? 'plenty' : /change/.test(cdm) || (util !== null && util < 0.85) ? 'some' : 'unknown';
  r.spareTime = r.hours === null ? 'unknown' : r.hours <= 5 ? 'little' : r.hours <= 12 ? 'some' : 'plenty';
  if (r.hours !== null) E('time', 'changeHours', 'hours');
  const holiday = lower(val(s, 'holiday'));
  r.ownerBound = /stops|never/.test(holiday) || (r.solo && lower(val(s, 'delegation')) === 'none') || /^me/.test(bf);
  if (/stops|never/.test(holiday)) E('delegation', 'holiday');

  /* conversion, response and trust */
  let conv = 0;
  const ct = arr(val(s, 'chooseThem')).map(lower);
  const rt = lower(val(s, 'responseTime'));
  const fu = num(s, 'followUps');
  if (r.closeRate !== null && r.closeRate < 0.2 && r.enquiries !== null && r.enquiries >= 4) { conv += 1; E('conversion', 'closeRate', 'enquiries'); }
  if (/days|slow|longer/.test(rt)) { conv += 1; E('response', 'responseTime'); }
  if (ct.some((x) => /speed|slow/.test(x))) { conv += 1; E('response', 'chooseThem'); }
  if (fu !== null && fu <= 1) { conv += 1; E('followUp', 'followUps'); }
  if (ct.some((x) => /trust|heard|unknown/.test(x))) { conv += 1; E('trust', 'chooseThem'); }
  if (ct.some((x) => /unclear|range|offer/.test(x))) { conv += 1; E('offerUnclear', 'chooseThem'); }
  if (ct.some((x) => /price|cost/.test(x))) E('price', 'chooseThem');
  if (ct.some((x) => /unsuitable|wrong|lead/.test(x))) E('buyer', 'chooseThem');
  if (r.evidence.response?.length) conv += 0;
  r.conversion = conv;
  const reviews = lower(val(s, 'reviews'));
  r.trustWeak = /none|few|under/.test(reviews) || ct.some((x) => /trust|heard/.test(x));
  if (/none|few|under/.test(reviews)) E('trust', 'reviews');
  if (lower(val(s, 'website')) === 'none') { r.noSite = true; E('trust', 'website'); }

  /* channel and access */
  const access = lower(arr(val(s, 'access')).join(' '));
  r.accessNone = /none|no clear|no route/.test(access) || (!access && r.market === null);
  r.accessWords = access;
  if (access) E('channel', 'access');
  const doing = arr(val(s, 'doing')).concat(arr(val(s, 'channel')));
  r.doing = doing; r.flops = flops;
  if (flops.length) E('flop', 'went');
  const lastFive = arr(val(s, 'lastFive'));
  const bins = lastFive.map((x) => (x && typeof x === 'object' ? x.bin : x)).filter(Boolean);
  r.warm = bins.filter((b) => /warm/.test(String(b))).length;
  if (r.warm >= 2) E('warm', 'lastFive');
  if (doing.some((c) => /referral|partner|word/.test(String(c)))) { r.warm += 1; E('warm', 'channel'); }
  const network = num(s, 'network');
  const ns = lower(val(s, 'networkStrength'));
  r.networkUsable = (network !== null && network >= 10) || /strong|close|available|would help/.test(ns) || arr(val(s, 'network')).some((x) => /introduc|buyer|partner|specialist/.test(lower(x)));
  if (r.networkUsable) E('network', 'network', 'networkStrength');
  const asked = lower(val(s, 'asked'));
  r.askedYet = /not yet|no\b/.test(asked) ? 'no' : /wait|helping|yes/.test(asked) ? 'yes' : /unavail/.test(asked) ? 'unavailable' : null;
  if (r.askedYet) E('network', 'asked');
  r.wontCold = has(val(s, 'wontDo'), /cold/); r.wontAds = has(val(s, 'wontDo'), /ads|paid/); r.wontDiscount = has(val(s, 'wontDo'), /discount/); r.wontSocial = has(val(s, 'wontDo'), /social|camera/);
  r.avoided = arr(val(s, 'avoided')).map(lower);

  /* delegation and the founder */
  const del = lower(val(s, 'delegation'));
  const fr = lower(val(s, 'futureRole'));
  r.delegationNeeded = (/none|checks/.test(del) && (r.goalKind === 'time' || r.goalKind === 'sell' || /lead|back|exit/.test(fr))) || (r.goalKind === 'time' && r.ownerBound);
  if (/none|checks/.test(del)) E('delegation', 'delegation');
  if (/lead|back|exit/.test(fr)) E('delegation', 'futureRole');
  r.teamCanOwn = arr(val(s, 'delegationAreas') ?? val(s, 'teamOwns')).length > 0 || /outcomes|full/.test(del);
  r.decisionRights = val(s, 'decisionRights');

  /* cash */
  const terms = lower(val(s, 'terms'));
  const owed = num(s, 'owed');
  const runway = num(s, 'runway');
  let cash = 0;
  if (/sixty|60|after|thirty|30/.test(terms)) { cash += /sixty|60/.test(terms) ? 2 : 1; E('cash', 'terms'); }
  if (owed !== null && r.now !== null && owed > r.now) { cash += 1; E('cash', 'owed'); }
  if (runway !== null && runway === 0) { cash += 1; E('cash', 'runway'); }
  if (/cash/.test(worry)) cash += 1;
  if (/cash/.test(bf)) cash += 1;
  r.cash = cash; r.terms = terms; r.owed = owed;

  /* offer and price */
  const pr = lower(val(s, 'priceRaised'));
  const disc = lower(val(s, 'discounting'));
  let offer = 0;
  if (/long|never/.test(pr)) { offer += 1; E('price', 'priceRaised'); }
  if (/often|always/.test(disc)) { offer += 1; E('price', 'discounting'); }
  if (r.margin !== null && r.margin < 0.3) { offer += 1; E('price', 'margin'); }
  if (has(val(s, 'chooseYou'), /price/)) { offer += 0.5; E('price', 'chooseYou'); }
  r.priceSignal = offer; r.priceRaised = pr;

  /* retention */
  const renew = num(s, 'retainerRenew');
  const repeat = num(s, 'repeat');
  r.retentionWeak = (r.recurring && renew !== null && renew <= 5) || (/repeat|mixed/.test(r.repeatWork) && repeat !== null && repeat < 0.3);
  if (r.retentionWeak) E('retention', 'retainerRenew', 'repeat');

  /* sparse: how much of the picture there is */
  const core = ['win', 'goal', 'sector', 'now', 'price', 'buyer', 'repeatWork', 'canDeliverMore', 'breaksFirst', 'capacity', 'enquiries', 'closeRate', 'hours', 'changeHours', 'budget', 'chooseThem', 'channel', 'access', 'deliveryMode', 'worry', 'holdup', 'delegation', 'terms', 'reviews', 'lastFive'];
  r.answeredCore = core.filter((k) => known(s, k)).length;
  r.sparse = r.answeredCore < 6;
  return r;
}

/* ---------------------------------------------------------------- the engine's reads (owner) */
const INPUT_WORDS = { budget: 'your growth spend', acv: 'the price of a sale', statedCloseRate: 'your close rate', serviceRatePerServerPerMonth: 'your capacity', addressableCount: 'your prospect count', grossMargin: 'your margin', retentionMonths: 'how long customers stay', repeatPurchaseRate: 'how many customers buy again', salesCycleDays: 'your sales cycle' };
const LEVER_KEY = [[/add one .*server/i, 'who'], [/service rate|capacity/i, 'capacity'], [/budget/i, 'budget'], [/deal value|price|acv/i, 'price'], [/close rate/i, 'closeRate'], [/mailbox|seat/i, 'mailbox'], [/market|addressable|criteria|trigger/i, 'market'], [/margin/i, 'margin'], [/retention/i, 'retention']];
const leverKey = (text) => (LEVER_KEY.find(([re]) => re.test(String(text ?? ''))) ?? [null, null])[1];
let lastLadder = { key: null, ladder: null };
try { document.addEventListener('mercer:ladder', (e) => { if (e?.detail?.ladder) lastLadder = { key: e.detail.key ?? null, ladder: e.detail.ladder }; }); } catch (e) { /* no document */ }
function ladderNow(opts) {
  if (opts?.ladder) return opts.ladder;
  try { const key = typeof M.keyOf === 'function' ? M.keyOf() : null; return lastLadder.ladder && (!key || lastLadder.key === key) ? lastLadder.ladder : null; } catch (e) { return null; }
}
/** what the frozen engine says, read once per build: the plan (levers, constraints, sensitivity, added revenue, leads,
    unspent), the measure and the run. Nothing is computed from the goal here: the goal never enters the engine */
function readEngine(s, opts) {
  if (opts?.route === 'starter') return null;
  let planned = opts?.planned ?? null;
  const usable = !!(s.sector && Number(s.now) > 0);
  if (!planned && !opts?.example && usable) {
    try { planned = M.planned && (!M.keyOf || M.planned.key === M.keyOf()) ? M.planned : (typeof M.ensurePlanned === 'function' ? M.ensurePlanned() : null); } catch (e) { planned = M.planned ?? null; }
  }
  if (!planned) return null;
  const m = Math.max(1, Math.min(12, Number(s.months) || 12));
  const q = (sorted, p) => (Array.isArray(sorted) && sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))] : null);
  const month = Array.isArray(planned.months) ? planned.months[m - 1] : null;
  const binding = planned.binding ?? null;
  const c = (planned.constraints ?? []).find((x) => x.binding) ?? null;
  const cap = (planned.constraints ?? []).find((x) => x.type === 'client_capacity')?.diagnostics ?? null;
  const levers = (planned.levers ?? []).filter((l) => l.direction === 'up').map((l) => ({ lever: l.lever, key: leverKey(l.lever), magnitude: Math.round(Math.abs(l.magnitude)), difficulty: l.difficulty }));
  const floor = Math.max(1, 0.02 * Math.abs(planned.added?.p50 ?? 0));
  const W = { low: 1, medium: 2, high: 3 };
  const ranked = levers.filter((l) => l.magnitude >= floor).map((l) => ({ ...l, points: l.magnitude / (W[l.difficulty] ?? 2) })).sort((a, b) => b.points - a.points).map((l, i) => ({ ...l, rank: i + 1 }));
  return {
    planned, month: m, unit: planned.unit ?? (M.result?.unit ?? 'clients'),
    base: Math.round(planned.base ?? s.now ?? 0),
    p50: month ? Math.round(q(month, 0.5)) : null, p10: month ? Math.round(q(month, 0.1)) : null, p90: month ? Math.round(q(month, 0.9)) : null, draws: month ? month.length : 0,
    added: planned.added ? { p10: Math.round(planned.added.p10 ?? 0), p50: Math.round(planned.added.p50 ?? 0), p90: Math.round(planned.added.p90 ?? 0) } : null,
    binding, constraint: c, capacityDiag: cap,
    utilisation: cap?.baselineUtilisation ?? null, knee: cap?.utilisationKnee ?? 0.85, monthlyCapacity: cap?.monthlyMeetingCapacity ?? planned.capacity ?? null, load: planned.servedNow ?? cap?.existingMonthlyLoad ?? null, loadDerived: !!cap?.existingLoadDerived,
    levers: ranked, sensitivity: (planned.sensitivity ?? []).slice().sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
    unspent: planned.unspent ?? 0, unspentReason: planned.unspentReason ?? '', payback: planned.payback?.p50 ?? null, inaction: planned.inaction?.p50 ?? null,
    leads: Array.isArray(planned.leads) ? planned.leads.map((x) => Math.round(x)) : [], spend: Array.isArray(planned.spend) ? planned.spend : [],
    allocation: Array.isArray(planned.allocation) ? planned.allocation : [], assumed: Array.isArray(planned.assumed) ? planned.assumed : [], warnings: planned.warnings ?? [],
    acv: planned.acv ?? null, close: planned.close ?? null, budget: planned.budget ?? null, capacityUsed: planned.capacity ?? null, people: planned.people ?? null,
    ladder: ladderNow(opts),
  };
}
/** the dominant channel of the plan's first month with spend, from the engine's own allocation */
function firstChannel(eng) {
  const month = (eng?.allocation ?? []).find((mo) => (mo?.byChannel ?? []).some((c) => c.spend > 0));
  if (!month) return null;
  const top = [...month.byChannel].sort((a, b) => b.spend - a.spend)[0];
  return top ? { channel: top.channel, spend: Math.round(top.spend), leads: top.expectedLeads ?? null } : null;
}
const CHANNEL_WORDS = { 'cold-email': 'cold email', linkedin: 'LinkedIn outreach', 'content-seo': 'content and search', 'paid-search': 'paid search', 'paid-social': 'paid social', referral: 'referrals', partnerships: 'partnerships', 'cold-calling': 'cold calling' };

/* ---------------------------------------------------------------- econ.js: every figure comes from here (final-1 D1)

   engine.js stays frozen and is at most a demand view: its levers, its p10/p50/p90 and its ceilings are no longer
   shown. `M.econ` owns the arithmetic. It is read defensively with `?.` because it is built in parallel: while it is
   absent or incomplete the plan stays qualitative and shows no figure it cannot stand behind (D1, D2, D3). */
const MODES = ['requirements', 'illustrative', 'operating_scenario', 'validated_forecast'];
const MODE_WORDS = { requirements: 'Requirements', illustrative: 'Illustrative scenario', operating_scenario: 'Grounded operating scenario', validated_forecast: 'Validated forecast' };
/* D2: nothing in this build may claim a validated forecast. No historical series exists to backtest against, so the
   mode is unreachable and any scenario arriving with it is downgraded rather than displayed as a forecast. */
const VALIDATED_UNREACHABLE = 'No validated forecast is available in this build: there is no historical series to backtest against, so the numerical view is labelled Scenarios.';
const modeOf = (x, fallback) => { const m = x?.mode; if (!MODES.includes(m)) return fallback ?? null; return m === 'validated_forecast' ? 'operating_scenario' : m; };
const FEASIBILITY = ['feasible_under_assumptions', 'blocked', 'not_established'];
const feasibilityOf = (x) => (FEASIBILITY.includes(x?.feasibility) ? x.feasibility : 'not_established');
const finite = (n) => typeof n === 'number' && Number.isFinite(n);
const VERDICT_FEASIBILITY = { supported: 'feasible_under_assumptions', requires_changes: 'not_established', not_supported: 'blocked' };
/** the first resource in a scenario month or a baseline that names both what is needed and what is available */
function utilisationFrom(econ) {
  const pick = (res) => {
    if (!res || typeof res !== 'object') return null;
    const rows = Array.isArray(res) ? res : Object.keys(res).map((id) => ({ id, ...(res[id] ?? {}) }));
    const hit = rows.find((x) => finite(x?.needed) && finite(x?.available) && x.available > 0);
    return hit ? { id: hit.id ?? hit.resource ?? 'capacity', value: hit.needed / hit.available } : null;
  };
  return pick(econ?.baseline?.resources) ?? pick(econ?.scenario?.months?.[0]?.resources) ?? null;
}
/** what `M.econ` gives this plan, each call guarded: a missing or half-built module leaves `available` true and the
    pieces null, and every caller then falls back to words rather than to the engine's figures */
function readEcon(s, opts) {
  const e = M.econ && typeof M.econ === 'object' ? M.econ : null;
  const out = { available: !!e, version: e?.MODEL_VERSION ?? null, model: null, baseline: null, scenario: null, requirements: null, comparison: [], constraints: [], incomplete: [], why: '' };
  if (!e) { out.incomplete = ['module']; out.why = 'The economics module has not loaded in this view, so no figure is shown.'; return out; }
  const safe = (fn) => { try { return fn(); } catch (err) { return null; } };
  out.model = safe(() => e.model?.(s)) ?? null;
  const b = safe(() => e.baseline?.(s));
  out.baseline = b && typeof b === 'object' ? b : null;
  const sc = safe(() => e.scenario?.(s, opts?.econPlan ?? null));
  out.scenario = sc && typeof sc === 'object' && (Array.isArray(sc.months) || sc.totals) ? sc : null;
  const target = num(s, 'goal');
  if (target !== null) {
    const req = safe(() => e.requirements?.(s, { target, months: num(s, 'months') ?? 12, kind: lower(val(s, 'win')) || null, currency: s.currency ?? 'GBP' }));
    out.requirements = req && typeof req === 'object' && (req.required || req.verdict) ? req : null;
  }
  if (out.scenario) { const cs = safe(() => e.constraints?.(out.scenario)); out.constraints = Array.isArray(cs) ? cs : []; }
  out.utilisation = utilisationFrom(out);
  if (!out.baseline) out.incomplete.push('baseline');
  if (!out.scenario) out.incomplete.push('scenarios');
  if (target !== null && !out.requirements) out.incomplete.push('requirements');
  out.why = !out.incomplete.length ? '' : out.incomplete.includes('baseline')
    ? 'The economics module has no reconciled baseline for these answers yet, so the plan stays qualitative and no figure is shown.'
    : 'The economics module has not produced a scenario for these answers yet, so the plan stays qualitative and no figure is shown.';
  return out;
}
/** econ's own sensitivity row for price, when it has one: the one price figure the action library may quote */
function priceDriver(econ) {
  const rows = Array.isArray(econ?.scenario?.sensitivities) ? econ.scenario.sensitivities : [];
  const i = rows.findIndex((x) => /price|acv|deal value/i.test(String(x?.driver ?? '')));
  return i < 0 ? null : { ...rows[i], rank: i + 1 };
}
/** the intervention comparison, asked for the actions this plan actually proposes */
function compareEcon(s, cards) {
  const e = M.econ && typeof M.econ === 'object' ? M.econ : null;
  if (!e || typeof e.compare !== 'function') return [];
  const asks = cards.filter((k) => k.status === 'primary').map((k) => ({ id: k.id, action: k.action, area: k.area }));
  if (!asks.length) return [];
  try { const rows = e.compare(s, asks); return Array.isArray(rows) ? rows : []; } catch (err) { return []; }
}

/* ---------------------------------------------------------------- the owner action library */
const H = (hours) => ({ hours, label: `about ${hours} hour${hours === 1 ? '' : 's'} in the first two weeks (estimate)`, estimate: true });
const FREE = (currency) => ({ oneOff: 0, recurring: 0, currency, label: 'Nothing to buy', estimate: false });
const you = (r) => (r.solo ? 'You' : 'You, or whoever takes enquiries');
function bestClientWords(s) {
  try { const b = typeof M.bestClients === 'function' ? M.bestClients() : null; if (Array.isArray(b) && b.length) { const w = b.map((c) => c.type ?? c.buyer ?? c.label ?? c.who).filter(Boolean); if (w.length) return listWords([...new Set(w)].slice(0, 3)); } } catch (e) { /* below */ }
  // a chosen profile can be held as its id ("p1"): resolve it to the words the visitor read, never the id
  const seg = val(s, 'segment');
  if (seg) {
    if (typeof seg === 'object') return seg.label ?? seg.title ?? seg.text ?? '';
    const id = String(seg);
    if (/^(p\d+|best)$/.test(id)) {
      try { const hit = (M.customerProfiles?.() ?? []).find((p) => p.id === id); if (hit) return lower(hit.title ?? hit.text ?? ''); } catch (e) { /* below */ }
    } else return id;
  }
  const ic = val(s, 'idealCustomer'); if (ic) return String(ic);
  const buyer = lower(val(s, 'buyer'));
  return { consumer: 'individual customers', micro: 'small businesses', mid: 'mid-sized firms', enterprise: 'large companies', public: 'public bodies', mixed: 'the customers you want more of' }[buyer] ?? 'the customers you want more of';
}
const OWNER_ACTIONS = [
  /* the polish pack, 10.2: where delivery binds and capacity can be added cheaply and soon, adding it outranks the limit;
     where adding it is slow or costly, the limit stands first and says why. Once the added capacity meets converted
     demand, further capacity alone creates nothing: the likely next constraint is demand, and the action says so. */
  { id: 'capacity-add', area: 'capacity', applies: (c) => (c.r.room === 'none' || c.r.room === 'some') && c.r.capacityFlex === 'easy' && (c.r.moreWorkCost === null || c.r.oneOffBudget === null || c.r.moreWorkCost <= c.r.oneOffBudget),
    weight: (c) => (c.r.room === 'none' ? 1.35 : 1.0) - (c.r.moreWorkLead === 'months' ? 0.3 : 0),
    build: (c) => {
      const { r, econ, ev } = c;
      const unit = econ?.model === 'product' || econ?.model === 'digital' ? 'orders' : 'jobs';
      const cap = r.capacity, add = r.moreWorkAmount, to = cap !== null && add !== null ? cap + add : null;
      const how = r.moreWork === 'spare' ? 'with the spare capacity you have now' : 'with the helper, tool, supplier or partner you already have';
      const soon = r.moreWorkLead === 'days' ? 'inside days' : r.moreWorkLead === 'weeks' ? 'inside weeks' : r.moreWorkLead === 'months' ? 'over months' : r.moreWork === 'spare' ? 'now' : 'soon';
      const cost = r.moreWorkCost !== null ? (r.moreWorkCost === 0 ? 'at no one-off cost' : `for ${gbp(r.moreWorkCost)} one-off`) : 'at a cost you have not put a figure on';
      const demand = r.enquiries !== null && r.closeRate !== null ? Math.round(r.enquiries * r.closeRate) : null;
      const demandNext = demand !== null && to !== null && demand <= to;
      const ids = [ev.field('moreWork'), cap !== null ? ev.field('capacity') : null, known(c.s, 'breaksFirst') ? ev.field('breaksFirst') : null, demand !== null ? ev.field('enquiries') : null].filter(Boolean);
      return {
        action: to !== null ? `Add capacity ${how}: to ${count(to)} ${unit} a month` : `Add capacity ${how}`,
        whyFirst: `Delivery is what gives first, and you said more could be handled ${how}, ${soon}, ${cost}. Adding it moves the limit without turning work away${demandNext ? `; past about ${count(demand)} ${unit} a month converted, demand becomes the limit, not delivery` : ''}.`,
        steps: [
          `Write down what the extra ${add !== null ? `${count(add)} ${unit} a month` : 'capacity'} needs first, and who does it.`,
          'Take the next enquiries up to the new limit; keep a waiting list for anything past it.',
          'Record delivered work each week against the new limit.',
          demandNext ? `Watch enquiries: at about ${count(demand)} ${unit} a month converted, demand is the next limit.` : 'Watch whether quality, margin or another stage gives next.',
        ],
        responsible: r.moreWork === 'spare' ? you(r) : `${you(r)}, with whoever adds the capacity`,
        needs: [r.moreWork === 'helper' ? 'The helper, tool, supplier or partner agreed and available' : 'The spare capacity confirmed in the diary'],
        effort: H(r.moreWorkLead === 'months' ? 8 : 3), cost: r.moreWorkCost !== null && r.moreWorkCost > 0 ? { oneOff: r.moreWorkCost, recurring: 0, currency: c.currency, label: `${gbp(r.moreWorkCost)} one-off, your figure`, estimate: false } : FREE(c.currency),
        doneWhen: to !== null ? `${count(to)} ${unit} delivered in a month without quality slipping` : 'The added capacity delivering, without quality slipping',
        measure: 'Delivered work a month against the new limit, and quality complaints',
        changeCourseIf: 'Quality or margin slips, or the extra capacity is not in place inside the lead time: fall back to the capacity limit and a waiting list',
        asset: 'booking-process', evidenceIds: ids,
      };
    } },
  { id: 'capacity-limit', area: 'capacity', applies: (c) => c.r.room === 'none' || c.r.room === 'some' || c.r.demand === 'strong',
    weight: (c) => (c.r.room === 'none' ? 1.2 : 0.9) - (c.r.capacityFlex === 'easy' ? 0.3 : 0),
    build: (c) => {
      const { r, econ, ev, s } = c;
      const capKnown = r.capacity !== null;
      const util = finite(econ?.utilisation?.value) ? econ.utilisation.value : null;
      const ids = [ev.field('canDeliverMore'), ev.field('breaksFirst'), capKnown ? ev.field('capacity') : null, util !== null ? ev.calc('utilisation', 'How full you are today', Math.round(util * 100), '%', 'the economics module: the resource needed ÷ the resource available') : null].filter(Boolean);
      const unit = econ?.model === 'product' || econ?.model === 'digital' ? 'orders' : 'jobs';
      const weekly = capKnown ? Math.max(1, Math.round((r.capacity / 4.33) * 10) / 10) : null;
      return {
        action: 'Set a weekly capacity limit and a waiting list',
        whyFirst: `${lower(val(s, 'canDeliverMore')) === 'no' || /^no\b/.test(lower(val(s, 'canDeliverMore'))) ? 'You said you could not deliver more next month' : 'Delivery, not demand, is what gives first'}${util !== null && util >= 0.6 ? `, and you are ${pct(util)} full today` : ''}${r.capacityFlex === 'slow' ? '. Adding capacity would mean hiring, buying or building first, so the limit comes before that' : r.capacityFlex === 'none' ? '. You said more work would cost quality or margin, so the limit protects both' : ''}. Taking on more without a limit turns new customers into waiting customers, and customers who wait buy less often.`,
        steps: [
          capKnown ? `Write the limit down: ${count(r.capacity)} ${unit} a month, about ${count(weekly)} a week.` : `Count the ${unit} you completed in the last four weeks; that number is the weekly limit until you change it.`,
          'Make it the booking rule: an enquiry past the limit gets a date, never a no.',
          `Give ${r.solo ? 'yourself' : 'whoever takes enquiries'} the two replies to use (the booking process below).`,
          'Keep a list of enquiries past the limit: date in, date offered, taken or gone.',
        ],
        responsible: you(r), needs: ['The last four weeks of jobs', 'Whoever answers enquiries'], effort: H(3), cost: FREE(c.currency),
        doneWhen: 'A written limit and a waiting-list reply in use for every enquiry past it',
        measure: 'Enquiries past the limit that took a later date rather than going elsewhere, counted weekly for four weeks',
        changeCourseIf: 'More than half of the waiting enquiries go elsewhere within four weeks: the limit is costing sales, so move to the price rise or the overflow partner',
        asset: 'booking-process', evidenceIds: ids,
      };
    } },
  { id: 'price-rise', area: 'offer', applies: (c) => c.r.demand === 'strong' || c.r.demand === 'leaning strong' || c.r.priceSignal >= 1 || priceDriver(c.econ) !== null,
    weight: (c) => (c.r.room === 'none' ? 1.1 : 0.8) + (c.r.priceSignal >= 1 ? 0.3 : 0) + (priceDriver(c.econ)?.rank === 1 ? 0.3 : 0) - (c.r.avoided.some((a) => /pric/.test(a)) ? 0.2 : 0),
    build: (c) => {
      const { r, econ, ev, s } = c;
      /* the only price figure allowed here is econ's own sensitivity for the price driver, in its own units */
      const driver = priceDriver(econ);
      const ids = [r.priceRaised ? ev.field('priceRaised') : null, known(s, 'canDeliverMore') ? ev.field('canDeliverMore') : null, r.price !== null ? ev.field('price') : null, driver && finite(driver.effect) ? ev.calc('sens_price', 'Price: what the economics module says a change in it moves', driver.effect, driver.unit ?? null, 'the economics module, the price driver moved, the rest held as given') : null].filter(Boolean);
      const why = [
        /long/.test(r.priceRaised) ? 'Your last price rise was over three years ago' : /never/.test(r.priceRaised) ? 'You have never raised prices' : r.room === 'none' ? 'You cannot deliver more, so the next revenue comes from each job, not more jobs' : 'Demand is not the constraint',
        driver && finite(driver.effect) ? `; the economics module puts the price driver at ${driver.effect}${driver.unit ? ` ${driver.unit}` : ''}, with every other driver held as given, and demand may change` : '',
        '.',
      ].join('');
      return {
        action: 'Raise the price on new work',
        whyFirst: why,
        steps: [
          `Set the new price for new enquiries from next Monday${r.price !== null ? ` (today’s figure: ${gbp(r.price)} a sale)` : ''}; work already agreed stays at the old price.`,
          'Rewrite the quote with the new price and what it includes (the offer sheet below).',
          'For the next ten quotes, note the price and whether it was accepted.',
          'Tell repeat customers the new price a month before it applies to them (the notice below).',
        ],
        responsible: 'You', needs: ['The quote template', 'The list of repeat customers'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'The new price on every quote sent from the start date',
        measure: 'Acceptance on the next ten quotes against the last ten at the old price',
        changeCourseIf: 'Fewer than half of the next ten quotes are accepted where more than half were before: hold the old price for repeat customers and keep the new one for new enquiries',
        asset: 'offer-sheet', evidenceIds: ids, scenarioId: driver ? 'driver:price' : null,
      };
    } },
  { id: 'delivery-checklist', area: 'process', applies: (c) => c.r.evidence.process?.length > 0 || c.r.ownerBound || c.r.delegationNeeded || c.r.room === 'none' || has(val(c.s, 'qualitySlip'), /quality|speed|hours/),
    weight: (c) => (c.r.goalKind === 'time' ? 1.2 : 0.8) + (c.r.ownerBound ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const fp = c.founder;
      const ids = [known(s, 'holdup') ? ev.field('holdup') : null, known(s, 'holiday') ? ev.field('holiday') : null, known(s, 'delegation') ? ev.field('delegation') : null, known(s, 'breaksFirst') ? ev.field('breaksFirst') : null, known(s, 'qualitySlip') ? ev.field('qualitySlip') : null].filter(Boolean);
      const taker = r.solo ? 'a freelancer, a booking tool or a template' : 'a team member';
      const handed = fp?.actions?.find((a) => /hand|write down how/i.test(a.text))?.text ?? null;
      return {
        action: 'Write the delivery checklist and hand one step to someone else',
        whyFirst: `${r.ownerBound ? 'The business runs through you' : 'Work gets held up inside delivery'}${/stops|never/.test(lower(val(s, 'holiday'))) ? ': it stops when you are away' : ''}. A written checklist is the smallest thing that lets a step leave you without the result changing.`,
        steps: [
          'List every step of one typical job from enquiry to invoice, in order, in one sitting.',
          'Mark the steps only you can do; everything else is a candidate to hand over.',
          handed ? `${handed.replace(/\.$/, '')} this week, with the checklist as the instruction.` : `Give one candidate step to ${taker} this week, with the checklist as the instruction.`,
          'Check the first three handed-over jobs against the checklist, then stop checking every one.',
        ],
        responsible: 'You', needs: ['One recent job to walk through', r.solo ? 'A freelancer or a tool for the step you hand over' : 'The person who takes the step'], effort: H(4), cost: FREE(c.currency),
        doneWhen: 'A checklist in use, and one step done by someone else on three jobs',
        measure: 'Hours you spend on that step in week four against week one',
        changeCourseIf: 'The handed-over step comes back to you on more than one job in three: the checklist is missing a decision; add it and try again before taking the step back',
        asset: 'delivery-checklist', evidenceIds: ids,
      };
    } },
  { id: 'overflow-partner', area: 'capacity', applies: (c) => (c.r.room === 'none' || c.r.demand === 'strong') && (/yes|maybe|someone|partner/.test(lower(val(c.s, 'subcontract'))) || /now|steady/.test(lower(val(c.s, 'hiring')))),
    weight: (c) => 0.85,
    build: (c) => {
      const { r, ev, s } = c;
      const sub = lower(val(s, 'subcontract'));
      const ids = [ev.field('subcontract'), known(s, 'canDeliverMore') ? ev.field('canDeliverMore') : null, known(s, 'hiring') ? ev.field('hiring') : null].filter(Boolean);
      return {
        action: 'Line up one overflow partner for the work you turn away',
        whyFirst: `You said ${/yes/.test(sub) ? 'partners are ready now' : 'someone could take work at a cost'}, and you cannot deliver more yourself. Work past your limit can earn a margin instead of going elsewhere.`,
        steps: [
          'Name the one person or firm you would trust with a job of yours.',
          'Agree in writing: which jobs, at what rate, who the customer pays, who checks the work.',
          'Pass them the next job past your limit and go with them on the first one.',
          'Keep a count: jobs passed, paid, and any complaint.',
        ],
        responsible: 'You', needs: ['The partner’s rate', 'Your capacity limit (the action above)'], effort: H(3), cost: { oneOff: 0, recurring: null, currency: c.currency, label: 'The partner’s rate per job, paid from the job; not known yet', estimate: true },
        doneWhen: 'One job delivered by the partner and paid, with your margin recorded',
        measure: 'Jobs passed on and the margin kept on each, monthly',
        changeCourseIf: 'A complaint on the first two jobs, or a margin under what the hours of checking cost you: stop and return to the waiting list',
        asset: 'delivery-checklist', evidenceIds: ids, dependsOn: ['capacity-limit'],
      };
    } },
  { id: 'response-workflow', area: 'conversion', applies: (c) => c.r.evidence.response?.length > 0,
    weight: (c) => 1.0 + (c.r.demand === 'weak' ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'responseTime') ? ev.field('responseTime') : null, known(s, 'chooseThem') ? ev.field('chooseThem') : null, known(s, 'holdup') ? ev.field('holdup') : null, r.enquiries !== null ? ev.field('enquiries') : null].filter(Boolean);
      return {
        action: 'Reply to every enquiry within the hour, with a set reply',
        whyFirst: `${/days|slow|longer/.test(lower(val(s, 'responseTime'))) ? 'Enquiries wait a day or more for a reply' : 'Slow replies lose interested people'}, and you said that is where buyers drop out. A faster reply costs nothing and needs no new customers.`,
        steps: [
          'Write the two replies you send most: “we can do this, here is the next step” and “we are full until a date, here is the date” (the booking process below).',
          'Set the phone or inbox to alert on an enquiry; if you are on a job, the reply goes out at the next break.',
          'Log every enquiry with the time in and the time you replied, for four weeks.',
          'At four weeks, count enquiries that became jobs against the four weeks before.',
        ],
        responsible: you(r), needs: ['The enquiry inbox or phone', 'A log: a sheet or a notebook'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'Every enquiry in a week answered within the hour, shown by the log',
        measure: 'Enquiries that became jobs in the four weeks after, against the four weeks before',
        changeCourseIf: 'Replies are fast for four weeks and the share that becomes jobs does not move: speed was not the drop-out; move to the follow-up sequence or the proof',
        asset: 'booking-process', evidenceIds: ids,
      };
    } },
  { id: 'follow-up-sequence', area: 'conversion', applies: (c) => c.r.evidence.followUp?.length > 0 || (c.r.closeRate !== null && c.r.closeRate < 0.2 && c.r.enquiries !== null && c.r.enquiries >= 4),
    weight: (c) => 0.95 + (c.r.avoided.some((a) => /follow/.test(a)) ? 0.1 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'followUps') ? ev.field('followUps') : null, r.closeRate !== null ? ev.field('closeRate') : null, r.enquiries !== null ? ev.field('enquiries') : null, known(s, 'holdup') ? ev.field('holdup') : null].filter(Boolean);
      const fu = num(s, 'followUps');
      return {
        action: 'Follow up every quote three times',
        whyFirst: `${fu === 0 ? 'You do not chase a quote' : fu === 1 ? 'You chase a quote once' : 'Quotes go quiet'}${r.closeRate !== null && r.enquiries !== null ? `, and ${pct(r.closeRate)} of ${count(r.enquiries)} enquiries a month become customers` : ''}. Three written follow-ups turn quotes you have already earned into answers, without one more enquiry.`,
        steps: [
          'Write the three messages once: day 2, day 7, day 14; the last asks for a yes or a no (below).',
          'List every open quote from the last month and send message one today.',
          'Keep the list: quote date, the three send dates, the answer.',
          'After four weeks, count the quotes that closed after a follow-up.',
        ],
        responsible: you(r), needs: ['The list of open quotes', 'A calendar or a sheet for the send dates'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'Every quote from the last month has had message one, and the list is kept',
        measure: 'Quotes closed after a follow-up, and the share of quotes answered either way, over four weeks',
        changeCourseIf: 'Four weeks of follow-ups and no quote closes after one: the lost quotes are not going quiet, they are choosing elsewhere; look at price and proof',
        asset: 'follow-up-sequence', evidenceIds: ids,
      };
    } },
  { id: 'proof-collection', area: 'trust', applies: (c) => c.r.trustWeak,
    weight: (c) => 0.9 + (c.r.demand === 'weak' ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'reviews') ? ev.field('reviews') : null, known(s, 'chooseThem') ? ev.field('chooseThem') : null, known(s, 'website') ? ev.field('website') : null].filter(Boolean);
      const tool = c.tools.find((t) => t.id === 'reviews')?.rows?.[0] ?? null;
      return {
        action: 'Ask the last ten customers for a review, this week',
        whyFirst: `${/none/.test(lower(val(s, 'reviews'))) ? 'You have no reviews' : 'You have under ten reviews'}${has(val(s, 'chooseThem'), /trust|heard/) ? ', and you said people who had not heard of you did not buy' : ''}. Proof from people like the buyer is the cheapest thing that moves a first purchase.`,
        steps: [
          'List the last ten customers you would want more of.',
          `Send each the request below, with the link where the review goes${tool ? ` (${tool.tool}: ${tool.tier})` : ''}.`,
          'Put the first three reviews on the quote and the offer sheet.',
          'From now on, ask on the day a job finishes.',
        ],
        responsible: 'You', needs: ['The last ten customers’ contact details', tool ? `A ${tool.tool} page` : 'A place for the reviews to go'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'Ten requests sent and at least three reviews live and quoted on the offer sheet',
        measure: 'Reviews received in four weeks, and enquiries that mention them',
        changeCourseIf: 'Fewer than two of ten reply within four weeks: ask by phone instead of by message, and ask the next customer on the day',
        asset: 'review-request', evidenceIds: ids,
      };
    } },
  { id: 'offer-sheet', area: 'buyer', applies: (c) => c.r.demand === 'weak' || c.r.demand === 'leaning weak' || c.r.evidence.offerUnclear?.length > 0 || c.r.evidence.buyer?.length > 0,
    weight: (c) => 1.0 + (c.r.evidence.offerUnclear?.length ? 0.3 : 0) + (c.r.evidence.buyer?.length ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const who = bestClientWords(s);
      const ids = [known(s, 'lastFive') ? ev.field('lastFive') : null, known(s, 'segment') ? ev.field('segment') : null, known(s, 'buyer') ? ev.field('buyer') : null, known(s, 'chooseThem') ? ev.field('chooseThem') : null, known(s, 'chooseYou') ? ev.field('chooseYou') : null, known(s, 'canDeliverMore') ? ev.field('canDeliverMore') : null].filter(Boolean);
      const why = arr(val(s, 'chooseYou')).map(lower);
      return {
        action: `Rewrite the offer as one page for ${who}`,
        whyFirst: `${r.room === 'plenty' ? 'You have room for more work' : 'You want more of a particular customer'}${r.evidence.offerUnclear?.length ? ', and you said an unclear offer or a narrow range is what stops buyers' : r.enquiries !== null && r.enquiries <= 3 ? `, and ${count(r.enquiries)} enquiries a month is too few to work with` : ''}. One page that says who it is for, what they get and what it costs is the thing every other step sends people to.`,
        steps: [
          `Name the customer it is for: ${who}.`,
          `Write what they get, what it costs, what happens first, and the one reason they choose you${why.length ? ` (you said: ${listWords(why)})` : ''}.`,
          'Replace the first page of your quote with it.',
          'Send it to the next five enquiries and write down the questions they ask back.',
        ],
        responsible: 'You', needs: ['Your best clients’ common ground', 'Your current quote'], effort: H(3), cost: FREE(c.currency),
        doneWhen: 'The page exists and is the first thing the next five enquiries see',
        measure: 'Questions asked back by the next five enquiries, and how many go to a quote',
        changeCourseIf: 'Three of five ask the same question: the page is missing it; add it. None of five go to a quote: the customer named is wrong, not the page',
        asset: 'offer-sheet', evidenceIds: ids,
      };
    } },
  { id: 'referral-ask', area: 'channel', applies: (c) => (c.r.warm >= 1 || c.r.networkUsable) && c.r.askedYet !== 'unavailable',
    weight: (c) => 1.0 + (c.r.warm >= 2 ? 0.3 : 0) + (c.r.askedYet === 'no' ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'lastFive') ? ev.field('lastFive') : null, known(s, 'network') ? ev.field('network') : null, known(s, 'asked') ? ev.field('asked') : null, known(s, 'channel') ? ev.field('channel') : null].filter(Boolean);
      const who = bestClientWords(s);
      return {
        action: 'Ask the customers and partners who already send you work for one introduction each',
        whyFirst: `${r.warm >= 2 ? 'Your best customers came through people who knew you' : 'You have people who would help'}${r.askedYet === 'no' ? ', and you have not asked them yet' : ''}. One introduction each is the cheapest enquiry you can get, and it arrives already trusting you.`,
        steps: [
          'List the customers and partners who sent you work in the last year.',
          `Send each the ask below: one kind of customer (${who}), one line on why, one introduction.`,
          'Reply to every introduction within the day.',
          'Count over four weeks: asks sent, introductions received, jobs won.',
        ],
        responsible: 'You', needs: ['The list of people who referred you', 'The offer sheet to send with the introduction'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'Every referrer asked once, in writing, with the customer named',
        measure: 'Introductions received in four weeks, and how many became a conversation',
        changeCourseIf: 'Ten asks and no introduction in four weeks: the ask is too vague; name a specific person or firm you want to meet and ask again',
        asset: 'referral-ask', evidenceIds: ids,
      };
    } },
  { id: 'outreach-list', area: 'channel', applies: (c) => !c.r.wontCold && !c.r.accessNone,
    weight: (c) => 0.8 + (c.r.market !== null ? 0.2 : 0) + (/list|contact|community|audience/.test(c.r.accessWords) ? 0.2 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'access') ? ev.field('access') : null, r.market !== null ? ev.field('market') : null, known(s, 'segment') ? ev.field('segment') : null, known(s, 'trigger') ? ev.field('trigger') : null, known(s, 'wontDo') ? ev.field('wontDo') : null].filter(Boolean);
      const who = bestClientWords(s);
      const trig = val(s, 'trigger');
      const n = r.market !== null ? Math.min(50, Math.round(r.market)) : 20;
      return {
        action: `Define the outreach list of ${count(n)} ${who} and send the first twenty messages by hand`,
        whyFirst: `You have room for more work and a way to reach people (${r.accessWords || 'you said you know where they are'})${r.market !== null ? `, and you said about ${count(r.market)} suitable customers are within reach this month; they do not need to have agreed to buy` : ''}. Twenty messages by hand tell you the reply rate before any spend.`,
        steps: [
          `Write the list definition in one line: ${who}${trig ? `, when ${lower(typeof trig === 'object' ? trig.label ?? trig.text : trig)}` : ''}. Aim for ${count(n)} names.`,
          `Find them where you said you could (${r.accessWords || 'your contacts and lists'}).`,
          'Send the message below to twenty of them, by hand, over one week.',
          'Log every reply; offer a conversation to each positive one.',
        ],
        responsible: 'You', needs: ['Somewhere to keep the list (a sheet is enough)', 'The offer sheet'], effort: H(4), cost: FREE(c.currency),
        doneWhen: 'Twenty messages sent and the replies logged',
        measure: 'Replies and conversations from twenty messages, at the end of week two',
        changeCourseIf: 'Under two replies from twenty: change the list definition or the message before sending more; do not send two hundred',
        asset: 'outreach-message', evidenceIds: ids,
      };
    } },
  { id: 'partner-conversation', area: 'channel', applies: (c) => (c.r.networkUsable || c.r.flops.length > 0 || c.r.accessNone),
    weight: (c) => 0.7 + (c.r.accessNone ? 0.3 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'network') ? ev.field('network') : null, known(s, 'access') ? ev.field('access') : null, known(s, 'went') ? ev.field('went') : null].filter(Boolean);
      const who = bestClientWords(s);
      return {
        action: 'Open one conversation with a business that already serves your customers',
        whyFirst: `${r.accessNone ? 'You have no clear route to new customers' : 'A partner who already talks to your customers can introduce you'}${r.flops.length ? `, and ${listWords(r.flops.map((f) => CHANNEL_WORDS[f] ?? f))} did not work` : ''}. One partner sends the same kind of customer again and again.`,
        steps: [
          `Name three businesses whose customers are ${who} and who do not do what you do.`,
          'Send each the introduction message below and ask for twenty minutes.',
          'In the conversation, agree one thing each of you will send the other, and how.',
          'Count referrals each way for eight weeks.',
        ],
        responsible: 'You', needs: ['The three names', 'The offer sheet'], effort: H(3), cost: FREE(c.currency),
        doneWhen: 'One conversation held and one referral arrangement agreed in writing',
        measure: 'Referrals received from the partner in eight weeks',
        changeCourseIf: 'Three asks and no meeting: the partners see no gain; offer to send them work first for a month',
        asset: 'introduction-message', evidenceIds: ids,
      };
    } },
  { id: 'stop-channel', area: 'channel', applies: (c) => c.r.flops.some((f) => c.r.doing.includes(f)),
    weight: () => 0.6,
    build: (c) => {
      const { r, ev, s } = c;
      const f = r.flops.find((x) => r.doing.includes(x));
      const w = CHANNEL_WORDS[f] ?? f;
      return {
        action: `Stop ${w} until something about it changes`,
        whyFirst: `You said ${w} gave no result and you are still doing it. Repeating a route without changing the list, the message or the offer repeats the result.`,
        steps: [`Pause ${w} at the end of this week.`, 'Write down what it cost in hours and money over the last three months.', 'Decide what would be different next time: the list, the message or the offer. Restart only with that change.'],
        responsible: 'You', needs: ['The last three months of spend and hours'], effort: H(1), cost: FREE(c.currency),
        doneWhen: `${cap(w)} paused and the cost written down`,
        measure: 'Hours and money freed, and where they went',
        changeCourseIf: 'A change to the list, the message or the offer is ready: restart as a four-week test with a spending cap',
        asset: null, evidenceIds: [ev.field('went'), ev.field('channel')].filter(Boolean),
      };
    } },
  { id: 'growth-spend', area: 'channel', applies: (c) => c.r.budget !== null && c.r.budget > 0 && !!firstChannel(c.eng) && !(c.r.wontAds && /paid/.test(firstChannel(c.eng)?.channel ?? '')),
    weight: (c) => 0.6 + (c.r.demand === 'weak' ? 0.2 : 0),
    build: (c) => {
      const { r, ev, eng } = c;
      const fc = firstChannel(eng);
      const w = CHANNEL_WORDS[fc.channel] ?? fc.channel;
      /* the demand reading picks the route; the only figure here is the budget the owner gave (D1) */
      const ids = [ev.field('budget'), ev.assume('first_channel', `Why ${w} first`, `The demand reading puts ${w} ahead of the other routes for this business. No reply count is claimed for it: the month of spend is what produces one.`)].filter(Boolean);
      return {
        action: `Put the growth budget on ${w} for one month and count replies`,
        whyFirst: `You have ${gbp(r.budget)} a month for growth and room for more work. ${cap(w)} is the route to try first, and one month of it produces the reply rate nobody has yet.`,
        steps: [`Spend one month on ${w} only, capped at ${gbp(r.budget)}.`, 'Send every reply to the offer sheet and log it.', 'At the end of the month, count replies, conversations and jobs against the spend.'],
        responsible: 'You', needs: ['The offer sheet', 'A log of replies'], effort: H(3), cost: { oneOff: 0, recurring: r.budget, currency: c.currency, label: `${gbp(r.budget)} a month, your figure`, estimate: false },
        doneWhen: 'One month of spend on one route with every reply logged',
        measure: 'Cost per reply and per job at the end of the month',
        changeCourseIf: 'No conversation that could become a job by the end of the month: stop, and change the list or the message before spending again',
        asset: 'outreach-message', evidenceIds: ids,
      };
    } },
  { id: 'delegate-area', area: 'delegation', applies: (c) => c.r.delegationNeeded || (c.r.goalKind === 'time' && !c.r.solo),
    weight: (c) => (c.r.goalKind === 'time' || c.r.goalKind === 'sell' ? 1.3 : 0.7),
    build: (c) => {
      const { r, ev, s } = c;
      const fp = c.founder;
      const ids = [known(s, 'delegation') ? ev.field('delegation') : null, known(s, 'futureRole') ? ev.field('futureRole') : null, known(s, 'win') ? ev.field('win') : null, known(s, 'holiday') ? ev.field('holiday') : null].filter(Boolean);
      const area = fp?.intended?.delegate?.[0] ?? fp?.delegate?.[0] ?? null;
      const areaWords = area ? area.split(':')[0] : (r.avoided[0] ? cap(r.avoided[0]) : 'the area you would most like to be out of');
      return {
        action: `Hand over one whole area, result included: ${lower(areaWords)}`,
        whyFirst: `${r.goalKind === 'time' ? 'Your goal is your time back' : r.goalKind === 'sell' ? 'A business that can be sold runs without its owner' : 'You want a different role'}, and today ${/none/.test(lower(val(s, 'delegation'))) ? 'you do all of it yourself' : /checks/.test(lower(val(s, 'delegation'))) ? 'you check all the work you hand over' : 'the work runs through you'}. Hours come back only when a result, not a task, belongs to someone else.`,
        steps: [
          `Choose the area: ${lower(areaWords)}. Write the result you want from it in one line.`,
          r.solo ? 'Choose who takes it: a freelancer, a bookkeeper, a booking tool. Agree the result and a weekly check-in.' : 'Choose who takes it. Agree the result, not the method, and a weekly check-in.',
          'Hand it over on a set date and do not take it back for four weeks.',
          'At four weeks, compare the result with the line you wrote.',
        ],
        responsible: 'You', needs: [r.solo ? 'A freelancer or a tool for the area' : 'The person who takes it', 'The delivery checklist for that area'], effort: H(4), cost: { oneOff: 0, recurring: null, currency: c.currency, label: r.solo ? 'A freelancer’s or a tool’s fee, not known yet' : 'Nothing to buy', estimate: r.solo },
        doneWhen: 'The area belongs to someone else for four weeks and the result matches the line',
        measure: 'Your hours in that area in week four, and the result against the line',
        changeCourseIf: 'The result misses the line twice in four weeks: the line was unclear or the person lacks a decision rule; fix the rule before taking the area back',
        asset: 'delivery-checklist', evidenceIds: ids,
      };
    } },
  { id: 'deposit-terms', area: 'cash', applies: (c) => c.r.cash >= 1,
    weight: (c) => 0.8 + (c.r.cash >= 2 ? 0.4 : 0) + (c.r.goalKind === 'predictability' ? 0.3 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'terms') ? ev.field('terms') : null, r.owed !== null ? ev.field('owed') : null, known(s, 'runway') ? ev.field('runway') : null, known(s, 'worry') ? ev.field('worry') : null].filter(Boolean);
      const bank = c.uk ? ev.src('boe_bank_rate') : null;
      if (bank) ids.push(bank);
      return {
        action: 'Take a deposit on every new job and chase what is owed this week',
        whyFirst: `${/sixty|60/.test(r.terms) ? 'Customers pay at 60 days or more' : /thirty|30/.test(r.terms) ? 'Customers pay within 30 days' : 'Money arrives after the costs'}${r.owed !== null ? `, and ${gbp(r.owed)} is outstanding` : ''}. Growth on those terms costs cash before it earns any.`,
        steps: [
          'List every invoice past its date and send each a one-line reminder today; phone the three largest.',
          'Put a deposit on every new quote from next Monday: a share on booking, the rest on completion.',
          'Put the terms on the offer sheet and the quote so nobody is surprised.',
          'Count cash in each week for four weeks.',
        ],
        responsible: 'You', needs: ['The list of unpaid invoices', 'The quote template'], effort: H(2), cost: FREE(c.currency),
        doneWhen: 'Every overdue invoice chased once, and the deposit on every new quote',
        measure: 'Days from invoice to payment on new jobs, and the outstanding total, monthly',
        changeCourseIf: 'Two of the next five customers refuse a deposit: keep it for new customers only and reduce the share',
        asset: 'price-notice', evidenceIds: ids,
      };
    } },
  { id: 'renewal-call', area: 'retention', applies: (c) => c.r.retentionWeak,
    weight: (c) => 1.0 + (c.r.goalKind === 'predictability' || c.r.goalKind === 'lasts' ? 0.3 : 0),
    build: (c) => {
      const { r, ev, s } = c;
      const ids = [known(s, 'retainerRenew') ? ev.field('retainerRenew') : null, known(s, 'repeat') ? ev.field('repeat') : null, known(s, 'repeatWork') ? ev.field('repeatWork') : null].filter(Boolean);
      const renew = num(s, 'retainerRenew');
      return {
        action: 'Call every customer a month before renewal',
        whyFirst: `${renew !== null ? `${count(renew)} in 10 renew` : 'Too few customers come back'}, and a customer kept costs less than one won. A call a month before the date finds the reason to leave while there is time to fix it.`,
        steps: ['List every customer with their renewal or last-purchase date.', 'Call each one a month before it: what worked, what did not, what would make them stay.', 'Fix the one thing named most often.', 'Count renewals over the next quarter against the last.'],
        responsible: 'You', needs: ['The customer list with dates'], effort: H(3), cost: FREE(c.currency),
        doneWhen: 'Every customer due in the next two months called, with the reasons written down',
        measure: 'Renewals this quarter against last quarter',
        changeCourseIf: 'The reasons named are about price or the offer rather than service: that is an offer change, not a call',
        asset: 'follow-up-sequence', evidenceIds: ids,
      };
    } },
  { id: 'count-enquiries', area: 'discovery', applies: (c) => c.r.enquiries === null && c.r.closeRate === null && !c.r.preRevenue,
    weight: (c) => (c.r.demand === 'unknown' ? 1.0 : 0.5),
    build: (c) => {
      const { ev } = c;
      return {
        action: 'Count enquiries and wins for four weeks',
        whyFirst: 'Mercer does not know how many enquiries you get or how many become customers, so it cannot tell whether the constraint is demand or the close. Four weeks of counting answers that.',
        steps: ['Keep one sheet: date, enquiry, source, quoted, won or lost, reason.', 'Fill it in the same day, every day, for four weeks.', 'At four weeks, add up enquiries, quotes and wins, and bring the figures back here.'],
        responsible: c.r.solo ? 'You' : 'Whoever takes enquiries', needs: ['A sheet or a notebook'], effort: H(1), cost: FREE(c.currency),
        doneWhen: 'Four weeks on the sheet with no gaps',
        measure: 'Enquiries a month and the share that become customers',
        changeCourseIf: 'Fewer than four enquiries in four weeks: demand is the constraint; start with the offer sheet and the referral ask',
        asset: null, evidenceIds: [ev.assume('enquiries_unknown', 'Enquiries and wins', 'Not known yet: the sheet supplies them')],
      };
    } },
  { id: 'customer-conversations', area: 'discovery', applies: (c) => c.r.sparse || c.r.demand === 'unknown',
    weight: (c) => (c.r.sparse ? 1.1 : 0.6),
    build: (c) => {
      const { ev, s } = c;
      return {
        action: 'Hold five conversations with recent customers',
        whyFirst: `${c.r.sparse ? 'Too little is known yet for a personalised diagnosis' : 'The picture of demand is unclear'}. Five conversations with people who already paid you say what they bought, why, and what nearly stopped them.`,
        steps: ['Pick five recent customers, not only the best.', 'Ask each three questions: why us, what nearly stopped you, what would you want next (the script below).', 'Write the answers down the same day.', 'Bring the three most repeated answers back here and refine the plan.'],
        responsible: 'You', needs: ['Five customers’ contact details'], effort: H(3), cost: FREE(c.currency),
        doneWhen: 'Five conversations held and written up',
        measure: 'Answers that repeat across three or more customers',
        changeCourseIf: 'Customers cannot say why they chose you: the offer needs a reason before any route needs more people',
        asset: 'validation-script', evidenceIds: [known(s, 'lastFive') ? ev.field('lastFive') : ev.assume('customer_reasons', 'Why customers buy', 'Not known yet')].filter(Boolean),
      };
    } },
  { id: 'paid-pilot', area: 'validation', applies: (c) => c.r.preRevenue,
    weight: () => 1.4,
    build: (c) => {
      const { ev, s } = c;
      const who = bestClientWords(s);
      return {
        action: 'Sell one paid pilot before building anything more',
        whyFirst: 'The business has not traded yet, so there is no trading data to diagnose. One paying customer is worth more than any forecast at this stage, and it is the only thing that turns the hypothesis into evidence.',
        steps: [`Write the one-page offer for ${who}: the result, the price, what happens first.`, 'Name five people who fit and send each the outreach message below.', 'Offer the first one a pilot at a price they agree in the conversation.', 'Deliver it by hand, write down the hours, and ask what they would have paid.'],
        responsible: 'You', needs: ['Five names', 'The offer sheet'], effort: H(6), cost: FREE(c.currency),
        doneWhen: 'One customer has paid for a pilot and it is delivered',
        measure: 'Paid pilots and the price agreed, over eight weeks',
        changeCourseIf: 'Five conversations and nobody will pay: keep the buyer and change the offer, or keep the offer and change the buyer; do not build',
        asset: 'offer-sheet', evidenceIds: [known(s, 'stage') ? ev.field('stage') : ev.field('now')].filter(Boolean),
      };
    } },
];

/* ---------------------------------------------------------------- ranking (brief 10.3): goal, feasibility, usefulness, evidence, dependencies */
const GOAL_W = {
  time: { delegation: 2.0, process: 1.5, capacity: 1.2, offer: 1.0, cash: 0.8, channel: 0.5, buyer: 0.6, trust: 0.6, conversion: 0.8, retention: 0.9, discovery: 0.8, validation: 1 },
  income: { offer: 1.3, capacity: 1.1, channel: 1.1, buyer: 1.1, conversion: 1.2, trust: 1.0, process: 0.9, delegation: 0.7, cash: 0.9, retention: 1.0, discovery: 0.9, validation: 1 },
  growth: { channel: 1.2, buyer: 1.2, conversion: 1.1, trust: 1.0, capacity: 1.1, offer: 1.0, process: 0.9, delegation: 0.8, cash: 0.8, retention: 1.0, discovery: 0.9, validation: 1 },
  predictability: { retention: 1.5, cash: 1.3, process: 1.2, conversion: 1.0, channel: 0.9, buyer: 0.9, trust: 0.9, capacity: 1.0, offer: 0.9, delegation: 0.9, discovery: 0.9, validation: 1 },
  sell: { delegation: 1.5, process: 1.5, retention: 1.2, cash: 1.0, capacity: 0.9, offer: 0.9, channel: 0.8, buyer: 0.8, trust: 0.8, conversion: 0.9, discovery: 0.8, validation: 1 },
  lasts: { process: 1.3, delegation: 1.3, retention: 1.2, cash: 1.1, capacity: 0.9, offer: 0.9, channel: 0.9, buyer: 0.9, trust: 0.9, conversion: 0.9, discovery: 0.9, validation: 1 },
  beat: { offer: 1.2, buyer: 1.2, trust: 1.2, conversion: 1.1, channel: 1.0, capacity: 0.9, process: 0.8, delegation: 0.7, cash: 0.8, retention: 0.9, discovery: 0.9, validation: 1 },
};
const DEFAULT_W = { offer: 1, capacity: 1, channel: 1, buyer: 1, conversion: 1, trust: 1, process: 1, delegation: 1, cash: 1, retention: 1, discovery: 1, validation: 1 };
/** the areas with their evidence weight for this owner */
function areaScores(r) {
  const a = { capacity: 0, process: 0, offer: 0, buyer: 0, trust: 0, channel: 0, conversion: 0, delegation: 0, cash: 0, retention: 0, discovery: 0, validation: 0 };
  if (r.preRevenue) { a.validation = 3; a.discovery = 1; return a; }
  if (r.demand === 'strong') { a.capacity = 2.5; a.offer = 1.8; a.process = 1.6; }
  else if (r.demand === 'leaning strong') { a.capacity = 1.5; a.offer = 1.3; a.process = 1.2; }
  if (r.demand === 'weak') { a.buyer = 2.0; a.channel = 1.8; a.trust = r.trustWeak ? 1.8 : 0.8; a.offer = Math.max(a.offer, 1.2); }
  else if (r.demand === 'leaning weak') { a.buyer = 1.4; a.channel = 1.3; a.trust = r.trustWeak ? 1.3 : 0.6; }
  if (r.demand === 'unknown') { a.discovery = 1.6; a.buyer = 0.8; a.conversion = 0.8; }
  a.conversion += r.conversion * 0.8 + (r.evidence.response?.length ? 0.3 : 0) + (r.evidence.followUp?.length ? 0.3 : 0);
  a.trust += r.trustWeak ? 0.8 : 0;
  a.process += (r.evidence.process?.length ? 0.8 : 0) + (r.ownerBound ? 0.6 : 0);
  a.delegation += (r.delegationNeeded ? 2.0 : 0) + (r.ownerBound ? 0.4 : 0);
  a.cash += r.cash * 0.7;
  a.offer += r.priceSignal * 0.5;
  a.retention += r.retentionWeak ? 1.8 : 0;
  a.channel += (r.warm >= 2 || r.networkUsable ? 0.4 : 0) - (r.accessNone ? 0.4 : 0);
  if (r.sparse) { a.discovery += 1.5; }
  return a;
}
/** why an action must wait: the two rules of brief 18.1 and the resources it competes for */
const LEADGEN = new Set(['channel', 'buyer']);
function waitReason(t, r) {
  /* D12: an owner who asked for their time back is not sent to find more work unless demand is what is failing */
  if (r.goalKind === 'time' && LEADGEN.has(t.area) && t.id !== 'stop-channel' && r.demand !== 'weak' && r.demand !== 'leaning weak') return 'Lead generation waits: you asked for your time back, and more enquiries add hours before they add anything else';
  if ((r.demand === 'strong' || (r.room === 'none' && r.demand !== 'weak')) && LEADGEN.has(t.area) && t.id !== 'stop-channel') return 'Lead generation waits: you cannot deliver more this month, so more enquiries would wait, not buy';
  if (r.demand === 'weak' && r.room === 'plenty' && t.area === 'capacity') return 'Capacity waits: you have room for more work, so demand is the constraint to work on first';
  if (r.wontCold && t.id === 'outreach-list') return 'You said cold outreach is off the table';
  return null;
}
/* D12: with a time goal the score is scaled down by the hours an action takes, so of two actions with the same
   evidence the one that costs the owner fewer hours ranks first. Six is the scale, not a figure shown anywhere */
const FEWER_HOURS_SCALE = 6;
function rankOwner(c) {
  const { r } = c;
  const gw = GOAL_W[r.goalKind] ?? DEFAULT_W;
  const areas = areaScores(r);
  const candidates = [];
  OWNER_ACTIONS.forEach((t) => {
    let applies = false;
    try { applies = !!t.applies(c); } catch (e) { applies = false; }
    if (!applies) return;
    const w = t.weight(c);
    let score = (areas[t.area] + 0.2) * (gw[t.area] ?? 1) * w;
    if (r.goalKind === 'time') { let hours = null; try { hours = t.build(c)?.effort?.hours ?? null; } catch (e) { hours = null; } if (finite(hours)) score *= FEWER_HOURS_SCALE / (FEWER_HOURS_SCALE + hours); }
    candidates.push({ t, score, waits: waitReason(t, r) });
  });
  candidates.sort((a, b) => b.score - a.score);
  /* D11: "Use this direction" on an owner alternative promotes that action to the front of the same ranking */
  if (c.prefer) { const i = candidates.findIndex((cd) => cd.t.id === c.prefer && !cd.waits); if (i > 0) candidates.unshift(candidates.splice(i, 1)[0]); }
  const usedAreas = new Set();
  const primaries = [], next = [], waiting = [];
  candidates.forEach((cd) => {
    if (cd.waits) { waiting.push(cd); return; }
    if (primaries.length < 3 && !usedAreas.has(cd.t.area)) { usedAreas.add(cd.t.area); primaries.push(cd); return; }
    if (next.length < 2 && !usedAreas.has(cd.t.area)) { usedAreas.add(cd.t.area); next.push(cd); return; }
    if (next.length < 2 && primaries.length >= 3) { next.push(cd); }
  });
  return { primaries, next, waiting, areas, considered: candidates };
}

/* ---------------------------------------------------------------- the owner plan */
function makeCard(cd, c, i, status, reason) {
  const b = cd.t.build(c);
  return {
    id: cd.t.id, area: cd.t.area, priority: status === 'primary' ? i + 1 : null, status, waitReason: reason ?? null,
    action: b.action, whyFirst: b.whyFirst, steps: b.steps, responsible: b.responsible, needs: b.needs,
    effort: b.effort, cost: b.cost, doneWhen: b.doneWhen, measure: b.measure, changeCourseIf: b.changeCourseIf,
    asset: b.asset ?? null, evidenceIds: [...new Set((b.evidenceIds ?? []).filter(Boolean))], dependsOn: b.dependsOn ?? [], scenarioId: b.scenarioId ?? null,
  };
}
/** hours and money the primaries compete for (brief 10.3): a primary that does not fit inside the owner's hours in the
    first fortnight follows the one before it instead of running beside it */
function resolveResources(cards, r, currency) {
  const weekly = r.hours;
  const fortnight = weekly !== null ? weekly * 2 : null;
  let used = 0, oneOff = 0, recurring = 0;
  cards.forEach((k, i) => {
    used += k.effort.hours;
    oneOff += Number(k.cost.oneOff) || 0;
    recurring += Number(k.cost.recurring) || 0;
    if (fortnight !== null && used > fortnight && i > 0) { k.sequence = 'after'; k.sequenceNote = `Starts when action ${i} is done: ${count(weekly)} hours a week do not cover both at once.`; }
    else k.sequence = i === 0 ? 'first' : 'alongside';
    if (r.oneOffBudget !== null && oneOff > r.oneOffBudget && (Number(k.cost.oneOff) || 0) > 0) { k.sequence = 'after'; k.sequenceNote = `Waits for the budget: ${gbp(r.oneOffBudget)} is spent by the actions before it.`; }
  });
  const totals = {
    hours: { needed: used, period: 'the first two weeks', available: fortnight, weekly, fits: fortnight === null ? null : used <= fortnight, estimate: true },
    oneOff: { needed: oneOff, available: r.oneOffBudget, currency, fits: r.oneOffBudget === null ? null : oneOff <= r.oneOffBudget },
    recurring: { needed: recurring, available: r.budget, currency, period: 'a month', fits: r.budget === null ? null : recurring <= r.budget },
    note: fortnight === null ? 'Your hours a week for this are not known yet; the sequence assumes one action at a time.' : used <= fortnight ? `${count(used)} hours over the first two weeks fits inside the ${count(fortnight)} you have in that time.` : `${count(used)} hours over the first two weeks is more than your ${count(weekly)} hours a week; the actions run one after another.`,
  };
  return totals;
}
const AREA_FINDING = {
  capacity: (c) => ({ headline: 'Demand is not your constraint. Delivery is.', text: `${c.r.evidence.demandStrong?.length ? 'You cannot deliver more next month' : 'Delivery gives first'}${finite(c.econ?.utilisation?.value) && c.econ.utilisation.value >= 0.6 && known(c.s, 'capacity') ? `, and you are ${pct(c.econ.utilisation.value)} full today` : ''}${c.r.spareTime === 'little' ? `, with ${count(c.r.hours)} hours a week to change anything` : ''}. More enquiries would wait, not buy. The next revenue comes from the price of each job and from protecting the work you already have.`, alternative: 'If the work you turn away is work you would not want anyway, the constraint is the offer, not capacity: the offer sheet comes first.' }),
  offer: (c) => ({ headline: 'The price and the offer carry the next step.', text: `${/long|never/.test(c.r.priceRaised) ? 'Prices have not moved in years' : 'The offer is where the evidence points'}${c.r.room === 'none' ? ' and you cannot deliver more' : ''}. Each sale has to earn more before more sales help.`, alternative: 'If customers already push back on price, the offer needs a clearer reason before a higher number.' }),
  buyer: (c) => ({ headline: 'Not enough of the right enquiries reach you.', text: `${c.r.room === 'plenty' ? 'You have room for more work' : 'There is room for more work'}${c.r.enquiries !== null ? ` and ${count(c.r.enquiries)} enquiries a month is not enough to fill it` : ''}. The first job is to say who the offer is for and put it in front of people who can reach them.`, alternative: 'If enquiries are arriving but not converting, the constraint is the close, not the buyer.' }),
  channel: (c) => ({ headline: 'The route to customers is the constraint.', text: `You have room for more work${c.r.accessNone ? ' and no clear route to new customers' : ' and people who could introduce you'}${c.r.flops.length ? `; ${listWords(c.r.flops.map((f) => CHANNEL_WORDS[f] ?? f))} did not work` : ''}. The cheapest enquiry comes through someone who already trusts you.`, alternative: 'If the offer page cannot say who it is for, fix that before sending anyone to it.' }),
  conversion: (c) => ({ headline: 'Enquiries arrive. Too few become customers.', text: `${c.r.enquiries !== null && c.r.closeRate !== null ? `${count(c.r.enquiries)} enquiries a month and ${pct(c.r.closeRate)} become customers. ` : ''}${c.r.evidence.response?.length ? 'Replies are slow' : c.r.evidence.followUp?.length ? 'Quotes are not chased' : 'The close is where buyers drop out'}, and fixing that needs no new enquiries.`, alternative: 'If the enquiries are the wrong kind of customer, the list definition, not the reply speed, is the problem.' }),
  trust: (c) => ({ headline: 'Buyers who do not know you do not buy.', text: `${/none/.test(lower(val(c.s, 'reviews'))) ? 'You have no reviews' : 'You have few reviews'} and you said people who had not heard of you did not buy. Proof from customers like the buyer is the cheapest thing that moves a first purchase.`, alternative: 'If most enquiries already come by referral, trust is not the drop-out; the close is.' }),
  process: (c) => ({ headline: 'Work gets held up inside delivery.', text: `${c.r.ownerBound ? 'The business runs through you' : 'Delivery has a hold-up you named'}. A written checklist is the smallest thing that lets a step leave you without the result changing.`, alternative: 'If the hold-up is one person’s hours, the answer is capacity or an overflow partner rather than a process.' }),
  delegation: (c) => ({ headline: 'The business runs through you, and your goal needs it not to.', text: `${c.r.goalKind === 'time' ? 'You want your time back' : c.r.goalKind === 'sell' ? 'You want a business you can sell' : 'You want a different role'}, and today ${/none/.test(lower(val(c.s, 'delegation'))) ? 'you do all of it yourself' : 'work you hand over comes back to you'}. Growth before delegation adds hours to you.`, alternative: 'If the hours go on selling rather than delivering, a follow-up sequence or a booking process frees more time than handing over delivery.' }),
  cash: (c) => ({ headline: 'Money arrives after the costs, and that limits every other step.', text: `${/sixty|60/.test(c.r.terms) ? 'Customers pay at 60 days or more' : 'Customers pay after the work'}${c.r.owed !== null ? ` and ${gbp(c.r.owed)} is outstanding` : ''}. Growth on those terms costs cash before it earns any.`, alternative: 'If the outstanding money is one large customer, the constraint is that customer’s share of revenue rather than the terms.' }),
  retention: (c) => ({ headline: 'Customers leave faster than they need to.', text: 'Too few customers renew or come back, and a customer kept costs less than one won. The first step is a call before the renewal date.', alternative: 'If the leavers were never a fit, the buyer definition, not retention, is the problem.' }),
  discovery: (c) => ({ headline: c.r.sparse ? 'A preliminary plan: too little is known for a diagnosis.' : 'Mercer cannot yet tell demand from the close.', text: c.r.sparse ? 'What the business sells and what it earns are not known yet, so nothing can be diagnosed from them. The actions below gather that evidence rather than assume it.' : 'Enquiries and wins are not known, so the constraint could be demand or the close. Four weeks of counting settles it.', alternative: null }),
  validation: (c) => ({ headline: 'Nothing has been sold yet, so the first job is a sale.', text: 'The business has not traded, so there is no trading data to diagnose and no forecast worth showing. One paying customer turns the hypothesis into evidence.', alternative: null }),
};
function unknownsOwner(s, r, eng) {
  const u = [];
  const add = (id, label, why) => { if (!u.some((x) => x.id === id)) u.push({ id, label, why }); };
  if (r.now === null) add('now', 'Monthly revenue', 'Without it Mercer cannot quantify any step.');
  if (r.price === null) add('price', 'What a sale is worth', 'Needed to turn a revenue gap into a count of sales.');
  if (r.capacity === null && !r.preRevenue) add('capacity', 'How much you can deliver a month', 'Without it capacity is Mercer’s estimate, and the constraint could be wrong.');
  if (r.enquiries === null && !r.preRevenue) add('enquiries', 'Enquiries a month', 'Needed to tell demand from the close.');
  if (r.closeRate === null && r.enquiries !== null) add('closeRate', 'How many enquiries become customers', 'Needed to size the close.');
  if (r.hours === null) add('changeHours', 'Hours a week you can give this', 'Sets how many actions can run at once.');
  if (r.budget === null && !r.preRevenue) add('budget', 'Money a month for growth', 'Decides whether any paid route is on the table.');
  if (r.market === null && r.demand !== 'strong' && !r.preRevenue) add('market', 'How many suitable customers you could reach this month', 'Sizes the outreach list; they do not need to have agreed to buy.');
  (eng?.assumed ?? []).forEach((a) => { const id = typeof a === 'string' ? a : a?.inputId ?? a?.field ?? null; if (id && INPUT_WORDS[id]) add(id, cap(INPUT_WORDS[id]), 'Mercer used an industry figure; yours would replace it.'); });
  return u;
}
/** the scenario section, built from `M.econ` alone (D1). Each row carries its own `mode` and `feasibility` so the
    results view can label it (D2). No probability, no percentile and no "1 in N runs" sentence (D3): where econ has
    no figure the section says so and the plan stays qualitative. */
function scenariosOwner(c, cards) {
  const { econ, ev, currency, r } = c;
  const unsupported = (why) => ({ supported: false, qualitative: true, why, list: [], combined: null, modes: [], label: 'Scenarios', validatedForecast: false, validatedForecastNote: VALIDATED_UNREACHABLE });
  if (!econ.available) return unsupported('The economics module has not loaded in this view, so no figure is shown. The actions below stand on their own.');
  if (r.preRevenue && !econ.scenario) return unsupported('No trading yet, so no scenario is quantified; the validation milestone is the measure.');
  if (!econ.baseline && !econ.scenario && !econ.requirements) return unsupported(econ.why || 'The economics module has produced no figure for these answers yet, so the plan stays qualitative.');

  const list = [];
  const b = econ.baseline;
  if (b && finite(b.revenue)) {
    const states = Object.values(b.values ?? {}).map((v) => v?.state);
    const observed = states.length > 0 && states.every((x) => x === 'observed');
    ev.calc('base_revenue', 'Revenue in the baseline period', Math.round(b.revenue), b.currency ?? currency, b.reconciliation?.note ?? 'the economics module’s reconciled baseline');
    list.push({ id: 'baseline', label: 'Today', metric: 'revenue', value: Math.round(b.revenue), unit: b.currency ?? currency, period: b.period ?? 'a month', basis: b.reconciliation?.note ?? 'your figures, reconciled by the economics module', interval: null, mode: observed ? 'operating_scenario' : 'illustrative', modeLabel: observed ? MODE_WORDS.operating_scenario : MODE_WORDS.illustrative, feasibility: null, scope: b.scope ?? null, evidenceIds: ['calc:base_revenue'] });
    if (finite(b.operatingResult)) {
      ev.calc('base_operating', 'Operating result in the baseline period', Math.round(b.operatingResult), b.currency ?? currency, 'contribution less the fixed costs, from the economics module');
      list.push({ id: 'baseline-operating', label: 'Operating result today', metric: 'operating result', value: Math.round(b.operatingResult), unit: b.currency ?? currency, period: b.period ?? 'a month', basis: 'contribution less the fixed costs of the same period', interval: null, mode: observed ? 'operating_scenario' : 'illustrative', modeLabel: observed ? MODE_WORDS.operating_scenario : MODE_WORDS.illustrative, feasibility: null, evidenceIds: ['calc:base_operating'] });
    }
    if (b.reconciliation && finite(b.reconciliation.gap) && Math.round(b.reconciliation.gap) !== 0) list.push({ id: 'baseline-gap', label: 'What the baseline does not reconcile', metric: 'difference between the figure you gave and the one built from its parts', value: Math.round(b.reconciliation.gap), unit: b.currency ?? currency, period: b.period ?? 'a month', basis: b.reconciliation.note ?? 'stated less built', interval: null, mode: 'illustrative', modeLabel: MODE_WORDS.illustrative, feasibility: null, evidenceIds: [] });
  }

  const sc = econ.scenario;
  if (sc) {
    const mode = modeOf(sc, 'illustrative');
    const feasibility = feasibilityOf(sc);
    const t = sc.totals ?? {};
    const unit = sc.currency ?? currency;
    const period = Array.isArray(sc.months) && sc.months.length ? `${count(sc.months.length)} months` : 'the scenario period';
    const row = (id, label, metric, value, extra) => { if (!finite(value)) return; ev.calc(`econ_${id}`, label, Math.round(value), unit, `the economics module, ${MODE_WORDS[mode].toLowerCase()}`); list.push({ id, label, metric, value: Math.round(value), unit, period, basis: `the economics module at your figures, ${MODE_WORDS[mode].toLowerCase()}`, interval: null, mode, modeLabel: MODE_WORDS[mode], feasibility, scope: sc.scope ?? null, assumptionIds: sc.assumptionIds ?? [], evidenceIds: [`calc:econ_${id}`], ...(extra ?? {}) }); };
    row('plan', 'The plan', 'revenue over the scenario', t.revenue);
    row('plan-operating', 'Operating result under the plan', 'operating result over the scenario', t.operatingResult);
    row('plan-cash', 'Lowest cash the plan passes through', 'cash at its lowest point', t.cashLow, { note: 'Profit is not cash: this is the point the plan is thinnest.' });
    if (finite(t.fundingRequired) && t.fundingRequired > 0) row('plan-funding', 'Funding the plan needs before it pays for itself', 'funding required', t.fundingRequired);
    if (sc.baselineVsPlan && finite(sc.baselineVsPlan.operatingResult)) row('plan-vs-baseline', 'What the plan changes', 'operating result against the baseline', sc.baselineVsPlan.operatingResult);
  }

  const req = econ.requirements;
  if (req?.required) {
    const q = req.required;
    const verdict = VERDICT_FEASIBILITY[req.verdict] ?? 'not_established';
    const reqRow = (id, label, metric, value, unit) => { if (!finite(value)) return; ev.calc(`req_${id}`, label, Math.ceil(value), unit, 'inverse arithmetic from your target: not expected demand'); list.push({ id: `requirement-${id}`, label, metric, value: Math.ceil(value), unit, period: `by month ${r.months}`, basis: 'worked backwards from your target, not a prediction that this many will buy', interval: null, mode: 'requirements', modeLabel: MODE_WORDS.requirements, feasibility: verdict, evidenceIds: [`calc:req_${id}`] }); };
    reqRow('sales', 'Sales your target needs', 'sales', q.sales, 'sales');
    reqRow('opportunities', 'Qualified opportunities your target needs', 'opportunities', q.opportunities, 'opportunities');
    reqRow('resource', 'Delivery resource your target needs', 'resource', q.resource, 'units of delivery resource');
    reqRow('cash', 'Cash your target needs on hand', 'cash', q.cash, currency);
  }

  if (!list.length) return unsupported(econ.why || 'The economics module has produced no figure for these answers yet, so the plan stays qualitative.');

  /* the intervention comparison: one row per primary action, never added together */
  const comparison = (c.comparison ?? []).map((x) => {
    const k = cards.find((y) => y.id === (x.action?.id ?? x.action));
    const mode = modeOf(econ.scenario, 'illustrative');
    return {
      id: `action:${k?.id ?? x.action?.id ?? x.action}`, action: k?.id ?? null, label: k?.action ?? String(x.action?.action ?? x.action ?? ''),
      operatingResult: finite(x.incrementalOperatingResult) ? Math.round(x.incrementalOperatingResult) : null,
      cash: finite(x.incrementalCash) ? Math.round(x.incrementalCash) : null,
      startsMonth: x.startsMonth ?? null, constraintsHit: arr(x.constraintsHit), interactions: arr(x.interactions),
      unit: currency, mode, modeLabel: MODE_WORDS[mode], evidence: x.evidence ?? null, assumptionIds: arr(x.assumptionIds),
    };
  }).filter((x) => x.operatingResult !== null || x.cash !== null);
  comparison.forEach((x) => { if (x.operatingResult !== null) ev.calc(`cmp_${String(x.action ?? x.id).replace(/[^a-z0-9]+/gi, '_')}`, `${x.label}: change in the operating result`, x.operatingResult, currency, 'the economics module, one action at a time against the same plan'); });

  const modes = [...new Set(list.map((x) => x.mode).filter(Boolean))];
  const competing = cards.filter((k) => k.status === 'primary').length > 1;
  return {
    supported: true, qualitative: false, list, comparison, label: 'Scenarios', modes,
    feasibility: econ.scenario ? feasibilityOf(econ.scenario) : null,
    validatedForecast: false, validatedForecastNote: VALIDATED_UNREACHABLE,
    combined: { summed: false, note: competing ? 'The actions compete for the same hours, the same cash and the same customers, so their effects are not added together. Each row is one action against the same plan.' : 'Each row is one action against the same plan; nothing is added across rows.' },
    source: { module: 'econ', version: econ.version, model: econ.model, note: 'Every figure above comes from the economics module. The demand engine is not shown.' },
    incomplete: econ.incomplete,
  };
}
/** the binding constraint, from econ's own constraint pass over the scenario. The engine's ceiling figure is gone:
    where econ has nothing, the constraint is named qualitatively or not at all */
function constraintOwner(c) {
  const { econ, eng, ev, r } = c;
  const unknownInputs = [r.capacity === null ? 'delivery capacity' : null, r.market === null ? 'the number of suitable customers you can reach' : null, r.closeRate === null ? 'your close rate' : null].filter(Boolean);
  const rows = (econ.constraints ?? []).filter((x) => x && x.binding);
  if (rows.length) {
    const first = rows.slice().sort((a, b) => (a.month ?? 99) - (b.month ?? 99))[0];
    const month = finite(first.month) ? `month ${first.month}` : null;
    const ids = [ev.calc('binding', 'Binding resource', String(first.resource), null, 'the economics module’s constraint pass over the scenario')];
    if (finite(first.needed) && finite(first.available)) ids.push(ev.calc('binding_gap', `${cap(String(first.resource))} short in ${month ?? 'the scenario'}`, Math.round(first.needed - first.available), 'units of that resource', 'needed less available in the month it first binds'));
    return { found: true, type: first.resource, name: cap(String(first.resource)), text: `${cap(String(first.resource))} runs out first${month ? ` in ${month}` : ''}.`, plain: 'Everything after it waits on that resource, whatever else the plan does.', month, bindsAtMonth: finite(first.month) ? first.month : null, needed: finite(first.needed) ? first.needed : null, available: finite(first.available) ? first.available : null, ceiling: null, scope: 'the economics module’s scenario at your figures', unknown: unknownInputs, all: rows, evidenceIds: ids };
  }
  if (econ.scenario) return { found: false, text: 'No constraint found within this model', scope: `the economics module’s scenario at your figures${unknownInputs.length ? `; ${listWords(unknownInputs)} ${unknownInputs.length === 1 ? 'is' : 'are'} still not known, so a limit there would not show` : ''}`, unknown: unknownInputs, all: [], evidenceIds: [] };
  /* econ has no scenario yet: the demand engine may still name a limit in words. No figure is taken from it. */
  let lim = null;
  try { lim = typeof M.canopy?.limit === 'function' ? M.canopy.limit() : null; } catch (e) { lim = null; }
  if (eng?.binding) {
    const clause = lim?.words ?? (typeof M.limitClause === 'function' ? M.limitClause(eng.binding, { first: true }) : `${eng.binding} limits growth first`);
    return { found: true, qualitative: true, type: eng.binding, name: lim?.name ?? (M.LIMIT_NAME?.[eng.binding] ?? eng.binding), text: cap(clause), plain: lim?.plain ?? '', month: null, bindsAtMonth: null, ceiling: null, needed: null, available: null, scope: 'a demand reading only: the economics module has not produced a scenario for these answers, so no figure is attached to it', unknown: unknownInputs, all: [], evidenceIds: [] };
  }
  return { found: false, text: 'No constraint found within this model', scope: econ.available ? (econ.why || 'the economics module has produced no scenario for these answers') : 'the economics module has not loaded in this view', unknown: unknownInputs, all: [], evidenceIds: [] };
}
/** sensitivity as full statements (R19): input, output, unit, period, assumption; econ's own, or nothing */
function sensitivityOwner(c) {
  const { econ, ev } = c;
  const rows = arr(econ.scenario?.sensitivities).filter((x) => x && x.driver && x.effect !== undefined && x.effect !== null);
  if (!rows.length) return [];
  const mode = modeOf(econ.scenario, 'illustrative');
  return rows.slice(0, 3).map((x, i) => {
    const key = String(x.driver).replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const label = INPUT_WORDS[x.driver] ?? String(x.driver);
    const id = finite(x.effect) ? ev.calc(`sens_${key}`, `Sensitivity to ${label}`, x.effect, x.unit ?? null, 'the economics module, one driver moved, the rest held as given') : null;
    return { inputId: x.driver, input: label, rank: i + 1, unit: x.unit ?? null, effect: x.effect, mode, modeLabel: MODE_WORDS[mode], statement: `${cap(label)}: ${finite(x.effect) ? `${x.effect}${x.unit ? ` ${x.unit}` : ''}` : String(x.effect)}, with every other driver held as given.`, evidenceIds: [id].filter(Boolean) };
  });
}
/** the path to the goal: econ's requirements, worked backwards from the target. A requirement is not a prediction,
    and no probability of reaching the goal is computed anywhere (D3) */
function goalPath(c) {
  const { econ, r, ev } = c;
  if (r.goal === null) return null;
  const req = econ.requirements;
  if (!req) return { goal: r.goal, months: r.months, mode: 'requirements', verdict: null, supported: false, requirements: null, gaps: [], evidenceIds: [], text: econ.available ? 'The economics module has not worked your target back into requirements yet, so no figure is put against it. The actions below still stand.' : 'The economics module has not loaded in this view, so your target has not been worked back into requirements.' };
  const q = req.required ?? {};
  const gaps = arr(req.gaps);
  const ids = [];
  if (finite(q.sales)) ids.push(ev.calc('req_path_sales', 'Sales your target needs', Math.ceil(q.sales), 'sales', 'target worked backwards through the effective price'));
  if (finite(q.cash)) ids.push(ev.calc('req_path_cash', 'Cash your target needs on hand', Math.ceil(q.cash), c.currency, 'the economics module’s cash requirement'));
  const words = { supported: `Your figures support ${gbp(r.goal)} a month by month ${r.months} under the assumptions stated with each scenario. A requirement is not a promise that this many customers will buy.`, requires_changes: `${gbp(r.goal)} a month by month ${r.months} needs changes first: ${gaps.length ? listWords(gaps.map((g) => lower(typeof g === 'string' ? g : g.what ?? g.resource ?? 'a resource gap'))) : 'the gaps are listed with the requirements'}.`, not_supported: `${gbp(r.goal)} a month by month ${r.months} is not supported within this horizon on these answers. A staged milestone comes first: reach the requirement below, then set the next target.` };
  return { goal: r.goal, months: r.months, mode: 'requirements', verdict: req.verdict ?? null, supported: req.verdict === 'supported', feasibility: VERDICT_FEASIBILITY[req.verdict] ?? 'not_established', requirements: q, gaps, evidenceIds: ids, text: words[req.verdict] ?? `Your target has been worked back into requirements; the verdict on them is not established.` };
}
function successOwner(r, cards, path) {
  const s = [];
  if (r.goal !== null) s.push(`${gbp(r.goal)} a month by month ${r.months}${finite(path?.requirements?.sales) ? ` (it needs ${count(Math.ceil(path.requirements.sales))} sales)` : ''}, checked monthly`);
  cards.filter((k) => k.status === 'primary').forEach((k) => s.push(`${k.action}: ${k.measure}`));
  if (r.goalKind === 'time' && r.hours !== null) s.push('Your hours in the business, counted in week four against week one');
  return s;
}
function reviewOwner(cards) {
  const out = cards.filter((k) => k.status === 'primary').map((k) => `${k.action}: ${k.changeCourseIf}`);
  out.push('Any answer above changes: rebuild the plan; the old one is marked stale');
  return out;
}
function tmaBriefOwner(s, r, plan) {
  const sections = [
    { id: 'goal', title: 'Goal', text: plan.goal.text, private: false, selected: true },
    { id: 'finding', title: 'Finding', text: `${plan.finding.headline} ${plan.finding.text}`, private: false, selected: true },
    { id: 'first', title: 'First action', text: plan.firstAction ? `${plan.firstAction.action}. ${plan.firstAction.whyFirst}` : '', private: false, selected: true },
    { id: 'actions', title: 'Plan', text: plan.actions.filter((k) => k.status !== 'waits').map((k) => `${k.priority ? `${k.priority}. ` : ''}${k.action}`).join('\n'), private: false, selected: true },
    { id: 'resources', title: 'Hours and budget', text: plan.resourceTotals.note, private: false, selected: true },
    { id: 'unknowns', title: 'Not known yet', text: plan.unknowns.map((u) => u.label).join('; '), private: false, selected: true },
    { id: 'clients', title: 'Best clients', text: known(s, 'lastFive') ? 'Included only if you select it.' : '', private: true, selected: false },
    { id: 'money', title: 'Personal finances and margin', text: r.margin !== null || known(s, 'owed') ? 'Included only if you select it.' : '', private: true, selected: false },
    { id: 'founder', title: 'Founder reflections', text: known(s, 'energy') || known(s, 'personality') ? 'Included only if you select it.' : '', private: true, selected: false },
  ].filter((x) => x.text);
  return { title: 'Brief for TMA', sections, note: 'You send this yourself. Nothing is sent by the page.', help: 'Sections marked private are left out unless you select them.' };
}
function buildOwner(s, readiness, opts) {
  const currency = s.currency ?? 'GBP';
  const eng = readEngine(s, { ...opts, route: 'owner' });
  const ev = collector(s);
  const econ = readEcon(s, opts);
  const r = readOwner(s, eng, econ);
  let founder = null, control = null, tools = [];
  try { founder = !opts?.example && typeof M.founderProfile === 'function' ? M.founderProfile() : null; } catch (e) { founder = null; }
  try { control = !opts?.example && typeof M.controlProfile === 'function' ? M.controlProfile() : null; } catch (e) { control = null; }
  try { tools = typeof M.freetools?.used === 'function' ? M.freetools.used(s) : []; } catch (e) { tools = []; }
  if (!tools.length) { try { tools = typeof M.freetools?.defaults === 'function' ? M.freetools.defaults() : []; } catch (e) { tools = []; } }
  const c = { s, r, eng, econ, ev, currency, founder, control, tools, uk: ukOn(s), prefer: opts?.prefer ?? val(s, 'preferredAction') ?? null };
  /* every confirmed import is in the evidence set with its excerpt, whether or not an action cites it: provenance is
     shown, and the model sees it as data under DATA, never as an instruction */
  arr(s.imported).forEach((f) => { const id = f && (f.field ?? f.key ?? f.id); if (id && known(s, id)) ev.field(id); });
  if (finite(econ.utilisation?.value)) ev.calc('utilisation', 'How full you are today', Math.round(econ.utilisation.value * 100), '%', 'the economics module: the resource needed ÷ the resource available');
  if (eng?.binding) ev.assume('demand_reading', 'Which way the demand reading leans', `The demand model reads ${lower(M.LIMIT_NAME?.[eng.binding] ?? String(eng.binding).replace(/_/g, ' '))} as what gives first. It leans the diagnosis and carries no figure into this plan.`);
  const ranked = rankOwner(c);
  const cards = [
    ...ranked.primaries.map((cd, i) => makeCard(cd, c, i, 'primary')),
    ...ranked.next.map((cd, i) => makeCard(cd, c, i, 'next')),
    ...ranked.waiting.map((cd, i) => makeCard(cd, c, i, 'waits', cd.waits)),
  ];
  const primaries = cards.filter((k) => k.status === 'primary');
  c.comparison = compareEcon(s, cards);
  const resourceTotals = resolveResources(primaries, r, currency);
  /* the polish pack, 4: nought extra hours is an answer, not a blank. The first action then carries an explicit
     time-release prerequisite rather than a plan that quietly assumes free time. */
  if (r.hours === 0 && primaries[0]) {
    const f = primaries[0];
    f.prerequisite = 'Free two hours a week first: hand one routine task to someone else, or stop it, and keep those hours for this';
    f.details = f.details ?? {};
    f.details.dependencies = [...new Set(['Two hours a week freed from existing work', ...(f.details.dependencies ?? [])])];
    if (resourceTotals && resourceTotals.hours) resourceTotals.hours.note = 'You said you have no extra hours: the first action starts with freeing two a week, and nothing here assumes time you do not have.';
  }
  const firstArea = primaries[0]?.area ?? (r.sparse ? 'discovery' : 'discovery');
  const f = (AREA_FINDING[firstArea] ?? AREA_FINDING.discovery)(c);
  const findingIds = [...new Set(primaries.flatMap((k) => k.evidenceIds))];
  const finding = { area: firstArea, headline: f.headline, text: f.text, alternative: f.alternative, evidenceIds: findingIds, provenance: findingIds.map((id) => resolveEvidence(id, { evidence: ev.all() })?.state ?? 'unknown') };
  const scenarios = scenariosOwner(c, cards);
  const constraint = constraintOwner(c);
  /* the polish pack, 10.2: the current constraint, the best next intervention and the likely next constraint, as three
     short lines the Why stage shows first; the comparison behind them stays in the evidence */
  const constraintChain = (() => {
    try {
      const unit = econ?.model === 'product' || econ?.model === 'digital' ? 'orders' : 'jobs';
      const demand = r.enquiries !== null && r.closeRate !== null ? Math.round(r.enquiries * r.closeRate) : null;
      const first = primaries[0] ?? null;
      if (!first) return null;
      const deliveryBinds = r.room === 'none' || (r.capacity !== null && demand !== null && demand > r.capacity);
      const current = deliveryBinds
        ? `Delivery: ${r.capacity !== null ? `about ${count(r.capacity)} ${unit} a month` : 'the work you can deliver'}${demand !== null ? ` against about ${count(demand)} ${unit} a month converted` : ''}.${r.stageLimit ? ` The stage that gives first is ${r.stageLimit.words}.` : ''}`
        : demand !== null && r.capacity !== null && demand < r.capacity ? `Demand: about ${count(demand)} ${unit} a month converted against ${count(r.capacity)} you could deliver.` : `${cap(first.area === 'capacity' ? 'delivery' : first.area)}, as the first action says.`;
      const next = `${first.action}${r.capacityFlex === 'easy' && first.id === 'capacity-add' ? ` (${r.moreWorkLead ? `${r.moreWorkLead}, ` : ''}${r.moreWorkCost !== null ? (r.moreWorkCost === 0 ? 'no one-off cost' : `${gbp(r.moreWorkCost)} one-off`) : 'cost not given'})` : ''}.`;
      const to = r.capacity !== null && r.moreWorkAmount !== null ? r.capacity + r.moreWorkAmount : null;
      const likely = first.id === 'capacity-add'
        ? (demand !== null && to !== null && demand <= to ? `Demand, at about ${count(demand)} ${unit} a month converted: more capacity alone creates nothing past it.` : 'Delivery again, once the added capacity is used; then demand.')
        : deliveryBinds ? (r.capacityFlex === 'slow' ? 'Delivery stays the limit until hiring, buying or building adds to it; the limit protects the work meanwhile.' : r.capacityFlex === 'none' ? 'Quality or margin, if more work is taken without a limit.' : 'Delivery, until capacity is added.') : 'Delivery, once demand is lifted to what you can deliver.';
      return { current, next, likely, label: 'Current constraint, best next move, likely next constraint' };
    } catch (e) { return null; }
  })();
  const sensitivity = sensitivityOwner(c);
  const path = goalPath(c);
  const goalIds = [known(s, 'win') ? ev.field('win') : null, r.goal !== null ? ev.field('goal') : null, known(s, 'months') ? ev.field('months') : null, r.protected.length ? ev.field('protected') : null].filter(Boolean);
  const goal = { kind: r.goalKind, words: r.goalWords, target: r.goal, months: r.months, currency, protected: r.protected, text: `${r.goalWords ? cap(r.goalWords) : 'Your goal'}${r.goal !== null ? `: ${gbp(r.goal)} a month by month ${r.months}` : ''}${r.protected.length ? `, keeping ${listWords(r.protected.map(lower))} protected` : ''}.`, evidenceIds: goalIds };
  /* D3: up to two alternatives behind the comparison control, each with its trade-off and whether it can be used now;
     the longer list of what was considered stays on `considered` for the exports */
  const considered = ranked.considered.filter((cd) => !primaries.some((k) => k.id === cd.t.id)).slice(0, 4).map((cd) => ({ id: cd.t.id, area: cd.t.area, action: null, useable: !cd.waits, why: cd.waits ?? (ranked.next.includes(cd) ? 'Follows the primaries: same hours, weaker evidence for it than for the first three' : `Considered: weaker evidence for ${cd.t.area} than for ${listWords([...new Set(primaries.map((k) => k.area))])}`) }));
  considered.forEach((a) => { const k = cards.find((x) => x.id === a.id); a.action = k?.action ?? a.id; });
  const alternatives = considered.slice(0, 2);
  const assets = buildAssets(cards, { s, r, eng, route: 'owner', currency, tools });
  const sources = sourcesOwner(c, ev);
  let reflection = null;
  try { const a = known(s, 'personality') ? M.archetypes?.pick?.(s.personality) : null; if (a?.name) reflection = { archetype: a.name, line: a.grows ? `${a.name}: grows by ${a.grows}.` : '', note: 'A reading of your stated preference. It moves no figure in this plan.' }; } catch (e) { reflection = null; }
  const plan = {
    route: 'owner', status: readiness.level, readiness,
    goal, finding, evidenceIds: findingIds, unknowns: unknownsOwner(s, r, eng),
    firstAction: primaries[0] ?? null, alternatives, actions: cards,
    resourceTotals, scenarios: scenarios.list, scenarioNote: scenarios, scenarioComparison: scenarios.comparison ?? [],
    modes: { list: scenarios.modes ?? [], scenario: econ.scenario ? modeOf(econ.scenario, 'illustrative') : null, feasibility: econ.scenario ? feasibilityOf(econ.scenario) : null, label: 'Scenarios', validatedForecast: false, note: VALIDATED_UNREACHABLE },
    econ: { available: econ.available, module: 'econ', version: econ.version, model: econ.model, incomplete: econ.incomplete, why: econ.why, baseline: econ.baseline, scenario: econ.scenario ? { id: econ.scenario.id ?? null, mode: modeOf(econ.scenario, 'illustrative'), feasibility: feasibilityOf(econ.scenario), reasons: arr(econ.scenario.reasons), scope: econ.scenario.scope ?? null, units: econ.scenario.units ?? null, assumptionIds: arr(econ.scenario.assumptionIds), evidenceIds: arr(econ.scenario.evidenceIds), unmetRequirements: arr(econ.scenario.unmetRequirements), dependencies: arr(econ.scenario.dependencies), binding: arr(econ.scenario.binding), modelVersion: econ.scenario.modelVersion ?? null } : null, requirements: econ.requirements, constraints: econ.constraints },
    constraint, constraintChain, sensitivity, goalPath: path,
    successMeasures: successOwner(r, cards, path), reviewConditions: reviewOwner(cards),
    considered,
    assets, sources, evidence: ev.all(), signals: { demand: r.demand, room: r.room, spareTime: r.spareTime, goalKind: r.goalKind, preRevenue: r.preRevenue, sparse: r.sparse, areas: ranked.areas, rankedFor: r.goalKind === 'time' ? 'fewer hours' : null, preferred: c.prefer },
    founder: founder ? { risks: founder.risks ?? [], actions: founder.actions ?? [], selfReported: true } : null,
    control: control ? { risks: control.risks ?? [], actions: control.actions ?? [], review: control.review ?? null, selfReported: true } : null,
    reflection,
    calculator: calculatorOf(ev),
    method: { module: 'econ', version: econ.version, model: econ.model, draws: 0, deterministic: true, note: econ.scenario ? `Every figure is computed by the economics module and can be inspected: a deterministic scenario in ${MODE_WORDS[modeOf(econ.scenario, 'illustrative')].toLowerCase()} mode, not a simulation. ${VALIDATED_UNREACHABLE}` : `No figure is shown: ${econ.why || 'the economics module has produced no scenario for these answers'}. ${VALIDATED_UNREACHABLE}` },
  };
  finishOwner(plan, c);
  plan.tmaBrief = tmaBriefOwner(s, r, plan);
  return plan;
}
/** the source rows a plan cites (brief 10.4): macro rows that bear on a primary, UK only, with title, date and link */
function sourcesOwner(c, ev) {
  const out = [];
  if (!c.uk || typeof M.macro?.evidenceFor !== 'function') return out;
  const want = [];
  if (c.r.priceSignal >= 1 || /long|never/.test(c.r.priceRaised)) want.push('cpi_annual');
  if (c.r.cash >= 1) want.push('boe_bank_rate');
  try { const ctx = typeof M.macro.context === 'function' ? M.macro.context('sector', c.s) : null; (ctx?.ids ?? []).forEach((id) => want.push(id)); } catch (e) { /* none */ }
  [...new Set(want)].forEach((rid) => { const id = ev.src(rid); const e = id ? ev.all().find((x) => x.id === id) : null; if (e) out.push({ id: e.id, title: e.title ?? e.sourceTitle, sourceTitle: e.sourceTitle, sourceDate: e.sourceDate, retrievedAt: e.retrievedAt, url: e.sourceUrl, value: e.value, unit: e.unit, period: e.period, label: 'UK figure' }); });
  return out;
}
/** the calculator's outputs as the model sees them: every calculated evidence entry, its value as printed */
const calculatorOf = (ev) => ({ metrics: ev.all().filter((e) => e.state === 'calculated').map((e) => ({ id: e.id, label: e.title, value: e.value, unit: e.unit ?? null, basis: e.basis ?? null })) });

/* ---------------------------------------------------------------- the starter plan, as the same Plan object */
/** the starter route's figures, each with its own mode and feasibility (D2). The first-sale requirement and the
    break-even come from the person's own figures; an earnings scenario appears only with its customer count, price,
    delivery hours and costs behind it, and otherwise the next evidence step stands in its place (Task 14) */
function starterScenarios(p, ev, currency) {
  const out = [];
  const REQ = { mode: 'requirements', modeLabel: MODE_WORDS.requirements };
  const ILL = { mode: 'illustrative', modeLabel: MODE_WORDS.illustrative };
  out.push({ id: 'first-sale', label: 'The first sale', metric: 'paying customers before anything is known', value: 1, unit: 'customer', period: 'the test', basis: 'the requirement every direction starts from: one person paying once', interval: null, ...REQ, feasibility: 'not_established', evidenceIds: [] });
  const price = p.proposedPrice ?? null;
  if (price && price.amount !== null && price.from === 'requirement') {
    ev.calc('price_required', 'What each delivery has to earn to reach your target', Math.ceil(price.amount), currency, price.basis);
    out.push({ id: 'price-requirement', label: 'Price your target needs', metric: 'per delivery', value: Math.ceil(price.amount), unit: currency, period: 'per delivery', basis: price.basis, interval: null, ...REQ, feasibility: 'not_established', note: price.method, evidenceIds: ['calc:price_required'] });
  }
  if (p.priceKnown && p.monthlyKnown && p.monthly > 0) {
    const be = Math.ceil(p.monthly / p.price);
    ev.calc('breakeven', 'Sales a month to cover the monthly cost', be, 'sales', 'your monthly cost ÷ your test price, rounded up');
    out.push({ id: 'breakeven', label: 'Break-even', metric: 'sales a month to cover the monthly cost', value: be, unit: 'sales', period: 'a month', basis: `${gbp(p.monthly)} a month ÷ ${gbp(p.price)} a sale, both your figures`, interval: null, ...REQ, feasibility: 'not_established', pointEstimate: true, evidenceIds: ['calc:breakeven'] });
  }
  const e = p.earnings ?? null;
  if (e?.supported) {
    e.rows.forEach((row, i) => {
      const id = i === 0 ? 'earnings' : `earnings-${i}`;
      ev.calc(`${id}_revenue`, `${row.label}: revenue a month`, row.revenue, currency, row.workings);
      out.push({ id, label: row.label, metric: 'revenue a month at the deliveries your hours allow', value: row.revenue, unit: currency, period: 'a month', basis: row.workings, interval: null, ...ILL, feasibility: e.feasibility ?? 'not_established', chosen: !!row.chosen, inputs: { customers: row.deliveries, price: row.price, hoursPerDelivery: row.hoursPerDelivery, hours: row.hours, monthlyCost: row.monthlyCost }, excludes: row.excludes, evidenceIds: [`calc:${id}_revenue`] });
      if (row.afterCosts !== null) {
        ev.calc(`${id}_after`, `${row.label}: after the costs listed`, row.afterCosts, currency, row.workings);
        out.push({ id: `${id}-after`, label: `${row.label}, after the costs listed`, metric: 'after the costs listed, before tax and before anything you pay yourself', value: row.afterCosts, unit: currency, period: 'a month', basis: row.workings, interval: null, ...ILL, feasibility: e.feasibility ?? 'not_established', chosen: !!row.chosen, excludes: row.excludes, evidenceIds: [`calc:${id}_after`] });
      }
    });
  }
  return out;
}
function buildStarter(s, readiness, opts) {
  const currency = s.currency ?? 'GBP';
  const ev = collector(s);
  let sp = null;
  try { sp = typeof M.starter?.plan === 'function' ? M.starter.plan(s, opts?.direction ?? undefined) : null; } catch (e) { sp = null; }
  const p = sp?.direction ? sp : null;
  const st = M.starter?.person ? M.starter.person(s) : null;
  const fid = (concept) => { const id = M.starter?.idFor ? M.starter.idFor(s, concept) : null; return id ? ev.field(id) : null; };
  const goalIds = [fid('outcome'), fid('urgency'), fid('constraints'), known(s, 'win') ? ev.field('win') : null, known(s, 'goal') ? ev.field('goal') : null].filter(Boolean);
  const goal = { kind: 'starter', words: st?.outcome || (val(s, 'win') ? String(val(s, 'win')) : null), target: num(s, 'goal'), months: num(s, 'months'), currency, protected: st?.constraints ? [st.constraints] : [], text: `${st?.outcome ? cap(st.outcome) : 'What you want the business to do for you'}${st?.urgency ? ` (income needed ${st.urgency === 'soon' ? 'soon' : st.urgency === 'longer' ? 'later; time to develop' : 'within a few months'})` : ''}.`, evidenceIds: goalIds };
  if (!p) {
    const d = sp?.discovery ?? { why: 'Too little is known yet to compare directions.', step: 'Answer the time, budget and strengths questions and Mercer will compare directions.' };
    const card = { id: 'discovery-step', area: 'discovery', priority: 1, status: 'primary', waitReason: null, action: d.step, whyFirst: d.why, steps: [d.step, 'Bring the answers back here and continue.'], responsible: 'You', needs: [], effort: H(2), cost: FREE(currency), doneWhen: 'The answers are written down', measure: 'What people said they last paid for', changeCourseIf: 'Nobody could name anything: ask five different people', asset: 'validation-script', evidenceIds: [fid('hoursWeek'), fid('testBudget'), fid('skills')].filter(Boolean), dependsOn: [], scenarioId: null };
    const plan = { route: 'starter', status: 'preliminary', readiness, goal, finding: { area: 'discovery', headline: 'No direction clears your constraints yet.', text: d.why, alternative: null, evidenceIds: card.evidenceIds, provenance: [] }, evidenceIds: card.evidenceIds, unknowns: readiness.missing, firstAction: card, alternatives: [], actions: [card], resourceTotals: resolveResources([card], { hours: st?.hours ?? null, oneOffBudget: st?.budgetKnown ? st.budget : null, budget: st?.monthlyKnown ? st.monthly : null }, currency), scenarios: [], scenarioNote: { supported: false, qualitative: true, label: 'Scenarios', modes: [], why: 'No direction yet, so nothing to quantify.', nextStep: d.step, validatedForecast: false, validatedForecastNote: VALIDATED_UNREACHABLE, list: [], combined: null }, modes: { list: [], scenario: null, feasibility: 'not_established', label: 'Scenarios', validatedForecast: false, note: VALIDATED_UNREACHABLE }, reveal: (() => { try { return typeof M.starter?.reveal === 'function' ? M.starter.reveal(s) : null; } catch (e) { return null; } })(), constraint: { found: false, text: 'No constraint found within this model', scope: 'no forecast runs on this route', unknown: [], evidenceIds: [] }, sensitivity: [], goalPath: null, successMeasures: [card.measure], reviewConditions: [card.changeCourseIf], assets: buildAssets([card], { s, route: 'starter', currency, starter: sp }), sources: [], evidence: ev.all(), excluded: sp?.excluded ?? [], starter: sp, calculator: calculatorOf(ev), method: { draws: 0, note: 'No forecast runs on this route.' } };
    plan.currency = currency;
    finishStarter(plan, { s, p: null, st, currency, fid });
    plan.tmaBrief = tmaBriefStarter(plan);
    return plan;
  }
  const dir = p.direction;
  const evId = (concept) => fid(concept);
  const dirIds = [evId('skills'), evId('proven'), evId('groups'), evId('access'), evId('enjoy'), evId('avoid'), evId('hoursWeek'), evId('testBudget'), evId('idea')].filter(Boolean);
  /* D9: what the opening branch established, first, so the facts behind the move read the demand and the access before the strengths */
  const branchIds = [evId('askedPaid'), evId('demandEvidence'), evId('triedOutcome'), evId('triedNumbers'), evId('triedWhat'), evId('access'), evId('payer'), evId('need'), evId('deliverNow'), evId('startPoint')].filter(Boolean);
  const budget0 = !!p.budget0 || (p.budgetKnown && p.budget === 0);
  const hoursKnown = p.hours !== null && p.hours !== undefined;
  const mk = (id, area, i, o) => ({ id, area, priority: i + 1, status: 'primary', waitReason: null, responsible: 'You', dependsOn: [], scenarioId: null, ...o });
  const cards = [
    mk('starter-conversations', 'validation', 0, {
      action: `Hold the first conversations with ${p.direction.buyer}`, whyFirst: `${p.demandEvidence === 'none yet' || p.demandEvidence === 'an assumption' ? 'Nobody has asked for this yet, so demand is the biggest unknown' : `${cap(String(p.demandEvidence))}, and that is the only demand evidence so far`}. Three conversations cost nothing and set the price and the first offer.`,
      steps: p.weekOne.slice(1, 4), needs: ['Three names', 'The outreach message below'], effort: H(3), cost: FREE(currency),
      doneWhen: 'Three conversations held and written up', measure: 'What each person last paid for and what they would pay you, at the end of week one', changeCourseIf: 'None of the three can name anything they would pay for: change the buyer before the offer', asset: 'outreach-message', evidenceIds: [...branchIds, ...dirIds, evId('firstBuyer')].filter(Boolean),
    }),
    mk('starter-offer', 'offer', 1, {
      action: 'Write the one-page offer', whyFirst: `Every conversation and every test points at one page: what is done, what it costs, how to book. ${p.priceKnown ? `Your ${gbp(p.price)} is the starting price to test.` : 'The price is not known yet; the conversations set it.'}`,
      steps: [p.weekOne[0], 'Keep it to one page; a phone photo of it should be readable.', 'Send it after each conversation, not before.'], needs: ['The offer sheet below'], effort: H(2), cost: FREE(currency),
      doneWhen: 'The page exists and has been sent to one person', measure: 'Questions asked back, and whether anyone books', changeCourseIf: 'The same question comes back twice: the page is missing it', asset: 'offer-sheet', evidenceIds: [evId('firstResult'), evId('testPrice'), ...dirIds].filter(Boolean), dependsOn: [],
    }),
    mk('starter-first-test', 'validation', 2, {
      action: cap(p.validationTest.replace(/\.$/, '')), whyFirst: `The smallest test that produces evidence for this direction. Nothing is bought first${budget0 ? ': you said nothing can be spent, and nothing needs to be' : ''}.`,
      steps: [`Offer the test to one of the three from the conversations${p.priceKnown ? ` at ${gbp(p.price)}` : ' at the price agreed in the conversation'}.`, ...p.deliverySteps, 'Write down the hours it took and what you would change.'], needs: [`${hoursKnown ? `${count(p.hours)} hours a week` : 'The hours you can give it'}`, ...(p.essentialGaps.length ? [p.essentialGaps[0]] : [])], effort: H(Math.max(2, Math.min(8, hoursKnown ? Math.round(p.hours) : 4))), cost: budget0 ? FREE(currency) : { oneOff: null, recurring: 0, currency, label: `Within your test budget of ${p.budgetKnown ? gbp(p.budget) : 'not known yet'}; each item is priced before buying`, estimate: true },
      doneWhen: 'One paid test delivered', measure: p.success, changeCourseIf: p.stop, asset: 'delivery-checklist', evidenceIds: [evId('testMethod'), evId('canDeliver'), evId('firstDelivery'), ...dirIds].filter(Boolean), dependsOn: ['starter-conversations'],
    }),
  ];
  const resourceTotals = resolveResources(cards, { hours: p.hours ?? null, oneOffBudget: p.budgetKnown ? p.budget : null, budget: p.monthlyKnown ? p.monthly : null }, currency);
  const finding = { area: 'direction', headline: `${dir.name}: the strongest direction from what you have told Mercer.`, label: dir.label ?? null, niche: dir.niche ?? null, fitReason: dir.fitReason ?? null, against: dir.against ?? null, wouldChange: dir.wouldChange ?? null, text: `${dir.verdict ? `${dir.verdict} ` : ''}${dir.fit} Demand still needs testing${p.unproven.length ? `: ${p.unproven[0].toLowerCase()}` : ''}.`, alternative: p.alternatives[0] ? `If ${lower(dir.unknown)}, ${p.alternatives[0].name.toLowerCase()} is the next direction to test.` : null, evidenceIds: dirIds, provenance: dirIds.map((id) => resolveEvidence(id, { evidence: ev.all() })?.state ?? 'unknown') };
  const scen = starterScenarios(p, ev, currency);
  const assets = buildAssets(cards, { s, route: 'starter', currency, starter: p });
  const plan = {
    route: 'starter', status: readiness.level, readiness,
    goal, finding, evidenceIds: dirIds, unknowns: readiness.missing.concat(p.unproven.map((u, i) => ({ id: `unproven:${i}`, label: u, why: 'Unproven until the test runs.' }))),
    firstAction: cards[0], alternatives: p.alternatives.map((a) => ({ id: a.id, area: 'direction', action: a.name, why: `${a.fit} Biggest unknown: ${a.unknown}.`, card: a })), actions: cards,
    resourceTotals, scenarios: scen,
    scenarioNote: {
      supported: scen.length > 0, qualitative: !p.earnings?.supported, label: 'Scenarios',
      modes: [...new Set(scen.map((x) => x.mode).filter(Boolean))],
      why: p.earnings?.supported ? 'Requirements and one illustrative scenario, each with the customer count, price, delivery hours and costs behind it. No likelihood is attached to either.' : (p.earnings?.why ?? 'Nothing has been sold yet, so the validation milestone is the measure rather than a figure.'),
      nextStep: p.earnings?.supported ? null : (p.earnings?.nextStep ?? null), startingVersion: p.earnings?.startingVersion ?? null,
      validatedForecast: false, validatedForecastNote: VALIDATED_UNREACHABLE, combined: null,
    },
    modes: { list: [...new Set(scen.map((x) => x.mode).filter(Boolean))], scenario: p.earnings?.supported ? 'illustrative' : 'requirements', feasibility: p.earnings?.supported ? (p.earnings.feasibility ?? 'not_established') : 'not_established', label: 'Scenarios', validatedForecast: false, note: VALIDATED_UNREACHABLE },
    constraint: { found: false, text: 'No constraint found within this model', scope: 'no forecast runs on this route; the constraints that apply are your hours, your test budget and the permissions named', unknown: [], evidenceIds: [] }, sensitivity: [], goalPath: null,
    successMeasures: [p.success, ...cards.map((k) => `${k.action}: ${k.measure}`)], reviewConditions: [p.stop, 'Any answer above changes: rebuild the plan; the old one is marked stale'],
    assets, sources: [], evidence: ev.all(), starter: p, direction: dir, excluded: p.excluded, tieBreaker: p.tieBreaker,
    reveal: p.reveal ?? null, niche: p.niche ?? null, mechanism: p.mechanism ?? null,
    evidenceCase: p.evidenceCase ?? null, proposedPrice: p.proposedPrice ?? null, earnings: p.earnings ?? null, employmentComparison: p.earnings?.employment ?? null,
    weekOne: p.weekOne, thirtyDays: p.thirtyDays, sixWeeks: p.sixWeeks ?? [], paths: p.paths ?? null, ninetyDays: p.ninetyDays, costs: p.costs, toolsOwned: p.toolsOwned, essentialGaps: p.essentialGaps, support: p.support, implementationPrompt: p.implementationPrompt,
    calculator: calculatorOf(ev), method: { module: 'starter', draws: 0, deterministic: true, note: `Every figure here is arithmetic on figures you gave, shown with its workings. ${VALIDATED_UNREACHABLE}` },
  };
  plan.currency = currency;
  finishStarter(plan, { s, p, st, currency, fid });
  plan.tmaBrief = tmaBriefStarter(plan);
  return plan;
}
function tmaBriefStarter(plan) {
  const p = plan.starter;
  const sections = [
    { id: 'goal', title: 'Goal', text: plan.goal.text, private: false, selected: true },
    { id: 'direction', title: 'Direction', text: `${plan.finding.headline} ${plan.finding.text}`, private: false, selected: true },
    { id: 'test', title: 'First test', text: p?.validationTest ?? plan.firstAction?.action ?? '', private: false, selected: true },
    { id: 'plan', title: 'Thirty days', text: (plan.thirtyDays ?? []).join('\n'), private: false, selected: true },
    { id: 'support', title: 'Support wanted', text: p?.support?.wanted?.length ? p.support.wanted.join(', ') : '', private: false, selected: true },
    { id: 'cv', title: 'Work history and CV', text: 'Included only if you select it.', private: true, selected: false },
    { id: 'money', title: 'Budget and personal finances', text: 'Included only if you select it.', private: true, selected: false },
  ].filter((x) => x.text);
  return { title: 'Brief for TMA', sections, note: 'You send this yourself. Nothing is sent by the page. A review request is a review request: no admission, investment or placement is implied.', help: 'Sections marked private are left out unless you select them.' };
}

/* ---------------------------------------------------------------- assets (brief 13.4): copyable, matched to the direction, never a secret */
const UNKNOWN = (what) => `[${what}: not known yet]`;
const ASSET_TITLES = { 'offer-sheet': 'Offer sheet', 'outreach-message': 'Outreach message', 'booking-process': 'Booking process', 'delivery-checklist': 'Delivery checklist', 'review-request': 'Review request', 'follow-up-sequence': 'Follow-up sequence', 'referral-ask': 'Introduction ask', 'introduction-message': 'Partner introduction', 'price-notice': 'Price and terms notice', 'validation-script': 'Conversation script', proposal: 'Proposal template', listing: 'Listing description', 'content-plan': 'Four-week content plan', 'implementation-brief': 'Implementation brief', 'execution-brief': 'Execution brief' };
function assetText(kind, ctx) {
  const c = ctx ?? {};
  const s = c.s ?? S();
  const starter = c.route === 'starter';
  const biz = starter ? 'I' : (s.biz ? s.biz : 'we');
  const who = starter ? (c.buyer ?? c.direction?.buyer ?? UNKNOWN('who it is for')) : bestClientWords(s);
  const offer = starter ? (c.direction?.offer ?? UNKNOWN('the offer')) : (val(s, 'included') ? String(val(s, 'included')) : UNKNOWN('what is included'));
  const price = starter ? (c.priceKnown ? `${gbp(c.price)} (to test)` : UNKNOWN('price: set after the first three conversations')) : (num(s, 'price') !== null ? `${gbp(num(s, 'price'))} a sale` : UNKNOWN('price'));
  const proof = starter ? UNKNOWN('proof: none yet; the first three customers supply it') : (/many|lots|some/.test(lower(val(s, 'reviews'))) ? 'Reviews: see our page' : UNKNOWN('proof: reviews to be collected'));
  const why = starter ? (c.direction?.fit ?? '') : (arr(val(s, 'chooseYou')).length ? `Why people choose us: ${listWords(arr(val(s, 'chooseYou')).map(lower))}` : UNKNOWN('the one reason they choose you'));
  const hours = starter ? (c.hoursLine ?? UNKNOWN('hours a week')) : (num(s, 'hours') !== null ? `${count(num(s, 'hours'))} hours a week` : UNKNOWN('hours a week'));
  const tools = (c.tools ?? []).map((t) => t.name).filter(Boolean);
  const owned = starter ? (c.person?.tools ?? []) : Object.values(s.stackNames ?? {}).filter(Boolean);
  switch (kind) {
    case 'offer-sheet': return [`OFFER SHEET (draft)`, ``, `For: ${who}`, `What you get: ${offer}`, `Price: ${price}`, `What happens first: a short call or message to confirm the job, then a date.`, `${why}`, `Proof: ${proof}`, `How to book: reply to this message, or call. Bookings are confirmed in writing the same day.`].join('\n');
    case 'outreach-message': return [`Subject: ${starter ? 'a quick question' : `${s.biz || 'a quick question'}`}`, ``, `Hello [their name],`, ``, `[One line about them: what you saw, who introduced you, or where you met.]`, ``, `${starter ? `I am starting to offer ${offer} for ${who}.` : `${biz === 'we' ? 'We' : biz} do ${offer} for ${who}.`} I am not writing to sell you anything today. I want twenty minutes to hear what you last paid someone for, and what went wrong.`, ``, `If that is a yes, name a time this week and I will fit around it.`, ``, `[Your name]`, `[Your phone]`].join('\n');
    case 'booking-process': return [`BOOKING PROCESS`, ``, `Reply 1, when we can take it:`, `“Thanks for getting in touch. Yes, we can do this. The next step is [a call / a visit / a date]. Which of these suits: [two options]? I will confirm in writing the same day.”`, ``, `Reply 2, when we are full:`, `“Thanks for getting in touch. We are booked until [date]. I can hold [date] for you now; say yes and it is yours. If you need it sooner, say so and I will tell you honestly whether we can.”`, ``, `Rule: every enquiry gets one of these within the hour, or at the next break on a job.`, `Log: date in, time replied, which reply, outcome.`, `Capacity limit: ${num(s, 'capacity') !== null ? `${count(num(s, 'capacity'))} a month` : UNKNOWN('the written limit')}.`].join('\n');
    case 'delivery-checklist': return [`DELIVERY CHECKLIST: ${starter ? (c.direction?.name ?? 'first delivery') : 'one typical job'}`, ``, ...(starter && Array.isArray(c.deliverySteps) ? c.deliverySteps : ['1. Confirm the job, the price and the date in writing.', '2. Before the day: materials, access, who is doing what.', '3. On the day: the work, to the standard written here.', '4. Hand over: show the finished work, note anything to watch.', '5. Invoice the same day; ask for a review on the day.']).map((x, i) => (/^\d/.test(x) ? x : `${i + 1}. ${x}`)), ``, `Only I can do: [list]`, `Someone else can do: [list]`, `Handed over to: [name or tool], from [date]`].join('\n');
    case 'review-request': return [`Hello [name],`, ``, `You had ${offer === UNKNOWN('what is included') ? 'work' : offer} done with ${biz === 'we' ? 'us' : biz} on [date]. Would you write two or three lines about how it went? It goes here: [link]. Honest is more useful than kind.`, ``, `Thank you,`, `[Your name]`].join('\n');
    case 'follow-up-sequence': return [`FOLLOW-UP SEQUENCE, three messages`, ``, `Day 2: “Hello [name], the quote for [job] went over on [date]. Does it cover what you needed? Happy to adjust.”`, ``, `Day 7: “Hello [name], checking in on the quote for [job]. If timing is the issue, tell me the month and I will hold the price.”`, ``, `Day 14: “Hello [name], last note from me on [job]. A yes or a no is fine either way; I would rather know than chase.”`, ``, `Log: quote date, three send dates, answer.`].join('\n');
    case 'referral-ask': return [`Hello [name],`, ``, `You sent [customer] my way last year and it was good work. I am looking for one more like it: ${who}. Is there one person you would introduce me to? One line from you is enough; I will do the rest and tell you how it went.`, ``, `[Your name]`].join('\n');
    case 'introduction-message': return [`Hello [name],`, ``, `Your customers are ${who}, and so are mine, and we do not do the same thing. I would like twenty minutes to see whether we can send each other the right people. I will bring what I do on one page and would like to hear the same from you.`, ``, `[Your name]`].join('\n');
    case 'price-notice': return [`Hello [name],`, ``, `From [date], the price for [the work] is [new price]. Work already agreed stays at the old price. ${num(s, 'terms') !== null || val(s, 'terms') ? 'New jobs take a deposit on booking and the balance on completion.' : ''} If you would like to book before the change, reply and I will hold a date.`, ``, `[Your name]`].join('\n');
    case 'validation-script': return [`CONVERSATION SCRIPT, twenty minutes`, ``, `1. What did you last pay someone to do for you in this area, and what did it cost?`, `2. What went wrong, or what would you change?`, `3. If someone offered ${offer}, what would make you say yes, and what would stop you?`, `4. What would you expect to pay?`, `5. Who else should I talk to?`, ``, `Write the answers the same day. Three repeated answers are the finding.`].join('\n');
    case 'proposal': return [`PROPOSAL (one page)`, ``, `For: [client]`, `The job: ${offer}`, `What you get: [three lines]`, `Price: ${price}`, `Timing: [start] to [finish]`, `What I need from you: [access, materials, a decision by a date]`, `To accept: reply “yes” and the start date is booked.`].join('\n');
    case 'listing': return [`LISTING`, ``, `Title: [what it is, for whom]`, `What it is: ${offer}`, `Who it is for: ${who}`, `Price: ${price}`, `What you get: [contents or condition]`, `Delivery: [how and when]`, `Questions: [how to ask]`].join('\n');
    case 'content-plan': return [`FOUR-WEEK CONTENT PLAN`, ``, `Subject: [one subject]`, `Place: [one place to post]`, `Day: [one fixed day each week]`, `Week 1: the problem as ${who} describe it.`, `Week 2: one thing you did about it, with what happened.`, `Week 3: one mistake and what it taught.`, `Week 4: ask one question and count who answers.`, `Measure: who came back in week 4.`].join('\n');
    case 'implementation-brief': return implementationBrief(c, { offer, who, price, hours, owned });
    case 'execution-brief': return [`EXECUTION BRIEF (for a person or an AI assistant)`, ``, `Business: ${s.biz || UNKNOWN('business name')}. Offer: ${offer}. Customers: ${who}.`, `Outcome wanted: ${c.plan?.goal?.text ?? UNKNOWN('goal')}`, `First action: ${c.plan?.firstAction?.action ?? UNKNOWN('first action')}`, `Steps:`, ...((c.plan?.firstAction?.steps ?? []).map((x, i) => `${i + 1}. ${x}`)), `Done when: ${c.plan?.firstAction?.doneWhen ?? ''}`, `Measure: ${c.plan?.firstAction?.measure ?? ''}`, `Change course if: ${c.plan?.firstAction?.changeCourseIf ?? ''}`, `Owner’s hours: ${hours}. Budget: ${num(s, 'budget') !== null ? `${gbp(num(s, 'budget'))} a month` : UNKNOWN('budget')}.`, `Tools already owned: ${owned.length ? owned.join(', ') : 'none named'}. Free options: ${tools.length ? tools.join(', ') : 'see the plan'}.`, `Do not: invent prices, sources or customers; promise results; add work the owner did not ask for.`].join('\n');
    default: return null;
  }
}
/** brief 13.4: the ten items, unknown credentials as unknown, no secret, no invented API */
function implementationBrief(c, w) {
  const s = c.s ?? S();
  const d = c.direction ?? null;
  const problem = d?.problem ?? UNKNOWN('the job the tool supports');
  return [
    `IMPLEMENTATION BRIEF (copy this to a builder or an AI assistant)`,
    ``,
    `1. Business context and exact outcome: ${c.route === 'starter' ? `a new venture: ${d?.name ?? UNKNOWN('direction')}` : (s.biz || UNKNOWN('business'))}. Outcome: ${c.route === 'starter' ? 'three paying users get the result by hand today; the tool repeats the steps that recur' : (c.plan?.goal?.text ?? UNKNOWN('goal'))}.`,
    `2. Customer or user and the job: ${w.who}. Job: ${problem}.`,
    `3. What already exists and tools to reuse: ${w.owned.length ? w.owned.join(', ') : 'nothing named'}; ${c.route === 'starter' ? 'the manual process written down from the first three users' : 'the current quote, booking and delivery process'}. Reuse before buying.`,
    `4. Smallest functional scope: one screen that takes the inputs below and gives the output below. Deferred: accounts, payments, integrations, a mobile app, anything not needed by the first three users.`,
    `5. Inputs, outputs, flow and rules: inputs ${UNKNOWN('list from the manual process')}; output ${UNKNOWN('the one result the user pays for')}; flow: enter, check, result, save; rules: ${UNKNOWN('the decisions made by hand today')}.`,
    `6. Integrations: none required for the first version. Any credential or API key is [unknown: supplied by the owner in the environment, never in this brief]. Do not assume an API exists; check.`,
    `7. Content, design, accessibility: plain English; keyboard operable; readable at phone width; no colour as the only signal.`,
    `8. Cost, time and ownership: budget ${c.route === 'starter' ? (c.person?.budgetKnown ? gbp(c.person.budget) : UNKNOWN('budget')) : (num(s, 'budget') !== null ? gbp(num(s, 'budget')) : UNKNOWN('budget'))}; owner’s hours ${w.hours}; the owner runs it after handover.`,
    `9. Acceptance checks: the three first users complete the job with the tool without help; the output matches the manual result on three past cases; nothing is stored that the user did not enter.`,
    `10. Questions the builder must resolve from the real environment: hosting; where data lives; who signs in; what happens when the input is wrong; what to log.`,
    ``,
    `Never include secrets in this brief or in code. Label every assumption. Prices quoted are estimates: check current price before buying.`,
  ].join('\n');
}
/* a card's asset is the kind string until the results layer decorates it into { kind, label, mode, text }; both are read */
const assetKindOf = (k) => (typeof k.asset === 'string' ? k.asset : (k.assetKind ?? k.asset?.kind ?? null));
function buildAssets(cards, ctx) {
  const kinds = [...new Set(cards.map(assetKindOf).filter(Boolean))];
  const c = { ...ctx };
  if (ctx.route === 'starter' && ctx.starter?.direction) { const sp = ctx.starter; Object.assign(c, { direction: sp.direction, buyer: sp.buyerProblem?.split(':')[0] ?? sp.direction.buyer, firstOffer: sp.firstOffer, priceKnown: !!sp.priceKnown, price: sp.price ?? null, deliverySteps: sp.deliverySteps, hoursLine: sp.hours !== null && sp.hours !== undefined ? `${count(sp.hours)} hours a week` : null, person: { tools: sp.toolsOwned ?? [], budgetKnown: sp.budgetKnown, budget: sp.budget } }); if (sp.direction?.technical && !kinds.includes('implementation-brief')) kinds.push('implementation-brief'); (sp.assets ?? []).forEach((a) => { if (!kinds.includes(a.kind)) kinds.push(a.kind); }); }
  else if (ctx.route === 'owner' && !kinds.includes('execution-brief')) kinds.push('execution-brief');
  const out = kinds.map((kind) => ({ id: `asset:${kind}`, kind, title: ASSET_TITLES[kind] ?? kind, forActions: cards.filter((k) => assetKindOf(k) === kind).map((k) => k.id), text: null, unknowns: [] }));
  const plan = { goal: ctx.plan?.goal ?? null, firstAction: cards.find((k) => k.status === 'primary') ?? cards[0] ?? null };
  out.forEach((a) => { try { a.text = assetText(a.kind, { ...c, plan, tools: ctx.tools ?? [] }); } catch (e) { a.text = null; } a.unknowns = (String(a.text ?? '').match(/\[[^\]]*not known yet[^\]]*\]/g) ?? []); });
  return out.filter((a) => a.text);
}

/* ---------------------------------------------------------------- readiness (brief 6.3) */
function ready(state, routeOver) {
  const s = S(state);
  const route = routeOver ?? s.route ?? 'owner';
  const missing = [];
  const miss = (id, label, why) => missing.push({ id, label, why });
  if (route === 'starter') {
    const st = M.starter?.person ? M.starter.person(s) : null;
    const idFor = (k) => (M.starter?.idFor ? M.starter.idFor(s, k) : null);
    const outcome = !!(st?.outcome || known(s, 'win') || known(s, 'goal'));
    const time = !!st?.hoursKnown;
    const budget = !!st?.budgetKnown;
    const strengths = !!(st && (st.skills.length || st.proven.length || st.askedFor.length || st.groups.length || st.access || st.audience || st.helpers.length));
    const buyer = !!(st && (st.groups.length || st.problems || st.ideaWanted || st.firstBuyer || st.firstResult));
    const dirs = (() => { try { return M.starter?.directions ? M.starter.directions(s) : null; } catch (e) { return null; } })();
    const test = !!(st?.testMethod || dirs?.recommended);
    if (!outcome) miss(idFor('outcome') ?? 'n02', 'What you want the business to do for you', 'The plan is chosen against it.');
    if (!time) miss(idFor('hoursWeek') ?? 'n03', 'Hours a week you can give it', 'The first feasibility filter.');
    if (!budget) miss(idFor('testBudget') ?? 'n05', 'What you could spend to test an idea', 'Zero is an answer; it rules directions in and out.');
    if (!strengths) miss(idFor('skills') ?? 'n10', 'What you are good at, or who you can reach', 'Directions are compared on demonstrated strengths and access.');
    if (!buyer) miss(idFor('groups') ?? 'n19', 'Which people or businesses you understand', 'Every direction starts from a buyer and a problem.');
    if (!test) miss(idFor('testMethod') ?? 'n34', 'How you could test interest before spending', 'The recommendation is a validation test.');
    const answered = st?.answered.length ?? 0;
    const level = missing.length === 0 ? 'full' : missing.length <= 2 && answered >= 6 ? 'qualitative' : 'preliminary';
    return { route, ready: level !== 'preliminary', level, missing, decisive: missing[0] ?? null, answered, note: level === 'preliminary' ? 'A preliminary result: too little is known to compare directions with confidence.' : level === 'qualitative' ? `One more answer would sharpen it: ${missing[0].label.toLowerCase()}.` : 'Enough is known to recommend a direction and a test.' };
  }
  const aim = known(s, 'win') || known(s, 'goal') || known(s, 'successWords') || known(s, 'goalWhy');
  const offer = !!s.sector && (known(s, 'repeatWork') || known(s, 'price') || known(s, 'buyer') || known(s, 'payModel') || known(s, 'included') || known(s, 'retainerValue'));
  const constraintIds = ['canDeliverMore', 'breaksFirst', 'chooseThem', 'enquiries', 'closeRate', 'capacity', 'holdup', 'worry', 'responseTime', 'followUps', 'reviews', 'went', 'delegation', 'terms', 'priceRaised', 'holiday', 'leadTime'];
  const constraint = constraintIds.some((k) => known(s, k)) || !!(M.planned?.binding);
  const resource = ['hours', 'changeHours', 'budget', 'help', 'who', 'teamSize'].some((k) => known(s, k));
  const money = num(s, 'now') !== null && (num(s, 'price') !== null || num(s, 'retainerValue') !== null);
  if (!aim) miss('win', 'What you would most like to change', 'The plan is ranked against it.');
  if (!offer) miss(s.sector ? 'repeatWork' : 'sector', s.sector ? 'What you sell most often' : 'What the business does', 'Mercer needs an offer and a customer to reason about.');
  if (!constraint) miss('breaksFirst', 'What runs out first', 'One grounded sign of a constraint is needed before an action is proposed.');
  if (!resource) miss('changeHours', 'Hours a week you can put into changing this', 'Sets what is feasible.');
  const groups = [aim, offer, constraint, resource].filter(Boolean).length;
  const core = ['win', 'goal', 'sector', 'now', 'price', 'buyer', 'repeatWork', 'canDeliverMore', 'breaksFirst', 'capacity', 'enquiries', 'closeRate', 'hours', 'changeHours', 'budget', 'chooseThem', 'channel', 'access', 'deliveryMode', 'worry', 'holdup', 'delegation', 'terms', 'reviews', 'lastFive'];
  const answered = core.filter((k) => known(s, k)).length;
  const preRevenue = /launch|prepar/.test(lower(val(s, 'stage'))) || num(s, 'now') === 0;
  let level = groups === 4 && (money || preRevenue) ? 'full' : groups === 4 ? 'qualitative' : groups >= 3 && answered >= 6 ? 'qualitative' : 'preliminary';
  if (level === 'qualitative' && !money && !preRevenue) { const id = num(s, 'now') === null ? 'now' : 'price'; miss(id, id === 'now' ? 'Revenue in a typical month' : 'What a typical sale brings in', 'The one input that turns the qualitative plan into figures.'); }
  const decisive = missing[0] ?? null;
  return { route, ready: level !== 'preliminary', level, missing, decisive, answered, note: level === 'full' ? 'Enough is known for a plan with figures.' : level === 'qualitative' ? `A qualitative plan. To quantify it: ${decisive ? decisive.label.toLowerCase() : 'one more figure'}.` : 'A preliminary plan or discovery actions: most of the picture is missing.' };
}

/* ---------------------------------------------------------------- build, example, current */
let cache = { plan: null, revision: null };
function build(state, opts = {}) {
  const s = S(state);
  const route = opts.route ?? s.route ?? 'owner';
  const readiness = ready(s, route);
  const plan = route === 'starter' ? buildStarter(s, readiness, opts) : buildOwner(s, readiness, opts);
  plan.id = `plan-${route}-${opts.example ? 'example' : revisionNow()}`;
  plan.revision = opts.example ? 0 : (opts.revision ?? revisionNow());
  plan.generatedAt = new Date().toISOString();
  plan.example = !!opts.example;
  plan.currency = s.currency ?? 'GBP';
  plan.version = 'rebuild-1';
  if (opts.example) { plan.sample = opts.sample ?? { name: 'Sample', note: 'Sample figures. Nothing here is about you.' }; plan.label = 'Example'; }
  if (!opts.example && state === undefined) cache = { plan, revision: plan.revision };
  return plan;
}
/* the two sample businesses. Every figure is a sample figure and is labelled so; the states never touch M.state */
const SAMPLE_OWNER = {
  route: 'owner', biz: 'Hartley Joinery (sample)', sector: 'construction', trade: 'Joinery', place: 'Leeds', currency: 'GBP',
  win: 'income', goal: 13000, months: 9, now: 9000, price: 1800, margin: 0.45, repeatWork: 'once', buyer: 'consumer', deliveryMode: 'travel', radius: 'county',
  capacity: 6, who: 2, servedNow: 5, enquiries: 12, closeRate: 0.4, canDeliverMore: 'no', breaksFirst: 'me', worry: 'delivery', hours: 4, changeHours: 4, budget: 300,
  terms: 'completion', reviews: 'few', responseTime: 'days', followUps: 1, priceRaised: 'long', discounting: 'sometimes', channel: 'referral', doing: ['referral'], lastFive: [{ bin: 'warm11' }, { bin: 'warm11' }, { bin: 'warm1m' }, { bin: 'cold11' }, { bin: 'unknown' }],
  delegation: 'checks', holiday: 'slows', subcontract: 'maybe', chooseYou: ['quality', 'relationship'], chooseThem: ['timing'], access: ['contacts'], market: 40, wontDo: ['cold'],
  notSure: new Set(), na: new Set(), imported: [],
};
const SAMPLE_STARTER = {
  route: 'starter', currency: 'GBP',
  n01: 'employed', n02: 'extra income', n03: 8, n04: 'evenings', n05: 100, n06: 0, n07: 'within a few months', n08: 'existing income',
  n09: 'Ran the office rota, invoicing and supplier orders for a small firm', n10: ['numbers', 'admin', 'organising'], n11: 'Cleared a three-month invoicing backlog and set up the rota (numbers, admin)', n12: 'spreadsheets and invoices',
  n13: ['organising', 'numbers'], n14: ['public content', 'travel'], n15: ['bookkeeping software'], n16: ['laptop', 'phone', 'spreadsheet'], n17: 'none', n18: 'either',
  n19: 'small trades businesses: my partner is a plumber', n20: 'unbilled work and late invoices', n21: 'yes, directly', n22: 'none', n23: 'my partner and two of his trade friends', n24: 'not yet asked', n25: 'no', n26: 'no',
  notSure: new Set(), na: new Set(), imported: [],
};
let exampleEngine = null;
function exampleAsk(s) {
  return { niche: 'home-services', trade: s.trade, now: s.now, goal: s.goal, months: s.months, price: s.price, channel: s.channel, closeRate: s.closeRate, capacity: s.capacity, who: s.who, servedNow: s.servedNow, budget: s.budget, margin: s.margin, market: s.market };
}
const examples = new Map();
function example(route = 'owner') {
  const r = route === 'starter' ? 'starter' : 'owner';
  if (examples.has(r)) return examples.get(r);
  let planned = null;
  if (r === 'owner') {
    try { const E = window.MercerEngine; if (E && typeof E.plan === 'function') { if (!exampleEngine) exampleEngine = E.plan(exampleAsk(SAMPLE_OWNER), '2026-09-23T00:00:00.000Z'); planned = exampleEngine; } } catch (e) { planned = null; }
  }
  const s = r === 'owner' ? { ...SAMPLE_OWNER } : { ...SAMPLE_STARTER };
  const plan = build(s, { example: true, route: r, planned, sample: r === 'owner' ? { name: 'Hartley Joinery, a made-up two-person joinery in Leeds', note: 'Sample figures: £9,000 a month today, £1,800 a job, six jobs a month, four hours a week to change anything. Nothing here is about you.', assumption: { id: 'capacity', label: 'Jobs a month (sample assumption)', value: 6, editable: true } } : { name: 'A made-up person: employed, eight hours a week in the evenings, £100 to test an idea', note: 'Sample answers. Nothing here is about you.', assumption: { id: 'n05', label: 'Test budget (sample assumption)', value: 100, editable: true } } });
  examples.set(r, plan);
  return plan;
}
/** the plan for the current revision, or the last one with stale: true. Builds on first ask; never on load */
function current() {
  const rev = revisionNow();
  if (cache.plan && cache.revision === rev) return { plan: cache.plan, stale: false };
  if (cache.plan) return { plan: cache.plan, stale: true, revision: rev };
  const plan = build(undefined);
  return { plan, stale: false };
}
/** D11: a changed direction, a used alternative or a changed answer rebuilds from the same builder. `opts.direction`
    (starter) and `opts.prefer` (an owner action id) are the two choices a press can carry; the state's own
    `direction` and `preferredAction` are read when they are absent */
const rebuild = (opts) => { const plan = build(undefined, opts ?? {}); return { plan, stale: false }; };
const actions = () => current().plan.actions;
/** the context model.js needs (Task 24): the confirmed context and route, the demonstrated strengths, the goal, the
    baseline, the protected constraints, the past attempts, the sources with their dates kept apart from the
    assumptions, the chosen opportunity, and the calculator's outputs. Every figure the model may write is in
    `calculator`; the constraints are what its reply is validated against. */
function modelContext(plan) {
  const p = plan ?? current().plan;
  const s = S();
  let answers = [];
  try { answers = (typeof M.schemaAnswers === 'function' ? M.schemaAnswers() : []).slice(0, 60).map((a) => ({ id: a.id, label: a.title, answer: a.answer })); } catch (e) { answers = []; }
  let person = p.starter?.person ?? null;
  try { if (!person && p.route === 'starter' && typeof M.starter?.person === 'function') person = M.starter.person(s); } catch (e) { person = null; }
  const ev = p.evidence ?? [];
  const strengths = p.route === 'starter'
    ? { demonstrated: person?.proven ?? [], named: person?.skills ?? [], askedFor: person?.askedFor ?? [], buyerFamiliarity: person?.groupWords ?? null, access: person?.access ?? null, resources: person?.tools ?? [], willLearn: person?.learn ?? [] }
    : { chosenFor: arr(val(s, 'chooseYou')), bestClients: (() => { try { return typeof M.bestClients === 'function' ? M.bestClients() : []; } catch (e) { return []; } })(), resources: { hours: num(s, 'changeHours') ?? num(s, 'hours'), budget: num(s, 'budget'), people: num(s, 'who') ?? num(s, 'teamSize') } };
  const pastAttempts = p.route === 'starter'
    ? [person?.tried ? { what: person.tried, result: person.triedResult } : null].filter(Boolean)
    : [...arr(val(s, 'went')).map((x) => ({ what: String(x), result: 'tried before' })), ...arr(val(s, 'doing')).map((x) => ({ what: String(x), result: 'running now' }))];
  return {
    revision: p.revision, route: p.route, goal: p.goal?.text ?? null,
    context: { business: val(s, 'biz') ?? null, sector: val(s, 'sector') ?? null, place: val(s, 'place') ?? null, currency: p.currency ?? s.currency ?? 'GBP', stage: val(s, 'stage') ?? null, activity: person?.activity ?? null, model: p.econ?.model ?? null },
    strengths, pastAttempts,
    baseline: p.econ?.baseline ?? null,
    horizon: p.goal?.months ?? null,
    protectedConstraints: p.goal?.protected ?? [],
    /* what a reply must fit inside, checked in code before anything is shown */
    constraints: {
      budget: p.resourceTotals?.recurring?.available ?? null, oneOffBudget: p.resourceTotals?.oneOff?.available ?? null,
      hoursWeek: p.resourceTotals?.hours?.weekly ?? null,
      missingQualifications: p.route === 'starter' ? arr(p.starter?.essentialGaps).map((g) => String(g).split(':')[0]).filter(Boolean) : [],
      permissions: p.route === 'starter' ? (p.direction?.permissions ?? null) : null,
    },
    sources: ev.filter((e) => e.state === 'source').map((e) => ({ id: e.id, title: e.sourceTitle ?? e.title ?? null, date: e.sourceDate ?? null, retrievedAt: e.retrievedAt ?? null, url: e.sourceUrl ?? null, value: e.value ?? null, unit: e.unit ?? null })),
    assumptions: ev.filter((e) => e.state === 'assumed').map((e) => ({ id: e.id, title: e.title ?? null, text: e.text ?? null, editable: !!e.editable })),
    chosenOpportunity: p.route === 'starter' && p.direction ? { id: p.direction.id, name: p.direction.name, buyer: p.direction.buyer, problem: p.direction.problem, offer: p.direction.offer, route: p.direction.route ?? null, niche: p.direction.niche ?? null, label: p.direction.label ?? null, chosen: !!p.direction.chosen } : null,
    shortlist: p.route === 'starter' ? arr(p.reveal?.available ? [p.reveal.primary, ...arr(p.reveal.alternatives)] : []).filter(Boolean).map((x) => ({ id: x.id, title: x.title, label: x.label, fitReason: x.fitReason })) : [],
    evidence: ev, calculator: p.calculator ?? { metrics: [] },
    modes: p.modes ?? null,
    plan: { finding: p.finding, firstAction: p.firstAction ? { id: p.firstAction.id, action: p.firstAction.action, whyFirst: p.firstAction.whyFirst } : null, actions: (p.actions ?? []).map((k) => ({ id: k.id, action: k.action, status: k.status })), unknowns: p.unknowns, scenarios: p.scenarios, constraint: p.constraint, goalPath: p.goalPath ?? null,
      /* the four stages as the deterministic plan wrote them, with the budgets a rewrite must respect */
      move: p.move ?? null, why: p.why ? { facts: p.why.facts, uncertainty: p.why.uncertainty, mission: p.why.mission, card: p.why.card } : null, sequence: p.sequence ? { today: { task: p.sequence.today.task, steps: p.sequence.today.steps, doneWhen: p.sequence.today.doneWhen }, week: { task: p.sequence.week.task, steps: p.sequence.week.steps, doneWhen: p.sequence.week.doneWhen }, review: p.sequence.review } : null, fit: p.fit ?? null },
    budgets: p.budgets ?? BUDGET,
    answers, registry: registryIds(),
  };
}
/** a validated reply layered on a copy of the plan: the deterministic plan is untouched; the renderer reads plan.model.
    D13: the stage fields of a plan reply are re-checked here against the budgets and land on `plan.model.layered` */
function withModel(plan, kind, value, revision) {
  const p = plan ?? current().plan;
  const rev = revision ?? p.revision;
  if (rev !== p.revision) return { ...p, model: { ...(p.model ?? {}), stale: { kind, revision: rev } } };
  const model = { ...(p.model ?? {}), [kind]: { value, revision: rev, at: new Date().toISOString() } };
  if (kind === 'ownerPlan' || kind === 'starterPlan') model.layered = layerable(value);
  return { ...p, model };
}
try { document.addEventListener('mercer:revision', () => { /* current() compares revisions; nothing is rebuilt here */ }); } catch (e) { /* no document */ }

/* ================================================================ results round 1 (D3, D10, D12): the move, the why, the sequence, the start, the fit

   The four result stages read one plan. Every visible summary below is written to its budget here, at generation: a
   candidate that overruns is replaced by a shorter form (a clause dropped at a conjunction, a label in place of a
   sentence), never clipped mid-sentence, and the full structured content stays in the detail fields and the exports.
   Results validates with M.plan.fits and never clips. */
const BUDGET = { goalLabel: 10, headline: 12, support: 24, factLabel: 4, factText: 40, uncertainty: 40, mission: 30, whyCard: 60, tradeoff: 30, startSentence: 30, actionCard: 90, task: 12, step: 22 };
const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
const fits = (t, n) => words(t) <= n;
const clean = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const sentence = (t) => { const x = clean(t).replace(/[\s.:;,]+$/, ''); return x ? `${cap(x)}.` : ''; };
/** a clause-level rewrite: parentheticals go first, then the tail after the last separator, until the text fits.
    Returns null when even the first clause overruns; the caller then falls back to a shorter form of its own */
function shorten(text, n) {
  let t = clean(text).replace(/\s*\([^)]*\)/g, '').replace(/[\s.:;,]+$/, '');
  const SEPS = [/;\s/g, /:\s/g, /,\s(?:and|but|so|then|or)\s/g, /\s(?:and|but|so|then|before|after|until|where)\s/g, /,\s/g];
  while (t && !fits(t, n)) {
    let cut = -1;
    for (const re of SEPS) { let m; re.lastIndex = 0; while ((m = re.exec(t))) cut = Math.max(cut, m.index); if (cut > 0) break; }
    if (cut <= 0) return null;
    t = t.slice(0, cut).replace(/[\s.:;,]+$/, '');
  }
  return t && words(t) >= 2 ? t : null;
}
/** the first candidate that fits the budget; a candidate is a string or a thunk, and the last one is the fallback */
function within(n, ...cands) {
  let last = '';
  for (const c of cands) {
    let v = null;
    try { v = typeof c === 'function' ? c() : c; } catch (e) { v = null; }
    if (!v) continue;
    v = clean(v);
    if (fits(v, n)) return v;
    last = v;
  }
  return shorten(last, n) ?? last;
}

/* the generic-action rejection of the brief's section 7: "improve your marketing", "explore AI", "build a brand",
   "do market research" and their kin pass only when the task, the audience, the channel, the scope and the output are
   all named. Anything else is replaced by the deterministic action, and a model reply carrying one is rejected. */
const GENERIC_RE = /\b(improve|boost|grow|scale|work on|focus on|enhance|optimi[sz]e|explore|leverage|embrace|adopt|consider|think about|look into|invest in|build|develop|do|conduct|carry out|raise|increase|drive|maximi[sz]e|strengthen|get more|expand)\b[^.;]{0,40}?\b(marketing|brand(?:ing)?|awareness|ai|artificial intelligence|automation|market research|research|online presence|social media|your business|the business|sales|revenue|growth|strategy|network(?:ing)?|content|seo|visibility|customer base|customer experience|digital|website|engagement|customers|leads)\b/i;
const NAMED = {
  task: /\b(send|sending|write|writing|call|calling|ask|asking|count|counting|set|raise|reply|follow up|hold|holding|offer|list|listing|name|book|take|stop|put|hand over|deliver|draft|post|posting|visit|test|sell|define|open|line up|log|logging|chase|invite|message|messaging|go to|speak to|quote)\b/i,
  audience: /\b(customers?|clients?|buyers?|parents?|owners?|households?|people|partners?|contacts?|enquir\w*|leads?|members?|suppliers?|families|businesses|firms|shops?|trades?|users?|learners?|students?|tenants?|landlords?)\b/i,
  channel: /\b(email|message|whatsapp|text|call|phone|in person|visit|post|linkedin|facebook|instagram|marketplace|referral|introduc\w*|door|stall|group|community|school|list|website|search|ads?|conversations?|meeting|market|forum|notice ?board|flyer)\b/i,
  scope: /\b(\d+|one|two|three|four|five|six|eight|ten|twenty|every|each|first|next|this week|today|a month|a week|four weeks|one page)\b/i,
  output: /\b(message|page|list|sheet|checklist|quote|repl(?:y|ies)|limit|price|notice|review|booking|pilot|session|deposit|conversations?|answers?|log|count|invoice|offer|brief|script|plan|template|names?|dates?|written|write.up)\b/i,
};
function generic(text) {
  const t = clean(text);
  if (!t) return true;
  if (!GENERIC_RE.test(t)) return false;
  return !Object.values(NAMED).every((re) => re.test(t));
}
/** a text that must be a specific action: a generic one is replaced by the fallback, which is never generic */
const specific = (text, fallback) => (generic(text) ? fallback : text);

/* the limb each area lives on (tree3d.js GROUPS): supporting facts are roots, directions are limbs, the milestones sit
   along the selected limb */
const AREA_LIMB = { capacity: 'capacity', process: 'capacity', offer: 'pricing', buyer: 'demand', channel: 'demand', conversion: 'conversion', trust: 'conversion', delegation: 'control', cash: 'margin', retention: 'retention', discovery: 'demand', validation: 'demand', direction: 'demand' };
/* the asset button is a verb: what pressing it does */
const ASSET_VERB = { 'offer-sheet': 'Open my offer sheet', 'outreach-message': 'Copy outreach message', 'booking-process': 'Copy booking replies', 'delivery-checklist': 'Open delivery checklist', 'review-request': 'Copy review request', 'follow-up-sequence': 'Copy follow-up message', 'referral-ask': 'Copy introduction ask', 'introduction-message': 'Copy partner message', 'price-notice': 'Copy price notice', 'validation-script': 'Open conversation script', proposal: 'Open proposal template', listing: 'Open listing description', 'content-plan': 'Open content plan', 'implementation-brief': 'Open implementation brief', 'execution-brief': 'Open execution brief' };
const COPY_KINDS = new Set(['outreach-message', 'booking-process', 'review-request', 'follow-up-sequence', 'referral-ask', 'introduction-message', 'price-notice']);

/* ---------------------------------------------------------------- the move, today and this week, per action

   `head` is the recommendation headline: an action of at most twelve words, never a topic or a slogan. `support` is
   the one sentence under it, from the owner's own figures where they gave them. `today` is the part of the action that
   can start now, `week` the rest, `continueIf` the proposed test criterion the review reads. Every string here is
   written to its budget; a template with a variable part passes through within() with a fixed fallback. */
/* a previous attempt never repeats the failed tactic without saying what changes (brief section 8): the supporting
   sentence names the verdict and the change, keyed by starter.js's verdict words */
const TRIED_SUPPORT = {
  'no exposure': 'Last time too few people saw it to show anything; this time three named buyers hear it directly and the count is kept.',
  'no demand at that offer and price': 'Last time people replied and nobody paid, so the conversations set the price before the offer goes out again.',
  'no demand through that channel': 'Last time enough people saw it and nobody replied, so the buyer changes: three people you can speak to directly.',
  'some demand shown': 'Someone paid last time, so demand exists; three more of the same buyers set the price from what they paid.',
  'demand shown, channel dried up': 'Sales came and stopped, so the demand is real and the channel ran out; the conversations find where the next buyers are.',
};
const MOVES = {
  'capacity-limit': {
    head: () => 'Set a weekly capacity limit before taking on more work.',
    support: (x) => (x.r.capacity !== null && x.r.enquiries !== null ? `You can deliver ${count(x.r.capacity)} jobs a month and ${count(x.r.enquiries)} enquiries arrive; more without a limit means waiting customers.` : 'You cannot deliver more next month, so a new enquiry needs a date rather than a no.'),
    today: { task: () => 'Write down your capacity limit and the waiting-list reply', doneWhen: 'The limit and both replies are written down' },
    week: { task: () => 'Use the waiting-list reply on every enquiry past the limit' },
    continueIf: 'Enquiries past the limit take a later date rather than going elsewhere',
  },
  'price-rise': {
    head: () => 'Raise the price on new work from next Monday.',
    support: (x) => (x.r.room === 'none' && x.r.price !== null ? `Each sale brings ${gbp(x.r.price)} and you cannot sell more of them, so each one has to earn more.` : /long|never/.test(x.r.priceRaised) ? 'Your prices have not moved in years, and the next revenue comes from each job before more jobs.' : 'Demand is not the constraint, so the next revenue comes from the price of each job.'),
    today: { task: () => 'Set the new price on the quote template', doneWhen: 'The new price is written on the quote template' },
    week: { task: () => 'Send every new quote at the new price and log acceptance' },
    continueIf: 'At least half of the next ten quotes accepted at the new price',
  },
  'delivery-checklist': {
    head: () => 'Write the delivery checklist and hand one step to someone else.',
    support: (x) => (x.r.ownerBound ? 'The business runs through you today; a written checklist is the smallest thing that lets a step leave you.' : 'Delivery has a hold-up you named, and a written checklist is the smallest thing that removes it.'),
    today: { task: () => 'Write the delivery checklist for one typical job', doneWhen: 'A checklist someone else could follow' },
    week: { task: () => 'Hand one step on the checklist to someone else' },
    continueIf: 'The handed step ran twice without coming back to you',
  },
  'overflow-partner': {
    head: () => 'Line up one overflow partner for the work you turn away.',
    support: () => 'You turn work away today; a partner who takes it keeps the customer, and the favour comes back.',
    today: { task: () => 'Name one partner who could take the work you turn away', doneWhen: 'One name and a message sent' },
    week: { task: () => 'Agree with that partner what is passed over and how' },
    continueIf: 'One turned-away job passed over and the customer kept',
  },
  'response-workflow': {
    head: () => 'Reply to every enquiry within the hour, with a set reply.',
    support: () => 'Enquiries wait days for a reply today, and the buyer who waits asks someone else for a quote.',
    today: { task: () => 'Write the set reply and put it where enquiries land', doneWhen: 'The reply is saved where every enquiry arrives' },
    week: { task: () => 'Reply to every enquiry within the hour and log the time' },
    continueIf: 'Every enquiry this week answered within the hour',
  },
  'follow-up-sequence': {
    head: () => 'Follow up every open quote before chasing new enquiries.',
    support: (x) => (x.r.enquiries !== null && x.r.closeRate !== null ? `${count(x.r.enquiries)} enquiries a month and ${pct(x.r.closeRate)} become customers; chasing the open quotes costs nothing.` : 'Quotes go out and are not chased, and chasing them costs nothing.'),
    today: { task: () => 'Send the day-two follow-up to every open quote', doneWhen: 'Every open quote has had one follow-up today' },
    week: { task: () => 'Send the day-seven and day-fourteen follow-ups and log the answers' },
    continueIf: 'More than one open quote answered after a follow-up',
  },
  'proof-collection': {
    head: () => 'Ask your last ten customers for a review this week.',
    support: () => 'Buyers who had not heard of you did not buy, and a review from a customer like them is the cheapest proof.',
    today: { task: () => 'Send the review request to the last ten customers', doneWhen: 'Ten review requests sent' },
    week: { task: () => 'Put the replies on the offer page and the quote' },
    continueIf: 'Three reviews in, shown where a buyer reads a quote',
  },
  'offer-sheet': {
    head: (x) => within(BUDGET.headline, `Rewrite the offer as one page for ${x.who}.`, 'Rewrite the offer as one page for one kind of customer.'),
    support: () => 'Not enough of the right enquiries reach you, and a page that says who it is for changes who asks.',
    today: { task: (x) => within(BUDGET.task, `Write the one-page offer for ${x.who}`, 'Write the one-page offer for one kind of customer'), doneWhen: 'One page that says who it is for and what it costs' },
    week: { task: () => 'Send the page with every quote and to three past customers' },
    continueIf: 'The next enquiries name the customer the page describes',
  },
  'referral-ask': {
    head: () => 'Ask the people who send you work for one introduction each.',
    support: (x) => (x.r.warm >= 2 ? `${count(Math.min(5, x.r.warm))} of your last five customers came through people who know you; one more ask each costs nothing.` : 'Work already comes through people who know you, and one more ask of each costs nothing.'),
    today: { task: () => 'Ask three people who already send you work for one introduction', doneWhen: 'Three introduction asks sent' },
    week: { task: () => 'Follow each introduction up with a call within two days' },
    continueIf: 'One introduction became a conversation',
  },
  'outreach-list': {
    head: (x) => within(BUDGET.headline, `List twenty ${x.who} and send the first messages by hand.`, 'List twenty prospects and send the first messages by hand.'),
    support: (x) => (x.r.market !== null ? `About ${count(x.r.market)} suitable customers are within reach and no route brings them; twenty messages by hand is the test.` : 'There is room for more work and no route brings enquiries, so twenty messages by hand is the test.'),
    today: { task: (x) => within(BUDGET.task, `List twenty ${x.who} you could reach this week`, 'List twenty prospects you could reach this week'), doneWhen: 'Twenty names and how to reach each one' },
    week: { task: () => 'Send the twenty messages by hand and log every reply' },
    continueIf: 'Two of the twenty replied and one conversation booked',
  },
  'partner-conversation': {
    head: () => 'Open one conversation with a business that already serves your customers.',
    support: () => 'The cheapest enquiry comes through someone your customers already trust, and one conversation costs an hour.',
    today: { task: () => 'Message one business that already serves your customers', doneWhen: 'One conversation booked' },
    week: { task: () => 'Hold the conversation and agree one introduction each way' },
    continueIf: 'One introduction received and one returned',
  },
  'stop-channel': {
    head: (x) => within(BUDGET.headline, `Stop ${x.flopWords} until something about it changes.`, 'Stop the channel that did not work until something changes.'),
    support: (x) => within(BUDGET.support, `${cap(x.flopWords)} did not work last time and is still running; its hours go to the next action.`, 'The channel that did not work is still running; its hours go to the next action.'),
    today: { task: (x) => within(BUDGET.task, `Stop ${x.flopWords} and write down what it cost`, 'Stop the channel and write down what it cost'), doneWhen: 'The spend or the hours on it are stopped' },
    week: { task: () => 'Count the enquiries for a week without it' },
    continueIf: 'Enquiries held for the week without it',
  },
  'growth-spend': {
    head: (x) => within(BUDGET.headline, `Put one month's budget on ${x.channelWords} and count replies.`, 'Put one month of budget on one channel and count replies.'),
    support: (x) => within(BUDGET.support, `You have ${gbp(x.r.budget)} a month and one channel to start with; one month counted shows whether it earns its place.`, 'One channel, one month, counted: that shows whether the spend earns its place.'),
    today: { task: (x) => within(BUDGET.task, `Set this month's spend on ${x.channelWords} and the count to beat`, 'Set the month of spend and the reply count to beat'), doneWhen: 'The spend and the count are written down' },
    week: { task: () => 'Run it for the month and count replies every week' },
    continueIf: 'Replies counted weekly and the cost of each reply known',
  },
  'delegate-area': {
    head: (x) => within(BUDGET.headline, `Hand over ${x.areaWords}, result included.`, 'Hand over one whole area, result included.'),
    support: (x) => (x.r.goalKind === 'time' ? 'You want your time back, and work you hand over still comes back to you; one whole area is what frees hours.' : 'Work you hand over comes back to you; one whole area, result included, is what changes that.'),
    today: { task: (x) => within(BUDGET.task, `Write down what handing over ${x.areaWords} means, result included`, 'Write down what handing over the area means, result included'), doneWhen: 'The area, its result and the person are named' },
    week: { task: () => 'Hand it over and stop checking it daily' },
    continueIf: 'The area ran a week without coming back to you',
  },
  'deposit-terms': {
    head: () => 'Take a deposit on every new job and chase what is owed.',
    support: (x) => (x.r.owed !== null ? `${gbp(x.r.owed)} is outstanding and customers pay after the work; the deposit stops the gap growing.` : 'Customers pay after the work, so growth costs cash before it earns any; the deposit closes that gap.'),
    today: { task: () => 'Chase every overdue invoice and add the deposit line to the quote', doneWhen: 'Every overdue invoice chased and the deposit on the quote' },
    week: { task: () => 'Take a deposit on every job booked this week' },
    continueIf: 'Every new job this week booked with a deposit',
  },
  'renewal-call': {
    head: () => 'Call every customer a month before their renewal date.',
    support: () => 'Too few customers renew, and a customer kept costs less than one won; the call comes before the date.',
    today: { task: () => 'List every customer renewing in the next month', doneWhen: 'The list with renewal dates' },
    week: { task: () => 'Call each of them before the renewal date' },
    continueIf: 'Every customer on the list called before the date',
  },
  'count-enquiries': {
    head: () => 'Count every enquiry and win for four weeks.',
    support: () => 'Enquiries and wins are not known, so the constraint could be demand or the close; four weeks of counting settles it.',
    today: { task: () => 'Start the enquiry log: date, source, quoted, won', doneWhen: 'The log exists with this week’s enquiries in it' },
    week: { task: () => 'Log every enquiry and win for the week' },
    continueIf: 'Four weeks logged with the source of every enquiry',
  },
  'customer-conversations': {
    head: () => 'Hold five conversations with recent customers this month.',
    support: (x) => (x.r.sparse ? 'Too little is known to diagnose the business, and five customers will say what they paid for and why.' : 'Mercer cannot yet tell demand from the close; five customers will say what they paid for and why.'),
    today: { task: () => 'Book five conversations with recent customers', doneWhen: 'Five conversations booked' },
    week: { task: () => 'Hold the five and write up what each paid for and why' },
    continueIf: 'Five conversations written up with one answer repeated',
  },
  'paid-pilot': {
    head: () => 'Sell one paid pilot before building anything more.',
    support: () => 'Nothing has been sold yet, so there is nothing to diagnose; one paying customer turns the idea into evidence.',
    today: { task: () => 'Offer one paid pilot to one person who has the problem', doneWhen: 'One pilot offered at a named price' },
    week: { task: () => 'Deliver the pilot, or take the no and its reason' },
    continueIf: 'One pilot paid for and delivered',
  },
  /* the starter route */
  'starter-conversations': {
    head: (x) => within(BUDGET.headline, `Hold three conversations with ${x.buyer} before offering anything.`, 'Hold three conversations with the first buyers before offering anything.'),
    support: (x) => within(BUDGET.support, () => TRIED_SUPPORT[x.p?.tried?.verdict], `${x.p.hours !== null && x.p.hours !== undefined ? `${count(x.p.hours)} hours a week` : 'Your hours'}${x.p.budget0 ? ' and nothing to spend' : ''} fit three conversations; ${x.p.demandEvidence === 'none yet' || x.p.demandEvidence === 'an assumption' ? 'nobody has asked for this yet, so demand is the unknown' : 'they set the price and the first offer'}.`, 'Three conversations cost nothing, and they set the price and the first offer.'),
    today: { task: (x) => within(BUDGET.task, `Send the outreach message to three ${x.buyer}`, 'Send the outreach message to three of the first buyers'), doneWhen: 'Three messages sent and three names written down' },
    week: { task: () => 'Hold the three conversations and write down what each last paid for' },
    continueIf: 'One of the three names something they would pay you for',
  },
  'starter-offer': {
    head: () => 'Write the one-page offer and send it after each conversation.',
    support: () => 'Every conversation and every test points at one page: what is done, what it costs, how to book.',
    today: { task: () => 'Write the one-page offer', doneWhen: 'One page: what is done, what it costs, how to book' },
    week: { task: () => 'Send it to each person after their conversation' },
    continueIf: 'A question comes back, or someone books',
  },
  'starter-first-test': {
    head: () => 'Offer the first paid test to one of the three.',
    support: () => 'The smallest test that produces evidence for this direction, and nothing is bought first.',
    today: { task: () => 'Offer the test to one of the three at the agreed price', doneWhen: 'One test offered at a named price' },
    week: { task: () => 'Deliver it and record the hours it took' },
    continueIf: (x) => x.p?.success ?? 'The first buyer pays',
  },
  'starter-find-group': {
    head: (x) => within(BUDGET.headline, `Find and speak to two ${x.buyer} this week.`, 'Find and speak to two of the first buyers this week.'),
    support: () => 'You said you cannot reach them yet, so there is no list; the first task is finding one place they already gather.',
    today: { task: (x) => within(BUDGET.task, `Find one place where ${x.buyer} already gather and go this week`, 'Find one place where the first buyers gather and go this week'), doneWhen: 'Two names you can message again, written down' },
    week: { task: () => 'Ask the two what they last paid someone for and write it down' },
    continueIf: 'Two names and one thing they would pay for',
  },
  'discovery-step': {
    head: (x) => within(BUDGET.headline, () => sentence(shorten(x.step, BUDGET.headline)), 'Ask five people what they last paid someone to do.'),
    support: (x) => within(BUDGET.support, x.why, 'Too little is known yet to compare directions.'),
    today: { task: (x) => within(BUDGET.task, () => shorten(x.step, BUDGET.task), 'Ask five people what they last paid someone to do'), doneWhen: 'The answers are written down' },
    week: { task: () => 'Bring the answers back here and continue' },
    continueIf: 'Five answers written down',
  },
};

/* ---------------------------------------------------------------- the facts behind the move: a label of four words, a sentence of forty

   Each reads one answer the person gave, in the words they would recognise, and never an id. A fact that cannot be
   said in the budget is left out rather than cut. */
const FACT_OWNER = {
  enquiries: (v) => ({ label: `${count(v)} enquiries a month`, text: `You said ${count(v)} enquiries reach you in a typical month.` }),
  closeRate: (v) => ({ label: `${pct(v)} become customers`, text: `You said about ${pct(v)} of enquiries become customers.` }),
  capacity: (v) => ({ label: `${count(v)} jobs a month`, text: `You said you can deliver ${count(v)} jobs a month at most.` }),
  canDeliverMore: (v) => { const t = lower(v); return /^no\b/.test(t) ? { label: 'Cannot deliver more', text: 'You said you could not deliver more next month.' } : /change|with/.test(t) ? { label: 'More needs a change', text: 'You said more work would need something to change first.' } : { label: 'Room for more', text: 'You said you could deliver more next month.' }; },
  breaksFirst: (v) => { const t = lower(v); return /^me\b|myself/.test(t) ? { label: 'You give first', text: 'You said you would be what gives first if more work came in.' } : /team|skill|staff/.test(t) ? { label: 'The team gives first', text: 'You said the team would give first if more work came in.' } : /cash/.test(t) ? { label: 'Cash gives first', text: 'You said cash would give first if more work came in.' } : /demand|nothing|room|customers/.test(t) ? { label: 'Demand runs out first', text: 'You said demand, not delivery, is what runs out first.' } : null; },
  followUps: (v) => ({ label: Number(v) <= 1 ? 'Quotes chased once' : `Quotes chased ${count(v)} times`, text: `You said a quote is followed up ${Number(v) <= 0 ? 'not at all' : Number(v) === 1 ? 'once' : `${count(v)} times`} before it is left.` }),
  responseTime: (v) => (/days|slow|longer|week/.test(lower(v)) ? { label: 'Replies take days', text: 'You said an enquiry can wait days for a reply.' } : { label: 'Replies same day', text: 'You said enquiries get a reply the same day.' }),
  reviews: (v) => (/none/.test(lower(v)) ? { label: 'No reviews yet', text: 'You said no customer has left a review yet.' } : /few|under/.test(lower(v)) ? { label: 'Few reviews', text: 'You said only a few customers have left reviews.' } : null),
  priceRaised: (v) => (/never/.test(lower(v)) ? { label: 'Price never raised', text: 'You said you have never raised your prices.' } : /long/.test(lower(v)) ? { label: 'Price unchanged for years', text: 'You said your last price rise was years ago.' } : null),
  price: (v) => ({ label: `${gbp(v)} a sale`, text: `You said a typical sale brings in ${gbp(v)}.` }),
  now: (v) => ({ label: `${gbp(v)} a month today`, text: `You said revenue is ${gbp(v)} in a typical month.` }),
  /* the goal's evidence record does not carry the figure as its value (the target question is a composite), so the
     figure is read from the owner's reading; with no finite figure there is no fact, never a "£NaN" on the page */
  goal: (v, x) => { const t = finite(Number(v)) ? Number(v) : finite(x.r?.goal) ? x.r.goal : null; return t === null ? null : { label: `${gbp(t)} a month target`, text: `You want ${gbp(t)} a month${x.r?.months ? ` within ${count(x.r.months)} months` : ''}.` }; },
  changeHours: (v) => ({ label: `${count(v)} hours a week`, text: `You said you can give this ${count(v)} hours a week.` }),
  hours: (v) => ({ label: `${count(v)} hours a week`, text: `You said you can give this ${count(v)} hours a week.` }),
  budget: (v) => (Number(v) === 0 ? { label: 'Nothing to spend monthly', text: 'You said there is no monthly budget for growth.' } : { label: `${gbp(v)} a month spend`, text: `You said ${gbp(v)} a month is available for growth.` }),
  terms: (v) => { const t = lower(v); return /sixty|60/.test(t) ? { label: 'Paid at 60 days', text: 'You said customers pay sixty days or more after the work.' } : /thirty|30|after|invoice/.test(t) ? { label: 'Paid after the work', text: 'You said customers pay after the work is done.' } : /deposit|up ?front|before/.test(t) ? { label: 'Paid before the work', text: 'You said customers pay before the work starts.' } : /completion|on the day/.test(t) ? { label: 'Paid on completion', text: 'You said customers pay on completion.' } : null; },
  owed: (v) => ({ label: `${gbp(v)} outstanding`, text: `You said ${gbp(v)} is owed to you today.` }),
  delegation: (v) => (/none/.test(lower(v)) ? { label: 'You do everything', text: 'You said nothing is handed over: every job runs through you.' } : /checks/.test(lower(v)) ? { label: 'Handed work comes back', text: 'You said work you hand over still comes back to you to check.' } : null),
  holiday: (v) => (/stops|never/.test(lower(v)) ? { label: 'Stops when you stop', text: 'You said the business stops when you take a holiday.' } : /slows/.test(lower(v)) ? { label: 'Slows when you stop', text: 'You said the business slows when you are away.' } : null),
  market: (v) => ({ label: `${count(v)} reachable customers`, text: `You said about ${count(v)} suitable customers are within reach.` }),
  website: (v) => (/none/.test(lower(v)) ? { label: 'No website', text: 'You said there is no website for a buyer to check.' } : null),
  stage: (v) => (/launch|prepar|pre/.test(lower(v)) ? { label: 'Not trading yet', text: 'You said the business has not traded yet.' } : null),
  lastFive: (v, x) => (x.r?.warm ? { label: `${count(Math.min(5, x.r.warm))} of five warm`, text: `You said ${count(Math.min(5, x.r.warm))} of your last five customers came through people who knew you.` } : null),
  access: (v) => (/none|no clear|no route/.test(lower(arr(v).join(' '))) ? { label: 'No route to buyers', text: 'You said there is no clear route to new customers yet.' } : { label: 'People who could introduce', text: 'You said people you know could introduce you to customers.' }),
  chooseThem: (v) => { const w = arr(v).map(lower)[0]; return w && words(w) <= 2 ? { label: `Lost on ${w}`, text: `You said buyers who went elsewhere chose on ${listWords(arr(v).map(lower).slice(0, 3))}.` } : null; },
  'calc:utilisation': (e) => ({ label: `${e.value}% full today`, text: `The economics module puts you at ${e.value}% full: the resource needed against the resource available.`, part: 'capacity' }),
};
const FACT_STARTER = {
  hoursWeek: (v, x) => ({ label: `${count(x.st.hours)} hours a week`, text: `You said you can give this ${count(x.st.hours)} hours a week.` }),
  testBudget: (v, x) => (x.st.budget === 0 ? { label: 'Nothing to spend', text: 'You said there is nothing to spend on a test, so nothing here costs money.' } : { label: `${gbp(x.st.budget)} to test with`, text: `You said ${gbp(x.st.budget)} is what you could afford to lose on a test.` }),
  proven: (v, x) => { const w = x.st.proven[0]; return w ? { label: within(BUDGET.factLabel, `Proven: ${lower(M.starter?.SKILL_WORDS?.[w] ?? w)}`, `Proven ${w}`), text: within(BUDGET.factText, `You said: ${x.st.provenWords}`, `You have used ${lower(M.starter?.SKILL_WORDS?.[w] ?? w)} for someone else.`) } : null; },
  skills: (v, x) => { const w = x.st.skills[0]; return w ? { label: within(BUDGET.factLabel, `Good at ${lower(M.starter?.SKILL_WORDS?.[w] ?? w)}`, `Good at ${w}`), text: `You said you are good at ${listWords(x.st.skills.slice(0, 3).map((k) => lower(M.starter?.SKILL_WORDS?.[k] ?? k)))}.` } : null; },
  groups: (v, x) => (x.st.groupWords ? { label: within(BUDGET.factLabel, () => cap(shorten(x.st.groupWords, BUDGET.factLabel)), 'A buyer you know'), text: within(BUDGET.factText, `You said you understand ${x.st.groupWords}.`, 'You named a group of buyers whose problems you understand.') } : null),
  askedFor: (v, x) => (x.st.askedWords ? { label: within(BUDGET.factLabel, () => `Asked for ${shorten(x.st.askedWords, 2)}`, 'People already ask'), text: within(BUDGET.factText, `You said people already ask you for ${x.st.askedWords}.`, 'You said people already ask you for help with this.') } : null),
  access: (v, x) => (x.st.access === 'direct' ? { label: 'Direct access to buyers', text: 'You said you can speak to the first buyers directly this week.' } : x.st.access === 'via' ? { label: 'Access through someone', text: 'You said someone you know can introduce you to the first buyers.' } : x.st.access === 'find' ? { label: 'No buyer access yet', text: 'You said you would need to find the first buyers: there is no list yet.' } : null),
  askedPaid: (v, x) => ({ 'paid-repeat': { label: 'Paid for repeatedly', text: 'You said people have paid for this more than once.' }, 'paid-once': { label: 'Paid for once', text: 'You said someone has paid for this once.' }, asked: { label: 'Someone already asked', text: 'You said someone has asked you for this.' }, nobody: { label: 'Nobody has asked yet', text: 'You said nobody has asked for or paid for this yet.' } }[x.st.askedPaid] ?? null),
  demandEvidence: (v, x) => (/request|asked/.test(x.st.demandEvidence) ? { label: 'Someone already asked', text: 'You said someone has asked you for this.' } : /pay|paid|spend/.test(x.st.demandEvidence) ? { label: 'People already pay', text: 'You said people already pay for this.' } : null),
  triedOutcome: (v, x) => (x.st.triedVerdict ? { label: within(BUDGET.factLabel, `Tried: ${x.st.triedVerdict}`, 'Tried before'), text: within(BUDGET.factText, `You offered ${x.st.triedWhat || 'it'}${x.st.triedChannel ? ` through ${x.st.triedChannel}` : ''}: ${x.st.triedVerdict}.`, `Your last attempt showed ${x.st.triedVerdict}.`) } : null),
  triedNumbers: (v, x) => (x.st.triedNumbers?.saw !== null && x.st.triedNumbers?.saw !== undefined ? { label: `${count(x.st.triedNumbers.saw)} saw it`, text: `You said about ${count(x.st.triedNumbers.saw)} people saw it${x.st.triedNumbers.replied !== null ? `, ${count(x.st.triedNumbers.replied)} replied` : ''}${x.st.triedNumbers.bought !== null ? ` and ${count(x.st.triedNumbers.bought)} bought` : ''}.` } : null),
  urgency: (v, x) => (x.st.urgency === 'soon' ? { label: 'Income needed soon', text: 'You said the income is needed soon, so the first test is short.' } : null),
};
/** the fact for one evidence id, or null; `x.route` picks the table and the starter's ids are read back to concepts */
function factFor(id, x) {
  const e = x.resolve(id);
  if (!e) return null;
  let f = null;
  try {
    if (/^calc:/.test(id)) f = FACT_OWNER[id] ? FACT_OWNER[id](e, x) : null;
    else if (x.route === 'starter') { const concept = x.conceptOf(id); f = concept && FACT_STARTER[concept] ? FACT_STARTER[concept](e.value, x) : null; }
    else f = FACT_OWNER[id] ? FACT_OWNER[id](e.value, x) : null;
  } catch (err) { f = null; }
  if (!f) {
    /* an answer without a template is used only when the person's own words are short enough to be the label */
    const v = typeof e.value === 'string' ? clean(e.value) : null;
    /* one token is an option id ("time", "consumer"), never words a visitor would read back */
    if (!v || words(v) < 2 || !fits(v, BUDGET.factLabel) || /^[a-z]+\d+$/.test(v) || e.state === 'unknown' || e.state === 'assumed') return null;
    f = { label: cap(v), text: e.question && e.question !== id ? `Your answer to "${e.question}": ${v}.` : `Your answer: ${v}.` };
  }
  if (!fits(f.label, BUDGET.factLabel) || !fits(f.text, BUDGET.factText)) return null;
  return { id: `fact:${id}`, label: f.label, text: sentence(f.text), part: f.part ?? (/^calc:/.test(id) ? 'capacity' : 'roots'), evidenceIds: [id], answerId: /^(calc|assume|src):/.test(id) ? null : id, state: e.state ?? 'user' };
}
function factsFor(ids, x, max = 3) {
  const out = [];
  [...new Set(ids.filter(Boolean))].forEach((id) => { if (out.length >= max) return; const f = factFor(id, x); if (f && !out.some((o) => o.label === f.label)) out.push(f); });
  return out;
}
function uncertaintyFor(plan, x) {
  const u = (plan.unknowns ?? []).find((k) => k && k.label) ?? null;
  if (u) {
    /* a starter unknown already reads "Price: not known yet."; an owner unknown is the bare name of the answer */
    const said = String(u.label).includes(':') || /not known|unproven|untested/i.test(u.label);
    const name = clean(String(u.label).split(':')[0]).replace(/[.]+$/, '');
    return { label: within(8, name, 'What is not known yet'), text: within(BUDGET.uncertainty, () => `${said ? sentence(u.label) : `${cap(name)} is not known yet.`} ${u.why ?? ''}`, `${cap(name)} is not known yet.`), answerId: /^unproven:/.test(String(u.id)) ? null : u.id };
  }
  const alt = plan.finding?.alternative;
  if (alt) return { label: 'The reading could be wrong', text: within(BUDGET.uncertainty, alt, 'The diagnosis rests on your answers; one of them read differently changes the move.'), answerId: plan.firstAction?.evidenceIds?.find((id) => !/^(calc|assume|src):/.test(id)) ?? null };
  return { label: 'Untested until it runs', text: 'The move rests on your answers. The review after the first test is what confirms or changes it.', answerId: null };
}
/* the mission line (brief section 2): why the move serves the person's own goal, never a sales default */
const MISSION = {
  time: 'You asked for your time back, so this move takes hours off you before it adds work; nothing here grows the business faster than it frees you.',
  income: 'You asked for a bigger income, and this is the move that adds revenue soonest with the hours and budget you gave.',
  growth: 'You asked for growth, and this is the move that adds customers you can still deliver for.',
  predictability: 'You asked for predictable revenue, so this move steadies what comes in before it adds to it.',
  sell: 'You asked for a business you can sell, and this move takes it one step further from depending on you.',
  lasts: 'You asked for a business that outlasts you, and this move takes it one step further from depending on you.',
  beat: 'You said you want to beat a competitor, and this move wins the buyers you both compete for.',
  starter: 'This is the smallest step towards the income you described, and it spends nothing you said you could not afford.',
  other: 'This is the move that serves what you said you want, with the hours and budget you gave.',
};
function missionFor(x) {
  const k = x.route === 'starter' ? 'starter' : (x.r?.goalKind ?? 'other');
  return within(BUDGET.mission, MISSION[k] ?? MISSION.other, MISSION.other);
}
function whyFor(plan, first, x) {
  const ids = [...(first?.evidenceIds ?? []), ...(plan.finding?.evidenceIds ?? []), ...(plan.goal?.evidenceIds ?? [])];
  const facts = factsFor(ids, x);
  const uncertainty = uncertaintyFor(plan, x);
  const two = facts.slice(0, 2);
  const card = within(BUDGET.whyCard,
    () => (two.length ? `${two.map((f) => f.text).join(' ')} ${uncertainty.text}` : null),
    () => (two.length ? `${two.map((f) => f.text).join(' ')} Not known yet: ${lower(uncertainty.label)}.` : null),
    () => (two.length ? `Known: ${two.map((f) => lower(f.label)).join('; ')}. Not known yet: ${lower(uncertainty.label)}.` : null),
    () => `${sentence(plan.finding?.headline ?? 'The move rests on your answers')} Not known yet: ${lower(uncertainty.label)}.`,
    'The move rests on your answers, and the review after the first test confirms or changes it.');
  /* the cockpit brief, 8: the interest alignment of the chosen direction rides on the Why stage, kept apart from the
     facts and the feasibility; a starter with too little preference data gets its note, an owner has none */
  const interest = x.route === 'starter' ? (plan.starter?.direction?.interest ?? plan.reveal?.primary?.interest ?? null) : null;
  return { facts, uncertainty, mission: missionFor(x), card, interest };
}

/* ---------------------------------------------------------------- the Action additions (D3) */
const costLabel = (k) => k.cost?.label ?? (Number(k.cost?.oneOff) || Number(k.cost?.recurring) ? `${gbp((Number(k.cost.oneOff) || 0) + (Number(k.cost.recurring) || 0))}` : 'Nothing to buy');
const timeLabel = (h) => (h === null || h === undefined ? 'not known yet' : h < 1 ? 'under an hour' : `about ${count(h)} hour${Number(h) === 1 ? '' : 's'}`);
/** the visible prose of an action card, under ninety words; the steps are rewritten to their first clause before
    anything is dropped, and the full steps stay on the card's details */
function actionCard(a) {
  const tc = `Time: ${a.time}${a.estimated ? ' (estimate)' : ''}. Cost: ${a.costLabel}.`;
  const done = `Done when: ${clean(a.doneWhen).replace(/[.]+$/, '')}.`;
  const pre = a.prerequisite ? `First: ${sentence(a.prerequisite)}` : '';
  const S = (list) => list.map((s) => sentence(s)).join(' ');
  return within(BUDGET.actionCard,
    () => [sentence(a.task), pre, S(a.steps), tc, done].filter(Boolean).join(' '),
    () => [sentence(a.task), pre, S(a.steps.map((s) => shorten(s, BUDGET.step) ?? s)), tc, done].filter(Boolean).join(' '),
    () => [sentence(a.task), pre, S(a.steps.slice(0, 1).map((s) => shorten(s, BUDGET.step) ?? s)), tc, done].filter(Boolean).join(' '),
    () => [sentence(a.task), pre, tc, done].filter(Boolean).join(' '),
    () => [sentence(a.task), tc, done].join(' '));
}
function assetRef(kind, plan) {
  if (!kind) return null;
  const a = (plan.assets ?? []).find((z) => z.kind === kind) ?? null;
  return { kind, label: ASSET_VERB[kind] ?? `Open ${lower(ASSET_TITLES[kind] ?? kind)}`, mode: COPY_KINDS.has(kind) ? 'copy' : 'open', title: ASSET_TITLES[kind] ?? kind, text: a?.text ?? null, unknowns: a?.unknowns ?? [] };
}
/** every action card gets the D3 fields; `cost` stays the object the exports and the resource totals read, and prints
    as its label */
function decorateAction(k, x, plan) {
  const t = MOVES[k.id] ?? {};
  const allSteps = arr(k.steps).map(String);
  k.task = specific(within(BUDGET.task, () => t.head?.(x)?.replace(/\.$/, ''), () => shorten(k.action, BUDGET.task), k.action), within(BUDGET.task, () => shorten(k.action, BUDGET.task), k.action));
  k.steps = allSteps.slice(0, 3);
  k.time = timeLabel(k.effort?.hours ?? null);
  k.estimated = !!(k.effort?.estimate || k.cost?.estimate);
  k.costLabel = costLabel(k);
  if (k.cost && typeof k.cost === 'object' && !Object.prototype.hasOwnProperty.call(k.cost, 'toString')) Object.defineProperty(k.cost, 'toString', { value: () => k.costLabel, enumerable: false });
  k.prerequisite = k.prerequisite ?? (k.sequence === 'after' && k.sequenceNote ? k.sequenceNote : null);
  // the polish pack, 4: with nought extra hours the first action starts by freeing time, said as its prerequisite
  if (plan.resourceTotals?.hours?.available === 0 && plan.firstAction && plan.firstAction.id === k.id) k.prerequisite = 'Free two hours a week first: hand one routine task to someone else, or stop it, and keep those hours for this';
  k.assetKind = typeof k.asset === 'string' ? k.asset : (k.asset?.kind ?? null);
  k.asset = assetRef(k.assetKind, plan);
  k.details = { steps: allSteps, dependencies: [...arr(k.needs), ...arr(k.dependsOn).map((d) => `After ${d}`), k.sequenceNote].filter(Boolean), evidence: arr(k.evidenceIds), contingency: k.changeCourseIf ?? null, measure: k.measure ?? null, why: k.whyFirst ?? null };
  k.card = actionCard(k);
  k.branchId = AREA_LIMB[k.area] ?? 'demand';
  return k;
}
/** today and this week, split from the first action: today is the part that can start now, the week is the rest, and
    the review is the proposed test criterion at an elapsed time */
function sequenceFor(first, x, plan) {
  const t = MOVES[first.id] ?? {};
  const all = arr(first.details?.steps ?? first.steps).map(String);
  const n = all.length;
  const k = Math.max(1, Math.min(3, Math.ceil(n / 2)));
  const hours = finite(first.effort?.hours) ? first.effort.hours : null;
  const todayHours = hours === null ? null : Math.max(1, Math.ceil(hours / 2));
  const weekHours = hours === null ? null : Math.max(0, hours - todayHours);
  const base = (kind, o) => {
    const a = { id: `${first.id}:${kind}`, kind, area: first.area, branchId: first.branchId, action: first.action, responsible: first.responsible, evidenceIds: first.evidenceIds, measure: first.measure, changeCourseIf: first.changeCourseIf, effort: first.effort, cost: first.cost, estimated: first.estimated, asset: first.asset, assetKind: first.assetKind, details: first.details, ...o };
    a.task = specific(a.task, first.task);
    a.card = actionCard(a);
    return a;
  };
  const today = base('today', {
    task: within(BUDGET.task, () => t.today?.task?.(x), first.task), steps: all.slice(0, k),
    time: timeLabel(todayHours), costLabel: first.costLabel, doneWhen: t.today?.doneWhen ?? first.doneWhen, prerequisite: first.prerequisite ?? null,
  });
  const week = base('week', {
    task: within(BUDGET.task, () => t.week?.task?.(x), () => `Finish: ${first.task}`), steps: all.slice(k, k + 3).length ? all.slice(k, k + 3) : [first.doneWhen],
    time: weekHours === null ? 'not known yet' : weekHours === 0 ? 'the same hours' : timeLabel(weekHours), costLabel: Number(first.cost?.oneOff) ? 'Nothing more to buy' : first.costLabel, doneWhen: t.week?.doneWhen ?? first.doneWhen, prerequisite: null, asset: first.asset,
  });
  const continueIf = typeof t.continueIf === 'function' ? t.continueIf(x) : (t.continueIf ?? first.measure);
  const afterDays = x.route === 'starter' ? 7 : 14;
  const review = { afterDays, date: null, text: `After ${afterDays} days: ${lower(first.measure).replace(/[.]+$/, '')}.`, continueIf, changeIf: first.changeCourseIf, labelledAs: 'proposed test criteria', note: 'A quota or a threshold here is a planning choice for the test, not a forecast or a benchmark.' };
  return { today, week, review };
}
/* ---------------------------------------------------------------- the pre-display check (brief section 7): hours, budget, skills, capacity, prior attempts */
function fitOf(first, x) {
  const hoursWeek = x.route === 'starter' ? (x.p?.hours ?? null) : x.r.hours;
  const fortnight = finite(hoursWeek) ? hoursWeek * 2 : null;
  const need = finite(first?.effort?.hours) ? first.effort.hours : 0;
  const hours = fortnight === null ? { ok: null, text: 'Your hours a week are not known yet; the sequence assumes one thing at a time.' }
    : need <= fortnight ? { ok: true, text: `${count(need)} hours over the first two weeks fits inside your ${count(hoursWeek)} a week.` }
    : { ok: false, text: `${count(need)} hours over the first two weeks is more than the ${count(fortnight)} you have in that time.` };
  const oneOff = Number(first?.cost?.oneOff) || 0; const rec = Number(first?.cost?.recurring) || 0;
  const oneOffCap = x.route === 'starter' ? (x.p?.budgetKnown ? x.p.budget : null) : x.r.oneOffBudget;
  const recCap = x.route === 'starter' ? (x.p?.monthlyKnown ? x.p.monthly : null) : x.r.budget;
  const paidUnknown = first?.cost && first.cost.oneOff === null && first.cost.estimate;
  const budget = (oneOffCap !== null && oneOff > oneOffCap) || (recCap !== null && rec > recCap) || (oneOffCap === 0 && paidUnknown) ? { ok: false, text: oneOffCap === 0 ? 'You said nothing can be spent, and this step would spend something.' : `This step costs more than the ${gbp(oneOffCap ?? recCap)} you gave.` }
    : !oneOff && !rec && !paidUnknown ? { ok: true, text: 'Nothing to buy.' }
    : oneOffCap === null && recCap === null ? { ok: null, text: 'Your budget is not known yet, so the cost is not checked against it.' }
    : { ok: true, text: 'The cost fits inside the budget you gave.' };
  let skills;
  if (x.route === 'starter') { const gaps = arr(x.p?.essentialGaps); skills = gaps.length ? { ok: null, text: `A gap to close first: ${gaps[0]}` } : { ok: true, text: 'Nothing here needs a skill you did not name.' }; }
  else skills = { ok: true, text: 'Uses what the business already does; no new skill is assumed.' };
  const capacity = x.route === 'starter' ? { ok: true, text: 'One small delivery at a time; nothing here outruns your hours.' }
    : LEADGEN.has(first?.area) && x.r.room === 'none' ? { ok: false, text: 'More enquiries would wait, not buy: you cannot deliver more.' }
    : { ok: true, text: x.r.room === 'none' ? 'The move adds no work you cannot deliver.' : 'Delivery capacity does not block it.' };
  let prior;
  if (x.route === 'starter') prior = x.p?.tried?.verdict ? { ok: true, text: `Your last attempt showed ${x.p.tried.verdict}; the plan says what changes.` } : { ok: true, text: 'Nothing tried before rules it out.' };
  else { const flop = x.r.flops.find((f) => first?.id === 'growth-spend' && x.channelKey === f); prior = flop ? { ok: false, text: `${cap(CHANNEL_WORDS[flop] ?? flop)} did not work before and this would repeat it.` } : { ok: true, text: x.r.flops.length ? `What did not work before (${listWords(x.r.flops.map((f) => CHANNEL_WORDS[f] ?? f))}) is not repeated.` : 'Nothing tried before rules it out.' }; }
  const access = x.route === 'starter' && x.p?.noAccess && first?.id !== 'starter-find-group' ? { ok: false, text: 'You said you cannot reach the first buyers yet, and this step assumes you can.' } : { ok: true, text: x.route === 'starter' && x.p?.noAccess ? 'The first task builds the contact list; nothing assumes one exists.' : 'Reaching the people it names is within what you said.' };
  const checks = { hours, budget, skills, capacity, prior, access };
  const notes = Object.values(checks).filter((c) => c.ok === false).map((c) => c.text);
  return { ok: notes.length === 0, ...checks, notes };
}
/* the one action that resolves a failed fit: the exact prerequisite, not generic advice */
function fitStepFor(fit, x, plan) {
  const currency = plan.currency ?? 'GBP';
  const mk = (o) => ({ id: o.id, area: o.area, priority: 1, status: 'primary', waitReason: null, responsible: 'You', needs: [], dependsOn: [], scenarioId: null, effort: H(o.hours ?? 2), cost: FREE(currency), evidenceIds: o.evidenceIds ?? [], ...o });
  if (fit.access.ok === false) {
    const buyer = x.buyer ?? 'the first buyers';
    return mk({ id: 'starter-find-group', area: 'validation', hours: 2, action: `Find and speak to two ${buyer} this week`, whyFirst: 'There is no contact list yet. Nothing can be sent until there is somebody to send it to, so the first task finds one place the first buyers already gather.',
      steps: [`List five places ${buyer} already are: a group, a school gate, a trade counter, a market, an online forum.`, 'Go to one this week and ask two people what they last paid someone to do for them.', 'Write down two names and how to reach each one again.'],
      doneWhen: 'Two names you can message again, written down', measure: 'Names collected and what each said they last paid for, at the end of the week', changeCourseIf: 'A week in one place and nobody fits the buyer: change the place before the buyer',
      asset: 'validation-script', prerequisite: 'No contact list yet: this task builds one.', evidenceIds: [x.fid?.('access'), x.fid?.('groups'), x.fid?.('audience')].filter(Boolean) });
  }
  if (fit.budget.ok === false) {
    const buyer = x.buyer ?? 'the first buyers';
    return mk({ id: 'starter-conversations', area: 'validation', hours: 3, action: `Hold three conversations with ${buyer}`, whyFirst: 'You said nothing can be spent, so the first step is the one that costs nothing: three conversations set the price and the offer before anything is bought.',
      steps: ['Name the first three people who fit the buyer and how you reach each one.', 'Send the outreach message below and ask for a conversation, not a sale.', 'Write down what each last paid for and what would make them pay you.'],
      doneWhen: 'Three conversations held and written up', measure: 'What each person last paid for and what they would pay you', changeCourseIf: 'None of the three can name anything they would pay for: change the buyer before the offer',
      asset: 'outreach-message', prerequisite: null, evidenceIds: [x.fid?.('testBudget'), x.fid?.('access')].filter(Boolean) });
  }
  if (fit.hours.ok === false) {
    return mk({ id: 'fit-hours', area: 'discovery', hours: 1, action: 'Find two more hours a week before the first step', whyFirst: `The first step needs more hours in a fortnight than you have. Nothing here can be tested in less, so the hours come first.`,
      steps: ['Write down where this week’s hours went, in half-hour blocks.', 'Mark two blocks a week that can go to this without something else breaking.', 'Put them in the diary for the next two weeks.'],
      doneWhen: 'Two hours a week in the diary for two weeks', measure: 'Hours actually spent on this in week one', changeCourseIf: 'The two hours did not happen: the plan waits until they can', asset: null, prerequisite: fit.hours.text, evidenceIds: [x.route === 'starter' ? x.fid?.('hoursWeek') : 'changeHours'].filter(Boolean) });
  }
  return null;
}
function startFor(plan, x, first) {
  const area = first?.area ?? 'discovery';
  const buyer = x.buyer ?? 'the first buyers';
  const S = {
    capacity: 'TMA can check the capacity limit and the booking replies against what your enquiries actually say before you use them.',
    process: 'TMA can walk the delivery checklist through with you and help name the step that leaves you first.',
    offer: 'TMA can review the new price and the one-page offer against your last ten quotes before they go out.',
    buyer: 'TMA can go through the offer page and the first messages with you before they are sent.',
    channel: 'TMA can go through the list and the first twenty messages with you before they are sent.',
    conversion: 'TMA can check the reply and the follow-up sequence against the quotes you have open now.',
    trust: 'TMA can look at the ten review requests and where the replies will sit before you send them.',
    delegation: 'TMA can help you write down the area you are handing over, result included, before you hand it.',
    cash: 'TMA can review the deposit terms and the chasing messages before they reach customers.',
    retention: 'TMA can go through the renewal list and the call with you before the calls start.',
    discovery: 'TMA can go through the conversation script and the five names with you before the calls.',
    validation: x.route === 'starter' ? `TMA can review the direction, the offer page and the outreach message against what ${buyer} actually say, before week three.` : 'TMA can review the pilot offer and its price with you before it goes to anyone.',
  };
  const sentenceText = within(BUDGET.startSentence, S[area], S.discovery, 'TMA can go through the first step with you before you take it.');
  let destination = null;
  try { destination = M.canopy?.bookingOf?.()?.url ?? M.bookingUrl ?? null; } catch (e) { destination = null; }
  if (destination && !/^https:\/\/\S+$/.test(String(destination))) destination = null;
  return { headline: 'Put your plan into action.', sentence: sentenceText, cta: destination ? 'book' : 'download', destination, ctaLabel: destination ? 'Book a call with TMA' : 'Download my implementation brief', note: 'A booking press sends nothing. Sharing is reviewed first, and a download is never described as sent.' };
}
function moveFor(plan, first, x) {
  const t = MOVES[first?.id] ?? {};
  const fallbackHead = within(BUDGET.headline, () => sentence(shorten(first?.action, BUDGET.headline)), sentence(first?.action ?? 'Hold five conversations with recent customers'));
  const headline = specific(within(BUDGET.headline, () => sentence(t.head?.(x)), fallbackHead), fallbackHead);
  const support = within(BUDGET.support, () => sentence(t.support?.(x)), () => sentence(shorten(first?.whyFirst?.split(/(?<=\.)\s/)[0], BUDGET.support)), sentence(plan.finding?.headline ?? 'This is the first move the evidence supports'));
  const goalLabel = x.route === 'starter'
    ? within(BUDGET.goalLabel, () => (plan.goal?.words ? `Your aim: ${lower(plan.goal.words)}` : null), 'Your aim: a first paying customer')
    : within(BUDGET.goalLabel, () => (plan.goal?.words ? `${cap(plan.goal.words)}${plan.goal.target !== null && plan.goal.target !== undefined ? `: ${gbp(plan.goal.target)} a month in ${count(plan.goal.months)} months` : ''}` : null), () => (plan.goal?.target !== null && plan.goal?.target !== undefined ? `${gbp(plan.goal.target)} a month in ${count(plan.goal.months)} months` : null), 'Your goal');
  const hypothesis = x.route === 'starter'
    ? !(x.p?.demandEvidence === 'people already spend on this' || x.p?.demandEvidence === 'first-hand requests') || plan.readiness?.level !== 'full'
    : plan.readiness?.level !== 'full' || x.r.sparse || ['unknown', 'leaning strong', 'leaning weak'].includes(x.r.demand) || first?.area === 'discovery';
  return { goalLabel, headline, support, hypothesis, branchId: first?.branchId ?? AREA_LIMB[first?.area] ?? 'demand', evidenceIds: arr(first?.evidenceIds), actionId: first?.id ?? null };
}
/** the alternatives behind the comparison control: at most two, each with its trade-off and whether it can be used now */
function tradeoffs(plan, x) {
  return (plan.alternatives ?? []).slice(0, 2).map((a) => {
    const name = a.action ?? a.card?.name ?? a.id;
    const why = x.route === 'starter' ? (a.card?.against ?? a.card?.unknown ?? a.why) : a.why;
    const tradeoff = within(BUDGET.tradeoff, () => `${sentence(shorten(name, 8) ?? name)} ${sentence(shorten(why, BUDGET.tradeoff - 3) ?? why)}`, () => `${sentence(shorten(name, 8) ?? name)} ${sentence(shorten(why, 12) ?? 'weaker evidence for it than for the move above')}`, 'Weaker evidence for it than for the move above.');
    return { ...a, tradeoff, useable: a.useable !== undefined ? !!a.useable : true };
  });
}
function finishOwner(plan, c) {
  const { s, r } = c;
  const x = { route: 'owner', s, r, plan, who: bestClientWords(s), currency: plan.currency ?? c.currency,
    flopWords: listWords(r.flops.map((f) => CHANNEL_WORDS[f] ?? f)) || 'that channel', channelKey: firstChannel(c.eng)?.channel ?? null, channelWords: CHANNEL_WORDS[firstChannel(c.eng)?.channel] ?? firstChannel(c.eng)?.channel ?? 'one channel',
    areaWords: lower(arr(val(s, 'delegationAreas') ?? val(s, 'teamOwns'))[0] ?? 'one whole area'),
    resolve: (id) => resolveEvidence(id, plan) };
  plan.actions.forEach((k) => decorateAction(k, x, plan));
  let first = plan.firstAction;
  let fit = fitOf(first, x);
  if (!fit.ok) {
    /* the move must fit before it is shown: the next primary that does, else the exact prerequisite as the first action */
    const other = plan.actions.find((k) => k.status === 'primary' && k !== first && fitOf(k, x).ok) ?? null;
    const step = other ?? fitStepFor(fit, x, plan);
    if (step) {
      if (!other) { decorateAction(step, x, plan); plan.actions.unshift(step); plan.assets = buildAssets(plan.actions, { s, r, eng: c.eng, route: 'owner', currency: x.currency, tools: c.tools }); step.asset = assetRef(step.assetKind, plan); }
      fit.replaced = { from: first?.id ?? null, to: step.id, why: fit.notes[0] };
      first = step; plan.firstAction = step;
      fit = { ...fitOf(step, x), replaced: fit.replaced };
    }
  }
  plan.fit = fit;
  plan.move = moveFor(plan, first, x);
  plan.why = whyFor(plan, first, x);
  plan.sequence = first ? sequenceFor(first, x, plan) : null;
  plan.alternatives = tradeoffs(plan, x);
  plan.start = startFor(plan, x, first);
  plan.budgets = BUDGET;
  return plan;
}
function finishStarter(plan, ctx) {
  const { s, p, st } = ctx;
  const buyer = p?.direction ? (p.buyerProblem?.split(':')[0] ?? p.direction.buyer) : (st?.firstBuyer || st?.groupWords || null);
  const conceptOf = (id) => { for (const k of Object.keys(M.starter?.FIELDS ?? {})) { if ((M.starter.FIELDS[k] ?? []).includes(id) || (M.starter.idFor?.(s, k) === id)) return k; } return null; };
  const x = { route: 'starter', s, p: p ?? null, st: st ?? {}, plan, buyer, currency: plan.currency ?? ctx.currency, resolve: (id) => resolveEvidence(id, plan), conceptOf, fid: ctx.fid, step: plan.firstAction?.action, why: plan.finding?.text };
  plan.actions.forEach((k) => decorateAction(k, x, plan));
  let first = plan.firstAction;
  let fit = fitOf(first, x);
  if (!fit.ok) {
    const step = fitStepFor(fit, x, plan);
    if (step) {
      decorateAction(step, x, plan);
      const dup = plan.actions.findIndex((k) => k.id === step.id);
      if (dup >= 0) plan.actions.splice(dup, 1);
      plan.actions.forEach((k) => { if (k.status === 'primary') k.dependsOn = [...new Set([...(k.dependsOn ?? []), step.id])]; });
      plan.actions.unshift(step);
      plan.actions.forEach((k, i) => { if (k.status === 'primary') k.priority = i + 1; });
      plan.assets = buildAssets(plan.actions, { s, route: 'starter', currency: x.currency, starter: p });
      plan.actions.forEach((k) => { k.asset = assetRef(k.assetKind, plan); });
      fit.replaced = { from: first?.id ?? null, to: step.id, why: fit.notes[0] };
      first = step; plan.firstAction = step;
      fit = { ...fitOf(step, x), replaced: fit.replaced };
    }
  }
  plan.fit = fit;
  plan.move = moveFor(plan, first, x);
  plan.why = whyFor(plan, first, x);
  plan.sequence = first ? sequenceFor(first, x, plan) : null;
  plan.alternatives = tradeoffs(plan, x);
  plan.start = startFor(plan, x, first);
  plan.budgets = BUDGET;
  /* D10: the starter result contract, on top of what starter.js already returns */
  const seq = plan.sequence;
  const quota = first?.id === 'starter-find-group' ? 'two names' : first?.id === 'starter-conversations' || first?.id === 'starter-first-test' ? 'three conversations' : first?.id === 'discovery-step' ? 'five answers' : (seq?.today?.doneWhen ?? null);
  const prerequisites = [...new Set([first?.prerequisite, p?.noAccess ? 'No contact list yet: the first task builds one.' : null, ...arr(p?.essentialGaps), p?.direction?.permissions ?? null].filter(Boolean))];
  const experiment = { do: seq?.today?.task ?? first?.action ?? null, quota, threshold: seq?.review?.continueIf ?? null, reviewAfterDays: seq?.review?.afterDays ?? 7, continueIf: seq?.review?.continueIf ?? null, changeIf: seq?.review?.changeIf ?? null, labelledAs: 'proposed test criteria', note: 'The quota and the threshold are proposed test criteria, not predicted conversion rates. Warm replies are not payment.' };
  const contract = { direction: p?.direction ?? null, buyer, offer: p?.firstOffer ?? null, channel: p?.firstBuyerRoute ?? null, experiment, prerequisites, asset: first?.asset ?? null, noAccess: !!p?.noAccess, startPoint: p?.startPoint ?? st?.startPoint ?? null, tried: p?.tried ?? null, whatChanges: p?.tried?.changes ?? null };
  plan.starter = plan.starter && typeof plan.starter === 'object' ? Object.assign(plan.starter, contract) : contract;
  if (p?.tried?.changes && first) { first.whyFirst = `${p.tried.changes} ${first.whyFirst ?? ''}`.trim(); first.details = { ...(first.details ?? {}), why: first.whyFirst, priorAttempt: p.tried }; }
  return plan;
}
/** the fields of a model reply that may be layered on the four stages, each re-checked against the budgets here;
    anything that overruns or reads generic is dropped, never clipped */
function layerable(value) {
  const v = value && typeof value === 'object' ? value : {};
  const out = {};
  const mv = v.move;
  if (mv && typeof mv === 'object' && typeof mv.headline === 'string' && fits(mv.headline, BUDGET.headline) && !generic(mv.headline) && (mv.support === undefined || (typeof mv.support === 'string' && fits(mv.support, BUDGET.support)))) out.move = { headline: clean(mv.headline), support: mv.support ? clean(mv.support) : null, goalLabel: typeof mv.goal_label === 'string' && fits(mv.goal_label, BUDGET.goalLabel) ? clean(mv.goal_label) : null, hypothesis: typeof mv.hypothesis === 'boolean' ? mv.hypothesis : null };
  const wy = v.why;
  if (wy && typeof wy === 'object') {
    const facts = Array.isArray(wy.facts) ? wy.facts.filter((f) => f && typeof f.label === 'string' && typeof f.text === 'string' && fits(f.label, BUDGET.factLabel) && fits(f.text, BUDGET.factText)).slice(0, 3).map((f) => ({ label: clean(f.label), text: clean(f.text), evidenceIds: arr(f.evidence_ids) })) : [];
    const card = typeof wy.card === 'string' && fits(wy.card, BUDGET.whyCard) ? clean(wy.card) : null;
    const mission = typeof wy.mission === 'string' && fits(wy.mission, BUDGET.mission) ? clean(wy.mission) : null;
    if (facts.length || card || mission) out.why = { facts, card, mission };
  }
  const sq = v.sequence;
  if (sq && typeof sq === 'object') {
    const one = (a) => (a && typeof a === 'object' && typeof a.task === 'string' && fits(a.task, BUDGET.task) && !generic(a.task) && (a.card === undefined || (typeof a.card === 'string' && fits(a.card, BUDGET.actionCard))) && (a.steps === undefined || (Array.isArray(a.steps) && a.steps.length <= 3)) ? { task: clean(a.task), steps: arr(a.steps).map(String), doneWhen: typeof a.done_when === 'string' ? clean(a.done_when) : null, card: a.card ? clean(a.card) : null } : null);
    const today = one(sq.today), week = one(sq.week);
    if (today || week) out.sequence = { today, week };
  }
  if (typeof v.start_sentence === 'string' && fits(v.start_sentence, BUDGET.startSentence) && !/£|\$|€|guarantee|will double|will triple|we will deliver|results in/i.test(v.start_sentence)) out.start = { sentence: clean(v.start_sentence) };
  return out;
}

/* the runtime writing instruction (brief section 9), the same text model.js puts in SHARED and app.js exposes as M.planInstruction */
const WRITING = `Lead with the single most useful next move for this user.
Use their actual goal, constraints, evidence and chosen direction.
Write an action headline, not a topic heading or motivational statement.
Give one short reason, then a concrete first task and the material to execute it.
Keep alternatives secondary. Do not generate an unranked menu of suggestions.
Distinguish a known fact, a proposed test target and an uncertain outcome.
When evidence is weak, give a precise discovery action and name the uncertainty.
Respect the screen's requested word budget. Return separate summary and detail
fields; never pack the full report into the visible summary.
Do not invent prices, results, sources, buyer access or existing capabilities.
Return the established structured plan schema, with valid evidence references.`;

M.plan = {
  build, ready, example, current, rebuild, actions, modelContext, withModel,
  evidence: resolveEvidence, assetText, STATE_LABEL, ASSET_TITLES,
  readOwner, readEngine, areaScores, OWNER_ACTIONS: OWNER_ACTIONS.map((t) => t.id), SAMPLE_OWNER, SAMPLE_STARTER,
  /* results round 1 */
  words, fits, shorten, generic, layerable, BUDGET, AREA_LIMB, ASSET_VERB, WRITING, MOVE_IDS: Object.keys(MOVES),
};
})();
