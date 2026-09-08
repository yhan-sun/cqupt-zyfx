document.documentElement.classList.add('js');

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
if (menu && nav) {
  menu.hidden = false;
  const close = () => {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      close();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) close();
  });
  matchMedia('(min-width: 901px)').addEventListener('change', close);
}

const filters = [...document.querySelectorAll('[data-gallery-filter]')];
const items = [...document.querySelectorAll('[data-gallery-item]')];
const galleryStatus = document.querySelector('#gallery-status');
if (filters.length) {
  document.querySelector('.gallery-filters').hidden = false;
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    items.forEach(item => { item.hidden = button.dataset.galleryFilter !== 'all' && item.dataset.category !== button.dataset.galleryFilter; });
    if (galleryStatus) galleryStatus.textContent = `${items.filter(item => !item.hidden).length} 张照片`;
  }));
}

const dialog = document.querySelector('#photo-viewer');
const links = [...document.querySelectorAll('[data-photo-view]')];
if (dialog && typeof dialog.showModal === 'function') {
  const image = dialog.querySelector('#photo-image');
  const error = dialog.querySelector('#photo-error');
  let current = [];
  let index = 0;
  let trigger;
  const render = next => {
    if (!current.length) return;
    index = (next % current.length + current.length) % current.length;
    const link = current[index];
    image.alt = link.dataset.title;
    image.hidden = true;
    error.hidden = true;
    dialog.setAttribute('aria-busy', 'true');
    image.src = link.href;
    dialog.querySelector('#photo-title').textContent = link.dataset.title;
    dialog.querySelector('#photo-credit').textContent = link.dataset.credit;
    dialog.querySelector('#photo-position').textContent = `${index + 1} / ${current.length}`;
    const source = dialog.querySelector('#photo-source');
    source.href = link.dataset.source;
    if (/^https?:/.test(link.dataset.source)) source.target = '_blank';
    else source.removeAttribute('target');
    dialog.querySelector('#photo-original').href = link.href;
    dialog.querySelectorAll('[data-photo-step]').forEach(button => { button.disabled = current.length < 2; });
  };
  image.addEventListener('load', () => {
    image.hidden = false;
    dialog.removeAttribute('aria-busy');
  });
  image.addEventListener('error', () => {
    error.hidden = false;
    dialog.removeAttribute('aria-busy');
  });
  links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger = link;
    current = links.filter(item => item.getClientRects().length > 0 && !item.closest('[data-gallery-item]')?.hidden);
    render(current.indexOf(link));
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }));
  dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-photo-step]').forEach(button => button.addEventListener('click', () => render(index + Number(button.dataset.photoStep))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      render(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    trigger?.focus({ preventScroll: true });
  });
}

const copy = document.querySelector('[data-copy-group]');
if (copy) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(copy.dataset.copyGroup);
      status.textContent = '群号已复制，可在 QQ 中粘贴搜索。';
    } catch {
      status.textContent = '复制未完成，请选中或长按群号复制。';
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#group-number'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealSelectors = [
  '.hero-copy > *',
  '.page-heading > *',
  '.section-heading > *',
  '.home-activities .activity-row',
  '.photo-teasers figure',
  '.guide-links a',
  '.join-strip > *',
  '.about-intro > *',
  '.routine dl > div',
  '.captain-story > *',
  '.year-nav a',
  '.year-section > h2',
  '.year-section .activity-row',
  '.campus-row',
  '.gallery-card',
  '.join-main > *',
  '.join-questions > *',
  '.article-header > *',
  '.article .prose > *',
  '.fact-list > div',
  '.article-photos figure',
  '.sc-chapter',
  '.sc-feature > *',
  '.sc-exercise'
];
const revealNodes = [...new Set(revealSelectors.flatMap(selector => [...document.querySelectorAll(selector)]))];
revealNodes.forEach((node, index) => {
  node.dataset.reveal = 'up';
  node.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 55}ms`);
});
document.documentElement.classList.add('reveal-ready');
const showAll = () => revealNodes.forEach(node => node.classList.add('is-visible'));
if (reducedMotion.matches || !('IntersectionObserver' in window)) showAll();
else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: .08 });
  revealNodes.forEach(node => observer.observe(node));
}
reducedMotion.addEventListener('change', event => { if (event.matches) showAll(); });

const header = document.querySelector('.site-header');
if (header) {
  let frame = 0;
  const syncHeader = () => {
    frame = 0;
    header.classList.toggle('is-scrolled', scrollY > 18);
  };
  const scheduleHeader = () => {
    if (frame) return;
    frame = requestAnimationFrame(syncHeader);
  };
  syncHeader();
  addEventListener('scroll', scheduleHeader, { passive: true });
}
