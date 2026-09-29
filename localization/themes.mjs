import {additionalItems} from './theme-items.mjs';
import {themeFrames} from './theme-frames.mjs';
// [en, es, fr, ru]. These presets change rewards only, never reading content.
export const themes = [
  {id:'minecraft',names:['Minecraft','Minecraft','Minecraft','Minecraft']},
  {id:'dinosaurs',names:['Dinosaurs','Dinosaurios','Dinosaures','Динозавры'],items:[
    ['Tyrannosaurus','Tiranosaurio','Tyrannosaure','Тираннозавр'],['Triceratops','Triceratops','Tricératops','Трицератопс'],['Stegosaurus','Estegosaurio','Stégosaure','Стегозавр'],['Long-necked dinosaur','Dinosaurio de cuello largo','Dinosaure à long cou','Длинношеий динозавр'],['Pterosaur','Pterosaurio','Ptérosaure','Птерозавр'],['Dinosaur hatchling','Bebé dinosaurio','Bébé dinosaure','Динозаврик в яйце']
  ]},
  {id:'space',names:['Space','Espacio','Espace','Космос'],items:[
    ['Rocket','Cohete','Fusée','Ракета'],['Ringed planet','Planeta con anillos','Planète à anneaux','Планета с кольцами'],['Space helmet','Casco espacial','Casque spatial','Космический шлем'],['Moon rover','Vehículo lunar','Véhicule lunaire','Луноход'],['Satellite','Satélite','Satellite','Спутник'],['Alien friend','Amigo extraterrestre','Ami extraterrestre','Друг-инопланетянин']
  ]},
  {id:'unicorns',names:['Unicorns','Unicornios','Licornes','Единороги'],items:[
    ['Unicorn','Unicornio','Licorne','Единорог'],['Rainbow','Arcoíris','Arc-en-ciel','Радуга'],['Winged heart','Corazón alado','Cœur ailé','Крылатое сердце'],['Golden star','Estrella dorada','Étoile dorée','Золотая звезда'],['Crystal castle','Castillo de cristal','Château de cristal','Хрустальный замок'],['Sleepy moon','Luna dormida','Lune endormie','Сонная луна']
  ]},
  {id:'fairies',names:['Fairies','Hadas','Fées','Феи'],items:[
    ['Forest fairy','Hada del bosque','Fée de la forêt','Лесная фея'],['Magic wand','Varita mágica','Baguette magique','Волшебная палочка'],['Mushroom cottage','Casita de seta','Maison champignon','Домик-гриб'],['Butterfly','Mariposa','Papillon','Бабочка'],['Magic lantern','Farol mágico','Lanterne magique','Волшебный фонарь'],['Flower crown','Corona de flores','Couronne de fleurs','Цветочный венок']
  ]},
  {id:'garden',names:['Flower garden','Jardín de flores','Jardin fleuri','Цветочный сад'],items:[
    ['Sunflower','Girasol','Tournesol','Подсолнух'],['Tulip','Tulipán','Tulipe','Тюльпан'],['Watering can','Regadera','Arrosoir','Лейка'],['Ladybug','Mariquita','Coccinelle','Божья коровка'],['Strawberry basket','Cesta de fresas','Panier de fraises','Корзинка клубники'],['Greenhouse','Invernadero','Serre','Теплица']
  ]}
];
for (const theme of themes) {
  if (theme.items) {
    theme.items.push(...additionalItems[theme.id]);
    theme.frames = themeFrames[theme.id];
    if (theme.items.length !== 30) throw new Error(`${theme.id}: expected 30 rewards`);
    if (theme.frames.length !== 30) throw new Error(`${theme.id}: expected 30 image frames`);
    for (let locale = 0; locale < 4; locale++) {
      if (theme.items.some(item => item.length !== 4 || !item[locale]) || new Set(theme.items.map(item => item[locale])).size !== 30) {
        throw new Error(`${theme.id}: missing or duplicate reward translation ${locale}`);
      }
    }
  }
}
export const themeCopy = {
  en:{choose:'Choose prizes',selected:'Prize theme',note:'The same reading practice, with your favourite prizes.',repeat:'30 different prizes. No repeats within a session.',original:'The original 30 Minecraft prizes.',found:'A new find for your collection!',collection:'My prizes',check:'Selected'},
  es:{choose:'Elegir premios',selected:'Tema de premios',note:'La misma práctica de lectura, con tus premios favoritos.',repeat:'30 premios diferentes. Sin repeticiones en una sesión.',original:'Los 30 premios originales de Minecraft.',found:'¡Un nuevo hallazgo para tu colección!',collection:'Mis premios',check:'Elegido'},
  fr:{choose:'Choisir les récompenses',selected:'Thème des récompenses',note:'La même lecture, avec tes récompenses préférées.',repeat:'30 récompenses différentes. Aucun doublon pendant une séance.',original:'Les 30 récompenses Minecraft d’origine.',found:'Une nouvelle découverte pour ta collection !',collection:'Mes récompenses',check:'Choisi'},
  ru:{choose:'Выбрать призы',selected:'Тема призов',note:'Те же задания, но с любимыми призами.',repeat:'30 разных призов. Без повторов внутри занятия.',original:'Все 30 прежних Minecraft-призов.',found:'Новая находка в твою коллекцию!',collection:'Мои призы',check:'Выбрано'}
};
const index = {en:0,es:1,fr:2,ru:3};
export function withThemes(page,lang) {
  const col=index[lang], copy=themeCopy[lang];
  const ui=`<details class="reward-theme-picker" id="rewardThemePicker">
    <summary><span class="theme-summary-sprite" id="themeSummarySprite" aria-hidden="true"></span><span>${copy.selected}: <strong id="themeSelectedName">Minecraft</strong><small>${copy.choose}</small></span></summary>
    <fieldset id="themeOptions" disabled><legend>${copy.choose}</legend><p class="theme-explainer">${copy.note}</p><div class="theme-options">
    ${themes.map((t,i)=>`<label class="theme-option"><input type="radio" name="rewardTheme" value="${t.id}"${i===0?' checked':''}><span class="theme-option-content"><span class="theme-preview-sprite theme-preview-${t.id}" aria-hidden="true"></span><span>${t.names[col]}</span></span></label>`).join('\n')}
    </div><p id="themePrizeNote" class="theme-explainer">${copy.original}</p></fieldset>
  </details>`;
  page=page.replace('<button class="start-game"',`${ui}\n                <button class="start-game"`)
    .replace('</head>','  <link rel="stylesheet" href="/reward-themes.css">\n</head>')
    .replace('<script>\n    const METRIKA_ID', '<script src="/reward-themes.js"></script>\n  <script>\n    const METRIKA_ID');
  if(lang==='en') {
    page=page.replace('const prizes=shuffle(rewards);','const prizes=window.RCKThemes ? window.RCKThemes.rewards(rewards,chosenLesson.words.length) : shuffle(rewards);');
    page=page.replace('function applySprite(element,reward) {','function applySprite(element,reward) {\n  if(window.RCKThemes?.applySprite(element,reward)) return;\n  element.style.backgroundSize="400% 400%";');
  } else {
    page=page.replace('const shuffledRewards = shuffle(rewards);','const shuffledRewards = window.RCKThemes ? window.RCKThemes.rewards(rewards,words.length) : shuffle(rewards);');
    page=page.replace('function applySprite(element, reward) {','function applySprite(element, reward) {\n      if(window.RCKThemes?.applySprite(element,reward)) return;\n      element.style.backgroundSize="400% 400%";');
  }
  return page;
}
