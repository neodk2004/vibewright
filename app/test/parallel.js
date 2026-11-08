// Zwei Claude-Sitzungen gleichzeitig – mit einem Dummy statt echtem Claude (kostet kein Limit).
// Aufruf: npx electron test/parallel.js <Ordner mit fertigem Projekt aus test/e2e.js>
// Beispiel: npx electron test/parallel.js "%TEMP%\kph-xxxx\lokal\Test – Vogelhaus"
const fs = require('fs');
const path = require('path');
const os = require('os');
const vorlage = process.argv.find((a) => fs.existsSync(path.join(a, 'projekthelper-state.json')));
if (!vorlage) { console.error('Pfad zu einem fertigen Projekt fehlt (siehe Kopf der Datei).'); process.exit(1); }

// Ablage mit zwei Kopien der Vorlage: „A“ und „B“, jeweils mit eigenem Code-Ordner
const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-parallel-'));
const ablage = path.join(basis, 'lokal');
const alt = JSON.parse(fs.readFileSync(path.join(vorlage, 'projekthelper-state.json'), 'utf8')).name;
for (const n of ['A', 'B']) {
  const d = path.join(ablage, n);
  fs.cpSync(vorlage, d, { recursive: true });
  for (const f of fs.readdirSync(d)) if (f.startsWith(alt)) fs.renameSync(path.join(d, f), path.join(d, n + f.slice(alt.length)));
  const st = JSON.parse(fs.readFileSync(path.join(d, 'projekthelper-state.json'), 'utf8'));
  Object.assign(st, { name: n, repo: path.join(basis, `code-${n}`), ideenWarten: [] });
  fs.mkdirSync(st.repo);
  fs.writeFileSync(path.join(d, 'projekthelper-state.json'), JSON.stringify(st), 'utf8');
}
process.env.KPH_USERDATA = path.join(basis, 'daten');
fs.mkdirSync(process.env.KPH_USERDATA);
fs.writeFileSync(path.join(process.env.KPH_USERDATA, 'einstellungen.json'), JSON.stringify({ modus: 'lokal', ablage, sprache: 'de' }));

// Dummy-Claude: gibt seinen Ordner aus, läuft 4 s, beendet sich dann selbst
const core = require('../core');
const node = require('child_process').execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', ['node']).toString().split(/\r?\n/)[0].trim();
core.claudeBefehl = () => ({ datei: node, vorne: ['-e', 'console.log("dummy:" + require("path").basename(process.cwd())); setTimeout(() => {}, 4000)'] });

process.env.SCREENSHOT = path.join(basis, 'parallel.png');
process.env.SCREENSHOT_DELAY = '2000';
// In der Oberfläche: A und B starten, prüfen, dass jede Ausgabe im eigenen Terminal landet, dann A beenden
process.env.SCREENSHOT_JS = `(async () => {
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const text = (n) => { const b = terms.get(n)?.term.buffer.active; let s = ''; for (let i = 0; b && i < b.length; i++) s += b.getLine(i).translateToString(true); return s; };
  for (const n of ['A', 'B']) await claudeStarten(await api.laden(n));
  await warte(1500);
  const r = { liste: await api.sitzung(), laeuft: [...laeuft], a: text('A'), b: text('B') };
  await api['sitzung-beenden']('A');
  await warte(800);
  r.nachEnde = await api.sitzung();
  r.laeuftNachEnde = [...laeuft];
  console.log('PARALLEL ' + JSON.stringify(r));
})()`;
const { app } = require('electron');
app.getAppPath = () => path.join(__dirname, '..'); // index.html liegt eine Ebene höher
app.on('web-contents-created', (_e, wc) => wc.on('console-message', (_e2, _l, msg) => {
  if (!msg.startsWith('PARALLEL ')) return;
  const r = JSON.parse(msg.slice(9));
  const ok = r.liste.sort().join() === 'A,B' && r.laeuft.sort().join() === 'A,B'
    && r.a.includes('dummy:code-A') && !r.a.includes('code-B') && r.b.includes('dummy:code-B') && !r.b.includes('code-A')
    && r.nachEnde.join() === 'B' && r.laeuftNachEnde.join() === 'B';
  console.log(ok ? 'parallel ok' : `parallel FEHLER: ${JSON.stringify(r)}`);
  process.exitCode = ok ? 0 : 1;
}));
require('../main.js');
