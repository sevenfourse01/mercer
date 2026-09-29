/* flow, final pack: Tasks 01, 03, 08, 10, 15, 16, 17, 18 and 24.
   Asserts: the session survives About TMA, Help, a theme change and an intro replay, with the step and the draft back;
   one active question everywhere, riders asked in their own right and a context value never queued; both route orders
   and the wheel agreeing; the enquiry window is a real, generated date range; the schema 3 migration from a schema 2
   file keeps every answer; the action row is Back, Not sure, Continue with its space reserved and the press that
   answered one question unable to answer the next. */
const H = require('./flow-harness.cjs');

const stub = (M) => {
  const yes = () => true;
  M.registry = [
    { id: 'biz', route: ['owner'], section: 'foundations', when: yes, tier: 1, key: 'biz' },
    { id: 'place', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'place' },
    { id: 'currency', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'currency', on: 'place', hidden: true },
    { id: 'sector', route: ['owner'], section: 'foundations', when: yes, tier: 1, key: 'sector' },
    { id: 'now', route: ['owner'], section: 'foundations', when: yes, tier: 1, key: 'now' },
    { id: 'win', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'win' },
    { id: 'goal', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'goal' },
    { id: 'months', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'months', on: 'goal', hidden: true },
    // a confirmed value shown for context is not a question: it never joins the queue
    { id: 'nowShown', route: ['owner'], section: 'aim', when: yes, tier: 1, key: 'now', on: 'goal', hidden: true, context: true },
    { id: 'protected', route: ['owner', 'starter'], section: 'aim', when: yes, tier: 1, key: 'protected' },
    { id: 'buyer', route: ['owner'], section: 'customers', when: yes, tier: 1, key: 'buyer' },
    { id: 'capacity', route: ['owner'], section: 'delivery', when: yes, tier: 1, key: 'capacity' },
    { id: 'budget', route: ['owner'], section: 'delivery', when: yes, tier: 1, key: 'budget' },
    { id: 'changeHours', route: ['owner'], section: 'delivery', when: yes, tier: 1, key: 'changeHours' },
    { id: 'help', route: ['owner'], section: 'leverage', when: yes, tier: 1, key: 'help' },
    { id: 'n01', route: ['starter'], section: 'foundations', when: yes, tier: 1, key: 'n01' },
    { id: 'n10', route: ['starter'], section: 'foundations', when: yes, tier: 1, key: 'n10' },
    { id: 'n03', route: ['starter'], section: 'foundations', when: yes, tier: 1, key: 'n03' },
    { id: 'n27', route: ['starter'], section: 'customers', when: yes, tier: 1, key: 'n27' },
    { id: 'n31', route: ['starter'], section: 'delivery', when: yes, tier: 1, key: 'n31' },
    { id: 'n41', route: ['starter'], section: 'leverage', when: yes, tier: 1, key: 'n41' },
  ];
  M.headline = (id) => ({ title: `Q ${id}`, sub: '' });
  M.renderQuestion = (id, host) => {
    host.innerHTML = `<input id="f-${id}" type="text">`;
    const el = host.querySelector('input');
    return { el, get: () => el.value, set: (v) => { el.value = v; }, focus: () => el.focus(), destroy: () => {} };
  };
};

(async () => {
  /* ---------------------------------------------------------------- 10 and 15: the route orders and the wheel */
  console.log('== the new route orders, and the wheel agreeing (Tasks 10, 15)');
  const a = H.boot({ questions: true });
  {
    const { M, ok } = a;
    const names = (r) => M.sectionsFor(r).map((s) => s.name).join(' > ');
    ok('owner: Business first, Aim second', names('owner') === 'Business > Aim > Customers > Delivery > Leverage > Plan');
    ok('starter: the six stages of Task 10', names('starter') === 'Starting point > What draws you in > What you can build from > Your direction > Make it practical > Your plan');
    M.setRoute('owner');
    const wheelOwner = M.progress().map((r) => `${r.index}.${r.name}`).join(' ');
    ok('the wheel agrees on the owner route', wheelOwner === '1.Business 2.Aim 3.Customers 4.Delivery 5.Leverage 6.Plan', wheelOwner);
    ok('Aim is no longer section one', M.progress().find((r) => r.name === 'Aim').index === 2);
    M.setRoute('starter');
    const wheelStarter = M.progress().map((r) => r.name).join(' > ');
    ok('and on the starter route', wheelStarter === 'Starting point > What draws you in > What you can build from > Your direction > Make it practical > Your plan', wheelStarter);
    ok('the interview walks five stages in that order', M.INTERVIEW.join(',') === 'foundations,leverage,delivery,aim,customers', M.INTERVIEW.join(','));
    M.setRoute('owner');
    ok('and the owner walks Business first', M.INTERVIEW.join(',') === 'foundations,aim,customers,delivery,leverage', M.INTERVIEW.join(','));
    // Task 10: nothing venture-specific is asked before a direction has been revealed and selected
    M.setRoute('starter');
    const stageOf = (id) => M.sectionOf(id);
    const order = M.sectionsFor('starter').map((s) => s.id);
    ok('permissions and assets come after the direction', order.indexOf(stageOf('n41')) > order.indexOf(stageOf('n27')) && order.indexOf(stageOf('n42')) > order.indexOf(stageOf('n27')));
    ok('place and currency are known in stage one', stageOf('place') === 'foundations' && stageOf('currency') === 'foundations');
    M.setRoute('owner');
    ok('and on the owner route too', stageOf('place') === 'foundations' && stageOf('currency') === 'foundations');
    ok('no page errors', a.errors.length === 0, a.errors.slice(0, 2));
  }

  /* ---------------------------------------------------------------- 08: one active question */
  console.log('\n== one active question, and the riders (Task 08)');
  const b = H.boot({});
  {
    const { M, document, ok, settle } = b;
    stub(M);
    M.setRoute('owner');
    const aim = M.orderOf('aim');
    ok('a rider is a question of its own, straight behind its host', aim.join(',') === 'win,goal,months,protected', aim.join(','));
    ok('a value marked context: true is never queued', !aim.includes('nowShown') && M.isContextValue('nowShown') === true);
    ok('and the rider on place follows place', M.orderOf('foundations').includes('currency') === false || M.orderOf('foundations').join(',').includes('place,currency'));
    await M.go('orient'); await settle(); await M.start(); await settle();
    await M.go('section', 'aim'); await settle();
    const bodyQuestions = () => document.querySelectorAll('#q-body input').length;
    ok('one question on screen', M.askId === 'win' && bodyQuestions() === 1);
    M.commit('win', 'revenue'); await settle();
    await M.next(); await settle();
    // Task 16: the objective names the metric, so the baseline in that metric is asked before the target
    ok('the baseline comes next, in the objective’s own metric', M.askId === 'now' && bodyQuestions() === 1, M.askId);
    M.commit('now', 8000); await settle();
    await M.next(); await settle();
    ok('then the target, against a Now marker that is a real figure', M.askId === 'goal' && M.baselineNow().value === 8000, M.askId);
    M.commit('goal', 15000); await settle();
    await M.next(); await settle();
    ok('the horizon is the next active question, not a second box on the goal screen', M.askId === 'months' && bodyQuestions() === 1, M.askId);
    ok('no page errors', b.errors.length === 0, b.errors.slice(0, 2));
  }

  /* ---------------------------------------------------------------- 16: the objectives and the baseline */
  console.log('\n== the eight objectives, and the Now marker (Task 16)');
  {
    const { M, ok } = b;
    const ids = M.OBJECTIVES.map((o) => o.id);
    ok('eight distinct objectives', ids.length === 8 && new Set(ids).size === 8, ids.join(','));
    ok('revenue, profit and reach are separate metrics', M.OBJECTIVES.find((o) => o.id === 'revenue').metric !== M.OBJECTIVES.find((o) => o.id === 'profit').metric);
    ok('exploring is one of them', ids.includes('explore') && ids.includes('other'));
    M.state.win = 'profit';
    ok('the objective picks the metric and the baseline key', M.objectiveOf() === 'profit' && M.objective().baseline === 'margin');
    M.state.win = 'revenue'; M.state.now = null;
    ok('an unsupplied baseline is unknown, never a zero', M.baselineNow().known === false && M.baselineNow().value === null);
    M.state.now = 8000;
    ok('and a supplied one is the Now marker', M.baselineNow().value === 8000 && M.baselineNow().source === 'answer');
    ok('personal income is never company profit', M.OBJECTIVES.filter((o) => o.metric === 'profit').length === 1);
  }

  /* ---------------------------------------------------------------- 17: the dated window */
  console.log('\n== the enquiry window, generated with its dates (Task 17)');
  {
    const { M, ok } = b;
    const at = new Date(2026, 8, 25); // 25 September 2026
    const w = M.enquiryWindow(at);
    ok('the last full calendar month, with its dates', w.start === '2026-08-01' && w.end === '2026-08-31', `${w.start} to ${w.end}`);
    ok('shown as a date range, not "a recent period"', w.label === '1 to 31 August 2026', w.label);
    ok('it is generated, not hardcoded', M.enquiryWindow(new Date(2027, 0, 9)).label === '1 to 31 December 2026', M.enquiryWindow(new Date(2027, 0, 9)).label);
    ok('a leap February comes out right', M.enquiryWindow(new Date(2028, 2, 3)).label === '1 to 29 February 2028', M.enquiryWindow(new Date(2028, 2, 3)).label);
    M.state.bizStage = 'year'; M.state.yearsTrading = 0; M.state.estMonth = 9;
    const s = M.enquiryWindow(at);
    ok('a shorter trading history uses a stated window', s.whole === false && s.basis === 'since you began trading' && /2026/.test(s.label), s.label);
    M.state.bizStage = null; M.state.yearsTrading = null; M.state.estMonth = null;
    M.state.enquiries = 20; M.state.quotes = 6;
    const c = M.cohortConversion();
    ok('a cohort conversion divides the same cohort by itself', c.enquiries === 20 && c.bought === 6 && Math.abs(c.rate - 0.3) < 1e-9 && c.window.label === M.enquiryWindow().label);
  }

  /* ---------------------------------------------------------------- 18: capacity, units, money and time apart */
  console.log('\n== capacity from what is done, and money apart from time (Task 18)');
  {
    const { M, ok } = b;
    M.state.repeatWork = 'retainer';
    ok('the unit is the business’s own word, never "units"', M.unitFor().many === 'clients' && M.unitFor().many !== 'units');
    M.state.repeatWork = 'once';
    ok('and it follows what they sell', M.unitFor().many === 'jobs');
    M.state.capacity = 10; M.state.servedNow = 4;
    const cap = M.capacityNow();
    ok('capacity is read off today’s own numbers', cap.can === 10 && cap.doing === 4 && cap.spare === 6 && Math.abs(cap.full - 0.4) < 1e-9);
    M.state.capacity = null; M.state.servedNow = null;
    ok('with nothing supplied it stays unknown', M.capacityNow().full === null);
    ok('no question asks them to guess three months ahead', !M.orderOf('delivery').includes('canDeliverMore'));
    M.state.budget = null; M.state.changeHours = null;
    M.commit('budget', { budget: 500 });
    ok('the budget screen writes money only', M.state.budget === 500 && M.state.changeHours === null);
    M.commit('changeHours', 4);
    ok('and the hours come from their own question', M.state.changeHours === 4 && M.state.budget === 500);
  }

  /* ---------------------------------------------------------------- 03: the action row */
  console.log('\n== the action row (Task 03)');
  const c = H.boot({});
  {
    const { M, document, window, ok, settle } = c;
    stub(M);
    M.setRoute('owner');
    await M.go('orient'); await settle(); await M.start(); await settle();
    await M.go('section', 'aim'); await settle();
    const row = M.actionRow();
    ok('Back, Not sure, Continue, in one order', row.order.join(',') === 'back,unsure,next' && row.inOrder, row.order.join(','));
    ok('the order is the same on the next question', (M.commit('win', 'revenue'), await M.next(), await settle(), M.actionRow().order.join(',')) === 'back,unsure,next');
    // no animation timer stands between an answer and Continue
    M.commit(M.askId, 8000);
    ok('Continue is live on the answer, with no timer', document.querySelector('#next').disabled === false);
    // the press that answered one question cannot answer the next
    const before = M.askId;
    document.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    await M.next(); await settle();
    const after = M.askId;
    await M.next(); await settle();
    ok('one press, one question: the click that confirmed does not submit the next', after !== before && M.askId === after, `${before} > ${after} > ${M.askId}`);
    document.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true }));
    ok('the row reserves the space it has needed', typeof M.actionRow().reserved === 'number');
    ok('no page errors', c.errors.length === 0, c.errors.slice(0, 2));
  }

  /* ---------------------------------------------------------------- 01: the session through internal navigation */
  console.log('\n== the session survives every internal navigation (Task 01)');
  const d = H.boot({});
  {
    const { M, document, window, ok, settle } = d;
    stub(M);
    M.setRoute('owner');
    await M.go('orient'); await settle(); await M.start(); await settle();
    await M.go('section', 'aim'); await settle();
    M.commit('win', 'revenue'); await settle();
    await M.next(); await settle();
    const at = M.askId;
    const field = document.querySelector('#q-body input');
    field.value = '15000 or so';
    ok('a session is live, with an answer and an unfinished field', M.state.win === 'revenue' && Boolean(at) && M.session.live() === true, at);

    // About TMA: the in-app panel holds the step, and the walk is put back when it closes
    const about = document.querySelector('#about-tma');
    const panel = document.querySelector('#about-panel');
    about.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    panel.setAttribute('open', '');
    ok('About TMA holds the step, with its draft', M.session.held() !== null && M.session.held().questionId === at && M.session.held().draft.value === '15000 or so');
    // the panel takes the screen, and the instrument with it
    document.querySelector('#q-body').innerHTML = '';
    panel.removeAttribute('open');
    panel.dispatchEvent(new window.Event('close'));
    await settle();
    ok('and every answer, the step and the draft are back', M.state.win === 'revenue' && M.askId === at && document.querySelector('#q-body input').value === '15000 or so');

    // a link that would take the page away opens in a new tab instead, while a session is live
    let opened = null;
    window.open = (href) => { opened = href; return null; };
    const out = document.createElement('a');
    out.href = 'https://themissionautomation.com';
    document.body.appendChild(out);
    const click = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    out.dispatchEvent(click);
    await settle();
    ok('a link out never unloads a live session', click.defaultPrevented === true && String(opened).includes('themissionautomation'), String(opened));

    // Help: the same hold, closed the dialog's own way
    document.querySelector('#help').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    ok('Help holds the step too', M.session.held() !== null && M.session.held().why === 'help');
    document.querySelector('#q-body').innerHTML = '';
    document.querySelector('#help-panel').dispatchEvent(new window.Event('close'));
    await settle();
    ok('Help returns to the same question with the draft back', M.askId === at && document.querySelector('#q-body input').value === '15000 or so');

    // the theme
    M.setMode('dark', true);
    ok('a theme change moves nothing', M.askId === at && M.state.win === 'revenue' && M.stage === 'section');
    M.setMode('light', true);

    // the intro replayed from Help, and the way back
    await M.go('intro'); await settle();
    ok('the intro holds the step it was asked from', M.stage === 'intro' && M.session.held() !== null && M.session.held().questionId === at);
    await M.session.resume(); await settle();
    ok('and the walk comes back to the same question', M.stage === 'section' && M.state.section === 'aim' && M.askId === at);

    // the brand mark is a way home, never a reset
    document.querySelector('#wordmark').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await settle();
    ok('the brand mark goes home and keeps the answers', M.stage === 'arrival' && M.state.win === 'revenue');
    ok('the homepage offers the session back with nothing saved', document.querySelector('#resume').hidden === false && M.save.on === false);
    await M.resume(); await settle();
    ok('and Continue your plan puts the visitor back on the question', M.stage === 'section' && M.askId === at);
    ok('saving was never silently turned on', M.save.on === false && window.localStorage.getItem('mercer-answers') === null);
    ok('no page errors', d.errors.length === 0, d.errors.slice(0, 3));
  }

  /* ---------------------------------------------------------------- 24: the schema 3 migration */
  console.log('\n== schema 3, migrated from a schema 2 file (Task 24)');
  const two = JSON.stringify({
    schema: 2, sessionId: 'old-1', savedAt: '2026-09-01T10:00:00.000Z', revision: 7, route: 'owner',
    activeSection: 'aim', activeQuestionId: 'now',
    answers: { win: 'income', goal: 15000, months: 12, sector: 'professional', now: 8000, price: 2000, margin: 0.6, place: 'Leeds', currency: 'GBP', buyer: 'micro', canDeliverMore: 'no', changeHours: 4, budget: 500, capacity: 8, servedNow: 4, who: 1 },
    unknowns: ['market'], na: [], evidence: { now: { state: 'user' } }, imported: [], selectedDirection: null, plan: null, planRevision: null,
    prefs: { saveOn: true }, walk: { asked: ['win', 'goal', 'sector', 'now'], passed: [], closed: ['aim'], planted: true, readyOffered: false, refining: false, stage: 'section' },
  });
  const e = H.boot({ storage: { 'mercer-answers': two } });
  {
    const { M, ok } = e;
    const v = M.save.review ? null : null;
    ok('a schema 2 file is restored, not refused', M.save.restored === true && M.save.lastError === null);
    const s = M.state;
    ok('every answer is carried over', s.win === 'income' && s.goal === 15000 && s.now === 8000 && s.price === 2000 && s.margin === 0.6 && s.place === 'Leeds' && s.buyer === 'micro' && s.capacity === 8);
    ok('the marks and the walk come with it', s.notSure.has('market') && M.revision === 7 && s.asked.includes('sector'));
    ok('a retired key is mapped, never dropped', s.turnedAway === 'yes' && s.canDeliverMore === 'no');
    ok('the hours keep their own key', s.changeHours === 4 && s.budget === 500);
    // the step follows its question: `now` is asked in Business on the new route
    ok('the step moves to the stage that asks that question now', M.save.at.questionId === 'now' && M.save.at.section === 'foundations', JSON.stringify(M.save.at));
    ok('the next write is schema 3', M.save.snapshot().schema === 3);
    ok('and a schema 3 file round-trips', (() => { const t = JSON.stringify(M.save.snapshot()); const r = H.boot({ storage: { 'mercer-answers': t } }); const okNow = r.M.save.restored && r.M.state.now === 8000 && r.M.state.turnedAway === 'yes'; return okNow; })());
    ok('nothing unreadable was invented', v === null);
    ok('no page errors', e.errors.length === 0, e.errors.slice(0, 3));
  }

  /* ---------------------------------------------------------------- the planner contract */
  console.log('\n== what the planner is given (Task 24)');
  {
    const { M, ok } = e;
    const ctx = M.planContext();
    ok('the route, the person and the goal', ctx.route === 'owner' && ctx.person.place === 'Leeds' && ctx.goal.objective === 'revenue');
    ok('the baseline, the horizon and the protected constraints are named', 'baseline' in ctx.goal && 'horizonMonths' in ctx.goal && Array.isArray(ctx.goal.protectedConstraints));
    ok('the window and the operational facts', ctx.operations.window.label === M.enquiryWindow().label && ctx.operations.unit.many.length > 0);
    ok('sources are kept apart from assumptions', Array.isArray(ctx.evidence.sources) && Array.isArray(ctx.evidence.assumptions));
    ok('and the economics module owns the figures', 'econ' in ctx && ctx.econ.available === Boolean(M.econ));
    ok('the instruction says what it must', /Do not ask them to forecast their own future/.test(M.planInstruction()) && /Never invent fit probabilities/.test(M.planInstruction()));
  }

  // every boot's failures count: finish() only knows the boot it belongs to
  const others = [a, b, c, d];
  const stray = others.reduce((n, x) => n + x.errors.length, 0);
  if (stray) { console.log('\npage errors in an earlier boot:', others.flatMap((x) => x.errors).slice(0, 3)); process.exit(1); }
  e.finish();
})();
