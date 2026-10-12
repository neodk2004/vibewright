// Kern von Vibewright: steuert Claude Code headless und schreibt die Projektdateien.
// Kein Electron-Import, damit test/e2e.js den Kern ohne Oberfläche testen kann.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let MODEL = 'sonnet'; // Modell für die Planung, in den Einstellungen wählbar
const setModell = (m) => { if (['sonnet', 'opus', 'haiku'].includes(m)) MODEL = m; };
const STATE = 'projekthelper-state.json';
// Feste cwd, sonst findet --resume die Sitzung nicht (alter Ordnername bleibt für bestehende Installationen)
const WORKDIR = path.join(os.homedir(), fs.existsSync(path.join(os.homedir(), '.ki-projekthelper')) ? '.ki-projekthelper' : '.vibewright', 'work');
const SYSTEM = `Du bist der Planungs-Kern von Vibewright. Du hilfst Menschen, aus einer Idee einen umsetzbaren Projektplan zu machen.
Schreibe auf Deutsch mit korrekten Umlauten, klar und ohne Fachchinesisch. Halte dich exakt an das verlangte JSON-Schema.
Empfiehl nur offizielle bzw. geprüfte Werkzeuge und nur, was wirklich nötig ist. Weise auf Risiken hin, an die der Nutzer nicht gedacht hat.`;
// Englische Projekte: eigener Systemprompt, sonst mischt Claude Deutsch (Titel) und Englisch (Schritte)
const SYSTEM_EN = `You are the planning core of Vibewright. You help people turn an idea into a doable project plan.
Write ALL text in English – titles, questions, options, steps, explanations – clearly and without jargon, even though the instructions you receive are in German. Follow the requested JSON schema exactly; keep enum values exactly as defined.
Recommend only official or verified tools and only what is really needed. Point out risks the user has not thought of.`;

// ---------- Prozesse ----------

function run(cmd, args, { input, cwd, env } = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, env, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => resolve({ code: -1, out, err: String(e) }));
    p.on('close', (code) => resolve({ code, out, err }));
    p.stdin.end(input ?? '');
  });
}

async function claude(prompt, { schema, session, sprache = 'de' } = {}) {
  fs.mkdirSync(WORKDIR, { recursive: true });
  const args = ['-p', '--output-format', 'json', '--model', MODEL, '--system-prompt', sprache === 'en' ? SYSTEM_EN : SYSTEM,
    '--tools', '', '--setting-sources', 'project', '--strict-mcp-config'];
  if (schema) args.push('--json-schema', JSON.stringify(schema));
  if (session) args.push('--resume', session);
  const r = await claudeLauf(args, { input: prompt, cwd: WORKDIR });
  let j;
  try { j = JSON.parse(r.out); } catch { throw new Error(`Claude-Aufruf fehlgeschlagen: ${(r.err || r.out).slice(0, 400)}`); }
  if (j.is_error) {
    const msg = String(j.result || 'Unbekannter Fehler');
    // ponytail: bei Limit nur speichern + Hinweis; automatisch warten und fortsetzen kommt später
    if (/limit|usage/i.test(msg)) throw new Error(`Limit erreicht – der Stand ist gespeichert. Später auf „Erneut versuchen“ klicken. (${msg})`);
    throw new Error(msg);
  }
  return { session: j.session_id, data: j.structured_output ?? j.result };
}

// ---------- Onboarding & Ablage ----------

async function checks() {
  const v = await claudeLauf(['--version']);
  if (v.code !== 0) return { claude: false };
  const a = await claudeLauf(['auth', 'status', '--json']);
  let auth = {};
  try { auth = JSON.parse(a.out); } catch {}
  // authMethod: 'claude.ai' = Abo (Pro/Max/Team); alles andere = API-Key, jede Nutzung kostet extra
  return { claude: true, version: v.out.trim(), loggedIn: !!auth.loggedIn, abo: auth.subscriptionType || '', apiKey: !!auth.loggedIn && auth.authMethod !== 'claude.ai' };
}

const WIN = process.platform === 'win32';
const MAC = process.platform === 'darwin';
// Obsidian merkt sich seine Vaults je nach System an anderer Stelle
const obsidianJson = () => (WIN ? path.join(process.env.APPDATA || '', 'obsidian', 'obsidian.json')
  : MAC ? path.join(os.homedir(), 'Library', 'Application Support', 'obsidian', 'obsidian.json')
  : path.join(os.homedir(), '.config', 'obsidian', 'obsidian.json'));

function obsidianVaults() {
  try {
    const j = JSON.parse(fs.readFileSync(obsidianJson(), 'utf8'));
    return Object.values(j.vaults || {}).map((v) => v.path).filter((p) => fs.existsSync(p));
  } catch { return []; }
}

// Was die Ablage kann: Dataview-Tabellen, Link aufs Haupt-Dashboard, Kanban.
function ablageInfo(settings) {
  const a = settings.ablage;
  return {
    modus: settings.modus,
    ablage: a,
    dataview: settings.modus === 'obsidian' && fs.existsSync(path.join(a, '.obsidian', 'plugins', 'dataview')),
    hauptDashboard: fs.existsSync(path.join(a, 'Dashboard.md')),
    kanban: fs.existsSync(path.join(a, 'Projekte-Kanban.md')),
  };
}

// ---------- Projekte ----------

const sauber = (s) => s.replace(/:/g, ' –').replace(/[\/\\?*"<>|]/g, '').replace(/\s+/g, ' ').trim();
const heute = () => new Date().toISOString().slice(0, 10);
const dir = (info, st) => path.join(info.ablage, st.name);
// ---------- Sprache ----------
// Neue Projekte bekommen die aktuelle Sprache; sie bleibt pro Projekt fest, damit Dateinamen stabil bleiben.
// Englische Projekte: Vorlagen bleiben deutsch im Code und werden beim Schreiben über diese Tabelle übersetzt.
let SPRACHE = 'de';
const setSprache = (s) => { if (['de', 'en'].includes(s)) SPRACHE = s; };
const EN = [
  ['**Korrekturen aus dem Werkzeug-Check:**', '**Corrections from the tool check:**'],
  ['Bedarfsanalyse', 'Needs Analysis'], ['Werkzeug-Check', 'Tool Check'], ['– Ideen', '– Ideas'], ['Ideen.md', 'Ideas.md'],
  ['> Was dir während der Umsetzung eingefallen ist und wo es gelandet ist.', '> Ideas you had during the build and where they ended up.'],
  ['## Ziel', '## Goal'], ['## Rahmen', '## Scope'], ['## Muss', '## Must-have'], ['## Kann (später)', '## Could-have (later)'],
  ['## Nicht-Ziele', '## Non-goals'], ['## Risiken', '## Risks'], ['## Machbarkeit', '## Feasibility'],
  ['| Risiko | Auswirkung | Gegenmaßnahme |', '| Risk | Impact | Mitigation |'],
  ['## Checkliste', '## Checklist'], ['## Fertig, wenn', '## Done when'],
  ['> Idee: ', '> Idea: '], [' · Interview vom ', ' · Interview on '], ['Projekttyp: ', 'Project type: '], ['| Frage | Antwort |', '| Question | Answer |'],
  ['| # | Phase | Ziel | Fertig, wenn … | Aufwand |', '| # | Phase | Goal | Done when … | Effort |'],
  [/Geprüft am (\S+) auf diesem Rechner\. Installiert wurde nichts\./g, 'Checked on $1 on this computer. Nothing was installed.'],
  ['| Bedarf | Art | Phase | Status | Quelle | Empfehlung |', '| Need | Type | Phase | Status | Source | Recommendation |'], [' · **vorgemerkt**', ' · **noted**'],
  ['## ➡️ Nächster Schritt', '## ➡️ Next step'], ['## 🔁 Wiedereinstieg', '## 🔁 Pick up again'], ['- **Stand:** ', '- **Status:** '],
  [/Phase (\d+) von (\d+) \(„(.*?)“\), (\d+) von (\d+) Schritten erledigt/g, 'Phase $1 of $2 ("$3"), $4 of $5 steps done'],
  ['Alle Phasen erledigt', 'All phases done'], ['abgeschlossen', 'completed'], ['- **Zuletzt:** ', '- **Last:** '],
  ['Laufkarte erstellt und freigegeben', 'Roadmap created and approved'], ['- **Weiter mit:** ', '- **Next:** '],
  [/„(.*?)“ erledigt \((\S+)\)/g, '"$1" done ($2)'], ['Idee eingearbeitet: ', 'Idea added: '],
  ['## 🔨 In Arbeit', '## 🔨 In progress'], ['## 🔴 Offen', '## 🔴 Open'], ['## ✅ Erledigt', '## ✅ Done'], ['_keine_', '_none_'],
  ['| Punkt | Prio | Bereich | Aufwand |', '| Task | Prio | Area | Effort |'],
  ['AS "Punkt"', 'AS "Task"'], ['AS "Bereich"', 'AS "Area"'], ['AS "Aufwand"', 'AS "Effort"'], ['AS "Erledigt am"', 'AS "Done on"'],
  ['/Punkte"', '/Tasks"'], ['Punkte/', 'Tasks/'], ['[[Dashboard|Alle Projekte]]', '[[Dashboard|All projects]]'],
  ['lang="de"', 'lang="en"'], ['Nächster Schritt', 'Next step'], ['Fertig, wenn: ', 'Done when: '], ['>Notiz<', '>Note<'], ['· Stand ', '· As of '],
  ['## Unterlagen (von Vibewright)', '## Documents (from Vibewright)'], ['- Aktuelle Phase: ', '- Current phase: '], ['## Aktueller Auftrag', '## Current task'],
  ['\nZiel: ', '\nGoal: '], ['Nächster offener Schritt: ', 'Next open step: '], ['## Regeln', '## Rules'],
];
const enText = (t) => EN.reduce((s, [a, b]) => (typeof a === 'string' ? s.split(a).join(b) : s.replace(a, b)), t);
const schreibe = (st, f, t) => fs.writeFileSync(f, st.sprache === 'en' ? enText(t) : t, 'utf8');
const punkteOrdner = (st) => (st.sprache === 'en' ? 'Tasks' : 'Punkte');
const datei = (info, st, teil) => path.join(dir(info, st), `${st.name} – ${st.sprache === 'en' ? enText(teil) : teil}`);
function speichern(info, st) {
  st.aktualisiert = new Date().toISOString();
  fs.writeFileSync(path.join(dir(info, st), STATE), JSON.stringify(st, null, 1), 'utf8');
}

function projekte(info) {
  if (!info.ablage || !fs.existsSync(info.ablage)) return [];
  return fs.readdirSync(info.ablage, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(info.ablage, d.name, STATE)))
    .map((d) => JSON.parse(fs.readFileSync(path.join(info.ablage, d.name, STATE), 'utf8')))
    .sort((a, b) => (b.aktualisiert || '').localeCompare(a.aktualisiert || ''));
}

function laden(info, name) {
  return JSON.parse(fs.readFileSync(path.join(info.ablage, name, STATE), 'utf8'));
}

function neu(info, name, idee) {
  name = sauber(name);
  if (!name || !idee.trim()) throw new Error('Name und Idee sind nötig.');
  const vorhanden = fs.readdirSync(info.ablage).some((d) => d.toLowerCase() === name.toLowerCase());
  if (vorhanden) throw new Error(`„${name}“ gibt es in der Ablage schon. Bitte einen anderen Namen wählen – vorhandene Projekte werden nie überschrieben.`);
  const st = { name, idee: idee.trim(), erstellt: heute(), runden: [], session: null, offen: null, sprache: SPRACHE };
  fs.mkdirSync(path.join(info.ablage, name, punkteOrdner(st)), { recursive: true });
  speichern(info, st);
  return st;
}

// ---------- Archivieren & Löschen ----------
// Nur echte Projektordner direkt in der Ablage – kein „..“ oder Unterpfad aus der Oberfläche
function projektOrdner(info, name) {
  const o = path.resolve(info.ablage, String(name));
  if (path.dirname(o) !== path.resolve(info.ablage) || !fs.existsSync(path.join(o, STATE))) throw new Error('Projekt nicht gefunden.');
  return o;
}
function kanbanEntfernen(info, name) {
  const k = path.join(info.ablage, 'Projekte-Kanban.md');
  if (!fs.existsSync(k)) return;
  const s = fs.readFileSync(k, 'utf8');
  const n = s.split('\n').filter((z) => !z.includes(`[[${name} – Dashboard|`)).join('\n');
  if (n !== s) fs.writeFileSync(k, n, 'utf8');
}
// Endgültig: Projektordner weg (ein eigener Code-Ordner bleibt unberührt)
function loeschen(info, name) {
  fs.rmSync(projektOrdner(info, name), { recursive: true, maxRetries: 5 });
  kanbanEntfernen(info, name);
}
// Projektordner als ZIP nach „Archiv“ in der Ablage, danach aus der Liste entfernen
async function archivieren(info, name) {
  const quelle = projektOrdner(info, name);
  const ziel = path.join(info.ablage, laden(info, name).sprache === 'en' ? 'Archive' : 'Archiv');
  fs.mkdirSync(ziel, { recursive: true });
  let zip = path.join(ziel, `${name} – ${heute()}.zip`);
  for (let n = 2; fs.existsSync(zip); n++) zip = path.join(ziel, `${name} – ${heute()} (${n}).zip`);
  // Windows: .NET über PowerShell (tar.exe verstümmelt Umlaute; CreateFromDirectory schreibt „\“ statt „/“, das macOS nicht versteht)
  // macOS: ditto wie „Komprimieren“ im Finder
  const r = WIN
    ? await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem
$basis = (Split-Path -LiteralPath $env:VW_QUELLE -Parent).Length + 1
$z = [IO.Compression.ZipFile]::Open($env:VW_ZIEL, 'Create')
try { Get-ChildItem -LiteralPath $env:VW_QUELLE -Recurse -Force | ForEach-Object {
  $n = $_.FullName.Substring($basis).Replace('\\', '/')
  if ($_.PSIsContainer) { [void]$z.CreateEntry("$n/") } else { [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($z, $_.FullName, $n) } } }
finally { $z.Dispose() }`], { env: { ...process.env, VW_QUELLE: quelle, VW_ZIEL: zip } })
    : await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', quelle, zip]);
  if (r.code !== 0 || !fs.existsSync(zip)) throw new Error(`Archivieren fehlgeschlagen: ${(r.err || r.out).trim().slice(0, 300)}`);
  loeschen(info, name);
  return zip;
}

// ---------- Schemas ----------

const S_FRAGEN = {
  type: 'object', required: ['fertig', 'projekttyp', 'fragen'],
  properties: {
    fertig: { type: 'boolean' },
    projekttyp: { enum: ['code', 'sonstiges', 'unklar'] },
    fragen: { type: 'array', maxItems: 4, items: { type: 'object', required: ['frage', 'optionen', 'mehrfach'],
      properties: { frage: { type: 'string' }, optionen: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } }, mehrfach: { type: 'boolean' } } } },
  },
};
const liste = (max) => ({ type: 'array', maxItems: max, items: { type: 'string' } });
const S_ANALYSE = {
  type: 'object', required: ['ziel', 'rahmen', 'muss', 'kann', 'nicht', 'risiken', 'ampel', 'machbarkeit'],
  properties: {
    ziel: { type: 'string' },
    rahmen: { type: 'array', maxItems: 8, items: { type: 'object', required: ['punkt', 'wert'], properties: { punkt: { type: 'string' }, wert: { type: 'string' } } } },
    muss: liste(7), kann: liste(5), nicht: liste(5),
    risiken: { type: 'array', maxItems: 5, items: { type: 'object', required: ['risiko', 'auswirkung', 'massnahme'],
      properties: { risiko: { type: 'string' }, auswirkung: { type: 'string' }, massnahme: { type: 'string' } } } },
    ampel: { enum: ['gruen', 'gelb', 'rot'] }, machbarkeit: { type: 'string' },
  },
};
const S_PLAN = {
  type: 'object', required: ['einzeiler', 'phasen'],
  properties: {
    einzeiler: { type: 'string' },
    phasen: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'object',
      required: ['titel', 'bereich', 'aufwand', 'ziel', 'fertig_wenn', 'checkliste'],
      properties: { titel: { type: 'string' }, bereich: { type: 'string' }, aufwand: { enum: ['klein', 'mittel', 'groß'] },
        ziel: { type: 'string' }, fertig_wenn: { type: 'string' }, checkliste: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } } } } },
  },
};
const S_WERKZEUG = {
  type: 'object', required: ['eintraege', 'plan_korrekturen'],
  properties: {
    eintraege: { type: 'array', items: { type: 'object',
      required: ['bedarf', 'phase', 'art', 'status', 'quelle', 'empfehlung', 'aktion'],
      properties: { bedarf: { type: 'string' }, phase: { type: 'integer' }, art: { enum: ['system', 'claude'] },
        exe: { type: 'string' }, pfade: { type: 'array', items: { type: 'string' } },
        status: { enum: ['vorhanden', 'fehlt', 'nicht_noetig'] }, quelle: { type: 'string' }, empfehlung: { type: 'string' },
        aktion: { enum: ['installieren', 'eigener_skill', 'nicht_noetig', 'vorhanden'] } } } },
    plan_korrekturen: { type: 'array', items: { type: 'string' } },
  },
};

// ---------- Ablauf ----------

const antwortenText = (r) => r.fragen.map((f, i) => `- ${f.frage} → ${r.antworten[i] || '(keine Angabe)'}`).join('\n');

async function ask(st, prompt, schema) {
  const sprache = st.sprache === 'en' ? '\n\nIMPORTANT: Write every user-facing text (questions, options, analysis, plan, steps, recommendations, explanations) in English.' : '';
  const r = await claude(prompt + sprache, { schema, session: st.session, sprache: st.sprache });
  st.session = r.session;
  return r.data;
}

async function fragenRunde(st) {
  const nr = st.runden.length + 1;
  const prompt = nr === 1
    ? `Projektname: ${st.name}\nIdee: ${st.idee}\n\nSchritt: Interview, Runde 1 von höchstens 2. Stelle bis zu 4 Multiple-Choice-Fragen (je 2–4 kurze Optionen) für eine Bedarfsanalyse. Pflicht-Themen über beide Runden: Zielgruppe, Kernnutzen/Muss-Umfang, Plattform/Technik, Erfahrungsstand, Zeitbudget pro Woche, Abgrenzung (was ausdrücklich nicht). mehrfach=true, wenn mehrere Antworten sinnvoll sind. projekttyp: code (es entsteht Software/Firmware), sonstiges oder unklar.`
    : `Antworten Runde ${nr - 1}:\n${antwortenText(st.runden.at(-1))}\n\nSchritt: Interview, Runde ${nr} (letzte). Frage nur noch offene Pflicht-Themen oder neue Lücken (bis zu 4 Fragen). Ist nichts Wichtiges offen: fertig=true, fragen=[]. Lege projekttyp fest (code oder sonstiges).`;
  const d = await ask(st, prompt, S_FRAGEN);
  if (d.projekttyp !== 'unklar') st.projekttyp = d.projekttyp;
  if (d.fertig || !d.fragen.length) return analyse(st);
  st.runden.push({ fragen: d.fragen, antworten: [] });
  st.offen = { typ: 'fragen', fragen: d.fragen };
}

async function analyse(st, wunsch) {
  const prompt = wunsch
    ? `Änderungswunsch zur Bedarfsanalyse: ${wunsch}\nGib die vollständige überarbeitete Fassung zurück, gleiche Regeln wie vorher.`
    : `${st.runden.length && st.offen?.typ === 'fragen' ? `Antworten Runde ${st.runden.length}:\n${antwortenText(st.runden.at(-1))}\n\n` : ''}Schritt: Bedarfsanalyse. Kurz und knapp, sie muss ohne Scrollen auf einen Bildschirm passen:
- ziel: 2 Sätze
- rahmen: Eckdaten aus dem Interview (punkt + kurzer wert, höchstens 8)
- muss / kann / nicht: Stichpunkte mit höchstens 10 Wörtern
- risiken: die wichtigsten, auch solche, an die der Nutzer nicht gedacht hat (höchstens 5, jedes Feld höchstens 12 Wörter)
- ampel + machbarkeit (1 Satz)`;
  const d = await ask(st, prompt, S_ANALYSE);
  st.offen = { typ: 'gate', schritt: 'analyse', analyse: d };
}

async function plan(st, wunsch) {
  const prompt = wunsch
    ? `Änderungswunsch zum Plan: ${wunsch}\nGib den vollständigen überarbeiteten Plan zurück.`
    : `Die Bedarfsanalyse ist freigegeben. Schritt: Plan mit 3–6 Phasen. Phase 1 = kleinster lauffähiger Stand. Pro Phase: titel (kurz, ohne Doppelpunkt), bereich (ein Wort), aufwand, ziel (1 Satz), fertig_wenn (prüfbar), checkliste (3–8 konkrete Schritte). Schreibe alles auf Laien-Niveau passend zum Erfahrungsstand aus dem Interview: keine Befehle, Paketnamen oder Fachbegriffe ohne kurze Erklärung in Klammern; Programme werden über ihre offizielle Download-Seite installiert, nicht über winget oder die Kommandozeile. Dazu einzeiler: das Projekt in einem Satz (höchstens 120 Zeichen).`;
  const d = await ask(st, prompt, S_PLAN);
  d.phasen.forEach((p) => (p.titel = sauber(p.titel)));
  st.plan = d;
  st.offen = { typ: 'gate', schritt: 'plan' };
}

function inventar() {
  const h = os.homedir();
  const lies = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const plugins = Object.keys(lies(path.join(h, '.claude', 'plugins', 'installed_plugins.json'))?.plugins || {});
  let skills = [];
  try { skills = fs.readdirSync(path.join(h, '.claude', 'skills')); } catch {}
  const katalog = (lies(path.join(h, '.claude', 'plugins', 'marketplaces', 'claude-plugins-official', '.claude-plugin', 'marketplace.json'))?.plugins || [])
    .map((p) => `${p.name} – ${(p.description || '').slice(0, 70)}`);
  return { plugins, skills, katalog };
}

async function vorhanden(e) {
  if (e.exe && /^[\w.+-]+$/.test(e.exe)) {
    const r = await new Promise((res) => execFile(WIN ? 'where.exe' : 'which', [e.exe], { windowsHide: true }, (err) => res(!err)));
    if (r) return true;
  }
  return (e.pfade || []).some((p) => fs.existsSync(p.replace(/%([^%]+)%/g, (_, k) => process.env[k] ?? '').replace(/^~(?=\/)/, os.homedir())));
}

async function werkzeugCheck(st) {
  const inv = inventar();
  const mcp = (await claudeLauf(['mcp', 'list'])).out.split('\n').filter((l) => l.includes(':') && !/^Checking/.test(l)).join('\n');
  const prompt = `Der Plan ist freigegeben. Schritt: Werkzeug-Check. Was brauchen die Phasen an Systemwerkzeugen (Programme, SDKs, Laufzeiten, VMs) und an Claude-Erweiterungen (Plugins, Skills, MCP)?
Inventar dieses Rechners:
- Betriebssystem: ${os.version()} (${MAC ? 'macOS' : WIN ? 'Windows' : 'Linux'}, ${os.arch()}, Release ${os.release()})
- Installierte Claude-Plugins: ${inv.plugins.join(', ') || 'keine'}
- Eigene Skills: ${inv.skills.join(', ') || 'keine'}
- MCP-Server: ${mcp || 'keine'}
Offizieller Plugin-Katalog (Name – Beschreibung):
${inv.katalog.join('\n') || '(nicht verfügbar)'}

Regeln:
- Nur offizielle Quellen: offizieller Katalog oben oder die Download-Seite des Herstellers. Nur was eine Phase wirklich braucht.
- art=system: gib exe (Programmname wie im PATH${WIN ? ', z. B. ffmpeg.exe' : ', z. B. ffmpeg'}) und pfade (typische Installationspfade${WIN ? ' mit %ProgramFiles%, %LOCALAPPDATA% usw.' : MAC ? ', z. B. /Applications/Name.app oder ~/Applications/Name.app' : ''}) an; status setzt die App selbst, schreib dort "fehlt". Empfiehl nur Programme, die es für dieses Betriebssystem gibt.
- art=claude: status anhand des Inventars. Fehlendes Fachwissen ohne passenden offiziellen Eintrag → aktion eigener_skill.
- bedarf = kurzer Name (höchstens 6 Wörter, z. B. „Raspberry Pi Imager“), Details gehören in empfehlung. quelle = bei art=system die offizielle Download-Seite als vollständige https-URL (keine winget-IDs oder Befehle, der Nutzer ist Laie); bei art=claude der Katalogname. empfehlung in Laiensprache.
- phase = erste Phase, die den Eintrag braucht.
- Widersprüche zum Plan (z. B. Werkzeug läuft auf diesem Betriebssystem bzw. dieser Edition nicht) → plan_korrekturen.`;
  const d = await ask(st, prompt, S_WERKZEUG);
  for (const e of d.eintraege) {
    if (e.art !== 'system' || e.aktion === 'nicht_noetig') { if (e.aktion === 'nicht_noetig') e.status = 'nicht_noetig'; continue; }
    e.status = (await vorhanden(e)) ? 'vorhanden' : 'fehlt';
    if (e.status === 'vorhanden' && e.aktion === 'installieren') e.aktion = 'vorhanden';
  }
  st.werkzeug = d;
  st.offen = { typ: 'werkzeug', eintraege: d.eintraege, korrekturen: d.plan_korrekturen };
}

// Ein Schritt weiter, je nachdem, worauf das Projekt gerade wartet. Zustand ändert sich erst nach erfolgreichem Claude-Aufruf.
async function weiter(info, st, eingabe = {}) {
  const o = st.offen;
  try {
    if (!o) await fragenRunde(st);
    else if (o.typ === 'fragen') {
      st.runden.at(-1).antworten = eingabe.antworten || [];
      if (st.runden.length < 2) await fragenRunde(st);
      else await analyse(st);
      if (st.offen?.schritt === 'analyse') schreibe(st, datei(info, st, 'Interview.md'), interviewMd(st), 'utf8');
    } else if (o.typ === 'gate' && eingabe.aktion === 'aendern') {
      await (o.schritt === 'analyse' ? analyse : plan)(st, eingabe.text);
    } else if (o.typ === 'gate' && o.schritt === 'analyse') {
      st.analyse = o.analyse;
      schreibe(st, datei(info, st, 'Bedarfsanalyse.md'), analyseMd(st), 'utf8');
      await plan(st);
    } else if (o.typ === 'gate' && o.schritt === 'plan') {
      await werkzeugCheck(st);
    } else if (o.typ === 'werkzeug') {
      spiegel(info, st, eingabe.auswahl || []);
    }
    st.fehler = null;
  } catch (e) {
    st.fehler = e.message;
  }
  speichern(info, st);
  return st;
}

// ---------- Dateien schreiben ----------

const zelle = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
const phasenDatei = (p, i) => `Phase ${i + 1} – ${p.titel}`;
const typ = (st) => st.projekttyp || 'sonstiges';

function interviewMd(st) {
  const zeilen = st.runden.flatMap((r) => r.fragen.map((f, i) => `| ${zelle(f.frage)} | ${zelle(r.antworten[i])} |`));
  return `# ${st.name} – Interview\n\n> Idee: ${st.idee} · Interview vom ${heute()}\n\nProjekttyp: ${typ(st)}\n\n| Frage | Antwort |\n|---|---|\n${zeilen.join('\n')}\n`;
}

const AMPEL = { gruen: '🟢', gelb: '🟡', rot: '🔴' };
function analyseMd(st) {
  const a = st.analyse;
  const pkt = (l) => (l.length ? l.map((x) => `- ${x}`).join('\n') : '- –');
  return `# ${st.name} – Bedarfsanalyse

## Ziel
${a.ziel}

## Rahmen
| | |
|---|---|
${a.rahmen.map((r) => `| ${zelle(r.punkt)} | ${zelle(r.wert)} |`).join('\n')}

## Muss
${pkt(a.muss)}

## Kann (später)
${pkt(a.kann)}

## Nicht-Ziele
${pkt(a.nicht)}

## Risiken
| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
${a.risiken.map((r) => `| ${zelle(r.risiko)} | ${zelle(r.auswirkung)} | ${zelle(r.massnahme)} |`).join('\n')}

## Machbarkeit
${AMPEL[a.ampel]} ${a.machbarkeit}
`;
}

function planMd(st) {
  const z = st.plan.phasen.map((p, i) => `| ${i + 1} | ${zelle(p.titel)} | ${zelle(p.ziel)} | ${zelle(p.fertig_wenn)} | ${p.aufwand} |`);
  const k = st.werkzeug?.plan_korrekturen?.length ? `\n\n**Korrekturen aus dem Werkzeug-Check:**\n${st.werkzeug.plan_korrekturen.map((x) => `- ${x}`).join('\n')}` : '';
  return `# ${st.name} – Plan\n\n> ${st.plan.einzeiler}\n\n| # | Phase | Ziel | Fertig, wenn … | Aufwand |\n|---|---|---|---|---|\n${z.join('\n')}${k}\n`;
}

function werkzeugMd(st, auswahl) {
  const icon = { vorhanden: '✅', fehlt: '❌', nicht_noetig: '➖' };
  const z = st.werkzeug.eintraege.map((e, i) =>
    `| ${zelle(e.bedarf)} | ${e.art === 'system' ? 'System' : 'Claude'} | ${e.phase} | ${icon[e.status]} | ${zelle(e.quelle)} | ${zelle(e.empfehlung)}${auswahl.includes(i) ? ' · **vorgemerkt**' : ''} |`);
  return `# ${st.name} – Werkzeug-Check\n\n> Geprüft am ${heute()} auf diesem Rechner. Installiert wurde nichts.\n\n| Bedarf | Art | Phase | Status | Quelle | Empfehlung |\n|---|---|---|---|---|---|\n${z.join('\n')}\n`;
}

function link(info, ziel, text) {
  return info.modus === 'obsidian' ? `[[${ziel}|${text}]]` : `[${text}](${encodeURI(ziel + '.md')})`;
}

function tabelle(info, st, status) {
  if (info.dataview) {
    const sp = status === 'erledigt' ? `erledigt AS "Erledigt am"${typ(st) === 'code' ? ', commit AS "Commit"' : ''}` : 'prio AS "Prio", bereich AS "Bereich", aufwand AS "Aufwand"';
    return `\`\`\`dataview\nTABLE WITHOUT ID file.link AS "Punkt", ${sp}\nFROM "${st.name}/Punkte"\nWHERE typ = "punkt" AND projekt = "${st.name}" AND status = "${status}"\nSORT prio ASC\n\`\`\``;
  }
  // ponytail: statische Tabelle, Stand beim Schreiben; wird bei jeder App-Änderung neu erzeugt
  const z = st.plan.phasen.map((p, i) => [p, i]).filter(([p]) => p.status === status)
    .map(([p, i]) => `| ${link(info, `Punkte/${phasenDatei(p, i)}`, phasenDatei(p, i))} | ${i + 1} | ${zelle(p.bereich)} | ${p.aufwand} |`);
  return z.length ? `| Punkt | Prio | Bereich | Aufwand |\n|---|---|---|---|\n${z.join('\n')}` : '_keine_';
}


const punktDatei = (info, st, i) => path.join(dir(info, st), punkteOrdner(st), `${phasenDatei(st.plan.phasen[i], i)}.md`);

function punktMd(st, p, i) {
  const fm = ['---', 'typ: punkt', `projekt: ${st.name}`, `status: ${p.status}`, `bereich: ${p.bereich}`, `aufwand: ${p.aufwand}`,
    `prio: ${i + 1}`, `quelle: "${st.name} – Plan.md"`, `erfasst: ${st.erstellt}`, ...(p.erledigt ? [`erledigt: ${p.erledigt}`] : []),
    ...(typ(st) === 'code' ? ['commit: ""'] : []), '---'];
  const body = `## Ziel\n${p.ziel}\n\n## Checkliste\n${p.checkliste.map((c, j) => `- [${p.done?.[j] ? 'x' : ' '}] ${c}`).join('\n')}\n\n## Fertig, wenn\n${p.fertig_wenn}\n`;
  return `${fm.join('\n')}\n${body}`;
}

// Die Punkt-Dateien sind die Wahrheit: dort hakt der Nutzer (Obsidian) oder Claude ab. Hier zurück in den Zustand lesen.
function punkteLesen(info, st) {
  st.plan.phasen.forEach((p, i) => {
    let s;
    try { s = fs.readFileSync(punktDatei(info, st, i), 'utf8'); } catch { return; }
    const teil = s.split(/^## Checklist(?:e)?\s*$/m)[1]?.split(/^## /m)[0] || ''; // deutsch oder englisch
    const items = [...teil.matchAll(/^- \[( |x|X)\] (.*)$/gm)];
    if (items.length) { p.checkliste = items.map((m) => m[2].trim()); p.done = items.map((m) => m[1] !== ' '); }
  });
}

// Status je Phase, Fortschritt und nächster Schritt aus den Häkchen ableiten, dann Punkte + Dashboard schreiben
function dashboard(info, st) {
  const T = heute();
  const ph = st.plan.phasen;
  let aktiv = -1;
  ph.forEach((p, i) => {
    p.done = p.checkliste.map((_c, j) => !!p.done?.[j]);
    const alt = p.status;
    if (p.done.every(Boolean)) p.status = 'erledigt';
    else if (aktiv < 0) { aktiv = i; p.status = 'in-arbeit'; }
    else p.status = 'offen';
    if (p.status === 'erledigt' && !p.erledigt) p.erledigt = T;
    if (p.status !== 'erledigt') delete p.erledigt;
    if (alt !== p.status || !fs.existsSync(punktDatei(info, st, i))) schreibe(st, punktDatei(info, st, i), punktMd(st, p, i), 'utf8');
  });
  const gesamt = ph.reduce((n, p) => n + p.checkliste.length, 0);
  const erledigt = ph.reduce((n, p) => n + p.done.filter(Boolean).length, 0);
  const pa = ph[aktiv];
  const naechster = pa ? pa.checkliste[pa.done.indexOf(false)] : 'Alle Phasen erledigt';
  st.stand = { fortschritt: Math.round((erledigt / Math.max(gesamt, 1)) * 100), aktiv, naechster, erledigt, gesamt };
  const code = typ(st) === 'code';
  const fm = ['---', 'typ: projekt', `name: ${st.name}`, `status: "${aktiv < 0 ? 'erledigt' : erledigt ? 'aktiv' : 'vorbereitung'}"`,
    `phase: "${pa ? `Phase ${aktiv + 1} – ${pa.titel}` : 'abgeschlossen'}"`, `fortschritt: ${st.stand.fortschritt}`,
    `naechster_schritt: "${naechster.replace(/"/g, "'")}"`, 'blocker:', `letzte_aktivitaet: ${T}`, `projekttyp: ${typ(st)}`,
    ...(code ? [`repo: "${(st.repo || '').replace(/\\/g, '/')}"`] : []), `aktualisiert: ${T}`, '---'];
  const docs = ['Interview', 'Bedarfsanalyse', 'Plan', 'Werkzeug-Check'].map((d) => link(info, `${st.name} – ${d}`, d)).join(' · ');
  const md = `${fm.join('\n')}
# ${st.name} – Dashboard

${info.hauptDashboard && info.modus === 'obsidian' ? '← [[Dashboard|Alle Projekte]]\n\n' : ''}> ${st.plan.einzeiler}

📄 ${docs}

## ➡️ Nächster Schritt
- ${naechster}${pa ? ` → ${link(info, `Punkte/${phasenDatei(pa, aktiv)}`, phasenDatei(pa, aktiv))}` : ''}

## 🔁 Wiedereinstieg
- **Stand:** ${pa ? `Phase ${aktiv + 1} von ${ph.length} („${pa.titel}“), ${erledigt} von ${gesamt} Schritten erledigt (${st.stand.fortschritt} %).` : 'Alle Phasen erledigt.'}
- **Zuletzt:** ${st.zuletzt || `Laufkarte erstellt und freigegeben (${st.erstellt})`}
- **Weiter mit:** ${naechster}

## 🔨 In Arbeit
${tabelle(info, st, 'in-arbeit')}

## 🔴 Offen
${tabelle(info, st, 'offen')}

## ✅ Erledigt
${tabelle(info, st, 'erledigt')}
`;
  schreibe(st, datei(info, st, 'Dashboard.md'), md, 'utf8');
  if (info.modus === 'lokal') schreibe(st, datei(info, st, 'Dashboard.html'), dashboardHtml(st), 'utf8');
}

function spiegel(info, st, auswahl) {
  st.werkzeug.auswahl = auswahl;
  for (const i of auswahl) {
    const e = st.werkzeug.eintraege[i];
    const p = st.plan.phasen[Math.min(Math.max(e.phase, 1), st.plan.phasen.length) - 1];
    // Installationen zuerst (sie blockieren die Phase), eigene Skills ans Ende (kommen erst mit Etappe 2)
    const skill = e.aktion === 'eigener_skill';
    // Steht das Werkzeug schon in einem Schritt, dort nur den Link ergänzen statt einen doppelten Punkt anzulegen
    const da = skill ? -1 : p.checkliste.findIndex((c) => c.toLowerCase().includes(e.bedarf.toLowerCase()));
    if (da >= 0) { if (!p.checkliste[da].includes(e.quelle)) p.checkliste[da] += ` (${e.quelle})`; continue; }
    const name = e.bedarf.replace(/^(eigener\s+|own\s+)?(projekt-|project\s+)?skill:?\s*/i, '');
    const punkt = st.sprache === 'en'
      ? (skill ? `Create your own project skill "${name}" (stage 2)` : `Install ${e.bedarf} (${e.quelle})`)
      : (skill ? `Eigenen Projekt-Skill „${name}“ anlegen (Etappe 2)` : `${e.bedarf} installieren (${e.quelle})`);
    if (!p.checkliste.includes(punkt)) p.checkliste[skill ? 'push' : 'unshift'](punkt);
  }
  st.plan.phasen.forEach((p, i) => {
    p.done = p.checkliste.map(() => false);
    p.status = i === 0 ? 'in-arbeit' : 'offen';
    schreibe(st, punktDatei(info, st, i), punktMd(st, p, i), 'utf8');
  });
  schreibe(st, datei(info, st, 'Plan.md'), planMd(st), 'utf8');
  schreibe(st, datei(info, st, 'Werkzeug-Check.md'), werkzeugMd(st, auswahl), 'utf8');
  dashboard(info, st);

  if (info.kanban) {
    const k = path.join(info.ablage, 'Projekte-Kanban.md');
    const s = fs.readFileSync(k, 'utf8');
    const zeile = `- [ ] [[${st.name} – Dashboard|${st.name}]] – ${st.plan.einzeiler} · Phase 1 geplant`;
    const i = s.indexOf('## Backlog');
    if (i >= 0 && !s.includes(`[[${st.name} – Dashboard|`)) {
      const j = s.indexOf('\n## ', i + 5);
      const ende = j < 0 ? s.length : j;
      fs.writeFileSync(k, `${s.slice(0, ende).replace(/\n+$/, '')}\n${zeile}\n${s.slice(ende)}`, 'utf8');
    }
  }
  st.offen = { typ: 'fertig', dashboard: datei(info, st, info.modus === 'lokal' ? 'Dashboard.html' : 'Dashboard.md') };
}

// ---------- Cockpit: nach der Laufkarte ----------

function aktualisieren(info, name) {
  const st = laden(info, name);
  if (st.offen?.typ !== 'fertig') return st;
  punkteLesen(info, st);
  dashboard(info, st);
  speichern(info, st);
  return st;
}

// ---------- „Mir ist noch was eingefallen“ ----------
const S_IDEE = {
  type: 'object', required: ['phase', 'neue_phase', 'schritte', 'kurz'],
  properties: {
    phase: { type: 'integer' },
    neue_phase: { type: 'object', required: ['titel', 'bereich', 'aufwand', 'ziel', 'fertig_wenn'],
      properties: { titel: { type: 'string' }, bereich: { type: 'string' }, aufwand: { enum: ['klein', 'mittel', 'groß'] }, ziel: { type: 'string' }, fertig_wenn: { type: 'string' } } },
    schritte: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
    kurz: { type: 'string' },
  },
};

// Idee merken; verarbeitet wird sie sofort oder (wenn Claude gerade arbeitet) nach dem nächsten erledigten Schritt
function ideeMerken(info, name, text) {
  const st = laden(info, name);
  if (!text.trim()) throw new Error('Bitte erst einen Gedanken eintippen.');
  (st.ideenWarten ||= []).push(text.trim());
  speichern(info, st);
  return st;
}

async function ideenVerarbeiten(info, name) {
  const st = laden(info, name);
  if (!st.ideenWarten?.length) return st;
  punkteLesen(info, st);
  const ph = st.plan.phasen;
  try {
    while (st.ideenWarten.length) {
      const idee = st.ideenWarten[0];
      const uebersicht = ph.map((p, i) => `Phase ${i + 1} – ${p.titel} [${p.status}] Ziel: ${p.ziel}\n${p.checkliste.map((c, j) => `  - [${p.done[j] ? 'x' : ' '}] ${c}`).join('\n')}`).join('\n');
      const d = await ask(st, `Das Projekt ist in der Umsetzung. Dem Nutzer ist noch etwas eingefallen:\n„${idee}“\n\nAktueller Plan:\n${uebersicht}\n\nOrdne die Idee ein: phase = Nummer der passenden Phase, die noch nicht erledigt ist (die Idee gehört dorthin, wo sie sachlich hinpasst, nicht automatisch in die aktuelle Phase). Passt sie in keine Phase, phase = ${ph.length + 1} und fülle neue_phase aus; sonst neue_phase mit leeren Texten und aufwand "klein". schritte = 1–3 konkrete Schritte auf Laien-Niveau, die sich nicht mit vorhandenen Schritten doppeln. kurz = ein Satz für den Nutzer, was du wo eingeordnet hast.`, S_IDEE);
      let n = Math.min(Math.max(d.phase, 1), ph.length + 1) - 1;
      if (n === ph.length) {
        ph.push({ ...d.neue_phase, titel: sauber(d.neue_phase.titel || 'Ergänzungen'), checkliste: [], done: [], status: 'offen' });
      }
      const p = ph[n];
      p.checkliste.push(...d.schritte);
      p.done.push(...d.schritte.map(() => false));
      schreibe(st, punktDatei(info, st, n), punktMd(st, p, n), 'utf8');
      (st.ideen ||= []).push({ text: idee, datum: heute(), phase: n + 1, schritte: d.schritte, kurz: d.kurz });
      st.zuletzt = `Idee eingearbeitet: ${d.kurz} (${heute()})`;
      st.ideenWarten.shift();
      st.letzteIdee = d.kurz;
    }
    schreibe(st, datei(info, st, 'Ideen.md'), `# ${st.name} – Ideen\n\n> Was dir während der Umsetzung eingefallen ist und wo es gelandet ist.\n\n${st.ideen.map((x) => `- **${x.datum}** – „${x.text}“\n  → Phase ${x.phase}: ${x.schritte.join(' · ')}`).join('\n')}\n`, 'utf8');
    schreibe(st, datei(info, st, 'Plan.md'), planMd(st), 'utf8');
    dashboard(info, st);
    st.fehler = null;
    st.ideeFehler = null;
  } catch (e) {
    st.fehler = null; // Planungsfehler blockieren das Cockpit nicht; Idee bleibt in der Warteschlange
    st.ideeFehler = e.message;
  }
  speichern(info, st);
  return st;
}

function abhaken(info, name, phase, idx, wert) {
  const st = laden(info, name);
  punkteLesen(info, st);
  const p = st.plan.phasen[phase];
  p.done[idx] = wert;
  schreibe(st, punktDatei(info, st, phase), punktMd(st, p, phase), 'utf8');
  if (wert) st.zuletzt = `„${p.checkliste[idx]}“ erledigt (${heute()})`;
  dashboard(info, st);
  speichern(info, st);
  return st;
}

// Arbeitsordner für Claude Code: bei Code-Projekten ein eigener Ordner (st.repo), sonst der Projektordner
const arbeitsordner = (info, st) => (typ(st) === 'code' ? st.repo : dir(info, st));

const MARKE_A = '<!-- projekthelper:start -->';
const MARKE_E = '<!-- projekthelper:ende -->';
function claudeMd(info, st) {
  const { aktiv, naechster } = st.stand;
  const p = st.plan.phasen[aktiv];
  const pfad = (teil) => datei(info, st, teil).replace(/\\/g, '/');
  return `${MARKE_A}
# Projekt: ${st.name}
${st.plan.einzeiler}

## Unterlagen (von Vibewright)
- Bedarfsanalyse: ${pfad('Bedarfsanalyse.md')}
- Plan: ${pfad('Plan.md')}
- Werkzeug-Check: ${pfad('Werkzeug-Check.md')}
${p ? `- Aktuelle Phase: ${punktDatei(info, st, aktiv).replace(/\\/g, '/')}` : ''}

## Aktueller Auftrag
${p ? `Phase ${aktiv + 1} – ${p.titel}
Ziel: ${p.ziel}
Fertig, wenn: ${p.fertig_wenn}
Nächster offener Schritt: ${naechster}` : 'Alle Phasen sind erledigt. Frag den Nutzer, wie es weitergehen soll.'}

## Regeln
- Arbeite die Checkliste der aktuellen Phase Schritt für Schritt ab, beginnend beim nächsten offenen Schritt.
- Der Nutzer ist Entscheider, kein Profi: erkläre kurz und einfach, frag vor größeren Entscheidungen.
- Ist ein Schritt erledigt, setze in der Phasen-Datei oben \`- [ ]\` auf \`- [x]\`. Die App liest das und aktualisiert Fortschritt und Dashboard.
- Installiere nichts ohne ausdrückliches Ja des Nutzers. Nur offizielle Quellen.${fs.existsSync(path.join(arbeitsordner(info, st) || '', '.git')) ? `
- Dieser Ordner ist ein Git-Projekt: Mach nach jedem erledigten Schritt einen Commit mit kurzer deutscher Beschreibung (z. B. „Schritt erledigt: …“). So kann der Nutzer jederzeit zurück. Pushe nur, wenn der Nutzer es möchte.` : ''}
${MARKE_E}
`;
}

// Bereitet die Claude-Sitzung vor (CLAUDE.md im Arbeitsordner). Gestartet wird sie im eingebetteten Terminal der App (main.js).
function claudeVorbereiten(info, name) {
  const st = aktualisieren(info, name);
  const ordner = arbeitsordner(info, st);
  if (!ordner) throw new Error('Kein Arbeitsordner gewählt.');
  fs.mkdirSync(ordner, { recursive: true });
  // CLAUDE.md: nur unseren Abschnitt ersetzen, eigene Inhalte des Nutzers bleiben stehen
  const f = path.join(ordner, 'CLAUDE.md');
  const alt = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  const block = st.sprache === 'en'
    ? enText(claudeMd(info, st)).replace('<!-- projekthelper:ende -->', '- The user speaks English: always talk to them in English.\n<!-- projekthelper:ende -->')
    : claudeMd(info, st);
  const a = alt.indexOf(MARKE_A), e = alt.indexOf(MARKE_E);
  const neuText = a >= 0 && e > a ? alt.slice(0, a) + block.trimEnd() + alt.slice(e + MARKE_E.length) : `${block}${alt ? `\n${alt}` : ''}`;
  fs.writeFileSync(f, neuText, 'utf8');
  return { st, ordner: path.resolve(ordner) };
}

// node-pty braucht den vollen Pfad zur claude.exe
// ---------- Claude Code finden: nativer Installer (claude.exe) oder npm (claude.cmd) ----------
// Ohne Shell startet Windows nur .exe-Dateien. Bei npm steckt hinter claude.cmd ein node-Skript oder eine .exe – das lesen wir aus.
let claudeCache = null;
const wo = (name) => { try { return require('child_process').execFileSync('where.exe', [name], { windowsHide: true }).toString().split(/\r?\n/).map((s) => s.trim()).filter(Boolean); } catch { return []; } };
// macOS/Linux: claude ist eine ausführbare Datei bzw. ein Symlink auf ein node-Skript mit Shebang – direkt startbar.
// Typische Orte zusätzlich prüfen, weil per Finder gestartete Apps nicht den PATH der Shell erben.
function claudeBefehlUnix() {
  let treffer = [];
  try { treffer = require('child_process').execFileSync('which', ['-a', 'claude']).toString().split('\n').map((s) => s.trim()).filter(Boolean); } catch {}
  const h = os.homedir();
  const orte = [...treffer, path.join(h, '.local', 'bin', 'claude'), path.join(h, '.claude', 'local', 'claude'),
    '/opt/homebrew/bin/claude', '/usr/local/bin/claude', path.join(h, '.npm-global', 'bin', 'claude')];
  const datei = orte.find((p) => { try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; } });
  return datei ? (claudeCache = { datei, vorne: [] }) : null;
}
function claudeBefehl() {
  if (claudeCache) return claudeCache;
  if (!WIN) return claudeBefehlUnix();
  const treffer = wo('claude');
  const exe = treffer.find((p) => /\.exe$/i.test(p)) || [path.join(os.homedir(), '.local', 'bin', 'claude.exe')].find((p) => fs.existsSync(p));
  if (exe) return (claudeCache = { datei: exe, vorne: [] });
  const cmd = treffer.find((p) => /\.cmd$/i.test(p));
  if (!cmd) return null;
  const ziel = fs.readFileSync(cmd, 'utf8').match(/%dp0%\\(node_modules\\[^"]+\.(?:js|exe))/i); // nicht „%dp0%\node.exe“ erwischen
  if (!ziel) return null;
  const voll = path.join(path.dirname(cmd), ziel[1]);
  if (/\.exe$/i.test(voll)) return (claudeCache = { datei: voll, vorne: [] });
  const node = wo('node').find((p) => /\.exe$/i.test(p));
  return node ? (claudeCache = { datei: node, vorne: [voll] }) : null;
}
// Claude Code ohne Shell ausführen (Argumente bleiben unverändert, auch JSON-Schemas)
function claudeLauf(args, opts) {
  const b = claudeBefehl();
  if (!b) return Promise.resolve({ code: -1, out: '', err: 'Claude Code wurde nicht gefunden.' });
  return run(b.datei, [...b.vorne, ...args], opts);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function dashboardHtml(st) {
  const { aktiv, naechster, fortschritt } = st.stand;
  const phasen = st.plan.phasen.map((p, i) => `
<section class="${p.status}"><h3><span>${String(i + 1).padStart(2, '0')}</span> ${esc(p.titel)}</h3><p>${esc(p.ziel)}</p>
<ul>${p.checkliste.map((c, j) => `<li class="${p.done[j] ? 'x' : ''}">${esc(c)}</li>`).join('')}</ul>
<p class="m">Fertig, wenn: ${esc(p.fertig_wenn)} · <a href="${encodeURI(`Punkte/${phasenDatei(p, i)}.md`)}">Notiz</a></p></section>`).join('');
  const docs = ['Interview', 'Bedarfsanalyse', 'Plan', 'Werkzeug-Check'].map((d) => `<a href="${encodeURI(`${st.name} – ${d}.md`)}">${d}</a>`).join(' · ');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(st.name)} Dashboard</title><style>
:root{--bg:#f6f6f4;--panel:#fff;--text:#1d1e21;--muted:#6b6f76;--line:#e4e4e0;--accent:#6a55e8}
@media (prefers-color-scheme:dark){:root{--bg:#121315;--panel:#18191c;--text:#e6e6e8;--muted:#8d9199;--line:#2a2c31;--accent:#9d8cff}}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif}
main{max-width:1000px;margin:0 auto;padding:28px 16px}a{color:var(--accent)}.m{color:var(--muted);font-size:12px}
h1{font-size:22px;margin:0 0 2px}.bar{height:4px;background:var(--line);border-radius:2px;margin:14px 0}.bar i{display:block;height:100%;background:var(--accent);border-radius:2px}
.next{border-left:2px solid var(--accent);padding:2px 12px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
section{background:var(--panel);padding:14px}h3{font-size:14px;margin:0 0 4px}h3 span{color:var(--muted);font-variant-numeric:tabular-nums;margin-right:4px}
section.in-arbeit h3 span{color:var(--accent)}section.erledigt{opacity:.6}
ul{padding-left:16px;margin:8px 0}li{margin:2px 0}li.x{text-decoration:line-through;color:var(--muted)}</style></head><body><main>
<h1>${esc(st.name)}</h1><div class="m">${esc(st.plan.einzeiler)} · ${docs}</div>
<div class="bar"><i style="width:${fortschritt}%"></i></div>
<div class="next"><div class="m">Nächster Schritt${aktiv >= 0 ? ` · Phase ${aktiv + 1}` : ''} · ${fortschritt} %</div>${esc(naechster)}</div>
<div class="grid">${phasen}</div><p class="m">Vibewright · Stand ${heute()}</p></main></body></html>`;
}

module.exports = { checks, obsidianVaults, ablageInfo, projekte, laden, neu, weiter, run, sauber, interviewMd, planMd, analyseMd, spiegel,
  aktualisieren, abhaken, ideeMerken, ideenVerarbeiten, setModell, setSprache, punkteOrdner, enText, claudeVorbereiten, claudeBefehl, arbeitsordner, speichern, loeschen, archivieren };
