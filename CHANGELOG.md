# Changelog

All notable changes to Vibewright are listed here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [0.2.2] – 2026-10-26

### Added
- **Tool check – more sources:** besides the official catalog, Vibewright now uses every plugin marketplace you have added to Claude Code and the [claude-skills](https://github.com/alirezarezvani/claude-skills) catalog (even if you have not added it yet).
- **Tool check – ready-made skills from [SkillsMP](https://skillsmp.com):** if no catalog fits, Vibewright searches SkillsMP. Only Claude-compatible skills from GitHub repositories with at least 50,000 stars are considered, and Claude picks one only if it really fits. SkillsMP only receives 1–3 English keywords, never your idea or plan.
- **Tool check – link check:** suggested download pages are opened once; dead links are replaced with the maker's current page or marked with ⚠.
- **Windows installer in the Vibewright look:** welcome page with the Vibewright sidebar, logo header on every page, German or English depending on your Windows language.

### Changed
- The tool check now also counts skills inside installed plugins and skills in the project's code folder as available, and notices switched-off plugins.

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
