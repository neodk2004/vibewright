// Prüft #26 (Teil A, B und C): Beim Übernehmen eines Ordners entsteht die Notiz „<Projekt> – Unterlagen.md“ (Datei, Datum, ganz/gekürzt, 1 Satz),
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
const phase = { titel: 'T', bereich: 'Software', aufwand: 'klein', ziel: 'z', fertig_wenn: 'f', checkliste: ['a', 'b', 'c'] };
const planAntwort = { einzeiler: 'e', phasen: [phase, phase, phase] };
const analyse = { ziel: 'z', rahmen: [], muss: [], kann: [], nicht: [], risiken: [], ampel: 'gruen', machbarkeit: 'm' };
fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
let p = ''; process.stdin.on('data', (d) => (p += d)).on('end', () => {
  if (/Schritt: Plan|Änderungswunsch zum Plan/.test(p)) require('fs').writeFileSync(${JSON.stringify(path.join(basis, 'plan-prompt.txt'))}, p);
  const out = p.includes('Schritt: Interview')
    ? { fertig: true, projekttyp: 'code', fragen: [], unterlagen: [{ datei: 'README.md', kurz: 'Beschreibt die Wetterstation.' }, { datei: 'gibt-es-nicht.md', kurz: 'x' }] }
    : /Schritt: Plan|Änderungswunsch zum Plan/.test(p) ? ${JSON.stringify(planAntwort)}
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
  fs.writeFileSync(path.join(repo, 'docs', 'CHANGELOG.md'), 'x'.repeat(5000)); // länger als 4000 → gekürzt

  // repoSteckbrief meldet, was es gelesen hat
  const gelesen = [];
  await core.repoSteckbrief(repo, gelesen);
  assert.deepStrictEqual(gelesen.map((g) => [g.datei, g.ganz]), [['README.md', true], ['docs/CHANGELOG.md', false]]);
  assert.match(gelesen[0].datum, /^\d{4}-\d{2}-\d{2}$/);

  // Teil A: höchstens 20 Doku-Dateien, zusammen höchstens 40.000 Zeichen, Fortschritts-Dateien zuerst
  const viel = (n, laenge) => {
    const o = fs.mkdtempSync(path.join(basis, 'viel-'));
    for (let i = 0; i < n; i++) fs.writeFileSync(path.join(o, `notiz-${String(i).padStart(2, '0')}.md`), 'y'.repeat(laenge));
    fs.writeFileSync(path.join(o, 'TODO.md'), 'z'.repeat(laenge));
    return o;
  };
  const doku = async (o) => { const g = []; const sb = await core.repoSteckbrief(o, g); return { g, sb }; };
  let { g } = await doku(viel(25, 100));
  assert.strictEqual(g.length, 20, '20 kleine Dateien');
  assert.strictEqual(g[0].datei, 'TODO.md', 'Fortschritts-Datei zuerst');
  const gross = await doku(viel(25, 3000));
  g = gross.g;
  const summe = gross.sb.split('\n').filter((z) => /^[yz]+$/.test(z)).reduce((s, z) => s + z.length, 0);
  assert.strictEqual(summe, 40000, 'Obergrenze voll ausgeschöpft, nicht überschritten');
  assert.strictEqual(g.length, 14); // 13 × 3.000 ganz + 1.000 von der 14.
  assert.ok(g.slice(0, 13).every((x) => x.ganz) && !g[13].ganz, 'die letzte ist gekürzt');
  ({ g } = await doku(viel(3, 5000)));
  assert.ok(g.every((x) => !x.ganz), 'über 4.000 Zeichen → gekürzt');

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

  // Teil C: der erste Plan bekommt die Kurzfassungen ausdrücklich, ein Änderungswunsch nicht noch einmal
  const planPrompt = () => fs.readFileSync(path.join(basis, 'plan-prompt.txt'), 'utf8');
  let st2 = await core.weiter(info, core.neu(info, 'Wetter2', 'Wetterstation fertig bauen', repo));
  st2 = await core.weiter(info, st2); // Bedarfsanalyse freigeben → Plan
  assert.strictEqual(st2.offen.schritt, 'plan');
  assert.match(planPrompt(), /<unterlagen>\n- README\.md \(\d{4}-\d{2}-\d{2}, ganz gelesen\): Beschreibt die Wetterstation\.\n- docs\/CHANGELOG\.md \(\S+, gekürzt gelesen\)\n<\/unterlagen>/);
  await core.weiter(info, st2, { aktion: 'aendern', text: 'kürzer' });
  assert.ok(!planPrompt().includes('<unterlagen>'), 'Änderungswunsch ohne Liste');
  // ohne Unterlagen (leerer Ordner) kein Block
  const leer = fs.mkdtempSync(path.join(basis, 'leer-'));
  let st3 = await core.weiter(info, core.neu(info, 'Leer', 'Etwas bauen', leer));
  st3 = await core.weiter(info, st3);
  assert.ok(!st3.unterlagen && !planPrompt().includes('<unterlagen>'), 'ohne Unterlagen kein Block');

  fs.rmSync(basis, { recursive: true, force: true });
  console.log('unterlagen: alle Prüfungen bestanden');
})().catch((e) => { console.error(e); process.exit(1); });
