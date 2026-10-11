// Screenshot des Splash-Screens nach der Einblend-Animation: npx electron test/splash-check.js <ziel.png>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 420, height: 350, frame: false, transparent: true, show: true, webPreferences: { backgroundThrottling: false } });
  await w.loadFile(path.join(__dirname, '..', 'splash.html'));
  await new Promise((r) => setTimeout(r, 1800));
  fs.writeFileSync(process.argv[2], (await w.webContents.capturePage()).toPNG());
  app.quit();
});
