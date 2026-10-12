// Archivieren & Löschen ohne Claude-Aufruf (kostet kein Limit). Aufruf: node test/archiv.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../core');

(async () => {
  const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-archiv-'));
  const info = core.ablageInfo({ modus: 'obsidian', ablage });
  fs.writeFileSync(path.join(ablage, 'Projekte-Kanban.md'), '## Backlog\n- [ ] [[Größe – Test – Dashboard|Größe – Test]] – x\n- [ ] anderes\n', 'utf8');

  // Fremde Pfade werden abgelehnt
  assert.throws(() => core.loeschen(info, '..'), /nicht gefunden/);
  assert.throws(() => core.loeschen(info, 'gibt es nicht'), /nicht gefunden/);

  // Archivieren: ZIP mit korrekten Umlauten im Archiv-Ordner, Projekt weg, Kanban-Zeile weg
  core.neu(info, 'Größe – Test', 'Idee');
  const zip = await core.archivieren(info, 'Größe – Test');
  assert.ok(fs.existsSync(zip) && path.dirname(zip) === path.join(ablage, 'Archiv'), zip);
  const roh = fs.readFileSync(zip); // UTF-8-Namen mit „/“ (sonst sieht der Mac „Ordner\Datei“), leerer Punkte-Ordner bleibt erhalten
  for (const n of ['Größe – Test/projekthelper-state.json', 'Größe – Test/Punkte/']) assert.ok(roh.includes(Buffer.from(n)), n);
  assert.ok(!fs.existsSync(path.join(ablage, 'Größe – Test')));
  assert.strictEqual(fs.readFileSync(path.join(ablage, 'Projekte-Kanban.md'), 'utf8'), '## Backlog\n- [ ] anderes\n');
  assert.deepStrictEqual(core.projekte(info), []);

  // Zweites Archiv am selben Tag überschreibt nicht
  core.neu(info, 'Größe – Test', 'Idee');
  assert.notStrictEqual(await core.archivieren(info, 'Größe – Test'), zip);

  // Löschen
  core.neu(info, 'Weg', 'Idee');
  core.loeschen(info, 'Weg');
  assert.ok(!fs.existsSync(path.join(ablage, 'Weg')));

  fs.rmSync(ablage, { recursive: true });
  console.log('archiv.js ok');
})().catch((e) => { console.error(e); process.exit(1); });
