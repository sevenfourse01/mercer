/* flow, rebuild 1 (R21, C05, C08), updated for the final pack: save schema 3. Off by default; on, every accepted change writes { schema: 3, sessionId,
   savedAt, revision, route, activeSection, activeQuestionId, answers, unknowns, na, evidence, imported, selectedDirection,
   plan, planRevision, prefs, walk }. A new page restores it and resumes past orientation at the section it stood in; a
   schema 1 copy is migrated (answers and unknowns kept, derived results dropped); Forget needs a confirmation and names
   its scope; a progress file exports and imports as untrusted input; another tab's newer copy is a conflict choice. */
const H = require('./flow-harness.cjs');
const KEY = 'mercer-answers';

(async () => {
  console.log('== off by default');
  const a = H.boot({ questions: true });
  const { M, window, document, ok, settle, sleep } = a;
  ok('M.save contract', ['enable', 'disable', 'forget', 'restore', 'exit', 'exportFile', 'importFile', 'review', 'resolve', 'hasSaved'].every((k) => typeof M.save[k] === 'function') && M.save.on === false);
  M.setRoute('owner'); await M.go('orient'); await settle(); await M.start(); await settle();
  M.commit('win', 'income'); await sleep(500);
  ok('nothing is written while saving is off', window.localStorage.getItem(KEY) === null);
  ok('the privacy line, saving off, says nothing is saved', /Stays in this browser/.test(M.save.line()) && !/Saved on this device/.test(M.save.line()));

  console.log('== on: schema 3');
  let heard = null;
  document.addEventListener('mercer:save', (e) => { heard = e.detail; });
  ok('enable() writes at once', M.save.enable() === true && M.save.on === true && window.localStorage.getItem(KEY) !== null && heard?.on === true);
  ok('"Saved on this device" only after a successful write', /^Saved on this device/.test(M.save.line()) && M.save.wrote === true);
  /* the walk is driven by what is on screen, not by a fixed list, so the route order can move without this test
     pretending to answer a question nobody was asked (the final pack puts Business before Aim) */
  const FIX = {
    win: 'income', goal: { goal: 15000, appetite: 'moderate', months: 12 }, months: 12, protected: ['income'],
    biz: 'Acme', place: { place: 'Leeds' }, currency: 'GBP', import: '',
    sector: { sector: 'professional', trade: 'Consultancy' }, repeatWork: 'repeat', stage: 'established', payModel: ['perjob'],
    role: 'owner', price: 66, retainer: { min: 500, max: 1500, avg: 1000 }, volume: { volume: 4, period: 'month' },
  };
  const SKIP_NOW = true;
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
  // through the Business stage and the Aim, to the first Customers question
  await drive('buyer');
  // £66 and 37.5 keep their value and precision
  M.commit('price', 66);
  // margin is a refinement screen in the registry: written here as the visitor's own answer, off screen
  M.commit('margin', 0.375);
  M.state.hours = 37.5;
  const sectionThen = M.state.section, askThen = M.askId;
  await sleep(500);
  const raw = window.localStorage.getItem(KEY);
  const data = JSON.parse(raw);
  ok('schema 3 with a session id, a time, the revision and the route', data.schema === 3 && typeof data.sessionId === 'string' && typeof data.savedAt === 'string' && data.revision === M.revision && data.route === 'owner', [data.schema, data.revision, data.route]);
  ok('the active section and the stable question id', data.activeSection === sectionThen && data.activeQuestionId === askThen && typeof askThen === 'string', [data.activeSection, data.activeQuestionId]);
  ok('answers hold what was given, at full precision', data.answers.price === 66 && data.answers.margin === 0.375 && data.answers.hours === 37.5 && data.answers.goal === 15000 && data.answers.sector === 'professional');
  ok('unknowns are separate from answers, and revenue is unknown, not 0', data.unknowns.includes('now') && !('now' in data.answers) && M.state.now === null);
  ok('na, evidence, imported, prefs and the walk are present', Array.isArray(data.na) && typeof data.evidence === 'object' && Array.isArray(data.imported) && data.prefs && data.prefs.saveOn === true && Array.isArray(data.walk.asked) && data.walk.asked.includes('now'));
  ok('evidence is saved by id', data.evidence.price && data.evidence.price.state === 'user');
  ok('no derived result and no stage inside answers', !('derived' in data.answers) && !('stage' in data.answers) && !('prior' in data.answers));
  M.state.cv = 'CURRICULUM VITAE Jane Doe NI AB123456C salary 48000';
  const withCv = JSON.stringify(M.save.snapshot());
  ok('a held CV never reaches the saved copy', !/AB123456C/.test(withCv) && !/CURRICULUM/.test(withCv), withCv.slice(0, 120));
  const rev = M.revision;
  const review = M.save.review();
  ok('review() says what the progress file holds', review.answers > 5 && review.unknowns === 1 && Array.isArray(review.lines) && review.lines.some((l) => /no CV, no pasted document text/.test(l)));

  console.log('== a new page: restore and resume');
  const b = H.boot({ questions: true, storage: { [KEY]: raw } });
  const N = b.M, S = b.M.state;
  ok('restored, saving on, the page opens at arrival', N.save.restored === true && N.save.on === true && N.stage === 'arrival');
  ok('the route, the revision and the answers are back', S.route === 'owner' && N.revision === rev && S.price === 66 && S.margin === 0.375 && S.hours === 37.5 && S.goal === 15000);
  ok('unknowns are back as unknowns', S.notSure.has('now') && S.now === null);
  ok('asked is back', S.asked.includes('sector') && S.asked.includes('price'));
  ok('evidence is back', N.evidence('price').state === 'user');
  ok('no forecast is run at arrival', b.spy.calls === 0);
  ok('hasSaved() sees the copy', N.save.hasSaved() === true);
  await N.resume(); await b.settle();
  ok('Continue your plan resumes past orientation, in the section it left', N.stage === 'section' && S.section === sectionThen && S.orientAck, [N.stage, S.section, sectionThen]);

  console.log('== migration from schema 1');
  const v1 = { v: 1, on: true, at: '2026-09-21T10:00:00.000Z', state: { now: 40000, sector: 'professional', trade: 'Consultancy', goal: 80000, months: 12, place: 'Leeds', hours: 37.5, price: 66, notSure: ['bestWorst'], na: ['owed'], skipped: [], asked: ['sector', 'goal', 'months', 'now', 'bestWorst', 'place', 'site'], derived: { price: 'retainer' }, prior: { deal: 3000 }, result: { made: 'up' } }, passed: ['place'] };
  const c = H.boot({ questions: true, storage: { [KEY]: JSON.stringify(v1) } });
  const C = c.M.state;
  ok('a schema 1 copy is restored through migration', c.M.save.restored === true && c.M.save.migrated === true);
  ok('answers and unknowns kept, precision intact', C.now === 40000 && C.price === 66 && C.hours === 37.5 && C.notSure.has('bestWorst') && C.na.has('owed'));
  ok('derived results dropped, the old import id read as the new one', !('result' in C) && JSON.stringify(C.derived) === '{}' && C.asked.includes('import') && !C.asked.includes('site'));
  ok('the route defaults to owner and the revision starts at 0', C.route === 'owner' && c.M.revision === 0);
  c.M.commit('price', 70); await c.sleep(500);
  const rewritten = JSON.parse(c.window.localStorage.getItem(KEY));
  ok('the next write is schema 3', rewritten.schema === 3 && rewritten.answers.price === 70);

  console.log('== Forget this visit');
  const scope = N.save.forgetScope();
  const refused = N.save.forget();
  ok('forget without a confirmation is refused and names its scope', refused.ok === false && refused.needsConfirm === true && /downloaded/.test(refused.scope) && refused.scope === scope && b.window.localStorage.getItem(KEY) !== null);
  const done = N.save.forget({ confirmed: true });
  ok('forget with a confirmation clears the copy and stops saving', done.ok === true && b.window.localStorage.getItem(KEY) === null && N.save.on === false);
  ok('the answers on screen stay', S.price === 66);
  N.commit('price', 80); await b.sleep(500);
  ok('nothing is written after forget', b.window.localStorage.getItem(KEY) === null);

  console.log('== progress file: export and import as untrusted input');
  const file = M.save.exportFile();
  const parsed = JSON.parse(file);
  ok('the export is the schema 3 copy marked as a progress file', parsed.kind === 'mercer-progress' && parsed.schema === 3 && parsed.answers.price === 66);
  const d = H.boot({ questions: true });
  ok('a broken file is refused', d.M.save.importFile('{not json').ok === false && d.M.save.importFile('').ok === false);
  ok('an unsupported schema is refused with a reason', /schema 9/.test(d.M.save.importFile(JSON.stringify({ schema: 9, answers: {} })).reason));
  ok('an unknown route is refused', d.M.save.importFile(JSON.stringify({ schema: 3, route: 'admin', answers: {} })).ok === false);
  const poison = JSON.stringify({ schema: 2, route: 'owner', answers: { price: 66, stage: 'explore', __proto__: { x: 1 }, notSure: ['x'], hours: 'not a number', now: { deep: 'object' } }, unknowns: ['now', 42, {}], walk: { asked: ['price', 5] } });
  const im = d.M.save.importFile(poison);
  ok('a valid file is not loaded until load() is called', im.ok === true && d.M.state.price === null && typeof im.load === 'function' && im.summary.answers >= 1);
  im.load();
  ok('the walk\'s own keys, Sets and bad shapes are dropped; good answers land', d.M.state.price === 66 && d.M.stage === 'arrival' && !('x' in d.M.state) && d.M.state.notSure.has('now') && d.M.state.notSure.size === 1 && d.M.state.asked.join(',') === 'price');
  ok('too large is refused', d.M.save.importFile(JSON.stringify({ schema: 2, answers: { note: 'x'.repeat(600000) } })).ok === false);
  const e = H.boot({ questions: true });
  const good = e.M.save.importFile(file);
  ok('the exported file imports whole', good.ok === true && (good.load(), e.M.state.price === 66 && e.M.state.margin === 0.375 && e.M.state.notSure.has('now') && e.M.route === 'owner'));

  console.log('== two tabs: a newer copy is a conflict, never a silent overwrite');
  const f = H.boot({ questions: true });
  f.M.setRoute('owner'); await f.M.go('orient'); await f.settle(); await f.M.start(); await f.settle();
  f.M.save.enable();
  f.M.commit('win', 'income'); await f.sleep(500);
  const mine = JSON.parse(f.window.localStorage.getItem(KEY));
  let conflict = null;
  f.document.addEventListener('mercer:save-conflict', (ev) => { conflict = ev.detail; });
  const theirs = { ...mine, sessionId: 'other-tab', revision: mine.revision + 5, savedAt: '2026-09-23T12:00:00.000Z', answers: { ...mine.answers, win: 'time' } };
  f.window.localStorage.setItem(KEY, JSON.stringify(theirs));
  f.window.dispatchEvent(new f.window.StorageEvent('storage', { key: KEY, newValue: JSON.stringify(theirs), oldValue: JSON.stringify(mine) }));
  ok('the conflict is raised, with both revisions', conflict && conflict.theirs.revision === mine.revision + 5 && conflict.mine.revision === mine.revision && f.M.save.conflict !== null);
  f.M.commit('win', 'growth'); await f.sleep(500);
  ok('nothing is written while the conflict stands', JSON.parse(f.window.localStorage.getItem(KEY)).answers.win === 'time' && f.M.save.paused === true);
  ok('an older copy of this session raises nothing', (f.window.dispatchEvent(new f.window.StorageEvent('storage', { key: KEY, newValue: JSON.stringify({ ...mine, revision: 0 }) })), true));
  const loaded = f.M.save.resolve('load');
  ok('load: the other tab\'s answers replace this tab\'s, at its revision', loaded === true && f.M.state.win === 'time' && f.M.revision === mine.revision + 5 && f.M.save.conflict === null && f.M.save.paused === false);
  // the other way round: keep mine
  conflict = null;
  f.window.dispatchEvent(new f.window.StorageEvent('storage', { key: KEY, newValue: JSON.stringify({ ...theirs, revision: theirs.revision + 3, answers: { ...theirs.answers, win: 'predictable' } }) }));
  ok('a second conflict', conflict !== null && f.M.save.paused === true);
  f.M.state.win = 'growth';
  const kept = f.M.save.resolve('keep');
  const after = JSON.parse(f.window.localStorage.getItem(KEY));
  ok('keep: this tab writes over it at a higher revision', kept === true && after.answers.win === 'growth' && after.revision > theirs.revision + 3);

  console.log('== Save and exit');
  const g = H.boot({ questions: true });
  g.M.setRoute('starter'); await g.M.go('orient'); await g.settle(); await g.M.start(); await g.settle();
  g.M.commit('win', 'extra');
  ok('saving is off before Save and exit', g.M.save.on === false && g.window.localStorage.getItem(KEY) === null);
  const ex = await g.M.save.exit(); await g.settle();
  ok('Save and exit turns saving on, writes, then goes to the homepage', ex.ok === true && g.M.save.on === true && JSON.parse(g.window.localStorage.getItem(KEY)).answers.win === 'extra' && g.M.stage === 'arrival');
  ok('the homepage would offer Continue your plan', g.M.save.hasSaved() === true);

  const fails = [a, b, c, d, e, f, g].reduce((n, x) => n + x.errors.length, 0);
  ok('no page errors on any page', fails === 0, [a, b, c, d, e, f, g].flatMap((x) => x.errors).slice(0, 3));
  a.finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
