const CANVA_URL = 'https://www.canva.com/design/DAHR8BHX_j4/PBM6m6QJqnxjpvj5RPpnGg/edit';
const STORAGE_KEY = 'orqela-v36-web-deck';
const originalSlides = Array.from({ length: 15 }, (_, index) => ({
  id: `canva-${index + 1}`,
  src: `assets/slides/${index + 1}.png`,
  title: `ORQELA v3.6 · 第 ${index + 1} 页`,
  custom: false
}));

const rail = document.querySelector('.rail');
const list = document.querySelector('#slide-list');
const image = document.querySelector('#slide-image');
const blank = document.querySelector('#blank-slide');
const pageInput = document.querySelector('#page-number');
const pageTotal = document.querySelector('#page-total');
const status = document.querySelector('#status');
const picker = document.querySelector('#image-picker');
let slides = loadDeck();
let activeId = slides[0]?.id;
let draggedId = null;

function loadDeck() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (_) {}
  return structuredClone(originalSlides);
}

function activeSlide() { return slides.find(slide => slide.id === activeId); }
function activeIndex() { return Math.max(0, slides.findIndex(slide => slide.id === activeId)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function persist(message = '已自动保存') {
  const current = activeSlide();
  if (current?.custom && !current.src) {
    current.title = blank.querySelector('h1').textContent.trim() || '新页面';
    current.note = blank.querySelector('p').textContent.trim();
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    status.textContent = message;
  } catch (_) {
    status.textContent = '页面图片较大，当前更改仅临时保留';
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
    button.innerHTML = `<span class="drag-handle">⋮⋮</span>${preview}<span class="thumb-copy"><b>${String(index + 1).padStart(2, '0')} · ${escapeHtml(slide.title)}</b><small>拖拽调整顺序</small></span>`;
    button.addEventListener('click', () => selectSlide(slide.id));
    button.addEventListener('dragstart', () => { draggedId = slide.id; button.classList.add('dragging'); });
    button.addEventListener('dragend', () => { draggedId = null; button.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); });
    button.addEventListener('dragover', event => { event.preventDefault(); if (draggedId !== slide.id) button.classList.add('drag-over'); });
    button.addEventListener('dragleave', () => button.classList.remove('drag-over'));
    button.addEventListener('drop', event => {
      event.preventDefault();
      button.classList.remove('drag-over');
      const from = slides.findIndex(item => item.id === draggedId);
      const to = slides.findIndex(item => item.id === slide.id);
      if (from < 0 || to < 0 || from === to) return;
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      persist('顺序已更新');
      render();
    });
    list.appendChild(button);
  });
}

function renderStage() {
  const slide = activeSlide();
  if (!slide) return;
  if (slide.src) {
    image.src = slide.src;
    image.alt = `${slide.title}，第 ${activeIndex() + 1} 页`;
    image.hidden = false;
    blank.hidden = true;
  } else {
    image.removeAttribute('src');
    image.hidden = true;
    blank.hidden = false;
    blank.querySelector('h1').textContent = slide.title || '双击输入新页面标题';
    blank.querySelector('p').textContent = slide.note || '可在此输入备注，或使用“替换图片”上传新的页面图。';
  }
  pageInput.value = activeIndex() + 1;
  pageInput.max = slides.length;
  pageTotal.textContent = `/ ${slides.length}`;
}

function render() { renderRail(); renderStage(); }
function selectSlide(id) { if (!slides.some(slide => slide.id === id)) return; activeId = id; render(); list.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' }); }
function step(amount) { const next = Math.max(0, Math.min(slides.length - 1, activeIndex() + amount)); selectSlide(slides[next].id); }

function addSlide() {
  const slide = { id: `custom-${Date.now()}`, src: '', title: '新页面', note: '可输入备注，或点击“替换图片”上传页面图。', custom: true };
  slides.splice(activeIndex() + 1, 0, slide);
  activeId = slide.id;
  persist('已新增页面');
  render();
}

function duplicateSlide() {
  const source = activeSlide();
  if (!source) return;
  const copy = { ...source, id: `copy-${Date.now()}`, title: `${source.title} · 副本`, custom: true };
  slides.splice(activeIndex() + 1, 0, copy);
  activeId = copy.id;
  persist('已复制当前页');
  render();
}

function deleteSlide() {
  if (slides.length <= 1) return;
  const index = activeIndex();
  slides.splice(index, 1);
  activeId = slides[Math.min(index, slides.length - 1)].id;
  persist('已删除当前页');
  render();
}

function moveActive(position) {
  const from = activeIndex();
  const to = Math.max(0, Math.min(slides.length - 1, Number(position) - 1));
  if (!Number.isFinite(to) || from === to) return renderStage();
  const [moved] = slides.splice(from, 1);
  slides.splice(to, 0, moved);
  persist('页码顺序已更新');
  render();
}

function resetDeck() {
  if (!confirm('恢复 Canva v3.6 的原始 15 页并清除本机排序？')) return;
  slides = structuredClone(originalSlides);
  activeId = slides[0].id;
  localStorage.removeItem(STORAGE_KEY);
  status.textContent = '已恢复原始 15 页';
  render();
}

function replaceImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const slide = activeSlide();
    slide.src = reader.result;
    slide.custom = true;
    slide.title = file.name.replace(/\.[^.]+$/, '') || slide.title;
    persist('当前页图片已替换');
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
document.querySelector('#save-deck').addEventListener('click', () => persist('已保存到当前浏览器'));
document.querySelector('#reset-deck').addEventListener('click', resetDeck);
document.querySelector('#present-deck').addEventListener('click', togglePresentation);
blank.addEventListener('input', () => { const slide = activeSlide(); if (slide?.custom) { slide.title = blank.querySelector('h1').textContent.trim() || '新页面'; slide.note = blank.querySelector('p').textContent.trim(); renderRail(); } });
blank.addEventListener('focusout', () => persist());
document.addEventListener('keydown', event => {
  if (event.target.matches('input,[contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1);
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') step(1);
  if (event.key === 'Escape' && document.body.classList.contains('presenting')) togglePresentation();
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('presenting'); });
document.querySelector('.canva').href = CANVA_URL;
render();
