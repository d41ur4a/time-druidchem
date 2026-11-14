/* Druid Time · Life Compass + Orrery
   Private by design: no network calls, no analytics. All data in localStorage on this device. */
'use strict';

// ===================== CONFIG (easy to change) =====================
// Big rings on the Now face, OUTSIDE → INSIDE (the sun dial is always the centre).
// Available: 'wheel' (Galaxy), 'moon', 'turn', 'life', 'focus'
const RING_ORDER = ['wheel', 'year', 'moon'];
// Small habit rings in the face's 4 corners (top-left, top-right, bottom-left, bottom-right).
// Available: 'focus', 'gym', 'mandarin', 'protein'
const HABIT_RINGS = ['focus', 'gym', 'mandarin', 'protein', 'water'];
// Ring order on the Cosmos (Orrery) face, OUTSIDE → INSIDE.
// Available: 'wheel', 'breath', 'turn', 'moon'
const ORRERY_ORDER = ['wheel', 'breath', 'turn', 'moon'];
// Daily goals (defaults; editable in Life → Settings): focus 3 h, gym 45 min, Mandarin 30 min, protein 120 g.
const APP_NAME = 'Orrery';
const DEFAULT_PLACE = { lat: 18.5204, lon: 73.8567, tz: 5.5, name: 'Pune' };
const MOTTO = "Spend the light well. Rest in the dark. Remember u're orbiting something bigger.";

// ===================== CONSTANTS (same as the Orrery Page) =====================
const YJ = 31557600;               // Julian year, s
const YS = 31558149.7635456;       // sidereal year (365.256363004 d)
const MS = 2360591.5104;           // sidereal month (27.321661 d)
const SD = 86164.0905;             // sidereal day
const WHEEL = 230e6 * YJ;          // working value (estimates 225–250 My)
const BREATH = 70e6 * YJ;          // working value (estimates 52–75 My)
const J2000_S = Date.UTC(2000, 0, 1, 12, 0, 0) / 1000;
const E_TICKS = 1.4413302648e17;   // seconds from Orbit 0 to J2000.0
const BASE = { W: 19.857826086956522, B: 65.24714285714286, T: 4567220434.656004, M: 61058012724.775408, S: 1672773723294.8568 };
const SYN = 29.530588853 * 86400;  // synodic month
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14, 0) / 1000;
// ===================== PALETTES =====================
// Each palette: background, surface (cards), text, muted, accent (+ text on accent), galaxy ring [deep, bright, aurora tail?],
// moon ring, sun dial [morning, afternoon, evening], the 5 habit rings, and 3 soft background glows.
const PALETTES = {
  aurora: { name: 'Nebula Aurora', bg: '#07040F', surface: 'rgba(28,20,48,0.58)', text: '#F4F1FF', muted: '#A39CC4', accent: '#7B2FF7', accentInk: '#FFFFFF',
    lifeStrand: ['#12A88C', '#2EF2B0'], workStrand: ['#7B2FF7', '#2E8BFF'],
    sunRing: ['#B14BFF', '#FF7AD9'], galaxy: ['#7B2FF7', '#2E8BFF', '#2EF2B0'], moon: ['#4F7BFF', '#9FE8FF'], sun: ['#FFC9A8', '#FF7AD9', '#B14BFF'],
    habits: { focus: '#2EF2B0', gym: '#FF5FD2', mandarin: '#FFB347', protein: '#B48CFF', water: '#38E8FF' },
    glow: ['rgba(123,47,247,0.20)', 'rgba(0,198,255,0.11)', 'rgba(46,242,176,0.08)'], aurora: true },
  cosmic: { name: 'Cosmic Blue', bg: '#000000', surface: 'rgba(28,28,30,0.62)', text: '#FFFFFF', muted: '#8E8E93', accent: '#0A84FF', accentInk: '#FFFFFF',
    lifeStrand: ['#1F9E47', '#30D158'], workStrand: ['#0040DD', '#0A84FF'],
    sunRing: ['#B76E00', '#FFCC4D'], galaxy: ['#0040DD', '#0A84FF'], moon: ['#0071A4', '#64D2FF'], sun: ['#FFD60A', '#FF9F0A', '#FF6482'],
    habits: { focus: '#30D158', gym: '#FF6482', mandarin: '#FF9F0A', protein: '#BF5AF2', water: '#5EE0D8' },
    glow: ['rgba(255,159,10,0.075)', 'rgba(94,92,230,0.06)', 'rgba(0,0,0,0)'] },
  druid: { name: 'Druid Green', bg: '#040A07', surface: 'rgba(18,34,25,0.60)', text: '#F1F5EC', muted: '#98A89B', accent: '#2FBF71', accentInk: '#04140B',
    lifeStrand: ['#2A8C55', '#3DDC84'], workStrand: ['#9C7A1E', '#E8C766'],
    sunRing: ['#8F6A12', '#F0C75E'], galaxy: ['#0E6B45', '#2FBF71'], moon: ['#8C7A3A', '#E8C766'], sun: ['#F5D76E', '#D4A017', '#C76B3A'],
    habits: { focus: '#3DDC84', gym: '#E07A5F', mandarin: '#E8C766', protein: '#B39DDB', water: '#5ED3C4' },
    glow: ['rgba(232,199,102,0.09)', 'rgba(47,191,113,0.08)', 'rgba(0,0,0,0)'] },
  ember: { name: 'Sunset Ember', bg: '#0C0505', surface: 'rgba(40,20,20,0.60)', text: '#FFF3EE', muted: '#B39A94', accent: '#FF6A3D', accentInk: '#1A0602',
    lifeStrand: ['#C9741E', '#FFB13D'], workStrand: ['#B0124C', '#FF4F7B'],
    sunRing: ['#B8400B', '#FFB13D'], galaxy: ['#C2185B', '#FF4F7B'], moon: ['#E0661F', '#FFC07A'], sun: ['#FFD36E', '#FF8A3D', '#E8457A'],
    habits: { focus: '#FFB13D', gym: '#FF4F7B', mandarin: '#FFD36E', protein: '#D46BFF', water: '#5ED3E0' },
    glow: ['rgba(255,106,61,0.13)', 'rgba(232,69,122,0.08)', 'rgba(0,0,0,0)'] },
  violet: { name: 'Nebula Violet', bg: '#08050F', surface: 'rgba(30,22,46,0.60)', text: '#F6F2FF', muted: '#A49BBE', accent: '#9D6BFF', accentInk: '#12052A',
    lifeStrand: ['#2FA57F', '#7DF0C5'], workStrand: ['#5B2DCC', '#9D6BFF'],
    sunRing: ['#A86A16', '#FFD27A'], galaxy: ['#5B2DCC', '#9D6BFF'], moon: ['#B03FCB', '#F08BFF'], sun: ['#FFD27A', '#FF9DCB', '#B57BFF'],
    habits: { focus: '#7DF0C5', gym: '#FF7AB6', mandarin: '#FFC27A', protein: '#C7A2FF', water: '#7AD7FF' },
    glow: ['rgba(157,107,255,0.14)', 'rgba(240,139,255,0.07)', 'rgba(0,0,0,0)'] },
  mono: { name: 'Monochrome', bg: '#000000', surface: 'rgba(28,28,30,0.66)', text: '#FFFFFF', muted: '#98989D', accent: '#E5E5EA', accentInk: '#000000',
    lifeStrand: ['#8E8E93', '#F2F2F7'], workStrand: ['#48484A', '#AEAEB2'],
    sunRing: ['#5A5A5E', '#D1D1D6'], galaxy: ['#8E8E93', '#F2F2F7'], moon: ['#636366', '#C7C7CC'], sun: ['#FFFFFF', '#AEAEB2', '#7C7C80'],
    habits: { focus: '#F2F2F7', gym: '#D1D1D6', mandarin: '#AEAEB2', protein: '#C7C7CC', water: '#E5E5EA' },
    glow: ['rgba(255,255,255,0.04)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)'] },
  ocean: { name: 'Ocean Teal', bg: '#02090C', surface: 'rgba(14,32,38,0.60)', text: '#EEFAFB', muted: '#8FA9AE', accent: '#14B8C4', accentInk: '#01161A',
    lifeStrand: ['#0F9C8C', '#7FE3D0'], workStrand: ['#2E6BFF', '#7FB2FF'],
    sunRing: ['#A47A0A', '#FFE29A'], galaxy: ['#0B5F7A', '#14B8C4'], moon: ['#2E6BFF', '#7FB2FF'], sun: ['#FFE29A', '#7FE3D0', '#3FA7FF'],
    habits: { focus: '#4ADE80', gym: '#FF7A90', mandarin: '#FFC857', protein: '#A78BFA', water: '#22D3EE' },
    glow: ['rgba(20,184,196,0.12)', 'rgba(46,107,255,0.07)', 'rgba(0,0,0,0)'] },
};
const DEFAULT_PALETTE = 'aurora';
const CUSTOM_KEYS = [['accent', 'Accent'], ['galaxy', 'Galaxy ring'], ['sunRing', 'Sun ring'], ['lifeStrand', 'Life strand'], ['workStrand', 'Work strand'], ['moon', 'Moon ring'], ['sun', 'Sun dial'], ['focus', 'Satisfying'], ['gym', 'Gym'], ['mandarin', '中文'], ['protein', 'Protein'], ['water', 'Water']];
const COL = { life: '#2EF2B0', lifeA: '#12A88C', work: '#2E8BFF', workA: '#7B2FF7', water: '#5EE0D8', bg: '#000000', sunB: '#FF9F0A', sunC: '#FF6482',  green: '#30D158', cyan: '#64D2FF', yellow: '#FFD60A', purple: '#BF5AF2', blue: '#0A84FF', orange: '#FF9F0A', pink: '#FF6482', red: '#FF375F', indigo: '#5E5CE6' };
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RULES = [
  'One glance, one answer. The face tells u what to do right now, nothing more.',
  'Never guilt. Rings never turn red. Quiet days just fade.',
  'The sun is the boss. Work with daylight, not against it.',
  'Sunset is a boundary. Serious work stops there.',
  'Mark firsts. New things make time feel longer when u look back.',
  'Review at every cycle: each day, each Moon, each Turn.',
  'Zoom out before big decisions. Take a Deep Look first.',
  'Keep it beside the normal calendar, never instead of it.',
  'Keep data private. It lives on this device only.',
  'Simplify every year. On Turnday, remove one feature.',
];

// ===================== HELPERS =====================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmt = (n) => Math.floor(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function hm(min) { const m = ((Math.floor(min) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function dur(min) { const m = Math.max(0, Math.round(min)); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; }
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;

// NOAA solar calculator (spreadsheet version). Minutes after local midnight.
function sunTimes(y, m, d, lat, lon, tz) {
  const jd = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5 - tz / 24;
  const T = (jd - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) + Math.sin(rad(3 * M)) * 0.000289;
  const om = 125.04 - 1934.136 * T;
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(om));
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(om));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam))));
  const yv = Math.tan(rad(eps / 2)) ** 2;
  const eot = 4 * deg(yv * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * yv * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * yv * yv * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
  const noon = 720 - 4 * lon - eot + tz * 60;
  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(dec))) - Math.tan(rad(lat)) * Math.tan(rad(dec));
  if (cosH > 1) return { rise: null, noon, set: null, polar: 'night' };
  if (cosH < -1) return { rise: null, noon, set: null, polar: 'day' };
  const ha = deg(Math.acos(cosH));
  return { rise: noon - 4 * ha, noon, set: noon + 4 * ha, polar: null };
}
function phaseName(ageDays) {
  const p = ageDays / (SYN / 86400);
  if (p < 0.0339 || p > 0.9661) return 'New moon';
  if (p < 0.2161) return 'Waxing crescent';
  if (p < 0.2839) return 'First quarter';
  if (p < 0.4661) return 'Waxing gibbous';
  if (p < 0.5339) return 'Full moon';
  if (p < 0.7161) return 'Waning gibbous';
  if (p < 0.7839) return 'Last quarter';
  return 'Waning crescent';
}
function moonGlyph(cx, cy, r, p, lit = '#F2F2F7', dark = '#1C1C1E', edge = '#000') {
  const rx = Math.abs(Math.cos(2 * Math.PI * p)) * r;
  const waxing = p < 0.5, crescent = (p % 0.5) < 0.25;
  const outer = waxing ? 1 : 0, term = crescent ? 0 : 1;
  const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${term} ${cx} ${cy - r} Z`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dark}" stroke="${edge}" stroke-width="1"/><path d="${d}" fill="${lit}"/>`;
}

// ===================== STORE =====================
const KEY = 'druid-time-v1';
const blankDay = () => ({ focus: 0, made: false, connected: false, learned: false, journal: '', wake: null, gym: false, gymMin: 0, gymNote: '', mandarin: 0, protein: 0, meals: [], sugar: null, brushed: false, morning: {}, water: 0, chores: {} });
// Day Shape: a gentle default rhythm. Each block hangs off an anchor (ur wake time, sunset, or bedtime) by an offset in minutes.
const DEFAULT_SHAPE = [
  { id: 'b1', kind: 'wake', name: 'Wake & light', anchor: 'wake', off: 0, len: 45 },
  { id: 'b2', kind: 'work', name: 'Satisfying work', anchor: 'wake', off: 60, len: 150 },
  { id: 'b3', kind: 'food', name: 'Refuel', anchor: 'wake', off: 210, len: 45 },
  { id: 'b4', kind: 'errands', name: 'Calls, errands, people', anchor: 'wake', off: 270, len: 120 },
  { id: 'b5', kind: 'work', name: 'Satisfying work, round 2', anchor: 'wake', off: 420, len: 60 },
  { id: 'b6', kind: 'gym', name: 'Gym', anchor: 'sunset', off: -150, len: 60 },
  { id: 'b7', kind: 'mandarin', name: '中文', anchor: 'sunset', off: -75, len: 30 },
  { id: 'b8', kind: 'review', name: 'Sunset review', anchor: 'sunset', off: 30, len: 20 },
  { id: 'b9', kind: 'sleep', name: 'Teeth & sleep', anchor: 'bed', off: -30, len: 30 },
];
// Chores on the sun dial. time = minutes after midnight. repeat: daily | weekdays (days: 0=Sun..6) | every (n days from start) | weekly (wd)
// cat: life | work | both (both = a rung bridging the two strands). len: optional minutes.
// v14: new users start with a blank calendar. These are the chores that v8–v13 seeded, kept only so the
// one-time migration can recognise (and remove) untouched copies of them.
const SEED_CHORES = [
  { id: 'c-water', icon: '💧', name: 'Refill water bottle', time: 630, repeat: 'daily', cat: 'life' },
  { id: 'c-gym', icon: '🏋️', name: 'Gym', time: 960, repeat: 'weekdays', days: [1, 2, 3, 4, 5, 6], cat: 'life', len: 45 },
  { id: 'c-laundry', icon: '🧺', name: 'Laundry', time: 660, repeat: 'every', n: 3, start: '', cat: 'life' },
  { id: 'c-tidy', icon: '🧹', name: 'Tidy room', time: 1260, repeat: 'daily', cat: 'life' },
  // added in v9 (DNA): life care + meals, work admin + systems, one deletable "both" example
  { id: 'c-skin', icon: '🧴', name: 'Morning skincare', time: 435, repeat: 'daily', cat: 'life', len: 10 },
  { id: 'c-breakfast', icon: '🍳', name: 'Breakfast', time: 510, repeat: 'daily', cat: 'life', len: 30 },
  { id: 'c-lunch', icon: '🍲', name: 'Lunch', time: 810, repeat: 'daily', cat: 'life', len: 40 },
  { id: 'c-dinner', icon: '🍽️', name: 'Dinner', time: 1200, repeat: 'daily', cat: 'life', len: 45 },
  { id: 'c-inbox', icon: '📥', name: 'Inbox & admin', time: 600, repeat: 'daily', cat: 'work', len: 30 },
  { id: 'c-systems', icon: '⚙️', name: 'Automations & systems', time: 900, repeat: 'daily', cat: 'work', len: 60 },
  { id: 'c-walkthink', icon: '🚶', name: 'Walk & think it through (example, delete me)', time: 1110, repeat: 'daily', cat: 'both', len: 20 },
];
const DEFAULT_CHORES = [];
const SEED_V = 3;
// A stored chore is an untouched seed when its id (or, failing that, its name) is a seed's and nothing the user can edit differs.
const seedTwin = (c) => {
  const t = SEED_CHORES.find((x) => x.id === c.id) || SEED_CHORES.find((x) => x.name === c.name && !/^c\d+$/.test(String(c.id || '')));
  if (!t || c.created) return false;
  const lenOk = (+c.len || 0) === (+t.len || 0) || (t.id === 'c-gym' && !+c.len);
  const daysOk = (t.days || []).join() === (Array.isArray(c.days) ? c.days : t.days || []).join();
  return c.name === t.name && c.icon === t.icon && +c.time === t.time && (c.repeat || 'daily') === t.repeat && catOf(c) === t.cat && lenOk && daysOk && (t.repeat !== 'every' || (+c.n || 0) === t.n) && !c.date;
};
const CATS = [['life', 'Life'], ['work', 'Work'], ['both', 'Both']];
const catOf = (c) => (c && (c.cat === 'work' || c.cat === 'both') ? c.cat : 'life');
const catCol = (cat) => (cat === 'work' ? COL.work : cat === 'both' ? mixHex(COL.life, COL.work, 0.5) : COL.life);
const CHORE_ICONS = ['💧', '🏋️', '🧺', '🧹', '🦷', '🧴', '🍳', '🍲', '📥', '⚙️', '🤖', '🎧', '🛒', '🧴', '💊', '🪴', '🐕', '📚', '🧘', '🚿', '🗑️', '📞', '💻', '🧾', '🍽️', '🛏️', '🚶', '☀️', '🌙', '✉️', '🧪', '🎸', '🧽', '🚗', '✨'];
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_MORNING = ['Water', 'Sunlight', 'Brush teeth', 'Protein breakfast', 'Open Orrery'];
const DEFAULT_PEOPLE = [
  { id: 'p-mom', name: 'Mom', every: 7, last: '', bday: '' },
  { id: 'p-dad', name: 'Dad', every: 7, last: '', bday: '' },
  { id: 'p-gf', name: 'Girlfriend', every: 3, last: '', bday: '' },
  { id: 'p-friend', name: 'Friend', every: 30, last: '', bday: '' },
];
const emptyStore = () => ({ v: 2, name: 'Lav', birth: '', lifeYears: 80, goalMin: 180, proteinGoal: 120, mandarinGoal: 30, gymGoal: 45, waterGoal: 2500, palette: DEFAULT_PALETTE, custom: {}, quiet: true, reminders: { sunrise: false, review: false, habits: false, teeth: false, birthdays: false }, notified: {}, days: {}, intentions: {}, goals: [], firsts: [], people: DEFAULT_PEOPLE.map((p) => ({ ...p })), shape: DEFAULT_SHAPE.map((b) => ({ ...b })), morningList: [...DEFAULT_MORNING], chores: [], teethOn: false, orbit: false, insp: true, mini: false, appearance: 'dark', seedV: SEED_V, dreams: [], timer: null, place: { ...DEFAULT_PLACE } });
function sanitize(o) {
  if (!o || typeof o !== 'object') return null;
  const b = emptyStore();
  const s = { ...b, ...o };
  s.days = o.days && typeof o.days === 'object' ? o.days : {};
  for (const k of Object.keys(s.days)) s.days[k] = { ...blankDay(), ...s.days[k] };
  s.intentions = o.intentions && typeof o.intentions === 'object' ? o.intentions : {};
  s.goals = Array.isArray(o.goals) ? o.goals.filter((g) => g && String(g.name || '').trim()).slice(0, 3).map((g) => ({ name: String(g.name), done: String(g.done || ''), step: String(g.step || ''), pct: +g.pct || 0 })) : [];
  s.firsts = Array.isArray(o.firsts) ? o.firsts : [];
  s.people = Array.isArray(o.people) ? o.people.map((p) => ({ bday: '', last: '', every: 7, ...p })) : b.people;
  if ((o.v || 1) < 2 && !s.people.length) s.people = b.people;
  s.shape = Array.isArray(o.shape) ? o.shape.filter((x) => x && x.id) : b.shape;
  s.morningList = Array.isArray(o.morningList) ? o.morningList.map(String) : b.morningList;
  s.chores = Array.isArray(o.chores) ? o.chores.filter((c) => c && c.id).map((c) => ({ icon: '✨', name: 'Chore', time: 720, repeat: 'daily', ...c, time: clamp(Math.round(+c.time || 0), 0, 1439), cat: catOf(c), len: clamp(Math.round(+c.len || 0), 0, 600) })) : b.chores;
  if (Array.isArray(o.chores) && (+o.seedV || 1) < SEED_V) { // v14 migration (once): drop the untouched sample chores, keep anything created or edited
    const gone = new Set();
    s.chores = s.chores.filter((c) => { const raw = o.chores.find((x) => x && x.id === c.id) || c; if (seedTwin(raw)) { gone.add(c.id); return false; } return true; });
    if (gone.size) for (const k of Object.keys(s.days)) { const ch = s.days[k].chores; if (ch && typeof ch === 'object') for (const id of gone) delete ch[id]; }
  }
  s.teethOn = !!o.teethOn; // v14: the built-in bedtime teeth marker is opt-in (Settings → Edit chores)
  s.seedV = SEED_V;
  s.orbit = !!o.orbit;
  s.quiet = o.quiet === undefined ? true : !!o.quiet;
  s.insp = o.insp === undefined ? true : !!o.insp;
  s.mini = !!o.mini;
  s.appearance = ['dark', 'system', 'light'].includes(o.appearance) ? o.appearance : 'dark';
  s.dreams = Array.isArray(o.dreams) ? o.dreams.filter((d) => d && d.id && (String(d.text || '').trim() || String(d.title || '').trim())).map((d) => ({ id: String(d.id), date: String(d.date || ''), title: String(d.title || ''), text: String(d.text || ''), vivid: clamp(parseInt(d.vivid, 10) || 3, 1, 5), tags: Array.isArray(d.tags) ? d.tags.map(String) : [], lucid: !!d.lucid, at: +d.at || 0 })) : [];
  s.chores.forEach((c) => { if (c.repeat === 'every' && !/^\d{4}-\d{2}-\d{2}$/.test(c.start || '')) c.start = new Date().toISOString().slice(0, 10); });
  s.name = typeof o.name === 'string' ? o.name : b.name;
  s.palette = PALETTES[o.palette] || o.palette === 'custom' ? o.palette : DEFAULT_PALETTE;
  s.custom = o.custom && typeof o.custom === 'object' ? Object.fromEntries(Object.entries(o.custom).filter(([, v]) => /^#[0-9a-fA-F]{6}$/.test(v))) : {};
  s.timer = typeof o.timer === 'number' ? o.timer : null;
  s.place = o.place && typeof o.place.lat === 'number' ? o.place : { ...DEFAULT_PLACE };
  ['lifeYears', 'goalMin'].forEach((k) => { if (!(typeof s[k] === 'number' && s[k] > 0)) s[k] = b[k]; });
  ['proteinGoal', 'mandarinGoal', 'gymGoal', 'waterGoal'].forEach((k) => { if (!(typeof s[k] === 'number' && s[k] > 0)) s[k] = b[k]; });
  s.reminders = { ...b.reminders, ...(o.reminders || {}) };
  s.notified = o.notified && typeof o.notified === 'object' ? o.notified : {};
  s.v = 2;
  return s;
}
let store = emptyStore(), canSave = true, lastSaved = null;
function load() {
  try { const raw = localStorage.getItem(KEY); store = raw ? (sanitize(JSON.parse(raw)) || emptyStore()) : emptyStore(); }
  catch (e) { canSave = false; store = emptyStore(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); lastSaved = Date.now(); canSave = true; }
  catch (e) { canSave = false; }
}
const tz = () => store.place.tz;
const dkey = (ms) => new Date(ms + tz() * 3600000).toISOString().slice(0, 10);
const kms = (k) => Date.parse(k + 'T00:00:00Z') - tz() * 3600000;
function dayOf(k) { if (!store.days[k]) store.days[k] = blankDay(); return store.days[k]; }
const checksOf = (d) => (d.made ? 1 : 0) + (d.connected ? 1 : 0) + (d.learned ? 1 : 0);

// ===================== COMPUTE (everything the UI needs, once per tick) =====================
function compute(now) {
  const S = { now };
  const P = store.place;
  S.today = dkey(now);
  S.td = store.days[S.today] || blankDay();
  const local = new Date(now + P.tz * 3600000);
  S.local = local;
  S.sun = sunTimes(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), P.lat, P.lon, P.tz);
  S.nowMin = local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60;
  S.dreamToday = (store.dreams || []).some((d) => d.date >= addDays(S.today, -1));
  S.hhmm = hm(S.nowMin); S.ss = String(local.getUTCSeconds()).padStart(2, '0');
  S.rise = S.sun.rise ?? (S.sun.polar === 'day' ? 0 : 720);
  S.set = S.sun.set ?? (S.sun.polar === 'day' ? 1439.9 : 720);
  S.wakeMin = S.td.wake != null ? S.td.wake : S.rise;
  S.wakeLogged = S.td.wake != null;
  S.mEnd = Math.min(Math.max(S.wakeMin + 240, S.rise + 60), S.set - 90);
  S.eStart = Math.max(S.set - 90, S.mEnd);
  S.isDay = S.sun.polar === 'day' || (S.sun.polar === null && S.nowMin >= S.rise && S.nowMin < S.set);
  S.zone = !S.isDay ? 'rest' : S.nowMin < S.mEnd ? 'morning' : S.nowMin < S.eStart ? 'afternoon' : 'evening';
  S.zoneName = { morning: 'Clear morning', afternoon: 'Afternoon dip', evening: 'Evening wind-down', rest: 'Rest mode' }[S.zone];
  S.zoneDo = { morning: 'The light is young. Forge the hard thing now.', afternoon: 'The sun leans west. Calls, errands, iron.', evening: 'Gather ur tools. Sunset draws the line.', rest: 'The sun sleeps. So does serious work. One line, then rest.' }[S.zone];
  if (S.sun.polar === 'night') { S.sunLine = 'Polar night · no sunrise today'; }
  else if (S.sun.polar === 'day') { S.sunLine = 'Midnight sun · no sunset today'; }
  else if (S.nowMin < S.rise) S.sunLine = 'Sunrise in ' + dur(S.rise - S.nowMin);
  else if (S.nowMin < S.set) S.sunLine = 'Sunset in ' + dur(S.set - S.nowMin);
  else S.sunLine = 'Sunrise in about ' + dur(S.rise + 1440 - S.nowMin);

  const t = now / 1000 - J2000_S;
  const lay = (k, per) => { const v = BASE[k] + t / per; return [Math.floor(v), v - Math.floor(v)]; };
  [S.wn, S.wf] = lay('W', WHEEL); [S.bn, S.bf] = lay('B', BREATH); [S.tn, S.tf] = lay('T', YS); [S.mn, S.mf] = lay('M', MS); [S.sn, S.sf] = lay('S', SD);
  S.ticks = E_TICKS + t;
  S.turnDay = Math.floor(S.tf * YS / 86400);
  S.notation = `W${S.wn}:${(S.wf * 100).toFixed(2)} · B${S.bn}:${(S.bf * 100).toFixed(2)} · ${String(S.tn).slice(-3)}·d${S.turnDay} · S${(S.sf * 100).toFixed(1)}`;
  S.moonAge = (((now / 1000 - NEW_MOON_REF) % SYN) + SYN) % SYN;
  S.moonDays = S.moonAge / 86400; S.moonP = S.moonAge / SYN;
  S.illum = (1 - Math.cos(2 * Math.PI * S.moonP)) / 2;
  S.moonStage = S.moonDays < 1.85 || S.moonDays > 27.68 ? 'new' : S.moonDays < 13.77 ? 'waxing' : S.moonDays < 15.77 ? 'full' : 'waning';
  S.moonPrompt = { new: "Set this Moon's intention", waxing: 'Build', full: "Mid-review: how's it going?", waning: 'Finish and rest' }[S.moonStage];
  S.moonKey = dkey(now - S.moonAge * 1000);
  S.turnStartMs = (J2000_S + (S.tn - BASE.T) * YS) * 1000;
  S.turnStartKey = dkey(S.turnStartMs); S.nextTurnday = dkey(S.turnStartMs + YS * 1000);
  S.isTurnday = S.today === S.turnStartKey;
  { const y = local.getUTCFullYear(), y0 = Date.UTC(y, 0, 1), y1 = Date.UTC(y + 1, 0, 1), lm = local.getTime();
    S.yearDays = Math.round((y1 - y0) / 86400000); S.yearDay = Math.floor((lm - y0) / 86400000) + 1; S.yearF = (lm - y0) / (y1 - y0); }

  const bOk = /^\d{4}-\d{2}-\d{2}$/.test(store.birth) && !isNaN(Date.parse(store.birth + 'T00:00:00Z'));
  S.birthOk = bOk;
  S.ageY = bOk ? (now - kms(store.birth)) / (YJ * 1000) : 0;
  S.lifeF = bOk ? clamp(S.ageY / store.lifeYears, 0, 1) : 0;
  S.summers = bOk ? Math.max(0, Math.floor(store.lifeYears - S.ageY)) : 0;

  S.running = store.timer !== null;
  S.runMin = S.running ? Math.max(0, (now - store.timer) / 60000) : 0;
  S.focusMin = S.td.focus + S.runMin;
  S.focusF = clamp(S.focusMin / store.goalMin, 0, 1);
  S.gymF = clamp((S.td.gymMin || 0) / store.gymGoal, 0, 1);
  S.manF = clamp((S.td.mandarin || 0) / store.mandarinGoal, 0, 1);
  S.proF = clamp((S.td.protein || 0) / store.proteinGoal, 0, 1);
  S.waterF = clamp((S.td.water || 0) / store.waterGoal, 0, 1);
  S.bedEarly = S.wakeMin - 9 * 60; S.bedLate = S.wakeMin - 7 * 60; S.bed = (S.wakeMin - 8 * 60 + 1440) % 1440;
  S.anyLogged = S.td.focus > 0 || S.running || S.td.gymMin > 0 || S.td.mandarin > 0 || S.td.meals.length > 0 || S.td.water > 0 || checksOf(S.td) > 0;
  S.noon = S.sun.noon != null ? S.sun.noon : 720;
  // night belongs to the day that's ending: before noon without a logged wake, it's still "last night"
  S.nightKey = S.nowMin < 720 && !S.wakeLogged ? dkey(now - 12 * 3600000) : S.today;
  S.nd = store.days[S.nightKey] || blankDay();
  S.brushed = !!S.nd.brushed;
  computeShape(S);
  computeVoice(S);
  computeBirthdays(S, now);

  // reviews
  const all = Object.entries(store.days);
  S.moonStartKey = dkey(now - SYN * 1000);
  const md = all.filter(([k]) => k >= S.moonStartKey && k <= S.today);
  S.mr = {
    n: md.length,
    focus: md.reduce((a, [, d]) => a + d.focus, 0),
    checks: md.reduce((a, [, d]) => a + checksOf(d), 0),
    journal: md.filter(([, d]) => (d.journal || '').trim()).length,
    gym: md.filter(([, d]) => d.gym).length,
    mandarin: md.reduce((a, [, d]) => a + (d.mandarin || 0), 0),
    protein: md.filter(([, d]) => d.protein > 0),
    waterDays: md.filter(([, d]) => (d.water || 0) >= store.waterGoal).length,
    waterAvg: (() => { const w = md.filter(([, d]) => d.water > 0); return w.length ? w.reduce((a, [, d]) => a + d.water, 0) / w.length : 0; })(),
    sugarHigh: md.filter(([, d]) => d.sugar === 'high').length,
    firsts: store.firsts.filter((f) => f.date >= S.moonStartKey).length,
  };
  S.turnDays = all.filter(([k]) => k >= S.turnStartKey && k <= S.today);
  const wd = WEEKDAYS.map(() => ({ s: 0, n: 0 }));
  S.turnDays.forEach(([k, d]) => { const w = new Date(k + 'T12:00:00Z').getUTCDay(); wd[w].s += d.focus; wd[w].n++; });
  S.bestWd = -1; S.bestAvg = 0;
  wd.forEach((b, i) => { if (b.n && b.s / b.n > S.bestAvg) { S.bestAvg = b.s / b.n; S.bestWd = i; } });
  const mt = {};
  S.turnDays.forEach(([k, d]) => { const idx = Math.floor((kms(k) + 43200000 - NEW_MOON_REF * 1000) / (SYN * 1000)); const sk = dkey(NEW_MOON_REF * 1000 + idx * SYN * 1000); mt[sk] = (mt[sk] || 0) + d.focus; });
  S.heavy = Object.entries(mt).sort((a, b) => b[1] - a[1])[0] || null;
  S.alive = S.turnDays.filter(([, d]) => checksOf(d) === 3).map(([k]) => k).sort().reverse();
  S.weekFirsts = store.firsts.filter((f) => f.date > dkey(now - 7 * 86400000)).length;
  S.turnDots = S.turnDays.map(([k, d]) => ({ k, f: (kms(k) + 43200000 - S.turnStartMs) / (YS * 1000), op: (0.25 + checksOf(d) * 0.25) * Math.max(0.35, 1 - ((kms(S.today) - kms(k)) / 86400000) / 120) }));
  return S;
}

// ===================== PALETTE APPLY =====================
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h, k) => '#' + hexRgb(h).map((v) => Math.round(clamp(v * k, 0, 255)).toString(16).padStart(2, '0')).join('');
const lum = (h) => { const [r, g, b] = hexRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
function resolvePalette(id, custom) {
  if (id !== 'custom') return PALETTES[id] || PALETTES[DEFAULT_PALETTE];
  const base = PALETTES[DEFAULT_PALETTE], c = custom || {};
  const accent = c.accent || base.accent;
  return { ...base, name: 'Custom', aurora: false, accent, accentInk: lum(accent) > 0.4 ? '#000000' : '#FFFFFF',
    galaxy: c.galaxy ? [shade(c.galaxy, 0.55), c.galaxy] : base.galaxy.slice(0, 2), sunRing: c.sunRing ? [shade(c.sunRing, 0.6), c.sunRing] : base.sunRing, lifeStrand: c.lifeStrand ? [shade(c.lifeStrand, 0.6), c.lifeStrand] : base.lifeStrand, workStrand: c.workStrand ? [shade(c.workStrand, 0.6), c.workStrand] : base.workStrand, moon: c.moon ? [shade(c.moon, 0.6), c.moon] : base.moon,
    sun: c.sun ? [c.sun, shade(c.sun, 0.8), shade(c.sun, 0.6)] : base.sun,
    habits: Object.fromEntries(Object.entries(base.habits).map(([k, v]) => [k, c[k] || v])) };
}
let PAL = PALETTES[DEFAULT_PALETTE];
let choreVer = 0; // bumps whenever chores or their ticks change, so the dial redraws
const isLight = () => store.appearance === 'light' || (store.appearance === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
function applyPalette() {
  document.body.classList.toggle('quiet', !!store.quiet);
  const P = resolvePalette(store.palette, store.custom); PAL = P;
  Object.assign(COL, { bg: P.bg, blue: P.accent, green: P.habits.focus, pink: P.habits.gym, orange: P.habits.mandarin, purple: P.habits.protein, water: P.habits.water,
    cyan: P.moon[1], yellow: P.sun[0], sunB: P.sun[1], sunC: P.sun[2], red: P.galaxy[1], lifeA: P.lifeStrand[0], life: P.lifeStrand[1], workA: P.workStrand[0], work: P.workStrand[1] });
  RINGS.wheel.a = P.galaxy[0]; RINGS.wheel.b = P.galaxy[1]; RINGS.wheel.c = P.galaxy[2] || null;
  RINGS.moon.a = P.moon[0]; RINGS.moon.b = P.moon[1];
  RINGS.year.a = P.sunRing[0]; RINGS.year.b = P.sunRing[1];
  RINGS.focus.a = shade(P.habits.focus, 0.6); RINGS.focus.b = P.habits.focus;
  RINGS.turn.a = P.sun[1]; RINGS.turn.b = P.sun[0];
  RINGS.life.a = shade(P.habits.protein, 0.6); RINGS.life.b = P.habits.protein;
  RINGS.breath.a = shade(P.habits.focus, 0.55); RINGS.breath.b = shade(P.habits.focus, 0.9);
  Object.keys(RINGS).forEach((k) => { ORRERY_RINGS[k] = { ...RINGS[k], ...(k === 'moon' ? { f: (S) => S.mf } : {}) }; });
  Object.entries(P.habits).forEach(([k, v]) => { if (HABITS[k]) HABITS[k].col = v; });
  Object.assign(KIND_COL, { wake: P.sun[0], work: P.habits.focus, food: P.habits.protein, errands: P.moon[1], gym: P.habits.gym, mandarin: P.habits.mandarin, review: P.sun[2] });
  const R = document.documentElement.style, [r, g, b] = hexRgb(P.bg);
  const vars = { '--bg': P.bg, '--glass': P.surface, '--ink': P.text, '--muted': P.muted, '--accent': P.accent, '--accent-ink': P.accentInk,
    '--green': P.habits.focus, '--pink': P.habits.gym, '--orange': P.habits.mandarin, '--purple': P.habits.protein, '--water': P.habits.water,
    '--life': P.lifeStrand[1], '--work': P.workStrand[1], '--cyan': P.moon[1], '--blue': P.accent, '--yellow': P.sun[0], '--glow1': P.glow[0], '--glow2': P.glow[1], '--glow3': P.glow[2],
    '--bar': `rgba(${Math.round(r * 0.6 + 12)},${Math.round(g * 0.6 + 12)},${Math.round(b * 0.6 + 14)},0.74)`, '--sheet': `rgba(${Math.round(r * 0.5 + 26)},${Math.round(g * 0.5 + 26)},${Math.round(b * 0.5 + 30)},0.94)` };
  const light = isLight(); document.body.classList.toggle('light', light);
  if (light) Object.assign(vars, { '--bg': '#F5F5F7', '--glass': 'rgba(255,255,255,0.72)', '--ink': '#1D1D1F', '--muted': '#6E6E73', '--dim': '#8E8E93', '--hair': 'rgba(0,0,0,0.10)', '--bar': 'rgba(246,246,248,0.78)', '--sheet': 'rgba(250,250,252,0.95)', '--glow1': 'rgba(123,47,247,0.07)', '--glow2': 'rgba(0,198,255,0.06)', '--glow3': 'rgba(46,242,176,0.05)' });
  else Object.assign(vars, { '--dim': '#636366', '--hair': 'rgba(255,255,255,0.09)' });
  if (light) COL.bg = '#F5F5F7';
  Object.entries(vars).forEach(([k, v]) => R.setProperty(k, v));
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', light ? '#F5F5F7' : P.bg);
}
function swatchSVG(P) {
  const arc = (r, f, col, w) => { const C = 2 * Math.PI * r; return `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${w}"/><circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 40)"/>`; };
  const gid = 'sw' + Math.random().toString(36).slice(2, 7);
  const stops = (P.galaxy[2] ? [P.galaxy[0], P.galaxy[1], P.galaxy[2]] : [P.galaxy[0], P.galaxy[1]]).map((c, i, a) => `<stop offset="${(i / (a.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
  const C1 = 2 * Math.PI * 33;
  const wave = (ph, col) => `<path d="${Array.from({ length: 17 }, (_, i) => `${i ? 'L' : 'M'}${(8 + i * 4).toFixed(1)} ${(78 + 3.2 * Math.sin(i * 0.78 + ph)).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 80 96" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect width="80" height="96" rx="14" fill="${P.bg}"/>
    <circle cx="40" cy="40" r="33" fill="none" stroke="${P.galaxy[1]}" stroke-opacity=".18" stroke-width="6"/><circle cx="40" cy="40" r="33" fill="none" stroke="url(#${gid})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(0.78 * C1).toFixed(1)} ${C1.toFixed(1)}" transform="rotate(-90 40 40)"/>
    ${arc(25.5, 0.87, P.sunRing[1], 6)}${arc(18, 0.45, P.moon[1], 6)}<path d="M 29 40 A 11 11 0 0 1 51 40" fill="none" stroke="${P.sun[0]}" stroke-width="3.5" stroke-linecap="round"/><path d="M 51 40 A 11 11 0 0 1 47.8 47.8" fill="none" stroke="${P.sun[2]}" stroke-width="3.5" stroke-linecap="round"/>
    ${P.lifeStrand ? wave(0, P.lifeStrand[1]) + wave(Math.PI, P.workStrand[1]) : ''}${Object.values(P.habits).map((c, i) => `<circle cx="${14 + i * 13}" cy="89" r="3.8" fill="${c}"/>`).join('')}</svg>`;
}

// ===================== DAY SHAPE + VOICE =====================
const wrap = (m) => ((m % 1440) + 1440) % 1440;
const KIND_COL = { wake: COL.yellow, work: COL.green, food: COL.purple, errands: COL.cyan, gym: COL.pink, mandarin: COL.orange, review: COL.pink, sleep: '#8E8EF5', custom: '#E5E5EA' };
const KIND_LINE = {
  wake: 'Water, then daylight. The rest of ur systems come online after that.',
  work: 'Prime time for satisfying work. Pick one thing and close the door on the circus.',
  food: 'Refuel. Protein first. The afternoon will thank u.',
  errands: 'Calls, errands, people. Low stakes, done well.',
  gym: "Gym o'clock. Then the evening is urs.",
  mandarin: '中文 time. Small daily deposits, compound interest.',
  review: 'The sun has clocked out. Today needs one line from u.',
  sleep: "Teeth, then sleep. I'll keep the orbits running.",
};
function blockStart(b, S) { return wrap((b.anchor === 'sunset' ? S.set : b.anchor === 'bed' ? S.bed : S.wakeMin) + (+b.off || 0)); }
function computeShape(S) {
  const rel = (m) => wrap(m - S.wakeMin); // minutes since wake, so the day runs wake → next wake
  S.shape = store.shape.map((b) => { const st = blockStart(b, S); return { ...b, start: st, end: wrap(st + (+b.len || 0)), col: KIND_COL[b.kind] || KIND_COL.custom }; })
    .sort((a, b) => rel(a.start) - rel(b.start));
  S.nowBlock = S.shape.find((b) => wrap(S.nowMin - b.start) < (+b.len || 0)) || null;
  const ahead = S.shape.filter((b) => b !== S.nowBlock).map((b) => ({ b, in: wrap(b.start - S.nowMin) })).sort((a, b) => a.in - b.in)[0];
  S.nextBlock = ahead ? ahead.b : null; S.nextIn = ahead ? ahead.in : 0;
}
const pick = (arr, S) => arr[Math.floor(kms(S.today) / 86400000) % arr.length];
function computeVoice(S) {
  const h = S.nowMin / 60, n = store.name ? `, ${store.name}` : '';
  S.greet = h < 4.5 ? `Still up${n}?` : h < 12 ? `Good morning${n}.` : h < 17 ? `Good afternoon${n}.` : h < 21 ? `Good evening${n}.` : `Good night${n}.`;
  const b = S.nowBlock;
  if (!S.isDay && (!b || b.kind === 'sleep' || b.kind === 'review' || b.kind === 'custom')) {
    S.nowLine = b && b.kind === 'review' ? KIND_LINE.review : b && b.kind === 'sleep' ? KIND_LINE.sleep
      : pick(['Rest mode. The universe can run without supervision for a few hours.', "Serious work is closed for the night. I've checked; nothing is on fire.", 'The sun is off shift. U may be too.'], S);
  } else if (b) {
    S.nowLine = b.kind === 'custom' || !KIND_LINE[b.kind] ? `Now: ${b.name}. U planned this, past u was wise.` : KIND_LINE[b.kind];
  } else {
    S.nowLine = pick(['Unscheduled time. Wander, rest, or start something satisfying.', 'A gap in the shape. Gaps are allowed. They are where good ideas park.', 'Nothing planned right now. Choose on purpose and it counts.'], S);
  }
  S.nowTag = b ? `${b.name} · ${hm(b.start)}–${hm(b.end)}` : S.zoneName;
  const soon = (m) => { m = Math.round(m); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`; };
  S.nextLine = S.nextBlock ? `Next · ${hm(S.nextBlock.start)} ${S.nextBlock.name} · in ${soon(S.nextIn)}` : 'Next · nothing planned. Add a block in Today.';
  // drift: midday has passed and nothing is logged yet. One calm line.
  S.drift = S.isDay && S.nowMin >= S.noon && !S.anyLogged;
  S.driftLine = pick(['The morning slipped by quietly. It happens. One 25-minute block still counts.', 'Bread and circus so far, which is fine. A single satisfying block turns the day.', 'Quiet morning. The afternoon is still unclaimed. Pick one small thing.'], S);
  // fasted-focus hint: morning, nothing eaten yet
  S.fasted = S.zone === 'morning' && S.td.meals.length === 0;
  S.fastedLine = "If u feel sharp before food, this could be ur clearest window. Eat when u're actually hungry.";
}
function computeBirthdays(S, now) {
  const y = +S.today.slice(0, 4), t0 = kms(S.today);
  S.bdays = store.people.filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.bday || '')).map((p) => {
    const md = p.bday.slice(5); let k = `${y}-${md}`; if (md === '02-29' && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) k = `${y}-03-01`;
    let days = Math.round((kms(k) - t0) / 86400000); if (days < 0) days = Math.round((kms(`${y + 1}-${md === '02-29' ? '03-01' : md}`) - t0) / 86400000);
    return { p, days };
  }).sort((a, b) => a.days - b.days);
  S.bdaySoon = S.bdays.filter((b) => b.days <= 3);
}
const bdayLine = (b) => (b.days === 0 ? `Today is ${b.p.name}'s birthday. A call beats a text.` : `${b.p.name}'s birthday is in ${b.days} day${b.days > 1 ? 's' : ''}. A little planning goes a long way.`);

// ===================== CHORES =====================
const addDays = (k, n) => dkey(kms(k) + n * 86400000 + 43200000);
const wdOf = (k) => new Date(k + 'T12:00:00Z').getUTCDay();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const choreStart = (c) => (/^\d{4}-\d{2}-\d{2}$/.test(c.start || '') ? c.start : c.created || dkey(Date.now()));
function dueOn(c, k) {
  if (c.repeat === 'once') return c.date === k;
  if (c.repeat === 'weekdays') return (c.days || []).includes(wdOf(k));
  if (c.repeat === 'weekly') return wdOf(k) === (+c.wd || 0);
  if (c.repeat === 'every') { const d = Math.round((kms(k) - kms(choreStart(c))) / 86400000), n = Math.max(2, +c.n || 2); return d >= 0 && d % n === 0; }
  return true;
}
const choreDone = (c, k) => !!(store.days[k] && store.days[k].chores && store.days[k].chores[c.id]);
function choreStreak(c, S) {
  let n = 0, k = S.today;
  if (dueOn(c, k) && !choreDone(c, k)) k = addDays(k, -1);
  for (let i = 0; i < 400; i++, k = addDays(k, -1)) { if (!dueOn(c, k)) continue; if (choreDone(c, k)) n++; else break; }
  return n;
}
function choreNext(c, S) {
  for (let d = 0; d < 400; d++) {
    const k = addDays(S.today, d); if (!dueOn(c, k) || (d === 0 && choreDone(c, k))) continue;
    return { k, d, label: (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `${WD_SHORT[wdOf(k)]} ${+k.slice(8)} ${MON[+k.slice(5, 7) - 1]}`) + ' ' + hm(c.time) };
  }
  return null;
}
const dayLabel = (k) => `${WD_SHORT[wdOf(k)]} ${+k.slice(8)} ${MON[+k.slice(5, 7) - 1]}`;
const repeatText = (c) => (c.repeat === 'once' ? `Once · ${c.date ? dayLabel(c.date) : 'no date'}` : c.repeat === 'weekdays' ? ((c.days || []).length === 7 ? 'Every day' : (c.days || []).map((d) => WD_SHORT[d]).join(' ') || 'No days picked')
  : c.repeat === 'weekly' ? `Weekly on ${WD_SHORT[+c.wd || 0]}` : c.repeat === 'every' ? `Every ${Math.max(2, +c.n || 2)} days` : 'Daily');
// every chore occurrence (plus the built-in teeth) from yesterday to the day after tomorrow
function choreOcc(S, maxD = 2) {
  const out = [];
  for (let d = -1; d <= maxD; d++) {
    const k = addDays(S.today, d), base = kms(k);
    store.chores.forEach((c) => { if (dueOn(c, k)) out.push({ c, k, id: c.id, icon: c.icon, name: c.name, cat: catOf(c), len: +c.len || 0, t: base + c.time * 60000, done: choreDone(c, k), act: `chore:${c.id}:${k}` }); });
    if (store.teethOn) out.push({ c: null, k, id: 'teeth', icon: '🦷', name: 'Brush teeth', cat: 'life', len: 0, t: base + wrap(S.bed - 30) * 60000, done: !!(store.days[k] && store.days[k].brushed), act: `brushOn:${k}` });
  }
  out.forEach((o) => { o.dt = (o.t - S.now) / 60000; o.overdue = !o.done && o.dt < -30 && o.dt > -720; });
  return out;
}

// ===================== GLYPHS: one line-icon set for every chore (24×24, round 1.5px strokes) =====================
const C_ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const GLYPHS = {
  water: 'M12 3.5c3 4.2 5.5 7.2 5.5 10.3a5.5 5.5 0 0 1-11 0C6.5 10.7 9 7.7 12 3.5zM9.6 14.6a2.5 2.5 0 0 0 2.2 2.4',
  gym: 'M3.5 9.5v5M6.5 7v10M17.5 7v10M20.5 9.5v5M6.5 12h11',
  laundry: 'M4 10.5h16l-1.7 8.5H5.7zM8.5 10.5l2.5-5M15.5 10.5l-2.5-5M9 13.5v2.5M12 13.5v2.5M15 13.5v2.5',
  broom: 'M16.5 3l-4.8 9.2M6.5 12.5h8.2l1.6 7.5H4.9zM8.6 16.2l-.4 3.8M11.6 16.2v3.8M14.3 16.2l.5 3.8',
  tooth: 'M8 4.2C5.6 4 4.3 5.8 4.3 8.1c0 2.8 1.6 3.9 2.1 6.7.5 2.9 1 5.2 2.3 5.2 1.4 0 1.2-4.3 3.3-4.3s1.9 4.3 3.3 4.3c1.3 0 1.8-2.3 2.3-5.2.5-2.8 2.1-3.9 2.1-6.7 0-2.3-1.3-4.1-3.7-3.9-1.6.1-2.4 1-4 1s-2.4-.9-4-1z',
  skin: 'M10 3h4v3h-4zM9 6h6l1.5 3v10.5c0 .8-.7 1.5-1.5 1.5H9c-.8 0-1.5-.7-1.5-1.5V9zM9.8 13.5h4.4',
  cook: C_(10, 13.5, 5.8) + 'M15.4 11.6L21 9' + C_(10, 13.5, 1.8),
  bowl: 'M3.5 11.5h17a8.5 8.5 0 0 1-17 0zM8.5 20.5h7M9.5 8c0-1.3 1.2-1.7 1.2-3.2M13.5 8c0-1.3 1.2-1.7 1.2-3.2',
  eat: C_(12, 12.5, 4.6) + 'M3.5 4v4.5c0 .9.7 1.6 1.5 1.6V20M5 4v3.5M20.5 4c-1.6 1-2.2 3.2-2.2 6.5h2.2V20',
  inbox: 'M4 13.5L6.5 7h3M14.5 7h3L20 13.5V19H4v-5.5h4.5l1.2 2h4.6l1.2-2H20M12 3.5V11M9.4 8.5L12 11l2.6-2.5',
  gear: C_(12, 12, 5.2) + C_(12, 12, 1.9) + 'M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3',
  robot: 'M6 8.5h12v9.5H6zM12 4.5v4M9.5 12.2v.6M14.5 12.2v.6M9.5 15.3h5M3.5 12v3M20.5 12v3' + C_(12, 4, 0.6),
  music: 'M4.5 15v-3a7.5 7.5 0 0 1 15 0v3M4.5 14h3v6h-3zM16.5 14h3v6h-3z',
  cart: 'M3 4.5h2.4l2.3 10h9.8L20 7.5H6.3' + C_(9.5, 19, 1.3) + C_(16.5, 19, 1.3),
  pill: 'M10.6 3.9a4.9 4.9 0 0 1 6.9 6.9l-6.7 6.7a4.9 4.9 0 0 1-6.9-6.9zM7.3 7.2l6.9 6.9',
  plant: 'M7 14h10l-1.5 6.5h-7zM12 14V8.5M12 9.5C12 6.3 10 4 6.5 4c0 3.7 2.4 5.5 5.5 5.5zM12 11.5c0-2.6 2-4.3 5-4.3 0 3-2 4.3-5 4.3z',
  paw: C_(7, 10, 1.6) + C_(10.3, 6.5, 1.6) + C_(13.7, 6.5, 1.6) + C_(17, 10, 1.6) + 'M12 12.5c-3 0-5 3.2-5 5.3 0 1.5 1.3 2.2 2.4 2.2 1.1 0 1.6-.6 2.6-.6s1.5.6 2.6.6c1.1 0 2.4-.7 2.4-2.2 0-2.1-2-5.3-5-5.3z',
  book: 'M4 5h4v14H4zM9 5h4v14H9zM14.4 5.6l3.8-1 3.3 13.7-3.8 1z',
  calm: C_(12, 6, 2) + 'M5 18.5c2-1 4.5-1.5 7-1.5s5 .5 7 1.5M8.2 15.5L12 11l3.8 4.5M6.5 12.5L12 10.8l5.5 1.7',
  shower: 'M5 20.5V7.5a3.5 3.5 0 0 1 7 0M8.5 9h7l-3.5-3zM10 12.5v1M13 12.5v1M16 12.5v1M11.5 16v1M14.5 16v1M13 19.5v1',
  trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5',
  phone: 'M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z',
  laptop: 'M5 6h14v9.5H5zM2.8 18.8h18.4',
  receipt: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 11.5h6M9 15h3.5',
  bed: 'M3 18.5v-11M3 13.5h18v5M21 18.5V16M6 13.5v-2.2c0-.8.7-1.5 1.5-1.5H10c.8 0 1.5.7 1.5 1.5v2.2',
  walk: C_(13.5, 4.5, 1.8) + 'M9.5 21l2.4-6.2 2.6 2.4V21M11.9 14.8l.8-5.3-3.4 1.6-1.3 3.4M12.7 9.5l2.4 2.8 2.9.6',
  sun: C_(12, 12, 3.8) + 'M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4',
  moon: 'M19.5 14.6A8 8 0 1 1 9.4 4.5a6.5 6.5 0 0 0 10.1 10.1z',
  mail: 'M3.5 6h17v12h-17zM3.5 6.5l8.5 7 8.5-7',
  flask: 'M9.5 3h5M10.5 3v6.2L5.2 18.8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.3-2.2L13.5 9.2V3M7.6 15h8.8',
  note: 'M9 17.5V5.5l10.5-2v12' + C_(6.5, 17.5, 2.5) + C_(17, 15.5, 2.5),
  sponge: 'M4 8.5h16v10H4zM8 12v.1M12 14v.1M16 11.5v.1M10 16.2v.1M15 16v.1',
  car: 'M5 16.5v-4l2.2-5.5h9.6l2.2 5.5v4zM5 12.5h14' + C_(8, 16.5, 1.7) + C_(16, 16.5, 1.7),
  leaf: 'M5 19c0-8 5-13.5 14-14 .5 9-5 14-13 14zM5 19l7-7',
  link: C_(9, 12, 4.5) + C_(15, 12, 4.5),
  flame: 'M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.6-8.4 1.6 1.2 2.4 2.6 2.4 4 1-.6 1.6-1.8 1.7-3.2 2.2 1.8 4.3 4.6 4.3 7.6 0 3.2-2.4 5.6-6 5.6z',
  chat: 'M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5zM8.5 10.5h7',
  egg: 'M12 3.5c3.5 0 6.5 5.2 6.5 9.5a6.5 6.5 0 0 1-13 0c0-4.3 3-9.5 6.5-9.5z',
  spark: 'M12 3.5l1.9 6.1 6.1 1.9-6.1 1.9-1.9 6.1-1.9-6.1-6.1-1.9 6.1-1.9z',
};
const GLYPH_OF = { '💧': 'water', '🏋': 'gym', '🧺': 'laundry', '🧹': 'broom', '🦷': 'tooth', '🧴': 'skin', '🍳': 'cook', '🍲': 'bowl', '📥': 'inbox', '⚙': 'gear', '🤖': 'robot', '🎧': 'music',
  '🛒': 'cart', '💊': 'pill', '🪴': 'plant', '🐕': 'paw', '📚': 'book', '🧘': 'calm', '🚿': 'shower', '🗑': 'trash', '📞': 'phone', '💻': 'laptop', '🧾': 'receipt', '🍽': 'eat', '🛏': 'bed',
  '🚶': 'walk', '☀': 'sun', '🌙': 'moon', '✉': 'mail', '🧪': 'flask', '🎸': 'note', '🧽': 'sponge', '🚗': 'car', '✨': 'spark' };
const GLYPH_WORDS = [[/water|drink|hydrat/, 'water'], [/gym|lift|workout|train|run\b|yoga/, 'gym'], [/laundry|wash cloth/, 'laundry'], [/tidy|clean|sweep|broom|vacuum/, 'broom'], [/teeth|brush|floss/, 'tooth'],
  [/skin|face|moistur|lotion/, 'skin'], [/cook|bake|prep/, 'cook'], [/lunch|soup|bowl/, 'bowl'], [/eat|dinner|breakfast|meal|snack/, 'eat'], [/inbox|admin|email|mail/, 'inbox'], [/system|automat|setup|config/, 'gear'],
  [/ai\b|agent|bot|code/, 'robot'], [/music|podcast|listen/, 'music'], [/shop|grocer|buy/, 'cart'], [/pill|vitamin|meds|medic|supplement/, 'pill'], [/plant|garden/, 'plant'], [/dog|cat|pet|walk the/, 'paw'],
  [/read|book|study|learn/, 'book'], [/meditat|breath|calm|stretch/, 'calm'], [/shower|bath/, 'shower'], [/trash|bin|garbage|recycl/, 'trash'], [/call|phone|ring/, 'phone'], [/work|laptop|computer|deep/, 'laptop'],
  [/bill|pay|tax|invoice|receipt/, 'receipt'], [/sleep|bed|nap/, 'bed'], [/walk|stroll|think/, 'walk'], [/sun|light|morning/, 'sun'], [/night|moon|wind down/, 'moon'], [/lab|experiment|test/, 'flask'],
  [/guitar|piano|practice|sing/, 'note'], [/dish|sponge|kitchen/, 'sponge'], [/car|drive|errand/, 'car']];
function glyphKey(icon, name) {
  const e = String(icon || '').replace(/[\uFE0F\u200D]/g, '');
  for (const k of Object.keys(GLYPH_OF)) if (e.startsWith(k)) return GLYPH_OF[k];
  const n = String(name || '').toLowerCase();
  for (const [re, k] of GLYPH_WORDS) if (re.test(n)) return k;
  return 'spark';
}
// inline <svg> for HTML (tray, inspector, menus): inherits currentColor
const glyphHTML = (icon, name, px = 22, cls = '') => `<svg class="gly ${cls}" viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${GLYPHS[glyphKey(icon, name)]}"/></svg>`;
// shared gradients for the orbs: one body + glow per strand, "both" blends them, a warm tint for overdue
function orbDefs() {
  const L = COL.life, W = COL.work, B = mixHex(COL.life, COL.work, 0.5), warm = '#FF9F45';
  const body = (id, c) => `<radialGradient id="${id}" cx=".4" cy=".34" r=".72"><stop offset="0" stop-color="${mixHex(c, '#ffffff', 0.55)}"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, 0.32)}"/></radialGradient>`;
  const glow = (id, c) => `<radialGradient id="${id}"><stop offset=".28" stop-color="${c}" stop-opacity=".55"/><stop offset=".6" stop-color="${c}" stop-opacity=".16"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  return `<defs>${body('orb-life', L)}${body('orb-work', W)}${body('orb-warm', mixHex(warm, COL.life, 0.25))}
    <linearGradient id="orb-both" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mixHex(L, '#ffffff', 0.2)}"/><stop offset=".5" stop-color="${B}"/><stop offset="1" stop-color="${shade(W, 0.55)}"/></linearGradient>
    ${glow('glw-life', L)}${glow('glw-work', W)}${glow('glw-both', B)}${glow('glw-warm', warm)}
    <radialGradient id="orb-hi" cx=".38" cy=".28" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter></defs>`;
}
const BREATH_S = 5.2, PULSE_S = 2.2;
// a chore as a glowing bead: o = occurrence, r = radius, st = { k: depth 0..1, next, live (breathes) }
function orbSVG(o, r, extra = '', st = {}) {
  const cat = o.cat === 'both' ? 'both' : o.cat === 'work' ? 'work' : 'life', k = st.k == null ? 1 : st.k;
  const sel = qa && qa.id && o.c && qa.id === o.c.id, col = catCol(cat);
  const cls = `chore tap orb${o.done ? ' done' : ''}${o.overdue ? ' overdue' : ''}${sel ? ' sel' : ''}${st.next ? ' nxt' : ''}`;
  const now = Date.now() / 1000, delay = (p) => `animation-delay:-${(now % p).toFixed(2)}s`;
  let inner;
  if (o.done) { // collapsed into an ember: a bright core, a tiny four-point spark, a whisper of glow
    const s = r * 0.42;
    inner = `<circle class="hit" r="${(r * 0.8).toFixed(1)}" fill="transparent"/><circle r="${(r * 1.05).toFixed(1)}" fill="url(#glw-${cat})" opacity=".8"/><path d="M0 ${-s}L${s * 0.22} ${-s * 0.22}L${s} 0L${s * 0.22} ${s * 0.22}L0 ${s}L${-s * 0.22} ${s * 0.22}L${-s} 0L${-s * 0.22} ${-s * 0.22}z" fill="${mixHex(col, '#ffffff', 0.6)}" opacity=".9"/><circle r="${(r * 0.17).toFixed(1)}" fill="#fff"/>`;
  } else {
    const warm = o.overdue, gs = r * 0.66, gk = glyphKey(o.icon, o.name), ink = mixHex(col, '#ffffff', 0.88);
    inner = `<circle class="orb-glow" r="${(r * 2.05).toFixed(1)}" fill="url(#glw-${warm ? 'warm' : cat})" opacity="${(0.55 + 0.45 * k).toFixed(2)}"/>`
      + (st.next ? `<circle class="orb-ping" r="${r}" fill="none" stroke="${col}" stroke-width="1.6"/>` : '')
      + `<circle class="orb-core" r="${r}" fill="url(#orb-${cat})"/>`
      + (warm ? `<circle r="${r}" fill="url(#orb-warm)" opacity=".42"/>` : '')
      + `<circle r="${r}" fill="url(#orb-hi)" opacity="${(0.35 + 0.5 * k).toFixed(2)}"/><circle r="${(r - 0.4).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="${(0.12 + 0.2 * k).toFixed(2)}" stroke-width=".8"/>`
      + `<g transform="translate(${-gs} ${-gs}) scale(${(gs / 12).toFixed(3)})" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS[gk]}" stroke="${shade(col, 0.4)}" stroke-opacity=".55" stroke-width="${(3.6 * 12 / gs).toFixed(2)}"/><path d="${GLYPHS[gk]}" stroke="${ink}" stroke-width="${(1.6 * 12 / gs).toFixed(2)}"/></g>`;
  }
  const anim = o.done ? '' : st.next ? ` class="orb-b pulse" style="${delay(PULSE_S)}"` : st.live ? ` class="orb-b breathe-o" style="${delay(BREATH_S)}"` : ' class="orb-b"';
  return `<g class="${cls}" data-act="${o.act}" ${extra}>${sel ? `<circle class="selring" r="${r + 6}" fill="none" stroke="${COL.yellow}" stroke-width="2.5"/>` : ''}<g${anim}>${inner}</g></g>`;
}

function choreIcon(o, r, extra = '', col = null) {
  const sel = qa && qa.id && o.c && qa.id === o.c.id;
  return `<g class="chore tap${o.done ? ' done' : ''}${o.overdue ? ' overdue' : ''}${sel ? ' sel' : ''}" data-act="${o.act}" ${extra}>${sel ? `<circle class="selring" r="${r + 6}" fill="none" stroke="${COL.yellow}" stroke-width="2.5"/>` : ''}${o.overdue ? `<circle class="halo" r="${r + 5}" fill="none" stroke="${COL.sunC}" stroke-width="3"/>` : ''}<circle r="${r}" fill="${COL.bg}" stroke="${o.done ? COL.green : col || 'rgba(255,255,255,.35)'}" stroke-width="${col ? 2 : 1.6}"/><text class="emo" y="${(r * 0.36).toFixed(1)}" text-anchor="middle" font-size="${(r * 1.05).toFixed(1)}">${o.icon}</text>${o.done ? `<circle cx="${(r * 0.72).toFixed(1)}" cy="${(-r * 0.72).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="${COL.green}"/><path d="M${(r * 0.52).toFixed(1)} ${(-r * 0.72).toFixed(1)} l${(r * 0.16).toFixed(1)} ${(r * 0.17).toFixed(1)} l${(r * 0.28).toFixed(1)} ${(-r * 0.32).toFixed(1)}" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g>`;
}
const LANE = { life: 0, both: -21, work: -42 };
function workBlocksOn(S, k) { // Day Shape "work" blocks (Satisfying work) for day k, as absolute ms
  return S.shape.filter((b) => b.kind === 'work').map((b) => ({ b, t0: kms(k) + b.start * 60000, len: +b.len || 0 }));
}
function flatChoresSVG(S, D) {
  const today = choreOcc(S).filter((o) => o.k === S.today && o.id !== 'teeth').sort((a, b) => a.t - b.t);
  let g = `<circle cx="${CX}" cy="${CX}" r="${D + LANE.work}" fill="none" stroke="${COL.work}" stroke-opacity=".13" stroke-width="1.2" pointer-events="none"/>`;
  // satisfying-work blocks sit on the work lane; tap one to log focus
  workBlocksOn(S, S.today).forEach(({ b }) => { if (b.len > 0) g += `<path class="tap wblk" data-ring="focus" d="${arcD(D + LANE.work, b.start, b.start + b.len)}" fill="none" stroke="${COL.work}" stroke-opacity=".38" stroke-width="5" stroke-linecap="round"/>`; });
  today.forEach((o) => { if (o.len > 0 && o.cat !== 'both') { const m = (o.t - kms(S.today)) / 60000; g += `<path d="${arcD(D + LANE[o.cat], m, m + o.len)}" fill="none" stroke="${catCol(o.cat)}" stroke-opacity=".3" stroke-width="3" stroke-linecap="round" pointer-events="none"/>`; } });
  const last = { life: -1e9, work: -1e9, both: -1e9 };
  const nx = today.find((o) => o.dt >= 0 && !o.done), nextId = nx ? nx.id + nx.k : '';
  today.forEach((o) => {
    const m0 = (o.t - kms(S.today)) / 60000, m = Math.max(m0, last[o.cat] + 36); last[o.cat] = m; // spread icons in a lane so they never overlap
    const r = D + LANE[o.cat], [x, y] = pt(r, dialF(m));
    if (o.cat === 'both') { const [x0, y0] = pt(D + LANE.work, dialF(m)), [x1, y1] = pt(D, dialF(m)); g += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${catCol('both')}" stroke-width="4" stroke-linecap="round" opacity=".8" filter="url(#now-glow)" pointer-events="none"/>`; }
    g += orbSVG(o, 13, `transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" data-r="${r}"`, { next: nextId === o.id + o.k, live: !o.done && o.dt >= 0 });
  });
  return orbDefs() + g;
}
// ---- time helix: today's loop tilted in perspective with NOW at the front, climbing one turn per 24 h ----
const HX = { cx: 300, cy: 424, rx: 180, ry: 52, pitch: 92, ahead: 66 * 60, past: 4 * 60, seg: 15 };
let helixPhi = 0, helixZoom = 1; // drag/scroll rotation (degrees) and pinch zoom
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function strandCol(f) { // palette gradient along the helix, 0 = now → 1 = top
  const g = RINGS.wheel.c ? [RINGS.wheel.a, RINGS.wheel.b, RINGS.wheel.c] : [RINGS.wheel.a, RINGS.wheel.b];
  const x = clamp(f, 0, 1) * (g.length - 1), i = Math.min(g.length - 2, Math.floor(x));
  return mixHex(g[i], g[i + 1], x - i);
}
function helixSVG(S, D, phi = 0) {
  const { cx, cy, rx, ry, pitch } = HX, items = [], OFF = { life: 0, work: 180 };
  const P = (dt, off = 0) => { const a = ((dt / 1440) * 360 + phi + off) * Math.PI / 180; return [cx + rx * Math.sin(a), cy + ry * Math.cos(a) - (dt / 1440) * pitch, Math.cos(a)]; };
  const dayAt = (dt) => { const m = wrap(S.nowMin + dt); return S.sun.polar === 'day' || (S.sun.polar === null && m >= S.rise && m < S.set); };
  const depth = (dt, z) => { const k = (1 + z) / 2, far = Math.max(0, dt) / HX.ahead; return { k, fade: dt < 0 ? 0.35 + 0.65 * (1 + dt / HX.past) * 0.5 : 1 - 0.55 * far }; };
  const f1 = (v) => v.toFixed(1);
  const BG = mixHex(COL.bg, COL.work, 0.05);
  const seg = (dt0, dt1, off, col, wAdd, opMul, attrs = '') => {
    const [x0, y0, z0] = P(dt0, off), [x1, y1, z1] = P(dt1, off), z = (z0 + z1) / 2, { k, fade } = depth(dt0, z);
    const c = typeof col === 'function' ? col(k) : col, o2 = clamp((0.22 + 0.78 * k) * fade * opMul, 0, 1);
    const L = `x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"`;
    if (wAdd) { items.push({ z: z + 0.002, svg: `<line ${attrs} ${L} stroke="${c}" stroke-width="${((1.4 + 4.6 * k) * (0.6 + 0.4 * fade) + wAdd * 0.7).toFixed(1)}" stroke-linecap="round" opacity="${o2.toFixed(2)}"/>` }); return; }
    // strands are opaque (colour mixed toward the sky) so the joints never show as beads; the front gets a soft halo
    const w = (1.4 + 4.6 * k) * (0.6 + 0.4 * fade);
    if (k > 0.5) items.push({ z: z - 0.001, svg: `<line ${L} stroke="${c}" stroke-width="${(w * 3.2).toFixed(1)}" stroke-linecap="butt" opacity="${(o2 * 0.09).toFixed(3)}" pointer-events="none"/>` });
    items.push({ z, svg: `<line ${attrs} ${L} stroke="${mixHex(BG, c, o2)}" stroke-width="${w.toFixed(2)}" stroke-linecap="round"/>` });
  };
  // the two strands: LIFE and WORK, the same timeline half a turn apart; front is brighter, daylight a touch stronger
  const strands = [['life', COL.lifeA, COL.life], ['work', COL.workA, COL.work]];
  for (let dt = -HX.past; dt < HX.ahead; dt += HX.seg) {
    const day = dayAt(dt + HX.seg / 2) ? 1 : 0.72;
    strands.forEach(([cat, a, b]) => seg(dt, dt + HX.seg, OFF[cat], (k) => mixHex(a, b, 0.3 + 0.7 * k), 0, day));
  }
  // satisfying-work blocks glow on the work strand (tap = log focus); chore durations glow on their own strand
  const clip = (a, b) => [Math.max(a, -HX.past), Math.min(b, HX.ahead)];
  const band = (dtA, dtB, cat, op, attrs) => { const [a, b] = clip(dtA, dtB); for (let dt = a; dt < b; dt += HX.seg) seg(dt, Math.min(b, dt + HX.seg), OFF[cat], COL[cat], 7, op, attrs); };
  for (let d = -1; d <= 3; d++) workBlocksOn(S, addDays(S.today, d)).forEach(({ t0, len }) => { if (len > 0) { const a = (t0 - S.now) / 60000; band(a, a + len, 'work', 0.32, 'pointer-events="none"'); } });
  const occ = choreOcc(S, 3).filter((o) => o.dt >= -HX.past && o.dt <= HX.ahead);
  occ.forEach((o) => { if (o.len > 0 && o.cat !== 'both') band(o.dt, o.dt + o.len, o.cat, 0.2, 'pointer-events="none"'); });
  // sunrise / sunset: small beads on both strands
  if (S.sun.polar === null) {
    for (let d = -1; d <= 3; d++) [[S.rise, COL.sunB], [S.set, COL.sunC]].forEach(([m, col]) => {
      const dt = m - S.nowMin + d * 1440; if (dt < -HX.past || dt > HX.ahead) return;
      [0, 180].forEach((off) => { const [x0, y0, z0] = P(dt, off), { fade } = depth(dt, z0); items.push({ z: z0 + 0.003, svg: `<circle cx="${f1(x0)}" cy="${f1(y0)}" r="${(1.6 + 2.2 * (1 + z0) / 2).toFixed(1)}" fill="${col}" opacity="${(0.65 * fade).toFixed(2)}"/>` }); });
    });
  }
  // day labels (hidden in Quiet mode)
  for (let d = 0; d <= 3; d++) {
    const dtNoon = (kms(addDays(S.today, d)) - S.now) / 60000 + 720; if (dtNoon > HX.ahead + 360) continue;
    const y = cy - (Math.max(dtNoon, 0) / 1440) * pitch, k = addDays(S.today, d);
    items.push({ z: -5, svg: `<text class="ql" x="${cx - rx - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="${d === 0 ? 12 : 11}" font-weight="${d === 0 ? 700 : 600}" fill="${d === 0 ? COL.yellow : '#B9B3D6'}" opacity="${(1 - 0.17 * d).toFixed(2)}">${d === 0 ? 'Today' : WD_SHORT[wdOf(k)]}</text>` });
  }
  // chores: life on the life strand, work on the work strand; "both" = a glowing rung bridging them, icon in the middle
  const soon = occ.filter((o) => o.dt >= 0 && !o.done).sort((a, b) => a.dt - b.dt).slice(0, 2).map((o) => o.id + o.k), nextKey = soon[0] || '';
  const inTxt = (m) => (m < 60 ? Math.round(m) + 'm' : Math.floor(m / 60) + 'h' + (Math.round(m % 60) ? ' ' + Math.round(m % 60) + 'm' : ''));
  let gi = 0;
  occ.forEach((o) => {
    const past = o.dt < 0;
    let x, y, z;
    if (o.cat === 'both') {
      const [x0, y0, z0] = P(o.dt, 0), [x1, y1, z1] = P(o.dt, 180), { fade } = depth(o.dt, 0), id = `rg${gi++}`;
      x = (x0 + x1) / 2; y = (y0 + y1) / 2; z = 0.0;
      const op = past ? (o.done ? 0.25 : 0.4) : 0.45 + 0.5 * fade;
      items.push({ z: -0.01, svg: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"><stop offset="0" stop-color="${COL.life}" stop-opacity=".8"/><stop offset=".32" stop-color="${COL.life}" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset=".68" stop-color="${COL.work}" stop-opacity=".08"/><stop offset="1" stop-color="${COL.work}" stop-opacity=".8"/></linearGradient><line class="rung" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="url(#${id})" stroke-width="${(1.2 + 1.6 * fade).toFixed(1)}" stroke-linecap="round" opacity="${(op * 0.8).toFixed(2)}" pointer-events="none"/>` });
    } else { [x, y, z] = P(o.dt, OFF[o.cat]); }
    // depth: back of the spiral ≈ 0.6× and 40 % (slightly blurred), front ≈ 1.15× and full; far future fades a little
    const k = (1 + z) / 2, far = Math.max(0, o.dt) / HX.ahead, isNext = o.id + o.k === nextKey;
    const sc = (0.6 + 0.55 * k) * (1 - 0.3 * far);
    let op = (0.4 + 0.6 * k) * (1 - 0.35 * far);
    if (past) op *= o.overdue ? 0.95 : o.done ? 0.85 : 0.55;
    if (isNext) op = Math.max(op, 0.75);
    const blur = k < 0.34 && !isNext ? ' filter="url(#orb-blur)"' : '';
    items.push({ z: z + 0.004, svg: `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(2)}"${blur}>${orbSVG(o, 16, '', { k, next: isNext, live: !past && o.dt < 1440 && k > 0.3 })}</g>` });
  });
  // a faint vertical light core, and motes drifting up both strands
  { const top = cy - ry - (HX.ahead / 1440) * pitch - 10, bot = cy + ry + 6;
    items.push({ z: -0.02, svg: `<defs><linearGradient id="hx-core" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${COL.yellow}" stop-opacity=".0"/><stop offset=".12" stop-color="${COL.yellow}" stop-opacity=".22"/><stop offset=".55" stop-color="${COL.work}" stop-opacity=".12"/><stop offset="1" stop-color="${COL.work}" stop-opacity="0"/></linearGradient><linearGradient id="hx-coreW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".055"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="${cx - 30}" y="${f1(top)}" width="60" height="${f1(bot - top)}" fill="url(#hx-coreW)" pointer-events="none"/><rect x="${cx - 0.6}" y="${f1(top)}" width="1.2" height="${f1(bot - top)}" fill="url(#hx-core)" pointer-events="none"/>` });
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      const path = (off) => { let d = ''; for (let dt = -60; dt <= HX.ahead; dt += 40) { const [x, y] = P(dt, off); d += (d ? 'L' : 'M') + f1(x) + ' ' + f1(y); } return d; };
      const now = Date.now() / 1000; let m = '';
      [[0, COL.life], [180, COL.work]].forEach(([off, col], si) => {
        const d = path(off);
        for (let i = 0; i < 6; i++) { const dur = 34 + ((i * 7 + si * 3) % 11), b = -((now + i * dur / 6 + si * 5) % dur); m += `<circle r="${(1 + (i % 3) * 0.45).toFixed(2)}" fill="${mixHex(col, '#ffffff', 0.5)}" opacity="0"><animateMotion dur="${dur}s" begin="${b.toFixed(2)}s" repeatCount="indefinite" path="${d}"/><animate attributeName="opacity" values="0;.85;.6;0" keyTimes="0;.15;.8;1" dur="${dur}s" begin="${b.toFixed(2)}s" repeatCount="indefinite"/></circle>`; }
      });
      items.push({ z: 0.95, svg: `<g class="motes" pointer-events="none">${m}</g>` });
    }
  }
  // NOW: a bright rung across both strands, the sun bead on life, a small bead on work
  const [lx, ly, lz] = P(0, 0), [wx, wy, wz] = P(0, 180);
  items.push({ z: Math.max(lz, wz) + 0.5, svg: `<g class="tap" data-ring="sun"><line x1="${f1(lx)}" y1="${f1(ly)}" x2="${f1(wx)}" y2="${f1(wy)}" stroke="${COL.yellow}" stroke-width="2.5" stroke-linecap="round" opacity=".55" filter="url(#now-glow)"/><circle cx="${f1(wx)}" cy="${f1(wy)}" r="5" fill="${COL.work}" stroke="${COL.bg}" stroke-width="1.5"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="20" fill="${COL.yellow}" opacity=".35" filter="url(#now-glow)" class="breathe"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="9.5" fill="${shade(COL.yellow, 1.2)}" stroke="${COL.bg}" stroke-width="2"/><text class="ql" x="${f1(lx)}" y="${(ly + 30).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing=".1em" fill="${COL.yellow}">NOW</text></g>` });
  items.push({ z: -9, svg: `<text class="ql" x="${cx}" y="${(cy - ry - 3 * pitch - 18).toFixed(1)}" text-anchor="middle" font-size="9.5" letter-spacing=".12em" fill="#8e8e93" opacity=".75">↑ LATER · <tspan fill="${COL.life}">LIFE</tspan> ⟷ <tspan fill="${COL.work}">WORK</tspan> · ONE TURN = ONE DAY</text>` });
  const body = orbDefs() + items.sort((a, b) => a.z - b.z).map((i) => i.svg).join('');
  if (Math.abs(helixZoom - 1) < 0.01) return body;
  return `<defs><clipPath id="now-hclip"><circle cx="${CX}" cy="${CX}" r="252"/></clipPath></defs><g clip-path="url(#now-hclip)"><g transform="translate(${HX.cx} ${HX.cy}) scale(${helixZoom.toFixed(3)}) translate(${-HX.cx} ${-HX.cy})">${body}</g></g>`;
}

// ===================== RING FACE (shared by Now and Cosmos) =====================
const RINGS = {
  wheel: { name: 'GALAXY', a: '#0040DD', b: COL.blue, f: (S) => S.wf },
  breath: { name: 'BREATH', a: '#248A3D', b: COL.green, f: (S) => S.bf },
  life: { name: 'LIFE', a: '#8944AB', b: COL.purple, f: (S) => S.lifeF },
  year: { name: 'SUN', a: '#B9770E', b: '#FFC94D', f: (S) => S.yearF },
  turn: { name: 'TURN', a: COL.orange, b: COL.yellow, f: (S) => S.tf },
  moon: { name: 'MOON', a: '#0071A4', b: COL.cyan, f: (S) => S.moonP },
  focus: { name: 'SATISFYING', a: '#248A3D', b: COL.green, f: (S) => S.focusF },
};
const ORRERY_RINGS = { ...RINGS, wheel: { ...RINGS.wheel, a: '#D70015', b: COL.red }, moon: { ...RINGS.moon, f: (S) => S.mf } };
const CX = 300;
const pt = (r, f) => [CX + r * Math.sin(2 * Math.PI * f), CX - r * Math.cos(2 * Math.PI * f)];
const dialF = (m) => (((m / 1440 + 0.5) % 1) + 1) % 1; // midnight bottom, noon top
function arcD(r, m0, m1) {
  const f0 = dialF(m0), f1 = dialF(m1), span = (((f1 - f0) % 1) + 1) % 1;
  const [x0, y0] = pt(r, f0), [x1, y1] = pt(r, f1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${span > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
function ringLayout(order) { // v13: thin luminous rings, close together at the rim, lots of room inside
  const n = order.length, outer = 288, inner = 150;
  const step = n > 1 ? Math.min(15, (outer - inner) / (n - 1)) : 0;
  return { radii: order.map((_, i) => outer - i * step), sw: 3, dial: Math.max(70, outer - (n - 1) * step - 46) };
}
const RING_TICKS = { year: [12, 3], moon: [8, 2], wheel: [24, 6], breath: [12, 3], life: [10, 5], turn: [10, 5], focus: [12, 3] };
function stars() {
  let s = '';
  for (let i = 0; i < 70; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12345.6789;
    s += `<circle cx="${(((a % 1) + 1) % 1 * 600).toFixed(1)}" cy="${(((b % 1) + 1) % 1 * 600).toFixed(1)}" r="${((i % 3) * 0.35 + 0.4).toFixed(2)}" fill="#fff" opacity="0.16"/>`;
  }
  return s;
}
function faceSVG(p, order, defs, mode) {
  const L = ringLayout(order);
  let g = `<defs>`;
  g += `<radialGradient id="${p}-inner"><stop offset="0" stop-color="${COL.work}" stop-opacity=".05"/><stop offset=".7" stop-color="${COL.accent || COL.work}" stop-opacity=".035"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
  order.forEach((id) => { const R = defs[id]; g += `<linearGradient id="${p}-g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${R.a}"/>${R.c ? `<stop offset="55%" stop-color="${R.b}"/><stop offset="100%" stop-color="${R.c}"/>` : `<stop offset="100%" stop-color="${R.b}"/>`}</linearGradient>`; });
  g += `<filter id="${p}-aur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>`;
  g += `<linearGradient id="${p}-day" gradientUnits="userSpaceOnUse" x1="${CX - L.dial}" y1="${CX}" x2="${CX + L.dial}" y2="${CX}"><stop offset="0%" stop-color="${COL.sunB}"/><stop offset="50%" stop-color="${COL.yellow}"/><stop offset="100%" stop-color="${COL.sunB}"/></linearGradient>`;
  g += `<filter id="${p}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  g += `<filter id="${p}-bloom" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter>`;
  g += `<radialGradient id="${p}-hglow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  g += `<circle cx="${CX}" cy="${CX}" r="${L.radii[L.radii.length - 1] - 10}" fill="url(#${p}-inner)" pointer-events="none"/>`;
  order.forEach((id, i) => {
    const R = defs[id], r = L.radii[i], C = 2 * Math.PI * r, [nT, maj] = RING_TICKS[id] || [12, 3];
    g += `<g id="${p}-wrap-${id}" class="ring tap" data-ring="${id}">`;
    g += `<circle cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="transparent" stroke-width="13" pointer-events="stroke"/>`;
    g += `<circle cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="${R.b}" stroke-opacity="0.13" stroke-width="1.1" pointer-events="none"/>`;
    let tk = '';
    for (let t = 0; t < nT; t++) { const big = t % maj === 0, [x0, y0] = pt(r - (big ? 4 : 2.5), t / nT), [x1, y1] = pt(r + (big ? 4 : 2.5), t / nT); tk += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`; }
    g += `<path d="${tk}" stroke="${R.b}" stroke-opacity=".32" stroke-width=".9" stroke-linecap="round" pointer-events="none"/>`;
    g += `<circle id="${p}-rb-${id}" cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="url(#${p}-g-${id})" stroke-width="7" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${CX} ${CX})" filter="url(#${p}-bloom)" opacity=".55" pointer-events="none"/>`;
    if (false) g += `<circle id="${p}-ra-${id}" class="ring aur" cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="url(#${p}-g-${id})" stroke-width="${L.sw + 6}" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${CX} ${CX})" filter="url(#${p}-aur)" opacity="0.55" pointer-events="none"/>`;
    g += `<circle id="${p}-r-${id}" class="ring" cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="url(#${p}-g-${id})" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${CX} ${CX})" pointer-events="none"/>`;
    if (id !== 'moon') g += `<g id="${p}-hd-${id}" pointer-events="none"><circle r="10" fill="url(#${p}-hglow)" opacity=".55"/><circle r="9" fill="${R.b}" opacity=".22"/><circle r="2.8" fill="#fff"/></g>`;
    g += `<text id="${p}-t-${id}" class="${p === 'now' ? 'ql' : ''}" x="${CX + 8}" y="${CX - r - 6}" font-size="9" font-weight="700" letter-spacing="0.14em" fill="${R.b}" opacity=".8">${R.name}</text></g>`;
  });
  g += `<g id="${p}-dots"></g><g id="${p}-moon"></g>`;
  const D = L.dial;
  if (mode === 'zones') g += `<g id="${p}-dialg" class="dialg">`;
  g += `<circle class="tap" data-ring="sun" cx="${CX}" cy="${CX}" r="${D + 8}" fill="transparent"/>`;
  g += `<circle cx="${CX}" cy="${CX}" r="${D}" fill="none" stroke="${RINGS.moon.b}" stroke-opacity="0.12" stroke-width="1.1" pointer-events="none"/>`;
  { let tk = ''; for (let h = 0; h < 24; h++) { const big = h % 6 === 0, [x0, y0] = pt(D + 7, h / 24), [x1, y1] = pt(D + (big ? 13 : 10), h / 24); tk += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`; } g += `<path d="${tk}" stroke="#fff" stroke-opacity=".16" stroke-width=".9" stroke-linecap="round" pointer-events="none"/>`; }
  g += mode === 'zones'
    ? `<g filter="url(#${p}-bloom)" opacity=".6" pointer-events="none"><path id="${p}-z1b" fill="none" stroke="${COL.yellow}" stroke-width="7" stroke-linecap="round"/><path id="${p}-z2b" fill="none" stroke="${COL.sunB}" stroke-width="7"/><path id="${p}-z3b" fill="none" stroke="${COL.sunC}" stroke-width="7" stroke-linecap="round"/></g><path id="${p}-z1" fill="none" stroke="${COL.yellow}" stroke-width="2.6" stroke-linecap="round"/><path id="${p}-z2" fill="none" stroke="${COL.sunB}" stroke-width="2.6"/><path id="${p}-z3" fill="none" stroke="${COL.sunC}" stroke-width="2.6" stroke-linecap="round"/><line id="${p}-stop" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`
    : `<path id="${p}-day" fill="none" stroke="url(#${p}-day)" stroke-width="3" stroke-linecap="round"/><text id="${p}-rise" font-size="11" fill="${COL.sunB}"></text><text id="${p}-set" font-size="11" fill="${COL.sunB}" text-anchor="end"></text>`;
  [0, 6, 12, 18].forEach((h) => { const [x, y] = pt(D - 56, dialF(h * 60)); g += `<text class="${p === 'now' ? 'ql' : ''}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#636366">${String(h).padStart(2, '0')}</text>`; });
  g += `<g id="${p}-sun" class="rot" style="transform-origin:${CX}px ${CX}px"><circle class="breathe" cx="${CX}" cy="${CX - D}" r="16" opacity="0.4" filter="url(#${p}-glow)"/><circle cx="${CX}" cy="${CX - D}" r="5.5" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/></g>`;
  if (mode === 'zones' && store.teethOn) g += `<g id="${p}-tooth" class="tap tooth" data-act="brush" role="button" aria-label="Brush teeth before sleep"><circle r="13" fill="${COL.bg}" fill-opacity=".6" stroke="#8E8EF5" stroke-opacity=".7" stroke-width="1.2"/><path d="M-6.5 -8.5c-2.6 0-4.3 2-4.3 4.6 0 2 .8 3.4 1.3 5.1.6 2.4.9 7.6 2.8 7.6 1.6 0 1.7-5.1 3.1-5.1h0c1.4 0 1.5 5.1 3.1 5.1 1.9 0 2.2-5.2 2.8-7.6.5-1.7 1.3-3.1 1.3-5.1 0-2.6-1.7-4.6-4.3-4.6-1.3 0-2.1.7-2.9.7s-1.6-.7-2.9-.7z" fill="none" stroke="#C7C7FF" stroke-width="1.6" stroke-linejoin="round" transform="scale(.82)"/></g>`;
  if (mode === 'zones') g += `<g id="${p}-chores"></g>`;
  const big = D > 150 ? 50 : D > 95 ? 40 : 32;
  if (mode === 'zones') {
    g += `<g id="${p}-centre" class="centre tap" data-act="peek" role="button" aria-label="Show the time"><circle cx="${CX}" cy="${CX}" r="46" fill="transparent"/><g id="${p}-cglyph"></g></g>`;
    g += `<g id="${p}-peek" class="peek" pointer-events="none"><rect x="${CX - 92}" y="${CX + 52}" width="184" height="44" rx="14" fill="${COL.bg}" fill-opacity=".86" stroke="rgba(255,255,255,.18)"/><text id="${p}-peekT" x="${CX}" y="${CX + 72}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" style="font-variant-numeric:tabular-nums"></text><text id="${p}-peekS" x="${CX}" y="${CX + 88}" text-anchor="middle" font-size="10.5" fill="#B9B3D6"></text></g>`;
  } else {
  g += `<text id="${p}-spin" x="${CX}" y="${CX - big + 2}" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="0.1em" fill="#8e8e93"></text>`;
  g += `<text id="${p}-time" x="${CX}" y="${CX + big / 4}" text-anchor="middle" font-size="${big}" font-weight="700" letter-spacing="-0.03em" fill="#fff" style="font-variant-numeric:tabular-nums"></text>`;
  g += `<text id="${p}-sub" x="${CX}" y="${CX + big / 4 + 24}" text-anchor="middle" font-size="12.5" fill="#8e8e93"></text>`;
  }
  if (mode === 'zones') g += `</g><g id="${p}-orbit" class="orbitg"></g>`;
  if (mode === 'zones') g += orbDefs() + orbRowSVG(p) + `<g id="${p}-ghost" class="ghost" pointer-events="none"></g>`;
  return `<svg viewBox="0 0 600 ${mode === 'zones' ? FACE_H : 600}" role="img" aria-label="Ring clock">${g}</svg>`;
}
// ---- small habit rings (corner complications) ----
const HABITS = {
  focus: { name: 'Satisfying', col: COL.green, f: (S) => S.focusF, v: (S) => { const m = Math.round(S.focusMin); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : ''); } },
  gym: { name: 'Gym', col: COL.pink, f: (S) => S.gymF, v: (S) => (S.td.gymMin || 0) + 'm' },
  mandarin: { name: '中文', col: COL.orange, f: (S) => S.manF, v: (S) => (S.td.mandarin || 0) + 'm' },
  water: { name: 'Water', col: COL.water, f: (S) => S.waterF, v: (S) => litres(S.td.water || 0) },
  protein: { name: 'Protein', col: COL.purple, f: (S) => S.proF, v: (S) => (S.td.protein || 0) + 'g' },
};
const litres = (ml) => (ml ? (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : ml % 100 === 0 ? 1 : 2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') + 'L' : '0L');
const ROW_Y = 632, FACE_H = 668;
const habitPos = (i, n) => [n > 1 ? 70 + i * (460 / (n - 1)) : 300, ROW_Y];
const MINI_R = 30, MINI_SW = 9;
// v13: a slim row of light orbs under the face (chores by strand · habits · dreams), each fills with light
const ORB_ROW = [['life', 'leaf'], ['work', 'laptop'], ['both', 'link'], null, ['focus', 'flame'], ['gym', 'gym'], ['mandarin', 'chat'], ['protein', 'egg'], ['water', 'water'], null, ['dream', 'moon']];
function orbRowCol(id) { return id === 'life' || id === 'work' || id === 'both' ? catCol(id) : id === 'dream' ? '#B48CFF' : HABITS[id].col; }
function orbRowSVG(p) {
  const items = ORB_ROW, gap = 14, step = 40, W = items.reduce((w, it) => w + (it ? step : gap), -step + 0);
  let x = CX - W / 2, g = `<g id="${p}-orow">`;
  items.forEach((it) => {
    if (!it) { x += gap; return; }
    const [id, gk] = it, col = orbRowCol(id), r = 11;
    const act = id === 'dream' ? 'data-act="dreamNew"' : ['life', 'work', 'both'].includes(id) ? 'data-act="editChores"' : `data-ring="${id}"`;
    g += `<g class="tap porb" ${act} id="${p}-po-${id}" data-tip="" transform="translate(${x.toFixed(1)} ${ROW_Y})">
      <radialGradient id="${p}-pg-${id}"><stop offset=".3" stop-color="${col}" stop-opacity=".6"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
      <circle r="18" fill="transparent"/><circle class="po-glow" r="${r * 2.1}" fill="url(#${p}-pg-${id})" opacity="0" pointer-events="none"/>
      <circle r="${r}" fill="${col}" fill-opacity=".05" stroke="${col}" stroke-opacity=".38" stroke-width="1"/>
      <clipPath id="${p}-pc-${id}"><rect id="${p}-pr-${id}" x="${-r}" y="${r}" width="${2 * r}" height="0"/></clipPath>
      <circle r="${r - 1.2}" fill="${col}" opacity=".85" clip-path="url(#${p}-pc-${id})"/>
      <circle r="${r}" fill="url(#orb-hi)" opacity=".45"/>
      <g transform="translate(-6 -6) scale(.5)" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS[gk]}"/></g></g>`;
    x += step;
  });
  return g + '</g>';
}
function updateOrbRow(p, S) {
  const occ = choreOcc(S, 0).filter((o) => o.k === S.today && o.c), dn = S.dreamToday;
  ORB_ROW.forEach((it) => {
    if (!it) return; const [id] = it;
    let f, tip;
    if (['life', 'work', 'both'].includes(id)) { const L = occ.filter((o) => o.cat === id), d = L.filter((o) => o.done).length; f = L.length ? d / L.length : 0; tip = `${id[0].toUpperCase() + id.slice(1)} · ${d}/${L.length} today`; }
    else if (id === 'dream') { f = dn ? 1 : 0; tip = dn ? 'Dream caught' : 'Log a dream'; }
    else { const H = HABITS[id]; f = clamp(H.f(S), 0, 1); tip = `${H.name} · ${H.v(S)}`; }
    const r = 11, h = 2 * r * f;
    setA(`${p}-pr-${id}`, 'y', (r - h).toFixed(1)); setA(`${p}-pr-${id}`, 'height', h.toFixed(1));
    const el = document.getElementById(`${p}-po-${id}`);
    if (el) { if (el.dataset.tip !== tip) { el.dataset.tip = tip; el.setAttribute('aria-label', tip); } const gl = el.querySelector('.po-glow'); if (gl) gl.setAttribute('opacity', (0.25 + 0.75 * f).toFixed(2) * (f > 0 ? 1 : 0)); el.classList.toggle('full', f >= 0.999); }
  });
}
function miniSVG(p) {
  let g = '';
  HABIT_RINGS.slice(0, 5).forEach((id, i) => {
    const n = Math.min(5, HABIT_RINGS.length), H = HABITS[id], [x, y] = habitPos(i, n), C = 2 * Math.PI * MINI_R;
    const ly = y + MINI_R + 22;
    g += `<g class="tap" data-ring="${id}"><circle cx="${x}" cy="${y}" r="${MINI_R + 10}" fill="transparent"/>`;
    g += `<circle cx="${x}" cy="${y}" r="${MINI_R}" fill="none" stroke="${H.col}" stroke-opacity="0.2" stroke-width="${MINI_SW}"/>`;
    g += `<circle id="${p}-h-${id}" class="ring" cx="${x}" cy="${y}" r="${MINI_R}" fill="none" stroke="${H.col}" stroke-width="${MINI_SW}" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${x} ${y})"/>`;
    g += `<text id="${p}-hv-${id}" class="ql" x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" style="font-variant-numeric:tabular-nums"></text>`;
    g += `<text class="ql" x="${x}" y="${ly}" text-anchor="middle" font-size="11" font-weight="600" fill="${H.col}" letter-spacing="0.04em">${H.name}</text></g>`;
  });
  return g;
}
function updateMinis(p, S) {
  HABIT_RINGS.slice(0, 5).forEach((id) => {
    const H = HABITS[id], C = 2 * Math.PI * MINI_R, f = H.f(S);
    setA(`${p}-h-${id}`, 'stroke-dasharray', `${Math.max(0.01, f * C).toFixed(2)} ${C.toFixed(2)}`);
    setA(`${p}-h-${id}`, 'opacity', f > 0 ? 1 : 0);
    setT(`${p}-hv-${id}`, H.v(S));
  });
}
function setA(id, attr, val) { const el = document.getElementById(id); if (el && el.getAttribute(attr) !== String(val)) el.setAttribute(attr, val); }
function setT(id, val) { const el = document.getElementById(id); if (el && el.textContent !== val) el.textContent = val; }
function updateFace(p, order, defs, mode, S) {
  if (!document.getElementById(p + '-dialg') && !document.getElementById(p + '-time')) return;
  const L = ringLayout(order);
  order.forEach((id, i) => {
    const r = L.radii[i], C = 2 * Math.PI * r, f = defs[id].f(S);
    setA(`${p}-r-${id}`, 'stroke-dasharray', `${Math.max(0.01, f * C).toFixed(2)} ${C.toFixed(2)}`);
    setA(`${p}-r-${id}`, 'opacity', f > 0 ? 1 : 0);
    setA(`${p}-rb-${id}`, 'stroke-dasharray', `${Math.max(0.01, f * C).toFixed(2)} ${C.toFixed(2)}`);
    { const [hx, hy] = pt(r, f); setA(`${p}-hd-${id}`, 'transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`); }
    if (id === 'year') setT(`${p}-t-${id}`, `SUN · DAY ${S.yearDay}/${S.yearDays}`);
    const w = document.getElementById(`${p}-wrap-${id}`);
    if (w) w.style.opacity = id === 'focus' && !S.isDay ? 0.28 : 1;
  });
  const ti = order.indexOf('turn'), mi = order.indexOf('moon');
  const dots = document.getElementById(p + '-dots');
  if (dots) {
    const html = ti < 0 ? '' : S.turnDots.map((d) => { const [x, y] = pt(L.radii[ti], d.f); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#fff" opacity="${d.op.toFixed(2)}" stroke="#000" stroke-width="1"/>`; }).join('');
    if (dots.innerHTML !== html) dots.innerHTML = html;
  }
  const mg = document.getElementById(p + '-moon');
  if (mg) {
    if (mi < 0) mg.innerHTML = '';
    else { const [x, y] = pt(L.radii[mi], defs.moon.f(S)); mg.innerHTML = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="url(#${p}-hglow)" opacity=".35"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.5" fill="${COL.bg}"/>` + moonGlyph(+x.toFixed(1), +y.toFixed(1), 6.5, S.moonP, '#F2F2F7', '#1C1C1E', COL.bg); }
  }
  const D = L.dial;
  const hasSun = S.sun.polar === null;
  if (mode === 'zones') {
    setA(p + '-z1', 'd', hasSun ? arcD(D, S.rise, S.mEnd) : '');
    setA(p + '-z2', 'd', hasSun ? arcD(D, S.mEnd, S.eStart) : '');
    setA(p + '-z3', 'd', hasSun ? arcD(D, S.eStart, S.set) : '');
    setA(p + '-z1', 'opacity', S.zone === 'morning' ? 1 : 0.45); setA(p + '-z2', 'opacity', S.zone === 'afternoon' ? 1 : 0.45); setA(p + '-z3', 'opacity', S.zone === 'evening' ? 1 : 0.45);
    setA(p + '-z1b', 'd', hasSun ? arcD(D, S.rise, S.mEnd) : ''); setA(p + '-z2b', 'd', hasSun ? arcD(D, S.mEnd, S.eStart) : ''); setA(p + '-z3b', 'd', hasSun ? arcD(D, S.eStart, S.set) : '');
    const [x1, y1] = pt(D - 10, dialF(S.set)), [x2, y2] = pt(D + 12, dialF(S.set));
    setA(p + '-stop', 'x1', x1.toFixed(1)); setA(p + '-stop', 'y1', y1.toFixed(1)); setA(p + '-stop', 'x2', x2.toFixed(1)); setA(p + '-stop', 'y2', y2.toFixed(1));
    setA(p + '-stop', 'opacity', hasSun ? 1 : 0);
  } else {
    setA(p + '-day', 'd', S.sun.polar === 'day' ? arcD(D, 0, 1439.9) : hasSun ? arcD(D, S.rise, S.set) : '');
    if (hasSun) {
      const [rx, ry] = pt(D - 44, dialF(S.rise)), [sx, sy] = pt(D - 44, dialF(S.set));
      setA(p + '-rise', 'x', rx.toFixed(1)); setA(p + '-rise', 'y', (ry + 4).toFixed(1)); setT(p + '-rise', '↑ ' + hm(S.rise));
      setA(p + '-set', 'x', sx.toFixed(1)); setA(p + '-set', 'y', (sy + 4).toFixed(1)); setT(p + '-set', hm(S.set) + ' ↓');
    } else { setT(p + '-rise', ''); setT(p + '-set', ''); }
  }
  const sun = document.getElementById(p + '-sun');
  if (sun) {
    const degNow = dialF(S.nowMin) * 360;
    const prev = parseFloat(sun.dataset.deg || 'NaN');
    if (!isNaN(prev) && Math.abs(degNow - prev) > 180) { sun.classList.remove('rot'); void sun.getBoundingClientRect(); requestAnimationFrame(() => sun.classList.add('rot')); }
    sun.style.transform = `rotate(${degNow}deg)`; sun.dataset.deg = degNow;
    const [glow, dot] = sun.children;
    glow.setAttribute('fill', S.isDay ? COL.yellow : '#E5E5EA'); dot.setAttribute('fill', S.isDay ? shade(COL.yellow, 1.25) : '#F2F2F7');
  }
  setT(p + '-spin', `SPIN ${(S.sf * 100).toFixed(2)}%`);
  setT(p + '-time', `${S.hhmm}:${S.ss}`);
  setT(p + '-sub', S.sunLine);
  if (mode === 'zones') {
    const cgk = `${S.isDay ? 'd' : 'n'}|${S.moonP.toFixed(2)}|${PAL.name}`, cgl = document.getElementById(p + '-cglyph');
    if (cgl && cgl.dataset.k !== cgk) {
      cgl.dataset.k = cgk;
      cgl.innerHTML = S.isDay
        ? `<defs><radialGradient id="${p}-csg"><stop offset="0" stop-color="#FFF6E8"/><stop offset=".55" stop-color="#FFB8E6"/><stop offset="1" stop-color="#B14BFF" stop-opacity="0"/></radialGradient></defs><circle cx="${CX}" cy="${CX}" r="36" fill="url(#${p}-csg)" opacity=".22" class="breathe"/><circle cx="${CX}" cy="${CX}" r="9" fill="url(#${p}-csg)"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s2 = Math.sin(a); return `<line x1="${(CX + 16 * c).toFixed(1)}" y1="${(CX + 16 * s2).toFixed(1)}" x2="${(CX + (i % 3 ? 20 : 24) * c).toFixed(1)}" y2="${(CX + (i % 3 ? 20 : 24) * s2).toFixed(1)}" stroke="#FFD9F0" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>`; }).join('')
        : `<circle cx="${CX}" cy="${CX}" r="32" fill="#C7C7FF" opacity=".08" filter="url(#${p}-glow)" class="breathe"/>` + moonGlyph(CX, CX, 17, S.moonP, '#F2F2F7', '#2C2C3A', COL.bg);
    }
    setT(p + '-peekT', `${S.hhmm}:${S.ss}`);
    setT(p + '-peekS', S.sunLine);
    updateOrbRow(p, S);
    const ck = `${Math.floor(S.now / 60000)}|${choreVer}|${PAL.name}`;
    const cg = document.getElementById(p + '-chores');
    if (cg && cg.dataset.k !== ck) { cg.innerHTML = flatChoresSVG(S, D); cg.dataset.k = ck; }
    const og = document.getElementById(p + '-orbit');
    const hk = ck + '|' + helixPhi.toFixed(1) + '|' + helixZoom.toFixed(3);
    if (og && store.orbit && og.dataset.k !== hk) { og.innerHTML = helixSVG(S, D, helixPhi); og.dataset.k = hk; }
    const tooth = document.getElementById(p + '-tooth');
    if (tooth) {
      const [tx, ty] = pt(D, dialF(wrap(S.bed - 30)));
      tooth.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
      const [c, path] = tooth.children;
      c.setAttribute('fill', S.brushed ? '#8E8EF5' : COL.bg);
      path.setAttribute('stroke', S.brushed ? COL.bg : '#C7C7FF');
      tooth.style.opacity = S.isDay && !S.brushed ? 0.55 : 1;
      tooth.classList.toggle('due', !S.isDay && !S.brushed);
    }
  }
}

// ===================== VIEWS =====================
const TABS = [
  ['now', 'Now', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'],
  ['today', 'Today', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'],
  ['cycles', 'Cycles', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>'],
  ['life', 'Life', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'],
  ['journal', 'Journal', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'],
  ['dreams', 'Dreams', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l1.6 4.9L18.5 9.5l-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6z"/><path d="M18.5 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>'],
];
const SECTIONS = ['now', 'today', 'cycles', 'life', 'journal', 'dreams'];
const TOP = [
  ['cosmos', 'Cosmos', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>'],
  ['settings', 'Settings', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'],
];
let tab = 'now', deepIdx = -1, sheet = null, convMode = 'date', convDate = '', convAgo = '300000', confirmReset = false;
const openedAt = Date.now();
const wordOfDay = (S) => HSK_WORDS[Math.floor(kms(S.today) / 86400000 + 1e6) % HSK_WORDS.length];
const pill = (label, act, cls = '') => `<button class="pill ${cls}" data-act="${act}">${label}</button>`;
const tileH = (k, color) => `<div class="tile"><div class="label" data-t="${k}L" style="color:${color}"></div><div class="value" data-t="${k}V"></div><div class="sub" data-t="${k}S"></div></div>`;
const title = (t, sub) => `<div class="large-title">${t}</div>${sub ? `<div class="subtitle" data-t="${sub}"></div>` : ''}`;

function deepMsgs(S) {
  const sec = (S.now - openedAt) / 1000;
  return [
    `Since u opened Orrery, the Sun has carried u ${fmt(sec * 230)} km around the galaxy, and Earth has moved ${fmt(sec * 29.78)} km around the Sun. U didn't even stand up.`,
    'Today alone, the Sun moves about 19.9 million km around Sagittarius A* (230 km/s × 86,400 s).',
    'All of Homo sapiens, about 300,000 years, is 0.47° of one galactic orbit. An 80-year life is 0.0000348% of it.',
    'The light reaching us from the galaxy\'s centre tonight left it 26,673 years ago, long before farming began about 12,000 years ago.',
    `We are ${(S.wf * 100).toFixed(4)}% of the way around Wheel 20. One Wheel ago (230 million years, a working value), the first dinosaurs had only just appeared.`,
    'Whatever feels huge today is happening on a planet doing 29.78 km/s, around a star doing 230 km/s, around a black hole of about 4 million Suns. Breathe. Then decide.',
  ];
}
const ORBIT_ICON = `<svg class="oi oi-helix" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c0-3 12-3 12-6S6 11 6 8s12-3 12-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 20c0-3-12-3-12-6s12-3 12-6S6 5 6 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".45"/></svg><svg class="oi oi-flat" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="4" r="2.2" fill="currentColor"/></svg>`;
function viewNow(S) {
  return `<div class="now-wrap"><div>
    <div class="center hello"><div class="eyebrow" data-t="placeLine"></div><div class="greet" data-t="greet"></div>
      <div class="hero-title nowline" data-t="nowLine"></div><div class="nowtag" data-t="nowTag"></div>
      <button class="next" data-act="tab:today"><span data-t="nextLine"></span></button></div>
    <div class="face ${store.orbit ? 'orbit-on' : ''}" id="nowFace">${faceSVG('now', RING_ORDER, RINGS, 'zones')}<button class="orbit-btn" data-act="orbit" aria-pressed="${store.orbit}" aria-label="Helix or flat view" data-tip="orbit">${ORBIT_ICON}<span class="ql" data-t="orbitBtn"></span></button></div>
  </div><div class="now-side">
    <div class="insp-bar desk-only"><span class="insp-title ql">Inspector</span><button class="icon-btn" data-act="insp" aria-label="Hide inspector" title="Hide inspector">›</button></div>
    <div class="tray" id="tray" role="toolbar" aria-label="Plot a chore: drag an icon onto the helix or dial"></div>
    <div class="insp desk-only" id="insp"></div>
    <div class="nexticons desk-only" id="nextIcons" aria-label="Next up"></div>
    <div class="card ctx" data-h="ctx"></div>
    <div data-h="quick"></div>
    <div class="muted center qh" style="margin-top:14px;font-size:12.5px">Tap a ring to log it, or a chore icon to tick it. Drag an icon from the tray onto the helix or dial to plot it; tap an empty spot on the helix to add something there (on Mac: double-click, right-click a chore, ⌘K, ?). The Galaxy ring opens Cosmos.</div>
  </div></div>`;
}
const morningDone = (S, item) => !!S.td.morning[item] || (/orrery/i.test(item) && S.wakeLogged) || (/^water$/i.test(item.trim()) && S.td.water > 0);
function ctxHTML(S) {
  const chk = (on, label, a) => `<button class="check slim ${on ? 'on' : ''}" data-act="${a}"><span class="box">${on ? '✓' : ''}</span><span>${esc(label)}</span></button>`;
  const lines = [];
  const Q = !!store.quiet, H3 = (html) => (Q ? '' : html);
  if (S.drift && !Q) lines.push(`<div class="soft">${esc(S.driftLine)}</div>`);
  S.bdaySoon.forEach((b) => lines.push(`<div class="soft">🎂 ${esc(bdayLine(b))}</div>`));
  if (!S.isDay) {
    const wrote = !!(S.nd.journal || '').trim();
    return `${lines.join('')}${H3('<h3 style="color:#8E8EF5">Tonight</h3>')}${store.teethOn ? chk(S.brushed, 'Brush teeth', 'brush') : ''}${chk(wrote, wrote ? "Tonight's line is written" : "One line for today's journal", 'tab:journal')}
      ${H3(`<h3 style="color:${COL.yellow};margin-top:16px">After u wake</h3>`)}<div class="preview" style="${Q ? 'margin-top:12px' : ''}">${store.morningList.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
      ${H3('<div class="muted" style="margin-top:8px">Edit this list in Settings.</div>')}`;
  }
  const morning = S.nowMin < S.wakeMin + 180 && store.morningList.some((m) => !morningDone(S, m));
  if (morning) {
    lines.push(H3(`<h3 style="color:${COL.yellow}">After waking</h3>`) + store.morningList.map((m, i) => chk(morningDone(S, m), m, 'morn:' + i)).join(''));
    if (S.fasted && !Q) lines.push(`<div class="muted" style="margin-top:10px">${esc(S.fastedLine)}</div>`);
    return lines.join('');
  }
  if (Q) return lines.join('');
  if (S.fasted) lines.push(`<div class="soft">${esc(S.fastedLine)}</div>`);
  const td = S.td;
  lines.push(`<h3>Today so far</h3><div class="sofar"><span style="color:${COL.green}">Satisfying ${dur(S.focusMin)}</span><span style="color:${COL.pink}">Gym ${td.gymMin || 0}m</span><span style="color:${COL.orange}">中文 ${td.mandarin || 0}m</span><span style="color:${COL.purple}">Protein ${td.protein || 0}g</span><span style="color:${COL.water}">Water ${litres(td.water || 0)}</span></div>`);
  return lines.join('');
}
function quickHTML(S) {
  if (store.quiet) {
    const ib = (label, a, cls, aria) => `<button class="pill ${cls || ''}" data-act="${a}" aria-label="${aria}" data-tip="${esc(aria)}">${label}</button>`;
    if (!S.isDay) return `<div class="quick">${ib('✎', 'tab:journal', 'fill night', "Tonight's line")}</div>`;
    return `<div class="quick">${S.wakeLogged ? '' : ib(glyphHTML('☀', '', 18), 'awake', 'yellow fill', "I'm awake")}${ib('+25m', 'focus:25', S.wakeLogged ? 'green fill' : '', '+25 min satisfying work')}${ib(glyphHTML('💧', '', 18), 'water:250', 'gq', '+250 ml')}${ib(`<span class="dbl">${glyphHTML('💧', '', 16)}${glyphHTML('💧', '', 16)}</span>`, 'water:500', 'gq', '+500 ml')}${ib(glyphHTML('🍽', '', 18), 'sheet:protein', 'gq', 'Food & sugar')}</div>`;
  }
  if (!S.isDay) return `<div class="quick">${pill("Write tonight's line", 'tab:journal', 'fill night')}</div>`;
  return `<div class="quick">${S.wakeLogged ? '' : pill("☀︎ I'm awake", 'awake', 'yellow fill')}${pill('+25m satisfying work', 'focus:25', S.wakeLogged ? 'green fill' : '')}${pill('💧 +250 ml', 'water:250')}${pill('+500 ml', 'water:500')}${pill('Food & sugar…', 'sheet:protein')}</div>`;
}
function focusCard() {
  return `<div class="card"><h3 style="color:${COL.green}">Satisfying work</h3><div class="big" data-t="focusBig"></div><div class="muted" data-t="focusSub"></div>
    <div class="row" style="margin-top:12px" data-h="timerBtn"></div>
    <div class="row" style="margin-top:8px">${pill('+25m', 'focus:25')}${pill('+50m', 'focus:50')}${pill('−25m', 'focus:-25')}</div>
    <div class="muted" style="margin-top:12px">Anything that leaves u satisfied with urself counts: building, studying, cleaning the room, a hard conversation. Any block, any size. Why a ~3–4 h ceiling? In their 1993 study of expert musicians, Ericsson and colleagues found people rarely keep up more than about 4 hours a day of deliberate practice.</div></div>`;
}
function gymCard(S) {
  return `<div class="card"><h3 style="color:${COL.pink}">Gym · workout</h3><div class="big" data-t="gymBig"></div><div class="muted" data-t="gymSub"></div>
    <div class="row" style="margin-top:12px">${pill('+15m', 'gym:15')}${pill('+30m', 'gym:30')}${pill('+45m', 'gym:45')}${pill('−15m', 'gym:-15')}</div>
    <label class="lbl">What did u train? (optional)<input class="field" data-f="gymNote" value="${esc(S.td.gymNote || '')}" placeholder="Legs, run, swim…"></label></div>`;
}
function mandarinCard(S) {
  return `<div class="card"><h3 style="color:${COL.orange}">Mandarin · 中文</h3><div class="big" data-t="manBig"></div><div class="muted" data-t="manSub"></div>
    <div class="row" style="margin-top:12px">${pill('+10m', 'man:10')}${pill('+15m', 'man:15')}${pill('+30m', 'man:30')}${pill('−10m', 'man:-10')}</div>
    <div style="margin-top:14px" data-h="word"></div></div>`;
}
function waterCard() {
  return `<div class="card"><h3 style="color:${COL.water}">Water</h3><div class="big" data-t="waterBig"></div><div class="muted" data-t="waterSub"></div>
    <div class="row" style="margin-top:12px">${pill('+250 ml glass', 'water:250', 'fill water')}${pill('+500 ml bottle', 'water:500', 'fill water')}${pill('−250 ml', 'water:-250')}</div></div>`;
}
function proteinCard(S) {
  return `<div class="card"><h3 style="color:${COL.purple}">Food & protein</h3><div class="big" data-t="proBig"></div><div class="muted" data-t="proSub"></div>
    <div class="row" style="margin-top:12px;flex-wrap:nowrap"><input class="field" id="mealText" placeholder="Meal (e.g. eggs and toast)" style="flex:2"><input class="field" id="mealG" type="number" inputmode="numeric" min="0" placeholder="g protein" style="flex:1;min-width:90px"></div>
    <div class="row" style="margin-top:8px">${pill('Add meal', 'meal', 'fill green')}</div>
    <div data-h="meals" style="margin-top:8px"></div>
    <div class="row" style="margin-top:14px"><span class="muted" style="font-size:14px">Sugar today</span><div class="seg" data-h="sugarSeg"></div></div>
    <div class="muted" style="margin-top:6px">Optional, just a note to urself. Over time u can see how it lines up with ur sharp and foggy days.</div></div>`;
}
function checksCard() {
  return `<div class="card"><h3 style="color:${COL.green}">3 ten-second checks</h3><div data-h="checks"></div><div class="muted" style="margin-top:10px">No streaks, no red. Each day is just a dot.</div></div>`;
}
function journalCard(S) {
  return `<div class="card" data-h-class="reviewCard"><h3 style="color:${COL.pink}" data-t="reviewTitle"></h3><div class="muted" data-t="reviewSum"></div>
    <textarea class="field" data-f="journal" rows="2" maxlength="280" placeholder="One line about today…" style="margin-top:10px">${esc(S.td.journal || '')}</textarea>
    <div class="muted" style="margin-top:6px">One line is plenty. Future u will love reading these.</div></div>`;
}
const DREAM_TAGS = ['calm', 'weird', 'scary', 'lucid', 'joyful', 'flying', 'chase', 'falling', 'water', 'people'];
let dreamDraft = null, dreamQ = '', dreamMore = false;
const newDream = () => { const S = compute(Date.now()); return { title: '', text: '', vivid: 3, tags: [], lucid: false, date: addDays(S.today, -1) }; };
function dreamSheet() {
  const d = dreamDraft || (dreamDraft = newDream());
  if (store.quiet && !dreamMore) return `<div class="dream-hero quiet"><div class="dream-glyph">✦</div></div>
    <div class="card dream-card"><textarea class="field" id="drText" data-f="dr:text" rows="5" placeholder="…" aria-label="Dream">${esc(d.text)}</textarea>
      <div class="row" style="margin-top:12px;justify-content:space-between">${pill('✦', 'dreamSave', 'blue fill')}<span class="row">${pill('⋯', 'drMore')}${pill('✕', 'closeSheet')}</span></div></div>`;
  return `<div class="dream-hero"><div class="dream-glyph">✦</div><div style="font-size:21px;font-weight:700">Catch the dream before it fades ✦</div><div class="muted">Fragments are fine. A colour, a place, a feeling.</div></div>
    <div class="card dream-card">
      <input class="field" id="drTitle" data-f="dr:title" value="${esc(d.title)}" placeholder="Title (optional)">
      <textarea class="field" id="drText" data-f="dr:text" rows="4" placeholder="What happened? Write fast, fix nothing…" style="margin-top:8px">${esc(d.text)}</textarea>
      <div class="lbl" style="margin-top:12px">Vividness</div><div class="vivid">${[1, 2, 3, 4, 5].map((n) => `<button class="vv ${d.vivid >= n ? 'on' : ''}" data-act="drVivid:${n}" aria-label="Vividness ${n}">${n <= d.vivid ? '●' : '○'}</button>`).join('')}<span class="muted">${['', 'faint', 'hazy', 'clear', 'vivid', 'like real life'][d.vivid]}</span></div>
      <div class="lbl" style="margin-top:12px">Mood</div><div class="tags">${DREAM_TAGS.map((t) => `<button class="tag ${d.tags.includes(t) ? 'on' : ''}" data-act="drTag:${t}">${t}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px;justify-content:space-between"><button class="check slim ${d.lucid ? 'on' : ''}" data-act="drLucid" style="flex:1"><span class="box">${d.lucid ? '✓' : ''}</span><span>Lucid: I knew I was dreaming</span></button></div>
      <label class="lbl">Night of<input type="date" class="field slim" data-f="dr:date" value="${esc(d.date)}" style="width:auto"></label>
      <div class="row" style="margin-top:14px">${pill('Save dream', 'dreamSave', 'blue fill')}${pill('No dream today', 'closeSheet')}</div></div>`;
}
function dreamStatsHTML() {
  const D = store.dreams;
  if (!D.length) return '<div class="muted">No dreams caught yet. Tomorrow morning, tap "I\'m awake" and write the first one.</div>';
  const counts = {}; D.forEach((d) => d.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="dstats"><div><b>${D.length}</b><span>dream${D.length === 1 ? '' : 's'}</span></div><div><b>${D.filter((d) => d.lucid).length}</b><span>lucid</span></div><div><b>${(D.reduce((a, d) => a + d.vivid, 0) / D.length).toFixed(1)}</b><span>avg vividness</span></div></div>${top.length ? `<div class="muted" style="margin-top:8px">Most common: ${top.map(([t, n]) => `<span class="tag on sm">${t} · ${n}</span>`).join(' ')}</div>` : ''}`;
}
function dreamListHTML() {
  const q = dreamQ.trim().toLowerCase();
  const list = [...store.dreams].sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at) || b.at - a.at)
    .filter((d) => !q || `${d.title} ${d.text} ${d.tags.join(' ')} ${d.lucid ? 'lucid' : ''} ${d.date}`.toLowerCase().includes(q));
  if (!list.length) return store.dreams.length ? '<div class="muted">No dreams match that search.</div>' : '';
  return list.slice(0, 50).map((d) => `<div class="dream"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div><div style="font-weight:600">${esc(d.title || 'Untitled dream')}${d.lucid ? ' <span class="tag on sm">lucid</span>' : ''}</div>
    <div class="muted mono" style="font-size:12px">Night of ${esc(d.date)} · ${'●'.repeat(d.vivid)}${'○'.repeat(5 - d.vivid)}</div></div><button class="pill" style="padding:4px 10px;font-size:12px" data-act="dreamDel:${d.id}" aria-label="Delete dream">✕</button></div>
    ${d.text ? `<div class="dream-text">${esc(d.text)}</div>` : ''}${d.tags.length ? `<div class="tags" style="margin-top:6px">${d.tags.map((t) => `<span class="tag sm">${esc(t)}</span>`).join('')}</div>` : ''}</div>`).join('') + (list.length > 50 ? `<div class="muted">Showing the newest 50 of ${list.length}.</div>` : '');
}
function lightCard() {
  return `<div class="card"><h3 style="color:${COL.yellow}">Light & sleep</h3><div class="row">${pill("☀︎ I'm awake", 'awake', 'yellow fill')}<span class="muted" data-t="wakeLine"></span></div>
    <div style="margin-top:12px;font-size:15px;line-height:1.5" data-t="lightLine"></div><div style="margin-top:8px;font-size:15px;line-height:1.5" data-t="sleepLine"></div>
    <div class="muted" style="margin-top:8px" data-t="zonesLine"></div>
    <div class="dream-sec"><div class="row" style="justify-content:space-between"><h3 style="color:#B48CFF;margin:0">✦ Dream journal</h3>${pill('+ Log a dream', 'dreamNew', 'blue fill')}</div>
      <div data-h="dreamStats" style="margin-top:10px"></div>
      <input class="field slim" data-f="dreamQ" value="${esc(dreamQ)}" placeholder="Search dreams, tags, dates…" style="margin-top:10px" aria-label="Search dreams">
      <div data-h="dreamList" style="margin-top:8px"></div></div></div>`;
}
const ANCHORS = [['wake', 'from waking'], ['sunset', 'from sunset'], ['bed', 'from bedtime']];
const LENS = [15, 20, 30, 45, 60, 90, 120, 150, 180, 240];
function shapeCard() {
  const rows = store.shape.map((b) => `<div class="blk"><div class="row" style="flex-wrap:nowrap"><span class="dot" style="background:${KIND_COL[b.kind] || KIND_COL.custom}"></span><input class="field slim" data-f="blkName:${b.id}" value="${esc(b.name)}" style="flex:1"><button class="pill" data-act="blkDel:${b.id}" aria-label="Remove">✕</button></div>
    <div class="row" style="margin-top:6px"><span class="mono blk-t" data-t="blkT_${b.id}"></span>${pill('−15m', 'blkNudge:' + b.id + ':-15')}${pill('+15m', 'blkNudge:' + b.id + ':15')}
    <select class="field slim" data-f="blkLen:${b.id}" style="width:auto">${LENS.map((l) => `<option value="${l}" ${+b.len === l ? 'selected' : ''}>${l < 60 ? l + ' min' : l / 60 + ' h'}</option>`).join('')}</select>
    <select class="field slim" data-f="blkAnchor:${b.id}" style="width:auto">${ANCHORS.map(([v, l]) => `<option value="${v}" ${b.anchor === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`).join('');
  return `<div class="card"><h3 style="color:${COL.yellow}">Day Shape</h3><div class="muted">A gentle rhythm hung on ur wake time and the sun. It's a shape, not a schedule. Nudge it as u learn what ur days want.</div>
    <div data-h="shapeList" style="margin-top:10px"></div>
    <details class="sub"><summary>Adjust the shape</summary><div class="muted" style="margin:4px 0 8px">Each block moves with its anchor: wake up later and the morning slides with u. Sunset blocks follow the seasons.</div>${rows}
      <div class="row" style="margin-top:12px">${pill('+ Add a block', 'blkAdd', 'yellow fill')}${pill('Back to the default rhythm', 'blkReset')}</div></details></div>`;
}
function choresCard() {
  const rows = store.chores.map((c) => `<div class="blk"><div class="row" style="flex-wrap:nowrap">
      <select class="field slim icon-pick" data-f="choreIcon:${c.id}" aria-label="Icon">${(CHORE_ICONS.includes(c.icon) ? CHORE_ICONS : [c.icon, ...CHORE_ICONS]).map((ic) => `<option ${ic === c.icon ? 'selected' : ''}>${ic}</option>`).join('')}</select>
      <input class="field slim" data-f="choreName:${c.id}" value="${esc(c.name)}" style="flex:1" aria-label="Chore name"><button class="pill" data-act="choreDel:${c.id}" aria-label="Delete chore">✕</button></div>
    <div class="row cats" style="margin-top:6px">${CATS.map(([v, l]) => `<button class="cat cat-${v} ${catOf(c) === v ? 'on' : ''}" data-act="choreCat:${c.id}:${v}" aria-pressed="${catOf(c) === v}">${l}</button>`).join('')}<label class="muted inl">for <input type="number" min="0" max="600" step="5" class="field slim" data-f="choreLen:${c.id}" value="${+c.len || 0}" style="width:68px" aria-label="Duration in minutes"> min</label></div>
    <div class="row" style="margin-top:6px"><input type="time" class="field slim" data-f="choreTime:${c.id}" value="${hm(c.time)}" style="width:auto" aria-label="Time">
      <select class="field slim" data-f="choreRep:${c.id}" style="width:auto" aria-label="Repeat">${[['once', 'Once'], ['daily', 'Daily'], ['weekdays', 'Chosen days'], ['every', 'Every N days'], ['weekly', 'Weekly']].map(([v, l]) => `<option value="${v}" ${c.repeat === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${c.repeat === 'once' ? `<input type="date" class="field slim" data-f="choreDate:${c.id}" value="${esc(c.date || '')}" style="width:auto" aria-label="Date">` : ''}
      ${c.repeat === 'weekdays' ? `<div class="wds">${WD_SHORT.map((d, i) => `<button class="wd ${(c.days || []).includes(i) ? 'on' : ''}" data-act="choreDay:${c.id}:${i}" aria-label="${d}">${d[0]}</button>`).join('')}</div>` : ''}
      ${c.repeat === 'every' ? `<label class="muted inl">every <input type="number" min="2" max="60" class="field slim" data-f="choreN:${c.id}" value="${Math.max(2, +c.n || 2)}" style="width:64px"> days from <input type="date" class="field slim" data-f="choreStart:${c.id}" value="${choreStart(c)}" style="width:auto"></label>` : ''}
      ${c.repeat === 'weekly' ? `<select class="field slim" data-f="choreWd:${c.id}" style="width:auto">${WD_SHORT.map((d, i) => `<option value="${i}" ${(+c.wd || 0) === i ? 'selected' : ''}>${d}</option>`).join('')}</select>` : ''}</div></div>`).join('');
  return `<div class="card"><h3 style="color:${COL.yellow}">Chores on the sun</h3><div class="muted">Life sits on the day ring, work just inside it, and Both bridges the two. On Now: tap an icon to tick it, drag it around the dial to move its time, long-press to see what it is. The helix shows the next days as a double strand.</div>
    <div data-h="choreList" style="margin-top:10px"></div>
    <details class="sub"><summary>Edit chores</summary><div class="muted" style="margin:4px 0 8px">Work has no fixed days, so work chores default to daily.</div><button class="check ${store.teethOn ? 'on' : ''}" data-act="teethOn" style="margin-bottom:8px"><span class="box">${store.teethOn ? '✓' : ''}</span><span>🦷 Show brush teeth at bedtime</span></button>${rows}
      <div class="row" style="margin-top:12px">${pill('+ Add a chore', 'choreAdd', 'yellow fill')}</div></details></div>`;
}
function choreListHTML(S) {
  if (!store.chores.length) return '<div class="muted">No chores yet. Add one below.</div>';
  return store.chores.map((c) => {
    const due = dueOn(c, S.today), done = choreDone(c, S.today), od = due && !done && S.nowMin > c.time + 30, nx = choreNext(c, S), st = choreStreak(c, S);
    const status = due ? (done ? 'done today ✓' : od ? 'overdue, whenever u can' : 'today ' + hm(c.time)) : nx ? 'next ' + nx.label : 'not scheduled';
    return `<div class="shape-row ${od ? 'od' : ''}"><button class="chip-ic ${done ? 'done' : ''}" data-act="chore:${c.id}:${S.today}" ${due ? '' : 'disabled'} aria-label="Tick ${esc(c.name)}">${c.icon}</button><span class="nm"><span class="catdot" style="background:${catCol(catOf(c))}"></span>${esc(c.name)}<span class="muted" style="display:block;font-size:12.5px">${CATS.find((x) => x[0] === catOf(c))[1]} · ${repeatText(c)}${c.len ? ` · ${c.len} min` : ''} · ${status}${st ? ` · streak ${st}` : ''}</span></span></div>`;
  }).join('');
}
function viewToday(S) {
  return `${title('Today', 'todaySub')}${shapeCard()}${choresCard()}<div class="cols"><div>${focusCard()}${gymCard(S)}${mandarinCard(S)}</div><div>${waterCard()}${proteinCard(S)}${journalCard(S)}${checksCard()}${lightCard()}</div></div>`;
}
function viewCycles(S) {
  const goals = !store.goals.length
    ? `<div class="empty"><div class="empty-ic">✦</div><div style="font-weight:600;font-size:17px">No goals plotted yet</div><div class="muted" style="max-width:340px;margin:4px auto 14px">A fine place to start. Three short questions, about two minutes, and this Turn has a direction.</div>${pill('Plot ur first goal', 'sheet:goal', 'yellow fill')}</div>`
    : store.goals.map((g, i) => `<div class="goal"><div class="row" style="flex-wrap:nowrap"><input class="field slim" data-f="goalName:${i}" value="${esc(g.name)}" style="flex:1;font-weight:600"><button class="pill" data-act="goalDel:${i}" aria-label="Remove">✕</button></div>
      ${g.done ? `<div class="muted" style="margin-top:6px">Done when: ${esc(g.done)}</div>` : ''}${g.step ? `<div class="muted">First step: ${esc(g.step)}</div>` : ''}
      <div class="row" style="margin-top:6px;flex-wrap:nowrap"><input type="range" min="0" max="100" value="${g.pct}" data-f="goalPct:${i}" style="flex:1;accent-color:${COL.yellow}"><span class="muted mono" data-t="gp${i}" style="width:42px;text-align:right"></span></div></div>`).join('')
      + (store.goals.length < 3 ? `<div style="margin-top:12px">${pill('+ Plot another goal', 'sheet:goal')}</div>` : '<div class="muted" style="margin-top:10px">Three is plenty for one Turn.</div>');
  return `${title('Cycles', 'cyclesSub')}<div class="cols"><div>
    <div class="card"><h3 style="color:${COL.cyan}">This Moon · 29.5-day sprint</h3><div class="row" style="flex-wrap:nowrap;gap:14px"><svg width="56" height="56" viewBox="0 0 56 56" data-h="moonIcon"></svg><div><div style="font-size:22px;font-weight:700" data-t="moonName"></div><div class="muted" data-t="moonSub"></div></div></div>
      <div class="muted" style="margin-top:12px">New moon: set an intention. Waxing: build. Full: mid-review. Waning: finish and rest.</div>
      <label class="lbl"><span data-t="intLabel"></span><input class="field" data-f="intention" value="${esc(store.intentions[S.moonKey] || '')}" placeholder="One thing this Moon is for…"></label></div>
    <div class="card"><h3 style="color:${COL.cyan}">Moon review · last 29.5 days</h3><div data-h="moonReview"></div></div>
  </div><div>
    <div class="card"><h3 style="color:${COL.yellow}" data-t="turnTitle"></h3><div class="bar"><div data-w="turn" style="background:linear-gradient(90deg,${COL.orange},${COL.yellow})"></div></div><div class="muted" style="margin-top:8px" data-t="turnSub"></div>${goals}</div>
    <div class="card" data-h-class="mirrorCard"><h3 style="color:${COL.yellow}" data-t="mirrorTitle"></h3><div data-h="mirror"></div><div class="muted" style="margin-top:12px">Turnday rule: remove one feature from this app. Simpler wins.</div></div>
  </div></div>`;
}
const EVERY = [[1, 'Daily'], [3, 'Every 3 days'], [7, 'Weekly'], [14, 'Every 2 weeks'], [30, 'Monthly']];
function peopleRows() {
  if (!store.people.length) return '<div class="muted" style="margin-top:10px">No one here yet. Add a few people u want to stay close to.</div>';
  return store.people.map((p) => `<div class="person"><span class="dot" data-bg="pd_${p.id}"></span>
    <div style="flex:1;min-width:160px"><input class="field slim" data-f="pName:${p.id}" value="${esc(p.name)}" style="font-weight:600"><div class="muted" data-t="ps_${p.id}" style="margin-top:4px"></div></div>
    <select class="field slim" data-f="pEvery:${p.id}" style="width:auto">${EVERY.map(([v, l]) => `<option value="${v}" ${+p.every === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label class="muted bd">Birthday <input type="date" class="field slim" data-f="pBday:${p.id}" value="${esc(p.bday || '')}"></label>
    ${pill('Talked today', 'talk:' + p.id)}<button class="pill" data-act="delPerson:${p.id}" aria-label="Remove">✕</button></div>`).join('');
}
function viewLife(S) {
  return `${title('Life', 'lifeSub')}<div class="cols"><div>
    <div class="card"><h3 style="color:${COL.purple}">Life ring</h3><div class="row" style="flex-wrap:nowrap;gap:16px"><svg width="96" height="96" viewBox="0 0 96 96" data-h="lifeRing"></svg><div><div class="big" data-t="lifeBig"></div><div class="muted" data-t="lifeSub2"></div></div></div>
      <div class="muted" style="margin-top:10px">Set ur birth date and life expectancy in Settings. It never leaves this device.</div></div>
    <div class="card"><h3 style="color:${COL.blue}">Galaxy perspective</h3><div style="font-size:15px;line-height:1.55" data-t="galaxyLine"></div><div style="margin-top:12px">${pill('✦ Deep Look', 'deep', 'blue fill')}</div><div data-h="deep"></div></div>
    <div class="card"><h3 style="color:${COL.orange}">Firsts log · one new thing a week</h3><div class="muted" data-t="firstsWeek"></div>
      <div class="row" style="margin-top:12px;flex-wrap:nowrap"><input class="field" id="firstText" placeholder="Something I did for the first time…"></div><div style="margin-top:8px">${pill('Add first', 'addFirst', 'orange fill')}</div><div data-h="firsts" class="list" style="margin-top:10px"></div></div>
  </div><div>
    <div class="card"><h3 style="color:${COL.green}">People orbit</h3><div class="muted">Rename anyone, set how often u'd like to talk, and add a birthday so it's on the radar a few days early.</div>${peopleRows()}
      <div style="margin-top:14px" class="row"><input class="field" id="pName" placeholder="Name" style="flex:2;min-width:140px"><select class="field" id="pEvery" style="flex:1;min-width:130px">${EVERY.map(([v, l]) => `<option value="${v}" ${v === 7 ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div style="margin-top:8px">${pill('Add to orbit', 'addPerson', 'green fill')}</div><div class="muted" style="margin-top:10px">A grey dot just means "been a while". It never turns red.</div></div>
  </div></div>`;
}
function viewJournal(S) {
  return `${title('Journal', 'journalSub')}${journalCard(S)}<div class="card"><h3>All lines</h3><div data-h="journalList"></div></div>`;
}
function viewCosmos(S) {
  return `${title('Cosmos', 'cosmosSub')}<div class="muted" style="margin:0 4px 6px">${esc(MOTTO)}</div><div class="now-wrap"><div>
    <div class="face">${faceSVG('orr', ORRERY_ORDER, ORRERY_RINGS, 'day')}</div>
    <div class="chips" data-h="orrChips"></div></div><div class="now-side">
    <div class="card"><h3 style="color:${COL.blue}">Deep Look</h3><div class="muted">Zoom out before big decisions.</div><div style="margin-top:10px">${pill('✦ Deep Look', 'deep', 'blue fill')}</div><div data-h="deep"></div></div>
    <div class="card"><h3>Converter</h3><div class="seg"><button data-act="conv:date" class="${convMode === 'date' ? 'on' : ''}">Date</button><button data-act="conv:ago" class="${convMode === 'ago' ? 'on' : ''}">Years ago</button></div>
      ${convMode === 'date' ? `<label class="lbl">Date and time in ur zone (YYYY-MM-DD HH:MM, minus sign for BCE)<input class="field" data-f="convDate" value="${esc(convDate)}" placeholder="1969-07-21 01:47"></label>` : `<label class="lbl">Years before now<input class="field" data-f="convAgo" value="${esc(convAgo)}" placeholder="300000"></label>`}
      <div data-h="conv" style="margin-top:10px"></div></div>
  </div></div>
  <details class="card"><summary>The layers</summary><table><tr><th>Unit</th><th>What orbits what</th><th class="r">Length</th><th>How sure</th></tr>
    <tr><td>Wheel (W)</td><td>Sun around Sagittarius A*</td><td class="r">230,000,000 y (225–250 M)</td><td>Estimate</td></tr>
    <tr><td>Breath (B)</td><td>Sun bobbing through the galactic disc</td><td class="r">70,000,000 y (52–75 M)</td><td>Rough estimate</td></tr>
    <tr><td>Turn (T)</td><td>Earth around the Sun, against the stars</td><td class="r">365.256363 d</td><td>Measured</td></tr>
    <tr><td>Moon (M)</td><td>Moon around Earth, against the stars</td><td class="r">27.321661 d</td><td>Measured</td></tr>
    <tr><td>Spin (S)</td><td>Earth turning once, against the stars</td><td class="r">86,164.0905 s</td><td>Measured</td></tr>
    <tr><td>Tick</td><td>One SI second, counted from Orbit 0</td><td class="r">1 s</td><td>Exact by definition</td></tr></table>
    <p class="muted">Orbit 0 = exactly 4,567,300,000 Julian years before J2000.0, the meteorite (CAI) age of the Solar System, 4,567.30 ± 0.16 million years. Moon phase uses the mean synodic month (29.530589 d) from the new moon of 2000-01-06 18:14 UTC.</p></details>
  <details class="card"><summary>How to write a date</summary><div class="code">W&lt;wheel&gt;:&lt;% of wheel&gt; · B&lt;breath&gt;:&lt;%&gt; · T&lt;turn&gt; d&lt;day of turn&gt; · S&lt;% of spin&gt;
Short form: last 3 digits of the Turn · day, like 461·d191</div><div class="muted" style="margin-top:8px">Now: <span data-t="notation"></span></div></details>
  <details class="card"><summary>The Mind's Clock · short version</summary><ul>
    <li>Landmarks make people start fresh: diet searches rose 82.1% at the start of a year, gym visits 33.4% at the start of a week (Dai, Milkman &amp; Riis 2014). Naming a day as a beginning lifted goal starts from 7.23% to 25.61% (2015).</li>
    <li>Routine periods feel shorter looking back; new ones feel longer (Avni-Babad &amp; Ritov 2003). Hence the Firsts log.</li>
    <li>Awe made people feel they had more time and less impatient, in small lab studies (Rudd, Vohs &amp; Aaker 2012). Hence Deep Look.</li>
    <li>Seeing an aged future self raised hypothetical savings, 6.17% vs 4.41% of pay (Hershfield et al. 2011).</li>
    <li>"Time speeds up with age" is weak: in 499 people, only "the last 10 years" felt faster with age (Wittmann &amp; Lehnhoff 2005).</li>
    <li>Calendars that fight the 7-day week die: French décade 1793–1805, Soviet rolling week 1929–1940.</li></ul></details>
  <details class="card"><summary>Rules of the Compass</summary><ol>${RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></details>
  <details class="card"><summary>Sources</summary><ul class="muted">
    <li>GRAVITY Collaboration 2019, A&amp;A: Sgr A* at 8,178 ± 13 ± 22 pc (26,673 ly)</li><li>Connelly et al. 2012, Science: CAI age 4,567.30 ± 0.16 Myr</li>
    <li>Bahcall &amp; Bahcall 1985, Nature; arXiv 2308.14305: the Sun's vertical oscillation</li><li>NOAA Solar Calculator equations (sunrise and sunset)</li>
    <li>Ericsson, Krampe &amp; Tesch-Römer 1993, Psychological Review</li><li>Dai, Milkman &amp; Riis 2014 (Management Science) and 2015 (Psychological Science)</li>
    <li>Rudd, Vohs &amp; Aaker 2012, Psychological Science</li><li>Hershfield et al. 2011, Journal of Marketing Research</li>
    <li>Avni-Babad &amp; Ritov 2003, JEP: General</li><li>Wittmann &amp; Lehnhoff 2005, Psychological Reports</li><li>Zerubavel, The Seven Day Circle</li></ul>
    <p class="muted">Sources are listed as text so the app makes no outside requests.</p></details>`;
}
function viewSettings(S) {
  const P = store.place, R = store.reminders;
  const tog = (k, label) => `<button class="check ${R[k] ? 'on' : ''}" data-act="rem:${k}"><span class="box">${R[k] ? '✓' : ''}</span><span>${label}</span></button>`;
  return `${title('Settings', '')}<div class="cols"><div>
    <div class="card"><h3>Mac</h3>
      <div class="lbl">Appearance</div><div class="qseg">${[['dark', 'Dark'], ['system', 'Match macOS'], ['light', 'Light']].map(([v, l]) => `<button class="${store.appearance === v ? 'on' : ''}" data-act="appear:${v}">${l}</button>`).join('')}</div>
      <button class="check ${store.mini ? 'on' : ''}" data-act="mini" style="margin-top:10px"><span class="box">${store.mini ? '✓' : ''}</span><span>Mini window: when the window is narrower than 480 px, show only the helix and rings</span></button>
      <div class="muted" style="margin-top:8px">Press ? for keyboard shortcuts, ⌘K for the command palette.</div></div>
    <div class="card"><h3>Quiet mode</h3><button class="check ${store.quiet ? 'on' : ''}" data-act="quiet" aria-pressed="${!!store.quiet}"><span class="box">${store.quiet ? '✓' : ''}</span><span>Quiet mode: no labels, no chatter</span></button><div class="muted" style="margin-top:8px">The face stays visual. Long-press anything to see what it is. Turn it off to bring back the labels, Orrery's voice and nudges.</div></div>
    <div class="card"><h3>You</h3><label class="lbl">What should Orrery call u?<input class="field" data-f="name" value="${esc(store.name)}" placeholder="Lav"></label><label class="lbl">Birth date (YYYY-MM-DD)<input class="field" data-f="birth" value="${esc(store.birth)}" placeholder="YYYY-MM-DD"></label>
      <label class="lbl">Life expectancy for the Life ring (years)<input class="field" type="number" data-f="lifeYears" value="${store.lifeYears}" min="30" max="120"></label></div>
    <div class="card"><h3>Daily goals</h3>
      <label class="lbl">Satisfying work (hours)<input class="field" type="number" step="0.5" min="0.5" max="12" data-f="goalH" value="${store.goalMin / 60}"></label>
      <label class="lbl">Gym (minutes)<input class="field" type="number" min="5" max="300" data-f="gymGoal" value="${store.gymGoal}"></label>
      <label class="lbl">Mandarin (minutes)<input class="field" type="number" min="5" max="300" data-f="mandarinGoal" value="${store.mandarinGoal}"></label>
      <label class="lbl">Water (litres)<input class="field" type="number" step="0.25" min="0.5" max="6" data-f="waterGoalL" value="${store.waterGoal / 1000}"></label>
      <label class="lbl">Protein (grams)<input class="field" type="number" min="10" max="400" data-f="proteinGoal" value="${store.proteinGoal}"></label></div>
    <div class="card"><h3>Place</h3><div class="muted" data-t="placeNow"></div>
      <label class="lbl">Latitude (°N)<input class="field" data-f="lat" value="${P.lat}"></label><label class="lbl">Longitude (°E)<input class="field" data-f="lon" value="${P.lon}"></label><label class="lbl">UTC offset (hours)<input class="field" data-f="tz" value="${P.tz}"></label>
      <div class="row" style="margin-top:12px">${pill('Use my location', 'geo', 'blue fill')}${pill('Back to Pune', 'pune')}</div><div class="muted" style="margin-top:8px">Location is read once from ur device and stays here. It needs HTTPS.</div></div>
  </div><div>
    <div class="card"><h3>Colour palette</h3><div class="muted">Tap one to try it. It applies straight away and is saved with ur backup.</div>
      <div class="palgrid">${Object.entries(PALETTES).map(([id, P]) => `<button class="pal ${store.palette === id ? 'on' : ''}" data-act="pal:${id}" aria-pressed="${store.palette === id}">${swatchSVG(P)}<span>${P.name}</span></button>`).join('')}
        <button class="pal ${store.palette === 'custom' ? 'on' : ''}" data-act="pal:custom" aria-pressed="${store.palette === 'custom'}"><span data-swatch="custom">${swatchSVG(resolvePalette('custom', store.custom))}</span><span>Custom</span></button></div>
      ${store.palette === 'custom' ? `<div class="customgrid">${CUSTOM_KEYS.map(([k, l]) => { const P = resolvePalette('custom', store.custom); const v = k === 'accent' ? P.accent : k === 'galaxy' ? P.galaxy[1] : k === 'sunRing' ? P.sunRing[1] : k === 'lifeStrand' ? P.lifeStrand[1] : k === 'workStrand' ? P.workStrand[1] : k === 'moon' ? P.moon[1] : k === 'sun' ? P.sun[0] : P.habits[k]; return `<label class="cpick"><input type="color" data-f="pc:${k}" value="${v}"><span>${l}</span></label>`; }).join('')}</div>
        <div class="row" style="margin-top:10px">${pill('Reset custom colours', 'palReset')}</div>` : ''}</div>
    <div class="card"><h3>Chores</h3><div class="muted">Add, edit or delete chores (icon, name, time, repeat) in Today → Chores on the sun.</div><div class="row" style="margin-top:10px">${pill('Edit chores', 'editChores')}</div></div>
    <div class="card"><h3>After-waking checklist</h3><div class="muted">One item per line. It shows on the night screen as a preview, and in the morning as ticks.</div>
      <textarea class="field" data-f="morningList" rows="5" style="margin-top:10px">${esc(store.morningList.join('\n'))}</textarea></div>
    <div class="card"><h3>Reminders</h3>${tog('sunrise', 'At sunrise: get outside light')}${tog('habits', '2 h before sunset: habits still open')}${tog('review', '30 min after sunset: sunset review')}${store.teethOn ? tog('teeth', 'Before bed: brush teeth') : ''}${tog('birthdays', '3 days before a birthday, and on the day')}
      <div class="muted" style="margin-top:10px" data-t="notifStatus"></div><div class="muted" style="margin-top:6px">Reminders fire only while Orrery is open (or running in the background on Mac). They're silent: no sound, no vibration.</div></div>
    <div class="card"><h3>Ur data</h3><div class="row"><span class="dot" data-h-bg="saveDot"></span><span data-t="saveLine"></span></div>
      <div class="muted" style="margin-top:8px">Everything lives in this browser's local storage. Nothing is sent anywhere. Another browser or device won't see it, and clearing site data wipes it, so export now and then.</div>
      <div class="row" style="margin-top:12px">${pill('Export backup', 'export', 'blue fill')}${pill('Import backup', 'import')}${pill(confirmReset ? 'Tap again to erase everything' : 'Reset', 'reset')}</div>
      <input type="file" id="importFile" accept="application/json,.json" hidden></div>
    <div class="card"><h3>About</h3><div class="muted">Orrery · a calendar of orbits. Galaxy = Wheel (Sun around Sagittarius A*, 230 My working value). Private, offline, made for Lav.</div><div class="muted" style="margin-top:8px">${esc(MOTTO)}</div></div>
  </div></div>`;
}
function viewDreams() {
  return `${title('Dreams', '')}<div class="card"><div class="row" style="justify-content:space-between"><h3 style="color:#B48CFF;margin:0">✦ Dream journal</h3>${pill('+ Log a dream', 'dreamNew', 'blue fill')}</div>
    <div data-h="dreamStats" style="margin-top:12px"></div>
    <input class="field" data-f="dreamQ" value="${esc(dreamQ)}" placeholder="Search dreams, tags, lucid…" style="margin-top:12px" aria-label="Search dreams">
    <div data-h="dreamList" style="margin-top:10px"></div></div>`;
}
const VIEWS = { dreams: viewDreams, now: viewNow, today: viewToday, cycles: viewCycles, life: viewLife, journal: viewJournal, cosmos: viewCosmos, settings: viewSettings };

// ===================== BINDINGS (text + small html, refreshed every tick) =====================
function miniRingSVG(size, f, col) {
  const r = size / 2 - 8, C = 2 * Math.PI * r, c = size / 2;
  return `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-opacity="0.2" stroke-width="12"/><circle class="ring" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${Math.max(0.01, f * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 ${c} ${c})" opacity="${f > 0 ? 1 : 0}"/>`;
}
function convHTML(S) {
  let t = null;
  if (convMode === 'date') {
    const m = (convDate || '').trim().match(/^(-?\d{1,6})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/);
    if (!convDate.trim()) return '<div class="muted">Type a date to see where it sits in every orbit.</div>';
    if (!m) return '<div class="muted">Try a date like 1969-07-21 01:47.</div>';
    const d = new Date(Date.UTC(2000, 0, 1)); d.setUTCFullYear(+m[1], +m[2] - 1, +m[3]); d.setUTCHours(m[4] ? +m[4] : 12, m[5] ? +m[5] : 0, 0, 0);
    if (isNaN(d.getTime())) return '<div class="muted">That date is out of range.</div>';
    t = (d.getTime() - tz() * 3600000) / 1000 - J2000_S;
  } else {
    const ya = parseFloat(String(convAgo).replace(/,/g, ''));
    if (isNaN(ya)) return '<div class="muted">Type a number of years, like 3300000.</div>';
    t = S.now / 1000 - J2000_S - ya * YJ;
  }
  const ya = (S.now / 1000 - J2000_S - t) / YJ;
  const L = (k, per) => { const v = BASE[k] + t / per; return [Math.floor(v), v - Math.floor(v)]; };
  const [wn, wf] = L('W', WHEEL), [bn, bf] = L('B', BREATH), [tn, tf] = L('T', YS), [, sf] = L('S', SD);
  if (wn < 0) return '<div class="muted">That is before Orbit 0, the birth of the Sun. The Orrery does not count past its own beginning.</div>';
  const day = Math.floor(tf * YS / 86400), deep = ya > 10000;
  const line = `W${wn}:${(wf * 100).toFixed(2)} · B${bn}:${(bf * 100).toFixed(2)} · T${tn.toLocaleString('en-US')} d${day}` + (deep ? '' : ` · S${(sf * 100).toFixed(1)}`);
  return `<div class="code">${line}</div><div class="muted" style="margin-top:6px">${(wf * 360).toFixed(3)}° around Wheel ${wn + 1} · ${ya >= 0 ? fmt(ya) + ' years ago' : fmt(-ya) + ' years from now'}${deep ? '. Spin hidden for dates older than 10,000 years.' : ''}</div>`;
}
function bind(S) {
  const td = S.td, P = store.place, w = wordOfDay(S);
  const deep = deepIdx >= 0 ? `<div class="card" style="text-align:center;font-size:16px;line-height:1.55">${esc(deepMsgs(S)[deepIdx])}<div style="margin-top:10px">${pill('Another', 'deep')} ${pill('Close', 'deepClose')}</div></div>` : '';
  const T = {
    placeLine: `ORRERY · ${P.name.toUpperCase()}`,
    orbitBtn: store.orbit ? 'Flat' : 'Helix',
    greet: S.greet, nowLine: S.nowLine, nowTag: S.nowTag, nextLine: S.nextLine,
    zoneDo: S.isTurnday ? 'Happy Turnday. The Earth is home again.' : S.zoneDo,
    zoneSub: `${S.zoneName} · ${S.sunLine}`,
    n1L: S.isDay ? 'Focus' : 'Rest', n1V: S.isDay ? dur(S.focusMin) : (S.sunLine.replace(/^Sunrise in (about )?/, '')), n1S: S.isDay ? `of ${dur(store.goalMin)}${S.running ? ' · timer on' : ''}` : 'until sunrise. Work can wait.',
    n2L: S.isDay ? 'Now' : 'Journal', n2V: S.isDay ? S.zoneName : ((td.journal || '').trim() ? 'Written ✓' : 'One line'), n2S: S.isDay ? `Sunset stop line ${hm(S.set)}` : ((td.journal || '').trim() ? 'Today is saved.' : 'Tap Journal.'),
    n3L: 'Moon', n3V: phaseName(S.moonDays), n3S: `${S.moonPrompt} · ${(S.illum * 100).toFixed(0)}% lit`,
    n4L: S.isDay ? 'Galaxy' : 'Sleep window', n4V: S.isDay ? `${(S.wf * 100).toFixed(4)}%` : `${hm(S.bedEarly)}–${hm(S.bedLate)}`, n4S: S.isDay ? `${(S.wf * 360).toFixed(3)}° around Sgr A*` : `bed, for 7–9 h before ${hm(S.wakeMin)}`,
    todaySub: `${S.today} · ${S.zoneName} · ${S.sunLine}`,
    focusBig: dur(S.focusMin), focusSub: S.running ? `Timer running: ${dur(S.runMin)} · goal ${dur(store.goalMin)}` : `Goal ${dur(store.goalMin)} · ${Math.round(S.focusF * 100)}% · any block counts`,
    gymBig: `${td.gymMin || 0} min`, gymSub: `Goal ${store.gymGoal} min · ${Math.round(S.gymF * 100)}%`,
    manBig: `${td.mandarin || 0} min`, manSub: `Goal ${store.mandarinGoal} min · ${Math.round(S.manF * 100)}%`,
    waterBig: litres(td.water || 0).replace('L', ' L'), waterSub: `Goal ${litres(store.waterGoal).replace('L', ' L')} · ${Math.round(S.waterF * 100)}% · ${Math.round((td.water || 0) / 250)} glass${Math.round((td.water || 0) / 250) === 1 ? '' : 'es'}`,
    proBig: `${td.protein || 0} g`, proSub: `Goal ${store.proteinGoal} g · ${Math.round(S.proF * 100)}% · ${td.meals.length} meal${td.meals.length === 1 ? '' : 's'} logged`,
    reviewTitle: S.isDay ? 'Sunset review · opens properly after sunset' : 'Sunset review · 2 minutes',
    reviewSum: `Today: ${dur(td.focus)} satisfying work · ${td.gymMin || 0}m gym · ${td.mandarin || 0}m 中文 · ${td.protein || 0}g protein · ${litres(td.water || 0)} water · ${checksOf(td)}/3 checks`,
    wakeLine: S.wakeLogged ? `Awake at ${hm(S.wakeMin)} today` : `Not logged · using sunrise ${hm(S.rise)}`,
    lightLine: `☀︎ Get outside light within 30–60 min of waking, by about ${hm(S.wakeMin + 60)}.`,
    sleepLine: `☾ Sleep window: bed ${hm(S.bedEarly)}–${hm(S.bedLate)} for 7–9 h before a ${hm(S.wakeMin)} wake-up.`,
    zonesLine: S.sun.polar ? 'No normal sunrise or sunset here today.' : `Clearest hours ${hm(S.rise > S.wakeMin ? S.rise : S.wakeMin)}–${hm(S.mEnd)} · dip ${hm(S.mEnd)}–${hm(S.eStart)} · wind-down ${hm(S.eStart)}–${hm(S.set)}. A rule of thumb, not lab science.`,
    cyclesSub: `Moon day ${S.moonDays.toFixed(1)} of 29.5 · Turn ${(S.tf * 100).toFixed(2)}%`,
    moonName: phaseName(S.moonDays), moonSub: `Day ${S.moonDays.toFixed(1)} of 29.5 · ${S.moonPrompt}`, intLabel: `This Moon's intention (Moon from ${S.moonKey})`,
    turnTitle: `Turn ${String(S.tn).slice(-3)} · ${(S.tf * 100).toFixed(3)}%`, turnSub: `Started ${S.turnStartKey}. Next Turnday ${S.nextTurnday}. Each logged day is a dot on the Turn ring in Cosmos.`,
    mirrorTitle: S.isTurnday ? "Yearly Mirror · it's Turnday!" : 'Yearly Mirror · so far this Turn',
    lifeSub: S.birthOk ? `Age ${S.ageY.toFixed(2)}` : 'Add ur birth date in Settings',
    lifeBig: S.birthOk ? `${(S.lifeF * 100).toFixed(1)}%` : '—', lifeSub2: S.birthOk ? `of an ${store.lifeYears}-year life · about ${S.summers} summers left to spend well` : 'The purple ring fills once u add ur birth date in Settings.',
    galaxyLine: `We are ${(S.wf * 100).toFixed(4)}% around Wheel 20, ${(S.wf * 360).toFixed(3)}°. A whole life is a sliver of a sliver. Not a reason to feel small, a reason not to waste the light.`,
    firstsWeek: S.weekFirsts ? `This week: ${S.weekFirsts} first${S.weekFirsts > 1 ? 's' : ''} ✓ Time is getting longer.` : 'No first yet this week. A new street, a new dish, a new song all count.',
    journalSub: `${Object.values(store.days).filter((d) => (d.journal || '').trim()).length} lines so far`,
    cosmosSub: `${S.notation}`, notation: S.notation,
    placeNow: `Now: ${P.name} (${(+P.lat).toFixed(4)}, ${(+P.lon).toFixed(4)}, UTC${P.tz >= 0 ? '+' : ''}${P.tz})`,
    notifStatus: !('Notification' in window) ? 'This browser has no notifications. Reminders will show inside the app.' : `Notification permission: ${Notification.permission}.`,
    saveLine: canSave ? `Saving on this device${lastSaved ? ', last saved ' + hm(((lastSaved / 60000 + tz() * 60) % 1440)) : ''}` : 'Saving is blocked in this browser. Export before u leave.',
  };
  store.goals.forEach((g, i) => { T['gp' + i] = g.pct + '%'; });
  const BG = {};
  store.people.forEach((p) => {
    const since = p.last ? Math.floor((kms(S.today) - kms(p.last)) / 86400000) : -1, fresh = since >= 0 && since <= p.every;
    const bd = S.bdays.find((b) => b.p.id === p.id);
    const bdTxt = bd ? (bd.days === 0 ? ' · 🎂 birthday today' : bd.days <= 14 ? ` · 🎂 birthday in ${bd.days} day${bd.days > 1 ? 's' : ''}` : '') : '';
    T['ps_' + p.id] = (since < 0 ? 'Not logged yet' : fresh ? (since === 0 ? 'Talked today' : `Talked ${since} day${since > 1 ? 's' : ''} ago`) : `Been ${since} days, a good time to say hi`) + bdTxt;
    BG['pd_' + p.id] = fresh ? COL.green : '#636366';
  });
  store.shape.forEach((b) => { const st = blockStart(b, S); T['blkT_' + b.id] = `${hm(st)}–${hm(st + (+b.len || 0))}`; });
  $$('[data-bg]').forEach((el) => { const v = BG[el.dataset.bg]; if (v && el.style.background !== v) el.style.background = v; });
  $$('[data-t]').forEach((el) => { const v = T[el.dataset.t]; if (v !== undefined && el.textContent !== v) el.textContent = v; });

  const meals = td.meals.length ? td.meals.map((m, i) => `<div class="meal"><span>${esc(m.text || 'Meal')}</span><span class="mono">${m.g} g <button class="pill" style="padding:4px 10px;font-size:12px" data-act="delMeal:${i}">✕</button></span></div>`).join('') : '<div class="muted">No meals logged today.</div>';
  const people = store.people.length ? store.people.map((p) => {
    const since = p.last ? Math.floor((kms(S.today) - kms(p.last)) / 86400000) : -1, fresh = since >= 0 && since <= p.every;
    return `<div class="person"><span class="dot" style="background:${fresh ? COL.green : '#636366'};${fresh ? `box-shadow:0 0 8px ${COL.green}` : 'opacity:.6'}"></span><div style="flex:1;min-width:120px"><div style="font-weight:600">${esc(p.name)}</div><div class="muted">${since < 0 ? `Every ${p.every} days · not logged yet` : fresh ? `Every ${p.every} days · ${since === 0 ? 'today' : since + ' days ago'}` : `Every ${p.every} days · been ${since} days, a good time to say hi`}</div></div>${pill('Talked today', 'talk:' + p.id)}${pill('✕', 'delPerson:' + p.id)}</div>`;
  }).join('') : '<div class="muted">No one here yet. Add a few people u want to stay close to.</div>';
  const mr = S.mr;
  const H = {
    deep,
    word: `<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-size:34px;font-weight:700">${w[0]}</span><span style="font-size:18px;color:${COL.orange}">${esc(w[1])}</span><span class="muted">${esc(w[2])} · HSK ${w[3]}</span></div>`,
    chips: `<div class="chip"><span class="dot" style="background:${COL.blue}"></span><b>Galaxy</b> ${(S.wf * 100).toFixed(4)}% · ${(S.wf * 360).toFixed(3)}°</div><div class="chip"><span class="dot" style="background:${COL.cyan}"></span><b>Moon</b> ${(S.moonP * 100).toFixed(1)}% · ${(S.moonP * 360).toFixed(1)}°</div>`,
    orrChips: `<div class="chip"><span class="dot" style="background:${COL.red}"></span><b>Wheel</b> ${(S.wf * 100).toFixed(4)}% · ${(S.wf * 360).toFixed(3)}°</div><div class="chip"><span class="dot" style="background:${COL.green}"></span><b>Breath</b> ${(S.bf * 100).toFixed(4)}% · ${(S.bf * 360).toFixed(2)}°</div><div class="chip"><span class="dot" style="background:${COL.yellow}"></span><b>Turn</b> ${(S.tf * 100).toFixed(4)}% · ${(S.tf * 360).toFixed(3)}°</div><div class="chip"><span class="dot" style="background:${COL.cyan}"></span><b>Moon</b> ${(S.mf * 100).toFixed(3)}% · ${(S.mf * 360).toFixed(1)}°</div><div class="chip"><span class="dot" style="background:#fff"></span><b>Spin</b> ${(S.sf * 100).toFixed(2)}% · ${(S.sf * 360).toFixed(1)}°</div>`,
    checks: [['made', 'Made something?'], ['connected', 'Connected with someone?'], ['learned', 'Learned or felt something new?']].map(([k, l]) => `<button class="check ${td[k] ? 'on' : ''}" data-act="chk:${k}"><span class="box">${td[k] ? '✓' : ''}</span><span>${l}</span></button>`).join(''),
    timerBtn: S.running ? pill('Stop timer', 'stop', 'green fill') : pill('Start timer', 'start', 'green fill'),
    meals, people,
    moonIcon: moonGlyph(28, 28, 24, S.moonP, '#F2F2F7', '#1C1C1E', '#3A3A3C'),
    moonReview: mr.n === 0 && mr.firsts === 0 ? '<div class="muted">Nothing logged yet this Moon. That\'s fine. The review fills itself as u go.</div>'
      : `<div class="stats4">${[['Satisfying work', dur(mr.focus)], ['Gym days', mr.gym], ['中文', mr.mandarin + ' min'], ['Water at goal', `${mr.waterDays} day${mr.waterDays === 1 ? '' : 's'}${mr.waterAvg ? ' · avg ' + litres(Math.round(mr.waterAvg / 50) * 50) : ''}`], ['Protein days', mr.protein.length ? `${mr.protein.length} · avg ${Math.round(mr.protein.reduce((a, [, d]) => a + d.protein, 0) / mr.protein.length)} g` : '0'], ['High-sugar days', mr.sugarHigh], ['Checks hit', mr.checks], ['Journal lines', mr.journal], ['Firsts', mr.firsts], ['Days logged', mr.n]].map(([l, v]) => `<div><div class="n">${v}</div><div class="muted">${l}</div></div>`).join('')}</div>${store.intentions[S.moonKey] ? `<div class="muted" style="margin-top:12px">Intention: "${esc(store.intentions[S.moonKey])}". Did this Moon serve it?</div>` : ''}`,
    mirror: S.turnDays.length === 0 ? '<div class="muted">No days logged this Turn yet. The mirror fills as u live.</div>'
      : `<div style="display:flex;flex-direction:column;gap:8px;font-size:15px"><div>Days logged: ${S.turnDays.length}</div><div>${S.bestWd >= 0 && S.bestAvg > 0 ? `Best day for satisfying work: ${WEEKDAYS[S.bestWd]}s, ${dur(S.bestAvg)} on average` : 'Best day for satisfying work: nothing logged yet'}</div><div>${S.heavy && S.heavy[1] > 0 ? `Fullest Moon: the one from ${S.heavy[0]}, ${dur(S.heavy[1])} of satisfying work` : 'Fullest Moon: not enough logged yet'}</div><div>${S.alive.length ? `Most alive days (all 3 checks): ${S.alive.length}, latest ${S.alive.slice(0, 3).join(', ')}` : 'Most alive days: none with all 3 checks yet'}</div></div>`,
    lifeRing: miniRingSVG(96, S.lifeF, COL.purple),
    firsts: store.firsts.length ? store.firsts.map((f, i) => `<div class="meal"><span><span class="muted mono" style="margin-right:8px">${f.date}</span>${esc(f.text)}</span><button class="pill" style="padding:4px 10px;font-size:12px" data-act="delFirst:${i}">✕</button></div>`).join('') : '<div class="muted">Empty for now. The first first is the best first.</div>',
    journalList: (() => { const e = Object.entries(store.days).filter(([, d]) => (d.journal || '').trim()).sort((a, b) => b[0].localeCompare(a[0])); return e.length ? e.map(([k, d]) => `<div class="meal" style="display:block"><div class="muted mono">${k}</div><div style="margin-top:2px">${esc(d.journal)}</div></div>`).join('') : '<div class="muted">No lines yet. Tonight\'s will be the first.</div>'; })(),
    conv: convHTML(S),
    ctx: ctxHTML(S), quick: quickHTML(S),
    choreList: choreListHTML(S),
    dreamStats: dreamStatsHTML(), dreamList: dreamListHTML(),
    sugarSeg: ['low', 'med', 'high'].map((k) => `<button data-act="sugar:${k}" class="${td.sugar === k ? 'on' : ''}">${k === 'med' ? 'Medium' : k[0].toUpperCase() + k.slice(1)}</button>`).join(''),
    shapeList: S.shape.map((b) => { const isNow = S.nowBlock && S.nowBlock.id === b.id; return `<div class="shape-row ${isNow ? 'now' : ''}"><span class="dot" style="background:${b.col}"></span><span class="mono">${hm(b.start)}–${hm(b.end)}</span><span class="nm">${esc(b.name)}</span>${isNow ? '<span class="tag">now</span>' : S.nextBlock && S.nextBlock.id === b.id ? '<span class="tag nx">next</span>' : ''}</div>`; }).join('') || '<div class="muted">No blocks yet. Add one below.</div>',
  };
  $$('[data-h]').forEach((el) => { const v = H[el.dataset.h]; if (v !== undefined && el._h !== v) { el.innerHTML = v; el._h = v; } });
  $$('[data-w="turn"]').forEach((el) => { el.style.width = (S.tf * 100).toFixed(2) + '%'; });
  $$('[data-h-bg="saveDot"]').forEach((el) => { el.style.background = canSave ? COL.green : '#636366'; });
  $$('[data-h-class="reviewCard"]').forEach((el) => { el.style.borderColor = S.isDay ? '' : 'rgba(255,100,130,.5)'; });
  $$('[data-h-class="mirrorCard"]').forEach((el) => { el.style.borderColor = S.isTurnday ? 'rgba(255,214,10,.6)' : ''; });
}

// ===================== SHEET (tap a ring) =====================
function sheetHTML(kind, S) {
  const head = (t, c) => `<div class="row" style="justify-content:space-between"><div style="font-size:22px;font-weight:700;color:${c}">${t}</div>${pill('Done', 'closeSheet', 'on')}</div>`;
  switch (kind) {
    case 'focus': return head('Satisfying work', COL.green) + focusCard();
    case 'goal': return head('Plot a goal', COL.yellow) + `<div class="card"><div class="muted">Three questions. Short answers are best.</div>
      <label class="lbl">1 · What would make this Turn feel well spent?<input class="field" id="gName" placeholder="e.g. Run a 10 km, ship my first product"></label>
      <label class="lbl">2 · How will u know it's done?<input class="field" id="gDone" placeholder="e.g. A 10 km on the watch"></label>
      <label class="lbl">3 · What's the smallest first step this week?<input class="field" id="gStep" placeholder="e.g. Two easy 3 km runs"></label>
      <div class="row" style="margin-top:14px">${pill('Plot it', 'goalAdd', 'yellow fill')}</div></div>`;
    case 'gym': return head('Gym', COL.pink) + gymCard(S);
    case 'mandarin': return head('Mandarin', COL.orange) + mandarinCard(S);
    case 'protein': return head('Protein', COL.purple) + proteinCard(S);
    case 'water': return head('Water', COL.water) + waterCard();
    case 'quick': return quickSheet();
    case 'dream': return (store.quiet && !dreamMore ? '' : head('Dream journal', '#B48CFF')) + dreamSheet();
    case 'moon': return head('Moon', COL.cyan) + `<div class="card"><div style="font-size:20px;font-weight:700" data-t="moonName"></div><div class="muted" data-t="moonSub"></div><label class="lbl"><span data-t="intLabel"></span><input class="field" data-f="intention" value="${esc(store.intentions[S.moonKey] || '')}" placeholder="One thing this Moon is for…"></label></div>`;
    case 'wheel': return head('Galaxy', COL.red) + `<div class="card"><div style="font-size:15px;line-height:1.55" data-t="galaxyLine"></div><div style="margin-top:12px">${pill('✦ Deep Look', 'deep', 'blue fill')}</div><div data-h="deep"></div></div>`;
    case 'sun': return head('Sun dial', COL.yellow) + lightCard() + journalCard(S);
    case 'turn': case 'breath': case 'life': return head(kind[0].toUpperCase() + kind.slice(1), COL.yellow) + `<div class="card"><div class="muted" data-t="${kind === 'life' ? 'lifeSub2' : 'turnSub'}"></div></div>`;
    default: return head('', '#fff');
  }
}
function openSheet(kind) {
  sheet = kind;
  const S = compute(Date.now());
  const el = $('#sheet');
  $('#sheetBody').innerHTML = sheetHTML(kind, S);
  el.classList.toggle('compact', kind === 'quick');
  el.classList.add('open');
  bind(S);
}
function closeSheet() { if (sheet === 'quick') { qa = null; drawGhost(null); choreVer++; } sheet = null; $('#sheet').classList.remove('open'); $('#sheet').classList.remove('compact'); }

// ===================== RENDER + TICK =====================
function renderTop() {
  const seg = tab === 'now' ? `<div class="tb-seg desk-only" role="group" aria-label="View"><button class="${store.orbit ? 'on' : ''}" data-act="orbitSet:1" aria-label="Helix" title="Helix (Space)">${ORBIT_ICON.split('</svg>')[0]}</svg></button><button class="${store.orbit ? '' : 'on'}" data-act="orbitSet:0" aria-label="Dial" title="Dial (Space)"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="4" r="2" fill="currentColor"/></svg></button></div>` : '';
  $('#topbar').innerHTML = `<div class="tb-l">${seg}</div><div class="tb-r">` + TOP.map(([id, label, icon]) => `<button class="topbtn mob-only ${tab === id ? 'on' : ''}" data-act="tab:${id}" aria-label="${label}" title="${label}">${icon}</button>`).join('')
    + `<button class="topbtn desk-only" data-act="palette" aria-label="Command palette" title="Command palette (⌘K)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/></svg></button>`
    + (tab === 'now' ? `<button class="topbtn desk-only ${store.insp ? 'on' : ''}" data-act="insp" aria-label="Inspector" title="Inspector"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg></button>` : '') + '</div>';
}
function renderTabs() {
  renderTop();
  const btn = ([id, label, icon], i, extra = '') => `<button class="tab ${tab === id ? 'on' : ''} tab-${id} ${extra}" data-act="tab:${id}" aria-label="${label}" data-tip="${label}" data-key="${i != null ? '⌘' + (i + 1) : id === 'settings' ? '⌘,' : ''}">${icon}<span>${label}</span></button>`;
  $('#tabs').innerHTML = `<div class="brand">Orrery</div><div class="brand-sub">A calendar of orbits</div>` +
    TABS.map((t, i) => btn(t, i)).join('') + `<div class="side-spacer"></div>` + btn(TOP[0], null, 'desk-only') + btn(TOP[1], null, 'desk-only tab-bottom');
}
const FORCE_MINI = /[?&#]mini\b/.test(location.search + location.hash);
const isDesk = () => window.matchMedia && matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
const miniOn = () => (store.mini || FORCE_MINI) && innerWidth <= 480 && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
const inspOn = () => isDesk() && tab === 'now' && store.insp && !miniOn();
function layoutClasses() {
  const b = document.body.classList;
  b.toggle('mini', miniOn()); b.toggle('insp-on', inspOn()); b.toggle('desk', isDesk());
  b.toggle('wco', !!(navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible));
}
function render() {
  if (miniOn() && tab !== 'now') tab = 'now';
  const S = compute(Date.now());
  layoutClasses();
  $('#view').innerHTML = `<div class="view view-${tab}">${VIEWS[tab](S)}</div>`;
  renderTabs();
  tick();
  if (tab === 'now') renderInsp();
}
function tick() {
  const S = compute(Date.now());
  if (tab === 'now') {
    updateFace('now', RING_ORDER, RINGS, 'zones', S);
    const tr = document.getElementById('tray'), tk = `${choreVer}|${S.today}|${PAL.name}`;
    if (tr && tr.dataset.k !== tk) { tr.innerHTML = trayHTML(S); tr.dataset.k = tk; }
    const ni = document.getElementById('nextIcons'), nk = `${choreVer}|${Math.floor(S.now / 60000)}`;
    if (ni && ni.dataset.k !== nk) { ni.innerHTML = nextIconsHTML(S); ni.dataset.k = nk; }
    const ins = document.getElementById('insp'); if (ins && inspOn() && ins.dataset.v !== String(choreVer)) renderInsp();
  }
  if (tab === 'cosmos') updateFace('orr', ORRERY_ORDER, ORRERY_RINGS, 'day', S);
  bind(S);
  reminders(S);
}

// ===================== REMINDERS (in-app scheduling, silent) =====================
function notify(title, body) {
  const opts = { body, silent: true, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title };
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(() => new Notification(title, opts));
      else new Notification(title, opts);
      return;
    }
  } catch (e) { /* fall through to toast */ }
  toast(`${title}: ${body}`, 1);
}
function reminders(S) {
  if (S.sun.polar) return;
  const R = store.reminders, done = store.notified[S.today] || {};
  const due = [];
  if (R.sunrise && !done.sunrise && S.nowMin >= S.rise && S.nowMin < S.rise + 30) due.push(['sunrise', 'Sunrise', 'The sun is up. Get outside light in the next 30–60 minutes.']);
  if (R.review && !done.review && S.nowMin >= S.set + 30 && S.nowMin < S.set + 120) due.push(['review', 'Sunset review', 'Two minutes. One line about today.']);
  const open = [S.focusF < 1 && 'satisfying work', S.gymF < 1 && 'gym', S.manF < 1 && '中文', S.proF < 1 && 'protein', S.waterF < 1 && 'water'].filter(Boolean);
  if (R.habits && !done.habits && open.length && S.nowMin >= S.set - 120 && S.nowMin < S.set - 60) due.push(['habits', 'Habits still open', `Still open: ${open.join(', ')}. No pressure. The light is still here.`]);
  if (R.teeth && store.teethOn && !S.brushed && !done.teeth && wrap(S.nowMin - (S.bed - 45)) < 90) due.push(['teeth', 'Teeth, then sleep', 'Two minutes of brushing. Ur future dentist sends regards.']);
  if (R.birthdays && S.nowMin >= 540) S.bdaySoon.forEach((b) => { const k = `bd_${b.p.id}_${b.days}`; if ((b.days === 3 || b.days === 0) && !done[k]) due.push([k, b.days ? 'Birthday coming up' : 'Birthday today', bdayLine(b)]); });
  if (!due.length) return;
  due.forEach(([k, t, b]) => { done[k] = true; notify(t, b); });
  store.notified = { [S.today]: done };
  save();
}
let toastTimer = null; const toastQ = [];
function toast(msg, must) { if (store.quiet && !must) return; toastQ.push(msg); if (!toastTimer) nextToast(); }
function nextToast() {
  const el = $('#toast'), msg = toastQ.shift();
  if (!msg) { el.classList.remove('show'); toastTimer = null; return; }
  el.textContent = msg; el.classList.add('show');
  toastTimer = setTimeout(() => { el.classList.remove('show'); toastTimer = setTimeout(nextToast, 350); }, 3400);
}

// ===================== ACTIONS =====================
function openChoreEditor() { const d = $$('#view details.sub').find((x) => /Edit chores/.test(x.textContent)); if (d) d.open = true; }
function changeDay(fn) { const d = dayOf(dkey(Date.now())); fn(d); save(); tick(); }
function exportData() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `orrery-backup-${dkey(Date.now())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup downloaded.', 1);
}
function act(a) {
  const [cmd, arg, arg2] = a.split(':');
  const num = parseFloat(arg);
  switch (cmd) {
    case 'tab': tab = arg; closeSheet(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); history.replaceState(null, '', '#' + arg); return;
    case 'sheet': openSheet(arg); return;
    case 'closeSheet': closeSheet(); return;
    case 'awake': {
      changeDay((d) => { const S = compute(Date.now()); d.wake = Math.round(S.nowMin); });
      toast('Good morning. Light first, then the hard thing.');
      dreamDraft = newDream(); dreamMore = false;
      if (!store.dreams.some((x) => x.date === dreamDraft.date)) openSheet('dream');
      return;
    }
    case 'dreamNew': dreamDraft = newDream(); dreamMore = false; openSheet('dream'); return;
    case 'drMore': dreamMore = true; openSheet('dream'); return;
    case 'quiet': store.quiet = !store.quiet; save(); applyPalette(); render(); return;
    case 'drVivid': dreamDraft.vivid = clamp(num, 1, 5); openSheet('dream'); return;
    case 'drTag': { const t = dreamDraft.tags; dreamDraft.tags = t.includes(arg) ? t.filter((x) => x !== arg) : [...t, arg]; if (arg === 'lucid') dreamDraft.lucid = dreamDraft.tags.includes('lucid'); openSheet('dream'); return; }
    case 'drLucid': dreamDraft.lucid = !dreamDraft.lucid; if (dreamDraft.lucid && !dreamDraft.tags.includes('lucid')) dreamDraft.tags.push('lucid'); if (!dreamDraft.lucid) dreamDraft.tags = dreamDraft.tags.filter((x) => x !== 'lucid'); openSheet('dream'); return;
    case 'dreamSave': {
      const d = dreamDraft || newDream();
      if (!d.text.trim() && !d.title.trim()) { toast('Even one word counts. Write what u remember.', 1); return; }
      store.dreams.push({ id: 'd' + Date.now(), date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : dkey(Date.now()), title: d.title.trim(), text: d.text.trim(), vivid: d.vivid, tags: [...d.tags], lucid: d.lucid, at: Date.now() });
      dreamDraft = null; save(); closeSheet(); tick(); toast('Dream caught ✦'); return;
    }
    case 'dreamDel': store.dreams = store.dreams.filter((x) => x.id !== arg); save(); tick(); return;
    case 'focus': changeDay((d) => { d.focus = Math.max(0, d.focus + num); }); return;
    case 'gym': changeDay((d) => { d.gymMin = Math.max(0, (d.gymMin || 0) + num); d.gym = d.gymMin > 0; }); return;
    case 'water': changeDay((d) => { d.water = Math.max(0, (d.water || 0) + num); }); return;
    case 'man': changeDay((d) => { d.mandarin = Math.max(0, (d.mandarin || 0) + num); }); return;
    case 'start': store.timer = Date.now(); save(); tick(); return;
    case 'stop': if (store.timer !== null) { const m = Math.min(600, Math.max(0, (Date.now() - store.timer) / 60000)); store.timer = null; changeDay((d) => { d.focus += Math.round(m); }); } return;
    case 'chk': changeDay((d) => { d[arg] = !d[arg]; }); return;
    case 'peek': {
      const pk = $('#now-peek'); if (!pk) return; pk.classList.add('show'); clearTimeout(window.__peekT); window.__peekT = setTimeout(() => pk.classList.remove('show'), 3200); return;
    }
    case 'orbit': {
      store.orbit = !store.orbit; save(); choreVer++;
      const f = $('#nowFace'); if (f) { f.classList.toggle('orbit-on', store.orbit); const b = f.querySelector('.orbit-btn'); if (b) b.setAttribute('aria-pressed', store.orbit); }
      renderTop(); tick(); return;
    }
    case 'orbitSet': if (!!store.orbit !== (arg === '1')) act('orbit'); return;
    case 'qaPick': qaPicker = !qaPicker; showQuick(); return;
    case 'qaMore': qaEmoji = !qaEmoji; qaPicker = true; showQuick(); return;
    case 'qaGly': if (qa) { const e = Object.keys(GLYPH_OF).find((k) => GLYPH_OF[k] === arg); const full = CHORE_ICONS.find((c) => c.replace(/[\uFE0F\u200D]/g, '').startsWith(e)) || e; if (full) qa.icon = full; showQuick(); } return;
    case 'chore': {
      const c = store.chores.find((x) => x.id === arg); if (!c) return;
      const k = arg2 || dkey(Date.now()), d = dayOf(k); d.chores = d.chores || {}; d.chores[c.id] = !d.chores[c.id]; save(); choreVer++; tick();
      const S = compute(Date.now()), nx = choreNext(c, S), st = choreStreak(c, S);
      toast(d.chores[c.id] ? `${c.icon} ${c.name} ✓${st > 1 ? ` · streak ${st}` : ''}${nx ? ` · next ${nx.label}` : ''}` : `${c.icon} ${c.name} unticked${nx ? ` · next ${nx.label}` : ''}`);
      return;
    }
    case 'teethOn': store.teethOn = !store.teethOn; save(); choreVer++; render(); return;
    case 'brushOn': { const d = dayOf(arg); d.brushed = !d.brushed; save(); choreVer++; tick(); toast(d.brushed ? '🦷 Teeth ✓' : '🦷 Teeth unticked'); return; }
    case 'choreAdd': { const S = compute(Date.now()); store.chores.push({ id: 'c' + Date.now(), icon: '✨', name: 'New chore', time: Math.min(1439, (Math.floor(S.nowMin / 60) + 1) * 60), repeat: 'daily', created: S.today, cat: 'life', len: 0 }); save(); choreVer++; render(); openChoreEditor(); return; }
    case 'choreDel': store.chores = store.chores.filter((c) => c.id !== arg); save(); choreVer++; render(); openChoreEditor(); return;
    case 'choreDay': store.chores = store.chores.map((c) => { if (c.id !== arg) return c; const ds = new Set(c.days || []), n = +arg2; if (ds.has(n)) ds.delete(n); else ds.add(n); return { ...c, days: [...ds].sort() }; }); save(); choreVer++; render(); openChoreEditor(); return;
    case 'qaIcon': if (qa) { qa.icon = CHORE_ICONS[+arg] || qa.icon; showQuick(); } return;
    case 'qaCat': if (qa) { qa.cat = ['life', 'work', 'both'].includes(arg) ? arg : 'life'; showQuick(); } return;
    case 'qaRep': if (qa) { qa.repeat = arg; showQuick(); } return;
    case 'qaDay': if (qa) { const ds = new Set(qa.days), n = +arg; if (ds.has(n)) ds.delete(n); else ds.add(n); qa.days = [...ds]; showQuick(); } return;
    case 'qaLen': if (qa) { qa.len = +arg || 0; showQuick(); } return;
    case 'qaN': if (qa) { qa.n = clamp((+qa.n || 2) + num, 2, 60); showQuick(); } return;
    case 'qaSave': saveQuick(); return;
    case 'qaClose': if (sheet === 'quick') closeSheet(); else clearQuick(); return;
    case 'qaDel': if (!qa || !qa.id) return; if (!qaConfirmDel) { qaConfirmDel = true; showQuick(); return; } store.chores = store.chores.filter((c) => c.id !== qa.id); if (sheet === 'quick') closeSheet(); clearQuick(); choreVer++; save(); tick(); return;
    case 'cmMove': hideChoreMenu(); moveMode = { id: arg }; $('#nowFace')?.classList.add('moving'); return;
    case 'cmEdit': hideChoreMenu(); selK = arg2 || null; openQuick(null, arg); return;
    case 'insp': store.insp = !store.insp; save(); render(); return;
    case 'palette': openPalette(); return;
    case 'keys': openKeys(); return;
    case 'mini': store.mini = !store.mini; save(); render(); return;
    case 'appear': store.appearance = ['dark', 'system', 'light'].includes(arg) ? arg : 'dark'; save(); applyPalette(); render(); return;
    case 'cmDel': { const b = document.querySelector(`#cmenu [data-act="cmDel:${arg}"]`); if (!cmConfirm) { cmConfirm = true; if (b) { b.classList.add('danger'); b.textContent = '?'; } return; } hideChoreMenu(); store.chores = store.chores.filter((c) => c.id !== arg); if (qa && qa.id === arg) clearQuick(); choreVer++; save(); tick(); return; }
    case 'choreCat': store.chores = store.chores.map((c) => (c.id === arg ? { ...c, cat: ['life', 'work', 'both'].includes(arg2) ? arg2 : 'life' } : c)); save(); choreVer++; render(); openChoreEditor(); return;
    case 'editChores': tab = 'today'; render(); history.replaceState(null, '', '#today'); openChoreEditor(); return;
    case 'pal': store.palette = PALETTES[arg] || arg === 'custom' ? arg : DEFAULT_PALETTE; save(); applyPalette(); render(); toast(`Palette: ${resolvePalette(store.palette, store.custom).name}.`); return;
    case 'palReset': store.custom = {}; save(); applyPalette(); render(); return;
    case 'brush': { const S = compute(Date.now()), d = dayOf(S.nightKey); d.brushed = !d.brushed; choreVer++; save(); tick(); if (d.brushed) toast('Teeth ✓. Sleep well. I have the orbits.'); return; }
    case 'morn': changeDay((d) => { const k = store.morningList[num]; if (k) d.morning[k] = !d.morning[k]; }); return;
    case 'sugar': changeDay((d) => { d.sugar = d.sugar === arg ? null : arg; }); return;
    case 'goalAdd': {
      const name = ($('#gName').value || '').trim(); if (!name) { toast('Start with question 1. Rough is fine.', 1); return; }
      store.goals.push({ name, done: ($('#gDone').value || '').trim(), step: ($('#gStep').value || '').trim(), pct: 0 }); save(); closeSheet(); render(); toast('Plotted. This Turn has a direction.'); return;
    }
    case 'goalDel': store.goals.splice(num, 1); save(); render(); return;
    case 'blkNudge': store.shape = store.shape.map((b) => (b.id === arg ? { ...b, off: (+b.off || 0) + (+arg2 || 0) } : b)); save(); tick(); return;
    case 'blkDel': store.shape = store.shape.filter((b) => b.id !== arg); save(); render(); return;
    case 'blkAdd': { const S = compute(Date.now()); store.shape.push({ id: 'b' + Date.now(), kind: 'custom', name: 'New block', anchor: 'wake', off: Math.round(wrap(S.nowMin - S.wakeMin + 30) / 15) * 15, len: 30 }); save(); render(); return; }
    case 'blkReset': store.shape = DEFAULT_SHAPE.map((b) => ({ ...b })); save(); render(); toast('Back to the default rhythm.'); return;
    case 'meal': {
      const g = parseFloat(($('#mealG') || {}).value), text = (($('#mealText') || {}).value || '').trim();
      if (isNaN(g) || g < 0) { toast('Type the protein grams first.', 1); return; }
      changeDay((d) => { d.meals.push({ text, g: Math.round(g), at: Date.now() }); d.protein = d.meals.reduce((s, m) => s + m.g, 0); });
      $('#mealG').value = ''; $('#mealText').value = ''; return;
    }
    case 'delMeal': changeDay((d) => { d.meals.splice(num, 1); d.protein = d.meals.reduce((s, m) => s + m.g, 0); }); return;
    case 'deep': deepIdx = (deepIdx + 1) % 6; tick(); return;
    case 'deepClose': deepIdx = -1; tick(); return;
    case 'addFirst': { const v = ($('#firstText').value || '').trim(); if (!v) return; store.firsts.unshift({ date: dkey(Date.now()), text: v }); $('#firstText').value = ''; save(); tick(); return; }
    case 'delFirst': store.firsts.splice(num, 1); save(); tick(); return;
    case 'addPerson': { const n = ($('#pName').value || '').trim(); if (!n) return; store.people.push({ id: 'p' + Date.now(), name: n, every: parseInt($('#pEvery').value, 10) || 7, last: '', bday: '' }); save(); render(); return; }
    case 'talk': store.people = store.people.map((p) => (p.id === arg ? { ...p, last: dkey(Date.now()) } : p)); save(); tick(); return;
    case 'delPerson': store.people = store.people.filter((p) => p.id !== arg); save(); render(); return;
    case 'conv': convMode = arg; render(); return;
    case 'rem': {
      store.reminders[arg] = !store.reminders[arg]; save();
      if (store.reminders[arg] && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(() => render());
      render(); return;
    }
    case 'geo':
      if (!navigator.geolocation) { toast('No location on this device.', 1); return; }
      navigator.geolocation.getCurrentPosition((p) => {
        store.place = { lat: +p.coords.latitude.toFixed(4), lon: +p.coords.longitude.toFixed(4), tz: -new Date().getTimezoneOffset() / 60, name: 'My location' };
        save(); render(); toast('Location set.', 1);
      }, () => toast('Location was not allowed. Staying put.', 1), { timeout: 10000 });
      return;
    case 'pune': store.place = { ...DEFAULT_PLACE }; save(); render(); return;
    case 'export': exportData(); return;
    case 'import': $('#importFile').click(); return;
    case 'reset': if (confirmReset) { store = emptyStore(); confirmReset = false; save(); applyPalette(); toast('Fresh start.', 1); } else { confirmReset = true; setTimeout(() => { confirmReset = false; }, 5000); } render(); return;
    default: return;
  }
}
function field(f, v) {
  const [k, i] = f.split(':');
  const d = () => dayOf(dkey(Date.now()));
  const n = parseFloat(v);
  switch (k) {
    case 'journal': d().journal = v; break;
    case 'gymNote': d().gymNote = v; break;
    case 'intention': { const S = compute(Date.now()); store.intentions[S.moonKey] = v; break; }
    case 'goalName': store.goals[+i].name = v; break;
    case 'goalPct': store.goals[+i].pct = parseInt(v, 10) || 0; break;
    case 'birth': store.birth = v.trim(); break;
    case 'lifeYears': if (n > 0) store.lifeYears = n; break;
    case 'goalH': if (n > 0) store.goalMin = Math.round(n * 60); break;
    case 'waterGoalL': if (n > 0) store.waterGoal = Math.round(n * 1000); break;
    case 'gymGoal': case 'mandarinGoal': case 'proteinGoal': if (n > 0) store[k] = n; break;
    case 'lat': if (!isNaN(n) && Math.abs(n) <= 90) store.place = { ...store.place, lat: n, name: 'Custom' }; break;
    case 'lon': if (!isNaN(n) && Math.abs(n) <= 180) store.place = { ...store.place, lon: n, name: 'Custom' }; break;
    case 'tz': if (!isNaN(n) && Math.abs(n) <= 14) store.place = { ...store.place, tz: n, name: 'Custom' }; break;
    case 'qa': if (!qa) return;
      if (i === 'name') qa.name = v;
      else if (i === 'k') { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) qa.k = v; }
      else if (i === 'm') { const mm = /^(\d{1,2}):(\d{2})/.exec(v); if (mm) qa.m = clamp(+mm[1] * 60 + +mm[2], 0, 1439); }
      else if (i === 'n') { const n2 = parseInt(v, 10); if (n2 >= 2) qa.n = n2; }
      else if (i === 'len') { const n2 = parseInt(v, 10); qa.len = n2 >= 0 ? clamp(n2, 0, 600) : 0; $$('[data-f="qa:len"]').forEach((r) => { r.style.setProperty('--f', (qa.len / 180 * 100).toFixed(1) + '%'); const o = r.parentNode.querySelector('output'); if (o) o.textContent = qa.len ? durTxt(qa.len) : '—'; }); }
      return;
    case 'choreLen': { const n2 = parseInt(v, 10); if (!(n2 >= 0)) return; store.chores = store.chores.map((c) => (c.id === i ? { ...c, len: clamp(n2, 0, 600) } : c)); choreVer++; save(); tick(); return; }
    case 'choreIcon': case 'choreName': case 'choreTime': case 'choreRep': case 'choreN': case 'choreStart': case 'choreWd': case 'choreDate': {
      const key = { choreIcon: 'icon', choreName: 'name', choreTime: 'time', choreRep: 'repeat', choreN: 'n', choreStart: 'start', choreWd: 'wd', choreDate: 'date' }[k];
      let val = v;
      if (key === 'time') { const m = /^(\d{1,2}):(\d{2})/.exec(v); if (!m) return; val = clamp(+m[1] * 60 + +m[2], 0, 1439); }
      if (key === 'n') { val = parseInt(v, 10); if (!(val >= 2)) return; }
      if (key === 'wd') val = parseInt(v, 10) || 0;
      store.chores = store.chores.map((c) => {
        if (c.id !== i) return c;
        const nc = { ...c, [key]: val };
        if (key === 'repeat' && val === 'weekdays' && !(nc.days || []).length) nc.days = [1, 2, 3, 4, 5];
        if (key === 'repeat' && val === 'every') { nc.n = nc.n || 3; nc.start = nc.start || dkey(Date.now()); }
        if (key === 'repeat' && val === 'weekly' && nc.wd == null) nc.wd = wdOf(dkey(Date.now()));
        if (key === 'repeat' && val === 'once' && !nc.date) nc.date = dkey(Date.now());
        if (key === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(val)) return c;
        return nc;
      });
      choreVer++; save(); tick();
      if (key === 'repeat') { render(); openChoreEditor(); }
      if (key === 'repeat') { render(); openChoreEditor(); }
      return;
    }
    case 'dr': if (dreamDraft) dreamDraft[i] = v; return;
    case 'dreamQ': dreamQ = v; tick(); return;
    case 'pc': if (/^#[0-9a-fA-F]{6}$/.test(v)) { store.custom = { ...store.custom, [i]: v }; applyPalette(); const sw = $('[data-swatch="custom"]'); if (sw) sw.innerHTML = swatchSVG(PAL); } break;
    case 'name': store.name = v.trim().slice(0, 24); break;
    case 'morningList': store.morningList = v.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 10); break;
    case 'pName': case 'pEvery': case 'pBday': {
      const key = { pName: 'name', pEvery: 'every', pBday: 'bday' }[k];
      store.people = store.people.map((p) => (p.id === i ? { ...p, [key]: key === 'every' ? (parseInt(v, 10) || 7) : v } : p)); break;
    }
    case 'blkName': case 'blkLen': case 'blkAnchor': {
      const S = compute(Date.now());
      store.shape = store.shape.map((b) => {
        if (b.id !== i) return b;
        if (k === 'blkName') return { ...b, name: v };
        if (k === 'blkLen') return { ...b, len: parseInt(v, 10) || 30 };
        const st = blockStart(b, S), base = v === 'sunset' ? S.set : v === 'bed' ? S.bed : S.wakeMin;
        let off = Math.round(wrap(st - base)); if (off > 720) off -= 1440; // keep the block where it is, just re-anchored
        return { ...b, anchor: v, off };
      }); break;
    }
    case 'convDate': convDate = v; break;
    case 'convAgo': convAgo = v; break;
    default: return;
  }
  save(); tick();
}

// ===================== PLOTTING: tray, ghost, hit-testing, quick-add =====================
function trayHTML(S) {
  const list = store.chores.filter((c) => c.repeat !== 'once' || (c.date || '') >= S.today).slice().sort((a, b) => a.time - b.time);
  return list.map((c) => `<button class="tr-it ${choreDone(c, S.today) ? 'done' : ''}" data-chore="${c.id}" aria-label="${esc(c.name)}" data-tip="${esc(`${c.icon} ${c.name} · ${catOf(c)} · ${repeatText(c).toLowerCase()} · ${hm(c.time)}`)}"><span class="tr-orb" style="--c:${catCol(catOf(c))}">${glyphHTML(c.icon, c.name, 22)}</span></button>`).join('')
    + `<button class="tr-it tr-add${list.length ? '' : ' first'}" data-chore="+" aria-label="Plot something new" data-tip="New: drag onto the helix, or tap">+</button>`;
}
const faceSvg = () => document.querySelector('#nowFace > svg');
function toSvgPt(svg, x, y) { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(svg.getScreenCTM().inverse()); }
// where on the face is this screen point? → { k: day, m: minute (5-min snap), cat, x, y } or null
function hitFace(clientX, clientY) {
  const svg = faceSvg(); if (!svg) return null;
  const q = toSvgPt(svg, clientX, clientY), S = compute(Date.now()), snapAbs = (t) => {
    let k = dkey(t), m = Math.round((t - kms(k)) / 300000) * 5; if (m >= 1440) { k = addDays(k, 1); m -= 1440; } return { k, m };
  };
  if (store.orbit) {
    const { cx, cy, rx, ry, pitch } = HX, Z = helixZoom;
    if (Math.hypot(q.x - CX, q.y - CX) > 252 && Z > 1.01) return null;
    q.x = cx + (q.x - cx) / Z; q.y = cy + (q.y - cy) / Z;
    const P = (dt, off) => { const a = ((dt / 1440) * 360 + helixPhi + off) * Math.PI / 180; return [cx + rx * Math.sin(a), cy + ry * Math.cos(a) - (dt / 1440) * pitch, Math.cos(a)]; };
    let best = null;
    for (let dt = -60; dt <= HX.ahead; dt += 5) {
      const L = P(dt, 0), W = P(dt, 180), B = [(L[0] + W[0]) / 2, (L[1] + W[1]) / 2, 0];
      [['life', L], ['work', W], ['both', B]].forEach(([cat, pp]) => {
        const d = Math.hypot(pp[0] - q.x, pp[1] - q.y) - pp[2] * 3; // prefer the front of the helix where strands cross
        if (!best || d < best.d) best = { d, dt, cat };
      });
    }
    if (!best || best.d > 34 / Z) return null;
    const { k, m } = snapAbs(S.now + best.dt * 60000), dt = (kms(k) + m * 60000 - S.now) / 60000;
    const pp = best.cat === 'both' ? (() => { const L = P(dt, 0), W = P(dt, 180); return [(L[0] + W[0]) / 2, (L[1] + W[1]) / 2]; })() : P(dt, best.cat === 'life' ? 0 : 180);
    return { k, m, cat: best.cat, x: cx + (pp[0] - cx) * Z, y: cy + (pp[1] - cy) * Z };
  }
  const D = ringLayout(RING_ORDER).dial, r = Math.hypot(q.x - CX, q.y - CX);
  if (r < D - 62 || r > D + 22) return null;
  const f = ((Math.atan2(q.x - CX, -(q.y - CX)) / (2 * Math.PI)) + 1) % 1;
  let m = Math.round(wrap((f - 0.5) * 1440) / 5) * 5 % 1440, k = S.today;
  const cat = Object.entries(LANE).sort((a, b) => Math.abs(D + a[1] - r) - Math.abs(D + b[1] - r))[0][0];
  const [x, y] = pt(D + LANE[cat], dialF(m));
  return { k, m, cat, x, y };
}
function drawGhost(h, icon, cat, bubble) {
  const g = document.getElementById('now-ghost'); if (!g) return;
  if (!h) { g.innerHTML = ''; return; }
  const col = catCol(cat), S = compute(Date.now());
  const when = `${h.k === S.today ? '' : WD_SHORT[wdOf(h.k)] + ' '}${hm(h.m)}`;
  g.innerHTML = `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="19" fill="${col}" opacity=".22" filter="url(#now-glow)"/><circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="15" fill="${COL.bg}" fill-opacity=".7" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/><text x="${h.x.toFixed(1)}" y="${(h.y + 5.5).toFixed(1)}" text-anchor="middle" font-size="15" opacity=".9">${icon}</text>`
    + (bubble ? `<g transform="translate(${h.x.toFixed(1)} ${(h.y - 34).toFixed(1)})"><rect x="-${when.length * 3.9 + 9}" y="-12" width="${when.length * 7.8 + 18}" height="22" rx="11" fill="${COL.bg}" fill-opacity=".9" stroke="${col}" stroke-opacity=".7"/><text y="3.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" style="font-variant-numeric:tabular-nums">${when}</text></g>` : '');
}
// place an existing chore at (k, m): repeating ones keep their rhythm, the day nudges it where it makes sense
function placeChore(id, h) {
  store.chores = store.chores.map((c) => {
    if (c.id !== id) return c;
    const nc = { ...c, time: h.m };
    if (c.repeat === 'once') nc.date = h.k;
    else if (c.repeat === 'weekly') nc.wd = wdOf(h.k);
    else if (c.repeat === 'every') nc.start = h.k;
    else if (c.repeat === 'weekdays') nc.days = [...new Set([...(c.days || []), wdOf(h.k)])].sort();
    return nc;
  });
  choreVer++; save(); tick(); drawGhost(null);
}
// ---- quick-add / edit sheet ----
let qa = null, qaConfirmDel = false, qaPicker = false, qaEmoji = false;
const QA_NAMES = { '💧': 'Water', '🏋️': 'Gym', '🧺': 'Laundry', '🧹': 'Tidy', '🦷': 'Teeth', '🧴': 'Skincare', '🍳': 'Breakfast', '🍲': 'Lunch', '🍽️': 'Dinner', '📥': 'Inbox', '⚙️': 'Systems', '🤖': 'Automation', '🎧': 'Listen', '🛒': 'Groceries', '💊': 'Meds', '🪴': 'Plants', '🐕': 'Dog', '📚': 'Read', '🧘': 'Breathe', '🚿': 'Shower', '🗑️': 'Bins', '📞': 'Call', '💻': 'Deep work', '🧾': 'Bills', '🛏️': 'Bed', '🚶': 'Walk', '✉️': 'Mail', '🧪': 'Experiment', '🎸': 'Guitar', '🧽': 'Clean', '🚗': 'Drive', '☀️': 'Sun', '🌙': 'Night', '✨': 'Task' };
function openQuick(h, id) {
  qaPicker = false; qaEmoji = false;
  const S = compute(Date.now());
  if (id) { const c = store.chores.find((x) => x.id === id); if (!c) return; qa = { id, icon: c.icon, name: c.name, cat: catOf(c), repeat: c.repeat, n: c.n || 2, days: [...(c.days || [])], len: +c.len || 0, k: c.repeat === 'once' ? c.date : (c.repeat === 'every' ? choreStart(c) : S.today), m: c.time }; }
  else qa = { id: null, icon: h.cat === 'work' ? '💻' : h.cat === 'both' ? '🚶' : '✨', name: '', cat: h.cat || 'life', repeat: 'once', n: 2, days: [wdOf(h.k)], len: 0, k: h.k, m: h.m };
  qaConfirmDel = false;
  if (h && h.x != null) drawGhost(h, qa.icon, qa.cat, false); else drawGhost(null);
  showQuick();
}
function showQuick() { if (inspOn()) { if (sheet === 'quick') closeSheet(); choreVer++; renderInsp(); tick(); const f = $('#insp [data-f="qa:name"]'); if (f && !qa.id) f.focus({ preventScroll: true }); } else openSheet('quick'); }
function clearQuick() { qa = null; selK = null; drawGhost(null); choreVer++; renderInsp(); tick(); }
let selK = null;
function renderInsp() {
  const el = document.getElementById('insp'); if (!el) return;
  el.dataset.v = String(choreVer);
  if (!qa || sheet === 'quick') { el.innerHTML = `<div class="insp-empty"><span class="glyph">✦</span><span class="ql">Click a chore to edit it. Double-click a strand to add. ⌘K for everything.</span></div>`; return; }
  const c = qa.id && store.chores.find((x) => x.id === qa.id), S = compute(Date.now()), k = selK || S.today;
  const head = c ? `<div class="insp-head"><div class="insp-t"><b><span class="ig" style="color:${catCol(catOf(c))}">${glyphHTML(c.icon, c.name, 16)}</span> ${esc(c.name)}</b><span>${catOf(c)} · ${esc(repeatText(c))} · ${hm(c.time)}${c.len ? ` · ${c.len}m` : ''}</span></div>${dueOn(c, k) ? `<button class="pill ${choreDone(c, k) ? 'green fill' : ''}" data-act="chore:${c.id}:${k}" title="Done (Return)" aria-label="Done">✓</button>` : ''}</div>` : '';
  el.innerHTML = head + quickSheet();
}
function nextIconsHTML(S) {
  const occ = choreOcc(S, 2).filter((o) => o.dt >= 0 && !o.done).sort((a, b) => a.dt - b.dt).slice(0, 6);
  return occ.map((o) => `<button class="ni" ${o.c ? `data-sel="${o.c.id}:${o.k}"` : ''} title="${esc(`${o.name} · ${o.k === S.today ? '' : WD_SHORT[wdOf(o.k)] + ' '}${hm((o.t - kms(o.k)) / 60000)}`)}" aria-label="${esc(o.name)}"><span class="tr-orb sm" style="--c:${catCol(o.cat)}">${glyphHTML(o.icon, o.name, 16)}</span><em class="ql">${hm((o.t - kms(o.k)) / 60000)}</em></button>`).join('');
}
const GLYPH_PICK = ['water', 'gym', 'laundry', 'broom', 'tooth', 'skin', 'cook', 'bowl', 'eat', 'inbox', 'gear', 'robot', 'music', 'cart', 'pill', 'plant', 'paw', 'book', 'calm', 'shower', 'trash', 'phone', 'laptop', 'receipt', 'bed', 'walk', 'sun', 'moon', 'mail', 'flask', 'note', 'sponge', 'car', 'spark'];
const durTxt = (n) => (!n ? 'No duration' : n < 60 ? `${n} min` : `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ''}`);
function quickSheet() {
  const d = qa; if (!d) return '';
  const Q = !!store.quiet, cur = glyphKey(d.icon, d.name), col = catCol(d.cat);
  const seg = (items, curV, act, cls = '') => `<div class="mseg ${cls}" role="group">${items.map(([v, l, t]) => `<button class="${curV === v ? 'on' : ''}" data-act="${act}:${v}" aria-pressed="${curV === v}" ${t ? `title="${t}" aria-label="${t}"` : ''}>${l}</button>`).join('')}</div>`;
  const dot = (c) => `<i class="cdot" style="background:${c}"></i>`;
  const needDay = d.repeat === 'once' || d.repeat === 'every' || d.repeat === 'weekly';
  const lab = (t) => (Q ? '' : `<span class="qa-lab">${t}</span>`);
  return `<div class="qa q13" style="--c:${col}">
    <div class="qa-head"><button class="qa-orb tr-orb ${qaPicker ? 'open' : ''}" style="--c:${col}" data-act="qaPick" aria-label="Choose icon" title="Icon">${glyphHTML(d.icon, d.name, 22)}</button>
      <input class="qa-name" data-f="qa:name" value="${esc(d.name)}" placeholder="${esc(QA_NAMES[d.icon] || 'Name')}" aria-label="Name" autocomplete="off" spellcheck="false"></div>
    ${qaPicker ? `<div class="qa-pick"><div class="gly-grid" role="listbox" aria-label="Icon">${GLYPH_PICK.map((k) => `<button class="${k === cur ? 'on' : ''}" data-act="qaGly:${k}" aria-label="${k}" title="${k}"><svg class="gly" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS[k]}"/></svg></button>`).join('')}</div>
      <button class="qa-more" data-act="qaMore" aria-expanded="${qaEmoji}">${qaEmoji ? '−' : '···'}<span class="ql"> ${qaEmoji ? 'Hide emoji' : 'Emoji'}</span></button>
      ${qaEmoji ? `<div class="qa-icons" role="listbox" aria-label="Emoji">${CHORE_ICONS.map((ic, i) => `<button class="${ic === d.icon ? 'on' : ''}" data-act="qaIcon:${i}" aria-label="${esc(QA_NAMES[ic] || ic)}">${ic}</button>`).join('')}</div>` : ''}</div>` : ''}
    <div class="qa-row">${lab('Time')}<input type="time" class="qa-in" data-f="qa:m" value="${hm(d.m)}" step="300" aria-label="Time">${needDay ? `<input type="date" class="qa-in" data-f="qa:k" value="${d.k}" aria-label="Day">` : ''}</div>
    ${seg([['life', dot(COL.life) + '<span>Life</span>', 'Life'], ['work', dot(COL.work) + '<span>Work</span>', 'Work'], ['both', dot(catCol('both')) + '<span>Both</span>', 'Both']], d.cat, 'qaCat', 'cat')}
    ${seg([['once', '1×', 'Once'], ['daily', 'Daily', 'Every day'], ['weekdays', 'Days', 'Some weekdays'], ['every', 'Every', 'Every N days'], ['weekly', 'Weekly', 'Weekly']], d.repeat, 'qaRep', 'rep')}
    ${d.repeat === 'weekdays' ? `<div class="wds q">${WD_SHORT.map((w, i) => `<button class="wd ${d.days.includes(i) ? 'on' : ''}" data-act="qaDay:${i}" aria-label="${w}">${w[0]}</button>`).join('')}</div>` : ''}
    ${d.repeat === 'every' ? `<div class="qa-row">${lab('Every')}<div class="stepper"><button data-act="qaN:-1" aria-label="Fewer days">−</button><output>${d.n} d</output><button data-act="qaN:1" aria-label="More days">+</button></div></div>` : ''}
    <div class="qa-row qa-dur">${lab('Length')}<input type="range" min="0" max="180" step="5" data-f="qa:len" value="${d.len || 0}" aria-label="Duration" style="--f:${((d.len || 0) / 180 * 100).toFixed(1)}%"><output id="qaDurOut">${(d.len || 0) ? durTxt(d.len) : '—'}</output></div>
    <div class="qa-foot">${d.id ? `<button class="qa-ib ${qaConfirmDel ? 'danger' : ''}" data-act="qaDel" aria-label="Delete" title="Delete (⌫)">${qaConfirmDel ? '<span>Delete?</span>' : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + GLYPHS.trash + '"/></svg>'}</button>` : ''}<span class="sp"></span>
      <button class="qa-ib" data-act="qaClose" aria-label="Cancel" title="Cancel (Esc)">${Q ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' : 'Cancel'}</button>
      <button class="qa-save q13s" data-act="qaSave" aria-label="Save" title="Save">${Q ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : 'Save'}</button></div>
  </div>`;
}
function saveQuick() {
  const d = qa; if (!d) return;
  const c = { id: d.id || 'c' + Date.now(), icon: d.icon, name: (d.name || '').trim() || QA_NAMES[d.icon] || 'Task', time: clamp(d.m, 0, 1439), repeat: d.repeat, cat: d.cat, len: clamp(+d.len || 0, 0, 600), created: d.k };
  if (d.repeat === 'once') c.date = d.k;
  if (d.repeat === 'weekdays') c.days = d.days.length ? [...d.days].sort() : [wdOf(d.k)];
  if (d.repeat === 'every') { c.n = Math.max(2, +d.n || 2); c.start = d.k; }
  if (d.repeat === 'weekly') c.wd = wdOf(d.k);
  if (d.id) store.chores = store.chores.map((x) => (x.id === d.id ? c : x)); else store.chores.push(c);
  const keep = inspOn() && sheet !== 'quick';
  qa = null; choreVer++; save(); if (sheet === 'quick') closeSheet(); drawGhost(null);
  if (keep) { selK = c.repeat === 'once' ? c.date : null; openQuick(null, c.id); } else tick();
}
// ---- long-press menu on a placed chore: move / edit / delete ----
let moveMode = null, cmConfirm = false;
function showChoreMenu(id, k, x, y, atCursor = false) {
  const c = store.chores.find((z) => z.id === id); if (!c) return;
  let m = $('#cmenu'); if (!m) { m = document.createElement('div'); m.id = 'cmenu'; m.setAttribute('role', 'menu'); document.body.appendChild(m); }
  cmConfirm = false;
  m.innerHTML = `<div class="cm-t">${esc(tipText({ dataset: { act: `chore:${id}:${k}` }, classList: { contains: () => false } }))}</div><div class="cm-b"><button data-act="cmMove:${id}" aria-label="Move">✥<span>Move</span></button><button data-act="cmEdit:${id}:${k}" aria-label="Edit">✎<span>Edit</span></button><button data-act="cmDel:${id}" aria-label="Delete">🗑<span>Delete</span></button></div>`;
  m.classList.toggle('mac', atCursor);
  m.classList.add('show');
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(10, Math.min(innerWidth - r.width - 10, x - r.width / 2)) + 'px';
  m.style.top = Math.max(10, y - r.height - 26) + 'px';
  if (atCursor) { m.style.left = Math.min(innerWidth - r.width - 8, x + 2) + 'px'; m.style.top = Math.min(innerHeight - r.height - 8, y + 2) + 'px'; }
}
const hideChoreMenu = () => { const m = $('#cmenu'); if (m) m.classList.remove('show'); };

// ===================== MAC: new chore, nudge, command palette, shortcuts =====================
function newAtNow() {
  if (tab !== 'now') { tab = 'now'; history.replaceState(null, '', '#now'); render(); }
  const S = compute(Date.now()); let m = Math.ceil((S.nowMin + 1) / 5) * 5, k = S.today; if (m >= 1440) { m -= 1440; k = addDays(k, 1); }
  selK = null; openQuick({ k, m, cat: 'life' });
}
function nudgeChore(id, d) {
  const c = store.chores.find((x) => x.id === id); if (!c) return;
  let t = c.time + d;
  if (c.repeat === 'once') { while (t < 0) { t += 1440; c.date = addDays(c.date, -1); } while (t >= 1440) { t -= 1440; c.date = addDays(c.date, 1); } selK = c.date; }
  else t = ((t % 1440) + 1440) % 1440;
  c.time = t; if (qa) { qa.m = t; if (c.repeat === 'once') qa.k = c.date; }
  choreVer++; save(); tick();
}
const PAL_CMDS = () => {
  const C = [
    ['✨', 'Add chore at now', 'N', () => newAtNow()],
    ['💧', 'Log water +250 ml', '', () => act('water:250')],
    ['💧', 'Log water +500 ml', '', () => act('water:500')],
    ['🏋️', 'Log gym +15 min', '', () => act('gym:15')],
    ['🏋️', 'Log gym +45 min', '', () => act('gym:45')],
    ['☀️', "I'm awake", '', () => act('awake')],
    ['✦', 'Log a dream', '', () => act('dreamNew')],
    ['🤫', store.quiet ? 'Quiet mode: turn off' : 'Quiet mode: turn on', '', () => act('quiet')],
    ['🧬', store.orbit ? 'Show flat dial' : 'Show helix', 'Space', () => { if (tab !== 'now') act('tab:now'); act('orbit'); }],
    ['▣', store.insp ? 'Hide inspector' : 'Show inspector', 'I', () => { if (tab !== 'now') act('tab:now'); act('insp'); }],
    ['◐', 'Appearance: dark', '', () => act('appear:dark')], ['◑', 'Appearance: match macOS', '', () => act('appear:system')], ['○', 'Appearance: light', '', () => act('appear:light')],
    ['▫', store.mini ? 'Mini window: off' : 'Mini window: on (narrow window)', '', () => act('mini')],
    ['⌨️', 'Keyboard shortcuts', '?', () => openKeys()],
  ];
  TABS.forEach(([id, label], i) => C.push(['→', `Go to ${label}`, `⌘${i + 1}`, () => act('tab:' + id)]));
  C.push(['→', 'Go to Cosmos', '', () => act('tab:cosmos')], ['⚙︎', 'Settings', '⌘,', () => act('tab:settings')]);
  store.chores.forEach((c) => C.push([c.icon, `Edit ${c.name}`, '', () => { if (tab !== 'now') act('tab:now'); selK = null; openQuick(null, c.id); }]));
  return C;
};
let palSel = 0, palList = [];
const paletteOpen = () => !!document.querySelector('#palette.show');
function palRender() {
  const q = ($('#palQ').value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  palList = PAL_CMDS().filter((c) => q.every((w) => c[1].toLowerCase().includes(w)));
  palSel = Math.max(0, Math.min(palSel, palList.length - 1));
  $('#palList').innerHTML = palList.length ? palList.map((c, i) => `<button class="pc ${i === palSel ? 'on' : ''}" data-pc="${i}" role="option" aria-selected="${i === palSel}"><span class="pi">${c[0]}</span><span class="pl">${esc(c[1])}</span>${c[2] ? `<kbd>${c[2]}</kbd>` : ''}</button>`).join('') : `<div class="pc-none">Nothing matches</div>`;
  const on = $('#palList .pc.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}
function openPalette() {
  let p = $('#palette');
  if (!p) {
    p = document.createElement('div'); p.id = 'palette'; p.className = 'overlay'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Command palette');
    p.innerHTML = `<div class="pal-box"><div class="pal-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="palQ" placeholder="Type a command…" autocomplete="off" spellcheck="false" aria-label="Command"><kbd>esc</kbd></div><div class="pal-list" id="palList" role="listbox"></div></div>`;
    document.body.appendChild(p);
    p.addEventListener('mousedown', (e) => { if (e.target === p) { e.preventDefault(); closePalette(); } });
    p.addEventListener('click', (e) => { const b = e.target.closest('[data-pc]'); if (b) { e.stopPropagation(); runPal(+b.dataset.pc); } });
    p.addEventListener('mousemove', (e) => { const b = e.target.closest('[data-pc]'); if (b && +b.dataset.pc !== palSel) { palSel = +b.dataset.pc; $$('#palList .pc').forEach((x, i) => x.classList.toggle('on', i === palSel)); } });
    $('#palQ').addEventListener('input', () => { palSel = 0; palRender(); });
    $('#palQ').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palList.length - 1, palSel + 1); palRender(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); palRender(); }
      else if (e.key === 'Enter') { e.preventDefault(); runPal(palSel); }
    });
  }
  closeKeys(); hideChoreMenu();
  $('#palQ').value = ''; palSel = 0; palRender(); p.classList.add('show'); $('#palQ').focus();
}
function closePalette() { const p = $('#palette'); if (p) { p.classList.remove('show'); if (p.contains(document.activeElement)) document.activeElement.blur(); } }
function runPal(i) { const c = palList[i]; closePalette(); if (c) c[3](); }
const keysOpen = () => !!document.querySelector('#keys.show');
function openKeys() {
  let k = $('#keys');
  if (!k) { k = document.createElement('div'); k.id = 'keys'; k.className = 'overlay'; k.setAttribute('role', 'dialog'); k.setAttribute('aria-label', 'Keyboard shortcuts'); document.body.appendChild(k); k.addEventListener('mousedown', (e) => { if (e.target === k || e.target.closest('[data-x]')) { e.preventDefault(); closeKeys(); } }); }
  const R = [['⌘K', 'Command palette'], ['N  ·  ⌘N', 'New chore at now'], ['Space', 'Helix ↔ flat'], ['1–6  ·  ⌘1–6', 'Now · Today · Cycles · Life · Journal · Dreams'], ['⌘,', 'Settings'], ['I', 'Show / hide inspector'],
    ['← →  ↑ ↓', 'Nudge selected chore ±5 min'], ['⇧ + arrows', 'Nudge ±1 hour'], ['Return', 'Mark selected chore done'], ['⌫', 'Delete selected chore'], ['Esc', 'Close / deselect'],
    ['Double-click', 'Add on a strand or the dial'], ['Right-click', 'Move · Edit · Delete'], ['Drag', 'Tray icon → helix / dial; drag empty space to turn'], ['Scroll', 'Turn the helix'], ['Pinch  ·  ⌘+ ⌘−  ·  ⌘0', 'Zoom the helix · reset'], ['?', 'This sheet']];
  k.innerHTML = `<div class="keys-box"><div class="keys-h"><b>Keyboard</b><button class="icon-btn" data-x aria-label="Close">✕</button></div><div class="keys-g">${R.map(([a, b]) => `<kbd>${a}</kbd><span>${b}</span>`).join('')}</div></div>`;
  closePalette(); k.classList.add('show');
}
function closeKeys() { const k = $('#keys'); if (k) k.classList.remove('show'); }

// ===================== QUIET TOOLTIPS: long-press anything to see what it is =====================
function tipText(el) {
  const S = compute(Date.now());
  if (el.dataset.tip === 'orbit') return store.orbit ? 'Flat view' : 'Helix view';
  if (el.dataset.tip) return el.dataset.tip;
  const r = el.dataset.ring;
  if (r) {
    if (r === 'wheel') return `Galaxy · ${(S.wf * 100).toFixed(4)}% · ${(S.wf * 360).toFixed(3)}°`;
    if (r === 'year') return `Sun · day ${S.yearDay}/${S.yearDays}`;
    if (r === 'moon') return `Moon · ${phaseName(S.moonDays)} · ${(S.illum * 100).toFixed(0)}% lit`;
    if (r === 'sun') return `${S.hhmm} · ${S.sunLine}`;
    if (r === 'focus' && el.classList.contains('wblk') || r === 'focus' && el.tagName === 'line') return `💻 Satisfying work · work · ${HABITS.focus.v(S)} / ${dur(store.goalMin)}`;
    if (HABITS[r]) { const goal = { focus: dur(store.goalMin), gym: store.gymGoal + 'm', mandarin: store.mandarinGoal + 'm', water: litres(store.waterGoal), protein: store.proteinGoal + 'g' }[r]; return `${HABITS[r].name} · ${HABITS[r].v(S)} / ${goal}`; }
    return RINGS[r] ? RINGS[r].name : '';
  }
  const a = el.dataset.act || '';
  const [cmd, id, k] = a.split(':');
  if (cmd === 'chore') { const c = store.chores.find((x) => x.id === id); if (!c) return ''; const d = dayOf(k), when = k === S.today ? 'today' : k === addDays(S.today, 1) ? 'tomorrow' : WD_SHORT[wdOf(k)]; return `${c.icon} ${c.name} · ${CATS.find((x) => x[0] === catOf(c))[1].toLowerCase()} · ${when} ${hm(c.time)}${c.len ? ` · ${c.len}m` : ''}${d.chores && d.chores[c.id] ? ' · done' : ''}`; }
  if (cmd === 'brushOn' || cmd === 'brush') return '🦷 Brush teeth · life · before sleep';
  if (cmd === 'peek') return '';
  return '';
}
function showTip(text, x, y) {
  let t = $('#tip'); if (!t) { t = document.createElement('div'); t.id = 'tip'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = text; t.classList.add('show');
  const w = Math.min(280, window.innerWidth - 24);
  t.style.maxWidth = w + 'px';
  const r = t.getBoundingClientRect();
  t.style.left = Math.max(12, Math.min(window.innerWidth - r.width - 12, x - r.width / 2)) + 'px';
  t.style.top = Math.max(12, y - r.height - 18) + 'px';
  clearTimeout(showTip.h); showTip.h = setTimeout(() => t.classList.remove('show'), 2200);
}

// ===================== BOOT =====================
function boot() {
  load();
  applyPalette();
  const h = (location.hash || '').slice(1);
  if (VIEWS[h]) tab = h;
  // drag the helix sideways to turn it; it eases back to NOW-at-front
  let drag = null, dragMoved = false, raf = 0;
  const redrawHelix = () => { raf = 0; const og = $('#now-orbit'), S = compute(Date.now()); if (og) { og.innerHTML = helixSVG(S, ringLayout(RING_ORDER).dial, helixPhi); og.dataset.k = ''; } };
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('pointerdown', (e) => {
    const f = e.target.closest('#nowFace.orbit-on > svg'); if (!f || G || moveMode || e.target.closest('.chore')) return;
    drag = { x: e.clientX, phi: helixPhi, w: f.getBoundingClientRect().width }; dragMoved = false;
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return; if (G) { drag = null; return; } const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) dragMoved = true; if (!dragMoved) return;
    helixPhi = drag.phi + (dx / drag.w) * 300; if (!raf) raf = requestAnimationFrame(redrawHelix);
  });
  const endDrag = () => {
    if (!drag) return; drag = null;
    if (!dragMoved) return;
    setTimeout(() => { dragMoved = false; }, 0);
    if (reduce()) { helixPhi = 0; redrawHelix(); return; }
    const from = helixPhi, t0 = performance.now(), back = () => { const t = Math.min(1, (performance.now() - t0) / 700), e2 = 1 - (1 - t) ** 3; helixPhi = from * (1 - e2); redrawHelix(); if (t < 1) requestAnimationFrame(back); };
    setTimeout(() => requestAnimationFrame(back), 1600);
  };
  document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);
  // ---- plotting gestures (touch + mouse) ----
  // G.kind: 'tray' (an icon from the tray), 'chore' (a placed icon), 'move' (after ✥ in the long-press menu)
  let G = null, swallowUntil = 0, ghostEl = null;
  const OFFY = (pt) => (pt === 'touch' ? 44 : 0); // lift the drop point above the finger so it stays visible
  const ghostIcon = () => (G.id === '+' ? '✨' : (store.chores.find((c) => c.id === G.id) || {}).icon || '✨');
  const ghostCat = (h) => (G.id === '+' ? (h ? h.cat : 'life') : catOf(store.chores.find((c) => c.id === G.id)));
  const startDrag = () => {
    G.active = true; hideChoreMenu(); if (lp) { clearTimeout(lp.t); lp = null; }
    if (G.kind === 'tray') { ghostEl = document.createElement('div'); ghostEl.className = 'drag-ghost'; ghostEl.textContent = ghostIcon(); document.body.appendChild(ghostEl); }
    if (G.el) G.el.classList.add('lifting');
    document.body.classList.add('plotting');
    if (navigator.vibrate) navigator.vibrate(6);
  };
  const moveDrag = (x, y) => {
    if (ghostEl) { ghostEl.style.transform = `translate(${x - 22}px, ${y - OFFY(G.pt) - 22}px)`; }
    const h = hitFace(x, y - OFFY(G.pt)); G.h = h;
    drawGhost(h, ghostIcon(), ghostCat(h), true);
    if (ghostEl) ghostEl.classList.toggle('over', !!h);
  };
  const endPlot = (apply) => {
    if (!G) return; const g = G; G = null;
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
    if (g.el) g.el.classList.remove('lifting');
    document.body.classList.remove('plotting');
    if (!g.active) { // a plain tap
      if (g.kind === 'move' && apply) { const h = hitFace(g.x, g.y); if (h) placeChore(g.id, h); moveMode = null; $('#nowFace')?.classList.remove('moving'); swallowUntil = performance.now() + 300; }
      return;
    }
    swallowUntil = performance.now() + 300;
    if (g.kind === 'move') { moveMode = null; $('#nowFace')?.classList.remove('moving'); }
    if (!apply || !g.h) { drawGhost(null); return; }
    if (g.id === '+') { drawGhost(null); openQuick(g.h); } else placeChore(g.id, g.h);
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const base = { x: e.clientX, y: e.clientY, pt: e.pointerType, active: false, h: null };
    const tr = e.target.closest('#tray .tr-it');
    if (tr) { G = { ...base, kind: 'tray', id: tr.dataset.chore, el: tr }; return; }
    if (moveMode && e.target.closest('#nowFace > svg')) { G = { ...base, kind: 'move', id: moveMode.id }; return; }
    const ch = e.target.closest('#nowFace .chore[data-act^="chore:"]');
    if (ch) { G = { ...base, kind: 'chore', id: ch.dataset.act.split(':')[1], el: ch }; }
  });
  const decide = (dx, dy) => { // returns true once this gesture is ours
    if (!G) return false; if (G.active) return true;
    const d = Math.hypot(dx, dy); if (d < (G.pt === 'mouse' ? 5 : 8)) return false;
    if (G.kind === 'tray' && G.pt !== 'mouse' && Math.abs(dx) > Math.abs(dy) * 1.2) { G = null; return false; } // sideways = scroll the tray
    startDrag(); return true;
  };
  document.addEventListener('pointermove', (e) => { if (!G) return; if (decide(e.clientX - G.x, e.clientY - G.y)) { e.preventDefault(); moveDrag(e.clientX, e.clientY); } }, { passive: false });
  document.addEventListener('touchmove', (e) => { if (!G) return; const t = e.touches[0]; if (decide(t.clientX - G.x, t.clientY - G.y)) e.preventDefault(); }, { passive: false });
  document.addEventListener('pointerup', (e) => { if (G) { if (G.active) moveDrag(e.clientX, e.clientY); endPlot(true); } });
  document.addEventListener('pointercancel', () => endPlot(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { endPlot(false); moveMode = null; $('#nowFace')?.classList.remove('moving'); hideChoreMenu(); } });
  document.addEventListener('click', (e) => {
    if (performance.now() < swallowUntil) { e.stopPropagation(); e.preventDefault(); return; }
    if (lpFired || dragMoved) return; // the long-press / rotate handlers swallow this click
    if (!e.target.closest('#cmenu')) hideChoreMenu();
    const tr = e.target.closest('#tray .tr-it');
    if (tr) { e.stopPropagation(); e.preventDefault(); const S = compute(Date.now()); if (tr.dataset.chore === '+') openQuick({ k: S.today, m: Math.min(1435, Math.ceil((S.nowMin + 1) / 30) * 30), cat: 'life' }); else openQuick(null, tr.dataset.chore); return; }
    // tap an empty spot on a helix strand → quick-add there (strand picks life / work / both)
    if (store.orbit && tab === 'now' && !(lastPT === 'mouse' && inspOn()) && e.target.closest('#nowFace > svg') && !e.target.closest('[data-ring],[data-act]')) {
      const h = hitFace(e.clientX, e.clientY); if (h) { e.stopPropagation(); e.preventDefault(); openQuick(h); }
    }
  }, true);
  // ---- Mac: click selects into the inspector, double-click a strand adds, right-click = menu ----
  let lastPT = 'mouse';
  document.addEventListener('pointerdown', (e) => { lastPT = e.pointerType || 'mouse'; }, true);
  document.addEventListener('click', (e) => {
    if (lastPT !== 'mouse' || !inspOn() || performance.now() < swallowUntil || lpFired || dragMoved) return;
    const ni = e.target.closest('#nextIcons [data-sel]');
    if (ni) { e.stopPropagation(); const [id, k] = ni.dataset.sel.split(':'); selK = k; openQuick(null, id); return; }
    const ch = e.target.closest('#nowFace .chore[data-act^="chore:"]');
    if (ch) { e.stopPropagation(); e.preventDefault(); hideChoreMenu(); const [, id, k] = ch.dataset.act.split(':'); selK = k; openQuick(null, id); return; }
    if (e.target.closest('#nowFace > svg')) {
      const ring = e.target.closest('[data-ring]');
      const onDial = ring && ring.dataset.ring === 'sun' && !store.orbit && hitFace(e.clientX, e.clientY);
      if ((!ring && !e.target.closest('[data-act]')) || onDial) { e.stopPropagation(); e.preventDefault(); hideChoreMenu(); if (qa) clearQuick(); }
    }
  }, true);
  document.addEventListener('dblclick', (e) => {
    if (tab !== 'now' || !e.target.closest('#nowFace > svg') || e.target.closest('.chore')) return;
    const h = hitFace(e.clientX, e.clientY); if (h) { e.preventDefault(); selK = null; openQuick(h); }
  });
  document.addEventListener('contextmenu', (e) => {
    const ch = e.target.closest('#nowFace .chore[data-act^="chore:"]'), tr = e.target.closest('#tray .tr-it'), ni = e.target.closest('#nextIcons [data-sel]');
    if (ch) { e.preventDefault(); const [, id, k] = ch.dataset.act.split(':'); showChoreMenu(id, k, e.clientX, e.clientY, true); }
    else if (ni) { e.preventDefault(); const [id, k] = ni.dataset.sel.split(':'); showChoreMenu(id, k, e.clientX, e.clientY, true); }
    else if (tr && tr.dataset.chore !== '+') { e.preventDefault(); showChoreMenu(tr.dataset.chore, compute(Date.now()).today, e.clientX, e.clientY, true); }
  });
  // two-finger scroll turns the helix; pinch (ctrl+wheel in Chrome, gesture events in Safari) zooms it
  let wheelT = 0, gz = 1;
  const easeHome = () => {
    clearTimeout(wheelT);
    wheelT = setTimeout(() => {
      if (drag || G) return; if (reduce()) { helixPhi = 0; redrawHelix(); return; }
      const from = helixPhi, t0 = performance.now(), back = () => { const t = Math.min(1, (performance.now() - t0) / 700), e2 = 1 - (1 - t) ** 3; helixPhi = from * (1 - e2); redrawHelix(); if (t < 1) requestAnimationFrame(back); };
      requestAnimationFrame(back);
    }, 1600);
  };
  const setZoom = (z) => { helixZoom = Math.max(0.7, Math.min(1.8, z)); if (Math.abs(helixZoom - 1) < 0.03) helixZoom = 1; if (!raf) raf = requestAnimationFrame(redrawHelix); };
  window.__orrery = { setZoom, get zoom() { return helixZoom; }, get phi() { return helixPhi; } };
  document.addEventListener('wheel', (e) => {
    if (tab !== 'now' || !store.orbit || !e.target.closest('#nowFace > svg')) return;
    e.preventDefault();
    if (e.ctrlKey) { setZoom(helixZoom * Math.exp(-e.deltaY * 0.01)); return; }
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    helixPhi = Math.max(-720, Math.min(720, helixPhi - d * 0.4)); if (!raf) raf = requestAnimationFrame(redrawHelix); easeHome();
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => { if (e.target.closest && e.target.closest('#nowFace')) { e.preventDefault(); gz = helixZoom; } });
  document.addEventListener('gesturechange', (e) => { if (store.orbit && e.target.closest && e.target.closest('#nowFace')) { e.preventDefault(); setZoom(gz * e.scale); } });
  window.addEventListener('resize', () => { const was = document.body.className; layoutClasses(); if (document.body.className !== was) render(); });
  if (navigator.windowControlsOverlay) navigator.windowControlsOverlay.addEventListener('geometrychange', layoutClasses);
  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (store.appearance === 'system') { applyPalette(); render(); } });
  // ---- keyboard ----
  document.addEventListener('keydown', (e) => {
    const k = e.key, mod = e.metaKey || e.ctrlKey, low = k.length === 1 ? k.toLowerCase() : k;
    const typing = e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]');
    if (mod && low === 'k') { e.preventDefault(); paletteOpen() ? closePalette() : openPalette(); return; }
    if (k === 'Escape') { if (paletteOpen()) { closePalette(); return; } if (keysOpen()) { closeKeys(); return; } if (!sheet && qa) { clearQuick(); if (typing) e.target.blur(); } return; }
    if (paletteOpen() || typing || e.altKey) return;
    if (keysOpen()) { if (k === '?' || k === 'Enter') { e.preventDefault(); closeKeys(); } return; }
    if (k === '?') { e.preventDefault(); openKeys(); return; }
    if (low === ',' ) { e.preventDefault(); act('tab:settings'); return; }
    if (low === 'n' && !e.shiftKey) { e.preventDefault(); newAtNow(); return; }
    if (/^[1-6]$/.test(k)) { e.preventDefault(); act('tab:' + SECTIONS[+k - 1]); return; }
    if (mod) { if (low === '0' && tab === 'now') { e.preventDefault(); setZoom(1); helixPhi = 0; redrawHelix(); } if ((low === '=' || low === '+') && tab === 'now') { e.preventDefault(); setZoom(helixZoom * 1.15); } if (low === '-' && tab === 'now') { e.preventDefault(); setZoom(helixZoom / 1.15); } return; }
    if (sheet) return;
    if (k === ' ' && tab === 'now') { e.preventDefault(); act('orbit'); return; }
    if (low === 'i' && tab === 'now') { act('insp'); return; }
    if (qa && qa.id && tab === 'now') {
      if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); nudgeChore(qa.id, (k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 1) * (e.shiftKey ? 60 : 5)); return; }
      if (k === 'Enter') { e.preventDefault(); const c = store.chores.find((x) => x.id === qa.id), d = selK || compute(Date.now()).today; if (c && dueOn(c, d)) act(`chore:${c.id}:${d}`); return; }
      if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); act('qaDel'); return; }
    }
  });
  // long-press (~0.45 s) shows a fading tooltip and swallows the click that follows
  let lp = null, lpFired = false;
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-ring],[data-tip],.chore[data-act],[data-act^="brush"]'); if (!el || el.closest('#tray')) return;
    lpFired = false; const x = e.clientX, y = e.clientY;
    const ca = el.matches('#nowFace .chore[data-act^="chore:"]') ? el.dataset.act.split(':') : null; // read now: the face may redraw before the timer fires
    lp = { x, y, t: setTimeout(() => { if (G && G.active) return; if (ca) { lpFired = true; showChoreMenu(ca[1], ca[2], x, y); if (navigator.vibrate) navigator.vibrate(8); return; } const txt = tipText(el); if (!txt) return; lpFired = true; showTip(txt, x, y); if (navigator.vibrate) navigator.vibrate(8); }, 450) };
  });
  const lpCancel = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
  document.addEventListener('pointermove', (e) => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) lpCancel(); });
  document.addEventListener('pointerup', lpCancel); document.addEventListener('pointercancel', lpCancel);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('#nowFace,.tabbar,#tabs,.quick')) e.preventDefault(); });
  document.addEventListener('click', (e) => { if (lpFired) { lpFired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('click', (e) => { if (dragMoved) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-ring]'); if (r) { if (r.dataset.ring === 'wheel' && tab === 'now') act('tab:cosmos'); else openSheet(r.dataset.ring); return; }
    const b = e.target.closest('[data-act]'); if (b) { e.preventDefault(); act(b.dataset.act); return; }
    if (e.target.id === 'sheet') closeSheet();
  });
  document.addEventListener('input', (e) => { const f = e.target.dataset && e.target.dataset.f; if (f) field(f, e.target.value); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet) closeSheet();
    if (e.key === 'Enter' && e.target.id === 'firstText') act('addFirst');
    if (e.key === 'Enter' && (e.target.id === 'mealG' || e.target.id === 'mealText')) act('meal');
    if (e.key === 'Enter' && e.target.id === 'pName') act('addPerson');
  });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'importFile' || !e.target.files[0]) return;
    const rd = new FileReader();
    rd.onload = () => { try { const s = sanitize(JSON.parse(rd.result)); if (!s) throw new Error('bad'); store = s; save(); applyPalette(); render(); toast('Backup imported. Welcome back.', 1); } catch (err) { toast("That file isn't an Orrery backup."); } };
    rd.readAsText(e.target.files[0]); e.target.value = '';
  });
  window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); applyPalette(); render(); } });
  render();
  setInterval(tick, 1000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
// ===================== SKY: starfield (two parallax layers) =====================
function buildSky() {
  const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const layer = (n, seed, size, alpha) => Array.from({ length: n }, (_, i) => `${(rnd(i, seed) * 100).toFixed(2)}vw ${(rnd(i, seed + 1) * 100).toFixed(2)}vh 0 ${size} rgba(255,255,255,${(alpha * (0.4 + 0.6 * rnd(i, seed + 2))).toFixed(2)})`).join(',');
  const s1 = document.querySelector('#sky .s1'), s2 = document.querySelector('#sky .s2');
  if (s1) s1.style.boxShadow = layer(140, 3, '0px', 0.55);
  if (s2) s2.style.boxShadow = layer(28, 9, '0.6px', 0.9);
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, px = 0, py = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduce()) return;
    px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; const R = document.documentElement.style; R.setProperty('--px', px.toFixed(3)); R.setProperty('--py', py.toFixed(3)); });
  }, { passive: true });
}
document.addEventListener('DOMContentLoaded', () => { buildSky(); boot(); });
