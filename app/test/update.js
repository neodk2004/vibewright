// Prüft den Update-Check (#17): Fehlschlag wird nicht gemerkt, Erfolg nur eine Stunde – ohne Netz.
// Aufruf: node test/update.js
const assert = require('assert');
const core = require('../core');

(async () => {
  const antworten = [null, { tag: 'v9.9.9' }, { tag: 'v9.9.10' }]; // erst GitHub nicht erreichbar, dann erreichbar
  let aufrufe = 0;
  const release = core.updateMerker(async () => antworten[aufrufe++], 50);

  assert.strictEqual(await release(), null);
  assert.deepStrictEqual(await release(), { tag: 'v9.9.9' }, 'nach Fehlschlag muss sofort neu gefragt werden');
  assert.deepStrictEqual(await release(), { tag: 'v9.9.9' }, 'Erfolg wird gemerkt');
  assert.strictEqual(aufrufe, 2);

  const [a, b] = [release(), release()]; // gleichzeitige Aufrufe teilen sich eine Anfrage
  assert.strictEqual(a, b);

  await new Promise((r) => setTimeout(r, 60));
  assert.deepStrictEqual(await release(), { tag: 'v9.9.10' }, 'nach Ablauf der Zeit neu fragen');
  assert.strictEqual(aufrufe, 3);
  console.log('update ok');
})().catch((e) => { console.error(e); process.exit(1); });
