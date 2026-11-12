// GitHub/Gitea-Import: URLs, Kopfzeilen und Umwandlung der Antwort (ohne Netz, fetch ist gefälscht)
const assert = require('assert');
const core = require('../core');

assert.strictEqual(core.forgeUrl({ typ: 'github', nutzer: 'a b' }), 'https://api.github.com/users/a%20b/repos?per_page=100&sort=updated');
assert.strictEqual(core.forgeUrl({ typ: 'github' }, 'T'), 'https://api.github.com/user/repos?per_page=100&sort=updated');
assert.strictEqual(core.forgeUrl({ typ: 'gitea', server: 'https://git.example.de/', nutzer: 'x' }), 'https://git.example.de/api/v1/users/x/repos?limit=50');
assert.strictEqual(core.forgeUrl({ typ: 'gitea', server: 'http://192.168.1.5:3000' }, 'T'), 'http://192.168.1.5:3000/api/v1/user/repos?limit=50');
assert.throws(() => core.forgeUrl({ typ: 'gitea', server: 'git.example.de' }), /Gitea-Servers/);

(async () => {
  let gesehen;
  global.fetch = async (url, o) => { gesehen = { url, auth: o.headers.Authorization }; return { ok: true, status: 200, json: async () => [
    { name: 'alt', full_name: 'x/alt', description: null, clone_url: 'https://g/x/alt.git', private: false, updated_at: '2025-01-01T00:00:00Z' },
    { name: 'neu', full_name: 'x/neu', description: 'Neu', clone_url: 'https://g/x/neu.git', private: true, updated_at: '2026-01-01T00:00:00Z' },
    { name: 'boese', full_name: 'x/boese', clone_url: 'file:///etc', updated_at: '2027-01-01T00:00:00Z' },
  ] }; };
  const r = await core.forgeRepos({ typ: 'gitea', server: 'https://g' }, 'T');
  assert.strictEqual(gesehen.auth, 'token T');
  assert.deepStrictEqual(r.map((x) => x.name), ['neu', 'alt'], 'neueste zuerst, nur http(s)-Clone-URLs');
  assert.strictEqual(r[0].privat, true);
  await core.forgeRepos({ typ: 'github', nutzer: 'x' });
  assert.strictEqual(gesehen.auth, undefined, 'ohne Token keine Anmeldung');
  global.fetch = async () => ({ ok: false, status: 401 });
  await assert.rejects(core.forgeRepos({ typ: 'github' }, 'falsch'), /Token prüfen/);
  await assert.rejects(core.forgeRepos({ typ: 'github' }), /Benutzername oder Token/);

  // Pflege-Modus: Repo aus der origin-Adresse – nur auf dem eingetragenen Server (der Token geht nie woandershin)
  const gh = { typ: 'github' }, gt = { typ: 'gitea', server: 'https://git.example.de' };
  assert.deepStrictEqual(core.forgeZiel(gh, 'https://github.com/neo/app.git\n'), { owner: 'neo', repo: 'app' });
  assert.deepStrictEqual(core.forgeZiel(gh, 'git@github.com:neo/app.git'), { owner: 'neo', repo: 'app' });
  assert.deepStrictEqual(core.forgeZiel(gh, 'https://user@github.com/neo/app'), { owner: 'neo', repo: 'app' });
  assert.deepStrictEqual(core.forgeZiel(gt, 'https://git.example.de/neo/app.git'), { owner: 'neo', repo: 'app' });
  assert.strictEqual(core.forgeZiel(gh, 'https://github.com.boese.de/neo/app.git'), null);
  assert.strictEqual(core.forgeZiel(gh, 'https://git.example.de/neo/app.git'), null);
  assert.strictEqual(core.forgeZiel(gt, 'https://github.com/neo/app.git'), null);
  assert.strictEqual(core.forgeZiel(gh, 'http://github.com/neo/app.git'), null, 'kein Klartext-http');
  assert.strictEqual(core.forgeZiel(gh, 'C:/code/app'), null);
  // Issues lesen: Pull Requests raus, Art aus den Labels; anlegen nur mit Token, GitHub mit Label
  global.fetch = async (url, o) => { gesehen = { url, o }; return { ok: true, json: async () => (o.method === 'POST' ? { number: 7, html_url: 'https://github.com/neo/app/issues/7' } : [
    { number: 1, title: 'Absturz', body: 'x', labels: [{ name: 'bug' }], user: { login: 'a' }, html_url: 'https://github.com/neo/app/issues/1' },
    { number: 2, title: 'Dark Mode', labels: [], user: { login: 'b' } },
    { number: 3, title: 'PR', pull_request: {} },
  ]) }; };
  const is = await core.forgeIssues(gh, '', { owner: 'neo', repo: 'app' });
  assert.strictEqual(gesehen.url, 'https://api.github.com/repos/neo/app/issues?state=open&per_page=50');
  assert.deepStrictEqual(is.map((x) => [x.nr, x.art]), [[1, 'fehler'], [2, 'wunsch']]);
  await assert.rejects(core.forgeIssueAnlegen(gh, '', { owner: 'neo', repo: 'app' }, 'fehler', 'x'), /Token/);
  const neu = await core.forgeIssueAnlegen(gh, 'T', { owner: 'neo', repo: 'app' }, 'wunsch', 'Export als PDF\nBitte mit Logo');
  assert.strictEqual(neu.nr, 7);
  assert.deepStrictEqual(JSON.parse(gesehen.o.body), { title: 'Export als PDF', body: 'Export als PDF\nBitte mit Logo', labels: ['enhancement'] });
  await core.forgeIssueAnlegen(gt, 'T', { owner: 'neo', repo: 'app' }, 'fehler', 'Absturz');
  assert.strictEqual(gesehen.url, 'https://git.example.de/api/v1/repos/neo/app/issues');
  assert.strictEqual(JSON.parse(gesehen.o.body).title, '[Bug] Absturz');

  // Importierter Code-Ordner: Steckbrief für die Prüfung „Interview nötig?“ und Interview.md ohne Fragen
  const fs = require('fs'), os = require('os'), path = require('path');
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'kph-steckbrief-'));
  fs.writeFileSync(path.join(ordner, 'README.md'), '# Wetterstation\nZeigt Temperatur auf einem Display.');
  fs.writeFileSync(path.join(ordner, 'platformio.ini'), '[env:esp32]');
  fs.mkdirSync(path.join(ordner, '.git'));
  const sb = await core.repoSteckbrief(ordner);
  assert.match(sb, /Dateien im Hauptordner: platformio\.ini, README\.md/);
  assert.match(sb, /--- README\.md ---\n# Wetterstation/);
  assert.match(sb, /--- platformio\.ini ---/);
  assert.ok(!sb.includes('.git'), sb);
  assert.strictEqual(await core.repoSteckbrief(path.join(ordner, 'gibt-es-nicht')), '');
  assert.match(core.interviewMd({ name: 'W', idee: 'x', runden: [], repo: ordner }), /Kein Interview nötig/);
  fs.rmSync(ordner, { recursive: true });
  console.log('forge ok');
})();
