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

test('beginner words use an explicit reviewed list, not a length heuristic', () => {
  const approved = readFileSync(new URL('../ru/words/easy-reviewed.txt', import.meta.url), 'utf8')
    .split('\n').filter(line => line && !line.startsWith('#'));
  assert.equal(approved.length, 69);
  assert.deepEqual(normal(api.bank.easy.map(parts => parts.join('-'))), approved);
  for (const parts of api.bank.easy) {
    assert.doesNotMatch(parts.join(''), /[бвгджзклмнпрстфхцчшщ]{2}|[ьъ]/u);
    assert.ok(parts.length <= 3);
  }
  for (const word of ['счёт', 'вихрь', 'трюм', 'клёст']) {
    assert.ok(!api.bank.easy.some(parts => parts.join('') === word));
  }
  for (let day = 1; day <= 70; day++) {
    const order = api.select('easy', 30, new Date(Date.UTC(2026, 9, day))).map(parts => parts.length === 2 ? 0 : parts.length === 1 ? 1 : 2);
    assert.deepEqual(normal(order), normal([...order].sort()));
  }
});

test('1119 unique Russian words with one vowel in every authored syllable', () => {
  const words = Object.values(api.bank).flat();
  assert.equal(words.length, 1119);
  assert.equal(new Set(words.map(parts => parts.join(''))).size, 1119);
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
