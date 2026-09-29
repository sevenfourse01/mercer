// Rebuild 1 (R10, C13): the goal marker and its linear mapping, setPartState's materials and words, setView's transition,
// the persistent group labels (placed clear of each other, the tree and the discs), the Core out of the main journey, the
// 'group' inspect, resizing, reduced motion, and the flat tree's versions. Real three r147, fake DOM (tests/tree-harness.cjs).
// node tests/tree-rebuild1.cjs
const { make } = require('./tree-harness.cjs');
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) { passes++; console.log(`ok   ${msg}`); } else { fails++; console.log(`FAIL ${msg}`); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];

/** a late interview tree: roots from four sources, every limb grown with eight answered twigs, part states on most parts */
function grown(h, opts = {}) {
  const t = h.tree;
  t.frame('roots'); h.step(1300);
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.playIntro(900, { leaves: 0 }); h.step(1400);
  LIMBS.forEach((id, i) => { t.setStub(id, false); t.setLimbFill(id, 1); t.setTwigs(id, Array.from({ length: 8 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' }))); });
  t.setRootBalance(0.7);
  if (opts.states !== false) {
    t.setPartState('demand', { name: 'Demand', value: '40 a month', state: 'user' });
    t.setPartState('conversion', { name: 'Conversion', value: '35%', state: 'assumed' });
    t.setPartState('pricing', { name: 'Pricing', value: 1200, unit: 'money', state: 'imported' });
    t.setPartState('capacity', { state: 'unknown' });
    t.setPartState('trunk', { name: 'Revenue now', value: 4000, unit: 'money', state: 'user' });
    t.setPartState('roots', { name: 'Evidence', value: '11 facts', state: 'calculated' });
  }
  h.step(2000);
  return t;
}
const boxesOverlap = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;

/* ---------- 1. the metric's mapping: monotonic and linear, the ring at the target, the frame holds a scenario past it ---------- */
{
  const h = make({ w: 1440, h: 900 });
  const t = grown(h);
  const GT = h.GT;
  ok(GT.GROUPS && GT.GROUPS.customers.join() === 'demand,conversion,retention' && GT.GROUPS.offer.join() === 'pricing,margin' && GT.GROUPS.delivery.join() === 'capacity' && GT.GROUPS.leverage.join() === 'control', 'GrowthTree.GROUPS is the four business groups over the six limbs and control');
  ok(GT.EVIDENCE.user === 'Your answer' && GT.EVIDENCE.source === 'From a source' && GT.EVIDENCE.assumed === 'Assumption' && GT.EVIDENCE.calculated === 'Calculated' && GT.EVIDENCE.unknown === 'Not known yet', 'the evidence words are the five of R9, never "verified"');
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month in 12 months', unit: 'money' });
  const hs = [0, 3000, 6000, 9000, 12000, 15000].map((v) => t.heightOf(v));
  ok(hs.every((v, i) => i === 0 || v > hs[i - 1]), `heightOf is monotonic (${hs.map((v) => v.toFixed(2)).join(' < ')})`);
  const d = hs.slice(1).map((v, i) => v - hs[i]);
  ok(d.every((x) => near(x, d[0], 1e-6)), `and linear: equal steps of value give equal steps of height (${d.map((x) => x.toFixed(3)).join(', ')})`);
  ok(near(t.heightOf(12000), t.ringY, 1e-6), 'the ring stands exactly where the crown\'s top would be at the target');
  ok(near(t.metricScale(0), GT.METRIC.floor / 2.4, 1e-9) && near(t.metricScale(12000), GT.METRIC.goal / 2.4, 1e-9), 'value 0 is the floor (a seedling, never nothing) and the target is H_GOAL: the same axis for baseline, scenario and target');
  ok(t.heightOf(24000) > t.ringY && near(t.heightOf(24000), t.heightOf(30000), 1e-9), 'a value past the target rises past the ring, up to the cap');
  ok(t.getMetric().baseline === 4000 && t.getMetric().scenario === 9000, 'getMetric() returns what was set');
  ok(t.getView() === 'current', 'the view starts current');
  // before the results: nothing changes (the marker shows once the tree encodes)
  t.frame('offer'); h.step(1500);
  ok(!t.marker.visible && t.frameReport().marker === null && near(t.tree.scale.x, 0.9, 0.01), 'during questioning the marker is not shown and the tree keeps its interview size (height means nothing yet)');
  t.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 }); t.setCrownLeaves(1);
  t.frame('cutscene'); h.step(4200); t.frame({ dist: 1.0, ms: 600 }); h.step(2500);
  let r = t.frameReport();
  ok(t.marker.visible && r.marker && r.marker.k === 1 && near(t.markerMat.opacity, GT.METRIC.alpha, 0.02), 'at the results the ring eases in to its full (flat) opacity');
  ok(near(t.tree.scale.x, t.metricScale(4000), 0.01), `the current crown stands at the baseline (scale ${t.tree.scale.x.toFixed(3)}), not at the older progress`);
  ok(r.marker.inside && r.inside && r.tree.top <= r.marker.top + 1, 'the frame holds the whole tree and the ring (the ring is the frame\'s top)');
  const lab = r.labels.find((l) => l.id === 'marker');
  ok(lab && lab.text === 'Target: £12,000 a month in 12 months' && lab.inside && lab.y1 <= r.marker.top + 2, `the ring's label stands above the ring, inside the screen (${lab && `${lab.x0},${lab.y0}..${lab.x1},${lab.y1}`})`);
  ok(r.reserve[2] === GT.FIT.labels.top && r.tree.top >= r.usable.top + r.reserve[2] - 3, 'the fit keeps room above the ring for its label');
  // a scenario past the target
  t.frame('explore'); h.step(1500);
  t.setMetric({ baseline: 4000, scenario: 20000, target: 12000, label: 'Target: £12,000 a month' }); h.step(2500);
  r = t.frameReport();
  ok(r.inside && r.plan && r.plan.top >= r.usable.top - 2 && r.marker.inside, `a scenario past the target: the frame still fits everything (plan top ${r.plan.top}, usable top ${r.usable.top})`);
  ok(r.plan.top < r.marker.top, 'and the scenario\'s silhouette stands above the ring');
  // a milestone
  t.setMetric(null, 'First paying customer'); h.step(2500);
  r = t.frameReport();
  ok(t.getMetric() === null && r.marker && r.marker.label === 'Milestone: First paying customer' && near(t.tree.scale.x, 0.9, 0.01), 'setMetric(null, text): a labelled ring at a fixed height, the tree at its interview size');
  ok(t.fruitMesh.count === 0 && t.leafLit === -2, 'a milestone implies no number: no fruit hangs and no leaf dries');
  ok(t.frameReport().labels.some((l) => l.id === 'marker' && l.text === 'Milestone: First paying customer'), 'the milestone\'s label shows');
  t.setMetric({ milestone: 'Ten conversations' }); h.step(300);
  ok(t.getMetric() === null && t.metricLabel === 'Milestone: Ten conversations', 'setMetric({ milestone }) is a milestone too');
  t.setMetric({ target: 0, baseline: 5 }); ok(t.getMetric() === null, 'a target of 0 is no scalar metric: a milestone');
  t.setMetric({ baseline: 100, target: 200 }); ok(t.metricLabel === 'Target: 200', 'without a label, "Target: <target>" is made');
  t.setMetric({ baseline: 100, target: 200, unit: 'clients a month' }); ok(t.metricLabel === 'Target: 200 clients a month', 'the unit follows the number');
}

/* ---------- 2. setView: the plan silhouette eases in over METRIC.ms at the scenario's height; a cut under reduced motion ---------- */
{
  const h = make({ w: 1440, h: 900 });
  const t = grown(h);
  const GT = h.GT;
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month', scenarioLabel: 'Plan: £9,000 a month' });
  t.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 }); t.setCrownLeaves(1);
  t.frame('explore'); h.step(3000);
  const views = [];
  t.on('view', (v) => views.push(v.view));
  ok(!t.plan.visible && t.planK === 0, 'current: no silhouette');
  ok(t.setView('plan') === 'plan' && views.join() === 'plan', 'setView(\'plan\') returns the view and emits \'view\'');
  h.step(160);
  const mid = t.planK;
  ok(mid > 0.05 && mid < 0.95 && t.plan.visible, `the silhouette is easing in (${mid.toFixed(2)} after 160 ms)`);
  h.step(600);
  ok(near(t.planK, 1, 0.001) && near(t.plan.scale.x, t.metricScale(9000), 1e-6) && near(t.planMat.opacity, GT.METRIC.planAlpha, 0.01), 'and stands at the scenario\'s height, translucent');
  ok(near(t.tree.scale.x, t.metricScale(4000), 0.01), 'the current crown stays at the baseline in the plan view');
  const r = t.frameReport();
  const pl = r.labels.find((l) => l.id === 'plan');
  ok(pl && pl.text === 'Plan: £9,000 a month' && pl.inside, 'the plan\'s label shows the scenarioLabel');
  ok(t.setView('nonsense') === 'current' && views[views.length - 1] === 'current', 'an unknown view is current');
  h.step(700);
  ok(!t.plan.visible && t.planK === 0 && !t.frameReport().labels.some((l) => l.id === 'plan'), 'current again: the silhouette and its label go');
  ok(t.setView('plan') === 'plan' && t.setView('plan') === 'plan' && views.filter((v) => v === 'plan').length === 2, 'setting the same view again emits nothing');
  // reduced motion: a cut
  const h2 = make({ w: 1440, h: 900, reduce: true });
  const t2 = grown(h2);
  t2.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target' }); t2.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 });
  t2.frame('explore'); h2.step(2000);
  ok(t2.marker.visible && near(t2.markerMat.opacity, h2.GT.METRIC.alpha, 0.01), 'reduced motion: the ring is at its full opacity at once');
  t2.setView('plan'); h2.step(16);
  ok(t2.planK === 1 && t2.plan.visible, 'reduced motion: the silhouette is a cut');
  t2.setView('current'); h2.step(16);
  ok(t2.planK === 0 && !t2.plan.visible, 'and so is its going');
}

/* ---------- 3. setPartState: the material states ---------- */
{
  const h = make({ w: 1440, h: 900 });
  const t = grown(h, { states: false });
  const GT = h.GT;
  const PALE = 0.22;
  const b = (id) => t.branches.get(id);
  t.frame('offer'); h.step(1500);
  ok(near(b('pricing').mat.opacity, 1, 0.02), 'an entered limb is solid bark');
  ok(t.setPartState('pricing', { name: 'Pricing', value: 1200, unit: 'money', state: 'unknown' }).state === 'unknown', 'setPartState returns the state held');
  h.step(2500);
  ok(near(b('pricing').mat.opacity, PALE, 0.02), 'unknown: the limb wears the stub\'s pale bark (0.22)');
  t.setPartState('pricing', { state: 'user', value: 1200 }); h.step(2500);
  ok(near(b('pricing').mat.opacity, 1, 0.02), 'an evidence-backed state (user) resolves it to solid');
  ['imported', 'source', 'assumed', 'calculated'].forEach((s) => { t.setPartState('margin', { state: s }); h.step(2500); ok(near(b('margin').mat.opacity, 1, 0.02), `${s} is evidence-backed: solid`); });
  t.setPartState('margin', 'unknown'); h.step(2500);
  ok(near(b('margin').mat.opacity, PALE, 0.02), 'a state given as a string works');
  t.setPartState('margin', null); t.setStub('margin', true); h.step(2500);
  ok(near(b('margin').mat.opacity, PALE, 0.02), 'null clears the part: setStub rules again');
  ok(t.setPartState('nonsense', { state: 'user' }) === null, 'an unknown part is refused');
  ok(t.setPartState('demand', { state: 'nonsense' }).state === 'unknown', 'an unknown state reads as unknown');
  // the trunk
  t.setTrunkKnown(true); h.step(2000);
  ok(near(t.mat.bark.opacity, 1, 0.02), 'the trunk is solid once known');
  t.setPartState('trunk', { name: 'Revenue now', state: 'unknown' }); h.step(2000);
  ok(near(t.mat.bark.opacity, PALE, 0.02) && t.trunkKnown === false, 'setPartState(\'trunk\', unknown) is the pale trunk of R6');
  t.setPartState('you', { state: 'calculated' }); h.step(2000);
  ok(near(t.mat.bark.opacity, 1, 0.02) && t.trunkKnown === true, "'you' names the trunk too; calculated resolves it");
  // the roots and control
  t.setPartState('roots', { state: 'unknown' }); h.step(2000);
  ok(GT.SOURCES.every((id) => near(t.mat.roots[id].opacity, PALE, 0.02)), 'roots unknown: every root bundle is pale');
  t.setPartState('roots', { state: 'source' }); h.step(2000);
  ok(GT.SOURCES.every((id) => near(t.mat.roots[id].opacity, 1, 0.02)), 'roots from a source: solid');
  t.setPartState('control', { state: 'unknown' }); h.step(2000);
  ok(near(t.ctl.mat.opacity, PALE, 0.02) && near(t.mat.bark.opacity, 1, 0.02), 'control unknown: the control host is pale while the trunk stays solid');
  t.setPartState('control', null); h.step(2000);
  ok(near(t.ctl.mat.opacity, 1, 0.02), 'cleared, it follows the trunk again');
  // the crown
  t.setCrownLeaves(1); t.frame('explore'); h.step(2500);
  const before = t.leafColours[0].getHex();
  t.setPartState('crown', { state: 'unknown' }); h.step(2500);
  const after = t.leafColours[0].getHex();
  ok(before !== after && t.crownPaleK > 0.95, 'crown unknown: the crown\'s own leaves fade toward the sky');
  t.setPartState('crown', { state: 'calculated', name: 'Now', value: 4000, unit: 'money' }); h.step(2500);
  ok(t.leafColours[0].getHex() === before, 'and come back when it is evidence-backed');
  ok(Object.keys(t.partStates()).sort().join() === 'crown,demand,pricing,roots,trunk', `partStates() holds what was set and not what was cleared (${Object.keys(t.partStates()).sort().join(', ')})`);
  // reduced motion: a cut
  const h2 = make({ w: 1440, h: 900, reduce: true });
  const t2 = grown(h2, { states: false });
  t2.frame('offer'); h2.step(500);
  t2.setPartState('pricing', 'unknown'); h2.step(16);
  ok(near(t2.branches.get('pricing').mat.opacity, PALE, 0.01), 'reduced motion: the pale state is a cut');
}

/* ---------- 4. the persistent labels: words, expansion, placement clear of everything, the Core, the inspect ---------- */
{
  const h = make({ w: 1440, h: 900 });
  const t = grown(h);
  const GT = h.GT;
  const labels = () => t.frameReport().labels.filter((l) => l.kind !== 'live');
  const byId = (id) => t.frameReport().labels.find((l) => l.id === id);
  t.setLabel('demand', 'Customers · Reach'); t.frame('reach'); h.step(2500);
  let r = t.frameReport();
  ok(labels().length === 6 && ['customers', 'offer', 'delivery', 'leverage', 'trunk', 'roots'].every((id) => byId(id)), 'six persistent labels show on a question screen');
  ok(byId('customers').mode === 'expanded' && ['offer', 'leverage', 'trunk', 'roots'].every((id) => byId(id).mode === 'small'), 'the active group (from the live label\'s part) is expanded, the rest are the word alone');
  ok(byId('customers').text === 'Customers' && byId('offer').text === 'Offer' && byId('delivery').text === 'Delivery' && byId('leverage').text === 'Leverage' && byId('trunk').text === 'Baseline' && byId('roots').text === 'Roots', 'business words: Customers, Offer, Delivery, Leverage, Baseline, Roots');
  const cEl = t.tagList.find((L) => L.id === 'customers').el;
  const lines = cEl.querySelectorAll('.tree-group-part');
  ok(lines.length === 2 && lines[0].dataset.part === 'demand' && lines[0].querySelector('em').textContent === 'Your answer' && lines[0].querySelector('.tree-group-value').textContent === '40 a month' && lines[1].querySelector('em').textContent === 'Assumption', 'the expanded label carries one line per part with its value and evidence word');
  ok(cEl.querySelector('small').textContent === 'three limbs' && cEl.tagName === 'BUTTON' && cEl.getAttribute('aria-label').startsWith('Customers; Demand, 40 a month, your answer'), 'the botanical word sits under it in the small type; a button with an accessible name');
  t.setCollar('capacity'); h.step(500);
  ok(byId('delivery').mode === 'expanded', 'the constraint\'s group (the collar) is expanded too');
  ok(byId('delivery') && byId('delivery').text === 'Delivery' && t.tagList.find((L) => L.id === 'delivery').el.querySelector('.tree-group-part[data-state="unknown"] em').textContent === 'Not known yet', 'an unknown part says "Not known yet"');
  // clear of everything
  const clear = (tag) => {
    const ls = t.frameReport().labels;
    let pairs = true, inside = true;
    ls.forEach((a, i) => { if (!a.inside) inside = false; ls.forEach((b, j) => { if (j > i && boxesOverlap(a, b)) pairs = false; }); });
    ok(pairs, `${tag}: no two labels overlap (${ls.length} shown)`);
    ok(inside, `${tag}: every label is inside the screen`);
    // none on the wood or the leaves: the obstacle circles the tree lists
    t.scene.updateMatrixWorld();
    const n = t.labelObstacles();
    let onTree = false;
    ls.forEach((a) => { for (let k = 0; k < n; k += 3) { const cx = t.obs[k], cy = t.obs[k + 1], rr = t.obs[k + 2]; const dx = cx < a.x0 ? a.x0 - cx : cx > a.x1 ? cx - a.x1 : 0, dy = cy < a.y0 ? a.y0 - cy : cy > a.y1 ? cy - a.y1 : 0; if (dx * dx + dy * dy < rr * rr) onTree = true; } });
    ok(!onTree, `${tag}: no label sits on the wood, the leaves, the roots, the ring or a disc`);
  };
  clear('reach');
  t.setLabel({ limb: 'trunk', t: 0.8 }, 'Leverage · Control'); t.frame('control'); h.step(2500);
  ok(byId('leverage').mode === 'expanded' && byId('customers').mode === 'small', 'the control section expands Leverage');
  clear('control');
  t.setLabel('roots', 'Roots'); t.frame('ground'); h.step(2500);
  ok(byId('roots').mode === 'expanded', 'Ground expands Roots');
  clear('ground');
  // results: all expanded, discs on the limbs, the marker
  t.setLabel('crown', '');
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month in 12 months' });
  t.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 }); t.setCrownLeaves(1);
  t.frame('explore'); h.step(3000);
  t.setDiscs(LIMBS.map((id, i) => ({ id: `d${i}`, part: id, state: i % 2 ? 'hollow' : 'filled', name: `Card ${i}`, scale: 1 })));
  h.step(2500);
  ok(labels().filter((l) => l.kind === 'group').every((l) => l.mode === 'expanded'), 'at the results every group label is expanded (1440: wider than LABEL.tight)');
  clear('explore with discs');
  t.setView('plan'); h.step(1500);
  clear('explore, plan view');
  // stable: the same places over time when nothing changes (explore idles into a slow turn after 6 s: held off here)
  t.pose.idleAfter = 0;
  h.step(1000);
  const a1 = t.frameReport().labels.map((l) => `${l.id}@${l.x0},${l.y0}`).join('|');
  h.step(3000);
  const a2 = t.frameReport().labels.map((l) => `${l.id}@${l.x0},${l.y0}`).join('|');
  ok(a1 === a2, 'the places hold while nothing changes');
  // the Core: not in the main journey
  const core = h.doc.createElement('div'); core.id = 'core'; h.doc.body.appendChild(core);
  t.setCoreHost(core); h.step(100);
  ok(core.dataset.placed === '0' && !t.coreOn, 'the Core is not placed at the results');
  t.frame('offer'); h.step(1500);
  ok(core.dataset.placed === '0', 'nor on a question screen');
  t.showCore(true); h.step(100);
  ok(core.dataset.placed === '1' && t.coreOn, 'showCore(true) places it (the older journey)');
  t.showCore(false); t.frame('intro'); h.step(1500);
  ok(core.dataset.placed === '1', 'the intro\'s demonstration still places it');
  t.frame('explore'); h.step(1500);
  ok(core.dataset.placed === '0', 'and it goes again after');
  // the inspect
  const got = [];
  t.on('inspect', (d) => got.push(d));
  const cust = t.tagList.find((L) => L.id === 'customers');
  cust.el.dispatch('click', { clientX: 500, clientY: 300 });
  ok(got.length === 1 && got[0].kind === 'group' && got[0].id === 'customers' && got[0].group === 'customers' && got[0].parts.length === 3 && got[0].parts[0].state === 'user' && got[0].parts[2].state === 'unknown' && got[0].x === 500, `a press on a group label emits 'inspect' { kind: 'group', group, parts } (${JSON.stringify(got[0]).slice(0, 80)}...)`);
  // the keyboard reaches the labels: Up from nothing is a root, Up again a label
  const key = (k) => h.stage.dispatch('keydown', { key: k, target: h.stage });
  h.stage.focus();
  key('ArrowUp'); key('ArrowUp'); key('ArrowUp'); key('ArrowUp'); key('ArrowUp');
  const part = t.focusParts[t.focusAt];
  ok(part && part.kind === 'group', `Up past the root bundles reaches a group label (${part && part.id})`);
  key('Enter');
  ok(got.length === 2 && got[1].kind === 'group' && got[1].id === part.id, 'Enter on it inspects the group');
  key('Escape');
  // words and modes
  t.setGroupWords({ trunk: { word: 'Concept', small: 'trunk' }, customers: 'Opportunities' }); h.step(1500);
  ok(byId('trunk').text === 'Concept' && t.tagList.find((L) => L.id === 'customers').text === 'Opportunities', 'setGroupWords re-words the labels for a route');
  t.setGroupWords({ trunk: null, customers: null }); h.step(300);
  ok(byId('trunk').text === 'Baseline', 'null returns a word');
  t.setEncoding(false); // back in the interview: a section frame does not end the encoding by itself (as before)
  t.setActiveGroup('offer'); t.frame('offer'); h.step(1900); // past the 1.5 s re-search and its 130 ms fade
  ok(byId('offer').mode === 'expanded' && byId('customers').mode === 'small', 'setActiveGroup names the expanded group outright');
  t.setActiveGroup('capacity'); h.step(300);
  ok(t.activeGroup === 'delivery', 'a part id names its group');
  t.setActiveGroup(undefined);
  ok(t.setGroupLabels('none') === 'none', 'setGroupLabels(\'none\')');
  h.step(300);
  ok(labels().length === 0 && t.frameReport().reserve[0] === 0, 'takes every persistent label away, and the fit keeps no room for them');
  t.setGroupLabels('all'); h.step(300);
  ok(labels().length === 6 && labels().every((l) => l.mode === 'expanded'), '\'all\' expands every label');
  t.setGroupLabels('auto');
  // no work when nothing changes: syncLabels runs only when something is dirty
  h.step(200);
  let syncs = 0;
  const was = t.syncLabels;
  t.syncLabels = function (now) { syncs++; return was.call(this, now); };
  h.step(1000);
  ok(syncs === 0, 'the labels\' words are not rebuilt while nothing changes (no per-frame work)');
  t.syncLabels = was;
  // toSeed clears the states and the view
  t.setView('plan'); t.toSeed(); h.step(100);
  ok(Object.keys(t.partStates()).length === 0 && t.getView() === 'current' && !t.plan.visible && !t.marker.visible, 'toSeed() clears the part states, the view and the marker (the metric stays the page\'s)');
}

/* ---------- 5. C13: the marker and the labels at 320, 390, 768, 1440 and 1920; resizing keeps the current branch ---------- */
{
  [[320, 568], [390, 844], [768, 1024], [1440, 900], [1920, 1080]].forEach(([W, H]) => {
    const h = make({ w: W, h: H });
    const t = grown(h);
    t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month in 12 months' });
    t.setMetrics({ progress: 0.6, odds: 0.5, profit: 0.4, repeat: 0.2 }); t.setCrownLeaves(1);
    ['cutscene', 'explore', 'harvest'].forEach((k) => {
      t.frame(k); h.step(k === 'cutscene' ? 4200 : 2500);
      if (k === 'cutscene') { t.frame({ dist: 1.0, ms: 600 }); h.step(2000); }
      const r = t.frameReport();
      ok(r.marker && r.marker.inside && r.inside, `${W} ${k}: the ring and the whole tree are inside the usable viewport`);
      const lab = r.labels.find((l) => l.id === 'marker');
      ok(lab && lab.inside, `${W} ${k}: the ring's label is placed and inside the screen`);
      const groups = r.labels.filter((l) => l.kind === 'group');
      /* the contract changed on 28 September (Declan Murphy: text bleeding over the tree). Under LABEL.tight the drawing
         carries only the part in play, because six words beside a 200 px tree land on the bark. Wider than that, every
         group is named as before. Either way nothing a reader sees may fall outside the screen. */
      const want = W < 820 ? 0 : 5;
      ok(groups.length >= want && groups.every((l) => l.inside), `${W} ${k}: ${groups.length} group labels placed (at least ${want}), all inside (hidden: ${r.labelsHidden.join(', ') || 'none'})`);
      let pairs = true;
      r.labels.forEach((a, i) => r.labels.forEach((b, j) => { if (j > i && boxesOverlap(a, b)) pairs = false; }));
      ok(pairs, `${W} ${k}: no two labels overlap`);
    });
    t.setView('plan'); h.step(1500);
    const r = t.frameReport();
    ok(r.plan && r.plan.top >= r.usable.top - 2 && r.inside, `${W} plan view: the silhouette is inside too`);
  });
  // resizing in a section: the current branch's tip stays in the usable viewport, the labels are placed again
  const h = make({ w: 1440, h: 900 });
  const t = grown(h);
  t.setLabel('demand', 'Customers · Reach'); t.frame('reach'); h.step(2500);
  const tipIn = (r) => { const a = r.anchors.demand; return a && a.inView && a.x >= r.usable.left && a.x <= r.usable.right && a.y >= r.usable.top && a.y <= r.usable.bottom; };
  ok(tipIn(t.frameReport()), '1440 reach: the demand limb\'s tip is in the usable viewport');
  const resize = (W, H) => { h.stage.clientWidth = W; h.stage.clientHeight = H; h.win.innerWidth = W; h.win.innerHeight = H; h.doc.body.dataset.clearing = W < 721 ? 'bottom' : 'left'; h.step(2500); };
  resize(768, 1024);
  let r = t.frameReport();
  ok(r.size.w === 768 && r.preset === 'reach' && tipIn(r) && r.inside, `768 after a resize: the same section, its limb in view, the whole tree inside (${r.tree.left}..${r.tree.right})`);
  ok(r.labels.some((l) => l.id === 'customers' && l.inside), 'and the active group\'s label is placed again');
  resize(390, 844);
  r = t.frameReport();
  ok(r.portrait && r.preset === 'reach' && tipIn(r) && r.inside, '390 (the clearing below) after a resize: the same section, its limb in view');
  resize(320, 568);
  r = t.frameReport();
  ok(r.preset === 'reach' && tipIn(r) && r.inside, '320 x 568: the same');
  resize(1920, 1080);
  r = t.frameReport();
  ok(!r.portrait && r.preset === 'reach' && tipIn(r) && r.inside && r.labels.length >= 6, '1920 after a resize back: the section, its limb, the labels');
}

/* ---------- 6. the flat tree ---------- */
{
  const h = make({ w: 1440, h: 900, flat: true });
  const t = h.tree;
  t.svg.clientWidth = 700; t.svg.clientHeight = 800;
  const got = [];
  t.on('inspect', (d) => got.push(d));
  t.playIntro(10, {}); h.step(100);
  t.setRootSources({ you: 3, sector: 1 });
  ['pricing', 'demand'].forEach((id) => { t.setStub(id, false); t.setLimbFill(id, 1); });
  t.setPartState('demand', { name: 'Demand', value: '40 a month', state: 'user' });
  t.setPartState('capacity', { state: 'unknown' });
  t.setLabel('demand', 'Customers · Reach'); h.step(200);
  let r = t.frameReport();
  ok(r.labels.length === 6 && r.labels.find((l) => l.id === 'customers').mode === 'expanded' && r.labels.filter((l) => l.mode === 'small').length === 5, 'flat: six labels, the active group expanded');
  let pairs = true;
  r.labels.forEach((a, i) => r.labels.forEach((b, j) => { if (j > i && boxesOverlap(a, b)) pairs = false; }));
  ok(pairs, 'flat: no two labels overlap');
  ok(t.svg.querySelector('[data-part="capacity"]').getAttribute('opacity') === '0.22' && t.svg.querySelector('[data-part="demand"]').getAttribute('opacity') === '1', 'flat: an unknown part is pale, an answered one solid');
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month' });
  t.frame('explore'); h.step(200);
  r = t.frameReport();
  ok(r.marker && r.marker.inside && r.marker.label === 'Target: £12,000 a month' && t.svg.querySelector('.flat-marker'), 'flat: the ring and its label at the results');
  ok(t.svg.querySelector('.flat-trunk').getAttribute('d').endsWith(`L150 ${300 - 210 * t.heightRatio()}`) && near(t.heightRatio(), t.metricScale(4000) / (h.GT.METRIC.goal / 2.4), 1e-9), 'flat: the trunk stands at the baseline on the same linear axis');
  ok(r.labels.every((l) => l.mode === 'expanded' || l.kind !== 'group'), 'flat: all expanded at the results');
  t.setView('plan'); h.step(100);
  ok(t.svg.querySelector('.flat-plan') && t.frameReport().labels.some((l) => l.id === 'plan'), 'flat: the plan view draws the silhouette and its label');
  t.setView('current'); h.step(100);
  ok(!t.svg.querySelector('.flat-plan'), 'flat: current takes it away');
  t.tagList.find((L) => L.id === 'customers').el.dispatch('click', {});
  ok(got.length === 1 && got[0].kind === 'group' && got[0].parts.length === 3, 'flat: a press on a label inspects the group');
  t.setMetric(null, 'First paying customer'); h.step(100);
  ok(t.frameReport().marker.label === 'Milestone: First paying customer' && near(t.heightRatio(), 0.8, 1e-9), 'flat: a milestone ring, the trunk at its interview size');
  const core = h.doc.createElement('div'); core.id = 'core'; h.doc.body.appendChild(core);
  t.setCoreHost(core); h.step(50);
  ok(core.dataset.placed === '0', 'flat: the Core is not placed at the results');
  t.toSeed(); h.step(50);
  ok(Object.keys(t.partStates()).length === 0 && t.frameReport().labels.length === 0, 'flat: toSeed clears the states and the labels');
}

console.log(fails ? `\n${fails} of ${passes + fails} FAILED` : `\nall ${passes} passed`);
process.exit(fails ? 1 : 0);
