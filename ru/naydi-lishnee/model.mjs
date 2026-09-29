import { tasks } from "./content.mjs";

export function createSession(mode = "reading", repeat = false) {
  if (!["reading", "audio"].includes(mode)) throw new Error("Unknown mode");
  return { mode, repeat, index: 0, records: tasks.map(task => ({ id: task.id, answers: [], heard: [], hint: false, revealed: false, complete: false })) };
}
export const currentRecord = state => state.records[state.index];
export function answer(state, word) {
  const record = currentRecord(state);
  if (!record || record.complete || !tasks[state.index].words.includes(word)) return false;
  record.answers.push(word);
  record.complete = word === tasks[state.index].answer;
  return record.complete;
}
export function hint(state) {
  const record = currentRecord(state);
  if (record && !record.complete) record.hint = true;
}
export function reveal(state) {
  const record = currentRecord(state);
  if (!record || record.complete || record.answers.length < 2) return false;
  record.revealed = record.complete = true;
  return true;
}
export function heard(state, word) {
  const record = currentRecord(state);
  if (state.mode === "audio" && record && !record.complete && tasks[state.index].audio?.[word] && !record.heard.includes(word)) record.heard.push(word);
}
export function next(state) {
  if (!currentRecord(state)?.complete) return false;
  state.index += 1;
  return true;
}
export function outcome(record) {
  if (!record.complete) return "Не завершено";
  if (record.revealed) return "Разобрали ответ вместе";
  if (record.heard.length) return "Со звуковой поддержкой";
  if (record.hint) return "С подсказкой";
  if (record.answers.length > 1) return "После исправления";
  return "С первой попытки, без подсказки";
}
export function summary(state) {
  const done = state.records.filter(record => record.complete);
  return { completed: done.length, firstTry: done.filter(record => !record.revealed && !record.hint && !record.heard.length && record.answers.length === 1).length, audio: done.filter(record => record.heard.length).length, hints: done.filter(record => record.hint).length, revealed: done.filter(record => record.revealed).length };
}
