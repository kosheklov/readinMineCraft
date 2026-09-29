import { themes } from "./themes.mjs";
import { tasks } from "./content.mjs";
import { createSession, currentRecord, answer, hint, reveal, heard, next, outcome, summary, openPrize, prizes } from "./model.mjs";
import { createPlayer } from "./audio.mjs";

const $ = id => document.getElementById(id);
let state;
let hasStarted = false;
let silent = false;
let selectedTheme = "minecraft";
try { const saved = localStorage.getItem("rck.rewardTheme.v1"); if (themes.some(t => t.id === saved)) selectedTheme = saved; } catch {}
function paintTheme() { $("theme-name").textContent = themes.find(t => t.id === selectedTheme).name; }
for (const theme of themes) {
  const label = document.createElement("label");
  label.className = "theme-option";
  const input = document.createElement("input");
  input.type = "radio"; input.name = "rewardTheme"; input.value = theme.id; input.checked = theme.id === selectedTheme;
  const content = document.createElement("span"); content.className = "theme-option-content";
  const preview = theme.frames ? { frame: theme.frames[0], image: `https://readingcraftkids.com/assets/themes/${theme.id}.png` } : prizes[0];
  content.append(prizeImage(preview), document.createTextNode(theme.name));
  label.append(input, content);
  input.onchange = () => { selectedTheme = theme.id; paintTheme(); try { localStorage.setItem("rck.rewardTheme.v1", selectedTheme); } catch {} };
  $("theme-options").append(label);
}
paintTheme();
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
  for (const name of ["intro", "task", "chest", "reward", "result"]) $(name).hidden = name !== id;
  $(focusId).focus();
}
function finishTask() {
  player.stop();
  const record = currentRecord(state);
  $("chest-title").textContent = record.revealed ? "Спасибо! Мы разобрали задание." : "Спасибо! Ты заработал сундук!";
  $("chest-counter").textContent = `Задание ${state.index + 1} из ${tasks.length} завершено`;
  $("chest-theme").textContent = `Призы: ${themes.find(t => t.id === state.themeId).name}`;
  $("answer-explanation").textContent = tasks[state.index].explanation;
  $("next").textContent = state.index === tasks.length - 1 ? "Посмотреть все призы" : "Следующее задание";
  screen("chest", "chest-title");
}
function prizeImage(prize) {
  const image = document.createElement("span");
  image.className = "prize-sprite";
  image.setAttribute("aria-hidden", "true");
  if (prize.frame) {
    const [x, y, width, height, clip] = prize.frame;
    const art = document.createElement("span"); art.className = "theme-art";
    const longest = Math.max(width, height);
    art.style.width = `${width / longest * 100}%`; art.style.height = `${height / longest * 100}%`;
    art.style.backgroundImage = `url("${prize.image}")`;
    art.style.backgroundSize = `${1374 / width * 100}% ${1145 / height * 100}%`;
    art.style.backgroundPosition = `${x / (1374 - width) * 100}% ${y / (1145 - height) * 100}%`;
    if (clip) art.style.clipPath = clip;
    image.classList.add("theme-frame"); image.append(art); return image;
  }
  image.style.backgroundPosition = `${(prize.sprite % 4) * 100 / 3}% ${Math.floor(prize.sprite / 4) * 100 / 3}%`;
  return image;
}
$("open-prize").onclick = () => {
  const prize = openPrize(state);
  if (!prize) return;
  $("prize-reveal").replaceChildren(prizeImage(prize));
  $("reward-title").textContent = prize.name;
  $("next").hidden = false;
  screen("reward", "reward-title");
};
function renderTask() {
  player.stop();
  const task = tasks[state.index];
  const canHear = state.mode === "audio" && Boolean(task.audio) && !silent;
  $("counter").textContent = `Задание ${state.index + 1} из ${tasks.length}`;
  $("progress").value = state.index;
  $("category").textContent = `Два слова называют ${task.group}. Найди другое.`;
  $("instruction").textContent = canHear ? "Нажми на слово, чтобы ответить. Кнопка рядом позволяет его послушать." : state.mode === "audio" && state.index === 1 ? "Теперь читаем слова сами. Если трудно, можно открыть подсказку." : "Прочитай слова и выбери одно. Можно воспользоваться подсказкой.";
  $("words").replaceChildren();
  $("words").hidden = $("instruction").hidden = false;
  $("open-prize").hidden = false;
  $("prize-reveal").replaceChildren();
  $("feedback").textContent = $("audio-status").textContent = "";
  $("feedback").parentElement.dataset.state = "";
  $("hint").hidden = false;
  $("hint").disabled = false;
  for (const id of ["reveal", "continue-silent", "restart-confirm"]) $(id).hidden = true;
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
      button.setAttribute("aria-invalid", "true");
      if (!group.querySelector(".wrong-label")) {
        const label = document.createElement("span");
        label.className = "wrong-label";
        label.textContent = "Не это слово";
        group.append(label);
      }
      $("feedback").parentElement.dataset.state = "wrong";
      $("feedback").textContent = currentRecord(state).hint ? `Пока неверно. ${task.hint}` : "Пока неверно. Это слово подходит к группе. Попробуй другое.";
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
  state = createSession(document.querySelector('input[name="mode"]:checked').value, hasStarted, selectedTheme);
  hasStarted = true;
  silent = false;
  renderTask();
};
$("hint").onclick = () => {
  hint(state);
  $("feedback").textContent = tasks[state.index].hint;
  $("feedback").parentElement.dataset.state = "hint";
  $("hint").disabled = true;
};
$("reveal").onclick = () => { if (reveal(state)) finishTask(); };
$("next").onclick = () => {
  if (!next(state)) return;
  if (state.index < tasks.length) return renderTask();
  const result = summary(state);
  $("summary").textContent = `Завершено: ${result.completed} из ${tasks.length}. С первой попытки без подсказки и озвучки: ${result.firstTry}. Со звуковой поддержкой: ${result.audio}. С подсказкой: ${result.hints}. Разобрано с показом ответа: ${result.revealed}. Поддержка может сочетаться в одном задании.`;
  $("records").replaceChildren();
  $("collection").replaceChildren();
  state.records.forEach((record, index) => {
    if (record.prizeOpened) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = state.prizes[index].name;
      item.append(prizeImage(state.prizes[index]), label);
      $("collection").append(item);
    }
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
