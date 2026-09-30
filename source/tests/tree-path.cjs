// Results round 1 (tree): the results frame (D2) and the path (D4) at 320, 390, 768, 1440 and 1920, on the 3D tree and
// on the flat one. The frame centres the composition on the canopy and trunk, keeps the stage's column free at 1440 and
// the top half of the phone's viewport, and fits the tree and every label on arrival. setPath draws the selected limb's
// path with three pressable labelled milestones, setEvidenceLabels up to three pressable labels on roots or limbs,
// selectBranch quietens the other limbs and emits select, fitAll gives the overview back, setChip(false) keeps the chip
// shut, and nothing grows on a press. The placer's contract holds: at most three action labels at once, none on the
// bark, none off screen, no two labels on each other.
// Real three r147, fake DOM, a clock we drive.  node tests/tree-path.cjs        node tests/tree-path.cjs 390 844
const { make } = require('./tree-harness.cjs');
let fails = 0, total = 0;
const ok = (cond, msg) => { total++; if (cond) console.log(`ok   ${msg}`); else { fails++; console.log(`FAIL ${msg}`); } };
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const LIMBS = ['pricing', 'demand', 'conversion', 'capacity', 'margin', 'retention'];
const SIZES = process.argv[2] ? [[+process.argv[2], +process.argv[3] || 900]] : [[320, 568], [390, 844], [768, 1024], [1440, 900], [1920, 1080]];
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const inBox = (p, b) => p.x >= b[0] && p.x <= b[2] && p.y >= b[1] && p.y <= b[3];
const MILESTONES = [{ id: 'act-today', label: 'Today', kind: 'today', state: 'active' }, { id: 'act-week', label: 'This week', kind: 'week', state: 'todo' }, { id: 'act-review', label: 'Review', kind: 'review', state: 'todo' }];
const EVIDENCE = [{ id: 'ev-quotes', label: '12 open quotes', part: 'roots' }, { id: 'ev-slots', label: '2 free job slots', part: 'capacity' }, { id: 'ev-follow', label: 'Follow-up not tracked', part: 'roots' }];

/** a grown tree with twigs, roots, part states and a target, as the page leaves it by the results */
function grown(opts = {}) {
  const h = make(opts);
  const t = h.tree;
  t.frame('arrival'); h.step(100);
  t.frame('roots'); h.step(900);
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.playIntro(700, { leaves: 0 }); h.step(1200);
  LIMBS.forEach((id, i) => { t.setStub(id, false); t.setLimbFill(id, 1); t.setTwigs(id, Array.from({ length: 8 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' }))); });
  t.setRootBalance(0.7);
  t.setPartState('demand', { name: 'Demand', value: '40 a month', state: 'user' });
  t.setPartState('pricing', { name: 'Pricing', value: 1200, unit: 'money', state: 'imported' });
  t.setPartState('trunk', { name: 'Revenue now', value: 4000, unit: 'money', state: 'user' });
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month in 12 months' });
  h.step(2000);
  return h;
}
/** the limbs' growth, the tree's size and the frame: what a press must not change */
const snapshot = (t) => ({ f: LIMBS.map((id) => +t.branches.get(id).f.toFixed(4)).join(','), fill: LIMBS.map((id) => t.branches.get(id).fill).join(','), scale: +t.tree.scale.x.toFixed(4), dist: +t.pose.dist.toFixed(3), crown: +(t.crownK || 0).toFixed(3) });
const same = (a, b, frame = true) => a.f === b.f && a.fill === b.fill && near(a.scale, b.scale, 0.002) && (!frame || near(a.dist, b.dist, 0.01)) && near(a.crown, b.crown, 0.002);

SIZES.forEach(([W, H]) => {
  const h = grown({ w: W, h: H });
  const t = h.tree, GT = h.GT;
  const port = t.portrait;
  const events = {};
  ['select', 'milestone', 'evidence', 'press', 'inspect', 'whole', 'branch'].forEach((k) => { events[k] = []; t.on(k, (v) => events[k].push(v)); });
  const clear = () => Object.keys(events).forEach((k) => { events[k].length = 0; });
  console.log(`\n--- ${W} x ${H} (${port ? 'clearing below' : 'clearing left'})`);

  /* ---------- D2: the results frame ---------- */
  ok(GT.PRESETS.includes('results'), `${W}: PRESETS has 'results' (app.js looks for it)`);
  t.setInspector(false); t.setChip(false); // the results owner's inspector is the one open; the chip stays shut on the plan stage
  t.frame('results'); h.step(1900);
  let r = t.frameReport();
  const u = r.usable, tr = r.tree;
  const arrival = r.labels.map((l) => l.id).join(', ');
  h.step(3000); // the tree's size eases to the baseline's with a long tail: settled before anything is compared
  console.log(`results: tree x ${tr.left}..${tr.right} y ${tr.top}..${tr.bottom} | usable x ${u.left}..${u.right} y ${u.top}..${u.bottom} | column ${r.column} | labels ${r.labels.map((l) => l.id).join(', ')}${r.labelsHidden.length ? ` (nowhere: ${r.labelsHidden.join(', ')})` : ''} | ${r.corrected.join('; ') || 'no correction'}`);
  ok(r.preset === 'results' && r.kind === 'whole', `${W}: the results frame is a whole-tree fit`);
  ok(r.inside, `${W}: the whole tree, crown top to root tips, stands inside the usable viewport`);
  ok(r.labels.every((l) => l.inside), `${W}: every label placed is inside the screen (on arrival: ${arrival})`);
  if (!port && W >= GT.FIT.results.stackUnder) {
    ok(r.column >= GT.FIT.results.column[0] && r.column <= GT.FIT.results.column[1], `${W}: a column of ${r.column} px is kept at the right for the stage's words (320 to 400)`);
    ok(tr.right <= W - r.column - 6, `${W}: the tree keeps out of it (right edge ${tr.right} vs ${W - r.column})`);
    ok(r.labels.every((l) => l.x1 <= W - r.column), `${W}: and so does every label`);
    const room = (u.left + u.right) / 2, mid = (tr.left + tr.right) / 2;
    ok(Math.abs(mid - room) <= 0.06 * W, `${W}: the composition is centred on the trunk in the room left of the column (tree middle ${Math.round(mid)}, room middle ${Math.round(room)})`);
    ok((tr.bottom - tr.top) / H >= 0.7, `${W}: the tree fills ${Math.round(((tr.bottom - tr.top) / H) * 100)}% of the height (at least 70)`);
  } else if (!port) {
    ok(r.column === 0, `${W}: under ${GT.FIT.results.stackUnder} px there is no column (the words go under the tree)`);
    ok(tr.bottom <= 0.64 * H, `${W}: the tree keeps to the upper part of the viewport (bottom ${tr.bottom} of ${H}), so the card has the rest`);
    ok((tr.bottom - tr.top) / H >= 0.42, `${W}: and still fills ${Math.round(((tr.bottom - tr.top) / H) * 100)}% of the height`);
  } else {
    ok(tr.bottom <= 0.5 * H + 2, `${W}: the phone's tree keeps to the top half of the first viewport (bottom ${tr.bottom} of ${H})`);
    ok(tr.top >= u.top - 2, `${W}: under the top bar (top ${tr.top} vs ${u.top})`);
    ok((tr.bottom - tr.top) / H >= 0.28, `${W}: and takes ${Math.round(((tr.bottom - tr.top) / H) * 100)}% of the height itself, the ring and its label above it`);
  }
  ok(t.tags.box.dataset.results === '1', `${W}: the tag layer says the results are in play (tree.css sizes the labels up)`);

  /* ---------- D4: selectBranch ---------- */
  clear();
  const before = snapshot(t);
  const sel = t.selectBranch('demand');
  h.step(1500);
  r = t.frameReport();
  ok(sel === 'demand' && events.select.length === 1 && events.select[0] === 'demand', `${W}: selectBranch emits 'select' once with the limb`);
  ok(r.path.limb === 'demand' && r.path.k >= 0.99, `${W}: the path is drawn from the roots up the trunk and along the limb (k ${r.path.k})`);
  const quiet = LIMBS.filter((id) => id !== 'demand').map((id) => +t.branches.get(id).mat.opacity.toFixed(2));
  ok(near(t.branches.get('demand').mat.opacity, 1, 0.02) && quiet.every((a) => near(a, GT.PATH.quiet, 0.03)), `${W}: the selected limb keeps its ink and the others go quiet (${quiet.join(', ')})`);
  ok(r.preset === 'results' && r.inside, `${W}: the tree turned to show the limb side-on and is still inside the usable viewport`);
  ok(!t.openBranch() && events.branch.length === 0, `${W}: no panel of the tree's own opened (the results render the one inspector)`);
  ok(same(before, snapshot(t), false), `${W}: nothing grew on the selection (limbs, size, crown as they were; the frame turned, by design)`);

  /* ---------- D4: setPath and its milestones ---------- */
  clear();
  const path = t.setPath('demand', MILESTONES);
  h.step(2400);
  r = t.frameReport();
  const ms = r.path.milestones;
  console.log(`path: ${ms.map((m) => `${m.label} ${m.on ? `at [${m.box}]` : m.waiting ? 'waiting' : 'capped'} node ${m.node ? `${m.node.x},${m.node.y}` : 'none'}`).join(' | ')}`);
  ok(path.limb === 'demand' && path.milestones.length === 3 && path.milestones[0].state === 'active', `${W}: setPath keeps three milestones, Today active`);
  ok(ms.length === 3 && ms.every((m) => m.on && m.inside), `${W}: all three milestone labels are placed inside the screen`);
  ok(ms.every((m) => m.node), `${W}: each has its node on the limb`);
  ok(ms.every((m) => m.node && inBox(m.node, [tr.left - 4, tr.top - 4, tr.right + 4, tr.bottom + 4])), `${W}: the nodes stand on the tree`);
  const spread = ms.length === 3 && ms[0].node && ms[2].node ? Math.hypot(ms[2].node.x - ms[0].node.x, ms[2].node.y - ms[0].node.y) : 0;
  ok(spread >= (W <= 320 ? 16 : 24), `${W}: Today and Review stand ${Math.round(spread)} px apart along the limb`);
  ok(ms.every((m) => !inBox(m.node, m.box)), `${W}: no milestone label sits on its own node (the word is beside the bark, not on it)`);
  const boxes = r.labels;
  let pairs = true;
  boxes.forEach((a, i) => boxes.forEach((b, j) => { if (j > i && overlap(a, b)) pairs = false; }));
  ok(pairs, `${W}: no two labels overlap (${boxes.length} placed: ${boxes.map((l) => l.id).join(', ')})`);
  ok(r.path.prominent === 3, `${W}: three prominent action labels, the cap`);
  const step0 = ms[0].kind === 'today' && ms[1].kind === 'week' && ms[2].kind === 'review';
  ok(step0, `${W}: the milestones keep their kinds (today, week, review)`);
  const el0 = t.tagList.find((L) => L.id === 'milestone0').el;
  ok(el0.tagName === 'BUTTON' && el0.getAttribute('aria-hidden') === null && el0.tabIndex === 0 && el0.getAttribute('aria-label') === 'Today, open', `${W}: a milestone label is a button with a name (${el0.getAttribute('aria-label')})`);
  ok(el0.dataset.state === 'active' && el0.dataset.step === 'today', `${W}: and carries its state and step for tree.css`);
  const node1 = t.tagList.find((L) => L.id === 'milestone1').node;
  ok(node1 && node1.getAttribute('aria-hidden') === 'true' && node1.dataset.on === '1', `${W}: the node is decorative and on (the label carries the name)`);
  // a press: one event, nothing grows, nothing opens
  clear();
  const b0 = snapshot(t);
  t.tagList.find((L) => L.id === 'milestone1').el.dispatch('click', { clientX: 0, clientY: 0 });
  h.step(1500);
  ok(events.milestone.length === 1 && events.milestone[0].id === 'act-week' && events.milestone[0].kind === 'week', `${W}: a press on a milestone label emits 'milestone' { id } once (${JSON.stringify(events.milestone[0] && { id: events.milestone[0].id, kind: events.milestone[0].kind })})`);
  ok(events.inspect.length === 0 && events.select.length === 0 && events.branch.length === 0, `${W}: and nothing else: no inspect, no select, no panel`);
  ok(same(b0, snapshot(t)), `${W}: nothing grew on the press`);
  clear();
  node1.dispatch('click', { clientX: 0, clientY: 0 });
  ok(events.milestone.length === 1 && events.milestone[0].id === 'act-week', `${W}: a press on the node itself is the same press`);
  clear();
  t.tagList.find((L) => L.id === 'milestone2').el.dispatch('click', { clientX: 0, clientY: 0 });
  t.tagList.find((L) => L.id === 'milestone2').el.dispatch('click', { clientX: 0, clientY: 0 });
  ok(events.milestone.length === 2 && events.milestone.every((e) => e.id === 'act-review'), `${W}: two fast presses are two events, neither skipped nor doubled`);
  // the keyboard reaches them
  clear();
  h.stage.focus();
  let found = null;
  for (let i = 0; i < 120 && !found; i++) { h.stage.dispatch('keydown', { key: 'ArrowDown', target: h.stage }); const p = t.focusParts && t.focusParts[t.focusAt]; if (p && p.kind === 'action') found = p; }
  ok(!!found && found.id === 'milestone0', `${W}: Down reaches the first milestone label (${found && found.id}), named "${t.liveEl.textContent}"`);
  h.stage.dispatch('keydown', { key: 'Enter', target: h.stage });
  ok(events.milestone.length === 1 && events.milestone[0].id === 'act-today', `${W}: Enter on it is the press`);
  h.stage.dispatch('keydown', { key: 'Escape', target: h.stage });
  // a marked task: the state changes, the label says so, nothing grows
  clear();
  const b1 = snapshot(t);
  t.setPath('demand', [{ ...MILESTONES[0], state: 'done' }, { ...MILESTONES[1], state: 'active' }, MILESTONES[2]]);
  h.step(1200);
  ok(t.tagList.find((L) => L.id === 'milestone0').el.getAttribute('aria-label') === 'Today, marked done' && t.tagList.find((L) => L.id === 'milestone0').el.dataset.state === 'done', `${W}: a milestone marked done says so and no more`);
  ok(same(b1, snapshot(t)), `${W}: and the tree did not grow for it`);

  /* ---------- D4: the evidence labels and the cap ---------- */
  clear();
  t.setEvidenceLabels(EVIDENCE);
  h.step(1500);
  r = t.frameReport();
  ok(r.path.prominent === 3 && r.path.milestones.every((m) => m.on) && r.path.evidence.every((e) => e.capped && !e.on), `${W}: with three milestones showing the evidence labels wait (three prominent labels at once, never more)`);
  t.setPath(null);
  h.step(1800);
  r = t.frameReport();
  const ev = r.path.evidence;
  console.log(`evidence: ${ev.map((e) => `${e.label} ${e.on ? `at [${e.box}]` : e.waiting ? 'waiting' : 'capped'}`).join(' | ')}${r.labelsHidden.length ? ` (nowhere: ${r.labelsHidden.join(', ')})` : ''}`);
  ok(r.path.limb === null && r.path.milestones.length === 0 && r.path.k < 0.02, `${W}: setPath(null) clears the path and the milestones`);
  const placed = ev.filter((e) => e.on).length;
  // 320: the tree stands 120 px wide and a two-line label 108; two of three find room, the third waits (never on the bark)
  ok(W <= 320 ? placed >= 2 : placed === 3, `${W}: ${placed} of three evidence labels placed${W <= 320 ? ' (two at 320; the third waits rather than sit on the tree)' : ''}`);
  ok(ev.every((e) => !e.on || e.inside), `${W}: every placed evidence label is inside the screen`);
  ok(ev.every((e) => !e.on || (e.node && !inBox(e.node, e.box))), `${W}: none sits on its own point`);
  pairs = true;
  r.labels.forEach((a, i) => r.labels.forEach((b, j) => { if (j > i && overlap(a, b)) pairs = false; }));
  ok(pairs, `${W}: no two labels overlap with the evidence labels up (${r.labels.map((l) => l.id).join(', ')})`);
  const roots = ev.filter((e) => e.part === 'roots' && e.on);
  ok(roots.every((e) => e.node && e.node.y >= r.anchors.seed.y - 6), `${W}: a roots label's point is at or below the ground line`);
  clear();
  const b2 = snapshot(t);
  const evEl = t.tagList.find((L) => L.id === 'evidence0');
  evEl.el.dispatch('click', { clientX: 0, clientY: 0 });
  h.step(800);
  ok(events.evidence.length === 1 && events.evidence[0].id === 'ev-quotes' && events.evidence[0].part === 'roots', `${W}: a press on an evidence label emits 'evidence' { id } (${JSON.stringify(events.evidence[0] && { id: events.evidence[0].id, part: events.evidence[0].part })})`);
  ok(events.inspect.length === 0 && events.milestone.length === 0 && same(b2, snapshot(t)), `${W}: nothing else fires and nothing grows`);
  ok(evEl.el.getAttribute('aria-label') === '12 open quotes, evidence', `${W}: an evidence label is named for a screen reader`);
  t.setEvidenceLabels([]);
  h.step(600);
  ok(t.frameReport().path.evidence.length === 0 && t.tagList.filter((L) => L.kind === 'evidence').every((L) => !L.on), `${W}: [] clears them`);

  /* ---------- D4: the chip ---------- */
  clear();
  t.selectBranch('pricing'); h.step(1200);
  const tip = t.anchor('pricing');
  const tap = (x, y, id) => { t.canvas.dispatch('pointerdown', { pointerId: id, clientX: x, clientY: y }); t.canvas.dispatch('pointerup', { pointerId: id, clientX: x, clientY: y }); };
  clear();
  tap(tip.x, tip.y, 31);
  const pressed = events.press.length;
  ok(pressed >= 1 && events.inspect.length === 0, `${W}: with the chip off a tap on a limb emits 'press' (${pressed}) and no 'inspect', so help.js's chip stays shut`);
  ok(t.chip() === false, `${W}: chip() says so`);
  t.setChip(true);
  clear();
  tap(tip.x, tip.y, 32);
  ok(events.press.length === pressed && events.inspect.length === pressed, `${W}: with the chip on the same tap emits both`);
  t.setChip(false);

  /* ---------- D4: fitAll ---------- */
  clear();
  t.zoomBy(2);
  h.step(600);
  const pr = t.fitAll();
  h.step(1500);
  r = t.frameReport();
  ok(pr === 'results' && r.preset === 'results' && near(r.zoom.k, 1, 0.01) && r.inside, `${W}: fitAll gives the results overview back at zoom 1 (${pr})`);
  ok(events.whole.length === 1 && events.whole[0].preset === 'results' && events.whole[0].fit === true, `${W}: and emits 'whole'`);
  ok(t.selected === 'pricing' && r.path.limb === 'pricing', `${W}: the selection and the path stay: they are the visitor's own state`);
  ok(r.labels.every((l) => l.inside), `${W}: every label is back inside the screen`);
  // Whole tree from the keyboard at the results is the results frame too, not the old explore frame
  t.expandBranch('demand'); h.step(600);
  t.wholeTree(); h.step(1200);
  ok(t.frameReport().preset === 'results', `${W}: Whole tree at the results returns to the results frame`);
});

/* ---------- reduced motion: the turn and the path are cuts ---------- */
{
  const h = grown({ w: 1440, h: 900, reduce: true });
  const t = h.tree;
  t.setInspector(false); t.setChip(false);
  t.frame('results'); h.step(200);
  t.selectBranch('demand'); h.step(40);
  const r = t.frameReport();
  ok(r.path.k === 1 && r.settled, 'reduced motion: the path and the turn are cuts (k 1 after one frame, the camera settled)');
  ok(LIMBS.filter((id) => id !== 'demand').every((id) => near(t.branches.get(id).mat.opacity, h.GT.PATH.quiet, 0.02)), 'reduced motion: the other limbs are quiet at once');
}

/* ---------- the flat tree: the same calls, the same events ---------- */
[[390, 844], [1440, 900]].forEach(([W, H]) => {
  const h = make({ flat: true, w: W, h: H });
  const t = h.tree;
  t.svg.clientWidth = W; t.svg.clientHeight = H; // the fake DOM lays nothing out: the drawing takes the stage
  let now = 1000;
  const settle = () => { for (let i = 0; i < 24; i++) t.placeOverlays((now += 16)); }; // the flat placer eases a nudged label into place over frames
  const events = {};
  ['select', 'milestone', 'evidence', 'press', 'inspect', 'whole'].forEach((k) => { events[k] = []; t.on(k, (v) => events[k].push(v)); });
  const clear = () => Object.keys(events).forEach((k) => { events[k].length = 0; });
  t.playIntro(10, {});
  LIMBS.forEach((id, i) => { t.setStub(id, false); t.setLimbFill(id, 1); t.setTwigs(id, Array.from({ length: 8 }, (_, k) => ({ id: `${id}${k}`, state: 'leaf', grade: 1 + ((i + k) % 5), kind: 'you' }))); });
  t.setRootSources({ you: 6, sector: 2, web: 1, assumed: 2 });
  t.setMetric({ baseline: 4000, scenario: 9000, target: 12000, label: 'Target: £12,000 a month' });
  t.setInspector(false); t.setChip(false);
  t.frame('results');
  ok(t.frameReport().preset === 'results' && t.tags.box.dataset.results === '1', `flat ${W}: the results frame encodes and marks the tag layer`);
  clear();
  t.selectBranch('demand');
  ok(events.select.length === 1 && events.select[0] === 'demand', `flat ${W}: selectBranch emits 'select'`);
  const line = t.svg.querySelector('.flat-path');
  ok(!!line && line.getAttribute('data-limb') === 'demand' && line.getAttribute('stroke') === 'var(--you)', `flat ${W}: the path is drawn in the accent along the trunk and the limb`);
  const quiet = t.svg.querySelectorAll('[data-part]').filter((p) => p.dataset.part !== 'demand' && p.dataset.part !== 'trunk').map((p) => +p.getAttribute('opacity'));
  ok(quiet.length === 5 && quiet.every((a) => near(a, h.GT.PATH.quiet, 0.01)) && +t.svg.querySelector('[data-part="demand"]').getAttribute('opacity') === 1, `flat ${W}: the other limbs go quiet (${quiet.join(', ')})`);
  t.setPath('demand', MILESTONES);
  settle();
  let r = t.frameReport();
  const ms = r.path.milestones;
  ok(ms.length === 3 && ms.every((m) => m.on && m.inside && m.node), `flat ${W}: three milestone labels placed inside, each with its node`);
  ok(ms.every((m) => !inBox(m.node, m.box)), `flat ${W}: no label sits on its node`);
  let pairs = true;
  r.labels.forEach((a, i) => r.labels.forEach((b, j) => { if (j > i && overlap(a, b)) pairs = false; }));
  ok(pairs, `flat ${W}: no two labels overlap (${r.labels.map((l) => l.id).join(', ')})`);
  clear();
  t.tagList.find((L) => L.id === 'milestone1').el.dispatch('click', {});
  ok(events.milestone.length === 1 && events.milestone[0].id === 'act-week' && events.inspect.length === 0, `flat ${W}: a press emits 'milestone' { id } and nothing else`);
  const fBefore = LIMBS.map((id) => t.limbGeo(t.branches.get(id)).f).join(',');
  t.tagList.find((L) => L.id === 'milestone1').node.dispatch('click', {});
  ok(events.milestone.length === 2 && LIMBS.map((id) => t.limbGeo(t.branches.get(id)).f).join(',') === fBefore, `flat ${W}: the node is the same press and nothing grew`);
  t.setEvidenceLabels(EVIDENCE);
  settle();
  ok(t.frameReport().path.prominent === 3 && t.frameReport().path.evidence.every((e) => e.capped), `flat ${W}: the cap holds: the evidence labels wait behind three milestones`);
  t.setPath(null);
  settle();
  r = t.frameReport();
  ok(r.path.limb === null && !t.svg.querySelector('.flat-path'), `flat ${W}: setPath(null) clears the path`);
  ok(r.path.evidence.filter((e) => e.on).length === 3 && r.path.evidence.every((e) => e.inside), `flat ${W}: the three evidence labels are placed inside`);
  clear();
  t.tagList.find((L) => L.id === 'evidence1').el.dispatch('click', {});
  ok(events.evidence.length === 1 && events.evidence[0].id === 'ev-slots' && events.evidence[0].part === 'capacity', `flat ${W}: a press on one emits 'evidence' { id }`);
  // the keyboard
  clear();
  h.stage.focus();
  let found = null;
  for (let i = 0; i < 80 && !found; i++) { h.stage.dispatch('keydown', { key: 'ArrowDown', target: h.stage }); const p = t.focusParts && t.focusParts[t.focusAt]; if (p && p.kind === 'action') found = p; }
  ok(!!found, `flat ${W}: Down reaches an evidence label (${found && found.id})`);
  h.stage.dispatch('keydown', { key: 'Enter', target: h.stage });
  ok(events.evidence.length === 1 && events.evidence[0].id === 'ev-quotes', `flat ${W}: Enter presses it`);
  // the chip
  clear();
  t.svg.querySelector('[data-part="pricing"]').dispatch('click', {});
  ok(events.press.length === 1 && events.inspect.length === 0 && events.select[0] === 'pricing', `flat ${W}: with the chip off a limb press emits 'press' and 'select', no 'inspect'`);
  t.setChip(true);
  clear();
  t.svg.querySelector('[data-part="pricing"]').dispatch('click', {});
  ok(events.press.length === 1 && events.inspect.length === 1, `flat ${W}: with the chip on it emits both`);
  // fitAll
  clear();
  t.selectBranch('pricing');
  t.zoomBy(2);
  const pr = t.fitAll();
  ok(pr === 'results' && t.zoomK === 1 && events.whole.length === 1 && events.whole[0].fit === true && t.selected === 'pricing', `flat ${W}: fitAll gives the overview back and keeps the selection`);
});

console.log(`\n${fails ? `${fails} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(fails ? 1 : 0);
