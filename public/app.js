// QBooth Roulette page: the wheel of the running event's templates, the card of the template under
// the pointer, the spin, the win, and the hand-over to Q-Booth (POST /spin/go -> template/select).
// States: idle (slow attract turn) -> spin -> won (auto-go countdown, maybe a respin) -> handing
// -> away (Q-Booth runs the session; the overlay is hidden) -> idle again on Q-Booth's Welcome.
import { Wheel } from './wheel.js';
import { Fx } from './fx.js';
import { Sound } from './audio.js';
import { initSettings } from './settings.js';

const TEXT = {
  en: {
    title: 'Spin the Wheel!', sub: 'Let luck pick your photo theme', spin: 'SPIN!', hub: 'SPIN', spinning: 'Good luck…',
    got: 'Your theme!', go: "Let's go!", again: 'Spin again', ready: 'Get ready!', readyText: 'Your photo session is starting',
    waiting: 'Waiting for {booth}…', noEvent: 'Run an event in {booth} to start the fun', offline: '{booth} is not answering. Is it running, with its Local API on (Settings → Advanced)?', unauthorized: 'Wrong Local API password: set it in Settings', settingsBtn: '⚙ Settings',
    noTemplates: 'This event has no templates to spin', enjoy: 'Enjoy your photo session!', enjoyText: 'The wheel will be back right after',
    err: { dialog_open: 'Please finish the window on the {booth} screen first', busy: '{booth} is busy, try again', processing: 'A photo is being processed, wait a moment', no_event: 'No event is running', wrong_page: '{booth} is not ready yet, try again', offline: '{booth} is not answering', unknown_template: 'That theme is gone, spin again' },
  },
  id: {
    title: 'Putar Rodanya!', sub: 'Biar keberuntungan memilih tema fotomu', spin: 'PUTAR!', hub: 'PUTAR', spinning: 'Semoga beruntung…',
    got: 'Tema kamu!', go: 'Ayo foto!', again: 'Putar lagi', ready: 'Bersiap!', readyText: 'Sesi fotomu segera dimulai',
    waiting: 'Menunggu {booth}…', noEvent: 'Jalankan event di {booth} untuk mulai', offline: '{booth} belum menjawab. Sudah jalan, dan Local API-nya aktif (Settings → Advanced)?', unauthorized: 'Password Local API salah: isi di Pengaturan', settingsBtn: '⚙ Pengaturan',
    noTemplates: 'Event ini belum punya template untuk diputar', enjoy: 'Selamat berfoto!', enjoyText: 'Rodanya kembali setelah sesi selesai',
    err: { dialog_open: 'Selesaikan dulu jendela di layar {booth}', busy: '{booth} sedang sibuk, coba lagi', processing: 'Foto sedang diproses, tunggu sebentar', no_event: 'Belum ada event yang berjalan', wrong_page: '{booth} belum siap, coba lagi', offline: '{booth} tidak menjawab', unknown_template: 'Tema itu sudah tidak ada, putar lagi' },
  },
  zh: {
    title: '转动幸运轮！', sub: '让好运为你挑选拍照主题', spin: '转！', hub: '转', spinning: '祝你好运…',
    got: '你的主题！', go: '开始拍照！', again: '再转一次', ready: '准备好！', readyText: '拍照马上开始',
    waiting: '正在等待 {booth}…', noEvent: '请在 {booth} 中运行活动', offline: '{booth} 没有响应。它在运行吗？Local API 打开了吗（Settings → Advanced）？', unauthorized: 'Local API 密码错误：请在设置中填写', settingsBtn: '⚙ 设置',
    noTemplates: '这个活动没有可以转的模板', enjoy: '拍照愉快！', enjoyText: '拍完后转盘会回来',
    err: { dialog_open: '请先完成 {booth} 屏幕上的窗口', busy: '{booth} 正忙，请再试一次', processing: '照片处理中，请稍等', no_event: '没有正在运行的活动', wrong_page: '{booth} 还没准备好，请再试一次', offline: '{booth} 没有响应', unknown_template: '这个主题已经没有了，请再转一次' },
  },
};

const $ = id => document.getElementById(id);
const cfg = await (await fetch('/config.json')).json();
const L = TEXT[cfg.language] || TEXT.en;
document.documentElement.lang = cfg.language || 'en';

const wheel = new Wheel($('wheel'));
const fx = new Fx($('fx'));
const sound = new Sound();
sound.init(cfg);

// ---- texts ----
$('titleText').textContent = cfg.title || L.title;
$('subtitle').textContent = L.sub;
$('spinBtn').textContent = L.spin;
$('hub').textContent = L.hub;
$('goText').textContent = L.go;
$('ribbon').textContent = L.got;

// ---- layout: any size, any ratio ----
function layout() {
  const W = innerWidth, H = innerHeight, u = Math.min(W, H) / 100;
  const root = document.documentElement.style;
  root.setProperty('--u', u + 'px');
  const land = W / H >= 1.08;
  const pad = u * 3;
  const T = $('title'), B = $('wheelBox'), S = $('side');
  // the card is ~1.42 x its width tall (ribbon room, square picture, name); under it the buttons
  // need ~19 u (Let's go + Spin again); beside it (row) they need none of the height
  const cardFor = (w, h, row) => Math.max(u * 12, Math.min(w, row ? h / 1.42 : (h - u * 19) / 1.42));
  let wheelSize, card;
  if (land) {
    // wheel on the left, title + card + buttons on the right
    wheelSize = Math.min(H - pad * 2, W * 0.56);
    const wx = Math.max(pad, (W * 0.58 - wheelSize) / 2), wy = (H - wheelSize) / 2;
    place(B, wx, wy, wheelSize, wheelSize);
    const cx = wx + wheelSize + pad, cw = W - cx - pad;
    const titleSize = Math.min(cw * 0.115, H * 0.095);
    place(T, cx, H * 0.05, cw, null); T.style.fontSize = titleSize + 'px';
    const titleH = T.offsetHeight;
    const top = H * 0.05 + titleH + pad * 0.5, h = H - top - pad;
    card = Math.min(cardFor(cw * 0.66, h, false), u * 52);
    place(S, cx, top, cw, h); S.className = 'col';
  } else {
    // title, wheel, then card + buttons
    const titleSize = Math.min(W * 0.11, H * 0.06);
    place(T, pad, H * 0.03, W - pad * 2, null); T.style.fontSize = titleSize + 'px';
    const titleH = T.offsetHeight + H * 0.03;
    const rest = H - titleH - pad;
    wheelSize = Math.min(W - pad * 2, rest * 0.6);
    place(B, (W - wheelSize) / 2, titleH + pad * 0.3, wheelSize, wheelSize);
    const top = titleH + pad * 0.3 + wheelSize, h = H - top - pad;
    // tall screens: card above the buttons; short ones: side by side
    const col = cardFor(W * 0.55, h, false), row = cardFor(W * 0.42, h, true);
    const useRow = row > col * 1.15;
    card = useRow ? row : col;
    place(S, pad, top, W - pad * 2, h); S.className = useRow ? 'row' : 'col';
  }
  root.setProperty('--card', card + 'px');
  root.setProperty('--wheel', wheelSize + 'px');
  const r = B.getBoundingClientRect();
  root.setProperty('--wx', r.left + r.width / 2 + 'px');
  root.setProperty('--wy', r.top + r.height / 2 + 'px');
  wheel.resize(wheelSize);
  fx.resize();
}
function place(el, x, y, w, h) {
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px';
  if (h != null) el.style.height = h + 'px';
}
addEventListener('resize', layout);
layout();
document.fonts?.ready.then(() => { layout(); wheel.dirty = true; });

// ---- wheel items from the event's templates ----
const covers = new Map(); // template id -> Image | null (missing) | 'loading'
let templates = [], templatesKey = '';
function cover(id) {
  if (covers.has(id)) { const c = covers.get(id); return c instanceof Image ? c : null; }
  covers.set(id, 'loading');
  const im = new Image();
  im.onload = () => { covers.set(id, im); wheel.dirty = true; if (shownId === id) showCard(id, false); };
  im.onerror = () => covers.set(id, null);
  im.src = '/cover/' + encodeURIComponent(id);
  return null;
}

// Many templates: a fresh random set for each guest. Few: repeated so the wheel stays full.
function buildWheel() {
  let list = templates.slice();
  const max = Math.max(4, cfg.maxSegments || 16);
  if (list.length > max) list = shuffle(list).slice(0, max);
  else list = shuffle(list);
  const items = [];
  if (list.length) while (items.length < 8 || items.length % list.length) items.push(...list);
  wheel.setItems(items.slice(0, Math.max(items.length, 0)).map(t => ({ id: t.id, name: t.name, img: cover(t.id) })));
  refreshImages();
}
function refreshImages() {
  wheel.items.forEach(it => { it.img = cover(it.id); });
  wheel.dirty = true;
}
setInterval(() => { if (wheel.items.some(it => !it.img && covers.get(it.id) instanceof Image)) refreshImages(); }, 500);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function rand() { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 2 ** 32; }

// ---- the card ----
let shownId = null;
function showCard(id, bump = true) {
  const it = wheel.items.find(x => x.id === id);
  shownId = id;
  const img = covers.get(id);
  $('cardImg').style.backgroundImage = img instanceof Image ? `url("${img.src}")` : 'none';
  $('cardImg').style.backgroundColor = img instanceof Image ? '#8e8e8e' : (it?.color || '#8e8e8e');
  $('cardLetter').textContent = img instanceof Image ? '' : (it?.name || '?').trim().charAt(0).toUpperCase();
  $('cardName').textContent = it?.name || '';
  if (bump) { const c = $('card'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}

// ---- state machine ----
let mode = 'idle';        // idle | spin | won | handing | away
let angle = 0, respinsLeft = cfg.respins ?? 1, winner = null;
let spinAnim = null, goTimer = null;
function setMode(m) {
  mode = m;
  document.body.className = m === 'spin' ? 'spinning' : m;
  $('spinBtn').hidden = !(m === 'idle' || m === 'spin');
  $('spinBtn').disabled = m !== 'idle';
  $('spinBtn').textContent = m === 'spin' ? L.spinning : L.spin;
  $('hub').disabled = m !== 'idle';
  $('goBtn').hidden = m !== 'won';
  $('againBtn').hidden = !(m === 'won' && respinsLeft > 0);
  $('againBtn').textContent = `${L.again} (${respinsLeft})`;
  $('card').classList.toggle('won', m === 'won' || m === 'handing');
}

function spin() {
  if (mode !== 'idle' || wheel.items.length < 2) return;
  sound.resume();
  sound.pop();
  setTimeout(() => sound.whoosh(), 120);
  sound.duck(true);
  setMode('spin');
  const n = wheel.items.length;
  const k = Math.floor(rand() * n);
  winner = wheel.items[k];
  const from = angle;
  const turns = 5 + Math.floor(rand() * 3);
  const to = wheel.targetFor(k, from, turns, (rand() - 0.5) * 0.7);
  const dur = 5600 + rand() * 1600;
  // a little wind-up backwards, then a long slow-down (ease-out quint)
  spinAnim = { t0: performance.now(), from, to, dur, windup: 320 };
}

function onSpinEnd() {
  spinAnim = null;
  sound.duck(false);
  sound.fanfare();
  showCard(winner.id);
  setMode('won');
  const r = $('card').getBoundingClientRect(), wr = $('wheelBox').getBoundingClientRect();
  fx.burst(wr.left + wr.width / 2, wr.top + wr.height * 0.12, 140, 1);
  setTimeout(() => fx.burst(r.left + r.width / 2, r.top + r.height / 2, 120, 0.8), 250);
  setTimeout(() => fx.rain(140), 400);
  startGoCountdown();
}

function startGoCountdown() {
  clearInterval(goTimer);
  let left = Math.max(0, cfg.autoGoSec ?? 8);
  $('goCount').textContent = left ? String(left) : '';
  if (!left) return;
  goTimer = setInterval(() => {
    left--;
    $('goCount').textContent = left > 0 ? String(left) : '';
    if (left > 0 && left <= 3) sound.count(false);
    if (left <= 0) { clearInterval(goTimer); go(); }
  }, 1000);
}

async function go() {
  if (mode !== 'won' || !winner) return;
  clearInterval(goTimer);
  sound.go();
  setMode('handing');
  message('🎉', L.ready, L.readyText);
  let r;
  try { r = await (await fetch('/spin/go', { method: 'POST', body: JSON.stringify({ id: winner.id }) })).json(); }
  catch { r = { ok: false, error: { code: 'offline' } }; }
  if (r.ok) return; // Q-Booth takes over; /state brings us to "away"
  message(null);
  sound.error();
  toast(L.err[r.error?.code] || r.error?.message || r.error?.code || '?');
  setMode('won');
  $('goCount').textContent = '';
  if (r.error?.code === 'unknown_template') { respinsLeft++; again(); }
}

function again() {
  if (mode !== 'won' || respinsLeft <= 0) return;
  respinsLeft--;
  clearInterval(goTimer);
  setMode('idle');
  spin();
}

function resetRound() {
  clearInterval(goTimer);
  spinAnim = null;
  winner = null;
  respinsLeft = cfg.respins ?? 1;
  message(null);
  buildWheel();
  setMode('idle');
  sound.duck(false);
}

// ---- input ----
$('spinBtn').onclick = spin;
$('hub').onclick = spin;
$('wheel').onclick = spin;
$('goBtn').onclick = () => { sound.pop(); go(); };
$('againBtn').onclick = () => { sound.pop(); again(); };
addEventListener('pointerdown', () => { sound.resume(); if (shown) sound.startBgm(); }, { capture: true });
addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { if (mode === 'idle') spin(); else if (mode === 'won') go(); } });

// ---- messages ----
// {booth} in a text = the booth app's brand (from its Local API / the Brand name setting), or a neutral word
const NEUTRAL = { en: 'the booth app', id: 'aplikasi booth', zh: '拍照亭应用' };
let brand = null;
function fill(s) {
  if (!s || !s.includes('{booth}')) return s;
  const name = brand || NEUTRAL[cfg.language] || NEUTRAL.en;
  return s.replace(/\{booth\}/g, (m, i) => i === 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name);
}

function message(icon, title, text, withSettings = false) {
  title = fill(title); text = fill(text);
  $('msgBtn').hidden = !withSettings;
  if (!icon) { $('msg').hidden = true; return; }
  $('msgIcon').textContent = icon; $('msgTitle').textContent = title || ''; $('msgText').textContent = text || '';
  $('msg').hidden = false;
}
let toastTimer = null;
function toast(text) {
  text = fill(text);
  $('toast').textContent = text; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

// ---- Q-Booth state ----
const WHEEL_PAGES = ['welcome', 'categoryPicker', 'templatePicker'];
let shown = true;
async function pollState() {
  let s;
  try { s = await (await fetch('/state')).json(); } catch { setTimeout(pollState, 1000); return; }
  if (s.brand) brand = s.brand;
  const key = s.templates.map(t => t.id + ':' + t.name).join('|');
  if (key !== templatesKey) {
    templatesKey = key; templates = s.templates;
    if (mode === 'idle' || mode === 'away') { buildWheel(); if (wheel.items[0]) showCard(wheel.items[wheel.indexAt(angle)].id, false); }
  }
  if (!s.online) message('🔌', L.waiting, s.error === 'unauthorized' ? L.unauthorized : L.offline, true);
  else if (!s.event) message('🎡', L.waiting, L.noEvent, true);
  else if (!templates.length) message('🖼️', L.waiting, L.noTemplates);
  else if (!WHEEL_PAGES.includes(s.page)) {
    // Q-Booth runs the session (only seen in window mode; the overlay is hidden then)
    if (mode !== 'away') { setMode('away'); clearInterval(goTimer); }
    message('📸', L.enjoy, L.enjoyText);
  } else {
    if (mode === 'away' || (mode === 'handing' && !s.handing)) resetRound();
    else if (mode !== 'handing') message(null);
  }
  setTimeout(pollState, 500);
}

// The desktop app shows / hides the overlay window with Q-Booth's pages.
window.__qbr = {
  shown(v) {
    shown = v;
    if (v) { sound.resume(); sound.startBgm(); if (mode === 'away' || mode === 'handing') resetRound(); }
    else sound.stopBgm();
  },
  settings: () => settings.open(),
};

// ---- operator settings: hold the top-left corner 3 s, or S / Ctrl+Alt+Shift+S ----
const settings = initSettings({ lang: cfg.language, locked: cfg.settingsLocked, desktop: cfg.desktop });
$('msgBtn').textContent = L.settingsBtn;
$('msgBtn').onclick = () => settings.open();
fetch('/app/peek', { method: 'POST', body: JSON.stringify({ on: false }) }).catch(() => { }); // a fresh page: no settings open
let hold = null;
$('corner').addEventListener('pointerdown', () => { hold = setTimeout(() => settings.open(), 3000); });
addEventListener('pointerup', () => clearTimeout(hold));
addEventListener('keydown', e => { if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !settings.isOpen()) settings.open(); });

// ---- the frame loop ----
let last = performance.now(), lastIdx = -1;
const easeOutQuint = p => 1 - Math.pow(1 - p, 5);
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  let speed = 0;
  if (spinAnim) {
    const a = spinAnim, t = now - a.t0;
    const prev = angle;
    if (t < a.windup) angle = a.from - 0.12 * Math.sin((t / a.windup) * Math.PI / 2);
    else {
      const p = Math.min(1, (t - a.windup) / a.dur);
      const start = a.from - 0.12;
      angle = start + (a.to - start) * easeOutQuint(p);
      if (p >= 1) { angle = a.to; onSpinEnd(); }
    }
    speed = Math.abs(angle - prev) / Math.max(dt, 0.001);
  } else if (mode === 'idle' || mode === 'away') {
    angle += 0.18 * dt; // slow attract turn
  }
  const idx = wheel.indexAt(angle);
  if (idx !== lastIdx && wheel.items[idx]) {
    lastIdx = idx;
    if (mode === 'spin') {
      sound.tick(Math.min(1, speed / 6));
      const p = $('pointer'); p.classList.remove('tick'); void p.getBoundingClientRect(); p.classList.add('tick');
    }
    if (mode === 'idle' || mode === 'spin' || mode === 'away') showCard(wheel.items[idx].id, mode === 'spin');
  }
  wheel.draw(angle, now / 1000, mode === 'won' || mode === 'handing' ? 'won' : mode === 'spin' ? 'spin' : 'idle');
  fx.step(dt, now / 1000);
  window.__frames = (window.__frames || 0) + 1;
  requestAnimationFrame(frame);
}

setMode('idle');
pollState();
sound.startBgm();
requestAnimationFrame(frame);
