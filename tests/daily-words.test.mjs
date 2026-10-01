import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../ru/words/daily.js', import.meta.url), 'utf8');
function client() {
  const context = vm.createContext({});
  vm.runInContext(code, context);
  return context.RCKDailyWords;
}
const api = client();
const normal = value => JSON.parse(JSON.stringify(value));
const levels = ['easy', 'medium', 'hard'];

test('all 108 original words are preserved and exactly 1000 additions are documented', () => {
  const html = readFileSync(new URL('../ru/index.html', import.meta.url), 'utf8');
  const source = html.split('const wordBanks = Object.freeze(')[1].split('\n    });')[0] + '\n}';
  const original = vm.runInNewContext(`(${source})`);
  const oldWords = new Set(Object.values(original).flat().map(p => p.join('')));
  const additions = readFileSync(new URL('../ru/words/new-words.txt', import.meta.url), 'utf8')
    .split('\n').filter(line => line && !line.startsWith('#') && !line.startsWith('['))
    .join(' ').split(/\s+/).map(word => word.replaceAll('-', ''));
  assert.equal(oldWords.size, 108);
  assert.equal(additions.length, 1000);
  assert.equal(new Set(additions).size, 1000);
  assert.ok(additions.every(word => !oldWords.has(word)));
  for (const level of levels) {
    const words = new Set(api.bank[level].map(p => p.join('')));
    assert.ok(original[level].every(p => words.has(p.join(''))));
  }
  assert.equal(api.bank.easy.length, 336);
  assert.equal(api.bank.medium.length, 486);
  assert.equal(api.bank.hard.length, 286);
});

test('1108 unique Russian words with one vowel in every authored syllable', () => {
  const words = Object.values(api.bank).flat();
  assert.equal(words.length, 1108);
  assert.equal(new Set(words.map(parts => parts.join(''))).size, 1108);
  for (const parts of words) {
    for (const part of parts) {
      assert.match(part, /^[а-яё]+$/u);
      assert.equal((part.match(/[аеёиоуыэюя]/gu) || []).length, 1, parts.join('-'));
    }
  }
});

test('all visitors receive the same ordered 30 words throughout the Moscow day', () => {
  for (const level of levels) {
    const morning = api.select(level, 30, new Date('2026-09-30T21:00:00Z'));
    const evening = client().select(level, 30, new Date('2026-10-01T20:59:59.999Z'));
    assert.deepEqual(normal(morning), normal(evening));
    assert.equal(new Set(morning.map(p => p.join(''))).size, 30);
  }
});

test('Moscow midnight changes the deck; adjacent days have no repeated words', () => {
  for (const level of levels) {
    let previous = new Set();
    const seen = new Set();
    for (let day = 0; day < 370; day++) {
      const words = api.select(level, 30, new Date(Date.UTC(2026, 8, 1 + day, 21)));
      const current = new Set(words.map(p => p.join('')));
      assert.equal([...current].filter(w => previous.has(w)).length, 0);
      current.forEach(w => seen.add(w));
      previous = current;
    }
    assert.equal(seen.size, api.bank[level].length, 'every word is reachable');
  }
});

test('session is an independent snapshot; returned arrays cannot alter future visits', () => {
  const date = new Date('2026-10-01T18:00:00Z');
  const before = normal(api.select('easy', 30, date));
  const session = api.select('easy', 30, date);
  session[0][0] = 'ошибка'; session.pop();
  assert.deepEqual(normal(api.select('easy', 30, date)), before);
  assert.throws(() => api.select('invalid'));
  assert.throws(() => api.select('easy', 0));
  assert.throws(() => api.select('easy', 30, new Date('invalid')));
});
