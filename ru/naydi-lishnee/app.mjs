import { tasks } from "./content.mjs";
import { createSession, currentRecord, answer, hint, reveal, heard, next, outcome, summary } from "./model.mjs";
import { createPlayer } from "./audio.mjs";

const $ = id => document.getElementById(id);
let state;
let hasStarted = false;
let silent = false;
const player = createPlayer({
  onStatus: text => { $("audio-status").textContent = text; },
  onHeard: word => heard(state, word),
  onError: () => {
    $("audio-status").textContent = "Запись не включилась. Попробуй ещё раз или продолжи без звука.";
    $("continue-silent").hidden = false;
  },
  onActive: word => {
    document.querySelectorAll(".play").forEach(button => {
      const active = button.dataset.word === word;
      button.textContent = active ? "Остановить" : "Послушать";
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Остановить" : "Послушать"} слово «${button.dataset.word}»`);
    });
  },
});
function screen(id, focusId) {
  for (const name of ["intro", "task", "result"]) $(name).hidden = name !== id;
  $(focusId).focus();
}
function finishTask() {
  player.stop();
  $("audio-status").textContent = "";
  $("continue-silent").hidden = true;
  const task = tasks[state.index];
  const record = currentRecord(state);
  $("feedback").textContent = `${record.revealed ? "Разберём вместе." : "Верно!"} ${task.explanation}`;
  document.querySelectorAll(".word").forEach(button => {
    button.disabled = true;
    if (button.textContent === task.answer) button.classList.add("correct");
  });
  document.querySelectorAll(".play").forEach(button => { button.hidden = true; });
  $("hint").hidden = $("reveal").hidden = true;
  $("next").hidden = false;
  $("next").textContent = state.index === tasks.length - 1 ? "Посмотреть итог" : "Дальше";
  $("progress").value = state.index + 1;
  $("next").focus();
}
function renderTask() {
  player.stop();
  const task = tasks[state.index];
  const canHear = state.mode === "audio" && Boolean(task.audio) && !silent;
  $("counter").textContent = `Задание ${state.index + 1} из ${tasks.length}`;
  $("progress").value = state.index;
  $("category").textContent = `Два слова называют ${task.group}. Найди другое.`;
  $("instruction").textContent = canHear ? "Нажми на слово, чтобы ответить. Кнопка рядом позволяет его послушать." : state.mode === "audio" && state.index === 1 ? "Теперь читаем слова сами. Если трудно, можно открыть подсказку." : "Прочитай слова и выбери одно. Можно воспользоваться подсказкой.";
  $("words").replaceChildren();
  $("feedback").textContent = $("audio-status").textContent = "";
  $("hint").hidden = false;
  $("hint").disabled = false;
  for (const id of ["reveal", "next", "continue-silent", "restart-confirm"]) $(id).hidden = true;
  for (const word of task.words) {
    const group = document.createElement("div");
    group.className = `word-group${canHear ? " with-audio" : ""}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word";
    button.textContent = word;
    button.onclick = () => {
      player.stop();
      $("audio-status").textContent = "";
      if (answer(state, word)) return finishTask();
      button.classList.add("wrong");
      $("feedback").textContent = currentRecord(state).hint ? task.hint : "Посмотрим ещё раз. Какое слово не подходит к двум другим?";
      if (currentRecord(state).answers.length >= 2) $("reveal").hidden = false;
    };
    group.append(button);
    if (canHear) {
      const play = document.createElement("button");
      play.type = "button";
      play.className = "play";
      play.dataset.word = word;
      play.textContent = "Послушать";
      play.setAttribute("aria-label", `Послушать слово «${word}»`);
      play.setAttribute("aria-pressed", "false");
      play.onclick = () => player.play(word, task.audio[word]);
      group.append(play);
    }
    $("words").append(group);
  }
  screen("task", "question");
}
$("start").onclick = () => {
  state = createSession(document.querySelector('input[name="mode"]:checked').value, hasStarted);
  hasStarted = true;
  silent = false;
  renderTask();
};
$("hint").onclick = () => {
  hint(state);
  $("feedback").textContent = tasks[state.index].hint;
  $("hint").disabled = true;
};
$("reveal").onclick = () => { if (reveal(state)) finishTask(); };
$("next").onclick = () => {
  if (!next(state)) return;
  if (state.index < tasks.length) return renderTask();
  const result = summary(state);
  $("summary").textContent = `Завершено: ${result.completed} из ${tasks.length}. С первой попытки без подсказки и озвучки: ${result.firstTry}. Со звуковой поддержкой: ${result.audio}. С подсказкой: ${result.hints}. Разобрано с показом ответа: ${result.revealed}. Поддержка может сочетаться в одном задании.`;
  $("records").replaceChildren();
  state.records.forEach((record, index) => {
    const row = document.createElement("li");
    row.textContent = `${tasks[index].words.join(" · ")} — ${tasks[index].answer}`;
    const detail = document.createElement("span");
    detail.textContent = `${outcome(record)}.${record.answers.length ? ` Попыток: ${record.answers.length}.` : ""}${record.hint ? " Подсказка использована." : ""}${record.heard.length ? " Слова прослушаны." : ""}`;
    row.append(detail);
    $("records").append(row);
  });
  $("repeat-note").textContent = state.repeat ? "Это повтор знакомого набора. Ответы могут запомниться; повтор не подтверждает новый навык." : "Результат остаётся на этой странице и исчезнет после обновления. Повтор знакомого набора — практика, а не новая проверка.";
  screen("result", "result-title");
};
function restart() { player.stop(); screen("intro", "intro-title"); }
$("restart").onclick = restart;
$("restart-task").onclick = () => { player.stop(); $("restart-confirm").hidden = false; $("confirm-restart").focus(); };
$("confirm-restart").onclick = restart;
$("cancel-restart").onclick = () => { $("restart-confirm").hidden = true; $("restart-task").focus(); };
$("continue-silent").onclick = () => {
  player.stop();
  silent = true;
  document.querySelectorAll(".play").forEach(button => { button.hidden = true; });
  document.querySelectorAll(".word-group").forEach(group => group.classList.remove("with-audio"));
  $("continue-silent").hidden = true;
  $("audio-status").textContent = "Продолжаем без звука. Ответы и уже использованная помощь сохранены.";
  $("instruction").textContent = "Прочитай слова и выбери одно.";
  $("question").focus();
};
window.addEventListener("pagehide", () => player.stop());
document.addEventListener("visibilitychange", () => { if (document.hidden) player.stop(); });
$("start").disabled = false;
$("start").textContent = "Начать";
