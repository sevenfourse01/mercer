/* Mercer 12, package (d) flow, rebuild 1: two routes, six sections, the next-question policy and readiness, the commit
   path with evidence and a revision, save schema 2, the ladder. One scene (the tree in #stage), one clearing (#clearing);
   the camera moves and this file decides where.
   The engine call surface is the v11 one: askOf, keyOf, E.forecast in runAndShow, E.measure in ensureMeasured,
   E.plan in ensurePlanned, flow.forward/backward with the ENGINE set and the 300 ms debounce.
   Everything shared sits on window.Mercer (M); late-loaded exports are read lazily (M.x?.()). */
(() => {
'use strict';
const E = window.MercerEngine;
// the size of run this file asks the engine for. What the page prints is never this constant: it is the count read back
// from the run itself (M.simCount, and the length of a month's draws)
const DRAWS = 4000;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
/* a pound figure prints as it is, to the pound: £66 is £66 (fix 3, item 3). Where a sentence says "about", near/down/up
   round it first, and they leave anything under £1,000 alone */
let curSym = '£';
const gbp = (n) => curSym + Math.round(n).toLocaleString('en-GB');
const stepOf = (v) => { const a = Math.abs(v); return a >= 10000 ? 1000 : a >= 1000 ? 100 : 1; };
const near = (v) => Math.round(v / stepOf(v)) * stepOf(v);
const down = (v) => Math.floor(v / stepOf(v)) * stepOf(v);
const up = (v) => Math.ceil(v / stepOf(v)) * stepOf(v);
/* a count below ten keeps one decimal when it has one ("1.3 more sales", never "0 more sales" for 0.4); whole from ten up */
const count = (n) => {
  const v = Number(n);
  if (Number.isFinite(v) && Math.abs(v) < 10) {
    const r = Math.round(v * 10) / 10;
    if (r !== Math.round(r)) return r.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return (Math.round(r) || 0).toLocaleString('en-GB');
  }
  return Math.round(n).toLocaleString('en-GB');
};
/** a count with its noun: "3 sales", "1 sale", "1.3 sales". The test is on what count() prints, so 0.96 reads "1 sale" */
const plural = (v, one, many) => { const c = count(v); return `${c} ${c === '1' ? one : many}`; };
/* headlines in title case at render (D6): every word capitalised but the small ones, and those too when first or last */
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
const capWord = (w) => w.replace(/^([^\p{L}\p{N}]*)(\p{L})/u, (m, pre, ch) => pre + ch.toUpperCase());
function titleCase(s) {
  const parts = String(s ?? '').split(/(\s+)/);
  const words = parts.map((w, i) => (/\S/.test(w) ? i : -1)).filter((i) => i >= 0);
  const first = words[0], last = words[words.length - 1];
  return parts.map((w, i) => {
    if (!/\S/.test(w)) return w;
    const bare = w.toLowerCase().replace(/[^\p{L}]/gu, '');
    if (i !== first && i !== last && SMALL_WORDS.has(bare)) return w.toLowerCase();
    // a hyphenated word takes a capital on each part that is not a small word ("Follow-Ups", "One-to-One")
    return w.split('-').map((h, j) => (j > 0 && SMALL_WORDS.has(h.toLowerCase()) ? h.toLowerCase() : capWord(h))).join('-');
  }).join('');
}
/** an ISO date as a UK reader writes it: "16 September 2026"; anything that is not an ISO date is returned as it came */
const ukDate = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return Number.isNaN(+d) ? String(iso ?? '') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const money = (v) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const monthName = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }); };
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const shortGbp = (v) => (v >= 1e6 ? `${curSym}${(v / 1e6).toFixed(1).replace(/\.0$/, '')}m` : v >= 1e4 ? `${curSym}${Math.round(v / 1000)}k` : v >= 1000 ? `${curSym}${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${curSym}${Math.round(v)}`);
const pct = (x) => `${Math.round(x * 100)}%`;
const oneDp = (x) => Number(x).toFixed(1).replace(/\.0$/, '');
const shareOf = (x) => `${Math.round((x ?? 0) * 100)}%`;
const given = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length);
const play = (name, o) => { try { M.feel?.play?.(name, o); } catch (e) { /* sound is optional */ } };
const panOf = (el) => { try { return M.feel?.panOf?.(el) ?? 0.5; } catch (e) { return 0.5; } };
const dispatch = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 0));

/* ============ icons (kept for the files that still read M.icon) ============ */
const PATHS = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/><circle cx="12" cy="12" r="2.6"/>',
  referral: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v5A2.5 2.5 0 0 1 14.5 14H10l-4 3.5V14a2 2 0 0 1-2-2z"/><path d="M19.5 9.5A2 2 0 0 1 21 11.5V16a2 2 0 0 1-2 2v2.5L16 18h-3"/>',
  'content-seo': '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8 10.5V16M8 7.6v.1M11.5 16v-3.2a2.3 2.3 0 0 1 4.6 0V16M11.5 10.5V16"/>',
  'paid-social': '<path d="M4 10v4h3l7 4V6L7 10H4z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
  'cold-email': '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  partnerships: '<circle cx="9" cy="12" r="4.5"/><circle cx="15" cy="12" r="4.5"/>',
  pricing: '<path d="M3.5 12.5V5A1.5 1.5 0 0 1 5 3.5h7.5l8 8-9 9z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  demand: '<path d="M3 12h11M10 7l5 5-5 5"/><path d="M20 4v16"/>',
  conversion: '<path d="M3.5 5h17l-6.5 7.5V19l-4 1.5v-8z"/>',
  capacity: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>',
  retention: '<path d="M17 7a7 7 0 1 0 2 5"/><path d="M19 3v4h-4"/>',
  margin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2 0 2.8 5 1.5 5 4.2 0 1.2-1.1 1.8-2.5 1.8-1.2 0-2.2-.6-2.6-1.5M12 6.5V8M12 16v1.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
  warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.1"/>',
  tree: '<path d="M12 21v-7"/><path d="M12 14c-4 0-6-2.5-6-5.5S8.7 3 12 3s6 2.5 6 5.5-2 5.5-6 5.5z"/>',
  person: '<circle cx="12" cy="6" r="3.4" fill="currentColor" stroke="none"/><path d="M6 21v-5.5a6 6 0 0 1 12 0V21z" fill="currentColor" stroke="none"/>',
};
const icon = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[id] ?? PATHS.info}</svg>`;

/* ============ what they have said: every key, declared once ============ */
const state = {
  stage: 'arrival', section: null,
  // the route (R1): 'owner' or 'starter', chosen on the homepage; null until then
  route: null,
  // orientation acknowledged (R14): a fresh journey cannot pass it; a saved session resumes past it
  orientAck: false,
  // site is the address the import step writes; imported is what research.js keeps of its finds (never the text they came from)
  biz: '', site: '', imported: [], niche: null, trade: '',
  // where they are, and what they count in (R22): GBP unless a place or the currency question says otherwise
  place: '', country: '', currency: 'GBP',
  // basis: 'revenue' works to state.goal (goalMode 'target'); 'budget' works from state.budget (goalMode 'max')
  sector: null, basis: 'revenue', goalMode: 'target', spendNow: null, priceMix: null,
  doing: [], tried: [], went: {}, note: '', runway: null, systems: [],
  priceSpread: null, included: '', repeatWork: null, enquiries: null, quotes: null,
  buyer: null, buyerNote: '', radius: null, season: null, competitors: '', chooseYou: [], chooseThem: [],
  spendSplit: null, responseTime: null, followUps: null, website: null, reviews: null,
  leadTime: null, breaksFirst: null, qualitySlip: [], subcontract: null,
  fixedCosts: null, costLines: null, terms: null, owed: null,
  teamSize: null, marketingOwner: null, hiring: null,
  bestWorst: null, agency: null, agencyFee: null, agencyWhy: '', dataOffer: [], wontDo: [], deadline: '',
  upsell: null, priceRaised: null, newVsRepeat: null, idealCustomer: '', tracking: null, contentTime: null,
  jobLength: null, holiday: null, ltvKnown: null, ltv: null, discounting: null, listSize: null, bestEver: '', successWords: '',
  yearsTrading: null, estMonth: null, retainerValue: null, retainerMin: null, retainerMax: null, retainerMonths: null, retainerRenew: null, returnGap: null,
  derived: {},
  cycle: null, hours: null, strengths: [], avoids: [], win: null, help: null, risk: null,
  now: null, goal: null, months: null, appetite: 'moderate',
  lastFive: null, topShare: null, network: null, funding: [], stackNames: {},
  personality: null, personalityAxes: [null, null, null, null], cv: '', stack: {}, stackAsked: false,
  // the founder module (R17): self-reported, and printed as such
  energy: null, avoided: [], delegation: null, decisionSpeed: null, futureRole: null,
  // the control module (R18): who owns, who decides, and what is meant to change
  ownership: null, ownShare: null, profitShare: null, decisionRights: null, influence: null, keyPeople: null, plannedChanges: [], retain: [], exitIntent: null, unresolved: '',
  // the owner bank's new questions (rebuild 1, R3). `stage` (E03) writes bizStage and `asked` (E46) writes askedHelp:
  // the ids keep the brief's names, the keys stay clear of the walk's own `stage` and `asked`
  protected: [], bizStage: null, payModel: null, volume: null, volumePeriod: null,
  segment: null, trigger: null, decider: null, access: null, returned: null, deliveryMode: null,
  canDeliverMore: null, worry: null, holdup: null, changeHours: null, networkStrength: null, askedHelp: null,
  // the starter route (R4, R18): the direction chosen from the cards, by id
  direction: null,
  channel: null, offLimits: null, price: null, closeRate: null, who: null, capacity: null, servedNow: null, budget: null, margin: null, market: null, repeat: null, retention: null,
  skipped: new Set(),
  notSure: new Set(),
  na: new Set(),
  asked: [],
  prior: {},
};
/* every key as it stood before anything was said: what Not sure puts back when an answer is withdrawn */
const BLANK = Object.fromEntries(Object.entries(state).filter(([, v]) => !(v instanceof Set)).map(([k, v]) => [k, JSON.stringify(v)]));
const blankOf = (k) => (k in BLANK ? JSON.parse(BLANK[k]) : null);
/* the keys that are the walk's own, never an answer: left out of the answers a save holds and an export shows */
const WALK_KEYS = new Set(['stage', 'section', 'orientAck', 'asked', 'prior', 'derived', 'skipped', 'notSure', 'na']);
const M = Object.assign((window.Mercer = window.Mercer ?? {}), { E, DRAWS, reduce, $, $$, NS, gbp, near, count, plural, titleCase, ukDate, money, wait, frame, clamp, monthName, svgEl, esc, icon, shortGbp, state, result: null, measured: null, planned: null, actuals: [], monthShown: null });
Object.defineProperty(M, 'route', { get: () => state.route, configurable: true });

/* ============ currency and place (R22) ============
   Every figure the page prints goes through gbp(), which leads with the symbol of state.currency. The engine's priors,
   the macro rows and the map are UK figures in pounds: outside GB the plan runs on the visitor's own figures and the
   benchmarks are labelled as UK figures or left out (M.ukBenchmarks) */
const CURRENCIES = [['GBP', '£', 'Pound sterling'], ['EUR', '€', 'Euro'], ['USD', '$', 'US dollar'], ['AUD', 'A$', 'Australian dollar'], ['CAD', 'C$', 'Canadian dollar'], ['NZD', 'NZ$', 'New Zealand dollar'], ['CHF', 'CHF ', 'Swiss franc'], ['SEK', 'kr ', 'Swedish krona'], ['NOK', 'kr ', 'Norwegian krone'], ['DKK', 'kr ', 'Danish krone'], ['ZAR', 'R', 'South African rand'], ['INR', '₹', 'Indian rupee'], ['AED', 'AED ', 'UAE dirham'], ['SGD', 'S$', 'Singapore dollar'], ['HKD', 'HK$', 'Hong Kong dollar'], ['JPY', '¥', 'Japanese yen']];
const CURRENCY_BY = Object.fromEntries(CURRENCIES.map(([code, symbol, name]) => [code, { code, symbol, name }]));
M.CURRENCIES = CURRENCIES.map(([code, symbol, name]) => ({ code, symbol, name }));
const GB_WORDS = /\b(uk|u\.k\.|united kingdom|britain|great britain|england|scotland|wales|northern ireland|gb)\b/i;
/* a country named in the place, and the currency it suggests; the visitor can change either */
const COUNTRY_WORDS = [
  [/\b(ireland|éire|eire|dublin|cork|galway)\b/i, 'IE', 'EUR'], [/\b(france|paris|germany|berlin|spain|madrid|italy|rome|netherlands|amsterdam|belgium|brussels|austria|vienna|portugal|lisbon|finland|helsinki|greece|athens)\b/i, 'EU', 'EUR'],
  [/\b(usa|u\.s\.a?\.?|united states|america|new york|california|texas|florida|chicago)\b/i, 'US', 'USD'], [/\b(canada|toronto|vancouver|montreal)\b/i, 'CA', 'CAD'],
  [/\b(australia|sydney|melbourne|brisbane|perth)\b/i, 'AU', 'AUD'], [/\b(new zealand|auckland|wellington)\b/i, 'NZ', 'NZD'], [/\b(switzerland|zurich|geneva)\b/i, 'CH', 'CHF'],
  [/\b(sweden|stockholm)\b/i, 'SE', 'SEK'], [/\b(norway|oslo)\b/i, 'NO', 'NOK'], [/\b(denmark|copenhagen)\b/i, 'DK', 'DKK'], [/\b(south africa|johannesburg|cape town)\b/i, 'ZA', 'ZAR'],
  [/\b(india|mumbai|delhi|bangalore|bengaluru)\b/i, 'IN', 'INR'], [/\b(dubai|abu dhabi|uae|emirates)\b/i, 'AE', 'AED'], [/\b(singapore)\b/i, 'SG', 'SGD'], [/\b(hong kong)\b/i, 'HK', 'HKD'], [/\b(japan|tokyo|osaka)\b/i, 'JP', 'JPY'],
];
/** what a place says about the country and the currency: { country, currency } or null when it says nothing */
function suggestPlace(text) {
  const s = String(text ?? '');
  if (!s.trim()) return null;
  if (GB_WORDS.test(s)) return { country: 'GB', currency: 'GBP' };
  const hit = COUNTRY_WORDS.find(([re]) => re.test(s));
  if (hit) return { country: hit[1], currency: hit[2] };
  // a UK town the map knows is a UK town
  try { if (typeof M.locate === 'function' && M.locate(s)) return { country: 'GB', currency: 'GBP' }; } catch (e) { /* no map */ }
  return null;
}
const currencyCode = (v) => { const c = String(v ?? '').trim().toUpperCase(); return /^[A-Z]{3}$/.test(c) ? c : null; };
function setCurrency(code) {
  const c = currencyCode(code) ?? 'GBP';
  state.currency = c;
  curSym = CURRENCY_BY[c]?.symbol ?? `${c} `;
  return c;
}
M.setCurrency = setCurrency;
M.currencySymbol = () => curSym;
M.suggestPlace = suggestPlace;
/** whether the UK benchmarks (engine priors, macro rows, the map) apply: GB, or no country given yet */
const ukBenchmarks = () => !state.country || state.country === 'GB' || state.country === 'UK';
M.ukBenchmarks = ukBenchmarks;

const askOf = (over = {}) => {
  const s = { ...state, ...over };
  const v = (x) => (x === null || x === '' ? undefined : x);
  // no growth: the basis is budget and the budget is nothing. The engine reads 0 as unstated, so a penny goes instead,
  // and it still shows as £0 wherever the page prints it
  const none = s.appetite === 'none' && over.budget === undefined;
  const raw = none ? 0 : s.budget;
  const budget = raw === 0 ? 0.01 : v(raw);
  return { niche: v(s.niche), trade: v(s.trade), now: v(s.now), goal: v(s.goal), months: s.months ?? 12, price: v(s.price), channel: v(s.channel), offLimits: v(s.offLimits) === 'none' ? undefined : v(s.offLimits), closeRate: v(s.closeRate), cycle: v(s.cycle), capacity: v(s.capacity), who: v(s.who), servedNow: v(s.servedNow), budget, margin: v(s.margin), market: v(s.market), repeat: v(s.repeat), retention: v(s.retention) };
};
const keyOf = (over) => JSON.stringify(askOf(over));
M.askOf = askOf;
M.keyOf = keyOf;

/* ============ the simulations, counted (R19) ============
   Every forecast this file makes goes through forecastFor(), which adds the run and its draws to the tally of the result
   it was made for: the headline run, each rung of the ladder, each bisection, each appetite level. The draws are counted
   from what the engine handed back (the length of a month's draws), never from the constant asked for. E.plan and
   E.measure run the engine's own smaller passes inside engine.js; they are counted as calls, and their draws are not
   claimed */
const simTally = new Map();
const tallyOf = (key) => { let t = simTally.get(key); if (!t) { t = { runs: 0, total: 0, plans: 0, measures: 0 }; simTally.set(key, t); } return t; };
const drawsOf = (r) => r?.months?.[0]?.length ?? (Number.isFinite(r?.draws) ? r.draws : 0);
function forecastFor(key, over) {
  const r = E.forecast({ ...askOf(over), draws: DRAWS });
  const t = tallyOf(key);
  t.runs += 1;
  t.total += drawsOf(r);
  return r;
}
/** the counts behind the result on screen: { headline, total, runs } and, beside them, how often the plan and the
    measure were made. `headline` is the draws in the run the figures are read from */
M.simCount = () => {
  const key = M.resultKey ?? keyOf();
  const t = simTally.get(key) ?? { runs: 0, total: 0, plans: 0, measures: 0 };
  return { headline: drawsOf(M.result), total: t.total, runs: t.runs, plans: t.plans, measures: t.measures, key };
};

/* ============ the industries the engine knows ============ */
const INDUSTRY = (M.SECTORS ?? []).map((x) => ({ id: x.id, name: x.name, place: x.place, kinds: x.kinds }));
M.INDUSTRY = INDUSTRY;

/* ============ the routes and the six sections (R1, R2) ============
   Two routes share one walk: six sections with stable ids, named for the route. The tree part each section grows is
   the brief's: aim the crown and its goal marker, foundations the roots and trunk, customers the customers group
   (demand, conversion and retention limbs), delivery the offer and delivery limbs, leverage the trunk's upper third,
   plan the crown. A section with nothing that applies is marked Not needed, with its reason */
const ROUTE_IDS = ['owner', 'starter'];
const SECTION_DEFS = [
  { id: 'aim', name: { owner: 'Aim', starter: 'Your direction' }, purpose: { owner: 'what to achieve next, against where you stand', starter: 'what you want, then the directions that fit' }, hue: '--sec-crown', part: 'crown', key: 'C' },
  { id: 'foundations', name: { owner: 'Business', starter: 'Starting point' }, purpose: { owner: 'what the business is and what it does today', starter: 'where you are now, and where you are' }, hue: '--sec-ground', part: 'roots', key: 'D' },
  { id: 'customers', name: { owner: 'Customers', starter: 'Make it practical' }, purpose: { owner: 'who buys, and why', starter: 'the offer, the buyer and the first test' }, hue: '--sec-reach', part: 'demand', key: 'G' },
  { id: 'delivery', name: { owner: 'Delivery', starter: 'What you can build from' }, purpose: { owner: 'economics, workload and constraints', starter: 'time, money, tools and the people you know' }, hue: '--sec-delivery', part: 'capacity', key: 'E' },
  { id: 'leverage', name: { owner: 'Leverage', starter: 'What draws you in' }, purpose: { owner: 'team, network, systems and control', starter: 'interests, experience and what you are good at' }, hue: '--sec-you', part: 'control', key: 'A' },
  { id: 'plan', name: { owner: 'Plan', starter: 'Your plan' }, purpose: { owner: 'decide and act', starter: 'validate and begin' }, hue: '--sec-crown', part: 'crown', key: 'C' },
];
/* the order the six are walked in, per route (final pack, Tasks 10 and 15). The owner establishes the business before its
   ambition is interpreted; the starter is ordered around the person. The ids are unchanged, so a saved session, the tree
   parts and every reader that asks by id keep their meaning: only the order and the names on screen move (Task 24) */
const SECTION_ORDER = {
  owner: ['foundations', 'aim', 'customers', 'delivery', 'leverage', 'plan'],
  starter: ['foundations', 'leverage', 'delivery', 'aim', 'customers', 'plan'],
};
const NOT_NEEDED_WHY = {
  customers: { owner: 'No customer question applies to what you have said.', starter: 'Nothing left to settle about the offer.' },
  delivery: { owner: 'Nothing about delivery changes the plan for what you have said.', starter: 'Nothing here changes the plan for what you have said.' },
  leverage: { owner: 'Nothing here changes the plan for what you have said.', starter: 'Nothing here changes the plan for what you have said.' },
};
const routeOf = () => (ROUTE_IDS.includes(state.route) ? state.route : 'owner');
/** the six sections of one route, in that route's order: { id, name, hue, part, purpose, key } */
function sectionsFor(route = routeOf()) {
  const r = ROUTE_IDS.includes(route) ? route : 'owner';
  const by = Object.fromEntries(SECTION_DEFS.map((d) => [d.id, d]));
  return SECTION_ORDER[r].map((id) => by[id]).filter(Boolean)
    .map((d) => ({ id: d.id, name: d.name[r], hue: d.hue, part: d.part, purpose: d.purpose[r], key: d.key }));
}
M.sectionsFor = sectionsFor;
/* the owner list stands as M.SECTIONS for the readers that predate the routes; SECTION_BY follows the route on screen */
const SECTIONS = sectionsFor('owner');
const SECTION_BY = {};
/* the id-to-stage index built from ORDER below, rebuilt whenever the route changes */
let sectionIndex = null;
/* the sections that ask questions, in the route's order; the plan section holds the readiness screen and the results.
   Both are filled by applyRoute() and mutated in place, so every reader that closed over them follows the route */
const INTERVIEW = [];
const WALK = [];
function applyRoute() {
  const secs = sectionsFor(routeOf());
  Object.keys(SECTION_BY).forEach((k) => delete SECTION_BY[k]);
  secs.forEach((s) => { SECTION_BY[s.id] = s; });
  WALK.length = 0; INTERVIEW.length = 0;
  secs.forEach((s) => { WALK.push(s.id); if (s.id !== 'plan') INTERVIEW.push(s.id); });
  sectionIndex = null;
}
applyRoute();
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];
/* ---------- the order (R3, R4) ----------
   The owner order is the brief's, by the ids the interview owner writes. The starter bank is N01 to N44 as n01 to n44
   (foundations n01 to n18, opportunities n19 to n30, test n31 to n40, launch n41 to n44) unless the registry names them
   otherwise; the registry's own order stands where it has one. An id the table does not know keeps its place after the
   id it followed */
const nIds = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => `n${String(a + i).padStart(2, '0')}`);
/* The table is the authority on which stage a question is asked in (Tasks 10, 15 and 24): an id keeps its id and its
   meaning where it moves, and the registry's own `section` is read only for an id the table does not name. */
const ORDER = {
  owner: {
    // Business: the name and the site, then where and in what currency, then what it sells, its stage and its scale
    foundations: ['biz', 'import', 'place', 'currency', 'sector', 'repeatWork', 'payModel', 'stage', 'yearsTrading', 'now', 'season', 'bestWorst', 'price', 'retainer', 'margin', 'volume', 'priceSpread', 'included', 'upsell', 'priceRaised', 'fixedCosts', 'discounting', 'runway'],
    // Aim: what to achieve next, the target against the baseline, the horizon, then what is protected
    aim: ['win', 'goal', 'months', 'protected'],
    customers: ['buyer', 'lastFive', 'segment', 'trigger', 'decider', 'channel', 'went', 'market', 'access', 'enquiries', 'closeRate', 'chooseThem', 'repeat', 'retention', 'stay', 'deliveryMode', 'radius', 'reviews'],
    // capacity comes from what is already done, not from a guess about three months' time (Task 18); money and time are apart
    delivery: ['capacity', 'breaksFirst', 'hours', 'worry', 'holdup', 'software', 'budget', 'changeHours', 'terms', 'wontDo'],
    leverage: ['strengths', 'energy', 'help', 'delegation', 'network', 'networkStrength', 'asked', 'decisionRights', 'plannedChanges', 'personality'],
    plan: [],
  },
  starter: {
    // 1 Starting point: what they do now, where they are, what they count in, an idea if they have one
    foundations: ['n01', 'place', 'currency', 'n25', 'n26'],
    // 2 What draws you in: experience, interests and demonstrated skills
    leverage: ['n09', 'n10', 'n11', 'n12', 'n15', 'n13', 'n14'],
    // 3 What you can build from: time, money, tools, the people they know, the buyers they understand
    delivery: ['n03', 'n04', 'n18', 'n05', 'n06', 'n16', 'n17', 'n19', 'n20', 'n21', 'n22', 'n23', 'n24'],
    // 4 Your direction: the outcome they want, the horizon, what is protected, then the directions compared and chosen
    aim: ['win', 'goal', 'months', 'n07', 'protected', 'n27', 'n28', 'n29', 'n30'],
    // 5 Make it practical: the offer, the buyer, the test and what it takes. Never asked before a direction is chosen
    customers: ['n31', 'n32', 'n38', 'n33', 'n34', 'n35', 'n36', 'n37', 'n39', 'n40', 'n41', 'n42'],
    plan: ['n44'],
  },
};
/* every id the table names, to the stage it is asked in, for the route on screen */
function tableIndex() {
  if (sectionIndex) return sectionIndex;
  const table = ORDER[routeOf()];
  sectionIndex = {};
  Object.keys(table).forEach((sec) => table[sec].forEach((id) => { if (!(id in sectionIndex)) sectionIndex[id] = sec; }));
  return sectionIndex;
}
const tableSection = (id) => tableIndex()[ORDER_ALIAS[id] ?? id] ?? null;
/* the first pass (R5): the questions asked before the first plan is offered. Everything else waits for
   "Refine the uncertain parts". The registry's own `priority` ('first' | 'refine') or `optional` wins where it says */
const FIRST = {
  owner: new Set(['win', 'goal', 'months', 'protected', 'sector', 'repeatWork', 'stage', 'now', 'price', 'retainer', 'import', 'place', 'buyer', 'segment', 'channel', 'enquiries', 'deliveryMode', 'capacity', 'budget', 'help', 'network']),
  starter: new Set(['win', 'goal', 'months', 'protected', 'n01', 'n03', 'n05', 'n10', 'n14', 'n16', 'n19', 'n21', 'n25', 'n27', 'n32', 'n34', 'n35']),
};
/* the sections the old registry files questions under, read as the six (a schema entry that predates the rebuild) */
const OLD_SECTION = { roots: 'foundations', offer: 'foundations', reach: 'customers', routes: 'customers', close: 'customers', delivery: 'delivery', money: 'delivery', clients: 'customers', you: 'leverage', control: 'leverage', ground: 'leverage', crown: 'plan' };
/* an id the old files carry under a section the brief moves it out of */
const MOVED = { goal: 'aim', months: 'aim', win: 'aim', place: 'aim', margin: 'foundations', wontDo: 'delivery', network: 'leverage', budget: 'delivery', spend: 'delivery' };
/* `site` was the import step's id before refine 1: a list that still names it is read as `import` would be */
const ORDER_ALIAS = { site: 'import' };
/** the registry (questions.js, R5), for the route on screen: entries whose `route` names it, or names nothing */
function registryFor(route = routeOf()) {
  const reg = Array.isArray(M.registry) ? M.registry : Array.isArray(M.SCHEMA) && M.SCHEMA.some((e) => e && e.route) ? M.SCHEMA : null;
  if (!Array.isArray(reg)) return [];
  return reg.filter((e) => e && typeof e.id === 'string' && (!e.route || e.route === route || (Array.isArray(e.route) && e.route.includes(route))));
}
const registryEntry = (id) => registryFor().find((e) => e.id === id) ?? null;
M.registryEntry = registryEntry;
/** the six-section id an entry belongs to: the route's own table first (Tasks 10, 15), then the entry's own section,
    the moved table, or the old section read as one of the six */
function sectionOfEntry(e) {
  const t = tableSection(e?.id);
  if (t && SECTION_BY[t]) return t;
  const s = e?.section;
  if (s && SECTION_BY[s]) return s;
  if (MOVED[e?.id]) return MOVED[e.id];
  return OLD_SECTION[s] ?? null;
}
/** whether an id is a question anyone can render: the registry, the schema or the custom table knows it */
const exists = (id) => id === 'readiness' || Boolean(registryEntry(id) || M.SCHEMA_BY?.[id] || M.Q?.[id]);
M.exists = exists;
/** a list of ids put in the table's order for the route. An id the table does not know keeps its place after the id it followed */
function inOrder(sectionId, ids) {
  const order = ORDER[routeOf()][sectionId] ?? [];
  const rank = (id) => order.indexOf(ORDER_ALIAS[id] ?? id);
  let last = -1;
  return ids.map((id, i) => { const r = rank(id); if (r >= 0) last = r; return { id, r: r >= 0 ? r : last + 0.5, i }; })
    .sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.id);
}
/* ---------- one active question (D4, Task 08) ----------
   A registry entry with `on:` used to be drawn inside the screen it names, which put two questions in front of the
   visitor at once. A rider is now a question of its own, asked straight after the answer that reveals it. The one
   exception is the entry the registry marks `context: true`: a confirmed value shown beside the active question is not
   a question, so it stays off the queue. */
const isContextValue = (e) => Boolean(e && (e.context === true || e.display === 'context'));
M.isContextValue = (id) => isContextValue(registryEntry(id));
/** whether an entry earns a screen of its own: a rider does, a hidden entry that rides on nothing does not */
const asksOwnScreen = (e) => Boolean(e) && !isContextValue(e) && (!e.hidden || Boolean(e.on));
/** each rider moved to sit directly behind the answer that reveals it, so no screen holds two questions */
function withRiders(ids) {
  const host = {};
  ids.forEach((id) => { const on = registryEntry(id)?.on; if (on && ids.includes(on)) host[id] = on; });
  const riders = {};
  ids.forEach((id) => { const h = host[id]; if (h) (riders[h] = riders[h] ?? []).push(id); });
  const out = [];
  const place = (id) => { if (out.includes(id)) return; out.push(id); (riders[id] ?? []).forEach(place); };
  ids.forEach((id) => { if (!host[id]) place(id); });
  // a rider whose host is not in this section keeps the place the order gave it
  ids.forEach((id) => { if (!out.includes(id)) out.push(id); });
  return out;
}
/** the questions of one section, in order: the registry's when it has landed, else the table's ids the old files know */
function sectionQuestions(sectionId) {
  const reg = registryFor();
  if (reg.length) {
    const ids = reg.filter((e) => sectionOfEntry(e) === sectionId && asksOwnScreen(e)).map((e) => e.id);
    return withRiders(inOrder(sectionId, [...new Set(ids)]));
  }
  const table = ORDER[routeOf()][sectionId] ?? [];
  const known = table.filter((id) => exists(id));
  // the old questions.js keeps 'site' as an alias of the import step: one of them only
  return inOrder(sectionId, known.filter((id) => !(id === 'site' && known.includes('import'))));
}
/** the section an id is asked in: the table's word first, then the registry's or the schema's, read as the six */
const sectionOf = (id) => {
  if (!id) return null;
  const table = ORDER[routeOf()];
  const hit = Object.keys(table).find((k) => table[k].includes(ORDER_ALIAS[id] ?? id));
  if (hit) return hit;
  const e = registryEntry(id);
  if (e) return sectionOfEntry(e);
  const q = M.SCHEMA_BY?.[id] ?? M.Q?.[id];
  if (q) return MOVED[id] ?? (SECTION_BY[q.section] ? q.section : OLD_SECTION[q.section] ?? null);
  return null;
};
M.SECTIONS = SECTIONS;
M.SECTION_BY = SECTION_BY;
M.sectionOf = sectionOf;
M.INTERVIEW = INTERVIEW;
/* the six sections as stages, for the readers that paint a six-arc ring from M.STAGES (intro.js's demonstration) */
Object.defineProperty(M, 'STAGES', { get: () => sectionsFor(routeOf()), configurable: true });

/* ============ every way a customer can hear about you: the four shelves ============
   Warm 1-1 and warm 1-many run on people who already know you; cold 1-1 and cold 1-many on people who do not.
   The order inside each shelf is an estimate of how many people know or use each method, most first.
   Mercer forecasts eight of these (the engine channel on each); the rest are recorded for the call. */
const ROUTES = [
  // warm, one to one
  ['referrals', 'Referrals', 'referral', 'warm11'],
  ['reactivation', 'Past customers, asked again', 'referral', 'warm11'],
  ['network', 'Existing networks', 'referral', 'warm11'],
  ['suppliers', 'Suppliers and trade contacts', 'partnerships', 'warm11'],
  ['resellers', 'Resellers and partners', 'partnerships', 'warm11'],
  ['introducers', 'Introducers you pay per lead', 'partnerships', 'warm11'],
  ['piggyback', 'Piggybacking on another business', 'partnerships', 'warm11'],
  ['affiliate', 'An affiliate or commission scheme', 'partnerships', 'warm11'],
  ['customer-referral', 'A referral scheme for customers', 'referral', 'warm11'],
  ['white-label', 'White label or OEM', 'partnerships', 'warm11'],
  // warm, one to many
  ['internal-social', 'Your team’s own accounts', 'content-seo', 'warm1m'],
  ['newsletter', 'A newsletter of your own', 'content-seo', 'warm1m'],
  ['events', 'Networking events', 'partnerships', 'warm1m'],
  ['chambers', 'Chambers, BNI and trade bodies', 'partnerships', 'warm1m'],
  ['workshops', 'Workshops and talks you run', null, 'warm1m'],
  ['host-meetup', 'A meetup you host', null, 'warm1m'],
  ['case-studies', 'Case studies and results', 'content-seo', 'warm1m'],
  ['webinar', 'Webinars', null, 'warm1m'],
  ['podcast', 'A podcast of your own', null, 'warm1m'],
  ['own-community', 'A community you run', null, 'warm1m'],
  ['speaking', 'Speaking slots', null, 'warm1m'],
  ['awards', 'Awards', null, 'warm1m'],
  ['sponsor-local', 'Sponsoring a local team or event', null, 'warm1m'],
  // cold, one to one
  ['cold-email', 'Cold email', 'cold-email', 'cold11'],
  ['dm-linkedin', 'LinkedIn DMs', 'linkedin', 'cold11'],
  ['cold-call', 'Cold calling', 'cold-calling', 'cold11'],
  ['dm-instagram', 'Instagram DMs', null, 'cold11'],
  ['dm-facebook', 'Facebook DMs', null, 'cold11'],
  ['whatsapp', 'WhatsApp or SMS', null, 'cold11'],
  ['canvassing', 'Knocking on doors', null, 'cold11'],
  ['direct-mail', 'Direct mail', null, 'cold11'],
  ['handwritten', 'Handwritten letters', 'cold-email', 'cold11'],
  ['dm-tiktok', 'TikTok DMs', null, 'cold11'],
  ['sampling', 'Free samples or trials', null, 'cold11'],
  // cold, one to many
  ['org-facebook', 'Facebook posts', 'content-seo', 'cold1m'],
  ['org-instagram', 'Instagram', 'content-seo', 'cold1m'],
  ['ads-facebook', 'Facebook ads', 'paid-social', 'cold1m'],
  ['ads-search', 'Google ads', 'paid-search', 'cold1m'],
  ['seo', 'SEO', 'content-seo', 'cold1m'],
  ['maps', 'Google Maps', 'content-seo', 'cold1m'],
  ['org-linkedin', 'LinkedIn posts', 'content-seo', 'cold1m'],
  ['org-youtube', 'YouTube', 'content-seo', 'cold1m'],
  ['org-tiktok', 'TikTok', 'content-seo', 'cold1m'],
  ['reviews', 'Review sites', 'content-seo', 'cold1m'],
  ['directories', 'Directories and trade listings', 'content-seo', 'cold1m'],
  ['flyers', 'Flyers and billboards', null, 'cold1m'],
  ['ads-instagram', 'Instagram ads', 'paid-social', 'cold1m'],
  ['local-media', 'Print, radio or local media', null, 'cold1m'],
  ['retargeting', 'Retargeting', 'paid-social', 'cold1m'],
  ['ads-linkedin', 'LinkedIn ads', 'paid-social', 'cold1m'],
  ['ads-youtube', 'YouTube ads', 'paid-social', 'cold1m'],
  ['ads-tiktok', 'TikTok ads', 'paid-social', 'cold1m'],
  ['creators', 'Creators and influencers', null, 'cold1m'],
  ['spon-newsletter', 'Newsletter sponsorships', null, 'cold1m'],
  ['spon-podcast', 'Podcast sponsorships', null, 'cold1m'],
  ['trade-shows', 'Trade shows', 'partnerships', 'cold1m'],
  ['conferences', 'Conferences', 'partnerships', 'cold1m'],
  ['marketplaces', 'Marketplaces (Amazon, Etsy, eBay)', null, 'cold1m'],
  ['comparison', 'Comparison sites', null, 'cold1m'],
  ['pr', 'PR and press', null, 'cold1m'],
  ['app-stores', 'App stores', null, 'cold1m'],
  ['free-tool', 'A free tool or calculator', 'content-seo', 'cold1m'],
  ['free-tier', 'A free tier or trial', null, 'cold1m'],
  ['geo', 'Being cited by AI answers', null, 'cold1m'],
  ['books', 'A book or a course', null, 'cold1m'],
  ['studies', 'Academic studies', null, 'cold1m'],
  ['org-x', 'X', 'content-seo', 'cold1m'],
  ['ads-bing', 'Bing ads', 'paid-search', 'cold1m'],
  ['ads-nextdoor', 'Nextdoor ads', null, 'cold1m'],
  ['org-nextdoor', 'Nextdoor', null, 'cold1m'],
  ['com-facebook', 'Facebook groups', null, 'cold1m'],
  ['com-linkedin', 'LinkedIn groups', null, 'cold1m'],
  ['com-reddit', 'Reddit', null, 'cold1m'],
  ['com-instagram', 'Instagram communities', null, 'cold1m'],
  ['com-discord', 'Discord', null, 'cold1m'],
  ['com-x', 'X communities', null, 'cold1m'],
  ['com-slack', 'Slack communities', null, 'cold1m'],
  ['com-skool', 'Skool', null, 'cold1m'],
  ['com-whop', 'Whop', null, 'cold1m'],
  ['com-mumsnet', 'Mumsnet', null, 'cold1m'],
  ['franchise', 'Franchising or licensing', null, 'cold1m'],
  ['investors', 'Investor access', null, 'cold1m'],
];
const BIN_NAME = { warm11: 'Warm, one to one', warm1m: 'Warm, one to many', cold11: 'Cold, one to one', cold1m: 'Cold, one to many', unknown: 'Can’t say' };
const DIST_ALL = ROUTES.map(([id, name, engine, bin]) => ({ id, name, engine, bin, group: BIN_NAME[bin] }));
const DIST_BY = Object.fromEntries(DIST_ALL.map((d) => [d.id, d]));
const QUADRANT = { warm11: [], warm1m: [], cold11: [], cold1m: [] };
DIST_ALL.forEach((d) => QUADRANT[d.bin].push(d.id));
const BIN_ENGINE = { warm11: ['referral', 'partnerships'], warm1m: ['partnerships', 'content-seo'], cold11: ['cold-email', 'linkedin', 'cold-calling'], cold1m: ['paid-search', 'paid-social', 'content-seo'] };
M.DIST_ALL = DIST_ALL;
M.DIST_BY = DIST_BY;
M.QUADRANT = QUADRANT;
M.BIN_ENGINE = BIN_ENGINE;
M.BIN_NAME = BIN_NAME;
/** the engine channel a set of answers points at: what they already do, strongest first */
const ENGINE_ORDER = ['referral', 'content-seo', 'linkedin', 'cold-email', 'paid-search', 'paid-social', 'partnerships', 'cold-calling'];
M.primaryChannel = () => {
  const ids = (state.doing ?? []).map((id) => DIST_BY[id]?.engine).filter(Boolean);
  return ENGINE_ORDER.find((c) => ids.includes(c)) ?? null;
};
/* the forecast's eight routes, named as the pills the visitor pressed name them (C23): "Content" covers every content-seo pill */
const CHANNEL_NAME = { referral: 'Referrals', 'content-seo': 'Content', linkedin: 'LinkedIn', 'paid-social': 'Social ads', 'cold-email': 'Cold email', partnerships: 'Partners', 'paid-search': 'Search ads', 'cold-calling': 'Cold calling' };
M.CHANNEL_NAME = CHANNEL_NAME;
const MODEL_NAMES = { M1: 'Enquiries to sales', M2: 'Delivery capacity', M3: 'Prospects', M4: 'Businesses like yours', M5: 'Spend over time' };
M.MODEL_NAMES = MODEL_NAMES;
/** the share of the plan's spend that goes to the warm engine channels */
function warmShare(allocation) {
  let warm = 0, all = 0;
  (allocation ?? []).forEach((mo) => (mo.byChannel ?? []).forEach((c) => {
    const s = Number(c.spend) || 0;
    all += s;
    if (c.channel === 'referral' || c.channel === 'partnerships') warm += s;
  }));
  return all > 0 ? warm / all : 0;
}
M.warmShare = warmShare;

/* the drivers: four grow revenue and are branches; margin and retention decide what is kept */
const DRIVERS = [
  { id: 'pricing', name: 'Pricing', kind: 'branch', inputs: ['acv'], of: 'the price of a sale', q: 'price' },
  { id: 'demand', name: 'Demand', kind: 'branch', inputs: ['budget', 'addressableCount'], of: 'your growth spend', q: 'budget', binds: ['market_depletion', 'channel_cap'] },
  { id: 'conversion', name: 'Conversion', kind: 'branch', inputs: ['statedCloseRate'], of: 'your close rate', q: 'closeRate' },
  { id: 'capacity', name: 'Capacity', kind: 'branch', inputs: ['serviceRatePerServerPerMonth'], of: 'your capacity', q: 'capacity', binds: ['client_capacity'] },
  { id: 'margin', name: 'Margin', kind: 'fruit', q: 'margin' },
  { id: 'retention', name: 'Retention', kind: 'fruit', q: 'retention' },
];
M.DRIVERS = DRIVERS;
function driverStates(entries, binding) {
  const list = entries ?? [];
  const revenue = list.filter((x) => DRIVERS.some((d) => d.kind === 'branch' && d.inputs.includes(x.inputId)));
  const maxE = Math.max(0.05, ...revenue.map((x) => Math.abs(x.elasticity)));
  return DRIVERS.map((dr) => {
    if (dr.kind === 'fruit') {
      const known = dr.id === 'margin' ? (M.result?.bank?.margin?.value ?? M.planned?.margin ?? null) : state.repeat;
      return { id: dr.id, state: known === null || known === undefined ? 'waiting' : 'fruit', weight: known ?? 0, e: 0 };
    }
    const es = list.filter((x) => dr.inputs.includes(x.inputId));
    if (!es.length) return { id: dr.id, state: 'waiting', weight: 0.1, e: 0 };
    const e = es.reduce((m, x) => (Math.abs(x.elasticity) > Math.abs(m) ? x.elasticity : m), 0);
    if (dr.binds && binding && dr.binds.includes(binding)) return { id: dr.id, state: 'binds', weight: Math.max(0.35, Math.abs(e) / maxE), e };
    if (Math.abs(e) < 0.01) return { id: dr.id, state: 'pruned', weight: 0, e };
    return { id: dr.id, state: 'grows', weight: Math.abs(e) / maxE, e };
  });
}
M.driverStates = driverStates;
const STATE_WORD = { waiting: 'Not asked yet', grows: 'Grows revenue', binds: 'Limits growth first', pruned: 'Cut: no effect', fruit: 'Fruit' };
M.STATE_WORD = STATE_WORD;
function reasonFor(dr, st, limit) {
  if (dr.id === 'margin') {
    const m = M.result?.bank?.margin ?? (M.planned ? { value: M.planned.margin, from: state.margin !== null ? 'you' : 'sector' } : null);
    if (!m) return 'Margin: not known yet.';
    return `Margin: you keep ${Math.round(m.value * 100)}p of each £1 (${m.from === 'you' ? 'your figure' : 'typical for your industry'}). It leaves revenue unchanged.`;
  }
  if (dr.id === 'retention') {
    if (state.repeat === null) return 'Retention: not asked yet.';
    const worth = 1 / (1 - Math.min(0.95, state.repeat));
    return `Retention: ${tenths(state.repeat)} in 10 customers buy again, so each new customer is worth about ${pluralDp(worth, 'sale', 'sales')}.`;
  }
  if (st.state === 'waiting') return `${dr.name}: not measured yet.`;
  if (st.state === 'pruned') return `${dr.name}: cut. Mercer moved ${dr.of} by 10% and the forecast did not change.`;
  const p = Math.abs(st.e * 10).toFixed(1).replace(/\.0$/, '');
  const move = `Raise ${dr.of} by 10% and the revenue the plan adds ${st.e >= 0 ? 'rises' : 'falls'} ${p}%.`;
  if (st.state === 'binds') return `${limit ?? `${dr.name} limits growth first.`} ${move}`;
  return `${dr.name}: ${move}`;
}
M.reasonFor = reasonFor;

/* ============ the engine's findings, said plainly (kept for the results) ============ */
function capacityWords(c, unit = 'jobs', peak) {
  if (!c) return '';
  if (/^Not applicable/.test(c.statement ?? '')) return 'You sell products, so you have no queue of work to fill and capacity puts no limit on this plan.';
  const d = c.diagnostics ?? {};
  const can = (d.servers ?? 0) * (d.serviceRatePerServerPerMonth ?? 0);
  const knee = d.utilisationKnee ?? 0.85;
  const top = peak ?? d.peakUtilisation;
  // with no work on today the sentence stops at what can be taken on: no "about 0", no "0% full"
  const busy = count(d.existingMonthlyLoad ?? 0) !== '0' && (d.baselineUtilisation ?? 0) >= 0.005;
  const today = busy
    ? `You can take on about ${count(can)} ${unit} a month and already do about ${count(d.existingMonthlyLoad)}, so you are ${shareOf(d.baselineUtilisation)} full today${d.existingLoadDerived ? ' (Mercer’s estimate from your revenue ÷ sale price)' : ''}.`
    : `You can take on about ${count(can)} ${unit} a month.`;
  if ((d.baselineUtilisation ?? 0) >= knee) return `${today} That is past the ${shareOf(knee)} point where waits start to cost sales, so you cannot serve new customers until you can take on more.`;
  if (c.binding) return `${today} As you win customers you reach ${shareOf(top)} full${c.bindsAtMonth ? ` by ${monthName(c.bindsAtMonth)}` : ''}. The fuller you are, the longer customers wait, and customers who wait buy less often.`;
  // a peak that would print as 0% is said in words
  if ((top ?? 0) < 0.005) return `${today} With the plan you stay far under the ${shareOf(knee)} point where waits start to cost sales.`;
  return `${today} With the plan you peak at ${shareOf(top)} full, under the ${shareOf(knee)} point where waits start to cost sales.`;
}
/* ---------- the limit vocabulary (D2), the same strings in canopy.js ----------
   Four limits, one name each. "First limit" is the plan's term; a step's own is its "restraint". The page never says
   "binds" or "median" (code comments may). A constraint's ceiling is a twelve-month total of added revenue, never a month's */
const LIMIT_NAME = { client_capacity: 'Your capacity', market_depletion: 'Your prospects', channel_cap: 'Your routes', tma_capacity: 'TMA’s build slots' };
const LIMIT_SHORT = { client_capacity: 'Capacity', market_depletion: 'Prospects', channel_cap: 'Routes', tma_capacity: 'Build slots' };
/* the subject of a limit's clause: all singular, so "limits" agrees; prospects are plural and have their own clause */
const LIMIT_PHRASE = { client_capacity: 'capacity', channel_cap: 'route sending capacity', tma_capacity: 'TMA’s build schedule' };
/** one clause for a limit wherever it is printed. `first` for the plan's first limit; else `month` (the printed month name) or now */
function limitClause(type, { month = null, first = false } = {}) {
  if (type === 'market_depletion') return first || !month ? 'your prospects run out first' : `your prospects run out in ${month}`;
  return `${LIMIT_PHRASE[type] ?? 'one limit'} limits growth ${first ? 'first' : month ? `from ${month}` : 'now'}`;
}
/** a ceiling in words: every constraint's ceiling is added revenue summed over the twelve months (C32) */
const ceilingWords = (ceiling) => (ceiling > 0 ? ` (about ${gbp(near(ceiling))} added over twelve months)` : '');
/** a name inside a sentence: the first letter drops, except on a name that is a proper noun */
const midName = (w) => (/^(TMA|LinkedIn)/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1));
Object.assign(M, { LIMIT_NAME, LIMIT_SHORT, LIMIT_PHRASE, limitClause });
const sentence = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function limitWords(constraints, unit, peak) {
  const c = (constraints ?? []).find((x) => x.binding);
  if (!c) return null;
  const d = c.diagnostics ?? {};
  const when = c.bindsAtMonth ? monthName(c.bindsAtMonth) : null;
  if (c.type === 'market_depletion') {
    return {
      title: 'Your prospects run out first',
      short: `Your prospects run out first${when ? `: you contact every one once by ${when}` : ''}.`,
      long: `Your prospects run out first. ${d.addressableCount > 0 ? `You have ${count(d.addressableCount)}, and you contact each` : 'You contact each'} at most ${d.frequencyCapPerFirmPerQuarter ?? 4} times a quarter${d.sustainableMonthlyContacts > 0 ? `: about ${count(d.sustainableMonthlyContacts)} contacts a month in all` : ''}.${when ? ` You reach every one once by ${when}.` : ''}${d.recontactSpacingMonths ? ` After that you contact people again about every ${oneDp(d.recontactSpacingMonths)} months, and second contacts earn fewer replies.` : ''}`,
    };
  }
  if (c.type === 'client_capacity') {
    const full = (d.baselineUtilisation ?? 0) >= (d.utilisationKnee ?? 0.85);
    return {
      title: 'Your capacity limits growth first',
      short: full ? `You are already ${shareOf(d.baselineUtilisation)} full before any growth, so new customers would wait.` : `Your capacity fills first${when ? `: by ${when} you are close to full and people wait longer, so fewer buy` : ''}.`,
      long: capacityWords(c, unit, peak),
    };
  }
  if (c.type === 'channel_cap') {
    const notes = d.notes && d.notes !== 'none' ? ` ${String(d.notes).replace(/(^|;\s*)(\w)/g, (m, a, b) => `${a ? '. ' : ''}${b.toUpperCase()}`).replace(/linkedin/gi, 'LinkedIn')}.` : '';
    // a share that would print as 0% is not printed
    const cut = (d.trimmedVolumeShare ?? 0) >= 0.005 ? `Sending and platform limits cut ${shareOf(d.trimmedVolumeShare)} of the contacts in your plan` : 'Sending and platform limits hold back the contacts in your plan';
    return { title: 'Your routes limit growth first', short: `${cut}.`, long: `${cut}, from the first month.${notes}` };
  }
  if (c.type === 'tma_capacity') {
    const line = `${sentence(limitClause('tma_capacity', { month: when }))}.`;
    return { title: 'TMA’s build schedule limits growth first', short: line, long: line };
  }
  return { title: 'One limit holds growth back first', short: 'One limit holds growth back first.', long: 'One limit holds growth back first.' };
}
function plainWarning(w) {
  const s = typeof w === 'string' ? w : `${w.field ?? ''}: ${w.message ?? ''}`;
  const n = (s.match(/~(\d+)/) || [])[1];
  const RULES = [
    [/existingMonthlyLoad/, 'Today’s workload is Mercer’s estimate', `Mercer worked out today’s workload from your revenue ÷ sale price${n ? ` (about ${count(+n)} a month)` : ''}. Give the real figure and the capacity score can go above 80.`],
    [/serviceRatePerServerPerMonth/, 'Your capacity is below today’s work', 'The capacity you gave is less than the work your revenue implies. Either you can take on more than you said, or customers are leaving. Mercer widened the forecast.'],
    [/repeat-purchase|repeatPurchaseRate/, 'How long customers stay, without repeat buying', 'You said how long customers stay but not how many buy again. Mercer widened the forecast and holds the payback per customer score at 60 until it knows.'],
    [/retentionMonths/, 'Customers staying over ten years', 'That is rare, so Mercer widened the forecast.'],
    [/addressableCountSource/, 'Your prospect count has no source', 'Mercer does not know where your prospect count comes from, so it widened the forecast.'],
    [/addressableCount/, 'Under 50 prospects', 'With under 50 prospects, you run out of people to reach before any other limit applies.'],
    [/business\.acv/, 'One sale is worth more than a year of revenue', 'One sale would more than double the business, so Mercer widened the forecast.'],
    [/currentMonthlyRevenue/, 'Revenue outside Mercer’s range', 'Mercer’s figures come from smaller businesses than yours, so it widened the forecast.'],
    [/^budget|budget \(/, 'A budget far above your revenue', 'At over 100 times your monthly revenue, you run out of people to reach before you spend it all, so Mercer widened the forecast.'],
    [/statedCloseRate/, 'A close rate of 9 in 10', 'Nine in ten or more is rare. Mercer corrects it down and widens the forecast.'],
    [/grossMargin/, 'An unusual margin', 'Your margin is outside the usual range, so Mercer uses the nearest usual figure and widens the forecast.'],
    [/not in the prior pack/, 'No figures for your industry yet', 'Mercer uses figures from across all industries until it has yours.'],
    [/truncated|control characters/, 'Mercer trimmed some text', 'Text you type never changes the numbers.'],
  ];
  const hit = RULES.find(([re]) => re.test(s));
  return hit ? { title: hit[1], text: hit[2] } : { title: 'Mercer widened the forecast', text: s.replace(/^[\w.]+:\s*/, '') };
}
const judgementWords = (n) => ({ title: `${plural(n, 'setting is', 'settings are')} Mercer’s judgement`, text: `${plural(n, 'setting', 'settings')} inside Mercer’s models ${count(n) === '1' ? 'has' : 'have'} no published figure yet, such as how often people reply to a second contact. Mercer uses its judgement for ${count(n) === '1' ? 'it and marks it' : 'these and marks them'}.` });
const MODEL_LINE = { M1: 'Contacts become replies, enquiries and sales, each step at its own rate.', M2: 'The queue that forms when more work arrives than you can take on.', M3: 'You cannot contact the same people again and again, so your prospects run down.', M4: 'The return businesses like yours got on each pound they spent.', M5: 'The return on each extra pound, and how it fades.' };
function modelLine(m, name = M.MODEL_NAMES?.[m.id] ?? m.name) {
  const line = MODEL_LINE[m.id] ?? m.line;
  if (m.off) return `${name}: ${line} Not used for you: ${/spend variation/i.test(m.off) ? 'it needs months where your spend went up and down, and there are none yet' : m.off}.`;
  return `${name}: ${line} It carries ${Math.round(m.weight * 100)}% of your forecast.`;
}
Object.assign(M, { capacityWords, limitWords, plainWarning, judgementWords, modelLine });

/* ============ chance, said the same way everywhere ============ */
function reach(sorted, g) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < g) lo = m + 1; else hi = m; }
  return sorted.length - lo;
}
const mid = (sorted) => sorted[Math.floor(sorted.length / 2)];
const qAt = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];
function gapOf(sorted, goal) {
  const m = qAt(sorted, 0.5);
  if (goal === null || goal === undefined) return { mid: m, short: 0, onCourse: true, big: `${gbp(m)} a month`, tag: '' };
  const short = Math.max(0, Math.round(goal - m));
  return short <= 0
    ? { mid: m, short: 0, onCourse: true, big: 'On course', tag: Math.round(m - goal) >= 1 ? `${shortGbp(Math.round(m - goal))} clear of your goal` : 'level with your goal' }
    : { mid: m, short, onCourse: false, big: `${gbp(short)} short`, tag: `${shortGbp(short)} short of your goal` };
}
function chance(hit, n) {
  const share = hit / n;
  // no run reaching it is "Under 1%" of the runs, never a 0% sentence; `ratio` says "None"
  const p = share < 0.01 ? 'Under 1%' : share > 0.99 ? 'Over 99%' : `${Math.round(share * 100)}%`;
  const ratio = hit === 0 ? 'None' : share >= 0.95 ? 'Over 9 in 10' : share >= 0.5 ? `${Math.round(share * 10)} in 10` : `1 in ${Math.max(2, Math.round(1 / share))}`;
  return { share, pct: p, ratio };
}
function goalOf() {
  if (state.goal !== null && state.appetite !== 'none') return state.goal;
  const r = M.result ?? M.planned;
  if (!r) return state.goal;
  return Math.round(qAt(r.months[(state.months ?? 12) - 1], 0.9));
}
Object.assign(M, { reach, chance, gapOf, qAt, mid, goalOf, hasGoal: () => state.goal !== null });

/* ============ the ambition, and what it is measured against (Task 16) ============
   "What would you like to achieve next?" has eight distinct answers. Each names its own metric and its own baseline
   key, so personal income, company profit and revenue are never one figure. `numeric` says whether a target can be
   typed at all: a nonnumeric objective gets a milestone instead. `baseline` is the id that holds today's value in that
   metric; it is captured in the Business stage and shown beside the target as the Now marker. Nothing here invents a
   figure: an objective with no supplied baseline is unknown, and says so. */
const OBJECTIVES = [
  { id: 'revenue', label: 'Increase revenue', metric: 'revenue', baseline: 'now', unit: 'a month', numeric: true },
  { id: 'profit', label: 'Improve profit', metric: 'profit', baseline: 'margin', unit: 'a month', numeric: true },
  { id: 'reach', label: 'Expand reach, markets or locations', metric: 'reach', baseline: 'market', unit: '', numeric: false },
  { id: 'capacity', label: 'Increase capacity or efficiency', metric: 'capacity', baseline: 'capacity', unit: 'a month', numeric: true },
  { id: 'predictable', label: 'Make performance more predictable', metric: 'revenue', baseline: 'now', unit: 'a month', numeric: false },
  { id: 'dependence', label: 'Reduce dependence on particular people', metric: 'dependence', baseline: 'help', unit: '', numeric: false },
  { id: 'explore', label: 'Explore what is possible', metric: 'revenue', baseline: 'now', unit: 'a month', numeric: false },
  { id: 'other', label: 'Another objective', metric: 'other', baseline: null, unit: '', numeric: false },
];
const OBJECTIVE_BY = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o]));
/* the words the older win bank used, read as one of the eight; personal income keeps its own line and is never profit */
const WIN_AS_OBJECTIVE = { income: 'revenue', growth: 'revenue', profit: 'profit', time: 'capacity', predictable: 'predictable', beat: 'reach', sell: 'profit', lasts: 'predictable', extra: 'revenue', main: 'revenue', independence: 'revenue', meaning: 'explore', explore: 'explore', other: 'other' };
/** the objective the visitor chose, as one of the eight, or null before they have said */
function objectiveOf() {
  const w = state.win;
  const raw = Array.isArray(w) ? w[0] : w && typeof w === 'object' ? w.id ?? w.value : w;
  const id = typeof raw === 'string' ? raw : null;
  if (!id) return null;
  return OBJECTIVE_BY[id] ? id : WIN_AS_OBJECTIVE[id] ?? 'other';
}
/** the objective's definition: { id, label, metric, baseline, unit, numeric }, or null */
const objective = () => OBJECTIVE_BY[objectiveOf()] ?? null;
/** the id that holds today's value in the objective's metric, while it is still unknown; null when there is nothing to ask */
function baselineGap() {
  const o = objective();
  const id = o?.baseline;
  if (!id || !exists(id)) return null;
  /* the injection went round sectionQuestions, which is where the route filter lives, so someone who does not run a
     business yet was asked their typical month's revenue before costs. A baseline belongs to the route that has one. */
  const all = Array.isArray(M.registry) ? M.registry : [];
  const routes = all.find((e) => e && e.id === id)?.route; // registryEntry() is already route-filtered, so read the whole bank
  if (Array.isArray(routes) && !routes.includes(routeOf())) return null;
  return !answered(id) && applies(id) ? id : null;
}
Object.assign(M, { OBJECTIVES, objectiveOf, objective: () => objective(), baselineGap });

/* ============ the window a count is given for (Task 17, D7) ============
   The default is the last full calendar month in the visitor's own timezone, computed from today, never hardcoded. A
   business that started inside that month is asked for the window it has actually traded, with its real dates. Every
   count that shares a window shares this object, so a cohort conversion divides one cohort by itself. */
const monthStart = (d, back = 0) => new Date(d.getFullYear(), d.getMonth() - back, 1);
const dayBefore = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** "1 to 31 August 2026", and "28 August to 30 September 2026" when the two months differ */
function windowWords(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const endWords = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (sameMonth) return `${start.getDate()} to ${endWords}`;
  return `${start.toLocaleDateString('en-GB', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' })} to ${endWords}`;
}
/** the date the business began trading, from the stage, the years trading and the month it started; null when unknown */
function tradingStart(now) {
  if (state.bizStage === 'pre') return null;
  const y = state.yearsTrading;
  if (!Number.isFinite(y)) return null;
  const m = Number.isFinite(state.estMonth) ? state.estMonth - 1 : 0;
  return new Date(now.getFullYear() - y, m, 1);
}
/** { start, end, days, label, whole, basis }: the window every enquiry and sale count is given for */
function enquiryWindow(at = new Date()) {
  const thisMonth = monthStart(at);
  let start = monthStart(at, 1);
  let end = dayBefore(thisMonth);
  let basis = 'last full calendar month';
  let whole = true;
  const began = tradingStart(at);
  if (began && began > start) {
    // a shorter trading history: the window is stated as the days actually traded, never dressed up as a full month
    start = began < thisMonth ? began : monthStart(at);
    end = dayBefore(thisMonth) > start ? dayBefore(thisMonth) : at;
    basis = 'since you began trading';
    whole = false;
  }
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return { start: isoDay(start), end: isoDay(end), days, label: windowWords(start, end), whole, basis, computedAt: isoDay(at) };
}
M.enquiryWindow = enquiryWindow;
/** the window in a sentence, for a question that asks a count: "In the month of 1 to 31 August 2026" */
M.windowWords = (w = enquiryWindow()) => (w.whole ? `1 to ${w.label.split(' to ')[1]}` : w.label);
/* a cohort conversion is the same cohort divided by itself: enquiries in the window, and how many of those have bought */
M.cohortConversion = () => {
  const { enquiries: e, quotes: q } = state;
  if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(q)) return null;
  return { window: enquiryWindow(), enquiries: e, bought: q, rate: clamp(q / e, 0, 1), matured: false };
};

/* ============ the unit this business counts in (Task 18) ============
   A consultancy is never asked about "units". The unit comes from what the business said it sells and how it is paid;
   with nothing said, the plainest word stands and the sentence that uses it says so. */
const UNIT_BY_SELL = { retainer: 'clients', once: 'jobs', repeat: 'orders', mixed: 'jobs' };
function unitFor(s = state) {
  const own = typeof s.unitWord === 'string' && s.unitWord.trim() ? s.unitWord.trim() : null;
  if (own) return { one: own.replace(/s$/, ''), many: own, source: 'yours' };
  const sector = M.SECTORS?.find?.((x) => x.id === s.sector);
  const fromSector = typeof sector?.unit === 'string' && sector.unit ? sector.unit : null;
  const word = fromSector ?? UNIT_BY_SELL[s.repeatWork] ?? 'jobs';
  return { one: word.replace(/s$/, ''), many: word, source: fromSector ? 'sector' : s.repeatWork ? 'sells' : 'default' };
}
M.unitFor = unitFor;
/** capacity read off what is already done, not off a guess about three months' time: { can, doing, spare, full, unit } */
function capacityNow(s = state) {
  const unit = unitFor(s);
  const can = Number.isFinite(s.capacity) ? s.capacity : null;
  const doing = Number.isFinite(s.servedNow) ? s.servedNow : Number.isFinite(s.volumeMonthly) ? s.volumeMonthly : null;
  if (can === null || can <= 0) return { can, doing, spare: null, full: null, unit };
  const spare = doing === null ? null : Math.max(0, can - doing);
  return { can, doing, spare, full: doing === null ? null : clamp(doing / can, 0, 2), unit };
}
M.capacityNow = capacityNow;
/** today's value in the objective's metric, for the Now marker beside the target. The economics module owns every
    figure; with it absent the answer the visitor gave stands, and an unknown stays unknown rather than becoming a 0 */
/* the objective's metric, in the economics module's own words: it names an operating result, not a margin */
const ECON_VALUE = { revenue: 'revenue', profit: 'operatingResult', capacity: 'sales', reach: 'opportunitiesPerMonth' };
function baselineNow() {
  const o = objective();
  if (!o) return null;
  const metric = o.metric;
  let value = null; let source = null;
  try {
    const b = M.econ?.baseline?.(state);
    const v = b?.values?.[ECON_VALUE[metric] ?? metric];
    if (v && v.state !== 'unknown' && Number.isFinite(v.value)) { value = v.value; source = 'econ'; }
  } catch (e) { /* the answer below */ }
  if (value === null && o.baseline && answered(o.baseline)) { const own = state[keyFor(o.baseline)]; if (Number.isFinite(own)) { value = own; source = 'answer'; } }
  return { metric, unit: o.unit, value, known: value !== null, source, unknownWhy: value === null ? (o.baseline ? 'not supplied' : 'this objective has no single figure') : null };
}
M.baselineNow = baselineNow;

/* ============ the tree: one instance, mounted on the stage ============ */
const tree = window.GrowthTree ? (typeof window.GrowthTree.make === 'function' ? window.GrowthTree.make($('#stage')) : new window.GrowthTree()) : null;
const has3d = !!(tree && tree.ok && !tree.flat);
if (tree && !has3d && tree.ok && $('#stage') && typeof tree.mount === 'function' && !tree.flat) tree.mount($('#stage'), 'hero');
M.tree = tree;
M.has3d = has3d;
const T = (fn) => { if (!tree) return undefined; try { return fn(tree); } catch (e) { return undefined; } };

function treeMetrics() {
  const late = LATE.has(state.stage);
  const run = late && M.planned ? M.planned : M.result;
  const repeatV = state.repeat ?? 0;
  if (!run || !state.now) return { progress: 0, odds: 0, profit: 0, repeat: repeatV };
  const margin = run.bank ? run.bank.margin.value : run.margin;
  // in the interview the crown is not an encoding: nothing predicts before the results
  if (!late) return { progress: 0, odds: 1, profit: margin ?? 0, repeat: repeatV };
  const shownMonth = (M.monthShown ? M.monthShown : state.months ?? 12) - 1;
  const sorted = run.months[shownMonth];
  const g = goalOf() ?? state.now;
  const progress = g > state.now ? (mid(sorted) - state.now) / (g - state.now) : 1;
  return { progress: Math.max(0, progress), odds: reach(sorted, g) / sorted.length, profit: margin ?? 0, repeat: repeatV };
}
M.treeMetrics = treeMetrics;

/* ============ light and dark ============ */
const MOON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5 6.5 6.5 0 1 0 15.5 12.6z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const SUN = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
let manualMode = false;
/* the theme applies from the first screen (refine 1, R2): the tree wears the visitor's mode at arrival and in the intro
   as it does everywhere else. The night scene is the dark theme, and only that */
let treeTheme = '';
function themeTree(force) {
  const want = document.body.dataset.mode === 'dark' ? 'dark' : 'light';
  if (!force && want === treeTheme) return;
  treeTheme = want;
  T((t) => t.setTheme?.(want));
}
function setMode(mode, remember) {
  if (remember) manualMode = true;
  document.body.dataset.mode = mode;
  const btn = $('#mode');
  if (btn) { btn.innerHTML = mode === 'light' ? MOON : SUN; btn.setAttribute('aria-label', mode === 'light' ? 'Dark' : 'Light'); btn.title = mode === 'light' ? 'Dark' : 'Light'; }
  if (remember) { try { localStorage.setItem('mercer-mode', mode); } catch (e) { /* private window */ } }
  themeTree(true);
  paintCore();
  if (LATE.has(state.stage) && M.canopy?.repaint) M.canopy.repaint();
}
M.setMode = setMode;
$('#mode')?.addEventListener('click', () => setMode(document.body.dataset.mode === 'light' ? 'dark' : 'light', true));
/** the live tint: the section's hue token on body, read by base.css's drift mix */
function setTint(token) {
  if (!token) { delete document.body.dataset.tint; return; }
  document.body.dataset.tint = token;
  document.body.style.removeProperty('--sky-mix');
  nudges = 0;
}
let nudges = 0;
/** each commit inside a section moves the sky 1% further toward the tint, six at most */
function nudgeSky() {
  if (nudges >= 6) return;
  nudges += 1;
  const dark = document.body.dataset.mode === 'dark';
  const base = dark ? 91 : 94;
  document.body.classList.add('nudge');
  document.body.style.setProperty('--sky-mix', `${base - nudges}%`);
  setTimeout(() => document.body.classList.remove('nudge'), 450);
}

/* ============ the flow of data: forward when something is given, in reverse when it is taken away ============ */
const flow = (() => {
  let timer = 0, token = 0, measureTimer = 0;
  const ENGINE = new Set(['now', 'industry', 'channel', 'offLimits', 'price', 'closeRate', 'cycle', 'who', 'capacity', 'servedNow', 'budget', 'margin', 'market', 'repeat', 'retention']);
  async function unrun() {
    M.result = null;
    M.resultKey = null;
    paintCore();
    paintTree();
  }
  async function runAndShow(t0) {
    if (!(state.sector && state.now)) { if (M.result) await unrun(); return; }
    const key = keyOf();
    const r = forecastFor(key);
    if (t0 !== token) return;
    M.result = r;
    M.resultKey = key;
    dispatch('mercer:run', { key, result: r });
    paintCore();
    paintTree();
    if (state.stage === 'section') scheduleMeasure();
  }
  function schedule(delay) {
    clearTimeout(timer);
    const t0 = ++token;
    timer = setTimeout(() => runAndShow(t0), reduce ? 0 : Math.max(300, delay));
  }
  function scheduleMeasure() {
    clearTimeout(measureTimer);
    measureTimer = setTimeout(() => ensureMeasured(), 350);
  }
  function forward(src) {
    paintTree();
    if (ENGINE.has(src)) schedule(200);
  }
  async function backward(src) {
    clearTimeout(timer);
    const t0 = ++token;
    if (ENGINE.has(src) && M.result && !(state.sector && state.now)) await unrun();
    paintTree();
    if (ENGINE.has(src) && t0 === token && state.sector && state.now) runAndShow(t0);
  }
  return { forward, backward, scheduleMeasure, ENGINE };
})();
M.flow = flow;

function ensureMeasured() {
  if (!(state.sector && state.now)) return M.measured;
  const key = keyOf();
  if (M.measured && M.measuredKey === key) return M.measured;
  M.measured = E.measure(askOf());
  tallyOf(key).measures += 1;
  M.measuredKey = key;
  dispatch('mercer:measured', { key });
  paintTree();
  return M.measured;
}
M.ensureMeasured = ensureMeasured;
function ensurePlanned() {
  const key = keyOf();
  if (M.planned && M.planned.key === key) return M.planned;
  M.planned = { key, ...E.plan(askOf(), new Date().toISOString()) };
  tallyOf(key).plans += 1;
  dispatch('mercer:planned', { key });
  return M.planned;
}
M.ensurePlanned = ensurePlanned;
/** a run that is current, made now if it is stale: the results never read an old one */
function freshResult() {
  if (!(state.sector && state.now)) return null;
  if (!M.result || M.resultKey !== keyOf()) { const key = keyOf(); M.result = forecastFor(key); M.resultKey = key; dispatch('mercer:run', { key: M.resultKey, result: M.result }); paintCore(); }
  return M.result;
}

/* ============ the questions: which key each writes, which limb it grows on ============ */
const CYCLE_OPTS = [[1, 'Same day'], [4, 'Within a week'], [18, 'One to four weeks'], [60, 'One to three months'], [135, 'Three to six months'], [240, 'Over six months']];
const cycleWord = (d) => (CYCLE_OPTS.find(([v]) => v === d) ?? [null, `${d} days`])[1];
M.cycleWord = cycleWord;
/* the state key a question writes when it is not a schema question and not a composite. Two ids of the brief share a
   name with the walk's own keys, so E03 `stage` writes bizStage and E46 `asked` writes askedHelp */
const KEY_OF = { stay: 'retention', sector: 'sector', budget: 'budget', appetite: 'appetite', import: 'site', stage: 'bizStage', asked: 'askedHelp', currency: 'currency', retention: 'returned' };
/* the flow source a question moves */
const SRC_OF = { sector: 'industry', retainer: 'price', spend: 'budget', stay: 'retention', appetite: 'budget', software: 'stack', capacity: 'capacity', enquiries: 'enquiries' };
/* the engine bank key a question stands on while unanswered */
const BANK_OF = { price: 'deal', retainer: 'deal', closeRate: 'close', capacity: 'capacity', budget: 'budget', spend: 'budget', margin: 'margin', channel: 'channels', market: 'market', cycle: 'cycle' };
const Q_OF_BANK = { deal: ['price', 'retainer'], close: ['closeRate'], capacity: ['capacity'], budget: ['budget', 'spend'], margin: ['margin'], channels: ['channel'], market: ['market'], cycle: ['cycle'] };
/* the measured input each engine question maps to */
const MEASURE_OF = { price: 'acv', retainer: 'acv', closeRate: 'statedCloseRate', capacity: 'serviceRatePerServerPerMonth', budget: 'budget', spend: 'budget', margin: 'grossMargin', market: 'addressableCount', stay: 'retentionMonths' };
/* ---------- where a question grows (R10) ----------
   Six limbs keep their engine drivers; the words on them are the brief's four groups. Customers: demand, conversion,
   retention. Offer: pricing, margin. Delivery: capacity. Leverage: the trunk's upper third (control). Foundations
   feed the roots and the trunk; the aim stands at the crown as the goal marker */
const LIMB_BY_ID = {
  price: 'pricing', retainer: 'pricing', repeatWork: 'pricing', payModel: 'pricing', priceSpread: 'pricing', included: 'pricing', upsell: 'pricing', priceRaised: 'pricing',
  margin: 'margin', terms: 'margin', fixedCosts: 'margin', owed: 'margin', discounting: 'margin', software: 'margin', runway: 'margin', volume: 'margin',
  buyer: 'demand', segment: 'demand', trigger: 'demand', decider: 'demand', channel: 'demand', went: 'demand', market: 'demand', access: 'demand', radius: 'demand', deliveryMode: 'demand', budget: 'demand', spend: 'demand', listSize: 'demand', season: 'demand', competitors: 'demand', spendSplit: 'demand', marketingOwner: 'demand', agency: 'demand', agencyFee: 'demand', agencyWhy: 'demand', contentTime: 'demand', tracking: 'demand', idealCustomer: 'demand',
  enquiries: 'conversion', closeRate: 'conversion', chooseThem: 'conversion', chooseYou: 'conversion', reviews: 'conversion', responseTime: 'conversion', followUps: 'conversion', website: 'conversion', cycle: 'conversion', quotes: 'conversion',
  canDeliverMore: 'capacity', capacity: 'capacity', breaksFirst: 'capacity', hours: 'capacity', worry: 'capacity', holdup: 'capacity', wontDo: 'capacity', teamSize: 'capacity', leadTime: 'capacity', jobLength: 'capacity', qualitySlip: 'capacity', subcontract: 'capacity', holiday: 'capacity', hiring: 'capacity', changeHours: 'capacity',
  repeat: 'retention', retention: 'retention', stay: 'retention', returned: 'retention', retainerRenew: 'retention', retainerMonths: 'retention', returnGap: 'retention', newVsRepeat: 'retention', ltv: 'retention', lastFive: 'retention', topShare: 'retention', bestEver: 'retention',
  sector: 'trunk', stage: 'trunk', now: 'trunk', bestWorst: 'trunk', yearsTrading: 'trunk', import: 'roots', site: 'roots', place: 'roots', currency: 'roots', protected: 'crown', win: 'crown', goal: 'crown', months: 'crown',
};
const LIMB_OF_SECTION = { aim: 'crown', foundations: 'roots', customers: 'demand', delivery: 'capacity', leverage: 'control', plan: 'crown' };
/* the section a tree part opens at the crown (the card behind a limb): customers hold demand, conversion and retention;
   delivery holds the offer's pricing and margin with capacity */
const SECTION_OF_LIMB = { pricing: 'delivery', demand: 'customers', conversion: 'customers', capacity: 'delivery', margin: 'delivery', retention: 'customers', trunk: 'foundations', roots: 'foundations', control: 'leverage', crown: 'plan' };
M.SECTION_OF_LIMB = SECTION_OF_LIMB;
const SCHEMA_DRIVER_LIMB = { pricing: 'pricing', demand: 'demand', conversion: 'conversion', capacity: 'capacity', margin: 'margin', retention: 'retention', roots: 'roots', trunk: 'trunk', control: 'control' };
/** the tree part a question grows on: the registry's word, the table's, the schema's driver, else its section's part */
function limbOf(id) {
  const e = registryEntry(id);
  const own = e?.part ?? e?.limb ?? e?.driver;
  if (own && (LIMBS.includes(own) || own === 'trunk' || own === 'roots' || own === 'control' || own === 'crown')) return own;
  if (LIMB_BY_ID[id]) return LIMB_BY_ID[id];
  const d = M.SCHEMA_BY?.[id]?.driver;
  if (d && SCHEMA_DRIVER_LIMB[d]) return SCHEMA_DRIVER_LIMB[d];
  return LIMB_OF_SECTION[sectionOf(id)] ?? 'roots';
}
M.limbOf = limbOf;
/* the camera preset for a limb, by the names tree3d knows; a tree without the newer presets is framed at the nearest it has */
const PRESET_OF_LIMB = { pricing: 'offer', demand: 'reach', conversion: 'close', capacity: 'delivery', margin: 'money', retention: 'clients', trunk: 'you', control: 'control', roots: 'roots', crown: 'explore' };
const hasPreset = (p) => (window.GrowthTree?.PRESETS ?? []).includes(p);
const presetOfLimb = (limb) => { const p = PRESET_OF_LIMB[limb] ?? 'roots'; if (p === 'control' && !hasPreset('control')) return 'you'; return p; };
const presetOf = (sec) => presetOfLimb(LIMB_OF_SECTION[sec] ?? 'roots');
/** the tree anchor a label or the camera uses for a section: a limb id, 'trunk', 'roots', 'control' or 'crown' */
const labelPart = (s) => {
  const part = typeof s === 'string' ? s : s?.part;
  if (LIMBS.includes(part)) return part;
  if (part === 'control') return T((t) => t.anchor?.('control')) ? 'control' : 'trunk';
  if (part === 'crown') return 'crown';
  return part === 'trunk' ? 'trunk' : 'roots';
};
/* Declan Murphy, 28 September: the tree used to be explained by a glossary of limbs and roots before the first
   question. It names itself instead. The first time a question puts the live tag on a part, the tag carries that
   part's meaning with it; every time after that it carries the question alone. One sentence per part per session, on
   the part it describes, at the moment the visitor's own answer reaches it. */
const PART_MEANS = {
  roots: 'the roots: where each figure came from',
  trunk: 'the trunk: what the whole business rests on',
  crown: 'the crown: what the plan is aiming at',
  control: 'the trunk: what you decide and what you hold',
};
const LIMB_MEANS = 'this limb: one part of the business, drawn from your answers';
const partNamed = new Set();
/** the live tag for a question: its words, and the part's meaning the first time that part is written on */
function partTag(part, words) {
  const key = String(part ?? '');
  if (partNamed.has(key)) return words;
  partNamed.add(key);
  const means = PART_MEANS[key] ?? (LIMBS.includes(key) ? LIMB_MEANS : null);
  return means ? `${words} · ${means}` : words;
}
M.partTag = partTag;

const keyFor = (id) => KEY_OF[id] ?? registryEntry(id)?.key ?? M.SCHEMA_BY?.[id]?.key ?? M.Q?.[id]?.key ?? id;
const isSchema = (id) => Boolean(M.SCHEMA_BY?.[id]);

/* ---------- the gates (R3 conditions, R4) ----------
   The registry's own `when` is the interview owner's and is read first; these are the brief's conditions on top of it,
   so both must hold. A question the registry does not know falls back to the old table's rules */
const preRevenue = () => /^(pre|prepar|launch|idea|before)/i.test(String(state.bizStage ?? ''));
const swing = () => { const bw = state.bestWorst; return Array.isArray(bw) && bw[1] > 0 && bw[0] > 0 ? bw[0] / bw[1] : null; };
const payIsRetainer = () => { const p = state.payModel; const list = Array.isArray(p) ? p : p ? [p] : []; return state.repeatWork === 'retainer' || (list.length > 0 && list.every((x) => /^(retainer|subscription)$/i.test(String(x)))); };
const ownsAlone = () => !given(state.ownership) || /^(alone|solo|sole|me|you|self|just-?me)$/i.test(String(state.ownership));
const soloHelp = () => /^(none|solo|alone|nobody|just-?me|only-?me)$/i.test(String(state.help ?? ''));
const buyerIsBusiness = () => { const b = state.buyer ?? state.buyers; const list = Array.isArray(b) ? b : b ? [b] : []; return list.some((x) => /^(micro|mid|enterprise|public)$/.test(String(x)) || /business|organis|organiz|company|b2b|public|charit/i.test(String(x))); };
const deliversOnSite = () => { const d = state.deliveryMode; const list = Array.isArray(d) ? d : d ? [d] : []; return list.some((x) => /^(visit|travel|mixed|local|both)/i.test(String(x))); };
const netGiven = () => { const k = state.networkKinds; if (Array.isArray(k)) return k.some((x) => x && x !== 'none'); return given(state.network) && !/^(none|nobody|no)$/i.test(String(state.network)) && state.network !== 0; };
const repeats = () => ['often', 'sometimes'].includes(state.repeatBand) || (state.repeat ?? 0) > 0 || state.repeatWork === 'repeat' || state.repeatWork === 'mixed';
const hasCustomers = () => !preRevenue() && !(state.bizStage && /first/i.test(String(state.bizStage)) && state.now === 0);
const GATE = {
  owner: {
    bestWorst: () => !preRevenue() && Number(state.now) > 0,
    yearsTrading: () => !preRevenue() && (swing() !== null && swing() >= 1.5),
    now: () => !preRevenue(),
    price: () => !preRevenue(),
    retainer: () => !preRevenue(),
    margin: () => !preRevenue(),
    volume: () => !preRevenue(),
    lastFive: () => hasCustomers(),
    went: () => (state.tried ?? []).length > 0,
    decider: () => buyerIsBusiness(),
    enquiries: () => hasCustomers(),
    closeRate: () => hasCustomers(),
    repeat: () => !payIsRetainer() && state.repeatWork !== 'once' && hasCustomers(),
    retention: () => hasCustomers() && repeats(),
    returned: () => hasCustomers() && repeats(),
    stay: () => hasCustomers() && (payIsRetainer() || repeats()),
    retainerRenew: () => payIsRetainer(), retainerMonths: () => payIsRetainer(),
    returnGap: () => state.repeatWork === 'repeat' || state.repeatWork === 'mixed', newVsRepeat: () => state.repeatWork === 'repeat' || state.repeatWork === 'mixed',
    ltv: () => state.repeatWork === 'mixed',
    radius: () => deliversOnSite(),
    /* Task 18: the generic "could you deliver more?" gate is gone. What gives first is asked only when the observable
       facts do not already answer it: with room to spare on today's own numbers, delivery is not the limit */
    breaksFirst: () => { const c = capacityNow(); return c.full === null || c.full >= 0.7; },
    delegation: () => given(state.help) && !soloHelp(),
    networkStrength: () => netGiven(),
    asked: () => netGiven(),
    decisionRights: () => (given(state.help) && !soloHelp()) || !ownsAlone(),
    plannedChanges: () => given(state.decisionRights) && !/^(me|mine|myself)$/i.test(String(state.decisionRights)),
    ownShare: () => !ownsAlone(), profitShare: () => !ownsAlone(),
    spendSplit: () => (state.doing ?? []).length >= 2 && (state.spendNow ?? 0) > 0,
    agencyFee: () => state.marketingOwner === 'agency' || state.agency === 'now',
    agencyWhy: () => state.agency === 'ended' || state.agency === 'several',
  },
  starter: {
    n02: () => false, // reuses S02 to S04: never asked on its own
    n08: () => false, // reuses S05 (protected)
    // every other starter condition is the registry's own `when` (questions.js)
  },
};
const gateOf = (id) => GATE[routeOf()]?.[id] ?? null;
/** whether a question applies right now: the registry's `when`, the brief's gate, and the old table's rules */
const applies = (id) => {
  const g = gateOf(id);
  if (g) { try { if (!g()) return false; } catch (e) { /* a gate that fails is open */ } }
  const e = registryEntry(id);
  if (e && typeof e.when === 'function') { try { if (!e.when(state)) return false; } catch (err) { /* open */ } }
  if (!e && isSchema(id)) { try { if (!M.schemaApplies(id)) return false; } catch (err) { /* open */ } }
  const w = !e ? M.Q?.[id]?.when : null;
  if (typeof w === 'function') { try { if (!w(state)) return false; } catch (err) { /* open */ } }
  return true;
};
/** what the import step found, as a list, whether research.js holds it as a list or hands it over from a function */
const foundAll = () => { try { const f = M.research?.found; const v = typeof f === 'function' ? f.call(M.research) : f; const list = Array.isArray(v) && v.length ? v : Array.isArray(state.imported) ? state.imported : []; return list.filter(Boolean); } catch (e) { return []; } };
const foundList = () => foundAll().filter((x) => !x.excluded && x.status !== 'excluded');
const confirmedFind = (field) => foundList().find((f) => f.field === field && (f.confirmed || f.status === 'confirmed' || f.accepted));
/** answered elsewhere (R5 satisfiedBy): another question's answer, or a confirmed import field, stands for this one */
function satisfied(id) {
  const e = registryEntry(id);
  const by = Array.isArray(e?.satisfiedBy) ? e.satisfiedBy : [];
  return by.some((k) => { const f = String(k).startsWith('import:') ? k.slice(7) : null; if (f) return Boolean(confirmedFind(f)); return exists(k) && k !== id ? answered(k) : Boolean(confirmedFind(k)) || given(state[k]); });
}
M.satisfied = satisfied;
/** given, and for an instrument that commits an object (a sort, a decision map), with something placed in it */
const filled = (v) => given(v) && !(typeof v === 'object' && !Array.isArray(v) && !(v instanceof Set) && !Object.values(v).some((x) => given(x)));
/** how many things an object answer holds: { task: bin }, { bin: [tasks] } and [{ id, bin }] all count their tasks */
const placedCount = (v) => (Array.isArray(v) ? v.filter((x) => (x && typeof x === 'object' ? given(x.bin ?? x.value ?? x.id) : given(x))).length : v && typeof v === 'object' ? Object.values(v).reduce((n, x) => n + (Array.isArray(x) ? x.length : given(x) ? 1 : 0), 0) : 0);
/** what "answered" means for every id, custom and schema */
function answered(id) {
  const s = state;
  if (id !== 'readiness' && isSchema(id) && typeof M.schemaAnswered === 'function') { try { return Boolean(M.schemaAnswered(id)); } catch (e) { /* the rule below */ } }
  switch (id) {
    case 'sector': return Boolean(s.sector);
    case 'goal': return s.goal !== null || s.appetite === 'none';
    case 'appetite': return true;
    case 'price': return s.price !== null;
    case 'retainer': return s.retainerValue !== null;
    case 'channel': return (s.doing ?? []).length > 0 || s.channel !== null;
    case 'went': return Object.values(s.went ?? {}).some(Boolean);
    case 'spend': return s.basis === 'budget' ? s.spendNow !== null : s.budget !== null;
    case 'budget': return s.budget !== null;
    case 'enquiries': return s.enquiries !== null;
    case 'capacity': return s.capacity !== null;
    case 'stay': return s.retention !== null;
    case 'repeat': return s.repeat !== null;
    case 'software': return Object.keys(s.stackNames ?? {}).length > 0 || Object.keys(s.stack ?? {}).length > 0 || (s.systems ?? []).includes('none');
    case 'strengths': return (s.strengths ?? []).length > 0 || (s.avoids ?? []).length > 0;
    case 'personality': return Boolean(s.personality);
    case 'cv': return Boolean(s.cv && s.cv.trim());
    // the best-client cards (R3): one to five, and none is an answer too when the visitor says so
    case 'lastFive': return Array.isArray(s.lastFive) && (s.lastFive.length === 0 || s.lastFive.some((x) => x && (x.bin || x.type || x.label || x.bought)));
    case 'funding': return (s.funding ?? []).length > 0;
    case 'note': return Boolean(s.note);
    case 'bestWorst': return Array.isArray(s.bestWorst) && s.bestWorst[0] != null && s.bestWorst[1] != null;
    case 'place': return Boolean(s.place) || Boolean(s.country);
    case 'currency': return Boolean(s.currency) && s.asked.includes('currency');
    // the import step: an address, or anything read from what was pasted or picked
    case 'import': case 'site': return Boolean(s.site) || foundList().length > 0;
    case 'readiness': return true;
    default: return filled(s[keyFor(id)]);
  }
}
M.answered = answered;
/* the walk as this file runs it: a section's questions in order, and whether one applies right now (gates included) */
M.orderOf = (sectionId) => sectionQuestions(sectionId);
M.applies = applies;
const passed = new Set();
/** shown and moved past: answered, or left with Not sure, or dropped by routing, or passed with Continue */
const done = (id) => answered(id) || state.notSure.has(id) || state.na.has(id) || passed.has(id);
/** the pass a question belongs to (R5): 1 asked before the first plan, 2 kept for the refinement */
function tierOf(id) {
  const e = registryEntry(id);
  if (e) {
    if (e.priority === 'first' || e.tier === 1) return 1;
    if (e.priority === 'refine' || e.tier === 2 || e.tier === 3) return 2;
    if (e.optional === true) return 2;
  }
  return FIRST[routeOf()].has(ORDER_ALIAS[id] ?? id) ? 1 : 2;
}
M.tierOf = tierOf;
/* ---------- not applicable, by routing only (R6, C16) ----------
   No button says N/A. A question the routing drops after it was shown is marked na so nothing reads its old answer as
   current; a question that comes back into the walk loses the mark again */
function syncNa() {
  let changed = false;
  state.asked.forEach((id) => {
    if (id === 'readiness') return;
    const off = !applies(id);
    if (off && !state.na.has(id)) { state.na.add(id); changed = true; }
    else if (!off && state.na.has(id)) { state.na.delete(id); changed = true; }
  });
  return changed;
}

/* ============ evidence (R9) ============
   Every field has an evidence state: 'user' | 'imported' | 'source' | 'assumed' | 'calculated' | 'unknown'. What the
   visitor typed is theirs; a value pressed from an import find carries the find's source; the engine's stand-in for a
   question left with Not sure is an assumption, or a source when it is the UK industry figure; a value questions.js
   worked out from another answer is calculated; a question with nothing is not known yet */
const EVIDENCE_LABEL = { user: 'Your answer', imported: 'From what you gave Mercer', document: 'From your document', source: 'Source', assumed: 'Assumption', calculated: 'Calculated', unknown: 'Not known yet' };
const evidenceMap = {};
const evidenceRecord = (o) => ({ state: o.state ?? 'user', label: o.label ?? EVIDENCE_LABEL[o.state ?? 'user'], sourceTitle: o.sourceTitle ?? '', sourceUrl: o.sourceUrl ?? '', sourceDate: o.sourceDate ?? '', retrievedAt: o.retrievedAt ?? '', excerpt: o.excerpt ?? '' });
/** the import find a value came from, when it did */
function findFor(id, v) {
  if (!given(v)) return null;
  const key = keyFor(id);
  const same = (f) => (typeof v === 'number' ? numOf(f.value) === v : String(f.value).slice(0, 80) === String(v).slice(0, 80));
  return foundList().find((f) => (f.field === id || f.field === key || (id === 'teamSize' && f.field === 'team')) && same(f)) ?? null;
}
const findEvidence = (f) => evidenceRecord({ state: 'imported', label: f.kind === 'file' || f.kind === 'document' || f.kind === 'paste' ? EVIDENCE_LABEL.document : EVIDENCE_LABEL.imported, sourceTitle: f.sourceTitle ?? f.title ?? f.source ?? (f.kind === 'url' || f.url ? 'Your website' : 'Your document'), sourceUrl: f.sourceUrl ?? f.url ?? '', sourceDate: f.sourceDate ?? f.date ?? '', retrievedAt: f.retrievedAt ?? f.at ?? '', excerpt: f.excerpt ?? f.quote ?? '' });
function evidence(id) {
  if (!id) return evidenceRecord({ state: 'unknown' });
  if (state.na.has(id)) return { ...evidenceRecord({ state: 'unknown', label: 'Not needed' }), na: true };
  if (state.notSure.has(id) || (!answered(id) && state.asked.includes(id))) {
    const sIn = standIn(id);
    if (sIn && ukBenchmarks() && sIn.from === 'sector') return evidenceRecord({ state: 'source', sourceTitle: 'UK industry figure (Mercer’s priors)' });
    if (sIn) return evidenceRecord({ state: 'assumed' });
    return evidenceRecord({ state: 'unknown' });
  }
  if (!answered(id)) return evidenceRecord({ state: 'unknown' });
  const own = evidenceMap[id];
  if (own?.state === 'suggested') return evidenceRecord({ state: 'assumed', label: 'Suggested, not accepted yet' });
  if (own) return evidenceRecord(own);
  const key = keyFor(id);
  if (state.derived && state.derived[key] !== undefined) return evidenceRecord({ state: 'calculated' });
  const f = findFor(id, state[key]);
  if (f) return findEvidence(f);
  return evidenceRecord({ state: 'user' });
}
M.evidence = evidence;
/** every asked question's evidence, by id */
M.evidenceAll = () => Object.fromEntries(state.asked.filter((id) => id !== 'readiness').map((id) => [id, evidence(id)]));

/* ============ the revision (C06, brief 16.2) ============
   One integer, +1 on every accepted change: an answer, Not sure, a route switch, a confirmed or excluded import find.
   mercer:revision names what changed and what it makes stale; the plan is built for a revision and is stale for any
   later one (plan.js's M.plan.current() says so), and a model response for an older revision is discarded */
let revision = 0;
Object.defineProperty(M, 'revision', { get: () => revision, configurable: true });
const invalidatesOf = (id) => { const e = registryEntry(id); return Array.isArray(e?.invalidates) && e.invalidates.length ? e.invalidates : ['plan']; };
function bump(id, why = 'answer') {
  revision += 1;
  dispatch('mercer:revision', { revision, id: id ?? null, why, invalidates: id ? invalidatesOf(id) : ['plan'] });
  return revision;
}
M.bump = bump;

/* ============ headline, subhead, explanation ============ */
const READINESS_WORDS = { title: 'How much detail do you want next?', sub: 'Mercer has enough to show a first plan. The uncertain parts can be refined afterwards.' };
function headline(id) {
  if (id === 'readiness') { const h = M.headline?.(id); return h && (h.title || h.sub) ? { title: h.title ?? READINESS_WORDS.title, sub: h.sub ?? '' } : READINESS_WORDS; }
  const h = M.headline?.(id);
  if (h && (h.title || h.sub)) return { title: h.title ?? '', sub: h.sub ?? '' };
  const e = registryEntry(id);
  if (e && (e.title || e.question || e.ask)) return { title: e.title ?? e.question ?? e.ask, sub: e.sub ?? '' };
  const q = M.Q?.[id] ?? M.SCHEMA_BY?.[id];
  return { title: q?.title ?? id, sub: q?.sub ?? '' };
}
/* the sensitivity line ("a 10% change here moves the forecast 2.6%") is gone (brief 2.3, item 4): a statement with no
   input, output, unit and period named is not printed */
function explain(id) {
  const base = M.explain?.(id) ?? registryEntry(id)?.explain ?? M.SCHEMA_BY?.[id]?.note ?? '';
  return String(base ?? '');
}

/* ============ grade, kind and the words that fly ============ */
const numOf = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, ''));
/** a value that arrived by pressing one of the website's suggestions */
const fromSite = (field, v) => given(v) && foundList().some((f) => f.field === field && (typeof v === 'number' ? numOf(f.value) === v : String(f.value).slice(0, 80) === String(v)));
const gx = (x) => Math.log10(1 + Math.max(0, Number(x) || 0));
const gradeNum = (v, lo, hi) => { const t = (gx(v) - gx(lo)) / ((gx(hi) - gx(lo)) || 1); return clamp(1 + Math.floor(t * 5), 1, 5); };
const SCALE = { now: [1000, 100000], price: [100, 20000], enquiries: [5, 300], market: [250, 20000], listSize: [200, 20000], network: [2, 200], teamSize: [1, 30], owed: [1000, 60000], agencyFee: [500, 5000], contentTime: [1, 20], hours: [1, 40], ltv: [200, 20000], fixedCosts: [2000, 30000], goal: [1000, 200000], capacity: [5, 300], budget: [200, 10000], spend: [200, 10000], yearsTrading: [1, 20], retainer: [100, 20000] };
function gradeOf(id) {
  const s = state;
  const scale = M.SCHEMA_BY?.[id]?.scale ?? M.Q?.[id]?.scale ?? SCALE[id];
  const num = (v) => (scale ? gradeNum(v, scale[0], scale[1]) : 3);
  switch (id) {
    case 'closeRate': return Math.max(1, Math.round((s.closeRate ?? 0) * 10 / 2));
    case 'repeat': return Math.max(1, Math.round((s.repeat ?? 0) * 10 / 2));
    case 'retainerRenew': return Math.max(1, Math.round((s.retainerRenew ?? 0) / 2));
    case 'followUps': return Math.max(1, Math.round((s.followUps ?? 0) / 2));
    case 'topShare': return clamp(Math.ceil((s.topShare ?? 0) / 20), 1, 5);
    case 'margin': return clamp(Math.ceil((s.margin ?? 0) * 5), 1, 5);
    case 'lastFive': return 5;
    case 'channel': return clamp(2 + (s.doing ?? []).length, 1, 5);
    case 'software': return clamp(2 + Object.keys(s.stackNames ?? {}).length, 1, 5);
    case 'strengths': return clamp(2 + (s.strengths ?? []).length + (s.avoids ?? []).length, 1, 5);
    case 'cv': return s.cv ? 5 : 1;
    case 'capacity': return num(s.capacity);
    case 'spend': return num(s.budget ?? s.spendNow);
    case 'retainer': return num(s.retainerValue);
    case 'bestWorst': return num(s.bestWorst?.[0]);
    case 'enquiries': return num(s.enquiries);
    default: {
      const v = s[keyFor(id)];
      if (typeof v === 'number') return scale ? num(v) : 3;
      if (Array.isArray(v)) return clamp(2 + v.length, 1, 5);
      return 3;
    }
  }
}
M.gradeOf = gradeOf;
const optLabel = (id, v) => ((M.SCHEMA_BY?.[id]?.opts ?? M.Q?.[id]?.opts ?? []).find(([k]) => k === v) ?? [null, ''])[1];
const snip = (t, n = 28) => { const s = String(t ?? '').trim(); return s.length > n ? `${s.slice(0, n).trim()}…` : s; };
const MONTH_WORD = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** the rendered value that flies to the twig: a figure or the chosen word */
function valueText(id) {
  const s = state;
  // the interview owns the words for an answer; only fall through to the shapes below when it has none
  try { const w = M.answerWord?.(id); if (typeof w === 'string' && w.trim() && !/^(p\d+|best)$/.test(w.trim())) return w.trim(); } catch (e) { /* the shapes below */ }
  const unit = M.unitWord?.(M.result?.unit) ?? 'jobs';
  switch (id) {
    case 'now': return s.now ? gbp(s.now) : '';
    // None is the dial's own word: no "£0" flies to the twig
    case 'goal': return s.appetite === 'none' ? 'None' : s.goal ? gbp(s.goal) : '';
    case 'months': return s.months ? plural(s.months, 'month', 'months') : '';
    case 'sector': return s.trade || M.sectorWord?.(s.sector) || '';
    case 'place': return s.place;
    case 'site': case 'import': return s.site ? String(s.site).replace(/^https?:\/\//, '').replace(/\/$/, '') : foundList().length ? 'Your notes' : '';
    case 'yearsTrading': { if (!given(s.yearsTrading)) return ''; const y = s.yearsTrading === 0 ? 'Under a year' : plural(s.yearsTrading, 'year', 'years'); return s.estMonth && MONTH_WORD[s.estMonth - 1] ? `${y}, since ${MONTH_WORD[s.estMonth - 1]}` : y; }
    case 'ownShare': return s.ownShare !== null ? `${count(s.ownShare > 0 && s.ownShare <= 1 ? s.ownShare * 100 : s.ownShare)}%` : '';
    case 'keyPeople': return s.keyPeople !== null ? plural(s.keyPeople, 'person', 'people') : '';
    case 'unresolved': return snip(s.unresolved);
    case 'bestWorst': return s.bestWorst ? `${gbp(s.bestWorst[1])} to ${gbp(s.bestWorst[0])}` : '';
    case 'price': return s.price !== null ? gbp(s.price) : '';
    case 'retainer': return s.retainerValue !== null ? `${gbp(s.retainerValue)} a month` : '';
    case 'closeRate': return s.closeRate !== null ? `${s.closeRate < 0.1 ? '<1' : Math.round(s.closeRate * 10)} in 10` : '';
    case 'repeat': return s.repeat !== null ? `${Math.round(s.repeat * 10)} in 10` : '';
    case 'stay': return s.retention !== null ? plural(s.retention, 'month', 'months') : '';
    case 'capacity': return s.capacity !== null ? `${count(s.capacity)} ${unit}` : '';
    case 'market': return s.market !== null ? count(s.market) : '';
    case 'margin': return s.margin !== null ? `${Math.round(s.margin * 100)}p` : '';
    case 'cycle': return s.cycle !== null ? cycleWord(s.cycle) : '';
    case 'spend': return s.budget !== null ? gbp(s.budget) : s.spendNow !== null ? gbp(s.spendNow) : '';
    case 'budget': return s.budget !== null ? gbp(s.budget) : '';
    case 'enquiries': return s.enquiries !== null ? count(s.enquiries) : '';
    case 'channel': { const n = (s.doing ?? []).map((x) => DIST_BY[x]?.name).filter(Boolean); return n.length ? (n.length > 1 ? `${n[0]} +${n.length - 1}` : n[0]) : ''; }
    case 'software': { const n = Object.values(s.stackNames ?? {}).filter(Boolean); return n.length ? (n.length > 1 ? `${n[0]} +${n.length - 1}` : n[0]) : ''; }
    case 'lastFive': { const k = (s.lastFive ?? []).filter((x) => x && (x.bin === 'warm11' || x.bin === 'warm1m')).length; return s.lastFive ? `${k === 0 ? 'None' : k} warm` : ''; }
    case 'topShare': return s.topShare !== null ? `${s.topShare}%` : '';
    case 'network': return s.network !== null ? count(s.network) : '';
    case 'funding': return (s.funding ?? []).map((v) => optLabel('funding', v) || v).slice(0, 2).join(', ');
    case 'hours': return s.hours !== null ? `${s.hours} h` : '';
    case 'strengths': return (s.strengths ?? []).slice(0, 2).map((v) => optLabel('strengths', v) || v).join(', ');
    case 'personality': return s.personality ?? '';
    case 'cv': return s.cv ? 'CV' : '';
    case 'runway': return s.runway !== null ? (s.runway === 0 ? optLabel('runway', 0) || 'Nothing spare' : plural(s.runway, 'month', 'months')) : '';
    case 'note': return snip(s.note);
    default: {
      const q = M.SCHEMA_BY?.[id];
      const v = s[keyFor(id)];
      if (!given(v)) return '';
      if (q?.type === 'money' || (typeof v === 'number' && /cost|fee|owed|ltv/i.test(id))) return gbp(v);
      if (typeof v === 'number') return `${count(v)}${q?.unit ? ` ${typeof q.unit === 'string' ? q.unit : ''}` : ''}`.trim();
      if (Array.isArray(v)) { if (v.length && typeof v[0] === 'number') return `${gbp(v[0])} to ${gbp(v[1])}`; return v.slice(0, 2).map((x) => optLabel(id, x) || x).join(', '); }
      if (typeof v === 'string') return optLabel(id, v) || snip(v);
      // a sort or a decision map: how many the visitor placed
      if (typeof v === 'object') { const n = placedCount(v); return n ? `${count(n)} placed` : ''; }
      return '';
    }
  }
}
M.valueText = valueText;
/** where an answer came from: the visitor, or a website suggestion they pressed */
const kindOf = (id) => {
  const web = (id === 'price' && fromSite('price', state.price)) || (id === 'capacity' && fromSite('capacity', state.capacity)) || (id === 'teamSize' && fromSite('team', state.teamSize)) || ((id === 'site' || id === 'import') && (Boolean(state.site) || foundList().length > 0));
  return web ? 'web' : 'you';
};
/** the engine's stand-in for a question left with Not sure, when it has one */
function standIn(id) {
  const b = M.result?.bank;
  const key = BANK_OF[id];
  if (!key || !b) return null;
  if (key === 'cycle') return b.cycle ? { value: b.cycle, from: 'sector' } : null;
  const e = b[key];
  if (!e || e.from === 'you' || e.from === 'empty' || e.from === 'derived') return null;
  return { value: e.value, from: e.from === 'sector' ? 'sector' : 'assumed' };
}

/* ============ the prior snapshot and typ(): no sector figure before its question ============ */
function snapshotPrior(id) {
  const key = BANK_OF[id];
  if (!key) return;
  const sIn = standIn(id);
  if (sIn) state.prior[key] = sIn.value;
}
M.prior = (bankKey) => state.prior[bankKey];
/** the prior only after the question that owns it has been passed */
M.typ = (bankKey) => {
  const ids = Q_OF_BANK[bankKey] ?? [];
  const passedQ = ids.some((id) => state.asked.includes(id) && (answered(id) || state.notSure.has(id)));
  return passedQ ? state.prior[bankKey] : undefined;
};
const typ = (k) => M.typ(k);

/* ============ data points, root counts, the tree ============ */
const entered = new Set();
/** the questions shown that still count: asked, applying, not the readiness screen */
const shownIds = () => state.asked.filter((id) => id !== 'readiness' && applies(id));
/** one point per fact given, gated on what was shown and what applies: unasked questions emit nothing */
function dataPoints() {
  const out = [];
  const seen = new Set();
  const add = (p) => { if (seen.has(p.id)) return; seen.add(p.id); out.push(p); };
  shownIds().forEach((id) => {
    const driver = limbOf(id);
    const label = headline(id).title;
    const twigIndex = twigSlot(id);
    if (state.na.has(id)) return;
    if (state.notSure.has(id)) {
      const sIn = standIn(id);
      if (sIn) add({ id, driver, kind: sIn.from, size: 0.3, label, value: String(sIn.value), twigIndex });
      else add({ id, driver, kind: 'skip', size: 0.2, label, value: '', twigIndex });
      return;
    }
    if (!answered(id)) return;
    add({ id, driver, kind: kindOf(id), size: 0.3 + 0.14 * gradeOf(id), label, value: valueText(id), twigIndex });
  });
  return out;
}
M.dataPoints = dataPoints;
function rootCounts(pts) {
  const c = { you: 0, sector: 0, web: 0, assumed: 0 };
  pts.forEach((p) => { const k = p.kind === 'skip' ? (p.value ? 'assumed' : null) : p.kind; if (k && k in c) c[k] += 1; });
  return c;
}
M.rootCounts = rootCounts;
/** the twig slot a question owns on its limb: its place among the limb's shown questions, twelve slots to a limb */
function twigSlot(id) {
  const limb = limbOf(id);
  if (!LIMBS.includes(limb) && limb !== 'control') return null;
  const mine = shownIds().filter((x) => limbOf(x) === limb);
  const i = mine.indexOf(id);
  if (i < 0) return null;
  return Math.min(11, i);
}
const FIVE_BINS = ['warm11', 'warm1m', 'cold11', 'cold1m'];
const twigOf = (id) => {
  if (state.na.has(id)) return { id, state: 'cut', grade: 1, kind: 'you' };
  if (state.notSure.has(id)) return standIn(id) ? { id, state: 'estimate', grade: 2, kind: 'assumed' } : { id, state: 'ring', grade: 1, kind: 'you' };
  if (answered(id)) return { id, state: 'leaf', grade: gradeOf(id), kind: kindOf(id) };
  return { id, state: 'bud', grade: 1, kind: 'you' };
};
function twigsOf(limb) {
  const list = [];
  shownIds().filter((id) => limbOf(id) === limb).forEach((id) => {
    const slot = twigSlot(id);
    if (slot === null) return;
    const tw = twigOf(id);
    // the best-client cards' sprigs: how many of them arrived by each shelf, in bin order
    if (id === 'lastFive' && tw.state === 'leaf') tw.parts = FIVE_BINS.map((bin) => (state.lastFive ?? []).filter((x) => x && x.bin === bin).length);
    list[slot] = tw;
  });
  for (let i = 0; i < list.length; i++) if (!list[i]) list[i] = null;
  return list;
}
/** whether the trunk stands on a figure yet (R6): revenue today is the trunk, so until it is given the trunk is drawn in
    the same pale, unanswered state as the limbs. On the starter route the trunk is the chosen direction */
const trunkKnown = () => (routeOf() === 'starter' ? given(state.direction) : Number(state.now) > 0);
M.trunkKnown = trunkKnown;
/* the words on the tree (R10): each part's name, the answer it stands on and that answer's evidence state */
const PART_MAIN = { pricing: ['price', 'retainer', 'repeatWork'], demand: ['market', 'segment', 'channel', 'buyer'], conversion: ['closeRate', 'enquiries', 'chooseThem'], capacity: ['capacity', 'canDeliverMore', 'hours'], margin: ['margin', 'budget', 'terms'], retention: ['repeat', 'retention', 'stay', 'lastFive'], trunk: ['now', 'sector'], roots: ['sector', 'place', 'import'], control: ['help', 'network', 'strengths'], crown: ['goal', 'win'] };
const PART_NAME = { pricing: 'Price', demand: 'Demand', conversion: 'Conversion', capacity: 'Capacity', margin: 'Margin', retention: 'Retention', trunk: 'Baseline', roots: 'Evidence', control: 'Leverage', crown: 'Goal' };
function partState(part) {
  const ids = PART_MAIN[part] ?? [];
  const id = ids.find((x) => state.asked.includes(x) && answered(x)) ?? ids.find((x) => state.asked.includes(x)) ?? null;
  if (!id) return { name: PART_NAME[part] ?? part, value: '', state: 'unknown' };
  const ev = evidence(id);
  return { name: PART_NAME[part] ?? part, value: state.notSure.has(id) && standIn(id) ? standInWords(id, standIn(id)) : valueText(id), state: ev.state };
}
/** the goal marker and the scenario (R10): one linear mapping for baseline, scenario and target */
function metricOf() {
  const late = LATE.has(state.stage);
  const run = late && M.planned ? M.planned : M.result;
  const m = clamp(state.months ?? 12, 1, 12);
  const scenario = run?.months ? Math.round(qAt(run.months[m - 1], 0.5)) : null;
  const target = state.appetite === 'none' ? null : state.goal;
  return { baseline: Number(state.now) > 0 ? state.now : null, scenario: late ? scenario : null, target, label: target ? `${gbp(target)} a month` : '' };
}
let twigSig = {}, rootSig = '', fillSig = {}, trunkSig = null, partSig = {}, metricSig = '';
function paintTree() {
  syncNa();
  if (!tree) return { sts: [], roots: null };
  const tk = trunkKnown();
  if (tk !== trunkSig) { trunkSig = tk; T((t) => t.setTrunkKnown?.(tk)); }
  const pts = dataPoints();
  const counts = rootCounts(pts);
  if (state.cv && state.cv.trim()) counts.cv = true;
  const rs = JSON.stringify(counts);
  if (rs !== rootSig) {
    rootSig = rs;
    T((t) => t.setRootSources?.(counts));
    const own = counts.you + counts.web, all = own + counts.sector + counts.assumed;
    T((t) => t.setRootBalance?.(all > 0 ? own / all : null));
  }
  // the leverage questions' twigs stand round the trunk's upper third (tree3d 'control')
  {
    const tw = shownIds().filter((id) => limbOf(id) === 'control').map((id) => ({ ...twigOf(id), grade: 2 })).slice(0, 12);
    const sig = JSON.stringify(tw);
    if (sig !== twigSig.control) { twigSig.control = sig; T((t) => t.setTwigs?.('control', tw)); }
  }
  LIMBS.forEach((limb) => {
    const tw = twigsOf(limb);
    const sig = JSON.stringify(tw);
    if (sig !== twigSig[limb]) { twigSig[limb] = sig; T((t) => t.setTwigs?.(limb, tw.map((x) => x ?? { id: '', state: 'bud', grade: 1, kind: 'you' }).slice(0, tw.length))); }
    const shown = tw.filter(Boolean);
    const f = shown.length ? shown.filter((x) => x.state !== 'bud').length / shown.length : 0;
    if (fillSig[limb] !== f) { fillSig[limb] = f; T((t) => t.setLimbFill?.(limb, f)); }
  });
  // the words on each part: name, the answer it stands on, and that answer's evidence state (R10)
  [...LIMBS, 'trunk', 'roots', 'control', 'crown'].forEach((part) => {
    const ps = partState(part);
    const sig = JSON.stringify(ps);
    if (sig !== partSig[part]) { partSig[part] = sig; T((t) => t.setPartState?.(part, ps)); }
  });
  // the goal marker: the target height, today's baseline, and the scenario once the results hold one
  const mt = metricOf();
  const ms = JSON.stringify(mt);
  if (ms !== metricSig) { metricSig = ms; T((t) => t.setMetric?.(mt)); }
  // the results own the crown's encoding; so does a question opened again from the crown, which leaves the tree as it stood
  const late = LATE.has(state.stage) || Boolean(reopened);
  if (!late) T((t) => t.setMetrics?.(treeMetrics()));
  const sts = driverStates(M.measured?.entries, M.measured?.binding);
  return { sts, roots: counts };
}
M.paintTree = paintTree;

/* ============ the Core: the engine's draws settling at the trunk base ============ */
const hash = (i) => { let x = (i + 1) * 2654435761; x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995); x ^= x >>> 15; return (x >>> 0) / 4294967295; };
const cssColor = (host, name, fallback) => { const v = getComputedStyle(host).getPropertyValue(name).trim(); return v || fallback; };
/** draws the sorted draws of one month into host, on a clear canvas (no fill): a 1 px frame in --line (left to the
    host's own CSS border where it has one), 240 points (48 in a box under 120 px wide) in --ink at 30% on a log axis
    from the 2nd to the 98th percentile of the draws, the middle half as a band in --tint at 16%, a hairline at now
    and one at the goal (both held inside the axis).
    opts: { axis, labels, now, goal, hue, count, radius } */
function drawCore(host, sorted, opts = {}) {
  if (!host) return null;
  let cv = host.querySelector('canvas');
  // a new canvas starts from nothing: the points of a canvas that was cleared away (the intro's demo) are not carried over
  if (!cv) { if (host._core?.raf) cancelAnimationFrame(host._core.raf); host._core = null; cv = document.createElement('canvas'); host.textContent = ''; host.appendChild(cv); }
  const W = host.clientWidth || 148, H = host.clientHeight || 88, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  const ink = cssColor(host, '--ink', '#14201B'), line = cssColor(host, '--line', 'rgba(20,32,27,.12)');
  const tint = (opts.hue ? cssColor(host, opts.hue, '') : '') || cssColor(host, '--tint', '#7F624C');
  const cs = getComputedStyle(host);
  const ownFrame = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && cs.borderTopStyle !== 'hidden';
  const big = Boolean(opts.axis || opts.labels);
  // the small box is clear whatever the stylesheet gives it (.veil fills): the tree and the sky show through
  if (!big) { host.style.background = 'transparent'; host.style.boxShadow = 'none'; }
  const pad = big ? { l: 28, r: 12, t: 12, b: 26 } : { l: 4, r: 4, t: 4, b: 4 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const src = Array.isArray(sorted) || ArrayBuffer.isView(sorted) ? sorted : [];
  if (!src.length) { ctx.clearRect(0, 0, cv.width, cv.height); return null; }
  // the points are the draws themselves, taken at even steps through the sorted run
  const n = Math.max(1, Math.min(src.length, Math.round(opts.count ?? (W >= 120 ? 240 : 48))));
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(src[Math.min(src.length - 1, Math.floor(((i + 0.5) * src.length) / n))]);
  const min = src[0], max = src[src.length - 1];
  // a log axis from p2 to p98: the sqrt axis from 0.96 x min bunched every point at the left edge
  const x0 = Math.max(1, qAt(src, 0.02)), x1 = Math.max(qAt(src, 0.98), x0 * 1.02);
  const span = Math.log(x1 / x0);
  const X = (v) => pad.l + iw * clamp(Math.log(Math.max(v, x0) / x0) / span, 0, 1);
  const p25 = qAt(src, 0.25), p50 = qAt(src, 0.5), p75 = qAt(src, 0.75);
  const target = pts.map((v, i) => ({ x: X(v), y: pad.t + ih * (0.12 + 0.76 * hash(i)), off: v < x0 || v > x1 }));
  const prev = host._core?.pts ?? null;
  const from = prev && prev.length === target.length ? prev : target;
  const t0 = performance.now();
  const dur = reduce ? 0 : 520;
  const paint = (k) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tint; ctx.globalAlpha = 0.16;
    ctx.fillRect(X(p25), pad.t, Math.max(1, X(p75) - X(p25)), ih);
    ctx.globalAlpha = 1;
    if (!ownFrame) { ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, W - 1, H - 1); }
    if (big) { ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b + 0.5); ctx.lineTo(W - pad.r, H - pad.b + 0.5); ctx.stroke(); }
    ctx.fillStyle = ink; ctx.globalAlpha = 0.3;
    const r = opts.radius ?? (big ? 1.6 : 1.1);
    for (let i = 0; i < target.length; i++) {
      if (target[i].off) continue;
      const x = from[i].x + (target[i].x - from[i].x) * k, y = target[i].y;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const hair = (v, colour, alpha) => { if (v === null || v === undefined) return; ctx.strokeStyle = colour; ctx.globalAlpha = alpha; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.round(X(v)) + 0.5, pad.t); ctx.lineTo(Math.round(X(v)) + 0.5, pad.t + ih); ctx.stroke(); ctx.globalAlpha = 1; };
    hair(opts.now, ink, 0.9);
    hair(opts.goal, tint, 0.9);
    if (opts.labels) {
      ctx.fillStyle = cssColor(host, '--ink-3', '#7E8982'); ctx.font = `400 12px ${cssColor(host, '--sans', 'system-ui')}`; ctx.textBaseline = 'top';
      ctx.textAlign = 'left'; ctx.fillText(shortGbp(x0), pad.l, H - pad.b + 6);
      ctx.textAlign = 'center'; ctx.fillText(shortGbp(p50), clamp(X(p50), pad.l + 24, W - pad.r - 24), H - pad.b + 6);
      ctx.textAlign = 'right'; ctx.fillText(shortGbp(x1), W - pad.r, H - pad.b + 6);
    }
  };
  if (host._core?.raf) cancelAnimationFrame(host._core.raf);
  host._core = { pts: target, raf: 0 };
  const tick = () => {
    const k = dur ? clamp((performance.now() - t0) / dur, 0, 1) : 1;
    const e = 1 - Math.pow(1 - k, 3);
    paint(e);
    if (k < 1) host._core.raf = requestAnimationFrame(tick);
  };
  tick();
  return { p25, p50, p75, min, max, lo: x0, hi: x1 };
}
M.drawCore = drawCore;
/* the Core is out of the main journey (R10): #core stays hidden at every stage. The drawing (M.drawCore above) is kept for
   the crown card's Method block, which draws into its own host. The intro's demonstration box (data-demo="1") is intro.js's */
function paintCore() {
  const host = $('#core');
  if (!host) return;
  if (state.stage === 'intro' && host.dataset.demo === '1') return;
  host.hidden = true;
}
M.paintCore = paintCore;
const coreGate = paintCore;

/* ============ progress: six sections, a section index, never a percentage (R11, brief 4.3) ============
   M.progress() gives the six sections of the route as rows { id, name, hue, share, done, state, index, of, count,
   answered, notNeeded, reason, text }: `state` is 'done' (the section was left with nothing of the first pass open),
   'active' (on screen), 'optional' (only refinements remain, after the first plan was offered) or 'upcoming'. The plan
   section is done only when the plan is ready. The array carries `text` ("Customers · 3 of 6"), `index` and `active`
   for the wheel; `done` and `share` stay for a reader that still paints arcs from them */
const LATE = new Set(['cutscene', 'explore', 'plan', 'harvest']);
const WALKING = new Set(['roots', 'planting', 'section', 'close', 'ready']);
const closed = new Set();
let reached = {};
/** the plan is ready when a plan object stands for the current revision (plan.js), or the results are on screen */
function planReady() {
  // a plan the builder holds mid-interview is not a finished plan: the section completes only once the
  // visitor has reached the results (R11: generating a plan is not completion)
  if (!LATE.has(state.stage)) return false;
  try { const c = M.plan?.current?.(); if (c && !c.stale && (c.plan ?? c).revision === revision) return true; } catch (e) { /* no plan module */ }
  return Boolean(M.planned || M.planObj);
}
function progress() {
  const late = LATE.has(state.stage);
  const secs = sectionsFor(routeOf());
  const active = late ? 'plan' : WALKING.has(state.stage) ? state.section ?? null : null;
  const rows = secs.map((s) => {
    if (s.id === 'plan') return { s, ids: [], open: [], n: 0, d: 0 };
    const ids = sectionQuestions(s.id).filter((id) => applies(id) && !satisfied(id));
    const first = ids.filter((id) => tierOf(id) === 1);
    const open = first.filter((id) => !done(id));
    return { s, ids, open, n: ids.length, d: ids.length ? ids.filter(done).length / ids.length : 0 };
  });
  const total = rows.reduce((a, r) => a + r.n, 0);
  const asking = rows.filter((r) => r.s.id !== 'plan').length;
  const out = rows.map(({ s, ids, open, n, d }, i) => {
    const notNeeded = s.id !== 'plan' && n === 0 && (late || closed.has(s.id) || (active && WALK.indexOf(active) > i));
    const share = s.id === 'plan' ? 1 / 12 : (1 - 1 / 12) * (total ? n / total : 1 / asking);
    const most = Math.max(reached[s.id] ?? 0, s.id === 'plan' ? (planReady() ? 1 : 0) : late ? 1 : d);
    reached[s.id] = most;
    let st;
    if (s.id === 'plan') st = planReady() ? 'done' : s.id === active ? 'active' : 'upcoming';
    else if (s.id === active) st = 'active';
    else if (late || (closed.has(s.id) && !open.length)) st = 'done';
    else if (closed.has(s.id) && open.length) st = 'reopened';
    else if (readyOffered) st = 'optional';
    else st = 'upcoming';
    return { id: s.id, name: s.name, hue: s.hue, share, done: clamp(most, 0, 1), state: st, index: i + 1, of: secs.length, count: n, answered: ids.filter(answered).length, notNeeded, reason: notNeeded ? NOT_NEEDED_WHY[s.id]?.[routeOf()] ?? 'No question here applies to what you have said.' : '' };
  });
  const k = out.findIndex((r) => r.state === 'active');
  out.active = k >= 0 ? out[k].id : null;
  out.index = k >= 0 ? k + 1 : late ? secs.length : 0;
  out.text = k >= 0 ? `${out[k].name} · ${k + 1} of ${secs.length}` : late ? `${secs[secs.length - 1].name} · ${secs.length} of ${secs.length}` : '';
  return out;
}
M.progress = progress;
/** the section index in words: "Customers · 3 of 6" */
M.progressText = () => progress().text;
/** the active section's name: the eyebrow's first word and the wheel's accessible name */
M.stageName = () => { const p = progress(); return p.active ? p.find((r) => r.id === p.active)?.name ?? '' : LATE.has(state.stage) ? 'Plan' : ''; };
let ringSig = '';
function paintRing() {
  const stages = progress();
  const sig = JSON.stringify(stages) + stages.text;
  if (sig !== ringSig) {
    ringSig = sig;
    dispatch('mercer:progress', { stages, active: stages.active, index: stages.index, of: stages.length, name: M.stageName(), text: stages.text });
  }
  // a page that still carries the one-arc ring is painted as before, from the same six sections
  const arc = $('#ring .ring-arc');
  if (arc) arc.setAttribute('stroke-dashoffset', String(clamp(1 - stages.reduce((a, x) => a + x.share * x.done, 0), 0, 1)));
  const wheel = $('#wheel');
  if (wheel && stages.text) { wheel.setAttribute('aria-label', stages.text); const t = $('#wheel .wheel-text, #wheel-text'); if (t) t.textContent = stages.text; }
  // the section's name stands in the eyebrow where the shell has given it a place
  const where = $('#eyebrow .stage');
  if (where) where.textContent = M.stageName();
}

/* ============ insights: one sentence the visitor did not know, or nothing ============ */
const sectorWord = () => (M.sectorWord?.(state.sector) ?? 'your industry').toLowerCase();
const one = (x) => oneDp(x);
const pc = (x) => (x > 0 && x < 0.005 ? 'under 1%' : `${Math.round(x * 100)}%`);
const warn = (text) => ({ text, warn: true });
// route names inside a sentence: "cold email, LinkedIn and content"
const engineNames = () => (M.result?.channels ?? []).map((c) => midName(CHANNEL_NAME[c] ?? c));
const listWords = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const macroRow = (id) => { const m = M.macro; if (!m) return null; try { return typeof m.byId === 'function' ? m.byId(id) : m.byId?.[id] ?? null; } catch (e) { return null; } };
const warmCount = () => (state.lastFive ?? []).filter((x) => x && (x.bin === 'warm11' || x.bin === 'warm1m')).length;
const coldCount = () => (state.lastFive ?? []).filter((x) => x && (x.bin === 'cold11' || x.bin === 'cold1m')).length;
const stayMonths = () => (given(state.retainerMonths) ? Math.max(1, state.retainerMonths) : given(state.retention) ? state.retention : null);
/* figures inside sentences (C24): one decimal under a hundred, the noun agreeing with what is printed, "in 10" never "0 in 10" */
const dp1 = (x) => (Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-GB') : one(x));
const pluralDp = (x, single, many) => { const c = dp1(x); return `${c} ${c === '1' ? single : many}`; };
const tenths = (r) => (r < 0.1 ? 'under 1' : String(Math.round(r * 10)));
/* the sales cycle in the visitor's own words, never a month count they did not give: "about one to three months", "over six months" */
const cycleSpan = (d) => { const w = cycleWord(d).toLowerCase(); return /^(over|within|same)\b/.test(w) ? w : `about ${w}`; };
const bindingIs = (type) => (M.measured?.binding ?? M.planned?.binding) === type;
const constraintOf = (type) => (M.planned?.constraints ?? M.measured?.constraints ?? []).find((c) => c.type === type);
const LEAF = {
  now: () => '',
  goal: () => { const { now, goal, months } = state; if (!now || !goal || !months || goal <= now || state.appetite === 'none') return ''; return `${gbp(now)} to ${gbp(goal)} in ${plural(months, 'month', 'months')} is ${pc(Math.pow(goal / now, 1 / months) - 1)} a month${months > 1 ? ', compounded' : ''}.`; },
  // the dial itself carries the appetite line (COPY §5) under the knob, so the insight slot stays with the target
  appetite: () => '',
  price: () => {
    const { price, now } = state;
    if (!price || !now) return '';
    const t = typ('deal');
    const sales = now / price;
    // revenue under one sale (the client's own case: £66 a month, a £6,000 sale) is said in months, never as "0 sales"
    const small = `one ${gbp(price)} sale is ${pluralDp(price / now, 'month', 'months')} of today’s revenue`;
    if (t) {
      const d = Math.abs(price / t - 1);
      const sits = d < 0.005 ? `${gbp(price)} matches the ${gbp(t)} typical for ${sectorWord()}` : `${gbp(price)} sits ${pc(d)} ${price >= t ? 'above' : 'below'} the ${gbp(t)} typical for ${sectorWord()}`;
      return `${sits}: ${sales < 1 ? small : `about ${plural(sales, 'sale', 'sales')} a month at today’s revenue`}.`;
    }
    return sales < 1 ? `${sentence(small)}.` : `${gbp(now)} a month is about ${plural(sales, 'sale', 'sales')} a month.`;
  },
  retainer: () => {
    const { retainerValue: v, retainerMin: lo, retainerMax: hi, now } = state;
    if (!v) return '';
    const stay = stayMonths();
    if (stay && lo && hi) return `One client at ${gbp(v)} for ${plural(stay, 'month', 'months')} is ${gbp(v * stay)}; ${gbp(lo)} to ${gbp(hi)} is a ${one(hi / lo)}× spread, so months will swing.`;
    if (!now) return '';
    return now / v < 1 ? `${gbp(now)} a month is less than one client at ${gbp(v)}.` : `${gbp(now)} a month is about ${plural(now / v, 'client', 'clients')} at ${gbp(v)}.`;
  },
  channel: () => {
    const doing = state.doing ?? [];
    if (!doing.length) return '';
    const names = engineNames();
    if (!names.length) return '';
    // "the rest" only when the visitor runs a route Mercer does not forecast
    const rest = doing.some((id) => !DIST_BY[id]?.engine);
    const base = `You run ${plural(doing.length, 'route', 'routes')}; Mercer forecasts ${listWords(names)}${rest ? ' and brings the rest to the call' : ''}.`;
    // one sentence of the law here; the consumer ban and the email rule sit under the Cold, one to one shelf's title
    if (doing.includes('cold-call')) return `${base} Calling another business cold is lawful in the UK: screen the number against the TPS and CTPS first, say who you are, let your number show, and stop when asked.`;
    return base;
  },
  spend: () => {
    const { budget, spendNow, now } = state;
    if (spendNow !== null && budget !== null && spendNow > budget) return warn('You spend more now than the most you would.');
    if (budget === null || !(budget > 0) || !now) return '';
    return `${gbp(budget)} is ${pc(budget / now)} of revenue; Mercer’s default for you would be ${gbp(defaultBudget(now))}.`;
  },
  budget: () => LEAF.spend(),
  spendSplit: () => {
    const s = state.spendSplit, spendNow = state.spendNow;
    if (!s || !spendNow) return '';
    const t = Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0);
    if (!(t > 0)) return '';
    if (t > 100) return warn(`${t}% of ${gbp(spendNow)} placed. ${t - 100}% over.`);
    return `${t}% of ${gbp(spendNow)} placed.${t < 100 ? ` ${100 - t}% left.` : ''}`;
  },
  enquiries: () => {
    const { enquiries: enq, quotes, now, price } = state;
    if (enq === null) return '';
    const close = state.closeRate ?? typ('close');
    const lines = [];
    if (close && now && price) {
      const won = enq * close, implied = now / price;
      // a part that would print as 0 is left out: no "0 new customers", no "says 0"
      if (count(won) !== '0') {
        const says = count(implied) !== '0';
        const line = `About ${plural(won, 'new customer', 'new customers')} a month at ${tenths(close)} in 10${says ? `; revenue ÷ price says ${count(implied)}` : ''}.`;
        if (says && (implied > won * 1.6 || implied < won * 0.4)) return warn(line);
        lines.push(line);
      }
    }
    if (quotes !== null && quotes > 0 && quotes <= enq && enq > 0) lines.push(`${pc(quotes / enq)} of enquiries get a price.`);
    return lines.join(' ');
  },
  closeRate: () => { const t = typ('close'); return t ? `${M.sectorWord?.(state.sector) ?? 'Your industry'} typically closes ${Math.max(1, Math.round(t * 10))} in 10; Mercer weighs yours against it before it trusts it.` : ''; },
  cycle: () => {
    const { cycle, months } = state;
    if (cycle === null || cycle < 30) return '';
    const span = months ?? 12;
    const left = span - cycle / 30.4;
    // the month Mercer reads comes before the first sale does
    if (left < 0.05) return `A customer who first contacts you today buys after month ${span}, the month Mercer reads.`;
    return `A customer who first contacts you today buys in ${cycleSpan(cycle)}, leaving ${one(left)} of the ${span} months Mercer forecasts.`;
  },
  capacity: () => {
    const cap = state.capacity;
    if (!cap) return '';
    const price = state.price ?? state.retainerValue ?? typ('deal');
    const served = state.servedNow ?? (state.now && price ? state.now / price : null);
    // nothing served yet says nothing new: no "0% full"
    if (served === null || !(served > 0)) return '';
    const unit = M.unitWord?.(M.result?.unit) ?? 'jobs';
    if (served >= cap) return warn('Full.');
    // the units are plural words ("room nights", "nights booked"), so one more is said without them
    const more = count(cap - served);
    return `About ${pc(served / cap)} full: room for ${more === '1' ? 'one more' : `${more} more ${unit}`} a month.`;
  },
  margin: () => {
    const { margin, price, now } = state;
    // a margin that would print as 0p says nothing
    if (margin === null || Math.round(margin * 100) < 1) return '';
    const p = Math.round(margin * 100);
    const t = typ('margin');
    if (t && price) return `You keep ${gbp(price * margin)} of each ${gbp(price)} sale, ${p}p in the £1; ${sectorWord()} typically keeps ${Math.round(t * 100)}p.`;
    if (now && Math.round(now * margin) >= 1) return `You keep ${p}p in the £1: ${gbp(now * margin)} a month before outgoings.`;
    return '';
  },
  runway: () => {
    const { runway } = state;
    if (runway === null) return '';
    if (runway === 0) return 'Growth spend comes out of each month’s takings.';
    const b = state.budget;
    if (!b) return '';
    return `${plural(runway, 'month', 'months')} at ${gbp(b)} a month: ${gbp(runway * b)} of growth spend before sales must cover it.`;
  },
  software: () => {
    const total = Object.values(state.stack ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
    if (!total || !state.now) return '';
    const filled = Object.keys(state.stack ?? {}).filter((id) => Number(state.stack[id]) > 0);
    const free = M.freetools?.rowsFor ? filled.filter((id) => { try { return (M.freetools.rowsFor(id) ?? []).length > 0; } catch (e) { return false; } }).length : 0;
    // the free-tier clause only when one exists: no "0 of these kinds"
    const tail = free >= 1 ? `; ${count(free)} of these kinds ${free === 1 ? 'has' : 'have'} a free tier (the results list them)` : '';
    return `${gbp(total)} a month is ${gbp(total * 12)} a year, ${total / state.now < 0.01 ? 'under 1%' : pc(total / state.now)} of revenue${tail}.`;
  },
  lastFive: () => { if (!answered('lastFive')) return ''; const names = engineNames(); const k = warmCount(); return `${k === 0 ? 'None' : count(k)} of your five best came warm; Mercer’s forecast runs ${names.length ? listWords(names) : 'its default routes'}.`; },
  // the three are said as an average: the answer is their sum, not any one client's share
  topShare: () => { const { topShare: s, now } = state; if (!s || !now || (now * s) / 300 < 1) return ''; return `Your top three are ${s}% of revenue: about ${gbp((now * s) / 300)} a month each, on average.`; },
  repeat: () => { const r = state.repeat; if (r === null || r >= 0.95 || Math.round(r * 10) < 1) return ''; return `${Math.round(r * 10)} in 10 buying again: a new customer buys about ${one(1 / (1 - r))} times.`; },
  // one purchase is no stay to price: nothing is said (no "over 1 months")
  stay: () => { const { price, repeat: r, retention: stay } = state; if (!price || r === null || !stay || stay <= 1) return ''; const times = 1 / (1 - Math.min(0.95, r)); return `One customer is worth about ${gbp(price * times)} over ${plural(stay, 'month', 'months')}.`; },
  hours: () => { const { hours: h } = state; const n = (state.doing ?? []).length; if (h === null || !(h > 0) || !n) return ''; return `${plural(h, 'hour', 'hours')} a week is about ${count(h * 4.33)} a month across ${plural(n, 'live route', 'live routes')}.`; },
  strengths: () => ((state.avoids ?? []).includes('selling') && warmCount() >= 3 ? `You avoid selling and ${count(warmCount())} of your five best came warm: the network sells for you.` : ''),
  risk: () => (state.risk === 'none' && (state.appetite === 'aggressive' || state.appetite === 'maximum') ? `No risk and ${state.appetite === 'aggressive' ? 'an aggressive' : 'a maximum'} target pull against each other; the results show what each costs.` : ''),
  personality: () => { const a = M.archetypes?.pick?.(state.personality); return a?.name && a?.grows ? `${a.name}: grows by ${a.grows}.` : ''; },
  cv: () => { const f = M.cvFacts; if (!f) return ''; const bits = []; if (f.years && f.since) bits.push(`${plural(f.years, 'year', 'years')} in work since ${f.since}`); if (f.roles?.length) bits.push(plural(f.roles.length, 'role', 'roles')); return bits.length ? `${bits.join(', ')}.` : ''; },
  network: () => { const { network: n, enquiries: enq } = state; if (!n || !(enq > 0)) return ''; return `${plural(n, 'introducer', 'introducers')} at one introduction a year is ${one(n / 12)} a month against ${plural(enq, 'enquiry', 'enquiries')}.`; },
  funding: () => {
    const f = state.funding ?? [];
    if (f.includes('loan')) { const r = macroRow('boe_bank_rate'); return r && r.value !== undefined && r.asOf ? `Bank Rate is ${r.value}% (Bank of England, ${ukDate(r.asOf)}).` : ''; }
    if (f.includes('none') && state.runway === 0 && state.budget && state.now && state.margin) return `Growth spend comes out of takings: ${pc(state.budget / (state.now * state.margin))} of gross profit.`;
    return '';
  },
  market: () => {
    const m = state.market;
    if (m === null) return '';
    if (m < 50) return warn('Under 50 prospects: outreach runs out inside the first month.');
    const c = typ('close');
    return c ? `${count(m)} prospects at ${Math.max(1, Math.round(c * 10))} in 10 is about ${plural(m * c, 'sale', 'sales')} if every one heard from you once.` : '';
  },
  // schema ids, in case questions.js has no line for them (its own line wins when it has one)
  bestWorst: () => {
    const bw = state.bestWorst, now = state.now;
    if (!bw || !now) return '';
    const [best, worst] = bw;
    if (best < worst) return warn('Your best month is below your worst.');
    if (now < worst) return warn(`Your ${gbp(now)} now sits below your worst month.`);
    if (now > best) return `Your ${gbp(now)} now is above your best month.`;
    if (worst > 0) {
      // today at either end is said in words: no "0% of the way"
      const f = best > worst ? (now - worst) / (best - worst) : 1;
      const where = f < 0.005 ? 'today matches your worst month' : f > 0.995 ? 'today matches your best month' : `today sits ${pc(f)} of the way from worst to best`;
      return `Your best month is ${one(best / worst)}× your worst; ${where}.`;
    }
    return `Your best month is ${gbp(best)}; today’s ${gbp(now)} is ${pc(now / best)} of it.`;
  },
  yearsTrading: () => (state.yearsTrading >= 1 && state.now >= 1000 ? `${gbp(state.now / state.yearsTrading)} of monthly revenue added per year, on average.` : ''),
  repeatWork: () => (state.repeatWork === 'retainer' ? 'A client is worth fee × months stayed; Mercer prices a sale that way.' : state.repeatWork === 'once' ? 'Mercer counts each customer as one sale.' : ''),
  priceSpread: () => ((state.priceSpread === 'wide' || state.priceSpread === 'huge') && state.price ? `Expect months to swing wider than Mercer’s range: it prices every sale at ${gbp(state.price)}.` : ''),
  upsell: () => (state.upsell === 'yes' && Math.round((state.repeat ?? 0) * 10) >= 1 ? `${Math.round(state.repeat * 10)} in 10 already come back; an upsell reaches them without a new enquiry.` : state.upsell === 'could' ? 'An upsell would sit on top of the forecast; Mercer counts one sale per customer.' : ''),
  // one sourced year of CPI, and only that year: macro.json holds no earlier ones (C35)
  priceRaised: () => { if (state.priceRaised !== 'long' && state.priceRaised !== 'never') return ''; const r = macroRow('cpi_annual'); return r && r.value !== undefined && r.period && r.asOf ? `CPI rose ${r.value}% in the year to ${r.period} (ONS, ${ukDate(r.asOf)}); a price held flat through that year fell that far behind.` : ''; },
  buyer: () => (state.buyer === 'public' ? 'Mercer does not model tenders or frameworks.' : ''),
  radius: () => {
    if (state.radius === 'global') return 'Worldwide: Mercer drops the map and counts your prospects instead.';
    // the same sum the map prints (map.js owns the miles and the count); with either helper missing nothing is said (C36)
    if ((state.radius === 'local' || state.radius === 'county') && state.place && typeof M.locate === 'function') {
      try {
        const p = M.locate(state.place);
        const miles = M.radiusMiles?.();
        const people = p && miles ? M.peopleWithin?.(p, miles) : null;
        if (people > 0) return `${count(people)} people live within ${miles} miles of ${p.name} (GeoNames populations).`;
      } catch (e) { /* no match */ }
    }
    return '';
  },
  listSize: () => { const { listSize: l, market: m } = state; if (!l || !m) return ''; return l > m ? warn('More contacts than prospects: the two lists overlap.') : `${pc(l / m)} of your prospects already know you.`; },
  season: () => (state.season && state.season !== 'steady' ? 'Mercer forecasts average months with no peaks; the results mark where yours fall.' : ''),
  marketingOwner: () => { const n = (state.doing ?? []).length; return state.marketingOwner === 'nobody' && n ? `No one runs marketing and ${plural(n, 'route is', 'routes are')} live: ${n === 1 ? 'it runs itself' : 'they run themselves'}.` : ''; },
  agencyFee: () => { const { agencyFee: fee, spendNow } = state; if (!fee || !spendNow) return ''; return fee > spendNow ? warn(`More than the ${gbp(spendNow)} you said you spend on growth each month.`) : `${pc(fee / spendNow)} of the ${gbp(spendNow)} you spend on growth.`; },
  contentTime: () => { const h = state.contentTime; const route = (state.doing ?? []).map((id) => DIST_BY[id]).find((d) => d && (d.id.startsWith('org-') || ['newsletter', 'podcast', 'webinar', 'case-studies', 'internal-social', 'seo'].includes(d.id))); if (!h || !route) return ''; return `${plural(h, 'hour', 'hours')} a week on ${route.name}; in Mercer’s model content ramps over three months, a quarter, three quarters, then full.`; },
  tracking: () => (state.tracking === 'guess' || state.tracking === 'no' ? 'Without enquiry-source records, your last five will be memory; the results say so.' : ''),
  followUps: () => (state.followUps !== null && state.followUps <= 2 && state.cycle >= 60 ? `A sale that takes ${cycleWord(state.cycle).toLowerCase()} with ${state.followUps === 0 ? 'no chases' : plural(state.followUps, 'chase', 'chases')}: most of the cycle passes unprompted.` : ''),
  reviews: () => ((state.reviews === 'none' || state.reviews === 'few') && (state.chooseThem ?? []).includes('trust') ? 'Under 10 reviews, and the people who chose someone else had not heard of you.' : ''),
  teamSize: () => (state.teamSize && state.now >= 1000 ? `${gbp(state.now / state.teamSize)} of revenue a month per person.` : ''),
  leadTime: () => (state.leadTime === 'month' && state.cycle !== null ? `First contact to first day: about ${count(state.cycle + 30)} days.` : ''),
  breaksFirst: () => (state.breaksFirst === 'me' && bindingIs('client_capacity') ? 'Mercer already sees capacity limiting growth first.' : ''),
  subcontract: () => (state.subcontract === 'yes' && state.capacity ? `Partners lift the ceiling Mercer draws at ${count(state.capacity)} ${M.unitWord?.(M.result?.unit) ?? 'jobs'} a month.` : ''),
  holiday: () => (state.holiday === 'stops' && state.who === 1 ? 'It stops and only you do the work: capacity is you.' : ''),
  hiring: () => (state.hiring === 'cant' && bindingIs('client_capacity') ? 'Capacity limits growth first and you cannot hire: the step left is a price rise.' : ''),
  fixedCosts: () => (state.fixedCosts && state.margin ? `Break-even is ${gbp(state.fixedCosts / state.margin)} a month in sales at ${Math.round(state.margin * 100)}p kept per £1.` : ''),
  terms: () => { const { terms, price, margin } = state; if (!price || margin === null || (terms !== 'thirty' && terms !== 'sixty')) return ''; return `Each sale costs ${gbp(price * (1 - margin))} to deliver, ${terms === 'sixty' ? '60 days or more' : 'up to 30 days'} before the customer pays.`; },
  // under a tenth of a month is said in days, so the figure never prints as "0 months"
  owed: () => { const { owed, now } = state; if (!owed || !now || owed < now / 30) return ''; const m = owed / now; return m < 0.95 ? `${gbp(owed)} is about ${plural(Math.round(m * 30), 'day', 'days')} of revenue.` : `${gbp(owed)} is ${pluralDp(m, 'month', 'months')} of revenue.`; },
  discounting: () => ((state.discounting === 'often' || state.discounting === 'always') && Math.round((state.margin ?? 0) * 100) >= 1 ? `A 10% discount on a ${Math.round(state.margin * 100)}p margin gives away ${pc(10 / Math.round(state.margin * 100))} of what you keep.` : ''),
  returnGap: () => { const per = { week: 52, month: 12, quarter: 4, year: 1 }[state.returnGap]; return per && state.price ? `At ${gbp(state.price)} a sale, a returning customer spends about ${gbp(state.price * per)} a year.` : ''; },
  // a lifetime value of one sale says nothing new (and "1 sales" is never printed)
  ltv: () => { const { ltv, price } = state; if (!ltv || !price) return ''; if (ltv < price) return warn(`Below your ${gbp(price)} sale price.`); return dp1(ltv / price) === '1' ? '' : `Worth ${dp1(ltv / price)} sales at your ${gbp(price)} price.`; },
  wontDo: () => ((state.wontDo ?? []).includes('cold') ? 'Cold outreach is off limits: Mercer brings that to the call.' : ''),
};
/** the question's own sentence: questions.js's word for a schema id when it has one, else the template here */
function ownInsight(id) {
  if (!done(id) && !answered(id)) return '';
  // Not sure with no engine stand-in: nothing was said, so nothing is printed
  if (state.notSure.has(id) && !standIn(id)) return '';
  if (isSchema(id)) {
    try { const w = M.schemaWord?.(id); if (w && (typeof w === 'string' ? w.trim() : w.text)) return w; } catch (e) { /* fall through */ }
  }
  const fn = LEAF[id];
  if (!fn) return '';
  try { return fn() ?? ''; } catch (e) { return ''; }
}
/* ---------- one sentence per answer, for the inspector and the report only (R8) ----------
   No sentence is painted after an answer in the main flow. The leaf sentences stay here as evidence: the inspector and the
   report read them through M.insightFor(id) */
const textOf = (v) => (typeof v === 'string' ? v.trim() : v?.text ?? '');
function insightFor(id) {
  try { return ownInsight(id); } catch (e) { return ''; }
}
M.insightFor = insightFor;
/* ---------- the section-boundary insight (R8): one at most, and only when it passes the test ----------
   A close screen shows only when the section produced one of three things: a contradiction between answers, a
   constraint the engine found, or a benchmark comparison the visitor's own figure differs from. Forty-five visible
   words at most; nothing generic. Benchmarks are UK figures and are named as such; outside GB they are left out */
const wordsIn = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
const MAX_WORDS = 45;
function sectionInsight(sectionId) {
  const ids = new Set(sectionQuestions(sectionId).filter((id) => state.asked.includes(id)));
  const fits = (text) => text && wordsIn(text) <= MAX_WORDS;
  // a contradiction between two answers in this section, in the words inconsistencies() gives it
  try {
    const hit = inconsistencies().find((x) => x.fix.some((id) => ids.has(id)) && !x.fix.every((id) => state.notSure.has(id)));
    if (hit && fits(hit.text)) return { kind: 'contradiction', text: hit.text, ids: hit.fix };
  } catch (e) { /* no contradiction */ }
  // a constraint the engine found on a question this section asked
  try {
    const m = M.measured;
    const c = (m?.constraints ?? []).find((x) => x.binding);
    const ownsLimit = { client_capacity: ['capacity', 'canDeliverMore', 'breaksFirst'], market_depletion: ['market', 'segment', 'channel', 'access'], channel_cap: ['channel'] }[c?.type] ?? [];
    if (c && ownsLimit.some((id) => ids.has(id))) {
      const when = c.bindsAtMonth ? monthName(c.bindsAtMonth) : null;
      const text = `${sentence(limitClause(c.type, { first: true }))}${when ? `, from ${when}` : ''}${ceilingWords(c.ceiling)}.`;
      if (fits(text)) return { kind: 'constraint', text, ids: ownsLimit.filter((id) => ids.has(id)) };
    }
    if (ids.has('market') && state.market !== null && state.market < 50) return { kind: 'constraint', text: `Under 50 prospects: outreach runs out inside the first month.`, ids: ['market'] };
    const cap = state.capacity, price = state.price ?? state.retainerValue ?? null;
    const served = state.servedNow ?? (state.now && price ? state.now / price : null);
    if (ids.has('capacity') && cap && served !== null && served >= cap) return { kind: 'constraint', text: `You already deliver about ${count(served)} a month against a capacity of ${count(cap)}: there is no room for more customers until that changes.`, ids: ['capacity'] };
  } catch (e) { /* no constraint */ }
  // a benchmark the visitor's own figure differs from: the UK industry figure, named as one
  if (ukBenchmarks()) {
    const bench = [
      ['price', () => { const t = typ('deal'); const p = state.price; if (!t || !p) return ''; const d = Math.abs(p / t - 1); return d >= 0.15 ? `Your ${gbp(p)} sale is ${pc(d)} ${p > t ? 'above' : 'below'} the UK figure for ${sectorWord()}, ${gbp(t)}.` : ''; }],
      ['retainer', () => { const t = typ('deal'); const p = state.retainerValue; if (!t || !p) return ''; const d = Math.abs(p / t - 1); return d >= 0.15 ? `Your ${gbp(p)} a month is ${pc(d)} ${p > t ? 'above' : 'below'} the UK figure for ${sectorWord()}, ${gbp(t)}.` : ''; }],
      ['closeRate', () => { const t = typ('close'); const c = state.closeRate; if (!t || c === null) return ''; return Math.abs(c - t) >= 0.1 ? `You close ${tenths(c)} in 10 enquiries; the UK figure for ${sectorWord()} is ${Math.max(1, Math.round(t * 10))} in 10.` : ''; }],
      ['margin', () => { const t = typ('margin'); const g = state.margin; if (!t || g === null) return ''; return Math.abs(g - t) >= 0.1 ? `You keep ${Math.round(g * 100)}p in the £1; the UK figure for ${sectorWord()} is ${Math.round(t * 100)}p.` : ''; }],
    ];
    for (const [id, fn] of bench) {
      if (!ids.has(id) || !answered(id)) continue;
      let text = '';
      try { text = fn(); } catch (e) { text = ''; }
      if (fits(text)) return { kind: 'benchmark', text, ids: [id] };
    }
  }
  return null;
}
M.sectionInsight = sectionInsight;
/** what a section stands on when its own sentence has nothing to say: the visitor's answers (the points the roots are
    drawn from) and the estimates the engine is running in place of the questions they left, whether with Not sure or
    with Next. Empty when the section holds neither: nothing answered and nothing the engine stands in for */
function standsOn(sectionId) {
  const own = dataPoints().filter((p) => sectionOf(p.id) === sectionId && (p.kind === 'you' || p.kind === 'web')).length;
  const est = state.asked.filter((id) => sectionOf(id) === sectionId && applies(id) && !state.na.has(id) && !answered(id) && standIn(id)).length;
  const part = LIMB_OF_SECTION[sectionId];
  const what = LIMBS.includes(part) ? 'This branch' : part === 'control' || part === 'crown' ? 'The trunk' : 'This root';
  if (own && est) return `${what} stands on ${count(own)} of your answers and ${count(est)} of Mercer’s estimates.`;
  if (own) return `${what} stands on ${count(own)} of your answers.`;
  if (est) return `${what} stands on ${count(est)} of Mercer’s estimates until you answer.`;
  return '';
}
/** the branch or root sentence at a section's close (COPY §7): the section's own sentence, or what it stands on (C10) */
function branchInsight(sectionId) {
  let own = '';
  try { own = branchWords(sectionId) ?? ''; } catch (e) { own = ''; }
  if (own) return own;
  try { return standsOn(sectionId); } catch (e) { return ''; }
}
function branchWords(sectionId) {
  const s = state;
  const m = M.measured;
  const has = (input) => Boolean(m?.entries?.some((x) => x.inputId === input));
  const el = (input) => Math.abs(m?.entries?.find((x) => x.inputId === input)?.elasticity ?? 0);
  // a move that would print as 0% is said in words
  const moves = (e) => (e * 10 >= 0.05 ? `moves the forecast ${oneDp(e * 10)}%` : 'does not move the forecast');
  const c = (type) => constraintOf(type);
  const unit = M.unitWord?.(M.result?.unit) ?? 'jobs';
  const binding = M.measured?.binding ?? M.planned?.binding ?? null;
  switch (sectionId) {
    case 'roots': {
      const r = rootCounts(dataPoints());
      const own = r.you + r.web, all = own + r.sector + r.assumed;
      return all && own / all >= 0.5 ? 'The tree stands mostly on your own answers.' : 'The tree stands mostly on Mercer’s estimates for now.';
    }
    case 'offer': {
      if (!has('acv')) return '';
      const e = el('acv');
      const top = [...(m.entries ?? [])].sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity))[0];
      if (e * 10 < 0.05) return 'A 10% change in your price does not move the forecast.';
      const word = top?.inputId === 'acv' ? 'this is the branch that grows most' : e >= E.FLOOR ? 'it grows' : 'it barely moves it';
      return `A 10% change in your price moves the forecast ${oneDp(e * 10)}%: ${word}.`;
    }
    case 'reach': {
      const k = c('market_depletion');
      if (!k) return '';
      const n = s.market ?? k.diagnostics?.addressableCount ?? null;
      const when = k.bindsAtMonth ? monthName(k.bindsAtMonth) : null;
      if (k.binding) return when && n ? `Your prospects are the first limit: ${count(n)} run out in ${when}.` : `${sentence(limitClause('market_depletion', { first: true }))}.`;
      // the engine gives a month to a limit that is not the first one, too: prospects can run out after another limit has bitten
      if (when) return `Your prospects run out in ${when}${binding && binding !== 'market_depletion' ? `; ${limitClause(binding, { first: true })}` : ''}.`;
      return 'Your prospects do not run out inside twelve months.';
    }
    case 'routes': {
      const n = (s.doing ?? []).length;
      if (!n) return '';
      // routes Mercer forecasts, counted as routes (two content routes share one engine channel and are still two routes)
      const mm = s.doing.filter((id) => DIST_BY[id]?.engine).length;
      if (mm === n) return n === 1 ? 'Mercer forecasts your one route.' : `Mercer forecasts all ${count(n)} of your routes.`;
      if (mm === 0) return n === 1 ? 'Mercer does not forecast your one route; it goes to the call.' : `Mercer forecasts none of your ${count(n)} routes; they go to the call.`;
      return `Of your ${count(n)} routes Mercer forecasts ${count(mm)}; the rest go to the call.`;
    }
    case 'close': {
      const k = s.cycle !== null ? Math.max(1, Math.round(s.cycle / 30.44)) + 1 : null;
      const a = has('statedCloseRate') ? `Close rate: a 10% change ${moves(el('statedCloseRate'))}.` : '';
      const b = k ? `Money spent this month lands in month ${k}.` : '';
      return [a, b].filter(Boolean).join(' ');
    }
    case 'delivery': {
      const k = c('client_capacity');
      if (bindingIs('client_capacity') && k) return `Capacity limits growth first${k.bindsAtMonth ? `, from ${monthName(k.bindsAtMonth)}` : ''}${ceilingWords(k.ceiling)}.`;
      const price = s.price ?? s.retainerValue ?? typ('deal');
      const served = s.servedNow ?? (s.now && price ? s.now / price : null);
      if (s.capacity && served !== null && s.capacity > served) { const more = count(s.capacity - served); return `There is room: ${more === '1' ? 'one more' : `${more} more ${unit}`} a month before delivery limits growth.`; }
      return has('serviceRatePerServerPerMonth') ? `A 10% change in your capacity ${moves(el('serviceRatePerServerPerMonth'))}.` : '';
    }
    case 'money': {
      if (s.margin === null || !(s.margin > 0)) return '';
      const p = Math.round(s.margin * 100);
      const pb = M.planned?.payback?.p50;
      if (M.planned && s.budget && pb !== null && pb !== undefined && Number.isFinite(pb) && count(pb) !== '0') return `You keep ${p}p in the £1 and spend ${gbp(s.budget)} a month on growth: pays back in ${plural(pb, 'month', 'months')} on the current plan.`;
      if (s.fixedCosts) return `${p}p kept; break-even ${gbp(s.fixedCosts / s.margin)} a month.`;
      return '';
    }
    case 'clients': {
      if (!answered('lastFive')) return '';
      // only what the five best prove: three or more from one side is "most" of them (C25, C41). No share of growth is claimed
      const k = warmCount(), cold = coldCount();
      const r = s.repeat === null ? null : Math.round(s.repeat * 10);
      const head = `${k === 0 ? 'None' : count(k)} of your five best came warm${r !== null && r >= 1 ? ` and ${r} in 10 return` : ''}`;
      const tail = k >= 3 ? 'most of your best clients were already in the room' : cold >= 3 ? 'most of your best clients had to be found' : '';
      return tail ? `${head}: ${tail}.` : `${head}.`;
    }
    case 'you': {
      if (s.hours === null || !(s.hours > 0) || !s.personality) return '';
      const a = M.archetypes?.pick?.(s.personality);
      const first = (M.letterMeans?.(s.personality[0]) ?? '').split(/[.,;:]/)[0].trim();
      if (!a?.name || !first) return '';
      return `${plural(s.hours, 'hour', 'hours')} a week, ${a.name}: the plan leads with ${first.charAt(0).toLowerCase()}${first.slice(1)}.`;
    }
    case 'ground': {
      const { network: n, listSize: l, market: mk } = s;
      if (n === null || l === null || !mk || !(n + l > 0)) return '';
      // a side with nobody on it is left out of the sentence: no "0 contacts"
      const warmSide = [n > 0 ? plural(n, 'introducer', 'introducers') : '', l > 0 ? plural(l, 'contact', 'contacts') : ''].filter(Boolean).join(' and ');
      return `${warmSide} against ${plural(mk, 'prospect', 'prospects')}: the warm side is ${pc((n + l) / mk)} of the cold side.`;
    }
    default: return '';
  }
}
M.branchInsight = branchInsight;
/** the one sentence at the end (COPY §8), from the plan at the visitor's own budget */
function overallInsight() {
  const p = M.planned;
  if (!p) return '';
  const m = clamp(state.months ?? 12, 1, 12);
  const sorted = p.months[m - 1];
  // the range is rounded outward, as the Range line under it is, so it is never narrower than the runs say
  const p25 = down(qAt(sorted, 0.25)), p75 = up(qAt(sorted, 0.75));
  const name = state.biz?.trim() || 'Your business';
  const when = monthName(m);
  const lim = (p.constraints ?? []).find((c) => c.binding);
  const limitPart = lim ? limitClause(lim.type, { first: true }) : 'nothing limits growth inside twelve months';
  const top = rankedLevers()[0];
  const topPart = top ? `${midName(top.title)} returns most` : '';
  // no growth spend (the dial at None): said in words, never as a £0 budget that buys nothing
  if (state.appetite === 'none') return `${name} plans no growth spend, so revenue is carried flat at ${gbp(p.base)} a month to ${when}${topPart ? `; ${topPart}` : ''}.`;
  if (state.basis === 'budget' || !state.goal) {
    const lo = down(qAt(sorted, 0.25) - p.base), hi = up(qAt(sorted, 0.75) - p.base);
    const whose = state.budget !== null ? `${name}’s growth budget` : 'Mercer’s default growth budget';
    const buys = hi <= 0 ? 'buys no extra revenue' : `buys ${lo > 0 ? `${gbp(lo)} to ${gbp(hi)}` : `up to ${gbp(hi)}`} more revenue`;
    return `${whose} of ${gbp(p.budget)} a month ${buys} by ${when} in half of ${count(sorted.length)} runs; ${limitPart}${topPart ? `; ${topPart}` : ''}.`;
  }
  const G = state.goal;
  // "short" here is the top of the half-range to the target, and the sentence says so: the cutscene's "short" is the middle run's
  const pos = G <= p25 ? `, above the ${gbp(G)} target` : G > p75 ? `, and the top of that range is ${gbp(G - p75)} short of the ${gbp(G)} target` : `, around the ${gbp(G)} target`;
  return `${name} reaches ${gbp(p25)} to ${gbp(p75)} a month by ${when} in half of ${count(sorted.length)} runs${pos}; ${limitPart}${topPart ? `; ${topPart}` : ''}.`;
}
M.overallInsight = overallInsight;

/* ============ the ladder: the path to target, on the main thread in idle chunks ============ */
const LEVER_TITLE = [
  [/add one .*server/i, 'Add one person', 'who'],
  [/service rate|capacity/i, 'Deliver more per person', 'capacity'],
  [/budget/i, 'Raise the growth budget', 'budget'],
  [/deal value|price|acv/i, 'Raise your price', 'price'],
  [/close rate/i, 'Close more enquiries', 'closeRate'],
  [/mailbox|seat/i, 'Add sending mailboxes', null],
  [/market|addressable|criteria|trigger/i, 'Find more prospects', 'market'], // D1: one name, prospects; the same title in canopy.js
  [/margin/i, 'Raise your margin', 'margin'],
  [/retention/i, 'Keep customers longer', 'retention'],
];
const leverInfo = (text) => { const hit = LEVER_TITLE.find(([re]) => re.test(text)); return hit ? { title: hit[1], key: hit[2] } : { title: text.charAt(0).toUpperCase() + text.slice(1), key: null }; };
const DIFF_W = { low: 1, medium: 2, high: 3 };
/** the plan's upward levers ranked by revenue added per unit of difficulty */
function rankedLevers(p = M.planned) {
  if (!p?.levers) return [];
  const floor = Math.max(1, 0.02 * Math.abs(p.added?.p50 ?? 0));
  return p.levers.filter((l) => l.direction === 'up' && Math.abs(l.magnitude) >= floor)
    .map((l) => ({ ...l, ...leverInfo(l.lever), w: DIFF_W[l.difficulty] ?? 2 }))
    .map((l) => ({ ...l, points: Math.abs(l.magnitude) / l.w }))
    .sort((a, b) => b.points - a.points)
    .map((l, i) => ({ ...l, rank: i + 1 }));
}
M.rankedLevers = rankedLevers;
/** the funnel sentence: sales to one decimal below ten, each noun agreeing with its figure ("1 more sale"), and no part
    that would print as 0 */
function funnelLine(f) {
  if (!f || !(f.sales >= 0.05)) return '';
  const part = (v, single, many) => (v >= 0.05 ? plural(v, single, many) : '');
  const parts = [plural(f.sales, 'more sale', 'more sales'), part(f.meetings, 'held meeting', 'held meetings'), part(f.leadsNeeded, 'positive reply', 'positive replies')].filter(Boolean);
  return `That is ${parts.join(', ')} a month.`;
}
M.funnelLine = funnelLine;
const ladders = new Map();
const p50At = (r, m) => Math.round(qAt(r.months[m - 1], 0.5));
const p90At = (r, m) => Math.round(qAt(r.months[m - 1], 0.9));
const reachAt = (r, m, g) => (g ? reach(r.months[m - 1], g) / r.months[m - 1].length : 1);
/* the appetite levels in words. Mercer's default budget rule is the engine's own: £500 or 5% of revenue, the larger */
const defaultBudget = (now) => Math.max(500, 0.05 * now);
const LEVEL_WORD = { none: 'None', boutique: 'Boutique', moderate: 'Moderate', aggressive: 'Aggressive', maximum: 'Maximum' };
const SOURCE = {
  none: 'no growth spend',
  boutique: 'Mercer’s default budget rule',
  moderate: () => `a quarter of your gross profit (Mercer’s fixed rule; margin ${state.margin !== null ? 'yours' : 'Mercer’s estimate'})`,
  aggressive: 'the smallest budget whose middle run reaches your target',
  maximumSpent: 'the budget past which spend stops adding',
  maximumBest: 'the highest middle run among every budget Mercer ran',
};
function ladder() {
  const key = keyOf();
  if (ladders.has(key)) return ladders.get(key);
  const promise = new Promise((resolve) => {
    const m = clamp(state.months ?? 12, 1, 12);
    const now = state.now;
    if (!(state.sector && now)) { resolve(null); return; }
    const goal = state.appetite === 'none' || state.basis === 'budget' ? null : state.goal;
    const steps = [];
    let i = 0;
    const run = (fn) => steps.push(fn);
    // a step that must follow the one running now, before anything queued after it
    const soon = (fn) => steps.splice(i, 0, fn);
    const L = { key, gap: 0, onCourse: true, bStar: null, bStarRung: null, noBudget: null, monthP50: null, monthHalf: null, rungs: [], funnel: null, capacityCheck: null, levers: [], appetite: {}, ownBudget: null, ownGiven: false };
    let base, plan, ownBudget;
    const forecastAt = (over) => { const t0 = performance.now(); const r = forecastFor(key, over); r.computeMs = r.computeMs ?? Math.round(performance.now() - t0); return r; };
    const rung = (b, r) => ({ budget: b, p50: Array.from({ length: 12 }, (_, i) => p50At(r, i + 1)), reach: Array.from({ length: 12 }, (_, i) => reachAt(r, i + 1, goal)), p90: Array.from({ length: 12 }, (_, i) => p90At(r, i + 1)), unspent: 0, unspentReason: '', binding: null, bindsAtMonth: null, ceiling: null, computeMs: r.computeMs ?? 0 });
    /** what the plan at one budget says limits it, written onto that rung */
    const planOnto = (rg) => {
      const pl = E.plan(askOf({ budget: rg.budget }), new Date().toISOString());
      tallyOf(key).plans += 1;
      const c = (pl.constraints ?? []).find((x) => x.binding);
      rg.unspent = pl.unspent ?? 0; rg.unspentReason = pl.unspentReason ?? ''; rg.binding = pl.binding ?? null; rg.bindsAtMonth = c?.bindsAtMonth ?? null; rg.ceiling = c?.ceiling ?? null;
      rg.binderName = LIMIT_NAME[pl.binding] ?? null;
      return pl;
    };
    run(() => {
      base = freshResult() ?? forecastAt({});
      plan = ensurePlanned();
      ownBudget = state.appetite === 'none' ? 0 : state.budget ?? plan.budget ?? defaultBudget(now);
      // whose figure the own budget is: "you said" is only ever printed for a budget the visitor typed
      L.ownBudget = ownBudget; L.ownGiven = state.appetite !== 'none' && state.budget !== null;
      const own = rung(ownBudget, base);
      own.unspent = plan.unspent ?? 0; own.unspentReason = plan.unspentReason ?? ''; own.binding = plan.binding ?? null;
      const c = (plan.constraints ?? []).find((x) => x.binding);
      own.bindsAtMonth = c?.bindsAtMonth ?? null; own.ceiling = c?.ceiling ?? null;
      L.rungs.push(own);
      L.gap = goal ? Math.max(0, goal - p50At(base, m)) : 0;
      L.onCourse = L.gap <= 0;
      if (goal) {
        for (let k = 1; k <= 12; k++) { if (L.monthP50 === null && p50At(base, k) >= goal) L.monthP50 = k; if (L.monthHalf === null && reachAt(base, k, goal) >= 0.5) L.monthHalf = k; }
      }
    });
    /* the budget ladder: the own budget is the first rung, and each rung after it doubles the last, up to 100 x revenue
       (the engine's own warning line) or until the middle run stops rising. Reaching the target does not stop the climb:
       Maximum needs the rungs above it. The smallest budget that reaches the target is then found by bisection */
    let rungs = [], lastP50 = -1, b = 0, stalled = false;
    const cap = 100 * now;
    const step = () => {
      // the first rung above the own budget: double it, and never start under Mercer's default (a very small own budget
      // would spend its twelve rungs before it got anywhere)
      if (b === 0) { b = ownBudget > 0 ? Math.max(ownBudget * 2, defaultBudget(now)) : defaultBudget(now); lastP50 = L.rungs[0]?.p50[m - 1] ?? -1; }
      if (b > cap || stalled || rungs.length >= 12) return false;
      const rg = rung(b, forecastAt({ budget: b }));
      rungs.push(rg);
      const p = rg.p50[m - 1];
      if (lastP50 >= 0 && p <= lastP50 * 1.005) stalled = true;
      lastP50 = Math.max(lastP50, p);
      b *= 2;
      return !stalled;
    };
    const climb = () => { if (step()) soon(climb); };
    run(climb);
    run(() => {
      L.rungs.push(...rungs);
      if (!goal || L.onCourse) return;
      const at = L.rungs.findIndex((r) => r.p50[m - 1] >= goal);
      if (at < 0) {
        // no budget reaches it: the last rung's plan names what holds it. The figure is the highest middle run any rung
        // reached, a month's revenue like the target beside it, never the constraint's twelve-month ceiling (C32)
        const last = L.rungs[L.rungs.length - 1];
        if (last) {
          const pl = planOnto(last);
          L.noBudget = { binder: pl.binding ?? null, ceiling: Math.max(...L.rungs.map((r) => r.p50[m - 1])), binderName: LIMIT_NAME[pl.binding] ?? 'The forecast itself' };
        }
        return;
      }
      // bisect between the rung under the first one that reaches the goal, and that one
      const hit = L.rungs[at], under = L.rungs[at - 1] ?? null;
      let lo = under ? under.budget : 0, hi = hit.budget, best = hit;
      const bis = (n) => {
        if (n <= 0 || hi - lo < Math.max(25, hi * 0.03)) {
          L.bStar = Math.round(best.budget);
          planOnto(best);
          L.bStarRung = best;
          return;
        }
        const midB = Math.round((lo + hi) / 2);
        const r = rung(midB, forecastAt({ budget: midB }));
        if (r.p50[m - 1] >= goal) { hi = midB; best = r; } else lo = midB;
        soon(() => bis(n - 1));
      };
      soon(() => bis(7));
    });
    // the funnel in the engine's units, the capacity check, the levers with their restraints
    run(() => {
      const acv = plan.acv, close = plan.close;
      const leads = plan.leads ?? [];
      const sumLeads = leads.reduce((a, x) => a + (Number(x) || 0), 0);
      const perLead = sumLeads > 0 ? (plan.added?.p50 ?? 0) / sumLeads : null;
      // a gap under a twentieth of one sale has no funnel to print: "0 more sales" beside held meetings never appears
      if (L.gap > 0 && acv && close && L.gap / acv >= 0.05) {
        L.funnel = { sales: L.gap / acv, meetings: L.gap / acv / close, leadsPlan: leads[m - 1] ?? null, leadsNeeded: perLead ? L.gap / perLead : null };
        L.funnel.line = funnelLine(L.funnel);
      }
      /* the capacity check (C34). plan.capacity is the whole business's capacity a month, so people do not multiply it again.
         The knee and today's load are the engine's own, from the client_capacity constraint: room is what is left under the knee */
      if (goal && acv && (plan.unit === 'clients' || M.result?.unit === 'clients')) {
        const d = (plan.constraints ?? []).find((c) => c.type === 'client_capacity')?.diagnostics;
        const total = d?.monthlyMeetingCapacity || plan.capacity;
        if (total) {
          const knee = d?.utilisationKnee ?? 0.85;
          const load = plan.servedNow ?? d?.existingMonthlyLoad ?? 0;
          L.capacityCheck = { clients: goal / acv, room: knee * total - load, limit: knee * total, load };
        }
      }
      const binder = plan.binding ?? null;
      L.levers = rankedLevers(plan).map((l) => ({ title: l.title, lever: l.lever, magnitude: Math.round(Math.abs(l.magnitude)), difficulty: l.difficulty, rank: l.rank, points: Math.round(l.points), key: l.key, restraint: '', restraintType: null, restraintMonth: null, restraintCeiling: null }));
      L.levers.forEach((l, i) => run(() => {
        const relaxes = { who: 'client_capacity', capacity: 'client_capacity', market: 'market_depletion' }[l.key];
        if (binder && relaxes === binder) { l.restraint = `lifts ${midName(LIMIT_NAME[binder])}`; l.restraintType = binder; return; }
        const over = {};
        const cur = (k, fallback) => (state[k] !== null && state[k] !== undefined ? state[k] : fallback);
        if (l.key === 'who') over.who = (cur('who', plan.people) || 1) + 1;
        else if (l.key === 'capacity') over.capacity = cur('capacity', plan.capacity) * 1.1;
        else if (l.key === 'budget') over.budget = cur('budget', plan.budget) * 1.1;
        else if (l.key === 'price') over.price = cur('price', plan.acv) * 1.1;
        else if (l.key === 'closeRate') over.closeRate = Math.min(0.95, cur('closeRate', plan.close) * 1.1);
        else if (l.key === 'market') over.market = cur('market', plan.market) * 1.1;
        else if (l.key === 'margin') over.margin = Math.min(0.98, cur('margin', plan.margin) * 1.1);
        else if (l.key === 'retention') over.retention = cur('retention', plan.retention) * 1.1;
        else { l.restraint = 'none inside a year'; return; }
        try {
          const mm = E.measure(askOf(over));
          tallyOf(key).measures += 1;
          const c = (mm.constraints ?? []).find((x) => x.binding);
          if (!c) { l.restraint = 'none inside a year'; return; }
          const month = c.bindsAtMonth ? monthName(c.bindsAtMonth) : null;
          l.restraintType = c.type; l.restraintMonth = month; l.restraintCeiling = c.ceiling ?? null;
          l.restraint = `${restraintClause(c.type, month)}${ceilingWords(c.ceiling)}`;
        } catch (e) { l.restraint = 'none inside a year'; }
      }));
    });
    /* the five stops. Budgets never fall from one level to the next: a level whose own rule gives less than the level before
       it is lifted to that level, and its source says so. A budget is a ceiling, so a level's middle run is the best run
       Mercer made at or under it: where more spend adds nothing, the source says past which budget. Middle runs then rise
       (or hold) left to right by construction, and Maximum is the highest of all */
    run(() => {
      const marginV = state.margin ?? M.result?.bank?.margin?.value ?? plan.margin ?? null;
      const made = [];
      const note = (budget, p50, p90) => { const x = { budget: Math.round(budget), p50, p90 }; if (Number.isFinite(p50) && !made.some((y) => y.budget === x.budget)) made.push(x); return x; };
      L.rungs.forEach((r) => note(r.budget, r.p50[m - 1], r.p90[m - 1]));
      if (L.bStarRung) note(L.bStarRung.budget, L.bStarRung.p50[m - 1], L.bStarRung.p90[m - 1]);
      // one run per budget: a budget Mercer has already run is read, never run twice
      const at = (budget) => made.find((x) => x.budget === Math.round(budget)) ?? (() => { const r = forecastAt({ budget }); return note(budget, p50At(r, m), p90At(r, m)); })();
      const bestWithin = (budget) => made.filter((x) => x.budget > 0 && x.budget <= Math.round(budget)).reduce((a, x) => (a === null || x.p50 > a.p50 || (x.p50 === a.p50 && x.budget < a.budget) ? x : a), null);
      /** a level at one budget: its own run, or the best run under that ceiling when more spend adds nothing */
      const level = (budget, source) => {
        const own = at(budget), w = bestWithin(budget) ?? own;
        if (w.p50 > own.p50) return { budget: own.budget, source: `${source}; spend past ${gbp(w.budget)} adds nothing to the middle run`, p50: w.p50, p90: w.p90, heldAt: w.budget };
        return { budget: own.budget, source, p50: own.p50, p90: own.p90 };
      };
      const lifted = (prev, word, why) => ({ budget: prev.budget, source: `the same as ${word}: ${why}`, p50: prev.p50, p90: prev.p90, lifted: true });
      const none = forecastAt({ budget: 0, appetite: 'none' });
      L.appetite.none = { budget: 0, source: SOURCE.none, p50: p50At(none, m), p90: p90At(none, m) };
      let prev = L.appetite.boutique = level(defaultBudget(now), SOURCE.boutique), prevWord = LEVEL_WORD.boutique;
      if (marginV) {
        const want = Math.round(0.25 * now * marginV);
        L.appetite.moderate = want > prev.budget ? level(want, SOURCE.moderate()) : lifted(prev, prevWord, `a quarter of your gross profit ${want < prev.budget ? 'is less than' : 'matches'} Mercer’s default`);
        prev = L.appetite.moderate; prevWord = LEVEL_WORD.moderate;
      } else L.appetite.moderate = null;
      if (L.bStar) {
        L.appetite.aggressive = L.bStar > prev.budget ? level(L.bStar, SOURCE.aggressive) : lifted(prev, prevWord, `${gbp(L.bStar)} a month already reaches your target on the middle run`);
        prev = L.appetite.aggressive; prevWord = LEVEL_WORD.aggressive;
      } else L.appetite.aggressive = null;
      const best = made.filter((x) => x.budget > 0).reduce((a, x) => (a === null || x.p50 > a.p50 || (x.p50 === a.p50 && x.budget < a.budget) ? x : a), null);
      const spent = stalled || L.rungs.some((r) => r.unspent > 0);
      if (!best) L.appetite.maximum = null;
      else if (best.budget >= prev.budget) L.appetite.maximum = { budget: best.budget, source: spent ? SOURCE.maximumSpent : SOURCE.maximumBest, p50: best.p50, p90: best.p90 };
      else L.appetite.maximum = { budget: prev.budget, source: `the same as ${prevWord}: spend past ${gbp(best.budget)} adds nothing to the middle run`, p50: Math.max(prev.p50, best.p50), p90: prev.p50 >= best.p50 ? prev.p90 : best.p90, lifted: true };
    });
    const tick = () => {
      if (i >= steps.length) { resolve(L); dispatch('mercer:ladder', { key, ladder: L }); return; }
      const fn = steps[i++];
      try { fn(); } catch (e) { /* a rung that fails is a rung that is missing */ }
      idle(tick);
    };
    idle(tick);
  });
  ladders.set(key, promise);
  promise.then((L) => { if (L) ladderDone.set(key, L); });
  return promise;
}
/* a step's restraint, in the limit vocabulary. canopy.js reads the limit back out of these words (its restraintWords), so the
   routes clause names "your routes" where D2's subject phrase alone ("route sending capacity") would read as capacity there */
const restraintClause = (type, month) => (type === 'channel_cap' ? `the sending capacity of your routes limits growth ${month ? `from ${month}` : 'now'}` : limitClause(type, { month }));
const ladderDone = new Map();
M.ladder = ladder;
/** the budget one appetite level uses: None and Boutique at once, the others once the ladder has landed. In step with
    the ladder's five stops: once it has landed every level is read from it, lifted levels and their words included */
function appetiteBudget(level) {
  const now = state.now;
  const L = ladderDone.get(keyOf());
  const m = clamp(state.months ?? 12, 1, 12);
  const from = (a, line) => ({ budget: a.budget, source: a.source, ready: true, p50: a.p50, p90: a.p90, lifted: Boolean(a.lifted), line: line ?? `${gbp(a.budget)}${a.lifted ? ',' : ':'} ${a.source}` });
  if (level === 'none') return { budget: 0, source: SOURCE.none, ready: true, line: 'No growth spend: revenue carried flat' };
  if (level === 'boutique') {
    const a = L?.appetite?.boutique;
    if (a) return from(a, a.heldAt ? undefined : `${gbp(a.budget)}: Mercer’s default rule`);
    const b = now ? defaultBudget(now) : null;
    return { budget: b, source: SOURCE.boutique, ready: b !== null, line: b !== null ? `${gbp(b)}: Mercer’s default rule` : '' };
  }
  if (level === 'moderate') {
    const a = L?.appetite?.moderate;
    if (a) return from(a);
    return { budget: null, source: 'a quarter of your gross profit', ready: false, line: 'a quarter of gross profit: the figure arrives at the crown' };
  }
  if (level === 'aggressive') {
    if (L) {
      // no target (or the dial at None, which plans to none): Aggressive has nothing to reach
      if (!state.goal || state.appetite === 'none') return { budget: null, source: SOURCE.aggressive, ready: true, line: '' };
      const a = L.appetite?.aggressive;
      if (a) return from(a, a.lifted || a.heldAt ? undefined : `${gbp(a.budget)}: the smallest budget whose middle run reaches ${gbp(state.goal)} by month ${m}`);
      if (L.onCourse && state.goal) return { budget: L.rungs[0]?.budget ?? state.budget ?? 0, source: 'on course at your own budget', ready: true, line: `${gbp(L.rungs[0]?.budget ?? 0)}: the middle run already reaches ${gbp(state.goal)} by month ${m}` };
      if (L.noBudget) return { budget: null, source: L.noBudget.binderName, ready: true, line: `no budget reaches ${gbp(state.goal ?? 0)} by month ${m}: ${L.noBudget.binder ? limitClause(L.noBudget.binder, { first: true }) : midName(L.noBudget.binderName ?? 'the forecast itself')}` };
    }
    return { budget: null, source: SOURCE.aggressive, ready: false, line: 'the smallest budget that reaches your target: the figure arrives at the crown' };
  }
  const a = L?.appetite?.maximum;
  if (a) return from(a);
  return { budget: null, source: SOURCE.maximumSpent, ready: false, line: 'where spend stops adding: the figure arrives at the crown' };
}
M.appetiteBudget = appetiteBudget;

/* ============ the stages ============
   arrival → orient → section (aim, foundations, customers, delivery, leverage, with a close screen only when the section
   earned one) → planting after foundations → the readiness screen (S09) → cutscene (the recap) → explore → plan.
   The old stage ids stay callable: 'roots' opens the walk, 'harvest' is 'plan' */
let history = [];
let askId = null;
let moving = false;
let cutRun = 0;
let cutReplay = false;
let planted = false;
/* the first plan was offered at a section boundary (S09); refining is "Refine the uncertain parts" chosen */
let readyOffered = false;
let refining = false;
/* a section asked for from the homepage before orientation was acknowledged: shown after Continue */
let wanted = null;
/* a question opened again from the crown (M.reopen): { id, section } while it is on screen. Continue, Not sure and
   Back all lead back to explore with that section's card open, never on through the interview */
let reopened = null;
/* a question jumped back to during the interview (the inspect chip's Change, or a section opened for review from the
   wheel): { id, section, from }, where `from` is the place the visitor was. Continue, Not sure and Back all lead back there */
let jumped = null;
Object.defineProperty(M, 'stage', { get: () => state.stage, configurable: true });
/* one move at a time (R7, C03). A press on Continue, Back or Not sure that lands while the last one is still moving is
   dropped. The lock runs from the press to the moment the new screen is mounted, and not one tick longer: there is no
   timer. M.moving lets a walker wait for the mount */
async function guarded(fn) {
  if (moving) return false;
  moving = true;
  try { await fn(); } finally { moving = false; }
  return true;
}
/** a stage move asked for in code (M.go) always runs; it takes the lock when the lock is free */
async function locked(fn) {
  if (moving) { await fn(); return; }
  moving = true;
  try { await fn(); } finally { moving = false; }
}
Object.defineProperty(M, 'moving', { get: () => moving, configurable: true });
/* the question on screen, for walkers and the shell */
Object.defineProperty(M, 'askId', { get: () => askId, configurable: true });
const setStage = (stage) => {
  state.stage = stage;
  document.body.dataset.stage = stage;
  themeTree(false);
  // the discs belong to explore and the plan: any other stage takes them off the tree
  if (!LATE.has(stage)) T((t) => t.setDiscs?.([]));
  T((t) => t.setView?.(LATE.has(stage) ? 'plan' : 'current'));
  dispatch('mercer:stage', { stage, section: state.section, route: state.route });
  paintCore();
};
const setSection = (sec) => { state.section = sec; document.body.dataset.section = sec ?? ''; };
const secName = () => SECTION_BY[state.section]?.name ?? '';
const limbAnchorX = (limb) => {
  const a = T((t) => t.anchor?.(labelPart(limb ?? 'roots')));
  return a ? clamp(a.x / window.innerWidth, 0, 1) : 0.6;
};
const ORIENT_VERSION = 1;
/* ---------- the route (R1) ---------- */
function setRoute(route, o = {}) {
  if (!ROUTE_IDS.includes(route)) return state.route;
  const was = state.route;
  state.route = route;
  applyRoute();
  if (was && was !== route) {
    // a switch after S02 keeps every shared answer; the sections of the new route pick up from the aim
    readyOffered = false; refining = false; closed.clear(); reached = {};
    bump('route', 'route');
  }
  paintRing();
  dispatch('mercer:route', { route, from: was });
  return route;
}
M.setRoute = setRoute;
/** the small route switch offered after S02 (brief 7): an owner who wants a new venture, or the reverse */
M.switchRoute = async (route) => {
  if (!ROUTE_IDS.includes(route) || route === state.route) return false;
  setRoute(route);
  if (state.stage === 'section' || state.stage === 'close' || state.stage === 'ready') await locked(() => enterSection(firstOpenSection() ?? 'aim', 'switch'));
  return true;
};
/** the first section with a question still to ask in the current pass, else the plan */
function firstOpenSection() {
  return INTERVIEW.find((sec) => sectionQueue(sec).next.length > 0) ?? null;
}
async function go(stage, section) {
  if (stage === 'harvest') stage = 'plan';
  if (stage === 'recap') stage = 'cutscene';
  if (stage === state.stage && (section === undefined || section === state.section)) return;
  const from = state.stage;
  // a stage asked for in code ends a jump back: there is no longer a place to return to
  jumped = null;
  if (stage === 'arrival') { setSection(null); setStage('arrival'); T((t) => t.frame?.('arrival')); paintArrival(); return; }
  if (stage === 'intro') {
    // the introduction is optional help now (R14); a replay from inside a live session holds the step it was asked from
    // so the walk comes back to the same question with the same draft (Task 01)
    if (M.session?.live?.() && !M.session.held()) M.session.hold('intro');
    setStage('intro');
    M.intro?.open?.();
    return;
  }
  if (stage === 'orient') {
    if (!state.route) setRoute('owner');
    setSection(null);
    setStage('orient');
    const box = $('#orient-save'); if (box && 'checked' in box) box.checked = Boolean(save.on);
    return;
  }
  // the old intro's way into the walk, and any caller that names the old first stage
  if (stage === 'roots') { stage = 'section'; section = section ?? firstOpenSection() ?? 'aim'; }
  if (stage === 'section' || stage === 'close' || stage === 'planting' || stage === 'ready') {
    if (!state.route) setRoute('owner');
    // a fresh journey cannot pass orientation (R14): it is shown first and the section waits behind its Continue
    if (!state.orientAck && (from === 'arrival' || from === 'orient' || from === 'intro')) { wanted = section ?? null; if (from !== 'orient') await go('orient'); return; }
  }
  if (stage === 'section') { await locked(() => enterSection(section ?? firstOpenSection() ?? 'aim', from)); return; }
  if (stage === 'close') { await locked(() => enterClose()); return; }
  if (stage === 'planting') { await locked(() => plant()); return; }
  if (stage === 'ready') { await locked(() => enterReady()); return; }
  // the results: a question opened again from the crown is no longer on screen
  reopened = null;
  if (stage === 'cutscene') {
    setSection('plan');
    setTint('--sec-crown');
    // a replay from the crown or the plan: the open card closes, the run stays as it is
    if (LATE.has(from)) { try { M.canopy?.closeCard?.(true); } catch (e) { /* optional */ } }
    freshPlan();
    const run = ++cutRun;
    cutReplay = LATE.has(from);
    const t0 = performance.now();
    setStage('cutscene');
    paintRing();
    ladder();
    T((t) => t.setLabel?.('crown', ''));
    try { M.feel?.birds?.fade?.(0, 1200); } catch (e) { /* optional */ }
    // The stage stays "cutscene" until canopy signals the end: it calls M.go('explore') after the last beat or on Skip.
    // canopy also starts the scene from mercer:stage, so the call below may return a promise that is already settled;
    // a promise that settles inside the first second is not the end
    if (!M.canopy?.cutscene) { go('explore'); return; }
    const ended = () => { if (run === cutRun && state.stage === 'cutscene' && performance.now() - t0 > 1000) go('explore'); };
    let p = null;
    try { p = M.canopy.cutscene(); } catch (e) { go('explore'); return; }
    if (p && typeof p.then === 'function') p.then(ended, ended);
    return;
  }
  if (stage === 'explore') {
    setSection('plan');
    setTint('--sec-crown');
    freshPlan();
    setStage('explore');
    // canopy's enter() frames the crown once; after a replay or the plan the camera comes back here
    if (cutReplay || from === 'plan') T((t) => t.frame?.('explore'));
    cutReplay = false;
    paintRing();
    try { M.feel?.birds?.fade?.(1, 2000); } catch (e) { /* optional */ }
    M.canopy?.enter?.();
    return;
  }
  if (stage === 'plan') {
    setSection('plan');
    setTint('--sec-crown');
    freshPlan();
    setStage('plan');
    T((t) => t.frame?.(hasPreset('plan') ? 'plan' : 'harvest'));
    paintRing();
  }
}
M.go = go;
/** the plan and the run, current for this revision before anything is displayed (C06): the engine's run, measure and
    plan are keyed on the inputs; plan.js's object is rebuilt when its revision is behind */
function freshPlan() {
  freshResult();
  if (state.sector && state.now) { ensureMeasured(); ensurePlanned(); }
  try {
    if (typeof M.plan?.build === 'function') {
      const cur = typeof M.plan.current === 'function' ? M.plan.current() : null;
      const stale = !cur || cur.stale || ((cur.plan ?? cur).revision !== undefined && (cur.plan ?? cur).revision !== revision);
      if (stale) M.planObj = M.plan.build(state);
      else M.planObj = cur.plan ?? cur;
    }
  } catch (e) { /* plan.js reports its own faults */ }
  paintTree();
  return M.planObj ?? null;
}
M.freshPlan = freshPlan;
/* ---------- the homepage (R12) ---------- */
function paintArrival() {
  // a session held on this page comes back whether or not anything was saved: the answers are still in memory (Task 01)
  const has = save.hasSaved() || Boolean(M.session?.held?.());
  const r = $('#resume'); if (r) r.hidden = !has;
  const s = $('#restart'); if (s) s.hidden = !has;
}
/** orientation's Continue: the journey starts at the aim (or the section asked for before orientation) */
async function start() {
  state.orientAck = ORIENT_VERSION;
  if (!state.route) setRoute('owner');
  const sec = wanted ?? firstOpenSection() ?? 'aim';
  wanted = null;
  if (state.stage === 'orient' || state.stage === 'arrival') await go('section', sec);
}
M.start = start;
/** "Continue your plan": a saved session resumes past orientation at the last meaningful step */
async function resume() {
  // a session held on this page is still in memory: it comes back exactly where it was, saved or not (Task 01)
  if (M.session?.held?.()) return M.session.resume();
  if (!save.restored && !save.restore()) return false;
  state.orientAck = ORIENT_VERSION;
  applyRoute();
  if (save.at?.stage && LATE.has(save.at.stage) && (state.sector && state.now || routeOf() === 'starter')) { await go('explore'); return true; }
  const sec = save.at?.section && INTERVIEW.includes(save.at.section) ? save.at.section : firstOpenSection() ?? 'aim';
  await go('section', sec);
  return true;
}
M.resume = resume;
/** "Start again": a fresh session on this device; the saved copy is replaced by the next write */
function restart() {
  Object.keys(state).forEach((k) => { if (k === 'stage' || k === 'section') return; if (state[k] instanceof Set) state[k].clear(); else if (k in BLANK) state[k] = blankOf(k); else delete state[k]; });
  state.asked = []; state.prior = {}; state.derived = {};
  passed.clear(); closed.clear(); entered.clear(); reached = {};
  Object.keys(evidenceMap).forEach((k) => delete evidenceMap[k]);
  history = []; askId = null; planted = false; readyOffered = false; refining = false; reopened = null; jumped = null;
  M.result = null; M.resultKey = null; M.measured = null; M.planned = null; M.planObj = null; M.cvFacts = null;
  twigSig = {}; rootSig = ''; fillSig = {}; trunkSig = null; partSig = {}; metricSig = '';
  setCurrency('GBP');
  save.newSession();
  revision = 0;
  applyRoute();
  T((t) => t.toSeed?.());
  go('arrival');
  paintRing();
  dispatch('mercer:restart', {});
}
M.restart = restart;

/* ---------- a section: the camera to its part, the eyebrow, the first question ---------- */
async function enterSection(id, from) {
  const prev = state.section;
  const wasQ = state.stage === 'section' || state.stage === 'close' || state.stage === 'ready';
  if (wasQ && prev !== id) await exitQuestion();
  setSection(id);
  const s = SECTION_BY[id];
  if (!s) return;
  const x1 = limbAnchorX(LIMB_OF_SECTION[prev]), x2 = limbAnchorX(LIMB_OF_SECTION[id]);
  setTint(s.hue);
  setStage('section');
  if (prev !== id) play('whoosh', { x: x1, x2 });
  const fresh = !entered.has(id);
  entered.add(id);
  try { M.feel?.birds?.level?.(1); } catch (e) { /* optional */ }
  const q = sectionQueue(id).next[0] ?? null;
  if (!q) { await afterSection(id); return; }
  if (prev !== id && from !== 'back' && from !== 'planting') await wait(350);
  await showQuestion(q, { first: fresh || from !== 'back', enter: from !== 'back' });
}
/** the section's questions still to show (R5): the first pass asks the first-tier questions, the refinement everything
    left and the questions answered with Not sure; a weak engine question goes last */
function sectionQueue(id) {
  const ids = sectionQuestions(id).filter((qid) => applies(qid) && !satisfied(qid) && qid !== askId);
  const open = ids.filter((qid) => (refining ? !done(qid) || (state.notSure.has(qid) && !registryEntry(qid)?.unknownOk) : !done(qid) && tierOf(qid) === 1));
  /* Task 16, steps 2 and 3: the objective names the metric, and the target needs a present to stand against. The value
     is captured in the Business stage; if it is still missing when the aim is set, it is asked here, once, before the
     target. An objective with no baseline to ask keeps its milestone instead. */
  if (id === 'aim' && answered('win')) {
    const b = baselineGap();
    if (b && !done(b) && !open.includes(b) && b !== askId) open.unshift(b);
  }
  const m = M.measured;
  const entries = m?.entries ?? [];
  const measurable = entries.some((e) => Math.abs(e.elasticity) > 0);
  const BINDS_Q = { client_capacity: 'capacity', market_depletion: 'market', channel_cap: 'channel' };
  const bindQ = m?.binding ? BINDS_Q[m.binding] ?? null : null;
  const weak = new Set();
  if (measurable) open.forEach((qid) => { const inp = MEASURE_OF[qid]; if (!inp || !['price', 'capacity', 'budget', 'spend'].includes(qid) || qid === bindQ) return; const e = Math.abs(entries.find((x) => x.inputId === inp)?.elasticity ?? 0); if (e < E.FLOOR) weak.add(qid); });
  return { next: [...open.filter((qid) => !weak.has(qid)), ...open.filter((qid) => weak.has(qid))], weak, all: ids };
}
const isWeak = (id) => sectionQueue(state.section).weak.has(id);
/** the next-question policy (brief 6.2) as one call: the next screen from where the walk stands */
function nextQuestion() {
  if (state.stage === 'ready') return { ready: true, section: 'plan' };
  const cur = INTERVIEW.includes(state.section) ? state.section : null;
  if (cur) { const q = sectionQueue(cur).next[0]; if (q) return { id: q, section: cur, tier: tierOf(q) }; }
  const order = cur ? INTERVIEW.slice(INTERVIEW.indexOf(cur) + 1) : INTERVIEW;
  for (const sec of order) { const q = sectionQueue(sec).next[0]; if (q) return { id: q, section: sec, tier: tierOf(q) }; }
  if (!readyOffered && !refining && ready().ready) return { ready: true, section: 'plan' };
  return { plan: true, section: 'plan', preliminary: !ready().ready };
}
M.nextQuestion = nextQuestion;

/* ---------- readiness (brief 6.3) ---------- */
const answeredAny = (ids) => ids.some((id) => answered(id));
const knownOrUnknown = (id) => answered(id) || state.notSure.has(id);
/** what the plan can stand on right now: { ready, preliminary, missing[], quantified, route } */
function readiness() {
  const r = routeOf();
  const missing = [];
  let ready0;
  if (r === 'owner') {
    const aim = answeredAny(['win', 'goal']);
    const offer = answered('sector') && (answeredAny(['repeatWork', 'payModel']) || answered('segment'));
    const customer = answeredAny(['segment', 'buyer', 'lastFive', 'channel']);
    const constraint = answeredAny(['capacity', 'volume', 'breaksFirst', 'enquiries', 'closeRate', 'chooseThem', 'market', 'worry', 'holdup']) || Boolean(M.measured?.binding);
    const resource = answeredAny(['budget', 'spend', 'changeHours', 'hours', 'help']);
    if (!aim) missing.push('goal');
    if (!offer) missing.push(answered('sector') ? 'repeatWork' : 'sector');
    if (!customer) missing.push('segment');
    if (!constraint) missing.push('capacity');
    if (!resource) missing.push('budget');
    ready0 = aim && offer && customer && constraint && resource;
    const quantified = Number(state.now) > 0 && (state.price !== null || state.retainerValue !== null);
    const toQuantify = !quantified ? (Number(state.now) > 0 ? (payIsRetainer() ? 'retainer' : 'price') : 'now') : null;
    return { ready: ready0, preliminary: !ready0, missing, quantified, toQuantify, route: r };
  }
  const outcome = answeredAny(['win', 'goal']);
  const time = answered('n03');
  const budget = knownOrUnknown('n05');
  const strengths = answeredAny(['n10', 'n11', 'n12', 'n19', 'n21', 'n22']);
  const buyer = answeredAny(['n27', 'n31', 'n25', 'n19']) || given(state.direction);
  // the test is the visitor's own: what they could deliver (N35) or the result that would persuade them (N39), never the
  // catalogue's suggested test alone
  const test = answeredAny(['n34', 'n32', 'n35', 'n39', 'n33']);
  if (!outcome) missing.push('goal');
  if (!time) missing.push('n03');
  if (!budget) missing.push('n05');
  if (!strengths) missing.push('n10');
  if (!buyer) missing.push('n27');
  if (!test) missing.push('n34');
  ready0 = outcome && time && budget && strengths && buyer && test;
  return { ready: ready0, preliminary: !ready0, missing, quantified: true, toQuantify: null, route: r };
}
const ready = () => readiness();
M.ready = () => readiness().ready;
M.readiness = readiness;

/* ---------- the readiness screen (S09): Show my plan / Refine the uncertain parts ---------- */
async function enterReady() {
  const prev = state.section;
  if (state.stage === 'section' || state.stage === 'close') await exitQuestion();
  setSection('plan');
  setTint('--sec-crown');
  setStage('ready');
  readyOffered = true;
  if (prev !== 'plan') play('whoosh', { x: limbAnchorX(LIMB_OF_SECTION[prev]), x2: 0.6 });
  await showQuestion('readiness', { first: true });
}
/** the fallback screen, when the interview owner has no renderer for `readiness`: two choices, whole card clickable */
function renderReadiness(body) {
  body.innerHTML = '';
  const r = readiness();
  const wrap = document.createElement('div');
  wrap.className = 'ui cards ready';
  const mk = (id, title, sub) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'card-choice'; b.id = id; b.innerHTML = `<strong>${esc(title)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}`; return b; };
  const plan = mk('ready-plan', 'Show my plan', r.quantified ? '' : 'A qualitative plan: one figure is still missing.');
  const refine = mk('ready-refine', 'Refine the uncertain parts', 'A few more questions where the answers are least certain.');
  plan.addEventListener('click', () => choosePlan());
  refine.addEventListener('click', () => chooseRefine());
  wrap.append(plan, refine);
  body.appendChild(wrap);
  return { focus() { plan.focus?.(); }, destroy() {} };
}
async function choosePlan() {
  if (state.stage !== 'ready') return false;
  state.readinessChoice = 'plan';
  await locked(async () => { await exitQuestion(); askId = null; await go('cutscene'); });
  return true;
}
async function chooseRefine() {
  if (state.stage !== 'ready') return false;
  state.readinessChoice = 'refine';
  refining = true;
  await locked(async () => {
    await exitQuestion();
    askId = null;
    const sec = firstOpenSection();
    if (!sec) { await go('cutscene'); return; }
    await enterSection(sec, 'ready');
  });
  return true;
}
M.choosePlan = choosePlan;
M.chooseRefine = chooseRefine;
/* ---------- the action row (Task 03) ----------
   Back, Not sure, Continue, in that order, beneath the active question and nowhere else. The row is laid out before the
   question animates in, so it is at its final position the moment the next question mounts: the entry animation moves
   opacity and a transform, neither of which moves a button. Three rules on top of that:
   - the row never collapses between a long question and a short one: it keeps the height it has needed;
   - while a pointer is down, or resting on the row, the question above it is held at its height, so no target travels
     under a finger;
   - a press that began before the question on screen mounted cannot confirm it, so the click that answered one question
     never submits the next.
   Continue is enabled by the answer alone. No timer and no animation stands between the answer and the press. */
const ACTION_ORDER = ['back', 'unsure', 'next'];
/** the row as it stands: the ids in the order they are reached, and whether Continue is available */
M.actionRow = () => {
  const foot = $('#foot');
  const seen = foot ? $$('button', foot).map((b) => b.id).filter((id) => ACTION_ORDER.includes(id)) : [];
  return { order: seen, expected: ACTION_ORDER, inOrder: seen.join(',') === ACTION_ORDER.filter((id) => seen.includes(id)).join(','), continueOn: !($('#next')?.disabled ?? true), reserved: footFloor };
};
let mountedAt = 0;
let pressAt = 0;
let footFloor = 0;
let pointerOn = false;
const heightOf = (el) => { try { return el?.getBoundingClientRect?.().height ?? 0; } catch (e) { return 0; } };
/** the row keeps the space it has needed, so it never jumps up behind a shorter follow-up */
function reserveFoot() {
  const foot = $('#foot');
  if (!foot) return;
  const h = heightOf(foot);
  if (h > footFloor + 0.5) { footFloor = h; try { foot.style.minHeight = `${Math.round(h)}px`; } catch (e) { /* no styles */ } }
}
/** while a finger is on the screen the question keeps its height: the row under it cannot move */
function holdQuestion(on) {
  const q = $('#q');
  if (!q) return;
  try {
    if (on) { const h = heightOf(q); if (h > 0) q.style.minHeight = `${Math.round(h)}px`; }
    else q.style.minHeight = '';
  } catch (e) { /* no styles */ }
}
document.addEventListener('pointerdown', (e) => { pressAt = performance.now(); if (e.target?.closest?.('#foot, #q')) holdQuestion(true); }, true);
const liftPointer = () => { pointerOn = false; holdQuestion(false); };
document.addEventListener('pointerup', liftPointer, true);
document.addEventListener('pointercancel', liftPointer, true);
$('#foot')?.addEventListener('pointerenter', () => { pointerOn = true; holdQuestion(true); });
$('#foot')?.addEventListener('pointerleave', liftPointer);
/** a press that began before this question mounted belongs to the last one, and is not its answer */
const pressPredatesMount = () => pressAt > 0 && mountedAt > 0 && pressAt < mountedAt;
/* the primary action stays reachable when a phone keyboard opens: the row is brought back into view, never the page */
window.visualViewport?.addEventListener?.('resize', () => {
  if (!WALKING.has(state.stage)) return;
  const foot = $('#foot');
  const vv = window.visualViewport;
  if (!foot || !vv) return;
  const box = foot.getBoundingClientRect?.();
  if (!box || box.bottom <= vv.height) return;
  try { foot.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { /* no scrolling */ }
});
/* the foot: Back · Not sure · Continue. N/A is not shown (R6); a page that still carries #na has it hidden */
function footWords() {
  const next = $('#next');
  if (next) {
    next.textContent = 'Continue';
    next.hidden = state.stage === 'ready';
  }
  const u = $('#unsure');
  if (u) { u.disabled = false; u.hidden = state.stage === 'ready' || state.stage === 'close'; }
  const n = $('#na');
  if (n) { n.hidden = true; n.disabled = true; }
  const back = $('#back');
  if (back) back.disabled = !canBack();
}

/* ---------- planting: after foundations, the tree grows from its answers ---------- */
async function plant() {
  if (M.planting || planted) return;
  M.planting = true;
  try {
    freshResult();
    if (state.sector && state.now) ensureMeasured();
    paintTree();
    T((t) => t.setLabel?.('roots', ''));
    setStage('planting');
    const line = $('#cut-line');
    if (line) line.textContent = '';
    const name = M.treeName();
    const MS = reduce ? 0 : 3000;
    LIMBS.forEach((limb) => T((t) => t.setStub?.(limb, true)));
    const grown = T((t) => t.playIntro?.(3000, { leaves: 0 })) ?? Promise.resolve();
    play('plant');
    setTimeout(() => { try { M.feel.birds.allowed = true; M.feel.birds.start(); M.feel.birds.level(1); } catch (e) { /* optional */ } }, MS * 0.6);
    setTimeout(() => { if (line) line.textContent = `${name}.`; }, MS * 0.85);
    await Promise.all([grown, wait(3000)]);
    T((t) => t.setPlanted?.(true));
    planted = true;
  } finally { M.planting = false; }
}
M.planting = false;

/* ---------- a question on screen ---------- */
async function exitQuestion() {
  const q = $('#q');
  if (!q || reduce) return;
  q.style.transition = 'opacity 120ms cubic-bezier(.2,.75,.1,1), transform 120ms cubic-bezier(.2,.75,.1,1)';
  q.style.opacity = '0';
  q.style.transform = 'translateY(8px)';
  await wait(120);
}
function enterQuestionAnim(back) {
  const q = $('#q');
  if (!q) return;
  if (reduce) { q.style.transition = ''; q.style.opacity = ''; q.style.transform = ''; return; }
  q.style.transition = 'none';
  q.style.opacity = '0';
  q.style.transform = back ? 'translateY(-8px)' : 'translateY(8px)';
  void q.offsetWidth;
  q.style.transition = 'opacity 220ms cubic-bezier(.2,.75,.1,1), transform 220ms cubic-bezier(.2,.75,.1,1)';
  q.style.opacity = '1';
  q.style.transform = 'translateY(0)';
}
let renderer = null;
let lastLimb = null;
/* questions whose Continue is on from the start, whatever their renderer does: the import step never blocks, and a
   free line about what is unresolved is never owed */
/* the business name and the website are offered, never demanded (Task 15): neither holds Continue shut */
const NEVER_BLOCKS = new Set(['import', 'site', 'biz', 'unresolved', 'readiness']);
async function showQuestion(id, o = {}) {
  if (!id) return;
  const section = state.section;
  const s = SECTION_BY[section] ?? SECTION_BY.plan;
  if (askId && askId !== id && !o.back) { if (!history.includes(askId)) history.push(askId); }
  askId = id;
  if (!state.asked.includes(id)) state.asked.push(id);
  snapshotPrior(id);
  // the horizon opens on twelve months: twelve is the suggestion on entry, accepted by Continue (brief 4.4)
  if (id === 'months' && !given(state.months)) { state.months = 12; evidenceMap.months = { state: 'suggested' }; try { M.derive?.('months'); } catch (e) { /* optional */ } flow.forward('months'); }
  const { title: rawTitle, sub } = headline(id);
  // headlines are sentence case in source and title case on the page: the title, the section's name, the tree's label
  const title = titleCase(rawTitle), secWord = titleCase(s.name);
  const eb = $('#eyebrow');
  if (eb) {
    eb.style.setProperty('--hue', `var(${s.hue})`);
    const nm = $('.name', eb); if (nm) nm.textContent = secWord;
    const pu = $('.purpose', eb); if (pu) pu.textContent = o.first ? s.purpose : '';
    const dot = $('.dot', eb); if (dot) dot.style.background = `var(${s.hue})`;
  }
  const t = $('#q-title');
  if (t) {
    t.textContent = title;
    if (state.stage === 'section' && isWeak(id)) { const m = document.createElement('span'); m.className = 'minor'; m.textContent = ' minor'; t.appendChild(m); }
    t.setAttribute('aria-expanded', 'false');
  }
  const sb = $('#q-sub'); if (sb) sb.textContent = sub;
  const ex = $('#q-explain'); if (ex) { ex.textContent = explain(id); ex.hidden = true; }
  /* Continue starts from whether the question is answered, and the instrument has the last word: a renderer that calls
     enable() as it draws leaves Continue on. The reset comes first so that it never undoes the renderer's call */
  const nextBtn = $('#next'); if (nextBtn) nextBtn.disabled = !answered(id) && !NEVER_BLOCKS.has(id);
  const body = $('#q-body');
  if (body) {
    try { renderer?.destroy?.(); } catch (e) { /* gone */ }
    body.innerHTML = '';
    const enable = () => { const n = $('#next'); if (n) n.disabled = false; };
    const render = (qid, host, en) => {
      if (typeof M.renderQuestion === 'function' && (qid !== 'readiness' || exists(qid) && registryEntry(qid))) { const r = M.renderQuestion(qid, host, en); if (r !== undefined || host.childNodes.length) return r ?? null; }
      if (qid === 'readiness') return renderReadiness(host);
      const q = M.SCHEMA_BY?.[qid]; if (q && M.renderSchema) return M.renderSchema(q, host, en);
      host.textContent = ''; return null;
    };
    try { renderer = render(id, body, enable) ?? null; } catch (e) { renderer = null; }
  }
  // no sentence after an answer in the main flow (R8): the slot stays empty while a question is on screen
  setInsight('', false);
  footWords();
  // the camera and the label follow the question's part of the tree; the first question on a limb opens it
  const limb = limbOf(id);
  const part = labelPart(limb);
  if (state.stage === 'section' && limb !== lastLimb) {
    lastLimb = limb;
    const opening = LIMBS.includes(limb) && !state.asked.some((x) => x !== id && limbOf(x) === limb);
    if (LIMBS.includes(limb)) T((tr) => tr.setStub?.(limb, false));
    T((tr) => tr.frame?.(presetOfLimb(limb), opening ? { growLimb: limb } : {}));
  }
  T((tr) => tr.setLabel?.(part, partTag(part, secWord === title ? title : `${secWord} · ${title}`)));
  paintTree();
  paintRing();
  dispatch('mercer:question', { id, section, first: Boolean(o.first), limb, twigIndex: twigSlot(id), route: state.route });
  /* Task 03: the row is placed and its space reserved before anything animates, and the mount is stamped so that the
     press which confirmed the last question cannot confirm this one */
  footWords();
  reserveFoot();
  mountedAt = performance.now();
  enterQuestionAnim(o.back);
  // the new question is brought into a readable place only when it is not already in one: no page jump
  try {
    const q = $('#q');
    const box = q?.getBoundingClientRect?.();
    if (box && (box.top < 0 || box.top > (window.innerHeight || 0))) q.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  } catch (e) { /* no scrolling here */ }
  if (o.enter !== false && !o.back) play('next', { gain: 0.35, x: panOf($('#q-title')) });
  // focus moves into the instrument without a phone keyboard jumping up
  if (window.matchMedia('(pointer: fine)').matches) { try { renderer?.focus?.(); } catch (e) { /* none */ } }
  dispatch('mercer:mounted', { id, section });
}
M.showQuestion = (id) => showQuestion(id ?? askId);
/** writes the boundary sentence; during questioning the slot is kept empty (R8) */
function setInsight(v, sound) {
  const box = $('#q-insight');
  if (!box) return false;
  const text = typeof v === 'string' ? v : v?.text ?? '';
  const warnOn = Boolean(v && typeof v === 'object' && v.warn);
  box.classList.toggle('warn', warnOn);
  if (text === box.textContent) return false;
  box.textContent = text;
  if (text && sound) play('next', { gain: 0.5, x: panOf(box) });
  return Boolean(text);
}

/* ---------- the section boundary (brief 6.2, step 6) ---------- */
/** the boundary after a section's last question: not-applicable marks, a fresh run, planting after foundations, a close
    screen only when the section earned one, then on */
async function afterSection(id) {
  syncNa();
  freshResult();
  if (state.sector && state.now) ensureMeasured();
  paintTree();
  if (id === 'foundations' && !planted) await plant();
  const insight = sectionInsight(id);
  if (insight) { await enterClose(insight); return; }
  await leaveSection();
}
/** on from a section: the readiness screen when the plan can stand, the next section with a question, else the results */
async function leaveSection() {
  const sec = state.section;
  if (INTERVIEW.includes(sec)) closed.add(sec);
  paintRing();
  if (!refining && !readyOffered && ready().ready) { await enterReady(); return; }
  const after = INTERVIEW.slice(Math.max(0, INTERVIEW.indexOf(sec) + 1)).find((s) => sectionQueue(s).next.length > 0)
    ?? (refining || readyOffered ? null : firstOpenSection());
  if (after) { await enterSection(after, 'close'); return; }
  if (state.stage === 'section') await exitQuestion();
  // the first pass ran out without readiness: the plan is preliminary and says so; no readiness screen is offered
  await go('cutscene');
}
async function enterClose(insight = sectionInsight(state.section)) {
  if (!insight) { await leaveSection(); return; }
  await exitQuestion();
  const s = SECTION_BY[state.section];
  setStage('close');
  const next = $('#next'); if (next) { next.disabled = false; next.textContent = 'Continue'; next.hidden = false; }
  if (askId && !history.includes(askId)) history.push(askId);
  askId = null;
  T((t) => t.setLabel?.(labelPart(LIMB_OF_SECTION[state.section]), titleCase(s.name)));
  T((t) => t.frame?.('close-pull'));
  setInsight(insight, true);
  play('close3', { key: M.feel?.key?.(state.section) ?? s.key ?? 'C', x: limbAnchorX(LIMB_OF_SECTION[state.section]) });
  dispatch('mercer:close', { section: state.section, insight: insight.text, kind: insight.kind, ids: insight.ids });
  enterQuestionAnim(false);
  footWords();
}

/* ---------- next and back ---------- */
/** the crown's own reading of the tree, put back after a question opened from it: canopy's enter() sets these once only */
function crownMetrics() {
  const p = M.planned;
  if (!p?.months) return;
  const sorted = p.months[clamp(state.months ?? 12, 1, 12) - 1];
  const g = goalOf();
  const progressV = g && g > p.base ? clamp((qAt(sorted, 0.5) - p.base) / (g - p.base), 0, 1) : 1;
  const odds = state.goal ? reach(sorted, state.goal) / sorted.length : 0;
  T((t) => t.setMetrics?.({ progress: progressV, odds, profit: p.margin, repeat: p.repeat ?? 0 }));
}
/** a question opened again from the crown is done with (answered, skipped or Back): to explore, that section's card open */
async function returnToCrown() {
  const sec = reopened?.section ?? state.section;
  reopened = null;
  await exitQuestion();
  askId = null;
  history = [];
  try { renderer?.destroy?.(); } catch (e) { /* gone */ }
  renderer = null;
  await go('explore');
  crownMetrics();
  paintTree();
  T((t) => t.frame?.('explore'));
  try { M.canopy?.openCard?.(sec); } catch (e) { /* the crown card opens by itself */ }
}
/** the place a section's questions are shown at */
function standAt(sec) {
  setSection(sec);
  setTint(SECTION_BY[sec]?.hue ?? '--sec-crown');
  setStage('section');
  T((t) => t.frame?.(presetOf(sec)));
}
/** during the interview, back to one question already shown; everything else stays as it is */
async function jumpTo(id, sec) {
  if (!state.asked.includes(id) || id === askId || !applies(id)) return;
  await guarded(async () => {
    const from = jumped?.from ?? { id: askId, section: state.section, stage: state.stage, history: [...history] };
    jumped = { id, section: sec, from };
    play('back', { x: 0.5 });
    await exitQuestion();
    history = [];
    if (sec !== state.section || state.stage !== 'section') standAt(sec);
    await showQuestion(id, { first: false, back: true });
  });
}
/** the jumped-to question is done with: back to where the visitor stood, with the forecast made fresh */
async function returnFromJump() {
  const f = jumped?.from;
  jumped = null;
  if (!f) return;
  await exitQuestion();
  freshResult();
  if (state.sector && state.now) ensureMeasured();
  paintTree();
  askId = null;
  history = f.history;
  if (f.stage === 'ready') { await enterReady(); return; }
  if (f.section !== state.section || state.stage !== 'section') standAt(f.section);
  if (f.stage === 'close' || !f.id) { await afterSection(f.section); return; }
  // the change may have closed the branch the old question stood on: the section's next open question takes its place
  const target = applies(f.id) && !satisfied(f.id) ? f.id : sectionQueue(f.section).next[0] ?? null;
  if (!target) { await afterSection(f.section); return; }
  await showQuestion(target, { first: false, enter: false });
}
/** a section opened for review from the wheel's list: its first question, and Continue returns to where the visitor stood */
M.review = async (sec) => {
  if (!INTERVIEW.includes(sec)) return false;
  const id = sectionQuestions(sec).find((q) => state.asked.includes(q) && applies(q));
  if (!id) return false;
  if (LATE.has(state.stage)) { await reopen(id); return true; }
  await jumpTo(id, sec);
  return true;
};
/** a suggested value on the screen being left is accepted by Continue (brief 4.4) */
function acceptSuggested(id) {
  if (id && evidenceMap[id]?.state === 'suggested') { evidenceMap[id] = { state: 'user' }; bump(id, 'accepted'); }
}
/** one press on Continue, under the lock */
async function step() {
  const n = $('#next');
  if (state.stage === 'ready' || n?.disabled) return;
  if (askId && !answered(askId)) passed.add(askId);
  acceptSuggested(askId);
  if (jumped && state.stage === 'section') { await returnFromJump(); return; }
  if (reopened && state.stage === 'section') { await returnToCrown(); return; }
  if (state.stage === 'section') {
    freshResult();
    if (state.sector && state.now) ensureMeasured();
    paintTree();
    const { next: queue } = sectionQueue(state.section);
    if (queue.length) { await exitQuestion(); if (askId && !history.includes(askId)) history.push(askId); await showQuestion(queue[0], { first: false }); return; }
    await afterSection(state.section);
    return;
  }
  if (state.stage === 'close') await leaveSection();
}
async function next() {
  // the press that answered the last question is not this question's answer, however the click reaches here (Task 03)
  if (pressPredatesMount()) return;
  // the results have no move to wait for: the cutscene skips, the crown turns to its next card
  if (state.stage === 'cutscene') { M.canopy?.skip?.(); return; }
  if (state.stage === 'explore') { M.canopy?.nextCard?.(); return; }
  // a press with nothing to do takes no lock: Continue is off, or this stage has no Continue
  if (!['section', 'close'].includes(state.stage) || $('#next')?.disabled) return;
  await guarded(step);
}
/** whether Back has anywhere to go: a question behind this one, or the crown a question was opened again from */
const canBack = () => ['section', 'close', 'ready'].includes(state.stage) && (history.length > 0 || (Boolean(reopened || jumped) && state.stage === 'section'));
async function back() {
  // the plan's way out is the crown; canopy's own Back does the same
  if (state.stage === 'plan') { await go('explore'); return; }
  if (!canBack()) return;
  await guarded(async () => {
    if (reopened && state.stage === 'section') { play('back', { x: 0.5 }); await returnToCrown(); return; }
    if (jumped && state.stage === 'section') { play('back', { x: 0.5 }); await returnFromJump(); return; }
    const id = history.pop();
    if (!id) return;
    play('back', { x: 0.5 });
    const sec = sectionOf(id) ?? state.section;
    await exitQuestion();
    if (state.stage === 'ready') { askId = null; readyOffered = false; }
    if (sec !== state.section || state.stage !== 'section') standAt(sec);
    await showQuestion(id, { first: false, back: true });
  });
}
M.next = next;
M.back = back;

/* ============ what the planner is given (Task 24) ============
   One object, built from what the visitor actually said, with sources kept apart from assumptions. Nothing here invents
   a figure: every number is a supplied answer or comes from the economics module, and an unknown is named as unknown.
   The planner reads this; it never reads the walk's own bookkeeping. */
function planContext() {
  const route = routeOf();
  const o = objective();
  const supplied = {};
  state.asked.forEach((id) => { if (!answered(id)) return; const k = keyFor(id); if (k && k in state && !WALK_KEYS.has(k)) supplied[id] = state[k]; });
  const unknown = [...state.notSure].filter((id) => !answered(id));
  return {
    route,
    stage: state.stage,
    person: { place: state.place || null, country: state.country || null, currency: state.currency, biz: state.biz || null, site: state.site || null, sector: state.sector ?? null, trade: state.trade || null, bizStage: state.bizStage ?? null },
    strengths: { skills: state.strengths ?? [], avoids: state.avoids ?? [], interests: state.n10 ?? [], experience: M.cvFacts ?? null, buyersKnown: state.n19 ?? state.buyer ?? null, resources: { hoursAWeek: state.n03 ?? state.hours ?? null, money: state.n05 ?? state.budget ?? null, tools: state.n16 ?? state.systems ?? [], people: state.help ?? null } },
    goal: { objective: o?.id ?? null, label: o?.label ?? null, metric: o?.metric ?? null, numeric: Boolean(o?.numeric), target: state.goal, baseline: baselineNow(), horizonMonths: state.months ?? null, protectedConstraints: state.protected ?? [] },
    operations: { window: enquiryWindow(), enquiries: state.enquiries, boughtFromWindow: state.quotes, cohortConversion: M.cohortConversion(), capacity: capacityNow(), unit: unitFor(), channelsLive: state.doing ?? [], channelsTried: state.tried ?? [], attempts: state.went ?? {} },
    direction: state.direction ?? null,
    evidence: { sources: foundList().map((f) => ({ field: f.field, value: f.value, source: f.source ?? '', date: f.month ?? null, quote: String(f.quote ?? '').slice(0, 160), status: f.status ?? 'found' })), assumptions: Object.keys(evidenceMap).filter((k) => evidenceMap[k]?.state === 'suggested' || evidenceMap[k]?.state === 'assumed') },
    supplied,
    unknown,
    revision,
    // the economics module owns every figure; nothing here computes one
    econ: { available: Boolean(M.econ), model: (() => { try { return M.econ?.model?.(state) ?? null; } catch (e) { return null; } })() },
  };
}
M.planContext = planContext;
/** the instruction the planner is held to (Task 24): asked for facts, never for a forecast of their own future */
M.planInstruction = () => [
  'Understand this person or business before recommending the next move.',
  'Ask for facts they can know. Work out the strategy, feasible requirements and test milestones from those facts.',
  'Do not ask them to forecast their own future.',
  'For a starter, recommend a specific buyer, problem and offer that fits their interests, demonstrated skills, resources and context.',
  'Reveal and select that direction before asking venture-specific execution questions.',
  'For an owner, use the actual business, scale and goal. Keep revenue, profit, personal income, customer counts and delivery capacity distinct.',
  'Write a short finding and concrete action for the first view; put reasons, assumptions and examples in the detail fields.',
  'Only cite supplied or retrieved evidence. Never invent fit probabilities, market demand, prices, earnings guarantees or capabilities.',
].join('\n');

/* ============ the commit path ============ */
/* a part of a question committed on its own: the leaf belongs to the question on screen */
const SUB_OF = { estMonth: 'yearsTrading', appetite: 'goal', quotes: 'enquiries', spendNow: 'spend', who: 'capacity', servedNow: 'capacity', avoids: 'strengths', trade: 'sector', retainerValue: 'retainer', retainerMin: 'retainer', retainerMax: 'retainer', personalityAxes: 'personality', doing: 'channel', tried: 'channel', stackNames: 'software', stack: 'software', closeRate: 'enquiries', changeHours: 'budget', country: 'place', currency: 'place', volumePeriod: 'volume' };
const COMPOSITE = {
  capacity: (v) => ({ who: v.who ?? state.who, servedNow: v.servedNow ?? state.servedNow, capacity: v.capacity ?? state.capacity }),
  spend: (v) => (Array.isArray(v) ? { spendNow: v[0] ?? null, budget: v[1] ?? null } : { spendNow: v.spendNow ?? state.spendNow, budget: v.budget ?? state.budget, oneOff: v.oneOff ?? state.oneOff ?? null, changeHours: v.changeHours ?? v.hours ?? state.changeHours }),
  // E22: enquiries, wins and the period on one screen; a close rate given with them is written too
  enquiries: (v) => (Array.isArray(v) ? { enquiries: v[0] ?? null, quotes: v[1] ?? null } : { enquiries: v.enquiries ?? state.enquiries, quotes: v.quotes ?? state.quotes, closeRate: v.closeRate ?? (Number(v.wins) >= 0 && Number(v.enquiries) > 0 ? clamp(Number(v.wins) / Number(v.enquiries), 0, 1) : state.closeRate) }),
  retainer: (v) => ({ retainerMin: v.min ?? null, retainerMax: v.max ?? null, retainerValue: v.avg ?? v.value ?? null }),
  software: (v) => ({ stackNames: { ...(v.names ?? {}) }, stack: { ...(v.fees ?? {}) } }),
  channel: (v) => ({ doing: v.doing ?? [], tried: v.tried ?? [], went: v.went ?? {}, channel: v.channel ?? null }),
  strengths: (v) => ({ strengths: v.strengths ?? [], avoids: v.avoids ?? [] }),
  personality: (v) => ({ personalityAxes: v.axes ?? state.personalityAxes, personality: v.code ?? null }),
  help: (v) => ({ help: v.help ?? null }),
  goal: (v) => ({ goal: v.goal ?? state.goal, appetite: v.appetite ?? state.appetite, months: v.months ?? state.months }),
  sector: (v) => ({ sector: v.sector ?? v.id ?? null, trade: v.trade ?? '' }),
  bestWorst: (v) => ({ bestWorst: Array.isArray(v) ? v : [v.best, v.worst] }),
  // Established: the years trading, and the month it began (1 to 12, or null for Unknown)
  yearsTrading: (v) => ({ yearsTrading: v.years ?? v.yearsTrading ?? v.value ?? state.yearsTrading, estMonth: monthOf('month' in v ? v.month : 'estMonth' in v ? v.estMonth : state.estMonth) }),
  // the import step writes the address to state.site; what it read from pasted text or a file stays with research.js
  import: (v) => ({ site: siteOf(v.site ?? v.url ?? v.address ?? state.site) }),
  // S06: the place, and the country and currency it suggests unless the visitor gave them
  place: (v) => { const sug = suggestPlace(v.place ?? v.text ?? v.name ?? ''); return { place: String(v.place ?? v.text ?? v.name ?? state.place ?? ''), country: v.country ?? sug?.country ?? state.country, currency: currencyCode(v.currency) ?? sug?.currency ?? state.currency }; },
  /* Task 18: money and time are separate questions. The budget screen writes money only, and the one-off apart from the
     recurring; hours arrive from their own screen. An older renderer that still sends hours is not made to lose them */
  budget: (v) => ({ budget: v.budget ?? v.recurring ?? v.monthly ?? state.budget, oneOff: v.oneOff ?? state.oneOff ?? null, ...(v.hours ?? v.changeHours) !== undefined && (v.hours ?? v.changeHours) !== null ? { changeHours: v.hours ?? v.changeHours } : {} }),
  changeHours: (v) => ({ changeHours: (typeof v === 'object' && v !== null ? v.hours ?? v.changeHours : v) ?? state.changeHours }),
  volume: (v) => ({ volume: v.volume ?? v.count ?? v.value ?? state.volume, volumePeriod: v.period ?? v.volumePeriod ?? state.volumePeriod }),
};
const monthOf = (v) => { const n = Math.round(Number(v)); return v !== null && v !== '' && Number.isFinite(n) && n >= 1 && n <= 12 ? n : null; };
const siteOf = (v) => M.siteFrom(v) || String(v ?? '').trim();
function writeValue(id, value) {
  const key = keyFor(id);
  if (value && typeof value === 'object' && !Array.isArray(value) && COMPOSITE[id]) {
    const out = COMPOSITE[id](value);
    Object.assign(state, out);
    // the registry's sibling keys ride along when the screen commits them with the primary value
    (registryEntry(id)?.keys ?? []).forEach((k) => { if (k in value && !(k in out) && !WALK_KEYS.has(k)) state[k] = value[k]; });
  }
  else if (Array.isArray(value) && COMPOSITE[id] && ['spend', 'enquiries', 'bestWorst'].includes(id)) { Object.assign(state, COMPOSITE[id](value)); }
  else if (id === 'sector') { state.sector = value || null; }
  else if (id === 'site' || id === 'import') { state.site = siteOf(value); }
  else if (id === 'estMonth') { state.estMonth = monthOf(value); }
  else if (id === 'stay') { state.retention = value; }
  else if (id === 'cv') { state.cv = String(value ?? '').slice(0, 20000); }
  else if (id === 'channel' && Array.isArray(value)) { state.doing = value; }
  else if (id === 'place' && typeof value === 'string') { Object.assign(state, COMPOSITE.place({ place: value })); }
  else if (id === 'currency') { setCurrency(value); }
  else { state[key] = value; }
  // what follows from the value
  if (id === 'place' || id === 'country' || (id === 'currency')) setCurrency(state.currency);
  if (id === 'sector') { state.niche = M.nicheOf?.(state.sector) ?? null; }
  if (id === 'cv') { M.cvFacts = state.cv.trim() && M.readCV ? M.readCV(state.cv) : null; }
  if (id === 'appetite' || (id === 'goal' && value && typeof value === 'object' && 'appetite' in value)) {
    const none = state.appetite === 'none';
    state.basis = none ? 'budget' : 'revenue';
    state.goalMode = none ? 'max' : 'target';
    if (none) state.budget = 0;
    else if (state.budget === 0) state.budget = null;
  }
  if (id === 'channel' || id === 'went') { if (state.channel === null || !(state.doing ?? []).some((x) => DIST_BY[x]?.engine === state.channel)) state.channel = M.primaryChannel(); }
  if (id === 'software' && !M.derive) {
    const names = state.stackNames ?? {};
    const ids = Object.keys(names).filter((k) => names[k]);
    state.systems = ids.length ? ['crm', 'booking', 'email', 'ai'].filter((k) => ids.includes(k)) : ['none'];
  }
  if (id === 'personality' && Array.isArray(state.personalityAxes) && state.personalityAxes.every(Boolean) && !state.personality) state.personality = state.personalityAxes.join('');
  // the starter's chosen direction (N27): the card's id, whatever shape the cards commit
  if (id === 'direction' && given(value)) state.direction = value;
  if (id === 'n27' && given(value) && !given(state.direction)) state.direction = value && typeof value === 'object' ? value.direction ?? value : value;
}
const centreOf = (el) => { if (!el) { const b = $('#q-body'); if (!b) return { x: window.innerWidth * 0.3, y: window.innerHeight * 0.5 }; el = b; } const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
/** nothing in it: null, '', 0, an empty list, or an object whose every part is empty */
const emptyValue = (v) => v === null || v === undefined || v === '' || v === 0 || (typeof v === 'number' && Number.isNaN(v)) || (Array.isArray(v) ? v.every(emptyValue) : typeof v === 'object' && Object.values(v).every(emptyValue));
/* the keys the commit compares, to know whether anything changed */
const snapshotOf = (id) => JSON.stringify([keyFor(id), ...(PARTS_OF[id] ?? [])].map((k) => state[k]));
/** an answer arrives: state, derive, the engine, the revision, the leaf. opts: { fromEl, suggested, evidence } */
function commit(id, value, opts = {}) {
  // an instrument that has left the screen after Not sure cannot write its resting 0 (or nothing) over the withdrawn answer
  const owner = SUB_OF[id] ?? id;
  if ((state.notSure.has(owner) || state.na.has(owner)) && askId !== owner && emptyValue(value)) return;
  const before = snapshotOf(owner);
  const beforeEvidence = evidenceMap[owner]?.state ?? null;
  writeValue(id, value);
  try { M.derive?.(id); } catch (e) { /* questions.js's own rules */ }
  const src = SRC_OF[id] ?? id;
  const given0 = answered(id) || given(state[keyFor(id)]);
  // a part of the question on screen speaks for the whole question
  id = SUB_OF[id] && (SUB_OF[id] === askId || !askId) ? SUB_OF[id] : id;
  state.notSure.delete(id);
  state.na.delete(id);
  passed.delete(id);
  // the evidence behind the value (R9): a suggestion until Continue accepts it, an import find, or the visitor's own
  if (opts.evidence && typeof opts.evidence === 'object') evidenceMap[id] = { ...opts.evidence, state: opts.evidence.state ?? 'imported' };
  else if (opts.suggested) evidenceMap[id] = { state: 'suggested' };
  else { const f = findFor(id, state[keyFor(id)]); evidenceMap[id] = f ? findEvidence(f) : { state: 'user' }; }
  const isAnswered = answered(id);
  // accepting a suggestion is a change even when the figure is the same: it stops being Mercer's and becomes theirs
  const wasSuggested = beforeEvidence === 'suggested' && !opts.suggested;
  const changed = snapshotOf(owner) !== before || wasSuggested;
  const grade = gradeOf(id);
  const kind = kindOf(id);
  const text = valueText(id);
  const limb = limbOf(id);
  const twigIndex = twigSlot(id);
  const fromXY = centreOf(opts.fromEl);
  if (given0) flow.forward(src); else flow.backward(src);
  if (changed && !opts.suggested) bump(id, 'answer');
  dispatch('mercer:commit', { id, kind, grade, text, fromXY, limb, twigIndex, engine: flow.ENGINE.has(src), revision, suggested: Boolean(opts.suggested) });
  if (isAnswered && askId === id) {
    const n = $('#next'); if (n) n.disabled = false;
    if (state.stage === 'section') nudgeSky();
    // the tree grows where the answer lands (paintTree); nothing flies onto it (brief 1.3)
    if (LIMBS.includes(limb) || limb === 'control') {
      const a = T((t) => t.anchor?.(limb === 'control' ? 'control' : { limb, twig: twigIndex ?? 0 }));
      play('leaf', { grade, x: clamp(fromXY.x / window.innerWidth, 0, 1), x2: a ? clamp(a.x / window.innerWidth, 0, 1) : undefined });
    } else play('root', { x: 0.45 });
  }
  paintTree();
  paintRing();
  footWords();
}
M.commit = commit;

/* ---------- Not sure withdraws the answer (R6, C01) ----------
   Not sure says "do not use what I put here". Whatever the question had committed leaves state, and with it anything
   questions.js worked out from it, so no card or export prints it and the engine never runs on it: the engine's own
   stand-in takes over where it has one, and the unknown is recorded, never a zero. Revenue included */
/* the keys a question's instrument writes beside its own. The schema's `keys` also lists what a rule settles from them
   (price from a retainer, systems from the software names): those are M.derive's to put right, not listed here */
const PARTS_OF = { capacity: ['who', 'servedNow'], spend: ['spendNow', 'oneOff', 'changeHours'], enquiries: ['quotes', 'closeRate'], retainer: ['retainerMin', 'retainerMax', 'priceSpread'], software: ['stack'], channel: ['doing', 'tried', 'went'], strengths: ['avoids'], personality: ['personalityAxes'], fixedCosts: ['costLines'], yearsTrading: ['estMonth'], import: ['imported'], place: ['country'], budget: ['changeHours'], volume: ['volumePeriod'], goal: ['appetite'] };
/* the tags questions.js's fill() leaves in state.derived for a value one answer settled in another key */
const FILLS_OF = { retainer: ['retainer', 'retainerYear'], retainerMonths: ['retainerMonths'], retainerRenew: ['retainerRenew'], repeatWork: ['repeatWork'] };
/** takes a question's answer out of state; true when the engine's inputs changed */
function withdraw(id) {
  const d = state.derived ?? (state.derived = {});
  const touched = [];
  [...new Set([keyFor(id), ...(PARTS_OF[id] ?? [])])].forEach((k) => {
    // a key another answer settled is that answer's, not this question's, to take away
    if (d[k] !== undefined) return;
    if (!(k in BLANK)) { if (state[k] !== undefined && state[k] !== null) { state[k] = null; touched.push(k); } return; }
    if (JSON.stringify(state[k]) === BLANK[k]) return;
    // the appetite keeps its word: withdrawing the target leaves the dial where it stood
    if (k === 'appetite') return;
    state[k] = blankOf(k);
    touched.push(k);
  });
  const tags = FILLS_OF[id] ?? [];
  Object.keys(d).forEach((k) => { if (tags.includes(d[k])) { delete d[k]; state[k] = blankOf(k); touched.push(k); } });
  if (id === 'cv') M.cvFacts = null;
  if (id === 'currency' || id === 'place') setCurrency(state.currency);
  delete evidenceMap[id];
  try { M.derive?.(id); } catch (e) { /* questions.js's own rules */ }
  // the instrument on screen goes back to empty with it, a suggested figure included (feel.js: clear() commits nothing)
  if (askId === id) { try { renderer?.clear?.(); } catch (e) { /* an instrument with no clear keeps its face until it leaves */ } setInsight('', false); }
  if (!touched.length) return false;
  const src = SRC_OF[id] ?? id;
  const engineKey = [src, ...touched].find((k) => flow.ENGINE.has(k)) ?? null;
  // backward() drops any run still waiting on the old answer and, for an engine input, runs again at once without it
  flow.backward(engineKey ?? src);
  if (engineKey) freshResult();
  return Boolean(engineKey);
}
function notSure(id) {
  id = id ?? askId;
  if (!id || id === 'readiness' || moving) return undefined;
  state.notSure.add(id);
  state.na.delete(id);
  passed.delete(id);
  const ran = withdraw(id);
  if (askId === id) setInsight('', false);
  const limb = limbOf(id);
  const twigIndex = twigSlot(id);
  // read after the withdrawal: the bank now holds the engine's own figure where the visitor's stood
  const sIn = standIn(id);
  const a = LIMBS.includes(limb) ? T((t) => t.anchor?.({ limb, twig: twigIndex ?? 0 })) : null;
  play('estimate', { grade: 2, x: a ? clamp(a.x / window.innerWidth, 0, 1) : 0.6 });
  bump(id, 'unknown');
  dispatch('mercer:unsure', { id, standIn: Boolean(sIn), limb, twigIndex, revision });
  if (sIn && !ran) flow.forward(SRC_OF[id] ?? id);
  paintTree();
  paintRing();
  // only the question on screen moves on: a mark set on another question from code leaves the screen where it is
  if (askId !== id) return undefined;
  const n = $('#next'); if (n) n.disabled = false;
  // the move's promise, so a caller in code can wait for it
  return next();
}
/** not applicable, by routing only (R6, C16): no button offers it. A caller in code may mark a question so; the screen does
    not move, and the mark lifts again when the question applies */
function na(id) {
  id = id ?? askId;
  if (!id || id === 'readiness') return undefined;
  state.na.add(id);
  state.notSure.delete(id);
  passed.delete(id);
  withdraw(id);
  dispatch('mercer:na', { id, limb: limbOf(id), twigIndex: twigSlot(id) });
  paintTree();
  paintRing();
  return undefined;
}
M.notSure = notSure;
M.na = na;
/** from the crown, back to exactly one question, keeping everything else. The question keeps its mark (Not sure, passed)
    until it is answered. When it is answered and Continue is pressed, or skipped with Not sure, or Back is pressed, the
    visitor is at explore again with that section's card open: see returnToCrown() */
async function reopen(id) {
  const sec = sectionOf(id);
  if (!sec || !SECTION_BY[sec] || sec === 'plan') return;
  // while the interview runs, a question already shown is jumped back to, and the walk picks up where it stood
  if (state.stage === 'section' || state.stage === 'close' || state.stage === 'ready') { await jumpTo(id, sec); return; }
  // the crown is where a question is opened again from
  if (!LATE.has(state.stage) || state.stage === 'cutscene') return;
  await guarded(async () => {
    try { M.canopy?.closeCard?.(true); } catch (e) { /* optional */ }
    history = [];
    reopened = { id, section: sec };
    setSection(sec);
    setTint(SECTION_BY[sec].hue);
    setStage('section');
    entered.add(sec);
    T((t) => t.frame?.(presetOfLimb(limbOf(id))));
    try { M.feel?.birds?.level?.(1); } catch (e) { /* optional */ }
    await showQuestion(id, { first: true });
  });
}
M.reopen = reopen;

/* ---------- what the tree's inspect chip says about one twig, limb or section (R16, R10) ----------
   { title, words, source, evidence, canChange }: the question's headline, the answer in the words on the twig, where the
   figure came from (the evidence state's label, R9), and whether M.reopen(id) has anywhere to go right now */
const SOURCE_WORD = { you: 'Your answer', web: 'From your website', sector: 'Source', assumed: 'Assumption' };
function standInWords(id, sIn) {
  const v = sIn?.value;
  if (!given(v)) return '';
  try {
    switch (BANK_OF[id]) {
      case 'deal': return id === 'retainer' ? `${gbp(v)} a month` : gbp(v);
      case 'budget': return gbp(v);
      case 'close': return `${tenths(v)} in 10`;
      case 'margin': return `${Math.round(v * 100)}p in the £1`;
      case 'capacity': return `${count(v)} ${M.unitWord?.(M.result?.unit) ?? 'jobs'} a month`;
      case 'market': return `${count(v)} prospects`;
      case 'cycle': return cycleWord(v);
      case 'channels': return listWords((Array.isArray(v) ? v : [v]).map((c) => CHANNEL_NAME[c] ?? c));
      default: return '';
    }
  } catch (e) { return ''; }
}
function inspect(id, o = {}) {
  if (!id) return null;
  // "capacity" and "margin" name a limb and a question both: a question wins unless the caller says limb
  // (inspect('limb:capacity'), inspect('capacity', { limb: true }), or the tree's event with kind 'limb')
  // the tree's own `inspect` event ({ id, kind, x, y }) can be handed over whole, first or second
  if (id && typeof id === 'object') { o = id; id = o.id; }
  if (!id) return null;
  let asLimb = Boolean(o.limb) || o.kind === 'limb' || o.kind === 'part';
  if (typeof id === 'string' && id.startsWith('limb:')) { id = id.slice(5); asLimb = true; }
  const isQuestion = !asLimb && exists(id) && id !== 'readiness';
  // a limb, or a section by its own id: what it holds, with nothing to change on the chip itself
  const partSecs = (part) => INTERVIEW.filter((sec) => sectionQuestions(sec).some((q) => limbOf(q) === part));
  const secs = isQuestion ? null : SECTION_BY[id] && id !== 'plan' ? [id] : LIMBS.includes(id) || ['trunk', 'roots', 'control', 'crown'].includes(id) ? partSecs(id) : null;
  if (secs && secs.length) {
    const ids = secs.flatMap((sec) => sectionQuestions(sec).filter((q) => applies(q) && (SECTION_BY[id] ? true : limbOf(q) === id)));
    const n = ids.filter(answered).length;
    const ps = SECTION_BY[id] ? null : partState(id);
    return { title: titleCase(SECTION_BY[id] ? SECTION_BY[id].name : PART_NAME[id] ?? listWords(secs.map((sec) => SECTION_BY[sec].name))), words: ids.length ? `${count(n)} of ${count(ids.length)} answered` : '', source: ps ? EVIDENCE_LABEL[ps.state] ?? '' : '', evidence: ps?.state ?? '', canChange: false };
  }
  const sec = sectionOf(id);
  if (!sec || !SECTION_BY[sec]) return null;
  const title = titleCase(headline(id).title);
  const walking = state.stage === 'section' || state.stage === 'close' || state.stage === 'ready';
  const canChange = !moving && applies(id) && ((LATE.has(state.stage) && state.stage !== 'cutscene') || (walking && state.asked.includes(id) && id !== askId));
  const ev = evidence(id);
  if (state.na.has(id)) return { title, words: 'Not needed', source: ev.label, evidence: ev.state, canChange };
  if (state.notSure.has(id) || (!answered(id) && standIn(id) && state.asked.includes(id))) {
    const sIn = standIn(id);
    return { title, words: (sIn && standInWords(id, sIn)) || 'Not sure', source: ev.label, evidence: ev.state, canChange };
  }
  if (!answered(id)) return { title, words: 'Not answered yet', source: ev.label, evidence: ev.state, canChange };
  return { title, words: valueText(id), source: ev.label, evidence: ev.state, sourceUrl: ev.sourceUrl, excerpt: ev.excerpt, canChange };
}
M.inspect = inspect;

/* ============ answers that contradict each other (kept for the results) ============ */
function inconsistencies() {
  const out = [];
  const add = (id, fix, text) => out.push({ id, fix, text });
  const price = state.price ?? M.result?.bank?.deal?.value ?? null;
  const impliedSales = price && state.now ? state.now / price : null;
  if (impliedSales !== null && state.capacity !== null && impliedSales > state.capacity * 1.15) add('capacity', ['price', 'capacity'], `Your revenue divided by your sale price is about ${plural(impliedSales, 'sale', 'sales')} a month, and you said you can deliver ${count(state.capacity)}.`);
  if (impliedSales !== null && state.enquiries !== null && state.closeRate !== null) {
    const won = state.enquiries * state.closeRate;
    if (won > 0 && (impliedSales > won * 1.6 || impliedSales < won * 0.4)) add('enquiries', ['enquiries', 'closeRate', 'price'], `${plural(state.enquiries, 'enquiry', 'enquiries')} a month at ${tenths(state.closeRate)} in 10 is about ${plural(won, 'sale', 'sales')}, but your revenue over your sale price is ${count(impliedSales) === '0' ? 'well under one' : `about ${count(impliedSales)}`}.`);
  }
  if (state.enquiries !== null && state.quotes !== null && state.quotes > state.enquiries) add('quotes', ['enquiries'], `You quote more often than you get enquiries (${count(state.quotes)} against ${count(state.enquiries)}).`);
  if (state.spendNow !== null && state.budget !== null && state.spendNow > state.budget) add('budget', ['spend'], `You already spend ${gbp(state.spendNow)} a month on growth, more than the ${gbp(state.budget)} ceiling you set.`);
  if (state.fixedCosts !== null && state.now !== null && state.margin !== null && state.fixedCosts > state.now * state.margin) add('fixedCosts', ['fixedCosts', 'margin'], `Your outgoings (${gbp(state.fixedCosts)} a month) are more than the ${gbp(Math.round(state.now * state.margin))} a month your margin leaves.`);
  if (state.teamSize !== null && state.teamSize > 0 && state.who !== null && state.teamSize < state.who) add('teamSize', ['teamSize', 'capacity'], `You said ${plural(state.who, 'person does', 'people do')} the work and ${plural(state.teamSize, 'person', 'people')} in total.`);
  if (state.bestWorst && state.now !== null && state.bestWorst[1] && state.now < state.bestWorst[1] * 0.6) add('bestWorst', ['bestWorst'], `Your worst month (${gbp(state.bestWorst[1])}) is above the ${gbp(state.now)} you gave as this month’s revenue.`);
  return out;
}
M.inconsistencies = inconsistencies;

/* ============ restore, and the website address ============ */
const TLD = /(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:co\.uk|org\.uk|ac\.uk|gov\.uk|com|uk|org|net|io|co|biz|info|shop|london|scot|wales|ie|eu)(?:\/[^\s"'<>]*)?/i;
M.siteFrom = (v) => { const m = String(v ?? '').match(TLD); return m ? m[0].replace(/[.,;:)]+$/, '').slice(0, 200) : ''; };
/** the old way in: a state object put back whole, the run made at once (kept for the harnesses that call it) */
M.restore = (saved) => {
  Object.assign(state, saved, { skipped: new Set(saved.skipped ?? []), notSure: new Set(saved.notSure ?? []), na: new Set(saved.na ?? []), asked: saved.asked ?? [], prior: saved.prior ?? {} });
  applyRoute();
  setCurrency(state.currency);
  if (state.sector && state.now) {
    M.resultKey = keyOf();
    M.result = forecastFor(M.resultKey);
    M.measured = null;
    ensureMeasured();
    M.planned = null;
    ensurePlanned();
  }
  paintTree();
};
M.treeName = () => M.feel?.possessive?.(state.biz, 'tree') ?? (state.biz ? `${state.biz}’s tree` : 'Your tree');

/* ============ the live session (Task 01) ============
   The session is this module's own state: `state`, `askId`, `history`, `revision`. It has never belonged to a page or to
   an overlay, and nothing here puts it there. What was actually lost was the page itself: About TMA is a link out, and a
   browser that follows it in the same tab unloads Mercer. With saving on the answers come back; with saving off they do
   not, and pretending otherwise would be persistence nobody asked for. So while a session is live the page is not left:
   an in-app About is preferred, and any other outward link opens in a new tab.
   hold() and resume() carry the exact step and the in-progress draft across anything that does change the screen, such
   as the intro replayed from Help. Nothing here writes to storage, and nothing here clears an answer. */
let held = null;
const FIELDS = 'input, textarea, select';
/** the answer being typed but not yet confirmed: the instrument's own value where it has one, and the fields as they stand */
function draftOf() {
  const host = $('#q-body');
  if (!host || !askId) return null;
  let value;
  try { value = typeof renderer?.get === 'function' ? renderer.get() : undefined; } catch (e) { value = undefined; }
  const fields = $$(FIELDS, host).map((el, i) => ({
    i,
    value: el.type === 'checkbox' || el.type === 'radio' ? null : el.value ?? '',
    checked: el.type === 'checkbox' || el.type === 'radio' ? el.checked : null,
  })).filter((f) => (f.checked === null ? f.value !== '' : f.checked));
  const active = document.activeElement;
  const focus = active && host.contains(active) ? $$(`${FIELDS}, button, [tabindex]`, host).indexOf(active) : -1;
  if (value === undefined && !fields.length && focus < 0) return null;
  return { id: askId, value, fields, focus };
}
/** the draft put back on the question it was typed on; a draft for another question is dropped, never applied elsewhere */
function putDraft(d) {
  if (!d || d.id !== askId) return false;
  const host = $('#q-body');
  if (!host) return false;
  if (d.value !== undefined) { try { renderer?.set?.(d.value); } catch (e) { /* the fields below */ } }
  const els = $$(FIELDS, host);
  d.fields.forEach((f) => {
    const el = els[f.i];
    if (!el) return;
    try {
      if (f.checked !== null) { if (el.checked !== f.checked) { el.checked = f.checked; el.dispatchEvent(new window.Event('change', { bubbles: true })); } return; }
      if (el.value !== f.value) { el.value = f.value; el.dispatchEvent(new window.Event('input', { bubbles: true })); }
    } catch (e) { /* an instrument that owns its own field */ }
  });
  if (d.focus >= 0) { try { $$(`${FIELDS}, button, [tabindex]`, host)[d.focus]?.focus({ preventScroll: true }); } catch (e) { /* gone */ } }
  return true;
}
const session = {
  /** whether a walk is under way: the homepage and the orientation are not a session to hold */
  live: () => WALKING.has(state.stage) || LATE.has(state.stage),
  /** where the visitor stands, with nothing derived: for a caller that wants to put the screen back itself */
  snapshot: () => ({ stage: state.stage, section: state.section, questionId: askId, history: [...history], route: state.route, revision, draft: draftOf() }),
  held: () => held,
  /** before a screen that is not the walk (the intro replayed, an in-app About that takes the page over) */
  hold(why = 'overlay') {
    if (!session.live()) return null;
    held = { why, ...session.snapshot() };
    dispatch('mercer:session-held', { why, stage: held.stage, section: held.section, questionId: held.questionId });
    return held;
  },
  /** back to the exact step and the draft. Results made from older answers are rebuilt, never shown as they were */
  async resume(o = {}) {
    const h = o.from ?? held;
    held = null;
    if (!h) return false;
    if (h.route && h.route !== state.route) setRoute(h.route);
    const toQuestion = Boolean(h.questionId) && WALKING.has(h.stage);
    // the instrument is drawn again when it is gone, so a panel that took the screen hands back a working question
    const emptyBody = !($('#q-body')?.childNodes?.length);
    if (toQuestion && (state.stage !== h.stage || state.section !== h.section || askId !== h.questionId || emptyBody)) {
      history = [...h.history];
      if (h.section !== state.section || state.stage !== 'section') standAt(h.section);
      await showQuestion(h.questionId, { first: false, enter: false, back: true });
    } else if (state.stage !== h.stage || (h.section && state.section !== h.section)) {
      await go(h.stage, h.section);
    }
    // an answer changed while the screen was away: the plan is rebuilt for this revision rather than shown stale
    if (LATE.has(state.stage)) freshPlan();
    if (h.draft) putDraft(h.draft);
    dispatch('mercer:session-resumed', { why: h.why ?? 'overlay', stage: state.stage, section: state.section, questionId: askId });
    return true;
  },
};
M.session = session;
/* the shell's contract for an overlay that takes the screen (About TMA, Help, the intro): one event, open then closed */
document.addEventListener('mercer:overlay', (e) => {
  const d = e.detail ?? {};
  if (d.open) session.hold(d.name ?? 'overlay');
  else if (held) session.resume();
});
/* the shell's own panels over the walk: About TMA and Help. Neither changes an answer, so the hold is only there to put
   the step, the instrument and the draft back exactly as they were, however the panel is closed */
const PANELS = [['#about-tma', '#about-panel', 'about'], ['#help', '#help-panel', 'help']];
const panelOpen = (el) => Boolean(el && (el.open === true || (el.hasAttribute?.('open')) || (el.hidden === false && el.dataset?.open === '1')));
PANELS.forEach(([button, panel, why]) => {
  const el = $(panel);
  $(button)?.addEventListener('click', () => { if (!held) session.hold(why); });
  if (!el) return;
  ['close', 'cancel'].forEach((ev) => el.addEventListener(ev, () => { if (held?.why === why) session.resume(); }));
  // a panel the shell closes by hand, without the dialog's own event
  try {
    new MutationObserver(() => { if (held?.why === why && !panelOpen(el)) session.resume(); }).observe(el, { attributes: true, attributeFilter: ['open', 'hidden'] });
  } catch (e) { /* no observer */ }
});
/* About TMA, and any other link out of Mercer: while a session is live the page is never unloaded. A shell that has
   built the in-app About handles its own click first, and this listener stands down */
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target?.closest?.('a[href]');
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href') ?? '';
  if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return;
  let url = null;
  try { url = new URL(href, window.location.href); } catch (err) { return; }
  if (url.origin === window.location.origin && url.pathname === window.location.pathname) return;
  if (!session.live()) return;
  e.preventDefault();
  if (typeof M.about?.open === 'function') { session.hold('about'); try { M.about.open({ href: url.href, back: () => session.resume() }); return; } catch (err) { session.resume(); } }
  try { window.open(url.href, '_blank', 'noopener'); } catch (err) { /* the visitor's browser refused; the session stands */ }
});
/* the brand mark is a way home, never a reset: the answers stay and the homepage offers Continue your plan */
$('#wordmark')?.addEventListener('click', () => { if (session.live()) { session.hold('home'); go('arrival'); } });

/* ============ save on this device, schema 3 (R21, brief 14.1 to 14.3, Task 24) ============
   Off until the visitor turns it on (orientation's toggle, or Save and exit). From then every accepted change is written
   under `mercer-answers` as { schema: 3, sessionId, savedAt, revision, route, activeSection, activeQuestionId, answers,
   unknowns, na, evidence, imported, selectedDirection, plan, planRevision, prefs, walk }. A schema 1 copy is migrated
   on read: its answers and unknowns are kept, its derived results dropped. "Saved on this device" is said only after a
   write succeeded. A second tab writing a newer revision is a conflict, never a silent overwrite. Nothing is written
   that the visitor typed into a source document: research.js keeps finds, not the text they came from.

   Schema 3 is the new route order (Tasks 10, 15 and 24). A question keeps its id and its meaning where it moves, so the
   migration from 2 is a field mapping and nothing else: every answer is carried over, the stage a question is now asked
   in is read off the route's own table, and the place the visitor stood is moved to the stage that holds that question
   today. An answer is never discarded because a screen changed position. The two keys the new route retires are mapped
   to the observable facts that replaced them, and a key with no counterpart is kept as it was rather than dropped. */
const SAVE_KEY = 'mercer-answers';
const SAVE_SCHEMA = 3;
/* schema 2 keys whose meaning is now carried by another key. An entry is [key, fn(value, answers)] and writes only what
   the newer key does not already hold: a migration adds, it never overwrites what the visitor has since said */
const MIGRATE_2_TO_3 = {
  // "Could you deliver more if demand grew?" is gone (Task 18): a No is the business saying work was turned away
  canDeliverMore: (v) => (v === 'no' ? { turnedAway: 'yes' } : v === 'yes' ? { turnedAway: 'no' } : {}),
  // the growth screen asked money and time together; the hours keep their own key, which schema 2 already wrote
  changeHours: (v) => ({ changeHours: v }),
};
const SAVE_LIMIT = 512 * 1024;
const SET_KEYS = Object.keys(state).filter((k) => state[k] instanceof Set);
const newId = () => { try { return crypto.randomUUID(); } catch (e) { return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; } };
let sessionId = newId();
let saveTimer = 0;
const prefsNow = () => { let mode = document.body.dataset.mode ?? ''; try { mode = localStorage.getItem('mercer-mode') ?? mode; } catch (e) { /* private window */ } let sound = null; try { sound = typeof M.feel?.soundOn === 'function' ? Boolean(M.feel.soundOn()) : M.feel?.sound ?? null; } catch (e) { sound = null; } return { mode, sound, motion: reduce ? 'reduced' : 'full', saveOn: true, orientVersion: state.orientAck ? ORIENT_VERSION : 0 }; };
const NEVER_SAVED = new Set(['cv', 'cvText', 'note', 'pasted']);
const answersNow = () => { const out = {}; Object.keys(state).forEach((k) => { if (WALK_KEYS.has(k) || k === 'imported' || NEVER_SAVED.has(k) || state[k] instanceof Set) return; const v = state[k]; if (k in BLANK ? JSON.stringify(v) === BLANK[k] : v === null || v === undefined) return; out[k] = v; }); return out; };
const importedNow = () => (Array.isArray(state.imported) && state.imported.length ? state.imported : foundAll().map((f) => ({ field: f.field, value: f.value, month: f.month ?? null, note: f.note ?? '', quote: String(f.quote ?? '').slice(0, 160), source: String(f.source ?? '').slice(0, 80), by: f.by ?? '', status: f.status ?? 'found', edited: Boolean(f.edited) })));
const planNow = () => { try { const c = M.plan?.current?.(); const p = c?.plan ?? (c && !c.stale ? c : null); return p && typeof p === 'object' ? { plan: p, stale: Boolean(c?.stale), revision: p.revision ?? null } : { plan: null, stale: true, revision: null }; } catch (e) { return { plan: null, stale: true, revision: null }; } };
/* the shapes a saved answer may take, by its blank value: a number stays a number, a list a list, and so on */
const shapeOk = (k, v) => {
  if (!(k in BLANK)) return v === null || ['number', 'string', 'boolean'].includes(typeof v) || Array.isArray(v) || (typeof v === 'object' && v !== null && JSON.stringify(v).length < 20000);
  const b = blankOf(k);
  if (v === null) return true;
  if (typeof b === 'number' || b === null) return ['number', 'string', 'boolean'].includes(typeof v) || Array.isArray(v) || typeof v === 'object';
  if (typeof b === 'string') return typeof v === 'string' && v.length <= 20000;
  if (Array.isArray(b)) return Array.isArray(v) && v.length <= 500;
  if (typeof b === 'object') return typeof v === 'object' && !Array.isArray(v);
  return typeof v === typeof b;
};
const idList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.length <= 64).slice(0, 400) : []);
/** a schema 1 copy ({ v: 1, on, at, state, passed }) read as schema 2: answers and unknowns kept, derived results dropped */
function migrate1(data) {
  const st = data.state && typeof data.state === 'object' ? data.state : {};
  const answers = {};
  Object.keys(st).forEach((k) => { if (WALK_KEYS.has(k) || k === 'passed' || SET_KEYS.includes(k)) return; if (k in BLANK) answers[k] = st[k]; });
  const asked = idList(st.asked).map((id) => (id === 'site' ? 'import' : id));
  return { schema: SAVE_SCHEMA, sessionId: newId(), savedAt: typeof data.at === 'string' ? data.at : new Date().toISOString(), revision: 0, route: 'owner', activeSection: null, activeQuestionId: null, answers, unknowns: idList(st.notSure), na: idList(st.na), evidence: {}, imported: Array.isArray(st.imported) ? st.imported : [], selectedDirection: null, plan: null, planRevision: null, prefs: { saveOn: true }, walk: { asked, passed: idList(data.passed), closed: [], planted: false, readyOffered: false, refining: false }, migratedFrom: 1 };
}
/** the stage a question is asked in today, for the route the copy was saved on; null when nothing asks it any more */
function stageOfId(id, route) {
  const was = state.route;
  try { state.route = ROUTE_IDS.includes(route) ? route : was; applyRoute(); return sectionOf(id); }
  finally { state.route = was; applyRoute(); }
}
/** a schema 2 copy read as schema 3 (Task 24): every answer carried over by field mapping, the step moved to the stage
    that asks that question now. Nothing is discarded because a screen changed position. */
function migrate2(data) {
  const answers = { ...(data.answers && typeof data.answers === 'object' && !Array.isArray(data.answers) ? data.answers : {}) };
  Object.keys(MIGRATE_2_TO_3).forEach((k) => {
    if (!(k in answers)) return;
    let mapped = {};
    try { mapped = MIGRATE_2_TO_3[k](answers[k], answers) ?? {}; } catch (e) { mapped = {}; }
    // the mapping adds what the newer key does not already hold; the old key stays, so nothing said is lost
    Object.keys(mapped).forEach((to) => { if (mapped[to] !== undefined && mapped[to] !== null && !given(answers[to])) answers[to] = mapped[to]; });
  });
  const route = ROUTE_IDS.includes(data.route) ? data.route : 'owner';
  const qid = typeof data.activeQuestionId === 'string' ? data.activeQuestionId : null;
  // the step follows its question: a question that moved stage is resumed in the stage that asks it now
  const moved = qid ? stageOfId(qid, route) : null;
  const section = moved ?? (typeof data.activeSection === 'string' ? data.activeSection : null);
  const closed = idList(data.walk?.closed).map((s) => s).filter(Boolean);
  return { ...data, schema: SAVE_SCHEMA, answers, route, activeSection: section, activeQuestionId: qid, walk: { ...(data.walk ?? {}), closed }, migratedFrom: 2 };
}
/** validates a copy as untrusted input: { ok, reason, data } with a schema 3 object when it can be read */
function validate(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, reason: 'empty' };
  if (raw.length > SAVE_LIMIT) return { ok: false, reason: 'too large' };
  let data = null;
  try { data = JSON.parse(raw); } catch (e) { return { ok: false, reason: 'not JSON' }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'not a progress file' };
  if (data.v === 1 && data.state && typeof data.state === 'object') { if (data.on !== true) return { ok: false, reason: 'saved with saving off' }; return { ok: true, data: migrate1(data), migrated: true }; }
  let migrated = false;
  if (data.schema === 2) { data = migrate2(data); migrated = true; }
  if (data.schema !== SAVE_SCHEMA) return { ok: false, reason: typeof data.schema === 'number' ? `schema ${data.schema} is not supported` : 'no schema version' };
  if (data.answers !== undefined && (typeof data.answers !== 'object' || data.answers === null || Array.isArray(data.answers))) return { ok: false, reason: 'answers are not an object' };
  if (data.route !== undefined && data.route !== null && !ROUTE_IDS.includes(data.route)) return { ok: false, reason: 'unknown route' };
  const answers = {};
  Object.keys(data.answers ?? {}).forEach((k) => { if (WALK_KEYS.has(k) || SET_KEYS.includes(k) || k === '__proto__' || k === 'constructor' || k === 'prototype') return; if (shapeOk(k, data.answers[k])) answers[k] = data.answers[k]; });
  const walk = data.walk && typeof data.walk === 'object' ? data.walk : {};
  const evidenceIn = {};
  if (data.evidence && typeof data.evidence === 'object' && !Array.isArray(data.evidence)) Object.keys(data.evidence).forEach((k) => { const e = data.evidence[k]; if (e && typeof e === 'object' && typeof e.state === 'string' && k.length <= 64) evidenceIn[k] = { state: e.state, sourceTitle: String(e.sourceTitle ?? '').slice(0, 300), sourceUrl: String(e.sourceUrl ?? '').slice(0, 500), sourceDate: String(e.sourceDate ?? '').slice(0, 40), retrievedAt: String(e.retrievedAt ?? '').slice(0, 40), excerpt: String(e.excerpt ?? '').slice(0, 400) }; });
  return {
    ok: true,
    migrated,
    data: {
      schema: SAVE_SCHEMA,
      sessionId: typeof data.sessionId === 'string' && data.sessionId.length <= 80 ? data.sessionId : newId(),
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : '',
      revision: Number.isInteger(data.revision) && data.revision >= 0 ? data.revision : 0,
      route: ROUTE_IDS.includes(data.route) ? data.route : null,
      activeSection: WALK.includes(data.activeSection) ? data.activeSection : null,
      activeQuestionId: typeof data.activeQuestionId === 'string' && data.activeQuestionId.length <= 64 ? data.activeQuestionId : null,
      answers,
      unknowns: idList(data.unknowns), na: idList(data.na),
      evidence: evidenceIn,
      imported: Array.isArray(data.imported) ? data.imported.filter((f) => f && typeof f === 'object').slice(0, 200) : [],
      selectedDirection: typeof data.selectedDirection === 'string' ? data.selectedDirection.slice(0, 80) : data.selectedDirection && typeof data.selectedDirection === 'object' && JSON.stringify(data.selectedDirection).length < 8000 ? data.selectedDirection : null,
      plan: data.plan && typeof data.plan === 'object' && !Array.isArray(data.plan) ? data.plan : null,
      planRevision: Number.isInteger(data.planRevision) ? data.planRevision : null,
      prefs: data.prefs && typeof data.prefs === 'object' ? data.prefs : {},
      walk: { asked: idList(walk.asked), passed: idList(walk.passed), closed: idList(walk.closed).filter((s) => INTERVIEW.includes(s)), planted: walk.planted === true, readyOffered: walk.readyOffered === true, refining: walk.refining === true, stage: typeof walk.stage === 'string' ? walk.stage : null },
      migratedFrom: Number.isInteger(data.migratedFrom) ? data.migratedFrom : null,
    },
  };
}
/** the copy put into state: answers, marks, evidence, the walk; no forecast is run here */
function load(d) {
  Object.keys(d.answers).forEach((k) => { state[k] = d.answers[k]; });
  state.notSure = new Set(d.unknowns);
  state.na = new Set(d.na);
  state.asked = d.walk.asked.filter((id) => id !== 'readiness');
  passed.clear(); d.walk.passed.forEach((id) => passed.add(id));
  closed.clear(); d.walk.closed.forEach((s) => closed.add(s));
  planted = d.walk.planted; readyOffered = d.walk.readyOffered; refining = d.walk.refining;
  Object.keys(evidenceMap).forEach((k) => delete evidenceMap[k]);
  Object.assign(evidenceMap, d.evidence);
  if (Array.isArray(d.imported) && d.imported.length) state.imported = d.imported; // research.js re-seeds its list from state.imported when it is next read
  if (d.selectedDirection) state.direction = d.selectedDirection;
  if (d.route) state.route = d.route;
  if (d.prefs?.orientVersion) state.orientAck = d.prefs.orientVersion;
  revision = d.revision;
  sessionId = d.sessionId;
  M.planObj = d.plan && d.planRevision === d.revision ? d.plan : null;
  M.cvFacts = state.cv && state.cv.trim() && M.readCV ? M.readCV(state.cv) : null;
  M.result = null; M.resultKey = null; M.measured = null; M.planned = null;
  reached = {};
  applyRoute();
  setCurrency(state.currency);
  save.at = { section: d.activeSection, questionId: d.activeQuestionId, stage: d.walk.stage, savedAt: d.savedAt };
}
const save = {
  on: false,
  restored: false,
  failed: false,
  wrote: false,
  paused: false,
  conflict: null,
  at: null,
  sessionId: () => sessionId,
  newSession() { sessionId = newId(); save.restored = false; save.at = null; save.conflict = null; save.paused = false; },
  /** the copy as it would be written now */
  snapshot() {
    const pn = planNow();
    return {
      schema: SAVE_SCHEMA, sessionId, savedAt: new Date().toISOString(), revision, route: state.route,
      activeSection: WALK.includes(state.section) ? state.section : null, activeQuestionId: askId && askId !== 'readiness' ? askId : null,
      answers: answersNow(), unknowns: [...state.notSure], na: [...state.na], evidence: { ...evidenceMap }, imported: importedNow(),
      selectedDirection: state.direction ?? null, plan: pn.plan, planRevision: pn.plan ? pn.revision : null, prefs: prefsNow(),
      walk: { asked: [...state.asked], passed: [...passed], closed: [...closed], planted, readyOffered, refining, stage: state.stage },
    };
  },
  write() {
    if (!save.on || save.paused) return false;
    try {
      const text = JSON.stringify(save.snapshot());
      if (text.length > SAVE_LIMIT) { save.failed = true; save.wrote = false; dispatch('mercer:save', { on: true, ok: false, reason: 'too large' }); return false; }
      localStorage.setItem(SAVE_KEY, text);
      save.failed = false; save.wrote = true;
      return true;
    } catch (e) { save.failed = true; save.wrote = false; dispatch('mercer:save', { on: true, ok: false, reason: 'not saved' }); return false; }
  },
  soon() { if (!save.on) return; clearTimeout(saveTimer); saveTimer = setTimeout(save.write, 400); },
  enable() {
    save.on = true;
    const ok = save.write();
    dispatch('mercer:save', { on: true, ok });
    return ok;
  },
  /** saving off again: nothing more is written; what was written stays until Forget */
  disable() { save.on = false; clearTimeout(saveTimer); dispatch('mercer:save', { on: false, ok: true }); },
  /** whether a copy this page could resume stands on this device */
  hasSaved() { try { return validate(localStorage.getItem(SAVE_KEY) ?? '').ok; } catch (e) { return false; } },
  /** Save and exit (brief 14.2): the write completes first, then the homepage with Continue your plan. Saving off is turned on
      by this deliberate action. { ok, reason } */
  async exit() {
    clearTimeout(saveTimer);
    if (!save.on) save.on = true;
    const ok = save.write();
    dispatch('mercer:save', { on: true, ok, exit: true });
    if (!ok) return { ok: false, reason: 'The answers were not saved. Download a progress file before leaving.' };
    await go('arrival');
    return { ok: true };
  },
  /** the scope of Forget, in words, for the confirmation the shell shows first */
  forgetScope: () => 'Forget this visit removes the answers saved in this browser. It does not recall a plan you downloaded or a brief you sent.',
  /** Forget this visit: the saved copy goes, saving stops, the answers on screen stay. Refused without { confirmed: true } */
  forget(o = {}) {
    if (!o.confirmed) { dispatch('mercer:save-confirm', { scope: save.forgetScope() }); return { ok: false, needsConfirm: true, scope: save.forgetScope() }; }
    save.on = false;
    save.restored = false;
    save.wrote = false;
    save.conflict = null; save.paused = false;
    clearTimeout(saveTimer);
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* private window */ }
    dispatch('mercer:save', { on: false, ok: true, forgot: true });
    return { ok: true };
  },
  /** puts back what was saved on this device; true when answers came back */
  restore() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
    const v = validate(raw ?? '');
    // a saved copy that cannot be read is said out loud: failing closed in silence looks like lost answers
    if (!v.ok) { save.lastError = v.reason ?? 'unreadable'; if (raw) dispatch('mercer:restore-failed', { reason: v.reason ?? 'unreadable' }); return false; }
    save.lastError = null;
    load(v.data);
    save.on = true;
    save.restored = true;
    save.wrote = true;
    save.migrated = Boolean(v.migrated);
    const biz = $('#biz'); if (biz && state.biz && !biz.value) biz.value = state.biz;
    paintRing();
    dispatch('mercer:restored', { at: v.data.savedAt || null, revision, route: state.route, migrated: Boolean(v.migrated) });
    dispatch('mercer:save', { on: true, ok: true });
    return true;
  },
  /** the progress file (brief 13.5, 14.2): the same copy, as text to download; review() says what it holds */
  exportFile() { return JSON.stringify({ kind: 'mercer-progress', ...save.snapshot() }, null, 2); },
  review() {
    const s = save.snapshot();
    const n = Object.keys(s.answers).length;
    return { answers: n, unknowns: s.unknowns.length, imported: s.imported.length, plan: Boolean(s.plan), route: s.route, lines: [`${plural(n, 'answer', 'answers')} and ${plural(s.unknowns.length, 'unknown', 'unknowns')}`, s.imported.length ? `${plural(s.imported.length, 'imported find', 'imported finds')} with their sources` : 'no imported finds', s.plan ? 'the current plan' : 'no plan yet', 'no CV, no pasted document text, no credentials'] };
  },
  /** a progress file read as untrusted input: nothing changes until load() is called. { ok, reason, summary, load } */
  importFile(text) {
    const v = validate(String(text ?? '').replace(/^﻿/, ''));
    if (!v.ok) return { ok: false, reason: v.reason };
    const d = v.data;
    const summary = { answers: Object.keys(d.answers).length, unknowns: d.unknowns.length, route: d.route, savedAt: d.savedAt, migrated: Boolean(v.migrated) };
    return { ok: true, summary, load: () => { load(d); save.restored = true; save.at = save.at ?? null; applyRoute(); paintRing(); paintTree(); dispatch('mercer:restored', { at: d.savedAt || null, revision, route: state.route, imported: true }); return true; } };
  },
  /** the conflict (brief 14.3): a newer copy from another tab. resolve('keep') writes this tab's answers over it,
      resolve('load') takes the other tab's; until then nothing is written */
  resolve(choice) {
    const c = save.conflict;
    if (!c) return false;
    save.conflict = null; save.paused = false;
    if (choice === 'load' && c.raw) { const v = validate(c.raw); if (v.ok) { load(v.data); save.restored = true; paintRing(); paintTree(); dispatch('mercer:restored', { at: v.data.savedAt || null, revision, route: state.route, fromTab: true }); return true; } }
    if (choice === 'keep') { revision = Math.max(revision, c.theirs.revision + 1); return save.write(); }
    return false;
  },
  /** the privacy line, as it stands now: "Saved on this device" only after a write succeeded */
  line: () => (save.on && save.wrote ? 'Saved on this device, at your request. Nothing is sent by this page unless you choose to send it.' : save.on ? 'Saving on this device is on; nothing has been written yet.' : 'Stays in this browser for this visit. Nothing is sent by this page unless you choose to send it.'),
  /** the line a restored visit opens with */
  restoredLine: () => (save.restored ? 'Your saved answers are back. They are kept on this device only.' : ''),
};
M.save = save;
document.addEventListener('mercer:revision', save.soon);
document.addEventListener('mercer:question', save.soon);
document.addEventListener('mercer:close', save.soon);
document.addEventListener('mercer:stage', save.soon);
window.addEventListener('pagehide', () => { if (save.on && !save.paused) save.write(); });
// another tab wrote a newer copy: a conflict choice, not a silent overwrite
window.addEventListener('storage', (e) => {
  if (e.key !== SAVE_KEY || !save.on) return;
  if (e.newValue === null) { return; }
  const v = validate(e.newValue ?? '');
  if (!v.ok) return;
  const d = v.data;
  // the same session at an older or equal revision is this tab's own earlier copy: nothing to settle
  if (d.sessionId === sessionId && d.revision <= revision) return;
  save.conflict = { theirs: { revision: d.revision, savedAt: d.savedAt, sessionId: d.sessionId }, mine: { revision, sessionId }, raw: e.newValue };
  save.paused = true;
  clearTimeout(saveTimer);
  dispatch('mercer:save-conflict', { theirs: save.conflict.theirs, mine: save.conflict.mine });
});

/* ============ the foot, the keys, the swipe, the switches ============ */
/* one press, one move: the second click of a double click (detail 2 and up) is dropped here, a key held down on a foot
   button makes no stream of clicks, and whatever gets past both meets the lock in next(), back() and notSure() */
const oncePress = (sel, fn) => {
  const el = $(sel);
  if (!el) return;
  el.addEventListener('click', (e) => { if (e.detail > 1) return; fn(); });
  el.addEventListener('keydown', (e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); });
};
oncePress('#next', () => next());
oncePress('#back', () => back());
oncePress('#unsure', () => { if (state.stage === 'section') notSure(askId); });
$('#q-title')?.addEventListener('click', (e) => {
  const ex = $('#q-explain');
  if (!ex || !ex.textContent) return;
  const open = ex.hidden;
  if (typeof M.feel?.toggle === 'function') M.feel.toggle(ex, open, e.currentTarget);
  else { ex.hidden = !open; e.currentTarget.setAttribute('aria-expanded', String(open)); }
});
/* the homepage (R12): the two route buttons, Continue your plan, Start again; the old Begin button walks the owner route */
const bizIn = () => { if (!state.biz) { const v = $('#biz')?.value?.trim(); if (v) state.biz = v; } };
oncePress('#route-owner', () => { if (state.stage === 'arrival') { bizIn(); setRoute('owner'); go('orient'); } });
oncePress('#route-starter', () => { if (state.stage === 'arrival') { bizIn(); setRoute('starter'); go('orient'); } });
oncePress('#resume', () => { if (state.stage === 'arrival') resume(); });
oncePress('#restart', () => { if (state.stage === 'arrival') restart(); });
oncePress('#begin', () => { if (state.stage === 'arrival') { bizIn(); if (!state.route) setRoute('owner'); go('orient'); } });
$('#biz')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && state.stage === 'arrival') { e.preventDefault(); bizIn(); if (!state.route) setRoute('owner'); go('orient'); } });
/* orientation (R14): one Continue, and the save toggle */
oncePress('#orient-go', () => { if (state.stage === 'orient') start(); });
$('#orient-save')?.addEventListener('change', (e) => { const on = Boolean(e.target.checked); if (on) save.enable(); else save.disable(); });
$('#cut-skip')?.addEventListener('click', () => { if (state.stage === 'cutscene') { if (M.canopy?.skip) M.canopy.skip(); else go('explore'); } });
// Enter inside an instrument commits and presses Continue
document.addEventListener('mercer:enter', () => {
  const n = $('#next');
  if (n && !n.disabled && state.stage === 'section') next();
});
// the tree never turns while a text field has focus
document.addEventListener('focusin', (e) => { if (e.target.matches?.('input, textarea, [contenteditable]')) { T((t) => t.lockDrag?.(true)); document.body.dataset.lock = '1'; } });
document.addEventListener('focusout', (e) => { if (e.target.matches?.('input, textarea, [contenteditable]')) { T((t) => t.lockDrag?.(false)); delete document.body.dataset.lock; } });
/* arrow keys move; nothing says so. The listener sits on the document in the bubble phase, so every instrument has
   the key first: one that uses Left and Right (a rail's handle, the ring, the dial, the sorter, a pair row, a pill that is
   not the last) calls preventDefault and the key stops there. What is left over moves between questions:
   - in a one-line text field, Right with the caret at the end and Left with the caret at the start, nothing selected;
   - anywhere else inside an instrument, or on the page itself, Left and Right as they come.
   Before Continue, the field commits as a click on Continue would make it (blur). At the crown the keys turn the cards */
const caretAt = (el, end) => {
  try { const a = el.selectionStart, b = el.selectionEnd; return a !== null && a !== undefined && a === b && a === (end ? el.value.length : 0); } catch (e) { return false; }
};
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
  const t = e.target;
  // the focused tree has its own arrows (turn, zoom, fit), and the help, share, inspect and wheel panels keep their keys
  if (t?.closest?.('#stage, #help-panel, #share, #inspect, #wheel-panel, #orient')) return;
  const st = state.stage;
  const right = e.key === 'ArrowRight', left = e.key === 'ArrowLeft';
  const field = Boolean(t?.matches?.('input, textarea, select, [contenteditable]'));
  if (st === 'section' || st === 'close' || st === 'ready') {
    if (e.key === ' ' && st === 'close' && !field && !t?.closest?.('button, a, .ui')) { const n = $('#next'); if (n && !n.disabled) { e.preventDefault(); next(); } return; }
    if (!right && !left) return;
    if (field && !(t.matches('input') && caretAt(t, right))) return;
    const inside = Boolean(field || t?.closest?.('.ui'));
    if (left) { if (!canBack() || moving) return; e.preventDefault(); if (inside) t.blur?.(); back(); return; }
    if (moving || st === 'ready') return;
    // what a click on Continue would commit first: the field in hand
    if (inside) t.blur?.();
    const n = $('#next');
    if (n && !n.disabled) { e.preventDefault(); next(); } else if (inside) { try { t.focus?.({ preventScroll: true }); } catch (err) { /* gone */ } }
    return;
  }
  // the results keep their fields and instruments to themselves (the dial and the agent's line on the You card)
  if (field || t?.closest?.('.ui')) return;
  if (st === 'explore') {
    if (right || left) { e.preventDefault(); if (right) M.canopy?.nextCard?.(); else M.canopy?.prevCard?.(); }
    else if (e.key === 'Escape') M.canopy?.closeCard?.();
  } else if (st === 'plan' && (e.key === 'Escape' || left)) { e.preventDefault(); back(); }
});
// a swipe right on the clearing is Back on the phone; a swipe left does nothing
(() => {
  const host = $('#clearing');
  if (!host) return;
  let x0 = 0, y0 = 0, on = false;
  host.addEventListener('touchstart', (e) => { if (e.touches.length !== 1 || e.target.closest?.('.ui, input, textarea')) { on = false; return; } on = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  host.addEventListener('touchend', (e) => {
    if (!on) return; on = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (window.innerWidth <= 720 && dx > 60 && Math.abs(dy) < 40 && (state.stage === 'section' || state.stage === 'close')) back();
  }, { passive: true });
})();
// the birds and the tint follow the cards at the crown
document.addEventListener('mercer:card', (e) => {
  const id = e.detail?.id ?? null;
  try { M.feel?.birds?.fade?.(id ? 0 : 1, 2000); } catch (err) { /* optional */ }
  if (state.stage !== 'explore') return;
  const sec = id && SECTION_BY[id] ? id : id && SECTION_OF_LIMB[id] ? SECTION_OF_LIMB[id] : 'plan';
  setTint(SECTION_BY[sec]?.hue ?? '--sec-crown');
});
document.addEventListener('mercer:planned', () => { if (state.stage === 'cutscene' || state.stage === 'explore') ladder(); });
// an import find confirmed or excluded is an accepted change (C05, C06): research.js says so with mercer:import
document.addEventListener('mercer:import', (e) => { bump(e.detail?.id ?? 'import', 'import'); paintTree(); });
document.addEventListener('mercer:found', () => { bump('import', 'import'); paintTree(); });

/* ============ at rest ============ */
let saved = null;
try { saved = localStorage.getItem('mercer-mode'); } catch (e) { /* private window */ }
const hostMode = () => { const t = document.documentElement.dataset.theme; return t === 'light' || t === 'dark' ? t : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; };
setMode(saved === 'light' || saved === 'dark' ? saved : hostMode(), false);
if (saved) manualMode = true;
const followHost = () => { if (!manualMode) setMode(hostMode(), false); };
new MutationObserver(followHost).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', followHost);
if (tree) {
  T((t) => t.frame?.('arrival'));
  // a limb touched at the crown opens its card; during the interview the camera goes to it and comes back on the next question
  tree.on?.('select', (id) => {
    if (!id) return;
    if (state.stage === 'explore') return;
    if (state.stage === 'section' && LIMBS.includes(id)) T((t) => t.frame?.(presetOfLimb(id)));
  });
}
document.body.dataset.stage = state.stage;
// answers saved on this device come back before the first paint of the wheel; with nothing saved this does nothing
try { save.restore(); } catch (e) { /* a saved copy that cannot be read is left alone */ }
paintArrival();
paintRing();
footWords();
})();
