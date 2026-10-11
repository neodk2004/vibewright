// Prüft, ob node-pty in Electron läuft: npx electron test/pty-check.js
// Windows: startet claude --version (wie die App). macOS/Linux: startet /bin/echo (Claude ist auf CI-Rechnern nicht installiert).
const { app } = require('electron');
const { execFileSync } = require('child_process');
app.whenReady().then(() => {
  const pty = require('@lydell/node-pty');
  const [datei, args, erwartet] = process.platform === 'win32'
    ? [execFileSync('where.exe', ['claude']).toString().split(/\r?\n/)[0].trim(), ['--version'], 'Claude Code'] // pty braucht den vollen Pfad
    : ['/bin/echo', ['vibewright-pty-ok'], 'vibewright-pty-ok'];
  const p = pty.spawn(datei, args, { cols: 80, rows: 10, cwd: process.cwd(), env: process.env });
  let out = '';
  p.onData((d) => (out += d));
  p.onExit(({ exitCode }) => {
    const text = out.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').trim();
    const ok = exitCode === 0 && text.includes(erwartet);
    console.log(ok ? 'pty ok:' : 'pty FEHLER:', exitCode, JSON.stringify(text));
    app.exit(ok ? 0 : 1);
  });
});
