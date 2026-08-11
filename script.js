const CANVA_URL = 'https://www.canva.com/design/DAHR8BHX_j4/PBM6m6QJqnxjpvj5RPpnGg/edit';
const STORAGE_KEY = 'orqela-public-draft-v3';
const fallbackSlides = Array.from({ length: 15 }, (_, index) => ({
  id: `canva-${index + 1}`,
  src: `assets/slides/${index + 1}.png?v=20260811`,
  title: `ORQELA v3.6 · 第 ${index + 1} 页`,
  layers: [],
  custom: false
}));

const list = document.querySelector('#slide-list');
const image = document.querySelector('#slide-image');
const layerHost = document.querySelector('#slide-layers');
const blank = document.querySelector('#blank-slide');
const englishSlide = document.querySelector('#english-slide');
const englishTitle = document.querySelector('#english-slide-title');
const englishBody = document.querySelector('#english-slide-body');
const englishNumber = document.querySelector('#english-slide-number');
const languageZh = document.querySelector('#public-language-zh');
const languageEn = document.querySelector('#public-language-en');
const pageInput = document.querySelector('#page-number');
const pageTotal = document.querySelector('#page-total');
const status = document.querySelector('#status');
const picker = document.querySelector('#image-picker');
let deckUpdatedAt = '';
let originalSlides = structuredClone(fallbackSlides);
let slides = [];
let activeId = null;
let draggedId = null;
let activeLanguage = 'zh';

function normalizeSlide(slide, index) {
  const title = String(slide.title || `第 ${index + 1} 页`);
  return {
    id: String(slide.id || `slide-${index + 1}`),
    src: String(slide.src || ''),
    title,
    note: String(slide.note || ''),
    content: {
      zh: { title: String(slide.content?.zh?.title || title), body: String(slide.content?.zh?.body || slide.note || '') },
      en: { title: String(slide.content?.en?.title || ''), body: String(slide.content?.en?.body || '') }
    },
    layers: Array.isArray(slide.layers) ? slide.layers.map(layer => ({ ...layer, text: String(layer.text || layer.textZh || ''), textEn: String(layer.textEn || '') })) : [],
    custom: Boolean(slide.custom)
  };
}

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.updatedAt === deckUpdatedAt && Array.isArray(saved.slides) && saved.slides.length) {
      return saved.slides.map(normalizeSlide);
    }
  } catch (_) {}
  return structuredClone(originalSlides);
}

function activeSlide() { return slides.find(slide => slide.id === activeId); }
function activeIndex() { return Math.max(0, slides.findIndex(slide => slide.id === activeId)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function persist(message = '草稿已自动保存') {
  const current = activeSlide();
  if (current?.custom && !current.src) {
    current.title = blank.querySelector('h1').textContent.trim() || '新页面';
    current.note = blank.querySelector('p').textContent.trim();
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ updatedAt: deckUpdatedAt, slides }));
    status.textContent = message;
  } catch (_) {
    status.textContent = '图片较大，当前更改仅临时保留';
  }
}

function renderRail() {
  list.innerHTML = '';
  document.querySelector('#deck-count').textContent = slides.length;
  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.className = `slide-thumb${slide.id === activeId ? ' active' : ''}`;
    button.draggable = true;
    button.dataset.id = slide.id;
    const preview = slide.src
      ? `<img class="thumb-preview" src="${escapeHtml(slide.src)}" alt="">`
      : '<span class="thumb-preview thumb-blank">＋</span>';
    const railTitle = activeLanguage === 'en' ? (slide.content.en.title || slide.title) : (slide.content.zh.title || slide.title);
    button.innerHTML = `<span class="drag-handle">⋮⋮</span>${preview}<span class="thumb-copy"><b>${String(index + 1).padStart(2, '0')} · ${escapeHtml(railTitle)}</b><small>${activeLanguage === 'en' ? 'Drag to reorder draft' : '拖拽调整草稿顺序'}</small></span>`;
    button.addEventListener('click', () => selectSlide(slide.id));
    button.addEventListener('dragstart', () => { draggedId = slide.id; button.classList.add('dragging'); });
    button.addEventListener('dragend', () => { draggedId = null; button.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); });
    button.addEventListener('dragover', event => { event.preventDefault(); if (draggedId !== slide.id) button.classList.add('drag-over'); });
    button.addEventListener('dragleave', () => button.classList.remove('drag-over'));
    button.addEventListener('drop', event => {
      event.preventDefault();
      const from = slides.findIndex(item => item.id === draggedId);
      const to = slides.findIndex(item => item.id === slide.id);
      if (from < 0 || to < 0 || from === to) return;
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      persist('草稿顺序已更新');
      render();
    });
    list.appendChild(button);
  });
}

function renderLayers(slide) {
  layerHost.innerHTML = '';
  (slide.layers || []).forEach(layer => {
    if (layer.type !== 'text') return;
    const node = document.createElement('div');
    node.className = 'published-text-layer';
    node.textContent = activeLanguage === 'en' ? (layer.textEn || '') : (layer.text || '');
    if (!node.textContent) return;
    node.style.left = `${Number(layer.x) || 0}%`;
    node.style.top = `${Number(layer.y) || 0}%`;
    node.style.width = `${Number(layer.w) || 30}%`;
    node.style.minHeight = `${Number(layer.h) || 8}%`;
    node.style.fontSize = `${(Number(layer.fontSize) || 36) / 19.2}cqw`;
    node.style.color = layer.color || '#13213a';
    node.style.background = layer.background || 'transparent';
    node.style.fontWeight = layer.bold ? '800' : '500';
    node.style.textAlign = layer.align || 'left';
    layerHost.appendChild(node);
  });
}

function renderStage() {
  const slide = activeSlide();
  if (!slide) return;
  const english = activeLanguage === 'en';
  languageZh.classList.toggle('active', !english);
  languageEn.classList.toggle('active', english);
  if (!english && slide.src) {
    image.src = slide.src;
    image.alt = `${slide.title}，第 ${activeIndex() + 1} 页`;
    image.hidden = false;
    blank.hidden = true;
    englishSlide.hidden = true;
  } else if (!english) {
    image.removeAttribute('src');
    image.hidden = true;
    blank.hidden = false;
    englishSlide.hidden = true;
    blank.querySelector('h1').textContent = slide.title || '双击输入新页面标题';
    blank.querySelector('p').textContent = slide.note || '可输入备注，或上传新的页面图。';
  } else {
    image.hidden = true;
    blank.hidden = true;
    englishSlide.hidden = false;
    englishTitle.textContent = slide.content.en.title || 'English version unavailable';
    englishBody.textContent = slide.content.en.body || 'Open the online editor to generate the English page.';
    englishNumber.textContent = `${String(activeIndex() + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }
  renderLayers(slide);
  pageInput.value = activeIndex() + 1;
  pageInput.max = slides.length;
  pageTotal.textContent = `/ ${slides.length}`;
}

function render() { renderRail(); renderStage(); }
function selectSlide(id) {
  if (!slides.some(slide => slide.id === id)) return;
  activeId = id;
  render();
  list.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' });
}
function step(amount) {
  const next = Math.max(0, Math.min(slides.length - 1, activeIndex() + amount));
  selectSlide(slides[next].id);
}

function addSlide() {
  const slide = { id: `custom-${Date.now()}`, src: '', title: '新页面', note: '可输入备注，或上传页面图。', content: { zh: { title: '新页面', body: '可输入备注，或上传页面图。' }, en: { title: 'New Slide', body: 'Add notes or upload a slide image.' } }, layers: [], custom: true };
  slides.splice(activeIndex() + 1, 0, slide);
  activeId = slide.id;
  persist('草稿中已新增页面');
  render();
}

function duplicateSlide() {
  const source = activeSlide();
  if (!source) return;
  const copy = structuredClone(source);
  copy.id = `copy-${Date.now()}`;
  copy.title = `${source.title} · 副本`;
  copy.custom = true;
  slides.splice(activeIndex() + 1, 0, copy);
  activeId = copy.id;
  persist('草稿中已复制当前页');
  render();
}

function deleteSlide() {
  if (slides.length <= 1) return;
  const index = activeIndex();
  slides.splice(index, 1);
  activeId = slides[Math.min(index, slides.length - 1)].id;
  persist('草稿中已删除当前页');
  render();
}

function moveActive(position) {
  const from = activeIndex();
  const to = Math.max(0, Math.min(slides.length - 1, Number(position) - 1));
  if (!Number.isFinite(to) || from === to) return renderStage();
  const [moved] = slides.splice(from, 1);
  slides.splice(to, 0, moved);
  persist('草稿页码顺序已更新');
  render();
}

function resetDeck() {
  if (!confirm('放弃当前浏览器草稿并恢复 GitHub 已发布版本？')) return;
  slides = structuredClone(originalSlides);
  activeId = slides[0].id;
  localStorage.removeItem(STORAGE_KEY);
  status.textContent = '已恢复 GitHub 发布版本';
  render();
}

function replaceImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const slide = activeSlide();
    slide.src = reader.result;
    slide.custom = true;
    persist('草稿图片已替换；请在在线编辑器发布');
    render();
  };
  reader.readAsDataURL(file);
}

function togglePresentation() {
  document.body.classList.toggle('presenting');
  if (document.body.classList.contains('presenting')) document.documentElement.requestFullscreen?.().catch(() => {});
  else if (document.fullscreenElement) document.exitFullscreen?.();
}

document.querySelector('#add-slide').addEventListener('click', addSlide);
document.querySelector('#duplicate-slide').addEventListener('click', duplicateSlide);
document.querySelector('#delete-slide').addEventListener('click', deleteSlide);
document.querySelector('#replace-image').addEventListener('click', () => picker.click());
picker.addEventListener('change', () => { replaceImage(picker.files[0]); picker.value = ''; });
document.querySelector('#prev-slide').addEventListener('click', () => step(-1));
document.querySelector('#next-slide').addEventListener('click', () => step(1));
document.querySelector('#stage-prev').addEventListener('click', () => step(-1));
document.querySelector('#stage-next').addEventListener('click', () => step(1));
pageInput.addEventListener('change', () => moveActive(pageInput.value));
document.querySelector('#save-deck').addEventListener('click', () => persist('草稿已保存到当前浏览器'));
document.querySelector('#reset-deck').addEventListener('click', resetDeck);
document.querySelector('#present-deck').addEventListener('click', togglePresentation);
languageZh.addEventListener('click', () => { activeLanguage = 'zh'; render(); });
languageEn.addEventListener('click', () => { activeLanguage = 'en'; render(); });
blank.addEventListener('input', () => {
  const slide = activeSlide();
  if (slide?.custom) {
    slide.title = blank.querySelector('h1').textContent.trim() || '新页面';
    slide.note = blank.querySelector('p').textContent.trim();
    slide.content.zh.title = slide.title;
    slide.content.zh.body = slide.note;
    renderRail();
  }
});
blank.addEventListener('focusout', () => persist());
document.addEventListener('keydown', event => {
  if (event.target.matches('input,[contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1);
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') step(1);
  if (event.key === 'Escape' && document.body.classList.contains('presenting')) togglePresentation();
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('presenting'); });
document.querySelector('.canva').href = CANVA_URL;

async function initialize() {
  try {
    const response = await fetch(`deck.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('deck unavailable');
    const deck = await response.json();
    if (!Array.isArray(deck.slides) || !deck.slides.length) throw new Error('invalid deck');
    deckUpdatedAt = String(deck.updatedAt || 'published');
    originalSlides = deck.slides.map(normalizeSlide);
  } catch (_) {
    deckUpdatedAt = 'fallback';
    originalSlides = structuredClone(fallbackSlides);
  }
  slides = loadDraft();
  activeId = slides[0]?.id;
  status.textContent = '已加载 GitHub 发布版本';
  render();
}

initialize();
