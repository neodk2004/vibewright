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
  console.log('forge ok');
})();
