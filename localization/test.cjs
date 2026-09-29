const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:8768';
const output = process.env.QA_DIR || '/private/tmp/readingcraft-l10n-qa';
mkdirSync(output, {recursive:true});

(async () => {
  const browser = await chromium.launch({headless:true});
  const errors = [];
  for (const viewport of [{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:568}]) {
    const context = await browser.newContext({viewport, reducedMotion:'reduce'});
    await context.route('**/mc.yandex.ru/**', route=>route.abort());
    const page = await context.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.url().startsWith(base) && r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
    for (const [lang,path] of [['en','/'],['es','/es/'],['fr','/fr/'],['ru','/ru/']]) {
      await page.goto(base+path);
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('.welcome-scene').evaluate(img=>img.decode());
      assert.equal(await page.locator('.welcome-scene').evaluate(img=>img.naturalWidth>0),true);
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.equal(await page.locator('#languageSelect').inputValue(),path);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://readingcraftkids.com'+path);
      assert.equal(await page.locator('link[hreflang]').count(),5);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${lang}: landing overflow`);
      if(viewport.width!==320) await page.screenshot({path:`${output}/${lang}-${viewport.width}-landing.png`,fullPage:true});
      for (const level of ['easy','medium','hard']) {
        await page.locator(`[data-level=${level}]`).click();
        await page.locator('#startButton').click();
        // Real pointer interactions verify the first word/chest/reward flow.
        await page.locator('#readButton').click();
        await page.locator('#chestButton').click();
        assert(await page.locator('#rewardName').innerText());
        await page.locator('#nextButton').click();
        const findings = await page.evaluate(({lang,level})=>{
          const failures=[];
          const check=(stateName,button)=>{
            if(document.documentElement.scrollWidth>innerWidth) failures.push(`${stateName}: page overflow`);
            const rect=button?.getBoundingClientRect();
            if(rect && (rect.x<0 || rect.right>innerWidth+1 || rect.y<0 || rect.bottom>innerHeight+1)) failures.push(`${stateName}: action outside viewport (${Math.round(rect.y)}–${Math.round(rect.bottom)})`);
            if(lang!=='ru') {
              const text=document.body.innerText.replaceAll('Русский','');
              if(/[А-Яа-яЁё]/.test(text)) failures.push(`${stateName}: Russian text`);
            }
          };
          for(let i=1;i<30;i++) {
            if(document.querySelector('#wordView').hidden) throw Error('Expected word');
            check('word',document.querySelector('#readButton'));
            document.querySelector('#readButton').click();
            check('chest',document.querySelector('#chestButton'));
            document.querySelector('#chestButton').click();
            check('reward',document.querySelector('#nextButton'));
            document.querySelector('#nextButton').click();
          }
          if(document.querySelector('#collectionView').hidden) throw Error('Expected collection');
          if(document.querySelectorAll('#fullCollection .collection-card').length!==30) throw Error('Expected 30 rewards');
          return [...new Set(failures)];
        },{lang,level});
        if(findings.length) errors.push(`${lang}/${level}/${viewport.width}: ${findings.join('; ')}`);
        await page.locator('#restartButton').click();
        assert(await page.locator('#wordView').isVisible());
        if(level==='hard' && viewport.width===390) await page.screenshot({path:`${output}/${lang}-390-word.png`,fullPage:true});
        await page.locator('#changeLevelButton').click();
      }
      console.log(`PASS flow: ${lang}, ${viewport.width}px, 3 × 30 rewards, restart, change age`);
    }
    // Navigation, reload, cancellation and acceptance during a session.
    await page.goto(base+'/');
    await page.locator('#languageSelect').selectOption('/es/');
    await page.waitForURL(base+'/es/');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'es');
    await page.locator('#startButton').click();
    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#languageSelect').selectOption('/fr/');
    assert.equal(await page.locator('#languageSelect').inputValue(),'/es/');
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#languageSelect').selectOption('/fr/');
    await page.waitForURL(base+'/fr/');
    await context.close();
  }
  await browser.close();
  assert.deepEqual(errors,[]);
  console.log('PASS all browser checks');
})().catch(error=>{ console.error(error);process.exit(1); });
