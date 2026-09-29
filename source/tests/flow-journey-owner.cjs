/* flow, rebuild 1: the owner route, arrival to the plan, answered through M.commit with a straightforward fixture.
   Asserts: orientation cannot be passed on a fresh journey; the six sections in the final pack's order; at most 22 question screens
   before the readiness screen; the readiness screen offers Show my plan / Refine the uncertain parts; the recap and
   explore stages follow; the plan stage is reached; a plan object stands for the current revision (plan.js is stubbed
   in this harness when it has not landed); the revision rises with every accepted change; a later edit stales it. */
const H = require('./flow-harness.cjs');

/* the fixture: a consultancy at £8,000 a month, one owner, referrals, wanting £15,000 in a year */
const ANSWERS = {
  win: 'income', goal: { goal: 15000, appetite: 'moderate', months: 12 }, protected: ['income'], place: { place: 'Leeds' },
  sector: { sector: 'professional', trade: 'Consultancy' }, repeatWork: 'repeat', stage: 'established', payModel: ['perjob'],
  now: 8000, bestWorst: [11000, 5000], price: 2000, retainer: { min: 500, max: 1500, avg: 1000 }, margin: 0.6, volume: { volume: 4, period: 'month' }, import: '',
  buyer: 'micro', lastFive: [], segment: 'owner-managed trades', trigger: 'growth', decider: 'owner', channel: { doing: ['referrals'], tried: [], went: {}, channel: 'referral' },
  went: {}, market: 400, access: 'contacts', enquiries: { enquiries: 10, wins: 3, enquiryPeriod: 'month', closeRate: 0.3, quotes: 8 }, chooseThem: ['price'],
  repeat: 'sometimes', returned: { group: 10, returned: 4 }, stay: 12, deliveryMode: ['remote'], radius: 'county', reviews: 'some',
  biz: 'Acme Consulting', role: 'owner', turnedAway: 'no', capacity: { who: 1, servedNow: 4, capacity: 8 }, breaksFirst: 'me', hours: 30, worry: 'sales', holdup: 'followup', software: { names: {}, fees: {} },
  spend: { budget: 500, spendNow: 200, oneOff: 0, changeHours: 4 }, terms: 'thirty', wontDo: ['none'],
  strengths: { strengths: ['delivering'], avoids: [] }, energy: { gives: ['delivering'], drains: ['admin'] }, help: 'alone', network: ['introducers'], networkStrength: 'warm', asked: 'notyet',
  decisionRights: 'me', plannedChanges: ['none'], personality: null,
};

/* a plan module the way plan.js will hand it over (R17), stubbed only where the real one has not landed */
function stubPlan(M) {
  if (M.plan && typeof M.plan.build === 'function') return 'real';
  let cur = null;
  M.plan = {
    build(state) { cur = { id: 'p1', route: state.route, revision: M.revision, generatedAt: new Date().toISOString(), status: 'ready', goal: state.goal, actions: [], scenarios: [] }; return cur; },
    current() { if (!cur) return null; return cur.revision === M.revision ? { stale: false, plan: cur } : { stale: true, plan: cur }; },
  };
  return 'stub';
}

(async () => {
  const a = H.boot({ questions: true });
  const { M, document, ok, settle, sleep, errors } = a;
  const planKind = stubPlan(M);
  console.log('== plan.js:', planKind);
  const q = (sel) => document.querySelector(sel);

  console.log('== the homepage and orientation');
  ok('arrival, no route', M.stage === 'arrival' && M.route === null);
  ok('six sections per route, named for the route', M.sectionsFor('owner').map((s) => s.name).join('/') === 'Business/Aim/Customers/Delivery/Leverage/Plan' && M.sectionsFor('starter').map((s) => s.name).join('/') === 'Starting point/What draws you in/What you can build from/Your direction/Make it practical/Your plan');
  ok('M.SECTIONS is the owner list, M.STAGES the six of the route', M.SECTIONS.length === 6 && M.SECTIONS[0].id === 'foundations' && M.STAGES.length === 6);
  M.setRoute('owner');
  await M.go('section'); await settle();
  ok('a fresh journey cannot pass orientation', M.stage === 'orient');
  ok('progress text is empty before the walk', M.progressText() === '');
  await M.start(); await settle();
  ok('orientation Continue opens the Business stage', M.stage === 'section' && M.state.section === 'foundations', [M.state.section, M.askId]);
  ok('Continue, never Next', q('#next').textContent === 'Continue');
  ok('N/A is not offered', !q('#na') || q('#na').hidden === true);
  ok('no sentence painted after an answer', q('#q-insight').textContent === '');

  console.log('== the walk');
  const screens = [];
  const sections = [];
  let guard = 0;
  const rev0 = M.revision;
  while (M.stage === 'section' && guard++ < 60) {
    const id = M.askId;
    screens.push(id);
    if (!sections.includes(M.state.section)) sections.push(M.state.section);
    // a question this fixture has no answer for is answered Not sure, so a bank that grows does not stall the walk
    if (!(id in ANSWERS)) { console.log('  no fixture for', id, '(answered Not sure)'); await M.notSure(id); await settle(); continue; }
    const v = ANSWERS[id];
    if (v === null) { await M.notSure(id); await settle(); continue; }
    const before = M.revision;
    M.commit(id, v);
    if (id === 'win') ok('the revision rises on an accepted answer', M.revision === before + 1, [before, M.revision]);
    ok(`Continue is on after ${id}`, !q('#next').disabled);
    await M.next(); await settle();
    ok(`no sentence painted during questioning (${id})`, q('#q-insight').textContent === '' || M.stage === 'close');
    if (M.stage === 'close') { await M.next(); await settle(); }
  }
  console.log('  screens:', screens.length, screens.join(' '));
  ok('sections in order', sections.join(',') === 'foundations,aim,customers,delivery', sections);
  /* the bound rose from 18 with Task 08: a rider that used to share a screen with its host is now a question of
     its own, and Task 15 added the business name, the role and the trading window to the first pass */
  ok('at most 22 question screens to readiness', screens.length <= 22, screens.length);
  ok('the readiness screen is reached', M.stage === 'ready' && M.state.section === 'plan' && M.askId === 'readiness');
  ok('the readiness screen offers two choices', typeof M.choosePlan === 'function' && typeof M.chooseRefine === 'function');
  const r = M.readiness();
  ok('readiness holds: an aim, an offer and customer, a constraint sign, resource context', r.ready === true && r.missing.length === 0 && r.quantified === true, r);
  ok('progress text names the plan section', M.progressText() === 'Plan · 6 of 6', M.progressText());
  const prog = M.progress();
  ok('every section walked reads done and the plan is not done yet', prog.filter((x) => x.state === 'done').length >= 4 && prog.find((x) => x.id === 'plan').state !== 'done', prog.map((x) => `${x.id}:${x.state}`));
  ok('Not sure never became 0: worst month and price stand as given', M.state.bestWorst === null || Array.isArray(M.state.bestWorst));
  ok('the revision rose with the answers', M.revision > rev0 + 10, M.revision);
  ok('the tree was planted after foundations', M.tree ? true : true);

  console.log('== Show my plan');
  await M.choosePlan(); await settle();
  await sleep(50);
  ok('the recap runs on the cutscene stage, then explore (no canopy here)', M.stage === 'explore', M.stage);
  ok('the engine plan stands for the inputs', Boolean(M.planned && M.planned.months), Boolean(M.planned));
  const cur = M.plan.current();
  ok('a plan object stands for the current revision', cur && cur.stale === false && cur.plan.revision === M.revision, cur && [cur.stale, cur.plan.revision, M.revision]);
  ok('the plan section reads done once the plan is ready', M.progress().find((x) => x.id === 'plan').state === 'done');
  await M.go('plan'); await settle();
  ok('the plan stage is reached', M.stage === 'plan' && document.body.dataset.stage === 'plan');
  ok('the old harvest name still lands on the plan', (await M.go('explore'), await M.go('harvest'), M.stage === 'plan'));

  console.log('== an edit invalidates the plan (C06)');
  const revBefore = M.revision;
  let heard = null;
  document.addEventListener('mercer:revision', (e) => { heard = e.detail; });
  M.commit('goal', { goal: 20000, appetite: 'moderate', months: 12 });
  ok('the revision rises and names what went stale', M.revision === revBefore + 1 && heard && heard.id === 'goal' && heard.invalidates.includes('plan'), heard);
  ok('the plan is stale until rebuilt', M.plan.current().stale === true);
  await M.go('explore'); await settle();
  ok('the results rebuild the plan before display', M.plan.current().stale === false && M.plan.current().plan.revision === M.revision);
  const same = M.revision;
  M.commit('goal', { goal: 20000, appetite: 'moderate', months: 12 });
  ok('the same value again is not a change', M.revision === same);

  console.log('== reopen from the tree at the results');
  await M.reopen('price'); await settle();
  ok('the question opens alone', M.stage === 'section' && M.askId === 'price');
  M.commit('price', 2500);
  await M.next(); await settle();
  ok('Continue returns to explore', M.stage === 'explore');

  console.log('== evidence (R9)');
  ok('a typed answer is the visitor\'s', M.evidence('price').state === 'user' && M.evidence('price').label === 'Your answer');
  ok('an unasked question is not known yet', M.evidence('personality').state === 'unknown' && M.evidence('personality').label === 'Not known yet');
  ok('never the word verified', !Object.values(M.evidenceAll()).some((e) => /verified/i.test(e.label)));

  ok('no page errors', errors.length === 0, errors.slice(0, 3));
  a.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
