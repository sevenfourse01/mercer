/* archetypes.js (Mercer 12, owner (f) results): the agent's name and the facts behind it.

   Eight archetypes over the sixteen founder types (notes/facts-archetypes.md). The archetype is a name
   for the visitor's own statement of preference (state.personality); it moves no number. Every `did`
   is a fact from the note, copied whole, with the URL it was read from. Nobody is impersonated: the
   agent speaks as the archetype, never as a named person, and no named person's type is asserted.
   M.archetypes.answer() is a scripted responder over state and the engine's outputs; it fetches
   nothing and generates nothing. A visitor who gave no type has no archetype and no named pair: they
   get the three chips that read no type (fix 3, C12), and the panel stays nameless.
   Refine 1 (R17, R18): two more chips, "What should I stop doing myself?" and "Who should decide what?", answered from
   M.founderProfile?.() and M.controlProfile?.() and the visitor's own words for those answers. `keeps` and `sheds` are
   the archetype's voice for them: a reading of the stated preference, the same kind of sentence as `grows`, never a
   fact about a named person. Neither chip gives a legal conclusion. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});

const LIST = [
  { name: 'The Builder', types: ['INTJ', 'INTP'], grows: 'building the system', keeps: 'the design of the system', sheds: 'the running of it, day to day',
    lines: ['Grows by building the system first: the offer and the follow-up, tested small before it is trusted.',
      'Sells through the system rather than in person, so growth compounds without the founder in every room.'],
    examples: [
      { who: 'Tobi Lütke', company: 'Shopify', did: 'In 2004 he and two partners opened Snowdevil, an online snowboard shop; the shop software they wrote for it became Shopify, launched in 2006.', sources: ['https://en.wikipedia.org/wiki/Tobias_L%C3%BCtke'] },
      { who: 'Jeff Bezos', company: 'Amazon', did: 'Amazon launched S3 on 14 March 2006, selling other businesses the same storage infrastructure Amazon.com runs its own shop on; EC2 followed that summer.', sources: ['https://en.wikipedia.org/wiki/Amazon_S3', 'https://aws.amazon.com/blogs/aws/aws-blog-the-first-five-years/'] },
    ] },
  { name: 'The Operator', types: ['ENTJ', 'ESTJ'], grows: 'keeping a weekly number', keeps: 'the weekly number', sheds: 'the tasks a checklist can hold',
    lines: ['Grows by routine: a target, and a weekly number that holds everyone to it.',
      'Keeps the two routes that already work, tightens cost per client, and scales what the numbers prove.'],
    examples: [
      { who: 'Ray Kroc', company: 'McDonald’s', did: 'In 1961 Hamburger University opened in the basement of the Elk Grove Village McDonald’s and graduated its first 15 managers, trained in the one system every restaurant would run.', sources: ['https://www.journal-topics.com/articles/new-exhibit-details-mcdonalds-university-founded-in-elk-grove/'] },
      { who: 'Michael Dell', company: 'Dell', did: 'Registered the business in 1984 with $1,000, bought parts only against orders already in hand, assembled machines for immediate delivery and sold them by telephone order.', sources: ['https://achievement.org/achiever/michael-dell/'] },
    ] },
  { name: 'The Hunter', types: ['ENTP', 'ESTP'], grows: 'closing one deal at a time', keeps: 'the room and the close', sheds: 'what follows the handshake',
    lines: ['Grows one deal at a time: finds the angle others missed, gets in the room, closes there.',
      'Few enquiries, large sales; the risk is what happens after the handshake.'],
    examples: [
      { who: 'Alan Sugar', company: 'Amstrad', did: 'Started with £100 from his Post Office account, £50 of it on a second-hand minivan, selling car aerials; formed A.M.S. Trading Co. on 1 November 1968, the company that became Amstrad.', sources: ['https://amstrad.com/about-us/'] },
      { who: 'Sara Blakely', company: 'Spanx', did: 'Spent two years and $5,000 of savings developing the product; in a meeting with a Neiman Marcus buyer she changed into it in the ladies’ restroom to show the difference, and Neiman Marcus took it in seven stores.', sources: ['https://en.wikipedia.org/wiki/Sara_Blakely'] },
    ] },
  { name: 'The Connector', types: ['ENFJ', 'ESFJ'], grows: 'working the network', keeps: 'the introductions', sheds: 'the admin behind them',
    lines: ['Grows through people: referrals, introductions, a network with favours owed both ways.',
      'The best clients arrive warm, so the work is keeping the network fed and asking for the introduction.'],
    examples: [
      { who: 'Reid Hoffman', company: 'LinkedIn', did: 'LinkedIn began in his living room in 2002 and launched on 5 May 2003.', sources: ['https://about.linkedin.com/'] },
      { who: 'Mary Kay Ash', company: 'Mary Kay', did: 'Launched the company in Dallas on 13 September 1963 with $5,000 of savings; it sells at wholesale to independent consultants who sell on through their own personal networks.', sources: ['https://www.history.com/this-day-in-history/september-13/mary-kay-launches-namesake-makeup-company', 'https://www.tshaonline.org/handbook/entries/mary-kay-cosmetics'] },
    ] },
  { name: 'The Storyteller', types: ['ENFP', 'ESFP'], grows: 'building an audience', keeps: 'the voice', sheds: 'the follow-up behind it',
    lines: ['Grows by being seen: a voice, a show, a stunt, an audience that buys because it already likes you.',
      'Attention comes easily and follow-up does not, so the system behind the story is what turns reach into revenue.'],
    examples: [
      { who: 'Richard Branson', company: 'Virgin', did: 'Virgin Atlantic flew its first scheduled service, Gatwick to Newark, on 22 June 1984 with one leased Boeing 747-200.', sources: ['https://en.wikipedia.org/wiki/Virgin_Atlantic'] },
      { who: 'Gary Vaynerchuk', company: 'Wine Library', did: 'Took over his father’s liquor store after graduating in 1998, renamed it Wine Library, put sales online, and in 2006 started a daily YouTube wine show, Wine Library TV; the store grew to $60m a year.', sources: ['https://en.wikipedia.org/wiki/Gary_Vaynerchuk', 'https://garyvaynerchuk.com/biography/'] },
    ] },
  { name: 'The Maker', types: ['ISTP', 'ISFP'], grows: 'letting the work sell', keeps: 'the craft', sheds: 'the selling and the paperwork',
    lines: ['Grows on the work itself: every finished job is the advert, and word of mouth does the selling.',
      'Sales feel like an interruption, so growth means making the work easy to show and easy to pass on.'],
    examples: [
      { who: 'James Dyson', company: 'Dyson', did: 'Built about 5,127 prototypes of the bagless cyclone cleaner before the first model went on sale; the DC01 followed in 1993 and the Dual Cyclone became the fastest-selling vacuum cleaner ever made in the UK.', sources: ['https://en.wikipedia.org/wiki/James_Dyson', 'https://gizmodo.com/praising-failure-james-dyson-talks-vacuums-5-127-proto-5790556'] },
      { who: 'Jo Malone', company: 'Jo Malone London', did: 'Worked as a facialist and mixed bath oils on her own stove as gifts for clients; one client bought 100 bottles for a dinner party; the first shop opened on Walton Street, London, in October 1994 with a queue down the street.', sources: ['https://www.encyclopedia.com/books/culture-magazines/malone-jo'] },
    ] },
  { name: 'The Steward', types: ['ISTJ', 'ISFJ'], grows: 'keeping clients', keeps: 'the promise made to each client', sheds: 'the work a written routine can carry',
    lines: ['Grows by keeping: clients stay for years because what was promised arrives on the day it was promised.',
      'Retention, repeat orders and slow, steady referrals; growth comes from what each client is worth over the years.'],
    examples: [
      { who: 'Julian Richer', company: 'Richer Sounds', did: 'In May 2019 transferred 60% of his shares in the company into an employee ownership trust.', sources: ['https://www.thenews.coop/home-entertainment-retailer-richer-sounds-moves-employee-ownership-model/'] },
      { who: 'Jim Sinegal', company: 'Costco', did: 'Opened the first Costco warehouse in Seattle with Jeffrey Brotman on 15 September 1983; the company’s rule caps the markup on any regular item at 14% over cost.', sources: ['https://en.wikipedia.org/wiki/Costco', 'https://www.foxbusiness.com/retail/history-costco'] },
    ] },
  { name: 'The Believer', types: ['INFJ', 'INFP'], grows: 'standing for one mission', keeps: 'the mission', sheds: 'the daily decisions that do not touch it',
    lines: ['Grows around a mission: clients who share it stay, talk, and forgive a slower pace.',
      'Takes the long view, distrusts hype, and builds a brand that stands for one thing.'],
    examples: [
      { who: 'Anita Roddick', company: 'The Body Shop', did: 'Opened the first Body Shop in Kensington Gardens, Brighton, in March 1976; under her the company cut unnecessary packaging and backed Amnesty International, Friends of the Earth and the Big Issue.', sources: ['https://brightonmuseums.org.uk/discovery/history-stories/dame-anita-roddick-entrepreneur-activist-and-campaigner/'] },
      { who: 'Yvon Chouinard', company: 'Patagonia', did: 'On 14 September 2022 the Chouinard family transferred all ownership to the Patagonia Purpose Trust (all voting stock, 2%) and the Holdfast Collective (all non-voting stock, 98%); profit not reinvested in the business is paid to the Collective as a dividend.', sources: ['https://www.patagoniaworks.com/press/2022/9/14/patagonias-next-chapter-earth-is-now-our-only-shareholder'] },
    ] },
];
const BY_TYPE = {};
LIST.forEach((a) => a.types.forEach((t) => { BY_TYPE[t] = a; }));

/** the archetype for a four-letter code, or null */
const pick = (code) => BY_TYPE[String(code ?? '').toUpperCase().trim()] ?? null;
/** the visitor's own, from state.personality */
const current = (state) => pick((state ?? M.state)?.personality);

/* ---------- the five chips (COPY §14) ---------- */
const BIN_WORD = { warm11: 'warm, one to one', warm1m: 'warm, one to many', cold11: 'cold, one to one', cold1m: 'cold, one to many', unknown: 'from somewhere you cannot say' };
const BIN_ENGINE = () => M.BIN_ENGINE ?? { warm11: ['referral', 'partnerships'], warm1m: ['partnerships', 'content-seo'], cold11: ['cold-email', 'linkedin', 'cold-calling'], cold1m: ['paid-search', 'paid-social', 'content-seo'] };
const SECTION_NAME = { roots: 'Roots', offer: 'The offer', reach: 'Reach', routes: 'Routes in', close: 'The close', delivery: 'Delivery', money: 'Money', clients: 'Best clients', you: 'You', control: 'Control', ground: 'Ground' };
const gbp = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : '£' + Math.round(n).toLocaleString('en-GB'));
const strip = (s) => String(s ?? '').trim().replace(/[.!]+$/, '');

/** "a Builder", "an Operator": the article a name takes (fix 3, C24) */
const article = (word) => (/^[aeiou]/i.test(String(word ?? '').trim()) ? 'an' : 'a');
const CHIP_IDS = ['lastFive', 'routes', 'example', 'restraint', 'topShare', 'stop', 'decide'];
/* refine 1: the answers the two new chips read (R17 founder, R18 control) */
const FOUNDER_IDS = ['energy', 'avoided', 'delegation', 'decisionSpeed', 'futureRole'];
const CONTROL_IDS = ['ownership', 'ownShare', 'profitShare', 'decisionRights', 'influence', 'keyPeople', 'plannedChanges', 'retain', 'exitIntent', 'unresolved'];
/* the chips that read no type: the last five, the first limit and the top three. A visitor who skipped Type gets these
   three and the free field; the other two name an archetype and its public example, which only a type gives (fix 3, C12) */
const NO_TYPE = ['lastFive', 'restraint', 'topShare', 'stop', 'decide'];
/* a new chip shows only where its module is in this build: the profile function exists, or state holds one of its keys */
const hasModule = (fn, ids, s) => typeof M[fn] === 'function' || ids.some((id) => s && Object.prototype.hasOwnProperty.call(s, id));
const chips = (state) => {
  const a = current(state);
  const all = [
    { id: 'lastFive', text: 'Where did my last five best clients come from, and what does that say about my next five?' },
    a ? (() => { const bare = a.name.replace(/^The /, ''); return { id: 'routes', text: `Which of the four routes should ${article(bare)} ${bare} put first?` }; })() : null,
    a?.examples?.[0]?.who ? { id: 'example', text: `What did ${a.examples[0].who} do that I could copy this quarter, with my numbers?` } : null,
    { id: 'restraint', text: 'What is the one restraint on hitting my target?' },
    { id: 'topShare', text: 'My top clients are most of my revenue. What do I change first?' },
    hasModule('founderProfile', FOUNDER_IDS, state ?? M.state) ? { id: 'stop', text: 'What should I stop doing myself?' } : null,
    hasModule('controlProfile', CONTROL_IDS, state ?? M.state) ? { id: 'decide', text: 'Who should decide what?' } : null,
  ].filter(Boolean);
  return a ? all : all.filter((c) => NO_TYPE.includes(c.id));
};

/* the most common bin among the five, with its count */
function topBin(lastFive) {
  if (!Array.isArray(lastFive) || lastFive.length < 5 || lastFive.some((x) => !x || !x.bin)) return null;
  const n = {};
  lastFive.forEach((x) => { n[x.bin] = (n[x.bin] ?? 0) + 1; });
  const bin = Object.keys(n).sort((x, y) => n[y] - n[x])[0];
  return { bin, k: n[bin] };
}
const steps = () => { try { return M.canopy?.steps?.() ?? []; } catch (e) { return []; } };
const limit = () => { try { return M.canopy?.limit?.() ?? null; } catch (e) { return null; } };

/* keyword rules for a typed question: the chip it is nearest to, else the branch it would live on */
const RULES = [
  ['lastFive', /\b(last five|five best|best (five|clients)|next five|where .*came|came from)\b/i],
  ['routes', /\b(route|routes|channel|channels|put first|which .*first|warm|cold)\b/i],
  ['example', /\b(copy|quarter|what did|did .* do|example|founder)\b/i],
  ['restraint', /\b(restraint|limit|limits|binds|bottleneck|target|hit|reach)\b/i],
  ['topShare', /\b(top (two|three|clients)|most of my revenue|concentrat|biggest client|change first)\b/i],
  ['stop', /\b(stop doing|delegat\w*|hand (over|off|on)|let go|drains?|put off|doing myself)\b/i],
  ['decide', /\b(who (should )?decides?|decision rights|decisions?|control|ownership|co-?founder|succession|successor|step back)\b/i],
];
const BRANCH_OF = [
  ['offer', /\b(price|prices|pricing|fee|retainer|sale value|charge|upsell)\b/i],
  ['reach', /\b(prospect|prospects|market|list|contacts|competitor|competitors|map|area)\b/i],
  ['routes', /\b(ads|advert|seo|social|email|referral|spend|budget|agency|marketing)\b/i],
  ['close', /\b(close|closing|enquir|quote|quotes|convert|reviews|reply|follow)\b/i],
  ['delivery', /\b(capacity|deliver|team|hire|hiring|staff|overflow|bottleneck)\b/i],
  ['money', /\b(margin|cost|costs|cash|runway|software|outgoings|payment|invoice)\b/i],
  ['clients', /\b(repeat|retention|stay|lifetime|loyal|renew)\b/i],
  ['you', /\b(time|hours|strength|type|personality|cv|risk|energy|role)\b/i],
  ['control', /\b(owner|owners|shares?|partner|partners|director|governance|exit|sell the business)\b/i],
  ['ground', /\b(network|funding|loan|grant|investor|introduc)\b/i],
];

/* ---------- refine 1: reading the founder and control answers ---------- */
/** a profile from questions.js, or null; a build without the module, or a throw, is "no profile" */
const profile = (fn) => { try { const p = M[fn]?.(); return p && typeof p === 'object' ? p : null; } catch (e) { return null; } };
const gaveAny = (ids, s) => ids.some((id) => {
  try { if (s.notSure?.has?.(id) || s.na?.has?.(id)) return false; } catch (e) { /* no sets */ }
  try { if (typeof M.schemaAnswered === 'function' && M.SCHEMA_BY?.[id]) return M.schemaAnswered(id); } catch (e) { /* read state below */ }
  const v = s[id];
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v).some((x) => (Array.isArray(x) ? x.length > 0 : x !== null && x !== undefined && x !== ''));
  return true;
});
/** the visitor's own words for an answer, as the interview prints them; '' when it has none */
const wordsOf = (id) => { try { return strip(M.schemaWord?.(id) || M.answerWord?.(id) || ''); } catch (e) { return ''; } };
const plain = (id) => String(id ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').toLowerCase().trim();
const say = (x) => (typeof x === 'string' ? strip(x) : strip(x?.text ?? x?.title ?? x?.words ?? x?.label ?? x?.name ?? ''));
const listOf = (x) => (Array.isArray(x) ? x.map(say).filter(Boolean) : []);
const and = (xs) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const lower = (x) => (x ? x[0].toLowerCase() + x.slice(1) : x);
/** the ids on one side of a two-zone or three-zone answer, whichever way round it is held: { zone: [ids] } or { id: zone } */
function zoneOf(v, re) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
  const out = [];
  Object.entries(v).forEach(([k, x]) => {
    if (Array.isArray(x)) { if (re.test(k)) out.push(...x); }
    else if (typeof x === 'string' && re.test(x)) out.push(k);
  });
  return out.map(plain).filter(Boolean);
}
const WHO = [['you', /^(you|me|mine|self|founder|owner)\b|^i$/i], ['shared', /shar|joint|together|both|partner/i], ['team', /team|staff|manager|other|them|system/i]];
const whoOf = (x) => WHO.find(([, re]) => re.test(String(x ?? '')))?.[0] ?? null;
/** decision rights as { decision: 'you' | 'shared' | 'team' }, from either shape, or null */
function rightsOf(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const map = {};
  Object.entries(v).forEach(([k, x]) => {
    if (Array.isArray(x)) { const w = whoOf(k); if (w) x.forEach((d) => { map[plain(say(d) || d)] = w; }); }
    else { const w = whoOf(say(x) || x); if (w) map[plain(k)] = w; }
  });
  return Object.keys(map).length ? map : null;
}
function rightsLine(map) {
  const by = { you: [], shared: [], team: [] };
  Object.entries(map).forEach(([d, w]) => by[w]?.push(d));
  return [
    by.you.length ? `you decide ${and(by.you)}` : '',
    by.shared.length ? `${and(by.shared)} ${by.shared.length > 1 ? 'are' : 'is'} shared` : '',
    by.team.length ? `the team decides ${and(by.team)}` : '',
  ].filter(Boolean).join('; ');
}
const UNKNOWN = (section) => `Mercer does not know that. The ${SECTION_NAME[section]} branch is where it would live.`;
const REVIEW = 'Ownership, employment, tax and shareholder rights are for a solicitor or accountant to review.';

/** "What should I stop doing myself?": what they said drains them and what they put off, the profile's first action, and
    the archetype's word on what it keeps. Self-reported answers, said as "you said" */
function stopAnswer(s, a) {
  const fp = profile('founderProfile');
  const actions = listOf(fp?.actions);
  if (!gaveAny(FOUNDER_IDS, s) && !actions.length) return UNKNOWN('you');
  const drains = listOf(fp?.current?.drains ?? fp?.drains);
  const drained = drains.length ? drains.map(lower) : zoneOf(s.energy, /drain|avoid/i);
  const put = listOf(fp?.current?.avoided ?? fp?.avoided);
  const avoided = put.length ? put.map(lower) : (wordsOf('avoided') ? [lower(wordsOf('avoided'))] : []);
  const out = [];
  if (drained.length && avoided.length) out.push(`You said ${and(drained)} ${drained.length > 1 ? 'drain' : 'drains'} you, and you put off ${and(avoided)}.`);
  else if (drained.length) out.push(`You said ${and(drained)} ${drained.length > 1 ? 'drain' : 'drains'} you.`);
  else if (avoided.length) out.push(`You said you put off ${and(avoided)}.`);
  const handOn = listOf(fp?.intended?.delegate ?? fp?.delegate);
  const act = actions.find((x) => /delegat|hand|document|automat|stop|hire|recruit/i.test(x)) ?? actions[0];
  if (handOn.length) out.push(`Hand on first: ${and(handOn.map(lower))}.`);
  else if (act) out.push(`${act}.`);
  else if (drained.length || avoided.length) out.push('Those go first: hand them on, write them down or automate them.');
  const how = wordsOf('delegation');
  if (how && out.length < 3) out.push(`On handing work on, you said: ${lower(how)}.`);
  const role = wordsOf('futureRole');
  if (role && !out.length) out.push(`You said the role you want is: ${lower(role)}.`);
  if (!out.length) return UNKNOWN('you');
  if (a?.keeps && a?.sheds) { const bare = a.name.replace(/^The /, ''); out.push(`${bare}s keep ${a.keeps} and hand on ${a.sheds}.`); }
  return out.join(' ');
}

/** "Who should decide what?": today's decision rights beside the intended ones, the decisions that move, and the
    professional-review line wherever ownership is in the answer. No legal conclusion is drawn */
function decideAnswer(s, a) {
  const cp = profile('controlProfile');
  const actions = listOf(cp?.actions);
  if (!gaveAny(CONTROL_IDS, s) && !actions.length) return UNKNOWN('control');
  const now = rightsOf(cp?.current?.decisionRights ?? cp?.current?.rights ?? cp?.current) ?? rightsOf(s.decisionRights);
  const then = rightsOf(cp?.intended?.decisionRights ?? cp?.intended?.rights ?? cp?.intended);
  const out = [];
  if (now) out.push(`Today ${rightsLine(now)}.`);
  else if (wordsOf('decisionRights')) out.push(`Today: ${lower(wordsOf('decisionRights'))}.`);
  const keep = wordsOf('retain');
  const moves = now && then ? Object.keys(now).filter((d) => now[d] === 'you' && then[d] && then[d] !== 'you') : [];
  if (moves.length) out.push(`You intend to hand on ${and(moves)}${keep ? ` and keep ${lower(keep)}` : ''}.`);
  else if (keep) out.push(`You want to keep: ${lower(keep)}.`);
  if (actions[0]) out.push(`First: ${lower(actions[0])}.`);
  if (!out.length) return UNKNOWN('control');
  if (a?.keeps) { const bare = a.name.replace(/^The /, ''); out.push(`${bare}s keep ${a.keeps}; the rest can move once it is written down.`); }
  if (gaveAny(['ownership', 'ownShare', 'profitShare', 'plannedChanges', 'exitIntent'], s)) out.push(REVIEW);
  return out.join(' ');
}

/** the scripted answer for a chip id or a typed question; assembled from state and engine outputs only */
function answer(q, state) {
  const s = state ?? M.state ?? {};
  const a = current(s);
  const text = String(q ?? '').trim();
  if (!text) return '';
  /* a chip's id is an answer's id whether or not this visitor's panel shows that chip */
  let id = CHIP_IDS.includes(text) ? text : null;
  if (!id) { const hit = RULES.find(([, re]) => re.test(text)); id = hit ? hit[0] : null; }
  const rank1 = steps()[0] ?? null;
  const p = M.planned;
  if (id === 'lastFive') {
    const t = topBin(s.lastFive);
    if (!t) return 'Mercer does not know that: the Best clients branch is still pale.';
    const chans = new Set(p?.channels ?? M.result?.channels ?? []);
    const runs = (BIN_ENGINE()[t.bin] ?? []).some((c) => chans.has(c));
    const who = a ? `${a.name.replace(/^The /, '')}s grow by ${a.grows}, so the next five most likely come the same way` : 'The next five most likely come the same way';
    /* the check is only that the engine's route list holds one of this bin's routes, so the sentence says "runs" and
       never "funds" or "puts spend on" (fix 3, C25) */
    return `${t.k} of your five came ${BIN_WORD[t.bin] ?? t.bin}. ${who}; Mercer’s forecast ${runs ? 'runs' : 'does not yet run'} that route.`;
  }
  if (id === 'routes') {
    /* the visitor's own five best clients come first; the type's lean is the second word, and is dropped when the two
       agree (fix 3, C12.2). A bin they could not name ranks nothing */
    const t = topBin(s.lastFive);
    const code = String(s.personality ?? '').toUpperCase();
    const letter = a && code ? (code[0] === 'E' ? 'E' : 'I') : null;
    const lean = letter === 'E' ? 'warm11' : letter === 'I' ? 'cold1m' : null;
    if (t && t.k >= 3 && t.bin !== 'unknown' && BIN_WORD[t.bin]) {
      const second = lean && lean !== t.bin ? ` Your type leans ${BIN_WORD[lean]}; run it second.` : '';
      return `${t.k} of your five came ${BIN_WORD[t.bin]}. Put ${BIN_WORD[t.bin]} first.${second}`;
    }
    if (!lean) return 'Answer the four either-ors first.';
    const first = strip(typeof M.letterMeans === 'function' ? M.letterMeans(letter) : '');
    return `${first ? `${first}. ` : ''}Put ${BIN_WORD[lean]} first.`;
  }
  if (id === 'example') {
    if (!a) return 'Answer the four either-ors to name your agent.';
    const ex = a.examples[0];
    /* the step is named by its rank, with no £ claim beside it (fix 3, C13.4, D3) */
    const num = rank1 ? ` With your numbers: Return rank 1 is ${rank1.title}.` : '';
    return `${ex.who}, ${ex.company}: ${ex.did}${num}`;
  }
  if (id === 'restraint') {
    const l = limit();
    if (!p) return 'Mercer does not know that yet: the forecast has not run.';
    if (!l) return 'Nothing limits growth inside a year.';
    const lift = l.lever ? ` The step that lifts it: ${l.lever}.` : '';
    /* the limit in the card's own words (M.canopy.limit().words), never the engine's raw statement (fix 3, C22, D2);
       until canopy.js supplies them, app.js's clause for the same limit, and last the limit's name */
    const clause = (() => { try { return M.limitClause?.(l.type, { month: l.month ?? null, first: !l.month }) || null; } catch (e) { return null; } })();
    return `First limit: ${strip(l.words || l.plain || clause || l.name)}.${lift}`; // || not ??: an empty string is no wording
  }
  if (id === 'topShare') {
    /* fix 2, item 12: a share of 0, an empty share and Not sure are all "not given"; the chip never answers with 0% or £0 */
    const share = Number(s.topShare);
    const unsure = (() => { try { return !!s.notSure?.has?.('topShare'); } catch (e) { return false; } })();
    if (unsure || s.topShare === null || s.topShare === undefined || !(Math.round(share) >= 1)) return 'You did not give your top three’s share.';
    const first = `Change first: ${rank1 ? rank1.title : 'the step with the highest return, once the plan has run'}`;
    /* the lost-client clause needs the visitor's revenue; without it the share and the step are said alone, never £0 */
    const lost = Number(s.now) > 0 ? (Number(s.now) * share) / 300 : 0;
    return `Your top three are ${Math.round(share)}% of revenue. ${first}${Math.round(lost) >= 1 ? `; a lost client is about ${gbp(lost)} a month` : ''}.`;
  }
  if (id === 'stop') return stopAnswer(s, a);
  if (id === 'decide') return decideAnswer(s, a);
  const hit = BRANCH_OF.find(([, re]) => re.test(text));
  /* a question about a figure the visitor gave is answered with it before Mercer says it does not know (fix 3, C12.3) */
  const held = figures(text, s, p);
  if (held) return held;
  const section = hit ? hit[0] : (M.canopy?.unfinished?.()?.[0] ?? 'ground');
  return `Mercer does not know that. The ${SECTION_NAME[section] ?? 'Ground'} branch is where it would live.`;
}

/** the figures a typed question names, as the briefing prints them (canopy.js briefing()), one number a sentence. Only a
    figure the visitor gave is said: one that is absent or marked Not sure stays "Mercer does not know that", and a
    question about one figure is never answered with another */
function figures(text, s, p) {
  if (!p) return '';
  const gave = (id) => { const v = s[id]; if (v === null || v === undefined || v === '') return false; try { return !s.notSure?.has?.(id); } catch (e) { return true; } };
  const ok = (x, floor = 0) => Number.isFinite(Number(x)) && Number(x) > floor;
  const n = (x) => (typeof M.count === 'function' ? M.count(x) : Math.round(Number(x)).toLocaleString('en-GB'));
  const unit = (() => { try { return M.unitWord?.('clients') ?? 'clients'; } catch (e) { return 'clients'; } })();
  const FIGURES = [
    [/\b(price|prices|pricing|fee|fees|sale value|charge)\b/i, () => (gave('price') && ok(p.acv) ? `Your sale value is ${gbp(p.acv)}.` : '')],
    [/\b(close rate|closing|convert|conversion)\b/i, () => (gave('closeRate') && ok(p.close) ? `Your close rate is ${Math.round(p.close * 100)}%.` : '')],
    [/\bmargins?\b/i, () => (gave('margin') && ok(p.margin) ? `Your margin is ${Math.round(p.margin * 100)}p in the pound.` : '')],
    [/\b(budget|growth spend|spend|spending)\b/i, () => (gave('budget') && ok(p.budget, 0.99) ? `Your growth spend is ${gbp(p.budget)} a month.` : '')],
    [/\bcapacity\b/i, () => (gave('capacity') && ok(p.capacity) ? `Your capacity is ${n(p.capacity)} ${unit} a month.` : '')],
    [/\b(prospect|prospects|market)\b/i, () => (gave('market') && ok(s.market) ? `You have ${n(s.market)} prospects.` : '')],
    [/\b(contacts|list)\b/i, () => (gave('listSize') && ok(s.listSize) ? `You have ${n(s.listSize)} contacts.` : '')],
  ];
  return FIGURES.filter(([re]) => re.test(text)).map(([, say]) => say()).filter(Boolean).join(' ');
}

/** the section a typed question would live on, or null: the table answer() falls back to */
const branchOf = (text) => BRANCH_OF.find(([, re]) => re.test(String(text ?? '')))?.[0] ?? null;

/* rebuild 1 (E49): the archetype is optional reflection. It is never an input to the forecast or to the plan's ranking:
   plan.js prints it as a labelled reading of the stated preference and nothing more. `reflectionOnly` says so to any
   reader; `forecastInput` is false and must stay false */
M.archetypes = { list: LIST, pick, current, chips, answer, BIN_WORD, article, branchOf, NO_TYPE, SECTION_NAME, FOUNDER_IDS, CONTROL_IDS, reflectionOnly: true, forecastInput: false, note: 'A reading of your stated preference. It moves no figure.' };
})();
