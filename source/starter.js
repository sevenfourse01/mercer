/* starter.js (Mercer 12, rebuild 1, owner: brain): the no-business route's reasoning (R18, brief 9.5 and 9.6).

   A catalogue of direction archetypes (buyer types, offer shape, delivery mode, budget and audience needs,
   skills, time to a first test, the first test, the assets it needs). M.starter.directions(state) applies
   the hard exclusions first (budget, hours, an essential skill, location, a delivery mode the person avoids,
   income needed sooner than the direction can earn), then a short qualitative comparison on demonstrated
   strengths, buyer access, evidence of a problem, speed of test, cost, enjoyment and scope, and returns one
   recommended direction, up to two alternatives, every exclusion with its reason, and a tie-breaker question
   when two are close. Levels are words (strong, some, weak); no percentage fit is ever computed or shown.
   An idea the person already holds is mapped onto the catalogue and judged by the same rules; when its
   constraints fail it is narrowed (a manual version of the same promise) rather than replaced with a
   fashionable substitute. M.starter.plan(state, direction) is the starter result of brief 9.6.

   Answer ids: the interview owner registers the starter bank as n01..n44 (brief 9.2 to 9.4) unless the
   registry names them; FIELDS below lists the ids read for each concept, in order, and the registry's
   `bank` (or `n`) field is read at runtime so a named id still lands. Values are read tolerantly: a number,
   a band string ("2-5", "under 5"), an option id, a list or a free sentence. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});

/* ---------------------------------------------------------------- reading the answers */
const FIELDS = {
  activity: ['n01', 'activity', 'doingNow', 'occupation'],
  outcome: ['n02', 'starterGoal', 'win', 'outcome'],
  hoursWeek: ['n03', 'hoursWeek', 'starterHours', 'weeklyHours', 'hours'],
  when: ['n04', 'timeWhen', 'availability'],
  testBudget: ['n05', 'testBudget', 'startBudget', 'budget'],
  monthly: ['n06', 'monthlyBudget', 'ongoingCost', 'monthlyCost'],
  urgency: ['n07', 'earnBy', 'urgency', 'incomeWhen'],
  constraints: ['n08', 'protected', 'constraints'],
  work: ['n09', 'pastWork', 'experience', 'cv'],
  skills: ['n10', 'skills', 'goodAt', 'strengths'],
  proven: ['n11', 'provenSkills', 'proven', 'results'],
  askedFor: ['n12', 'askedFor', 'peopleAsk'],
  enjoy: ['n13', 'enjoy', 'enjoys', 'repeatable'],
  avoid: ['n14', 'avoid', 'avoids', 'ratherNot'],
  learn: ['n15', 'willLearn', 'learn'],
  tools: ['n16', 'tools', 'ownedTools', 'equipment', 'stackNames'],
  qualifications: ['n17', 'qualifications', 'credentials', 'specialAccess'],
  locality: ['n18', 'locality', 'workWhere', 'localRemote'],
  groups: ['n19', 'groups', 'knownGroups', 'understands'],
  problems: ['n20', 'problems', 'problemsSeen'],
  access: ['n21', 'access', 'canSpeak', 'reachThisWeek'],
  audience: ['n22', 'audience', 'community', 'following'],
  helpers: ['n23', 'helpers', 'whoHelps', 'network'],
  helperStatus: ['n24', 'helperStatus', 'helpersAsked', 'asked'],
  idea: ['n25', 'idea', 'existingIdea', 'ownIdea'],
  tried: ['n26', 'triedBefore', 'tried'],
  direction: ['n27', 'direction', 'selectedDirection', 'chosenDirection'],
  putsOff: ['n28', 'putsOff', 'objection'],
  alone: ['n29', 'alone', 'withSomeone'],
  support: ['n30', 'support', 'supportKind'],
  firstBuyer: ['n31', 'firstBuyer', 'buyerSegment'],
  firstResult: ['n32', 'firstResult', 'firstOffer'],
  demandEvidence: ['n33', 'demandEvidence', 'evidence'],
  testMethod: ['n34', 'testMethod', 'howToTest'],
  canDeliver: ['n35', 'canDeliver', 'deliverable'],
  firstDelivery: ['n36', 'firstDelivery', 'deliveryNeeds'],
  testPrice: ['n37', 'testPrice', 'firstPrice', 'price'],
  reachHow: ['n38', 'reachHow', 'firstChannel'],
  continueIf: ['n39', 'continueIf', 'successMilestone'],
  stopIf: ['n40', 'stopIf', 'stopCondition'],
  permissions: ['n41', 'permissions', 'licences'],
  createFirst: ['n42', 'createFirst', 'firstAsset'],
  toolsConfirm: ['n43', 'toolsConfirm'],
  tmaHelp: ['n44', 'tmaHelp', 'wantHelp'],
  /* final pack, Task 14: read only if the interview asks them. Each is optional and each is the person's own figure */
  deliveryHours: ['n45', 'deliveryHours', 'hoursPerDelivery', 'timePerJob'],
  currentIncome: ['n46', 'currentIncome', 'employmentIncome', 'incomeNow'],
  currentIncomeHours: ['n47', 'currentIncomeHours', 'employmentHours'],
  targetMonthly: ['n48', 'targetMonthly', 'incomeTarget', 'goal'],
  /* results round 1, D9: the opening branch and its follow-ups. `startPoint` is none / few / one / tried; n25 and n26
     are derived from it by the interview and are still read above for a saved state that predates it */
  startPoint: ['startPoint', 'startingPoint', 'whereStarting'],
  payer: ['s01', 'whoPays', 'wouldPay'],
  need: ['s02', 'needSolved', 'problemSolved'],
  todayDo: ['s03', 'doToday', 'currentFix'],
  askedPaid: ['s04', 'askedOrPaid', 'anyoneAsked'],
  deliverNow: ['s05', 'deliverSmall', 'canDeliverNow'],
  ideas: ['s06', 'ideas', 'ideaList'],
  tieIdea: ['s07', 'testOne', 'ideaTie'],
  ideaAsked: ['s08', 'ideaWithDemand', 'ideaAsked'],
  ideaDeliverable: ['s09', 'ideaDeliverable', 'ideaDeliver'],
  triedWhat: ['s10', 'triedOffer', 'offeredWhat'],
  triedChannel: ['s11', 'triedChannel', 'triedThrough'],
  triedOutcome: ['s12', 'triedOutcome', 'whatHappened'],
  triedNumbers: ['s13', 'triedNumbers', 'reachReplies'],
  triedPrice: ['s14', 'triedPrice', 'priceCharged'],
};
const BANK_OF = Object.fromEntries(Object.entries(FIELDS).map(([k, ids]) => [ids[0].toUpperCase(), k]));

const inSet = (c, k) => (!c ? false : typeof c.has === 'function' ? c.has(k) : Array.isArray(c) ? c.includes(k) : !!c[k]);
const given = (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) && !(v instanceof Set && !v.size);
/** the registry's own id for a bank code, when the interview owner named one ({ id: 'weeklyHours', bank: 'N03' }) */
function registryId(concept) {
  const reg = M.registry;
  if (!Array.isArray(reg)) return null;
  const code = FIELDS[concept]?.[0]?.toUpperCase();
  const hit = reg.find((q) => q && (String(q.bank ?? q.n ?? '').toUpperCase() === code));
  return hit?.id ?? null;
}
/** the id an answer for `concept` sits under in this state, or null */
function idFor(s, concept) {
  const named = registryId(concept);
  const ids = named ? [named, ...FIELDS[concept]] : FIELDS[concept];
  return ids.find((id) => given(s[id])) ?? null;
}
const unsure = (s, id) => !!id && (inSet(s.notSure, id) || inSet(s.na, id));
/** the raw answer for a concept: null when unanswered, Not sure or not applicable */
function raw(s, concept) {
  const id = idFor(s, concept);
  if (!id || unsure(s, id)) return null;
  return s[id];
}
const answered = (s, concept) => raw(s, concept) !== null;
/* one string, from whatever shape the answer takes */
const text = (v) => (v === null || v === undefined ? '' : Array.isArray(v) ? v.map(text).join(', ') : v instanceof Set ? [...v].map(text).join(', ') : typeof v === 'object' ? (v.text ?? v.label ?? v.value ?? v.id ?? Object.keys(v).filter((k) => v[k]).join(', ')) : String(v));
/* a list of lower-case tokens, from a list, a set, an object of flags or a sentence */
function tokens(v) {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v.flatMap(tokens);
  if (v instanceof Set) return [...v].flatMap(tokens);
  if (typeof v === 'object') return Object.keys(v).filter((k) => v[k]).flatMap((k) => (typeof v[k] === 'string' ? [k.toLowerCase(), v[k].toLowerCase()] : [k.toLowerCase()]));
  return String(v).toLowerCase().split(/[,;/\n]+|\band\b/).map((x) => x.trim()).filter(Boolean);
}
/** a number from a number, "£150", "2-5 hours" (the midpoint), "under 5" (the bound), "10+" (the bound), "none" (0) */
function number(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object') return number(v.value ?? v.hours ?? v.amount ?? v.n ?? null);
  const s = String(v).toLowerCase().trim();
  if (/^(0|zero|none|nothing|no budget|nil)\b/.test(s)) return 0;
  const nums = (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (!nums.length) return null;
  if (nums.length >= 2 && /-|to|–/.test(s)) return (nums[0] + nums[1]) / 2;
  return nums[0];
}
/* budget: { value, known }. Not sure → known false; zero or "none" → 0 */
function money(v) { const n = number(v); return n === null ? { value: null, known: false } : { value: Math.max(0, n), known: true }; }

/* ---------------------------------------------------------------- the tags the catalogue speaks in */
/** the plain words for a skill tag: a tag id is an index key, never something a visitor reads */
const SKILL_WORDS = { writing: 'Writing', design: 'Design', numbers: 'Working with numbers', selling: 'Selling', teaching: 'Teaching', technical: 'Building or fixing technical things', practical: 'Practical hands-on work', organising: 'Organising and admin', marketing: 'Marketing', people: 'Working with people', care: 'Care work', making: 'Making things', driving: 'Driving' };
const arrOf = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v]);
/** how many paid pieces of work the chosen first test asks for: the one figure Done when and the measure both read */
const testCountOf = (text) => { const t = String(text ?? '').toLowerCase(); if (/ten|10/.test(t)) return 10; if (/four|4/.test(t)) return 4; if (/three|3/.test(t)) return 3; if (/two|2/.test(t)) return 2; return 1; };
const SKILL_TAGS = [
  ['practical', /\b(practical|hands[- ]on|manual|diy|fixing|repair|handy|garden|clean|decorat|assembl)/],
  ['technical', /\b(cod|software|develop|programm|technical|\bit\b|app\b|web|automation|data|ai\b|no[- ]code)/],
  ['writing', /\b(writ|copy|editing|blog|proofread|content)/],
  ['design', /\b(design|graphic|illustrat|brand|logo|canva|photo)/],
  ['numbers', /\b(number|account|bookkeep|financ|spreadsheet|excel|invoic|tax|budget|payroll)/],
  ['admin', /\b(admin|organis|organiz|diary|inbox|schedul|paperwork|office|assistant|typing|records)/],
  ['selling', /\b(sell|sales|negotiat|pitch|persua|closing)/],
  ['people', /\b(people|listen|host|social|communicat|talk|support|friendly|customer service|community)/],
  ['teaching', /\b(teach|tutor|train|explain|coach|lesson|instruct|mentor)/],
  ['making', /\b(mak|craft|sew|knit|print|candle|art\b|pottery|woodwork|jewel|handmade|product)/],
  ['cooking', /\b(cook|bak|food|chef|cater|meal|kitchen)/],
  ['care', /\b(car(e|ing)|nurs|childcare|elder|wellbeing|massage|yoga|pilates|therap|companion)/],
  ['organising', /\b(organis|organiz|plan|coordinat|event|logistic|project|running things)/],
  ['marketing', /\b(market|social media|ads\b|seo|promot|instagram|tiktok|newsletter)/],
  ['video', /\b(video|film|camera|youtube|podcast|edit(ing)? video|stream)/],
  ['languages', /\b(language|translat|french|spanish|german|italian|arabic|polish|urdu|mandarin|portuguese|esol)/],
  ['driving', /\b(driv|van\b|delivery|courier|licence)/],
  ['fitness', /\b(fitness|gym|personal train|sport|running|exercise)/],
  ['music', /\b(music|guitar|piano|sing|instrument|drum)/],
  ['research', /\b(research|analys|investigat|study)/],
];
const AVOID_TAGS = [
  ['calls', /\b(call|phone|cold)/], ['public', /\b(public|camera|content|video|social media|posting|on ?line presence)/], ['travel', /\b(travel|driv|commut|on the road|going out)/],
  ['technical', /\b(technical|build|cod|software|app)/], ['inventory', /\b(inventory|stock|product|shipping|storage)/], ['managing', /\b(manag|staff|team|employ|people)/],
  ['selling', /\b(sell|sales|pitch)/], ['admin', /\b(admin|paperwork|invoic)/], ['evenings', /\b(evening|weekend|unsocial)/],
];
const BUYER_TAGS = [
  ['households', /\b(household|home ?owner|famil|neighbour|local people|consumer|individual|residents?)/], ['parents', /\b(parent|mum|dad|children|kids|school)/],
  ['students', /\b(student|learner|pupil|graduate)/], ['trades', /\b(trade|plumb|electric|builder|joiner|roofer|contractor|decorator|landscap)/],
  ['small-business', /\b(small business|sole trader|owner|shop|local business|smes?|start-?up|freelanc|self[- ]employed)/], ['professionals', /\b(professional|solicitor|accountant|consultant|agency|clinic|practice)/],
  ['creatives', /\b(creative|artist|musician|designer|photograph|maker)/], ['retail', /\b(retail|shop|cafe|café|restaurant|bar|hospitality|salon)/],
  ['charities', /\b(charit|community group|club|church|non-?profit|volunteer)/], ['older', /\b(older|elder|retired|pension|senior)/],
  ['health', /\b(health|patient|carer|wellbeing|clinic|therapist)/], ['tech', /\b(tech|software|saas|developer|start-?up)/],
  ['property', /\b(landlord|letting|property|tenant|estate)/], ['schools', /\b(school|teacher|nursery|college)/],
];
const tagsOf = (v, table) => { const t = text(v).toLowerCase(); const ids = tokens(v); const out = new Set(); table.forEach(([tag, re]) => { if (re.test(t) || ids.some((x) => re.test(x))) out.add(tag); }); return [...out]; };
const skillsOf = (v) => tagsOf(v, SKILL_TAGS);
const avoidsOf = (v) => tagsOf(v, AVOID_TAGS);
const buyersOf = (v) => tagsOf(v, BUYER_TAGS);

/* ---------------------------------------------------------------- the catalogue */
/* budget: 0 none needed, 1 under about a hundred pounds, 2 more than that (stock, a venue, tools). earn: how soon the first
   money can arrive once the test starts. weeks: to a first test. scope: room to grow (0 small, 1 some, 2 wide). */
const CATALOGUE = [
  { id: 'local-service', name: 'Local hands-on service', family: 'local service', summary: 'A practical job done at people’s homes or premises: cleaning, gardening, small repairs, decorating, dog walking, car valeting.',
    buyers: ['households', 'small-business', 'older', 'property'], buyerWords: 'households and small premises near you', problem: 'a job they keep putting off and would rather pay someone reliable to do',
    offerShape: 'one clearly priced job with a fixed scope', delivery: ['visit', 'travel'], budget: 0, minHours: 4, audience: false,
    skills: ['practical', 'driving', 'organising'], enjoy: ['practical', 'people'], avoidBlocks: ['travel'], earn: 'weeks', weeks: 1, scope: 1, technical: false,
    firstTest: 'Three paid jobs for people within reach, at one fixed price, and a note of how long each took.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: 'Some jobs need insurance or a waste carrier licence; check before offering them.', tie: 'work with my hands, in person', ideaWords: /\b(clean|garden|lawn|handyman|decorat|valet|dog walk|window|pressure wash|removal|ironing)/ },
  { id: 'freelance-skill', name: 'Freelance skill service', family: 'freelance skill service', summary: 'A skill you already use, sold by the piece to businesses that need it: writing, design, bookkeeping, translation, video editing, spreadsheets.',
    buyers: ['small-business', 'professionals', 'creatives', 'charities', 'tech'], buyerWords: 'small businesses that need the skill and have nobody in-house', problem: 'work that sits undone because nobody on their side has the skill or the time',
    offerShape: 'a defined piece of work at a set price', delivery: ['remote', 'either'], budget: 0, minHours: 3, audience: false,
    skills: ['writing', 'design', 'numbers', 'technical', 'video', 'languages', 'marketing', 'research'], enjoy: ['writing', 'design', 'numbers', 'technical', 'video', 'languages'], avoidBlocks: [], earn: 'weeks', weeks: 1, scope: 1, technical: false,
    firstTest: 'Two paid pieces of work at a set price for people who already know what you can do.', assets: ['offer-sheet', 'outreach-message', 'proposal', 'delivery-checklist'],
    permissions: null, tie: 'sell a skill I already have', ideaWords: /\b(freelanc|copywrit|design|translat|bookkeep|video edit|proofread|virtual|spreadsheet)/ },
  { id: 'productised-service', name: 'Fixed package service', family: 'productised service', summary: 'One repeatable package with a fixed scope and price: a website in a week, monthly bookkeeping, a marketing audit, a garden tidy each month.',
    buyers: ['small-business', 'professionals', 'trades', 'retail'], buyerWords: 'businesses that buy the same job again and again', problem: 'a recurring job they want done the same way each time without briefing it from scratch',
    offerShape: 'one package, one price, the same every time', delivery: ['remote', 'either', 'visit'], budget: 0, minHours: 5, audience: false,
    skills: ['numbers', 'admin', 'technical', 'design', 'writing', 'marketing', 'practical'], enjoy: ['organising', 'numbers', 'technical'], avoidBlocks: [], earn: 'weeks', weeks: 2, scope: 2, technical: false,
    firstTest: 'Sell the package to two buyers before building anything around it; deliver both by hand.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: null, tie: 'do the same job well for many people', ideaWords: /\b(package|retainer|monthly|subscription service|done[- ]for[- ]you|audit)/ },
  { id: 'physical-product', name: 'Small physical product', family: 'small physical product', summary: 'Something you make in small batches and sell: baked goods, prints, candles, crafts, kits.',
    buyers: ['households', 'retail', 'creatives'], buyerWords: 'people who buy gifts and small treats, and local shops that stock them', problem: 'a want, not a need: they buy when they see it and like it',
    offerShape: 'a small range, priced per item, sold at a stall, to a shop or by pre-order', delivery: ['shipped', 'visit'], budget: 2, minHours: 5, audience: false,
    skills: ['making', 'cooking', 'design'], enjoy: ['making', 'cooking'], avoidBlocks: ['inventory'], earn: 'months', weeks: 3, scope: 1, technical: false,
    firstTest: 'One stall day or a pre-order to people you know, with a count of items made, sold and left over.', assets: ['offer-sheet', 'listing', 'delivery-checklist'],
    permissions: 'Food sold to the public needs registration with the local council before trading; check the rules for what you make.', tie: 'make things people can hold', ideaWords: /\b(bak|cake|candle|craft|print|jewel|soap|knit|sew|pottery|kit|batch)/, ideaStrong: /\b(candles?|crafts?|jewell?ery|soap|pottery|prints?)\b/ },
  { id: 'digital-product', name: 'Digital product', family: 'digital product', summary: 'A template, guide, preset, printable or course you make once and sell many times.',
    buyers: ['small-business', 'creatives', 'students', 'parents'], buyerWords: 'people who want a shortcut you have already worked out', problem: 'a task they would rather buy a finished answer to than work out themselves',
    offerShape: 'a downloadable file or short course at a low price', delivery: ['remote'], budget: 0, minHours: 4, audience: true,
    skills: ['writing', 'design', 'technical', 'teaching', 'numbers'], enjoy: ['writing', 'design', 'technical'], avoidBlocks: [], earn: 'months', weeks: 3, scope: 2, technical: false,
    firstTest: 'A one-page pre-sale to a list or group you can already reach: ten paid orders before the product is finished.', assets: ['offer-sheet', 'outreach-message', 'listing'],
    permissions: null, tie: 'build something once and sell it many times', ideaWords: /\b(template|ebook|e-book|guide|course|printable|preset|notion|download)/ },
  { id: 'content-audience', name: 'Content and audience', family: 'content and audience', summary: 'A newsletter, channel or feed on one subject that earns later through sponsors, products or services.',
    buyers: ['households', 'small-business', 'creatives', 'tech'], buyerWords: 'readers or viewers with one shared interest, then the businesses that want to reach them', problem: 'they want to follow a subject through one voice they trust',
    offerShape: 'regular free content first; paid products or sponsors once the audience exists', delivery: ['remote'], budget: 0, minHours: 5, audience: false,
    skills: ['writing', 'video', 'marketing', 'teaching'], enjoy: ['writing', 'video', 'marketing'], avoidBlocks: ['public'], earn: 'longer', weeks: 4, scope: 2, technical: false,
    firstTest: 'Four weeks of posting on one subject to one defined group and a count of who came back.', assets: ['outreach-message', 'content-plan'],
    permissions: null, tie: 'talk about one subject in public', ideaWords: /\b(newsletter|youtube|channel|podcast|blog|tiktok|instagram|influenc|audience|substack)/, ideaStrong: /\b(newsletter|youtube|podcast|substack)\b/ },
  { id: 'reselling', name: 'Reselling and marketplaces', family: 'reselling and marketplace', summary: 'Buying goods you know how to judge and selling them on: vintage, parts, books, refurbished kit.',
    buyers: ['households', 'creatives', 'trades'], buyerWords: 'buyers on the marketplaces where that kind of item already sells', problem: 'they want a specific item at a fair price from someone who has checked it',
    offerShape: 'individual items listed at a price, shipped or collected', delivery: ['shipped'], budget: 2, minHours: 4, audience: false,
    skills: ['research', 'numbers', 'practical', 'making'], enjoy: ['research', 'practical'], avoidBlocks: ['inventory'], earn: 'weeks', weeks: 2, scope: 1, technical: false,
    firstTest: 'Ten items bought and sold at a target margin, with the hours and postage counted.', assets: ['listing', 'delivery-checklist'],
    permissions: 'Selling regularly can count as trading for tax; check the current rules.', tie: 'find and sell things I know the value of', ideaWords: /\b(resell|resale|flip|vintage|ebay|vinted|marketplace|refurb|thrift|second-?hand|dropship)/, ideaStrong: /\b(resell|resale|flip|vinted|ebay|dropship)\b/ },
  { id: 'teaching-coaching', name: 'Teaching and coaching', family: 'teaching and coaching', summary: 'Lessons, tutoring or coaching in a subject you know well, one to one or in small groups.',
    buyers: ['parents', 'students', 'households', 'professionals'], buyerWords: 'people, or parents of people, who want to get better at one thing', problem: 'they are stuck on something a patient person could teach them',
    offerShape: 'a paid session, or a short block of sessions, at a set price', delivery: ['either', 'visit', 'remote'], budget: 0, minHours: 3, audience: false,
    skills: ['teaching', 'music', 'languages', 'fitness', 'technical', 'numbers'], enjoy: ['teaching', 'people'], avoidBlocks: [], earn: 'weeks', weeks: 1, scope: 1, technical: false,
    firstTest: 'Three paid sessions with learners you can reach now, and one question at the end of each: would you book again?', assets: ['offer-sheet', 'outreach-message', 'booking-process'],
    permissions: 'Working with children or vulnerable people usually needs a DBS check and sometimes a qualification; check before offering it.', tie: 'help people learn something', ideaWords: /\b(tutor|teach|lesson|coach|class|workshop|mentor|train)/, ideaStrong: /\b(tutor|tutoring|lessons?|coaching)\b/ },
  { id: 'maintenance-repair', name: 'Maintenance and repair', family: 'maintenance and repair', summary: 'Fixing and servicing things people already own: bikes, phones, appliances, clothing, PAT testing, garden machinery.',
    buyers: ['households', 'small-business', 'older'], buyerWords: 'people who would rather repair than replace', problem: 'something broken that they cannot fix and do not want to throw away',
    offerShape: 'a fixed-price repair or service, collected or dropped off', delivery: ['visit', 'either'], budget: 1, minHours: 4, audience: false,
    skills: ['practical', 'technical', 'making'], enjoy: ['practical', 'technical'], avoidBlocks: [], earn: 'weeks', weeks: 2, scope: 1, technical: false,
    firstTest: 'Five repairs at a fixed price, with parts cost and time written down for each.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: 'Electrical and gas work has legal limits on who may do it; check what your qualification covers.', tie: 'fix things', ideaWords: /\b(repair|fix|service|maintenance|bike|phone repair|appliance|mend|alteration|pat test)/ },
  { id: 'events-experiences', name: 'Events and experiences', family: 'events and experiences', summary: 'Something people attend: a workshop, supper club, guided walk, kids’ party, small tournament.',
    buyers: ['households', 'parents', 'creatives', 'small-business'], buyerWords: 'people looking for something to do together', problem: 'they want an occasion organised by someone else',
    offerShape: 'a ticketed event at a set price with a set number of places', delivery: ['visit'], budget: 1, minHours: 5, audience: false,
    skills: ['organising', 'people', 'cooking', 'teaching', 'fitness'], enjoy: ['people', 'organising'], avoidBlocks: ['public', 'managing'], earn: 'weeks', weeks: 3, scope: 1, technical: false,
    firstTest: 'One small event with eight paid places, run at a venue that costs nothing or next to nothing.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: 'A venue’s own licence and insurance decide what may be served or sold there; ask before selling tickets.', tie: 'bring people together in a room', ideaWords: /\b(event|workshop|supper|party|walk|tour|retreat|meetup|class\b|tournament|festival)/ },
  { id: 'b2b-admin-ops', name: 'Admin and operations support for small businesses', family: 'B2B admin and ops support', summary: 'The office work a small business owner does badly at night: invoicing and chasing, inbox and diary, bookings, supplier orders, CRM tidying.',
    buyers: ['trades', 'small-business', 'professionals', 'retail'], buyerWords: 'small business owners who do their own admin after hours', problem: 'unbilled work, unanswered enquiries and paperwork that costs them money and sleep',
    offerShape: 'a fixed weekly block of hours, or one recurring task at a monthly price', delivery: ['remote', 'either'], budget: 0, minHours: 4, audience: false,
    skills: ['admin', 'numbers', 'organising', 'people'], enjoy: ['organising', 'numbers', 'admin'], avoidBlocks: ['admin'], earn: 'weeks', weeks: 1, scope: 2, technical: false,
    firstTest: 'One paid block of ten hours for a business you already know, with a list of what was cleared.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: null, tie: 'keep a business’s paperwork straight', ideaWords: /\b(admin|virtual assistant|\bva\b|bookkeep|invoic|inbox|diary|back ?office|operations)/ },
  { id: 'technical-build', name: 'A small software tool', family: 'technical build or MVP', summary: 'A small piece of software that does one job for one kind of user: a form, a calculator, a tracker, a booking flow.',
    buyers: ['small-business', 'tech', 'professionals', 'trades'], buyerWords: 'people with one repetitive job that a small tool could do', problem: 'a task they do by hand each week that a simple tool could take',
    offerShape: 'a tool built after the job has been done by hand for a few paying users', delivery: ['remote'], budget: 0, minHours: 6, audience: false,
    skills: ['technical'], enjoy: ['technical'], avoidBlocks: ['technical'], earn: 'longer', weeks: 4, scope: 2, technical: true,
    firstTest: 'Do the job by hand for three users who pay for the result before any code is written.', assets: ['outreach-message', 'implementation-brief'],
    permissions: null, tie: 'build something with code', ideaWords: /\b(app|software|platform|saas|tool|website builder|automation|bot|plugin|dashboard|marketplace app)/, ideaStrong: /\b(app|software|saas|platform|bot|plugin|dashboard)\b/ },
  { id: 'care-wellbeing', name: 'Care and wellbeing services', family: 'care and wellbeing service', summary: 'Support for people: companionship and errands for older people, massage, yoga or pilates classes, childcare-adjacent help.',
    buyers: ['older', 'households', 'parents', 'health'], buyerWords: 'people, or their families, who need regular reliable support', problem: 'help they cannot get from family or the system, from someone they trust',
    offerShape: 'a regular booked session at a set rate', delivery: ['visit', 'either'], budget: 1, minHours: 4, audience: false,
    skills: ['care', 'people', 'fitness'], enjoy: ['care', 'people'], avoidBlocks: ['travel'], earn: 'weeks', weeks: 2, scope: 1, technical: false,
    firstTest: 'Three paid sessions with people you can reach through someone who trusts you, after checking what the work legally requires.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: 'Personal care, childcare and some therapies are regulated; a DBS check, insurance or a qualification may be required before the first session.', tie: 'look after people', ideaWords: /\b(care|companion|elderly|massage|yoga|pilates|childmind|nanny|wellbeing|therap|doula)/, ideaStrong: /\b(massage|yoga|pilates|childmind|nanny|doula|elderly)\b/ },
  { id: 'community-subscription', name: 'Community or membership', family: 'community and subscription', summary: 'A paid group with a shared aim: a club, a membership, a monthly circle, run online or in person.',
    buyers: ['households', 'creatives', 'professionals', 'students'], buyerWords: 'people already gathered around one interest who want structure and company', problem: 'they want to keep at something with others and a person who organises it',
    offerShape: 'a low monthly price for a regular session and a shared space', delivery: ['either', 'remote', 'visit'], budget: 0, minHours: 4, audience: true,
    skills: ['organising', 'people', 'teaching', 'marketing'], enjoy: ['people', 'organising'], avoidBlocks: ['public', 'managing'], earn: 'months', weeks: 4, scope: 2, technical: false,
    firstTest: 'Ten founding members at a low monthly price, drawn from a group you already belong to.', assets: ['offer-sheet', 'outreach-message', 'booking-process'],
    permissions: null, tie: 'run a group people belong to', ideaWords: /\b(community|membership|club|circle|group|network|mastermind|subscription)/, ideaStrong: /\b(membership|community|mastermind)\b/ },
  { id: 'local-food', name: 'Food and drink', family: 'small physical product (food)', summary: 'Meals, bakes or drinks made to order: meal prep, cakes, a market stall, a pop-up.',
    buyers: ['households', 'parents', 'retail', 'small-business'], buyerWords: 'people who want good food made by someone local, and offices or cafés that order it', problem: 'they want something better than the supermarket and have no time to make it',
    offerShape: 'a short menu at set prices, pre-ordered or sold at a stall', delivery: ['visit', 'shipped'], budget: 2, minHours: 6, audience: false,
    skills: ['cooking', 'making', 'organising'], enjoy: ['cooking'], avoidBlocks: ['inventory'], earn: 'weeks', weeks: 3, scope: 1, technical: false,
    firstTest: 'One pre-order round to people you know, with the ingredient cost, the hours and the sales written down.', assets: ['offer-sheet', 'outreach-message', 'booking-process', 'delivery-checklist'],
    permissions: 'A food business must register with the local council before it starts trading, and needs a hygiene rating visit; check the current rules for what you make.', tie: 'cook for people', ideaWords: /\b(food|meal|cake|bak|catering|coffee|drink|stall|pop-?up|kitchen|jam|sauce)/, ideaStrong: /\b(bakery|cakes?|meal prep|catering|food)\b/ },
];
const BY_ID = Object.fromEntries(CATALOGUE.map((a) => [a.id, a]));
const CATALOGUE_FAMILIES = [...new Set(CATALOGUE.map((a) => a.family))];

/* ---------------------------------------------------------------- the person, read once */
const URGENT = /\b(soon|now|immediate|this month|weeks|urgent|asap|straight away|next month)\b/;
const LONGER = /\b(longer|develop|no rush|year|patient|later|slowly)\b/;
function person(s) {
  const p = {};
  p.hours = number(raw(s, 'hoursWeek'));
  p.hoursKnown = p.hours !== null;
  const b = money(raw(s, 'testBudget'));
  p.budget = b.value; p.budgetKnown = b.known;
  const m = money(raw(s, 'monthly'));
  p.monthly = m.value; p.monthlyKnown = m.known;
  const u = text(raw(s, 'urgency')).toLowerCase();
  p.urgency = !u ? null : URGENT.test(u) ? 'soon' : LONGER.test(u) ? 'longer' : 'months';
  p.skills = skillsOf(raw(s, 'skills'));
  p.proven = skillsOf(raw(s, 'proven'));
  p.provenWords = text(raw(s, 'proven'));
  p.askedFor = skillsOf(raw(s, 'askedFor'));
  p.askedWords = text(raw(s, 'askedFor'));
  p.enjoy = skillsOf(raw(s, 'enjoy'));
  p.avoid = avoidsOf(raw(s, 'avoid'));
  p.learn = skillsOf(raw(s, 'learn'));
  p.tools = tokens(raw(s, 'tools')).filter((t) => t && !/^(none|nothing|no)$/.test(t));
  p.qualifications = text(raw(s, 'qualifications'));
  const loc = text(raw(s, 'locality')).toLowerCase();
  p.locality = /remote|online|from home|laptop/.test(loc) && !/either|both|local/.test(loc) ? 'remote' : /local|in person|face/.test(loc) && !/either|both|remote/.test(loc) ? 'local' : loc ? 'either' : null;
  p.groups = buyersOf(raw(s, 'groups'));
  p.groupWords = text(raw(s, 'groups'));
  p.problems = text(raw(s, 'problems'));
  p.problemBuyers = buyersOf(raw(s, 'problems'));
  const acc = text(raw(s, 'access')).toLowerCase();
  p.access = !acc ? null : /yes|direct|this week|can\b/.test(acc) && !/find|through|someone|no\b/.test(acc) ? 'direct' : /through|someone|introduc|via/.test(acc) ? 'via' : /find|no\b|none|search/.test(acc) ? 'find' : 'direct';
  const aud = raw(s, 'audience');
  const audN = number(aud);
  p.audience = aud === null ? null : /none|no\b|nothing/.test(text(aud).toLowerCase()) || audN === 0 ? 'none' : (audN !== null && audN >= 200) || /engaged|active|regular/.test(text(aud).toLowerCase()) ? 'engaged' : 'small';
  p.helpers = tokens(raw(s, 'helpers')).filter((t) => !/^(none|nobody|no one|not yet)$/.test(t));
  p.helperStatus = text(raw(s, 'helperStatus')).toLowerCase();
  p.idea = text(raw(s, 'idea'));
  p.ideaWanted = !!p.idea && !/^(no|none|not yet|nothing)\b/i.test(p.idea.trim());
  p.tried = text(raw(s, 'tried'));
  p.triedResult = /sold|worked|customers|paid/.test(p.tried.toLowerCase()) ? 'sold' : /fail|nothing|no ?one|didn|flop/.test(p.tried.toLowerCase()) ? 'failed' : p.tried ? 'some' : null;
  p.chosen = text(raw(s, 'direction'));
  p.putsOff = text(raw(s, 'putsOff')).toLowerCase();
  p.alone = text(raw(s, 'alone')).toLowerCase();
  p.support = tokens(raw(s, 'support'));
  p.firstBuyer = text(raw(s, 'firstBuyer'));
  p.firstResult = text(raw(s, 'firstResult'));
  p.demandEvidence = text(raw(s, 'demandEvidence')).toLowerCase();
  p.testMethod = text(raw(s, 'testMethod')).toLowerCase();
  p.canDeliver = text(raw(s, 'canDeliver')).toLowerCase();
  p.firstDelivery = text(raw(s, 'firstDelivery'));
  p.testPrice = number(raw(s, 'testPrice'));
  p.reachHow = text(raw(s, 'reachHow')).toLowerCase();
  p.continueIf = text(raw(s, 'continueIf'));
  p.stopIf = text(raw(s, 'stopIf'));
  p.permissions = text(raw(s, 'permissions'));
  p.createFirst = text(raw(s, 'createFirst')).toLowerCase();
  p.activity = text(raw(s, 'activity'));
  p.outcome = text(raw(s, 'outcome'));
  p.constraints = text(raw(s, 'constraints'));
  /* Task 14: the three figures an earnings scenario needs behind it, each the person's own, none inferred.
     Hours per delivery is read only when the answer actually says hours: "a laptop" is not a duration. */
  p.deliveryHours = hoursIn(raw(s, 'deliveryHours')) ?? hoursIn(raw(s, 'firstDelivery')) ?? hoursIn(raw(s, 'canDeliver'));
  p.currentIncome = number(raw(s, 'currentIncome'));
  p.currentIncomeHours = number(raw(s, 'currentIncomeHours'));
  p.targetMonthly = number(raw(s, 'targetMonthly'));
  readStart(s, p);
  p.answered = Object.keys(FIELDS).filter((k) => answered(s, k));
  return p;
}

/* ---------------------------------------------------------------- D9 and D10: where the person is starting from

   `none` asks nothing new (the strengths, the repeated frustrations and the reachable group are first-pass answers);
   `one` clarifies the buyer, the need and the evidence; `few` collects the ideas and picks one by who has asked or paid
   and what can be delivered this month; `tried` establishes what was offered, to whom, through what, and what happened,
   and tells no exposure from no demand. Every id is read through FIELDS, so a saved state that still carries n25 and
   n26 lands in the same place. */
const startPointOf = (v) => {
  const t = text(v).toLowerCase().trim();
  if (!t) return null;
  if (/none|no idea|not yet|nothing|^no\b/.test(t)) return 'none';
  if (/tried|already|before/.test(t)) return 'tried';
  if (/few|several|some|more than one|two|three/.test(t)) return 'few';
  if (/\bone\b|single|an idea|^yes/.test(t)) return 'one';
  return null;
};
/** the idea a card answer points at: the line itself, its number, an "idea2" id, or a fragment of it; none → null */
function pickIdea(v, ideas) {
  if (v === null || v === undefined || !ideas.length) return null;
  if (typeof v === 'number') return ideas[v - 1] ?? ideas[v] ?? null;
  const t = text(v).trim();
  if (!t || /^(none|neither|no)\b/i.test(t)) return null;
  const exact = ideas.find((x) => x.toLowerCase() === t.toLowerCase());
  if (exact) return exact;
  const m = t.match(/^(?:idea|i|option|s06)?[-_ ]?(\d)$/i);
  if (m) { const i = Number(m[1]); return ideas[i - 1] ?? ideas[i] ?? null; }
  return ideas.find((x) => x.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(x.toLowerCase())) ?? t;
}
/* no-replies with fewer than this many people seeing the offer is read as no exposure rather than no demand. It is a
   planning threshold for reading the person's own count, never shown as a figure and never a benchmark */
const EXPOSURE_FLOOR = 50;
function readStart(s, p) {
  p.startPoint = startPointOf(raw(s, 'startPoint'));
  /* one idea: the buyer and the need are the idea when n25 never carried its words */
  p.payer = text(raw(s, 'payer'));
  p.need = text(raw(s, 'need'));
  p.todayDo = text(raw(s, 'todayDo'));
  const ap = text(raw(s, 'askedPaid')).toLowerCase();
  p.askedPaid = !ap ? null : /more than once|repeat|several|again/.test(ap) ? 'paid-repeat' : /paid/.test(ap) ? 'paid-once' : /asked/.test(ap) ? 'asked' : /nobody|no one|none|^no\b/.test(ap) ? 'nobody' : null;
  const dn = text(raw(s, 'deliverNow')).toLowerCase();
  p.deliverNow = !dn ? null : /help/.test(dn) ? 'with help' : /not yet|^no\b|later/.test(dn) ? 'not yet' : /^yes|now|could/.test(dn) ? 'yes' : null;
  /* a few ideas: the lines, then the one that has someone who asked or paid and can be delivered this month */
  const rawIdeas = raw(s, 'ideas');
  p.ideas = (Array.isArray(rawIdeas) ? rawIdeas.map(text) : rawIdeas instanceof Set ? [...rawIdeas].map(text) : String(text(rawIdeas)).split(/\n|;/)).map((x) => x.trim()).filter(Boolean).slice(0, 3);
  p.ideaAsked = pickIdea(raw(s, 'ideaAsked'), p.ideas);
  p.ideaDeliverable = pickIdea(raw(s, 'ideaDeliverable'), p.ideas);
  p.tieIdea = pickIdea(raw(s, 'tieIdea'), p.ideas);
  p.chosenIdea = p.tieIdea ?? (p.ideaAsked && p.ideaAsked === p.ideaDeliverable ? p.ideaAsked : null) ?? p.ideaDeliverable ?? p.ideaAsked ?? p.ideas[0] ?? null;
  /* a previous attempt: what, to whom, through what, what happened, how many, at what price */
  p.triedWhat = text(raw(s, 'triedWhat'));
  p.triedChannel = text(raw(s, 'triedChannel')).toLowerCase();
  const to = text(raw(s, 'triedOutcome')).toLowerCase();
  p.triedOutcome = !to ? null : /stopped|dried|then it|tailed/.test(to) ? 'sales-stopped' : /few sale|some sale|a few|sold/.test(to) ? 'few-sales' : /no sale|repl.*no|interest|but no/.test(to) ? 'replies-no-sales' : /no repl|nothing|silence|none/.test(to) ? 'no-replies' : null;
  const tn = raw(s, 'triedNumbers');
  const pickN = (keys, i) => { if (tn === null || tn === undefined) return null; if (Array.isArray(tn)) return number(tn[i]); if (typeof tn === 'object') { const k = Object.keys(tn).find((x) => keys.test(x)); return k ? number(tn[k]) : null; } return i === 0 ? number(tn) : null; };
  p.triedNumbers = { saw: pickN(/saw|seen|reach|view/i, 0), replied: pickN(/repl|respon|answer/i, 1), bought: pickN(/bought|buy|sale|paid|purchas/i, 2) };
  p.triedPrice = number(raw(s, 'triedPrice'));
  if (p.startPoint === 'tried' || p.triedWhat) {
    const n = p.triedNumbers;
    const noSales = p.triedOutcome === 'no-replies' || p.triedOutcome === 'replies-no-sales' || (n.bought !== null && n.bought === 0);
    p.triedVerdict = p.triedOutcome === 'sales-stopped' ? 'demand shown, channel dried up'
      : p.triedOutcome === 'few-sales' || (n.bought !== null && n.bought > 0) ? 'some demand shown'
      : p.triedOutcome === 'replies-no-sales' || (noSales && n.replied !== null && n.replied > 0) ? 'no demand at that offer and price'
      : noSales && (n.saw === null || n.saw < EXPOSURE_FLOOR) ? 'no exposure'
      : noSales ? 'no demand through that channel' : null;
    p.triedChanges = {
      'no exposure': `Too few people saw it to call it no demand${n.saw !== null ? ` (${n.saw} saw it)` : ' (nobody counted)'}. What changes: the same offer goes in front of a counted group of the first buyers, and the count is kept.`,
      'no demand at that offer and price': `People replied and nobody paid, so the offer or the price is what changes, not the channel. What changes: three conversations set the price before the offer goes out again.`,
      'no demand through that channel': `Enough people saw it and nobody replied. What changes: the buyer and the channel, not the offer alone; the first buyers are people who can be spoken to directly.`,
      'some demand shown': `Someone paid, so demand exists. What changes: more of the same buyers are reached through the channel that worked, and the price is set from what they paid.`,
      'demand shown, channel dried up': `Sales came and stopped, so the demand is real and the channel ran out. What changes: the channel, not the offer; the first step finds where the next buyers already are.`,
    }[p.triedVerdict] ?? null;
    p.triedRepeatsChannel = !!(p.triedChannel && p.triedVerdict && /no exposure|some demand/.test(p.triedVerdict));
  } else { p.triedVerdict = null; p.triedChanges = null; p.triedRepeatsChannel = false; }
  /* the derived idea: one idea from the buyer and the need, a few from the chosen line, tried from what was offered */
  if (p.startPoint === 'none') { p.ideaWanted = false; }
  else if (!p.ideaWanted) {
    const derived = p.startPoint === 'one' && (p.need || p.payer) ? [p.need, p.payer ? `for ${p.payer}` : ''].filter(Boolean).join(' ')
      : p.startPoint === 'few' ? p.chosenIdea
      : p.startPoint === 'tried' ? p.triedWhat : null;
    if (derived) { p.idea = derived; p.ideaWanted = true; }
  }
  if (p.startPoint === 'tried' && p.triedWhat && !p.tried) { p.tried = p.triedWhat; p.triedResult = /some demand|dried up/.test(p.triedVerdict ?? '') ? 'sold' : p.triedVerdict ? 'failed' : null; }
  /* the evidence and delivery answers of the branch feed the concepts the plan already reads */
  if (!p.demandEvidence) p.demandEvidence = p.askedPaid === 'paid-repeat' || p.askedPaid === 'paid-once' ? 'paid' : p.askedPaid === 'asked' ? 'asked' : p.startPoint === 'few' && p.ideaAsked && p.chosenIdea === p.ideaAsked ? 'asked' : /some demand|dried up/.test(p.triedVerdict ?? '') ? 'paid' : p.askedPaid === 'nobody' ? 'nobody yet' : '';
  if (!p.canDeliver) p.canDeliver = p.deliverNow === 'yes' || (p.startPoint === 'few' && p.ideaDeliverable && p.chosenIdea === p.ideaDeliverable) ? 'yes' : p.deliverNow === 'with help' ? 'gap: needs help to deliver a small version' : p.deliverNow === 'not yet' ? 'gap: cannot deliver a small version yet' : '';
  if (!p.firstBuyer && p.payer) p.firstBuyer = p.payer;
  /* access: the person said they would have to find the first buyers, and nothing else reaches them */
  p.noAccess = p.access === 'find' && !p.helpers.length && (p.audience === null || p.audience === 'none');
}
/** a duration in hours, only from an answer that names hours: "about 5 hours a session" → 5, "a laptop" → null */
function hoursIn(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null;
  const t = String(text(v)).toLowerCase();
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/) ?? t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (!m) return null;
  const n = m[2] ? (Number(m[1]) + Number(m[2])) / 2 : Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* ---------------------------------------------------------------- an idea of their own, judged by the same rules */
function matchIdea(t) {
  const s = String(t ?? '').toLowerCase();
  if (!s.trim()) return null;
  let best = null, bestN = 0;
  CATALOGUE.forEach((a) => { const n = (s.match(new RegExp(a.ideaWords.source, 'gi')) ?? []).length + (a.ideaStrong && a.ideaStrong.test(s) ? 2 : 0); if (n > bestN) { best = a; bestN = n; } });
  return best;
}

/* ---------------------------------------------------------------- exclusions, then the comparison */
const LEVEL = (x) => (x >= 1.5 ? 'strong' : x >= 0.5 ? 'some' : 'weak');
const list = (xs) => { const a = xs.filter(Boolean); return a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; };

/** why an archetype is out for this person, or null. Budget, hours, an essential skill, location, an avoided delivery mode,
    and income needed sooner than the direction can earn (brief 9.5) */
function exclusion(a, p) {
  if (p.budgetKnown && a.budget === 2 && p.budget < 100) return `needs stock or materials before the first sale and your test budget is ${p.budget === 0 ? 'nothing' : 'under a hundred pounds'}`;
  if (p.budgetKnown && a.budget === 1 && p.budget === 0 && !p.tools.length) return 'needs a few tools or a small float and you said nothing can be spent';
  if (p.hoursKnown && p.hours < a.minHours) return `needs about ${a.minHours} hours a week to test and you have ${p.hours}`;
  const known = new Set([...p.skills, ...p.proven, ...p.learn]);
  if (a.skills.length && !a.skills.some((k) => known.has(k))) return `needs ${list(a.skills.slice(0, 3))} and none of those is among the skills you named or would learn`;
  const blocked = a.avoidBlocks.find((t) => p.avoid.includes(t));
  if (blocked) return `is built on ${{ travel: 'travelling to people', public: 'public content', technical: 'a technical build', inventory: 'holding stock', managing: 'managing people', admin: 'paperwork', calls: 'calls', selling: 'selling' }[blocked] ?? blocked}, which you said you would rather avoid`;
  if (p.locality === 'remote' && !a.delivery.some((d) => d === 'remote' || d === 'either' || d === 'shipped')) return 'is delivered in person and you said you would work remotely';
  if (p.urgency === 'soon' && a.earn === 'longer') return 'takes months before it earns and you need income soon';
  if (a.audience && p.audience === 'none' && p.access === 'find') return 'needs an audience or a group to sell into and you have neither yet';
  return null;
}

/** the qualitative comparison, one line per dimension, and a total that orders the survivors. The total is never shown */
function compare(a, p) {
  const d = {};
  const provenHit = a.skills.filter((k) => p.proven.includes(k));
  const skillHit = a.skills.filter((k) => p.skills.includes(k));
  const learnHit = a.skills.filter((k) => p.learn.includes(k));
  d.strengths = provenHit.length ? { level: 'strong', why: `you have used ${list(provenHit)} to get a result` } : skillHit.length ? { level: 'some', why: `you named ${list(skillHit)} among your skills, without a result yet` } : learnHit.length ? { level: 'weak', why: `it rests on ${list(learnHit)}, which you would still have to learn` } : { level: 'weak', why: 'none of the skills it needs is one you named' };
  const groupHit = a.buyers.filter((b) => p.groups.includes(b) || p.problemBuyers.includes(b));
  let access = groupHit.length ? 1 : 0;
  if (p.access === 'direct') access += 1; else if (p.access === 'via') access += 0.5;
  if (a.audience && p.audience === 'engaged') access += 1;
  d.access = { level: LEVEL(access), why: groupHit.length ? `you understand ${p.groupWords ? p.groupWords.toLowerCase() : list(groupHit)}${p.access === 'direct' ? ' and can speak to some this week' : p.access === 'via' ? ' and can reach them through someone' : ''}` : p.access === 'direct' ? 'you can speak to buyers this week, though not the group this direction sells to' : 'no route to its buyers yet' };
  let ev = 0;
  const askHit = a.skills.filter((k) => p.askedFor.includes(k));
  if (askHit.length) ev += 1;
  if (p.problems && a.buyers.some((b) => p.problemBuyers.includes(b))) ev += 1;
  if (/request|asked|spending|pay|paid|customers/.test(p.demandEvidence)) ev += 1;
  if (p.triedResult === 'sold' && matchIdea(p.tried)?.id === a.id) ev += 1;
  d.evidence = { level: LEVEL(Math.min(ev, 2)), why: askHit.length ? `people already ask you for help with ${p.askedWords ? p.askedWords.toLowerCase() : list(askHit)}` : ev ? 'you have seen the problem first hand' : 'nobody has asked for this yet; demand is untested' };
  const speed = a.weeks <= 2 ? 2 : a.weeks <= 4 ? 1 : 0;
  d.speed = { level: LEVEL(speed), why: `a first test in about ${a.weeks === 1 ? 'a week' : `${a.weeks} weeks`}` };
  const cost = a.budget === 0 ? 2 : a.budget === 1 ? 1 : 0;
  d.cost = { level: LEVEL(cost), why: a.budget === 0 ? 'nothing to buy before the first sale' : a.budget === 1 ? 'a few tools or a small float' : 'stock or materials before the first sale' };
  const enjoyHit = a.enjoy.filter((k) => p.enjoy.includes(k));
  const avoidSoft = a.avoidBlocks.length ? 0 : 0;
  d.enjoyment = { level: enjoyHit.length >= 2 ? 'strong' : enjoyHit.length ? 'some' : 'weak', why: enjoyHit.length ? `you said you enjoy ${list(enjoyHit)} enough to repeat it` : 'nothing you said you enjoy sits at its centre' };
  d.scope = { level: LEVEL(a.scope), why: a.scope === 2 ? 'room to grow into a package or a team' : a.scope === 1 ? 'grows with your hours' : 'stays small' };
  const w = { strengths: 2, access: 2, evidence: 1.5, speed: p.urgency === 'soon' ? 2 : 1, cost: p.budgetKnown && p.budget === 0 ? 1.5 : 1, enjoyment: 1, scope: 0.5 };
  const n = { strengths: provenHit.length ? 2 : skillHit.length ? 1 : learnHit.length ? 0.25 : 0, access: Math.min(access, 2), evidence: Math.min(ev, 2), speed, cost, enjoyment: Math.min(enjoyHit.length, 2), scope: a.scope };
  const total = Object.keys(w).reduce((t, k) => t + w[k] * n[k], 0) - avoidSoft;
  return { dims: d, total };
}

/* ---------------------------------------------------------------- Task 12: the ranked qualitative label

   Three words, in order, and nothing else. No percentage fit, no comparison index, no probability of profit (D14).
   The label is a reading of the same dimensions the comparison shows, so a reviewer can trace it. */
const LABELS = ['Needs exploration', 'Promising', 'Strong fit'];
function labelRank(cmp) {
  const d = cmp.dims;
  const strength = d.strengths.level, access = d.access.level, ev = d.evidence.level;
  if (strength === 'strong' && access !== 'weak' && ev !== 'weak') return 2;
  if (strength !== 'weak' && access !== 'weak') return 1;
  if (strength === 'strong' || (access === 'strong' && ev !== 'weak')) return 1;
  return 0;
}
/** one short sentence for the compact card: the strongest grounded reason, never praise */
function fitReason(cmp, a) {
  const d = cmp.dims;
  const pick = ['strengths', 'access', 'evidence', 'enjoyment'].find((k) => d[k].level === 'strong') ?? ['strengths', 'access', 'evidence', 'enjoyment'].find((k) => d[k].level === 'some');
  const why = pick ? d[pick].why : null;
  return why ? `${why.charAt(0).toUpperCase()}${why.slice(1)}.` : `It clears your constraints; the first test costs ${a.budget === 0 ? 'nothing' : 'little'} and takes about ${a.weeks === 1 ? 'a week' : `${a.weeks} weeks`}.`;
}
/* the strongest reason against a direction, and the one fact that would move it up or down the ranking */
const DIM_ORDER = ['strengths', 'access', 'evidence', 'cost', 'speed', 'enjoyment', 'scope'];
const AGAINST = {
  strengths: (a) => ({ against: 'Nothing you have named shows you can already deliver it well enough to be paid twice.', wouldChange: `One piece of ${a.name.toLowerCase()} work you have finished for someone, and what they said about it.` }),
  access: (a) => ({ against: `You have no route to ${a.buyerWords} yet, and a direction with no buyer in reach is a hobby until one appears.`, wouldChange: `One named person who is one of ${a.buyerWords}, or who can introduce you to one.` }),
  evidence: (a) => ({ against: 'Nobody has asked you for this. Demand for it is an assumption, not a finding.', wouldChange: `What three of ${a.buyerWords} last paid for the same result, and what it cost them.` }),
  cost: (a) => ({ against: 'It needs money out before any comes in, which is the wrong order when the budget is small.', wouldChange: 'A supplier or a borrowed setup that gets the first batch made without buying it outright.' }),
  speed: (a) => ({ against: `It takes about ${a.weeks} weeks before there is anything to learn from.`, wouldChange: 'A smaller first version that produces a paying customer inside two weeks.' }),
  enjoyment: (a) => ({ against: 'Nothing you said you enjoy sits at its centre, and a direction you do not enjoy stops when it gets dull.', wouldChange: 'Trying one session of it and finding you would do it again on a Saturday.' }),
  scope: (a) => ({ against: 'It stays the size of your own hours; it does not grow past them.', wouldChange: 'A version of the same offer that can be repeated without you present for every hour of it.' }),
};
function againstOf(cmp, a) {
  const d = cmp.dims;
  const weakest = DIM_ORDER.find((k) => d[k]?.level === 'weak') ?? DIM_ORDER.find((k) => d[k]?.level === 'some') ?? 'evidence';
  const out = (AGAINST[weakest] ?? AGAINST.evidence)(a);
  return { dimension: weakest, ...out };
}
/** the route to customers, from what the person said they could actually do (Task 12: an idea includes its route) */
const ROUTE_WORDS = {
  direct: 'the people you said you could speak to this week',
  via: 'introductions from the person who can reach them for you',
  find: 'local outreach: one message to a group they already belong to',
};
function routeFor(p) {
  const r = p.reachHow ?? '';
  return /warm|contact|know|friend|famil/.test(r) ? 'warm contacts: the people you already know who fit, or who know someone who does'
    : /introduc/.test(r) ? 'introductions: one named person asked for one introduction each'
    : /local|community|group|club/.test(r) ? 'one local group or community they already belong to'
    : /direct|outreach|message|email|call/.test(r) ? 'direct outreach: one short message to twenty people who fit, sent by hand'
    : ROUTE_WORDS[p.access] ?? 'the first three people you can name who fit the buyer';
}
/** why money changes hands in this model. A mechanism, not an earnings claim about anybody (Task 14) */
const mechanismOf = (a, route) => `${a.buyerWords.charAt(0).toUpperCase()}${a.buyerWords.slice(1)} pay because ${a.problem}. What they buy is ${a.offerShape}, reached through ${route}. Nothing arrives until one of them has bought once.`;

/** one direction card: person, buyer, problem, deliverable and route, with the comparison and the case against it */
function card(a, p, cmp, extra) {
  const unknown = cmp.dims.evidence.level === 'weak' ? `whether ${a.buyerWords} will pay for it: nobody has asked you yet` : cmp.dims.access.level === 'weak' ? `whether you can reach ${a.buyerWords} at all` : cmp.dims.strengths.level !== 'strong' ? 'whether you can deliver it well enough to be paid twice' : `what ${a.buyerWords} will pay for the first version`;
  const fit = [cmp.dims.strengths.level !== 'weak' ? cmp.dims.strengths.why : '', cmp.dims.access.level !== 'weak' ? cmp.dims.access.why : '', cmp.dims.enjoyment.level !== 'weak' ? cmp.dims.enjoyment.why : ''].filter(Boolean);
  const route = routeFor(p);
  const rank = labelRank(cmp);
  return {
    id: a.id, name: a.name, family: a.family, summary: a.summary,
    buyer: a.buyerWords, problem: a.problem, offer: a.offerShape, route,
    /* the whole idea in one line: person, buyer, problem, deliverable, route. An industry label is not an idea */
    niche: `${a.offerShape.charAt(0).toUpperCase()}${a.offerShape.slice(1)} for ${a.buyerWords}, whose problem is ${a.problem}, reached through ${route}.`,
    mechanism: mechanismOf(a, route),
    fit: fit.length ? `${fit.join('; ')}.` : 'It clears your constraints; nothing you said points to it strongly.',
    fitReason: fitReason(cmp, a), label: LABELS[rank], labelRank: rank,
    ...againstOf(cmp, a),
    unknown, firstTest: a.firstTest, weeks: a.weeks, earn: a.earn, budgetNeed: a.budget, technical: a.technical, permissions: a.permissions,
    delivery: a.delivery, comparison: cmp.dims, assets: a.assets, ...(extra ?? {}),
  };
}

/** the directions for this person: { recommended, alternatives[], excluded[{ id, why }], tieBreaker?, discovery? } */
function directions(state) {
  const s = state ?? M.state ?? {};
  const p = person(s);
  const excluded = [];
  const survivors = [];
  CATALOGUE.forEach((a) => {
    const why = exclusion(a, p);
    if (why) excluded.push({ id: a.id, name: a.name, why: `${a.name} ${why}.` });
    else survivors.push({ a, cmp: compare(a, p) });
  });
  survivors.sort((x, y) => y.cmp.total - x.cmp.total || x.a.weeks - y.a.weeks);

  /* their own idea: mapped to the catalogue, judged by the same rules, and kept in view whatever the verdict */
  let own = null;
  if (p.ideaWanted) {
    const a = matchIdea(p.idea);
    if (a) {
      const why = exclusion(a, p);
      const cmp = compare(a, p);
      own = { a, cmp, why, name: `Your idea: ${p.idea.length > 60 ? `${p.idea.slice(0, 57)}…` : p.idea}` };
      if (why && a.technical) {
        // narrowed: the same buyer and promise, delivered by hand first; the build waits for paying users
        const manual = BY_ID['productised-service'];
        if (!exclusion(manual, p)) own.narrowed = { a: manual, cmp: compare(manual, p), why: `Your idea ${why}. The same promise can be sold and delivered by hand first; the tool is built once three users have paid for the result.` };
      }
    } else own = { a: null, cmp: null, why: 'Mercer could not place the idea in its catalogue; it is compared below on what you said about it.', name: `Your idea: ${p.idea.slice(0, 60)}` };
  }

  const cards = survivors.map((x) => card(x.a, p, x.cmp));
  const top = survivors[0] ?? null;
  const floor = top ? top.cmp.total * 0.4 : 0;
  let recommended = cards[0] ?? null;
  let alternatives = cards.slice(1).filter((c, i) => survivors[i + 1].cmp.total >= floor).slice(0, 2);

  if (own) {
    if (own.a && !own.why) {
      const ownCard = card(own.a, p, own.cmp, { own: true, name: own.name, ideaText: p.idea });
      const ownTotal = own.cmp.total;
      /* D9: a person who came with one idea, or chose one of a few, is planned for that idea once it clears the
         constraints; the catalogue direction that fits better stays beside it with the comparison in its verdict */
      const theirs = p.startPoint === 'one' || p.startPoint === 'few';
      if (!top || ownTotal >= top.cmp.total - 1 || theirs) {
        // it holds up: it leads, and the strongest catalogue direction that is not the same archetype stands beside it
        const better = top && ownTotal < top.cmp.total - 1 ? top : null;
        recommended = { ...ownCard, verdict: better ? `Your idea clears your constraints. ${better.a.name} fits what you have used and can reach better (${better.cmp.dims.strengths.why}; ${better.cmp.dims.access.why}), and stands beside it as the alternative.` : 'Your idea holds up against the catalogue on what you have told Mercer. Demand still needs testing.' };
        alternatives = cards.filter((c) => c.id !== own.a.id).slice(0, 2);
      } else {
        const better = top.a;
        recommended = { ...cards[0], verdict: `Your idea (${own.a.name.toLowerCase()}) clears your constraints, but ${better.name.toLowerCase()} fits what you have used and can reach better: ${top.cmp.dims.strengths.why}; ${top.cmp.dims.access.why}.` };
        alternatives = [{ ...ownCard, verdict: `Narrow it: start with ${own.a.buyerWords} you can already reach, and the first test above.` }, ...cards.slice(1).filter((c) => c.id !== own.a.id).slice(0, 1)];
      }
    } else if (own.a && own.why) {
      excluded.unshift({ id: `own:${own.a.id}`, name: own.name, why: `Your idea ${own.why}.`, own: true });
      if (own.narrowed) {
        recommended = { ...card(own.narrowed.a, p, own.narrowed.cmp, { narrowedFrom: own.a.id, name: `${own.narrowed.a.name}, narrowed from your idea` }), verdict: own.narrowed.why };
        alternatives = cards.filter((c) => c.id !== own.narrowed.a.id).slice(0, 2);
      } else if (recommended) recommended = { ...recommended, verdict: `Your idea ${own.why}. This direction clears those constraints and uses what you have.` };
    }
  }
  if (p.chosen) {
    // a direction the person picked on the N27 cards is the one the plan is built for; the others are its alternatives
    const pickId = BY_ID[p.chosen] ? p.chosen : (matchIdea(p.chosen)?.id ?? null);
    const all = [recommended, ...alternatives].filter(Boolean);
    const pick = all.find((c) => c.id === pickId) ?? (pickId && !excluded.some((e) => e.id === pickId) ? card(BY_ID[pickId], p, compare(BY_ID[pickId], p), { chosen: true }) : null);
    if (pick) { alternatives = all.filter((c) => c !== pick && c.id !== pick.id).slice(0, 2); recommended = { ...pick, chosen: true }; }
  }

  let tieBreaker;
  if (!p.chosen && top && survivors[1] && Math.abs(top.cmp.total - survivors[1].cmp.total) <= 1 && recommended && alternatives[0] && recommended.id === top.a.id) {
    const a = top.a, b = survivors[1].a;
    tieBreaker = { id: 'starter-tie', question: 'Two directions are close. Which would you rather do first?', options: [{ id: a.id, label: `${a.tie.charAt(0).toUpperCase()}${a.tie.slice(1)}` }, { id: b.id, label: `${b.tie.charAt(0).toUpperCase()}${b.tie.slice(1)}` }] };
  }
  const out = { recommended, alternatives, excluded, person: p, answered: p.answered.length };
  if (tieBreaker) out.tieBreaker = tieBreaker;
  if (!recommended) {
    out.discovery = {
      why: excluded.length ? 'No direction in the catalogue clears all of your constraints together.' : 'Too little is known yet to compare directions.',
      step: p.hoursKnown && p.hours < 3 ? 'Find two more hours a week first: no direction can be tested in less.' : p.budgetKnown && p.budget === 0 && !p.skills.length ? 'Spend two weeks on one free skill you would enjoy using for others, and ask three people what they would pay someone to do.' : 'Ask five people you know what they last paid someone to do for them, and what it cost. Bring the answers back here.',
    };
  }
  return out;
}

/** the N27 cards: up to three, recommended first. questions.js reads these */
const cards = (state) => { const d = directions(state); return [d.recommended, ...d.alternatives].filter(Boolean).slice(0, 3).map((c) => ({ id: c.id, title: c.name, buyer: c.buyer, offer: c.offer, route: c.route, niche: c.niche, fit: c.fit, fitReason: c.fitReason, label: c.label, unknown: c.unknown, firstTest: c.firstTest, technical: c.technical, own: !!c.own, narrowedFrom: c.narrowedFrom ?? null })); };

/* ---------------------------------------------------------------- Task 12: the reveal

   "Here is where I would start." The strongest direction first with one grounded reason, then up to two
   alternatives, then Explore this direction and Compare the options. A compact card carries a title, a short fit
   reason and one of three ranked words. Detail waits for activation; the ranking is visible, not a hidden glow. */
const REVEAL_ACTIONS = [{ id: 'explore', label: 'Explore this direction', primary: true }, { id: 'compare', label: 'Compare the options', primary: false }];
function reveal(state) {
  const s = state ?? M.state ?? {};
  const d = directions(s);
  if (!d.recommended) return { available: false, headline: 'Here is where I would start.', lead: d.discovery?.why ?? 'Too little is known yet to compare directions.', step: d.discovery?.step ?? null, primary: null, alternatives: [], actions: [], note: 'No direction is shown until one clears your constraints.' };
  const p = d.person;
  const compact = (c, i) => ({
    id: c.id, rank: i + 1, title: c.own ? c.name : c.name, label: c.label, labelRank: c.labelRank,
    fitReason: c.fitReason, niche: c.niche,
    expanded: {
      buyer: c.buyer, problem: c.problem, offer: c.offer, route: c.route, mechanism: c.mechanism,
      fit: c.fit, verdict: c.verdict ?? null, comparison: c.comparison,
      against: c.against, wouldChange: c.wouldChange, againstDimension: c.dimension,
      unknown: c.unknown, firstTest: c.firstTest, permissions: c.permissions ?? null,
      evidence: evidenceCase(c, p),
    },
  });
  /* the ranking is the order, and a label below the top one never reads stronger than the one above it */
  const all = [d.recommended, ...d.alternatives].filter(Boolean).slice(0, 3).map(compact);
  let ceiling = 2;
  all.forEach((x) => { if (x.labelRank > ceiling) { x.labelRank = ceiling; x.label = LABELS[ceiling]; } ceiling = x.labelRank; });
  return {
    available: true, headline: 'Here is where I would start.',
    lead: `${all[0].title}: ${all[0].fitReason}`,
    primary: all[0], alternatives: all.slice(1), actions: REVEAL_ACTIONS,
    excluded: d.excluded, tieBreaker: d.tieBreaker ?? null,
    note: 'Ranked on what you have told Mercer, in words. No percentage fit and no probability of profit is computed anywhere.',
  };
}

/* ---------------------------------------------------------------- Task 14: your evidence, market evidence, a test

   Every fact carries where it came from: the person, a source, or an assumption. Nothing is sourced unless a real
   source object with a title and a date exists, and no comparable example is quoted as if it predicted this
   person's earnings: the mechanism is explained instead. */
const fact = (text, from, extra) => ({ text, from, ...(extra ?? {}) });
function evidenceCase(dir, p) {
  const yours = [];
  if (p.provenWords) yours.push(fact(`You have used ${p.provenWords.toLowerCase()} to get a result.`, 'person', { concept: 'proven' }));
  if (p.askedWords) yours.push(fact(`People already ask you for help with ${p.askedWords.toLowerCase()}.`, 'person', { concept: 'askedFor' }));
  if (p.groupWords) yours.push(fact(`You understand ${p.groupWords.toLowerCase()} through your own experience.`, 'person', { concept: 'groups' }));
  if (p.access === 'direct') yours.push(fact('You can speak to people who fit the buyer this week.', 'person', { concept: 'access' }));
  else if (p.access === 'via') yours.push(fact('You can reach the buyer through someone who already knows them.', 'person', { concept: 'access' }));
  if (p.triedResult === 'sold') yours.push(fact('You have already been paid for something like this once.', 'person', { concept: 'tried' }));
  if (p.tools.length) yours.push(fact(`You already own ${list(p.tools.slice(0, 3))}.`, 'person', { concept: 'tools' }));

  const market = [];
  if (/request|asked/.test(p.demandEvidence)) market.push(fact('Someone has asked you for this directly. That is one observation, not a market.', 'person', { concept: 'demandEvidence' }));
  else if (/spending|pay|paid|customers/.test(p.demandEvidence)) market.push(fact('You have seen people pay for this. What they paid and how often is not known yet.', 'person', { concept: 'demandEvidence' }));
  if (p.problems) market.push(fact(`You have seen the problem first hand: ${p.problems.toLowerCase()}.`, 'person', { concept: 'problems' }));
  market.push(fact(`That buyers pay for ${dir.offer} at a price that leaves you something is an assumption until one of them has paid.`, 'assumption'));

  const missing = [];
  if (!market.some((x) => x.from === 'person')) missing.push('What three of this buyer last paid for the same result, and what it cost them.');
  missing.push(`What the current offers to ${dir.buyer} look like and what they charge: two or three you can actually find, with the date you looked.`);

  return {
    pattern: ['your evidence', 'market evidence', 'a feasible test', 'what success could change'],
    yours, market, missing,
    mechanism: dir.mechanism ?? null,
    comparableRule: 'Where a comparable example is used, it is the mechanism that carries across, not the amount. One exceptional person’s earnings prove nothing about this direction for you.',
    sourced: [],
    sourcedNote: 'No external source is quoted here: this build holds no verified price or demand data for this direction. The gaps above are the ones to fill, with the date you filled them.',
    test: dir.firstTest ?? null,
    labels: { person: 'You told Mercer this', sourced: 'From a source, with its date', assumption: 'An assumption until it is tested' },
  };
}

/* ---------------------------------------------------------------- Task 13: a proposed price, with its basis

   Mercer proposes; the person corrects. The proposal is either their own figure, or one worked backwards from
   their own target and their own hours. Where neither exists there is no number: the basis and the method are
   given instead. No market price is invented, and no comparable is quoted that this build cannot show. */
const gbpOf = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : `£${Math.round(Number(n) || 0).toLocaleString('en-GB')}`);
const WEEKS_PER_MONTH = 4; // a stated convention for these scenarios, not a measured figure
/** how many deliveries fit in the hours available: whole deliveries only, recalculated, never hours scaled by a rate */
const deliveriesIn = (hours, perDelivery) => (hours === null || perDelivery === null || perDelivery <= 0 ? null : Math.floor((hours * WEEKS_PER_MONTH) / perDelivery));
function proposedPrice(p, dir) {
  if (p.testPrice !== null && p.testPrice > 0) return { amount: p.testPrice, currency: null, from: 'person', mode: null, basis: 'your figure, to test', method: 'It is the starting price for the first conversations. What they say it is worth replaces it.', editable: true };
  const per = deliveriesIn(p.hours, p.deliveryHours);
  if (p.targetMonthly !== null && p.targetMonthly > 0 && per !== null && per > 0) {
    const amount = Math.ceil(p.targetMonthly / per);
    return { amount, from: 'requirement', mode: 'requirements', basis: `worked backwards from your own target: ${gbpOf(p.targetMonthly)} a month ÷ ${per} deliver${per === 1 ? 'y' : 'ies'} your hours allow`, method: 'It is what the target needs each delivery to earn, not what this buyer has been shown to pay. The conversations test whether it holds.', editable: true, inputs: { targetMonthly: p.targetMonthly, deliveries: per, hours: p.hours, hoursPerDelivery: p.deliveryHours } };
  }
  return { amount: null, from: 'unknown', mode: null, basis: 'not known yet', method: `Set it in the first three conversations: ask what they last paid for the same result and what it cost. A price from ${dir?.buyer ?? 'the buyer'} beats a price from a spreadsheet.`, editable: true, missing: [p.deliveryHours === null ? 'how many hours one delivery takes' : null, p.hours === null ? 'the hours a week you can give it' : null, p.targetMonthly === null ? 'what you want it to earn a month' : null].filter(Boolean) };
}

/* ---------------------------------------------------------------- Task 14: earnings scenarios, or the next step

   A figure appears only with the customer count, price, delivery hours and costs behind it. Where an input is
   missing there is no figure at all: the next piece of evidence to gather is shown in its place. Hours are never
   multiplied by a rate; each variant recalculates whole deliveries inside the hours available. */
function earningsScenarios(p, price, costs) {
  const perDelivery = p.deliveryHours;
  const amount = price?.amount ?? null;
  const missing = [
    amount === null ? { input: 'price', label: 'what one delivery sells for', step: 'Ask three of this buyer what they last paid for the same result, and what it cost them.' } : null,
    perDelivery === null ? { input: 'deliveryHours', label: 'how many hours one delivery takes', step: 'Do one delivery, by hand, end to end, and write down the hours it actually took.' } : null,
    p.hours === null ? { input: 'hoursWeek', label: 'the hours a week you can give it', step: 'Count the hours you can protect each week for the next month, and write that number down.' } : null,
  ].filter(Boolean);
  const monthlyCost = p.monthlyKnown ? p.monthly : (p.budgetKnown && p.budget === 0 ? 0 : null);
  if (missing.length) {
    return { supported: false, mode: null, missing, nextStep: missing[0].step, why: `No earnings figure is shown: ${list(missing.map((m) => m.label))} ${missing.length === 1 ? 'is' : 'are'} not known, and a figure built on a guess would look more certain than it is.`, rows: [], employment: null };
  }
  const build = (hours, label, chosen) => {
    const deliveries = deliveriesIn(hours, perDelivery);
    const revenue = deliveries * amount;
    const after = monthlyCost === null ? null : revenue - monthlyCost;
    return {
      label, chosen, hours, hoursPerDelivery: perDelivery, weeksPerMonth: WEEKS_PER_MONTH,
      deliveries, price: amount, revenue, monthlyCost, afterCosts: after,
      workings: `${hours} hours a week × ${WEEKS_PER_MONTH} weeks ÷ ${perDelivery} hours a delivery = ${deliveries} whole deliver${deliveries === 1 ? 'y' : 'ies'} a month; × ${gbpOf(amount)} = ${gbpOf(revenue)}${monthlyCost === null ? '. Your monthly costs are not known, so nothing is taken off' : `, less ${gbpOf(monthlyCost)} of monthly cost = ${gbpOf(after)}`}.`,
      excludes: 'Before tax, before anything you pay yourself, and before any cost you have not listed.',
    };
  };
  const rows = [build(p.hours, `At the ${p.hours} hours a week you have`, true)];
  const base = rows[0];
  if (base.deliveries === 0) {
    return {
      supported: false, mode: 'requirements', missing: [], rows: [], employment: null,
      why: `One delivery takes ${perDelivery} hours and you have ${p.hours} hours a week, so a whole delivery does not fit inside a month. Three hours a week is not worthless; this version of the offer is too big for it.`,
      startingVersion: `Cut the offer down until one delivery fits inside ${Math.floor(p.hours * WEEKS_PER_MONTH)} hours: a smaller promise, one session rather than a course, one room rather than a house. That version is the one to test.`,
      nextStep: 'Write down the smallest version of this offer somebody would still pay for, and time one of those instead.',
    };
  }
  /* an optional higher-hours variant, recalculated the same way, offered only as something they could choose */
  if (p.hours < 10) { const more = p.hours + 2; const r = build(more, `If you found ${more - p.hours} more hours a week`, false); if (r.deliveries > base.deliveries) rows.push(r); }
  return {
    supported: true, mode: 'illustrative', modeLabel: 'Illustrative scenario', feasibility: 'not_established', missing: [], rows,
    note: 'These are arithmetic on your own figures, not a prediction that this many people will buy. The customer count is the most they could be, and every one of them still has to be found and sold to.',
    nonLinear: 'More hours do not multiply the income: only whole deliveries fit inside them, and each variant is recalculated rather than scaled.',
    employment: employmentComparison(p, base),
  };
}
/** Task 14: optional, contextual, labelled, and only when the person gave their current income themselves */
function employmentComparison(p, row) {
  if (p.currentIncome === null || !row || row.afterCosts === null) return null;
  return {
    optional: true, shown: 'only if you ask for it',
    label: 'Context, not a recommendation',
    yours: { amount: p.currentIncome, hours: p.currentIncomeHours, unit: 'a month', basis: 'your figure' },
    business: { amount: row.afterCosts, unit: 'a month', basis: 'the illustrative scenario above, after the costs listed' },
    unlike: 'Employment income is after tax deductions and comes with holiday, sick pay and a pension; the business figure is before tax, before anything you pay yourself, and arrives only when customers pay.',
    caution: 'A scenario figure is not evidence that you should leave a job. It is one arithmetic comparison between a known income and an untested one.',
    hoursNote: p.currentIncomeHours !== null && p.hours !== null ? `${p.currentIncomeHours} hours a week against ${p.hours}: the two are not the same week.` : 'The hours behind each figure are different; compare them per hour only if you know both.',
  };
}

/* ---------------------------------------------------------------- the starter plan (brief 9.6, Tasks 13 and 14) */
function starterPlan(state, direction) {
  const s = state ?? M.state ?? {};
  const p = person(s);
  const dirs = directions(s);
  let dir = direction && typeof direction === 'object' ? direction : direction ? ([dirs.recommended, ...dirs.alternatives].find((c) => c && c.id === direction) ?? (BY_ID[direction] ? card(BY_ID[direction], p, compare(BY_ID[direction], p)) : null)) : dirs.recommended;
  if (!dir) return { direction: null, discovery: dirs.discovery ?? null, excluded: dirs.excluded, preliminary: true };
  const a = BY_ID[dir.id] ?? BY_ID[dir.narrowedFrom] ?? null;
  const buyer = p.firstBuyer || dir.buyer;
  const priceKnown = p.testPrice !== null && p.testPrice > 0;
  const budget0 = p.budgetKnown && p.budget === 0;
  const gbp = (n) => (typeof M.gbp === 'function' ? M.gbp(n) : `£${Math.round(n).toLocaleString('en-GB')}`);

  const firstOffer = p.firstResult
    ? `${p.firstResult}${priceKnown ? `, at ${gbp(p.testPrice)} (your figure, to test)` : ', price set after the first three conversations'}.`
    : `${dir.offer.charAt(0).toUpperCase()}${dir.offer.slice(1)} for ${buyer}${priceKnown ? `, at ${gbp(p.testPrice)} (your figure, to test)` : '; the price is not known yet and is set after the first three conversations'}.`;
  const evidence = /nobody|none yet|no one/.test(p.demandEvidence) ? 'none yet' : /request|asked/.test(p.demandEvidence) ? 'first-hand requests' : /spending|pay|paid/.test(p.demandEvidence) ? 'people already spend on this' : /conversation|spoke|talk/.test(p.demandEvidence) ? 'conversations' : /source|research|report/.test(p.demandEvidence) ? 'a source you found' : p.demandEvidence ? 'an assumption' : dir.comparison?.evidence?.level === 'weak' ? 'none yet' : dir.comparison?.evidence?.why ?? 'none yet';
  const unproven = [
    evidence === 'none yet' || evidence === 'an assumption' ? `Demand: ${buyer} have not asked for this yet.` : '',
    priceKnown ? `Price: ${gbp(p.testPrice)} is your estimate, not a market figure.` : 'Price: not known yet.',
    /yes/.test(p.canDeliver) && !/gap|unsure/.test(p.canDeliver) ? '' : /gap/.test(p.canDeliver) ? `Delivery: you named a gap (${p.canDeliver}).` : 'Delivery: whether you can deliver it well enough to be paid twice.',
    dir.permissions ? `Permissions: ${dir.permissions}` : '',
    p.triedVerdict ? `Last attempt: ${p.triedVerdict}.` : '',
  ].filter(Boolean);
  const test = /conversation|talk|speak/.test(p.testMethod) ? `Five conversations with ${buyer}: what they last paid for, what went wrong, what they would pay to have it done.` : /sample|example|free/.test(p.testMethod) ? `One free or cut-price sample for one of ${buyer}, in exchange for a written comment and a referral.` : /pilot|paid/.test(p.testMethod) ? `One paid pilot for one of ${buyer} at ${priceKnown ? gbp(p.testPrice) : 'a price agreed in the conversation'}.` : /manual|by hand/.test(p.testMethod) ? 'Do the whole job by hand for the first three buyers before building anything.' : dir.firstTest;
  const route = routeFor(p);
  const steps = deliverySteps(a, p);
  const costs = costsFor(a, p, budget0);
  // `a.skills` is the set that QUALIFIES a person for this direction: any one of them is enough (exclusion() reads it
  // with .some()). So a skill left over is not a gap. Only a capability the direction cannot be delivered without is.
  const has = (k) => p.skills.includes(k) || p.proven.includes(k);
  const qualified = !a || a.skills.some(has);
  const gaps = [
    ...(a && !qualified ? a.skills.filter((k) => !has(k)).slice(0, 2).map((k) => `${SKILL_WORDS[k] ?? k}: not among the skills you named; ${p.learn.includes(k) ? 'you said you would learn it' : 'learn the minimum or find someone who has it'}.`) : []),
    ...(a && qualified ? arrOf(a.requires).filter((k) => !has(k)).slice(0, 2).map((k) => `${SKILL_WORDS[k] ?? k}: the work needs it; ${p.learn.includes(k) ? 'you said you would learn it' : 'learn the minimum or find someone who has it'}.`) : []),
    dir.permissions ? dir.permissions : '',
    /gap/.test(p.canDeliver) ? p.canDeliver : '',
  ].filter(Boolean);
  const hoursLine = p.hoursKnown ? `${p.hours} hours a week` : 'the hours you can give it (not known yet)';
  const weekOne = [
    `Write the one-page offer (the offer sheet below) for ${buyer}: what is done, what it costs, how to book.`,
    `Name the first three people who fit ${buyer} and how you reach each one (${route}).`,
    `Send the outreach message below to those three. Ask for a conversation, not a sale.`,
    `Hold the conversations. Write down what they last paid for and what would make them pay you.`,
    `Set the price for the first test from what you heard${priceKnown ? ` (start from your ${gbp(p.testPrice)})` : ''} and offer it to one of them.`,
  ];
  const testCount = testCountOf(test);
  const milestone = p.continueIf || `${testCount === 1 ? 'the first buyer' : `${testCount} of them`} pays, and one of them would book again`;
  const thirtyDays = [
    `Week 1: ${weekOne[0]} ${weekOne[2]}`,
    `Week 2: deliver the first paid test (${test.charAt(0).toLowerCase()}${test.slice(1)}). Write down the hours it took and what you would change.`,
    `Week 3: deliver two more, to different buyers where you can. Ask each one what they would have paid.`,
    `Week 4: count paid deliveries, hours spent and money in. Compare with the milestone: ${milestone}.`,
  ];
  const stop = p.stopIf || `${p.budgetKnown ? `${budget0 ? 'any spend at all' : `${gbp(p.budget)} spent`}, or ` : ''}four weeks at ${hoursLine} with no one willing to pay`;
  const ninety = {
    if: milestone,
    then: a && a.scope === 2 ? `Turn the first offer into a fixed package at a set price and raise the price for the next three buyers. Keep delivering by hand; ${a.technical ? 'write the implementation brief below only once three users have paid for the result' : 'add a booking process so the next enquiries need no back and forth'}.` : `Repeat the offer with the next five buyers at a price a step above the test, and drop what took the most hours for the least money.`,
    else: `Stop or change: keep the buyer and change the offer if they wanted something adjacent; change the buyer if they had no reason to pay; drop the direction if neither, and try ${dirs.alternatives[0] ? dirs.alternatives[0].name.toLowerCase() : 'the next direction'}.`,
  };
  const assets = (dir.assets ?? a?.assets ?? []).map((kind) => ({ kind, title: ASSET_TITLE[kind] ?? kind, direction: dir.id, text: null }));
  const support = {
    kinds: a ? a.buyers.map((b) => BUYER_WORDS[b]).filter(Boolean).slice(0, 2).concat(['someone already doing this a year ahead of you']) : ['someone already doing this a year ahead of you'],
    why: 'They know what the first buyers ask for and what to charge; one conversation saves a month of guessing.',
    introduction: `Hello. I am starting to offer ${dir.offer} for ${buyer}. You are a year or two ahead of me. Could I ask you three questions about what the first customers wanted? Twenty minutes, at a time that suits you.`,
    nextAction: 'Name one such person and send that message this week.',
    directory: 'TMA has no verified community directory in this build. This is a support profile; a request for an introduction goes in the TMA brief if you send one.',
    wanted: p.support,
  };
  const ctx = { direction: dir, buyer, firstOffer, test, route, priceKnown, price: p.testPrice, person: p, hoursLine, budget0 };
  assets.forEach((x) => { try { x.text = typeof M.plan?.assetText === 'function' ? M.plan.assetText(x.kind, { ...ctx, route: 'starter' }) : null; } catch (e) { x.text = null; } });
  const implementationPrompt = dir.technical ? assets.find((x) => x.kind === 'implementation-brief')?.text ?? null : null;
  /* Task 13: the proposal, the evidence case and the six weeks with review gates rather than promised customers */
  const price = proposedPrice(p, dir);
  const evidenceCaseOut = evidenceCase(dir, p);
  const earnings = earningsScenarios(p, price, costs);
  const sixWeeks = sixWeekSequence({ p, dir, buyer, route, test, steps, milestone, price, testCount });
  const paths = pathsFor(p, dir, support);
  return {
    direction: dir, alternatives: dirs.alternatives.filter((c) => c.id !== dir.id), excluded: dirs.excluded, tieBreaker: dirs.tieBreaker ?? null,
    reveal: reveal(s), person: p,
    buyerProblem: `${buyer}: ${dir.problem}.`,
    niche: dir.niche ?? null, mechanism: dir.mechanism ?? null,
    firstOffer, whyFits: dir.fit, unproven, demandEvidence: evidence,
    evidenceCase: evidenceCaseOut, proposedPrice: price, earnings,
    validationTest: test, firstBuyerRoute: route, deliverySteps: steps,
    costs, toolsOwned: p.tools, essentialGaps: gaps,
    weekOne, thirtyDays, ninetyDays: ninety, sixWeeks, paths,
    success: milestone, stop,
    assets, implementationPrompt, support,
    hours: p.hours, budget: p.budget, budgetKnown: p.budgetKnown, monthly: p.monthly, monthlyKnown: p.monthlyKnown, urgency: p.urgency,
    price: p.testPrice, priceKnown, budget0, deliveryHours: p.deliveryHours,
    preliminary: p.answered.length < 6,
    /* D9 and D10: where they started, what a previous attempt showed, and whether the first buyers can be reached yet */
    startPoint: p.startPoint, ideas: p.ideas, chosenIdea: p.chosenIdea, noAccess: p.noAccess,
    tried: p.triedVerdict || p.triedWhat ? { what: p.triedWhat || p.tried || null, channel: p.triedChannel || null, outcome: p.triedOutcome, numbers: p.triedNumbers, price: p.triedPrice, verdict: p.triedVerdict, changes: p.triedChanges, repeatsChannel: p.triedRepeatsChannel } : null,
  };
}
/** six weeks of work, each ending at a review gate. A gate is a question asked of what happened, never a promise
    that a customer will have appeared by a date (Task 13) */
function sixWeekSequence({ p, dir, buyer, route, test, steps, milestone, price, testCount }) {
  const priceWords = price.amount !== null ? `${gbpOf(price.amount)} (${price.basis})` : 'the price agreed in the conversation';
  return [
    { week: 1, work: `Write the one-page offer for ${buyer} and name the first three people who fit, with how you reach each one (${route}).`, gate: 'Three named people and a page you would send them. If you cannot name three, widen the buyer before going on.' },
    { week: 2, work: `Send the outreach message to those three and hold the conversations. Ask what they last paid for and what went wrong.`, gate: 'What each one last paid for, written down. If none of them can name anything they would pay for, change the buyer, not the offer.' },
    { week: 3, work: `Offer the first test to one of them at ${priceWords}: ${test.charAt(0).toLowerCase()}${test.slice(1)}`, gate: 'One person has agreed, or three have said no with a reason. Either is a result; neither is a delay.' },
    { week: 4, work: `Deliver it: ${steps[0] ?? 'agree what is delivered and the price'} Record the hours it actually took.`, gate: 'The real hours per delivery, in writing. Every figure Mercer shows you afterwards rests on this one.' },
    { week: 5, work: `Deliver to ${testCount > 1 ? `${testCount - 1} more buyer${testCount > 2 ? 's' : ''}` : 'one more buyer'} where you can, and ask each what they would have paid.`, gate: 'What they would have paid, against what you charged. If the two are far apart, the price moves before anything else does.' },
    { week: 6, work: 'Count paid deliveries, hours spent and money in. Compare with the milestone.', gate: `The milestone: ${milestone}. Met, continue and raise the price for the next three. Not met, the direction changes or the offer does; that decision is the point of the six weeks.` },
  ];
}
/** the two ways the same plan gets done: on their own, or with TMA. Neither is presented as the only way (Task 13) */
function pathsFor(p, dir, support) {
  return {
    selfDirected: {
      label: 'On your own',
      steps: ['Work the six weeks above in order; each gate is a decision, not a report.', 'Use the assets below as they are, and rewrite them in your own words after the first conversation.', `Find one person already doing this a year ahead of you and ask the three questions in the introduction message.`],
      needs: ['Your own hours, in the week', 'Whatever the first test costs, which the costs list caps'],
      note: 'Nothing here needs anybody’s permission or any purchase.',
    },
    tmaSupported: {
      label: 'With TMA',
      steps: ['Send the brief below and ask for a review of the direction and the price before week three.', 'Ask for the offer page and the outreach message to be checked against what the buyer actually said.', 'Bring the week-four hours figure to the review: it is the input everything else rests on.'],
      needs: ['A brief you send yourself; nothing is sent by the page'],
      note: 'A review request is a review request. No admission, investment or placement is implied, and the self-directed path above does not depend on it.',
      wanted: support?.wanted ?? [],
    },
  };
}
const ASSET_TITLE = { 'offer-sheet': 'Offer sheet', 'outreach-message': 'Outreach message', 'booking-process': 'Booking process', 'delivery-checklist': 'Delivery checklist', proposal: 'Proposal template', listing: 'Listing description', 'content-plan': 'Four-week content plan', 'implementation-brief': 'Implementation brief' };
const BUYER_WORDS = { households: 'a few households who fit the buyer', parents: 'parents in one school or club', students: 'a tutor or teacher who sees learners weekly', trades: 'two tradespeople who run their own jobs', 'small-business': 'two small business owners', professionals: 'one accountant or solicitor with small-business clients', creatives: 'two working makers or creatives', retail: 'one shop or café owner', charities: 'one community group organiser', older: 'a carer or someone who supports older relatives', health: 'one practitioner in the field', tech: 'one person who builds software for a living', property: 'one landlord or letting agent', schools: 'one teacher' };

function deliverySteps(a, p) {
  const base = {
    'local-service': ['Confirm the job and the price in writing before the visit.', 'Arrive when agreed; do the job to the checklist.', 'Show the finished work, take payment, ask for a review and a referral.'],
    'freelance-skill': ['Agree the scope, the deadline and the price in one message.', 'Do the work; send a draft at the halfway point.', 'Deliver, invoice, and ask what they would want next.'],
    'productised-service': ['Take the booking and the deposit through one fixed form.', 'Run the package to the same checklist every time.', 'Hand over with a one-line summary; invoice the balance; book the next one.'],
    'physical-product': ['Make one small batch; cost each item, materials and time.', 'Sell it at the stall, to the shop or by pre-order; count what is left.', 'Note what sold first and what did not; make the next batch smaller or larger to match.'],
    'digital-product': ['Outline what the buyer gets and finish only that.', 'Put it on a one-page listing with the price.', 'Deliver it by email or download on payment; ask one question afterwards.'],
    'content-audience': ['Pick one subject and one place to post.', 'Post on a fixed day each week for four weeks.', 'Count who came back; ask them what they would pay for.'],
    reselling: ['Buy only what you can price with confidence.', 'Photograph, describe and list the same day.', 'Pack and post within a day of the sale; record the margin.'],
    'teaching-coaching': ['Agree the aim and the price for the first session.', 'Teach one thing the learner can do by the end.', 'End with the next step and the question: would you book again?'],
    'maintenance-repair': ['Diagnose and quote before touching it.', 'Repair; test it works; write down the parts and the time.', 'Return it with the invoice and a note of what to watch for.'],
    'events-experiences': ['Fix the date, the place and the number of places.', 'Sell places by message; confirm each one.', 'Run it to a written timetable; ask everyone one question at the end.'],
    'b2b-admin-ops': ['Agree the block of hours, the tasks and the access you need, in writing.', 'Clear the tasks; keep a list of what was done and what waits on the owner.', 'Send the list at the end of each block with the next block proposed.'],
    'technical-build': ['Do the job by hand for the first users; write down every step.', 'Build only the steps that repeat, as one small tool.', 'Give it to the same users; fix what they trip on before adding anything.'],
    'care-wellbeing': ['Check the legal requirements for the work; get the checks and insurance in place.', 'Agree the session, the rate and the boundaries with the person and their family.', 'Deliver on time; keep a short note of each session.'],
    'community-subscription': ['Set the aim, the rhythm (weekly or monthly) and the price.', 'Invite founding members by message; start with whoever says yes.', 'Run the first session; ask what would make them stay.'],
    'local-food': ['Register with the council and set up the kitchen to the rules.', 'Take pre-orders for a short menu; make to order.', 'Deliver or hand over; count cost, hours and sales for the round.'],
  };
  return base[a?.id] ?? ['Agree what is delivered and the price.', 'Deliver it to a written checklist.', 'Ask for payment, a comment and a referral.'];
}
/** startup and monthly cost lines, every amount labelled. No figure is invented: an item you have not priced carries
    "Check current price before buying" and no amount. A zero budget lists nothing paid, and no advertising */
function costsFor(a, p, budget0) {
  const owned = new Set(p.tools.map((t) => t.toLowerCase()));
  const has = (re) => [...owned].some((t) => re.test(t));
  const item = (name, need, kind) => ({ item: name, amount: null, label: need === 'owned' ? 'owned' : need === 'free' ? 'free' : 'estimate', note: need === 'paid' ? 'Check current price before buying' : null, kind });
  const startup = [];
  const monthly = [];
  const phone = has(/phone|mobile/) ? 'owned' : 'free';
  startup.push(item('A phone and a way to be paid (bank transfer works)', phone, 'essential'));
  if (['local-service', 'maintenance-repair'].includes(a?.id)) startup.push(item('Basic tools for the job', has(/tool|kit|equipment/) ? 'owned' : budget0 ? 'free' : 'paid', budget0 ? 'borrow or use what you have' : 'essential'));
  if (['physical-product', 'local-food'].includes(a?.id)) startup.push(item('Materials or ingredients for the first batch', 'paid', 'essential'));
  if (a?.id === 'reselling') startup.push(item('A float for the first ten items', 'paid', 'essential'));
  if (a?.id === 'events-experiences') startup.push(item('A venue (free where possible: a library room, a park, someone’s kitchen)', 'free', 'essential'));
  if (a?.id === 'care-wellbeing' || a?.id === 'teaching-coaching') startup.push(item('DBS check and insurance where the work needs them', 'paid', 'essential'));
  startup.push(item('A one-page offer sheet and a booking form (free tools exist for both)', 'free', 'essential'));
  if (p.monthlyKnown && p.monthly > 0 && !budget0) monthly.push({ item: 'A paid tool only if the free tier runs out', amount: null, label: 'estimate', note: `Cap: ${typeof M.gbp === 'function' ? M.gbp(p.monthly) : `£${p.monthly}`} a month, your figure`, kind: 'later' });
  else monthly.push({ item: 'Nothing recurring: free tiers only', amount: 0, label: 'free', note: null, kind: 'essential' });
  const avoid = [{ item: 'Paid advertising', why: budget0 ? 'you have no test budget, and the first buyers come from people you can reach for nothing' : 'not until three people have paid at the price' }, { item: 'A paid website builder or subscription', why: 'a one-page sheet and a free form cover the first month' }];
  return { startup, monthly, avoid, cap: p.budgetKnown ? p.budget : null, capLabel: p.budgetKnown ? 'your test budget' : 'not known yet', paid: !budget0 };
}

M.starter = { CATALOGUE, BY_ID, FAMILIES: CATALOGUE_FAMILIES, FIELDS, BANK_OF, directions, cards, reveal, plan: starterPlan, person, exclusion, compare, matchIdea, skillsOf, avoidsOf, buyersOf, number, money, tokens, idFor, raw, LABELS, labelRank, evidenceCase, proposedPrice, earningsScenarios, routeFor, hoursIn, deliveriesIn, WEEKS_PER_MONTH };
})();
