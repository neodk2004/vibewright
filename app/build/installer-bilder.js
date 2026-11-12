// Rendert die Bilder für den Windows-Installer (NSIS) im Vibewright-Look – mit Electron selbst, ohne Grafik-Tools.
// installerSidebar.bmp (164×314): Willkommens- und Abschlussseite · installerHeader.bmp (150×57): Kopf der Seiten dazwischen
// background.png (540×380) + background@2x.png: Fenster der Mac-.dmg (electron-builder nimmt sie automatisch)
// Aufruf: npx electron build/installer-bilder.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const logo = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
const SCHRIFT = "font-family:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif"; // einfache Anführungszeichen: steht in style="…"

const SEITE = `<div style="width:164px;height:314px;position:relative;overflow:hidden;${SCHRIFT};
  background:radial-gradient(120px 120px at 82px 92px,#9d8cff40,transparent 70%),radial-gradient(160px 120px at 30px 300px,#5fd0e026,transparent 70%),linear-gradient(180deg,#18191c,#0e0f11)">
  <div style="position:absolute;top:46px;left:0;right:0;text-align:center">${logo.replace('<svg ', '<svg width="76" height="76" ')}</div>
  <div style="position:absolute;top:136px;left:0;right:0;text-align:center;color:#e6e6e8;font-weight:700;font-size:21px;letter-spacing:.01em">Vibewright</div>
  <div style="position:absolute;top:164px;left:0;right:0;text-align:center;color:#9d8cff;font-size:11.5px;font-weight:600">You vibe. It builds.</div>
  <div style="position:absolute;left:28px;top:212px;color:#8d9199;font-size:10.5px;line-height:19px">
    ${['Idea', 'Interview', 'Plan', 'Build'].map((t, i) => `<div style="display:flex;align-items:center;gap:8px"><span style="width:7px;height:7px;border-radius:50%;background:${i === 3 ? '#56c27a' : '#9d8cff'};box-shadow:0 0 6px ${i === 3 ? '#56c27a' : '#9d8cff'}"></span>${t}</div>`).join('')}
  </div>
</div>`;

// Der NSIS-Kopf ist immer hell – Bild deshalb auf Weiß
const KOPF = `<div style="width:150px;height:57px;background:#fff;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-right:10px;box-sizing:border-box;${SCHRIFT}">
  <span style="color:#1d1e21;font-weight:700;font-size:15px">Vibewright</span>${logo.replace('<svg ', '<svg width="34" height="34" ')}
</div>`;

// Mac-.dmg: hell, weil Finder die Symbolnamen dunkel schreibt. Symbole liegen bei x 140 / 400, y 205 (siehe package.json → dmg.contents)
const pad = (x) => `<div style="position:absolute;left:${x - 75}px;top:132px;width:150px;height:150px;border-radius:26px;background:#fff;border:1px solid #e3e3df;box-shadow:0 10px 30px #6a55e81a"></div>`;
const DMG = `<div style="width:540px;height:380px;position:relative;overflow:hidden;${SCHRIFT};
  background:radial-gradient(300px 220px at 140px 210px,#6a55e824,transparent 70%),radial-gradient(300px 220px at 400px 210px,#5fd0e02e,transparent 70%),linear-gradient(180deg,#fbfbfa,#efefec)">
  <div style="position:absolute;top:28px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:10px">
    ${logo.replace('<svg ', '<svg width="34" height="34" ')}<span style="color:#1d1e21;font-weight:700;font-size:24px;letter-spacing:.01em">Vibewright</span>
  </div>
  <div style="position:absolute;top:72px;left:0;right:0;text-align:center;color:#6a55e8;font-size:12.5px;font-weight:600">You vibe. It builds.</div>
  ${pad(140)}${pad(400)}
  <svg style="position:absolute;left:228px;top:189px" width="84" height="32" viewBox="0 0 84 32">
    <path d="M4 16H74" stroke="#9d8cff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/>
    <path d="M64 6L78 16L64 26" fill="none" stroke="#6a55e8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div style="position:absolute;top:306px;left:0;right:0;text-align:center;color:#1d1e21;font-size:14px;font-weight:600">Ziehe Vibewright in den Ordner „Programme“</div>
  <div style="position:absolute;top:328px;left:0;right:0;text-align:center;color:#6b6f76;font-size:12px">Drag Vibewright to Applications</div>
</div>`;

async function rendern(win, html, w, h, zoom = 1) {
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<body style="margin:0;zoom:${zoom}">${html}</body>`)}`);
  win.setContentSize(w, h);
  await new Promise((r) => setTimeout(r, 300));
  return (await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h })).resize({ width: w, height: h, quality: 'best' });
}

// 24-Bit-BMP (das Format, das NSIS erwartet): Zeilen von unten nach oben, auf 4 Byte aufgefüllt
function bmp(bild) {
  const { width: w, height: h } = bild.getSize();
  const bgra = bild.toBitmap();
  const zeile = Math.ceil((w * 3) / 4) * 4;
  const daten = Buffer.alloc(zeile * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const q = (y * w + x) * 4, z = (h - 1 - y) * zeile + x * 3;
    daten[z] = bgra[q]; daten[z + 1] = bgra[q + 1]; daten[z + 2] = bgra[q + 2];
  }
  const kopf = Buffer.alloc(54);
  kopf.write('BM', 0); kopf.writeUInt32LE(54 + daten.length, 2); kopf.writeUInt32LE(54, 10);
  kopf.writeUInt32LE(40, 14); kopf.writeInt32LE(w, 18); kopf.writeInt32LE(h, 22);
  kopf.writeUInt16LE(1, 26); kopf.writeUInt16LE(24, 28); kopf.writeUInt32LE(daten.length, 34);
  return Buffer.concat([kopf, daten]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, frame: false, useContentSize: true, width: 1080, height: 760 });
  for (const [datei, html, w, h] of [['installerSidebar.bmp', SEITE, 164, 314], ['installerHeader.bmp', KOPF, 150, 57]]) {
    const bild = await rendern(win, html, w, h);
    fs.writeFileSync(path.join(__dirname, datei), bmp(bild));
    fs.writeFileSync(path.join(__dirname, datei.replace('.bmp', '-vorschau.png')), bild.toPNG()); // nur zum Ansehen, nicht im Repo
  }
  fs.writeFileSync(path.join(__dirname, 'background.png'), (await rendern(win, DMG, 540, 380)).toPNG());
  fs.writeFileSync(path.join(__dirname, 'background@2x.png'), (await rendern(win, DMG, 1080, 760, 2)).toPNG());
  console.log('installerSidebar.bmp + installerHeader.bmp + background.png + background@2x.png geschrieben');
  app.quit();
});
