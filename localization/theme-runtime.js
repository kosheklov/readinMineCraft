(() => {
  'use strict';
  const language=document.documentElement.lang;
  const column={en:0,es:1,fr:2,ru:3}[language]??0;
  const copy=THEME_COPY[language]||THEME_COPY.en;
  const key='rck.rewardTheme.v1';
  let selected='minecraft';
  try {
    const saved=localStorage.getItem(key);
    if(REWARD_THEMES.some(t=>t.id===saved)) selected=saved;
  } catch { /* Presets still work when browser storage is unavailable. */ }
  const originalTitle=document.getElementById('collectionTitle').textContent;
  function shuffle(list) {
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function paint() {
    const theme=REWARD_THEMES.find(t=>t.id===selected);
    document.getElementById('themeSelectedName').textContent=theme.names[column];
    const preview=document.getElementById('themeSummarySprite');
    preview.className=`theme-summary-sprite theme-preview-${selected}`;
    preview.replaceChildren();
    preview.style.backgroundImage='';
    if(theme.frames) drawFrame(preview,`/assets/themes/${selected}.png`,theme.frames[0]);
    document.querySelectorAll('[name="rewardTheme"]').forEach(input=>{input.checked=input.value===selected;});
    document.getElementById('themePrizeNote').textContent=selected==='minecraft'?copy.original:copy.repeat;
    document.getElementById('collectionTitle').textContent=selected==='minecraft'?originalTitle:`${copy.collection} · ${theme.names[column]}`;
  }
  function drawFrame(element,image,frame) {
    const [x,y,width,height]=frame;
    const longest=Math.max(width,height);
    const art=document.createElement('span');
    art.className='theme-art';
    art.style.width=`${width/longest*100}%`;
    art.style.height=`${height/longest*100}%`;
    art.style.backgroundImage=`url("${image}")`;
    art.style.backgroundSize=`${1374/width*100}% ${1145/height*100}%`;
    art.style.backgroundPosition=`${x/(1374-width)*100}% ${y/(1145-height)*100}%`;
    if(frame[4]) art.style.clipPath=frame[4];
    element.style.backgroundImage='none';
    element.classList.add('theme-art-frame');
    element.replaceChildren(art);
  }
  for(const theme of REWARD_THEMES) {
    if(theme.frames) drawFrame(document.querySelector(`.theme-preview-sprite.theme-preview-${theme.id}`),`/assets/themes/${theme.id}.png`,theme.frames[0]);
  }
  document.getElementById('themeOptions').disabled=false;
  document.querySelectorAll('[name="rewardTheme"]').forEach(input=>input.addEventListener('change',()=>{
    if(document.querySelector('.trainer').classList.contains('is-playing')) {paint();return;}
    if(!REWARD_THEMES.some(t=>t.id===input.value)) return;
    selected=input.value;
    try {localStorage.setItem(key,selected);} catch { /* Session-only selection. */ }
    paint();
    document.getElementById('announcer').textContent=`${copy.selected}: ${REWARD_THEMES.find(t=>t.id===selected).names[column]}`;
  }));
  window.RCKThemes=Object.freeze({
    rewards(original,count) {
      if(selected==='minecraft') return shuffle(original).slice(0,count);
      const theme=REWARD_THEMES.find(t=>t.id===selected);
      const pool=theme.items.map((names,i)=>({themeImage:`/assets/themes/${selected}.png`,frame:theme.frames[i],sprite:i,name:names[column],text:copy.found}));
      return shuffle(pool).slice(0,count);
    },
    applySprite(element,reward) {
      if(!reward.themeImage) {
        element.replaceChildren();
        element.classList.remove('theme-art-frame');
        return false;
      }
      drawFrame(element,reward.themeImage,reward.frame);
      return true;
    }
  });
  paint();
})();
