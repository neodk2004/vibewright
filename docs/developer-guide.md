# Vibewright – Developer Guide

How Vibewright works inside, how to run, test and build it, and where to change what.
Users: see the [user guide](user-guide.md) / [Anleitung](anleitung.md).

> **Note on language:** identifiers and code comments are German (the project started as a German tool). The UI and all docs are available in English.

---

## Tech stack

| Part | Choice | Why |
|---|---|---|
| App shell | **Electron 33**, plain HTML/CSS/JS – no framework, no bundler | small, readable, nothing to compile |
| Planning AI | **Claude Code CLI**, headless (`claude -p`) with JSON schemas | uses the user's own subscription, structured answers |
| Building AI | **Claude Code**, interactive in an embedded terminal | the real Claude Code with all its features |
| Terminal | **xterm.js** + **node-pty** (`@lydell/node-pty`, prebuilt N-API binaries) | no build tools needed on Windows |
| Installer | **electron-builder** (NSIS) | |

Runtime dependencies are deliberately minimal: three packages plus Electron. See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## Repository layout

```
app/
  main.js          Electron main process: windows, splash, IPC, settings, embedded terminal, Git
  preload.js       Exposes a fixed list of IPC channels as window.api (contextIsolation)
  core.js          No Electron imports – planning flow, Claude calls, file generation, progress
  renderer.js      All views (vanilla JS template strings)
  i18n.js          English UI layer (translates German UI strings when they enter the DOM)
  style.css        Design tokens (light/dark), layouts, animations, compact mode
  index.html       Main window
  splash.html      Splash screen (self-contained, no scripts)
  assets/          Runtime icons (packaged)
  build/           Icon source + generators, installer resources (not packaged)
  test/            End-to-end and helper tests
docs/              Guides and README images
THIRD_PARTY_NOTICES.md   generated, see "Licenses" below
```

## Architecture

```
renderer.js ──IPC──► main.js ──► core.js ──► claude -p --json-schema …   (planning, headless)
     ▲                  │
     │                  └──► node-pty ──► claude (interactive)          (building)
     │                            │  reads CLAUDE.md, ticks task files
     └── fs.watch(Tasks/) ◄───────┘
```

### Planning: headless Claude calls (`core.js → claude()`)

Every planning step is one call:

```
claude -p --output-format json --model <haiku|sonnet|opus>
       --system-prompt <SYSTEM | SYSTEM_EN>
       --tools ""                       # no tools → no permissions, no file access
       --setting-sources project --strict-mcp-config   # ignore the user's global hooks, skills, MCP servers
       --json-schema <schema>           # structured answer in structured_output
       [--resume <session-id>]          # all steps of a project share one session
```

- The prompt goes in through **stdin**, the working directory is fixed (`~/.vibewright/work`, older installs `~/.ki-projekthelper/work`) because `--resume` looks sessions up per directory.
- With no tools and a short system prompt a call costs ~1,000 input tokens instead of ~15,000–20,000 – this keeps the user's subscription limits intact.
- `--bare` would be even leaner but **does not work with subscription login** (it requires an API key).
- **Finding Claude:** `claudeBefehl()` prefers `claude.exe` (native installer, also `~/.local/bin`), otherwise reads the npm shim `claude.cmd` and runs the target (`node cli.js` or the bundled `.exe`) directly – Windows cannot start `.cmd` files without a shell, and a shell would break the JSON-schema arguments.

### The flow as a state machine

Each project stores its state in `<project>/projekthelper-state.json`. `st.offen` is what the project is waiting for; `weiter(info, st, eingabe)` advances it and only changes state after a successful Claude call (so "Try again" is always safe):

| `st.offen` | View | Next |
|---|---|---|
| `null` | – | first interview round |
| `{typ:'fragen', fragen}` | interview | round 2 or needs analysis |
| `{typ:'gate', schritt:'analyse', analyse}` | needs analysis | plan (or rewrite on `aktion:'aendern'`) |
| `{typ:'gate', schritt:'plan'}` | plan | tool check |
| `{typ:'werkzeug', eintraege, korrekturen}` | tool check | write files → `fertig` |
| `{typ:'fertig', dashboard}` | cockpit / session | – |

Schemas: `S_FRAGEN`, `S_ANALYSE`, `S_PLAN`, `S_WERKZEUG`, `S_IDEE` in `core.js`.

Other state fields: `name`, `idee`, `sprache` (`de`/`en`, fixed at creation), `projekttyp` (`code`/`sonstiges`), `session`, `runden`, `analyse`, `plan.phasen[]` (`titel, bereich, aufwand, ziel, fertig_wenn, checkliste[], done[], status`), `werkzeug`, `stand` (`fortschritt, aktiv, naechster, erledigt, gesamt`), `repo` (code folder), `ideen`, `ideenWarten`, `zuletzt`.

### Tool check

Claude gets an inventory (Windows version, installed plugins from `~/.claude/plugins/installed_plugins.json`, skills, `claude mcp list`, the official plugin catalog) and returns needs. For **system tools** Claude only names the executable and typical install paths; the app checks them itself (`where.exe` + `fs.existsSync`) – Claude never runs commands on the user's PC.

### Files and progress

- `spiegel()` writes the task notes, plan, tool check, dashboard (+ HTML for local storage) and an optional Kanban line.
- **The task files are the source of truth for progress.** `punkteLesen()` parses the `## Checkliste` / `## Checklist` section; `dashboard()` derives phase status, progress, next step and rewrites the dashboard. This is why ticking in the app, in Obsidian or by Claude all work.
- Dataview tables are used only if `.obsidian/plugins/dataview` exists in the vault; otherwise static tables.

### Languages

- **UI:** `renderer.js` is written in German. `i18n.js` holds a dictionary plus regex patterns and translates text nodes and `placeholder`/`title` attributes via a `MutationObserver`. It never touches the terminal (`.term`). To add a string: add it to `UI_EN` (or a pattern to `UI_EN_MUSTER`).
- **Claude:** English projects use `SYSTEM_EN` and an extra instruction appended to each prompt.
- **Files:** templates stay German in code; `schreibe()` passes them through `enText()` (table `EN` in `core.js`) for English projects. File names go through the same table (`datei()`), the task folder is `Tasks` vs `Punkte` (`punkteOrdner()`).
- The language is stored **per project**, so switching never breaks existing file names.

### Embedded terminal (`main.js`)

- `claude-starten`: asks once for a code folder (code projects), optionally `git init` + first commit, writes the marked block in `CLAUDE.md` (`<!-- projekthelper:start/ende -->`, user content stays), then spawns Claude with node-pty.
- The environment is cleaned of `CLAUDECODE` / `CLAUDE_CODE_*` variables so a session started from inside another Claude Code session behaves normally.
- IPC: `pty-daten` (main → UI), `pty-eingabe`, `pty-groesse` (UI → main, fire-and-forget).
- `fs.watch` on the task folder pushes `punkte-geaendert`; queued ideas are processed once the number of finished steps increases.
- One session at a time – a deliberate simplification, marked in the code; parallel sessions can be added when needed.
- The "working" orb in the UI is driven by terminal output: data within the last 1.5 s = working.

### Settings

`%APPDATA%\Vibewright\einstellungen.json` (kept at `%APPDATA%\ki-projekthelper` for older installs): `modus` (`obsidian`/`lokal`), `ablage`, `codeOrdner`, `modell`, `gitAuto`, `sprache`.

## Run, test, build

```bash
cd app
npm install
npm start                         # run the app
npm test                          # claude-finden test + end-to-end test (real Claude, ~1 min, uses some limit)
E2E_SPRACHE=en node test/e2e.js   # end-to-end test for an English project
npx electron test/pty-check.js    # does node-pty start Claude inside Electron?
npm run exe                       # installer → app/dist/Vibewright Setup x.y.z.exe
npm run notices                   # regenerate THIRD_PARTY_NOTICES.md from node_modules
npx electron build/icon-bauen.js  # render build/icon.svg → icon.png/.ico (+ copies to assets/)
```

### Screenshot / test mode

The main process understands a few environment variables (used for docs and visual checks):

| Variable | Effect |
|---|---|
| `SCREENSHOT=file.png` | capture the window after loading, then quit (no splash) |
| `SCREENSHOT_DELAY=ms` | wait before capturing (default 4000) |
| `SCREENSHOT_JS=code` | run JavaScript in the window before capturing |
| `KPH_USERDATA=dir` | use a separate settings folder |
| `KPH_THEME=light\|dark` | force the color scheme |
| `KPH_GROESSE=960x580` | force the window size |

### Packaging notes

- `build/` is electron-builder's resource folder and is **not packaged** – runtime files belong in `assets/`.
- `node-pty` is unpacked from the asar (`asarUnpack`) and not rebuilt (`npmRebuild: false`) because the binaries are N-API and work with Electron as they are.
- `THIRD_PARTY_NOTICES.md` and the license are copied next to the installed `.exe` (`extraFiles`); Electron adds `LICENSE.electron.txt` and `LICENSES.chromium.html`.

## Design rules

- **No page scrolling.** Every view fits the window; only the project list and, as a fallback, very long checklists scroll. Below 720 px height a compact mode kicks in.
- **The user decides, Claude works.** Nothing is installed without consent; every AI step ends at an approval.
- **Official sources only** in recommendations; plain language for steps.
- Colors are tokens in `:root` with a dark variant; animations respect `prefers-reduced-motion`.
- Keep dependencies minimal – check whether Electron/Node or a few lines of code already do the job.

## Licenses

Vibewright is MIT-licensed. When you add or update a dependency, run `npm run notices` and commit the regenerated `THIRD_PARTY_NOTICES.md`.

## Contributing

Issues and pull requests are welcome. Please run `npm test` before opening a PR and describe visible UI changes with a screenshot.
