export function createPlayer({ makeAudio = url => new Audio(url), onStatus, onHeard, onError, onActive }) {
  let active = null;
  let timer;
  function stop() {
    clearTimeout(timer);
    if (active) {
      const audio = active.audio;
      active = null;
      audio.onplaying = audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    onActive(null);
  }
  async function play(word, url) {
    const same = active?.word === word;
    stop();
    if (same) { onStatus("Звук остановлен."); return; }
    const audio = makeAudio(url);
    active = { audio, word };
    onActive(word);
    onStatus("Загружаем запись…");
    const fail = () => {
      if (active?.audio !== audio) return;
      stop();
      onError();
    };
    audio.onplaying = () => {
      if (active?.audio !== audio) return;
      clearTimeout(timer);
      onHeard(word);
      onStatus("Звучит слово.");
    };
    audio.onended = () => { if (active?.audio === audio) { stop(); onStatus("Можно послушать ещё раз."); } };
    audio.onerror = fail;
    timer = setTimeout(fail, 12000);
    try { await audio.play(); } catch { fail(); }
  }
  return { play, stop };
}
