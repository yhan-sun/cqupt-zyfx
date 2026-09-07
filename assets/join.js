const controls = [...document.querySelectorAll('[data-copy-group]')];
for (const button of controls) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const value = button.dataset.copyGroup;
    const status = button.closest('.join-copy-row')?.nextElementSibling;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      if (status?.classList.contains('join-copy-status')) status.textContent = `QQ群号 ${value} 已复制。`;
      button.textContent = '已复制';
      window.setTimeout(() => { button.textContent = '复制群号'; }, 1800);
    } catch {
      if (status?.classList.contains('join-copy-status')) status.textContent = `请手动复制QQ群号：${value}`;
    }
  });
}
