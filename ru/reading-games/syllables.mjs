// Authored reading chunks for the answer vocabulary; never changes answer values.
const entries = `Пу-шок Ту-зик Ша-рик аль-бом бел-ка бе-лый близ-ко ва-за ва-реж-ки вед-ро ве-ник ве-се-ло вет-кам ве-че-ром вил-ка во-де во-ду вол-нам вы-мы-ла вы-со-кий глад-кий гли-ны гнез-до гром-ко гряз-ный ка-мень кам-ни кни-га ков-ре конь-ки кор-зи-ну ко-рот-кий кош-ка крас-ный креп-кий кро-ва-ти круг-лый лам-па ле-тать ли-ней-кой лож-ка лож-кой лёг-кий ма-га-зин ма-лень-кий мед-лен-но мок-рый мо-ло-ко мо-ло-ток мор-ковь мяг-кий на-ли-ла на-ре-за-ла низ-кий но-вый но-сок ог-не па-на-мы пе-ро пес-ке пе-сок пе-соч-ни-цу пла-вать под-нять по-мыть по-яс ра-но рас-чёс-кой рель-сам ри-со-вать рюк-зак са-пог са-по-ги си-ний си-ни-ца слад-кий сне-га спря-тать ста-кан сту-ле сум-ка сум-ку тап-ки тес-та ти-хий тон-кий уз-кий ут-ром хо-лод-ный ча-сы чаш-ка чаш-ку чис-тый ши-ро-кий шко-лу што-ры яб-ло-ко яр-кий`;
export const syllables = Object.fromEntries(entries.split(' ').map(s => [s.replaceAll('-', ''), s.split('-')]));
export function splitAnswer(text) {
  return text.split(' ').map(word => syllables[word] || [word]);
}
export function renderAnswer(button, text) {
  button.setAttribute('aria-label', text);
  const visual = document.createElement('span'); visual.setAttribute('aria-hidden', 'true');
  splitAnswer(text).forEach((parts, index) => {
    if (index) visual.append(document.createTextNode(' '));
    const word = document.createElement('span'); word.className = 'syllable-word';
    parts.forEach((part, i) => {
      if(i) { const dot = document.createElement('span'); dot.className = 'syllable-divider'; dot.textContent = '·'; word.append(dot); }
      word.append(document.createTextNode(part));
    });
    visual.append(word);
  });
  button.replaceChildren(visual);
}
