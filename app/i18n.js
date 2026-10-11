// Englische Oberfläche: übersetzt die deutschen UI-Texte, sobald sie ins Fenster kommen.
// Die Ansichten bleiben unverändert deutsch geschrieben; Claude-Inhalte englischer Projekte sind ohnehin englisch.
// Das eingebettete Terminal (.term) wird nie angefasst.
const UI_EN = {
  // Rahmen & Navigation
  'Neues Projekt': 'New project', 'Projekte': 'Projects', '⚙ Einstellungen': '⚙ Settings', 'Einstellungen': 'Settings',
  'Lokal ·': 'Local ·', 'Obsidian ·': 'Obsidian ·', 'Noch keine Projekte.': 'No projects yet.', 'unterbrochen': 'interrupted', 'Claude arbeitet': 'Claude is working',
  'Interview': 'Interview', 'Bedarfsanalyse': 'Needs analysis', 'Plan': 'Plan', 'Werkzeuge': 'Tools', 'Umsetzung': 'Build',
  'Zurück': 'Back', 'Weiter': 'Next', 'Später': 'Later', 'Antworten senden': 'Send answers', 'Übernehmen': 'Apply',
  // Start & Einrichtung
  'Willkommen bei Vibewright': 'Welcome to Vibewright', 'Vibewright arbeitet mit': 'Vibewright works with',
  'im Hintergrund. Dafür brauchst du ein Claude-Abo (Pro oder Max) und Claude Code auf diesem Rechner.': 'in the background. You need a Claude subscription (Pro or Max) and Claude Code on this computer.',
  'Claude Code ist noch nicht installiert': 'Claude Code is not installed yet', 'Claude Code ist nicht installiert': 'Claude Code is not installed',
  'Angemeldet': 'Signed in', 'Noch nicht angemeldet': 'Not signed in yet', 'Nicht angemeldet': 'Not signed in',
  'So geht die Installation:': 'How to install:', 'offizielle Anleitung': 'official guide', '. Danach Vibewright neu starten.': '. Then restart Vibewright.',
  '„Anmelden“ öffnet ein Fenster und deinen Browser. Nach der Anmeldung hier auf „Erneut prüfen“.': '"Sign in" opens a window and your browser. After signing in, click "Check again".',
  'Anmelden': 'Sign in', 'Neu anmelden': 'Sign in again', 'Erneut prüfen': 'Check again', 'Neu prüfen': 'Check again',
  'Wo sollen deine Projekte liegen?': 'Where should your projects live?',
  'Gefundene Obsidian-Vaults – Dashboards, Punkte und Kanban landen dort im gewohnten Format.': 'Obsidian vaults found – dashboards, tasks and kanban go there in the usual format.',
  'Lieber lokal als .md + .html': 'Rather local as .md + .html', 'Diesen Vault nehmen': 'Use this vault',
  'Obsidian ist nicht installiert': 'Obsidian is not installed', 'i Hinweis – kein Muss': 'i Note – not required', 'Obsidian ist optional': 'Obsidian is optional',
  'Vibewright speichert alles lokal als .md-Dateien plus ein Dashboard als .html, das du im Browser öffnest.': 'Vibewright saves everything locally as .md files plus a dashboard as .html that you open in your browser.',
  'Optional: Mit': 'Optional: with', '(kostenlos) werden daraus verknüpfte Notizen mit Dashboards und Kanban.': '(free) this becomes linked notes with dashboards and kanban.',
  'Obsidian installieren': 'Install Obsidian', 'Lokal als .md + .html speichern': 'Save locally as .md + .html',
  'Obsidian herunterladen': 'Download Obsidian', 'Obsidian ist installiert': 'Obsidian is installed', 'Ordner zeigen': 'Show folder',
  'Die automatische Installation ging auf diesem Rechner nicht. Im Browser ist die offizielle Download-Seite geöffnet – installiere Obsidian von dort.': 'Automatic installation did not work on this computer. The official download page is open in your browser – install Obsidian from there.',
  'Starte Obsidian danach einmal und wähle': 'Then start Obsidian once and choose', '„Ordner als Vault öffnen“': '"Open folder as vault"',
  // Neues Projekt
  'Projektname': 'Project name', 'Deine Idee in einem Satz': 'Your idea in one sentence', "Los geht's": "Let's go", 'Werkzeug-Check': 'Tool check',
  'Name und Idee sind nötig.': 'Name and idea are required.',
  // Laden
  'Prüfe Claude Code …': 'Checking Claude Code …', 'Claude stellt die ersten Fragen zusammen …': 'Claude is preparing the first questions …',
  'Claude prüft, ob noch etwas fehlt …': 'Claude checks whether anything is missing …', 'Claude schreibt die Bedarfsanalyse …': 'Claude is writing the needs analysis …',
  'Claude erstellt den Plan …': 'Claude is creating the plan …', 'Claude prüft Werkzeuge und Erweiterungen …': 'Claude is checking tools and extensions …',
  'Dateien werden geschrieben …': 'Writing files …', 'Claude überarbeitet …': 'Claude is revising …', 'Neuer Versuch …': 'Trying again …',
  'Installiere Obsidian …': 'Installing Obsidian …', 'Claude bringt die Analyse ins neue Format …': 'Claude is converting the analysis …',
  'Claude Code suchen': 'Find Claude Code', 'Anmeldung prüfen': 'Check sign-in', 'Projekte laden': 'Load projects',
  'Idee lesen': 'Read the idea', 'Zielgruppe überlegen': 'Think about the audience', 'Lücken suchen': 'Look for gaps', 'Fragen formulieren': 'Write questions',
  'Antworten auswerten': 'Evaluate answers', 'Muss und Kann trennen': 'Separate must from could', 'Risiken abwägen': 'Weigh risks', 'Machbarkeit einschätzen': 'Assess feasibility',
  'Ziel in Phasen schneiden': 'Cut the goal into phases', 'Schritte ordnen': 'Order the steps', 'Aufwand schätzen': 'Estimate effort', 'Laufkarte zeichnen': 'Draw the roadmap',
  'Rechner untersuchen': 'Inspect this computer', 'Plugins abgleichen': 'Match plugins', 'Offizielle Quellen suchen': 'Find official sources', 'Empfehlungen schreiben': 'Write recommendations',
  'Punkte anlegen': 'Create tasks', 'Dashboard bauen': 'Build dashboard', 'Fortschritt einrichten': 'Set up progress', 'Nachdenken': 'Thinking', 'Ordnen': 'Ordering', 'Formulieren': 'Writing',
  // Fehler
  'Das hat nicht geklappt': 'That did not work', 'Der Stand ist gespeichert. Du kannst es jetzt oder später erneut versuchen.': 'Your progress is saved. You can try again now or later.',
  'Erneut versuchen': 'Try again',
  // Interview
  'Oder eigene Antwort eintippen …': 'Or type your own answer …',
  // Freigaben
  'Was soll anders sein?': 'What should be different?', 'Ändern lassen': 'Request changes', 'Passt so': 'Looks good', 'Plan freigeben': 'Approve plan',
  'Ziel': 'Goal', 'Machbarkeit': 'Feasibility', 'Rahmen': 'Scope', 'Muss': 'Must-have', 'Kann später': 'Later', 'Nicht-Ziele': 'Non-goals', 'Risiken': 'Risks',
  'Schritte': 'Steps', 'Klicken für alle Schritte': 'Click for all steps', 'Fertig, wenn': 'Done when',
  'klein': 'small', 'mittel': 'medium', 'groß': 'large',
  // Werkzeuge
  'Auf diesem Rechner': 'On this computer', 'Für Claude': 'For Claude', 'Nichts nötig.': 'Nothing needed.', 'Plan angepasst:': 'Plan adjusted:',
  'vorhanden': 'available', 'fehlt': 'missing', 'nicht nötig': 'not needed', 'vormerken': 'note down',
  'Installiert wird nichts – Angehaktes kommt als Aufgabe in die passende Phase.': 'Nothing gets installed – checked items become tasks in the matching phase.',
  // Cockpit & Sitzung
  'Phasen': 'Phases', 'Nächster Schritt': 'Next step', 'Alle Phasen erledigt.': 'All phases done.',
  'Dashboard öffnen': 'Open dashboard', 'Ordner': 'Folder', 'Mit Claude umsetzen': 'Build with Claude', 'Code-Ordner wählen & mit Claude umsetzen': 'Choose code folder & build with Claude',
  'Zur laufenden Claude-Sitzung': 'Back to the Claude session', 'Zum Cockpit': 'To the cockpit', 'Sitzung beenden': 'End session', 'Neue Sitzung starten': 'Start new session',
  'Claude arbeitet im Terminal – du entscheidest dort per Tastatur, Häkchen erscheinen rechts automatisch.': 'Claude works in the terminal – you decide there with your keyboard, checkmarks appear on the right automatically.',
  'Die Sitzung ist beendet.': 'The session has ended.', 'Claude arbeitet …': 'Claude is working …', 'wartet auf dich': 'waiting for you',
  'Mir ist noch was eingefallen': 'I just had another idea', 'Gedanke eintippen …': 'Type your thought …', 'Einarbeiten': 'Add it',
  'Claude ordnet den Gedanken in die passende Phase ein.': 'Claude files the thought into the matching phase.', 'Claude ordnet ein …': 'Claude is sorting it in …',
  'Strg+Enter oder „Einarbeiten“': 'Ctrl+Enter or "Add it"', 'Bitte erst einen Gedanken eintippen.': 'Please type a thought first.',
  // Einstellungen
  'Verbindungen zu Claude, deiner Ablage und Git': 'Connections to Claude, your storage and Git', 'Sprache': 'Language',
  'Modell für die Planung': 'Model for planning', 'am sparsamsten': 'most economical', 'Standard, schnell': 'default, fast', 'am gründlichsten': 'most thorough',
  'Gilt für Interview, Analyse, Plan und Ideen. Die Umsetzung im Terminal nutzt deine normale Claude-Code-Einstellung.': 'Used for interview, analysis, plan and ideas. The build in the terminal uses your normal Claude Code setting.',
  'Installationsanleitung': 'Installation guide', 'Im Browser anmelden, dann „Neu prüfen“.': 'Sign in in your browser, then click "Check again".',
  'Angemeldet per': 'Signed in with', ': Jede Nutzung wird einzeln abgerechnet. Mit einem Claude-Abo (Pro/Max) ist sie im Abo enthalten.': ': every use is billed separately. With a Claude subscription (Pro/Max) it is included.',
  'Ablage': 'Storage', 'Obsidian-Vault': 'Obsidian vault', 'Lokal als .md + .html': 'Local as .md + .html',
  'Dataview aktiv – Tabellen aktualisieren sich live': 'Dataview active – tables update live', 'Dataview fehlt – feste Tabellen': 'Dataview missing – static tables',
  'Kanban-Board erkannt': 'Kanban board detected', 'Kein Kanban-Board (Projekte-Kanban.md)': 'No kanban board (Projekte-Kanban.md)',
  'Obsidian ist nicht installiert – optional, kein Muss.': 'Obsidian is not installed – optional, not required.',
  'Ablage wechseln': 'Change storage', 'Ordner öffnen': 'Open folder', 'Anleitung': 'User guide', 'Lizenzen & Quellen': 'Licenses & sources',
  'Git ist nicht installiert': 'Git is not installed', 'Name und E-Mail für Commits eingetragen': 'Name and email for commits are set', 'Name und E-Mail fehlen noch': 'Name and email are missing',
  'Dein Name': 'Your name', 'E-Mail': 'Email', 'Offizieller Download:': 'Official download:', 'Speichern': 'Save',
  'Code-Ordner automatisch als Git-Projekt anlegen': 'Automatically set up the code folder as a Git project',
  'Claude macht nach jedem erledigten Schritt einen Commit – so kannst du jederzeit zurück.': 'Claude commits after every finished step – so you can always go back.',
  'Bitte Name und gültige E-Mail eintragen.': 'Please enter a name and a valid email.', 'Kein Arbeitsordner gewählt.': 'No work folder chosen.',
  'Claude Code wurde nicht gefunden. Bitte installieren und die App neu starten.': 'Claude Code was not found. Please install it and restart the app.',
};
const UI_EN_MUSTER = [
  [/^Runde (\d+) · Frage (\d+) von (\d+)( · mehrere möglich)?$/, (_m, a, b, c, d) => `Round ${a} · Question ${b} of ${c}${d ? ' · multiple allowed' : ''}`],
  [/^(\d+) % · (\d+)\/(\d+) Schritte$/, '$1 % · $2/$3 steps'],
  [/^(\d+) % · Phase (\d+)$/, '$1 % · phase $2'],
  [/^Nächster Schritt · Phase (\d+)$/, 'Next step · phase $1'],
  [/^Phase (\d+) · (.*) · Aufwand (.*)$/, 'Phase $1 · $2 · effort $3'],
  [/^Claude Code installiert \((.*)\)$/, 'Claude Code installed ($1)'],
  [/^Angemeldet · (.*)$/, 'Signed in · $1'],
  [/^(\d+) Idee wartet auf das Ende des aktuellen Schritts$/, '$1 idea waits for the current step to finish'],
  [/^(\d+) Ideen warten auf das Ende des aktuellen Schritts$/, '$1 ideas wait for the current step to finish'],
  [/^Konnte nicht eingeordnet werden: (.*)$/, 'Could not be sorted in: $1'],
  [/^„(.*)“ gibt es in der Ablage schon\. Bitte einen anderen Namen wählen – vorhandene Projekte werden nie überschrieben\.$/, '"$1" already exists. Please choose another name – existing projects are never overwritten.'],
  [/^Limit erreicht – der Stand ist gespeichert\. Später auf „Erneut versuchen“ klicken\. (.*)$/, 'Limit reached – progress is saved. Click "Try again" later. $1'],
];

let uiSprache = 'de';
function trText(t) {
  const k = t.trim();
  if (!k) return t;
  let e = UI_EN[k];
  if (e === undefined) for (const [re, f] of UI_EN_MUSTER) if (re.test(k)) { e = k.replace(re, f); break; }
  return e === undefined ? t : t.replace(k, e);
}
function uebersetze(knoten) {
  if (uiSprache !== 'en' || !knoten) return;
  if (knoten.nodeType === 3) {
    if (knoten.parentElement?.closest('.term, script, style')) return;
    const neu = trText(knoten.textContent);
    if (neu !== knoten.textContent) knoten.textContent = neu;
    return;
  }
  if (knoten.nodeType !== 1 || knoten.closest('.term')) return;
  for (const a of ['placeholder', 'title']) if (knoten.hasAttribute?.(a)) knoten.setAttribute(a, trText(knoten.getAttribute(a)));
  // Terminal samt Inhalt komplett auslassen (FILTER_REJECT überspringt den ganzen Teilbaum)
  const w = document.createTreeWalker(knoten, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    { acceptNode: (n) => (n.nodeType === 1 && n.classList.contains('term') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const texte = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 1) { for (const a of ['placeholder', 'title']) if (n.hasAttribute(a)) n.setAttribute(a, trText(n.getAttribute(a))); }
    else texte.push(n);
  }
  texte.forEach(uebersetze);
}
const beobachter = new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') uebersetze(m.target); else m.addedNodes.forEach(uebersetze); } });
function spracheSetzen(s) {
  uiSprache = s === 'en' ? 'en' : 'de';
  document.documentElement.lang = uiSprache;
  try { localStorage.setItem('sprache', uiSprache); } catch {}
  if (uiSprache === 'en') { uebersetze(document.body); beobachter.observe(document.body, { childList: true, subtree: true, characterData: true }); }
}
// Sofort beim Start (vor der ersten Anzeige) die zuletzt gewählte Sprache nehmen
try { spracheSetzen(localStorage.getItem('sprache') || 'de'); } catch {}
