# Security Policy

## Supported versions

Only the **latest release** for each platform receives security fixes.

| Version | Supported |
|---|---|
| latest release (Windows / macOS) | ✅ |
| older releases | ❌ – please update |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub: **[Security → Report a vulnerability](https://github.com/neodk2004/vibewright/security/advisories/new)**.
Only the maintainer can see the report.

Helpful to include:

- what an attacker could do and under which conditions,
- steps to reproduce (version, operating system),
- a proof of concept, if you have one.

You will get a first answer within **7 days**. Vibewright is a one-person spare-time project, so a fix may take a little longer – you will be kept informed and credited in the release notes if you like.

## Scope

In scope: the Vibewright app (Electron main process, preload, renderer), the generated project files, the build and release workflows in `.github/workflows/`.

Out of scope – please report these to the respective project:

- **Claude Code** itself → [Anthropic](https://www.anthropic.com/responsible-disclosure-policy)
- Electron, node-pty, xterm.js and other dependencies (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)) – unless Vibewright uses them in an unsafe way

## How releases are protected

- Every release lists **SHA-256 checksums** (`SHA256SUMS.txt`).
- Windows installers are **scanned by VirusTotal** with a public workflow.
- macOS builds are **signed with an Apple Developer ID and notarized by Apple**.
- All release builds are made by public GitHub Actions workflows or from the tagged source.
