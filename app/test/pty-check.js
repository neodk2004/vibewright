// Prüft, ob node-pty in Electron läuft und claude startet: npx electron test/pty-check.js
const { app } = require('electron');
const { execFileSync } = require('child_process');
app.whenReady().then(() => {
  const pty = require('@lydell/node-pty');
  const exe = execFileSync('where.exe', ['claude']).toString().split(/\r?\n/)[0].trim(); // pty braucht den vollen Pfad
  const p = pty.spawn(exe, ['--version'], { cols: 80, rows: 10, cwd: process.cwd(), env: process.env });
  let out = '';
  p.onData((d) => (out += d));
  p.onExit(({ exitCode }) => { console.log('exit', exitCode, JSON.stringify(out.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').trim())); app.quit(); });
});
