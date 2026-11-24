// Prüft #26 (Teil B): Beim Übernehmen eines Ordners entsteht die Notiz „<Projekt> – Unterlagen.md“ (Datei, Datum, ganz/gekürzt, 1 Satz),
// verlinkt aus Bedarfsanalyse, Plan und Dashboard. Statt Claude antwortet ein Ersatz-Skript (kostet kein Limit). Aufruf: node test/unterlagen.js
// shortcut: Ersatz wird über PATH gefunden (which -a claude) – unter Windows sucht die App anders, dort wird der Test übersprungen
if (process.platform === 'win32') { console.log('unterlagen: unter Windows übersprungen'); process.exit(0); }
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'unterlagen-'));
const bin = path.join(basis, 'bin');
fs.mkdirSync(bin);
const analyse = { ziel: 'z', rahmen: [], muss: [], kann: [], nicht: [], risiken: [], ampel: 'gruen', machbarkeit: 'm' };
fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
let p = ''; process.stdin.on('data', (d) => (p += d)).on('end', () => {
  const out = p.includes('Schritt: Interview')
    ? { fertig: true, projekttyp: 'code', fragen: [], unterlagen: [{ datei: 'README.md', kurz: 'Beschreibt die Wetterstation.' }, { datei: 'gibt-es-nicht.md', kurz: 'x' }] }
    : ${JSON.stringify(analyse)};
  console.log(JSON.stringify({ session_id: 's', is_error: false, structured_output: out }));
});
`, { mode: 0o755 });
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;
const core = require('../core');

(async () => {
  const repo = path.join(basis, 'repo');
  fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'README.md'), '# Wetterstation\nkurz\n');
  fs.writeFileSync(path.join(repo, 'docs', 'CHANGELOG.md'), 'x'.repeat(2000)); // länger als 1500 → gekürzt

  // repoSteckbrief meldet, was es gelesen hat
  const gelesen = [];
  await core.repoSteckbrief(repo, gelesen);
  assert.deepStrictEqual(gelesen.map((g) => [g.datei, g.ganz]), [['README.md', true], ['docs/CHANGELOG.md', false]]);
  assert.match(gelesen[0].datum, /^\d{4}-\d{2}-\d{2}$/);

  // Übernahme: erste Runde schreibt die Notiz; Sätze von Claude nur für wirklich gelesene Dateien
  const info = core.ablageInfo({ modus: 'obsidian', ablage: fs.mkdtempSync(path.join(basis, 'ablage-')) });
  const st = await core.weiter(info, core.neu(info, 'Wetter', 'Wetterstation fertig bauen', repo));
  assert.deepStrictEqual(st.unterlagen.map((u) => [u.datei, u.kurz]), [['README.md', 'Beschreibt die Wetterstation.'], ['docs/CHANGELOG.md', '']]);
  const md = fs.readFileSync(path.join(info.ablage, 'Wetter', 'Wetter – Unterlagen.md'), 'utf8');
  assert.match(md, /\| README\.md \| \d{4}-\d{2}-\d{2} \| ganz \| Beschreibt die Wetterstation\. \|/);
  assert.match(md, /\| docs\/CHANGELOG\.md \| \S+ \| gekürzt \| – \|/);
  assert.ok(!md.includes('xxxx'), 'keine Volltext-Kopie');

  // Links aus Bedarfsanalyse, Plan und Dashboard – auch auf Englisch
  st.analyse = st.offen.analyse;
  st.plan = { einzeiler: 'e', phasen: [] };
  const link = '> Grundlage: [Unterlagen](Wetter%20%E2%80%93%20Unterlagen.md)';
  assert.ok(core.analyseMd(st).includes(link) && core.planMd(st).includes(link));
  assert.ok(core.enText(core.planMd(st)).includes('> Based on: [Documents](Wetter%20%E2%80%93%20Documents.md)'));
  assert.strictEqual(core.enText('# Wetter – Unterlagen\nAlte Unterlagen im Keller'), '# Wetter – Documents\nAlte Unterlagen im Keller', 'Projekttext bleibt unberührt');
  assert.strictEqual(core.enText('[[Wetter – Unterlagen|Unterlagen]] <a href="x">Unterlagen</a>'), '[[Wetter – Documents|Documents]] <a href="x">Documents</a>');
  assert.ok(!core.planMd({ ...st, unterlagen: undefined }).includes('Grundlage'), 'ohne Unterlagen kein toter Link');
  st.offen = { typ: 'fertig' };
  st.plan.phasen = [{ titel: 'Eins', bereich: 'Software', aufwand: 'klein', ziel: 'z', fertig_wenn: 'f', checkliste: ['a'], done: [false], status: 'offen' }];
  core.speichern(info, st);
  core.aktualisieren(info, 'Wetter');
  assert.match(fs.readFileSync(path.join(info.ablage, 'Wetter', 'Wetter – Dashboard.md'), 'utf8'), /\[\[Wetter – Unterlagen\|Unterlagen\]\]/);

  fs.rmSync(basis, { recursive: true, force: true });
  console.log('unterlagen: alle Prüfungen bestanden');
})().catch((e) => { console.error(e); process.exit(1); });
