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
    sunRing: ['#B9770E', '#FFC94D'], galaxy: ['#7B2FF7', '#2E8BFF', '#2EF2B0'], moon: ['#2E8BFF', '#00C6FF'], sun: ['#FFD166', '#FF9F6B', '#FF5FD2'],
    habits: { focus: '#2EF2B0', gym: '#FF5FD2', mandarin: '#FFB347', protein: '#B48CFF', water: '#38E8FF' },
    glow: ['rgba(123,47,247,0.20)', 'rgba(0,198,255,0.11)', 'rgba(46,242,176,0.08)'], aurora: true },
  cosmic: { name: 'Cosmic Blue', bg: '#000000', surface: 'rgba(28,28,30,0.62)', text: '#FFFFFF', muted: '#8E8E93', accent: '#0A84FF', accentInk: '#FFFFFF',
    sunRing: ['#B76E00', '#FFCC4D'], galaxy: ['#0040DD', '#0A84FF'], moon: ['#0071A4', '#64D2FF'], sun: ['#FFD60A', '#FF9F0A', '#FF6482'],
    habits: { focus: '#30D158', gym: '#FF6482', mandarin: '#FF9F0A', protein: '#BF5AF2', water: '#5EE0D8' },
    glow: ['rgba(255,159,10,0.075)', 'rgba(94,92,230,0.06)', 'rgba(0,0,0,0)'] },
  druid: { name: 'Druid Green', bg: '#040A07', surface: 'rgba(18,34,25,0.60)', text: '#F1F5EC', muted: '#98A89B', accent: '#2FBF71', accentInk: '#04140B',
    sunRing: ['#8F6A12', '#F0C75E'], galaxy: ['#0E6B45', '#2FBF71'], moon: ['#8C7A3A', '#E8C766'], sun: ['#F5D76E', '#D4A017', '#C76B3A'],
    habits: { focus: '#3DDC84', gym: '#E07A5F', mandarin: '#E8C766', protein: '#B39DDB', water: '#5ED3C4' },
    glow: ['rgba(232,199,102,0.09)', 'rgba(47,191,113,0.08)', 'rgba(0,0,0,0)'] },
  ember: { name: 'Sunset Ember', bg: '#0C0505', surface: 'rgba(40,20,20,0.60)', text: '#FFF3EE', muted: '#B39A94', accent: '#FF6A3D', accentInk: '#1A0602',
    sunRing: ['#B8400B', '#FFB13D'], galaxy: ['#C2185B', '#FF4F7B'], moon: ['#E0661F', '#FFC07A'], sun: ['#FFD36E', '#FF8A3D', '#E8457A'],
    habits: { focus: '#FFB13D', gym: '#FF4F7B', mandarin: '#FFD36E', protein: '#D46BFF', water: '#5ED3E0' },
    glow: ['rgba(255,106,61,0.13)', 'rgba(232,69,122,0.08)', 'rgba(0,0,0,0)'] },
  violet: { name: 'Nebula Violet', bg: '#08050F', surface: 'rgba(30,22,46,0.60)', text: '#F6F2FF', muted: '#A49BBE', accent: '#9D6BFF', accentInk: '#12052A',
    sunRing: ['#A86A16', '#FFD27A'], galaxy: ['#5B2DCC', '#9D6BFF'], moon: ['#B03FCB', '#F08BFF'], sun: ['#FFD27A', '#FF9DCB', '#B57BFF'],
    habits: { focus: '#7DF0C5', gym: '#FF7AB6', mandarin: '#FFC27A', protein: '#C7A2FF', water: '#7AD7FF' },
    glow: ['rgba(157,107,255,0.14)', 'rgba(240,139,255,0.07)', 'rgba(0,0,0,0)'] },
  mono: { name: 'Monochrome', bg: '#000000', surface: 'rgba(28,28,30,0.66)', text: '#FFFFFF', muted: '#98989D', accent: '#E5E5EA', accentInk: '#000000',
    sunRing: ['#5A5A5E', '#D1D1D6'], galaxy: ['#8E8E93', '#F2F2F7'], moon: ['#636366', '#C7C7CC'], sun: ['#FFFFFF', '#AEAEB2', '#7C7C80'],
    habits: { focus: '#F2F2F7', gym: '#D1D1D6', mandarin: '#AEAEB2', protein: '#C7C7CC', water: '#E5E5EA' },
    glow: ['rgba(255,255,255,0.04)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)'] },
  ocean: { name: 'Ocean Teal', bg: '#02090C', surface: 'rgba(14,32,38,0.60)', text: '#EEFAFB', muted: '#8FA9AE', accent: '#14B8C4', accentInk: '#01161A',
    sunRing: ['#A47A0A', '#FFE29A'], galaxy: ['#0B5F7A', '#14B8C4'], moon: ['#2E6BFF', '#7FB2FF'], sun: ['#FFE29A', '#7FE3D0', '#3FA7FF'],
    habits: { focus: '#4ADE80', gym: '#FF7A90', mandarin: '#FFC857', protein: '#A78BFA', water: '#22D3EE' },
    glow: ['rgba(20,184,196,0.12)', 'rgba(46,107,255,0.07)', 'rgba(0,0,0,0)'] },
};
const DEFAULT_PALETTE = 'aurora';
const CUSTOM_KEYS = [['accent', 'Accent'], ['galaxy', 'Galaxy ring'], ['sunRing', 'Sun ring'], ['moon', 'Moon ring'], ['sun', 'Sun dial'], ['focus', 'Satisfying'], ['gym', 'Gym'], ['mandarin', '中文'], ['protein', 'Protein'], ['water', 'Water']];
const COL = { water: '#5EE0D8', bg: '#000000', sunB: '#FF9F0A', sunC: '#FF6482',  green: '#30D158', cyan: '#64D2FF', yellow: '#FFD60A', purple: '#BF5AF2', blue: '#0A84FF', orange: '#FF9F0A', pink: '#FF6482', red: '#FF375F', indigo: '#5E5CE6' };
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
const DEFAULT_CHORES = [
  { id: 'c-water', icon: '💧', name: 'Refill water bottle', time: 630, repeat: 'daily' },
  { id: 'c-gym', icon: '🏋️', name: 'Gym', time: 960, repeat: 'weekdays', days: [1, 2, 3, 4, 5, 6] },
  { id: 'c-laundry', icon: '🧺', name: 'Laundry', time: 660, repeat: 'every', n: 3, start: '' },
  { id: 'c-tidy', icon: '🧹', name: 'Tidy room', time: 1260, repeat: 'daily' },
];
const CHORE_ICONS = ['💧', '🏋️', '🧺', '🧹', '🦷', '🍳', '🛒', '🧴', '💊', '🪴', '🐕', '📚', '🧘', '🚿', '🗑️', '📞', '💻', '🧾', '🍽️', '🛏️', '🚶', '☀️', '🌙', '✉️', '🧪', '🎸', '🧽', '🚗', '✨'];
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_MORNING = ['Water', 'Sunlight', 'Brush teeth', 'Protein breakfast', 'Open Orrery'];
const DEFAULT_PEOPLE = [
  { id: 'p-mom', name: 'Mom', every: 7, last: '', bday: '' },
  { id: 'p-dad', name: 'Dad', every: 7, last: '', bday: '' },
  { id: 'p-gf', name: 'Girlfriend', every: 3, last: '', bday: '' },
  { id: 'p-friend', name: 'Friend', every: 30, last: '', bday: '' },
];
const emptyStore = () => ({ v: 2, name: 'Lav', birth: '', lifeYears: 80, goalMin: 180, proteinGoal: 120, mandarinGoal: 30, gymGoal: 45, waterGoal: 2500, palette: DEFAULT_PALETTE, custom: {}, quiet: true, reminders: { sunrise: false, review: false, habits: false, teeth: false, birthdays: false }, notified: {}, days: {}, intentions: {}, goals: [], firsts: [], people: DEFAULT_PEOPLE.map((p) => ({ ...p })), shape: DEFAULT_SHAPE.map((b) => ({ ...b })), morningList: [...DEFAULT_MORNING], chores: DEFAULT_CHORES.map((c) => ({ ...c, days: c.days ? [...c.days] : undefined, ...(c.repeat === 'every' ? { start: new Date().toISOString().slice(0, 10) } : {}) })), orbit: false, dreams: [], timer: null, place: { ...DEFAULT_PLACE } });
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
  s.chores = Array.isArray(o.chores) ? o.chores.filter((c) => c && c.id).map((c) => ({ icon: '✨', name: 'Chore', time: 720, repeat: 'daily', ...c, time: clamp(Math.round(+c.time || 0), 0, 1439) })) : b.chores;
  s.orbit = !!o.orbit;
  s.quiet = o.quiet === undefined ? true : !!o.quiet;
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
    galaxy: c.galaxy ? [shade(c.galaxy, 0.55), c.galaxy] : base.galaxy.slice(0, 2), sunRing: c.sunRing ? [shade(c.sunRing, 0.6), c.sunRing] : base.sunRing, moon: c.moon ? [shade(c.moon, 0.6), c.moon] : base.moon,
    sun: c.sun ? [c.sun, shade(c.sun, 0.8), shade(c.sun, 0.6)] : base.sun,
    habits: Object.fromEntries(Object.entries(base.habits).map(([k, v]) => [k, c[k] || v])) };
}
let PAL = PALETTES[DEFAULT_PALETTE];
let choreVer = 0; // bumps whenever chores or their ticks change, so the dial redraws
function applyPalette() {
  document.body.classList.toggle('quiet', !!store.quiet);
  const P = resolvePalette(store.palette, store.custom); PAL = P;
  Object.assign(COL, { bg: P.bg, blue: P.accent, green: P.habits.focus, pink: P.habits.gym, orange: P.habits.mandarin, purple: P.habits.protein, water: P.habits.water,
    cyan: P.moon[1], yellow: P.sun[0], sunB: P.sun[1], sunC: P.sun[2], red: P.galaxy[1] });
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
    '--cyan': P.moon[1], '--blue': P.accent, '--yellow': P.sun[0], '--glow1': P.glow[0], '--glow2': P.glow[1], '--glow3': P.glow[2],
    '--bar': `rgba(${Math.round(r * 0.6 + 12)},${Math.round(g * 0.6 + 12)},${Math.round(b * 0.6 + 14)},0.74)`, '--sheet': `rgba(${Math.round(r * 0.5 + 26)},${Math.round(g * 0.5 + 26)},${Math.round(b * 0.5 + 30)},0.94)` };
  Object.entries(vars).forEach(([k, v]) => R.setProperty(k, v));
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', P.bg);
}
function swatchSVG(P) {
  const arc = (r, f, col, w) => { const C = 2 * Math.PI * r; return `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${w}"/><circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 40)"/>`; };
  const gid = 'sw' + Math.random().toString(36).slice(2, 7);
  const stops = (P.galaxy[2] ? [P.galaxy[0], P.galaxy[1], P.galaxy[2]] : [P.galaxy[0], P.galaxy[1]]).map((c, i, a) => `<stop offset="${(i / (a.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
  const C1 = 2 * Math.PI * 33;
  return `<svg viewBox="0 0 80 96" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect width="80" height="96" rx="14" fill="${P.bg}"/>
    <circle cx="40" cy="40" r="33" fill="none" stroke="${P.galaxy[1]}" stroke-opacity=".18" stroke-width="6"/><circle cx="40" cy="40" r="33" fill="none" stroke="url(#${gid})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(0.78 * C1).toFixed(1)} ${C1.toFixed(1)}" transform="rotate(-90 40 40)"/>
    ${arc(25.5, 0.87, P.sunRing[1], 6)}${arc(18, 0.45, P.moon[1], 6)}<path d="M 29 40 A 11 11 0 0 1 51 40" fill="none" stroke="${P.sun[0]}" stroke-width="3.5" stroke-linecap="round"/><path d="M 51 40 A 11 11 0 0 1 47.8 47.8" fill="none" stroke="${P.sun[2]}" stroke-width="3.5" stroke-linecap="round"/>
    ${Object.values(P.habits).map((c, i) => `<circle cx="${14 + i * 13}" cy="85" r="4.2" fill="${c}"/>`).join('')}</svg>`;
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
const repeatText = (c) => (c.repeat === 'weekdays' ? ((c.days || []).length === 7 ? 'Every day' : (c.days || []).map((d) => WD_SHORT[d]).join(' ') || 'No days picked')
  : c.repeat === 'weekly' ? `Weekly on ${WD_SHORT[+c.wd || 0]}` : c.repeat === 'every' ? `Every ${Math.max(2, +c.n || 2)} days` : 'Daily');
// every chore occurrence (plus the built-in teeth) from yesterday to the day after tomorrow
function choreOcc(S, maxD = 2) {
  const out = [];
  for (let d = -1; d <= maxD; d++) {
    const k = addDays(S.today, d), base = kms(k);
    store.chores.forEach((c) => { if (dueOn(c, k)) out.push({ c, k, id: c.id, icon: c.icon, name: c.name, t: base + c.time * 60000, done: choreDone(c, k), act: `chore:${c.id}:${k}` }); });
    out.push({ c: null, k, id: 'teeth', icon: '🦷', name: 'Brush teeth', t: base + wrap(S.bed - 30) * 60000, done: !!(store.days[k] && store.days[k].brushed), act: `brushOn:${k}` });
  }
  out.forEach((o) => { o.dt = (o.t - S.now) / 60000; o.overdue = !o.done && o.dt < -30 && o.dt > -720; });
  return out;
}
function choreIcon(o, r, extra = '') {
  return `<g class="chore tap${o.done ? ' done' : ''}${o.overdue ? ' overdue' : ''}" data-act="${o.act}" ${extra}>${o.overdue ? `<circle class="halo" r="${r + 5}" fill="none" stroke="${COL.sunC}" stroke-width="3"/>` : ''}<circle r="${r}" fill="${COL.bg}" stroke="${o.done ? COL.green : 'rgba(255,255,255,.35)'}" stroke-width="1.6"/><text class="emo" y="${(r * 0.36).toFixed(1)}" text-anchor="middle" font-size="${(r * 1.05).toFixed(1)}">${o.icon}</text>${o.done ? `<circle cx="${(r * 0.72).toFixed(1)}" cy="${(-r * 0.72).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="${COL.green}"/><path d="M${(r * 0.52).toFixed(1)} ${(-r * 0.72).toFixed(1)} l${(r * 0.16).toFixed(1)} ${(r * 0.17).toFixed(1)} l${(r * 0.28).toFixed(1)} ${(-r * 0.32).toFixed(1)}" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g>`;
}
function flatChoresSVG(S, D) {
  const today = choreOcc(S).filter((o) => o.k === S.today && o.id !== 'teeth').sort((a, b) => a.t - b.t);
  let last = -1e9, lane = 0;
  return today.map((o) => {
    const m = wrap(Math.round((o.t - kms(S.today)) / 60000));
    lane = m - last < 40 ? (lane + 1) % 2 : 0; last = m;
    const [x, y] = pt(D - (lane ? 30 : 0), dialF(m));
    return choreIcon(o, 12, `transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"`);
  }).join('');
}
// ---- time helix: today's loop tilted in perspective with NOW at the front, climbing one turn per 24 h ----
const HX = { cx: 300, cy: 388, rx: 118, ry: 36, pitch: 62, ahead: 66 * 60, past: 4 * 60, seg: 15 };
let helixPhi = 0; // drag rotation, degrees
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function strandCol(f) { // palette gradient along the helix, 0 = now → 1 = top
  const g = RINGS.wheel.c ? [RINGS.wheel.a, RINGS.wheel.b, RINGS.wheel.c] : [RINGS.wheel.a, RINGS.wheel.b];
  const x = clamp(f, 0, 1) * (g.length - 1), i = Math.min(g.length - 2, Math.floor(x));
  return mixHex(g[i], g[i + 1], x - i);
}
function helixSVG(S, D, phi = 0) {
  const { cx, cy, rx, ry, pitch } = HX, items = [];
  const P = (dt, off = 0) => { const a = ((dt / 1440) * 360 + phi + off) * Math.PI / 180; return [cx + rx * Math.sin(a), cy + ry * Math.cos(a) - (dt / 1440) * pitch, Math.cos(a)]; };
  const dayAt = (dt) => { const m = wrap(S.nowMin + dt); return S.sun.polar === 'day' || (S.sun.polar === null && m >= S.rise && m < S.set); };
  const depth = (dt, z) => { const k = (1 + z) / 2, far = Math.max(0, dt) / HX.ahead; return { k, fade: dt < 0 ? 0.35 + 0.65 * (1 + dt / HX.past) * 0.5 : 1 - 0.55 * far }; };
  // strand A: time itself (palette gradient, warmed in daylight). strand B: a faint mirrored strand.
  for (let dt = -HX.past; dt < HX.ahead; dt += HX.seg) {
    const [x0, y0, z0] = P(dt), [x1, y1, z1] = P(dt + HX.seg), z = (z0 + z1) / 2, { k, fade } = depth(dt, z);
    const base = strandCol((dt + HX.seg / 2) / HX.ahead), col = dayAt(dt + HX.seg / 2) ? mixHex(base, COL.yellow, 0.55) : base;
    items.push({ z, svg: `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${col}" stroke-width="${((2.5 + 7 * k) * (0.6 + 0.4 * fade)).toFixed(1)}" stroke-linecap="round" opacity="${((0.25 + 0.75 * k) * fade).toFixed(2)}"/>` });
    if ((dt / HX.seg) % 2 === 0) {
      const [u0, v0, w0] = P(dt, 180), [u1, v1, w1] = P(dt + HX.seg * 2, 180), wz = (w0 + w1) / 2, kk = (1 + wz) / 2;
      items.push({ z: wz, svg: `<line x1="${u0.toFixed(1)}" y1="${v0.toFixed(1)}" x2="${u1.toFixed(1)}" y2="${v1.toFixed(1)}" stroke="${RINGS.moon.b}" stroke-width="${(1 + 2.5 * kk).toFixed(1)}" stroke-linecap="round" opacity="${((0.1 + 0.3 * kk) * fade).toFixed(2)}"/>` });
    }
  }
  // rungs at sunrise and sunset, linking the two strands
  if (S.sun.polar === null) {
    for (let d = -1; d <= 3; d++) [[S.rise, COL.sunB], [S.set, COL.sunC]].forEach(([m, col]) => {
      const dt = m - S.nowMin + d * 1440; if (dt < -HX.past || dt > HX.ahead) return;
      const [x0, y0, z0] = P(dt), [x1, y1, z1] = P(dt, 180), { fade } = depth(dt, 0);
      items.push({ z: Math.min(z0, z1) + 0.01, svg: `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${col}" stroke-width="1.2" opacity="${(0.28 * fade).toFixed(2)}" stroke-dasharray="2 4"/>` });
      items.push({ z: z0 + 0.003, svg: `<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="${(1.8 + 2.4 * (1 + z0) / 2).toFixed(1)}" fill="${col}" opacity="${(0.7 * fade).toFixed(2)}"/>` });
    });
  }
  // day labels on each turn, beside the turn at that day's noon height
  for (let d = 0; d <= 3; d++) {
    const dtNoon = (kms(addDays(S.today, d)) - S.now) / 60000 + 720; if (dtNoon > HX.ahead + 360) continue;
    const y = cy - (Math.max(dtNoon, 0) / 1440) * pitch, k = addDays(S.today, d);
    items.push({ z: -5, svg: `<text class="ql" x="${cx - rx - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="${d === 0 ? 12 : 11}" font-weight="${d === 0 ? 700 : 600}" fill="${d === 0 ? COL.yellow : '#B9B3D6'}" opacity="${(1 - 0.17 * d).toFixed(2)}">${d === 0 ? 'Today' : WD_SHORT[wdOf(k)]}</text>` });
  }
  // chores + teeth on every turn; the same time of day lines up as a column
  const occ = choreOcc(S, 3).filter((o) => o.dt >= -HX.past && o.dt <= HX.ahead);
  const soon = occ.filter((o) => o.dt >= 0 && !o.done).sort((a, b) => a.dt - b.dt).slice(0, 2).map((o) => o.id + o.k);
  const inTxt = (m) => (m < 60 ? Math.round(m) + 'm' : Math.floor(m / 60) + 'h' + (Math.round(m % 60) ? ' ' + Math.round(m % 60) + 'm' : ''));
  occ.forEach((o) => {
    const [x, y, z] = P(o.dt), { k, fade } = depth(o.dt, z), past = o.dt < 0;
    const sc = (0.5 + 0.7 * k) * (0.55 + 0.45 * fade), op = past ? (o.overdue ? 0.6 + 0.3 * k : 0.15 + 0.25 * k) : (0.3 + 0.7 * k) * (0.35 + 0.65 * fade);
    const side = x > cx ? 1 : -1;
    const lab = soon.includes(o.id + o.k) ? `<g class="ql"><text x="${side * 22}" y="-2" text-anchor="${side > 0 ? 'start' : 'end'}" font-size="12" font-weight="600" fill="#fff">${esc(o.name)}</text><text x="${side * 22}" y="12" text-anchor="${side > 0 ? 'start' : 'end'}" font-size="11" fill="#B9B3D6">in ${inTxt(o.dt)}</text></g>` : '';
    items.push({ z: z + 0.004, svg: `<g transform="translate(${x.toFixed(1)} ${(y - 1).toFixed(1)}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(2)}">${choreIcon(o, 14)}${lab}</g>` });
  });
  const [nx, ny, nz] = P(0);
  items.push({ z: nz + 0.5, svg: `<g class="tap" data-ring="sun"><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="20" fill="${COL.yellow}" opacity=".35" filter="url(#now-glow)" class="breathe"/><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="9.5" fill="${shade(COL.yellow, 1.2)}" stroke="${COL.bg}" stroke-width="2"/><text class="ql" x="${nx.toFixed(1)}" y="${(ny + 30).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing=".1em" fill="${COL.yellow}">NOW</text></g>` });
  items.push({ z: -9, svg: `<text class="ql" x="${cx}" y="${(cy - ry - 3 * pitch - 18).toFixed(1)}" text-anchor="middle" font-size="9.5" letter-spacing=".12em" fill="#8e8e93" opacity=".75">↑ LATER · ONE TURN = ONE DAY${phi ? '' : ' · DRAG TO TURN'}</text>` });
  return items.sort((a, b) => a.z - b.z).map((i) => i.svg).join('');
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
function ringLayout(order) {
  const n = order.length, outer = 276, inner = 140;
  const step = n > 1 ? Math.min(36, (outer - inner) / (n - 1)) : 0;
  const sw = Math.max(16, Math.min(28, step - 8));
  return { radii: order.map((_, i) => outer - i * step), sw, dial: Math.max(70, outer - (n - 1) * step - step - 4) };
}
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
  order.forEach((id) => { const R = defs[id]; g += `<linearGradient id="${p}-g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${R.a}"/>${R.c ? `<stop offset="55%" stop-color="${R.b}"/><stop offset="100%" stop-color="${R.c}"/>` : `<stop offset="100%" stop-color="${R.b}"/>`}</linearGradient>`; });
  g += `<filter id="${p}-aur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>`;
  g += `<linearGradient id="${p}-day" gradientUnits="userSpaceOnUse" x1="${CX - L.dial}" y1="${CX}" x2="${CX + L.dial}" y2="${CX}"><stop offset="0%" stop-color="${COL.sunB}"/><stop offset="50%" stop-color="${COL.yellow}"/><stop offset="100%" stop-color="${COL.sunB}"/></linearGradient>`;
  g += `<filter id="${p}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  g += stars();
  order.forEach((id, i) => {
    const R = defs[id], r = L.radii[i], C = 2 * Math.PI * r;
    g += `<g id="${p}-wrap-${id}" class="ring tap" data-ring="${id}">`;
    g += `<circle cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="${R.b}" stroke-opacity="0.17" stroke-width="${L.sw}"/>`;
    if (R.c && PAL.aurora) g += `<circle id="${p}-ra-${id}" class="ring aur" cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="url(#${p}-g-${id})" stroke-width="${L.sw + 6}" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${CX} ${CX})" filter="url(#${p}-aur)" opacity="0.55" pointer-events="none"/>`;
    g += `<circle id="${p}-r-${id}" class="ring" cx="${CX}" cy="${CX}" r="${r}" fill="none" stroke="url(#${p}-g-${id})" stroke-width="${L.sw}" stroke-linecap="round" stroke-dasharray="0.01 ${C}" transform="rotate(-90 ${CX} ${CX})"/>`;
    g += `<text id="${p}-t-${id}" class="${p === 'now' ? 'ql' : ''}" x="${CX + 10}" y="${CX - r + 4.5}" font-size="11.5" font-weight="800" letter-spacing="0.08em" fill="${R.b}">${R.name}</text></g>`;
  });
  g += `<g id="${p}-dots"></g><g id="${p}-moon"></g>`;
  const D = L.dial;
  if (mode === 'zones') g += `<g id="${p}-dialg" class="dialg">`;
  g += `<circle class="tap" data-ring="sun" cx="${CX}" cy="${CX}" r="${D + 8}" fill="transparent"/>`;
  g += `<circle cx="${CX}" cy="${CX}" r="${D}" fill="none" stroke="${RINGS.moon.b}" stroke-opacity="0.2" stroke-width="16" pointer-events="none"/>`;
  g += mode === 'zones'
    ? `<path id="${p}-z1" fill="none" stroke="${COL.yellow}" stroke-width="16" stroke-linecap="round"/><path id="${p}-z2" fill="none" stroke="${COL.sunB}" stroke-width="16"/><path id="${p}-z3" fill="none" stroke="${COL.sunC}" stroke-width="16" stroke-linecap="round"/><line id="${p}-stop" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
    : `<path id="${p}-day" fill="none" stroke="url(#${p}-day)" stroke-width="16" stroke-linecap="round"/><text id="${p}-rise" font-size="11" fill="${COL.sunB}"></text><text id="${p}-set" font-size="11" fill="${COL.sunB}" text-anchor="end"></text>`;
  [0, 6, 12, 18].forEach((h) => { const [x, y] = pt(D - 24, dialF(h * 60)); g += `<text class="${p === 'now' ? 'ql' : ''}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#636366">${String(h).padStart(2, '0')}</text>`; });
  g += `<g id="${p}-sun" class="rot" style="transform-origin:${CX}px ${CX}px"><circle class="breathe" cx="${CX}" cy="${CX - D}" r="13" opacity="0.35" filter="url(#${p}-glow)"/><circle cx="${CX}" cy="${CX - D}" r="7.5" stroke="${COL.bg}" stroke-width="2"/></g>`;
  if (mode === 'zones') g += `<g id="${p}-tooth" class="tap tooth" data-act="brush" role="button" aria-label="Brush teeth before sleep"><circle r="15" fill="${COL.bg}" stroke="#8E8EF5" stroke-width="2"/><path d="M-6.5 -8.5c-2.6 0-4.3 2-4.3 4.6 0 2 .8 3.4 1.3 5.1.6 2.4.9 7.6 2.8 7.6 1.6 0 1.7-5.1 3.1-5.1h0c1.4 0 1.5 5.1 3.1 5.1 1.9 0 2.2-5.2 2.8-7.6.5-1.7 1.3-3.1 1.3-5.1 0-2.6-1.7-4.6-4.3-4.6-1.3 0-2.1.7-2.9.7s-1.6-.7-2.9-.7z" fill="none" stroke="#C7C7FF" stroke-width="1.6" stroke-linejoin="round" transform="scale(.82)"/></g><g id="${p}-chores"></g>`;
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
  if (mode === 'zones') g += miniSVG(p);
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
const ROW_Y = 650, FACE_H = 712;
const habitPos = (i, n) => [n > 1 ? 70 + i * (460 / (n - 1)) : 300, ROW_Y];
const MINI_R = 30, MINI_SW = 9;
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
    setA(`${p}-ra-${id}`, 'stroke-dasharray', `${Math.max(0.01, f * C).toFixed(2)} ${C.toFixed(2)}`);
    setA(`${p}-t-${id}`, 'fill', f > 0.09 ? '#000' : defs[id].b);
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
    else { const [x, y] = pt(L.radii[mi], defs.moon.f(S)); mg.innerHTML = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${L.sw / 2 - 2}" fill="${COL.bg}"/>` + moonGlyph(+x.toFixed(1), +y.toFixed(1), L.sw / 2 - 4, S.moonP, '#F2F2F7', '#1C1C1E', COL.bg); }
  }
  const D = L.dial;
  const hasSun = S.sun.polar === null;
  if (mode === 'zones') {
    setA(p + '-z1', 'd', hasSun ? arcD(D, S.rise, S.mEnd) : '');
    setA(p + '-z2', 'd', hasSun ? arcD(D, S.mEnd, S.eStart) : '');
    setA(p + '-z3', 'd', hasSun ? arcD(D, S.eStart, S.set) : '');
    setA(p + '-z1', 'opacity', S.zone === 'morning' ? 1 : 0.5); setA(p + '-z2', 'opacity', S.zone === 'afternoon' ? 1 : 0.5); setA(p + '-z3', 'opacity', S.zone === 'evening' ? 1 : 0.5);
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
        ? `<circle cx="${CX}" cy="${CX}" r="34" fill="${COL.yellow}" opacity=".16" filter="url(#${p}-glow)" class="breathe"/><circle cx="${CX}" cy="${CX}" r="15" fill="${COL.yellow}" opacity=".85"/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), s2 = Math.sin(a); return `<line x1="${(CX + 21 * c).toFixed(1)}" y1="${(CX + 21 * s2).toFixed(1)}" x2="${(CX + 28 * c).toFixed(1)}" y2="${(CX + 28 * s2).toFixed(1)}" stroke="${COL.yellow}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`; }).join('')
        : `<circle cx="${CX}" cy="${CX}" r="32" fill="#C7C7FF" opacity=".08" filter="url(#${p}-glow)" class="breathe"/>` + moonGlyph(CX, CX, 17, S.moonP, '#F2F2F7', '#2C2C3A', COL.bg);
    }
    setT(p + '-peekT', `${S.hhmm}:${S.ss}`);
    setT(p + '-peekS', S.sunLine);
    updateMinis(p, S);
    const ck = `${Math.floor(S.now / 60000)}|${choreVer}|${PAL.name}`;
    const cg = document.getElementById(p + '-chores');
    if (cg && cg.dataset.k !== ck) { cg.innerHTML = flatChoresSVG(S, D); cg.dataset.k = ck; }
    const og = document.getElementById(p + '-orbit');
    const hk = ck + '|' + helixPhi.toFixed(1);
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
  ['now', 'Now', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'],
  ['today', 'Today', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'],
  ['cycles', 'Cycles', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>'],
  ['life', 'Life', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'],
  ['journal', 'Journal', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'],
];
const TOP = [
  ['cosmos', 'Cosmos', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>'],
  ['settings', 'Settings', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'],
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
    <div class="card ctx" data-h="ctx"></div>
    <div data-h="quick"></div>
    <div class="muted center qh" style="margin-top:14px;font-size:12.5px">Tap a ring to log it, or a chore icon to tick it. The Galaxy ring opens Cosmos.</div>
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
    return `${lines.join('')}${H3('<h3 style="color:#8E8EF5">Tonight</h3>')}${chk(S.brushed, 'Brush teeth', 'brush')}${chk(wrote, wrote ? "Tonight's line is written" : "One line for today's journal", 'tab:journal')}
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
    return `<div class="quick">${S.wakeLogged ? '' : ib('☀︎', 'awake', 'yellow fill', "I'm awake")}${ib('+25m', 'focus:25', S.wakeLogged ? 'green fill' : '', '+25 min satisfying work')}${ib('💧', 'water:250', '', '+250 ml')}${ib('💧💧', 'water:500', '', '+500 ml')}${ib('🍽', 'sheet:protein', '', 'Food & sugar')}</div>`;
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
    <div class="row" style="margin-top:6px"><input type="time" class="field slim" data-f="choreTime:${c.id}" value="${hm(c.time)}" style="width:auto" aria-label="Time">
      <select class="field slim" data-f="choreRep:${c.id}" style="width:auto" aria-label="Repeat">${[['daily', 'Daily'], ['weekdays', 'Chosen days'], ['every', 'Every N days'], ['weekly', 'Weekly']].map(([v, l]) => `<option value="${v}" ${c.repeat === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${c.repeat === 'weekdays' ? `<div class="wds">${WD_SHORT.map((d, i) => `<button class="wd ${(c.days || []).includes(i) ? 'on' : ''}" data-act="choreDay:${c.id}:${i}" aria-label="${d}">${d[0]}</button>`).join('')}</div>` : ''}
      ${c.repeat === 'every' ? `<label class="muted inl">every <input type="number" min="2" max="60" class="field slim" data-f="choreN:${c.id}" value="${Math.max(2, +c.n || 2)}" style="width:64px"> days from <input type="date" class="field slim" data-f="choreStart:${c.id}" value="${choreStart(c)}" style="width:auto"></label>` : ''}
      ${c.repeat === 'weekly' ? `<select class="field slim" data-f="choreWd:${c.id}" style="width:auto">${WD_SHORT.map((d, i) => `<option value="${i}" ${(+c.wd || 0) === i ? 'selected' : ''}>${d}</option>`).join('')}</select>` : ''}</div></div>`).join('');
  return `<div class="card"><h3 style="color:${COL.yellow}">Chores on the sun</h3><div class="muted">Each chore sits on the day dial at its time. Tap an icon on Now to tick it. ◐ Helix shows what's coming.</div>
    <div data-h="choreList" style="margin-top:10px"></div>
    <details class="sub"><summary>Edit chores</summary><div class="muted" style="margin:4px 0 8px">🦷 Brush teeth is built in at bedtime.</div>${rows}
      <div class="row" style="margin-top:12px">${pill('+ Add a chore', 'choreAdd', 'yellow fill')}</div></details></div>`;
}
function choreListHTML(S) {
  if (!store.chores.length) return '<div class="muted">No chores yet. Add one below.</div>';
  return store.chores.map((c) => {
    const due = dueOn(c, S.today), done = choreDone(c, S.today), od = due && !done && S.nowMin > c.time + 30, nx = choreNext(c, S), st = choreStreak(c, S);
    const status = due ? (done ? 'done today ✓' : od ? 'overdue, whenever u can' : 'today ' + hm(c.time)) : nx ? 'next ' + nx.label : 'not scheduled';
    return `<div class="shape-row ${od ? 'od' : ''}"><button class="chip-ic ${done ? 'done' : ''}" data-act="chore:${c.id}:${S.today}" ${due ? '' : 'disabled'} aria-label="Tick ${esc(c.name)}">${c.icon}</button><span class="nm">${esc(c.name)}<span class="muted" style="display:block;font-size:12.5px">${repeatText(c)} · ${status}${st ? ` · streak ${st}` : ''}</span></span></div>`;
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
      ${store.palette === 'custom' ? `<div class="customgrid">${CUSTOM_KEYS.map(([k, l]) => { const P = resolvePalette('custom', store.custom); const v = k === 'accent' ? P.accent : k === 'galaxy' ? P.galaxy[1] : k === 'sunRing' ? P.sunRing[1] : k === 'moon' ? P.moon[1] : k === 'sun' ? P.sun[0] : P.habits[k]; return `<label class="cpick"><input type="color" data-f="pc:${k}" value="${v}"><span>${l}</span></label>`; }).join('')}</div>
        <div class="row" style="margin-top:10px">${pill('Reset custom colours', 'palReset')}</div>` : ''}</div>
    <div class="card"><h3>Chores</h3><div class="muted">Add, edit or delete chores (icon, name, time, repeat) in Today → Chores on the sun.</div><div class="row" style="margin-top:10px">${pill('Edit chores', 'editChores')}</div></div>
    <div class="card"><h3>After-waking checklist</h3><div class="muted">One item per line. It shows on the night screen as a preview, and in the morning as ticks.</div>
      <textarea class="field" data-f="morningList" rows="5" style="margin-top:10px">${esc(store.morningList.join('\n'))}</textarea></div>
    <div class="card"><h3>Reminders</h3>${tog('sunrise', 'At sunrise: get outside light')}${tog('habits', '2 h before sunset: habits still open')}${tog('review', '30 min after sunset: sunset review')}${tog('teeth', 'Before bed: brush teeth')}${tog('birthdays', '3 days before a birthday, and on the day')}
      <div class="muted" style="margin-top:10px" data-t="notifStatus"></div><div class="muted" style="margin-top:6px">Reminders fire only while Orrery is open (or running in the background on Mac). They're silent: no sound, no vibration.</div></div>
    <div class="card"><h3>Ur data</h3><div class="row"><span class="dot" data-h-bg="saveDot"></span><span data-t="saveLine"></span></div>
      <div class="muted" style="margin-top:8px">Everything lives in this browser's local storage. Nothing is sent anywhere. Another browser or device won't see it, and clearing site data wipes it, so export now and then.</div>
      <div class="row" style="margin-top:12px">${pill('Export backup', 'export', 'blue fill')}${pill('Import backup', 'import')}${pill(confirmReset ? 'Tap again to erase everything' : 'Reset', 'reset')}</div>
      <input type="file" id="importFile" accept="application/json,.json" hidden></div>
    <div class="card"><h3>About</h3><div class="muted">Orrery · a calendar of orbits. Galaxy = Wheel (Sun around Sagittarius A*, 230 My working value). Private, offline, made for Lav.</div><div class="muted" style="margin-top:8px">${esc(MOTTO)}</div></div>
  </div></div>`;
}
const VIEWS = { now: viewNow, today: viewToday, cycles: viewCycles, life: viewLife, journal: viewJournal, cosmos: viewCosmos, settings: viewSettings };

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
  el.classList.add('open');
  bind(S);
}
function closeSheet() { sheet = null; $('#sheet').classList.remove('open'); }

// ===================== RENDER + TICK =====================
function renderTop() {
  $('#topbar').innerHTML = TOP.map(([id, label, icon]) => `<button class="topbtn ${tab === id ? 'on' : ''}" data-act="tab:${id}" aria-label="${label}" title="${label}">${icon}</button>`).join('');
}
function renderTabs() {
  renderTop();
  $('#tabs').innerHTML = `<div class="brand">Orrery</div><div class="brand-sub">A calendar of orbits</div>` +
    TABS.map(([id, label, icon]) => `<button class="tab ${tab === id ? 'on' : ''} tab-${id}" data-act="tab:${id}" aria-label="${label}" data-tip="${label}">${icon}<span>${label}</span></button>`).join('');
}
function render() {
  const S = compute(Date.now());
  $('#view').innerHTML = `<div class="view">${VIEWS[tab](S)}</div>`;
  renderTabs();
  tick();
}
function tick() {
  const S = compute(Date.now());
  if (tab === 'now') updateFace('now', RING_ORDER, RINGS, 'zones', S);
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
  if (R.teeth && !S.brushed && !done.teeth && wrap(S.nowMin - (S.bed - 45)) < 90) due.push(['teeth', 'Teeth, then sleep', 'Two minutes of brushing. Ur future dentist sends regards.']);
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
      tick(); return;
    }
    case 'chore': {
      const c = store.chores.find((x) => x.id === arg); if (!c) return;
      const k = arg2 || dkey(Date.now()), d = dayOf(k); d.chores = d.chores || {}; d.chores[c.id] = !d.chores[c.id]; save(); choreVer++; tick();
      const S = compute(Date.now()), nx = choreNext(c, S), st = choreStreak(c, S);
      toast(d.chores[c.id] ? `${c.icon} ${c.name} ✓${st > 1 ? ` · streak ${st}` : ''}${nx ? ` · next ${nx.label}` : ''}` : `${c.icon} ${c.name} unticked${nx ? ` · next ${nx.label}` : ''}`);
      return;
    }
    case 'brushOn': { const d = dayOf(arg); d.brushed = !d.brushed; save(); choreVer++; tick(); toast(d.brushed ? '🦷 Teeth ✓' : '🦷 Teeth unticked'); return; }
    case 'choreAdd': { const S = compute(Date.now()); store.chores.push({ id: 'c' + Date.now(), icon: '✨', name: 'New chore', time: Math.min(1439, (Math.floor(S.nowMin / 60) + 1) * 60), repeat: 'daily', created: S.today }); save(); choreVer++; render(); openChoreEditor(); return; }
    case 'choreDel': store.chores = store.chores.filter((c) => c.id !== arg); save(); choreVer++; render(); openChoreEditor(); return;
    case 'choreDay': store.chores = store.chores.map((c) => { if (c.id !== arg) return c; const ds = new Set(c.days || []), n = +arg2; if (ds.has(n)) ds.delete(n); else ds.add(n); return { ...c, days: [...ds].sort() }; }); save(); choreVer++; render(); openChoreEditor(); return;
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
    case 'choreIcon': case 'choreName': case 'choreTime': case 'choreRep': case 'choreN': case 'choreStart': case 'choreWd': {
      const key = { choreIcon: 'icon', choreName: 'name', choreTime: 'time', choreRep: 'repeat', choreN: 'n', choreStart: 'start', choreWd: 'wd' }[k];
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
        return nc;
      });
      choreVer++; save(); tick();
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
    if (HABITS[r]) { const goal = { focus: dur(store.goalMin), gym: store.gymGoal + 'm', mandarin: store.mandarinGoal + 'm', water: litres(store.waterGoal), protein: store.proteinGoal + 'g' }[r]; return `${HABITS[r].name} · ${HABITS[r].v(S)} / ${goal}`; }
    return RINGS[r] ? RINGS[r].name : '';
  }
  const a = el.dataset.act || '';
  const [cmd, id, k] = a.split(':');
  if (cmd === 'chore') { const c = store.chores.find((x) => x.id === id); if (!c) return ''; const d = dayOf(k), when = k === S.today ? 'today' : k === addDays(S.today, 1) ? 'tomorrow' : WD_SHORT[wdOf(k)]; return `${c.icon} ${c.name} · ${when} ${hm(c.time)}${d.chores && d.chores[c.id] ? ' · done' : ''}`; }
  if (cmd === 'brushOn' || cmd === 'brush') return '🦷 Brush teeth before sleep';
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
    const f = e.target.closest('#nowFace.orbit-on svg'); if (!f) return;
    drag = { x: e.clientX, phi: helixPhi, w: f.getBoundingClientRect().width }; dragMoved = false;
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) dragMoved = true; if (!dragMoved) return;
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
  // long-press (~0.45 s) shows a fading tooltip and swallows the click that follows
  let lp = null, lpFired = false;
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-ring],[data-tip],.chore[data-act],[data-act^="brush"]'); if (!el) return;
    lpFired = false; const x = e.clientX, y = e.clientY;
    lp = { x, y, t: setTimeout(() => { const txt = tipText(el); if (!txt) return; lpFired = true; showTip(txt, x, y); if (navigator.vibrate) navigator.vibrate(8); }, 450) };
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
document.addEventListener('DOMContentLoaded', boot);
