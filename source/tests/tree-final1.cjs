// Final 1 (tree): the halo at every stage (D11, Task 06), the labelled goal line and the milestone marker (Task 20, D12),
// the branch inspector and the Whole tree reset (Tasks 19 and 21), the pointer depth, and the height rule: answering more
// questions must never look like earning more money.
// Real three r147, fake DOM, a clock we drive.  node tests/tree-final1.cjs
const { make } = require('./tree-harness.cjs');
let fails = 0, total = 0;
const ok = (cond, msg) => { total++; if (cond) console.log(`ok   ${msg}`); else { fails++; console.log(`FAIL ${msg}`); } };
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];
const SECTIONS = ['offer', 'reach', 'routes', 'close', 'delivery', 'money', 'clients'];

/** a grown tree with twigs, roots and part states, as the page leaves it by the results */
function grown(opts = {}) {
  const h = make(opts);
  const t = h.tree;
  t.frame('arrival'); h.step(100);
  t.frame('roots'); h.step(900);
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.playIntro(700, { leaves: 0 }); h.step(1200);
  LIMBS.forEach((id, i) => {
    t.setStub(id, false);
    t.setLimbFill(id, 1);
    t.setTwigs(id, Array.from({ length: 8 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' })));
  });
  t.setRootBalance(0.7);
  t.setPartState('demand', { name: 'Demand', value: '40 enquiries a month', state: 'user' });
  t.setPartState('pricing', { name: 'Pricing', value: 1200, unit: 'money', state: 'imported' });
  t.setPartState('capacity', { state: 'unknown' });
  t.setPartState('trunk', { name: 'Revenue now', value: 4000, unit: 'money', state: 'user' });
  h.step(2000);
  return h;
}
const METRIC = { baseline: 4000, scenario: 9000, target: 12000, unit: 'money', horizon: 'March 2027' };

/* ---------- D11 / Task 06: the halo is there at every stage, and it is not a score ---------- */
{
  const h = make({});
  const t = h.tree, GT = h.GT;
  ok(!!t.halo.el && h.stage.children[0] === t.halo.el, 'the halo is made at mount, behind the canvas (the tree draws over it)');
  ok(t.halo.el.getAttribute('aria-hidden') === 'true' && t.halo.el.tagName === 'DIV', 'it is decorative: aria-hidden, no text, no control');
  t.frame('arrival'); h.step(400);
  ok(t.getHalo().shown === true, 'the halo is there at the arrival, before anything is planted');
  // the first tree demonstration (the intro)
  t.playIntro(800, { leaves: 1, preset: 'intro' }); h.step(1400);
  ok(t.getHalo().shown === true, 'and through the first tree demonstration');
  const seen = [];
  const stages = ['roots', 'planting'].concat(SECTIONS).concat(['you', 'control', 'ground', 'cutscene', 'explore', 'harvest']);
  stages.forEach((k) => { t.frame(k); h.step(1500); const g = t.getHalo(); seen.push(`${k}:${g.shown ? g.level : 'gone'}`); });
  ok(seen.every((s) => !s.endsWith(':gone')), `the halo stands at every stage after it (${seen.filter((s) => s.endsWith(':gone')).join(', ') || 'none missing'})`);
  // a section frames one limb: the halo focuses it, and it is the whole tree's frame again at the results
  t.frame('offer'); h.step(1500);
  ok(t.getHalo().level === 'focus' && t.getHalo().part === 'pricing', 'a section frame focuses the halo on that limb');
  t.frame('explore'); h.step(1500);
  ok(t.getHalo().level === 'ambient' && t.getHalo().part === 'crown', 'the whole tree frame takes it back to the ambient frame round the crown');
  // three steps and no more: a number cannot be shown through it
  const steps = new Set();
  [0, 0.1, 0.3, 0.42, 0.55, 0.69, 0.7, 0.8, 0.95, 1].forEach((v) => { t.setHalo(v); steps.add(t.getHalo().level); });
  ok(steps.size <= 3 && [...steps].every((s) => GT.HALO.steps.includes(s)), `a number snaps to one of three steps (${[...steps].join(', ')}), so the halo cannot carry a figure`);
  t.setHalo('off'); h.step(2600);
  ok(t.getHalo().shown === false && t.halo.el.style.opacity === '0.000', 'setHalo(off) takes it away');
  t.setHalo('auto'); h.step(2600);
  ok(t.getHalo().shown === true, 'setHalo(auto) gives it back and the tree decides again');
  t.setHalo('focus', { part: 'capacity' }); h.step(900);
  ok(t.getHalo().part === 'capacity' && t.getHalo().level === 'focus', 'the shell can focus it on a part by name');
  t.setHalo('auto', { part: 'auto' }); h.step(900);
  // nothing measured moves it
  const before = t.getHalo();
  const aBefore = t.halo.shown;
  t.setMetric(METRIC); h.step(1200);
  t.setMetrics({ progress: 1, odds: 0.9, profit: 0.8, repeat: 0.7 }); h.step(1200);
  LIMBS.forEach((id) => t.setLimbFill(id, 0.2)); h.step(1200);
  const after = t.getHalo();
  ok(after.level === before.level && near(after.alpha, aBefore, 0.004), `the metric, the scenario, the answered share and the limb fills leave the halo where it was (${before.level} ${aBefore.toFixed(3)} -> ${after.level} ${after.alpha.toFixed(3)})`);
  ok(t.getHalo().alpha <= GT.HALO.alpha.focus + GT.HALO.press + 0.001, 'and it never goes brighter than its focus step');
}

/* ---------- Task 06: the pointer depth moves decorative layers only ---------- */
{
  const h = grown({});
  const t = h.tree, c = t.canvas;
  t.setDepth(true);
  t.frame('explore'); h.step(1600);
  const x0 = t.halo.x, y0 = t.halo.y;
  const tag0 = t.tagList.find((L) => L.kind === 'group' && L.on);
  const lx = tag0 ? tag0.x0 : null, ly = tag0 ? tag0.y0 : null;
  const yaw0 = t.yaw, base0 = t.anchor('trunk');
  c.dispatch('pointermove', { pointerId: 9, clientX: 1380, clientY: 120 });
  h.step(900);
  const d = Math.hypot(t.halo.dx, t.halo.dy);
  ok(d > 0.5 && d <= h.GT.HALO.depth * 1.45, `the pointer moves the halo ${d.toFixed(1)} px, a few and no more`);
  ok(t.yaw === yaw0, 'it does not turn the tree');
  const base1 = t.anchor('trunk');
  ok(near(base0.x, base1.x, 0.001) && near(base0.y, base1.y, 0.001), 'the tree, and everything anchored to it, stands still');
  ok(lx === null || (near(tag0.x0, lx, 0.25) && near(tag0.y0, ly, 0.25)), `no label moves with the pointer (${lx.toFixed(2)} -> ${tag0.x0.toFixed(2)})`);
  ok(near(t.halo.x, x0, 1.5) && near(t.halo.y, y0, 1.5), 'only the decorative layer moves, and only by its own offset');
  c.dispatch('pointerleave', {}); h.step(1200);
  ok(Math.hypot(t.halo.dx, t.halo.dy) < 0.6, 'the pointer leaves and the depth settles back to nothing');
  t.setDepth(false); h.step(600);
  ok(t.depthActive() === false && t.halo.dx === 0, 'setDepth(false) ends it outright');
  // a press is what a touch gets (no hover): it lifts the halo, then it settles
  t.setHalo('ambient'); h.step(900);
  const rest = t.halo.shown;
  c.dispatch('pointerdown', { pointerId: 3, clientX: 1000, clientY: 400 }); h.step(60);
  ok(t.halo.shown > rest, `a press lifts the halo (${rest.toFixed(3)} -> ${t.halo.shown.toFixed(3)})`);
  h.step(1400);
  ok(near(t.halo.shown, rest, 0.006), 'and it settles back');
}

/* ---------- Task 06: reduced motion is static, and the hidden tab suspends the decoration ---------- */
{
  const h = grown({ reduce: true });
  const t = h.tree;
  t.frame('explore'); h.step(40);
  const a = t.halo.shown;
  ok(a > 0, 'reduced motion: the halo is there');
  t.setHalo('focus'); h.step(20);
  ok(near(t.halo.shown, h.GT.HALO.alpha.focus, 0.0001), 'its step changes in one frame (a cut, not an ease)');
  ok(t.depthActive() === false, 'the pointer depth is off');
  t.canvas.dispatch('pointermove', { pointerId: 1, clientX: 1300, clientY: 200 }); h.step(600);
  ok(t.halo.dx === 0 && t.halo.dy === 0, 'and the pointer moves nothing');
  const shown = t.halo.shown;
  t.canvas.dispatch('pointerdown', { pointerId: 2, clientX: 1000, clientY: 400 }); h.step(30);
  ok(t.halo.shown === shown, 'a press adds no pulse under reduced motion');
  t.suspendDecor(true);
  ok(t.halo.el.dataset.anim === '0', 'the hidden tab stops the decorative animation');
  t.suspendDecor(false);
  ok(t.halo.el.dataset.anim === '1', 'and it starts again when the tab comes back');
}

/* ---------- Task 20 / D12: the goal line, labelled and inside the frame at five widths ---------- */
[[320, 568], [390, 844], [768, 1024], [1440, 900], [1920, 1080]].forEach(([W, H]) => {
  const h = grown({ w: W, h: H });
  const t = h.tree, GT = h.GT;
  // the scenario runs past the target: the target must still be in the frame
  t.setMetric({ ...METRIC, scenario: 24000 });
  t.frame('explore'); h.step(3200);
  t.setView('plan'); h.step(1200);
  const r = t.frameReport();
  ok(r.markerKind === 'goal', `${W}: a numeric target draws the goal line`);
  ok(!!r.marker && r.marker.inside === true, `${W}: the goal line is inside the usable viewport even with the scenario at twice the target`);
  const lab = r.labels.find((l) => l.id === 'marker');
  ok(!!lab && lab.inside === true && /^Target[:\s]/.test(lab.text), `${W}: it carries its text label, inside the frame ("${lab ? lab.text : 'missing'}")`);
  const now = r.labels.find((l) => l.id === 'crown');
  ok(!!now && /^Now[:\s]/.test(now.text) && now.inside === true, `${W}: Now stands with it (${now ? now.text : 'missing'})`);
  ok(r.inside === true, `${W}: and the tree is still whole inside the usable viewport`);
  if (W === 1440) {
    // the line itself: muted red, dashed, and none of the error styling
    const hex = t.markerMat.color.getHex();
    ok(hex === GT.GOAL.light, `the goal line is the muted red ${GT.GOAL.light.toString(16)}, not the page's error red`);
    ok(hex !== 0xa31d16 && hex !== 0xf0867e, 'and it is neither --error tone');
    const dashed = t.marker.geometry.attributes.position.count;
    ok(dashed === GT.GOAL.dashes * 10, `it is drawn as ${GT.GOAL.dashes} dashes (${dashed} points), where an error rule would be solid`);
    const el = t.tagList.find((L) => L.id === 'marker').el;
    ok(el.dataset.goal === '1', 'its label is marked as the goal line, so the dashed swatch and the muted red follow in CSS');
  }
});

/* ---------- Task 20: Now and Target, one metric, one unit, one horizon ---------- */
{
  const h = grown({});
  const t = h.tree;
  t.setMetric(METRIC); t.frame('explore'); h.step(2400);
  const p = t.metricPair();
  ok(p.kind === 'goal' && p.same === true, 'metricPair() gives the pair the tree is showing');
  ok(p.now === 4000 && p.target === 12000 && p.unit === 'money', 'Now and Target come from the one metric, in the one unit');
  ok(/March 2027/.test(p.targetText) && !/March 2027/.test(p.nowText), 'the horizon belongs to the target, and Now does not borrow it');
  ok(p.nowText.startsWith('Now') && p.targetText.startsWith('Target'), `both are labelled ("${p.nowText}" / "${p.targetText}")`);
  // no baseline: nothing stands in for today
  t.setMetric({ target: 12000, unit: 'money' }); h.step(1200);
  const q = t.metricPair();
  ok(q.now === null && q.nowText === '', 'with no baseline given, Now is not printed at all');
  const r = t.frameReport();
  ok(!r.labels.find((l) => l.id === 'crown' && /^Now/.test(l.text)), 'and no Now label stands on the tree');
}

/* ---------- Task 20: a milestone when there is no financial model ---------- */
{
  const h = grown({});
  const t = h.tree, GT = h.GT;
  t.frame('explore'); h.step(2000);
  const restScale = t.tree.scale.x;
  t.setMetric(null, 'First paying customer'); h.step(2400);
  const r = t.frameReport();
  ok(r.markerKind === 'milestone', 'no scalar metric: the marker is a milestone, not a goal line');
  ok(t.markerMat.color.getHex() !== GT.GOAL.light, 'it does not borrow the goal line colour');
  ok(t.marker.geometry.attributes.position.count === 10, 'it is a solid hairline, not a dashed line');
  const lab = r.labels.find((l) => l.id === 'marker');
  ok(!!lab && /^Milestone/.test(lab.text), `it is labelled in words ("${lab ? lab.text : 'missing'}")`);
  ok(r.pair.kind === 'milestone' && r.pair.now === null && r.pair.target === null, 'and no figure is offered for Now or Target');
  ok(near(t.tree.scale.x, restScale, 0.001), 'the tree keeps its interview size: no revenue tree is grown');
  t.setMetrics({ progress: 1, profit: 1, repeat: 1 }); h.step(1600);
  ok(t.fruitMesh.count === 0, 'and nothing hangs on it that implies a number');
}

/* ---------- Task 20: answering more questions is not earning more money ---------- */
{
  const h = grown({});
  const t = h.tree;
  t.frame('explore'); h.step(2400);
  ok(t.heightMeans() === 'nothing', 'with no metric set, the height stands for nothing');
  const s0 = t.tree.scale.x;
  const sizes = [];
  [0, 0.25, 0.5, 0.75, 1].forEach((p) => { t.setMetrics({ progress: p }); LIMBS.forEach((id) => t.setLimbFill(id, p)); h.step(1600); sizes.push(t.tree.scale.x); });
  ok(sizes.every((s) => near(s, s0, 0.002)), `the answered share never changes the tree's height (${sizes.map((s) => s.toFixed(3)).join(', ')})`);
  // with a metric it is the selected outcome, and only that
  t.setMetric(METRIC); h.step(2400);
  ok(t.heightMeans() === 'outcome', 'a scalar metric makes the height mean the outcome');
  const withBase = t.tree.scale.x;
  t.setMetrics({ progress: 0 }); h.step(1600);
  ok(near(t.tree.scale.x, withBase, 0.002), 'and the answered share still does not move it');
  t.setMetric({ ...METRIC, baseline: 8000 }); h.step(2400);
  ok(t.tree.scale.x > withBase + 0.02, 'a higher baseline does: the crown stands at what was measured');
  ok(near(t.metricScale(12000) / t.metricScale(0), (t.heightOf(12000) / t.heightOf(0)), 0.0001) && t.heightOf(0) > 0, 'the mapping is the same linear one as before, with a floor at 0');
}

/* ---------- Tasks 19 and 21: the branch inspector ---------- */
{
  const h = grown({});
  const t = h.tree;
  t.setMetric(METRIC);
  t.frame('explore'); h.step(2400);
  t.setBranchInfo('demand', { now: 40, target: 70, unit: 'enquiries a month', action: 'Ask ten past clients for one referral each' });
  t.setBranchInfo('capacity', { milestone: 'One more fitter booked', action: 'Trial a subcontractor on the next job' });
  const seen = [];
  t.on('branch', (d) => seen.push(d ? d.id : null));
  const d = t.expandBranch('demand'); h.step(1200);
  ok(d && d.id === 'demand' && t.openBranch() === 'demand', 'expandBranch opens one branch');
  ok(seen.length === 1 && seen[0] === 'demand', "and says so once through 'branch'");
  const rows = t.branchRows;
  ok(rows.now.val.textContent === '40 enquiries a month', `the inspector shows the branch's current state (${rows.now.val.textContent})`);
  ok(rows.target.key.textContent === 'Target' && rows.target.val.textContent === '70 enquiries a month', 'its target, in the same unit');
  ok(/referral/.test(rows.action.val.textContent), 'and the action meant to close the gap');
  ok(t.getHalo().part === 'demand' && t.getHalo().level === 'focus', 'the halo focuses that branch');
  // one at a time
  t.expandBranch('capacity'); h.step(1200);
  ok(t.openBranch() === 'capacity' && seen.length === 2 && seen[1] === 'capacity', 'opening another closes the first: one panel, one event');
  ok(t.branchRows.target.key.textContent === 'Milestone' && t.branchRows.target.val.textContent === 'One more fitter booked', 'a branch with no numeric target shows its milestone in words, not a made-up figure');
  // nothing known: it says so rather than inventing
  t.expandBranch('margin'); h.step(900);
  ok(t.branchRows.target.val.textContent === 'Not set yet', 'a branch with nothing to aim at says so plainly');
  // the focus comes back to whatever opened it
  const opener = h.doc.createElement('button');
  h.doc.body.appendChild(opener);
  opener.focus();
  t.expandBranch('demand', { opener }); h.step(600);
  t.collapseBranch({ refocus: true });
  ok(h.doc.activeElement === opener, 'closing gives the focus back to what opened it');
  ok(t.openBranch() === null && t.branchEl.dataset.open === '0', 'and the panel goes');
  // Escape from the stage closes it
  t.expandBranch('demand'); h.step(600);
  h.stage.focus();
  const esc = h.stage.dispatch('keydown', { key: 'Escape' });
  ok(t.openBranch() === null && esc.prevented, 'Escape on the stage closes the open branch');
  // the page may draw its own inspector
  t.setInspector(false);
  const got = [];
  t.on('branch', (x) => got.push(x));
  t.expandBranch('demand'); h.step(600);
  ok(t.branchEl.dataset.open === '0' && got.length === 1 && got[0].id === 'demand', 'setInspector(false): the tree draws nothing and still tells the page');
  t.setInspector(true);
}

/* ---------- the cockpit brief, 3.1: with the shell's measured region (rail 173 px, column 432 px at 1440) the tree keeps clear of
   both and stands in the middle of the room between them; a section frame keeps the whole tree in that room with a margin under the root tips ---------- */
{
  const h = grown({ w: 1440, h: 900 });
  const t = h.tree;
  h.win.Mercer.shell = { regions: () => ({ header: { left: 0, top: 0, right: 1440, bottom: 72 }, question: { left: 1008, top: 72, right: 1440, bottom: 900 }, tree: { left: 173, top: 72, right: 1008, bottom: 900 } }) };
  t.setMetric(METRIC);
  t.frame('explore'); h.step(3000);
  const r = t.frameReport();
  const cx = (r.tree.left + r.tree.right) / 2;
  ok(t.composition() === 'auto' && r.usable.left >= 173 && r.usable.right <= 1008 && r.tree.left >= 171 && r.tree.right <= 1010, `questioning keeps the rail and the column: the tree stands between them (${r.tree.left}..${r.tree.right} in 173..1008)`);
  ok(Math.abs(cx - 590) < 60, `and in the middle of the room (${Math.round(cx)} of 590)`);
  ok(Math.abs(t.pose.at.x * 1440 - 590) < 40, `the trunk base stands at the room's middle (${Math.round(t.pose.at.x * 1440)} of 590)`);
  t.frame('offer'); h.step(3000);
  const s = t.frameReport();
  ok(s.inside === true && s.tree.left >= 171 && s.tree.right <= 1010 && s.tree.bottom <= 870, `a section frame keeps the whole tree in the room with a margin under the root tips (${s.tree.left}..${s.tree.right}, bottom ${s.tree.bottom} of 900)`);
  delete h.win.Mercer.shell;
}

/* ---------- Task 19: the results scene is composed round the tree, and the tree is the way through it ---------- */
{
  const h = grown({ w: 1440, h: 900 });
  const t = h.tree;
  t.setMetric(METRIC);
  t.frame('explore'); h.step(3000);
  const auto = t.frameReport();
  ok(t.composition() === 'auto' && auto.usable.left >= 42 && auto.inside === true, `questioning without a measured region: the tree stands in the room from the preset's own edge, whole (${auto.tree.left}..${auto.tree.right})`);
  t.setComposition('centred'); h.step(3000);
  const mid = t.frameReport();
  const cx = (mid.tree.left + mid.tree.right) / 2;
  ok(Math.abs(cx - 720) < 40, `setComposition('centred') puts the tree in the middle of the screen (${Math.round(cx)} of 720)`);
  ok(mid.inside === true && mid.labels.every((l) => l.inside) && mid.marker.inside === true, 'with the whole tree, every label and the goal line still inside');
  // the tree is the navigation surface: a tap on a limb opens that branch
  const seen = [];
  t.on('branch', (d) => seen.push(d && d.id));
  // a tap anywhere on a branch at the results, its leaves included: one panel, the branch's
  const ins = [];
  t.on('inspect', (d) => ins.push(d.kind));
  const a = t.anchor({ limb: 'demand', twig: 3 });
  const c = t.canvas;
  c.dispatch('pointerdown', { pointerId: 21, clientX: a.x, clientY: a.y });
  c.dispatch('pointerup', { pointerId: 21, clientX: a.x, clientY: a.y });
  h.step(1500);
  ok(seen.length === 1 && t.openBranch() === 'demand', `a tap on a branch at the results opens it (${seen.join(', ') || 'nothing'})`);
  ok(ins.length === 1 && ins[0] === 'limb', `and the page is told it was a branch, not one leaf, so only one panel opens (${ins.join(', ')})`);
  t.wholeTree(); h.step(2000);
  t.setComposition('auto'); h.step(2000);
  ok(t.composition() === 'auto' && t.frameReport().inside === true, 'and the composition goes back for the questions');
}

/* ---------- Task 21: the Whole tree reset, from any branch ---------- */
{
  const h = grown({});
  const t = h.tree;
  t.setMetric(METRIC);
  t.frame('explore'); h.step(2400);
  const home = t.frameReport();
  ok(t.frameReport().whole.shown === false, 'the whole tree is where it starts, so no reset control stands there');
  const parts = LIMBS.concat(['control', 'trunk']);
  let allBack = true, allShown = true;
  const wholes = [];
  t.on('whole', (w) => wholes.push(w.preset));
  parts.forEach((p) => {
    t.expandBranch(p); h.step(2200);
    if (t.frameReport().whole.shown !== true) allShown = false;
    t.zoomBy(2); h.step(1200);
    t.wholeTree(); h.step(2600);
    const r = t.frameReport();
    if (t.openBranch() !== null || r.zoom.k !== 1 || r.preset !== 'explore' || t.getHalo().part !== 'crown') allBack = false;
  });
  ok(allShown, 'inside any branch, the Whole tree control stands on screen');
  ok(allBack, `Whole tree comes back from every branch (${parts.join(', ')}): the panel closes, the zoom goes and the frame is the whole tree again`);
  ok(wholes.length === parts.length, "and each one says so through 'whole'");
  const back = t.frameReport();
  // the same frame, to a fraction of the screen: the tree turned while the visitor was inside the branches, so the base's
  // own correction (the leaves against the clearing's edge) can settle a few px from where it stood
  const dx = Math.abs(back.tree.left - home.tree.left) / 1440, dy = Math.abs(back.tree.top - home.tree.top) / 900;
  ok(back.inside === true && dx < 0.02 && dy < 0.02, `the frame it returns to is the frame it left (left ${home.tree.left} -> ${back.tree.left}, top ${home.tree.top} -> ${back.tree.top})`);
  // zoomed in with no branch open: the control still stands, and the stage's own frame is kept
  t.frame('offer'); h.step(2000);
  t.zoomBy(2); h.step(1200);
  ok(t.frameReport().whole.shown === true, 'zoomed in during questioning, the way out is on screen');
  t.wholeTree(); h.step(1600);
  ok(t.zoomLevel() === 1 && t.pose.preset === 'offer', 'and it gives the zoom back without dragging the visitor off the question');
  // the page may own the control
  t.setWholeControl(false);
  t.expandBranch('demand'); h.step(900);
  ok(t.frameReport().whole.shown === false && t.frameReport().whole.inside === true, 'setWholeControl(false): the tree draws none and still says the visitor is inside one');
  t.setWholeControl(true);
  t.wholeTree(); h.step(1200);
  // the keyboard has the same way out
  t.expandBranch('retention'); h.step(1600);
  h.stage.focus();
  h.stage.dispatch('keydown', { key: '0' });
  h.step(2000);
  ok(t.openBranch() === null && t.pose.preset === 'explore', '0 on the stage is the same way out');
}

/* ---------- Task 21: pan, and never trapped ---------- */
[[1440, 900], [390, 844]].forEach(([W, H]) => {
  const h = grown({ w: W, h: H });
  const t = h.tree;
  t.frame('explore'); h.step(2400);
  const U = t.frameReport().usable;
  const held = (r) => {
    const v = r.view, bw = v.right - v.left, bh = v.bottom - v.top, uw = U.right - U.left, uh = U.bottom - U.top, e = 2;
    const x = bw <= uw ? v.left >= U.left - e && v.right <= U.right + e : v.left <= U.left + e && v.right >= U.right - e;
    const y = bh <= uh ? v.top >= U.top - e && v.bottom <= U.bottom + e : v.top <= U.top + e && v.bottom >= U.bottom - e;
    return x && y;
  };
  ok(t.panBy(200, 200) === false, `${W}: at zoom 1 there is nothing to pan`);
  t.zoomBy(2.5); h.step(1200);
  const x0 = t.zoom.tx;
  t.panBy(140, -90); h.step(600);
  ok(t.zoom.tx !== x0, `${W}: zoomed in, the view pans`);
  let kept = true;
  [[900, 0], [-1800, 0], [0, 900], [0, -1800], [4000, 4000], [-4000, -4000]].forEach(([dx, dy]) => { t.panBy(dx, dy); h.step(400); if (!held(t.frameReport())) kept = false; });
  ok(kept, `${W}: panned hard in every direction, the tree never leaves the usable viewport`);
  t.fit(); h.step(1200);
  ok(t.zoomLevel() === 1 && t.zoom.x === 0 && t.zoom.y === 0, `${W}: the fit takes the pan with it`);
});

/* ---------- Task 02 (the shell's dependency): the labels stand inside the region the shell publishes ---------- */
{
  // the shell measures the question column live; at 1440 it ends at 792, where the tree's own 0.46 share would have put a
  // caption 162 px inside the words
  const h = grown({ w: 1440, h: 900 });
  const t = h.tree;
  h.win.Mercer.shell = { regions: () => ({ header: { left: 0, top: 0, right: 1440, bottom: 68 }, question: { left: 0, top: 68, right: 792, bottom: 900 }, tree: { left: 792, top: 68, right: 1440, bottom: 900 } }) };
  t.setMetric(METRIC);
  ['close', 'delivery', 'money', 'clients', 'you', 'control', 'explore'].forEach((k) => {
    t.frame(k); h.step(2600);
    const r = t.frameReport();
    ok(r.usable.left >= 792, `${k}: the fit reads the shell's region, not the 0.46 share (usable left ${r.usable.left})`);
    const out = r.labels.filter((l) => l.x0 < 792);
    ok(out.length === 0, `${k}: no caption is placed in the question column (${out.map((l) => `${l.id} at ${l.x0}`).join(', ') || 'none'})`);
    ok(r.tree.left >= 790, `${k}: and the tree itself stands in its own region (${r.tree.left})`);
  });
  // no shell module: the same two numbers come from the custom properties
  const h2 = grown({ w: 1440, h: 900 });
  h2.ctx.getComputedStyle = () => ({ getPropertyValue: (k) => (k === '--keep-right' ? '900px' : ''), backgroundColor: '' });
  h2.win.getComputedStyle = h2.ctx.getComputedStyle;
  h2.tree.frame('close'); h2.step(2600);
  ok(h2.tree.frameReport().usable.right <= 901, `--keep-right stands in when the shell's own module is not there: it is the question column's inner edge at the right (${h2.tree.frameReport().usable.right})`);
  // the intro keeps the whole screen: its words stand under the tree, so its own edge wins
  const h3 = make({ w: 1440, h: 900 });
  h3.win.Mercer.shell = { regions: () => ({ header: { left: 0, top: 0, right: 1440, bottom: 68 }, question: { left: 0, top: 68, right: 1000, bottom: 900 }, tree: { left: 1000, top: 68, right: 1440, bottom: 900 } }) };
  h3.tree.frame('intro'); h3.step(1200);
  ok(h3.tree.frameReport().usable.left < 200, 'the intro still claims the whole screen');
}

/* ---------- every older call still answers the same way ---------- */
{
  const h = grown({});
  const t = h.tree;
  const KEEP = ['setStub', 'setTwigs', 'setLimbFill', 'setLabel', 'flight', 'frame', 'anchor', 'crownRadius', 'setRootBalance', 'setRootSources',
    'wave', 'setDiscs', 'showDiscNames', 'setCoreHost', 'lockDrag', 'playIntro', 'setCollar', 'setEncoding', 'setCrownLeaves', 'select', 'setTheme',
    'setMetrics', 'setMonths', 'setName', 'showPart', 'snapshot', 'mount', 'readTokens', 'setData', 'setRoots', 'setDrivers', 'focusBranch', 'focus',
    'highlight', 'zoomBy', 'fit', 'zoomLevel', 'setTrunkKnown', 'setPartState', 'partStates', 'setActiveGroup', 'setGroupLabels', 'setGroupWords',
    'setMetric', 'getMetric', 'setView', 'getView', 'showCore', 'frameReport', 'toSeed', 'on', 'off'];
  const missing = KEEP.filter((k) => typeof t[k] !== 'function');
  ok(missing.length === 0, `every public method from the earlier rounds is still here (${missing.join(', ') || 'none missing'})`);
  const NEW = ['setHalo', 'getHalo', 'setDepth', 'depthActive', 'setBranchInfo', 'branchData', 'expandBranch', 'collapseBranch', 'openBranch',
    'wholeTree', 'insideBranch', 'panBy', 'setInspector', 'setWholeControl', 'metricPair', 'heightMeans'];
  ok(NEW.every((k) => typeof t[k] === 'function'), 'and the new ones are on the instance');
  const flat = h.GT.flat(h.stage);
  ok(NEW.concat(KEEP).every((k) => typeof flat[k] === 'function'), 'the flat tree answers to all of them too');
  ok(t.setMetric({ target: 100 }) && t.getMetric().target === 100, 'setMetric keeps its older shape');
  ok(t.setHalo() && typeof t.getHalo().level === 'string', 'setHalo() with nothing given is safe');
  ok(t.setBranchInfo('nonsense', {}) === null && t.expandBranch('nonsense') === null, 'a part that does not exist is refused, not guessed at');
}

/* ---------- the flat tree (no WebGL): the same contract ---------- */
{
  const h = make({ flat: true });
  const t = h.tree;
  t.playIntro(10, {});
  ok(!!t.halo.el && h.stage.children[0] === t.halo.el, 'flat: the halo is behind the drawing');
  t.setEncoding(true);
  t.setMetric({ ...METRIC });
  t.placeHalo();
  ok(t.getHalo().shown === true, 'flat: the halo is there');
  ok(t.frameReport().markerKind === 'goal', 'flat: a numeric target is the goal line');
  const m = t.svg.querySelector('.flat-goal');
  ok(!!m && m.getAttribute('stroke-dasharray') === '7 5', 'flat: drawn as a dashed muted red line');
  ok(t.metricPair().nowText.startsWith('Now') && t.frameReport().pair.targetText.startsWith('Target'), 'flat: Now and Target from the one metric');
  const s0 = t.heightRatio();
  t.setMetrics({ progress: 1 });
  ok(near(t.heightRatio(), s0, 0.0001), 'flat: the answered share does not grow the tree');
  t.setMetric(null, 'First paying customer');
  ok(t.frameReport().markerKind === 'milestone' && !t.svg.querySelector('.flat-goal'), 'flat: a milestone is not a goal line');
  t.setBranchInfo('demand', { now: '40 a month', target: '70 a month', action: 'Ask for referrals' });
  t.expandBranch('demand');
  ok(t.openBranch() === 'demand' && t.branchRows.action.val.textContent === 'Ask for referrals', 'flat: the branch inspector opens with its action');
  ok(t.insideBranch() === true, 'flat: and the way out is offered');
  t.wholeTree();
  ok(t.openBranch() === null && t.zoomK === 1, 'flat: Whole tree closes it and gives the drawing back');
}

console.log(`\n${fails ? `${fails} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(fails ? 1 : 0);
