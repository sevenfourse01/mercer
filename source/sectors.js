/* Every branch of business, and what Mercer knows about each.

   The sections are the ones the ICO's own sector guidance uses, the UK SIC 2007
   sections, so a business can find itself here whatever it does. The prior pack
   holds fitted figures for five of them. For the rest the engine pools to its
   global priors, which is a real answer and a weaker one, and the page says so
   rather than dressing a guess up as a sector figure. */
(() => {
'use strict';
const M = (window.Mercer = window.Mercer ?? {});

/** id → the pack niche whose figures fit it, or null for "pooled across all industries" */
const SECTORS = [
  { id: 'health', name: 'Health and care', niche: 'private-healthcare', place: 'local', sic: 'Q',
    kinds: ['Physiotherapy', 'Dental practice', 'Aesthetics clinic', 'Osteopathy and chiropractic', 'Private GP', 'Therapy and counselling', 'Veterinary', 'Optician', 'Care at home', 'Care home', 'Pharmacy'] },
  { id: 'professional', name: 'Professional services', niche: 'professional-services', place: 'local', sic: 'M',
    kinds: ['Accountancy', 'Legal', 'Consultancy', 'Marketing agency', 'Recruitment', 'Architecture', 'Surveying', 'Engineering design', 'Design studio', 'Translation', 'Photography'] },
  { id: 'construction', name: 'Trades and construction', niche: 'home-services', place: 'local', sic: 'F',
    kinds: ['Plumbing and heating', 'Electrical', 'Roofing', 'Building and renovation', 'Joinery', 'Plastering', 'Painting and decorating', 'Groundworks', 'Scaffolding', 'Glazing'] },
  { id: 'home', name: 'Home and garden services', niche: 'home-services', place: 'local', sic: 'N',
    kinds: ['Cleaning', 'Landscaping', 'Pest control', 'Removals', 'Window cleaning', 'Waste clearance', 'Security'] },
  { id: 'tech', name: 'Software and IT', niche: 'b2b-saas', place: 'online', sic: 'J',
    kinds: ['Software platform', 'Developer tools', 'Industry software', 'Data and analytics', 'IT support', 'Cyber security', 'Web development', 'App studio'] },
  { id: 'retail', name: 'Retail and wholesale', niche: 'e-commerce', place: 'online', sic: 'G',
    kinds: ['Online shop', 'Direct-to-consumer brand', 'Marketplace seller', 'Subscription box', 'High street shop', 'Wholesaler', 'Motor trade', 'Garden centre'] },

  // --- the sections the pack has no fitted figures for -----------------------
  { id: 'hospitality', name: 'Hospitality and food', niche: null, place: 'local', sic: 'I',
    kinds: ['Restaurant', 'Café', 'Pub or bar', 'Hotel', 'Bed and breakfast', 'Holiday let', 'Takeaway', 'Catering', 'Events and weddings', 'Food truck', 'Brewery or distillery'] },
  { id: 'leisure', name: 'Sport and leisure', niche: null, place: 'local', sic: 'R',
    kinds: ['Gym or studio', 'Personal training', 'Sports club', 'Golf club', 'Soft play', 'Theatre or venue', 'Tour operator', 'Activity centre'] },
  { id: 'education', name: 'Education and training', niche: null, place: 'local', sic: 'P',
    kinds: ['Tutoring', 'Nursery', 'Private school', 'Driving school', 'Training provider', 'Online course', 'Music teaching'] },
  { id: 'beauty', name: 'Personal care', niche: null, place: 'local', sic: 'S',
    kinds: ['Hair salon', 'Barber', 'Beauty salon', 'Nails', 'Spa', 'Tattoo studio', 'Massage'] },
  { id: 'manufacturing', name: 'Manufacturing', niche: null, place: 'national', sic: 'C',
    kinds: ['Food and drink', 'Furniture', 'Metalwork', 'Print', 'Textiles', 'Electronics', 'Packaging', 'Signage'] },
  { id: 'property', name: 'Property', niche: null, place: 'local', sic: 'L',
    kinds: ['Estate agency', 'Lettings', 'Property management', 'Developer', 'Commercial property', 'Serviced offices'] },
  { id: 'finance', name: 'Finance and insurance', niche: null, place: 'national', sic: 'K',
    kinds: ['Mortgage advice', 'Financial planning', 'Insurance broking', 'Bookkeeping', 'Lending', 'Payments'] },
  { id: 'transport', name: 'Transport and logistics', niche: null, place: 'national', sic: 'H',
    kinds: ['Courier', 'Haulage', 'Taxi or private hire', 'Warehousing', 'Freight forwarding', 'Vehicle hire'] },
  { id: 'agriculture', name: 'Agriculture and land', niche: null, place: 'local', sic: 'A',
    kinds: ['Farm', 'Horticulture', 'Forestry', 'Fishing', 'Equestrian', 'Farm shop'] },
  { id: 'creative', name: 'Media and creative', niche: null, place: 'national', sic: 'J',
    kinds: ['Film and video', 'Publishing', 'Music', 'Advertising production', 'Podcasting', 'Games'] },
  { id: 'energy', name: 'Energy and utilities', niche: null, place: 'national', sic: 'D',
    kinds: ['Solar and renewables', 'Heating installation', 'EV charging', 'Energy consultancy', 'Water services'] },
  { id: 'waste', name: 'Waste and environment', niche: null, place: 'local', sic: 'E',
    kinds: ['Waste collection', 'Recycling', 'Skip hire', 'Environmental consultancy'] },
  { id: 'public', name: 'Public and social', niche: null, place: 'local', sic: 'O',
    kinds: ['Charity', 'Social enterprise', 'Membership body', 'Local government supplier', 'Faith organisation'] },
  { id: 'mining', name: 'Mining and quarrying', niche: null, place: 'national', sic: 'B',
    kinds: ['Quarrying', 'Aggregates', 'Extraction services'] },
  { id: 'other', name: 'Something else', niche: null, place: 'local', sic: 'S',
    kinds: ['Repairs', 'Funeral services', 'Laundry', 'Photography services', 'Trade association', 'Anything not listed'] },
];

const BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));
M.SECTORS = SECTORS;
M.SECTOR_BY = BY_ID;
/** the pack niche a sector runs on, or null when the engine pools across every industry */
M.nicheOf = (id) => BY_ID[id]?.niche ?? null;
/** true when Mercer has fitted figures for this branch rather than pooled ones */
M.fitted = (id) => BY_ID[id]?.niche !== null && BY_ID[id]?.niche !== undefined;
M.sectorWord = (id) => BY_ID[id]?.name ?? 'your industry';
/** which set of written advice fits this branch: the five the pack knows, or the nearest of them */
const CONTENT = {
  health: 'private-healthcare', beauty: 'private-healthcare', education: 'private-healthcare',
  professional: 'professional-services', finance: 'professional-services', property: 'professional-services', creative: 'professional-services', public: 'professional-services',
  construction: 'home-services', home: 'home-services', energy: 'home-services', waste: 'home-services', agriculture: 'home-services', transport: 'home-services', mining: 'home-services',
  tech: 'b2b-saas',
  retail: 'e-commerce', manufacturing: 'e-commerce',
  hospitality: 'hospitality', leisure: 'hospitality',
  other: 'professional-services',
};
M.contentKey = () => CONTENT[window.Mercer.state.sector] ?? 'professional-services';

/* what one unit of work is called here. The engine counts in clients; a restaurant
   counts covers and a builder counts jobs, and the page says the word they use. */
const UNIT = {
  health: 'appointments', beauty: 'appointments', education: 'places',
  professional: 'clients', finance: 'clients', property: 'instructions', creative: 'projects', public: 'clients',
  construction: 'jobs', home: 'jobs', energy: 'installations', waste: 'collections', agriculture: 'orders', transport: 'jobs', mining: 'loads',
  tech: 'accounts',
  retail: 'orders', manufacturing: 'orders',
  hospitality: 'covers', leisure: 'bookings',
  other: 'jobs',
};
const MARK = {
  health: 'private-healthcare', beauty: 'beauty', education: 'education',
  professional: 'professional-services', finance: 'finance', property: 'property', creative: 'creative', public: 'person',
  construction: 'home-services', home: 'home-services', energy: 'energy', waste: 'waste', agriculture: 'agriculture', transport: 'transport', mining: 'manufacturing',
  tech: 'b2b-saas', retail: 'e-commerce', manufacturing: 'manufacturing',
  hospitality: 'hospitality', leisure: 'leisure', other: 'spark',
};
/** the mark a branch draws in the picker */
M.markOf = (id) => MARK[id] ?? 'info';
/* the trade is more specific than the section: a hotel sells room nights, the
   restaurant next door sells covers, and both sit under hospitality */
const TRADE_UNIT = {
  'Hotel': 'room nights', 'Bed and breakfast': 'room nights', 'Holiday let': 'nights booked',
  'Events and weddings': 'events', 'Catering': 'events', 'Brewery or distillery': 'orders',
  'Care home': 'residents', 'Care at home': 'visits', 'Pharmacy': 'prescriptions',
  'Gym or studio': 'members', 'Sports club': 'members', 'Golf club': 'members', 'Soft play': 'sessions',
  'Theatre or venue': 'tickets', 'Tour operator': 'bookings', 'Activity centre': 'sessions',
  'Nursery': 'places', 'Private school': 'places', 'Online course': 'enrolments', 'Driving school': 'pupils',
  'Lettings': 'tenancies', 'Estate agency': 'instructions', 'Serviced offices': 'desks',
  'Taxi or private hire': 'journeys', 'Courier': 'deliveries', 'Haulage': 'loads',
  'Subscription box': 'subscribers', 'Marketplace seller': 'orders',
};
/* one of each. Written out, never cut from the plural: "nights booked" is "night booked", not "nights booke" */
const UNIT_ONE = {
  appointments: 'appointment', places: 'place', clients: 'client', instructions: 'instruction', projects: 'project', jobs: 'job',
  installations: 'installation', collections: 'collection', orders: 'order', loads: 'load', accounts: 'account', covers: 'cover', bookings: 'booking',
  'room nights': 'room night', 'nights booked': 'night booked', events: 'event', residents: 'resident', visits: 'visit', prescriptions: 'prescription',
  members: 'member', sessions: 'session', tickets: 'ticket', enrolments: 'enrolment', pupils: 'pupil', tenancies: 'tenancy', desks: 'desk',
  journeys: 'journey', deliveries: 'delivery', subscribers: 'subscriber', customers: 'customer', sales: 'sale',
};
/** a word this file does not hold (the engine's own unit, say): one plain word loses its plural ending, anything else is left alone */
const oneOf = (w) => UNIT_ONE[w] ?? (/^[a-z]+ies$/.test(w) ? w.replace(/ies$/, 'y') : /^[a-z]+[^s]s$/.test(w) ? w.slice(0, -1) : w);
/** true when the count prints as "1" (a number goes through M.count, so 1.04 is one and 1.3 is not; a string is read as printed) */
const printsOne = (n) => {
  if (n === undefined || n === null || n === '') return false;
  if (typeof n === 'string') return n.trim() === '1';
  if (!Number.isFinite(Number(n))) return false;
  return (typeof M.count === 'function' ? M.count(n) : String(Math.round(Number(n) * 10) / 10)) === '1';
};
/** the unit word for this trade; pass the count as n and one of them comes back singular ("1 job", "1 night booked") */
M.unitWord = (fallback, n) => {
  const w = TRADE_UNIT[window.Mercer.state?.trade] ?? UNIT[window.Mercer.state?.sector] ?? fallback ?? 'clients';
  return printsOne(n) ? oneOf(w) : w;
};
M.unitOne = oneOf;

/* Where the business trades, and what it trades in (final 1, Task 15).

   Location and currency are known before anything geographic, priced or budgeted, so both
   lists live here, beside the other vocabularies, and both are searchable. The country list
   is the markets a visitor is most likely to name, each with the currency it usually trades
   in; a country that is not here can still be typed and stands as given. The currency list
   is the ISO code, the symbol people write and the name they would search for. Neither list
   converts anything: Mercer shows figures in the currency the visitor trades in and says
   where a benchmark comes from. */
const COUNTRIES = [
  ['GB', 'United Kingdom', 'GBP'], ['IE', 'Ireland', 'EUR'], ['US', 'United States', 'USD'], ['CA', 'Canada', 'CAD'],
  ['AU', 'Australia', 'AUD'], ['NZ', 'New Zealand', 'NZD'], ['FR', 'France', 'EUR'], ['DE', 'Germany', 'EUR'],
  ['ES', 'Spain', 'EUR'], ['IT', 'Italy', 'EUR'], ['PT', 'Portugal', 'EUR'], ['NL', 'Netherlands', 'EUR'],
  ['BE', 'Belgium', 'EUR'], ['AT', 'Austria', 'EUR'], ['FI', 'Finland', 'EUR'], ['GR', 'Greece', 'EUR'],
  ['CY', 'Cyprus', 'EUR'], ['MT', 'Malta', 'EUR'], ['LU', 'Luxembourg', 'EUR'], ['EE', 'Estonia', 'EUR'],
  ['LV', 'Latvia', 'EUR'], ['LT', 'Lithuania', 'EUR'], ['SK', 'Slovakia', 'EUR'], ['SI', 'Slovenia', 'EUR'],
  ['HR', 'Croatia', 'EUR'], ['PL', 'Poland', 'PLN'], ['CZ', 'Czechia', 'CZK'], ['HU', 'Hungary', 'HUF'],
  ['RO', 'Romania', 'RON'], ['BG', 'Bulgaria', 'BGN'], ['SE', 'Sweden', 'SEK'], ['NO', 'Norway', 'NOK'],
  ['DK', 'Denmark', 'DKK'], ['IS', 'Iceland', 'ISK'], ['CH', 'Switzerland', 'CHF'], ['TR', 'Turkey', 'TRY'],
  ['ZA', 'South Africa', 'ZAR'], ['NG', 'Nigeria', 'NGN'], ['KE', 'Kenya', 'KES'], ['GH', 'Ghana', 'GHS'],
  ['EG', 'Egypt', 'EGP'], ['MA', 'Morocco', 'MAD'], ['AE', 'United Arab Emirates', 'AED'], ['SA', 'Saudi Arabia', 'SAR'],
  ['QA', 'Qatar', 'QAR'], ['IL', 'Israel', 'ILS'], ['IN', 'India', 'INR'], ['PK', 'Pakistan', 'PKR'],
  ['BD', 'Bangladesh', 'BDT'], ['LK', 'Sri Lanka', 'LKR'], ['SG', 'Singapore', 'SGD'], ['MY', 'Malaysia', 'MYR'],
  ['ID', 'Indonesia', 'IDR'], ['TH', 'Thailand', 'THB'], ['VN', 'Vietnam', 'VND'], ['PH', 'Philippines', 'PHP'],
  ['HK', 'Hong Kong', 'HKD'], ['JP', 'Japan', 'JPY'], ['KR', 'South Korea', 'KRW'], ['CN', 'China', 'CNY'],
  ['TW', 'Taiwan', 'TWD'], ['MX', 'Mexico', 'MXN'], ['BR', 'Brazil', 'BRL'], ['AR', 'Argentina', 'ARS'],
  ['CL', 'Chile', 'CLP'], ['CO', 'Colombia', 'COP'], ['PE', 'Peru', 'PEN'], ['JM', 'Jamaica', 'JMD'],
  ['TT', 'Trinidad and Tobago', 'TTD'], ['UA', 'Ukraine', 'UAH'],
];
const CURRENCIES = [
  ['GBP', '£', 'Pound sterling'], ['EUR', '€', 'Euro'], ['USD', '$', 'US dollar'], ['CAD', 'CA$', 'Canadian dollar'],
  ['AUD', 'A$', 'Australian dollar'], ['NZD', 'NZ$', 'New Zealand dollar'], ['CHF', 'CHF', 'Swiss franc'],
  ['SEK', 'kr', 'Swedish krona'], ['NOK', 'kr', 'Norwegian krone'], ['DKK', 'kr', 'Danish krone'],
  ['ISK', 'kr', 'Icelandic krona'], ['PLN', 'zł', 'Polish zloty'], ['CZK', 'Kč', 'Czech koruna'],
  ['HUF', 'Ft', 'Hungarian forint'], ['RON', 'lei', 'Romanian leu'], ['BGN', 'lv', 'Bulgarian lev'],
  ['TRY', '₺', 'Turkish lira'], ['UAH', '₴', 'Ukrainian hryvnia'], ['ZAR', 'R', 'South African rand'],
  ['NGN', '₦', 'Nigerian naira'], ['KES', 'KSh', 'Kenyan shilling'], ['GHS', '₵', 'Ghanaian cedi'],
  ['EGP', 'E£', 'Egyptian pound'], ['MAD', 'DH', 'Moroccan dirham'], ['AED', 'AED', 'UAE dirham'],
  ['SAR', 'SR', 'Saudi riyal'], ['QAR', 'QR', 'Qatari riyal'], ['ILS', '₪', 'Israeli shekel'],
  ['INR', '₹', 'Indian rupee'], ['PKR', '₨', 'Pakistani rupee'], ['BDT', '৳', 'Bangladeshi taka'],
  ['LKR', 'Rs', 'Sri Lankan rupee'], ['SGD', 'S$', 'Singapore dollar'], ['MYR', 'RM', 'Malaysian ringgit'],
  ['IDR', 'Rp', 'Indonesian rupiah'], ['THB', '฿', 'Thai baht'], ['VND', '₫', 'Vietnamese dong'],
  ['PHP', '₱', 'Philippine peso'], ['HKD', 'HK$', 'Hong Kong dollar'], ['JPY', '¥', 'Japanese yen'],
  ['KRW', '₩', 'South Korean won'], ['CNY', '¥', 'Chinese yuan'], ['TWD', 'NT$', 'Taiwan dollar'],
  ['MXN', 'MX$', 'Mexican peso'], ['BRL', 'R$', 'Brazilian real'], ['ARS', 'AR$', 'Argentine peso'],
  ['CLP', 'CLP$', 'Chilean peso'], ['COP', 'COL$', 'Colombian peso'], ['PEN', 'S/', 'Peruvian sol'],
  ['JMD', 'J$', 'Jamaican dollar'], ['TTD', 'TT$', 'Trinidad and Tobago dollar'],
];
M.COUNTRIES = COUNTRIES.map(([code, name, currency]) => ({ code, name, currency }));
M.CURRENCIES = CURRENCIES.map(([code, symbol, name]) => ({ code, symbol, name }));
M.COUNTRY_BY = Object.fromEntries(M.COUNTRIES.map((c) => [c.code, c]));
M.CURRENCY_BY = Object.fromEntries(M.CURRENCIES.map((c) => [c.code, c]));
/** the country a typed line names, by code or by name; null when nothing in the list matches */
M.countryFrom = (text) => {
  const t = String(text ?? '').trim().toLowerCase();
  if (!t) return null;
  return M.COUNTRIES.find((c) => c.code.toLowerCase() === t || c.name.toLowerCase() === t)
    ?? M.COUNTRIES.find((c) => c.name.toLowerCase().startsWith(t))
    ?? M.COUNTRIES.find((c) => c.name.toLowerCase().includes(t)) ?? null;
};
/** the currency a country usually trades in; GBP where the country is unknown, and the page says it is a suggestion */
M.currencyOfCountry = (code) => M.COUNTRY_BY[String(code ?? '').toUpperCase()]?.currency ?? null;
/** countries whose name or code holds the query, the shortest name first, capped for a list a person can read */
M.searchCountries = (query, limit = 8) => {
  const t = String(query ?? '').trim().toLowerCase();
  if (!t) return M.COUNTRIES.slice(0, limit);
  return M.COUNTRIES.filter((c) => c.name.toLowerCase().includes(t) || c.code.toLowerCase() === t)
    .sort((a, b) => (a.name.toLowerCase().indexOf(t) - b.name.toLowerCase().indexOf(t)) || (a.name.length - b.name.length)).slice(0, limit);
};
/** currencies whose code, symbol or name holds the query */
M.searchCurrencies = (query, limit = 8) => {
  const t = String(query ?? '').trim().toLowerCase();
  if (!t) return M.CURRENCIES.slice(0, limit);
  return M.CURRENCIES.filter((c) => c.code.toLowerCase().includes(t) || c.name.toLowerCase().includes(t) || c.symbol.toLowerCase() === t)
    .sort((a, b) => (a.code.toLowerCase() === t ? -1 : 0) - (b.code.toLowerCase() === t ? -1 : 0) || a.name.length - b.name.length).slice(0, limit);
};

/* Which ways of getting clients belong to which kind of business.

   The engine allocates money to eight modelled channels; the page then names the real
   ways into those channels. A restaurant should never be handed LinkedIn DMs, and a
   B2B platform should not be sent to Mumsnet, so each way is tagged for who it suits
   and the list is filtered before anyone reads it. Nothing is deleted from the picker:
   this only decides what Mercer recommends. */
const B2B_ONLY = new Set(['cold-email', 'cold-call', 'dm-linkedin', 'org-linkedin', 'ads-linkedin', 'com-linkedin', 'com-slack', 'conferences', 'trade-shows', 'resellers', 'white-label', 'webinar', 'case-studies', 'investors', 'studies']);
const CONSUMER_ONLY = new Set(['dm-facebook', 'dm-instagram', 'dm-tiktok', 'org-nextdoor', 'ads-nextdoor', 'com-mumsnet', 'com-instagram', 'ads-tiktok', 'org-tiktok', 'creators', 'sampling', 'marketplaces', 'comparison']);
const LOCAL_ONLY = new Set(['maps', 'local-media', 'sponsor-local', 'canvassing', 'flyers', 'chambers', 'host-meetup', 'org-nextdoor', 'ads-nextdoor']);
/* a handwritten letter costs a few pounds to send, so it only earns its place where one
   sale is worth a good deal more than that, and then it is opened, which email is not */
const WORTH_A_STAMP = (S) => (S.price ?? 0) >= 100;
const ONLINE_ONLY = new Set(['app-stores', 'free-tier', 'free-tool', 'marketplaces', 'geo']);
/** true when this way of getting clients suits the branch the visitor picked */
M.fitsBranch = (id) => {
  const S = window.Mercer.state;
  const key = M.contentKey();
  const sells = S.buyer === 'consumer' || ['hospitality', 'private-healthcare', 'e-commerce'].includes(key);
  const trades = ['b2b-saas', 'professional-services'].includes(key);
  const place = M.SECTOR_BY[S.sector]?.place ?? 'local';
  if (B2B_ONLY.has(id) && sells && !trades) return false;
  if (CONSUMER_ONLY.has(id) && trades) return false;
  if (LOCAL_ONLY.has(id) && place === 'online') return false;
  if (ONLINE_ONLY.has(id) && place === 'local' && key !== 'e-commerce') return false;
  if (id === 'handwritten' && !WORTH_A_STAMP(S)) return false;
  return true;
};
})();
