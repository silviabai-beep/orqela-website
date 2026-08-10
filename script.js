const copy = {
  zh: {},
  en: {
    navProduct:'Product',navMemory:'Long-term Intelligence',navData:'Data Network',navBusiness:'Business Model',navRoadmap:'Roadmap',navGlobal:'Global Markets',compose:'Build this presentation',composeTitle:'Select presentation modules',moduleProduct:'Three decisions',moduleMemory:'Long-term intelligence',moduleData:'Data & firewall',moduleBusiness:'Business model',moduleRoadmap:'Roadmap',moduleGlobal:'Global markets',apply:'Apply selection',audienceLabel:'Audience',audienceAll:'Full story',audienceInvestor:'Investor',audienceDistributor:'Distributor',audienceRetailer:'Retailer',audienceSupplier:'Supplier',eyebrow:'VERTICAL AI TRADE NETWORK FOR VAPE',hero1:'From real demand',hero2:'to the next product.',lead:'Orqela monitors sales, inventory, orders and market signals every day—helping the vape industry decide what to SELL, BUY and BUILD.',explore:'EXPLORE ORQELA',heroIntro:'One entry point, three decisions. Connect POS, ERP, CRM, Excel and Email to generate the first Daily Plan in 10–15 minutes and carry real market demand back through the supply chain.',productTitle:'Three questions that matter every day',productCopy:'Today’s Plan brings together sales anomalies, replenishment windows, churn risks, purchasing actions and product opportunities. The underlying tools remain Assistant Tools.',sellTitle:'What should we sell, and to whom?',sellCopy:'Replenishment · Churn alerts · Marketing actions',buyTitle:'What should we buy, and how much?',buyCopy:'Inventory · Quotes · Lead time · Capital risk',buildTitle:'What should the next product be?',buildCopy:'Specifications · Capacity · Price band · Market test',memoryTitle:'AI that learns how to run the business',memoryCopy:'Business Memory remembers replenishment cycles, price preferences and team habits. Outcome Learning continuously improves from replies, orders, GMV, margin and repeat purchases.',dataTitle:'Move demand through the channel, without crossing commercial boundaries',dataCopy:'Raw account data remains private while anonymous, aggregated intelligence serves the network. Supplier identity, floor pricing and fulfillment data stay isolated from distributors; the platform manages anonymous RFQs, comparisons and coordination.',notOwn:'ORQELA DOES NOT TAKE ON',notOwnCopy:'Large inventory financing<br>Unnecessary Importer of Record roles<br>Unlicensed import, export or sales liability<br>Cross-border finished-goods seizure risk',own:'WHAT ORQELA DOES OWN',ownCopy:'Demand Intelligence<br>Supplier Orchestration<br>Compliance Workflow<br>Transaction Audit Trail',businessTitle:'High-frequency front end, procurement monetization behind it',businessCopy:'Retailer basics are free; distributors pay tiered Subscription + Usage; D↔R transactions carry 0% commission; procurement monetizes through Commission, Platform Fee or Margin.',retailerModel:'Free basics / High usage',roadmapTitle:'Prove the Daily Assistant, then scale the network and procurement',roadmapCopy:'M1–4 establishes Connect, Memory and Outcome; M5–12 validates payment, retention and SELL / BUY; M13–18 launches RFQ, Capital Risk and Product Experiment.',globalTitle:'Launch in the US, replicate globally with Market Packs',globalCopy:'The same Core Engine configures language, currency, compliance rules, data sources, outreach and supply-chain responsibility. Indonesia is part of the assembly and supply capability—not the site’s entire positioning.',closingTitle:'Connect demand, decisions and compliant supply.',closingCopy:'A learnable, repeatable and monetizable global AI Trade Network.',contact:'START A CONVERSATION ↗'
  }
};
document.querySelectorAll('[data-i18n]').forEach(el => el.dataset.zh = el.innerHTML);
function setLanguage(lang){document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;el.innerHTML=lang==='zh'?el.dataset.zh:(copy.en[key]||el.dataset.zh)});document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));localStorage.setItem('orqela-lang',lang)}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
document.querySelectorAll('[data-audience]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-audience]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const audience=b.dataset.audience;document.querySelectorAll('section[data-audiences]').forEach(s=>s.hidden=audience!=='all'&&!s.dataset.audiences.split(' ').includes(audience))}));
const panel=document.querySelector('.composer');document.querySelector('.compose').addEventListener('click',()=>panel.hidden=!panel.hidden);document.querySelector('.apply').addEventListener('click',()=>{document.querySelectorAll('.composer input').forEach(input=>{const section=document.getElementById(input.value);if(section)section.hidden=!input.checked});panel.hidden=true});
setLanguage(localStorage.getItem('orqela-lang')||'zh');

// Slide deck editor ---------------------------------------------------------
const deckStorageKey = 'orqela-deck-v1';
const main = document.querySelector('main');
const footer = main.querySelector('footer');
const baseSlides = [main.querySelector('header'), ...main.querySelectorAll('section'), main.querySelector('.closing')];
baseSlides.forEach((slide, index) => {
  slide.classList.add('deck-slide');
  slide.dataset.slideId = slide.id || (slide.classList.contains('closing') ? 'closing' : `slide-${index + 1}`);
});

function restoreDeck() {
  const raw = localStorage.getItem(deckStorageKey);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    const current = new Map([...main.querySelectorAll('.deck-slide')].map(slide => [slide.dataset.slideId, slide]));
    state.items.forEach(item => {
      let slide = current.get(item.id);
      if (!slide && item.custom) {
        slide = document.createElement('section');
        slide.className = 'deck-slide custom-slide';
        slide.dataset.slideId = item.id;
      }
      if (!slide) return;
      slide.innerHTML = item.html;
      slide.hidden = Boolean(item.hidden);
      main.insertBefore(slide, footer);
    });
  } catch (error) {
    console.warn('Could not restore the saved deck.', error);
  }
}
restoreDeck();

document.body.classList.add('deck-editor');
const rail = document.createElement('aside');
rail.className = 'slide-rail';
rail.innerHTML = `
  <div class="rail-brand"><span class="qmark">Q</span><div><b>ORQELA</b><small>SLIDE BUILDER</small></div></div>
  <div class="rail-title"><span>SLIDES</span><b id="deck-count">0</b></div>
  <div class="slide-list" id="slide-list"></div>
  <div class="rail-actions">
    <button id="add-slide" class="primary">＋ 新增页</button>
    <button id="duplicate-slide">复制</button>
    <button id="delete-slide">删除</button>
  </div>
  <div class="rail-help">拖拽左侧页面可调整顺序。双击主画布文字可直接编辑。</div>`;
document.body.prepend(rail);

const deckBar = document.createElement('div');
deckBar.className = 'deck-bar';
deckBar.innerHTML = `
  <button id="prev-slide" aria-label="上一页">←</button>
  <label>页码 <input id="page-number" type="number" min="1" value="1"></label>
  <span id="page-total">/ 1</span>
  <button id="next-slide" aria-label="下一页">→</button>
  <span class="bar-spacer"></span>
  <button id="edit-slide">编辑文字</button>
  <button id="save-deck">保存编排</button>
  <button id="reset-deck">恢复原版</button>
  <button id="present-deck" class="present">演示模式</button>`;
main.prepend(deckBar);

const slideList = rail.querySelector('#slide-list');
const pageNumber = deckBar.querySelector('#page-number');
const pageTotal = deckBar.querySelector('#page-total');
let activeSlideId = [...main.querySelectorAll('.deck-slide')][0]?.dataset.slideId;
let draggedSlideId = null;
let editing = false;

function allSlides() { return [...main.querySelectorAll('.deck-slide')]; }
function activeSlide() { return allSlides().find(slide => slide.dataset.slideId === activeSlideId); }
function slideTitle(slide) {
  return slide.querySelector('h1,h2,h3')?.textContent.trim().replace(/\s+/g, ' ') || '新页面';
}
function normalizeNumbers() {
  allSlides().forEach((slide, index) => {
    const number = slide.querySelector('.sectionHead > span');
    if (number) number.textContent = String(index + 1).padStart(2, '0');
  });
}
function saveDeck(showFeedback = false) {
  const items = allSlides().map(slide => ({
    id: slide.dataset.slideId,
    html: slide.innerHTML,
    hidden: slide.hidden,
    custom: slide.classList.contains('custom-slide')
  }));
  localStorage.setItem(deckStorageKey, JSON.stringify({items}));
  if (showFeedback) {
    const button = deckBar.querySelector('#save-deck');
    const old = button.textContent;
    button.textContent = '已保存 ✓';
    setTimeout(() => button.textContent = old, 1200);
  }
}
function setEditable(enabled) {
  editing = enabled;
  document.body.classList.toggle('editing-slide', enabled);
  const slide = activeSlide();
  if (slide) slide.querySelectorAll('h1,h2,h3,p,.sectionIntro span').forEach(el => el.contentEditable = enabled ? 'true' : 'false');
  deckBar.querySelector('#edit-slide').textContent = enabled ? '完成编辑' : '编辑文字';
}
function selectSlide(id, options = {}) {
  const slide = allSlides().find(item => item.dataset.slideId === id);
  if (!slide) return;
  if (slide.hidden && options.reveal !== false) slide.hidden = false;
  activeSlideId = id;
  allSlides().forEach(item => item.classList.toggle('is-active', item === slide));
  const index = allSlides().indexOf(slide);
  pageNumber.value = index + 1;
  pageNumber.max = allSlides().length;
  pageTotal.textContent = `/ ${allSlides().length}`;
  if (editing) setEditable(true);
  renderRail();
}
function renderRail() {
  normalizeNumbers();
  slideList.innerHTML = '';
  const slides = allSlides();
  rail.querySelector('#deck-count').textContent = slides.length;
  slides.forEach((slide, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'slide-thumb';
    item.draggable = true;
    item.dataset.slideId = slide.dataset.slideId;
    item.classList.toggle('active', slide.dataset.slideId === activeSlideId);
    item.classList.toggle('excluded', slide.hidden);
    item.innerHTML = `<span class="drag-handle">⋮⋮</span><i>${String(index + 1).padStart(2, '0')}</i><span class="thumb-copy"><b>${slideTitle(slide)}</b><small>${slide.hidden ? '未加入当前演示' : '拖拽调整顺序'}</small></span>`;
    item.addEventListener('click', () => selectSlide(slide.dataset.slideId));
    item.addEventListener('dragstart', event => {
      draggedSlideId = slide.dataset.slideId;
      event.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => { draggedSlideId = null; item.classList.remove('dragging'); });
    item.addEventListener('dragover', event => { event.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', event => {
      event.preventDefault();
      item.classList.remove('drag-over');
      const source = allSlides().find(candidate => candidate.dataset.slideId === draggedSlideId);
      if (!source || source === slide) return;
      const box = item.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      main.insertBefore(source, after ? slide.nextSibling : slide);
      normalizeNumbers();
      saveDeck();
      selectSlide(source.dataset.slideId);
    });
    slideList.appendChild(item);
  });
}
function moveSelectedTo(position) {
  const slides = allSlides();
  const slide = activeSlide();
  if (!slide) return;
  const targetIndex = Math.max(0, Math.min(slides.length - 1, Number(position) - 1));
  const without = slides.filter(item => item !== slide);
  const reference = without[targetIndex] || footer;
  main.insertBefore(slide, reference);
  saveDeck();
  selectSlide(slide.dataset.slideId);
}
function addSlide() {
  const id = `custom-${Date.now()}`;
  const slide = document.createElement('section');
  slide.className = 'deck-slide custom-slide';
  slide.dataset.slideId = id;
  slide.innerHTML = `<div class="sectionHead"><span>00</span><small>NEW SLIDE · ORQELA</small></div><div class="sectionIntro"><h2>双击输入新页面标题</h2><p>双击这里输入页面内容。你可以拖拽左侧缩略图调整位置。</p></div><div class="blank-canvas"><span>＋</span><p>新的 ORQELA 演示页面</p></div>`;
  main.insertBefore(slide, footer);
  activeSlideId = id;
  saveDeck();
  selectSlide(id);
  setEditable(true);
}
function duplicateSlide() {
  const source = activeSlide();
  if (!source) return;
  const copy = source.cloneNode(true);
  copy.dataset.slideId = `copy-${Date.now()}`;
  copy.classList.add('custom-slide');
  copy.classList.remove('is-active');
  source.after(copy);
  activeSlideId = copy.dataset.slideId;
  saveDeck();
  selectSlide(activeSlideId);
}
function deleteSlide() {
  const slides = allSlides();
  const source = activeSlide();
  if (!source || slides.length <= 1) return;
  const index = slides.indexOf(source);
  const next = slides[index + 1] || slides[index - 1];
  source.remove();
  activeSlideId = next.dataset.slideId;
  saveDeck();
  selectSlide(activeSlideId);
}

rail.querySelector('#add-slide').addEventListener('click', addSlide);
rail.querySelector('#duplicate-slide').addEventListener('click', duplicateSlide);
rail.querySelector('#delete-slide').addEventListener('click', deleteSlide);
deckBar.querySelector('#prev-slide').addEventListener('click', () => { const slides = allSlides(); const index = slides.indexOf(activeSlide()); selectSlide(slides[Math.max(0, index - 1)].dataset.slideId); });
deckBar.querySelector('#next-slide').addEventListener('click', () => { const slides = allSlides(); const index = slides.indexOf(activeSlide()); selectSlide(slides[Math.min(slides.length - 1, index + 1)].dataset.slideId); });
pageNumber.addEventListener('change', () => moveSelectedTo(pageNumber.value));
pageNumber.addEventListener('input', () => moveSelectedTo(pageNumber.value));
deckBar.querySelector('#edit-slide').addEventListener('click', () => { setEditable(!editing); if (!editing) saveDeck(); });
deckBar.querySelector('#save-deck').addEventListener('click', () => saveDeck(true));
deckBar.querySelector('#reset-deck').addEventListener('click', () => { if (confirm('恢复 ORQELA 原始页面顺序并删除本地新增页？')) { localStorage.removeItem(deckStorageKey); location.reload(); } });
deckBar.querySelector('#present-deck').addEventListener('click', () => { document.body.classList.toggle('presenting'); deckBar.querySelector('#present-deck').textContent = document.body.classList.contains('presenting') ? '退出演示' : '演示模式'; });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('presenting')) {
    document.body.classList.remove('presenting');
    deckBar.querySelector('#present-deck').textContent = '演示模式';
  }
  if (editing || ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') deckBar.querySelector('#prev-slide').click();
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') deckBar.querySelector('#next-slide').click();
});
document.addEventListener('input', event => { if (editing && event.target.isContentEditable) { renderRail(); saveDeck(); } });
document.addEventListener('dblclick', event => {
  if (!event.target.closest('.deck-slide')) return;
  setEditable(true);
  if (event.target.matches('h1,h2,h3,p,.sectionIntro span')) event.target.focus();
});
document.querySelectorAll('[data-audience]').forEach(button => button.addEventListener('click', () => setTimeout(() => { renderRail(); const visible = allSlides().find(slide => !slide.hidden); if (activeSlide()?.hidden && visible) selectSlide(visible.dataset.slideId, {reveal:false}); }, 0)));
document.querySelector('.apply').addEventListener('click', () => setTimeout(() => { renderRail(); const visible = allSlides().find(slide => !slide.hidden); if (activeSlide()?.hidden && visible) selectSlide(visible.dataset.slideId, {reveal:false}); saveDeck(); }, 0));

renderRail();
selectSlide(activeSlideId);
