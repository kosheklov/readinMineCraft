const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const base=process.env.TEST_URL||'http://127.0.0.1:8768';
const output=process.env.QA_DIR||'/private/tmp/readingcraft-themes-qa';
mkdirSync(output,{recursive:true});
(async()=>{
  const {themes}=await import('./themes.mjs');
  const browser=await chromium.launch();
  const errors=[];
  for(const width of [390,1440,320]) {
    const context=await browser.newContext({viewport:{width,height:width===320?568:900},reducedMotion:'reduce'});
    await context.route('**/mc.yandex.ru/**',r=>r.abort());
    await context.route('https://api.country.is/**',r=>r.fulfill({json:{country:'US'}}));
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
    for(const [language,path] of [['en','/'],['es','/es/'],['fr','/fr/'],['ru','/ru/']]) {
      await page.goto(base+path);
      await page.evaluate(()=>localStorage.clear());await page.reload();
      assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),'minecraft');
      await page.locator('#rewardThemePicker summary').focus();
      await page.keyboard.press('Enter');
      assert(await page.locator('#rewardThemePicker').getAttribute('open')!==null);
      for(const theme of themes) {
        await page.locator(`[name=rewardTheme][value=${theme.id}]`).check();
        if(theme.id!=='minecraft') assert.equal(await page.evaluate(()=>localStorage.getItem('rck.rewardTheme.v1')),theme.id);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        const prizes=await page.evaluate(()=>window.RCKThemes.rewards(rewards,30));
        assert.equal(prizes.length,30);
        assert.equal(new Set(prizes.map(p=>p.name)).size,30);
        assert.equal(new Set(prizes.map(p=>`${p.atlas||p.themeImage}/${p.sprite}`)).size,30);
        if(theme.id==='minecraft') assert(prizes.every(p=>!p.themeImage));
        else {
          assert(prizes.every(p=>p.themeImage===`/assets/themes/${theme.id}.png`));
          const size=await page.evaluate(async src=>{
            const image=new Image(); image.src=src;await image.decode();return [image.naturalWidth,image.naturalHeight];
          },prizes[0].themeImage);
          assert(size[0]>=1000&&size[1]>=1000);
        }
        await page.locator('[data-level=easy]').click();
        await page.locator('#startButton').click();
        const result=await page.evaluate(language=>{
          const count=language==='en'?6:30;
          const found=[];
          for(let i=0;i<count;i++) {
            if(language==='en') document.querySelector('#blendButton').click();
            document.querySelector('#readButton').click();document.querySelector('#chestButton').click();
            found.push(document.querySelector('#rewardName').textContent);
            document.querySelector('#nextButton').click();
          }
          return {found,cards:document.querySelectorAll('#fullCollection .collection-card').length,visible:!document.querySelector('#collectionView').hidden};
        },language);
        assert.equal(result.cards,language==='en'?6:30);assert(result.visible);
        assert.equal(new Set(result.found).size,result.cards);
        assert(result.found.every(name=>prizes.some(p=>p.name===name)));
        if(language==='ru'&&width===1440&&theme.id!=='minecraft') await page.locator('#fullCollection').screenshot({path:`${output}/${theme.id}-collection.png`});
        await page.locator('#changeLevelButton').click();
        assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),theme.id);
      }
      await page.reload();
      assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),'garden');
      await page.locator('#rewardThemePicker summary').click();
      await page.locator('#rewardThemePicker').screenshot({path:`${output}/${language}-${width}-picker.png`});
      if(language==='en'&&width!==320) await page.screenshot({path:`${output}/en-${width}-expanded.png`,fullPage:true});
      console.log(`PASS ${language} / ${width}px: six themes, 30 unique prizes each, complete sessions and persistence`);
    }
    await page.locator('#languageSelect').selectOption('/');await page.waitForURL(url=>url.origin===new URL(base).origin&&url.pathname==='/'&&url.searchParams.get('lang')==='en');
    assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),'garden');
    await page.evaluate(()=>localStorage.setItem('rck.rewardTheme.v1','not-a-theme'));await page.reload();
    assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),'minecraft');
    await context.close();
  }
  const context=await browser.newContext();
  await context.route('**/mc.yandex.ru/**',r=>r.abort());
  await context.route('https://api.country.is/**',r=>r.fulfill({json:{country:'US'}}));
  await context.addInitScript(()=>{
    Storage.prototype.getItem=()=>{throw Error('Denied')};
    Storage.prototype.setItem=()=>{throw Error('Denied')};
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');await page.locator('#rewardThemePicker summary').click();
  await page.locator('[name=rewardTheme][value=space]').check();
  assert.equal((await page.evaluate(()=>window.RCKThemes.rewards(rewards,30))).length,30);
  await context.route('**/reward-themes.js',r=>r.abort());await page.reload();
  assert(await page.locator('#themeOptions').evaluate(e=>e.disabled));
  await page.locator('#startButton').click();await page.locator('#blendButton').click();
  await page.locator('#readButton').click();await page.locator('#chestButton').click();
  assert(await page.locator('#rewardName').innerText());
  assert.deepEqual(errors,[]);
  await browser.close();console.log('PASS theme storage denial, invalid preferences and script-failure fallback');
})().catch(e=>{console.error(e);process.exit(1)});
