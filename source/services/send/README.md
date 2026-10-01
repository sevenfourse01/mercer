# Send to TMA: the sending service

The site is static, so "Send to TMA" needs one small service to email the reviewed brief. `worker.js` is that service
for Cloudflare Workers, sending through Resend. Nothing is stored; the page posts only the sections the visitor ticked.

## Deploy (once, by whoever holds the keys)

1. `npm i -g wrangler`, then in this folder: `wrangler init --from-dash` is not needed; a `wrangler.toml` with `name = "mercer-send"` and `main = "worker.js"` is enough.
2. Set the variables: `wrangler secret put RESEND_API_KEY`; vars `TO_EMAIL` (the verified team address), `FROM_EMAIL` (a sender on a domain verified with Resend), `ALLOWED_ORIGIN` (`https://themissionautomation.com`).
3. `wrangler deploy` and note the URL, e.g. `https://mercer-send.<account>.workers.dev/send`.
4. In the site's `index.html`, set before the modules: `<script>window.MERCER_CONFIG = { sendEndpoint: 'https://mercer-send.<account>.workers.dev/send', shareEmail: 'plans@themissionautomation.com' };</script>`.

Until step 4 is done the page keeps its honest fallback: the brief downloads as a PDF and the panel says no sending
service is set up.

## What the page sends

`POST /send` with JSON `{ business, revision, name, contact, included, brief }`. The worker answers `{ ok: true, id }`
when Resend accepted the message, or `{ ok: false, error }`. "Accepted by the service" is what the page reports; it never
claims inbox delivery.
