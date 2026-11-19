// Prüft Modellwahl und Verbrauch je Modell aus Sitzungsdateien – ohne echten Claude-Aufruf.
// Aufruf: node test/verbrauch.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Eigenes Claude-Verzeichnis, damit echte Sitzungen nicht mitgezählt werden
process.env.CLAUDE_CONFIG_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'verbrauch-'));
const core = require('../core');

// Modellwahl: nur bekannte Aliase, sonst bleibt die alte Wahl
core.setModell('fable');
assert.strictEqual(core.modell(), 'fable');
core.setModell('opus; rm -rf');
assert.strictEqual(core.modell(), 'fable');

// Ordnername wie bei Claude Code: Sonderzeichen werden zu „-“
const projekt = path.join(os.tmpdir(), 'Mein_Projekt.v2');
const d = core.sitzungsOrdner(projekt);
assert.strictEqual(path.basename(d), path.resolve(projekt).replace(/[^a-zA-Z0-9]/g, '-'));
fs.mkdirSync(path.join(d, 'sitzung', 'subagents'), { recursive: true });

const antwort = (id, model, ein, aus) => JSON.stringify({ type: 'assistant', message: { id, model, usage: { input_tokens: ein, output_tokens: aus, cache_read_input_tokens: 10, cache_creation_input_tokens: 1 } } });
fs.writeFileSync(path.join(d, 'a.jsonl'), [
  antwort('m1', 'claude-opus-5-5', 5, 100),
  antwort('m1', 'claude-opus-5-5', 5, 100), // derselbe Inhaltsblock zweimal → nur einmal zählen
  antwort('m2', 'claude-sonnet-5-5', 3, 7),
  antwort('m3', '<synthetic>', 99, 99), // keine echte Antwort
  JSON.stringify({ type: 'user', message: { content: 'usage' } }),
  'kaputte Zeile "usage"',
].join('\n'));
fs.writeFileSync(path.join(d, 'sitzung', 'subagents', 'agent.jsonl'), antwort('m4', 'claude-haiku-5-5', 1, 2));

const v = core.sitzungsVerbrauch([projekt, projekt]); // doppelter Ordner zählt nur einmal
assert.deepStrictEqual(v, {
  'claude-opus-5-5': { inputTokens: 5, outputTokens: 100, cacheReadInputTokens: 10, cacheCreationInputTokens: 1 },
  'claude-sonnet-5-5': { inputTokens: 3, outputTokens: 7, cacheReadInputTokens: 10, cacheCreationInputTokens: 1 },
  'claude-haiku-5-5': { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 10, cacheCreationInputTokens: 1 },
});

// Datei wächst → neu einlesen statt alten Stand aus dem Zwischenspeicher
fs.appendFileSync(path.join(d, 'a.jsonl'), `\n${antwort('m5', 'claude-sonnet-5-5', 1, 1)}`);
assert.strictEqual(core.sitzungsVerbrauch([projekt])['claude-sonnet-5-5'].outputTokens, 8);

// Ordner ohne Sitzungen: leer statt Fehler
assert.deepStrictEqual(core.sitzungsVerbrauch([path.join(os.tmpdir(), 'gibt-es-nicht')]), {});

// Terminal-Sitzung startet mit dem gewählten Modell
assert.ok(fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8').includes("'--model', core.modell()"), 'Terminal ohne --model');
// Fable ohne Credits: eigene Meldung (nicht „Limit – später erneut“), und die englische Übersetzung greift
const quelle = (d) => fs.readFileSync(path.join(__dirname, '..', d), 'utf8');
const meldung = quelle('core.js').match(/`(Keine Usage Credits[^`]*)\(\$\{msg\}\)`/)[1] + '(x)';
const muster = eval(quelle('i18n.js').match(/\[(\/\^Keine Usage Credits.*\/), '/)[1]);
assert.ok(muster.test(meldung), 'EN-Übersetzung der Credits-Meldung passt nicht');
console.log('verbrauch ok');
