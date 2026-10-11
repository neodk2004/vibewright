// Rendert build/icon.svg zu icon.png (512 px) und icon.ico (16–256 px) – mit Electron selbst, ohne Grafik-Tools.
// Aufruf: npx electron build/icon-bauen.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
const GROESSEN = [16, 24, 32, 48, 64, 128, 256];

async function rendern(win, px) {
  await win.loadURL(`data:text/html,${encodeURIComponent(`<body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${px}" height="${px}" `)}</body>`)}`);
  win.setContentSize(px, px);
  await new Promise((r) => setTimeout(r, 150));
  return (await win.webContents.capturePage({ x: 0, y: 0, width: px, height: px })).resize({ width: px, height: px }).toPNG();
}

// ICO-Datei mit eingebetteten PNGs (von Windows Vista an unterstützt)
function ico(pngs) {
  const kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0); kopf.writeUInt16LE(1, 2); kopf.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const eintraege = pngs.map(({ px, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(px >= 256 ? 0 : px, 0); e.writeUInt8(px >= 256 ? 0 : px, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([kopf, ...eintraege, ...pngs.map((p) => p.png)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
  const pngs = [];
  for (const px of GROESSEN) pngs.push({ px, png: await rendern(win, px) });
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico(pngs));
  fs.mkdirSync(path.join(__dirname, '..', 'assets'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'icon.ico'), path.join(__dirname, '..', 'assets', 'icon.ico'));
  fs.copyFileSync(path.join(__dirname, 'icon.svg'), path.join(__dirname, '..', 'assets', 'icon.svg'));
  fs.writeFileSync(path.join(__dirname, 'icon.png'), await rendern(win, 512));
  console.log('icon.ico + icon.png geschrieben');
  app.quit();
});
