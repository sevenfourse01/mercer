/* canopy.js (Mercer 12, owner results): the results, built around the tree.

   Part one (the recap): four beats (Recognise, Focus, Move, Open) over the rising tree, read from the plan object, on
   the cutscene mechanism: Back, Continue, Go to my plan, keys and taps. Nothing turns on a timer. Part two (explore): the discs on the limbs (a row on
   the phone), one card at a time in the clearing, one ▾ that opens the section's leaves. Part three (Your plan, the
   #plan container): four stages on the one tree (Your move, Why, Your plan, Start), each with one primary action and
   one shared inspector; the full plan, the downloads, the TMA handoff and the review panel, the agent, Save on this
   device and the Disclaimer sit behind drawers inside the stages. One plan object
   (M.plan.current(), or this file's own builder over the present engine while plan.js is absent) drives the recap,
   the plan view, both exports and the brief for TMA. Every figure on this page is an engine output or the visitor's
   own answer; the vocabulary (COPY §10) is defined once and reused. */
(() => {
'use strict';
const M = window.Mercer;
const { E, $, $$, gbp, count, clamp, monthName, svgEl, esc, shortGbp, state } = M;
const reduce = () => (typeof M.feel?.reduced === 'function' ? M.feel.reduced() : !!M.reduce);
const tree = () => (M.tree && typeof M.tree.frame === 'function' ? M.tree : null);
const BOOKING_URL = 'https://cal.com/adam-attia-b3ay43/tma-call';
const TMA_BAR = 65;
const SECURITY_LINE = 'Client-side code is minified, not hidden.';
/* Rebuild 1: the route (R1), the answer revision (R21) and the plan stage. The shell renames #harvest to #plan and the
   stage word with it; both are read here so the page works with either shell. */
const routeOf = () => (state.route === 'starter' ? 'starter' : 'owner');
const revisionNow = () => (Number.isFinite(M.revision) ? M.revision : Number.isFinite(state.revision) ? state.revision : 0);
const isPlanStage = (s) => s === 'plan' || s === 'harvest';
const planHost = () => $('#plan') ?? $('#harvest');

/* ============ small helpers (v11, kept) ============ */
const monthShort = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toLocaleString('en-GB', { month: 'short' }); };
const monthShortYear = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toLocaleString('en-GB', { month: 'short', year: 'numeric' }); };
const P = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95];
const qAt = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
const plan = () => M.planned ?? null;
/* Refine 1, R19: the number of runs is read from the run the figures came from (the plan's own draws at month one, then the
   headline forecast's), never written down. 0 when no run has landed, and then no sentence names a count. */
const runsOf = (p = plan()) => p?.months?.[0]?.length || p?.draws || M.result?.months?.[0]?.length || 0;
const runsWord = (p) => count(runsOf(p));
/* every forecast this file makes itself goes through engineRun, so the Method block's total is exact: when (d)'s simCount did
   not see the call (its total did not move), the run's draws are added to this file's own tally. As in (d)'s count, E.plan's
   draws are not claimed: a plan is passed with kind 'plan' and only E.forecast runs are counted. */
const ownRuns = { total: 0, runs: 0 };
const simTotal = () => { try { const c = M.simCount?.(); return Number.isFinite(c?.total) ? c.total : null; } catch (e) { return null; } };
const engineRun = (fn, kind = 'forecast') => {
  const was = simTotal();
  const out = fn();
  if (out && kind === 'forecast' && simTotal() === was) { const n = out.months?.[0]?.length || out.draws || 0; if (n) { ownRuns.total += n; ownRuns.runs += 1; } }
  return out;
};
/** { headline, total, runs }: headline is the run the page's figures come from; total and runs are null when (d) keeps no count */
function simCounts() {
  let c = null;
  try { c = M.simCount?.() ?? null; } catch (e) { c = null; }
  const headline = (Number.isFinite(c?.headline) && c.headline > 0 ? c.headline : 0) || M.result?.months?.[0]?.length || runsOf();
  if (c && Number.isFinite(c.total) && c.total > 0) return { headline, total: c.total + ownRuns.total, runs: Number.isFinite(c.runs) ? c.runs + ownRuns.runs : null };
  return { headline, total: null, runs: null };
}
const goalMonth = () => state.months ?? 12;
const ind = () => (M.INDUSTRY ?? []).find((i) => i.id === state.sector);
const pct = (x) => `${Math.round(x * 100)}%`;
const oneDp = (x) => Number(x).toFixed(1).replace(/\.0$/, '');
/** "3 sales" / "1 sale" (fix 3, C24): (d)'s M.plural when it is there (it compares count(v) to "1"), the same rule here when it is not */
const plural = (v, one, many) => { try { const s = M.plural?.(v, one, many); if (typeof s === 'string' && s) return s; } catch (e) { /* the local form */ } const c = count(v); return `${c} ${c === '1' ? one : many}`; };
/** the same for a figure printed to one decimal: "1 month", "1.5 months" */
const pluralDp = (x, one, many) => { const c = oneDp(x); return `${c} ${c === '1' ? one : many}`; };
const article = (w) => (/^[aeiou]/i.test(String(w ?? '')) ? 'an' : 'a');
const cap = (t) => { const s = String(t ?? ''); return s.charAt(0).toUpperCase() + s.slice(1); };
/** D6: headlines in title case, by (d)'s rule; the words stay as written when (d) has not landed it */
const titleCase = (t) => { try { return M.titleCase?.(t) ?? t; } catch (e) { return t; } };
const noSpend = () => state.appetite === 'none';
const movePct = (e) => { const v = Math.abs(e * 10); return v >= 10 ? String(Math.round(v)) : oneDp(v); };
const lc = (s) => (/^(LinkedIn|Google|Facebook|Instagram|TikTok|Search)/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const sectorWord = () => (typeof M.sectorWord === 'function' ? M.sectorWord(state.sector) : 'your industry').toLowerCase();
const peakOf = (p) => (p?.utilisation?.length ? Math.max(...p.utilisation) : undefined);
/** words from other parts of the page, held to this page's rules: no dashes as punctuation, no filler, and the page's own
    vocabulary (D2: "middle run", never "median"; C29: no engine-room words) */
const DASHES = new RegExp('\\s*[' + String.fromCharCode(8212, 8211) + ']\\s*', 'g');
const clean = (t) => String(t ?? '').replace(DASHES, ', ').replace(/\b[Aa]ctually,?\s+/g, '').replace(/,\s*([.,;:])/g, '$1').replace(/Mercer[’']s simulations/g, () => (runsOf() ? `${runsWord()} runs` : 'Mercer’s simulations'))
  .replace(/\bmedian\b/g, 'middle run').replace(/a pack constant/g, 'Mercer’s fixed rule').replace(/Mercer[’']s cost of doing nothing: inaction/g, 'no growth spend');
const bindingOf = (p) => (p?.constraints ?? []).find((c) => c.binding) ?? null;
/** the unit word; pass the count and one of them comes back singular ("1 client") when (e)'s table can say it */
const unitWord = (p, n) => (typeof M.unitWord === 'function' ? M.unitWord(p?.unit, n) : 'clients');

/* figures rounded outward, so a range is never narrower than the run says; below £1,000 a figure prints as it is (fix 3, item 3) */
const stepOf = (v) => { const a = Math.abs(v); return a >= 10000 ? 1000 : a >= 1000 ? 100 : 1; };
const down = (v) => Math.floor(v / stepOf(v)) * stepOf(v);
const up = (v) => Math.ceil(v / stepOf(v)) * stepOf(v);
const near = (v) => Math.round(v / stepOf(v)) * stepOf(v);
const kg = (v, dir = 'near') => {
  const f = dir === 'down' ? Math.floor : dir === 'up' ? Math.ceil : Math.round;
  const a = Math.abs(v), sign = v < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}£${(f(a / 1e5) / 10).toFixed(1).replace(/\.0$/, '')}m`;
  if (a >= 1e4) return `${sign}£${f(a / 1e3)}k`;
  if (a >= 1e3) return `${sign}£${(f(a / 1e2) / 10).toFixed(1).replace(/\.0$/, '')}k`;
  return `${sign}£${f(a)}`;
};

/* the shared feel: sounds, the open/close animation, the birds; every call survives feel.js missing */
const feel = {
  play(name, o) { try { M.feel?.play?.(name, o); } catch (e) { /* silent */ } },
  x(el) { try { return M.feel?.panOf?.(el) ?? 0.5; } catch (e) { return 0.5; } },
  toggle(body, open, head, o) {
    if (!body) return;
    if (typeof M.feel?.toggle === 'function') { try { M.feel.toggle(body, open, head, o); return; } catch (e) { /* fall through */ } }
    if (head) head.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
  },
  birds(level, ms) { try { M.feel?.birds?.fade?.(level, ms); } catch (e) { /* none */ } },
  grade(el, v, lo, hi) { try { M.feel?.paintGrade?.(el, v, lo, hi); } catch (e) { /* no grade */ } },
};
const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? 0 : ms));
const idle = (fn) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => fn(), { timeout: 120 }) : setTimeout(fn, 0));

/* the business, by name */
const bizName = () => String(state.biz ?? '').trim() || 'Your business';
const possessive = (name) => { const n = String(name ?? '').replace(/\s+/g, ' ').trim(); return n ? `${n}’s` : 'Your'; };
const treeName = () => { try { const f = M.feel?.possessive?.(state.biz ?? '', 'tree'); if (f) return f; } catch (e) { /* local form */ } return `${possessive(state.biz)} tree`; };
const basis = () => {
  if (state.appetite === 'none') return 'budget';
  if (state.basis === 'budget') return 'budget';
  if (state.basis === 'revenue' && state.goal) return 'revenue';
  return state.goalMode === 'max' || !state.goal ? 'budget' : 'revenue';
};
const slug = () => (state.biz || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* ============ the sections and the parts of the tree they live on (WORK 0.2; read from (d) when present) ============ */
const LOCAL_SECTIONS = [
  { id: 'roots', name: 'Roots', purpose: 'who you are', part: 'roots', hue: '--sec-ground', key: 'D' },
  { id: 'offer', name: 'The offer', purpose: 'what one sale is worth', part: 'pricing', hue: '--sec-offer', key: 'G' },
  { id: 'reach', name: 'Reach', purpose: 'who is out there', part: 'demand', t: 0.35, hue: '--sec-reach', key: 'C' },
  { id: 'routes', name: 'Routes in', purpose: 'how they find you', part: 'demand', t: 0.8, hue: '--sec-routes', key: 'D' },
  { id: 'close', name: 'The close', purpose: 'how enquiries become sales', part: 'conversion', hue: '--sec-close', key: 'A' },
  { id: 'delivery', name: 'Delivery', purpose: 'how much you can take on', part: 'capacity', hue: '--sec-delivery', key: 'E' },
  { id: 'money', name: 'Money', purpose: 'what you keep', part: 'margin', hue: '--sec-money', key: 'F#' },
  { id: 'clients', name: 'Best clients', purpose: 'who pays you most, and why they came', part: 'retention', hue: '--sec-clients', key: 'B' },
  { id: 'you', name: 'You', purpose: 'what you bring', part: 'trunk', hue: '--sec-you', key: 'G' },
  { id: 'control', name: 'Control', purpose: 'who decides, now and later', part: 'trunk', hue: '--sec-control', key: 'A' },
  { id: 'ground', name: 'Ground', purpose: 'what feeds the tree from outside', part: 'roots', hue: '--sec-ground', key: 'D' },
  { id: 'crown', name: 'Crown', purpose: '', part: 'crown', hue: '--sec-crown', key: 'C' },
];
const sections = () => (Array.isArray(M.SECTIONS) && M.SECTIONS.length ? M.SECTIONS : LOCAL_SECTIONS);
const sectionBy = (id) => sections().find((s) => s.id === id) ?? LOCAL_SECTIONS.find((s) => s.id === id) ?? null;
const DISC_BASE = ['offer', 'reach', 'routes', 'close', 'delivery', 'money', 'clients', 'you', 'ground', 'crown'];
/** Refine 1, R18: the Control disc stands after You, and only when the control answers have something to say (controlView) */
const discOrder = () => { let on = false; try { on = !!controlView(); } catch (e) { on = false; } return on ? DISC_BASE.flatMap((id) => (id === 'you' ? ['you', 'control'] : [id])) : DISC_BASE; };
/** the sections whose answers the exports list: the control section's answers are listed whenever (d) has the section */
const answerSections = () => { const base = DISC_BASE.filter((id) => id !== 'crown'); return sections().some((x) => x.id === 'control') ? base.flatMap((id) => (id === 'you' ? ['you', 'control'] : [id])) : base; };
/** the anchor part for a section: a limb id, 'trunk', 'roots', 'crown' or { limb, t } */
const partOf = (id) => { const s = sectionBy(id); if (!s) return 'crown'; return s.t !== undefined ? { limb: s.part, t: s.t } : s.part; };
const PRESET_OF = { control: 'you', offer: 'offer', reach: 'reach', routes: 'routes', close: 'close', delivery: 'delivery', money: 'money', clients: 'clients', you: 'you', ground: 'ground', crown: 'explore', roots: 'ground' };
const SECTION_OF_DRIVER = { pricing: 'offer', demand: 'reach', conversion: 'close', capacity: 'delivery', margin: 'money', retention: 'clients', trunk: 'you', roots: 'ground' };
const LIMB_OF_SECTION = { offer: 'pricing', reach: 'demand', routes: 'demand', close: 'conversion', delivery: 'capacity', money: 'margin', clients: 'retention' };
const questionsOf = (id) => { try { return M.sectionQuestions?.(id) ?? []; } catch (e) { return []; } };
const answeredQ = (qid) => { try { return !!M.answered?.(qid); } catch (e) { return false; } };
const naHas = (qid) => { try { return !!(state.na && state.na.has && state.na.has(qid)); } catch (e) { return false; } };
/** a section's buds: the questions it showed that are still pale, the same test (d)'s twigs use: shown, not answered, not N/A
    and not left with Not sure (Not sure has a stand-in and is the visitor's answer; it was counted as unfinished before fix 3) */
const budsOf = (id) => { const asked = new Set(state.asked ?? []); return questionsOf(id).filter((qid) => asked.has(qid) && !answeredQ(qid) && !naHas(qid) && !unsure(qid)); };
/** a section is unfinished when a question it showed is still a bud */
const unfinished = () => discOrder().filter((id) => id !== 'crown').filter((id) => budsOf(id).length > 0);
/** U35: an unfinished disc, twig or card row sends the visitor back to the one question they left; (d)'s reopen() brings them
    back to explore with that section's card open. False when (d) has no reopen, so the caller opens the card instead. */
let reopening = false; // true for the turn in which a press went back to a question, so the tree's select that follows opens no card
function reopenBud(sectionId) {
  const qid = budsOf(sectionId)[0];
  if (!qid || typeof M.reopen !== 'function') return false;
  feel.play('tap', { x: 0.5 });
  reopening = true;
  setTimeout(() => { reopening = false; }, 0);
  try { Promise.resolve(M.reopen(qid)).catch(() => { /* (d) reports its own faults */ }); } catch (e) { reopening = false; return false; }
  return true;
}

/* ============ the steps Mercer tested, in words (v11, the titles made incisive) ============ */
const LEVER_WORDS = [
  [/add one .*server/i, 'capacity', 'Add one person'],
  [/service rate|capacity/i, 'capacity', 'Deliver more per person'],
  [/budget/i, 'demand', 'Raise the growth budget'],
  [/deal value|price/i, 'pricing', 'Raise your price'],
  [/close rate/i, 'conversion', 'Close more enquiries'],
  [/mailbox/i, 'demand', 'Add sending mailboxes'],
  [/market|addressable|criteria|trigger/i, 'demand', 'Find more prospects'], // D1: one name, prospects; the same title in (d)
  [/margin/i, 'margin', 'Raise your margin'],
  [/retention/i, 'retention', 'Keep customers longer'],
];
const leverWords = (text) => {
  const hit = LEVER_WORDS.find(([re]) => re.test(text));
  return hit ? { driver: hit[1], title: hit[2] } : { driver: 'demand', title: clean(text).charAt(0).toUpperCase() + clean(text).slice(1) };
};
const DIFFICULTY = { low: 'low difficulty', medium: 'medium difficulty', high: 'high difficulty' };
const W_OF = { low: 1, medium: 2, high: 3 };
const COMPONENTS = {
  forecastConfidence: ['Scenario confidence', 'How narrow the scenario range is'],
  headroom: ['Growth left', 'How much revenue you can add'],
  capacityFit: ['Capacity fit', 'Whether you can deliver the extra work'],
  constraintSolvability: ['Limits TMA can lift', 'Whether TMA can move what holds growth back'],
  marginStructure: ['Margin', 'What you keep of each sale'],
  unitEconomicsViability: ['Payback per customer', 'Whether customers pay back what they cost to win'],
  dataAvailability: ['Your own data', 'How much of the forecast rests on your figures'],
};
const INPUT_WORDS = {
  serviceRatePerServerPerMonth: { name: 'Capacity', of: 'how much each person delivers', driver: 'capacity', key: 'capacity' },
  statedCloseRate: { name: 'Close rate', of: 'your close rate', driver: 'conversion', key: 'close' },
  acv: { name: 'Sale value', of: 'your price', driver: 'pricing', key: 'price' },
  addressableCount: { name: 'Prospects', of: 'the number of prospects', driver: 'demand', key: 'market' },
  budget: { name: 'Growth spend', of: 'your growth spend', driver: 'demand', key: 'budget' },
  grossMargin: { name: 'Margin', of: 'your margin', driver: 'margin', key: 'margin' },
  retentionMonths: { name: 'Customer lifespan', of: 'how long customers stay', driver: 'retention', key: 'retention' },
};
/* D2, the limit vocabulary, word for word what (d) holds: the names, the short names, the subject phrases (all singular but
   prospects, which has its own clause). "Binds" and "median" never reach the page or an export. */
const LIMIT_NAME = { client_capacity: 'Your capacity', market_depletion: 'Your prospects', channel_cap: 'Your routes', tma_capacity: 'TMA’s build slots' };
const LIMIT_SHORT = { client_capacity: 'Capacity', market_depletion: 'Prospects', channel_cap: 'Routes', tma_capacity: 'Build slots' };
const LIMIT_PHRASE = { client_capacity: 'capacity', market_depletion: 'your prospects', channel_cap: 'route sending capacity', tma_capacity: 'TMA’s build schedule' };
const LIMIT_BRANCH = { client_capacity: 'capacity', market_depletion: 'demand', channel_cap: 'demand', tma_capacity: 'capacity' };
const LIMIT_SECTION = { client_capacity: 'delivery', market_depletion: 'reach', channel_cap: 'routes', tma_capacity: 'delivery' };
/* this file's own strings come first, so the page holds D2 whatever (d) holds; (d)'s table names a type this file has not met */
const limitName = (type) => LIMIT_NAME[type] ?? M.LIMIT_NAME?.[type] ?? 'One limit';
const limitShort = (type) => LIMIT_SHORT[type] ?? M.LIMIT_SHORT?.[type] ?? 'Limit';
/** D2's clause. first: "... first"; a month: "... from {Month YYYY}" ("in" for prospects); neither: "... now". (d)'s M.limitClause when it is there. */
const localClause = (type, { month = null, first = false } = {}) => {
  if (type === 'market_depletion') return first ? 'your prospects run out first' : month ? `your prospects run out in ${month}` : 'your prospects run out now';
  const ph = LIMIT_PHRASE[type] ?? 'one limit';
  return first ? `${ph} limits growth first` : month ? `${ph} limits growth from ${month}` : `${ph} limits growth now`;
};
const OFF_VOCAB = /reachable|\bbinds?\b|\bbinding\b|\bmedian\b|\byour list\b|\bbuyers\b|\bchannels?\b/i;
const limitClause = (type, o = {}) => { try { const s = M.limitClause?.(type, o); if (typeof s === 'string' && s && !OFF_VOCAB.test(s)) return s; } catch (e) { /* the local clause */ } return localClause(type, o); };
/** one wording for a limit wherever it is printed (fix 1, item 19): the card, the step's restraint, the briefing and the exports.
    The ceiling is a twelve-month total of added revenue (C32), so it is never printed as "a month". */
const limitPhrase = (type, month, ceiling) => `${limitClause(type, { month })}${ceiling ? ` (about ${gbp(near(ceiling))} added over twelve months)` : ''}`;
/** the first limit in (d)'s longer plain words (M.limitWords), held to D1 and D2: a field that says "reachable", "binds" or
    "median", or that is the engine's raw statement, gives way to this file's own sentence. Never null while a limit holds. */
function limitOf(p) {
  const b = bindingOf(p);
  if (!p || !b) return null;
  const own = `${cap(limitPhrase(b.type, b.bindsAtMonth ? monthName(b.bindsAtMonth) : null, null))}.`;
  let w = null;
  try { w = typeof M.limitWords === 'function' ? M.limitWords(p.constraints, unitWord(p), peakOf(p)) : null; } catch (e) { w = null; }
  const raw = clean(b.statement ?? '').trim();
  const ok = (t) => { const s = clean(t ?? '').trim(); return s && s !== raw && !OFF_VOCAB.test(s) ? s : ''; };
  const short = ok(w?.short) || own;
  return { title: ok(w?.title) || own.replace(/\.$/, ''), short, long: ok(w?.long) || short, own };
}
/** who caps a ladder with no budget that reaches the target (C38): this file's name for the limit, never the engine's id */
const binderWords = (nb) => LIMIT_NAME[nb?.binder] ?? (nb?.binderName && !OFF_VOCAB.test(nb.binderName) ? nb.binderName : null) ?? (typeof nb?.binder === 'string' && nb.binder && !/_/.test(nb.binder) && !OFF_VOCAB.test(nb.binder) ? nb.binder : null) ?? 'The forecast itself';
/** a name set mid-sentence: the first letter drops, except on TMA */
const midWords = (w) => (/^TMA/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1));
const LIMIT_TYPE_RE = [[/reachable buyers|reachable list|prospects/i, 'market_depletion'], [/build slots|build schedule/i, 'tma_capacity'], [/channel|route/i, 'channel_cap'], [/capacity/i, 'client_capacity']];
/** a step's restraint in the card's words. When it names the plan's own first limit, the month and the figure are read from
    the plan's binding constraint, the field the card prints, so the two agree; another limit keeps the re-run's month and figure. */
function restraintWords(raw) {
  const t = clean(raw ?? '').trim();
  if (!t) return null;
  if (/^none/i.test(t)) return 'no constraint found within this model over twelve months';
  const type = LIMIT_TYPE_RE.find(([re]) => re.test(t))?.[1] ?? null;
  /* a limit this file cannot name keeps (d)'s words unless they carry a word the page does not use (D2) */
  if (!type) { const mo = t.match(/(?:from|in|by) ([A-Z][a-z]+ \d{4})/)?.[1] ?? null; return OFF_VOCAB.test(t) ? `one limit holds it back${mo ? ` from ${mo}` : ''}` : t; }
  if (/^(lifts|it relaxes|it lifts)\b/i.test(t)) return `it lifts the first limit, ${LIMIT_PHRASE[type]}`;
  const b = bindingOf(plan());
  if (b && b.type === type) return limitPhrase(type, b.bindsAtMonth ? monthName(b.bindsAtMonth) : null, b.ceiling ?? null);
  const month = t.match(/(?:from|in|by) ([A-Z][a-z]+ \d{4})/)?.[1] ?? null;
  const fig = Number((t.match(/£([\d,]+)/)?.[1] ?? '').replace(/,/g, '')) || null;
  return limitPhrase(type, month, fig);
}

/* ============ what went in, and where each figure came from (v11, kept) ============ */
/* Rebuild 1, brief 2.3 item 1: nothing on this page says a website was read. A field that came through the importer is
   "your website/document" (R9's word for imported evidence): text the visitor pasted or uploaded, never a fetched site. */
const FROM_WORD = (f) => ({ you: 'your answer', web: 'your website/document', sector: `typical for ${sectorWord()}`, assumed: 'Mercer’s estimate', derived: 'worked out from your answers', empty: 'not given' })[f] ?? 'Mercer’s estimate';
/** brief 1.2 and 11.7: a run that finds no ceiling is not proof of unlimited growth. The sentence names what the model checks
    and what it does not know. */
const noLimitWords = () => { const capKnown = state.capacity !== null && state.capacity !== undefined && !unsure('capacity'); return `No constraint found within this model over twelve months. It checks your prospects, your capacity and route sending${capKnown ? '' : '; delivery capacity is Mercer’s estimate, not your figure'}.`; };
/** brief 2.3 item 4: a sensitivity line is a full statement (the input and its two values, the output, its unit and period, the
    assumption held) or nothing. The engine's elasticity is the change in the middle run of twelve-month revenue for a 10%
    change in the input, every other input held as it is; a value the visitor did not give cannot be stated, so no line. */
function sensitivityWords(inputId, elasticity, p = plan()) {
  const w = INPUT_WORDS[inputId];
  const move = Number(movePct(elasticity));
  if (!w || !p || !(move > 0)) return '';
  const val = { acv: p.acv, statedCloseRate: p.close, serviceRatePerServerPerMonth: p.capacity, addressableCount: p.market, budget: noSpend() ? null : p.budget, grossMargin: p.margin, retentionMonths: p.retention }[inputId];
  if (val === null || val === undefined || !Number.isFinite(val) || val <= 0) return '';
  const said = (v) => (inputId === 'acv' || inputId === 'budget' ? gbp(v) : inputId === 'statedCloseRate' ? pct(v) : inputId === 'grossMargin' ? `${Math.round(v * 100)}p in the £` : inputId === 'retentionMonths' ? plural(Math.round(v), 'month', 'months') : inputId === 'addressableCount' ? count(Math.round(v)) : `${count(Math.round(v))} ${unitWord(p, Math.round(v))} a month`);
  const up = inputId === 'statedCloseRate' ? Math.min(1, val * 1.1) : inputId === 'grossMargin' ? Math.min(1, val * 1.1) : val * 1.1;
  const held = inputId === 'acv' ? 'sales volume held as it is, so demand may change' : 'every other input held as it is';
  return `If ${w.of} were ${said(up)} instead of ${said(val)} (10% more), the middle run of revenue over twelve months would be about ${movePct(elasticity)}% ${elasticity >= 0 ? 'higher' : 'lower'}, ${held}.`;
}
const FROM_KIND = (f) => ({ you: 'you', web: 'web', sector: 'sector', assumed: 'assumed', derived: 'assumed', empty: 'assumed' })[f] ?? 'assumed';
function webFields() {
  const out = new Set();
  const w = M.webUsed;
  if (w) { try { (w instanceof Set ? [...w] : Array.isArray(w) ? w : Object.keys(w)).forEach((k) => out.add(k)); } catch (e) { /* none */ } }
  return out;
}
function inputs() {
  const p = plan();
  if (!p) return [];
  const b = M.result?.bank ?? {};
  const web = webFields();
  const unitOf = (n) => unitWord(p, n);
  const servedNow = b.servedNow?.value ?? p.servedNow ?? p.base / Math.max(1, p.acv);
  const assumed = new Set(p.assumed ?? []);
  const fitted = Boolean(p.niche);
  const guess = (engineKey, fallback) => (assumed.has(engineKey) ? (fitted ? 'sector' : 'assumed') : fallback);
  const own = (key, f) => (f === 'you' && web.has(key) ? 'web' : f);
  const cyc = p.cycle ?? null;
  const chans = (p.channels ?? []).map((c) => M.CHANNEL_NAME?.[c] ?? c);
  const rows = [
    { key: 'revenue', label: 'Revenue', value: `${gbp(p.base)} a month`, from: 'you', driver: 'trunk' },
    basis() === 'revenue' ? { key: 'goal', label: 'Target', value: `${gbp(state.goal)} a month by ${monthName(goalMonth())}`, from: 'you', driver: 'trunk' } : null,
    { key: 'price', label: 'Sale value', value: gbp(p.acv), from: own('price', b.deal?.from ?? guess('acv', 'you')), driver: 'pricing', sens: 'acv' },
    { key: 'close', label: 'Close rate', value: pct(p.close), from: b.close?.from ?? (state.closeRate !== null && state.closeRate !== undefined ? 'you' : fitted ? 'sector' : 'assumed'), driver: 'conversion', sens: 'statedCloseRate' },
    cyc ? { key: 'cycle', label: 'First sale', value: M.cycleWord?.(cyc) ?? `${cyc} days`, from: state.cycle !== null && state.cycle !== undefined ? 'you' : fitted ? 'sector' : 'assumed', driver: 'conversion' } : null,
    { key: 'capacity', label: 'Capacity', value: `${count(p.capacity)} ${unitOf(p.capacity)} a month`, from: own('capacity', b.capacity?.from ?? guess('serviceRatePerServerPerMonth', 'you')), driver: 'capacity', sens: 'serviceRatePerServerPerMonth' },
    { key: 'people', label: 'People delivering', value: count(p.people), from: own('people', b.people?.from ?? (state.who !== null && state.who !== undefined ? 'you' : 'assumed')), driver: 'capacity' },
    { key: 'servedNow', label: 'Delivered now', value: `${count(servedNow)} ${unitOf(servedNow)} a month`, from: b.servedNow?.from ?? (state.servedNow !== null && state.servedNow !== undefined ? 'you' : 'derived'), driver: 'capacity' },
    /* U1: with the dial at None the engine is sent a penny; the page never prints that as £0 */
    noSpend() ? { key: 'budget', label: 'Growth spend', value: 'none', from: 'you', driver: 'demand' } : { key: 'budget', label: 'Growth spend', value: `${gbp(p.budget)} a month`, from: b.budget?.from ?? guess('budget', 'you'), driver: 'demand', sens: 'budget' },
    { key: 'channels', label: 'Routes forecast', value: chans.length ? chans.join(', ') : 'none named', from: b.channels?.from ?? (state.channel ? 'you' : 'assumed'), driver: 'demand' },
    { key: 'market', label: 'Prospects', value: p.market ? count(p.market) : 'not given', from: p.market ? (assumed.has('addressableCount') ? 'assumed' : 'you') : 'empty', driver: 'demand', sens: 'addressableCount' },
    { key: 'margin', label: 'Margin', value: `${Math.round(p.margin * 100)}p of each £1`, from: b.margin?.from ?? guess('grossMargin', 'you'), driver: 'margin', sens: 'grossMargin' },
    { key: 'repeat', label: 'Repeat rate', value: p.repeat !== null && p.repeat !== undefined ? `${Math.round(p.repeat * 10)} in 10` : 'not given', from: p.repeat !== null && p.repeat !== undefined ? 'you' : 'empty', driver: 'retention' },
    p.retention && p.retention >= 1 ? { key: 'retention', label: 'Customer lifespan', value: plural(Math.round(p.retention), 'month', 'months'), from: 'you', driver: 'retention', sens: 'retentionMonths' } : null,
  ];
  return rows.filter(Boolean);
}
/** the chosen month's range, from one run: the plan passed in (the cutscene holds one for the whole scene), else M.planned */
function rangeAt(m = goalMonth(), p = plan()) {
  const s = p.months[m - 1];
  return { p10: qAt(s, 0.1), p25: qAt(s, 0.25), p50: qAt(s, 0.5), p75: qAt(s, 0.75), p90: qAt(s, 0.9), n: s.length, sorted: s };
}

/* ============ the sentence ============
   D3: no probability of reaching the goal, and no "1 in N runs" sentence anywhere the visitor reads. The engine's spread is
   shown as a range between assumption sets, with what changes between them said, and never as a frequency. */
const SPREAD_WORD = 'between the downside and favourable assumption sets';
const SETS_LINE = 'Downside, base and favourable differ in what is assumed, not in how likely they are. No probability of reaching the target is claimed.';
let rescueCache = null;
function capacityRescue() {
  const key = `${M.keyOf()}|${state.capacity}|${state.servedNow}`;
  if (rescueCache && rescueCache.key === key) return rescueCache.hit;
  const cap = state.capacity;
  let hit = null;
  if (cap) {
    const held = state.capacity;
    for (const f of [1.05, 1.1, 1.2, 1.35, 1.6]) {
      state.capacity = Math.ceil(cap * f);
      let out = null;
      try { out = engineRun(() => E.plan(M.askOf(), new Date().toISOString()), 'plan'); } catch (e) { out = null; }
      const got = Math.round(out?.added?.p50 ?? 0);
      if (got > 0) { hit = { pct: Math.round((f - 1) * 100), more: Math.ceil(cap * f) - cap, added: got }; break; }
    }
    state.capacity = held;
  }
  rescueCache = { key, hit };
  return hit;
}
function addsNothing(p) {
  if ((p.added?.p50 ?? 0) > 0) return null;
  const cap = state.capacity, served = state.servedNow, price = state.price, unit = unitWord(p);
  const derived = (served === null || served === undefined) && price && state.now ? Math.round(state.now / price) : null;
  const back = Math.round(p.unspent ?? 0);
  const fix = capacityRescue();
  const route = fix ? ` With ${fix.pct}% more capacity, ${count(fix.more)} more ${unitWord(p, fix.more)} a month, the same answers add ${gbp(fix.added)} over twelve months.` : '';
  /* U1: a sum held back is said only when there is one; "holds back £0" is no sentence */
  const held = back > 0 ? `, so it holds back the growth budget, ${gbp(back)} over twelve months` : '';
  if (cap !== null && cap !== undefined && served !== null && served !== undefined && served >= cap * 0.8) {
    const full = Math.round((served / cap) * 100);
    return { short: `you are ${full}% full, so new enquiries have nowhere to go`, long: `You deliver ${count(served)} ${unitWord(p, served)} a month against a capacity of ${count(cap)}: ${full}% full. Mercer forecasts only revenue you can deliver${held}.${route}` };
  }
  if (derived !== null && cap !== null && cap !== undefined) {
    return { short: 'Mercer’s estimate of your workload fills your capacity', long: `You did not say how many ${unit} you deliver a month, so Mercer worked it out: ${gbp(state.now)} of revenue over a ${gbp(price)} sale is about ${count(derived)} ${unitWord(p, derived)} a month, against the ${count(cap)} you can handle. On those figures a new enquiry has nowhere to go${held ? held.replace(', so it holds', ', so Mercer holds') : ''}.${route}` };
  }
  return { short: 'no run adds revenue on these answers', long: `No run adds revenue.${back > 0 ? ` Mercer holds back ${gbp(back)} of the growth budget over twelve months.` : ''}${route}` };
}
function levers() {
  const p = plan();
  if (!p?.levers) return [];
  const floor = Math.max(1, 0.02 * Math.abs(p.added?.p50 ?? 0));
  return p.levers.filter((l) => Math.abs(l.magnitude) >= floor && l.direction === 'up').sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude));
}
function summary() {
  const p = plan();
  if (!p) return '';
  const m = goalMonth();
  const r = rangeAt(m);
  const when = monthName(m);
  const none = addsNothing(p);
  const lim = bindingOf(p);
  const limitPart = lim ? limitClause(lim.type, { first: true }) : 'no constraint was found within this model over twelve months';
  const top = steps()[0];
  const topPart = top ? `; Return rank 1 is ${top.title}` : '';
  const half = SPREAD_WORD;
  /* U1: the dial at None is no growth spend, said in those words; no sentence is built on £0 */
  if (noSpend()) {
    const lo = down(r.p25), hi = up(r.p75);
    return `${bizName()} has no growth spend, so revenue is carried flat: ${lo === hi ? `about ${gbp(lo)}` : `${gbp(lo)} to ${gbp(hi)}`} a month by ${when} ${half}.`;
  }
  if (basis() === 'budget') {
    const lo = r.p25 - p.base, hi = r.p75 - p.base;
    const who = `${possessive(state.biz)} growth spend of ${gbp(p.budget)} a month`;
    if (none || hi <= 0) return `${who} buys no extra revenue by ${when} ${half}: ${none ? none.short : limitPart}.`;
    const buys = lo > 0 ? `${gbp(down(lo))} to ${gbp(up(hi))}` : `up to ${gbp(up(hi))}`;
    return `${who} buys ${buys} more revenue a month by ${when} ${half}; ${limitPart}${topPart}.`;
  }
  if (none) return `${bizName()} stays near ${gbp(near(r.p50))} a month by ${when}: ${none.short}.`;
  const G = state.goal;
  const hi = up(r.p75), lo = down(r.p25);
  /* fix 3, item 7: this "short" is the top of the half-range to the target and says so; the cutscene's "short" is the middle
     run's. A target inside the range is inside it, never "above" it. */
  const pos = G > hi ? `the top of that range is ${gbp(G - hi)} short of the ${gbp(G)} target` : G < lo ? `all of that range is above the ${gbp(G)} target` : `the ${gbp(G)} target sits inside that range`;
  const span = lo === hi ? `about ${gbp(lo)}` : `${gbp(lo)} to ${gbp(hi)}`;
  return `${bizName()} reaches ${span} a month by ${when} ${half}; ${pos}; ${limitPart}${topPart}.`;
}
/* the results' one sentence is this file's own (fix 3): (d)'s M.overallInsight has no other reader, and its copy of the sentence
   printed the range at a second precision, "£0" at None and a "short" that did not say what it measured */
const overall = () => summary();

/* ============ the vocabulary (COPY §10): one field each ============ */
const VOCAB = [
  ['Moves most', 'the input whose 10% change shifts the middle run of twelve-month revenue most, every other input held.'],
  ['Return rank', 'Mercer’s steps ranked by revenue added per unit of difficulty; rank 1 is the highest return.'],
  ['Score', 'a step’s revenue added, divided by its difficulty (low 1, medium 2, high 3), with rank 1 set to 100.'],
  ['Restraint', 'what would hold a step back once you take it.'],
  ['Return per £', 'revenue added over twelve months for each pound of growth spend.'],
  ['First limit', 'what stops growth first, and from when.'],
  ['Held back', 'budget the plan could not place.'],
  ['Pays back', 'months until added revenue covers the spend.'],
  ['Cost of waiting', 'what the middle run loses if nothing changes.'],
  /* Refine 1, R19: the three words a step's and the plan's figures are said in; none of them is a promise */
  ['Modelled upside', 'what a step adds on the base assumptions over twelve months. A model’s figure, never a guarantee.'],
  ['Scenario range', 'the spread between the downside and favourable assumption sets. Not a likelihood.'],
  ['Favourable', 'the assumption set in which the uncertain figures land well. Not a likelihood.'],
];
const VOCAB_BY = Object.fromEntries(VOCAB);
/** the steps in Return rank order: magnitude ÷ difficulty weight; the score is that figure with rank 1 set to 100 (D3);
    restraint from the ladder when it has landed */
function steps() {
  const p = plan();
  if (!p) return [];
  const lad = ladderNow();
  const ranked = levers().map((l) => {
    const w = leverWords(l.lever);
    return { lever: l.lever, title: w.title, driver: w.driver, magnitude: Math.abs(l.magnitude), difficulty: l.difficulty, points: Math.abs(l.magnitude) / (W_OF[l.difficulty] ?? 2) };
  }).sort((a, b) => b.points - a.points);
  const topPoints = ranked[0]?.points || 0;
  return ranked.map((s, i) => ({ ...s, rank: i + 1, score: topPoints > 0 ? Math.round((100 * s.points) / topPoints) : 0, restraint: restraintWords(lad?.levers?.find((x) => x.lever === s.lever || x.title === s.title)?.restraint ?? null) }));
}
/** Refine 1, R19: the engine measures a step on the middle run alone, so a step has a modelled upside and no range of its own;
    the range and the stretch are the whole plan's, from its added revenue over twelve months (p10, p90). One sentence set for
    the ▾ under a step, the briefing and both exports. '' when no run adds revenue. */
function rangeNote(p = plan()) {
  const a = p?.added;
  if (!a || noSpend() || !(near(a.p90 ?? 0) >= 1)) return '';
  return `Scenario range for the whole plan: ${gbp(down(Math.max(0, a.p10 ?? 0)))} to ${gbp(up(a.p90))} added over twelve months, ${SPREAD_WORD}. ${SETS_LINE} A step is measured on the base assumptions alone, so it has no range of its own. No figure here is a guarantee.`;
}
/** Refine 1, R20: the present position in one short paragraph for the top of the crown's ▾ and the exports: where the business
    stands, the stated target, then the page's one sentence (the range, the first limit, Return rank 1). Held figures only. */
function diagnosis() {
  const p = plan();
  if (!p) return '';
  const sum = overall();
  const G = state.goal;
  const target = basis() === 'revenue' && G && !sum.includes(gbp(G)) ? ` The target is ${gbp(G)} a month by ${monthName(goalMonth())}.` : '';
  return `Revenue today is ${gbp(p.base)} a month.${target} ${sum}`;
}
/** Refine 1, R19; Rebuild 1, brief 12.4: the method in one paragraph and the exact counts of the completed job, read from the
    run and from (d)'s simCount: runs per scenario, scenarios evaluated, total draws. A job already counted for these answers
    (the same key, no new draws since the last look) is said to be the cached one, not new computation. */
let jobSeen = { key: null, total: null, at: null };
const timeWord = (d) => (d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
function methodOf() {
  const c = simCounts();
  if (!c.headline) return null;
  let key = '';
  try { key = M.simCount?.()?.key ?? safeKey(); } catch (e) { key = safeKey(); }
  const cached = jobSeen.key === key && jobSeen.total === c.total && jobSeen.at;
  if (!cached) jobSeen = { key, total: c.total, at: new Date() };
  const words = `Mercer puts your answers through its forecast engine ${count(c.headline)} times. Each run draws every uncertain figure, yours and your industry’s, from a range, so the result is a spread of outcomes. The range, the odds and the middle run on this page are read from that spread.`;
  const rows = [['Runs per scenario', count(c.headline)]];
  if (c.runs !== null && c.runs > 0) rows.push(['Scenarios evaluated', count(c.runs)]);
  if (c.total !== null) rows.push(['Total draws', count(c.total)]);
  rows.push(['Job', cached ? `the job already run for these answers at ${timeWord(jobSeen.at)}; no new runs since` : `new computation for these answers, completed ${timeWord(jobSeen.at)}`]);
  const note = 'The plan behind the steps, and the smaller batches the engine re-runs inside it to rank the inputs and the steps, are not in these counts.';
  return { words, rows, note, counts: c, cached: !!cached, at: jobSeen.at };
}
const methodHtml = () => { const m = methodOf(); return m ? `<div class="method"><p class="eyebrow">Method</p><p>${esc(m.words)}</p><dl class="counts">${m.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="tabular">${esc(v)}</dd></div>`).join('')}</dl><p class="small">${esc(m.note)}</p></div>` : ''; };
const rankOf = (title) => steps().find((s) => s.title === title) ?? null;
/** D3: the £ a step adds is said only where everything is said: under a ▾, in the briefing and in the exports */
const stepLine = (s, withRestraint = true) => `Return rank ${s.rank}: ${s.title}, modelled upside +${gbp(near(s.magnitude))} on the middle run over twelve months, ${DIFFICULTY[s.difficulty] ?? s.difficulty}${withRestraint && s.restraint ? `; restraint: ${s.restraint}` : ''}.`;
/** D3: a card's face says the rank, the title, the score out of 100 and the difficulty, and never a £ claim. Under the
    "Return rank" eyebrow the term is not said a second time (U19). The restraint is the face's next line. */
const stepFace = (s, term) => `${term === 'Return rank' ? 'Rank' : 'Return rank'} ${s.rank}: ${s.title}, score ${s.score} of 100, ${DIFFICULTY[s.difficulty] ?? s.difficulty}.`;
/** the first limit in the one wording, from the plan's binding constraint */
const limitWords = (lim) => (lim ? limitPhrase(lim.type, lim.month, lim.ceiling) : '');
/** the first limit as one object: name, month, ceiling, the step that lifts it, and its words three ways. words: the one
    clause (archetypes.js reads it); plain and plainLong: (d)'s fuller sentences held to the page's vocabulary. The engine's
    own statement is not on this object any more (C18): nothing that reads it can print it. report() takes it for the JSON
    export's labelled `engine` field straight from the plan. */
function limit() {
  const p = plan();
  const b = bindingOf(p);
  if (!p || !b) return null;
  const lift = steps().find((s) => LIMIT_BRANCH[b.type] === s.driver) ?? null;
  const month = b.bindsAtMonth ? monthName(b.bindsAtMonth) : null;
  const w = limitOf(p);
  return { type: b.type, name: limitName(b.type), short: limitShort(b.type), month, bindsAtMonth: b.bindsAtMonth ?? null, ceiling: b.ceiling ?? null, plain: w?.short ?? '', plainLong: w && w.long !== w.own ? w.long : '', /* '' when the long form would only repeat `words` */ words: limitPhrase(b.type, month, b.ceiling ?? null), lever: lift?.title ?? null, section: LIMIT_SECTION[b.type] ?? 'delivery' };
}
const returnPerPound = () => { const p = plan(); const spend = (p?.spend ?? []).reduce((a, b) => a + b, 0); return p && spend > 0 ? p.added.p50 / spend : null; };
const warmShare = (alloc) => { try { if (typeof M.warmShare === 'function') return M.warmShare(alloc); } catch (e) { /* local */ } let warm = 0, all = 0; (alloc ?? []).forEach((m) => (m.byChannel ?? []).forEach((c) => { all += c.spend; if (c.channel === 'referral' || c.channel === 'partnerships') warm += c.spend; })); return all > 0 ? warm / all : 0; };

/** the funnel sentence in the engine's units, plural-aware (fix 3, item 4; C24): "1 more sale", one decimal below ten, no
    part that would print as 0, and always "a month" (the gap is a monthly figure) */
function funnelWords(f) {
  if (!f || !(f.sales >= 0.05)) return '';
  const part = (v, one, many) => (v >= 0.05 ? plural(v, one, many) : '');
  return `That is ${[plural(f.sales, 'more sale', 'more sales'), part(f.meetings, 'held meeting', 'held meetings'), part(f.leadsNeeded, 'positive reply', 'positive replies')].filter(Boolean).join(', ')} a month.`;
}
/** C34: what the target asks of delivery, in the engine's own sum. Capacity is a total already, so it is never multiplied by the
    head count again; the knee (the point where waits start to cost sales), the capacity and today's load are read from the
    client_capacity constraint's diagnostics when the plan carries them. limit is the total that fits under the knee, room is
    what is left of it after today's load. */
function roomCheck(p, goal) {
  if (!p || !goal || !p.acv) return null;
  const d = (p.constraints ?? []).find((c) => c.type === 'client_capacity')?.diagnostics ?? null;
  const total = d?.monthlyMeetingCapacity || p.capacity || state.capacity || null;
  if (!total) return null;
  const load = p.servedNow ?? d?.existingMonthlyLoad ?? state.servedNow ?? (state.price && state.now ? state.now / state.price : 0);
  const limit = (d?.utilisationKnee ?? 0.85) * total;
  /* a capacity the visitor did not give is Mercer's estimate, and the sentence says so */
  const estimated = state.capacity === null || state.capacity === undefined;
  return { clients: goal / p.acv, limit, load, room: limit - load, estimated };
}
/** the card's and the exports' sentence for it: a total against a total */
const roomWords = (c) => (c && Number.isFinite(c.limit) ? `The target is ${plural(c.clients, 'client', 'clients')} a month; you can serve ${count(Math.max(0, c.limit))} before waits cost sales${c.estimated ? ', on Mercer’s estimate of your capacity' : ''}.` : '');

/* ============ the ladder: M.ladder when (d) has it, else the same computation here in idle chunks ============ */
let ladderCache = { key: null, value: null, promise: null };
const ladderNow = () => (ladderCache.key === safeKey() ? ladderCache.value : null);
const safeKey = () => { try { return M.keyOf(); } catch (e) { return ''; } };
function ladder() {
  if (typeof M.ladder === 'function') {
    const key = safeKey();
    if (ladderCache.key === key && ladderCache.promise) return ladderCache.promise;
    ladderCache = { key, value: null, promise: M.ladder().then((l) => { if (ladderCache.key === key) ladderCache.value = l; return l; }) };
    return ladderCache.promise;
  }
  return localLadder();
}
/* The ladder is keyed by the answers. They can change at explore now (a question reopened from an unfinished disc, U35), and
   the path card then said "Working out the path" for good: nothing asked for the new ladder. A card painted without one asks
   for it, once a key, and is painted again when it lands. A ladder that resolves to nothing is not asked for twice. */
let ladderWait = null, ladderNone = null;
function wantLadder() {
  const key = safeKey();
  if (!key || ladderNow() || ladderWait === key || ladderNone === key) return;
  ladderWait = key;
  Promise.resolve(ladder()).then((l) => {
    if (ladderWait === key) ladderWait = null;
    if (!l) { ladderNone = key; return; }
    if (safeKey() === key && openId && stageNow() === 'explore') paintCard(openId);
  }).catch(() => { if (ladderWait === key) ladderWait = null; ladderNone = key; });
}
function localLadder() {
  const key = safeKey();
  if (ladderCache.key === key && ladderCache.promise) return ladderCache.promise;
  const p = plan();
  const promise = new Promise((resolve) => {
    if (!p || !E) { resolve(null); return; }
    const m = goalMonth();
    const now = state.now ?? p.base;
    const goal = basis() === 'revenue' ? state.goal : null;
    const own = p.budget;
    const rungs = [];
    const run = (budget, draws = 2000) => new Promise((res) => idle(() => {
      const t0 = performance.now();
      let out = null;
      try { out = engineRun(() => E.forecast({ ...M.askOf({ budget: Math.max(0.01, budget) }), draws })); } catch (e) { out = null; }
      const rung = out ? { budget, p50: out.months.map((s) => qAt(s, 0.5)), p90: out.months.map((s) => qAt(s, 0.9)), reach: out.months.map((s) => (goal && typeof M.reach === "function" ? M.reach(s, goal) / s.length : 0)), unspent: 0, unspentReason: "", binding: null, bindsAtMonth: null, ceiling: null, computeMs: Math.round(performance.now() - t0) } : null;
      if (rung) rungs.push(rung);
      res(rung);
    }));
    /* the plan (levers, constraints) is dearer than a forecast, so it runs only where a rung is read: b* and the top */
    const planAt = (rung) => new Promise((res) => idle(() => {
      if (!rung) { res(rung); return; }
      let pl = null;
      try { pl = engineRun(() => E.plan(M.askOf({ budget: Math.max(0.01, rung.budget) }), new Date().toISOString()), 'plan'); } catch (e) { pl = null; }
      const b = pl ? bindingOf(pl) : null;
      rung.unspent = Math.round(pl?.unspent ?? 0);
      rung.unspentReason = limitOf(pl)?.short ?? ''; // the rung's own plan in plain words, never the engine's statement (C18)
      rung.binding = pl?.binding ?? null;
      rung.bindsAtMonth = b?.bindsAtMonth ?? null;
      rung.ceiling = b?.ceiling ?? null;
      res(rung);
    }));
    (async () => {
      const r0 = rangeAt(m);
      const gap = goal ? goal - r0.p50 : 0;
      const onCourse = goal ? gap <= 0 : true;
      let bStar = null, bStarRung = null, noBudget = null, maxRung = null;
      const b0 = Math.max(100, own || Math.max(500, 0.05 * now));
      if (goal && !onCourse) {
        let b = b0, prev = null, top = null;
        for (let i = 0; i < 9; i++) {
          const r = await run(b);
          if (!r) break;
          const med = r.p50[m - 1];
          if (med >= goal) { top = r; break; }
          /* (d)'s shape: binder is the engine's id (or null), binderName the words; the ceiling is the middle run itself (C32, C38) */
          if (prev && med <= prev.p50[m - 1] * 1.005) { await planAt(r); maxRung = prev; noBudget = { binder: r.binding ?? null, binderName: LIMIT_NAME[r.binding] ?? 'The forecast itself', ceiling: Math.round(r.p50[m - 1]) }; break; }
          prev = r;
          b *= 2;
          if (b > now * 100) { await planAt(r); noBudget = { binder: r.binding ?? null, binderName: LIMIT_NAME[r.binding] ?? 'The forecast itself', ceiling: Math.round(med) }; break; }
        }
        if (top) {
          let lo = prev ? prev.budget : 0, hi = top.budget, best = top;
          for (let i = 0; i < 5 && hi - lo > Math.max(25, hi * 0.03); i++) {
            const mid = (lo + hi) / 2;
            const r = await run(mid);
            if (!r) break;
            if (r.p50[m - 1] >= goal) { hi = mid; best = r; } else lo = mid;
          }
          await planAt(best);
          bStar = Math.round(best.budget); bStarRung = best;
        }
      }
      if (!maxRung) {
        let b = Math.max(b0, bStar ?? b0), prev = rungs.find((r) => r.budget === b) ?? null;
        for (let i = 0; i < 6; i++) {
          b *= 2;
          const r = await run(b);
          if (!r) break;
          if (prev && r.p50[m - 1] <= prev.p50[m - 1] * 1.005) { maxRung = prev; break; }
          prev = r;
          if (b > now * 100) { maxRung = r; break; }
        }
        if (!maxRung) maxRung = prev;
        await planAt(maxRung);
      }
      const margin = state.margin ?? M.result?.bank?.margin?.value ?? p.margin;
      const appetite = {};
      /* fix 3, item 2, as (d) does it: the five budgets never step down. Boutique is the default rule; Moderate is at least
         Boutique; Aggressive at least Moderate; Maximum at least Aggressive. A level lifted to keep the order says so. */
      const boutique = Math.max(500, 0.05 * now);
      const quarter = 0.25 * now * margin;
      const moderate = Math.max(boutique, quarter);
      const hasStar = bStar !== null && bStar !== undefined;
      const aggressive = hasStar ? Math.max(moderate, bStar) : null;
      const under = aggressive ?? moderate;
      const maximum = maxRung ? Math.max(under, maxRung.budget) : null;
      const SOURCE = {
        none: 'no growth spend',
        boutique: 'Mercer’s default budget rule',
        moderate: quarter >= boutique ? `a quarter of your gross profit (Mercer’s fixed rule; margin ${state.margin !== null && state.margin !== undefined ? 'yours' : 'Mercer’s estimate'})` : 'the same as Boutique: a quarter of your gross profit is less than Mercer’s default',
        aggressive: hasStar && bStar >= moderate ? 'the smallest budget whose middle run reaches your target' : 'the same as Moderate: a smaller budget already reaches your target',
        maximum: maxRung && maxRung.budget >= under ? 'the budget past which spend stops adding' : `the same as ${hasStar ? 'Aggressive' : 'Moderate'}: spend stops adding below it`,
      };
      const stops = { none: 0, boutique, moderate, aggressive, maximum };
      for (const [level, budget] of Object.entries(stops)) {
        if (budget === null || budget === undefined) { appetite[level] = { budget: null, source: level === 'aggressive' ? (noBudget ? `no budget reaches ${gbp(goal)} by ${monthName(m)}: ${midWords(binderWords(noBudget))}` : 'the smallest budget whose middle run reaches your target') : 'the budget past which spend stops adding', p50: null, p90: null }; continue; }
        const r = rungs.find((x) => Math.abs(x.budget - budget) < 1) ?? await run(budget);
        appetite[level] = { budget: Math.round(budget), source: SOURCE[level], p50: r ? Math.round(r.p50[m - 1]) : null, p90: r ? Math.round(r.p90[m - 1]) : null };
      }
      const monthP50 = goal ? (p.months.findIndex((s) => qAt(s, 0.5) >= goal) + 1 || null) : null;
      const monthHalf = goal && typeof M.reach === 'function' ? (p.months.findIndex((s) => M.reach(s, goal) / s.length >= 0.5) + 1 || null) : null;
      const leadsSum = (p.leads ?? []).reduce((a, b) => a + b, 0);
      const perLead = leadsSum > 0 ? p.added.p50 / leadsSum : null;
      const funnel = goal && gap > 0 && gap / p.acv >= 0.05 ? { sales: gap / p.acv, meetings: p.close > 0 ? gap / p.acv / p.close : null, leadsPlan: p.leads?.[m - 1] ?? null, leadsNeeded: perLead ? gap / perLead : null } : null;
      if (funnel) funnel.line = funnelWords(funnel);
      const capacityCheck = goal && /client/i.test(unitWord(p)) ? roomCheck(p, goal) : null;
      /* the restraint on each step: the binder's lever relaxes the binder; the others take the first constraint after a 10% re-run */
      const bind = bindingOf(p);
      const OVERRIDE = { pricing: () => ({ price: (state.price ?? p.acv) * 1.1 }), conversion: () => ({ closeRate: Math.min(0.95, (state.closeRate ?? p.close) * 1.1) }), capacity: () => ({ capacity: Math.ceil((state.capacity ?? p.capacity) * 1.1) }), demand: () => ({ budget: (state.budget ?? p.budget) * 1.1 }), margin: () => ({ margin: Math.min(0.98, (state.margin ?? p.margin) * 1.1) }), retention: () => ({ repeat: Math.min(0.95, (state.repeat ?? p.repeat ?? 0.5) * 1.1) }) };
      const lv = [];
      for (const s of steps()) {
        let restraint = 'no constraint found within this model over twelve months';
        if (bind && LIMIT_BRANCH[bind.type] === s.driver) restraint = `it lifts the first limit, ${LIMIT_PHRASE[bind.type] ?? 'the limit'}`;
        else {
          const over = OVERRIDE[s.driver]?.();
          if (over) {
            const pl = await new Promise((res) => idle(() => { try { res(engineRun(() => E.plan(M.askOf(over), new Date().toISOString()), 'plan')); } catch (e) { res(null); } }));
            const b2 = pl ? bindingOf(pl) : null;
            if (b2) restraint = limitPhrase(b2.type, b2.bindsAtMonth ? monthName(b2.bindsAtMonth) : null, b2.ceiling ?? null);
          }
        }
        lv.push({ title: s.title, magnitude: Math.round(s.magnitude), difficulty: s.difficulty, rank: s.rank, points: Math.round(s.points), restraint });
      }
      resolve({ key, gap: Math.round(gap), onCourse, bStar, bStarRung, noBudget, monthP50, monthHalf, rungs, funnel, capacityCheck, levers: lv, appetite });
    })();
  });
  ladderCache = { key, value: null, promise: promise.then((l) => { if (ladderCache.key === key) { ladderCache.value = l; try { document.dispatchEvent(new CustomEvent('mercer:ladder', { detail: { key, ladder: l } })); } catch (e) { /* none */ } } return l; }) };
  return ladderCache.promise;
}

/* ============ the Core: the engine's draws settling (also the intro's fallback when (d) has not exposed M.drawCore) ============ */
const cssColor = (name, fallback) => {
  try {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    if (!v) return fallback;
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = fallback; c.fillStyle = v;
    return c.fillStyle;
  } catch (e) { return fallback; }
};
function drawCore(host, sorted, o = {}) {
  if (!host || !sorted?.length) return;
  let cv = host.querySelector('canvas');
  if (!cv) { host.innerHTML = ''; cv = document.createElement('canvas'); host.appendChild(cv); }
  const w = host.clientWidth || 148, h = host.clientHeight || 88, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  cv.style.width = `${w}px`; cv.style.height = `${h}px`;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const ink = cssColor('--ink', '#14201B'), hue = cssColor('--tint', '#7F624C'), line = cssColor('--line', 'rgba(20,32,27,.12)');
  const lo = sorted[0] * 0.96, hi = sorted[sorted.length - 1];
  const sq = (v) => Math.sqrt(Math.max(0, v - lo));
  const padL = o.axis ? 44 : 6, padB = o.axis ? 22 : 6, padT = 8, padR = 8;
  const X = (v) => padL + (sq(v) / Math.max(1e-9, sq(hi))) * (w - padL - padR);
  const p25 = qAt(sorted, 0.25), p50 = qAt(sorted, 0.5), p75 = qAt(sorted, 0.75);
  c.fillStyle = hue; c.globalAlpha = 0.12;
  c.fillRect(X(p25), padT, Math.max(1, X(p75) - X(p25)), h - padT - padB);
  c.globalAlpha = 1;
  const step = Math.max(1, Math.floor(sorted.length / 400));
  const pts = [];
  for (let i = 0; i < sorted.length; i += step) pts.push(sorted[i]);
  c.fillStyle = ink; c.globalAlpha = 0.35;
  let seed = 7;
  pts.forEach((v) => { seed = (seed * 9301 + 49297) % 233280; const jy = seed / 233280; c.beginPath(); c.arc(X(v), padT + 3 + jy * (h - padT - padB - 6), o.axis ? 1.6 : 1.1, 0, Math.PI * 2); c.fill(); });
  c.globalAlpha = 1;
  const rule = (v, col, wd) => { if (!v || v < lo || v > hi) return; c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); c.moveTo(X(v), padT); c.lineTo(X(v), h - padB); c.stroke(); };
  if (o.now) rule(o.now, ink, 1);
  if (o.goal) rule(o.goal, hue, 1);
  if (o.axis) {
    c.strokeStyle = line; c.lineWidth = 1; c.beginPath(); c.moveTo(padL, h - padB); c.lineTo(w - padR, h - padB); c.stroke();
    if (o.labels) {
      c.fillStyle = ink; c.globalAlpha = 0.7; c.font = `400 12px ${getComputedStyle(document.body).fontFamily}`; c.textBaseline = 'top';
      const put = (v, label, align) => { c.textAlign = align; c.fillText(label, X(v), h - padB + 5); };
      put(p25, shortGbp(p25), 'right'); put(p50, shortGbp(p50), 'center'); put(p75, shortGbp(p75), 'left');
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      if (o.month) { c.save(); c.translate(10, h / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText(o.month, 0, 0); c.restore(); }
      c.globalAlpha = 1;
    }
  }
}
const coreFn = () => (typeof M.drawCore === 'function' ? M.drawCore : drawCore);

/* ============ stage moves: (d) owns M.go; the attribute and the event are set here only when it is absent ============ */
function go(stage) {
  if (typeof M.go === 'function') { try { M.go(stage); } catch (e) { /* fall through */ } }
  if (document.body.dataset.stage !== stage) {
    document.body.dataset.stage = stage;
    try { document.dispatchEvent(new CustomEvent('mercer:stage', { detail: { stage, section: null } })); } catch (e) { /* none */ }
  }
}
const stageNow = () => (typeof M.stage === 'string' ? M.stage : document.body.dataset.stage);
const phone = () => document.body.dataset.clearing === 'bottom';
/* the stage as the page shows it. The body attribute is what every stylesheet keys on, so the results scene follows it;
   M.stage is read only when the attribute is missing. The two agree in the running app and can lag apart in a test. */
const shownStage = () => document.body.dataset.stage ?? stageNow();
const setTint = (token) => { document.body.dataset.tint = token; };
/* D3: the ratio of runs that reached the goal is not shown anywhere a visitor reads. Kept for the JSON export's engine block only. */
const ratioOf = (sorted, goal) => { try { return M.chance(M.reach(sorted, goal), sorted.length).ratio; } catch (e) { return ''; } };

/* ============ the stage move to the plan view ============ */
/* the shell renames the harvest stage to plan; a shell that has not yet is given the old word, so the stage moves either way */
function goPlan() {
  go('plan');
  if (!isPlanStage(stageNow())) go('harvest');
  if (!isPlanStage(stageNow())) { document.body.dataset.stage = 'plan'; try { document.dispatchEvent(new CustomEvent('mercer:stage', { detail: { stage: 'plan', section: null } })); } catch (e) { /* none */ } }
}

/* ============ Task 21: the recap, four beats, on the cutscene mechanism ============
   Every chapter is read from the plan object (chaptersOf), never from the engine run or the ladder, so the recap, the plan
   view and the exports say the same thing. Continue, →, Space or a tap on the tree turns the page; Back and ← turn it back;
   Go to my plan (and Escape) ends the recap on the plan view, as does Continue on the last chapter. The chapters turn on
   their own until the visitor presses Back, then wait for them. Nothing here is the only place a thing is said: the plan
   view holds all of it. */
let cutToken = 0;
let cutRunning = false;
const HUES = ['--sec-offer', '--sec-reach', '--sec-routes', '--sec-close', '--sec-delivery', '--sec-money', '--sec-clients', '--sec-you', '--sec-ground'];
/** D4, the growth dial beside the headline: what the chosen level's budget reaches, from the ladder's own runs
    (lad.appetite[level]); '' until the ladder has landed (it is never awaited), at None (that level is the forecast itself) and
    when the level's budget is the visitor's own. brief drops the 1 in 10 clause for the cutscene's line. */
function levelLine(brief) {
  const lad = ladderNow();
  const p = plan();
  const level = state.appetite ?? 'moderate';
  if (!lad || !p || level === 'none') return '';
  const Level = cap(level);
  const ap = lad.appetite?.[level];
  if (!ap || ap.budget === null || ap.budget === undefined || ap.p50 === null || ap.p50 === undefined) {
    if (level === 'aggressive' && !lad.onCourse && lad.noBudget && basis() === 'revenue' && state.goal) return `At ${Level}, no budget reaches ${gbp(state.goal)} by ${monthName(goalMonth())}: ${midWords(binderWords(lad.noBudget))}.`;
    return '';
  }
  if (Math.abs(ap.budget - p.budget) < 1) return '';
  /* D3: no frequency clause here. The favourable set's figure travels with its own words or not at all. */
  const far = !brief && ap.p90 !== null && ap.p90 !== undefined ? `; on the favourable assumptions, ${gbp(near(ap.p90))}` : '';
  return `At ${Level}, ${gbp(ap.budget)} a month: the base assumptions reach ${gbp(near(ap.p50))}${far}.`;
}
/* Task 21: four beats, the same four on both routes. Each beat is a headline, at most one supporting line and a tree
   transition. Nothing turns on a timer: the beat on screen stays until the visitor presses. */
const CHAPTER_TITLES = { owner: ['Recognise', 'Focus', 'Move', 'Open'], starter: ['Recognise', 'Focus', 'Move', 'Open'] };
const BEATS = 4;
const firstOf = (x) => (Array.isArray(x) ? x[0] : x);
const wordsOf = (x) => clean(strOf(x)).trim();
const linesOf = (x, n = 3) => listOf(x).slice(0, n);
/** a beat: { title, figure, lines[], hue, key, section, limb, collar }; one supporting line at most */
const chapter = (i, route, o) => ({ title: CHAPTER_TITLES[route][i] ?? CHAPTER_TITLES[route][BEATS - 1], figure: wordsOf(o.figure) || (CHAPTER_TITLES[route][i] ?? ''), lines: (o.lines ?? []).map(wordsOf).filter(Boolean).slice(0, 1), hue: o.hue ?? '--sec-crown', key: o.key ?? 'C', section: o.section ?? null, limb: o.limb ?? null, collar: o.collar ?? null, last: i === BEATS - 1 });
function ownerChapters(pl) {
  const g = pl.goal ?? {};
  const first = pl.firstAction ?? pl.actions?.[0] ?? null;
  const f = pl.finding ?? {};
  const adv = listOf((pl.advantages ?? []).map((a) => (typeof a === 'string' ? a : a?.line ?? a?.text ?? a?.title ?? '')));
  const have = firstOf(pl.advantages);
  const fin = resultFinding(pl);
  const goalWords = goalFigure(pl);
  return [
    /* Recognise: what they already have, named, not praised */
    chapter(0, 'owner', { figure: adv.length ? `You already have ${lc(shortLabel(have?.title ?? adv[0], 8))}` : 'What this plan stands on', lines: [adv[0] ?? pl.situation ?? ''], hue: '--sec-you', key: 'G', section: 'you', limb: 'trunk' }),
    /* Focus: the constraint, against the goal */
    chapter(1, 'owner', { figure: `${fin?.label ?? wordsOf(f.short ?? f.title ?? 'What matters most')}${goalWords ? `, against ${lc(goalWords)}` : ''}`, lines: [f.text ?? linesOf(f.evidence, 1)[0] ?? ''], hue: sectionBy(f.section)?.hue ?? '--sec-reach', key: sectionBy(f.section)?.key ?? 'C', section: f.section ?? null, limb: f.limb ?? null, collar: f.limb ?? null }),
    /* Move: the one concrete action */
    chapter(2, 'owner', { figure: first?.action ? shortLabel(first.action, 9, SHORT_ACTION) : 'No first action yet', lines: [first?.whyFirst ?? (first?.doneWhen ? `Done when: ${first.doneWhen}` : '')], hue: sectionBy(first?.affects?.section)?.hue ?? '--sec-offer', key: sectionBy(first?.affects?.section)?.key ?? 'G', section: first?.affects?.section ?? null, limb: first?.affects?.limb ?? null }),
    /* Open */
    chapter(3, 'owner', { figure: 'Reveal my plan', lines: [(pl.actions ?? []).filter((a) => !a.fromAnswers).length ? `${plural((pl.actions ?? []).filter((a) => !a.fromAnswers).length, 'move', 'moves')}, in order, with the steps for each.` : ''], hue: '--sec-crown', key: 'C', section: 'crown' }),
  ];
}
function starterChapters(pl) {
  const have = pl.foundations ?? pl.buildFrom ?? pl.have ?? {};
  const d = pl.direction ?? pl.recommended ?? pl.finding ?? {};
  const prove = firstOf(pl.toProve ?? pl.unknowns) ?? null;
  const first = pl.firstAction ?? pl.actions?.[0] ?? null;
  const skills = typeof have === 'string' ? [have] : listOf(have.skills);
  const access = typeof have === 'string' ? [] : listOf(have.access);
  const strongest = skills[0] ?? access[0] ?? '';
  const proveWords = typeof prove === 'string' ? wordsOf(prove) : wordsOf(prove?.title ?? prove?.short ?? '');
  return [
    chapter(0, 'starter', { figure: strongest ? `Your strongest starting point is ${lc(shortLabel(strongest, 8))}` : 'What you bring', lines: [access[0] ?? (typeof have === 'string' ? have : have.time) ?? pl.situation ?? ''], hue: '--sec-you', key: 'G', section: 'you', limb: 'trunk' }),
    chapter(1, 'starter', { figure: wordsOf(d.short ?? d.title ?? d.offer ?? 'Your strongest direction'), lines: [d.buyer ? `For ${lc(wordsOf(d.buyer))}${d.problem ? `, who ${lc(wordsOf(d.problem))}` : ''}.` : wordsOf(d.text ?? d.why ?? '')], hue: '--sec-offer', key: 'G', section: 'offer', limb: 'pricing' }),
    chapter(2, 'starter', { figure: first?.action ? shortLabel(first.action, 9, SHORT_ACTION) : 'Your first test', lines: [first?.whyFirst ?? (proveWords ? `What it proves: ${lc(proveWords)}.` : '')], hue: '--sec-close', key: 'A', section: first?.affects?.section ?? 'close', limb: first?.affects?.limb ?? 'conversion' }),
    chapter(3, 'starter', { figure: 'Reveal my plan', lines: [(pl.actions ?? []).filter((a) => !a.fromAnswers).length ? `${plural((pl.actions ?? []).filter((a) => !a.fromAnswers).length, 'move', 'moves')}, in order, with the steps for each.` : ''], hue: '--sec-crown', key: 'C', section: 'crown' }),
  ];
}
/** the four beats for a plan object; a plan that carries its own recap (plan.recap: [{ title, figure, lines }]) is read as it is */
function chaptersOf(pl) {
  if (!pl) return [];
  const route = pl.route === 'starter' ? 'starter' : 'owner';
  if (Array.isArray(pl.recap) && pl.recap.length >= BEATS) return pl.recap.slice(0, BEATS).map((c, i) => ({ ...chapter(i, route, { figure: c.figure ?? c.title, lines: c.lines ?? [c.text], hue: c.hue, key: c.key, section: c.section, limb: c.limb, collar: c.collar }), title: wordsOf(c.title) || CHAPTER_TITLES[route][i] }));
  return route === 'starter' ? starterChapters(pl) : ownerChapters(pl);
}
/* the chapter on screen, so a ladder that lands mid-scene can repaint its second line, and Back knows where it is */
let cutOn = null;
let cutIndex = 0;
/* (d)'s go('cutscene') sets the stage (the stage event starts the scene here) and then calls cutscene() itself and moves on
   when the promise settles. A second call while the scene runs must hand back the running scene's promise, never a settled
   one: that was the fault that moved the stage on the first frame and hid every beat (fix 1, item 25). */
let cutPromise = null;
function cutscene() {
  if (cutRunning && cutPromise) return cutPromise;
  cutPromise = runCutscene().catch(() => { cutRunning = false; }).then(() => { cutPromise = null; });
  return cutPromise;
}
/** the stage is held at cutscene for the whole scene; when (d) is absent the attribute and the event are set here */
function holdCutStage() {
  if (stageNow() === 'cutscene' && document.body.dataset.stage === 'cutscene') return;
  try { state.stage = 'cutscene'; } catch (e) { /* the attribute alone */ }
  document.body.dataset.stage = 'cutscene';
  try { document.dispatchEvent(new CustomEvent('mercer:stage', { detail: { stage: 'cutscene', section: null } })); } catch (e) { /* none */ }
}
/* where the recap ends: the plan view (Continue on the last chapter, Go to my plan, Escape), or explore with one card open
   when the visitor asked to see a branch */
let cutExit = { to: 'plan', card: null };
function endCut() {
  const exit = cutExit;
  cutExit = { to: 'plan', card: null };
  if (exit.to === 'explore') {
    go('explore');
    if (!entered || stageNow() !== 'explore') enter();
    if (exit.card) openCard(exit.card);
    return;
  }
  goPlan();
}
/* a wait inside the scene that Skip can end at once, so the scene's promise settles when the scene does */
let cutWake = null;
/* real time, not wait(): under reduced motion wait() is 0, which ran all six beats inside one frame; SPEC keeps the holds and
   turns the moves into fades (the rise 200 ms, a chapter's exit 120 ms) */
const pause = (ms) => Promise.race([new Promise((res) => setTimeout(res, ms)), new Promise((res) => { cutWake = res; })]);
/** fix 3, item 6: the scene waits for the plan at the answers' own key and then holds that one object for every chapter.
    (d)'s ensurePlanned is synchronous today, so the wait ends on its first turn; it is here for a (d) that plans elsewhere. */
async function planForScene(token) {
  for (let i = 0; i < 40 && token === cutToken; i++) {
    try { M.ensurePlanned?.(); } catch (e) { /* no plan yet */ }
    const p = plan();
    if (p && (!p.key || p.key === safeKey())) return p;
    await new Promise((res) => setTimeout(res, 100));
  }
  return token === cutToken ? plan() : null;
}
/* the recap's own controls inside #cutscene: the chapter line, Back, Continue, See the branch, Go to my plan. The shell's
   #cut-skip stays bound (app.js presses skip()) and reads Go to my plan. */
let cutChromeDone = false;
function ensureCutChrome() {
  if (cutChromeDone) return;
  const host = $('#cutscene');
  if (!host) return;
  cutChromeDone = true;
  if (!$('#cut-chapter', host)) { const p = document.createElement('p'); p.id = 'cut-chapter'; p.className = 'eyebrow small'; host.insertBefore(p, $('#cut-figure', host) ?? host.firstChild); }
  if (!$('#cut-nav', host)) {
    const nav = document.createElement('div');
    nav.id = 'cut-nav';
    nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Recap');
    nav.innerHTML = '<button type="button" class="glass small" id="cut-back" aria-label="Back a beat">Back</button><ol class="cut-dots" id="cut-dots" aria-hidden="true"></ol><button type="button" class="glass small glass-on" id="cut-next">Continue</button><button type="button" class="link" id="cut-see" hidden>See the branch</button>';
    const skipBtn = $('#cut-skip', host);
    if (skipBtn) host.insertBefore(nav, skipBtn); else host.appendChild(nav);
    $('#cut-back', nav).addEventListener('click', () => turn(-1, true));
    $('#cut-next', nav).addEventListener('click', () => turn(1, true));
    $('#cut-see', nav).addEventListener('click', () => { const c = cutOn?.chapter; if (!c?.section || c.section === 'crown') return; cutExit = { to: 'explore', card: c.section }; skip(); });
  }
  const skipBtn = $('#cut-skip', host);
  /* Task 21: the way out is always on screen and always says the same thing */
  if (skipBtn) { skipBtn.textContent = 'Go to my plan'; skipBtn.setAttribute('aria-label', 'Go to my plan'); }
}
let turnRes = null; // resolves the current beat with the direction pressed; there is no other way for a beat to end
function turn(dir) {
  if (!cutRunning) return;
  feel.play('tap', { x: dir < 0 ? 0.3 : 0.7 });
  turnRes?.(dir);
}
/** the chapter's lines; the first chapter (the goal) carries the chosen level's line (D4) once the ladder has landed */
const chapterLines = (c, i) => [...c.lines, i === 0 && c.section === 'crown' ? levelLine(true) : ''].filter(Boolean).join('\n');
function paintChapter(c, i, n) {
  const host = $('#cutscene');
  const figEl = $('#cut-figure'), lineEl = $('#cut-line'), chEl = $('#cut-chapter'), see = $('#cut-see'), back = $('#cut-back'), next = $('#cut-next'), dots = $('#cut-dots');
  if (chEl) chEl.textContent = `${i + 1} of ${n} · ${c.title}`;
  figEl.textContent = c.figure;
  lineEl.textContent = chapterLines(c, i);
  if (see) see.hidden = !(c.section && c.section !== 'crown' && discOrder().includes(c.section));
  if (back) back.disabled = i === 0;
  if (next) next.textContent = c.last ? 'Reveal my plan' : 'Continue';
  if (dots) dots.innerHTML = Array.from({ length: n }, (_, k) => `<li${k === i ? ' class="on"' : ''}></li>`).join('');
  if (host) host.dataset.chapter = String(i + 1);
}
async function runCutscene() {
  /* running from the first line, before any wait: a second cutscene() call in the same move must get this scene's promise */
  cutRunning = true;
  const token = ++cutToken;
  const p = await planForScene(token);
  if (token !== cutToken) return;
  const pl = planObj().plan;
  if (!p && !pl) { cutRunning = false; endCut(); return; }
  entered = false;
  dropCrownWait();
  holdCutStage();
  ensureCutChrome();
  /* Task 19 and 21: the toolbar is there from the first generated view, the recap included */
  paintBar();
  cutOn = null;
  cutIndex = 0;
  const figEl = $('#cut-figure'), lineEl = $('#cut-line'), skipBtn = $('#cut-skip');
  const t = tree();
  ladder();
  figEl.textContent = ''; lineEl.textContent = '';
  if (skipBtn) skipBtn.onclick = () => skip();
  feel.birds(0, 1200);
  try { t?.frame('cutscene'); t?.setEncoding?.(true); t?.select?.(null); t?.setCollar?.(null); t?.setView?.('current'); } catch (e) { /* camera optional */ }
  feel.play('rise', { x: 0.5 });
  const list = chaptersOf(pl);
  if (!list.length) { cutRunning = false; endCut(); return; }
  const m = goalMonth();
  const r = p ? rangeAt(m, p) : null;
  const odds = p && state.goal ? (() => { try { return M.reach(r.sorted, state.goal) / r.sorted.length; } catch (e) { return 0; } })() : 0;
  const progress = p ? (() => { try { const g = M.goalOf?.(); return g && g > p.base ? clamp((r.p50 - p.base) / (g - p.base), 0, 1) : 1; } catch (e) { return 1; } })() : 1;
  await pause(reduce() ? 200 : 2400); // the first chapter's words appear after the rise
  let i = 0;
  while (i < list.length && token === cutToken) {
    const c = list[i];
    cutIndex = i;
    setTint(c.hue);
    try {
      if (i === 0) { t?.setMetrics?.({ progress: 0, odds, profit: p?.margin ?? 0, repeat: p?.repeat ?? 0 }); const sc = (pl?.scenarios ?? [])[1]; if (sc) t?.setMetric?.({ baseline: sc.baseline ?? p?.base ?? 0, scenario: sc.value ?? sc.scenario ?? 0, target: sc.target ?? state.goal ?? null, label: sc.label ?? 'Plan' }); }
      /* Focus: the tree fills the frame, the constrained limb wears its collar and the branch lights */
      if (i === 1) { t?.frame({ dist: 1.0, ms: 2400 }); t?.setMetrics?.({ progress, odds, profit: p?.margin ?? 0, repeat: p?.repeat ?? 0 }); t?.setCollar?.(c.collar ?? null); if (c.limb) t?.select?.(c.limb); feel.birds(1, 2000); }
      /* Move: the branch the first action changes */
      if (i === 2) { if (c.limb) t?.select?.(c.limb); }
      if (i === BEATS - 1) { t?.select?.(null); t?.setView?.('plan'); }
    } catch (e) { /* optional */ }
    figEl.classList.remove('out'); lineEl.classList.remove('out');
    figEl.classList.add('in'); lineEl.classList.add('in');
    paintChapter(c, i, list.length);
    cutOn = { chapter: c, lineEl, index: i };
    feel.play('beat', { key: c.key, step: i, x: 0.5 });
    /* Task 21: the beat waits for a press. There is no timer: nothing on screen leaves until Back, Continue, a key, a tap on
       the tree or Go to my plan says so. */
    const dir = await new Promise((res) => { turnRes = res; });
    turnRes = null;
    if (token !== cutToken) break;
    figEl.classList.remove('in'); lineEl.classList.remove('in');
    figEl.classList.add('out'); lineEl.classList.add('out');
    cutOn = null;
    await pause(reduce() ? 120 : 400);
    if (dir < 0) i = Math.max(0, i - 1); else i += 1;
  }
  cutOn = null;
  if (token !== cutToken) return;
  cutRunning = false;
  try { t?.select?.(null); t?.setView?.('current'); } catch (e) { /* optional */ }
  figEl.textContent = ''; lineEl.textContent = '';
  const chEl = $('#cut-chapter'); if (chEl) chEl.textContent = '';
  figEl.classList.remove('in', 'out'); lineEl.classList.remove('in', 'out');
  endCut();
}
/* Space, → or a tap on the tree turns the page; ← turns back; Escape jumps to the plan */
const skipBeat = () => turn(1);
/** Go to my plan (the shell's #cut-skip and Escape): the recap ends at once and the plan view opens */
function skip() {
  if (!cutRunning) return;
  cutToken++;
  cutRunning = false;
  cutOn = null;
  const figEl = $('#cut-figure'), lineEl = $('#cut-line');
  figEl.textContent = ''; lineEl.textContent = '';
  const chEl = $('#cut-chapter'); if (chEl) chEl.textContent = '';
  figEl.classList.remove('in', 'out'); lineEl.classList.remove('in', 'out');
  feel.play('tap', { x: feel.x($('#cut-skip')) });
  try { tree()?.setView?.('current'); } catch (e) { /* optional */ }
  cutWake?.(); turnRes?.(1);
  endCut();
}
/** Play again, from explore or the plan view: the card and the review panel close, the discs leave, the four beats run.
    C04: a replay never draws over an open card or the panel. */
function replay() {
  if (cutRunning) return cutPromise;
  closeShare();
  closeCard(true);
  try { tree()?.setDiscs?.([]); } catch (e) { /* optional */ }
  if (typeof M.go === 'function') { try { const r = M.go('cutscene'); if (stageNow() === 'cutscene') return cutPromise ?? r; } catch (e) { /* run it here */ } }
  return cutscene();
}
document.addEventListener('keydown', (e) => {
  if (!cutRunning) return;
  const tg = e.target;
  if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
  if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1, true); }
  if (e.key === 'Escape') { e.preventDefault(); skip(); }
}, true);
$('#stage')?.addEventListener('pointerup', () => { if (cutRunning) turn(1); });

/* ============ S7: the discs and the cards ============ */
let entered = false;
let openId = null;
const opened = new Set();
const discEls = new Map();
const cardEl = () => $('#card');
/* Task 21: the state a branch was left in, so back and close bring it back rather than resetting it. One entry a card:
   whether its ▾ was open, and how far its scroller had run. */
const cardState = new Map();

/** the ten discs. U20: two kinds of circle, not four. A disc is one filled circle in its section's hue at three sizes: the
    card that is open (1.5), a section not yet seen (1), a section seen (0.6, never under a 24 px target). The one other kind
    is the pale dashed circle the intro taught: unfinished, and a press on it goes back to the question (U35), which its name
    says. No ring, no double ring, no mist: the first limit is worn by the limb itself (the collar, setCollar). `seen` and
    `unfinished` ride along for a tree that wants them. */
function discList() {
  const unf = new Set(unfinished());
  return discOrder().map((id) => {
    const s = sectionBy(id);
    const hollow = unf.has(id) && typeof M.reopen === 'function';
    const seen = opened.has(id);
    const name = titleCase(s?.name ?? id); // D6: the section's name on the tree is a headline too
    return { id, part: partOf(id), state: hollow ? 'hollow' : 'filled', scale: openId === id ? 1.5 : hollow || !seen ? 1 : 0.6, collar: false, mist: false, seen, unfinished: hollow, name: hollow ? `Finish: ${name}` : name, hue: s?.hue ?? '--sec-crown' };
  });
}
/* the disc key (fix 1, item 26): every name once for 2.4 s, shown when the explore camera has settled so the names are measured
   where they will stand; any two names that still overlap are moved apart by a name's height. The tree places the names; this
   pass is a net under it and does nothing when no two names touch. The phone has the row instead. */
let keyTimer = 0;
const KEY_DELAY = 1000, KEY_MS = 2400;
function showKey() {
  clearTimeout(keyTimer);
  keyTimer = setTimeout(() => {
    const t = tree();
    /* the crown card keeps the whole-tree frame, so the key still plays beside it (after Skip the card is open before the key) */
    if (!t || stageNow() !== 'explore' || (openId && openId !== 'crown') || phone()) return;
    try { t.showDiscNames?.(KEY_MS); } catch (e) { return; }
    requestAnimationFrame(() => requestAnimationFrame(spreadNames));
  }, reduce() ? 0 : KEY_DELAY);
}
/* Task 19 supersedes fix 2 item 10. Nothing opens a card by itself any more: the clearing is never empty because the
   composition (the headline, the target, the finding, the action and the branch labels) is the first view. A card is the
   inspector, and it opens on a press. The wait is kept only to be cancelled by a scene that starts again. */
let crownTimer = 0;
const dropCrownWait = () => { clearTimeout(crownTimer); };
function spreadNames() {
  /* the tree's discs stand in .tree-discs today and in #discs once they leave the aria-hidden stage (U37); either is measured */
  const names = $$('.tree-discs .disc .disc-name, #discs .disc .disc-name').filter((el) => el.textContent && el.offsetParent !== null);
  if (names.length < 2) return;
  names.forEach((el) => { el.style.marginTop = ''; });
  const boxes = names.map((el) => { const r = el.getBoundingClientRect(); return { el, l: r.left, r: r.right, t: r.top, b: r.bottom, dy: 0 }; }).sort((a, b) => a.t - b.t);
  const placed = [];
  boxes.forEach((bx) => {
    for (let guard = 0; guard < 12; guard++) {
      const hit = placed.find((q) => bx.l < q.r + 6 && bx.r > q.l - 6 && bx.t + bx.dy < q.b + q.dy + 2 && bx.b + bx.dy > q.t + q.dy - 2);
      if (!hit) break;
      bx.dy = hit.b + hit.dy + 3 - bx.t;
    }
    placed.push(bx);
  });
  boxes.forEach((bx) => { if (bx.dy) bx.el.style.marginTop = `${Math.round(bx.dy)}px`; });
  setTimeout(() => names.forEach((el) => { el.style.marginTop = ''; }), 2400 + 300);
}
/* The phone's row (U6). Ten unlabelled dots under the tree were the pattern the client removed in words, so the row is words:
   one tab a section in the eyebrow's own form (the section's dot in its hue, then its name), the open one in ink. A pale dot
   is an unfinished section, as the intro taught. The strip scrolls sideways and keeps the open tab in view. The tabs are this
   file's own buttons (class tab) and the only thing it ever removes from #discs: the tree's discs may stand in the same host
   once they leave the aria-hidden stage (U37), so the host is never emptied. */
function dropTabs() { discEls.forEach((el) => el.remove()); discEls.clear(); const row = $('#discs'); if (row) { row.classList.remove('tabs'); delete row.dataset.at; } }
/** a disc or a tab was pressed: an unfinished section goes back to the question it left (U35), any other opens its card */
function pressSection(id, fromEl) {
  if (id !== 'crown' && unfinished().includes(id) && reopenBud(id)) return;
  feel.play('discopen', { x: fromEl ? feel.x(fromEl) : 0.6 });
  openCard(id);
}
function paintDiscs(pop) {
  const list = discList();
  const t = tree();
  if (t && typeof t.setDiscs === 'function') { try { t.setDiscs(list); if (pop && !phone()) showKey(); } catch (e) { /* the row below still works */ } }
  const row = $('#discs');
  if (!row) return;
  if (!phone()) { dropTabs(); return; }
  row.classList.add('tabs');
  /* the strip starts with the crown, the card that opens by itself, so the open tab is in view with no scroll; then the limbs
     in the order the arrows and the swipe walk them */
  [...list].sort((a, b) => (a.id === 'crown' ? -1 : b.id === 'crown' ? 1 : 0)).forEach((d, i) => {
    let el = discEls.get(d.id);
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.dataset.id = d.id;
      el.innerHTML = '<i class="dot"></i><span class="tab-word"></span>';
      el.addEventListener('click', () => pressSection(d.id, el));
      row.appendChild(el);
      discEls.set(d.id, el);
    }
    const name = sectionBy(d.id)?.name ?? d.id;
    el.className = `tab${d.unfinished ? ' unfinished' : ''}${openId === d.id ? ' on' : ''}`;
    el.style.setProperty('--hue', `var(${d.hue})`);
    el.querySelector('.tab-word').textContent = titleCase(name);
    el.setAttribute('aria-label', d.unfinished ? `${name}: unfinished. Opens the question you left.` : name);
    el.setAttribute('aria-pressed', String(openId === d.id));
    if (pop && !reduce()) { el.style.transitionDelay = `${i * 40}ms`; el.classList.add('pop'); requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.remove('pop'); setTimeout(() => { el.style.transitionDelay = ''; }, 700); })); }
  });
  /* the open tab is brought to the middle once per change of card: a repaint of the same card does not restart the slide */
  const on = discEls.get(openId);
  /* only a strip that is laid out can be measured: a card opened while the row is still hidden (a return from a reopened
     question paints before the stage shows the row) is left for the next paint */
  const laidOut = !!on && row.clientWidth > 0 && on.offsetWidth > 0;
  if (laidOut && row.dataset.at !== openId && typeof row.scrollTo === 'function') { row.dataset.at = openId; try { row.scrollTo({ left: Math.max(0, on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2), behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { /* the strip stays where it is */ } }
  if (!on) delete row.dataset.at;
}

function enter() {
  /* a second call in the same move ((d) calls enter() after the stage event already ran it) keeps the wait that is running; a
     return from the harvest with no card open gets the crown card at once */
  if (entered && stageNow() === 'explore') { paintDiscs(false); paintScene(); return; }
  entered = true;
  try { M.ensurePlanned?.(); } catch (e) { /* no plan */ }
  const t = tree();
  M.monthShown = goalMonth();
  /* Task 19: the tree is the middle of the composition, not a thing beside a column. On a phone it keeps the top of the
     screen and the finding sits under it, so only the wide layout pins the camera to the centre. */
  /* Task 19: the tree's own centred composition (no clearing reserved) is asked for here; a tree without it is pinned to
     the middle by hand instead, so the scene is balanced either way. The results page draws the inspector and the Whole
     tree reset, so the tree's own are turned off and only one of each is on screen. */
  try {
    t?.setInspector?.(false); t?.setWholeControl?.(false);
    if (typeof t?.setComposition === 'function' && !phone()) { t.setComposition('centred'); t.frame('explore'); }
    else t?.frame('explore', phone() ? {} : { at: { x: 0.5, y: 0.46 }, distMul: 1.12 });
    t?.setEncoding?.(true); t?.lockDrag?.(false);
  } catch (e) { /* optional */ }
  try { if (typeof M.paintTree === 'function') M.paintTree(); } catch (e) { /* the tree keeps its last paint */ }
  const p = plan();
  if (p && t) {
    const r = rangeAt(goalMonth());
    const odds = state.goal ? (() => { try { return M.reach(r.sorted, state.goal) / r.sorted.length; } catch (e) { return 0; } })() : 0;
    const progress = (() => { try { const g = M.goalOf?.(); return g && g > p.base ? clamp((r.p50 - p.base) / (g - p.base), 0, 1) : 1; } catch (e) { return 1; } })();
    try { t.setMetrics?.({ progress, odds, profit: p.margin, repeat: p.repeat ?? 0 }); } catch (e) { /* optional */ }
    const lim = limit();
    try { t.setCollar?.(lim ? LIMIT_BRANCH[lim.type] : null); } catch (e) { /* optional */ }
  }
  ensureCardChrome();
  closeCard(true);
  setTint('--sec-crown');
  paintDiscs(true);
  paintScene();
  feel.play('done', { octave: true, x: 0.5 });
  feel.birds(1, 2000);
  ladder().then(() => { if (openId) paintCard(openId); paintScene(); });
}
/* the card's own chrome: the Harvest button under it, and the swipe between discs on the phone */
let chromeDone = false;
function ensureCardChrome() {
  if (chromeDone) return;
  chromeDone = true;
  const card = cardEl();
  if (!card) return;
  /* U38: the title can take focus (an h2 cannot until it is told to); the card is a named region and not a live one, because
     every repaint (the ladder landing, a mode change) read the whole card out again, the month table included. One quiet
     line outside the card says which card opened when focus was not moved to it. */
  $('#card-title', card)?.setAttribute('tabindex', '-1');
  card.removeAttribute('aria-live');
  card.setAttribute('role', 'region');
  card.setAttribute('aria-labelledby', 'card-title');
  if (!$('#card-say')) { const say = document.createElement('p'); say.id = 'card-say'; say.className = 'sr-only'; say.setAttribute('aria-live', 'polite'); document.body.appendChild(say); }
  const foot = document.createElement('div');
  foot.id = 'card-foot';
  foot.innerHTML = `<button type="button" class="link" id="card-finish" hidden>Answer the question you left</button><button type="button" class="glass" id="harvest-go">Your plan</button>`;
  card.appendChild(foot);
  $('#harvest-go', card).addEventListener('click', () => { feel.play('open', { x: feel.x($('#harvest-go')) }); openPlan(); });
  /* U35, the card's side: an unfinished section's card says so in its foot, and the words are what the press does */
  $('#card-finish', card).addEventListener('click', () => { if (openId) reopenBud(openId); });
  /* C13, D3: the eyebrow's term opens its one-line meaning in place, the same gesture as a question's title */
  $('#card-term', card)?.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('.term') : null;
    const def = $('#card-term-def', card);
    if (!b || !def) return;
    feel.toggle(def, def.hidden, b);
  });
  $('#card-more', card).addEventListener('click', () => {
    const body = $('#card-body'), head = $('#card-more');
    const open = body.hidden;
    if (open) fillBody(body);
    feel.toggle(body, open, head);
  });
  let sx = null, sy = null;
  card.addEventListener('touchstart', (e) => { const t0 = e.touches[0]; sx = t0.clientX; sy = t0.clientY; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (sx === null || !phone()) return;
    const t0 = e.changedTouches[0];
    const dx = t0.clientX - sx, dy = t0.clientY - sy;
    sx = sy = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    const order = discOrder();
    const i = Math.max(0, order.indexOf(openId ?? 'crown'));
    const nxt = order[(i + (dx < 0 ? 1 : order.length - 1)) % order.length];
    openCard(nxt);
  }, { passive: true });
  const t = tree();
  if (t && typeof t.on === 'function') {
    t.on('disc', (d) => {
      if (!d?.id) return;
      /* C1: the discs stay on the tree at the harvest, so a press on one is a way back: explore, then that card */
      if (isPlanStage(stageNow())) go('explore');
      if (stageNow() !== 'explore') return;
      pressSection(String(d.id), null);
    });
    t.on('select', (id) => {
      if (stageNow() !== 'explore' || !id || reopening) return; // a disc that sent the visitor back to a question opens no card behind it
      if (openId && LIMB_OF_SECTION[openId] === id) return; // the disc event already opened this limb's own card (routes and reach share demand)
      const sec = id === 'crown' ? 'crown' : id === 'trunk' ? 'you' : id === 'roots' ? 'ground' : id === 'demand' ? 'reach' : SECTION_OF_DRIVER[id];
      if (sec && sec !== openId) openCard(sec);
    });
    /* U35: a pale twig pressed on the tree goes back to its own question, when the tree says which twig it was */
    t.on('twig', (d) => { const qid = d?.id ? String(d.id) : ''; if (stageNow() !== 'explore' || !qid || typeof M.reopen !== 'function') return; if (discOrder().some((sec) => budsOf(sec).includes(qid))) { reopening = true; setTimeout(() => { reopening = false; }, 0); feel.play('tap', { x: 0.6 }); try { Promise.resolve(M.reopen(qid)).catch(() => {}); } catch (e) { /* (d)'s own fault */ } } });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const tg = e.target;
    if (isPlanStage(stageNow())) {
      /* C1: Escape leaves the plan view too, unless it was pressed in the agent's field */
      if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      leaveHarvest();
      return;
    }
    if (stageNow() !== 'explore' || !openId) return;
    e.preventDefault();
    closeCard();
  });
}

let lastPress = null; // what had focus when the visitor opened a card, so closing it hands focus back (U38)
function openCard(id, o = {}) {
  if (!discOrder().includes(id)) return;
  const t = tree();
  const s = sectionBy(id);
  const from = document.activeElement;
  if (o.focus !== false && from && from !== document.body && !cardEl()?.contains(from)) lastPress = from;
  /* Task 21: one expanded panel at a time. The panel that is open is the peer this one replaces, and its state is kept. */
  if (openId && openId !== id) keepCardState(openId);
  closeTma();
  openId = id;
  opened.add(id);
  setTint(s?.hue ?? '--sec-crown');
  try {
    const preset = PRESET_OF[id] ?? 'explore';
    if (phone()) t?.frame(preset, { at: { y: 0.3 }, distMul: id === 'crown' ? 1 : 1.15 });
    else t?.frame(preset, { distMul: id === 'crown' ? 1 : 1.15 });
    t?.select?.(id === 'crown' ? 'crown' : id === 'you' ? 'trunk' : id === 'ground' ? 'roots' : LIMB_OF_SECTION[id] ?? null);
  } catch (e) { /* camera optional */ }
  /* the crown card opens by itself and keeps the whole tree in frame, so the birds stay; a limb's card fades them as before */
  feel.birds(id === 'crown' ? 1 : 0, 2000);
  paintCard(id);
  paintDiscs(false);
  const card = cardEl();
  card.classList.remove('leaving');
  card.classList.add('open');
  /* Task 19: the composition gives the clearing back to the inspector while a branch is open, and takes it back on close */
  document.body.dataset.inspect = id;
  restoreCardState(id);
  if (shownStage() === 'explore') paintScene();
  /* U38: a card the visitor opened takes focus at its title (focusable since ensureCardChrome) once it has faded in; a card
     that opened by itself leaves focus where it was and is named by the quiet line instead. Never both, so it is said once. */
  if (o.focus === false) { const say = $('#card-say'); if (say) say.textContent = $('#card-title')?.textContent ?? ''; }
  else setTimeout(() => { if (openId !== id) return; try { $('#card-title')?.focus({ preventScroll: true }); } catch (e) { /* none */ } }, 260);
  try { document.dispatchEvent(new CustomEvent('mercer:card', { detail: { id } })); } catch (e) { /* none */ }
}
/** Task 21: what a card was left in, kept for the next time it opens */
function keepCardState(id) {
  if (!id) return;
  const body = $('#card-body'), more = $('#card-more'), scroll = $('#card-scroll');
  cardState.set(id, { body: !!body && !body.hidden && more?.getAttribute('aria-expanded') === 'true', scroll: scroll?.scrollTop ?? 0 });
}
function restoreCardState(id) {
  const st = cardState.get(id);
  if (!st) return;
  const body = $('#card-body'), more = $('#card-more'), scroll = $('#card-scroll');
  if (st.body && body && more && !more.hidden) { fillBody(body); feel.toggle(body, true, more, { instant: true }); }
  if (scroll && st.scroll) { try { scroll.scrollTop = st.scroll; } catch (e) { /* none */ } }
}
function closeCard(silent) {
  const card = cardEl();
  if (!card) return;
  const had = openId;
  if (had) keepCardState(had);
  openId = null;
  paintedId = null; // a card opened again is painted fresh; restoreCardState reopens what was left open
  card.classList.remove('open');
  delete document.body.dataset.inspect;
  if (!silent) {
    feel.play('close', { x: feel.x(card) });
    feel.birds(1, 2000);
    try { tree()?.frame('explore'); tree()?.select?.(null); tree()?.setLabel?.('crown', ''); } catch (e) { /* optional */ }
    setTint('--sec-crown');
    /* U38: focus goes back to the disc or the tab that opened the card, if it is still on the page */
    if (card.contains(document.activeElement) && lastPress && lastPress.isConnected) { try { lastPress.focus({ preventScroll: true }); } catch (e) { /* none */ } }
  }
  lastPress = null;
  paintDiscs(false);
  if (had) { try { document.dispatchEvent(new CustomEvent('mercer:card', { detail: { id: null } })); } catch (e) { /* none */ } }
  /* Task 19: a closed card gives the clearing back to the composition, not to another card. Nothing opens by itself now: the
     scene already carries the headline, the target, the finding and the first action, so the visitor never faces an empty
     clearing (what fix 2 item 10 opened the crown card for). */
  if (shownStage() === 'explore') paintScene();
}
/** the next or previous disc in the row's order; (d) turns → and ← into these at explore */
function nextCard(dir = 1) {
  const order = discOrder();
  const i = Math.max(0, order.indexOf(openId ?? 'crown'));
  openCard(order[(i + (dir < 0 ? order.length - 1 : 1)) % order.length]);
}
const prevCard = () => nextCard(-1);
function repaint() {
  if (stageNow() === 'explore' || isPlanStage(stageNow())) {
    paintDiscs(false);
    if (openId) paintCard(openId);
    if (isPlanStage(stageNow())) paintPlan(false);
  }
}

/* ---------- the source word beside a figure ---------- */
const srcWord = (from) => `<span class="src" data-from="${FROM_KIND(from)}">${esc(FROM_WORD(from))}</span>`;
const line = (html, cls = '') => `<p${cls ? ` class="${cls}"` : ''}>${html}</p>`;
const inputRow = (key) => inputs().find((r) => r.key === key) ?? null;
const figLine = (label, row) => (row ? line(`${esc(label)} <b class="tabular">${esc(row.value)}</b> ${srcWord(row.from)}`) : '');
/** D3: a step's £ figure sits under the card's ▾, in the full line that says which run it is measured on */
const rangeNoteHtml = () => { const t = rangeNote(); return t ? `<p class="small range-note">${esc(t)}</p>` : ''; };
const stepMore = (st) => (st ? `<div class="steps"><p class="step">${esc(stepLine(st))}</p>${rangeNoteHtml()}</div>` : '');

/* ---------- the value of an answer, said back (the leaves list and the exports) ---------- */
const MONEY_KEYS = new Set(['now', 'goal', 'budget', 'spendNow', 'price', 'retainerValue', 'retainerMin', 'retainerMax', 'agencyFee', 'fixedCosts', 'owed', 'ltv']);
const TENS_KEYS = new Set(['closeRate', 'repeat', 'retainerRenew']);
function keyOfQ(id) {
  try { return M.SCHEMA_BY?.[id]?.key ?? M.Q?.[id]?.key ?? id; } catch (e) { return id; }
}
/* Not sure on these has no engine stand-in: the value stays empty and no sentence is printed about it (fix 1, item 21) */
const NO_STANDIN = new Set(['topShare', 'network', 'owed', 'listSize', 'contacts']);
const unsure = (id) => { try { return !!state.notSure?.has?.(id); } catch (e) { return false; } };
const notGiven = (id) => NO_STANDIN.has(id) && (unsure(id) || !(Number(state[keyOfQ(id)]) > 0));
/* a sentence built on a nought (0%, £0, 0 months) says nothing the visitor gave: it is dropped whole */
const ZERO_FIGURE = /(^|[^\d.,])0%|£0(?![\d,]|\.\d)|(^|[^\d.,])0(\.0)? (months?|sales|clients|customers)\b/;
const saysNothing = (text) => ZERO_FIGURE.test(String(text ?? ''));
function valueWord(id) {
  if (notGiven(id)) return '';
  if (id === 'cv') return state.cv ? 'Added' : ''; // the row said "CV CV": the pasted text itself is never printed
  if (id === 'software') { const names = Object.values(state.stackNames ?? {}).map((x) => String(x ?? '').trim()).filter(Boolean); if (names.length) return names.join(', '); }
  try { const w = M.answerWord?.(id); if (id === 'software' && typeof w === 'string' && /^(software\s*)?\d+$/i.test(w.trim())) return 'none'; if (typeof w === 'string' && w) return w; } catch (e) { /* the local form below */ }
  const key = keyOfQ(id);
  let v = state[key];
  if (id === 'retainer') v = state.retainerValue ?? state.price;
  if (id === 'capacity') v = state.capacity;
  if (id === 'spend') v = state.budget;
  if (id === 'enquiries') v = state.enquiries;
  if (id === 'channel') v = state.doing;
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '';
  if (typeof v === 'number') {
    if (MONEY_KEYS.has(key)) return gbp(v);
    if (TENS_KEYS.has(key)) return `${Math.round(v * 10)} in 10`;
    if (key === 'margin') return `${Math.round(v * 100)}p in the £1`;
    if (key === 'topShare') return `${Math.round(v)}%`;
    return count(v);
  }
  if (Array.isArray(v)) {
    if (id === 'lastFive') return v.map((x) => M.archetypes?.BIN_WORD?.[x?.bin] ?? x?.bin ?? '').filter(Boolean).join(', ');
    if (id === 'bestWorst') return `${gbp(v[0])} best, ${gbp(v[1])} worst`;
    return v.map((x) => M.DIST_BY?.[x]?.name ?? String(x)).join(', ');
  }
  if (typeof v === 'object') { if (id === 'software') return Object.values(state.stackNames ?? {}).filter(Boolean).join(', '); return ''; }
  return String(v);
}
function sourceOf(id) {
  try { const pt = (M.dataPoints?.() ?? []).find((x) => x.id === id); if (pt?.kind && pt.kind !== 'skip') return pt.kind; } catch (e) { /* below */ }
  if (state.notSure?.has?.(id)) return 'assumed';
  return 'you';
}
function insightOf(id) {
  if (notGiven(id)) return null;
  if (id === 'owed' && !(state.now && state.owed >= state.now / 30)) return null; // owed under a thirtieth of a month of revenue reads "0 months": no sentence
  const r = insightRaw(id);
  return r && !saysNothing(r.text) ? r : null;
}
function insightRaw(id) {
  let r = null;
  try { r = M.insightFor?.(id); } catch (e) { r = null; }
  if (!r) { try { r = M.schemaWord?.(id); } catch (e) { r = null; } }
  if (!r) return null;
  if (typeof r === 'string') return { text: clean(r), warn: false };
  if (r.text) return { text: clean(r.text), warn: !!r.warn };
  return null;
}
/** the section's leaves: one row per answered question, source dot and word, the insight under it */
function leavesHtml(sectionId) {
  const asked = new Set(state.asked ?? []);
  const ids = questionsOf(sectionId).filter((id) => asked.has(id) && !naHas(id));
  const rows = ids.map((id) => {
    let title = id;
    try { title = M.headline?.(id)?.title ?? id; } catch (e) { title = id; }
    const v = valueWord(id);
    const ins = insightOf(id);
    if (!v && !ins) return '';
    return `<div class="leaf-row"><div class="leaf-top"><span class="leaf-title">${esc(title)}</span>${v ? `<b class="tabular">${esc(v)}</b>` : ''}${v ? srcWord(sourceOf(id)) : ''}</div>${ins ? `<p class="insight${ins.warn ? ' warn' : ''}">${esc(ins.text)}</p>` : ''}</div>`;
  }).filter(Boolean);
  return rows.length ? `<div class="leaves">${rows.join('')}</div>` : '';
}
const vocabHtml = () => `<div class="vocab"><p class="eyebrow">The words</p>${VOCAB.map(([term, meaning]) => `<p><b>${esc(term)}</b>: ${esc(meaning)}</p>`).join('')}</div>`;

/* ---------- the cards (SPEC §10 table) ---------- */
function paintCard(id) {
  const p = plan();
  const card = cardEl();
  if (!card || !p) return;
  const s = sectionBy(id);
  const m = goalMonth();
  const r = rangeAt(m);
  const lim = limit();
  const lad = ladderNow();
  if (!lad) wantLadder(); // the answers changed at explore: ask for their ladder, and paint again when it lands
  const build = CARDS[id] ? CARDS[id]({ p, m, r, lim, lad, s }) : { title: s?.name ?? id, term: '', lines: [], body: '' };
  /* D6: headlines in title case, by (d)'s rule; a title that is the visitor's own words (the crown's business name) stays as typed */
  $('#card-title').textContent = build.asTyped ? build.title : titleCase(build.title);
  $('#card-title').style.setProperty('--hue', `var(${s?.hue ?? '--sec-crown'})`);
  /* C13, D3: a term the vocabulary holds is a button, and its one-line meaning opens under it; a repaint keeps it open */
  const meaning = build.term ? VOCAB_BY[build.term] : null;
  const defOpen = paintedId === id && !!$('#card-term-def') && !$('#card-term-def').hidden;
  $('#card-term').innerHTML = build.term ? `<i class="dot"></i>${meaning ? `<button type="button" class="term name" aria-expanded="${defOpen ? 'true' : 'false'}" aria-controls="card-term-def">${esc(build.term)}</button><p class="term-def small" id="card-term-def"${defOpen ? '' : ' hidden'}>${esc(cap(meaning))}</p>` : `<span class="name">${esc(build.term)}</span>`}` : '';
  /* six lines on a face at most; everything else is under the ▾ */
  $('#card-lines').innerHTML = build.lines.filter(Boolean).slice(0, 6).join('');
  const finish = $('#card-finish');
  if (finish) finish.hidden = !(id !== 'crown' && typeof M.reopen === 'function' && budsOf(id).length > 0);
  const body = $('#card-body'), more = $('#card-more');
  /* the vocabulary is defined once, on the first card opened: that is now always the crown (it opens by itself, fix 2 item 10),
     whose ▾ carries it, so no other card's ▾ is given a copy */
  const extra = build.body ?? '';
  /* a repaint of the card that is open (the ladder landing, a mode change) leaves an open ▾ open */
  const keepOpen = !!extra && paintedId === id && !body.hidden && more.getAttribute('aria-expanded') === 'true';
  paintedId = id;
  body.innerHTML = extra;
  bodyFill = build.onOpen ?? null;
  more.hidden = !extra;
  if (keepOpen) fillBody(body);
  else { feel.toggle(body, false, more, { silent: true, instant: true }); body.hidden = true; more.setAttribute('aria-expanded', 'false'); }
  /* U19: the term is said once, in the eyebrow. The tree's label said it a third time and stood on the limb; the open disc marks the limb. */
  try { tree()?.setLabel?.(partOf(id), ''); } catch (e) { /* optional */ }
  if (build.after) build.after(card);
}
/* What a ▾ holds may need measuring to be drawn: the Reach map picks its form from the width of its host, and a hidden host
   has none. So it is drawn when the ▾ opens: the body is laid out for the length of the call, before feel.toggle measures the
   height it opens to (fix 2, item 11). */
let bodyFill = null, paintedId = null;
function fillBody(body) {
  if (!bodyFill || !body) return;
  const was = body.hidden;
  body.hidden = false;
  try { bodyFill(cardEl()); } catch (e) { /* the rest of the ▾ still opens */ }
  body.hidden = was;
}

/* ---------- the growth spend the visitor gave, and the ladder's words (C37, C38, C32, C18) ---------- */
/** C37: "you said £X" is printed only for a budget the visitor typed; the engine's default rule is called Mercer's default */
const budgetSaid = () => state.budget !== null && state.budget !== undefined && !noSpend() && inputRow('budget')?.from === 'you';
const budgetNote = (own) => (budgetSaid() ? `you said ${gbp(own)}` : `Mercer’s default is ${gbp(own)}`);
const ownBudgetLead = (own) => (budgetSaid() ? 'On your own budget' : `At ${gbp(own)} a month`);
/** the middle run no budget lifts: the highest middle run among the ladder's own rungs at the chosen month. (d)'s
    noBudget.ceiling can be a constraint's twelve-month total (C32), which is not what "caps the middle run at" says. */
const noBudgetCap = (lad, m) => { const tops = (lad?.rungs ?? []).map((x) => x?.p50?.[m - 1]).filter(Number.isFinite); return tops.length ? Math.max(...tops) : lad?.noBudget?.ceiling ?? null; };
/** why a rung could not place all of its budget, from the rung's own plan in the page's words; the engine's own reason text
    (unspentReason) never reaches the page (C18) */
const rungWhy = (rung) => (rung?.binding && LIMIT_PHRASE[rung.binding] ? `${cap(limitPhrase(rung.binding, rung.bindsAtMonth ? monthName(rung.bindsAtMonth) : null, null))}.` : '');
/** the path's sentences, shared by the card, the markdown and the PDF so the three agree */
function pathWords(p, lad, m) {
  const when = monthName(m);
  const own = p.budget;
  const out = { lead: '', month: '', funnel: '', room: '', unplaced: '' };
  if (!lad) return out;
  const targeted = basis() === 'revenue' && state.goal && !noSpend();
  if (!targeted) return out;
  /* D3: on course is a statement about the base assumptions, not a count of runs that reached the target */
  if (lad.onCourse) { out.lead = `On course at ${gbp(own)} a month: the base assumptions reach ${gbp(state.goal)} by ${when}.`; return out; }
  if (lad.bStar) out.lead = `Spend ${gbp(lad.bStar)} a month on growth (${budgetNote(own)}).`;
  /* no verb hangs on the limit's name, so a plural name ("your prospects") reads right (C22) */
  else if (lad.noBudget) { const top = noBudgetCap(lad, m); out.lead = `No budget reaches ${gbp(state.goal)} by ${when}: the middle run tops out${top !== null ? ` at ${gbp(near(top))}` : ''}, held by ${midWords(binderWords(lad.noBudget))}.`; }
  out.month = lad.monthP50 ? `${ownBudgetLead(own)} the middle run reaches ${gbp(state.goal)} in month ${lad.monthP50}.` : `${ownBudgetLead(own)}, not inside twelve months.`;
  out.funnel = funnelWords(lad.funnel);
  out.room = lad.capacityCheck ? roomWords(roomCheck(p, state.goal)) : '';
  if (lad.bStarRung?.unspent > 0) out.unplaced = `Mercer could not place ${gbp(lad.bStarRung.unspent)} of it.${rungWhy(lad.bStarRung) ? ` ${rungWhy(lad.bStarRung)}` : ''}`;
  return out;
}
/** the first limit in four words for the crown's row (no verb under a plural short name, D2) */
const limitRow = (lim) => (lim.type === 'market_depletion' ? `Prospects run out ${lim.bindsAtMonth ? monthShortYear(lim.bindsAtMonth) : 'now'}` : `${lim.short}, ${lim.bindsAtMonth ? `from ${monthShortYear(lim.bindsAtMonth)}` : 'now'}`);

/* ============ Refine 1, R17 and R18: the founder and the control profiles ============
   Both come from (e)'s M.founderProfile() and M.controlProfile(): plain objects { current, intended, risks[], actions[] } built
   from the visitor's own answers. Nothing here is a forecast figure and nothing here is inferred about a person: the blocks say
   so. The readers below take the shapes such an object can arrive in (a string, a list, a keyed object) and return null when
   there is nothing to say, so a block with no answers is absent, never empty. */
const strOf = (x) => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : x && typeof x === 'object' && !Array.isArray(x) ? String(x.text ?? x.words ?? x.title ?? x.label ?? x.name ?? x.action ?? x.role ?? '') : '');
const listOf = (x) => (Array.isArray(x) ? x : x === null || x === undefined || x === '' ? [] : [x]).map((i) => clean(strOf(i)).trim()).filter(Boolean);
const uniq = (arr) => [...new Set(arr)];
/** the governance and founder actions, in the order (e) gives them (an `order` or `rank` field, else the list's own order) */
const actionsOf = (x) => (Array.isArray(x) ? x : []).map((a, i) => ({ text: clean(strOf(a)).trim(), why: clean(a && typeof a === 'object' ? String(a.why ?? a.because ?? '') : '').trim(), at: Number.isFinite(a?.order) ? a.order : Number.isFinite(a?.rank) ? a.rank : i + 1 }))
  .filter((a) => a.text).sort((a, b) => a.at - b.at).map((a, i) => ({ order: i + 1, text: a.text, why: a.why }));
const callProfile = (name) => { try { const v = typeof M[name] === 'function' ? M[name]() : null; return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };

function founderView() {
  const f = callProfile('founderProfile');
  if (!f) return null;
  const rows = [
    ['Keep owning', listOf(f.keep ?? f.keepOwning ?? f.own ?? f.intended?.keep ?? f.current?.keep)],
    ['Delegate, automate or document', listOf(f.delegate ?? f.handOver ?? f.release ?? f.intended?.delegate)],
    ['Where a complementary operator helps', listOf(f.operator ?? f.complement ?? f.intended?.operator)],
    ['Dependency risk', uniq([...listOf(f.dependency), ...listOf(f.risks)])],
    ['Hours against the target', listOf(f.hours ?? f.time ?? f.intended?.hours)],
  ].filter(([, v]) => v.length).map(([label, items]) => ({ label, items }));
  const role = { now: listOf(f.current)[0] ?? '', intended: listOf(f.intended)[0] ?? '' };
  const actions = actionsOf(f.actions);
  if (!rows.length && !role.now && !role.intended && !actions.length) return null;
  return { selfReported: true, role, rows, actions };
}

/* the five decisions of the decision-rights map, and the three holders; a holder is one flat mark */
const DECISIONS = [['pricing', 'Pricing'], ['hiring', 'Hiring'], ['spending', 'Spending'], ['strategy', 'Strategy'], ['clientWork', 'Client work']];
const WHO_WORD = { you: 'You decide', shared: 'Shared', team: 'Team decides' };
const decisionKey = (k) => { const t = String(k ?? '').toLowerCase().replace(/[^a-z]/g, ''); return t.startsWith('pric') ? 'pricing' : t.startsWith('hir') ? 'hiring' : t.startsWith('spend') ? 'spending' : t.startsWith('strat') ? 'strategy' : t.startsWith('client') || t.startsWith('deliver') ? 'clientWork' : null; };
const whoOf = (v) => { const t = String(strOf(v) || v || '').toLowerCase(); if (/shar|joint|together|both/.test(t)) return 'shared'; if (/team|system|staff|deleg|manager|someone|other/.test(t)) return 'team'; if (/\byou\b|\bme\b|\bi\b|founder|owner|self|mine|keep|retain/.test(t)) return 'you'; return null; };
/** a decision-rights map from any of: { pricing: 'you' }, { you: ['pricing'] }, [{ id, who }], or one of those under .rights /
    .decisionRights / .decisions. null when no decision is placed. */
function rightsOf(x) {
  if (!x || typeof x !== 'object') return null;
  const src = x.rights ?? x.decisionRights ?? x.decisions ?? x;
  const out = {};
  const put = (k, v) => { const d = decisionKey(k), w = whoOf(v); if (d && w) out[d] = w; };
  if (Array.isArray(src)) src.forEach((row) => { if (row && typeof row === 'object') put(row.id ?? row.decision ?? row.key ?? row.name, row.who ?? row.holder ?? row.value ?? row.bin ?? row.zone); });
  else if (src && typeof src === 'object') Object.entries(src).forEach(([k, v]) => {
    const asList = v instanceof Set ? [...v] : Array.isArray(v) ? v : null;
    if (asList && whoOf(k)) asList.forEach((d) => put(strOf(d) || d, k)); // { you: ['pricing', ...] }
    else put(k, v); // { pricing: 'you' }
  });
  return Object.keys(out).length ? out : null;
}
const PRO_LINE = 'Ownership, employment, tax and shareholder rights are for a solicitor or accountant to review.';
function controlView() {
  const c = callProfile('controlProfile');
  if (!c) return null;
  const now = rightsOf(c.current), next = rightsOf(c.intended);
  const map = now || next ? DECISIONS.map(([id, name]) => ({ id, decision: name, now: now?.[id] ?? null, intended: next?.[id] ?? null, moves: !!(now?.[id] && next?.[id] && now[id] !== next[id]) })).filter((r) => r.now || r.intended) : [];
  const words = { now: listOf(c.current?.words ?? c.current?.summary ?? (typeof c.current === 'string' ? c.current : null)), intended: listOf(c.intended?.words ?? c.intended?.summary ?? (typeof c.intended === 'string' ? c.intended : null)) };
  const risks = uniq([...listOf(c.dependency ?? c.warning), ...listOf(c.risks)]);
  const actions = actionsOf(c.actions);
  if (!map.length && !risks.length && !actions.length && !words.now.length && !words.intended.length) return null;
  return { selfReported: true, map, words, warning: risks[0] ?? '', risks: risks.slice(1), actions, professional: typeof c.review === 'string' && c.review.trim() ? clean(c.review).trim() : PRO_LINE };
}
/** the actions that come from the founder and control answers, kept apart from the forecast's ranked steps (R19) */
const ANSWER_ACTIONS = 'From your answers, not the forecast';
function answerActions() {
  const f = founderView(), c = controlView();
  return [...(f?.actions ?? []).map((a) => ({ ...a, from: 'Founder' })), ...(c?.actions ?? []).map((a) => ({ ...a, from: 'Control' }))];
}
const actionsHtml = (list) => (list.length ? `<div class="answer-actions"><p class="eyebrow">${esc(ANSWER_ACTIONS)}</p><ol>${list.map((a) => `<li>${esc(a.text)}${a.why ? ` <span class="small">${esc(a.why)}</span>` : ''}</li>`).join('')}</ol></div>` : '');
const SELF_LINE = 'From what you said about yourself. Mercer infers nothing about a person.';
function founderHtml() {
  const f = founderView();
  if (!f) return '';
  const role = f.role.now || f.role.intended ? `<p class="founder-role">${f.role.now ? `Role now: ${esc(f.role.now)}` : ''}${f.role.now && f.role.intended ? '. ' : ''}${f.role.intended ? `Intended: ${esc(f.role.intended)}` : ''}.</p>` : '';
  return `<div class="founder" id="founder-block"><p class="eyebrow">Founder</p>${role}${f.rows.map((r) => `<div class="founder-row"><p class="founder-label">${esc(r.label)}</p>${r.items.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`).join('')}${actionsHtml(f.actions)}<p class="small">${esc(SELF_LINE)}</p></div>`;
}
/** the decision-rights map: a table of flat marks, two columns over the five decisions; a decision that moves wears the card's hue */
const markHtml = (who) => (who ? `<i class="mark" data-who="${who}" aria-hidden="true"></i><span class="sr-only">${esc(WHO_WORD[who])}</span>` : '<span class="sr-only">Not said</span>');
const rightsHtml = (map) => (map.length ? `<table class="rights"><caption class="small"><i class="mark" data-who="you" aria-hidden="true"></i> you decide <i class="mark" data-who="shared" aria-hidden="true"></i> shared <i class="mark" data-who="team" aria-hidden="true"></i> team decides</caption><thead><tr><th scope="col">Decision</th><th scope="col">Now</th><th scope="col">Intended</th></tr></thead><tbody>${map.map((r) => `<tr${r.moves ? ' data-moves="true"' : ''}><th scope="row">${esc(r.decision)}</th><td>${markHtml(r.now)}</td><td>${markHtml(r.intended)}</td></tr>`).join('')}</tbody></table>` : '');
/** the same two profiles as lines of text, for the markdown, the PDF and the briefing */
function profileLines() {
  const f = founderView(), c = controlView();
  const founder = f ? [f.role.now ? `Role now: ${f.role.now}.` : '', f.role.intended ? `Intended role: ${f.role.intended}.` : '', ...f.rows.map((r) => `${r.label}: ${r.items.join('; ')}`)].filter(Boolean) : [];
  const control = c ? [...c.map.map((r) => `${r.decision}: now ${r.now ? WHO_WORD[r.now].toLowerCase() : 'not said'}; intended ${r.intended ? WHO_WORD[r.intended].toLowerCase() : 'not said'}${r.moves ? ' (moves)' : ''}.`), ...c.words.now.map((t) => `Now: ${t}`), ...c.words.intended.map((t) => `Intended: ${t}`), c.warning ? `Dependency: ${c.warning}` : '', ...c.risks.map((t) => `Risk: ${t}`)].filter(Boolean) : [];
  return { founder, control, actions: answerActions().map((a) => `${a.from}, ${a.order}: ${a.text}${a.why ? ` ${a.why}` : ''}`) };
}

const CARDS = {
  /* U18: the crown's face is the answer laid out, not a paragraph about it: the range as the figure, the odds in one line, the
     chosen level beside it (D4), then the first limit and the first step as two rows in their limbs' hues that fly to those
     limbs. The one sentence, the wider range, the two ratios, the full-size Core, the vocabulary and the months are under ▾. */
  crown({ p, m, r, lim }) {
    const when = monthShortYear(m);
    /* Task 31 and 34: the figure wears its mode label, and the words under it name the assumption sets, never a frequency */
    const lines = [`<div class="crown-head"><p class="crown-fig tabular">${esc(kg(r.p25, 'down'))} to ${esc(kg(r.p75, 'up'))}</p><p class="small">a month by ${esc(when)}, ${esc(SPREAD_WORD)} ${modeChip(planObj().plan)}</p></div>`];
    if (noSpend()) lines.push(line('No growth spend: revenue is carried flat.'));
    else if (basis() === 'revenue' && state.goal) { const gap = r.p75 - state.goal; lines.push(line(gap >= 0 ? `The ${gbp(state.goal)} target sits inside that range.` : `The favourable end is ${gbp(Math.abs(gap))} short of the ${gbp(state.goal)} target.`)); }
    else { const lo = r.p25 - p.base, hi = r.p75 - p.base; lines.push(line(hi <= 0 ? `${gbp(p.budget)} a month of growth spend adds nothing by ${esc(when)}.` : `${gbp(p.budget)} a month of growth spend adds <b class="tabular">${lo > 0 ? `${gbp(down(lo))} to ${gbp(up(hi))}` : `up to ${gbp(up(hi))}`}</b> a month.`)); }
    const lvl = levelLine(false);
    if (lvl) lines.push(line(esc(lvl)));
    const jump = (term, text, sec) => `<button type="button" class="jump" data-open="${esc(sec)}" style="--hue:var(${sectionBy(sec)?.hue ?? '--sec-crown'})"><i class="dot"></i><span class="jump-term">${esc(term)}</span><span class="jump-text">${esc(text)}</span></button>`;
    lines.push(lim ? jump('First limit', limitRow(lim), lim.section) : line(esc(`First limit: ${noLimitWords()}`)));
    const top = steps()[0] ?? null;
    lines.push(top ? jump('Return rank 1', top.title, SECTION_OF_DRIVER[top.driver] ?? 'reach') : line('No step moves the middle run by 2% or more.'));
    const more = [`<p class="sentence">${esc(diagnosis())}</p>`, line(`The wider scenario range is <b class="tabular">${gbp(down(r.p10))} to ${gbp(up(r.p90))}</b> a month. <span class="small">${esc(SETS_LINE)}</span>`), line(`<span class="small">${esc(EXCLUDED_LINE)}</span>`)];
    const rp = noSpend() ? null : returnPerPound();
    /* U18: "Return per £ £7.6" read as two pound signs; the figure leads and the term follows. U1: nothing is built on a nought. */
    if (rp !== null && rp >= 0.005) more.push(line(`<b class="tabular">£${rp.toFixed(2)}</b> of added revenue for each £1 of growth spend <span class="small">Return per £</span>`));
    if (p.inaction?.p50 !== undefined && near(p.inaction.p50) > 0) more.push(line(`<b class="tabular">${gbp(near(p.inaction.p50))}</b> <span class="small">Cost of waiting</span>`));
    const s0 = (p.sensitivity ?? [])[0];
    { const sw = s0 ? sensitivityWords(s0.inputId, s0.elasticity, p) : ''; if (sw) more.push(line(`${esc(sw)} <span class="small">Moves most</span>`)); }
    const chart =`<div class="core-full veil" id="core-full" role="img" aria-label="The scenarios for ${esc(when)}, from ${runsWord()} runs of the model"></div>`;
    const table = `<table class="months"><thead><tr><th>Month</th><th>Downside</th><th>Base</th><th>Favourable</th></tr></thead><tbody>${p.months.map((s, i) => `<tr${i + 1 === m ? ' class="on"' : ''}><td>${esc(monthShortYear(i + 1))}</td><td>${gbp(qAt(s, 0.1))}</td><td>${gbp(qAt(s, 0.5))}</td><td>${gbp(qAt(s, 0.9))}</td></tr>`).join('')}</tbody></table>`;
    /* D3: the vocabulary sits above the month table. The Core is drawn when the ▾ opens: a hidden host has no width. */
    return { title: `${bizName()}, ${when}`, asTyped: true, term: 'Scenario range', lines, body:`${more.join('')}${chart}${methodHtml()}${vocabHtml()}${table}<p class="replay"><button type="button" class="glass small" id="cut-replay">Play again</button></p>`, after: (card) => {
      $('#cut-replay')?.addEventListener('click', () => { feel.play('tap', { x: feel.x($('#cut-replay')) }); replay(); });
      $$('.jump', card).forEach((b) => b.addEventListener('click', () => { feel.play('discopen', { x: feel.x(b) }); openCard(b.dataset.open); }));
    }, onOpen: () => {
      const host = $('#core-full');
      if (host) { try { coreFn()(host, r.sorted, { axis: true, labels: true, now: p.base, goal: basis() === 'revenue' && !noSpend() ? state.goal : null, month: when }); } catch (e) { /* the frame alone */ } }
    } };
  },
  you({ p, m, lad }) {
    const lines = [];
    const when = monthName(m);
    const own = p.budget;
    const more = [];
    /* U1: at None there is no spend to speak of, so no sentence is built on £0 */
    if (noSpend()) lines.push(line('No growth spend: revenue is carried flat. The dial shows what each level reaches.', 'lead'));
    else if (!lad) lines.push(line('Working out the path to your target.', 'small'));
    else if (basis() === 'revenue' && state.goal) {
      /* one set of sentences for the card and both exports (C37: the default is not "you said"; C38: the limit by name;
         C22: the middle run; C24: "1 more sale"; C34: a total against a total) */
      const w = pathWords(p, lad, m);
      if (w.lead) lines.push(line(esc(w.lead), 'lead'));
      if (w.month) lines.push(line(esc(w.month)));
      if (w.funnel) lines.push(line(esc(w.funnel)));
      if (w.room) lines.push(line(esc(w.room)));
      if (w.unplaced) more.push(line(esc(w.unplaced)));
    } else lines.push(line(`${gbp(own)} a month buys ${(() => { const rr = rangeAt(m, p); const lo = rr.p25 - p.base, hi = rr.p75 - p.base; return hi <= 0 ? 'nothing' : lo > 0 ? `+${gbp(down(lo))} to +${gbp(up(hi))}` : `up to +${gbp(up(hi))}`; })()} more a month by ${esc(when)}.`, 'lead'));
    lines.push(`<div class="path" id="path"><div class="dial-host" id="dial-host"></div><div class="ladder" id="ladder"></div></div>`);
    lines.push(line('Maximum cannot lengthen the run past twelve months or add routes.', 'small'));
    /* D3: what each step adds in pounds is said here, under the ▾, with the run it is measured on */
    const stepsHtml = steps().map((s) => `<p class="step">${esc(stepLine(s))}</p>`).join('');
    const body = `${more.join('')}<div class="steps">${stepsHtml ? `${stepsHtml}${rangeNoteHtml()}` : '<p class="small">No step moves the middle run by 2% or more.</p>'}</div>${founderHtml()}${agentHtml()}${leavesHtml('you')}`;
    /* the face holds no rank (the ranked steps are under the ▾), so the eyebrow is the section's own name, as in the interview */
    return { title: 'Path to target', term: sectionBy('you')?.name ?? 'You', lines, body, after: (card) => { mountDial(); paintLadder(); bindAgent(card, () => { if (openId === 'you') paintCard('you'); }); } };
  },
  /* Refine 1, R18: who decides now and who is meant to, from the visitor's own answers. The face is the dependency warning, the
     decision-rights map and the first governance action; the rest of the actions, in order, sit under ▾ apart from the forecast's
     steps. No legal conclusion is drawn: the last line on the face sends ownership, employment, tax and shareholder rights to a
     professional. The card exists only when controlView() has something to say (discOrder). */
  control() {
    const c = controlView();
    const lines = [];
    if (!c) return { title: 'Control', term: '', lines: [line('No answers here yet.', 'small')], body: leavesHtml('control') };
    lines.push(line(esc(c.warning || 'Who decides now, and who you intend to decide.'), 'lead'));
    if (c.map.length) lines.push(rightsHtml(c.map));
    if (c.actions[0]) lines.push(line(`First: ${esc(c.actions[0].text)}`));
    lines.push(line(esc(c.professional), 'small'));
    const more = [...c.words.now.map((t) => line(`Now: ${esc(t)}`)), ...c.words.intended.map((t) => line(`Intended: ${esc(t)}`)), ...c.risks.map((t) => line(esc(t)))].join('');
    return { title: 'Control', term: sectionBy('control')?.name ?? 'Control', lines, body: `${more}${actionsHtml(c.actions)}<p class="small">${esc(SELF_LINE)}</p>${leavesHtml('control')}` };
  },
  offer({ p, lim }) {
    const lines = [];
    const sens = p.sensitivity?.[0];
    const acv = (p.sensitivity ?? []).find((x) => x.inputId === 'acv');
    const st = rankOf('Raise your price');
    /* U19: the eyebrow says the term once and the sentence under it does not say it again; it names a term only when the face holds its line */
    const term = sens?.inputId === 'acv' ? 'Moves most' : st ? 'Return rank' : '';
    { const sw = acv ? sensitivityWords('acv', acv.elasticity, p) : ''; if (sw) lines.push(line(esc(sens?.inputId === 'acv' ? `${sw} No other input moves it more.` : sw), 'lead')); }
    lines.push(figLine('Sale value', inputRow('price')));
    if (st) lines.push(line(esc(stepFace(st, term))));
    const held = st?.restraint ?? limitWords(lim);
    if (held) lines.push(line(`Restraint: ${esc(held)}.`));
    return { title: 'The offer', term, lines, body: `${stepMore(st)}${leavesHtml('offer')}` };
  },
  reach({ p, lim }) {
    const lines = [];
    /* the eyebrow names a term only when the face holds its line: the first limit when prospects are it, Moves most when the
       count of prospects tops the engine's sensitivity list */
    const s0 = p.sensitivity?.[0];
    const term = lim?.type === 'market_depletion' ? 'First limit' : s0?.inputId === 'addressableCount' && sensitivityWords('addressableCount', s0.elasticity, p) ? 'Moves most' : '';
    if (term === 'First limit') lines.push(line(`${esc(cap(limitWords(lim)))}.`, 'lead'));
    else if (term === 'Moves most') { const sw = sensitivityWords('addressableCount', s0.elasticity, p); if (sw) lines.push(line(esc(`${sw} No other input moves it more.`), 'lead')); }
    lines.push(figLine('Prospects', inputRow('market')));
    if (!notGiven('listSize')) lines.push(line(`Contacts <b class="tabular">${count(state.listSize)}</b> ${srcWord('you')}`));
    if (!notGiven('network')) lines.push(line(`Network <b class="tabular">${count(state.network)}</b> ${srcWord('you')}`));
    lines.push(line(esc(competitorsLine())));
    const w = weather();
    if (w.rule) lines.push(line(esc(w.rule.text), 'weather-rule'));
    /* fix 2, item 11: the face is the six lines above and stays inside the clearing. The map and its figures, the weather rows
       and the leaves sit under ▾, in that order; the map is drawn when the ▾ opens, at the width it is then given. */
    const body = `<div class="map-host" id="map-host"></div>${weatherHtml(w)}${leavesHtml('reach')}`;
    return { title: 'Reach', term, lines, body, onOpen: () => {
      const host = $('#map-host');
      if (!host) return;
      const physical = (() => { try { return !!M.isPhysical?.(); } catch (e) { return false; } })();
      try { if (physical) M.paintMap(host); else M.paintWorld(host); } catch (e) { host.innerHTML = ''; }
    } };
  },
  routes({ p }) {
    const lines = [];
    const alloc = p.allocation ?? [];
    const totals = {};
    alloc.forEach((mo) => (mo.byChannel ?? []).forEach((c) => { totals[c.channel] = (totals[c.channel] ?? 0) + c.spend; }));
    const months = Math.max(1, alloc.length);
    const funded = Object.entries(totals).map(([ch, sum]) => ({ ch, avg: sum / months })).filter((x) => x.avg >= 1).sort((a, b) => b.avg - a.avg);
    const maxAvg = Math.max(1, ...funded.map((x) => x.avg));
    const WARM = new Set(['referral', 'partnerships']);
    if (funded.length) {
      lines.push(`<div class="routes-bars">${funded.map((x) => `<div class="route-bar" data-side="${WARM.has(x.ch) ? 'warm' : 'cold'}"><span class="route-name">${esc(M.CHANNEL_NAME?.[x.ch] ?? x.ch)}</span><i style="--w:${Math.round((x.avg / maxAvg) * 100)}%"></i><b class="tabular">${gbp(near(x.avg))}</b></div>`).join('')}</div>`);
      lines.push(line(`Warm routes take ${pct(warmShare(alloc))} of the plan’s spend.`, 'lead'));
    } else lines.push(line('No spend is placed on any route.', 'lead'));
    /* the eyebrow's term has its figure on the face: what each pound of growth spend adds, from the plan's own sums */
    const rp = noSpend() ? null : returnPerPound();
    const hasRp = rp !== null && rp >= 0.005;
    if (hasRp) lines.push(line(`<b class="tabular">£${rp.toFixed(2)}</b> of added revenue for each £1 of growth spend, over twelve months.`));
    const engineSet = new Set(p.channels ?? []);
    const unforecast = (state.doing ?? []).filter((id) => { const e = M.DIST_BY?.[id]?.engine; return !e || !engineSet.has(e); }).map((id) => M.DIST_BY?.[id]?.name ?? id);
    if (unforecast.length) lines.push(line(`Routes you run that Mercer does not forecast: ${esc(unforecast.join(', '))}. They go to the call.`));
    return { title: 'Routes in', term: hasRp ? 'Return per £' : '', lines, body: leavesHtml('routes') };
  },
  close({ p }) {
    const lines = [];
    const sc = (p.sensitivity ?? []).find((x) => x.inputId === 'statedCloseRate');
    const e = sc ? sc.elasticity : closeElasticity(p);
    { const sw = e !== null && e !== undefined ? sensitivityWords('statedCloseRate', e, p) : ''; if (sw) lines.push(line(esc(state.closeRate !== null && state.closeRate !== undefined ? sw : sw.replace('your close rate', 'the close rate Mercer used')), 'lead')); }
    lines.push(figLine('Close rate', inputRow('close')));
    lines.push(figLine('First sale', inputRow('cycle')));
    const st = rankOf('Close more enquiries');
    const term = p.sensitivity?.[0]?.inputId === 'statedCloseRate' ? 'Moves most' : st ? 'Return rank' : '';
    if (st) lines.push(line(esc(stepFace(st, term))));
    if (st?.restraint) lines.push(line(`Restraint: ${esc(st.restraint)}.`));
    return { title: 'The close', term, lines, body: `${stepMore(st)}${leavesHtml('close')}` };
  },
  delivery({ p, lim }) {
    const lines = [];
    const st = rankOf('Add one person') ?? rankOf('Deliver more per person');
    const term = lim?.type === 'client_capacity' ? 'First limit' : st ? 'Return rank' : '';
    if (lim?.type === 'client_capacity') lines.push(line(`${esc(cap(limitWords(lim)))}.`, 'lead'));
    const peak = peakOf(p);
    const knee = (p.constraints ?? []).find((c) => c.type === 'client_capacity')?.diagnostics?.utilisationKnee;
    if (peak !== undefined) lines.push(line(`At your busiest you are ${Math.round(peak * 100)}% full${knee ? `; past ${Math.round(knee * 100)}% waits cost sales` : ''}.`));
    lines.push(figLine('Capacity', inputRow('capacity')));
    if (st) lines.push(line(esc(stepFace(st, term))));
    if (st?.restraint) lines.push(line(`Restraint: ${esc(st.restraint)}.`));
    return { title: 'Delivery', term, lines, body: `${stepMore(st)}${leavesHtml('delivery')}` };
  },
  money({ p, m, r }) {
    const lines = [];
    lines.push(line(`Kept at ${esc(monthShortYear(m))}: <b class="tabular">${gbp(near(r.p50 * p.margin))}</b> a month <span class="small">(middle run times margin)</span>`, 'lead'));
    /* C24: "1 month", never "1 months"; U1: no sentence on a nought */
    const pb = p.payback?.p50 !== undefined && Number.isFinite(p.payback.p50) ? oneDp(p.payback.p50) : null;
    if (pb !== null && pb !== '0') lines.push(line(`Pays back in <b class="tabular">${pb}</b> ${pb === '1' ? 'month' : 'months'}.`));
    if (near(p.unspent ?? 0) > 0) lines.push(line(`Held back: ${gbp(near(p.unspent))} the plan could not place.`));
    const fund = insightOf('funding');
    if (fund) lines.push(line(esc(fund.text)));
    /* C11: the free tools are said on the face, for everyone, and listed under the ▾ */
    const tools = freeTools();
    if (tools) lines.push(line(esc(tools.face)));
    return { title: 'Money', term: 'Pays back', lines, body: `${freeToolsHtml(tools)}${leavesHtml('money')}` };
  },
  clients() {
    const lines = [];
    const l5 = insightOf('lastFive');
    if (l5) lines.push(line(esc(l5.text), 'lead'));
    const ts = insightOf('topShare');
    if (ts) lines.push(line(esc(ts.text)));
    const rep = inputRow('repeat'), stay = inputRow('retention');
    const figs = [rep && rep.from !== 'empty' ? figLine('Repeat rate', rep) : '', stay ? figLine('Customer lifespan', stay) : ''].filter(Boolean);
    /* six lines on the face: the two insights, the 80/20 lines that fit, this limb's step, the two figures; the other 80/20
       lines lead the ▾. The eyebrow names Return rank only when the face holds a rank. */
    const st = rankOf('Keep customers longer');
    const advice = eightyTwenty();
    const fit = Math.max(0, 6 - lines.length - figs.length - (st ? 1 : 0));
    advice.slice(0, fit).forEach((t) => lines.push(line(esc(t))));
    if (st) lines.push(line(esc(stepFace(st, 'Return rank'))));
    figs.forEach((f) => lines.push(f));
    const rest = advice.slice(fit).map((t) => line(esc(t))).join('');
    return { title: 'Best clients', term: st ? 'Return rank' : '', lines, body: `${rest}${stepMore(st)}${leavesHtml('clients')}` };
  },
  ground() {
    const lines = [];
    let counts = { you: 0, sector: 0, web: 0, assumed: 0 };
    try { counts = M.rootCounts?.(M.dataPoints?.() ?? []) ?? counts; } catch (e) { /* zeros */ }
    const own = counts.you + counts.web, all = own + counts.sector + counts.assumed;
    let bi = null;
    try { bi = M.branchInsight?.('roots'); } catch (e) { bi = null; }
    lines.push(line(esc(clean(bi || (all && own / all >= 0.5 ? 'The tree stands mostly on your own answers.' : 'The tree stands mostly on Mercer’s estimates for now.'))), 'lead'));
    const max = Math.max(1, ...Object.values(counts));
    lines.push(`<div class="roots-bars">${[['you', 'your answers'], ['web', 'what you imported'], ['sector', 'your industry'], ['assumed', 'Mercer’s estimates']].map(([k, w]) => `<div class="root-bar" data-from="${k}"><span class="src" data-from="${k}">${w}</span><i style="--w:${Math.round((counts[k] / max) * 100)}%"></i></div>`).join('')}</div>`);
    const gi = insightOf('network') ?? insightOf('funding');
    if (gi) lines.push(line(esc(gi.text)));
    const went = inputs().map((x) => `<div class="leaf-row"><div class="leaf-top"><span class="leaf-title">${esc(x.label)}</span><b class="tabular">${esc(x.value)}</b>${srcWord(x.from)}</div></div>`).join('');
    return { title: 'Ground', term: 'What went in', lines, body: `<div class="leaves">${went}</div>${leavesHtml('ground')}` };
  },
};

/* ---------- the close rate's pull when the engine's sensitivity list leaves it out (the visitor said Not sure, so it is not a
   stated input): two engine runs, at the rate the plan used and at 10% more, the middle run at the goal month compared. They run
   after the card has painted, cached by the answers' key; the card repaints once when the figure lands (fix 1, item 23). ---------- */
let closeCache = { key: null, e: null, pending: false };
function closeElasticity(p) {
  const key = safeKey();
  if (closeCache.key === key) return closeCache.pending ? null : closeCache.e;
  closeCache = { key, e: null, pending: true };
  const done = (e) => { if (closeCache.key !== key) return; closeCache = { key, e, pending: false }; if (e !== null && openId === 'close') paintCard('close'); };
  const rate = p.close;
  if (!rate || typeof E?.plan !== 'function' || typeof M.askOf !== 'function') { done(null); return null; }
  const m = goalMonth();
  const more = Math.min(0.95, rate * 1.1);
  const mid = (over) => { const out = engineRun(() => E.plan(M.askOf(over), new Date().toISOString()), 'plan'); return qAt(out.months[m - 1], 0.5); };
  setTimeout(() => {
    let a = null;
    try { a = mid({ closeRate: rate }); } catch (err) { done(null); return; }
    setTimeout(() => {
      try { const b = mid({ closeRate: more }); done(a > 0 && more > rate ? (b / a - 1) / (more / rate - 1) : null); } catch (err) { done(null); }
    }, 30);
  }, 320);
  return null;
}

/* ---------- 80/20 advice (SPEC §10) ---------- */
function eightyTwenty() {
  const p = plan();
  const out = [];
  if (!p) return out;
  const l5 = Array.isArray(state.lastFive) && state.lastFive.length === 5 && state.lastFive.every((x) => x?.bin) ? state.lastFive : null;
  const ws = warmShare(p.allocation);
  const routes = [];
  if (l5) {
    const warm = l5.filter((x) => x.bin === 'warm11' || x.bin === 'warm1m').length;
    if (warm >= 3 && 1 - ws >= 0.6) out.push(`${warm} of your best five came warm and the plan spends ${pct(1 - ws)} cold: put the warm routes first; Mercer cannot model most of them, so the call does.`);
    if (warm <= 1) { const top = Object.entries((p.allocation ?? []).reduce((acc, mo) => { (mo.byChannel ?? []).forEach((c) => { acc[c.channel] = (acc[c.channel] ?? 0) + c.spend; }); return acc; }, {})).sort((a, b) => b[1] - a[1])[0]; if (top) out.push(`Your best clients came cold: the plan’s ${lc(M.CHANNEL_NAME?.[top[0]] ?? top[0])} matches how you already win.`); }
    const chans = new Set(p.channels ?? []);
    const seen = new Set();
    l5.map((x) => x.route).filter((r) => r && r !== 'other').forEach((r) => {
      if (seen.has(r)) return; seen.add(r);
      const e = M.DIST_BY?.[r]?.engine; const name = M.DIST_BY?.[r]?.name ?? r;
      if (!e) return;
      /* C25: Mercer funds nothing, and the list of routes is not a check on spend: the forecast runs a route or it does not */
      routes.push(chans.has(e) ? `Mercer’s forecast already runs ${lc(name)}.` : `Mercer’s forecast does not run ${lc(name)} yet: raise it on the call.`);
    });
  }
  if (!notGiven('topShare') && state.now) {
    if (state.topShare >= 50) { const lost = (state.now * state.topShare) / 300; const months = p.added?.p50 > 0 ? lost / (p.added.p50 / 12) : null; out.push(`Three clients are ${Math.round(state.topShare)}% of revenue: losing one is about ${gbp(near(lost))} a month${months !== null && oneDp(months) !== '0' ? `, ${pluralDp(months, 'month', 'months')} of the plan’s added revenue` : ''}.`); }
    /* C41: a top three under a quarter proves only that no one client is a quarter; "a tenth" was a figure no answer gave */
    if (state.topShare < 25) out.push('No client is as much as a quarter of revenue: growth comes from more clients, so capacity is the figure to watch.');
  }
  if (state.tracking === 'guess' || state.tracking === 'no') out.push('These five are memory: an enquiry-source column in your CRM (free options on the Money card) makes the next five data.');
  return out.concat(routes.slice(0, 2));
}
/* ---------- competitors: only what the visitor gave ---------- */
function competitorsLine() {
  const named = String(state.competitors ?? '').trim();
  if (!named) return 'You named no competitors.';
  const them = (state.chooseThem ?? []).map((x) => lc(String(x)));
  const you = (state.chooseYou ?? []).map((x) => lc(String(x)));
  const reasons = them.join(', ');
  const top = steps()[0];
  const addresses = top && ((/price/i.test(reasons) && top.driver === 'pricing') || (/trust|review|heard/i.test(reasons) && top.driver === 'demand') || (/speed|slow|reply|response/i.test(reasons) && top.driver === 'conversion'));
  if (!them.length && !you.length) return `Competitors: ${named}.`;
  const tail = `the plan’s Return rank 1 is ${top ? top.title : 'not yet ranked'}, which ${addresses ? 'addresses' : 'does not address'} ${them.length ? 'what you lose on' : 'that'}.`;
  const both = them.filter((x) => you.includes(x));
  if (!both.length) return `You lose on ${reasons || 'nothing you named'} and win on ${you.join(', ') || 'nothing you named'}; ${tail}`;
  const words = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0]);
  const it = both.length > 1 ? 'them' : 'it';
  const restThem = them.filter((x) => !both.includes(x)), restYou = you.filter((x) => !both.includes(x));
  const rest = [restThem.length ? `lose on ${words(restThem)}` : '', restYou.length ? `win on ${words(restYou)}` : ''].filter(Boolean).join(' and ');
  return `${cap(words(both))} cut${both.length > 1 ? '' : 's'} both ways: you win on ${it} and lose on ${it}.${rest ? ` You also ${rest}.` : ''} ${cap(tail)}`;
}
/* ---------- the weather (COPY §11), from M.macro only ---------- */
function weather() {
  const mac = M.macro;
  if (!mac) return { head: [], sector: [], rule: null, foot: '' };
  const key = (() => { try { return M.contentKey?.(); } catch (e) { return null; } })();
  return { head: mac.headline(), sector: mac.forKey(key), rule: mac.weatherLines(state)[0] ?? null, foot: mac.FOOT };
}
function weatherHtml(w) {
  if (!w.head.length) return '';
  const mac = M.macro;
  const row = (r) => `<p class="weather-row${r.unit === 'quote' ? ' quote' : ''}"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(mac.rowLine(r))}</a>${mac.isProjection(r) ? ' <span class="small">projection</span>' : ''}</p>`;
  return `<div class="weather"><p class="eyebrow">The weather</p>${w.head.map(row).join('')}${w.sector.map(row).join('')}${w.rule ? `<p class="weather-rule">${esc(w.rule.text)}${w.rule.asOf ? ` <span class="small">as of ${esc(w.rule.asOf)}</span>` : ''}</p>` : ''}<p class="small">${esc(w.foot)}</p></div>`;
}
/* ---------- free alternatives (Money card; C11): said on the face for everyone, listed under the ▾, whole in the markdown.
   A visitor who named no software is told so and shown the ledger's first three kinds, never rows dressed as their own. The
   three steps are instructions with no figure; freetools.js may supply its own (buildSteps). ---------- */
const BUILD_STEPS = ['Write one paragraph saying what the tool must do.', 'Give the AI your Mercer markdown file (For your AI).', 'Ask for one HTML file you can open in a browser.'];
const DEFAULT_KINDS = ['crm', 'email', 'booking'];
function freeTools() {
  const ft = M.freetools;
  if (!ft || typeof ft.line !== 'function') return null;
  let used = [];
  try { used = ft.used?.(state) ?? []; } catch (e) { used = []; }
  const named = used.length > 0;
  const total = used.reduce((a, u) => a + (Number(u.fee) || 0), 0);
  const shown = named ? used : DEFAULT_KINDS.map((id) => ({ id, name: ft.categoryName?.(id) ?? id, fee: 0, rows: ft.rowsFor?.(id) ?? [] })).filter((u) => u.rows.length);
  const steps = Array.isArray(ft.buildSteps) && ft.buildSteps.length ? ft.buildSteps : BUILD_STEPS;
  /* the total keeps its qualifier ("if the free tiers' limits fit you"): it is freetools.js's line, word for word */
  const face = total > 0 ? ft.totalLine(total) : named ? (used.length === 1 ? 'Free tools for the kind of software you named.' : `Free tools for the ${count(used.length)} kinds of software you named.`) : 'Free tools, and how to build your own.';
  return { ft, used, named, total, shown, steps, face };
}
function freeToolsHtml(t = freeTools()) {
  if (!t) return '';
  const { ft } = t;
  const rows = t.shown.flatMap((u) => u.rows.map((r) => `<p class="tool-row"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(ft.line(r, u.id))}</a>${r.note ? ` <span class="small">${esc(r.note)}</span>` : ''}</p>`));
  return `<div class="freetools"><p class="eyebrow">Software</p>${t.named ? '' : '<p>You named no software.</p>'}${rows.join('')}<p class="eyebrow">Build your own</p><ol class="build-steps">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${ft.buildLine ? `<p>${esc(ft.buildLine)}</p>` : ''}</div>`;
}

/* ---------- the appetite dial and the ladder on the trunk card ---------- */
let dialCtl = null;
const appetiteLine = (level) => {
  /* U1: None is no growth spend, in those words; "£0" is never printed under the dial */
  if (level === 'none') return 'No growth spend: revenue carried flat';
  const lad = ladderNow();
  const ap = lad?.appetite?.[level];
  if (lad) {
    /* the landed ladder's own figure and where it came from, in the page's words (clean(): "middle run", no engine-room words) */
    if (ap && ap.budget !== null && ap.budget !== undefined && ap.budget > 0) return `${gbp(ap.budget)}: ${clean(ap.source ?? '')}`.replace(/:\s*$/, '');
    if (level === 'aggressive') {
      /* C38: the limit by this file's name for it, never the engine's id and never a lower-cased "tma's" */
      if (lad.noBudget && basis() === 'revenue' && state.goal) return `no budget reaches ${gbp(state.goal)} by ${monthName(goalMonth())}: ${midWords(binderWords(lad.noBudget))}`;
      if (!(basis() === 'revenue' && state.goal)) return 'needs a revenue target';
      return (plan()?.budget ?? 0) >= 1 ? `on course at ${gbp(plan().budget)} a month` : 'on course';
    }
  }
  /* before the ladder lands: (d)'s own line when it is in the page's words; at the crown the figure is being worked out, not on its way */
  try { const ab = typeof M.appetiteBudget === 'function' ? M.appetiteBudget(level) : null; const l = ab && typeof ab.line === 'string' ? clean(ab.line).replace(/: the figure arrives at the crown$/, ': working it out') : ''; if (l && !OFF_VOCAB.test(l) && !saysNothing(l)) return l; } catch (e) { /* the local form below */ }
  if (level === 'boutique') return `${gbp(Math.max(500, 0.05 * (state.now ?? plan()?.base ?? 0)))}: Mercer’s default rule`;
  return { moderate: 'a quarter of gross profit: working it out', aggressive: 'the smallest budget that reaches your target: working it out', maximum: 'where spend stops adding: working it out' }[level] ?? '';
};
function mountDial() {
  const host = $('#dial-host');
  if (!host) return;
  host.innerHTML = '';
  dialCtl = null;
  if (typeof M.ui?.dial !== 'function') { host.innerHTML = `<p class="small">${esc(appetiteLine(state.appetite ?? 'moderate'))}</p>`; return; }
  try {
    dialCtl = M.ui.dial(host, {
      id: 'appetite', value: state.appetite ?? 'moderate', hue: '--sec-you', label: 'Appetite', line: appetiteLine,
      onCommit: (level) => {
        if (typeof M.commit === 'function') { try { M.commit('appetite', level, { fromEl: host }); } catch (e) { state.appetite = level; } } else state.appetite = level;
        /* None changes what the engine is sent (the other levels do not), so the plan the cards read is made again for the
           answers as they stand before anything is painted; a level that leaves the key alone costs nothing here */
        try { M.ensurePlanned?.(); } catch (e) { /* the cards keep the plan they have */ }
        ladderCache = { key: null, value: null, promise: null };
        dialCtl?.set?.({ working: true });
        ladder().then(() => { dialCtl?.set?.({ working: false, line: appetiteLine(level) }); paintLadder(); if (openId === 'you') paintCard('you'); });
      },
    });
    if (!ladderNow()) { dialCtl.set?.({ working: true }); ladder().then(() => dialCtl?.set?.({ working: false, line: appetiteLine(state.appetite ?? 'moderate') })); }
  } catch (e) { host.innerHTML = `<p class="small">${esc(appetiteLine(state.appetite ?? 'moderate'))}</p>`; }
}
/** the five stops as marks on a ladder, each with the median it reaches; the p90 mark at Maximum is the room for outliers */
function paintLadder() {
  const host = $('#ladder');
  const lad = ladderNow();
  if (!host) return;
  if (!lad) { host.innerHTML = ''; return; }
  const m = goalMonth();
  const stops = ['none', 'boutique', 'moderate', 'aggressive', 'maximum'].map((id) => ({ id, word: id.charAt(0).toUpperCase() + id.slice(1), ...(lad.appetite?.[id] ?? {}) })).filter((s) => s.budget !== null && s.budget !== undefined && s.p50 !== null);
  if (!stops.length) { host.innerHTML = ''; return; }
  const W = 300, H = 24 + stops.length * 34;
  const p50s = stops.map((s) => s.p50), p90 = stops[stops.length - 1]?.p90 ?? null;
  const lo = Math.min(plan()?.base ?? 0, ...p50s) * 0.95, hi = Math.max(state.goal ?? 0, p90 ?? 0, ...p50s) * 1.02;
  const X = (v) => 96 + ((v - lo) / Math.max(1, hi - lo)) * (W - 100 - 8);
  const rows = stops.map((s, i) => {
    const y = 20 + i * 34;
    const on = (state.appetite ?? 'moderate') === s.id;
    return `<g class="rung${on ? ' on' : ''}"><text x="0" y="${y + 4}" class="rung-word">${esc(s.word)}</text><line x1="96" y1="${y}" x2="${X(s.p50).toFixed(1)}" y2="${y}" class="rung-line"/><circle cx="${X(s.p50).toFixed(1)}" cy="${y}" r="4" class="rung-dot"/><text x="${(X(s.p50) + 8).toFixed(1)}" y="${y + 4}" class="rung-fig tabular">${esc(gbp(near(s.p50)))}</text>${s.id === 'maximum' && p90 ? `<circle cx="${X(p90).toFixed(1)}" cy="${y}" r="3" class="rung-p90"/>` : ''}</g>`;
  }).join('');
  const goalMark = basis() === 'revenue' && state.goal ? `<line x1="${X(state.goal).toFixed(1)}" y1="6" x2="${X(state.goal).toFixed(1)}" y2="${H - 6}" class="rung-goal"/>` : '';
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="ladder-svg" role="img" aria-label="The five appetite stops and the middle run each reaches in month ${m}">${goalMark}${rows}</svg><p class="small">Each mark: the base assumptions in month ${m} at that budget. The small mark at Maximum is the favourable set.</p>`;
}

/* ============ the archetype agent (trunk card ▾, and Harvest) ============ */
const archetype = () => { try { return M.archetypes?.current?.(state) ?? null; } catch (e) { return null; } };
let hostModel = false;
/* C33: true once a briefing has gone to the host's model, so the privacy line and the markdown header say what left */
let hostSent = false;
/* D5, the host-model disclosure, word for word: what goes (every kind of thing briefing() holds), where, and what TMA sees */
const HOST_LINE = 'Your question goes to Claude with your briefing: your business name, place, figures, routes, notes, what you said about yourself and how you work, and your best clients without their names. TMA sees none of it.';
const LOCAL_OFF = 'Answers come from your tree, in this browser.';
const LOCAL_ON = 'Chips answer in this browser. Typed questions go to Claude.';
const HOST_DECLINED = 'You declined. The For your AI file holds the same briefing for any assistant.';
/** what has left the browser, for the plan view's one privacy line (#hv-private) and the brief's header. Rebuild 1, brief 2.3
    item 1 and R20: a website address is stored as an address and nothing is fetched from it, so no line says a site was read. */
const privacyLine = () => {
  const site = !!(state.site && String(state.site).trim());
  const stored = site ? ' Your website address is kept as an address only; nothing was fetched from it.' : '';
  if (hostSent) return `You sent a briefing to Claude. TMA sees your answers only in what you download.${stored}`;
  return `Your answers stay in this browser. TMA sees them only in what you download.${stored}`;
};
/* Refine 1, R19: with Save on this device on, the line says the answers are kept here, at the visitor's request */
const privacyNow = () => { let on = false; try { on = saveOn(); } catch (e) { on = false; } const t = privacyLine(); return on ? (t.startsWith('Your answers stay in this browser.') ? t.replace('Your answers stay in this browser.', 'Your answers are saved on this device, at your request.') : `${t} Your answers are saved on this device, at your request.`) : t; };
const paintPrivate = () => { const el = $('#hv-private'); if (el) el.textContent = privacyNow(); };
/* C12: the three chips that never read the type; (atlas) may filter in chips() too, so this is a net under it */
const NO_TYPE_LOCAL = ['lastFive', 'restraint', 'topShare'];
/* Refine 1: atlas owns the list (M.archetypes.NO_TYPE: it added stop and decide); the three above are the fallback only */
const noTypeChips = () => { const l = M.archetypes?.NO_TYPE; return new Set(Array.isArray(l) && l.length ? l : NO_TYPE_LOCAL); };
function agentHtml() {
  const a = archetype();
  const hostStone = window.claude && typeof window.claude.use === 'function';
  let chips = [];
  try { chips = M.archetypes?.chips?.(state) ?? []; } catch (e) { chips = []; }
  /* C12: no Type answer means no archetype, no agent name and no founders (facts-archetypes.md), and none is invented. The
     chat stays: the free field and three of the chips answer from the tree alone, and the four either-ors sit one press away. */
  if (!a) { const keep = noTypeChips(); chips = chips.filter((c) => keep.has(c.id)); }
  const kind = a ? a.name.replace(/^The /, '') : '';
  const head = a
    ? `<p class="agent-name">${esc(a.name)}</p><p class="small">for ${esc(bizName())}</p>
    <p>${esc(a.lines[0])}</p><p>${esc(a.lines[1])}</p>
    <p class="small">Two founders who grew the way ${article(kind)} ${esc(kind)} grows:</p>
    ${a.examples.map((ex) => `<p class="agent-ex">${esc(ex.who)}, ${esc(ex.company)}: ${esc(ex.did)} ${ex.sources.map((u) => `<a class="small" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</a>`).join(' ')}</p>`).join('')}`
    : `<p class="agent-name">Your agent</p><p class="small">for ${esc(bizName())}</p>`;
  const naming = !a && typeof M.ui?.twoSided === 'function' ? `<button type="button" class="stone small name-agent" aria-expanded="false">Name your agent</button><div class="agent-type" hidden></div>` : '';
  return `<div class="agent-panel" data-agent="1">
    ${head}
    <div class="chips">${chips.map((c) => `<button type="button" class="stone" data-chip="${esc(c.id)}">${esc(c.text)}</button>`).join('')}</div>
    <div class="agent-log" aria-live="polite"></div>
    <form class="agent-row"><input class="field" name="q" placeholder="Ask about your tree" aria-label="Ask about your tree" maxlength="300" autocomplete="off"><button type="submit" class="glass small">Ask</button></form>
    ${naming}
    ${hostStone ? `<button type="button" class="stone small host-stone" aria-pressed="${hostModel ? 'true' : 'false'}">Ask Claude</button><p class="small host-line"${hostModel ? '' : ' hidden'}>${esc(HOST_LINE)}</p>` : ''}
    <p class="small agent-local">${esc(hostModel ? LOCAL_ON : LOCAL_OFF)}</p>
  </div>`;
}
/* C12: a typed question about a figure the plan holds is answered with that figure and where it came from, one number a
   sentence, before the agent says it does not know. The rows are the ones the Ground card prints, so the two agree. */
const FIGURE_TOPICS = [
  [/\b(price|prices|pricing|fee|fees|sale value|charge)\b/i, ['price']],
  [/\b(close rate|closing|convert|conversion|win rate)\b/i, ['close']],
  [/\b(margin|profit)\b/i, ['margin']],
  [/\b(budget|spend|spending)\b/i, ['budget']],
  [/\b(capacity|deliver|workload|take on)\b/i, ['capacity', 'servedNow']],
  [/\b(prospects?|market)\b/i, ['market']],
  [/\b(revenue|turnover)\b/i, ['revenue']],
  [/\b(repeat|buy again)\b/i, ['repeat']],
  [/\b(lifespan|retention|how long)\b/i, ['retention']],
];
function figureAnswer(q) {
  const text = String(q ?? '');
  const keys = FIGURE_TOPICS.filter(([re]) => re.test(text)).flatMap(([, k]) => k);
  if (!keys.length || !plan()) return '';
  return inputs().filter((r) => keys.includes(r.key) && r.from !== 'empty').slice(0, 2).map((r) => `${r.label}: ${r.value}, ${FROM_WORD(r.from)}.`).join(' ');
}
const scriptedAnswer = (q) => {
  let a = '';
  try { a = M.archetypes?.answer?.(q, state) ?? ''; } catch (e) { a = ''; }
  if (!a || /^Mercer does not know that/.test(a)) { const fig = figureAnswer(q); if (fig) return fig; }
  return a || 'Mercer does not know that.';
};
function bindAgent(root, onNamed) {
  const panel = root.querySelector('.agent-panel[data-agent]');
  if (!panel) return;
  const log = panel.querySelector('.agent-log');
  const say = (who, text) => { const d = document.createElement('p'); d.className = `agent-line ${who}`; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  const scripted = (q) => { const a = scriptedAnswer(q); if (a) say('them', a); };
  panel.querySelectorAll('[data-chip]').forEach((b) => b.addEventListener('click', () => {
    feel.play('tap', { x: feel.x(b) });
    say('you', b.textContent);
    scripted(b.dataset.chip);
  }));
  const form = panel.querySelector('.agent-row');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = form.querySelector('input');
    const q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    say('you', q);
    if (!hostModel) { scripted(q); return; }
    const out = say('them', 'Working');
    try {
      const sample = await window.claude.use('sample');
      if (!sample) { out.textContent = scriptedAnswer(q); return; }
      /* C33: the briefing is about to leave the browser; the privacy line and the markdown header say so from here on */
      hostSent = true;
      paintPrivate();
      const res = await sample([{ role: 'user', content: `${briefing()}\n\nThey ask: ${q}` }], { onText: ({ text }) => { out.textContent = text; } });
      out.textContent = res?.text ?? out.textContent;
    } catch (err) {
      out.textContent = err && err.code === 'not_granted' ? HOST_DECLINED : 'No reply came back. Try again.';
    }
  });
  const stone = panel.querySelector('.host-stone');
  if (stone) stone.addEventListener('click', () => {
    hostModel = !hostModel;
    stone.setAttribute('aria-pressed', String(hostModel));
    panel.querySelector('.host-line').hidden = !hostModel;
    /* C20: "in this browser" is true of typed questions only while the stone is off */
    const local = panel.querySelector('.agent-local');
    if (local) local.textContent = hostModel ? LOCAL_ON : LOCAL_OFF;
    feel.play('tap', { x: feel.x(stone) });
  });
  /* C12: "Name your agent" opens the four either-ors (feel's own instrument, founder.js's axes). A full set commits the type
     the way the Type question does, and the panel is painted again with its name, its lines and its two founders. */
  const naming = panel.querySelector('.name-agent'), typeHost = panel.querySelector('.agent-type');
  if (naming && typeHost) naming.addEventListener('click', () => {
    const open = typeHost.hidden;
    if (open && !typeHost.dataset.mounted) {
      typeHost.dataset.mounted = '1';
      try {
        M.ui.twoSided(typeHost, {
          id: 'agent-type', hue: '--sec-you', label: 'Name your agent',
          value: { axes: Array.isArray(state.personalityAxes) && state.personalityAxes.length === 4 ? [...state.personalityAxes] : [null, null, null, null], code: state.personality ?? null },
          onCommit: (v) => {
            if (!v?.code) return;
            if (typeof M.commit === 'function') { try { M.commit('personality', { axes: [...(v.axes ?? [])], code: v.code }, { fromEl: typeHost }); } catch (e) { state.personality = v.code; } } else state.personality = v.code;
            if (!state.personality) state.personality = v.code;
            if (typeof onNamed === 'function') onNamed();
          },
        });
      } catch (e) { typeHost.textContent = 'The Personality question on the You branch names your agent.'; }
    }
    feel.toggle(typeHost, open, naming);
  });
}
/** the briefing for an assistant: the archetype's voice rules, then every figure the cards used */
function briefing() {
  const p = plan();
  if (!p) return '';
  const r = report();
  const a = archetype();
  const lad = ladderNow();
  const lim = limit();
  const path = lad ? pathWords(p, lad, goalMonth()) : null;
  /* U1: None is no growth spend, in words; C37: a default budget is not called the visitor's */
  const spend = noSpend() ? 'no growth spend' : `growth spend ${gbp(p.budget)} a month${budgetSaid() ? '' : ' (Mercer’s default, not their figure)'}${state.spendNow !== null && state.spendNow !== undefined && state.spendNow >= 1 ? ` (spending ${gbp(state.spendNow)} now)` : ''}`;
  return [
    a ? `You are ${a.name}: ${a.lines[0]} ${a.lines[1]}` : 'You are an assistant reading a Mercer forecast.',
    a ? 'Speak as the archetype, never as a named person.' : '',
    'Short sentences, at most one number each, and the number is always from this briefing. When the briefing does not hold an answer, say "Mercer does not know that".',
    /* C42: the two founders and what they did travel with the briefing, each with the page it was read from, so no assistant
       fills them in from memory; the rule is the one facts-archetypes.md sets for the agent */
    a ? `The two founders, public examples only: ${a.examples.map((ex) => `${ex.who}, ${ex.company}: ${ex.did} (${ex.sources.join(', ')})`).join(' ')}` : '',
    a ? 'Say only what is written here about them: what they did, when, and the source. Never what they thought, felt or would say, no quotes, and never a personality type for either.' : '',
    `You are advising ${r.business}${r.industry ? `, ${r.industry}` : ''}${state.place ? `, working in ${state.place}` : ''}.`,
    `Revenue now: ${gbp(state.now ?? p.base)} a month. ${noSpend() ? 'They chose no growth spend, so revenue is carried flat.' : r.basis === 'budget' ? `They work from a growth spend of ${gbp(p.budget)} a month.` : `Target: ${gbp(state.goal)} a month by ${r.goalMonth}.`} Appetite: ${state.appetite ?? 'moderate'}.`,
    `Mercer’s scenarios for ${r.goalMonth}, over ${runsWord(p)} runs of the model: ${gbp(r.range.p25)} to ${gbp(r.range.p75)} a month between the downside and favourable assumption sets, ${gbp(r.range.p10)} to ${gbp(r.range.p90)} at the wider range, and ${gbp(r.range.p50)} on the base assumptions. None of these is a likelihood.`,
    /* C18: the limit in the page's words, the long form; the engine's own statement never leaves the JSON */
    lim ? `First limit: ${limitWords(lim)}.${lim.plainLong ? ` ${lim.plainLong}` : ''}` : `First limit: ${noLimitWords()}`,
    `Sale value ${gbp(p.acv)}, close rate ${pct(p.close)}, margin ${Math.round(p.margin * 100)}p in the pound, capacity ${count(p.capacity)} ${unitWord(p, p.capacity)} a month, ${spend}.`,
    lad?.bStar ? `Path to target: ${gbp(lad.bStar)} a month is the smallest budget whose middle run reaches the target by month ${goalMonth()}.` : path?.lead && lad?.noBudget ? `Path to target: ${path.lead}` : '',
    `Steps in Return rank order: ${steps().map((s) => stepLine(s)).join(' ') || 'no step moves the middle run by 2% or more.'}`,
    rangeNote(p),
    /* R17, R18: the founder, the control map and their actions, labelled as the visitor's own answers */
    ...(() => { const pl = profileLines(); return [pl.founder.length ? `The founder, in their own answers (not a forecast, nothing inferred): ${pl.founder.join(' ')}` : '', pl.control.length ? `Control, in their own answers: ${pl.control.join(' ')} ${PRO_LINE}` : '', pl.actions.length ? `${ANSWER_ACTIONS}: ${pl.actions.join(' ')}` : '']; })(),
    Array.isArray(state.lastFive) && state.lastFive.length === 5 ? `Last five best clients came: ${state.lastFive.map((x) => M.archetypes?.BIN_WORD?.[x?.bin] ?? x?.bin).join('; ')}.` : '',
    !notGiven('topShare') && Math.round(state.topShare) >= 1 ? `Top three clients are ${Math.round(state.topShare)}% of revenue.` : '',
    `Running now: ${(state.doing ?? []).map((id) => M.DIST_BY?.[id]?.name).filter(Boolean).join(', ') || 'nothing stated'}. Tried before: ${(state.tried ?? []).map((id) => M.DIST_BY?.[id]?.name).filter(Boolean).join(', ') || 'nothing stated'}.`,
    state.note ? `In their words: "${state.note}"` : '',
    state.buyerNote ? `Who buys, from what they imported: ${state.buyerNote}` : '',
    state.personality ? `The founder gives their type as ${state.personality}. Mercer uses it to order the plan and leaves the numbers alone.` : '',
    state.cv ? (() => { const f = M.readCV?.(state.cv); return f ? `The founder’s background: ${f.years ? `${f.years} years in work` : 'dates not given'}${f.education?.length ? `; ${f.education.slice(0, 3).join('; ')}` : ''}.` : ''; })() : '',
    `Mission Alignment ${r.alignment.score} of 100; TMA works above ${TMA_BAR}; the call is open either way.`,
  ].filter(Boolean).join('\n');
}

/* ============ Rebuild 1, brief 13.6: Ask TMA to help, the review panel ============
   The page sends nothing: it has no backend and the published page's CSP blocks cross-origin requests, so no destination is
   configured. The panel shows exactly which sections the brief will hold, each a tick; private items (your own words, your
   CV, client examples, personal finances, founder reflections) are off by default; no contact details are asked for, because
   there is no submission path to need them; the one press downloads a brief for TMA and the line says the visitor sends it.
   No address is invented and nothing is ever called submitted. M.CONFIG.shareEmail is shown only when it is set. */
const SHARE_WORDS_KEYS = ['note', 'buyerNote', 'site'];
const SHARE_CV_KEYS = ['cv'];
const SHARE_CLIENT_KEYS = ['lastFive', 'topShare'];
const SHARE_FINANCE_KEYS = ['ownership', 'ownShare', 'profitShare', 'runway', 'funding', 'owed', 'fixedCosts'];
const SHARE_FOUNDER_KEYS = ['strengths', 'avoids', 'win', 'help', 'risk', 'personality', 'hours', 'holiday', 'energy', 'avoided', 'delegation', 'decisionSpeed', 'futureRole', 'plannedChanges', 'retain', 'exitIntent', 'unresolved', 'keyPeople', 'influence'];
const SHARE_CONTROL_KEYS = ['decisionRights'];
const SHARE_PRIVATE_KEYS = [...SHARE_WORDS_KEYS, ...SHARE_CV_KEYS, ...SHARE_CLIENT_KEYS, ...SHARE_FINANCE_KEYS, ...SHARE_FOUNDER_KEYS];
const SHARE_META_KEYS = ['skipped', 'notSure', 'na', 'asked'];
const givenValue = (v) => !(v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length));
/** the sections of the brief as the panel lists them, each with a count and whether it is on by default; a section that holds nothing is not listed */
function shareParts(pl = planObj().plan, full = exportJson()) {
  const a = full.answers ?? {}, r = full.report ?? {};
  const has = (k) => givenValue(a[k]);
  const plainKeys = Object.keys(a).filter((k) => !SHARE_PRIVATE_KEYS.includes(k) && !SHARE_CONTROL_KEYS.includes(k) && !SHARE_META_KEYS.includes(k));
  /* plan.js's brief carries its own public sections (goal, finding, first action, hours and budget, not known yet); they
     travel as one row. Its private flags name the same groups this file keys by answer. */
  const pub = publicBriefSections(pl);
  return [
    { id: 'plan', name: 'The plan', about: 'the decision, every action with its steps, week one, 30 and 90 days', n: (pl?.actions ?? []).length, unit: ['action', 'actions'], on: true },
    { id: 'summary', name: 'Goal, finding and what is not known yet', about: pub.map((x) => x.title.toLowerCase()).join(', ') || 'the goal, the finding, the key unknown', n: pub.length || 1, unit: ['section', 'sections'], on: true },
    { id: 'needs', name: 'Implementation needs', about: 'what carrying it out needs', n: listOf(pl?.tmaBrief?.needs).length, unit: ['item', 'items'], on: true },
    { id: 'answers', name: 'Your answers', about: 'the figures and choices you gave', n: plainKeys.filter(has).length, unit: ['answer', 'answers'], on: true },
    { id: 'forecast', name: 'Scenarios', about: 'the range, the months and what went in', n: (r.months ?? []).length, unit: ['month', 'months'], on: true },
    { id: 'control', name: 'Who decides', about: 'the decision-rights map', n: (r.control?.map ?? []).length, unit: ['decision', 'decisions'], on: true },
    { id: 'words', name: 'Your own words', about: 'your note and your website address', n: SHARE_WORDS_KEYS.filter(has).length, unit: ['entry', 'entries'], on: false, private: true },
    { id: 'cv', name: 'Your CV', about: 'the background you pasted', n: SHARE_CV_KEYS.filter(has).length, unit: ['document', 'documents'], on: false, private: true },
    { id: 'clients', name: 'Client examples', about: 'your best clients and their share of revenue', n: SHARE_CLIENT_KEYS.filter(has).length, unit: ['answer', 'answers'], on: false, private: true },
    { id: 'finances', name: 'Personal finances', about: 'ownership, profit share, runway, funding', n: SHARE_FINANCE_KEYS.filter(has).length, unit: ['answer', 'answers'], on: false, private: true },
    { id: 'founder', name: 'Founder reflections', about: 'your type, strengths, energy, delegation, hours', n: SHARE_FOUNDER_KEYS.filter(has).length + (r.founder?.rows?.length ?? 0), unit: ['item', 'items'], on: false, private: true },
  ].filter((part) => part.n > 0);
}
/** the brief's public sections from plan.js (title and text, not private), else this file's own summary lines */
const publicBriefSections = (pl) => { const secs = Array.isArray(pl?.tmaBrief?.sections) ? pl.tmaBrief.sections.filter((x) => x && !x.private && wordsOf(x.text) && !/^Included only if/.test(String(x.text))) : []; if (secs.length) return secs.map((x) => ({ id: x.id, title: wordsOf(x.title), text: String(x.text) })); return [{ id: 'goal', title: 'Goal', text: wordsOf(pl?.goal?.text ?? pl?.goal) }, { id: 'finding', title: 'Finding', text: wordsOf(pl?.finding?.text ?? pl?.finding) }, { id: 'unknown', title: 'Not known yet', text: wordsOf(pl?.keyUnknown) }].filter((x) => x.text); };
const answerLine = (id, v) => { const w = valueWord(id) || (typeof v === 'string' ? v : Array.isArray(v) ? v.map(strOf).join(', ') : v && typeof v === 'object' ? JSON.stringify(v) : String(v)); return `- ${titleOf(id)}: ${clean(w)}`; };
/** the brief for TMA as markdown: the sections the visitor ticked, nothing else; the header says who sends it */
function tmaBriefMarkdown(pl, included, full = exportJson()) {
  const on = new Set(included);
  const parts = shareParts(pl, full);
  const a = full.answers ?? {}, r = full.report ?? {};
  const L = [];
  L.push(`# Brief for TMA: ${pl?.business ?? bizName()}`, '', `Prepared ${today()} with Mercer, plan revision ${pl?.revision ?? revisionNow()}, ${pl?.route ?? routeOf()} route. The visitor downloaded this file and sends it themselves; Mercer sends nothing.`, '', `Included: ${parts.filter((x) => on.has(x.id)).length ? parts.filter((x) => on.has(x.id)).map((x) => x.name.toLowerCase()).join(', ') : 'the summary only'}. Left out: ${parts.filter((x) => !on.has(x.id)).map((x) => x.name).join(', ') || 'nothing'}.`, '');
  L.push('## Summary', '', wordsOf(pl?.tmaBrief?.summary ?? pl?.finding?.text ?? ''), '');
  if (on.has('summary')) publicBriefSections(pl).forEach((x) => L.push(`## ${x.title}`, '', x.text, ''));
  if (pl?.tmaBrief?.note) L.push(wordsOf(pl.tmaBrief.note), '');
  if (on.has('plan')) { L.push('## The plan', ''); (pl?.actions ?? []).forEach((ac, i) => L.push(...actionMd(ac, i, pl), '')); if ((pl?.waits ?? []).length) L.push('What should wait:', '', ...pl.waits.map((w) => `- ${wordsOf(w.action)}: ${wordsOf(w.why)}`), ''); L.push(...weekMd(pl), ...thirtyMd(pl), ...ninetyMd(pl)); }
  if (on.has('needs')) L.push('## Implementation needs', '', ...listOf(pl?.tmaBrief?.needs).map((t) => `- ${t}`), '');
  if (on.has('answers')) { const keys = Object.keys(a).filter((k) => !SHARE_PRIVATE_KEYS.includes(k) && !SHARE_CONTROL_KEYS.includes(k) && !SHARE_META_KEYS.includes(k) && givenValue(a[k])); L.push('## Your answers', '', ...keys.map((k) => answerLine(k, a[k])), ''); }
  if (on.has('forecast') && r.months) { L.push('## Scenarios', '', ...scenarioMd(pl), '', '| Month | Downside | Base | Favourable |', '|---|---|---|---|', ...r.months.map((mo) => `| ${mo.name} | ${gbp(mo.p10)} | ${gbp(mo.p50)} | ${gbp(mo.p90)} |`), '', ...(r.inputs ?? []).map((x) => `- ${x.input}: ${x.value} (${x.source})`), ''); }
  if (on.has('control') && r.control) L.push('## Who decides', '', '| Decision | Now | Intended |', '|---|---|---|', ...r.control.map.map((x) => `| ${x.decision} | ${x.now ? WHO_WORD[x.now] : 'not said'} | ${x.intended ? WHO_WORD[x.intended] : 'not said'}${x.moves ? ' (moves)' : ''} |`), '', r.control.professional, '');
  const block = (id, title, keys) => { if (!on.has(id)) return; const ks = keys.filter((k) => givenValue(a[k])); if (ks.length) L.push(`## ${title}`, '', ...ks.map((k) => answerLine(k, a[k])), ''); };
  block('words', 'Your own words', SHARE_WORDS_KEYS);
  block('cv', 'Your CV', SHARE_CV_KEYS);
  block('clients', 'Client examples', SHARE_CLIENT_KEYS);
  block('finances', 'Personal finances', SHARE_FINANCE_KEYS);
  if (on.has('founder')) { const ks = SHARE_FOUNDER_KEYS.filter((k) => givenValue(a[k])); const pf = profileLines(); L.push('## Founder reflections', '', SELF_LINE, '', ...ks.map((k) => answerLine(k, a[k])), ...pf.founder.map((t) => `- ${t}`), ''); }
  L.push('## Disclaimer', '', ...disclaimer().short.map((t) => `- ${t}`), '');
  return L.join('\n');
}
const shareEmail = () => { const e = M.CONFIG?.shareEmail; return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()) ? e.trim() : null; };
const SHARE_DOES = 'TMA would review your assumptions and priorities, refine the plan and talk through how to carry it out, or carry it out with you.';
let shareFrom = null;
function closeShare() {
  const el = $('#share'), scrim = $('#share-scrim');
  if (!el || el.hidden) return;
  el.hidden = true;
  if (scrim) scrim.hidden = true;
  feel.play('close');
  try { (shareFrom ?? $('#hv-json'))?.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  shareFrom = null;
}
function openShare(fromEl) {
  const pl = planObj().plan;
  if (!pl) return;
  /* C04: one top-level overlay at a time: the help and the inspector close before the panel opens */
  try { M.shell?.closeHelp?.(); M.shell?.closeInspect?.(); } catch (e) { /* none */ }
  shareFrom = fromEl ?? null;
  let el = $('#share'), scrim = $('#share-scrim');
  if (!el) {
    scrim = document.createElement('div'); scrim.id = 'share-scrim'; scrim.hidden = true;
    el = document.createElement('div'); el.id = 'share'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'share-title'); el.tabIndex = -1;
    document.body.append(scrim, el);
    scrim.addEventListener('click', () => closeShare());
    /* the trap: Tab stays inside the panel, Escape closes it and goes no further (the plan view's own Escape would leave the stage) */
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeShare(); return; }
      if (e.key !== 'Tab') return;
      const stops = $$('button, input, a[href]', el).filter((x) => !x.disabled && !x.hidden && !x.closest('[hidden]'));
      if (!stops.length) { e.preventDefault(); return; }
      const first = stops[0], last = stops[stops.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || at === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    });
  }
  const full = exportJson();
  const parts = shareParts(pl, full);
  const mail = shareEmail();
  el.innerHTML = `<h2 id="share-title" class="share-title">Ask TMA to help</h2>
    <p>Optional. Keeping it private is the default, and nothing on this page changes if you do.</p>
    <p>${esc(SHARE_DOES)}</p>
    <p class="small">No sending path is set up on this page, so the brief is a file you download and send yourself. No contact details are asked for here: put your name and how to reach you in the message you send with it.${pl.tmaBrief?.note && !/Nothing is sent by the page.$/.test(String(pl.tmaBrief.note)) ? ` ${esc(wordsOf(pl.tmaBrief.note))}` : ''}</p>
    <fieldset class="share-parts"><legend>What the brief holds. Private items are off until you tick them.</legend>${parts.map((x) => `<label class="share-part${x.private ? ' private' : ''}"><input type="checkbox" name="share-part" value="${esc(x.id)}"${x.on ? ' checked' : ''}><span class="share-name">${esc(x.name)}${x.private ? ' <span class="small">private</span>' : ''}</span><span class="share-count tabular">${esc(plural(x.n, x.unit[0], x.unit[1]))}</span><span class="share-about small">${esc(x.about)}</span></label>`).join('')}</fieldset>
    <p class="small">Every brief carries your business name, your industry, the date and the plan revision. Sharing it subscribes you to nothing.</p>
    <p class="share-acts"><button type="button" class="glass" id="share-confirm">Download a brief for TMA</button><button type="button" class="glass small" id="share-cancel">Keep it private</button></p>
    <p class="share-done" id="share-done" role="status" hidden></p>`;
  $('#share-cancel', el).addEventListener('click', () => closeShare());
  $('#share-confirm', el).addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    const included = $$('input[name="share-part"]', el).filter((i) => i.checked).map((i) => i.value);
    const name = `mercer-tma-brief-${slug()}.md`;
    const ok = await save(name, new Blob([tmaBriefMarkdown(pl, included, full)], { type: 'text/markdown' }));
    const done = $('#share-done', el);
    if (ok) { feel.play('done', { gain: 0.5, x: feel.x(b) }); done.innerHTML = `Downloaded ${esc(name)}. You send it: ${mail ? `to <a href="mailto:${esc(mail)}">${esc(mail)}</a>` : 'to your TMA contact'}, with your name and how to reach you. This page sent nothing.`; $('#share-cancel', el).textContent = 'Close'; }
    else done.textContent = 'The file was not downloaded. Nothing was sent.';
    done.hidden = false;
    b.disabled = false;
  });
  scrim.hidden = false; el.hidden = false;
  feel.play('open', { x: fromEl ? feel.x(fromEl) : 0.5 });
  try { el.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
}
/* C04: one top-level overlay at a time. A replay (body[data-replay], the shell's rule) or the help dialog opening closes the
   review panel; a stage move out of the plan view closes it too (the stage listener). The card is the shell's to hide under
   a replay (visibility), and it is closed here before a replay this file starts. */
if (typeof MutationObserver === 'function') {
  try {
    new MutationObserver(() => { if (document.body.dataset.replay !== undefined) closeShare(); }).observe(document.body, { attributes: true, attributeFilter: ['data-replay'] });
    const help = $('#help-panel');
    if (help) new MutationObserver(() => { if (help.open || help.hasAttribute('open')) closeShare(); }).observe(help, { attributes: true, attributeFilter: ['open'] });
  } catch (e) { /* no observer */ }
}
/* ============ Refine 1, R19: Save on this device, through (d)'s M.save ============
   Off until the visitor turns it on. The row exists only when (d) offers enable() and forget(); Forget removes the saved copy
   and turns saving off. The privacy line says which it is. */
const saveApi = () => { const s = M.save; return s && typeof s.enable === 'function' && typeof s.forget === 'function' ? s : null; };
const saveOn = () => { const s = saveApi(); if (!s) return false; try { return typeof s.on === 'function' ? !!s.on() : !!s.on; } catch (e) { return false; } };
/** true while the Forget confirmation is on screen; cleared by either answer, and by leaving the plan view */
let forgetAsked = false;
/** what Forget covers, in the flow's own words when it has them */
const forgetScope = () => { try { const t = M.save?.forgetScope?.(); if (typeof t === 'string' && t.trim()) return clean(t); } catch (e) { /* the line below */ } return 'This removes the answers saved in this browser. It does not recall a plan you downloaded or a brief you sent.'; };
function paintSave() {
  const host = $('#hv-save');
  if (!host) return;
  const api = saveApi();
  host.hidden = !api;
  if (!api) { host.innerHTML = ''; return; }
  const on = saveOn();
  const failed = on && api.failed === true;
  /* R21 and brief 14.2: Forget is destructive, so it asks first and says what it covers (M.save.forgetScope names the scope;
     the flow's forget() refuses without { confirmed: true }). The confirmation stands in place of the Forget link. */
  host.innerHTML = `<button type="button" class="hv-switch" id="hv-save-switch" role="switch" aria-checked="${on ? 'true' : 'false'}"><i class="hv-knob" aria-hidden="true"></i><span class="hv-word">Save on this device</span><span class="hv-kind">${on ? 'on: your answers are kept in this browser' : 'off: a reload starts again'}</span></button>${on ? `<p class="small hv-save-line">${failed ? 'This browser would not store them, so nothing is saved.' : 'Kept on this device only, until you press Forget.'} <button type="button" class="link" id="hv-forget">Forget</button></p>${forgetAsked ? `<p class="small hv-forget-ask" role="group" aria-label="Forget this visit">${esc(forgetScope())} <button type="button" class="link" id="hv-forget-yes">Forget this visit</button> <button type="button" class="link" id="hv-forget-no">Keep it</button></p>` : ''}` : ''}`;
  $('#hv-save-switch', host).addEventListener('click', (e) => {
    feel.play('tap', { x: feel.x(e.currentTarget) });
    if (saveOn()) { forgetAsked = true; paintSave(); $('#hv-forget-yes')?.focus({ preventScroll: true }); return; }
    forgetAsked = false;
    try { api.enable(); } catch (err) { /* the flow reports its own faults */ }
    paintSave(); paintPrivate();
    $('#hv-save-switch')?.focus({ preventScroll: true });
  });
  $('#hv-forget', host)?.addEventListener('click', () => { feel.play('tap'); forgetAsked = true; paintSave(); $('#hv-forget-yes')?.focus({ preventScroll: true }); });
  $('#hv-forget-no', host)?.addEventListener('click', () => { feel.play('tap'); forgetAsked = false; paintSave(); $('#hv-forget')?.focus({ preventScroll: true }); });
  $('#hv-forget-yes', host)?.addEventListener('click', () => {
    feel.play('tap');
    forgetAsked = false;
    try { api.forget({ confirmed: true }); } catch (err) { /* the flow reports its own faults */ }
    paintSave(); paintPrivate();
    $('#hv-save-switch')?.focus({ preventScroll: true });
  });
}
document.addEventListener('mercer:save', () => { if (isPlanStage(stageNow())) { paintSave(); paintPrivate(); } });

/* ============ Refine 1, R8: the Disclaimer on the Harvest ============ */
function disclaimerHtml(open) {
  const d = disclaimer();
  return `<p class="eyebrow"><span class="name">Disclaimer</span></p>${d.short.map((t) => `<p>${esc(t)}</p>`).join('')}<button type="button" class="drop small" id="disc-more" aria-expanded="${open ? 'true' : 'false'}" aria-controls="disc-body" aria-label="The full disclaimer">▾</button><div id="disc-body" class="disc-body"${open ? '' : ' hidden'}>${d.full.map((t) => `<p class="small">${esc(t)}</p>`).join('')}</div>`;
}

/* ============ Rebuild 1, R17: the plan object ============
   M.plan.current() (plan.js) is the source. While plan.js is absent this file builds the same shape (brief 16.2, R17) over the
   present engine: the frozen forecast, the ladder's ranked steps, the founder and control profiles, the free tools. One object
   then drives the recap, the plan view, both exports and the brief for TMA. Never a figure nobody supplied: every number in
   it is an engine output or the visitor's answer, and a field the engine cannot support is left out or says why. */
const localPlanCache = { key: null, value: null };
const nextMonday = () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); };
const titleOf = (id) => { try { return M.headline?.(id)?.title ?? id; } catch (e) { return id; } };
const givenNum = (v) => v !== null && v !== undefined && Number.isFinite(Number(v)) && Number(v) > 0;
const idOf = (t) => String(t ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** a source line for a figure the plan quotes, so evidence travels with it */
const evRow = (key) => { const r = inputRow(key); return r ? { id: key, title: r.label, value: r.value, source: FROM_WORD(r.from), kind: FROM_KIND(r.from) } : null; };
/* the action kits: one per step the engine ranks, each a tangible output (brief 13.3), with the visitor's own figures in the
   steps. x carries the figures; a kit never invents one: where the plan holds no figure the sentence has none. */
const ACTION_KITS = {
  'Raise your price': (x) => ({
    steps: [`Set the new figure for a sale: ${gbp(near(x.acv * 1.1))}, 10% over today’s ${gbp(x.acv)}.`, 'Write the one line a buyer hears with it: what they get for the figure. The offer sheet below holds the draft.', `Quote the new figure to every new enquiry from ${x.monday}. Existing clients keep their figure until their next renewal.`, 'Log each quote and its outcome on one sheet for four weeks.'],
    responsible: x.who('pricing'), needs: ['The offer sheet (below)', 'The list of quotes open now'], effort: '2 to 4 hours to set up, then minutes a quote (estimate)', cost: { oneOff: 0, recurring: 0 },
    doneWhen: 'Every new quote carries the new figure.', measure: `Close rate on new quotes after four weeks, against today’s ${pct(x.close)}; revenue a sale.`,
    changeCourseIf: `The close rate on new quotes falls by more than a quarter over four weeks (under ${pct(x.close * 0.75)}).`, asset: 'offer-sheet',
    weekOne: [['Write the offer sheet', 'the offer sheet, one page', 'a buyer could read it and know the figure and what it buys'], ['Set the new figure in your quotes', 'the quote template with the new figure', 'the next enquiry is quoted at it']],
    thirty: [['Weeks 1 to 4', 'quote every new enquiry at the new figure and log the outcome', 'day 14: replies and closes so far; day 30: close rate against today’s']],
  }),
  'Close more enquiries': (x) => ({
    steps: ['Write down what happens to an enquiry in its first hour, first day and first week, and where replies wait.', 'Set one rule: every enquiry gets a reply within one working day, with a way to book a call in it.', 'Use the enquiry reply below for the first reply and the follow-up on day three.', 'Count enquiries and closes on one sheet each week.'],
    responsible: 'You, or whoever answers enquiries', needs: ['Your enquiry inbox', 'A booking link (the free tools under Resources)', 'The enquiry reply (below)'], effort: '3 to 5 hours in week one, then 1 hour a week (estimate)', cost: { oneOff: 0, recurring: 0 },
    doneWhen: 'Every enquiry has a reply within a working day and a follow-up on day three.', measure: `Close rate each month against today’s ${pct(x.close)}; hours from enquiry to first reply.`,
    changeCourseIf: 'After eight weeks the close rate has not moved.', asset: 'enquiry-reply',
    weekOne: [['Map the enquiry’s first week', 'one page: hour one, day one, week one', 'the waits are named'], ['Set the one-day reply rule and the reply text', 'the enquiry reply, ready to send', 'the next enquiry is answered inside a working day']],
    thirty: [['Weeks 1 to 4', 'reply inside a day, follow up on day three, count enquiries and closes weekly', 'day 14: reply time; day 30: close rate against today’s']],
  }),
  'Find more prospects': (x) => ({
    steps: ['Write one line for the customers you want more of: who they are, what they need, what they have tried (your best clients say it).', `Build a list of ${x.listN} named prospects that fit it, from your own contacts and the places those customers gather.`, 'Send the outreach message below to ten a day and log every reply.', 'Ask two people who already refer work for one introduction each this week.'],
    responsible: 'You', needs: ['Your best-client answers', 'A list (a spreadsheet is enough)', 'The outreach message (below)'], effort: '4 to 6 hours in week one, then 3 hours a week (estimate)', cost: { oneOff: 0, recurring: 0, note: 'a paid list or ads is optional; Resources says what is free' },
    doneWhen: `A list of ${x.listN} prospects exists and the first ten messages are sent.`, measure: `Replies for every ten messages; enquiries a month against today’s${x.enquiries ? ` ${count(x.enquiries)}` : ''}.`,
    changeCourseIf: 'Fewer than one reply in twenty after sixty messages: change who you write to before you write more.', asset: 'outreach-message',
    weekOne: [['Define who you want more of', 'one line: who, what they need, what they tried', 'you could hand it to someone and they could find ten'], [`List the first ${Math.min(x.listN, 30)} prospects`, 'a list with a name and a way to reach each', 'ten messages can go out on day five'], ['Send ten messages and ask for two introductions', 'ten messages sent, two asks made', 'every reply is logged']],
    thirty: [['Weeks 1 to 2', 'build the list and send ten a day', 'day 14: replies for every ten sent'], ['Weeks 3 to 4', 'keep sending; change the line if replies are under one in twenty', 'day 30: enquiries a month against today’s']],
  }),
  'Add one person': (x) => ({
    steps: ['Write the delivery checklist below for the work a new person takes on.', 'Decide the first role: contractor, part time or full time, and what it must cover in month one.', 'Ask your network first, then post the role where your kind of person looks.', 'Set the handover: one week beside you on the checklist.'],
    responsible: x.who('hiring'), needs: ['The delivery checklist (below)', 'The pay for the role, which this model does not hold', 'Somewhere to post it'], effort: '8 to 12 hours over four weeks (estimate)', cost: { oneOff: null, recurring: null, note: 'the role’s pay is not in the model: set it before you post' },
    doneWhen: 'The person delivers a first week on the checklist without you.', measure: `${cap(x.unitMany)} delivered a month against today’s${x.servedNow ? ` ${count(x.servedNow)}` : ''}; your own hours.`,
    changeCourseIf: 'Enquiries do not fill the new capacity inside eight weeks: pause a second hire.', asset: 'delivery-checklist',
    weekOne: [['Write the delivery checklist', 'the checklist, step by step', 'someone new could follow it'], ['Decide the role and ask your network', 'the role in one paragraph; three people asked', 'one conversation is booked']],
    thirty: [['Weeks 1 to 2', 'the checklist, the role, the asks', 'day 14: candidates in hand'], ['Weeks 3 to 4', 'choose, agree terms, start the handover', 'day 30: first week delivered on the checklist']],
  }),
  'Deliver more per person': (x) => ({
    steps: ['List the steps of one delivery and time each for a week.', 'Cut or automate the two that take longest and add least; the free tools under Resources cover booking, forms and reminders.', 'Set a weekly capacity figure and track delivered against it.'],
    responsible: 'You', needs: ['One week of timings', 'The delivery checklist (below)'], effort: '4 to 6 hours in week one, then 1 hour a week (estimate)', cost: { oneOff: 0, recurring: 0 },
    doneWhen: 'Two steps are cut or automated and the weekly figure is set.', measure: `${cap(x.unitMany)} delivered a month per person against today’s.`,
    changeCourseIf: 'Complaints rise or waits lengthen after the change.', asset: 'delivery-checklist',
    weekOne: [['Time one delivery, step by step', 'a list of steps with minutes against each', 'the two longest are named'], ['Cut or automate the two longest', 'the shorter checklist', 'one delivery runs on it']],
    thirty: [['Weeks 1 to 4', 'run every delivery on the shorter checklist; set the weekly figure', 'day 14: minutes saved a delivery; day 30: delivered a month']],
  }),
  'Raise the growth budget': (x) => ({
    steps: [`Set the monthly figure${x.bStar ? `: ${gbp(x.bStar)}, the smallest budget whose middle run reaches the target` : ''} and the routes it goes to (the Routes in card).`, 'Put it on one route first for four weeks and count enquiries by route on the tracking sheet below.', 'Move the money to the route that brings enquiries at the lowest cost.'],
    responsible: x.who('spending'), needs: ['A way to count enquiries by route (the tracking sheet)', 'The Routes in card'], effort: '2 hours to set up, then 1 hour a week (estimate)', cost: { oneOff: 0, recurring: x.bStar ?? x.budget ?? null, note: 'the growth spend itself' },
    doneWhen: 'The spend is running and every enquiry is tagged with its route.', measure: 'Cost for each enquiry, by route, each month.',
    changeCourseIf: `After eight weeks the routes bring fewer enquiries than the plan needs${x.funnel ? ` (${x.funnel})` : ''}.`, asset: 'route-tracking-sheet',
    weekOne: [['Set the figure and the first route', 'the spend set up on one route', 'the first enquiry arrives tagged'], ['Start the tracking sheet', 'the sheet with a row an enquiry', 'every enquiry has a route against it']],
    thirty: [['Weeks 1 to 4', 'one route, counted weekly', 'day 14: enquiries and cost so far; day 30: cost an enquiry by route']],
  }),
  'Add sending mailboxes': () => ({
    steps: ['Add two mailboxes on a second domain and warm them for two weeks before any sending.', 'Keep each mailbox under thirty messages a day.', 'Watch bounces and replies weekly; stop a mailbox whose bounces pass 3%.'],
    responsible: 'You, or whoever runs the sending', needs: ['A second domain', 'The sending tool you use now'], effort: '3 hours to set up, then 30 minutes a week (estimate)', cost: { oneOff: null, recurring: null, note: 'a domain and mailboxes cost money the model does not hold' },
    doneWhen: 'Two warmed mailboxes are sending under the daily cap.', measure: 'Replies for every hundred sent; bounces under 3%.',
    changeCourseIf: 'Bounces pass 3% or replies fall as volume rises.', asset: 'route-tracking-sheet',
    weekOne: [['Register the domain and the mailboxes', 'two mailboxes warming', 'the warm-up is running']],
    thirty: [['Weeks 1 to 2', 'warm up', 'day 14: deliverability clean'], ['Weeks 3 to 4', 'send under the cap', 'day 30: replies for every hundred']],
  }),
  'Raise your margin': (x) => ({
    steps: ['List every cost of one delivery.', 'Cut the two largest a client would not notice.', 'Re-quote the next five jobs on the new cost base.'],
    responsible: 'You', needs: ['Last month’s costs', 'The next five quotes'], effort: '3 to 4 hours (estimate)', cost: { oneOff: 0, recurring: 0 },
    doneWhen: 'Five jobs are quoted on the new cost base.', measure: `Margin on those five jobs against today’s ${Math.round(x.margin * 100)}p in the £.`,
    changeCourseIf: 'Quality complaints follow the cuts.', asset: 'delivery-checklist',
    weekOne: [['List the costs of one delivery', 'the cost list', 'the two largest are marked']],
    thirty: [['Weeks 1 to 4', 'cut two costs, quote five jobs on the new base', 'day 30: margin on the five']],
  }),
  'Keep customers longer': (x) => ({
    steps: ['Set a check-in at day 30 and day 90 with the message below.', 'Ask the last three customers who left why they left, in one message each.', 'Offer a continuing arrangement where the work repeats.'],
    responsible: 'You', needs: ['The check-in message (below)', 'The last three who left'], effort: '2 hours in week one, then 30 minutes a week (estimate)', cost: { oneOff: 0, recurring: 0 },
    doneWhen: 'Every customer has a day-30 and day-90 check-in booked.', measure: `Customers staying past ${x.retention ? plural(Math.round(x.retention), 'month', 'months') : 'the usual point'}; repeat purchases.`,
    changeCourseIf: 'The three who left name the same cause: fix that first.', asset: 'check-in-message',
    weekOne: [['Write the check-in and send it to this month’s day-30 customers', 'the message, sent', 'replies are logged'], ['Ask the last three who left', 'three messages sent', 'at least one answer']],
    thirty: [['Weeks 1 to 4', 'check in at day 30 and day 90; offer the continuing arrangement', 'day 30: replies and any customer kept']],
  }),
};
/** the standard action card (brief 13.3) for a ranked step, with what it affects on the tree (R10) */
function actionFor(s, x, i) {
  const kit = (ACTION_KITS[s.title] ?? (() => ({ steps: [`Take the step: ${s.title.toLowerCase()}.`, 'Write down what it changed after four weeks.'], responsible: 'You', needs: [], effort: 'not estimated', cost: { oneOff: null, recurring: null }, doneWhen: 'The step is taken.', measure: 'Revenue a month against today’s.', changeCourseIf: 'Nothing has moved after eight weeks.', asset: null, weekOne: [], thirty: [] })))(x);
  const section = SECTION_OF_DRIVER[s.driver] ?? 'reach';
  const upside = near(s.magnitude) >= 1 ? `+${gbp(near(s.magnitude))} on the middle run over twelve months (modelled upside, not a guarantee)` : '';
  const dependency = s.restraint && !/^none/i.test(s.restraint) ? s.restraint : '';
  return {
    id: `${idOf(s.title)}-${i + 1}`, action: s.title, rank: s.rank, score: s.score, difficulty: s.difficulty, upside, fromAnswers: false,
    whyFirst: i === 0 ? `Return rank 1: of the steps Mercer tested, this adds most revenue for its difficulty (${DIFFICULTY[s.difficulty] ?? s.difficulty}).${dependency ? ` Restraint: ${dependency}.` : ''}` : `Return rank ${s.rank}, score ${s.score} of 100, ${DIFFICULTY[s.difficulty] ?? s.difficulty}.${dependency ? ` Restraint: ${dependency}.` : ''}`,
    steps: kit.steps, responsible: kit.responsible, needs: kit.needs, effort: kit.effort, cost: kit.cost, doneWhen: kit.doneWhen, measure: kit.measure,
    changeCourseIf: [kit.changeCourseIf, dependency ? `Review if ${dependency}.` : ''].filter(Boolean).join(' '), asset: kit.asset,
    affects: { limb: s.driver, section, dependency, outcome: upside, milestone: kit.doneWhen },
    weekOne: kit.weekOne, thirty: kit.thirty,
  };
}
/** the founder and control actions as cards, flagged: they come from the visitor's answers, not the forecast (R17, R18) */
const answerActionCard = (a, i) => ({ id: `answer-${i + 1}`, action: a.text, fromAnswers: true, from: a.from, whyFirst: a.why || `${ANSWER_ACTIONS}: ${a.from === 'Control' ? 'who decides, now and later' : 'what you said about your own role'}.`, steps: [a.text], responsible: 'You', needs: [], effort: 'not estimated', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'It is written down and the people it names have seen it.', measure: 'Your own check at day 30.', changeCourseIf: '', asset: null, affects: { limb: 'trunk', section: a.from === 'Control' ? 'control' : 'you', dependency: '', outcome: '', milestone: 'written down' }, weekOne: [], thirty: [] });
/* the execution materials: templates with the visitor's own details in them, copyable whole (brief 13.2, 13.4) */
function assetsFor(actions, x) {
  const need = new Set(actions.map((a) => a.asset).filter(Boolean));
  const biz = x.biz;
  const out = [];
  const add = (id, title, kind, lines) => { if (need.has(id)) out.push({ id, title, kind, text: lines.filter((l) => l !== null && l !== undefined).join('\n'), forActions: actions.filter((a) => a.asset === id).map((a) => a.id) }); };
  add('offer-sheet', 'Offer sheet', 'template', [`${biz}: the offer`, '', `What one sale is: [what the client gets, in one line]`, `The figure: ${gbp(near(x.acv * 1.1))} (today ${gbp(x.acv)})`, `Who it is for: ${x.bestClients || '[the customers you want more of]'}`, 'What is included: [three lines]', 'What is not: [one line]', 'How it starts: [the first step after yes]', '', `From ${x.monday}, every new quote carries this figure.`]);
  add('outreach-message', 'Outreach message', 'message', [`Subject: [one specific thing about them]`, '', 'Hello [name],', '', `[One line on what you noticed about their business.] At ${biz} we ${x.does}.`, `${x.proof ? `${x.proof} ` : ''}Would fifteen minutes this week be worth it to see whether it fits? If not, no reply needed.`, '', `[Your name], ${biz}`, '', 'Who to write to: [who they are, what they need, what they have tried]', 'Ten a day. Log every reply.']);
  add('enquiry-reply', 'Enquiry reply and day-three follow-up', 'message', ['First reply (inside a working day):', '', 'Hello [name], thanks for getting in touch. [One line that shows you read what they sent.] The quickest way to see whether we fit is a short call: [booking link]. If you would rather, reply with a time that suits you.', '', `[Your name], ${biz}`, '', 'Day three, if no reply:', '', 'Hello [name], following up on my note. If the timing is wrong, say so and I will leave it there. If it helps, here is [one useful thing]. [booking link]']);
  add('delivery-checklist', 'Delivery checklist', 'checklist', [`${biz}: one delivery, step by step`, '', '1. [What happens first, and who does it]', '2. [The next step]', '3. [The next step]', '4. [What the customer receives, and when]', '5. [What is checked before it goes out]', '6. [What is recorded afterwards]', '', `Capacity now: ${x.capacityLine}`, 'Time each step for a week before changing it.']);
  add('check-in-message', 'Customer check-in message', 'message', ['Day 30:', '', 'Hello [name], a month in: is [the work] doing what you hoped? One line back is enough; if anything is off, I would rather hear it now.', '', 'Day 90:', '', 'Hello [name], three months in. [One line on a result you have seen.] If it is worth continuing, I can set it up to run [monthly or quarterly]; if not, no reply needed.', '', `[Your name], ${biz}`]);
  add('route-tracking-sheet', 'Route tracking sheet', 'sheet', ['date,route,enquiry,replied,call booked,closed,spend', `${new Date().toISOString().slice(0, 10)},[route],[name],,,,`, '', 'One row an enquiry. Count each column weekly. Cost an enquiry = spend / enquiries, by route.']);
  return out;
}
/* the advantages the answers show, for the recap's second chapter and the summary (brief 8.1): held figures only */
function advantagesOf(p) {
  const out = [];
  const rep = p.repeat;
  if (givenNum(rep) && rep >= 0.5 && !unsure('repeat')) out.push({ title: 'Repeat business', line: `${Math.round(rep * 10)} in 10 customers buy again.` });
  if (!notGiven('network') && Number(state.network) > 0) out.push({ title: 'A network to ask', line: `${count(state.network)} contacts you can ask for introductions.` });
  if (!notGiven('topShare') && Math.round(state.topShare) >= 1 && Math.round(state.topShare) < 25) out.push({ title: 'A spread base', line: `Your top three clients are ${Math.round(state.topShare)}% of revenue: no one client carries you.` });
  const cap = state.capacity, served = p.servedNow ?? state.servedNow;
  if (givenNum(cap) && givenNum(served) && served < cap * 0.7) out.push({ title: 'Spare capacity', line: `You deliver ${count(served)} of the ${count(cap)} ${unitWord(p, cap)} a month you can handle.` });
  const st = listOf(state.strengths);
  if (st.length) out.push({ title: 'Strengths you named', line: st.slice(0, 3).join(', ') + '.' });
  if (givenNum(state.yearsTrading) && state.yearsTrading >= 3) out.push({ title: `${count(state.yearsTrading)} years trading`, line: `${count(state.yearsTrading)} years of customers and work to build on.` });
  return out.slice(0, 3);
}
/** the local plan object: the R17 shape over the present engine. null when no forecast has landed (nothing to plan from). */
function localPlan() {
  const p = plan();
  if (!p || routeOf() === 'starter') return null; // the starter route has no local builder: plan.js and starter.js supply it
  const key = `${safeKey()}|${ladderNow() ? 'l' : ''}|${revisionNow()}|${state.appetite ?? ''}`;
  if (localPlanCache.key === key) return localPlanCache.value;
  const m = goalMonth();
  const when = monthName(m);
  const r = rangeAt(m, p);
  const lad = ladderNow();
  const lim = limit();
  const ranked = steps();
  const ctrl = controlView();
  const rights = ctrl ? Object.fromEntries(ctrl.map.map((q) => [q.id, q.now])) : {};
  const x = {
    biz: bizName(), acv: p.acv, close: p.close, margin: p.margin, retention: p.retention, capacity: p.capacity, servedNow: p.servedNow ?? state.servedNow ?? null, budget: noSpend() ? null : p.budget, bStar: lad?.bStar ?? null, monday: nextMonday(),
    unitMany: unitWord(p, 2), listN: Math.max(30, Math.min(200, Math.round((lad?.funnel?.leadsNeeded ?? 3) * 20))), enquiries: givenNum(state.enquiries) ? state.enquiries : null,
    funnel: lad?.funnel ? funnelWords(lad.funnel).replace(/^That is /, '').replace(/\.$/, '') : '', capacityLine: `${count(p.capacity)} ${unitWord(p, p.capacity)} a month${state.capacity === null || state.capacity === undefined ? ' (Mercer’s estimate)' : ''}`,
    bestClients: Array.isArray(state.lastFive) && state.lastFive.length ? 'the kind of customer your best clients are' : '', does: state.note ? `[what you do, from your note]` : '[what you do, in one line]', proof: '',
    who: (decision) => (rights[decision] === 'shared' ? 'You, with whoever shares this decision' : rights[decision] === 'team' ? 'The team, as you have set it' : 'You'),
  };
  const engineActions = ranked.map((s, i) => actionFor(s, x, i));
  const fromAnswers = answerActions().map(answerActionCard);
  const actions = [...engineActions, ...fromAnswers];
  const primaries = engineActions.slice(0, 3);
  const waits = engineActions.slice(3).map((a) => ({ id: a.id, action: a.action, why: `Waits: it competes for the same hours as the three above, and its return is lower (score ${a.score} of 100).` }));
  const first = actions[0] ?? null;
  const assumedRows = inputs().filter((row) => row.from === 'assumed' || row.from === 'sector' || row.from === 'derived');
  const sens = [...(p.sensitivity ?? [])].sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));
  const keyUnknown = assumedRows.find((row) => sens.some((s) => INPUT_WORDS[s.inputId]?.key === row.key)) ?? assumedRows[0] ?? null;
  const unknowns = [
    ...[...(state.notSure ?? [])].map((id) => ({ id, title: titleOf(id), why: 'You said Not sure.' })),
    ...assumedRows.map((row) => ({ id: row.key, title: row.label, why: `${cap(FROM_WORD(row.from))}: ${row.value}. Your figure would replace it.` })),
  ];
  const evidence = inputs().map((row) => ({ id: row.key, title: row.label, value: row.value, source: FROM_WORD(row.from), kind: FROM_KIND(row.from) }));
  const evidenceIds = (state.asked ?? []).filter((id) => answeredQ(id));
  const findingSection = lim ? lim.section : ranked[0] ? SECTION_OF_DRIVER[ranked[0].driver] : 'crown';
  const finding = {
    short: lim ? lim.short : ranked[0] ? ranked[0].title : 'The forecast', title: lim ? lim.name : 'What matters most',
    text: lim ? `${cap(limitWords(lim))}.${lim.lever ? ` The step that lifts it: ${lim.lever}.` : ''}` : `${noLimitWords()}${ranked[0] ? ` The step that adds most is ${ranked[0].title.toLowerCase()}${near(ranked[0].magnitude) >= 1 ? `, +${gbp(near(ranked[0].magnitude))} on the middle run over twelve months` : ''}.` : ''}`,
    evidence: [evRow(lim?.type === 'client_capacity' ? 'capacity' : lim?.type === 'market_depletion' ? 'market' : 'channels'), evRow('revenue')].filter(Boolean).map((e) => `${e.title}: ${e.value} (${e.source})`),
    section: findingSection, limb: lim ? LIMIT_BRANCH[lim.type] : ranked[0]?.driver ?? null, constraint: lim ? { type: lim.type, name: lim.name, month: lim.month } : null,
  };
  const goalText = noSpend() ? 'No growth spend' : basis() === 'revenue' && state.goal ? `${gbp(state.goal)} a month` : `${gbp(p.budget)} a month of growth spend`;
  const noneP50 = lad?.appetite?.none?.p50 ?? null;
  const supported = !noSpend() && runsOf(p) > 0;
  const scenarios = [
    { id: 'current', label: 'Current', baseline: p.base, value: noneP50 ?? p.base, unit: 'a month', period: when, assumptions: ['revenue carried as it is, no growth spend'], source: noneP50 !== null ? 'the ladder’s None level' : 'revenue today' },
    { id: 'plan', label: 'Plan', baseline: p.base, value: r.p50, low: r.p10, high: r.p90, target: basis() === 'revenue' ? state.goal : null, unit: 'a month', period: when, budget: noSpend() ? 0 : p.budget, interval: 'a modelled range between the downside and favourable assumption sets, not a statistical interval', assumptions: [`growth spend ${noSpend() ? 'none' : `${gbp(p.budget)} a month`}`, ...assumedRows.map((row) => `${row.label}: ${row.value}, ${FROM_WORD(row.from)}`)] },
  ];
  const path = lad ? pathWords(p, lad, m) : null;
  const rp = noSpend() ? null : returnPerPound();
  const economics = supported ? [overall(), ...(path ? [path.lead, path.month, path.funnel, path.room].filter(Boolean) : []), rp !== null && rp >= 0.005 ? `£${rp.toFixed(2)} of added revenue for each £1 of growth spend over twelve months.` : '', p.payback?.p50 !== undefined && oneDp(p.payback.p50) !== '0' ? `Pays back in ${pluralDp(p.payback.p50, 'month', 'months')}.` : '', rangeNote(p)].filter(Boolean) : [];
  const notUseful = supported ? '' : noSpend() ? 'You chose no growth spend, so the forecast carries revenue flat: there is no scenario to compare.' : 'No forecast run has landed for these answers, so no scenario is quantified.';
  const tools = freeTools();
  const draft = {
    id: `plan-${Math.abs([...key].reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0)).toString(36)}`, route: 'owner', revision: revisionNow(), generatedAt: new Date().toISOString(), generatedOn: today(), status: 'deterministic', source: 'engine',
    business: bizName(), industry: ind() ? ind().name : null, currency: 'GBP',
    goal: { text: `${goalText} by ${when}${listOf(state.protected).length ? `, keeping ${listOf(state.protected).join(', ')} protected` : ''}.`, figure: goalText, amount: basis() === 'revenue' ? state.goal : null, target: basis() === 'revenue' ? state.goal : null, month: m, when, horizon: `${plural(m, 'month', 'months')} from now`, basis: basis(), protected: listOf(state.protected) },
    situation: `Revenue today is ${gbp(p.base)} a month.`, advantages: advantagesOf(p), finding, evidenceIds, evidence, unknowns, keyUnknown: keyUnknown ? `${keyUnknown.label}: ${keyUnknown.value}, ${FROM_WORD(keyUnknown.from)}` : '',
    firstAction: first, alternatives: engineActions.slice(1, 3), actions, primaries: primaries.map((a) => a.id), waits,
    weekOne: (first?.weekOne ?? []).map(([task, output, check]) => ({ task, owner: first.responsible, effort: `part of ${first.effort}`, cost: first.cost?.oneOff === 0 && first.cost?.recurring === 0 ? 'nothing' : 'see the card', output, check })),
    thirtyDays: [...(first?.thirty ?? []).map(([week, work, review]) => ({ when: week, work: `${first.action}: ${work}`, review })), ...(engineActions[1] ? [{ when: 'Weeks 3 to 4', work: `Start ${engineActions[1].action.toLowerCase()} once the first action’s week-one output exists.`, review: `day 30: ${engineActions[1].measure}` }] : [])],
    ninetyDays: first ? { condition: `If by day 30 ${first.measure.replace(/\.$/, '').charAt(0).toLowerCase()}${first.measure.replace(/\.$/, '').slice(1)} has moved the right way`, then: engineActions[2] ? `carry on and add ${engineActions[2].action.toLowerCase()}; if not, ${first.changeCourseIf.charAt(0).toLowerCase()}${first.changeCourseIf.slice(1)}` : `carry on; if not, ${first.changeCourseIf.charAt(0).toLowerCase()}${first.changeCourseIf.slice(1)}`, note: 'Conditional on the 30-day evidence. Nothing here is certain.' } : null,
    scenarios: supported ? scenarios : [], economics, notUseful,
    resourceTotals: { hours: 'the estimates on each card', oneOff: engineActions.reduce((a, b) => a + (Number(b.cost?.oneOff) || 0), 0), recurring: engineActions.reduce((a, b) => a + (Number(b.cost?.recurring) || 0), 0), unknown: engineActions.filter((a) => a.cost?.oneOff === null || a.cost?.recurring === null).map((a) => a.action) },
    resources: null, assets: assetsFor(actions, x),
    sources: [...(() => { const w = weather(); const mac = M.macro; return mac && w.head?.length ? [...w.head, ...w.sector].map((row) => ({ title: mac.rowLine(row), url: row.url, date: row.asOf ?? null, kind: 'benchmark' })) : []; })(), { title: `Engine ${p.engineVersion ?? ''}, prior pack ${p.packVersion ?? ''} (UK figures)`, url: null, date: null, kind: 'engine' }],
    successMeasures: primaries.map((a) => a.measure), reviewConditions: primaries.map((a) => a.changeCourseIf).filter(Boolean),
    method: methodOf(), tmaBrief: { summary: `${finding.text} First action: ${first?.action ?? 'none yet'}.`, needs: uniq(primaries.flatMap((a) => a.needs)) },
    report: report(),
  };
  /* Resources and purchases through freetools.forPlan when brain supplies it; else this file's own grouping of the free rows */
  let res = null;
  try { res = typeof M.freetools?.forPlan === 'function' ? M.freetools.forPlan(draft) : null; } catch (e) { res = null; }
  if (!res || typeof res !== 'object') {
    const ft = tools?.ft ?? M.freetools;
    const line = (u) => (u.rows ?? []).map((row) => { try { return ft.line(row, u.id); } catch (e) { return ''; } }).filter(Boolean);
    const owned = (tools?.used ?? []).map((u) => ({ item: `${ft?.categoryName?.(u.id) ?? u.id}${u.fee >= 1 ? `, ${gbp(u.fee)} a month` : ''}`, status: 'you named it', free: line(u).slice(0, 1) }));
    const firstNeeds = new Set(['crm', 'email', 'booking']);
    const shown = tools?.shown ?? [];
    const essential = shown.filter((u) => firstNeeds.has(u.id)).map((u) => ({ item: ft?.categoryName?.(u.id) ?? u.id, status: 'free option', free: line(u).slice(0, 2) }));
    const later = shown.filter((u) => !firstNeeds.has(u.id)).map((u) => ({ item: ft?.categoryName?.(u.id) ?? u.id, status: 'later only', free: line(u).slice(0, 1) }));
    const avoid = first?.action === 'Find more prospects' ? [{ item: 'A paid list or ads', status: 'avoid for now', why: 'until the free routes have brought replies' }] : [];
    res = { owned, essentialNow: essential, later, avoid, verified: 'costs are the tools’ own published terms as freetools.js records them; check before you buy' };
  }
  draft.resources = res;
  localPlanCache.key = key;
  localPlanCache.value = draft;
  return draft;
}
/* ============ Rebuild 1: one shape for the renderer ============
   plan.js's plan (R17), the local builder's and a test fixture differ in small ways: plan.js says finding.headline where this
   file reads finding.short, groups actions by status where this file reads primaries and waits, gives a cost as an object
   with a label, and keys a scenario by an interval object. normPlan reads them all into the fields the recap, the plan view
   and the exports use, adding nothing that is not in the plan (a derived field is derived from the plan alone). live: the
   page's own counts may be read for the Method rows; false for the example sandbox. */
const AREA_PART = { capacity: ['delivery', 'capacity'], process: ['delivery', 'capacity'], offer: ['offer', 'pricing'], cash: ['money', 'margin'], buyer: ['reach', 'demand'], channel: ['routes', 'demand'], conversion: ['close', 'conversion'], trust: ['close', 'conversion'], retention: ['clients', 'retention'], delegation: ['you', 'trunk'], control: ['control', 'trunk'], discovery: ['crown', 'crown'], direction: ['offer', 'pricing'], test: ['close', 'conversion'], launch: ['routes', 'demand'] };
const EV_KIND = { user: 'you', imported: 'web', source: 'sector', assumed: 'assumed', calculated: 'assumed', unknown: 'assumed' };
const EV_WORD = { user: 'your answer', imported: 'your website/document', source: 'source', assumed: 'assumption', calculated: 'calculated', unknown: 'not known yet' };
/** an evidence row's own name: a field row is named by its question, not by its state ("Your answer" is the state word and
    would read "Your answer: no (your answer)"); a calculated or source row carries its own title. */
const evTitle = (e) => { if (!e) return ''; if (e.title && e.title !== e.label) return e.title; const id = String(e.id ?? ''); if (/^(calc|assume|src):/.test(id)) return e.title ?? e.label ?? id; const t = titleOf(id); return t && t !== id ? t : (e.title ?? e.label ?? id); };
/* an object value printed itself as [object Object] in the evidence lines; it is read for its own words, and an object with
   none of them carries no value at all rather than a placeholder */
const evValue = (e) => (Array.isArray(e.value) ? e.value.map((v) => strOf(v) || String(v)).filter(Boolean).join(', ') : typeof e.value === 'number' ? (e.unit === 'GBP' ? gbp(e.value) : `${count(e.value)}${e.unit ? ` ${e.unit}` : ''}`) : e.value && typeof e.value === 'object' ? strOf(e.value) : e.value);
/* an object value with no words prints nothing, so a line never reads "What you tried:  (not known yet)" */
const evWords = (e) => { if (!e) return ''; const v = e.value === null || e.value === undefined ? '' : String(evValue(e) ?? '').trim(); return `${evTitle(e)}${v ? `: ${v}` : ''} (${EV_WORD[e.state] ?? e.state ?? 'not known yet'})`; };
/** the evidence row for an id, from the plan's own evidence list first, then plan.js's resolver */
const evOf = (pl, id) => (pl.evidence ?? []).find((e) => e.id === id) ?? (() => { try { return M.plan?.evidence?.(id, pl) ?? null; } catch (e) { return null; } })();
const assetFor = (assets, a) => (assets ?? []).find((s) => s.id === a?.asset || s.kind === a?.asset || (typeof a?.asset === 'string' && s.id === `asset:${a.asset}`)) ?? null;
/** whether the forecast's depth (the months, the path, the alignment score, the weather) belongs with this plan: the owner
    route with a run behind it. The starter route has no forecast, so it carries no appendix and no alignment block. */
const hasDepth = (pl) => !!(pl && pl.route !== 'starter' && plan() && report());
function normPlan(pl, o = {}) {
  if (!pl || typeof pl !== 'object' || pl.normalised) return pl;
  const out = { ...pl, normalised: true };
  /* the goal: a figure for the recap, the month by name, the sentence for the summary */
  const g = pl.goal && typeof pl.goal === 'object' ? pl.goal : { text: String(pl.goal ?? '') };
  const months = Number(g.months ?? g.month);
  const when = g.when ?? (Number.isFinite(months) && months > 0 ? monthName(months) : '');
  const figure = g.figure ?? (Number.isFinite(Number(g.target)) && Number(g.target) > 0 ? `${gbp(g.target)} a month` : g.amount ? `${gbp(g.amount)} a month` : g.words ? cap(String(g.words)) : wordsOf(g.text) || 'Your goal');
  out.goal = { ...g, when, figure, text: g.text ?? `${figure}${when ? ` by ${when}` : ''}`, protected: listOf(g.protected) };
  /* the finding: short and title from the headline; the tree part from the area; the evidence lines from the ids */
  const f = pl.finding && typeof pl.finding === 'object' ? pl.finding : { text: String(pl.finding ?? '') };
  const part = AREA_PART[f.area] ?? null;
  out.finding = { ...f, short: f.short ?? f.headline ?? f.title ?? '', title: f.title ?? f.headline ?? f.short ?? '', text: f.text ?? '', section: f.section ?? part?.[0] ?? null, limb: f.limb ?? part?.[1] ?? null, evidence: listOf(f.evidence).length ? listOf(f.evidence) : listOf((f.evidenceIds ?? []).slice(0, 3).map((id) => evWords(evOf(pl, id)))) };
  /* the actions: a rank, the tree part, the dependency, the outcome (a lever scenario the plan supports) or the milestone */
  const scen = Array.isArray(pl.scenarios) ? pl.scenarios : [];
  const engineActs = (pl.actions ?? []).filter((a) => a && typeof a === 'object').map((a, i) => {
    const ap = AREA_PART[a.area] ?? null;
    const lever = a.scenarioId ? scen.find((s) => s.id === a.scenarioId) : null;
    const outcome = a.affects?.outcome ?? (lever && Number.isFinite(Number(lever.value)) ? `${gbp(near(Number(lever.value)))} added over ${lever.period ?? 'twelve months'} on the middle run alone (a point estimate${lever.assumption ? `; ${lever.assumption}` : ''})` : '');
    return { ...a, rank: a.rank ?? a.priority ?? i + 1, fromAnswers: !!a.fromAnswers, refined: a.refined ?? [], affects: { limb: a.affects?.limb ?? ap?.[1] ?? null, section: a.affects?.section ?? ap?.[0] ?? null, dependency: a.affects?.dependency ?? listOf(a.dependsOn).join('; '), outcome, milestone: a.affects?.milestone ?? wordsOf(a.doneWhen) } };
  });
  /* the founder and control actions travel as cards flagged from the answers, apart from the forecast's */
  const fromAnswers = [];
  const addAnswers = (from, list) => (Array.isArray(list) ? list : []).forEach((x, i) => { const t = wordsOf(x); if (t && !engineActs.some((a) => wordsOf(a.action) === t)) fromAnswers.push(answerActionCard({ text: t, why: x && typeof x === 'object' ? wordsOf(x.why ?? x.because) : '', from }, fromAnswers.length + i)); });
  if (pl.founder?.actions) addAnswers('Founder', pl.founder.actions);
  if (pl.control?.actions) addAnswers('Control', pl.control.actions);
  out.actions = [...engineActs, ...fromAnswers.filter((a) => !engineActs.some((e) => e.id === a.id))];
  const engine = out.actions.filter((a) => !a.fromAnswers);
  out.firstAction = out.actions.find((a) => a.id === (pl.firstAction?.id ?? null)) ?? engine[0] ?? out.actions[0] ?? null;
  out.primaries = Array.isArray(pl.primaries) && pl.primaries.length ? pl.primaries : engine.filter((a) => a.status === 'primary').map((a) => a.id);
  if (!out.primaries.length) out.primaries = engine.slice(0, 3).map((a) => a.id);
  out.waits = Array.isArray(pl.waits) && pl.waits.length ? pl.waits : engine.filter((a) => a.status === 'waits').map((a) => ({ id: a.id, action: a.action, why: a.waitReason ?? '' }));
  out.next = engine.filter((a) => a.status === 'next').map((a) => ({ id: a.id, action: a.action }));
  /* week one, 30 days, 90 days: rows, whatever form the plan holds them in; the owner plan derives week one from its first card */
  const rowsOf = (list, key) => listOf(list).map((t) => ({ [key]: t }));
  const first = out.firstAction;
  out.weekOne = Array.isArray(pl.weekOne) && pl.weekOne.length ? pl.weekOne.map((w) => (typeof w === 'string' ? { task: w } : w)) : first ? listOf(first.steps).slice(0, 4).map((t, i, arr) => ({ task: t, owner: wordsOf(first.responsible), effort: i === 0 ? wordsOf(first.effort) : '', cost: i === 0 ? costWords(first.cost) : '', output: '', check: i === arr.length - 1 ? wordsOf(first.doneWhen) : '' })) : [];
  out.thirtyDays = Array.isArray(pl.thirtyDays) && pl.thirtyDays.length ? pl.thirtyDays.map((w) => (typeof w === 'string' ? { work: w } : w)) : [];
  const n = pl.ninetyDays;
  out.ninetyDays = !n ? null : typeof n === 'string' ? { then: n } : { condition: n.condition ?? n.if ?? '', then: n.then ?? n.direction ?? '', otherwise: n.else ?? n.otherwise ?? '', note: n.note ?? '' };
  /* scenarios: the value with its period; the interval's low and high; the basis and the assumption as the assumptions */
  out.scenarios = scen.map((s) => ({ ...s, low: s.low ?? s.interval?.low, high: s.high ?? s.interval?.high, intervalKind: s.intervalKind ?? (typeof s.interval === 'string' ? s.interval : s.interval?.kind ?? ''), assumptions: listOf(s.assumptions).length ? listOf(s.assumptions) : listOf([s.basis, s.assumption]), period: s.period ?? s.unit ?? '' }));
  out.notUseful = pl.notUseful ?? (pl.scenarioNote && pl.scenarioNote.supported === false ? wordsOf(pl.scenarioNote.why) : '');
  const cons = pl.constraint && typeof pl.constraint === 'object' ? pl.constraint : null;
  out.economics = listOf(pl.economics).length ? listOf(pl.economics) : listOf([pl.goalPath?.text, cons ? (cons.found ? `${cons.text}${cons.scope ? ` (${cons.scope})` : ''}` : `${cons.text}: ${cons.scope}.`) : '', ...(Array.isArray(pl.sensitivity) ? pl.sensitivity.map((x) => x.statement) : []), pl.scenarioNote?.combined?.note]);
  /* unknowns, the key unknown, the evidence rows, the situation */
  out.unknowns = listOf(pl.unknowns).length || !Array.isArray(pl.unknowns) ? (Array.isArray(pl.unknowns) ? pl.unknowns : []).map((u) => (typeof u === 'string' ? { title: u } : { ...u, title: u.title ?? u.label ?? u.id })) : [];
  out.keyUnknown = pl.keyUnknown ?? pl.readiness?.decisive?.label ?? out.unknowns[0]?.title ?? '';
  out.evidence = (pl.evidence ?? []).map((e) => (e && typeof e === 'object' ? { ...e, title: e.title ?? (e.state === 'user' || e.state === 'imported' || e.state === 'unknown' ? titleOf(e.id) : e.label ?? e.id), value: e.value === null || e.value === undefined ? '' : Array.isArray(e.value) ? e.value.join(', ') : typeof e.value === 'number' ? (e.unit === 'GBP' ? gbp(e.value) : `${count(e.value)}${e.unit ? ` ${e.unit}` : ''}`) : typeof e.value === 'object' ? strOf(e.value) : String(e.value), source: e.source ?? EV_WORD[e.state] ?? '', kind: e.kind ?? EV_KIND[e.state] ?? 'assumed' } : null)).filter(Boolean);
  const userRows = out.evidence.filter((e) => e.kind === 'you' && e.value);
  out.situation = pl.situation ?? (() => { const base = out.evidence.find((e) => e.id === 'calc:base' || e.id === 'now'); return base && base.value ? `Revenue today is ${base.value}${/a month/.test(base.value) ? '' : ' a month'}.` : pl.readiness?.note ?? ''; })();
  /* what the visitor already has (brief 8.1). Only an answer that is an advantage counts as one: advantagesOf reads the
     specific fields that say so (repeat custom, a network, spare capacity, strengths, years trading). An answer like "can you
     deliver more: no" is a constraint, not an advantage, so with nothing to name the chapter says what the plan stands on. */
  if (Array.isArray(pl.advantages) && pl.advantages.length) out.advantages = pl.advantages;
  else {
    let adv = [];
    if (o.live) { try { adv = advantagesOf(plan() ?? {}); } catch (e) { adv = []; } }
    out.advantages = adv.length ? adv : (userRows.length ? [{ title: 'Your own answers', line: `${plural(userRows.length, 'figure', 'figures')} in this plan came from you; the rest are named as Mercer’s estimates.` }] : []);
  }
  /* the starter's direction and what the person brings, from the fields plan.js and starter.js hold */
  if (pl.route === 'starter') {
    const d = pl.direction && typeof pl.direction === 'object' ? pl.direction : null;
    out.direction = d ? { ...d, title: d.title ?? d.name ?? '', why: d.why ?? d.fit ?? '', hardestUnknown: d.hardestUnknown ?? d.unknown ?? '' } : pl.direction ?? null;
    const st = pl.starter ?? null;
    const per = st?.person ?? (() => { try { return M.starter?.directions?.(state)?.person ?? null; } catch (e) { return null; } })();
    out.foundations = pl.foundations ?? { skills: listOf(st?.skills ?? per?.skills ?? per?.proven), access: listOf(st?.buyerProblem ? [st.buyerProblem] : []), time: st?.hours !== null && st?.hours !== undefined ? `${count(st.hours)} hours a week` : per?.hoursKnown ? `${count(per.hours)} hours a week` : '', resources: listOf(st?.toolsOwned ?? per?.tools) };
    out.toProve = pl.toProve ?? (st?.unproven ? [{ title: wordsOf(st.unproven), why: st.demandEvidence ? `Evidence of demand so far: ${wordsOf(st.demandEvidence)}.` : '' }] : out.unknowns.slice(0, 1));
    if (!Array.isArray(pl.advantages) || !pl.advantages.length) { const fl = [out.foundations.skills.length ? `Skills: ${out.foundations.skills.join(', ')}` : '', out.foundations.time ? `Time: ${out.foundations.time}` : '', out.foundations.resources.length ? `Resources: ${out.foundations.resources.join(', ')}` : ''].filter(Boolean); if (fl.length) out.advantages = fl.map((t) => ({ title: t.split(':')[0], line: t })); }
  }
  /* resources and purchases through freetools.forPlan when it exists (live), else what the plan carries */
  if (!pl.resources || typeof pl.resources !== 'object') {
    let res = null;
    if (o.live) { try { res = typeof M.freetools?.forPlan === 'function' ? M.freetools.forPlan(pl) : null; } catch (e) { res = null; } }
    if (res && typeof res === 'object') {
      const rowsOfTool = (u) => (Array.isArray(u.rows) ? u.rows.map((row) => { try { return M.freetools.line(row, u.id); } catch (e) { return ''; } }).filter(Boolean).slice(0, 2) : []);
      out.resources = { owned: (res.owned ?? []).map((u) => ({ item: `${u.tool ?? u.name}${u.fee >= 1 ? `, ${gbp(u.fee)} a month` : ''}`, status: 'you named it' })), essentialNow: (res.now ?? []).map((u) => ({ item: u.name, status: 'free option', free: rowsOfTool(u) })), later: (res.later ?? []).map((u) => ({ item: u.name, status: 'later only', free: rowsOfTool(u) })), avoid: (res.avoid ?? []).map((x) => ({ item: x.item, status: 'avoid for now', why: x.why })), verified: [res.note, res.check].filter(Boolean).join(' ') };
    } else if (pl.route === 'starter' && (pl.costs || pl.toolsOwned || pl.essentialGaps)) {
      out.resources = { owned: listOf(pl.toolsOwned).map((t) => ({ item: t, status: 'you named it' })), essentialNow: (Array.isArray(pl.costs) ? pl.costs : []).map((c) => ({ item: wordsOf(c.item ?? c), status: c.amount !== undefined ? `${typeof c.amount === 'number' ? gbp(c.amount) : c.amount}${c.label ? `, ${c.label}` : ''}` : '' })), later: [], avoid: [], verified: listOf(pl.essentialGaps).length ? `Gaps to close: ${listOf(pl.essentialGaps).join(', ')}.` : '' };
    } else out.resources = null;
  }
  /* the method: rows the page can show; plan.js gives the draws and a note */
  const mth = pl.method && typeof pl.method === 'object' ? pl.method : null;
  if (mth && !Array.isArray(mth.rows)) {
    const live = o.live ? methodOf() : null;
    out.method = mth.draws > 0 ? { words: live?.words ?? `Mercer puts the answers through its forecast engine ${count(mth.draws)} times, drawing every uncertain figure from a range, so the result is a spread of outcomes.`, rows: live?.rows ?? [['Runs per scenario', count(mth.draws)]], note: [mth.note, live?.note].filter(Boolean).join(' '), cached: live?.cached ?? false } : null;
  }
  out.assets = (pl.assets ?? []).map((s) => ({ ...s, id: s.id ?? `asset:${s.kind}`, title: s.title ?? s.kind ?? 'Material', text: s.text ?? '' })).filter((s) => s.text);
  out.sources = (pl.sources ?? []).map((s) => (typeof s === 'string' ? { title: s } : { ...s, title: s.title ?? s.sourceTitle ?? s.id ?? '', url: s.url ?? s.sourceUrl ?? null, date: s.date ?? s.sourceDate ?? null }));
  out.tmaBrief = pl.tmaBrief && typeof pl.tmaBrief === 'object' ? pl.tmaBrief : pl.tmaBrief ? { summary: String(pl.tmaBrief) } : null;
  out.business = pl.business ?? (o.live ? bizName() : pl.sample?.name ?? 'Your business');
  out.generatedOn = pl.generatedOn ?? (pl.generatedAt ? new Date(pl.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : today());
  return out;
}
/** the plan the page reads: plan.js's for this revision (stale when its revision is older), else the local builder's */
function planObj() {
  if (M.plan && typeof M.plan.current === 'function') {
    try {
      const c = M.plan.current();
      const pl = c && Array.isArray(c.actions) ? c : c?.plan && Array.isArray(c.plan.actions) ? c.plan : null;
      if (pl) return { plan: normPlan(withRefinement(pl), { live: true }), stale: !!c?.stale || (Number.isFinite(pl.revision) && pl.revision !== revisionNow()), source: 'plan.js' };
    } catch (e) { /* the local builder */ }
  }
  const pl = localPlan();
  return { plan: pl ? normPlan(withRefinement(pl), { live: true }) : null, stale: false, source: 'local' };
}
/** Build my plan: a plan.js plan left stale by a newer revision is built again on the press, never on load */
function freshPlan() {
  try { if (M.plan && typeof M.plan.rebuild === 'function' && M.plan.current?.()?.stale) { M.plan.rebuild(); localPlanCache.key = null; } } catch (e) { /* the stale one stands, labelled */ }
  return planObj();
}
/* C15, C18, U2: the Mission Alignment sentence is this file's own plain words (routeWords) and the fixed line. The engine's
   routing reason goes to the JSON export's engineReason and nowhere else. The face says the short form under the score it
   already shows; the exports say the long form. */
const ALIGN_TAIL = `TMA takes on work above ${TMA_BAR}; the call is open either way.`;
function alignmentLine(full) {
  const p = plan();
  if (!p) return ALIGN_TAIL;
  const w = routeWords(p);
  /* neither form says the score again: the face shows it above the sentence, the exports print it in the heading */
  return `${full ? [w.short, w.rest].filter(Boolean).join(' ') : w.short} ${ALIGN_TAIL}`.trim();
}
/* ============ Rebuild 1, R16: the runtime model's refinement of the plan ============
   The deterministic plan renders first and stands on its own. On a press (never on load) M.model.ownerPlan or starterPlan is
   asked to refine it; while the call is in flight the page says so in words, with no percentage; a response for an older
   revision is dropped; only validated string fields on an allow-list are merged, each marked Refined; a failure offers Retry. */
const modelState = { rev: null, status: 'idle', error: null, patch: null, at: null, controller: null };
/** model.js's available() is { host, status }: the model is offered when a host exists and the viewer has not declined it */
const modelAvailable = () => { try { const a = M.model?.available?.(); if (a === true) return true; return !!(a && typeof a === 'object' && a.host && a.status !== 'hidden'); } catch (e) { return false; } };
/** the model's reply (brief section 11 schema, validated by model.js) as a patch over the plan object: only the fields this
    file merges, by name. A patch in this file's own shape (finding, summary, actions[{ id | rank | action, ... }]) passes through. */
function patchOf(v, route) {
  if (!v || typeof v !== 'object') return null;
  if (v.actions || v.finding || v.summary) return v;
  if (route === 'starter') {
    const d = v.recommended ?? null;
    return { finding: d ? [d.first_offer, d.reason_it_fits].filter((t) => typeof t === 'string' && t).join(' ') : null, summary: typeof v.validation_test === 'string' ? v.validation_test : null, tmaBrief: typeof v.optional_tma_brief === 'string' ? v.optional_tma_brief : null };
  }
  const act = (a, rank) => (a && typeof a === 'object' ? { rank, action: a.title, whyFirst: a.why_now, steps: Array.isArray(a.steps) ? a.steps : undefined, responsible: a.owner_role, effort: a.time_required, doneWhen: a.intended_result, measure: a.success_measure, changeCourseIf: a.review_or_stop_condition } : null);
  const first = act(v.recommended_first_action, 1);
  const rest = (Array.isArray(v.sequenced_actions) ? v.sequenced_actions : []).map((a, i) => act(a, i + 2));
  return { finding: v.primary_finding, summary: v.goal_summary, actions: [first, ...rest].filter(Boolean), tmaBrief: typeof v.optional_tma_brief === 'string' ? v.optional_tma_brief : null };
}
const REFINE_FIELDS = ['whyFirst', 'doneWhen', 'measure', 'changeCourseIf', 'responsible', 'effort'];
const numsIn = (t) => String(t ?? '').match(/£?\d[\d,]*(?:\.\d+)?%?/g) ?? [];
/** a string the model wrote may be merged when it is a string, says something, and carries no number the plan does not */
const refinedStr = (v, seen) => { if (typeof v !== 'string') return null; const s = clean(v).trim(); if (!s) return null; return numsIn(s).every((n) => seen.has(n)) ? s : null; };
function withRefinement(pl) {
  const patch = modelState.patch;
  const rev = Number.isFinite(pl?.revision) ? pl.revision : revisionNow();
  if (!pl || !patch || modelState.status !== 'done' || modelState.rev !== rev) return pl;
  const seen = new Set(numsIn(JSON.stringify(pl)));
  const out = { ...pl, refined: [] };
  const fs = refinedStr(patch.finding?.text ?? patch.finding, seen);
  if (fs && pl.finding) { out.finding = { ...pl.finding, text: fs }; out.refined.push('finding'); }
  const ss = refinedStr(patch.summary, seen);
  if (ss) { out.summary = ss; out.refined.push('summary'); }
  const tb = refinedStr(patch.tmaBrief, seen);
  if (tb && pl.tmaBrief) { out.tmaBrief = { ...pl.tmaBrief, summary: tb }; out.refined.push('tmaBrief'); }
  const pa = Array.isArray(patch.actions) ? patch.actions : [];
  out.actions = (pl.actions ?? []).map((a) => {
    const m = pa.find((q) => q && (q.id === a.id || (Number.isFinite(q.rank) && q.rank === a.rank) || (typeof q.action === 'string' && q.action.trim().toLowerCase() === String(a.action).trim().toLowerCase())));
    if (!m) return a;
    const r = { ...a, refined: [...(a.refined ?? [])] };
    REFINE_FIELDS.forEach((k) => { const v = refinedStr(m[k], seen); if (v) { r[k] = v; r.refined.push(k); } });
    if (Array.isArray(m.steps) && m.steps.length) { const st = m.steps.map((s) => refinedStr(s, seen)); if (st.every(Boolean)) { r.steps = st; r.refined.push('steps'); } }
    return r;
  });
  out.firstAction = out.actions[0] ?? pl.firstAction;
  out.alternatives = out.actions.filter((a) => !a.fromAnswers).slice(1, 3);
  return out;
}
let lastGestureAt = 0;
document.addEventListener('pointerdown', () => { lastGestureAt = Date.now(); }, true);
document.addEventListener('keydown', () => { lastGestureAt = Date.now(); }, true);
const recentGesture = () => Date.now() - lastGestureAt < 1500;
async function refinePlan(pl, o = {}) {
  if (!modelAvailable() || !pl) return false;
  const rev = Number.isFinite(pl.revision) ? pl.revision : revisionNow();
  if (modelState.status === 'running' && modelState.rev === rev) return true;
  if (modelState.status === 'done' && modelState.rev === rev && !o.retry) return true;
  try { modelState.controller?.abort?.(); } catch (e) { /* none */ }
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  Object.assign(modelState, { rev, status: 'running', error: null, controller, at: new Date() });
  paintModelState();
  try {
    const kind = pl.route === 'starter' ? 'starterPlan' : 'ownerPlan';
    const fn = M.model[kind];
    if (typeof fn !== 'function') throw Object.assign(new Error('no planner'), { code: 'unavailable' });
    /* model.js builds the context (the evidence set, the calculator's outputs, the plan as data) from the plan object */
    let ctx = null;
    try { ctx = typeof M.model.contextFor === 'function' ? M.model.contextFor(kind, pl, { revision: rev, signal: controller?.signal }) : null; } catch (e) { ctx = null; }
    const res = await fn.call(M.model, ctx ?? { plan: pl, revision: rev, route: pl.route, signal: controller?.signal });
    if (modelState.rev !== rev) return false;
    if (revisionNow() !== rev || res?.code === 'stale') { modelState.status = 'stale'; paintModelState(); return false; }
    if (!res || res.ok === false || res.valid === false) throw Object.assign(new Error('invalid'), { code: res?.code ?? res?.error ?? 'invalid' });
    const patch = patchOf(res.value ?? res.plan ?? res.patch ?? res, pl.route);
    if (!patch) throw Object.assign(new Error('invalid'), { code: 'invalid' });
    modelState.patch = patch;
    modelState.status = 'done';
    modelState.at = new Date();
  } catch (e) {
    if (modelState.rev !== rev) return false;
    modelState.status = e?.code === 'cancelled' ? 'idle' : 'failed';
    modelState.error = String(e?.code ?? 'failed');
  }
  if (isPlanStage(stageNow())) paintPlan(false); else paintModelState();
  return modelState.status === 'done';
}
const MODEL_LINE = 'Sends your answers and this plan to Claude, with your consent; TMA sees none of it.';
function modelStateHtml(pl) {
  if (!modelAvailable() || !pl) return '';
  const rev = Number.isFinite(pl.revision) ? pl.revision : revisionNow();
  const s = modelState.rev === rev ? modelState.status : 'idle';
  if (s === 'running') return `<p class="plan-model" role="status">Refining with Claude… <span class="small">The plan above stands on its own; the refined lines replace nothing until they arrive.</span></p>`;
  if (s === 'done') return `<p class="plan-model">Refined with Claude at ${esc(timeWord(modelState.at))}. Lines it improved are marked <span class="tag">Refined</span>.</p>`;
  if (s === 'failed') { const why = { not_granted: 'you declined', rate_limited: 'too many calls for now', invalid: 'its reply did not pass the checks', unavailable: 'the model is not available in this view', upstream_error: 'the call failed' }[modelState.error] ?? 'the call failed'; return `<p class="plan-model">Claude could not refine the plan: ${esc(why)}. The plan stands on its own. <button type="button" class="link" id="plan-retry">Retry</button></p>`; }
  if (s === 'stale') return `<p class="plan-model">Your answers changed while Claude was looking, so its lines were dropped. <button type="button" class="link" id="plan-retry">Refine again</button></p>`;
  return `<p class="plan-model"><button type="button" class="link" id="plan-refine">Refine with Claude</button> <span class="small">${esc(MODEL_LINE)}</span></p>`;
}
function paintModelState() {
  const el = $('#plan-model-host');
  if (!el) return;
  el.innerHTML = modelStateHtml(planObj().plan);
  const b = $('#plan-retry', el) ?? $('#plan-refine', el);
  if (b) b.addEventListener('click', () => { feel.play('tap', { x: feel.x(b) }); refinePlan(planObj().plan, { retry: true }); });
}
document.addEventListener('mercer:model', () => { if (isPlanStage(stageNow())) paintModelState(); });
/* a new answer revision: the local plan is built again, and a refinement for the old revision no longer applies */
document.addEventListener('mercer:revision', () => { localPlanCache.key = null; if (isPlanStage(stageNow())) paintPlan(false); });

/* ============ Rebuild 1, brief 13.3: the standard action card ============ */
const AC_FIELDS = [['whyFirst', 'Why first'], ['steps', 'Do this'], ['responsible', 'Responsible'], ['needs', 'Needs'], ['effort', 'Effort'], ['cost', 'Cost'], ['doneWhen', 'Done when'], ['measure', 'Measure'], ['changeCourseIf', 'Change course if']];
/* brief 13.3: one-off and ongoing are said separately, and a zero is said as nothing rather than left out. A cost object with
   neither figure falls back to its own label (plan.js writes one), and a label beside the figures follows them as the note. */
const costWords = (c) => { if (!c || typeof c !== 'object') return typeof c === 'string' && c ? c : 'not estimated'; if (typeof c.label === 'string' && c.label && !Number.isFinite(Number(c.oneOff)) && !Number.isFinite(Number(c.recurring))) return /[.!]$/.test(c.label) ? c.label : `${c.label}.`; const w = (v) => (v === 0 ? 'nothing' : Number.isFinite(Number(v)) && v !== null ? gbp(Number(v)) : typeof v === 'string' && v ? v : 'not known'); return `One-off ${w(c.oneOff)}; ongoing ${w(c.recurring)}${c.recurring !== null && c.recurring !== undefined && Number(c.recurring) > 0 ? ' a month' : ''}${c.note ? ` (${c.note})` : c.label && !/^nothing to buy$/i.test(c.label) ? ` (${c.label.replace(/[.!]$/, '')})` : ''}.`; };
const tag = (a, k) => ((a.refined ?? []).includes(k) ? ' <span class="tag">Refined</span>' : '');
/** the card's HTML; o.eyebrow names it (First action, Rank 2, From your answers); o.assets resolves Start now; pure over its inputs */
function actionCardHtml(a, o = {}) {
  if (!a) return '';
  const hue = sectionBy(a.affects?.section)?.hue ?? '--sec-crown';
  const asset = assetFor(o.assets, a);
  const rows = AC_FIELDS.map(([k, label]) => {
    let v = '';
    if (k === 'steps') { const st = listOf(a.steps); v = st.length ? `<ol class="ac-steps">${st.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''; }
    else if (k === 'needs') { const nd = listOf(a.needs); v = nd.length ? esc(nd.join('; ')) : 'nothing beyond what you have'; }
    else if (k === 'cost') v = esc(costWords(a.cost));
    else v = esc(wordsOf(a[k]));
    return v ? `<div class="ac-row" data-field="${k}"><dt>${esc(label)}${tag(a, k)}</dt><dd>${v}</dd></div>` : '';
  }).join('');
  const start = asset ? `<button type="button" class="glass small" data-start="${esc(asset.id)}">Start now: open ${esc(asset.title.toLowerCase())}</button>` : '';
  const see = a.affects?.section && a.affects.section !== 'crown' ? `<button type="button" class="link" data-see="${esc(a.id)}">See the branch</button>` : '';
  return `<article class="action-card${a.fromAnswers ? ' from-answers' : ''}" data-action="${esc(a.id)}" style="--hue:var(${hue})">
    <p class="eyebrow"><i class="dot"></i><span class="name">${esc(o.eyebrow ?? (a.fromAnswers ? ANSWER_ACTIONS : a.rank === 1 ? 'First action' : `Rank ${a.rank ?? ''}`))}</span>${o.example ? '<span class="tag">Example</span>' : ''}</p>
    <h3 class="ac-title">${esc(wordsOf(a.action))}${tag(a, 'action')}</h3>
    <dl class="ac">${rows}</dl>
    ${start || see ? `<p class="ac-acts">${start}${see}</p>` : ''}
    <div class="asset-open" data-asset-host="${esc(a.id)}" hidden></div>
  </article>`;
}
/* the clipboard, with the old textarea road when the API is absent; "Copied" for two seconds beside the press */
async function copyText(text, btn) {
  let ok = false;
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { ok = false; }
  if (!ok) { try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e) { ok = false; } }
  if (btn) { const was = btn.dataset.word ?? btn.textContent; btn.dataset.word = was; btn.textContent = ok ? 'Copied' : 'Could not copy'; clearTimeout(btn.timer); btn.timer = setTimeout(() => { btn.textContent = was; }, 2000); }
  if (ok) feel.play('done', { gain: 0.4, x: btn ? feel.x(btn) : 0.5 });
  return ok;
}
const assetHtml = (s, o = {}) => `<div class="asset" data-asset="${esc(s.id)}"><p class="asset-head"><b>${esc(s.title)}</b><span class="small">${esc(s.kind ?? 'template')}${o.example ? ' · example' : ''}</span><button type="button" class="link" data-copy="${esc(s.id)}">Copy</button></p><pre class="asset-text">${esc(s.text ?? '')}</pre></div>`;
/** binds the cards inside root: Start now opens the asset under the card (and copies it), Copy copies, See the branch selects the limb */
function bindActionCards(root, pl, o = {}) {
  const assets = pl?.assets ?? [];
  $$('[data-start]', root).forEach((b) => b.addEventListener('click', async () => {
    const s = assets.find((x) => x.id === b.dataset.start) ?? assets.find((x) => x.kind === b.dataset.start);
    const card = b.closest('.action-card');
    const host = card ? $('[data-asset-host]', card) : null;
    if (!s || !host) return;
    feel.play('open', { x: feel.x(b) });
    host.innerHTML = assetHtml(s, o);
    host.hidden = false;
    $('[data-copy]', host)?.addEventListener('click', (e) => copyText(s.text, e.currentTarget));
    await copyText(s.text, null);
    try { host.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { /* none */ }
  }));
  $$('[data-see]', root).forEach((b) => b.addEventListener('click', () => { const a = (pl?.actions ?? []).find((x) => x.id === b.dataset.see); if (a) { feel.play('tap', { x: feel.x(b) }); selectAction(a, { ...o, lineEl: o.example ? $('.ex-line', root) : null, root: o.example ? root : null }); } }));
}

/* ============ Rebuild 1, R10 and brief 5.5: the tree at results, Current / Plan ============ */
let treeView = 'current';
let selected = null;
const LIMB_WORD = { pricing: 'the offer (sale value)', demand: 'customers (prospects and routes)', conversion: 'customers (the close)', capacity: 'delivery (capacity)', margin: 'the offer (margin)', retention: 'customers (retention)', trunk: 'leverage (you and control)', roots: 'the roots (evidence)', crown: 'the crown (the goal)' };
const scenarioOf = (pl) => { const list = pl?.scenarios ?? []; const s = list.find((x) => x.id === 'plan' || x.id === 'plan-month') ?? list.find((x) => x.id !== 'baseline' && x.id !== 'current' && !/^lever/.test(String(x.id))) ?? null; if (!s) return null; const base = list.find((x) => x.id === 'baseline' || x.id === 'current'); return { ...s, baseline: s.baseline ?? base?.value ?? 0, target: s.target ?? pl?.goal?.target ?? pl?.goal?.amount ?? null, label: s.label ?? 'Plan' }; };
function setTreeView(v, pl) {
  treeView = v === 'plan' ? 'plan' : 'current';
  const t = tree();
  try {
    t?.setView?.(treeView);
    const sc = scenarioOf(pl);
    if (treeView === 'plan' && sc) t?.setMetric?.({ baseline: sc.baseline ?? 0, scenario: sc.value ?? sc.scenario ?? 0, target: sc.target ?? null, label: sc.label ?? 'Plan' });
  } catch (e) { /* the tree is optional */ }
  $$('#tree-view [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === treeView)));
}
/** what an action does to the tree, in one line: the limb it affects, the dependency it removes, the outcome modelled, or the milestone */
const affectWords = (a) => { const af = a.affects ?? {}; const parts = [`Affects ${LIMB_WORD[af.limb] ?? af.limb ?? 'the tree'}.`]; if (af.dependency) parts.push(`Removes: ${af.dependency}.`); parts.push(af.outcome ? `Scenario: ${af.outcome}. ${modeLabel(planObj().plan)}.` : `Milestone: ${af.milestone ?? a.doneWhen ?? 'the step is done'}.`); return parts.join(' '); };
function selectAction(a, o = {}) {
  if (!o.example) { selected = a?.id ?? null; try { tree()?.select?.(a?.affects?.limb ?? null); } catch (e) { /* optional */ } }
  const line = o.lineEl ?? $('#tree-view-line');
  if (line) line.textContent = a ? affectWords(a) : '';
  $$('.action-card', o.root ?? document).forEach((el) => el.classList.toggle('selected', !!a && el.dataset.action === a.id));
}
const treeViewHtml = () => `<div class="tree-view" id="tree-view" role="group" aria-label="Tree view"><button type="button" class="glass small" data-view="current" aria-pressed="true">Current</button><button type="button" class="glass small" data-view="plan" aria-pressed="false">Plan</button><span class="small">Current is the tree as you answered. Plan puts the target on the tree as a reference marker, not as a predicted height, and shows the scenario beside it. Selecting an action lights the branch it changes.</span><p class="small" id="tree-view-line"></p></div>`;
function bindTreeView(root, pl) {
  $$('[data-view]', root).forEach((b) => b.addEventListener('click', () => { feel.play('tap', { x: feel.x(b) }); setTreeView(b.dataset.view, pl); }));
}

/* ============ Rebuild 1, R19: the plan view (#plan; #harvest in the old shell), "Your plan" ============
   Progressive disclosure: the decision and the first action card first, then the sections of brief 13.2 under one ▾ each,
   the three downloads, the invitation to TMA with the review panel, Book a call, Mission Alignment, the agent, Save on this
   device, the Disclaimer and the one privacy line. Everything is read from the plan object. */
const secHtml = (id, title, count, body) => `<section class="plan-sec" id="ps-${id}"><h3 class="plan-sec-head"><button type="button" class="sec-head" aria-expanded="false" aria-controls="ps-${id}-body"><span class="sec-title">${esc(title)}</span>${count ? `<span class="sec-count small">${esc(count)}</span>` : ''}<span class="drop" aria-hidden="true">▾</span></button></h3><div class="plan-sec-body" id="ps-${id}-body" hidden>${body}</div></section>`;
const dl = (rows) => `<dl class="plan-dl">${rows.filter(([, v]) => v).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const ul = (items) => (items.length ? `<ul class="plan-list">${items.map((t) => `<li>${t}</li>`).join('')}</ul>` : '');
const scenVal = (s) => { const v = Number(s.value ?? s.scenario ?? 0); const money = !s.unit || s.unit === 'GBP' || /a month|£/.test(String(s.unit)); return money ? gbp(near(v)) : `${count(v)} ${s.unit}`; };
const scenLine = (s) => `${scenVal(s)}${s.period && !/a month/.test(String(s.unit ?? '')) ? ` ${s.period}` : ''}${s.low !== undefined && s.high !== undefined && s.low !== null ? ` (${gbp(down(Number(s.low)))} to ${gbp(up(Number(s.high)))}, downside to favourable)` : ''}${s.target ? `; target ${gbp(s.target)}` : ''}`;
/* Task 20, 31 and 34: the numerical view is Scenarios. Every figure carries the mode, the assumption sets are named rather
   than dressed as percentiles, and the measures this model does not carry are said. */
const scenarioHtml = (pl) => {
  const list = pl.scenarios ?? [];
  const head = `<p class="scen-mode">${modeChip(pl)} <span class="small">${esc(MODE_MEANS[scenarioMode(pl)] ?? '')}</span></p>`;
  if (!list.length) return `${head}<p>${esc(pl.notUseful || 'No scenario is quantified for this plan, so the milestone stands in its place.')}</p><p class="small">${esc(NO_FORECAST_LINE)}</p>`;
  return `${head}<table class="scenarios"><thead><tr><th>Scenario</th><th>Figure</th><th>Basis</th></tr></thead><tbody>${list.map((s) => `<tr><td>${esc(s.label)}${s.metric ? `<span class="small block">${esc(s.metric)}</span>` : ''}</td><td class="tabular">${esc(scenLine(s))}</td><td class="small">${esc(listOf(s.assumptions).join('; '))}${s.intervalKind ? ` ${esc(s.intervalKind)}` : ''}</td></tr>`).join('')}</tbody></table><p class="small">${esc(SETS_LINE)}</p><p class="small">${esc(NO_FORECAST_LINE)}</p><p class="small">${esc(EXCLUDED_LINE)}</p>`;
};
const resourcesHtml = (res) => {
  if (!res) return '<p>No resources are listed for this plan.</p>';
  const group = (label, items) => (Array.isArray(items) && items.length ? `<div class="res-group"><p class="small res-label">${esc(label)}</p>${ul(items.map((it) => `${esc(strOf(it.item ?? it.name ?? it))}${it.status ? ` <span class="small">${esc(it.status)}</span>` : ''}${it.why ? ` <span class="small">${esc(it.why)}</span>` : ''}${Array.isArray(it.free) && it.free.length ? `<span class="small block">${esc(it.free.join(' · '))}</span>` : ''}`))}</div>` : '');
  return `${group('Already owned', res.owned)}${group('Essential now', res.essentialNow ?? res.essential)}${group('Later only', res.later)}${group('Avoid for now', res.avoid)}${res.verified ? `<p class="small">${esc(res.verified)}</p>` : ''}`;
};
const methodRowsHtml = (mth) => (mth ? `<div class="method"><p>${esc(mth.words ?? '')}</p><dl class="counts">${(mth.rows ?? []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="tabular">${esc(v)}</dd></div>`).join('')}</dl>${mth.note ? `<p class="small">${esc(mth.note)}</p>` : ''}</div>` : '<p class="small">No simulation ran for this plan, so no run counts are claimed.</p>');
/** the sections of brief 13.2 for a plan object; pure over the plan */
const STATUS_WORD = { full: 'built from your answers', qualitative: 'no revenue figure yet', preliminary: 'not enough answered yet' };
function planSections(pl, o = {}) {
  const actions = pl.actions ?? [];
  const engine = actions.filter((a) => !a.fromAnswers);
  const primaries = (pl.primaries?.length ? pl.primaries.map((id) => engine.find((a) => a.id === id)).filter(Boolean) : engine.slice(0, 3));
  const answersActs = actions.filter((a) => a.fromAnswers);
  const first = pl.firstAction ?? actions[0] ?? null;
  const out = [];
  out.push(['summary', 'One-page summary', '', dl([
    ['Goal', esc(`${wordsOf(pl.goal?.text ?? pl.goal)}${pl.goal?.when ? ` by ${pl.goal.when}` : ''}${listOf(pl.goal?.protected).length ? `. Protected: ${listOf(pl.goal.protected).join(', ')}` : ''}`)],
    ['Situation', esc(wordsOf(pl.situation))], ['Recommended move', esc(wordsOf(first?.action))], ['Evidence', ul(listOf(pl.finding?.evidence).map(esc))],
    ['Key unknown', esc(wordsOf(pl.keyUnknown ?? firstOf(pl.unknowns)?.title))], ['First action', esc(wordsOf(first?.steps?.[0]))],
  ])]);
  out.push(['priorities', 'Prioritised plan', plural(primaries.length, 'move to make now', 'moves to make now'), `${ul(primaries.map((a, i) => `<b>${i + 1}. ${esc(wordsOf(a.action))}</b>${a.score !== undefined ? ` <span class="small">score ${esc(String(a.score))} of 100, ${esc(a.difficulty ?? '')}</span>` : ''}${a.affects?.dependency ? `<span class="small block">Depends on: ${esc(a.affects.dependency)}</span>` : ''}`))}${(pl.next ?? []).length ? `<p class="small res-label">After these</p>${ul(pl.next.map((w) => esc(wordsOf(w.action))))}` : ''}${(pl.waits ?? []).length ? `<p class="small res-label">What should wait</p>${ul((pl.waits ?? []).map((w) => `${esc(wordsOf(w.action))} <span class="small">${esc(wordsOf(w.why))}</span>`))}` : ''}${answersActs.length ? `<p class="small res-label">${esc(ANSWER_ACTIONS)}</p>${ul(answersActs.map((a) => `${esc(wordsOf(a.action))}${a.from ? ` <span class="small">${esc(a.from)}</span>` : ''}`))}` : ''}${engine.slice(1).length ? `<p class="small res-label">The other cards</p>${engine.slice(1).map((a) => actionCardHtml(a, { assets: pl.assets, example: o.example })).join('')}` : ''}`]);
  /* what the plan asks of the person against what they said they have: computed by plan.js and, when it does not fit,
     said plainly here rather than left inside the object (18.4: do the hours and costs add up?) */
  const rt = pl.resourceTotals ?? null;
  const fig = (t) => (t && typeof t === 'object' ? t : null);
  const hrs = fig(rt?.hours), one = fig(rt?.oneOff), rec = fig(rt?.recurring);
  if (hrs || one || rec || (rt && rt.note)) {
    const rows = [];
    if (hrs && hrs.needed !== undefined) rows.push(['Your time', esc(`${wordsOf(count(hrs.needed))} hours over ${hrs.period ?? 'the first two weeks'}${hrs.available !== null && hrs.available !== undefined ? `, against the ${wordsOf(count(hrs.available))} you have in that time` : ''}${hrs.estimate ? ' (estimate)' : ''}`)]);
    if (one && one.needed !== undefined) rows.push(['To buy, one off', esc(`${gbp(one.needed)}${one.available !== null && one.available !== undefined ? `, against your ${gbp(one.available)}` : ''}`)]);
    if (rec && rec.needed !== undefined) rows.push(['Every month', esc(`${gbp(rec.needed)}${rec.available !== null && rec.available !== undefined ? `, against your ${gbp(rec.available)}` : ''}`)]);
    const tight = [hrs, one, rec].filter((x) => x && x.fits === false);
    const note = rt?.note ? `<p class="${tight.length ? 'plan-note tight' : 'plan-note'}">${esc(wordsOf(rt.note))}</p>` : '';
    const over = tight.length ? `<p class="plan-note tight">${esc(`This plan asks for more than you said you have, so the actions run one after another rather than together. Cut the last one, or give it longer.`)}</p>` : '';
    if (rows.length || note) out.push(['resources', 'What it asks of you', tight.length ? 'more than you have' : 'inside what you have', `${rows.length ? dl(rows) : ''}${note}${over}`]);
  }
  const wk = pl.weekOne ?? [];
  const wkCols = [['task', 'Task'], ['owner', 'Owner'], ['effort', 'Effort'], ['cost', 'Cost'], ['output', 'Output'], ['check', 'Success check']].filter(([k]) => wk.some((w) => wordsOf(w[k])));
  out.push(['week1', 'Week one', plural(wk.length, 'task', 'tasks'), wk.length ? (wkCols.length > 1 ? `<table class="plan-table"><thead><tr>${wkCols.map(([, h]) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${wk.map((w) => `<tr>${wkCols.map(([k]) => `<td>${esc(wordsOf(w[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<ol class="plan-list">${wk.map((w) => `<li>${esc(wordsOf(w.task))}</li>`).join('')}</ol>`) : '<p>No week-one tasks are set for this plan.</p>']);
  const td = pl.thirtyDays ?? [];
  out.push(['days30', '30 days', '', td.length ? (td.some((w) => wordsOf(w.when) || wordsOf(w.review)) ? `<table class="plan-table"><thead><tr><th>When</th><th>Work</th><th>Review</th></tr></thead><tbody>${td.map((w) => `<tr><td>${esc(wordsOf(w.when))}</td><td>${esc(wordsOf(w.work))}</td><td>${esc(wordsOf(w.review))}</td></tr>`).join('')}</tbody></table>` : `<ol class="plan-list">${td.map((w) => `<li>${esc(wordsOf(w.work))}</li>`).join('')}</ol>`) : '<p>No 30-day sequence is set for this plan.</p>']);
  const nd = pl.ninetyDays;
  out.push(['days90', '90 days, conditional', '', nd ? `<p>${wordsOf(nd.condition) ? `<b>${esc(wordsOf(nd.condition))}</b>: ` : ''}${esc(wordsOf(nd.then))}</p>${wordsOf(nd.otherwise) ? `<p>Otherwise: ${esc(wordsOf(nd.otherwise))}</p>` : ''}${nd.note ? `<p class="small">${esc(nd.note)}</p>` : '<p class="small">Conditional on the 30-day evidence. Nothing here is certain.</p>'}` : '<p>No 90-day direction yet: it follows the 30-day evidence.</p>']);
  out.push(['economics', 'Scenarios', modeLabel(pl), `${scenarioHtml(pl)}${ul(listOf(pl.economics).map(esc))}${pl.notUseful && (pl.scenarios ?? []).length ? `<p class="small">${esc(pl.notUseful)}</p>` : ''}`]);
  out.push(['resources', 'Resources and purchases', '', resourcesHtml(pl.resources)]);
  out.push(['materials', 'Execution materials', plural((pl.assets ?? []).length + 1, 'item', 'items'), `${(pl.assets ?? []).map((s) => assetHtml(s, o)).join('')}<div class="asset" data-asset="implementation-brief"><p class="asset-head"><b>Implementation brief</b><span class="small">markdown, the whole plan</span><button type="button" class="link" data-copy="implementation-brief">Copy</button></p><p class="small">Every section of this page, every action with its steps, the materials, the evidence and the method, in a form another person or assistant can use at once.</p></div>`]);
  out.push(['evidence', 'Evidence and method', plural((pl.evidence ?? []).length, 'figure', 'figures'), `${(pl.evidence ?? []).length ? `<div class="leaves">${pl.evidence.map((e) => `<div class="leaf-row"><div class="leaf-top"><span class="leaf-title">${esc(e.title)}</span><b class="tabular">${esc(e.value)}</b><span class="src" data-from="${esc(e.kind ?? 'assumed')}">${esc(e.source ?? '')}</span></div></div>`).join('')}</div>` : ''}${(pl.unknowns ?? []).length ? `<p class="small res-label">Not known yet</p>${ul(pl.unknowns.slice(0, 12).map((u) => `${esc(wordsOf(u.title ?? u))}${u.why ? ` <span class="small">${esc(u.why)}</span>` : ''}`))}` : ''}${(pl.sources ?? []).length ? `<p class="small res-label">Sources</p>${ul(pl.sources.map((s) => `${esc(wordsOf(s.title))}${s.date ? ` <span class="small">as of ${esc(s.date)}</span>` : ''}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ''}`))}` : ''}${methodRowsHtml(pl.method)}`]);
  if (pl.tmaBrief) out.push(['tma', 'Brief for TMA, optional', '', `<p>${esc(wordsOf(pl.tmaBrief.summary))}</p>${listOf(pl.tmaBrief.needs).length ? `<p class="small res-label">Implementation needs</p>${ul(listOf(pl.tmaBrief.needs).map(esc))}` : ''}<p class="small">What goes in it is your choice, section by section, in the review panel under Ask TMA to help. Private detail stays out unless you tick it.</p>`]);
  return out;
}
function bindSections(root, pl, o = {}) {
  $$('.sec-head', root).forEach((b) => b.addEventListener('click', () => { const body = $(`#${b.getAttribute('aria-controls')}`, root); if (!body) return; feel.toggle(body, body.hidden, b); }));
  $$('[data-copy]', root).forEach((b) => b.addEventListener('click', () => { const id = b.dataset.copy; const text = id === 'implementation-brief' ? planMarkdown(pl) : (pl.assets ?? []).find((s) => s.id === id)?.text ?? ''; copyText(text, b); }));
  bindActionCards(root, pl, o);
}
/** the decision block: the finding, the situation, the key unknown; stale and revision lines */
const decisionHtml = (pl, stale) => `<div class="plan-decision"><p class="eyebrow"><i class="dot"></i><span class="name">${esc(pl.route === 'starter' ? 'Your strongest direction' : 'The decision')}</span>${(pl.refined ?? []).includes('finding') ? ' <span class="tag">Refined</span>' : ''}</p><p class="lead">${esc(wordsOf(pl.finding?.text ?? pl.finding))}</p>${pl.situation ? `<p>${esc(wordsOf(pl.situation))}</p>` : ''}${pl.keyUnknown ? `<p class="small">Key unknown: ${esc(wordsOf(pl.keyUnknown))}</p>` : ''}<p class="small plan-rev">${stale ? `Previous plan, revision ${esc(String(pl.revision ?? ''))}: your answers changed since. It stands until the next one is built.` : `Built from your answers, revision ${esc(String(pl.revision ?? revisionNow()))}, ${esc(pl.generatedOn ?? today())}.`}</p></div>`;
/* the plan view's own hosts inside #plan, made once and moved into order on every paint, so an old shell's children and an
   empty new container both come out the same */
const mk = (id, tagName, cls) => { let el = document.getElementById(id); if (!el) { el = document.createElement(tagName); el.id = id; if (cls) el.className = cls; } return el; };
/* the shell ships #hv-json and #hv-agent hidden (they were optional on the old harvest); every row the plan view places is
   shown, because the plan view decides what belongs there */
const mkRow = (id, word, kind, fill) => { const b = mk(id, 'button', `glass hv-row ${fill ?? ''}`.trim()); b.type = 'button'; b.hidden = false; b.removeAttribute('hidden'); b.classList.add('hv-row'); b.classList.remove('small'); b.innerHTML = `<span class="hv-word">${esc(word)}</span><span class="hv-kind">${esc(kind)}</span>`; return b; };
const NOT_READY = 'Your plan is not ready yet: the answers so far do not support one. Answer the questions that remain, then Build my plan.';
/** a listener bound once per element, whatever order the paints come in */
const once = (el, fn) => { if (!el || el.dataset.bound) return; el.dataset.bound = '1'; fn(el); };
let paintCount = 0;
/* ---------- Results round 1, 30 September: four stages on one tree ----------
   The brief: the result must deliver an immediate, specific answer and make the next action obvious. So the plan view is
   four stages (Your move, Why, Your plan, Start), each holding one idea, its words in a column beside the tree (under it
   on the phone) and one primary action. One shared inspector (#inspector) is the only card that opens: a branch, an
   evidence label, a milestone, an alternative or "Why this move?" replaces what it shows. Nothing turns on a timer,
   nothing advances by itself, and nothing is clipped to a budget: a summary that overruns is replaced by the brain's
   short field, or by a label of this file's own that never prints a fragment. Yesterday's five panels are gone; every
   id the plan view exposed still lives inside a stage, so the toolbar, the exports and the older tests keep working. */
const STAGES = [['move', 'Your move'], ['why', 'Why'], ['plan', 'Your plan'], ['start', 'Start']];
const STAGE_KEYS = STAGES.map(([k]) => k);
const MS = [['today', 'Today'], ['week', 'This week'], ['review', 'Review']];
let stageAt = 'move';
let milestoneAt = 'today';
let inspOpen = null;               // what the inspector shows: { kind, id }, or null when it is shut
const inspWas = {};                // per stage, the press that last filled the inspector there, so a return brings it back
const doneMarks = new Set();       // the actions the visitor ticked: a record of the tick and nothing more
let selecting = false;             // a selectBranch this file makes is not a press on the tree
let inInspector = false;           // the pointer or focus is inside the inspector: the page does not snap under it
let stageScrollTimer = null;
/* the copy budgets on display (D3): M.plan.words and M.plan.fits once the brain lands them, the plain count until then */
const wordsN = (t) => { try { const n = M.plan?.words?.(t); if (Number.isFinite(n)) return n; } catch (e) { /* the local count */ } return String(t ?? '').trim().split(/\s+/).filter(Boolean).length; };
const fitsN = (t, n) => { try { const f = M.plan?.fits?.(t, n); if (typeof f === 'boolean') return f; } catch (e) { /* the local check */ } return wordsN(t) <= n; };
/** the first candidate inside the budget, in the order given: the field, the brain's short field, then a label of this
    file's own. When none fits the last one stands whole: a budget is never met by clipping. */
const within = (n, ...cands) => { const list = cands.map((c) => wordsOf(c)).filter(Boolean); return list.find((t) => fitsN(t, n)) ?? list[list.length - 1] ?? ''; };
const hasPreset = (p) => { try { return (window.GrowthTree?.PRESETS ?? []).includes(p); } catch (e) { return false; } };
const resultsFrame = () => (hasPreset('results') ? 'results' : 'harvest');
const firstActionOf = (pl) => pl?.firstAction ?? (pl?.actions ?? []).find((a) => a && !a.fromAnswers) ?? (pl?.actions ?? [])[0] ?? null;
const engineActions = (pl) => (pl?.actions ?? []).filter((a) => a && !a.fromAnswers);
const objOf = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);

/** the goal in the visitor's own terms: the figure and the month where there is one, the aim in words where there is not */
function goalLabelOf(pl) {
  const g = objOf(pl?.goal) ?? {};
  const fig = wordsOf(g.figure ?? '');
  if (fig && Number.isFinite(Number(g.target)) && Number(g.target) > 0) return `${fig}${g.when ? ` by ${g.when}` : ''}`;
  return wordsOf(g.words ?? g.text ?? '') || 'Your goal';
}
/** the arithmetic behind the move, in the visitor's own figures: what the target takes against what they do now. It is
    the support line's fallback when the brain has not written one, and it says nothing when there is no target. */
function arithmeticLine(pl) {
  const req = pl?.goalPath?.requirements ?? null;
  const sales = Number.isFinite(req?.sales) ? Math.ceil(req.sales) : null;
  const opps = Number.isFinite(req?.opportunities) ? Math.ceil(req.opportunities) : null;
  const target = Number.isFinite(pl?.goal?.target) ? pl.goal.target : null;
  const months = Number.isFinite(pl?.goal?.months) ? pl.goal.months : null;
  if (target === null || sales === null) return '';
  let base = null, unit = 'sales';
  try { const b = M.econ?.baseline?.(state); if (b) { base = Number.isFinite(b.sales) ? Math.round(b.sales) : null; if (b.unit) unit = String(b.unit); } } catch (e) { /* no econ */ }
  return `${gbp(target)} a month${months ? ` in ${count(months)} months` : ''} means ${count(sales)} ${unit} a month.${base !== null ? ` You are doing ${count(base)}.` : ''}${opps !== null ? ` That takes ${count(opps)} enquiries a month.` : ''}`;
}
/** Stage 1's content (D3 pl.move, read defensively): the goal label, an action headline of at most 12 words, one
    supporting sentence of at most 24, the hypothesis flag and the branch the move sits on */
function moveOf(pl) {
  const mv = objOf(pl?.move) ?? {};
  const first = firstActionOf(pl);
  const fin = resultFinding(pl);
  return {
    goalLabel: within(8, mv.goalLabel, goalLabelOf(pl)),
    headline: within(12, mv.headline, mv.short, first?.action ? shortLabel(first.action, 12, SHORT_ACTION) : '', fin?.action),
    support: within(24, mv.support, mv.supportShort, arithmeticLine(pl), pl?.finding?.short, fin?.label),
    hypothesis: typeof mv.hypothesis === 'boolean' ? mv.hypothesis : !!fin?.thin || pl?.status === 'preliminary',
    branchId: mv.branchId ?? first?.affects?.limb ?? pl?.finding?.limb ?? null,
    evidenceIds: listOf(mv.evidenceIds).length ? listOf(mv.evidenceIds) : listOf(first?.evidenceIds),
  };
}
const GROUNDED = new Set(['user', 'imported', 'calculated', 'source']);
/** an evidence label of at most four words from the visitor's own figure: the value, then the question's first words */
function factLabel(e) {
  const v = wordsOf(e.value ?? '').split(/\s+/).filter(Boolean);
  const q = wordsOf(e.question ?? e.title ?? '').split(/\s+/).filter(Boolean);
  const room = Math.max(1, 4 - v.length);
  return [...v, ...q.slice(0, room)].join(' ');
}
/** the lines an evidence id resolves to: the question or title, the value, the provenance and the source */
function evidenceLines(pl, ids) {
  const all = Array.isArray(pl?.evidence) ? pl.evidence : [];
  return listOf(ids).map((id) => all.find((e) => e && e.id === id)).filter(Boolean).map((e) => {
    const head = wordsOf(e.question ?? e.title ?? e.id);
    const val = wordsOf(e.value ?? '');
    const from = wordsOf(e.label ?? '');
    const src = wordsOf(e.sourceTitle ?? '');
    return `${head}${val ? `: ${val}` : ''}${from ? ` (${from}${src ? `, ${src}` : ''}${e.sourceDate ? `, ${e.sourceDate}` : ''})` : ''}${e.basis ? ` ${wordsOf(e.basis)}` : ''}`;
  });
}
/** Stage 2's content (D3 pl.why): up to three grounded facts, the one uncertainty, the mission line and the default card
    of at most 65 words. Without the brain's fields the facts are the plan's own grounded evidence, never fixture data. */
function whyOf(pl) {
  const w = objOf(pl?.why) ?? {};
  const first = firstActionOf(pl);
  const ev = Array.isArray(pl?.evidence) ? pl.evidence : [];
  let facts = (Array.isArray(w.facts) ? w.facts : []).map(objOf).filter(Boolean).slice(0, 3).map((f, i) => ({
    id: String(f.id ?? `fact-${i + 1}`), label: within(4, f.label, f.short), text: within(40, f.text, f.short, f.label), part: f.part ?? 'roots',
    evidenceIds: listOf(f.evidenceIds), answerId: f.answerId ?? null,
  })).filter((f) => f.label);
  if (!facts.length) {
    facts = ev.filter((e) => e && GROUNDED.has(e.state) && wordsOf(e.value ?? '')).slice(0, 3).map((e) => ({
      id: String(e.id), label: factLabel(e), text: within(40, evidenceLines(pl, [e.id])[0]), part: 'roots', evidenceIds: [e.id],
      answerId: e.state === 'user' || e.state === 'imported' ? String(e.id) : null,
    }));
  }
  const unk = firstOf(pl?.unknowns);
  const u = objOf(w.uncertainty);
  const uncertainty = u
    ? { label: within(4, u.label, 'Not known yet'), text: within(40, u.text, u.short), answerId: u.answerId ?? null }
    : { label: 'Not known yet', text: within(40, pl?.keyUnknown, objOf(unk)?.title ?? unk, first?.changeCourseIf), answerId: objOf(unk)?.id ?? null };
  const mission = within(30, w.mission, w.missionShort, first?.whyFirst);
  const composed = [facts[0]?.text, facts[1]?.text, uncertainty.text ? `Not yet known: ${lc(uncertainty.text)}` : ''].filter(Boolean).join(' ');
  const card = within(65, w.card, w.cardShort, composed, facts[0]?.text, uncertainty.text);
  return { facts, uncertainty, mission, card, answerId: uncertainty.answerId ?? facts.find((f) => f.answerId)?.answerId ?? null };
}
/** Stage 3's content (D3 pl.sequence): Today and This week as actions, Review as the dated or elapsed point with its
    proposed criteria. Without the brain's fields Today is the first action and This week the next ranked one. */
function sequenceOf(pl) {
  const sq = objOf(pl?.sequence) ?? {};
  const acts = engineActions(pl);
  const today = objOf(sq.today) ?? firstActionOf(pl);
  const week = objOf(sq.week) ?? acts.find((a) => a !== today && a.id !== today?.id) ?? null;
  const r = objOf(sq.review);
  const review = {
    afterDays: Number.isFinite(Number(r?.afterDays)) && Number(r.afterDays) > 0 ? Number(r.afterDays) : null,
    date: wordsOf(r?.date ?? ''),
    text: within(40, r?.text, firstOf(pl?.reviewConditions)),
    continueIf: within(30, r?.continueIf),
    changeIf: within(30, r?.changeIf, today?.changeCourseIf),
    measure: within(30, today?.measure, firstOf(pl?.successMeasures)),
    labelledAs: wordsOf(r?.labelledAs ?? '') || 'proposed test criteria',
  };
  return { today, week, review };
}
/** Stage 4's content (D3 pl.start): the headline, one situation-specific sentence of at most 30 words, and the one CTA
    the page can honour: a booking when a destination exists, the brief to download when none does */
function startOf(pl) {
  const s = objOf(pl?.start) ?? {};
  const book = bookingOf();
  const first = firstActionOf(pl);
  const work = wordsOf(first?.action ?? '') ? lc(shortLabel(first.action, 8, SHORT_ACTION)) : 'the first step';
  const cta = s.cta === 'book' || s.cta === 'download' ? s.cta : book.url ? 'book' : 'download';
  const dest = typeof s.destination === 'string' && /^https:\/\/\S+$/.test(s.destination.trim()) ? s.destination.trim() : book.url;
  return {
    headline: within(8, s.headline, 'Put your plan into action.'),
    sentence: within(30, s.sentence, s.sentenceShort, `TMA could help you carry out ${work}: the workflow, the follow-through and the measurement around it, subject to what is agreed on a call.`),
    cta: cta === 'book' && !dest ? 'download' : cta, destination: cta === 'book' ? dest : null, configured: book.configured,
  };
}
const COPY_KINDS = /message|sequence|request|ask|introduction|notice|script|proposal|listing/;
/** an asset's button reads as a verb: what the press does, then the asset's own name */
const assetVerb = (asset, mode) => `${mode === 'copy' ? 'Copy' : 'Open'} ${String(asset.title ?? asset.kind ?? 'the material').toLowerCase()}`;
/** one action as the plan stage's card reads it (D3 Action +=), every field read defensively from the older shape */
function cardOf(a, pl) {
  if (!a) return null;
  const given = objOf(a.asset);
  const found = given ? null : assetFor(pl?.assets, a);
  const mode = given?.mode === 'copy' || given?.mode === 'open' ? given.mode : COPY_KINDS.test(String(found?.kind ?? found?.id ?? '')) ? 'copy' : 'open';
  const asset = given ? { id: String(given.id ?? given.kind ?? 'asset'), kind: given.kind ?? '', title: given.title ?? given.label ?? '', label: within(6, given.label, assetVerb(given, mode)), mode, text: given.text ?? '' }
    : found ? { id: found.id, kind: found.kind ?? '', title: found.title ?? '', label: assetVerb(found, mode), mode, text: found.text ?? '' } : null;
  const d = objOf(a.details);
  /* a sequence action (today, week) carries the branch it sits on rather than the section; the section follows from it */
  const limb = a.affects?.limb ?? a.branchId ?? null;
  const section = a.affects?.section ?? (limb === 'crown' ? 'crown' : limb === 'trunk' ? 'you' : limb === 'roots' ? 'ground' : limb === 'demand' ? 'reach' : SECTION_OF_DRIVER[limb] ?? null);
  const id = String(a.id ?? 'action');
  const parentId = (pl?.actions ?? []).some((x) => x.id === id) ? id : id.replace(/:(today|week)$/, '');
  /* a sequence action is cut from its parent before the model refines the plan: a field the parent has refined since
     is read from the parent, and the Refined tag travels with it */
  const parent = parentId !== id ? (pl?.actions ?? []).find((x) => x.id === parentId) ?? null : null;
  const refined = listOf(a.refined).length ? listOf(a.refined) : listOf(parent?.refined);
  if (parent) { ['whyFirst', 'doneWhen', 'measure', 'changeCourseIf', 'steps'].forEach((k) => { if (refined.includes(k) && parent[k] !== undefined) a = { ...a, [k]: parent[k] }; }); }
  return {
    id, raw: a, section, limb, parentId, refined,
    task: within(14, a.task, a.action ? shortLabel(a.action, 14, SHORT_ACTION) : ''),
    steps: listOf(a.steps).slice(0, 3),
    time: wordsOf(a.time ?? a.effort ?? ''), cost: wordsOf(a.costLabel ?? '') || costWords(a.cost), estimated: typeof a.estimated === 'boolean' ? a.estimated : true,
    doneWhen: wordsOf(a.doneWhen ?? ''),
    prerequisite: wordsOf(a.prerequisite ?? (a.sequence === 'after' ? a.sequenceNote : '') ?? ''),
    asset,
    whyFirst: wordsOf(a.whyFirst ?? d?.why ?? ''),
    details: { dependencies: listOf(d?.dependencies ?? a.needs), evidence: listOf(d?.evidence).length ? evidenceLines(pl, d.evidence).length ? evidenceLines(pl, d.evidence) : listOf(d.evidence) : evidenceLines(pl, a.evidenceIds), contingency: wordsOf(d?.contingency ?? a.changeCourseIf ?? '') },
    card: wordsOf(a.card ?? ''),
  };
}
const acRow = (k, label, v) => (v ? `<div class="ac-row" data-field="${esc(k)}"><dt>${label}</dt><dd>${v}</dd></div>` : ''); // the label is this file's own markup
/** the action card on the plan stage: task, at most three steps, time and cost with estimates labelled, done when, the
    asset's verb, Details for the rest, a blocking prerequisite said at once, and a tick that records only the tick.
    The card's prose is held under 90 words; when the fields overrun and the brain wrote a card that fits, the card
    stands and the fields move under Details. */
function stageCardHtml(c, kind) {
  const hue = sectionBy(c.section)?.hue ?? '--sec-crown';
  const prose = [c.task, ...c.steps, c.time, c.doneWhen].filter(Boolean).join(' ');
  const over = !fitsN(prose, 90) && c.card && fitsN(c.card, 90);
  const timeCost = [c.time, c.cost].filter((x) => x && x !== 'not estimated').join('; ');
  const rf = (k) => (c.refined.includes(k) ? ' <span class="tag">Refined</span>' : '');
  const face = over ? `<div class="ac-row" data-field="card"><dt>Do this</dt><dd>${esc(c.card)}</dd></div>` : `
      ${acRow('steps', `Do this${rf('steps')}`, c.steps.length ? `<ol class="ac-steps">${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '')}
      ${acRow('timecost', 'Time and cost', timeCost ? `${esc(timeCost)}${c.estimated ? ' <span class="small">(estimates)</span>' : ''}` : '')}
      ${acRow('doneWhen', `Done when${rf('doneWhen')}`, esc(c.doneWhen))}`;
  const start = c.asset ? `<button type="button" class="glass small ac-start" data-start="${esc(c.asset.id)}" data-mode="${esc(c.asset.mode)}">${esc(c.asset.label)}</button>` : '';
  const see = c.section && c.section !== 'crown' ? `<button type="button" class="link" data-see="${esc(c.parentId)}">See the branch</button>` : '';
  const done = doneMarks.has(c.id);
  const rows = [
    ['whyFirst', `Why first${rf('whyFirst')}`, c.whyFirst], ['responsible', 'Responsible', c.raw.responsible], ['needs', 'Depends on', c.details.dependencies.join('; ')],
    ['measure', `Measure${rf('measure')}`, c.raw.measure], ['evidence', 'Evidence', c.details.evidence.join('; ')], ['contingency', `If it does not work${rf('changeCourseIf')}`, c.details.contingency],
    over ? ['steps', 'The steps', c.steps.join(' ')] : null, over ? ['doneWhen', 'Done when', c.doneWhen] : null,
  ].filter((r) => r && wordsOf(r[2]));
  return `<article class="action-card" data-action="${esc(c.id)}" style="--hue:var(${hue})">
    <p class="eyebrow"><i class="dot"></i><span class="name">${esc(kind === 'week' ? 'This week' : 'Today')}</span>${rf('action')}</p>
    <h3 class="ac-title">${esc(c.task)}</h3>
    ${c.prerequisite ? `<p class="ac-prereq"><b>First:</b> ${esc(c.prerequisite)}</p>` : ''}
    <dl class="ac">${face}</dl>
    ${start || see ? `<p class="ac-acts">${start}${see}</p>` : ''}
    <div class="asset-open" data-asset-host="${esc(c.id)}" hidden></div>
    ${rows.length ? `<details class="ac-details"><summary>Details</summary><dl class="ac">${rows.map(([k, l, v]) => acRow(k, l, esc(wordsOf(v)))).join('')}</dl></details>` : ''}
    <label class="ac-done"><input type="checkbox" data-done="${esc(c.id)}"${done ? ' checked' : ''}> Mark this done</label>
    ${done ? '<p class="small ac-done-note">You marked this done. Mercer records the tick and claims nothing about what it changed.</p>' : ''}
  </article>`;
}
/** the review point: when, the criteria, and the label that says they are proposed, not predicted */
function reviewCardHtml(rv) {
  const when = rv.date ? `on ${rv.date}` : rv.afterDays ? `after ${count(rv.afterDays)} days` : 'when today and this week are done';
  return `<article class="action-card review-card" data-action="review" style="--hue:var(--sec-crown)">
    <p class="eyebrow"><i class="dot"></i><span class="name">Review</span></p>
    <h3 class="ac-title">Review ${esc(when)}</h3>
    ${rv.text ? `<p class="ac-lead">${esc(rv.text)}</p>` : ''}
    <dl class="ac">${acRow('continueIf', 'Continue if', esc(rv.continueIf))}${acRow('changeIf', 'Change course if', esc(rv.changeIf))}${acRow('measure', 'Measure', esc(rv.measure))}</dl>
    <p class="small">${esc(cap(rv.labelledAs))}: planning choices, not a forecast and not a benchmark.</p>
  </article>`;
}

/* ---------- the pieces: navigator, inspector, tree list ---------- */
function ensureNav() {
  const nav = mk('plan-nav', 'nav', 'plan-nav');
  nav.setAttribute('aria-label', 'Your result');
  if (!nav.children.length) nav.innerHTML = STAGES.map(([k, name]) => `<button type="button" class="nav-stage" data-act="go:${k}" data-nav="${k}">${esc(name)}</button>`).join('');
  return nav;
}
function paintNav() {
  $$('#plan-nav [data-nav]').forEach((b) => { const on = b.dataset.nav === stageAt; if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  $$('.stage', planHost()).forEach((s) => { s.dataset.current = s.dataset.stage === stageAt ? '1' : ''; });
}
function ensureInspector() {
  const el = mk('inspector', 'aside', 'inspector');
  if (!el.dataset.made) {
    el.dataset.made = '1';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-labelledby', 'insp-kind');
    el.tabIndex = -1;
    el.hidden = true;
    el.innerHTML = '<div class="insp-head"><p class="eyebrow"><i class="dot"></i><span class="name" id="insp-kind"></span></p><button type="button" class="link insp-close" data-act="insp-close">Close</button></div><div class="insp-body" id="insp-body"></div><div id="plan-first" hidden></div>';
    /* the page does not snap while the pointer or focus is inside the inspector: its own scroll is the visitor's */
    const hold = (on) => { inInspector = on; syncSnap(); };
    el.addEventListener('pointerenter', () => hold(true));
    el.addEventListener('pointerleave', () => hold(false));
    el.addEventListener('focusin', () => hold(true));
    el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) hold(false); });
  }
  return el;
}
/** the inspector shows one thing: this replaces it, with the 180 to 300 ms fade results.css draws (none under reduced
    motion). A fast second press replaces again; nothing queues, nothing doubles. */
function openInspector(kind, title, html, o = {}) {
  const el = ensureInspector();
  inspOpen = { kind, id: o.id ?? null };
  $('#insp-kind', el).textContent = title;
  const body = $('#insp-body', el), first = $('#plan-first', el);
  if (kind === 'milestone') { first.hidden = false; body.hidden = true; body.innerHTML = ''; }
  else { body.innerHTML = html; body.hidden = false; first.hidden = true; }
  el.hidden = false;
  el.classList.remove('in');
  void el.offsetWidth;
  el.classList.add('in');
  el.scrollTop = 0;
  syncSnap();
  if (o.focus) { try { el.focus({ preventScroll: true }); } catch (e) { /* none */ } }
}
function closeInspector() {
  const el = $('#inspector');
  if (el) el.hidden = true;
  inspOpen = null;
  inspWas[stageAt] = null;
  $$('.fact[aria-pressed="true"]', planHost()).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  syncSnap();
}
/** the inspector lives in the current stage's column, at the slot each column leaves for it */
function placeInspector() {
  const el = ensureInspector();
  const slot = $(`#stage-${stageAt} .stage-insp`);
  if (slot && el.parentElement !== slot) slot.appendChild(el);
}
/** the keyboard twin of the tree's nodes (D2): the branches, the evidence labels, the milestones, the alternatives and
    Fit tree, as a compact list from the same plan data the tree draws */
function treeListEl(pl, mv, why, seq, tv) {
  const wrap = mk('tree-list-wrap', 'details', 'drawer tree-list-wrap');
  if (!$('summary', wrap)) { const s = document.createElement('summary'); s.textContent = 'The tree as a list'; wrap.appendChild(s); }
  let list = $('#tree-list', wrap);
  if (!list) { list = document.createElement('ul'); list.id = 'tree-list'; list.className = 'tree-list'; list.setAttribute('aria-label', 'The tree as a list'); wrap.appendChild(list); }
  const limbs = uniq([mv.branchId, ...engineActions(pl).map((a) => a.affects?.limb)].filter(Boolean)).slice(0, 4);
  const msWord = (k) => { if (k === 'review') return 'the review point'; const a = k === 'today' ? seq.today : seq.week; const w = a ? shortLabel(a.action ?? '', 8, SHORT_ACTION) : ''; return w || 'nothing planned yet'; };
  const items = [
    ...limbs.map((l) => ({ act: `branch:${l}`, word: `${l === mv.branchId ? 'Recommended branch' : 'Branch'}: ${LIMB_WORD[l] ?? l}` })),
    ...why.facts.map((f) => ({ act: `fact:${f.id}`, word: `Evidence: ${f.label}` })),
    ...MS.map(([k, name]) => ({ act: `ms:${k}`, word: `${name}: ${msWord(k)}` })),
    ...(pl.alternatives ?? []).slice(0, 2).map((a) => ({ act: `alt:${a.id}`, word: `Alternative: ${shortLabel(wordsOf(a.action ?? a.title ?? a.id), 8, SHORT_ACTION)}` })),
    { act: 'fit', word: 'Fit the whole tree' },
  ];
  list.innerHTML = items.map((it) => `<li><button type="button" class="link" data-act="${esc(it.act)}">${esc(it.word)}</button></li>`).join('');
  if (tv) wrap.appendChild(tv);
  return wrap;
}

/* ---------- what a press opens ---------- */
function openWhy(o = {}) {
  const pl = planObj().plan; if (!pl) return;
  const why = whyOf(pl);
  inspWas.why = () => openWhy({ quiet: true });
  openInspector('why', 'Why this move', `<p class="insp-lead">${esc(why.card)}</p>`, o);
  $$('.fact', planHost()).forEach((b) => b.setAttribute('aria-pressed', 'false'));
}
function openFact(id, o = {}) {
  const pl = planObj().plan; if (!pl) return;
  const why = whyOf(pl);
  const f = why.facts.find((x) => x.id === String(id));
  if (!f) { openWhy(o); return; }
  inspWas[stageAt] = () => openFact(id, { quiet: true });
  const lines = evidenceLines(pl, f.evidenceIds);
  openInspector('fact', f.label, `<p class="insp-lead">${esc(f.text)}</p>${lines.length ? `<ul class="insp-list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}${f.answerId ? `<p class="stage-second"><button type="button" class="link" data-act="change:${esc(f.answerId)}">Change this answer</button></p>` : ''}`, { id: f.id, focus: o.focus });
  $$('.fact', planHost()).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.act === `fact:${f.id}`)));
}
function openEvidence(o = {}) {
  const pl = planObj().plan; if (!pl) return;
  const why = whyOf(pl);
  inspWas[stageAt] = () => openEvidence({ quiet: true });
  const ids = uniq([...why.facts.flatMap((f) => f.evidenceIds), ...listOf(pl.finding?.evidenceIds), ...listOf(firstActionOf(pl)?.evidenceIds)]);
  const lines = evidenceLines(pl, ids);
  const srcs = (pl.sources ?? []).slice(0, 6).map((s) => `${wordsOf(s.title)}${s.date ? `, as of ${s.date}` : ''}`).filter(Boolean);
  const body = `${lines.length ? `<ul class="insp-list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p class="insp-lead">No figure behind this move has a source yet: the plan rests on your answers as given.</p>'}${srcs.length ? `<p class="small">Sources: ${esc(srcs.join('; '))}.</p>` : ''}<p class="small">${esc(why.uncertainty.label)}: ${esc(why.uncertainty.text || 'nothing named yet')}.</p>`;
  openInspector('evidence', 'Evidence', body, o);
}
function openBranch(limb, o = {}) {
  const pl = planObj().plan; if (!pl || !limb) return;
  const mv = moveOf(pl);
  const acts = engineActions(pl).filter((a) => a.affects?.limb === limb);
  const alts = (pl.alternatives ?? []).filter((a) => a.area && AREA_PART[a.area]?.[1] === limb);
  inspWas[stageAt] = () => openBranch(limb, { quiet: true });
  try { selecting = true; const t = tree(); if (typeof t?.selectBranch === 'function') t.selectBranch(limb); else t?.select?.(limb); } catch (e) { /* optional */ } finally { selecting = false; }
  const items = acts.slice(0, 3).map((a) => { const k = a.id === sequenceOf(pl).today?.id ? 'today' : a.id === sequenceOf(pl).week?.id ? 'week' : null; return `<li>${esc(shortLabel(a.action, 10, SHORT_ACTION))}${k ? ` <button type="button" class="link" data-act="ms:${k}">Open</button>` : ''}</li>`; });
  const body = `<p class="insp-lead">${esc(cap(LIMB_WORD[limb] ?? limb))}${limb === mv.branchId ? ': the recommended branch.' : '.'}</p>${items.length ? `<ul class="insp-list">${items.join('')}</ul>` : '<p class="small">No action in this plan touches this branch.</p>'}${alts.length ? `<p class="stage-second">${alts.map((a) => `<button type="button" class="link" data-act="alt:${esc(a.id)}">Alternative: ${esc(shortLabel(wordsOf(a.action ?? a.id), 6, SHORT_ACTION))}</button>`).join('')}</p>` : ''}${limb !== mv.branchId ? '<p class="stage-second"><button type="button" class="link" data-act="backplan">Back to my plan</button></p>' : ''}`;
  openInspector('branch', 'Branch', body, { id: limb, focus: o.focus });
}
/** whether a direction can be chosen from here: the brain's own road, the flow's, or the starter's direction answer */
const canUseDirection = (pl) => typeof M.plan?.useDirection === 'function' || typeof M.chooseDirection === 'function' || (pl?.route === 'starter' && typeof M.commit === 'function');
function openAlternative(id, o = {}) {
  const pl = planObj().plan; if (!pl) return;
  const a = (pl.alternatives ?? []).find((x) => String(x.id) === String(id));
  if (!a) return;
  inspWas[stageAt] = () => openAlternative(id, { quiet: true });
  const name = wordsOf(a.action ?? a.title ?? a.id);
  const trade = within(30, a.tradeoff, a.why);
  const usable = a.useable !== false && canUseDirection(pl);
  openInspector('alt', 'Alternative', `<p class="insp-lead">${esc(name)}</p>${trade ? `<p>${esc(trade)}</p>` : ''}<p class="small">A preview only: your plan stays as it is until you choose this direction.</p><p class="stage-second">${usable ? `<button type="button" class="link" data-act="use:${esc(String(a.id))}">Use this direction</button>` : ''}<button type="button" class="link" data-act="backplan">Back to my plan</button></p>`, { id: String(a.id), focus: o.focus });
}
/** D11: choosing a direction bumps the revision through the road that exists; the plan is rebuilt and repainted whole */
function useDirection(id) {
  const pl = planObj().plan;
  let ok = false;
  try {
    if (typeof M.plan?.useDirection === 'function') { M.plan.useDirection(id); ok = true; }
    else if (typeof M.chooseDirection === 'function') { M.chooseDirection(id); ok = true; }
    else if (pl?.route === 'starter' && typeof M.commit === 'function') { M.commit('n27', id, {}); ok = true; }
  } catch (e) { ok = false; }
  if (!ok) { barSaid('This direction cannot be chosen from here yet.'); return; }
  feel.play('done', { gain: 0.4, x: 0.6 });
  freshPlan();
  paintPlan(false);
  goStage('plan');
  openMilestone('today');
}
function openMilestone(kind, o = {}) {
  const pl = planObj().plan; if (!pl) return;
  const k = MS.some(([id]) => id === kind) ? kind : 'today';
  milestoneAt = k;
  inspWas.plan = () => openMilestone(k, { quiet: true });
  const seq = sequenceOf(pl);
  const el = ensureInspector();
  const first = $('#plan-first', el);
  const a = k === 'today' ? seq.today : k === 'week' ? seq.week : null;
  if (k === 'review') first.innerHTML = reviewCardHtml(seq.review);
  else if (a) first.innerHTML = stageCardHtml(cardOf(a, pl), k);
  else first.innerHTML = `<p class="small">${k === 'week' ? 'Nothing more is planned for this week beyond today’s task.' : 'No action is ranked yet.'}</p>`;
  bindActionCards(first, pl);
  openInspector('milestone', MS.find(([id]) => id === k)[1], '', { id: k, focus: o.focus });
  $$('#plan-tabs [data-ms]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ms === k)));
  if (a) { const line = $('#tree-view-line'); if (line) line.textContent = a.affects ? affectWords(a) : ''; }
  paintResultTree(pl);
}
/** what the tree shows for this plan and this stage (D4): the recommended branch selected, the evidence labels on the
    Why stage, the path with its milestones on the plan and start stages, the Task 21 chip off throughout. Every call
    is optional: a tree without the method is left as it is. */
const milestonesOf = (seq) => MS.map(([k, name]) => { const a = k === 'today' ? seq.today : k === 'week' ? seq.week : null; return { id: k, label: name, kind: k, state: a && doneMarks.has(String(a.id)) ? 'done' : k === milestoneAt ? 'active' : 'todo' }; });
function paintResultTree(pl) {
  const t = tree();
  if (!t || !pl) return;
  const mv = moveOf(pl), why = whyOf(pl), seq = sequenceOf(pl);
  try { t.setChip?.(false); } catch (e) { /* optional */ }
  if (mv.branchId) { try { selecting = true; if (typeof t.selectBranch === 'function') t.selectBranch(mv.branchId); else t.select?.(mv.branchId); } catch (e) { /* optional */ } finally { selecting = false; } }
  try { t.setEvidenceLabels?.(stageAt === 'why' ? why.facts.map((f) => ({ id: f.id, label: f.label, part: f.part ?? 'roots' })) : []); } catch (e) { /* optional */ }
  try { t.setPath?.(mv.branchId ?? null, stageAt === 'plan' || stageAt === 'start' ? milestonesOf(seq) : []); } catch (e) { /* optional */ }
}
/** Fit tree: the readable overview with labels */
function fitTree() { const t = tree(); try { if (typeof t?.fitAll === 'function') t.fitAll(); else if (typeof t?.fit === 'function') t.fit(); else t?.frame?.(resultsFrame()); } catch (e) { /* optional */ } }

/* ---------- the stages: which is current, moving between them, the snap ---------- */
/** what a stage shows in its inspector by default, or what the visitor last opened there */
function restoreStage(k) {
  const had = inspWas[k];
  if (typeof had === 'function') { had(); return; }
  if (k === 'plan') openMilestone(milestoneAt, { quiet: true });
  else if (k === 'why') openWhy({ quiet: true });
  else closeInspector();
}
function setStage(k, o = {}) {
  if (!STAGE_KEYS.includes(k)) return;
  const was = stageAt;
  stageAt = k;
  document.body.dataset.result = k;
  paintNav();
  placeInspector();
  if (was !== k || o.force) restoreStage(k);
  paintResultTree(planObj().plan);
  syncSnap();
}
/** explicit navigation: the stage scrolls into view and its heading takes focus. Passive scrolling never comes here. */
function goStage(k, o = {}) {
  if (!STAGE_KEYS.includes(k)) return;
  setStage(k, o);
  const sec = $(`#stage-${k}`);
  try { sec?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* none */ }
  if (o.focus !== false) { try { $(`#stage-${k} .stage-head`)?.focus({ preventScroll: true }); } catch (e) { /* none */ } }
}
/** D8: proximity snapping is relaxed when a stage is taller than the viewport, the viewport is under 640 px tall, the
    text is enlarged, or the pointer or focus is inside the inspector */
function syncSnap() {
  const c = $('#clearing');
  if (!c) return;
  if (!isPlanStage(stageNow())) { delete c.dataset.snap; return; }
  const vh = window.innerHeight || 0;
  let big = false;
  try { big = parseFloat(getComputedStyle(document.documentElement).fontSize) > 20; } catch (e) { big = false; }
  const tall = $$('.stage', planHost()).some((s) => s.offsetHeight > vh + 8);
  if (inInspector || vh < 640 || tall || big) c.dataset.snap = 'off'; else delete c.dataset.snap;
}
/** passive scrolling: the navigator follows the stage that settled; nothing moves focus and nothing is opened anew
    beyond the stage's own default card */
function nearestStage() {
  const c = $('#clearing');
  if (!c || !isPlanStage(stageNow())) return;
  const tops = STAGE_KEYS.map((k) => ({ k, top: $(`#stage-${k}`)?.offsetTop ?? 0 }));
  if (tops.every((t) => t.top === 0)) return; // no layout has happened (a test page): nothing to follow
  const at = c.scrollTop;
  let best = null, d = Infinity;
  tops.forEach((t) => { const dd = Math.abs(t.top - at); if (dd < d) { d = dd; best = t.k; } });
  if (best && best !== stageAt && d < (window.innerHeight || 800) / 2) setStage(best, { passive: true });
}
function watchStages() {
  const c = $('#clearing');
  if (!c || c.dataset.stagesWatched) return;
  c.dataset.stagesWatched = '1';
  c.addEventListener('scroll', () => { if (!isPlanStage(stageNow())) return; clearTimeout(stageScrollTimer); stageScrollTimer = setTimeout(nearestStage, 80); }, { passive: true });
  window.addEventListener('resize', () => { if (isPlanStage(stageNow())) syncSnap(); });
}
/** on the way in: Your move first, the tree framed for the composition, the chip off, the phone's tree share published */
function enterStages() {
  stageAt = 'move'; milestoneAt = 'today'; inspOpen = null;
  STAGE_KEYS.forEach((k) => { inspWas[k] = null; });
  document.body.dataset.result = 'move';
  if (document.body.dataset.sheetTop) { document.body.dataset.sheetTopWas = document.body.dataset.sheetTop; document.body.dataset.sheetTop = '0.46'; }
  try { tree()?.setChip?.(false); } catch (e) { /* optional */ }
}
/** on the way out: the chip is the questioning's again, the attribute and the snap go, the tree's labels and path clear */
function leaveStages() {
  delete document.body.dataset.result;
  if (document.body.dataset.sheetTopWas) { document.body.dataset.sheetTop = document.body.dataset.sheetTopWas; delete document.body.dataset.sheetTopWas; }
  const c = $('#clearing'); if (c) delete c.dataset.snap;
  inInspector = false;
  try { const t = tree(); t?.setChip?.(true); t?.setEvidenceLabels?.([]); t?.setPath?.(null, []); } catch (e) { /* optional */ }
}
/** the tree's own presses on the plan stage: a milestone opens its card, an evidence label its fact, a branch its
    inspector. Bound once per tree; the explore stage's handlers above are untouched. */
let resultTreeWired = null;
function wireResultTree() {
  const t = tree();
  if (!t || resultTreeWired === t || typeof t.on !== 'function') return;
  resultTreeWired = t;
  try {
    t.on('milestone', (d) => { const id = d && typeof d === 'object' ? d.id : d; if (!isPlanStage(stageNow()) || !id) return; if (stageAt !== 'plan') goStage('plan', { focus: false }); openMilestone(String(id), { focus: !!d?.keyboard }); });
    t.on('evidence', (d) => { const id = d && typeof d === 'object' ? d.id : d; if (!isPlanStage(stageNow()) || !id) return; if (stageAt !== 'why') goStage('why', { focus: false }); openFact(String(id), { focus: !!d?.keyboard }); });
    t.on('select', (id) => { if (!isPlanStage(stageNow()) || !id || selecting) return; openBranch(String(id)); });
  } catch (e) { resultTreeWired = null; }
}
/** every press inside #plan goes through one listener, so a repaint never leaves a control unbound or bound twice */
function runAct(act, arg, b) {
  const tap = () => feel.play('tap', { x: feel.x(b) });
  switch (act) {
    case 'go': tap(); goStage(arg); return;
    case 'first': feel.play('open', { x: feel.x(b) }); goStage('plan'); openMilestone('today'); return;
    case 'why': feel.play('open', { x: feel.x(b) }); goStage('why'); openWhy(); return;
    case 'fact': tap(); openFact(arg); return;
    case 'evidence': tap(); openEvidence(); return;
    case 'change': tap(); try { (M.reopen ?? M.showQuestion)?.(arg); } catch (e) { barSaid('That answer cannot be reopened from here.'); } return;
    case 'ms': tap(); openMilestone(arg); return;
    case 'branch': tap(); openBranch(arg); return;
    case 'alt': tap(); openAlternative(arg); return;
    case 'use': useDirection(arg); return;
    case 'backplan': tap(); { const pl = planObj().plan; const mv = moveOf(pl); try { selecting = true; const t = tree(); if (typeof t?.selectBranch === 'function') t.selectBranch(mv.branchId); else t?.select?.(mv.branchId); } catch (e) { /* optional */ } finally { selecting = false; } } if (stageAt !== 'plan') goStage('plan'); openMilestone(milestoneAt); return;
    case 'fit': tap(); fitTree(); return;
    case 'dl': downloadFromBar(b); return;
    case 'brief': downloadBrief(b); return;
    case 'book': { const st = startOf(planObj().plan); if (!st.destination) return; tap(); window.open(st.destination, '_blank', 'noopener'); return; }
    case 'backfirst': tap(); goStage('plan'); openMilestone('today'); return;
    case 'insp-close': feel.play('close', { x: feel.x(b) }); closeInspector(); return;
    default: return;
  }
}
/** the implementation brief as a file, when no booking destination exists: the whole plan, never described as sent */
async function downloadBrief(btn) {
  const pl = planObj().plan;
  if (!pl) { barSaid('There is no plan to download yet.'); return; }
  btn.disabled = true;
  feel.play('tap', { x: feel.x(btn) });
  const name = `mercer-implementation-brief-${slug()}.md`;
  const ok = await save(name, new Blob([planMarkdown(pl)], { type: 'text/markdown' }));
  barSaid(ok ? `Saved ${name}. Nothing was sent.` : 'The file was not saved.');
  btn.disabled = false;
}
function bindStageHost(h) {
  if (h.dataset.stagesBound) return;
  h.dataset.stagesBound = '1';
  h.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
    if (!b || !h.contains(b) || b.disabled) return;
    const s = String(b.dataset.act);
    const i = s.indexOf(':');
    runAct(i < 0 ? s : s.slice(0, i), i < 0 ? '' : s.slice(i + 1), b);
  });
  /* the completion tick: it records that the visitor marked the task, repaints the card and the path, and claims nothing */
  h.addEventListener('change', (e) => {
    const cb = e.target instanceof Element ? e.target.closest('input[data-done]') : null;
    if (!cb) return;
    const id = String(cb.dataset.done);
    if (cb.checked) doneMarks.add(id); else doneMarks.delete(id);
    feel.play(cb.checked ? 'done' : 'tap', { gain: 0.4, x: feel.x(cb) });
    openMilestone(milestoneAt, { quiet: true });
  });
  watchStages();
}

/** the four stages, built from the plan and the elements the plan view already filled. Every id of the old view is
    placed inside a stage; the inspector goes to the current stage's column. */
function planStages(h, p) {
  const pl = p.plan;
  const mv = moveOf(pl), why = whyOf(pl), seq = sequenceOf(pl), st = startOf(pl);
  const nav = ensureNav();
  ensureInspector();
  const stage = (k, name, html) => { const s = mk(`stage-${k}`, 'section', 'stage'); s.dataset.stage = k; s.setAttribute('aria-label', name); s.innerHTML = `<div class="stage-tree" aria-hidden="true"></div><div class="stage-col">${html}</div>`; return s; };
  const eyebrow = (word, id) => `<p class="eyebrow stage-eyebrow"><i class="dot"></i><span class="name"${id ? ` id="${id}"` : ''}>${esc(word)}</span></p>`;
  const col = (s) => $('.stage-col', s);
  // 1. Your move: the answer the visitor came for, and the one press that takes them to the first step
  const sMove = stage('move', 'Your move', `${eyebrow(mv.goalLabel, 'move-goal')}
    <h2 class="stage-head" id="move-head" tabindex="-1">${esc(mv.headline)}</h2>
    <p class="stage-sub" id="move-support">${esc(mv.support)}</p>
    ${mv.hypothesis ? '<p class="stage-tag"><span class="tag" id="move-hyp">Working hypothesis</span><span class="small">The diagnosis is not settled; the plan says what would settle it.</span></p>' : ''}
    <button type="button" class="stage-cta" id="move-go" data-act="first">Show my first step</button>
    <p class="stage-second"><button type="button" class="link" id="move-why" data-act="why">Why this move?</button></p>
    <div class="stage-insp"></div>`);
  col(sMove).append(p.status, treeListEl(pl, mv, why, seq, p.tv));
  // 2. Why: the evidence labels, the mission line, the inspector's default card, and Open my plan
  const sWhy = stage('why', 'Why this move', `${eyebrow('Why this move')}
    <h2 class="stage-head" id="why-head" tabindex="-1">${esc(mv.headline)}</h2>
    ${why.facts.length ? `<div class="why-facts" role="group" aria-label="Evidence">${why.facts.map((f) => `<button type="button" class="fact" data-act="fact:${esc(f.id)}" aria-pressed="false">${esc(f.label)}</button>`).join('')}</div>` : ''}
    <div class="stage-insp"></div>
    ${why.mission ? `<p class="stage-sub" id="why-mission">${esc(why.mission)}</p>` : ''}
    <p class="stage-second"><button type="button" class="link" id="why-evidence" data-act="evidence">Show evidence</button>${why.answerId ? `<button type="button" class="link" id="why-change" data-act="change:${esc(String(why.answerId))}">Change an answer</button>` : ''}</p>
    <button type="button" class="stage-cta" id="why-go" data-act="go:plan">Open my plan</button>`);
  const whyMore = mk('why-more', 'details', 'drawer');
  if (!$('summary', whyMore)) { const s = document.createElement('summary'); s.textContent = 'The finding in full'; whyMore.appendChild(s); }
  whyMore.append(p.decision);
  col(sWhy).appendChild(whyMore);
  // 3. Your plan: the three milestones as tabs and on the tree, one card open, the help press and the download
  const sPlan = stage('plan', 'Your plan', `${eyebrow(pl.route === 'starter' ? 'Your first test' : 'Your plan')}
    <h2 class="stage-head" id="plan-head" tabindex="-1">Today, this week, then a review.</h2>
    <div class="ms-tabs" role="tablist" aria-label="Milestones" id="plan-tabs">${MS.map(([k, name]) => `<button type="button" role="tab" class="ms-tab" data-act="ms:${k}" data-ms="${k}" aria-selected="${k === milestoneAt}">${name}</button>`).join('')}</div>
    <div class="stage-insp"></div>
    <button type="button" class="stage-cta" id="plan-go" data-act="go:start">Get help putting this into action</button>
    <p class="stage-second"><button type="button" class="link" id="plan-dl" data-act="dl">Download my plan</button></p>`);
  const planMore = mk('plan-more', 'details', 'drawer');
  if (!$('summary', planMore)) { const s = document.createElement('summary'); s.textContent = 'The full plan, the downloads and what needs to be true'; planMore.appendChild(s); }
  planMore.append(p.truth, p.secs, p.downloads);
  col(sPlan).appendChild(planMore);
  // 4. Start: the invitation, one honest CTA, the secondaries, the reviewed sharing road, and the small print in one drawer
  const book = st.cta === 'book' && st.destination;
  const sStart = stage('start', 'Start', `${eyebrow('Start')}
    <h2 class="stage-head" id="start-head" tabindex="-1">${esc(st.headline)}</h2>
    <p class="stage-sub" id="start-line">${esc(st.sentence)}</p>
    ${book ? '<button type="button" class="stage-cta" id="start-go" data-act="book">Book a call with TMA</button><p class="small" id="start-note">The call is about fit, commitment and scope. Opening the calendar sends nothing; what you share is a separate choice.</p>'
    : '<button type="button" class="stage-cta" id="start-go" data-act="brief">Download my implementation brief</button><p class="small" id="start-note">No booking destination is configured on this page, so the brief is the next step: download it and send it yourself. It is a file on your device, not a message.</p>'}
    <p class="stage-second"><button type="button" class="link" id="start-dl" data-act="dl">Download my plan</button><button type="button" class="link" id="start-back" data-act="backfirst">Back to my first step</button></p>
    <div class="stage-insp"></div>`);
  col(sStart).appendChild(p.jsonBtn);
  const more = mk('start-more', 'details', 'drawer');
  if (!$('summary', more)) { const s = document.createElement('summary'); s.textContent = 'The detail: the model, your answers, saving and the disclaimer'; more.appendChild(s); }
  [p.invite, p.tmaBtn, p.help, p.callBtn, p.extra, p.agentBtn, p.agentHost, p.next, p.saveHost, p.legal].filter(Boolean).forEach((el) => more.appendChild(el));
  col(sStart).appendChild(more);
  h.innerHTML = '';
  h.append(p.back, p.title, nav, sMove, sWhy, sPlan, sStart);
  bindStageHost(h);
  wireResultTree();
  setStage(stageAt, { force: true });
  return [sMove, sWhy, sPlan, sStart];
}


function paintPlan(fresh) {
  paintCount += 1;
  const h = planHost();
  if (!h) return;
  const { plan: pl, stale } = planObj();
  h.setAttribute('aria-label', 'Your plan');
  /* the shell's own heading is adopted whichever id it carries (#hv-title, or #plan-title in an earlier draft) */
  const title = $('#hv-title', h) ?? $('#plan-title', h) ?? mk('hv-title', 'h2', 't-caption'); title.textContent = 'Your plan'; // R19: the label is 'Your plan', as written; it is not title-cased into 'Your Plan' h.setAttribute('aria-labelledby', title.id);
  const back = mk('hv-back', 'button', 'glass small'); back.type = 'button'; back.setAttribute('aria-label', 'Back to the tree'); back.textContent = '‹';
  const status = mk('plan-model-host', 'div', 'plan-status');
  const tv = mk('tree-view-host', 'div', '');
  const decision = mk('plan-decision', 'div', '');
  /* Task 34: the handful of assumptions driving the result, one press away from the decision */
  const truth = mk('plan-truth', 'div', 'plan-truth');
  const firstHost = mk('plan-first', 'div', ''); // the plan stage's card host; it lives inside the inspector (ensureInspector)
  const secs = mk('plan-secs', 'div', 'plan-secs');
  const downloads = mk('plan-downloads', 'div', 'plan-downloads');
  const help = mk('plan-help', 'div', 'plan-help');
  const extra = mk('hv-extra', 'div', '');
  const disc = mk('hv-disclaimer', 'section', ''); disc.setAttribute('aria-label', 'Disclaimer');
  const priv = mk('hv-private', 'p', 'small');
  /* Declan Murphy, 28 September: the disclaimer and the line naming what the page loads were dominating the foot of the
     plan. They keep every word and sit shut in a drawer, which a press or the keyboard opens and which prints open. */
  const legal = mk('hv-legal', 'details', 'drawer');
  if (!$('summary', legal)) { const sum = document.createElement('summary'); sum.textContent = 'Privacy and disclaimer'; legal.appendChild(sum); }
  legal.appendChild(priv); legal.appendChild(disc);
  const saveHost = mk('hv-save', 'div', '');
  const agentHost = mk('agent', 'div', '');
  const a = archetype();
  const agentBtn = mkRow('hv-agent', a ? a.name : 'Your agent', 'ask about your tree: optional reflection', 'fill-you-hue');
  const pdfBtn = mkRow('hv-pdf', 'Download plan (PDF)', window.jspdf?.jsPDF ? 'the whole plan on paper: every action with its steps, the evidence and the method' : 'the PDF library did not load; the implementation brief below holds the same plan', 'fill-estimate');
  pdfBtn.disabled = !window.jspdf?.jsPDF;
  const mdBtn = mkRow('hv-md', 'Download implementation brief (.md)', 'markdown another person or assistant can use at once', 'fill-you');
  const copyBtn = mkRow('hv-copy', 'Copy implementation brief', 'the same markdown, to your clipboard', 'fill-you');
  const progBtn = mkRow('hv-progress', 'Download progress file', 'a JSON file of your answers, to continue on another device; not the readable plan', 'fill-crown');
  const hasProgress = typeof M.save?.exportFile === 'function';
  /* Task 23: the call goes to a real destination or the row is not shown at all; it is never a dead control */
  const book = bookingOf();
  const callBtn = mkRow('hv-call', 'Book a call', 'explore fit, commitment and implementation scope; opening the calendar sends nothing', 'fill-crown');
  const tmaBtn = mkRow('hv-tma', 'Build this with TMA', 'what you would bring, what TMA could build around it, and the call', 'fill-crown'); tmaBtn.setAttribute('aria-haspopup', 'dialog');
  const jsonBtn = mkRow('hv-json', 'Choose what to share', 'see what the brief holds, choose its sections, download it to send', ''); jsonBtn.setAttribute('aria-haspopup', 'dialog');
  const diyBtn = mkRow('hv-diy', 'Do it yourself', 'the materials and the implementation brief are yours', 'fill-you');
  const invite = mk('plan-invite', 'p', 'plan-invite'); invite.textContent = TMA_INVITE;
  const next = mk('hv-next', 'p', 'small'); next.textContent = 'Keeping this private is the default. Nothing on this page is sent anywhere; every download is a file on your device.';
  $$('.hv-line', h).forEach((l) => l.remove());
  once(back, (el) => el.addEventListener('click', () => leaveHarvest()));
  if (!pl) {
    decision.innerHTML = `<p class="lead">${esc(NOT_READY)}</p>`;
    [status, tv, truth, firstHost, secs, downloads, help, callBtn, extra, agentBtn, agentHost, next].forEach((el) => el.remove());
    $$('.stage, #plan-nav, #inspector', h).forEach((el) => el.remove());
    [back, title, decision, saveHost, legal].forEach((el) => h.appendChild(el));
    disc.innerHTML = disclaimerHtml(false);
    $('#disc-more', disc)?.addEventListener('click', () => { const b = $('#disc-body', disc); feel.toggle(b, b.hidden, $('#disc-more', disc)); });
    paintSave(); paintPrivate();
    return;
  }
  const openSecs = fresh ? new Set() : new Set($$('.sec-head[aria-expanded="true"]', secs).map((b) => b.getAttribute('aria-controls')));
  status.innerHTML = modelStateHtml(pl);
  tv.innerHTML = treeViewHtml();
  decision.innerHTML = decisionHtml(pl, stale);
  const truthWasOpen = !fresh && !!$('#plan-truth-body', truth) && !$('#plan-truth-body', truth).hidden;
  truth.innerHTML = `<p class="plan-truth-head">${modeChip(pl)}<button type="button" class="link" id="plan-truth-more" aria-expanded="${truthWasOpen ? 'true' : 'false'}" aria-controls="plan-truth-body">What needs to be true</button></p><div id="plan-truth-body"${truthWasOpen ? '' : ' hidden'}>${truthHtml(pl)}</div>`;
  $('#plan-truth-more', truth).addEventListener('click', (ev) => { const b = $('#plan-truth-body', truth); feel.toggle(b, b.hidden, ev.currentTarget); });
  secs.innerHTML = planSections(pl).map(([id, t, c, body]) => secHtml(id, t, c, body)).join('');
  openSecs.forEach((id) => { const body = $(`#${id}`, secs); const head = $(`[aria-controls="${id}"]`, secs); if (body && head) { body.hidden = false; head.setAttribute('aria-expanded', 'true'); } });
  downloads.innerHTML = '';
  [pdfBtn, mdBtn, copyBtn, ...(hasProgress ? [progBtn] : [])].forEach((b) => downloads.appendChild(b));
  help.innerHTML = '';
  /* Do it yourself sits with the small print; Choose what to share stands on the Start stage as the reviewed sharing road */
  help.appendChild(diyBtn);
  const ep = plan();
  const words = ep && hasDepth(pl) ? routeWords(ep) : null;
  const score = Math.round(ep?.alignment?.composite ?? 0);
  const moreOpen = !fresh && !!$('#align-body', extra) && !$('#align-body', extra).hidden;
  extra.innerHTML = ep && hasDepth(pl) ? `<div class="align"><p class="eyebrow"><i class="dot"></i><span class="name">Mission Alignment</span></p><p class="align-num tabular">${score}<span class="small"> of 100</span></p><div class="align-bar" style="--w:${clamp(score, 0, 100)}%;--bar:${TMA_BAR}%" role="img" aria-label="${score} of 100. TMA takes on work above ${TMA_BAR}."><i></i><b></b></div><p class="align-line">${esc(alignmentLine(false))}</p><button type="button" class="drop small" id="align-more" aria-expanded="${moreOpen ? 'true' : 'false'}" aria-controls="align-body" aria-label="What the score is made of">▾</button></div>
    <div id="align-body" class="align-body"${moreOpen ? '' : ' hidden'}>${Object.entries(ep.alignment?.components ?? {}).map(([k, v]) => `<div class="part"><span>${esc(COMPONENTS[k]?.[0] ?? k)}</span><i style="--w:${Math.round(v)}%"></i><b class="tabular">${Math.round(v)}</b><p class="small">${esc(componentWords(k, v, ep))}</p></div>`).join('')}${words?.rest ? `<p class="small">${esc(words.rest)}</p>` : ''}</div>` : '';
  extra.hidden = !extra.innerHTML;
  $('#align-more', extra)?.addEventListener('click', () => { const b = $('#align-body', extra); feel.toggle(b, b.hidden, $('#align-more', extra)); });
  const discOpen = !fresh && !!$('#disc-body', disc) && !$('#disc-body', disc).hidden;
  disc.innerHTML = disclaimerHtml(discOpen);
  $('#disc-more', disc).addEventListener('click', () => { const b = $('#disc-body', disc); feel.toggle(b, b.hidden, $('#disc-more', disc)); });
  if (!book.url) callBtn.remove();
  /* Results round 1: the four stages. A fresh paint (the way in) starts at Your move with nothing open; a repaint (the
     ladder landing, a revision, a tick) keeps the stage, the milestone and whatever the visitor had open. */
  if (fresh) enterStages();
  firstHost.innerHTML = '';
  planStages(h, {
    back, title, status, tv, decision, truth, secs, downloads, help, extra, agentBtn, agentHost, next, saveHost, legal,
    callBtn: book.url ? callBtn : null, tmaBtn, jsonBtn, route: pl.route, plan: pl, invite,
  });
  if (fresh) { agentHost.innerHTML = ''; agentHost.hidden = true; agentBtn.setAttribute('aria-expanded', 'false'); const c = $('#clearing'); if (c) c.scrollTop = 0; }
  paintSave(); paintPrivate();
  bindSections(secs, pl);
  bindTreeView(tv, pl);
  setTreeView(treeView, pl);
  if (selected) { const sa = (pl.actions ?? []).find((q) => q.id === selected); if (sa) selectAction(sa); }
  const b = $('#plan-retry', status) ?? $('#plan-refine', status);
  if (b) b.addEventListener('click', () => { feel.play('tap', { x: feel.x(b) }); refinePlan(planObj().plan, { retry: true }); });
  const saved = (btn, filename) => {
    let l = $(`#${btn.id}-saved`, h);
    if (!l) { l = document.createElement('p'); l.id = `${btn.id}-saved`; l.className = 'small hv-saved'; }
    btn.insertAdjacentElement('afterend', l);
    l.textContent = `Saved ${filename}.`;
    l.hidden = false;
    clearTimeout(l.timer);
    l.timer = setTimeout(() => { l.hidden = true; }, 3000);
  };
  once(mdBtn, (el) => el.addEventListener('click', async (e) => { const btn = e.currentTarget; btn.disabled = true; const name = `mercer-plan-${slug()}.md`; const ok = await save(name, new Blob([planMarkdown(planObj().plan)], { type: 'text/markdown' })); if (ok) { feel.play('done', { gain: 0.5, x: feel.x(btn) }); saved(btn, name); } btn.disabled = false; }));
  once(copyBtn, (el) => el.addEventListener('click', (e) => copyText(planMarkdown(planObj().plan), $('.hv-word', e.currentTarget))));
  once(pdfBtn, (el) => el.addEventListener('click', async (e) => { const btn = e.currentTarget; btn.disabled = true; const name = await exportPdf(); if (name) { feel.play('done', { gain: 0.5, x: feel.x(btn) }); saved(btn, name); } else { saved(btn, ''); const l = $('#hv-pdf-saved', h); if (l) l.textContent = 'The PDF was not made. The implementation brief holds the same plan; press Download plan again to retry.'; } btn.disabled = !window.jspdf?.jsPDF; }));
  once(progBtn, (el) => el.addEventListener('click', async (e) => { const btn = e.currentTarget; btn.disabled = true; let text = null; try { text = await M.save.exportFile(); } catch (err) { text = null; } const name = text ? `mercer-progress-${slug()}.json` : null; const ok = text ? await save(name, text) : false; if (ok) { feel.play('done', { gain: 0.5, x: feel.x(btn) }); saved(btn, name); } else { saved(btn, ''); const l = $('#hv-progress-saved', h); if (l) l.textContent = text ? 'Not saved. Try again.' : 'There is nothing to save yet.'; } btn.disabled = false; }));
  once(callBtn, (el) => el.addEventListener('click', (e) => { const dest = bookingOf().url; if (!dest) return; feel.play('tap', { x: feel.x(e.currentTarget) }); window.open(dest, '_blank', 'noopener'); }));
  once(tmaBtn, (el) => el.addEventListener('click', (e) => openTma(e.currentTarget)));
  once(jsonBtn, (el) => el.addEventListener('click', (e) => openShare(e.currentTarget)));
  once(diyBtn, (el) => el.addEventListener('click', (e) => { feel.play('tap', { x: feel.x(e.currentTarget) }); const head = $('[aria-controls="ps-materials-body"]', secs); const body = $('#ps-materials-body', secs); if (head && body && body.hidden) feel.toggle(body, true, head); try { $('#ps-materials', secs)?.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' }); } catch (err) { /* none */ } }));
  const mountAgent = () => { agentHost.innerHTML = agentHtml(); bindAgent(agentHost, () => { mountAgent(); paintPlan(false); }); agentHost.hidden = false; };
  once(agentBtn, (el) => el.addEventListener('click', (e) => {
    const open = agentHost.hidden;
    feel.play(open ? 'open' : 'close', { x: feel.x(e.currentTarget) });
    if (open) { mountAgent(); agentHost.querySelector('input')?.focus({ preventScroll: true }); }
    else { agentHost.hidden = true; agentHost.innerHTML = ''; }
    agentBtn.setAttribute('aria-expanded', String(open));
  }));
}
/** the plan view: the stage moves and the listener paints; a press that built the plan asks the model to refine it (R16) */
function openPlan(o = {}) {
  const was = paintCount;
  if (o.refine || recentGesture()) freshPlan();
  goPlan();
  if (!isPlanStage(stageNow())) return;
  try { tree()?.frame(resultsFrame()); } catch (e) { /* optional */ }
  setTint('--sec-crown');
  if (paintCount === was) paintPlan(true);
  if (o.refine || recentGesture()) refinePlan(planObj().plan);
}
/** Build my plan (the shell's example, the flow's readiness screen): the plan view, then the model on this press */
const buildPlan = (o = {}) => openPlan({ refine: o.refine !== false });
/** C1: the way out of the plan view. The stage goes to explore here, and the card the visitor left comes back. */
function leaveHarvest() {
  feel.play('back');
  const id = openId;
  go('explore');
  if (stageNow() === 'explore' && id) openCard(id);
}

/* ============ Rebuild 1, R13 and brief 3.2: the example preview ============
   renderPlanInto(host, plan, { example }) renders a plan object into a sandbox host: the recap's chapter headings compactly,
   the first action card and a branch inspector. It reads the plan alone, never M.state, and writes nothing but the host. */
function renderPlanInto(host, raw, o = {}) {
  if (!host || !raw) return null;
  const pl = normPlan(raw, { live: false });
  const ex = o.example !== false || !!raw.example;
  const chapters = chaptersOf(pl);
  const actions = (pl.actions ?? []).filter((a) => !a.fromAnswers);
  const first = pl.firstAction ?? actions[0] ?? null;
  const limbs = uniq(actions.map((a) => a.affects?.limb).filter(Boolean));
  host.classList.add('plan-example');
  host.innerHTML = `${ex ? '<p class="eyebrow"><span class="tag">Example</span><span class="name">A sample plan, not a real client, not a benchmark</span></p>' : ''}
    <ol class="ex-chapters">${chapters.map((c, i) => `<li><span class="small">${i + 1}</span><b>${esc(c.title)}</b><span class="ex-fig">${esc(c.figure)}</span>${c.lines[0] ? `<span class="small">${esc(c.lines[0])}</span>` : ''}</li>`).join('')}</ol>
    ${first ? actionCardHtml(first, { assets: pl.assets, example: ex, eyebrow: pl.route === 'starter' ? 'Your first test' : 'First action' }) : ''}
    <div class="ex-inspect"><p class="small res-label">Inspect a branch${ex ? ' (example)' : ''}</p><div class="ex-limbs">${limbs.map((l) => `<button type="button" class="glass small" data-limb="${esc(l)}" aria-pressed="false">${esc(cap(LIMB_WORD[l] ?? l))}</button>`).join('')}</div><p class="small ex-line"></p></div>`;
  bindActionCards(host, pl, { example: true });
  $$('[data-limb]', host).forEach((b) => b.addEventListener('click', () => {
    const a = actions.find((q) => q.affects?.limb === b.dataset.limb);
    $$('[data-limb]', host).forEach((q) => q.setAttribute('aria-pressed', String(q === b)));
    const line = $('.ex-line', host);
    if (line) line.textContent = a ? `${wordsOf(a.action)}: ${affectWords(a)}` : '';
    $$('.action-card', host).forEach((el) => el.classList.toggle('selected', !!a && el.dataset.action === a.id));
  }));
  return { chapters, first, limbs };
}
/* ============ fit words (v11, kept; the gauge went in fix 3: U5, the dial the client named) ============ */
const NOTE_LEAD = { forecastConfidence: 'Scenario confidence', headroom: 'Headroom', capacityFit: 'Capacity fit', constraintSolvability: 'Constraint solvability', marginStructure: 'Margin structure', unitEconomicsViability: 'Unit-economics viability', dataAvailability: 'Data availability' };
function componentWords(key, v, p) {
  const note = (p.alignmentNotes ?? []).find((x) => NOTE_LEAD[key] && x.startsWith(NOTE_LEAD[key])) ?? '';
  const num = (re) => { const mm = note.match(re); return mm ? Number(mm[1]) : null; };
  const meaning = `${COMPONENTS[key]?.[1] ?? 'Part of the score'}.`;
  if (key === 'forecastConfidence') { const wide = num(/spans ([\d.]+)%/), typical = num(/against ([\d.]+)% typical/); return wide !== null && typical !== null ? `${meaning} The range of revenue you add spans ${oneDp(wide / 100)} times its middle figure; ${oneDp(typical / 100)} times is typical for a business sharing this much data. Typical scores 50, twice typical scores 0.` : meaning; }
  if (key === 'headroom') { const add = num(/adds £([\d.]+)\/month/), upl = num(/\(([\d.]+)% uplift/), full = num(/([\d.]+)% scores 100/); return add !== null && upl !== null ? `${meaning} The middle run adds about ${gbp(add)} a month, ${Math.round(upl)}% on today. A ${full ?? 33}% rise scores 100.` : meaning; }
  if (key === 'capacityFit') { const peak = peakOf(p) !== undefined ? peakOf(p) * 100 : num(/peak utilisation ([\d.]+)%/), comfort = num(/([\d.]+)% comfort/), knee = num(/knee at ([\d.]+)%/); const capped = /capped at 80/.test(note) ? ' It stays at 80 or below while today’s workload is Mercer’s estimate.' : ''; return peak !== null ? `${meaning} At your busiest you are ${Math.round(peak)}% full${comfort !== null ? `; above ${Math.round(comfort)}% gets tight` : ''}${knee !== null ? `, and past ${Math.round(knee)}% waits cost sales` : ''}.${capped}` : `${meaning}${capped}`; }
  if (key === 'constraintSolvability') { const b = bindingOf(p); if (!b) return `${meaning} ${noLimitWords()}`; if (b.type === 'client_capacity') return `${meaning} Your capacity limits growth first, and only you can add to it${b.diagnostics?.expandable === false ? '. You said it cannot grow' : ''}.`; return `${meaning} ${b.type === 'market_depletion' ? 'The number of prospects limits' : 'Route sending limits hold back'} growth first, and TMA can change that.`; }
  if (key === 'marginStructure') { const mine = num(/gross margin ([\d.]+)%/), typical = num(/mean of ([\d.]+)%/); return mine !== null && typical !== null ? `${meaning} You keep ${Math.round(mine)}p of each £1; typical for your industry is ${Math.round(typical)}p. Typical scores 50, double typical scores 100.` : meaning; }
  if (key === 'unitEconomicsViability') { const ratio = num(/LTV:CAC at p50 is ([\d.]+)/); const capped = /capped at 60/.test(note) ? ' It stays at 60 or below until Mercer knows how many customers buy again.' : ''; return ratio !== null ? `${meaning} In the middle run each customer brings in ${oneDp(ratio)} times what they cost to win. 3 times scores 50, 5 times scores 100.${capped}` : `${meaning}${capped}`; }
  if (key === 'dataAvailability') { const has = [[/CRM absent/i, 'no CRM connected'], [/no observed history/i, 'no past results'], [/addressable count (estimated|unknown)/i, 'an estimated count of prospects']].filter(([re]) => re.test(note)).map(([, w]) => w); return has.length ? `${meaning} Mercer has ${has.length > 1 ? `${has.slice(0, -1).join(', ')} and ${has[has.length - 1]}` : has[0]}. A CRM or past results raise it.` : meaning; }
  return meaning;
}
/** the Mission Alignment result in the page's own words: long (every sentence, for the exports), short (the first sentence that
    says something beyond the score the face already shows, C15) and rest (what follows it, for the harvest's ▾). C29: no "floor";
    the two thresholds are said as what they are. Request 2: the call is open to everyone, so nothing here says "book" of the
    work TMA takes on. */
function routeWords(p) {
  const score = Math.round(p.alignment?.composite ?? 0);
  const comps = p.alignment?.components ?? {};
  const lim = limitOf(p);
  const binding = bindingOf(p);
  const parts = [];
  if (p.undetermined) { const u = p.undetermined; parts.push(`On your answers this is work TMA would take on, but the answer turns on your count of prospects, an estimate. At ${count(u.low)} or ${count(u.high)} prospects it changes, so Mercer waits for a checked count.`); }
  else if (p.routedOn === 'improved' && p.improved) { const imp = Math.round(p.improved.composite ?? score); parts.push(`On your answers it scores ${score} of 100.`); parts.push(`${lim ? `${lim.short} ` : ''}TMA can change that, so Mercer re-ran your plan with ${lc(leverWords(p.improved.lever).title)}: it scores ${imp} of 100, ${p.improved.routing === 'book' ? `above the ${TMA_BAR} TMA works above` : p.improved.routing === 'decline' ? 'still under 50, the score below which TMA does not take work' : `still under the ${TMA_BAR} TMA works above`}.`); }
  else if (p.routing === 'book') parts.push(`It scores ${score} of 100. ${lim ? 'TMA can lift what limits growth first' : 'no constraint was found within this model'}, and you can deliver the extra work.`);
  else if (binding?.type === 'client_capacity' && p.routing === 'nurture') parts.push(`It scores ${score} of 100. ${lim ? `${lim.short} ` : ''}Only you can add capacity, so Mercer suggests adding it before spending more on growth.`);
  else if (p.routing === 'decline' && score < 50) parts.push(`It scores ${score} of 100, under 50, the score below which TMA does not take work: the revenue this plan can add is small next to what you make today.`);
  else if (p.routing === 'decline') parts.push(`${lim ? `${lim.short} ` : ''}You said capacity cannot grow, so you could not deliver the extra work this plan wins.`);
  else { const gates = []; if (score < TMA_BAR) gates.push('the forecast is too wide to commit anyone to'); if ((comps.constraintSolvability ?? 100) < 55) gates.push('TMA struggles to lift what limits growth'); if ((comps.capacityFit ?? 100) < 40) gates.push('you could not deliver the extra work'); parts.push(gates.length ? `It scores ${score} of 100: ${gates.join(', and ')}.` : `It scores ${score} of 100.`); }
  const fix = (p.clearsFloorAt ?? []).map((x) => (x.inputId === 'acv' ? `an average sale of about ${gbp(x.valueNeeded)}` : `about ${count(x.valueNeeded)} prospects`));
  if (fix.length) parts.push(`It would reach 50 with ${fix.join(', or ')}.`);
  else if (p.closestMiss) parts.push(`With ${p.closestMiss.inputId === 'acv' ? `an average sale of ${gbp(p.closestMiss.valueTried)}` : `${count(p.closestMiss.valueTried)} prospects`}, it reaches ${Math.round(p.closestMiss.compositeReached)} of 100.`);
  /* the face already shows the score, so the short form starts after it */
  const past = (t) => cap(String(t).replace(/^(?:On your answers it|It) scores \d+ of 100(?:[.:]|,)\s*/, '').trim());
  const said = parts.map(past);
  const at = said.findIndex((t) => t);
  return { long: parts.join(' '), short: at >= 0 ? said[at] : '', rest: said.filter((t, i) => t && i > at).join(' ') };
}

/* ============ exports: markdown for an assistant, a PDF for people, JSON for TMA ============ */
/* Refine 1, R8: the Disclaimer, one wording for the Harvest and both exports. The shell's copy (M.DISCLAIMER = { short[], full[] })
   is used when it exposes one, so the tutorial, the help panel and this page say the same four sentences. */
const DISCLAIMER_SHORT = [
  'Mercer’s figures are forecasts, not guarantees.',
  'They depend on what you supply: a wrong or missing answer moves them.',
  'Industry benchmarks and Mercer’s estimates may not fit your business.',
  'This is strategic guidance, not legal, tax, accounting, investment or regulated financial advice.',
];
const DISCLAIMER_FULL = [
  'Mercer runs a simulation in your browser. Each run draws your answers and your industry’s figures from ranges, so the result is a spread of outcomes, and no single outcome is promised.',
  'Where you gave no figure Mercer used an industry figure or its own estimate. Each figure on the page names its source.',
  'The steps are ranked by modelled revenue against difficulty. Carrying one out can cost money and time the model does not see.',
  'Nothing here knows your legal, tax or regulatory position. Take decisions on ownership, employment, tax, borrowing or investment to a qualified professional.',
  'Use Mercer for education and self-reflection. TMA promises no revenue, profit or value from it.',
];
const disclaimer = () => { const d = M.DISCLAIMER; const ok = (a) => Array.isArray(a) && a.length && a.every((t) => typeof t === 'string' && t); return { short: ok(d?.short) ? d.short.map(clean) : DISCLAIMER_SHORT, full: ok(d?.full) ? d.full.map(clean) : DISCLAIMER_FULL }; };
/** the one-line form for a PDF's footer, where the four sentences do not fit; the PDF's last page carries them whole */
const DISCLAIMER_FOOT = 'Scenarios, not forecasts, guarantees or advice: see Disclaimer';
const ANSWER_KEYS = ['biz', 'site', 'place', 'basis', 'goalMode', 'spendNow', 'personality', 'cv', 'stack', 'stackNames', 'niche', 'sector', 'trade', 'now', 'goal', 'months', 'appetite', 'doing', 'tried', 'went', 'note', 'runway', 'systems', 'cycle', 'hours', 'strengths', 'avoids', 'win', 'help', 'risk', 'channel', 'offLimits', 'price', 'closeRate', 'who', 'capacity', 'servedNow', 'budget', 'margin', 'market', 'repeat', 'retention', 'fixedCosts', 'lastFive', 'topShare', 'network', 'funding', 'retainerMin', 'retainerMax', 'retainerValue', 'listSize', 'buyerNote',
  /* Refine 1: Established, Two weeks off, the founder answers (R17) and the control answers (R18) */
  'yearsTrading', 'estMonth', 'holiday', 'energy', 'avoided', 'delegation', 'decisionSpeed', 'futureRole', 'ownership', 'ownShare', 'profitShare', 'decisionRights', 'influence', 'keyPeople', 'plannedChanges', 'retain', 'exitIntent', 'unresolved'];
/** Sets and Maps at any depth are written as lists and objects, so a sort's answer survives JSON */
const plain = (v) => (v instanceof Set ? [...v].map(plain) : v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) : v);
const snapshot = () => ({ ...Object.fromEntries(ANSWER_KEYS.filter((k) => state[k] !== undefined).map((k) => [k, plain(state[k])])), skipped: [...(state.skipped ?? [])], notSure: [...(state.notSure ?? [])], na: [...(state.na ?? [])], asked: [...(state.asked ?? [])] });

async function save(filename, data) {
  const cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    try {
      const dl = await cl.use('downloads');
      if (dl) { const r = await dl.save({ filename, data }); return r?.status === 'saved'; }
    } catch (e) { if (e && e.code === 'declined') return false; }
  }
  try {
    const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch (e) { return false; }
}

/** everything the page reports, as one object: the PDF, the markdown and the JSON read this */
function report() {
  const p = plan();
  if (!p) return null;
  const m = goalMonth();
  const r = rangeAt(m);
  const gp = (() => { try { return M.gapOf(r.sorted, basis() === 'revenue' ? state.goal : null); } catch (e) { return { short: 0, onCourse: true, mid: r.p50 }; } })();
  const rows = inputs();
  const sens = [...(p.sensitivity ?? [])].filter((s) => Math.abs(s.elasticity) >= 0.01).sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity)).slice(0, 3);
  const lim = limit();
  const lad = ladderNow();
  const bRow = rows.find((x) => x.key === 'budget');
  const level = state.appetite ?? 'moderate';
  return {
    business: bizName(), tree: treeName(), summary: overall(), diagnosis: diagnosis(), basis: basis(), website: state.site || null,
    industry: ind() ? `${ind().name}${state.trade ? `, ${state.trade}` : ''}` : null,
    /* C37: whether the growth spend is the visitor's own figure travels with it, so no export says "you said" of a default;
       U1: None is no growth spend, and the penny the engine was sent is never exported as a budget */
    goal: basis() === 'revenue' ? state.goal : null, budgetPerMonth: noSpend() ? 0 : p.budget, noGrowthSpend: noSpend(), budgetGiven: budgetSaid(), budgetSource: noSpend() ? 'your answer' : FROM_WORD(bRow?.from ?? 'assumed'), appetite: level, goalMonth: monthName(m), revenueNow: p.base,
    range: { p10: Math.round(r.p10), p25: Math.round(r.p25), p50: Math.round(r.p50), p75: Math.round(r.p75), p90: Math.round(r.p90) },
    addedOver12Months: { p10: Math.round(p.added?.p10 ?? 0), p50: Math.round(p.added?.p50 ?? 0), p90: Math.round(p.added?.p90 ?? 0) },
    gap: { shortfall: gp.short, onCourse: gp.onCourse, middle: Math.round(gp.mid) },
    inputs: rows.map((x) => ({ input: x.label, value: x.value, source: FROM_WORD(x.from) })),
    mostSensitiveTo: sens.map((s) => ({ input: INPUT_WORDS[s.inputId]?.name ?? s.inputId, tenPercentMovesMiddleRunOfTwelveMonthRevenueBy: Number((s.elasticity * 10).toFixed(1)), statement: sensitivityWords(s.inputId, s.elasticity, p) })).filter((s) => s.statement),
    /* C32: a limit's ceiling is a twelve-month total of added revenue, and the field's name says so */
    vocabulary: { movesMost: sens[0] ? INPUT_WORDS[sens[0].inputId]?.name ?? sens[0].inputId : null, returnPerPound: !noSpend() && returnPerPound() !== null ? Number(returnPerPound().toFixed(2)) : null, firstLimit: lim ? { name: lim.name, from: lim.month, ceilingAddedOverTwelveMonths: lim.ceiling } : null, heldBack: Math.round(p.unspent ?? 0), paysBack: p.payback?.p50 !== undefined ? Number(p.payback.p50.toFixed(1)) : null, costOfWaiting: p.inaction?.p50 !== undefined ? Math.round(p.inaction.p50) : null },
    steps: steps().map((s) => ({ rank: s.rank, step: s.title, scoreOutOf100: s.score, addedToMiddleRunOver12Months: Math.round(s.magnitude), difficulty: s.difficulty, restraint: s.restraint })),
    /* the path's sentences are the card's own (pathWords), so the card, the markdown and the PDF agree; capacityCheck is the
       engine's sum (C34); noBudget keeps (d)'s ids for a machine and adds the name and the middle run no budget lifts (C38, C32) */
    path: lad ? { gap: lad.gap, onCourse: lad.onCourse, smallestBudgetThatReachesTarget: lad.bStar, noBudget: lad.noBudget ? { ...lad.noBudget, limit: binderWords(lad.noBudget), middleRunTopsOutAt: noBudgetCap(lad, m) } : null, monthMiddleRunReachesTarget: lad.monthP50, funnel: lad.funnel ? { ...lad.funnel, line: funnelWords(lad.funnel) } : null, capacityCheck: lad.capacityCheck ? roomCheck(p, state.goal) : null, appetite: lad.appetite, chosenLevel: level, chosenLevelLine: levelLine(false), words: pathWords(p, lad, m) } : null,
    /* C18: words and plain are the page's sentences; engine is the engine's own statement, labelled as such, for a machine */
    limit: lim ? { title: lim.name, words: limitWords(lim), plain: lim.plainLong, from: lim.month, ceilingAddedOverTwelveMonths: lim.ceiling, engine: String(bindingOf(p)?.statement ?? ''), liftedBy: lim.lever } : null,
    alignment: { score: Math.round(p.alignment?.composite ?? 0), bar: TMA_BAR, routing: p.routing, explanation: routeWords(p).long, engineReason: p.routingReason, components: Object.fromEntries(Object.entries(p.alignment?.components ?? {}).map(([k, v]) => [COMPONENTS[k]?.[0] ?? k, Math.round(v)])) },
    allocation: (p.allocation ?? []).map((mo) => ({ month: mo.month, byChannel: (mo.byChannel ?? []).map((c) => ({ route: M.CHANNEL_NAME?.[c.channel] ?? c.channel, spend: Math.round(c.spend) })) })),
    margin: p.margin, keptAtGoalMonth: Math.round(r.p50 * p.margin), payback: p.payback?.p50 !== undefined ? Number(p.payback.p50.toFixed(1)) : null,
    months: p.months.map((s, i) => ({ month: i + 1, name: monthName(i + 1), p10: Math.round(qAt(s, 0.1)), p25: Math.round(qAt(s, 0.25)), p50: Math.round(qAt(s, 0.5)), p75: Math.round(qAt(s, 0.75)), p90: Math.round(qAt(s, 0.9)) })),
    /* Refine 1, R19: the plan's added revenue in the three range words; a step has a modelled upside only */
    planRange: rangeNote(p) ? { scenarioRangeAddedOver12Months: { downside: Math.round(Math.max(0, p.added.p10 ?? 0)), favourable: Math.round(p.added.p90), basis: 'assumption sets, not a likelihood' }, note: rangeNote(p) } : null,
    /* R17, R18: from the visitor's own answers, never from the forecast; null when there are no answers */
    founder: founderView(), control: controlView(), actionsFromAnswers: answerActions(),
    method: methodOf()?.words ?? null,
    engine: { version: p.engineVersion, pack: p.packVersion, runs: runsOf(p), simulations: simCounts() },
    disclaimer: disclaimer(),
  };
}
/** every insight the page can say, for the library: per leaf, per branch, overall */
function insightLibrary() {
  const asked = new Set(state.asked ?? []);
  const leaves = [];
  answerSections().concat(['roots']).forEach((sec) => questionsOf(sec).forEach((id) => { if (!asked.has(id)) return; const ins = insightOf(id); if (ins) { let title = id; try { title = M.headline?.(id)?.title ?? id; } catch (e) { title = id; } leaves.push({ section: sectionBy(sec)?.name ?? sec, id, title, text: ins.text }); } }));
  const branches = ['roots', ...answerSections()].map((sec) => { let t = ''; try { t = clean(M.branchInsight?.(sec) ?? ''); } catch (e) { t = ''; } return t ? { section: sectionBy(sec)?.name ?? sec, text: t } : null; }).filter(Boolean);
  return { leaves, branches, overall: overall() };
}
/** the path section's sentences for both exports, from the report: the card's own (pathWords), so the three agree */
function pathLinesOf(r) {
  if (r.noGrowthSpend) return ['No growth spend: revenue is carried flat.'];
  if (!r.path) return ['The ladder had not landed when this file was saved.'];
  const w = r.path.words ?? {};
  /* the chosen level's line is left out when it would only say the lead again (no budget reaches the target) */
  const level = /no budget reaches/i.test(r.path.chosenLevelLine ?? '') && /^No budget reaches/.test(w.lead ?? '') ? '' : r.path.chosenLevelLine;
  return [w.lead, w.month, w.funnel, w.room, w.unplaced, level].filter(Boolean);
}
/** the five levels as the exports list them. A level the ladder could not reach is null and is left out (it threw before
    fix 3); the chosen level is marked (D4); a budget of nothing is said in words (U1); sources are in the page's words. */
const levelsOf = (r) => Object.entries(r.path?.appetite ?? {}).filter(([, a]) => a).map(([k, a]) => ({ word: `${cap(k)}${k === r.path.chosenLevel ? ' (chosen)' : ''}`, level: k, budget: a.budget === null || a.budget === undefined ? null : a.budget, budgetWords: a.budget === null || a.budget === undefined ? 'no budget' : a.budget >= 1 ? gbp(a.budget) : 'no growth spend', source: k === 'none' ? 'revenue carried flat' : clean(a.source ?? ''), p50: a.p50 ?? null, p90: a.p90 ?? null }));
/* the same rounding as the card's ▾ and the briefing (near), so one file never holds a step's figure at two precisions */
const stepExportLine = (s) => `Return rank ${s.rank}: ${s.step}, score ${s.scoreOutOf100} of 100, modelled upside +${gbp(near(s.addedToMiddleRunOver12Months))} on the middle run over twelve months, ${DIFFICULTY[s.difficulty] ?? s.difficulty}${s.restraint ? `; restraint: ${s.restraint}` : ''}.`;
/* ============ Rebuild 1, brief 13.5: the exports, from the plan object ============
   Download plan (a PDF through the existing jsPDF path), Copy / download implementation brief (markdown), Download progress
   file ((d)'s M.save.exportFile). Every action travels with every step; each file carries the generation date and the plan
   revision, the scenario assumptions and the sources, and never a key. The forecast's depth (the months, the path, the
   founder and control blocks, alignment, insights, weather, free alternatives, the briefing) follows the plan as an appendix
   on the owner route. */
const mdCell = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
function actionMd(a, i, pl) {
  const asset = assetFor(pl?.assets, a);
  return [
    `### ${a.fromAnswers ? `${ANSWER_ACTIONS}: ` : `${a.rank ?? i + 1}. `}${wordsOf(a.action)}`, '',
    `- Why first: ${wordsOf(a.whyFirst)}`,
    '- Do this:', ...listOf(a.steps).map((s, k) => `  ${k + 1}. ${s}`),
    `- Responsible: ${wordsOf(a.responsible) || 'you'}`,
    `- Needs: ${listOf(a.needs).join('; ') || 'nothing beyond what you have'}`,
    `- Effort: ${wordsOf(a.effort) || 'not estimated'}`,
    `- Cost: ${costWords(a.cost)}`,
    `- Done when: ${wordsOf(a.doneWhen)}`,
    `- Measure: ${wordsOf(a.measure)}`,
    ...(wordsOf(a.changeCourseIf) ? [`- Change course if: ${wordsOf(a.changeCourseIf)}`] : []),
    ...(asset ? [`- Start now: ${asset.title} (under Execution materials)`] : []),
    ...(a.affects?.limb ? [`- On the tree: ${affectWords(a)}`] : []),
  ];
}
const weekMd = (pl) => { const wk = pl?.weekOne ?? []; if (!wk.length) return ['## Week one', '', 'No week-one tasks are set for this plan.', '']; const rich = wk.some((w) => wordsOf(w.owner) || wordsOf(w.check)); return ['## Week one', '', ...(rich ? ['| Task | Owner | Effort | Cost | Output | Success check |', '|---|---|---|---|---|---|', ...wk.map((w) => `| ${mdCell(wordsOf(w.task))} | ${mdCell(wordsOf(w.owner))} | ${mdCell(wordsOf(w.effort))} | ${mdCell(wordsOf(w.cost))} | ${mdCell(wordsOf(w.output))} | ${mdCell(wordsOf(w.check))} |`)] : wk.map((w, i) => `${i + 1}. ${wordsOf(w.task)}`)), '']; };
const thirtyMd = (pl) => { const td = pl?.thirtyDays ?? []; if (!td.length) return ['## 30 days', '', 'No 30-day sequence is set for this plan.', '']; const rich = td.some((w) => wordsOf(w.when) || wordsOf(w.review)); return ['## 30 days', '', ...(rich ? ['| When | Work | Review |', '|---|---|---|', ...td.map((w) => `| ${mdCell(wordsOf(w.when))} | ${mdCell(wordsOf(w.work))} | ${mdCell(wordsOf(w.review))} |`)] : td.map((w) => `- ${wordsOf(w.work)}`)), '']; };
const ninetyMd = (pl) => { const nd = pl?.ninetyDays; return ['## 90 days, conditional', '', nd ? `${wordsOf(nd.condition) ? `${wordsOf(nd.condition)}: ` : ''}${wordsOf(nd.then)}${wordsOf(nd.otherwise) ? ` Otherwise: ${wordsOf(nd.otherwise)}` : ''}${nd.note ? ` ${nd.note}` : ''}` : 'No 90-day direction yet: it follows the 30-day evidence.', '']; };
const scenarioMd = (pl) => { const list = pl?.scenarios ?? []; if (!list.length) return [wordsOf(pl?.notUseful) || 'No scenario is quantified for this plan.']; return ['| Scenario | Figure | Basis |', '|---|---|---|', ...list.map((s) => `| ${mdCell(s.label)}${s.metric ? ` (${mdCell(s.metric)})` : ''} | ${mdCell(scenLine(s))} | ${mdCell(listOf(s.assumptions).join('; '))}${s.intervalKind ? `. ${mdCell(s.intervalKind)}` : ''} |`)]; };
const resourcesMd = (res) => { if (!res) return ['No resources are listed for this plan.']; const g = (label, items) => (Array.isArray(items) && items.length ? [`${label}:`, ...items.map((it) => `- ${strOf(it.item ?? it.name ?? it)}${it.status ? ` (${it.status})` : ''}${it.why ? `: ${it.why}` : ''}${Array.isArray(it.free) && it.free.length ? ` ${it.free.join(' · ')}` : ''}`), ''] : []); return [...g('Already owned', res.owned), ...g('Essential now', res.essentialNow ?? res.essential), ...g('Later only', res.later), ...g('Avoid for now', res.avoid), ...(res.verified ? [res.verified] : [])]; };
/** brief 13.4: the copyable brief for a builder or an assistant, as an execution brief for a business that is not a software build */
function implementationPromptMd(pl) {
  const first = pl?.firstAction ?? pl?.actions?.[0] ?? null;
  const engine = (pl?.actions ?? []).filter((a) => !a.fromAnswers);
  const res = pl?.resources ?? {};
  return [
    '## Implementation brief for a builder or an assistant', '',
    'Use this as the whole instruction. Every figure in it is the visitor’s answer or a model output named as such; nothing here is a secret, a credential or an assumed integration.', '',
    `- Business context and exact outcome: ${pl?.business ?? ''}${pl?.industry ? `, ${pl.industry}` : ''}. ${wordsOf(pl?.situation)} Outcome sought: ${wordsOf(pl?.goal?.text ?? pl?.goal)}${pl?.goal?.when ? ` by ${pl.goal.when}` : ''}.`,
    `- Intended customer and the job to support: ${wordsOf(pl?.customer) || 'the customers the visitor wants more of, as their best-client answers describe them'}.`,
    `- What already exists, tools to reuse: ${listOf((res.owned ?? []).map((it) => strOf(it.item ?? it))).join('; ') || 'nothing named'}.`,
    `- Smallest functional scope: ${first ? `${wordsOf(first.action)}: ${listOf(first.steps).join(' ')}` : 'not set'}. Deferred extras: ${(pl?.waits ?? []).map((w) => wordsOf(w.action)).join('; ') || 'none'}.`,
    `- Inputs, outputs, flow and rules: ${first ? `done when ${wordsOf(first.doneWhen)}; measured by ${wordsOf(first.measure)}` : 'see the actions'}.`,
    '- Integration details: none required by this plan. Any credential a tool needs is unknown here and must come from the owner; do not assume an API is available.',
    `- Content, design and accessibility needs: ${(pl?.assets ?? []).map((s) => s.title.toLowerCase()).join(', ') || 'none generated'}; plain language, readable on a phone, usable by keyboard.`,
    `- Cost, time and ownership: ${first ? `${wordsOf(first.effort)}; ${costWords(first.cost)} Owner: ${wordsOf(first.responsible)}.` : 'see the actions.'}`,
    `- Acceptance checks: ${engine.slice(0, 3).map((a) => `${wordsOf(a.action)}: ${wordsOf(a.doneWhen)}`).join('; ') || 'none'}.`,
    `- Questions to resolve from the real business before building: ${(pl?.unknowns ?? []).slice(0, 6).map((u) => wordsOf(u.title ?? u)).join('; ') || 'none listed'}.`, '',
  ];
}
/** the implementation brief: the plan object as markdown another person or assistant can use at once */
function planMarkdown(pl) {
  if (!pl) return '';
  const L = [];
  const first = pl.firstAction ?? pl.actions?.[0] ?? null;
  const engine = (pl.actions ?? []).filter((a) => !a.fromAnswers);
  const answers = (pl.actions ?? []).filter((a) => a.fromAnswers);
  L.push(`# ${pl.business ?? bizName()}: your plan`, '', `Generated ${pl.generatedOn ?? today()}; plan revision ${pl.revision ?? revisionNow()}; ${pl.route ?? 'owner'} route; ${STATUS_WORD[pl.status] ?? 'built from your answers'}${(pl.refined ?? []).length || (pl.actions ?? []).some((a) => (a.refined ?? []).length) ? ', refined with Claude where marked' : ''}. Made in your browser; nothing was sent. ${SECURITY_LINE}`, '');
  L.push('## Summary', '', `- Goal: ${wordsOf(pl.goal?.text ?? pl.goal)}${pl.goal?.when ? ` by ${pl.goal.when}` : ''}${listOf(pl.goal?.protected).length ? `. Protected: ${listOf(pl.goal.protected).join(', ')}` : ''}`, `- Situation: ${wordsOf(pl.situation)}`, `- Recommended move: ${wordsOf(first?.action)}`, `- Evidence: ${listOf(pl.finding?.evidence).join('; ') || 'see Evidence and method'}`, `- Key unknown: ${wordsOf(pl.keyUnknown ?? firstOf(pl.unknowns)?.title) || 'none named'}`, `- First action: ${wordsOf(first?.steps?.[0])}`, '', wordsOf(pl.finding?.text ?? pl.finding), '');
  if ((pl.advantages ?? []).length) L.push('What you already have:', '', ...pl.advantages.map((a) => `- ${wordsOf(a.title)}: ${wordsOf(a.line ?? a.text)}`), '');
  if (first) L.push('## First action', '', ...actionMd(first, 0, pl), '');
  L.push('## Prioritised plan', '', ...engine.slice(0, 3).map((a, i) => `${i + 1}. ${wordsOf(a.action)}${a.score !== undefined ? ` (score ${a.score} of 100, ${a.difficulty ?? ''})` : ''}`), '');
  if ((pl.waits ?? []).length) L.push('What should wait:', '', ...pl.waits.map((w) => `- ${wordsOf(w.action)}: ${wordsOf(w.why)}`), '');
  engine.slice(1).forEach((a, i) => L.push(...actionMd(a, i + 1, pl), ''));
  if (answers.length) { L.push(`### ${ANSWER_ACTIONS}`, ''); answers.forEach((a, i) => L.push(...actionMd(a, i, pl), '')); }
  L.push(...weekMd(pl), ...thirtyMd(pl), ...ninetyMd(pl));
  L.push('## Scenarios', '', `Mode: ${modeLabel(pl)}. ${MODE_MEANS[scenarioMode(pl)] ?? ''}`, '', ...scenarioMd(pl), '', SETS_LINE, NO_FORECAST_LINE, EXCLUDED_LINE, '', ...listOf(pl.economics).map((t) => `- ${t}`), ...(pl.notUseful && (pl.scenarios ?? []).length ? [pl.notUseful] : []), '');
  L.push('## Resources and purchases', '', ...resourcesMd(pl.resources), '');
  L.push('## Execution materials', '');
  (pl.assets ?? []).forEach((s) => L.push(`### ${s.title}`, '', '```', s.text ?? '', '```', ''));
  L.push(...implementationPromptMd(pl));
  L.push('## Evidence and method', '', ...(pl.evidence ?? []).map((e) => `- ${e.title}: ${e.value} (${e.source})`), '');
  if ((pl.unknowns ?? []).length) L.push('Not known yet:', '', ...pl.unknowns.map((u) => `- ${wordsOf(u.title ?? u)}${u.why ? `: ${u.why}` : ''}`), '');
  if ((pl.sources ?? []).length) L.push('Sources:', '', ...pl.sources.map((s) => `- ${wordsOf(s.title)}${s.date ? ` (as of ${s.date})` : ''}${s.url ? ` ${s.url}` : ''}`), '');
  if (pl.method) L.push(pl.method.words ?? '', '', ...(pl.method.rows ?? []).map(([k, v]) => `- ${k}: ${v}`), '', pl.method.note ?? '', '');
  else L.push('No simulation ran for this plan, so no run counts are claimed.', '');
  L.push('## Disclaimer', '', ...disclaimer().short.map((t) => `- ${t}`), '', ...disclaimer().full, '');
  if (hasDepth(pl)) L.push('---', '', '# Appendix: the forecast in full', '', depthMarkdown());
  return L.join('\n');
}
/** the forecast's depth (the sections the earlier For your AI file held), now the appendix of the implementation brief */
function depthMarkdown() {
  const r = report();
  if (!r) return '';
  const lib = insightLibrary();
  const w = weather();
  const mac = M.macro;
  const tools = freeTools();
  const L = [];
  L.push(`## Overall`, '', r.diagnosis, '');
  const rp = r.vocabulary.returnPerPound;
  const pays = r.vocabulary.paysBack;
  L.push('## Vocabulary', '', ...VOCAB.map(([t, m]) => `- ${t}: ${m}`), '',
    `- Moves most here: ${r.vocabulary.movesMost ?? 'not measured'}${r.mostSensitiveTo?.[0]?.statement ? `. ${r.mostSensitiveTo[0].statement}` : ''}`,
    `- Return per £ here: ${r.noGrowthSpend ? 'no growth spend' : rp !== null && rp >= 0.005 ? `£${rp.toFixed(2)} of added revenue for each £1 of growth spend` : 'not measured'}`,
    `- First limit here: ${r.limit ? r.limit.words : noLimitWords()}`,
    `- Held back here: ${r.vocabulary.heldBack >= 1 ? gbp(r.vocabulary.heldBack) : 'nothing'}`,
    `- Pays back here: ${pays !== null && oneDp(pays) !== '0' ? pluralDp(pays, 'month', 'months') : 'not measured'}`,
    `- Cost of waiting here: ${r.vocabulary.costOfWaiting !== null && r.vocabulary.costOfWaiting >= 1 ? gbp(r.vocabulary.costOfWaiting) : 'not measured'}`, '');
  L.push('## Your answers', '', '| Title | Value | Source |', '|---|---|---|');
  const asked = new Set(state.asked ?? []);
  let long = null;
  try { const rows = M.schemaAnswers?.(); if (Array.isArray(rows)) long = Object.fromEntries(rows.map((x) => [x.id, x])); } catch (e) { long = null; }
  ['roots', ...answerSections()].forEach((sec) => questionsOf(sec).forEach((id) => { if (!asked.has(id) || naHas(id)) return; const v = long?.[id]?.answer ?? valueWord(id); if (!v) return; let title = long?.[id]?.title ?? id; try { title = M.headline?.(id)?.title ?? title; } catch (e) { /* keep */ } L.push(`| ${title} | ${v} | ${FROM_WORD(sourceOf(id))} |`); }));
  r.inputs.forEach((x) => L.push(`| ${x.input} (engine) | ${x.value} | ${x.source} |`));
  L.push('');
  const added = r.addedOver12Months;
  L.push('## Scenarios', '', `Mode: ${modeLabel(planObj().plan)}. ${SETS_LINE} ${NO_FORECAST_LINE}`, '',
    `Range by ${r.goalMonth}: ${gbp(r.range.p25)} to ${gbp(r.range.p75)} a month ${SPREAD_WORD}; the wider range is ${gbp(r.range.p10)} to ${gbp(r.range.p90)}; the base assumptions reach ${gbp(r.range.p50)}.`,
    added.p50 >= 1 || added.p90 >= 1 ? `Added over twelve months: ${gbp(added.p10)} to ${gbp(added.p90)} ${SPREAD_WORD}, ${gbp(added.p50)} on the base assumptions.` : 'No run adds revenue over twelve months on these answers.',
    EXCLUDED_LINE,
    '', '| Month | Downside | Base | Favourable |', '|---|---|---|---|', ...r.months.map((mo) => `| ${mo.name} | ${gbp(mo.p10)} | ${gbp(mo.p50)} | ${gbp(mo.p90)} |`), '');
  L.push('## Path to target', '', ...pathLinesOf(r));
  const levels = levelsOf(r);
  if (levels.length) L.push('', '| Appetite | Budget | Source | Base | Favourable |', '|---|---|---|---|---|', ...levels.map((a) => `| ${a.word} | ${a.budgetWords} | ${a.source} | ${a.p50 !== null ? gbp(a.p50) : ''} | ${a.p90 !== null ? gbp(a.p90) : ''} |`), '', 'Maximum cannot lengthen the run past twelve months or add routes.');
  L.push('');
  L.push('## Steps and restraints', '', ...(r.steps.length ? r.steps.map((s) => `- ${stepExportLine(s)}`) : ['No step moves the middle run by 2% or more.']), ...(r.planRange ? ['', r.planRange.note] : []), '');
  const pl = profileLines();
  if (pl.founder.length) L.push('## Founder', '', SELF_LINE, '', ...pl.founder.map((t) => `- ${t}`), '');
  if (r.control) L.push('## Control', '', ...(r.control.map.length ? ['| Decision | Now | Intended |', '|---|---|---|', ...r.control.map.map((x) => `| ${x.decision} | ${x.now ? WHO_WORD[x.now] : 'not said'} | ${x.intended ? WHO_WORD[x.intended] : 'not said'}${x.moves ? ' (moves)' : ''} |`), ''] : []), ...pl.control.filter((t) => !DECISIONS.some(([, n]) => t.startsWith(`${n}: now`))).map((t) => `- ${t}`), '', r.control.professional, '');
  if (pl.actions.length) L.push(`## ${ANSWER_ACTIONS}`, '', ...pl.actions.map((t) => `- ${t}`), '');
  L.push('## First limit', '', r.limit ? `${cap(r.limit.words)}.${r.limit.plain ? ` ${r.limit.plain}` : ''}${r.limit.liftedBy ? ` The step that lifts it: ${r.limit.liftedBy}.` : ''}` : noLimitWords(), '');
  L.push(`## Mission Alignment: ${r.alignment.score} of 100`, '', alignmentLine(true), '', ...Object.entries(r.alignment.components).map(([k, v]) => `- ${k}: ${v}`), '');
  L.push('## Insights', '', ...lib.leaves.map((x) => `- ${x.section}, ${x.title}: ${x.text}`), ...lib.branches.map((x) => `- ${x.section}: ${x.text}`), `- Overall: ${lib.overall}`, '');
  if (mac && w.head.length) L.push('## Weather', '', ...[...w.head, ...w.sector].map((row) => `- ${mac.rowLine(row)}${mac.isProjection(row) ? ' (projection)' : ''} ${row.url}`), ...(w.rule ? [`- ${w.rule.text}${w.rule.asOf ? ` (as of ${w.rule.asOf})` : ''}`] : []), `- ${w.foot}`, '');
  if (tools) {
    const { ft } = tools;
    const mine = new Set(tools.used.map((u) => u.id));
    const all = [...tools.used, ...Object.keys(ft.ROWS ?? {}).filter((id) => !mine.has(id)).map((id) => ({ id, fee: 0, rows: ft.rowsFor?.(id) ?? [] }))].filter((u) => u.rows?.length);
    L.push('## Free alternatives', '', ...(tools.named ? [] : ['You named no software.', '']), ...all.flatMap((u) => u.rows.map((row, i) => `- ${ft.line(row, u.id)}${i === 0 && u.fee >= 1 ? ` You pay ${gbp(u.fee)} a month for this kind.` : ''} ${row.url}`)), ...(tools.total >= 1 ? [`- ${ft.totalLine(tools.total)}`] : []), '', 'To build a small tool yourself:', '', ...tools.steps.map((s, i) => `${i + 1}. ${s}`), ...(ft.buildLine ? ['', ft.buildLine] : []), '');
  }
  L.push('## Briefing for an assistant', '', briefing(), '');
  L.push(`Engine ${r.engine.version}, pack ${r.engine.pack}, ${runsWord()} runs.`, '');
  return L.join('\n');
}
const exportMarkdown = () => planMarkdown(planObj().plan);
function exportJson() {
  /* C33: what left the browser before this file, for whoever reads it; the plan object rides along for a machine */
  const { plan: pl, stale } = planObj();
  return { mercer: 12, kind: 'tma-export', exportedAt: new Date().toISOString(), planRevision: pl?.revision ?? revisionNow(), stale, left: { briefingToHostModel: hostSent }, answers: snapshot(), report: report(), insights: insightLibrary(), plan: pl ? { ...pl, report: undefined } : null };
}
/* ---------- the PDF: the plan from the plan object, then the forecast in full; vectors, a still of the tree; Helvetica stands
   in for the licensed faces. Printable structure: a heading never sits at the foot of a page, a card starts whole on a page
   when it can, every action carries every step. ---------- */
async function exportPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) return null;
  await new Promise((res) => requestAnimationFrame(() => res()));
  const pl = planObj().plan;
  if (!pl) return null;
  const r = hasDepth(pl) ? report() : null;
  const p = plan();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const T = (s) => String(s).replace(/→/g, 'to').replace(/−/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/÷/g, '/').replace(/×/g, 'x').replace(/▾/g, '').replace(/·/g, '-');
  const INK = [20, 32, 27], INK2 = [60, 72, 67], INK3 = [126, 137, 130], YOU = [76, 138, 94], EST = [111, 127, 163], CROWN = [135, 97, 37], LINE = [222, 227, 222], PAPER = [232, 237, 232];
  const text = (s, x, y, o = {}) => { doc.setFont(o.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size ?? 10); doc.setTextColor(...(o.color ?? INK)); doc.text(T(s), x, y, { align: o.align ?? 'left', maxWidth: o.maxWidth }); };
  const para = (s, x, y, o = {}) => { const size = o.size ?? 8.5, lh = o.lh ?? 1.35; doc.setFont(o.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...(o.color ?? INK)); const lines = doc.splitTextToSize(T(s), o.maxWidth ?? 182); doc.text(lines, x, y, { lineHeightFactor: lh }); return lines.length * size * 0.3528 * lh; };
  let y = 0;
  const business = pl.business ?? bizName();
  const band = () => { doc.setFillColor(...PAPER); doc.rect(0, 0, W, 26, 'F'); text('Mercer: your plan', 14, 15, { bold: true, size: 12 }); text(business, W - 14, 12, { bold: true, size: 12, align: 'right' }); text(`${pl.industry ? `${pl.industry}, ` : ''}${pl.generatedOn ?? today()}, plan revision ${pl.revision ?? revisionNow()}`, W - 14, 18, { size: 8, color: INK3, align: 'right' }); y = 38; };
  const room = (h) => { if (y + h > H - 20) { doc.addPage(); band(); } };
  const head = (s) => { room(20); text(s, 14, y, { bold: true, size: 11 }); y += 6.5; };
  const sub = (s) => { room(14); text(s, 14, y, { bold: true, size: 9 }); y += 5; };
  const line = (s, o = {}) => { room(8); y += para(s, o.x ?? 14, y, { size: 8.2, ...o }) + 1.4; };
  const tile = (x, w, label, big, words) => { doc.setFillColor(...PAPER); doc.setDrawColor(...LINE); doc.roundedRect(x, y, w, 30, 2, 2, 'FD'); text(label, x + 4, y + 6.5, { size: 7.5, color: INK3 }); const bh = para(big, x + 4, y + 12.5, { bold: true, size: 9.5, maxWidth: w - 8, lh: 1.15 }); para(words, x + 4, y + 13.5 + bh, { size: 6.8, color: INK2, maxWidth: w - 8, lh: 1.25 }); };
  const card = (a, i, label) => {
    room(60);
    text(label ?? (a.fromAnswers ? ANSWER_ACTIONS : `Rank ${a.rank ?? i + 1}`), 14, y, { size: 7.5, color: INK3 }); y += 4.5;
    y += para(wordsOf(a.action), 14, y, { bold: true, size: 10.5 }) + 2;
    const field = (k, v) => { if (!v) return; room(10); text(k, 14, y, { size: 7.5, color: INK3, bold: true }); const hh = para(v, 44, y, { size: 8.2, maxWidth: 152 }); y += Math.max(hh, 3.2) + 1.6; };
    field('Why first', wordsOf(a.whyFirst));
    const st = listOf(a.steps);
    if (st.length) { room(10); text('Do this', 14, y, { size: 7.5, color: INK3, bold: true }); st.forEach((s, k) => { room(8); y += para(`${k + 1}. ${s}`, 44, y, { size: 8.2, maxWidth: 152 }) + 1; }); y += 0.6; }
    field('Responsible', wordsOf(a.responsible)); field('Needs', listOf(a.needs).join('; ')); field('Effort', wordsOf(a.effort)); field('Cost', costWords(a.cost)); field('Done when', wordsOf(a.doneWhen)); field('Measure', wordsOf(a.measure)); field('Change course if', wordsOf(a.changeCourseIf));
    const asset = assetFor(pl.assets, a);
    if (asset) field('Start now', `${asset.title} (under Execution materials)`);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(14, y + 1, 196, y + 1); y += 5;
  };
  band();
  const first = pl.firstAction ?? pl.actions?.[0] ?? null;
  y += para(wordsOf(pl.finding?.text ?? pl.finding), 14, y, { size: 11, lh: 1.4 }) + 2;
  if (pl.situation) y += para(wordsOf(pl.situation), 14, y, { size: 9, color: INK2 }) + 4;
  const tw = (W - 28 - 9) / 4;
  tile(14, tw, 'Goal', `${wordsOf(pl.goal?.text ?? pl.goal)}`, `${pl.goal?.when ? `by ${pl.goal.when}` : ''}${listOf(pl.goal?.protected).length ? `; protected: ${listOf(pl.goal.protected).join(', ')}` : ''}`);
  tile(14 + tw + 3, tw, 'Recommended move', wordsOf(first?.action) || 'None ranked', first ? wordsOf(first.doneWhen) : '');
  tile(14 + 2 * (tw + 3), tw, pl.route === 'starter' ? 'What needs proving' : 'What matters most', wordsOf(pl.finding?.short ?? pl.finding?.title) || 'The forecast', listOf(pl.finding?.evidence)[0] ?? '');
  tile(14 + 3 * (tw + 3), tw, 'Key unknown', wordsOf(pl.keyUnknown ?? firstOf(pl.unknowns)?.title) || 'None named', 'your figure would replace it');
  y += 30 + 8;
  if ((pl.advantages ?? []).length) { sub('What you already have'); pl.advantages.forEach((a) => line(`${wordsOf(a.title)}: ${wordsOf(a.line ?? a.text)}`)); y += 2; }
  if (first) { head('First action'); card(first, 0, pl.route === 'starter' ? 'Your first test' : 'First action'); }
  const engine = (pl.actions ?? []).filter((a) => !a.fromAnswers);
  const answersActs = (pl.actions ?? []).filter((a) => a.fromAnswers);
  head('Prioritised plan');
  engine.slice(0, 3).forEach((a, i) => line(`${i + 1}. ${wordsOf(a.action)}${a.score !== undefined ? ` (score ${a.score} of 100, ${a.difficulty ?? ''})` : ''}`, { size: 8.6 }));
  if ((pl.waits ?? []).length) { sub('What should wait'); pl.waits.forEach((w) => line(`${wordsOf(w.action)}: ${wordsOf(w.why)}`)); }
  engine.slice(1).forEach((a, i) => card(a, i + 1));
  if (answersActs.length) { sub(ANSWER_ACTIONS); answersActs.forEach((a, i) => card(a, i)); }
  head('Week one');
  if ((pl.weekOne ?? []).length) pl.weekOne.forEach((w, i) => line(`${i + 1}. ${wordsOf(w.task)}${[['Owner', w.owner], ['Effort', w.effort], ['Cost', w.cost], ['Output', w.output], ['Check', w.check]].filter(([, v]) => wordsOf(v)).map(([k, v]) => ` ${k}: ${wordsOf(v)}.`).join('')}`)); else line('No week-one tasks are set for this plan.');
  head('30 days');
  if ((pl.thirtyDays ?? []).length) pl.thirtyDays.forEach((w) => line(`${wordsOf(w.when) ? `${wordsOf(w.when)}: ` : ''}${wordsOf(w.work)}${wordsOf(w.review) ? ` Review: ${wordsOf(w.review)}.` : ''}`)); else line('No 30-day sequence is set for this plan.');
  head('90 days, conditional');
  line(pl.ninetyDays ? `${wordsOf(pl.ninetyDays.condition) ? `${wordsOf(pl.ninetyDays.condition)}: ` : ''}${wordsOf(pl.ninetyDays.then)}${wordsOf(pl.ninetyDays.otherwise) ? ` Otherwise: ${wordsOf(pl.ninetyDays.otherwise)}` : ''}${pl.ninetyDays.note ? ` ${pl.ninetyDays.note}` : ''}` : 'No 90-day direction yet: it follows the 30-day evidence.');
  doc.addPage(); band();
  head('Scenarios');
  scenarioMd(pl).filter((t) => !/^\|---/.test(t)).forEach((t) => line(t.replace(/^\| /, '').replace(/ \|$/, '').replace(/ \| /g, ': ')));
  listOf(pl.economics).forEach((t) => line(t));
  if (!(pl.scenarios ?? []).length && pl.notUseful) line(pl.notUseful, { color: INK2 });
  if (r && p) {
    y += 2;
    const fx = 14, fy = y + 4, fw = 118, fh = 70;
    room(fh + 16);
    text('Revenue each month', fx, fy - 2, { bold: true, size: 10 });
    const bands = p.months.map((s) => P.map((pp) => qAt(s, pp)));
    const lo = Math.min(p.base, ...bands.flat()) * 0.96;
    const top = Math.max(r.goal ? r.goal * 1.08 : 0, ...bands.flat());
    const step = [5e3, 1e4, 2e4, 25e3, 5e4, 1e5, 2e5, 25e4, 5e5, 1e6, 2e6, 5e6].find((s) => (top - lo) / s <= 5) ?? 1e7;
    const hi = Math.ceil(top / step) * step;
    const sq = (v) => Math.sqrt(Math.max(0, v - lo));
    const X = (mm) => fx + 14 + (mm / 12) * (fw - 16), Y = (v) => fy + fh - 8 - (sq(v) / sq(hi)) * (fh - 14);
    const at = (mm, i) => (mm === 0 ? p.base : bands[mm - 1][i]);
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1; v += step) { doc.setDrawColor(...LINE); doc.setLineWidth(0.15); doc.line(X(0), Y(v), X(12), Y(v)); text(shortGbp(v), fx + 12, Y(v) + 1, { size: 6.5, color: INK3, align: 'right' }); }
    const poly = (iLo, iHi, rgb) => { const pts = []; for (let mm = 0; mm <= 12; mm++) pts.push([X(mm), Y(at(mm, iLo))]); for (let mm = 12; mm >= 0; mm--) pts.push([X(mm), Y(at(mm, iHi))]); const rel = pts.slice(1).map((pt, i) => [pt[0] - pts[i][0], pt[1] - pts[i][1]]); doc.setFillColor(...rgb); doc.lines(rel, pts[0][0], pts[0][1], [1, 1], 'F', true); };
    poly(0, 6, [225, 229, 236]); poly(1, 5, [203, 210, 224]); poly(2, 4, [176, 186, 208]);
    doc.setDrawColor(...INK); doc.setLineWidth(0.5);
    for (let mm = 0; mm < 12; mm++) doc.line(X(mm), Y(at(mm, 3)), X(mm + 1), Y(at(mm + 1, 3)));
    if (r.goal) { doc.setDrawColor(...CROWN); doc.setLineWidth(0.35); doc.setLineDashPattern([1.2, 1], 0); doc.line(X(0), Y(r.goal), X(12), Y(r.goal)); doc.setLineDashPattern([], 0); text(`Target ${shortGbp(r.goal)}`, X(12), Y(r.goal) - 1.5, { size: 6.5, color: CROWN, align: 'right' }); }
    [0, 3, 6, 9, 12].forEach((mm) => text(mm === 0 ? 'Today' : monthShort(mm), X(mm), fy + fh - 2, { size: 6.5, color: INK3, align: 'center' }));
    text(`Line: the base assumptions. Bands, darkest first: the inner, middle and outer scenario ranges over ${runsWord()} runs of the model. A modelled range, not a statistical confidence interval, and not a likelihood.`, fx, fy + fh + 4, { size: 6.8, color: INK3, maxWidth: 120 });
    let img = null;
    try { img = M.has3d ? tree()?.snapshot?.() : null; } catch (e) { img = null; }
    doc.setFillColor(...PAPER); doc.roundedRect(138, fy - 4, 58, 80, 2, 2, 'F');
    if (img) { try { const cv = tree()?.canvas; const ar = cv && cv.width ? cv.height / cv.width : 1.2; let iw = 54, ih = iw * ar; if (ih > 66) { ih = 66; iw = ih / ar; } doc.addImage(img, 'PNG', 138 + (58 - iw) / 2, fy - 2 + (66 - ih) / 2, iw, ih); } catch (e) { /* the frame alone */ } }
    text(r.tree, 142, fy + 72, { size: 7.5, color: INK3, maxWidth: 52 });
    y = fy + fh + 16;
  }
  head('Resources and purchases');
  resourcesMd(pl.resources).filter(Boolean).forEach((t) => line(t.replace(/^- /, '')));
  head('Execution materials');
  (pl.assets ?? []).forEach((s) => { room(30); sub(s.title); String(s.text ?? '').split('\n').forEach((t) => { room(6); y += para(t || ' ', 14, y, { size: 7.6, mono: true, lh: 1.25 }) + 0.4; }); y += 3; });
  sub('Implementation brief for a builder or an assistant');
  implementationPromptMd(pl).slice(2).filter(Boolean).forEach((t) => line(t.replace(/^- /, '')));
  head('Evidence and method');
  (pl.evidence ?? []).forEach((e) => { room(6); text(e.title, 14, y, { size: 8.2, bold: true }); const hh = para(e.value, 70, y, { size: 8.2, maxWidth: 76, lh: 1.2 }); text(e.source ?? '', 150, y, { size: 8.2, color: e.kind === 'you' ? YOU : e.kind === 'sector' ? [184, 121, 31] : EST }); y += Math.max(5.4, hh + 2); });
  if ((pl.unknowns ?? []).length) { y += 2; sub('Not known yet'); pl.unknowns.slice(0, 12).forEach((u) => line(`${wordsOf(u.title ?? u)}${u.why ? `: ${u.why}` : ''}`)); }
  if ((pl.sources ?? []).length) { y += 2; sub('Sources'); pl.sources.forEach((s) => { line(`${wordsOf(s.title)}${s.date ? ` (as of ${s.date})` : ''}`); if (s.url) { room(6); y += para(s.url, 14, y, { size: 6.5, color: INK3 }) + 1; } }); }
  if (pl.method) { y += 2; sub('Method'); line(pl.method.words ?? ''); (pl.method.rows ?? []).forEach(([k, v]) => line(`${k}: ${v}`, { bold: true })); line(pl.method.note ?? '', { size: 7, color: INK3 }); } else line('No simulation ran for this plan, so no run counts are claimed.');
  if (r && p) {
    doc.addPage(); band();
    head('Appendix: the forecast in full');
    y += para(r.diagnosis, 14, y, { size: 9.5, lh: 1.4 }) + 4;
    head('Path to target');
    const pathLines = [...pathLinesOf(r)];
    levelsOf(r).forEach((a) => pathLines.push(`${a.word}: ${a.budget === null ? 'no budget' : a.budget >= 1 ? `${gbp(a.budget)} a month` : 'no growth spend'}${a.source ? `, ${a.source}` : ''}${a.p50 !== null ? `; middle run ${gbp(a.p50)}` : ''}${a.level === 'maximum' && a.p90 !== null ? `, favourable ${gbp(a.p90)}` : ''}.`));
    if (r.path) pathLines.push('Maximum cannot lengthen the run past twelve months or add routes.');
    pathLines.forEach((l) => line(l));
    y += 3; head('The words');
    VOCAB.forEach(([t, mm]) => line(`${t}: ${mm}`));
    y += 3; head('Steps and restraints');
    (r.steps.length ? r.steps.map(stepExportLine) : ['No step moves the middle run by 2% or more.']).forEach((l) => line(l));
    if (r.planRange) line(r.planRange.note, { size: 7.8, color: INK2 });
    { const pf = profileLines();
      if (pf.founder.length) { y += 3; head('Founder'); line(SELF_LINE, { size: 7, color: INK3 }); pf.founder.forEach((l) => line(l)); }
      if (pf.control.length) { y += 3; head('Control'); pf.control.forEach((l) => line(l)); line(PRO_LINE, { size: 7.8, color: INK2 }); }
      if (pf.actions.length) { y += 3; head(ANSWER_ACTIONS); pf.actions.forEach((l) => line(l)); } }
    y += 3; head('Mission Alignment');
    text(`${r.alignment.score} of 100`, 196, y - 6.5, { size: 9, color: r.alignment.score >= TMA_BAR ? YOU : CROWN, align: 'right' });
    y += para(alignmentLine(true), 14, y) + 3;
    Object.entries(p.alignment?.components ?? {}).forEach(([k, v]) => { room(12); text(COMPONENTS[k]?.[0] ?? k, 14, y + 2.4, { bold: true, size: 8.5 }); doc.setFillColor(...LINE); doc.roundedRect(70, y, 110, 3, 1.5, 1.5, 'F'); doc.setFillColor(...CROWN); doc.roundedRect(70, y, Math.max(1.5, 1.1 * Math.round(v)), 3, 1.5, 1.5, 'F'); text(String(Math.round(v)), 196, y + 2.6, { size: 8.5, align: 'right' }); y += 6; y += para(componentWords(k, v, p), 70, y, { size: 7, color: INK2, maxWidth: 126, lh: 1.3 }) + 2; });
    y += 4; head('The weather');
    const w = weather();
    if (M.macro && w.head.length) { [...w.head, ...w.sector].forEach((row) => { line(`${M.macro.rowLine(row)}${M.macro.isProjection(row) ? ' (projection)' : ''}`, { size: 7.8 }); room(6); y += para(row.url, 14, y, { size: 6.5, color: INK3 }) + 1.2; }); if (w.rule) line(w.rule.text); line(w.foot, { size: 7, color: INK3 }); } else line('No benchmark rows apply.');
    y += 4; head('Month by month');
    const cols = [14, 66, 102, 138, 196];
    ['Month', 'Downside', 'Base', 'Favourable', r.goal ? 'Gap to target' : 'Above today'].forEach((hh, i) => text(hh, cols[i], y, { size: 7.5, color: INK3, align: i === 4 ? 'right' : 'left' }));
    y += 5;
    p.months.forEach((s, i) => { room(6); let last = ''; try { const gp = M.gapOf(s, r.goal); last = r.goal ? (gp.onCourse ? 'on course' : gbp(gp.short)) : gbp(Math.max(0, r.months[i].p50 - r.revenueNow)); } catch (e) { last = ''; } [r.months[i].name, gbp(r.months[i].p10), gbp(r.months[i].p50), gbp(r.months[i].p90), last].forEach((v, j) => text(v, cols[j], y, { size: 8, align: j === 4 ? 'right' : 'left', bold: j === 2 })); doc.setDrawColor(...LINE); doc.setLineWidth(0.1); doc.line(14, y + 1.6, 196, y + 1.6); y += 5.6; });
    y += 4; head('What went in');
    ['Input', 'Figure', 'Where it came from'].forEach((hh, i) => text(hh, [14, 70, 150][i], y, { size: 7.5, color: INK3 })); y += 5;
    r.inputs.forEach((x) => { room(7); text(x.input, 14, y, { size: 8.5, bold: true }); const hh = para(x.value, 70, y, { size: 8.5, maxWidth: 76, lh: 1.2 }); text(x.source, 150, y, { size: 8.5, color: x.source === 'your answer' ? YOU : x.source.startsWith('your website') ? [42, 140, 156] : x.source.startsWith('typical') ? [184, 121, 31] : EST }); const rh = Math.max(5.8, hh + 2.2); doc.setDrawColor(...LINE); doc.setLineWidth(0.1); doc.line(14, y + rh - 4.2, 196, y + rh - 4.2); y += rh; });
    y += 4; head('Insights');
    const lib = insightLibrary();
    [...lib.leaves.map((x) => `${x.section}, ${x.title}: ${x.text}`), ...lib.branches.map((x) => `${x.section}: ${x.text}`), `Overall: ${lib.overall}`].forEach((l) => line(l, { size: 7.8 }));
    const tools = freeTools();
    if (tools) { y += 4; head('Free alternatives'); if (!tools.named) line('You named no software.', { size: 7.8 }); tools.shown.forEach((u) => u.rows.forEach((row) => { line(tools.ft.line(row, u.id), { size: 7.8 }); room(6); y += para(row.url, 14, y, { size: 6.5, color: INK3 }) + 1.2; })); if (tools.total >= 1) line(tools.ft.totalLine(tools.total), { size: 7.8, bold: true }); line('To build a small tool yourself:', { size: 7.8, bold: true }); tools.steps.forEach((s, i) => line(`${i + 1}. ${s}`, { size: 7.8 })); if (tools.ft.buildLine) line(tools.ft.buildLine, { size: 7.8 }); }
    const a = archetype();
    if (a) { y += 4; head(`${a.name}, for ${business}`); [a.lines[0], a.lines[1], `Two founders who grew the way ${article(a.name.replace(/^The /, ''))} ${a.name.replace(/^The /, '')} grows:`, ...a.examples.map((ex) => `${ex.who}, ${ex.company}: ${ex.did} (${ex.sources.join(', ')})`)].forEach((l) => line(l, { size: 7.8 }));
    }
  }
  { const d = disclaimer(); y += 4; head('Disclaimer'); d.short.forEach((t) => line(t)); d.full.forEach((t) => line(t, { size: 7.2, color: INK2 })); }
  const pages = doc.getNumberOfPages();
  const engineLine = r ? ` · Engine ${r.engine.version} · ${runsWord()} runs, every figure from one run · prior pack ${r.engine.pack}` : '';
  for (let i = 1; i <= pages; i++) { doc.setPage(i); para(`Page ${i} of ${pages} · Mercer 12 · generated ${pl.generatedOn ?? today()} · plan revision ${pl.revision ?? revisionNow()}${engineLine} · Helvetica stands in for the licensed faces · ${SECURITY_LINE} · ${DISCLAIMER_FOOT} · Book a call: ${BOOKING_URL}`, 14, H - 11, { size: 6, color: INK3, maxWidth: 182, lh: 1.25 }); }
  const name = `mercer-plan-${slug()}.pdf`;
  const ok = await save(name, doc.output('blob'));
  return ok ? name : null;
}
/* ============ Final pack, Tasks 19 to 23, 31 and 34: the results scene ============
   Task 19: one composition instead of a dense side panel. Centred on the tree, it carries a short personalised headline, the
   labelled target, one finding, one action, up to two compact branch labels and a toolbar that is there from the first
   generated view and stays through the recap. The card is the inspector now (Task 21): one panel open at a time, a visible
   Whole tree reset, and the state a branch was left in comes back when it is opened again.
   D1 and Task 34: M.econ owns every figure. It is read with ?. and the plan object stands in when it is absent.
   D2 and Task 31: the numerical view is Scenarios, never Forecast, and every projection wears its mode label. */

/* ---------- the economics module, read defensively ---------- */
const econOf = () => (M.econ && typeof M.econ === 'object' ? M.econ : null);
let econCache = { key: null, value: null, mod: null };
/** M.econ.scenario(state, plan) when the module is loaded and returns a scenario; null otherwise, and the caller falls back */
function econScenario(pl) {
  const e = econOf();
  if (!e || typeof e.scenario !== 'function') return null;
  const key = `${safeKey()}|${pl?.revision ?? ''}|${pl?.id ?? ''}`;
  /* the module itself is part of the key: a module that lands, changes or is taken away mid-session must not be answered
     from the last one's cache */
  if (econCache.key === key && econCache.mod === e) return econCache.value;
  let sc = null;
  try { sc = e.scenario(state, pl) ?? null; } catch (err) { sc = null; }
  if (!sc || typeof sc !== 'object') return null; // nothing to cache: a module that lands or changes later is read at once
  econCache = { key, value: sc, mod: e };
  return sc;
}
const econTotals = (pl) => econScenario(pl)?.totals ?? null;
const econBinding = (pl) => listOf((econScenario(pl)?.binding ?? []).map((b) => (typeof b === 'string' ? b : b?.resource ?? b?.statement ?? '')));

/* ---------- Task 31 and D2: the output mode, per scenario ---------- */
const MODE_WORD = { requirements: 'Goal requirements', illustrative: 'Illustrative scenario', operating_scenario: 'Grounded operating scenario' };
const MODE_MEANS = {
  requirements: 'Inverse arithmetic from the target: what it would take, not what is expected.',
  illustrative: 'If these assumptions hold, this is what the economics could look like. No likelihood is claimed.',
  operating_scenario: 'A reconciled baseline with stated assumptions about what you do next. Observed inputs do not make an intervention proven.',
};
/* D2: validated_forecast is unreachable in this build. There is no historical series for this business to backtest against, so
   nothing here upgrades to it; a scenario that claims it is shown as illustrative and the reason is said under the figures. */
const NO_FORECAST_LINE = 'Nothing here is a validated forecast: Mercer holds no history for this business to test a forecast against.';
function scenarioMode(pl) {
  const raw = econScenario(pl)?.mode ?? pl?.mode ?? null;
  /* D2: a scenario that claims a validated forecast is shown as illustrative and the reason is said under the figures.
     Nothing in this build can reach that mode, because there is no historical series to backtest against. */
  if (raw === 'validated_forecast') return 'illustrative';
  if (raw && MODE_WORD[raw]) return raw;
  const scen = (pl?.scenarios ?? []).filter((s) => Number.isFinite(Number(s.value ?? s.scenario)) && Number(s.value ?? s.scenario) !== 0);
  if (!scen.length) return pl?.goal?.target || pl?.goal?.amount || (pl?.route !== 'starter' && basis() === 'revenue' && state.goal) ? 'requirements' : 'illustrative';
  const observed = (pl?.evidence ?? []).some((x) => x.kind === 'you' && x.value);
  return observed && pl?.route !== 'starter' ? 'operating_scenario' : 'illustrative';
}
const modeLabel = (pl) => MODE_WORD[scenarioMode(pl)] ?? MODE_WORD.illustrative;
/** Task 34: the small mode label that stands beside a numerical projection, wherever one is shown */
const modeChip = (pl) => `<span class="mode-chip" data-mode="${esc(scenarioMode(pl))}">${esc(modeLabel(pl))}</span>`;
/** Task 34: the measures a revenue model does not carry, named rather than left to be assumed */
const EXCLUDED_LINE = 'This model covers revenue and the operating result it states. It carries no take-home income, no tax and no personal drawings, so no figure here is what you would take home.';

/* ---------- Task 34: What needs to be true ---------- */
/** the handful of assumptions driving the result: econ's own when it has them, else the scenario's and the estimated inputs */
function assumptionsOf(pl) {
  const sc = econScenario(pl);
  const out = [];
  const add = (text, source) => { const t = wordsOf(text); if (t && out.length < 6 && !out.some((x) => x.text === t)) out.push({ text: t, source: wordsOf(source) }); };
  listOf(sc?.assumptions ?? sc?.assumptionIds).forEach((t) => add(t, 'econ'));
  if (!out.length) (pl?.scenarios ?? []).forEach((s) => listOf(s.assumptions).forEach((t) => add(t, wordsOf(s.label))));
  (pl?.evidence ?? []).filter((x) => x.kind === 'assumed' && wordsOf(x.value)).slice(0, 3).forEach((x) => add(`${x.title}: ${x.value}`, x.source));
  if (pl?.keyUnknown) add(`Not known yet: ${wordsOf(pl.keyUnknown)}`, '');
  return out;
}
const truthHtml = (pl) => {
  const rows = assumptionsOf(pl);
  const binding = econBinding(pl);
  return `<p class="small">${esc(MODE_MEANS[scenarioMode(pl)] ?? MODE_MEANS.illustrative)}</p>${rows.length ? `<ul class="res-truth-list">${rows.map((r) => `<li>${esc(r.text)}${r.source ? ` <span class="small">${esc(r.source)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="small">No assumption is quantified yet, so no figure is shown.</p>'}${binding.length ? `<p class="small">What binds first: ${esc(binding.slice(0, 2).join('; '))}.</p>` : ''}<p class="small">${esc(NO_FORECAST_LINE)}</p><p class="small">${esc(EXCLUDED_LINE)}</p>`;
};

/* ---------- Task 22: finding, action, expected change, evidence ---------- */
/* the short labels. A finding is a label, never a paragraph and never a completion count (Task 19). */
const SHORT_FINDING = [
  [/enquir|prospect|lead|list|outreach|find more|demand|reach/i, 'More enquiries needed'],
  [/capacity|deliver|fulfil|backlog|full|add one person|per person/i, 'Delivery is the limit'],
  [/clos(e|ing)|convert|conversion|quote|follow up|reply/i, 'Too few enquiries close'],
  [/price|pricing|rate card/i, 'The price is doing the work'],
  [/margin|cost of sale/i, 'The margin is the limit'],
  [/retention|repeat|churn/i, 'Repeat custom is the gap'],
  [/cash|funding|runway/i, 'Cash is the limit'],
  [/budget|growth spend|marketing/i, 'The growth spend is the limit'],
  [/offer|niche|direction|buyer|who it is for/i, 'Define the first offer'],
];
/* the short action labels, in the same spirit: what to do, not a paragraph about doing it */
/* Each pattern names the move itself, not a word that could appear in any sentence about it: a loose match ("deliver")
   turned "Give what it costs you to deliver one" into "Free up delivery time", which is a different instruction. Nothing
   matches unless the phrase is the move, and an unmatched action keeps its own whole words. */
const SHORT_ACTION = [
  [/conversations with|five conversations|interview (?:five|your)|talk to (?:five|your|recent)/i, 'Talk to five recent customers'],
  [/referral partner|ask (?:your )?partners|for an introduction/i, 'Ask your referral partners'],
  [/more enquir|more prospect|build a list|outreach message|find more prospects/i, 'Get more enquiries moving'],
  [/raise your price|set the new price|new figure for a sale/i, 'Set the new price'],
  [/define the (?:first )?offer|who the offer is for|choose (?:a|the) niche/i, 'Define the first offer'],
  [/close more enquir|reply within|follow up on day|answer(?:ing)? enquir/i, 'Answer enquiries faster'],
  [/add one person|deliver more per person|free up|cut or automate/i, 'Free up delivery time'],
  [/raise the growth budget|growth spend on|one route first/i, 'Put the spend on one route'],
];
/* Task 19: "4 of 12 answered" is a progress count, not a diagnosis, and neither is "too little is known". A finding that
   reads as one is replaced by what matters, and the next check is given with it. */
const COUNT_DIAGNOSIS = /\b\d+\s+of\s+(?:\d+|the)\b|answered on demand|questions answered|answers so far|too little is known|preliminary plan|not enough (?:is )?known|gather evidence rather than assume/i;
const NOT_CONFIRMED_BY = [
  [/capacity|deliver|backlog|hours/i, 'Delivery capacity is not confirmed yet'],
  [/price|margin|cost/i, 'What the work is worth is not confirmed yet'],
  [/clos(e|ing)|convert|quote/i, 'How many enquiries close is not confirmed yet'],
];
const NOT_CONFIRMED = 'Customer demand is not confirmed yet';
/** a label of at most n words: the first clause, never a fragment. Over n words it takes the table's own short form, and
    with no match it keeps the whole clause rather than cutting a phrase in half. */
function shortLabel(raw, n = 6, table = null) {
  const whole = wordsOf(raw);
  const t = whole.split(/[.;:]|,\s+(?:so|then|and|which|because)\b/)[0].trim().replace(/[.,;:]+$/, '');
  if (!t) return '';
  if (t.split(/\s+/).length <= n) return cap(t);
  const mapped = table ? (table.find(([re]) => re.test(whole)) ?? [])[1] : null;
  return mapped || cap(t);
}
/* Task 21, the glance level: a branch label is read at a glance beside the tree, so it keeps the head of the phrase and
   drops the tail it hangs on ("Open one conversation with a business that already serves your customers" reads as "Open
   one conversation"). The head must still be a phrase of its own: under three words the whole clause stands. */
const TAIL_AT = /\s+(?:with|that|which|from|about|for|using|so|to)\s+/i;
function glanceLabel(raw) {
  const t = shortLabel(raw, 6, SHORT_ACTION);
  if (!t || t.split(/\s+/).length <= 6) return t;
  const head = t.split(TAIL_AT)[0].trim();
  return head.split(/\s+/).length >= 3 ? cap(head) : t;
}
/** revenue today, from econ first, then the plan's own baseline scenario, then the engine run */
function baselineOf(pl) {
  const n = Number(econScenario(pl)?.baselineVsPlan?.revenue ?? scenarioOf(pl)?.baseline ?? NaN);
  if (Number.isFinite(n) && n > 0) return n;
  /* the engine's own base belongs to a trading business. A starter has no observed sales, so it has no baseline (Task 20). */
  if (pl?.route === 'starter') return null;
  try { const p = plan(); if (p && Number.isFinite(p.base) && p.base > 0) return p.base; } catch (e) { /* none */ }
  return null;
}
/** the goal's own figure, ignoring a placeholder a plan carries when it has no target */
function goalFigure(pl) {
  const g = pl?.goal ?? {};
  const t = Number(g.target ?? g.amount ?? (pl?.route !== 'starter' && basis() === 'revenue' ? state.goal : NaN));
  if (Number.isFinite(t) && t > 0) return `${gbp(t)} a month`;
  const fig = wordsOf(g.figure ?? g.text ?? '').replace(/\.$/, '');
  return fig && !/^your goal$/i.test(fig) ? fig : '';
}
/** the next check to run when a thing is not confirmed: the first step of the first action, else the key unknown */
function nextCheck(pl) {
  const first = pl?.firstAction ?? (pl?.actions ?? [])[0] ?? null;
  const step = wordsOf(first?.steps?.[0] ?? '');
  if (step) return step;
  const unk = wordsOf(pl?.keyUnknown ?? firstOf(pl?.unknowns)?.title ?? '');
  return unk ? `Find out: ${lc(unk)}` : '';
}
/** Task 22: finding, action, expected change, evidence. The first two are the visible pair; the rest opens on activation. */
function resultFinding(pl) {
  if (!pl) return null;
  const sc = econScenario(pl);
  const f = pl.finding ?? {};
  const first = pl.firstAction ?? (pl.actions ?? []).find((a) => !a.fromAnswers) ?? (pl.actions ?? [])[0] ?? null;
  const said = wordsOf(sc?.finding ?? f.short ?? f.headline ?? f.title ?? '');
  const text = wordsOf(f.text ?? '');
  const hay = `${said} ${text} ${wordsOf(first?.action ?? '')}`;
  const thin = COUNT_DIAGNOSIS.test(said) || COUNT_DIAGNOSIS.test(text);
  let label = said && !thin ? shortLabel(said, 6, SHORT_FINDING) : '';
  if (!label && !thin) label = (SHORT_FINDING.find(([re]) => re.test(hay)) ?? [])[1] ?? '';
  /* Task 19: when the answers do not support a diagnosis, say what is not confirmed, not how many questions are answered */
  if (!label) { const unk = `${wordsOf(pl.keyUnknown ?? '')} ${wordsOf(firstOf(pl.unknowns)?.title ?? '')}`; label = (NOT_CONFIRMED_BY.find(([re]) => re.test(unk)) ?? [])[1] ?? NOT_CONFIRMED; }
  const action = shortLabel(wordsOf(sc?.firstAction ?? first?.action ?? ''), 7, SHORT_ACTION) || shortLabel(nextCheck(pl), 7, SHORT_ACTION) || 'Run the next check';
  /* the expected change: a figure only where one is supported, and then with its meaning and its mode; else the milestone */
  const af = first?.affects ?? {};
  const totals = econTotals(pl);
  const scen = scenarioOf(pl);
  const money = Number(totals?.revenue ?? scen?.value ?? scen?.scenario ?? NaN);
  /* Task 20: a revenue figure needs observed sales behind it or a scenario mode that earned it; otherwise the milestone
     stands in its place and nothing is grown from sales nobody has made. */
  const earned = baselineOf(pl) !== null || econScenario(pl)?.mode === 'operating_scenario';
  let change = '';
  if (Number.isFinite(money) && money > 0 && earned && scenarioMode(pl) !== 'requirements') change = `Scenario: ${gbp(near(money))} monthly revenue`;
  else if (Number.isFinite(Number(scen?.target ?? pl.goal?.target)) && Number(scen?.target ?? pl.goal?.target) > 0) change = `Requires ${gbp(Number(scen?.target ?? pl.goal.target))} a month to be reached`;
  else change = `Milestone: ${lc(wordsOf(af.milestone ?? first?.doneWhen ?? '') || 'the check is done')}`;
  const evidence = listOf(f.evidence).slice(0, 3);
  return {
    label, action, change, evidence,
    mode: scenarioMode(pl), modeWord: modeLabel(pl), hasFigure: /^Scenario:/.test(change),
    section: f.section ?? af.section ?? null, limb: f.limb ?? af.limb ?? null,
    check: nextCheck(pl), thin, actionId: first?.id ?? null,
  };
}
/** Task 19: one short personalised headline, the visitor's own business, where it stands and what it is moving towards */
function resultHeadline(pl) {
  const name = wordsOf(pl?.business ?? '') || bizName();
  const when = wordsOf(pl?.goal?.when ?? '');
  if (pl?.route === 'starter') return `${name}: the strongest direction from what you already have.`;
  const fig = goalFigure(pl);
  const now = baselineOf(pl);
  if (fig && now) return `${name}, ${gbp(near(now))} a month today, ${lc(fig)}${when ? ` by ${when}` : ''}.`;
  if (fig) return `${name}, ${lc(fig)}${when ? ` by ${when}` : ''}.`;
  if (now) return `${name}, ${gbp(near(now))} a month today.`;
  return `${name}: where the plan stands today.`;
}
/** Task 20: Now and Target in the same metric, unit and horizon, or the milestone when no numeric target is justified */
function targetLabel(pl) {
  const g = pl?.goal ?? {};
  const t = Number(scenarioOf(pl)?.target ?? g.target ?? g.amount ?? (pl?.route !== 'starter' && basis() === 'revenue' ? state.goal : NaN));
  const base = baselineOf(pl);
  const now = base ? `Now ${gbp(near(base))} a month` : '';
  if (Number.isFinite(t) && t > 0) return { text: `Target ${gbp(t)} a month${g.when ? ` by ${g.when}` : ''}`, now, kind: 'target' };
  const ms = goalFigure(pl) || wordsOf(firstOf(pl?.toProve)?.title ?? '');
  return { text: ms ? `Milestone: ${lc(ms)}${g.when ? ` by ${g.when}` : ''}` : 'No target set yet', now, kind: 'milestone' };
}
/** Task 19: up to two compact branch labels beside the tree; the finding's own branch is already on the face */
function branchLabels(pl) {
  const order = discOrder();
  const fin = resultFinding(pl);
  const out = [];
  const seen = new Set([fin?.section].filter(Boolean));
  (pl?.actions ?? []).filter((a) => !a.fromAnswers).forEach((a) => {
    const sec = a.affects?.section;
    if (out.length >= 2 || !sec || seen.has(sec) || !order.includes(sec)) return;
    seen.add(sec);
    out.push({ id: sec, label: glanceLabel(a.action), limb: a.affects?.limb ?? LIMB_OF_SECTION[sec] ?? null, actionId: a.id });
  });
  return out;
}

/* ---------- the scene itself ---------- */
let sceneDone = false;
let truthOpen = false;
const barStages = (s) => s === 'explore' || s === 'cutscene' || isPlanStage(s);
function ensureScene() {
  if (sceneDone) return $('#res');
  const host = document.createElement('section');
  host.id = 'res';
  host.setAttribute('aria-label', 'Your result');
  /* the composition: the headline and the target above the tree, the branch labels at its sides, the finding and the first
     action below it. The tree stands in the middle of all of them, which is what balances the scene (Task 19). */
  host.innerHTML = '<div class="res-top">'
    + '<p class="res-target" id="res-target"></p>'
    + '<h2 class="res-head" id="res-head" tabindex="-1"></h2>'
    + '</div>'
    + '<div class="res-branches" id="res-branches" role="group" aria-label="Branches"></div>'
    + '<div class="res-bottom"><div class="res-mid">'
    + '<div class="res-finding" id="res-finding"><p class="res-label" id="res-label"></p><p class="res-act" id="res-act"></p><p class="res-change" id="res-change"></p></div>'
    + '<div class="res-acts"><button type="button" class="link" id="res-truth" aria-expanded="false" aria-controls="res-truth-body">What needs to be true</button><button type="button" class="link" id="res-whole" hidden>Whole tree</button></div>'
    + '<div class="res-truth-body" id="res-truth-body" hidden></div>'
    + '</div></div>';
  document.body.appendChild(host);
  $('#res-truth', host).addEventListener('click', (e) => {
    const body = $('#res-truth-body', host);
    truthOpen = body.hidden;
    if (truthOpen) body.innerHTML = truthHtml(planObj().plan);
    feel.toggle(body, truthOpen, e.currentTarget);
  });
  $('#res-whole', host).addEventListener('click', () => wholeTree());
  sceneDone = true;
  return host;
}
/** Task 21: the visible reset. The inspector closes, the camera goes back to the whole tree and the scene takes focus. */
function wholeTree() {
  feel.play('close', { x: 0.5 });
  closeCard(true);
  cardState.clear();
  try {
    const t = tree();
    t?.collapseBranch?.();
    t?.select?.(null); t?.setCollar?.(null);
    if (typeof t?.setComposition === 'function' && !phone()) { t.setComposition('centred'); t.frame('explore'); }
    else t?.frame('explore', phone() ? {} : { at: { x: 0.5, y: 0.46 }, distMul: 1.12 });
  } catch (e) { /* the tree is optional */ }
  setTint('--sec-crown');
  delete document.body.dataset.inspect;
  paintScene();
  try { $('#res-head')?.focus({ preventScroll: true }); } catch (e) { /* none */ }
}
/** Task 20: what each branch is now, what it is aiming at and the action meant to close the gap, handed to the tree.
    Nothing is invented: a branch with no justified numeric target carries its milestone instead, and a branch the plan says
    nothing about is cleared rather than filled with a placeholder. */
function paintBranchInfo(pl, tgt) {
  const t = tree();
  if (!t || typeof t.setBranchInfo !== 'function') return;
  const acts = (pl?.actions ?? []).filter((a) => !a.fromAnswers);
  const seen = new Set();
  acts.forEach((a) => {
    const limb = a.affects?.limb;
    if (!limb || seen.has(limb)) return;
    seen.add(limb);
    const outcome = wordsOf(a.affects?.outcome ?? '');
    try {
      t.setBranchInfo(limb, {
        name: sectionBy(a.affects?.section)?.name ?? '',
        now: null, // the tree already holds each part's observed state; nothing is restated here
        target: outcome || null,
        milestone: outcome ? null : wordsOf(a.affects?.milestone ?? a.doneWhen ?? ''),
        action: shortLabel(a.action, 9, SHORT_ACTION),
        horizon: wordsOf(pl?.goal?.when ?? ''),
      });
    } catch (e) { /* the tree is optional */ }
  });
  /* the crown carries the goal itself: the target as a reference, never a predicted height (Task 34) */
  try { t.setBranchInfo('crown', { name: 'The goal', target: tgt?.kind === 'target' ? tgt.text.replace(/^Target /, '') : null, milestone: tgt?.kind === 'milestone' ? tgt.text.replace(/^Milestone: /, '') : null, action: resultFinding(pl)?.action ?? '', horizon: wordsOf(pl?.goal?.when ?? '') }); } catch (e) { /* optional */ }
}
/** the scene, painted from the plan object alone */
function paintScene() {
  const host = ensureScene();
  const pl = planObj().plan;
  if (!host) return;
  if (!pl) { $('#res-head', host).textContent = bizName(); $('#res-label', host).textContent = 'Your plan is not ready yet'; $('#res-act', host).textContent = 'Answer the questions that remain, then build your plan.'; $('#res-change', host).textContent = ''; $('#res-target', host).textContent = ''; $('#res-branches', host).innerHTML = ''; return; }
  const fin = resultFinding(pl);
  const tgt = targetLabel(pl);
  $('#res-head', host).textContent = resultHeadline(pl);
  $('#res-target', host).innerHTML = `<span class="target-mark" data-kind="${esc(tgt.kind)}">${esc(tgt.text)}</span>${tgt.now ? `<span class="target-now">${esc(tgt.now)}</span>` : ''}`;
  $('#res-label', host).textContent = fin.label;
  /* Task 19: where the diagnosis is not supported, the useful next check stands in the action's place */
  $('#res-act', host).textContent = fin.thin && fin.check ? `Next check: ${lc(fin.check)}` : fin.action;
  /* Task 34: a figure never stands without its mode label */
  $('#res-change', host).innerHTML = `<span class="res-change-word">${esc(fin.change)}</span>${fin.hasFigure ? ` ${modeChip(pl)}` : ''}`;
  const branches = branchLabels(pl);
  $('#res-branches', host).innerHTML = branches.map((b) => `<button type="button" class="res-branch" data-section="${esc(b.id)}" style="--hue: var(${esc(sectionBy(b.id)?.hue ?? '--sec-crown')})"><i class="dot"></i><span>${esc(b.label)}</span></button>`).join('');
  $$('.res-branch', host).forEach((b) => b.addEventListener('click', () => { feel.play('discopen', { x: feel.x(b) }); openCard(b.dataset.section); }));
  paintBranchInfo(pl, tgt);
  const whole = $('#res-whole', host);
  if (whole) whole.hidden = !openId && !document.body.dataset.inspect;
  const body = $('#res-truth-body', host);
  if (truthOpen && body) body.innerHTML = truthHtml(pl);
  paintBar();
}
/* ---------- Task 19: the stable toolbar. It exists from the first generated view and works through the recap. ---------- */
function ensureBar() {
  let bar = $('#res-bar');
  if (bar) return bar;
  bar = document.createElement('div');
  bar.id = 'res-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Your result');
  bar.hidden = true;
  bar.innerHTML = '<button type="button" class="glass small" id="res-dl">Download</button>'
    + '<button type="button" class="glass small" id="res-full">Full plan</button>'
    + '<button type="button" class="glass small glass-on" id="res-tma">Build this with TMA</button>'
    + '<p class="small res-said" id="res-said" role="status" hidden></p>';
  document.body.appendChild(bar);
  $('#res-dl', bar).addEventListener('click', (e) => downloadFromBar(e.currentTarget));
  /* Full plan: the plan view from anywhere else; on the stages it is the plan stage with the full plan's drawer opened */
  $('#res-full', bar).addEventListener('click', (e) => { feel.play('open', { x: feel.x(e.currentTarget) }); if (cutRunning) skip(); else if (isPlanStage(stageNow()) && $('#stage-plan')) { goStage('plan'); const d = $('#plan-more'); if (d) d.open = true; } else openPlan(); });
  $('#res-tma', bar).addEventListener('click', (e) => openTma(e.currentTarget));
  return bar;
}
function barSaid(text) {
  const el = $('#res-said');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
  clearTimeout(el.timer);
  if (text) el.timer = setTimeout(() => { el.hidden = true; }, 4000);
}
/** one press, one file: the plan on paper when the PDF library loaded, the implementation brief when it did not */
async function downloadFromBar(btn) {
  const pl = planObj().plan;
  if (!pl) { barSaid('There is no plan to download yet.'); return; }
  btn.disabled = true;
  feel.play('tap', { x: feel.x(btn) });
  if (window.jspdf?.jsPDF) {
    const name = await exportPdf();
    barSaid(name ? `Saved ${name}.` : 'The PDF was not made. Press Download again for the implementation brief.');
  } else {
    const name = `mercer-plan-${slug()}.md`;
    const ok = await save(name, new Blob([planMarkdown(pl)], { type: 'text/markdown' }));
    barSaid(ok ? `Saved ${name}.` : 'The file was not saved.');
  }
  btn.disabled = false;
}
function paintBar(stage) {
  const bar = ensureBar();
  const ready = !!planObj().plan;
  bar.hidden = !(ready && barStages(stage ?? shownStage()));
}

/* ---------- Task 23: what TMA could contribute, around the visitor's own expertise ---------- */
const TMA_INVITE = 'Bring your expertise. Explore how TMA could help build the systems and routes to customers around it.';
const TMA_LIMITS = 'TMA does not fund the business, does not take on everyone, and cannot guarantee distribution or revenue. Any TMA cost or capacity is an assumption until it is agreed, not a free resource in this plan.';
/** the booking destination: a configured one first, then the standing link. Never a dead control. */
function bookingOf() {
  const cfg = M.CONFIG?.bookingUrl;
  if (typeof cfg === 'string' && /^https:\/\/\S+$/.test(cfg.trim())) return { url: cfg.trim(), configured: true };
  if (typeof BOOKING_URL === 'string' && /^https:\/\/\S+$/.test(BOOKING_URL)) return { url: BOOKING_URL, configured: false };
  return { url: null, configured: false };
}
/** the split, tailored to this plan: what the person brings, what the plan gives them, and what TMA could do around it */
function roleSplit(pl) {
  const skills = listOf(pl?.foundations?.skills).slice(0, 2);
  const adv = (pl?.advantages ?? []).map((a) => wordsOf(typeof a === 'string' ? a : a.title ?? a.line ?? '')).filter(Boolean);
  const mine = skills.length ? skills.join(' and ') : adv[0] ? lc(adv[0]) : 'what you know about your customers and your work';
  const first = pl?.firstAction ?? (pl?.actions ?? [])[0] ?? null;
  const work = wordsOf(first?.action ?? '') ? lc(shortLabel(first.action, 8)) : 'the delivery and quality work this plan gives you';
  return [
    { you: `Your expertise: ${mine}. What the offer promises, and the judgement about who it is for.`, tma: 'Suitable AI systems, the workflows around them and the supporting software.' },
    { you: `The work this plan puts in your hands: ${work}.`, tma: 'Defined parts of customer acquisition and distribution, where TMA offers them.' },
    { you: 'The decisions, the approvals and what you commit.', tma: 'Implementation planning, measurement and agreed operational support.' },
  ];
}
let tmaFrom = null;
function closeTma() {
  const el = $('#tma-panel'), scrim = $('#tma-scrim');
  if (!el || el.hidden) return;
  el.hidden = true;
  if (scrim) scrim.hidden = true;
  feel.play('close');
  try { (tmaFrom ?? $('#res-tma'))?.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  tmaFrom = null;
}
function openTma(fromEl) {
  const pl = planObj().plan;
  if (!pl) { barSaid('There is no plan to talk about yet.'); return; }
  try { M.shell?.closeHelp?.(); M.shell?.closeInspect?.(); } catch (e) { /* none */ }
  closeShare();
  tmaFrom = fromEl ?? null;
  let el = $('#tma-panel'), scrim = $('#tma-scrim');
  if (!el) {
    scrim = document.createElement('div'); scrim.id = 'tma-scrim'; scrim.hidden = true;
    el = document.createElement('div'); el.id = 'tma-panel'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tma-title'); el.tabIndex = -1;
    document.body.append(scrim, el);
    scrim.addEventListener('click', () => closeTma());
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); closeTma(); return; }
      if (ev.key !== 'Tab') return;
      const stops = $$('button, input, a[href]', el).filter((x) => !x.disabled && !x.hidden && !x.closest('[hidden]'));
      if (!stops.length) { ev.preventDefault(); return; }
      const first = stops[0], last = stops[stops.length - 1], at = document.activeElement;
      if (ev.shiftKey && (at === first || at === el)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && at === last) { ev.preventDefault(); first.focus(); }
    });
  }
  const book = bookingOf();
  el.innerHTML = `<h2 id="tma-title" class="tma-title">Build this with TMA</h2>
    <p class="tma-invite">${esc(TMA_INVITE)}</p>
    <table class="tma-split"><thead><tr><th>You</th><th>TMA, subject to agreed scope</th></tr></thead><tbody>${roleSplit(pl).map((r) => `<tr><td>${esc(r.you)}</td><td>${esc(r.tma)}</td></tr>`).join('')}</tbody></table>
    <p class="small">${esc(TMA_LIMITS)}</p>
    <p class="tma-acts">${book.url ? `<button type="button" class="glass" id="tma-book">Book a call</button>` : ''}<button type="button" class="glass small" id="tma-brief">Choose what to share</button><button type="button" class="glass small" id="tma-close">Close</button></p>
    <p class="small">${esc(book.url ? 'The call is about fit, commitment and implementation scope. Opening the calendar sends nothing: what you share is a separate choice, section by section.' : 'No booking destination is configured on this page, so the next step is the brief: choose its sections, download it and send it yourself.')}</p>`;
  $('#tma-close', el).addEventListener('click', () => closeTma());
  $('#tma-book', el)?.addEventListener('click', (ev) => { feel.play('tap', { x: feel.x(ev.currentTarget) }); window.open(book.url, '_blank', 'noopener'); });
  $('#tma-brief', el).addEventListener('click', () => { const from = tmaFrom; closeTma(); openShare(from ?? $('#res-tma')); });
  scrim.hidden = false; el.hidden = false;
  feel.play('open', { x: fromEl ? feel.x(fromEl) : 0.5 });
  try { el.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
}

/* ============ stage listener and the exports ============ */
document.addEventListener('mercer:stage', (e) => {
  const s = e.detail?.stage;
  /* C16, fix 3 item 9: the discs exist at explore and the harvest only. (d) fires this after its own closeCard() calls, so the
     clear lands last on the way to a reopened question, to Roots, to a section and into a replayed cutscene; enter() paints
     them again on the way back. */
  if (s !== 'explore' && s !== 'harvest') { try { tree()?.setDiscs?.([]); } catch (err) { /* optional */ } dropTabs(); }
  /* Refine 1, R9: the review panel belongs to the harvest and closes with it, without moving focus */
  if (s !== 'harvest') { const sh = $('#share'), sc = $('#share-scrim'); if (sh && !sh.hidden) { sh.hidden = true; if (sc) sc.hidden = true; shareFrom = null; } }
  /* Task 19: the toolbar follows the result, not one stage; the TMA panel is a top-level overlay and leaves with the stage */
  paintBar(s);
  if (!barStages(s)) { const tp = $('#tma-panel'), ts = $('#tma-scrim'); if (tp && !tp.hidden) { tp.hidden = true; if (ts) ts.hidden = true; tmaFrom = null; } }
  if (s !== 'explore') { delete document.body.dataset.inspect; truthOpen = false; }
  /* a stage move out of the recap ends it: the hold is released and the words leave */
  if (s !== 'cutscene' && cutRunning) { cutToken++; cutRunning = false; cutWake?.(); turnRes?.(1); const fg = $('#cut-figure'), ln = $('#cut-line'), ch = $('#cut-chapter'); if (fg) { fg.textContent = ''; fg.classList.remove('in', 'out'); } if (ln) { ln.textContent = ''; ln.classList.remove('in', 'out'); } if (ch) ch.textContent = ''; }
  if (s === 'cutscene' && !cutRunning) cutscene();
  else if (s === 'explore') enter();
  /* the flow's own go('plan') lands here (it rebuilds a stale plan first). The deterministic plan is painted at once; the
     model is asked only when the move followed a real press (R16: on the Build my plan press, never on load). */
  if (!isPlanStage(s)) { forgetAsked = false; leaveStages(); } // a confirmation never survives leaving the plan view; nor do the stages' marks on the tree
  else if (isPlanStage(s)) { try { tree()?.frame(resultsFrame()); } catch (err) { /* optional */ } setTint('--sec-crown'); paintPlan(true); if (recentGesture()) refinePlan(planObj().plan); }
});
document.addEventListener('mercer:ladder', (e) => {
  /* (d) dispatches this in the same turn it resolves its promise, so the cache's own then() has not run yet: the ladder is
     taken from the event when it is for the answers as they stand */
  const d = e.detail ?? {};
  if (d.ladder && d.key && d.key === safeKey()) { if (ladderCache.key === d.key) ladderCache.value = d.ladder; else ladderCache = { key: d.key, value: d.ladder, promise: Promise.resolve(d.ladder) }; }
  /* D4: the chosen level's line is never waited for; it is painted when the ladder lands: on the goal chapter, on the crown card */
  if (cutOn?.chapter && cutOn.index === 0 && cutOn.lineEl) cutOn.lineEl.textContent = chapterLines(cutOn.chapter, 0);
  if (openId === 'you') { paintLadder(); dialCtl?.set?.({ working: false, line: appetiteLine(state.appetite ?? 'moderate') }); }
  if (openId === 'crown' && stageNow() === 'explore') paintCard('crown');
  /* the local plan object reads the ladder's restraints: a plan view on screen is painted again when it lands */
  if (isPlanStage(stageNow())) { localPlanCache.key = null; paintPlan(false); }
  if (shownStage() === 'explore') { econCache.key = null; paintScene(); }
});
/* a plan built or refined after the scene was painted repaints it, so the finding and the toolbar never lag the plan */
document.addEventListener('mercer:revision', () => { econCache.key = null; if (shownStage() === 'explore') paintScene(); else paintBar(); });
/* D11: a plan rebuilt while the stages are on screen repaints them from the one plan; the stage and the milestone are kept */
document.addEventListener('mercer:revision', () => { if (isPlanStage(shownStage())) { localPlanCache.key = null; paintPlan(false); } });

M.canopy = {
  /* Rebuild 1: the plan object, the recap's chapters, the plan view, the example renderer, the model state, the tree view */
  plan: planObj, recap: chaptersOf, renderPlanInto, openPlan, buildPlan, harvest: openPlan, refine: refinePlan, refineState: () => ({ ...modelState, controller: undefined, patch: undefined }), setTreeView, selectAction, actionCard: actionCardHtml, markdown: planMarkdown,
  /* Final pack: the scene, the toolbar, the finding, the mode labels, the assumptions and the TMA panel */
  scene: paintScene, bar: paintBar, finding: resultFinding, headline: resultHeadline, target: targetLabel, branches: branchLabels, mode: scenarioMode, modeLabel, assumptions: assumptionsOf, wholeTree, tma: { open: openTma, close: closeTma, split: roleSplit, booking: bookingOf }, bookingOf,
  share: { open: openShare, close: closeShare, parts: shareParts, brief: tmaBriefMarkdown },
  /* Results round 1: the four stages, the shared inspector and the stage contents read from the plan (D3, defensively) */
  stages: { go: goStage, current: () => stageAt, milestone: () => milestoneAt, open: () => inspOpen, close: closeInspector, openMilestone, openWhy, openFact, openEvidence, openBranch, openAlternative, fit: fitTree, snap: syncSnap, move: moveOf, why: whyOf, sequence: sequenceOf, start: startOf, card: cardOf, words: wordsN, fits: fitsN, done: () => [...doneMarks] },
  founder: founderView, control: controlView, method: methodOf, diagnosis, enter, repaint, openCard, closeCard, nextCard, prevCard, cutscene, skip, replay, steps, limit, unfinished, drawCore, summary, overall, report, briefing, eightyTwenty, weather, opened: () => openId,
};
M.exports = { markdown: exportMarkdown, plan: planMarkdown, brief: tmaBriefMarkdown, pdf: exportPdf, json: exportJson, progress: () => (typeof M.save?.exportFile === 'function' ? M.save.exportFile() : null) };
})();
