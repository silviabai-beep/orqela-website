import { generateText } from 'ai';
import { getSession, json } from './_lib.js';

function clean(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

function parseTranslation(text, expectedLayers) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Translation model did not return JSON');
  const value = JSON.parse(cleaned.slice(start, end + 1));
  if (typeof value.title !== 'string' || typeof value.body !== 'string' || !Array.isArray(value.layers)) {
    throw new Error('Translation model returned an invalid structure');
  }
  const byId = new Map(value.layers.map(layer => [String(layer?.id || ''), String(layer?.text || '')]));
  return {
    title: clean(value.title, 1000),
    body: clean(value.body, 12000),
    layers: expectedLayers.map(layer => ({ id: layer.id, text: clean(byId.get(layer.id), 2400) }))
  };
}

export async function POST(request) {
  const session = getSession(request);
  if (!session) return json({ error: '请先使用 GitHub 登录' }, 401);

  try {
    const input = await request.json();
    const title = clean(input.title, 500);
    const body = clean(input.body, 8000);
    const layers = Array.isArray(input.layers)
      ? input.layers.slice(0, 80).map((layer, index) => ({
          id: clean(layer?.id || `layer-${index}`, 120),
          text: clean(layer?.text, 1200)
        }))
      : [];
    const totalLength = title.length + body.length + layers.reduce((sum, layer) => sum + layer.text.length, 0);
    if (!totalLength) return json({ translation: { title: '', body: '', layers } });
    if (totalLength > 12000) return json({ error: '当前页面文字过长，请缩短后重试' }, 413);

    const { text } = await generateText({
      model: 'inclusionai/ling-3.0-tiny-free',
      providerOptions: {
        gateway: {
          user: session.login,
          tags: ['feature:deck-translation', 'product:orqela']
        }
      },
      prompt: `Translate the following ORQELA presentation content from Simplified Chinese into concise, natural business English.

Rules:
- Preserve ORQELA, SELL / BUY / BUILD, numbers, currencies, percentages, product names, and line breaks.
- Use an investor/customer presentation tone.
- Do not add claims, facts, or explanations.
- Return every layer with the same id and in the same order.
- Return only one valid JSON object with exactly this shape: {"title":"...","body":"...","layers":[{"id":"...","text":"..."}]}.
- Do not wrap the JSON in Markdown fences.

${JSON.stringify({ title, body, layers })}`
    });

    return json({ translation: parseTranslation(text, layers) });
  } catch (error) {
    console.error('Translation failed', error);
    const status = Number(error?.statusCode || error?.status || 500);
    if (status === 402) return json({ error: 'Vercel AI Gateway 额度不足，请在 Vercel 中充值后重试' }, 402);
    if (status === 403 && /credit card|customer_verification_required/i.test(String(error?.message || error?.cause?.responseBody || ''))) {
      return json({ error: '请先在 Vercel AI Gateway 添加有效银行卡，解锁 AI 翻译额度后重试' }, 402);
    }
    if (status === 403 && /free tier|paid credits|restrictedmodels/i.test(String(error?.message || error?.cause?.responseBody || ''))) {
      return json({ error: '当前 AI 模型需要付费额度，请充值或联系管理员切换模型' }, 402);
    }
    if (status === 429) return json({ error: '翻译请求过于频繁，请稍后重试' }, 429);
    return json({ error: '英文自动生成暂时失败，请稍后重试' }, 503);
  }
}
