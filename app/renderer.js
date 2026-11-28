const MAC = api.plattform === 'darwin';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kopf = $('#kopf'), inhalt = $('#inhalt'), aktionen = $('#aktionen');

let aktuell = null; // geöffnetes Projekt (Zustand aus core.js)
let tasten = null;  // Tastatur-Handler der aktuellen Ansicht

document.addEventListener('keydown', (e) => tasten && !e.target.matches('input,textarea') && tasten(e));
// Zurück ins Fenster → Häkchen einlesen (in der Terminal-Ansicht nur die rechte Spalte, sonst das Cockpit)
window.addEventListener('focus', async () => {
  if (aktuell?.offen?.typ !== 'fertig') return;
  if (!$('#arbeit-seite')) return cockpitNeu();
  const st = await api.aktualisieren(aktuell.name);
  if (!st.fehler) { aktuell = st; arbeitSeite(st); }
});
$('#neu').onclick = () => neuesProjekt();

// ---------- Rahmen ----------
const SCHRITTE = ['Interview', 'Bedarfsanalyse', 'Plan', 'Werkzeuge', 'Umsetzung'];
function schrittNr(st) {
  const o = st.offen;
  if (!o || o.typ === 'fragen') return 0;
  if (o.typ === 'gate') return o.schritt === 'analyse' ? 1 : 2;
  return o.typ === 'werkzeug' ? 3 : 4;
}

function setKopf(st) {
  if (!st) return (kopf.innerHTML = '');
  const n = schrittNr(st);
  kopf.innerHTML = `<div class="kopf-zeile"><h1>${esc(st.name)}</h1><span class="kopf-akt">
    <button class="btn ghost" id="k-archiv" title="Alles als ZIP-Datei aufheben">Archivieren</button><button class="btn ghost" id="k-loeschen">Löschen</button></span></div><div class="idee">${esc(st.plan?.einzeiler || st.idee)}</div>
    <div class="steps">${SCHRITTE.map((s, i) => `${i ? '<span class="ln"></span>' : ''}<span class="st ${i < n ? 'done' : i === n ? 'now' : ''}"><i>${i < n ? '✓' : i + 1}</i>${s}</span>`).join('')}
    ${n === 4 && laeuft.has(st.name) ? '<span class="kopf-orb" id="kopf-orb"><span class="mini-orb"><i></i><i></i><i></i></span><span class="was"></span></span>' : ''}</div>`;
  $('#k-archiv').onclick = () => archivieren(st);
  $('#k-loeschen').onclick = () => loeschenFragen(st);
  orbAktualisieren();
}

// Orb neben „Umsetzung“: kreist, solange im Terminal Ausgaben fließen (Claude arbeitet), ruht, wenn Claude auf dich wartet
const laeuft = new Set(); // Projekte, in denen gerade eine Claude-Sitzung läuft
const letzteAusgabe = new Map(); // name → Zeitpunkt der letzten Terminal-Ausgabe
function orbAktualisieren() {
  const o = $('#kopf-orb');
  if (!o) return;
  const aktiv = Date.now() - (letzteAusgabe.get(aktuell?.name) || 0) < 1500;
  o.classList.toggle('aktiv', aktiv);
  o.querySelector('.was').textContent = aktiv ? 'Claude arbeitet …' : 'wartet auf dich';
}
setInterval(orbAktualisieren, 400);

// Fußleiste: links Nebenaktionen, rechts die Hauptaktion. Elemente: {text, primary, ghost, klick, id} oder {input, platzhalter} oder 'sp'
function setAktionen(liste = [], ziel = aktionen) {
  ziel.innerHTML = liste.map((a, i) => a === 'sp' ? '<span class="sp"></span>'
    : a.info ? `<span class="muted" style="font-size:12.5px">${esc(a.info)}</span>`
    : a.input ? `<input type="text" id="${a.input}" placeholder="${esc(a.platzhalter)}">`
    : `<button class="btn ${a.primary ? 'primary' : ''} ${a.ghost ? 'ghost' : ''} ${a.gefahr ? 'gefahr' : ''}" data-i="${i}" ${a.id ? `id="${a.id}"` : ''}>${esc(a.text)}</button>`).join('');
  $$('button', ziel).forEach((b) => (b.onclick = liste[b.dataset.i].klick));
}

// Einblend-Animation nur bei echtem Ansichtswechsel – nicht bei jedem Neuzeichnen durch neue Häkchen
let ansichtSchluessel = '';
function ansicht(st, html, akt, anim) {
  tasten = null;
  setKopf(st);
  inhalt.innerHTML = html;
  const schluessel = `${st?.name || ''}|${st?.offen?.typ || ''}|${st?.offen?.schritt || ''}|${(html.match(/class="([\w-]+)/) || [])[1]}`;
  if (anim ?? schluessel !== ansichtSchluessel) {
    $$('.karte, .phase, .opt, .wz, .zeit button, .todo label, .tabs, .next, .fort, .box > *', inhalt).forEach((el, n) => el.style.setProperty('--n', Math.min(n, 14)));
    inhalt.classList.remove('rein');
    void inhalt.offsetWidth; // Animation neu starten
    inhalt.classList.add('rein');
  }
  ansichtSchluessel = schluessel;
  // Fortschrittsbalken gleiten vom alten zum neuen Wert
  requestAnimationFrame(() => $$('.bar i[data-ziel]').forEach((i) => (i.style.width = `${i.dataset.ziel}%`)));
  // Zentrierte Dialoge: Knöpfe direkt unter den Inhalt (nicht in die Fußleiste)
  const box = $('.mitte .box', inhalt);
  if (box && akt?.length) {
    box.insertAdjacentHTML('beforeend', '<div class="box-akt"></div>');
    setAktionen(akt, $('.box-akt', box));
    setAktionen([]);
  } else setAktionen(akt);
}

// Feste Erkennungsfarbe je Projekt (aus dem Namen berechnet, bleibt immer gleich)
const FARBEN = ['#e0a84a', '#56c27a', '#4fb8c9', '#6f8ff0', '#e07fa8', '#b58cff', '#d98a5b', '#9cc25a'];
const projektFarbe = (name) => FARBEN[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % FARBEN.length];

async function seitenleiste() {
  const liste = await api.projekte();
  if (liste.fehler) {
    // Ablage ist während der Arbeit verschwunden: sichtbar machen, Klick führt zur Erklärung
    $('#liste').innerHTML = '<button class="karte-p" id="liste-fehler" style="--pf:var(--bad)"><span class="n">⚠ Ablage nicht gefunden</span><span class="s">Klicken für Details</span></button>';
    $('#liste-fehler').onclick = start;
    return;
  }
  $('#liste').innerHTML = liste.length ? liste.map((p) => {
    const s = laeuft.has(p.name) ? '<span class="live">●</span> Claude arbeitet'
      : p.offen?.typ === 'fertig' ? ((p.stand?.aktiv ?? 0) < 0 ? 'Fertig · Pflege' : `${p.stand?.fortschritt ?? 0} % · Phase ${(p.stand?.aktiv ?? 0) + 1}`) : SCHRITTE[schrittNr(p)];
    const f = p.offen?.typ === 'fertig' ? `<span class="mini"><i style="width:${p.stand?.fortschritt ?? 0}%"></i></span>` : '';
    return `<button data-name="${esc(p.name)}" class="karte-p ${aktuell?.name === p.name ? 'aktiv' : ''}" style="--pf:${projektFarbe(p.name)}"><span class="n">${esc(p.name)}</span><span class="s">${p.fehler ? 'unterbrochen' : s}</span>${f}</button>`;
  }).join('') : '<span class="muted" style="padding:6px">Noch keine Projekte.</span>';
  $$('#liste button').forEach((b) => (b.onclick = async () => zeige(await api.laden(b.dataset.name))));
}

// „Claude arbeitet“: Arbeits-Orb, Teilschritte, die sich nacheinander abhaken, und ein Balken, der bis kurz vor Ende gleitet.
// Der letzte Teilschritt bleibt aktiv, bis die echte Antwort da ist – fertig wird nur angezeigt, was fertig ist.
const ARBEIT = {
  start: ['Claude Code suchen', 'Anmeldung prüfen', 'Projekte laden'],
  fragen: ['Idee lesen', 'Zielgruppe überlegen', 'Lücken suchen', 'Fragen formulieren'],
  analyse: ['Antworten auswerten', 'Muss und Kann trennen', 'Risiken abwägen', 'Machbarkeit einschätzen'],
  plan: ['Ziel in Phasen schneiden', 'Schritte ordnen', 'Aufwand schätzen', 'Laufkarte zeichnen'],
  werkzeug: ['Rechner untersuchen', 'Plugins abgleichen', 'Offizielle Quellen suchen', 'Links und Skills prüfen', 'Empfehlungen schreiben'],
  schreiben: ['Punkte anlegen', 'Dashboard bauen', 'Fortschritt einrichten'],
  archiv: ['Dateien sammeln', 'ZIP-Datei packen', 'Aufräumen'],
  standard: ['Nachdenken', 'Ordnen', 'Formulieren'],
};
function arbeitFuer(text) {
  if (/archiviert/.test(text)) return [ARBEIT.archiv, 2];
  if (/Prüfe/.test(text)) return [ARBEIT.start, 4];
  if (/Fragen|fehlt/.test(text)) return [ARBEIT.fragen, 12];
  if (/Bedarfsanalyse/.test(text)) return [ARBEIT.analyse, 18];
  if (/Plan/.test(text)) return [ARBEIT.plan, 18];
  if (/Werkzeug/.test(text)) return [ARBEIT.werkzeug, 45];
  if (/Dateien/.test(text)) return [ARBEIT.schreiben, 3];
  return [ARBEIT.standard, 15];
}
function laden(st, text) {
  const t0 = Date.now();
  const [teile, sek] = arbeitFuer(text);
  ansicht(st, `<div class="mitte"><div class="box sim">
    <div class="orb"><i></i><i></i><i></i></div>
    <div class="sim-titel">${esc(text)}</div>
    <ul class="sim-liste">${teile.map((t) => `<li><span class="h"></span>${esc(t)}</li>`).join('')}</ul>
    <div class="bar sim-bar"><i style="transition-duration:${sek * 1.6}s"></i></div>
    <div class="muted num" id="sek">0 s</div></div></div>`, [], true);
  $('.kopf-akt')?.remove(); // während Claude arbeitet nicht archivieren/löschen
  const li = $$('.sim-liste li');
  li[0]?.classList.add('jetzt');
  requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('.sim-bar i'); if (b) b.style.width = '92%'; }));
  let k = 0;
  const iv = setInterval(() => {
    const el = $('#sek');
    if (!el) return clearInterval(iv);
    const s = (Date.now() - t0) / 1000;
    el.textContent = `${Math.round(s)} s`;
    const soll = Math.min(Math.floor((s / sek) * teile.length), teile.length - 1);
    while (k < soll) { li[k].classList.replace('jetzt', 'fertig'); li[++k].classList.add('jetzt'); }
  }, 250);
}

// Konfetti, wenn eine ganze Phase erledigt ist
function konfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let n = 0; n < 60; n++) {
    const k = document.createElement('i');
    k.className = 'konfetti';
    k.style.cssText = `left:${50 + (Math.random() - 0.5) * 30}%;background:${FARBEN[n % FARBEN.length]};--x:${(Math.random() - 0.5) * 700}px;--y:${300 + Math.random() * 400}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * 120}ms`;
    document.body.appendChild(k);
    setTimeout(() => k.remove(), 1800);
  }
}
// Merkt sich je Projekt Fortschritt und aktive Phase, um Balken gleiten zu lassen und Phasen-Abschlüsse zu feiern
const verlauf = {};
function fortschrittMerken(st) {
  const v = verlauf[st.name] || {};
  const s = st.stand || {};
  if (v.aktiv !== undefined && (s.aktiv > v.aktiv || (s.aktiv === -1 && v.aktiv >= 0))) setTimeout(konfetti, 250);
  const alt = v.fort ?? s.fortschritt ?? 0;
  verlauf[st.name] = { aktiv: s.aktiv, fort: s.fortschritt };
  return alt;
}
let frisch = ''; // gerade abgehakter Schritt "phase:index" → Plopp-Animation

// ---------- Start & Einrichtung ----------
let settings = {};
async function start() {
  laden(null, 'Prüfe Claude Code …');
  const r = await api.start();
  if (r.fehler) return ansicht(null, `<div class="mitte"><div class="box"><div class="fehler">${esc(r.fehler)}</div></div></div>`, []);
  const { checks, vaults } = r;
  settings = r.settings;
  // Gespeicherte Sprache weicht ab (z. B. erster Start nach Umschalten auf anderem Weg) → einmal neu laden
  if ((settings.sprache || 'de') !== uiSprache) { spracheSetzen(settings.sprache || 'de'); return location.reload(); }
  $('#meta').innerHTML = `<div id="limits"></div>${checks.claude ? `Claude Code ${esc(checks.version.split(' ')[0])} · ${esc(checks.abo || '–')}<br>` : ''}
    <label class="modellwahl" title="Gilt für die Planung und neue Terminal-Sitzungen">Modell <select id="modell-wahl">${MODELLE.map(([m, n]) => `<option value="${m}" ${(settings.modell || 'sonnet') === m ? 'selected' : ''}>${n}${m === 'fable' ? ' (Credits)' : ''}</option>`).join('')}</select></label> · <button id="verbrauch-link">Verbrauch</button><br>
    ${settings.ablage ? `${settings.modus === 'obsidian' ? 'Obsidian' : 'Lokal'} · ` : ''}<button id="einst-link">⚙ Einstellungen</button>
    <span class="sprachwahl"><button data-s="de" title="Deutsch" class="${uiSprache === 'de' ? 'on' : ''}">${FLAGGEN.de}</button><button data-s="en" title="English" class="${uiSprache === 'en' ? 'on' : ''}">${FLAGGEN.en}</button></span>`;
  $('#einst-link').onclick = einstellungen;
  $('#verbrauch-link').onclick = verbrauchZeigen;
  $('#modell-wahl').onchange = (ev) => modellSetzen(ev.target.value);
  limitsZeigen();
  updateZeigen();
  $$('.sprachwahl button').forEach((b) => (b.onclick = () => spracheWechseln(b.dataset.s)));
  if (!checks.claude || !checks.loggedIn) {
    return ansicht(null, `<div class="mitte"><div class="box"><h2>Willkommen bei Vibewright</h2>
      <p class="muted">Vibewright arbeitet mit <b>Claude Code</b> im Hintergrund. Dafür brauchst du ein Claude-Abo (Pro oder Max) und Claude Code auf diesem Rechner.</p>
      <div class="check"><span class="dot ${checks.claude ? 'ok' : 'bad'}"></span>${checks.claude ? `Claude Code installiert (${esc(checks.version)})` : 'Claude Code ist noch nicht installiert'}</div>
      ${checks.claude ? `<div class="check"><span class="dot ${checks.loggedIn ? 'ok' : 'bad'}"></span>${checks.loggedIn ? 'Angemeldet' : 'Noch nicht angemeldet'}</div>` : ''}
      ${!checks.claude ? '<p class="klein">So geht die Installation: <a href="#" data-url="https://docs.claude.com/en/docs/claude-code/setup">offizielle Anleitung</a>. Danach Vibewright neu starten.</p>' : ''}
      ${checks.claude && !checks.loggedIn ? '<p class="klein muted">„Anmelden“ öffnet ein Fenster und deinen Browser. Nach der Anmeldung hier auf „Erneut prüfen“.</p>' : ''}
      </div></div>`, [checks.claude ? { text: 'Anmelden', klick: () => api['claude-anmelden']() } : 'sp', 'sp', { text: 'Erneut prüfen', primary: true, klick: start }]);
  }
  if (!settings.ablage) return ablageWaehlen(vaults);
  if (r.ablageFehlt) return ablageFehlt(vaults);
  const prog = await api.programmordner(settings.ablage);
  if (prog && settings.programmordnerOk !== settings.ablage) return programmordnerWarnung(prog, vaults);
  await seitenleiste();
  aktuell ? zeige(await api.laden(aktuell.name)) : neuesProjekt();
}

// Abo-Limits unten links: je ein Ring für das 5-Stunden-Fenster und die Woche, Details im Tooltip.
// Ohne Abo-Anmeldung (API-Key) oder ohne Netz bleibt die Zeile leer.
async function limitsZeigen() {
  const l = await api.limits();
  const el = $('#limits');
  if (!el) return;
  if (!l || l.fehler) return (el.innerHTML = '');
  const en = uiSprache === 'en';
  const zeit = (iso) => new Date(iso).toLocaleString(uiSprache, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const teil = (t, name) => {
    if (!t) return '';
    const farbe = t.prozent >= 90 ? 'var(--bad)' : t.prozent >= 70 ? 'var(--warn)' : 'var(--accent)';
    const tipp = `Claude-Limit ${name}: ${t.prozent} % ${en ? 'used' : 'verbraucht'}${t.reset ? ` · ${en ? 'resets' : 'wieder frei'} ${zeit(t.reset)}` : ''}`;
    return `<span class="lim" title="${esc(tipp)}"><span class="ring" style="--p:${t.prozent};--c:${farbe}"></span>${name} ${t.prozent} %</span>`;
  };
  el.innerHTML = teil(l.fuenf, en ? '5 h' : '5 Std.') + teil(l.woche, en ? 'Week' : 'Woche');
}
setInterval(limitsZeigen, 5 * 60 * 1000);

// Update-Hinweis oben im Seitenmenü; stündlich neu fragen, falls die App lange offen bleibt (#17)
function updateZeigen() {
  api.update().then((u) => { if (u?.version && !$('.update-hinweis')) $('#meta')?.insertAdjacentHTML('afterbegin', `<a href="#" class="update-hinweis" data-url="${esc(u.url)}">⬆ Neue Version verfügbar: <b>${esc(u.version)}</b></a>`); });
}
setInterval(updateZeigen, 60 * 60 * 1000);

// Ablage-Ordner fehlt (verschoben, gelöscht, Laufwerk nicht verbunden) – deutlich sagen statt eine leere Liste zu zeigen
function ablageFehlt(vaults) {
  aktuell = null;
  $('#liste').innerHTML = '';
  ansicht(null, `<div class="mitte"><div class="box"><h2>Deine Ablage wurde nicht gefunden</h2>
    <p class="muted pfad">${esc(settings.ablage)}</p>
    <p>Der Ordner wurde verschoben, umbenannt oder gelöscht – zum Beispiel durch ein Programm-Update – oder das Laufwerk ist gerade nicht verbunden.</p>
    <p class="muted klein">Liegt der Ordner wieder an seinem Platz, sind auch deine Projekte wieder da.</p></div></div>`,
  [{ text: 'Andere Ablage wählen', klick: () => ablageWaehlen(vaults) }, 'sp', { text: 'Erneut prüfen', primary: true, klick: start }]);
}
// Ablage im Installationsordner eines Programms: ein Update oder eine Neuinstallation löscht sie mit
function programmordnerWarnung(prog, vaults) {
  aktuell = null;
  ansicht(null, `<div class="mitte"><div class="box"><h2>Achtung: Ablage im Programmordner</h2>
    <div class="fehler">Deine Ablage liegt im Installationsordner eines Programms. Ein Update oder eine Neuinstallation löscht diesen Ordner samt Inhalt – auch deine Projekte.</div>
    <p class="muted pfad">${esc(prog)}</p>
    <p>So ist es sicher: Obsidian schließen, den Vault-Ordner an einen eigenen Platz verschieben (z. B. in <b>Dokumente</b>), in Obsidian „Ordner als Vault öffnen“ wählen und hier „Ablage wechseln“.</p></div></div>`,
  [{ text: 'Trotzdem weiter', ghost: true, klick: async () => { await api.einstellung('programmordnerOk', settings.ablage); start(); } },
    'sp', { text: 'Ablage wechseln', primary: true, klick: () => ablageWaehlen(vaults) }]);
}

async function ablageWaehlen(vaults) {
  aktuell = null;
  if (vaults.length) {
    // Vaults im Programmordner markieren und nicht vorauswählen
    const gefahr = await Promise.all(vaults.map((v) => api.programmordner(v)));
    const erster = Math.max(gefahr.findIndex((g) => !g), 0);
    ansicht(null, `<div class="mitte"><div class="box"><h2>Wo sollen deine Projekte liegen?</h2>
      <p class="muted">Gefundene Obsidian-Vaults – Dashboards, Punkte und Kanban landen dort im gewohnten Format.</p>
      ${vaults.map((v, i) => `<label class="opt ${i === erster ? 'on' : ''}"><input type="radio" name="v" value="${esc(v)}" ${i === erster ? 'checked' : ''} hidden>${esc(v)}${gefahr[i] ? '<span class="hinweis-tag" title="Ein Update von Obsidian löscht diesen Ordner">⚠ Programmordner – nicht sicher</span>' : ''}</label>`).join('')}
      </div></div>`, [{ text: 'Lieber lokal als .md + .html', klick: lokal }, 'sp', { text: 'Diesen Vault nehmen', primary: true, klick: async () => (await api.ablage('obsidian', $('input[name=v]:checked').value), start()) }]);
    $$('.opt').forEach((l) => l.addEventListener('click', () => { $$('.opt').forEach((x) => x.classList.remove('on')); l.classList.add('on'); $('input', l).checked = true; }));
  } else {
    ansicht(null, `<div class="mitte"><div class="box"><h2>Obsidian ist nicht installiert <span class="hinweis-tag" title="Obsidian ist optional">i&nbsp;Hinweis – kein Muss</span></h2>
      <p>Vibewright speichert alles lokal als .md-Dateien plus ein Dashboard als .html, das du im Browser öffnest.</p>
      <p class="muted">Optional: Mit <b>Obsidian</b> (kostenlos) werden daraus verknüpfte Notizen mit Dashboards und Kanban.</p>
      </div></div>`, [{ text: 'Obsidian installieren', klick: obsidianInstallieren }, 'sp', { text: 'Lokal als .md + .html speichern', primary: true, klick: lokal }]);
  }
}
async function lokal() { await api.ablage('lokal'); start(); }
async function obsidianInstallieren() {
  laden(null, 'Installiere Obsidian …');
  const r = await api['obsidian-installieren']();
  if (r.fehler) return ansicht(null, `<div class="mitte"><div class="box"><div class="fehler">${esc(r.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: start }]);
  ansicht(null, `<div class="mitte"><div class="box"><h2>${r.download ? 'Obsidian herunterladen' : 'Obsidian ist installiert'}</h2>
    ${r.download ? '<p>Die automatische Installation ging auf diesem Rechner nicht. Im Browser ist die offizielle Download-Seite geöffnet – installiere Obsidian von dort.</p>' : ''}
    <p>Starte Obsidian danach einmal und wähle <b>„Ordner als Vault öffnen“</b>:</p><p class="muted">${esc(r.vault)}</p></div></div>`,
  [{ text: 'Ordner zeigen', klick: () => api.ordner(r.vault) }, 'sp', { text: 'Weiter', primary: true, klick: start }]);
}

// Flaggen als SVG – Emoji-Flaggen zeigt Windows nur als Buchstaben an
const FLAGGEN = {
  de: '<svg class="flagge" viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
  en: '<svg class="flagge" viewBox="0 0 60 30"><clipPath id="uk-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></svg>',
};
// Sprache umschalten: speichern (gilt auch für neue Projekte und Claudes Texte) und Oberfläche neu laden
async function spracheWechseln(s) {
  if (s === uiSprache) return;
  await api.einstellung('sprache', s);
  spracheSetzen(s);
  location.reload();
}

// ---------- Einstellungen: Claude, Ablage (Obsidian), Git ----------
let einstTeil = 'claude'; // zuletzt gewählter Bereich, bleibt beim Neuzeichnen erhalten
const MODELLE = [['haiku', 'Haiku', 'am sparsamsten'], ['sonnet', 'Sonnet', 'Standard, schnell'], ['opus', 'Opus', 'am gründlichsten'], ['fable', 'Fable', 'nur mit Usage Credits']];
// Seitenmenü und Einstellungen zeigen dieselbe gespeicherte Wahl
async function modellSetzen(m) {
  await api.einstellung('modell', m);
  settings.modell = m;
  if ($('#modell-wahl')) $('#modell-wahl').value = m;
}

// Verbrauch: oben die Statistik wie /stats (Claude Codes stats-cache), unten was nur Vibewright kennt (#16, #19)
let statsTab = 'ueberblick', statsTage = null;
const modellName = (m) => { const [f = '', ...v] = String(m).replace(/^claude-/, '').replace(/-\d{8}$/, '').split('-'); return `${f.charAt(0).toUpperCase()}${f.slice(1)} ${v.join('.')}`.trim(); };
const kompakt = (n) => new Intl.NumberFormat(uiSprache, { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const modellFarbe = (k) => ['var(--accent)', ...FARBEN][k % (FARBEN.length + 1)];
const utc = (iso) => new Date(`${iso}T00:00:00Z`);
const isoTag = (d) => d.toISOString().slice(0, 10);

// Kachelgrafik der letzten 53 Wochen, Montag oben; 4 Stufen nach Vierteln der aktiven Tage (ein Ausreißer soll nicht alles blass machen)
function heatmap(tageTokens, stand) {
  const ende = utc(stand), start = utc(stand);
  start.setUTCDate(ende.getUTCDate() - ((ende.getUTCDay() + 6) % 7) - 52 * 7);
  const werte = Object.values(tageTokens).filter(Boolean).sort((a, b) => a - b);
  const grenze = [0.25, 0.5, 0.75].map((q) => werte[Math.floor(q * (werte.length - 1))] ?? 0);
  let zellen = '', monate = '', letzterMonat, letzteMarke = -9;
  for (let w = 0; w < 53; w++) for (let t = 0; t < 7; t++) {
    const d = new Date(start); d.setUTCDate(start.getUTCDate() + w * 7 + t);
    if (d > ende) continue;
    const n = tageTokens[isoTag(d)] || 0;
    const stufe = n ? 1 + grenze.filter((g) => n > g).length : 0;
    zellen += `<rect x="${30 + w * 12}" y="${16 + t * 12}" width="10" height="10" rx="2" class="hm${stufe}"><title>${d.toLocaleDateString(uiSprache, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} · ${kompakt(n)} Tokens</title></rect>`;
    if (t === 0 && d.getUTCMonth() !== letzterMonat) {
      letzterMonat = d.getUTCMonth();
      if (w - letzteMarke >= 3) { monate += `<text x="${30 + w * 12}" y="10">${d.toLocaleDateString(uiSprache, { month: 'short', timeZone: 'UTC' })}</text>`; letzteMarke = w; }
    }
  }
  const wochentage = [0, 2, 4].map((t) => `<text x="0" y="${25 + t * 12}">${new Date(Date.UTC(2024, 0, 1 + t)) /* 1.1.2024 war ein Montag */.toLocaleDateString(uiSprache, { weekday: 'short', timeZone: 'UTC' })}</text>`).join('');
  return `<svg class="heatmap" viewBox="0 0 ${30 + 53 * 12} ${16 + 7 * 12}" role="img" aria-label="${uiSprache === 'en' ? 'Activity per day' : 'Aktivität pro Tag'}">${monate}${wochentage}${zellen}</svg>
    <div class="hm-legende muted klein">Weniger ${[0, 1, 2, 3, 4].map((k) => `<svg width="10" height="10"><rect width="10" height="10" rx="2" class="hm${k}"/></svg>`).join('')} Mehr</div>`;
}

// Tokens pro Tag je Modell; Tage ohne Nutzung zählen als 0, damit Lücken als Einbruch sichtbar sind
function verlaufSvg(verlauf, modelle) {
  if (!verlauf.length) return '<p class="muted">Noch kein Verlauf.</p>';
  const erster = utc(verlauf[0].date), tage = Math.round((utc(verlauf.at(-1).date) - erster) / 864e5) + 1;
  if (tage < 2) return '<p class="muted">Zu wenige Tage für einen Verlauf.</p>';
  const jeTag = Object.fromEntries(verlauf.map((d) => [d.date, d.tokensByModel]));
  const B = 640, H = 170, L = 72, U = 20;
  const max = Math.max(1, ...verlauf.flatMap((d) => Object.values(d.tokensByModel)));
  const x = (i) => L + (i / (tage - 1)) * (B - L - 6), y = (n) => 6 + (1 - n / max) * (H - U - 6);
  const tag = (i) => { const d = new Date(erster); d.setUTCDate(erster.getUTCDate() + i); return d; };
  const raster = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${B - 6}" y1="${y(max * f)}" y2="${y(max * f)}" class="raster"/><text x="${L - 6}" y="${y(max * f) + 3}" text-anchor="end">${kompakt(max * f)}</text>`).join('');
  const marken = [0, Math.floor((tage - 1) / 2), tage - 1].map((i) => `<text x="${x(i)}" y="${H - 4}" text-anchor="${i ? (i === tage - 1 ? 'end' : 'middle') : 'start'}">${tag(i).toLocaleDateString(uiSprache, { day: 'numeric', month: 'short', timeZone: 'UTC' })}</text>`).join('');
  const linien = modelle.map(({ m }, k) => `<polyline fill="none" stroke="${modellFarbe(k)}" stroke-width="1.6" stroke-linejoin="round" points="${Array.from({ length: tage }, (_, i) => `${x(i).toFixed(1)},${y(jeTag[isoTag(tag(i))]?.[m] || 0).toFixed(1)}`).join(' ')}"/>`).join('');
  return `<svg class="verlauf" viewBox="0 0 ${B} ${H}" role="img" aria-label="${uiSprache === 'en' ? 'Tokens per day' : 'Tokens pro Tag'}">${raster}${marken}${linien}</svg>`;
}

const dauer = (ms) => {
  const m = Math.floor(ms / 6e4), en = uiSprache === 'en';
  return [[Math.floor(m / 1440), en ? 'd' : ' T'], [Math.floor(m / 60) % 24, en ? 'h' : ' Std'], [m % 60, en ? 'm' : ' Min']].filter(([n]) => n).map(([n, e]) => n + e).join(' ') || '–';
};

function statsHtml(s) {
  if (s.fehler === 'fehlt') return '<p class="muted">Claude Code hat noch keine Statistik angelegt. Sie entsteht, sobald du Claude Code eine Weile genutzt hast.</p>';
  if (s.fehler) return '<p class="muted">Claude Code speichert seine Statistik in einem neuen Format. Diese Vibewright-Version kann es noch nicht lesen – bitte auf ein Update achten.</p>';
  const datum = (iso) => (iso ? utc(iso).toLocaleDateString(uiSprache, { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '–');
  const kz = (name, wert) => `<div><dt>${name}</dt><dd>${wert}</dd></div>`;
  const summe = (k) => s.modelle.reduce((a, x) => a + (x.teile?.[k] || 0), 0);
  const tabs = `<div class="seg seg-klein">${[['ueberblick', 'Überblick'], ['modelle', 'Modelle']].map(([k, n]) => `<button data-tab="${k}" class="${statsTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="seg seg-klein">${[[null, 'Gesamt'], [7, '7 Tage'], [30, '30 Tage']].map(([t, n]) => `<button data-tage="${t ?? ''}" class="${statsTage === t ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const ueberblick = `${heatmap(s.tageTokens, s.stand)}
    <dl class="kennzahlen">
      ${kz('Lieblingsmodell', esc(s.modelle[0] ? modellName(s.modelle[0].m) : '–'))}${kz('Tokens gesamt', kompakt(s.gesamt))}
      ${kz('Sitzungen', s.sitzungen.toLocaleString(uiSprache))}${s.laengsteSitzung ? kz('Längste Sitzung', dauer(s.laengsteSitzung)) : ''}
      ${kz('Aktive Tage', `${s.aktiveTage}/${s.tageGesamt}`)}${kz('Längste Serie', `${s.laengsteSerie} ${uiSprache === 'en' ? 'days' : 'Tage'}`)}
      ${kz('Aktivster Tag', datum(s.aktivsterTag))}${kz('Aktuelle Serie', `${s.aktuelleSerie} ${uiSprache === 'en' ? 'days' : 'Tage'}`)}
    </dl>
    ${statsTage ? '' : `<p class="muted klein">Eingabe ${kompakt(summe('inputTokens'))} · Ausgabe ${kompakt(summe('outputTokens'))} · Cache gelesen ${kompakt(summe('cacheReadInputTokens'))} · Cache geschrieben ${kompakt(summe('cacheCreationInputTokens'))}</p>`}`;
  const modelle = `${verlaufSvg(s.verlauf, s.modelle)}
    <div class="modell-liste">${s.modelle.map((x, k) => `<div><b><span class="punkt" style="background:${modellFarbe(k)}"></span>${esc(modellName(x.m))}</b> <span class="muted">${(x.anteil * 100).toLocaleString(uiSprache, { maximumFractionDigits: 1 })} %</span>
      <div class="muted klein">${x.teile ? `Eingabe ${kompakt(x.teile.inputTokens)} · Ausgabe ${kompakt(x.teile.outputTokens)}<br>Cache ${kompakt(x.teile.cacheReadInputTokens)} gelesen · ${kompakt(x.teile.cacheCreationInputTokens)} geschrieben` : `${kompakt(x.tokens)} Tokens`}</div></div>`).join('')}</div>
    ${statsTage ? '<span class="muted klein">Aufteilung nach Eingabe, Ausgabe und Cache gibt es nur für „Gesamt“.</span>' : ''}`;
  return `<div class="stats-kopf">${tabs}<span class="muted klein">Stand ${datum(s.stand)} · alle Claude-Code-Sitzungen auf diesem Rechner</span></div>
    ${statsTab === 'modelle' ? modelle : ueberblick}`;
}

async function verbrauchZeigen() {
  aktuell = null;
  seitenleiste();
  const [v, s] = await Promise.all([api.verbrauch(), api.stats(statsTage)]);
  if (v.fehler) return ansicht(null, `<div class="mitte"><div class="box"><div class="fehler">${esc(v.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: start }]);
  const zahl = (n) => (n || 0).toLocaleString(uiSprache);
  const tabelle = (daten, kosten) => {
    const zeilen = Object.entries(daten).sort((a, b) => a[0].localeCompare(b[0]));
    if (!zeilen.length) return '<p class="muted">Noch kein Verbrauch erfasst.</p>';
    return `<div class="tabelle-scroll"><table class="verbrauch"><tr><th>Modell</th><th>Eingabe</th><th>Ausgabe</th><th>Cache gelesen</th><th>Cache geschrieben</th>${kosten ? '<th>Kosten*</th>' : ''}</tr>
      ${zeilen.map(([m, u]) => `<tr><td>${esc(m)}</td><td>${zahl(u.inputTokens)}</td><td>${zahl(u.outputTokens)}</td><td>${zahl(u.cacheReadInputTokens)}</td><td>${zahl(u.cacheCreationInputTokens)}</td>${kosten ? `<td>$${(u.costUSD || 0).toFixed(2)}</td>` : ''}</tr>`).join('')}</table></div>`;
  };
  ansicht(null, `<div class="einst-kopf"><h2>Verbrauch</h2><span class="muted">Tokens, wie Claude Code sie meldet</span></div>
  <div class="einst einst-verbrauch">
    <div class="karte stats" style="--ak:var(--accent)"><span class="label">Statistik</span>${statsHtml(s)}</div>
    <div class="karte" style="--ak:#e0a84a"><span class="label">Planung in Vibewright</span>${tabelle(v.planung, true)}
      <span class="muted klein">* Geschätzt zum Listenpreis – im Abo (Pro/Max) nicht einzeln abgerechnet.</span></div>
    <div class="karte" style="--ak:#4fb8c9"><span class="label">Terminal-Sitzungen in Vibewright-Projekten</span>${tabelle(v.terminal, false)}
      <span class="muted klein">Alle Claude-Code-Sitzungen in den Projektordnern. Kosten meldet Claude Code hier nicht.</span></div>
  </div>`, [{ text: 'Zurück', klick: start }, 'sp', { text: 'Aktualisieren', klick: verbrauchZeigen }]);
  $$('.stats [data-tab]').forEach((b) => (b.onclick = () => { statsTab = b.dataset.tab; verbrauchZeigen(); }));
  $$('.stats [data-tage]').forEach((b) => (b.onclick = () => { statsTage = Number(b.dataset.tage) || null; verbrauchZeigen(); }));
}
async function einstellungen() {
  aktuell = null;
  seitenleiste();
  const e = await api.einstellungen();
  if (e.fehler) return ansicht(null, `<div class="mitte"><div class="box"><div class="fehler">${esc(e.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: start }]);
  const punkt = (ok, text) => `<div class="check"><span class="dot ${ok ? 'ok' : 'bad'}"></span>${text}</div>`;
  const c = e.claude, a = e.ablage, g = e.git;
  ansicht(null, `<div class="einst-kopf"><h2>Einstellungen</h2><span class="muted">Verbindungen zu Claude, deiner Ablage und Git</span>
    <span class="sp"></span><span class="label">Sprache</span><div class="seg seg-klein">${[['de', 'Deutsch'], ['en', 'English']].map(([s, n]) => `<button data-s="${s}" class="${uiSprache === s ? 'on' : ''}">${FLAGGEN[s]}${n}</button>`).join('')}</div></div>
  <div class="einst">
    <nav class="einst-nav">${[['claude', 'Claude', c.claude && c.loggedIn], ['ablage', 'Ablage', !!a.ablage], ['git', 'Git', g.installiert && g.name && g.email]]
      .map(([k, t, ok]) => `<button data-teil="${k}" class="${k === einstTeil ? 'on' : ''}"><span class="dot ${ok ? 'ok' : 'bad'}"></span>${t}</button>`).join('')}</nav>
    <div class="karte einst-teil" data-teil="claude" style="--ak:var(--accent)"><span class="label">Claude</span>
      ${punkt(c.claude, c.claude ? `Claude Code ${esc(c.version.split(' ')[0])}` : 'Claude Code ist nicht installiert')}
      ${c.claude ? punkt(c.loggedIn, c.loggedIn ? `Angemeldet${c.abo ? ` · ${esc(c.abo)}` : ''}` : 'Nicht angemeldet') : ''}
      ${c.apiKey ? '<div class="hinweis klein" style="margin:0">Angemeldet per <b>API-Key</b>: Jede Nutzung wird einzeln abgerechnet. Mit einem Claude-Abo (Pro/Max) ist sie im Abo enthalten.</div>' : ''}
      <span class="label" style="margin-top:8px">Modell</span>
      <div class="seg">${MODELLE.map(([m, n, d]) => `<button data-m="${m}" class="${e.modell === m ? 'on' : ''}">${n}<small>${d}</small></button>`).join('')}</div>
      <span class="muted klein">Gilt für Interview, Analyse, Plan, Ideen und neue Terminal-Sitzungen. Auch im Seitenmenü wählbar.</span>
      <div class="unten" id="claude-unten">${c.claude ? `<button class="btn ${c.loggedIn ? '' : 'primary'}" id="anmelden">${c.loggedIn ? 'Neu anmelden' : 'Anmelden'}</button>` : '<a href="#" data-url="https://docs.claude.com/en/docs/claude-code/setup">Installationsanleitung</a>'}<button class="btn ghost" id="pruefen">Neu prüfen</button><button class="btn" id="regeln" title="Regeln, die Claude in jedem Projekt befolgt">Globale Regeln</button></div>
    </div>
    <div class="karte einst-teil" data-teil="ablage" style="--ak:#4fb8c9"><span class="label">Ablage</span>
      ${punkt(true, a.modus === 'obsidian' ? 'Obsidian-Vault' : 'Lokal als .md + .html')}
      <div class="muted pfad">${esc(a.ablage || '–')}</div>
      ${a.modus === 'obsidian' ? punkt(a.dataview, a.dataview ? 'Dataview aktiv – Tabellen aktualisieren sich live' : 'Dataview fehlt – feste Tabellen') : ''}
      ${a.modus === 'obsidian' ? punkt(a.kanban, a.kanban ? 'Kanban-Board erkannt' : 'Kein Kanban-Board (Projekte-Kanban.md)') : ''}
      ${!e.vaults.length ? '<span class="muted klein">Obsidian ist nicht installiert – optional, kein Muss.</span>' : ''}
      <div class="unten"><button class="btn" id="ablage">Ablage wechseln</button>${!e.vaults.length ? '<button class="btn" id="obs-inst">Obsidian installieren</button>' : ''}<button class="btn ghost" id="ordner">Ordner öffnen</button></div>
    </div>
    <div class="karte einst-teil" data-teil="git" style="--ak:#e0a84a"><span class="label">Git</span>
      ${punkt(g.installiert, g.installiert ? `Git ${esc(g.version)}` : 'Git ist nicht installiert')}
      ${g.installiert ? `${punkt(g.name && g.email, g.name && g.email ? 'Name und E-Mail für Commits eingetragen' : 'Name und E-Mail fehlen noch')}
        <input type="text" id="g-name" placeholder="Dein Name" value="${esc(g.name)}">
        <input type="text" id="g-mail" placeholder="E-Mail" value="${esc(g.email)}">`
        : `<span class="muted klein">Offizieller Download: <a href="#" data-url="https://git-scm.com/download/${MAC ? 'mac' : 'win'}">git-scm.com/download/${MAC ? 'mac' : 'win'}</a></span>`}
      <label class="schalter"><input type="checkbox" id="g-auto" ${e.gitAuto ? 'checked' : ''}><span>Code-Ordner automatisch als Git-Projekt anlegen<small>Claude macht nach jedem erledigten Schritt einen Commit – so kannst du jederzeit zurück.</small></span></label>
      <div class="unten">${g.installiert ? '<button class="btn" id="g-speichern">Speichern</button>' : ''}<button class="btn" id="g-forge" title="Konto für den Import von Projekten">GitHub / Gitea</button><span class="muted klein" id="g-info"></span></div>
    </div>
  </div>`, [{ text: 'Zurück', ghost: true, klick: start }, 'sp',
    { text: 'Anleitung', ghost: true, klick: () => api.link(`https://github.com/neodk2004/vibewright/wiki${uiSprache === 'en' ? '/Home-English' : ''}`) },
    { text: 'Fehler melden', ghost: true, klick: () => api['fehler-melden']() },
    { text: 'Lizenzen & Quellen', ghost: true, klick: () => api.link('https://github.com/neodk2004/vibewright/blob/main/THIRD_PARTY_NOTICES.md') },
    { info: `Vibewright ${e.version} · © 2026 neodk2004 · MIT License` }]);
  const teilZeigen = (k) => { einstTeil = k; $$('.einst [data-teil]').forEach((el) => (el.matches('button') ? el.classList.toggle('on', el.dataset.teil === k) : (el.hidden = el.dataset.teil !== k))); };
  $$('.einst-nav button').forEach((b) => (b.onclick = () => teilZeigen(b.dataset.teil)));
  teilZeigen(einstTeil);
  $$('.seg button[data-m]').forEach((b) => (b.onclick = async () => { await modellSetzen(b.dataset.m); einstellungen(); }));
  $$('.seg button[data-s]').forEach((b) => (b.onclick = () => spracheWechseln(b.dataset.s)));
  $('#anmelden')?.addEventListener('click', async () => { await api['claude-anmelden'](); $('#claude-unten').insertAdjacentHTML('beforeend', '<span class="muted klein">Im Browser anmelden, dann „Neu prüfen“.</span>'); });
  $('#pruefen').onclick = einstellungen;
  $('#ablage').onclick = () => ablageWaehlen(e.vaults);
  $('#obs-inst')?.addEventListener('click', obsidianInstallieren);
  $('#ordner').onclick = () => api.ordner(a.ablage);
  $('#regeln').onclick = () => regelnSeite();
  $('#g-forge').onclick = () => forgeEinstellungen(einstellungen);
  $('#g-auto').onchange = (ev) => api.einstellung('gitAuto', ev.target.checked);
  $('#g-speichern')?.addEventListener('click', async () => {
    const r = await api['git-identitaet']($('#g-name').value, $('#g-mail').value);
    if (r.fehler) return ($('#g-info').innerHTML = `<span class="fehltext">${esc(r.fehler)}</span>`);
    einstellungen();
  });
}

// ---------- Neues Projekt ----------
let importOrdner = null; // Code-Ordner einer übernommenen Claude-Code-Sitzung
function neuesProjekt(v = {}) {
  aktuell = null;
  importOrdner = v.ordner || null;
  seitenleiste();
  ansicht(null, `<div class="mitte"><div class="box"><h2>Neues Projekt</h2>
    <input type="text" id="name" placeholder="Projektname" value="${esc(v.name)}">
    <textarea id="idee" rows="2" placeholder="Deine Idee in einem Satz">${esc(v.idee)}</textarea>
    ${importOrdner ? `<p class="muted klein pfad"><span>Code-Ordner:</span> ${esc(importOrdner)}</p>` : ''}
    <div class="ablauf"><span>Interview</span><span>Bedarfsanalyse</span><span>Plan</span><span>Werkzeug-Check</span><span>Umsetzung</span></div>
    </div></div>`, [{ text: 'Aus Claude Code übernehmen', ghost: true, klick: claudeImport }, { text: 'Aus GitHub / Gitea', ghost: true, klick: forgeImport }, { text: 'Aus eigenem Ordner', ghost: true, klick: ordnerImport }, 'sp', { text: 'Los geht\'s', primary: true, klick: anlegen }]);
  $('#name').focus();
  $('#idee').addEventListener('keydown', (e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), anlegen()));
}
// Ordner, in denen schon mit Claude Code gearbeitet wurde: Name, Idee (erste Nachricht) und Code-Ordner übernehmen
async function claudeImport() {
  const l = await api['claude-sitzungen']();
  const fehler = l.fehler ? `<div class="fehler">${esc(l.fehler)}</div>` : '';
  const liste = Array.isArray(l) ? l : [];
  const datum = (ms) => new Date(ms).toLocaleDateString(uiSprache, { day: '2-digit', month: '2-digit', year: 'numeric' });
  ansicht(null, `<div class="mitte"><div class="box"><h2>Aus Claude Code übernehmen</h2>
    <p class="muted">Wähle einen Ordner, in dem du schon mit Claude Code gearbeitet hast. Vibewright plant von dort aus weiter.</p>${fehler}
    <div class="import-liste">${liste.length ? liste.map((s, i) => `<button class="opt" data-i="${i}" title="${esc(s.ordner)}"><span class="imp"><span><b>${esc(s.name)}</b> <span class="muted klein">${datum(s.zeit)}</span></span><span class="muted klein">${esc(s.idee || s.ordner)}</span></span></button>`).join('')
    : '<p class="muted">Keine früheren Claude-Code-Sitzungen gefunden.</p>'}</div></div></div>`, [{ text: 'Zurück', ghost: true, klick: () => neuesProjekt() }]);
  $$('.import-liste .opt').forEach((b) => (b.onclick = () => neuesProjekt(liste[b.dataset.i])));
}
// Eigener Ordner (Festplatte, USB, NAS): Name aus dem Ordner, Idee vorbelegt – beides vor „Los geht's“ änderbar
async function ordnerImport() {
  const r = await api['ordner-importieren']();
  if (r && !r.fehler) neuesProjekt(r);
}
// GitHub / Gitea: Repository aussuchen, in einen Code-Ordner klonen, dann wie gewohnt planen
async function forgeImport() {
  const k = await api.forge();
  if (!k.nutzer && !k.tokenGespeichert) return forgeEinstellungen(forgeImport);
  laden(null, 'Repositories werden geladen …');
  const l = await api['forge-repos']();
  const liste = Array.isArray(l) ? l : [];
  const fehler = l.fehler ? `<div class="fehler">${esc(l.fehler)}</div>` : '';
  const datum = (iso) => (iso ? new Date(iso).toLocaleDateString(uiSprache, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
  ansicht(null, `<div class="mitte"><div class="box"><h2>Aus ${k.typ === 'gitea' ? 'Gitea' : 'GitHub'} übernehmen</h2>
    <p class="muted">Wähle ein Repository. Vibewright lädt den Code in einen Ordner deiner Wahl und plant von dort aus weiter.</p>${fehler}
    <div class="import-liste">${liste.length ? liste.map((r, i) => `<button class="opt" data-i="${i}" title="${esc(r.url)}"><span class="imp"><span><b>${esc(r.voll)}</b> ${r.privat ? '<span class="chip">privat</span> ' : ''}<span class="muted klein">${datum(r.zeit)}</span></span><span class="muted klein">${esc(r.beschreibung || '–')}</span></span></button>`).join('')
    : l.fehler ? '' : '<p class="muted">Keine Repositories gefunden.</p>'}</div></div></div>`,
  [{ text: 'Zurück', ghost: true, klick: () => neuesProjekt() }, 'sp', { text: 'Konto ändern', ghost: true, klick: () => forgeEinstellungen(forgeImport) }]);
  $$('.import-liste .opt').forEach((b) => (b.onclick = async () => {
    laden(null, 'Repository wird geladen …');
    const r = await api['forge-klonen'](liste[b.dataset.i]);
    if (!r) return forgeImport(); // Ordnerauswahl abgebrochen
    if (r.fehler) return ansicht(null, `<div class="mitte"><div class="box"><h2>Das hat nicht geklappt</h2><div class="fehler">${esc(r.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: forgeImport }]);
    neuesProjekt(r);
  }));
}
// Konto für GitHub oder einen eigenen Gitea-Server; Token ist optional (nur für private Repositories nötig)
async function forgeEinstellungen(zurueck) {
  const k = await api.forge();
  let typ = k.typ || 'github';
  ansicht(null, `<div class="mitte"><div class="box"><h2>GitHub / Gitea verbinden</h2>
    <div class="seg seg-klein">${[['github', 'GitHub'], ['gitea', 'Gitea']].map(([t, n]) => `<button data-t="${t}" class="${typ === t ? 'on' : ''}">${n}</button>`).join('')}</div>
    <input type="text" id="f-server" placeholder="Adresse deines Gitea-Servers, z. B. https://gitea.example.de" value="${esc(k.server)}">
    <input type="text" id="f-nutzer" placeholder="Benutzername" value="${esc(k.nutzer)}">
    <input type="password" id="f-token" placeholder="${k.tokenGespeichert ? 'Token ist gespeichert – leer lassen zum Behalten' : 'Zugriffs-Token (optional, für private Repositories)'}">
    <p class="muted klein" id="f-hilfe"></p></div></div>`,
  [{ text: 'Zurück', ghost: true, klick: zurueck }, ...(k.tokenGespeichert ? [{ text: 'Token entfernen', ghost: true, klick: () => speichern(true) }] : []), 'sp', { text: 'Speichern & testen', primary: true, klick: () => speichern(false) }]);
  const zeigen = () => {
    $$('.seg button[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === typ));
    $('#f-server').hidden = typ !== 'gitea';
    // Gespeichertes Token gilt nur für den bisherigen Dienst; nach einem Wechsel muss ein neues her
    const ph = k.tokenGespeichert && typ === k.typ ? 'Token ist gespeichert – leer lassen zum Behalten' : 'Zugriffs-Token (optional, für private Repositories)';
    $('#f-token').placeholder = uiSprache === 'en' ? trText(ph) : ph; // Attribut-Änderungen übersetzt i18n.js nicht von selbst
    const tokenSeite = typ === 'github' ? 'https://github.com/settings/personal-access-tokens' : '';
    $('#f-hilfe').innerHTML = `Ohne Token siehst du nur öffentliche Repositories. Token mit Leserechten für Repositories anlegen: ${tokenSeite ? `<a href="#" data-url="${tokenSeite}">github.com/settings</a>` : '<span>in Gitea unter Einstellungen → Anwendungen</span>'}<span>. Er wird verschlüsselt auf diesem Rechner gespeichert.</span>`;
  };
  $$('.seg button[data-t]').forEach((b) => (b.onclick = () => { typ = b.dataset.t; zeigen(); }));
  zeigen();
  async function speichern(tokenLoeschen) {
    const r = await api['forge-speichern']({ typ, server: $('#f-server').value, nutzer: $('#f-nutzer').value, token: $('#f-token').value, tokenLoeschen });
    $('.box .fehler')?.remove();
    if (r.fehler) return $('.box').insertAdjacentHTML('beforeend', `<div class="fehler">${esc(r.fehler)}</div>`);
    zurueck();
  }
}

// ---------- Globale Regeln: zentrale CLAUDE.md für alle Projekte ----------
// Bausteine für Schritte, die sich in jedem Projekt wiederholen; ein Klick hängt sie an
const BAUSTEINE = [
  ['Commit', 'Nach jedem erledigten Schritt einen Git-Commit mit kurzer Beschreibung machen.', 'Make a Git commit with a short description after every finished step.'],
  ['Push', 'Erst pushen, wenn ich es ausdrücklich sage. Vorher prüfen, dass keine persönlichen Daten oder Geheimnisse dabei sind.', 'Only push when I explicitly say so. Check beforehand that no personal data or secrets are included.'],
  ['/graphify', 'Nach größeren Änderungen /graphify ausführen, damit der Wissensgraph aktuell bleibt.', 'Run /graphify after larger changes so the knowledge graph stays up to date.'],
  ['/ponytail', 'Mit /ponytail arbeiten: einfachste Lösung, die funktioniert – keine unnötigen Abhängigkeiten oder Abstraktionen.', 'Work with /ponytail: simplest solution that works – no unnecessary dependencies or abstractions.'],
  ['Security-Scan', 'Vor jedem Push /security-review ausführen und gefundene Probleme zuerst beheben.', 'Run /security-review before every push and fix any findings first.'],
  ['Schwachstellen', 'Vor jedem Release Abhängigkeiten auf bekannte Schwachstellen prüfen (z. B. npm audit, pip-audit).', 'Before every release, check dependencies for known vulnerabilities (e.g. npm audit, pip-audit).'],
  ['Geheimnisse', 'Nie Passwörter, Tokens oder API-Keys in Dateien schreiben oder committen.', 'Never write or commit passwords, tokens or API keys.'],
  ['Tests', 'Nach jeder Änderung die Tests laufen lassen; schlagen sie fehl, das ehrlich sagen.', 'Run the tests after every change; if they fail, say so honestly.'],
];
// projekt: aus dem Cockpit geöffnet → Reiter „Alle Projekte“ (globale CLAUDE.md) und „Nur dieses Projekt“ (CLAUDE.md im Arbeitsordner)
async function regelnSeite(projekt = null, nurProjekt = !!projekt) {
  aktuell = projekt;
  const zurueck = projekt ? () => cockpit(projekt) : einstellungen;
  const r = nurProjekt ? await api['projekt-regeln'](projekt.name) : await api.regeln();
  if (r.fehler) return ansicht(projekt, `<div class="mitte"><div class="box"><div class="fehler">${esc(r.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: zurueck }]);
  const en = uiSprache === 'en';
  const titel = en ? '## Recurring steps' : '## Wiederkehrende Schritte';
  const kopf = projekt
    ? `<h2>Regeln</h2><div class="tabs"><button data-nur="0" class="${nurProjekt ? '' : 'on'}">Alle Projekte</button><button data-nur="1" class="${nurProjekt ? 'on' : ''}">Nur dieses Projekt</button></div>`
    : '<h2>Globale Regeln</h2>';
  ansicht(projekt, `<div class="einst-kopf">${kopf}<span class="muted">${nurProjekt ? 'Claude Code befolgt sie nur in diesem Projekt' : 'Claude Code befolgt sie in jedem Projekt'}</span></div>
    <div class="regeln"><textarea id="r-text" spellcheck="false" placeholder="${nurProjekt ? 'Noch keine eigenen Regeln für dieses Projekt. Klicke rechts auf Bausteine oder schreib eigene.' : 'Noch keine globalen Regeln. Klicke rechts auf Bausteine oder schreib eigene.'}">${esc(r.text)}</textarea>
      <div class="spalte"><span class="label">Bausteine</span><div class="bausteine">${BAUSTEINE.map(([n, de, e], i) => `<button class="opt" data-i="${i}" title="${esc(en ? e : de)}"><span class="imp"><b>${esc(n)}</b><span class="muted klein">${esc(en ? e : de)}</span></span></button>`).join('')}</div>
      <span class="muted klein pfad">${esc(r.pfad)}</span></div></div>`,
  [{ text: 'Zurück', ghost: true, klick: zurueck }, { info: nurProjekt ? 'Gilt ab der nächsten Claude-Sitzung. Den Vibewright-Abschnitt der Datei pflegt die App selbst.' : 'Vor dem Speichern wird die alte Datei als CLAUDE.md.bak gesichert.' }, 'sp', { text: 'Speichern', primary: true, id: 'r-speichern', klick: speichern }]);
  $$('.einst-kopf .tabs button').forEach((b) => (b.onclick = () => regelnSeite(projekt, b.dataset.nur === '1')));
  const feld = $('#r-text');
  // Bausteine, die schon in der Datei stehen, sind markiert
  const markieren = () => $$('.bausteine .opt').forEach((b) => { const [, de, e] = BAUSTEINE[b.dataset.i]; b.classList.toggle('on', feld.value.includes(de) || feld.value.includes(e)); });
  feld.oninput = markieren;
  $$('.bausteine .opt').forEach((b) => (b.onclick = () => {
    if (b.classList.contains('on')) return;
    const zeile = `- ${BAUSTEINE[b.dataset.i][en ? 2 : 1]}`;
    let t = feld.value.replace(/\s*$/, '');
    const k = t.indexOf(titel);
    if (k < 0) t = `${t ? `${t}\n\n` : ''}${titel}\n${zeile}`;
    else { const m = /\n#{1,2} /.exec(t.slice(k + titel.length)), ende = m ? k + titel.length + m.index : -1; t = ende < 0 ? `${t}\n${zeile}` : `${t.slice(0, ende).replace(/\s*$/, '')}\n${zeile}\n${t.slice(ende)}`; }
    feld.value = `${t}\n`;
    markieren();
  }));
  markieren();
  async function speichern() {
    const s = nurProjekt ? await api['projekt-regeln-speichern'](projekt.name, feld.value) : await api['regeln-speichern'](feld.value);
    $('#r-speichern').textContent = s?.fehler ? s.fehler : '✓ Gespeichert';
    setTimeout(() => $('#r-speichern') && ($('#r-speichern').textContent = 'Speichern'), 1800);
  }
}

async function anlegen() {
  const st = await api.neu($('#name').value, $('#idee').value, importOrdner);
  if (st.fehler) return ($('.box .fehler')?.remove(), $('.box').insertAdjacentHTML('beforeend', `<div class="fehler">${esc(st.fehler)}</div>`));
  aktuell = st;
  seitenleiste();
  schritt(st, {}, importOrdner ? 'Claude liest den Projektordner und prüft, wie weit das Projekt ist …' : 'Claude stellt die ersten Fragen zusammen …');
}

// ---------- Archivieren & Löschen ----------
async function zurueckZu(st) { const r = await api.laden(st.name); zeige(r.fehler ? st : r); }
function loeschenFragen(st) {
  ansicht(st, `<div class="mitte"><div class="box"><h2>„${esc(st.name)}“ löschen?</h2>
    <div class="fehler"><b>Achtung:</b> Mit der nächsten Bestätigung sind alle Daten dieses Projekts endgültig weg – Interview, Bedarfsanalyse, Plan, Punkte und Dashboard. Das lässt sich nicht rückgängig machen.</div>
    ${st.repo ? `<p class="muted">Dein Code-Ordner bleibt erhalten:<br>${esc(st.repo)}</p>` : ''}
    <p class="muted">Lieber aufheben? „Archivieren“ packt alles in eine ZIP-Datei.</p></div></div>`,
  [{ text: 'Abbrechen', ghost: true, klick: () => zurueckZu(st) }, 'sp', { text: 'Archivieren', klick: () => archivieren(st) },
    { text: 'Endgültig löschen', gefahr: true, klick: async () => {
      const r = await api.loeschen(st.name);
      if (r?.fehler) return $('.box').insertAdjacentHTML('beforeend', `<div class="fehler">${esc(r.fehler)}</div>`);
      neuesProjekt();
    } }]);
  $('.kopf-akt')?.remove();
}
async function archivieren(st) {
  laden(st, 'Projekt wird archiviert …');
  const zip = await api.archivieren(st.name);
  if (zip?.fehler) return ansicht(st, `<div class="mitte"><div class="box"><h2>Das hat nicht geklappt</h2><div class="fehler">${esc(zip.fehler)}</div></div></div>`, [{ text: 'Zurück', klick: () => zurueckZu(st) }]);
  aktuell = null;
  seitenleiste();
  ansicht(null, `<div class="mitte"><div class="box"><h2>Archiviert</h2>
    <p>Das Projekt steckt jetzt komplett in einer ZIP-Datei und ist aus der Liste verschwunden.</p><p class="muted pfad">${esc(zip)}</p>
    <p class="muted klein">Zurückholen: ZIP-Datei entpacken und den Ordner wieder in die Ablage legen.</p></div></div>`,
  [{ text: 'Im Ordner zeigen', klick: () => api.ordner(zip.replace(/[\\/][^\\/]+$/, '')) }, 'sp', { text: 'Weiter', primary: true, klick: neuesProjekt }]);
}

// ---------- Ablauf ----------
async function schritt(st, eingabe, text) {
  laden(st, text);
  zeige(await api.weiter(st.name, eingabe));
}

function zeige(st) {
  if (st.fehler && !st.name) return;
  if (aktuell?.name !== st.name) gewaehlt = null;
  aktuell = st;
  seitenleiste();
  const o = st.offen;
  if (st.fehler) {
    return ansicht(st, `<div class="mitte"><div class="box"><h2>Das hat nicht geklappt</h2><div class="fehler">${esc(st.fehler)}</div>
      <p class="muted">Der Stand ist gespeichert. Du kannst es jetzt oder später erneut versuchen.</p></div></div>`,
    ['sp', { text: 'Erneut versuchen', primary: true, klick: () => (o?.typ === 'fragen' ? zeige({ ...st, fehler: null }) : schritt(st, {}, 'Neuer Versuch …')) }]);
  }
  if (!o) return schritt(st, {}, 'Claude stellt die ersten Fragen zusammen …');
  if (o.typ === 'fragen') return fragen(st);
  if (o.typ === 'gate' && o.schritt === 'analyse') return analyse(st);
  if (o.typ === 'gate') return plan(st);
  if (o.typ === 'werkzeug') return werkzeug(st);
  cockpitNeu();
}

// Interview: eine Frage pro Bildschirm, Tasten 1–4, Enter = weiter
function fragen(st) {
  const fr = st.offen.fragen;
  const ant = fr.map(() => ({ wahl: [], eigen: '' }));
  let i = 0;
  const runde = st.runden.length;
  const male = () => {
    const f = fr[i], a = ant[i];
    ansicht(st, `<div class="frage">
      <div class="row" style="display:flex;justify-content:space-between;align-items:center">
        <span class="label">Runde ${runde} · Frage ${i + 1} von ${fr.length}</span>
        <span class="punkte">${fr.map((_x, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('')}</span></div>
      <div class="q">${esc(f.frage)}</div>
      ${f.mehrfach ? '<span class="mehr-tag">Mehrere Antworten möglich</span>' : ''}
      <div class="opts${f.mehrfach ? ' mehr' : ''}">${f.optionen.map((op, j) => `<button class="opt ${a.wahl.includes(op) ? 'on' : ''}" data-j="${j}"><kbd>${j + 1}</kbd><span>${esc(op)}</span></button>`).join('')}</div>
      <input type="text" id="eigen" placeholder="Oder eigene Antwort eintippen …" value="${esc(a.eigen)}">
    </div>`, [
      { text: 'Zurück', ghost: true, klick: () => (i > 0 ? (i--, male()) : null) },
      'sp',
      { text: i < fr.length - 1 ? 'Weiter' : 'Antworten senden', primary: true, id: 'vor', klick: vor },
    ]);
    $$('.opt').forEach((b) => (b.onclick = () => waehle(Number(b.dataset.j))));
    $('#eigen').oninput = (e) => { a.eigen = e.target.value; status(); };
    $('#eigen').onkeydown = (e) => { if (e.key === 'Enter') vor(); }; // Klammern nötig: Rückgabe false würde jede Taste verwerfen
    tasten = (e) => { if (/^[1-4]$/.test(e.key) && f.optionen[e.key - 1]) waehle(e.key - 1); if (e.key === 'Enter') vor(); };
    status();
  };
  const status = () => { const a = ant[i]; $('#vor').disabled = !a.wahl.length && !a.eigen.trim(); };
  const waehle = (j) => {
    const f = fr[i], a = ant[i], op = f.optionen[j];
    if (f.mehrfach) { a.wahl = a.wahl.includes(op) ? a.wahl.filter((x) => x !== op) : [...a.wahl, op]; male(); }
    else { a.wahl = [op]; male(); setTimeout(vor, 180); } // Einzelauswahl: direkt weiter
  };
  const vor = () => {
    const a = ant[i];
    if (!a.wahl.length && !a.eigen.trim()) return;
    if (i < fr.length - 1) { i++; return male(); }
    const antworten = ant.map((x) => [...x.wahl, ...(x.eigen.trim() ? [x.eigen.trim()] : [])].join(', '));
    schritt(st, { antworten }, runde < 2 ? 'Claude prüft, ob noch etwas fehlt …' : 'Claude schreibt die Bedarfsanalyse …');
  };
  male();
}

// Gemeinsame Fußleiste für Freigaben: Änderungswunsch links, Freigabe rechts
const gateAktionen = (st, ok, naechst) => [
  { text: 'Später', ghost: true, klick: neuesProjekt },
  { input: 'wunsch', platzhalter: 'Was soll anders sein?' },
  { text: 'Ändern lassen', klick: () => { const w = $('#wunsch').value.trim(); w && schritt(st, { aktion: 'aendern', text: w }, 'Claude überarbeitet …'); } },
  'sp',
  { text: ok, primary: true, klick: () => schritt(st, { aktion: 'ok' }, naechst) },
];

// Text mit anklickbaren https-Links (öffnen im Browser)
const verlinke = (s) => esc(s).replace(/https:\/\/[^\s<)]+[^\s<).,;:]/g, (u) => `<a href="#" data-url="${u}">${u.replace(/^https:\/\/(www\.)?/, '')}</a>`);
// Daneben fallengelassene Dateien nicht öffnen (sonst ersetzt Electron die App durch die Datei)
['dragover', 'drop'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault()));
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-url]'); if (a) { e.preventDefault(); e.stopPropagation(); api.link(a.dataset.url); } });
const phasenFarbe = (i) => FARBEN[(i * 3 + 3) % FARBEN.length]; // feste Farbe je Phase, gut unterscheidbar

function analyse(st) {
  const a = st.offen.analyse;
  if (!a) return schritt(st, { aktion: 'aendern', text: 'Bitte im neuen, kompakten Format ausgeben.' }, 'Claude bringt die Analyse ins neue Format …');
  const ampel = { gruen: 'var(--ok)', gelb: 'var(--warn)', rot: 'var(--bad)' }[a.ampel];
  const tabs = [['Muss', a.muss], ['Kann später', a.kann], ['Nicht-Ziele', a.nicht], ['Risiken', a.risiken]];
  ansicht(st, `<div class="zwei">
    <div class="spalte">
      <div class="karte" style="--ak:var(--accent)"><span class="label">Ziel</span><p>${esc(a.ziel)}</p></div>
      <div class="karte" style="--ak:${ampel}"><span class="label">Machbarkeit</span><p>${esc(a.machbarkeit)}</p></div>
      <div class="karte voll" style="--ak:#4fb8c9"><span class="label">Rahmen</span><dl class="kv">${a.rahmen.map((r) => `<dt>${esc(r.punkt)}</dt><dd>${esc(r.wert)}</dd>`).join('')}</dl></div>
    </div>
    <div class="spalte"><div class="karte voll" style="--ak:#e0a84a"><div class="tabs">${tabs.map(([t, l], k) => `<button data-k="${k}" class="${k ? '' : 'on'}">${t}<span class="c">${l.length}</span></button>`).join('')}</div><div id="tab"></div></div></div>
  </div>`, gateAktionen(st, 'Passt so', 'Claude erstellt den Plan …'));
  const zeigeTab = (k) => {
    $$('.tabs button').forEach((b) => b.classList.toggle('on', Number(b.dataset.k) === k));
    const l = tabs[k][1];
    $('#tab').innerHTML = `<ul class="liste">${l.length ? l.map((x) => k === 3
      ? `<li class="risiko"><div><b>${esc(x.risiko)}</b><div class="m">${esc(x.auswirkung)} → ${esc(x.massnahme)}</div></div></li>`
      : `<li>${esc(x)}</li>`).join('') : '<li class="muted">–</li>'}</ul>`;
  };
  $$('.tabs button').forEach((b) => (b.onclick = () => zeigeTab(Number(b.dataset.k))));
  tasten = (e) => /^[1-4]$/.test(e.key) && zeigeTab(e.key - 1);
  zeigeTab(0);
}

function phaseDetail(st, p, i) {
  const ov = $('#overlay');
  ov.innerHTML = `<div class="karte" style="--ak:${phasenFarbe(i)}"><span class="label">Phase ${i + 1} · ${esc(p.bereich)} · Aufwand ${esc(p.aufwand)}</span><h3>${esc(p.titel)}</h3>
    <p>${esc(p.ziel)}</p><span class="label">Schritte</span><ol>${p.checkliste.map((c, j) => `<li>${p.done?.[j] ? '✓ ' : ''}${verlinke(c)}</li>`).join('')}</ol>
    <span class="label">Fertig, wenn</span><p>${esc(p.fertig_wenn)}</p></div>`;
  ov.hidden = false;
  ov.onclick = (e) => !e.target.closest('a') && (ov.hidden = true);
}

function plan(st) {
  ansicht(st, `<div class="phasen">${st.plan.phasen.map((p, i) => `<div class="phase" data-i="${i}" style="--ak:${phasenFarbe(i)}" title="Klicken für alle Schritte">
      <span class="nr">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.titel)}</h3>
      <div><span class="chip">${esc(p.aufwand)}</span> <span class="chip">${esc(p.bereich)}</span></div>
      <p>${esc(p.ziel)}</p>
      <span class="label">Schritte</span><ol>${p.checkliste.map((c, j) => `<li>${p.done?.[j] ? '✓ ' : ''}${esc(c)}</li>`).join('')}</ol>
    </div>`).join('')}</div>`, gateAktionen(st, 'Plan freigeben', 'Claude prüft Werkzeuge und Erweiterungen …'));
  $$('.phase').forEach((el) => (el.onclick = () => phaseDetail(st, st.plan.phasen[el.dataset.i], Number(el.dataset.i))));
}

function werkzeug(st) {
  const o = st.offen;
  const balken = { vorhanden: 'var(--ok)', fehlt: 'var(--bad)', nicht_noetig: 'var(--faint)' };
  const text = { vorhanden: 'vorhanden', fehlt: 'fehlt', nicht_noetig: 'nicht nötig' };
  const wahl = (e) => e.status === 'fehlt' && ['installieren', 'eigener_skill'].includes(e.aktion);
  const zeile = (e, i) => `<label class="wz" style="--ak:${balken[e.status]}" title="${esc(e.empfehlung)}">
    <span class="t"><span>${esc(e.bedarf)}</span> <span class="chip">P${e.phase}</span> <span class="st">${text[e.status]}</span>
    <div class="e">${esc(e.empfehlung)}</div>${/^https:\/\//.test(e.quelle) ? `<div class="q">${verlinke(e.quelle)}</div>` : ''}</span>
    ${wahl(e) ? `<input type="checkbox" value="${i}" checked title="vormerken">` : ''}</label>`;
  const spalte = (art, titel) => `<div class="spalte"><span class="label">${titel}</span><div class="wz-liste">${o.eintraege.map((e, i) => [e, i]).filter(([e]) => e.art === art).map(([e, i]) => zeile(e, i)).join('') || '<p class="muted">Nichts nötig.</p>'}</div></div>`;
  const ue = st.einordnung, auto = ue?.uebersprungen || [];
  ansicht(st, `${ue ? `<div class="hinweis"><b>Projekt eingelesen:</b> ${esc(ue.begruendung)}${auto.includes('analyse') ? ' <span>Die Bedarfsanalyse hat Vibewright selbst erstellt.</span>' : ''}${auto.includes('plan') ? ' <span>Den Plan hat Vibewright aus deiner Doku übernommen.</span>' : ''}</div>` : ''}${o.korrekturen.length ? `<div class="hinweis"><b>Plan angepasst:</b> ${o.korrekturen.map(esc).join(' · ')}</div>` : ''}
    <div class="werk">${spalte('system', 'Auf diesem Rechner')}${spalte('claude', 'Für Claude')}</div>`,
  [{ text: 'Später', ghost: true, klick: neuesProjekt }, { info: 'Installiert wird nichts – Angehaktes kommt als Aufgabe in die passende Phase.' }, 'sp',
    { text: 'Übernehmen', primary: true, klick: () => schritt(st, { auswahl: $$('#inhalt input:checked').map((x) => Number(x.value)) }, 'Dateien werden geschrieben …') }]);
}

// ---------- Cockpit: nach der Laufkarte geht es hier weiter ----------
let gewaehlt = null; // im Cockpit angezeigte Phase
async function cockpitNeu() {
  if (!aktuell) return;
  const st = await api.aktualisieren(aktuell.name);
  if (!st.fehler) cockpit(st);
}

function cockpit(st) {
  aktuell = st;
  seitenleiste();
  const s = st.stand || { aktiv: 0, fortschritt: 0, naechster: '' };
  if (gewaehlt === null || gewaehlt >= st.plan.phasen.length) gewaehlt = Math.max(s.aktiv, 0);
  const p = st.plan.phasen[gewaehlt];
  const naechstIdx = gewaehlt === s.aktiv ? p.done.indexOf(false) : -1;
  const alt = fortschrittMerken(st);
  const pflege = s.aktiv < 0 && st.projekttyp === 'code'; // fertig gebaut → Pflege: Fehler und Wünsche über Issues
  // #24: nur noch nicht begonnene Phasen verschieben; offene Schritte in die nächste Phase schieben (Phase behält einen Schritt)
  const frei = (i) => st.plan.phasen[i]?.status === 'offen' && !st.plan.phasen[i].done.some(Boolean);
  const weiterGeht = !!st.plan.phasen[gewaehlt + 1] && p.checkliste.length > 1;
  ansicht(st, `<div class="fort"><div class="bar"><i style="width:${alt}%" data-ziel="${s.fortschritt}"></i></div><span class="num muted">${s.fortschritt} % · ${s.erledigt ?? 0}/${s.gesamt ?? 0} Schritte</span></div>
    <div class="cockpit">
      <div class="spalte">
        ${s.aktiv >= 0 ? `<div class="next"><span class="label">Nächster Schritt · Phase ${s.aktiv + 1}</span><div class="v">${verlinke(s.naechster)}</div></div>` : '<div class="next"><div class="v">Alle Phasen erledigt.</div></div>'}
        <div class="karte voll" style="--ak:${phasenFarbe(gewaehlt)}">
          <div class="kopf"><span class="label">Phase ${gewaehlt + 1} – ${esc(p.titel)}</span>${frei(gewaehlt) ? `<span class="umbau">
            <button class="btn ghost" data-r="-1" ${frei(gewaehlt - 1) ? '' : 'disabled'} title="Phase früher einplanen">▲</button><button class="btn ghost" data-r="1" ${frei(gewaehlt + 1) ? '' : 'disabled'} title="Phase später einplanen">▼</button></span>` : ''}</div>
          <span class="muted kompakt-weg" id="umbau-info">${esc(p.ziel)}</span>
          <div class="todo">${p.checkliste.map((c, j) => `<label class="${p.done[j] ? 'x' : ''} ${j === naechstIdx ? 'n' : ''} ${p.done[j] && frisch === `${gewaehlt}:${j}` ? 'frisch' : ''}"><input type="checkbox" data-j="${j}" ${p.done[j] ? 'checked' : ''}><span>${verlinke(c)}</span>${!p.done[j] && weiterGeht ? `<button class="btn ghost weiter" data-w="${j}" title="In die nächste Phase schieben">→</button>` : ''}</label>`).join('')}</div>
          <span class="label kompakt-weg">Fertig, wenn</span><span class="muted kompakt-weg">${esc(p.fertig_wenn)}</span>
        </div>
      </div>
      <div class="spalte"><span class="label">Phasen</span><div class="zeit">${st.plan.phasen.map((ph, i) => `<button class="${ph.status} ${i === gewaehlt ? 'on' : ''}" data-i="${i}" style="--ak:${phasenFarbe(i)}">
          <span class="nr">${String(i + 1).padStart(2, '0')}</span><span class="tt">${esc(ph.titel)}</span><span class="muted num">${ph.done.filter(Boolean).length}/${ph.checkliste.length}</span></button>`).join('')}</div>
        ${pflege ? pflegeKachel(st) : ideeKachel(st)}</div>
    </div>`,
  [{ text: 'Dashboard öffnen', klick: () => api.oeffnen(st.offen.dashboard) }, { text: 'Ordner', ghost: true, klick: () => api.ordner(st.offen.dashboard.replace(/[\\/][^\\/]+$/, '')) },
    { text: 'Regeln', ghost: true, klick: () => regelnSeite(st) },
    'sp', laeuft.has(st.name)
      ? { text: 'Zur laufenden Claude-Sitzung', primary: true, klick: () => arbeit(st) }
      : { text: st.projekttyp === 'code' && !st.repo ? 'Code-Ordner wählen & mit Claude umsetzen' : 'Mit Claude umsetzen', primary: true, klick: () => claudeStarten(st) }]);
  frisch = '';
  $$('.todo input').forEach((cb) => (cb.onchange = async () => {
    frisch = `${gewaehlt}:${cb.dataset.j}`;
    cockpit(await api.abhaken(st.name, gewaehlt, Number(cb.dataset.j), cb.checked));
  }));
  $$('.zeit button').forEach((b) => (b.onclick = () => { gewaehlt = Number(b.dataset.i); cockpit(st); }));
  const umbau = async (r, neu) => {
    if (r.fehler) return ($('#umbau-info').innerHTML = `<span class="fehltext">${esc(r.fehler)}</span>`);
    gewaehlt = neu;
    cockpit(r);
  };
  $$('.umbau button').forEach((b) => (b.onclick = async () => umbau(await api['phase-verschieben'](st.name, gewaehlt, Number(b.dataset.r)), gewaehlt + Number(b.dataset.r))));
  $$('.todo .weiter').forEach((b) => (b.onclick = async (e) => {
    e.preventDefault(); // Klick im Label soll nicht abhaken
    umbau(await api['schritt-weiter'](st.name, gewaehlt, Number(b.dataset.w)), gewaehlt);
  }));
  if (pflege) { pflegeBinden(st); pflegePruefen(st); } else ideeBinden(st, cockpit, cockpit);
}

// ---------- Pflege-Kachel: neue Issues aus dem Repo + Fehler/Wunsch melden ----------
const PFLEGE_TAKT = 30 * 60 * 1000;
const pflegeGeprueft = new Map(); // name → Zeitpunkt der letzten Prüfung
function pflegeKachel(st) {
  const neu = st.issuesNeu || [];
  const w = st.ideenWarten?.length || 0;
  const info = st.pflegeFehler ? `<span class="fehltext">${esc(st.pflegeFehler)}</span>`
    : st.ideeFehler ? `<span class="fehltext">Konnte nicht eingeordnet werden: ${esc(st.ideeFehler)}</span>`
    : w ? `${w} ${w > 1 ? 'Meldungen warten' : 'Meldung wartet'} auf das Ende des aktuellen Schritts`
    : !st.pflegeRepo ? 'Kein Repo zum Git-Konto (Einstellungen → Git) gefunden – Meldungen landen direkt im Plan.'
    : st.letzteIdee ? `✓ ${esc(st.letzteIdee)}` : 'Wird als Issue angelegt und von Claude eingeplant.';
  return `<div class="karte idee pflege" style="--ak:var(--accent)"><div class="pflege-kopf"><span class="label">Pflege<span>${st.pflegeRepo ? ` · ${esc(st.pflegeRepo)}` : ''}</span></span>${ideenKnopf(st)}</div>
    ${neu.slice(0, 3).map((x) => `<div class="issue"><span title="${esc(`#${x.nr} ${x.titel}${x.text ? `\n\n${x.text.slice(0, 400)}` : ''}`)}">${x.art === 'fehler' ? '🐞' : '✨'} #${x.nr} ${esc(x.titel)}${x.von ? ` <i class="muted">@${esc(x.von)}</i>` : ''}</span>
      <button class="btn" data-ueb="${x.nr}">Übernehmen</button><button class="btn ghost" data-ign="${x.nr}" title="Ignorieren">✕</button></div>`).join('')}
    ${neu.length > 3 ? `<span class="muted klein">+ ${neu.length - 3} weitere neue Issues</span>` : ''}
    <textarea id="idee-text" rows="2" placeholder="Fehler oder Wunsch beschreiben …">${esc(ideeEntwurf)}</textarea>
    <div class="idee-fuss"><span class="muted" id="idee-info" title="${esc(st.letzteIdee || '')}">${info}</span>
      <button class="btn" data-art="fehler">🐞 Fehler</button><button class="btn" data-art="wunsch">✨ Wunsch</button></div></div>`;
}
function pflegeBinden(st) {
  const feld = $('#idee-text');
  $('#ideen-auf').onclick = () => ideenZeigen(st, cockpit); // Meldungen und übernommene Issues landen als Ideen im Plan
  feld.oninput = () => (ideeEntwurf = feld.value); // Entwurf überlebt das Neuzeichnen
  const los = async (aufruf, warte) => {
    $$('.pflege button').forEach((b) => (b.disabled = true));
    $('#idee-info').innerHTML = `<span class="spin klein"></span> ${warte}`;
    const r = await aufruf();
    if (r.fehler) { $$('.pflege button').forEach((b) => (b.disabled = false)); $('#idee-info').textContent = r.fehler; return; }
    if (aktuell?.name === st.name) cockpit(r);
  };
  $$('.pflege [data-art]').forEach((b) => (b.onclick = () => {
    if (!feld.value.trim()) return feld.focus();
    const text = feld.value;
    los(async () => { const r = await api['pflege-melden'](st.name, b.dataset.art, text); if (!r.fehler) ideeEntwurf = ''; return r; }, 'Wird gemeldet und eingeplant …');
  }));
  $$('.pflege [data-ueb]').forEach((b) => (b.onclick = () => los(() => api['pflege-uebernehmen'](st.name, Number(b.dataset.ueb)), 'Claude plant das Issue ein …')));
  $$('.pflege [data-ign]').forEach((b) => (b.onclick = () => los(() => api['pflege-ignorieren'](st.name, Number(b.dataset.ign)), '…')));
}
// Beim Öffnen und danach alle 30 Minuten; neu gezeichnet wird nur, wenn gerade nichts eingetippt ist oder läuft
async function pflegePruefen(st) {
  if (Date.now() - (pflegeGeprueft.get(st.name) || 0) < PFLEGE_TAKT) return;
  pflegeGeprueft.set(st.name, Date.now());
  const r = await api['pflege-pruefen'](st.name);
  if (!r.fehler && aktuell?.name === st.name && $('.pflege') && !ideeEntwurf.trim() && !$('.pflege button:disabled')) cockpit(r);
}
setInterval(() => { if ($('.pflege')) cockpitNeu(); }, PFLEGE_TAKT + 1000);

// Kachel „Mir ist noch was eingefallen“: Claude ordnet den Gedanken in die passende Phase ein, danach ist die Kachel wieder leer
let ideeEntwurf = '';
function ideeKachel(st) {
  const w = st.ideenWarten?.length || 0;
  const info = st.ideeFehler ? `<span class="fehltext">Konnte nicht eingeordnet werden: ${esc(st.ideeFehler)}</span>`
    : w ? `${w} ${w > 1 ? 'Ideen warten' : 'Idee wartet'} auf das Ende des aktuellen Schritts`
    : st.letzteIdee ? `✓ ${esc(st.letzteIdee)}` : 'Claude ordnet den Gedanken in die passende Phase ein.';
  return `<div class="karte idee" style="--ak:var(--accent)"><span class="label">Mir ist noch was eingefallen</span>
    <textarea id="idee-text" rows="2" placeholder="Gedanke eintippen …">${esc(ideeEntwurf)}</textarea>
    <div class="idee-fuss"><span class="muted" id="idee-info" title="${esc(st.letzteIdee || '')}">${info}</span>${ideenKnopf(st)}<button class="btn" id="idee-los">Einarbeiten</button></div></div>`;
}
function ideeBinden(st, neuZeichnen, zurueck) {
  const feld = $('#idee-text');
  $('#ideen-auf').onclick = () => ideenZeigen(st, zurueck);
  // Feld wächst mit dem Text mit, damit nichts gescrollt werden muss (Obergrenze: halbe Fensterhöhe)
  const wachsen = () => { feld.style.height = 'auto'; feld.style.height = `${feld.scrollHeight + 2}px`; };
  const infoAlt = $('#idee-info').innerHTML;
  feld.oninput = () => { // Entwurf überlebt das Neuzeichnen durch neue Häkchen
    ideeEntwurf = feld.value;
    wachsen();
    $('#idee-info').innerHTML = feld.value.trim() ? (MAC ? '⌘+Enter oder „Einarbeiten“' : 'Strg+Enter oder „Einarbeiten“') : infoAlt; // spart Platz beim Tippen
  };
  if (ideeEntwurf) requestAnimationFrame(wachsen);
  feld.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#idee-los').click(); }; // Strg bzw. ⌘ auf dem Mac
  $('#idee-los').onclick = async () => {
    if (!feld.value.trim()) return feld.focus();
    $('#idee-los').disabled = $('#ideen-auf').disabled = true; // Liste erst wieder öffnen, wenn die Antwort neu gezeichnet ist
    $('#idee-info').innerHTML = '<span class="spin klein"></span> Claude ordnet ein …';
    const r = await api.idee(st.name, feld.value);
    if (r.fehler) { $('#idee-los').disabled = $('#ideen-auf').disabled = false; $('#idee-info').textContent = r.fehler; return; }
    ideeEntwurf = '';
    aktuell = r;
    neuZeichnen(r);
  };
}

// ---------- Ideen-Lane (#22): alle Einfälle sehen, Text korrigieren, löschen – der Plan bleibt unberührt ----------
const ideenKnopf = (st) => `<button class="btn ghost" id="ideen-auf" title="Alle Ideen ansehen, korrigieren oder löschen">Ideen (${(st.ideen?.length || 0) + (st.ideenWarten?.length || 0)})</button>`;
function ideenZeigen(st, zurueck) {
  const warten = st.ideenWarten || [], fertig = st.ideen || [];
  const text = (z) => (z.dataset.w ? warten[z.dataset.i] : fertig[z.dataset.i].text);
  const zeile = (w, i, t, zusatz) => `<div class="idee-zeile" data-w="${w}" data-i="${i}"><div class="idee-inhalt"><span>${esc(t)}</span>${zusatz}</div>
    <button class="btn ghost" data-akt="aendern">Bearbeiten</button><button class="btn ghost" data-akt="loeschen">Löschen</button></div>`;
  ansicht(st, `<div class="einst-kopf"><h2>Ideen</h2><span class="muted">Was dir während der Umsetzung eingefallen ist und wo es gelandet ist.</span></div>
    <div class="ideen-lane">
      ${warten.length ? `<div class="karte" style="--ak:#e0a84a"><span class="label">Wartet</span><span class="muted klein">Noch nicht im Plan – Claude ordnet sie nach dem aktuellen Schritt ein.</span>${warten.map((t, i) => zeile('1', i, t, '')).join('')}</div>` : ''}
      <div class="karte" style="--ak:var(--accent)"><span class="label">Eingearbeitet</span>${fertig.length ? `<span class="muted klein">Ändern oder Löschen betrifft nur diese Liste. Die Schritte im Plan bleiben stehen.</span>${fertig.map((x, i) => zeile('', i, x.text, `<span class="muted klein">${esc(x.datum)} · Phase ${esc(x.phase)}</span>`)).join('')}` : '<span class="muted">Noch keine Ideen eingearbeitet.</span>'}</div>
    </div>`, [{ text: 'Zurück', klick: () => zurueck(aktuell?.name === st.name ? aktuell : st) }]); // inzwischen abgehakte Schritte mitnehmen
  $('.kopf-akt')?.remove();
  const senden = async (z, neu) => {
    const r = await api['idee-aendern'](st.name, !!z.dataset.w, Number(z.dataset.i), text(z), neu);
    if (r.fehler) { if ($('.ideen-lane')) $('.ideen-lane .fehler')?.remove(); else ideenZeigen(st, zurueck); return $('.ideen-lane').insertAdjacentHTML('afterbegin', `<div class="fehler">${esc(r.fehler)}</div>`); }
    aktuell = r;
    ideenZeigen(r, zurueck);
  };
  $$('.idee-zeile [data-akt]').forEach((b) => (b.onclick = () => {
    const z = b.closest('.idee-zeile');
    if (b.dataset.akt === 'loeschen') return ideeLoeschenFragen(st, text(z), z.dataset.w ? 0 : fertig[z.dataset.i].phase, () => senden(z, null), () => ideenZeigen(st, zurueck));
    z.innerHTML = `<textarea rows="3" title="Idee"></textarea><button class="btn" data-akt="ok">Speichern</button><button class="btn ghost" data-akt="nein">Abbrechen</button>`;
    const feld = $('textarea', z);
    feld.value = text(z);
    feld.focus();
    $('[data-akt=nein]', z).onclick = () => ideenZeigen(st, zurueck);
    $('[data-akt=ok]', z).onclick = () => (feld.value.trim() ? senden(z, feld.value) : feld.focus());
  }));
}
// Rückfrage vor dem Löschen; phase = 0 heißt: die Idee wartet noch und steht nicht im Plan
function ideeLoeschenFragen(st, text, phase, loeschen, abbrechen) {
  ansicht(st, `<div class="mitte"><div class="box"><h2>Idee löschen?</h2><p class="idee-zitat">${esc(text)}</p>
    <p class="muted">${phase ? `Die Schritte in Phase ${esc(phase)} bleiben im Plan stehen. Entfernt wird nur der Eintrag in der Ideen-Liste.` : 'Die Idee wartet noch und steht nicht im Plan. Sie wird dann auch nicht mehr eingearbeitet.'}</p></div></div>`,
  [{ text: 'Abbrechen', ghost: true, klick: abbrechen }, 'sp', { text: 'Idee löschen', gefahr: true, klick: loeschen }]);
  $('.kopf-akt')?.remove();
}

// ---------- Claude-Sitzung im eingebetteten Terminal ----------
// Jedes Projekt hat sein eigenes Terminal; es bleibt erhalten, auch wenn man zwischendurch andere Ansichten öffnet
const terms = new Map(); // name → { term, fit, box }
function terminalFuer(name) {
  if (terms.has(name)) return terms.get(name);
  const box = document.createElement('div');
  box.className = 'term';
  const term = new Terminal({
    fontFamily: '"Cascadia Mono", Consolas, "SF Mono", Menlo, monospace', fontSize: 13, cursorBlink: true, scrollback: 5000,
    theme: { background: '#0e0f11', foreground: '#e6e6e8', cursor: '#9d8cff', selectionBackground: '#9d8cff55' },
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.onData((d) => api.senden('pty-eingabe', name, d));
  // Dateien (z. B. Screenshots bei der Fehlersuche) hineinziehen: Pfad einfügen wie in Windows Terminal – Claude Code hängt Bilder dann an
  box.addEventListener('dragover', (e) => { e.preventDefault(); box.classList.add('drop'); });
  box.addEventListener('dragleave', () => box.classList.remove('drop'));
  box.addEventListener('drop', (e) => {
    e.preventDefault(); box.classList.remove('drop');
    const pfade = [...e.dataTransfer.files].map((f) => api.dateiPfad(f)).filter(Boolean).map((p) => (/\s/.test(p) ? `"${p}"` : p));
    if (pfade.length) { term.paste(pfade.join(' ') + ' '); term.focus(); }
  });
  new ResizeObserver(() => { if (box.isConnected && box.clientWidth) { fit.fit(); api.senden('pty-groesse', name, term.cols, term.rows); } }).observe(box);
  const t = { term, fit, box };
  terms.set(name, t);
  return t;
}
function terminalAnzeigen(ziel, name) {
  const { term, fit, box } = terminalFuer(name);
  ziel.appendChild(box);
  if (!term.element) term.open(box);
  requestAnimationFrame(() => { fit.fit(); api.senden('pty-groesse', name, term.cols, term.rows); term.focus(); });
}
api.on('pty-daten', (name, d) => { terminalFuer(name).term.write(d); letzteAusgabe.set(name, Date.now()); });
api.on('pty-ende', (name) => {
  if (!laeuft.delete(name)) return;
  terms.get(name)?.term.write('\r\n\x1b[90m— Sitzung beendet —\x1b[0m\r\n');
  if (aktuell?.name === name && $('#arbeit-seite')) { tippsOffen = false; setAktionen(arbeitAktionen(aktuell)); arbeitSeite(aktuell); }
  if (aktuell?.name === name) setKopf(aktuell); // Orb verschwindet mit der Sitzung
  seitenleiste();
  limitsZeigen();
});
api.on('punkte-geaendert', async (name) => {
  if (aktuell?.name !== name) return;
  const altAktiv = aktuell.stand?.aktiv;
  const vorher = aktuell.plan?.phasen?.[Math.max(altAktiv ?? 0, 0)]?.done;
  const st = await api.aktualisieren(name);
  if (st.fehler) return;
  if (st.stand?.aktiv === altAktiv) st.vorher = vorher; // von Claude neu abgehakte Schritte ploppen auch
  aktuell = st;
  if ($('#arbeit-seite')) arbeitSeite(st);
  seitenleiste();
});

async function claudeStarten(st) {
  const r = await api['claude-starten'](st.name, 100, 30);
  if (r.fehler) return $('.next')?.insertAdjacentHTML('afterend', `<div class="fehler">${esc(r.fehler)}</div>`);
  if (!r.repo && r.projekttyp === 'code') return cockpit(r); // Ordnerauswahl abgebrochen
  terms.get(r.name)?.term.reset();
  laeuft.add(r.name);
  arbeit(r);
}

// Prompt-Tipps neben dem Terminal: ein Klick fügt den Satz ins Terminal ein (ohne Enter – ergänzen und selbst abschicken)
const TIPPS = [
  ['Erst den Plan zeigen', 'Bevor du loslegst: Zeig mir kurz deinen Plan für den nächsten Schritt und warte auf mein OK.', 'Before you start: briefly show me your plan for the next step and wait for my OK.'],
  ['Einfach erklären', 'Erklär mir in zwei, drei einfachen Sätzen, was du gerade gemacht hast und warum.', 'Explain in two or three simple sentences what you just did and why.'],
  ['Selbst ausprobieren', 'Starte das Programm, damit ich das Ergebnis selbst ausprobieren kann, und sag mir, was ich anklicken soll.', 'Start the program so I can try the result myself, and tell me what to click.'],
  ['Fehler beschreiben', 'Es klappt nicht. Das habe ich gemacht: … Das ist passiert: … Erwartet hatte ich: …', 'It does not work. What I did: … What happened: … What I expected: …'],
  ['Nur ein Schritt', 'Mach nur diesen einen Schritt fertig und prüfe ihn, bevor du weitermachst.', 'Finish only this one step and check it before you go on.'],
  ['Beweis zeigen', 'Prüf noch einmal, ob alles funktioniert (Tests oder Programm starten), und zeig mir den Beweis.', 'Check again that everything works (run the tests or the program) and show me the proof.'],
  ['Rückgängig machen', 'Mach die letzte Änderung rückgängig – sie war nicht, was ich wollte.', 'Undo the last change – it was not what I wanted.'],
];
let tippsOffen = false;
const arbeitAktionen = (st) => [
  { text: 'Zum Cockpit', ghost: true, klick: () => cockpit(aktuell) },
  ...(laeuft.has(st.name) ? [{ text: tippsOffen ? 'Checkliste' : 'Prompt-Tipps', ghost: true, klick: () => { tippsOffen = !tippsOffen; setAktionen(arbeitAktionen(aktuell)); arbeitSeite(aktuell); } }] : []),
  { info: laeuft.has(st.name) ? 'Claude arbeitet im Terminal – du entscheidest dort per Tastatur, Häkchen erscheinen rechts automatisch.' : 'Die Sitzung ist beendet.' },
  'sp',
  laeuft.has(st.name)
    ? { text: 'Sitzung beenden', klick: async () => { await api['sitzung-beenden'](st.name); } }
    : { text: 'Neue Sitzung starten', primary: true, klick: () => claudeStarten(aktuell) },
];

function arbeit(st) {
  aktuell = st;
  ansicht(st, `<div class="arbeit"><div class="term-rahmen" id="term-ziel"></div><div class="spalte" id="arbeit-seite"></div></div>`, arbeitAktionen(st));
  terminalAnzeigen($('#term-ziel'), st.name);
  arbeitSeite(st);
  seitenleiste();
}

// Rechte Spalte neben dem Terminal: nächster Schritt + Checkliste der aktuellen Phase (wird live aktualisiert)
function arbeitSeite(st) {
  if (tippsOffen && laeuft.has(st.name)) return tippsSeite(st);
  const s = st.stand || { aktiv: 0, fortschritt: 0, naechster: '' };
  const i = Math.max(s.aktiv, 0);
  const p = st.plan.phasen[i];
  const naechstIdx = p.done.indexOf(false);
  const alt = fortschrittMerken(st);
  $('#arbeit-seite').innerHTML = `
    <div class="fort"><div class="bar"><i style="width:${alt}%" data-ziel="${s.fortschritt}"></i></div><span class="num muted">${s.fortschritt} %</span></div>
    <div class="next"><span class="label">Nächster Schritt</span><div class="v" title="${esc(s.naechster)}">${verlinke(s.naechster)}</div></div>
    <div class="karte voll" style="--ak:${phasenFarbe(i)}"><span class="label">Phase ${i + 1} – ${esc(p.titel)}</span>
      <div class="todo">${p.checkliste.map((c, j) => `<label class="${p.done[j] ? 'x' : ''} ${j === naechstIdx ? 'n' : ''} ${p.done[j] && (frisch === `${i}:${j}` || (st.vorher && !st.vorher[j])) ? 'frisch' : ''}"><input type="checkbox" data-j="${j}" ${p.done[j] ? 'checked' : ''}><span>${verlinke(c)}</span></label>`).join('')}</div></div>
    ${ideeKachel(st)}`;
  frisch = '';
  requestAnimationFrame(() => $$('#arbeit-seite .bar i[data-ziel]').forEach((b) => (b.style.width = `${b.dataset.ziel}%`)));
  $$('#arbeit-seite .todo input').forEach((cb) => (cb.onchange = async () => {
    frisch = `${i}:${cb.dataset.j}`;
    const r = await api.abhaken(st.name, i, Number(cb.dataset.j), cb.checked);
    if (!r.fehler) { aktuell = r; arbeitSeite(r); seitenleiste(); }
  }));
  ideeBinden(st, (r) => { arbeitSeite(r); seitenleiste(); }, arbeit);
}
function tippsSeite(st) {
  const en = st.sprache === 'en'; // eingefügt wird in der Sprache, in der Claude mit dir spricht
  $('#arbeit-seite').innerHTML = `<div class="karte voll tipps" style="--ak:var(--accent)"><span class="label">Prompt-Tipps</span>
    <span class="muted klein">Klick fügt den Satz ins Terminal ein – ergänzen, dann Enter.</span>
    <div class="bausteine">${TIPPS.map(([n, de, e], i) => `<button class="opt" data-t="${i}" title="${esc(en ? e : de)}"><span class="imp"><b>${esc(n)}</b><span class="muted klein">${esc(en ? e : de)}</span></span></button>`).join('')}</div>
    <span class="muted klein">Tipp: Screenshots einfach ins Terminal ziehen.</span></div>`;
  $$('#arbeit-seite [data-t]').forEach((b) => (b.onclick = () => {
    const { term } = terminalFuer(st.name);
    term.paste(TIPPS[b.dataset.t][en ? 2 : 1]);
    term.focus();
  }));
}

(async () => { (await api.sitzung()).forEach((n) => laeuft.add(n)); start(); })();
