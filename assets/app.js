import { calculateSeconds, formatDuration, cycleIndex } from './core.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
document.documentElement.classList.add('js');

const polish = document.createElement('link');
polish.rel = 'stylesheet';
polish.href = new URL('./polish.css', import.meta.url).href;
polish.dataset.visualPolish = 'home-science';
document.head.append(polish);

const toggle = $('.menu-toggle');
const nav = $('#main-nav');
if (toggle && nav) {
  toggle.hidden = false;
  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.masthead, .nav-band')) closeMenu();
  });
  matchMedia('(min-width: 621px)').addEventListener('change', closeMenu);
}

const slides = $$('.hero-slide');
let slideIndex = 0;
function showSlide(index) {
  slideIndex = cycleIndex(index, slides.length);
  slides.forEach((slide, i) => { slide.hidden = i !== slideIndex; });
  $$('[data-slide]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.slide) === slideIndex)));
  if ($('#slide-status')) $('#slide-status').textContent = `第 ${slideIndex + 1} 张，共 ${slides.length} 张：${slides[slideIndex].querySelector('h1,h2').textContent}`;
}
if (slides.length) {
  $('.hero-controls').hidden = false;
  $$('[data-slide]').forEach(button => button.addEventListener('click', () => showSlide(Number(button.dataset.slide))));
  $$('[data-slide-step]').forEach(button => button.addEventListener('click', () => showSlide(slideIndex + Number(button.dataset.slideStep))));
}

$$('[data-gallery-filter]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-gallery-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const items = $$('.gallery-item');
    items.forEach(item => { item.hidden = button.dataset.galleryFilter !== 'all' && button.dataset.galleryFilter !== item.dataset.category; });
    $('#gallery-status').textContent = `显示 ${items.filter(item => !item.hidden).length} 张图片`;
  });
});

$$('[data-year-filter]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-year-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const items = $$('.archive-item');
    items.forEach(item => { item.hidden = button.dataset.yearFilter !== 'all' && item.dataset.year !== button.dataset.yearFilter; });
    $('#news-status').textContent = `共 ${items.filter(item => !item.hidden).length} 篇`;
  });
});

$$('[data-route]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-route]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $$('.route-panel').forEach(panel => { panel.hidden = panel.id !== `route-${button.dataset.route}`; });
    $('#route-live').textContent = `已切换至${button.textContent}`;
  });
});

const dialog = $('#photo-dialog');
const galleryData = $('#gallery-data');
let photoList = [];
let photoIndex = 0;
let photoTrigger = null;
if (dialog && galleryData && typeof dialog.showModal === 'function') {
  const allPhotos = JSON.parse(galleryData.textContent);
  const showPhoto = index => {
    photoIndex = cycleIndex(index, photoList.length);
    const photo = photoList[photoIndex];
    $('#lightbox-image').src = photo.src;
    $('#lightbox-image').alt = `${photo.title}${photo.year ? '，' + photo.year + '年' : ''}`;
    $('#photo-title').textContent = photo.title;
    $('#photo-credit').textContent = `${photo.year ? photo.year + ' · ' : ''}${photo.credit}`;
    $('#photo-source').href = photo.source;
    $('#photo-position').textContent = `${photoIndex + 1} / ${photoList.length}`;
  };
  $$('[data-photo]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    photoTrigger = link;
    const visibleIds = $$('.gallery-item:not([hidden]) [data-photo]').map(item => item.dataset.photo);
    photoList = allPhotos.filter(photo => visibleIds.includes(photo.id));
    showPhoto(photoList.findIndex(photo => photo.id === link.dataset.photo));
    document.body.classList.add('dialog-open');
    dialog.showModal();
  }));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  $$('[data-photo-step]').forEach(button => button.addEventListener('click', () => showPhoto(photoIndex + Number(button.dataset.photoStep))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    photoTrigger?.focus({ preventScroll: true });
  });
}

const paceForm = $('#pace-form');
if (paceForm) {
  paceForm.noValidate = true;
  paceForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = [$('#distance'), $('#pace-min'), $('#pace-sec')];
    const values = fields.map(field => field.value);
    const result = values.some(value => value.trim() === '') ? null : calculateSeconds(...values.map(Number));
    const invalid = result === null;
    fields.slice(1).forEach(field => field.setAttribute('aria-invalid', String(invalid)));
    $('#pace-error').hidden = !invalid;
    $('#pace-error').textContent = invalid ? '请填写有效配速：分钟为0–30的整数，秒数为0–59的整数，合计至少1分钟。' : '';
    $('#pace-output').textContent = invalid ? '—' : formatDuration(result);
  });
}

$$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(button.dataset.copy);
    $('#copy-status').textContent = '社团名称已复制。';
  } catch {
    $('#copy-status').textContent = `请选中复制：${button.dataset.copy}`;
  }
}));
