// R16 / C13: the whole tree, crown top to root tips, stands inside the usable viewport (the screen outside the clearing)
// at every stage and at 320, 390, 768, 1440 and 1920 wide; with it (Rebuild 1) the goal marker's ring and its label at the
// results, and every persistent label placed, inside the screen and clear of the others, at every stage.
// Read with the tree's own frameReport() (real three r147, fake DOM).
// node tests/tree-frames.cjs           all five sizes, asserts
// node tests/tree-frames.cjs 1440 900  one size
const { make } = require('./tree-harness.cjs');
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log(`FAIL ${msg}`); } };
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];
const SIZES = process.argv[2] ? [[+process.argv[2], +process.argv[3] || 900]] : [[320, 568], [390, 844], [768, 1024], [1440, 900], [1920, 1080]];
const STAGES = ['planting', 'offer', 'reach', 'routes', 'close', 'delivery', 'money', 'clients', 'close-pull', 'you', 'control', 'ground', 'cutscene', 'explore', 'harvest'];
const LABEL_PART = { offer: 'pricing', reach: 'demand', routes: { limb: 'demand', t: 0.8 }, close: 'conversion', delivery: 'capacity', money: 'margin', clients: 'retention', you: 'trunk', control: { limb: 'trunk', t: 0.8 }, ground: 'roots' };
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

SIZES.forEach(([W, H]) => {
  const h = make({ w: W, h: H });
  const t = h.tree;
  t.frame('arrival'); h.step(100);
  t.frame('roots'); h.step(1300);
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.playIntro(900, { leaves: 0 }); h.step(1400);
  LIMBS.forEach((id, i) => { t.setStub(id, false); t.setLimbFill(id, 1); t.setTwigs(id, Array.from({ length: 8 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' }))); });
  t.setRootBalance(0.7);
  // Rebuild 1: part states on the labels, a constraint, and the metric that shows at the results
  t.setPartState('demand', { name: 'Demand', value: '40 a month', state: 'user' });
  t.setPartState('pricing', { name: 'Pricing', value: 1200, unit: 'money', state: 'imported' });
  t.setPartState('capacity', { state: 'unknown' });
  t.setPartState('trunk', { name: 'Revenue now', value: 4000, unit: 'money', state: 'user' });
  t.setCollar('capacity');
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month in 12 months' });
  h.step(3000);
  console.log(`--- ${W} x ${H} (${t.portrait ? 'clearing below' : 'clearing left'})`);
  STAGES.forEach((k) => {
    if (!h.GT.PRESETS.includes(k)) { console.log(`${k.padEnd(11)} (no such preset)`); return; }
    if (k === 'cutscene') { t.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 }); t.setCrownLeaves(1); }
    if (LABEL_PART[k]) t.setLabel(LABEL_PART[k], `Section · ${k}`);
    t.frame(k); h.step(k === 'cutscene' ? 4200 : 1900);
    if (k === 'cutscene') { t.frame({ dist: 1.0, ms: 600 }); h.step(1900); }
    const r = t.frameReport();
    const u = r.usable || { left: t.portrait ? 0 : Math.round(0.46 * W), top: 0, right: W, bottom: H };
    const tr = r.tree;
    const cutH = Math.max(0, u.top - tr.top) + Math.max(0, tr.bottom - u.bottom), cutW = Math.max(0, u.left - tr.left) + Math.max(0, tr.right - u.right);
    const offH = cutH / Math.max(1, tr.bottom - tr.top), offW = cutW / Math.max(1, tr.right - tr.left);
    const labels = r.labels.filter((l) => l.kind !== 'live');
    const moving = r.labelsMoving || [];
    console.log(`${k.padEnd(11)} tree y ${tr.top}..${tr.bottom} x ${tr.left}..${tr.right} | usable y ${u.top}..${u.bottom} x ${u.left}..${u.right} | off: ${(offH * 100).toFixed(0)}% of its height, ${(offW * 100).toFixed(0)}% of its width | labels ${labels.length}${moving.length ? ` (+${moving.length} changing place)` : ''}${r.labelsHidden.length ? ` (nowhere: ${r.labelsHidden.join(', ')})` : ''}${r.marker ? ` | ring y ${r.marker.top}..${r.marker.bottom}` : ''} | base ${r.base.x},${r.base.y} ${r.corrected.join('; ')}`);
    // the labels: placed, inside the screen, none on another (every stage, every size)
    ok(r.labels.every((l) => l.inside), `${W} ${k}: every label is inside the screen (${r.labels.filter((l) => !l.inside).map((l) => l.id).join(', ')})`);
    let pairs = true;
    r.labels.forEach((a, i) => r.labels.forEach((b, j) => { if (j > i && overlap(a, b)) pairs = false; }));
    ok(pairs, `${W} ${k}: no two labels overlap`);
    // every group label is in play: placed, or fading between two places while the camera settles. None is ever dropped
    // for want of room at these sizes; one that found nowhere would wait unseen rather than sit on the tree or on another label
    const inPlay = labels.filter((l) => l.kind === 'group').length + moving.filter((id) => id !== 'marker' && id !== 'plan' && id !== 'crown').length;
    // Final 1 (Task 20) put "Now" beside the crown, in the target's own metric and unit, so ten labels want room at the
    // results. At 320 the trunk's own word (rank 8 of 9) can be the one that finds nowhere: it waits unseen rather than sit
    // on the tree or on another label, and the figure it carries is the one the Now label is already showing. Every
    // business group, the goal line's label and Now are still placed.
    const trade = W <= 320 && !!r.marker && inPlay === 5 && r.labelsHidden.every((id) => id === 'trunk' || id === 'roots');
    /* 28 September (Declan Murphy): under LABEL.tight the tree names the part in play and nothing else, so six words do
       not land on a 200 px drawing. Wider than that the rule above stands unchanged. */
    const tight = W < 820;
    if (k !== 'planting') ok(tight ? inPlay <= 2 : (inPlay === 6 || trade), `${W} ${k}: ${tight ? 'only the part in play is named' : 'all six group labels are in play'} (${labels.filter((l) => l.kind === 'group').length} placed, ${moving.length} changing place, nowhere: ${r.labelsHidden.join(', ') || 'none'})`);
    if (k === 'ground') return; // Roots and Ground look at the root ball from below the soil: the crown is not the subject
    ok(tr.top >= u.top - 2, `${W} ${k}: the crown's top is inside (${tr.top} vs ${u.top})`);
    ok(tr.bottom <= u.bottom + 2, `${W} ${k}: the root tips are inside (${tr.bottom} vs ${u.bottom})`);
    ok(tr.left >= u.left - 2 && tr.right <= u.right + 2, `${W} ${k}: nothing past the sides (${tr.left}..${tr.right} vs ${u.left}..${u.right})`);
    if (k === 'cutscene' || k === 'explore' || k === 'harvest') {
      ok(r.marker && r.marker.inside, `${W} ${k}: the goal marker's ring is inside the usable viewport`);
      const lab = r.labels.find((l) => l.id === 'marker');
      ok(lab && lab.inside, `${W} ${k}: the ring's label is placed inside the screen`);
    } else ok(!r.marker, `${W} ${k}: no marker before the results`);
  });
  // the plan view at the results: the silhouette is inside too, whatever the scenario
  t.setView('plan'); h.step(1200);
  let r = t.frameReport();
  ok(r.plan && r.plan.top >= r.usable.top - 2 && r.inside, `${W} plan view: the scenario's silhouette is inside`);
  t.setMetric({ baseline: 4000, scenario: 20000, target: 12000, label: 'Target: £12,000 a month' }); h.step(2500);
  r = t.frameReport();
  ok(r.plan && r.plan.top >= r.usable.top - 2 && r.inside && r.marker.inside, `${W} plan view, a scenario past the target: everything still fits (plan top ${r.plan.top}, usable top ${r.usable.top})`);
  console.log(`plan (past) tree y ${r.tree.top}..${r.tree.bottom} | plan y ${r.plan.top}..${r.plan.bottom} | ring y ${r.marker.top}..${r.marker.bottom} | labels ${r.labels.length}${r.labelsHidden.length ? ` (hidden: ${r.labelsHidden.join(', ')})` : ''}`);
});
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
