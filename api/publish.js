import { getSession, github, json, repoConfig } from './_lib.js';

function validateDeck(deck) {
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length < 1 || deck.slides.length > 100) throw new Error('页面数据无效');
  for (const slide of deck.slides) {
    if (!slide.id || !Array.isArray(slide.layers)) throw new Error('页面结构无效');
    if (slide.layers.length > 80) throw new Error('单页文字图层过多');
  }
}

export async function POST(request) {
  const session = getSession(request);
  if (!session) return json({ error: '登录已失效，请重新登录' }, 401);
  try {
    const body = await request.json();
    validateDeck(body.deck);
    const files = Array.isArray(body.files) ? body.files : [];
    if (files.length > 6) return json({ error: '一次最多发布 6 张新图片，请分批发布' }, 413);
    const totalBase64 = files.reduce((sum, file) => sum + String(file.contentBase64 || '').length, 0);
    if (totalBase64 > 4_000_000) return json({ error: '本次图片总量过大，请减少后再发布' }, 413);
    for (const file of files) {
      if (!/^assets\/slides\/uploads\/[a-z0-9.-]+$/i.test(file.path || '')) throw new Error('图片路径无效');
      if (!/^[A-Za-z0-9+/=]+$/.test(file.contentBase64 || '')) throw new Error('图片内容无效');
    }

    const { owner, repo, branch } = repoConfig();
    const ref = await github(session.token, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    const parentSha = ref.object.sha;
    const parentCommit = await github(session.token, `/repos/${owner}/${repo}/git/commits/${parentSha}`);
    const tree = [];

    const deckJson = JSON.stringify({ ...body.deck, updatedAt: new Date().toISOString() }, null, 2) + '\n';
    const deckBlob = await github(session.token, `/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: Buffer.from(deckJson, 'utf8').toString('base64'), encoding: 'base64' })
    });
    tree.push({ path: 'deck.json', mode: '100644', type: 'blob', sha: deckBlob.sha });

    for (const file of files) {
      const blob = await github(session.token, `/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: file.contentBase64, encoding: 'base64' })
      });
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const newTree = await github(session.token, `/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree })
    });
    const commit = await github(session.token, `/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: 'Publish ORQELA deck from online editor', tree: newTree.sha, parents: [parentSha] })
    });
    await github(session.token, `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    return json({ ok: true, sha: commit.sha, shortSha: commit.sha.slice(0, 7), updatedAt: JSON.parse(deckJson).updatedAt, commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}` });
  } catch (error) {
    const status = error.status === 409 || error.status === 422 ? 409 : error.status || 500;
    return json({ error: status === 409 ? 'GitHub 版本已变化，请刷新编辑器后重试' : error.message || '发布失败' }, status);
  }
}
