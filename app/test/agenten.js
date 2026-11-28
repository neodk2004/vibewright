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

// BOM wird toleriert und nicht wieder geschrieben
const bom = core.agentLesen('\uFEFF---\nname: x\ndescription: d\n---\n');
assert.strictEqual(bom.fehler, null);
assert.ok(!core.agentText(bom).startsWith('\uFEFF'));
// Liste ohne Einrückung
const ul = core.agentLesen('---\nname: x\ndescription: d\ntools:\n- Read\n- Bash\n---\n');
assert.deepStrictEqual([ul.tools, ul.rest, ul.fehler], [['Read', 'Bash'], [], null]);
assert.ok(core.agentText(ul).includes('tools: Read, Bash\n'));
// Leerzeile im Blockwert
const lz = core.agentLesen('---\nname: x\ndescription: >\n  eins\n\n  zwei\n---\n');
assert.deepStrictEqual([lz.description, lz.rest, lz.fehler], ['eins zwei', [], null]);
// Eingerückte Zeile hinter einfachem Wert wird nicht still behalten
assert.ok(core.agentLesen('---\nname: x\ndescription: d\nmodel: sonnet\n- y\n---\n').fehler);
// Leere Tool-Liste = Feld weglassen
assert.ok(core.agentText({ name: 'x', description: 'd', tools: [], anweisungen: 'A', rest: [] }).indexOf('tools') < 0);
// Eingerücktes name: in unbekanntem Block ist nicht der Agentenname
const ein = core.agentLesen('---\nname: x\ndescription: d\nhooks:\n  name: y\n---\n');
assert.deepStrictEqual([ein.name, ein.rest, ein.fehler], ['x', ['hooks:', '  name: y'], null]);
// Mehrzeiliger Text in Anführungszeichen: nicht sicher lesbar
assert.ok(core.agentLesen('---\nname: x\ndescription: "eins\n  zwei"\n---\n').fehler);

console.log('agenten: alle Prüfungen bestanden');
