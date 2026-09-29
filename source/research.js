/* Reading the web, for real.
   A published page cannot fetch another host: the viewer's policy blocks it. So the
   reading happens where TMA already does it, services/archive/research.ts on the
   archive, which crawls the visitor's own site and then asks a model that searches
   the open web. This file is only the client: it streams what the archive sends, and
   it refuses to turn anything it hears into an answer. A suggestion carries a quote
   and the page it came from; it fills a field when the visitor presses it, and never
   before. Nothing else on this page trusts it.

   The address leaves the browser on one press and no other way: typing shows a "Read my
   site" stone with a line that says where the address goes, and the fetch runs when that
   stone is pressed. A pasted homepage is read here, in the browser, and sends nothing.
   M.research.sent turns true just before the fetch, so the exports can say what left.
   The reader's address comes from the build (window.MERCER_ARCHIVE); a link cannot set it.

   Mercer 12: mounted by questions.js on the import step's web address line (M.research.mount(textarea, host)).
   A confirmed "who" find writes state.buyerNote (a string for the briefing), never state.buyer.

   Refine 1 (R12): one found-list for every way in. The site reader, pasted text and a picked file all fill the same
   list through add(); M.research.readText(text, sourceLabel) is the local parse (this browser, nothing sent) and
   M.research.found() hands the list to the import step, where each find can be edited, excluded or confirmed.
   A find changes an answer only on Confirm. M.research.found is also array-like (length, some, filter, find, map,
   forEach, every, iteration) over the finds still standing as found (not excluded, not edited by hand), which is what
   app.js reads to mark an answer as one that came from the website.

   Rebuild 1 (R20): M.research.readFile(file) reads one local file in this browser: .txt, .md and .csv through
   FileReader, a text PDF through pdf.js and a .docx through mammoth, both fetched from cdnjs by a script tag the first
   time they are needed (the page's CSP allows cdnjs). 10 MB limit. A scanned PDF gives "No text found in this file".
   It never throws: the result is { ok, kind, name, words, added, error }. No website is fetched by this page: an address
   is kept as context, and the one line that says so is written at the moment of use (M.research.URL_WORDS). */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer ?? {});
const S = () => M.state ?? (M.state = {});
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/* the box takes an address or a whole page; the answer is only ever the address */
const TLD = /(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:co\.uk|org\.uk|ac\.uk|gov\.uk|com|uk|org|net|io|co|biz|info|shop|london|scot|wales|ie|eu)(?:\/[^\s"'<>]*)?/i;
const siteFrom = (v) => { const m = String(v ?? '').match(TLD); return m ? m[0].replace(/[.,;:)]+$/, '').slice(0, 200) : ''; };
if (typeof M.siteFrom !== 'function') M.siteFrom = siteFrom;
const addrOf = (v) => (typeof M.siteFrom === 'function' ? M.siteFrom(v) : siteFrom(v));

/* Where the reader lives: what the page was built with (window.MERCER_ARCHIVE), and nothing a link can set.
   ?archive= is a developer's switch. It is read only when this page itself is open on this machine (localhost or a
   file), and only when it points at this machine too. Anywhere else the parameter is ignored, and a host that an
   older link left in storage is thrown away, so no link can choose where a visitor's address goes. */
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/i;
const devPage = () => { try { return location.protocol === 'file:' || LOCAL_HOST.test(location.hostname); } catch (e) { return false; } };
const localOnly = (u) => {
  if (!u) return '';
  try { const x = new URL(String(u)); return /^https?:$/.test(x.protocol) && LOCAL_HOST.test(x.hostname) ? `${x.origin}${x.pathname}`.replace(/\/$/, '') : ''; } catch (e) { return ''; }
};
function endpoint() {
  const built = String(window.MERCER_ARCHIVE || '').replace(/\/$/, '');
  let saved = '';
  try {
    const raw = localStorage.getItem('mercer-archive');
    saved = devPage() ? localOnly(raw) : '';
    if (raw && !saved) localStorage.removeItem('mercer-archive');
  } catch (e) { saved = ''; }
  if (!devPage()) return built;
  let q = '';
  try { q = localOnly(new URLSearchParams(location.search).get('archive')); } catch (e) { q = ''; }
  if (q) { try { localStorage.setItem('mercer-archive', q); } catch (e) {} return q; }
  return saved || built;
}
/** the reader's token: the one the page was built with, never one from the URL. A developer's own token, kept in
    storage by hand, goes only to a reader on this machine */
function token() {
  if (devPage() && localOnly(endpoint())) { try { const t = localStorage.getItem('mercer-archive-token'); if (t) return t; } catch (e) {} }
  return String(window.MERCER_ARCHIVE_TOKEN || '');
}
const BRAIN = 'groq';

/** every field a find may fill: the words on its row, the question it belongs to (q), how a typed edit is read, how the
    value is shown, how it is put into the answers (apply) and how it is taken back out (undo: only while the answer is
    still the one this find wrote). Nothing here runs until the visitor presses Confirm or Use. */
const YEAR_NOW = () => new Date().getFullYear();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "20,000", "£20k", "1.2m" as a number; NaN when there is no figure */
const digits = (v) => { const m = String(v ?? '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([km])?\b/i); if (!m) return NaN; return Number(m[1]) * (m[2] ? (m[2].toLowerCase() === 'k' ? 1e3 : 1e6) : 1); };
const money = (n) => `£${Math.round(Number(n) || 0).toLocaleString('en-GB')}`;
const whole = (n) => Math.round(Number(n) || 0).toLocaleString('en-GB');
const textOf = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const setKey = (key, value) => { const st = S(); st[key] = value; if (st.derived) delete st.derived[key]; };
const clearKey = (key, was) => { const st = S(); if (st[key] !== was) return; st[key] = null; };
const FILL = {
  biz: { label: 'Business name', q: 'biz', read: (v) => textOf(v, 80), show: String,
    apply: (v) => { if (!v) return; S().biz = v; const box = document.getElementById('biz'); if (box) box.value = v; },
    undo: (v) => { if (S().biz !== v) return; S().biz = ''; const box = document.getElementById('biz'); if (box) box.value = ''; } },
  offer: { label: 'What you sell', q: 'sector', read: (v) => textOf(v, 60), show: String,
    apply: (v) => { if (v) S().trade = v; }, undo: (v) => { if (S().trade === v) S().trade = ''; } },
  price: { label: 'Sale value', q: 'price', number: true, read: (v) => Math.round(digits(v)), show: money,
    apply: (v) => setKey('price', v), undo: (v) => clearKey('price', v) },
  market: { label: 'Location', q: 'place', read: (v) => textOf(v, 80), show: String,
    apply: (v) => { if (v) S().place = v; }, undo: (v) => { if (S().place === v) S().place = ''; } },
  who: { label: 'Who buys', q: 'buyer', read: (v) => textOf(v, 80), show: String,
    apply: (v) => { S().buyerNote = v; }, undo: (v) => { if (S().buyerNote === v) S().buyerNote = ''; } },
  /* a headcount is the Team question's figure (state.teamSize), which is also where app.js looks for a website find */
  team: { label: 'Team', q: 'teamSize', number: true, read: (v) => Math.min(9999, Math.round(digits(v))), show: (v) => `${whole(v)} ${whole(v) === '1' ? 'person' : 'people'}`,
    apply: (v) => setKey('teamSize', v), undo: (v) => clearKey('teamSize', v) },
  capacity: { label: 'Capacity a month', q: 'capacity', number: true, read: (v) => Math.round(digits(v)), show: whole,
    apply: (v) => setKey('capacity', v), undo: (v) => clearKey('capacity', v) },
  now: { label: 'Revenue a month', q: 'now', number: true, read: (v) => Math.round(digits(v)), show: (v) => `${money(v)} a month`,
    apply: (v) => setKey('now', v), undo: (v) => clearKey('now', v) },
  margin: { label: 'Margin', q: 'margin', number: true, read: (v) => { const n = digits(v); return n > 0 && n < 100 ? Number((n / 100).toFixed(3)) : NaN; }, show: (v) => `${Math.round(v * 100)}%`,
    apply: (v) => setKey('margin', v), undo: (v) => clearKey('margin', v) },
  enquiries: { label: 'Enquiries a month', q: 'enquiries', number: true, read: (v) => Math.round(digits(v)), show: whole,
    apply: (v) => setKey('enquiries', v), undo: (v) => clearKey('enquiries', v) },
  /* the value is the year; a month named beside it rides on the find (item.month, 1 to 12) */
  founded: { label: 'Established', q: 'yearsTrading', number: true,
    read: (v) => { const m = String(v ?? '').match(/\b(?:19|20)\d{2}\b/); const y = m ? Number(m[0]) : NaN; return y >= 1900 && y <= YEAR_NOW() ? y : NaN; },
    show: (v, it) => (it?.month ? `${MONTHS[it.month - 1]} ${v}` : String(v)),
    apply: (v, it) => { setKey('yearsTrading', YEAR_NOW() - v); if (it?.month) S().estMonth = it.month; },
    undo: (v) => clearKey('yearsTrading', YEAR_NOW() - v) },
  channels: { label: 'How they sell', q: null, read: (v) => textOf(v, 120), show: String, apply: () => {}, undo: () => {} },
};
/* the keys a confirmed find may move; app.js re-runs the forecast on the ones the engine reads */
const ENGINE_OF = { offer: 'industry', price: 'price', capacity: 'capacity', now: 'now', margin: 'margin', team: 'teamSize', enquiries: 'enquiries', founded: 'yearsTrading', market: 'place' };

const found = [];      // every find, from the reader, pasted text or a file: { id, field, label, q, value, month, quote, source, by, status, edited }
const facts = [];      // what the crawl itself found on their own pages
let status = 'idle';   // idle | reading | asking | done | off | failed
let live = null;
let host = null;       // the .site-found element under the website line, set by mount()
let boxEl = null;

/* sent: false until the visitor presses Read my site; true from the line before the fetch, for the rest of the visit.
   canopy.js reads it for the export header. Pasted text never sets it: that is read here and goes nowhere. */
/** the list as the import step reads it. Called, it gives every find (excluded ones too, so they can be brought back).
    Read as an array, it holds the finds still standing as found, so `M.research.found.some(...)` in app.js keeps working */
const standing = () => found.filter((f) => f.status !== 'excluded' && !f.edited);
const foundList = () => { seed(); return found.slice(); };
['some', 'filter', 'find', 'map', 'forEach', 'every'].forEach((k) => { foundList[k] = (...a) => standing()[k](...a); });
foundList[Symbol.iterator] = function* iterate() { yield* standing(); };
Object.defineProperty(foundList, 'length', { get: () => standing().length });
/* the one line about the address, said where the address is typed and nowhere else (R15, brief 14.5) */
const URL_WORDS = 'This page does not fetch websites: the address is kept as context for your plan.';
M.research = { found: foundList, facts, get status() { return status; }, endpoint, run, mount, sent: false, readText, readFile, confirm, exclude, restore, edit, foundFor, shown, FIELDS: FILL, URL_WORDS, FILE_LIMIT: 10 * 1048576, ACCEPT: '.txt,.md,.csv,.pdf,.docx', loaders: null };

const sandboxed = () => /claude\.ai$|\.claudeusercontent\.com$|\.claude\.site$/.test(location.hostname);
M.sandboxed = sandboxed;
/** true when this copy can reach a server that reads sites; false means the paste box is the way in */
M.researchLive = () => Boolean(endpoint());
/** true once something has been read and offered */
M.researchRead = () => found.length > 0;

/** one quiet status line under the box; a new one replaces the old */
function line(html, cls = '') {
  if (!host) return null;
  let el = host.querySelector('.site-status');
  if (!el) { el = document.createElement('p'); el.className = 'site-status small'; host.prepend(el); }
  el.className = `site-status small ${cls}`;
  el.innerHTML = html;
  return el;
}
function clearHost() { if (host) host.innerHTML = ''; }

/* ---------------------------------------------------------------- reading text in this browser */
/* The same fields, pulled out of whatever they paste or pick. Every find carries the sentence or row it came from, so
   nothing is taken on trust; a line that cannot be quoted is not offered. Nothing here is sent anywhere. */
const FIG = '£?\\s?([\\d,]+(?:\\.\\d+)?\\s*[km]?)\\b';
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const monthOf = (w) => { const i = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(String(w ?? '').slice(0, 3).toLowerCase()); return i < 0 ? null : i + 1; };
const GRAB = [
  { field: 'price', re: /(?:from|only|just|prices? (?:from|start(?:ing)? at)|per (?:night|session|month|hour|job))\s*£\s?([\d,]+(?:\.\d\d)?)/i, take: (m) => Math.round(Number(m[1].replace(/,/g, ''))) },
  { field: 'price', re: /£\s?([\d,]+(?:\.\d\d)?)\s*(?:per|a|each)\s*(?:night|session|month|hour|person|head|job|treatment)/i, take: (m) => Math.round(Number(m[1].replace(/,/g, ''))) },
  { field: 'price', re: new RegExp(`(?:average|typical)\\s+(?:sale|order|job|invoice|deal)(?:\\s+value)?\\D{0,12}${FIG}`, 'i'), take: (m) => Math.round(digits(m[1])) },
  // no capacity line: a count of rooms or seats is not work a month, and Mercer does not multiply its way to one
  { field: 'team', re: /(?:team of|staff of|we are|we're)\s*(\d{1,4})\b/i, take: (m) => Number(m[1]) },
  { field: 'team', re: /(?:team size|headcount|employees|staff)\s*[:,=\t]\s*"?(\d{1,4})\b/i, take: (m) => Number(m[1]) },
  { field: 'team', re: /\b(\d{1,4})\s*(?:employees|members of staff|staff)\b/i, take: (m) => Number(m[1]) },
  // revenue only where the line says which period it covers; a year's figure is shown as a month's and says so
  { field: 'now', re: new RegExp(`(?:monthly\\s+(?:revenue|turnover|sales|income)|(?:revenue|turnover|sales|income)\\s+(?:a|per|each)\\s+month)\\D{0,12}${FIG}`, 'i'), take: (m) => Math.round(digits(m[1])) },
  { field: 'now', re: new RegExp(`(?:(?:annual|yearly)\\s+(?:revenue|turnover|sales)|(?:revenue|turnover|sales)\\s+(?:a|per|each|last|this)\\s+year)\\D{0,12}${FIG}`, 'i'), take: (m) => Math.round(digits(m[1]) / 12), note: (m) => `${money(digits(m[1]))} a year, divided by twelve` },
  { field: 'margin', re: /gross\s+(?:profit\s+)?margin\D{0,12}(\d{1,2}(?:\.\d)?)\s*%/i, take: (m) => Number((Number(m[1]) / 100).toFixed(3)) },
  { field: 'enquiries', re: /\b(\d{1,5})\s*(?:new\s+)?(?:enquiries|inquiries|leads)\s*(?:a|per|each)\s*month/i, take: (m) => Number(m[1]) },
  { field: 'enquiries', re: /(?:enquiries|inquiries|leads)\s+(?:a|per|each)\s+month\s*[:,=\t]\s*"?(\d{1,5})\b/i, take: (m) => Number(m[1]) },
  { field: 'founded', re: new RegExp(`(?:established|founded|incorporated|trading since|in business since|est\\.?)\\s*(?:in\\s+)?[:,]?\\s*(?:${MONTH_RE}\\s+)?((?:19|20)\\d{2})\\b`, 'i'), take: (m) => Number(m[2]), month: (m) => monthOf(m[1]) },
];

/** the finds in one piece of text, one per field, each with the sentence or row it was read from */
function readPasted(text, sourceLabel) {
  const out = [];
  const sentences = String(text).slice(0, 200000).split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 4 && x.length < 300);
  const had = new Set();
  sentences.forEach((sent) => {
    GRAB.forEach((g) => {
      if (had.has(g.field)) return;
      const m = sent.match(g.re);
      if (!m) return;
      const value = g.take(m);
      if (!Number.isFinite(value) || value <= 0) return;
      if (g.field === 'founded' && (value < 1900 || value > YEAR_NOW())) return;
      had.add(g.field);
      out.push({ field: g.field, value, month: g.month ? g.month(m) : null, note: g.note ? g.note(m) : '', quote: sent, source: sourceLabel || S().site || 'the text you pasted', by: 'text read in this browser' });
    });
  });
  return out;
}
M.readPasted = readPasted;

/* ---------------------------------------------------------------- the found-list */
let seq = 0;
let seeded = false;
const changed = (item) => { keep(); try { document.dispatchEvent(new CustomEvent('mercer:found', { detail: { id: item?.id ?? null } })); } catch (e) { /* no document */ } };
/** what the list needs to come back after a reload when Save on this device is on: the finds, never the text they came from */
function keep() {
  S().imported = found.slice(0, 24).map((f) => ({ field: f.field, value: f.value, month: f.month ?? null, note: f.note ?? '', quote: String(f.quote ?? '').slice(0, 160), source: String(f.source ?? '').slice(0, 80), by: f.by ?? '', status: f.status, edited: Boolean(f.edited) }));
}
function seed() {
  // read again whenever the list is empty and state holds a list this file has not seen: a saved visit restored after load
  const kept = Array.isArray(S().imported) ? S().imported : [];
  if (found.length || !kept.length || kept === seeded) return;
  seeded = kept;
  kept.forEach((k) => { if (FILL[k.field]) found.push({ ...k, id: `f${++seq}`, label: FILL[k.field].label, q: FILL[k.field].q, excluded: k.status === 'excluded' }); });
}
/** one find into the list; the same field and value twice is one find. Returns the find, or null when it cannot be used */
function add(sug) {
  seed();
  const fill = FILL[sug.field];
  if (!fill) return null;
  const value = fill.number ? (Number.isFinite(Number(sug.value)) ? Number(sug.value) : fill.read(sug.value)) : fill.read(sug.value);
  if (fill.number ? !(Number.isFinite(value) && value > 0) : !value) return null;
  const same = found.find((f) => f.field === sug.field && f.value === value);
  if (same) return same;
  const item = { id: `f${++seq}`, field: sug.field, label: fill.label, q: fill.q, value, month: sug.month ?? null, note: sug.note ?? '', quote: String(sug.quote ?? '').trim(), source: String(sug.source ?? ''), by: sug.by ?? '', status: 'found', edited: false };
  found.push(item);
  changed(item);
  return item;
}
const byId = (id) => found.find((f) => f.id === id) ?? null;
/** a find's value as the page prints it */
function shown(item) { const fill = FILL[item?.field]; try { return fill ? fill.show(item.value, item) : String(item?.value ?? ''); } catch (e) { return String(item?.value ?? ''); } }
const moved = (item) => { const key = ENGINE_OF[item.field]; if (key) M.flow?.forward?.(key); M.flow?.forward?.('research'); M.paintTree?.(); };
/** Confirm: the find becomes the answer. The later question opens with it in place, for the visitor to keep or change */
function confirm(id) {
  const item = byId(id);
  if (!item) return null;
  // one answer per field: confirming a second find for the same field stands the first one down
  found.forEach((f) => { if (f !== item && f.field === item.field && f.status === 'confirmed') f.status = 'found'; });
  FILL[item.field].apply(item.value, item);
  item.status = 'confirmed';
  item.excluded = false;
  moved(item);
  changed(item);
  return item;
}
/** Exclude: the find is never used and never shown on a later question; an answer it wrote is taken back out */
function exclude(id) {
  const item = byId(id);
  if (!item) return null;
  if (item.status === 'confirmed') { FILL[item.field].undo(item.value, item); const key = ENGINE_OF[item.field]; if (key) M.flow?.backward?.(key); M.paintTree?.(); }
  item.status = 'excluded';
  item.excluded = true;
  changed(item);
  return item;
}
function restore(id) { const item = byId(id); if (!item) return null; item.status = 'found'; item.excluded = false; changed(item); return item; }
/** an edit in the visitor's own hand: the find keeps its quote, and from here on it counts as their figure, not the website's.
    A value that cannot be read leaves the find as it was and returns null, so the row can say so and keep what was typed */
function edit(id, raw) {
  const item = byId(id);
  if (!item) return null;
  const fill = FILL[item.field];
  const value = fill.read(raw);
  if (fill.number ? !(Number.isFinite(value) && value > 0) : !value) return null;
  if (value === item.value) return item;
  const was = item.status === 'confirmed';
  if (was) fill.undo(item.value, item);
  item.value = value;
  item.edited = true;
  item.note = '';
  if (was) { fill.apply(item.value, item); moved(item); }
  changed(item);
  return item;
}
/** the find a later question shows for the visitor to confirm: one still standing as found, for that question */
function foundFor(qid) { seed(); return found.find((f) => f.q === qid && f.status === 'found') ?? null; }

/** the local parse: text in, finds into the list, nothing sent. Returns { words, added: [finds] } */
function readText(text, sourceLabel) {
  const t = String(text ?? '');
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  if (!words) return { words: 0, added: [] };
  const added = readPasted(t, sourceLabel).map((h) => add(h)).filter(Boolean);
  return { words, added };
}

/* ---------------------------------------------------------------- one local file (R20) */
/* Two libraries, fetched from cdnjs by a script tag the first time a PDF or a .docx is picked, never on load.
   A page that already holds window.pdfjsLib or window.mammoth (a test stub, or a build that bundles them) uses that. */
const CDN = {
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  docx: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
};
const scriptWaits = {};
/** insert one script tag and wait for it; the same src is inserted once, later calls share the wait */
function loadScript(src) {
  if (scriptWaits[src]) return scriptWaits[src];
  scriptWaits[src] = new Promise((resolve, reject) => {
    let done = false;
    const settle = (ok, err) => { if (done) return; done = true; clearTimeout(t); if (ok) resolve(true); else { delete scriptWaits[src]; reject(err ?? new Error('load failed')); } };
    const t = setTimeout(() => settle(false, new Error('timed out')), 25000);
    try {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.addEventListener('load', () => settle(true));
      s.addEventListener('error', () => settle(false, new Error('not loaded')));
      (document.head ?? document.documentElement).appendChild(s);
    } catch (e) { settle(false, e); }
  });
  return scriptWaits[src];
}
async function pdfLib() {
  if (M.research.loaders?.pdf) return M.research.loaders.pdf();
  if (!window.pdfjsLib) await loadScript(CDN.pdf);
  const lib = window.pdfjsLib;
  if (!lib || typeof lib.getDocument !== 'function') throw new Error('pdf.js missing');
  // the worker is fetched from the same place; where a cross-origin worker is refused, pdf.js falls back to the main thread
  if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker;
  return lib;
}
async function docxLib() {
  if (M.research.loaders?.docx) return M.research.loaders.docx();
  if (!window.mammoth) await loadScript(CDN.docx);
  const lib = window.mammoth;
  if (!lib || typeof lib.extractRawText !== 'function') throw new Error('mammoth missing');
  return lib;
}
const readAs = (file, how) => new Promise((resolve, reject) => {
  const FR = window.FileReader;
  if (typeof FR !== 'function') { reject(new Error('no FileReader')); return; }
  const fr = new FR();
  fr.onerror = () => reject(new Error('unreadable'));
  fr.onload = () => resolve(fr.result);
  try { fr[how](file); } catch (e) { reject(e); }
});
/** the words of a PDF, page by page, in this browser */
async function pdfText(buf) {
  const lib = await pdfLib();
  const doc = await lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise;
  const pages = [];
  const n = Math.min(doc.numPages ?? 0, 200);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let last = null;
    const parts = [];
    (content.items ?? []).forEach((it) => {
      if (typeof it.str !== 'string') return;
      // a new line where the text moves down the page; a space between runs on the same line
      const y = Array.isArray(it.transform) ? Math.round(it.transform[5]) : null;
      if (last !== null && y !== null && Math.abs(y - last) > 2) parts.push('\n'); else if (parts.length && it.str) parts.push(' ');
      parts.push(it.str);
      if (y !== null) last = y;
      if (it.hasEOL) parts.push('\n');
    });
    pages.push(parts.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n'));
  }
  try { doc.destroy?.(); } catch (e) { /* done */ }
  return pages.join('\n\n');
}
const wordCount = (t) => (String(t ?? '').trim().match(/\S+/g) ?? []).length;
const NO_TEXT = 'No text found in this file. If it is a scanned document, paste the text instead.';
/** one local file into the found-list (opts.list false: the text only, no finds; a CV on the starter route). Never throws;
    nothing leaves the browser. -> { ok, kind: 'txt'|'md'|'csv'|'pdf'|'docx'|'', name, words, added: [finds], text, error } */
async function readFile(file, opts = {}) {
  const name = String(file?.name ?? '');
  const out = { ok: false, kind: '', name, words: 0, added: [], text: '', error: '' };
  if (!file) { out.error = 'No file was chosen.'; return out; }
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? '').toLowerCase();
  const type = String(file.type ?? '').toLowerCase();
  const kind = ['txt', 'md', 'csv', 'pdf', 'docx'].includes(ext) ? ext : /pdf/.test(type) ? 'pdf' : /wordprocessingml/.test(type) ? 'docx' : /^text\//.test(type) ? 'txt' : '';
  out.kind = kind;
  if (!kind) { out.error = ext === 'doc' ? 'An older .doc file is not read: save it as .docx or paste the text.' : 'Only .txt, .md, .csv, .pdf and .docx files are read. Paste the text instead.'; return out; }
  const size = Number(file.size);
  if (Number.isFinite(size) && size > M.research.FILE_LIMIT) { out.error = `That file is over ${Math.round(M.research.FILE_LIMIT / 1048576)} MB. Paste the part that matters.`; return out; }
  let text = '';
  try {
    if (kind === 'pdf') {
      const buf = await readAs(file, 'readAsArrayBuffer');
      try { text = await pdfText(buf); } catch (e) { out.error = 'The PDF reader could not be loaded or could not open this file. Paste the text instead.'; return out; }
    } else if (kind === 'docx') {
      const buf = await readAs(file, 'readAsArrayBuffer');
      let lib;
      try { lib = await docxLib(); } catch (e) { out.error = 'The Word reader could not be loaded. Paste the text instead.'; return out; }
      try { const r = await lib.extractRawText({ arrayBuffer: buf }); text = String(r?.value ?? ''); } catch (e) { out.error = 'That file could not be opened as a Word document. Paste the text instead.'; return out; }
    } else {
      const raw = await readAs(file, 'readAsText');
      text = typeof raw === 'string' ? raw : '';
      if (text.slice(0, 4000).includes(' ')) { out.error = 'That file is not plain text. Choose a .txt, .md, .csv, .pdf or .docx file, or paste the text.'; return out; }
    }
  } catch (e) {
    out.error = 'That file could not be read. Paste the text instead.';
    return out;
  }
  out.words = wordCount(text);
  if (out.words < 3) { out.error = NO_TEXT; return out; }
  out.text = text.slice(0, 200000);
  if (opts.list !== false) { const r = readText(out.text, name || 'your file'); out.added = r.added; }
  out.ok = true;
  return out;
}

/** a suggestion from the reader joins the same list, with the quote and the page it came from */
function offer(sug) { return add(sug); }

/** send the address to TMA's reader. Called by the Read my site press and by nothing else on this page: never on typing */
async function run(address) {
  const url = (addrOf(address) || addrOf(boxEl?.value) || S().site || '').trim();
  const base = endpoint();
  if (!base) {
    status = 'off';
    line(esc(URL_WORDS), 'is-note');
    return;
  }
  if (!url) { status = 'off'; return; }
  if (live) live.abort();
  const mine = new AbortController();
  live = mine;
  // a new read replaces the reader's earlier finds that nobody has touched; pasted and confirmed finds stay
  for (let i = found.length - 1; i >= 0; i--) { if (found[i].by !== 'text read in this browser' && found[i].status === 'found' && !found[i].edited) found.splice(i, 1); }
  facts.length = 0;
  clearHost();
  changed(null);
  status = 'reading';
  line(`Sent <b>${esc(url)}</b> to TMA’s reader. What it finds appears here.`, 'is-queued');
  try {
    // the one moment anything leaves this browser before an export: the flag is set first so no export can miss it
    M.research.sent = true;
    const res = await fetch(`${base}/fetch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token() ? { authorization: `Bearer ${token()}` } : {}) },
      body: JSON.stringify({ url: /^https?:\/\//.test(url) ? url : `https://${url}`, suggest: BRAIN }),
      signal: mine.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Archive error ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const rows = buf.split('\n');
      buf = rows.pop() ?? '';
      rows.filter(Boolean).forEach((row) => {
        let e;
        try { e = JSON.parse(row); } catch (err) { return; }
        if (e.found) { status = 'asking'; offer({ field: e.found.field, value: e.line, quote: e.found.quote, source: e.found.source, by: e.found.by }); return; }
        if (e.done) {
          // the name on the site is offered like any other find: it becomes the business name on a press, never before
          if (e.companyName && !S().biz && !found.some((f) => f.field === 'biz')) offer({ field: 'biz', value: String(e.companyName).slice(0, 80), quote: '', source: url, by: 'your own page' });
          line(`Read ${facts.length ? `${facts.length} thing${facts.length === 1 ? '' : 's'} from ` : ''}your site${e.companyName ? ` · ${esc(e.companyName)}` : ''}${e.thin ? ' · little text' : ''}`, 'is-done');
          status = e.asking ? 'asking' : 'done';
          return;
        }
        if (e.asked) { status = 'done'; line(`Mercer kept ${e.kept} find${e.kept === 1 ? '' : 's'}, each with a quote from its source. They are listed below to edit, exclude or confirm.`, 'is-done'); return; }
        if (e.queued && typeof e.id === 'string') { status = 'done'; holdPlace({ id: e.id, position: e.position, etaSeconds: e.etaSeconds, base, url }); return; }
        if (e.line) {
          if (e.fact) facts.push(e.fact);
          if (e.facts) e.facts.forEach((f) => facts.push(f));
          line(esc(e.line), e.error ? 'is-err' : '');
        }
      });
    }
    if (status !== 'done') status = 'done';
  } catch (err) {
    if (mine.signal.aborted) return;
    status = 'failed';
    line(`The reader could not read <b>${esc(url)}</b> (${esc(String(err.message || err))}). Nothing was lost: paste the text below, or carry on.`, 'is-err');
  } finally {
    if (live === mine) live = null;
  }
}

/* ---------------------------------------------------------------- a place in the line */
/* When the model is busy the archive queues the read and says where it stands
   (services/archive/queue.ts). The visitor is told in plain words, carries on
   with the questions, and the suggestions appear here when their turn comes.
   The place is kept in this browser, so a reload picks it back up. */
const KEY = 'mercer-queued';
let polling = 0;
const about = (secs) => (secs < 60 ? 'in under a minute' : secs < 90 ? 'in about a minute' : secs < 3600 ? `in about ${Math.round(secs / 60)} minutes` : `in about ${Math.round(secs / 3600)} hour${Math.round(secs / 3600) === 1 ? '' : 's'}`);
const nth = (n) => `${n}${[, 'st', 'nd', 'rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th'}`;
function sayWaiting(position, etaSeconds) {
  line(`The reader is busy. Your web search is ${nth(position)} in the queue and should run ${about(etaSeconds)}. Carry on with the questions: what it finds is listed on this step when it finishes.`, 'is-queued');
}
function holdPlace(job) {
  // a place in the queue exists only because the visitor pressed Read my site, in this visit or the one before a reload
  M.research.sent = true;
  try { localStorage.setItem(KEY, JSON.stringify({ ...job, at: Date.now() })); } catch (e) {}
  sayWaiting(job.position ?? 1, job.etaSeconds ?? 60);
  clearTimeout(polling);
  const collect = async (delay) => {
    polling = setTimeout(async () => {
      let st = null;
      try {
        const res = await fetch(`${job.base}/fetch/${encodeURIComponent(job.id)}`, { headers: token() ? { authorization: `Bearer ${token()}` } : {} });
        st = res.status === 404 ? { status: 'gone' } : res.ok ? await res.json() : null;
      } catch (e) { st = null; }
      if (st === null) { collect(Math.min(delay * 2, 120_000)); return; }
      if (st.status === 'queued') { sayWaiting(st.position, st.etaSeconds); collect(Math.min(Math.max(15_000, st.etaSeconds * 250), 60_000)); return; }
      if (st.status === 'running') { line('Running your web search. What it finds will be listed here.', 'is-queued'); collect(5_000); return; }
      try { localStorage.removeItem(KEY); } catch (e) {}
      if (st.status === 'done') {
        const list = Array.isArray(st.suggestions) ? st.suggestions : [];
        line(list.length ? `Your web search finished: ${list.length} find${list.length === 1 ? '' : 's'} listed below. Confirm any that are right.` : 'Your web search found nothing Mercer could quote. Mercer will ask you instead.', 'is-done');
        list.forEach((sg) => offer({ field: sg.field, value: sg.value, quote: sg.quote, source: sg.source, by: sg.by }));
        return;
      }
      line(st.status === 'failed' ? `Mercer could not run your web search: ${esc(st.reason ?? 'the reader could not finish it')}. It will ask you instead.` : 'Your web search left the queue before it ran. Mercer will ask you instead.', 'is-hint');
    }, delay);
  };
  collect(Math.min(Math.max(10_000, (job.etaSeconds ?? 60) * 1000), 60_000));
}
/** a place kept from before a reload, picked back up if it is under a day and a half old */
function resume() {
  let job = null;
  try { job = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch (e) { job = null; }
  if (!job || typeof job.id !== 'string' || Date.now() - (job.at ?? 0) > 30 * 3_600_000) return;
  if (!endpoint() || job.base !== endpoint()) return;
  holdPlace(job);
}

/* ---------------------------------------------------------------- the press */
/* Typing never sends anything. Where a reader exists, an address in the box brings up one stone and one line that says
   where the address goes; the fetch waits for the press. keep: leave what is already under the box (a pasted page's finds). */
function ask(addr, { keep = false } = {}) {
  if (!host || !addr) return;
  if (!keep) clearHost();
  host.querySelector('.site-ask')?.remove();
  const row = document.createElement('div');
  row.className = 'site-ask';
  const p = document.createElement('p');
  p.className = 'small';
  p.innerHTML = `Read my site sends <b>${esc(addr)}</b> to TMA’s reader, which reads your pages and asks a third-party search model. Nothing is sent until you press.`;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'stone site-read';
  b.textContent = 'Read my site';
  b.addEventListener('click', () => {
    b.disabled = true;
    try { M.feel?.play?.('tap', { x: M.feel?.panOf?.(b) }); } catch (e) {}
    run(addr);
  });
  row.append(p, b);
  host.appendChild(row);
  status = 'idle';
}

/* One box. An address on its own is kept as the address and, where a server can read
   sites, the Read my site stone is offered. A whole page pasted in is read here, in the
   browser, and the address is taken out of it. questions.js commits state.site from the same box. */
function mount(box, foundHost) {
  if (!box) return;
  boxEl = box;
  host = foundHost ?? null;
  let timer = 0, lastRead = '', pasted = false;
  const grow = () => { box.style.height = 'auto'; box.style.height = `${Math.min(box.scrollHeight, 132)}px`; };
  const read = () => {
    const v = box.value.trim();
    const isPage = /\n/.test(v) || v.split(/\s+/).length >= 12;
    if (!v) { if (live) { live.abort(); live = null; } clearHost(); lastRead = ''; return; }
    if (v === lastRead) return;
    lastRead = v;
    if (isPage) {
      if (live) { live.abort(); live = null; }
      clearHost();
      const addr = addrOf(v);
      const { words, added } = readText(v, addr || 'the text you pasted');
      line(added.length
        ? `Read ${words} words in this browser${addr ? ` from <b>${esc(addr)}</b>` : ''}. What Mercer found is listed below.`
        : 'Read ' + words + ' words in this browser. Mercer found nothing to quote, so it will ask you instead.', 'is-read');
      // the pasted text went nowhere. Where a reader exists it can still be asked to read the site itself, on a press
      if (addr && endpoint()) ask(addr, { keep: true });
      // a pasted page settles back to its address once it has been read; the chips keep what was found
      if (pasted) {
        pasted = false;
        box.value = addr || '';
        box.dataset.page = v.slice(0, 20000);
        lastRead = box.value.trim();
        box.dispatchEvent(new Event('input', { bubbles: true }));
        grow();
      }
      return;
    }
    pasted = false;
    // an address on its own: nothing is sent while it is typed. With a reader, the stone that sends it appears; without one, the hint
    const addr = addrOf(v);
    // a read of the address as it was is stopped: what it would bring back belongs to another site
    if (live) { live.abort(); live = null; }
    if (addr && endpoint()) { ask(addr); return; }
    host?.querySelector('.site-ask')?.remove();
    // the one sentence about the address, at the moment it is typed (R15)
    if (addr) line(esc(URL_WORDS), 'is-hint'); else clearHost();
  };
  box.addEventListener('input', () => { grow(); clearTimeout(timer); timer = setTimeout(read, 450); });
  box.addEventListener('paste', () => { clearTimeout(timer); pasted = true; setTimeout(() => { grow(); read(); }, 30); });
  status = endpoint() ? 'idle' : 'off';
  // back on this question with an address already given: the stone is there to press, and still nothing has been sent
  { const had = addrOf(box.value); if (had && endpoint() && !live) { lastRead = box.value.trim(); ask(had, { keep: true }); } }
  grow();
  resume();
}
})();
