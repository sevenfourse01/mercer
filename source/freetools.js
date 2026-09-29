/* freetools.js (Mercer 12, owner (f) results): free alternatives to the sixteen STACK categories.

   Every row is notes/facts-free-tools.md, read 19 September 2026, with the page each limit was read
   from. Twilio is a trial, so it reads "free to test". Cal.diy and n8n carry their licence condition.
   The tracking tools (row 15) are called tracking, never attribution. Rows resting on a secondary
   source say so in `note`. No limit appears here that the note does not hold. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer || {});

const ROWS = {
  crm: [
    { tool: 'HubSpot Free CRM', tier: 'free plan, $0 a month', limit: '1,000 contacts, up to 2 users, 2,000 marketing email sends a calendar month with HubSpot branding', url: 'https://www.hubspot.com/pricing/crm' },
    { tool: 'Twenty', tier: 'AGPLv3 self-host', limit: 'no plan limit; you host it', url: 'https://github.com/twentyhq/twenty' },
  ],
  email: [
    { tool: 'Brevo Free', tier: 'free plan', limit: '300 emails a day, up to 100,000 contacts', url: 'https://www.emailvendorselection.com/brevo-pricing/', note: 'third-party figures; the vendor page did not render' },
    { tool: 'MailerLite Free', tier: 'free plan', limit: '250 subscribers, 2,500 emails a month, 2 user seats, 3 automations', url: 'https://www.mailerlite.com/pricing' },
    { tool: 'listmonk', tier: 'AGPLv3 self-host', limit: 'no plan limit; you supply SMTP', url: 'https://github.com/knadh/listmonk' },
  ],
  booking: [
    { tool: 'Cal.com Free', tier: 'free forever', limit: '1 user; unlimited event types and calendars', url: 'https://cal.com/pricing' },
    { tool: 'Cal.diy', tier: 'MIT self-host', limit: 'community-maintained, no support', url: 'https://cal.com/blog/calcom-v6-4', condition: 'Cal.diy, MIT self-host, community-maintained, no support.' },
    { tool: 'Google Calendar appointment schedules', tier: 'free with a personal Google Account', limit: 'a single booking page; payments, email verification and co-hosts need Workspace tiers', url: 'https://support.google.com/calendar/answer/16287038?hl=en' },
  ],
  chat: [
    { tool: 'tawk.to', tier: 'live chat free', limit: 'branding removal $29 a month; AI Assist from $29 a month', url: 'https://www.tawk.to/pricing/' },
    { tool: 'Crisp Free', tier: 'free plan, 2 seats', limit: '100 customer profiles; chat widget, contact form and email only', url: 'https://crisp.chat/en/pricing/' },
    { tool: 'Chatwoot', tier: 'MIT self-host', limit: 'no plan limit; you host it', url: 'https://github.com/chatwoot/chatwoot' },
  ],
  proposal: [
    { tool: 'Invoice Ninja', tier: 'Elastic License, source-available self-host', limit: 'white-label licence $40 a year to remove branding; hosted plans are paid', url: 'https://github.com/invoiceninja/invoiceninja' },
  ],
  esign: [
    { tool: 'DocuSeal', tier: 'AGPLv3 self-host; Cloud Basic $0 a user a month', limit: 'cloud: 10 request emails a month; self-host: unlimited via own SMTP', url: 'https://www.docuseal.com/pricing' },
    { tool: 'Documenso', tier: 'AGPL-3.0 self-host', limit: 'cloud free-tier limits not confirmed', url: 'https://github.com/documenso/documenso' },
  ],
  reviews: [
    { tool: 'Google Business Profile', tier: 'no charge', limit: 'Google reviews only', url: 'https://support.google.com/business/answer/7039811?hl=en' },
    { tool: 'Trustpilot Free', tier: 'free plan', limit: '50 review invitations a month, 1 widget, 300 review-collector clicks a month', url: 'https://business.trustpilot.com/pricing' },
  ],
  social: [
    { tool: 'Buffer Free', tier: 'free plan', limit: '3 channels, 10 scheduled posts a channel, 1 user', url: 'https://buffer.com/pricing' },
    { tool: 'Postiz', tier: 'AGPL-3.0 self-host', limit: 'you host it', url: 'https://github.com/gitroomhq/postiz-app' },
  ],
  forms: [
    { tool: 'Tally', tier: 'unlimited forms and submissions, free', limit: 'fair use at 50,000 submissions a month, 100 GB uploads a month or 500 GB stored, 50,000 email notifications a month', url: 'https://tally.so/pricing' },
    { tool: 'Jotform Starter', tier: 'free plan', limit: '5 forms, 100 submissions a month, 10,000 views a month, Jotform branding', url: 'https://www.jotform.com/pricing/' },
  ],
  dash: [
    { tool: 'Looker Studio', tier: 'no-cost tool', limit: 'Pro (paid) adds org-owned reports and support; the free tier has no SLA', url: 'https://docs.cloud.google.com/looker/docs/studio?hl=en' },
    { tool: 'Metabase OSS', tier: 'AGPL self-host', limit: 'commercial editions under a separate licence', url: 'https://github.com/metabase/metabase' },
  ],
  phone: [
    { tool: 'WhatsApp Business app', tier: 'free to download and use for small businesses', limit: 'official page fetched truncated; wording from third-party listings', url: 'https://faq.whatsapp.com/1060909311260819', note: 'third-party wording' },
    { tool: 'Twilio', tier: 'free to test', limit: '100 SMS, 100 WhatsApp messages, 3,000 emails and 75 voice minutes on the trial; only to verified numbers (up to 5); the trial expires after 30 days', url: 'https://www.twilio.com/docs/messaging/guides/how-to-use-your-free-trial-account', trial: true },
  ],
  pm: [
    { tool: 'Trello Free', tier: 'free plan', limit: '10 boards a Workspace, 10 collaborators, 250 Workspace command runs a month', url: 'https://trello.com/pricing' },
    { tool: 'Plane', tier: 'AGPL-3.0 self-host; Cloud Free plan', limit: 'cloud: 12 users; work items, cycles, modules included', url: 'https://plane.so/pricing' },
  ],
  inbox: [
    { tool: 'FreeScout', tier: 'AGPL-3.0 self-host', limit: 'you host it', url: 'https://github.com/freescout-help-desk/freescout' },
    { tool: 'Chatwoot', tier: 'MIT self-host', limit: 'you host it', url: 'https://github.com/chatwoot/chatwoot' },
  ],
  automation: [
    { tool: 'Zapier Free', tier: 'free plan', limit: '100 tasks a month, two-step Zaps only, no premium apps', url: 'https://zapier.com/pricing' },
    { tool: 'Make Free', tier: 'free plan', limit: '1,000 credits a month, 2 active scenarios, 15-minute minimum interval', url: 'https://www.make.com/en/pricing' },
    { tool: 'n8n', tier: 'Sustainable Use License', limit: 'cannot resell or host for others without an Enterprise licence', url: 'https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md', condition: 'n8n, Sustainable Use License: your own internal use only.' },
  ],
  attrib: [
    { tool: 'Umami', tier: 'MIT self-host; Cloud Hobby free', limit: 'hobby limits are from third-party pages, not the official FAQ', url: 'https://github.com/umami-software/umami', note: 'tracking, not ad-spend attribution' },
    { tool: 'Plausible CE', tier: 'AGPLv3 self-host', limit: 'cloud is paid; you run the server', url: 'https://github.com/plausible/analytics', note: 'tracking, not ad-spend attribution' },
    { tool: 'PostHog', tier: 'MIT except ee/; first 1 million events a month free', limit: 'usage-based after that', url: 'https://posthog.com/pricing', note: 'tracking, not ad-spend attribution' },
  ],
  ai: [
    { tool: 'Claude Free', tier: 'free plan', limit: 'usage resets on a rolling five-hour session window', url: 'https://claude.com/pricing' },
    { tool: 'Ollama', tier: 'open source; local models always free', limit: 'needs a machine that can run the model', url: 'https://ollama.com/' },
  ],
};

/* the category word the row prints: row 15 says "tracking" (facts-free-tools.md, notes for the copy) */
const CATEGORY_WORD = { attrib: 'Tracking' };
const categoryName = (id) => CATEGORY_WORD[id] ?? M.STACK_BY?.[id]?.name ?? id;

/* rebuild 1 (brief 10.5): a row that quotes a price ($29 a month, $40 a year) carries "Check current price before buying".
   The prices were read on 19 September 2026 and are not verified since; the line goes wherever the row is printed */
const PRICE_RE = /[$£€]\s?\d/;
const CHECK_PRICE = 'Check current price before buying';
const READ_ON = 'Read 19 September 2026; check before you rely on it';
const quotesPrice = (row) => PRICE_RE.test(`${row?.tier ?? ''} ${row?.limit ?? ''}`);
const rowsFor = (stackId) => (ROWS[stackId] ?? []).map((r) => ({ ...r, priceQuoted: quotesPrice(r), check: quotesPrice(r) ? CHECK_PRICE : null, readOn: READ_ON }));

/** one row as COPY §17 prints it, with the price check where a price is quoted */
function line(row, stackId) {
  if (!row) return '';
  const check = quotesPrice(row) ? ` ${CHECK_PRICE}. ${READ_ON}.` : ` ${READ_ON}.`;
  if (row.condition) return `${row.condition}${check}`;
  if (row.trial) return `Twilio, free to test: ${row.limit}.${check}`;
  return `${categoryName(stackId)}: ${row.tool}, ${row.tier}, ${row.limit}.${check}`;
}

/* which AI: the two claims are rows 44 and 45 of the note */
const buildLine = 'To build a small tool yourself: Claude Free (usage resets on a rolling five-hour window) or Ollama (local models, free, needs a machine that can run them).';
/* how: three plain steps, shown to everyone. They are instructions and hold no figure, so they cite nothing (fix 3, C11.3);
   row 44 lists files, code and Artifacts on the free plan, which is what step 3 asks for */
const buildSteps = [
  'Write one paragraph saying what the tool must do.',
  'Give the AI your Mercer markdown file (For your AI).',
  'Ask for one HTML file you can open in a browser.',
];
const totalLine = (total) => `${typeof M.gbp === 'function' ? M.gbp(total) : '£' + Math.round(total)} a month you could stop paying, if the free tiers’ limits fit you.`;

/** the categories the visitor filled (a name or a fee) that have a free row, with the fee they pay */
function used(state) {
  const s = state ?? M.state ?? {};
  const fees = s.stack ?? {};
  const names = s.stackNames ?? {};
  const ids = new Set([...Object.keys(fees).filter((k) => fees[k] !== null && fees[k] !== undefined && fees[k] !== ''), ...Object.keys(names).filter((k) => String(names[k] ?? '').trim())]);
  return [...ids].filter((id) => ROWS[id]?.length).map((id) => ({ id, name: categoryName(id), fee: Number(fees[id]) || 0, rows: rowsFor(id) }));
}

/* ---------- fix 3, C11: the visitor who named no software still gets the section. Everything below is additive. ---------- */
/** said first when nothing was named, so no row reads as the visitor's own (request 8) */
const noneLine = 'You named no software.';
/** the rows shown when nothing was named: the first three kinds of the ledger (build.js STACK order), with no fee and no
    total. The same shape as used(), so one renderer prints either */
const DEFAULT_IDS = ['crm', 'email', 'booking'];
const defaults = () => DEFAULT_IDS.filter((id) => ROWS[id]?.length).map((id) => ({ id, name: categoryName(id), fee: 0, rows: rowsFor(id) }));
/** what the card prints: the visitor's own kinds, or the three defaults with `named: false` */
function shown(state) {
  const u = used(state);
  return u.length ? { named: true, kinds: u, total: u.reduce((a, k) => a + k.fee, 0) } : { named: false, kinds: defaults(), total: 0 };
}
/** every kind that has a free row, for the markdown file (the AI's file takes all sixteen): the visitor's own first with
    their fee, then the rest in ledger order */
function all(state) {
  const mine = used(state);
  const have = new Set(mine.map((k) => k.id));
  return [...mine, ...Object.keys(ROWS).filter((id) => !have.has(id) && ROWS[id]?.length).map((id) => ({ id, name: categoryName(id), fee: 0, rows: rowsFor(id) }))];
}
/** the Money card's face line (C11.1): the total keeps its condition ("if the free tiers’ limits fit you") */
function faceLine(state) {
  const u = used(state);
  const total = u.reduce((a, k) => a + k.fee, 0);
  if (total > 0) return totalLine(total);
  if (u.length) return u.length === 1 ? 'Free tools for the kind you named' : `Free tools for the ${u.length} kinds you named`;
  return 'Free tools, and how to build your own';
}

/* ---------- rebuild 1 (brief 13.2, "Resources and purchases"): already owned, essential now, later only, avoid for now ---------- */
/* the kinds each asset or action area needs: the plan's own words map to the ledger's sixteen kinds */
const NEED_OF = {
  'booking-process': ['booking'], 'outreach-message': ['crm', 'email'], 'follow-up-sequence': ['crm'], 'review-request': ['reviews'], 'offer-sheet': ['forms'],
  'delivery-checklist': ['pm'], proposal: ['proposal', 'esign'], listing: [], 'content-plan': ['social'], 'implementation-brief': ['ai'], 'execution-brief': ['ai'], 'validation-script': [], 'referral-ask': [], 'introduction-message': [], 'price-notice': [],
  capacity: ['booking'], conversion: ['crm', 'booking'], channel: ['crm', 'email'], trust: ['reviews'], process: ['pm', 'automation'], delegation: ['pm'], cash: ['proposal'], retention: ['crm', 'email'], validation: ['forms'], discovery: ['forms'], buyer: ['forms'], offer: ['forms'],
};
const LATER = new Set(['automation', 'dash', 'attrib', 'chat', 'inbox', 'social', 'esign', 'phone']);
/** which tool a plan's owner already has, needs now, could use later, and should avoid for now. `plan` is the plan object
    (its actions and assets say what is needed; its state's stackNames says what is owned; a zero budget rules out any
    paid tier and any advertising). Every row keeps its price check. Nothing here is a purchase the plan requires */
function forPlan(plan, state) {
  const s = state ?? M.state ?? {};
  const owned = used(s);
  const ownedIds = new Set(owned.map((k) => k.id));
  const ownedNames = new Set(Object.values(s.stackNames ?? {}).filter(Boolean).map((n) => String(n).toLowerCase()));
  (plan?.toolsOwned ?? []).forEach((n) => ownedNames.add(String(n).toLowerCase()));
  const primaries = (plan?.actions ?? []).filter((a) => a.status === 'primary');
  const needs = new Set();
  const later = new Set();
  primaries.forEach((a) => { (NEED_OF[a.asset] ?? []).forEach((k) => needs.add(k)); (NEED_OF[a.area] ?? []).forEach((k) => later.add(k)); });
  (plan?.assets ?? []).forEach((a) => (NEED_OF[a.kind] ?? []).forEach((k) => needs.add(k)));
  needs.forEach((k) => later.delete(k));
  const budget0 = plan?.route === 'starter' ? (plan?.starter?.budgetKnown && plan.starter.budget === 0) : (Number(s.budget) === 0);
  const entry = (id) => ({ id, name: categoryName(id), rows: rowsFor(id).filter((r) => !budget0 || !r.priceQuoted || /free|\$0|£0/i.test(r.tier)) });
  const now = [...needs].filter((id) => !ownedIds.has(id) && ROWS[id]?.length && !LATER.has(id)).map(entry);
  const laterIds = new Set([...[...needs].filter((id) => LATER.has(id)), ...later]);
  const laterRows = [...laterIds].filter((id) => !ownedIds.has(id) && ROWS[id]?.length).map(entry);
  const avoid = [
    { item: 'Paid advertising', why: budget0 ? 'no budget for it, and the first buyers come from people you can reach for nothing' : 'not until the free routes have been tried for a month and counted' },
    { item: 'Paid tiers of any tool above', why: 'the free tiers cover the first month; check current price before buying if a limit is reached' },
    ...(plan?.route === 'starter' ? [{ item: 'A paid website or app build', why: 'a one-page offer sheet and a free form cover the first test' }] : []),
  ];
  return {
    owned: owned.map((k) => ({ id: k.id, name: k.name, tool: (s.stackNames ?? {})[k.id] ?? null, fee: k.fee })).concat([...ownedNames].filter((n) => !owned.some((k) => String((s.stackNames ?? {})[k.id] ?? '').toLowerCase() === n)).map((n) => ({ id: null, name: n, tool: n, fee: 0 }))),
    now, later: laterRows, avoid, budget0, check: CHECK_PRICE,
    note: budget0 ? 'A zero budget: only free tiers and what you own are listed as needed now.' : 'Free tiers first; a paid tier only when a limit is reached, and the price checked before buying.',
  };
}

M.freetools = { ROWS, READ_ON, rowsFor, line, buildLine, buildSteps, totalLine, used, categoryName, noneLine, DEFAULT_IDS, defaults, shown, all, faceLine, forPlan, quotesPrice, CHECK_PRICE, NEED_OF };
})();
