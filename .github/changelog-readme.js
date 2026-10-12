// Copies the newest versions from CHANGELOG.md into README.md (between the changelog markers).
// Run by .github/workflows/changelog-readme.yml; locally: node .github/changelog-readme.js
const fs = require('fs');
const path = require('path');

const ANZAHL = 3; // ponytail: fixed number of versions shown; full history stays in CHANGELOG.md
const root = path.join(__dirname, '..');
const log = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
// Reference links at the bottom ("[0.2.0]: https://…") become inline links, so the headings stay clickable in the README
const links = Object.fromEntries([...log.matchAll(/^\[([^\]]+)\]: (\S+)$/gm)].map((m) => [m[1], m[2]]));
const versionen = log.split(/^(?=## \[)/m).slice(1, ANZAHL + 1).map((v) => v
  .replace(/^\[[^\]]+\]: \S+$/gm, '')
  .replace(/^## \[([^\]]+)\]/, (_m, v) => `### ${links[v] ? `[${v}](${links[v]})` : v}`)
  .replace(/^### (?!\[)(\w)/gm, '#### $1')
  .trim());
const block = `<!-- changelog:start -->\n<!-- Generated from CHANGELOG.md – do not edit here. -->\n${versionen.join('\n\n')}\n\n[Full changelog](CHANGELOG.md)\n<!-- changelog:end -->`;

const datei = path.join(root, 'README.md');
const readme = fs.readFileSync(datei, 'utf8');
const eol = readme.includes('\r\n') ? '\r\n' : '\n'; // Windows checkout keeps CRLF
const neu = readme.replace(/<!-- changelog:start -->[\s\S]*?<!-- changelog:end -->/, () => block.replace(/\n/g, eol));
if (neu === readme && !readme.includes('<!-- changelog:start -->')) throw new Error('README.md has no changelog markers');
fs.writeFileSync(datei, neu);
