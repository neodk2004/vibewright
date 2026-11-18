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

  // Eigener Ordner (z. B. NAS): wird als Code-Ordner übernommen und beim Löschen des Projekts nie angefasst
  const fremd = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-fremd-'));
  fs.writeFileSync(path.join(fremd, 'main.py'), 'print(1)\n');
  const st = core.neu(info, 'Fremd', 'Idee', fremd);
  assert.deepStrictEqual([st.repo, st.projekttyp], [fremd, 'code']);
  // Doku wird mitgelesen (Stand-Dateien zuerst), Abhängigkeits-Ordner nicht
  fs.mkdirSync(path.join(fremd, 'docs', 'wiki'), { recursive: true });
  fs.mkdirSync(path.join(fremd, 'node_modules', 'x'), { recursive: true });
  fs.writeFileSync(path.join(fremd, 'docs', 'wiki', 'Aufbau.md'), 'Sensor angeschlossen\n');
  fs.writeFileSync(path.join(fremd, 'docs', 'Stand.md'), 'Phase 1 fertig\n');
  fs.writeFileSync(path.join(fremd, 'node_modules', 'x', 'README.md'), 'fremdes Paket\n');
  const sb = await core.repoSteckbrief(fremd);
  assert.match(sb, /main\.py/);
  assert.match(sb, /Doku-Dateien: docs\/Stand\.md, docs\/wiki\/Aufbau\.md/);
  assert.match(sb, /--- docs\/wiki\/Aufbau\.md ---\nSensor angeschlossen/);
  assert.ok(!sb.includes('fremdes Paket'));

  // Schon Erledigtes aus dem Plan bleibt beim Werkzeug-Check erhalten (auch wenn ein Installationsschritt davor rutscht)
  const phase = (t, done) => ({ titel: t, bereich: 'Software', aufwand: 'klein', ziel: 'z', fertig_wenn: 'f', checkliste: ['a', 'b', 'c'], done });
  Object.assign(st, { plan: { einzeiler: 'e', phasen: [phase('Eins', [true, true, true]), phase('Zwei', [true, false, false]), phase('Drei', [false, false, false])] },
    werkzeug: { plan_korrekturen: [], eintraege: [{ bedarf: 'Python', phase: 2, art: 'system', status: 'fehlt', quelle: 'https://python.org', empfehlung: 'x', aktion: 'installieren' }] } });
  core.spiegel(info, st, [0]);
  assert.deepStrictEqual(st.plan.phasen.map((p) => p.status), ['erledigt', 'in-arbeit', 'offen']);
  assert.deepStrictEqual(st.plan.phasen[1].done, [false, true, false, false]);
  assert.strictEqual(st.stand.naechster, 'Python installieren (https://python.org)');
  core.loeschen(info, 'Fremd');
  assert.ok(fs.existsSync(path.join(fremd, 'main.py')));
  assert.throws(() => core.neu(info, 'Weg2', 'Idee', path.join(fremd, 'fehlt')), /nicht gefunden/);
  fs.rmSync(fremd, { recursive: true });

  fs.rmSync(ablage, { recursive: true });
  console.log('archiv.js ok');
})().catch((e) => { console.error(e); process.exit(1); });
