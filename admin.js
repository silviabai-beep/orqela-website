const isLocalDemo = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const state = {
  deck: null,
  activeId: null,
  selectedLayerId: null,
  draggedSlideId: null,
  pendingFiles: new Map(),
  activeLanguage: 'zh',
  showOriginal: false,
  translationRequest: 0,
  dirty: false,
  publishing: false
};

const ui = {
  login: document.querySelector('#login-view'),
  editor: document.querySelector('#editor-view'),
  loginButton: document.querySelector('#login-button'),
  logout: document.querySelector('#logout-button'),
  publish: document.querySelector('#publish-button'),
  saveState: document.querySelector('#save-state'),
  userLabel: document.querySelector('#user-label'),
  list: document.querySelector('#admin-slide-list'),
  pageCount: document.querySelector('#page-count'),
  image: document.querySelector('#admin-slide-image'),
  blank: document.querySelector('#admin-blank'),
  englishPage: document.querySelector('#admin-english-page'),
  editablePageKicker: document.querySelector('#editable-page-kicker'),
  englishPreviewTitle: document.querySelector('#english-preview-title'),
  englishPreviewBody: document.querySelector('#english-preview-body'),
  englishPreviewNumber: document.querySelector('#english-preview-number'),
  layerHost: document.querySelector('#admin-layer-host'),
  stage: document.querySelector('#admin-stage'),
  pageNumber: document.querySelector('#admin-page-number'),
  pageTotal: document.querySelector('#admin-page-total'),
  slideTitle: document.querySelector('#slide-title'),
  contentTitleZh: document.querySelector('#content-title-zh'),
  contentBodyZh: document.querySelector('#content-body-zh'),
  contentTitleEn: document.querySelector('#content-title-en'),
  contentBodyEn: document.querySelector('#content-body-en'),
  translateNow: document.querySelector('#translate-now'),
  translationState: document.querySelector('#translation-state'),
  languageZh: document.querySelector('#language-zh'),
  languageEn: document.querySelector('#language-en'),
  originalPreview: document.querySelector('#original-preview'),
  slideSrc: document.querySelector('#slide-src'),
  selectionLabel: document.querySelector('#selection-label'),
  layerEmpty: document.querySelector('#layer-empty'),
  layerControls: document.querySelector('#layer-controls'),
  layerText: document.querySelector('#layer-text'),
  layerTextEn: document.querySelector('#layer-text-en'),
  layerX: document.querySelector('#layer-x'),
  layerY: document.querySelector('#layer-y'),
  layerW: document.querySelector('#layer-w'),
  layerH: document.querySelector('#layer-h'),
  layerFontSize: document.querySelector('#layer-font-size'),
  layerAlign: document.querySelector('#layer-align'),
  layerColor: document.querySelector('#layer-color'),
  layerBackground: document.querySelector('#layer-background'),
  layerTransparent: document.querySelector('#layer-transparent'),
  layerBold: document.querySelector('#layer-bold'),
  picker: document.querySelector('#admin-image-picker'),
  toast: document.querySelector('#toast')
};

function slides() { return state.deck?.slides || []; }
function activeIndex() { return Math.max(0, slides().findIndex(slide => slide.id === state.activeId)); }
function activeSlide() { return slides().find(slide => slide.id === state.activeId); }
function selectedLayer() { return activeSlide()?.layers?.find(layer => layer.id === state.selectedLayerId); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function showToast(message, tone = 'normal') {
  ui.toast.textContent = message;
  ui.toast.style.background = tone === 'error' ? '#b82344' : tone === 'success' ? '#087f68' : '#111d34';
  ui.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => ui.toast.classList.remove('show'), 2600);
}

function markDirty(message = '有未发布的更改') {
  state.dirty = true;
  ui.saveState.textContent = message;
}

function normalizeDeck(deck) {
  const normalized = {
    version: 2,
    title: String(deck?.title || 'ORQELA 投资人客户介绍 v3.6'),
    updatedAt: String(deck?.updatedAt || new Date().toISOString()),
    slides: Array.isArray(deck?.slides) ? deck.slides : []
  };
  normalized.slides = normalized.slides.map((slide, index) => {
    const title = String(slide.title || `第 ${index + 1} 页`);
    return {
    id: String(slide.id || `slide-${index + 1}`),
    src: String(slide.src || ''),
    title,
    note: String(slide.note || ''),
    content: {
      zh: {
        title: String(slide.content?.zh?.title || title),
        body: String(slide.content?.zh?.body || slide.note || '')
      },
      en: {
        title: String(slide.content?.en?.title || ''),
        body: String(slide.content?.en?.body || '')
      }
    },
    layers: Array.isArray(slide.layers) ? slide.layers.map(layer => ({
      id: String(layer.id || `text-${Date.now()}-${index}`),
      type: 'text',
      text: String(layer.text || layer.textZh || ''),
      textEn: String(layer.textEn || ''),
      x: clamp(layer.x ?? 10, 0, 98),
      y: clamp(layer.y ?? 10, 0, 98),
      w: clamp(layer.w ?? 32, 2, 100),
      h: clamp(layer.h ?? 10, 2, 100),
      fontSize: clamp(layer.fontSize ?? 36, 10, 180),
      color: String(layer.color || '#13213a'),
      background: String(layer.background || 'transparent'),
      bold: Boolean(layer.bold),
      align: ['left', 'center', 'right'].includes(layer.align) ? layer.align : 'left'
    })) : []
  }});
  return normalized;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `请求失败 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function loadDeck() {
  if (isLocalDemo) {
    const response = await fetch(`deck.json?t=${Date.now()}`);
    return normalizeDeck(await response.json());
  }
  const payload = await api('/api/deck');
  return normalizeDeck(payload.deck);
}

async function bootstrap() {
  try {
    let user;
    if (isLocalDemo) {
      user = { login: 'local-preview' };
      ui.publish.disabled = true;
      ui.publish.title = '本地预览不能发布';
      ui.logout.hidden = true;
    } else {
      const auth = await api('/api/auth/status');
      if (!auth.authenticated) return;
      user = auth.user;
    }
    state.deck = await loadDeck();
    if (!state.deck.slides.length) throw new Error('发布版本中没有页面');
    state.activeId = state.deck.slides[0].id;
    ui.userLabel.textContent = `GitHub · ${user.login}`;
    ui.login.hidden = true;
    ui.editor.hidden = false;
    ui.saveState.textContent = isLocalDemo ? '本地预览模式' : '已同步 GitHub 发布版本';
    render();
  } catch (error) {
    if (error.status === 401) return;
    showToast(error.message || '载入失败', 'error');
  }
}

function renderRail() {
  ui.list.innerHTML = '';
  ui.pageCount.textContent = slides().length;
  slides().forEach((slide, index) => {
    const button = document.createElement('button');
    button.className = `admin-thumb${slide.id === state.activeId ? ' active' : ''}`;
    button.draggable = true;
    button.dataset.id = slide.id;
    const src = slide.previewSrc || slide.src;
    const preview = src ? `<img src="${escapeHtml(src)}" alt="">` : '<span class="blank-thumb">＋</span>';
    const bilingual = slide.content?.en?.title ? '中 / EN' : '英文待生成';
    button.innerHTML = `<span class="handle">⋮⋮</span>${preview}<span><b>${String(index + 1).padStart(2, '0')} · ${escapeHtml(slide.title)}</b><small>${bilingual} · ${slide.layers.length} 个文字图层</small></span>`;
    button.addEventListener('click', () => selectSlide(slide.id));
    button.addEventListener('dragstart', () => { state.draggedSlideId = slide.id; });
    button.addEventListener('dragover', event => { event.preventDefault(); if (state.draggedSlideId !== slide.id) button.classList.add('drag-over'); });
    button.addEventListener('dragleave', () => button.classList.remove('drag-over'));
    button.addEventListener('dragend', () => { state.draggedSlideId = null; document.querySelectorAll('.drag-over').forEach(node => node.classList.remove('drag-over')); });
    button.addEventListener('drop', event => {
      event.preventDefault();
      const from = slides().findIndex(item => item.id === state.draggedSlideId);
      const to = slides().findIndex(item => item.id === slide.id);
      if (from < 0 || to < 0 || from === to) return;
      const [moved] = slides().splice(from, 1);
      slides().splice(to, 0, moved);
      markDirty('页面顺序已调整，尚未发布');
      render();
    });
    ui.list.appendChild(button);
  });
}

function applyLayerStyle(node, layer) {
  node.style.left = `${layer.x}%`;
  node.style.top = `${layer.y}%`;
  node.style.width = `${layer.w}%`;
  node.style.minHeight = `${layer.h}%`;
  node.style.fontSize = `${layer.fontSize / 19.2}cqw`;
  node.style.color = layer.color;
  node.style.background = layer.background;
  node.style.fontWeight = layer.bold ? '800' : '500';
  node.style.textAlign = layer.align;
}

function applyPageDensity(page, content) {
  const titleLength = [...String(content.title || '')].length;
  const bodyLength = [...String(content.body || '')].length;
  const lines = String(content.body || '').split('\n').length;
  page.classList.toggle('compact', titleLength > 58 || bodyLength > 230 || lines > 5);
  page.classList.toggle('dense', titleLength > 90 || bodyLength > 430 || lines > 8);
}

function renderStage() {
  const slide = activeSlide();
  if (!slide) return;
  const src = slide.previewSrc || slide.src;
  const english = state.activeLanguage === 'en';
  const original = !english && state.showOriginal;
  const content = english ? slide.content.en : slide.content.zh;
  ui.languageZh.classList.toggle('active', !english);
  ui.languageEn.classList.toggle('active', english);
  ui.originalPreview.hidden = english;
  ui.originalPreview.textContent = original ? '编辑文字版' : '查看原设计';
  if (original && src) {
    ui.image.src = src;
    ui.image.hidden = false;
    ui.blank.hidden = true;
    ui.englishPage.hidden = true;
  } else if (original) {
    ui.image.removeAttribute('src');
    ui.image.hidden = true;
    ui.blank.hidden = false;
    ui.englishPage.hidden = true;
  } else {
    ui.image.hidden = true;
    ui.blank.hidden = true;
    ui.englishPage.hidden = false;
    ui.editablePageKicker.textContent = english ? 'ORQELA · ENGLISH · CLICK TEXT TO EDIT' : 'ORQELA · 中文 · 点击文字直接编辑';
    ui.englishPreviewTitle.textContent = content.title || (english ? 'English title will appear here' : '点击输入中文标题');
    ui.englishPreviewBody.textContent = content.body || (english ? 'Edit the Chinese content to generate this English page automatically.' : '点击输入中文正文');
    ui.englishPreviewNumber.textContent = `${String(activeIndex() + 1).padStart(2, '0')} / ${String(slides().length).padStart(2, '0')}`;
    applyPageDensity(ui.englishPage, content);
  }
  ui.image.alt = `${slide.title}，第 ${activeIndex() + 1} 页`;
  ui.layerHost.innerHTML = '';
  slide.layers.forEach(layer => {
    const node = document.createElement('div');
    node.className = `editable-layer${layer.id === state.selectedLayerId ? ' selected' : ''}`;
    node.dataset.id = layer.id;
    node.textContent = english ? (layer.textEn || '') : layer.text;
    if (english && !node.textContent) return;
    applyLayerStyle(node, layer);
    node.addEventListener('pointerdown', event => beginLayerDrag(event, layer.id));
    node.addEventListener('click', event => { event.stopPropagation(); selectLayer(layer.id); });
    ui.layerHost.appendChild(node);
  });
  ui.pageNumber.value = activeIndex() + 1;
  ui.pageNumber.max = slides().length;
  ui.pageTotal.textContent = `/ ${slides().length}`;
}

function renderInspector() {
  const slide = activeSlide();
  if (!slide) return;
  ui.slideTitle.value = slide.title;
  ui.contentTitleZh.value = slide.content.zh.title;
  ui.contentBodyZh.value = slide.content.zh.body;
  ui.contentTitleEn.value = slide.content.en.title;
  ui.contentBodyEn.value = slide.content.en.body;
  ui.slideSrc.value = slide.src || '无底图';
  const layer = selectedLayer();
  ui.layerEmpty.hidden = Boolean(layer);
  ui.layerControls.hidden = !layer;
  ui.selectionLabel.textContent = layer ? '已选择文字图层' : '可直接编辑画布文字';
  if (!layer) return;
  ui.layerText.value = layer.text;
  ui.layerTextEn.value = layer.textEn;
  ui.layerX.value = layer.x;
  ui.layerY.value = layer.y;
  ui.layerW.value = layer.w;
  ui.layerH.value = layer.h;
  ui.layerFontSize.value = layer.fontSize;
  ui.layerAlign.value = layer.align;
  ui.layerColor.value = /^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : '#13213a';
  ui.layerBackground.value = /^#[0-9a-f]{6}$/i.test(layer.background) ? layer.background : '#ffffff';
  ui.layerTransparent.checked = layer.background === 'transparent';
  ui.layerBold.checked = layer.bold;
}

function render() { renderRail(); renderStage(); renderInspector(); }

function selectSlide(id) {
  if (!slides().some(slide => slide.id === id)) return;
  clearTimeout(scheduleTranslation.timer);
  state.translationRequest += 1;
  state.activeId = id;
  state.selectedLayerId = null;
  setTranslationState(activeSlide()?.content?.en?.title ? '英文已同步' : '英文待生成', activeSlide()?.content?.en?.title ? 'success' : 'warning');
  render();
  ui.list.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' });
}

function selectLayer(id) {
  state.selectedLayerId = id;
  renderStage();
  renderInspector();
}

function stepPage(amount) {
  const next = clamp(activeIndex() + amount, 0, slides().length - 1);
  selectSlide(slides()[next].id);
}

function movePage(position) {
  const from = activeIndex();
  const to = clamp(Number(position) - 1, 0, slides().length - 1);
  if (from === to) return;
  const [moved] = slides().splice(from, 1);
  slides().splice(to, 0, moved);
  markDirty('页面顺序已调整，尚未发布');
  render();
}

function addPage() {
  const slide = { id: `slide-${Date.now()}`, src: '', title: '新页面', note: '', content: { zh: { title: '新页面', body: '' }, en: { title: 'New Slide', body: '' } }, layers: [] };
  slides().splice(activeIndex() + 1, 0, slide);
  state.activeId = slide.id;
  state.selectedLayerId = null;
  markDirty('已新增页面，尚未发布');
  render();
}

function duplicatePage() {
  const source = activeSlide();
  if (!source) return;
  const copy = structuredClone(source);
  copy.id = `slide-${Date.now()}`;
  copy.title = `${source.title} · 副本`;
  copy.layers.forEach((layer, index) => { layer.id = `text-${Date.now()}-${index}`; });
  slides().splice(activeIndex() + 1, 0, copy);
  state.activeId = copy.id;
  state.selectedLayerId = null;
  markDirty('已复制页面，尚未发布');
  render();
}

function deletePage() {
  if (slides().length <= 1) return showToast('至少保留一页', 'error');
  const index = activeIndex();
  slides().splice(index, 1);
  state.activeId = slides()[Math.min(index, slides().length - 1)].id;
  state.selectedLayerId = null;
  markDirty('已删除页面，尚未发布');
  render();
}

function addTextLayer() {
  const slide = activeSlide();
  if (!slide) return;
  const layer = {
    id: `text-${Date.now()}`,
    type: 'text',
    text: '双击右侧输入文字',
    textEn: 'Enter English text',
    x: 10,
    y: 10,
    w: 36,
    h: 10,
    fontSize: 42,
    color: '#13213a',
    background: '#ffffff',
    bold: true,
    align: 'left'
  };
  slide.layers.push(layer);
  state.selectedLayerId = layer.id;
  markDirty('已添加文字，尚未发布');
  render();
}

function deleteLayer() {
  const slide = activeSlide();
  const index = slide?.layers.findIndex(layer => layer.id === state.selectedLayerId) ?? -1;
  if (index < 0) return;
  slide.layers.splice(index, 1);
  state.selectedLayerId = null;
  markDirty('已删除文字，尚未发布');
  render();
}

function beginLayerDrag(event, id) {
  event.preventDefault();
  event.stopPropagation();
  selectLayer(id);
  const layer = selectedLayer();
  const rect = ui.stage.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originalX = layer.x;
  const originalY = layer.y;
  const pointerId = event.pointerId;
  event.currentTarget.setPointerCapture?.(pointerId);
  const move = moveEvent => {
    layer.x = clamp(originalX + ((moveEvent.clientX - startX) / rect.width) * 100, 0, 100 - layer.w);
    layer.y = clamp(originalY + ((moveEvent.clientY - startY) / rect.height) * 100, 0, 100 - layer.h);
    applyLayerStyle(event.currentTarget, layer);
    ui.layerX.value = layer.x.toFixed(1);
    ui.layerY.value = layer.y.toFixed(1);
  };
  const end = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    markDirty('文字位置已调整，尚未发布');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end, { once: true });
}

function safeFileName(name) {
  const ext = (name.match(/\.(png|jpe?g|webp)$/i) || [null, '.png'])[1].replace('jpeg', 'jpg');
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext.replace('.', '').toLowerCase()}`;
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({ dataUrl, contentBase64: dataUrl.split(',')[1] });
    };
    reader.onerror = () => reject(new Error('无法读取图片'));
    reader.readAsDataURL(file);
  });
}

async function replacePageImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('请选择图片文件', 'error');
  if (file.size > 2_500_000) return showToast('单张图片请控制在 2.5MB 以内', 'error');
  const { dataUrl, contentBase64 } = await readFile(file);
  const path = `assets/slides/uploads/${safeFileName(file.name)}`;
  const slide = activeSlide();
  slide.src = path;
  slide.previewSrc = dataUrl;
  state.pendingFiles.set(path, { path, contentBase64 });
  markDirty('底图已替换，尚未发布');
  render();
}

function updateLayerFromControls() {
  const layer = selectedLayer();
  if (!layer) return;
  layer.text = ui.layerText.value;
  layer.textEn = ui.layerTextEn.value;
  layer.x = clamp(ui.layerX.value, 0, 98);
  layer.y = clamp(ui.layerY.value, 0, 98);
  layer.w = clamp(ui.layerW.value, 2, 100);
  layer.h = clamp(ui.layerH.value, 2, 100);
  layer.fontSize = clamp(ui.layerFontSize.value, 10, 180);
  layer.align = ui.layerAlign.value;
  layer.color = ui.layerColor.value;
  layer.background = ui.layerTransparent.checked ? 'transparent' : ui.layerBackground.value;
  layer.bold = ui.layerBold.checked;
  markDirty();
  renderStage();
}

function setTranslationState(message, tone = 'normal') {
  ui.translationState.textContent = message;
  ui.translationState.dataset.tone = tone;
}

async function translateActiveSlide() {
  const slide = activeSlide();
  if (!slide) return;
  if (isLocalDemo) {
    setTranslationState('部署到 Vercel 后可自动翻译', 'warning');
    return;
  }
  const requestId = ++state.translationRequest;
  setTranslationState('正在生成英文…', 'loading');
  ui.translateNow.disabled = true;
  try {
    const payload = await api('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        title: slide.content.zh.title,
        body: slide.content.zh.body,
        layers: slide.layers.map(layer => ({ id: layer.id, text: layer.text }))
      })
    });
    if (requestId !== state.translationRequest || slide.id !== activeSlide()?.id) return;
    slide.content.en.title = String(payload.translation?.title || '');
    slide.content.en.body = String(payload.translation?.body || '');
    const translatedLayers = new Map((payload.translation?.layers || []).map(layer => [layer.id, layer.text]));
    slide.layers.forEach(layer => { if (translatedLayers.has(layer.id)) layer.textEn = String(translatedLayers.get(layer.id)); });
    markDirty('英文已自动生成，尚未发布');
    setTranslationState('英文已同步', 'success');
    render();
  } catch (error) {
    if (requestId !== state.translationRequest) return;
    setTranslationState('英文生成失败', 'error');
    showToast(error.message || '英文生成失败', 'error');
  } finally {
    if (requestId === state.translationRequest) ui.translateNow.disabled = false;
  }
}

function scheduleTranslation() {
  clearTimeout(scheduleTranslation.timer);
  setTranslationState('等待自动生成…', 'loading');
  scheduleTranslation.timer = setTimeout(translateActiveSlide, 1000);
}

function updateChineseContent() {
  const slide = activeSlide();
  if (!slide) return;
  slide.content.zh.title = ui.contentTitleZh.value;
  slide.content.zh.body = ui.contentBodyZh.value;
  markDirty('中文已修改，正在准备英文版本…');
  renderStage();
  scheduleTranslation();
}

function updateEnglishContent() {
  const slide = activeSlide();
  if (!slide) return;
  slide.content.en.title = ui.contentTitleEn.value;
  slide.content.en.body = ui.contentBodyEn.value;
  markDirty('英文已手动修改，尚未发布');
  setTranslationState('英文已手动调整', 'success');
  renderStage();
}

function setLanguage(language) {
  state.activeLanguage = language;
  state.showOriginal = false;
  state.selectedLayerId = null;
  renderStage();
  renderInspector();
}

function toggleOriginalPreview() {
  state.showOriginal = !state.showOriginal;
  state.selectedLayerId = null;
  renderStage();
  renderInspector();
}

function updateContentFromCanvas() {
  const slide = activeSlide();
  if (!slide || state.showOriginal) return;
  const content = state.activeLanguage === 'en' ? slide.content.en : slide.content.zh;
  content.title = ui.englishPreviewTitle.innerText.trim();
  content.body = ui.englishPreviewBody.innerText.trim();
  if (state.activeLanguage === 'en') {
    ui.contentTitleEn.value = content.title;
    ui.contentBodyEn.value = content.body;
    setTranslationState('英文已手动调整', 'success');
    markDirty('英文已直接修改，尚未发布');
  } else {
    ui.contentTitleZh.value = content.title;
    ui.contentBodyZh.value = content.body;
    markDirty('中文已直接修改，正在准备英文版本…');
    scheduleTranslation();
  }
  applyPageDensity(ui.englishPage, content);
}

function serializableDeck() {
  return {
    version: 2,
    title: state.deck.title,
    updatedAt: new Date().toISOString(),
    slides: slides().map(slide => {
      const { previewSrc, ...clean } = slide;
      return clean;
    })
  };
}

async function publish() {
  if (isLocalDemo) return showToast('本地预览不能发布', 'error');
  if (state.publishing) return;
  state.publishing = true;
  ui.publish.disabled = true;
  ui.publish.textContent = '正在发布…';
  ui.saveState.textContent = '正在写入 GitHub…';
  try {
    const payload = await api('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ deck: serializableDeck(), files: [...state.pendingFiles.values()] })
    });
    state.deck.updatedAt = payload.updatedAt;
    state.pendingFiles.clear();
    state.dirty = false;
    ui.saveState.textContent = `已发布 · ${payload.shortSha}`;
    showToast('发布成功，网站正在自动更新', 'success');
  } catch (error) {
    ui.saveState.textContent = '发布失败，请重试';
    showToast(error.message || '发布失败', 'error');
  } finally {
    state.publishing = false;
    ui.publish.disabled = false;
    ui.publish.textContent = '发布到 GitHub';
  }
}

ui.stage.addEventListener('click', event => {
  if (event.target.closest('[contenteditable="true"]')) return;
  state.selectedLayerId = null;
  renderStage();
  renderInspector();
});
ui.slideTitle.addEventListener('input', () => { activeSlide().title = ui.slideTitle.value; markDirty(); renderRail(); });
ui.contentTitleZh.addEventListener('input', updateChineseContent);
ui.contentBodyZh.addEventListener('input', updateChineseContent);
ui.contentTitleEn.addEventListener('input', updateEnglishContent);
ui.contentBodyEn.addEventListener('input', updateEnglishContent);
ui.translateNow.addEventListener('click', translateActiveSlide);
ui.languageZh.addEventListener('click', () => setLanguage('zh'));
ui.languageEn.addEventListener('click', () => setLanguage('en'));
ui.originalPreview.addEventListener('click', toggleOriginalPreview);
ui.englishPreviewTitle.addEventListener('input', updateContentFromCanvas);
ui.englishPreviewBody.addEventListener('input', updateContentFromCanvas);
ui.englishPreviewTitle.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
ui.pageNumber.addEventListener('change', () => movePage(ui.pageNumber.value));
document.querySelector('#previous-page').addEventListener('click', () => stepPage(-1));
document.querySelector('#next-page').addEventListener('click', () => stepPage(1));
document.querySelector('#add-page').addEventListener('click', addPage);
document.querySelector('#duplicate-page').addEventListener('click', duplicatePage);
document.querySelector('#delete-page').addEventListener('click', deletePage);
document.querySelector('#replace-page-image').addEventListener('click', () => ui.picker.click());
ui.picker.addEventListener('change', async () => { await replacePageImage(ui.picker.files[0]); ui.picker.value = ''; });
document.querySelector('#add-text-layer').addEventListener('click', addTextLayer);
document.querySelector('#delete-layer').addEventListener('click', deleteLayer);
ui.publish.addEventListener('click', publish);
ui.logout.addEventListener('click', async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.reload(); });
[ui.layerText, ui.layerTextEn, ui.layerX, ui.layerY, ui.layerW, ui.layerH, ui.layerFontSize, ui.layerAlign, ui.layerColor, ui.layerBackground, ui.layerTransparent, ui.layerBold]
  .forEach(control => control.addEventListener('input', updateLayerFromControls));
ui.layerText.addEventListener('input', scheduleTranslation);
window.addEventListener('beforeunload', event => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } });

bootstrap();
