export function calculateSeconds(distance, minutes, seconds) {
  if (![distance, minutes, seconds].every(Number.isFinite)) return null;
  if (distance <= 0 || distance > 100 || !Number.isInteger(minutes) || !Number.isInteger(seconds)) return null;
  if (minutes < 0 || minutes > 30 || seconds < 0 || seconds > 59 || minutes * 60 + seconds < 60) return null;
  return Math.round(distance * (minutes * 60 + seconds));
}

export function formatDuration(total) {
  if (!Number.isFinite(total) || total < 0) return '—';
  const rounded = Math.round(total);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  return [h, m, s].map(value => String(value).padStart(2, '0')).join(':');
}

export function filterStories(items, category) {
  return items.filter(item => category === 'all' || item.category === category);
}

export function verifiedJoinUrl(join) {
  if (!join?.verified || !join.url) return null;
  try {
    const url = new URL(join.url);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
