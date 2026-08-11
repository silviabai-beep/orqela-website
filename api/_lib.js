import crypto from 'node:crypto';

const SESSION_COOKIE = 'orqela_session';
const STATE_COOKIE = 'orqela_oauth_state';

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

export function parseCookies(request) {
  const raw = request.headers.get('cookie') || '';
  return Object.fromEntries(raw.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return index < 0 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`, `SameSite=${options.sameSite || 'Lax'}`];
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  if (Number.isFinite(options.maxAge)) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error('SESSION_SECRET must contain at least 24 characters');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSession(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

export function decryptSession(value) {
  try {
    const packed = Buffer.from(value, 'base64url');
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const ciphertext = packed.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey(), iv);
    decipher.setAuthTag(tag);
    const payload = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
    if (!payload.token || !payload.login || Number(payload.expiresAt) < Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

export function getSession(request) {
  return decryptSession(parseCookies(request)[SESSION_COOKIE] || '');
}

export function allowedLogin() {
  return String(process.env.ALLOWED_GITHUB_LOGIN || 'silviabai-beep').toLowerCase();
}

export function repoConfig() {
  const value = String(process.env.GITHUB_REPOSITORY || 'silviabai-beep/orqela-website');
  const [owner, repo] = value.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY must use owner/repository format');
  return { owner, repo, fullName: `${owner}/${repo}`, branch: String(process.env.GITHUB_BRANCH || 'main') };
}

export async function github(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'orqela-publish-studio',
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub API error (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const cookies = { session: SESSION_COOKIE, state: STATE_COOKIE };
