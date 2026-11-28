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

// ---------- Dateien ----------
const cfg = process.env.CLAUDE_CONFIG_DIR;
const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'agenten-proj-'));
const info = core.ablageInfo({ modus: 'lokal', ablage: basis });
const repo = path.join(basis, 'repo');
fs.mkdirSync(repo);
core.neu(info, 'MitOrdner', 'Test');
core.speichern(info, Object.assign(core.laden(info, 'MitOrdner'), { projekttyp: 'code', repo }));
core.neu(info, 'OhneOrdner', 'Test');
core.speichern(info, Object.assign(core.laden(info, 'OhneOrdner'), { projekttyp: 'code' }));
const geheim = path.join(basis, 'geheim.md');
const leer = (name) => ({ name, description: 'd', model: null, tools: null, anweisungen: '' });
const ag = (...t) => path.join(cfg, 'agents', ...t);

assert.deepStrictEqual(core.agentenListe(info).agenten, []);
core.agentSpeichern(info, null, null, { name: 'tester', description: 'Testet', model: null, tools: null, anweisungen: 'Tests laufen lassen.' });
assert.ok(fs.existsSync(ag('tester.md')));
assert.throws(() => core.agentSpeichern(info, null, null, leer('Böse:Name')), /Name/);
assert.throws(() => core.agentSpeichern(info, null, null, leer('tester')), /Es gibt schon eine Agenten-Datei tester\.md\./);
assert.throws(() => core.agentSpeichern(info, null, null, { ...leer('x'), description: ' ' }), /description|Beschreibung/);
// fremder Name bleibt, Dateiname bleibt, hooks bleiben
fs.writeFileSync(ag('alt.md'), '---\nname: Code_Reviewer\ndescription: x\nhooks:\n  Stop: []\n---\nA\n');
core.agentSpeichern(info, null, 'alt.md', { name: 'Code_Reviewer', description: 'neu', model: 'opus', tools: ['Read'], anweisungen: 'B' });
assert.match(fs.readFileSync(ag('alt.md'), 'utf8'), /hooks:\n  Stop: \[\]/);
// umbenennen
core.agentSpeichern(info, null, 'alt.md', { name: 'reviewer', description: 'neu', model: null, tools: null, anweisungen: 'B' });
assert.ok(!fs.existsSync(ag('alt.md')) && fs.existsSync(ag('reviewer.md')));
// ignoriert: Unterordner, .txt, ohne name, Symlink nach außen
fs.mkdirSync(ag('unter')); fs.writeFileSync(ag('notiz.txt'), 'x'); fs.writeFileSync(ag('README.md'), '# Doku');
let links = true;
fs.writeFileSync(geheim, '---\nname: geheim\ndescription: x\n---\n');
try { fs.symlinkSync(geheim, ag('link.md')); } catch (e) { if (e.code !== 'EPERM') throw e; links = false; }
assert.deepStrictEqual(core.agentenListe(info).agenten.map((x) => x.name), ['reviewer', 'tester']);
if (links) {
  assert.throws(() => core.agentSpeichern(info, null, 'link.md', leer('link')));
  assert.throws(() => core.agentSpeichern(info, null, null, leer('link')));
  assert.throws(() => core.agentLoeschen(info, null, 'link.md'));
  assert.strictEqual(fs.readFileSync(geheim, 'utf8').includes('name: geheim'), true, 'Ziel außerhalb unverändert');
} else console.log('agenten: Symlinks nicht erlaubt (Windows ohne Entwicklermodus) – Link-Prüfungen übersprungen');
assert.throws(() => core.agentLoeschen(info, null, '../x.md'));
assert.throws(() => core.agentLoeschen(info, null, 'tester.txt'));
core.agentLoeschen(info, null, 'tester.md'); assert.ok(!fs.existsSync(ag('tester.md')));
// Projekt
assert.throws(() => core.agentenListe(info, 'OhneOrdner'), /Code-Ordner/);
core.agentSpeichern(info, 'MitOrdner', null, { name: 'doku-schreiber', description: 'd', model: null, tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write'], anweisungen: '' });
assert.ok(fs.existsSync(path.join(repo, '.claude', 'agents', 'doku-schreiber.md')));
// doppelter Schlüssel → nicht speicherbar
fs.writeFileSync(ag('kaputt.md'), '---\nname: k\nname: k2\ndescription: d\n---\n');
assert.throws(() => core.agentSpeichern(info, null, 'kaputt.md', leer('k')), /von Hand/);

// Fehler vor name: bleibt in der Liste sichtbar
fs.writeFileSync(ag('vorn.md'), '---\ndescription: d\ndescription: e\nname: x\n---\n');
const vorn = core.agentenListe(info).agenten.find((x) => x.datei === 'vorn.md');
assert.ok(vorn && vorn.fehler && vorn.name === 'vorn');
fs.unlinkSync(ag('vorn.md'));
// Name: Länge, Zeilenumbruch
assert.throws(() => core.agentSpeichern(info, null, null, leer('a'.repeat(65))), /Name/);
assert.throws(() => core.agentSpeichern(info, null, null, leer('ok\n')), /Name/);
core.agentSpeichern(info, null, null, leer('a'.repeat(64)));
// Einschleusen über model/tools
assert.throws(() => core.agentSpeichern(info, null, null, { ...leer('inj1'), model: 'opus\nhooks:\n  Stop: [x]' }), /Modell/);
assert.throws(() => core.agentSpeichern(info, null, null, { ...leer('inj2'), tools: ['Read\nhooks: x'] }), /Werkzeug/);
assert.throws(() => core.agentSpeichern(info, null, null, { ...leer('inj3'), tools: ['Read, Bash'] }), /Werkzeug/);
// Leere Werkzeugliste hieße „kein tools-Feld“ = alle Werkzeuge → abgelehnt, nichts geschrieben
assert.throws(() => core.agentSpeichern(info, null, null, { ...leer('leer-tools'), tools: [] }), /Mindestens ein Werkzeug/);
assert.ok(!fs.existsSync(path.join(core.agentenOrdner(info), 'leer-tools.md')));
assert.ok(!fs.existsSync(ag('inj1.md')) && !fs.existsSync(ag('inj2.md')) && !fs.existsSync(ag('inj3.md')));
core.agentSpeichern(info, null, null, { ...leer('ok-tools'), model: 'claude-opus-4.1', tools: ['Read', 'Bash(git:*)'] });

// .claude oder .claude/agents im Code-Ordner als Link nach außen
if (links) {
  for (const stufe of ['claude', 'agents']) {
    const r = path.join(basis, 'repo-' + stufe), aussen = path.join(basis, 'aussen-' + stufe);
    fs.mkdirSync(r); fs.mkdirSync(path.join(aussen, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(aussen, 'agents', 'x.md'), '---\nname: x\ndescription: d\n---\n');
    if (stufe === 'claude') fs.symlinkSync(aussen, path.join(r, '.claude'));
    else { fs.mkdirSync(path.join(r, '.claude')); fs.symlinkSync(path.join(aussen, 'agents'), path.join(r, '.claude', 'agents')); }
    const pn = 'Link-' + stufe;
    core.neu(info, pn, 'Test');
    core.speichern(info, Object.assign(core.laden(info, pn), { projekttyp: 'code', repo: r }));
    assert.throws(() => core.agentenListe(info, pn), /Link/);
    assert.throws(() => core.agentSpeichern(info, pn, null, leer('neu')), /Link/);
    assert.throws(() => core.agentLoeschen(info, pn, 'x.md'), /Link/);
    assert.deepStrictEqual(fs.readdirSync(path.join(aussen, 'agents')), ['x.md'], 'außerhalb unverändert');
  }
}

console.log('agenten: alle Prüfungen bestanden');
