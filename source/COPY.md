# Mercer v12: every word on screen

Rules: no em dashes; no "actually"; no filler; sentence case; figures tabular; `{x}` is a state or engine field; `{Name}` is `state.biz` or "Your business"; `{sector}` is `M.sectorWord()` lowercased. A template renders only when every field it names holds; otherwise nothing. Nothing counts what is done.

---

## 1. Arrival and the intro

**Arrival.** Caption: "Mercer forecasts what you can grow." Field placeholder: "ABC Consulting". Button: "Begin".

| Beat | Caption | Lines |
|---|---|---|
| 1 | "{Name} can grow." | "Mercer runs your business four thousand times and shows the twelve months that follow. You will watch it grow as you answer." |
| 2 | "This is how to read it." | "Roots are what Mercer knows: green is yours, amber is your industry, teal is your website, blue is a guess. The trunk is revenue today. Six branches are the six ways you grow. Leaves are your answers; pale means unfinished. The square at the base is the forecast settling." |
| 3 | "Nothing leaves this browser." | "TMA receives nothing unless you export it at the end. Book a call is open to everyone, whatever your score. This is for education, entertainment and self-reflection, not financial advice." |
| 4 | "Titles open. Insights appear." | "Press any title to see what is being asked. After most answers, one sentence tells you something you did not know: one for each leaf, one for each branch, one at the end. Not sure and N/A are always there." |

Buttons: "Next" (beats 1 to 3), "Begin" (beat 4), "Skip" (beats 1 to 3). Appended to beat 3 when `M.researchLive()`: "Mercer sends your website address to TMA's reader only when you ask it to read the site."

## 2. The disclaimer (verbatim, beat 3, the PDF footer, the markdown header)

"For education, entertainment and self-reflection, not financial advice."

## 3. Sections

| id | Name | Purpose (the eyebrow's first line, once) |
|---|---|---|
| roots | Roots | who you are |
| offer | The offer | what one sale is worth |
| reach | Reach | who is out there |
| routes | Routes in | how they find you |
| close | The close | how enquiries become sales |
| delivery | Delivery | how much you can take on |
| money | Money | what you keep |
| clients | Best clients | who pays you most, and why they came |
| you | You | what you bring |
| ground | Ground | what feeds the tree from outside |

Planting caption: "{Name}'s tree." Branch close button: "Next". Crown: "Harvest".

## 4. Questions: headline, subhead, explanation

Explanation rule: name the thing counted, the period, the one exclusion. The elasticity line "A 10% change here moves the forecast about {x}%." is appended by app.js for price, closeRate, capacity, budget, margin, market, cycle, repeat when `M.measured` holds the entry.

| id | Headline | Subhead | Explanation |
|---|---|---|---|
| biz | Business | What it is called | Used in the sentences Mercer writes to you, and nowhere else. |
| now | Revenue | A normal month, before costs | Money in over an average month this year, before any cost comes out. The forecast starts here. |
| bestWorst | Your months | Best and worst in the last year | Drag the two ends to your highest and lowest month. Mercer checks its range against yours. |
| place | Where | The town you work from | Used for the map and for nothing else. |
| sector | Industry | Your trade, in a word | Picks the industry figures Mercer uses when you leave a question. |
| site | Website | Address, or paste the homepage | Read in this browser. Anything it finds is offered as a suggestion you can press; nothing is used until you do. |
| yearsTrading | Since | The year you started | Nothing else. |
| goal | Target | Revenue a month, by when | The dial beside it sets how hard you want to grow; Mercer sets the growth budget to match. |
| months | By | Months from now | Mercer runs twelve months and reads the one you pick. |
| repeatWork | Buying pattern | How customers buy from you | Once, again, on a retainer, or a mix. Sets which questions come next. |
| price | Sale value | One sale, on average | What one customer pays for one sale, VAT included if you charge it, over the last year. |
| retainer | Retainer | Lowest, typical and highest fee a month | Drag the three handles. Mercer prices a client at the typical fee times the months they stay. |
| priceSpread | Spread | Smallest sale against largest | How far your prices swing over a year. A wide spread widens Mercer's range. |
| included | Package | What one sale includes | In your words. Goes into your briefing, not the forecast. |
| upsell | Upsells | More for the same customer | Whether a customer can buy more without a new enquiry. |
| priceRaised | Price rises | When you last raised prices | Compared with inflation on the results. |
| buyer | Buyers | Who pays you | Individuals, small firms, larger firms, public sector, or a mix. |
| radius | Range | How far you go for work | Sets the map. Worldwide replaces it with the world. |
| market | Prospects | Businesses or people who fit your ideal prospect, have never bought, and you could find and contact this year | Mercer's reachable list. It caps how long outreach can run before the list is used up. Not the whole market. |
| listSize | Contacts | Past clients, current clients and people on your list who would take your call | People who already know you. Warm routes draw on these. Not prospects. |
| season | Seasonality | Demand through the year | Mercer forecasts average months; this tells the results where to warn. |
| competitors | Competitors | Who wins the work you lose | Names or kinds, in your words. |
| idealCustomer | Ideal prospect | The one you want five more of | In your words. |
| channel | Routes in | How new customers reach you now, and what you have tried | Four shelves: warm one to one, warm one to many, cold one to one, cold one to many. Press once for doing now, twice for tried. |
| went | Outcome | How each tried route went | Worked, mixed, or no result, for each route you tried. |
| spend | Growth spend | What you spend now; the most you would | Two handles. Mercer plans with the ceiling and compares it with today. Growth spend only, not wages. |
| spendSplit | Split | Where today's spend goes | One slider per live route. |
| marketingOwner | Marketing lead | Who runs marketing now | You, someone on the team, an agency, or no one. |
| agency | Agencies | Your history with them | Now, before, or never. |
| agencyFee | Agency fee | What you pay them each month | The fee only, not what they spend on ads for you. |
| agencyWhy | Agency outcome | What happened, in your words | One line. |
| contentTime | Content hours | Each week, on {route} | Hours you spend posting, writing or filming. |
| tracking | Lead source | How you know where each lead came from | Asked, CRM, analytics, guess, or no way to tell. |
| enquiries | Enquiries | New ones a month; how many get a price | Calls, emails, forms and messages from possible new customers in a normal month. The second handle is how many of those you quote. Not existing customers. |
| closeRate | Close rate | Enquiries that become sales | Out of ten enquiries, how many buy. Mercer weighs your figure against the industry's before it trusts it. |
| cycle | First sale | First contact to first sale | How long a new customer takes to decide. Delays when growth spend turns into revenue. |
| responseTime | Reply speed | First answer to a new enquiry | How long a new enquiry waits for a human. |
| followUps | Follow-ups | Chases before you stop | How many times you go back to an enquiry that went quiet. |
| website | Website | What a visitor can do there | Read about you, send an enquiry, book, or buy. |
| reviews | Reviews | Total, across all sites | Every public review you hold, on every site, all time. |
| chooseYou | Your edge | Why customers pick you | Pick every reason that is true. |
| chooseThem | Lost work | Why buyers pick someone else | Pick every reason you have heard. |
| capacity | Capacity | Who does the work; most {unit} a month; now | Three parts. Mercer's ceiling on growth is here. Count delivered work, not enquiries. |
| teamSize | Team | Everyone, part-timers included | Checked against who does the work. |
| leadTime | Wait to start | From yes to first day | The delay between a sale and delivery. |
| jobLength | Job length | One job, start to finish | Typical, not the longest. |
| breaksFirst | Bottleneck | What gives at double the work | The first thing that breaks. |
| qualitySlip | What slips | When you hit the bottleneck | Pick every one you have seen. |
| subcontract | Overflow | Who takes work you can't | Partners, someone at a cost, or no one. |
| holiday | Two weeks off | The business without you | Runs, slows, stops, or never tried. |
| hiring | Hiring | If more work arrived | Now, once steady, no, or can't find people. |
| hiring (teamSize 1) | First hire | If more work arrived | as above |
| margin | Margin | Cost to deliver one £{price} sale | What you keep of each sale after delivering it, before overheads. |
| margin (no price) | Margin | Kept from each £1 | as above |
| fixedCosts | Outgoings | Paid every month, whatever you sell | Rent, wages, bills, loans, other. Mercer checks the total against what you keep. |
| terms | Payment | When customers pay; what is owed now | Before, on completion, 30 days, 60 or more; then unpaid invoices today. |
| owed | Owed | Unpaid invoices right now | Invoiced and unpaid today, not work in progress. |
| discounting | Discounting | How often you cut price to win | Never to on most sales. |
| runway | Runway | Months you can fund growth | How long growth spend can run before sales must cover it. |
| software | Software | What you pay for, by kind | Type the name where the cursor lands; the fee is optional. Free alternatives come at the end. |
| lastFive | Last five | Where your five best clients came from | One disc per client. Drop each into the shelf it arrived by; then, if you like, the route. The results are built on this. |
| topShare | Top three | Share of revenue from your three biggest clients | Drag the ring. Last year's revenue, your three largest names. |
| repeat | Repeat | How many in 10 come back | Customers who buy again after the first sale, within a year. |
| repeat (retainer) | Renewals | How many in 10 renew | Clients who renew at the end of a term. |
| stay | Stay | How long a customer keeps buying | Months from first sale to last. |
| stay (retainer) | Retainer length | Months a typical client stays | Mercer uses this as how long a customer stays. |
| returnGap | Return gap | Time between purchases | For a customer who comes back. |
| newVsRepeat | Returning revenue | Share from past customers | Of a normal month's revenue. |
| ltv | Lifetime value | One customer, first sale to last | If you know it; otherwise leave it. |
| bestEver | Best result | Your biggest marketing win | In your words. |
| hours | Time | Hours a week for growth | Time you can give the plan, not the work itself. |
| strengths | Strengths | Drag what you are good at left, what you avoid right | Six tiles. Orders the plan's steps around you. |
| win | Win | What a good outcome is | Income, time, a sale, something that lasts, or beating someone. |
| help | Who helps | Tap the people around you | You alone, a partner, the team, an agency. |
| risk | Risk | What you can afford to lose | On a test that fails. |
| personality | Type | Four either-ors | Names your agent. Your statement of preference, not a test. |
| cv | CV | Paste it, or not | Read in this browser. Adds nothing to the forecast; shapes the briefing. |
| network | Network | People who would introduce you: partners, suppliers, former colleagues, friends in the trade | A count. Warm one-to-one routes run on these. Not contacts you already hold. |
| funding | Funding | Where growth money could come from | Profit, savings, a loan or facility, a grant, an investor, none. Not advice; it shapes the results' funding line. |
| dataOffer | Records | Numbers you could bring to a call | Pick every one that exists. |
| wontDo | Off limits | What you won't do | Mercer brings it to the call. |
| deadline | Key date | A date that changes the plan | In your words. |
| successWords | A good year | In your own words | Used on the results to speak in your terms. |
| note | Anything else | Optional | Anything the questions missed. |

Option labels are v11's (map-questions.md) except: capacity who "Only me / Me and one or two / Three to ten / Over ten"; funding "Profit / Savings / A loan or facility / A grant / An investor / None yet"; lastFive bins "Warm 1-1 / Warm 1-many / Cold 1-1 / Cold 1-many / Can't say"; went "Worked / Mixed / No result"; appetite "None / Boutique / Moderate / Aggressive / Maximum".

## 5. Control words

Back "‹" (aria-label "Back") · "Not sure" · "N/A" · "Next" · "Plant" · "Begin" · "Skip" · "Later" (CV) · "Clear" · "more" · "Main route" · "Another way" · "Know your letters" · "Type, if you know it" · "Harvest" · "Use the host's model" · "Ask about your tree" (agent field placeholder) · "minor" (the mist word after a weak headline) · progress ring aria-label "Progress" (no number) · sound switch "Sound on" / "Sound off" · mode switch "Light" / "Dark".

Appetite dial lines (under the level word): None "£0: revenue carried flat"; Boutique "£{max(500, 0.05 × now)}: Mercer's default rule"; Moderate at Roots "a quarter of gross profit: the figure arrives at the crown", at the Crown "£{0.25 × now × margin}: a quarter of gross profit (a pack constant; margin {yours / Mercer's estimate})"; Aggressive at Roots "the smallest budget that reaches your target: the figure arrives at the crown", at the Crown "£{b*}: the smallest budget whose middle run reaches £{goal} by month {m}" or "no budget reaches £{goal} by month {m}: {binder}"; Maximum at Roots "where spend stops adding: the figure arrives at the crown", at the Crown "£{rung}: the budget past which spend stops adding". Once, in mist: "Maximum cannot lengthen the run past twelve months or add channels."

## 6. Leaf insight templates (fields, condition)

`typ(k)` = the sector prior snapshotted on entry, readable only after that question has been passed. `one(x)` one decimal, `pct(x)` whole percent, `count(n)` rounded.

| id | Sentence | Fields | Shown when |
|---|---|---|---|
| now | (none) | | never at Roots |
| bestWorst | "Your best month is {one(best/worst)}× your worst; today sits {pct((now−worst)/(best−worst))} of the way from worst to best." | best, worst, now | worst > 0 and worst ≤ now ≤ best |
| bestWorst | "Your best month is £{best}; today's £{now} is {pct(now/best)} of it." | best, now | worst == 0 |
| bestWorst | "Your £{now} now is above your best month." | best, now | now > best |
| bestWorst | warn "Your £{now} now sits below your worst month." | worst, now | now < worst |
| bestWorst | warn "Your best month is below your worst." | | best < worst |
| yearsTrading | "£{count(now/years)} of monthly revenue added per year, on average." | now, years | years ≥ 1 |
| goal | "£{now} to £{goal} in {months} months is {pct((goal/now)^(1/months) − 1)} a month, compounded." | now, goal, months | goal > now |
| appetite | the dial line in §5 | | always |
| repeatWork | "Mercer counts each customer as one sale." | | once |
| repeatWork | "A client is worth fee × months stayed; Mercer prices a sale that way." | | retainer |
| price | "£{price} sits {pct(abs(price/typ(deal) − 1))} {above/below} the £{typ(deal)} typical for {sector}: about {count(now/price)} sales a month at today's revenue." | price, typ(deal), now | typ(deal) exists (after pass) |
| price | "£{now} a month is about {count(now/price)} sales a month." | price, now | no typ(deal) |
| retainer | "One client at £{retainerValue} for {stay} months is £{retainerValue × stay}; £{retainerMin} to £{retainerMax} is a {one(max/min)}× spread, so months will swing." | retainerValue, min, max, stay | stay known |
| retainer | "£{now} a month is about {count(now/retainerValue)} clients at £{retainerValue}." | | stay unknown |
| priceSpread | "Expect months to swing wider than Mercer's range: it prices every sale at £{price}." | price | wide or huge |
| upsell | "{repeat×10} in 10 already come back; an upsell reaches them without a new enquiry." | repeat | yes, repeat > 0 |
| upsell | "An upsell would sit on top of the forecast; Mercer counts one sale per customer." | | could |
| priceRaised | "CPI rose {cpi_annual.value}% in the year to {cpi_annual.period} (ONS, {cpi_annual.asOf}); a price held for three years has lost at least that each year." | macro cpi_annual | long or never |
| buyer | "Mercer does not model tenders or frameworks." | | public |
| radius | "{count(pop)} people live within {miles} miles of {place} (GeoNames)." | M.places | local or county with a match |
| radius | "Worldwide: Mercer drops the map and counts your prospects instead." | | global |
| market | "{count(market)} prospects at {typ(close)×10} in 10 is about {count(market × typ(close))} sales if every one heard from you once." | market, typ(close) | typ(close) exists |
| market | warn "Under 50 prospects: outreach runs out inside the first month." | market | market < 50 |
| listSize | "{pct(listSize/market)} of your prospects already know you." | listSize, market | listSize ≤ market |
| listSize | warn "More contacts than prospects: the two lists overlap." | | listSize > market |
| season | "Mercer forecasts average months with no peaks; the results mark where yours fall." | | not steady |
| channel | "You run {n}; Mercer forecasts {engine names} and brings the rest to the call." | doing, result.channels | doing.length > 0 |
| channel | (cold-call doing) + the two sentences in §12 | | cold-call in doing |
| spend | "£{budget} is {pct(budget/now)} of revenue; Mercer's default for you would be £{max(500, 0.05 × now)}." | budget, now | |
| spend | warn "You spend more now than the most you would." | spendNow, budget | spendNow > budget |
| spendSplit | "{t}% of £{spendNow} placed." + " {t−100}% over." (warn) or " {100−t}% left." | | |
| marketingOwner | "No one runs marketing and {n} routes are live: they run themselves." | doing | nobody, doing.length > 0 |
| agencyFee | "{pct(fee/spendNow)} of the £{spendNow} you spend on growth." | | fee ≤ spendNow |
| agencyFee | warn "More than the £{spendNow} you said you spend on growth each month." | | fee > spendNow |
| contentTime | "{h} hours a week on {route}; in Mercer's model content ramps over three months, a quarter, three quarters, then full." | contentTime, doing | a content route is live |
| tracking | "Without lead-source records, your last five will be memory; the results say so." | | guess or no |
| enquiries | "About {count(enq × close)} new customers a month at {close×10} in 10; revenue ÷ price says {count(now/price)}." warn form when outside 0.4..1.6× | enquiries, closeRate or typ(close), now, price | close known |
| enquiries (quotes) | "{pct(quotes/enq)} of enquiries get a price." | quotes, enquiries | quotes ≤ enquiries |
| closeRate | "{sector} typically closes {typ(close)×10} in 10; Mercer weighs yours against it before it trusts it." | typ(close) | after pass |
| cycle | "A customer who first contacts you today buys in about {cycleWord}, leaving {months − cycleMonths} of the {months} months Mercer forecasts." | cycle, months | cycle ≥ 30 |
| followUps | "A {cycleWord} sale with {n} chases: most of the cycle passes unprompted." | followUps, cycle | followUps ≤ 2 and cycle ≥ 60 |
| reviews | "Under 10 reviews, and buyers who had not heard of you say the same thing." | reviews, chooseThem | none or few, and chooseThem has trust |
| capacity | "About {pct(served/capacity)} full: room for {count(capacity − served)} more {unit} a month." | capacity, servedNow or now/price | |
| capacity | warn "Full." | | served ≥ capacity |
| teamSize | "£{count(now/teamSize)} of revenue a month per person." | | |
| leadTime | "First contact to first day: about {cycle + 30} days." | cycle | month, cycle known |
| breaksFirst | "Mercer already sees capacity binding first." | measured.binding | me, binding client_capacity |
| subcontract | "Partners lift the ceiling Mercer draws at {count(capacity)} {unit} a month." | capacity | yes |
| holiday | "It stops and only you do the work: capacity is you." | who | stops, who == 1 |
| hiring | "Capacity binds first and hiring is closed: the lever left is price." | measured.binding | cant, binding client_capacity |
| margin | "You keep £{price × margin} of each £{price} sale, {p}p in the £1; {sector} typically keeps {typ(margin)×100}p." | price, margin, typ(margin) | typ(margin) exists |
| margin | "You keep {p}p in the £1: £{now × margin} a month before outgoings." | margin, now | no typ |
| fixedCosts | "Break-even is £{fixed/margin} a month in sales at {p}p kept per £1." | fixedCosts, margin | |
| terms | "Each sale costs £{price × (1−margin)} to deliver, {up to 30 days / 60 days or more} before the customer pays." | price, margin | thirty or sixty |
| owed | "£{owed} is {one(owed/now)} months of revenue." | owed, now | |
| discounting | "A 10% discount on a {p}p margin gives away {pct(10/p)} of what you keep." | margin | often or always |
| runway | "{n} months at £{budget} a month: £{n × budget} of growth spend before sales must cover it." | runway, budget | runway > 0 |
| runway | "Growth spend comes out of each month's takings." | | runway == 0 |
| software | "£{total} a month is £{total × 12} a year, {pct(total/now)} of revenue; {k} of these kinds have a free tier (the results list them)." | stack, now, freetools | total > 0 |
| lastFive | "{k} of your five best came warm; Mercer's forecast runs {engine names}." | lastFive, result.channels | all placed |
| topShare | "Your top three are {share}% of revenue: one of them is about £{now × share/300} a month." | topShare, now | |
| repeat | "{n} in 10 buying again: a new customer buys about {one(1/(1−repeat))} times." | repeat | repeat < 0.95 |
| stay | "One customer is worth about £{price × times} over {stay} months." | price, repeat, stay | |
| returnGap | "At £{price} a sale, a returning customer spends about £{price × perYear} a year." | price | week, month, quarter, year |
| ltv | "Worth {one(ltv/price)} sales at your £{price} price." / warn "Below your £{price} sale price." | ltv, price | |
| hours | "{h} hours a week is {count(h × 4.33)} a month across {n} live routes." | hours, doing | doing.length > 0 |
| strengths | "You avoid selling and {k} of your five best came warm: the network sells for you." | avoids, lastFive | avoids has selling, warm ≥ 3 |
| risk | "No risk and an {level} target pull against each other; the results show what each costs." | risk, appetite | none, aggressive or maximum |
| personality | "{Archetype}: grows by {grows}." | archetypes | all four letters |
| cv | "{years} years in work since {since}, {n} roles." (from `cvLine` facts) | M.cvFacts | |
| network | "{n} introducers at one introduction a year is {one(n/12)} a month against {enq} enquiries." | network, enquiries | |
| funding | "Growth spend comes out of takings: {pct(budget/(now × margin))} of gross profit." | funding, runway, budget, now, margin | none, runway 0 |
| funding | "Bank Rate is {boe_bank_rate.value}% (Bank of England, {boe_bank_rate.asOf})." | macro boe_bank_rate | loan |
| wontDo | "Cold outreach is off limits: Mercer brings that to the call." | | cold |
| others (included, idealCustomer, bestEver, competitors, chooseYou, chooseThem, responseTime, website, jobLength, qualitySlip, win, help, deadline, successWords, note, dataOffer, newVsRepeat, place, site, sector, went, agency, agencyWhy, months) | none | | |

## 7. Branch and root insights (S5)

| Section | Sentence | Condition |
|---|---|---|
| Roots (S2 end) | "The tree stands mostly on your own answers." / "The tree stands mostly on Mercer's estimates for now." | own/all ≥ .5 / else |
| The offer | "A 10% change in your price moves the forecast {e×10}%: {this is the branch that grows most / it grows / it barely moves it}." | measured acv entry |
| Reach | "Your list is the first limit: {count(market)} prospects run out in month {bindsAtMonth}." / "Your list is not the limit inside twelve months." | binding market_depletion / else |
| Routes in | "Of your {n} routes Mercer forecasts {m}; the rest go to the call." | doing |
| The close | "Close rate: a 10% change moves the forecast {e×10}%. Money spent this month lands in month {k}." | measured statedCloseRate, cycle |
| Delivery | "Capacity binds first, from month {bindsAtMonth}, at £{ceiling} a month." / "There is room: {count(capacity − served)} more {unit} a month before delivery limits growth." | binding client_capacity / else |
| Money | "You keep {p}p in the £1 and spend £{budget} a month on growth: pays back in {payback.p50} months on the current plan." / "{p}p kept; break-even £{x} a month." | planned / else |
| Best clients | "{k} of five best came warm and {repeat×10} in 10 return: {half or more of your growth is already in the room / most of your growth still has to be found}." | lastFive, repeat |
| You | "{h} hours a week, {Archetype}: the plan leads with {letterMeans first line, shortened}." | hours, personality |
| Ground | "{network} introducers and {listSize} contacts against {market} prospects: the warm side is {pct((network + listSize)/market)} of the cold side." | all three |

## 8. Overall

"{Name} reaches £{p25} to £{p75} a month by {Month YYYY} in half of 4,000 runs, {above / £x short of} the £{goal} target; {first limit} limits first; {Return rank 1 title} returns most." Budget basis: canopy.js `summary()` budget form with "half of 4,000 runs".

## 9. The cutscene

1. "{Name} grew a tree."
2. "£{p25} to £{p75}" / "a month by {Month YYYY}, in half of 4,000 runs"
3. "{ratio} runs reach £{goal}" / "by {Month YYYY}; the middle run gets there in month {k}" or "by {Month YYYY}; not inside twelve months". Budget basis: "+£{lo} to +£{hi}" / "more a month from £{budget}"
4. "{LIMIT_SHORT}" / "binds from {Month YYYY}" or "Nothing binds" / "inside a year"
5. "{lever title}" / "+£{magnitude} over twelve months, {difficulty}"
6. "{score} of 100" / "Mission Alignment. TMA works above 65; the call is open either way."

Skip: "Skip". Disc key names: the section names in §3 plus "Crown".

## 10. The vocabulary (shown once)

- Moves most: the input a 10% change shifts the forecast by most.
- Return rank: Mercer's steps ranked by revenue added per unit of difficulty; rank 1 is the highest return. Opened: "+£{magnitude} over twelve months ÷ {difficulty}".
- Return per £: revenue added over twelve months for each pound of growth spend.
- First limit: the constraint that caps growth first, when, and at what.
- Held back: budget the plan could not place.
- Pays back: months until added revenue covers the spend.
- Cost of waiting: what the middle run loses if nothing changes.

Step line: "Return rank {r}: {title}, +£{magnitude} over twelve months, {difficulty}; restraint: {restraint}."

Path rungs: "On course at £{budget}: {ratio} of runs reach it." · "Spend £{b*} a month on growth (you said £{budget})." · "Mercer could not place £{unspent} of it: {unspentReason}." · "No budget reaches £{goal} by {Month}: {binder} caps the median at £{ceiling}." · "On your own budget the median reaches £{goal} in month {k}." / "On your own budget, not inside twelve months." · "That is {sales} more sales, {meetings} held meetings, {leads} positive replies a month." · "{goal / acv} clients a month against room for {room}." Restraint words: `LIMIT_NAME` and `statement` from canopy.js, cleaned.

## 11. The weather (macro.json ids)

Headline rows always: `boe_bank_rate`, `cpi_annual`, `gdp_qoq`, each "{label}: {value}{unit}, {period} ({source}, as of {asOf})". Sector rows per SPEC §10 table, same form; a `quote` row is shown in quotation marks with source and date. Rule lines (one at most, the first that applies; each names its id):

| Condition | Sentence | ids |
|---|---|---|
| priceRaised long or never | "Your last price rise was over three years ago; CPI is {cpi_annual.value}% and the Bank projects about {boe_cpi_projection_q4_2026.value}% by 2026 Q4 (a projection)." | cpi_annual, boe_cpi_projection_q4_2026 |
| terms sixty | "Customers pay at 60 days while Bank Rate sits at {boe_bank_rate.value}%: the wait has a cost." | boe_bank_rate |
| funding has loan | "Bank Rate is {boe_bank_rate.value}%, held at the {boe_bank_rate.period} meeting." | boe_bank_rate |
| contentKey professional-services (professional) | "The Bank's Agents describe fee-led growth in your sector; your Return rank {n} step is a price rise." (only when a price lever exists) | sector_profserv_boe_agents |
| private-healthcare (health) | "Self-pay admissions grew {sector_healthcare_phin_selfpay_growth.value}% year on year (PHIN); the direct route is the one growing." | sector_healthcare_phin_selfpay_growth |
| hospitality, season not steady | "Food and beverage output fell {sector_hospitality_ons_food_beverage_3m.value}% over three months while accommodation rose {sector_hospitality_ons_accommodation_3m.value}%; your seasonality answer decides which side you are on." | both ids |
| home-services (construction, home) | "Repair and maintenance grew {sector_construction_ons_rm_monthly.value}% in the month while new work fell; home services sit on the growing side." | sector_construction_ons_rm_monthly |
| e-commerce (retail) | "Online is {sector_retail_ons_online_share.value}% of retail sales and online values grew {sector_retail_ons_online_values_yoy.value}% on the year." | both ids |
| b2b-saas (tech) | "Computer programming output grew {sector_software_ons_computer_programming_monthly.value}% in July 2026, the largest single contributor to GDP that month." | sector_software_ons_computer_programming_monthly |
| pooled sector | "Mercer holds no sector series for {sector}." | |

Foot: "Read on 19 September 2026. Nothing here is a forecast of the economy, and Mercer's forecast does not use these figures."

## 12. Cold 1-1 (facts-coldcalling.md, verbatim)

Shelf explanation: "Calling another business cold is lawful in the UK: screen the number against the TPS and CTPS first, say who you are, let your number show, and stop when asked. Calling consumers cold about pensions or claims is banned without their prior consent, so if that is your market, this route is closed."

Appended when cold-email is also doing: "Emailing a limited company cold is allowed under PECR; emailing a sole trader or a named person at home needs their consent."

## 13. Routes shelves

Headers: "Warm, one to one" · "Warm, one to many" · "Cold, one to one" · "Cold, one to many". Explanations (on the header): warm 1-1 "They already knew you, or someone who did, and you spoke to them one at a time." · warm 1-many "They already knew you and saw something many people saw." · cold 1-1 "They had not heard of you and you reached them one at a time." + §12 · cold 1-many "They had not heard of you and found you where many people look." Pill names are the DIST names (map-app.md §8); "Cold calling" keeps its name. Key line under the search: "Press once: doing now. Twice: tried."

## 14. The archetype agent

Header: "{Archetype}" · "for {Name}". Lines: the two `lines` from facts-archetypes.md. Examples intro: "Two founders who grew the way a {Archetype} grows:" then "{who}, {company}: {did}" with the source URL as the small word. No type given: "Answer the four either-ors to name your agent." Panel line: "Answers come from your tree, in this browser." Host-model stone: "Use the host's model"; when on: "This question goes to the host's model; nothing else does."

Chips (the five questions): "Where did my last five best clients come from, and what does that say about my next five?" · "Which of the four routes should a {Archetype} put first?" · "What did {example.who} do that I could copy this quarter, with my numbers?" · "What is the one restraint on hitting my target?" · "My top clients are most of my revenue. What do I change first?"

Answer templates (assembled from state; one number per sentence; never first person as a named founder):
1. "{k} of your five came {bin}. {Archetype}s grow by {grows}, so the next five most likely come the same way; Mercer {funds / does not yet fund} that route." Missing lastFive: "Mercer does not know that: the Best clients branch is still pale."
2. "{letterMeans first line}. Put {warm or cold, from the E/I letter} first." Missing type: "Answer the four either-ors first."
3. "{who} {did}. With your numbers: {Return rank 1 title}, +£{magnitude} over twelve months." 
4. "{LIMIT_NAME} binds from {Month}: {statement}. The step that lifts it: {lever title}."
5. "Your top three are {share}% of revenue. Change first: {Return rank 1 title}; a lost client is about £{now × share/300} a month."
Anything else: "Mercer does not know that. The {section} branch is where it would live." Empty field: nothing.

## 15. Website reader lines (research.js)

"Read {n} words in your browser from {address}. Press any that are right." · "Read {n} words in your browser. Mercer found nothing to quote, so it will ask you instead." · "Paste your homepage text too, and Mercer fills in what it can quote." · "Open your homepage, select all, and paste it here. Mercer reads it in this browser and uploads nothing." · queue and error lines as v11 (map-questions.md §10), unchanged.

## 16. Placeholders and ghost sets (trade-neutral)

Name "ABC Consulting". Place "Your town". Trade "Your trade, in a word". Website "Web address, or paste your homepage". Competitors "two national names and three local ones". Ideal prospect "a firm of our size in the next town that pays on time". Package "the first call, the work itself and a written handover". Best result "one job that paid for the quarter and led to two more". Agency outcome "the reporting looked good and the phone never rang". Key date "a lease renewal in the spring that we want to be ready for". A good year "revenue is predictable enough to plan around". Anything else "one customer is a third of our revenue". Ghost sets: the v11 `*` sets stay; the six keyed sets are rewritten with no trade names (no clinic, no physio, no pub); the software set is each STACK category's `eg` list.

## 17. Harvest and exports

Buttons: "For your AI" · "For people" · "Book a call" · "{Archetype}" · "Export to TMA" (small). Lines under them: "A markdown file with every figure and its source." · "A three-page PDF." · "Open to everyone. Your score is {n} of 100; the bar TMA works above is 65." Private line: "Your answers stay in this browser. TMA sees them only in what you export." Saved line (under the pressed button, 3 s): "Saved {filename}."

Markdown header: "# {Name}: Mercer's reading, {date}" then "Nothing here left the browser until you saved this file. Client-side code is minified, not hidden. For education, entertainment and self-reflection, not financial advice." Sections: Overall · Vocabulary · Your answers (one row per fact: title, value, source) · The forecast (range, added, month table) · Path to target · Steps and restraints · First limit · Mission Alignment · Insights (leaf, branch, overall) · Weather (rows with URLs) · Free alternatives (rows used) · Briefing for an assistant (canopy.js `briefing()`, archetype voice rules) · Engine {version}, pack {pack}, 4,000 runs.

PDF footer: "Page {i} of {n} · Mercer 12 · Engine {version} · 4,000 runs, every figure from one run · prior pack {pack} · Helvetica stands in for the licensed faces · Client-side code is minified, not hidden · For education, entertainment and self-reflection, not financial advice · Book a call: {URL}".

Free-alternatives line: "{Category}: {tool}, {tier}, {limit}." Twilio: "Twilio, free to test: {limit}." Cal.diy: "Cal.diy, MIT self-host, community-maintained, no support." n8n: "n8n, Sustainable Use License: your own internal use only." Build line: "To build a small tool yourself: Claude Free (usage resets on a rolling five-hour window) or Ollama (local models, free, needs a machine that can run them)." Total: "£{total} a month you could stop paying, if the free tiers' limits fit you."

Competitors: "You lose on {reasons} and win on {edges}; the plan's Return rank 1 is {title}, which {addresses / does not address} that." Empty: "You named no competitors."

80/20 advice lines: as SPEC §10 (six sentences), verbatim there.

Mission Alignment: "{routingReason cleaned} TMA takes on work above 65; the call is open either way."

## 18. Empty and error states

Core hidden until a run: nothing. No WebGL: the flat tree; every instrument unchanged. Export declined: nothing. Worker failed: the ladder computes on the main thread; the dial's working arc continues; no message. Unfinished section at the crown (hollow disc, long-press): "{Section}: unfinished. Tap to return." Reduced motion: no words change.
