// Ende-zu-Ende-Test mit echtem Claude-Aufruf (verbraucht etwas Pro-Limit).
// Aufruf: npm test [Zielordner]   – Standard: Temp-Ordner
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../core');

assert.strictEqual(core.sauber('Phase: A/B?'), 'Phase – AB');

(async () => {
  const basis = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'kph-'));
  const lokal = path.join(basis, 'lokal');
  fs.mkdirSync(lokal, { recursive: true });
  // Sprache per Umgebungsvariable: E2E_SPRACHE=en testet ein englisches Projekt
  core.setSprache(process.env.E2E_SPRACHE || 'de');
  const tx = (t) => (process.env.E2E_SPRACHE === 'en' ? core.enText(t) : t);
  const info = core.ablageInfo({ modus: 'lokal', ablage: lokal });
  let st = core.neu(info, 'Test: Vogelhaus', 'Ein Vogelhaus mit Kamera, das Fotos von Besuchern aufs Handy schickt');
  assert.strictEqual(st.name, 'Test – Vogelhaus');
  assert.throws(() => core.neu(info, 'test – vogelhaus', 'x'), /gibt es/);

  const t0 = Date.now();
  for (let i = 0; i < 10 && st.offen?.typ !== 'fertig'; i++) {
    const o = st.offen;
    const eingabe = !o ? {}
      : o.typ === 'fragen' ? { antworten: o.fragen.map((f) => f.optionen[0]) }
      : o.typ === 'gate' ? { aktion: 'ok' }
      : { auswahl: o.eintraege.map((e, j) => (e.status === 'fehlt' && e.aktion !== 'nicht_noetig' ? j : -1)).filter((j) => j >= 0) };
    st = await core.weiter(info, st, eingabe);
    console.log(`${((Date.now() - t0) / 1000).toFixed(0)} s · ${st.offen?.typ}${st.offen?.schritt ? '/' + st.offen.schritt : ''}${st.fehler ? ' · FEHLER: ' + st.fehler : ''}`);
    assert.ok(!st.fehler, st.fehler);
  }
  assert.strictEqual(st.offen.typ, 'fertig');
  const d = path.join(lokal, st.name);
  for (const f of ['Interview.md', 'Bedarfsanalyse.md', 'Plan.md', 'Werkzeug-Check.md', 'Dashboard.md', 'Dashboard.html'])
    assert.ok(fs.existsSync(path.join(d, `${st.name} – ${tx(f)}`)), tx(f));
  assert.strictEqual(fs.readdirSync(path.join(d, core.punkteOrdner(st))).length, st.plan.phasen.length);
  const dash = fs.readFileSync(path.join(d, `${st.name} – Dashboard.md`), 'utf8');
  assert.ok(!dash.includes('dataview') && dash.includes(tx('| Punkt | Prio | Bereich | Aufwand |')), 'lokal: statische Tabellen');
  assert.ok(dash.includes(`projekttyp: ${st.projekttyp || 'sonstiges'}`));
  assert.strictEqual(dash.includes('repo:'), st.projekttyp === 'code');

  assert.ok(fs.readFileSync(path.join(d, `${st.name} – ${tx('Bedarfsanalyse.md')}`), 'utf8').includes(tx('## Risiken')));

  // Cockpit: in der App abhaken, dann extern in der Datei abhaken (wie Claude/Obsidian) und wieder einlesen
  let c = core.abhaken(info, st.name, 0, 0, true);
  assert.strictEqual(c.stand.erledigt, 1);
  const pf = path.join(d, core.punkteOrdner(st), fs.readdirSync(path.join(d, core.punkteOrdner(st))).sort()[0]);
  assert.ok(fs.readFileSync(pf, 'utf8').includes('- [x] '));
  fs.writeFileSync(pf, fs.readFileSync(pf, 'utf8').replace('- [ ] ', '- [x] '), 'utf8');
  c = core.aktualisieren(info, st.name);
  assert.strictEqual(c.stand.erledigt, 2);
  assert.ok(fs.readFileSync(path.join(d, `${st.name} – Dashboard.md`), 'utf8').includes(`fortschritt: ${c.stand.fortschritt}`));
  st = c;

  // „Mir ist noch was eingefallen“: Idee wird in eine Phase einsortiert, Warteschlange danach leer
  const schritteVorher = st.plan.phasen.reduce((n, p) => n + p.checkliste.length, 0);
  core.ideeMerken(info, st.name, 'Die Fotos sollen zusätzlich automatisch in einen Ordner auf meinem PC kopiert werden');
  st = await core.ideenVerarbeiten(info, st.name);
  assert.ok(!st.ideenWarten.length && !st.ideeFehler, st.ideeFehler);
  assert.ok(st.plan.phasen.reduce((n, p) => n + p.checkliste.length, 0) > schritteVorher);
  assert.ok(fs.existsSync(path.join(d, `${st.name} – ${tx('Ideen.md')}`)));

  // Obsidian-Modus mit Dataview + Kanban: nur den Spiegel erneut schreiben (kein Claude-Aufruf)
  const vault = path.join(basis, 'vault');
  fs.mkdirSync(path.join(vault, '.obsidian', 'plugins', 'dataview'), { recursive: true });
  fs.mkdirSync(path.join(vault, st.name, core.punkteOrdner(st)), { recursive: true });
  fs.writeFileSync(path.join(vault, 'Projekte-Kanban.md'), '## Backlog / Rückstand\n\n- [ ] alt\n\n## In Bearbeitung\n', 'utf8');
  const vinfo = core.ablageInfo({ modus: 'obsidian', ablage: vault });
  core.spiegel(vinfo, JSON.parse(JSON.stringify(st)), []);
  const vdash = fs.readFileSync(path.join(vault, st.name, `${st.name} – Dashboard.md`), 'utf8');
  assert.ok(vdash.includes('```dataview') && vdash.includes('[['), 'obsidian: Dataview + Wiki-Links');
  assert.ok(!fs.existsSync(path.join(vault, st.name, `${st.name} – Dashboard.html`)));
  const kanban = fs.readFileSync(path.join(vault, 'Projekte-Kanban.md'), 'utf8');
  assert.ok(/- \[ \] alt\n- \[ \] \[\[Test – Vogelhaus – Dashboard\|/.test(kanban), 'Kanban-Zeile im Backlog');

  console.log(`✅ alles grün · Ergebnis: ${d}`);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
