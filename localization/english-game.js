// Adult-supported English blending practice. No speech scoring or age grading.
const Screen = Object.freeze({LEVEL:'level', WORD:'word', CHEST:'chest', REWARD:'reward', COLLECTION:'collection'});
const $ = id => document.getElementById(id);
const trainer = document.querySelector('.trainer');
const levelButtons = [...document.querySelectorAll('[data-level]')];
const practiceSelect = $('practiceSelect');
const atlasFiles = {items1:'/assets/minecraft-prizes-atlas.png',items2:'/assets/minecraft-prizes-atlas-2.png',characters:'/assets/minecraft-characters-atlas.png'};
let chosenStage = curriculum[0];
let chosenLesson = chosenStage.lessons[0];
let state = {screen:Screen.LEVEL, currentIndex:0, collected:[], blended:false};
let cards = [];

function announce(text) { $('announcer').textContent = text; }
function shuffle(items) {
  const copy = [...items];
  for(let i=copy.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
  return copy;
}
function applySprite(element,reward) {
  element.style.backgroundImage = `url("${atlasFiles[reward.atlas]}")`;
  element.style.backgroundPosition = `${(reward.sprite%4)*100/3}% ${Math.floor(reward.sprite/4)*100/3}%`;
}
function createSprite(reward) {
  const el=document.createElement('span'); el.className='sprite'; el.setAttribute('aria-hidden','true'); applySprite(el,reward); return el;
}
function updateFocus() {
  $('practiceTip').textContent = chosenLesson.tip;
  $('practicePrerequisites').textContent = chosenLesson.prerequisite;
  $('practiceNote').textContent = `${chosenLesson.words.length} words · ${chosenLesson.focus}`;
}
function selectStage(id) {
  const stage=curriculum.find(stage=>stage.id===id);
  if(!stage) return;
  chosenStage=stage;
  chosenLesson=stage.lessons[0];
  levelButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.level===id)));
  practiceSelect.replaceChildren(...stage.lessons.map(lesson=>{
    const option=document.createElement('option'); option.value=lesson.id; option.textContent=lesson.label; return option;
  }));
  updateFocus();
  announce(`${stage.label}. Choose a focus with sounds your child already knows.`);
}
function renderWord() {
  const card=cards[state.currentIndex];
  const word=card.parts.join('');
  const container=$('syllables');
  container.replaceChildren();
  container.className = state.blended ? 'syllables phonics-whole' : 'syllables phonics-sounds';
  container.setAttribute('role','group');
  container.setAttribute('aria-label',state.blended ? word : `Sound spellings: ${card.parts.join(', ')}.`);
  if(state.blended) {
    container.textContent=word;
  } else {
    for(const part of card.parts) {
      const span=document.createElement('span');
      span.className='phonics-letter'+(part.length>1?' is-digraph':'');
      span.textContent=part;
      span.setAttribute('aria-hidden','true');
      container.append(span);
    }
  }
  $('wordHint').textContent=state.blended?'Read the whole word aloud.':'Say each sound. Then blend.';
  $('phonicsFocus').textContent=`${chosenLesson.focus} · ${state.currentIndex+1} / ${cards.length}`;
  $('phonicsPrompt').textContent=state.blended
    ? 'Need help? Show the sound clues again.'
    : (card.parts.some(part=>part.length>1)
      ? 'A line joins two letters that spell one sound.'
      : 'One dot for each sound. Use sounds, not letter names.');
}
function renderCollection(listId, full) {
  const list=$(listId); list.replaceChildren();
  if(!state.collected.length) {
    const empty=document.createElement('li');empty.className='collection-empty';
    empty.textContent='Read a word, then open your first chest.';list.append(empty);return;
  }
  state.collected.forEach((reward,i)=>{
    const item=document.createElement('li');item.className=full?'collection-card':'loot-thumb';
    item.title=reward.name;
    const label=document.createElement(full?'p':'span');
    label.className=full?'collection-card-name':'sr-only';label.textContent=reward.name;
    if(!full && state.screen===Screen.REWARD && i===state.collected.length-1) item.classList.add('is-new');
    item.append(createSprite(reward),label);list.append(item);
  });
}
function render() {
  const s=state.screen;
  trainer.classList.toggle('is-playing',s!==Screen.LEVEL);
  for(const [id,screen] of Object.entries({levelView:Screen.LEVEL,wordView:Screen.WORD,chestView:Screen.CHEST,rewardView:Screen.REWARD,collectionView:Screen.COLLECTION})) $(id).hidden=s!==screen;
  $('blendButton').hidden=s!==Screen.WORD || state.blended;
  $('readButton').hidden=s!==Screen.WORD || !state.blended;
  $('soundButton').hidden=s!==Screen.WORD || !state.blended;
  $('nextButton').hidden=s!==Screen.REWARD;
  $('restartButton').hidden=s!==Screen.COLLECTION;
  $('counter').hidden=s===Screen.LEVEL;
  $('changeLevelButton').hidden=s===Screen.LEVEL;
  $('collectionShelf').hidden=s===Screen.LEVEL || s===Screen.COLLECTION;
  $('progressTrack').hidden=s===Screen.LEVEL;
  $('startButton').disabled=false;
  $('changeLevelButton').textContent='Change focus';
  $('score').textContent=state.collected.length;
  $('total').textContent=cards.length || chosenLesson.words.length;
  $('collectionCount').textContent=`${state.collected.length} of ${cards.length || chosenLesson.words.length}`;
  $('progressBar').style.transform=`scaleX(${cards.length ? state.collected.length/cards.length : 0})`;
  $('nextButton').textContent=state.currentIndex===cards.length-1?'See my treasures':'Next word';
  if(s===Screen.WORD) renderWord();
  if(s===Screen.REWARD) {
    const reward=cards[state.currentIndex].reward;
    applySprite($('rewardSprite'),reward);
    $('rewardName').textContent=reward.name;
    $('rewardText').textContent='Another word practised. Another treasure!';
  }
  if(s===Screen.COLLECTION) {
    $('finalSummary').textContent=`${cards.length} words practised: ${chosenLesson.words.map(parts=>parts.join('')).join(', ')}. Focus: ${chosenLesson.focus}. An adult checks the reading; this is not a test score.`;
    renderCollection('fullCollection',true);
  }
  if(s!==Screen.LEVEL && s!==Screen.COLLECTION) renderCollection('collectionList',false);
}
function startGame() {
  const prizes=shuffle(rewards);
  // Stay within one taught correspondence/skill, in an authored order.
  cards=chosenLesson.words.map((parts,i)=>({parts,reward:prizes[i]}));
  state={screen:Screen.WORD,currentIndex:0,collected:[],blended:false};
  render();announce(`${chosenLesson.focus}. Say the sounds, then blend the word.`);$('blendButton').focus();
}
function showWholeWord() {
  if(state.screen!==Screen.WORD || state.blended) return;
  state.blended=true;render();announce('Now read the whole word aloud.');$('readButton').focus();
}
function showSounds() {
  if(state.screen!==Screen.WORD || !state.blended) return;
  state.blended=false;render();announce('Try the sound clues again. Ask an adult to help if needed.');$('blendButton').focus();
}
function confirmRead() {
  if(state.screen!==Screen.WORD || !state.blended) return;
  state.screen=Screen.CHEST;render();announce('Practice recorded. Open your chest.');$('chestButton').focus();
}
function openChest() {
  if(state.screen!==Screen.CHEST) return;
  state.collected.push(cards[state.currentIndex].reward);state.screen=Screen.REWARD;render();
  announce(`Treasure: ${cards[state.currentIndex].reward.name}. ${state.collected.length} of ${cards.length}.`);$('nextButton').focus();
}
function advance() {
  if(state.screen!==Screen.REWARD) return;
  if(state.currentIndex===cards.length-1) {
    state.screen=Screen.COLLECTION;render();announce('Practice complete. Here are your treasures.');$('finalTitle').focus();
  } else {
    state.currentIndex++;state.blended=false;state.screen=Screen.WORD;render();$('blendButton').focus();
  }
}
function chooseAnotherLevel() {
  if(![Screen.LEVEL,Screen.COLLECTION].includes(state.screen) && !window.confirm('Changing focus ends this practice and clears its treasures. Continue?')) return;
  cards=[];state={screen:Screen.LEVEL,currentIndex:0,collected:[],blended:false};render();
  announce('Choose a focus with sounds your child already knows.');practiceSelect.focus();
}
levelButtons.forEach(button=>button.addEventListener('click',()=>selectStage(button.dataset.level)));
practiceSelect.addEventListener('change',()=>{
  chosenLesson=chosenStage.lessons.find(lesson=>lesson.id===practiceSelect.value)||chosenStage.lessons[0];
  updateFocus();announce(`${chosenLesson.focus}. ${chosenLesson.words.length} words to practise.`);
});
$('startButton').addEventListener('click',startGame);
$('blendButton').addEventListener('click',showWholeWord);
$('soundButton').addEventListener('click',showSounds);
$('readButton').addEventListener('click',confirmRead);
$('chestButton').addEventListener('click',openChest);
$('nextButton').addEventListener('click',advance);
$('restartButton').addEventListener('click',startGame);
$('changeLevelButton').addEventListener('click',chooseAnotherLevel);
$('languageSelect').addEventListener('change',()=>{
  const target=$('languageSelect').value;
  if(!['/','/es/','/fr/','/ru/'].includes(target)) return;
  if(![Screen.LEVEL,Screen.COLLECTION].includes(state.screen) && !window.confirm('Changing language ends this practice and clears its treasures. Continue?')) {
    $('languageSelect').value='/';return;
  }
  window.location.assign(window.RCKLocale?.choose(target) || target);
});
updateFocus();render();
