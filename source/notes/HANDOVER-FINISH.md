# Mercer: the last steps, click by click (2 October 2026)

Everything in the polish pack is built and live at https://themissionautomation.com/mercer/ (build 17m). Four things need
a person. Each one below is written so it can be done without reading any code.

## 1. Turn on "Send to TMA" by email (about 25 minutes, needs two free accounts)

What it does: the review panel on the Start stage sends the sections the visitor ticks to the team's inbox. Until this is
done the panel says sending is not set up and hands over a PDF instead. Nothing on the site breaks either way.

### A. A sending account (Resend)
1. Open https://resend.com and press **Sign up**. Use the TMA email address. Confirm the email it sends you.
2. In the left menu press **Domains**, then **Add domain**. Type `themissionautomation.com` and press **Add**.
3. Resend shows three or four DNS records (a TXT and two or three CNAMEs). Open the place the domain's DNS is managed (the registrar or Cloudflare), press **Add record** for each one, copying **Type**, **Name** and **Value** exactly, and save. Back in Resend press **Verify DNS records**. Wait until every record shows a green **Verified**; this can take up to an hour.
4. In the left menu press **API Keys**, then **Create API key**. Name it `mercer-send`, leave **Full access**, press **Add**. Copy the key that appears (it starts with `re_`) into a password manager now; Resend never shows it again.

### B. The worker (Cloudflare)
5. Open https://dash.cloudflare.com and sign up or log in. In the left menu press **Workers & Pages**, then **Create**, then **Create Worker**. Name it `mercer-send` and press **Deploy** (it deploys a placeholder).
6. Press **Edit code**. Select everything in the editor (Ctrl+A), delete it, and paste the whole of the file `services/send/worker.js` from the repository (https://github.com/sevenfourse01/mercer, folder `source/services/send`). Press **Deploy** at the top right.
7. Press the back arrow to the worker's page, then **Settings**, then **Variables and Secrets**. Press **Add** four times and enter, one per row:
   - Type **Secret**, name `RESEND_API_KEY`, value: the `re_` key from step 4.
   - Type **Text**, name `TO_EMAIL`, value: the inbox the briefs should reach, e.g. `plans@themissionautomation.com`.
   - Type **Text**, name `FROM_EMAIL`, value: `Mercer <mercer@themissionautomation.com>` (the domain must be the one verified in step 3).
   - Type **Text**, name `ALLOWED_ORIGIN`, value: `https://themissionautomation.com`.
   Press **Deploy** when the page offers it.
8. On the worker's page copy its address; it looks like `https://mercer-send.<something>.workers.dev`. The sending address is that plus `/send`.

### C. Tell the site where the worker is
9. Open https://github.com/sevenfourse01/tma-leads-machine, open the folder `mercer`, open `index.html`, press the pencil (**Edit this file**).
10. Find the line that begins `<script>window.Mercer = window.Mercer || {}; window.Mercer.CONFIG =`. On the line **above** it, paste this, replacing the two addresses:
    `<script>window.MERCER_CONFIG = { sendEndpoint: 'https://mercer-send.<something>.workers.dev/send', shareEmail: 'plans@themissionautomation.com' };</script>`
11. Press **Commit changes**, keep the message, press **Commit changes** again. Wait two minutes for the site to rebuild.
12. Check: open https://themissionautomation.com/mercer/, go through to a plan, open **Start**, press **Send to TMA**. The panel should read "We'll email the information you select to the TMA team", show a name field and a way-to-reach-you field, and the button should read **Send to TMA**. Press it. The panel should say **Sent** within a few seconds and the brief should arrive in the inbox from step 7 with a `.md` attachment. If it says "Not sent: …", the reason names which of steps 3, 4 or 7 to check.

## 2. A second round by hand in a real browser (10 minutes)

1. Open https://themissionautomation.com/mercer/ in Chrome, press **I run a business**, then **Start**.
2. Answer the questions as any owner would until the screen titled **First-pass plan** appears (about 14 screens).
3. Press **Sharpen my plan (recommended)**. Write down the title of every screen that follows until the plan appears (expect around eight to twelve).
4. Pass if no title repeats one answered in step 2, and if the first few are about things the first plan said it was unsure of. Fail if any question from step 2 is asked again word for word: note its title.

## 3. The starter's category row (3 minutes)

1. Same site, press **I don't run a business yet**, then **Start**, and answer until the screen that lists directions as cards (titled with the directions, after the questions about what you are good at and who you could reach).
2. Pass if a row above the cards reads **Show: All / Services / Products and digital / Teaching and events / Content and audience / Partnerships** (only the categories with a card present appear), pressing one filters the cards, and a line under the cards reads **Or describe your own direction**.

## 4. Reduced motion and keyboard only (15 minutes)

Reduced motion:
1. Windows: **Settings → Accessibility → Visual effects → Animation effects: Off**. Mac: **System Settings → Accessibility → Display → Reduce motion: On**.
2. Open the site fresh and walk five questions, then the plan. Pass if nothing slides or fades (screens cut from one to the next), the tree still draws, and nothing is missing that appears with motion on.

Keyboard only (no mouse):
3. Open the site, press **Tab** until **I run a business** is outlined, press **Enter**; **Tab** to **Start**, **Enter**.
4. On each question use **Tab** to reach the controls, **Space** to pick a stone or card, type into a field, and **Tab** to **Continue** then **Enter**. Pass if every control can be reached and the walk advances; note any screen where Tab skips a control or Enter does nothing.
5. On the plan, **Tab** through **Your move / Why it fits / Your plan / Start**, press **Enter** on each; on **Your plan**, **Tab** to the four tabs and open each with **Enter**; press **Escape** on an open explanation. Pass if focus is always visible and nothing needs a mouse.

Report back the screen titles of anything that failed; that is enough to fix it.
