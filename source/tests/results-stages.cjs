/* Results round 1 checks for canopy.js, results.css, index.html and scene.css (results owner). Run: node tests/results-stages.cjs
   jsdom (../labtest/node_modules), the real engine, the real app.js, the real index.html, plan.js and econ.js when present.
   Covers D1 (four stages, every old id inside one), D2's layout half (the column and the tree list), D5 (one shared
   inspector with its own scroll and no snap under it), D6 (each stage's content, its one primary action and the exact
   labels), D7 (nothing timed, nothing auto-advancing, fast presses safe), D8 (proximity snap, data-snap off on a short
   viewport, arrow keys untouched, focus only on explicit navigation), the navigator, the copy budgets on display, the
   defensive reading of D3 (the plan with and without move/why/sequence/start), the tree wiring of D4 and the chip flag. */
const harness = require('./results-harness.cjs');

(async () => {
  const h = harness();
  const { M, state, ok, done, $, $$, text, errors, sleep, document, window, src, network, saves, clip } = h;
  const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
  const opened = [];
  window.open = (url) => { opened.push(url); return null; };
  try {
    ok('files loaded without throwing', errors.length === 0, errors.slice(0, 3));

    console.log('== copy rules over the four files');
    const cj = src('canopy.js'), rc = src('results.css'), ih = src('index.html'), sc = src('scene.css');
    ok('no em or en dash in canopy.js, results.css, index.html or scene.css', ![cj.replace('String.fromCharCode(8212, 8211)', ''), rc, ih, sc].some((t) => /[\u2014\u2013]/.test(t)));
    ok('no Next as a control word', !/>Next</.test(cj) && !/'Next'/.test(cj));
    ok('the five panels are gone from canopy.js and results.css', !/planPanels|wirePanels|directLead|PANEL_STEP_WORD|pp-cta-go/.test(cj) && !/\.pp\b|\.pp-|#pp-/.test(rc));
    ok('no timed reveal remains (no IntersectionObserver, no setTimeout that unveils)', !/IntersectionObserver/.test(cj) && !/data-veil/.test(cj));
    ok('the snap is proximity, never mandatory, and relaxes under data-snap="off"', /scroll-snap-type: y proximity/.test(rc) && !/scroll-snap-type: y mandatory/.test(rc) && /\[data-snap="off"\][^{]*\{ scroll-snap-type: none/.test(rc));
    ok('each stage reserves the viewport with a minimum, not a fixed height', /\.stage \{[^}]*min-height: 100dvh/.test(rc) && !/\.stage \{[^}]*[^-]height: 100dvh/.test(rc));
    ok('the CTA is at least 64 px tall on desktop and 60 on the phone', /\.stage-cta \{[^}]*min-height: 64px/.test(rc) && /\.stage-cta \{ min-height: 60px/.test(rc));
    ok('the inspector fades in 180 to 300 ms and not under reduced motion', /transition: opacity 240ms/.test(rc) && /prefers-reduced-motion: reduce\) \{ \.inspector \.insp-body[^}]*transition: none/.test(rc));
    ok('no blur, shadow or uppercase in results.css', !/blur\(|box-shadow|text-transform: *uppercase/.test(rc));
    ok('the shell names the four stages, the navigator and the inspector', ['stage-move', 'stage-why', 'stage-plan', 'stage-start', 'plan-nav', 'inspector'].every((id) => ih.includes(`id="${id}"`)));
    ok('scene.css lifts the discs layer over the clearing on the plan view', /body\[data-stage="plan"\] #discs[^{]*\{ z-index: 3; \}/.test(sc));

    console.log('== an owner arrives on Your move');
    state.biz = 'ABC Consulting';
    M.commit('now', 40000, {}); M.commit('sector', { sector: 'professional', trade: 'Consultancy' }, {});
    M.commit('goal', { goal: 80000, appetite: 'aggressive' }, {}); M.commit('months', 12, {}); M.commit('price', 4800, {});
    M.commit('capacity', 12, {}); M.commit('servedNow', 8, {}); M.commit('enquiries', 10, {}); M.commit('closeRate', 0.3, {});
    state.asked = ['now', 'sector', 'goal', 'months', 'price', 'capacity', 'servedNow', 'enquiries', 'closeRate'];
    M.ensurePlanned();
    try { await M.ladder(); } catch (e) { /* optional */ }
    M.canopy.openPlan(); await sleep(80);
    const host = $('#plan');
    const pl = M.canopy.plan().plan;
    ok('the plan view is on and a plan object is there', (M.stage === 'plan' || document.body.dataset.stage === 'plan') && !!pl, M.stage);
    const kids = [...host.children].map((el) => el.id);
    ok('D1: back, the heading, the navigator, then the four stages, nothing else', kids.join('|') === 'hv-back|hv-title|plan-nav|stage-move|stage-why|stage-plan|stage-start', kids);
    const OLD = ['hv-back', 'hv-title', 'plan-decision', 'plan-first', 'plan-secs', 'plan-downloads', 'hv-pdf', 'hv-md', 'hv-copy', 'hv-progress', 'hv-call', 'hv-tma', 'hv-json', 'hv-diy', 'hv-legal', 'hv-private', 'hv-disclaimer', 'hv-save', 'hv-agent', 'agent', 'plan-model-host', 'tree-view-host'];
    const missing = OLD.filter((id) => !$('#' + id, host) || !(id === 'hv-back' || id === 'hv-title' || $('#' + id, host).closest('.stage')));
    ok('every id the old view exposed is inside a stage', missing.length === 0, missing);
    ok('the current stage is Your move and the navigator marks it', M.canopy.stages.current() === 'move' && document.body.dataset.result === 'move' && $('#plan-nav [data-nav="move"]').getAttribute('aria-current') === 'true');
    ok('the navigator reads Your move / Why it fits / Your plan / Start', $$('#plan-nav button').map(text).join('|') === 'Your move|Why it fits|Your plan|Start', $$('#plan-nav button').map(text));
    const mv = M.canopy.stages.move(pl);
    ok('D6: goal label, a headline of at most 12 words, a support line of at most 24', text($('#move-goal')).length > 0 && words(text($('#move-head'))) <= 12 && words(text($('#move-head'))) > 0 && words(text($('#move-support'))) <= 24 && words(text($('#move-support'))) > 0, { goal: text($('#move-goal')), head: text($('#move-head')), support: text($('#move-support')) });
    ok('the headline is an action, not a topic or praise', !/^(Your|Congratulations|Well done|Great)/i.test(text($('#move-head'))) && !/\bpotential\b|\bjourney\b/i.test(text($('#move-head'))), text($('#move-head')));
    ok('the primary is Show my first step; the secondary is Why this move?', text($('#move-go')) === 'Show my first step' && $('#move-go').classList.contains('stage-cta') && text($('#move-why')) === 'Why this move?');
    ok('the Working hypothesis tag follows the flag', (!!$('#move-hyp')) === !!mv.hypothesis, { tag: !!$('#move-hyp'), flag: mv.hypothesis });
    ok('nothing is open on arrival: the answer stands by itself', $('#inspector').hidden === true && M.canopy.stages.open() === null);
    ok('the tree list is the keyboard twin: branch, evidence, milestones, Fit the whole tree', $$('#tree-list button').length >= 5 && $$('#tree-list button').map(text).some((t) => /^Recommended branch/.test(t)) && ['Today:', 'This week:', 'Review:'].every((w) => $$('#tree-list button').map(text).some((t) => t.startsWith(w))) && $$('#tree-list button').map(text).includes('Fit the whole tree'), $$('#tree-list button').map(text));
    ok('every tree-list item is a real button with a name', $$('#tree-list button').every((b) => b.tagName === 'BUTTON' && text(b).length > 3));
    ok('no toolbar is pinned to the floor: its three actions live in the stages (the cockpit brief, 3.2)', $('#res-bar').hidden === true && !!$('#stage-start .stage-cta') && !!$('#stage-plan'));
    ok('nothing was sent, saved or opened by arriving', network.length === 0 && saves.length === 0 && opened.length === 0);

    console.log('== D6: Show my first step jumps to the plan stage and opens Today');
    $('#move-go').click(); await sleep(30);
    ok('the stage is Your plan and the heading has focus', M.canopy.stages.current() === 'plan' && document.activeElement === $('#plan-head') && $('#plan-nav [data-nav="plan"]').getAttribute('aria-current') === 'true', document.activeElement?.id);
    ok('the inspector is in the plan column and shows the Today card', !$('#inspector').hidden && !!$('#stage-plan #inspector') && !!$('#plan-first .action-card') && text($('#insp-kind')) === 'Today');
    ok('the tabs read Today / This week / Review and Today is selected', $$('#plan-tabs [role="tab"]').map(text).join('|') === 'Today|This week|Review' && $('#plan-tabs [data-ms="today"]').getAttribute('aria-selected') === 'true');
    const card = $('#plan-first .action-card');
    const face = $$(':scope > .ac > .ac-row', card).map((r) => text($('dt', r)).replace(/Refined$/, '').trim());
    ok('the card face is task, do this, time and cost, done when', text($('.ac-title', card)).length > 0 && face.every((l) => ['Do this', 'Time and cost', 'Done when'].includes(l)), face);
    ok('at most three steps on the face', $$(':scope > .ac .ac-steps li', card).length <= 3);
    const prose = [text($('.ac-title', card)), ...$$(':scope > .ac > .ac-row dd', card).map(text)].join(' ');
    ok('the card prose is under 90 words', words(prose) <= 90, { words: words(prose) });
    ok('Details holds the rest, shut', !!$('.ac-details', card) && $('.ac-details', card).open !== true);
    ok('the asset button is a verb and no button reads Learn more', !$('[data-start]', card) || /^(Copy|Open) /.test(text($('[data-start]', card))), text($('[data-start]', card)));
    ok('no Learn more anywhere on the page', !/Learn more/.test(text(host)));
    ok('the primary is Get help putting this into action; Download my plan is secondary', text($('#plan-go')) === 'Get help putting this into action' && text($('#plan-dl')) === 'Download my plan' && $('#plan-dl').classList.contains('link'));

    console.log('== D5 and D7: one inspector, fast presses, the tick');
    $('#plan-tabs [data-ms="week"]').click(); $('#plan-tabs [data-ms="review"]').click(); $('#plan-tabs [data-ms="today"]').click(); await sleep(20);
    ok('three fast presses leave exactly one card, the last one pressed', $$('#plan-first .action-card').length === 1 && M.canopy.stages.milestone() === 'today' && text($('#insp-kind')) === 'Today');
    $('#plan-tabs [data-ms="review"]').click(); await sleep(20);
    ok('Review is a card with the criteria labelled as proposed', /Review/.test(text($('#plan-first .ac-title'))) && /Proposed test criteria/.test(text($('#plan-first'))) && !/forecast says|will earn/i.test(text($('#plan-first'))), text($('#plan-first')).slice(0, 200));
    $('#plan-tabs [data-ms="today"]').click(); await sleep(20);
    const tick = $('#plan-first input[data-done]');
    tick.checked = true; tick.dispatchEvent(new window.Event('change', { bubbles: true })); await sleep(20);
    ok('the tick records the mark and claims nothing about the result', M.canopy.stages.done().length === 1 && /You marked this done/.test(text($('#plan-first'))) && !/revenue improved|validated/i.test(text($('#plan-first'))));
    ok('the card stays open after the tick (nothing disappears by itself)', !!$('#plan-first .action-card') && !$('#inspector').hidden);
    await sleep(700);
    ok('nothing changed on its own after 700 ms', M.canopy.stages.current() === 'plan' && !!$('#plan-first .action-card') && M.canopy.stages.milestone() === 'today');

    console.log('== D6: Why, its labels, the card, evidence and Change an answer');
    let reopened = [];
    const realReopen = M.reopen;
    M.reopen = (id) => { reopened.push(id); };
    $('#plan-nav [data-nav="why"]').click(); await sleep(30);
    ok('the navigator moves the stage and focus to Why', M.canopy.stages.current() === 'why' && document.activeElement === $('#why-head'));
    const why = M.canopy.stages.why(pl);
    ok('the default card is open and under 65 words', !$('#inspector').hidden && text($('#insp-kind')) === 'Why this move' && words(text($('#insp-body'))) <= 65 && words(text($('#insp-body'))) > 0, { words: words(text($('#insp-body'))), card: text($('#insp-body')) });
    ok('up to three evidence labels of at most four words, from the visitor’s own evidence', $$('#stage-why .fact').length <= 3 && $$('#stage-why .fact').every((b) => words(text(b)) <= 4) && why.facts.every((f) => f.evidenceIds.length || f.answerId || f.text), $$('#stage-why .fact').map(text));
    ok('the labels are never the brief’s example fixtures', !$$('#stage-why .fact').map(text).some((t) => /12 open quotes|2 free job slots|Follow-up not tracked/.test(t)));
    ok('Show evidence and Open my plan are there; Change an answer when an answer is behind it', text($('#why-evidence')) === 'Show evidence' && text($('#why-go')) === 'Open my plan' && (!why.answerId || text($('#why-change')) === 'Change an answer'));
    const fact = $('#stage-why .fact');
    if (fact) {
      fact.click(); await sleep(20);
      ok('a label replaces the inspector with its fact and marks itself pressed', text($('#insp-kind')) === text(fact) && fact.getAttribute('aria-pressed') === 'true' && $$('#inspector .insp-body').length === 1);
    } else ok('no grounded fact on this plan yet: the label check is skipped', true);
    $('#why-evidence').click(); await sleep(20);
    ok('Show evidence replaces the inspector with the evidence, one thing open', text($('#insp-kind')) === 'Evidence' && $$('.inspector').length === 1);
    ok('the mission line is short', !$('#why-mission') || words(text($('#why-mission'))) <= 30, text($('#why-mission')));
    if ($('#why-change')) { $('#why-change').click(); await sleep(10); ok('Change an answer reopens the originating question', reopened.length === 1 && !!reopened[0], reopened); }
    M.reopen = realReopen;
    $('#why-go').click(); await sleep(20);
    ok('Open my plan lands on the plan stage with the milestone kept', M.canopy.stages.current() === 'plan' && M.canopy.stages.milestone() === 'today' && !!$('#plan-first .action-card'));

    console.log('== D6: Start, one honest CTA, nothing sent');
    $('#plan-go').click(); await sleep(20);
    ok('Get help lands on Start with focus on its heading', M.canopy.stages.current() === 'start' && document.activeElement === $('#start-head'));
    ok('the headline and one sentence of at most 30 words', text($('#start-head')) === 'Put your plan into action.' && words(text($('#start-line'))) <= 30 && words(text($('#start-line'))) > 0, text($('#start-line')));
    ok('no promise of a price or an outcome in the sentence', !/£|guarantee|will grow|will double/i.test(text($('#start-line'))), text($('#start-line')));
    const st = M.canopy.stages.start(pl);
    ok('the one primary CTA matches the configured destination', $$('#stage-start .stage-cta').length === 1 && text($('#start-go')) === (st.cta === 'book' ? 'Book a call with TMA' : 'Download my implementation brief'), { cta: st.cta, label: text($('#start-go')) });
    ok('the secondaries are Download my plan and Back to my first step, and Choose what to share stays', text($('#start-dl')) === 'Download my plan' && text($('#start-back')) === 'Back to my first step' && text($('#stage-start #hv-json .hv-word')) === 'Choose what to share');
    ok('the small print sits in one shut drawer', $('#start-more').open !== true && ['hv-legal', 'hv-save', 'agent', 'hv-tma'].every((id) => !!$('#start-more #' + id)));
    const net0 = network.length, sv0 = saves.length;
    $('#start-go').click(); await sleep(30);
    if (st.cta === 'book') ok('a booking press opens the destination and sends nothing', opened.length === 1 && opened[0] === st.destination && network.length === net0 && saves.length === sv0, opened);
    else ok('the brief press saves a file and sends nothing', saves.length === sv0 + 1 && network.length === net0 && /Nothing was sent/.test(text($('#res-said'))));
    $('#start-back').click(); await sleep(20);
    ok('Back to my first step returns to Today on the plan stage', M.canopy.stages.current() === 'plan' && M.canopy.stages.milestone() === 'today' && text($('#insp-kind')) === 'Today');

    console.log('== D8: snap, keys and focus');
    const clearing = $('#clearing');
    M.canopy.stages.snap();
    ok('on a 768 px jsdom viewport the snap holds (no data-snap="off")', clearing.dataset.snap !== 'off', clearing.dataset.snap);
    window.innerHeight = 600; M.canopy.stages.snap();
    ok('under 640 px tall the snap is relaxed', clearing.dataset.snap === 'off');
    window.innerHeight = 768; M.canopy.stages.snap();
    $('#inspector').dispatchEvent(new window.Event('pointerenter'));
    ok('the pointer inside the inspector relaxes the snap', clearing.dataset.snap === 'off');
    $('#inspector').dispatchEvent(new window.Event('pointerleave'));
    ok('and leaving it restores the snap', clearing.dataset.snap !== 'off');
    const before = M.canopy.stages.current();
    const right = new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    document.body.dispatchEvent(right);
    ok('the right arrow is not taken by the stages', !right.defaultPrevented && M.canopy.stages.current() === before);
    const focusWas = document.activeElement;
    clearing.dispatchEvent(new window.Event('scroll')); await sleep(120);
    ok('a passive scroll moves no focus', document.activeElement === focusWas);
    ok('the wheel is not intercepted anywhere in canopy.js', !/addEventListener\('wheel'/.test(cj));

    console.log('== D4: the tree events, the chip flag and the frame');
    const calls = [];
    const listeners = {};
    const realTree = M.tree;
    M.tree = { on: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); }, frame: (p) => calls.push(['frame', p]), select: (l) => calls.push(['select', l]), selectBranch: (l) => calls.push(['selectBranch', l]), setPath: (b, ms) => calls.push(['setPath', b, ms]), setEvidenceLabels: (l) => calls.push(['setEvidenceLabels', l]), setChip: (v) => calls.push(['setChip', v]), fitAll: () => calls.push(['fitAll']), setDiscs() {}, setCollar() {}, setView() {}, setMetric() {}, setMetrics() {}, setEncoding() {}, lockDrag() {} };
    document.body.dataset.stage = 'explore'; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage: 'explore', section: null } })); await sleep(20);
    ok('leaving the plan view puts the chip back and clears the path and the labels', calls.some((c) => c[0] === 'setChip' && c[1] === true) && calls.some((c) => c[0] === 'setPath' && c[2].length === 0) && !document.body.dataset.result);
    calls.length = 0;
    M.canopy.openPlan(); await sleep(60);
    const branchNow = M.canopy.stages.move(M.canopy.plan().plan).branchId; // the plan may have been rebuilt since the first read
    ok('arriving on the plan view frames the results preset or harvest, switches the chip off and selects the branch', calls.some((c) => c[0] === 'frame' && (c[1] === 'results' || c[1] === 'harvest')) && calls.some((c) => c[0] === 'setChip' && c[1] === false) && calls.some((c) => c[0] === 'selectBranch' && c[1] === branchNow), calls.map((c) => c[0]));
    ok('on Your move the path and the evidence labels are empty', calls.filter((c) => c[0] === 'setPath').every((c) => c[2].length === 0) && calls.filter((c) => c[0] === 'setEvidenceLabels').every((c) => c[1].length === 0));
    calls.length = 0;
    M.canopy.stages.go('why'); await sleep(10);
    ok('on Why the evidence labels go to the tree, at most three with a part', calls.some((c) => c[0] === 'setEvidenceLabels' && c[1].length <= 3 && c[1].every((l) => l.id && l.label && l.part)), calls.find((c) => c[0] === 'setEvidenceLabels'));
    calls.length = 0;
    M.canopy.stages.go('plan'); await sleep(10);
    const sp = calls.find((c) => c[0] === 'setPath');
    ok('on Your plan the path carries the three milestones with the active one marked', !!sp && sp[1] === branchNow && sp[2].map((m) => m.id).join('|') === 'today|week|review' && sp[2].find((m) => m.id === 'today').state !== 'todo', sp);
    listeners.milestone?.forEach((fn) => fn({ id: 'week' })); await sleep(10);
    ok('a milestone press on the tree opens This week', M.canopy.stages.milestone() === 'week' && text($('#insp-kind')) === 'This week');
    const firstFact = M.canopy.stages.why(pl).facts[0];
    if (firstFact) { listeners.evidence?.forEach((fn) => fn({ id: firstFact.id })); await sleep(10); ok('an evidence press on the tree opens the fact on Why', M.canopy.stages.current() === 'why' && text($('#insp-kind')) === firstFact.label); }
    listeners.select?.forEach((fn) => fn('capacity')); await sleep(10);
    ok('a branch press on the tree opens the branch in the inspector', text($('#insp-kind')) === 'Branch' && /delivery/.test(text($('#insp-body'))), text($('#insp-body')).slice(0, 80));
    calls.length = 0;
    $$('#tree-list button').find((b) => text(b) === 'Fit the whole tree').click();
    ok('Fit the whole tree calls fitAll', calls.some((c) => c[0] === 'fitAll'));
    M.tree = realTree;

    console.log('== the plan without the D3 fields renders from firstAction, finding and goalPath');
    const realPlan = M.plan;
    const bare = JSON.parse(JSON.stringify(realPlan.current().plan ?? realPlan.current()));
    delete bare.move; delete bare.why; delete bare.sequence; delete bare.start; delete bare.fit;
    bare.actions.forEach((a) => { delete a.task; delete a.card; delete a.details; delete a.time; if (a.asset && typeof a.asset === 'object') a.asset = a.asset.kind; });
    bare.firstAction = bare.actions.find((a) => a.id === bare.firstAction?.id) ?? bare.actions[0];
    M.plan = { ...realPlan, current: () => bare };
    M.canopy.openPlan(); await sleep(60);
    ok('the headline and support still fit their budgets', words(text($('#move-head'))) > 0 && words(text($('#move-head'))) <= 12 && words(text($('#move-support'))) > 0 && words(text($('#move-support'))) <= 24, { head: text($('#move-head')), support: text($('#move-support')) });
    $('#move-go').click(); await sleep(20);
    ok('Today is the first action and the card face is under 90 words', !!$('#plan-first .action-card') && words([text($('.ac-title')), ...$$(':scope > .ac > .ac-row dd', $('#plan-first .action-card')).map(text)].join(' ')) <= 90);
    M.canopy.stages.go('why'); await sleep(10);
    ok('the Why card composes from the plan’s own grounded evidence, under 65 words', words(text($('#insp-body'))) > 0 && words(text($('#insp-body'))) <= 65, text($('#insp-body')));
    M.plan = realPlan;

    console.log('== a summary that overruns is replaced by the short field, never clipped');
    const over = JSON.parse(JSON.stringify(realPlan.current().plan ?? realPlan.current()));
    over.move = { ...(over.move ?? {}), headline: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen', short: 'Follow up your open quotes first', support: 'x '.repeat(30).trim(), supportShort: 'Twelve quotes are open and two slots are free this week.' };
    over.start = { headline: 'Put your plan into action.', sentence: 'w '.repeat(40).trim(), sentenceShort: 'TMA could go through the first step with you.', cta: 'download', destination: null };
    M.plan = { ...realPlan, current: () => over };
    M.canopy.openPlan(); await sleep(60);
    ok('the headline shows the short field whole', text($('#move-head')) === 'Follow up your open quotes first');
    ok('the support shows the short field whole', text($('#move-support')) === 'Twelve quotes are open and two slots are free this week.');
    ok('nothing on the page ends in an ellipsis or a cut word', !/…|\.\.\./.test(text($('#stage-move'))));
    M.canopy.stages.go('start'); await sleep(10);
    ok('a download CTA is honoured when the plan says so and says the gap', text($('#start-go')) === 'Download my implementation brief' && /No booking destination/.test(text($('#start-note'))));
    M.plan = realPlan;

    console.log('== the starter route on a fixture');
    const sf = { id: 'plan-stages-starter', route: 'starter', revision: 4, status: 'preliminary', business: 'Example Garden Care', currency: 'GBP',
      goal: { text: 'A first paying customer', when: 'November 2026', protected: [] },
      finding: { short: 'Garden care for older householders', text: 'The strongest direction from what you have told us.', section: 'offer', limb: 'pricing', evidence: [] },
      keyUnknown: 'Whether five householders will pay', unknowns: [{ id: 'n35', title: 'What the visit should cost' }],
      actions: [{ id: 'test-1', action: 'Offer five neighbours a fortnightly visit at a fixed price', rank: 1, status: 'primary', whyFirst: 'Five paying customers prove the demand before anything is bought.', steps: ['Write the offer on one page with the price.', 'Send it to five neighbours who already asked for help.', 'Log each reply.', 'Book the first visit.'], responsible: 'You', needs: [], effort: '4 hours', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'Five householders have said yes or no.', measure: 'Yeses out of five.', changeCourseIf: 'Fewer than two say yes.', asset: 'offer-sheet', affects: { limb: 'conversion', section: 'close' } }],
      alternatives: [{ id: 'alt-1', action: 'Lawn cutting for landlords', why: 'Weaker access: no landlord has asked.', tradeoff: 'Lawn cutting for landlords: no landlord has asked yet, so it starts colder.', useable: true }],
      primaries: ['test-1'], scenarios: [], assets: [{ id: 'asset:offer-sheet', kind: 'offer-sheet', title: 'Offer sheet', text: 'OFFER SHEET: a fortnightly visit at a fixed price, for five neighbours.' }], sources: [], evidence: [], method: null };
    sf.firstAction = sf.actions[0];
    state.route = 'starter';
    M.plan = { ...realPlan, current: () => sf };
    M.canopy.openPlan(); await sleep(60);
    ok('the starter arrives on Your move with an action headline', M.canopy.stages.current() === 'move' && words(text($('#move-head'))) <= 12 && /Offer five neighbours/.test(text($('#move-head'))), text($('#move-head')));
    ok('the hypothesis tag shows on a preliminary plan', !!$('#move-hyp'));
    $('#move-go').click(); await sleep(20);
    ok('Today is the test with at most three steps and an asset verb', $$(':scope > .ac .ac-steps li', $('#plan-first .action-card')).length === 3 && text($('#plan-first [data-start]')) === 'Open offer sheet', text($('#plan-first [data-start]')));
    $('#plan-first [data-start]').click(); await sleep(30);
    ok('the asset opens under the card', !$('#plan-first .asset-open').hidden && /OFFER SHEET/.test(text($('#plan-first .asset-open'))));
    const altBtn = $$('#tree-list button').find((b) => /^Alternative:/.test(text(b)));
    altBtn.click(); await sleep(10);
    ok('an alternative previews its trade-off without changing the plan, with Use this direction', text($('#insp-kind')) === 'Alternative' && /starts colder/.test(text($('#insp-body'))) && !!$('#insp-body [data-act="use:alt-1"]') && /Offer five neighbours/.test(text($('#move-head'))));
    state.route = 'owner';
    M.plan = realPlan;

    ok('no error was thrown across the run', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    ok('(threw) ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e)), false);
  }
  done();
})();
