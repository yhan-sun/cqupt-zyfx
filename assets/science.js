import { normalizeQuery, matchesResource, calculateFuel } from './science-core.mjs';

const scope = document.querySelector('.science-page');
if (scope) {
  const motion = [...scope.querySelectorAll('[data-motion]')];
  const stop = button => {
    const figure = button.closest('.sc-demo');
    figure.querySelector('img').src = button.dataset.still;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '播放 GIF';
  };
  const stopAll = () => motion.forEach(stop);
  motion.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const playing = button.getAttribute('aria-pressed') === 'true';
      stopAll();
      if (playing) return;
      button.closest('.sc-demo').querySelector('img').src = button.dataset.motion;
      button.setAttribute('aria-pressed', 'true');
      button.textContent = '停止播放';
    });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', stopAll);
  const pause = scope.querySelector('[data-stop-motion]');
  if (pause && motion.length) {
    pause.hidden = false;
    pause.addEventListener('click', () => {
      stopAll();
      const status = scope.querySelector('#motion-status');
      if (status) status.textContent = '所有动作均已停止，显示静态图。';
    });
  }
  const query = scope.querySelector('#science-search');
  const list = [...scope.querySelectorAll('[data-resource]')];
  let kind = 'all';
  const filter = () => {
    let count = 0;
    list.forEach(item => {
      item.hidden = !matchesResource(item.dataset.resource, query?.value || '', item.dataset.kind, kind);
      if (!item.hidden) count++;
    });
    const status = scope.querySelector('#science-search-status');
    if (status) status.textContent = `显示 ${count} 条内容`;
    const empty = scope.querySelector('#science-empty');
    if (empty) empty.hidden = count !== 0;
  };
  if (query) {
    query.closest('.sc-search-tools').hidden = false;
    query.addEventListener('input', filter);
    scope.querySelectorAll('[data-science-filter]').forEach(button => button.addEventListener('click', () => {
      kind = button.dataset.scienceFilter;
      scope.querySelectorAll('[data-science-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      filter();
    }));
    scope.querySelector('[data-clear-search]')?.addEventListener('click', () => {
      query.value = '';
      kind = 'all';
      scope.querySelectorAll('[data-science-filter]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.scienceFilter === 'all')));
      filter();
      query.focus();
    });
  }
  const form = scope.querySelector('#fuel-form');
  if (form) {
    form.hidden = false;
    form.noValidate = true;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const inputs = ['fuel-duration','fuel-hourly','fuel-gel','fuel-drink'].map(id => document.getElementById(id));
      const blank = inputs.some(input => !normalizeQuery(input.value));
      const result = blank ? null : calculateFuel(...inputs.map(input => Number(input.value)));
      const error = scope.querySelector('#fuel-error');
      const output = scope.querySelector('#fuel-output');
      error.hidden = result !== null;
      inputs.forEach(input => input.setAttribute('aria-invalid', String(result === null)));
      if (!result) {
        output.replaceChildren();
        error.textContent = '请完整填写有效数值：时长 0–720 分钟（不含 0）、目标 0–90 g/小时、每包碳水 0–100 g（不含 0）、其他食物饮料碳水合计 0–1080 g。';
        return;
      }
      error.textContent = '';
      const number = value => value.toLocaleString('zh-CN', {maximumFractionDigits:1});
      const lead = document.createElement('strong');
      lead.textContent = `按输入目标计算：全程 ${number(result.total)} g 碳水`;
      const detail = document.createElement('p');
      detail.textContent = `扣除其他食物饮料后，剩余 ${number(result.remaining)} g，相当于该标签能量胶 ${number(result.gelEquivalent)} 包的碳水量。可以由多种食物组合，不要求向上取整或全靠胶完成。`;
      const note = document.createElement('p');
      note.textContent = result.overage > 0 ? `已填其他碳水比目标多 ${number(result.overage)} g；请检查是否重复计入。` : '这是数学换算，不是建议摄入量；没有记录或上传输入。';
      if (Number(inputs[1].value) > 60) note.textContent += ' 高于 60 g/小时需要相应训练背景、肠胃耐受及合适碳水组合。';
      if (Number(inputs[0].value) < 60 && Number(inputs[1].value) > 0) note.textContent += ' 短时活动不一定需要补充这些碳水，不要把计算结果当成必须吃够的份量。';
      output.replaceChildren(lead, detail, note);
    });
  }
}
