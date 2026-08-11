import { getSession, github, json, repoConfig } from './_lib.js';

export async function GET(request) {
  const session = getSession(request);
  if (!session) return json({ error: '请先使用 GitHub 登录' }, 401);
  try {
    const { owner, repo, branch } = repoConfig();
    const file = await github(session.token, `/repos/${owner}/${repo}/contents/deck.json?ref=${encodeURIComponent(branch)}`);
    const deck = JSON.parse(Buffer.from(String(file.content || '').replace(/\n/g, ''), 'base64').toString('utf8'));
    return json({ deck, sha: file.sha });
  } catch (error) {
    return json({ error: error.message || '无法读取 GitHub 页面数据' }, error.status || 500);
  }
}
