import { cookie, cookies, json } from '../_lib.js';

export async function POST() {
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(cookies.session, '', { maxAge: 0 }) });
}
