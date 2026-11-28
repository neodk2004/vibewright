// Agenten (Claude-Code-Subagenten): Kopfteil lesen/schreiben, unbekannte Felder bleiben. Kein Claude nötig.
// Aufruf: node test/agenten.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
// Vor core laden: spätere Dateitests dürfen nie ins echte ~/.claude schreiben
process.env.CLAUDE_CONFIG_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'agenten-'));
const core = require('../core');

// ---------- Lesen/Schreiben ----------
const a = core.agentLesen('---\nname: code-reviewer\ndescription: Prüft Änderungen\ntools: Read, Grep\nmodel: sonnet\ncolor: blue\nhooks:\n  PreToolUse:\n    - matcher: Bash\n---\n\nDu bist Reviewer.\n');
assert.deepStrictEqual([a.name, a.description, a.model, a.tools, a.anweisungen.trim(), a.fehler], ['code-reviewer', 'Prüft Änderungen', 'sonnet', ['Read', 'Grep'], 'Du bist Reviewer.', null]);
assert.deepStrictEqual(a.rest, ['color: blue', 'hooks:', '  PreToolUse:', '    - matcher: Bash']);
const b = core.agentLesen(core.agentText({ ...a, description: 'Sagt: "Achtung" # nie - *x*' }));
assert.strictEqual(b.description, 'Sagt: "Achtung" # nie - *x*');
assert.deepStrictEqual(b.rest, a.rest, 'unbekannte Felder bleiben');
assert.deepStrictEqual(core.agentLesen('---\nname: x\ndescription: >\n  zwei\n  Zeilen\ntools: [Read, Glob]\n---\n').description, 'zwei Zeilen');
assert.deepStrictEqual(core.agentLesen('---\nname: x\ndescription: d\ntools:\n  - Read\n  - Bash\n---\n').tools, ['Read', 'Bash']);
assert.strictEqual(core.agentLesen('---\nname: x\ndescription: d\n---\n').tools, null);
assert.match(core.agentLesen('---\nname: x\nname: y\ndescription: d\n---\n').fehler, /doppelt/);
assert.match(core.agentLesen('---\nname: x\ndescription: &a d\n---\n').fehler, /von Hand/);
assert.match(core.agentLesen('---\nname: x\ndescription: d\n').fehler, /von Hand/, 'schließendes --- fehlt');
assert.strictEqual(core.agentLesen('---\r\nname: x\r\ndescription: d\r\n---\r\n').nl, '\r\n');
assert.ok(core.agentText({ name: 'x', description: 'd', model: null, tools: null, anweisungen: 'A', rest: [] }).indexOf('tools') < 0);

console.log('agenten: alle Prüfungen bestanden');
