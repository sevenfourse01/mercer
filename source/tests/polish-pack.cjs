/* the polish pack of 1 October (notes/POLISH-BRIEF.md): the pass conditions that can be held in node.
   3  budget cadence: £500 one-off and £25 a month are two labelled quantities, never £525 a month;
   8  nought is an answer to unpaid invoices, and Continue stands at once;
   9  a required line (the business name) enables Continue while it is typed, before any blur;
   10 cheap, quick capacity moves the recommendation; slow, costly capacity leaves the limit first and says why;
   15 Start again clears the answers and the saved copy, and no empty session is written after it;
   7.2 the second round (Sharpen my plan) never asks a question round one answered.
   Real page in jsdom (tests/flow-harness.cjs) and the brain in a bare context; nothing here calls a provider.
   node tests/polish-pack.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const H = require('./flow-harness.cjs');
const KEY = 'mercer-answers';
const root = path.join(__dirname, '..');

/* ---------- the brain on its own: section 3 and section 10 ---------- */
class CustomEvent { constructor(type, o) { this.type = type; this.detail = o?.detail; } }
const loadBrain = (state) => {
  const M = { state, revision: 3 };
  const window = { Mercer: M, matchMedia: () => ({ matches: false }), innerWidth: 1440, addEventListener() {} };
  const document = { addEventListener() {}, dispatchEvent() { return true; }, createElementNS: () => ({ setAttribute() {}, appendChild() {}, style: {} }) };
  const ctx = vm.createContext({ window, document, CustomEvent, console, AbortController, performance: { now: () => 0 }, requestAnimationFrame: (f) => f(0), cancelAnimationFrame() {}, navigator: { platform: 'test' }, setTimeout, clearTimeout, URL, Blob: class {}, TextEncoder, TextDecoder, structuredClone });
  ['starter.js', 'plan.js', 'model.js', 'macro.js', 'freetools.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
  return window.Mercer;
};
let pass = 0, fail = 0;
const ok = (cond, msg, detail) => { if (cond) { pass++; console.log(`ok   ${msg}`); } else { fail++; console.log(`FAIL ${msg}${detail !== undefined ? ` ${JSON.stringify(detail).slice(0, 300)}` : ''}`); } };
const owner = (over) => ({
  route: 'owner', currency: 'GBP', notSure: new Set(), na: new Set(), imported: [],
  biz: 'Hartley Joinery', sector: 'construction', trade: 'Joinery', place: 'Leeds', win: 'income', goal: 13000, months: 9, now: 9000, price: 1800, margin: 0.45,
  repeatWork: 'once', buyer: 'consumer', deliveryMode: 'travel', radius: 'county', who: 2, servedNow: 8, enquiries: 20, closeRate: 0.6, canDeliverMore: 'no', breaksFirst: 'me',
  worry: 'delivery', hours: 40, changeHours: 4, budget: 25, oneOff: 500, terms: 'completion', reviews: 'few', responseTime: 'days', followUps: 1, priceRaised: 'recent', discounting: 'never',
  channel: 'referral', doing: ['referral'], lastFive: [{ bin: 'warm11' }, { bin: 'warm11' }, { bin: 'cold11' }], delegation: 'checks', holiday: 'slows', subcontract: 'maybe', chooseYou: ['quality'], chooseThem: ['timing'], access: ['contacts'], market: 40, wontDo: ['cold'],
  ...over,
});

console.log('== 3: the budget is two quantities');
{
  const M = loadBrain(owner({ capacity: 8 }));
  const pl = M.plan.build(M.state);
  const rt = pl.resourceTotals;
  ok(rt && rt.oneOff && rt.oneOff.available === 500, 'the one-off budget reaches the plan as £500 one-off (it was read under a key no question wrote)', rt && rt.oneOff);
  ok(rt && rt.recurring && rt.recurring.available === 25 && rt.recurring.period === 'a month', 'the monthly budget reaches the plan as £25 a month', rt && rt.recurring);
  const text = JSON.stringify(pl);
  ok(!/525/.test(text), 'no figure in the plan adds the two into £525');
  ok(rt && rt.hours && rt.hours.weekly === 4, 'the hours the plan may spend are the extra hours (4), not the 40 worked in the business', rt && rt.hours);
}

console.log('== 10: capacity that can change, and capacity that cannot');
{
  // the brief's fixture in a month: converted demand 12 a week is 52 a month against 35 delivered; 4 more a week is easy with a helper
  const easy = loadBrain(owner({ capacity: 35, servedNow: 35, enquiries: 85, closeRate: 0.6, moreWork: 'helper', moreWorkAmount: 17, moreWorkLead: 'weeks', moreWorkCost: 0 }));
  const pe = easy.plan.build(easy.state);
  ok(pe.firstAction && pe.firstAction.id === 'capacity-add', 'cheap, quick capacity with a helper is the first action', pe.firstAction && pe.firstAction.id);
  ok(/helper|spare/.test(String(pe.firstAction?.action)) && /demand becomes the limit|next limit|demand/i.test(String(pe.firstAction?.whyFirst)), 'the action names the way and says where demand becomes the next limit', pe.firstAction && pe.firstAction.whyFirst);
  ok(pe.constraintChain && /Delivery/.test(pe.constraintChain.current) && /Demand/.test(pe.constraintChain.likely), 'the chain reads delivery now, demand next', pe.constraintChain);
  const slow = loadBrain(owner({ capacity: 35, servedNow: 35, enquiries: 85, closeRate: 0.6, moreWork: 'hire', moreWorkAmount: 17, moreWorkLead: 'months', moreWorkCost: 5000, oneOff: 500 }));
  const ps = slow.plan.build(slow.state);
  ok(ps.firstAction && ps.firstAction.id !== 'capacity-add', 'slow, costly capacity (£5,000 against a £500 one-off) does not come first', ps.firstAction && ps.firstAction.id);
  const limit = (ps.actions ?? []).find((a) => a.id === 'capacity-limit');
  ok(limit && /hiring, buying or building/.test(String(limit.whyFirst)), 'the limit action says why it comes before adding capacity', limit && limit.whyFirst);
  const none = loadBrain(owner({ capacity: 35, servedNow: 35, enquiries: 85, closeRate: 0.6, moreWork: 'no' }));
  const pn = none.plan.build(none.state);
  const limitN = (pn.actions ?? []).find((a) => a.id === 'capacity-limit');
  ok(pn.firstAction && pn.firstAction.id !== 'capacity-add' && limitN && /quality or margin/.test(String(limitN.whyFirst)), 'capacity that would cost quality or margin keeps the limit, and the limit says so', limitN && limitN.whyFirst);
}

(async () => {
  console.log('== 8 and 9: nought on unpaid invoices, Continue while typing');
  {
    const a = H.boot({ questions: true });
    const { M, document, settle, sleep } = a;
    M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
    await M.showQuestion('owed'); await settle();
    const fig = document.querySelector('#q-body input.figure');
    ok(!!fig && document.querySelector('#next').disabled === true, 'Owed opens with Continue off');
    fig.value = '0'; fig.dispatchEvent(new a.window.Event('input', { bubbles: true })); await sleep(30);
    ok(document.querySelector('#next').disabled === false, '£0 typed enables Continue at once, before any blur');
    fig.dispatchEvent(new a.window.Event('blur')); await sleep(30);
    ok(M.state.owed === 0, 'nought is kept as nought, not as missing', M.state.owed);
    fig.value = '-5'; fig.dispatchEvent(new a.window.Event('input', { bubbles: true })); await sleep(30);
    ok(document.querySelector('#next').disabled === true, 'a negative amount is not an answer');
    await M.showQuestion('biz'); await settle();
    const line = document.querySelector('#q-body textarea, #q-body input[type="text"]');
    ok(!!line, 'Business name is a line');
    line.value = ''; line.dispatchEvent(new a.window.Event('input', { bubbles: true })); await sleep(30);
    ok(document.querySelector('#next').disabled === true, 'an empty name holds Continue');
    line.value = 'Hartley Joinery'; line.dispatchEvent(new a.window.Event('input', { bubbles: true })); await sleep(30);
    ok(document.querySelector('#next').disabled === false, 'the name typed enables Continue while the field still has focus');
    line.value = '   '; line.dispatchEvent(new a.window.Event('input', { bubbles: true })); await sleep(30);
    ok(document.querySelector('#next').disabled === true, 'whitespace alone is not an answer');
    ok(a.errors.length === 0, 'no page errors', a.errors.slice(0, 2));
  }

  console.log('== 3: the budget screen, one-off first, monthly revealed');
  {
    const a = H.boot({ questions: true });
    const { M, document, settle, sleep } = a;
    M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
    await M.showQuestion('spend'); await settle();
    const body = document.querySelector('#q-body');
    const caps = () => [...body.querySelectorAll('.q-part')].filter((p) => !p.hidden).map((p) => p.querySelector('.q-cap')?.textContent ?? '');
    ok(caps().length === 1 && /One-off budget/.test(caps()[0]) && body.querySelector('.q-stage').hidden === true, 'only the one-off amount is asked first', caps());
    const fig = body.querySelector('input.figure');
    fig.value = '500'; fig.dispatchEvent(new a.window.Event('input', { bubbles: true })); fig.dispatchEvent(new a.window.Event('blur')); await sleep(40);
    ok(M.state.oneOff === 500 && body.querySelector('.q-stage').hidden === false && body.querySelector('.q-fact').hidden === false && /£500/.test(body.querySelector('.q-fact').textContent), 'accepted, the one-off stands as a line with Change and the monthly amount is revealed', { oneOff: M.state.oneOff, fact: body.querySelector('.q-fact').textContent });
    ok(document.querySelector('#next').disabled === true, 'Continue waits for the monthly amount');
    const figs = [...body.querySelectorAll('input.figure')];
    const month = figs[figs.length - 1];
    month.value = '25'; month.dispatchEvent(new a.window.Event('input', { bubbles: true })); month.dispatchEvent(new a.window.Event('blur')); await sleep(40);
    ok(M.state.budget === 25 && M.state.oneOff === 500 && document.querySelector('#next').disabled === false, 'both amounts stand, apart, and Continue is on', { budget: M.state.budget, oneOff: M.state.oneOff });
    body.querySelector('.q-fact').click(); await sleep(20);
    ok(body.querySelector('.q-fact').hidden === true && caps().some((c) => /One-off budget/.test(c)), 'Change reopens the one-off amount');
    ok(a.errors.length === 0, 'no page errors', a.errors.slice(0, 2));
  }

  console.log('== 15: Start again clears the answers and the saved copy');
  {
    const a = H.boot({ questions: true });
    const { M, document, window, settle, sleep } = a;
    M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
    M.commit('win', 'income'); await sleep(600);
    ok(window.localStorage.getItem(KEY) !== null, 'an answer is saved (saving is on by default)');
    await M.go('arrival'); await settle();
    const restart = document.querySelector('#restart');
    ok(!!restart, 'Start again stands on the homepage');
    restart.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await sleep(30);
    const row = document.querySelector('#restart-confirm');
    ok(!!row && row.hidden === false && /cleared/.test(row.textContent) && !!document.querySelector('#restart-yes') && !!document.querySelector('#restart-no'), 'with progress to lose, Start again asks once');
    document.querySelector('#restart-no').dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await sleep(20);
    ok(row.hidden === true && M.state.win === 'income' && window.localStorage.getItem(KEY) !== null, 'Keep my plan keeps everything');
    restart.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await sleep(20);
    document.querySelector('#restart-yes').dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await settle(); await sleep(700);
    ok(M.state.win == null && M.state.route == null, 'Yes clears the answers and the route', { win: M.state.win, route: M.state.route });
    ok(window.localStorage.getItem(KEY) === null, 'the saved copy is gone, and no empty session was written after it');
    ok(document.querySelector('#route-owner') && !document.querySelector('#route-owner').closest('[hidden]'), 'the route cards are back');
    ok(a.errors.length === 0, 'no page errors', a.errors.slice(0, 2));
  }

  console.log('== 7.2: the second round asks nothing round one answered');
  {
    const ANSWERS = {
      win: 'income', goal: { goal: 15000, appetite: 'moderate', months: 12 }, place: { place: 'Leeds' },
      sector: { sector: 'professional', trade: 'Consultancy' }, repeatWork: 'repeat', stage: 'established', payModel: ['perjob'],
      now: 8000, bestWorst: [11000, 5000], price: 2000, retainer: { min: 500, max: 1500, avg: 1000 }, margin: 0.6, volume: { volume: 4, period: 'month' }, import: '',
      buyer: 'micro', lastFive: null, segment: 'owner-managed trades', trigger: 'growth', decider: 'owner', channel: { doing: ['referrals'], tried: [], went: {}, channel: 'referral' },
      went: {}, market: 400, access: ['contacts'], enquiries: { enquiries: 10, wins: 3, enquiryPeriod: 'month', closeRate: 0.3, quotes: 8 }, chooseThem: ['price'],
      repeat: 'sometimes', returned: { group: 10, returned: 4 }, stay: 12, deliveryMode: ['remote'], radius: 'county', reviews: 'some',
      biz: 'Acme Consulting', role: 'owner', turnedAway: 'no', capacity: { who: 1, servedNow: 4, capacity: 8 }, breaksFirst: 'me', moreWork: 'spare', hours: 30, worry: 'sales', holdup: 'followup', software: { names: {}, fees: {} },
      spend: { budget: 500, spendNow: 200, oneOff: 0, changeHours: 4 }, terms: 'thirty', wontDo: ['none'],
      strengths: { strengths: ['delivering'], avoids: [] }, energy: { gives: ['delivering'], drains: ['admin'] }, help: 'alone', network: ['introducers'], networkStrength: 'warm', asked: 'notyet',
      decisionRights: 'me', plannedChanges: ['none'], personality: null,
    };
    const a = H.boot({ questions: true });
    const { M, document, settle, sleep } = a;
    M.setRoute('owner'); await M.go('section'); await settle(); await M.start(); await settle();
    const one = [], unsure = [];
    let guard = 0;
    const walk = async (into) => {
      while (M.stage === 'section' && guard++ < 120) {
        const id = M.askId;
        into.push(id);
        if (!(id in ANSWERS) || ANSWERS[id] === null) { unsure.push(id); await M.notSure(id); await settle(); continue; }
        M.commit(id, ANSWERS[id]);
        await M.next(); await settle();
        if (M.stage === 'close') { await M.next(); await settle(); }
        if (M.askId === id && M.stage === 'section') { await M.notSure(id); await settle(); }
      }
    };
    await walk(one);
    ok(M.stage === 'ready' && M.askId === 'readiness', `round one ends at the readiness screen after ${one.length} screens`, { stage: M.stage, ask: M.askId });
    const answeredOne = one.filter((id) => !unsure.includes(id));
    const title = document.querySelector('#q-title')?.textContent ?? '';
    ok(/First-pass plan/i.test(title), 'the readiness screen is titled First-pass plan', title);
    await M.chooseRefine(); await settle();
    const two = [];
    guard = 0;
    await walk(two);
    const repeats = two.filter((id) => answeredOne.includes(id));
    ok(two.length > 0 && M.stage !== 'section', `round two ran (${two.length} screens) and finished`, { two, stage: M.stage });
    ok(repeats.length === 0, 'round two asked nothing round one had answered', repeats);
    ok(M.state.readinessChoice === 'refine' && Number.isFinite(M.state.refineFrom), 'the round is recorded for the plan to say what it added');
    ok(a.errors.length === 0, 'no page errors', a.errors.slice(0, 2));
  }

  console.log('== 7.2 and 7.1: coverage by meaning, the validated question graph');
  {
    const a = H.boot({ questions: true });
    const { M, settle } = a;
    M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
    ok(M.coverage('changeHours') && M.coverage('changeHours').quantity === 'extra hours' && M.coverage('hours').quantity === 'hours worked', 'hours worked and extra hours carry different coverage, so both are asked');
    M.commit('hours', 40); await settle();
    ok(M.coveredBy('changeHours') === null, 'the hours worked never stand for the extra hours');
    ok(M.registry.find((e) => e.id === 'moreWork').importance === 3 && M.registry.find((e) => e.id === 'owed').importance === 1, 'importance and effort stand on the registry');
    const v = M.adapt.validate(['moreWork', 'hours', 'nonsense', 'currency']);
    ok(v.ok.join(',') === 'moreWork' && v.dropped.some((d) => d.id === 'hours' && d.why === 'answered') && v.dropped.some((d) => d.id === 'nonsense' && d.why === 'unknown') && v.dropped.some((d) => d.id === 'currency'), 'a proposed question set is validated: answered, unknown and context ids are dropped and named', v);
    ok(a.errors.length === 0, 'no page errors', a.errors.slice(0, 2));
  }

  console.log('== 10.3 and 4: stage questions by business, nought extra hours');
  {
    const M = loadBrain(owner({ capacity: 35, servedNow: 35, enquiries: 85, closeRate: 0.6, sellsPrimary: 'product', stockLimit: 'ship', changeHours: 0 }));
    const pl = M.plan.build(M.state);
    ok(pl.constraintChain && /packing and shipping/.test(pl.constraintChain.current), 'a product business names the stage that gives first in the chain', pl.constraintChain);
    ok(pl.firstAction && (pl.firstAction.id === 'fit-hours' || /Free two hours a week first/.test(String(pl.firstAction.prerequisite))), 'nought extra hours puts a time-release step first (the fit-resolving step, or the prerequisite)', pl.firstAction && { id: pl.firstAction.id, action: pl.firstAction.action, pre: pl.firstAction.prerequisite });
    ok(pl.resourceTotals && /no extra hours/.test(String(pl.resourceTotals.hours.note)), 'and the resource note says so', pl.resourceTotals && pl.resourceTotals.hours);
    const reg = require('fs').readFileSync(require('path').join(root, 'questions.js'), 'utf8');
    ok(/id: 'stockLimit'[^\n]*sellsPrimary === 'product'/.test(reg) && /id: 'buildLimit'[^\n]*sellsPrimary === 'subscription'/.test(reg), 'the fulfilment question is a product seller\'s and the build-or-support question a subscription seller\'s; a bespoke service gets neither');
  }

  console.log('== cockpit 6: the partnerships family and the category-first selector');
  {
    const M = loadBrain({ route: 'starter', currency: 'GBP', notSure: new Set(), na: new Set(), imported: [], n01: 'employed', n03: 6, n05: 0, n10: ['selling', 'people'], n19: ['owners'], n21: 'via', n21Count: '6-20' });
    const cat = M.starter && (M.starter.CATALOGUE ?? M.starter.catalogue);
    const src = require('fs').readFileSync(require('path').join(root, 'starter.js'), 'utf8');
    ok(/id: 'partnership-channel'/.test(src) && /family: 'partnerships and existing assets'/.test(src), 'the catalogue carries the partnerships family');
    const qsrc = require('fs').readFileSync(require('path').join(root, 'questions.js'), 'utf8');
    ok(/DIRECTION_CATEGORIES/.test(qsrc) && /'partnership-channel': 'partnerships'/.test(qsrc) && /Or describe your own direction/.test(qsrc), 'the directions screen has a category row and a line for the visitor\'s own direction');
    ok(typeof cat === 'undefined' || Array.isArray(cat), 'the catalogue stays an array where it is exposed');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
