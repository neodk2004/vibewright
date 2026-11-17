// Layout-Test ohne Claude-Aufruf: Bedarfsanalyse und Einstellungen bei 960×580 (DE/EN) dürfen nichts abschneiden
// oder über Kartenränder ragen (Issues #3, #4). Aufruf: node test/layout.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const core = require('../core');

// Meldet abgeschnittene Inhalte (overflow hidden/clip) und Elemente, die aus einem nicht scrollbaren Elternteil ragen
const MESSEN = `window.__messen = () => {
  const out = [];
  const name = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
  for (const e of document.querySelectorAll('#inhalt *')) {
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect(); if (!r.width) continue;
    if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' || e.matches('input, textarea')) continue; // gewollt gekürzt bzw. scrollt selbst
    const sy = e.scrollHeight - e.clientHeight, sx = e.scrollWidth - e.clientWidth;
    if ((sy > 2 && /hidden|clip/.test(cs.overflowY)) || (sx > 2 && /hidden|clip/.test(cs.overflowX))) out.push('ABGESCHNITTEN ' + name(e));
    const p = e.parentElement, pr = p.getBoundingClientRect(), ps = getComputedStyle(p);
    if (ps.overflowX === 'visible' && ps.overflowY === 'visible' && (r.right > pr.right + 2 || r.bottom > pr.bottom + 2) && e.innerText?.trim())
      out.push('RAGT-HERAUS ' + name(e) + ' aus ' + name(p));
  }
  console.log('MESSUNG ' + JSON.stringify([...new Set(out)]));
};`;

const lang = (n, t) => Array.from({ length: n }, (_, i) => `${t} ${i + 1}: ein etwas längerer Eintrag, der in kleinen Fenstern umbrechen muss`);
const analyse = {
  ziel: 'Ein Testprojekt, dessen Texte bewusst so lang sind, dass sie bei 960×580 nicht ohne Scrollen in die Karten passen.',
  machbarkeit: 'Gut machbar, die Inhalte dienen nur dem Layout-Test und werden nicht an Claude geschickt.', ampel: 'gruen',
  rahmen: Array.from({ length: 7 }, (_, i) => ({ punkt: `Punkt ${i + 1}`, wert: 'Wert mit etwas Text, der umbricht' })),
  muss: lang(7, 'Muss'), kann: lang(4, 'Kann'), nicht: lang(5, 'Nicht'),
  risiken: Array.from({ length: 5 }, (_, i) => ({ risiko: `Risiko ${i + 1}`, auswirkung: 'Auswirkung', massnahme: 'Maßnahme' })),
};
const ansichten = {
  analyse: `(async () => { const st = await api.laden('Layout-Test'); zeige({ ...st, offen: { typ: 'gate', schritt: 'analyse', analyse: ${JSON.stringify(analyse)} } }); })()`,
  einstellungen: 'einstellungen()',
};

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-layout-'));
const ablage = path.join(basis, 'ablage');
fs.mkdirSync(ablage);
core.neu(core.ablageInfo({ modus: 'lokal', ablage }), 'Layout-Test', 'Ein Projekt nur für den Layout-Test');
const electron = require('electron'); // liefert im Node-Prozess den Pfad zur Electron-Programmdatei
const fehler = [];
for (const sprache of ['de', 'en']) {
  const daten = path.join(basis, `daten-${sprache}`);
  fs.mkdirSync(daten);
  fs.writeFileSync(path.join(daten, 'einstellungen.json'), JSON.stringify({ modus: 'lokal', ablage, sprache }));
  for (const [ansicht, js] of Object.entries(ansichten)) {
    const env = { ...process.env, KPH_USERDATA: daten, KPH_GROESSE: '960x580', SCREENSHOT: path.join(basis, `${ansicht}-${sprache}.png`), SCREENSHOT_DELAY: '1500',
      // Einblend-Animationen abwarten (feste Zeit war unter Last zu knapp); endlose wie Spinner nicht mitzählen
      SCREENSHOT_JS: `${MESSEN}; (async () => { await ${js}; await new Promise((r) => setTimeout(r, 2500));
        const fertig = Promise.allSettled(document.getAnimations().filter((a) => a.effect.getTiming().iterations !== Infinity).map((a) => a.finished));
        await Promise.race([fertig, new Promise((r) => setTimeout(r, 8000))]); __messen(); })()` };
    const r = spawnSync(electron, ['.'], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 60000 });
    const zeile = (r.stdout || '').split('\n').find((z) => z.includes('MESSUNG '));
    assert.ok(zeile, `${ansicht}/${sprache}: keine Messung (Exit ${r.status}, ${r.error || ''})`);
    const befunde = JSON.parse(zeile.slice(zeile.indexOf('MESSUNG ') + 8).replace(/\s*\(.*\)\s*$/, ''));
    if (befunde.length) fehler.push(`${ansicht}/${sprache}: ${befunde.join(', ')}`);
    else console.log(`${ansicht}/${sprache}: ok`);
  }
}
fs.rmSync(basis, { recursive: true, force: true });
assert.deepStrictEqual(fehler, [], `Layout-Fehler:\n${fehler.join('\n')}`);
console.log('layout.js ok');
