/* Where you trade.

   For a business with a door people walk through, the report ends on a map: where it
   is, how far it says it draws from, and who lives inside that line. Everything on it
   is local data, GeoNames places and a Natural Earth coastline, embedded in places.js
  , so it works in the sandbox with no network and no key.

   Every figure is a sum of published populations. Nothing is estimated from the
   answers: the answers only decide where the pin goes and how wide the rings are.

   God's Eye View (github.com/bilawalsidhu/gods-eye-view, MIT) is the 3D version of the
   same look. It has no public hosted copy, it runs on your own machine or server, so
   the button to open it appears only when this page is told where one is running
   (?gev=https://…, or http://localhost:4173 for a copy on this computer). Its share
   links put the camera where the hash says: #lat=…&lon=…&alt=…&pitch=…&map=photoreal. */
(() => {
'use strict';
const M = window.Mercer;
const { $, $$, esc, count, state } = M;

const MILE = 1.609344;
/** the catchment the answer describes, in miles. Worldwide has none: that answer never draws a ring (fix 3, C4) */
const RADIUS = { local: 5, county: 30, national: 120 };
const radiusMiles = () => (state.radius === 'global' ? null : RADIUS[state.radius] ?? 10);
/** the miles have one owner: the leaf insight in app.js reads them here (fix 3, C36) */
M.radiusMiles = radiusMiles;

/* rebuild 1 (brief 15, R22): delivery mode is asked before the radius (E27 before E28), and the map is gated on it. A
   remote or shipped business gets no catchment chapter however it answered the place; a business people visit, or one
   that travels to them, gets the ring map; mixed follows the radius. The gazetteer and the populations are UK data, so
   the map is also gated on M.ukBenchmarks() when app.js provides it (else on a GBP currency): outside that there is no
   map and no catchment figure, and the plan still works on the visitor's own figures */
const modeOf = () => { const v = state.deliveryMode; return String(Array.isArray(v) ? v.join(' ') : v ?? '').toLowerCase(); };
/** true when the delivery mode calls for a catchment at all: null when the mode is not answered yet (the radius decides) */
M.catchmentApplies = () => {
  const mode = modeOf();
  if (!mode) return null;
  const remote = /online|remote|shipped|post|deliver/.test(mode);
  const inPerson = /visit|travel|premises|site|home/.test(mode);
  if (/mixed/.test(mode) || (remote && inPerson)) return null; // a mix: the radius decides
  if (remote) return false;
  if (inPerson) return true;
  return null;
};
/** the UK data applies: app.js's M.ukBenchmarks() when it exists, else a GBP currency (the default) */
M.mapDataApplies = () => {
  try { if (typeof M.ukBenchmarks === 'function') return !!M.ukBenchmarks(); } catch (e) { /* the currency below */ }
  return (state.currency ?? 'GBP') === 'GBP';
};
/** a physical business: a branch that trades from a place, or an answer that says so. Worldwide always goes to the
    world map, whatever the sector's default (fix 3, C4: "Worldwide replaces it with the world"). Rebuild 1: a remote or
    shipped delivery mode is never physical, and a visited or travelling one is, whatever the sector's default */
M.isPhysical = () => {
  const c = M.catchmentApplies();
  if (c === false) return false;
  if (state.radius === 'global') return false;
  if (c === true) return true;
  return M.SECTOR_BY?.[state.sector]?.place === 'local' || ['local', 'county'].includes(state.radius);
};
/** why there is no map, in one line for the report's text equivalent; '' when a map is drawn */
M.mapSkipReason = () => {
  if (!M.mapDataApplies()) return 'Mercer’s place data covers the UK, so no map or catchment figure is drawn here.';
  if (M.catchmentApplies() === false) return 'You deliver remotely or by post, so there is no local catchment to draw.';
  if (state.radius === 'global') return '';
  if (!M.isPhysical()) return 'Your customers are not drawn from one area, so Mercer draws no catchment.';
  return '';
};

const toRad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
/** everyone the gazetteer counts inside the line: the populations of the places within `miles` of `at`, plus the place
    itself. The map's own stat and the Range leaf both read this, so the two can never disagree (fix 3, C36) */
M.peopleWithin = (at, miles) => {
  if (!at || !(Number(miles) > 0)) return 0;
  const R = Number(miles) * MILE;
  return M.places().reduce((a, pl) => (km(at, pl) <= R && !(pl.lat === at.lat && pl.lon === at.lon) ? a + (pl.pop || 0) : a), 0) + (at.pop || 0);
};

/* ---------------------------------------------------------------- finding the place */
/** the place they named, if the gazetteer knows it: each part of what they typed is
    tried as a whole name, and where two places share one, the larger wins */
function locate() {
  if (state.placeAt) return state.placeAt;
  // they said the match was wrong earlier: no guess
  if (state.placeManual) return null;
  const text = String(state.place ?? '').trim();
  if (!text) return null;
  const places = M.places();
  const parts = text.split(/,|\band\b|&|\bnear\b|\bround\b|\baround\b|\bin\b|\bthe\b/i).map((p) => p.trim().toLowerCase()).filter((p) => p.length > 1);
  let best = null;
  parts.forEach((p) => {
    places.forEach((pl) => {
      if (pl.name.toLowerCase() !== p) return;
      if (!best || pl.pop > best.pop) best = pl;
    });
  });
  return best;
}
M.locate = locate;

/* ---------------------------------------------------------------- the God's Eye View link */
/** a destination is only ever an https origin, and a link in the query only counts on a local dev page: a poisoned
    link must not be able to rewire this browser, or put a javascript: URL into an href (review, finding 2) */
const httpsOrigin = (v) => { try { const u = new URL(String(v ?? '')); return u.protocol === 'https:' ? `${u.origin}${u.pathname}`.replace(/\/$/, '') : ''; } catch (e) { return ''; } };
const devPage = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
function gevHost() {
  const q = devPage() ? new URLSearchParams(location.search).get('gev') : null;
  const fromQuery = httpsOrigin(q);
  if (fromQuery) { try { localStorage.setItem('mercer-gev', fromQuery); } catch (e) {} return fromQuery; }
  let stored = '';
  try { stored = localStorage.getItem('mercer-gev') || ''; } catch (e) { stored = ''; }
  const ok = httpsOrigin(stored) || httpsOrigin(window.MERCER_GEV);
  if (stored && !httpsOrigin(stored)) { try { localStorage.removeItem('mercer-gev'); } catch (e) { /* nothing to clear */ } }
  return ok;
}
M.gevHost = gevHost;
/** a share link in God's Eye View's own format: the camera over the business, looking down at 45° */
M.gevLink = (at, miles) => {
  const host = gevHost();
  if (!host || !httpsOrigin(host) || !at) return null;
  const alt = Math.round(Math.max(600, Math.min(60000, miles * MILE * 1000 * 0.9)));
  return `${host}/#lat=${at.lat.toFixed(5)}&lon=${at.lon.toFixed(5)}&alt=${alt}&heading=0&pitch=-45&style=normal&map=photoreal`;
};

/* ---------------------------------------------------------------- drawing */
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
  if (parent) parent.appendChild(n);
  return n;
}

/** the width a map is drawn for: its host's own when the host is laid out. A host inside a closed ▾ has no width (the Reach
    card keeps its map there, fix 2 item 11); then the window decides, so a phone never gets the landscape form */
const widthFor = (node) => { const w = node?.clientWidth ?? 0; return w > 0 ? w : (window.innerWidth <= 720 ? 360 : 640); };

/** the trade-area map: rings, the places inside them, the coast if it is in view, and an inset of the whole island */
function draw(svg, at, miles) {
  svg.innerHTML = '';
  // on a phone the same map is drawn in portrait, so the type stays readable
  const narrow = widthFor(svg.parentElement) < 520;
  const W = narrow ? 360 : 640, H = narrow ? 380 : 400, cx = narrow ? 180 : 250, cy = narrow ? 196 : 200, R0 = narrow ? 158 : 168, MW = narrow ? W : 500;
  svg.dataset.narrow = String(narrow);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const Rkm = miles * MILE;
  const pxPerDegLat = R0 / (Rkm / 111.32);
  const kx = Math.cos(toRad(at.lat));
  const P = (lat, lon) => [cx + (lon - at.lon) * kx * pxPerDegLat, cy - (lat - at.lat) * pxPerDegLat];

  const defs = el('defs', {}, svg);
  const clip = el('clipPath', { id: 'map-clip' }, defs);
  el('rect', { x: 0, y: 0, width: MW, height: H, rx: 6 }, clip);

  const g = el('g', { 'clip-path': 'url(#map-clip)' }, svg);
  el('rect', { x: 0, y: 0, width: MW, height: H, class: 'map-sea' }, g);

  // the coast, where there is any in view
  M.coast().forEach((ring) => {
    const d = ring.map(([lon, lat], i) => { const [x, y] = P(lat, lon); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('') + 'Z';
    el('path', { d, class: 'map-land' }, g);
  });

  // the rings: a third, two thirds and all of the distance they said they draw from
  [1 / 3, 2 / 3, 1].forEach((f, i) => {
    el('circle', { cx, cy, r: R0 * f, class: `map-ring${i === 2 ? ' outer' : ''}` }, g);
    const lbl = el('text', { x: cx + R0 * f * Math.cos(toRad(-38)) + 4, y: cy + R0 * f * Math.sin(toRad(-38)) - 4, class: 'map-ring-label' }, g);
    lbl.textContent = `${Math.round(miles * f * 10) / 10} mi`;
  });

  // the places inside the outer ring, largest drawn last so they sit on top
  const inside = M.places()
    .map((pl) => ({ ...pl, d: km(at, pl) }))
    .filter((pl) => pl.d <= Rkm && !(pl.lat === at.lat && pl.lon === at.lon))
    .sort((a, b) => a.pop - b.pop);
  inside.forEach((pl) => {
    const [x, y] = P(pl.lat, pl.lon);
    el('circle', { cx: x, cy: y, r: Math.max(1.6, Math.min(8, Math.sqrt(pl.pop) / 60)), class: 'map-place' }, g);
  });
  // labels for the biggest, where there is room for them, and never on the business's own name
  const pinName = state.biz || at.name;
  const pinW = pinName.length * 7.4;
  const placed = [{ x: cx - pinW / 2 - 3, y: cy - 28, w: pinW + 6, h: 15 }, { x: cx - 17, y: cy - 12, w: 34, h: 29 }];
  [...inside].sort((a, b) => b.pop - a.pop).slice(0, 24).forEach((pl) => {
    if (placed.length >= (narrow ? 8 : 11)) return;
    const [x, y] = P(pl.lat, pl.lon);
    if (Math.hypot(x - cx, y - cy) < 26) return;
    const w = pl.name.length * 6.4;
    // right of the dot first, then above, below and left: the first spot that is clear wins
    const spots = [
      { x: x + 7, y: y - 7, tx: x + 7, ty: y + 3.5, anchor: 'start' },
      { x: x - w / 2, y: y - 23, tx: x, ty: y - 13, anchor: 'middle' },
      { x: x - w / 2, y: y + 7, tx: x, ty: y + 17, anchor: 'middle' },
      { x: x - w - 7, y: y - 7, tx: x - 7, ty: y + 3.5, anchor: 'end' },
    ];
    const hit = spots.find((sp) => {
      const box = { x: sp.x, y: sp.y, w, h: 12 };
      if (box.x < 4 || box.x + w > MW - 6 || box.y < 4 || box.y > H - 16) return false;
      return !placed.some((b) => box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h);
    });
    if (!hit) return;
    placed.push({ x: hit.x, y: hit.y, w, h: 12 });
    const t = el('text', { x: hit.tx, y: hit.ty, 'text-anchor': hit.anchor, class: 'map-place-label' }, g);
    t.textContent = pl.name;
  });

  // the business itself
  el('circle', { cx, cy, r: 6.5, class: 'map-pin' }, g);
  const name = el('text', { x: cx, y: cy - 16, class: 'map-pin-label', 'text-anchor': 'middle' }, g);
  name.textContent = state.biz || at.name;

  // the inset: the whole of Britain and Ireland, and where this window sits in it, not on a phone
  if (narrow) return inside;
  const ix = 512, iy = 16, iw = 112, ih = 150;
  const I = (lat, lon) => [ix + ((lon + 10.8) / 13.0) * iw, iy + ((61.0 - lat) / 11.2) * ih];
  el('rect', { x: ix - 6, y: iy - 6, width: iw + 12, height: ih + 12, rx: 6, class: 'map-inset-bg' }, svg);
  M.coast().forEach((ring) => {
    const d = ring.map(([lon, lat], i) => { const [x, y] = I(lat, lon); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('') + 'Z';
    el('path', { d, class: 'map-inset-land' }, svg);
  });
  const [px, py] = I(at.lat, at.lon);
  const span = Math.max(3, (Rkm / 111.32 / 11.2) * ih);
  el('rect', { x: px - span, y: py - span, width: span * 2, height: span * 2, class: 'map-inset-box' }, svg);
  el('circle', { cx: px, cy: py, r: 2.4, class: 'map-pin' }, svg);

  return inside;
}

/* a figure of the visitor's is printed only when they gave one: Not sure, an empty field and 0 print nothing */
const gave = (id, v) => Number(v) > 0 && !(() => { try { return !!state.notSure?.has?.(id); } catch (e) { return false; } })();

/* ---------------------------------------------------------------- the section */
function paint(host) {
  if (!host) return;
  const ch = host.closest('.c-ch, .chapter');
  /* no UK data, or a remote delivery mode: the chapter is hidden and the host holds the one-line text equivalent */
  const skip = M.mapSkipReason();
  if (skip) { host.innerHTML = `<p class="c-line map-skip">${esc(skip)}</p>`; ch?.setAttribute('hidden', ''); return; }
  if (!M.isPhysical()) { host.innerHTML = ''; ch?.setAttribute('hidden', ''); return; }
  ch?.removeAttribute('hidden');
  const at = locate();
  const miles = radiusMiles();
  // the results page takes no input: a place Mercer cannot find is said plainly, with no picker
  if (!at) {
    const typed = String(state.place ?? '').trim();
    host.innerHTML = `<p class="c-line">${typed ? `Mercer found no UK place called “${esc(typed)}”, so it draws no map.` : 'You did not say where you trade, so Mercer draws no map.'}</p>`;
    return;
  }
  const link = M.gevLink(at, miles);
  host.innerHTML = `
    <div class="map-wrap"><svg class="trade-map" id="trade-map" role="img" aria-label="Map of ${esc(at.name)} and the places within ${miles} miles"></svg></div>
    <div class="map-stats" id="map-stats"></div>
    <div class="map-foot">
      ${link ? `<a class="primary small" href="${esc(link)}" target="_blank" rel="noopener noreferrer" title="Open this area in God's Eye View">Open in 3D</a>` : ''}
      <span class="map-credit">${esc(M.PLACES_CREDIT)}</span>
    </div>`;
  const inside = draw($('#trade-map', host), at, miles);
  const people = M.peopleWithin(at, miles);
  const towns = inside.filter((p) => p.pop >= 1000).length;
  const big = M.places().filter((p) => p.pop >= 50000 && km(at, p) > 0.5).map((p) => ({ ...p, d: km(at, p) })).sort((a, b) => a.d - b.d)[0];
  const stats = [
    [`${count(people)}`, `people live within ${miles} miles (GeoNames populations)`],
    [`${count(towns)}`, 'towns and villages over 1,000 people inside the line'],
    big ? [`${Math.round(big.d / MILE)} mi`, `to ${esc(big.name)}, the nearest place over 50,000 people`] : null,
    gave('market', state.market) ? [count(state.market), `prospects, your figure: ${(state.market / Math.max(1, people) * 100).toFixed(1)}% of the people inside the line`] : null,
  ].filter(Boolean);
  $('#map-stats', host).innerHTML = stats.map(([n, t]) => `<div class="map-stat"><b>${n}</b><span>${t}</span></div>`).join('') + `<p class="map-meta">${esc(M.mapMeta().line)}</p>`;
}
/** brief 15: the data behind the map, said once under it and available to the report: date, coverage and method. The
    population inside the line is a sum of published place populations, so it is approximate; population, suitable
    buyers, reachable buyers and expected customers are kept separate (the map prints population and the visitor's own
    prospect figure only) */
M.mapMeta = () => ({
  source: M.PLACES_CREDIT, dataDate: 'GeoNames export read September 2026', coverage: 'UK places with a published population; a place the gazetteer does not hold is not counted',
  method: 'the populations of the places inside the line, added up, plus the place itself: an approximation, not a census count',
  line: 'Populations: GeoNames places, summed inside the line; approximate. Population is not demand: your prospect figure is the only buyer count shown.',
});
let lastHost = null;
M.paintMap = (host) => { lastHost = host ?? null; paint(host ?? $('#map-body')); };

/* ---------------------------------------------------------------- the world (v12, request 55; fix 3, C14)
   For a business that sells anywhere: the land outline from data/land110.js (Natural Earth 1:110m,
   public domain, loaded as a script so nothing is fetched). The projection is equirectangular and
   never spins (SPEC decision 12); what moves is the window on it, the SVG viewBox. A press flies the
   window between the whole world and one about 60 degrees wide; a drag pans it once it is moved in;
   a pinch, or Ctrl or Cmd with the wheel, zooms about the pointer; a plain wheel and an up-and-down
   swipe still scroll the page (map.css: touch-action pan-y). One lit point at the place the visitor
   named when the gazetteer knows it; otherwise no point. The figures beside it are the visitor's own
   prospects and contacts, nothing summed from the map. */
const LAND_CREDIT = 'Land: Natural Earth 1:110m, public domain';
const K_MAX = 8;   // the closest window: 45 degrees wide
const K_NEAR = 6;  // where a press lands: 360 / 6 = 60 degrees wide
const clampTo = (x, a, b) => Math.max(a, Math.min(b, x));
const stillNow = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return !!M.reduce; } };
let world = null; // the live world map: { host, svg, narrow, ctl }

/** the movable window on one world svg. Every listener sits on the svg itself, so a repaint drops them with it */
function worldWindow(svg, W, H, at, pin, label, narrow, keep) {
  const view = { cx: W / 2, cy: H / 2, k: 1 };
  const home = at ? { x: ((at.lon + 180) / 360) * W, y: ((90 - at.lat) / 180) * H } : null;
  const R0 = narrow ? 3 : 4, GAP = narrow ? 6 : 8, TYPE = 12;
  let raf = 0;

  const fit = (v) => {
    const k = clampTo(v.k, 1, K_MAX);
    const hw = W / (2 * k), hh = H / (2 * k);
    return { k, cx: clampTo(v.cx, hw, W - hw), cy: clampTo(v.cy, hh, H - hh) };
  };
  /* the window goes to the viewBox. The pin and its name are sized in screen pixels: one pixel is `u` world units at this
     zoom and this drawn width, so both stay one size however far in the window is and however wide the card draws the
     map. A map with no width yet (inside a closed ▾) is sized as if drawn at W pixels, and again once it has a width */
  const apply = () => {
    const w = W / view.k, h = H / view.k;
    svg.setAttribute('viewBox', `${(view.cx - w / 2).toFixed(3)} ${(view.cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
    const drawn = svg.getBoundingClientRect().width;
    const u = drawn > 0 ? w / drawn : 1 / view.k;
    if (pin && home) pin.setAttribute('r', (R0 * u).toFixed(3));
    if (label && home) {
      const left = home.x > W * 0.8; // a place near the right edge is named on its left
      label.setAttribute('x', (home.x + (left ? -GAP : GAP) * u).toFixed(3));
      label.setAttribute('y', (home.y + 4 * u).toFixed(3));
      label.setAttribute('text-anchor', left ? 'end' : 'start');
      label.style.fontSize = `${(TYPE * u).toFixed(3)}px`;
    }
  };
  const whole = () => view.k <= 1.02;
  /* said once the window rests: which view is showing, and the keys that move it */
  const settle = () => {
    svg.dataset.view = whole() ? 'world' : 'near';
    const name = at ? at.name : null;
    const seen = !!home && Math.abs(home.x - view.cx) <= W / (2 * view.k) && Math.abs(home.y - view.cy) <= H / (2 * view.k);
    const showing = whole()
      ? `The whole world${name ? `, with ${name} marked` : ''}. Press Enter to move in${name ? ` on ${name}` : ''}.`
      : `A window about ${Math.round(360 / view.k)} degrees wide${name && seen ? `, with ${name} in it` : ''}. Arrow keys move it, plus and minus zoom, Escape shows the whole world.`;
    svg.setAttribute('aria-label', `World map. ${showing}`);
  };
  const set = (v) => { Object.assign(view, fit(v)); apply(); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  /** ease the window to a new rest over about 300 ms; at once under reduced motion */
  const fly = (to, ms = 300) => {
    stop();
    const from = { ...view }, end = fit(to);
    if (stillNow() || !(ms > 0)) { set(end); settle(); return; }
    const t0 = performance.now();
    const step = (now) => {
      if (!svg.isConnected) { raf = 0; return; }
      const t = clampTo((now - t0) / ms, 0, 1), e = 1 - (1 - t) ** 3;
      set({ k: from.k * (end.k / from.k) ** e, cx: from.cx + (end.cx - from.cx) * e, cy: from.cy + (end.cy - from.cy) * e });
      if (t < 1) raf = requestAnimationFrame(step); else { raf = 0; settle(); }
    };
    raf = requestAnimationFrame(step);
  };
  /* a point on the screen, as a point on the world */
  const spot = (clientX, clientY) => {
    const r = svg.getBoundingClientRect();
    const fx = r.width > 0 ? clampTo((clientX - r.left) / r.width, 0, 1) : 0.5, fy = r.height > 0 ? clampTo((clientY - r.top) / r.height, 0, 1) : 0.5;
    const w = W / view.k, h = H / view.k;
    return { fx, fy, x: view.cx - w / 2 + fx * w, y: view.cy - h / 2 + fy * h };
  };
  /** zoom to k, keeping the world point under the pointer where it is; a pinch also carries that point to where the
      fingers' midpoint has gone (toX, toY), in one move, so the edge clamp is applied once and eats none of the carry */
  const zoomTo = (clientX, clientY, kNext, toX = clientX, toY = clientY) => {
    const p = spot(clientX, clientY), to = spot(toX, toY);
    const k = clampTo(kNext, 1, K_MAX);
    const w = W / k, h = H / k;
    set({ k, cx: p.x - to.fx * w + w / 2, cy: p.y - to.fy * h + h / 2 });
  };
  const panBy = (dxPx, dyPx) => {
    const r = svg.getBoundingClientRect();
    if (!(r.width > 0)) return;
    const s = W / view.k / r.width; // world units to one screen pixel
    set({ k: view.k, cx: view.cx - dxPx * s, cy: view.cy - dyPx * s });
  };
  /** the press: out to the whole world when moved in, else in on the place they named, or on the point pressed */
  const toggle = (clientX, clientY) => {
    if (!whole()) { fly({ k: 1, cx: W / 2, cy: H / 2 }); return; }
    const p = home ?? (clientX === undefined ? { x: view.cx, y: view.cy } : spot(clientX, clientY));
    fly({ k: K_NEAR, cx: p.x, cy: p.y });
  };

  /* pointers: one drags (once moved in), two pinch and carry the map with their midpoint */
  const pts = new Map();
  let drag = null, pinch = null;
  const two = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; };
  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stop();
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* the pointer has already gone */ }
    if (pts.size === 1) drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, t0: performance.now() };
    else { drag = null; if (pts.size === 2) pinch = two(); svg.classList.remove('dragging'); }
  });
  svg.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (pinch && pts.size >= 2) {
      const now = two();
      zoomTo(pinch.mx, pinch.my, pinch.d > 0 && now.d > 0 ? view.k * (now.d / pinch.d) : view.k, now.mx, now.my);
      pinch = now;
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { drag.moved = true; if (!whole()) svg.classList.add('dragging'); }
    if (drag.moved && !whole()) panBy(e.clientX - drag.x, e.clientY - drag.y);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const lift = (e, cancelled) => {
    if (!pts.delete(e.pointerId)) return;
    try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    if (pinch) { if (pts.size < 2) { pinch = null; drag = null; settle(); } return; } // the finger left on the glass starts nothing
    if (!drag || drag.id !== e.pointerId) return;
    const press = !cancelled && !drag.moved && performance.now() - drag.t0 < 700;
    drag = null;
    svg.classList.remove('dragging');
    if (press) toggle(e.clientX, e.clientY); else settle();
  };
  svg.addEventListener('pointerup', (e) => lift(e, false));
  svg.addEventListener('pointercancel', (e) => lift(e, true));
  /* Ctrl or Cmd with the wheel zooms about the pointer (a trackpad pinch arrives this way too); a plain wheel scrolls the page */
  svg.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    stop();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomTo(e.clientX, e.clientY, view.k * Math.exp(-clampTo(dy, -100, 100) * 0.006)); // one wheel notch is about 1.8 times
    settle();
  }, { passive: false });
  /* Safari on a Mac sends its trackpad pinch as gesture events, not as a wheel; fingers on glass are the pointers' job above */
  let g0 = 1;
  svg.addEventListener('gesturestart', (e) => { if (pts.size) return; e.preventDefault(); stop(); g0 = view.k; });
  svg.addEventListener('gesturechange', (e) => { if (pts.size) return; e.preventDefault(); zoomTo(e.clientX, e.clientY, g0 * (e.scale || 1)); });
  svg.addEventListener('gestureend', (e) => { if (pts.size) return; e.preventDefault(); settle(); });
  /* the card turns to its neighbour on a sideways swipe (canopy.js): a touch that starts on the map is the map's own */
  ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((t) => svg.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  /* keys, while the map has focus: arrows pan (once moved in), + and - zoom, Enter or Space is the press, Escape is the
     whole world. A key the map uses stops here, so it neither turns the card nor closes it; every other key travels on */
  svg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dx = W / view.k / 5, dy = H / view.k / 5;
    let used = true;
    if (e.key === 'ArrowLeft' && !whole()) fly({ ...view, cx: view.cx - dx }, 160);
    else if (e.key === 'ArrowRight' && !whole()) fly({ ...view, cx: view.cx + dx }, 160);
    else if (e.key === 'ArrowUp' && !whole()) fly({ ...view, cy: view.cy - dy }, 160);
    else if (e.key === 'ArrowDown' && !whole()) fly({ ...view, cy: view.cy + dy }, 160);
    else if (e.key === '+' || e.key === '=') fly(whole() && home ? { k: 1.5, cx: home.x, cy: home.y } : { ...view, k: view.k * 1.5 }, 160);
    else if ((e.key === '-' || e.key === '_') && !whole()) fly({ ...view, k: view.k / 1.5 }, 160);
    else if (e.key === 'Escape' && !whole()) fly({ k: 1, cx: W / 2, cy: H / 2 });
    else if (e.key === 'Enter' || e.key === ' ') toggle();
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); }
  });

  /* a repaint at another width keeps the window: its centre as fractions of the world, and its zoom */
  if (keep && keep.k > 1) set({ k: keep.k, cx: keep.fx * W, cy: keep.fy * H }); else apply();
  settle();
  /* the marks are sized again whenever the drawn width changes: the ▾ opening, the card resizing, the phone turning */
  let sizer = null;
  if (typeof ResizeObserver === 'function') { sizer = new ResizeObserver(() => { if (!raf) apply(); }); sizer.observe(svg); }
  return { fractions: () => ({ fx: view.cx / W, fy: view.cy / H, k: view.k }), stop: () => { stop(); sizer?.disconnect(); } };
}

function paintWorld(host, keep) {
  if (!host) return;
  world?.ctl?.stop?.();
  /* a remote or shipped business gets no map output at all (brief 18.1): the host holds the text equivalent */
  if (M.catchmentApplies() === false) { world = null; host.innerHTML = `<p class="c-line map-skip">${esc(M.mapSkipReason() || 'You deliver remotely, so Mercer draws no map.')}</p>`; return; }
  const land = Array.isArray(M.LAND110) ? M.LAND110 : [];
  const narrow = widthFor(host) < 520;
  const W = narrow ? 360 : 640, H = Math.round(W / 2);
  const at = locate();
  const P = (lon, lat) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  const stats = [
    gave('market', state.market) ? [count(state.market), 'prospects, your figure'] : null,
    gave('listSize', state.listSize) ? [count(state.listSize), 'contacts, your figure'] : null,
  ].filter(Boolean);
  const coarse = (() => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
  const mac = /Mac|iPhone|iPad/.test(String(navigator.platform ?? ''));
  const hint = coarse ? 'Press the map to move in or out. Drag to move it, pinch to zoom.' : `Press the map to move in or out. Drag to move it. Hold ${mac ? 'Cmd' : 'Ctrl'} and scroll to zoom.`;
  host.innerHTML = `
    <div class="map-wrap world-wrap"><svg class="world-map" tabindex="0" role="application" aria-roledescription="map" aria-label="World map"></svg></div>
    <p class="map-hint">${esc(hint)}</p>
    ${stats.length ? `<div class="map-stats" id="world-stats">${stats.map(([n, t]) => `<div class="map-stat"><b class="tabular">${n}</b><span>${t}</span></div>`).join('')}</div>` : ''}
    <div class="map-foot"><span class="map-credit">${esc(LAND_CREDIT)}</span></div>`;
  const svg = $('.world-map', host);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.dataset.narrow = String(narrow);
  /* map.css holds the map's rules. The two the gestures cannot work without are also set here, so the map still pans and
     keeps its line weight on a page that has not linked map.css yet */
  svg.style.touchAction = 'pan-y';
  el('rect', { x: 0, y: 0, width: W, height: H, class: 'map-sea' }, svg);
  const g = el('g', { class: 'world-land' }, svg);
  land.forEach((ring) => {
    if (!Array.isArray(ring) || ring.length < 3) return;
    // two decimals: the outline is looked at up to eight times closer than it is drawn
    const d = ring.map(([lon, lat], i) => { const [x, y] = P(lon, lat); return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; }).join('') + 'Z';
    el('path', { d, class: 'map-land', 'vector-effect': 'non-scaling-stroke' }, g);
  });
  let pin = null, label = null;
  if (at) {
    const [x, y] = P(at.lon, at.lat);
    pin = el('circle', { cx: x, cy: y, r: narrow ? 3 : 4, class: 'map-pin world-pin', 'vector-effect': 'non-scaling-stroke' }, svg);
    label = el('text', { x: x + (narrow ? 6 : 8), y: y + 4, class: 'map-pin-label' }, svg);
    label.textContent = state.biz || at.name;
  }
  world = { host, svg, narrow, ctl: worldWindow(svg, W, H, at, pin, label, narrow, keep ?? null) };
}
M.paintWorld = (host) => paintWorld(host);
M.LAND_CREDIT = LAND_CREDIT;

/* both maps are drawn for one of two widths. When the width a map sits in crosses the line it is drawn again for the new
   one: the ring map from scratch, the world with its window kept. A map inside a closed ▾ has no width to read and waits */
let wasNarrow = null;
if (typeof ResizeObserver === 'function') new ResizeObserver(() => {
  const ring = $('#trade-map');
  if (ring && ring.parentElement?.clientWidth > 0) {
    const narrow = widthFor(ring.parentElement) < 520;
    if (wasNarrow !== null && narrow !== wasNarrow) M.paintMap(lastHost ?? ring.closest('.map-host') ?? undefined);
    wasNarrow = narrow;
  }
  if (world && world.svg.isConnected && world.host.clientWidth > 0) {
    const narrow = widthFor(world.host) < 520;
    if (narrow !== world.narrow) paintWorld(world.host, world.ctl.fractions());
  }
}).observe(document.documentElement);
})();
