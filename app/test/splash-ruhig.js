// Prüft den Splash mit „Bewegung reduzieren“: npx electron test/splash-ruhig.js <ziel.png>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 420, height: 350, frame: false, transparent: true, show: true });
  await w.loadFile(path.join(__dirname, '..', 'splash.html'));
  // Systemeinstellung „Bewegung reduzieren“ nachstellen
  w.webContents.debugger.attach();
  await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await new Promise((r) => setTimeout(r, 800));
  fs.writeFileSync(process.argv[2], (await w.webContents.capturePage()).toPNG());
  app.quit();
});
