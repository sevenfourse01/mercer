/* questions.js (Mercer 12, owner (e) interview).

   Every question on one table: the section it belongs to, the limb it feeds, the state key
   it writes, the words over it (COPY §4) and the instrument that answers it (SPEC §5).
   app.js owns the flow (which question shows, when, and what happens on commit); this file
   owns what a question is and how it is answered. Each renderer builds one M.ui instrument,
   writes every sibling key itself, then calls M.commit(id, value, { fromEl }) with the
   primary value, so app.js can fly the leaf and run the engine.

   Exports (WORK 0.4): M.SCHEMA (every question, generic and custom), M.SCHEMA_BY, M.SCHEMA_KEYS,
   M.Q (the custom subset, by id), M.sectionQuestions, M.headline, M.explain, M.renderQuestion,
   M.renderSchema (v11 name), M.schemaWord (the leaf sentence for any id, COPY §6), M.schemaAnswered,
   M.schemaApplies, M.schemaAnswers, M.schemaPoints, M.driverAdapt, M.derive, M.answerWord, M.ukDate (when no other file has one).
   Refine 1: M.founderProfile(), M.controlProfile() ({ current, intended, risks[], actions[] }, built from answers alone),
   M.established() ({ year, month, years } or null), M.methodLine(id); the import step reads M.research (research.js).

   Read late from other files, each with a fallback here: M.plural (app.js), M.unitWord(fallback, n) (sectors.js),
   M.researchLive (research.js). Five instruments are handed a readout(value) for feel.js's <output class="ui-readout">.

   Nothing here states a figure the visitor did not give or the engine did not return; the sector
   priors reach a sentence only through M.typ(), which app.js opens after the question is passed. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer ?? {});
const S = () => M.state ?? (M.state = {});
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const gbp = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : `£${Math.round(Number(n) || 0).toLocaleString('en-GB')}`);
const count = (n) => (typeof M.count === 'function' ? M.count(n) : Math.round(Number(n) || 0).toLocaleString('en-GB'));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const given = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length);
const has = (k) => given(S()[k]);
const pct = (x) => `${Math.round(x * 100)}%`;
const one = (x) => x.toFixed(1).replace(/\.0$/, '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** "3 sales", "1 sale", "0.4 sales": app.js owns the rule (M.plural, read when the sentence is made); the same rule is kept
    here for a page that loads without it. The count is compared as printed, so 1.04 is "1 sale" and 1.3 is "1.3 sales" */
const pluralHere = (v, s, p) => { const c = count(v); return `${c} ${c === '1' ? s : p}`; };
const plural = (v, s, p) => (typeof M.plural === 'function' ? M.plural : pluralHere)(v, s, p);
/** the same for a figure printed to one decimal place ("1 month", "90.9 months") */
const pluralOne = (x, s, p) => { const c = one(x); return `${c} ${c === '1' ? s : p}`; };
/** a source's date as people write it, 16 September 2026, the same day in every time zone; an unreadable date prints as it came */
const ukDate = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return Number.isNaN(+d) ? String(iso ?? '') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const YEAR = () => new Date().getFullYear();
const MONTH_NAME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const doingList = () => S().doing ?? [];
const triedList = () => S().tried ?? [];
const usedList = () => [...doingList(), ...triedList()];
const isContent = (id) => id.startsWith('org-') || ['newsletter', 'podcast', 'webinar', 'case-studies', 'internal-social', 'seo'].includes(id);
const isAds = (id) => id.startsWith('ads-') || id === 'retargeting';
const solo = () => S().teamSize === 1 || S().who === 1;
const derivedMap = () => (S().derived ??= {});
const ownAnswer = (key) => given(S()[key]) && derivedMap()[key] === undefined;
/** how long a customer stays, from whichever question the visitor answered */
const stayMonths = () => (given(S().retainerMonths) ? Math.max(1, S().retainerMonths) : given(S().retention) ? S().retention : null);
const sectorWord = () => String(M.sectorWord?.(S().sector) ?? 'your industry').toLowerCase();
/** the trade's word for one unit of work; hand it the count and one of them comes back singular ("1 job", "1 night booked") */
const unitWord = (n) => (typeof M.unitWord === 'function' ? M.unitWord(undefined, n) : 'clients');
const distName = (id) => M.DIST_BY?.[id]?.name ?? id;
const chanName = (e) => M.CHANNEL_NAME?.[e] ?? e;
const macroRow = (id) => { try { return M.macro?.byId?.(id) ?? null; } catch (e) { return null; } };
/** the sector prior, readable only once app.js has opened it (after the question is passed) */
const typ = (k) => { try { const v = M.typ?.(k); return isNum(v) ? v : null; } catch (e) { return null; } };
/** a list in words; where an item holds an 'and' of its own, a comma goes before the last one ("numbers and admin, and marketing") */
const listWords = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')}${xs.some((x) => / and /.test(String(x))) ? ',' : ''} and ${xs[xs.length - 1]}`);

/* ------------------------------------------------------------------ fixed vocabularies */
const CYCLE_OPTS = [[1, 'Same day'], [4, 'Within a week'], [18, 'One to four weeks'], [60, 'One to three months'], [135, 'Three to six months'], [240, 'Over six months']];
const cycleWord = (d) => (typeof M.cycleWord === 'function' ? M.cycleWord(d) : (CYCLE_OPTS.find(([v]) => v === d) ?? [null, `${d} days`])[1]);
const SKILLS = [['selling', 'Selling'], ['delivering', 'Delivering the work'], ['marketing', 'Marketing'], ['building', 'Building the product'], ['numbers', 'Numbers and admin'], ['people', 'Managing people']];
const WINS = [['income', 'A bigger income'], ['time', 'My time back'], ['sell', 'A business I can sell'], ['lasts', 'A business that outlasts me'], ['beat', 'Beating a competitor']];
const RISK = [['none', 'None: it pays as it goes'], ['some', 'Some, with a good case'], ['lots', 'A lot']];
const WHO = [[1, 'Only me'], [2, 'Me and one or two'], [6, 'Three to ten'], [12, 'Over ten']];
const WENT = [['worked', 'Worked'], ['mixed', 'Mixed'], ['flop', 'No result']];
const FUNDING = [['profit', 'Profit'], ['savings', 'Savings'], ['loan', 'A loan or facility'], ['grant', 'A grant'], ['investor', 'An investor'], ['none', 'None yet']];
/* the founder questions (R17) */
const ENERGY = [...SKILLS, ['strategy', 'Setting direction']];
const AVOIDED = [['invoicing', 'Invoicing and chasing payment'], ['followup', 'Following up enquiries'], ['marketing', 'Marketing'], ['pricing', 'Raising prices'], ['hiring', 'Hiring'], ['talks', 'Hard conversations'], ['planning', 'Planning ahead'], ['admin', 'Admin and records'], ['none', 'Nothing']];
const DELEGATION = [['none', 'I do it all myself'], ['checks', 'I hand work over, then check all of it'], ['outcomes', 'I hand over the result I want and check that'], ['full', 'Others run whole areas without me']];
const SPEED_AXES = [
  { a: 'F', b: 'S', aq: 'I decide fast and adjust later', bq: 'I decide once the facts are in' },
  { a: 'K', b: 'R', aq: 'A decision stays made', bq: 'I reopen decisions' },
];
const SPEED_WORD = { F: 'you decide fast and adjust later', S: 'you decide once the facts are in', K: 'a decision stays made', R: 'you reopen decisions' };
const FUTURE_ROLE = [['same', 'The same role as now'], ['lead', 'Lead only, out of the day to day'], ['back', 'Step back: part time, or chair'], ['exit', 'Leave the business']];
/* the control questions (R18). 'sole' is the id app.js reads as owning alone */
const OWNERSHIP = [['sole', 'You alone'], ['partners', 'With partners'], ['investors', 'With investors'], ['family', 'With family']];
const PROFIT_SHARE = [['same', 'In line with ownership'], ['more', 'You take more than your share'], ['less', 'You take less than your share'], ['unset', 'Not agreed']];
const DECISIONS = [['pricing', 'Pricing'], ['hiring', 'Hiring'], ['spending', 'Spending'], ['strategy', 'Strategy'], ['clientWork', 'Client work']];
const HOLDERS = [['you', 'You decide'], ['shared', 'Shared'], ['team', 'The team decides']];
const PLANNED = [['leader', 'Hire a leader'], ['partner', 'Bring in a partner'], ['investor', 'Take on an investor'], ['successor', 'Name a successor'], ['none', 'None planned']];
const EXIT = [['keep', 'Keep it for good'], ['sale', 'Sell it'], ['succession', 'Hand it on'], ['investment', 'Bring in investment'], ['undecided', 'Undecided']];
const sharedOwner = () => ['partners', 'investors', 'family'].includes(S().ownership);
const BINS = [['warm11', 'Warm 1-1'], ['warm1m', 'Warm 1-many'], ['cold11', 'Cold 1-1'], ['cold1m', 'Cold 1-many'], ['unknown', 'Can’t say']];
const APPETITE = [['none', 'None'], ['boutique', 'Small'], ['moderate', 'Moderate'], ['aggressive', 'Aggressive'], ['maximum', 'Maximum']];
const ENGINE_ORDER = ['referral', 'content-seo', 'linkedin', 'cold-email', 'paid-search', 'paid-social', 'partnerships', 'cold-calling'];
/* the routes table, SPEC §5, kept here as the fallback for app.js's M.QUADRANT; the order inside a
   shelf is an estimate of how many people know each method (most familiar first) */
const QUADRANT = {
  warm11: ['referrals', 'reactivation', 'network', 'suppliers', 'resellers', 'introducers', 'piggyback', 'affiliate', 'customer-referral', 'white-label'],
  warm1m: ['internal-social', 'newsletter', 'events', 'chambers', 'workshops', 'host-meetup', 'case-studies', 'webinar', 'podcast', 'own-community', 'speaking', 'awards', 'sponsor-local'],
  cold11: ['cold-email', 'dm-linkedin', 'cold-call', 'dm-instagram', 'dm-facebook', 'whatsapp', 'canvassing', 'direct-mail', 'handwritten', 'dm-tiktok', 'sampling'],
  cold1m: ['org-facebook', 'org-instagram', 'ads-facebook', 'ads-search', 'seo', 'maps', 'org-linkedin', 'org-youtube', 'org-tiktok', 'reviews', 'directories', 'flyers', 'ads-instagram', 'local-media', 'retargeting', 'ads-linkedin', 'ads-youtube', 'ads-tiktok', 'creators', 'spon-newsletter', 'spon-podcast', 'trade-shows', 'conferences', 'marketplaces', 'comparison', 'pr', 'app-stores', 'free-tool', 'free-tier', 'geo', 'books', 'studies', 'org-x', 'ads-bing', 'ads-nextdoor', 'org-nextdoor', 'com-facebook', 'com-linkedin', 'com-reddit', 'com-instagram', 'com-discord', 'com-x', 'com-slack', 'com-skool', 'com-whop', 'com-mumsnet', 'franchise', 'investors'],
};
/** the quadrant table in use, with only the ids the catalogue holds */
function quadrant() {
  const src = M.QUADRANT ?? QUADRANT;
  const out = {};
  Object.keys(QUADRANT).forEach((bin) => { out[bin] = (src[bin] ?? []).filter((id) => !M.DIST_BY || M.DIST_BY[id]); });
  return out;
}
const SHELF_HEAD = { warm11: 'Warm, one to one', warm1m: 'Warm, one to many', cold11: 'Cold, one to one', cold1m: 'Cold, one to many' };
const COLD_CALL_LAW = 'Calling another business cold is lawful in the UK: screen the number against the TPS and CTPS first, say who you are, let your number show, and stop when asked. Calling consumers cold about pensions or claims is banned without their prior consent, so if that is your market, this route is closed.';
const COLD_EMAIL_LAW = 'Emailing a limited company cold is allowed under PECR; emailing a sole trader or a named person at home needs their consent.';
const shelfExplain = () => ({
  warm11: 'They already knew you, or someone who did, and you spoke to them one at a time.',
  warm1m: 'They already knew you and saw something many people saw.',
  cold11: `They had not heard of you and you reached them one at a time. ${COLD_CALL_LAW}${doingList().includes('cold-email') ? ` ${COLD_EMAIL_LAW}` : ''}`,
  cold1m: 'They had not heard of you and found you where many people look.',
});
/** the cold-call pill is hidden only where the law closes the route (consumers, pensions or claims) */
const coldCallHidden = () => S().buyer === 'consumer' && S().sector === 'finance';
/* the six sections of rebuild 1 (R2) and their hues; the old eleven stay as `legacy` on each entry for readers that
   still ask by the old ids (app.js's FALLBACK_Q, tree twigs, the results library) */
const SECTION_HUE = { aim: '--sec-crown', foundations: '--sec-ground', customers: '--sec-reach', delivery: '--sec-delivery', leverage: '--sec-you', plan: '--sec-crown',
  roots: '--sec-ground', offer: '--sec-offer', reach: '--sec-reach', routes: '--sec-routes', close: '--sec-close', money: '--sec-money', clients: '--sec-clients', you: '--sec-you', ground: '--sec-ground', control: '--sec-control', crown: '--sec-crown' };
/* D5 and Task 15: the business comes before its ambition on both routes. The wheel and the route order follow this list */
const ROUTE_SECTIONS = ['foundations', 'aim', 'customers', 'delivery', 'leverage', 'plan'];
const routeOf = () => (S().route === 'starter' ? 'starter' : 'owner');
const isStarter = () => routeOf() === 'starter';
const hueOf = (q) => {
  try { const own = M.sectionsFor?.(routeOf())?.find?.((s) => s.id === q.section)?.hue; if (own) return own; } catch (e) { /* app.js not there yet */ }
  return M.SECTION_BY?.[q.section]?.hue ?? M.SECTION_BY?.[q.legacy]?.hue ?? SECTION_HUE[q.section] ?? SECTION_HUE[q.legacy] ?? '--tint';
};

/* ---- rebuild 1 vocabularies: the owner bank's new questions (brief section 8) ---- */
/* Task 16: goals that fit any size of business. Revenue, profit and personal income are three different things and are
   never merged into one option. Nothing here is preselected, "my time back" is offered to whoever might want it rather
   than assumed, and expansion is worded so a business with twenty sites is not offered a second one. */
const WIN_OWNER = [
  ['revenue', 'Increase revenue'],
  ['profit', 'Improve profit'],
  ['growth', 'Expand reach or markets'],
  ['capacity', 'Increase capacity or efficiency'],
  ['predictable', 'Make performance more predictable'],
  ['dependence', 'Reduce dependence on particular people', () => !solo()],
  ['time', 'Get my own time back'],
  ['explore', 'Explore what is possible'],
  ['other', 'Another objective'],
];
const WIN_STARTER = [['income', 'An income from it'], ['independence', 'Independence'], ['meaning', 'Build something that matters to me'], ['explore', 'Explore what is possible']]; // the cockpit brief, 7.3: the amount and the timeframe are the next two questions, not a main-or-extra choice
/* Task 16: what must stay protected, at any size. A student's study time and a twenty-site operator's service levels
   are both here, each shown only where it can apply, and an unlisted constraint is always available. */
const PROTECTED = [
  ['income', 'My existing income', () => isStarter() || preLaunch() || !given(S().teamSize) || S().teamSize <= 3],
  ['family', 'Family or study time'],
  ['savings', 'Savings'],
  ['quality', 'The standard of the work', () => !isStarter()],
  ['margin', 'Margins', () => !isStarter() && !preLaunch()],
  ['jobs', 'The jobs of the people here', () => !isStarter() && !solo()],
  ['service', 'Service levels customers rely on', () => !isStarter() && !preLaunch()],
  ['control', 'Control of the business'],
  ['location', 'Where I live or work'],
  ['other', 'Something else'],
  ['none', 'Nothing in particular'],
];
const SELLS = [['oneoff', 'A one-off service'], ['ongoing', 'An ongoing service'], ['product', 'A product'], ['subscription', 'A subscription'], ['bookings', 'Bookings']];
const SELL_PATTERN = { oneoff: 'once', ongoing: 'retainer', product: 'repeat', subscription: 'retainer', bookings: 'repeat' };
/* Task 15: trading history in plain words. "Established" said nothing about how long; these three say it. */
const STAGE = [['pre', 'Not trading yet'], ['under', 'Trading for under a year'], ['year', 'Trading for a year or more']];
/* Task 15: the role, asked only where it changes what the plan may assume */
const ROLE = [['owner', 'Owner'], ['coowner', 'One of the owners'], ['director', 'Director or senior leader'], ['manager', 'Manager'], ['adviser', 'Adviser or consultant to it']];
/* Task 18: the observable fact that reveals whether delivery is the limit, in place of a guess about next month */
const TURNED_AWAY = [['no', 'No'], ['later', 'Started some of it later than they wanted'], ['yes', 'Turned work away'], ['unsure', 'Not sure']];
const PAY = [['perjob', 'Per job or order'], ['hourly', 'Hourly or daily'], ['retainer', 'A retainer'], ['subscription', 'A subscription'], ['commission', 'Commission']];
// the polish pack, 8: a period is a span of days back from today, never "a normal period"
const PERIODS = [['month', 'The last 30 days'], ['quarter', 'The last 90 days'], ['year', 'The last 12 months']];
const PERIOD_MONTHS = { month: 1, quarter: 3, year: 12 };
const BUYERS = [['consumer', 'Individuals'], ['micro', 'Small businesses'], ['mid', 'Mid-sized firms'], ['enterprise', 'Large companies'], ['public', 'Public sector or charities']];
const VALUED = [['margin', 'Good margin'], ['easy', 'Easy to serve'], ['repeat', 'Repeat work'], ['quick', 'Quick decisions'], ['enjoy', 'Enjoyable work'], ['referrals', 'Referrals']];
const FOUND_BY = [['referral', 'Referral'], ['search', 'Search'], ['social', 'Social or content'], ['outbound', 'We contacted them'], ['marketplace', 'A marketplace or directory'], ['walkin', 'Walked in'], ['partner', 'A partner'], ['other', 'Other']];
const FOUND_BIN = { referral: 'warm11', partner: 'warm11', social: 'warm1m', outbound: 'cold11', search: 'cold1m', marketplace: 'cold1m', walkin: 'cold1m', other: 'unknown' };
const EASE = [['easy', 'Easy'], ['mixed', 'Mixed'], ['hard', 'Hard']];
const TRIGGERS = [['urgent', 'A problem that cannot wait'], ['change', 'A change at their end'], ['recommended', 'Someone recommended us'], ['deadline', 'A date or deadline'], ['offer', 'A price or offer'], ['planned', 'A planned purchase'], ['other', 'Something else']];
const DECIDERS = [['owner', 'The owner'], ['manager', 'A manager'], ['household', 'The household'], ['procurement', 'Procurement or a team'], ['other', 'Someone else']];
/* the polish pack, 5: routes to buyers, with the examples a card shows when it is selected. The ids are the old ones so
   every reader keeps working; 'channels' is new (a route to build, not access that exists) */
const ACCESS = [['contacts', 'People I already know'], ['partners', 'Introductions through others'], ['community', 'Places buyers gather'], ['lists', 'Buyers I can find'], ['audience', 'People who already follow me'], ['channels', 'Channels I could test'], ['none', 'No clear route yet']];
const ACCESS_LINES = {
  contacts: (b2b) => (b2b ? 'Existing customers, colleagues, suppliers, people you have worked with' : 'Past customers, friends, neighbours, parents in the target group'),
  partners: () => 'Suppliers, partners, alumni, professional contacts who could introduce you',
  community: (b2b) => (b2b ? 'Trade associations, professional communities, events' : 'Community groups, clubs, events, school and faith networks'),
  lists: (b2b) => (b2b ? 'Directories, trade registers, public business listings: leads to research, not relationships' : 'Local listings and directories: leads to research, not relationships'),
  audience: () => 'A newsletter, a social audience, a community you run',
  channels: () => 'Direct outreach, search, local activity, partnerships, paid distribution: a route you could test, not one you have',
  none: () => 'Pick this only when none of the routes above exists or could be built',
};
/* the polish pack, 10.1: how easily capacity can change, in plain words (the elasticity stays an internal idea) */
const MORE_WORK = [['spare', 'With what I have now: there is spare capacity'], ['helper', 'With a helper, tool, supplier or partner I already have'], ['hire', 'Only by hiring, buying or building something first'], ['no', 'Not without quality or margin slipping']];
const LEAD_TIME = [['days', 'Days'], ['weeks', 'Weeks'], ['months', 'Months']];
const STOPS = [['price', 'Price'], ['trust', 'They do not know us yet'], ['timing', 'Timing'], ['unclear', 'The offer is unclear'], ['speed', 'A slow reply'], ['unsuitable', 'The wrong kind of enquiry'], ['range', 'A narrower range'], ['location', 'Distance'], ['unknown', 'I cannot tell']];
const REPEAT_BAND = [['often', 'Often'], ['sometimes', 'Sometimes'], ['oneoff', 'Usually one-off'], ['unknown', 'Not enough history']];
const DELIVERY = [['visit', 'Customers come to us'], ['travel', 'We go to them'], ['remote', 'Online or by phone'], ['shipped', 'Goods are shipped']];
/* the same four for feel's direction diagram, each carrying the line and the way the arrow points */
const DELIVERY_PATHS = [
  ['visit', 'Customers come to us', { line: 'They travel to you', dir: 'in' }],
  ['travel', 'We go to them', { line: 'You travel to them', dir: 'out' }],
  ['remote', 'Online or by phone', { line: 'Nobody travels', dir: 'both', dash: true }],
  ['shipped', 'Goods are shipped', { line: 'It goes to them', dir: 'out', parcel: true }],
];
const PROOF = [['reviews', 'Reviews'], ['cases', 'Case studies'], ['demos', 'Demonstrations'], ['credentials', 'Credentials'], ['referrals', 'Referrals'], ['none', 'None yet']];
const MORE_NEXT = [['yes', 'Yes'], ['changes', 'With some changes'], ['no', 'No']];
const RUNS_OUT = [['me', 'My time'], ['team', 'Team time'], ['skill', 'A specialist skill'], ['cash', 'Cash'], ['stock', 'Stock or equipment'], ['space', 'Premises'], ['demand', 'Demand'], ['nothing', 'We have room']];
const WEEK_GOES = [['delivering', 'Doing the work'], ['selling', 'Selling and quoting'], ['admin', 'Admin and invoicing'], ['marketing', 'Marketing'], ['managing', 'Managing people'], ['other', 'Other']];
const WORRY = [['sales', 'Sales'], ['delivery', 'Delivery'], ['cash', 'Cash'], ['control', 'Losing control']];
const HOLDUP = [['reply', 'Replying to enquiries'], ['quoting', 'Quotes and proposals'], ['scheduling', 'Booking and scheduling'], ['delivery', 'Doing the work'], ['invoicing', 'Invoicing and payment'], ['nowhere', 'Nowhere in particular'], ['other', 'Somewhere else']];
const TERMS = [['upfront', 'Before the work'], ['completion', 'Around delivery'], ['thirty', 'Within 30 days after'], ['sixty', '60 days or more after']];
const LIMITS = [['licences', 'Licences or regulation'], ['quality', 'A quality standard we keep'], ['contracts', 'Contracts we are tied to'], ['stock', 'Stock or supply'], ['location', 'Staying where we are'], ['cold', 'No cold outreach', () => !doingList().includes('cold-call') && !doingList().includes('cold-email')], ['ads', 'No paid ads', () => !doingList().some(isAds)], ['social', 'Not being on camera'], ['none', 'None']];
const NETWORK_KINDS = [['buyers', 'Possible buyers'], ['introducers', 'People who could introduce me'], ['specialists', 'Specialists'], ['collaborators', 'Collaborators'], ['community', 'Community leaders'], ['none', 'No one comes to mind']];
const NETWORK_STRENGTH = [['close', 'Would help this week'], ['warm', 'Would take a call'], ['distant', 'Know of me, no more']];
const ASKED_HELP = [['notyet', 'Not yet'], ['waiting', 'Asked, waiting'], ['helping', 'Helping already'], ['unavailable', 'Asked, not available']];
const DECIDES = [['me', 'Me'], ['shared', 'Shared with others'], ['someone', 'Someone else']];
const CHANGE_ROLES = [['keep', 'Keep them as they are'], ['delegate', 'Delegate some'], ['hire', 'Hire for some'], ['partner', 'Bring in a partner'], ['clarify', 'Make them clearer']];
const DETAIL = [['refine', 'Sharpen my plan'], ['plan', 'Use the first-pass plan']];
/* ---- the starter bank (brief section 9) ---- */
const N01 = [['studying', 'Studying'], ['employed', 'Employed'], ['selfemployed', 'Self-employed'], ['between', 'Between roles'], ['caring', 'Caring for someone'], ['other', 'Something else']];
const N03_BANDS = [['under 1', 'Under 1'], ['1-3', '1 to 3'], ['4-7', '4 to 7'], ['8-15', '8 to 15'], ['16-25', '16 to 25'], ['26+', '26 or more']]; // the cockpit brief, 3.3: hours available each week
const N03_PATTERN = [['predictable', 'Predictable'], ['variable', 'Variable']];
const N04 = [['weekdays', 'Weekdays'], ['evenings', 'Evenings'], ['weekends', 'Weekends'], ['flexible', 'Flexible']];
const N07 = [['soon', 'Soon'], ['months', 'Within a few months'], ['longer', 'I can build for longer']];
const N10 = [['writing', 'Writing'], ['talking', 'Talking to people'], ['organising', 'Organising'], ['numbers', 'Numbers'], ['making', 'Making things'], ['fixing', 'Fixing things'], ['teaching', 'Teaching'], ['design', 'Design'], ['tech', 'Software or tech'], ['selling', 'Selling'], ['caring', 'Caring for people'], ['cooking', 'Cooking'], ['other', 'Something else']];
const N13 = [['calls', 'Phone calls'], ['content', 'Public content'], ['travel', 'Travel'], ['build', 'Technical build'], ['stock', 'Holding stock'], ['people', 'Managing people'], ['writing', 'Writing'], ['teaching', 'Teaching'], ['selling', 'Selling'], ['admin', 'Admin']];
const N15 = [['selling', 'Selling'], ['bookkeeping', 'Bookkeeping'], ['tool', 'A tool or software'], ['trade', 'A trade skill'], ['marketing', 'Marketing'], ['none', 'Nothing new for now']];
const N16 = [['laptop', 'A laptop'], ['phone', 'A phone'], ['car', 'A car or van'], ['space', 'A workshop or space'], ['software', 'Software subscriptions'], ['camera', 'A camera'], ['equipment', 'Specialist equipment'], ['none', 'None of these']];
const N17 = [['qualification', 'A qualification or licence'], ['language', 'A second language'], ['network', 'Access to a workplace or network'], ['data', 'Specialist software or data'], ['none', 'None of these']];
const N18 = [['local', 'Locally'], ['remote', 'Remotely'], ['either', 'Either']];
const N19 = [['owners', 'Small business owners'], ['trades', 'Tradespeople'], ['parents', 'Parents'], ['students', 'Students'], ['older', 'Older people'], ['landlords', 'Landlords'], ['office', 'Office workers'], ['shops', 'Shops and cafés'], ['charities', 'Charities'], ['former', 'People in my former line of work'], ['other', 'Another group']];
const N20 = [['reliable', 'Finding someone reliable'], ['paperwork', 'Paperwork and admin'], ['time', 'No time for something they must do'], ['cost', 'Paying too much for something'], ['tech', 'Technology they cannot make work'], ['know', 'Not knowing what to charge or choose'], ['other', 'Something else']];
/* the cockpit brief, 7.5: the route to the buyers, then how many of them in the next seven days. Total contacts, reachable
   buyers and evidence of demand are kept apart; a five-hundred-name address book is not five hundred prospects. */
// the polish pack, 5: the same routes for a starter; 'lists' is findable buyers (research leads), 'channels' a route to build
const N21 = [['direct', 'People I already know'], ['via', 'Introductions through others'], ['gather', 'Places buyers gather'], ['lists', 'Buyers I can find'], ['audience', 'People who already follow me'], ['channels', 'Channels I could test'], ['find', 'None of these yet']];
const N21_LINES = { direct: 'Friends, former colleagues, parents or customers in the group you named', via: 'People who could introduce you to a buyer', gather: 'Groups, associations, events or communities where those buyers meet', lists: 'Directories, local listings, public business listings: leads to research, not relationships', audience: 'A newsletter, a social audience, a community you run', channels: 'Direct outreach, search, local activity, partnerships: a route to test, not access you have', find: 'Nobody reachable yet; the plan starts by finding two people' };
const N21_COUNT = [['0', '0'], ['1-5', '1 to 5'], ['6-20', '6 to 20'], ['21-50', '21 to 50'], ['51+', '51 or more']];
const N22 = [['none', 'No audience yet'], ['social', 'Social media followers'], ['newsletter', 'A newsletter or list'], ['community', 'A group or community I run'], ['customers', 'Past customers or clients']];
const N23 = [['introducer', 'Someone who could introduce me'], ['collaborator', 'A collaborator'], ['specialist', 'A specialist'], ['mentor', 'A mentor'], ['none', 'No one yet']];
const N24 = [['notasked', 'Not asked yet'], ['asked', 'Asked, waiting'], ['helping', 'Helping already'], ['unavailable', 'Not available']];
const N25 = [['yes', 'Yes'], ['no', 'Not yet']];
const N26 = [['no', 'No'], ['researched', 'Researched it'], ['built', 'Built something'], ['offered', 'Offered it'], ['sold', 'Sold it']];
/* results 1, D9: the starter's opening branch and the follow-ups each start needs. Short labels; the branch asks only what
   changes the plan, and Not sure stays available on every one of them through the flow's own control */
const START_POINT = [['none', 'No idea yet'], ['few', 'A few ideas'], ['one', 'One idea'], ['tried', 'Already tried something']];
const S04 = [['nobody', 'Nobody yet'], ['asked', 'Someone asked'], ['paidonce', 'Paid once'], ['paidmore', 'Paid more than once']];
const S05 = [['yes', 'Yes'], ['help', 'With help'], ['notyet', 'Not yet']];
const S11 = [['friends', 'Friends and contacts'], ['social', 'Social media'], ['ads', 'Ads'], ['marketplace', 'A marketplace'], ['inperson', 'In person'], ['other', 'Another way']];
const S12 = [['noreplies', 'No replies'], ['replies', 'Replies, no sales'], ['fewsales', 'A few sales'], ['stopped', 'Sales, then it stopped']];
const N28 = [['cost', 'The cost'], ['selling', 'The selling'], ['skills', 'The skills it needs'], ['interest', 'It does not interest me'], ['access', 'Reaching those buyers'], ['risk', 'The risk'], ['other', 'Something else']];
const N29 = [['alone', 'Alone'], ['with', 'With someone'], ['either', 'Either']];
const N30 = [['accountability', 'Accountability'], ['technical', 'Technical skills'], ['buyers', 'Access to buyers'], ['sales', 'Help selling'], ['sector', 'Sector expertise']];
const N32 = [['piece', 'A one-off piece of work'], ['monthly', 'A monthly service'], ['session', 'A workshop or session'], ['product', 'A product'], ['other', 'Something else']];
const N33 = [['asked', 'Someone asked me for it'], ['spending', 'They already pay for something like it'], ['conversations', 'Conversations with a few of them'], ['source', 'A report or source I can name'], ['assumption', 'An assumption so far']];
const N34 = [['conversation', 'Conversations'], ['sample', 'A sample or demo'], ['pilot', 'A paid pilot'], ['manual', 'Doing it by hand for one customer'], ['other', 'Something else']];
const N35 = [['yes', 'Yes'], ['gap', 'With a specific gap'], ['unsure', 'Not sure']];
const N36 = [['hours', 'Hours'], ['materials', 'Materials'], ['tools', 'Tools or software'], ['support', 'Help from someone'], ['space', 'A space']];
const N38 = [['warm', 'People I know'], ['intros', 'Introductions'], ['local', 'Local outreach'], ['communities', 'Online communities'], ['direct', 'Direct outreach'], ['other', 'Something else']];
const N39 = [['first', 'A first paying customer'], ['three', 'Three people say yes'], ['replies', 'Replies from most people I contact'], ['other', 'Something else']];
const N40 = [['budget', 'The test budget is spent'], ['weeks', 'A set number of weeks'], ['silence', 'No interest after the conversations'], ['other', 'Something else']];
const N41 = [['none', 'None needed'], ['licence', 'A licence or registration'], ['insurance', 'Insurance'], ['qualification', 'A qualification'], ['unsure', 'Not sure']];
const N42 = [['page', 'An offer page'], ['sample', 'A sample'], ['booking', 'A booking flow'], ['proposal', 'A proposal'], ['prototype', 'A product prototype'], ['other', 'Something else']];
const N44 = [['intros', 'Introductions'], ['tma', 'TMA help'], ['none', 'Neither for now']];
/* ---- final 1, Task 11: the discovery prompts. Concrete questions, selected rather than all asked ---- */
// the polish pack, 11: concrete, parallel options (what the day is spent doing), not abstract opposites
const WORK_STYLE = [['teaching', 'Teaching people something'], ['making', 'Making things, by hand or on screen'], ['advising', 'Advising people on a decision'], ['organising', 'Organising people and plans'], ['competing', 'Competing to win work'], ['researching', 'Researching and working things out'], ['selling', 'Selling and persuading'], ['other', 'Something else']];
const PAID_BEFORE = [['paid', 'Yes, I was paid'], ['unpaid', 'Yes, but not for money'], ['no', 'Not yet']];
/* ---- final 1, Task 15: location and currency, both searchable, both known before anything geographic or priced ---- */
const countryList = () => (Array.isArray(M.COUNTRIES) ? M.COUNTRIES : [{ code: 'GB', name: 'United Kingdom', currency: 'GBP' }]);
const currencyList = () => (Array.isArray(M.CURRENCIES) ? M.CURRENCIES : [{ code: 'GBP', symbol: '£', name: 'Pound sterling' }]);
const currencyName = (code) => { const c = M.CURRENCY_BY?.[code] ?? currencyList().find((x) => x.code === code); return c ? `${c.symbol} ${c.code}` : String(code ?? ''); };
const countryName = (code) => (M.COUNTRY_BY?.[code] ?? countryList().find((x) => x.code === code))?.name ?? String(code ?? '');
const searchCountries = (qy, n = 8) => (typeof M.searchCountries === 'function' ? M.searchCountries(qy, n) : countryList().filter((c) => c.name.toLowerCase().includes(String(qy).toLowerCase())).slice(0, n));
const searchCurrencies = (qy, n = 8) => (typeof M.searchCurrencies === 'function' ? M.searchCurrencies(qy, n) : currencyList().filter((c) => c.code.toLowerCase().includes(String(qy).toLowerCase())).slice(0, n));
/** the currencies offered without searching: the one the chosen country trades in, then the three most often named */
const quickCurrencies = () => {
  const sug = M.currencyOfCountry?.(S().country);
  const ids = [...new Set([sug, 'GBP', 'EUR', 'USD'].filter(Boolean))].slice(0, 4);
  return [...ids.map((code) => [code, currencyName(code)]), ['other', 'Other currency']];
};
/* ---- final 1, Task 17: routes whose next move depends on how much of it the business does ---- */
const VOLUME_OF = {
  'dm-linkedin': ['LinkedIn messages or notes you send', 'a week'], 'cold-email': ['cold emails you send', 'a week'],
  'cold-call': ['cold calls you make', 'a week'], 'dm-instagram': ['Instagram messages you send', 'a week'],
  'dm-facebook': ['Facebook messages you send', 'a week'], 'dm-tiktok': ['TikTok messages you send', 'a week'],
  whatsapp: ['WhatsApp messages you send', 'a week'], canvassing: ['doors you knock on', 'a week'],
  'direct-mail': ['letters you post', 'a month'], handwritten: ['letters you write', 'a month'],
  referrals: ['people you ask for a referral', 'a month'], network: ['networking conversations you have', 'a month'],
  reactivation: ['past customers you get back in touch with', 'a month'], events: ['events you go to', 'a month'],
  newsletter: ['emails you send your list', 'a month'], workshops: ['workshops you run', 'a month'],
  speaking: ['talks you give', 'a month'], 'host-meetup': ['meet-ups you host', 'a month'],
};
/** the count a route's next move depends on: its own words, or posts a week for a content route */
const volumeAsk = (id) => VOLUME_OF[id] ?? (isContent(id) ? [`posts you publish on ${distName(id)}`, 'a week'] : null);
/* problems a group is often seen to face: suggestions for N20, in the group's own words, never a claim about them */
const PROBLEMS_OF = { owners: ['paperwork', 'time', 'reliable', 'tech'], trades: ['paperwork', 'reliable', 'know'], parents: ['time', 'reliable', 'cost'], students: ['cost', 'know'], older: ['tech', 'reliable'], landlords: ['reliable', 'paperwork', 'cost'], office: ['time', 'tech'], shops: ['reliable', 'tech', 'cost'], charities: ['paperwork', 'cost', 'tech'], former: ['time', 'reliable', 'know'] };

/* ------------------------------------------------------------------ the registry (R5): one table for both routes */
/* Every entry: id, route (which routes ask it), section (one of the six of R2), legacy (the old section, for readers
   that still ask by it), control (the instrument), when(state) (asked only while true: routing omits, nothing is
   marked N/A), affects (what the answer can change), satisfiedBy (answers or import fields that make it unnecessary),
   unit, unknownOk (Not sure records unknown), invalidates (what goes stale after an edit), tier (1 needed for the
   first plan, 2 sharpens the recommendation, 3 refinement or reflection), effort (low, mid, high). type = a generic
   instrument, kind = a hand-built renderer. opts are [value, label, applies?]. `on` names the screen an entry rides
   on: it is drawn inside that screen and never asked on its own. key is the state key M.commit sets; keys lists every
   sibling the renderer writes itself. The order within a section is the ask order. */
const rw = () => S().repeatWork;
const stage = () => S().bizStage;
const preLaunch = () => stage() === 'pre';
/* Task 15's wording replaced 'first customers' and 'established' with how long the business has been trading. An older
   save, and another owner's fixture, still hold the old words: both are read as the same thing and nothing is discarded */
const tradingYear = () => stage() === 'year' || stage() === 'established';
const delivers = (m) => (S().deliveryMode ?? []).includes(m);
const onSite = () => delivers('visit') || delivers('travel');
const b2b = () => ['micro', 'mid', 'enterprise', 'public'].includes(S().buyer);
const repeatBranch = () => ['often', 'sometimes'].includes(S().repeatBand);
const helpsMe = () => given(S().help) && S().help !== 'alone';
const networkKinds = () => (S().networkKinds ?? []).filter((k) => k !== 'none');
const direction = () => { const d = S().direction; return d && typeof d === 'object' ? d : null; };
const dirNeeds = (k) => Boolean(direction()?.[k]);
const hoursTight = () => isNum(S().n03) && S().n03 < 10;
const idea = () => S().n25 === 'yes';
/* results 1, D9: the opening branch. n25 and n26 are derived from it (derive), so idea() keeps reading as before */
const startsAt = (...k) => k.includes(S().startPoint ?? null);
/** the few ideas as typed, one line each, in order; the ids are positions, so a line can be edited without losing a pick */
const ideas = () => (Array.isArray(S().s06) ? S().s06 : []).map((t) => String(t ?? '').trim()).filter(Boolean).slice(0, 3).map((text, i) => ({ id: `i${i}`, text }));
const ideaText = (id) => ideas().find((x) => x.id === id)?.text ?? '';
/** the ideas that still stand after s08 (someone asked or paid) and s09 (deliverable this month): the ones either named,
    or all of them while neither named one. Two or more standing is what earns the tie-breaker (s07) */
const standingIdeas = () => {
  const all = ideas();
  const picks = [...new Set([S().s08, S().s09].filter((v) => given(v) && v !== 'none' && all.some((x) => x.id === v)))];
  return picks.length ? all.filter((x) => picks.includes(x.id)) : all;
};
/** the one idea of the few that the comparison settled on: the only one standing, or the tie-breaker's pick */
const chosenIdea = () => { const s = standingIdeas(); if (s.length === 1) return s[0]; const t = S().s07; return s.find((x) => x.id === t) ?? null; };
/** the visitor's own idea in their words, whichever start put it there: the line under One idea, the chosen one of the few, or what they tried */
const ownIdeaText = () => { const st = S(); if (startsAt('few')) return chosenIdea()?.text ?? ''; if (startsAt('tried')) return String(st.s10 ?? ''); return String(st.n25Text ?? ''); };
const skillsPicked = () => (S().n10 ?? []).filter((x) => x !== 'other');
/** the selected route whose next move depends on how much of it the business does: the highest ranked one with an ask */
const volumeRoute = () => {
  const ranked = Array.isArray(S().channelRank) ? S().channelRank : [];
  return [...ranked, ...doingList()].find((id) => doingList().includes(id) && volumeAsk(id)) ?? null;
};
/** evidence the visitor has already given about themselves: each piece counts once, and the prompts stop when enough is held */
const advEvidence = () => {
  const st = S();
  return {
    paid: st.paidBefore === 'paid', helped: st.paidBefore === 'unpaid',
    proven: (st.n11 ?? []).length > 0 || given(st.n11Example), asked: (st.n12 ?? []).filter((x) => x !== 'none').length > 0,
    skills: skillsPicked().length > 0, buyers: (st.n19 ?? []).filter((x) => x !== 'other').length > 0 || given(st.n19Other),
    access: (given(st.n21) && st.n21 !== 'find') || (given(st.n22) && st.n22 !== 'none'),
    tools: (st.n16 ?? []).filter((x) => x !== 'none').length > 0 || (st.n17 ?? []).filter((x) => x !== 'none').length > 0,
    helper: (st.n23 ?? []).filter((x) => x !== 'none').length > 0, interest: given(st.interest) || (st.n13 ?? []).length > 0,
    depth: given(st.bestAt), style: given(st.workStyle), words: given(st.n09) || given(st.cv),
  };
};
const evidenceCount = () => Object.values(advEvidence()).filter(Boolean).length;
const O = ['owner'], N = ['starter'], B = ['owner', 'starter'];
const ALL = [
  /* ================= aim (both routes): what to change, the target, what stays protected =================
     Task 15 and D5: the business comes first on both routes, so `foundations` leads and `aim` follows it. Location and
     currency moved with it: nothing geographic, priced or budgeted is asked before they are known. */
  { id: 'win', route: B, section: 'aim', legacy: 'you', driver: 'roots', kind: 'win', key: 'win', keys: ['winOther'],
    get opts() { return isStarter() ? [...WIN_STARTER, ['other', 'Another objective']] : WIN_OWNER; },
    tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['plan'] },
  { id: 'goal', route: B, section: 'aim', legacy: 'roots', driver: 'roots', kind: 'goal', key: 'goal', keys: ['appetite', 'basis', 'goalMode', 'months', 'milestone'], unit: 'a month', unsure: 'Not sure', tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], invalidates: ['plan'] },
  { id: 'appetite', route: B, section: 'aim', legacy: 'roots', driver: 'roots', kind: 'appetite', key: 'appetite', keys: ['basis', 'goalMode'], on: 'goal', hidden: true, unsure: 'Not sure', tier: 2, affects: ['scenario', 'plan'] },
  { id: 'months', route: B, section: 'aim', legacy: 'roots', driver: 'roots', kind: 'months', key: 'months', on: 'goal', hidden: true, unit: 'months', unsure: 'Not sure', tier: 1, affects: ['scenario', 'plan'], invalidates: ['plan'] },
  { id: 'protected', route: B, section: 'aim', legacy: 'ground', driver: 'roots', type: 'multi', key: 'protected', opts: PROTECTED, when: () => false, tier: 3, /* the cockpit brief, 7.3: never asked; the field stays readable for older saves */ affects: ['action', 'plan'], invalidates: ['plan'] },

  /* ================= foundations, owner: what the business is, where it trades, and its baseline ================= */
  { id: 'biz', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'biz', key: 'biz', keys: ['site'], unsure: 'Skip', when: () => !given(S().biz) || !given(S().site), tier: 2, affects: ['brief'] },
  { id: 'place', route: B, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'place', key: 'place', keys: ['country', 'currency'], unsure: 'Skip', tier: 1, affects: ['map', 'brief'], satisfiedBy: ['import:market'], invalidates: ['currency', 'radius'] },
  { id: 'currency', route: B, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'currency', key: 'currency', on: 'place', hidden: true, context: true, tier: 1, affects: ['brief'] },
  { id: 'import', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'import', key: 'site', keys: ['imported'], optional: true, unsure: 'Skip', tier: 2, affects: ['evidence'] },
  { id: 'sector', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'sector', key: 'sector', keys: ['niche', 'trade', 'does'], engine: 'industry', unsure: 'Not sure', tier: 1, affects: ['scenario', 'finding', 'plan'], satisfiedBy: ['import:offer'], invalidates: ['segment', 'plan'] },
  { id: 'repeatWork', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', kind: 'sells', key: 'repeatWork', keys: ['sells', 'sellsPrimary'], tier: 1, affects: ['scenario', 'finding', 'plan'], invalidates: ['price', 'retainer', 'repeat', 'stay', 'plan'] },
  { id: 'stage', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', type: 'presets', key: 'bizStage', opts: STAGE, tier: 2, affects: ['finding', 'plan'], invalidates: ['now', 'bestWorst', 'volume', 'yearsTrading', 'role', 'plan'] },
  { id: 'role', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', type: 'presets', key: 'role', opts: ROLE, unsure: 'Skip', when: () => tradingYear(), tier: 2, affects: ['action', 'plan'], invalidates: ['decisionRights'] },
  { id: 'payModel', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', type: 'multi', key: 'payModel', opts: PAY, tier: 2, affects: ['scenario', 'brief'], invalidates: ['price', 'retainer'] },
  { id: 'now', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'now', key: 'now', engine: 'now', unit: 'a month', zero: true, unsure: 'Not sure', when: () => !preLaunch(), tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], satisfiedBy: ['import:now'], invalidates: ['plan'] },
  { id: 'season', route: O, section: 'foundations', legacy: 'reach', driver: 'demand', type: 'presets', key: 'season', opts: [['steady', 'Fairly steady'], ['summer', 'Peaks in summer'], ['winter', 'Peaks in winter'], ['lumpy', 'Unpredictable']], when: () => !preLaunch(), tier: 2, affects: ['finding', 'plan'], invalidates: ['bestWorst', 'yearsTrading'] },
  { id: 'bestWorst', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', type: 'pair', key: 'bestWorst', labels: ['Best month', 'Worst month'], order: 'desc', money: true, unsure: 'Not sure', when: () => !preLaunch() && given(S().season) && S().season !== 'steady' && isNum(S().now) && S().now > 0, tier: 2, affects: ['scenario', 'finding'] },
  { id: 'price', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', kind: 'price', key: 'price', engine: 'acv', unit: 'a sale', unsure: 'Mercer’s estimate', when: () => rw() !== 'retainer', tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], satisfiedBy: ['import:price'], invalidates: ['margin', 'plan'] },
  { id: 'retainer', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', kind: 'retainer', key: 'retainerValue', keys: ['retainerMin', 'retainerMax', 'priceSpread', 'price'], engine: 'acv', unit: 'a month', unsure: 'Mercer’s estimate', when: () => rw() === 'retainer', tier: 2, affects: ['scenario', 'tree', 'finding', 'plan'], invalidates: ['margin', 'plan'] },
  { id: 'margin', route: O, section: 'foundations', legacy: 'money', driver: 'margin', kind: 'margin', key: 'margin', engine: 'grossMargin', unit: 'in the £1', unsure: 'Mercer’s estimate', when: () => !preLaunch() || given(S().price), tier: 2, affects: ['scenario', 'tree', 'finding', 'plan'], satisfiedBy: ['import:margin'], invalidates: ['plan'] },
  { id: 'volume', route: O, section: 'foundations', legacy: 'delivery', driver: 'capacity', kind: 'volume', key: 'volume', keys: ['volumePeriod', 'volumeMonthly'], unsure: 'Not sure', when: () => !preLaunch(), tier: 2, affects: ['finding', 'scenario'], invalidates: ['plan'] },
  { id: 'yearsTrading', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'established', type: 'year', key: 'yearsTrading', keys: ['estMonth'], unsure: 'Skip', when: () => tradingYear(), tier: 2, affects: ['brief'], satisfiedBy: ['import:founded'] },
  { id: 'site', route: O, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'import', key: 'site', hidden: true, optional: true, unsure: 'Skip', tier: 3, affects: ['evidence'] },
  // refinement (tier 3): asked under Refine the uncertain parts, never on the first pass
  { id: 'priceSpread', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', type: 'presets', key: 'priceSpread', opts: [['fixed', 'About the same'], ['some', 'Up to a quarter apart'], ['wide', 'Two to three times'], ['huge', 'Ten times or more']], when: () => rw() !== 'retainer' && !S().priceMix && ownAnswer('price'), tier: 3, affects: ['scenario'] },
  { id: 'included', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', type: 'text', key: 'included', placeholder: 'the first call, the work itself and a written handover', tier: 3, affects: ['brief'] },
  { id: 'upsell', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', type: 'presets', key: 'upsell', opts: [['yes', 'We offer them'], ['could', 'We could, but don’t'], ['no', 'Nothing else to sell']], when: () => !preLaunch(), tier: 3, affects: ['action'] },
  { id: 'priceRaised', route: O, section: 'foundations', legacy: 'offer', driver: 'pricing', type: 'presets', key: 'priceRaised',
    opts: [['recent', 'In the last year'], ['while', 'One to three years ago', () => S().yearsTrading == null || S().yearsTrading >= 1], ['long', 'Over three years ago', () => S().yearsTrading == null || S().yearsTrading > 3], ['never', 'Never']],
    when: () => tradingYear() && S().yearsTrading !== 0, tier: 3, affects: ['action'] },
  { id: 'fixedCosts', route: O, section: 'foundations', legacy: 'money', driver: 'margin', type: 'costs', key: 'fixedCosts', keys: ['costLines'], scale: [2000, 30000], unit: 'a month', when: () => !preLaunch(), tier: 3, affects: ['finding'] },
  { id: 'discounting', route: O, section: 'foundations', legacy: 'money', driver: 'margin', type: 'presets', key: 'discounting', opts: [['never', 'Never'], ['sometimes', 'Sometimes'], ['often', 'Often'], ['always', 'On most sales']], when: () => !preLaunch(), tier: 3, affects: ['action'] },
  { id: 'runway', route: O, section: 'foundations', legacy: 'money', driver: 'margin', type: 'presets', key: 'runway', opts: [[0, 'Nothing spare'], [2, '1 to 2 months'], [4, '3 to 6 months'], [9, '6 to 12 months'], [18, 'Over a year']], when: () => isNum(S().budget) && S().budget > 0, tier: 3, affects: ['action'] },

  /* ================= customers, owner: who buys, who to want next, how they come, whether they stay ================= */
  { id: 'buyer', route: O, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'buyers', key: 'buyer', keys: ['buyers'], tier: 1, affects: ['finding', 'plan'], invalidates: ['decider', 'segment', 'plan'] },
  { id: 'lastFive', route: O, section: 'customers', legacy: 'clients', driver: 'retention', kind: 'clientCards', key: 'lastFive', keys: ['bestNone'], unsure: 'Not sure', when: () => !preLaunch(), tier: 2, affects: ['finding', 'action'], invalidates: ['segment'] },
  { id: 'segment', route: O, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'segment', key: 'segment', keys: ['segmentWords', 'narrowKind', 'narrow'], unsure: 'Not sure', tier: 2, affects: ['finding', 'action', 'plan'], invalidates: ['plan'] },
  { id: 'trigger', route: O, section: 'customers', legacy: 'close', driver: 'conversion', kind: 'trigger', key: 'trigger', keys: ['triggerOther'], tier: 2, affects: ['action', 'plan'] },
  { id: 'decider', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'presets', key: 'decider', opts: DECIDERS, when: () => b2b(), tier: 2, affects: ['action'] },
  /* Task 17: the routes are selected first. A press means selected, and nothing else. Ranking and the activity count
     are separate steps, revealed only where they change the recommendation */
  { id: 'channel', route: O, section: 'customers', legacy: 'routes', driver: 'demand', kind: 'channel', key: 'channel', keys: ['doing', 'channelRank'], engine: 'channel', unsure: 'Skip', tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], invalidates: ['channelRank', 'channelVolume', 'plan'] },
  { id: 'channelRank', route: O, section: 'customers', legacy: 'routes', driver: 'demand', kind: 'rank', key: 'channelRank', on: 'channel', hidden: true, unsure: 'Not sure', when: () => doingList().length >= 2, tier: 2, affects: ['scenario', 'action'] },
  { id: 'channelVolume', route: O, section: 'customers', legacy: 'routes', driver: 'demand', kind: 'channelVolume', key: 'channelVolume', when: () => Boolean(volumeRoute()), tier: 2, affects: ['action', 'plan'] },
  { id: 'tried', route: O, section: 'customers', legacy: 'routes', driver: 'demand', kind: 'tried', key: 'tried', keys: ['triedNone'], unsure: 'Skip', tier: 2, affects: ['action'], invalidates: ['went'] },
  { id: 'went', route: O, section: 'customers', legacy: 'routes', driver: 'demand', kind: 'went', key: 'went', keys: ['wentWhy'], unsure: 'Skip', when: () => triedList().length > 0, tier: 2, affects: ['action'] },
  { id: 'market', route: O, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'reach', key: 'reach', keys: ['market'], engine: 'addressableCount', presence: true, unit: 'people this month', scale: [10, 2000], unsure: 'Not sure', tier: 2, affects: ['scenario', 'finding'] },
  { id: 'access', route: O, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'access', type: 'multi', key: 'access', opts: ACCESS, tier: 2, affects: ['action', 'plan'] },
  { id: 'enquiries', route: O, section: 'customers', legacy: 'close', driver: 'conversion', kind: 'enquiries', key: 'enquiries', keys: ['enquiriesRaw', 'winsRaw', 'wins', 'enquiryPeriod', 'closeRate', 'quotes'], unit: 'a month', unsure: 'Not sure', when: () => !preLaunch(), tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], satisfiedBy: ['import:enquiries'], invalidates: ['closeRate', 'plan'] },
  { id: 'closeRate', route: O, section: 'customers', legacy: 'close', driver: 'conversion', kind: 'closeRate', key: 'closeRate', engine: 'statedCloseRate', presence: true, on: 'enquiries', hidden: true, context: true, unit: 'in 10', unsure: 'Mercer’s estimate', tier: 1, affects: ['scenario', 'tree', 'finding'] },
  { id: 'chooseThem', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'multi', key: 'chooseThem', opts: STOPS, when: () => !preLaunch(), tier: 2, affects: ['finding', 'action'] },
  { id: 'repeat', route: O, section: 'customers', legacy: 'clients', driver: 'retention', kind: 'repeatBand', key: 'repeatBand', keys: ['repeat'], engine: 'repeatPurchaseRate', unsure: 'Not sure', when: () => !preLaunch() && rw() !== 'retainer', tier: 2, affects: ['scenario', 'tree', 'finding'], invalidates: ['returned', 'stay'] },
  { id: 'returned', route: O, section: 'customers', legacy: 'clients', driver: 'retention', kind: 'returned', key: 'returned', keys: ['returnedOf', 'repeat'], unsure: 'Not sure', when: () => !preLaunch() && rw() !== 'retainer' && repeatBranch(), tier: 2, affects: ['scenario', 'finding'] },
  { id: 'retainerRenew', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'tens', key: 'retainerRenew', unit: 'in 10', pre: '0', preValue: 0, when: () => !preLaunch() && rw() === 'retainer' && !ownAnswer('repeat'), tier: 2, affects: ['scenario', 'finding'] },
  { id: 'stay', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'arc', key: 'retention', engine: 'retentionMonths', unit: 'months', unsure: 'Not sure',
    get opts() { return [...(repeatBranch() || rw() === 'repeat' || rw() === 'mixed' ? [] : [[1, 'One purchase']]), [3, 'A few months'], [12, 'About a year'], [24, '2 years or more']]; },
    when: () => !preLaunch() && rw() !== 'retainer' && repeatBranch(), tier: 2, affects: ['scenario', 'finding'] },
  { id: 'retainerMonths', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'number', key: 'retainerMonths', unit: 'months', scale: [3, 24], snap: 1, when: () => !preLaunch() && rw() === 'retainer' && !ownAnswer('retention'), tier: 2, affects: ['scenario', 'finding'] },
  { id: 'deliveryMode', route: O, section: 'customers', legacy: 'delivery', driver: 'capacity', kind: 'delivery', type: 'multi', key: 'deliveryMode', opts: DELIVERY, tier: 2, affects: ['finding', 'map', 'plan'], invalidates: ['radius', 'plan'] },
  { id: 'radius', route: O, section: 'customers', legacy: 'reach', driver: 'demand', type: 'presets', key: 'radius', opts: [['local', 'This town'], ['county', 'About 30 miles'], ['national', 'The whole country'], ['global', 'Other countries too']], when: () => onSite(), tier: 2, affects: ['map', 'finding'] },
  { id: 'reviews', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'multi', key: 'proof', opts: PROOF, tier: 2, affects: ['action'] },
  // refinement (tier 3)
  { id: 'listSize', route: O, section: 'customers', legacy: 'reach', driver: 'demand', type: 'number', key: 'listSize', unit: 'contacts', zero: true, scale: [200, 20000], when: () => (S().access ?? []).includes('contacts') || (S().access ?? []).includes('audience'), tier: 3, affects: ['scenario'] },
  { id: 'competitors', route: O, section: 'customers', legacy: 'reach', driver: 'demand', type: 'text', key: 'competitors', placeholder: 'two national names and three local ones', tier: 3, affects: ['brief'] },
  { id: 'spendSplit', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'split', key: 'spendSplit', unit: '%', unsure: 'Skip', when: () => (S().spendNow ?? 0) > 0 && doingList().length >= 2, tier: 3, affects: ['scenario'] },
  { id: 'marketingOwner', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'presets', key: 'marketingOwner', opts: [['me', 'Me'], ['someone', 'A team member', () => !solo()], ['agency', 'An agency'], ['nobody', 'No one']], when: () => doingList().length > 0, tier: 3, affects: ['action'] },
  { id: 'agency', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'presets', key: 'agency', opts: [['never', 'Never used one'], ['now', 'Using one now'], ['ended', 'Used one before'], ['several', 'Several']], tier: 3, affects: ['action'] },
  { id: 'agencyFee', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'money', key: 'agencyFee', unit: 'a month', scale: [500, 5000], when: () => S().marketingOwner === 'agency' || S().agency === 'now', tier: 3, affects: ['finding'] },
  { id: 'agencyWhy', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'text', key: 'agencyWhy', placeholder: 'the reporting looked good and the phone never rang', when: () => S().agency === 'ended' || S().agency === 'several', tier: 3, affects: ['brief'] },
  { id: 'contentTime', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'number', key: 'contentTime', unit: 'hours a week', zero: true, scale: [1, 20], snap: 1, when: () => doingList().some(isContent), tier: 3, affects: ['scenario'] },
  { id: 'tracking', route: O, section: 'customers', legacy: 'routes', driver: 'demand', type: 'presets', key: 'tracking',
    opts: [['ask', 'We ask them'], ['crm', 'CRM records', () => !(S().systems?.length) || S().systems.includes('crm')], ['analytics', 'Web analytics', () => S().website !== 'none'], ['guess', 'Best guess'], ['no', 'We can’t tell']], when: () => !preLaunch(), tier: 3, affects: ['action'] },
  { id: 'cycle', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'arc', key: 'cycle', engine: 'salesCycleDays', unit: 'days', opts: CYCLE_OPTS, unsure: 'Mercer’s estimate', when: () => !preLaunch(), tier: 3, affects: ['scenario'] },
  { id: 'responseTime', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'presets', key: 'responseTime', opts: [['minutes', 'Minutes'], ['hours', 'A few hours'], ['day', 'Same day'], ['days', 'One to two days'], ['slow', 'Longer']], when: () => !preLaunch() && S().enquiries !== 0, tier: 3, affects: ['action'] },
  { id: 'followUps', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'tens', key: 'followUps', unit: 'chases', pre: '0', preValue: 0, plus: '10+', when: () => !preLaunch() && S().enquiries !== 0, tier: 3, affects: ['action'] },
  { id: 'website', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'presets', key: 'website', opts: [['none', 'No website', () => !S().site], ['brochure', 'Read about us'], ['enquiry', 'Send an enquiry'], ['book', 'Book'], ['sell', 'Buy']], tier: 3, affects: ['action'] },
  { id: 'chooseYou', route: O, section: 'customers', legacy: 'close', driver: 'conversion', type: 'multi', key: 'chooseYou', opts: [['price', 'Price'], ['speed', 'Speed'], ['quality', 'Quality'], ['expertise', 'Expertise'], ['location', 'Location'], ['relationship', 'They know us'], ['only', 'No one else offers it']], when: () => !preLaunch(), tier: 3, affects: ['action'] },
  { id: 'returnGap', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'presets', key: 'returnGap', opts: [['week', 'About a week'], ['month', 'About a month'], ['quarter', 'A few months'], ['year', 'About a year'], ['longer', 'Over a year']], when: () => repeatBranch(), tier: 3, affects: ['scenario'] },
  { id: 'newVsRepeat', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'presets', key: 'newVsRepeat', opts: [['none', 'Almost none'], ['quarter', 'About a quarter'], ['half', 'About half'], ['most', 'Most of it']], when: () => repeatBranch(), tier: 3, affects: ['finding'] },
  { id: 'ltv', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'money', key: 'ltv', unit: 'per customer', scale: [200, 20000], when: () => repeatBranch(), tier: 3, affects: ['finding'] },
  { id: 'topShare', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'ring', key: 'topShare', unit: '%', unsure: 'Not sure', when: () => !preLaunch(), tier: 3, affects: ['finding'] },
  { id: 'bestEver', route: O, section: 'customers', legacy: 'clients', driver: 'retention', type: 'text', key: 'bestEver', placeholder: 'one job that paid for the quarter and led to two more', when: () => !preLaunch(), tier: 3, affects: ['brief'] },

  /* ================= delivery, owner: what runs out, where the week goes, what can change =================
     Task 18: the capacity questions are observable facts about last month. Nobody is asked to guess what they could
     take on, or what their capacity should be in three months: Mercer proposes the ceiling and it can be corrected */
  { id: 'turnedAway', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'turnedAway', opts: TURNED_AWAY, when: () => !preLaunch(), tier: 1, affects: ['finding', 'plan'], invalidates: ['plan'] },
  // retired with Task 18, kept so a saved answer still has its question's name on the evidence rows; never asked again
  { id: 'canDeliverMore', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'canDeliverMore', opts: MORE_NEXT, hidden: true, when: () => false, satisfiedBy: ['turnedAway'], tier: 3, affects: ['finding'], note: 'replaced by turnedAway; the title stays for older answers' },
  { id: 'capacity', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', kind: 'capacity', key: 'capacity', keys: ['who', 'servedNow', 'jobHours', 'capacityBasis'], engine: 'serviceRatePerServerPerMonth', unsure: 'Mercer’s estimate', tier: 1, affects: ['scenario', 'tree', 'finding', 'plan'], satisfiedBy: ['import:capacity'], invalidates: ['plan'] },
  { id: 'breaksFirst', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'breaksFirst', opts: RUNS_OUT, tier: 2, affects: ['finding', 'plan'], invalidates: ['plan'] },
  { id: 'moreWork', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', kind: 'moreWork', key: 'moreWork', keys: ['moreWorkAmount', 'moreWorkLead', 'moreWorkCost'], opts: MORE_WORK, tier: 1, affects: ['finding', 'plan'], invalidates: ['plan'] },
  { id: 'hours', route: O, section: 'delivery', legacy: 'you', driver: 'roots', kind: 'week', key: 'hours', unit: 'hours a week', tier: 2, affects: ['action', 'plan'] },
  { id: 'weekGoes', route: O, section: 'delivery', legacy: 'you', driver: 'roots', type: 'multi', key: 'weekGoes', opts: WEEK_GOES, on: 'hours', hidden: true, tier: 2, affects: ['action'] },
  { id: 'worry', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'worry', opts: WORRY, tier: 2, affects: ['finding', 'action'] },
  { id: 'holdup', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', kind: 'holdup', key: 'holdup', keys: ['holdupOther'], tier: 2, affects: ['finding', 'action'], invalidates: ['software'] },
  { id: 'software', route: O, section: 'delivery', legacy: 'money', driver: 'margin', kind: 'software', key: 'stackNames', keys: ['stack', 'systems', 'stackAsked'], unsure: 'Skip', when: () => given(S().holdup) && S().holdup !== 'nowhere', tier: 2, affects: ['action'] },
  /* E37, Task 18: money and time are two questions, asked one after the other, never one control */
  { id: 'spend', route: O, section: 'delivery', legacy: 'routes', driver: 'demand', kind: 'budget', key: 'budget', keys: ['spendNow', 'oneOff'], engine: 'budget', unit: 'a month', unsure: 'Mercer’s estimate', tier: 1, affects: ['scenario', 'tree', 'action', 'plan'], invalidates: ['runway', 'plan'] },
  { id: 'changeHours', route: O, section: 'delivery', legacy: 'you', driver: 'roots', type: 'number', key: 'changeHours', unit: 'hours a week', scale: [1, 20], snap: 1, zero: true, tier: 1, affects: ['action', 'plan'] },
  { id: 'terms', route: O, section: 'delivery', legacy: 'money', driver: 'margin', type: 'presets', key: 'terms', opts: TERMS, when: () => !preLaunch(), tier: 2, affects: ['finding', 'action'] },
  { id: 'wontDo', route: O, section: 'delivery', legacy: 'ground', driver: 'roots', type: 'multi', key: 'wontDo', opts: LIMITS, tier: 2, affects: ['action', 'plan'], invalidates: ['plan'] },
  // refinement (tier 3)
  { id: 'teamSize', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'number', key: 'teamSize', unit: 'people', scale: [1, 30], snap: 1, when: () => helpsMe(), tier: 3, affects: ['finding'], satisfiedBy: ['import:team'] },
  { id: 'leadTime', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'arc', key: 'leadTime', opts: [['now', 'A day or two'], ['week', 'Within a week'], ['weeks', 'Two to four weeks'], ['month', 'Over a month']], when: () => !preLaunch(), tier: 3, affects: ['scenario'] },
  { id: 'jobLength', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'jobLength', opts: [['minutes', 'Under an hour'], ['hours', 'A few hours'], ['days', 'Days'], ['weeks', 'Weeks'], ['months', 'Months']], when: () => rw() !== 'retainer', tier: 3, affects: ['finding'] },
  { id: 'qualitySlip', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'multi', key: 'qualitySlip', opts: [['quality', 'Quality of work'], ['speed', 'Reply speed'], ['margin', 'Margins'], ['hours', 'My hours'], ['none', 'Nothing']], when: () => has('breaksFirst') && S().breaksFirst !== 'nothing', tier: 3, affects: ['finding'] },
  { id: 'subcontract', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'subcontract', opts: [['yes', 'Partners, ready now'], ['maybe', 'Someone, at a cost'], ['no', 'No one']], when: () => has('breaksFirst') && S().breaksFirst !== 'nothing', tier: 3, affects: ['action'] },
  { id: 'holiday', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'holiday', opts: [['fine', 'It runs'], ['slows', 'It slows'], ['stops', 'It stops'], ['never', 'Never tried it']], when: () => !preLaunch(), tier: 3, affects: ['finding'] },
  { id: 'hiring', route: O, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 'hiring', opts: [['now', 'Yes, now'], ['steady', 'Once work is steady'], ['no', 'No'], ['cant', 'We can’t find people']], when: () => S().breaksFirst === 'me' || S().breaksFirst === 'team' || S().breaksFirst === 'skill', tier: 3, affects: ['action'] },
  { id: 'owed', route: O, section: 'delivery', legacy: 'money', driver: 'margin', type: 'money', key: 'owed', unit: 'outstanding', zero: true, scale: [1000, 60000], when: () => has('terms') && S().terms !== 'upfront', tier: 3, affects: ['finding'] },

  /* ================= leverage, owner: strengths, energy, the people, the network, who decides ================= */
  { id: 'strengths', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'strengths', key: 'strengths', keys: ['avoids'], unsure: 'Skip', tier: 2, affects: ['action', 'plan'] },
  { id: 'energy', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'energy', key: 'energy', unsure: 'Skip', tier: 2, affects: ['action'] },
  { id: 'help', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'help', key: 'help', unsure: 'Skip', tier: 2, affects: ['finding', 'action', 'plan'], invalidates: ['delegation', 'teamSize'] },
  { id: 'delegation', route: O, section: 'leverage', legacy: 'you', driver: 'roots', type: 'presets', key: 'delegation', opts: DELEGATION, unsure: 'Skip', when: () => helpsMe(), tier: 2, affects: ['finding', 'action'] },
  { id: 'network', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', kind: 'network', key: 'networkKinds', keys: ['network'], unsure: 'Skip', tier: 2, affects: ['action', 'plan'], invalidates: ['networkStrength', 'asked'] },
  { id: 'networkStrength', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'presets', key: 'networkStrength', opts: NETWORK_STRENGTH, when: () => networkKinds().length > 0, tier: 2, affects: ['action'] },
  { id: 'asked', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'presets', key: 'askedHelp', opts: ASKED_HELP, when: () => networkKinds().length > 0, tier: 2, affects: ['action'] },
  { id: 'decisionRights', route: O, section: 'leverage', legacy: 'control', driver: 'roots', kind: 'authority', key: 'decides', keys: ['decisionRights', 'decidesWho'], unsure: 'Skip', tier: 2, affects: ['action', 'plan'], invalidates: ['plannedChanges'] },
  { id: 'plannedChanges', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'multi', key: 'plannedChanges', opts: CHANGE_ROLES, when: () => given(S().decides), tier: 2, affects: ['action'] },
  { id: 'personality', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'personality', key: 'personality', keys: ['personalityAxes'], unsure: 'Skip', optional: true, tier: 3, affects: ['reflection'] },
  // refinement (tier 3): the founder and control questions, each asked only where it can change the action plan
  { id: 'avoided', route: O, section: 'leverage', legacy: 'you', driver: 'roots', type: 'multi', key: 'avoided', opts: AVOIDED, tier: 3, affects: ['action'] },
  { id: 'decisionSpeed', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'decisionSpeed', key: 'decisionSpeed', unsure: 'Skip', tier: 3, affects: ['reflection'] },
  { id: 'futureRole', route: O, section: 'leverage', legacy: 'you', driver: 'roots', type: 'presets', key: 'futureRole', opts: FUTURE_ROLE, unsure: 'Skip', tier: 3, affects: ['action'] },
  { id: 'risk', route: O, section: 'leverage', legacy: 'you', driver: 'roots', type: 'presets', key: 'risk', opts: RISK, tier: 3, affects: ['brief'] },
  { id: 'cv', route: O, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'cv', key: 'cv', unsure: 'Later', optional: true, tier: 3, affects: ['brief'] },
  { id: 'ownership', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'presets', key: 'ownership', opts: OWNERSHIP, unsure: 'Skip', when: () => S().decides === 'shared' || S().decides === 'someone', tier: 3, affects: ['action'] },
  { id: 'ownShare', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'ring', key: 'ownShare', unit: '%', unsure: 'Skip', when: () => sharedOwner(), tier: 3, affects: ['action'] },
  { id: 'profitShare', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'presets', key: 'profitShare', opts: PROFIT_SHARE, unsure: 'Skip', when: () => sharedOwner(), tier: 3, affects: ['action'] },
  { id: 'influence', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'presets', key: 'influence', unsure: 'Skip',
    opts: [['me', 'You'], ['partner', 'A partner or co-owner', () => sharedOwner()], ['family', 'A family member', () => S().ownership === 'family'], ['manager', 'A manager', () => !solo()], ['team', 'The team between them', () => !solo()], ['nobody', 'No one person']], when: () => helpsMe(), tier: 3, affects: ['action'] },
  { id: 'keyPeople', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'number', key: 'keyPeople', unit: 'people', scale: [1, 10], snap: 1, zero: true, unsure: 'Skip', when: () => helpsMe(), tier: 3, affects: ['finding'] },
  { id: 'retain', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'multi', key: 'retain', opts: [...DECISIONS, ['none', 'None of them']], when: () => S().decides === 'shared' || (S().plannedChanges ?? []).some((x) => x !== 'keep'), tier: 3, affects: ['action'] },
  { id: 'exitIntent', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'presets', key: 'exitIntent', opts: EXIT, unsure: 'Skip', tier: 3, affects: ['action'] },
  { id: 'unresolved', route: O, section: 'leverage', legacy: 'control', driver: 'roots', type: 'text', key: 'unresolved', max: 600, optional: true, placeholder: 'who has the last word when two of us disagree on pay', when: () => S().decides === 'shared', tier: 3, affects: ['brief'] },
  { id: 'funding', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'multi', key: 'funding', opts: FUNDING, when: () => isNum(S().budget) && S().budget > 0, tier: 3, affects: ['action'] },
  { id: 'dataOffer', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'multi', key: 'dataOffer',
    opts: [['crm', 'A CRM export', () => !(S().systems?.length) || S().systems.includes('crm')], ['accounts', 'Accounts'], ['ads', 'Ad accounts', () => !usedList().length || usedList().some(isAds)], ['site', 'Website analytics', () => S().website !== 'none'], ['sheet', 'A spreadsheet of jobs'], ['none', 'None yet']], tier: 3, affects: ['brief'] },
  { id: 'deadline', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'text', key: 'deadline', placeholder: 'a lease renewal in the spring that we want to be ready for', tier: 3, affects: ['plan'] },
  { id: 'successWords', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'text', key: 'successWords', placeholder: 'revenue is predictable enough to plan around', tier: 3, affects: ['brief'] },
  { id: 'note', route: O, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'text', key: 'note', max: 1200, optional: true, placeholder: 'one customer is a third of our revenue', tier: 3, affects: ['brief'] },

  /* ================= foundations, starter: the person and their resources (N01 to N18) =================
     Task 11: concrete discovery prompts, selected rather than all asked. Each one earns its place by adding evidence
     nothing else has given: `when` stops a prompt that a earlier answer already covers. A CV is optional evidence,
     offered where someone is struggling to name their strengths, and never a gate. */
  { id: 'n01', route: N, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'n01', key: 'n01', keys: ['n01Other', 'n09', 'cv'], tier: 1, affects: ['finding', 'plan'] },
  /* results 1, D9: where they are starting, then the follow-ups that start needs. All first pass; the flow places them after n01.
     A changed start moves the directions and the plan, so both are invalidated */
  { id: 'startPoint', route: N, section: 'foundations', legacy: 'roots', driver: 'roots', kind: 'startPoint', key: 'startPoint', keys: ['n25Text'], tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['n27', 'plan'] },
  // one idea: who would pay, the problem, what they do today, whether anyone asked or paid, whether a small version could be delivered
  { id: 's01', route: N, section: 'foundations', legacy: 'reach', driver: 'demand', kind: 's01', key: 's01', keys: ['s01Other'], when: () => startsAt('one'), tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'n31', 'plan'] },
  { id: 's02', route: N, section: 'foundations', legacy: 'reach', driver: 'demand', type: 'text', key: 's02', max: 160, placeholder: 'e.g. their invoices go out late and they chase them themselves', when: () => startsAt('one'), tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'plan'] },
  { id: 's03', route: N, section: 'foundations', legacy: 'reach', driver: 'demand', type: 'text', key: 's03', max: 160, placeholder: 'e.g. a spreadsheet, or nothing until it becomes a problem', when: () => startsAt('one'), tier: 1, affects: ['finding', 'plan'], invalidates: ['plan'] },
  { id: 's04', route: N, section: 'foundations', legacy: 'close', driver: 'demand', type: 'presets', key: 's04', opts: S04, when: () => startsAt('one'), tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'n33', 'plan'] },
  { id: 's05', route: N, section: 'foundations', legacy: 'delivery', driver: 'capacity', type: 'presets', key: 's05', opts: S05, when: () => startsAt('one') || (startsAt('few') && Boolean(chosenIdea())), tier: 1, affects: ['action', 'plan'], invalidates: ['n35', 'plan'] },
  // a few ideas: the lines, which has demand behind it, which could be delivered, and the tie-breaker only while two still stand
  { id: 's06', route: N, section: 'foundations', legacy: 'offer', driver: 'roots', kind: 's06', key: 's06', when: () => startsAt('few'), tier: 1, affects: ['finding', 'plan'], invalidates: ['s07', 's08', 's09', 'n27', 'plan'] },
  { id: 's08', route: N, section: 'foundations', legacy: 'close', driver: 'demand', kind: 's08', key: 's08', when: () => startsAt('few') && ideas().length > 0, tier: 1, affects: ['finding', 'plan'], invalidates: ['s07', 'n27', 'plan'] },
  { id: 's09', route: N, section: 'foundations', legacy: 'delivery', driver: 'capacity', kind: 's09', key: 's09', when: () => startsAt('few') && ideas().length > 0, tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['s07', 'n27', 'plan'] },
  { id: 's07', route: N, section: 'foundations', legacy: 'offer', driver: 'roots', kind: 's07', key: 's07', when: () => startsAt('few') && standingIdeas().length >= 2, tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['n27', 'plan'] },
  // already tried: what and to whom, the channel, what happened, and two optional figures that tell no demand from no exposure
  { id: 's10', route: N, section: 'foundations', legacy: 'offer', driver: 'roots', type: 'text', key: 's10', max: 160, placeholder: 'e.g. dog walking, to neighbours on our street', when: () => startsAt('tried'), tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'n31', 'plan'] },
  { id: 's11', route: N, section: 'foundations', legacy: 'routes', driver: 'demand', kind: 's11', key: 's11', keys: ['s11Other'], when: () => startsAt('tried'), tier: 1, affects: ['action', 'plan'], invalidates: ['n38', 'plan'] },
  { id: 's12', route: N, section: 'foundations', legacy: 'close', driver: 'conversion', type: 'presets', key: 's12', opts: S12, when: () => startsAt('tried'), tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'n33', 'plan'] },
  { id: 's13', route: N, section: 'foundations', legacy: 'close', driver: 'conversion', kind: 's13', key: 's13', keys: ['s13Saw', 's13Replied', 's13Bought'], optional: true, unsure: 'Skip', when: () => startsAt('tried'), tier: 1, affects: ['finding', 'plan'], invalidates: ['plan'] },
  { id: 's14', route: N, section: 'foundations', legacy: 'offer', driver: 'pricing', kind: 's14', type: 'money', key: 's14', unit: 'for it', scale: [5, 2000], zero: true, optional: true, unsure: 'Skip', when: () => startsAt('tried'), tier: 1, affects: ['plan'], invalidates: ['n37', 'plan'] },
  { id: 'interest', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'interest', key: 'interest', keys: ['interestPart'], unsure: 'Skip', tier: 2, affects: ['finding', 'plan'], invalidates: ['n27'] },
  { id: 'bestAt', route: N, section: 'foundations', legacy: 'you', driver: 'roots', type: 'text', key: 'bestAt', max: 160, placeholder: 'e.g. ten years of stage lighting for small theatres', when: () => !advEvidence().proven, tier: 2, affects: ['finding', 'plan'] },
  { id: 'paidBefore', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'paidBefore', key: 'paidBefore', keys: ['paidWhat'], on: 'n10', tier: 1, affects: ['finding', 'plan'], invalidates: ['n27'] },
  { id: 'workStyle', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'workStyle', key: 'workStyle', keys: ['workStyleOther'], unsure: 'Skip', when: () => given(S().workStyle) || evidenceCount() < 6, tier: 2, affects: ['finding', 'plan'] },
  { id: 'n02', route: N, section: 'aim', legacy: 'roots', driver: 'roots', kind: 'none', key: 'win', hidden: true, when: () => false, satisfiedBy: ['win', 'goal', 'months'], tier: 1, affects: ['plan'], note: 'S02 to S04 ask this; never asked again' },
  { id: 'n03', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'n03', key: 'n03', keys: ['n03Pattern', 'n04', 'n18'], unit: 'hours a week', tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'plan'] },
  { id: 'n04', route: N, section: 'foundations', legacy: 'you', driver: 'roots', type: 'multi', key: 'n04', opts: N04, on: 'n03', hidden: true, when: () => hoursTight() || dirNeeds('needsAvailability'), tier: 2, affects: ['plan'] },
  { id: 'n05', route: N, section: 'foundations', legacy: 'ground', driver: 'roots', kind: 'n05', key: 'n05', keys: ['n06'], unit: '£', zero: true, tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'plan'] },
  { id: 'n06', route: N, section: 'foundations', legacy: 'ground', driver: 'roots', type: 'money', key: 'n06', unit: 'a month', scale: [5, 200], zero: true, on: 'n05', hidden: true, tier: 2, affects: ['plan'] },
  { id: 'n07', route: N, section: 'foundations', legacy: 'roots', driver: 'roots', type: 'presets', key: 'n07', opts: N07, when: () => !isNum(S().months), satisfiedBy: ['months'], tier: 2, affects: ['plan'] },
  { id: 'n08', route: N, section: 'foundations', legacy: 'ground', driver: 'roots', kind: 'none', key: 'protected', hidden: true, when: () => false, satisfiedBy: ['protected'], tier: 1, affects: ['plan'], note: 'S05 asks this; never asked again' },
  /* the cockpit brief, 7.4: the CV offer is a screen of its own, early, after the goal. Upload my CV, paste my experience,
     or answer a few questions (Skip): optional, and someone without a CV completes Mercer */
  { id: 'n09', route: N, section: 'leverage', legacy: 'you', driver: 'roots', kind: 'n09', key: 'n09', keys: ['cv'], optional: true, unsure: 'Answer a few questions', tier: 1, affects: ['finding', 'plan'], invalidates: ['n27'] },
  { id: 'n10', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'n10', key: 'n10', keys: ['n10Other', 'n11', 'n11Example', 'n12', 'n12Other'], tier: 1, affects: ['finding', 'plan'], invalidates: ['n11', 'n12', 'n15', 'n27', 'plan'] },
  { id: 'n11', route: N, section: 'foundations', legacy: 'you', driver: 'roots', type: 'multi', key: 'n11', on: 'n10', hidden: true, when: () => skillsPicked().length > 0, tier: 2, affects: ['finding', 'plan'] },
  { id: 'n12', route: N, section: 'foundations', legacy: 'you', driver: 'roots', type: 'multi', key: 'n12', on: 'n10', hidden: true, tier: 2, affects: ['finding', 'plan'] },
  // the ten tiles are skipped where the interest prompt and the work-style prompt have already said what this asks
  { id: 'n13', route: N, section: 'foundations', legacy: 'you', driver: 'roots', kind: 'n13', key: 'n13', keys: ['n14'], unsure: 'Skip', tier: 1, affects: ['plan'], invalidates: ['n27'] },
  { id: 'n14', route: N, section: 'foundations', legacy: 'you', driver: 'roots', type: 'multi', key: 'n14', opts: N13, on: 'n13', hidden: true, tier: 2, affects: ['plan'] },
  // Task 13: what to learn is a gap in a chosen direction, not a blank question before there is one. It rides on the gap proposal
  { id: 'n15', route: N, section: 'delivery', legacy: 'you', driver: 'roots', type: 'multi', key: 'n15', opts: N15, on: 'n30', hidden: true, when: () => given(S().n27) && S().n27 !== 'none', tier: 2, affects: ['plan'] },
  { id: 'n16', route: N, section: 'foundations', legacy: 'ground', driver: 'roots', kind: 'n16', key: 'n16', keys: ['n16Names', 'n17'], tier: 2, affects: ['action', 'plan'] },
  { id: 'n17', route: N, section: 'foundations', legacy: 'ground', driver: 'roots', type: 'multi', key: 'n17', opts: N17, on: 'n16', hidden: true, tier: 2, affects: ['plan'] },
  { id: 'n18', route: N, section: 'foundations', legacy: 'reach', driver: 'roots', type: 'presets', key: 'n18', opts: N18, on: 'n03', hidden: true, tier: 2, affects: ['finding', 'plan'], invalidates: ['n27'] },

  /* ================= opportunities, starter: who they understand, access, an idea, the directions (N19 to N30) ================= */
  { id: 'n19', route: N, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'n19', key: 'n19', keys: ['n19Other', 'n20', 'n20Other'], tier: 1, affects: ['finding', 'plan'], invalidates: ['n20', 'n27', 'n31', 'plan'] },
  { id: 'n20', route: N, section: 'customers', legacy: 'reach', driver: 'demand', type: 'multi', key: 'n20', opts: N20, on: 'n19', hidden: true, tier: 2, affects: ['finding', 'plan'] },
  { id: 'n21', route: N, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'n21', key: 'n21', keys: ['n21Count', 'n21Exact', 'n22', 'n22Size', 'n23', 'n24'], tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['n27', 'n38', 'plan'] },
  { id: 'n22', route: N, section: 'customers', legacy: 'reach', driver: 'demand', type: 'presets', key: 'n22', opts: N22, on: 'n21', hidden: true, when: () => given(S().n21) && S().n21 !== 'direct', tier: 2, affects: ['plan'] },
  { id: 'n23', route: N, section: 'customers', legacy: 'ground', driver: 'roots', type: 'multi', key: 'n23', opts: N23, on: 'n21', hidden: true, tier: 2, affects: ['action', 'plan'] },
  { id: 'n24', route: N, section: 'delivery', legacy: 'ground', driver: 'roots', type: 'presets', key: 'n24', opts: N24, on: 'n30', hidden: true, when: () => (S().n23 ?? []).some((x) => x !== 'none'), tier: 2, affects: ['action'] },
  // results 1, D9: both are settled by the opening branch (derive) and never asked again; the keys stay for the brain and older saves
  { id: 'n25', route: N, section: 'customers', legacy: 'offer', driver: 'roots', kind: 'none', key: 'n25', keys: ['n25Text', 'n26Result'], hidden: true, when: () => false, satisfiedBy: ['startPoint'], tier: 1, affects: ['finding', 'plan'], invalidates: ['n27', 'plan'], note: 'startPoint answers this: one or a few ideas is yes' },
  { id: 'n26', route: N, section: 'customers', legacy: 'offer', driver: 'roots', type: 'presets', key: 'n26', opts: N26, hidden: true, when: () => false, satisfiedBy: ['startPoint'], tier: 2, affects: ['plan'], note: 'startPoint answers this: already tried, with s12 saying whether it sold' },
  { id: 'n27', route: N, section: 'customers', legacy: 'reach', driver: 'demand', kind: 'n27', key: 'n27', keys: ['direction', 'n28', 'n29'], unsure: 'Not sure', tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['n30', 'n31', 'n32', 'n35', 'n36', 'n37', 'n41', 'n42', 'plan'] },
  { id: 'n28', route: N, section: 'customers', legacy: 'reach', driver: 'demand', type: 'multi', key: 'n28', opts: N28, on: 'n27', hidden: true, when: () => given(S().n27) && (S().n27 === 'none' || !direction()?.recommended), tier: 2, affects: ['plan'] },
  { id: 'n29', route: N, section: 'customers', legacy: 'ground', driver: 'roots', type: 'presets', key: 'n29', opts: N29, on: 'n27', hidden: true, when: () => dirNeeds('needsPartner') || (S().n23 ?? []).includes('collaborator'), tier: 2, affects: ['plan'] },

  /* ================= test, starter: the first offer, the test, what it takes (N31 to N40) =================
     Task 13 and D6: five screens that used to ask the visitor to do Mercer's work are now proposals. Each states what
     Mercer would do and why, carries an edit affordance, and asks at most one small observable question where a fact
     is genuinely decisive. The state keys are the ones the brain already reads (n30, n35, n37, n39, n40). */
  { id: 'n30', route: N, section: 'delivery', legacy: 'ground', driver: 'roots', kind: 'gaps', key: 'n30', keys: ['n30Edited', 'n30Gaps', 'n15', 'n24'], unsure: 'Skip', when: () => given(S().n27), tier: 2, affects: ['action', 'plan'] },
  { id: 'n31', route: N, section: 'delivery', legacy: 'offer', driver: 'pricing', kind: 'n31', key: 'n31', keys: ['n31Other', 'n32', 'n32Other', 'n38'], tier: 1, affects: ['finding', 'action', 'plan'], invalidates: ['n35', 'n37', 'plan'] },
  { id: 'n32', route: N, section: 'delivery', legacy: 'offer', driver: 'pricing', type: 'presets', key: 'n32', opts: N32, on: 'n31', hidden: true, tier: 2, affects: ['action', 'plan'] },
  { id: 'n33', route: N, section: 'delivery', legacy: 'close', driver: 'conversion', kind: 'n33', key: 'n33', keys: ['n34', 'n34Other'], tier: 1, affects: ['finding', 'plan'] },
  { id: 'n34', route: N, section: 'delivery', legacy: 'close', driver: 'conversion', type: 'presets', key: 'n34', opts: N34, on: 'n33', hidden: true, tier: 2, affects: ['action', 'plan'] },
  { id: 'n35', route: N, section: 'delivery', legacy: 'delivery', driver: 'capacity', kind: 'n35', key: 'n35', keys: ['n35Gap', 'n35Edited', 'n36', 'doneBefore'], tier: 1, affects: ['finding', 'action', 'plan'] },
  { id: 'n36', route: N, section: 'delivery', legacy: 'delivery', driver: 'capacity', type: 'multi', key: 'n36', opts: N36, on: 'n35', hidden: true, when: () => given(S().n35) && S().n35 !== 'yes', tier: 2, affects: ['action'] },
  { id: 'n37', route: N, section: 'delivery', legacy: 'offer', driver: 'pricing', kind: 'n37', key: 'n37', keys: ['n37Basis', 'n37Edited', 'pricePaid', 'unitCost'], unit: 'for the first test', unsure: 'Not sure', tier: 2, affects: ['plan'] },
  { id: 'n38', route: N, section: 'delivery', legacy: 'routes', driver: 'demand', type: 'multi', key: 'n38', opts: N38, on: 'n31', hidden: true, when: () => S().n21 !== 'direct', satisfiedBy: ['n21'], tier: 1, affects: ['action', 'plan'] },
  { id: 'n39', route: N, section: 'delivery', legacy: 'close', driver: 'conversion', kind: 'n39', key: 'n39', keys: ['n39Text', 'n39Edited', 'n39Weeks'], tier: 1, affects: ['plan'] },
  { id: 'n40', route: N, section: 'delivery', legacy: 'close', driver: 'conversion', kind: 'n40', key: 'n40', keys: ['n40Text', 'n40Edited', 'n40Weeks', 'n40Spend'], on: 'n39', tier: 2, affects: ['plan'] },

  /* ================= launch, starter: permissions, what to make first, tools, help (N41 to N44) ================= */
  { id: 'n41', route: N, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'presets', key: 'n41', opts: N41, when: () => dirNeeds('needsPermission') || /\b(food|cook|cater|care|child|driv|taxi|financ|mortgage|insur|alcohol|electric|gas|plumb|medical|health|beauty|tattoo)/i.test(ownIdeaText() + ' ' + String(S().s02 ?? '') + ' ' + String(direction()?.name ?? '')), tier: 2, affects: ['action', 'plan'] },
  { id: 'n42', route: N, section: 'leverage', legacy: 'offer', driver: 'roots', type: 'multi', key: 'n42', opts: N42, when: () => given(S().n27) && S().n27 !== 'none' && !(Array.isArray(direction()?.assets) && direction().assets.length), tier: 2, affects: ['action', 'plan'] },
  { id: 'n43', route: N, section: 'leverage', legacy: 'ground', driver: 'roots', type: 'multi', key: 'n43', opts: N16, hidden: true, when: () => false, satisfiedBy: ['n16'], tier: 3, affects: ['action'], note: 'N16 answers this; confirmed only if a new tool is necessary' },
  { id: 'n44', route: N, section: 'plan', legacy: 'crown', driver: 'roots', type: 'presets', key: 'n44', opts: N44, hidden: true, when: () => false, tier: 3, affects: ['handoff'], note: 'an action after the plan, drawn by the results' },

  /* ================= plan (both routes) ================= */
  { id: 'readiness', route: B, section: 'plan', legacy: 'crown', driver: 'roots', kind: 'readiness', key: 'detail', opts: DETAIL, unknownOk: false, when: () => { try { return typeof M.ready === 'function' ? Boolean(M.ready()) : true; } catch (e) { return true; } }, tier: 1, affects: ['plan'] },
];
/* ---- defaults for every entry (R5): nothing is left unsaid ---- */
const CONTROL_OF_TYPE = { presets: 'stones', multi: 'multi', tens: 'tens', number: 'slider', money: 'slider', text: 'line', pair: 'pair', arc: 'arc', ring: 'ring', year: 'field', costs: 'sliders', split: 'sliders' };
const CONTROL_OF_KIND = { biz: 'line', win: 'stones', goal: 'slider', appetite: 'dial', months: 'arc', place: 'search', currency: 'search', sector: 'search', sells: 'multi', now: 'slider', price: 'slider', retainer: 'fee', margin: 'ring', volume: 'slider', established: 'field', import: 'import', buyers: 'multi', clientCards: 'clientCards', segment: 'cards', trigger: 'stones', channel: 'multi', rank: 'rank', channelVolume: 'slider', tried: 'multi', went: 'stones', reach: 'dots', enquiries: 'sliders', closeRate: 'tens', repeatBand: 'stones', returned: 'sliders', capacity: 'sliders', delivery: 'paths', week: 'slider', holdup: 'stones', software: 'ledger', budget: 'sliders', strengths: 'sort', energy: 'sort', help: 'tableRing', network: 'multi', authority: 'stones', personality: 'twoSided', decisionSpeed: 'twoSided', decisionRights: 'sorter', cv: 'socket', readiness: 'cards', none: 'none', n01: 'stones', n03: 'slider', n05: 'sliders', n09: 'import', n10: 'multi', n13: 'sort', n16: 'multi', n19: 'multi', n21: 'stones', n27: 'cards', n31: 'cards', n33: 'multi', n35: 'proposal', n37: 'proposal', n39: 'proposal', n40: 'proposal', gaps: 'proposal', interest: 'line', paidBefore: 'stones', workStyle: 'stones', startPoint: 'stones', s01: 'multi', s06: 'line', s07: 'cards', s08: 'cards', s09: 'cards', s11: 'multi', s13: 'sliders', s14: 'slider' };
const EFFORT_OF_CONTROL = { stones: 'low', multi: 'low', cards: 'low', dial: 'low', tens: 'low', proposal: 'low', paths: 'low', slider: 'mid', sliders: 'mid', field: 'mid', pair: 'mid', arc: 'mid', ring: 'mid', line: 'mid', fee: 'mid', search: 'mid', dots: 'mid', rank: 'mid', none: 'low', sort: 'high', sorter: 'high', shelves: 'high', ledger: 'high', tableRing: 'mid', twoSided: 'high', socket: 'high', import: 'high', capacity: 'high', clientCards: 'high' };
const IMPORT_FIELD_OF = { sector: 'offer', place: 'market', price: 'price', now: 'now', margin: 'margin', enquiries: 'enquiries', teamSize: 'team', capacity: 'capacity', yearsTrading: 'founded' };
ALL.forEach((q) => {
  q.route = Array.isArray(q.route) && q.route.length ? q.route : ['owner'];
  q.legacy = q.legacy ?? q.section;
  q.control = q.control ?? CONTROL_OF_KIND[q.kind] ?? CONTROL_OF_TYPE[q.type] ?? 'line';
  q.effort = q.effort ?? EFFORT_OF_CONTROL[q.control] ?? 'mid';
  q.tier = q.tier ?? 2;
  q.unit = typeof q.unit === 'string' ? q.unit : '';
  q.affects = Array.isArray(q.affects) ? q.affects : (q.engine ? ['scenario', 'tree'] : ['brief']);
  q.satisfiedBy = Array.isArray(q.satisfiedBy) ? q.satisfiedBy : (IMPORT_FIELD_OF[q.id] ? [`import:${IMPORT_FIELD_OF[q.id]}`] : []);
  q.invalidates = Array.isArray(q.invalidates) ? q.invalidates : (q.affects.some((a) => a === 'scenario' || a === 'finding' || a === 'plan') ? ['plan'] : []);
  q.unknownOk = q.unknownOk !== false;
  if (typeof q.when !== 'function') q.when = () => true;
  if (!q.unsure) q.unsure = q.type === 'text' || q.type === 'multi' || q.type === 'split' ? 'Skip' : 'Not sure';
});
const BY_ID = Object.fromEntries(ALL.map((q) => [q.id, q]));
const Q = Object.fromEntries(ALL.filter((q) => q.kind).map((q) => [q.id, q]));
const optsOf = (q) => (q.opts ?? []).filter((o) => typeof o[2] !== 'function' || o[2](S()));
const applies = (q) => { try { return Boolean(q.when(S())); } catch (e) { return false; } };
const onRoute = (q, route = routeOf()) => q.route.includes(route);
/* the old eleven, kept for readers that walk by them */
const SECTION_ORDER = ['roots', 'offer', 'reach', 'routes', 'close', 'delivery', 'money', 'clients', 'you', 'control', 'ground'];
/* Task 15: the owner's first stage is the business itself, so it is named for what it holds */
const STARTER_NAMES = { foundations: 'Starting point', aim: 'Aim', customers: 'Opportunities', delivery: 'Test', leverage: 'Launch', plan: 'Plan' };
const OWNER_NAMES = { foundations: 'Business', aim: 'Aim', customers: 'Customers', delivery: 'Delivery', leverage: 'Leverage', plan: 'Plan' };

/** the ids of one section that apply right now, in the registry's order. Asks by a new id (aim, foundations, customers,
    delivery, leverage, plan) answer for the current route; asks by an old id (roots, offer, ...) answer through `legacy`
    for every entry on the current route. Riders (`on`) and hidden ids are left out: they are drawn inside their screen */
function sectionQuestions(sectionId, route = routeOf()) {
  const byNew = ROUTE_SECTIONS.includes(sectionId);
  return ALL.filter((q) => (byNew ? q.section === sectionId : q.legacy === sectionId) && !q.hidden && !q.on && onRoute(q, route) && applies(q)).map((q) => q.id);
}
/** the screens a route would show right now: every entry that is on the route, not a rider, and applies. tier caps the
    depth (1 = what the first plan needs, 2 = the first pass, 3 = everything, refinement included) */
function screensFor(route = routeOf(), tier = 2) {
  return ROUTE_SECTIONS.flatMap((sec) => ALL.filter((q) => q.section === sec && !q.hidden && !q.on && onRoute(q, route) && q.tier <= tier && applies(q)).map((q) => q.id));
}

/* ------------------------------------------------------------------ the words over each question (COPY §4) */
const routeNames = () => doingList().filter(isContent).map(distName);
/** true when this copy can send an address to TMA's reader (research.js, read late: it loads after this file) */
const readerLive = () => { try { return Boolean(M.researchLive?.()); } catch (e) { return false; } };
/* the dial marks a level; only None changes what the engine is given (C39). The results show the rest beside the visitor's own spend */
const DIAL_WORDS = 'The dial marks how hard you want to grow. None plans with no growth spend. For the other levels the results show each level’s budget and the middle run it reaches, beside the forecast on your own growth spend.';
const contentSub = () => { const m = routeNames(); return m.length === 1 ? `Each week, on ${m[0]}` : m.length === 2 ? `Each week, on ${m[0]} and ${m[1]}` : m.length > 2 ? `Each week, across ${m.length} routes` : 'Posting and content, each week'; };
/* the import step's words (R20): one line, what is read here; the address line speaks for itself at the moment of use */
const IMPORT_HEAD = ['Website or notes', 'Optional. A web address, pasted text, or a file', 'Whatever Mercer finds is listed for you to confirm, edit or exclude. Nothing becomes an answer until you confirm it.'];
const sellUnit = () => ({ product: 'an order', bookings: 'a booking', oneoff: 'a job' }[S().sellsPrimary] ?? 'a sale');
const byRoute = (owner, starter) => () => (isStarter() ? starter : owner);
const HEAD = {
  biz: ['Business', 'What it is called, and its website if it has one', 'The name is used in the sentences Mercer writes to you. The address is kept as context for your plan.'],
  /* aim */
  win: ['What next', byRoute('What you would most like to achieve next', 'What you would want this business to do for you'), 'Pick the one that matters most. It shapes every question that follows, and nothing is chosen for you.'],
  goal: ['Target', byRoute('The monthly revenue you want to reach, and when', 'The monthly income you want it to bring in, and when'), byRoute(DIAL_WORDS, 'A figure a month, or a milestone in your words. The arc sets how soon.')],
  appetite: ['Target', 'How hard you want to grow', DIAL_WORDS],
  months: ['When', 'Months from now', 'Mercer forecasts twelve months and reports the month you choose.'],
  protected: ['Protected', 'What must stay protected while this changes. Choose one or more', 'A hard limit outranks an attractive upside: the plan is built around these. Add your own if it is not listed.'],
  place: ['Location', byRoute('The country you trade in, and the town or region you work from', 'The country you would work in, and the town or region'), 'Search for the country. The town is optional and is used for the map and for local figures.'],
  currency: ['Currency', 'Suggested from your country; change it if it is wrong', 'Every figure is shown in this currency. Other currency opens a searchable list. Benchmarks are UK figures and are labelled as such.'],
  /* foundations, owner */
  sector: ['What you do', 'What the business helps people do', 'Type it in your words, or pick a group and a trade. Mercer suggests the industry it uses for benchmarks.'],
  repeatWork: ['What you sell', 'What you sell most often. Choose one or more', 'With more than one, say which is most often. It sets which questions come next.'],
  stage: ['Business stage', 'How long it has been trading', 'Not trading yet, under a year, or a year or more. A business that is not trading yet is never asked for figures it cannot have.'],
  role: ['Your role', 'Your place in the business', 'Asked because it changes what the plan can assume you are free to decide.'],
  payModel: ['How you charge', 'How customers pay you. Choose one or more', 'Sets the units Mercer uses for a sale.'],
  now: ['Revenue', 'A typical month, before costs', 'Money in over a normal month, before any cost comes out. £0 is an answer; Not sure is too.'],
  season: ['Month to month', 'How much your months vary', 'Fairly steady, a seasonal peak, or unpredictable.'],
  bestWorst: ['Best and worst', 'Your best and worst month in the last year', 'Drag the two ends. Mercer checks its range against yours.'],
  price: ['Sale value', () => (preLaunch() ? `What one sale will bring in, as planned` : `What one ${sellUnit().replace(/^an? /, '')} brings in, on average`), () => `What one customer pays for one ${sellUnit().replace(/^an? /, '')}, VAT included if you charge it.`],
  retainer: ['Retainer', 'Lowest, typical and highest fee a month', 'Drag the three handles or type. Mercer prices a client at the typical fee times the months they stay.'],
  margin: ['Cost to deliver', () => (S().price ? `What it costs to deliver one ${gbp(S().price)} sale` : 'What you keep of each £1'), 'What is left of a sale after delivering it, before overheads. Unknown stays unknown.'],
  volume: ['Recent volume', () => `How many ${unitWord(2)} did you complete in the last 30 days?`, () => `${cap(rangeWords(30))}. Choose a longer period below if the last 30 days were unusual; Mercer converts to a month and checks the count against revenue and sale value, changing neither.`],
  yearsTrading: ['Established', 'The year the business started, and the month if you know it', 'Only asked where the history matters. Pick Unknown if you cannot say.'],
  import: IMPORT_HEAD,
  site: IMPORT_HEAD,
  priceSpread: ['Price spread', 'Smallest sale against largest', 'How far your prices swing over a year. A wide spread widens Mercer’s range.'],
  included: ['Package', 'What one sale includes', 'In your words, or pick a suggestion. Goes into your briefing, not the forecast.'],
  upsell: ['Upsells', 'More for the same customer', 'Whether a customer can buy more without a new enquiry.'],
  priceRaised: ['Price rises', 'When you last raised prices', 'Compared with inflation on the results.'],
  fixedCosts: ['Outgoings', 'Paid every month, whatever you sell', 'Rent, wages, bills, loans, other. Mercer checks the total against what you keep.'],
  discounting: ['Discounting', 'How often you cut price to win', 'From never to most sales.'],
  runway: ['Runway', 'Months you can fund growth', 'How long growth spend can run before sales must cover it.'],
  /* customers, owner */
  buyer: ['Who pays you', 'Who usually pays you. Choose one or more', 'With more than one, say which is most often.'],
  lastFive: ['Best customers', 'The customers you would most like more of: one to five, or none yet', 'One card each, no names. What they bought, how they found you, and what made them good for you. These shape positioning, never the averages.'],
  segment: ['Who next', 'Which description fits the customers you want next?', 'Suggested from what you have said. Edit one, pick None of these, or press Not sure.'],
  trigger: ['Why they buy', 'What usually makes them decide to buy', 'Pick the closest, or write your own.'],
  decider: ['Who decides', 'Who normally decides to buy', 'Where the decision sits changes who the plan reaches and how long it takes.'],
  channel: ['Finding you', 'Where your new customers come from. Choose one or more', 'Grouped by how warm the route is. A press selects a route and a second press clears it; nothing else is hidden in the press.'],
  channelRank: ['Which most', 'Put them in order, most customers won first', 'Only the order matters. Move a route with the arrows or the buttons beside it.'],
  channelVolume: ['How much', () => { const r = volumeRoute(); const a = r ? volumeAsk(r) : null; return a ? `About how many ${a[0]}, ${a[1]}?` : 'About how much of that route you do'; }, 'Asked because the next step on that route depends on how much of it you already do. A count you can check beats a guess.'],
  tried: ['Tried before', 'Routes you have tried and are not using now. Choose one or more', 'So the plan does not send you back through something that has already failed without saying what changes.'],
  went: ['What you tried', 'How each route you tried went, and why', 'Worked, mixed, or no result, for each route you tried.'],
  market: ['Reach this month', 'About how many suitable customers could you realistically reach this month?', 'They do not need to have agreed to buy. Not the whole market: the people you could put your offer in front of.'],
  access: ['Reaching them', 'How you know or reach those people. Choose one or more', 'No names or lists are asked for.'],
  enquiries: ['Enquiries and sales', 'In a recent period, how many enquiries came in, and how many became customers', 'Calls, emails, forms and messages from possible new customers, and the ones that bought. Not existing customers.'],
  closeRate: ['Close rate', 'Enquiries that become sales', 'Out of ten enquiries, how many buy. Mercer weighs your figure against the industry’s.'],
  chooseThem: ['What stops them', 'What tends to stop interested people buying. Choose one or more', 'Pick every reason you have heard.'],
  repeat: ['Buying again', 'Do customers buy again?', 'Sets which questions about returning customers are asked.'],
  returned: ['Who came back', 'Of a recent group of customers, how many returned', 'Two counts: the group, and the ones who came back. Mercer reads the rate from them.'],
  retainerRenew: ['Renewals', 'How many in 10 renew', 'Clients who renew at the end of a term.'],
  stay: ['Customer lifespan', 'How long a customer keeps buying', 'Months from first sale to last.'],
  retainerMonths: ['Retainer length', 'Months a typical client stays', 'Mercer uses this as how long a customer stays.'],
  deliveryMode: ['How you deliver', 'How the work reaches customers. Choose one or more', 'Asked before anything about distance, so a remote business is never asked about a radius.'],
  radius: ['Where they are', 'Where your customers come from', 'Sets the map.'],
  reviews: ['Proof', 'What helps buyers trust you. Choose one or more', 'The plan picks one practical thing to build on.'],
  // the polish pack, 5: the earlier reach figure is shown back, and this count is the warm part of it, not the same count again
  listSize: ['Contacts', () => (isNum(S().market) ? `You said you could reach about ${count(S().market)} suitable customers this month. How many of those already know you and would take your call?` : 'Past clients, current clients and people on your mailing list who would take your call'), 'People who already know you: warm routes draw on these. The reach figure is kept as it is.'],
  competitors: ['Competitors', 'Who wins the work you lose', 'Names or kinds, in your words.'],
  spendSplit: ['Spend split', 'Where today’s spend goes', 'One slider per live route.'],
  marketingOwner: ['Marketing lead', 'Who runs marketing now', 'You, someone on the team, an agency, or no one.'],
  agency: ['Agencies', 'Your history with them', 'Now, before, several, or never.'],
  agencyFee: ['Agency fee', 'What you pay them each month', 'The fee only, not what they spend on ads for you.'],
  agencyWhy: ['Agency outcome', 'What happened, in your words', 'One line.'],
  contentTime: ['Content hours', contentSub, 'Hours you spend posting, writing or filming.'],
  tracking: ['Enquiry source', 'How you know where each enquiry came from', 'Asked, CRM, analytics, guess, or no way to tell.'],
  cycle: ['First sale', 'First contact to first sale', 'How long a new customer takes to decide.'],
  responseTime: ['Reply speed', 'First answer to a new enquiry', 'How long a new enquiry waits for a human.'],
  followUps: ['Follow-ups', 'Chases before you stop', 'How many times you go back to an enquiry that went quiet.'],
  website: ['Website', 'What a visitor can do there', 'Read about you, send an enquiry, book, or buy.'],
  chooseYou: ['Your edge', 'Why customers pick you. Choose one or more', 'Pick every reason that is true.'],
  returnGap: ['Return gap', 'Time between purchases', 'For a customer who comes back.'],
  newVsRepeat: ['Returning revenue', 'Share from past customers', 'Of a normal month’s revenue.'],
  ltv: ['Lifetime value', 'One customer, first sale to last', 'If you know it; otherwise leave it.'],
  topShare: ['Top three', () => `What share of your revenue came from ${topWho()} in the last 90 days?`, () => `${cap(rangeWords(90))}. Largest by revenue in that period. Drag the ring; Not sure is fine.`],
  bestEver: ['Best result', 'Your biggest marketing win', 'In your words.'],
  /* delivery, owner */
  turnedAway: ['Last month', 'In the last month, did you turn work away or start it later than the customer wanted?', 'One fact you can check. It tells Mercer whether delivery is already the limit, without asking you to predict anything.'],
  canDeliverMore: ['More next month', 'Whether more could be delivered next month', 'No longer asked: Mercer reads it from what happened last month.'],
  capacity: ['Capacity', () => `Who does the work, ${unitWord()} completed last month, and how long one takes`, 'Facts about last month. Mercer works the ceiling out from them and shows it for you to correct. Count delivered work, not enquiries.'],
  breaksFirst: ['What runs out', 'What runs out first if work doubled', 'The first thing that gives.'],
  moreWork: ['More work', 'How easily could you handle more work?', 'Capacity you could add, how soon and at what cost. The limit today is not always the best move tomorrow.'],
  hours: ['Your week', 'Hours a week you work in the business', 'What the plan is competing with. The time you could give to the next step is a question of its own.'],
  weekGoes: ['Where it goes', 'Where your week goes. Choose one or more', 'The main activities, so the plan knows what it would be taking time from.'],
  worry: ['If it doubled', 'What would most concern you if the business doubled', 'One of four. It points the plan at the right detail.'],
  holdup: ['Where it sticks', 'Where enquiries or jobs get held up', 'Pick the closest, or say where in your own words.'],
  software: ['Tools in use', 'The tools or processes that already handle that work', 'Type the name where the cursor lands; the fee is optional. The plan builds on what you have first.'],
  spend: ['Budget', 'How much could you put towards getting started?', 'A one-off amount. £0 is fine. Growth spend only, not wages; revenue is not treated as money you can spend.'],
  changeHours: ['Extra hours', () => `How many extra hours could you give to ${nextStepWords()} each week?`, 'Outside the work itself and your current commitments. Team help is counted separately.'],
  terms: ['When money arrives', 'Before, around, or after you incur the costs', 'Cash timing can stop a feasible-looking plan.'],
  wontDo: ['Limits', 'Limits this plan must respect. Choose one or more', 'Not a legal interview: the limits you know about.'],
  teamSize: ['Team', 'Everyone in the business, you and part-timers included', 'Checked against who does the work.'],
  leadTime: ['Wait to start', 'From yes to first day', 'The delay between a sale and delivery.'],
  jobLength: ['Job length', 'One job, start to finish', 'Typical, not the longest.'],
  qualitySlip: ['What slips', 'When you hit the limit. Choose one or more', 'Pick every one you have seen.'],
  subcontract: ['Overflow', 'Who takes work you can’t', 'Partners, someone at a cost, or no one.'],
  holiday: ['Two weeks off', 'The business without you', 'Runs, slows, stops, or never tried.'],
  hiring: [() => (solo() ? 'First hire' : 'Hiring'), 'If more work arrived', 'Now, once steady, no, or can’t find people.'],
  owed: ['Owed', 'Unpaid invoices right now', 'Invoiced and unpaid today, not work in progress.'],
  /* leverage, owner */
  strengths: ['Strengths', 'What you are good at, and what you avoid', 'Six tiles. Drag or tap what you are good at to the left and what you avoid to the right. Orders the plan’s steps around you.'],
  energy: ['Energy at work', 'Work that gives you energy, and work that drains it', 'Seven tiles. Gives energy to the left, drains to the right; leave the rest in the middle. Your own account.'],
  help: ['Who helps', 'Who helps run or deliver the business', 'Tap a seat for each person, or yourself if it is only you. The seat outside the ring is an agency or freelancer.'],
  delegation: ['Handing over', 'What those people can own without coming back to you', 'Pick the line closest to how you work now.'],
  // the polish pack, 10.4: the step is named before anyone is asked to help with it; without a plan the question is about support in general
  network: ['Who could help', () => { const a = firstActionWords(); return a ? `The next step is ${a}. Who could realistically help with it? Choose one or more` : 'Who could realistically help with the work this plan will ask for? Choose one or more'; }, 'Kinds of people, not names. A count is optional. Help that is possible, not help already agreed.'],
  networkStrength: ['How close', 'How strong and available those connections are', 'Known people are not the same as available help.'],
  asked: ['Already asked', 'Have you already asked them?', 'So the plan does not send you back to people you have already tried.'],
  decisionRights: ['Who decides', 'Who can make the decisions this plan requires', 'Me, shared, or someone else. If shared, place each of five decisions.'],
  plannedChanges: ['Changing roles', 'Would you like those responsibilities to change? Choose one or more', 'Keep, delegate, hire, partner, or make them clearer.'],
  personality: ['Personality type', 'Optional. Four either-ors about how you prefer to work', 'A working-style reflection, not a test: it changes which steps are put in front of you, never a figure. Editable.'],
  avoided: ['Put off', 'Tasks you keep putting off. Choose one or more', 'Pick every one that is true. The results name who or what could take each one.'],
  decisionSpeed: ['Decision style', 'How you make decisions', 'Two either-ors. Your statement of preference, not a test.'],
  futureRole: ['Future role', 'Your place in the business in three years', 'The same role, lead only, step back, or leave.'],
  risk: ['Risk', 'Money you could lose on a test that fails', 'None, some, or a lot. Goes into your briefing, not the forecast.'],
  cv: ['CV', 'Your working history, if you want to add it', 'Read in this browser. Adds nothing to the forecast; shapes the briefing.'],
  ownership: ['Owners', 'Who owns the business', 'You alone, or with partners, investors or family. Your own account: Mercer states no legal position.'],
  ownShare: ['Owner share', 'The percentage of the business you own', 'Drag the ring. A round figure is enough.'],
  profitShare: ['Profit share', 'How profit is split between the owners', 'In line with ownership, more to you, less to you, or not agreed.'],
  influence: ['Day to day', 'Who runs the business day to day', 'The person people go to when something needs settling this week.'],
  keyPeople: ['Key people', 'People the business could not lose, you included', 'A count. Nought is an answer.'],
  retain: ['Decisions kept', 'Decisions you mean to keep for yourself. Choose one or more', 'Pick the ones that stay with you whatever else changes.'],
  exitIntent: ['Long-term plan', 'What you intend for the business in the long run', 'Keep it, sell it, hand it on, bring in investment, or undecided.'],
  unresolved: ['Open questions', 'Optional. Anything between the owners that is not settled', 'In your words. It goes into your briefing as written and nowhere else.'],
  funding: ['Funding', 'Where growth money could come from. Choose one or more', 'Profit, savings, a loan or facility, a grant, an investor, none. Not advice.'],
  dataOffer: ['Records', 'Numbers you could bring to a call. Choose one or more', 'Pick every one that exists.'],
  deadline: ['Key date', 'A date that changes the plan', 'In your words.'],
  successWords: ['A good year', 'In your own words', 'Used on the results to speak in your terms.'],
  note: ['Anything else', 'Optional', 'Anything the questions missed.'],
  /* plan */
  readiness: ['First-pass plan', 'Your first-pass plan is ready. Sharpen it, or use it as it stands?', 'This is a rough starting point. A second round will make the plan more specific to your business.'],
  /* the starter bank */
  n01: ['Right now', 'What you do at the moment, and the work you have done', 'No CV is needed. If naming your own strengths is hard, one can be read here to suggest them, and you confirm what it finds.'],
  interest: ['An hour free', 'If you had an hour completely to yourself, what would you choose to do?', 'Whatever it is. What someone does with free time is real evidence of what they will keep doing.'],
  bestAt: ['Most practised', 'What have you spent the most time getting good at?', 'Work, study, a sport, an instrument, a craft. Time spent is evidence; it is not a claim about how good you are.'],
  paidBefore: ['Paid before', 'Have you ever earned money, or helped someone, through any of this?', 'The strongest evidence there is. Unpaid help counts, and so does a one-off.'],
  workStyle: ['Work style', 'Which of these would you most enjoy doing regularly?', 'It changes which directions are compared, never what you are assumed able to do.'],
  n02: ['What to change', 'Asked at the start', ''],
  n03: ['Extra hours', 'How many extra hours could you give this each week?', 'Outside your current commitments. Nothing is assumed beyond what you say.'],
  n04: ['When', 'When that time is available. Choose one or more', 'Only asked where the timing matters.'],
  n05: ['Budget', 'How much could you put towards getting started?', 'A one-off amount. £0 is fine. A test budget, not your savings.'],
  n06: ['Monthly budget', 'What could you spend each month after that?', 'Subscriptions and running costs, separate from the one-off. £0 is fine.'],
  n07: ['How soon', 'How soon would you need it to earn?', 'Income that is urgent rules out slow development.'],
  n08: ['Protected', 'Asked at the start', ''],
  n09: ['Your experience', 'Work or projects you have done, in a line or two', 'Optional: add a CV or portfolio file instead. Read here, sent nowhere.'],
  n10: ['Good at', 'What you are particularly good at. Choose one or more', 'Then which of those you have used to get a result, what people already ask you for help with, and, with one skill picked, what you would learn.'],
  n11: ['Proven', 'Which of those you have used to achieve a result', 'A skill with a result behind it counts for more than an interest.'],
  n12: ['Asked for', 'What people already ask you for help with', 'Demand that already exists next to you.'],
  n13: ['Enjoy and avoid', 'What you enjoy enough to repeat, and what you would rather avoid', 'Ten tiles. Enjoy to the left, avoid to the right; the rest can stay in the middle. Preferences change the ranking, not what you are assumed able to do.'],
  n14: ['Avoid', 'What you would rather avoid', ''],
  n15: ['Willing to learn', 'Of the gaps above, what you would be willing to learn. Choose one or more', 'Only learning that fits the time you have is recommended.'],
  n16: ['Already have', 'Tools, subscriptions or equipment you already have (choose one or more), and any useful qualifications or access', 'What you own is used before anything is suggested to buy.'],
  n17: ['Useful extras', 'Qualifications, languages or specialist access. Choose one or more', 'Broad categories only.'],
  n18: ['Local or remote', 'Whether you can work locally, remotely or either', ''],
  n19: ['Who you know', 'The types of people or businesses you understand well (choose one or more), and the problems you have seen them face', 'Credibility first: a buyer you understand is easier to reach and to help.'],
  n20: ['Their problems', 'Frustrating or costly problems you have seen them face. Choose one or more', 'Start from a problem, not a business category.'],
  n21: ['Access', 'Whether you could speak to a few of them this week, who might help you start, and what support would help', 'The access you have today, not the size of a market.'],
  n22: ['Audience', 'Whether you already have an audience or community', 'Size matters less than access and relevance.'],
  n23: ['Who might help', 'Who might help you get started. Choose one or more', 'Kinds of people, not names.'],
  n24: ['Asked yet', 'How available they are, and whether you have asked', 'No one is assumed to work for free.'],
  n25: ['Your idea', 'Settled by where you are starting', ''],
  n26: ['Tried before', 'Settled by where you are starting', ''],
  /* results 1, D9: the opening branch and its follow-ups. One focused question a screen, short labels, optional free text */
  startPoint: ['Starting point', 'Where are you starting?', 'Each start asks a different set of questions. Nothing is chosen for you.'],
  s01: ['Who would pay', 'Who would pay for it? Choose one or more', 'The people or businesses with the problem, not everyone who might like it.'],
  s02: ['Their problem', 'What do they need solved?', 'In their words if you can. One line.'],
  s03: ['Today', 'What do they do about it today?', 'What they use, pay for or put up with now. It is what your offer competes with.'],
  s04: ['Asked or paid', 'Has anyone asked for it, or paid?', 'Being asked is interest. Being paid is evidence. Each is weighed as what it is.'],
  s05: ['A small version', 'Could you deliver a small version now?', 'A first paid piece of work, not the finished thing.'],
  s06: ['Your ideas', 'Your ideas, in a line each', 'Up to three. A line is enough: the next screens compare them.'],
  s08: ['Asked or paid', 'Which has someone who already asked, or paid?', 'One idea, or none of them.'],
  s09: ['Deliverable', 'Which could you deliver a small version of this month?', 'With the time and tools you have now.'],
  s07: ['One to test', 'If you could test only one this month, which?', 'More than one still stands on what you have said. Your pick decides.'],
  s10: ['What you offered', 'What did you offer, and to whom?', 'One line: what it was and who you put it in front of.'],
  s11: ['The channel', 'Through which channel? Choose one or more', 'Where they saw it, so the plan can tell no demand from no exposure.'],
  s12: ['What happened', 'What happened?', 'What came back, not what it felt like.'],
  s13: ['Roughly how many', 'Roughly how many saw it, replied and bought? Optional', 'Round figures. They separate no demand from no exposure. Leave any you do not know.'],
  s14: ['The price', 'The price you charged, if any. Optional', 'Nought is an answer if it was free.'],
  n27: ['Directions', 'Which of these directions appeals most?', 'Each card shows the buyer, the offer, why it fits you, what the first test would settle and the first test. The order is a comparison, not a score.'],
  n28: ['What puts you off', 'What puts you off the recommended direction. Choose one or more', 'A correction, not a debate.'],
  n29: ['Alone or with someone', 'Whether you would rather begin alone or with someone', 'A partner is only suggested where a skill or a limit calls for one.'],
  n30: ['What you need', () => (S().n27 === 'none' ? 'What would help you most from here' : 'What this direction needs that you have not said you have'), 'Worked out from your own answers. Correct anything that is wrong; nothing here is a judgement of you.'],
  n31: ['First buyer', 'Who would buy the first version, what you would deliver first, and how you would reach them', 'Narrow enough to test.'],
  n32: ['First offer', 'What result you could deliver for them first', 'A deliverable, not a mission.'],
  n33: ['Evidence', 'What evidence there is that they need it (choose one or more), and how you could test interest before spending much', 'Evidence of need is kept separate from enthusiasm.'],
  n34: ['The test', 'How you could test interest before spending much', 'The least costly step that gives a real answer.'],
  n35: ['First delivery', 'How Mercer would deliver the first one', 'Built from the skills, tools and time you have given. Change any step that is wrong.'],
  n36: ['First delivery', 'What the first delivery would require. Choose one or more', ''],
  n37: ['Test price', 'What Mercer would charge for a first test', 'A price with its basis in the open. Change it, or give a price you have charged or a cost you carry and Mercer works from that.'],
  n38: ['Reaching buyers', 'How you will reach the first few potential buyers. Choose one or more', 'One channel that fits your access.'],
  n39: ['Keep going', 'The result Mercer would treat as a yes, and when to look at it', 'Set before the test starts, so the decision is not made on the day by how you feel. Change it if it is wrong.'],
  n40: ['When to stop', 'The cap on money and time, and what would say stop', 'Built from the budget and the time you gave. Change any part of it.'],
  n41: ['Permissions', 'Whether permissions or qualifications are needed before delivery', 'A dependency to check. Mercer states no legal clearance.'],
  n42: ['Make first', 'What you need to create first. Choose one or more', 'Sets which templates and prompts the plan includes.'],
  n43: ['Tools', 'Asked earlier', ''],
  n44: ['Help', 'Introductions or TMA help, if you want them', 'Optional, after the plan. Nothing is automatic.'],
};
const str = (x) => (typeof x === 'function' ? x() : x) ?? '';
const headline = (q) => { const h = HEAD[q.id] ?? [q.id, '', '']; return { title: str(h[0]), sub: str(h[1]) }; };
const explain = (q) => str((HEAD[q.id] ?? [])[2]);

/* ------------------------------------------------------------------ the appetite dial's line (COPY §5, at Roots) */
function appetiteLine(level) {
  const now = S().now;
  if (level === 'none') return 'No growth spend: revenue carried flat';
  if (level === 'boutique') return now ? `${gbp(Math.max(500, 0.05 * now))} a month: Mercer’s default rule` : 'Mercer’s default rule';
  if (level === 'moderate') return 'Spends about a quarter of what you keep on growth, or Mercer’s own figure if that is larger';
  if (level === 'aggressive') return 'The smallest budget that reaches your target';
  if (level === 'maximum') return 'Where more spend stops adding revenue';
  return '';
}

/* ------------------------------------------------------------------ readouts (the contract with feel.js) */
/* Every M.ui instrument takes an optional readout(value) and prints what it returns in its <output class="ui-readout">.
   Each function below is handed the instrument's own value (an option value, [now, most], { min, avg, max }, a level id),
   answers '' while there is nothing to say, and never prints a figure the visitor did not set. An instrument that does
   not know the option ignores it. */
const READOUT = {
  /** an arc of presets: the chosen label, as written on the option */
  arc: (q) => (v) => { const o = optsOf(q).concat(q.opts ?? []).find((x) => x[0] === v); return o ? String(o[1]) : ''; },
  /** Customer lifespan: the chosen stop, then the months Mercer counts for it (the option's own value, the figure the engine
      is given), so "2 years or more" is seen to be counted as 24 and no more */
  stay: (q) => (v) => {
    const o = optsOf(q).concat(q.opts ?? []).find((x) => x[0] === v);
    if (!o) return '';
    return isNum(v) && v > 1 ? `${o[1]}: Mercer counts ${v} months` : String(o[1]);
  },
  /** Retainer: the three fees in one line */
  fee: (v) => {
    if (!v || typeof v !== 'object' || !isNum(v.avg)) return '';
    const typical = `${gbp(v.avg)} a month`;
    return isNum(v.min) && isNum(v.max) && v.max > v.min ? `${typical}, from ${gbp(v.min)} to ${gbp(v.max)}` : typical;
  },
  /** Growth spend: what is spent now, then the most they would */
  spend: (v) => {
    const [a, b] = Array.isArray(v) ? v : [v, null];
    if (!isNum(a)) return '';
    return isNum(b) ? `${gbp(a)} a month now, ${gbp(b)} a month at most` : `${gbp(a)} a month now`;
  },
  /** the appetite dial: the level's name */
  dial: (v) => { const id = v && typeof v === 'object' ? v.level : v; return APPETITE.find((a) => a[0] === id)?.[1] ?? ''; },
};

/** the finds the visitor confirmed on the import step (research.js owns the list) */
const confirmedFinds = () => { try { return (M.research?.found?.() ?? []).filter((f) => f.status === 'confirmed'); } catch (e) { return []; } };
const labelIn = (table, id) => (table.find((x) => x[0] === id) ?? [null, String(id)])[1];
const lower = (t) => String(t).charAt(0).toLowerCase() + String(t).slice(1);

/* ------------------------------------------------------------------ answered, by the shape of the answer */
function answeredQ(q) {
  const st = S();
  const v = st[q.key];
  switch (q.id) {
    case 'goal': return given(st.goal) || st.appetite === 'none' || given(st.milestone);
    case 'appetite': return given(st.appetite);
    case 'sector': return given(st.sector);
    case 'win': return given(st.win) && (st.win !== 'other' || given(st.winOther));
    case 'went': return triedList().length > 0 && triedList().every((id) => given((st.went ?? {})[id]));
    case 'spend': return given(st.budget) || given(st.oneOff);
    case 'software': return Boolean(st.stackAsked);
    // best customers: one to five cards, or none yet
    case 'lastFive': return Boolean(st.bestNone) || (Array.isArray(st.lastFive) && st.lastFive.length >= 1 && st.lastFive.every((x) => x && (given(x.buyer) || given(x.bought) || given(x.found))));
    case 'strengths': return given(st.strengths) || given(st.avoids);
    case 'personality': return given(st.personality);
    case 'import': case 'site': return given(st.site) || confirmedFinds().length > 0;
    case 'energy': return Boolean(v && typeof v === 'object' && ((v.gives ?? []).length || (v.drains ?? []).length));
    case 'decisionSpeed': return typeof v === 'string' && v.length === SPEED_AXES.length;
    // the screen's answer is who decides; a map placed on the rider (or restored from an older save) counts on its own
    case 'decisionRights': return given(st.decides) || Boolean(st.decisionRights && typeof st.decisionRights === 'object' && Object.values(st.decisionRights).some(Boolean));
    case 'repeat': return given(st.repeatBand);
    case 'returned': return Boolean(v && typeof v === 'object' && isNum(v.group) && v.group > 0 && isNum(v.returned));
    case 'enquiries': return given(st.enquiries);
    case 'market': return given(st.reach);
    case 'segment': return given(st.segment);
    case 'trigger': return given(st.trigger) && (st.trigger !== 'other' || given(st.triggerOther));
    case 'holdup': return given(st.holdup) && (st.holdup !== 'other' || given(st.holdupOther));
    case 'hours': return given(st.hours);
    case 'network': return given(st.networkKinds);
    case 'volume': return isNum(st.volume) && given(st.volumePeriod);
    case 'place': return given(st.country) || given(st.place);
    case 'biz': return given(st.biz);
    case 'channel': return doingList().length > 0 || given(st.channel);
    case 'tried': return triedList().length > 0 || st.triedNone === true;
    case 'capacity': return isNum(st.capacity) || isNum(st.servedNow);
    case 'n30': return Array.isArray(st.n30) || given(st.n30);
    case 'n37': return isNum(st.n37) || isNum(st.pricePaid) || isNum(st.unitCost);
    case 'n40': return given(st.n40);
    case 'interest': return given(st.interest);
    case 'paidBefore': return given(st.paidBefore);
    case 'workStyle': return given(st.workStyle);
    case 'n01': return given(st.n01);
    case 'n03': return isNum(st.n03);
    case 'n05': return isNum(st.n05);
    case 'n10': return given(st.n10) || given(st.n10Other);
    case 'n13': return given(st.n13) || given(st.n14);
    case 'n16': return given(st.n16) || given(st.n17);
    case 'n19': return given(st.n19) || given(st.n19Other);
    case 'n21': return given(st.n21);
    case 'n25': return given(st.n25);
    case 'startPoint': return given(st.startPoint);
    case 's01': return given(st.s01) && (!st.s01.includes('other') || given(st.s01Other));
    case 's06': return ideas().length > 0;
    case 's07': return given(v) && standingIdeas().some((x) => x.id === v);
    case 's08': case 's09': return given(v) && (v === 'none' || ideas().some((x) => x.id === v));
    case 's11': return given(st.s11) && (!st.s11.includes('other') || given(st.s11Other));
    case 's13': return isNum(st.s13Saw) || isNum(st.s13Replied) || isNum(st.s13Bought);
    case 's14': return isNum(st.s14);
    case 'n27': return given(st.n27);
    case 'n31': return given(st.n31) || given(st.n31Other);
    case 'n33': return given(st.n33);
    case 'n35': return given(st.n35);
    case 'n39': return given(st.n39) || given(st.n39Text);
    case 'n02': case 'n08': return false;
    default:
      if (q.type === 'pair') return Array.isArray(v) && given(v[0]) && given(v[1]);
      return given(v);
  }
}

/* ------------------------------------------------------------------ what an answer settles (derive) */
/** fill an engine input the visitor stated in other words; never one they typed themselves */
function fill(key, value, from) {
  const st = S(), d = derivedMap();
  if (given(st[key]) && d[key] === undefined) return;
  if (st[key] === value && d[key] === from) return;
  st[key] = value;
  d[key] = from;
  M.flow?.forward?.(key);
}
function unfill(key, from) {
  const st = S(), d = derivedMap();
  if (d[key] !== from) return;
  delete d[key];
  st[key] = null;
  M.flow?.backward?.(key);
}
/** an answer no screen asks any more: the derived value replaces whatever an older save held under it */
function settle(key, value, from) {
  const st = S(), d = derivedMap();
  if (st[key] === value && d[key] === from) return;
  st[key] = value;
  d[key] = from;
  M.flow?.forward?.(key);
}
const spreadOf = (min, max) => { const r = min > 0 ? max / min : 1; return r < 1.25 ? 'fixed' : r < 2 ? 'some' : r < 5 ? 'wide' : 'huge'; };
/** a currency suggested from the place: Ireland and the euro area read as EUR, the United States as USD, the rest GBP.
    A suggestion until the visitor presses a currency (then derived.currency is gone and the press is theirs) */
function currencyFor(place) {
  const p = String(place ?? '').toLowerCase();
  if (/\b(ireland|dublin|cork|galway|limerick|france|paris|germany|berlin|spain|madrid|barcelona|italy|rome|milan|netherlands|amsterdam|belgium|brussels|portugal|lisbon|austria|vienna|finland|helsinki)\b/.test(p)) return 'EUR';
  if (/\b(usa|u\.s\.|united states|new york|texas|california|florida|chicago|boston|seattle)\b/.test(p)) return 'USD';
  return 'GBP';
}
function derive(id) {
  const st = S();
  /* results 1, D9: the opening branch answers the two screens that used to ask for an idea and for what was tried. One or a
     few ideas is an idea; already tried is tried, and what happened (s12) says whether it sold. Nothing asks n25 or n26 now */
  if ((id === 'startPoint' || id === 's12') && given(st.startPoint)) {
    const sp = st.startPoint;
    settle('n25', sp === 'one' || sp === 'few' ? 'yes' : 'no', 'startPoint');
    settle('n26', sp !== 'tried' ? 'no' : st.s12 === 'fewsales' || st.s12 === 'stopped' ? 'sold' : 'offered', 'startPoint');
  }
  /* rebuild 1: what the new answers settle */
  if (id === 'place' || id === 'country') {
    // the country the visitor picked names its currency; a typed place is read for one only where no country is held
    const fromCountry = given(st.country) ? (M.currencyOfCountry?.(st.country) ?? null) : null;
    if (fromCountry && !ownAnswer('currency')) fill('currency', fromCountry, 'place');
    else if (given(st.place) && !ownAnswer('currency')) fill('currency', currencyFor(st.place), 'place');
  }
  if (id === 'currency' && given(st.currency)) { delete derivedMap().currency; }
  if (id === 'repeatWork' || id === 'sells' || id === 'payModel') {
    // what is sold most often sets the buying pattern the engine questions follow; a retainer or subscription payment makes it a retainer
    const primary = st.sellsPrimary ?? (Array.isArray(st.sells) && st.sells.length === 1 ? st.sells[0] : null);
    const pay = Array.isArray(st.payModel) ? st.payModel : [];
    if (primary && SELL_PATTERN[primary]) {
      let pattern = SELL_PATTERN[primary];
      if (pay.includes('retainer') || pay.includes('subscription')) pattern = 'retainer';
      else if (pattern === 'retainer' && pay.length && !pay.includes('retainer') && !pay.includes('subscription')) pattern = 'repeat';
      st.repeatWork = pattern;
    }
  }
  if (id === 'enquiries' || id === 'wins' || id === 'enquiriesRaw' || id === 'winsRaw' || id === 'enquiryPeriod') {
    // the counts are kept as given over the period given; the page's monthly figures follow from them, and the close
    // rate is read from the two counts. A typed ten-stones close rate stands as the visitor's own
    const m = PERIOD_MONTHS[st.enquiryPeriod] ?? 1;
    if (isNum(st.enquiriesRaw)) st.enquiries = m === 1 ? st.enquiriesRaw : Math.round((st.enquiriesRaw / m) * 10) / 10;
    if (isNum(st.winsRaw)) st.wins = m === 1 ? st.winsRaw : Math.round((st.winsRaw / m) * 10) / 10;
    if (isNum(st.enquiriesRaw) && st.enquiriesRaw > 0 && isNum(st.winsRaw)) fill('closeRate', Number(clamp(st.winsRaw / st.enquiriesRaw, 0.05, 1).toFixed(3)), 'enquiries');
    else unfill('closeRate', 'enquiries');
  }
  if (id === 'changeHours' || id === 'hours') {
    // Task 18 asks the time once. Whichever screen answered it, both keys hold it, and the derived one says so
    if (isNum(st.changeHours) && !ownAnswer('hours')) fill('hours', st.changeHours, 'changeHours');
    if (isNum(st.hours) && !ownAnswer('changeHours')) fill('changeHours', Math.min(st.hours, 20), 'hours');
  }
  if (id === 'market' || id === 'reach') {
    // the engine's pool of prospects is twelve months at the reach the visitor stated, a calculated figure and labelled so
    if (isNum(st.reach) && st.reach > 0) fill('market', Math.round(st.reach * 12), 'reach'); else unfill('market', 'reach');
  }
  if (id === 'repeat' || id === 'repeatBand') {
    if (st.repeatBand === 'oneoff') { fill('repeat', 0, 'repeatBand'); fill('retention', 1, 'repeatBand'); }
    else { unfill('repeat', 'repeatBand'); unfill('retention', 'repeatBand'); }
  }
  if (id === 'returned') {
    const r = st.returned;
    if (r && typeof r === 'object' && isNum(r.group) && r.group > 0 && isNum(r.returned)) fill('repeat', Number(Math.min(0.95, Math.max(0, r.returned / r.group)).toFixed(3)), 'returned');
    else unfill('repeat', 'returned');
  }
  if (id === 'volume') {
    const m = PERIOD_MONTHS[st.volumePeriod];
    st.volumeMonthly = isNum(st.volume) && m ? Math.round((st.volume / m) * 10) / 10 : null;
  }
  if (id === 'decisionRights' || id === 'decides') {
    // Me: every decision is yours; someone else: theirs. Shared keeps the map the visitor placed
    if (st.decides === 'me') st.decisionRights = Object.fromEntries(DECISIONS.map(([d]) => [d, 'you']));
    else if (st.decides === 'someone') st.decisionRights = Object.fromEntries(DECISIONS.map(([d]) => [d, 'team']));
  }
  if (id === 'deliveryMode') {
    if (Array.isArray(st.deliveryMode) && st.deliveryMode.length && !onSite() && given(st.radius)) { st.radius = null; M.flow?.backward?.('radius'); }
  }
  if (id === 'repeatWork') {
    if (st.repeatWork === 'once') { fill('repeat', 0, 'repeatWork'); fill('retention', 1, 'repeatWork'); }
    else { unfill('repeat', 'repeatWork'); unfill('retention', 'repeatWork'); }
    if (st.repeatWork !== 'retainer') { unfill('repeat', 'retainerRenew'); unfill('retention', 'retainerMonths'); }
  }
  if (id === 'retainerMonths' && given(st.retainerMonths)) fill('retention', Math.max(1, st.retainerMonths), 'retainerMonths');
  if (id === 'retainer' || id === 'retainerValue' || id === 'retainerMonths' || id === 'repeatWork') {
    const d = derivedMap();
    if (st.repeatWork === 'retainer' && given(st.retainerValue)) {
      // the fee slider's spread settles Price spread, so it is not asked again
      if (id === 'retainer' && isNum(st.retainerMin) && isNum(st.retainerMax)) st.priceSpread = spreadOf(st.retainerMin, st.retainerMax);
      const m = stayMonths();
      if (d.price !== undefined && d.price !== (m ? 'retainer' : 'retainerYear')) { delete d.price; st.price = null; }
      fill('price', Math.round(st.retainerValue * (m ?? 12)), m ? 'retainer' : 'retainerYear');
    } else { unfill('price', 'retainer'); unfill('price', 'retainerYear'); }
  }
  if (id === 'retainerRenew' && given(st.retainerRenew)) fill('repeat', Math.min(0.95, st.retainerRenew / 10), 'retainerRenew');
  if (id === 'appetite' || id === 'goal') {
    const a = st.appetite ?? 'moderate';
    st.basis = a === 'none' ? 'budget' : 'revenue';
    st.goalMode = a === 'none' ? 'max' : 'target';
  }
  if (id === 'software') {
    const names = st.stackNames ?? {};
    const ids = Object.keys(names).filter((k) => given(names[k]));
    const sys = ['crm', 'booking', 'email', 'ai'].filter((k) => ids.includes(k));
    st.systems = ids.length ? sys : ['none'];
  }
}

/* ------------------------------------------------------------------ renderers */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const nextBtn = () => document.getElementById('next');
const hold = () => { const n = nextBtn(); if (n) n.disabled = true; };
/** the one way an answer leaves this file: siblings are already in state; app.js sets the key, derives, flies the leaf */
function commit(q, value, fromEl) {
  const st = S();
  st[q.key] = value;
  derive(q.id);
  if (typeof M.commit === 'function') { M.commit(q.id, value, { fromEl }); return; }
  M.flow?.forward?.(q.engine === 'industry' ? 'industry' : q.key);
}
/** R7: the privacy line with its leader, straight after the field it speaks for. The shell owns the component
    (M.privacyNote, .privacy-note in base.css); without it the same sentence is set as a plain line of the same class */
const PRIVACY_WORDS = 'Stays in this browser. Nothing is shared with TMA unless you choose to share it.';
function privacyNote(host, afterEl) {
  if (!host || host.querySelector('.privacy-note')) return;
  try { if (typeof M.privacyNote === 'function' && M.privacyNote(afterEl ?? host)) return; } catch (e) { /* fall through to the plain line */ }
  if (host.querySelector('.privacy-note') || host.parentElement?.querySelector('.privacy-note')) return;
  const note = el('p', 'privacy-note', esc(savedHere() ? 'Stays in this browser, saved on this device until you press Forget. Nothing is shared with TMA unless you choose to share it.' : PRIVACY_WORDS));
  (afterEl ?? host).insertAdjacentElement(afterEl ? 'afterend' : 'beforeend', note);
}
const savedHere = () => { try { const o = M.save?.on; return Boolean(typeof o === 'function' ? o.call(M.save) : o); } catch (e) { return false; } };
/** a £ figure leads with its sign, so what it is measured in ("a month") follows the figure as a second unit (R13) */
function unitAfter(ctl, words) {
  const face = ctl?.el ? $('.face', ctl.el) : null;
  if (!face || !words || [...face.querySelectorAll('.unit')].some((u) => u.textContent === words)) return;
  const u = el('span', 'unit unit-after', esc(words));
  const inp = $('input', face);
  if (inp) { inp.insertAdjacentElement('afterend', u); if (inp.getAttribute('aria-label')) inp.setAttribute('aria-label', `${inp.getAttribute('aria-label')}, pounds ${words}`); }
}
/** R13: one hint, on the first live rail of the visit, through feel.js (which spends the key for the session) */
const railHint = (ctl) => { try { if (ctl?.el && $('.rail', ctl.el)) M.ui.hint?.(ctl.el, 'Drag, or type any figure', 'rail-type'); } catch (e) { /* the hint is optional */ } };
/** a face-and-rail figure: the slider for every count and £ (SPEC §5 row 1) */
function renderSlider(q, body, enable, over = {}) {
  const money = q.type === 'money' || Boolean(q.money);
  const zero = Boolean(q.zero);
  // a numeric snap is a step (1 = whole counts); a function or false passes through to the rail
  const snap = typeof q.snap === 'number' ? ((n) => (v) => Math.round(v / n) * n)(q.snap) : q.snap;
  const c = M.ui.slider(body, {
    id: q.id, hue: hueOf(q), value: over.value !== undefined ? over.value : (S()[q.key] ?? null),
    unit: money ? '£' : str(q.unit), money, scale: over.scale ?? q.scale ?? [1, 1000], log: q.log !== false, snap, label: headline(q).title,
    onInput: (v) => { if (isNum(v) && (v > 0 || zero)) enable(); else hold(); },
    onCommit: (v) => {
      if (!isNum(v)) return;
      const r = Math.round(v);
      if (r <= 0 && !zero) { hold(); return; }
      if (over.onCommit) over.onCommit(r, c.el); else commit(q, r, c.el);
      enable();
    },
  });
  if (money && q.unit) unitAfter(c, str(q.unit));
  railHint(c);
  if (answeredQ(q)) enable();
  return c;
}
function renderStones(q, body, enable) {
  const multi = q.type === 'multi';
  const options = optsOf(q);
  const CLEAR = ['none', 'nothing'];
  let last = multi ? [...(S()[q.key] ?? [])] : (S()[q.key] ?? null);
  const c = M.ui.stones(body, {
    id: q.id, hue: hueOf(q), options, multi, value: multi ? [...last] : last, label: headline(q).title, foldAt: 6, moreWords: 'more', lead: false, exclusive: EXCLUSIVE,
    onCommit(v) {
      if (multi) {
        const arr = Array.isArray(v) ? v : [];
        const added = arr.find((x) => !last.includes(x));
        const val = CLEAR.includes(added) ? [added] : arr.filter((x) => !CLEAR.includes(x));
        if (JSON.stringify(val) !== JSON.stringify(arr)) c.set(val, true);
        last = [...val];
        if (!val.length) { S()[q.key] = []; hold(); return; }
        commit(q, val, c.el);
      } else {
        if (v === null || v === undefined) { hold(); return; }
        last = v;
        commit(q, v, c.el);
      }
      enable();
    },
  });
  if (answeredQ(q)) enable();
  return c;
}
function renderTens(q, body, enable, over = {}) {
  const c = M.ui.tenStones(body, {
    id: q.id, hue: hueOf(q), value: over.value !== undefined ? over.value : (S()[q.key] ?? null), label: headline(q).title,
    pre: q.pre, preValue: q.preValue, plus: q.plus, unit: str(q.unit),
    onCommit(v) { if (!isNum(v)) return; if (over.onCommit) over.onCommit(v, c.el); else commit(q, v, c.el); enable(); },
  });
  if (answeredQ(q)) enable();
  return c;
}
function renderArc(q, body, enable) {
  const c = M.ui.arc(body, {
    id: q.id, hue: hueOf(q), options: optsOf(q), value: S()[q.key] ?? null, label: headline(q).title,
    readout: (q.id === 'stay' ? READOUT.stay : READOUT.arc)(q),
    onCommit(v) { if (v === null || v === undefined) return; commit(q, v, c.el); enable(); },
  });
  if (answeredQ(q)) enable();
  return c;
}
function renderRing(q, body, enable, over = {}) {
  const c = M.ui.ring(body, {
    id: q.id, hue: hueOf(q), value: over.value !== undefined ? over.value : (S()[q.key] ?? null), unit: over.unit ?? q.unit ?? '%', min: 0, max: 100, step: over.step ?? 5, label: headline(q).title,
    onCommit(v) {
      if (!isNum(v)) return;
      if (over.onCommit) { over.onCommit(v, c.el); enable(); return; }
      // a share of nothing is no answer: the key stays empty and no sentence prints
      if (v <= 0 && !q.zero) { if (given(S()[q.key])) { S()[q.key] = null; M.flow?.backward?.(q.key); } hold(); return; }
      commit(q, v, c.el);
      enable();
    },
  });
  if (answeredQ(q)) enable();
  return c;
}
function renderLine(q, body, enable) {
  const max = q.max ?? 600;
  const c = M.ui.line(body, {
    id: q.id, hue: hueOf(q), value: S()[q.key] ?? '', placeholder: q.placeholder ?? '', max, label: headline(q).title, ghost: q.id,
    onInput: (v) => { if ((v && v.trim()) || q.optional) enable(); else hold(); },
    onCommit(v) {
      const t = String(v ?? '').trim() ? String(v).slice(0, max) : '';
      if (!t) { S()[q.key] = ''; if (!q.optional) hold(); return; }
      commit(q, t, c.el);
      enable();
    },
  });
  if (answeredQ(q) || q.optional) enable();
  return c;
}
function renderYear(q, body, enable) {
  const yr = YEAR();
  const years = S()[q.key];
  const c = M.ui.field(body, {
    id: q.id, hue: hueOf(q), digits: 4, min: 1900, max: yr, start: yr, value: isNum(years) ? yr - years : null, label: headline(q).title,
    onInput: (v) => { if (isNum(v) && v >= 1900 && v <= yr) enable(); else hold(); },
    onCommit(v) { if (!isNum(v) || v < 1900 || v > yr) { hold(); return; } commit(q, yr - v, c.el); enable(); },
  });
  if (answeredQ(q)) enable();
  return c;
}
/** two handles on one rail; o.onCommit(a, b) decides what a half-answer means */
function renderPair(q, body, enable, o) {
  const c = M.ui.pair(body, {
    id: q.id, hue: hueOf(q), value: o.value, labels: o.labels, order: o.order, unit: o.money ? '£' : (o.unit ?? ''), money: Boolean(o.money), scale: o.scale, log: true, label: headline(q).title, band: o.band,
    ...(typeof o.readout === 'function' ? { readout: o.readout } : {}),
    onInput: (v) => { const [a, b] = Array.isArray(v) ? v : [null, null]; if (o.needBoth ? isNum(a) && isNum(b) : isNum(a)) enable(); else hold(); },
    onCommit(v) { const [a, b] = Array.isArray(v) ? v : [null, null]; if (!isNum(a)) { hold(); return; } o.onCommit(Math.round(a), isNum(b) ? Math.round(b) : null, c.el); },
  });
  if (answeredQ(q)) enable();
  return c;
}
/** a fixed mark on a pair's rail (the months band shows revenue now between best and worst) */
function markOn(c, value, [lo, hi], word) {
  const rail = $('.rail', c.el);
  if (!rail || !isNum(value) || value <= 0) return;
  const dLo = lo / 4, dHi = hi * 4;
  const t = clamp(Math.log(value / dLo) / Math.log(dHi / dLo), 0, 1);
  const m = el('i', 'now-mark');
  m.style.left = `${t * 100}%`;
  m.setAttribute('aria-hidden', 'true');
  rail.appendChild(m);
  const lab = el('span', 'now-mark-word small', esc(word));
  lab.style.left = `${t * 100}%`;
  rail.appendChild(lab);
}
/** one slider per line, the total committed as the answer (Outgoings; the split) */
function renderCosts(q, body, enable) {
  const st = S();
  const lines = (st.costLines ??= {});
  const LINES = [['rent', 'Rent and premises'], ['wages', solo() ? 'Wages, yours included' : 'Wages'], ['bills', 'Bills and utilities'], ['loans', 'Loan repayments'], ['other', 'Other']];
  const [lo, hi] = q.scale;
  const any = () => LINES.some(([k]) => isNum(lines[k]));
  if (!any() && given(st.fixedCosts)) lines.other = st.fixedCosts;
  const total = () => LINES.reduce((a, [k]) => a + (isNum(lines[k]) ? lines[k] : 0), 0);
  const wrap = el('div', 'costs');
  body.appendChild(wrap);
  const foot = el('div', 'costs-total tabular');
  const paintTotal = () => { const t = any() ? total() : null; st.fixedCosts = t; foot.innerHTML = t === null ? '' : `<span class="small">Total</span><b class="figure-s">${esc(gbp(t))}</b><span class="unit">a month</span>`; };
  const ctls = LINES.map(([k, label]) => {
    const row = el('div', 'costs-row');
    row.appendChild(el('span', 'costs-lab small', esc(label)));
    const c = M.ui.slider(row, {
      id: `${q.id}.${k}`, hue: hueOf(q), value: isNum(lines[k]) ? lines[k] : null, unit: '£', money: true, scale: [Math.round(lo / 5), Math.round(hi / 5)], label: `${label}, a month`,
      onInput: (v) => { if (isNum(v)) lines[k] = Math.round(v); else delete lines[k]; paintTotal(); if (any()) enable(); else hold(); },
      onCommit: (v) => { if (isNum(v)) lines[k] = Math.round(v); else delete lines[k]; paintTotal(); if (!any()) { hold(); return; } commit(q, total(), c.el); enable(); },
    });
    wrap.appendChild(row);
    return c;
  });
  wrap.appendChild(foot);
  paintTotal();
  if (answeredQ(q)) enable();
  return { el: wrap, focus: () => ctls[0]?.focus(), destroy: () => ctls.forEach((c) => c.destroy()) };
}
function renderSplit(q, body, enable) {
  const st = S();
  const mine = doingList().map((id) => M.DIST_BY?.[id]).filter(Boolean).slice(0, 8);
  const cur = { ...(st[q.key] ?? {}) };
  const sum = () => Object.values(cur).reduce((a, b) => a + (isNum(b) ? b : 0), 0);
  const wrap = el('div', 'split-rows');
  body.appendChild(wrap);
  const ctls = mine.map((d) => {
    const row = el('div', 'split-row');
    row.appendChild(el('span', 'split-lab small', esc(d.name)));
    const c = M.ui.slider(row, {
      id: `${q.id}.${d.id}`, hue: hueOf(q), value: isNum(cur[d.id]) ? cur[d.id] : null, unit: '%', scale: [0, 100], range: [0, 100], log: false, snap: (v) => Math.round(v / 5) * 5, label: `Share of growth spend on ${d.name}`,
      onInput: (v) => { cur[d.id] = isNum(v) ? clamp(Math.round(v), 0, 100) : 0; st[q.key] = { ...cur }; if (sum() > 0) enable(); else hold(); },
      onCommit: (v) => { cur[d.id] = isNum(v) ? clamp(Math.round(v), 0, 100) : 0; if (sum() <= 0) { st[q.key] = { ...cur }; hold(); return; } commit(q, { ...cur }, c.el); enable(); },
    });
    wrap.appendChild(row);
    return c;
  });
  if (answeredQ(q)) enable();
  return { el: wrap, focus: () => ctls[0]?.focus(), destroy: () => ctls.forEach((c) => c.destroy()) };
}

/**
 * the line under the table: what the taps mean, as they happen. Four forms and no other:
 * "On your own", "One person beside you", "A team of {n}", each with " and an agency" when the outside seat is on.
 * n is the seats the visitor pressed. The ring hands over its state ({ seats, agency }); a bare count is read too,
 * and a shape with no count gives no line.
 */
function helpCaption(state) {
  const v = state && typeof state === 'object' ? state : {};
  const n = Array.isArray(v.seats) ? v.seats.filter(Boolean).length : [v.n, v.count, state].find(isNum);
  if (!isNum(n)) return '';
  const base = n <= 0 ? 'On your own' : n === 1 ? 'One person beside you' : `A team of ${Math.round(n)}`;
  return v.agency || v.outside ? `${base} and an agency` : base;
}
/** the table's seats as last committed ({ seats, agency, help }); not a state key, it lives for the visit */
let helpSeats = null;

/* ---- rebuild 1: the parts a screen is built from. A screen is one registry entry; the entries that ride on it
   (`on`) are drawn under it by these, each with a caption, and each rider writes its own key. ---- */
const EXCLUSIVE = ['none', 'nothing', 'unknown', 'unsure', 'notsure', 'nowhere'];
/** a captioned part of a screen: the caption, then whatever the builder puts under it. Returns the part element */
function qpart(host, caption, cls = '') {
  const p = el('div', `q-part ${cls}`.trim());
  if (caption) p.appendChild(el('p', 'q-cap', esc(caption)));
  host.appendChild(p);
  return p;
}
/** a stones row (single or multi) that writes one key through M.commit; None and its like clear the rest of a multi */
function stonesRow(host, q, { id, key, options, multi = false, value, label, caption, onDone, foldAt = 6, commitId, clearable = false, cls = '' }) {
  const p = qpart(host, caption, cls);
  let last = multi ? [...(value ?? [])] : (value ?? null);
  const c = M.ui.stones(p, {
    id, hue: hueOf(q), options, multi, value: multi ? [...last] : last, label: label ?? caption ?? id, foldAt, moreWords: 'more', clearable, lead: false, exclusive: EXCLUSIVE,
    onCommit(v) {
      let out;
      if (multi) {
        const arr = Array.isArray(v) ? v : [];
        const added = arr.find((x) => !last.includes(x));
        out = EXCLUSIVE.includes(added) ? [added] : arr.filter((x) => !EXCLUSIVE.includes(x));
        if (JSON.stringify(out) !== JSON.stringify(arr)) c.set(out, true);
        last = [...out];
      } else { out = v ?? null; last = out; }
      S()[key] = out;
      if (typeof M.commit === 'function') M.commit(commitId ?? key, out, { fromEl: c.el }); else derive(commitId ?? key);
      onDone?.(out, c);
    },
  });
  return c;
}
/** a short free line that writes one key */
function lineRow(host, q, { id, key, placeholder, caption, max = 200, ghost = null, optional = true, onDone, onType, commitId }) {
  const p = qpart(host, caption);
  const c = M.ui.line(p, {
    id, hue: hueOf(q), value: S()[key] ?? '', placeholder: placeholder ?? '', max, label: caption ?? id, ghost,
    // the polish pack, 9: a row the screen waits for says so while the visitor types (onType gets the trimmed text on
    // every keystroke), so Continue stands as soon as the answer is valid, not after a click elsewhere
    onInput: (v) => { if (onType) onType(String(v ?? '').trim().slice(0, max)); },
    onCommit(v) {
      const t = String(v ?? '').trim().slice(0, max);
      S()[key] = t;
      if (t || optional) { if (typeof M.commit === 'function') M.commit(commitId ?? key, t, { fromEl: c.el }); }
      onDone?.(t, c);
    },
  });
  return c;
}
/** a slider that writes one key; zero allowed where the caller says so */
function sliderRow(host, q, { id, key, unit, money = false, scale, snap, zero = false, caption, label, onDone, commitId, log }) {
  const p = qpart(host, caption);
  const step = typeof snap === 'number' ? ((n) => (v) => Math.round(v / n) * n)(snap) : snap;
  const c = M.ui.slider(p, {
    id, hue: hueOf(q), value: S()[key] ?? null, unit: money ? '£' : (unit ?? ''), money, scale: scale ?? [1, 1000], log: log !== false, snap: step, label: label ?? caption ?? id,
    onInput: () => {},
    onCommit(v) {
      if (!isNum(v)) return;
      const r = Math.round(v);
      if (r < 0 || (r === 0 && !zero)) return;
      S()[key] = r;
      if (typeof M.commit === 'function') M.commit(commitId ?? key, r, { fromEl: c.el });
      onDone?.(r, c);
    },
  });
  if (money && unit) unitAfter(c, unit);
  return c;
}
/** choice cards: feel's M.ui.cards when it is there, else a column of card-shaped buttons of my own (whole card clickable,
    aria-pressed, the label and a line of words). options: [{ v, label, sub, lines[] }] */
function cardsRow(host, q, { id, options, value, multi = false, caption, label, onCommit }) {
  const p = qpart(host, caption, 'q-cards-part');
  if (typeof M.ui.cards === 'function') {
    /* the cockpit brief, 10: a card shows its label and a few-word qualifier; its explanation is revealed on intent. Feel's
       cards take the label and the qualifier; the lines a card carries go into a disclosure under it that opens for the
       selected card, on hover and on focus (questions.css), and never as a popover over the tree. */
    const opts = options.map((o) => ({ v: o.v, label: o.label, sub: o.sub ?? '' }));
    const wordy = options.some((o) => (o.lines ?? []).length > 0);
    const c = M.ui.cards(p, { id, hue: hueOf(q), options: opts, value, multi, exclusive: EXCLUSIVE, lead: false, ...(wordy ? { columns: 1 } : {}), label: label ?? caption ?? id, onCommit });
    try {
      const btns = [...p.querySelectorAll('[role="radio"], [role="checkbox"]')];
      options.forEach((o, i) => {
        const lines = (o.lines ?? []).filter(Boolean);
        if (!lines.length) return;
        const b = btns.find((x) => x.dataset && String(x.dataset.v) === String(o.v)) ?? btns[i];
        if (!b || b.querySelector('.q-card-why')) return;
        const why = el('span', 'q-card-why');
        why.innerHTML = lines.map((l) => `<span>${esc(l)}</span>`).join('');
        b.appendChild(why);
      });
    } catch (e) { /* the cards stand without their disclosure */ }
    return c;
  }
  const wrap = el('div', 'q-cards');
  wrap.setAttribute('role', multi ? 'group' : 'radiogroup');
  wrap.setAttribute('aria-label', label ?? caption ?? id);
  wrap.dataset.q = id;
  let cur = multi ? [...(value ?? [])] : (value ?? null);
  const btns = options.map((o) => {
    const b = el('button', 'q-card');
    b.type = 'button';
    b.dataset.v = String(o.v);
    b.setAttribute('role', multi ? 'checkbox' : 'radio');
    b.innerHTML = `<span class="q-card-tick" aria-hidden="true"></span><span class="q-card-body"><b class="q-card-title">${esc(o.label)}</b>${o.sub ? `<span class="q-card-sub small">${esc(o.sub)}</span>` : ''}${(o.lines ?? []).map((l) => `<span class="q-card-line small">${esc(l)}</span>`).join('')}</span>`;
    b.addEventListener('click', () => {
      if (multi) { const i = cur.indexOf(o.v); if (i >= 0) cur.splice(i, 1); else cur.push(o.v); cur = EXCLUSIVE.includes(o.v) ? [o.v] : cur.filter((x) => !EXCLUSIVE.includes(x)); }
      else cur = o.v;
      paint();
      try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(b) }); } catch (e) { /* no sound */ }
      onCommit?.(multi ? [...cur] : cur);
    });
    b.addEventListener('keydown', (e) => {
      const i = btns.indexOf(b);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
    });
    wrap.appendChild(b);
    return b;
  });
  const isOn = (v) => (multi ? cur.includes(v) : cur === v);
  const paint = () => {
    let first = true;
    btns.forEach((b, i) => { const on = isOn(options[i].v); b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); b.tabIndex = on || (first && !options.some((o) => isOn(o.v))) ? 0 : -1; if (b.tabIndex === 0) first = false; });
  };
  paint();
  p.appendChild(wrap);
  return { el: wrap, get: () => (multi ? [...cur] : cur), set: (v) => { cur = multi ? [...(v ?? [])] : v; paint(); }, focus: () => (btns.find((b) => b.tabIndex === 0) ?? btns[0])?.focus(), destroy() {} };
}
/* ---- final 1, Task 09: three controls this file asks feel for, each with a plain alternative of its own ----
   A dot-density field with a live count, a delivery-mode diagram and a ranking control are feel's to build. Where one
   is not there, the question falls back to the alternative the pack names (a typed count, text choices, up and down
   with clear numbers) rather than to nothing. */
/** an ordered list: feel's M.ui.rank where it exists, else numbered rows with Move up and Move down */
function rankRow(host, q, { id, items, value, caption, label, onCommit }) {
  const p = qpart(host, caption, 'q-rank-part');
  const ids = items.map((i) => i.v);
  let order = [...(Array.isArray(value) ? value : []).filter((v) => ids.includes(v)), ...ids.filter((v) => !(value ?? []).includes(v))];
  if (typeof M.ui.rank === 'function') {
    // feel's control: the chosen ones become a numbered list, moved with its own buttons. Its options are what was
    // already selected, so taking one out of the order takes it out of the answer, which is what the press looks like
    const c = M.ui.rank(p, {
      id, hue: hueOf(q), options: items.map((i) => ({ v: i.v, label: i.label })), value: [...order], label: label ?? caption ?? id,
      lead: false, orderWords: 'Most customers won first', restWords: 'Nothing ordered yet',
      onCommit: (v) => { order = Array.isArray(v) && v.length ? v : order; onCommit?.([...order]); },
    });
    return { el: c.el, focus: () => c.focus?.(), destroy: () => c.destroy?.(), get: () => [...order] };
  }
  const list = el('ol', 'q-rank');
  list.dataset.q = id;
  list.setAttribute('aria-label', label ?? caption ?? id);
  p.appendChild(list);
  const move = (v, by) => {
    const i = order.indexOf(v);
    const j = i + by;
    if (i < 0 || j < 0 || j >= order.length) return;
    order.splice(j, 0, ...order.splice(i, 1));
    paint(v, by);
    onCommit?.([...order]);
  };
  const paint = (focusV, by) => {
    list.innerHTML = '';
    order.forEach((v, i) => {
      const row = el('li', 'q-rank-row');
      row.appendChild(el('span', 'q-rank-n', String(i + 1)));
      row.appendChild(el('span', 'q-rank-lab', esc(items.find((x) => x.v === v)?.label ?? v)));
      const up = el('button', 'stone small', 'Move up');
      const down = el('button', 'stone small', 'Move down');
      up.type = 'button'; down.type = 'button';
      up.disabled = i === 0; down.disabled = i === order.length - 1;
      up.setAttribute('aria-label', `Move ${items.find((x) => x.v === v)?.label ?? v} up`);
      down.setAttribute('aria-label', `Move ${items.find((x) => x.v === v)?.label ?? v} down`);
      up.addEventListener('click', () => { tapEl(up); move(v, -1); });
      down.addEventListener('click', () => { tapEl(down); move(v, 1); });
      row.append(up, down);
      list.appendChild(row);
    });
    if (focusV) {
      const i = order.indexOf(focusV);
      const row = list.children[i];
      const b = row?.querySelector(by < 0 ? '.stone' : '.stone:last-of-type');
      (b && !b.disabled ? b : row?.querySelector('.stone:not([disabled])'))?.focus({ preventScroll: true });
    }
  };
  paint();
  return { el: list, focus: () => list.querySelector('.stone:not([disabled])')?.focus(), destroy() {}, get: () => [...order] };
}
/** a searchable list: type, then press one of the hits. The pick stays on show under the field */
function searchPick(host, q, { id, caption, placeholder, value, label, search, labelOf, keyOf, onPick, hint }) {
  const p = qpart(host, caption, 'q-search-part');
  const box = el('div', 'q-search');
  box.dataset.q = id;
  const input = el('input', 'q-search-in');
  input.type = 'search';
  input.autocomplete = 'off';
  input.placeholder = placeholder ?? 'Search';
  input.setAttribute('aria-label', label ?? caption ?? 'Search');
  const hits = el('div', 'q-search-hits');
  hits.setAttribute('role', 'listbox');
  hits.setAttribute('aria-label', label ?? caption ?? 'Results');
  const say = el('p', 'small q-search-say');
  say.setAttribute('role', 'status');
  box.append(input, hits, say);
  if (hint) box.appendChild(el('p', 'small q-search-hint', esc(hint)));
  p.appendChild(box);
  let picked = value ?? null;
  const sayPick = () => { const it = picked ? (search('') ?? []).concat(search(String(picked))).find((x) => keyOf(x) === picked) : null; say.textContent = picked ? `Chosen: ${it ? labelOf(it) : picked}` : ''; };
  const paint = () => {
    hits.innerHTML = '';
    const list = search(input.value) ?? [];
    list.forEach((it) => {
      const b = el('button', 'stone hit', esc(labelOf(it)));
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(keyOf(it) === picked));
      b.addEventListener('click', () => { picked = keyOf(it); tapEl(b); paint(); sayPick(); onPick?.(it); });
      b.addEventListener('keydown', (e) => {
        const bs = [...hits.querySelectorAll('.stone')];
        const i = bs.indexOf(b);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); bs[(i + 1) % bs.length]?.focus(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); (i === 0 ? input : bs[i - 1])?.focus(); }
      });
      hits.appendChild(b);
    });
  };
  input.addEventListener('input', paint);
  input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); hits.querySelector('.stone')?.focus(); } else if (e.key === 'Enter') { e.preventDefault(); hits.querySelector('.stone')?.click(); } });
  paint();
  sayPick();
  return { el: box, focus: () => input.focus({ preventScroll: true }), destroy() {}, get: () => picked, set: (v) => { picked = v; paint(); sayPick(); } };
}
/** what a card holds: the anonymous best customer (brief 8.3), feel's shape { label, buyer, bought, found, valuable, value, ease }. No names */
const CARD_FIELDS = [
  ['buyer', 'Type of buyer', BUYERS],
  ['found', 'How they found you', FOUND_BY],
  ['valuable', 'What made them good for you', VALUED, 'multi'],
  ['ease', 'How easy the work was', EASE],
];
const blankCard = () => ({ label: '', buyer: null, bought: '', found: null, bin: null, valuable: [], value: null, ease: null });
/** a card with the bin the older readers count (warm or cold, from how they found the business) */
const withBin = (c) => ({ ...c, valuable: Array.isArray(c.valuable) ? [...c.valuable] : [], bin: c.found ? FOUND_BIN[c.found] ?? 'unknown' : c.bin ?? null });
/** one to five compact cards: feel's M.ui.clientCards with this file's words, plus a "No customers yet" press of my own
    beside it (feel's get() is [] for none; the press says the none is deliberate). Without feel's, a fallback of my own */
function clientCardsRow(host, q, { id, value, onCommit, onNone, none }) {
  if (typeof M.ui.clientCards === 'function') {
    const c = M.ui.clientCards(host, {
      id, hue: hueOf(q), value: (Array.isArray(value) ? value : []).map(withBin), max: 5, label: headline(q).title,
      cardWords: 'Customer', firstWords: 'Add a customer', addWords: 'Add another customer', noneWords: 'No customers added yet',
      fields: { label: { label: 'A label for them, not a name', placeholder: 'e.g. the café; the first retainer' }, buyer: { label: 'Type of buyer', options: BUYERS }, bought: { label: 'What they bought', placeholder: 'e.g. a full rewire; a monthly retainer' }, found: { label: 'How they found you', options: FOUND_BY }, valuable: { label: 'What made them good for you', options: VALUED }, value: { label: 'Approximate value, if known' }, ease: { label: 'How easy the work was', options: EASE } },
      onInput: (arr) => { paintNone(arr); onNone?.(false); },
      onCommit: (cards) => { paintNone(cards); onCommit((Array.isArray(cards) ? cards : []).map(withBin)); },
    });
    const noneBtn = el('button', 'stone client-none', 'No customers yet');
    noneBtn.type = 'button';
    noneBtn.setAttribute('aria-pressed', String(Boolean(none)));
    const paintNone = (arr) => { noneBtn.hidden = (Array.isArray(arr) ? arr : (c?.get?.() ?? [])).length > 0; };
    noneBtn.addEventListener('click', () => { const on = noneBtn.getAttribute('aria-pressed') !== 'true'; noneBtn.setAttribute('aria-pressed', String(on)); try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(noneBtn) }); } catch (e) { /* no sound */ } onNone?.(on); });
    host.appendChild(noneBtn);
    paintNone(c.get?.());
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); noneBtn.remove(); }, get: () => c.get() };
  }
  const wrap = el('div', 'client-cards');
  wrap.dataset.q = id;
  host.appendChild(wrap);
  const list = el('div', 'client-list');
  wrap.appendChild(list);
  const foot = el('div', 'client-foot');
  const add = el('button', 'stone', 'Add a customer');
  add.type = 'button';
  const noneBtn = el('button', 'stone client-none', 'No customers yet');
  noneBtn.type = 'button';
  noneBtn.setAttribute('aria-pressed', String(Boolean(none)));
  foot.append(add, noneBtn);
  wrap.appendChild(foot);
  let cards = (Array.isArray(value) ? value : []).map((c) => ({ ...blankCard(), ...c }));
  const ctls = [];
  // the card objects stay the ones the rows hold; only the bin is written back, and copies go out
  const emit = () => { cards.forEach((c) => { c.bin = c.found ? FOUND_BIN[c.found] ?? 'unknown' : c.bin ?? null; }); onCommit(cards.map(withBin)); };
  const paint = () => {
    ctls.splice(0).forEach((c) => c.destroy?.());
    list.innerHTML = '';
    cards.forEach((card, i) => {
      const box = el('div', 'client-card');
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', `Customer ${i + 1}`);
      const head = el('div', 'client-head');
      head.appendChild(el('b', 'client-n', `Customer ${i + 1}`));
      const rm = el('button', 'stone small client-rm', 'Remove');
      rm.type = 'button';
      rm.addEventListener('click', () => { cards.splice(i, 1); paint(); emit(); add.focus({ preventScroll: true }); });
      head.appendChild(rm);
      box.appendChild(head);
      const bought = M.ui.line(box, {
        id: `${id}.${i}.bought`, hue: hueOf(q), value: card.bought ?? '', placeholder: 'e.g. a full rewire; a monthly retainer', max: 120, label: `Customer ${i + 1}: what they bought`, ghost: null,
        onInput: () => {}, onCommit(v) { card.bought = String(v ?? '').trim().slice(0, 120); emit(); },
      });
      box.insertBefore(el('p', 'q-cap', 'What they bought'), bought.el);
      ctls.push(bought);
      CARD_FIELDS.forEach(([k, cap2, opts, mode]) => {
        const multi = mode === 'multi';
        const p = qpart(box, cap2, 'client-part');
        const c = M.ui.stones(p, {
          id: `${id}.${i}.${k}`, hue: hueOf(q), options: opts, multi, value: multi ? [...(card[k] ?? [])] : (card[k] ?? null), label: `Customer ${i + 1}: ${cap2}`, foldAt: 8,
          onCommit(v) { card[k] = multi ? [...(Array.isArray(v) ? v : [])] : (v ?? null); emit(); },
        });
        ctls.push(c);
      });
      // an approximate value, if known: kept on the card and shown back; never an average, never a price
      const val = M.ui.slider(box, {
        id: `${id}.${i}.value`, hue: hueOf(q), value: isNum(card.value) ? card.value : null, unit: '£', money: true, scale: [100, 50000], log: true, label: `Customer ${i + 1}: approximate value, if known`,
        onInput: () => {}, onCommit(v) { card.value = isNum(v) && v > 0 ? Math.round(v) : null; emit(); },
      });
      box.insertBefore(el('p', 'q-cap', 'Approximate value, if known'), val.el);
      ctls.push(val);
      list.appendChild(box);
    });
    add.hidden = cards.length >= 5;
    noneBtn.hidden = cards.length > 0;
  };
  add.addEventListener('click', () => { if (cards.length >= 5) return; cards.push(blankCard()); noneBtn.setAttribute('aria-pressed', 'false'); onNone?.(false); paint(); emit(); list.lastElementChild?.querySelector('textarea, input, button')?.focus({ preventScroll: true }); });
  noneBtn.addEventListener('click', () => { const on = noneBtn.getAttribute('aria-pressed') !== 'true'; noneBtn.setAttribute('aria-pressed', String(on)); onNone?.(on); });
  paint();
  return { el: wrap, focus: () => (cards.length ? list.querySelector('textarea, input, button') : add)?.focus(), destroy: () => ctls.forEach((c) => c.destroy?.()) };
}
/** the visitor's own words for a group of customers, from the id and the tables above */
const buyerWord = (id) => ({ consumer: 'individuals', micro: 'small businesses', mid: 'mid-sized firms', enterprise: 'large companies', public: 'public sector bodies and charities' }[id] ?? '');
/** a press that sounds like the rest of the page, wherever feel is loaded */
const tapEl = (b) => { try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(b) }); } catch (e) { /* no sound */ } };
/** the next step the plan names, for the hours question; without one, the goal being worked on (Task 18) */
/** the polish pack, 8: the dates a period covers, counted back from today, so a count is never for "a normal period" */
function rangeWords(days) {
  const end = new Date(), start = new Date(end.getTime() - days * 86400000);
  const f = (d, withYear) => `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}${withYear ? ` ${d.getFullYear()}` : ''}`;
  return `${f(start, start.getFullYear() !== end.getFullYear())} to ${f(end, true)}`;
}
const PERIOD_DAYS = { month: 30, quarter: 90, year: 365 };
/** the polish pack, 8: three customers are compared only where there are three to compare */
const topWho = () => { const n = S().servedNow ?? S().capacity; return isNum(n) && n > 0 && n < 3 ? 'your existing customers' : 'your three largest customers'; };
/** the first action's words when a plan has named one, else null (nextStepWords falls back to a phrase; a question that
    must not pretend a step exists reads this one) */
function firstActionWords() {
  try {
    const a = M.plan?.firstAction ?? M.plan?.first ?? null;
    const t = typeof a === 'function' ? null : (a?.title ?? a?.action ?? null);
    if (given(t)) return String(t).replace(/\.$/, '').toLowerCase().slice(0, 60);
  } catch (e) { /* no plan yet */ }
  return null;
}
function nextStepWords() {
  try {
    const a = M.plan?.firstAction ?? M.plan?.first ?? null;
    const t = typeof a === 'function' ? null : (a?.title ?? a?.action ?? null);
    if (given(t)) return String(t).replace(/\.$/, '').toLowerCase().slice(0, 60);
  } catch (e) { /* no plan yet */ }
  return 'working on this goal';
}

/* ------------------------------------------------------------------ final 1, D6: Mercer proposes, the visitor corrects

   Five screens used to hand Mercer's work back to the visitor: can you deliver, what could you charge, what would
   persuade you to continue, what would make you stop, and what skills or support do you need. Each is now a proposal:
   what Mercer would do, the answers it was built from, a press to take it and a press to change it. Nothing is
   invented to fill a gap. Where a fact is genuinely decisive and missing, the screen asks one small observable
   question for it and the proposal appears once it is answered. */
const said = (id, words) => (words ? { id, words } : null);
const basisWords = (basis) => (basis ?? []).filter(Boolean).map((b) => b.words).filter(Boolean);
/** one proposal on a screen: the lead sentence, any steps under it, what it was built from, take it or change it */
function proposalRow(host, q, { id, lines = [], basis = [], acceptWords = 'That works', changeWords = 'Change it', onAccept, editor, accepted = false }) {
  const wrap = el('div', 'q-proposal');
  wrap.dataset.q = id;
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', `Mercer’s proposal: ${headline(q).title}`);
  wrap.appendChild(el('p', 'q-prop-lead', esc(lines[0] ?? '')));
  const rest = lines.slice(1).filter(Boolean);
  if (rest.length) {
    const ul = el('ul', 'q-prop-lines');
    rest.forEach((t) => ul.appendChild(el('li', '', esc(t))));
    wrap.appendChild(ul);
  }
  const why = basisWords(basis);
  if (why.length) wrap.appendChild(el('p', 'small q-prop-why', esc(`Because you said: ${listWords(why)}.`)));
  const acts = el('div', 'q-prop-acts');
  const yes = el('button', 'stone', esc(acceptWords));
  const no = el('button', 'stone', esc(changeWords));
  yes.type = 'button'; no.type = 'button';
  yes.setAttribute('aria-pressed', String(Boolean(accepted)));
  no.setAttribute('aria-pressed', 'false');
  acts.append(yes, no);
  wrap.appendChild(acts);
  const editHost = el('div', 'q-prop-edit');
  editHost.hidden = true;
  wrap.appendChild(editHost);
  host.appendChild(wrap);
  let built = null;
  const open = () => {
    editHost.hidden = false;
    yes.setAttribute('aria-pressed', 'false');
    no.setAttribute('aria-pressed', 'true');
    if (!built) built = editor?.(editHost) ?? null;
    built?.focus?.();
  };
  yes.addEventListener('click', () => { editHost.hidden = true; yes.setAttribute('aria-pressed', 'true'); no.setAttribute('aria-pressed', 'false'); tapEl(yes); onAccept?.(); });
  no.addEventListener('click', () => { tapEl(no); open(); });
  return { el: wrap, focus: () => yes.focus({ preventScroll: true }), destroy: () => { built?.destroy?.(); wrap.remove(); }, open };
}
/** the buyer of the first version, in the visitor's own words */
const firstBuyerWords = () => {
  const st = S(), d = direction();
  if (given(st.n31Other)) return String(st.n31Other);
  if (given(st.n31) && st.n31 !== 'other' && st.n31 !== 'direction') return lower(labelIn(N19, st.n31));
  if (d?.buyer) return String(d.buyer);
  const g = (st.n19 ?? []).filter((x) => x !== 'other');
  return g.length ? lower(labelIn(N19, g[0])) : 'the first person you speak to';
};
/** what the first version delivers, in the visitor's own words */
const firstOfferWords = () => {
  const st = S(), d = direction();
  if (given(st.n32Other)) return String(st.n32Other);
  if (given(st.n32) && st.n32 !== 'other') { const off = Array.isArray(d?.offers) ? d.offers : []; const m = /^d(\d)$/.exec(String(st.n32)); if (m && off[+m[1]]) return String(off[+m[1]]); return lower(labelIn(N32, st.n32)); }
  return d?.offer ? String(d.offer) : '';
};
/** N35: the first delivery, from what the visitor has said they can do and own. No step needs anything they have not named */
function deliveryProposal() {
  const st = S(), d = direction();
  const offer = firstOfferWords();
  const buyer = firstBuyerWords();
  if (!given(offer) && !d) return null;
  const what = given(offer) ? offer : 'the first version';
  const tools = (st.n16 ?? []).filter((x) => x !== 'none').map((x) => lower(labelIn(N16, x)));
  const basis = [
    said('n32', given(offer) ? `you would deliver ${what}` : ''),
    said('n31', buyer ? `the first buyer is ${buyer}` : ''),
    said('n16', tools.length ? `you already have ${listWords(tools)}` : ''),
    said('n03', isNum(st.n03) ? `${plural(st.n03, 'hour', 'hours')} a week` : ''),
  ].filter(Boolean);
  const lines = [
    `Start with one customer: deliver ${what} by hand for ${buyer}, and keep what you learn.`,
    `Agree what a good result looks like before you start, in one sentence they would recognise.`,
    `Do the work yourself for the first one, even the parts you would later hand over.`,
    `Show them the result and ask what they would change.`,
    tools.length ? `Use what you have: ${listWords(tools)}. Nothing new is needed for the first one.` : '',
    isNum(st.n03) && st.n03 < 5 ? `Keep it inside ${plural(st.n03, 'hour', 'hours')} a week: a first delivery that needs more than that is too big to test.` : '',
  ].filter(Boolean);
  return { value: 'yes', lines, basis };
}
/** N37: a first-test price. Either a band someone has researched, or a figure the visitor has already been paid, or nothing */
function priceProposal() {
  const st = S(), d = direction();
  if (isNum(st.pricePaid) && st.pricePaid > 0) {
    return { value: Math.round(st.pricePaid), basis: [said('pricePaid', `you have been paid ${gbp(st.pricePaid)} for work like this`)].filter(Boolean),
      lines: [`Start the test at ${gbp(st.pricePaid)}, the price you have been paid before.`, 'A first test is not the place to find out whether a new price works as well as a known one.'] };
  }
  if (d && isNum(d.priceLow) && isNum(d.priceHigh) && d.priceHigh > 0) {
    const basis = [said('n27', `you chose ${d.name}`), d.priceBasis ? said('n27', `the range comes from ${d.priceBasis}`) : null].filter(Boolean);
    const cost = isNum(st.unitCost) && st.unitCost > 0 ? st.unitCost : null;
    return { value: Math.round(d.priceLow), basis,
      lines: [`Price the first test at ${gbp(d.priceLow)}, the lower end of ${gbp(d.priceLow)} to ${gbp(d.priceHigh)}.`,
        'The lower end because it is a test: you are buying an answer, not setting a price list.',
        cost ? `Your own cost to deliver one is ${gbp(cost)}. Below that, each test is something you are paying for.` : ''].filter(Boolean) };
  }
  if (isNum(st.unitCost) && st.unitCost > 0) {
    return { value: null, basis: [said('unitCost', `one delivery costs you ${gbp(st.unitCost)}`)].filter(Boolean),
      lines: [`No comparable price has been researched for this, so Mercer will not invent one.`,
        `What is known is your own cost: ${gbp(st.unitCost)} a delivery. A test priced under that is a decision to pay for the answer.`,
        'Set a figure you would be comfortable saying out loud, or leave it and the plan asks for three quotes from comparable offers first.'] };
  }
  return null;
}
/** the weeks a first test would run: from how soon income is needed, or the months on the goal */
function testWeeks() {
  const st = S();
  if (isNum(st.n40Weeks) && st.n40Weeks > 0) return st.n40Weeks;
  if (st.n07 === 'soon') return 4;
  if (st.n07 === 'longer') return 8;
  return 6;
}
/** N39: the result that says carry on, and when to look at it */
function milestoneProposal() {
  const st = S();
  const weeks = testWeeks();
  const buyer = firstBuyerWords();
  const method = st.n34;
  const test = { conversation: 'conversations', sample: 'the sample', pilot: 'the paid pilot', manual: 'doing it by hand for one customer' }[method] ?? 'the test';
  const line = method === 'pilot' || method === 'manual'
    ? `One ${buyer} pays for it inside ${plural(weeks, 'week', 'weeks')}.`
    : method === 'sample'
      ? `Three people ask for the sample and two come back with a question, inside ${plural(weeks, 'week', 'weeks')}.`
      : `Three of the first ten people you speak to ask what it would cost, inside ${plural(weeks, 'week', 'weeks')}.`;
  const basis = [
    said('n34', given(method) ? `you would test it with ${test}` : ''),
    said('n07', st.n07 === 'soon' ? 'you need it to earn soon' : st.n07 === 'longer' ? 'you can build for longer' : ''),
    said('n03', isNum(st.n03) ? `${plural(st.n03, 'hour', 'hours')} a week` : ''),
  ].filter(Boolean);
  return { value: line, weeks, lines: [line, `Look at it once, at ${plural(weeks, 'week', 'weeks')}, rather than reading every reply as a verdict.`], basis };
}
/** N40: the cap on money and time, and the condition that says stop. Built from the budget and the time already given */
function stopProposal() {
  const st = S();
  const weeks = testWeeks();
  const spend = isNum(st.n05) ? st.n05 : null;
  const money = spend === null ? '' : spend === 0 ? 'You said you could spend nothing on a test, so money is not the cap: time is.' : `Stop at ${gbp(spend)} spent, the test budget you gave.`;
  const silence = 'Stop if nobody you speak to asks what it costs: that is a clearer answer than a slow no.';
  const line = spend && spend > 0
    ? `${gbp(spend)} or ${plural(weeks, 'week', 'weeks')}, whichever comes first.`
    : `${cap(plural(weeks, 'week', 'weeks'))}, and no money beyond what you already pay for.`;
  const basis = [
    said('n05', spend === null ? '' : spend > 0 ? `you could spend ${gbp(spend)} to test an idea` : 'you could spend nothing to test an idea'),
    said('n06', isNum(st.n06) && st.n06 > 0 ? `${gbp(st.n06)} a month of running costs` : ''),
    said('n07', st.n07 === 'soon' ? 'you need it to earn soon' : ''),
  ].filter(Boolean);
  return { value: line, weeks, spend, lines: [line, money, silence].filter(Boolean), basis };
}
/** N30: what the chosen direction needs that the visitor has not said they have. A gap is never a judgement of the person */
function gapProposal() {
  const st = S(), d = direction();
  const ev = advEvidence();
  const gaps = [];
  const add = (id, text, why) => gaps.push({ id, text, why });
  if (dirNeeds('needsPermission')) add('sector', 'A licence or registration to check before you deliver', 'this kind of work is often regulated');
  if (!ev.proven && !ev.paid) add('sector', 'One result you can point to, even a small unpaid one', 'nothing you have said yet shows this work done');
  if (st.n21 === 'find' || (!ev.access && !(st.n23 ?? []).some((x) => x !== 'none'))) add('buyers', 'A way to reach the first few buyers', 'you said you would need to find them');
  if (dirNeeds('needsPartner') || st.n29 === 'with') add('technical', 'Someone to cover the part you would rather not do', 'this direction needs a hand you have not named');
  if (Array.isArray(d?.assets) && d.assets.length) d.assets.slice(0, 2).forEach((a) => add('technical', `${cap(String(a))} to show people`, 'the direction needs something to show'));
  if (isNum(st.n05) && st.n05 === 0) add('accountability', 'A first version that costs nothing but your time', 'your test budget is nought');
  if ((st.n16 ?? []).filter((x) => x !== 'none').length === 0) add('technical', 'The tools the first delivery needs', 'you have not named any tools yet');
  const noDirection = st.n27 === 'none' || !d;
  if (!gaps.length) return { value: [], gaps: [], lines: [noDirection ? 'Nothing obvious is missing from what you have told Mercer.' : 'Nothing here is missing: what this direction needs, you have already said you have.', 'The plan starts with the first delivery rather than with buying anything.'], basis: [said('n16', 'what you already have'), said('n27', d?.name ? `you chose ${d.name}` : '')].filter(Boolean) };
  const basis = [
    said('n27', d?.name ? `you chose ${d.name}` : 'you chose a direction'),
    said('n21', st.n21 === 'find' ? 'you would need to find those buyers' : ''),
    said('n05', isNum(st.n05) ? `${gbp(st.n05)} to test with` : ''),
  ].filter(Boolean);
  return { value: [...new Set(gaps.map((g) => g.id))], gaps, basis, lines: [noDirection ? 'These are the gaps your own answers point at, whichever direction you take.' : 'This is what the direction needs that you have not said you have.', ...gaps.slice(0, 4).map((g) => `${g.text} (${g.why}).`)] };
}
/** the owner's capacity ceiling, from facts about last month. Every figure in it is one the visitor gave */
function capacityEstimate() {
  const st = S();
  const who = isNum(st.who) && st.who > 0 ? st.who : null;
  const done = isNum(st.servedNow) ? st.servedNow : null;
  const perJob = isNum(st.jobHours) && st.jobHours > 0 ? st.jobHours : null;
  const week = isNum(st.hours) && st.hours > 0 ? st.hours : null;
  if (st.turnedAway === 'yes' && done !== null) {
    return { value: done, basis: 'turnedAway', words: `You turned work away last month with ${plural(done, unitWord(1), unitWord(done))} delivered, so the ceiling is the ${count(done)} you did.` };
  }
  if (who && perJob && week) {
    const n = Math.max(1, Math.floor((who * week * 4.3) / perJob));
    return { value: n, basis: 'hours', words: `${plural(who, 'person', 'people')} at ${plural(week, 'hour', 'hours')} a week, ${plural(perJob, 'hour', 'hours')} a ${unitWord(1)}: about ${count(n)} ${unitWord(n)} a month.` };
  }
  if (done !== null && st.turnedAway === 'no') {
    return { value: null, basis: 'none', words: `You delivered ${plural(done, unitWord(1), unitWord(done))} last month and turned nothing away, so last month does not show where the ceiling is.` };
  }
  return null;
}

/* ---- the hand-built questions ---- */
/* D4 and Task 08: app.js now asks every `on:` rider as a question of its own, straight after the answer that reveals
   it, so a host must not draw it as well. The exception is an entry the registry marks `context: true`: a confirmed or
   suggested value shown beside the active question is not a question, and its host still draws it. A page without
   app.js (the lab harness, a test) has nothing to ask the riders, so the host keeps drawing them there. */
const flowAsksRiders = () => typeof M.isContextValue === 'function';
const drawsInline = (id) => { const r = BY_ID[id]; return Boolean(r) && (r.context === true || !flowAsksRiders()); };
/** a rider entry drawn under its screen: skipped while its `when` says no. Generic types only; a hand-built rider is drawn by its host */
function drawRider(host, hostQ, riderId, over = {}) {
  const r = BY_ID[riderId];
  if (!r || !applies(r) || !drawsInline(riderId)) return null;
  const caption = over.caption ?? headline(r).sub ?? headline(r).title;
  if (r.type === 'presets' || r.type === 'multi') return stonesRow(host, hostQ, { id: r.id, key: r.key, options: over.options ?? optsOf(r), multi: r.type === 'multi', value: S()[r.key], caption, foldAt: over.foldAt ?? 8, onDone: over.onDone });
  if (r.type === 'money' || r.type === 'number') return sliderRow(host, hostQ, { id: r.id, key: r.key, unit: r.type === 'money' ? r.unit : r.unit, money: r.type === 'money', scale: r.scale, snap: r.snap, zero: Boolean(r.zero), caption, onDone: over.onDone });
  if (r.type === 'text') return lineRow(host, hostQ, { id: r.id, key: r.key, placeholder: r.placeholder, caption, max: r.max ?? 200, ghost: r.id, onDone: over.onDone });
  return null;
}
/** results 1, D9: the few ideas as cards, one pick, with None of them where the question allows it */
function ideaCards(q, body, enable, list, noneWords) {
  const st = S();
  const options = [...list.map((x) => ({ v: x.id, label: x.text })), ...(noneWords ? [{ v: 'none', label: noneWords }] : [])];
  const c = cardsRow(body, q, { id: q.id, options, value: st[q.key] ?? null, caption: '', label: headline(q).title, onCommit(v) { if (v === null || v === undefined) { hold(); return; } commit(q, v, c.el); enable(); } });
  if (answeredQ(q)) enable();
  return c;
}
/** a stones row of options plus an "other" line that opens when Something else is pressed; writes key and keyOther */
function stonesWithOther(host, q, { id, key, otherKey, options, multi = false, caption, placeholder, ghost, enable, onDone }) {
  let line = null;
  const otherHost = el('div', 'q-other');
  const paintOther = (v) => {
    const wants = multi ? (Array.isArray(v) && v.includes('other')) : v === 'other';
    otherHost.hidden = !wants;
    if (wants && !line) line = lineRow(otherHost, q, { id: `${id}.other`, key: otherKey, placeholder, caption: 'In your words', max: 160, ghost, onDone: () => { if (given(S()[otherKey])) enable?.(); } });
    if (wants) line?.focus?.();
  };
  const c = stonesRow(host, q, { id, key, options, multi, value: S()[key], caption, onDone: (v) => { paintOther(v); const ok = multi ? (Array.isArray(v) && v.length && (!v.includes('other') || given(S()[otherKey]))) : (v && (v !== 'other' || given(S()[otherKey]))); if (ok) enable?.(); else hold(); onDone?.(v); } });
  host.appendChild(otherHost);
  paintOther(S()[key]);
  return c;
}
/** after a multi pick, the row that says which one is most often (the primary); one pick is its own primary */
function primaryRow(host, q, { id, key, primaryKey, options, caption, onDone }) {
  const rowHost = el('div', 'q-primary');
  host.appendChild(rowHost);
  let c = null, implicit = false;
  const paint = () => {
    c?.destroy?.(); c = null; rowHost.innerHTML = '';
    const picked = (S()[key] ?? []).filter((x) => !EXCLUSIVE.includes(x));
    // one pick is its own primary; a second pick asks, so the primary is never a pick the visitor did not make
    if (picked.length <= 1) { S()[primaryKey] = picked[0] ?? null; implicit = true; rowHost.hidden = true; onDone?.(S()[primaryKey]); return; }
    rowHost.hidden = false;
    if (implicit || !picked.includes(S()[primaryKey])) { S()[primaryKey] = null; implicit = false; }
    c = stonesRow(rowHost, q, { id: `${id}.primary`, key: primaryKey, options: options.filter((o) => picked.includes(o[0])), value: S()[primaryKey], caption, onDone: (v) => { implicit = false; onDone?.(v); } });
  };
  paint();
  return { repaint: paint, focus: () => c?.focus?.(), destroy: () => c?.destroy?.() };
}
const KIND = {
  /** Task 15: the first screen of the owner's route. What the business is called, and its website if it has one */
  biz(q, body, enable) {
    const st = S();
    const name = lineRow(body, q, { id: q.id, key: 'biz', placeholder: 'e.g. Rowan Joinery', caption: 'Business name', max: 80, commitId: 'biz', onType: (t) => { if (t) enable(); else hold(); }, onDone: (t) => { if (given(t)) enable(); else hold(); } });
    const site = lineRow(body, q, { id: `${q.id}.site`, key: 'site', placeholder: 'e.g. rowanjoinery.co.uk', caption: 'Website (optional)', max: 200, commitId: 'site' });
    body.appendChild(el('p', 'small q-check', esc(M.research?.URL_WORDS ?? 'The address is kept as context for your plan.')));
    if (answeredQ(q)) enable();
    return { el: name.el, focus: () => name.focus(), destroy: () => { name.destroy(); site.destroy(); } };
  },
  none(q, body) { body.textContent = ''; return { focus() {}, destroy() {} }; },

  /* ================= rebuild 1, the owner bank ================= */
  /** S02: what to change, by route; Something else opens a line */
  win(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 'win', otherKey: 'winOther', options: optsOf(q), placeholder: 'e.g. a business that runs without me for a month', ghost: 'winOther', enable });
    if (answeredQ(q)) enable();
    return c;
  },

  /** Task 15: the country (searchable), the town or region, and the currency. Known before anything geographic, priced or budgeted */
  place(q, body, enable) {
    const st = S();
    let cur = null;
    const settle = () => { if (given(st.country) || given(st.place)) enable(); else hold(); };
    const country = searchPick(body, q, {
      id: `${q.id}.country`, caption: 'Country', placeholder: 'Search a country', value: st.country ?? null, label: 'Country',
      search: (t) => searchCountries(t, 8), labelOf: (c) => c.name, keyOf: (c) => c.code,
      hint: 'Type a few letters. A country that is not listed can go in the line below.',
      onPick(c) {
        st.country = c.code;
        if (!given(st.place)) st.place = c.name;
        derive('place');
        if (typeof M.commit === 'function') M.commit('country', c.code, { fromEl: country.el });
        cur?.repaint?.();
        settle();
      },
    });
    const town = lineRow(body, q, {
      id: q.id, key: 'place', placeholder: isStarter() ? 'e.g. Leeds, or anywhere online' : 'e.g. Leeds', caption: 'Town or region (optional)', max: 80,
      onDone: (t) => { if (given(t)) { derive('place'); cur?.repaint?.(); } settle(); },
    });
    cur = KIND.currency(BY_ID.currency, body, enable);
    if (answeredQ(q)) enable();
    return { el: country.el, focus: () => country.focus(), destroy: () => { country.destroy(); town.destroy(); cur?.destroy?.(); } };
  },

  /** Task 15: the currency, suggested from the country. Other currency opens a searchable list of the rest */
  currency(q, body, enable) {
    const st = S();
    const host = el('div', 'q-currency');
    body.appendChild(host);
    let quick = null, list = null;
    const listHost = el('div', 'q-other');
    const note = el('p', 'small q-suggested');
    note.setAttribute('role', 'status');
    const say = () => { note.textContent = derivedMap().currency === 'place' && given(st.currency) ? `Suggested from your country: ${currencyName(st.currency)}. Press another if that is wrong.` : given(st.currency) ? `Figures are shown in ${currencyName(st.currency)}.` : ''; };
    const take = (code) => {
      delete derivedMap().currency;
      st.currency = code;
      if (typeof M.commit === 'function') M.commit('currency', code, { fromEl: host });
      say();
      enable?.();
    };
    const paint = () => {
      quick?.destroy?.();
      host.innerHTML = '';
      const opts = quickCurrencies();
      const value = given(st.currency) && opts.some((o) => o[0] === st.currency) ? st.currency : (given(st.currency) ? 'other' : null);
      quick = M.ui.stones(host, {
        // feel marks a value Mercer worked out as a suggestion until it is pressed: the currency is exactly that
        id: 'currency', hue: hueOf(q), options: opts, value, label: 'Currency', lead: false,
        suggested: derivedMap().currency === 'place' && given(st.currency), suggestedWords: 'suggested',
        onCommit(v) {
          if (!v) return;
          if (v === 'other') { listHost.hidden = false; list?.focus?.(); return; }
          listHost.hidden = true;
          take(v);
        },
      });
      host.appendChild(note);
      say();
    };
    paint();
    body.appendChild(listHost);
    listHost.hidden = !(given(st.currency) && !quickCurrencies().some((o) => o[0] === st.currency));
    list = searchPick(listHost, q, {
      id: 'currency.search', caption: 'Other currency', placeholder: 'Search a currency', value: st.currency ?? null, label: 'Currency',
      search: (t) => searchCurrencies(t, 8), labelOf: (c) => `${c.symbol} ${c.code} ${c.name}`, keyOf: (c) => c.code,
      onPick(c) { take(c.code); paint(); },
    });
    return { el: host, focus: () => quick?.focus?.(), destroy: () => { quick?.destroy?.(); list?.destroy?.(); }, repaint: paint };
  },

  /** E02: what is sold most often. A multi with a primary; the pattern the engine questions follow is derived */
  sells(q, body, enable) {
    const st = S();
    if (!Array.isArray(st.sells)) st.sells = [];
    let prim = null;
    const done = () => { const ok = st.sells.length && (st.sells.length === 1 || given(st.sellsPrimary)); if (ok) { derive('sells'); commit(q, st.repeatWork, c.el); enable(); } else hold(); };
    const c = stonesRow(body, q, { id: q.id, key: 'sells', options: SELLS, multi: true, value: st.sells, caption: '', commitId: 'sells', onDone: () => { prim?.repaint(); done(); } });
    prim = primaryRow(body, q, { id: q.id, key: 'sells', primaryKey: 'sellsPrimary', options: SELLS, caption: 'Most often', onDone: () => done() });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); prim.destroy(); } };
  },

  /** E09: a count, the period it covers, in the trade's unit. Checked against revenue and sale value in words; never overwrites either */
  volume(q, body, enable) {
    const st = S();
    const unit = unitWord(2);
    const say = el('p', 'small q-check');
    say.setAttribute('role', 'status');
    const check = () => {
      const m = PERIOD_MONTHS[st.volumePeriod];
      const monthly = isNum(st.volume) && m ? st.volume / m : null;
      const implied = isNum(st.now) && isNum(st.price) && st.price > 0 ? st.now / st.price : null;
      if (monthly === null || implied === null || implied < 0.5) { say.textContent = ''; return; }
      const ratio = monthly / implied;
      say.textContent = ratio > 1.6 || ratio < 0.6 ? `${count(monthly)} ${unitWord(monthly)} a month here; revenue divided by sale value says about ${count(implied)}. Both are kept as you gave them; the plan says which it leans on.` : `About ${count(monthly)} ${unitWord(monthly)} a month, in line with revenue and sale value.`;
    };
    const dates = el('p', 'small q-dates');
    const paintDates = () => { const d = PERIOD_DAYS[st.volumePeriod] ?? 30; dates.textContent = `${cap(rangeWords(d))}: ${unit} completed and paid for, not enquiries.`; };
    const cnt = sliderRow(body, q, { id: q.id, key: 'volume', unit, scale: [1, 500], snap: 1, caption: `${cap(unit)} completed`, commitId: 'volume', onDone: () => { if (given(st.volumePeriod)) { derive('volume'); enable(); } check(); } });
    const per = stonesRow(body, q, { id: `${q.id}.period`, key: 'volumePeriod', options: PERIODS, value: st.volumePeriod ?? 'month', caption: 'Over', commitId: 'volumePeriod', onDone: () => { derive('volume'); paintDates(); if (isNum(st.volume)) enable(); check(); } });
    if (!given(st.volumePeriod)) st.volumePeriod = 'month';
    paintDates();
    body.appendChild(dates);
    body.appendChild(say);
    check();
    if (answeredQ(q)) enable();
    return { el: cnt.el, focus: () => cnt.focus(), destroy: () => { cnt.destroy(); per.destroy(); } };
  },

  /** E12: who pays, a multi with a primary; state.buyer stays the primary for the readers that take one */
  buyers(q, body, enable) {
    const st = S();
    if (!Array.isArray(st.buyers)) st.buyers = st.buyer && st.buyer !== 'mixed' ? [st.buyer] : [];
    let prim = null;
    const done = () => { const ok = st.buyers.length && (st.buyers.length === 1 || given(st.buyerPrimary)); if (ok) { commit(q, st.buyers.length === 1 ? st.buyers[0] : st.buyerPrimary, c.el); enable(); } else hold(); };
    const c = stonesRow(body, q, { id: q.id, key: 'buyers', options: BUYERS, multi: true, value: st.buyers, caption: '', commitId: 'buyers', onDone: () => { prim?.repaint(); done(); } });
    prim = primaryRow(body, q, { id: q.id, key: 'buyers', primaryKey: 'buyerPrimary', options: BUYERS, caption: 'Most often', onDone: () => done() });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); prim.destroy(); } };
  },

  /** E13 and E14: one to five anonymous best-customer cards, or none yet. Positioning only: nothing here reaches a price, a rate or a revenue figure */
  clientCards(q, body, enable) {
    const st = S();
    const c = clientCardsRow(body, q, {
      id: q.id, value: Array.isArray(st.lastFive) ? st.lastFive : [], none: Boolean(st.bestNone),
      onCommit(cards) { st.bestNone = false; if (!cards.length) { st.lastFive = []; hold(); return; } commit(q, cards, c.el); enable(); },
      onNone(on) { st.bestNone = on; if (on) { st.lastFive = []; commit(q, [], c.el); enable(); } else hold(); },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E15 (brief 6.4): two or three suggested customer groups as editable cards, None of these, then one narrowing choice */
  segment(q, body, enable) {
    const st = S();
    const profiles = customerProfiles();
    // the card face holds the description and says it came from the answers; the answers it was built from stay on the
    // profile object, for the evidence trail on the results
    const opts = [...profiles.map((p) => ({ v: p.id, label: p.title, sub: p.text, lines: p.basis.length ? ['Suggested from your answers'] : [] })), { v: 'none', label: 'None of these', sub: 'Describe them in your own words below' }];
    let words = null, narrow = null;
    const wordsHost = el('div', 'q-other');
    const narrowHost = el('div', 'q-narrow');
    const settle = () => {
      const chosen = st.segment;
      const ok = chosen && (chosen !== 'none' || given(st.segmentWords));
      if (!ok) { hold(); return; }
      commit(q, chosen, c.el);
      enable();
    };
    const paintWords = () => {
      const p = profiles.find((x) => x.id === st.segment);
      wordsHost.hidden = false;
      if (!words) words = lineRow(wordsHost, q, { id: `${q.id}.words`, key: 'segmentWords', placeholder: 'e.g. owner-run firms of five to twenty people within an hour of us', caption: st.segment === 'none' ? 'Who you want next, in your words' : 'Edit the description if it is close but not right', max: 240, onDone: (t) => { st.segmentEdited = Boolean(t) && !profiles.some((x) => x.text === t); settle(); } });
      else wordsHost.querySelector('.q-cap').textContent = st.segment === 'none' ? 'Who you want next, in your words' : 'Edit the description if it is close but not right';
      if (p && !st.segmentEdited) { st.segmentWords = p.text; words.set?.(p.text, true); }
      if (st.segment === 'none' && !st.segmentEdited) { st.segmentWords = ''; words.set?.('', true); }
    };
    const paintNarrow = () => {
      narrow?.destroy?.(); narrow = null; narrowHost.innerHTML = '';
      if (!st.segment) return;
      const n = narrowingChoice();
      if (!n) return;
      st.narrowKind = n.kind;
      narrow = stonesRow(narrowHost, q, { id: `${q.id}.narrow`, key: 'narrow', options: n.options, value: st.narrow ?? null, caption: n.caption, commitId: 'narrow' });
    };
    const c = cardsRow(body, q, { id: q.id, options: opts, value: st.segment ?? null, caption: '', label: headline(q).title, onCommit(v) { st.segment = v; paintWords(); paintNarrow(); settle(); } });
    body.append(wordsHost, narrowHost);
    wordsHost.hidden = !st.segment;
    if (st.segment) { paintWords(); paintNarrow(); }
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy?.(); words?.destroy?.(); narrow?.destroy?.(); } };
  },

  /** E16: what makes them decide, with a line for an answer of their own */
  trigger(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 'trigger', otherKey: 'triggerOther', options: TRIGGERS, placeholder: 'e.g. a problem they have put off until it cannot wait', ghost: 'triggerOther', enable });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E20, D13 and Task 09: reach this month on a labelled dot field with a live count where feel has one, else the
      typed count the pack names as the alternative. The dots stand for a quantity, never for real people or leads */
  reach(q, body, enable) {
    const st = S();
    const take = (v, from) => { if (!isNum(v) || v <= 0) { hold(); return; } st.reach = Math.round(v); derive('reach'); commit({ ...q, key: 'reach' }, st.reach, from); enable(); };
    // feel's dot field gives a range when a range is typed; the plan takes the top of it and the range stays in state
    const num = (v) => (Array.isArray(v) ? v[1] : v);
    const dots = typeof M.ui.dots === 'function' ? M.ui.dots : null;
    const c = dots
      ? dots(body, {
        id: q.id, hue: hueOf(q), value: st.reachRange ?? st.reach ?? null, scale: q.scale ?? [10, 2000], label: headline(q).title, unit: 'people',
        caption: 'The dots show a size, not real people. They are not leads and nobody is listed here.',
        onInput: (v) => { if (isNum(num(v)) && num(v) > 0) enable(); else hold(); },
        onCommit: (v) => { st.reachRange = Array.isArray(v) ? [...v] : null; take(num(v), c.el); },
      })
      : M.ui.slider(body, {
        id: q.id, hue: hueOf(q), value: st.reach ?? null, unit: 'people this month', scale: q.scale ?? [10, 2000], log: true, snap: (v) => Math.round(v), label: headline(q).title,
        onInput: (v) => { if (isNum(v) && v > 0) enable(); else hold(); },
        onCommit: (v) => take(v, c.el),
      });
    railHint(c);
    if (answeredQ(q)) enable();
    return c;
  },

  /** E27, Task 09: how the work reaches customers, on feel's labelled direction diagram where it exists, else the text
      choices the pack names as the alternative. Asked before anything about distance. state.deliveryMode stays a list */
  delivery(q, body, enable) {
    const st = S();
    const opts = optsOf(q).length ? optsOf(q) : DELIVERY;
    const take = (v) => {
      const picked = (Array.isArray(v) ? v : v === 'mixed' ? ['visit', 'travel', 'remote'] : [v]).filter(Boolean);
      st.deliveryMode = picked;
      if (!picked.length) { hold(); return; }
      commit(q, picked, c.el);
      enable();
    };
    const diagram = typeof M.ui.paths === 'function' ? M.ui.paths : null;
    const held = st.deliveryMode ?? [];
    const c = diagram
      ? diagram(body, {
        id: q.id, hue: hueOf(q), label: headline(q).title, value: held.length > 1 ? 'mixed' : (held[0] ?? null),
        options: [...DELIVERY_PATHS, ['mixed', 'A mix of these', { line: 'Both ways', dir: 'both' }]].map(([v, label, meta]) => ({ v, label, ...(meta ?? {}) })),
        onCommit: take,
      })
      : M.ui.stones(body, { id: q.id, hue: hueOf(q), options: opts, multi: true, value: [...held], label: headline(q).title, lead: false, exclusive: EXCLUSIVE, onCommit: take });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E22: enquiries, the ones that became customers, and the period, on one screen. The close rate is read from the two counts */
  enquiries(q, body, enable) {
    const st = S();
    if (!given(st.enquiryPeriod)) st.enquiryPeriod = 'month';
    const say = el('p', 'small q-check');
    say.setAttribute('role', 'status');
    if (!isNum(st.enquiriesRaw) && isNum(st.enquiries)) st.enquiriesRaw = st.enquiries;
    const check = () => {
      const cr = isNum(st.closeRate) ? st.closeRate : null;
      if (!isNum(st.enquiriesRaw) || !isNum(st.winsRaw)) { say.textContent = ''; return; }
      if (st.winsRaw > st.enquiriesRaw) { say.textContent = 'More customers than enquiries: the two counts disagree.'; return; }
      say.textContent = cr !== null ? `${count(st.winsRaw)} of ${count(st.enquiriesRaw)}: about ${Math.max(1, Math.round(cr * 10))} in 10 become customers.` : '';
    };
    // the raw counts are what the visitor gave; derive() turns them into the page's monthly figures and the close rate
    const settle = (from) => { derive('enquiriesRaw'); if (!isNum(st.enquiries)) { hold(); return; } commit(q, st.enquiries, from); check(); enable(); };
    const per = PERIOD_MONTHS[st.enquiryPeriod] ?? 1;
    const perWord = st.enquiryPeriod === 'month' ? 'a month' : st.enquiryPeriod === 'quarter' ? 'a quarter' : 'a year';
    const a = sliderRow(body, q, { id: q.id, key: 'enquiriesRaw', unit: `enquiries ${perWord}`, scale: [5 * per, 300 * per], snap: 1, zero: true, caption: 'New enquiries', commitId: 'enquiriesRaw', onDone: () => settle(a.el) });
    const b = sliderRow(body, q, { id: `${q.id}.wins`, key: 'winsRaw', unit: 'became customers', scale: [1 * per, 100 * per], snap: 1, zero: true, caption: 'Of those, how many bought', commitId: 'winsRaw', onDone: () => settle(b.el) });
    const p = stonesRow(body, q, { id: `${q.id}.period`, key: 'enquiryPeriod', options: PERIODS, value: st.enquiryPeriod, caption: 'Over', commitId: 'enquiryPeriod', onDone: () => { derive('enquiryPeriod'); if (typeof M.showQuestion === 'function') M.showQuestion(q.id); else renderQuestion(q, body, enable); } });
    body.appendChild(say);
    check();
    if (answeredQ(q)) enable();
    return { el: a.el, focus: () => a.focus(), destroy: () => { a.destroy(); b.destroy(); p.destroy(); } };
  },

  /** E24: do customers buy again; one-off settles the engine's repeat figure at nought */
  repeatBand(q, body, enable) {
    const st = S();
    const c = stonesRow(body, q, { id: q.id, key: 'repeatBand', options: REPEAT_BAND, value: st.repeatBand ?? null, caption: '', commitId: 'repeatBand', onDone: (v) => { if (!v) { hold(); return; } derive('repeatBand'); enable(); } });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E25: of a recent group, how many returned. Two counts; the rate is read from them, never typed as a clipped "10" */
  returned(q, body, enable) {
    const st = S();
    const cur = st.returned && typeof st.returned === 'object' ? { ...st.returned } : { group: null, returned: null };
    const say = el('p', 'small q-check');
    say.setAttribute('role', 'status');
    const settle = (from) => {
      st.returned = { ...cur };
      if (!isNum(cur.group) || cur.group <= 0 || !isNum(cur.returned)) { say.textContent = ''; hold(); return; }
      if (cur.returned > cur.group) { say.textContent = 'More returned than were in the group: the two counts disagree.'; hold(); return; }
      derive('returned');
      say.textContent = `${count(cur.returned)} of ${count(cur.group)} came back: ${Math.round((cur.returned / cur.group) * 10)} in 10.`;
      commit(q, { ...cur }, from);
      enable();
    };
    const g = M.ui.slider(body, { id: `${q.id}.group`, hue: hueOf(q), value: cur.group, unit: 'customers in the group', scale: [5, 100], log: false, snap: (v) => Math.round(v), label: 'Customers in the group', onInput: () => {}, onCommit(v) { cur.group = isNum(v) && v > 0 ? Math.round(v) : null; settle(g.el); } });
    body.insertBefore(el('p', 'q-cap', 'A recent group of customers'), g.el);
    const r = M.ui.slider(body, { id: `${q.id}.returned`, hue: hueOf(q), value: cur.returned, unit: 'came back', scale: [0, 100], range: [0, 100], log: false, snap: (v) => Math.round(v), label: 'How many came back', onInput: () => {}, onCommit(v) { cur.returned = isNum(v) && v >= 0 ? Math.round(v) : null; settle(r.el); } });
    body.insertBefore(el('p', 'q-cap', 'Of those, how many came back'), r.el);
    body.appendChild(say);
    if (answeredQ(q)) { enable(); settle(null); }
    return { el: g.el, focus: () => g.focus(), destroy: () => { g.destroy(); r.destroy(); } };
  },

  /** E33: where the week goes, and the hours a week that could go to the plan */
  /** E33, Task 18: where the week goes. The hours you could give are their own question, so this screen asks one thing */
  week(q, body, enable) {
    const st = S();
    const hrs = sliderRow(body, q, { id: q.id, key: 'hours', unit: 'hours a week', scale: [1, 40], snap: 1, caption: '', commitId: 'hours', onDone: () => enable() });
    // where the week goes is its own question (D4); drawn here only where nothing else will ask it
    const goes = drawsInline('weekGoes') ? stonesRow(body, q, { id: 'weekGoes', key: 'weekGoes', options: WEEK_GOES, multi: true, value: st.weekGoes ?? [], caption: 'Where your week goes', commitId: 'weekGoes' }) : null;
    if (answeredQ(q)) enable();
    return { el: hrs.el, focus: () => hrs.focus(), destroy: () => { hrs.destroy(); goes?.destroy?.(); } };
  },

  /** E35: where it gets held up, with a line for somewhere else */
  holdup(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 'holdup', otherKey: 'holdupOther', options: HOLDUP, placeholder: 'e.g. quotes wait until I have an evening free', ghost: 'holdupOther', enable });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E37, Task 18: money only. The hours are their own screen, and what is known about revenue is shown beside this
      with its own label, never as money that is free to spend */
  budget(q, body, enable) {
    const st = S();
    /* the polish pack, 3: the one-off amount first (the larger commitment), the monthly amount revealed once the one-off is
       accepted; the accepted one-off then stands as one line with Change, so the two inputs and their explanations are
       never open at once. The keys stand on their own (oneOff; budget, a month): nothing is inferred from one to the
       other, nought is an answer to either, and Continue stands once both are given. */
    const settle = (from) => { if (!isNum(st.budget) || !isNum(st.oneOff)) { hold(); return; } delete derivedMap().budget; if (!isNum(st.spendNow)) st.spendNow = st.budget; commit(q, st.budget, from); enable(); };
    const fact = el('button', 'q-fact'); fact.type = 'button'; fact.hidden = true;
    const monthHost = el('div', 'q-stage'); monthHost.hidden = true;
    let m = null, oPart = null;
    const paintMonth = () => {
      const have = isNum(st.oneOff);
      monthHost.hidden = !have;
      fact.hidden = !have;
      if (!have) return;
      fact.innerHTML = `<span class="q-fact-cap">One-off budget</span><b>${esc(gbp(st.oneOff))}</b><span class="q-fact-change">Change</span>`;
      fact.setAttribute('aria-label', `One-off budget ${gbp(st.oneOff)}. Change it`);
      if (!m) m = sliderRow(monthHost, q, { id: q.id, key: 'budget', unit: 'a month', money: true, scale: [100, 5000], zero: true, caption: 'Monthly budget: what could you spend each month after that?', commitId: 'budget', onDone: () => settle(m.el) });
    };
    const o = sliderRow(body, q, { id: `${q.id}.oneOff`, key: 'oneOff', unit: 'one-off', money: true, scale: [100, 20000], zero: true, caption: 'One-off budget: how much could you put towards getting started?', commitId: 'oneOff', onDone: () => { if (oPart) oPart.hidden = true; paintMonth(); if (isNum(st.budget)) settle(o.el); else { hold(); m?.focus?.(); } } });
    oPart = o.el.closest('.q-part') ?? o.el;
    fact.addEventListener('click', () => { oPart.hidden = false; fact.hidden = true; try { o.focus?.(); } catch (e) { /* no focus */ } });
    body.append(fact, monthHost);
    if (isNum(st.oneOff)) oPart.hidden = true;
    paintMonth();
    if (isNum(st.now) && st.now > 0) body.appendChild(el('p', 'small q-check', esc(`Revenue a month: ${gbp(st.now)}. That is money in, not money free to spend, and nothing here is set from it.`)));
    if (answeredQ(q) && isNum(st.oneOff)) enable();
    return { el: o.el, focus: () => (oPart.hidden && m ? m.focus() : o.focus()), destroy: () => { o.destroy(); m?.destroy?.(); } };
  },

  /** the polish pack, 10.1: how easily capacity can change. The way first; then how much, how soon and at what cost,
      asked only where there is a way (spare capacity asks the amount alone) */
  moreWork(q, body, enable) {
    const st = S();
    const host = el('div', 'q-riders');
    const riders = [];
    const unit = unitWord(2);
    const paint = () => {
      riders.splice(0).forEach((r) => r?.destroy?.());
      host.innerHTML = '';
      const how = st.moreWork;
      if (!how || how === 'no') { host.hidden = true; return; }
      host.hidden = false;
      riders.push(sliderRow(host, q, { id: `${q.id}.amount`, key: 'moreWorkAmount', unit: `more ${unit} a month`, scale: [1, 200], snap: 1, caption: `How much more, in ${unit} a month?`, commitId: 'moreWorkAmount' }));
      if (how === 'helper' || how === 'hire') {
        riders.push(stonesRow(host, q, { id: `${q.id}.lead`, key: 'moreWorkLead', options: LEAD_TIME, value: st.moreWorkLead ?? null, caption: 'How soon could it be in place?', commitId: 'moreWorkLead' }));
        riders.push(sliderRow(host, q, { id: `${q.id}.cost`, key: 'moreWorkCost', unit: 'one-off', money: true, scale: [100, 20000], zero: true, caption: 'What would it cost to add, one-off? £0 is fine', commitId: 'moreWorkCost' }));
      }
    };
    const c = stonesRow(body, q, { id: q.id, key: 'moreWork', options: MORE_WORK, value: st.moreWork ?? null, caption: '', commitId: 'moreWork', onDone: (v) => { paint(); if (v) enable(); else hold(); } });
    body.appendChild(host);
    paint();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); riders.forEach((r) => r?.destroy?.()); } };
  },

  /** the polish pack, 5: routes to buyers as cards whose examples show on selection; routes that exist now, with the one
      route to build (channels) named as a test; None stands alone */
  access(q, body, enable) {
    const st = S();
    let isB2b = false;
    try { isB2b = Boolean(b2b()); } catch (e) { isB2b = false; }
    const options = ACCESS.map(([v, label]) => ({ v, label, lines: [ACCESS_LINES[v] ? ACCESS_LINES[v](isB2b) : ''] }));
    const c = cardsRow(body, q, {
      id: q.id, options, value: Array.isArray(st.access) ? [...st.access] : [], multi: true, caption: 'Choose every route that exists now', label: headline(q).title,
      onCommit: (v) => {
        const list = Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
        const cleaned = list.includes('none') && list.length > 1 ? (list[list.length - 1] === 'none' ? ['none'] : list.filter((x) => x !== 'none')) : list;
        st.access = cleaned;
        commit(q, cleaned, c.el);
        if (cleaned.length) enable(); else hold();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E44: who could help, by kind; a count of introducers is optional and only asked when there are some */
  network(q, body, enable) {
    const st = S();
    let cnt = null;
    const cntHost = el('div', 'q-other');
    const paintCount = () => {
      const wants = (st.networkKinds ?? []).includes('introducers');
      cntHost.hidden = !wants;
      if (wants && !cnt) cnt = sliderRow(cntHost, q, { id: `${q.id}.count`, key: 'network', unit: 'people', scale: [2, 200], snap: 1, caption: 'About how many could introduce you (optional)', commitId: 'network' });
    };
    const c = stonesRow(body, q, { id: q.id, key: 'networkKinds', options: NETWORK_KINDS, multi: true, value: st.networkKinds ?? [], caption: '', commitId: 'networkKinds', onDone: (v) => { paintCount(); if (Array.isArray(v) && v.length) enable(); else hold(); } });
    body.appendChild(cntHost);
    paintCount();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); cnt?.destroy?.(); } };
  },

  /** E47: who can make the decisions the plan needs; Shared opens the five decisions to place */
  authority(q, body, enable) {
    const st = S();
    let map = null, who = null;
    const mapHost = el('div', 'q-other');
    const whoHost = el('div', 'q-other');
    const paintMore = () => {
      mapHost.hidden = st.decides !== 'shared';
      whoHost.hidden = st.decides !== 'someone';
      if (st.decides === 'shared' && !map) {
        const cur = st.decisionRights && typeof st.decisionRights === 'object' ? st.decisionRights : {};
        const p = qpart(mapHost, 'Where the last word sits on each');
        map = M.ui.sorter(p, {
          id: 'decisionRights', hue: hueOf(q), bins: HOLDERS, items: DECISIONS, partial: true, clearWords: 'Clear', label: 'Decision rights',
          value: DECISIONS.map(([id]) => ({ id, bin: cur[id] ?? null, route: null })), routesFor: () => [],
          onCommit(v) { const m = {}; (Array.isArray(v) ? v : []).forEach((x) => { if (x?.id && x.bin) m[x.id] = x.bin; }); st.decisionRights = Object.keys(m).length ? m : null; if (typeof M.commit === 'function') M.commit('decisionRights', st.decisionRights, { fromEl: map.el }); },
        });
      }
      if (st.decides === 'someone' && !who) who = lineRow(whoHost, q, { id: `${q.id}.who`, key: 'decidesWho', placeholder: 'e.g. my business partner; the board', caption: 'Their role', max: 80 });
    };
    const c = stonesRow(body, q, { id: q.id, key: 'decides', options: DECIDES, value: st.decides ?? null, caption: '', commitId: 'decides', onDone: (v) => { paintMore(); if (v) { derive('decides'); enable(); } else hold(); } });
    body.append(mapHost, whoHost);
    paintMore();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); map?.destroy?.(); who?.destroy?.(); } };
  },

  /** S09: show the plan, or refine first */
  readiness(q, body, enable) {
    const st = S();
    // the polish pack, 7.1: the first result is a first pass, and sharpening it is the recommended way on
    const c = cardsRow(body, q, { id: q.id, options: [{ v: 'refine', label: 'Sharpen my plan (recommended)', sub: 'A few more questions on the parts the plan is least sure of, then a plan specific to your business' }, { v: 'plan', label: 'Use this first-pass plan', sub: 'A rough starting point from what you have said so far: the decision and the first step as they stand' }], value: st.detail ?? null, caption: '', label: headline(q).title, onCommit(v) {
      commit(q, v, c.el); enable();
      // the readiness screen has no foot row: the card itself is the control, so it must carry the visitor onward
      try { if (v === 'refine') M.chooseRefine?.(); else M.choosePlan?.(); } catch (e) { /* the flow says what it can do */ }
    } });
    if (answeredQ(q)) enable();
    return c;
  },

  /* ================= rebuild 1, the starter bank ================= */
  /** N01 with N09 riding on it: what they do now, and the work they have done. Task 11: the CV is optional evidence,
      offered under a press for someone who would rather have their strengths read out of one. It is never a gate */
  n01(q, body, enable) {
    const st = S();
    const c = stonesWithOther(body, q, { id: q.id, key: 'n01', otherKey: 'n01Other', options: N01, placeholder: 'e.g. running the family shop', enable });
    // the work someone has done is its own question (N09); it is drawn here only where nothing else will ask it
    if (!drawsInline('n09')) { if (answeredQ(q)) enable(); return { el: c.el, focus: () => c.focus(), destroy: () => c.destroy() }; }
    const exp = qpart(body, 'Work or projects you have done, in a line or two');
    const line = M.ui.line(exp, {
      id: 'n09', hue: hueOf(q), value: st.n09 ?? '', placeholder: 'e.g. five years in customer service, two of them running a small team', max: 400, label: 'Your experience', ghost: 'n09',
      onInput: () => {}, onCommit(v) { st.n09 = String(v ?? '').trim().slice(0, 400); if (typeof M.commit === 'function') M.commit('n09', st.n09, { fromEl: line.el }); },
    });
    const cvHost = el('div', 'q-other');
    let file = null;
    const open = el('button', 'stone', 'Read it from my CV instead');
    open.type = 'button';
    open.addEventListener('click', () => { tapEl(open); open.hidden = true; cvHost.hidden = false; if (!file) file = KIND.n09(BY_ID.n09, cvHost, () => {}); file.focus?.(); });
    body.append(open, cvHost);
    cvHost.hidden = !given(st.cv);
    open.hidden = given(st.cv);
    if (given(st.cv)) file = KIND.n09(BY_ID.n09, cvHost, () => {});
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); line.destroy(); file?.destroy?.(); } };
  },

  /** Task 11: what someone does with a free hour, and the part of it they enjoy. Evidence of what they will keep doing */
  interest(q, body, enable) {
    const st = S();
    let part = null;
    const partHost = el('div', 'q-other');
    const paint = () => {
      partHost.hidden = !given(st.interest);
      if (given(st.interest) && !part) part = lineRow(partHost, q, { id: `${q.id}.part`, key: 'interestPart', placeholder: 'e.g. working out why it will not do what I want', caption: 'Which part of that do you enjoy most?', max: 160, ghost: 'interestPart' });
    };
    const c = lineRow(body, q, { id: q.id, key: 'interest', placeholder: 'e.g. taking the bike apart and putting it back together', caption: '', max: 200, ghost: 'interest', onDone: (t) => { paint(); if (given(t)) enable(); else hold(); } });
    body.appendChild(partHost);
    paint();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); part?.destroy?.(); } };
  },

  /** Task 11: the proven attempt. The strongest evidence anyone can give, and it takes one press */
  paidBefore(q, body, enable) {
    const st = S();
    let what = null;
    const whatHost = el('div', 'q-other');
    const paint = () => {
      const wants = given(st.paidBefore) && st.paidBefore !== 'no';
      whatHost.hidden = !wants;
      if (wants && !what) what = lineRow(whatHost, q, { id: `${q.id}.what`, key: 'paidWhat', placeholder: 'e.g. fixed two neighbours’ laptops, £40 each', caption: 'What happened, in a few words', max: 200, ghost: 'paidWhat' });
    };
    const c = stonesRow(body, q, { id: q.id, key: 'paidBefore', options: PAID_BEFORE, value: st.paidBefore ?? null, caption: '', commitId: 'paidBefore', onDone: (v) => { paint(); if (v) enable(); else hold(); } });
    body.appendChild(whatHost);
    paint();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); what?.destroy?.(); } };
  },

  /** Task 11: the work style, in the words of what a person would be doing, not a personality label */
  workStyle(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 'workStyle', otherKey: 'workStyleOther', options: WORK_STYLE, placeholder: 'e.g. fixing what other people have broken', ghost: 'workStyleOther', enable });
    if (answeredQ(q)) enable();
    return c;
  },
  /** N09's file part: a CV or portfolio read in this browser (txt, md, csv, pdf, docx) into state.cv; nothing is sent, no finds are listed */
  n09(q, body, enable) {
    const st = S();
    // asked as a screen of its own (D4): the line first, then the CV behind a press. Drawn inside N01 on a page with
    // no flow to ask it, where the line is already there and only the file part belongs here
    if (typeof enable === 'function' && !drawsInline('n09')) {
      const line = lineRow(body, q, { id: `${q.id}.words`, key: 'n09', placeholder: 'e.g. five years in customer service, two of them running a small team', caption: '', max: 400, ghost: 'n09', commitId: 'n09', onDone: () => enable() });
      const cvHost = el('div', 'q-other');
      let file = null;
      const open = el('button', 'stone', 'Read it from my CV instead');
      open.type = 'button';
      open.addEventListener('click', () => { tapEl(open); open.hidden = true; cvHost.hidden = false; if (!file) file = KIND.n09(BY_ID.n09, cvHost); file.focus?.(); });
      body.append(open, cvHost);
      cvHost.hidden = !given(st.cv);
      open.hidden = given(st.cv);
      if (given(st.cv)) file = KIND.n09(BY_ID.n09, cvHost);
      enable();
      return { el: line.el, focus: () => line.focus(), destroy: () => { line.destroy(); file?.destroy?.(); } };
    }
    const wrap = el('div', 'q-file');
    body.appendChild(wrap);
    const btn = el('button', 'stone', 'Choose a file');
    btn.type = 'button';
    const inp = el('input', 'q-file-in');
    inp.type = 'file'; inp.accept = M.research?.ACCEPT ?? '.txt,.md,.csv,.pdf,.docx'; inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true');
    const status = el('p', 'small q-file-say');
    status.setAttribute('role', 'status');
    const say = (t) => { status.textContent = t; };
    const paint = () => { say(st.cv ? `A file is held: ${plural(String(st.cv).split(/\s+/).filter(Boolean).length, 'word', 'words')} read in this browser.` : ''); };
    wrap.append(btn, inp, el('p', 'small', '.txt, .md, .csv, a text PDF or a Word .docx, up to 10 MB. Read here and sent nowhere.'), status);
    btn.addEventListener('click', () => inp.click());
    inp.addEventListener('change', async () => {
      const f = inp.files?.[0];
      inp.value = '';
      if (!f || typeof M.research?.readFile !== 'function') return;
      btn.setAttribute('aria-busy', 'true');
      say(`Reading ${f.name}…`);
      const r = await M.research.readFile(f, { list: false });
      btn.removeAttribute('aria-busy');
      if (!r.ok) { say(r.error); return; }
      st.cv = r.text.slice(0, 20000);
      try { M.cvFacts = M.readCV ? M.readCV(st.cv) : null; } catch (e) { M.cvFacts = null; }
      if (typeof M.commit === 'function') M.commit('cv', st.cv, { fromEl: btn });
      paint();
    });
    paint();
    return { el: wrap, focus: () => btn.focus(), destroy() {} };
  },

  /** N03 with N04 and N18 riding on it: hours a week, whether they are predictable, when they fall, local or remote */
  n03(q, body, enable) {
    const st = S();
    let n04 = null;
    const n04Host = el('div', 'q-other');
    const paintN04 = () => { n04?.destroy?.(); n04 = null; n04Host.innerHTML = ''; n04 = drawRider(n04Host, q, 'n04'); n04Host.hidden = !n04; };
    /* the cockpit brief, 3.3: the unit is named, the presets come first at full width, and the exact number stands beside
       them. Both write n03; a preset writes its band as words the starter reads tolerantly ("4-7", "under 1", "26+"), the
       slider writes the exact figure, and whichever was touched last stands. */
    const band = stonesRow(body, q, { id: `${q.id}.band`, key: 'n03', options: N03_BANDS, value: typeof st.n03 === 'string' ? st.n03 : null, caption: 'Extra hours each week', commitId: 'n03', onDone: () => { paintN04(); enable(); } });
    const hrs = sliderRow(body, q, { id: q.id, key: 'n03', unit: 'hours a week', scale: [1, 40], snap: 1, caption: 'Or the exact number', commitId: 'n03', onDone: () => { paintN04(); enable(); } });
    const pat = stonesRow(body, q, { id: `${q.id}.pattern`, key: 'n03Pattern', options: N03_PATTERN, value: st.n03Pattern ?? null, caption: 'Are those hours', commitId: 'n03Pattern' });
    body.appendChild(n04Host);
    paintN04();
    const where = drawRider(body, q, 'n18', { caption: 'Where you could work' });
    if (answeredQ(q)) enable();
    return { el: band.el, focus: () => band.focus(), destroy: () => { band.destroy(); hrs.destroy(); pat.destroy(); n04?.destroy?.(); where?.destroy?.(); } };
  },

  /** N05 with N06: a test budget and an ongoing cost, nought allowed on both */
  n05(q, body, enable) {
    const st = S();
    // the polish pack, 3: the one-off amount first, the monthly amount revealed once it is accepted (optional for a starter)
    const monthHost = el('div', 'q-stage'); monthHost.hidden = true;
    let b = null;
    const paintMonth = () => { const have = isNum(st.n05); monthHost.hidden = !have; if (have && !b) b = drawRider(monthHost, q, 'n06', { caption: 'Monthly budget: what could you spend each month after that?' }); };
    const a = sliderRow(body, q, { id: q.id, key: 'n05', unit: 'to test an idea', money: true, scale: [50, 5000], zero: true, caption: 'One-off budget: how much could you put towards getting started?', commitId: 'n05', onDone: () => { paintMonth(); enable(); } });
    body.appendChild(monthHost);
    paintMonth();
    if (answeredQ(q)) enable();
    return { el: a.el, focus: () => a.focus(), destroy: () => { a.destroy(); b?.destroy?.(); } };
  },

  /** N10 with N11 and N12: good at, which of those have a result behind them, and what people already ask for */
  n10(q, body, enable) {
    const st = S();
    let proven = null, askedFor = null, example = null;
    const provenHost = el('div', 'q-other');
    const askedHost = el('div', 'q-other');
    const paintRiders = () => {
      const picked = skillsPicked();
      proven?.destroy?.(); proven = null; provenHost.innerHTML = '';
      askedFor?.destroy?.(); askedFor = null; example?.destroy?.(); example = null; askedHost.innerHTML = '';
      const opts = N10.filter((o) => picked.includes(o[0]));
      if (picked.length && drawsInline('n11')) {
        st.n11 = (st.n11 ?? []).filter((x) => picked.includes(x));
        proven = stonesRow(provenHost, q, { id: 'n11', key: 'n11', options: opts, multi: true, value: st.n11, caption: 'Which of those have you used to achieve a result?', commitId: 'n11' });
        example = lineRow(provenHost, q, { id: 'n11.example', key: 'n11Example', placeholder: 'e.g. organised a fundraiser that made £3,000', caption: 'One example, in a few words (optional)', max: 160 });
      }
      if (drawsInline('n12')) askedFor = stonesRow(askedHost, q, { id: 'n12', key: 'n12', options: [...opts, ['other', 'Something else'], ['none', 'Nothing yet']], multi: true, value: st.n12 ?? [], caption: 'What do people already ask you for help with?', commitId: 'n12', onDone: (v) => { const w = Array.isArray(v) && v.includes('other'); otherHost.hidden = !w; if (w && !other) other = lineRow(otherHost, q, { id: 'n12.other', key: 'n12Other', placeholder: 'e.g. fixing their phone or laptop', caption: 'In your words', max: 120, ghost: 'n12' }); } });
      // Task 11: the proven attempt, where this page has no flow to ask it as a screen of its own
      paid?.destroy?.(); paid = null; paidHost.innerHTML = '';
      if (drawsInline('paidBefore')) {
        paid = KIND.paidBefore(BY_ID.paidBefore, paidHost, () => {});
        paidHost.insertBefore(el('p', 'q-cap', headline(BY_ID.paidBefore).sub), paidHost.firstChild);
      }
    };
    const otherHost = el('div', 'q-other');
    const paidHost = el('div', 'q-other');
    let other = null, paid = null;
    const c = stonesWithOther(body, q, { id: q.id, key: 'n10', otherKey: 'n10Other', options: N10, multi: true, placeholder: 'e.g. sewing and alterations', enable, onDone: () => paintRiders() });
    body.append(provenHost, askedHost, otherHost, paidHost);
    paintRiders();
    otherHost.hidden = !(st.n12 ?? []).includes('other');
    if (!otherHost.hidden) other = lineRow(otherHost, q, { id: 'n12.other', key: 'n12Other', placeholder: 'e.g. fixing their phone or laptop', caption: 'In your words', max: 120, ghost: 'n12' });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); proven?.destroy?.(); example?.destroy?.(); askedFor?.destroy?.(); other?.destroy?.(); paid?.destroy?.(); } };
  },

  /** N13 and N14 on one sort: enjoy to the left, avoid to the right */
  n13(q, body, enable) {
    const st = S();
    const c = M.ui.sort(body, {
      id: q.id, hue: hueOf(q), tiles: N13, zones: ['enjoy', 'avoid'], value: { strengths: [...(st.n13 ?? [])], avoids: [...(st.n14 ?? [])] }, label: headline(q).title,
      onCommit(v) {
        st.n14 = [...(v.avoids ?? [])];
        const enjoy = [...(v.strengths ?? [])];
        if (!enjoy.length && !st.n14.length) { st.n13 = []; hold(); return; }
        if (typeof M.commit === 'function') M.commit('n14', st.n14, { fromEl: c.el });
        commit(q, enjoy, c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** N16 with N17: what they already have, and any useful extras */
  n16(q, body, enable) {
    const st = S();
    const c = stonesRow(body, q, { id: q.id, key: 'n16', options: N16, multi: true, value: st.n16 ?? [], caption: 'Tools, subscriptions or equipment', commitId: 'n16', onDone: (v) => { if (Array.isArray(v) && v.length) enable(); else hold(); } });
    const names = lineRow(body, q, { id: `${q.id}.names`, key: 'n16Names', placeholder: 'e.g. Canva, a sewing machine, a van', caption: 'Names, if it helps (optional)', max: 200 });
    const extras = drawRider(body, q, 'n17', { caption: 'Qualifications, languages or specialist access' });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); names.destroy(); extras?.destroy?.(); } };
  },

  /** N19 with N20: the groups they understand, then the problems they have seen those groups face */
  n19(q, body, enable) {
    const st = S();
    let probs = null;
    const probHost = el('div', 'q-other');
    const paintProblems = () => {
      probs?.destroy?.(); probs = null; probHost.innerHTML = '';
      const groups = (st.n19 ?? []).filter((x) => x !== 'other');
      const suggested = [...new Set(groups.flatMap((g) => PROBLEMS_OF[g] ?? []))];
      const opts = [...N20.filter((o) => suggested.includes(o[0])), ...N20.filter((o) => !suggested.includes(o[0]))];
      if (drawsInline('n20')) probs = stonesRow(probHost, q, { id: 'n20', key: 'n20', options: opts, multi: true, value: st.n20 ?? [], caption: 'Frustrating or costly problems you have seen them face', commitId: 'n20', onDone: (v) => { const w = Array.isArray(v) && v.includes('other'); pOtherHost.hidden = !w; if (w && !pOther) pOther = lineRow(pOtherHost, q, { id: 'n20.other', key: 'n20Other', placeholder: 'e.g. they cannot find anyone reliable to do small jobs', caption: 'In your words', max: 160, ghost: 'n20' }); } });
    };
    const pOtherHost = el('div', 'q-other');
    let pOther = null;
    const c = stonesWithOther(body, q, { id: q.id, key: 'n19', otherKey: 'n19Other', options: N19, multi: true, placeholder: 'e.g. amateur musicians', enable, onDone: () => paintProblems() });
    body.append(probHost, pOtherHost);
    paintProblems();
    pOtherHost.hidden = !(st.n20 ?? []).includes('other');
    if (!pOtherHost.hidden) pOther = lineRow(pOtherHost, q, { id: 'n20.other', key: 'n20Other', placeholder: 'e.g. they cannot find anyone reliable to do small jobs', caption: 'In your words', max: 160, ghost: 'n20' });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); probs?.destroy?.(); pOther?.destroy?.(); } };
  },

  /** N21 with N22, N23 and N24: access this week, an audience, who might help, and whether they have been asked */
  n21(q, body, enable) {
    const st = S();
    const riders = [];
    const host = el('div', 'q-riders');
    const paintRiders = () => {
      riders.splice(0).forEach((r) => r?.destroy?.());
      host.innerHTML = '';
      /* 7.5: the count comes with the route. A band first, the exact number beside it; both are kept, and 0 is an answer
         (no reachable buyers yet is a fact the plan builds on, not a blank) */
      if (given(st.n21) && st.n21 !== 'find') {
        riders.push(stonesRow(host, q, { id: `${q.id}.count`, key: 'n21Count', options: N21_COUNT, value: st.n21Count ?? null, caption: 'How many of them could you contact in the next seven days?', commitId: 'n21Count' }));
        riders.push(sliderRow(host, q, { id: `${q.id}.exact`, key: 'n21Exact', unit: 'people', scale: [1, 500], snap: 1, zero: true, caption: 'Or the exact number', commitId: 'n21Exact' }));
      }
      const aud = drawRider(host, q, 'n22', { onDone: () => paintSize() });
      riders.push(aud);
      sizeHost = el('div', 'q-other');
      host.appendChild(sizeHost);
      paintSize();
      riders.push(drawRider(host, q, 'n23', { onDone: () => paintRiders() }));
      riders.push(drawRider(host, q, 'n24'));
      // N30 rides here: with no one to help yet, what kind of support would help most
      riders.push(drawRider(host, q, 'n30'));
    };
    let sizeHost = null, size = null;
    const paintSize = () => {
      size?.destroy?.(); size = null; if (!sizeHost) return; sizeHost.innerHTML = '';
      const wants = given(st.n22) && st.n22 !== 'none';
      sizeHost.hidden = !wants;
      if (wants) size = sliderRow(sizeHost, q, { id: 'n22.size', key: 'n22Size', unit: 'people', scale: [20, 20000], snap: 1, caption: 'About how many', commitId: 'n22Size' });
    };
    // the polish pack, 5: the routes as cards whose examples show on selection; the question is about access that exists now
    const c = cardsRow(body, q, {
      id: q.id, options: N21.map(([v, label]) => ({ v, label, lines: [N21_LINES[v] ?? ''] })), value: st.n21 ?? null, caption: 'Which of them could you reach now?', label: headline(q).title,
      onCommit: (v) => { const one = Array.isArray(v) ? v[0] ?? null : v; st.n21 = one ?? null; if (one) commit(q, one, c.el); paintRiders(); if (one) enable(); else hold(); },
    });
    body.appendChild(host);
    paintRiders();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); riders.forEach((r) => r?.destroy?.()); size?.destroy?.(); } };
  },

  /** results 1, D9: where the visitor is starting. One idea opens an optional line for it, under the key the old idea screen
      wrote, so the brain and older saves read the same field; the other starts ask their follow-ups on screens of their own */
  startPoint(q, body, enable) {
    const st = S();
    let line = null;
    const lineHost = el('div', 'q-other');
    const paint = () => {
      const one = st.startPoint === 'one';
      lineHost.hidden = !one;
      if (one && !line) line = lineRow(lineHost, q, { id: `${q.id}.idea`, key: 'n25Text', placeholder: 'e.g. a bookkeeping service for local tradespeople', caption: 'The idea, in a line (optional)', max: 200, ghost: 'n25' });
    };
    const c = stonesRow(body, q, { id: q.id, key: 'startPoint', options: START_POINT, value: st.startPoint ?? null, caption: '', commitId: 'startPoint', onDone: (v) => { paint(); if (v) enable(); else hold(); } });
    body.appendChild(lineHost);
    paint();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); line?.destroy?.(); } };
  },
  /** who would pay for the one idea: the same groups the visitor is asked about elsewhere, and Another group opens a line */
  s01(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 's01', otherKey: 's01Other', options: N19, multi: true, placeholder: 'e.g. small landlords with two or three flats', ghost: 's01Other', enable });
    if (answeredQ(q)) enable();
    return c;
  },
  /** the few ideas, a line each, kept as one list in the order typed. The first is needed; the comparison screens draw from the list */
  s06(q, body, enable) {
    const st = S();
    const vals = [...ideas().map((x) => x.text), '', '', ''].slice(0, 3);
    const CAPTION = ['First idea', 'Second idea (optional)', 'Third idea (optional)'];
    const HINT = ['e.g. a bookkeeping service for local tradespeople', 'e.g. walking dogs on weekday mornings', 'e.g. an online course on the thing I do at work'];
    let rows = [];
    const sync = (i, t) => {
      vals[i] = t;
      const arr = vals.map((x) => String(x ?? '').trim()).filter(Boolean);
      if (!arr.length) { st.s06 = []; hold(); return; }
      commit(q, arr, rows[i]?.el);
      enable();
    };
    rows = vals.map((v, i) => M.ui.line(qpart(body, CAPTION[i]), {
      id: `${q.id}.${i + 1}`, hue: hueOf(q), value: v, placeholder: HINT[i], max: 120, label: CAPTION[i], ghost: 's06',
      onInput: (t) => { if (String(t ?? '').trim() || vals.some((x, j) => j !== i && String(x ?? '').trim())) enable(); else hold(); },
      onCommit: (t) => sync(i, String(t ?? '').trim().slice(0, 120)),
    }));
    if (answeredQ(q)) enable();
    return { el: rows[0]?.el ?? null, focus: () => rows[0]?.focus?.(), destroy: () => rows.forEach((r) => r?.destroy?.()) };
  },
  /** the comparison of the few: which has demand behind it, which could be delivered this month, and the tie-breaker between what still stands */
  s08(q, body, enable) { return ideaCards(q, body, enable, ideas(), 'None of them'); },
  s09(q, body, enable) { return ideaCards(q, body, enable, ideas(), 'None of them'); },
  s07(q, body, enable) { return ideaCards(q, body, enable, standingIdeas(), null); },
  /** where what they tried was seen; Another way opens a line */
  s11(q, body, enable) {
    const c = stonesWithOther(body, q, { id: q.id, key: 's11', otherKey: 's11Other', options: S11, multi: true, placeholder: 'e.g. a card in the newsagent window', ghost: 's11Other', enable });
    if (answeredQ(q)) enable();
    return c;
  },
  /** the counts behind what happened, optional: many saw it and nobody bought is no demand; hardly anyone saw it is no exposure */
  s13(q, body, enable) {
    const st = S();
    const PARTS = [['s13Saw', 'saw', 'Saw it'], ['s13Replied', 'replied', 'Replied'], ['s13Bought', 'bought', 'Bought']];
    const gather = () => Object.fromEntries(PARTS.map(([key, name]) => [name, isNum(st[key]) ? st[key] : null]));
    const rows = PARTS.map(([key, name, caption]) => sliderRow(body, q, { id: `${q.id}.${name}`, key, unit: 'people', scale: [1, 2000], snap: 1, zero: true, caption, onDone: () => { commit(q, gather(), null); enable(); } }));
    enable();
    return { el: rows[0].el, focus: () => rows[0].focus(), destroy: () => rows.forEach((r) => r.destroy()) };
  },
  /** the price charged, optional; nought is free */
  s14(q, body, enable) {
    const c = renderSlider(q, body, enable);
    enable();
    return c;
  },

  /** N27 with N28 and N29: the direction cards from the starter reasoning (brain), None of these, what puts them off, alone or with someone */
  n27(q, body, enable) {
    const st = S();
    const dirs = starterDirections();
    /* the cockpit brief, 8 and 10: the card face is the name, the buyer and the interest alignment where it can be scored;
       the offer, the fit, what the first test settles and the test itself are the disclosure a press, a hover or focus opens */
    const interestWords = (d) => (d.interest && Number.isFinite(d.interest.score) ? `Interest alignment ${d.interest.score}/${d.interest.of ?? 10}` : d.interest ? 'Interest alignment: not enough information' : '');
    const cardOf = (d, tag) => ({ v: d.id, label: `${d.name}${tag ? ` · ${tag}` : ''}`, sub: [d.buyer ? `For ${d.buyer}` : '', interestWords(d)].filter(Boolean).join(' · '), lines: [d.offer ? `Offer: ${d.offer}` : '', d.fit ? `Why it fits you: ${d.fit}` : '', d.unknown ? `What the first test settles: ${d.unknown}` : '', d.firstTest ? `First test: ${d.firstTest}` : ''].filter(Boolean) });
    const options = [...(dirs.recommended ? [cardOf(dirs.recommended, 'Recommended')] : []), ...dirs.alternatives.map((d) => cardOf(d, '')), { v: 'none', label: 'None of these', sub: 'Say what puts you off and Mercer suggests a discovery step instead' }];
    if (!dirs.recommended && !dirs.alternatives.length) body.appendChild(el('p', 'small q-check', dirs.note || 'No direction clears your limits yet. Pick None of these and say what would need to change.'));
    if (dirs.tieBreaker) body.appendChild(el('p', 'small q-check', esc(dirs.tieBreaker)));
    let riders = [];
    const riderHost = el('div', 'q-riders');
    const paintRiders = () => { riders.splice(0).forEach((r) => r?.destroy?.()); riderHost.innerHTML = ''; riders.push(drawRider(riderHost, q, 'n28'), drawRider(riderHost, q, 'n29')); };
    const c = cardsRow(body, q, { id: q.id, options, value: st.n27 ?? null, caption: '', label: headline(q).title, onCommit(v) {
      const all = [dirs.recommended, ...dirs.alternatives].filter(Boolean);
      const d = all.find((x) => x.id === v) ?? null;
      st.direction = d ? { ...d, recommended: dirs.recommended?.id === d.id } : null;
      commit(q, v, c.el);
      paintRiders();
      enable();
    } });
    body.appendChild(riderHost);
    paintRiders();
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy?.(); riders.forEach((r) => r?.destroy?.()); } };
  },

  /** N31 with N32 and N38: who buys the first version, what is delivered first, how the first few are reached */
  n31(q, body, enable) {
    const st = S();
    const d = direction();
    const groups = (st.n19 ?? []).filter((x) => x !== 'other').map((g) => [g, labelIn(N19, g)]);
    const buyers = [...(d?.buyer ? [['direction', d.buyer]] : []), ...groups, ...(given(st.n19Other) ? [['n19other', String(st.n19Other).slice(0, 60)]] : []), ['other', 'Someone else']];
    const offers = Array.isArray(d?.offers) && d.offers.length ? [...d.offers.slice(0, 3).map((o, i) => [`d${i}`, String(o).slice(0, 80)]), ['other', 'Something else']] : N32;
    const c = stonesWithOther(body, q, { id: q.id, key: 'n31', otherKey: 'n31Other', options: buyers, placeholder: 'e.g. new parents in my town', caption: 'Who would buy the first version', enable });
    const offer = drawsInline('n32') ? stonesRow(body, q, { id: 'n32', key: 'n32', options: offers, value: st.n32 ?? null, caption: 'What you could deliver for them first', commitId: 'n32', onDone: (v) => { offOther.hidden = v !== 'other'; if (v === 'other' && !offLine) offLine = lineRow(offOther, q, { id: 'n32.other', key: 'n32Other', placeholder: 'e.g. a tidy set of accounts by the fifth of each month', caption: 'In your words', max: 160 }); } }) : null;
    const offOther = el('div', 'q-other');
    let offLine = null;
    offOther.hidden = st.n32 !== 'other';
    if (!offOther.hidden) offLine = lineRow(offOther, q, { id: 'n32.other', key: 'n32Other', placeholder: 'e.g. a tidy set of accounts by the fifth of each month', caption: 'In your words', max: 160 });
    body.appendChild(offOther);
    const reach = drawRider(body, q, 'n38', { caption: 'How you will reach the first few' });
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); offer?.destroy?.(); offLine?.destroy?.(); reach?.destroy?.(); } };
  },

  /** N33 with N34: the evidence of need, and the least costly test */
  n33(q, body, enable) {
    const st = S();
    const c = stonesRow(body, q, { id: q.id, key: 'n33', options: N33, multi: true, value: st.n33 ?? [], caption: 'What evidence is there that they need it?', commitId: 'n33', onDone: (v) => { if (Array.isArray(v) && v.length) enable(); else hold(); } });
    const test = drawRider(body, q, 'n34', { caption: 'How you could test interest before spending much', onDone: (v) => { tOther.hidden = v !== 'other'; if (v === 'other' && !tLine) tLine = lineRow(tOther, q, { id: 'n34.other', key: 'n34Other', placeholder: 'e.g. a weekend stall', caption: 'In your words', max: 120 }); } });
    const tOther = el('div', 'q-other');
    let tLine = null;
    tOther.hidden = st.n34 !== 'other';
    if (!tOther.hidden) tLine = lineRow(tOther, q, { id: 'n34.other', key: 'n34Other', placeholder: 'e.g. a weekend stall', caption: 'In your words', max: 120 });
    body.appendChild(tOther);
    if (answeredQ(q)) enable();
    return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); test?.destroy?.(); tLine?.destroy?.(); } };
  },

  /** N30, Task 13: the gap analysis for the chosen direction, in place of asking what support someone needs before
      there is anything to need it for. What to learn rides here, and the one decisive fact is a helper's availability */
  gaps(q, body, enable) {
    const st = S();
    const p = gapProposal();
    const riders = [];
    const riderHost = el('div', 'q-riders');
    const take = () => {
      st.n30 = [...(p.value ?? [])];
      st.n30Gaps = (p.gaps ?? []).map((g) => ({ ...g }));
      commit(q, st.n30, prop.el);
      riderHost.hidden = false;
      riders.splice(0).forEach((r) => r?.destroy?.());
      riderHost.innerHTML = '';
      riders.push(drawRider(riderHost, q, 'n15', { caption: 'What of that you would be willing to learn' }), drawRider(riderHost, q, 'n24', { caption: 'Whoever could help: where that stands' }));
      enable();
    };
    const prop = proposalRow(body, q, {
      id: q.id, lines: p.lines, basis: p.basis, acceptWords: 'That is fair', changeWords: 'Something is wrong', accepted: Array.isArray(st.n30),
      onAccept: () => { st.n30Edited = false; take(); },
      editor: (host) => stonesRow(host, q, {
        id: `${q.id}.own`, key: 'n30', options: N30, multi: true, value: Array.isArray(st.n30) ? st.n30 : [], caption: 'What would help most. Choose one or more', commitId: 'n30',
        onDone: (v) => { st.n30Edited = true; st.n30Gaps = (p.gaps ?? []).map((g) => ({ ...g })); if (Array.isArray(v) && v.length) { riderHost.hidden = false; enable(); } else hold(); },
      }),
    });
    body.appendChild(riderHost);
    riderHost.hidden = !answeredQ(q);
    if (answeredQ(q)) take();
    return { el: prop.el, focus: () => prop.focus(), destroy: () => { prop.destroy(); riders.forEach((r) => r?.destroy?.()); } };
  },

  /** N35, Task 13: the first delivery Mercer would make, with one observable evidence question where it is decisive */
  n35(q, body, enable) {
    const st = S();
    const p = deliveryProposal();
    let gap = null, needs = null, done = null;
    const gapHost = el('div', 'q-other');
    const needHost = el('div', 'q-other');
    const doneHost = el('div', 'q-other');
    const paintNeeds = () => { needs?.destroy?.(); needs = null; needHost.innerHTML = ''; needs = drawRider(needHost, q, 'n36', { caption: 'What the first delivery would require' }); };
    if (!p) {
      // nothing to propose yet: the screen asks the one fact that would let Mercer propose anything
      const c = stonesRow(body, q, { id: q.id, key: 'n35', options: N35, value: st.n35 ?? null, caption: 'Could you deliver a first version with the skills and time you have?', commitId: 'n35', onDone: (v) => { gapHost.hidden = v !== 'gap'; if (v === 'gap' && !gap) gap = lineRow(gapHost, q, { id: `${q.id}.gap`, key: 'n35Gap', placeholder: 'e.g. I have never priced a job', caption: 'The gap', max: 160 }); paintNeeds(); if (v) enable(); else hold(); } });
      body.append(gapHost, needHost);
      gapHost.hidden = st.n35 !== 'gap';
      paintNeeds();
      if (answeredQ(q)) enable();
      return { el: c.el, focus: () => c.focus(), destroy: () => { c.destroy(); gap?.destroy?.(); needs?.destroy?.(); } };
    }
    const prop = proposalRow(body, q, {
      id: q.id, lines: p.lines, basis: p.basis, acceptWords: 'I could do that', changeWords: 'Not quite', accepted: st.n35 === 'yes',
      onAccept: () => { st.n35Edited = false; st.n35 = 'yes'; commit(q, 'yes', prop.el); paintNeeds(); enable(); },
      editor: (host) => {
        const line = lineRow(host, q, { id: `${q.id}.gap`, key: 'n35Gap', placeholder: 'e.g. I have never done the pricing part', caption: 'What part of that you could not do yet', max: 200, onDone: (t) => { st.n35Edited = true; st.n35 = given(t) ? 'gap' : 'unsure'; commit(q, st.n35, host); paintNeeds(); enable(); } });
        return line;
      },
    });
    body.append(gapHost, needHost, doneHost);
    paintNeeds();
    // the decisive fact: whether this has been done at this level before. Skipped where an earlier answer settled it
    if (st.paidBefore !== 'paid') {
      done = stonesRow(doneHost, q, { id: `${q.id}.done`, key: 'doneBefore', options: [['yes', 'Yes'], ['similar', 'Something similar'], ['no', 'Not yet']], value: st.doneBefore ?? null, caption: 'Have you done this at this level before?', commitId: 'doneBefore' });
    }
    if (answeredQ(q)) enable();
    return { el: prop.el, focus: () => prop.focus(), destroy: () => { prop.destroy(); gap?.destroy?.(); needs?.destroy?.(); done?.destroy?.(); } };
  },

  /** N37, Task 13: a test price with its basis in the open. Where nothing can be said without inventing a figure, the
      screen asks the two facts a person can know instead: a price they have been paid, and what one costs them */
  n37(q, body, enable) {
    const st = S();
    const p = priceProposal();
    const facts = [];
    const factHost = el('div', 'q-facts');
    const take = (v, from) => { st.n37 = isNum(v) ? Math.round(v) : null; st.n37Basis = p?.basis?.[0]?.words ?? 'your own figure'; commit(q, st.n37, from); enable(); };
    const priceEditor = (host) => sliderRow(host, q, { id: `${q.id}.own`, key: 'n37', unit: 'for the first test', money: true, scale: [20, 2000], caption: 'What you would charge for the first test', commitId: 'n37', onDone: (v) => { st.n37Edited = true; st.n37Basis = 'your own figure'; enable(); } });
    let prop = null;
    if (p && isNum(p.value)) {
      prop = proposalRow(body, q, {
        id: q.id, lines: p.lines, basis: p.basis, acceptWords: 'Price it there', changeWords: 'Change the price', accepted: isNum(st.n37),
        onAccept: () => { st.n37Edited = false; take(p.value, prop.el); },
        editor: priceEditor,
      });
    } else if (p) {
      body.appendChild(el('p', 'q-prop-lead', esc(p.lines[0])));
      p.lines.slice(1).forEach((t) => body.appendChild(el('p', 'small q-check', esc(t))));
      facts.push(priceEditor(body));
    } else {
      body.appendChild(el('p', 'q-prop-lead', 'Mercer has no researched price for this yet, and will not invent one.'));
      body.appendChild(el('p', 'small q-check', 'Two facts you already know would let it propose one.'));
    }
    body.appendChild(factHost);
    facts.push(sliderRow(factHost, q, { id: `${q.id}.paid`, key: 'pricePaid', unit: 'a time', money: true, scale: [10, 2000], zero: true, caption: 'Anything you have been paid for work like this (nought if not)', commitId: 'pricePaid', onDone: () => { enable(); } }));
    facts.push(sliderRow(factHost, q, { id: `${q.id}.cost`, key: 'unitCost', unit: 'a delivery', money: true, scale: [1, 500], zero: true, caption: 'What one delivery costs you in materials or fees', commitId: 'unitCost', onDone: () => { enable(); } }));
    if (answeredQ(q)) enable();
    return { el: prop?.el ?? factHost, focus: () => (prop ? prop.focus() : facts[0]?.focus?.()), destroy: () => { prop?.destroy?.(); facts.forEach((f) => f?.destroy?.()); } };
  },

  /** N39 with N40 riding on it, Task 13: what says carry on, and what says stop. Two proposals, one screen, each with
      its own press, because they are the two halves of one decision taken before the test starts */
  n39(q, body, enable) {
    const st = S();
    const p = milestoneProposal();
    const take = (text, from) => { st.n39 = text; st.n39Weeks = p.weeks; commit(q, text, from); enable(); };
    const prop = proposalRow(body, q, {
      id: q.id, lines: p.lines, basis: p.basis, acceptWords: 'That would do it', changeWords: 'Set my own', accepted: given(st.n39),
      onAccept: () => { st.n39Edited = false; take(p.value, prop.el); },
      editor: (host) => lineRow(host, q, { id: `${q.id}.own`, key: 'n39Text', placeholder: 'e.g. five people ask for a price', caption: 'The result that would say carry on', max: 200, ghost: 'n39Text', onDone: (t) => { if (!given(t)) { hold(); return; } st.n39Edited = true; take(t, host); } }),
    });
    let stop = null;
    if (drawsInline('n40')) {
      const stopHost = el('div', 'q-part');
      stopHost.appendChild(el('p', 'q-cap', headline(BY_ID.n40).sub));
      body.appendChild(stopHost);
      stop = KIND.n40(BY_ID.n40, stopHost, () => {});
    }
    if (answeredQ(q)) enable();
    return { el: prop.el, focus: () => prop.focus(), destroy: () => { prop.destroy(); stop?.destroy?.(); } };
  },

  /** N40, Task 13: the cap on money and time. Built from the test budget and the time already given */
  n40(q, body, enable) {
    const st = S();
    const p = stopProposal();
    const take = (text, from) => { st.n40 = text; st.n40Weeks = p.weeks; st.n40Spend = p.spend; commit(q, text, from); enable(); };
    let weeks = null, spend = null;
    const prop = proposalRow(body, q, {
      id: q.id, lines: p.lines, basis: p.basis, acceptWords: 'That is the cap', changeWords: 'Change the cap', accepted: given(st.n40),
      onAccept: () => { st.n40Edited = false; take(p.value, prop.el); },
      editor: (host) => {
        weeks = sliderRow(host, q, { id: `${q.id}.weeks`, key: 'n40Weeks', unit: 'weeks', scale: [2, 26], snap: 1, log: false, caption: 'Weeks before you stop or change', commitId: 'n40Weeks', onDone: () => { st.n40Edited = true; take(`${plural(st.n40Weeks, 'week', 'weeks')}${isNum(st.n40Spend) && st.n40Spend > 0 ? ` or ${gbp(st.n40Spend)} spent` : ''}, whichever comes first.`, host); } });
        spend = sliderRow(host, q, { id: `${q.id}.spend`, key: 'n40Spend', unit: 'spent', money: true, scale: [0, 2000], zero: true, caption: 'The most you would spend before stopping', commitId: 'n40Spend', onDone: () => { st.n40Edited = true; take(`${plural(st.n40Weeks ?? p.weeks, 'week', 'weeks')}${isNum(st.n40Spend) && st.n40Spend > 0 ? ` or ${gbp(st.n40Spend)} spent` : ''}, whichever comes first.`, host); } });
        return weeks;
      },
    });
    if (answeredQ(q)) enable();
    return { el: prop.el, focus: () => prop.focus(), destroy: () => { prop.destroy(); weeks?.destroy?.(); spend?.destroy?.(); } };
  },

  /** revenue is money: the £ sits before the figure and on the rail's two ticks */
  /** revenue is money: the £ sits before the figure and on the rail's two ticks; £0 is an answer (E05) */
  now(q, body, enable) {
    return renderSlider({ ...q, money: true, zero: true }, body, enable, { scale: [1000, 100000] });
  },

  /** type what the business does, or pick a section; the section's trades follow as a second row */
  sector(q, body, enable) {
    const st = S();
    const sectors = M.SECTORS ?? [];
    const INDEX = sectors.flatMap((s) => (s.kinds ?? []).map((k) => ({ sector: s.id, sectorName: s.name, trade: k })));
    const wrap = el('div', 'sector-pick');
    body.appendChild(wrap);
    const find = el('input', 'field');
    find.type = 'search'; find.autocomplete = 'off'; find.spellcheck = false;
    find.placeholder = 'e.g. we fit kitchens for homeowners';
    find.setAttribute('aria-label', 'What the business does: type it, and pick the industry that fits');
    find.value = st.does ?? '';
    wrap.appendChild(find);
    const hits = el('div', 'stone-row sector-hits');
    hits.hidden = true;
    wrap.appendChild(hits);
    let kindsCtl = null;
    const kindsHost = el('div', 'sector-kinds');
    const settle = (id, trade, from) => {
      const had = st.sector;
      st.sector = id;
      st.niche = M.nicheOf?.(id) ?? null;
      st.trade = trade ?? '';
      commit(q, id, from);
      if (had === id && trade !== undefined) M.flow?.forward?.('industry');
      paintKinds();
      enable();
    };
    const sectorCtl = M.ui.stones(wrap, {
      id: q.id, hue: hueOf(q), options: sectors.map((s) => [s.id, s.name]), value: st.sector ?? null, label: headline(q).title, foldAt: 6, moreWords: 'more',
      onCommit(v) { if (v === null || v === undefined) { hold(); return; } settle(v, st.sector === v ? st.trade : '', sectorCtl.el); },
    });
    wrap.appendChild(kindsHost);
    function paintKinds() {
      kindsCtl?.destroy(); kindsCtl = null;
      kindsHost.innerHTML = '';
      const s = sectors.find((x) => x.id === st.sector);
      if (!s || !s.kinds?.length) return;
      kindsCtl = M.ui.stones(kindsHost, {
        id: 'trade', hue: hueOf(q), options: s.kinds.map((k) => [k, k]), value: st.trade || null, label: 'Trade', foldAt: 6, moreWords: 'more', clearable: true,
        onCommit(v) { const was = st.trade; st.trade = v ?? ''; if (was !== st.trade) M.flow?.forward?.('industry'); },
      });
    }
    const stem = (w) => w.replace(/(ancy|ants?|ency|ents?|ists?|ers?|ing|ies|al|y|s)$/, '');
    const STOP = new Set(['we', 'our', 'the', 'and', 'for', 'to', 'of', 'a', 'an', 'in', 'on', 'with', 'people', 'help', 'do', 'does', 'it', 'is', 'are', 'business', 'company', 'firm', 'local', 'small']);
    /* extra words that point at a trade, for a description that does not name one */
    const HINTS = { kitchen: 'Joinery', bathroom: 'Plumbing and heating', boiler: 'Plumbing and heating', wiring: 'Electrical', roof: 'Roofing', garden: 'Landscaping', lawn: 'Landscaping', clean: 'Cleaning', hair: 'Hair salon', nail: 'Nails', tax: 'Accountancy', account: 'Accountancy', book: 'Bookkeeping', website: 'Web development', app: 'App studio', software: 'Software platform', tutor: 'Tutoring', lesson: 'Tutoring', coach: 'Personal training', gym: 'Gym or studio', dog: 'Anything not listed', cake: 'Catering', food: 'Catering', wedding: 'Events and weddings', photo: 'Photography', video: 'Film and video', print: 'Print', van: 'Courier', deliver: 'Courier', let: 'Lettings', rent: 'Lettings', mortgage: 'Mortgage advice', insurance: 'Insurance broking', physio: 'Physiotherapy', dental: 'Dental practice', teeth: 'Dental practice', therapy: 'Therapy and counselling', care: 'Care at home', solar: 'Solar and renewables', shop: 'High street shop', online: 'Online shop', sell: 'Online shop' };
    const search = () => {
      const f = find.value.trim().toLowerCase();
      st.does = find.value.trim().slice(0, 160);
      hits.innerHTML = '';
      hits.hidden = !f;
      sectorCtl.el.hidden = Boolean(f);
      kindsHost.hidden = Boolean(f);
      if (!f) return;
      const words = f.split(/[^a-z]+/).filter((w) => w.length > 1 && !STOP.has(w));
      // every trade is scored by the words it shares with the description, whole or stemmed; the best few are offered
      const score = (t) => {
        const hay = `${t.trade} ${t.sectorName}`.toLowerCase();
        if (hay.includes(f)) return 10;
        const parts = hay.split(/[^a-z]+/).filter(Boolean);
        let s = 0;
        words.forEach((w) => { const st2 = stem(w); if (st2.length >= 3 && parts.some((x) => x === w || x.startsWith(st2) || stem(x) === st2)) s += 2; if (HINTS[w] === t.trade || (HINTS[st2] === t.trade)) s += 3; });
        return s;
      };
      INDEX.map((t) => ({ t, s: score(t) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8).forEach(({ t: h }) => {
        const b = el('button', 'stone hit');
        b.type = 'button';
        b.innerHTML = `<span>${esc(h.trade)}</span><span class="small">${esc(h.sectorName)}</span>`;
        b.setAttribute('aria-pressed', String(st.sector === h.sector && st.trade === h.trade));
        b.addEventListener('click', () => { M.feel?.play?.('tap', { x: M.feel?.panOf?.(b) }); sectorCtl.set(h.sector, true); settle(h.sector, h.trade, b); hits.innerHTML = ''; hits.hidden = true; sectorCtl.el.hidden = false; kindsHost.hidden = false; });
        hits.appendChild(b);
      });
      if (!hits.children.length) hits.appendChild(el('p', 'small', 'No trade matches those words yet. Pick the nearest group below.'));
      if (!hits.children.length || hits.querySelector('p')) { sectorCtl.el.hidden = false; kindsHost.hidden = false; }
    };
    find.addEventListener('input', search);
    find.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const first = $('.hit', hits); if (first) first.click(); } });
    paintKinds();
    if (answeredQ(q)) enable();
    return { el: wrap, focus: () => find.focus(), destroy: () => { sectorCtl.destroy(); kindsCtl?.destroy(); } };
  },

  /** Established (R12): the year as before, the month beside it with Unknown, and one line under both that always says
      what is held. The year sits on a hairline that stays put whether the field is empty, focused or filled: the bare
      figure had no box, no focus mark and a ghost "0" for a year, so an empty field read as nothing once it took focus. */
  established(q, body, enable) {
    const st = S();
    const yr = YEAR();
    const wrap = el('div', 'est');
    body.appendChild(wrap);
    const yearHost = el('div', 'est-part est-year');
    yearHost.appendChild(el('span', 'est-cap', 'Year'));
    const monthHost = el('div', 'est-part est-month');
    monthHost.appendChild(el('span', 'est-cap', 'Month'));
    const held = el('p', 'est-held');
    held.setAttribute('role', 'status');
    wrap.append(yearHost, monthHost, held);
    const yearOf = () => (isNum(st.yearsTrading) ? yr - st.yearsTrading : null);
    const valid = (v) => isNum(v) && v >= 1900 && v <= yr;
    const paintHeld = () => {
      const y = yearOf();
      const m = isNum(st.estMonth) && MONTH_NAME[st.estMonth - 1] ? MONTH_NAME[st.estMonth - 1] : null;
      held.textContent = y ? `Established ${m ? `${m} ${y}` : `${y}, month unknown`}` : `No year yet. Month: ${m ?? 'unknown'}`;
    };
    const year = M.ui.field(yearHost, {
      id: q.id, hue: hueOf(q), digits: 4, min: 1900, max: yr, start: yr, value: yearOf(), label: 'Year established', placeholder: 'YYYY',
      rangeWords: (lo, hi) => `A year from ${lo} to ${hi}`,
      onInput: (v) => { if (valid(v)) enable(); else if (!answeredQ(q)) hold(); },
      onCommit(v) {
        // a year Mercer cannot use stays in the field as typed, the line beside it gives the range, and the year held is kept
        if (!valid(v)) { if (!answeredQ(q)) hold(); paintHeld(); return; }
        commit(q, yr - v, year.el);
        paintHeld();
        enable();
      },
    });
    const month = M.ui.stones(monthHost, {
      id: 'estMonth', hue: hueOf(q), options: [...MONTH_NAME.map((n, i) => [i + 1, n.slice(0, 3)]), ['unknown', 'Unknown']], value: isNum(st.estMonth) ? st.estMonth : 'unknown', label: 'Month established', foldAt: 13,
      onCommit(v) {
        const m = isNum(v) && v >= 1 && v <= 12 ? v : null;
        if (m === null && v !== 'unknown') month.set('unknown', true);
        st.estMonth = m;
        // the month rides on the year's answer: with a year held it goes through app.js, so the twig and a saved copy follow
        if (answeredQ(q) && typeof M.commit === 'function') M.commit('estMonth', m, { fromEl: month.el });
        paintHeld();
      },
    });
    paintHeld();
    if (answeredQ(q)) enable();
    return { el: wrap, focus: () => year.focus(), destroy: () => { year.destroy(); month.destroy(); } };
  },

  /** the import step (R12): a web address, a paste box and a local file, then what Mercer found. Every part is optional and
      nothing here ever holds Next. research.js owns the list and the reader; this draws them. */
  import(q, body, enable) {
    const st = S();
    const R = () => M.research ?? {};
    enable();
    const wrap = el('div', 'import');
    body.appendChild(wrap);
    // one line, at the moment of use: what is read here, and that a find is not an answer until confirmed (brief 2.3 item 2)
    wrap.appendChild(el('p', 'small import-says', 'Pasted text and files are read in this browser. Leave out anything you do not want read. All of it is optional.'));
    const part = (cap) => { const p = el('div', 'import-part'); p.appendChild(el('p', 'import-cap', esc(cap))); wrap.appendChild(p); return p; };

    // 1. the web address: research.js writes the one sentence about it under the box when an address is typed
    const webPart = part('Web address');
    const addr = M.ui.line(webPart, {
      id: q.id, hue: hueOf(q), value: st.site ?? '', placeholder: 'e.g. abcconsulting.co.uk', max: 20000, label: 'Web address', ghost: null,
      onInput: () => enable(),
      onCommit(v) {
        const a = M.siteFrom ? M.siteFrom(v) : '';
        if (!a) { if (given(st.site)) { st.site = ''; M.flow?.backward?.('site'); } enable(); return; }
        commit(q, a, addr.el);
        enable();
      },
    });
    const siteFound = el('div', 'site-found');
    siteFound.setAttribute('aria-live', 'polite');
    webPart.appendChild(siteFound);
    const box = $('textarea', addr.el) ?? $('input', addr.el);
    if (box) { try { R().mount?.(box, siteFound); } catch (e) { /* the reader is optional */ } }

    // 2. pasted text: read on a press, in this browser
    const status = el('p', 'import-status small');
    status.setAttribute('role', 'status');
    const say = (words, added) => {
      const n = added.length;
      status.textContent = !words ? 'There is no text to read yet.'
        : n ? `Read ${plural(words, 'word', 'words')} in this browser. ${n === 1 ? '1 find is' : `${count(n)} finds are`} listed below.`
          : `Read ${plural(words, 'word', 'words')} in this browser. Mercer found nothing it could quote, so the questions will ask instead.`;
    };
    const pastePart = part('Paste text');
    pastePart.appendChild(el('p', 'small import-looks', 'Mercer looks for revenue, sale value, margin, team size, enquiries and the year established. Each find shows the line it came from.'));
    const paste = M.ui.line(pastePart, {
      id: `${q.id}.text`, hue: hueOf(q), value: '', placeholder: 'e.g. your About page, a service list, or notes on your figures', max: 200000, label: 'Paste text', ghost: null,
      onInput: (v) => { readBtn.disabled = !(v && String(v).trim()); },
      onCommit() {},
    });
    const readBtn = el('button', 'stone import-read', 'Read this text');
    readBtn.type = 'button';
    readBtn.disabled = true;
    readBtn.addEventListener('click', () => {
      try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(readBtn) }); } catch (e) { /* no sound */ }
      const r = R().readText?.(paste.get?.() ?? '', 'the text you pasted') ?? { words: 0, added: [] };
      say(r.words, r.added);
      enable();
    });
    pastePart.appendChild(readBtn);

    // 3. a local file, read in this browser by research.js (txt, md, csv, a text PDF, a Word .docx; 10 MB). A failed read says
    //    why under the button and changes nothing else: the paste box and the address keep their text and Continue stays open
    const filePart = part('A file');
    const fileRow = el('div', 'file-row q-file');
    const fileBtn = el('button', 'stone file-btn', 'Choose a file');
    fileBtn.type = 'button';
    fileBtn.setAttribute('aria-label', 'A file: choose a file');
    const fileIn = el('input', 'file-in q-file-in');
    fileIn.type = 'file'; fileIn.accept = R().ACCEPT ?? '.txt,.md,.csv,.pdf,.docx'; fileIn.tabIndex = -1; fileIn.setAttribute('aria-hidden', 'true');
    const fileName = el('span', 'file-name');
    fileRow.append(fileBtn, fileIn, fileName);
    filePart.appendChild(fileRow);
    filePart.appendChild(el('p', 'small file-sub', '.txt, .md, .csv, a text PDF or a Word .docx, up to 10 MB. A scanned PDF has no text to read: paste it instead.'));
    const fileNote = el('p', 'ui-note file-note small');
    fileNote.setAttribute('role', 'status');
    fileNote.hidden = true;
    filePart.appendChild(fileNote);
    const sayFile = (t) => { fileNote.textContent = t; fileNote.hidden = !t; };
    const readOne = async (f) => {
      if (!f || typeof R().readFile !== 'function') return;
      fileBtn.setAttribute('aria-busy', 'true');
      sayFile(`Reading ${f.name} in this browser…`);
      let r;
      try { r = await R().readFile(f); } catch (e) { r = { ok: false, error: 'That file could not be read. Paste the text instead.' }; }
      fileBtn.removeAttribute('aria-busy');
      if (!r.ok) { sayFile(r.error || 'That file could not be read. Paste the text instead.'); enable(); return; }
      fileName.textContent = f.name;
      sayFile('');
      say(r.words, r.added);
      enable();
    };
    fileBtn.addEventListener('click', () => { try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(fileBtn) }); } catch (e) { /* no sound */ } fileIn.click(); });
    fileIn.addEventListener('change', () => { const f = fileIn.files?.[0]; fileIn.value = ''; readOne(f); });
    fileRow.addEventListener('dragover', (e) => { e.preventDefault(); fileRow.classList.add('over'); });
    fileRow.addEventListener('dragleave', () => fileRow.classList.remove('over'));
    fileRow.addEventListener('drop', (e) => { e.preventDefault(); fileRow.classList.remove('over'); readOne(e.dataTransfer?.files?.[0]); });
    const file = { el: fileRow, readOne, destroy() {} };
    wrap.appendChild(status);

    // 4. what Mercer found: edit, exclude or confirm each one
    const foundPart = el('div', 'import-part import-found');
    foundPart.appendChild(el('p', 'import-cap', 'What Mercer found'));
    const list = el('ul', 'found-list');
    foundPart.appendChild(list);
    wrap.appendChild(foundPart);
    /** the answer already held for a find's question, or null: a conflict shows both values and the visitor picks one */
    const heldFor = (item) => {
      const tq = item.q ? BY_ID[item.q] : null;
      if (!tq || tq.hidden || item.status === 'confirmed' || !answeredQ(tq)) return null;
      const cur = item.field === 'founded' ? YEAR() - st.yearsTrading : st[tq.key];
      if (cur === item.value) return { same: true };
      const w = answerWord(tq.id);
      return w ? { same: false, words: w } : null;
    };
    const paintFound = (focusId, focusAct) => {
      const items = R().found?.() ?? [];
      foundPart.hidden = !items.length;
      list.innerHTML = '';
      items.forEach((item) => {
        const row = el('li', 'found-row');
        row.dataset.status = item.status;
        row.appendChild(el('span', 'found-lab', esc(item.label)));
        const val = el('input', 'found-val');
        val.type = 'text'; val.autocomplete = 'off'; val.spellcheck = false;
        val.value = R().shown?.(item) ?? String(item.value);
        val.setAttribute('aria-label', `${item.label}: the value found. Edit it if it is wrong`);
        const note = el('span', 'found-say small');
        note.setAttribute('role', 'status');
        val.addEventListener('change', () => {
          const done = R().edit?.(item.id, val.value);
          // text Mercer cannot read stays in the box as typed; the find keeps its last good value
          if (!done) note.textContent = item.field === 'founded' ? `A year from 1900 to ${YEAR()}. Your text is kept as typed.` : 'Mercer cannot read that. Your text is kept as typed.';
        });
        val.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); val.blur(); } });
        row.appendChild(val);
        const quote = String(item.quote ?? '').trim();
        const from = String(item.source ?? '').replace(/^https?:\/\//, '').slice(0, 60);
        const src = [quote ? `“${quote.slice(0, 120)}${quote.length > 120 ? '…' : ''}”` : '', from ? `from ${from}` : '', item.note, item.edited ? 'edited by you' : ''].filter(Boolean).join(' · ');
        row.appendChild(el('span', 'found-src small', esc(src)));
        const held = heldFor(item);
        const acts = el('div', 'found-acts');
        const mk = (act, words, on, label) => {
          const b = el('button', 'stone small', words);
          b.type = 'button'; b.dataset.act = act; b.dataset.id = item.id;
          b.setAttribute('aria-pressed', String(on));
          b.setAttribute('aria-label', `${label ?? words}: ${item.label}`);
          acts.appendChild(b);
          return b;
        };
        if (held && !held.same && item.status !== 'excluded') {
          // a conflict: both values on show, and the choice is the visitor's. Neither is replaced until they press
          row.classList.add('found-conflict');
          row.appendChild(el('span', 'found-held small', esc(`Found ${R().shown?.(item) ?? item.value}; you answered ${held.words}. Which stands?`)));
          mk('confirm', `Use ${R().shown?.(item) ?? item.value}`, false, 'Use the value found');
          mk('exclude', `Keep ${held.words}`, false, 'Keep my answer');
        } else {
          if (held?.same) row.appendChild(el('span', 'found-held small', 'Matches your answer.'));
          mk('confirm', item.status === 'confirmed' ? 'Confirmed' : 'Confirm', item.status === 'confirmed');
          mk('exclude', item.status === 'excluded' ? 'Excluded' : 'Exclude', item.status === 'excluded');
        }
        row.append(acts, note);
        list.appendChild(row);
      });
      if (focusId) { try { list.querySelector(`button[data-id="${focusId}"][data-act="${focusAct}"]`)?.focus({ preventScroll: true }); } catch (e) { /* gone */ } }
    };
    let lastFocus = null;
    list.addEventListener('click', (e) => {
      const b = e.target.closest?.('button[data-act]');
      if (!b) return;
      const item = (R().found?.() ?? []).find((f) => f.id === b.dataset.id);
      if (!item) return;
      try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(b) }); } catch (err) { /* no sound */ }
      lastFocus = [item.id, b.dataset.act];
      if (b.dataset.act === 'confirm') { if (item.status === 'confirmed') { R().exclude?.(item.id); R().restore?.(item.id); } else R().confirm?.(item.id); }
      else if (item.status === 'excluded') R().restore?.(item.id); else R().exclude?.(item.id);
      enable();
    });
    const onFound = () => { paintFound(lastFocus?.[0], lastFocus?.[1]); lastFocus = null; enable(); };
    document.addEventListener('mercer:found', onFound);
    paintFound();
    // the note speaks for the fields that take the visitor's text: it follows the last of them (the file part, else the paste box)
    privacyNote(wrap, file?.el?.closest?.('.import-part') ?? pastePart);
    enable();
    return { el: wrap, focus: () => addr.focus(), destroy: () => { document.removeEventListener('mercer:found', onFound); addr.destroy(); paste.destroy(); file?.destroy?.(); } };
  },

  /** the founder's energy (R17): the same sort as Strengths, seven tiles, gives energy on the left and drains on the right */
  energy(q, body, enable) {
    const st = S();
    const cur = st.energy && typeof st.energy === 'object' ? st.energy : {};
    const c = M.ui.sort(body, {
      id: q.id, hue: hueOf(q), tiles: ENERGY, zones: ['gives energy', 'drains'], value: { strengths: [...(cur.gives ?? [])], avoids: [...(cur.drains ?? [])] }, label: headline(q).title,
      onCommit(v) {
        const gives = [...(v.strengths ?? [])], drains = [...(v.avoids ?? [])];
        if (!gives.length && !drains.length) { st.energy = null; M.flow?.backward?.('energy'); hold(); return; }
        commit(q, { gives, drains }, c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** how decisions are made (R17): two either-ors on the two-sided instrument; the letters grid belongs to Personality and is left out */
  decisionSpeed(q, body, enable) {
    const st = S();
    const code = typeof st.decisionSpeed === 'string' && st.decisionSpeed.length === SPEED_AXES.length ? st.decisionSpeed : null;
    const c = M.ui.twoSided(body, {
      id: q.id, hue: hueOf(q), axes: SPEED_AXES, types: [], value: { axes: code ? code.split('') : SPEED_AXES.map(() => null), code }, label: headline(q).title,
      onCommit(v) { if (!v?.code) return; commit(q, v.code, c.el); enable(); },
    });
    const know = c.el ? $('.know', c.el) : null;
    if (know) { know.hidden = true; know.setAttribute('aria-hidden', 'true'); know.tabIndex = -1; know.style.display = 'none'; }
    if (answeredQ(q)) enable();
    return c;
  },

  /** decision rights (R18): five named decisions into three holders, on the sorter. A part-sorted answer counts */
  decisionRights(q, body, enable) {
    const st = S();
    const cur = st.decisionRights && typeof st.decisionRights === 'object' ? st.decisionRights : {};
    const c = M.ui.sorter(body, {
      id: q.id, hue: hueOf(q), bins: HOLDERS, items: DECISIONS, partial: true, clearWords: 'Clear', label: headline(q).title,
      value: DECISIONS.map(([id]) => ({ id, bin: cur[id] ?? null, route: null })),
      routesFor: () => [],
      onCommit(v) {
        const map = {};
        (Array.isArray(v) ? v : []).forEach((x) => { if (x?.id && x.bin) map[x.id] = x.bin; });
        if (!Object.keys(map).length) { st.decisionRights = null; M.flow?.backward?.('decisionRights'); hold(); return; }
        commit(q, map, c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** S03 and S04 on one screen: the target and the appetite dial, then the months arc; a starter may give a milestone in words instead */
  goal(q, body, enable) {
    const st = S();
    const row = el('div', 'goal-row');
    body.appendChild(row);
    const goalHost = el('div', 'goal-figure');
    const dialHost = el('div', 'goal-dial');
    row.append(goalHost, dialHost);
    const gq = { ...q, money: true, scale: isStarter() ? [200, 20000] : [1000, 200000] };
    const slider = renderSlider(gq, goalHost, enable, { value: st.goal ?? null, onCommit: (v, from) => { commit(q, v, from); } });
    // D4: the dial and the horizon are questions of their own; app.js asks each straight after this one
    const dial = drawsInline('appetite') ? KIND.appetite(BY_ID.appetite, dialHost, () => {}) : null;
    let milestone = null;
    if (isStarter()) milestone = lineRow(body, q, { id: 'milestone', key: 'milestone', placeholder: 'e.g. three paying customers by the summer', caption: 'Or a milestone, in your words', max: 160, onDone: (t) => { if (t) enable(); } });
    let months = null;
    if (drawsInline('months')) { const when = qpart(body, 'When', 'goal-when'); months = KIND.months(BY_ID.months, when, () => {}); }
    if (answeredQ(q)) enable();
    return { el: row, focus: () => slider.focus(), destroy: () => { slider.destroy(); dial?.destroy?.(); months?.destroy?.(); milestone?.destroy?.(); } };
  },

  appetite(q, body, enable) {
    const st = S();
    const c = M.ui.dial(body, {
      id: q.id, hue: hueOf(q), levels: APPETITE, value: st.appetite ?? 'moderate', label: headline(q).sub, line: appetiteLine, readout: READOUT.dial, size: window.innerWidth <= 720 ? 120 : 96,
      onCommit(v) { if (!v) return; commit(q, v, c.el); enable(); },
    });
    return c;
  },

  months(q, body, enable) {
    // the arc opens on twelve months, so twelve is the answer until the visitor moves it
    const st = S();
    if (!isNum(st.months)) { st.months = 12; derive(q.id); M.flow?.forward?.(q.key); }
    const c = M.ui.monthsArc(body, {
      id: q.id, hue: hueOf(q), value: st.months, label: headline(q).title, monthName: (n) => (typeof M.monthName === 'function' ? M.monthName(n) : ''),
      onCommit(v) { if (!isNum(v)) return; commit(q, clamp(Math.round(v), 1, 12), c.el); enable(); },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  price(q, body, enable) {
    return renderSlider({ ...q, money: true, scale: [100, 20000] }, body, enable, {
      onCommit: (v, from) => { delete derivedMap().price; S().priceMix = null; commit(q, v, from); },
    });
  },

  retainer(q, body, enable) {
    const st = S();
    const have = isNum(st.retainerMin) && isNum(st.retainerMax) && isNum(st.retainerValue);
    const c = M.ui.fee(body, {
      id: q.id, hue: hueOf(q), value: have ? { min: st.retainerMin, max: st.retainerMax, avg: st.retainerValue } : null, words: ['Lowest', 'Typical', 'Highest'], label: headline(q).title,
      readout: READOUT.fee,
      onCommit(v) {
        if (!v || !isNum(v.avg)) return;
        st.retainerMin = Math.round(v.min); st.retainerMax = Math.round(v.max);
        commit(q, Math.round(v.avg), c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** E18, Task 17: the routes new customers come from. A press selects a route and a second press clears it. Nothing
      else happens in that press: what was tried is its own screen, and the order is its own step under this one */
  channel(q, body, enable) {
    const st = S();
    const rows = [];
    let rank = null;
    const rankHost = el('div', 'q-other');
    const bins = quadrant();
    const hide = coldCallHidden() ? ['cold-call'] : [];
    const explain = shelfExplain();
    const settle = () => {
      const engines = doingList().map((id) => M.DIST_BY?.[id]?.engine).filter(Boolean);
      const ranked = Array.isArray(st.channelRank) ? st.channelRank.filter((x) => doingList().includes(x)) : [];
      const first = ranked.map((id) => M.DIST_BY?.[id]?.engine).find(Boolean);
      st.channel = first ?? (ENGINE_ORDER.find((e) => engines.includes(e)) ?? null);
      if (!doingList().length) { hold(); return; }
      commit(q, st.channel, rows[0]?.c?.el);
      enable();
    };
    const syncRows = () => rows.forEach((r) => r.c.set?.(doingList().filter((id) => r.ids.includes(id)), true));
    const paintRank = () => {
      rank?.destroy?.(); rank = null; rankHost.innerHTML = '';
      const picked = [...doingList()];
      rankHost.hidden = picked.length < 2;
      if (picked.length < 2) { st.channelRank = picked.length ? [...picked] : null; return; }
      if (!Array.isArray(st.channelRank) || st.channelRank.length !== picked.length) st.channelRank = [...picked];
      rank = rankRow(rankHost, q, {
        id: 'channelRank', caption: headline(BY_ID.channelRank).sub, label: headline(BY_ID.channelRank).title,
        items: picked.map((id) => ({ v: id, label: distName(id) })), value: [...st.channelRank],
        onCommit(order) {
          st.channelRank = [...order];
          // taking one out of the order takes it out of the routes in use, and the rows above follow
          if (order.length && order.length < doingList().length) { st.doing = [...order]; syncRows(); }
          if (typeof M.commit === 'function') M.commit('channelRank', [...order], { fromEl: rankHost });
          settle();
        },
      });
    };
    st.doing ??= [];
    Object.keys(bins).forEach((bin) => {
      const ids = (bins[bin] ?? []).filter((id) => !hide.includes(id));
      if (!ids.length) return;
      const part = qpart(body, SHELF_HEAD[bin], 'q-routes-part');
      part.appendChild(el('p', 'small explain', esc(explain[bin] ?? '')));
      const c = M.ui.stones(part, {
        id: `${q.id}.${bin}`, hue: hueOf(q), options: ids.map((id) => [id, distName(id)]), multi: true, value: doingList().filter((id) => ids.includes(id)),
        label: `${headline(q).title}: ${SHELF_HEAD[bin]}`, foldAt: 6, moreWords: 'more', lead: false,
        onCommit(v) {
          const picked = Array.isArray(v) ? v : [];
          st.doing = [...doingList().filter((id) => !ids.includes(id)), ...picked];
          paintRank();
          settle();
        },
      });
      rows.push({ c, ids });
    });
    body.appendChild(rankHost);
    paintRank();
    if (answeredQ(q)) enable();
    return { el: rows[0]?.c?.el ?? body, focus: () => rows[0]?.c?.focus(), destroy: () => { rows.forEach((r) => r.c.destroy?.()); rank?.destroy?.(); } };
  },

  /** E18, Task 17: how much of that route the business already does, because the next step on it depends on the count */
  channelVolume(q, body, enable) {
    const st = S();
    const route = volumeRoute();
    const ask = route ? volumeAsk(route) : null;
    if (!ask) { body.appendChild(el('p', 'small q-check', 'Nothing here depends on a count.')); enable(); return { el: body, focus() {}, destroy() {} }; }
    st.channelVolume ??= {};
    const per = ask[1] === 'a week' ? 'a week' : 'a month';
    const c = M.ui.slider(body, {
      id: q.id, hue: hueOf(q), value: isNum(st.channelVolume[route]) ? st.channelVolume[route] : null, unit: per, scale: [1, 200], log: true, snap: (v) => Math.round(v),
      label: `${distName(route)}: ${ask[0]} ${per}`,
      onInput: (v) => { if (isNum(v) && v >= 0) enable(); else hold(); },
      onCommit(v) {
        if (!isNum(v) || v < 0) { hold(); return; }
        st.channelVolume = { ...st.channelVolume, [route]: Math.round(v) };
        if (typeof M.commit === 'function') M.commit('channelVolume', { ...st.channelVolume }, { fromEl: c.el }); else derive('channelVolume');
        enable();
      },
    });
    railHint(c);
    body.appendChild(el('p', 'small q-check', esc(`A figure you can check beats a guess: the plan says what to change about ${distName(route)} from this count, not from an assumed one.`)));
    if (isNum(st.channelVolume[route])) enable();
    return c;
  },

  /** E19, Task 17: routes tried and not used now. Separate from what is in use, so one press never means two things */
  tried(q, body, enable) {
    const st = S();
    const rows = [];
    const bins = quadrant();
    const hide = coldCallHidden() ? ['cold-call'] : [];
    st.tried ??= [];
    const settle = () => { st.triedNone = triedList().length === 0 ? st.triedNone : false; commit(q, [...triedList()], rows[0]?.el); enable(); };
    Object.keys(bins).forEach((bin) => {
      const ids = (bins[bin] ?? []).filter((id) => !hide.includes(id) && !doingList().includes(id));
      if (!ids.length) return;
      const part = qpart(body, SHELF_HEAD[bin], 'q-routes-part');
      const c = M.ui.stones(part, {
        id: `${q.id}.${bin}`, hue: hueOf(q), options: ids.map((id) => [id, distName(id)]), multi: true, value: triedList().filter((id) => ids.includes(id)),
        label: `${headline(q).title}: ${SHELF_HEAD[bin]}`, foldAt: 6, moreWords: 'more', lead: false,
        onCommit(v) { const picked = Array.isArray(v) ? v : []; st.tried = [...triedList().filter((id) => !ids.includes(id)), ...picked]; settle(); },
      });
      rows.push(c);
    });
    const none = el('button', 'stone', 'Nothing else tried');
    none.type = 'button';
    none.setAttribute('aria-pressed', String(Boolean(st.triedNone)));
    none.addEventListener('click', () => { const on = none.getAttribute('aria-pressed') !== 'true'; none.setAttribute('aria-pressed', String(on)); tapEl(none); st.triedNone = on; if (on) { st.tried = []; rows.forEach((c) => c.set?.([], true)); } commit(q, [...triedList()], none); enable(); });
    body.appendChild(none);
    if (answeredQ(q)) enable();
    return { el: rows[0]?.el ?? none, focus: () => (rows[0] ? rows[0].focus() : none.focus()), destroy: () => { rows.forEach((c) => c.destroy?.()); none.remove(); } };
  },

  /** one row per tried route: worked, mixed, no result */
  went(q, body, enable) {
    const st = S();
    st.went ??= {};
    const wrap = el('div', 'went-rows');
    body.appendChild(wrap);
    const ctls = triedList().map((id) => {
      const row = el('div', 'went-row-q');
      row.appendChild(el('span', 'went-lab', esc(distName(id))));
      const c = M.ui.stones(row, {
        id: `${q.id}.${id}`, hue: hueOf(q), options: WENT, value: st.went[id] ?? null, label: distName(id),
        onCommit(v) {
          if (!v) return;
          st.went = { ...st.went, [id]: v };
          if (answeredQ(q)) { commit(q, { ...st.went }, c.el); enable(); }
        },
      });
      wrap.appendChild(row);
      return c;
    });
    // E19: a short reason, so a failed tactic is not recommended again without saying what changes
    const why = lineRow(wrap, q, { id: `${q.id}.why`, key: 'wentWhy', placeholder: 'e.g. the leads were the wrong kind', caption: 'Why, in a few words (optional)', max: 160 });
    if (answeredQ(q)) enable();
    return { el: wrap, focus: () => ctls[0]?.focus(), destroy: () => { ctls.forEach((c) => c.destroy()); why.destroy(); } };
  },

  closeRate(q, body, enable) {
    const cr = S().closeRate;
    const shown = !isNum(cr) ? null : cr < 0.1 ? 0.5 : Math.round(cr * 10);
    return renderTens({ ...q, unit: 'in 10', pre: '<1', preValue: 0.5 }, body, enable, {
      value: shown,
      onCommit: (v, from) => commit(q, v === 0.5 ? 0.05 : clamp(v / 10, 0.1, 1), from),
    });
  },

  /** E30, Task 18: three facts about last month. Nobody is asked what they could take on, or what their capacity
      should be in three months: Mercer states the ceiling those facts give and it can be corrected */
  capacity(q, body, enable) {
    const st = S();
    const unit = unitWord(2);
    let ceiling = null;
    const say = el('p', 'q-estimate');
    say.setAttribute('role', 'status');
    const settle = () => {
      const e = capacityEstimate();
      ceiling = e;
      say.textContent = e ? (isNum(e.value) ? `${e.words} Mercer takes ${count(e.value)} ${unitWord(e.value)} a month as the ceiling until you say otherwise.` : e.words) : '';
      correct.hidden = !e || !isNum(e.value);
      if (e && isNum(e.value) && !ownAnswer('capacity')) { st.capacity = e.value; derivedMap().capacity = e.basis; st.capacityBasis = e.basis; }
      if (isNum(st.capacity) || isNum(st.servedNow)) { commit(q, isNum(st.capacity) ? st.capacity : null, who.el); enable(); } else hold();
    };
    const who = stonesRow(body, q, { id: `${q.id}.who`, key: 'who', options: WHO, value: st.who ?? null, caption: 'Who does the work', commitId: 'who', onDone: () => settle() });
    const done = sliderRow(body, q, { id: q.id, key: 'servedNow', unit, scale: [1, 200], snap: 1, zero: true, caption: `${cap(unit)} completed last month`, commitId: 'servedNow', onDone: () => settle() });
    const hours = sliderRow(body, q, { id: `${q.id}.jobHours`, key: 'jobHours', unit: 'hours', scale: [1, 40], snap: 1, caption: `Hours one ${unitWord(1)} takes`, commitId: 'jobHours', onDone: () => settle() });
    body.appendChild(say);
    const correct = el('button', 'stone', 'Change the ceiling');
    correct.type = 'button';
    correct.hidden = true;
    const correctHost = el('div', 'q-other');
    correctHost.hidden = true;
    let own = null;
    correct.addEventListener('click', () => {
      tapEl(correct);
      correctHost.hidden = false;
      if (!own) own = sliderRow(correctHost, q, { id: `${q.id}.own`, key: 'capacity', unit, scale: [1, 300], snap: 1, caption: `The most you could deliver in a month`, commitId: 'capacity', onDone: (v) => { delete derivedMap().capacity; st.capacityBasis = 'stated'; if (isNum(v)) enable(); } });
      own.focus?.();
    });
    body.append(correct, correctHost);
    settle();
    if (answeredQ(q)) enable();
    return { el: who.el, focus: () => who.focus(), destroy: () => { who.destroy(); done.destroy(); hours.destroy(); own?.destroy?.(); } };
  },

  margin(q, body, enable) {
    const st = S();
    const price = isNum(st.price) && st.price > 0 ? st.price : null;
    const settle = (m, from) => { commit(q, Number(clamp(m, 0.01, 0.98).toFixed(3)), from); enable(); };
    if (price) {
      const c = M.ui.keptRing(body, {
        id: q.id, hue: hueOf(q), value: isNum(st.margin) ? st.margin : null, price, costWords: ['costs', 'of'], label: headline(q).title, size: window.innerWidth <= 720 ? 140 : 160,
        onCommit(v) { if (!isNum(v)) return; settle(v, c.el); },
      });
      if (answeredQ(q)) enable();
      return c;
    }
    return renderRing(q, body, enable, { value: isNum(st.margin) ? Math.round(st.margin * 100) : null, unit: 'p', step: 1, onCommit: (v, from) => settle(v / 100, from) });
  },

  /** the ledger: one row per kind of software, the name where the cursor lands, the fee optional */
  software(q, body, enable) {
    const st = S();
    const c = M.ui.ledger(body, {
      id: q.id, hue: hueOf(q), rows: M.STACK ?? [], visible: window.innerWidth <= 720 ? 4 : 6, feeWords: '/month', label: headline(q).title,
      value: { names: { ...(st.stackNames ?? {}) }, fees: Object.fromEntries(Object.entries(st.stack ?? {}).filter(([, v]) => isNum(v))) },
      onCommit(v) {
        const names = {};
        Object.entries(v.names ?? {}).forEach(([id, n]) => { if (given(n)) names[id] = String(n).slice(0, 60); });
        st.stackNames = names;
        const stack = {};
        Object.keys(names).forEach((id) => { stack[id] = isNum(v.fees?.[id]) ? Math.round(v.fees[id]) : null; });
        st.stack = stack;
        st.stackAsked = true;
        commit(q, { names, fees: stack }, c.el);
        enable();
      },
    });
    st.stackAsked = true;
    enable();
    return c;
  },

  strengths(q, body, enable) {
    const st = S();
    const c = M.ui.sort(body, {
      id: q.id, hue: hueOf(q), tiles: SKILLS, zones: ['good at', 'avoid'], value: { strengths: [...(st.strengths ?? [])], avoids: [...(st.avoids ?? [])] }, label: headline(q).title,
      onCommit(v) {
        st.avoids = [...(v.avoids ?? [])];
        const s = [...(v.strengths ?? [])];
        if (!s.length && !st.avoids.length) { st.strengths = []; hold(); return; }
        commit(q, s, c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** the table: you at the centre, the seats around you */
  help(q, body, enable) {
    const st = S();
    const h = st.help;
    // state holds the word only; the seats as pressed are kept here so Back shows the count the visitor gave
    const kept = helpSeats && helpSeats.help === h ? helpSeats : null;
    const value = !h ? null : kept ? { seats: [...kept.seats], agency: kept.agency, help: h }
      : { seats: [h === 'partner' || h === 'team', h === 'team', false, false], agency: h === 'agency', help: h };
    const c = M.ui.tableRing(body, {
      id: q.id, hue: hueOf(q), value, solo: solo(), label: headline(q).title, seatWords: { you: 'You', seat: 'Seat', agency: 'Agency' }, caption: helpCaption,
      onCommit(v) {
        if (!v || !v.help) return;
        helpSeats = Array.isArray(v.seats) && v.seats.length === 4 ? { seats: v.seats.map(Boolean), agency: Boolean(v.agency), help: v.help } : null;
        commit(q, v.help, c.el);
        enable();
      },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  personality(q, body, enable) {
    const st = S();
    const axes = Array.isArray(st.personalityAxes) && st.personalityAxes.length === 4 ? [...st.personalityAxes] : [null, null, null, null];
    const c = M.ui.twoSided(body, {
      id: q.id, hue: hueOf(q), value: { axes: st.personality ? st.personality.split('') : axes, code: st.personality ?? null }, knowWords: 'I know my type', label: headline(q).title,
      onInput: (v) => { st.personalityAxes = [...(v?.axes ?? [null, null, null, null])]; },
      onCommit(v) { if (!v?.code) return; st.personalityAxes = [...v.axes]; commit(q, v.code, c.el); enable(); },
    });
    if (answeredQ(q)) enable();
    return c;
  },

  /** the CV socket: pasting it is the power-up; Later moves on */
  cv(q, body, enable) {
    const st = S();
    const c = M.ui.socket(body, {
      id: q.id, hue: hueOf(q), value: st.cv ?? '', words: 'CV', sub: 'Paste here', laterWords: 'Later', clearWords: 'Clear', label: headline(q).title,
      onPaste(t) { const text = String(t).slice(0, 20000); M.cvFacts = M.readCV ? M.readCV(text) : null; commit(q, text, c.el); enable(); },
      onClear() { st.cv = ''; M.cvFacts = null; M.flow?.backward?.('cv'); M.paintTree?.(); },
      onLater() { M.next?.(); },
    });
    enable();
    return c;
  },
};

/** A value Mercer found and the visitor has neither confirmed nor excluded: the question it belongs to shows it over the
    instrument, with the line it came from. Use it makes it the answer (and the question is drawn again with it in place);
    Not right excludes it for good. A find is never an answer until one of those is pressed. */
function foundOffer(q, body, enable) {
  const R = M.research;
  const item = typeof R?.foundFor === 'function' ? R.foundFor(q.id) : null;
  if (!item || answeredQ(q)) return;
  const row = el('div', 'found-offer');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Found earlier');
  const quote = String(item.quote ?? '').trim();
  const from = String(item.source ?? '').replace(/^https?:\/\//, '').slice(0, 60);
  const shown = R.shown?.(item) ?? String(item.value);
  row.appendChild(el('p', 'small', `Mercer found <b>${esc(shown)}</b>${from ? ` in ${esc(from)}` : ''}${quote ? `: “${esc(quote.slice(0, 120))}${quote.length > 120 ? '…' : ''}”` : '.'}${item.note ? ` (${esc(item.note)})` : ''}${item.edited ? ' The figure is your edit.' : ''}`));
  const acts = el('div', 'found-acts');
  const use = el('button', 'stone small', q.id === 'sector' ? 'Search this' : q.id === 'buyer' ? 'Keep as a note' : 'Use it');
  const drop = el('button', 'stone small', 'Not right');
  [use, drop].forEach((b) => { b.type = 'button'; b.dataset.noCommit = '1'; });
  use.addEventListener('click', () => {
    if (q.id === 'sector') { const f = $('.sector-pick input.field', body); if (f) { f.value = String(item.value); f.dispatchEvent(new Event('input', { bubbles: true })); f.focus(); } row.remove(); return; }
    R.confirm?.(item.id);
    if (q.id === 'buyer') { row.remove(); return; }
    // through app.js, so the leaf flies and the sentence is written; then the instrument is drawn again holding the value
    if (given(S()[q.key]) && typeof M.commit === 'function') M.commit(q.id, S()[q.key], { fromEl: use });
    if (typeof M.showQuestion === 'function') M.showQuestion(q.id); else renderQuestion(q, body, enable);
  });
  drop.addEventListener('click', () => { R.exclude?.(item.id); row.remove(); });
  acts.append(use, drop);
  row.appendChild(acts);
  body.insertBefore(row, body.firstChild);
}
/** every question, custom and generic: builds the instrument in `body`, returns { focus, destroy } */
function renderQuestion(idOrQ, body, enable = () => {}) {
  const q = typeof idOrQ === 'string' ? BY_ID[idOrQ] : (idOrQ && BY_ID[idOrQ.id]) || idOrQ;
  const none = { focus() {}, destroy() {}, el: null };
  if (!q || !body) return none;
  body.innerHTML = '';
  body.classList.add('q12');
  body.dataset.q = q.id;
  if (!M.ui) return none;
  let ctl;
  if (q.kind && KIND[q.kind]) ctl = KIND[q.kind](q, body, enable);
  else if (q.type === 'presets' || q.type === 'multi') ctl = renderStones(q, body, enable);
  else if (q.type === 'tens') ctl = renderTens(q, body, enable);
  else if (q.type === 'number' || q.type === 'money') ctl = renderSlider(q, body, enable);
  else if (q.type === 'pair') ctl = renderPair(q, body, enable, {
    value: Array.isArray(S()[q.key]) ? [...S()[q.key]] : [null, null], labels: q.labels, order: q.order, money: q.money, needBoth: true,
    scale: S().now ? [Math.round(S().now * 0.5), Math.round(S().now * 1.5)] : [2000, 50000],
    onCommit(a, b, from) { if (b === null) { S()[q.key] = [a, null]; hold(); return; } commit(q, [a, b], from); enable(); },
  });
  else if (q.type === 'arc') ctl = renderArc(q, body, enable);
  else if (q.type === 'ring') ctl = renderRing(q, body, enable);
  else if (q.type === 'year') ctl = renderYear(q, body, enable);
  else if (q.type === 'costs') ctl = renderCosts(q, body, enable);
  else if (q.type === 'split') ctl = renderSplit(q, body, enable);
  else ctl = renderLine(q, body, enable);
  try { foundOffer(q, body, enable); } catch (e) { /* the list is optional */ }
  if (q.id === 'bestWorst' && ctl?.el) markOn(ctl, S().now, S().now ? [Math.round(S().now * 0.5), Math.round(S().now * 1.5)] : [2000, 50000], 'now');
  return { el: ctl?.el ?? null, focus: () => ctl?.focus?.(), destroy: () => ctl?.destroy?.() };
}

/* ------------------------------------------------------------------ the leaf sentence (COPY §6) */
/** one sentence the visitor could not see before, '' when a field it names is missing */
const clip = (t, n) => { const x = String(t ?? '').trim(); if (x.length <= n) return x; const cut = x.slice(0, n); const sp = cut.lastIndexOf(' '); return (sp > n * 0.5 ? cut.slice(0, sp) : cut).replace(/[,.;:]$/, ''); };
const segmentText = (st, v) => {
  if (st.segmentWords) return String(st.segmentWords);
  try { const hit = (M.customerProfiles?.() ?? []).find((p) => p.id === v); if (hit) return String(hit.text || hit.title || ''); } catch (e) { /* below */ }
  return '';
};
function word(q) {
  const st = S();
  if (!answeredQ(q) || st.notSure?.has?.(q.id)) return '';
  const v = st[q.key];
  const price = isNum(st.price) && st.price > 0 ? st.price : null;
  const margin = isNum(st.margin) ? st.margin : null;
  const now = isNum(st.now) && st.now > 0 ? st.now : null;
  const p = margin !== null ? Math.round(margin * 100) : null;
  const binding = M.measured?.binding ?? null;
  const runChannels = () => (Array.isArray(M.result?.channels) && M.result.channels.length ? listWords(M.result.channels.map(chanName)) : '');
  const warmCount = () => (Array.isArray(st.lastFive) ? st.lastFive.filter((x) => x?.bin === 'warm11' || x?.bin === 'warm1m').length : null);
  switch (q.id) {
    case 'bestWorst': {
      const [best, worst] = v;
      if (best < worst) return { text: 'Your best month is below your worst.', warn: true };
      if (!now) return '';
      if (now < worst) return { text: `Your ${gbp(now)} now sits below your worst month.`, warn: true };
      if (now > best) return `Your ${gbp(now)} now is above your best month.`;
      if (worst === 0) return best > 0 ? `Your best month is ${gbp(best)}; today’s ${gbp(now)} is ${pct(now / best)} of it.` : '';
      if (best > worst) return `Your best month is ${one(best / worst)}× your worst; today sits ${pct((now - worst) / (best - worst))} of the way from worst to best.`;
      return '';
    }
    case 'yearsTrading': return v >= 1 && now >= 1000 ? `${gbp(now / v)} of monthly revenue added per year, on average.` : '';
    case 'import': case 'site': { const k = confirmedFinds().length; return k ? `${k === 1 ? '1 find' : `${count(k)} finds`} confirmed. Each one opens its question already filled, for you to keep or change.` : ''; }

    /* ---- the founder questions (R17): two of the visitor's own answers set side by side, never a reading of the person ---- */
    case 'energy': {
      const good = st.strengths ?? [], gives = v.gives ?? [], drains = v.drains ?? [];
      const worn = good.filter((id) => drains.includes(id)).map((id) => lower(labelIn(ENERGY, id)));
      if (worn.length) return `You are good at ${listWords(worn)} and ${worn.length === 1 ? 'it drains' : 'they drain'} you: work to write down and hand over.`;
      const kept = good.filter((id) => gives.includes(id)).map((id) => lower(labelIn(ENERGY, id)));
      return kept.length ? `${cap(listWords(kept))}: good at ${kept.length === 1 ? 'it' : 'them'}, and ${kept.length === 1 ? 'it gives' : 'they give'} you energy. Work to keep.` : '';
    }
    case 'avoided': {
      if (v.includes('followup') && ownAnswer('followUps') && isNum(st.followUps) && st.followUps <= 2) return `You put off following up, and you chase an enquiry ${st.followUps === 0 ? 'no times' : plural(st.followUps, 'time', 'times')} before you stop.`;
      if (v.includes('pricing') && (st.priceRaised === 'long' || st.priceRaised === 'never')) return `You put off raising prices, and your last rise was ${st.priceRaised === 'never' ? 'never' : 'over three years ago'}.`;
      if (v.includes('invoicing') && ownAnswer('owed') && isNum(st.owed) && st.owed > 0) return `You put off invoicing and chasing payment, and ${gbp(st.owed)} is unpaid today.`;
      return '';
    }
    case 'delegation': {
      if ((v === 'none' || v === 'checks') && (st.holiday === 'stops' || st.holiday === 'slows')) return `${v === 'none' ? 'You do it all yourself' : 'You check all the work you hand over'}, and the business ${st.holiday} when you take two weeks off.`;
      return '';
    }
    case 'futureRole': {
      const d = st.delegation;
      if ((v === 'lead' || v === 'back' || v === 'exit') && (d === 'none' || d === 'checks')) return `You want to ${{ lead: 'lead only', back: 'step back', exit: 'leave' }[v]}, and today ${d === 'none' ? 'you do it all yourself' : 'you check all the work you hand over'}: the results list what has to move first.`;
      return '';
    }

    /* ---- the control questions (R18): arithmetic on the visitor's own answers; no legal position is stated ---- */
    case 'ownShare': return v > 0 && v < 100 ? `You hold ${v}%; the other owners hold ${100 - v}% between them.` : '';
    case 'profitShare': return v === 'unset' ? { text: 'Profit share is not agreed: one to settle in writing.', warn: true } : '';
    case 'decisionRights': {
      const placed = Object.values(v).filter(Boolean), mine = placed.filter((x) => x === 'you').length;
      if (placed.length < 2) return '';
      return mine === placed.length ? `All ${placed.length} of the decisions you placed are yours alone.` : `${mine} of the ${placed.length} decisions you placed ${mine === 1 ? 'is' : 'are'} yours alone.`;
    }
    case 'influence': {
      const placed = Object.values(st.decisionRights ?? {}).filter(Boolean);
      const who = { partner: 'A partner runs', family: 'A family member runs', manager: 'A manager runs', team: 'The team runs' }[v];
      return who && placed.length >= 3 && placed.every((x) => x === 'you') ? `${who} the day to day, and every decision you placed is yours.` : '';
    }
    case 'keyPeople': return ownAnswer('teamSize') && isNum(st.teamSize) && st.teamSize >= 2 && v >= 1 && v <= st.teamSize ? `${count(v)} of your ${count(st.teamSize)} people ${count(v) === '1' ? 'is one' : 'are ones'} the business could not lose.` : '';
    case 'retain': {
      const rights = st.decisionRights ?? {};
      const keeps = v.filter((id) => id !== 'none');
      const moves = DECISIONS.map(([id]) => id).filter((id) => rights[id] === 'you' && !keeps.includes(id)).map((id) => lower(labelIn(DECISIONS, id)));
      return moves.length ? `${cap(listWords(moves))} ${moves.length === 1 ? 'is' : 'are'} yours today and not on the list you keep: ${moves.length === 1 ? 'it moves' : 'they move'} on from you.` : '';
    }
    case 'exitIntent': {
      if ((v === 'sale' || v === 'succession') && (st.holiday === 'stops' || st.holiday === 'slows')) return `You mean to ${v === 'sale' ? 'sell' : 'hand the business on'}, and it ${st.holiday} when you take two weeks off.`;
      if (v === 'succession' && given(st.plannedChanges) && !st.plannedChanges.includes('successor')) return 'You mean to hand the business on, and no successor is among your planned changes.';
      return '';
    }
    case 'goal': return now && isNum(st.goal) && st.goal > now && isNum(st.months) && st.months > 0 ? `${gbp(now)} to ${gbp(st.goal)} in ${plural(st.months, 'month', 'months')} is ${pct(Math.pow(st.goal / now, 1 / st.months) - 1)} a month, compounded.` : '';
    case 'appetite': return appetiteLine(v);
    case 'repeatWork':
      if (v === 'once' && derivedMap().repeat === 'repeatWork') return 'Mercer counts each customer as one sale.';
      if (v === 'retainer') return 'A client is worth fee × months stayed; Mercer prices a sale that way.';
      return '';
    case 'price': {
      if (!now) return '';
      const t = typ('deal');
      // under one sale a month the count would print as "0 sales": say how many months of revenue one sale is instead
      const thin = now / v < 1;
      const months = pluralOne(v / now, 'month', 'months');
      if (t && t > 0) {
        const gap = Math.round(Math.abs(v / t - 1) * 100);
        const sits = gap === 0 ? `${gbp(v)} matches the ${gbp(t)} typical for ${sectorWord()}` : `${gbp(v)} sits ${gap}% ${v >= t ? 'above' : 'below'} the ${gbp(t)} typical for ${sectorWord()}`;
        return thin ? `${sits}. One ${gbp(v)} sale is ${months} of today’s revenue.` : `${sits}: about ${plural(now / v, 'sale', 'sales')} a month at today’s revenue.`;
      }
      return thin ? `One ${gbp(v)} sale is ${months} of today’s revenue.` : `${gbp(now)} a month is about ${plural(now / v, 'sale', 'sales')} a month.`;
    }
    case 'retainer': {
      const stay = stayMonths(), mn = st.retainerMin, mx = st.retainerMax;
      if (stay && isNum(mn) && isNum(mx) && mn > 0) {
        const worth = `One client at ${gbp(v)} for ${plural(stay, 'month', 'months')} is ${gbp(v * stay)}`;
        return mx / mn >= 1.25 ? `${worth}; ${gbp(mn)} to ${gbp(mx)} is a ${one(mx / mn)}× spread, so months will swing.` : `${worth}.`;
      }
      if (!now || !(v > 0)) return '';
      // a fee above the month's revenue: a count of clients would print as 0, so the fee is set against the revenue instead
      if (now / v < 1) { const x = one(v / now); return x === '1' ? `One client at ${gbp(v)} a month is about all of today’s revenue.` : `One client at ${gbp(v)} a month is ${x} times today’s revenue.`; }
      return `${gbp(now)} a month is about ${plural(now / v, 'client', 'clients')} at ${gbp(v)}.`;
    }
    case 'priceSpread': return (v === 'wide' || v === 'huge') && price ? `Expect months to swing wider than Mercer’s range: it prices every sale at ${gbp(price)}.` : '';
    case 'upsell':
      if (v === 'yes' && isNum(st.repeat) && st.repeat > 0) return `${Math.round(st.repeat * 10)} in 10 already come back; an upsell reaches them without a new enquiry.`;
      if (v === 'could') return 'An upsell would sit on top of the forecast; Mercer counts one sale per customer.';
      return '';
    case 'priceRaised': {
      if (v !== 'long' && v !== 'never') return '';
      const r = macroRow('cpi_annual');
      return r && r.value !== undefined && r.period && r.asOf ? `CPI rose ${r.value}% in the year to ${r.period} (ONS, ${ukDate(r.asOf)}); a price held flat through that year fell that far behind.` : '';
    }
    case 'buyer': return v === 'public' || (st.buyers ?? []).includes('public') ? 'Mercer does not model tenders or frameworks.' : '';
    case 'radius': return v === 'global' ? 'Other countries too: Mercer drops the map and counts the people you can reach instead.' : '';
    case 'market': {
      // v is the reach this month; the engine's pool is twelve months of it, a calculated figure
      if (!isNum(v)) return '';
      if (v < 5) return { text: 'Under 5 people a month: outreach cannot carry the plan on its own.', warn: true };
      const t = typ('close');
      return t ? `${count(v)} people a month at ${Math.max(1, Math.round(t * 10))} in 10 is about ${plural(v * t, 'sale', 'sales')} a month if each one heard from you once. They do not need to have agreed to buy.` : `${count(v)} people a month is ${count(v * 12)} over a year, the pool Mercer counts. They do not need to have agreed to buy.`;
    }
    /* ---- rebuild 1: arithmetic on the new answers, silent otherwise ---- */
    case 'volume': {
      const m = PERIOD_MONTHS[st.volumePeriod];
      const monthly = m ? v / m : null;
      if (monthly === null || !now || !price || now / price < 0.5) return '';
      const implied = now / price;
      const ratio = monthly / implied;
      if (ratio > 1.6 || ratio < 0.6) return { text: `${count(monthly)} ${unitWord(monthly)} a month here; revenue divided by sale value says about ${count(implied)}. Both are kept as you gave them.`, warn: true };
      return `About ${count(monthly)} ${unitWord(monthly)} a month, in line with revenue and sale value.`;
    }
    case 'returned': return v && typeof v === 'object' && isNum(v.group) && v.group > 0 ? `${count(v.returned)} of ${count(v.group)} came back: ${Math.round((v.returned / v.group) * 10)} in 10, the rate Mercer uses.` : '';
    case 'repeat': return v === 'oneoff' ? 'Mercer counts each customer as one sale.' : v === 'unknown' ? 'Not enough history: Mercer uses the industry figure for customers who buy again.' : '';
    case 'deliveryMode': return Array.isArray(v) && v.length && !onSite() ? 'Remote or shipped: no radius is asked and the map is skipped.' : '';
    case 'canDeliverMore': return v === 'no' && isNum(st.enquiries) && st.enquiries > 0 ? 'More demand could not be delivered: the plan looks at capacity before enquiries.' : '';
    case 'spend': {
      const b = st.budget;
      if (!isNum(b) || !now) return '';
      return b === 0 ? 'No growth spend: the plan uses time and existing relationships.' : `${gbp(b)} a month is ${pct(b / now)} of revenue${isNum(st.changeHours) ? `, with ${plural(st.changeHours, 'hour', 'hours')} a week for change` : ''}.`;
    }
    case 'lastFive': { const bc = bestClients(); return bc.count ? bc.positioning[0] ?? '' : ''; }
    case 'network': { const k = networkKinds().length; return k && st.askedHelp === 'notyet' ? `${k === 1 ? 'One kind of person' : `${k} kinds of people`} could help and none has been asked yet: the first action starts there.` : ''; }
    case 'asked': return v === 'unavailable' ? 'The people you asked are not available: the plan does not lean on them.' : '';
    case 'decisionRights': return v === 'someone' && given(st.decidesWho) ? `${cap(String(st.decidesWho))} makes the decisions this plan needs: the first step is a conversation.` : '';
    case 'n03': return isNum(v) && isNum(st.n05) ? `${plural(v, 'hour', 'hours')} a week and ${gbp(st.n05)} to test with: the directions that fit are the ones a test that size can prove.` : '';
    case 'n21': return v === 'find' ? 'No direct route to buyers yet: the first test starts with finding three of them.' : '';
    case 'n27': return st.direction?.unknown ? `What the first test settles: ${lower(st.direction.unknown)}.` : '';
    case 'n33': return Array.isArray(v) && v.length === 1 && v[0] === 'assumption' ? 'Only an assumption so far: the plan is a validation test, not a launch.' : '';
    case 'listSize': {
      const mk = st.market;
      if (!isNum(mk) || mk <= 0) return '';
      return v > mk ? { text: 'More contacts than prospects: the two lists overlap.', warn: true } : `${pct(v / mk)} of your prospects already know you.`;
    }
    case 'season': return v !== 'steady' ? 'Mercer forecasts average months with no peaks; the results mark where yours fall.' : '';
    case 'channel': {
      const k = doingList().length;
      if (!k) return '';
      const names = runChannels();
      // "the rest" is a route the visitor runs that Mercer's forecast does not cover; with none, the clause is not printed
      const run = Array.isArray(M.result?.channels) ? M.result.channels : [];
      const rest = M.DIST_BY ? doingList().filter((id) => !run.includes(M.DIST_BY[id]?.engine)).length : Math.max(0, k - run.length);
      const base = names ? `You run ${plural(k, 'route', 'routes')}; Mercer forecasts ${names}${rest > 0 ? ' and brings the rest to the call' : ''}.` : '';
      const law = doingList().includes('cold-call') ? COLD_CALL_LAW : '';
      return [base, law].filter(Boolean).join(' ');
    }
    case 'spendSplit': {
      const t = Object.values(v ?? {}).reduce((a, b) => a + (isNum(b) ? b : 0), 0);
      if (!isNum(st.spendNow)) return '';
      const tail = t > 100 ? ` ${t - 100}% over.` : t < 100 ? ` ${100 - t}% left.` : '';
      return { text: `${t}% of ${gbp(st.spendNow)} placed.${tail}`, warn: t > 100 };
    }
    case 'marketingOwner': {
      const k = doingList().length;
      if (v !== 'nobody' || !k) return '';
      return count(k) === '1' ? 'No one runs marketing and 1 route is live: it runs itself.' : `No one runs marketing and ${count(k)} routes are live: they run themselves.`;
    }
    case 'agencyFee': {
      const sn = st.spendNow;
      if (!isNum(sn) || sn <= 0) return '';
      return v > sn ? { text: `More than the ${gbp(sn)} you said you spend on growth each month.`, warn: true } : `${pct(v / sn)} of the ${gbp(sn)} you spend on growth.`;
    }
    case 'contentTime': {
      const r = routeNames();
      return r.length ? `${plural(v, 'hour', 'hours')} a week on ${listWords(r)}; in Mercer’s model content ramps over three months, a quarter, three quarters, then full.` : '';
    }
    case 'tracking': return v === 'guess' || v === 'no' ? 'Without enquiry-source records, your last five will be memory; the results say so.' : '';
    case 'enquiries': {
      const close = isNum(st.closeRate) ? st.closeRate : typ('close');
      if (close && now && price && count(v * close) !== '0') {
        const won = v * close, implied = now / price;
        const rate = close < 0.1 ? 'under 1 in 10' : `${Math.round(close * 10)} in 10`;
        // the second figure is dropped when it would print as 0 (revenue below one sale a month)
        const says = count(implied) === '0' ? '' : `; revenue ÷ price says ${count(implied)}`;
        const text = `About ${plural(won, 'new customer', 'new customers')} a month at ${rate}${says}.`;
        return { text, warn: Boolean(says) && (implied > won * 1.6 || implied < won * 0.4) };
      }
      return isNum(st.quotes) && st.quotes <= v && v > 0 ? `${pct(st.quotes / v)} of enquiries get a price.` : '';
    }
    case 'closeRate': { const t = typ('close'); return t ? `${cap(sectorWord())} typically closes ${Math.max(1, Math.round(t * 10))} in 10; Mercer weighs yours against that.` : ''; }
    case 'cycle': {
      if (!(v >= 30) || !isNum(st.months)) return '';
      const cm = Math.round(v / 30);
      const left = st.months - cm;
      // the sale lands after the month Mercer reads: said so, never "0 of the 6 months"
      if (left <= 0) return `A customer who first contacts you today buys after month ${st.months}, the month Mercer reads.`;
      const w = cycleWord(v).toLowerCase();
      return `A customer who first contacts you today buys in ${/^over\b/.test(w) ? w : `about ${w}`}, leaving ${left} of the ${st.months} months Mercer forecasts.`;
    }
    case 'followUps': return v <= 2 && isNum(st.cycle) && st.cycle >= 60 ? `A sale that takes ${cycleWord(st.cycle).toLowerCase()} with ${plural(v, 'chase', 'chases')}: most of the cycle passes unprompted.` : '';
    case 'reviews': return (v === 'none' || v === 'few') && (st.chooseThem ?? []).includes('trust') ? 'Under 10 reviews, and people who had not heard of you say the same thing.' : '';
    case 'capacity': {
      const served = isNum(st.servedNow) ? st.servedNow : now && price ? now / price : null;
      if (served === null || !(v > 0)) return '';
      if (served >= v) return { text: 'Full.', warn: true };
      return `About ${pct(served / v)} full: room for ${count(v - served)} more ${unitWord(v - served)} a month.`;
    }
    case 'teamSize': return now >= 1000 && v > 0 ? `${gbp(now / v)} of revenue a month per person.` : '';
    case 'leadTime': return v === 'month' && isNum(st.cycle) ? `First contact to first day: about ${count(st.cycle + 30)} days.` : '';
    case 'breaksFirst': return v === 'me' && binding === 'client_capacity' ? 'Mercer already sees capacity limiting growth first.' : '';
    case 'subcontract': return v === 'yes' && isNum(st.capacity) && st.capacity > 0 ? `Partners lift the ceiling Mercer draws at ${count(st.capacity)} ${unitWord(st.capacity)} a month.` : '';
    case 'holiday': return v === 'stops' && st.who === 1 ? 'It stops and only you do the work: capacity is you.' : '';
    case 'hiring': return v === 'cant' && binding === 'client_capacity' ? 'Capacity limits growth first and you cannot hire: the step left is a price rise.' : '';
    case 'margin': {
      const t = typ('margin');
      if (t && price) return `You keep ${gbp(price * v)} of each ${gbp(price)} sale, ${Math.round(v * 100)}p in the £1; ${sectorWord()} typically keeps ${Math.round(t * 100)}p.`;
      return now ? `You keep ${Math.round(v * 100)}p in the £1: ${gbp(now * v)} a month before outgoings.` : '';
    }
    case 'fixedCosts': return v > 0 && margin ? `Break-even is ${gbp(v / margin)} a month in sales at ${p}p kept per £1.` : '';
    case 'terms': return (v === 'thirty' || v === 'sixty') && price && margin !== null ? `Each sale costs ${gbp(price * (1 - margin))} to deliver, ${v === 'sixty' ? '60 days or more' : 'up to 30 days'} before the customer pays.` : '';
    case 'owed': {
      if (!now || !(v >= now / 30)) return '';
      const m = v / now;
      if (m < 0.95) { const d = Math.round(m * 30); return `${gbp(v)} is about ${d} ${d === 1 ? 'day' : 'days'} of revenue.`; }
      return `${gbp(v)} is ${one(m)} ${one(m) === '1' ? 'month' : 'months'} of revenue.`;
    }
    case 'discounting': return (v === 'often' || v === 'always') && p ? `A 10% discount on a ${p}p margin gives away ${pct(10 / p)} of what you keep.` : '';
    case 'runway': {
      if (v === 0) return 'Growth spend comes out of each month’s takings.';
      return v > 0 && isNum(st.budget) && st.budget > 0 ? `${plural(v, 'month', 'months')} at ${gbp(st.budget)} a month: ${gbp(v * st.budget)} of growth spend before sales must cover it.` : '';
    }
    case 'software': {
      const total = typeof M.stackSpend === 'function' ? M.stackSpend() : Object.values(st.stack ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
      if (!(total > 0) || !now || typeof M.freetools?.rowsFor !== 'function') return '';
      const k = Object.keys(st.stackNames ?? {}).filter((id) => { try { return (M.freetools.rowsFor(id) ?? []).length > 0; } catch (e) { return false; } }).length;
      const free = k >= 1 ? `; ${k} of these kinds ${k === 1 ? 'has' : 'have'} a free tier (the results list them)` : '';
      return `${gbp(total)} a month is ${gbp(total * 12)} a year, ${total / now < 0.01 ? 'under 1%' : pct(total / now)} of revenue${free}.`;
    }
    case 'topShare': return now && v > 0 && (now * v) / 300 >= 1 ? `Your top three are ${v}% of revenue: one of them is about ${gbp((now * v) / 300)} a month.` : '';
    case 'stay': return price && isNum(st.repeat) && st.repeat < 1 && v > 1 ? `One customer is worth about ${gbp(price * (1 / (1 - Math.min(0.95, st.repeat))))} over ${plural(v, 'month', 'months')}.` : '';
    case 'returnGap': { const perYear = { week: 52, month: 12, quarter: 4, year: 1 }[v]; return price && perYear ? `At ${gbp(price)} a sale, a returning customer spends about ${gbp(price * perYear)} a year.` : ''; }
    case 'ltv': {
      if (!price) return '';
      if (v < price) return { text: `Below your ${gbp(price)} sale price.`, warn: true };
      // a lifetime worth one sale is the sale price again: nothing to add
      return one(v / price) === '1' ? '' : `Worth ${one(v / price)} sales at your ${gbp(price)} price.`;
    }
    case 'hours': return doingList().length ? `${plural(v, 'hour', 'hours')} a week is ${count(v * 4.33)} a month across ${plural(doingList().length, 'live route', 'live routes')}.` : '';
    case 'strengths': { const k = warmCount(); return (st.avoids ?? []).includes('selling') && k !== null && k >= 3 ? `You avoid selling and ${k} of your five best came warm: the network sells for you.` : ''; }
    case 'risk': return v === 'none' && (st.appetite === 'aggressive' || st.appetite === 'maximum') ? `No risk and ${st.appetite === 'aggressive' ? 'an aggressive' : 'a maximum'} target pull against each other; the results show what each costs.` : '';
    case 'personality': { let a = null; try { a = M.archetypes?.pick?.(v) ?? null; } catch (e) { a = null; } return a?.name && a?.grows ? `${a.name}: grows by ${a.grows}.` : ''; }
    case 'cv': { const f = M.cvFacts; return f && f.years && f.since ? `${plural(f.years, 'year', 'years')} in work since ${f.since}${f.roles?.length ? `, ${f.roles.length} ${f.roles.length === 1 ? 'role' : 'roles'}` : ''}.` : ''; }
    case 'network': return v > 0 && isNum(st.enquiries) && st.enquiries > 0 ? `${plural(v, 'introducer', 'introducers')} at one introduction a year is ${one(v / 12)} a month against ${plural(st.enquiries, 'enquiry', 'enquiries')}.` : '';
    case 'funding': {
      if (v.includes('loan')) { const r = macroRow('boe_bank_rate'); if (r && r.value !== undefined && r.asOf) return `Bank Rate is ${r.value}% (Bank of England, ${ukDate(r.asOf)}).`; }
      if (v.includes('none') && st.runway === 0 && isNum(st.budget) && st.budget > 0 && now && margin) return `Growth spend comes out of takings: ${pct(st.budget / (now * margin))} of gross profit.`;
      return '';
    }
    case 'wontDo': return v.includes('cold') ? 'Cold outreach is off limits: Mercer brings that to the call.' : '';

    /* ---- leaves that speak only where two answers the visitor gave make arithmetic (C10.2). Each is silent unless both are held. ---- */
    case 'responseTime': {
      // the wait for a first reply against the days Mercer counts from first contact to first sale (the cycle stop they chose)
      const c = ownAnswer('cycle') && isNum(st.cycle) && st.cycle > 0 ? st.cycle : null;
      const wait = { day: [1, 'comes the same day'], days: [2, 'takes one to two days'], slow: [2, 'takes over two days'] }[v];
      if (!c || !wait) return '';
      const [days, takes] = wait;
      if (c <= days) return `A customer decides ${c <= 1 ? 'the same day' : `in ${plural(c, 'day', 'days')}`} and your first reply ${takes}: the choice can be made before you answer.`;
      if (days / c < 0.1) return '';
      return `A first reply that ${takes} uses ${v === 'slow' ? 'over' : 'up to'} ${pct(days / c)} of the ${count(c)} days Mercer counts from first contact to first sale.`;
    }
    case 'website': {
      const n = ownAnswer('enquiries') && isNum(st.enquiries) ? st.enquiries : null;
      if (!n || count(n) === '0' || (v !== 'brochure' && v !== 'none')) return '';
      const reach = count(n) === '1' ? 'your 1 enquiry a month reaches' : `all ${count(n)} enquiries a month reach`;
      return v === 'none' ? `With no website, ${reach} you some other way.` : `Nobody can enquire or book on your site, so ${reach} you some other way.`;
    }
    case 'chooseYou': case 'chooseThem': {
      // the same reason on both lists: it wins some work and loses other work
      const you = st.chooseYou ?? [], them = st.chooseThem ?? [];
      const SAME = { price: 'price wins you some customers and loses you others', speed: 'speed wins you customers and a slow reply loses them', location: 'being close wins you customers and distance loses them' };
      const both = Object.keys(SAME).filter((id) => you.includes(id) && them.includes(id));
      return both.length ? `On both lists: ${both.map((id) => SAME[id]).join('; ')}.` : '';
    }
    case 'jobLength': {
      // the most work a month against how long one piece runs: what is under way at once when the business is full
      const most = ownAnswer('capacity') && isNum(st.capacity) && st.capacity > 0 ? st.capacity : null;
      if (!most) return '';
      if (v === 'minutes') return `${count(most)} ${unitWord(most)} a month at under an hour each is under ${plural(most, 'hour', 'hours')} of delivery a month.`;
      const open = v === 'months' ? most : v === 'weeks' ? Math.floor((most * 7) / 30.4) : 0;
      if (open < 2) return '';
      return `At full capacity, ${count(most)} ${unitWord(most)} a month that each run ${v === 'months' ? 'a month' : 'a week'} or more means ${count(open)} or more under way at once.`;
    }
    case 'retainerRenew': return v > 0 && v < 10 ? `${v} in 10 renew: a client stays about ${pluralOne(1 / (1 - v / 10), 'term', 'terms')}.` : '';
    case 'retainerMonths': return isNum(st.retainerValue) && st.retainerValue > 0 && v > 0 ? `${gbp(st.retainerValue)} a month for ${plural(v, 'month', 'months')} is ${gbp(st.retainerValue * v)} a client.` : '';
    case 'newVsRepeat': {
      const r = ownAnswer('repeat') && isNum(st.repeat) ? st.repeat : null;
      if (r !== null && v === 'none' && r >= 0.5) return { text: `${Math.round(r * 10)} in 10 come back, yet almost none of a month’s revenue comes from past customers: the two answers disagree.`, warn: true };
      if (r !== null && v === 'most' && r <= 0.2) {
        if (r < 0.05) return { text: 'None come back, yet most of a month’s revenue comes from past customers: the two answers disagree.', warn: true };
        return `${Math.round(r * 10)} in 10 come back, yet most of a month’s revenue comes from past customers: a few returning customers carry the month.`;
      }
      const share = { quarter: 0.25, half: 0.5 }[v];
      return share && now >= 1000 ? `${v === 'quarter' ? 'A quarter' : 'Half'} of ${gbp(now)} is ${gbp(now * share)} a month from past customers.` : '';
    }
    case 'help': {
      // who works on growth against who does the work
      if (v !== 'alone' || !isNum(st.who)) return '';
      if (st.who === 1) return 'You do the work and the growth: both come out of the same week.';
      const people = { 2: 'You and one or two others do', 6: 'Three to ten people do', 12: 'Over ten people do' }[st.who];
      return people ? `${people} the work, and growth is yours alone.` : '';
    }
    /* silent on purpose (C10.3): now, place, sector, site, months, included, competitors, idealCustomer, went, agency, agencyWhy,
       qualitySlip, bestEver, win, dataOffer, deadline, successWords, note. No honest figure exists for them, and sector and now
       must wait for M.typ(): a sector figure is not printed before its own question has been passed. */
    default: return '';
  }
}

/* ------------------------------------------------------------------ the quiet runs (refine 1, R15) */
/* A leaf sentence needs two answers that make arithmetic, so some runs of questions say nothing. In each run of three or
   more, the ids below speak: a sourced line where macro.js holds one for the question (M.macro.contextFor(id), which ends
   with its source and date, or null), otherwise a method line. A method line states what Mercer does with the answer and
   holds no figure. Every one was checked against the code it describes. Ids outside this table stay silent. */
const BENCH = 'Mercer combines your answer with relevant industry benchmarks to improve the estimate.';
const BRIEFING = 'Recorded as you gave it. It appears in your exports and changes no figure in the forecast.';
const SELF = 'Self-reported, and printed as such on the results. Mercer draws no conclusion about you from it.';
const METHOD = {
  sector: BENCH,
  now: 'The forecast starts from this figure. Your best and worst months, sale value and target are each checked against it.',
  place: '',
  included: BRIEFING,
  priceRaised: '',
  season: 'Mercer forecasts average months, which is what an even year gives.',
  competitors: 'Recorded as you wrote it. Mercer does not look these names up.',
  agency: 'Recorded as you gave it. The forecast uses your growth spend, whoever spends it.',
  followUps: 'Chases are not an input to the forecast: Mercer uses your close rate, which already reflects them.',
  reviews: BRIEFING,
  qualitySlip: BRIEFING,
  holiday: 'Used in the founder section of the results, for what depends on you.',
  hiring: '',
  teamSize: '',
  terms: '',
  win: BRIEFING,
  decisionSpeed: SELF,
  avoided: 'Self-reported. The founder section of the results names who or what could take each task.',
  ownership: 'Self-reported. Mercer states no legal position: ownership and rights are for a solicitor or accountant to review.',
  plannedChanges: 'Set beside who decides today, in the Control section of the results.',
  dataOffer: 'Nothing is uploaded here. This tells the call which records exist.',
  successWords: BRIEFING,
};
function quiet(q) {
  if (!(q.id in METHOD) || !answeredQ(q) || S().notSure?.has?.(q.id)) return '';
  let sourced = null;
  try { const c = M.macro?.contextFor?.(q.id); sourced = typeof c === 'string' ? c : c && typeof c === 'object' ? c.text ?? null : null; } catch (e) { sourced = null; }
  return sourced || METHOD[q.id] || '';
}

/* ------------------------------------------------------------------ for the rest of the page */
/** an answer as words, for the flyer, the briefing and the export */
function answerText(q) {
  const st = S();
  if (!answeredQ(q)) return null;
  const v = st[q.key];
  const label = (x) => (optsOf(q).concat(q.opts ?? []).find((o) => o[0] === x)?.[1] ?? String(x));
  const multiWords = (table, arr) => (Array.isArray(arr) ? arr : []).map((x) => labelIn(table, x)).join(', ');
  switch (q.id) {
    case 'now': return gbp(v);
    case 'goal': return given(st.goal) ? `${gbp(st.goal)}${isNum(st.months) ? ` in ${plural(st.months, 'month', 'months')}` : ''}` : String(st.milestone ?? '');
    case 'appetite': return APPETITE.find((a) => a[0] === v)?.[1] ?? String(v);
    case 'sector': return [M.sectorWord?.(v) ?? v, st.trade].filter(Boolean).join(', ');
    case 'win': return v === 'other' ? String(st.winOther ?? '') : labelIn(isStarter() ? WIN_STARTER : WIN_OWNER, v);
    case 'place': return [String(v), st.currency && st.currency !== 'GBP' ? st.currency : ''].filter(Boolean).join(', ');
    case 'repeatWork': { const s = Array.isArray(st.sells) ? st.sells : []; return s.length ? `${multiWords(SELLS, s)}${s.length > 1 && st.sellsPrimary ? ` (most often ${lower(labelIn(SELLS, st.sellsPrimary))})` : ''}` : String(v); }
    case 'buyer': { const b = Array.isArray(st.buyers) ? st.buyers : []; return b.length ? `${multiWords(BUYERS, b)}${b.length > 1 && st.buyerPrimary ? ` (most often ${lower(labelIn(BUYERS, st.buyerPrimary))})` : ''}` : labelIn(BUYERS, v); }
    case 'volume': return `${count(v)} ${unitWord(v)} in ${lower(labelIn(PERIODS, st.volumePeriod))}`;
    case 'lastFive': { if (st.bestNone || !Array.isArray(v) || !v.length) return 'No customers yet'; return `${plural(v.length, 'best customer', 'best customers')}: ${v.map((c, i) => [c.buyer ? buyerWord(c.buyer) : '', c.bought, c.found ? `via ${lower(labelIn(FOUND_BY, c.found))}` : ''].filter(Boolean).join(', ') || `customer ${i + 1}`).join('; ')}`; }
    case 'segment': return v === 'none' ? String(st.segmentWords || 'None of the suggestions') : (segmentText(st, v) || 'The customers you want next');
    case 'trigger': return v === 'other' ? String(st.triggerOther ?? '') : labelIn(TRIGGERS, v);
    case 'market': return `${count(st.reach)} people reachable this month`;
    case 'enquiries': { const raw = isNum(st.enquiriesRaw) ? st.enquiriesRaw : v; const pw = st.enquiryPeriod === 'quarter' ? 'a quarter' : st.enquiryPeriod === 'year' ? 'a year' : 'a month'; return isNum(st.winsRaw) ? `${count(raw)} ${pw}, ${count(st.winsRaw)} became customers` : `${count(raw)} ${pw}`; }
    case 'repeat': return labelIn(REPEAT_BAND, v);
    case 'returned': return v && typeof v === 'object' ? `${count(v.returned)} of ${count(v.group)} came back` : '';
    case 'hours': return [given(st.weekGoes) ? multiWords(WEEK_GOES, st.weekGoes) : '', isNum(st.hours) ? `${plural(st.hours, 'hour', 'hours')} a week for the plan` : ''].filter(Boolean).join('; ');
    case 'holdup': return v === 'other' ? String(st.holdupOther ?? '') : labelIn(HOLDUP, v);
    case 'spend': return [isNum(st.budget) ? `${gbp(st.budget)} a month` : '', isNum(st.oneOff) ? `${gbp(st.oneOff)} one-off` : '', isNum(st.changeHours) ? `${plural(st.changeHours, 'hour', 'hours')} a week` : ''].filter(Boolean).join(', ');
    case 'network': return [multiWords(NETWORK_KINDS, v), isNum(st.network) ? `about ${count(st.network)} introducers` : ''].filter(Boolean).join('; ');
    case 'decisionRights': {
      if (v === 'someone' && given(st.decidesWho)) return `Someone else: ${st.decidesWho}`;
      const map = st.decisionRights && typeof st.decisionRights === 'object' ? DECISIONS.filter(([id]) => st.decisionRights[id]).map(([id, name]) => `${name}: ${lower(labelIn(HOLDERS, st.decisionRights[id]))}`) : [];
      if (!given(v)) return map.join(', ');
      return v === 'shared' && map.length ? `Shared with others (${map.join(', ')})` : labelIn(DECIDES, v);
    }
    case 'n01': return [v === 'other' ? String(st.n01Other ?? '') : labelIn(N01, v), given(st.n09) ? String(st.n09) : ''].filter(Boolean).join('; ');
    case 'n03': return [`${plural(v, 'hour', 'hours')} a week`, st.n03Pattern ? lower(labelIn(N03_PATTERN, st.n03Pattern)) : '', st.n18 ? lower(labelIn(N18, st.n18)) : ''].filter(Boolean).join(', ');
    case 'n05': return [`${gbp(v)} to test`, isNum(st.n06) ? `${gbp(st.n06)} a month` : ''].filter(Boolean).join(', ');
    case 'n10': return [multiWords(N10, (v ?? []).filter((x) => x !== 'other')), given(st.n10Other) ? String(st.n10Other) : ''].filter(Boolean).join(', ');
    case 'n13': return [given(v) ? `enjoys ${multiWords(N13, v)}` : '', given(st.n14) ? `avoids ${multiWords(N13, st.n14)}` : ''].filter(Boolean).join('; ');
    case 'n16': return [multiWords(N16, v), given(st.n16Names) ? String(st.n16Names) : ''].filter(Boolean).join(', ');
    case 'n19': return [multiWords(N19, (v ?? []).filter((x) => x !== 'other')), given(st.n19Other) ? String(st.n19Other) : ''].filter(Boolean).join(', ');
    case 'n21': return labelIn(N21, v);
    case 'n25': return v === 'yes' ? `Yes: ${st.n25Text ?? ''}`.trim() : 'Not yet';
    case 'startPoint': return [labelIn(START_POINT, v), v === 'one' && given(st.n25Text) ? String(st.n25Text) : ''].filter(Boolean).join(': ');
    case 's01': return [multiWords(N19, (v ?? []).filter((x) => x !== 'other')), given(st.s01Other) ? String(st.s01Other) : ''].filter(Boolean).join(', ');
    case 's06': return ideas().map((x) => x.text).join('; ');
    case 's07': case 's08': case 's09': return v === 'none' ? 'None of them' : ideaText(v);
    case 's11': return [multiWords(S11, (v ?? []).filter((x) => x !== 'other')), given(st.s11Other) ? String(st.s11Other) : ''].filter(Boolean).join(', ');
    case 's13': return [isNum(st.s13Saw) ? `${count(st.s13Saw)} saw it` : '', isNum(st.s13Replied) ? `${count(st.s13Replied)} replied` : '', isNum(st.s13Bought) ? `${count(st.s13Bought)} bought` : ''].filter(Boolean).join(', ');
    case 's14': return v === 0 ? 'Free' : gbp(v);
    case 'n27': return v === 'none' ? 'None of the directions' : String(st.direction?.name ?? v);
    case 'n31': return v === 'other' ? String(st.n31Other ?? '') : v === 'direction' ? String(st.direction?.buyer ?? '') : v === 'n19other' ? String(st.n19Other ?? '') : labelIn(N19, v);
    case 'n33': return multiWords(N33, v);
    case 'n35': return v === 'gap' && given(st.n35Gap) ? `With a gap: ${st.n35Gap}` : labelIn(N35, v);
    case 'n39': return v === 'other' ? String(st.n39Text ?? '') : labelIn(N39, v);
    case 'readiness': return labelIn(DETAIL, v);
    case 'months': return `${v} ${v === 1 ? 'month' : 'months'}`;
    case 'price': return gbp(v);
    case 'retainer': return isNum(st.retainerMin) && isNum(st.retainerMax) ? `${gbp(st.retainerMin)} to ${gbp(st.retainerMax)}, typical ${gbp(v)} a month` : `${gbp(v)} a month`;
    case 'channel': return listWords(doingList().map(distName)) || listWords(triedList().map(distName));
    case 'went': return triedList().map((id) => `${distName(id)}: ${(WENT.find((w) => w[0] === st.went?.[id]) ?? [null, ''])[1]}`).join(', ');
    case 'closeRate': return v < 0.1 ? 'Under 1 in 10' : `${Math.round(v * 10)} in 10`;
    case 'capacity': {
      // "Only me, 3 jobs a month now, 8 at most"; the unit follows the first count and is singular for one
      const who = (WHO.find((w) => w[0] === st.who) ?? [null, ''])[1];
      const served = isNum(st.servedNow) ? `${count(st.servedNow)} ${unitWord(st.servedNow)} a month now` : '';
      const most = served ? `${count(v)} at most` : `${count(v)} ${unitWord(v)} a month at most`;
      return [who, served, most].filter(Boolean).join(', ');
    }
    case 'margin': return `${Math.round(v * 100)}p in the £1`;
    case 'software': { const names = Object.entries(st.stackNames ?? {}); return names.length ? names.map(([id, n]) => `${M.STACK_BY?.[id]?.name ?? id}: ${n}${isNum(st.stack?.[id]) ? ` ${gbp(st.stack[id])} a month` : ''}`).join(', ') : 'None'; }
    case 'strengths': return [v.length ? `good at ${listWords(v.map((x) => label(x)))}` : '', (st.avoids ?? []).length ? `avoids ${listWords(st.avoids.map((x) => (SKILLS.find((s) => s[0] === x) ?? [null, x])[1]))}` : ''].filter(Boolean).join('; ');
    case 'help': return { alone: 'Only me', partner: 'A business partner', team: 'The team', agency: 'An agency or freelancer' }[v] ?? String(v);
    case 'personality': { const t = M.typeOf?.(v); return t ? `${t.code}, ${t.name}` : String(v); }
    case 'cv': return 'Pasted';
    case 'yearsTrading': { const y = YEAR() - v, m = isNum(st.estMonth) ? MONTH_NAME[st.estMonth - 1] : null; return `Established ${m ? `${m} ` : ''}${y}${m ? '' : ', month unknown'} (${v === 0 ? 'under a year' : `${count(v)} ${v === 1 ? 'year' : 'years'}`})`; }
    case 'import': case 'site': { const k = confirmedFinds().length; return [given(st.site) ? String(st.site) : '', k ? `${k === 1 ? '1 find' : `${count(k)} finds`} confirmed: ${confirmedFinds().map((f) => `${f.label} ${M.research?.shown?.(f) ?? f.value}`).join(', ')}` : ''].filter(Boolean).join('; '); }
    case 'energy': return [(v.gives ?? []).length ? `gives energy: ${listWords(v.gives.map((x) => lower(labelIn(ENERGY, x))))}` : '', (v.drains ?? []).length ? `drains: ${listWords(v.drains.map((x) => lower(labelIn(ENERGY, x))))}` : ''].filter(Boolean).join('; ');
    case 'decisionSpeed': return cap(v.split('').map((l) => SPEED_WORD[l]).filter(Boolean).join('; '));
    case 'decisionRights': return DECISIONS.filter(([id]) => v[id]).map(([id, name]) => `${name}: ${lower(labelIn(HOLDERS, v[id]))}`).join(', ');
    default: break;
  }
  switch (q.type) {
    case 'presets': return label(v);
    case 'multi': return v.map(label).join(', ');
    case 'tens': return v === 10 && q.plus ? q.plus : String(v);
    case 'number': { const u = str(q.unit); return `${count(v)} ${count(v) === '1' ? ({ prospects: 'prospect', contacts: 'contact', 'hours a week': 'hour a week', people: 'person', months: 'month' }[u] ?? u) : u}`.trim(); }
    case 'money': return `${gbp(v)} ${str(q.unit)}`.trim();
    case 'year': return v === 0 ? 'Under a year' : `${count(v)} ${v === 1 ? 'year' : 'years'}`;
    case 'pair': return `${q.labels[0]} ${gbp(v[0])}, ${q.labels[1].toLowerCase()} ${gbp(v[1])}`;
    case 'arc': return label(v);
    case 'ring': return `${v}%`;
    case 'costs': {
      const L = { rent: 'rent and premises', wages: 'wages', bills: 'bills and utilities', loans: 'loan repayments', other: 'other' };
      const parts = Object.entries(st.costLines ?? {}).filter(([, x]) => isNum(x)).map(([k, x]) => `${L[k] ?? k} ${gbp(x)}`);
      return `${gbp(v)} a month${parts.length ? ` (${parts.join(', ')})` : ''}`;
    }
    case 'split': return Object.entries(v).filter(([, x]) => x > 0).map(([id, x]) => `${distName(id)} ${x}%`).join(', ');
    default: return String(v);
  }
}
/** a short form of the answer for the flyer: a figure or a word or two */
function answerWord(id) {
  const q = BY_ID[id];
  if (!q) return '';
  const st = S();
  const v = st[q.key];
  switch (q.id) {
    case 'now': case 'goal': case 'price': case 'retainer': case 'owed': case 'agencyFee': case 'ltv': case 'fixedCosts': case 'n05': case 'n37': return isNum(v) ? gbp(v) : '';
    case 'spend': return isNum(v) ? gbp(v) : '';
    case 'market': return isNum(st.reach) ? count(st.reach) : '';
    case 'volume': return isNum(v) ? count(v) : '';
    case 'lastFive': return st.bestNone ? 'None yet' : Array.isArray(v) && v.length ? `${v.length} ${v.length === 1 ? 'card' : 'cards'}` : '';
    case 'segment': return v ? (v === 'none' ? 'Own words' : clip(segmentText(st, v) || 'Chosen', 30)) : '';
    case 'returned': return v && typeof v === 'object' && isNum(v.group) ? `${count(v.returned)} of ${count(v.group)}` : '';
    case 'hours': case 'n03': return isNum(v) ? `${count(v)} h/wk` : '';
    case 'n27': return v ? (v === 'none' ? 'None' : String(st.direction?.name ?? v).slice(0, 22)) : '';
    /* results 1, D9: a word or two for each of the opening branch's answers */
    case 'startPoint': return given(v) ? labelIn(START_POINT, v) : '';
    case 's01': case 's11': { const n = (Array.isArray(v) ? v : []).length; return n ? (n === 1 ? clip(answerText(q) ?? '', 22) : `${n} picked`) : ''; }
    case 's06': { const n = ideas().length; return n ? `${n} ${n === 1 ? 'idea' : 'ideas'}` : ''; }
    case 's07': case 's08': case 's09': return given(v) ? (v === 'none' ? 'None' : clip(ideaText(v), 22)) : '';
    case 's13': return isNum(st.s13Saw) || isNum(st.s13Replied) || isNum(st.s13Bought) ? [st.s13Saw, st.s13Replied, st.s13Bought].map((x) => (isNum(x) ? count(x) : '?')).join(' / ') : '';
    case 's14': return isNum(v) ? (v === 0 ? 'Free' : gbp(v)) : '';
    case 'bestWorst': return Array.isArray(v) && isNum(v[0]) ? gbp(v[0]) : '';
    case 'sector': return st.trade || (M.sectorWord?.(v) ?? '');
    case 'site': case 'import': return given(v) ? String(v).replace(/^https?:\/\//, '').slice(0, 30) : confirmedFinds().length ? 'Your notes' : '';
    case 'closeRate': case 'repeat': return isNum(v) ? `${v < 0.1 ? '<1' : Math.round(v * 10)} in 10` : '';
    case 'margin': return isNum(v) ? `${Math.round(v * 100)}p` : '';
    case 'topShare': return isNum(v) ? `${v}%` : '';
    case 'capacity': case 'market': case 'listSize': case 'network': case 'teamSize': case 'enquiries': case 'hours': case 'contentTime': case 'retainerMonths': return isNum(v) ? count(v) : '';
    case 'yearsTrading': return isNum(v) ? `${isNum(st.estMonth) ? `${MONTH_NAME[st.estMonth - 1].slice(0, 3)} ` : ''}${YEAR() - v}` : '';
    case 'ownShare': return isNum(v) ? `${v}%` : '';
    case 'months': return isNum(v) ? String(v) : '';
    case 'cv': return 'CV';
    case 'software': {
      if (!st.stackAsked) return '';
      const names = Object.values(st.stackNames ?? {}).map((n) => String(n ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      return names.length ? names.join(', ') : 'none';
    }
    case 'lastFive': return Array.isArray(v) ? `${v.filter((x) => x?.bin === 'warm11' || x?.bin === 'warm1m').length} warm` : '';
    default: {
      const t = answerText(q);
      if (t === null) return '';
      return t.length > 24 ? `${t.slice(0, 22).trim()}…` : t;
    }
  }
}
/** one point per question shown and answered (or passed with Not sure), for the roots and the export */
function points() {
  const st = S();
  const asked = Array.isArray(st.asked) ? st.asked : [];
  return ALL.filter((q) => !q.hidden && asked.includes(q.id) && applies(q) && (answeredQ(q) || st.notSure?.has?.(q.id))).map((q) => {
    const title = headline(q).title;
    if (!answeredQ(q)) return { id: q.id, driver: q.driver, kind: 'skip', size: 0.2, label: title };
    const v = st[q.key];
    let size = 0.5;
    if (q.type === 'number' || q.type === 'money' || q.type === 'costs') { const [lo, hi] = q.scale ?? [1, 100]; const t = (Math.log10(1 + Math.max(0, v)) - Math.log10(1 + lo)) / ((Math.log10(1 + hi) - Math.log10(1 + lo)) || 1); size = clamp(0.2 + 0.8 * t, 0.2, 1); }
    else if (q.type === 'tens') size = Math.max(0.15, v / 10);
    else if (q.type === 'multi') size = Math.min(1, 0.3 + 0.15 * v.length);
    else if (q.type === 'text') size = Math.min(1, 0.25 + String(v).length / 400);
    else if (q.kind === 'cv') size = 0.9;
    return { id: q.id, driver: q.driver, kind: 'you', size, label: title, value: answerText(q) };
  });
}
/** how an engine question should change for what the answers already settled, or null */
function driverAdapt(id) {
  const st = S(), d = derivedMap(), r = st.repeatWork;
  const asked = (qid) => (BY_ID[qid] ? answeredQ(BY_ID[qid]) : false) || Boolean(st.notSure?.has?.(qid));
  if (id === 'repeat' || id === 'retention') {
    if (r === 'once' && d.repeat === 'repeatWork') return { skip: true };
    if (r === 'retainer' && asked('retainerRenew') && (given(st.retention) || asked('retainerMonths'))) return { skip: true };
    if (r === 'retainer') return { title: 'Renewals', sub: 'How many in 10 renew' };
    return null;
  }
  if (id === 'price' && r === 'retainer') {
    if (asked('retainer') && !ownAnswer('price')) return { skip: true };
    return { fee: st.retainerValue ?? null, months: stayMonths() };
  }
  if (id === 'cycle' && r === 'retainer') return { sub: 'First contact to signed retainer' };
  if ((id === 'spend' || id === 'budget') && st.appetite === 'none') return { skip: true };
  return null;
}

/* ------------------------------------------------------------------ the founder and control profiles (refine 1, R17 and R18) */
/* Both are plain objects { current, intended, risks[], actions[] } built from the visitor's own answers and from nothing
   else: no forecast figure, no score, no reading of a person. Every sentence sets two or more answers side by side, or
   names who or what could take a task the visitor said they put off. canopy.js prints them (the Founder block, the
   Control card) and archetypes.js answers two chips from them; both read the extra keys named here. */
const ROLE_NOW = { none: 'you do all of it yourself', checks: 'you hand work over and check all of it', outcomes: 'you hand over the result you want and check that', full: 'others run whole areas without you' };
const ROLE_NEXT = { same: 'the same role as now', lead: 'lead only, out of the day to day', back: 'step back: part time, or chair', exit: 'leave the business' };
const TAKER = {
  invoicing: 'automate the reminders, or give it to a bookkeeper',
  followup: 'a follow-up sequence that stops on reply can take it',
  marketing: 'a marketing coordinator, a freelancer or an agency can take it',
  pricing: 'set one date a year for the review and keep it',
  hiring: 'an operations lead or a recruiter can run the search',
  talks: 'prepare each one with an adviser or a co-owner',
  planning: 'a planning hour each quarter with an adviser or a non-executive',
  admin: 'write it down, then hand it to an administrator or automate it',
};
/* which kind of person covers which gaps; a gap is a skill avoided or draining, or a task put off */
const OPERATORS = [
  ['A bookkeeper or finance administrator', ['numbers', 'invoicing', 'admin']],
  ['A sales or marketing coordinator', ['selling', 'marketing', 'followup']],
  ['An operations or people lead', ['delivering', 'people', 'hiring', 'talks']],
  ['An adviser or non-executive', ['strategy', 'planning', 'pricing']],
];
const gapWord = (id) => lower(labelIn([...ENERGY, ...AVOIDED], id));

function founderProfile() {
  const st = S();
  const out = (id) => Boolean(st.notSure?.has?.(id) || st.na?.has?.(id));
  const good = out('strengths') ? [] : [...(st.strengths ?? [])];
  const avoids = out('strengths') ? [] : [...(st.avoids ?? [])];
  const en = !out('energy') && st.energy && typeof st.energy === 'object' ? st.energy : {};
  const gives = [...(en.gives ?? [])], drains = [...(en.drains ?? [])];
  const putOff = out('avoided') ? [] : (st.avoided ?? []).filter((id) => id !== 'none');
  const del = out('delegation') ? null : st.delegation ?? null;
  const next = out('futureRole') ? null : st.futureRole ?? null;
  const holiday = out('holiday') ? null : st.holiday ?? null;
  const name = (id) => labelIn(ENERGY, id);

  const keepIds = good.filter((id) => gives.includes(id));
  const worn = good.filter((id) => drains.includes(id));
  const shed = [...new Set([...avoids, ...drains.filter((id) => !good.includes(id))])];
  const keep = keepIds.map((id) => `${name(id)}: you are good at it and it gives you energy.`);
  const delegate = [
    ...worn.map((id) => `${name(id)}: you are good at it and it drains you. Write down how you do it, then hand it over.`),
    ...shed.map((id) => `${name(id)}: ${avoids.includes(id) && drains.includes(id) ? 'you avoid it and it drains you' : avoids.includes(id) ? 'you avoid it' : 'it drains you'}. Hand it over, or automate it.`),
    ...putOff.map((id) => `${labelIn(AVOIDED, id)}: ${TAKER[id] ?? 'hand it over'}.`),
  ];
  const gaps = new Set([...shed, ...worn, ...putOff]);
  const operator = OPERATORS.map(([who, ids]) => { const hit = ids.filter((id) => gaps.has(id)); return hit.length ? `${who} covers ${listWords(hit.map(gapWord))}.` : ''; }).filter(Boolean);

  const signs = [
    holiday === 'stops' ? 'it stops when you take two weeks off' : holiday === 'slows' ? 'it slows when you take two weeks off' : holiday === 'never' ? 'it has never run two weeks without you' : '',
    st.who === 1 && !out('capacity') ? 'only you do the work' : '',
    del === 'none' ? 'you do all of it yourself' : del === 'checks' ? 'you check all the work you hand over' : '',
    st.help === 'alone' && !out('help') ? 'growth is yours alone' : '',
    st.breaksFirst === 'me' && !out('breaksFirst') ? 'you are the first thing to give at double the work' : '',
  ].filter(Boolean);
  const dependency = signs.length ? [`The business depends on you: ${listWords(signs)}.`] : [];

  const now = isNum(st.now) && st.now > 0 ? st.now : null;
  const goal = isNum(st.goal) && now && st.goal > now ? st.goal : null;
  const hrs = isNum(st.hours) && !out('hours') ? st.hours : null;
  let hours = null;
  if (hrs !== null) {
    const parts = [goal && one(goal / now) !== '1' ? `You give growth ${plural(hrs, 'hour', 'hours')} a week, against a target ${one(goal / now)} times today’s revenue.` : `You give growth ${plural(hrs, 'hour', 'hours')} a week.`];
    const first = [...worn, ...shed].slice(0, 2).map((id) => lower(name(id)));
    if (first.length) parts.push(`More hours for growth come from handing over ${listWords(first)} first.`);
    if ((next === 'lead' || next === 'back' || next === 'exit') && (del === 'none' || del === 'checks' || st.who === 1)) parts.push(`To ${{ lead: 'lead only', back: 'step back', exit: 'leave' }[next]}, the work you do yourself has to reach someone else before your hours can change.`);
    hours = parts.join(' ');
  }

  const risks = [
    ...(signs.length >= 2 ? dependency : []),
    next && next !== 'same' && (del === 'none' || del === 'checks') ? `You want to ${{ lead: 'lead only', back: 'step back', exit: 'leave' }[next]}, and today ${ROLE_NOW[del]}.` : '',
  ].filter(Boolean);
  const actions = [
    ...worn.map((id) => ({ text: `Write down how you do ${lower(name(id))}, then hand it over.`, why: 'You are good at it and it drains you.' })),
    ...putOff.map((id) => ({ text: `${labelIn(AVOIDED, id)}: ${TAKER[id] ?? 'hand it over'}.`, why: 'You said you put it off.' })),
    holiday === 'stops' || holiday === 'never' ? { text: 'Take one planned week away and list what stopped.', why: holiday === 'stops' ? 'You said the business stops without you.' : 'You said it has never run two weeks without you.' } : null,
    next && next !== 'same' && (del === 'none' || del === 'checks') ? { text: 'Hand over one whole area, result included, before your role changes.', why: `You said ${ROLE_NOW[del]}.` } : null,
  ].filter(Boolean).map((a, i) => ({ order: i + 1, ...a }));

  return {
    selfReported: true,
    current: { text: del ? ROLE_NOW[del] : '', role: del, strengths: good.map(name), avoids: avoids.map(name), gives: gives.map(name), drains: drains.map(name), avoided: putOff.map((id) => labelIn(AVOIDED, id)), decisions: typeof st.decisionSpeed === 'string' && !out('decisionSpeed') ? st.decisionSpeed.split('').map((l) => SPEED_WORD[l]).filter(Boolean) : [] },
    intended: { text: next ? ROLE_NEXT[next] : '', role: next, keep, delegate, operator, hours },
    keep, delegate, operator, dependency, hours, risks, actions,
  };
}

function controlProfile() {
  const st = S();
  const out = (id) => Boolean(st.notSure?.has?.(id) || st.na?.has?.(id));
  const val = (id) => (out(id) ? null : st[id] ?? null);
  const own = val('ownership');
  const shared = ['partners', 'investors', 'family'].includes(own);
  const share = shared && isNum(val('ownShare')) ? st.ownShare : null;
  const profit = shared ? val('profitShare') : null;
  const rightsNow = {};
  const dr = val('decisionRights');
  if (dr && typeof dr === 'object') DECISIONS.forEach(([id]) => { if (dr[id]) rightsNow[id] = dr[id]; });
  const retainRaw = out('retain') ? [] : [...(st.retain ?? [])];
  const retainAsked = retainRaw.length > 0;
  const keeps = retainRaw.filter((id) => id !== 'none');
  // intended: a decision on the list the visitor keeps stays theirs; one left off it moves on (shared stays shared)
  const rightsNext = {};
  if (retainAsked) DECISIONS.forEach(([id]) => { rightsNext[id] = keeps.includes(id) ? 'you' : rightsNow[id] === 'shared' ? 'shared' : 'team'; });
  const planned = (out('plannedChanges') ? [] : [...(st.plannedChanges ?? [])]).filter((id) => id !== 'none');
  const exit = val('exitIntent');
  const runs = val('influence');
  const key = isNum(val('keyPeople')) ? st.keyPeople : null;
  const holiday = out('holiday') ? null : st.holiday ?? null;
  const dname = (id) => lower(labelIn(DECISIONS, id));
  const placed = Object.values(rightsNow);
  const allMine = placed.length >= 3 && placed.every((x) => x === 'you');
  const moving = DECISIONS.map(([id]) => id).filter((id) => rightsNow[id] === 'you' && rightsNext[id] && rightsNext[id] !== 'you');
  const RUNS = { me: 'You run', partner: 'A partner or co-owner runs', family: 'A family member runs', manager: 'A manager runs', team: 'The team runs', nobody: 'No one person runs' };

  const nowWords = [
    own === 'sole' ? 'You own the business alone.' : shared ? `You own the business ${lower(labelIn(OWNERSHIP, own))}${share !== null ? `, and hold ${share}%` : ''}.` : '',
    profit ? { same: 'Profit is split in line with ownership.', more: 'You take more of the profit than your share.', less: 'You take less of the profit than your share.', unset: 'The profit split is not agreed.' }[profit] : '',
    runs ? `${RUNS[runs]} the day to day.` : '',
    key !== null ? (key === 0 ? 'You said the business could lose any one person.' : `${plural(key, 'person', 'people')} the business could not lose, you included.`) : '',
  ].filter(Boolean);
  const nextWords = [
    retainAsked ? (keeps.length ? `You mean to keep ${listWords(keeps.map(dname))}.` : 'You mean to keep none of the five decisions for yourself.') : '',
    planned.length ? `Planned: ${listWords(planned.map((id) => lower(labelIn(PLANNED, id))))}.` : '',
    exit ? `Long-term plan: ${lower(labelIn(EXIT, exit))}.` : '',
  ].filter(Boolean);

  const dependency = allMine && (holiday === 'stops' || holiday === 'slows' || key === 1)
    ? `Every decision you placed is yours${holiday === 'stops' || holiday === 'slows' ? `, and the business ${holiday} when you take two weeks off` : ''}${key === 1 ? `${holiday === 'stops' || holiday === 'slows' ? ';' : ','} you are the one person it could not lose` : ''}.`
    : '';
  const risks = [
    profit === 'unset' ? 'The profit split between the owners is not agreed.' : '',
    runs && runs !== 'me' && runs !== 'nobody' && allMine ? `${RUNS[runs]} the day to day, yet every decision you placed is yours: the person running the day cannot settle them.` : '',
    share !== null && share <= 50 && keeps.length ? `You hold ${share}% and mean to keep ${listWords(keeps.map(dname))}. Whether you can is set by the agreement between the owners: one to check.` : '',
    (planned.includes('partner') || planned.includes('investor')) && keeps.length >= 3 ? `You plan to ${listWords(planned.filter((id) => id === 'partner' || id === 'investor').map((id) => lower(labelIn(PLANNED, id))))} and mean to keep ${listWords(keeps.map(dname))}: agree who decides what before terms are discussed.` : '',
    (exit === 'sale' || exit === 'succession') && allMine ? `You mean to ${exit === 'sale' ? 'sell' : 'hand the business on'}, and every decision you placed runs through you.` : '',
    exit === 'succession' && !planned.includes('successor') && !out('plannedChanges') && (st.plannedChanges ?? []).length ? 'You mean to hand the business on, and no successor is among your planned changes.' : '',
    given(st.unresolved) && !out('unresolved') ? `An open question, in your words: “${String(st.unresolved).slice(0, 200)}”` : '',
  ].filter(Boolean);
  const sharedNow = DECISIONS.map(([id]) => id).filter((id) => rightsNow[id] === 'shared');
  const actions = [
    sharedNow.length || given(st.unresolved) ? { text: `Write down who has the last word on ${sharedNow.length ? listWords(sharedNow.map(dname)) : 'each of the five decisions'}, and how a disagreement is settled.`, why: sharedNow.length ? 'You said these are shared.' : 'You wrote an open question.' } : null,
    ...moving.map((id) => ({ text: `Write down the rules you use for ${dname(id)} before it moves on from you.`, why: 'It is yours today and not on the list you keep.' })),
    dependency ? { text: 'Name one person who can decide in your place for a fortnight, and tell the team which decisions that covers.', why: 'Every decision you placed is yours.' } : null,
    profit === 'unset' ? { text: 'Agree the profit split in writing.', why: 'You said it is not agreed.' } : null,
    planned.includes('partner') || planned.includes('investor') ? { text: 'Before a partner or investor joins, agree in writing the share, the profit split and which of the five decisions become shared.', why: 'A solicitor drafts it; an accountant checks the tax.' } : null,
    exit === 'succession' && !planned.includes('successor') ? { text: 'Name the successor, or the kind of person, and the date you would start handing over.', why: 'You mean to hand the business on.' } : null,
  ].filter(Boolean).map((a, i) => ({ order: i + 1, ...a }));

  return {
    selfReported: true,
    current: { decisionRights: rightsNow, words: nowWords, ownership: own, ownShare: share, profitShare: profit, runs, keyPeople: key },
    intended: { decisionRights: rightsNext, words: nextWords, keeps, plannedChanges: planned, exitIntent: exit },
    dependency, risks, actions,
    review: 'Ownership, employment, tax and shareholder rights are for a solicitor or accountant to review.',
  };
}

/* ------------------------------------------------------------------ rebuild 1: customers, best clients, directions */
/** the customers a visitor has described, as two or three suggested groups (brief 6.4). Built from the offer, the price,
    the place, the best-client cards and the trigger; each carries the answers it was built from. Sample hypotheses in
    plain words, never a claim about a market. Empty when nothing has been said yet */
function customerProfiles() {
  const st = S();
  const trade = String(st.trade || (given(st.sector) ? M.sectorWord?.(st.sector) : '') || '').toLowerCase();
  const need = trade ? (st.does ? String(st.does).slice(0, 60).toLowerCase() : trade) : (st.does ? String(st.does).slice(0, 60).toLowerCase() : '');
  const place = given(st.place) ? String(st.place) : '';
  const where = delivers('remote') && !onSite() ? 'anywhere' : st.radius === 'local' && place ? `in ${place}` : st.radius === 'county' && place ? `within about 30 miles of ${place}` : st.radius === 'national' ? 'across the country' : place ? `around ${place}` : '';
  const price = isNum(st.price) && st.price > 0 ? st.price : null;
  const band = price ? (price >= 2000 ? 'spend a few thousand at a time' : price >= 150 ? 'pay a few hundred at a time' : 'buy at a low price and often') : '';
  const trig = st.trigger && st.trigger !== 'other' ? { urgent: 'when a problem cannot wait', change: 'when something changes at their end', recommended: 'on a recommendation', deadline: 'against a date', offer: 'when the price is right', planned: 'as a planned purchase' }[st.trigger] : given(st.triggerOther) ? String(st.triggerOther).slice(0, 60) : '';
  const cards = Array.isArray(st.lastFive) ? st.lastFive : [];
  const cardBuyers = [...new Set(cards.map((c) => c?.buyer).filter(Boolean))];
  const valued = cards.flatMap((c) => c?.valuable ?? []);
  const topValued = [...new Set(valued)].sort((a, b) => valued.filter((x) => x === b).length - valued.filter((x) => x === a).length)[0] ?? null;
  const buyers = [...new Set([...(Array.isArray(st.buyers) ? st.buyers : st.buyer && st.buyer !== 'mixed' ? [st.buyer] : []), ...cardBuyers])].slice(0, 3);
  if (!buyers.length && !need) return [];
  const who = (b) => ({ consumer: 'Households', micro: 'Owner-run businesses', mid: 'Mid-sized firms', enterprise: 'Large companies', public: 'Public bodies and charities' }[b] ?? 'Customers');
  const whoSub = (b) => ({ consumer: 'people at home', micro: 'firms of two to twenty people', mid: 'firms with a manager who decides', enterprise: 'companies with a buying process', public: 'organisations that buy through a process' }[b] ?? '');
  const out = [];
  const mk = (id, title, text, basis) => out.push({ id, title, text, basis: basis.filter(Boolean) });
  (buyers.length ? buyers : [null]).forEach((b, i) => {
    const title = b ? who(b) : cap(need || 'Customers');
    const words = [`${b ? whoSub(b) : 'People'}${where ? ` ${where}` : ''}`, need && band ? `who need ${need} and ${band}` : need ? `who need ${need}` : band ? `who ${band}` : ''].filter(Boolean).join(' ') + (trig ? `, buying ${trig}` : '') + '.';
    mk(`p${i + 1}`, title, cap(words), [b ? 'who pays you' : '', need ? 'what you do' : '', where ? 'location' : '', band ? 'sale value' : '', trig ? 'why they buy' : '']);
  });
  if (topValued && cardBuyers.length) {
    const vw = { margin: 'pay a good margin', easy: 'are easy to serve', repeat: 'come back for more', quick: 'decide quickly', enjoy: 'bring work you enjoy', referrals: 'send referrals' }[topValued];
    mk('best', 'Like your best', `${cap(whoSub(cardBuyers[0]) || 'customers')}${where ? ` ${where}` : ''} who ${vw}${need ? `, needing ${need}` : ''}.`, ['best customers', where ? 'location' : '']);
  }
  return out.slice(0, 3);
}
/** the one narrowing choice that would tell the plan most (brief 6.4): buyer role, purchase trigger, budget fit or access */
function narrowingChoice() {
  const st = S();
  if (b2b() && !given(st.decider)) return { kind: 'decider', caption: 'Who normally decides to buy?', options: DECIDERS };
  if (!given(st.trigger)) return { kind: 'trigger', caption: 'What usually makes them decide to buy?', options: TRIGGERS.filter((o) => o[0] !== 'other') };
  if (!given(st.access)) return { kind: 'access', caption: 'The easiest way to reach them', options: ACCESS.filter((o) => o[0] !== 'none') };
  return { kind: 'budget', caption: 'How the price fits them', options: [['easy', 'An easy spend'], ['considered', 'A considered one'], ['stretch', 'A stretch']] };
}
/** the best-customer cards as positioning: counts and words, never a rate, an average or a price */
function bestClients() {
  const st = S();
  const cards = Array.isArray(st.lastFive) ? st.lastFive.filter((c) => c && typeof c === 'object') : [];
  const none = Boolean(st.bestNone) || (!cards.length && Boolean(st.asked?.includes?.('lastFive')));
  const countOf = (arr) => { const m = {}; arr.forEach((x) => { if (x) m[x] = (m[x] ?? 0) + 1; }); return m; };
  const found = countOf(cards.map((c) => c.found));
  const buyers = countOf(cards.map((c) => c.buyer));
  const valued = countOf(cards.flatMap((c) => c.valuable ?? []));
  const warm = cards.filter((c) => c.bin === 'warm11' || c.bin === 'warm1m').length;
  const top = (m, table) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ id: k, n, label: labelIn(table, k) }));
  const positioning = [];
  const n = cards.length;
  if (n) {
    const f = top(found, FOUND_BY)[0];
    if (f && f.n >= Math.max(2, Math.ceil(n / 2))) positioning.push(`${f.n} of your ${n === 1 ? 'best customer' : `${n} best`} came by ${lower(f.label)}.`);
    const v = top(valued, VALUED).slice(0, 2);
    if (v.length) positioning.push(`What made them good: ${listWords(v.map((x) => lower(x.label)))}.`);
    const b = top(buyers, BUYERS)[0];
    if (b && b.n === n && n >= 2) positioning.push(`All ${n} are ${buyerWord(b.id)}.`);
    const easy = cards.filter((c) => c.ease === 'easy').length;
    if (easy >= 2) positioning.push(`${easy} of them were easy work.`);
  }
  return { count: n, none, cards: cards.map((c) => ({ ...c })), warm, found: top(found, FOUND_BY), buyers: top(buyers, BUYERS), valuable: top(valued, VALUED), positioning, baseline: false, note: 'Positioning only: these cards never set a price, a rate or a revenue figure.' };
}
/* ------------------------------------------------------------------ Task 11: Your advantage

   Three points, each one traceable to an answer the visitor gave, ranked by how strong the evidence behind it is: paid
   work first, then a result achieved, then what people already come for, then access, then what is owned. The label
   over them describes how the person likes to work, in the words of the work itself. It is a hypothesis, it is editable,
   and it is not a diagnosis: no psychological type, no population percentile, no score. With no answers there are no
   points, and the profile says so rather than filling itself in. */
const ARCHETYPES = [
  { id: 'teacher', label: 'Specialist teacher', when: (st) => st.workStyle === 'teaching' || (st.n10 ?? []).includes('teaching') },
  { id: 'organiser', label: 'Practical organiser', when: (st) => st.workStyle === 'organising' || (st.n10 ?? []).includes('organising') },
  { id: 'maker', label: 'Maker', when: (st) => st.workStyle === 'making' || (st.n10 ?? []).some((x) => x === 'making' || x === 'fixing') },
  { id: 'adviser', label: 'Adviser', when: (st) => st.workStyle === 'advising' || (st.n10 ?? []).includes('numbers') },
  { id: 'researcher', label: 'Researcher', when: (st) => st.workStyle === 'researching' || (st.n10 ?? []).includes('tech') },
  { id: 'seller', label: 'Seller', when: (st) => st.workStyle === 'selling' || (st.n10 ?? []).includes('selling') },
  { id: 'carer', label: 'Carer', when: (st) => (st.n10 ?? []).includes('caring') },
  { id: 'competitor', label: 'Competitor', when: (st) => st.workStyle === 'competing' },
];
function advantage() {
  const st = S();
  const skill = (id) => lower(labelIn(N10, id));
  const group = (id) => lower(labelIn(N19, id));
  const points = [];
  const add = (kind, text, from) => { if (text && points.length < 6) points.push({ kind, text, from: from.filter(Boolean) }); };
  const proven = (st.n11 ?? []).filter(Boolean);
  const askedFor = (st.n12 ?? []).filter((x) => x !== 'none' && x !== 'other');
  const groups = (st.n19 ?? []).filter((x) => x !== 'other');
  const problems = (st.n20 ?? []).filter((x) => x !== 'other');
  const tools = (st.n16 ?? []).filter((x) => x !== 'none');
  const extras = (st.n17 ?? []).filter((x) => x !== 'none');
  const helpers = (st.n23 ?? []).filter((x) => x !== 'none');
  if (st.paidBefore === 'paid') add('paid', `You have already been paid for this${given(st.paidWhat) ? `: ${String(st.paidWhat)}` : ''}.`, [{ id: 'paidBefore', answer: 'Yes, I was paid' }, given(st.paidWhat) ? { id: 'paidBefore', answer: String(st.paidWhat) } : null]);
  else if (st.paidBefore === 'unpaid') add('helped', `You have done this for someone already${given(st.paidWhat) ? `: ${String(st.paidWhat)}` : ''}, without being paid for it.`, [{ id: 'paidBefore', answer: 'Yes, but not for money' }]);
  if (proven.length) add('proven', `You have used ${listWords(proven.map(skill))} to get a result${given(st.n11Example) ? `: ${String(st.n11Example)}` : ''}.`, [{ id: 'n11', answer: proven.map(skill).join(', ') }, given(st.n11Example) ? { id: 'n11', answer: String(st.n11Example) } : null]);
  if (askedFor.length) add('asked', `People already come to you for ${listWords(askedFor.map(skill))}.`, [{ id: 'n12', answer: askedFor.map(skill).join(', ') }]);
  if (groups.length) add('buyers', `You understand ${listWords(groups.map(group))}${problems.length ? `, and the ${lower(labelIn(N20, problems[0]))} they run into` : ''}.`, [{ id: 'n19', answer: groups.map(group).join(', ') }, problems.length ? { id: 'n20', answer: lower(labelIn(N20, problems[0])) } : null]);
  if (st.n21 === 'direct') add('access', 'You could speak to a few of those people this week without an introduction.', [{ id: 'n21', answer: 'Yes, directly' }]);
  else if (given(st.n22) && st.n22 !== 'none') add('access', `You already reach people through ${lower(labelIn(N22, st.n22))}${isNum(st.n22Size) ? ` (about ${count(st.n22Size)})` : ''}.`, [{ id: 'n22', answer: lower(labelIn(N22, st.n22)) }]);
  if (given(st.bestAt)) add('depth', `You have spent the most time on ${lower(String(st.bestAt))}.`, [{ id: 'bestAt', answer: String(st.bestAt) }]);
  if (extras.length) add('credential', `You hold ${listWords(extras.map((x) => lower(labelIn(N17, x))))}.`, [{ id: 'n17', answer: extras.map((x) => lower(labelIn(N17, x))).join(', ') }]);
  if (helpers.length) add('helper', `You could build this with ${listWords(helpers.map((x) => lower(labelIn(N23, x))))}${st.n24 === 'helping' ? ', who is helping already' : ''}.`, [{ id: 'n23', answer: helpers.map((x) => lower(labelIn(N23, x))).join(', ') }]);
  if (tools.length) add('tools', `You already own ${listWords(tools.map((x) => lower(labelIn(N16, x))))}, so the first version costs you time, not money.`, [{ id: 'n16', answer: tools.map((x) => lower(labelIn(N16, x))).join(', ') }]);
  if (given(st.interest)) add('interest', `Given a free hour you would ${lower(String(st.interest))}${given(st.interestPart) ? `, and the part you enjoy most is ${lower(String(st.interestPart))}` : ''}.`, [{ id: 'interest', answer: String(st.interest) }]);
  // the work-style answer speaks for itself; the skills list is only read where nothing was said about style
  const byStyle = given(st.workStyle) ? ARCHETYPES.find((a) => a.id === ({ teaching: 'teacher', organising: 'organiser', making: 'maker', advising: 'adviser', researching: 'researcher', selling: 'seller', competing: 'competitor' }[st.workStyle])) : null;
  const mercerLabel = byStyle ?? ARCHETYPES.find((a) => { try { return Boolean(a.when(st)); } catch (e) { return false; } }) ?? null;
  const own = given(st.advantageLabel) ? String(st.advantageLabel).slice(0, 60) : null;
  return {
    points: points.slice(0, 3).map((p) => ({ ...p, from: [...p.from] })),
    all: points,
    label: own ?? mercerLabel?.label ?? null,
    labelSource: own ? 'yours' : mercerLabel ? 'mercer' : 'none',
    labelId: mercerLabel?.id ?? null,
    editable: true,
    note: 'A description of how you like to work, from your own answers. Change it if it is wrong. It is not a test result and it changes no figure.',
    enough: points.length >= 3,
  };
}
/** the visitor's own word for the label over their advantage; an empty string gives Mercer's own back */
function setAdvantageLabel(text) {
  const st = S();
  const t = String(text ?? '').trim().slice(0, 60);
  st.advantageLabel = t || null;
  if (typeof M.commit === 'function') { try { M.commit('advantageLabel', st.advantageLabel, {}); } catch (e) { /* flow may not take it */ } }
  return advantage();
}
/** every proposal Mercer is making right now, for the plan and the results: what it says, and what it was built from */
function proposals() {
  const out = [];
  const push = (id, p) => { if (p) out.push({ id, title: headline(BY_ID[id] ?? { id }).title, value: p.value ?? null, lines: p.lines ?? [], basis: (p.basis ?? []).map((b) => ({ ...b })), edited: Boolean(S()[`${id}Edited`]) }); };
  if (isStarter()) {
    push('n35', deliveryProposal());
    push('n37', priceProposal());
    push('n39', milestoneProposal());
    push('n40', stopProposal());
    if (given(S().n27)) push('n30', gapProposal());
  } else {
    const c = capacityEstimate();
    if (c) out.push({ id: 'capacity', title: headline(BY_ID.capacity).title, value: c.value, lines: [c.words], basis: [{ id: c.basis, words: c.words }], edited: derivedMap().capacity === undefined && isNum(S().capacity) });
  }
  return out;
}
/** the starter directions from the brain (M.starter.directions), read defensively; without it, the visitor's own idea as one card */
function starterDirections() {
  const st = S();
  let d = null;
  try { d = typeof M.starter?.directions === 'function' ? M.starter.directions(st) : null; } catch (e) { d = null; }
  const norm = (x, i) => (x && typeof x === 'object' ? { id: String(x.id ?? `d${i}`), name: String(x.name ?? x.title ?? 'A direction'), buyer: String(x.buyer ?? ''), offer: String(x.offer ?? ''), fit: String(x.fit ?? x.why ?? ''), unknown: String(x.unknown ?? x.hardestUnknown ?? ''), firstTest: String(x.firstTest ?? x.test ?? ''), needsPartner: Boolean(x.needsPartner), needsPermission: Boolean(x.needsPermission), needsAvailability: Boolean(x.needsAvailability), assets: Array.isArray(x.assets) ? x.assets : [], offers: Array.isArray(x.offers) ? x.offers : [], priceLow: isNum(x.priceLow) ? x.priceLow : null, priceHigh: isNum(x.priceHigh) ? x.priceHigh : null, priceBasis: String(x.priceBasis ?? '') } : null);
  if (d && (d.recommended || (Array.isArray(d.alternatives) && d.alternatives.length))) {
    return { recommended: norm(d.recommended, 0), alternatives: (d.alternatives ?? []).map(norm).filter(Boolean).slice(0, 2), excluded: d.excluded ?? [], tieBreaker: typeof d.tieBreaker === 'string' ? d.tieBreaker : d.tieBreaker?.question ?? '', note: '' };
  }
  // no reasoning yet: the visitor's own idea is the one card, with nothing invented around it
  // results 1, D9: the idea can come from any start; the buyer is who they said would pay, else who they understand
  const own = ownIdeaText();
  if ((startsAt('one', 'few', 'tried') || idea()) && given(own)) {
    const said = (st.s01 ?? []).filter((x) => x !== 'other').map((g) => lower(labelIn(N19, g)));
    if (given(st.s01Other)) said.push(String(st.s01Other));
    const groups = said.length ? said : (st.n19 ?? []).filter((x) => x !== 'other').map((g) => lower(labelIn(N19, g)));
    return { recommended: null, alternatives: [norm({ id: 'own', name: own.slice(0, 80), buyer: groups.length ? listWords(groups) : '', offer: '', fit: 'Your own idea', unknown: st.s04 === 'paidonce' || st.s04 === 'paidmore' ? 'Whether more of them will pay for it' : 'Whether they will pay for it', firstTest: 'Three conversations with people who might buy, this week' }, 0)], excluded: [], tieBreaker: '', note: '' };
  }
  return { recommended: null, alternatives: [], excluded: [], tieBreaker: '', note: 'No suggested directions are ready for these answers yet. Pick None of these and the plan gives a discovery step.' };
}

/* ------------------------------------------------------------------ exports */
M.SCHEMA = ALL;
M.SCHEMA_BY = BY_ID;
M.SCHEMA_KEYS = [...new Set([...ALL.flatMap((q) => [q.key, ...(q.keys ?? [])]), 'costLines', 'derived', 'quotes', 'retainerValue', 'buyerPrimary', 'segmentEdited', 'route'])].filter(Boolean);
M.Q = Q;
/* R5: the registry is the same table, every entry carrying its metadata (route, section, legacy, control, when, affects,
   satisfiedBy, unit, unknownOk, invalidates, tier, effort, on). app.js runs the next-question policy over it */
M.registry = ALL;
M.registryBy = BY_ID;
M.ROUTE_SECTIONS = ROUTE_SECTIONS;
M.SECTION_NAMES = { owner: OWNER_NAMES, starter: STARTER_NAMES };
M.SECTION_ORDER = SECTION_ORDER;
M.sectionQuestions = sectionQuestions;
M.screensFor = screensFor;
M.routeOf = routeOf;
M.questionSection = (id) => BY_ID[id]?.section ?? null;
M.legacySection = (id) => BY_ID[id]?.legacy ?? null;
M.onRoute = (id, route) => { const q = BY_ID[id]; return q ? onRoute(q, route ?? routeOf()) : false; };
M.headline = (id) => headline(BY_ID[id] ?? { id });
M.explain = (id) => explain(BY_ID[id] ?? { id });
/** Not sure leaves no figure behind: a question with no engine stand-in goes back to empty (a half-made 0 included) */
const NO_STAND_IN = ['ring', 'arc', 'number', 'money', 'pair'];
document.addEventListener('mercer:unsure', (e) => {
  const q = BY_ID[e.detail?.id];
  if (!q || q.kind || q.engine || !NO_STAND_IN.includes(q.type)) return;
  const st = S();
  if (!given(st[q.key]) || derivedMap()[q.key] !== undefined) return;
  st[q.key] = null;
  M.flow?.backward?.(q.key);
});
M.unsureWord = (id) => BY_ID[id]?.unsure ?? 'Not sure';
M.renderQuestion = renderQuestion;
M.renderSchema = (q, body, enable) => renderQuestion(q, body, enable);
M.schemaWord = (id) => { const q = BY_ID[id]; if (!q) return ''; const w = word(q); return w && (typeof w === 'string' || w.text) ? w : quiet(q); };
M.methodLine = (id) => METHOD[id] ?? '';
M.schemaAnswered = (id) => { const q = BY_ID[id]; return q ? answeredQ(q) : false; };
M.answeredQ = M.schemaAnswered;
M.schemaApplies = (id) => { const q = BY_ID[id]; return q ? applies(q) : false; };
M.schemaAnswers = () => ALL.filter((q) => !q.hidden).map((q) => ({ id: q.id, title: headline(q).title, answer: answerText(q) })).filter((x) => x.answer !== null);
M.schemaPoints = points;
M.driverAdapt = driverAdapt;
M.derive = derive;
M.answerWord = answerWord;
M.appetiteLine = appetiteLine;
M.founderProfile = founderProfile;
M.controlProfile = controlProfile;
M.bestClients = bestClients;
M.customerProfiles = customerProfiles;
M.starterDirections = starterDirections;
/* results 1, D9: the few ideas and what the comparison settled, for the brain and the flow. Each is { id, text } */
M.ideas = ideas;
M.standingIdeas = standingIdeas;
M.chosenIdea = chosenIdea;
M.ownIdeaText = ownIdeaText;
/* final 1: the advantage profile (Task 11), the proposals that replaced the deleted questions (Task 13) and the
   capacity ceiling read from last month's facts (Task 18). Every one of them is built from answers alone */
M.advantage = advantage;
M.setAdvantageLabel = setAdvantageLabel;
M.proposals = proposals;
M.proposalFor = (id) => proposals().find((p) => p.id === id) ?? null;
M.capacityEstimate = capacityEstimate;
/* Task 11's prompts, in the order they are put: what draws them in, what they are good at, who they understand, what
   they can reach and who could help. Each row says whether it is being asked now and whether it has been answered */
const DISCOVERY = ['interest', 'n01', 'n09', 'bestAt', 'n10', 'n11', 'n12', 'paidBefore', 'workStyle', 'n13', 'n16', 'n17', 'n19', 'n20', 'n21', 'n22', 'n23', 'n24'];
M.discoveryPrompts = () => DISCOVERY.filter((id) => BY_ID[id]).map((id) => ({ id, on: BY_ID[id].on ?? null, asked: applies(BY_ID[id]), answered: answeredQ(BY_ID[id]) }));
M.established = () => { const st = S(); return isNum(st.yearsTrading) ? { year: YEAR() - st.yearsTrading, month: isNum(st.estMonth) ? st.estMonth : null, years: st.yearsTrading } : null; };
if (typeof M.ukDate !== 'function') M.ukDate = ukDate;
M.QUADRANT_FALLBACK = QUADRANT;
})();
