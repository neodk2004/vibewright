const { contextBridge, ipcRenderer } = require('electron');
const kanaele = ['start', 'ablage', 'obsidian-installieren', 'projekte', 'neu', 'laden', 'weiter', 'oeffnen', 'ordner',
  'aktualisieren', 'abhaken', 'claude-starten', 'link', 'sitzung', 'sitzung-beenden', 'idee', 'einstellungen', 'einstellung', 'git-identitaet', 'claude-anmelden', 'archivieren', 'loeschen', 'programmordner'];
const ereignisse = ['pty-daten', 'pty-ende', 'punkte-geaendert']; // Main → Oberfläche
const senden = ['pty-eingabe', 'pty-groesse'];                    // Oberfläche → Main (ohne Antwort, schnell)
contextBridge.exposeInMainWorld('api', {
  ...Object.fromEntries(kanaele.map((k) => [k, (...a) => ipcRenderer.invoke(k, ...a)])),
  on: (k, cb) => ereignisse.includes(k) && ipcRenderer.on(k, (_e, ...a) => cb(...a)),
  senden: (k, ...a) => senden.includes(k) && ipcRenderer.send(k, ...a),
  plattform: process.platform,
});
