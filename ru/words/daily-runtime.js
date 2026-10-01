// A shared calendar uses Moscow midnight regardless of the visitor's timezone.
// The deck is stable across days; consecutive 30-word slices do not overlap.
const DAY_MS = 86400000;
const MOSCOW_OFFSET_MS = 10800000;
const EPOCH_DAY = Math.floor(Date.UTC(2026, 9, 1) / DAY_MS);
for (const words of Object.values(bank)) {
  words.forEach(Object.freeze);
  Object.freeze(words);
}
Object.freeze(bank);

function dayNumber(date = new Date()) {
  const time = Number(date);
  if (!Number.isFinite(time)) throw new TypeError('Invalid date');
  return Math.floor((time + MOSCOW_OFFSET_MS) / DAY_MS);
}

function deck(level) {
  if (!Object.hasOwn(bank, level)) throw new RangeError('Unknown reading level');
  const items = [...bank[level]];
  let seed = { easy: 17481, medium: 29713, hard: 41927 }[level];
  for (let i = items.length - 1; i > 0; i--) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const j = Math.floor((seed >>> 0) / 4294967296 * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function select(level, count = 30, date = new Date()) {
  const words = deck(level);
  if (!Number.isInteger(count) || count < 1 || count > words.length) {
    throw new RangeError('Invalid session size');
  }
  const start = ((dayNumber(date) - EPOCH_DAY) * count % words.length + words.length) % words.length;
  const selected = Array.from({ length: count }, (_, i) => [...words[(start + i) % words.length]]);
  // Start with two open syllables, then short closed words, then three syllables.
  // Sorting changes presentation only, preserving daily membership and rotation.
  if (level === 'easy') selected.sort((a, b) => easyOrder(a) - easyOrder(b));
  return selected;
}

function easyOrder(parts) {
  return parts.length === 2 ? 0 : parts.length === 1 ? 1 : 2;
}

root.RCKDailyWords = Object.freeze({ select, dayNumber, bank, timeZone: 'Europe/Moscow', version: 2 });
