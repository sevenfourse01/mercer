/* flow, rebuild 1: the starter route, arrival to the plan, answered through M.commit with a straightforward fixture.
   Asserts: the starter stage names of Task 10; no revenue, retention, ownership or lifetime question is
   asked; at most 24 question screens before the readiness screen; the plan stage is reached with a plan object (plan.js
   and starter.js are stubbed in this harness where they have not landed); a route switch after S02 keeps the shared
   answers; the readiness screen's Refine choice continues the walk with the refinement questions. */
const H = require('./flow-harness.cjs');

const ANSWERS = {
  win: 'extra', goal: { goal: 1500, appetite: 'moderate', months: 6 }, protected: ['income', 'family'], place: { place: 'Leeds' },
  biz: 'A new business', interest: 'read about lighting', bestAt: 'ten years of stage lighting for small theatres',
  paidBefore: 'unpaid', workStyle: ['making'], currency: 'GBP', months: 6, n01: 'employed', n03: 10, n05: 300, n07: 'months', n10: ['writing', 'talking'], n13: ['writing'], n15: ['none'], n16: ['laptop'],
  n19: ['owners'], n21: 'direct', n25: 'no', n27: 'bookkeeping', n30: ['accountability'],
  n31: 'owners', n33: ['asked'], n35: 'yes', n39: 'first',
  n41: ['none'], n42: ['offer'], n44: ['none'],
};
const NEVER_ON_STARTER = ['now', 'price', 'retainer', 'margin', 'stay', 'returned', 'repeat', 'ownership', 'ownShare', 'profitShare', 'ltv', 'bestWorst', 'yearsTrading'];

function stubs(M) {
  const out = [];
  if (!(M.plan && typeof M.plan.build === 'function')) {
    let cur = null;
    M.plan = { build(state) { cur = { id: 'p1', route: state.route, revision: M.revision, generatedAt: new Date().toISOString(), status: 'ready', actions: [], scenarios: [] }; return cur; }, current() { if (!cur) return null; return cur.revision === M.revision ? { stale: false, plan: cur } : { stale: true, plan: cur }; } };
    out.push('plan.js');
  }
  if (!(M.starter && typeof M.starter.directions === 'function')) {
    M.starter = { directions() { return { recommended: { id: 'bookkeeping', buyer: 'owners', firstTest: 'Offer to do one month of books for one owner you know.' }, alternatives: [], excluded: [] }; }, plan() { return {}; } };
    out.push('starter.js');
  }
  return out;
}

(async () => {
  const a = H.boot({ questions: true });
  const { M, document, ok, settle, sleep, errors } = a;
  console.log('== stubbed:', stubs(M).join(', ') || 'nothing');
  const q = (sel) => document.querySelector(sel);

  console.log('== the route switch after S02 keeps shared answers');
  M.setRoute('owner');
  await M.go('orient'); await settle();
  await M.start(); await settle();
  ok('the owner route opens at the Business stage', M.stage === 'section' && M.state.section === 'foundations' && M.route === 'owner', [M.state.section, M.askId]);
  M.commit('win', 'other'); // "another goal": a new venture
  M.state.winOther = 'A new business';
  await M.next(); await settle();
  M.commit('goal', { goal: 1500, appetite: 'moderate', months: 6 });
  const revBefore = M.revision;
  await M.switchRoute('starter'); await settle();
  ok('the route switched and the revision rose', M.route === 'starter' && M.revision === revBefore + 1 && M.state.goal === 1500 && M.state.months === 6, [M.route, M.revision - revBefore, M.state.goal]);
  ok('the starter names', M.sectionsFor().map((s) => s.name).join('/') === 'Starting point/What draws you in/What you can build from/Your direction/Make it practical/Your plan', M.sectionsFor().map((s) => s.name));
  ok('the walk goes on at the starter’s first open stage', M.stage === 'section' && M.INTERVIEW.includes(M.state.section), [M.stage, M.state.section, M.askId]);

  console.log('== the walk');
  const screens = [];
  const sections = [];
  let guard = 0;
  while (M.stage === 'section' && guard++ < 60) {
    const id = M.askId;
    if (!screens.includes(id)) screens.push(id);
    if (!sections.includes(M.state.section)) sections.push(M.state.section);
    // a question this fixture has no answer for is answered Not sure, so a bank that grows does not stall the walk
    if (!(id in ANSWERS)) { console.log('  no fixture for', id, '(answered Not sure)'); await M.notSure(id); await settle(); continue; }
    if (id === 'n27') M.state.direction = { id: 'bookkeeping', recommended: true, buyer: 'owners' };
    M.commit(id, ANSWERS[id]);
    ok(`Continue is on after ${id}`, !q('#next').disabled);
    await M.next(); await settle();
    if (M.stage === 'close') { await M.next(); await settle(); }
  }
  console.log('  screens:', screens.length, screens.join(' '));
  ok('sections in order, by their starter meaning', sections.join(',') === 'foundations,leverage,delivery,aim,customers', sections);
  ok('at most 24 question screens to readiness', screens.length <= 24, screens.length);
  ok('no revenue, retention, ownership or lifetime question on this route', !screens.some((id) => NEVER_ON_STARTER.includes(id)) && !M.orderOf('foundations').some((id) => NEVER_ON_STARTER.includes(id)));
  ok('the readiness screen is reached', M.stage === 'ready' && M.askId === 'readiness');
  const r = M.readiness();
  ok('starter readiness: outcome, time, budget, strengths, a buyer, a test', r.ready === true && r.route === 'starter' && r.missing.length === 0, r);
  ok('progress: Your plan · 6 of 6', M.progressText() === 'Your plan · 6 of 6', [M.progressText(), M.progress().map((x) => `${x.id}:${x.state}`)]);
  ok('the trunk is the chosen direction on this route', M.trunkKnown() === true);

  console.log('== Refine the uncertain parts');
  await M.chooseRefine(); await settle();
  ok('the refinement continues the walk with a second-pass question', M.stage === 'section' && M.askId && M.tierOf(M.askId) === 2, [M.stage, M.state.section, M.askId]);
  const refineScreens = [];
  guard = 0;
  while (M.stage === 'section' && guard++ < 40) {
    const id = M.askId;
    refineScreens.push(id);
    if (id in ANSWERS) M.commit(id, ANSWERS[id]); else { await M.notSure(id); await settle(); continue; }
    await M.next(); await settle();
    if (M.stage === 'close') { await M.next(); await settle(); }
  }
  console.log('  refine screens:', refineScreens.length, refineScreens.join(' '));
  ok('the refinement ends at the results, not a second readiness screen', M.stage === 'explore', M.stage);
  ok('a plan object stands for the current revision', M.plan.current() && M.plan.current().stale === false && M.plan.current().plan.route === 'starter');
  await M.go('plan'); await settle();
  ok('the plan stage is reached', M.stage === 'plan');
  ok('every section done at the results', M.progress().every((x) => x.state === 'done'), M.progress().map((x) => `${x.id}:${x.state}`));
  ok('the wheel text at the results', M.progressText() === 'Your plan · 6 of 6', M.progressText());
  ok('no page errors', errors.length === 0, errors.slice(0, 3));
  a.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
