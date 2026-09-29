import { themes } from "../naydi-lishnee/themes.mjs";

export function createModel(tasks) {
const prizes = [
  { name: "Печенье", sprite: 10 }, { name: "Изумруд", sprite: 1 },
  { name: "Золотой слиток", sprite: 2 }, { name: "Аметист", sprite: 3 },
  { name: "Лазурит", sprite: 4 }, { name: "Жемчужина", sprite: 6 },
  { name: "Волшебная книга", sprite: 7 }, { name: "Золотое яблоко", sprite: 8 },
  { name: "Торт", sprite: 9 }, { name: "Алмаз", sprite: 0 },
];

function createSession(mode = "reading", repeat = false, themeId = "minecraft") {
  if (!["reading", "audio"].includes(mode)) throw new Error("Unknown mode");
  const theme = themes.find(item => item.id === themeId);
  if (!theme) throw new Error("Unknown theme");
  const pool = theme.items ? theme.items.map((name, i) => ({ name, frame: theme.frames[i], image: `https://readingcraftkids.com/assets/themes/${theme.id}.png` })) : [...prizes];
  if (theme.items) {
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  }
  return { mode, repeat, themeId, prizes: pool.slice(0, tasks.length), index: 0, records: tasks.map(task => ({ id: task.id, answers: [], heard: [], hint: false, revealed: false, complete: false, prizeOpened: false })) };
}
const currentRecord = state => state.records[state.index];
function answer(state, word) {
  const record = currentRecord(state);
  if (!record || record.complete || !tasks[state.index].words.includes(word)) return false;
  record.answers.push(word);
  record.complete = word === tasks[state.index].answer;
  return record.complete;
}
function hint(state) {
  const record = currentRecord(state);
  if (record && !record.complete) record.hint = true;
}
function reveal(state) {
  const record = currentRecord(state);
  if (!record || record.complete || record.answers.length < 2) return false;
  record.revealed = record.complete = true;
  return true;
}
function heard(state, word) {
  const record = currentRecord(state);
  if (state.mode === "audio" && record && !record.complete && tasks[state.index].audio?.[word] && !record.heard.includes(word)) record.heard.push(word);
}
function next(state) {
  if (!currentRecord(state)?.complete || !currentRecord(state).prizeOpened) return false;
  state.index += 1;
  return true;
}
function openPrize(state) {
  const record = currentRecord(state);
  if (!record?.complete || record.prizeOpened) return null;
  record.prizeOpened = true;
  return state.prizes[state.index];
}
function outcome(record) {
  if (!record.complete) return "Не завершено";
  if (record.revealed) return "Разобрали ответ вместе";
  if (record.heard.length) return "Со звуковой поддержкой";
  if (record.hint) return "С подсказкой";
  if (record.answers.length > 1) return "После исправления";
  return "С первой попытки, без подсказки";
}
function summary(state) {
  const done = state.records.filter(record => record.complete);
  return { completed: done.length, firstTry: done.filter(record => !record.revealed && !record.hint && !record.heard.length && record.answers.length === 1).length, audio: done.filter(record => record.heard.length).length, hints: done.filter(record => record.hint).length, revealed: done.filter(record => record.revealed).length };
}

return { createSession, currentRecord, answer, hint, reveal, heard, next, outcome, summary, openPrize, prizes };
}
