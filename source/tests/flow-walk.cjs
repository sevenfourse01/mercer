/* flow, rebuild 1: the walk's mechanics that the journeys do not spell out. The registry contract (R5) on a stub
   registry: order, route, satisfiedBy, priority, a section with nothing applying marked Not needed with a reason; the
   next-question policy; Back across sections; a jump back from the tree during the walk and the return; a section
   opened for review from the wheel; the inspect chip's words and evidence; the close screen only on a deterministic
   insight (a contradiction here) and none for a plain section; the import step never blocks Continue; arrow keys
   inside the wheel panel move nothing; the currency symbol follows the place. */
const H = require('./flow-harness.cjs');

(async () => {
  console.log('== a stub registry (the R5 contract)');
  const a = H.boot({});
  {
    const { M, ok, settle } = a;
    const yes = () => true;
    M.registry = [
      { id: 'win', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1 },
      { id: 'goal', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1 },
      { id: 'protected', route: ['owner', 'starter'], section: 'aim', when: yes, priority: 'refine' },
      { id: 'sector', route: ['owner'], section: 'foundations', when: yes, tier: 1, satisfiedBy: ['import:offer'] },
      { id: 'now', route: ['owner'], section: 'foundations', when: yes, tier: 1 },
      { id: 'n03', route: ['starter'], section: 'foundations', when: yes, tier: 1, key: 'n03' },
      { id: 'n05', route: ['starter'], section: 'foundations', when: yes, tier: 1, key: 'n05' },
      { id: 'buyer', route: ['owner'], section: 'customers', when: yes, tier: 1 },
      { id: 'decider', route: ['owner'], section: 'customers', when: (s) => s.buyer === 'micro', tier: 2 },
      { id: 'n19', route: ['starter'], section: 'customers', when: yes, tier: 1, key: 'n19' },
      { id: 'capacity', route: ['owner'], section: 'delivery', when: yes, tier: 1 },
      { id: 'n35', route: ['starter'], section: 'delivery', when: yes, tier: 1, key: 'n35' },
      { id: 'help', route: ['owner'], section: 'leverage', when: () => false, tier: 1 },
      { id: 'readiness', route: ['owner', 'starter'], section: 'plan', when: yes, tier: 1 },
    ];
    M.headline = (id) => ({ title: `Q ${id}`, sub: '' });
    M.renderQuestion = (id, host) => { host.textContent = id; return null; };
    M.setRoute('owner');
    ok('the registry orders the owner sections', M.orderOf('aim').join(',') === 'win,goal,protected' && M.orderOf('foundations').join(',') === 'sector,now' && M.orderOf('customers').join(',') === 'buyer,decider');
    // the starter stages of Task 10: time and money and buyer familiarity in "What you can build from", the offer in
    // "Make it practical". An id keeps its id where it moves; the stage it is asked in is the route's own table
    ok('and the starter sections, by route', (M.setRoute('starter'), M.orderOf('delivery').join(',') === 'n03,n05,n19' && M.orderOf('customers').join(',') === 'n35' && M.orderOf('leverage').length === 0), [M.orderOf('delivery'), M.orderOf('customers'), M.orderOf('foundations')]);
    M.setRoute('owner');
    ok('priority refine is the second pass', M.tierOf('protected') === 2 && M.tierOf('win') === 1);
    ok('a when() that fails is out', M.applies('decider') === false && (M.state.buyer = 'micro', M.applies('decider') === true));
    M.state.buyer = null;
    M.state.imported = [{ field: 'offer', value: 'Bookkeeping', status: 'confirmed' }];
    ok('a confirmed import field satisfies its question', M.satisfied('sector') === true && (M.state.imported = [{ field: 'offer', value: 'x', status: 'found' }], M.satisfied('sector') === false));
    M.state.imported = [];
    await M.go('orient'); await settle();
    // the final pack establishes the business before its ambition: the first screen is the Business stage
    ok('the policy names the first screen before the walk', M.nextQuestion().id === 'sector' && M.nextQuestion().section === 'foundations', M.nextQuestion());
    await M.start(); await settle();
    ok('and the screen after the one on screen once it runs', M.nextQuestion().id === 'now', M.nextQuestion());
    M.commit('sector', 'professional'); await M.next(); await settle();
    M.commit('now', 9000); await M.next(); await settle();
    ok('the second pass is skipped in the first', M.askId === 'win' && M.state.section === 'aim', [M.askId, M.state.section]);
    M.commit('win', 'income'); await M.next(); await settle();
    M.commit('goal', 5000); await M.next(); await settle();
    ok('planted after the Business stage', M.askId === 'buyer' && M.state.section === 'customers', [M.askId, M.state.section]);
    M.commit('buyer', 'micro'); await M.next(); await settle();
    ok('delivery next; the readiness stop needs a resource answer', M.state.section === 'delivery');
    M.commit('capacity', 12); await M.next(); await settle();
    const rows = M.progress();
    ok('leverage is Not needed with a reason: nothing in it applies', rows.find((r) => r.id === 'leverage').notNeeded === true && /Nothing here/.test(rows.find((r) => r.id === 'leverage').reason), rows.map((r) => `${r.id}:${r.state}:${r.notNeeded}`));
    ok('the plan is preliminary when the first pass runs out without readiness', M.stage === 'explore' && M.readiness().preliminary === true && M.readiness().missing.includes('budget'), [M.stage, M.readiness()]);
    ok('no errors', a.errors.length === 0, a.errors.slice(0, 2));
  }

  console.log('== the walk with questions.js');
  const b = H.boot({ questions: true });
  const { M, document, ok, settle, sleep, errors } = b;
  const q = (sel) => document.querySelector(sel);
  // Continue, and through a close screen when the boundary earned one
  const on = async () => { await M.next(); await settle(); if (M.stage === 'close') { await M.next(); await settle(); } };
  M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
  /* the walk is driven by what is on screen: the route order is the final pack's, Business before Aim */
  const FIX = {
    biz: 'Acme', place: { place: 'Leeds' }, currency: 'GBP', import: '', role: 'owner',
    sector: { sector: 'professional', trade: 'Consultancy' }, repeatWork: 'repeat', stage: 'established', payModel: ['perjob'],
    now: 8000, price: 2000, retainer: { min: 500, max: 1500, avg: 1000 }, volume: { volume: 4, period: 'month' },
    win: 'income', goal: { goal: 15000, appetite: 'moderate', months: 12 }, months: 12, protected: ['income'],
  };
  const SKIP_NOW = false;
  const drive = async (until, max = 40) => {
    for (let i = 0; i < max; i += 1) {
      if (M.stage === 'close') { await M.next(); await settle(); continue; }
      if (M.stage !== 'section') return M.askId;
      const id = M.askId;
      if (!id || id === until) return id;
      if (id === 'now' && SKIP_NOW) { await M.notSure('now'); await settle(); continue; }
      if (id in FIX) M.commit(id, FIX[id]);
      await M.next(); await settle();
    }
    return M.askId;
  };
  await drive('win');
  ok('the Business stage comes first, and the Aim follows it', M.state.section === 'aim' && M.askId === 'win', [M.state.section, M.askId]);
  await M.back(); await settle();
  ok('Back crosses the section boundary to the last Business question', M.state.section === 'foundations' && M.askId !== 'win', [M.state.section, M.askId]);
  await on();
  ok('Continue returns to the aim', M.state.section === 'aim' && M.askId === 'win', [M.state.section, M.askId]);
  await drive('buyer');
  ok('customers, after planting', M.state.section === 'customers' && M.askId === 'buyer' && M.stage === 'section', [M.state.section, M.askId, M.stage]);
  ok('the currency symbol is the pound by default', M.gbp(66) === '£66' && M.currencySymbol() === '£' && M.ukBenchmarks() === true);

  console.log('== a jump back from the tree, and the return');
  const here = M.askId;
  await M.reopen('goal'); await settle();
  ok('the aim question opens alone during the walk', M.askId === 'goal' && M.state.section === 'aim');
  const ins = M.inspect('goal');
  ok('the inspect chip: title, words, evidence, and no change while it is on screen', ins.title === 'Target' || /target|success/i.test(ins.title) ? ins.words === '£15,000' && ins.source === 'Your answer' && ins.evidence === 'user' && ins.canChange === false : false, ins);
  M.commit('goal', { goal: 18000, appetite: 'moderate', months: 12 });
  await M.next(); await settle();
  ok('Continue returns to where the walk stood', M.askId === here && M.state.section === 'customers', [M.askId, here]);
  ok('the chip on a limb names the group and its answers', (() => { const i = M.inspect('limb:pricing'); return i && /Price/.test(i.title) && /of/.test(i.words) && i.canChange === false; })(), M.inspect('limb:pricing'));

  console.log('== a section opened for review from the wheel');
  await M.review('aim'); await settle();
  ok('the aim opens at its first question', M.state.section === 'aim' && M.askId === 'win');
  await M.back(); await settle();
  ok('Back returns to the walk', M.askId === here && M.state.section === 'customers');

  console.log('== the close screen only on a deterministic insight');
  // 28 September: segment, repeat and deliveryMode moved to the refinement pass, so the first pass does not stop on them.
  // Their answers still stand here, because the boundary reads the answers, not the screens they were given on.
  M.commit('segment', 'owner-managed trades');
  M.commit('repeat', 'sometimes');
  M.commit('deliveryMode', ['remote']);
  M.commit('buyer', 'micro'); await M.next(); await settle();
  M.commit('channel', { doing: ['referrals'], tried: [], went: {}, channel: 'referral' }); await M.next(); await settle();
  // a contradiction: 40 enquiries at 9 in 10 against revenue ÷ price of 4 sales a month
  M.commit('enquiries', { enquiries: 40, wins: 36, enquiryPeriod: 'month', closeRate: 0.9, quotes: 40 }); await M.next(); await settle();
  ok('the customers boundary earned a close screen: a contradiction', M.stage === 'close' && q('#q-insight').textContent.length > 0, [M.stage, q('#q-insight').textContent]);
  ok('the insight is short and deterministic', q('#q-insight').textContent.split(/\s+/).length <= 45 && M.sectionInsight('customers').kind === 'contradiction');
  ok('Continue is on at once on the close screen', !q('#next').disabled);
  await M.next(); await settle();
  ok('delivery follows', M.state.section === 'delivery');
  ok('the aim had no close screen: nothing deterministic to say', M.sectionInsight('aim') === null);

  console.log('== the import step never blocks, and the keys');
  M.state.asked.push('import'); // a refinement screen, reached here through the tree
  await M.reopen('import'); await settle();
  ok('the import step opens with Continue on and nothing given', M.askId === 'import' && !q('#next').disabled);
  const panel = document.createElement('div'); panel.id = 'wheel-panel'; document.body.appendChild(panel);
  const btn = document.createElement('button'); panel.appendChild(btn); btn.focus();
  const at = M.askId;
  btn.dispatchEvent(new b.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await settle();
  ok('an arrow inside the wheel panel moves no question', M.askId === at);
  await M.next(); await settle();

  console.log('== the currency follows the place (R22)');
  M.commit('place', { place: 'Dublin, Ireland' });
  ok('an Irish place suggests the euro and turns the UK benchmarks off', M.state.country === 'IE' && M.state.currency === 'EUR' && M.gbp(66) === '€66' && M.ukBenchmarks() === false);
  M.commit('currency', 'GBP');
  ok('the currency stays editable', M.state.currency === 'GBP' && M.gbp(66) === '£66');
  M.commit('place', { place: 'Leeds, England' });
  ok('a UK town: GB, pounds, benchmarks on', M.state.country === 'GB' && M.ukBenchmarks() === true, [M.state.country]);

  ok('no page errors', errors.length === 0, errors.slice(0, 3));
  b.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
