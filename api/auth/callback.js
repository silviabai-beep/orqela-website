import { allowedLogin, cookie, cookies, encryptSession, github, json, parseCookies } from '../_lib.js';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = parseCookies(request)[cookies.state];
  if (!code || !state || !expectedState || state !== expectedState) return json({ error: 'GitHub 登录验证失败，请重试' }, 400);
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return json({ error: 'Vercel 尚未配置 GitHub OAuth' }, 503);

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: `${url.origin}/api/auth/callback` })
  });
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenPayload.access_token) return json({ error: tokenPayload.error_description || '无法获取 GitHub 登录令牌' }, 401);
  const user = await github(tokenPayload.access_token, '/user');
  if (String(user.login).toLowerCase() !== allowedLogin()) return json({ error: '此 GitHub 账号没有 ORQELA 编辑权限' }, 403);

  const session = encryptSession({
    token: tokenPayload.access_token,
    login: user.login,
    avatarUrl: user.avatar_url,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000
  });
  const headers = new Headers({ Location: '/admin.html' });
  headers.append('Set-Cookie', cookie(cookies.state, '', { maxAge: 0 }));
  headers.append('Set-Cookie', cookie(cookies.session, session, { maxAge: 8 * 60 * 60 }));
  return new Response(null, { status: 302, headers });
}
