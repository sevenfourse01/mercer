# Mercer v12: work packages by file owner

Six engineers, six file sets, no shared files. Every cross-file contract is in section 0; all six read it first and build against it blind. SPEC.md is the design; COPY.md is every word; the v11 maps (notes/map-*.md) describe what the files do today. engine.js is frozen and no package touches it. Script order in index.html stays: three, jspdf, engine, tree3d, sectors, feel, ghost, founder, build, places, app, map, questions, research, canopy, intro, plus the new archetypes, macro, freetools before canopy, and worker.js loaded only by app.js.

| Owner | Files |
|---|---|
| (a) shell | index.html, base.css (new), scene.css (new) |
| (b) tree | tree3d.js, tree.css |
| (c) feel | feel.js, feel.css |
| (d) flow | app.js, worker.js (new) |
| (e) interview | questions.js, questions.css (new), sectors.js, build.js, founder.js, ghost.js, research.js |
| (f) results | canopy.js, results.css (new), intro.js, intro.css, map.js, macro.js (new, from notes/macro.json), archetypes.js (new), freetools.js (new), data/land-110m.json (new, published) |

Deleted files: mercer.css, canopy-r11.css (replaced by base.css, scene.css, questions.css, results.css). Everything shares `window.Mercer` (`M`). Every file keeps its IIFE shape and reads late-loaded exports lazily (`M.x?.()`), as today.

---

## 0. Contracts (read first)

### 0.1 State keys (owner (d) declares every key; the writer named may set it)

Existing keys keep their v11 types (map-app.md §1). `buyer` is declared once, `null`, preset keys only. New keys:

| key | type | writer | read by |
|---|---|---|---|
| `appetite` | `'none'|'boutique'|'moderate'|'aggressive'|'maximum'`, default `'moderate'` | (e) appetite dial via `M.commit` | (d) budget override, (f) ladder card |
| `lastFive` | `[{ bin: 'warm11'|'warm1m'|'cold11'|'cold1m'|'unknown', route: distId|'other'|null } × 5]` or null | (e) sorter | (d) insights, (b) via `paintTree`, (f) 80/20 |
| `topShare` | 0..100 or null | (e) ring | (d), (f) |
| `network` | number or null | (e) | (d), (f) |
| `funding` | `('profit'|'savings'|'loan'|'grant'|'investor'|'none')[]` | (e) | (d), (f) |
| `stackNames` | `{ [stackId]: string }` | (e) ledger | (f) free tools, exports |
| `retainerMin`, `retainerMax` | number or null | (e) fee slider | (d) insights, (f) |
| `buyerNote` | string | (e) research.js website chip | (f) briefing only |
| `na` | `Set<questionId>` | (d) `M.na()` | (d) queue, (b) via `paintTree` |
| `asked` | `questionId[]` (existing; now every id shown, in order) | (d) `showQuestion` | (d) `dataPoints`, (b) twigs |
| `section` | section id or null | (d) | everyone, read-only |
| `prior` | `{ [bankKey]: number }` | (d) on question entry | (d) `M.typ` |
| `systems` | derived from `stackNames` keys (crm, booking, email, ai) plus `'none'` when the ledger is empty | (e) ledger commit | build.js `buildFor` |

`quotes` stays a state key (written by the Enquiries pair slider's second handle). `note`, `dataOffer`, `jobLength`, `qualitySlip`, `newVsRepeat`, `ltv` stay. `stack` keeps its `{ id: £ }` shape for build.js. `offLimits` stays declared and unwritten until the accepted `wi()` strings are read from engine.js (unresolved; see SPEC §13).

### 0.2 Section table (owner (d) exports; everyone reads)

```
M.SECTIONS = [
  { id:'roots',    name:'Roots',        purpose:'who you are',                      part:'roots',      hue:'--sec-ground',   key:'D'  },
  { id:'offer',    name:'The offer',    purpose:'what one sale is worth',           part:'pricing',    hue:'--sec-offer',    key:'G'  },
  { id:'reach',    name:'Reach',        purpose:'who is out there',                 part:'demand',  t:.35, hue:'--sec-reach', key:'C' },
  { id:'routes',   name:'Routes in',    purpose:'how they find you',                part:'demand',  t:.8,  hue:'--sec-routes', key:'D' },
  { id:'close',    name:'The close',    purpose:'how enquiries become sales',       part:'conversion', hue:'--sec-close',    key:'A'  },
  { id:'delivery', name:'Delivery',     purpose:'how much you can take on',         part:'capacity',   hue:'--sec-delivery', key:'E'  },
  { id:'money',    name:'Money',        purpose:'what you keep',                    part:'margin',     hue:'--sec-money',    key:'F#' },
  { id:'clients',  name:'Best clients', purpose:'who pays you most, and why they came', part:'retention', hue:'--sec-clients', key:'B' },
  { id:'you',      name:'You',          purpose:'what you bring',                   part:'trunk',      hue:'--sec-you',      key:'G'  },
  { id:'ground',   name:'Ground',       purpose:'what feeds the tree from outside', part:'roots',      hue:'--sec-ground',   key:'D'  },
  { id:'crown',    name:'Crown',        purpose:'',                                 part:'crown',      hue:'--sec-crown',    key:'C'  } ]
M.SECTION_BY[id]; M.sectionOf(questionId) -> id   // from questions.js's q.section
```

Question ids per section, in order, are owned by (e): `M.sectionQuestions(sectionId) -> questionId[]` (schema and custom ids interleaved as SPEC §4 lists them; engine questions price, capacity, budget may be reordered inside their section by `queueOf()`'s elasticity rule).

### 0.3 Stages and events (owner (d) dispatches on `document`; all listen)

`M.stage` (getter): `'arrival'|'intro'|'roots'|'planting'|'section'|'close'|'cutscene'|'explore'|'harvest'`. `M.go(stage)` (d) moves; `M.next()`, `M.back()`.

| Event | detail | Fired when |
|---|---|---|
| `mercer:stage` | `{ stage, section }` | every stage or section change, after `state` is updated, before any paint |
| `mercer:question` | `{ id, section, first: bool, limb, twigIndex }` | a question is shown (`first` = first screen of the section) |
| `mercer:commit` | `{ id, kind: 'you'|'web'|'sector'|'assumed', grade: 1..5, text, fromXY: {x,y}, limb, twigIndex, engine: bool }` | an answer is committed (after `derive`, before `flow.forward`) |
| `mercer:unsure` | `{ id, standIn: bool, limb, twigIndex }` | Not sure pressed |
| `mercer:na` | `{ id, limb, twigIndex }` | N/A pressed |
| `mercer:run` | `{ key, result }` | `M.result` replaced |
| `mercer:measured` | `{ key }` | `M.measured` replaced |
| `mercer:planned` | `{ key }` | `M.planned` replaced |
| `mercer:close` | `{ section, insight }` | branch close (S5) begins |
| `mercer:ladder` | `{ key, ladder }` | the Worker's ladder for the current key lands |
| `mercer:card` | `{ id|null }` | a results card opens or closes |

### 0.4 M.* functions by owner (signatures fixed)

**(d) app.js exposes**, in addition to every v11 export in map-app.md §2 (kept, except those marked deleted in package (d)):

```
M.askOf(over={}) / M.keyOf(over)                       // unchanged
M.commit(id, value, opts={ fromEl })                   // sets state[key], derive, insight, flow.forward, dispatches mercer:commit
M.notSure(id) / M.na(id)                               // dispatch mercer:unsure / mercer:na, advance
M.prior(bankKey) -> number|undefined                   // the snapshot taken on question entry
M.typ(bankKey) -> number|undefined                     // prior only when Q for that key is in state.asked and answered or in notSure
M.gradeOf(id) -> 1..5
M.insightFor(id) -> ''|string|{ text, warn }           // leaf; owns every template in COPY §6 for custom ids, defers to M.schemaWord for schema ids
M.branchInsight(sectionId) -> string                   // COPY §7
M.overallInsight() -> string                           // COPY §8 (canopy summary cleaned)
M.ladder() -> Promise<Ladder>                          // Worker; cached by keyOf; shape in 0.6
M.appetiteBudget(level) -> { budget, source, ready }   // none/boutique sync; others from ladder
M.dataPoints() -> [{ id, driver, kind, size, label, value, twigIndex }]   // gated on asked and schemaApplies
M.rootCounts(pts) -> { you, sector, web, assumed }
M.paintTree()                                          // calls tree.setStub/setTwigs/setLimbFill/setRootSources/setRootBalance/setMetrics
M.warmShare(allocation) -> 0..1                        // referral+partnerships share of Σ allocation
M.QUADRANT = { warm11:[ids], warm1m:[ids], cold11:[ids], cold1m:[ids] }  // the fixed routes table, SPEC §5
M.BIN_ENGINE = { warm11:['referral','partnerships'], warm1m:['partnerships','content-seo'], cold11:['cold-email','linkedin','cold-calling'], cold1m:['paid-search','paid-social','content-seo'] }
```

**(e) questions.js exposes** (v11 exports kept: `M.SCHEMA`, `M.SCHEMA_BY`, `M.SCHEMA_KEYS`, `M.renderSchema`, `M.schemaWord`, `M.schemaAnswered`, `M.schemaApplies`, `M.schemaAnswers`, `M.schemaPoints`, `M.driverAdapt`; `M.CHAPTERS` and `M.CUSTOM_CHAPTER` deleted):

```
M.sectionQuestions(sectionId) -> questionId[]
M.headline(id) -> { title, sub }                        // COPY §4, getters where state-dependent
M.explain(id) -> string                                 // COPY §4 explanation; app.js appends the elasticity line for engine inputs
M.renderQuestion(id, body, enable) -> { focus() }       // every question, custom and schema; uses M.ui.* components; calls M.commit
M.Q                                                     // custom question table moves here from app.js (driver, kind, engine, presence, unsure)
```

**(c) feel.js exposes** (v11 exports kept):

```
M.feel.play(name, { x, x2 })                            // x, x2 in 0..1 screen fraction; x2 optional glide target
M.feel.panOf(elOrXY) -> 0..1
M.feel.birds = { start(), stop(), level(0..1), fade(level, ms) }
M.feel.key(sectionId) -> note name                      // from M.SECTIONS[].key
M.ui = { slider, pair, fee, stones, tenStones, ring, keptRing, arc, capacity, shelves, sorter, ledger, sort, tableRing, twoSided, socket, dial, monthsArc, line, field }
// every component: M.ui.x(host, opts) -> { el, get(), set(v, silent), focus(), destroy() }
// opts common: { value, hue: '--sec-*', onInput(v), onCommit(v), label, unit, scale:[lo,hi], log:true, na:false }
// commit fires on release / Enter / blur, never on drag
```

**(b) tree3d.js exposes** on `GrowthTree` (v11 methods kept; `setDetail` removed; `setData` kept as a shim that calls `setTwigs`):

```
setStub(limbId, bool)
setTwigs(limbId, [{ id, state:'bud'|'leaf'|'estimate'|'ring'|'cut', grade:1..5, kind:'you'|'web'|'sector'|'assumed' }])   // index = twig slot, max 12
setLimbFill(limbId, f 0..1)
setLabel(part, text)                                    // part = limbId | 'trunk' | 'roots' | { limb, t }
flight({ x, y }, limbId, twigIndex, text, kind) -> Promise  // resolves on arrival; draws the DOM flyer in #flight
frame(presetName | { yaw, pitch, dist, target, t })    // presets: 'arrival','intro','roots','planting','offer','reach','routes','close','delivery','money','clients','you','ground','close-pull','cutscene','explore','harvest'
anchor(part) -> { x, y, front, inView }                 // part as setLabel; adds { limb, t } and 'core'
crownRadius() -> number
setRootBalance(ownShare 0..1)                           // R_roots = crownRadius() × ownShare
wave()                                                  // bark lightness wave 600 ms
setDiscs([{ id, part, state:'filled'|'ring'|'hollow', scale, collar:bool, mist:bool }])  // DOM discs in .tree-tags, placed each frame
setCoreHost(el)                                         // the Core DOM element, placed each frame at anchor('core')
lockDrag(bool)
```

**(f) exposes**:

```
M.canopy = { enter(), repaint(), openCard(id), closeCard(), cutscene(), skip() }
M.intro = { open(), finish() }                          // unchanged names
M.paintMap(host) / M.paintWorld(host)                   // ring map / world outline
M.macro = { rows: [...macro.json], byId, forKey(contentKey) -> rows, weatherLines(state) -> [{ text, ids:[...] }] }
M.archetypes = { pick(code) -> { name, types, lines, grows, examples:[{who, company, did, sources}] } | null, answer(chipId|text, state) -> string }
M.freetools = { rowsFor(stackId) -> [{ tool, tier, limit, url, condition }], buildLine }
M.exports = { markdown() -> string, pdf() -> Promise, json() -> object }
```

### 0.5 DOM ids and CSS classes (owner (a) provides; others fill)

Static in index.html (all present at load; none of app.js's v11 unguarded ids remain):

```
#wordmark  #sound  #mode  #ring            (top bar; #ring is the progress ring, an <svg> with .ring-arc)
#stage                                     (fixed, inset 0, z 0; the canvas host)
#flight                                    (fixed layer for flying values, z 3, pointer-events none)
#label                                     (the live label, .tag; placed by tree3d)
#core                                      (the Core; placed by tree3d)
#clearing                                  (z 2; the veil; holds #eyebrow #q #foot at S2..S5, #card at S7, #harvest at S8)
  #eyebrow  (.eyebrow > i.dot + span.name + span.purpose)
  #q        (#q-title button.headline, #q-sub .sub, #q-explain .explain[hidden], #q-body .body, #q-insight p.insight[aria-live])
  #foot     (#back .glass, #unsure .glass, #na .glass, #next .glass.glass-on)
  #card     (.card: #card-title, #card-term .eyebrow, #card-lines, #card-more .drop, #card-body)
  #harvest  (#hv-md .glass.fill-you, #hv-pdf .glass.fill-estimate, #hv-call .glass.fill-crown, #hv-agent .glass.fill-you-hue, #hv-json .glass.small, #hv-private .small, #agent)
#discs                                     (S7: .tree-tags sibling on desktop; a scrollable row on phone)
#cutscene  (#cut-figure, #cut-line, #cut-skip)
#intro     (owner (f) builds inside; #intro-cap, #intro-body, #intro-go, #intro-dots, #intro-biz)
#arrival   (#biz field, #begin)
<template id="tpl-*">                      none; every owner builds its own DOM
```

Classes (base.css owns tokens and controls; scene.css owns layout): `.glass`, `.glass-on`, `.fill-you|.fill-estimate|.fill-crown|.fill-you-hue` (harvest fills), `.stone`, `.stone[aria-pressed=true]`, `.rail`, `.handle`, `.handle.avg`, `.band`, `.ring-ctl`, `.arc-ctl`, `.figure` (display face figure), `.unit`, `.eyebrow`, `.headline`, `.sub`, `.explain`, `.insight`, `.insight.warn`, `.tag` (live label), `.disc`, `.disc.ring`, `.disc.hollow`, `.disc.mist`, `.disc.bind`, `.card`, `.drop`, `.veil`, `.minor`, `.src[data-from=you|sector|web|assumed]` (the source dot + word), `.tabular`. Data attributes: `body[data-mode=light|dark]`, `html[data-theme]`, `body[data-stage]`, `body[data-section]`, `body[data-tint]` (the live `--sec-*` token name).

### 0.6 Worker and ladder shapes (owner (d))

```
worker.js: self.window = self; importScripts('engine.js');
onmessage { key, ask, plan:{ budgets:[...] } } -> postMessage { key, rungs:[{ budget, p50:[12], reach:[12], unspent, unspentReason, binding, bindsAtMonth, ceiling, computeMs }] }
Ladder = { key, gap, onCourse, bStar, bStarRung, noBudget:{ binder, ceiling }|null, monthP50, monthHalf,
           rungs, funnel:{ sales, meetings, leadsPlan, leadsNeeded }, capacityCheck|null,
           levers:[{ title, magnitude, difficulty, rank, points, restraint }], appetite:{ none, boutique, moderate, aggressive, maximum: { budget, source, p50, p90 } } }
```

### 0.7 Insight and copy sources

COPY.md is the only source of words. (d) owns leaf templates for custom ids and every branch/overall template; (e) owns `word()` for schema ids; (f) owns cutscene, card, weather, agent, harvest and export copy. Nobody writes a sentence COPY.md does not hold.

---

## (a) Shell: index.html, base.css, scene.css

**Builds**
- index.html: the DOM in 0.5 and nothing else; the deck, `#cells`, `#bank`, `#bank-col`, `#rail-*`, `#drivers`, `#progress`, `#tree-slot`, `#tree-h`, `#p-head`, `#p-ask`, `#to-canopy`, `#read-tree`, `#rail-legend`, `#cells`, `#tiles`, `#kinds`, `#dial*`, `#knob-rot`, `#months-*`, `#plant-need`, `#target-gauge`, `#basis*`, `#goal-row`, `#budget-row`, `#canopy`, `#tray`, `#top-actions`, `#act-*`, `#import-file`, `#tree-big`, `#cut-stage`, `#captions`, `#research`, `#site-found` are gone. `#site` and `#biz` move inside the Roots question host as (e) renders them, not static ids; research.js mounts on `[data-q=site] textarea`.
- Script tags: three@0.147.0 and RoomEnvironment (jsdelivr), jspdf 2.5.1 (cdnjs), then engine.js, tree3d.js, sectors.js, feel.js, ghost.js, founder.js, build.js, places.js, app.js, map.js, questions.js, research.js, archetypes.js, macro.js, freetools.js, canopy.js, intro.js, all `?v=12`. Google Fonts `<link>` per SPEC §7 with the fallback pair. `<title>Mercer</title>`; the wordmark's `title` attribute reads "Mercer 12".
- base.css: every token in SPEC §6 (`:root`, the two dark guards), `body { background: var(--sky) }`, the drift mix (`--sky` from `--sky-base` and `--tint`), `@font-face` slots, the type scale in SPEC §7 as classes, `.glass`, `.glass-on`, `.stone`, `.rail`, `.handle`, `.band`, `.ring-ctl`, `.arc-ctl`, `.figure`, `.unit`, `.eyebrow`, `.headline` (a `<button>` reset), `.sub`, `.explain`, `.insight`, `.tag`, `.disc*`, `.src`, `.tabular`, `.minor`, focus rings (2 px `--tint`), `prefers-reduced-motion` zeroing of every transition it owns.
- scene.css: `#stage` fixed inset 0; `#clearing` geometry at 1440 (x 0..660, padding 96 32 96 64) and at 390 (y ≥ 470, 16 px gutter, the veil plus the 24 px paper gradient at its top edge); `#foot` fixed at 390 with the safe-area inset; the top bar; `#flight`, `#label`, `#core` (148 × 88; 56 × 34 at 390), `#discs` (row at 390), `#cutscene` centred low, `#card` (52% lower sheet at 390), `#harvest`; `body[data-stage]` rules that show and hide the hosts; no horizontal scroll (`overflow-x: hidden` on `html, body`); `touch-action: pan-y` on `#stage`.

**Consumes** nothing at runtime. **Must delete** mercer.css and canopy-r11.css and every v11 id above.

**Check before handing over:** every section's light-mode screen at 390 with the veil over the busiest tree pose passes 4.5:1 for `--ink` and `--ink-2`; the phone shows no horizontal scroll; the `@font-face` slots point at published paths; tokens resolve in both dark guards.

---

## (b) Tree: tree3d.js, tree.css

**Builds** (all additive to the v11 API, map-views §2):
- `setStub`, `setTwigs` (12 slots per limb along t .14..0.94, alternating sides, radius .012; states bud / leaf / estimate / ring / cut per SPEC §3; leaf cluster `6 + 8 × grade`, 700 ms, 22 ms stagger, colour by `kind` from the page tokens `--you|--sector|--web|--estimate`), `setLimbFill`, `setLabel` (a `.tag` DOM element in `.tree-tags`, placed each frame, nudged 18 px into the clearing: read `body[data-clearing=left|bottom]`), `flight` (a DOM flyer in `#flight`, cubic path, 620 ms, resolves on arrival, then opens the twig), `frame` with the preset table in SPEC §3 (portrait: +0.08 pitch and the trunk base at y 0.42; landscape: x 0.64, y 0.70), `anchor({limb, t})` and `anchor('core')`, `crownRadius`, `setRootBalance` (R_roots = crownRadius × ownShare, depth 0.9 × R; keeps per-bundle proportions from `setRootSources`), `wave` (600 ms bark lightness base to crown, leaf +6% 300 ms), `setDiscs` (re-enable the dormant `placeLabels` collision code for `.disc` elements; scale, collar ring, mist and hollow states; on phone `body[data-clearing=bottom]` skip placement and let (f) render the row), `setCoreHost`, `lockDrag`.
- `playIntro(ms)` gains a `phases` option `{ roots, trunk, limbs, leaves }` (fractions) so (f) can stretch it to four beats and (d) to the 3 s planting (stubs only, no leaves).
- Limb growth on arrival: `frame(preset)` accepts `{ growLimb: id }` and runs `setLimbFill` from the stub to the current fill during the last 500 ms.
- `leafCap` 4,608; `buildDots`, `dotGeo`, both dot instanced meshes, `paintDots`, `pickDot`, `'dot'`/`'dotselect'` events removed; `setData(list)` kept as a shim that groups by `driver` and calls `setTwigs`.
- Theme: `leaf` light #5A8A62, dark #4A8A5C; `readTokens` reads `--you|--sector|--web|--estimate|--bud|--collar|--sky`.
- Roots: `driver: 'roots'` points thicken the `you` bundle; the CV adds a strand (`setRootSources` with `cv: true`).
- tree.css: `.tree-tags`, `.tag`, `.disc` placement only (colours from base.css tokens).

**Consumes** `body[data-clearing]`, `body[data-mode]`, tokens. **Emits** `'frame'`, `'hover'`, `'select'` (limb ids; `'trunk'`, `'roots'`, `'crown'` now selectable).

**Must delete** dots, `setDetail`, `setForest`, `pulse`, the unused rings (`goalRing`, `todayRing`, `crownShade`), `setRoots` legacy depths (keep the method as a no-op for one release).

---

## (c) Feel: feel.js, feel.css

**Builds**
- Sound: `play(name, { x, x2 })` with a `StereoPannerNode` per voice created from the current `ctx` and inserted before `bus`; `tone()`/`air()` take `to`; the crossfade when `x2` is given; the new voices in SPEC §9 (`leaf` by grade, `estimate`, `na`, `root`, `wave`, `whoosh`, `close3` in a key, `plant`, `powerup`, `rise`, `beat` in a key, `discopen`); `M.feel.key(sectionId)`; the bird scheduler `M.feel.birds` (four voices, gate = `document.visibilityState`, not muted, and a `M.feel.birds.allowed` flag that (d) sets true from S3); `measure()` still renders offline through the same chain.
- `M.ui.*` components (SPEC §5), each pure DOM with the common API in 0.4, 44 px targets, `touch-action: none` on rails and rings, commit on release, arrow keys, Shift × 10, Enter commits and dispatches a bubbling `mercer:enter` that (d) turns into Next, Escape reverts; every component takes `hue` and paints its moving part with `var(hue)`; `fee` pushes the average marker; `sorter` supports drag, tap-then-bin and keys 1..5 and exposes `routesFor(bin)` via opts; `ledger` shows ghost text via `M.ghost` and reveals the £ well after two characters; `socket` implements the CV power-up visuals and calls `opts.onPaste(text)`; `dial` with five detents and the working arc (`set({ working: true })`).
- feel.css: the components' geometry only; colours from tokens.

**Consumes** `M.SECTIONS` (for keys), `M.ghost`, `M.STACK` (ledger rows), tokens. **Must delete** nothing from the v11 graph; `mountSwitch` now targets `#sound`.

---

## (d) Flow: app.js, worker.js

**Keeps exactly** the engine call surface: `askOf`, `keyOf`, `E.forecast({ ...askOf(), draws: 4000 })` in `runAndShow`, `E.measure(askOf())` in `ensureMeasured`, `E.plan(askOf(), new Date().toISOString())` in `ensurePlanned`, `flow.forward/backward` with the same `ENGINE` set and the 300 ms debounce, `advance()`, `M.restore`. `askOf` gains one line: when `state.appetite === 'none'` the basis is budget and budget is 0 (sent as 0.01, as today); every other level leaves `budget` as the visitor's ceiling (the appetite runs happen in the Worker, never in `askOf`).

**Builds**
- Stages: `M.stage`, `M.go`, `M.next`, `M.back`, `M.SECTIONS`, the events in 0.3, keyboard (← Back, → Next when enabled, Space on S5/S6, Escape closes a card; never inside inputs; never announced), swipe right = Back at 390.
- Roots stage as a one-field-at-a-time sequence over (e)'s renderers; Plant when now, sector, goal-or-budget, months hold; the 3 s planting (`tree.playIntro(3000, { leaves: 0 })`, caption, birds allowed, chord).
- Queue: `queueOf()` keeps its elasticity logic inside a section; `M.sectionQuestions` replaces chapter merging; a weak engine question moves last with `.minor`; `na` ids never return; `answered()` covers the new keys.
- Commit path `M.commit`: derive (questions.js), `prior` snapshot on entry, `M.typ`, insight (`M.insightFor` for custom ids, `M.schemaWord` for schema ids), `flow.forward`, `mercer:commit`, then `tree.flight(...)` → `tree.setTwigs`, `paintTree()`; `M.notSure`, `M.na`; Back restores the previous question with its value in place (no reset); `reopen` kept for the crown's "unfinished" discs.
- `dataPoints()` gated on `asked` and `schemaApplies`; kind `sector`/`assumed` only for ids in `notSure` with a stand-in; `rootCounts`; `paintTree` takes counts from `rootCounts(dataPoints())`, sets `setRootBalance(own/all)`, `setStub` per section entered, `setTwigs` per limb from `asked`/answers, `setLimbFill(answered/asked)`, `setMetrics` (interview: progress 0, odds 1), and on the crown `setDiscs`.
- The Core: `M.paintCore()` on `mercer:run` draws the 400 points and the band into `#core` (shared drawing function exported as `M.drawCore(host, sorted, { axis:bool, labels:bool, now, goal })` so (f) can draw the full-size form); appears only when `state.sector && state.now` and a run has landed.
- Insights: every template in COPY §6 (custom ids), §7, §8, as functions over state and engine outputs; the "never £0" rule; `M.branchInsight` at `mercer:close`.
- Appetite: `M.appetiteBudget(level)`; the Worker (`worker.js` per 0.6; `self.window = self` before `importScripts`; fallback to idle chunks on the main thread if construction throws), `M.ladder()` cached by `keyOf`, started on entering the cutscene and when the dial moves on the trunk card; `mercer:ladder`.
- Progress ring: arc = answered share across `M.SECTIONS` weighted equally; never a number.
- `M.QUADRANT`, `M.BIN_ENGINE`, `M.warmShare`; `DISTRIBUTION` groups replaced by the quadrant table; `DIST_ALL`, `DIST_BY`, `primaryChannel`, `CHANNEL_NAME` kept.
- Theme: `body[data-mode]`, `body[data-tint]` on section change, `tree.setTheme`, `M.canopy.repaint` on mode change (as v11).

**Consumes** `M.ui` (c), `M.renderQuestion`, `M.headline`, `M.explain`, `M.sectionQuestions`, `M.schemaWord`, `M.driverAdapt` (e), the tree API (b), `M.canopy.cutscene/enter` (f), `M.macro.byId` for the priceRaised leaf.

**Must delete** `CELLS`, `paintBank`, `paintRail`, `paintDrivers`, `paintProgress`, `paintDetail`, `buildLegend`, `LEGEND`, `fallbackTree` (a flat SVG fallback moves to (b) as `GrowthTree.flat(host)` for no-WebGL), the `ASK.*` renderers (they move to (e) as `M.renderQuestion`), `numBox`/`choices`/`tensRow` (replaced by `M.ui`), `showReady` (the crown's arrival replaces "Tree grown"), the `note` special cases in `queueOf`/`answered` (note is a plain text question in Ground), the second `buyer` declaration, `M.map` stub, `M.handoff`, every reference to the v11 ids in map-app.md §9.

---

## (e) Interview: questions.js, questions.css, sectors.js, build.js, founder.js, ghost.js, research.js

**Builds**
- questions.js: `q.section` replaces `q.chapter`; `M.sectionQuestions`; new ids `lastFive`, `topShare`, `network`, `funding`, `software`, `spend` (pair: spendNow + budget), `enquiries` (pair with quotes), `retainer` (fee slider, replaces `retainerValue` as a lone question; `retainerMonths` and `retainerRenew` stay in Best clients); `when` rules updated (priceSpread not when retainer or priceMix; spendSplit when ≥ 2 doing); `M.headline`, `M.explain` from COPY §4; `M.renderQuestion(id, body, enable)` for every id, custom ones moved from app.js's `ASK.*` and rebuilt on `M.ui.*` (SPEC §5 table names which component each id uses); `derive()` extended: the fee slider writes `retainerMin/Max/Value`, sets `priceSpread` and marks it answered, and keeps `price = retainerValue × stayMonths`; the ledger derives `systems`; `word()` extended per COPY §6 for schema ids (bestWorst never prints £0; `yearsTrading`, `holiday`, `upsell` new lines; `priceRaised` reads `M.macro.byId('cpi_annual')`); `schemaPoints` gated on `schemaApplies` and `asked`; `M.Q` (the custom table) moves here.
- questions.css: per-question layout only (the pair slider's two figures, the ledger rows, the sorter bins, the capacity trough); components' own CSS is (c)'s.
- sectors.js: `fitsBranch` drops `abm`; `contentKey` unchanged; nothing else.
- build.js: `STACK` unchanged; `buildFor` reads derived `systems`; `retiredBy`/`buildSchedule` unchanged.
- founder.js: unchanged exports; `TYPES` lines kept; nothing renders here.
- ghost.js: every phrase set rewritten trade-neutral (COPY §16); a `software` set of the STACK `eg` names per category.
- research.js: mounts on the Roots website question's textarea; a pressed `who` chip writes `state.buyerNote`, never `state.buyer`; `M.researchLive()` unchanged; the status lines per COPY §15.

**Consumes** `M.ui` (c), `M.commit/notSure/na/typ/prior` (d), `M.macro` (f), `M.STACK`, `M.ghost`, `M.readCV`. **Must delete** `CHAPTERS`, `CUSTOM`, `M.CUSTOM_CHAPTER`, the physio placeholders, `UNSURE_BY_TYPE` fallbacks that no longer apply, the `numField` gauge (the figure slider replaces it).

---

## (f) Results: canopy.js, results.css, intro.js, intro.css, map.js, macro.js, archetypes.js, freetools.js, data/land-110m.json

**Builds**
- intro.js: S0 Arrival (name field, Begin) and the four beats (COPY §1) on the live tree (`tree.playIntro(10400, { phases })`, `showPart`, demo leaves via `setTwigs` with `kind` in all four colours, the Core with demo points via `M.drawCore`, emptied in beat 3, the self-opening headline in beat 4); mode follows `body[data-mode]`; returning visitor beats 3 and 4; `?intro=` switches kept; sound switch is the page's `#sound`.
- canopy.js, rebuilt as cards over the stage (v11 helpers kept: `summary`, `rangeAt`, `levers`, `limitOf`, `componentWords`, `routeWords`, `report`, `makePdf`, `briefing`, `capacityRescue`, `gauge`): `cutscene()` (six beats, COPY §9, the rise, the collar, the disc key), `enter()` (discs via `tree.setDiscs` on desktop, the row on phone; `mercer:card`), the card model (SPEC §10 table; one card, one ▾), the vocabulary (COPY §10) shown once, the trunk card ladder from `M.ladder()` with the appetite dial (`M.ui.dial`), the 80/20 advice, the weather (via `M.macro`), competitors, free alternatives (via `M.freetools`), Mission Alignment, the agent panel (scripted; the opt-in host-model stone), the harvest (`M.exports.markdown/pdf/json`, the private line). `SOLVE_NOW` and `ROOMS` deleted (physio copy; not sourced beyond v11).
- results.css: cards, discs row, cutscene figures, harvest buttons and fills, the full-size Core, the ladder, the gauge; colours from tokens.
- map.js: `paintMap` (ring map, unchanged) and `paintWorld` (equirectangular from `data/land-110m.json`, no spin, one lit point, credit line); `isPhysical()` decides.
- macro.js: `M.macro` built verbatim from notes/macro.json (values, units, periods, asOf, sources, urls, notes); `forKey`; `weatherLines(state)` per COPY §11.
- archetypes.js: the eight archetypes from facts-archetypes.md (`types`, `lines`, `grows`, `examples` with `did` copied whole and `sources`); `pick(code)`; `answer(chipId|text, state)` per COPY §14 (keyword rules; "Mercer does not know that").
- freetools.js: the rows of facts-free-tools.md verbatim by STACK id; Twilio "free to test"; Cal.diy and n8n conditions; the build line.
- data/land-110m.json: Natural Earth 110m land polygons, simplified, about 80 KB, published as a file.

**Consumes** `M.planned`, `M.result`, `M.ladder`, `M.drawCore`, `M.overallInsight`, `M.branchInsight`, `M.insightFor`, `M.schemaWord`, `M.warmShare`, `M.BIN_ENGINE`, `M.typeOf`, `M.letterMeans`, `M.readCV`, `M.buildFor`, `M.retiredBy`, `M.stackSpend`, `M.STACK_BY`, `M.locate`, `M.places`, `M.coast`, the tree API. **Must delete** the seven-chapter DOM, the spine, `#tree-labels` static key row, the `db` "Send now" write, the default-on `sample` chat, `ARCHETYPES` (five old ids), `SOLVE_NOW`, `ROOMS`, `#toast` (the export sound replaces it; a saved-file line appears under the button instead).

---

## Build order and checks

1. (a) ships the DOM and tokens first; every other owner builds against 0.5 with a stub `index.html` until then.
2. (c) ships `M.ui` and `play` early; (e) and (f) depend on them.
3. (b) ships `setTwigs`, `frame`, `flight`, `anchor` early; (d) and (f) depend on them.
4. Integration check, in this order: light mode at 390 for every section; item 8 (no sector figure before its question: grep every insight for `typ(`); the "£0" line cannot render; the Worker starts under the artifact CSP (else the fallback); the combined Google Fonts URL returns `@font-face`; `measure()` still renders with the panner; reduced motion collapses the cutscene; Skip lands on the crown card; no request leaves the page except fonts and the optional reader.
5. Minify with terser at the end; state the limits per SPEC §13 in the harvest line, the markdown header and the PDF footer.
