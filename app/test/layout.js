// Layout-Test ohne Claude-Aufruf: alle Ansichten bei 960×580 (DE/EN) dürfen nichts abschneiden oder über Kartenränder
// ragen (Issues #3, #4, #14) – auch nicht bei langen Wörtern und URLs ohne Leerzeichen. Aufruf: node test/layout.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const core = require('../core');

// Meldet abgeschnittene Inhalte (overflow hidden/clip) und Elemente, die aus einem nicht scrollbaren Elternteil ragen.
// Gemessen wird das fertige Layout: Animationen, Übergänge und Hover sind dabei aus – sonst zählen je nach Zeitpunkt
// der endlose Glanz im Fortschrittsbalken oder eine vom Mauszeiger angehobene Karte als „abgeschnitten“.
const MESSEN = `window.__messen = (ansicht) => {
  const still = document.head.appendChild(document.createElement('style'));
  still.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}html{pointer-events:none!important}';
  void document.body.offsetHeight; // Layout sofort neu berechnen – requestAnimationFrame pausiert bei verdecktem Fenster
  const out = [];
  const name = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
  for (const e of document.querySelectorAll('#main *, #overlay *')) {
    if (e.closest('.term')) continue; // xterm misst selbst
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect(); if (!r.width) continue;
    if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' || e.matches('input, textarea')) continue; // gewollt gekürzt bzw. scrollt selbst
    const sy = e.scrollHeight - e.clientHeight, sx = e.scrollWidth - e.clientWidth;
    if ((sy > 2 && /hidden|clip/.test(cs.overflowY)) || (sx > 2 && /hidden|clip/.test(cs.overflowX))) out.push('ABGESCHNITTEN ' + name(e));
    if (sx > 2 && /auto|scroll/.test(cs.overflowX)) out.push('QUER-SCROLL ' + name(e)); // Text muss umbrechen, nicht seitlich scrollen
    const eigen = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (eigen.length > 12 && r.width < 2.5 * parseFloat(cs.fontSize)) out.push('ZU-SCHMAL ' + name(e)); // Text auf wenige Buchstaben pro Zeile gequetscht
    const p = e.parentElement, pr = p.getBoundingClientRect(), ps = getComputedStyle(p);
    if (ps.overflowX === 'visible' && ps.overflowY === 'visible' && (r.right > pr.right + 2 || r.bottom > pr.bottom + 2) && e.innerText?.trim())
      out.push('RAGT-HERAUS ' + name(e) + ' aus ' + name(p));
  }
  // Normale Wörter (bis 15 Zeichen) dürfen nicht über zwei Zeilen zerteilt werden – nur überlange Wörter und URLs
  for (const wurzel of document.querySelectorAll('#main, #overlay')) {
    const tw = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
    for (let t; (t = tw.nextNode());) {
      const el = t.parentElement;
      const cs = getComputedStyle(el);
      if (el.closest('.term') || !el.getClientRects().length || cs.hyphens === 'auto' || cs.wordBreak === 'break-all') continue; // gewollt getrennt
      for (const m of t.textContent.matchAll(/[^\\s\\/·–-]+/g)) {
        if (m[0].length > 15) continue; // überlange Wörter und URLs dürfen umbrechen
        const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length);
        if (new Set([...rg.getClientRects()].filter((q) => q.width).map((q) => Math.round(q.top))).size > 1) out.push('WORT-GETRENNT ' + name(el) + ' „' + m[0] + '“');
      }
    }
  }
  still.remove();
  console.log('MESSUNG ' + ansicht + ' ' + JSON.stringify([...new Set(out)]));
};`;

// Lange Wörter und URLs ohne Leerzeichen, wie Claude sie liefern kann (#14)
const W = 'Donaudampfschifffahrtsgesellschaftskapitänsmützenherstellerverband';
const U = `https://example.com/${'langerpfadohneleerzeichen'.repeat(3)}`;
const L = `Ein Eintrag mit ${W} und ${U} darin`;
const lang = (n, t) => Array.from({ length: n }, (_, i) => i === 1 ? `${t} ${i + 1}: ${L}` : `${t} ${i + 1}: ein etwas längerer Eintrag, der in kleinen Fenstern umbrechen muss`);
const analyse = {
  ziel: `Ein Testprojekt, dessen Texte bewusst so lang sind, dass sie bei 960×580 nicht ohne Scrollen in die Karten passen. ${W}`,
  machbarkeit: `Gut machbar, die Inhalte dienen nur dem Layout-Test. ${U}`, ampel: 'gruen',
  rahmen: Array.from({ length: 7 }, (_, i) => ({ punkt: i === 4 ? W : `Punkt ${i + 1}`, wert: i === 2 ? U : 'Wert mit etwas Text, der umbricht' })),
  muss: lang(7, 'Muss'), kann: lang(4, 'Kann'), nicht: lang(5, 'Nicht'),
  risiken: Array.from({ length: 5 }, (_, i) => ({ risiko: i === 1 ? W : `Risiko ${i + 1}`, auswirkung: i === 1 ? U : 'Auswirkung', massnahme: 'Maßnahme' })),
};
const phase = (i) => ({ titel: i === 1 ? W : `Phase ${i + 1}`, bereich: i === 1 ? W : 'Software', aufwand: 'mittel', ziel: L, fertig_wenn: L,
  checkliste: lang(5, 'Schritt'), done: [true, false, false, false, false], status: i ? 'offen' : 'aktiv' });
const plan = { phasen: [0, 1, 2].map(phase) };
const stand = { aktiv: 0, fortschritt: 7, naechster: L, erledigt: 1, gesamt: 15 };
const wz = (i, art) => ({ art, phase: 1, bedarf: i === 1 ? W : `Bedarf ${i + 1}`, status: i ? 'fehlt' : 'vorhanden', aktion: 'installieren', empfehlung: L, quelle: U });
// Projektzustand ohne Claude: geladenes Testprojekt plus erfundene Inhalte
const mit = (extra, dann) => `(async () => { const st = { ...(await api.laden('Layout-Test')), plan: ${JSON.stringify(plan)}, stand: ${JSON.stringify(stand)}, letzteIdee: ${JSON.stringify(L)}, ...${extra} }; ${dann} })()`;
const IDEEN = `{ offen: { dashboard: 'x' }, ideenWarten: [${JSON.stringify(L)}, ${JSON.stringify(W)}],
  ideen: ${JSON.stringify([L, U, 'Kurz', W].map((text, i) => ({ text, datum: '2026-11-19', phase: i + 1, schritte: ['Schritt'], kurz: 'Kurz' })))} }`;
const ansichten = {
  fragen: mit(`{ runden: [{}], offen: { typ: 'fragen', fragen: [{ frage: ${JSON.stringify(L)}, mehrfach: true, optionen: [${JSON.stringify(W)}, ${JSON.stringify(U)}, 'Kurz'] }] } }`, 'zeige(st);'),
  analyse: mit(`{ offen: { typ: 'gate', schritt: 'analyse', analyse: ${JSON.stringify(analyse)} } }`, 'zeige(st);'),
  plan: mit(`{ offen: { typ: 'gate', schritt: 'plan' } }`, 'zeige(st);'),
  phasendetail: mit(`{ offen: { typ: 'gate', schritt: 'plan' } }`, 'zeige(st); phaseDetail(st, st.plan.phasen[1], 1);'),
  werkzeug: mit(`{ einordnung: { begruendung: ${JSON.stringify(L)}, uebersprungen: ['analyse'] }, offen: { typ: 'werkzeug', korrekturen: [${JSON.stringify(L)}],
    eintraege: ${JSON.stringify([0, 1, 2].flatMap((i) => [wz(i, 'system'), wz(i, 'claude')]))} } }`, 'zeige(st);'),
  cockpit: mit(`{ offen: { dashboard: 'x' } }`, 'cockpit(st);'),
  pflege: mit(`{ offen: { dashboard: 'x' }, projekttyp: 'code', stand: { ...${JSON.stringify(stand)}, aktiv: -1 }, pflegeRepo: ${JSON.stringify('beispiel/' + W)},
    issuesNeu: [{ nr: 1, art: 'fehler', titel: ${JSON.stringify(L)}, von: ${JSON.stringify(W)} }] }`, 'pflegeGeprueft.set(st.name, Date.now()); cockpit(st);'),
  // Ideen-Liste aus der Pflege-Kachel öffnen (Knopf in der Titelzeile)
  'pflege-ideen': mit(`{ ...${IDEEN}, offen: { dashboard: 'x' }, projekttyp: 'code', stand: { ...${JSON.stringify(stand)}, aktiv: -1 }, pflegeRepo: ${JSON.stringify('beispiel/' + W)},
    issuesNeu: [{ nr: 1, art: 'fehler', titel: ${JSON.stringify(L)}, von: ${JSON.stringify(W)} }] }`, 'pflegeGeprueft.set(st.name, Date.now()); cockpit(st); document.getElementById("ideen-auf").click();'),
  arbeit: mit(`{ offen: { dashboard: 'x' } }`, 'arbeit(st);'),
  einstellungen: 'einstellungen()',
  'einstellungen-ablage': "(async () => { await einstellungen(); document.querySelector('.einst-nav [data-teil=ablage]').click(); })()",
  'einstellungen-git': "(async () => { await einstellungen(); document.querySelector('.einst-nav [data-teil=git]').click(); })()",
  verbrauch: "(statsTab = 'ueberblick', statsTage = null, verbrauchZeigen())", // Statistik + Tabellen (#16, #19)
  'verbrauch-modelle': "(statsTab = 'modelle', statsTage = 7, verbrauchZeigen())",
  // Ideen-Lane (#22): Liste, Zeile im Bearbeiten, Rückfrage vor dem Löschen
  ideen: mit(IDEEN, 'ideenZeigen(st, cockpit);'),
  'ideen-bearbeiten': mit(IDEEN, "ideenZeigen(st, cockpit); document.querySelector('.idee-zeile [data-akt=aendern]').click();"),
  'ideen-loeschen': mit(IDEEN, "ideenZeigen(st, cockpit); document.querySelectorAll('.idee-zeile [data-akt=loeschen]')[2].click();"),
};

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-layout-'));
const ablage = path.join(basis, 'ablage');
fs.mkdirSync(ablage);
core.neu(core.ablageInfo({ modus: 'lokal', ablage }), 'Layout-Test', 'Ein Projekt nur für den Layout-Test');
const electron = require('electron'); // liefert im Node-Prozess den Pfad zur Electron-Programmdatei
const fehler = [];
// Je Sprache nur ein App-Start, der alle Ansichten nacheinander misst (statt eines Starts pro Ansicht)
const schritte = Object.entries(ansichten).map(([n, js]) => `[${JSON.stringify(n)}, async () => { await ${js}; }]`).join(',\n');
for (const sprache of ['de', 'en']) {
  const daten = path.join(basis, `daten-${sprache}`);
  fs.mkdirSync(daten);
  fs.writeFileSync(path.join(daten, 'einstellungen.json'), JSON.stringify({ modus: 'lokal', ablage, sprache }));
  // EN lädt beim ersten Start einmal neu (Sprache steht in localStorage): erst messen, wenn die Seite in der richtigen Sprache ist;
  // __lauf sorgt dafür, dass der doppelt ausgelöste Aufruf denselben Lauf abwartet statt einen zweiten zu starten
  const env = { ...process.env, KPH_USERDATA: daten, KPH_GROESSE: '960x580', SCREENSHOT: path.join(basis, `${sprache}.png`), SCREENSHOT_DELAY: '1500',
    SCREENSHOT_JS: `${MESSEN}; window.__lauf ??= (async () => {
      while (document.documentElement.lang !== '${sprache}') await new Promise((r) => setTimeout(r, 200));
      for (const [ansicht, zeigen] of [${schritte}]) { await zeigen(); await new Promise((r) => setTimeout(r, 1500)); await __messen(ansicht); }
    })()` };
  const r = spawnSync(electron, ['.'], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 180000 });
  const ergebnis = new Map();
  for (const z of (r.stdout || '').split('\n')) {
    const m = /MESSUNG (\S+) (\[.*\])/.exec(z.replace(/\s*\([^()]*\)\s*$/, ''));
    if (m) ergebnis.set(m[1], JSON.parse(m[2]));
  }
  for (const ansicht of Object.keys(ansichten)) {
    const befunde = ergebnis.get(ansicht);
    assert.ok(befunde, `${ansicht}/${sprache}: keine Messung (Exit ${r.status}, ${r.error || ''})\n${(r.stdout || '').split('\n').filter((z) => z.includes('[ui]')).slice(-4).join('\n')}`);
    if (befunde.length) fehler.push(`${ansicht}/${sprache}: ${befunde.join(', ')}`);
    else console.log(`${ansicht}/${sprache}: ok`);
  }
}
fs.rmSync(basis, { recursive: true, force: true });
assert.deepStrictEqual(fehler, [], `Layout-Fehler:\n${fehler.join('\n')}`);
console.log('layout.js ok');
