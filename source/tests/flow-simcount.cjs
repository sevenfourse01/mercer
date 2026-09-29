/* flow, refine 1 (R19): M.simCount() equals the draws the engine made. The harness counts every E.forecast call and
   its draws from outside app.js; app.js's own tally must agree, for the headline run and after the whole ladder. */
const H = require('./flow-harness.cjs');
const { M, document, ok, sleep, finish, spy } = H.boot({});
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('== before any run');
  let c = M.simCount();
  ok('nothing counted', c.headline === 0 && c.total === 0 && c.runs === 0, c);

  console.log('== the headline run');
  M.restore({ now: 40000, sector: 'professional', trade: 'Consultancy', goal: 80000, months: 12, appetite: 'moderate', price: 4800, closeRate: 0.3, capacity: 12, who: 3, margin: 0.55, budget: 2000, asked: [] });
  c = M.simCount();
  ok('one run', c.runs === 1 && spy.calls === 1, [c, spy]);
  ok('headline is the draws in the run', c.headline === M.result.months[0].length && c.headline > 0, c.headline);
  ok('total equals the draws made', c.total === spy.draws, [c.total, spy.draws]);
  ok('the plan and the measure are counted as calls', c.plans === 1 && c.measures === 1, c);

  console.log('== the ladder');
  const L = await M.ladder();
  await sleep(50);
  c = M.simCount();
  ok('the ladder landed', Boolean(L && L.rungs.length > 1), L && L.rungs.length);
  ok('runs equals every forecast made', c.runs === spy.calls && c.runs > 1, [c.runs, spy.calls]);
  ok('total equals every draw made', c.total === spy.draws, [c.total, spy.draws]);
  ok('total is headline times runs when every run is the same size', c.total === c.headline * c.runs, c);

  console.log('== a changed answer starts a new count');
  M.state.price = 5200;
  const spyBefore = { ...spy };
  await M.ensurePlanned();
  const fresh = M.simCount();
  ok('the old result key still reads its own count', fresh.key === M.resultKey && fresh.total === c.total);
  M.restore({ ...Object.fromEntries(Object.entries(M.state).filter(([, v]) => !(v instanceof Set))), asked: [] });
  const c2 = M.simCount();
  ok('the new key counts from its own first run', c2.runs === spy.calls - spyBefore.calls && c2.total === spy.draws - spyBefore.draws, [c2, spy, spyBefore]);

  console.log('== the sentence reads the run, not a literal');
  const line = M.overallInsight();
  ok('overall sentence names the count of the run', line.includes(`in half of ${M.count(M.planned.months[0].length)} runs`), line);
  const srcText = fs.readFileSync(path.join(H.ROOT, 'app.js'), 'utf8');
  const strings = srcText.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  ok('no "4,000" or "four thousand" in any string', !/4,000|four thousand/i.test(strings));
  ok('no "Mercy"', !/Mercy/.test(srcText));
  ok('no em dash in app.js', !/—/.test(srcText));
  finish();
})().catch((e) => { console.log('THROWN', e.stack); process.exit(1); });
