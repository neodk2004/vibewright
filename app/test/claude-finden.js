// Prüft, dass Claude auch bei einer npm-Installation (claude.cmd) gefunden wird – ohne echtes npm.
// Aufruf: node test/claude-finden.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const d = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-'));
const cli = path.join(d, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
fs.mkdirSync(path.dirname(cli), { recursive: true });
fs.writeFileSync(cli, '');
// So sieht ein npm-Starter (cmd-shim) aus – inklusive der node.exe-Zeile, die nicht verwechselt werden darf
fs.writeFileSync(path.join(d, 'claude.cmd'), [
  '@ECHO off', 'GOTO start', ':find_dp0', 'SET dp0=%~dp0', 'EXIT /b', ':start', 'SETLOCAL', 'CALL :find_dp0',
  'IF EXIST "%dp0%\\node.exe" (', '  SET "_prog=%dp0%\\node.exe"', ') ELSE (', '  SET "_prog=node"', ')',
  'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\@anthropic-ai\\claude-code\\cli.js" %*',
].join('\r\n'));

// where.exe so umbiegen, dass nur die npm-Variante gefunden wird
const echt = cp.execFileSync;
cp.execFileSync = (cmd, args, o) => (cmd === 'where.exe' && args[0] === 'claude' ? Buffer.from(path.join(d, 'claude.cmd') + '\r\n') : echt(cmd, args, o));
const altHome = os.homedir;
os.homedir = () => d; // kein ~/.local/bin/claude.exe
const core = require('../core');
const b = core.claudeBefehl();
os.homedir = altHome;
assert.ok(/node\.exe$/i.test(b.datei), `erwartet node.exe, bekommen ${b.datei}`);
assert.strictEqual(b.vorne[0], cli);
console.log('ok – npm-Installation:', b.datei, b.vorne[0]);
