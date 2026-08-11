import crypto from 'node:crypto';
import { cookie, cookies, json } from '../_lib.js';

export async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return json({ error: 'Vercel 尚未配置 GitHub 登录' }, 503);
  const origin = new URL(request.url).origin;
  const state = crypto.randomBytes(24).toString('hex');
  const target = new URL('https://github.com/login/oauth/authorize');
  target.searchParams.set('client_id', clientId);
  target.searchParams.set('redirect_uri', `${origin}/api/auth/callback`);
  target.searchParams.set('scope', 'public_repo');
  target.searchParams.set('state', state);
  target.searchParams.set('allow_signup', 'false');
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      'Set-Cookie': cookie(cookies.state, state, { maxAge: 600 })
    }
  });
}
