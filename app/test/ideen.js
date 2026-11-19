// Prüft die Ideen-Lane (#22): Ideen ändern und löschen, ohne den Plan anzufassen – ohne Claude-Aufruf.
// Aufruf: node test/ideen.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const core = require('../core');

const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'ideen-'));
const info = core.ablageInfo({ modus: 'lokal', ablage });
const N = 'Ideen-Test';
const plan = { phasen: [{ titel: 'Bauen', checkliste: ['Schritt aus Idee A', 'Schritt B'], done: [true, false], status: 'aktiv' }] };
core.speichern(info, { ...core.neu(info, N, 'Ein Projekt nur für den Test'), plan,
  ideenWarten: ['wartet eins', 'wartet zwei'], ideeFehler: 'Limit',
  ideen: [{ text: 'Idee A', datum: '2026-11-19', phase: 1, schritte: ['Schritt aus Idee A'], kurz: 'A' }, { text: 'Idee B', datum: '2026-11-20', phase: 1, schritte: ['Schritt B'], kurz: 'B' }] });
const md = () => fs.readFileSync(path.join(ablage, N, `${N} – Ideen.md`), 'utf8');
const neuGeladen = () => core.laden(info, N); // wie nach einem Neustart: nur was auf der Platte steht

// Wartende Idee korrigieren und löschen
core.ideeAendern(info, N, true, 1, 'wartet zwei', '  wartet 2  ');
assert.deepStrictEqual(neuGeladen().ideenWarten, ['wartet eins', 'wartet 2']);
core.ideeAendern(info, N, true, 0, 'wartet eins', null);
assert.deepStrictEqual(neuGeladen().ideenWarten, ['wartet 2']);
assert.strictEqual(neuGeladen().ideeFehler, 'Limit', 'Fehler bleibt, solange noch etwas wartet');
core.ideeAendern(info, N, true, 0, 'wartet 2', null);
assert.deepStrictEqual(neuGeladen().ideenWarten, []);
assert.strictEqual(neuGeladen().ideeFehler, null);

// Eingearbeitete Idee korrigieren: Liste und Ideen.md ändern sich, der Plan nicht
core.ideeAendern(info, N, false, 0, 'Idee A', 'Idee A, korrigiert');
assert.strictEqual(neuGeladen().ideen[0].text, 'Idee A, korrigiert');
assert.ok(md().includes('„Idee A, korrigiert“') && md().includes('„Idee B“'));
// … und löschen
core.ideeAendern(info, N, false, 0, 'Idee A, korrigiert', null);
assert.deepStrictEqual(neuGeladen().ideen.map((x) => x.text), ['Idee B']);
assert.ok(!md().includes('Idee A') && md().includes('„Idee B“'));
assert.deepStrictEqual(neuGeladen().plan, plan, 'Schritte im Plan bleiben stehen');

// Falscher Eintrag (Liste hat sich inzwischen geändert), leerer Text, kaputte Angaben: nichts ändern
const vorher = JSON.stringify({ ...neuGeladen(), aktualisiert: 0 });
assert.throws(() => core.ideeAendern(info, N, false, 0, 'Idee A', null), /geändert/);
assert.throws(() => core.ideeAendern(info, N, false, 5, 'Idee B', null), /geändert/);
assert.throws(() => core.ideeAendern(info, N, false, '0', 'Idee B', null), /geändert/);
assert.throws(() => core.ideeAendern(info, N, true, 0, undefined, null), /geändert/);
assert.throws(() => core.ideeAendern(info, N, false, 0, 'Idee B', '   '), /eintippen/);
assert.throws(() => core.ideeAendern(info, N, false, 0, 'Idee B', 7), /eintippen/);
assert.strictEqual(JSON.stringify({ ...neuGeladen(), aktualisiert: 0 }), vorher);
console.log('ideen ok');
