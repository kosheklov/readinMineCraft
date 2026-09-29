import {readFileSync} from 'node:fs';
import {phonics} from './phonics-en.mjs';

export function englishPage(page) {
  const replace = (from,to) => {
    if(!page.includes(from)) throw Error(`English template drift: ${from}`);
    page=page.split(from).join(to);
  };
  replace('Free online reading practice for ages 4–12: words grouped into syllables, three difficulty levels and Minecraft rewards. No sign-up.', 'Free adult-supported phonics practice: short vowels, digraphs and adjacent consonants. Blend sounds, read words and collect rewards. No sign-up.');
  replace('Free English word reading practice for ages 4–12, with syllables, three difficulty levels and game rewards.', 'Supplementary English phonics practice for sounds already taught, with adult support and game rewards. Not a reading assessment.');
  replace('Read words, open chests and collect Minecraft rewards. Free reading practice for ages 4–12, with no sign-up.', 'Practise known letter–sound correspondences, blend words and collect rewards. Free adult-supported English phonics practice.');
  replace('Free reading practice: words in syllables, three levels and rewards. No sign-up.', 'Short vowels, digraphs and adjacent consonants: free adult-supported phonics practice with rewards.');
  replace('Reading practice with syllables', 'Practice blending sounds into words');
  replace('"educationalRole": "student",\n        "suggestedMinAge": 4,\n        "suggestedMaxAge": 12', '"educationalRole": "student"');
  replace('Reading practice for ages 4&ndash;12', 'English phonics practice · with an adult');
  replace('One word.<br>One chest.<br>Keep reading.', 'Sound it out.<br>Blend it.<br>Read it.');
  replace('Choose your child’s age', 'Choose sounds your child already knows');
  replace('<h2 class="sr-only">Choose sounds your child already knows</h2>', '<h2 class="phonics-choice-title">Choose sounds your child already knows</h2>');
  replace('aria-label="Difficulty level"', 'aria-label="Phonics practice stage"');
  for(const [i,stage] of phonics.entries()) {
    replace(`<span class="level-age">${['4-5','6-7','8+'][i]}</span>\n                    <span class="level-detail">years</span>`, `<span class="level-age">${i+1}</span>\n                    <span class="level-detail">${stage.short}</span>`);
  }
  replace('<button class="start-game"', `<label class="phonics-focus-label" for="practiceSelect">Practice focus</label>
                <select id="practiceSelect" aria-describedby="practiceNote">${phonics[0].lessons.map(l=>`<option value="${l.id}">${l.label}</option>`).join('')}</select>
                <p id="practiceNote" class="phonics-practice-note">6 words · one focus at a time</p>
                <button class="start-game"`);
  replace('Start reading <span', 'Start practice <span');
  replace('</button>\n              </div>\n            </div>\n            <div class="welcome-demo"', `</button>
                <details class="phonics-parent-guide"><summary>For the adult: before you start</summary>
                  <p>This is extra practice, not a complete phonics course. First teach the sounds using your child’s school programme, then choose a matching focus here.</p>
                  <p id="practiceTip">${phonics[0].lessons[0].tip}</p>
                  <p>Sound spellings to know: <span id="practicePrerequisites">${phonics[0].lessons[0].prerequisite}</span>.</p>
                  <p>Model sounds, not letter names. Avoid adding “uh” to consonants. Point to each spelling, blend, then ask your child to read the whole word.</p>
                  <p>Stay nearby and check the reading. Buttons record practice only: there is no microphone, automatic pronunciation check or mastery score.</p>
                </details>
              </div>
            </div>
            <div class="welcome-demo"`);
  page=page.replace(/<div class="demo-word"[^>]*>[\s\S]*?<\/div>/, '<div class="demo-word phonics-demo" aria-label="sh, i, p: three sound spellings in ship"><span>sh</span><span>i</span><span>p</span></div>');
  replace('No sign-up · 30 words per session', 'No sign-up · 6 words per practice');
  replace('Choose<br>an age', 'Choose<br>a focus');
  replace('Read<br>the words', 'Blend sounds.<br>Read words.');
  replace('<div class="syllables" id="syllables" aria-live="polite"></div>', `<p id="phonicsFocus" class="phonics-focus"></p>
          <div class="syllables" id="syllables"></div>
          <p id="phonicsPrompt" class="phonics-prompt"></p>`);
  replace('<button class="primary" id="readButton"', '<button class="primary" id="blendButton" type="button" hidden>Blend the word</button>\n        <button class="primary" id="readButton"');
  replace('<button class="secondary" id="nextButton"', '<button class="phonics-retry" id="soundButton" type="button" hidden>Show sound clues again</button>\n        <button class="secondary" id="nextButton"');
  replace('You collected every reward!', 'Your practice treasures!');
  replace('My Minecraft rewards','My practice treasures');
  replace('Play again','Practise these words again');
  replace('id="total">30<', 'id="total">6<');
  replace('>0 of 30<', '>0 of 6<');
  replace('Change age','Change focus');
  replace('href="/localization.css">', 'href="/localization.css">\n  <link rel="stylesheet" href="/phonics-en.css">');

  // Isolate the English mechanics: no changes to the other three runtimes.
  const rewards=page.match(/const rewards = (\[[^\n]+\]);/)[1];
  const script=readFileSync(new URL('./english-game.js',import.meta.url),'utf8');
  const start=page.indexOf('    const SESSION_WORD_COUNT = 30;');
  const end=page.indexOf('\n  </script>',start);
  if(start<0||end<0) throw Error('English runtime insertion point missing');
  page=page.slice(0,start)+`    const curriculum = ${JSON.stringify(phonics)};\n    const rewards = ${rewards};\n`+script+page.slice(end);
  return page;
}
