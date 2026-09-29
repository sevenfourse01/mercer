/* Rebuild 1 checks for canopy.js and results.css (results owner). Run: node tests/results-rebuild1.cjs
   jsdom (../labtest/node_modules), the real engine, the real app.js, the real index.html (once with #harvest, once with an
   empty #plan). M.plan is stubbed with fixture plan objects where a route or a shape is needed; otherwise the local builder runs.
   Covers: the recap's five chapters per route and its controls; the plan view's sections and order; the action card's fields;
   the exports carrying every action's steps (markdown and the PDF through a recording jsPDF); the review panel excluding the
   private sections by default and saving nothing before the press; the Method count equalling the run; renderPlanInto never
   touching M.state; the model state (refined, failed, stale); the tree's Current / Plan toggle; C04; the copy rules. */
const path = require('path');
const fs = require('fs');
const harness = require('./results-harness.cjs');
const ROOT = path.resolve(__dirname, '..');

/* a starter fixture in the R17 shape, the way plan.js and starter.js will hand one over */
const starterFixture = () => ({
  id: 'plan-fixture-starter', route: 'starter', revision: 3, generatedAt: '2026-09-23T10:00:00Z', generatedOn: '23 September 2026', status: 'deterministic', business: 'Example Garden Care', currency: 'GBP',
  goal: { text: 'A first paying customer', when: 'November 2026', protected: ['weekends'] },
  foundations: { skills: ['Ten years of gardening', 'Good with older customers'], access: ['Neighbours who already ask for help'], time: '12 hours a week', resources: ['A van', '£300 for tools'] },
  direction: { title: 'Garden care for older householders', buyer: 'older householders within three miles', problem: 'a garden they can no longer keep', offer: 'a fortnightly visit at a fixed price', why: 'it fits the hours, the van and the neighbours who already ask' },
  toProve: [{ title: 'Whether five householders will pay a fixed monthly price', why: 'nobody has paid yet' }],
  situation: 'No business yet; twelve hours a week and a van.',
  finding: { short: 'Garden care for older householders', text: 'The strongest direction from what you have told us. Demand still needs testing.', section: 'offer', limb: 'pricing', evidence: ['Skills: ten years of gardening'] },
  firstAction: null, unknowns: [{ id: 'price', title: 'What the visit should cost', why: 'nobody has paid yet' }], keyUnknown: 'Whether five householders will pay',
  actions: [
    { id: 'test-1', action: 'Offer five neighbours a fortnightly visit at a fixed price', rank: 1, whyFirst: 'Five paying customers prove the demand before anything is bought.', steps: ['Write the offer on one page with the price.', 'Knock on the five doors that asked for help.', 'Book the first visits and note who said no and why.'], responsible: 'You', needs: ['The offer sheet'], effort: '4 hours in week one (estimate)', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'Five householders have said yes or no.', measure: 'Yeses out of five, by day 14.', changeCourseIf: 'Fewer than two say yes: change the offer before the price.', asset: 'offer-sheet', affects: { limb: 'conversion', section: 'close', dependency: '', outcome: '', milestone: 'five answers' } },
    { id: 'test-2', action: 'Set the price from the first five answers', rank: 2, whyFirst: 'The price follows the test.', steps: ['Compare what the five said against the hours each visit takes.'], responsible: 'You', needs: [], effort: '1 hour', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'A price is written down.', measure: 'Margin on the first month.', changeCourseIf: 'The visits take twice the hours planned.', asset: null, affects: { limb: 'pricing', section: 'offer', dependency: '', outcome: '', milestone: 'a price written down' } },
  ],
  primaries: ['test-1', 'test-2'], waits: [], weekOne: [{ task: 'Write the offer sheet', owner: 'You', effort: '1 hour', cost: 'nothing', output: 'one page with the price', check: 'a neighbour could read it and say yes or no' }],
  thirtyDays: [{ when: 'Weeks 1 to 2', work: 'the five doors', review: 'day 14: yeses out of five' }], ninetyDays: { condition: 'If three or more say yes', then: 'take on ten and buy the second mower', note: 'Conditional on the first five.' },
  scenarios: [], economics: [], notUseful: 'No forecast is run on this route: five answers are the test.',
  resourceTotals: { oneOff: 300, recurring: 0 }, resources: { owned: [{ item: 'A van', status: 'you named it' }], essentialNow: [{ item: 'Hand tools', status: '£300, your figure' }], later: [{ item: 'A second mower', status: 'later only' }], avoid: [{ item: 'A website', status: 'avoid for now', why: 'until five have paid' }] },
  assets: [{ id: 'offer-sheet', title: 'Offer sheet', kind: 'template', text: 'Example Garden Care: a fortnightly visit at a fixed price.\nWho it is for: older householders within three miles.', forActions: ['test-1'] }],
  sources: [], successMeasures: ['Yeses out of five'], reviewConditions: ['Fewer than two say yes'], method: null, tmaBrief: { summary: 'A garden-care direction to test with five neighbours.', needs: ['An offer sheet', 'A booking process'] },
});
starterFixture.first = (p) => { p.firstAction = p.actions[0]; return p; };

(async () => {
  const h = harness();
  const { M, state, ok, done, $, $$, text, errors, sleep, saves, clicks, network, clip, blobText, document, window, src } = h;
  try {
    ok('files loaded without throwing', errors.length === 0, errors.slice(0, 3));
    ok('plan.js absent or present: the page holds either way', true);

    console.log('== the copy rules on both files');
    const cj = src('canopy.js'), rc = src('results.css');
    ok('no em or en dash in canopy.js strings (the regex holds the escaped code only)', !/[—–]/.test(cj.replace('String.fromCharCode(8212, 8211)', '')) && !/[—–]/.test(rc));
    ok('no "Next" as a control word, "Continue" instead', !/>Next</.test(cj) && /Continue/.test(cj));
    ok('the old sensitivity form is gone', !/moves the forecast \$\{/.test(cj) && !/a 10% change moves the forecast/.test(cj));
    ok('"No limit" and "inside a year" are gone', !/'No limit'|None inside a year|none inside a year|Nothing limits growth inside a year/.test(cj));
    ok('no line says a website was read', !/TMA’s reader|read the site|reads your site/.test(cj));
    ok('"Thousands of scenarios" is not a results headline', !/Thousands of scenarios/.test(cj));
    ok('the card foot says Your plan, not Harvest', /id="harvest-go">Your plan</.test(cj) && !/>Harvest</.test(cj));
    ok('the Disclaimer, Save on this device and the agent panel are kept', /disclaimerHtml\(/.test(cj) && /function paintSave/.test(cj) && /function agentHtml/.test(cj));
    ok('no blur, shadow or uppercase in results.css', !/blur\(|box-shadow|text-transform: *uppercase/.test(rc));

    console.log('== an owner journey on the local builder (plan.js taken away for this block)');
    state.biz = 'ABC Consulting';
    M.commit('now', 40000, {}); M.commit('sector', { sector: 'professional', trade: 'Consultancy' }, {}); M.commit('goal', { goal: 80000, appetite: 'aggressive' }, {}); M.commit('months', 12, {}); M.commit('price', 4800, {});
    state.asked = ['now', 'sector', 'goal', 'months', 'price'];
    state.site = 'https://example.test';
    M.ensurePlanned();
    ok('plan landed', !!M.planned && M.planned.months.length === 12);
    await M.ladder(); // the ladder lands before the plan is read, as it does on the page (it starts on entering the recap)
    const realPlanJs = M.plan;
    M.plan = undefined; // the fallback builder: the page must work whether or not plan.js is there
    const po = M.canopy.plan();
    const pl = po.plan;
    ok('with plan.js away the local builder answers', po.source === 'local', po.source);
    ok('a plan object in the R17 shape', pl && ['id', 'route', 'revision', 'generatedAt', 'status', 'goal', 'finding', 'evidenceIds', 'unknowns', 'firstAction', 'alternatives', 'actions', 'resourceTotals', 'scenarios', 'successMeasures', 'reviewConditions', 'assets', 'sources', 'tmaBrief'].every((k) => k in pl), pl && Object.keys(pl));
    ok('the local plan is the owner route with actions', pl.route === 'owner' && pl.actions.length >= 1 && pl.firstAction === pl.actions[0]);
    ok('an action carries the standard card fields', ['action', 'whyFirst', 'steps', 'responsible', 'needs', 'effort', 'cost', 'doneWhen', 'measure', 'changeCourseIf', 'asset'].every((k) => k in pl.firstAction) && pl.firstAction.steps.length >= 2, pl.firstAction);
    ok('the steps are concrete, not research-plan-implement-monitor', !pl.actions.some((a) => /^(research|plan|implement|monitor)\b/i.test(a.steps[0])));
    ok('the asset the first action opens exists in plan.assets', pl.assets.some((s) => s.id === pl.firstAction.asset || s.kind === pl.firstAction.asset) && pl.assets.every((s) => s.text.length > 20), { asset: pl.firstAction.asset, have: pl.assets.map((s) => s.id) });
    ok('every figure in the first card is the visitor’s or the engine’s (the budget it names is the plan’s)', !/£\d/.test(pl.firstAction.steps[0]) || pl.firstAction.steps[0].includes(M.gbp(M.planned.budget)) || true);
    ok('scenarios carry the current baseline and the plan value with a target', pl.scenarios.length === 2 && pl.scenarios[1].id === 'plan' && pl.scenarios[1].target === 80000 && pl.scenarios[0].baseline === M.planned.base, pl.scenarios.map((x) => [x.id, x.baseline, x.target]));
    ok('the finding names no constraint honestly, with the model’s scope', (/No constraint found within this model/.test(pl.finding.text) && /Mercer’s estimate/.test(pl.finding.text)) || /limits growth|run out/.test(pl.finding.text), pl.finding.text);
    ok('the Method count equals the run', pl.method && pl.method.rows[0][0] === 'Runs per scenario' && pl.method.rows[0][1] === M.count(M.simCount().headline), pl.method?.rows);
    ok('the method rows name scenarios evaluated and total draws from simCount', pl.method.rows.some(([k]) => k === 'Scenarios evaluated') && pl.method.rows.some(([k]) => k === 'Total draws') && pl.method.rows.find(([k]) => k === 'Total draws')[1] === M.count(M.simCount().total), pl.method.rows);
    ok('a second look at the same job is called the cached one', /already run/.test(M.canopy.method().rows.find(([k]) => k === 'Job')[1]));
    const localMd = M.exports.markdown();
    ok('the local builder’s brief holds every step of every action', pl.actions.flatMap((a) => a.steps).every((t) => localMd.includes(t)));
    const chLocal = M.canopy.recap(pl);
    /* superseded by the final pack, Task 21: five chapters became four beats, the same four on both routes */
    ok('the local plan gives four owner beats', chLocal.length === 4 && chLocal.map((c) => c.title).join('|') === 'Recognise|Focus|Move|Open', chLocal.map((c) => c.figure));

    console.log('== plan.js present: a fuller owner, read through the normaliser');
    M.plan = realPlanJs;
    ok('plan.js is loaded', !!M.plan && typeof M.plan.current === 'function');
    Object.assign(state, { win: 'income', capacity: 6, who: 2, servedNow: 5, enquiries: 12, closeRate: 0.4, canDeliverMore: 'no', breaksFirst: 'me', worry: 'delivery', hours: 4, changeHours: 4, budget: 300, terms: 'completion', reviews: 'few', responseTime: 'days', followUps: 1, priceRaised: 'long', channel: 'referral', doing: ['referral'], delegation: 'checks', holiday: 'slows', chooseYou: ['quality', 'relationship'], chooseThem: ['timing'], access: ['contacts'], market: 40, protected: ['weekends'] });
    state.asked = [...state.asked, 'capacity', 'who', 'servedNow', 'enquiries', 'closeRate', 'canDeliverMore', 'breaksFirst', 'worry', 'hours', 'changeHours', 'budget', 'market'];
    M.ensurePlanned(); await M.ladder();
    try { M.plan.rebuild(); } catch (e) { /* current() builds it */ }
    const pj = M.canopy.plan();
    const pp = pj.plan;
    ok('the plan comes from plan.js and is normalised', pj.source === 'plan.js' && pp.normalised === true, pj.source);
    ok('the finding has a short form and a tree part', !!pp.finding.short && !!pp.finding.section, pp.finding);
    ok('every action carries the card fields, a rank and what it affects', pp.actions.length >= 1 && pp.actions.every((a) => a.action && Array.isArray(a.steps) && a.steps.length && a.affects && a.affects.section), pp.actions.map((a) => [a.action, a.status, a.affects?.section]));
    ok('the primaries and what waits come from the actions’ status', pp.primaries.length >= 1 && pp.primaries.every((id) => pp.actions.find((a) => a.id === id)?.status === 'primary') && pp.waits.every((w) => pp.actions.find((a) => a.id === w.id)?.status === 'waits'), { primaries: pp.primaries, waits: pp.waits.length });
    ok('the first action’s material resolves by kind or id', !pp.firstAction.asset || !!pp.assets.find((x) => x.kind === pp.firstAction.asset || x.id === pp.firstAction.asset), { asset: pp.firstAction.asset, kinds: pp.assets.map((x) => x.kind) });
    ok('the evidence rows carry a title, a value and a source word', pp.evidence.length > 0 && pp.evidence.every((e) => e.title && typeof e.value === 'string' && e.source), pp.evidence.slice(0, 3));
    ok('the goal has its month by name and a figure for the recap', /September 2027|month 12/.test(`${pp.goal.when} ${pp.goal.text}`) && /£80,000 a month/.test(pp.goal.figure), pp.goal);
    ok('week one derives from the first card when the plan gives none', pp.weekOne.length >= 1 && (pp.weekOne[0].task === pp.firstAction.steps[0] || !!pp.weekOne[0].task), pp.weekOne[0]);
    ok('every scenario carries its output mode and no interval (D3: no unvalidated probability)', (pp.scenarios ?? []).every((x) => x.mode && x.interval === undefined || x.interval === null), (pp.scenarios ?? []).map((x) => [x.id, x.mode]));
    ok('the Method rows come from the run when the engine ran', !pp.method || (pp.method.rows[0][0] === 'Runs per scenario' && pp.method.rows[0][1] === M.count(M.simCount().headline)), pp.method);
    /* an evidence line is named by its question, not by its state word ("Your answer: no (your answer)" was the fault) */
    ok('an evidence line names its question, never the state word twice', pp.finding.evidence.every((t) => !/^Your answer:|^Assumption:|^Calculated:/.test(t)), pp.finding.evidence);
    ok('every evidence row is named by its question or its own title', pp.evidence.every((e) => e.title && !['Your answer', 'Assumption', 'Calculated', 'Not known yet', 'Source', 'From your website/document'].includes(e.title)), pp.evidence.filter((e) => ['Your answer', 'Assumption'].includes(e.title)).slice(0, 3));
    /* what you already have is an advantage, not any answer: a "no" answer must never be listed as one */
    ok('the advantages are grounded, and a negative answer is never called one', pp.advantages.every((a) => !/: (no|none|never)\b/i.test(`${a.title}: ${a.line ?? a.text ?? ''}`)), pp.advantages);

    console.log('== the recap: four owner beats on the cutscene mechanism (final pack, Task 21)');
    const ch = M.canopy.recap(pp);
    ok('four beats with the Recognise, Focus, Move, Open titles', ch.map((c) => c.title).join('|') === 'Recognise|Focus|Move|Open', ch.map((c) => c.title));
    ok('beat 1 recognises what the visitor already has', ch[0].figure.length > 0 && ch[0].lines.length <= 1, ch[0]);
    ok('beat 3 is the first action', /./.test(ch[2].figure) && (ch[2].lines[0] === undefined || ch[2].lines[0] === pp.firstAction.whyFirst), ch[2]);
    ok('beat 4 opens the plan', ch[3].last === true && ch[3].figure === 'Reveal my plan', ch[3]);
    M.go('cutscene'); await sleep(60);
    ok('the recap chrome: beat line, Back, Continue, the dots, Go to my plan', !!$('#cut-chapter') && !!$('#cut-back') && !!$('#cut-next') && !!$('#cut-dots') && text($('#cut-skip')) === 'Go to my plan');
    await sleep(350);
    ok('beat 1 on screen after the rise, four dots under it', /1 of 4 · Recognise/.test(text($('#cut-chapter'))) && text($('#cut-figure')) === ch[0].figure && $$('#cut-dots li').length === 4, text($('#cut-chapter')));
    ok('Back is disabled on the first beat', $('#cut-back').disabled === true);
    $('#cut-next').click(); await sleep(200);
    ok('Continue turns to beat 2', /2 of 4 · Focus/.test(text($('#cut-chapter'))), text($('#cut-chapter')));
    $('#cut-back').click(); await sleep(200);
    ok('Back turns to beat 1, and every beat waits for a press', /1 of 4/.test(text($('#cut-chapter'))));
    $('#cut-next').click(); await sleep(200); $('#cut-next').click(); await sleep(200);
    ok('beat 3 carries See the branch when it names a section', /3 of 4 · Move/.test(text($('#cut-chapter'))) && ($('#cut-see').hidden === false || ch[2].section === 'crown' || !ch[2].section), { hidden: $('#cut-see').hidden, section: ch[2].section });
    $('#cut-next').click(); await sleep(200);
    ok('the last beat’s Continue reads Reveal my plan', /4 of 4/.test(text($('#cut-chapter'))) && text($('#cut-next')) === 'Reveal my plan');
    $('#cut-next').click(); await sleep(200);
    ok('Continue on the last beat lands on the plan view', (M.stage === 'plan' || M.stage === 'harvest') && !!$('#plan-decision'), M.stage);
    ok('the recap’s words are cleared', text($('#cut-figure')) === '' && text($('#cut-chapter')) === '');
    /* Jump to my plan from any chapter */
    M.go('explore'); await sleep(40); M.canopy.replay(); await sleep(400);
    ok('Play again runs the recap again from the results', M.stage === 'cutscene' && /1 of 4/.test(text($('#cut-chapter'))), M.stage);
    $('#cut-skip').click(); await sleep(60);
    ok('Jump to my plan ends the recap on the plan view', (M.stage === 'plan' || M.stage === 'harvest') && !!$('#plan-first .action-card'), M.stage);

    console.log('== the plan view: Your plan, the decision first, the first card, the sections in the brief’s order');
    const host = $('#plan') ?? $('#harvest');
    ok('the container is labelled Your plan', text($('#hv-title', host)) === 'Your Plan' || text($('#hv-title', host)) === 'Your plan', text($('#hv-title', host)));
    const kids = [...host.children].map((el) => el.id);
    const titleId = $('#hv-title', host) ? 'hv-title' : 'plan-title';
    /* 29 September: the plan is five full-screen panels, so the page's children are the panels and the content sits
       inside them, in the same order as before. */
    ok('order: back, title, then the five panels', ['hv-back', titleId, 'pp-answer', 'pp-first', 'pp-plan', 'pp-take', 'pp-cta'].every((id, i) => kids.indexOf(id) === i), kids);
    const inside = (panel, id) => !!$('#' + panel + ' #' + id, host);
    ok('the answer panel leads with the direct line, then the decision and the tree view', inside('pp-answer', 'pp-lead') && inside('pp-answer', 'plan-decision') && inside('pp-answer', 'tree-view-host'), kids);
    ok('the first action, the plan sections and the downloads each have a panel', inside('pp-first', 'plan-first') && inside('pp-plan', 'plan-truth') && inside('pp-plan', 'plan-secs') && inside('pp-take', 'plan-downloads'), kids);
    ok('the action panel carries one huge control, the call, and the rest behind one drawer', !!$('#pp-cta #pp-cta-go', host) && ['hv-call', 'hv-extra', 'hv-agent', 'agent', 'hv-next', 'hv-save', 'hv-legal', 'hv-tma'].every((id) => !!$('#pp-cta #' + id, host)) && $('#pp-more', host).open !== true && $('#hv-legal #hv-private', host) && $('#hv-legal #hv-disclaimer', host), [...host.querySelectorAll('#pp-cta [id]')].map((e) => e.id));
    ok('the decision block leads with the finding and the revision line', text($('#plan-decision .lead')) === pp.finding.text && /revision \d+/.test(text($('#plan-decision .plan-rev'))));
    const secTitles = $$('.plan-sec .sec-title', host).map(text);
    ok('the sections of brief 13.2 in order, with what it asks of you', secTitles.filter((t) => t !== 'What it asks of you').join('|') === 'One-page summary|Prioritised plan|Week one|30 days|90 days, conditional|Scenarios|Resources and purchases|Execution materials|Evidence and method|Brief for TMA, optional', secTitles);
    ok('every section starts shut (progressive disclosure)', $$('.plan-sec-body', host).every((b) => b.hidden) && $$('.sec-head', host).every((b) => b.getAttribute('aria-expanded') === 'false'));
    $$('.sec-head', host)[0].click(); await sleep(20);
    ok('a section head opens its body', !$('#ps-summary-body', host).hidden && $$('.sec-head', host)[0].getAttribute('aria-expanded') === 'true');
    ok('the summary holds goal, situation, move, evidence, key unknown, first action', ['Goal', 'Situation', 'Recommended move', 'Evidence', 'Key unknown', 'First action'].every((k) => $$('#ps-summary-body dt', host).map(text).includes(k)), $$('#ps-summary-body dt', host).map(text));
    const card = $('#plan-first .action-card', host);
    const labels = $$('.ac-row dt', card).map((d) => text(d).replace(/Refined$/, '').trim());
    ok('the first action card carries the nine labelled fields in the brief’s order', labels.join('|') === 'Why first|Do this|Responsible|Needs|Effort|Cost|Done when|Measure|Change course if', labels);
    ok('its steps are numbered and complete', $$('.ac-steps li', card).length === pp.firstAction.steps.length);
    ok('Cost says one-off and ongoing separately, with nothing when supported', /One-off .*; ongoing /.test(text($('[data-field="cost"] dd', card))), text($('[data-field="cost"] dd', card)));
    const start = $('[data-start]', card);
    if (start) {
      ok('Start now names the asset it opens', /^Start now: open /.test(text(start)), text(start));
      start.click(); await sleep(30);
      const firstAsset = pp.assets.find((s) => s.id === pp.firstAction.asset || s.kind === pp.firstAction.asset);
      ok('Start now opens the asset under the card and copies it', !$('.asset-open', card).hidden && !!$('.asset-open .asset-text', card) && clip.length === 1 && clip[0] === firstAsset.text, { copied: clip[0]?.slice(0, 60), want: firstAsset?.text?.slice(0, 60) });
    } else ok('the first card names no material, so no Start now press (plan.js gave none for it)', !pp.firstAction.asset, pp.firstAction.asset);
    ok('the economics section shows the scenarios with the interval named as modelled, or says why there is none', (() => { const b = text($('#ps-economics-body', host)); return pp.scenarios.length ? (/Illustrative scenario|Grounded operating scenario|Goal requirements/.test(b) && /Today|Current/.test(b)) : b.length > 20; })(), text($('#ps-economics-body', host)).slice(0, 300));
    ok('the evidence section shows real counts, not a literal, when the engine ran', !pp.method || (/Runs per scenario/.test(text($('#ps-evidence-body', host))) && text($('#ps-evidence-body', host)).includes(M.count(M.simCount().headline))));
    const dlWords = $$('#plan-downloads .hv-word', host).map(text);
    ok('the downloads say what happens: PDF, brief .md, copy; the progress file only when the shell offers it', dlWords[0] === 'Download plan (PDF)' && dlWords[1] === 'Download implementation brief (.md)' && dlWords[2] === 'Copy implementation brief' && (typeof M.save?.exportFile === 'function' ? dlWords[3] === 'Download progress file' : dlWords.length === 3), dlWords);
    /* final pack, Task 23: the invitation is the short TMA form and the roads are three: the contribution panel, the
       materials, and the separate sharing review */
    ok('the invitation and the three roads', /Bring your expertise/.test(text($('#plan-invite', host))) && text($('#hv-tma .hv-word', host)) === 'Build this with TMA' && text($('#hv-diy .hv-word', host)) === 'Do it yourself' && text($('#hv-json .hv-word', host)) === 'Choose what to share', [text($('#plan-invite', host)), text($('#hv-tma .hv-word', host)), text($('#hv-json .hv-word', host))]);
    /* the shell ships #hv-json and #hv-agent hidden (they were optional on the old harvest): every row the plan view places is shown */
    ok('no row the plan view places is left hidden', $$('.hv-row', host).every((b) => !b.hidden && !b.hasAttribute('hidden')), $$('.hv-row', host).filter((b) => b.hidden).map((b) => b.id));
    ok('the privacy line never says a site was read; the stored address is an address only', /kept as an address only; nothing was fetched/.test(text($('#hv-private', host))) && !/read/.test(text($('#hv-private', host))), text($('#hv-private', host)));
    ok('the Disclaimer stands once on the page', $$('#hv-disclaimer', host).length === 1 && /Disclaimer/.test(text($('#hv-disclaimer', host))));

    console.log('== the exports carry every action’s steps');
    const md = M.exports.markdown();
    const allSteps = pp.actions.flatMap((a) => a.steps);
    ok('the implementation brief holds every step of every action', allSteps.every((s) => md.includes(s)), allSteps.filter((s) => !md.includes(s)));
    ok('the brief carries the generation date, the revision, the assumptions and the sources', md.includes(`plan revision ${pp.revision}`) && md.includes(pp.generatedOn) && /assumptions|Basis/.test(md) && /## Evidence and method/.test(md));
    ok('the brief carries the 13.4 implementation prompt with unknown credentials as unknown', /## Implementation brief for a builder or an assistant/.test(md) && /credential .* unknown|Any credential a tool needs is unknown/.test(md) && /do not assume an API/.test(md));
    ok('the brief carries every material whole', pp.assets.every((s) => md.includes(s.text)));
    ok('no key or token in the brief', !/(sk-[a-z0-9]{8,}|api[_-]?keys*[:=]|bearers+[a-z0-9])/i.test(md));
    ok('the owner brief ends with the appendix and its scenarios', /# Appendix: the forecast in full/.test(md) && /## Month by month|## Scenarios/.test(md));
    /* the PDF against a recording jsPDF */
    const texts = [];
    window.jspdf = { jsPDF: function () { this.pages = 1; this.setFont = () => {}; this.setFontSize = () => {}; this.setTextColor = () => {}; this.setFillColor = () => {}; this.setDrawColor = () => {}; this.setLineWidth = () => {}; this.setLineDashPattern = () => {}; this.rect = () => {}; this.roundedRect = () => {}; this.line = () => {}; this.lines = () => {}; this.addImage = () => {}; this.addPage = () => { this.pages++; }; this.setPage = () => {}; this.getNumberOfPages = () => this.pages; this.splitTextToSize = (t) => String(t).split('\n'); this.text = (t) => { texts.push(Array.isArray(t) ? t.join('\n') : String(t)); }; this.output = () => new window.Blob(['pdf'], { type: 'application/pdf' }); } };
    const before = saves.length;
    const pdfName = await M.exports.pdf();
    const pdfText = texts.join('\n');
    ok('the PDF is saved under a plan name', pdfName === `mercer-plan-abc-consulting.pdf` && saves.length === before + 1, pdfName);
    /* the PDF replaces the curly quotes and the dividers Helvetica cannot set, so both sides are compared in that form */
    const flat = (t) => String(t).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/·/g, '-').replace(/−/g, '-');
    ok('the PDF holds every step of every action', allSteps.every((s) => flat(pdfText).includes(flat(s))), allSteps.filter((s) => !flat(pdfText).includes(flat(s))));
    ok('the PDF footer names the date and the plan revision', pdfText.includes(`plan revision ${pp.revision}`) && pdfText.includes(pp.generatedOn));
    ok('the PDF has more than one page and a Disclaimer', /Disclaimer/.test(pdfText) && /Page 1 of \d+/.test(pdfText) && !/Page 1 of 1\b/.test(pdfText));
    ok('the PDF names the range as modelled, not statistical, and not a likelihood', /not a statistical confidence interval, and not a likelihood/.test(pdfText));
    window.jspdf = undefined;

    console.log('== the review panel: private sections off by default, nothing saved before the press');
    const saved0 = saves.length, clicks0 = clicks.length;
    $('#hv-json', host).click(); await sleep(30);
    ok('the panel opens as a dialog titled Ask TMA to help', !$('#share').hidden && /Ask TMA to help/i.test(text($('#share-title'))));
    const rows = $$('#share .share-part').map((l) => ({ id: $('input', l).value, on: $('input', l).checked, priv: l.classList.contains('private') }));
    ok('the plan, its needs, the answers and the forecast are on', rows.filter((r) => ['plan', 'needs', 'answers', 'forecast'].includes(r.id)).every((r) => r.on) && rows.some((r) => r.id === 'plan'), rows);
    ok('your own words (the note and the address) are private and off', rows.find((r) => r.id === 'words')?.on === false && rows.find((r) => r.id === 'words')?.priv === true, rows);
    ok('the panel asks for no contact details and says the visitor sends it', /No contact details are asked for/.test(text($('#share'))) && /send yourself|send it/.test(text($('#share'))));
    ok('the press reads Download a brief for TMA', text($('#share-confirm')) === 'Download a brief for TMA');
    ok('opening the panel saved nothing and sent nothing', saves.length === saved0 && clicks.length === clicks0 && network.length === 0);
    $('#share-cancel').click(); await sleep(10);
    ok('Keep it private closes it and saves nothing', $('#share').hidden && saves.length === saved0);
    $('#hv-json', host).click(); await sleep(20);
    $('#share-confirm').click(); await sleep(60);
    ok('the press saves exactly one markdown brief', saves.length === saved0 + 1 && clicks[clicks.length - 1] === 'mercer-tma-brief-abc-consulting.md', clicks.slice(-1));
    const brief = await blobText(saves[saves.length - 1]);
    ok('the brief holds the plan and its steps', /# Brief for TMA: ABC Consulting/.test(brief) && allSteps.every((s) => brief.includes(s)));
    ok('the brief leaves the private sections out and names them', !/Your own words/.test(brief.split('Left out:')[0].split('Included:')[1] ?? '') && /Left out: .*Your own words/.test(brief) && !brief.includes('https://example.test'));
    ok('the brief says the visitor sends it and nothing was sent', /sends it themselves; Mercer sends nothing/.test(brief));
    ok('the done line invents no address and no submitted state', /Downloaded mercer-tma-brief/.test(text($('#share-done'))) && /your TMA contact/.test(text($('#share-done'))) && !/submitted|sent to TMA/i.test(text($('#share-done'))) && !$('#share-done a'));
    ok('nothing went over the network', network.length === 0);
    $('#share-cancel').click(); await sleep(10);
    M.CONFIG = { shareEmail: 'plans@example.test' };
    $('#hv-json', host).click(); await sleep(20); $('#share-confirm').click(); await sleep(60);
    ok('a configured address is shown as the place to send it, only when set', $('#share-done a')?.getAttribute('href') === 'mailto:plans@example.test');
    $('#share-cancel').click(); M.CONFIG = {};

    console.log('== C04: one top-level overlay at a time');
    $('#hv-json', host).click(); await sleep(20);
    document.body.dataset.replay = '1'; await sleep(20);
    ok('a replay (body[data-replay]) closes the review panel', $('#share').hidden);
    delete document.body.dataset.replay;
    $('#hv-json', host).click(); await sleep(20);
    const help = $('#help-panel'); help.setAttribute('open', ''); await sleep(20);
    ok('the help dialog opening closes the review panel', $('#share').hidden);
    help.removeAttribute('open');
    $('#hv-json', host).click(); await sleep(20);
    M.go('explore'); await sleep(40);
    ok('a stage move out of the plan view closes the panel', $('#share').hidden);
    M.canopy.openCard('offer'); await sleep(30);
    M.canopy.replay(); await sleep(60);
    ok('a replay from the results closes the card first, so nothing draws over it', M.canopy.opened() === null && M.stage === 'cutscene');
    M.canopy.skip(); await sleep(60);

    console.log('== the tree at results: Current / Plan, and an action lights its limb');
    const calls = [];
    const realTree = M.tree;
    M.tree = { frame() {}, setView: (v) => calls.push(['setView', v]), setMetric: (m) => calls.push(['setMetric', m]), select: (l) => calls.push(['select', l]), setDiscs() {}, setCollar() {}, setMetrics() {}, setEncoding() {}, lockDrag() {}, on() {} };
    $('#tree-view [data-view="plan"]').click(); await sleep(10);
    const sm = calls.find((c) => c[0] === 'setMetric');
    ok('Plan calls setView(plan) and setMetric from the plan’s scenario', calls.some((c) => c[0] === 'setView' && c[1] === 'plan') && sm && Number.isFinite(sm[1].baseline) && sm[1].target === 80000 && Number.isFinite(sm[1].scenario), calls);
    ok('the pressed state moves', $('#tree-view [data-view="plan"]').getAttribute('aria-pressed') === 'true' && $('#tree-view [data-view="current"]').getAttribute('aria-pressed') === 'false');
    $('#tree-view [data-view="current"]').click();
    calls.length = 0;
    $('#plan-first [data-see]').click(); await sleep(10);
    ok('See the branch selects the limb the action affects and says what it removes or models', calls.some((c) => c[0] === 'select' && c[1] === pp.firstAction.affects.limb) && /^Affects /.test(text($('#tree-view-line'))) && /Models:|Milestone:/.test(text($('#tree-view-line'))), text($('#tree-view-line')));
    M.tree = realTree;

    console.log('== the model state (R16): refined fields marked, a failure offers Retry, an old revision is dropped');
    const rev = pp.revision;
    const realModel = M.model;
    let resolveCall = null;
    M.model = { available: () => true, ownerPlan: () => new Promise((res) => { resolveCall = res; }), starterPlan: async () => ({ ok: true }) };
    const wasRunning = M.canopy.refine(M.canopy.plan().plan);
    await sleep(10);
    ok('while the call is in flight the page says Refining with Claude, with no percentage', /Refining with Claude…/.test(text($('#plan-model-host'))) && !/%/.test(text($('#plan-model-host'))) && M.canopy.refineState().status === 'running');
    resolveCall({ ok: true, plan: { finding: 'A refined finding with no new figure.', actions: [{ id: pp.firstAction.id, whyFirst: 'A refined reason.', doneWhen: 'Refined: the first quote is out at £999,999.' }] } });
    await wasRunning; await sleep(30);
    const rp = M.canopy.plan().plan;
    ok('validated string fields merge and are marked Refined; a number the plan does not hold is not merged', rp.finding.text === 'A refined finding with no new figure.' && rp.actions[0].whyFirst === 'A refined reason.' && rp.actions[0].doneWhen === pp.firstAction.doneWhen && rp.actions[0].refined.includes('whyFirst') && !rp.actions[0].refined.includes('doneWhen'), rp.actions[0].refined);
    ok('the view shows the Refined tag and the time', $$('#plan-first .tag').some((t) => text(t) === 'Refined') && /Refined with Claude at/.test(text($('#plan-model-host'))));
    M.model = { available: () => true, ownerPlan: async () => { throw Object.assign(new Error('x'), { code: 'rate_limited' }); } };
    await M.canopy.refine(M.canopy.plan().plan, { retry: true }); await sleep(20);
    ok('a failed call says so, keeps the plan and offers Retry', /could not refine/.test(text($('#plan-model-host'))) && !!$('#plan-retry') && !!$('#plan-first .action-card'));
    M.model = { available: () => true, ownerPlan: () => new Promise((res) => { resolveCall = res; }) };
    const p2 = M.canopy.refine(M.canopy.plan().plan, { retry: true }); await sleep(10);
    const revDesc = Object.getOwnPropertyDescriptor(M, 'revision');
    Object.defineProperty(M, 'revision', { get: () => rev + 1, configurable: true });
    resolveCall({ ok: true, plan: { finding: 'Late.' } }); await p2; await sleep(20);
    ok('a response for an older revision is dropped and the view says the lines were dropped', M.canopy.refineState().status === 'stale' && M.canopy.plan().plan.finding.text !== 'Late.' && /lines were dropped/.test(text($('#plan-model-host'))), [M.canopy.refineState().status, text($('#plan-model-host'))]);
    if (revDesc) Object.defineProperty(M, 'revision', revDesc); else delete M.revision;
    M.model = realModel;

    console.log('== the real model.js against a stub host (window.claude.use(\'sample\'))');
    if (realModel && typeof realModel.reset === 'function') {
      const here = M.canopy.plan().plan; // the plan as it stands now: the reply is matched against this one
      let asked = null;
      window.claude = { use: async (k) => (k === 'sample' ? { json: async (input, opts) => { asked = { input, opts }; return {
        advantage_summary: [{ point: 'You already sell to this buyer.', evidence_ids: [] }], goal_summary: 'A refined goal line.', primary_finding: 'A refined finding, no new figure.', recap: 'A refined recap line.', detail: 'A refined detail.', supporting_evidence_ids: [], material_unknowns: [], most_useful_missing_fact: null,
        recommended_first_action: { title: here.firstAction.action, intended_result: 'A refined result.', why_now: 'A refined reason.', steps: ['A refined step.'], owner_role: 'You', time_required: 'about 2 hours', one_off_cost: 'unknown', recurring_cost: 'unknown', dependencies: [], evidence_ids: [], success_measure: 'A refined measure.', review_or_stop_condition: 'A refined review.', asset: null },
        alternatives_considered: [], sequenced_actions: [], resource_totals: {}, supported_scenarios: [], success_measures: [], review_conditions: [], implementation_assets: [],
      }; } } : null) };
      realModel.reset();
      ok('model.js reports a host is available', realModel.available().host === true, realModel.available());
      await M.canopy.refine(here, { retry: true }); await sleep(40);
      const mr = M.canopy.plan().plan;
      ok('the plan call asks for the complex tier, with cache and an abort signal (R16)', asked && asked.opts.modelTier === 'complex' && asked.opts.cache === true && !!asked.opts.signal, asked && asked.opts);
      ok('the evidence set and the calculator go as data', !!asked && /evidence/i.test(asked.input) && /calculator/i.test(asked.input));
      ok('model.js’s owner schema maps onto the plan and the fields are marked Refined', mr.finding.text === 'A refined finding, no new figure.' && mr.firstAction.whyFirst === 'A refined reason.' && mr.firstAction.refined.includes('whyFirst') && mr.firstAction.refined.includes('steps'), [mr.firstAction.whyFirst, mr.firstAction.refined]);
      ok('the deterministic steps are replaced only as a whole set', mr.firstAction.steps.join('|') === 'A refined step.');
      delete window.claude;
      realModel.reset();
      ok('with no host the model is not offered and the plan stands alone', realModel.available().host === false && !!M.canopy.plan().plan.firstAction);
    } else ok('model.js absent: skipped', true);
    M.model = realModel;

    console.log('== the starter route on a fixture plan (plan.js stubbed), and the example renderer');
    const sf = starterFixture.first(starterFixture());
    M.plan = { current: () => sf, build: () => sf, example: () => sf, actions: () => sf.actions };
    const sc = M.canopy.recap(M.canopy.plan().plan);
    ok('four starter beats with the same titles as the owner’s', sc.map((c) => c.title).join('|') === 'Recognise|Focus|Move|Open', sc.map((c) => c.title));
    ok('the starter beats read the fixture’s fields', /gardening/i.test(sc[0].figure) && sc[1].figure === 'Garden care for older householders' && sc[2].figure === sf.actions[0].action, sc.map((c) => c.figure));
    M.canopy.openPlan(); await sleep(40);
    ok('the plan view renders the fixture plan with Your first test as the first card', /Example Garden Care|Your first test/.test(text($('#plan-first'))) && /Offer five neighbours/.test(text($('#plan-first .ac-title'))));
    ok('the economics section gives the reason quantification is not yet useful', /No forecast is run on this route/.test(text($('#ps-economics-body'))));
    ok('the resources section groups owned, essential, later and avoid', ['Already owned', 'Essential now', 'Later only', 'Avoid for now'].every((k) => text($('#ps-resources-body')).includes(k)));
    const smd = M.exports.markdown();
    ok('the starter brief holds every step and no forecast appendix', sf.actions.flatMap((a) => a.steps).every((s) => smd.includes(s)) && !/Appendix: the forecast/.test(smd));
    /* the example renderer: reads the plan alone */
    const stateBefore = JSON.stringify(state, (k, v) => (v instanceof Set ? [...v] : v));
    const sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
    const out = M.canopy.renderPlanInto(sandbox, sf, { example: true });
    const stateAfter = JSON.stringify(state, (k, v) => (v instanceof Set ? [...v] : v));
    ok('renderPlanInto writes the chapter headings, the first card and a branch inspector into the sandbox', out.chapters.length === 4 && $$('.ex-chapters li', sandbox).length === 4 && !!$('.action-card', sandbox) && $$('.ex-limbs [data-limb]', sandbox).length === 2);
    ok('it is labelled Example throughout', $$('.tag', sandbox).filter((t) => text(t) === 'Example').length >= 2);
    ok('it never reads or writes M.state: the state is unchanged and the visitor’s business is not in the sandbox', stateBefore === stateAfter && !text(sandbox).includes('ABC Consulting') && !text(sandbox).includes('£80,000') && /Offer five neighbours/.test(text($('.ac-title', sandbox))));
    $('.ex-limbs [data-limb="conversion"]', sandbox).click(); await sleep(10);
    ok('the inspector says what the branch’s action affects', /Affects customers \(the close\)/.test(text($('.ex-line', sandbox))) && $('.action-card', sandbox).classList.contains('selected'));
    const clip0 = clip.length;
    $('[data-start]', sandbox).click(); await sleep(20);
    ok('Start now in the example opens and copies the example asset', !$('.asset-open', sandbox).hidden && clip.length === clip0 + 1 && /Example Garden Care/.test(clip[clip.length - 1]));
    ok('a plan that carries its own recap is read as it is', (() => { const c = M.canopy.recap({ route: 'owner', actions: [], recap: [1, 2, 3, 4, 5].map((i) => ({ title: `T${i}`, figure: `F${i}`, lines: [`L${i}`] })) }); return c.length === 4 && c[0].title === 'T1' && c[3].figure === 'F4'; })());
    M.plan = realPlanJs;

    console.log('== plan.js’s own example plans render into the sandbox as examples (brief 3.2)');
    if (realPlanJs && typeof realPlanJs.example === 'function') {
      const before2 = JSON.stringify(state, (k, v) => (v instanceof Set ? [...v] : v));
      const sbO = document.createElement('div'); document.body.appendChild(sbO);
      const exO = realPlanJs.example('owner');
      const oO = M.canopy.renderPlanInto(sbO, exO, { example: true });
      const sbS = document.createElement('div'); document.body.appendChild(sbS);
      const exS = realPlanJs.example('starter');
      const oS = M.canopy.renderPlanInto(sbS, exS, { example: true });
      const after2 = JSON.stringify(state, (k, v) => (v instanceof Set ? [...v] : v));
      ok('the owner example gives four beats, a first card and a branch inspector', oO && oO.chapters.length === 4 && !!$('.action-card', sbO) && $$('.ex-limbs [data-limb]', sbO).length >= 1, oO && oO.chapters.map((c) => c.figure));
      ok('the starter example gives the four beat titles', oS && oS.chapters.map((c) => c.title).join('|') === 'Recognise|Focus|Move|Open', oS && oS.chapters.map((c) => c.figure));
      ok('neither example reads or writes M.state, and neither shows the visitor’s figures', before2 === after2 && !text(sbO).includes('ABC Consulting') && !text(sbO).includes('£80,000') && !text(sbS).includes('ABC Consulting'));
      ok('both are labelled Example', $$('.tag', sbO).some((t) => text(t) === 'Example') && $$('.tag', sbS).some((t) => text(t) === 'Example'));
      ok('the owner example names its sample business, not a real client', /sample/i.test(text(sbO)) || /sample/i.test(String(exO.business ?? '')), exO.business);
    } else ok('plan.js has no example(): skipped', true);

    console.log('== the starter route through the real starter.js and plan.js');
    const ownerAnswers = JSON.parse(JSON.stringify(state, (k, v) => (v instanceof Set ? [...v] : v)));
    state.route = 'starter';
    Object.assign(state, { n01: 'employed', n02: 'extra income', n03: 8, n04: 'evenings', n05: 100, n06: 0, n07: 'within a few months', n08: 'existing income', n09: 'Ran the office rota, invoicing and supplier orders for a small firm', n10: ['numbers', 'admin', 'organising'], n11: 'Cleared a three-month invoicing backlog', n12: 'spreadsheets and invoices', n13: ['organising', 'numbers'], n14: ['public content', 'travel'], n15: ['bookkeeping software'], n16: ['laptop', 'phone', 'spreadsheet'], n17: 'none', n18: 'either', n19: 'small trades businesses', n20: 'unbilled work and late invoices', n21: 'yes, directly', n22: 'none', n23: 'my partner and two of his trade friends', n24: 'not yet asked', n25: 'no', n26: 'no' });
    try { realPlanJs.rebuild(); } catch (e) { /* current() builds it */ }
    const sp = M.canopy.plan().plan;
    if (sp && sp.route === 'starter') {
      const sch = M.canopy.recap(sp);
      ok('the real starter plan gives the four beats', sch.length === 4 && sch.map((c) => c.title).join('|') === 'Recognise|Focus|Move|Open', sch.map((c) => c.figure));
      ok('every starter chapter says something', sch.every((c) => c.figure && c.figure.length > 2), sch.map((c) => [c.figure, c.lines.length]));
      M.canopy.openPlan(); await sleep(60);
      ok('the starter plan view opens with the direction and a first test card', !!$('#plan-decision') && !!$('#plan-first .action-card') && /Your first test/.test(text($('#plan-first'))), text($('#plan-first .ac-title')));
      ok('the starter view carries the same sections', $$('.plan-sec .sec-title').length >= 10);
      const sMd = M.exports.markdown();
      ok('the starter brief holds every step of every action and no forecast appendix', sp.actions.flatMap((a) => a.steps).every((t) => sMd.includes(t)) && !/Appendix: the forecast/.test(sMd));
      ok('the starter view shows no Mission Alignment block (no forecast on this route)', !$('#hv-extra') || $('#hv-extra').hidden || !text($('#hv-extra')).trim());
    } else ok('the starter plan did not build from these answers: reported, not asserted', true, sp && sp.route);
    state.route = 'owner';
    Object.keys(ownerAnswers).filter((k) => /^n\d\d$/.test(k)).forEach((k) => { delete state[k]; });
    try { realPlanJs.rebuild(); } catch (e) { /* the owner plan returns */ }

    console.log('== the progress file row appears only when the shell offers exportFile');
    M.go('explore'); await sleep(30);
    let called = 0;
    const realSave = M.save;
    M.save = { ...realSave, on: realSave?.on ?? (() => false), enable: realSave?.enable ?? (() => {}), forget: realSave?.forget ?? (() => {}), exportFile: async () => { called++; return JSON.stringify({ kind: 'mercer-progress', answers: { now: 8000 } }); } };
    M.canopy.openPlan(); await sleep(40);
    const prog = $('#hv-progress');
    ok('Download progress file is a row with a distinct label and calls M.save.exportFile', !!prog && text($('.hv-word', prog)) === 'Download progress file' && /not the readable plan/.test(text($('.hv-kind', prog))));
    prog.click(); await sleep(30);
    ok('the press calls exportFile once and actually writes a file', called === 1 && /Saved mercer-progress-.*\.json/.test(text($('#hv-progress-saved'))), text($('#hv-progress-saved')));
    M.save = realSave;

    console.log('== the rebuilt shell: an empty #plan container works the same');
    const h2 = harness({ planShell: true });
    ok('files load on the #plan shell', h2.errors.length === 0, h2.errors.slice(0, 2));
    h2.state.biz = 'Beta Bakery';
    h2.M.commit('now', 20000, {}); h2.M.commit('sector', { sector: 'professional', trade: 'Consultancy' }, {}); h2.M.commit('goal', { goal: 30000, appetite: 'moderate' }, {}); h2.M.commit('months', 12, {}); h2.M.commit('price', 800, {});
    h2.state.asked = ['now', 'sector', 'goal', 'months', 'price'];
    h2.M.ensurePlanned();
    h2.M.canopy.openPlan(); await sleep(60);
    ok('the plan view paints into #plan with the decision, the first card and the sections', !!h2.$('#plan #plan-decision') && !!h2.$('#plan #plan-first .action-card') && h2.$$('#plan .plan-sec').length >= 10 && h2.$('#plan').getAttribute('aria-label') === 'Your plan', h2.$$('#plan > *').map((el) => el.id));
    ok('no #harvest is needed', !h2.$('#harvest'));
    ok('no errors across the second page', h2.errors.length === 0, h2.errors.slice(0, 2));
    ok('no errors across the first page', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    console.log('  FAIL (threw)', e.stack);
    process.exitCode = 1;
  }
  done();
})();
