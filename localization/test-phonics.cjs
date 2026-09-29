const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_URL||'http://127.0.0.1:8768';
(async()=>{
  const {phonics}=await import('./phonics-en.mjs');
  const browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.route('**/mc.yandex.ru/**',r=>r.abort());
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');
  assert(!(await page.locator('#levelView').innerText()).includes('years'));
  for(const stage of phonics) {
    await page.locator(`[data-level=${stage.id}]`).click();
    for(const lesson of stage.lessons) {
      await page.locator('#practiceSelect').selectOption(lesson.id);
      assert((await page.locator('#practicePrerequisites').textContent()).includes(lesson.words[0][0]));
      await page.locator('#startButton').click();
      for(const parts of lesson.words) {
        assert.deepEqual(await page.locator('.phonics-letter').allTextContents(),parts);
        assert.equal(await page.locator('#readButton').isVisible(),false);
        // Cannot bypass the blending step or farm extra rewards with repeated clicks.
        await page.evaluate(()=>document.querySelector('#readButton').click());
        assert(await page.locator('#wordView').isVisible());
        await page.locator('#blendButton').click();
        assert.equal(await page.locator('#syllables').textContent(),parts.join(''));
        await page.locator('#soundButton').click();
        assert.deepEqual(await page.locator('.phonics-letter').allTextContents(),parts);
        await page.locator('#blendButton').click();
        await page.locator('#readButton').click();
        await page.locator('#chestButton').click();
        const score=await page.locator('#score').textContent();
        await page.evaluate(()=>document.querySelector('#chestButton').click());
        assert.equal(await page.locator('#score').textContent(),score);
        await page.locator('#nextButton').click();
      }
      assert.equal(await page.locator('#fullCollection .collection-card').count(),6);
      assert((await page.locator('#finalSummary').innerText()).includes('not a test score'));
      await page.locator('#changeLevelButton').click();
      assert.equal(await page.locator('#practiceSelect').inputValue(),lesson.id);
      console.log('PASS full practice:',lesson.id);
    }
  }
  await page.locator('#startButton').click();
  page.once('dialog',d=>d.dismiss());
  await page.locator('#changeLevelButton').click();
  assert(await page.locator('#wordView').isVisible());
  page.once('dialog',d=>d.dismiss());
  await page.locator('#languageSelect').selectOption('/ru/');
  assert.equal(await page.locator('#languageSelect').inputValue(),'/');
  assert(await page.locator('#wordView').isVisible());
  await page.locator('#blendButton').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'readButton');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'chestButton');
  assert.deepEqual(errors,[]);await browser.close();
  console.log('PASS all English phonics state, keyboard and content checks');
})().catch(e=>{console.error(e);process.exit(1)});
