// Projekt-Regeln: eigener Teil der CLAUDE.md bearbeiten, ohne den Vibewright-Abschnitt zu verlieren. Kein Claude nötig.
// Aufruf: node test/projektregeln.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const core = require('../core');

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'projektregeln-'));
const info = core.ablageInfo({ modus: 'lokal', ablage: basis });
core.neu(info, 'Regeltest', 'Ein Projekt nur für den Test');
const repo = path.join(basis, 'repo');
fs.mkdirSync(repo);
const st = core.laden(info, 'Regeltest');
core.speichern(info, Object.assign(st, { projekttyp: 'code', repo }));
const f = path.join(repo, 'CLAUDE.md');

// Noch keine Datei: leer, Speichern legt sie an
assert.deepStrictEqual(core.projektRegeln(info, 'Regeltest').text, '');
core.projektRegelnSpeichern(info, 'Regeltest', '- Immer Tests schreiben.');
assert.strictEqual(fs.readFileSync(f, 'utf8'), '- Immer Tests schreiben.\n');

// Mit Vibewright-Abschnitt: nur der eigene Teil wird gezeigt und ersetzt, der Abschnitt bleibt
const block = '<!-- projekthelper:start -->\n# Projekt\n<!-- projekthelper:ende -->';
fs.writeFileSync(f, `Oben eigen\n${block}\nUnten eigen\n`);
assert.strictEqual(core.projektRegeln(info, 'Regeltest').text, 'Oben eigen\n\nUnten eigen');
core.projektRegelnSpeichern(info, 'Regeltest', 'Neu  \n');
assert.strictEqual(fs.readFileSync(f, 'utf8'), `${block}\n\nNeu\n`);

// Code-Projekt ohne Ordner: verständlicher Fehler statt Absturz
core.speichern(info, Object.assign(core.laden(info, 'Regeltest'), { repo: null }));
assert.throws(() => core.projektRegeln(info, 'Regeltest'), /Code-Ordner/);

fs.rmSync(basis, { recursive: true, force: true });
console.log('projektregeln ok');
