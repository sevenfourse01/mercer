/* From a forecast to a thing that is built.

   A plan that says "improve your follow-up" is a plan nobody runs. This file turns
   each step of the forecast into a system TMA builds, in an order, with a day count
   and a date, and against each one, the subscription the visitor told us they pay
   that the system takes over. Nothing here is a price for software Mercer has looked
   up: every pound in this section is a figure the visitor typed about their own bill.

   The systems and their day counts are TMA's own build catalogue. Whether a system is
   offered is decided by the answers, never by what would sell best. */
(() => {
'use strict';
const M = window.Mercer;
const S = () => M.state;

/* ---------------------------------------------------------------- what they pay for now */
const STACK = [
  { id: 'crm', name: 'CRM', eg: 'HubSpot, Pipedrive, Salesforce, Zoho' },
  { id: 'email', name: 'Email marketing', eg: 'Mailchimp, Klaviyo, ActiveCampaign, Brevo' },
  { id: 'booking', name: 'Booking or scheduling', eg: 'Calendly, Acuity, Cal.com, SimplyBook' },
  { id: 'chat', name: 'Website chat', eg: 'Intercom, Drift, Tawk, Crisp' },
  { id: 'proposal', name: 'Quotes and proposals', eg: 'PandaDoc, Better Proposals, Qwilr' },
  { id: 'esign', name: 'Contracts and e-signature', eg: 'DocuSign, Adobe Sign, Dropbox Sign' },
  { id: 'reviews', name: 'Reviews and reputation', eg: 'Trustpilot, Birdeye, Reviews.io, NiceJob' },
  { id: 'social', name: 'Social scheduling', eg: 'Buffer, Later, Hootsuite, Sprout' },
  { id: 'forms', name: 'Forms and surveys', eg: 'Typeform, Jotform, Gravity Forms' },
  { id: 'dash', name: 'Reporting or dashboards', eg: 'Databox, Geckoboard, Looker Studio' },
  { id: 'phone', name: 'Phone, SMS or WhatsApp', eg: 'Aircall, Twilio, RingCentral, Zoho Voice' },
  { id: 'pm', name: 'Projects and tasks', eg: 'Asana, Monday, ClickUp, Trello' },
  { id: 'inbox', name: 'Shared inbox or helpdesk', eg: 'Front, Zendesk, Freshdesk, Help Scout' },
  { id: 'automation', name: 'Automation', eg: 'Zapier, Make, Workato' },
  { id: 'attrib', name: 'Tracking and attribution', eg: 'Hyros, Triple Whale, Ruler' },
  { id: 'ai', name: 'AI assistants and writers', eg: 'Jasper, Copy.ai, ChatGPT Team' },
];
M.STACK = STACK;
const STACK_BY = Object.fromEntries(STACK.map((s) => [s.id, s]));
M.STACK_BY = STACK_BY;

/** what they told us they pay, a month, across everything they listed */
M.stackSpend = () => Object.values(S().stack ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);

/* ---------------------------------------------------------------- the build catalogue */
/* days and names are TMA's own; `when` reads the answers, and `takes` names the
   subscriptions this system takes over so the visitor's own figures can be totalled */
const SYSTEMS = [
  { id: 'SPEED', name: 'Speed-to-lead responder', days: 3, cat: 'Capture', takes: ['chat', 'booking', 'phone'],
    what: 'Answers each new enquiry within a minute, day or night, with a booking link on your open slots.',
    when: (s) => ['day', 'days', 'slow'].includes(s.responseTime) },
  { id: 'RESCUE', name: 'Missed-call rescue', days: 2, cat: 'Capture', takes: ['phone'],
    what: 'Texts back each missed call within thirty seconds, before the caller rings a competitor.',
    when: (s) => M.SECTOR_BY[s.sector]?.place === 'local' && (Number(s.stack?.phone) > 0 || ['day', 'days', 'slow'].includes(s.responseTime)) },
  { id: 'WEBCHAT', name: 'Website chat that books', days: 4, cat: 'Capture', takes: ['chat'],
    what: 'Answers the questions your site leaves open, and books the good enquiries.',
    when: (s) => ['book', 'sell'].includes(s.website) && (s.enquiries ?? 0) > 60 },
  { id: 'INTAKE', name: 'Enquiry form rebuild', days: 2, cat: 'Capture', takes: ['forms'],
    what: 'One form that asks what you need to know and files the answers in your system.',
    when: (s) => ['none', 'brochure'].includes(s.website) || (s.quotes !== null && s.enquiries !== null && s.quotes < s.enquiries * 0.5) },
  { id: 'TRIAGE', name: 'Inbox triage and draft replies', days: 4, cat: 'Qualify', takes: ['inbox', 'ai'],
    what: 'Sorts the inbox and drafts each reply in your words, for a person to send.',
    when: (s) => (s.marketingOwner === 'me' || s.breaksFirst === 'me') && (s.enquiries ?? 0) > 40 },
  { id: 'SCORE', name: 'Lead scoring and routing', days: 3, cat: 'Qualify', takes: ['crm'],
    what: 'Puts the enquiries worth your time at the top and routes the rest.',
    when: (s) => (s.enquiries ?? 0) > 100 },
  { id: 'QUOTE', name: 'Quote and proposal generator', days: 5, cat: 'Convert', takes: ['proposal', 'esign'],
    what: 'Sends a quote the same day, priced from your rules and signed online.',
    when: (s) => (s.price ?? 0) > 300 && (s.quotes !== null || ['weeks', 'month'].includes(s.leadTime)) },
  { id: 'NURTURE', name: 'Follow-up that stops on reply', days: 4, cat: 'Convert', takes: ['email', 'automation'],
    what: 'Sends the four follow-ups that tend to slip, and stops when the buyer replies.',
    when: (s) => (s.followUps ?? 0) <= 2 },
  { id: 'BOOKING', name: 'Booking and no-show recovery', days: 3, cat: 'Convert', takes: ['booking'],
    what: 'Books without the back and forth, sends two reminders, and refills the slot when someone cancels.',
    when: (s) => ['private-healthcare', 'hospitality'].includes(M.contentKey?.() ?? '') || s.cycle !== null && s.cycle <= 18 },
  { id: 'REACTIVATE', name: 'Dormant-list reactivation', days: 3, cat: 'Convert', takes: ['email'],
    what: 'Contacts the people who went quiet, with a reason to answer, at a pace that protects the list.',
    when: (s) => (s.listSize ?? 0) > 500 },
  { id: 'CRMBUILD', name: 'CRM build or migration', days: 5, cat: 'Deliver', takes: ['crm', 'pm'],
    what: 'One place the business runs from, with your own pipeline in it.',
    when: (s) => (s.systems ?? []).includes('none') || (s.systems ?? []).includes('sheets') },
  { id: 'CRM', name: 'Onboarding pack automation', days: 4, cat: 'Deliver', takes: ['esign', 'pm'],
    what: 'Sends each new customer their first-week pack on schedule.',
    when: (s) => (s.price ?? 0) > 1500 },
  { id: 'DOCS', name: 'Document and contract automation', days: 4, cat: 'Deliver', takes: ['esign', 'proposal'],
    what: 'Fills contracts, invoices and job paperwork from details you typed once.',
    when: (s) => ['thirty', 'sixty'].includes(s.terms) || (s.owed ?? 0) > 0 },
  { id: 'CALLS', name: 'Call notes into your CRM', days: 3, cat: 'Deliver', takes: ['ai', 'crm'],
    what: 'Writes up each call and files it in your CRM before you are back at your desk.',
    when: (s) => (s.cycle ?? 0) >= 60 },
  { id: 'REVIEW', name: 'Review and referral engine', days: 3, cat: 'Retain', takes: ['reviews'],
    what: 'Asks happy customers for a review once the job is done, and posts it where new customers look.',
    when: (s) => ['none', 'few', 'some'].includes(s.reviews) },
  { id: 'CONTENT', name: 'Content repurposer', days: 4, cat: 'Retain', takes: ['social', 'ai'],
    what: 'Turns one piece you make into a week of scheduled posts.',
    when: (s) => (s.contentTime ?? 99) <= 2 && (s.doing ?? []).some((id) => /^org-|^com-/.test(id)) },
  { id: 'WINBACK', name: 'Past-customer win-back', days: 3, cat: 'Retain', takes: ['email'],
    what: 'Asks past customers to buy again, with a reason to.',
    when: (s) => (s.repeat ?? 1) < 0.35 && (s.listSize ?? 0) > 100 },
  { id: 'DASH', name: 'Live KPI dashboard', days: 5, cat: 'Measure', takes: ['dash'],
    what: 'Shows the six numbers behind this forecast in one live view, to measure next quarter against.',
    when: () => true },
  { id: 'ATTRIB', name: 'Enquiry source tracking', days: 4, cat: 'Measure', takes: ['attrib', 'automation'],
    what: 'Ties each enquiry to what brought it in, so you can see which spend works.',
    when: (s) => (s.budget ?? 0) >= 1000 && (s.doing ?? []).length >= 3 },
];
M.SYSTEMS = SYSTEMS;

/** the systems this business's own answers ask for, in build order */
function buildFor() {
  const s = S();
  const p = M.planned;
  const picked = SYSTEMS.filter((sys) => { try { return sys.when(s, p); } catch (e) { return false; } });
  // what limits growth first is built first: there is no point speeding up the front door of a full business
  const bind = p?.binding;
  const rank = (sys) => {
    let r = { Capture: 2, Qualify: 3, Convert: 1, Deliver: 4, Retain: 5, Measure: 6 }[sys.cat] ?? 9;
    if (bind === 'client_capacity' && ['Deliver', 'Measure'].includes(sys.cat)) r -= 3;
    if (bind === 'client_capacity' && sys.cat === 'Capture') r += 3;
    if (bind === 'market_depletion' && sys.cat === 'Retain') r -= 2;
    return r;
  };
  const ordered = picked.sort((a, b) => rank(a) - rank(b) || a.days - b.days);
  // ten is a quarter's work: past that it is a roadmap, not a build, and the call sets the rest
  ordered.dropped = Math.max(0, ordered.length - 10);
  const out = ordered.slice(0, 10);
  out.dropped = ordered.dropped;
  return out;
}
M.buildFor = buildFor;

/** the monthly bill this build takes over, using only figures the visitor typed */
function retired(list) {
  const stack = S().stack ?? {};
  const hit = {};
  list.forEach((sys) => sys.takes.forEach((k) => { if (Number(stack[k]) > 0) hit[k] = Number(stack[k]); }));
  const total = Object.values(hit).reduce((a, b) => a + b, 0);
  return { byId: hit, total, names: Object.keys(hit).map((k) => STACK_BY[k]?.name ?? k) };
}
M.retiredBy = retired;

/** when each system lands, one after another, five working days a week */
function schedule(list, startISO) {
  const start = startISO ? new Date(startISO) : new Date();
  let cursor = new Date(start);
  return list.map((sys) => {
    const from = new Date(cursor);
    let left = sys.days;
    while (left > 0) { cursor.setDate(cursor.getDate() + 1); if (cursor.getDay() !== 0 && cursor.getDay() !== 6) left--; }
    const to = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    return { sys, from, to };
  });
}
M.buildSchedule = schedule;
})();
