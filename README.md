# Roulette

A playful theme roulette for Q-Booth events. Guests spin a wheel made of the running event's
templates (with their covers); the winner is selected in Q-Booth through its **Local API** and the
photo session starts with it.

- Wheel segments = the running event's guest-pickable templates (`GET templates`). Up to
  `maxSegments` (16) per wheel: with more templates, each guest gets a fresh random set; with few,
  they repeat so the wheel stays full. The pick is random (`crypto.getRandomValues`).
- The card beside the wheel shows the template under the pointer, live while it spins.
- Win: fanfare, confetti, the "Your theme!" card, **Let's go!** (auto after `autoGoSec`, 8 s) and
  **Spin again** (`respins`, 1). Then `template/select {id}`: from Welcome Q-Booth skips its pickers
  but keeps its gates (Start PIN, payment). From a picker the app sends `session/end` first.
- Layout fits any screen: landscape (wheel left, title + card + buttons right), portrait (title,
  wheel, card + buttons), short screens put the card beside the buttons. Sizes come from the
  window's width and height (`layout()` in public/app.js).
- Sound is made by code (Web Audio, public/audio.js): an 8-bar BGM loop (kick, clap, hats, bass,
  arpeggio, pad, bell melody in C major, 118 BPM) and SFX (tick per segment, whoosh, fanfare, pop,
  count-down, go, error). The music ducks under the spin. No audio files.
- Font: Fredoka (SIL Open Font License, public/fonts/OFL.txt).
- Texts in English, Bahasa Indonesia and 中文 (`language`).

## Brands

The booth app comes in three brand builds: **QBooth.exe** (reports "QBooth"), **BleepShare.exe**
("BleepShareAI"), **XBooth.exe** ("XBooth"), each in its own install folder. Roulette shows no
brand of its own (app, window and exe are just "Roulette"):

- every text that names the booth app says the connected one's name (`status.app.name` of the
  Local API; "QBooth" shown as "Q-Booth"), or the **Brand name** setting, or before any contact a
  neutral word ("the booth app" / "aplikasi booth" / "拍照亭应用");
- the booth app is found by the process listening on the Local API port (`locate.js`): its pid
  (to raise its event window) and its folder (covers). The usual folders (C:\QBoothPro,
  C:\QBoothAIV5, C:\BleepShareV5, C:\XBoothV5) are only a fallback; **Booth app folder** overrides.

## Covers

The Local API has no images. The covers are read (read only) from Q-Booth's own event folder on
this PC: `<qboothDir>\events\<eventId>\event.json` → `templates[].cover`, or else the template
file's own preview (`event_info.preview_image[0]`). A booth on another PC (Allow LAN): coloured
placeholders with the first letter instead.

## The window

- **Overlay** (`overlay: true`, default): a full-screen window on top of Q-Booth's event screen,
  shown only while Q-Booth waits for a pick (Welcome / category or template picker) with no dialog
  of its own on screen. After the hand-over Q-Booth moves to the camera and the roulette hides; it
  comes back on Welcome. Connected but no event running = hidden (the operator sees Q-Booth).
- **Handing the screen back** (`electron/winfront.js`): when the wheel hides, Q-Booth's event
  window (QBooth.exe's biggest visible window that is not "QBooth - Version …") is brought to the
  front first; when the wheel comes back, its own window is. Q-Booth's kiosk window is only
  topmost when the event blocks Alt-Tab, so without this a window the operator had switched to
  would show instead. One PowerShell process with user32 calls stays open for it.
- **Not connected yet** (Q-Booth off, Local API off, wrong password): a normal window in the middle
  of the screen (not on top) says what is wrong, with a Settings button. First start without a
  `config.json` lands here.
- A **tray icon** (by the clock) shows the status and has Settings / Hide-show / Quit. Opening the
  exe again while it runs opens Settings in the running copy.
- **Window** (`overlay: false`): an ordinary full-screen window, e.g. on a second screen; during the
  session it shows "Enjoy your photo session!".
- Secret keys (from anywhere): **Ctrl+Alt+Shift+S** settings, **Ctrl+Alt+Shift+H** hide / show,
  **Ctrl+Alt+Shift+Q** quit. Also: hold the top-left corner 3 s, or S with the window focused.
  Settings can have a PIN. Settings → **Pintasan / Shortcuts** lists every way in.
- **Menu button always on top** (`menuButton`, Settings → Layar / Screen, off by default;
  `menuCorner`): a small ☰ window of its own (`electron/fab.js`, `public/fab.html`) above
  everything, also while the wheel is hidden; a tap opens the settings (PIN first). Applies live.

## Run

- `npm install`, then `npm run app` (`npm run app:mock` = with a built-in fake Q-Booth).
- `node server.js [--mock]` serves the page alone on http://127.0.0.1:3930 (browser test).
- `npm run build` → `dist\Roulette-win32-x64\Roulette.exe`.
- Q-Booth: Settings → Advanced → Local API (Expert mode): on, note port and password; put them in
  the roulette's settings (Test connection).
- Mock with real covers: `"mock": true, "mockEvent": "<an event id from C:\QBoothPro\events>"`.

## Config (`config.json`, overrides `config.example.json`)

| Key | Default | Meaning |
|---|---|---|
| `port` | 3930 | page server (the mock booth uses 8749) |
| `qbooth.host / port / password` | 127.0.0.1 / 8730 / "" | Q-Booth Local API |
| `qboothDir` | "" | the booth app folder for covers; empty = found automatically |
| `brandName` | "" | the brand shown to guests; empty = the name the booth app reports |
| `language`, `title` | en, "" | texts; own title (empty = "Spin the Wheel!") |
| `overlay`, `display` | true, 0 | overlay on Q-Booth or a normal window; which screen |
| `autoGoSec`, `respins`, `maxSegments` | 8, 1, 16 | auto "Let's go" (0 = wait for a tap); spins again; wheel size |
| `bgmVolume`, `sfxVolume` | 60, 80 | 0-100 |
| `menuButton`, `menuCorner` | false, top-right | the always-on-top ☰ button and its corner |
| `settingsPin` | "" | protects the settings |
| `mock`, `mockEvent`, `mockBrand` | false, "", QBooth | fake booth; an event whose templates it borrows; the product name it reports |

`config.json` holds the Local API password: keep it out of git and screenshots.

## Files

| | |
|---|---|
| `electron/main.js` | Window (overlay / normal), show / hide with Q-Booth's page, shortcuts |
| `server.js` | Polls the Local API, `/state`, `/cover/<id>`, `/spin/go`, settings |
| `covers.js` | Reads covers from the event folder (read only) |
| `mock-qbooth.js` | Fake Local API that plays a whole session by itself |
| `public/app.js` | Layout, states (idle / spin / won / handing / away), input, Q-Booth state |
| `public/wheel.js` | Canvas wheel: segments, covers, labels, rim bulbs, hub |
| `public/audio.js` | All music and sounds (Web Audio) |
| `public/fx.js` | Confetti and sparkles |
| `public/settings.js` | Operator settings (id / en / zh) |
