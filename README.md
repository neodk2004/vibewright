<p align="center">
  <img src="docs/icon.png" width="96" alt="Vibewright logo">
</p>

<h1 align="center">Vibewright</h1>
<p align="center"><b>You vibe. It builds.</b><br>
Turn a one-line idea into a complete project roadmap – and build it with Claude Code, right inside the app.</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-6a55e8" alt="Windows | macOS">
  <img src="https://img.shields.io/badge/license-MIT-5fd0e0" alt="MIT License">
  <img src="https://img.shields.io/badge/powered%20by-Claude%20Code-9d8cff" alt="Claude Code">
  <img src="https://img.shields.io/badge/language-English%20%7C%20Deutsch-555" alt="English | Deutsch">
  <a href="https://github.com/neodk2004/vibewright/releases/latest"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fneodk2004%2Fvibewright%2Fmain%2F.github%2Fbadges%2Fvirustotal.json" alt="VirusTotal scan"></a>
  <a href="https://dev.to/neodk/i-built-a-desktop-app-that-turns-a-one-line-idea-into-a-plan-and-lets-claude-code-build-it-6g4"><img src="https://img.shields.io/badge/dev.to-read%20the%20article-0A0A0A?logo=devdotto&logoColor=white" alt="Read the article on dev.to"></a>
  <a href="https://alternativeto.net/software/vibewright/about/?utm_source=badge&utm_medium=referral"><img src="https://alternativeto.net/static/badges/badge-compact-dark.svg" alt="Vibewright on AlternativeTo"></a>
</p>

<p align="center"><a href="https://ko-fi.com/E8R028M0YO"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi"></a></p>

<p align="center"><b><a href="https://neodk2004.github.io/vibewright/">🌐 Website</a></b> · <a href="https://github.com/neodk2004/vibewright/releases/latest">⬇️ Download</a></p>

<p align="center"><img src="docs/media/demo.gif" alt="Vibewright demo: interview, needs analysis, plan, tool check, cockpit and Claude Code inside the app" width="860"></p>

---

## What is Vibewright?

You have an idea. Maybe a bird house camera, a podcast, a home server. Getting from *"I'd like to…"* to *"it works"* usually means juggling chats, notes, half-finished plans and forgotten next steps.

Vibewright is a desktop app for Windows and macOS that does the project management for you. You type one sentence; Vibewright interviews you, writes a needs analysis, cuts the goal into phases, checks which tools you and Claude need – and then lets you build it step by step with **Claude Code running inside the app**. You stay the decision maker: you click, approve and tick off. Claude does the heavy lifting in the background.

```
Idea ──► Interview ──► Needs analysis ──► Plan ──► Tool check ──► Build
          (clicks)      🚦 approve        🚦 approve  🚦 approve     Claude Code in the app
```

## Features

- **Guided interview** – one multiple-choice question per screen (keys 1–4), with your own answer as an option. Two short rounds, follow-up questions only where answers leave gaps. For an existing project, one round at most – or none, if the code folder already answers everything.
- **Needs analysis** – goal, scope, must-have / could-have / non-goals, risks you didn't think of, and a feasibility traffic light.
- **Plan as a roadmap** – 3–6 phases with goals, "done when" criteria and concrete steps in plain language (no unexplained commands).
- **Tool check** – inspects your PC and your Claude setup (plugins, skills, MCP servers, operating system) and recommends only what a phase really needs, from official sources. Nothing gets installed without your OK.
- **Start from an existing project** – point Vibewright at a code folder, a GitHub / Gitea repository or an earlier Claude Code session. It reads the code, docs and commits and only asks what's still missing.
- **Cockpit** – the current phase with its checklist, progress, next step and all phases at a glance. Phases that haven't started can be reordered (▲ / ▼), and an open step can be moved to the next phase.
- **Claude Code inside the app** – an embedded terminal runs Claude Code with a generated `CLAUDE.md` that knows your project, phase and next step. Claude ticks off finished steps; the checklist updates live.
- **"I just had another idea"** – type a thought any time; Claude sorts it into the right phase (or creates a new one). While Claude is working, the idea waits until the current step is done. Waiting and collected ideas can be edited or removed.
- **Your notes, your format** – everything is written as Markdown into your **Obsidian** vault (with Dataview tables and Kanban if you use them) or locally as `.md` + an `.html` dashboard.
- **Git safety net (optional)** – the code folder becomes a Git project and Claude commits after every finished step, so you can always go back.
- **GitHub / Gitea issues (optional)** – see the issues of your repository and create new ones from the app; Claude adds them to the plan.
- **English & German** – UI, Claude's texts and the generated files. The language is fixed per project.
- **Easy on your limits** – Vibewright plans with a lean, tool-free Claude: **~30× less overhead per step** (1,400 instead of up to 44,000 tokens in our test). Your subscription goes into your project, not into boilerplate. The sidebar shows your 5-hour and weekly Claude limits; a usage page lists the tokens per project and per model.
- **Archive** – pack a finished project into a ZIP file instead of deleting it.

## Screenshots

| Interview | Needs analysis |
|---|---|
| ![Interview](docs/screenshots/interview.png) | ![Needs analysis](docs/screenshots/needs-analysis.png) |
| **Plan** | **Tool check** |
| ![Plan](docs/screenshots/plan.png) | ![Tool check](docs/screenshots/tool-check.png) |
| **Claude Code inside the app** | **Settings** |
| ![Claude session](docs/screenshots/session.png) | ![Settings](docs/screenshots/settings.png) |
| **While Claude thinks** | **Light mode** |
| ![Loading](docs/screenshots/loading.png) | ![Light mode](docs/screenshots/cockpit-light.png) |

## Documentation

- 📖 [Wiki manual (English)](https://github.com/neodk2004/vibewright/wiki/Home-English) · [Handbuch (Deutsch)](https://github.com/neodk2004/vibewright/wiki) – one page per chapter, with screenshots
- 📘 [User guide](docs/user-guide.md) – everything from the first start to a finished project
- 📗 [Anleitung (Deutsch)](docs/anleitung.md)
- 🛠️ [Developer guide](docs/developer-guide.md) – architecture, Claude calls, tests, building
- 📜 [Third-party notices](THIRD_PARTY_NOTICES.md) – all libraries and tools with versions and licenses
- 🤝 [Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security policy](SECURITY.md)

## Requirements

| | |
|---|---|
| **Windows 10 or 11** (64-bit) **or macOS 11 Big Sur or later** | Mac: Apple Silicon (M1–M4) and Intel are both supported |
| **Claude Code** | installed and signed in – [official setup guide](https://docs.claude.com/en/docs/claude-code/setup). Native installer and npm installation are both supported. |
| **Claude subscription** | Pro or Max recommended. Signing in with an API key works too, but then every call is billed separately. |
| Obsidian *(optional)* | [obsidian.md](https://obsidian.md) – with the community plugins *Dataview* and *Kanban* for live tables and a project board. Without Obsidian, Vibewright saves `.md` files plus an `.html` dashboard. |
| Git *(optional)* | [git-scm.com](https://git-scm.com/downloads) – for the automatic commit-per-step safety net. |

## Installation

### Windows

1. Download **`Vibewright.Setup.x.y.z.exe`** from the [Releases](../../releases) page.
   *Optional but recommended:* [verify the download](#verify-your-download).
2. Run it and choose an installation folder.
   > The installer is not code-signed yet, so Windows SmartScreen may warn you. Click **More info → Run anyway**.
3. Start Vibewright. On first launch it checks Claude Code, lets you sign in and asks where your projects should live.

### macOS

1. Download the file for your Mac from the [latest release](../../releases/latest):
   - **Apple Silicon** (M1, M2, M3, M4 …): `Vibewright-x.y.z-mac-arm64.dmg`
   - **Intel**: `Vibewright-x.y.z-mac-x64.dmg`

   Not sure? Apple menu → *About This Mac* → "Chip" (Apple M…) or "Processor" (Intel).
2. Open the `.dmg` and drag **Vibewright** into **Applications**.
3. Start Vibewright from *Applications*. The app is **signed with an Apple Developer ID and notarized by Apple**, so macOS opens it without warnings.

### Verify your download

Every release lists the **SHA-256 checksum** of the installer in its release notes and in an attached `SHA256SUMS.txt` (GitHub also shows it next to the file). Inside your download folder:

```powershell
# Windows (PowerShell)
(Get-FileHash .\Vibewright.Setup.0.3.2.exe -Algorithm SHA256).Hash
```

```bash
# macOS (Terminal)
shasum -a 256 Vibewright-0.3.2-mac-arm64.dmg
```

If the output matches the published value, your file is exactly the released one.

Every installer is also **scanned by VirusTotal** (around 70 antivirus engines) with the public workflow [`.github/workflows/virustotal.yml`](.github/workflows/virustotal.yml). The result and a link to the full report are added to the release notes; the badge at the top shows the latest result. Prefer to check the code yourself? [Run from source](#run-from-source) or build the installer with `npm run exe`.

### Run from source

```bash
git clone https://github.com/neodk2004/vibewright.git
cd vibewright/app
npm install
npm start            # starts the app
npm test             # end-to-end test with real Claude calls (uses a bit of your limit)
npm run exe          # builds the Windows installer into app/dist/
npm run exe:mac      # builds the Mac app (on a Mac) into app/dist/
```

## What's new

<!-- changelog:start -->
<!-- Generated from CHANGELOG.md – do not edit here. -->
#### 0.4.7 – 2026-11-27

#### Fixed
- **Maintenance view: reports no longer wait forever** (#38, PR #39 by @revil-O): with a terminal session open, a bug or wish for a finished project was only queued and waited for the next ticked step, which never comes in maintenance. Vibewright now places it right away, and anything still waiting is placed when the session ends.

#### 0.4.6 – 2026-11-27

#### Fixed
- **Maintenance view finds the repo more reliably** (#37): Vibewright now checks all Git remotes of the code folder (`origin` first) instead of only `origin`, and accepts an `http://` remote if your Gitea account itself is set up with `http://` on the same host and port. GitHub and `https` accounts still never match `http`. The hint no longer says "GitHub" for Gitea accounts: "No repo found for the Git account (Settings → Git) – reports go straight into the plan."

#### 0.4.5 – 2026-11-27

#### Security
- **Importing a project no longer follows symlinks out of the folder** ([GHSA-pr7r-642c-886q](https://github.com/neodk2004/vibewright/security/advisories/GHSA-pr7r-642c-886q), reported by @revil-O): a crafted folder or repository could link `README.md`, `CLAUDE.md` or a manifest such as `package.json` to a private file (e.g. an SSH key), whose content then went into the first prompt to Claude. Writing `CLAUDE.md` and `.gitignore` into the code folder followed such links too. Vibewright now reads only files that stay inside the project folder after resolving links, refuses to write `CLAUDE.md` through a link pointing outside, and never overwrites an existing `.gitignore`. Links inside the folder (e.g. `CLAUDE.md` → `AGENTS.md`) keep working.

[Full changelog](CHANGELOG.md)
<!-- changelog:end -->

## How it works

```
┌──────────── Vibewright (Electron) ────────────┐
│  UI ──► core.js (state machine, files)        │
│           │                                   │
│           ├─► claude -p --json-schema …        │  planning: headless, no tools,
│           │     (structured JSON answers)     │  own short system prompt
│           │                                   │
│           └─► node-pty ──► claude (interactive)│  building: embedded terminal
│                    ▲            │             │  (xterm.js)
│                    └─ CLAUDE.md ┘             │
└──────────────┬───────────────────────────────┘
               ▼
   Your vault / folder: Dashboard · Tasks · Plan · Needs analysis · Tool check
```

- Claude only returns **structured JSON**; Vibewright writes all files itself – Claude never needs write access for planning.
- Progress lives in the **task files**. Whether you tick a box in Vibewright, in Obsidian, or Claude ticks it while building – the app reads it back and updates progress, next step and dashboard.
- Each project keeps its state in `projekthelper-state.json`, so you can pause for weeks and pick up exactly where you left off.

## Privacy

- Vibewright itself sends **no telemetry** and stores its settings only on your computer (Windows: `%APPDATA%`, macOS: `~/Library/Application Support`).
- **Limit display:** to show your 5-hour and weekly limits, Vibewright reads the Claude Code sign-in token on your computer and asks Anthropic's usage endpoint (`api.anthropic.com/api/oauth/usage`). The token is only sent to Anthropic and never stored by Vibewright.
- **GitHub / Gitea (optional):** if you connect an account, Vibewright lists your repositories and reads or creates issues through that service's API. An access token is stored encrypted with your operating system's key store (Electron `safeStorage`).
- **Tool check:** while checking tools, Vibewright fetches the [claude-skills](https://github.com/alirezarezvani/claude-skills) plugin catalog from GitHub, sends 1–3 English keywords per missing skill to the [SkillsMP](https://skillsmp.com) search (never your idea or plan text), reads candidate `SKILL.md` files from GitHub and opens the suggested download pages once to check they exist.
- **Update check:** once per start, Vibewright asks the public GitHub API for the newest release (`api.github.com/repos/neodk2004/vibewright/releases/latest`). No project data is sent – GitHub only sees an ordinary web request.
- What you plan with Claude (your idea, answers, plan, a list of installed Claude plugins/skills and your operating system for the tool check) is sent to Anthropic through Claude Code – exactly like any other Claude Code usage.
- If you push a project to GitHub, the Git commits contain the name and email from your Git config. Use GitHub's `noreply` address if you don't want your email to be public.

## Project structure

```
app/
  main.js        Electron main process: windows, settings, embedded terminal (node-pty)
  core.js        Planning flow, Claude calls, file generation, progress
  renderer.js    User interface
  i18n.js        English UI layer
  style.css      Design, animations, compact mode for small screens
  splash.html    Splash screen
  assets/        Runtime icons
  build/         Icon source (icon.svg) and build resources
  test/          End-to-end and installation tests
docs/            README images
```

## Deutsch

Vibewright macht aus einer einzeiligen Idee eine fertige Laufkarte: Interview → Bedarfsanalyse → Plan → Werkzeug-Check → Umsetzung. Umgesetzt wird mit Claude Code direkt in der App, du entscheidest nur noch an den Freigaben. Die Ablage erfolgt in Obsidian oder lokal als Markdown. Die Oberfläche lässt sich in der Seitenleiste oder in den Einstellungen per Flagge zwischen Deutsch und Englisch umschalten. Voraussetzungen und Installation: siehe oben.

### Funktionen

- **Geführtes Interview** – eine Multiple-Choice-Frage pro Bildschirm (Tasten 1–4), eigene Antwort ist immer möglich. Zwei kurze Runden, Nachfragen nur dort, wo Antworten Lücken lassen. Bei einem bestehenden Projekt höchstens eine Runde – oder gar keine, wenn der Code-Ordner schon alles beantwortet.
- **Bedarfsanalyse** – Ziel, Rahmen, Muss / Kann / Nicht, Risiken, an die du nicht gedacht hast, und eine Machbarkeits-Ampel.
- **Plan als Laufkarte** – 3–6 Phasen mit Ziel, „fertig, wenn“ und konkreten Schritten in Alltagssprache (keine unerklärten Befehle).
- **Werkzeug-Check** – prüft deinen Rechner und dein Claude-Setup (Plugins, Skills, MCP-Server, Betriebssystem) und empfiehlt nur, was eine Phase wirklich braucht, aus offiziellen Quellen. Ohne dein OK wird nichts installiert.
- **Mit einem bestehenden Projekt starten** – ein Code-Ordner, ein GitHub- / Gitea-Repository oder eine frühere Claude-Code-Sitzung als Ausgangspunkt. Vibewright liest Code, Doku und Commits und fragt nur, was noch fehlt.
- **Cockpit** – die aktuelle Phase mit Checkliste, Fortschritt, nächstem Schritt und allen Phasen auf einen Blick. Noch nicht begonnene Phasen lassen sich umsortieren (▲ / ▼), ein offener Schritt lässt sich in die nächste Phase schieben.
- **Claude Code in der App** – ein eingebautes Terminal startet Claude Code mit einer erzeugten `CLAUDE.md`, die Projekt, Phase und nächsten Schritt kennt. Claude hakt erledigte Schritte ab, die Checkliste aktualisiert sich live.
- **„Mir ist noch was eingefallen“** – jederzeit einen Gedanken eintippen; Claude sortiert ihn in die passende Phase ein (oder legt eine neue an). Arbeitet Claude gerade, wartet die Idee, bis der aktuelle Schritt fertig ist. Wartende und gesammelte Ideen lassen sich bearbeiten oder entfernen.
- **Deine Notizen, dein Format** – alles landet als Markdown in deinem **Obsidian**-Vault (mit Dataview-Tabellen und Kanban, wenn du sie nutzt) oder lokal als `.md` plus `.html`-Dashboard.
- **Git-Sicherheitsnetz (optional)** – der Code-Ordner wird ein Git-Projekt, Claude macht nach jedem erledigten Schritt einen Commit – du kannst jederzeit zurück.
- **GitHub- / Gitea-Issues (optional)** – Issues deines Repositorys ansehen und neue direkt aus der App anlegen; Claude plant sie in den Plan ein.
- **Deutsch & Englisch** – Oberfläche, Claudes Texte und die erzeugten Dateien. Die Sprache ist pro Projekt fest.
- **Schont deine Limits** – Vibewright plant mit einem schlanken Claude ohne Tools: **~30× weniger Ballast pro Schritt** (1.400 statt bis zu 44.000 Tokens in unserem Test). Dein Abo fließt in dein Projekt, nicht in Overhead. Die Seitenleiste zeigt dein 5-Stunden- und Wochenlimit; eine Verbrauchsseite listet die Tokens je Projekt und Modell.
- **Archivieren** – ein fertiges Projekt als ZIP-Datei aufheben, statt es zu löschen.

### Datenschutz

- Vibewright selbst sendet **keine Telemetrie** und speichert seine Einstellungen nur auf deinem Rechner (Windows: `%APPDATA%`, macOS: `~/Library/Application Support`).
- **Limit-Anzeige:** Für dein 5-Stunden- und Wochenlimit liest Vibewright das Anmelde-Token von Claude Code auf deinem Rechner und fragt damit den Verbrauchs-Endpunkt von Anthropic ab (`api.anthropic.com/api/oauth/usage`). Das Token geht nur an Anthropic und wird von Vibewright nicht gespeichert.
- **GitHub / Gitea (optional):** Verbindest du ein Konto, listet Vibewright deine Repositorys und liest oder erstellt Issues über die API des Dienstes. Ein Zugangs-Token wird verschlüsselt im Schlüsselspeicher deines Betriebssystems abgelegt (Electron `safeStorage`).
- **Werkzeug-Check:** Vibewright lädt den Plugin-Katalog [claude-skills](https://github.com/alirezarezvani/claude-skills) von GitHub, schickt je fehlendem Skill 1–3 englische Stichwörter an die [SkillsMP](https://skillsmp.com)-Suche (nie deine Idee oder deinen Plan), liest passende `SKILL.md`-Dateien von GitHub und ruft die vorgeschlagenen Download-Seiten einmal auf, um zu prüfen, ob es sie gibt.
- **Update-Prüfung:** Einmal pro Start fragt Vibewright die öffentliche GitHub-API nach dem neuesten Release. Projektdaten werden nicht gesendet.
- Was du mit Claude planst (Idee, Antworten, Plan, eine Liste installierter Claude-Plugins/-Skills und dein Betriebssystem für den Werkzeug-Check), geht über Claude Code an Anthropic – wie bei jeder anderen Nutzung von Claude Code.
- Pushst du ein Projekt zu GitHub, enthalten die Commits Name und E-Mail aus deiner Git-Konfiguration. Nimm die `noreply`-Adresse von GitHub, wenn deine E-Mail nicht öffentlich sein soll.

## Built with

Vibewright stands on the shoulders of a few open-source projects – [Electron](https://www.electronjs.org), [xterm.js](https://xtermjs.org) and [node-pty](https://github.com/microsoft/node-pty) (via [@lydell/node-pty](https://github.com/lydell/node-pty)) – all MIT-licensed. Full details, versions and license texts: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Vibewright was developed with the help of **Claude Code**. All code was reviewed and tested and is published by the author under the MIT license.

## Disclaimer

Vibewright is an independent open-source project and is **not affiliated with, endorsed by or sponsored by Anthropic**. *Claude* and *Claude Code* are trademarks of Anthropic, PBC. Vibewright simply uses the Claude Code CLI that you install and sign in to yourself.

## License

[MIT](LICENSE) © 2026 [neodk2004](https://github.com/neodk2004)
