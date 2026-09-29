# Mercer v12: the spec

The Window (design-window.md) is the spine. Grafts from The Ascent and The Instrument are named where they land. Where two directions conflicted the decision is stated in one line, marked **Decision**. Every v11 name below is the one in map-app.md, map-questions.md and map-views.md; every engine figure is one facts-engine-realism.md shows the engine exposes. engine.js is not touched. COPY.md holds every word on screen; WORK.md splits this into six file-owned packages; CHECKLIST.md maps requests 1 to 60.

Vocabulary used throughout: **stage** = a camera distance (S0 to S8). **Section** = one movement of the interview tied to one part of the tree. **Clearing** = the part of the screen the camera leaves empty for words and instruments. **Leaf** = one answered question drawn on the tree. **Twig** = the slot a question owns on its limb. **Disc** = the one learnt control: a filled circle means something unseen, a ring means opened or not given. **Core** = the square at the trunk base where the engine's draws settle (the "dots populating a box"). **Source colour** = green (yours), amber (industry), teal (website), slate (Mercer's estimate).

---

## 1. Thesis

The tree is the only scene and the camera is the only container. From the first word to the PDF button the visitor never leaves the tree; the camera moves, and at every distance it leaves a clearing where the few words and the one instrument live. Facts become wood: a twig when a question is shown, a leaf cluster when it is answered, a root strand when it is about the visitor, a shift in the band of the engine's own draws in the Core. Colour says where a fact came from, motion says where it went, sound says what just happened, and the words say only what the picture cannot: a headline, a subhead, and one sentence the visitor did not know.

---

## 2. Structure

Nine stages on one page, one fixed full-viewport WebGL canvas behind one layer of text and instruments. Three things never move: the wordmark (top left, 32,28), the sound switch and the progress ring (top right, 40 px each, 16 px apart), and the trunk's base on screen once the tree is planted (x = 0.64 w, y = 0.70 h at 1440; x = 0.5 w, y = 0.42 h at 390). The camera pivots about the trunk base; it never tracks.

**The clearing.** At 1440 the trunk stands at x = 0.64 and the clearing is x 0..660 (46%). At 390 the trunk stands at x = 0.5 and the clearing is y 470..844 (44%). The limb in play is framed so its tip points into the clearing; the live label sits at the tip on the boundary.

**Decision (legibility).** Window's card-less clearing stays, but it is not bare sky: the clearing carries a flat **veil**, `--veil`, a paper-coloured fill at 58% (light) / 44% (dark) with a 48 px linear edge toward the tree (a gradient, not blur, no border, no radius, no shadow). The camera never frames leaves under text; the veil is insurance for when the visitor turns the tree. Drag is locked while any text field has focus (Ascent's rule). Tested first in light mode at 390 before anything else is built. This answers the three judges' contrast warning without bringing back a panel.

Legend for layouts: `~` leaves, `|` trunk, `≈` roots, `o` seed, `[ ]` field, `( )` glass button, `◔` progress ring, `♪` sound switch, `·` live label, `[core]` the Core, `●`/`○` disc/ring.

### S0 Arrival

**Decision (intro palette).** The intro runs in the visitor's chosen mode, not forced dark: the CMO's light mode is first-class from the first frame. The seed is drawn in `--soil` on `--sky`, dark on pale in light mode, pale on dark in dark mode. (Adam may overrule; see unresolved list in the summary.)

```
1440x900
+----------------------------------------------------------------------+
| Mercer                                                        ♪  ◔   |
|                                                                      |
|                                                                      |
|                              o                                       |
|                                                                      |
|                  Mercer forecasts what you can grow.                 |
|                                                                      |
|                  [ Your business name              ]                 |
|                  ( Begin )                                           |
|                                                                      |
+----------------------------------------------------------------------+
390x844
+----------------------+
| Mercer         ♪  ◔  |
|                      |
|          o           |
|                      |
|  Mercer forecasts    |
|  what you can grow.  |
|  [ Business name  ]  |
|  ( Begin )           |
+----------------------+
```

The name field is the only bordered element on the whole page. Placeholder "ABC Consulting". Commits `state.biz`.

### S1 Intro (four beats, copy in §11)

The tree grows from the seed across the four beats (`playIntro(10400)`, 2.6 s per beat: roots, trunk, limbs, leaves). Text sits under the tree. Arrow keys, Space, tap advance; nothing says so. Returning visitor: beats 3 and 4 only.

```
1440x900                                        390x844
+--------------------------------------------+  +----------------------+
| Mercer                              ♪  ◔   |  | Mercer         ♪  ◔  |
|                    ~~~~                    |  |        ~~~~          |
|                  ~~~~~~~~                  |  |      ~~~~~~~~        |
|                    ||         [core]       |  |        ||            |
|                  ≈≈||≈≈                    |  |      ≈≈||≈≈  [core]  |
|                                            |  |                      |
|         This is how to read it.            |  |  This is how to      |
|         Roots are what Mercer knows...     |  |  read it.            |
|                  ( Next )                  |  |  ( Next )            |
|                   · · · ·                  |  |   · · · ·            |
+--------------------------------------------+  +----------------------+
```

### S2 Roots (who you are)

Camera below the ground line looking at the seed's first roots (pitch −0.35, target 0.4 below ground). One field on screen at a time; the next fades in when the previous commits; Back reveals the previous. Order: revenue now, your months (best and worst), where, industry and trade, website, since, target with the appetite dial, timeframe. Each committed field grows a rootlet on the `you` bundle (website on `web`).

```
1440x900
+----------------------------------------------------------------------+
| Mercer                                                        ♪  ◔   |
|                                                                      |
|  ● Roots · who you are                       ~                       |
|                                            ~~|~~                     |
|  Revenue                                      |                      |
|  A normal month, before costs                 o                      |
|                                            ≈≈≈|≈≈≈                   |
|  £ [ 40,000       ]                       ≈   |   ≈                  |
|  ────────●─────────────────              ≈    ·    ≈                 |
|                                                                      |
|                                                                      |
|  ( Back )                                          ( Next )          |
+----------------------------------------------------------------------+
390x844
+----------------------+
| Mercer         ♪  ◔  |
|          o           |
|       ≈≈≈|≈≈≈        |
|      ≈   ·   ≈       |
|                      |
|  ● Roots             |
|  Revenue             |
|  A normal month      |
|  £ [ 40,000  ]       |
|  ──────●─────────    |
|                      |
|  ( Back )    ( Next )|
+----------------------+
```

Target and appetite are one instrument (§5). "Plant" appears in place of Next only when revenue, industry, target-or-budget and timeframe hold; until then the missing field is the one on screen.

### S3 Planting

Three seconds, no words but the caption, no skip (it is short). The camera rises from the roots through the ground line; the trunk grows to `S_REST`; six limbs reach out as pale stubs (§3). The planting chord's four notes spread across the stereo field (Instrument); the birds begin at 60% of the scene. Caption at 85%: "{Name}'s tree." Then the camera flies to the first limb, and the limb's growth animation runs in the last 500 ms of the flight (Instrument, request 45).

### S4 Section screen (nine sections, §4)

```
1440x900
+----------------------------------------------------------------------+
| Mercer                                                        ♪  ◔   |
|                                                                      |
|  ● The offer · what one sale is worth              ~~~~~             |
|                                              ~~~~~~~~~~~~            |
|  Sale value                                ~~~~~~~~ ~~~~~            |
|  One sale, on average                    · The offer · Sale value    |
|                                          \_______________            |
|  £ [ 4,800       ]                                       \\          |
|  ───────●──────────────────                               ||         |
|  100                     20k                              ||         |
|                                                          ≈||≈        |
|  £4,800 sits 14% above the £4,200                       ≈  ||  ≈     |
|  typical for your industry.                             [core]       |
|                                                                      |
|  ( Back )   ( Not sure )  ( N/A )                     ( Next )       |
+----------------------------------------------------------------------+
390x844
+----------------------+
| Mercer         ♪  ◔  |
|        ~~~~~         |
|     ~~~~~~~~~~       |
|   · The offer        |
|      \_____          |
|            \\        |
|          ≈≈||≈≈      |
|          [core]      |
|  ● The offer         |
|  Sale value          |
|  One sale, on average|
|  £ [ 4,800  ]        |
|  ─────●────────      |
|  £4,800 sits 14%     |
|  above the £4,200... |
| (‹)(Not sure)(N/A)(Next)|
+----------------------+
```

The eyebrow line (section name, colour dot, and the section's purpose in five words) is shown on the section's first screen only; on later screens the eyebrow is the section name alone. **Decision:** no purpose card per section (Ascent): ten extra Next presses is the boredom he named; the purpose is the eyebrow's first appearance, said once.

### S5 Branch close (one per section)

The clearing empties, the camera pulls back to the section preset × 1.3 so the whole limb is seen with its twigs, and the branch insight appears at +500 ms. "Next" appears after 2 s; Space, → or tap continues; the camera swings to the next limb. The section's three notes (root, fifth, octave) play from the limb tip.

### S6 Crown cutscene (results, part one)

The out-of-body moment (Ascent's rise): the camera drops to ground level looking up, then rises through the trunk while the crown lights to the odds share; the first beat's figure appears at 2.4 s. Six beats (§10), one figure each, one struck note climbing a scale. Controls: "Skip" (small, under the ring). Under `prefers-reduced-motion` the rise is a 200 ms fade and each beat a fade. Skip lands on S7 with the crown card open.

### S7 Crown explore (results, part two)

The whole tree, roots as wide as the crown when the answers were the visitor's own. **Decision (navigation):** discs on the limbs (Ascent, Instrument), placed by `tree.anchor`, collision-nudged, not Window's nine unlabelled pills. Ten discs: nine sections plus the crown; the trunk disc is You, the root disc is Ground. A disc key shows once for 2.4 s after the cutscene (names beside discs), then names fade; long-press or hover restores a name for 1.2 s. Filled disc = unseen card; ring = opened. The binding limb's disc is 1.4× with the collar ring; pruned limbs' discs mist at 60%; unfinished sections' discs are hollow. One card at a time in the clearing: the camera goes there first, then the card appears.

```
1440x900
+----------------------------------------------------------------------+
| Mercer                                                        ♪  ◔   |
|                                                   ●crown             |
|  The offer                                     ~~~~~~~~~~~~          |
|  Moves most                                 ~~~~~~●~~~~~~~~~~~       |
|                                            ~~~●~~~~~~~~~~~●~~~       |
|  Price £4,800  your answer                  ~~~~~~~~●~~~~~~~~~       |
|  A 10% rise adds £49k over 12 months           ~~~●~~||~~~●~         |
|  Difficulty medium · Return rank 1                   ||              |
|                                                      ○ you           |
|  Restraint: capacity binds from Nov 2026           ≈≈||≈≈            |
|  at £77,400 a month                              ≈≈≈≈||≈≈≈≈          |
|                                                ≈≈    ●ground ≈≈      |
|  ▾                                                                   |
|                                                                      |
|                                              ( Harvest )             |
+----------------------------------------------------------------------+
390x844
+----------------------+
| Mercer         ♪  ◔  |
|      ~~~~~~~~~~      |
|    ~~~~~~~~~~~~~~    |
|   ~~~~~~~~~~~~~~~~   |
|      ~~~~||~~~~      |
|          ||          |
|        ≈≈||≈≈        |
| ● ● ● ● ● ● ● ● ● ○ >|
|----------------------|
|  The offer           |
|  Moves most          |
|  Price £4,800  yours |
|  +£49k per 10%       |
|  Restraint: capacity |
|  binds from Nov 2026 |
|  ▾        ( Harvest )|
+----------------------+
```

On the phone the discs are a scrollable row between the tree and the card (Ascent's phone rule); ten collision-nudged discs on a 380 px tree would overlap.

### S8 Harvest

One glass button "Harvest" on S7 (bottom right of the clearing) opens it; the tree stays behind, roots and crown in frame, camera dist 1.2. **Decision (harvest actions):** four buttons with one word each on a fill in a learnt colour (Ascent); never unlabelled discs (Instrument). Green (`--you`) = "For your AI" (markdown of your answers), slate (`--estimate`) = "For people" (PDF of Mercer's reading), the crown hue (`--sec-crown`) = "Book a call", the You hue (`--sec-you`) = the archetype's name (the agent). Export to TMA (JSON) is a fifth, small, glass, only when a `db` capability or `M.researchLive()` exists.

```
1440x900                                        390x844
+--------------------------------------------+  +----------------------+
| Mercer                              ♪  ◔   |  | Mercer         ♪  ◔  |
|                          ~~~~~~~~~~        |  |      ~~~~~~~~        |
|  ( For your AI )      ~~~~~~~~~~~~~~~      |  |     ~~~~~~~~~~       |
|  A markdown file, every    ~~||~~          |  |        ||            |
|  figure and its source       ||            |  |      ≈≈||≈≈          |
|                            ≈≈||≈≈          |  |----------------------|
|  ( For people )          ≈≈  ||  ≈≈        |  |  ( For your AI )     |
|  A three-page PDF                          |  |  ( For people )      |
|                                            |  |  ( Book a call )     |
|  ( Book a call )                           |  |  Open to everyone.   |
|  Open to everyone. Score 21 of 100.        |  |  ( The Maker )       |
|                                            |  |                      |
|  ( The Maker )  for Zach                   |  |                      |
|  [ Ask about your tree            ]        |  |                      |
+--------------------------------------------+  +----------------------+
```

### Transitions

| From → to | What happens | Duration |
|---|---|---|
| S0 → S1 | the seed stays put; text fades; roots begin | 400 ms |
| S1 → S2 | demo leaves and demo roots fade out (600 ms); camera dives below the ground line | 1.2 s |
| S2 → S3 | Plant: camera rises through the ground line; trunk grows; stubs reach out; the caption | 3 s |
| S3 → S4 | flight to the first limb, limb grows in the last 500 ms | 900 ms |
| section → section | question exits (180 ms), whoosh glides from old limb x to new limb x, camera 900 ms, sky drift 1200 ms, the new section's eyebrow and first question enter at 700 ms | 1.1 s |
| question → question | 180 ms out (fade + 8 px down), 60 ms gap, 260 ms in (fade + 8 px up); Back reverses the direction | 500 ms |
| Money → Best clients | the camera climbs to the top limb (pitch 0.42) | 900 ms |
| Best clients → You | the camera descends to the trunk, yaw 0.9, target trunk mid-height | 1.2 s |
| You → Ground | the dive: pitch 0.36 → −0.35, target 0.4 below ground, sky → soil, birds fade to 20% | 1.2 s |
| Ground → S6 | camera rises to ground level looking up, then up the trunk while the crown lights; birds return; beat 1 at 2.4 s | 2.4 s |
| S6 → S7 | last beat fades; discs pop (scale 0.6 → 1, 240 ms, 60 ms stagger); disc key 2.4 s | 1.1 s + 2.4 s |
| S7 → S8 | camera dist 1.2; the harvest buttons enter 60 ms staggered | 600 ms |

---

## 3. The tree

### What it shows at each stage

| Stage | Trunk | Limbs | Twigs and leaves | Roots | Core |
|---|---|---|---|---|---|
| S0 | seed only | none | none | none | none |
| S1 | grows across the beats, demo shape | six, stubs then solid | demo leaves in beat 2 in all four source colours, removed at S2 | four demo bundles, removed at S2 | shown in beat 2 as an empty square, then filled with demo points, emptied in beat 3 |
| S2 | seed | none | none | one rootlet per committed field on `you` (website on `web`) | none until `sector` and `now` hold and the first run has finished; then the band appears with no numbers |
| S3 | grows to `S_REST` height | six pale stubs at 40% length, bark at 22% ink, a faint dashed spine | none | as left by S2 | pulses once when the planting run lands |
| S4 | as S3 | the limb in play solid and lengthening with answered share (`f = .4 + .6 × answered/asked`); sections not entered stay stubs; sections entered stay solid | twig on show, leaves on commit, ring or cut face by cause (below) | grow by source count; `you` and `web` also from You and Ground | points ease 300 ms after every engine run; the bark wave runs base to crown |
| S5 | as S4 | the limb pulled back into view | complete | as S4 | as S4 |
| S6 | rises from `S_REST` toward the goal height across the beats (`H_TODAY` to `H_GOAL` by `progress`) | all solid; the binding limb wears the collar | lit share = odds (`recolourLeaves`) | full | expands to 640 × 260 with the month axis and three quantile labels in the crown card |
| S7 | as S6 | the selected limb keeps its bark colour, others lerp 30% to the sky (`select`) | as S6 | full; the root card lists the sources | in the crown card only |
| S8 | as S7 | as S7 | as S7 | full | none |

### Twig states by cause (Ascent, request 8 and 37)

- **Not shown**: nothing. A twig exists only once its question has been shown (`tree.setTwigs` receives the asked list).
- **Shown, unanswered**: a twig at full length ending in one pale bud (`--bud`, 0.06 units).
- **Answered**: the bud opens into a leaf cluster of `6 + 8 × grade` leaves over 700 ms, 22 ms stagger, in the source colour (`you`, `web`, `sector`, `assumed`).
- **Not sure, with an engine stand-in** (`BANK_OF`: price, closeRate, capacity, budget, margin, channel, cycle): the cluster is `--estimate` slate, grade 2.
- **Not sure, no stand-in**: a ring at the twig tip (torus, radius 0.03, `--bud`), no leaves.
- **N/A**: the twig cut to 40% ending in a small cut face (`cutFace` material, radius 0.02). The question leaves the queue for good.
- A limb is a pale stub until its section is entered, then lengthens with answered share; at the crown, an unfinished limb keeps its buds and rings and its disc is hollow. Pale means unfinished; nothing counts.

### How an answer becomes leaves (the brain, request 14 and 15)

1. Every question has a `driver` (limb) and a `grade` 1..5 (`gradeOf` on its `scale`; 3 for presets and text; `max(1, round(n/2))` for tens; `min(5, 2 + picks)` for multi).
2. **Commit → flight.** The rendered value (the figure or the chosen word, display face, source colour) lifts 8 px off the control, shrinks to 30% and travels a cubic path to the twig tip in 620 ms; opacity 1 → 0 over the last 120 ms. The twig's bud opens into the cluster on arrival. The commit sound crossfades between two panners from the control's x to the twig's x (Instrument).
3. **Engine run → the Core.** When the answer is an engine input, `flow` re-runs the forecast (300 ms debounce, unchanged). 300 ms after the result lands, the Core's points ease to their new positions over 520 ms and a wave of bark lightness runs base to crown over 600 ms (leaf lightness +6% for 300 ms). No pulse runs along the limb; no pipes; no sparks. This is the whole brain: one box, one wave.
4. **Roots.** `setRootSources(rootCounts(dataPoints()))` with `dataPoints()` gated on `asked` and `schemaApplies` (request 8): `you` per fact the visitor gave, `web` per website suggestion pressed, `sector` per stand-in accepted with Not sure, `assumed` per Mercer estimate accepted with Not sure. Unasked questions emit no point.

### The Core (Instrument's Well at Window's place)

A 148 × 88 square at the trunk base, in the world (a DOM element placed each frame by `anchor('roots')` nudged 24 px toward the clearing), hairline `--line`, fill `--veil`. Inside: every 10th of the 4,000 sorted draws of `result.months[m−1]` (m = `state.months ?? 12`) as 400 points on a square-root x axis from `0.96 × min` to `max`, y jittered, `--ink` at 35%; the p25..p75 band a soft rectangle behind; a hairline at `now` in `--ink`; a hairline at the goal in the section hue when there is one. **No axis and no numbers during the interview** (the reveal is not spoiled). Points ease 520 ms on re-run; new points are born where the flight landed. It does not exist until `state.sector && state.now` hold and a run has finished (no "empty" word, no frame sitting there). At S6 beat 2 it expands to 640 × 260 with the month axis and the three quantile labels inside the crown card; in the interview at 390 it is 56 × 34 on the trunk base and opens full-size on tap.

### The live label

One label, always the part in play: "{Section} · {Question title}" in text 500 14 px, `--ink` at 80%, a 6 px dot in the section hue before it. Anchored by `anchor(limbId)` (or `anchor({limb:'demand', t:.35 | .8})` for Reach and Routes), nudged 18 px into the clearing, never crossing the bark. At S5 it reads the section name alone; at S7 the selected branch's vocabulary term ("Moves most", "First limit"). Fades 120 ms out and in on change; never slides. Hidden when the tree is under 240 px tall.

### Roots and crown balance (request 52)

`R_crown` = radius of the leaf envelope from live cluster positions. `R_roots = R_crown × own / all` where `own = you + web` and `all = own + sector + assumed` in use (Window's rule; **Decision:** it is cleaner than Ascent's 80% threshold and Instrument's shared log denominator). Root depth `= 0.9 × R_roots`. `setRootSources` keeps the per-bundle proportions inside that radius. You and Ground answers are roots (`driver: 'roots'`), so the root ball thickens through the last two sections and the CV adds one strand.

### Camera presets

All `{ yaw, pitch, dist × whole-tree frame, target }`, eased 900 ms, `cubic-bezier(.2,.75,.1,1)`. Yaw is chosen so the limb points into the clearing. At 390 add +0.08 pitch to every preset so the limb sits above the clearing.

| Stage / section | Preset |
|---|---|
| S0 | dist 0.55, pitch 0.05, target seed |
| S1 | dist 1.0, pitch 0.15, slow yaw 0.05 rad/s |
| S2 Roots | dist 0.7, pitch −0.35, target 0.4 below ground |
| S3 | tween S2 → dist 1.0, pitch 0.12 over 3 s |
| 1 The offer (pricing) | yaw `LAYOUT.pricing.az − 0.45`, pitch 0.30, dist 0.62, target limb midpoint |
| 2 Reach (demand base) | on `demand`, target at t 0.35, dist 0.58 |
| 3 Routes in (demand tip) | on `demand`, target at t 0.8, dist 0.5 |
| 4 The close (conversion) | same rule on `conversion` |
| 5 Delivery (capacity) | on `capacity` |
| 6 Money (margin) | on `margin`, pitch 0.38 |
| 7 Best clients (retention) | on `retention`, pitch 0.42 |
| 8 You (trunk) | yaw 0.9, pitch 0.10, dist 0.55, target trunk at 0.5 height |
| 9 Ground (roots) | S2 preset, dist 0.85 |
| S5 | the section preset, dist × 1.3 |
| S6 | ground level pitch 0.02 rising to pitch 0.18, dist 1.15; beats 2 to 6 dolly to 1.0; orbit 0.06 rad/s |
| S7 | dist 1.1, pitch 0.16; a selected limb uses its preset at dist × 1.15 |
| S8 | dist 1.2, pitch 0.2 |

Drag turns the tree (existing inertia) from S3 on, except while a text field has focus or an instrument is mid-drag; the preset resumes on the next section change. Idle orbit only at S1, S6, S7 after 6 s.

### The results view

The same scene at a greater distance. Nothing about the tree changes between S5 and S6 except height (revenue), lit share (odds), fruit (margin, existing, count `round(margin × 16)` at the crown only) and the collar on the binding limb. Every card is anchored to the thing it describes; the camera goes there first.

### tree3d.js changes (all additive; owner (b) in WORK.md)

`setStub(limbId, bool)`, `setTwigs(limbId, [{ id, state: 'bud'|'leaf'|'estimate'|'ring'|'cut', grade, kind }])` (cap 12 per limb, replaces the 4-cap `setDetail`), `setLimbFill(limbId, f)`, `setLabel(limbId|part, text)`, `flight(fromXY, limbId, twigId, text, kind)`, `frame(preset)`, `anchor({limb, t})`, `crownRadius()`, `setRootBalance(ownShare)`, `wave()`, `setDiscs([{ id, part, state, scale, collar }])` (re-enables the dormant `placeLabels` code), portrait framing when the canvas is taller than wide, `leafCap` raised to 4,608 (72 clusters × 64), `buildDots` and both dot meshes removed. `setData` keeps its signature and routes to twigs.

---

## 4. The interview

### Sections, in order

**Decision (order):** the ascent climbs the limbs in the order they leave the trunk (Ascent's shape), then descends to the trunk (You) and the roots (Ground). Best clients therefore comes after Routes in, so the 80/20 sorter can name the routes the visitor marked. Roots-stage questions stay at the landing (bestWorst next to revenue, per judge 3).

| # | Section (eyebrow) | Purpose, said once | Part | Hue token | Questions (ids), in order |
|---|---|---|---|---|---|
| R | Roots | who you are | roots | `--sec-ground` | biz (S0), now, bestWorst, place, sector+trade, site, yearsTrading, goal+appetite+basis, months |
| 1 | The offer | what one sale is worth | pricing | `--sec-offer` | repeatWork, price (one / several / retainer range), priceSpread (not when retainer or several), included, upsell, priceRaised |
| 2 | Reach | who is out there | demand, t .35 | `--sec-reach` | buyer, radius, market (Prospects), listSize (Contacts), season, competitors, idealCustomer |
| 3 | Routes in | how they find you | demand, t .8 | `--sec-routes` | channel (routes), went, spend (spendNow + budget), spendSplit (when ≥ 2 live routes), marketingOwner, agency (+ agencyFee, agencyWhy), contentTime, tracking |
| 4 | The close | how enquiries become sales | conversion | `--sec-close` | enquiries (quotes as its second handle), closeRate, cycle, responseTime, followUps, website, reviews, chooseYou, chooseThem |
| 5 | Delivery | how much you can take on | capacity | `--sec-delivery` | capacity (who + at most + now), teamSize, leadTime, jobLength, breaksFirst, qualitySlip, subcontract, holiday, hiring |
| 6 | Money | what you keep | margin | `--sec-money` | margin, fixedCosts, terms (+ owed), discounting, runway, software |
| 7 | Best clients | who pays you most, and why they came | retention | `--sec-clients` | lastFive (new), topShare (new), repeat (retainerRenew when retainer), stay (retention / retainerMonths / returnGap), newVsRepeat (repeat/mixed), ltv (mixed), bestEver |
| 8 | You | what you bring | trunk | `--sec-you` | hours, strengths+avoids, win, help, risk, personality, cv |
| 9 | Ground | what feeds the tree from outside | roots | `--sec-ground` | network (new), funding (new), dataOffer (Records), wontDo, deadline, successWords, note (Anything else) |

**Cut from v11:** `quotes` as a separate question (the second handle of Enquiries); `systems` (derived from the software ledger's filled ids: crm, booking, email, ai, plus 'none' when the ledger is empty); `stack` as a search list (the ledger replaces it); `retainerValue` as a lone figure (the fee slider writes it). **Kept** against Window's cuts, because no new instrument captures the fact: `jobLength`, `qualitySlip`, `newVsRepeat`, `ltv`, `dataOffer`, `note`. He said the questions are very good.

Within a section the engine questions (price, capacity, budget) keep `queueOf()`'s elasticity ordering; a weak one is asked last, never skipped (a skipped question would leave a bud the visitor cannot close), and its headline carries the mist word "minor". The section order replaces chapter order; `M.CHAPTERS` becomes `M.SECTIONS`.

### Headlines, subheads, explanations

Every headline is a button; pressing it slides the explanation under the subhead (220 ms, `feel.toggle`). Copy rule (Instrument): name the thing counted, the period, and the one exclusion; append the elasticity line "A 10% change here moves the forecast about {x}%" only for engine inputs (price, closeRate, capacity, budget, margin, market, cycle, repeat). All copy is in COPY.md §4. Headlines are sentence case ("Ideal prospect", "Contacts"); no caps, no tracking.

Examples in placeholders and ghost phrases: "ABC Consulting", "XYZ Studio", "a firm of our size in the next town", "two national names and three local ones". No trade that sounds real. ghost.js sets are rewritten trade-neutral.

### Insight per leaf

Rule: one sentence, computed only from `state`, `M.result.bank`, `M.measured`, `M.planned`, macro.json rows, and `prior[key]` = `bank[key].value` snapshotted **on question entry** while `bank[key].from === 'sector'` (Window; v11's numBox hint already does this). `typ(key)` returns `prior[key]` only after that question has been passed (Instrument's discipline, request 8): no sector figure appears on screen before its question. No sentence when a field is missing; no sentence that restates the answer; silence beats an obvious line. Figures use tabular numerals. Templates with fields and conditions are in COPY.md §6; the rule set that changed from Window:

- `now`: no insight at Roots (the sector deal value is not yet earned). The sales count appears on the price leaf.
- `bestWorst`: `worst > 0` → "Your best month is {one(best/worst)}× your worst; today sits {pct((now−worst)/(best−worst))} of the way from worst to best." `worst == 0` → "Your best month is £{best}; today's £{now} is {pct(now/best)} of it." Never a £0 line.
- `yearsTrading` (Ascent): "£{now/years} of monthly revenue added per year, on average." when years ≥ 1.
- `holiday` stops with `who == 1` (Ascent): "It stops and only you do the work: capacity is you."
- `upsell` could: "An upsell would sit on top of the forecast; Mercer counts one sale per customer."
- Engine priors the outputs do not carry (cold-email reply share, referral reply share, thetaBook, thetaShow) appear nowhere.
- `wontDo` cold: "Cold outreach is off limits: Mercer brings that to the call." (It does not claim a removal until `wi()`'s accepted strings are read; see unresolved.)

### Insight per branch and root (S5)

Computed at branch close from `M.measured` (entries, binding) and the section's answers (COPY.md §7). Roots (S2 end): no count; "The tree stands mostly on your own answers" / "on Mercer's estimates" by `own/all ≥ .5`, said with root width, not a number.

### Insight overall (S6 last beat, crown card)

canopy.js `summary()`, unchanged in construction, "in half of Mercer's simulations" → "in half of 4,000 runs", dashes and filler cleaned.

---

## 5. Instruments

Every instrument answers one thing with a thumb, needs no legend, has a 44 px hit target, shows its value in the display face (56 px at 1440, 44 px at 390, tabular) with the unit in text 400 13 px beside it, and has three states: rest, active (section hue on the moving part, 2 px), committed (240 ms settle, then the flight). Commit on release, never on drag, so the leaf grows once; nothing moves under a pointer mid-drag. Keyboard on every one: arrows step, Shift × 10, Enter commits and presses Next, Escape reverts; never announced. `touch-action: pan-y` on the world, `none` on rails and rings; one-finger drag on an instrument never turns the tree. The foot row: Back (‹), Not sure (Mercer's estimate where one exists, else skip), N/A, Next.

| Instrument | Used by | Geometry and behaviour | Writes |
|---|---|---|---|
| **Figure slider** | now, price, enquiries, market, listSize, network, teamSize, owed, agencyFee, contentTime, hours, ltv, fixedCosts lines | display figure you can type into; 320 × 2 px log rail beneath with two ticks at the schema `scale` low and high; fill in the section hue graded by opacity (§6); k/m suffixes; snaps £50 under £2k, £100 under £20k, £1k above; arrows step 1% of scale | the key |
| **Pair slider** | spend (now, ceiling); enquiries (all, quoted); capacity (now, at most) | one rail, two ring handles that cannot cross; the band between tinted; the second handle appears when the first commits; the band reads "room for N" on capacity | spendNow + budget; enquiries + quotes; servedNow + capacity |
| **Fee slider** (Instrument §5.2) | retainer fee | rail 400 × 2 px, log £100..£20,000; two 22 px ring handles (min, max); a 10 px filled average marker clamped inside and pushed by either handle; three tabular figures above (min left, avg centred 32 px, max right); Tab cycles min → avg → max | `retainerMin`, `retainerMax`, `retainerValue` (avg); `priceSpread` derived (fixed < 1.25×, some < 2×, wide < 5×, huge ≥ 5×) and marked answered; `derive()` keeps `price = retainerValue × stayMonths` |
| **Months band** | bestWorst | the revenue-now figure as a fixed mark on a log track, two handles either side; worst ≤ now-ish not enforced, worst ≤ best enforced | `bestWorst = [best, worst]` |
| **Ten stones** | closeRate, repeat, retainerRenew, followUps | ten 44 px glass stones in a row, tap the nth or drag across; filled stones take the section hue; a small "<1" stone before the row for close rate; "10+" for follow-ups | n/10 |
| **Ring** | topShare, margin (no price) | 160 px ring (140 at 390) dragged round, figure inside, steps of 5 | 0..100 |
| **Kept ring** | margin with a price | the ring as 100 segments; a cost well under it "costs £{price×(1−margin)} of £{price}" that also sets the ring | `margin` |
| **Stones in a line** | every preset and multi | glass pills 44 px, one row, at most six; the rest fold under "more"; arrows move, Space toggles | the key |
| **Arc** | cycle, stay, leadTime, months | the months dial's arc with ticks at the presets; the label reads the chosen word | the key |
| **Capacity three-part** | capacity | four stones for who; a pair slider for now and at most drawn as one trough (the room gauge); the unit word at the right end | who, servedNow, capacity |
| **Routes shelves** | channel | four shelves (Warm 1-1, Warm 1-many, Cold 1-1, Cold 1-many), six pills each visible, "more" folds the rest; press once = doing (filled), twice = tried (outlined), thrice = clear; a tried pill opens a three-stone row (worked, mixed, no result); search above; the "Main route" stones appear when ≥ 2 engine channels are doing | doing, tried, went, channel |
| **80/20 sorter** (Instrument §5.11) | lastFive | five 28 px ink discs labelled 1..5; five bins (Warm 1-1, Warm 1-many, Cold 1-1, Cold 1-many, Can't say), 72 px wells with a dashed outline; drag, or tap a disc then a bin, or Tab to a disc and press 1..5; a second tap on a placed disc offers the routes marked in Routes in that quadrant plus "Another way" (Ascent); all five placed to commit; each bin grows a side twig on the Routes fork with leaves = count × 8 | `lastFive = [{ bin, route|null } × 5]` |
| **Software ledger** (Instrument §5.13) | software | sixteen STACK rows, a 15 px label and an empty underline each; the cursor lands on the first; the category's `eg` as ghost text; a £/month well appears after two typed characters; Tab moves down; pre-fills from `tracking` and `website` are ghost only, never committed; six rows visible at 1440, four at 390, scroll inside | `stack[id]` £, `stackNames[id]`; `systems` derived |
| **Sort** | strengths + avoids | six tiles in the middle; drag left to "good at", right to "avoid" (60 px), or tap once / twice | strengths[], avoids[] |
| **Table ring** (Instrument §5.10) | help | 160 px ring in `--line`; you as a 16 px ink disc at the centre; seats at 12, 3, 6, 9 o'clock as 14 px hollow rings; one dotted seat outside at 1 o'clock = an agency; tap to fill; team seats hidden when `teamSize === 1 || who === 1`; a monochrome diagram, no figures, no icons | `help`: none = alone, one = partner, two+ = team, outside = agency |
| **Two-sided stones** | personality | four rows of two pills with the axis phrases; a "Know your letters" stone opens the 16-type grid | `personalityAxes` → `personality` |
| **CV socket** (Instrument §5.12) | cv | 220 × 64 px slot, dashed `--line`, label "CV", subhead "Paste it, or not", a "Later" stone beside it; paste, drop or tap to open a textarea in place; on paste the outline turns solid in `--you` (300 ms), a flat disc grows 0 → 40 px inside (400 ms), the power-up sound plays, the `you` root bundle gains a strand, `cvLine` appears; Clear reverses it | `cv`, `M.cvFacts` |
| **Line** | included, competitors, idealCustomer, bestEver, agencyWhy, deadline, successWords, note | one growing line with ghost completion (ghost.js, trade-neutral sets) | the key |
| **Appetite dial** (Instrument §5.3) | appetite | 96 px ring (120 at 390), five detents at −120°, −60°, 0°, 60°, 120°; a 14 px knob; the level word under it; the budget line under that in mist. At Roots only None and Boutique print figures (both from `now`); Moderate, Aggressive and Maximum print their figures at the Crown (they need margin and the ladder). The arc fills from mist (None) to the section hue (Maximum); no gold token | `appetite`; sets `basis` and `budget` per §10 |
| **Months arc** | months | the existing dial as an arc | `months` |
| **Figure field** | yearsTrading | four digits, no rail | `yearsTrading` (year → years) |

Routes shelves, quadrant table (fixed once; the familiarity order is an estimate, stated in a code comment; every id is a DIST id; `abm` and `com-whatsapp` do not exist and are not used):

- **Warm 1-1** (referral, partnerships): referrals, reactivation, network, suppliers, resellers, introducers, piggyback, affiliate, customer-referral, white-label.
- **Warm 1-many**: internal-social, newsletter, events, chambers, workshops, host-meetup, case-studies, webinar, podcast, own-community, speaking, awards, sponsor-local.
- **Cold 1-1**: cold-email, dm-linkedin, cold-call, dm-instagram, dm-facebook, whatsapp, canvassing, direct-mail, handwritten, dm-tiktok, sampling.
- **Cold 1-many**: org-facebook, org-instagram, ads-facebook, ads-search, seo, maps, org-linkedin, org-youtube, org-tiktok, reviews, directories, flyers, ads-instagram, local-media, retargeting, ads-linkedin, ads-youtube, ads-tiktok, creators, spon-newsletter, spon-podcast, trade-shows, conferences, marketplaces, comparison, pr, app-stores, free-tool, free-tier, geo, books, studies, org-x, ads-bing, ads-nextdoor, org-nextdoor, com-facebook, com-linkedin, com-reddit, com-instagram, com-discord, com-x, com-slack, com-skool, com-whop, com-mumsnet, franchise, investors.

Warm bins map to engine channels referral and partnerships; cold bins to cold-email, linkedin, cold-calling, paid-search, paid-social, content-seo. The `cold-call` pill is hidden when `buyer === 'consumer'` and `sector === 'finance'` (pensions, claims, COBS 4.8), shown everywhere else; its explanation is the two sentences in facts-coldcalling.md verbatim; "illegal" appears nowhere.

`state.buyer` holds a preset key only; a pressed website "who" chip writes `state.buyerNote` (string, briefing only). **Decision:** this fixes the double declaration before the Buyers instrument is built.

---

## 6. Colour

Tokens on `:root`; redefined under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`. `body` carries `background: var(--sky)`. Both modes first-class from the first frame.

**Colour budget** (judge 3's cap): four source colours are the only meaning on the tree; ten section hues share one OKLCH lightness and chroma (light L .52 C .09, dark L .74 C .10; the ground hue at C .05/.06); warm and cold are two tints used only inside the routes instruments and the routes card; the collar is the existing amber; grades are opacity steps of `--you`, not five hues. Emerald survives only as the `you` source.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sky` | #E8EDE8 | #0B110E | page and canvas clear colour |
| `--sky-2` | #DCE2DB | #06100B | horizon gradient (bottom 40%) |
| `--soil` | #D6D2C6 | #10130F | below the ground line at S2 and Ground |
| `--ink` | #14201B | #EEF3EF | headlines, figures |
| `--ink-2` | #4A5751 | #AEB9B2 | subheads, body |
| `--ink-3` | #7E8982 | #74827A | eyebrow, ticks, units, "minor" |
| `--line` | rgba(20,32,27,.12) | rgba(238,243,239,.14) | hairlines |
| `--veil` | rgba(232,237,232,.58) | rgba(11,17,14,.44) | the clearing's flat fill |
| `--glass` | rgba(255,255,255,.38) | rgba(255,255,255,.07) | button and field fill |
| `--glass-line` | rgba(20,32,27,.16) | rgba(238,243,239,.18) | button edge, 1 px |
| `--glass-on` | rgba(255,255,255,.62) | rgba(255,255,255,.14) | pressed, and Next |
| `--you` | #4C8A5E | #6FB585 | source: your answer |
| `--sector` | #B8791F | #D99A3F | source: industry figure |
| `--web` | #2A8C9C | #4FB3C3 | source: website |
| `--estimate` | #6F7FA3 | #8E9DC2 | source: Mercer's estimate |
| `--bud` | #B9C2BC | #3A4A42 | unfinished (bud, ring) |
| `--warm` | #C98A3C | #E0A45C | warm routes tint |
| `--cold` | #5A7FA8 | #7FA3CC | cold routes tint |
| `--collar` | #C57A10 | #E3A24A | the binding limb's collar and disc ring |
| `--sec-offer` | #52743E | #8FB979 | The offer (h 135) |
| `--sec-reach` | #386E99 | #73B1E6 | Reach (h 245) |
| `--sec-routes` | #5F639C | #9EA4E9 | Routes in (h 280) |
| `--sec-close` | #007979 | #50BFBE | The close (h 195) |
| `--sec-delivery` | #795A90 | #BE99DA | Delivery (h 310) |
| `--sec-money` | #816422 | #C8A65D | Money (h 85) |
| `--sec-clients` | #905A33 | #DC9A6C | Best clients (h 55) |
| `--sec-you` | #8F5270 | #DB91B4 | You (h 350) |
| `--sec-ground` | #7F624C | #C8A285 | Roots and Ground (h 60, low chroma) |
| `--sec-crown` | #876125 | #D0A260 | S6, S7 crown card, Book a call (h 75) |
| `--tint` | = the live section's `--sec-*` | | drift source |

Grades: `--grade-1..5` = `--you` at 24%, 40%, 60%, 80%, 100% alpha (`color-mix(in srgb, var(--you) N%, transparent)`).

**Drift rule** (Window, with Ascent's OKLCH family): `--sky` becomes `color-mix(in oklab, var(--sky-base) 94%, var(--tint))` in light and 91% / 9% in dark; `--sky-2` the same at 88% / 84%. The progress ring, the eyebrow dot, the live label dot, pressed stones, the pair-slider band and the moving part of every instrument use `--tint` at full strength; text never takes the tint. Inside a section each commit nudges the sky mix 1% further toward the tint (max 6%), reset on section change (Instrument). Transition 1200 ms in oklab on section change. S6 cycles the tint through the nine over the beats; S7 takes the selected section's; S8 takes `--sec-crown`. **Decision:** no radial wash centred on the limb (Ascent): round 11's no-glow rule stands; drift reaches the page only through the flat sky mix.

Tree palette: tree3d THEMES stay, with `leaf` light #5A8A62 / dark #4A8A5C so the crown reads greener than the moss `--you` leaves.

Glass: fill `--glass`, edge 1 px `--glass-line`, no `backdrop-filter`. Next uses `--glass-on` and text 500; never a solid ink pill.

---

## 7. Type

```
--f-display: "Financier Display", "Newsreader", Georgia, serif;   /* 300, font-optical-sizing: auto */
--f-text:    "Metric", "Figtree", system-ui, sans-serif;            /* 400, 500 */
```

`@font-face` slots `fonts/FinancierDisplay-Light.woff2` (300), `fonts/Metric-Regular.woff2` (400), `fonts/Metric-Medium.woff2` (500), published with the page, empty until licensed files are dropped in. Stand-ins: the build fetches `https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300&family=Figtree:wght@400;500&display=swap` once; if it fails, the two verified single-family URLs from facts-fonts.md.

| Role | Face | 1440 size / line | 390 | Notes |
|---|---|---|---|---|
| Cutscene figure | display 300 | 96 / 100 | 64 / 68 | tabular |
| Big figure (instrument, card headline figure) | display 300 | 56 / 60 | 44 / 48 | tabular |
| Headline (question, card title) | display 300 | 40 / 44, −0.01em | 30 / 34 | sentence case |
| Intro caption, branch insight, overall sentence | display 300 | 30 / 38 | 24 / 30 | |
| Subhead | text 400 | 17 / 24 | 16 / 22 | `--ink-2` |
| Body, insight sentence | text 400 | 16 / 24 | 15 / 22 | his "smaller text" stays: 15/16 body, 13 small |
| Eyebrow, live label, ticks, stones | text 500 | 14 / 18 | 13 / 16 | no caps, no tracking |
| Small (source word, unit, credit) | text 400 | 13 / 18 | 12 / 16 | `--ink-3` |
| Button | text 500 | 15 | 15 | |

`font-variant-numeric: tabular-nums` on every container where two figures sit in a column (cards, the leaves list, the ladder, the month table, the exports). No mono, no caps tracking, no text shadow.

---

## 8. Motion

Easing everywhere `cubic-bezier(.2,.75,.1,1)`. Under `prefers-reduced-motion` every duration is 0 except opacity fades (120 ms) and the camera (200 ms, no orbit); the cutscene becomes six fades; the flight becomes a 120 ms fade at the twig.

| What moves | When | Duration | Notes |
|---|---|---|---|
| Camera preset | section change, card open, S6 beats | 900 ms | one move at a time; a new target retargets from the current pose; the two dives 1.2 s |
| Limb growth on arrival | last 500 ms of the flight into a section | 500 ms | stub → current fill |
| Limb fill | answered share change | 500 ms | |
| Slow orbit | S1, S6, S7 idle after 6 s | 0.05 rad/s | stops on pointer down |
| Question exit / enter | Next | 180 out, 60 gap, 260 in | Back reverses |
| Twig open | question shown | 240 ms | stub to full length, bud appears |
| Flight | commit | 620 ms | text 100% → 30%, cubic path, opacity out over the last 120 ms |
| Leaves | flight arrival | 700 ms, 22 ms stagger | scale from 0 with a 12° unfold |
| Core settle | 300 ms after an engine result | 520 ms | points ease x; new points born at the arrival point |
| Bark wave | with the Core settle | 600 ms | lightness base → crown; leaf lightness +6% for 300 ms |
| Sky drift | section change | 1200 ms | linear in oklab; per-commit nudge 400 ms |
| Stub to solid | section entered | 800 ms | opacity .22 → 1, dashed spine fades |
| Branch close pull-back | S5 | 900 ms camera, sentence at +500 ms | |
| Progress ring | every answer | 400 ms | arc length only |
| Live label | text change | 120 out, 120 in | never slides |
| Cutscene beat | S6 | 2,400 ms: figure in 400 (counts up, tabular), hold 1,600, out 400 | Space or tap skips a beat; Skip ends it |
| Disc key | S6 end | 2,400 ms | names fade |
| Card | S7 open / close | 260 / 180 ms | the card never scrolls the page; ▾ expands within it (`feel.toggle`) |
| Discs | S7 arrival | 240 ms, 60 ms stagger | scale .6 → 1 |
| CV socket | paste | 300 + 400 ms | outline solid, disc grows, one root strand 800 ms |
| Stone select | tap | 120 ms | ring draws in |
| Dial detent | release | 180 ms | knob snaps |

What never moves: the wordmark; the switch and the ring; the trunk base on screen from S3; the headline's position within a stage; the foot row; text while it is read; the tree while a text field has focus; anything under a pointer mid-drag. Nothing bounces, glows, blurs, or pulses on a timer.

---

## 9. Sound

feel.js keeps its graph (`master` 0.05 → destination, `soften` lowpass 6.8 kHz). Additions: `play(name, { x, x2 })` where `x` is the source's screen x as 0..1 and the optional `x2` a destination x; a `StereoPannerNode` per voice created **from the current `ctx`** (so `measure()`'s offline swap keeps working) inserted before `bus`; `tone()` and `air()` take `to` = the panner; `pan = clamp((x − 0.5) × 1.6, −0.7, 0.7)` (±0.4 at 390). With `x2`, two panners crossfaded over the voice's length. One mute switch (existing), `localStorage['mercer-sound']`; the gesture gate stays.

| Moment | Sound (for a synth) | Pan |
|---|---|---|
| Birds | three voices: sine with fast FM (carrier 2.4..4.2 kHz, modulator 40..90 Hz, index 0.6..1.4), 2..5 chirps of 60..140 ms per phrase, phrase every 4..11 s per voice, gain 0.18 of master, bandpass 1.8..5 kHz Q 1.2, 40 ms attack, 90 ms release; a fourth lower voice (1.1..1.6 kHz) answers one phrase in five. Gate: tree visible and sound on and stage ≥ S3 (no height threshold, so the phone hears them). At Ground, gain to 20% (underground); at S6 they fade out for the rise and return at beat 2; they fade 2 s out when a card opens at S7 and 2 s back when it closes. Density never rises. | fixed pans from the crown anchor: −0.5, −0.15, +0.3, +0.6 |
| Tap (stone, pill, detent) | existing `tap` | element x |
| Commit ("leaf") | triangle pluck, pitch by grade (G4, B4, D5, G5, B5 for 1..5), 4 ms attack, 160 ms exponential release, lowpass 3.2 kHz, plus a whispered air 1.2..3 kHz over 90 ms as the flight ends | glides from the control's x to the twig's x over 620 ms (two panners) |
| Estimate (Not sure) | the pluck an octave lower, gain 0.6, no air | twig x |
| N/A | air only, 2.6 → 0.8 kHz, 120 ms | control x |
| Root commit (You, Ground) | sine 110 Hz with a 220 Hz partial at 0.3, 10 ms attack, 380 ms release, lowpass 900 | −0.1 |
| Engine wave | sine 110 Hz + 220 Hz partial at 0.3, 600 ms, gain 0.25, envelope following the bark wave | trunk x |
| Section enter ("whoosh") | bandpassed noise 300 Hz → 2.4 kHz over 700 ms, gain 0.35, under a sine 220 → 330 Hz | old limb x → new limb x |
| Branch close | three notes in the section's key, root, fifth, octave at 90 ms spacing, sine with a faint octave, 220 ms release. Keys: offer G, reach C, routes D, close A, delivery E, money F#, clients B, you G, ground D | limb tip x |
| Insight appears | existing `next`, gain 0.5 | text x |
| Back | `next` reversed (880 then 587 Hz) | centre |
| Intro beat | existing `reveal` | centre |
| Planting | four sines C4 E4 G4 C5 staggered 120 ms, 1,800 ms release, with air 300 → 2000 over 900 ms; then the birds | the four notes at −0.5, −0.2, +0.2, +0.5 |
| CV power-up | sawtooth 200 → 900 Hz over 700 ms through lowpass 400 → 2400, gain 0.3, plus a sine 110 pad (200 ms attack, 900 ms release, 0.25) | socket x |
| Crown rise (S6 start) | C4 E4 G4 C5, one note per 400 ms with a slow lowpass, held 1.2 s, released 2 s | centre |
| Cutscene beat | one struck note per beat climbing a major scale from the key of the branch the figure belongs to; sine + 2nd and 3rd partials at 0.3 and 0.15, 6 ms attack, 900 ms release | figure x |
| Results arrive (S7) | existing `done` plus the octave; then the birds | centre |
| Card open / close | existing `open` / `close` | card x |
| Disc open | sine 1320 → 990 Hz over 90 ms, gain 0.3 | disc x |
| Export saved | `done` at gain 0.5 | button x |

Rate limits as today (30 ms tap, 50 ms others). Never two whooshes in a row; a section change during one retargets the pan.

---

## 10. The results

### The vocabulary (defined once on the first card opened, and in both exports)

| Term | Field | Meaning shown once |
|---|---|---|
| Moves most | `planned.sensitivity[0]` | the input a 10% change shifts the forecast by most |
| Return rank | `planned.levers` with `direction === 'up'` ordered by `magnitude / w`, w = 1, 2, 3 for low, medium, high | Mercer's steps ranked by revenue added per unit of difficulty; rank 1 is the highest return; opened, the arithmetic "+£X over twelve months ÷ {difficulty}" |
| Return per £ | `added.p50 / Σ planned.spend` | revenue added over twelve months per pound of growth spend |
| First limit | `planned.binding`, its `bindsAtMonth` and `ceiling` | the constraint that caps growth first, when, at what |
| Held back | `planned.unspent` | budget the plan could not place |
| Pays back | `planned.payback.p50` | months until added revenue covers the spend |
| Cost of waiting | `planned.inaction.p50` | what the median run loses if nothing changes |

"Best step +£2.6k reach more buyers" becomes "Return rank 1: broaden the reachable list, +£2,600 over twelve months, medium difficulty; restraint: your list runs out in month 7."

### The cutscene (S6), six beats

Figures are `M.planned` fields at `state.months`. No beat counts anything.

1. "{Name} grew a tree." The rise, roots to crown. (no figure)
2. Range: "£{p25} to £{p75}" / "a month by {Month YYYY}, in half of 4,000 runs". The crown lights to the odds share; the Core expands.
3. Target (revenue basis): "{ratio} runs reach £{goal}" / "by {Month YYYY}; the middle run gets there in month {k}" or "not inside twelve months". Budget basis: "+£{lo} to +£{hi}" / "more a month from £{budget}". The trunk rises to its goal height.
4. First limit: "{LIMIT_SHORT}" / "binds from {Month YYYY}" or "Nothing binds inside a year". The collar appears.
5. Return rank 1: "{lever title}" / "+£{magnitude} over twelve months, {difficulty}". Its limb brightens.
6. Alignment: "{score} of 100" / "Mission Alignment. TMA works above 65; the call is open either way." Then the discs and the disc key.

### The exploration model (S7)

One tree, one card at a time, ten discs. Tapping a disc, a limb, the trunk, the roots or the crown flies the camera and opens that card in the clearing. A card: title (display 30), the vocabulary term as eyebrow, at most six lines, one ▾ that expands the card in place with the section's leaves (every leaf insight, each row prefixed by its source dot and source word in small). No "Read more". Importance by size and order: the first line largest, the restraint second, source words small.

| Target | Card | Lines |
|---|---|---|
| Crown disc | {Name}, {Month YYYY} | overall sentence; Range £p25 to £p75 (8 in 10: £p10 to £p90); Target odds or Budget buys; Return per £; Cost of waiting; the Core full-size with the month axis; ▾ the month table (12 rows) and the vocabulary |
| Trunk disc (You) | Path to target | the ladder (below) with the appetite dial; ▾ every step with its restraint and sources; the archetype and the agent (below) |
| Pricing | The offer | Moves most or its elasticity line; price and source; Return rank of "Raise your price"; restraint; ▾ leaves |
| Demand base | Reach | first-limit line if market_depletion; prospects, contacts, network with sources; the map or the world; competitors (below); the weather (below); ▾ leaves |
| Demand tip | Routes in | funded routes from `planned.allocation` (monthly average, a bar each, warm or cold); the warm/cold share of the plan; the routes the visitor runs that the engine does not forecast; ▾ leaves |
| Conversion | The close | elasticity line; close rate and source; cycle; Return rank of "Close more enquiries"; ▾ leaves |
| Capacity | Delivery | first-limit line if client_capacity; utilisation peak and knee; Return rank of "Add one person"; ▾ leaves |
| Margin | Money | kept at the goal month (`p50 × margin`); Pays back; Held back; funding line; Software: free alternatives (below); ▾ leaves |
| Retention | Best clients | lastFive sentence; topShare sentence and the 80/20 advice (below); repeat and stay; ▾ leaves |
| Roots disc (Ground) | Ground | the root balance sentence; the four sources; ▾ the full "what went in" list, one row per fact with its source (the library's root) |
| Harvest button | S8 | |

Mission Alignment has no card: it is beat 6, the Harvest line beside Book a call, and the PDF. The sentence beside the score is `routingReason` cleaned plus "TMA takes on work above 65; the call is open either way."

### Path to target (trunk card)

Built from the visitor's answers and engine outputs only (facts-engine-realism §4). All runs happen in a Web Worker (`worker.js`) that receives a serialised `askOf()` and returns `{ key, budget, p50[], reach[], unspent, binding, bindsAtMonth, ceiling }` per rung, cached by `keyOf`; the ladder starts on entering S6 and never blocks Plant or the cutscene; a 1 px "working" arc runs on the dial until the rungs land. engine.js attaches to `window.MercerEngine`, so the Worker sets `self.window = self` before `importScripts('engine.js')`; if the Worker cannot start (CSP `worker-src`) the ladder runs in idle-scheduled chunks on the main thread.

1. Gap = `goal − p50(months[m−1])` at the visitor's budget. Zero or below: "On course at £{budget}: {ratio} of runs reach it." One rung.
2. Budget rung: `E.forecast(askOf({ budget: b }))` for b = b0, 2b0, 4b0 … up to 100 × revenue or until the median stops rising; bisect; b* = the smallest budget whose median reaches the goal in month m. "Spend £{b*} a month on growth (you said £{budget})". Restraint from `E.plan` at b*: the binding constraint, `bindsAtMonth`, `ceiling`; `unspent > 0` → "Mercer could not place £{unspent}: {unspentReason}". No b* → "No budget reaches £{goal} by {Month}: {binder} caps the median at £{ceiling}".
3. Month rung: "On your own budget the median reaches £{goal} in month {k}" or "not inside twelve months".
4. Lever rungs in Return rank order, each "{title}: +£{magnitude} over twelve months, {difficulty}"; restraint: for the binder's lever, the constraint it relaxes; for the others, the first constraint binding after the lever's 10% re-run (`capacityRescue` pattern); else "none inside a year".
5. Funnel rung in engine units only: "{sales} more sales, {meetings} held meetings, {leads} positive replies a month" from `gap / acv`, `/ close`, `leads[m−1]`, `added.p50 / Σleads`. No stage rate the output does not carry.
6. Capacity check when the sale is a client: "{goal / acv} clients a month against room for {0.85 × who × capacity − servedNow}".

The five appetite stops sit on the ladder as marks with the median each reaches; the p90 mark at Maximum is the room for outliers. The cutscene's figures and the crown card are always at the visitor's own budget. Printed once in mist: "Maximum cannot lengthen the run past twelve months or add channels."

| Stop | Budget used | Source shown |
|---|---|---|
| None | £0 (basis budget) | "Mercer's cost of doing nothing: inaction" |
| Boutique | max(£500, 5% of revenue) | "Mercer's default budget rule" |
| Moderate | 0.25 × revenue × margin | "a quarter of your gross profit (a pack constant; margin {yours / Mercer's estimate})" |
| Aggressive | b* | "the smallest budget whose median reaches your target" |
| Maximum | the rung where `unspent > 0` or the median stops rising | "the budget past which spend stops adding" |

The £66 → £10,000 case reads: "Median reaches £10,000 in month 4 at about £1,200 a month; month 3 needs about £1,500 and room for 3 clients a month; capacity binds first." Every figure is a run result, labelled.

### 80/20 advice (Best clients card)

Warm share of the plan = Σ allocation to referral and partnerships ÷ Σ allocation. Rules over `lastFive`, `topShare`, `planned.allocation`, `state.doing`, `tracking`:

- warm bins ≥ 3 and the plan's funded spend ≥ 60% cold: "{k} of your best five came warm and the plan spends {pct} cold: put the warm routes first; Mercer cannot model most of them, so the call does."
- warm bins ≤ 1: "Your best clients came cold: the plan's {top channel} matches how you already win."
- a bin's named route has an engine channel in `result.channels`: "Mercer already funds {route}." else with an engine channel: "Mercer does not fund {route} yet: the call should open it."
- topShare ≥ 50: "Three clients are {share}% of revenue: losing one is about £{now × share/300} a month, {n} months of the plan's added revenue." (`added.p50 / 12`)
- topShare < 25: "No client is more than a tenth of revenue: growth is volume, and capacity is the number to watch."
- `tracking` guess/no: "These five are memory: a lead-source column in your CRM (free options on the Money card) makes the next five data."

### The weather (Reach card)

From macro.json only. Three headline rows always (`boe_bank_rate`, `cpi_annual`, `gdp_qoq`), each "{label}: {value}{unit}, {period} ({source}, as of {asOf})" with the URL behind the row. Then the sector rows by `M.contentKey()` (Ascent's table; finance, property, creative and public get the headline rows only, per Instrument):

| contentKey | macro ids |
|---|---|
| professional-services (professional only) | sector_profserv_ons_output_3m, sector_profserv_boe_agents |
| private-healthcare (health only) | sector_healthcare_phin_selfpay_share, sector_healthcare_phin_selfpay_growth, sector_healthcare_phin_q1_2026_admissions |
| hospitality | sector_hospitality_ons_food_beverage_3m, sector_hospitality_ons_accommodation_3m, sector_hospitality_ukh_optimism |
| home-services (construction, home) | sector_construction_ons_rm_monthly, sector_construction_ons_private_housing_rm_monthly, sector_construction_boe_agents |
| e-commerce (retail) | sector_retail_ons_online_share, sector_retail_ons_online_values_yoy, sector_retail_ons_volumes_yoy |
| b2b-saas (tech) | sector_software_ons_computer_programming_monthly, sector_software_boe_agents, sector_software_techuk_conditions_challenging |

One rule line per visitor (COPY.md §11), each naming the state field it reads and the macro id; the word "projection" wherever `unit` says so; `asOf` printed on every row. Foot: "Read on 19 September 2026. Nothing here is a forecast of the economy, and Mercer's forecast does not use these figures."

### Free alternatives (Money card, ▾ Software)

For each ledger category the visitor filled, one row per tool from facts-free-tools.md: "{Category}: {tool}, {free tier or licence}, {main limit}" with the URL as the source word. Twilio reads "free to test"; Cal.diy and n8n carry their licence condition; row-15 tools say "tracking", not "attribution". Then one fixed line about building a tool with Claude Free or Ollama (rows 16). Total: Σ fees of filled categories that have a free row, "if the free tier's limits fit you".

### Competitors (Reach card)

Only what the visitor gave: the `competitors` line, the `chooseThem` reasons, the `chooseYou` edges, and one computed line: "You lose on {reasons} and win on {edges}; the plan's Return rank 1 is {title}, which {addresses / does not address} that." Mercer names no competitor. Empty → "You named no competitors."

### Mission Alignment

`alignment.composite` as a 120 px half-ring (existing gauge) in `--sec-crown` with the bar at 65; the seven components under ▾ with `componentWords`; `routeWords`; the fixed line about the call. Beat 6, Harvest, PDF.

### The archetype agent (trunk card ▾, and Harvest)

Header "{Archetype}" and "for {Name}" (archetypes.js `pick(personality)`; no type → "Answer the four either-ors to name your agent", no examples). Two lines; the two founders as public examples ("Jo Malone, Jo Malone London: {did}" with the source URL as the small word); no type is asserted for them. Then the chat: five chips (the five questions) and a free field. Answers are assembled in the browser by keyword rules from `lastFive`, `topShare`, `letterMeans`, the ladder's target and restraint, and the sourced `did`; anything else answers "Mercer does not know that" and points at the empty branch. **Decision (host model):** a stone "Use the host's model", off by default, shown only when `window.claude?.use` exists; on, the free field goes to `sample()` with the briefing and the card says "This question goes to the host's model; nothing else does." Never default-on. The panel says "Answers come from your tree, in this browser."

### The map (Reach card)

`M.isPhysical()` → the existing ring map (map.js, GeoNames, coast rings), 340 × 300 at 390. Otherwise (`radius === 'global'` or the sector's place `online` / `national`): a world outline from a published Natural Earth 110m land file (`data/land-110m.json`, about 80 KB, credited as `PLACES_CREDIT`), equirectangular, no spin, no rings, one lit point at the visitor's place when found, the figures reduced to prospects and contacts. **Decision:** places.js's coast rings serve Britain and Ireland only (map-views §5); the world needs its own file, published inside the CSP.

### Exports and the call (Harvest)

- **For your AI** (`--you` fill): `mercer-{slug}.md`, plain markdown: the overall sentence; the vocabulary with the visitor's values; every answer with its source; every engine output the cards used (range, added, levers, constraints, sensitivity, alignment components, allocation, month table); the ladder; every leaf, branch and overall insight; the weather rows with sources; the free-tools rows used; the archetype briefing; the header line "Nothing here left the browser until you saved this file."
- **For people** (`--estimate` fill): `mercer-{slug}.pdf`, three pages (jsPDF) in the v12 palette; Helvetica remains the PDF face and the footer says so; the tree snapshot, the ladder, the vocabulary, the weather, the free-tools rows, the security line.
- **Book a call** (`--sec-crown` fill): `BOOKING_URL` in a new tab; one line: "Open to everyone. Your score is {n} of 100; the bar TMA works above is 65."
- **{Archetype}** (`--sec-you` fill): opens the agent panel.
- Export to TMA (glass, small): the JSON download; "Send now" removed.

Private line: "Your answers stay in this browser. TMA sees them only in what you export."

---

## 11. The intro

Beats after Arrival. Each: a caption (display 30) and at most two lines (text 16). The tree grows in phase. Copy in COPY.md §1.

| Beat | Tree | Caption | Lines |
|---|---|---|---|
| 1 Promise | seed to roots | "{Name} can grow." | the engine's four thousand runs; you will see it grow as you answer |
| 2 The tree | trunk, six limbs (stubs then solid), demo leaves in all four colours, the Core appears at the base and fills with demo points | "This is how to read it." | roots = what Mercer knows, the four colours; trunk = revenue; six branches; leaves = answers; pale = unfinished; the square at the base = the forecast settling |
| 3 Private | leaves settle; the Core empties | "Nothing leaves this browser." | nothing to TMA unless exported; book a call for everyone; not financial advice |
| 4 How it works | the first limb's label appears at its tip; a headline under the tree opens itself once | "Titles open. Insights appear." | press any title; one sentence per leaf, branch, and at the end; N/A and Not sure are always there. Then "Begin". |

No beat mentions arrow keys or sound. Beat 2 plays the leaf note as the demo leaves grow.

---

## 12. On 390 px

- The tree is the viewport background at every stage; the clearing is y ≥ 470 with the veil and a 24 px paper-colour gradient at its top edge (Ascent) so text over leaves stays legible in light mode; 16 px gutter; no horizontal scroll.
- The trunk base sits at y = 0.42 from S3; every preset takes +0.08 pitch; the limb tip sits at about y = 400 with the live label under it. The label hides under 240 px of tree.
- One instrument per screen always fits: figure slider 44 px tall; stones 44 px; ring 140 px; the routes shelves show four pills per row and fold at six; the ledger shows four rows and scrolls inside the clearing; the sorter's bins are a 2 × 2 grid plus a full-width Can't say; the sort tiles are two rows of three with the drop zones at the screen edges (drag 60 px).
- The foot row (‹, Not sure, N/A, Next) is fixed at the bottom with a 12 px safe-area inset; Next right.
- Swipe right on the clearing = Back; swipe left does nothing (a stray swipe must not skip). Swipe left/right on the card foot at S7 = next/previous disc.
- One-finger drag on an instrument never turns the tree; two fingers or the world area does. `touch-action: pan-y` on the world, `none` on rails and rings.
- S6 figures are display 64; S7 cards open as the lower 52% and push the trunk base to y = 0.3; the disc row sits between tree and card and never scrolls away; only the anchored figure nearest the screen centre is expanded, the rest stay discs; sheets rise 80% and scroll inside.
- The Core is 56 × 34 on the trunk base in the interview and opens full-size on tap.
- Birds pan across ±0.4.
- Type per §7's second column. Nothing the desktop shows is hidden; nothing is added.

One layout with two framing constants (clearing side, preset pitch), not two layouts. The light-mode phone screen of every section is the first thing built and checked.

---

## 13. Requests, security and the decision log

Requests 1 to 60 are mapped in CHECKLIST.md.

**Security, honestly.** The bundle is minified (terser, mangled names, no source map) into one file plus engine.js as it stands, the published font slots, `data/land-110m.json`, `macro.json` and `freetools.json`. That stops casual reading, not a determined one: JavaScript delivered to a browser can be beautified and read, and the engine's priors are in it. What protects the visitor is elsewhere: no request leaves the page except the optional website reader the visitor triggers and the Google Fonts stylesheet; state lives in memory and reaches disk only through the export buttons; `localStorage` holds the mode, the sound flag and the intro-seen flag. The Harvest private line, the markdown header and the PDF footer say this.

**Decisions where the directions conflicted (one line each):**

1. Container: Window's clearing, with a flat veil, not Ascent's card column nor Instrument's 82% card: no compartment, but guaranteed contrast.
2. Results navigation: discs on the limbs (Ascent, Instrument), not nine unlabelled pills: colour must be spatial.
3. Harvest: words on learnt fills (Ascent), not four unlabelled discs (Instrument): actions need words.
4. Brain: the engine's draws in the Core at the trunk base (Instrument's Well at Window's place), not one dot per fact: the box must mean something exact.
5. No purpose card per section (Ascent): ten extra presses; the purpose is the eyebrow's first line.
6. Section order: up the limbs then down (Ascent's arc) so Best clients follows Routes in; bestWorst stays at Roots.
7. Item 8: `prior[key]` snapshot on entry (Window) plus `typ()` only after the question is passed (Instrument); no Roots sales count.
8. Host model: opt-in stone with the disclosure line (Instrument); never default-on (Ascent) and not removed (Window), because the scripted responder is the default either way.
9. Intro palette: follows the mode, not forced dark; flagged for Adam.
10. Colour: OKLCH-equal section hues (Ascent), grades as opacity steps, no gold token, no radial wash.
11. Appetite figures at Roots: None and Boutique only; the rest at the Crown from the Worker.
12. World map: a published Natural Earth file, equirectangular, no spinning globe (Ascent's data, Window's stillness).
13. Question cuts: only where an instrument captures the same fact; jobLength, qualitySlip, newVsRepeat, ltv, dataOffer, note stay.
14. Engine priors as insights (Instrument's 1 in 30, 18 in 100): dropped.
15. Not handled, said plainly: a local from their town (no dataset; naming one is fabrication); competitors Mercer names itself (no dataset); code a computer scientist cannot read (minified is not hidden).
