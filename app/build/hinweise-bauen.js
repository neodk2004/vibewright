// Erzeugt THIRD_PARTY_NOTICES.md aus den installierten Paketen (Version, Quelle, vollständiger Lizenztext).
// Aufruf: npm run notices   – danach liegen die Hinweise im Repo-Hauptordner und in app/ (wird mit der .exe ausgeliefert)
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..');
const paket = (name) => {
  const ordner = path.join(APP, 'node_modules', name);
  const j = JSON.parse(fs.readFileSync(path.join(ordner, 'package.json'), 'utf8'));
  const lizenzDatei = fs.readdirSync(ordner).find((f) => /^licen[sc]e/i.test(f));
  const repo = String(j.repository?.url || j.repository || j.homepage || '').replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/\.git$/, '');
  return { name, version: j.version, lizenz: j.license, repo, text: lizenzDatei ? fs.readFileSync(path.join(ordner, lizenzDatei), 'utf8').trim() : null };
};

// Mit der App ausgeliefert (Laufzeit)
const laufzeit = ['@xterm/xterm', '@xterm/addon-fit', '@lydell/node-pty', '@lydell/node-pty-win32-x64', 'electron'].map(paket);
// Nur zum Bauen benutzt, nicht ausgeliefert
const bau = ['electron-builder'].map(paket);
const zweck = {
  '@xterm/xterm': 'Terminal display for the embedded Claude Code session',
  '@xterm/addon-fit': 'Fits the terminal to the window size',
  '@lydell/node-pty': 'Runs Claude Code in a pseudo terminal (fork of microsoft/node-pty with prebuilt binaries)',
  '@lydell/node-pty-win32-x64': 'Prebuilt Windows x64 binaries for node-pty (same license as node-pty)',
  electron: 'Desktop app runtime (includes Chromium and Node.js – their licenses ship as LICENSE.electron.txt and LICENSES.chromium.html in the install folder)',
  'electron-builder': 'Builds the Windows installer',
};

const zeile = (p) => `| [${p.name}](${p.repo}) | ${p.version} | ${p.lizenz} | ${zweck[p.name] || ''} |`;
let md = `# Third-party notices

Vibewright is MIT-licensed open source (© 2026 neodk2004). It uses the following third-party software.
This file is generated from the installed packages by \`app/build/hinweise-bauen.js\` (\`npm run notices\`).

## Bundled with the app

| Package | Version | License | Used for |
|---|---|---|---|
${laufzeit.map(zeile).join('\n')}

## Build tools (not shipped with the app)

| Package | Version | License | Used for |
|---|---|---|---|
${bau.map(zeile).join('\n')}

During the build, electron-builder also downloads the Electron binaries and NSIS (the installer system, zlib/libpng license); NSIS is only used to create the setup file.

## External programs and services (not included – installed by the user)

| Program / service | Provider | License / terms | How Vibewright uses it |
|---|---|---|---|
| [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) | Anthropic, PBC | Anthropic's commercial terms | Required. Vibewright starts the Claude Code CLI that you installed and signed in to yourself – headless for planning and interactively in the embedded terminal for building. Vibewright is not affiliated with Anthropic. |
| [Git](https://git-scm.com) | The Git project | GPL-2.0 | Optional. Called as a separate program for \`git init\`, commits and your name/email. |
| [Obsidian](https://obsidian.md) | Dynalist Inc. | Obsidian terms of service | Optional. Vibewright only writes Markdown files into your vault. |
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) / [Kanban](https://github.com/mgmeyers/obsidian-kanban) plugins | community | MIT / GPL-3.0 | Optional. Vibewright writes notes in a format these plugins can read; it does not include them. |
| [winget](https://learn.microsoft.com/windows/package-manager/winget/) | Microsoft | MIT | Optional. Only used when you click "Install Obsidian". |

## Own assets

- Logo, icon, splash screen and UI design: original work for Vibewright (MIT, see LICENSE).
- Flag icons: drawn as simple SVGs for this app; the flag designs of Germany and the United Kingdom are not subject to copyright.
- Fonts: Segoe UI and Cascadia Mono are Windows system fonts and are not included.
- README badges are rendered by [shields.io](https://shields.io).

## Built with AI assistance

Vibewright was developed with the help of Claude Code (Anthropic). All code was reviewed, tested and is published under the MIT license by the author.

---

## Full license texts
`;
for (const p of laufzeit) md += `\n### ${p.name} ${p.version} (${p.lizenz})\n\n\`\`\`\n${p.text || `License: ${p.lizenz} – see ${p.repo} (the package ships no separate LICENSE file; same license as @lydell/node-pty above).`}\n\`\`\`\n`;

fs.writeFileSync(path.join(APP, '..', 'THIRD_PARTY_NOTICES.md'), md, 'utf8');
fs.writeFileSync(path.join(APP, 'THIRD_PARTY_NOTICES.md'), md, 'utf8');
console.log('THIRD_PARTY_NOTICES.md geschrieben');
