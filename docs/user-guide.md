# Vibewright – User Guide

*You vibe. It builds.* This guide walks you through everything Vibewright does, from the first start to a finished project.
🇩🇪 Deutsche Version: [anleitung.md](anleitung.md) · Developers: [developer-guide.md](developer-guide.md)

---

## Contents

1. [Before you start](#1-before-you-start)
2. [First start](#2-first-start)
3. [Start a project](#3-start-a-project)
4. [Interview](#4-interview)
5. [Needs analysis](#5-needs-analysis)
6. [Plan](#6-plan)
7. [Tool check](#7-tool-check)
8. [The files Vibewright creates](#8-the-files-vibewright-creates)
9. [Cockpit](#9-cockpit)
10. [Build with Claude](#10-build-with-claude)
11. ["I just had another idea"](#11-i-just-had-another-idea)
12. [Settings](#12-settings)
13. [Language](#13-language)
14. [Limits, errors and pausing](#14-limits-errors-and-pausing)
15. [Troubleshooting & FAQ](#15-troubleshooting--faq)

---

## 1. Before you start

You need:

- **Windows 10 or 11** (64-bit) or **macOS 11 Big Sur or later** (Apple Silicon or Intel)
- **Claude Code**, installed and signed in – see the [official setup guide](https://docs.claude.com/en/docs/claude-code/setup). Both the native installer and an npm installation work.
- A **Claude subscription** (Pro or Max recommended). Signing in with an API key also works, but every call is then billed separately – Vibewright shows a notice in that case.

Optional:

- **Obsidian** – if you want your projects as linked notes. The community plugins **Dataview** (live tables) and **Kanban** (project board) are supported but not required.
- **Git** – for an automatic "undo" after every finished step.

## 2. First start

1. A splash screen appears for about two seconds while the app loads.
2. Vibewright checks whether Claude Code is installed and whether you are signed in.
   - Not installed → a link to the official installation guide. Install Claude Code, then restart Vibewright.
   - Not signed in → click **Sign in**. A small window and your browser open; sign in there, then click **Check again**.
3. Choose **where your projects should live**:
   - If Vibewright finds Obsidian vaults, pick one. Dashboards, tasks and (if present) your Kanban board are written there.
   - Without Obsidian you can **save locally as .md + .html** (in `Documents\Vibewright`) – every project then also gets an HTML dashboard you open in your browser. Installing Obsidian is optional; if the automatic installation is not available on your PC, Vibewright opens the official download page.

You can change all of this later in the [settings](#12-settings).

## 3. Start a project

Click **New project**, enter a **name** and **your idea in one sentence**, and press **Let's go** (or Enter).
If a project with that name already exists, Vibewright asks for another name – existing projects are never overwritten.

## 4. Interview

Claude asks up to **two rounds of up to four multiple-choice questions** – about your audience, the must-have scope, platform, your experience, your time per week and what is explicitly *not* part of the project.

- One question per screen. Click an option or press **1–4**.
- Single-choice questions jump to the next question automatically; for multiple choice, click **Next** (or Enter).
- None of the options fit? Type **your own answer** below them.
- **Back** returns to the previous question.

The second round only asks what is still unclear. While Claude is thinking, an animation shows what it is working on.

## 5. Needs analysis

🚦 *First approval.* On the left: **goal**, **feasibility** (green / yellow / red) and **scope**. On the right, tabs (keys 1–4): **Must-have**, **Later**, **Non-goals**, **Risks** – including risks you probably did not think of.

- **Looks good** → continue to the plan.
- Not quite right? Type what should change and click **Request changes** – Claude rewrites the analysis.
- **Later** → leave the project and continue another time.

## 6. Plan

🚦 *Second approval.* The plan shows **3–6 phases** side by side, each with a goal, effort, area and its steps. Phase 1 is always the smallest version that already works. Click a phase to see all of its steps and the "done when" criterion.

Steps are written in plain language – programs are installed from their official download pages, technical terms are explained in brackets. Approve with **Approve plan** or request changes as above.

## 7. Tool check

🚦 *Third approval.* Vibewright inspects **your computer** (installed programs, Windows edition) and **your Claude setup** (plugins, skills, MCP servers) and lists what the phases need:

| Bar | Meaning |
|---|---|
| 🟥 red | missing |
| 🟩 green | already available |
| ⬜ grey | not needed after all |

Missing items are pre-checked. **Nothing gets installed** – checked items become tasks: installations go to the top of the matching phase, "own project skills" to the end. If Claude finds a contradiction (e.g. a tool that does not run on your Windows edition), it adjusts the plan and tells you at the top.

Click **Apply** – Vibewright writes all files and opens the cockpit.

## 8. The files Vibewright creates

Inside your storage, every project gets its own folder:

```
Bird Cam/
├── Bird Cam – Dashboard.md        progress, next step, "pick up again", task tables
├── Bird Cam – Dashboard.html      only for local storage (open in a browser)
├── Bird Cam – Interview.md        questions and your answers
├── Bird Cam – Needs Analysis.md
├── Bird Cam – Plan.md
├── Bird Cam – Tool Check.md
├── Bird Cam – Ideas.md            created once you add an idea
├── Tasks/                         one note per phase with its checklist
│   ├── Phase 1 – Camera takes a photo.md
│   └── …
└── projekthelper-state.json       Vibewright's internal state – please don't edit
```

- **Obsidian with Dataview:** the dashboard uses live Dataview tables. Without Dataview, Vibewright writes static tables and refreshes them whenever something changes.
- **Kanban:** if your vault has a `Projekte-Kanban.md` with a `## Backlog` column, new projects are added there automatically.
- In German projects the names are German (`Bedarfsanalyse`, `Werkzeug-Check`, folder `Punkte`).

You can tick tasks directly in Obsidian too – Vibewright reads them back.

## 9. Cockpit

After the plan, the **Build** step opens the cockpit:

- **Next step** at the top, the current **phase** with its checklist in the middle, all **phases** with their progress on the right.
- Tick a step → it pops, the progress bar moves, the dashboard is updated. Finish a whole phase → 🎉 confetti.
- Click another phase on the right to look at (and tick) its steps.
- **Open dashboard** opens it in Obsidian or your browser; **Folder** opens the project folder.

## 10. Build with Claude

Click **Build with Claude**:

1. **Code projects only, first time:** choose a folder for the code (e.g. `Documents\Projects\Bird Cam`). Vibewright remembers it.
2. If enabled in the settings and Git is installed, the folder becomes a **Git project** with a first commit.
3. Vibewright writes a **`CLAUDE.md`** into the folder: project summary, links to your analysis and plan, the current phase, the next open step and some rules (plain language, nothing gets installed without your OK, tick finished steps, commit after each step if Git is used). Your own content in an existing `CLAUDE.md` stays untouched.
4. **Claude Code starts in the terminal inside the app.** The first time, Claude asks whether you trust the folder – confirm with the arrow keys and Enter.

While Claude works:

- You answer Claude's questions and approvals **in the terminal with your keyboard** – it is the normal Claude Code, just inside Vibewright.
- Next to **Build**, an orb spins while Claude is working and turns into a calm dot with **"waiting for you"** when Claude needs you.
- When Claude finishes a step, it ticks it in the task file – the checklist on the right updates live.
- **To the cockpit** or switching projects keeps Claude running (the project shows "● Claude is working"); **Back to the Claude session** returns. **End session** stops Claude.

One Claude session can run at a time.

## 11. "I just had another idea"

The tile in the cockpit (and next to the terminal) catches thoughts that come up along the way. Type it and click **Add it** (or Ctrl+Enter). The field grows with your text.

Claude decides which phase the idea belongs to, turns it into 1–3 steps and adds them there – or creates a new phase at the end. If the idea collides with something you excluded earlier, Claude says so. Every idea is logged in `… – Ideas.md`.

If Claude is currently working in the terminal, the idea **waits until the current step is finished**, so it never gets in the way.

## 12. Settings

Open **⚙ Settings** at the bottom of the sidebar.

| Card | What you can do |
|---|---|
| **Claude** | See whether Claude Code is installed and signed in; **Sign in again**; choose the **model for planning**: Haiku (most economical), Sonnet (default), Opus (most thorough). The build in the terminal uses your normal Claude Code setting. |
| **Storage** | See the current Obsidian vault or local folder, whether Dataview and a Kanban board were found; **Change storage**, **Open folder**, install Obsidian. |
| **Git** | See whether Git is installed; set the **name and email** used for commits; switch **automatic Git projects** on or off. |
| **Language** | Switch between 🇩🇪 Deutsch and 🇬🇧 English. |

> **Privacy tip:** commits contain your name and email. If you publish a project on GitHub and don't want your email to be visible, use GitHub's `noreply` address here.

## 13. Language

Switch the language with the flags at the bottom of the sidebar or in the settings. It changes the **user interface**, the **language Claude writes in** and the **file names and headings** of new projects.

The language is fixed **per project** when the project is created, so existing projects keep their files and content when you switch.

## 14. Limits, errors and pausing

- Your **progress is saved after every step**. Close the app at any time; your projects appear in the sidebar with their current step.
- If your Claude **usage limit** is reached or a call fails, Vibewright saves the state and shows **Try again** – click it later.
- Planning is deliberately lightweight (no tools, short system prompt), so a whole roadmap usually takes about a minute and only a small part of your limit.

## 15. Troubleshooting & FAQ

**Windows shows a SmartScreen warning when installing.** The installer is not code-signed yet. Click *More info → Run anyway*.

**How do I know the installer is genuine?** Compare its SHA-256 checksum with the value in the release notes (or `SHA256SUMS.txt`). In PowerShell, in your download folder: `(Get-FileHash .\Vibewright.Setup.0.2.1.exe -Algorithm SHA256).Hash` – the result must match.

**"Claude Code was not found".** Install Claude Code and restart Vibewright. Both `claude.exe` (native installer) and npm installations are detected.

**I don't see any animations.** Windows "animation effects" are turned off (*Settings → Accessibility → Visual effects*). Vibewright respects this setting on purpose.

**My screen is small.** Below about 720 px height Vibewright switches to a compact layout. Only the project list scrolls when you have many projects.

**Does Vibewright send my data anywhere?** Vibewright itself sends no telemetry and no project data. Once per start it asks GitHub whether a new version exists (a green notice then appears at the bottom left). What you plan with Claude goes to Anthropic through Claude Code, exactly like any other Claude Code use. See *Privacy* in the [README](../README.md#privacy).

**Where are my settings stored?** In `%APPDATA%\Vibewright\einstellungen.json` (older installations: `%APPDATA%\ki-projekthelper`). Planning sessions use `%USERPROFILE%\.vibewright\work`.

**How do I uninstall?** *Windows Settings → Apps → Vibewright → Uninstall*. Your projects stay in your vault or folder.
