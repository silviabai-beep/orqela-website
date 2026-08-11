import { getSession, json } from '../_lib.js';

export async function GET(request) {
  const session = getSession(request);
  if (!session) return json({ authenticated: false });
  return json({ authenticated: true, user: { login: session.login, avatarUrl: session.avatarUrl } });
}
