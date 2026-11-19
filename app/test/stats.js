// Prüft die Auswertung von Claude Codes stats-cache.json (#19) – ohne echte Daten.
// Aufruf: node test/stats.js
const assert = require('assert');
const core = require('../core');

const tag = (date, tokens, sessionCount = 1) => ({ a: { date, messageCount: 1, sessionCount, toolCallCount: 0 }, t: { date, tokensByModel: tokens } });
const tage = [
  tag('2026-11-01', { 'claude-opus-5-5': 100 }),
  tag('2026-11-02', { 'claude-opus-5-5': 300, 'claude-sonnet-5': 100 }, 2), // aktivster Tag
  tag('2026-11-03', { 'claude-opus-5-5': 50 }),
  // Lücke am 4.11.
  tag('2026-11-05', { 'claude-sonnet-5': 10 }),
  tag('2026-11-06', { 'claude-sonnet-5': 20 }),
];
const cache = {
  version: 5, lastComputedDate: '2026-11-06', firstSessionDate: '2026-11-01T08:00:00.000Z', totalSessions: 6,
  dailyActivity: tage.map((x) => x.a), dailyModelTokens: tage.map((x) => x.t),
  modelUsage: { 'claude-opus-5-5': { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 4 } },
  longestSession: { duration: 90 * 60 * 1000 },
};

// Gesamt
const g = core.statsAuswerten(cache, null, '2026-11-07');
assert.strictEqual(g.gesamt, 580);
assert.deepStrictEqual(g.modelle.map((m) => m.m), ['claude-opus-5-5', 'claude-sonnet-5']);
assert.strictEqual(g.modelle[0].anteil, 450 / 580);
assert.deepStrictEqual(g.modelle[0].teile, cache.modelUsage['claude-opus-5-5'], 'Aufteilung nur bei Gesamt');
assert.strictEqual(g.sitzungen, 6);
assert.strictEqual(g.aktiveTage, 5);
assert.strictEqual(g.tageGesamt, 6, '1.–6.11. sind 6 Tage');
assert.strictEqual(g.aktivsterTag, '2026-11-02');
assert.strictEqual(g.laengsteSerie, 3, '1.–3.11.');
assert.strictEqual(g.aktuelleSerie, 2, '5.–6.11., endet am Stand');
assert.strictEqual(g.laengsteSitzung, 90 * 60 * 1000);
assert.strictEqual(g.tageTokens['2026-11-02'], 400);

// Letzte 7 Tage ab 7.11. = 1.–7.11., letzte 3 Tage = 5.–7.11.
const d3 = core.statsAuswerten(cache, 3, '2026-11-07');
assert.strictEqual(d3.gesamt, 30);
assert.deepStrictEqual(d3.modelle.map((m) => m.m), ['claude-sonnet-5']);
assert.strictEqual(d3.modelle[0].teile, undefined, 'keine Aufteilung für Zeiträume');
assert.strictEqual(d3.aktiveTage, 2);
assert.strictEqual(d3.laengsteSitzung, null);
assert.strictEqual(Object.keys(d3.tageTokens).length, 5, 'Kachelgrafik zeigt immer alle Tage');

// Serie abgerissen: letzter aktiver Tag liegt vor dem Stand
assert.strictEqual(core.statsAuswerten({ ...cache, lastComputedDate: '2026-11-08' }, null, '2026-11-09').aktuelleSerie, 0);

// Text statt Zahlen in der Datei darf nicht als HTML in der Oberfläche landen
const boese = core.statsAuswerten({ ...cache, dailyActivity: [{ date: '2026-11-01', sessionCount: '<img src=x>' }], dailyModelTokens: [{ date: '2026-11-01', tokensByModel: { x: '<b>' } }] }, null, '2026-11-02');
assert.strictEqual(boese.sitzungen, 0);
assert.strictEqual(boese.gesamt, 0);

// Unbekanntes Format: lieber nichts als Falsches
assert.deepStrictEqual(core.statsAuswerten({ ...cache, version: 6 }, null), { fehler: 'format' });
assert.deepStrictEqual(core.statsAuswerten(null, null), { fehler: 'format' });
console.log('stats ok');
