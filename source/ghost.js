/* Suggestions under a free-type line.

   Every free-type line in the interview has a few endings behind it, the same for every
   branch of business: vague, plainly made up, and fitting no one trade (COPY §16). Nothing
   is sent anywhere. Rebuild 1 (C02): the grey tail that finished the typing is retired for a
   list the visitor can see and choose from. It opens under the line when the line takes focus
   (every ending while the line is empty, the endings that fit once typing starts), the arrows
   move through it, Enter or a press takes one, Escape and a press outside close it, and focus
   stays on the line. Taking one writes the line and commits it the way a blur would, so the
   answer is in state at once. The software ledger is the one line with its own list: its
   suggestions are each category's example names from build.js. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer ?? {});

/** the endings, by question. '*' fits every branch; a keyed set (none today) would be read first for that branch */
const BY_Q = {
  included: {
    '*': ['the first call, the work itself and a written handover', 'a scoping call, the work itself and a written handover', 'a first consultation, the work itself and a review six weeks later', 'the review, a written report and a call to walk through it', 'a fixed scope, one revision and thirty days of support afterwards'],
  },
  competitors: {
    '*': ['two national names and three local ones', 'two local firms and the national names at the top end', 'three firms of about our size, and freelancers underneath us', 'the incumbent they already use, and doing nothing at all', 'one national firm and a handful of independents'],
  },
  agencyWhy: {
    '*': ['they never learned what we sell', 'the reporting looked good and the phone never rang', 'we could not get hold of anyone after the first month', 'the leads were the wrong kind and nobody would say so', 'they were fine, then the work stalled after a few months', 'it cost more than it brought in and we ran out of patience'],
  },
  deadline: {
    '*': ['a lease renewal in the spring that we want to be ready for', 'a hire we have already committed to and need the work for', 'a contract ending in six months that is a third of revenue', 'a loan repayment starting next year', 'we want to step back from the day-to-day by then'],
  },
  bestEver: {
    '*': ['they came back three times and sent four other people', 'one job that paid for the quarter and led to two more', 'a customer who has been with us six years and never haggled', 'they gave us the time to do it right, and it won us two referrals'],
  },
  successWords: {
    '*': ['the business runs a week without me in it', 'we stop worrying about January', 'we can hire the person we have been putting off', 'revenue is predictable enough to plan around', 'I take a proper holiday and nothing falls over', 'we double without doubling the hours'],
  },
  note: {
    '*': ['we lose half of January every year and make it back by April', 'a competitor opened next door in the spring', 'we have a contract ending that is about a fifth of revenue', 'we tried paid ads for three months and stopped', 'we are moving premises next year', 'one customer is a third of our revenue', 'our best person is leaving and we have not replaced them'],
  },
  /* refine 1, R18: the Control section's open question. Vague on purpose: no names, no figures */
  unresolved: {
    '*': ['who has the last word when two of us disagree on pay', 'what happens to my share if I stop working in the business', 'whether the next hire reports to me or to my partner', 'who decides when we take on a client one of us does not want', 'how the profit is split once the new partner joins'],
  },
  /* rebuild 1: the owner's own aim, the purchase trigger and the hold-up, in the same plain register */
  winOther: {
    '*': ['a business that runs without me for a month', 'the same revenue from fewer, better customers', 'work that does not depend on one big customer', 'a business I could sell in five years'],
  },
  triggerOther: {
    '*': ['a problem they have put off until it cannot wait', 'a change at their end: a move, a hire, a new contract', 'someone they trust told them to call us'],
  },
  holdupOther: {
    '*': ['quotes wait until I have an evening free', 'the job is done and the invoice goes out weeks later', 'enquiries sit in a shared inbox nobody owns'],
  },
  /* the starter route's free lines */
  n09: {
    '*': ['five years in customer service, two of them running a small team', 'a degree, then admin and bookkeeping for a family firm', 'built a website for a friend and ran their social media for a year', 'ran the kitchen at a busy café for three years'],
  },
  n12: {
    '*': ['fixing their phone or laptop', 'writing a CV or a difficult email', 'choosing what to charge', 'planning a trip or an event'],
  },
  n25: {
    '*': ['a bookkeeping service for local tradespeople', 'walking dogs in my area on weekday mornings', 'an online course on the thing I do at work', 'making and selling cakes for events'],
  },
  n20: {
    '*': ['they cannot find anyone reliable to do small jobs', 'they lose evenings to paperwork', 'they pay for software they hardly use', 'they do not know what to charge'],
  },
  /* final 1, Task 11: the discovery prompts. Concrete answers, so the field shows what kind of thing is wanted */
  interest: {
    '*': ['take the bike apart and put it back together', 'cook something I have not cooked before', 'read about how houses were built', 'play the piano badly and enjoy it', 'walk somewhere new with the dog'],
  },
  interestPart: {
    '*': ['working out why it will not do what I want', 'the bit where it finally works', 'showing someone else how to do it', 'getting it tidy and finished'],
  },
  paidWhat: {
    '*': ['fixed two neighbours’ laptops, £40 each', 'made a friend’s wedding cake for the cost of the ingredients', 'taught a colleague to use the spreadsheet', 'sold a few at a school fair'],
  },
  bestAt: {
    '*': ['ten years of stage lighting for small theatres', 'four years of bookkeeping for a family firm', 'chess since I was nine, and coaching juniors for two', 'baking, every weekend for a decade'],
  },
  workStyleOther: {
    '*': ['fixing what other people have broken', 'running things behind the scenes', 'finding the thing nobody else noticed'],
  },
  n39Text: {
    '*': ['five people ask for a price', 'two of them pay a deposit', 'someone I do not know gets in touch'],
  },
};

/** the software ledger's suggestions: the category's example names from build.js, read late because build.js loads after this file */
function softwareSet(id) {
  const m = /^software[.:-](.+)$/.exec(id);
  if (m) { const eg = M.STACK_BY?.[m[1]]?.eg; return eg ? eg.split(',').map((s) => s.trim()).filter(Boolean) : []; }
  if (id === 'software') return (M.STACK ?? []).flatMap((s) => String(s.eg ?? '').split(',').map((x) => x.trim())).filter(Boolean);
  return null;
}

/** the endings behind one line: the software ledger's example names, or the question's trade-neutral list */
function phrasesFor(id) {
  const sw = softwareSet(id);
  if (sw) return sw;
  const set = BY_Q[id];
  if (!set) return [];
  const key = M.contentKey ? M.contentKey() : 'professional-services';
  return [...(set[key] ?? []), ...(set['*'] ?? [])];
}

/** the clause being typed right now: everything since the last full stop or line break */
function clauseOf(v) {
  const cut = Math.max(v.lastIndexOf('. '), v.lastIndexOf('\n'), v.lastIndexOf('! '), v.lastIndexOf('? '));
  return cut < 0 ? v : v.slice(cut + 1).replace(/^\s+/, '');
}
const MAX = 6;
let seq = 0;

/** the list under one line. Returns { open, close, destroy } for tests; nothing else reads it */
function ghost(box, id) {
  const list = phrasesFor(id);
  if (!list.length || !box.parentElement) return null;
  const wrap = document.createElement('div');
  wrap.className = 'ghost-wrap';
  box.parentElement.insertBefore(wrap, box);
  wrap.appendChild(box);
  /* the panel: a caption and the options in one box, so it flips above the line as a whole where there is no room below.
     The caption carries class ghost-hint, which feel.js reads to let Escape close the list before it reverts the line */
  const panel = document.createElement('div');
  panel.className = 'ghost-list';
  panel.hidden = true;
  const hint = document.createElement('span');
  hint.className = 'ghost-hint';
  hint.textContent = 'Suggestions. Pick one, or keep typing.';
  hint.setAttribute('aria-hidden', 'true');
  const menu = document.createElement('div');
  menu.className = 'ghost-options';
  menu.id = `ghost-${++seq}`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Suggestions');
  panel.append(hint, menu);
  wrap.appendChild(panel);
  box.setAttribute('aria-autocomplete', 'list');
  box.setAttribute('aria-controls', menu.id);
  box.setAttribute('aria-expanded', 'false');
  /** open below the line, or above it where the scrolling clearing has more room there; then cap the panel to the room
      it has, so every option can be reached inside it, and bring it into view */
  const place = () => {
    try {
      panel.style.maxHeight = '';
      const r = panel.getBoundingClientRect();
      if (!r.height) return;
      let scroller = wrap.parentElement;
      while (scroller && scroller !== document.body && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
      const limit = scroller && scroller !== document.body ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const br = box.getBoundingClientRect();
      const below = limit.bottom - br.bottom - 8;
      const above = br.top - limit.top - 8;
      const up = r.height > below && above > below;
      panel.classList.toggle('up', up);
      const room = Math.round(up ? above : below);
      if (room > 80 && r.height > room) panel.style.maxHeight = `${room}px`;
      panel.scrollIntoView?.({ block: 'nearest' });
    } catch (e) { /* no layout to read */ }
  };
  let items = [];
  let active = -1;
  let open = false;

  const matches = () => {
    const c = clauseOf(box.value).trim().toLowerCase();
    if (!c) return list.slice(0, MAX);
    const words = c.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
    const score = (p) => {
      const q = p.toLowerCase();
      if (q.startsWith(c)) return 3;
      const hit = words.filter((w) => q.includes(w)).length;
      return hit ? 1 + hit / words.length : 0;
    };
    return list.map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0 && x.p.toLowerCase() !== c).sort((a, b) => b.s - a.s).slice(0, MAX).map((x) => x.p);
  };
  const setActive = (i) => {
    active = i;
    items.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.classList.toggle('active', j === i); });
    if (i >= 0 && items[i]) box.setAttribute('aria-activedescendant', items[i].id); else box.removeAttribute('aria-activedescendant');
  };
  const close = () => {
    if (!open) return;
    open = false;
    panel.hidden = true;
    panel.classList.remove('up');
    box.setAttribute('aria-expanded', 'false');
    setActive(-1);
  };
  const paint = () => {
    const found = matches();
    menu.innerHTML = '';
    items = found.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ghost-item';
      b.id = `${menu.id}-${i}`;
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', 'false');
      b.tabIndex = -1;
      b.textContent = p;
      // a press takes the phrase; pointerdown is stopped so the line keeps focus and no blur commits an unfinished value first
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => take(p));
      menu.appendChild(b);
      return b;
    });
    if (!items.length) { close(); return; }
    open = true;
    panel.hidden = false;
    box.setAttribute('aria-expanded', 'true');
    setActive(-1);
    place();
  };
  let taking = false;
  const show = () => { if (!taking) paint(); };
  /** the phrase replaces the clause being typed, the line is told, and the answer is committed the way a blur commits it.
      The list stays closed through the input and focus events that follow */
  const take = (p) => {
    const v = box.value;
    const clause = clauseOf(v);
    const head = clause ? v.slice(0, v.length - clause.length) : (v.trim() ? `${v.replace(/\s+$/, '')} ` : '');
    box.value = `${head}${p}`;
    taking = true;
    close();
    try {
      box.dispatchEvent(new Event('input', { bubbles: true }));
      try { box.setSelectionRange(box.value.length, box.value.length); } catch (e) { /* an input that cannot */ }
      box.dispatchEvent(new Event('blur'));
      box.focus({ preventScroll: true });
    } finally { taking = false; }
  };
  const onOutside = (e) => { if (open && !wrap.contains(e.target)) close(); };
  box.addEventListener('focus', show);
  box.addEventListener('input', show);
  box.addEventListener('blur', () => { setTimeout(() => { if (document.activeElement !== box) close(); }, 0); });
  box.addEventListener('keydown', (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (!open) { if (e.key === 'ArrowDown' && !box.value.trim()) { e.preventDefault(); paint(); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(items.length ? (active + 1) % items.length : -1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(items.length ? (active - 1 + items.length) % items.length : -1); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); e.stopImmediatePropagation(); take(items[active].textContent); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close();
  });
  document.addEventListener('pointerdown', onOutside, true);
  document.addEventListener('mousedown', onOutside, true);
  return { open: paint, close, get isOpen() { return open; }, destroy() { close(); document.removeEventListener('pointerdown', onOutside, true); document.removeEventListener('mousedown', onOutside, true); } };
}
M.ghost = ghost;
M.ghostPhrases = phrasesFor;
})();
