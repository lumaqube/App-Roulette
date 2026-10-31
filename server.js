// QBooth Roulette: the page server. Polls Q-Booth's Local API (the password stays here),
// serves the wheel page, the template covers (read from Q-Booth's event folder) and the
// settings, and hands the winning template to Q-Booth (template/select).
//   node server.js          -> the real Q-Booth (config.json)
//   node server.js --mock   -> a built-in fake booth (port 8749)
// The desktop app (electron/main.js) imports this and shows the page in its window.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, loadOwnConfig, configWritePath } from './config.js';
import { listenRetry } from './listen.js';
import { startMock } from './mock-qbooth.js';
import { coverOf, savedTemplates } from './covers.js';
import { locateBooth, resolveBoothDir, brandName } from './locate.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
// Q-Booth pages where the wheel stands in front of Q-Booth (the guest has not picked yet).
const WHEEL_PAGES = ['welcome', 'categoryPicker', 'templatePicker'];

let cfg = loadConfig();
let MOCK = false;
const listening = [];

// ---- the desktop app's hooks ----
let app = { desktop: false, displays: [], visible: null, quit: null, restart: null };
export function setAppHooks(h) { app = { ...app, ...h }; }

// ---- Q-Booth ----
let booth = { host: '127.0.0.1', port: 8730, password: '' };
async function qb(method, cmd, body, conn = booth) {
  try {
    const r = await fetch(`http://${conn.host}:${conn.port}/api/v1/${cmd}`, {
      method, headers: { Authorization: 'Bearer ' + conn.password, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(4000),
    });
    const j = await r.json().catch(() => ({ ok: false, error: { code: 'bad_reply' } }));
    return j.ok ? j : { ok: false, error: j.error || { code: 'http_' + r.status } };
  } catch (err) {
    return { ok: false, error: { code: 'offline', message: err.cause?.code || err.message } };
  }
}

// What the page and the window need to know, refreshed every pollMs.
const state = { online: false, error: null, status: null, eventId: null, eventName: '', templates: [], handing: null, hidden: false, peek: false, mode: null };
let templatesAt = 0;

// The booth app: brand builds QBooth.exe / BleepShare.exe / XBooth.exe. Its name comes from the
// Local API (status.app.name), its pid and folder from the process on the Local API port.
let located = null, locating = false, locatedAt = 0, lastBrand = null;
async function relocate() {
  if (locating || MOCK) return;
  locating = true;
  try { located = await locateBooth(booth.host, booth.port); locatedAt = Date.now(); if (located) console.log(`booth app: ${located.exe} (pid ${located.pid})`); }
  finally { locating = false; }
}
const boothDir = () => resolveBoothDir(cfg.qboothDir, located);
const brand = () => cfg.brandName || lastBrand || null;
export const boothPid = () => located?.pid || null;

async function poll() {
  const r = await qb('GET', 'status');
  if (!r.ok) {
    Object.assign(state, { online: false, error: r.error.code, status: null });
  } else {
    const s = r.data;
    const eventId = s.event?.id || null;
    if (eventId !== state.eventId || (eventId && Date.now() - templatesAt > 15000) || (eventId && !state.templates.length && Date.now() - templatesAt > 3000)) {
      templatesAt = Date.now();
      const t = eventId ? await qb('GET', 'templates') : null;
      state.templates = t?.ok ? t.data.map(x => ({ id: x.id, name: x.name })) : eventId === state.eventId ? state.templates : [];
    }
    const b = brandName(s.app?.name);
    if (b) lastBrand = b;
    if (!MOCK && (!located || Date.now() - locatedAt > 60000) && Date.now() - locatedAt > 10000) relocate();
    Object.assign(state, { online: true, error: null, status: s, eventId, eventName: s.event?.name || '' });
    // the hand-over is over once Q-Booth left the wheel's pages (or after 20 s)
    if (state.handing && (!WHEEL_PAGES.includes(s.page) || Date.now() - state.handing.at > 20000)) state.handing = null;
  }
  updateVisible();
}

// The window's mode:
//   full   - the wheel, full screen (on top of Q-Booth in overlay mode)
//   setup  - not connected to Q-Booth yet (off, Local API off, wrong password): a normal window
//            saying what is wrong, with Settings; never on top, so Q-Booth stays reachable
//   hidden - Q-Booth runs a session, shows a dialog of its own (a Start PIN or payment gate after
//            the hand-over must be seen and touched), or no event runs (the operator's Q-Booth)
// Open settings (peek) take the whole screen, as in QBooth Avatar, whatever the mode would be.
function computeMode() {
  const s = state.status;
  if (state.peek) return 'full';
  if (state.hidden) return 'hidden';
  if (!cfg.overlay) return 'full';
  if (!state.online) return 'setup';
  if (s?.event && WHEEL_PAGES.includes(s.page) && !s.busy?.dialog) return 'full';
  return 'hidden';
}
function updateVisible() {
  const m = computeMode();
  if (m !== state.mode) { state.mode = m; app.visible?.(m, statusText()); }
}
// A line for the tray icon.
function statusText() {
  if (!state.online) return state.error === 'unauthorized' ? 'Wrong Local API password' : `Waiting for ${brand() || 'the booth app'} (Local API)`;
  if (!state.status?.event) return 'Connected · waiting for an event';
  return `Event: ${state.status.event.name} · ${state.status.page}`;
}

// The winner: Welcome takes template/select straight away (pickers skipped, gates kept).
// On a picker the card may not be on screen: back to Welcome first, then select.
async function handOver(id) {
  if (!state.templates.some(t => t.id === id)) return { ok: false, error: { code: 'unknown_template' } };
  let s = (await qb('GET', 'status')).data;
  if (!s?.event) return { ok: false, error: { code: 'no_event' } };
  if (s.page !== 'welcome' && s.session?.active) {
    const end = await qb('POST', 'session/end');
    if (!end.ok) return end;
    for (let i = 0; i < 25 && s?.page !== 'welcome'; i++) { await new Promise(r => setTimeout(r, 200)); s = (await qb('GET', 'status')).data; }
  }
  const r = await qb('POST', 'template/select', { id });
  if (r.ok) state.handing = { id, at: Date.now() };
  console.log(`hand-over ${id}: ${r.ok ? 'accepted' : r.error.code}`);
  return r;
}

// ---- settings ----
const FIELDS = {
  language: 'enum:id,en,zh', title: 'string', 'qbooth.host': 'string', 'qbooth.port': 'int', 'qbooth.password': 'secret',
  qboothDir: 'string', brandName: 'string', mockBrand: 'string*', overlay: 'bool*', display: 'int*', autoGoSec: 'int', respins: 'int', maxSegments: 'int',
  bgmVolume: 'int', sfxVolume: 'int', settingsPin: 'secret', mock: 'bool*', mockEvent: 'string*',
  menuButton: 'bool', menuCorner: 'enum:top-right,top-left,bottom-right,bottom-left',
};
const get = (o, k) => k.split('.').reduce((a, p) => a?.[p], o);
const set = (o, k, v) => { const ps = k.split('.'); const last = ps.pop(); let a = o; for (const p of ps) a = a[p] ??= {}; a[last] = v; };
const pinOk = pin => !cfg.settingsPin || String(pin || '') === String(cfg.settingsPin);

function readSettings() {
  const values = {};
  for (const [k, type] of Object.entries(FIELDS)) if (!type.startsWith('secret')) values[k] = get(cfg, k);
  return { values, has: { password: !!cfg.qbooth?.password, settingsPin: !!cfg.settingsPin }, file: configWritePath(), displays: app.displays, desktop: app.desktop, brand: brand(), boothDir: boothDir() };
}

function saveSettings(changes) {
  const own = loadOwnConfig();
  let restart = false;
  for (const [k, raw] of Object.entries(changes)) {
    const type = FIELDS[k];
    if (!type) continue;
    let v = raw;
    if (type.startsWith('int')) v = Math.max(0, Math.round(+raw || 0));
    else if (type.startsWith('bool')) v = raw === true || raw === 'true';
    else if (type.startsWith('enum')) { if (!type.slice(5).replace('*', '').split(',').includes(raw)) continue; }
    else if (type === 'secret') { if (raw === '' || raw === undefined) continue; v = raw === null ? '' : String(raw); } // empty = keep, null = remove
    else v = raw == null ? '' : String(raw);
    set(own, k, v);
    if (type.endsWith('*') && String(get(cfg, k)) !== String(v)) restart = true;
  }
  fs.writeFileSync(configWritePath(), JSON.stringify(own, null, 2));
  cfg = loadConfig();
  if (!MOCK) booth = { ...cfg.qbooth };
  templatesAt = 0;
  return { restart: restart && !!app.restart };
}

// ---- HTTP ----
const sendJson = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise(resolve => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch { resolve({}); } }); });

function publicConfig() {
  const { language, title, autoGoSec, respins, maxSegments, bgmVolume, sfxVolume, overlay } = cfg;
  return { language, title, autoGoSec, respins, maxSegments, bgmVolume, sfxVolume, overlay, mock: MOCK, desktop: app.desktop, settingsLocked: !!cfg.settingsPin };
}

async function route(req, res) {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  if (p === '/config.json') return sendJson(res, 200, publicConfig());
  if (p === '/state') {
    const s = state.status;
    return sendJson(res, 200, {
      online: state.online, error: state.error, mode: state.mode, overlay: !!cfg.overlay, brand: brand(), handing: state.handing?.id || null,
      event: s?.event || null, page: s?.page || 'none', busy: s?.busy || null, templates: state.templates,
    });
  }
  if (p.startsWith('/cover/')) {
    const c = state.eventId && coverOf(boothDir(), state.eventId, decodeURIComponent(p.slice(7)));
    if (!c) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': c.type, 'Cache-Control': 'max-age=300' });
    return res.end(c.data);
  }
  if (req.method === 'POST' && p === '/spin/go') {
    const { id } = await readBody(req);
    return sendJson(res, 200, await handOver(id));
  }
  // the settings screen is open: the window must show (no PIN here: the PIN prompt itself needs it)
  if (req.method === 'POST' && p === '/app/peek') {
    const { on } = await readBody(req);
    state.peek = !!on;
    updateVisible();
    return sendJson(res, 200, { ok: true, mode: state.mode });
  }
  if (req.method === 'POST' && p === '/settings/unlock') {
    const { pin } = await readBody(req);
    return sendJson(res, pinOk(pin) ? 200 : 403, { ok: pinOk(pin) });
  }
  // the always-on-top menu button (electron/fab.js) was tapped: open the settings (they ask the PIN)
  if (req.method === 'POST' && p === '/app/menu') { app.menu?.(); return sendJson(res, 200, { ok: !!app.menu }); }
  if (p === '/settings' || p.startsWith('/settings/') || p.startsWith('/app/')) {
    if (!pinOk(req.headers['x-settings-pin'])) return sendJson(res, 403, { ok: false, error: { code: 'pin' } });
    if (req.method === 'GET' && p === '/settings') return sendJson(res, 200, readSettings());
    if (req.method === 'POST' && p === '/settings') {
      try { const r = saveSettings(await readBody(req)); app.configChanged?.(cfg); if (r.restart) setTimeout(() => app.restart(), 400); return sendJson(res, 200, { ok: true, ...r }); }
      catch (err) { return sendJson(res, 500, { ok: false, error: { code: 'save', message: err.message } }); }
    }
    if (req.method === 'POST' && p === '/settings/test') {
      const b = await readBody(req);
      const conn = { host: b.host || cfg.qbooth.host, port: +b.port || cfg.qbooth.port, password: b.password || cfg.qbooth.password };
      const r = await qb('GET', 'status', null, conn);
      return sendJson(res, 200, r.ok ? { ok: true, event: r.data.event, app: r.data.app } : r);
    }
    if (req.method === 'POST' && p === '/app/quit') { sendJson(res, 200, { ok: !!app.quit }); if (app.quit) setTimeout(app.quit, 200); return; }
    if (req.method === 'POST' && p === '/app/hide') { state.hidden = !state.hidden; updateVisible(); return sendJson(res, 200, { ok: true, hidden: state.hidden }); }
    return sendJson(res, 404, { ok: false });
  }
  // static files
  const file = path.join(PUBLIC, p === '/' ? 'index.html' : decodeURIComponent(p));
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

// Operator keys from the desktop app (global shortcuts).
export const toggleHidden = () => { state.hidden = !state.hidden; updateVisible(); };
export const currentStatus = () => statusText();

export async function startServer({ mock } = {}) {
  cfg = loadConfig();
  MOCK = mock ?? !!cfg.mock;
  booth = { ...cfg.qbooth };
  if (MOCK) {
    const real = cfg.mockEvent && savedTemplates(resolveBoothDir(cfg.qboothDir, null), cfg.mockEvent);
    booth = { host: '127.0.0.1', port: 8749, password: 'mock' };
    listening.push(await startMock(booth.port, booth.password, { appName: (cfg.mockBrand || 'QBooth') + ' (mock)', ...(real?.length ? { eventId: cfg.mockEvent, eventName: cfg.mockEvent, templates: real } : {}) }));
  }
  const server = http.createServer((req, res) => route(req, res).catch(err => { console.error(err); try { sendJson(res, 500, { ok: false }); } catch { } }));
  try { await listenRetry(server, cfg.port); }
  catch (err) { throw new Error(err.code === 'EADDRINUSE' ? `Port ${cfg.port} is in use: Roulette is probably already running.` : err.message); }
  listening.push(server);
  console.log(`Roulette: http://127.0.0.1:${cfg.port}/  (${MOCK ? 'MOCK booth' : `booth app ${booth.host}:${booth.port}`})`);
  const loop = async () => { await poll().catch(err => console.error('poll: ' + err.message)); setTimeout(loop, Math.max(200, cfg.pollMs || 400)); };
  loop();
  return { port: cfg.port, cfg };
}

export function stopAll() {
  for (const s of listening.splice(0)) { s.close(); s.closeAllConnections?.(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer({ mock: process.argv.includes('--mock') || undefined }).catch(err => { console.error(err.message); process.exit(1); });
}
