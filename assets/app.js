import { site, routes, stories } from '../data/site.mjs';
import { calculateSeconds, formatDuration, filterStories, verifiedJoinUrl } from './core.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
document.documentElement.classList.add('js');

const menuToggle = $('.menu-toggle');
const nav = $('#main-nav');
if (menuToggle && nav) {
  menuToggle.hidden = false;
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 621px)').addEventListener('change', closeMenu);
}

$$('[data-route]').forEach(button => {
  button.addEventListener('click', () => {
    const route = routes[button.dataset.route];
    if (!route) return;
    $$('[data-route]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#route-title').textContent = route.title;
    $('#route-tag').textContent = route.tag;
    $('#route-description').textContent = route.description;
    $('#route-note').textContent = route.note;
    $('#route-map').href = route.map;
    $('#route-source').href = route.source;
    $('#drawing-no').textContent = `NO. ${route.number}`;
    $('.route-drawing').dataset.scene = button.dataset.route;
    const facts = route.facts.map(text => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    });
    $('#route-facts').replaceChildren(...facts);
  });
});

$$('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $$('.story').forEach(item => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
    });
    $('#filter-status').textContent = `共${filterStories(stories, button.dataset.filter).length}篇手记`;
  });
});

const dialog = $('#story-dialog');
let dialogTrigger = null;
if (dialog && typeof dialog.showModal === 'function') {
  $$('[data-story]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const story = stories.find(item => item.id === link.dataset.story);
      if (!story) return;
      event.preventDefault();
      $('#dialog-title').textContent = story.title;
      $('#dialog-eyebrow').textContent = story.eyebrow;
      $('#dialog-source').href = story.source;
      $('#dialog-source-name').textContent = story.sourceName;
      $('#dialog-body').replaceChildren(...story.paragraphs.map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }));
      dialogTrigger = link;
      document.body.classList.add('dialog-open');
      dialog.showModal();
    });
  });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogTrigger?.focus({ preventScroll: true });
  });
}

const paceForm = $('#pace-form');
if (paceForm) {
  paceForm.noValidate = true;
  paceForm.addEventListener('submit', event => {
    event.preventDefault();
    const distance = $('#distance').value;
    const minutes = $('#pace-min').value;
    const seconds = $('#pace-sec').value;
    const result = [distance, minutes, seconds].some(value => value.trim() === '')
      ? null : calculateSeconds(Number(distance), Number(minutes), Number(seconds));
    const error = $('#pace-error');
    const invalid = result === null;
    error.hidden = !invalid;
    $('#pace-min').setAttribute('aria-invalid', String(invalid));
    $('#pace-sec').setAttribute('aria-invalid', String(invalid));
    if (invalid) {
      error.textContent = '请输入有效配速：分钟为0–30的整数，秒为0–59的整数，合计至少1分钟。';
      $('#pace-output').textContent = '—';
      return;
    }
    error.textContent = '';
    $('#pace-output').textContent = formatDuration(result);
  });
}

$$('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const status = $('#copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(site.fullName);
      status.textContent = '已复制社团名称';
    } catch {
      status.textContent = `请长按或选中复制：${site.fullName}`;
    }
  });
});

const joinUrl = verifiedJoinUrl(site.join);
if ($('#join-notice')) $('#join-notice').textContent = site.join.notice;
if (joinUrl && $('#join-button')) {
  $('#join-button').href = joinUrl;
  $('#join-button').target = '_blank';
  $('#join-button').rel = 'noopener noreferrer';
  $('#join-button').replaceChildren(document.createTextNode(site.join.label + ' ↗'));
  $('.join-status').textContent = '招新通道已核实';
}
if ($('#year')) $('#year').textContent = String(new Date().getFullYear());

if ('IntersectionObserver' in window) {
  const links = $$('#main-nav a[href^="#"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-12% 0px -60% 0px', threshold: 0 });
  links.forEach(link => {
    const target = $(link.hash);
    if (target) observer.observe(target);
  });
}
