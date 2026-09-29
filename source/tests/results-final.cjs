/* Final-pack checks for canopy.js and results.css (results owner). Run: node tests/results-final.cjs
   jsdom (../labtest/node_modules), the real engine, the real app.js, the real index.html, econ.js when it exists.
   Covers Tasks 19 to 23, Task 31's labels and Task 34's interface integration:
   the toolbar present on the first generated view and through the recap; the recap's four beats advancing only on a press;
   one expanded panel at a time with a visible Whole tree reset; the mode label beside every figure; no probability sentence
   anywhere the visitor reads; the finding as label, action, expected change and evidence; TMA's split and its booking. */
const path = require('path');
const harness = require('./results-harness.cjs');
const ROOT = path.resolve(__dirname, '..');

/* a starter fixture in the R17 shape, so the starter beats and the milestone path are exercised without starter.js */
const starterFixture = () => ({
  id: 'plan-final-starter', route: 'starter', revision: 3, generatedOn: '25 September 2026', status: 'deterministic', business: 'Example Garden Care', currency: 'GBP',
  goal: { text: 'A first paying customer', when: 'November 2026', protected: [] },
  foundations: { skills: ['Ten years of gardening'], access: ['Neighbours who already ask for help'], time: '12 hours a week', resources: ['A van'] },
  direction: { title: 'Garden care for older householders', buyer: 'older householders within three miles', problem: 'keep a garden they can no longer manage', offer: 'a fortnightly visit at a fixed price' },
  toProve: [{ title: 'Whether five householders will pay a fixed monthly price', why: 'nobody has paid yet' }],
  situation: 'No business yet; twelve hours a week and a van.',
  finding: { short: 'Garden care for older householders', text: 'The strongest direction from what you have told us.', section: 'offer', limb: 'pricing', evidence: ['Skills: ten years of gardening'] },
  keyUnknown: 'Whether five householders will pay',
  unknowns: [{ id: 'price', title: 'What the visit should cost' }],
  actions: [
    { id: 'test-1', action: 'Offer five neighbours a fortnightly visit at a fixed price', rank: 1, status: 'primary', whyFirst: 'Five paying customers prove the demand before anything is bought.', steps: ['Write the offer on one page with the price.'], responsible: 'You', needs: [], effort: '4 hours', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'Five householders have said yes or no.', measure: 'Yeses out of five.', changeCourseIf: 'Fewer than two say yes.', affects: { limb: 'conversion', section: 'close', dependency: '', outcome: '', milestone: 'five answers' } },
    { id: 'test-2', action: 'Set the price from the first five answers', rank: 2, status: 'primary', steps: ['Compare what the five said against the hours each visit takes.'], responsible: 'You', needs: [], effort: '1 hour', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'A price is written down.', measure: 'Margin on the first month.', changeCourseIf: 'The visits take twice the hours.', affects: { limb: 'pricing', section: 'offer', dependency: '', outcome: '', milestone: 'a price written down' } },
    { id: 'test-3', action: 'Ask two neighbours for an introduction', rank: 3, status: 'next', steps: ['Ask the two who already asked for help.'], responsible: 'You', needs: [], effort: '1 hour', cost: { oneOff: 0, recurring: 0 }, doneWhen: 'Two introductions asked for.', measure: 'Introductions made.', changeCourseIf: 'Neither replies.', affects: { limb: 'demand', section: 'routes', dependency: '', outcome: '', milestone: 'two asks made' } },
  ],
  primaries: ['test-1', 'test-2'], waits: [], weekOne: [], thirtyDays: [], ninetyDays: null,
  scenarios: [], economics: [], notUseful: 'No revenue model is supported yet: five answers are the test.',
  assets: [], sources: [], evidence: [], method: null, tmaBrief: { summary: 'A garden-care direction to test with five neighbours.', needs: ['An offer sheet'] },
});
starterFixture.first = (p) => { p.firstAction = p.actions[0]; return p; };

/* every phrase that would claim a likelihood. None of these may appear in anything the visitor reads (D3, Task 31).
   The page's own denials ("No probability of reaching the target is claimed") are removed before the test, because saying
   a claim is not made is the opposite of making it. */
const PROBABILITY = /\b\d+\s+in\s+\d+\s+runs?\b|\b1\s+run\s+in\s+\d+\b|in half of[^.]*runs|runs reach|chance of (?:reaching|hitting)|probability of|% likely|odds of/i;
const noDenials = (t) => String(t ?? '').replace(/No probability of reaching the target is claimed\.?/gi, '').replace(/Do not display a probability[^.]*\./gi, '');
const claimsOdds = (t) => PROBABILITY.test(noDenials(t));

(async () => {
  const h = harness();
  const { M, state, ok, done, $, $$, text, errors, sleep, document, window, src, clicks, saves } = h;
  const fire = (stage) => { document.body.dataset.stage = stage; document.dispatchEvent(new window.CustomEvent('mercer:stage', { detail: { stage, section: null } })); };
  try {
    ok('files loaded without throwing', errors.length === 0, errors.slice(0, 3));

    console.log('== copy rules (D15) over both files');
    const cj = src('canopy.js'), rc = src('results.css');
    ok('no em or en dash in canopy.js or results.css', !/[—–]/.test(cj.replace('String.fromCharCode(8212, 8211)', '')) && !/[—–]/.test(rc));
    ok('"Continue" is the control word, never "Next"', !/>Next</.test(cj) && /id="cut-next">Continue</.test(cj));
    ok('the recap way out reads "Go to my plan"', /'Go to my plan'/.test(cj) && !/Jump to my plan/.test(cj));
    ok('no blur, shadow or uppercase in results.css', !/blur\(|box-shadow|text-transform: *uppercase/.test(rc));
    ok('no source line says "1 in N runs" or "8 in 10 runs"', !/8 in 10 runs|1 in 10 runs|1 run in 10|in half of \$\{runsWord/.test(cj));
    ok('the numerical view is Scenarios, never Forecast, as a visible label', !/term: 'Forecast'/.test(cj) && /'## Scenarios'/.test(cj) && /'Scenarios', modeLabel/.test(cj));
    ok('validated_forecast is unreachable and the code says so', /NO_FORECAST_LINE/.test(cj) && !/mode: 'validated_forecast'/.test(cj));
    ok('no take-home income is claimed from a revenue model (Task 34)', /EXCLUDED_LINE/.test(cj) && /no take-home income/.test(cj));

    console.log('== an owner journey: the scene is the first generated view (Task 19)');
    state.biz = 'ABC Consulting';
    M.commit('now', 40000, {}); M.commit('sector', { sector: 'professional', trade: 'Consultancy' }, {});
    M.commit('goal', { goal: 80000, appetite: 'aggressive' }, {}); M.commit('months', 12, {}); M.commit('price', 4800, {});
    M.commit('capacity', 12, {}); M.commit('servedNow', 8, {}); M.commit('enquiries', 10, {}); M.commit('closeRate', 0.3, {});
    state.asked = ['now', 'sector', 'goal', 'months', 'price', 'capacity', 'servedNow', 'enquiries', 'closeRate'];
    M.ensurePlanned();
    try { await M.ladder(); } catch (e) { /* the ladder is optional here */ }
    fire('explore');
    await sleep(120);
    const pl = M.canopy.plan().plan;
    ok('the plan object is there', !!pl, M.canopy.plan().source);
    ok('the scene exists and carries a headline', !!$('#res') && text($('#res-head')).length > 0, text($('#res-head')));
    ok('the headline names the visitor’s own business', /ABC Consulting/.test(text($('#res-head'))), text($('#res-head')));
    ok('a labelled target marker is shown, with its unit and horizon', /Target|Milestone/.test(text($('#res-target'))), text($('#res-target')));
    ok('the target marker is labelled in text, not colour alone', !!$('.target-mark') && text($('.target-mark')).length > 6, text($('.target-mark')));
    ok('one primary finding, as a short label', text($('#res-label')).length > 0 && text($('#res-label')).split(/\s+/).length <= 9, text($('#res-label')));
    ok('one immediate action, not a motivational sentence', text($('#res-act')).length > 0 && !/believe|potential|journey|exciting/i.test(text($('#res-act'))), text($('#res-act')));
    ok('at most two compact branch labels', $$('.res-branch').length <= 2, $$('.res-branch').map((b) => text(b)));
    const primary = [text($('#res-head')), text($('#res-label')), text($('#res-act')), text($('#res-change'))].join(' ');
    const words = primary.split(/\s+/).filter(Boolean).length;
    ok('roughly 40 to 60 words of primary copy (25 to 70 accepted as the restraint target)', words >= 25 && words <= 70, { words, primary });
    ok('no completion count stands as the diagnosis', !/\b\d+\s+of\s+\d+\b|answered on demand/.test(text($('#res-label'))), text($('#res-label')));
    ok('no probability sentence anywhere in the scene', !claimsOdds(text($('#res'))), text($('#res')).slice(0, 200));

    console.log('== the stable toolbar (Task 19)');
    ok('the toolbar exists on the first generated view and is shown', !!$('#res-bar') && $('#res-bar').hidden === false);
    ok('it holds Download, Full plan and the TMA action', ['Download', 'Full plan', 'Build this with TMA'].every((w) => $$('#res-bar button').some((b) => text(b) === w)), $$('#res-bar button').map((b) => text(b)));
    ok('nothing was sent or downloaded merely by arriving', saves.length === 0 && clicks.length === 0, { saves: saves.length, clicks: clicks.length });

    console.log('== Task 22: finding, action, expected change, evidence');
    const fin = M.canopy.finding(pl);
    ok('the finding carries all four parts', !!fin.label && !!fin.action && !!fin.change && Array.isArray(fin.evidence), fin);
    ok('the first two are the visible pair', text($('#res-label')) === fin.label && text($('#res-act')).length > 0, { label: fin.label, act: text($('#res-act')) });
    ok('the evidence is not visible until the assumptions are opened', $('#res-truth-body').hidden === true);
    ok('a figure is shown with its meaning, never as an earning promise', !/you will earn|you will make|guaranteed/i.test(text($('#res-change'))) && (/^Scenario:|^Milestone:|^Requires /.test(fin.change)), fin.change);
    ok('with no credible number the milestone stands in its place', fin.hasFigure || /^Milestone:|^Requires /.test(fin.change), fin.change);
    ok('an evidence line never prints an empty value or an object', fin.evidence.every((t) => !/\[object Object\]|: *\(/.test(t)), fin.evidence);

    console.log('== Task 31 and 34: the mode label beside every figure');
    ok('the mode is one of the three this build can claim', ['requirements', 'illustrative', 'operating_scenario'].includes(M.canopy.mode(pl)), M.canopy.mode(pl));
    ok('a validated forecast is never claimed', M.canopy.mode(pl) !== 'validated_forecast' && M.canopy.modeLabel(pl) !== 'Validated forecast');
    ok('a figure on the scene wears its mode label', !fin.hasFigure || !!$('#res-change .mode-chip'), text($('#res-change')));
    $('#res-truth').click();
    await sleep(40);
    ok('What needs to be true opens the assumptions', $('#res-truth-body').hidden === false && text($('#res-truth-body')).length > 40, text($('#res-truth-body')).slice(0, 120));
    ok('it says a validated forecast is not possible here', /no history for this business to test a forecast against/.test(text($('#res-truth-body'))));
    ok('it names the excluded measures honestly', /no take-home income/.test(text($('#res-truth-body'))));
    ok('the assumptions carry no probability sentence', !claimsOdds(text($('#res-truth-body'))), text($('#res-truth-body')).slice(0, 160));

    console.log('== Task 21: one expanded panel at a time, and the Whole tree reset');
    const branch = $$('.res-branch')[0];
    if (branch) {
      branch.click();
      await sleep(40);
      ok('a branch label opens its panel and focuses that branch', M.canopy.opened() === branch.dataset.section && document.body.dataset.inspect === branch.dataset.section, { open: M.canopy.opened(), inspect: document.body.dataset.inspect });
    } else { M.canopy.openCard('reach'); await sleep(40); ok('a branch panel opens', M.canopy.opened() === 'reach'); }
    const firstOpen = M.canopy.opened();
    M.canopy.openCard('money');
    await sleep(40);
    ok('opening a peer closes the previous one: only one panel is primary', M.canopy.opened() === 'money' && firstOpen !== 'money', { was: firstOpen, now: M.canopy.opened() });
    ok('exactly one card element is open in the page', $$('#card.open').length === 1, $$('#card.open').length);
    ok('the Whole tree reset is visible while a branch is open', $('#res-whole').hidden === false);
    /* state preserved on close and reopen: the money card's own detail is left open and comes back open */
    const more = $('#card-more');
    if (more && !more.hidden) { more.click(); await sleep(40); }
    const wasOpen = $('#card-body') && !$('#card-body').hidden;
    M.canopy.openCard('clients');
    await sleep(30);
    M.canopy.openCard('money');
    await sleep(60);
    ok('the state a branch was left in comes back when it is opened again', !wasOpen || ($('#card-body') && !$('#card-body').hidden), { wasOpen, now: $('#card-body') && !$('#card-body').hidden });
    M.canopy.wholeTree();
    await sleep(40);
    ok('Whole tree closes the panel and returns to the composition', M.canopy.opened() === null && document.body.dataset.inspect === undefined && $('#res-whole').hidden === true);
    ok('nothing opens a card by itself at explore any more', !/openCrownSoon\(/.test(src('canopy.js')));

    console.log('== Task 21: the recap, four beats, advancing only on a press');
    fire('cutscene');
    M.canopy.cutscene();
    await sleep(400);
    ok('the recap has four beats, named Recognise, Focus, Move, Open', /1 of 4 . Recognise/.test(text($('#cut-chapter'))), text($('#cut-chapter')));
    ok('the beat is a headline and at most one supporting line', text($('#cut-figure')).length > 0 && text($('#cut-line')).split('\n').length <= 2, { fig: text($('#cut-figure')), line: text($('#cut-line')) });
    ok('Back, Continue and Go to my plan are all available', !!$('#cut-back') && text($('#cut-next')) === 'Continue' && text($('#cut-skip')) === 'Go to my plan');
    ok('the toolbar works during the recap', $('#res-bar').hidden === false && $$('#res-bar button').length >= 3);
    const at = text($('#cut-chapter'));
    await sleep(6500);
    ok('text never disappears on a timer: the same beat is still on screen after 6.5 s', text($('#cut-chapter')) === at && text($('#cut-figure')).length > 0, { was: at, now: text($('#cut-chapter')) });
    $('#cut-next').click(); await sleep(400);
    ok('Continue turns the page', /2 of 4 . Focus/.test(text($('#cut-chapter'))), text($('#cut-chapter')));
    $('#cut-next').click(); await sleep(400);
    $('#cut-next').click(); await sleep(400);
    ok('the last beat offers Reveal my plan', /4 of 4 . Open/.test(text($('#cut-chapter'))) && text($('#cut-next')) === 'Reveal my plan', { ch: text($('#cut-chapter')), next: text($('#cut-next')) });
    $('#cut-back').click(); await sleep(400);
    ok('Back turns it back', /3 of 4 . Move/.test(text($('#cut-chapter'))), text($('#cut-chapter')));
    const beats = M.canopy.recap(pl);
    ok('the beats are read from the plan object alone', beats.length === 4 && beats[3].last === true, beats.map((c) => c.title));
    ok('no beat carries a probability sentence', !beats.some((c) => claimsOdds(`${c.figure} ${c.lines.join(' ')}`)), beats.map((c) => c.figure));
    M.canopy.skip();
    await sleep(60);

    console.log('== Task 23: what TMA could contribute');
    M.canopy.tma.open();
    await sleep(40);
    const tma = $('#tma-panel');
    ok('the invitation is the short form, around the visitor’s own expertise', /Bring your expertise/.test(text($('.tma-invite'))), text($('.tma-invite')));
    ok('the split has a You column and a TMA column, subject to agreed scope', /subject to agreed scope/.test(text($('.tma-split thead'))) && $$('.tma-split tbody tr').length === 3);
    ok('the split names what the person keeps', /expertise/i.test(text($$('.tma-split tbody td')[0])), text($$('.tma-split tbody td')[0]));
    ok('no line says TMA funds the business, accepts everyone or guarantees distribution', /does not fund the business/.test(text(tma)) && /does not take on everyone/.test(text(tma)) && /cannot guarantee distribution/.test(text(tma)) && !/we will fund|every applicant|guaranteed revenue/i.test(text(tma)));
    const book = M.canopy.tma.booking();
    ok('the booking control exists only with a destination behind it', (!!book.url && !!$('#tma-book')) || (!book.url && !$('#tma-book')), book);
    ok('the call is framed as exploring fit and scope', /fit, commitment and implementation scope/.test(text(tma)));
    ok('sharing is a separate choice from booking', !!$('#tma-brief') && /Choose what to share/.test(text($('#tma-brief'))) && $('#share') === null);
    ok('nothing was sent by opening the panel', h.network.length === 0, h.network);
    $('#tma-brief').click();
    await sleep(40);
    ok('the review panel is the sharing road, and it opens separately', !!$('#share') && $('#share').hidden === false && $('#tma-panel').hidden === true);
    ok('the review panel still says nothing is sent', /No sending path is set up/.test(text($('#share'))));
    M.canopy.share.close();

    console.log('== the plan view keeps its depth and gains the labels');
    M.canopy.openPlan();
    await sleep(120);
    const planText = text($('#plan') ?? $('#harvest'));
    ok('the plan view painted', planText.length > 200, planText.slice(0, 80));
    ok('What needs to be true is one press from the decision', !!$('#plan-truth-more') && $('#plan-truth-body').hidden === true);
    $('#plan-truth-more').click();
    await sleep(40);
    ok('it opens the handful of assumptions', $('#plan-truth-body').hidden === false && text($('#plan-truth-body')).length > 40);
    ok('a mode label stands beside the decision', !!$('#plan-truth .mode-chip'), text($('#plan-truth .mode-chip')));
    const secHeads = $$('.sec-head .sec-title').map((b) => text(b));
    ok('the numerical section is named Scenarios', secHeads.includes('Scenarios'), secHeads);
    const scenSec = $('#ps-economics');
    if (scenSec) { const head = $('.sec-head', scenSec); head.click(); await sleep(40); }
    ok('the scenarios section wears the mode label', !!$('#ps-economics .mode-chip'), text($('#ps-economics') ?? document.body).slice(0, 120));
    ok('no probability sentence in the plan view', !claimsOdds(text($('#plan') ?? $('#harvest'))), (noDenials(text($('#plan') ?? $('#harvest'))).match(PROBABILITY) ?? [])[0]);
    ok('the TMA row opens the contribution panel, not the file chooser', !!$('#hv-tma') && $('#hv-tma').getAttribute('aria-haspopup') === 'dialog');
    ok('Book a call is present only with a destination', (!!book.url && !!$('#hv-call')) || (!book.url && !$('#hv-call')));

    console.log('== the exports say the same thing');
    const md = M.canopy.markdown(pl);
    ok('the implementation brief names the scenarios section, not a forecast', /## Scenarios/.test(md) && !/## The forecast\b/.test(md), (md.match(/^## .*/gm) ?? []).slice(0, 12));
    ok('the brief carries the mode and what needs to be true', /Mode: (Goal requirements|Illustrative scenario|Grounded operating scenario)/.test(md), (md.match(/Mode: .*/) ?? [])[0]);
    ok('no probability sentence in the implementation brief', !claimsOdds(md), (noDenials(md).match(PROBABILITY) ?? [])[0]);
    ok('the brief names the excluded measures', /no take-home income/.test(md));
    const full = M.exports.markdown();
    ok('no probability sentence in the full report', !claimsOdds(full), (noDenials(full).match(PROBABILITY) ?? [])[0]);

    console.log('== the starter route: a milestone, not a revenue tree');
    let sp = starterFixture.first(starterFixture());
    M.plan = { current: () => ({ plan: sp, stale: false }), rebuild: () => {}, evidence: () => null };
    state.route = 'starter';
    const spn = M.canopy.plan().plan;
    const stg = M.canopy.target(spn);
    ok('with no numeric target the marker is a milestone', stg.kind === 'milestone' && /Milestone:/.test(stg.text), stg);
    const sfin = M.canopy.finding(spn);
    ok('the starter finding is a short label with an action', !!sfin.label && !!sfin.action && sfin.label.split(/\s+/).length <= 9, sfin);
    ok('no revenue figure is grown from unobserved sales', !sfin.hasFigure && /^Milestone:/.test(sfin.change), sfin.change);
    const sBeats = M.canopy.recap(spn);
    ok('the starter recap is the same four beats', sBeats.length === 4 && sBeats.map((c) => c.title).join(',') === 'Recognise,Focus,Move,Open', sBeats.map((c) => c.figure));
    ok('the starter mode is never an operating scenario without a baseline', M.canopy.mode(spn) !== 'operating_scenario', M.canopy.mode(spn));
    ok('the starter split still names what the person brings', /gardening|expertise/i.test(M.canopy.tma.split(spn)[0].you), M.canopy.tma.split(spn)[0].you);

    console.log('== econ is read with ?. and the plan object stands in when it is absent');
    const econWas = M.econ;
    M.econ = undefined;
    ok('the finding still builds with no econ module', !!M.canopy.finding(spn) && !!M.canopy.mode(spn));
    M.econ = { scenario: () => { throw new Error('econ is broken'); } };
    ok('an econ module that throws does not take the scene down', !!M.canopy.finding(spn) && !!M.canopy.modeLabel(spn));
    M.econ = { scenario: () => ({ mode: 'validated_forecast', totals: { revenue: 1000 }, finding: 'More enquiries needed', firstAction: 'Ask your referral partners', binding: [], assumptions: ['conversion holds at 30%'] }) };
    ok('a scenario claiming a validated forecast is shown as illustrative (D2)', M.canopy.mode(spn) === 'illustrative', M.canopy.modeLabel(spn));
    M.econ = { scenario: () => ({ mode: 'operating_scenario', totals: { revenue: 12000 }, finding: 'Delivery is the limit', firstAction: 'Free up delivery time', binding: [{ resource: 'owner hours' }], assumptions: ['the hours in the plan are available'] }) };
    const efin = M.canopy.finding(spn);
    ok('econ owns the figure when it has one', /^Scenario: /.test(efin.change) && efin.hasFigure, efin.change);
    ok('the finding and the first action come from econ when it gives them', efin.label === 'Delivery is the limit' && /delivery/i.test(efin.action), efin);
    ok('econ’s assumptions are what needs to be true', M.canopy.assumptions(spn).some((a) => /hours in the plan/.test(a.text)), M.canopy.assumptions(spn));
    M.econ = econWas;

    console.log('== nothing left the page');
    ok('no network call was made at any point', h.network.length === 0, h.network);
    ok('no file was saved without a press', saves.length === 0, saves.length);
    ok('no error was thrown across the run', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    ok('(threw)', false, String(e && e.stack).slice(0, 600));
  }
  done();
})();
