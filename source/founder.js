/* The person who has to run the plan.

   Two things live here. The sixteen types, which Mercer takes as a statement of
   preference rather than a measurement: it never moves a number, it moves which
   steps get put in front of you and how the call is run. And a CV, pasted in and
   read here in the page: nothing is uploaded, nothing is sent, and what is pulled
   out of it is shown back so it can be corrected or cleared. */
(() => {
'use strict';
const M = window.Mercer;

/* ---------------------------------------------------------------- the sixteen types */
const TYPES = [
  ['INTJ', 'Architect', 'Builds the sales system first, then sells through it.'],
  ['INTP', 'Thinker', 'Checks the model before running it.'],
  ['ENTJ', 'Commander', 'Decides fast and holds people to the number.'],
  ['ENTP', 'Challenger', 'Starts more than they finish, and finds angles others missed.'],
  ['INFJ', 'Advocate', 'Takes the long view and distrusts hype.'],
  ['INFP', 'Idealist', 'Needs the work to mean something before doing it.'],
  ['ENFJ', 'Protagonist', 'Gets the room moving and sells through relationships.'],
  ['ENFP', 'Campaigner', 'Wins work on enthusiasm and drops the follow-up.'],
  ['ISTJ', 'Logistician', 'Delivers what they agreed, on the day they agreed.'],
  ['ISFJ', 'Defender', 'Keeps customers for years without making a show of it.'],
  ['ESTJ', 'Executive', 'Runs a tight operation and wants the plan in a calendar.'],
  ['ESFJ', 'Consul', 'Knows the local area and has favours to call in.'],
  ['ISTP', 'Craftsman', 'Fixes what is in front of them and treats sales as an interruption.'],
  ['ISFP', 'Artisan', 'Wins new work on the quality of past jobs.'],
  ['ESTP', 'Dealmaker', 'Closes in the room and hates a long pipeline.'],
  ['ESFP', 'Performer', 'Sells by being liked.'],
];
const BY_CODE = Object.fromEntries(TYPES.map((t) => [t[0], { code: t[0], name: t[1], line: t[2] }]));
M.TYPES = TYPES;
M.typeOf = (code) => BY_CODE[code] ?? null;

/** the four either-ors, for anyone who does not know their letters */
const AXES = [
  { id: 0, a: 'E', b: 'I', aq: 'A day of meetings leaves me sharper', bq: 'A day of meetings leaves me flat' },
  { id: 1, a: 'S', b: 'N', aq: 'I trust what has worked before', bq: 'I trust where things are heading' },
  { id: 2, a: 'T', b: 'F', aq: 'Decide on the numbers', bq: 'Decide on the people' },
  { id: 3, a: 'J', b: 'P', aq: 'A plan I can hold to', bq: 'Room to change my mind' },
];
M.TYPE_AXES = AXES;

/* what each letter means for the plan, and nowhere else. These are statements about
   how the work gets sequenced, not claims about the person's ability. */
const LETTER = {
  E: 'Steps that put you in front of people, such as events and calls, suit you, so Mercer puts them first.',
  I: 'Mercer puts steps that need you in a room last and leads with search, referrals and your site, which grow without you.',
  S: 'Mercer leads with what worked for businesses like yours and runs untried routes as tests with a spending cap.',
  N: 'You will want to try the new route, so Mercer gives it a full test with its own budget.',
  T: 'Mercer gives each step a number and a payback, and opens the call with the model.',
  F: 'Mercer names who each step affects, your team and your customers, because you weigh that before you act.',
  J: 'You get the plan as a dated schedule, ready for your calendar.',
  P: 'You get the plan as a ranked list without dates, so you can change the order. Mercer marks the one step that must stay on time.',
};
M.letterMeans = (l) => LETTER[l] ?? '';

/* ---------------------------------------------------------------- a CV, read here */
const DEGREE = /\b(BSc|BA|BEng|LLB|MSc|MA|MBA|MEng|PhD|DPhil|HND|HNC|BTEC|NVQ|SVQ|City\s*&\s*Guilds|A-?levels?|GCSEs?|apprenticeship|diploma|certificate|certified|accredited|foundation degree|chartered|licence holder|license holder|WSET|CIEH|food hygiene|first aid|safeguarding|ACCA|ACA|CIMA|CIPD|RICS|CIM|IOSH|NEBOSH|PRINCE2|Six Sigma|Level [1-7])\b/i;
const SCHOOL = /\b(University|College|School of|Institute|Academy|Polytechnic|Business School)\b/i;
const YEARS = /\b(19[6-9]\d|20[0-4]\d)\b/g;
const ROLE = /\b(founder|co-?founder|director|manager|head of|lead|partner|owner|principal|consultant|engineer|analyst|officer|supervisor|apprentice|technician|surveyor|solicitor|accountant|nurse|chef|driver)\b/i;

/** what a pasted CV says, worked out in the page and shown back to be corrected */
function readCV(text) {
  const lines = String(text ?? '').split(/\r?\n|·|•|•/).map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 220);
  const education = [];
  const roles = [];
  const seen = new Set();
  lines.forEach((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return;
    if (DEGREE.test(l) || SCHOOL.test(l)) { seen.add(key); if (education.length < 8) education.push(l); return; }
    if (ROLE.test(l) && l.length < 120) { seen.add(key); if (roles.length < 8) roles.push(l); }
  });
  const all = String(text ?? '').match(YEARS)?.map(Number) ?? [];
  const now = new Date().getFullYear();
  const first = all.length ? Math.min(...all) : null;
  const years = first && first <= now ? now - first : null;
  const trade = /\b(apprentic|NVQ|City\s*&\s*Guilds|BTEC|HNC|HND|time-served|journeyman)\b/i.test(text ?? '');
  return {
    education, roles,
    years: years !== null && years <= 60 ? years : null,
    since: first,
    route: trade ? 'trade' : education.some((l) => /\b(BSc|BA|MSc|MA|MBA|MEng|PhD|LLB)\b/i.test(l)) ? 'degree' : education.length ? 'qualified' : null,
    words: String(text ?? '').split(/\s+/).filter(Boolean).length,
  };
}
M.readCV = readCV;

/** what Mercer read from it, in one short line */
M.cvLine = (f) => {
  if (!f) return '';
  const bits = [];
  if (f.years) bits.push(`<b>${f.years} years</b> in work${f.since ? ` since ${f.since}` : ''}`);
  if (f.education.length) bits.push(`<b>${f.education.length}</b> ${f.education.length === 1 ? 'qualification' : 'qualifications'}`);
  if (f.roles.length) bits.push(`<b>${f.roles.length}</b> ${f.roles.length === 1 ? 'role' : 'roles'}`);
  if (!bits.length) return 'Mercer found no dates, roles or qualifications.';
  return `Read: ${bits.join(', ')}.`;
};
})();
