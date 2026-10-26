// Ablage fehlt / liegt im Programmordner – ohne Claude, ohne Electron
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../core');

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-ablage-'));
// Fehlende Ablage → Fehler statt leerer Liste
assert.throws(() => core.projekte({ ablage: path.join(basis, 'weg') }), /Ablage nicht gefunden/);
assert.deepStrictEqual(core.projekte({}), []);
// Kaputte Zustandsdatei versteckt nicht die anderen Projekte
const ablage = path.join(basis, 'vault');
for (const n of ['A', 'B']) fs.mkdirSync(path.join(ablage, n), { recursive: true });
fs.writeFileSync(path.join(ablage, 'A', 'projekthelper-state.json'), '{"name":"A"}');
fs.writeFileSync(path.join(ablage, 'B', 'projekthelper-state.json'), '{kaputt');
assert.deepStrictEqual(core.projekte({ ablage }).map((p) => p.name), ['A']);
// Programmordner: Vault unterhalb eines Ordners mit Obsidian.exe bzw. Deinstaller
assert.strictEqual(core.imProgrammordner(ablage), null);
const prog = path.join(basis, 'Obsidian');
fs.mkdirSync(path.join(prog, 'DHome'), { recursive: true });
fs.writeFileSync(path.join(prog, 'Uninstall Obsidian.exe'), '');
assert.strictEqual(core.imProgrammordner(path.join(prog, 'DHome')), prog);
assert.strictEqual(core.imProgrammordner('/Applications/Obsidian.app/Contents/x'), path.resolve('/Applications/Obsidian.app'));
fs.rmSync(basis, { recursive: true });
console.log('ablage: ok');
