/* flow, results 1: the starter's opening branch (D9) and what hangs off it.
   Asserts: startPoint is asked in Starting point straight after n01; each of the four starting positions (none, one,
   few, tried) reaches the readiness screen and the plan with only its own follow-ups shown; n25 and n26 are never a
   screen and carry their derived answers; s07 breaks a tie only while two ideas still stand; the wheel is a section
   index that counts what applies, never a countdown; choosing a direction, Use this direction and Change an answer
   bump the revision and rebuild the plan (D11); save schema 3 keeps the direction and the revision; body[data-result]
   follows M.resultStage (D6); the section 9 writing instruction is in M.planInstruction word for word (D13); the
   owner's first pass is unchanged in count. plan.js, starter.js and the interview owner's registry entries are
   stubbed only where they have not landed. */
const fs = require('fs');
const path = require('path');
const H = require('./flow-harness.cjs');

const S_IDS = ['startPoint', 's01', 's02', 's03', 's04', 's05', 's06', 's08', 's09', 's07', 's10', 's11', 's12', 's13', 's14'];
const BRANCH = { none: [], one: ['s01', 's02', 's03', 's04', 's05'], few: ['s06', 's08', 's09', 's07', 's05'], tried: ['s10', 's11', 's12', 's13', 's14'] };
const KEY = 'mercer-answers';

/* the starter fixture of flow-journey-starter, without n25: that answer is derived from startPoint now */
const SHARED = {
  win: 'extra', goal: { goal: 1500, appetite: 'moderate', months: 6 }, protected: ['income', 'family'], place: { place: 'Leeds' },
  interest: 'read about lighting', bestAt: 'ten years of stage lighting for small theatres',
  paidBefore: 'unpaid', workStyle: ['making'], currency: 'GBP', months: 6, n01: 'employed', n03: 10, n05: 300, n07: 'months', n10: ['writing', 'talking'], n13: ['writing'], n15: ['none'], n16: ['laptop'],
  n19: ['owners'], n21: 'direct', n27: 'bookkeeping', n30: ['accountability'],
  n31: 'owners', n33: ['asked'], n35: 'yes', n39: 'first',
  n41: ['none'], n42: ['offer'], n44: ['none'],
};
const AT = {
  none: { startPoint: 'none' },
  one: { startPoint: 'one', s01: ['parents'], s02: 'help with GCSE maths', s03: 'watch videos and hope', s04: 'asked', s05: 'yes' },
  // a tie: s08 names one idea and s09 another, so s07 must be asked
  few: { startPoint: 'few', s06: ['Maths tutoring', 'Bookkeeping', 'Dog walking'], s08: 'i0', s09: 'i1', s07: 'i0', s05: 'help' },
  // no tie: both name the same idea, so s07 must not be asked
  fewSettled: { startPoint: 'few', s06: ['Maths tutoring', 'Bookkeeping'], s08: 'i0', s09: 'i0', s05: 'yes' },
  // s13 and s14 are optional (Skip): the walk leaves them with Not sure
  tried: { startPoint: 'tried', s10: 'CV rewrites, to friends of friends', s11: ['friends'], s12: 'replies' },
};
/* the owner fixture of flow-journey-owner, unchanged: the count it walks is the count that must not move */
const OWNER = {
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

function stubs(M) {
  const out = [];
  if (!(M.plan && typeof M.plan.build === 'function')) {
    let cur = null;
    M.plan = { build(state) { cur = { id: 'p1', route: state.route, revision: M.revision, generatedAt: new Date().toISOString(), status: 'ready', direction: state.direction, actions: [], scenarios: [] }; return cur; }, current() { if (!cur) return null; return cur.revision === M.revision ? { stale: false, plan: cur } : { stale: true, plan: cur }; } };
    out.push('plan.js');
  }
  if (!(M.starter && typeof M.starter.directions === 'function')) {
    M.starter = { directions() { return { recommended: { id: 'bookkeeping', buyer: 'owners', firstTest: 'Offer to do one month of books for one owner you know.' }, alternatives: [{ id: 'tutoring' }], excluded: [] }; }, plan() { return {}; } };
    out.push('starter.js');
  }
  // the interview owner's entries (D9), stubbed only where they have not landed: the table places them, the gates show them
  const reg = Array.isArray(M.registry) ? M.registry : Array.isArray(M.SCHEMA) ? M.SCHEMA : null;
  if (reg) {
    const missing = S_IDS.filter((id) => !reg.some((e) => e && e.id === id));
    missing.forEach((id) => reg.push({ id, route: 'starter', section: 'foundations', driver: 'roots', type: 'presets', key: id, tier: id === 's13' || id === 's14' ? 2 : 1, optional: id === 's13' || id === 's14', affects: ['plan'] }));
    if (missing.length) out.push(`registry: ${missing.join(' ')}`);
  }
  return out;
}

/** the walk from orientation to the readiness screen: { screens, sections, counts } */
async function walk(a, answers, opts = {}) {
  const { M, document, ok, settle } = a;
  const q = (sel) => document.querySelector(sel);
  const screens = [];
  const sections = [];
  const counts = [];
  const texts = new Set();
  let guard = 0;
  while (M.stage === 'section' && guard++ < 60) {
    const id = M.askId;
    if (!screens.includes(id)) screens.push(id);
    if (!sections.includes(M.state.section)) sections.push(M.state.section);
    const row = M.progress().find((r) => r.id === 'foundations');
    counts.push(row.count);
    texts.add(M.progressText());
    if (!(id in answers)) { if (opts.log) console.log('  no fixture for', id, '(answered Not sure)'); await M.notSure(id); await settle(); continue; }
    if (id === 'n27') M.state.direction = { id: 'bookkeeping', recommended: true, buyer: 'owners' };
    M.commit(id, answers[id]);
    if (q('#next').disabled) ok(`Continue is on after ${id}`, false, id);
    await M.next(); await settle();
    if (M.stage === 'close') { await M.next(); await settle(); }
  }
  return { screens, sections, counts, texts: [...texts] };
}

async function starterTo(a, at, label) {
  const { M, ok, settle } = a;
  M.setRoute('starter');
  await M.go('orient'); await settle();
  await M.start(); await settle();
  const answers = { ...SHARED, ...AT[at] };
  const w = await walk(a, answers);
  console.log(`  ${label} screens:`, w.screens.length, w.screens.join(' '));
  const word = AT[at].startPoint;
  const shownS = w.screens.filter((id) => S_IDS.includes(id));
  const own = new Set(['startPoint', ...BRANCH[word]]);
  ok(`${label}: startPoint is asked, in Starting point`, w.screens.includes('startPoint') && M.sectionOf('startPoint') === 'foundations');
  ok(`${label}: only its own branch is shown`, shownS.every((id) => own.has(id)), shownS);
  ok(`${label}: neither n25 nor n26 is a screen`, !w.screens.includes('n25') && !w.screens.includes('n26'));
  ok(`${label}: n25 and n26 stand answered by startPoint`, M.satisfied('n25') && M.satisfied('n26'));
  ok(`${label}: the readiness screen is reached`, M.stage === 'ready' && M.askId === 'readiness', [M.stage, M.askId]);
  // the brief expects roughly four to eight follow-ups where the branch needs them: the none walk plus at most five
  ok(`${label}: at most 27 question screens`, w.screens.length <= 27, w.screens.length);
  ok(`${label}: the wheel is a section index, never a countdown`, w.texts.every((t) => /^[A-Za-z ]+ · \d of 6$/.test(t)) && !w.texts.some((t) => /left|remaining|to go/i.test(t)), w.texts);
  const table = M.orderOf('foundations');
  const applying = table.filter((id) => M.applies(id) && !M.satisfied(id));
  const row = M.progress().find((r) => r.id === 'foundations');
  ok(`${label}: Starting point counts what applies, never the whole table`, row.count === applying.length && row.count < table.length && !applying.some((id) => S_IDS.includes(id) && !own.has(id)), [row.count, applying]);
  return w;
}

(async () => {
  console.log('== the four starting positions');
  const a = H.boot({ questions: true });
  console.log('== stubbed:', stubs(a.M).join(', ') || 'nothing');
  // one tally for every boot: a's finish() reports them all
  const boot = (o) => { const x = H.boot(o); x.ok = a.ok; return x; };
  {
    const { M, ok } = a;
    M.setRoute('starter');
    const order = M.orderOf('foundations');
    const i = order.indexOf('n01'), j = order.indexOf('startPoint');
    const between = order.slice(i + 1, j);
    ok('startPoint follows n01 in the table, with only n01 riders between', i >= 0 && j > i && between.every((id) => M.registryEntry(id)?.on === 'n01'), between);
    ok('startPoint is first pass on the starter route', M.tierOf('startPoint') === 1);
    ok('before startPoint is answered, no follow-up applies', S_IDS.slice(1).every((id) => !M.applies(id)));
    const w = await starterTo(a, 'none', 'none');
    ok('none: no follow-up at all', !w.screens.some((id) => BRANCH.one.concat(BRANCH.few, BRANCH.tried).includes(id)));
    ok('none: n25 no, n26 no', M.state.n25 === 'no' && M.state.n26 === 'no', [M.state.n25, M.state.n26]);
  }

  const b = boot({ questions: true }); stubs(b.M);
  {
    const { M, ok, settle, window, document } = b;
    const w = await starterTo(b, 'one', 'one');
    ok('one: every first-pass follow-up of the branch is asked', BRANCH.one.filter((id) => M.tierOf(id) === 1).every((id) => w.screens.includes(id)), w.screens.filter((id) => S_IDS.includes(id)));
    ok('one: n25 yes, n26 no', M.state.n25 === 'yes' && M.state.n26 === 'no', [M.state.n25, M.state.n26]);

    console.log('== D11: the direction, the revision, the plan, the save');
    await M.choosePlan(); await settle();
    if (M.stage !== 'plan') { await M.go('plan'); await settle(); }
    ok('the plan stage is reached', M.stage === 'plan', M.stage);
    ok('body[data-result] opens at move', document.body.dataset.result === 'move' && M.resultStage() === 'move', document.body.dataset.result);
    const heard = [];
    document.addEventListener('mercer:direction', (e) => heard.push(e.detail));
    const rev0 = M.revision;
    const r1 = M.chooseDirection('tutoring');
    ok('choosing a direction bumps the revision once', r1 === rev0 + 1 && M.revision === rev0 + 1, [rev0, M.revision]);
    ok('the direction is written and n27 kept in step', M.state.direction === 'tutoring' && M.state.n27 === 'tutoring' && M.answered('n27'));
    ok('the plan is rebuilt for the new revision', M.plan.current() && M.plan.current().stale === false && M.plan.current().plan.revision === M.revision, M.plan.current());
    ok('mercer:direction is heard with the revision', heard.length === 1 && heard[0].id === 'tutoring' && heard[0].revision === M.revision);
    ok('Use this direction on the same direction changes nothing', M.useDirection('tutoring') === M.revision && M.revision === rev0 + 1);
    M.useDirection({ id: 'bookkeeping', label: 'Bookkeeping for owners' });
    ok('Use this direction on an alternative bumps and keeps the card', M.revision === rev0 + 2 && M.state.direction.id === 'bookkeeping' && heard[1]?.why === 'alternative', [M.revision, M.state.direction]);
    ok('M.resultStage moves the body attribute', M.resultStage('why') === 'why' && document.body.dataset.result === 'why' && M.resultStage('start') === 'start' && document.body.dataset.result === 'start');
    ok('an unknown stage word clears it', M.resultStage('elsewhere') === null && !('result' in document.body.dataset));
    M.resultStage('plan');

    ok('saving is on by default (the cockpit brief, 9)', M.save.on === true);
    ok('enable() writes at once', M.save.enable() === true && window.localStorage.getItem(KEY) !== null);
    const saved = JSON.parse(window.localStorage.getItem(KEY));
    ok('schema 3 keeps the direction and the revision', saved.schema === 3 && saved.selectedDirection?.id === 'bookkeeping' && saved.revision === M.revision, [saved.schema, saved.selectedDirection, saved.revision]);
    ok('and the opening branch answers, with the derived n25', saved.answers.startPoint === 'one' && saved.answers.s02 === 'help with GCSE maths' && saved.answers.n25 === 'yes', [saved.answers.startPoint, saved.answers.s02, saved.answers.n25]);
    ok('the plan is saved at the same revision', saved.planRevision === saved.revision && saved.plan && saved.plan.revision === saved.revision);
    ok('the results stage is not saved', !('resultStage' in saved) && !('result' in saved));

    const c = boot({ questions: true, storage: { [KEY]: window.localStorage.getItem(KEY) } }); stubs(c.M);
    ok('a fresh page restores the copy', c.M.save.restored === true);
    ok('with the direction, the revision and the starting position', c.M.state.direction?.id === 'bookkeeping' && c.M.revision === M.revision && c.M.state.startPoint === 'one' && c.M.state.n25 === 'yes', [c.M.state.direction, c.M.revision, c.M.state.startPoint]);
    ok('and n25 still stands answered by startPoint after the restore', c.M.satisfied('n25') && c.M.satisfied('n26'));
    ok('no page errors on the restored page', c.errors.length === 0, c.errors.slice(0, 2));

    console.log('== D11: Change an answer');
    const rev2 = M.revision;
    await M.changeAnswer('s02'); await settle();
    ok('Change an answer opens that question again', M.stage === 'section' && M.askId === 's02', [M.stage, M.askId]);
    ok('the results stage leaves the body with the results', !('result' in document.body.dataset));
    M.commit('s02', 'help with A level maths');
    ok('a changed answer bumps the revision', M.revision === rev2 + 1, [rev2, M.revision]);
    ok('and the plan is stale until rebuilt', M.plan.current().stale === true);
    await M.next(); await settle();
    ok('Continue returns to the results with the plan rebuilt', ['explore', 'plan'].includes(M.stage) && M.plan.current().stale === false && M.plan.current().plan.revision === M.revision, [M.stage, M.plan.current()]);
    ok('no page errors', b.errors.length === 0, b.errors.slice(0, 2));
  }

  const d = boot({ questions: true }); stubs(d.M);
  {
    const { M, ok } = d;
    const w = await starterTo(d, 'few', 'few (tie)');
    ok('few: the ideas, the demand pick and the delivery pick are asked', ['s06', 's08', 's09'].every((id) => w.screens.includes(id)), w.screens.filter((id) => S_IDS.includes(id)));
    ok('few: two ideas still stand, so the tie-breaker is asked', M.standingIdeas().length === 2 && w.screens.includes('s07'), M.standingIdeas());
    ok('few: s05 is asked for the chosen idea', w.screens.includes('s05'));
    ok('few: n25 yes, n26 no', M.state.n25 === 'yes' && M.state.n26 === 'no', [M.state.n25, M.state.n26]);
  }

  const e = boot({ questions: true }); stubs(e.M);
  {
    const { M, ok } = e;
    const w = await starterTo(e, 'fewSettled', 'few (settled)');
    ok('few, settled: one idea stands, so the tie-breaker is not asked', M.standingIdeas().length === 1 && !w.screens.includes('s07'), M.standingIdeas());
  }

  const f = boot({ questions: true }); stubs(f.M);
  {
    const { M, ok } = f;
    const w = await starterTo(f, 'tried', 'tried');
    ok('tried: the offer, the channel and what happened are asked', ['s10', 's11', 's12'].every((id) => w.screens.includes(id)), w.screens.filter((id) => S_IDS.includes(id)));
    // D9's rule as the interview wrote it: one or a few ideas is an idea; already tried is tried, with s12 saying whether it sold
    ok('tried: n25 no, n26 offered (replies, no sales)', M.state.n25 === 'no' && M.state.n26 === 'offered', [M.state.n25, M.state.n26]);
    M.commit('s12', 'fewsales');
    ok('tried: a sale makes n26 sold', M.state.n26 === 'sold');
    ok('tried: the branch of the other positions never shows', !w.screens.some((id) => BRANCH.one.concat(BRANCH.few).includes(id)));
  }

  console.log('== D13: the writing instruction, word for word');
  {
    const { M, ok } = a;
    const brief = fs.readFileSync(path.join(H.ROOT, 'notes', 'RESULTS-BRIEF.md'), 'utf8');
    const m = brief.match(/## 9\. Runtime writing instruction\s+```text\n([\s\S]*?)```/);
    const block = m ? m[1].trim() : '';
    ok('the brief holds the instruction block', block.length > 0);
    ok('M.planInstruction carries it verbatim', block.length > 0 && M.planInstruction().includes(block));
    ok('the earlier lines stand', /Do not ask them to forecast their own future/.test(M.planInstruction()));
    ok('no em dash in app.js', !fs.readFileSync(path.join(H.ROOT, 'app.js'), 'utf8').includes(String.fromCharCode(8212)));
  }

  console.log('== the owner walk is unchanged in count');
  const g = boot({ questions: true }); stubs(g.M);
  {
    const { M, ok, settle } = g;
    M.setRoute('owner');
    await M.go('orient'); await settle();
    await M.start(); await settle();
    const w = await walk(g, OWNER);
    console.log('  owner screens:', w.screens.length, w.screens.join(' '));
    ok('the owner first pass is the 13 screens of flow-journey-owner (protected is no longer asked: the cockpit brief, 7.3)', w.screens.length === 13, w.screens.length);
    ok('no opening-branch id on the owner route', !w.screens.some((id) => S_IDS.includes(id)) && !M.orderOf('foundations').some((id) => S_IDS.includes(id)));
    ok('the owner walk reaches readiness', M.stage === 'ready');
    ok('no page errors', g.errors.length === 0, g.errors.slice(0, 2));
  }

  const others = [b, d, e, f, g];
  const stray = others.reduce((n, x) => n + x.errors.length, 0);
  if (stray) { console.log('\npage errors in another boot:', others.flatMap((x) => x.errors).slice(0, 3)); process.exit(1); }
  a.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
