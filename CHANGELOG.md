# Changelog

All notable changes to Vibewright are listed here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [0.2.0] – 2026-10-12

### Added
- **Archive projects:** packs a project into a ZIP file in the `Archiv` folder of your storage and removes it from the list. File names with umlauts stay intact on Windows and macOS.
- **Delete projects:** shows a clear warning first; the next confirmation removes the project for good. Your own code folder is never touched.
- Both actions are in the header of every project. Archiving or deleting also removes the project's line from the Obsidian kanban board and ends a running Claude session for that project.

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

[0.2.0]: https://github.com/neodk2004/vibewright/releases/tag/v0.2.0
[0.1.0-mac]: https://github.com/neodk2004/vibewright/releases/tag/v0.1.0-mac
[0.1.0]: https://github.com/neodk2004/vibewright/releases/tag/v0.1.0
