const archive = document.querySelector('.club-archive-page');
if (archive) {
  const controls = archive.querySelector('.club-year-filter');
  const items = [...archive.querySelectorAll('[data-official-post]')];
  const status = archive.querySelector('#club-filter-status');
  if (controls && items.length) {
    controls.hidden = false;
    controls.querySelectorAll('[data-club-year]').forEach(button => {
      button.addEventListener('click', () => {
        const year = button.dataset.clubYear;
        controls.querySelectorAll('[data-club-year]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        let visible = 0;
        items.forEach(item => {
          item.hidden = year !== 'all' && item.dataset.year !== year;
          if (!item.hidden) visible++;
        });
        if (status) status.textContent = `显示 ${visible} 条跑团记录`;
      });
    });
  }
}
