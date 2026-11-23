// Prüft #27: Eine Idee, die kommt, während Claude gerade eine andere einordnet, geht nicht verloren und wird nicht doppelt geschickt.
// Statt Claude antwortet ein Ersatz-Skript nach 1 s (kostet kein Limit). Aufruf: node test/ideen-wettlauf.js
// shortcut: Ersatz wird über PATH gefunden (which -a claude) – unter Windows sucht die App anders, dort wird der Test übersprungen
if (process.platform === 'win32') { console.log('ideen-wettlauf: unter Windows übersprungen'); process.exit(0); }
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'ideen-wettlauf-'));
const bin = path.join(basis, 'bin');
const log = path.join(basis, 'aufrufe.log');
fs.mkdirSync(bin);
fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
let p = ''; process.stdin.on('data', (d) => (p += d)).on('end', () => setTimeout(() => {
  const idee = (p.match(/eingefallen:\\n„([^“]*)“/) || [])[1] || '?';
  require('fs').appendFileSync(${JSON.stringify(log)}, idee + '\\n');
  if (idee.includes('Fehler')) return console.log(JSON.stringify({ is_error: true, result: 'Testfehler' }));
  console.log(JSON.stringify({ session_id: 's', is_error: false, structured_output: { phase: 1, schritte: ['Schritt zu ' + idee], kurz: idee,
    neue_phase: { titel: '', bereich: '', aufwand: 'klein', ziel: '', fertig_wenn: '' } } }));
}, 1000));
`, { mode: 0o755 });
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;
const core = require('../core');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function projekt(n) {
  const info = core.ablageInfo({ modus: 'lokal', ablage: fs.mkdtempSync(path.join(basis, 'ablage-')) });
  core.speichern(info, { ...core.neu(info, n, 'Ein Projekt nur für den Test'),
    plan: { phasen: [{ titel: 'Bauen', ziel: 'z', fertig_wenn: 'f', checkliste: ['Start'], done: [false], status: 'in-arbeit' }] } });
  return info;
}
const aufrufe = () => { const a = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : []; fs.rmSync(log, { force: true }); return a; };

(async () => {
  // Terminal-Sitzung offen: B wird nur gemerkt, während A eingeordnet wird → B darf nicht verschwinden
  let n = 'Sitzung', info = projekt(n);
  core.ideeMerken(info, n, 'Idee A');
  const a = core.ideenVerarbeiten(info, n);
  await sleep(300);
  core.ideeMerken(info, n, 'Idee B');
  await a;
  let st = core.laden(info, n);
  assert.deepStrictEqual(st.ideen.map((x) => x.text), ['Idee A', 'Idee B'], 'B wird in derselben Schleife mit eingeordnet');
  assert.deepStrictEqual(st.ideenWarten, []);
  assert.deepStrictEqual(aufrufe(), ['Idee A', 'Idee B']);

  // Keine Sitzung: jede Idee startet ideenVerarbeiten → der zweite Lauf darf A nicht noch einmal schicken
  n = 'OhneSitzung'; info = projekt(n);
  core.ideeMerken(info, n, 'Idee A');
  const b = core.ideenVerarbeiten(info, n);
  await sleep(300);
  core.ideeMerken(info, n, 'Idee B');
  const c = core.ideenVerarbeiten(info, n);
  await Promise.all([b, c]);
  st = core.laden(info, n);
  assert.deepStrictEqual(st.ideen.map((x) => x.text), ['Idee A', 'Idee B']);
  assert.deepStrictEqual(aufrufe(), ['Idee A', 'Idee B'], 'jede Idee genau einmal an Claude');
  assert.deepStrictEqual(st.plan.phasen[0].checkliste, ['Start', 'Schritt zu Idee A', 'Schritt zu Idee B']);

  // Claude scheitert, während eine neue Idee kommt → beide bleiben in der Warteschlange
  n = 'Fehler'; info = projekt(n);
  core.ideeMerken(info, n, 'Idee mit Fehler');
  const d = core.ideenVerarbeiten(info, n);
  await sleep(300);
  core.ideeMerken(info, n, 'Idee C');
  await d;
  st = core.laden(info, n);
  assert.deepStrictEqual(st.ideenWarten, ['Idee mit Fehler', 'Idee C']);
  assert.strictEqual(st.ideeFehler, 'Testfehler');
  aufrufe();

  fs.rmSync(basis, { recursive: true, force: true });
  console.log('ideen-wettlauf: alle Prüfungen bestanden');
})().catch((e) => { console.error(e); process.exit(1); });
