// QBooth Roulette: one exe that runs the page server and shows the wheel.
//   QBooth Roulette.exe          -> the real Q-Booth (config.json)
//   QBooth Roulette.exe --mock   -> the built-in fake booth (or "mock": true in config.json)
// Overlay mode ("overlay": true, default): the wheel covers Q-Booth's event screen only while
// Q-Booth waits for a pick (Welcome / pickers, no dialog); it hides during the session and
// comes back on Welcome. Not connected yet: a normal window saying why, with Settings.
// Window mode ("overlay": false): an ordinary full-screen window, e.g. on a second screen.
// A tray icon (by the clock) has Settings / Show-Hide / Quit; opening the exe again opens Settings.
// An optional always-on-top menu button (Settings -> Layar, electron/fab.js) opens them too.
// Secret keys, from anywhere (Q-Booth usually has the focus):
//   Ctrl+Alt+Shift+S settings · Ctrl+Alt+Shift+H hide / show · Ctrl+Alt+Shift+Q quit
// With the window focused: F12 developer tools, Ctrl+Q quit.
import { app, BrowserWindow, screen, dialog, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, stopAll, setAppHooks, toggleHidden, currentStatus, boothPid } from '../server.js';
import { startFront, raiseBooth, raiseSelf, stopFront } from './winfront.js';
import { createFab } from './fab.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// No console in the packaged app: keep the server's messages in logs/app.log.
fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });
const logPath = path.join(ROOT, 'logs', 'app.log');
for (const level of ['log', 'warn', 'error']) {
  const orig = console[level].bind(console);
  console[level] = (...args) => {
    try { fs.appendFileSync(logPath, `${new Date().toISOString().slice(11, 23)} [${process.pid}] ${args.join(' ')}\n`); } catch { }
    orig(...args);
  };
}
console.log('--- start');

// One copy at a time. A copy started by our own restart waits for the old one to let go.
async function getLock() {
  const tries = process.argv.includes('--relaunch') ? 80 : 1;
  for (let i = 0; i < tries; i++) {
    if (app.requestSingleInstanceLock()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

function restart() {
  const args = process.argv.slice(1).filter(a => a !== '--mock' && a !== '--relaunch').concat('--relaunch');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  spawn(process.execPath, args, { detached: true, stdio: 'ignore', env }).unref();
  app.quit();
}

if (!(await getLock())) {
  app.quit(); // already running: that copy opens its settings (second-instance below)
} else {
  // Music and sounds without a tap first (a kiosk has nobody to tap "activate").
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  let win = null, tray = null, fab = null;

  app.whenReady().then(async () => {
    const primary = screen.getPrimaryDisplay();
    let mode = 'setup', ready = false, box = primary.bounds, overlay = true;
    const page = js => win && !win.isDestroyed() && win.webContents.executeJavaScript(js).catch(() => { });
    const openSettings = () => page('window.__qbr?.settings()');

    // full: the whole screen (on top of Q-Booth in overlay mode); setup: a normal window in the
    // middle (never on top); hidden: away.
    // Hiding hands the screen back to Q-Booth: its event window is raised first, or whatever
    // window was in front before (the operator switched away once) would show instead.
    const applyMode = () => {
      if (!win || win.isDestroyed() || !ready) return;
      if (mode === 'hidden') {
        if (win.isVisible()) { if (overlay) raiseBooth(boothPid()); setTimeout(() => { if (mode === 'hidden' && win && !win.isDestroyed()) win.hide(); }, 150); }
      } else if (mode === 'full') {
        win.setAlwaysOnTop(overlay, 'screen-saver');
        win.setBounds(box);
        if (!win.isVisible()) win.show();
        win.focus();
        if (overlay) raiseSelf(win); // the foreground too, so the first tap is the guest's
        fab?.raise();
      } else {
        win.setAlwaysOnTop(false);
        const w = Math.min(1100, Math.round(box.width * 0.7)), h = Math.min(720, Math.round(box.height * 0.75));
        win.setBounds({ x: box.x + Math.round((box.width - w) / 2), y: box.y + Math.round((box.height - h) / 2), width: w, height: h });
        if (!win.isVisible()) win.show();
      }
      page(`window.__qbr?.shown(${mode !== 'hidden'})`);
    };
    setAppHooks({
      restart,
      quit: () => app.quit(),
      desktop: true,
      displays: screen.getAllDisplays().map((d, i) => ({ index: i, label: `${i + 1}: ${d.size.width}×${d.size.height}${d.id === primary.id ? ' (main)' : ''}` })),
      visible: (m, text) => {
        mode = m;
        console.log(`window: ${m} (${text})`);
        applyMode();
        tray?.setToolTip(`Roulette · ${text}`);
      },
      menu: () => openSettings(),
      configChanged: c => fab?.update({ on: !!c.menuButton, corner: c.menuCorner }),
    });
    let port, cfg;
    try {
      ({ port, cfg } = await startServer({ mock: process.argv.includes('--mock') || undefined }));
    } catch (err) {
      dialog.showErrorBox('Roulette', err.message);
      app.quit();
      return;
    }
    overlay = !!cfg.overlay;
    box = (screen.getAllDisplays()[cfg.display ?? 0] || primary).bounds;

    win = new BrowserWindow({
      ...box,
      show: false,
      frame: false, resizable: false, skipTaskbar: false, hasShadow: true,
      backgroundColor: '#2a0f4a',
      title: 'Roulette',
      icon: path.join(ROOT, 'public', 'icon.png'),
      webPreferences: { backgroundThrottling: false },
    });
    win.setMenu(null);
    if (overlay) {
      // Q-Booth raises its kiosk window to the top when an event opens: take the top back.
      setInterval(() => {
        if (!win || win.isDestroyed() || !win.isVisible() || mode !== 'full') return;
        const b = win.getBounds();
        if (b.x !== box.x || b.y !== box.y || b.width !== box.width || b.height !== box.height) win.setBounds(box);
        win.setAlwaysOnTop(true, 'screen-saver');
        win.moveTop();
        fab?.raise();
      }, 1500);
    }
    console.log(`screen: ${box.width}x${box.height} at ${box.x},${box.y}, ${overlay ? 'overlay' : 'window'} mode`);
    if (overlay) startFront(); // compiled once now, so the first hand-over is quick
    fab = createFab({ url: `http://127.0.0.1:${port}/fab.html` });
    fab.update({ on: !!cfg.menuButton, corner: cfg.menuCorner, box });

    // the tray icon: the app is running even while the wheel is hidden
    tray = new Tray(nativeImage.createFromPath(path.join(ROOT, 'public', 'icon.png')).resize({ width: 16, height: 16 }));
    tray.setToolTip('Roulette · ' + currentStatus());
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Settings', click: openSettings },
      { label: 'Hide / show the wheel', click: () => toggleHidden() },
      { type: 'separator' },
      { label: 'Quit Roulette', click: () => app.quit() },
    ]));
    tray.on('click', openSettings);

    globalShortcut.register('Control+Alt+Shift+S', openSettings);
    globalShortcut.register('Control+Alt+Shift+H', () => toggleHidden());
    globalShortcut.register('Control+Alt+Shift+Q', () => app.quit());
    app.on('second-instance', openSettings);
    win.webContents.on('before-input-event', (e, input) => {
      if (input.type !== 'keyDown') return;
      if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
      else if (input.control && input.key.toLowerCase() === 'q') { app.quit(); e.preventDefault(); }
    });
    win.on('closed', () => { win = null; app.quit(); });
    win.once('ready-to-show', () => {
      ready = true;
      applyMode();
      if (overlay) tray.displayBalloon?.({ title: 'Roulette is running', content: 'The wheel appears on top of the booth app when an event shows its Welcome screen. Settings: this icon, or Ctrl+Alt+Shift+S.' });
    });
    const wc = win.webContents;
    wc.on('render-process-gone', (e, d) => { console.error(`page process gone: ${d.reason}, reloading`); setTimeout(() => win?.reload(), 1000); });
    wc.on('did-fail-load', () => setTimeout(() => win?.loadURL(`http://127.0.0.1:${port}/`), 1500));
    wc.on('console-message', e => { if (e.level === 'error' || e.level === 'warning') console.error(`page ${e.level}: ${e.message} (${e.sourceId}:${e.lineNumber})`); });
    win.loadURL(`http://127.0.0.1:${port}/`);
  });

  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    tray?.destroy();
    stopFront();
    fab?.destroy();
    stopAll();
    app.releaseSingleInstanceLock();
    const helpers = app.getAppMetrics().map(m => m.pid).filter(pid => pid !== process.pid);
    for (const pid of helpers) try { process.kill(pid); } catch { }
    process.kill(process.pid);
  });
}
