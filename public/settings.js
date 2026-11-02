// Operator settings, in the same look as QBooth Avatar's: tabs (a side menu on a landscape screen,
// a row on a portrait one). Open: the tray icon, Ctrl+Alt+Shift+S, S (window focused), holding the
// top-left corner 3 s, or "Settings" on the waiting screen. With a settings PIN it is asked first;
// every save carries it (x-settings-pin).
const T = {
  en: {
    title: 'Settings', tabBooth: 'Booth', tabWheel: 'Wheel', tabSound: 'Sound', tabScreen: 'Screen', tabSecurity: 'Security',
    host: 'Address', port: 'Local API port', password: 'Local API password', kept: 'saved (leave empty to keep)',
    test: 'Test connection', testing: 'Testing…', ok: '✓ Connected', noEvent: 'no event running', brandName: 'Brand name', brandHint: 'Empty = the name the booth app reports (Q-Booth, BleepShareAI, XBooth). Shown to guests and in these settings.',
    boothHint: '{booth}: Settings → Advanced → Local API (Expert mode): switch it on, then copy its port and password here. Works with QBooth.exe, BleepShare.exe and XBooth.exe.',
    language: 'Language', titleText: 'Title', titleHint: 'Empty = "Spin the Wheel!" in the chosen language',
    autoGo: 'Auto-continue after (s)', autoGoHint: '0 = wait for the guest to tap "Let\'s go!"', respins: 'Spins again allowed', maxSeg: 'Most segments on the wheel', maxSegHint: 'More templates than this: a random set for each guest',
    bgm: 'Music volume', sfx: 'Effects volume',
    overlay: 'Overlay on top of {booth}', overlayHint: 'Shows only while {booth} waits on Welcome / the pickers. Off = a normal full-screen window (e.g. a second screen). Restarts the app.',
    menuBtn: 'Menu button always on top', menuBtnHint: 'A small ☰ button above everything, also while the wheel is hidden: a tap opens these settings (the PIN first, when set). Guests can see it too.', menuCorner: 'Menu button corner', corners: { 'top-right': 'Top right', 'top-left': 'Top left', 'bottom-right': 'Bottom right', 'bottom-left': 'Bottom left' },
    tabKeys: 'Shortcuts', keysHint: 'Ways to reach the app while it runs on the booth:', keysList: [
      ['Ctrl+Alt+Shift+S', 'Open these settings, from anywhere (also while {booth} has the screen)'], ['Ctrl+Alt+Shift+H', 'Hide / show the wheel (stays hidden until pressed again)'],
      ['Ctrl+Alt+Shift+Q', 'Quit the app'], ['☰', 'The menu button (Screen tab, "Menu button always on top"): settings'],
      ['Tray icon', 'By the clock: a click opens the settings; right-click: Settings / Hide-show / Quit'], ['Hold the top-left corner 3 s', 'Settings, on a touch screen'],
      ['Open the exe again', 'Opens the settings of the copy already running'], ['Settings button', 'On the waiting screen'],
      ['S', 'Settings (the app window focused)'], ['Space / Enter', 'Spin; after a win: "Let\'s go!" (the app window focused)'],
      ['Ctrl+Q', 'Quit (the app window focused)'], ['F12', 'Developer tools (the app window focused)'], ['Enter / Esc', 'In the PIN box: OK / cancel']],
    display: 'Screen', hide: 'Hide / show the wheel', hideHint: 'Also Ctrl+Alt+Shift+H, or the tray icon', mock: 'Test mode (fake booth app)', mockHint: 'Restarts the app',
    pin: 'Settings PIN', pinHint: 'Empty = no PIN', clearPin: 'Remove the PIN',
    save: 'Save', cancel: 'Cancel', quit: 'Close the app', saving: 'Saving…', restarting: 'Saved, restarting…',
    file: 'Saved in', enterPin: 'Enter the settings PIN', wrongPin: 'Wrong PIN', keys: 'Ctrl+Alt+Shift+S settings · Ctrl+Alt+Shift+H hide / show · Ctrl+Alt+Shift+Q quit',
  },
  id: {
    title: 'Pengaturan', tabBooth: 'Booth', tabWheel: 'Roda', tabSound: 'Suara', tabScreen: 'Layar', tabSecurity: 'Keamanan',
    host: 'Alamat', port: 'Port Local API', password: 'Password Local API', kept: 'tersimpan (kosongkan = tetap)',
    test: 'Tes koneksi', testing: 'Mengetes…', ok: '✓ Terhubung', noEvent: 'belum ada event berjalan', brandName: 'Nama brand', brandHint: 'Kosong = nama dari aplikasi booth (Q-Booth, BleepShareAI, XBooth). Tampil ke tamu dan di pengaturan ini.',
    boothHint: 'Di {booth}: Settings → Advanced → Local API (mode Expert): nyalakan, lalu salin port dan password-nya ke sini. Bisa untuk QBooth.exe, BleepShare.exe dan XBooth.exe.',
    language: 'Bahasa', titleText: 'Judul', titleHint: 'Kosong = "Putar Rodanya!" sesuai bahasa',
    autoGo: 'Lanjut otomatis setelah (detik)', autoGoHint: '0 = tunggu tamu menekan "Ayo foto!"', respins: 'Boleh putar lagi', maxSeg: 'Segmen maksimal di roda', maxSegHint: 'Kalau template lebih banyak: diambil acak untuk tiap tamu',
    bgm: 'Volume musik', sfx: 'Volume efek',
    overlay: 'Tampil di atas {booth}', overlayHint: 'Hanya muncul saat {booth} di Welcome / pilihan template. Mati = jendela layar penuh biasa (mis. layar kedua). App dimulai ulang.',
    menuBtn: 'Tombol menu selalu di atas', menuBtnHint: 'Tombol ☰ kecil di atas semua jendela, juga saat roda tersembunyi: sentuh untuk membuka pengaturan ini (dengan PIN kalau diisi). Tamu juga bisa melihatnya.', menuCorner: 'Pojok tombol menu', corners: { 'top-right': 'Kanan atas', 'top-left': 'Kiri atas', 'bottom-right': 'Kanan bawah', 'bottom-left': 'Kiri bawah' },
    tabKeys: 'Pintasan', keysHint: 'Cara menjangkau app saat berjalan di booth:', keysList: [
      ['Ctrl+Alt+Shift+S', 'Buka pengaturan ini dari mana saja (juga saat {booth} yang tampil)'], ['Ctrl+Alt+Shift+H', 'Sembunyikan / tampilkan roda (tetap tersembunyi sampai ditekan lagi)'],
      ['Ctrl+Alt+Shift+Q', 'Keluar dari app'], ['☰', 'Tombol menu (tab Layar, "Tombol menu selalu di atas"): pengaturan'],
      ['Ikon tray', 'Dekat jam: klik untuk pengaturan; klik kanan: Settings / Hide-show / Quit'], ['Tahan pojok kiri atas 3 dtk', 'Pengaturan, di layar sentuh'],
      ['Buka exe-nya lagi', 'Membuka pengaturan app yang sudah berjalan'], ['Tombol Pengaturan', 'Di layar tunggu'],
      ['S', 'Pengaturan (jendela app sedang aktif)'], ['Spasi / Enter', 'Putar; setelah menang: "Ayo foto!" (jendela app sedang aktif)'],
      ['Ctrl+Q', 'Keluar (jendela app sedang aktif)'], ['F12', 'Developer tools (jendela app sedang aktif)'], ['Enter / Esc', 'Di kotak PIN: OK / batal']],
    display: 'Layar', hide: 'Sembunyikan / tampilkan roda', hideHint: 'Bisa juga Ctrl+Alt+Shift+H, atau ikon di tray', mock: 'Mode uji (aplikasi booth tiruan)', mockHint: 'App dimulai ulang',
    pin: 'PIN pengaturan', pinHint: 'Kosong = tanpa PIN', clearPin: 'Hapus PIN',
    save: 'Simpan', cancel: 'Batal', quit: 'Tutup app', saving: 'Menyimpan…', restarting: 'Tersimpan, memulai ulang…',
    file: 'Disimpan di', enterPin: 'Masukkan PIN pengaturan', wrongPin: 'PIN salah', keys: 'Ctrl+Alt+Shift+S pengaturan · Ctrl+Alt+Shift+H sembunyikan / tampilkan · Ctrl+Alt+Shift+Q keluar',
  },
  zh: {
    title: '设置', tabBooth: '拍照亭', tabWheel: '转盘', tabSound: '声音', tabScreen: '屏幕', tabSecurity: '安全',
    host: '地址', port: 'Local API 端口', password: 'Local API 密码', kept: '已保存（留空则不变）',
    test: '测试连接', testing: '测试中…', ok: '✓ 已连接', noEvent: '没有正在运行的活动', brandName: '品牌名称', brandHint: '留空 = 拍照亭应用报告的名称（Q-Booth、BleepShareAI、XBooth）。显示给客人和本设置。',
    boothHint: '在 {booth} 中：Settings → Advanced → Local API（Expert 模式）：打开，然后把端口和密码复制到这里。适用于 QBooth.exe、BleepShare.exe 和 XBooth.exe。',
    language: '语言', titleText: '标题', titleHint: '留空 = 所选语言的“转动幸运轮！”',
    autoGo: '自动继续（秒）', autoGoHint: '0 = 等客人点“开始拍照！”', respins: '可再转次数', maxSeg: '转盘最多格数', maxSegHint: '模板更多时：每位客人随机抽一组',
    bgm: '音乐音量', sfx: '音效音量',
    overlay: '显示在 {booth} 上方', overlayHint: '只在 {booth} 处于欢迎页 / 选择页时显示。关闭 = 普通全屏窗口（如第二屏）。会重启应用。',
    menuBtn: '菜单按钮始终置顶', menuBtnHint: '一个始终在最上层的小 ☰ 按钮，转盘隐藏时也显示：点一下打开设置（如设置了 PIN 需先输入）。客人也看得到。', menuCorner: '菜单按钮位置', corners: { 'top-right': '右上', 'top-left': '左上', 'bottom-right': '右下', 'bottom-left': '左下' },
    tabKeys: '快捷键', keysHint: '应用在拍照亭运行时的操作方式：', keysList: [
      ['Ctrl+Alt+Shift+S', '在任何时候打开设置（{booth} 在前台时也可以）'], ['Ctrl+Alt+Shift+H', '隐藏 / 显示转盘（再按一次才恢复）'],
      ['Ctrl+Alt+Shift+Q', '退出应用'], ['☰', '菜单按钮（屏幕页，"菜单按钮始终置顶"）：设置'],
      ['托盘图标', '时钟旁：单击打开设置；右键：Settings / Hide-show / Quit'], ['按住左上角 3 秒', '在触摸屏上打开设置'],
      ['再次打开 exe', '打开已在运行的应用的设置'], ['设置按钮', '在等待画面上'],
      ['S', '设置（应用窗口处于焦点时）'], ['空格 / Enter', '转动；中奖后："开始拍照！"（应用窗口处于焦点时）'],
      ['Ctrl+Q', '退出（应用窗口处于焦点时）'], ['F12', '开发者工具（应用窗口处于焦点时）'], ['Enter / Esc', 'PIN 框中：确定 / 取消']],
    display: '屏幕', hide: '隐藏 / 显示转盘', hideHint: '也可用 Ctrl+Alt+Shift+H 或托盘图标', mock: '测试模式（模拟拍照亭应用）', mockHint: '会重启应用',
    pin: '设置 PIN 码', pinHint: '留空 = 不设 PIN', clearPin: '删除 PIN',
    save: '保存', cancel: '取消', quit: '关闭应用', saving: '保存中…', restarting: '已保存，正在重启…',
    file: '保存于', enterPin: '请输入设置 PIN 码', wrongPin: 'PIN 码错误', keys: 'Ctrl+Alt+Shift+S 设置 · Ctrl+Alt+Shift+H 隐藏 / 显示 · Ctrl+Alt+Shift+Q 退出',
  },
};

const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids.filter(k => k != null)); return e; };

// {booth} = the booth app's brand, or a neutral word; a sentence that starts with it gets a capital
const NEUTRAL = { en: 'the booth app', id: 'aplikasi booth', zh: '拍照亭应用' };
function fillDeep(v, name) {
  if (typeof v === 'string') return v.replace(/\{booth\}/g, (m, i) => i === 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name);
  if (Array.isArray(v)) return v.map(x => fillDeep(x, name));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillDeep(x, name)]));
  return v;
}

export function initSettings({ lang, locked, desktop }) {
  const base = T[lang] || T.en, neutral = NEUTRAL[lang] || NEUTRAL.en;
  let t = fillDeep(base, neutral);
  let overlay = null, pin = '';

  // While open, the window must show even when the wheel would be hidden (/app/peek).
  const peek = on => fetch('/app/peek', { method: 'POST', body: JSON.stringify({ on }) }).catch(() => { });
  function show(content) {
    overlay?.remove();
    overlay = el('div', { className: 'set-overlay' }, content);
    document.getElementById('settingsRoot').append(overlay);
  }
  function close() { if (overlay) { overlay.remove(); overlay = null; peek(false); } }

  function askPin() {
    return new Promise(resolve => {
      const input = el('input', { type: 'password', inputMode: 'numeric', autocomplete: 'off' });
      const msg = el('div', { className: 'set-msg bad' });
      const ok = el('button', { className: 'set-primary', textContent: 'OK' });
      const cancel = el('button', { textContent: t.cancel });
      show(el('div', { className: 'set-panel set-pin' }, el('h2', { textContent: t.enterPin }), input, msg, el('div', { className: 'set-actions' }, cancel, ok)));
      ok.onclick = async () => {
        const r = await fetch('/settings/unlock', { method: 'POST', body: JSON.stringify({ pin: input.value }) });
        if (r.ok) { pin = input.value; resolve(true); } else { msg.textContent = t.wrongPin; input.select(); } // (the form replaces the prompt, still peeking)
      };
      cancel.onclick = () => { close(); resolve(false); };
      input.onkeydown = e => { if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') cancel.click(); };
      input.focus();
    });
  }

  async function open() {
    if (overlay) return;
    await peek(true);
    if (locked && !(await askPin())) return;
    const r = await fetch('/settings', { headers: { 'x-settings-pin': pin } });
    if (!r.ok) { close(); peek(false); return; }
    show(form(await r.json()));
  }

  function form(s) {
    t = fillDeep(base, s.brand || neutral);
    if (s.brand) t.tabBooth = s.brand;
    const v = s.values, fields = {};
    const row = (label, input, hint) => el('label', { className: 'set-row' },
      el('span', { className: 'set-label', textContent: label }), input, hint ? el('small', { textContent: hint }) : null);
    const text = k => { const i = el('input', { type: 'text', value: v[k] ?? '' }); fields[k] = () => i.value; return i; };
    const num = (k, min, max) => { const i = el('input', { type: 'number', min, max, value: v[k] ?? 0 }); fields[k] = () => i.value; return i; };
    const check = k => { const i = el('input', { type: 'checkbox', checked: !!v[k] }); fields[k] = () => i.checked; return i; };
    const select = (k, opts) => { const i = el('select', {}, ...opts.map(([val, label]) => el('option', { value: String(val), textContent: label, selected: String(v[k]) === String(val) }))); fields[k] = () => i.value; return i; };
    const range = k => {
      const i = el('input', { type: 'range', min: 0, max: 100, value: v[k] ?? 50 });
      const out = el('b', { textContent: i.value });
      i.oninput = () => { out.textContent = i.value; };
      fields[k] = () => i.value;
      return el('div', { className: 'set-inline' }, i, out);
    };
    const pass = el('input', { type: 'password', placeholder: s.has.password ? t.kept : '' });
    fields['qbooth.password'] = () => pass.value;
    const pinIn = el('input', { type: 'password', inputMode: 'numeric', placeholder: s.has.settingsPin ? t.kept : t.pinHint });
    const clearPin = el('input', { type: 'checkbox' });
    fields.settingsPin = () => clearPin.checked ? null : pinIn.value;

    // connection test with what is typed now
    const host = text('qbooth.host'), port = num('qbooth.port', 1, 65535);
    const testMsg = el('span', { className: 'set-msg' });
    const testBtn = el('button', { type: 'button', textContent: t.test });
    testBtn.onclick = async () => {
      testMsg.className = 'set-msg'; testMsg.textContent = t.testing;
      const r = await (await fetch('/settings/test', { method: 'POST', headers: { 'x-settings-pin': pin }, body: JSON.stringify({ host: host.value, port: port.value, password: pass.value }) })).json();
      testMsg.className = 'set-msg ' + (r.ok ? 'good' : 'bad');
      testMsg.textContent = r.ok ? `${t.ok} · ${r.event ? r.event.name : t.noEvent}` : `✗ ${r.error?.code}${r.error?.message && r.error.message !== r.error.code ? ' (' + r.error.message + ')' : ''}`;
    };
    const hideBtn = el('button', { type: 'button', textContent: t.hide });
    hideBtn.onclick = () => { close(); fetch('/app/hide', { method: 'POST', headers: { 'x-settings-pin': pin } }); };

    const section = (title, ...rows) => el('fieldset', {}, el('legend', { textContent: title }), ...rows);
    const sections = [
      section(t.tabBooth,
        el('small', { className: 'set-note', textContent: t.boothHint }),
        row(t.host, host), row(t.port, port), row(t.password, pass),
        el('div', { className: 'set-row' }, el('span'), el('div', { className: 'set-inline' }, testBtn, testMsg)),
        row(t.brandName, text('brandName'), t.brandHint),
        row(t.mock, check('mock'), t.mockHint)),
      section(t.tabWheel,
        row(t.language, select('language', [['en', 'English'], ['id', 'Bahasa Indonesia'], ['zh', '中文']])),
        row(t.titleText, text('title'), t.titleHint),
        row(t.autoGo, num('autoGoSec', 0, 120), t.autoGoHint),
        row(t.respins, num('respins', 0, 10)),
        row(t.maxSeg, num('maxSegments', 4, 40), t.maxSegHint)),
      section(t.tabSound, row(t.bgm, range('bgmVolume')), row(t.sfx, range('sfxVolume'))),
      section(t.tabScreen,
        row(t.overlay, check('overlay'), t.overlayHint),
        s.displays?.length > 1 ? row(t.display, select('display', s.displays.map(d => [d.index, d.label]))) : null,
        row(t.menuBtn, check('menuButton'), t.menuBtnHint),
        row(t.menuCorner, select('menuCorner', Object.entries(t.corners))),
        el('div', { className: 'set-row' }, el('span'), el('div', { className: 'set-inline' }, hideBtn))),
      section(t.tabSecurity,
        row(t.pin, pinIn),
        s.has.settingsPin ? row(t.clearPin, clearPin) : null),
      section(t.tabKeys,
        el('small', { className: 'set-note', textContent: t.keysHint }),
        ...t.keysList.map(([k, what]) => el('div', { className: 'set-row set-key' }, el('kbd', { textContent: k }), el('span', { textContent: what })))),
    ];
    const nav = el('nav', { className: 'set-tabs' });
    const tabBtns = sections.map((fs, i) => {
      const b = el('button', { type: 'button', textContent: fs.querySelector('legend').textContent });
      b.onclick = () => openTab(i);
      return b;
    });
    nav.append(...tabBtns);
    const pages = el('div', { className: 'set-pages' }, ...sections);
    function openTab(i) {
      sections.forEach((fs, k) => { fs.hidden = k !== i; tabBtns[k].classList.toggle('on', k === i); });
      pages.scrollTop = 0;
      try { sessionStorage.setItem('qbr.setTab', String(i)); } catch { }
    }
    let first = 0;
    try { first = Math.min(sections.length - 1, +sessionStorage.getItem('qbr.setTab') || 0); } catch { }
    openTab(first);

    const msg = el('div', { className: 'set-msg' });
    const save = el('button', { className: 'set-primary', textContent: t.save });
    const cancel = el('button', { textContent: t.cancel });
    const quit = el('button', { type: 'button', textContent: t.quit });
    cancel.onclick = close;
    quit.onclick = () => fetch('/app/quit', { method: 'POST', headers: { 'x-settings-pin': pin } });
    save.onclick = async () => {
      const changes = {};
      for (const [k, read] of Object.entries(fields)) {
        const now = read();
        if (k === 'qbooth.password' || k === 'settingsPin') { if (now === null || now) changes[k] = now; continue; }
        if (String(now) !== String(v[k] ?? '')) changes[k] = now;
      }
      save.disabled = true; msg.className = 'set-msg'; msg.textContent = t.saving;
      const r = await (await fetch('/settings', { method: 'POST', headers: { 'x-settings-pin': pin }, body: JSON.stringify(changes) })).json();
      if (!r.ok) { msg.className = 'set-msg bad'; msg.textContent = '✗ ' + (r.error?.message || r.error?.code); save.disabled = false; return; }
      if (r.restart) { msg.textContent = t.restarting; return; } // the app closes and comes back
      location.reload();
    };

    return el('div', { className: 'set-panel tabbed' },
      el('h2', { textContent: '⚙ ' + t.title }),
      nav, pages,
      msg,
      el('div', { className: 'set-actions' }, el('small', { className: 'set-file', textContent: `${t.file}: ${s.file}` }),
        desktop ? quit : null, cancel, save),
    );
  }

  return { open, close, isOpen: () => !!overlay, unlock: () => !locked || askPin() };
}
