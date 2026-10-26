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

// Versionsvergleich für den Update-Hinweis
assert.ok(core.istNeuer('v0.2.1', '0.2.0'));
assert.ok(core.istNeuer('0.10.0', '0.9.9'));
assert.ok(core.istNeuer('v1.0.0', '0.99.0'));
assert.ok(!core.istNeuer('v0.2.0', '0.2.0'));
assert.ok(!core.istNeuer('v0.1.0-mac', '0.2.0'));
assert.ok(!core.istNeuer('v0.2.0-mac', '0.2.0'));
console.log('versionen: ok');

// Werkzeug-Check: GitHub-Adressen von SkillsMP zerlegen, Kopien für andere Agenten erkennen
assert.deepStrictEqual(core.githubTeile('https://github.com/anthropics/skills/tree/main/skills/pdf'), { owner: 'anthropics', repo: 'skills', branch: 'main', pfad: 'skills/pdf' });
assert.strictEqual(core.githubTeile('https://github.com/a/b'), null);
for (const p of ['.kiro/skills/x', 'pi/core/skills/x', 'docs/ja-JP/skills/x', 'i18n/de/skills/x']) assert.ok(core.FREMDER_ORDNER.test(p), p);
for (const p of ['skills/pdf', '.claude/skills/review', 'plugins/api/skills/x']) assert.ok(!core.FREMDER_ORDNER.test(p), p);
console.log('quellen: ok');
