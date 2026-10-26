# Vibewright – Anleitung

*You vibe. It builds.* Diese Anleitung führt durch alles, was Vibewright kann – vom ersten Start bis zum fertigen Projekt.
🇬🇧 English version: [user-guide.md](user-guide.md) · Für Entwickler: [developer-guide.md](developer-guide.md)

---

## Inhalt

1. [Voraussetzungen](#1-voraussetzungen)
2. [Erster Start](#2-erster-start)
3. [Projekt anlegen](#3-projekt-anlegen)
4. [Interview](#4-interview)
5. [Bedarfsanalyse](#5-bedarfsanalyse)
6. [Plan](#6-plan)
7. [Werkzeug-Check](#7-werkzeug-check)
8. [Die Dateien](#8-die-dateien)
9. [Cockpit](#9-cockpit)
10. [Mit Claude umsetzen](#10-mit-claude-umsetzen)
11. [„Mir ist noch was eingefallen“](#11-mir-ist-noch-was-eingefallen)
12. [Einstellungen](#12-einstellungen)
13. [Sprache](#13-sprache)
14. [Limits, Fehler und Pausen](#14-limits-fehler-und-pausen)
15. [Probleme & häufige Fragen](#15-probleme--häufige-fragen)

---

## 1. Voraussetzungen

- **Windows 10 oder 11** (64 Bit) oder **macOS 11 Big Sur oder neuer** (Apple Silicon oder Intel)
- **Claude Code**, installiert und angemeldet – siehe [offizielle Anleitung](https://docs.claude.com/en/docs/claude-code/setup). Nativer Installer und npm-Installation funktionieren beide.
- Ein **Claude-Abo** (Pro oder Max empfohlen). Mit API-Key geht es auch, dann wird aber jede Nutzung einzeln abgerechnet – Vibewright weist darauf hin.

Optional: **Obsidian** (mit den Community-Plugins *Dataview* und *Kanban*) und **Git**.

## 2. Erster Start

1. Ein Splash-Screen erscheint für etwa zwei Sekunden.
2. Vibewright prüft, ob Claude Code installiert und angemeldet ist. Fehlt die Anmeldung: **Anmelden** klicken, im Browser anmelden, dann **Erneut prüfen**.
3. **Ablage wählen:** einen gefundenen Obsidian-Vault oder **lokal als .md + .html** (in `Dokumente\Vibewright`, mit HTML-Dashboard für den Browser). Obsidian ist kein Muss; ist die automatische Installation nicht möglich, öffnet Vibewright die offizielle Download-Seite.

Alles lässt sich später in den [Einstellungen](#12-einstellungen) ändern.

## 3. Projekt anlegen

**Neues Projekt** → **Name** und **Idee in einem Satz** → **Los geht's** (oder Enter). Gibt es den Namen schon, fragt Vibewright nach einem anderen – vorhandene Projekte werden nie überschrieben.

## 4. Interview

Claude stellt **bis zu zwei Runden mit je bis zu vier Fragen** zu Zielgruppe, Muss-Umfang, Plattform, Erfahrung, Zeit pro Woche und Abgrenzung.

- Eine Frage pro Bildschirm, Antwort per Klick oder Taste **1–4**.
- Einzelauswahl springt automatisch weiter, bei Mehrfachauswahl **Weiter** (oder Enter).
- Passt nichts? **Eigene Antwort** eintippen. **Zurück** geht eine Frage zurück.

## 5. Bedarfsanalyse

🚦 *Erste Freigabe.* Links **Ziel**, **Machbarkeit** (Ampel) und **Rahmen**, rechts die Reiter **Muss**, **Kann später**, **Nicht-Ziele**, **Risiken** (Tasten 1–4).
**Passt so** → weiter. Sonst Wunsch eintippen und **Ändern lassen**. **Später** → Projekt verlassen und später weitermachen.

## 6. Plan

🚦 *Zweite Freigabe.* **3–6 Phasen** nebeneinander, Phase 1 ist immer der kleinste lauffähige Stand. Ein Klick auf eine Phase zeigt alle Schritte und „Fertig, wenn“. Die Schritte sind in Laiensprache geschrieben, Programme kommen von den offiziellen Download-Seiten.

## 7. Werkzeug-Check

🚦 *Dritte Freigabe.* Vibewright prüft **deinen Rechner** und **dein Claude-Setup** (Plugins, Skills, MCP).
Balken: 🟥 fehlt · 🟩 vorhanden · ⬜ nicht nötig. Fehlendes ist vorausgewählt. **Installiert wird nichts** – Angehaktes wird zur Aufgabe in der passenden Phase (Installationen oben, eigene Projekt-Skills unten). Widersprüche zum Plan korrigiert Claude und zeigt sie oben an. **Übernehmen** schreibt alle Dateien.

**Woher die Vorschläge kommen**
- **Dein Rechner:** installierte Programme (prüft Vibewright selbst), deine Claude-Plugins samt ihrer Skills, eigene Skills (auch im Code-Ordner des Projekts) und MCP-Server.
- **Plugin-Kataloge:** alle Marktplätze, die du in Claude Code eingebunden hast (der offizielle zuerst), dazu der Katalog [claude-skills](https://github.com/alirezarezvani/claude-skills) – auch wenn du ihn noch nicht eingebunden hast.
- **[SkillsMP](https://skillsmp.com):** Passt nichts aus den Katalogen, sucht Vibewright dort nach einem fertigen Skill. In Frage kommen nur Skills aus GitHub-Repos mit **mindestens 50.000 Sternen**, die **Claude-kompatibel** sind (gültige `SKILL.md` in einem Repo, das ein Claude-Plugin ist oder den Skill unter `.claude/skills` hat). Claude übernimmt einen nur, wenn er wirklich passt.
- **Download-Links** werden geprüft: Ist einer tot, ersetzt Claude ihn durch die aktuelle Herstellerseite; klappt auch das nicht, steht ⚠ davor.

## 8. Die Dateien

```
Vogelhaus/
├── Vogelhaus – Dashboard.md       Fortschritt, nächster Schritt, Wiedereinstieg, Tabellen
├── Vogelhaus – Dashboard.html     nur bei lokaler Ablage
├── Vogelhaus – Interview.md
├── Vogelhaus – Bedarfsanalyse.md
├── Vogelhaus – Plan.md
├── Vogelhaus – Werkzeug-Check.md
├── Vogelhaus – Ideen.md           sobald du eine Idee einarbeitest
├── Punkte/                        eine Notiz pro Phase mit Checkliste
└── projekthelper-state.json       interner Zustand – bitte nicht bearbeiten
```

Mit **Dataview** gibt es Live-Tabellen, sonst feste Tabellen, die Vibewright bei jeder Änderung neu schreibt. Hat dein Vault eine `Projekte-Kanban.md` mit Spalte `## Backlog`, landen neue Projekte dort. Du kannst auch direkt in Obsidian abhaken – Vibewright liest es ein.

## 9. Cockpit

Oben der **nächste Schritt**, in der Mitte die aktuelle **Phase** mit Checkliste, rechts alle **Phasen**. Abhaken → Häkchen ploppt, Balken gleitet, Dashboard wird aktualisiert; ganze Phase fertig → 🎉 Konfetti. **Dashboard öffnen** und **Ordner** öffnen das Projekt.

## 10. Mit Claude umsetzen

1. **Nur bei Code-Projekten, beim ersten Mal:** Ordner für den Code wählen.
2. Ist es in den Einstellungen aktiviert und Git installiert, wird der Ordner ein **Git-Projekt** mit erstem Commit.
3. Vibewright schreibt eine **`CLAUDE.md`** mit Projekt, Unterlagen, aktueller Phase, nächstem Schritt und Regeln. Eigene Inhalte einer vorhandenen `CLAUDE.md` bleiben erhalten.
4. **Claude Code startet im Terminal in der App.** Beim ersten Mal fragt Claude, ob du dem Ordner vertraust (Pfeiltasten + Enter).

Während Claude arbeitet: Rückfragen und Freigaben beantwortest du **im Terminal per Tastatur**. Neben **Umsetzung** kreist ein Orb, solange Claude arbeitet, und zeigt **„wartet auf dich“**, wenn du dran bist. Erledigte Schritte hakt Claude ab, die Checkliste rechts zieht live mit. **Zum Cockpit** lässt Claude weiterlaufen, **Sitzung beenden** stoppt ihn. Es läuft immer eine Sitzung gleichzeitig.

## 11. „Mir ist noch was eingefallen“

Gedanken in die Kachel tippen und **Einarbeiten** (oder Strg+Enter). Claude ordnet sie der passenden Phase zu (1–3 Schritte) oder legt eine neue Phase an und weist auf Widersprüche zu früheren Entscheidungen hin. Arbeitet Claude gerade im Terminal, wartet die Idee bis zum Ende des aktuellen Schritts. Protokoll: `… – Ideen.md`.

## 12. Einstellungen

**⚙ Einstellungen** unten in der Seitenleiste:

- **Claude:** Status, Anmelden, **Modell für die Planung** (Haiku = sparsam, Sonnet = Standard, Opus = gründlich). Die Umsetzung im Terminal nutzt deine normale Claude-Code-Einstellung.
- **Ablage:** Vault oder Ordner, Dataview- und Kanban-Erkennung, Ablage wechseln, Obsidian installieren.
- **Git:** Name und E-Mail für Commits, automatische Git-Projekte an/aus.
- **Sprache:** 🇩🇪 / 🇬🇧.

> **Datenschutz-Tipp:** Commits enthalten Name und E-Mail. Wer Projekte auf GitHub veröffentlicht, kann hier die `noreply`-Adresse von GitHub eintragen.

## 13. Sprache

Die Flaggen ändern **Oberfläche**, **Claudes Sprache** und **Datei-Namen und Überschriften** neuer Projekte. Die Sprache wird **pro Projekt beim Anlegen** festgelegt – bestehende Projekte bleiben unverändert.

## 14. Limits, Fehler und Pausen

Der Stand wird **nach jedem Schritt gespeichert**. Ist dein Claude-Limit erreicht oder klappt ein Aufruf nicht, bleibt alles erhalten – später **Erneut versuchen**. Eine komplette Laufkarte dauert meist etwa eine Minute und braucht nur wenig Limit.

## 15. Probleme & häufige Fragen

- **SmartScreen-Warnung beim Installieren:** Der Installer ist noch nicht signiert → *Weitere Informationen → Trotzdem ausführen*.
- **Ist der Installer echt?** Die SHA-256-Prüfsumme mit dem Wert in den Release-Notes (oder `SHA256SUMS.txt`) vergleichen. In PowerShell im Download-Ordner: `(Get-FileHash .\Vibewright.Setup.0.2.1.exe -Algorithm SHA256).Hash` – das Ergebnis muss übereinstimmen.
- **„Claude Code wurde nicht gefunden“:** Claude Code installieren und Vibewright neu starten.
- **Keine Animationen:** In Windows sind die Animationseffekte ausgeschaltet (*Einstellungen → Barrierefreiheit → Visuelle Effekte*).
- **Kleiner Bildschirm:** Unter ca. 720 px Höhe schaltet Vibewright in eine kompakte Ansicht.
- **Werden Daten verschickt?** Vibewright selbst sendet keine Projektdaten. Einmal pro Start fragt es bei GitHub nach, ob es eine neue Version gibt (dann erscheint unten links ein grüner Hinweis). Beim Werkzeug-Check lädt es den Katalog *claude-skills* von GitHub, schickt je fehlendem Skill 1–3 englische Stichwörter an die Suche von SkillsMP (nie deine Idee oder deinen Plan) und ruft vorgeschlagene Download-Seiten einmal auf, um sie zu prüfen. Was du mit Claude planst, geht über Claude Code an Anthropic – wie bei jeder Claude-Code-Nutzung.
- **Wo liegen die Einstellungen?** `%APPDATA%\Vibewright\einstellungen.json` (ältere Installationen: `%APPDATA%\ki-projekthelper`).
- **Deinstallieren:** *Windows-Einstellungen → Apps → Vibewright*. Deine Projekte bleiben erhalten.
