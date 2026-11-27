// GHSA-pr7r-642c-886q: Ein übernommener Ordner darf per Symlink weder private Dateien in den Prompt bringen noch sie überschreiben lassen.
// Kein Claude nötig. Aufruf: node test/symlink.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const core = require('../core');

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'symlink-'));
const repo = path.join(basis, 'repo');
fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
const geheim = path.join(basis, 'geheim.txt');
fs.writeFileSync(geheim, 'GEHEIM-AUSSERHALB');
fs.writeFileSync(path.join(repo, 'docs', 'innen.md'), 'INNEN-OK');
try {
  fs.symlinkSync(geheim, path.join(repo, 'README.md'));
  fs.symlinkSync(geheim, path.join(repo, 'package.json'));
  fs.symlinkSync(path.join(repo, 'docs', 'innen.md'), path.join(repo, 'CLAUDE.md'));
} catch (e) {
  if (e.code === 'EPERM') { console.log('symlink: Symlinks nicht erlaubt (Windows ohne Entwicklermodus) – übersprungen'); process.exit(0); }
  throw e;
}

(async () => {
  // Lesen: Links nach außen werden ignoriert, Links innerhalb des Ordners bleiben erlaubt (z. B. CLAUDE.md -> AGENTS.md)
  const gelesen = [];
  const sb = await core.repoSteckbrief(repo, gelesen);
  assert.ok(!sb.includes('GEHEIM-AUSSERHALB'), 'Inhalt von außerhalb im Prompt');
  assert.ok(sb.includes('INNEN-OK'), 'Link innerhalb des Ordners soll gelesen werden');
  assert.ok(!gelesen.some((g) => g.datei === 'README.md' || g.datei === 'package.json'), 'Link nach außen in der Unterlagen-Liste');

  // Schreiben: CLAUDE.md als Link nach außen → Fehler, Zieldatei bleibt unverändert
  const info = core.ablageInfo({ modus: 'lokal', ablage: fs.mkdtempSync(path.join(basis, 'ablage-')) });
  const st = core.neu(info, 'Link', 'Test', repo);
  Object.assign(st, { projekttyp: 'code', offen: { typ: 'fertig' }, plan: { einzeiler: 'e',
    phasen: [{ titel: 'Eins', bereich: 'Software', aufwand: 'klein', ziel: 'z', fertig_wenn: 'f', checkliste: ['a'], done: [false], status: 'offen' }] } });
  core.speichern(info, st);
  core.aktualisieren(info, 'Link');
  fs.unlinkSync(path.join(repo, 'CLAUDE.md'));
  fs.symlinkSync(geheim, path.join(repo, 'CLAUDE.md'));
  assert.throws(() => core.claudeVorbereiten(info, 'Link'), /außerhalb/);
  assert.strictEqual(fs.readFileSync(geheim, 'utf8'), 'GEHEIM-AUSSERHALB', 'Datei außerhalb wurde verändert');

  // Link ohne Ziel: darf keine neue Datei außerhalb anlegen
  const neuZiel = path.join(basis, 'neu-ausserhalb.txt');
  fs.unlinkSync(path.join(repo, 'CLAUDE.md'));
  fs.symlinkSync(neuZiel, path.join(repo, 'CLAUDE.md'));
  assert.throws(() => core.claudeVorbereiten(info, 'Link'), /außerhalb/);
  assert.ok(!fs.existsSync(neuZiel), 'Datei außerhalb angelegt');

  // Normale CLAUDE.md funktioniert weiter
  fs.unlinkSync(path.join(repo, 'CLAUDE.md'));
  core.claudeVorbereiten(info, 'Link');
  assert.ok(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8').includes('projekthelper:start'));

  fs.rmSync(basis, { recursive: true, force: true });
  console.log('symlink: alle Prüfungen bestanden');
})().catch((e) => { console.error(e); process.exit(1); });
