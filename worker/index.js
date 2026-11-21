// SZAUDER STUDIO — private API for the CORE dashboard and the EDITOR.
//
// Runs only for /studio/api/* (wrangler.jsonc → assets.run_worker_first); every other
// path is served as a static asset exactly as before.
//
// Security layers, outermost first:
//   1. Cloudflare Access protects /studio/* — nobody reaches this code without signing in.
//   2. This worker re-verifies the Access JWT (signature, issuer, expiry, allowed email).
//   3. State-changing requests need a custom header, which cross-site pages cannot send.
//   4. Google access uses the narrow drive.file scope: the app only sees files it created.
//   5. The Google client secret and refresh token live only in Worker secrets / KV.

const API = '/studio/api';
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const SCOPES = 'openid email https://www.googleapis.com/auth/drive.file';
const ROOT_NAME = 'STUDIO_EDITOR';
const PROJECT_DIRS = ['originals', 'pages', 'prompts', 'previews', 'generations', 'versions'];
const VERSION_INTERVAL = 10 * 60 * 1000;
const MAX_MANIFEST = 8 * 1024 * 1024;
const MAX_FILE = 95 * 1024 * 1024;
const HASHED = /^[a-f0-9]{64}\.[a-z0-9]{1,6}$/;
const PROJECT_ID = /^[A-Za-z0-9-]{8,64}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(API + '/')) return env.ASSETS.fetch(request);
    try {
      const user = await accessUser(request, env);
      return await route(request, env, url, user);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500 && !e.status) console.error(e);
      return json({ error: e.message || 'Server error', code: e.code || null, ...(e.extra || {}) }, status);
    }
  }
};

// ---------- helpers ----------

class HttpError extends Error {
  constructor(status, message, code = null, extra = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}
const fail = (status, message, code, extra) => {
  throw new HttpError(status, message, code, extra);
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

function html(body, status = 200) {
  return new Response('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>SZAUDER STUDIO</title>' +
    '<body style="font:16px/1.5 system-ui;background:#18191b;color:#e9e9e6;padding:40px;max-width:640px">' + body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function b64urlBytes(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
const b64urlText = s => new TextDecoder().decode(b64urlBytes(s));

async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
}

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');

function configured(env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.STUDIO_KV);
}

function requireConfigured(env) {
  if (!env.STUDIO_KV) fail(503, 'Server storage (STUDIO_KV) is not bound.', 'not_configured');
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) fail(503, 'Google Drive is not configured on the server yet (GOOGLE_CLIENT_SECRET missing).', 'not_configured');
}

// Trim a string to a byte budget without splitting a character (Drive appProperties limit).
function clip(value, bytes = 100) {
  let s = String(value ?? '');
  const enc = new TextEncoder();
  while (enc.encode(s).length > bytes) s = s.slice(0, -1);
  return s;
}

// ---------- Cloudflare Access ----------

let certCache = { at: 0, keys: [] };

async function accessKeys(env, force = false) {
  if (!force && certCache.keys.length && Date.now() - certCache.at < 3600_000) return certCache.keys;
  const r = await fetch(env.ACCESS_TEAM_DOMAIN + '/cdn-cgi/access/certs');
  if (!r.ok) fail(503, 'Could not load Access signing keys.');
  certCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  return certCache.keys;
}

async function accessUser(request, env) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ALLOWED_ACCESS_EMAILS) fail(503, 'Access is not configured on the server.', 'not_configured');
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) fail(401, 'Sign-in required. Reload the page to sign in again.', 'access');
  const parts = token.split('.');
  if (parts.length !== 3) fail(401, 'Invalid sign-in token.', 'access');
  let header, payload;
  try {
    header = JSON.parse(b64urlText(parts[0]));
    payload = JSON.parse(b64urlText(parts[1]));
  } catch {
    fail(401, 'Invalid sign-in token.', 'access');
  }
  if (header.alg !== 'RS256') fail(401, 'Invalid sign-in token.', 'access');
  let jwk = (await accessKeys(env)).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await accessKeys(env, true)).find(k => k.kid === header.kid);
  if (!jwk) fail(401, 'Unknown sign-in key.', 'access');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) fail(401, 'Invalid sign-in signature.', 'access');
  const now = Date.now() / 1000;
  if (payload.iss !== env.ACCESS_TEAM_DOMAIN || !(payload.exp > now) || payload.nbf && payload.nbf > now + 60) fail(401, 'Sign-in expired. Reload the page.', 'access');
  if (env.ACCESS_AUD && ![].concat(payload.aud).includes(env.ACCESS_AUD)) fail(401, 'Sign-in token is for another application.', 'access');
  const allowed = env.ALLOWED_ACCESS_EMAILS.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const email = String(payload.email || '').toLowerCase();
  if (!allowed.includes(email)) fail(403, 'This account is not allowed to use the studio.', 'forbidden');
  return email;
}

// Cross-site pages cannot add custom headers without a CORS preflight, which this API never grants.
function requireSameSite(request, url) {
  if (request.headers.get('X-Studio-Request') !== '1') fail(403, 'Missing studio request header.', 'csrf');
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) fail(403, 'Cross-site request refused.', 'csrf');
}

// ---------- Google OAuth ----------

// gmail.com and googlemail.com are the same mailbox.
const normalEmail = s => String(s || '').trim().toLowerCase().replace(/@googlemail\.com$/, '@gmail.com');
const sameGoogleAccount = (a, b) => normalEmail(a) === normalEmail(b);

function publicOrigin(env, url) {
  return env.PUBLIC_ORIGIN || url.origin;
}

async function authStart(env, url) {
  requireConfigured(env);
  const state = randomId();
  const back = url.searchParams.get('return') || '/studio/';
  await env.STUDIO_KV.put('oauth_state:' + state, JSON.stringify({ back: back.startsWith('/studio/') ? back : '/studio/' }), { expirationTtl: 600 });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: publicOrigin(env, url) + API + '/auth/callback',
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });
  if (env.GOOGLE_ACCOUNT) params.set('login_hint', env.GOOGLE_ACCOUNT);
  return Response.redirect(GOOGLE_AUTH + '?' + params, 302);
}

async function authCallback(env, url) {
  requireConfigured(env);
  const state = url.searchParams.get('state') || '';
  const saved = state && await env.STUDIO_KV.get('oauth_state:' + state, 'json');
  if (!saved) return html('<h2>Connection expired</h2><p>Please start the Google Drive connection again from the studio.</p><p><a style="color:#ff835e" href="/studio/">Back to the studio</a></p>', 400);
  await env.STUDIO_KV.delete('oauth_state:' + state);
  if (url.searchParams.get('error')) return html('<h2>Google Drive was not connected</h2><p>' + escapeHtml(url.searchParams.get('error')) + '</p><p><a style="color:#ff835e" href="/studio/">Back to the studio</a></p>', 400);
  const r = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    body: new URLSearchParams({
      code: url.searchParams.get('code') || '',
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: publicOrigin(env, url) + API + '/auth/callback',
      grant_type: 'authorization_code'
    })
  });
  const t = await r.json();
  if (!r.ok) return html('<h2>Google refused the connection</h2><p>' + escapeHtml(t.error_description || t.error || r.status) + '</p><p><a style="color:#ff835e" href="/studio/">Back to the studio</a></p>', 502);
  // The ID token arrives directly from Google over TLS, so its claims can be read without a signature check.
  let claims = {};
  try {
    claims = JSON.parse(b64urlText(t.id_token.split('.')[1]));
  } catch {}
  const email = String(claims.email || '').toLowerCase();
  if (env.GOOGLE_ACCOUNT && (sameGoogleAccount(email, env.GOOGLE_ACCOUNT) === false || claims.email_verified === false)) {
    if (t.access_token) await fetch(GOOGLE_REVOKE + '?token=' + encodeURIComponent(t.refresh_token || t.access_token), { method: 'POST' });
    return html('<h2>Wrong Google account</h2><p>You signed in as <b>' + escapeHtml(email || 'unknown') + '</b>. The studio archive belongs to <b>' + escapeHtml(env.GOOGLE_ACCOUNT) + '</b>. Please connect again with that account.</p><p><a style="color:#ff835e" href="/studio/">Back to the studio</a></p>', 403);
  }
  if (!String(t.scope || '').includes('drive.file')) return html('<h2>Drive permission missing</h2><p>Please allow the studio to create and edit its own files in Google Drive.</p><p><a style="color:#ff835e" href="/studio/">Back to the studio</a></p>', 403);
  const previous = await env.STUDIO_KV.get('google', 'json');
  const refresh = t.refresh_token || previous?.refresh_token;
  if (!refresh) return html('<h2>Google did not return a long-term permission</h2><p>Remove “Szauder Studio” at myaccount.google.com/permissions and connect again.</p>', 502);
  await env.STUDIO_KV.put('google', JSON.stringify({ refresh_token: refresh, email, connectedAt: new Date().toISOString() }));
  await env.STUDIO_KV.put('google_access', JSON.stringify({ token: t.access_token, exp: Date.now() + t.expires_in * 1000 }), { expirationTtl: Math.max(60, t.expires_in - 60) });
  return Response.redirect(publicOrigin(env, url) + saved.back + (saved.back.includes('?') ? '&' : '?') + 'drive=connected', 302);
}

async function disconnect(env) {
  const g = await env.STUDIO_KV.get('google', 'json');
  if (g?.refresh_token) await fetch(GOOGLE_REVOKE + '?token=' + encodeURIComponent(g.refresh_token), { method: 'POST' }).catch(() => {});
  await env.STUDIO_KV.delete('google');
  await env.STUDIO_KV.delete('google_access');
  return json({ ok: true });
}

async function accessToken(env, force = false) {
  requireConfigured(env);
  if (!force) {
    const cached = await env.STUDIO_KV.get('google_access', 'json');
    if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  }
  const g = await env.STUDIO_KV.get('google', 'json');
  if (!g?.refresh_token) fail(409, 'Google Drive is not connected.', 'drive_disconnected');
  const r = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: g.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (t.error === 'invalid_grant') {
      await env.STUDIO_KV.delete('google');
      await env.STUDIO_KV.delete('google_access');
      fail(409, 'The Google Drive permission expired. Connect Google Drive again.', 'drive_disconnected');
    }
    fail(502, 'Google sign-in refresh failed: ' + (t.error_description || t.error || r.status));
  }
  await env.STUDIO_KV.put('google_access', JSON.stringify({ token: t.access_token, exp: Date.now() + t.expires_in * 1000 }), { expirationTtl: Math.max(60, t.expires_in - 60) });
  return t.access_token;
}

// ---------- Google Drive ----------

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function drive(env, path, init = {}, options = {}) {
  let token = await accessToken(env);
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(path.startsWith('http') ? path : DRIVE + path, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: 'Bearer ' + token }
    });
    if (r.ok || options.allow404 && r.status === 404) return r;
    const text = await r.text();
    if (r.status === 401 && attempt === 0) {
      token = await accessToken(env, true);
      continue;
    }
    const rateLimited = r.status === 429 || r.status >= 500 || r.status === 403 && /rateLimitExceeded|userRateLimitExceeded/.test(text);
    if (rateLimited && attempt < 3) {
      await sleep(400 * 2 ** attempt);
      continue;
    }
    if (rateLimited) fail(503, 'Google Drive is busy. Your work is kept locally; try again shortly.', 'drive_busy');
    if (r.status === 403 && /insufficient|PERMISSION/i.test(text)) fail(409, 'Google Drive permission is missing. Connect Google Drive again.', 'drive_disconnected');
    if (r.status === 403 && /storageQuotaExceeded/.test(text)) fail(507, 'Google Drive is full.', 'drive_full');
    fail(502, 'Google Drive error ' + r.status + ': ' + text.slice(0, 240), 'drive_error');
  }
}

const quote = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const FILE_FIELDS = 'id,name,mimeType,size,modifiedTime,createdTime,appProperties,parents';

async function listFiles(env, q, fields = FILE_FIELDS) {
  const files = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ q, fields: 'nextPageToken,files(' + fields + ')', pageSize: '1000', spaces: 'drive' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await (await drive(env, '/files?' + params)).json();
    files.push(...(page.files || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return files;
}

async function findChild(env, parentId, name, mime) {
  let q = quote(parentId) + ' in parents and name = ' + quote(name) + ' and trashed = false';
  if (mime) q += ' and mimeType = ' + quote(mime);
  const files = await listFiles(env, q);
  return files[0] || null;
}

async function createFolder(env, parentId, name, appProperties = {}) {
  const r = await drive(env, '/files?fields=' + FILE_FIELDS, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER, parents: [parentId], appProperties })
  });
  return r.json();
}

async function ensureFolder(env, parentId, name, appProperties) {
  return (await findChild(env, parentId, name, FOLDER)) || createFolder(env, parentId, name, appProperties);
}

// Resumable upload handles any size and both create (POST) and replace (PATCH).
async function uploadFile(env, { id = null, parents, name, mime, appProperties, bytes }) {
  const meta = id ? { appProperties } : { name, parents, mimeType: mime, appProperties };
  const start = await drive(env, UPLOAD + '/files' + (id ? '/' + id : '') + '?uploadType=resumable&fields=' + FILE_FIELDS, {
    method: id ? 'PATCH' : 'POST',
    headers: { 'content-type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(bytes.byteLength) },
    body: JSON.stringify(meta)
  });
  const location = start.headers.get('Location');
  if (!location) fail(502, 'Google Drive did not accept the upload.', 'drive_error');
  const r = await drive(env, location, { method: 'PUT', headers: { 'content-type': mime }, body: bytes });
  return r.json();
}

// The studio root carries an appProperty, so it is found even after it is moved inside
// another folder in Drive (for example into the existing SZAUDER CORE folder).
async function layout(env) {
  const cached = await env.STUDIO_KV.get('layout', 'json');
  if (cached?.rootId && cached.projectsId && cached.sharedId) return cached;
  const marked = await listFiles(env, "appProperties has { key='szauderRole' and value='studio-root' } and trashed = false");
  const root = marked[0] || await createFolder(env, 'root', ROOT_NAME, { szauderRole: 'studio-root' });
  const projects = await ensureFolder(env, root.id, 'projects');
  const shared = await ensureFolder(env, root.id, 'shared_assets');
  const result = { rootId: root.id, projectsId: projects.id, sharedId: shared.id };
  await env.STUDIO_KV.put('layout', JSON.stringify(result));
  return result;
}

async function projectFolders(env, projectId, create) {
  if (!PROJECT_ID.test(projectId)) fail(400, 'Invalid project ID.');
  const key = 'project:' + projectId;
  const cached = await env.STUDIO_KV.get(key, 'json');
  if (cached?.folderId) return cached;
  const { projectsId } = await layout(env);
  let folder = await findChild(env, projectsId, projectId, FOLDER);
  if (!folder) {
    if (!create) fail(404, 'Project not found in Google Drive.', 'not_found');
    folder = await createFolder(env, projectsId, projectId, { szauderRole: 'project', projectId });
  }
  const dirs = {};
  for (const name of PROJECT_DIRS) dirs[name] = (await ensureFolder(env, folder.id, name)).id;
  const result = { folderId: folder.id, dirs };
  await env.STUDIO_KV.put(key, JSON.stringify(result));
  return result;
}

// A cached folder can disappear if it is deleted in Drive; drop the cache and retry once.
async function withProject(env, projectId, create, work) {
  try {
    return await work(await projectFolders(env, projectId, create));
  } catch (e) {
    if (e.code !== 'drive_error' || !/ 404:/.test(e.message)) throw e;
    await env.STUDIO_KV.delete('project:' + projectId);
    await env.STUDIO_KV.delete('layout');
    return work(await projectFolders(env, projectId, create));
  }
}

function summaryFrom(p) {
  return {
    szauderRole: 'manifest',
    projectId: p.projectId,
    name: clip(p.name, 100),
    createdAt: clip(p.createdAt, 40),
    modifiedAt: clip(p.modifiedAt, 40),
    pages: String(Array.isArray(p.pages) ? p.pages.length : 1),
    category: clip(p.category || '', 60),
    archived: p.archived ? '1' : '0',
    // The first page is the project's cover, so the card does not change with the open page.
    preview: clip(p.cloudStorage?.previews?.[p.pages?.[0]?.id] || p.cloudStorage?.previews?.[p.activePageId] || '', 80)
  };
}

async function listProjects(env) {
  await layout(env);
  const files = await listFiles(env, "name = 'project.json' and trashed = false and appProperties has { key='szauderRole' and value='manifest' }");
  return files.map(f => ({
    projectId: f.appProperties?.projectId,
    name: f.appProperties?.name || 'Untitled',
    createdAt: f.appProperties?.createdAt || f.createdTime,
    modifiedAt: f.appProperties?.modifiedAt || f.modifiedTime,
    savedAt: f.modifiedTime,
    pages: Number(f.appProperties?.pages || 1),
    category: f.appProperties?.category || '',
    archived: f.appProperties?.archived === '1',
    preview: f.appProperties?.preview || '',
    revision: f.appProperties?.revision || null
  })).filter(p => p.projectId);
}

async function readManifest(env, projectId) {
  return withProject(env, projectId, false, async folders => {
    const file = await findChild(env, folders.folderId, 'project.json');
    if (!file) fail(404, 'Project not found in Google Drive.', 'not_found');
    const body = await (await drive(env, '/files/' + file.id + '?alt=media')).text();
    return new Response(body, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'X-Revision': file.appProperties?.revision || '',
        'X-Saved-At': file.modifiedTime
      }
    });
  });
}

async function writeManifest(env, request, projectId) {
  const expected = request.headers.get('If-Match') || '';
  if (!expected) fail(428, 'Missing If-Match revision.');
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_MANIFEST) fail(413, 'Project data is too large.');
  let p;
  try {
    p = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail(400, 'Project data is not valid JSON.');
  }
  if (!p || p.format !== 'ds-studio' || p.projectId !== projectId) fail(400, 'Project data does not match this project.');
  return withProject(env, projectId, expected === 'new', async folders => {
    const current = await findChild(env, folders.folderId, 'project.json');
    checkRevision(current, expected);
    return json(await commitManifest(env, folders, projectId, current, p, bytes));
  });
}

function checkRevision(current, expected) {
  const currentRevision = current?.appProperties?.revision || null;
  if (expected === 'new' ? current : expected !== currentRevision) {
    fail(409, 'This project was changed from another device or tab.', 'conflict', {
      currentRevision,
      savedAt: current?.modifiedTime || null
    });
  }
}

async function commitManifest(env, folders, projectId, current, p, bytes) {
  {
    const now = Date.now();
    const lastVersion = Number(current?.appProperties?.versionAt || 0);
    let versionAt = lastVersion;
    if (current && now - lastVersion >= VERSION_INTERVAL) {
      const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
      await drive(env, '/files/' + current.id + '/copy?fields=id', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'project-' + stamp + '.json', parents: [folders.dirs.versions], appProperties: { szauderRole: 'version', projectId } })
      });
      versionAt = now;
    }
    const revision = crypto.randomUUID();
    const saved = await uploadFile(env, {
      id: current?.id || null,
      parents: [folders.folderId],
      name: 'project.json',
      mime: 'application/json',
      appProperties: { ...summaryFrom(p), revision, versionAt: String(versionAt || now) },
      bytes
    });
    return { revision, savedAt: saved.modifiedTime };
  }
}

// ---------- 3D Stage ----------
// stage.json sits next to project.json with its own revision, so the 3D workspace and the
// 2D editor never overwrite each other. Models and textures go to originals/ (content-addressed).
const STAGE_FILE = 'stage.json';

async function readStage(env, projectId) {
  return withProject(env, projectId, false, async folders => {
    const file = await findChild(env, folders.folderId, STAGE_FILE);
    if (!file) fail(404, 'This project has no 3D stage yet.', 'no_stage');
    const body = await (await drive(env, '/files/' + file.id + '?alt=media')).text();
    return new Response(body, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'X-Revision': file.appProperties?.revision || '',
        'X-Saved-At': file.modifiedTime
      }
    });
  });
}

async function writeStage(env, request, projectId) {
  const expected = request.headers.get('If-Match') || '';
  if (!expected) fail(428, 'Missing If-Match revision.');
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_MANIFEST) fail(413, 'Stage data is too large.');
  let s;
  try {
    s = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail(400, 'Stage data is not valid JSON.');
  }
  if (!s || s.format !== 'ds-stage' || s.projectId !== projectId) fail(400, 'Stage data does not match this project.');
  return withProject(env, projectId, false, async folders => {
    if (!(await findChild(env, folders.folderId, 'project.json'))) fail(404, 'Project not found in Google Drive.', 'not_found');
    const current = await findChild(env, folders.folderId, STAGE_FILE);
    checkRevision(current, expected);
    return json(await commitStage(env, folders, projectId, current, bytes));
  });
}

async function commitStage(env, folders, projectId, current, bytes) {
  const now = Date.now();
  let versionAt = Number(current?.appProperties?.versionAt || 0);
  if (current && now - versionAt >= VERSION_INTERVAL) {
    const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
    await drive(env, '/files/' + current.id + '/copy?fields=id', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'stage-' + stamp + '.json', parents: [folders.dirs.versions], appProperties: { szauderRole: 'version', projectId } })
    });
    versionAt = now;
  }
  const revision = crypto.randomUUID();
  const saved = await uploadFile(env, {
    id: current?.id || null,
    parents: [folders.folderId],
    name: STAGE_FILE,
    mime: 'application/json',
    appProperties: { szauderRole: 'stage', projectId, revision, versionAt: String(versionAt || now) },
    bytes
  });
  return { revision, savedAt: saved.modifiedTime };
}

async function readManifestDoc(env, file) {
  return JSON.parse(await (await drive(env, '/files/' + file.id + '?alt=media')).text());
}

// CORE dashboard actions: rename, archive/restore, category. Same revision check as the editor.
async function updateMeta(env, request, projectId) {
  const expected = request.headers.get('If-Match') || '';
  if (!expected || expected === 'new') fail(428, 'Missing If-Match revision.');
  const change = await request.json().catch(() => ({}));
  return withProject(env, projectId, false, async folders => {
    const current = await findChild(env, folders.folderId, 'project.json');
    if (!current) fail(404, 'Project not found in Google Drive.', 'not_found');
    checkRevision(current, expected);
    const p = await readManifestDoc(env, current);
    if (typeof change.name === 'string' && change.name.trim()) p.name = change.name.trim().slice(0, 200);
    if (typeof change.archived === 'boolean') p.archived = change.archived;
    if (typeof change.category === 'string') p.category = change.category.trim().slice(0, 60);
    p.modifiedAt = new Date().toISOString();
    const bytes = new TextEncoder().encode(JSON.stringify(p));
    return json(await commitManifest(env, folders, projectId, current, p, bytes));
  });
}

// Server-side copy inside Drive: originals and previews are copied, never re-uploaded.
async function duplicateProject(env, projectId) {
  const src = await projectFolders(env, projectId, false);
  const current = await findChild(env, src.folderId, 'project.json');
  if (!current) fail(404, 'Project not found in Google Drive.', 'not_found');
  const p = await readManifestDoc(env, current);
  const newId = crypto.randomUUID();
  const dst = await projectFolders(env, newId, true);
  for (const dir of ['originals', 'previews']) {
    for (const f of await listFiles(env, quote(src.dirs[dir]) + ' in parents and trashed = false')) {
      await drive(env, '/files/' + f.id + '/copy?fields=id', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: f.name, parents: [dst.dirs[dir]], appProperties: { szauderRole: dir, projectId: newId } })
      });
    }
  }
  const now = new Date().toISOString();
  Object.assign(p, { projectId: newId, name: (p.name || 'Untitled') + ' copy', createdAt: now, modifiedAt: now, archived: false });
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  await commitManifest(env, dst, newId, null, p, bytes);
  const stageFile = await findChild(env, src.folderId, STAGE_FILE);
  if (stageFile) {
    const st = await readManifestDoc(env, stageFile);
    st.projectId = newId;
    await commitStage(env, dst, newId, null, new TextEncoder().encode(JSON.stringify(st)));
  }
  return json({ projectId: newId }, 201);
}

async function putHashed(env, request, projectId, dir, name) {
  if (!HASHED.test(name)) fail(400, 'Invalid file name.');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_FILE) fail(413, 'File is too large for a single upload.');
  return withProject(env, projectId, true, async folders => {
    const existing = await findChild(env, folders.dirs[dir], name);
    if (existing) return json({ name, existed: true });
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_FILE) fail(413, 'File is too large for a single upload.');
    if ((await sha256Hex(bytes)) !== name.slice(0, 64)) fail(400, 'File content does not match its name.');
    const mime = request.headers.get('content-type') || 'application/octet-stream';
    await uploadFile(env, { parents: [folders.dirs[dir]], name, mime, appProperties: { szauderRole: dir, projectId }, bytes });
    return json({ name, existed: false }, 201);
  });
}

async function getHashed(env, projectId, dir, name) {
  if (!HASHED.test(name)) fail(400, 'Invalid file name.');
  return withProject(env, projectId, false, async folders => {
    const file = await findChild(env, folders.dirs[dir], name);
    if (!file) fail(404, 'File not found in Google Drive.', 'not_found');
    const r = await drive(env, '/files/' + file.id + '?alt=media');
    return new Response(r.body, {
      headers: {
        'content-type': file.mimeType || 'application/octet-stream',
        'cache-control': 'private, max-age=31536000, immutable'
      }
    });
  });
}

async function status(env, user) {
  const g = env.STUDIO_KV ? await env.STUDIO_KV.get('google', 'json') : null;
  return json({
    user,
    drive: {
      configured: configured(env),
      connected: Boolean(g?.refresh_token),
      account: g?.email || null,
      expectedAccount: env.GOOGLE_ACCOUNT || null
    }
  });
}

// ---------- routing ----------

async function route(request, env, url, user) {
  const path = url.pathname.slice(API.length);
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') requireSameSite(request, url);

  if (path === '/status' && method === 'GET') return status(env, user);
  if (path === '/auth/start' && method === 'GET') return authStart(env, url);
  if (path === '/auth/callback' && method === 'GET') return authCallback(env, url);
  if (path === '/auth/disconnect' && method === 'POST') return disconnect(env);
  if (path === '/drive/init' && method === 'POST') return json(await layout(env));
  if (path === '/projects' && method === 'GET') return json({ projects: await listProjects(env) });

  const action = path.match(/^\/projects\/([^/]+)\/(meta|duplicate)$/);
  if (action && method === 'POST') {
    if (!PROJECT_ID.test(action[1])) fail(400, 'Invalid project ID.');
    return action[2] === 'meta' ? updateMeta(env, request, action[1]) : duplicateProject(env, action[1]);
  }
  const st = path.match(/^\/projects\/([^/]+)\/stage$/);
  if (st) {
    if (!PROJECT_ID.test(st[1])) fail(400, 'Invalid project ID.');
    if (method === 'GET') return readStage(env, st[1]);
    if (method === 'PUT') return writeStage(env, request, st[1]);
  }
  const m = path.match(/^\/projects\/([^/]+)(?:\/(originals|previews)\/([^/]+))?$/);
  if (m) {
    const [, projectId, dir, name] = m;
    if (!PROJECT_ID.test(projectId)) fail(400, 'Invalid project ID.');
    if (!dir && method === 'GET') return readManifest(env, projectId);
    if (!dir && method === 'PUT') return writeManifest(env, request, projectId);
    if (dir && method === 'GET') return getHashed(env, projectId, dir, decodeURIComponent(name));
    if (dir && method === 'PUT') return putHashed(env, request, projectId, dir, decodeURIComponent(name));
  }
  fail(404, 'Unknown studio API route.');
}
