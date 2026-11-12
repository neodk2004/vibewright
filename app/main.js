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
async function neuestesRelease() {
  const opt = { headers: { 'User-Agent': 'Vibewright' }, signal: AbortSignal.timeout(8000) };
  try {
    const r = await fetch('https://api.github.com/repos/neodk2004/vibewright/releases/latest', { ...opt, headers: { ...opt.headers, Accept: 'application/vnd.github+json' } });
    if (r.ok) { const j = await r.json(); if (j.tag_name) return { tag: j.tag_name, url: j.html_url }; }
  } catch {}
  // Fallback, wenn die API nicht antwortet (z. B. Limit von 60 Anfragen/Stunde in Netzen mit gemeinsamer IP aufgebraucht):
  // die normale Release-Seite leitet auf …/releases/tag/vX.Y.Z weiter und hat dieses Limit nicht
  try {
    const r = await fetch('https://github.com/neodk2004/vibewright/releases/latest', { ...opt, method: 'HEAD' });
    const tag = /^https:\/\/github\.com\/neodk2004\/vibewright\/releases\/tag\/([^/?#]+)$/.exec(r.url)?.[1];
    if (tag) return { tag: decodeURIComponent(tag), url: r.url };
  } catch {}
  return null;
}
async function updatePruefen() {
  const n = await neuestesRelease();
  return n && core.istNeuer(n.tag, app.getVersion()) && /^https:\/\//.test(n.url) ? { version: n.tag.replace(/^v/, ''), url: n.url } : null;
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
  return { claude: await core.checks(), modell: s.modell || 'sonnet', sprache: s.sprache || 'de', ablage: core.ablageInfo(s), vaults: core.obsidianVaults(), git: await gitStatus(), gitAuto: s.gitAuto !== false, version: app.getVersion() };
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
handle('neu', (name, idee, repo) => core.neu(info(), name, idee, repo));
handle('claude-sitzungen', () => core.claudeSitzungen());

// ---------- GitHub / Gitea: Konto in den Einstellungen, Import beim neuen Projekt ----------
// Token liegt nur verschlüsselt (Windows-Anmeldung / macOS-Schlüsselbund) in den Einstellungen
const { safeStorage } = require('electron');
const forgeKonto = () => lies().forge || { typ: 'github', server: '', nutzer: '' };
const forgeToken = () => { const t = lies().forge?.token; try { return t ? safeStorage.decryptString(Buffer.from(t, 'base64')) : ''; } catch { return ''; } };
const forgeOrigin = (k) => { try { return k.typ === 'github' ? 'https://github.com' : new URL(k.server).origin; } catch { return ''; } };
handle('forge', () => { const { token, ...k } = forgeKonto(); return { ...k, tokenGespeichert: !!token }; });
handle('forge-speichern', async ({ typ, server, nutzer, token, tokenLoeschen }) => {
  if (!['github', 'gitea'].includes(typ)) throw new Error('Unbekannter Dienst');
  const k = { typ, server: typ === 'gitea' ? String(server || '').trim().replace(/\/+$/, '') : '', nutzer: String(nutzer || '').trim() };
  // Gespeichertes Token nur für denselben Server weiterverwenden – nach einem Wechsel nie an den neuen Server schicken
  const alt = forgeKonto(), gleicherServer = alt.typ === k.typ && forgeOrigin(alt) === forgeOrigin(k);
  const neuToken = tokenLoeschen ? '' : String(token || '').trim() || (gleicherServer ? forgeToken() : '');
  const repos = await core.forgeRepos(k, neuToken); // Verbindung prüfen, bevor gespeichert wird
  if (neuToken && !safeStorage.isEncryptionAvailable()) throw new Error('Token kann auf diesem System nicht sicher gespeichert werden.');
  speichereEinstellung({ forge: { ...k, ...(neuToken ? { token: safeStorage.encryptString(neuToken).toString('base64') } : {}) } });
  return { anzahl: repos.length };
});
handle('forge-repos', () => core.forgeRepos(forgeKonto(), forgeToken()));
handle('forge-klonen', async (repo) => {
  const k = forgeKonto(), token = forgeToken();
  if (new URL(repo.url).origin !== forgeOrigin(k)) throw new Error('Repository gehört nicht zum eingetragenen Server.'); // Token nie an fremde Server
  const s = lies();
  const r = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: s.sprache === 'en' ? `Folder for the code of "${repo.name}"` : `Ordner für den Code von „${repo.name}“`, defaultPath: path.join(s.codeOrdner || DOKUMENTE, repo.name),
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const ziel = r.filePaths[0];
  // Schon geklont → einfach übernehmen; fremder, nicht leerer Ordner wird nie überschrieben
  if (!fs.existsSync(path.join(ziel, '.git'))) {
    if (fs.existsSync(ziel) && fs.readdirSync(ziel).length) throw new Error('Der Ordner ist nicht leer. Bitte einen leeren oder neuen Ordner wählen.');
    // Token nur für diesen einen Aufruf als Header – per Umgebung statt Befehlszeile (nicht in der Prozessliste), nicht in .git/config
    const auth = token ? { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.extraHeader', GIT_CONFIG_VALUE_0: `Authorization: Basic ${Buffer.from(`${k.nutzer || 'x-access-token'}:${token}`).toString('base64')}` } : {};
    const g = await core.run('git', ['clone', '--', repo.url, ziel], { env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...auth } });
    if (g.code !== 0) throw new Error(`Klonen fehlgeschlagen: ${(g.err || g.out).trim().split('\n').pop()}`);
  }
  speichereEinstellung({ codeOrdner: path.dirname(ziel) });
  return { ordner: ziel, name: repo.name, idee: repo.beschreibung || `Weiterentwicklung von ${repo.voll}` };
});

// ---------- Globale Regeln: die zentrale CLAUDE.md, die Claude Code in jedem Projekt liest ----------
const REGELN = path.join(core.CLAUDE_DIR, 'CLAUDE.md');
handle('regeln', () => ({ pfad: REGELN, text: fs.existsSync(REGELN) ? fs.readFileSync(REGELN, 'utf8') : '' }));
handle('regeln-speichern', (text) => {
  fs.mkdirSync(path.dirname(REGELN), { recursive: true });
  if (fs.existsSync(REGELN)) fs.copyFileSync(REGELN, `${REGELN}.bak`); // letzter Stand bleibt als Sicherung
  fs.writeFileSync(REGELN, String(text), 'utf8');
});
handle('limits', () => core.claudeLimits());
handle('laden', (name) => core.laden(info(), name));
handle('weiter', (name, eingabe) => core.weiter(info(), core.laden(info(), name), eingabe));
handle('oeffnen', (datei) => (info().modus === 'obsidian'
  ? shell.openExternal(`obsidian://open?path=${encodeURIComponent(datei)}`)
  : shell.openPath(datei)));
handle('aktualisieren', (name) => core.aktualisieren(info(), name));
handle('abhaken', (name, phase, idx, wert) => core.abhaken(info(), name, phase, idx, wert));
// ---------- Eingebettetes Terminal: Claude Code läuft interaktiv in der App ----------
// Mehrere Projekte dürfen gleichzeitig laufen – höchstens eine Sitzung pro Projekt
const sitzungen = new Map(); // name → { pty, watcher, erledigt, ideeLaeuft }
// Wird die App aus einer Claude-Sitzung heraus gestartet, dürfen deren Variablen nicht an die neue Sitzung vererbt werden
const sauberesEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDECODE|CLAUDE_CODE_|CLAUDE_PID$|CLAUDE_EFFORT$)/i.test(k)));
const senden = (kanal, ...a) => BrowserWindow.getAllWindows()[0]?.webContents.send(kanal, ...a);
function sitzungBeenden(name) {
  const s = sitzungen.get(name);
  if (!s) return;
  sitzungen.delete(name);
  s.watcher?.close();
  try { s.pty.kill(); } catch {}
}
ipcMain.on('pty-eingabe', (_e, name, d) => sitzungen.get(name)?.pty.write(d));
ipcMain.on('pty-groesse', (_e, name, cols, rows) => { try { sitzungen.get(name)?.pty.resize(Math.max(cols, 20), Math.max(rows, 5)); } catch {} });
handle('sitzung', () => [...sitzungen.keys()]);
// Idee merken; ohne laufende Claude-Sitzung sofort einarbeiten, sonst nach dem nächsten erledigten Schritt
const ideeAufnehmen = (name, text) => {
  const st = core.ideeMerken(info(), name, text);
  return sitzungen.has(name) ? st : core.ideenVerarbeiten(info(), name);
};
handle('idee', ideeAufnehmen);
// ---------- Pflege-Modus: alle Phasen erledigt → Fehler und Wünsche laufen über die Issues des Projekt-Repos ----------
async function pflegeZiel(st) {
  if (!st.repo || !fs.existsSync(path.join(st.repo, '.git'))) return null;
  const r = await core.run('git', ['remote', 'get-url', 'origin'], { cwd: st.repo });
  return r.code === 0 ? core.forgeZiel(forgeKonto(), r.out) : null;
}
const ART = { fehler: 'Fehler', wunsch: 'Feature-Wunsch' };
const issueIdee = (nr, art, titel, text) => `GitHub-Issue #${nr} (${ART[art]}): ${titel}${text && text !== titel ? `\n${text}` : ''}\nNenne „GitHub-Issue #${nr}“ in jedem Schritt.`;
function issueErledigt(name, nr) {
  const st = core.laden(info(), name);
  st.issuesErledigt = [...new Set([...(st.issuesErledigt || []), nr])];
  st.issuesNeu = (st.issuesNeu || []).filter((x) => x.nr !== nr);
  core.speichern(info(), st);
  return st;
}
handle('pflege-pruefen', async (name) => {
  const st = core.laden(info(), name);
  const ziel = await pflegeZiel(st);
  st.pflegeRepo = ziel ? `${ziel.owner}/${ziel.repo}` : null;
  try {
    st.issuesNeu = ziel ? (await core.forgeIssues(forgeKonto(), forgeToken(), ziel)).filter((x) => !(st.issuesErledigt || []).includes(x.nr)) : [];
    st.pflegeFehler = null;
  } catch (e) { st.pflegeFehler = e.message; }
  core.speichern(info(), st);
  return st;
});
handle('pflege-melden', async (name, art, text) => {
  text = String(text || '').trim();
  if (!ART[art] || !text) throw new Error('Bitte erst beschreiben, worum es geht.');
  const ziel = await pflegeZiel(core.laden(info(), name));
  if (!ziel) return ideeAufnehmen(name, `${ART[art]}: ${text}`); // ohne Repo: nur in den Plan
  const { nr } = await core.forgeIssueAnlegen(forgeKonto(), forgeToken(), ziel, art, text);
  issueErledigt(name, nr);
  return ideeAufnehmen(name, issueIdee(nr, art, text.split('\n')[0], text));
});
// Fremde Issues kommen nie von selbst in den Plan – erst nach Klick auf „Übernehmen“
handle('pflege-uebernehmen', (name, nr) => {
  const x = (core.laden(info(), name).issuesNeu || []).find((i) => i.nr === nr);
  if (!x) throw new Error('Dieses Issue gibt es nicht mehr.');
  issueErledigt(name, nr);
  return ideeAufnehmen(name, issueIdee(nr, x.art, x.titel, x.text));
});
handle('pflege-ignorieren', (name, nr) => issueErledigt(name, nr));
handle('sitzung-beenden', (name) => sitzungBeenden(name));
// Läuft gerade Claude in diesem Projekt: erst beenden, sonst sperrt Windows den Ordner
handle('archivieren', (name) => (sitzungBeenden(name), core.archivieren(info(), name)));
handle('loeschen', (name) => (sitzungBeenden(name), core.loeschen(info(), name)));
app.on('before-quit', () => [...sitzungen.keys()].forEach(sitzungBeenden));

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
  sitzungBeenden(name); // nur dieses Projekt neu starten, andere laufen weiter
  const b = core.claudeBefehl();
  if (!b) throw new Error('Claude Code wurde nicht gefunden. Bitte installieren und die App neu starten.');
  const pty = require('@lydell/node-pty').spawn(b.datei, [...b.vorne, 'Lies CLAUDE.md und beginne mit dem aktuellen Auftrag.'],
    { name: 'xterm-256color', cols, rows, cwd: ordner, env: sauberesEnv() });
  // Hakt Claude (oder du in Obsidian) einen Schritt ab, soll die Checkliste in der App sofort mitziehen
  // Wartende Ideen werden eingearbeitet, sobald Claude einen Schritt abgehakt hat („nach einem Task“)
  let t;
  const watcher = fs.watch(path.join(i.ablage, name, core.punkteOrdner(vorher)), () => { clearTimeout(t); t = setTimeout(nachAenderung, 300); });
  async function nachAenderung() {
    const s = sitzungen.get(name);
    if (s?.pty !== pty) return senden('punkte-geaendert', name);
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
  sitzungen.set(name, { pty, watcher, erledigt: bereit.stand?.erledigt ?? 0, ideeLaeuft: false });
  pty.onData((d) => senden('pty-daten', name, d));
  pty.onExit(() => {
    const s = sitzungen.get(name);
    if (s && s.pty !== pty) return; // alte Sitzung nach Neustart: die neue läuft weiter
    if (s) { watcher.close(); sitzungen.delete(name); }
    senden('pty-ende', name);
  });
  return bereit;
});
// „Fehler melden“: GitHub-Formular mit Version, System und Ablage vorausgefüllt öffnen (Feld-IDs aus .github/ISSUE_TEMPLATE/bug_report.yml)
handle('fehler-melden', () => {
  const s = lies();
  const system = WIN ? (Number(os.release().split('.')[2]) >= 22000 ? 'Windows 11' : 'Windows 10') : MAC ? (process.arch === 'arm64' ? 'macOS – Apple Silicon' : 'macOS – Intel') : 'Other';
  const ablage = !s.ablage ? 'Not set up yet' : s.modus === 'obsidian' ? 'Obsidian' : 'Local folder (Markdown + HTML)';
  const q = new URLSearchParams({ template: 'bug_report.yml', version: app.getVersion(), system, ablage });
  shell.openExternal(`https://github.com/neodk2004/vibewright/issues/new?${q}`);
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
// macOS: Nach der Installation aus der .dmg einmal pro Version anbieten, das Abbild auszuwerfen und in den Papierkorb zu legen.
// Läuft die App noch direkt aus der .dmg (/Volumes/…), wird nichts gefragt.
async function dmgAufraeumen(win) {
  if (!MAC || process.env.SCREENSHOT || app.getAppPath().startsWith('/Volumes/') || lies().dmgGefragt === app.getVersion()) return;
  const cp = require('child_process');
  const eingehaengt = (() => { try { return core.vibewrightDmgs(cp.execFileSync('hdiutil', ['info'], { timeout: 5000 }).toString()); } catch { return []; } })();
  // Schon ausgeworfen? Dann liegt die .dmg meist noch in „Downloads“
  const downloads = app.getPath('downloads');
  const liegend = (() => { try { return fs.readdirSync(downloads).filter((f) => /^Vibewright[^/]*\.dmg$/i.test(f)).map((f) => ({ datei: path.join(downloads, f) })); } catch { return []; } })();
  const dmgs = [...eingehaengt, ...liegend.filter((l) => !eingehaengt.some((e) => e.datei === l.datei))].filter((d) => fs.existsSync(d.datei));
  if (!dmgs.length) return;
  const en = lies().sprache === 'en';
  const { response } = await dialog.showMessageBox(win, {
    type: 'question', buttons: en ? ['Move to Trash', 'Keep'] : ['In den Papierkorb', 'Behalten'], defaultId: 0, cancelId: 1,
    message: en ? 'Vibewright is installed' : 'Vibewright ist installiert',
    detail: (en ? 'The installer file is no longer needed:\n' : 'Die Installationsdatei wird nicht mehr gebraucht:\n') + dmgs.map((d) => path.basename(d.datei)).join('\n')
      + (en ? '\n\nEject it and move it to the Trash?' : '\n\nAuswerfen und in den Papierkorb legen?'),
  });
  speichereEinstellung({ dmgGefragt: app.getVersion() });
  if (response !== 0) return;
  for (const d of dmgs) {
    if (d.laufwerk) try { cp.execFileSync('hdiutil', ['detach', d.laufwerk], { timeout: 15000 }); } catch {}
    await shell.trashItem(d.datei).catch(() => {});
  }
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
    setTimeout(() => { win.show(); splash.destroy(); setTimeout(() => dmgAufraeumen(win), 800); }, 300);
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
