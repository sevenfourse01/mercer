/* Mercer: Send to TMA. A Cloudflare Worker (or any fetch-shaped runtime) that takes the reviewed brief the page posts and
   emails it to the team through Resend. Nothing is stored. The page sends only what the visitor ticked.

   Deploy: `wrangler deploy` with these variables set as secrets or vars:
     RESEND_API_KEY   the Resend key (a secret)
     TO_EMAIL         the verified team address the briefs go to, e.g. plans@themissionautomation.com
     FROM_EMAIL       a sender on a domain verified with Resend, e.g. Mercer <mercer@themissionautomation.com>
     ALLOWED_ORIGIN   the site, e.g. https://themissionautomation.com (CORS; the page is served there)
   Then in the site's index.html before the modules: <script>window.MERCER_CONFIG = { sendEndpoint: 'https://<worker>/send', shareEmail: 'plans@…' };</script>

   Request: POST /send, JSON { business, revision, name, contact, included: [ids], brief: markdown }. 200 KB at most.
   Response: 200 { ok: true, id } when Resend accepted the message; 4xx/5xx { ok: false, error } otherwise. The page
   reports only what this answers: accepted by the service is not delivered to an inbox, and the page says so. */
const LIMIT = 200 * 1024;
const cors = (env, extra = {}) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  ...extra,
});
const json = (env, status, body) => new Response(JSON.stringify(body), { status, headers: cors(env) });
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max);
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/send') return json(env, 404, { ok: false, error: 'not found' });
    if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) return json(env, 503, { ok: false, error: 'sending is not configured' });
    const origin = request.headers.get('Origin') || '';
    if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return json(env, 403, { ok: false, error: 'origin not allowed' });
    const raw = await request.text();
    if (raw.length > LIMIT) return json(env, 413, { ok: false, error: 'the brief is too large' });
    let body = null;
    try { body = JSON.parse(raw); } catch (e) { return json(env, 400, { ok: false, error: 'not JSON' }); }
    const brief = clean(body.brief, LIMIT);
    if (!brief.trim()) return json(env, 400, { ok: false, error: 'the brief is empty' });
    const business = clean(body.business, 120) || 'a Mercer visitor';
    const name = clean(body.name, 120), contact = clean(body.contact, 200);
    const included = Array.isArray(body.included) ? body.included.map((x) => clean(x, 40)).filter(Boolean).slice(0, 40) : [];
    const subject = `Mercer brief: ${business}${body.revision ? ` (revision ${clean(body.revision, 12)})` : ''}`;
    const text = [`A Mercer brief was sent from the site.`, ``, `Business: ${business}`, `Name: ${name || 'not given'}`, `How to reach them: ${contact || 'not given'}`, `Sections included: ${included.join(', ') || 'the default set'}`, ``, `The brief is attached as markdown.`].join('\n');
    const attachment = { filename: `mercer-brief-${business.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan'}.md`, content: btoa(unescape(encodeURIComponent(brief))) };
    let res = null;
    try {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.FROM_EMAIL, to: [env.TO_EMAIL], reply_to: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact) ? contact : undefined, subject, text, attachments: [attachment] }),
      });
    } catch (e) { return json(env, 502, { ok: false, error: 'the mail service could not be reached' }); }
    if (!res.ok) return json(env, 502, { ok: false, error: `the mail service refused the message (${res.status})` });
    let out = null;
    try { out = await res.json(); } catch (e) { out = null; }
    return json(env, 200, { ok: true, id: out?.id ?? null });
  },
};
