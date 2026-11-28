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
  'Aus Claude Code übernehmen': 'Import from Claude Code', 'Code-Ordner:': 'Code folder:',
  'Wähle einen Ordner, in dem du schon mit Claude Code gearbeitet hast. Vibewright plant von dort aus weiter.': 'Pick a folder you already worked on with Claude Code. Vibewright plans onward from there.',
  'Keine früheren Claude-Code-Sitzungen gefunden.': 'No earlier Claude Code sessions found.', 'Der Ordner wurde nicht gefunden.': 'The folder was not found.',
  // GitHub / Gitea
  'Aus GitHub / Gitea': 'From GitHub / Gitea', 'Aus eigenem Ordner': 'From a folder','Aus GitHub übernehmen': 'Import from GitHub', 'Aus Gitea übernehmen': 'Import from Gitea',
  'Wähle ein Repository. Vibewright lädt den Code in einen Ordner deiner Wahl und plant von dort aus weiter.': 'Pick a repository. Vibewright downloads the code into a folder of your choice and plans onward from there.',
  'Keine Repositories gefunden.': 'No repositories found.', 'privat': 'private', 'Konto ändern': 'Change account',
  'Repositories werden geladen …': 'Loading repositories …', 'Repository wird geladen …': 'Downloading repository …',
  'GitHub / Gitea verbinden': 'Connect GitHub / Gitea', 'Konto für den Import von Projekten': 'Account for importing projects',
  'Adresse deines Gitea-Servers, z. B. https://gitea.example.de': 'Address of your Gitea server, e.g. https://gitea.example.com', 'Benutzername': 'Username',
  'Token ist gespeichert – leer lassen zum Behalten': 'Token is saved – leave empty to keep it', 'Zugriffs-Token (optional, für private Repositories)': 'Access token (optional, for private repositories)',
  'Ohne Token siehst du nur öffentliche Repositories. Token mit Leserechten für Repositories anlegen:': 'Without a token you only see public repositories. Create a token with read access to repositories:',
  'in Gitea unter Einstellungen → Anwendungen': 'in Gitea under Settings → Applications',
  '. Er wird verschlüsselt auf diesem Rechner gespeichert.': '. It is stored encrypted on this computer.',
  'Token entfernen': 'Remove token', 'Speichern & testen': 'Save & test',
  'Bitte Benutzername oder Token eintragen.': 'Please enter a username or a token.', 'Anmeldung abgelehnt – bitte Token prüfen.': 'Sign-in rejected – please check the token.',
  'Bitte die Adresse deines Gitea-Servers eintragen (z. B. https://gitea.example.de).': 'Please enter the address of your Gitea server (e.g. https://gitea.example.com).',
  'Repository gehört nicht zum eingetragenen Server.': 'Repository does not belong to the configured server.', 'Unbekannter Dienst': 'Unknown service',
  'Der Ordner ist nicht leer. Bitte einen leeren oder neuen Ordner wählen.': 'The folder is not empty. Please choose an empty or new folder.',
  'Token kann auf diesem System nicht sicher gespeichert werden.': 'The token cannot be stored securely on this system.',
  // Globale Regeln
  'Globale Regeln': 'Global rules', 'Regeln, die Claude in jedem Projekt befolgt': 'Rules Claude follows in every project',
  'Claude Code befolgt sie in jedem Projekt': 'Claude Code follows them in every project', 'Bausteine': 'Building blocks',
  'Noch keine globalen Regeln. Klicke rechts auf Bausteine oder schreib eigene.': 'No global rules yet. Click building blocks on the right or write your own.',
  'Vor dem Speichern wird die alte Datei als CLAUDE.md.bak gesichert.': 'Before saving, the old file is backed up as CLAUDE.md.bak.',
  '✓ Gespeichert': '✓ Saved', 'Schwachstellen': 'Vulnerabilities', 'Geheimnisse': 'Secrets',
  // Projekt-Regeln & Prompt-Tipps
  'Regeln': 'Rules', 'Alle Projekte': 'All projects', 'Nur dieses Projekt': 'Only this project',
  'Claude Code befolgt sie nur in diesem Projekt': 'Claude Code follows them only in this project',
  'Noch keine eigenen Regeln für dieses Projekt. Klicke rechts auf Bausteine oder schreib eigene.': 'No own rules for this project yet. Click building blocks on the right or write your own.',
  'Gilt ab der nächsten Claude-Sitzung. Den Vibewright-Abschnitt der Datei pflegt die App selbst.': 'Applies from the next Claude session. The app maintains the Vibewright section of the file itself.',
  'Erst einen Code-Ordner wählen („Mit Claude umsetzen“).': 'Choose a code folder first ("Build with Claude").',
  // Agenten (#40)
  'Agenten': 'Agents', 'Claude Code nutzt sie nur in diesem Projekt': 'Claude Code uses them only in this project',
  'Claude Code kann sie in jedem Projekt nutzen': 'Claude Code can use them in every project', 'Noch keine Agenten.': 'No agents yet.',
  '+ Neu': '+ New', 'Vorlagen': 'Templates', 'Doku-Schreiber': 'Doc writer', 'Sicherheitsprüfer': 'Security checker',
  'Überdeckt den globalen Agenten mit gleichem Namen.': 'Overrides the global agent with the same name.',
  'z. B. code-reviewer': 'e.g. code-reviewer', 'Wann soll Claude ihn nutzen?': 'When should Claude use it?',
  'z. B. Nach Änderungen nutzen: prüft den Code auf Fehler.': 'e.g. Use after changes: checks the code for bugs.',
  'Wie Hauptsitzung': 'Same as main session', 'Nur lesen': 'Read only', 'Lesen und schreiben': 'Read and write', 'Alles': 'Everything',
  'Einzeln auswählen': 'Choose individually', 'Anweisungen': 'Instructions',
  'Was soll der Agent tun? Schreib es so, wie du es einem Kollegen erklären würdest.': 'What should the agent do? Write it the way you would explain it to a colleague.',
  'Claude Code übernimmt Änderungen nach wenigen Sekunden.': 'Claude Code picks up changes within a few seconds.', 'Agent löschen': 'Delete agent',
  'Die Datei wird endgültig gelöscht. Claude Code kann den Agenten danach nicht mehr nutzen.': 'The file is deleted for good. Claude Code can no longer use the agent afterwards.',
  'Diese Form kann Vibewright nicht sicher lesen – bitte von Hand bearbeiten.': 'Vibewright cannot read this form safely – please edit it by hand.',
  'Name: nur Kleinbuchstaben, Ziffern und Bindestrich, nicht mit Bindestrich am Anfang, höchstens 64 Zeichen.': 'Name: only lowercase letters, digits and hyphens, not starting with a hyphen, at most 64 characters.',
  'Mindestens ein Werkzeug wählen – oder „Alles“.': 'Choose at least one tool – or "Everything".', 'Ungültiges Modell.': 'Invalid model.', 'Dieser Name ist unter Windows reserviert.': 'This name is reserved on Windows.', 'Der Agenten-Ordner ist nicht lesbar.': 'The agents folder cannot be read.', 'Ungültige Werkzeugliste.': 'Invalid tool list.', 'Ungültiger Dateiname.': 'Invalid file name.',
  'Die Beschreibung („Wann soll Claude ihn nutzen?“) darf nicht leer sein.': 'The description ("When should Claude use it?") must not be empty.',
  '.claude/agents im Code-Ordner ist ein Link auf einen Ordner außerhalb. Bitte durch einen normalen Ordner ersetzen.': '.claude/agents in the code folder is a link to a folder outside. Please replace it with a normal folder.',
  'Prompt-Tipps': 'Prompt tips', 'Checkliste': 'Checklist', 'Klick fügt den Satz ins Terminal ein – ergänzen, dann Enter.': 'A click puts the sentence into the terminal – add to it, then press Enter.',
  'Tipp: Screenshots einfach ins Terminal ziehen.': 'Tip: just drag screenshots into the terminal.',
  'Erst den Plan zeigen': 'Show the plan first', 'Einfach erklären': 'Explain simply', 'Selbst ausprobieren': 'Try it yourself', 'Fehler beschreiben': 'Describe a problem',
  'Nur ein Schritt': 'One step only', 'Beweis zeigen': 'Show proof', 'Rückgängig machen': 'Undo',
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
  'Rechner untersuchen': 'Inspect this computer', 'Plugins abgleichen': 'Match plugins', 'Offizielle Quellen suchen': 'Find official sources', 'Links und Skills prüfen': 'Check links and skills', 'Empfehlungen schreiben': 'Write recommendations',
  'Punkte anlegen': 'Create tasks', 'Dashboard bauen': 'Build dashboard', 'Fortschritt einrichten': 'Set up progress', 'Nachdenken': 'Thinking', 'Ordnen': 'Ordering', 'Formulieren': 'Writing',
  // Fehler
  'Das hat nicht geklappt': 'That did not work', 'Der Stand ist gespeichert. Du kannst es jetzt oder später erneut versuchen.': 'Your progress is saved. You can try again now or later.',
  'Erneut versuchen': 'Try again',
  // Interview
  'Oder eigene Antwort eintippen …': 'Or type your own answer …', 'Mehrere Antworten möglich': 'Multiple answers allowed',
  // Freigaben
  'Was soll anders sein?': 'What should be different?', 'Ändern lassen': 'Request changes', 'Passt so': 'Looks good', 'Plan freigeben': 'Approve plan',
  'Ziel': 'Goal', 'Machbarkeit': 'Feasibility', 'Rahmen': 'Scope', 'Muss': 'Must-have', 'Kann später': 'Later', 'Nicht-Ziele': 'Non-goals', 'Risiken': 'Risks',
  'Schritte': 'Steps', 'Klicken für alle Schritte': 'Click for all steps', 'Fertig, wenn': 'Done when',
  'Phase früher einplanen': 'Schedule phase earlier', 'Phase später einplanen': 'Schedule phase later', 'In die nächste Phase schieben': 'Move to the next phase',
  'Nur Phasen, die noch nicht begonnen sind, lassen sich verschieben.': 'Only phases that have not started yet can be moved.', 'Dieser Schritt lässt sich nicht weiterschieben.': 'This step cannot be moved on.',
  'klein': 'small', 'mittel': 'medium', 'groß': 'large',
  // Werkzeuge
  'Auf diesem Rechner': 'On this computer', 'Für Claude': 'For Claude', 'Nichts nötig.': 'Nothing needed.', 'Plan angepasst:': 'Plan adjusted:', 'Projekt eingelesen:': 'Project read in:',
  'Die Bedarfsanalyse hat Vibewright selbst erstellt.': 'Vibewright created the needs analysis on its own.', 'Den Plan hat Vibewright aus deiner Doku übernommen.': 'Vibewright took the plan from your docs.',
  'Claude liest den Projektordner und prüft, wie weit das Projekt ist …': 'Claude reads the project folder and checks how far the project is …',
  'vorhanden': 'available', 'fehlt': 'missing', 'nicht nötig': 'not needed', 'vormerken': 'note down',
  'Installiert wird nichts – Angehaktes kommt als Aufgabe in die passende Phase.': 'Nothing gets installed – checked items become tasks in the matching phase.',
  // Cockpit & Sitzung
  'Phasen': 'Phases', 'Nächster Schritt': 'Next step', 'Alle Phasen erledigt.': 'All phases done.',
  'Dashboard öffnen': 'Open dashboard', 'Ordner': 'Folder', 'Mit Claude umsetzen': 'Build with Claude', 'Code-Ordner wählen & mit Claude umsetzen': 'Choose code folder & build with Claude',
  'Zur laufenden Claude-Sitzung': 'Back to the Claude session', 'Zum Cockpit': 'To the cockpit', 'Sitzung beenden': 'End session', 'Neue Sitzung starten': 'Start new session',
  'Claude arbeitet im Terminal – du entscheidest dort per Tastatur, Häkchen erscheinen rechts automatisch.': 'Claude works in the terminal – you decide there with your keyboard, checkmarks appear on the right automatically.',
  'Die Sitzung ist beendet.': 'The session has ended.', 'Claude arbeitet …': 'Claude is working …', 'wartet auf dich': 'waiting for you',
  'Ideen': 'Ideas', 'Alle Ideen ansehen, korrigieren oder löschen': 'See, correct or delete all ideas', 'Wartet': 'Waiting', 'Eingearbeitet': 'Added to the plan', 'Bearbeiten': 'Edit', 'Idee': 'Idea',
  'Was dir während der Umsetzung eingefallen ist und wo es gelandet ist.': 'Ideas you had during the build and where they ended up.',
  'Noch nicht im Plan – Claude ordnet sie nach dem aktuellen Schritt ein.': 'Not in the plan yet – Claude sorts them in after the current step.',
  'Ändern oder Löschen betrifft nur diese Liste. Die Schritte im Plan bleiben stehen.': 'Editing or deleting only affects this list. The steps in the plan stay.',
  'Noch keine Ideen eingearbeitet.': 'No ideas added to the plan yet.', 'Idee löschen?': 'Delete idea?', 'Idee löschen': 'Delete idea',
  'Die Idee wartet noch und steht nicht im Plan. Sie wird dann auch nicht mehr eingearbeitet.': 'The idea is still waiting and is not in the plan. It will then not be added either.',
  'Claude ordnet gerade Ideen ein – bitte gleich noch einmal versuchen.': 'Claude is sorting ideas in right now – please try again in a moment.',
  'Die Liste hat sich geändert – bitte noch einmal öffnen.': 'The list has changed – please open it again.',
  'Mir ist noch was eingefallen': 'I just had another idea', 'Pflege': 'Maintenance', 'Fertig · Pflege': 'Done · Maintenance', '🐞 Fehler': '🐞 Bug', '✨ Wunsch': '✨ Feature', 'Fehler oder Wunsch beschreiben …': 'Describe a bug or a wish …', 'Kein Repo zum Git-Konto (Einstellungen → Git) gefunden – Meldungen landen direkt im Plan.': 'No repo found for the Git account (Settings → Git) – reports go straight into the plan.', 'Wird als Issue angelegt und von Claude eingeplant.': 'Becomes an issue and Claude adds it to the plan.', 'Wird gemeldet und eingeplant …': 'Reporting and planning …', 'Claude plant das Issue ein …': 'Claude is planning the issue …', 'Ignorieren': 'Ignore', 'Bitte erst beschreiben, worum es geht.': 'Please describe it first.', 'Dieses Issue gibt es nicht mehr.': 'This issue no longer exists.', 'Für neue Issues braucht Vibewright einen Token (Einstellungen → Git → GitHub / Gitea).': 'To create issues, Vibewright needs a token (Settings → Git → GitHub / Gitea).', 'Repository nicht gefunden – bei privaten Repos ist ein Token nötig.': 'Repository not found – private repos need a token.', 'Gedanke eintippen …': 'Type your thought …', 'Einarbeiten': 'Add it',
  'Claude ordnet den Gedanken in die passende Phase ein.': 'Claude files the thought into the matching phase.', 'Claude ordnet ein …': 'Claude is sorting it in …',
  'Strg+Enter oder „Einarbeiten“': 'Ctrl+Enter or "Add it"', '⌘+Enter oder „Einarbeiten“': '⌘+Enter or "Add it"', 'Bitte erst einen Gedanken eintippen.': 'Please type a thought first.',
  // Einstellungen
  'Verbindungen zu Claude, deiner Ablage und Git': 'Connections to Claude, your storage and Git', 'Sprache': 'Language',
  'Modell': 'Model', 'am sparsamsten': 'most economical', 'Standard, schnell': 'default, fast', 'am gründlichsten': 'most thorough', 'nur mit Usage Credits': 'usage credits only',
  'Gilt für Interview, Analyse, Plan, Ideen und neue Terminal-Sitzungen. Auch im Seitenmenü wählbar.': 'Used for interview, analysis, plan, ideas and new terminal sessions. Also selectable in the sidebar.',
  'Gilt für die Planung und neue Terminal-Sitzungen': 'Used for planning and new terminal sessions',
  // Verbrauch
  'Statistik': 'Statistics', 'Überblick': 'Overview', 'Modelle': 'Models', 'Gesamt': 'All time', '7 Tage': 'Last 7 days', '30 Tage': 'Last 30 days',
  'Weniger': 'Less', 'Mehr': 'More', 'Lieblingsmodell': 'Favorite model', 'Tokens gesamt': 'Total tokens', 'Sitzungen': 'Sessions', 'Längste Sitzung': 'Longest session',
  'Aktive Tage': 'Active days', 'Längste Serie': 'Longest streak', 'Aktivster Tag': 'Most active day', 'Aktuelle Serie': 'Current streak',
  'Planung in Vibewright': 'Planning in Vibewright', 'Terminal-Sitzungen in Vibewright-Projekten': 'Terminal sessions in Vibewright projects',
  'Noch kein Verlauf.': 'No history yet.', 'Zu wenige Tage für einen Verlauf.': 'Too few days for a chart.',
  'Aufteilung nach Eingabe, Ausgabe und Cache gibt es nur für „Gesamt“.': 'The split into input, output and cache is only available for "All time".',
  'Claude Code hat noch keine Statistik angelegt. Sie entsteht, sobald du Claude Code eine Weile genutzt hast.': 'Claude Code has not created statistics yet. They appear once you have used Claude Code for a while.',
  'Claude Code speichert seine Statistik in einem neuen Format. Diese Vibewright-Version kann es noch nicht lesen – bitte auf ein Update achten.': 'Claude Code stores its statistics in a new format. This Vibewright version cannot read it yet – please watch for an update.',
  'Verbrauch': 'Usage', 'Verbrauch je Modell': 'Usage per model', 'Tokens, wie Claude Code sie meldet': 'Tokens as reported by Claude Code',
  'Planung': 'Planning', 'Terminal-Sitzungen': 'Terminal sessions', 'Eingabe': 'Input', 'Ausgabe': 'Output', 'Cache gelesen': 'Cache read', 'Cache geschrieben': 'Cache write', 'Kosten*': 'Cost*',
  'Noch kein Verbrauch erfasst.': 'No usage recorded yet.', 'Aktualisieren': 'Refresh',
  '* Geschätzt zum Listenpreis – im Abo (Pro/Max) nicht einzeln abgerechnet.': '* Estimated at list price – not billed separately on a subscription (Pro/Max).',
  'Alle Claude-Code-Sitzungen in den Projektordnern. Kosten meldet Claude Code hier nicht.': 'All Claude Code sessions in the project folders. Claude Code does not report costs here.',
  'Installationsanleitung': 'Installation guide', 'Im Browser anmelden, dann „Neu prüfen“.': 'Sign in in your browser, then click "Check again".',
  'Angemeldet per': 'Signed in with', ': Jede Nutzung wird einzeln abgerechnet. Mit einem Claude-Abo (Pro/Max) ist sie im Abo enthalten.': ': every use is billed separately. With a Claude subscription (Pro/Max) it is included.',
  'Ablage': 'Storage', 'Obsidian-Vault': 'Obsidian vault', 'Lokal als .md + .html': 'Local as .md + .html',
  'Dataview aktiv – Tabellen aktualisieren sich live': 'Dataview active – tables update live', 'Dataview fehlt – feste Tabellen': 'Dataview missing – static tables',
  'Kanban-Board erkannt': 'Kanban board detected', 'Kein Kanban-Board (Projekte-Kanban.md)': 'No kanban board (Projekte-Kanban.md)',
  'Obsidian ist nicht installiert – optional, kein Muss.': 'Obsidian is not installed – optional, not required.',
  // Ablage fehlt / liegt im Programmordner
  'Deine Ablage wurde nicht gefunden': 'Your storage folder was not found',
  'Der Ordner wurde verschoben, umbenannt oder gelöscht – zum Beispiel durch ein Programm-Update – oder das Laufwerk ist gerade nicht verbunden.': 'The folder was moved, renamed or deleted – for example by a program update – or the drive is not connected right now.',
  'Liegt der Ordner wieder an seinem Platz, sind auch deine Projekte wieder da.': 'Once the folder is back in its place, your projects are back too.',
  'Andere Ablage wählen': 'Choose another storage', 'Trotzdem weiter': 'Continue anyway',
  'Achtung: Ablage im Programmordner': 'Warning: storage inside a program folder',
  'Deine Ablage liegt im Installationsordner eines Programms. Ein Update oder eine Neuinstallation löscht diesen Ordner samt Inhalt – auch deine Projekte.': "Your storage is inside a program's installation folder. An update or reinstall deletes this folder and everything in it – including your projects.",
  'So ist es sicher: Obsidian schließen, den Vault-Ordner an einen eigenen Platz verschieben (z. B. in': 'To be safe: close Obsidian, move the vault folder to a place of its own (e.g. into',
  'Dokumente': 'Documents', '), in Obsidian „Ordner als Vault öffnen“ wählen und hier „Ablage wechseln“.': '), choose "Open folder as vault" in Obsidian and click "Change storage" here.',
  '⚠ Programmordner – nicht sicher': '⚠ Program folder – not safe', 'Ein Update von Obsidian löscht diesen Ordner': 'An Obsidian update deletes this folder',
  '⬆ Neue Version verfügbar:': '⬆ New version available:',
  '⚠ Ablage nicht gefunden': '⚠ Storage not found', 'Klicken für Details': 'Click for details',
  'Ablage wechseln': 'Change storage', 'Fehler melden': 'Report a bug', 'Ordner öffnen': 'Open folder', 'Anleitung': 'User guide', 'Lizenzen & Quellen': 'Licenses & sources',
  'Git ist nicht installiert': 'Git is not installed', 'Name und E-Mail für Commits eingetragen': 'Name and email for commits are set', 'Name und E-Mail fehlen noch': 'Name and email are missing',
  'Dein Name': 'Your name', 'E-Mail': 'Email', 'Offizieller Download:': 'Official download:', 'Speichern': 'Save',
  'Code-Ordner automatisch als Git-Projekt anlegen': 'Automatically set up the code folder as a Git project',
  'Claude macht nach jedem erledigten Schritt einen Commit – so kannst du jederzeit zurück.': 'Claude commits after every finished step – so you can always go back.',
  'Bitte Name und gültige E-Mail eintragen.': 'Please enter a name and a valid email.', 'Kein Arbeitsordner gewählt.': 'No work folder chosen.',
  'Claude Code wurde nicht gefunden. Bitte installieren und die App neu starten.': 'Claude Code was not found. Please install it and restart the app.',
  // Archivieren & Löschen
  'Archivieren': 'Archive', 'Löschen': 'Delete', 'Alles als ZIP-Datei aufheben': 'Keep everything as a ZIP file', 'Abbrechen': 'Cancel', 'Endgültig löschen': 'Delete for good',
  'Achtung:': 'Warning:', 'Mit der nächsten Bestätigung sind alle Daten dieses Projekts endgültig weg – Interview, Bedarfsanalyse, Plan, Punkte und Dashboard. Das lässt sich nicht rückgängig machen.':
    'With the next confirmation, all data of this project is gone for good – interview, needs analysis, plan, tasks and dashboard. This cannot be undone.',
  'Dein Code-Ordner bleibt erhalten:': 'Your code folder is kept:', 'Lieber aufheben? „Archivieren“ packt alles in eine ZIP-Datei.': 'Rather keep it? "Archive" packs everything into a ZIP file.',
  'Projekt wird archiviert …': 'Archiving project …', 'Dateien sammeln': 'Collect files', 'ZIP-Datei packen': 'Pack ZIP file', 'Aufräumen': 'Clean up',
  'Archiviert': 'Archived', 'Das Projekt steckt jetzt komplett in einer ZIP-Datei und ist aus der Liste verschwunden.': 'The whole project is now in a ZIP file and has been removed from the list.',
  'Zurückholen: ZIP-Datei entpacken und den Ordner wieder in die Ablage legen.': 'To restore: unzip the file and put the folder back into your storage.',
  'Im Ordner zeigen': 'Show in folder', 'Projekt nicht gefunden.': 'Project not found.',
};
const UI_EN_MUSTER = [
  [/^Stand (.+) · alle Claude-Code-Sitzungen auf diesem Rechner$/, 'As of $1 · all Claude Code sessions on this computer'],
  [/^Eingabe (\S+) · Ausgabe (\S+) · Cache gelesen (\S+) · Cache geschrieben (\S+)$/, 'Input $1 · Output $2 · Cache read $3 · Cache write $4'],
  [/^Eingabe (\S+) · Ausgabe (\S+)$/, 'Input $1 · Output $2'],
  [/^Cache (\S+) gelesen · (\S+) geschrieben$/, 'Cache $1 read · $2 write'],
  [/^Ideen \((\d+)\)$/, 'Ideas ($1)'],
  [/^Die Schritte in Phase (\d+) bleiben im Plan stehen\. Entfernt wird nur der Eintrag in der Ideen-Liste\.$/, 'The steps in phase $1 stay in the plan. Only the entry in the ideas list is removed.'],
  [/^Server antwortet mit Fehler (\d+)\.$/, 'Server responded with error $1.'],
  [/^Klonen fehlgeschlagen: (.*)$/s, 'Download failed: $1'],
  [/^Runde (\d+) · Frage (\d+) von (\d+)$/, 'Round $1 · Question $2 of $3'],
  [/^(\d+) % · (\d+)\/(\d+) Schritte$/, '$1 % · $2/$3 steps'],
  [/^(\d+) % · Phase (\d+)$/, '$1 % · phase $2'],
  [/^Nächster Schritt · Phase (\d+)$/, 'Next step · phase $1'],
  [/^Phase (\d+) · (.*) · Aufwand (.*)$/, (_m, a, b, c) => `Phase ${a} · ${b} · effort ${UI_EN[c] || c}`],
  [/^Claude Code installiert \((.*)\)$/, 'Claude Code installed ($1)'],
  [/^Angemeldet · (.*)$/, 'Signed in · $1'],
  [/^(\d+) Idee wartet auf das Ende des aktuellen Schritts$/, '$1 idea waits for the current step to finish'],
  [/^(\d+) Ideen warten auf das Ende des aktuellen Schritts$/, '$1 ideas wait for the current step to finish'],
  [/^Konnte nicht eingeordnet werden: (.*)$/, 'Could not be sorted in: $1'],
  [/^„(.*)“ löschen\?$/, 'Delete "$1"?'],
  [/^Agent „(.*)“ löschen\?$/, 'Delete agent "$1"?'],
  [/^Schlüssel (\S+) doppelt – bitte von Hand bearbeiten\.$/, 'Key $1 appears twice – please edit it by hand.'],
  [/^Es gibt schon eine Agenten-Datei (.*)\.$/, 'An agent file $1 already exists.'],
  [/^(.*) ist ein Link auf eine Datei außerhalb des Ordners\. Bitte durch eine normale Datei ersetzen\.$/, '$1 is a link to a file outside the folder. Please replace it with a normal file.'],
  [/^Archivieren fehlgeschlagen: (.*)$/s, 'Archiving failed: $1'],
  [/^„(.*)“ gibt es in der Ablage schon\. Bitte einen anderen Namen wählen – vorhandene Projekte werden nie überschrieben\.$/, '"$1" already exists. Please choose another name – existing projects are never overwritten.'],
  [/^Keine Usage Credits für dieses Modell – der Stand ist gespeichert\. Fable ist in keinem Abo enthalten. Im Seitenmenü ein anderes Modell wählen oder Credits aufladen, dann „Erneut versuchen“\. (.*)$/, 'No usage credits for this model – progress is saved. Fable is not included in any subscription. Pick another model in the sidebar or add credits, then click "Try again". $1'],
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
