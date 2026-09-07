export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ');
}

export function matchesResource(text, query, kind, activeKind) {
  if (activeKind !== 'all' && kind !== activeKind) return false;
  const haystack = normalizeQuery(text);
  return normalizeQuery(query).split(' ').filter(Boolean).every(word => haystack.includes(word));
}

export function calculateFuel(minutes, hourly, gelGrams, drinkGrams) {
  if (![minutes, hourly, gelGrams, drinkGrams].every(Number.isFinite)) return null;
  if (minutes <= 0 || minutes > 720 || hourly < 0 || hourly > 90 || gelGrams <= 0 || gelGrams > 100 || drinkGrams < 0 || drinkGrams > 1080) return null;
  const total = minutes / 60 * hourly;
  const remaining = Math.max(0, total - drinkGrams);
  return {total, remaining, gelEquivalent: remaining / gelGrams, overage: Math.max(0, drinkGrams - total)};
}
