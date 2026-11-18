# Changelog

All notable changes to Vibewright are listed here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- **Long words or URLs in the needs-analysis scope card were cut off** (#14): they now wrap inside the card instead of disappearing at its edge, and the labels next to them keep their width.

## [0.3.2] – 2026-11-18

### Added
- **Imported projects start where they really are**: when importing from GitHub / Gitea, Claude Code or your own folder (e.g. an Obsidian project), Vibewright now also reads the documentation (docs/, wiki, notes, CHANGELOG, status files – up to 3 levels deep, newest and progress files first) besides README and CLAUDE.md. The plan then ticks off the steps that are already done, so progress, dashboard and the next step match the actual state. Claude also decides whether the needs analysis and plan still need your approval: if the docs already state goal and scope (or contain a roadmap), Vibewright creates them on its own and goes straight to the tool check, with a short note on how far the project is.

### Fixed
- **Header status wrapped onto two lines in small windows** (#12): "wartet auf dich" / "Claude arbeitet …" next to the steps now stays on one line; the connectors between the steps get shorter instead.

## [0.3.1] – 2026-11-17

### Added
- **Import a project from your own folder:** *New project → From a folder* takes any existing code folder – on this computer, an external drive, a USB stick, a NAS or a network drive. Vibewright reads it before the interview and plans from there; nothing is copied, and deleting the project in Vibewright never touches the folder.

### Changed
- **Larger window at startup:** Vibewright now opens 15 % larger (up to 1380×897), but never larger than the screen.

### Fixed
- **Content was cut off in small windows** (#3): cards in the needs analysis and in Settings now scroll when the window is too small, so every entry and button stays reachable (e.g. the "Scope" card, the 7th must-have, *GitHub / Gitea*).
- **Model buttons overflowed their card in German** (#4): the three model buttons now always fit; long words such as "gründlichsten" are hyphenated.
- **Startup could stop with "Uncaught Exception: write EPIPE"** on macOS/Linux (#6): reading the PATH from the login shell no longer opens an input pipe.
- **File list of imported code folders depended on the operating system** (#8): the overview Claude reads before the interview now lists files alphabetically (case-insensitive) on every OS, so the same first 40 files are chosen everywhere; `npm test` is green on macOS again.
- **Settings footer links wrapped onto two lines in small windows** (#5): the buttons in the bottom bar now always stay on one line; only the info text wraps.
- **macOS: subscription usage (5 h / week) was not shown** (#10): if the keychain held an old Claude Code entry besides the current one, Vibewright read the old, expired token. It now reads the entry of the current user first.

## [0.3.0] – 2026-11-13

### Added
- **Maintenance mode for finished code projects:** once all phases are done, the cockpit shows a *Maintenance* tile. If the code folder belongs to a GitHub or Gitea repository (Settings → Git), Vibewright checks it for new issues when you open the project and every 30 minutes. Each new issue appears with *Apply* (Claude adds it to the plan) or ✕ (ignore) – nothing from other people goes into the plan without your click.
- **Report bugs and wishes separately:** the tile has its own field with *🐞 Bug* and *✨ Feature*. With a token, Vibewright creates a matching issue (label `bug` or `enhancement`) and Claude plans it right away; without a repository it goes straight into the plan. Claude mentions the issue number in its commits, so the issue closes itself after the push.
- **macOS: tidy installer window:** the .dmg opens with a Vibewright background that shows where to drag the app ("Drag Vibewright to Applications").
- **Imported projects skip unnecessary interviews:** for projects from GitHub, Gitea or Claude Code, Vibewright first reads the code folder (README, CLAUDE.md, project files, recent commits). If that already says enough, it goes straight to the needs analysis; otherwise Claude asks only what is missing, in a single round.
- **Drag images into the Claude terminal:** drop a screenshot (or any file) onto the terminal, e.g. while hunting a bug – its path is inserted and Claude Code attaches the image. Files dropped elsewhere no longer replace the app window.
- **Multiple-choice questions are easier to spot:** when several answers are allowed, every answer shows a checkbox and a highlighted badge "Multiple answers allowed" appears below the question.
- **macOS: clean up after installing:** on the first start of a new version, Vibewright offers to eject the .dmg and move it to the Trash (asks once; nothing happens if you click *Keep*).

### Fixed
- The sidebar showed "100 % · Phase 0" for finished projects; it now says "Done · Maintenance".
- English interface: the phase details showed the effort in German ("Effort mittel"), and Claude sometimes named the area of a phase in German.
- Fresh screenshots in the README.

## [0.2.9] – 2026-11-08

### Added
- **Several projects at the same time:** starting Claude in another project no longer ends the running session. Each project keeps its own terminal; the sidebar shows every project in which Claude is working. *End session* only stops the project you are looking at.

## [0.2.8] – 2026-11-06

### Fixed
- **Update notice did not appear in some networks:** if the GitHub API does not answer (for example because its limit of 60 requests per hour is used up on a shared network), Vibewright now checks the normal release page instead.

## [0.2.7] – 2026-11-06

### Security
- **GitHub / Gitea token stays with its server:** after switching between GitHub and Gitea or to another Gitea server, a saved token is no longer reused – you have to enter a new one. Before, a GitHub token could be sent to the newly entered server.
- **Token no longer visible in the process list:** when downloading a repository, the token is passed to Git through its environment instead of the command line.

## [0.2.6] – 2026-11-06

### Added
- **Import from GitHub or Gitea:** *Settings → Git → GitHub / Gitea* connects your account (GitHub or your own Gitea server, optional access token for private repositories – stored encrypted on this computer). *New project → From GitHub / Gitea* lists your repositories; one click downloads the code into a folder of your choice and starts planning from there.
- **Global rules:** *Settings → Claude → Global rules* shows and edits the central `CLAUDE.md` that Claude Code follows in every project. Building blocks add recurring steps with one click (commit, push, /graphify, /ponytail, security review, vulnerability check, secrets, tests). The previous file is kept as `CLAUDE.md.bak`.

## [0.2.5] – 2026-11-06

### Added
- **Import from Claude Code:** *New project → Import from Claude Code* lists the folders you already worked on with Claude Code. One click fills in name and idea and uses that folder as the code folder; the interview then also asks about the current state.
- **Claude limits at a glance:** bottom left, two small rings show how much of your 5-hour and weekly Claude limit is used. Hover for the time it resets. Stays empty when signed in with an API key or offline.

### Fixed
- **Tool check on small windows:** with many entries the list was cut off and could not be scrolled. Each column now scrolls on its own and the *Apply* button stays visible.

## [0.2.4] – 2026-10-26

### Security
- **Electron 42:** updated from Electron 33 to 42.11.18. This closes more than 40 known security issues in Electron (sandbox and context-isolation bypasses, use-after-free bugs, compromised eMudhra certificates and more).
- **Installer tools updated:** electron-builder 26.18 with fixed versions of `tar`, `app-builder-lib` and `builder-util-runtime`.

## [0.2.3] – 2026-10-26

### Fixed
- **Stuck at step 2 (needs analysis):** with a long project idea, the main area grew wider than the window, so the right column and the *Looks good* button were cut off. The idea in the header is now shortened with "…" and everything fits in the window again.

## [0.2.2] – 2026-10-26

### Added
- **Tool check – more sources:** besides the official catalog, Vibewright now uses every plugin marketplace you have added to Claude Code and the [claude-skills](https://github.com/alirezarezvani/claude-skills) catalog (even if you have not added it yet).
- **Tool check – ready-made skills from [SkillsMP](https://skillsmp.com):** if no catalog fits, Vibewright searches SkillsMP. Only Claude-compatible skills from GitHub repositories with at least 50,000 stars are considered, and Claude picks one only if it really fits. SkillsMP only receives 1–3 English keywords, never your idea or plan.
- **Tool check – link check:** suggested download pages are opened once; dead links are replaced with the maker's current page or marked with ⚠.
- **Report a bug from the app:** *Settings → Report a bug* opens the GitHub form with version, system and storage already filled in. New reports get a friendly reply and are sorted automatically; outdated versions get a hint to update first.
- **Windows installer in the Vibewright look:** welcome page with the Vibewright sidebar, logo header on every page, German or English depending on your Windows language.

### Changed
- *Settings → User guide* now opens the manual in the wiki.
- The tool check now also counts skills inside installed plugins and skills in the project's code folder as available, and notices switched-off plugins.

### Fixed
- The settings page showed version 0.2.0 regardless of the installed version.

## [0.2.1] – 2026-10-26

### Added
- **Update notice:** once per start, Vibewright checks GitHub for a newer release and shows a green notice at the bottom left that opens the download page. No project data is sent.
- **Warning for storage inside a program folder:** if your vault or storage folder lies inside an app's installation folder (for example a vault inside the Obsidian program folder), Vibewright warns you – an update or reinstall of that app deletes the folder with everything in it. Such vaults are also marked when you choose your storage.

### Fixed
- **Missing storage folder:** if the storage folder was moved, deleted or its drive is not connected, Vibewright now says so clearly (with "Choose another storage" and "Check again") instead of silently showing an empty project list.
- One damaged project file no longer hides all other projects from the list.

## [0.2.0] – 2026-10-12

### Added
- **Archive projects:** packs a project into a ZIP file in the `Archiv` folder of your storage and removes it from the list. File names with umlauts stay intact on Windows and macOS.
- **Delete projects:** shows a clear warning first; the next confirmation removes the project for good. Your own code folder is never touched.
- Both actions are in the header of every project. Archiving or deleting also removes the project's line from the Obsidian kanban board and ends a running Claude session for that project.
- Windows and macOS (Apple Silicon + Intel) now ship together in one release.

## [0.1.0-mac] – 2026-10-11

### Added
- macOS version for Apple Silicon (arm64) and Intel (x64), signed with an Apple Developer ID and notarized by Apple.
- Public build workflow for macOS on GitHub Actions.

### Fixed
- Splash screen: logo now shows immediately with "Reduce motion" enabled, and the animation keeps running on macOS.

## [0.1.0] – 2026-10-11

First public release (Windows).

### Added
- Guided interview, needs analysis, plan and tool check – you only approve.
- Cockpit with live checklist, progress and an "I just had another idea" tile.
- Claude Code in an embedded terminal; finished steps are ticked automatically.
- Obsidian (Dataview/Kanban) or local Markdown + HTML dashboard.
- Optional Git safety net (commit per step), English and German interface.
- VirusTotal scan of every Windows installer, published in the release notes.

[0.2.2]: https://github.com/neodk2004/vibewright/releases/tag/v0.2.2
[0.2.1]: https://github.com/neodk2004/vibewright/releases/tag/v0.2.1
[0.2.0]: https://github.com/neodk2004/vibewright/releases/tag/v0.2.0
[0.1.0-mac]: https://github.com/neodk2004/vibewright/releases/tag/v0.1.0-mac
[0.1.0]: https://github.com/neodk2004/vibewright/releases/tag/v0.1.0
