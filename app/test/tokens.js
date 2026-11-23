// Misst echte Tokens pro Planungsaufruf: schlanker Vibewright-Aufruf gegen normales `claude -p`.
// Kostet zwei kurze Claude-Aufrufe, deshalb nicht in `npm test`. Aufruf: node test/tokens.js [modell]
const fs = require('fs');
const os = require('os');
const path = require('path');
const core = require('../core');

if (process.argv[2]) core.setModell(process.argv[2]);
const b = core.claudeBefehl();
if (!b) { console.error('Claude Code wurde nicht gefunden.'); process.exit(1); }
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-'));
const PROMPT = 'Antworte nur mit OK.';

async function messen(name, args) {
  const r = await core.run(b.datei, [...b.vorne, ...args], { input: PROMPT, cwd });
  let j;
  try { j = JSON.parse(r.out); } catch { throw new Error(`${name}: ${(r.err || r.out).slice(0, 300)}`); }
  const u = j.usage || {};
  const teile = { input: u.input_tokens || 0, cacheSchreiben: u.cache_creation_input_tokens || 0, cacheLesen: u.cache_read_input_tokens || 0 };
  return { name, ...teile, gesamt: teile.input + teile.cacheSchreiben + teile.cacheLesen };
}

(async () => {
  const schlank = await messen('Vibewright (Planung)', core.planArgs());
  const normal = await messen('claude -p (Standard)', ['-p', '--output-format', 'json', '--model', core.modell()]);
  console.table([schlank, normal]);
  console.log(`Faktor: ${(normal.gesamt / Math.max(schlank.gesamt, 1)).toFixed(1)}× weniger Eingabe-Kontext (Modell ${core.modell()})`);
  fs.rmSync(cwd, { recursive: true, force: true });
})().catch((e) => { console.error(e.message); process.exit(1); });
