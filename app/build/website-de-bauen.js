// Erzeugt docs/de/index.html (deutsche Website) aus docs/index.html (englisch).
// Aufruf nach jeder Änderung an der Website: node app/build/website-de-bauen.js
// Texte mit data-i="schlüssel" werden durch die Übersetzung unten ersetzt.
const fs = require('fs');
const path = require('path');
const docs = path.join(__dirname, '..', '..', 'docs');
const BASIS = 'https://neodk2004.github.io/vibewright/';

const DE = {
  navHow:"So funktioniert's", navFeatures:"Funktionen", pill:"Kostenlos &amp; Open Source",
  h1:"Ein Satz rein. <span>Ein fertiges Projekt raus.</span><small>Vibewright – der Projektplaner für Claude Code</small>",
  lead:"Vibewright macht aus deiner Idee einen klaren Plan – und setzt ihn Schritt für Schritt mit Claude Code um, direkt in der App. Du klickst und gibst frei. Claude erledigt die Arbeit.",
  dl:"Kostenlos herunterladen", see:"So funktioniert's", small:"Windows 10/11 &amp; macOS 11+ · benötigt Claude Code",
  s1:"Interview", s2:"Bedarfsanalyse", s3:"Plan", s4:"Werkzeug-Check", s6:"Mit Claude bauen",
  t1:"Kostenlos &amp; MIT-lizenziert", t2:"Notizen bleiben auf deinem Rechner", t3:"Keine Programmierkenntnisse nötig", t4:"Deutsch &amp; Englisch",
  howH:"So funktioniert's", howSub:"Von „Ich hätte gern …“ zu „Es läuft“ – ohne Chat-Chaos, verstreute Notizen und halbfertige Pläne.",
  h1t:"Idee beschreiben", h1p:"Ein Satz reicht – eine Vogelhaus-Kamera, ein Podcast, ein Heimserver. Vibewright stellt ein paar Fragen zum Anklicken.",
  h2t:"Plan freigeben", h2p:"Du bekommst eine Bedarfsanalyse, einen Plan in Phasen und einen Check der nötigen Werkzeuge. Ohne dein OK passiert nichts.",
  h3t:"Mit Claude bauen", h3p:"Claude Code läuft in der App, kennt deinen Plan und hakt jeden erledigten Schritt ab. Du siehst immer, wo du stehst.",
  featH:"Alles, was ein Projekt braucht", featSub:"Vibewright übernimmt das Projektmanagement – du kümmerst dich um den spannenden Teil.",
  f1t:"Geführtes Interview", f1p:"Eine Frage pro Bildschirm, eigene Antwort jederzeit möglich. Nachfragen nur, wo etwas fehlt.",
  f2t:"Bedarfsanalyse", f2p:"Ziel, Umfang, Muss-Kriterien, Risiken, an die du nicht gedacht hast, und eine Machbarkeits-Ampel.",
  f3t:"Plan als Laufkarte", f3p:"3–6 Phasen mit klarem „Fertig, wenn …“ und konkreten Schritten in einfacher Sprache.",
  f4t:"Werkzeug-Check", f4p:"Prüft deinen PC und dein Claude-Setup und empfiehlt nur, was eine Phase wirklich braucht.",
  f5t:"Claude Code in der App", f5p:"Ein eingebautes Terminal mit passender CLAUDE.md. Erledigte Schritte werden live abgehakt.",
  f6t:"Obsidian oder Markdown", f6p:"Alles landet in deinem Obsidian-Vault (Dataview, Kanban) oder als .md-Dateien mit HTML-Dashboard.",
  f7t:"„Mir ist noch was eingefallen“", f7p:"Gedanken jederzeit eintippen – Claude sortiert sie in die passende Phase ein.",
  f8t:"Git-Sicherheitsnetz", f8p:"Optional: Claude committet nach jedem Schritt, du kannst jederzeit zurück.",
  f9t:"Pflege-Modus", f9p:"Fertige Code-Projekte holen neue GitHub- oder Gitea-Issues ab – nichts kommt ohne deinen Klick in den Plan.",
  shotH:"Schau rein", shotSub:"Dunkel oder hell – immer übersichtlich, nie überladen.", light:"Heller Modus",
  q1:"Ist Vibewright kostenlos?", a1:"Ja. Die App ist kostenlos und Open Source (MIT). Du brauchst ein eigenes Claude-Abo – empfohlen ist Pro oder Max.",
  q2:"Muss ich programmieren können?", a2:"Nein. Die Schritte sind in einfacher Sprache geschrieben, du entscheidest per Klick. Den technischen Teil erledigt Claude Code.",
  q3:"Wohin gehen meine Daten?", a3:"Pläne und Notizen werden als Dateien auf deinem Rechner gespeichert (Obsidian-Vault oder ein Ordner deiner Wahl). Nur Claude Code spricht mit Anthropic – mit deinem eigenen Konto. Vibewright hat keinen Server und kein Tracking.",
  q4:"Was muss ich installieren?", a4:"Windows 10/11 (64 Bit) oder macOS 11+, dazu <a href=\"https://docs.claude.com/de/docs/claude-code/setup\">Claude Code</a>, angemeldet. Obsidian und Git sind optional.",
  q5:"Ist der Download sicher?", a5:"Jeder Installer wird von VirusTotal geprüft und hat eine SHA-256-Prüfsumme. Die Mac-App ist von Apple signiert und notarisiert. Der Windows-Installer ist noch nicht signiert, daher kann SmartScreen warnen – „Weitere Informationen → Trotzdem ausführen“ klicken.",
  ctaH:"Eine Idee im Kopf? Fang heute an.", ctaSub:"Lade Vibewright kostenlos herunter und mach aus deiner nächsten Idee ein fertiges Projekt.",
  dl2:"Für Windows &amp; macOS herunterladen", manual:"Handbuch lesen", e1:"Ablauf", e2:"Funktionen", e3:"Screenshots", faqH:"Fragen vor dem Start",
  foot:"Open Source unter der MIT-Lizenz", aff:"Nicht verbunden mit Anthropic oder Obsidian."
};
DE.titel = 'Vibewright – You vibe. It builds. | Projektplaner für Claude Code';
DE.beschreibung = 'Vibewright ist eine kostenlose Desktop-App für Windows und macOS: Aus einer einzeiligen Idee wird ein fertiger Projektplan, den du mit Claude Code direkt in der App umsetzt. Notizen in Obsidian oder als Markdown.';
DE.ogBeschreibung = 'Aus einer Idee in einem Satz wird ein kompletter Projektplan – umgesetzt mit Claude Code, direkt in der App.';

let html = fs.readFileSync(path.join(docs, 'index.html'), 'utf8');
const fehlt = [];
for (const [key, text] of Object.entries(DE)) {
  const re = new RegExp(String.raw`(<(\w+)[^>]*\sdata-i="` + key + String.raw`"[^>]*>)[\s\S]*?(</\2>)`, 'g');
  if (!re.test(html)) { if (!['titel', 'beschreibung', 'ogBeschreibung'].includes(key)) fehlt.push(key); continue; }
  html = html.replace(re, (_m, auf, _t, zu) => auf + text + zu);
}
const tausch = (alt, neu) => { if (!html.includes(alt)) fehlt.push(alt); html = html.split(alt).join(neu); };
tausch('<html lang="en">', '<html lang="de">');
tausch(/<title>[^<]*<\/title>/.exec(html)[0], `<title>${DE.titel}</title>`);
tausch(/<meta name="description" content="[^"]*">/.exec(html)[0], `<meta name="description" content="${DE.beschreibung}">`);
tausch(/<meta property="og:description" content="[^"]*">/.exec(html)[0], `<meta property="og:description" content="${DE.ogBeschreibung}">`);
tausch(`<link rel="canonical" href="${BASIS}">`, `<link rel="canonical" href="${BASIS}de/">`);
tausch(`<meta property="og:url" content="${BASIS}">`, `<meta property="og:url" content="${BASIS}de/">`);
tausch('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="de_DE">');
tausch('<meta property="og:locale:alternate" content="de_DE">', '<meta property="og:locale:alternate" content="en_US">');
tausch('href="https://github.com/neodk2004/vibewright/wiki/Home-English"', 'href="https://github.com/neodk2004/vibewright/wiki"');
tausch('<a href="./" hreflang="en" aria-current="true">EN</a><a href="de/" hreflang="de">DE</a>', '<a href="../" hreflang="en">EN</a><a href="./" hreflang="de" aria-current="true">DE</a>');
tausch('aria-label="Demo: from interview to building with Claude"', 'aria-label="Demo: vom Interview bis zum Bauen mit Claude"');
tausch('const SEITE = \'en\';', 'const SEITE = \'de\';');
// Relative Pfade eine Ebene tiefer
html = html.replace(/(src|href|poster)="(icon\.png|media\/|screenshots\/)/g, '$1="../$2');

if (fehlt.length) { console.error('Nicht gefunden:', fehlt); process.exit(1); }
fs.mkdirSync(path.join(docs, 'de'), { recursive: true });
fs.writeFileSync(path.join(docs, 'de', 'index.html'), html);
console.log('docs/de/index.html geschrieben');
