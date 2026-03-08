const USERS = {
  arek:  { pin: "1111" },
  kris: { pin: "2222" },
  diana: { pin: "3333" },
};

const GITHUB_OWNER = 'arekb67';
const GITHUB_REPO  = 'gym-log';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    // POST /login — validate username + PIN
    if (request.method === 'POST' && url.pathname === '/login') {
      const { username, pin } = await request.json();
      const user = USERS[username?.toLowerCase()];
      if (!user || user.pin !== pin) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid username or PIN' }), {
          status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // GET /programme?user=arek — load user's programme
    if (request.method === 'GET' && url.pathname === '/programme') {
      const username = url.searchParams.get('user')?.toLowerCase();
      if (!username || !USERS[username]) {
        return new Response(JSON.stringify({ weeks: [] }), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      const data = await githubGet(env.GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, `programmes/program-${username}.json`, { weeks: [] });
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // GET /?user=arek — load user's log
    if (request.method === 'GET') {
      const username = url.searchParams.get('user')?.toLowerCase();
      if (!username || !USERS[username]) {
        return new Response(JSON.stringify({ sessions: [] }), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      const data = await githubGet(env.GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, `logs/data-${username}.json`, { sessions: [] });
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // PUT / — save user's log
    if (request.method === 'PUT') {
      const body = await request.json();
      const username = body.user?.toLowerCase();
      if (!username || !USERS[username]) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid user' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      const ok = await githubPut(env.GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, `logs/data-${username}.json`, body.data);
      return new Response(JSON.stringify({ ok }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

async function githubGet(token, owner, repo, path, fallback) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'gym-log-worker' }
  });
  if (!res.ok) return fallback || {};
  const file = await res.json();
  return JSON.parse(atob(file.content.replace(/\n/g, '')));
}

async function githubPut(token, owner, repo, path, data) {
  // Get current SHA first
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'gym-log-worker' }
  });
  let sha = undefined;
  if (getRes.ok) {
    const file = await getRes.json();
    sha = file.sha;
  }
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const body = { message: `update ${path}`, content, ...(sha ? { sha } : {}) };
  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'gym-log-worker' },
    body: JSON.stringify(body)
  });
  return putRes.ok;
}