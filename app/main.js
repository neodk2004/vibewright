const { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const WIN = process.platform === 'win32';
const MAC = process.platform === 'darwin';

// macOS/Linux: Per Finder gestartete Apps kennen den PATH der Shell nicht (claude, git, node fehlen sonst).
// Einmal beim Start aus der Login-Shell holen – Marker trennen den PATH von eventuellen Begrüßungsausgaben.
if (!WIN) {
  try {
    const aus = require('child_process').execFileSync(process.env.SHELL || '/bin/zsh', ['-ilc', 'echo "__PFAD__${PATH}__PFAD__"'], { timeout: 4000 }).toString();
    const pfad = aus.match(/__PFAD__(.*)__PFAD__/)?.[1];
    if (pfad) process.env.PATH = pfad;
  } catch {}
}
const core = require('./core');

// Einstellungsordner fest auf den alten Namen, damit Einstellungen das Umbenennen in „Vibewright“ überleben; KPH_USERDATA für Tests
const altDaten = path.join(app.getPath('appData'), 'ki-projekthelper');
app.setPath('userData', process.env.KPH_USERDATA || (fs.existsSync(altDaten) ? altDaten : path.join(app.getPath('appData'), 'Vibewright')));
// Der echte Dokumente-Ordner (kann in OneDrive oder auf einem anderen Laufwerk liegen)
const DOKUMENTE = app.getPath('documents');
const CONFIG = path.join(app.getPath('userData'), 'einstellungen.json');
const lies = () => { try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; } };
const info = () => core.ablageInfo(lies());

// Jeder Handler liefert {fehler} statt zu werfen, damit die Oberfläche es anzeigen kann
const handle = (kanal, fn) => ipcMain.handle(kanal, async (_e, ...a) => { try { return await fn(...a); } catch (e) { return { fehler: e.message }; } });

handle('start', async () => {
  const s = lies();
  return { checks: await core.checks(), settings: s, vaults: core.obsidianVaults(), ablageFehlt: !!s.ablage && !fs.existsSync(s.ablage) };
});
handle('programmordner', (p) => core.imProgrammordner(p));
// Neue Version auf GitHub? Einmal pro App-Start; ohne Netz oder bei Fehlern still nichts anzeigen.
// Gesendet wird nur die übliche Anfrage an die GitHub-API (keine Projektdaten).
let updateInfo;
async function updatePruefen() {
  try {
    const r = await fetch('https://api.github.com/repos/neodk2004/vibewright/releases/latest', { headers: { 'User-Agent': 'Vibewright', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    return core.istNeuer(j.tag_name, app.getVersion()) && /^https:\/\//.test(j.html_url) ? { version: j.tag_name.replace(/^v/, ''), url: j.html_url } : null;
  } catch { return null; }
}
handle('update', () => (updateInfo ??= updatePruefen()));
core.setModell(lies().modell);
core.setSprache(lies().sprache || 'de');

// ---------- Einstellungen: Claude, Obsidian/Ablage, Git ----------
const speichereEinstellung = (werte) => fs.writeFileSync(CONFIG, JSON.stringify({ ...lies(), ...werte }), 'utf8');
async function gitStatus() {
  const v = await core.run('git', ['--version']);
  if (v.code !== 0) return { installiert: false };
  const n = await core.run('git', ['config', '--global', 'user.name']);
  const m = await core.run('git', ['config', '--global', 'user.email']);
  return { installiert: true, version: v.out.trim().replace('git version ', ''), name: n.out.trim(), email: m.out.trim() };
}
handle('einstellungen', async () => {
  const s = lies();
  return { claude: await core.checks(), modell: s.modell || 'sonnet', sprache: s.sprache || 'de', ablage: core.ablageInfo(s), vaults: core.obsidianVaults(), git: await gitStatus(), gitAuto: s.gitAuto !== false };
});
handle('einstellung', (schluessel, wert) => {
  if (!['modell', 'gitAuto', 'sprache', 'programmordnerOk'].includes(schluessel)) throw new Error('Unbekannte Einstellung');
  speichereEinstellung({ [schluessel]: wert });
  if (schluessel === 'modell') core.setModell(wert);
  if (schluessel === 'sprache') core.setSprache(wert);
});
handle('git-identitaet', async (name, email) => {
  if (!name.trim() || !/^\S+@\S+$/.test(email.trim())) throw new Error('Bitte Name und gültige E-Mail eintragen.');
  await core.run('git', ['config', '--global', 'user.name', name.trim()]);
  await core.run('git', ['config', '--global', 'user.email', email.trim()]);
  return gitStatus();
});
// Anmeldung öffnet den Browser; dafür reicht ein normales Terminalfenster (selten gebraucht)
handle('claude-anmelden', () => {
  const cp = require('child_process');
  if (WIN) return cp.spawn('cmd.exe', ['/c', 'start', '', 'cmd', '/k', 'claude auth login'], { detached: true, stdio: 'ignore' }).unref();
  // macOS: im Terminal öffnen; Claude-Pfad ausdrücklich angeben, falls die Terminal-Shell ihn nicht kennt
  const claude = core.claudeBefehl()?.datei || 'claude';
  if (MAC) return cp.spawn('osascript', ['-e', `tell application "Terminal" to do script "'${claude.replace(/'/g, '')}' auth login"`, '-e', 'tell application "Terminal" to activate'], { detached: true, stdio: 'ignore' }).unref();
  cp.spawn('x-terminal-emulator', ['-e', claude, 'auth', 'login'], { detached: true, stdio: 'ignore' }).unref();
});

// Code-Ordner beim ersten Start als Git-Projekt anlegen (Schalter in den Einstellungen) – Grundlage für Undo per Commit
async function gitAnlegen(ordner) {
  if (lies().gitAuto === false || fs.existsSync(path.join(ordner, '.git'))) return;
  if ((await core.run('git', ['--version'])).code !== 0) return;
  fs.mkdirSync(ordner, { recursive: true });
  await core.run('git', ['init'], { cwd: ordner });
  if (!fs.existsSync(path.join(ordner, '.gitignore'))) fs.writeFileSync(path.join(ordner, '.gitignore'), 'node_modules/\n__pycache__/\n.venv/\n*.log\n.env\n', 'utf8');
  await core.run('git', ['add', '-A'], { cwd: ordner });
  await core.run('git', ['commit', '-m', 'Start mit Vibewright'], { cwd: ordner }); // klappt nur mit Name/E-Mail; sonst bleibt es beim init
}
handle('ablage', (modus, ablage) => {
  if (modus === 'lokal' && !ablage) ablage = path.join(DOKUMENTE, 'Vibewright');
  fs.mkdirSync(ablage, { recursive: true });
  fs.writeFileSync(CONFIG, JSON.stringify({ ...lies(), modus, ablage }), 'utf8');
  return lies();
});
handle('obsidian-installieren', async () => {
  // Windows: über winget; fehlt winget (oder auf macOS/Linux) → offizielle Download-Seite öffnen
  const r = WIN ? await core.run('winget', ['install', '-e', '--id', 'Obsidian.Obsidian', '--accept-source-agreements', '--accept-package-agreements']) : { code: 1 };
  const download = r.code !== 0;
  if (download) shell.openExternal('https://obsidian.md/download');
  const vault = path.join(DOKUMENTE, 'Obsidian', 'Projekte');
  fs.mkdirSync(vault, { recursive: true });
  fs.writeFileSync(CONFIG, JSON.stringify({ ...lies(), modus: 'obsidian', ablage: vault }), 'utf8');
  return { vault, download };
});
handle('projekte', () => core.projekte(info()));
handle('neu', (name, idee) => core.neu(info(), name, idee));
handle('laden', (name) => core.laden(info(), name));
handle('weiter', (name, eingabe) => core.weiter(info(), core.laden(info(), name), eingabe));
handle('oeffnen', (datei) => (info().modus === 'obsidian'
  ? shell.openExternal(`obsidian://open?path=${encodeURIComponent(datei)}`)
  : shell.openPath(datei)));
handle('aktualisieren', (name) => core.aktualisieren(info(), name));
handle('abhaken', (name, phase, idx, wert) => core.abhaken(info(), name, phase, idx, wert));
// ---------- Eingebettetes Terminal: Claude Code läuft interaktiv in der App ----------
// ponytail: eine Sitzung gleichzeitig; mehrere parallele Sitzungen erst, wenn jemand sie braucht
let sitzung = null; // { pty, name, watcher }
// Wird die App aus einer Claude-Sitzung heraus gestartet, dürfen deren Variablen nicht an die neue Sitzung vererbt werden
const sauberesEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDECODE|CLAUDE_CODE_|CLAUDE_PID$|CLAUDE_EFFORT$)/i.test(k)));
const senden = (kanal, ...a) => BrowserWindow.getAllWindows()[0]?.webContents.send(kanal, ...a);
function sitzungBeenden() {
  if (!sitzung) return;
  sitzung.watcher?.close();
  try { sitzung.pty.kill(); } catch {}
  sitzung = null;
}
ipcMain.on('pty-eingabe', (_e, d) => sitzung?.pty.write(d));
ipcMain.on('pty-groesse', (_e, cols, rows) => { try { sitzung?.pty.resize(Math.max(cols, 20), Math.max(rows, 5)); } catch {} });
handle('sitzung', () => sitzung?.name || null);
// Idee merken; ohne laufende Claude-Sitzung sofort einarbeiten, sonst nach dem nächsten erledigten Schritt
handle('idee', async (name, text) => {
  const st = core.ideeMerken(info(), name, text);
  return sitzung?.name === name ? st : core.ideenVerarbeiten(info(), name);
});
handle('sitzung-beenden', () => sitzungBeenden());
// Läuft gerade Claude in diesem Projekt: erst beenden, sonst sperrt Windows den Ordner
const ohneSitzung = (name) => { if (sitzung?.name === name) sitzungBeenden(); };
handle('archivieren', (name) => (ohneSitzung(name), core.archivieren(info(), name)));
handle('loeschen', (name) => (ohneSitzung(name), core.loeschen(info(), name)));
app.on('before-quit', sitzungBeenden);

handle('claude-starten', async (name, cols = 100, rows = 30) => {
  const i = info();
  const st = core.laden(i, name);
  if (st.projekttyp === 'code' && !st.repo) {
    // Code gehört nicht in den Notizen-Ordner: einmalig einen Arbeitsordner wählen (Vorschlag: zuletzt benutzter Elternordner)
    const s = lies();
    const basis = s.codeOrdner || DOKUMENTE;
    const r = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      title: s.sprache === 'en' ? `Folder for the code of "${name}"` : `Ordner für den Code von „${name}“`, defaultPath: path.join(basis, name),
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    });
    if (r.canceled || !r.filePaths[0]) return core.laden(i, name);
    st.repo = r.filePaths[0];
    core.speichern(i, st);
    fs.writeFileSync(CONFIG, JSON.stringify({ ...s, codeOrdner: path.dirname(st.repo) }), 'utf8');
  }
  const vorher = core.laden(i, name);
  if (vorher.projekttyp === 'code' && vorher.repo) await gitAnlegen(vorher.repo);
  const { st: bereit, ordner } = core.claudeVorbereiten(i, name);
  sitzungBeenden();
  const b = core.claudeBefehl();
  if (!b) throw new Error('Claude Code wurde nicht gefunden. Bitte installieren und die App neu starten.');
  const pty = require('@lydell/node-pty').spawn(b.datei, [...b.vorne, 'Lies CLAUDE.md und beginne mit dem aktuellen Auftrag.'],
    { name: 'xterm-256color', cols, rows, cwd: ordner, env: sauberesEnv() });
  // Hakt Claude (oder du in Obsidian) einen Schritt ab, soll die Checkliste in der App sofort mitziehen
  // Wartende Ideen werden eingearbeitet, sobald Claude einen Schritt abgehakt hat („nach einem Task“)
  let t;
  const watcher = fs.watch(path.join(i.ablage, name, core.punkteOrdner(vorher)), () => { clearTimeout(t); t = setTimeout(nachAenderung, 300); });
  async function nachAenderung() {
    const s = sitzung;
    if (s?.name !== name) return senden('punkte-geaendert', name);
    const st = core.aktualisieren(info(), name);
    const erledigt = st.stand?.erledigt ?? 0;
    if (erledigt > s.erledigt && st.ideenWarten?.length && !s.ideeLaeuft) {
      s.ideeLaeuft = true;
      senden('punkte-geaendert', name);
      await core.ideenVerarbeiten(info(), name);
      s.ideeLaeuft = false;
    }
    s.erledigt = Math.max(s.erledigt, erledigt);
    senden('punkte-geaendert', name);
  }
  sitzung = { pty, name, watcher, erledigt: bereit.stand?.erledigt ?? 0, ideeLaeuft: false };
  pty.onData((d) => senden('pty-daten', d));
  pty.onExit(() => { if (sitzung?.pty === pty) { watcher.close(); sitzung = null; } senden('pty-ende', name); });
  return bereit;
});
handle('link', (url) => /^https:\/\//.test(url) && shell.openExternal(url)); // nur https, keine Dateien/Programme
handle('ordner', (p) => shell.openPath(p || info().ablage));

const ICON = path.join(__dirname, 'assets', 'icon.ico');
if (process.env.KPH_THEME) nativeTheme.themeSource = process.env.KPH_THEME; // Tests: hell/dunkel erzwingen
function fenstergroesse() {
  if (process.env.KPH_GROESSE) { const [width, height] = process.env.KPH_GROESSE.split('x').map(Number); return { width, height }; }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width: Math.min(1200, Math.round(width * 0.92)), height: Math.min(780, Math.round(height * 0.92)) };
}
if (WIN) app.setAppUserModelId('de.vibewright.app'); // eigenes Taskleisten-Icon statt Electron-Standard
// macOS braucht ein App-Menü – ohne „Bearbeiten“-Menü gehen ⌘C/⌘V/⌘A in Eingabefeldern nicht
if (MAC) app.whenReady().then(() => require('electron').Menu.setApplicationMenu(require('electron').Menu.buildFromTemplate(
  [{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }])));

app.whenReady().then(() => {
  // Splash-Screen beim Start (nicht im Screenshot-Testmodus); Hauptfenster lädt derweil unsichtbar
  const splash = process.env.SCREENSHOT ? null : new BrowserWindow({
    width: 420, height: 350, frame: false, transparent: true, resizable: false, alwaysOnTop: true, show: false, icon: ICON, title: 'Vibewright',
    webPreferences: { backgroundThrottling: false }, // Animation auch laufen lassen, wenn macOS das Fenster für verdeckt hält
  });
  splash?.loadFile('splash.html');
  // Splash bleibt ab dem Moment, in dem er sichtbar ist, mindestens 2 s stehen – auch wenn die App schon fertig ist
  const splashSichtbar = new Promise((r) => splash?.once('ready-to-show', () => { splash.show(); setTimeout(r, 2000); }));
  const win = new BrowserWindow({
    // Fenster passt sich dem Bildschirm an (auch kleine Laptops mit Skalierung); Hintergrund passend zu hell/dunkel
    ...fenstergroesse(), minWidth: 960, minHeight: 580, backgroundColor: nativeTheme.shouldUseDarkColors ? '#121315' : '#f6f6f4', title: 'Vibewright', autoHideMenuBar: true,
    icon: ICON, show: !splash,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile('index.html');
  // Erst wenn Hauptfenster bereit UND 2 s Splash vorbei sind: Splash ausblenden, Hauptfenster zeigen
  if (splash) win.once('ready-to-show', async () => {
    await splashSichtbar;
    await splash.webContents.executeJavaScript('document.body.classList.add("weg")').catch(() => {});
    setTimeout(() => { win.show(); splash.destroy(); }, 300);
  });
  // Für Tests: SCREENSHOT=pfad.png speichert nach dem Laden ein Bild und beendet die App
  if (process.env.SCREENSHOT) win.webContents.on('console-message', (_e, _l, msg, line, src) => console.log(`[ui] ${msg} (${src}:${line})`));
  if (process.env.SCREENSHOT) win.webContents.on('did-finish-load', () => setTimeout(async () => {
    if (process.env.SCREENSHOT_JS) { await win.webContents.executeJavaScript(process.env.SCREENSHOT_JS); await new Promise((r) => setTimeout(r, 1500)); }
    fs.writeFileSync(process.env.SCREENSHOT, (await win.webContents.capturePage()).toPNG());
    app.quit();
  }, Number(process.env.SCREENSHOT_DELAY || 4000)));
});
app.on('window-all-closed', () => app.quit());
