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
  kopf.innerHTML = `<h1>${esc(st.name)}</h1><div class="idee">${esc(st.plan?.einzeiler || st.idee)}</div>
    <div class="steps">${SCHRITTE.map((s, i) => `${i ? '<span class="ln"></span>' : ''}<span class="st ${i < n ? 'done' : i === n ? 'now' : ''}"><i>${i < n ? '✓' : i + 1}</i>${s}</span>`).join('')}
    ${n === 4 && typeof sitzungName !== 'undefined' && sitzungName === st.name ? '<span class="kopf-orb" id="kopf-orb"><span class="mini-orb"><i></i><i></i><i></i></span><span class="was"></span></span>' : ''}</div>`;
  orbAktualisieren();
}

// Orb neben „Umsetzung“: kreist, solange im Terminal Ausgaben fließen (Claude arbeitet), ruht, wenn Claude auf dich wartet
let letzteAusgabe = 0;
function orbAktualisieren() {
  const o = $('#kopf-orb');
  if (!o) return;
  const aktiv = Date.now() - letzteAusgabe < 1500;
  o.classList.toggle('aktiv', aktiv);
  o.querySelector('.was').textContent = aktiv ? 'Claude arbeitet …' : 'wartet auf dich';
}
setInterval(orbAktualisieren, 400);

// Fußleiste: links Nebenaktionen, rechts die Hauptaktion. Elemente: {text, primary, ghost, klick, id} oder {input, platzhalter} oder 'sp'
function setAktionen(liste = [], ziel = aktionen) {
  ziel.innerHTML = liste.map((a, i) => a === 'sp' ? '<span class="sp"></span>'
    : a.info ? `<span class="muted" style="font-size:12.5px">${esc(a.info)}</span>`
    : a.input ? `<input type="text" id="${a.input}" placeholder="${esc(a.platzhalter)}">`
    : `<button class="btn ${a.primary ? 'primary' : ''} ${a.ghost ? 'ghost' : ''}" data-i="${i}" ${a.id ? `id="${a.id}"` : ''}>${esc(a.text)}</button>`).join('');
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
  if (liste.fehler) return;
  $('#liste').innerHTML = liste.length ? liste.map((p) => {
    const s = sitzungName === p.name ? '<span class="live">●</span> Claude arbeitet'
      : p.offen?.typ === 'fertig' ? `${p.stand?.fortschritt ?? 0} % · Phase ${(p.stand?.aktiv ?? 0) + 1}` : SCHRITTE[schrittNr(p)];
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
  werkzeug: ['Rechner untersuchen', 'Plugins abgleichen', 'Offizielle Quellen suchen', 'Empfehlungen schreiben'],
  schreiben: ['Punkte anlegen', 'Dashboard bauen', 'Fortschritt einrichten'],
  standard: ['Nachdenken', 'Ordnen', 'Formulieren'],
};
function arbeitFuer(text) {
  if (/Prüfe/.test(text)) return [ARBEIT.start, 4];
  if (/Fragen|fehlt/.test(text)) return [ARBEIT.fragen, 12];
  if (/Bedarfsanalyse/.test(text)) return [ARBEIT.analyse, 18];
  if (/Plan/.test(text)) return [ARBEIT.plan, 18];
  if (/Werkzeug/.test(text)) return [ARBEIT.werkzeug, 28];
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
  $('#meta').innerHTML = `${checks.claude ? `Claude Code ${esc(checks.version.split(' ')[0])} · ${esc(checks.abo || '–')}<br>` : ''}
    ${settings.ablage ? `${settings.modus === 'obsidian' ? 'Obsidian' : 'Lokal'} · ` : ''}<button id="einst-link">⚙ Einstellungen</button>
    <span class="sprachwahl"><button data-s="de" title="Deutsch" class="${uiSprache === 'de' ? 'on' : ''}">${FLAGGEN.de}</button><button data-s="en" title="English" class="${uiSprache === 'en' ? 'on' : ''}">${FLAGGEN.en}</button></span>`;
  $('#einst-link').onclick = einstellungen;
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
  await seitenleiste();
  aktuell ? zeige(await api.laden(aktuell.name)) : neuesProjekt();
}

function ablageWaehlen(vaults) {
  aktuell = null;
  if (vaults.length) {
    ansicht(null, `<div class="mitte"><div class="box"><h2>Wo sollen deine Projekte liegen?</h2>
      <p class="muted">Gefundene Obsidian-Vaults – Dashboards, Punkte und Kanban landen dort im gewohnten Format.</p>
      ${vaults.map((v, i) => `<label class="opt ${i ? '' : 'on'}"><input type="radio" name="v" value="${esc(v)}" ${i ? '' : 'checked'} hidden>${esc(v)}</label>`).join('')}
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
const MODELLE = [['haiku', 'Haiku', 'am sparsamsten'], ['sonnet', 'Sonnet', 'Standard, schnell'], ['opus', 'Opus', 'am gründlichsten']];
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
    <div class="karte" style="--ak:var(--accent)"><span class="label">Claude</span>
      ${punkt(c.claude, c.claude ? `Claude Code ${esc(c.version.split(' ')[0])}` : 'Claude Code ist nicht installiert')}
      ${c.claude ? punkt(c.loggedIn, c.loggedIn ? `Angemeldet${c.abo ? ` · ${esc(c.abo)}` : ''}` : 'Nicht angemeldet') : ''}
      ${c.apiKey ? '<div class="hinweis klein" style="margin:0">Angemeldet per <b>API-Key</b>: Jede Nutzung wird einzeln abgerechnet. Mit einem Claude-Abo (Pro/Max) ist sie im Abo enthalten.</div>' : ''}
      <span class="label" style="margin-top:8px">Modell für die Planung</span>
      <div class="seg">${MODELLE.map(([m, n, d]) => `<button data-m="${m}" class="${e.modell === m ? 'on' : ''}">${n}<small>${d}</small></button>`).join('')}</div>
      <span class="muted klein">Gilt für Interview, Analyse, Plan und Ideen. Die Umsetzung im Terminal nutzt deine normale Claude-Code-Einstellung.</span>
      <div class="unten" id="claude-unten">${c.claude ? `<button class="btn ${c.loggedIn ? '' : 'primary'}" id="anmelden">${c.loggedIn ? 'Neu anmelden' : 'Anmelden'}</button>` : '<a href="#" data-url="https://docs.claude.com/en/docs/claude-code/setup">Installationsanleitung</a>'}<button class="btn ghost" id="pruefen">Neu prüfen</button></div>
    </div>
    <div class="karte" style="--ak:#4fb8c9"><span class="label">Ablage</span>
      ${punkt(true, a.modus === 'obsidian' ? 'Obsidian-Vault' : 'Lokal als .md + .html')}
      <div class="muted pfad">${esc(a.ablage || '–')}</div>
      ${a.modus === 'obsidian' ? punkt(a.dataview, a.dataview ? 'Dataview aktiv – Tabellen aktualisieren sich live' : 'Dataview fehlt – feste Tabellen') : ''}
      ${a.modus === 'obsidian' ? punkt(a.kanban, a.kanban ? 'Kanban-Board erkannt' : 'Kein Kanban-Board (Projekte-Kanban.md)') : ''}
      ${!e.vaults.length ? '<span class="muted klein">Obsidian ist nicht installiert – optional, kein Muss.</span>' : ''}
      <div class="unten"><button class="btn" id="ablage">Ablage wechseln</button>${!e.vaults.length ? '<button class="btn" id="obs-inst">Obsidian installieren</button>' : ''}<button class="btn ghost" id="ordner">Ordner öffnen</button></div>
    </div>
    <div class="karte" style="--ak:#e0a84a"><span class="label">Git</span>
      ${punkt(g.installiert, g.installiert ? `Git ${esc(g.version)}` : 'Git ist nicht installiert')}
      ${g.installiert ? `${punkt(g.name && g.email, g.name && g.email ? 'Name und E-Mail für Commits eingetragen' : 'Name und E-Mail fehlen noch')}
        <input type="text" id="g-name" placeholder="Dein Name" value="${esc(g.name)}">
        <input type="text" id="g-mail" placeholder="E-Mail" value="${esc(g.email)}">`
        : '<span class="muted klein">Offizieller Download: <a href="#" data-url="https://git-scm.com/download/win">git-scm.com/download/win</a></span>'}
      <label class="schalter"><input type="checkbox" id="g-auto" ${e.gitAuto ? 'checked' : ''}><span>Code-Ordner automatisch als Git-Projekt anlegen<small>Claude macht nach jedem erledigten Schritt einen Commit – so kannst du jederzeit zurück.</small></span></label>
      <div class="unten">${g.installiert ? '<button class="btn" id="g-speichern">Speichern</button>' : ''}<span class="muted klein" id="g-info"></span></div>
    </div>
  </div>`, [{ text: 'Zurück', ghost: true, klick: start }, 'sp',
    { text: 'Anleitung', ghost: true, klick: () => api.link(`https://github.com/neodk2004/vibewright/blob/main/docs/${uiSprache === 'en' ? 'user-guide' : 'anleitung'}.md`) },
    { text: 'Lizenzen & Quellen', ghost: true, klick: () => api.link('https://github.com/neodk2004/vibewright/blob/main/THIRD_PARTY_NOTICES.md') },
    { info: 'Vibewright 0.1.0 · © 2026 neodk2004 · MIT License' }]);
  $$('.seg button[data-m]').forEach((b) => (b.onclick = async () => { await api.einstellung('modell', b.dataset.m); einstellungen(); }));
  $$('.seg button[data-s]').forEach((b) => (b.onclick = () => spracheWechseln(b.dataset.s)));
  $('#anmelden')?.addEventListener('click', async () => { await api['claude-anmelden'](); $('#claude-unten').insertAdjacentHTML('beforeend', '<span class="muted klein">Im Browser anmelden, dann „Neu prüfen“.</span>'); });
  $('#pruefen').onclick = einstellungen;
  $('#ablage').onclick = () => ablageWaehlen(e.vaults);
  $('#obs-inst')?.addEventListener('click', obsidianInstallieren);
  $('#ordner').onclick = () => api.ordner(a.ablage);
  $('#g-auto').onchange = (ev) => api.einstellung('gitAuto', ev.target.checked);
  $('#g-speichern')?.addEventListener('click', async () => {
    const r = await api['git-identitaet']($('#g-name').value, $('#g-mail').value);
    if (r.fehler) return ($('#g-info').innerHTML = `<span class="fehltext">${esc(r.fehler)}</span>`);
    einstellungen();
  });
}

// ---------- Neues Projekt ----------
function neuesProjekt() {
  aktuell = null;
  seitenleiste();
  ansicht(null, `<div class="mitte"><div class="box"><h2>Neues Projekt</h2>
    <input type="text" id="name" placeholder="Projektname">
    <textarea id="idee" rows="2" placeholder="Deine Idee in einem Satz"></textarea>
    <div class="ablauf"><span>Interview</span><span>Bedarfsanalyse</span><span>Plan</span><span>Werkzeug-Check</span><span>Umsetzung</span></div>
    </div></div>`, ['sp', { text: 'Los geht\'s', primary: true, klick: anlegen }]);
  $('#name').focus();
  $('#idee').addEventListener('keydown', (e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), anlegen()));
}
async function anlegen() {
  const st = await api.neu($('#name').value, $('#idee').value);
  if (st.fehler) return ($('.box .fehler')?.remove(), $('.box').insertAdjacentHTML('beforeend', `<div class="fehler">${esc(st.fehler)}</div>`));
  aktuell = st;
  seitenleiste();
  schritt(st, {}, 'Claude stellt die ersten Fragen zusammen …');
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
        <span class="label">Runde ${runde} · Frage ${i + 1} von ${fr.length}${f.mehrfach ? ' · mehrere möglich' : ''}</span>
        <span class="punkte">${fr.map((_x, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('')}</span></div>
      <div class="q">${esc(f.frage)}</div>
      <div class="opts">${f.optionen.map((op, j) => `<button class="opt ${a.wahl.includes(op) ? 'on' : ''}" data-j="${j}"><kbd>${j + 1}</kbd><span>${esc(op)}</span></button>`).join('')}</div>
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
    <p>${esc(p.ziel)}</p><span class="label">Schritte</span><ol>${p.checkliste.map((c) => `<li>${verlinke(c)}</li>`).join('')}</ol>
    <span class="label">Fertig, wenn</span><p>${esc(p.fertig_wenn)}</p></div>`;
  ov.hidden = false;
  ov.onclick = (e) => !e.target.closest('a') && (ov.hidden = true);
}

function plan(st) {
  ansicht(st, `<div class="phasen">${st.plan.phasen.map((p, i) => `<div class="phase" data-i="${i}" style="--ak:${phasenFarbe(i)}" title="Klicken für alle Schritte">
      <span class="nr">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.titel)}</h3>
      <div><span class="chip">${esc(p.aufwand)}</span> <span class="chip">${esc(p.bereich)}</span></div>
      <p>${esc(p.ziel)}</p>
      <span class="label">Schritte</span><ol>${p.checkliste.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
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
  ansicht(st, `${o.korrekturen.length ? `<div class="hinweis"><b>Plan angepasst:</b> ${o.korrekturen.map(esc).join(' · ')}</div>` : ''}
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
  ansicht(st, `<div class="fort"><div class="bar"><i style="width:${alt}%" data-ziel="${s.fortschritt}"></i></div><span class="num muted">${s.fortschritt} % · ${s.erledigt ?? 0}/${s.gesamt ?? 0} Schritte</span></div>
    <div class="cockpit">
      <div class="spalte">
        ${s.aktiv >= 0 ? `<div class="next"><span class="label">Nächster Schritt · Phase ${s.aktiv + 1}</span><div class="v">${verlinke(s.naechster)}</div></div>` : '<div class="next"><div class="v">Alle Phasen erledigt.</div></div>'}
        <div class="karte voll" style="--ak:${phasenFarbe(gewaehlt)}">
          <span class="label">Phase ${gewaehlt + 1} – ${esc(p.titel)}</span><span class="muted kompakt-weg">${esc(p.ziel)}</span>
          <div class="todo">${p.checkliste.map((c, j) => `<label class="${p.done[j] ? 'x' : ''} ${j === naechstIdx ? 'n' : ''} ${p.done[j] && frisch === `${gewaehlt}:${j}` ? 'frisch' : ''}"><input type="checkbox" data-j="${j}" ${p.done[j] ? 'checked' : ''}><span>${verlinke(c)}</span></label>`).join('')}</div>
          <span class="label kompakt-weg">Fertig, wenn</span><span class="muted kompakt-weg">${esc(p.fertig_wenn)}</span>
        </div>
      </div>
      <div class="spalte"><span class="label">Phasen</span><div class="zeit">${st.plan.phasen.map((ph, i) => `<button class="${ph.status} ${i === gewaehlt ? 'on' : ''}" data-i="${i}" style="--ak:${phasenFarbe(i)}">
          <span class="nr">${String(i + 1).padStart(2, '0')}</span><span class="tt">${esc(ph.titel)}</span><span class="muted num">${ph.done.filter(Boolean).length}/${ph.checkliste.length}</span></button>`).join('')}</div>
        ${ideeKachel(st)}</div>
    </div>`,
  [{ text: 'Dashboard öffnen', klick: () => api.oeffnen(st.offen.dashboard) }, { text: 'Ordner', ghost: true, klick: () => api.ordner(st.offen.dashboard.replace(/[\\/][^\\/]+$/, '')) },
    'sp', sitzungName === st.name
      ? { text: 'Zur laufenden Claude-Sitzung', primary: true, klick: () => arbeit(st) }
      : { text: st.projekttyp === 'code' && !st.repo ? 'Code-Ordner wählen & mit Claude umsetzen' : 'Mit Claude umsetzen', primary: true, klick: () => claudeStarten(st) }]);
  frisch = '';
  $$('.todo input').forEach((cb) => (cb.onchange = async () => {
    frisch = `${gewaehlt}:${cb.dataset.j}`;
    cockpit(await api.abhaken(st.name, gewaehlt, Number(cb.dataset.j), cb.checked));
  }));
  $$('.zeit button').forEach((b) => (b.onclick = () => { gewaehlt = Number(b.dataset.i); cockpit(st); }));
  ideeBinden(st, cockpit);
}

// Kachel „Mir ist noch was eingefallen“: Claude ordnet den Gedanken in die passende Phase ein, danach ist die Kachel wieder leer
let ideeEntwurf = '';
function ideeKachel(st) {
  const w = st.ideenWarten?.length || 0;
  const info = st.ideeFehler ? `<span class="fehltext">Konnte nicht eingeordnet werden: ${esc(st.ideeFehler)}</span>`
    : w ? `${w} ${w > 1 ? 'Ideen warten' : 'Idee wartet'} auf das Ende des aktuellen Schritts`
    : st.letzteIdee ? `✓ ${esc(st.letzteIdee)}` : 'Claude ordnet den Gedanken in die passende Phase ein.';
  return `<div class="karte idee" style="--ak:var(--accent)"><span class="label">Mir ist noch was eingefallen</span>
    <textarea id="idee-text" rows="2" placeholder="Gedanke eintippen …">${esc(ideeEntwurf)}</textarea>
    <div class="idee-fuss"><span class="muted" id="idee-info" title="${esc(st.letzteIdee || '')}">${info}</span><button class="btn" id="idee-los">Einarbeiten</button></div></div>`;
}
function ideeBinden(st, neuZeichnen) {
  const feld = $('#idee-text');
  // Feld wächst mit dem Text mit, damit nichts gescrollt werden muss (Obergrenze: halbe Fensterhöhe)
  const wachsen = () => { feld.style.height = 'auto'; feld.style.height = `${feld.scrollHeight + 2}px`; };
  const infoAlt = $('#idee-info').innerHTML;
  feld.oninput = () => { // Entwurf überlebt das Neuzeichnen durch neue Häkchen
    ideeEntwurf = feld.value;
    wachsen();
    $('#idee-info').innerHTML = feld.value.trim() ? 'Strg+Enter oder „Einarbeiten“' : infoAlt; // spart Platz beim Tippen
  };
  if (ideeEntwurf) requestAnimationFrame(wachsen);
  feld.onkeydown = (e) => { if (e.key === 'Enter' && e.ctrlKey) $('#idee-los').click(); };
  $('#idee-los').onclick = async () => {
    if (!feld.value.trim()) return feld.focus();
    $('#idee-los').disabled = true;
    $('#idee-info').innerHTML = '<span class="spin klein"></span> Claude ordnet ein …';
    const r = await api.idee(st.name, feld.value);
    if (r.fehler) { $('#idee-los').disabled = false; $('#idee-info').textContent = r.fehler; return; }
    ideeEntwurf = '';
    aktuell = r;
    neuZeichnen(r);
  };
}

// ---------- Claude-Sitzung im eingebetteten Terminal ----------
// Das Terminal-Element bleibt erhalten, auch wenn man zwischendurch andere Ansichten öffnet
let term = null, fit = null, sitzungName = null;
const termBox = document.createElement('div');
termBox.className = 'term';
function terminalAnzeigen(ziel) {
  ziel.appendChild(termBox);
  if (!term) {
    term = new Terminal({
      fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 13, cursorBlink: true, scrollback: 5000,
      theme: { background: '#0e0f11', foreground: '#e6e6e8', cursor: '#9d8cff', selectionBackground: '#9d8cff55' },
    });
    fit = new FitAddon.FitAddon();
    term.loadAddon(fit);
    term.open(termBox);
    term.onData((d) => api.senden('pty-eingabe', d));
    new ResizeObserver(() => { if (termBox.isConnected && termBox.clientWidth) { fit.fit(); api.senden('pty-groesse', term.cols, term.rows); } }).observe(termBox);
  }
  requestAnimationFrame(() => { fit.fit(); api.senden('pty-groesse', term.cols, term.rows); term.focus(); });
}
api.on('pty-daten', (d) => { term?.write(d); letzteAusgabe = Date.now(); });
api.on('pty-ende', (name) => {
  if (sitzungName !== name) return;
  sitzungName = null;
  term?.write('\r\n\x1b[90m— Sitzung beendet —\x1b[0m\r\n');
  if (aktuell?.name === name && $('#arbeit-seite')) setAktionen(arbeitAktionen(aktuell));
  if (aktuell?.name === name) setKopf(aktuell); // Orb verschwindet mit der Sitzung
  seitenleiste();
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
  term?.reset();
  sitzungName = r.name;
  arbeit(r);
}

const arbeitAktionen = (st) => [
  { text: 'Zum Cockpit', ghost: true, klick: () => cockpit(aktuell) },
  { info: sitzungName === st.name ? 'Claude arbeitet im Terminal – du entscheidest dort per Tastatur, Häkchen erscheinen rechts automatisch.' : 'Die Sitzung ist beendet.' },
  'sp',
  sitzungName === st.name
    ? { text: 'Sitzung beenden', klick: async () => { await api['sitzung-beenden'](); } }
    : { text: 'Neue Sitzung starten', primary: true, klick: () => claudeStarten(aktuell) },
];

function arbeit(st) {
  aktuell = st;
  ansicht(st, `<div class="arbeit"><div class="term-rahmen" id="term-ziel"></div><div class="spalte" id="arbeit-seite"></div></div>`, arbeitAktionen(st));
  terminalAnzeigen($('#term-ziel'));
  arbeitSeite(st);
  seitenleiste();
}

// Rechte Spalte neben dem Terminal: nächster Schritt + Checkliste der aktuellen Phase (wird live aktualisiert)
function arbeitSeite(st) {
  const s = st.stand || { aktiv: 0, fortschritt: 0, naechster: '' };
  const i = Math.max(s.aktiv, 0);
  const p = st.plan.phasen[i];
  const naechstIdx = p.done.indexOf(false);
  const alt = fortschrittMerken(st);
  $('#arbeit-seite').innerHTML = `
    <div class="fort"><div class="bar"><i style="width:${alt}%" data-ziel="${s.fortschritt}"></i></div><span class="num muted">${s.fortschritt} %</span></div>
    <div class="next"><span class="label">Nächster Schritt</span><div class="v">${verlinke(s.naechster)}</div></div>
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
  ideeBinden(st, (r) => { arbeitSeite(r); seitenleiste(); });
}

(async () => { sitzungName = await api.sitzung(); start(); })();
