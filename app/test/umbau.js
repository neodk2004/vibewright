// Prüft #24: Phasen umsortieren und offene Schritte in die nächste Phase schieben – ohne Claude-Aufruf.
// Aufruf: node test/umbau.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const core = require('../core');

const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'umbau-'));
const info = core.ablageInfo({ modus: 'lokal', ablage });
const N = 'Umbau-Test';
const phase = (titel, checkliste, done) => ({ titel, ziel: 'z', fertig_wenn: 'f', bereich: 'b', aufwand: 'klein', checkliste, done });
core.speichern(info, { ...core.neu(info, N, 'Ein Projekt nur für den Test'), offen: { typ: 'fertig' },
  plan: { einzeiler: 'Test', phasen: [phase('Fertig', ['a'], [true]), phase('Läuft', ['b1', 'b2', 'b3'], [true, false, false]), phase('C', ['c'], [false]), phase('D', ['d'], [false])] },
  ideen: [{ text: 'Idee', datum: '2026-11-22', phase: 4, schritte: ['d'], kurz: 'k' }] });
const punkte = path.join(ablage, N, core.punkteOrdner(core.laden(info, N)));
core.aktualisieren(info, N); // schreibt die Punkt-Dateien
const titel = () => core.laden(info, N).plan.phasen.map((p) => p.titel);
const dateien = () => fs.readdirSync(punkte).filter((f) => f.startsWith('Phase ')).sort();

// Noch nicht begonnene Phasen tauschen: Dateien, Ideen und Plan.md ziehen mit
let st = core.phaseVerschieben(info, N, 3, -1);
assert.ok(!st.fehler, st.fehler);
assert.deepStrictEqual(titel(), ['Fertig', 'Läuft', 'D', 'C']);
assert.deepStrictEqual(dateien(), ['Phase 1 – Fertig.md', 'Phase 2 – Läuft.md', 'Phase 3 – D.md', 'Phase 4 – C.md']);
assert.strictEqual(core.laden(info, N).ideen[0].phase, 3);
assert.ok(fs.readFileSync(path.join(ablage, N, `${N} – Plan.md`), 'utf8').includes('| 3 | D |'));

// Laufende und erledigte Phasen bleiben, wo sie sind
assert.throws(() => core.phaseVerschieben(info, N, 2, -1), /noch nicht begonnen/);
assert.throws(() => core.phaseVerschieben(info, N, 1, 1), /noch nicht begonnen/);
assert.throws(() => core.phaseVerschieben(info, N, 3, 1), /noch nicht begonnen/); // es gibt keine Phase 5

// Offenen Schritt weiterschieben: landet vorne in der nächsten Phase, Häkchen bleiben
st = core.schrittWeiter(info, N, 1, 2);
const ph = core.laden(info, N).plan.phasen;
assert.deepStrictEqual([ph[1].checkliste, ph[1].done], [['b1', 'b2'], [true, false]]);
assert.deepStrictEqual([ph[2].checkliste, ph[2].done], [['b3', 'd'], [false, false]]);
assert.ok(fs.readFileSync(path.join(punkte, 'Phase 3 – D.md'), 'utf8').includes('- [ ] b3'));

// Erledigte Schritte, letzter Schritt einer Phase, letzte Phase: nicht erlaubt
assert.throws(() => core.schrittWeiter(info, N, 1, 0), /nicht weiterschieben/);
assert.throws(() => core.schrittWeiter(info, N, 3, 0), /nicht weiterschieben/);
assert.throws(() => core.schrittWeiter(info, N, 0, 0), /nicht weiterschieben/);

fs.rmSync(ablage, { recursive: true, force: true });
console.log('✅ umbau: Phasen verschieben und Schritte weiterschieben');
