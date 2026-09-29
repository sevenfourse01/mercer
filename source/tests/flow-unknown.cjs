/* flow, rebuild 1 (R6, R7, C01, C03, C08, C16): Not sure records an unknown and never a zero, revenue included; a
   suggested rail value is a suggestion until Continue accepts it and Not sure discards it; user-entered numbers keep
   their value and precision (£66, 37.5, 0) through editing, export and restore; N/A comes only from routing; the press
   lock clears when the screen is mounted, and a double press moves one question. */
const H = require('./flow-harness.cjs');
const KEY = 'mercer-answers';

(async () => {
  const a = H.boot({ questions: true });
  const { M, document, ok, settle, sleep, errors } = a;
  const q = (sel) => document.querySelector(sel);
  M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
  /* the final pack puts Business before Aim, so the walk is driven by what is on screen rather than by a fixed list */
  const FIX = {
    biz: 'Acme', place: { place: 'Leeds' }, currency: 'GBP', import: '', win: 'income', months: 12,
    goal: { goal: 15000, appetite: 'moderate', months: 12 }, protected: ['income'], role: 'owner',
    sector: { sector: 'professional', trade: 'Consultancy' }, repeatWork: 'repeat', stage: 'established', payModel: ['perjob'],
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
  await drive('now');
  ok('revenue is on screen', M.askId === 'now', M.askId);

  console.log('== Not sure on revenue (C01)');
  ok('Not sure is offered on revenue', !q('#unsure').disabled && q('#unsure').hidden !== true);
  M.commit('now', 0); // a rail at rest sends 0 before the press
  await M.notSure('now'); await settle();
  ok('revenue is unknown, never 0', M.state.now === null && M.state.notSure.has('now') && !M.state.na.has('now'));
  ok('the walk moved on, with no forecast on a zero', M.askId !== 'now' && M.result === null);
  ok('the evidence says not known yet', M.evidence('now').state === 'unknown' && M.evidence('now').label === 'Not known yet');
  ok('a late 0 from the instrument that left the screen is dropped', (M.commit('now', 0), M.state.now === null));
  ok('the report distinguishes unknown from £0', M.valueText('now') === '' && M.inspect('now').words === 'Not sure');

  console.log('== £66 and 37.5 survive (C08)');
  ok('price is on screen', M.askId === 'price');
  M.commit('price', 66);
  ok('£66 is £66, and prints as £66', M.state.price === 66 && M.valueText('price') === '£66' && M.gbp(66) === '£66');
  M.commit('price', 66.5);
  ok('a decimal price keeps its value', M.state.price === 66.5);
  M.commit('price', 66);
  await M.next(); await settle();
  M.commit('hours', 37.5);
  M.commit('margin', 0.375);
  ok('37.5 hours and a 37.5% margin keep their precision', M.state.hours === 37.5 && M.state.margin === 0.375);
  M.commit('servedNow', 0);
  ok('a real zero stays a zero', M.state.servedNow === 0);
  M.save.enable(); await sleep(500);
  const raw = a.window.localStorage.getItem(KEY);
  const b = H.boot({ questions: true, storage: { [KEY]: raw } });
  ok('the values come back intact after a reload', b.M.state.price === 66 && b.M.state.hours === 37.5 && b.M.state.margin === 0.375 && b.M.state.servedNow === 0 && b.M.state.now === null && b.M.state.notSure.has('now'));
  const file = M.save.exportFile();
  const c = H.boot({ questions: true });
  c.M.save.importFile(file).load();
  ok('and after an export and import', c.M.state.price === 66 && c.M.state.hours === 37.5 && c.M.state.now === null && c.M.state.notSure.has('now'));

  console.log('== a suggested rail value (brief 4.4)');
  await M.reopen('price'); await settle();
  ok('price opens again', M.askId === 'price');
  M.commit('price', 2500, { suggested: true });
  ok('a suggested figure is an assumption until Continue accepts it', M.state.price === 2500 && M.evidence('price').state === 'assumed' && /Suggested/.test(M.evidence('price').label));
  const revBefore = M.revision;
  await M.notSure('price'); await settle();
  ok('Not sure discards the suggested figure and records the unknown', M.state.price === null && M.state.notSure.has('price') && M.revision === revBefore + 1);
  await M.reopen('price'); await settle();
  M.commit('price', 2500, { suggested: true });
  await M.next(); await settle();
  ok('Continue accepts the suggestion as the visitor\'s answer', M.state.price === 2500 && M.evidence('price').state === 'user');

  console.log('== N/A by routing only (C16)');
  await M.reopen('repeatWork'); await settle();
  M.state.doing = ['referrals']; M.state.tried = ['seo']; M.state.went = { seo: 'flop' };
  M.state.asked.push('went');
  ok('went applies while something was tried', M.applies('went') === true && !M.state.na.has('went'));
  M.state.tried = []; M.state.went = {};
  M.paintTree();
  ok('a question routing drops after it was asked is marked not applicable, distinct from unknown', M.state.na.has('went') && !M.state.notSure.has('went') && M.evidence('went').na === true);
  M.state.tried = ['seo']; M.state.went = { seo: 'flop' };
  M.paintTree();
  ok('and comes back when it applies again', !M.state.na.has('went'));
  ok('no button offers N/A', !q('#na') || q('#na').hidden === true);
  ok('M.na is for routing: it does not move the screen', (M.na('holdup'), M.askId === 'repeatWork' && M.state.na.has('holdup')));

  console.log('== the lock clears on mount, no timer (R7, C03)');
  await M.next(); await settle();
  ok('back where the walk stood after the jump', M.stage === 'section' && M.askId !== 'repeatWork', [M.stage, M.askId]);
  await M.go('cutscene'); await settle(); await sleep(50);
  ok('the results', M.stage === 'explore');
  // the aim is answered off screen: the walk above stopped in the Business stage, which now comes first
  M.commit('win', 'income');
  await M.reopen('win'); await settle();
  const at = M.askId;
  const t0 = Date.now();
  const p1 = M.next(); const p2 = M.next(); const p3 = M.next();
  await Promise.all([p1, p2, p3]); await settle();
  ok('three presses in one tick move one screen', M.stage === 'explore' && at === 'win', [M.stage, at, q('#next').disabled]);
  ok('M.moving is false once mounted, without a settle timer', M.moving === false && Date.now() - t0 < 400, Date.now() - t0);

  ok('no page errors', errors.length === 0 && b.errors.length === 0 && c.errors.length === 0, errors.slice(0, 3));
  a.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
