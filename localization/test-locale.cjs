const {chromium}=require('playwright');
const assert=require('node:assert/strict');

const base=(process.env.TEST_URL||'http://127.0.0.1:8768').replace(/\/$/,'');
const manualKey='rck.locale.manual.v1';
const countryKey='rck.locale.country.v1';
const paths={en:'/',ru:'/ru/',es:'/es/',fr:'/fr/'};
let browser;
let checks=0;

async function fixture(options={}) {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',javaScriptEnabled:options.javaScriptEnabled!==false});
  const requests=[];
  const errors=[];
  let release;
  const gate=new Promise(resolve=>{release=resolve});
  await context.route('**/mc.yandex.ru/**',route=>route.abort());
  if(options.blockScript) await context.route('**/locale-routing.js',route=>route.abort());
  await context.route('https://api.country.is/**',async route=>{
    requests.push(route.request());
    if(options.hold) await gate;
    try {
      if(options.failure) return await route.abort();
      if(options.raw!==undefined) return await route.fulfill({status:options.status||200,contentType:'application/json',body:options.raw});
      await route.fulfill({status:options.status||200,json:options.response===undefined?{country:options.country||'US',ip:'203.0.113.9'}:options.response});
    } catch(error) {
      // The request may have been aborted after cancellation, timeout or navigation.
      if(!/closed|disposed|Invalid InterceptionId|interception|handled/i.test(error.message)) throw error;
    }
  });
  await context.addInitScript(({languages,manual,cache,denied,manualKey,countryKey})=>{
    Object.defineProperty(navigator,'languages',{get:()=>languages});
    Object.defineProperty(navigator,'language',{get:()=>languages[0]||'en-US'});
    try {
      if(!sessionStorage.getItem('rck.test.seeded')) {
        if(manual!==undefined) localStorage.setItem(manualKey,manual);
        if(cache!==undefined) sessionStorage.setItem(countryKey,cache);
        sessionStorage.setItem('rck.test.seeded','1');
      }
    } catch {}
    const realFetch=window.fetch;
    window.__localeFetches=[];
    window.fetch=(url,init)=>{
      if(String(url).startsWith('https://api.country.is/')) window.__localeFetches.push({url:String(url),init});
      return realFetch.call(window,url,init);
    };
    if(denied) {
      Storage.prototype.getItem=()=>{throw new DOMException('Storage denied','SecurityError')};
      Storage.prototype.setItem=()=>{throw new DOMException('Storage denied','SecurityError')};
      Storage.prototype.removeItem=()=>{throw new DOMException('Storage denied','SecurityError')};
    }
  },{languages:options.languages||['en-US'],manual:options.manual,cache:options.cache,denied:options.denied,manualKey,countryKey});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  return {context,page,requests,errors,release};
}

async function ready(page) {
  await page.waitForFunction(()=>window.RCKLocale&&window.RCKLocale.ready);
  await page.evaluate(()=>window.RCKLocale.ready);
}

async function language(page,expected) {
  await page.waitForURL(url=>url.pathname===paths[expected]);
  await ready(page);
  assert.equal(await page.locator('html').getAttribute('lang'),expected);
  assert.equal(await page.locator('#languageSelect').inputValue(),paths[expected]);
}

async function scenario(name,options,test) {
  const current=await fixture(options);
  try {
    await test(current);
    assert.deepEqual(current.errors,[],`${name}: browser errors`);
    checks++;
    console.log(`PASS locale: ${name}`);
  } finally {
    current.release();
    await current.context.close();
  }
}

(async()=>{
  browser=await chromium.launch({headless:true});
  for(const [country,expected] of [['RU','ru'],['ES','es'],['MX','es'],['FR','fr'],['MC','fr'],['US','en'],['GB','en'],['NZ','en']]) {
    await scenario(`country ${country} → ${expected}`,{country,languages:['de-DE']},async({page,requests})=>{
      await page.goto(base+'/');
      await language(page,expected);
      assert.equal(requests.length,1);
      assert.equal(requests[0].url(),'https://api.country.is/');
      assert.equal(requests[0].headers().referer,undefined,'Do not disclose the page URL to country lookup');
      const cache=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),countryKey);
      assert.deepEqual(Object.keys(cache).sort(),['at','country']);
      assert.equal(cache.country,country);
      assert(Math.abs(Date.now()-cache.at)<10000);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),null,'Automatic routing must not become a manual preference');
      const stored=await page.evaluate(()=>[...Object.values(localStorage),...Object.values(sessionStorage)].join(' '));
      assert(!stored.includes('203.0.113.9'),'Never cache IP addresses');
      if(expected==='en') {
        const [{init}]=await page.evaluate(()=>window.__localeFetches);
        assert.equal(init.credentials,'omit');
        assert.equal(init.referrerPolicy,'no-referrer');
        assert.equal(init.cache,'no-store');
      }
    });
  }

  for(const expected of Object.keys(paths)) {
    await scenario(`explicit query ${expected} wins and is saved`,{country:'RU',manual:'fr'},async({page,requests})=>{
      await page.goto(`${base}/?utm_source=phone&lang=${expected}#trainer`);
      await language(page,expected);
      assert.equal(new URL(page.url()).searchParams.get('utm_source'),'phone');
      assert.equal(new URL(page.url()).hash,'#trainer');
      assert.equal(requests.length,0);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),expected);
    });
  }

  await scenario('saved manual preference precedes country and browser',{country:'FR',manual:'ru',languages:['es-MX']},async({page,requests})=>{
    await page.goto(base+'/');
    await language(page,'ru');
    assert.equal(requests.length,0);
  });

  for(const lang of ['ru','es','fr']) {
    await scenario(`explicit /${lang}/ stays in its language`,{country:'RU',manual:'en'},async({page,requests})=>{
      await page.goto(`${base}/${lang}/?lang=en&source=bookmark#trainer`);
      await language(page,lang);
      assert.equal(requests.length,0);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),'en');
    });
  }

  await scenario('index.html redirects preserving campaign query and hash',{country:'RU'},async({page})=>{
    await page.goto(base+'/index.html?utm_source=phone&code=a%2Bb#trainer');
    await language(page,'ru');
    const url=new URL(page.url());
    assert.equal(url.searchParams.get('utm_source'),'phone');
    assert.equal(url.searchParams.get('code'),'a+b');
    assert.equal(url.hash,'#trainer');
  });

  for(const [name,options,expected] of [
    ['unknown country',{country:'DE',languages:['de-DE','fr-CA']},'fr'],
    ['unsupported browser language',{country:'DE',languages:['de-DE','ja-JP']},'en'],
    ['browser language order',{country:'DE',languages:['en-GB','ru-RU']},'en'],
    ['invalid manual preference',{manual:'../../ru',country:'MX'},'es'],
    ['invalid query language',{country:'FR'},'fr'],
    ['lookup network failure',{failure:true,languages:['ru-RU']},'ru'],
    ['lookup HTTP failure',{status:503,country:'RU',languages:['es-ES']},'es'],
    ['malformed JSON',{raw:'{',languages:['fr-FR']},'fr'],
    ['missing country',{response:{ip:'203.0.113.9'},languages:['es-MX']},'es'],
    ['nonstring country',{response:{country:42},languages:['ru-RU']},'ru'],
    ['null response',{raw:'null',languages:['fr-FR']},'fr'],
  ]) {
    await scenario(name,options,async({page,requests})=>{
      await page.goto(base+'/?lang=invalid');
      await language(page,expected);
      assert.equal(requests.length,1);
    });
  }

  await scenario('country cache avoids repeat lookup',{cache:JSON.stringify({country:'RU',at:Date.now()})},async({page,requests})=>{
    await page.goto(base+'/');
    await language(page,'ru');
    assert.equal(requests.length,0);
  });
  for(const [name,cache] of [
    ['expired cache',JSON.stringify({country:'RU',at:Date.now()-31*60*1000})],
    ['future cache',JSON.stringify({country:'RU',at:Date.now()+60*60*1000})],
    ['malformed cache','{'],
    ['invalid cache timestamp',JSON.stringify({country:'RU',at:'yesterday'})],
    ['invalid cache country',JSON.stringify({country:'Russian Federation',at:Date.now()})],
  ]) {
    await scenario(name,{cache,country:'US'},async({page,requests})=>{
      await page.goto(base+'/');
      await language(page,'en');
      assert.equal(requests.length,1);
      const result=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),countryKey);
      assert.equal(result.country,'US');
    });
  }

  await scenario('lookup timeout falls back without waiting indefinitely',{hold:true,country:'RU',languages:['es-ES']},async({page,requests,release})=>{
    const started=Date.now();
    await page.goto(base+'/');
    await language(page,'es');
    assert.equal(requests.length,1);
    assert(Date.now()-started<6000,'The country service cannot hold navigation indefinitely');
    release();
    await page.reload();
    await language(page,'es');
  });

  for(const event of ['pointerdown','keydown','change','submit']) {
    await scenario(`${event} cancels a late automatic redirect`,{hold:true,country:'RU'},async({page,requests,release})=>{
      await page.goto(base+'/');
      await page.waitForFunction(()=>window.__localeFetches.length===1);
      await page.evaluate(type=>document.dispatchEvent(new Event(type,{bubbles:true})),event);
      release();
      await ready(page);
      assert.equal(new URL(page.url()).pathname,'/');
      assert.equal(requests.length,1);
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
    });
  }

  await scenario('programmatic game start prevents late redirect',{hold:true,country:'RU'},async({page,release})=>{
    await page.goto(base+'/');
    await page.waitForFunction(()=>window.__localeFetches.length===1);
    await page.evaluate(()=>document.querySelector('#startButton').click());
    assert(await page.locator('.trainer').evaluate(node=>node.classList.contains('is-playing')));
    release();
    await ready(page);
    assert.equal(new URL(page.url()).pathname,'/');
    assert(await page.locator('#wordView').isVisible());
  });

  await scenario('manual selector wins a race with the country lookup',{hold:true,country:'RU'},async({page,release})=>{
    await page.goto(base+'/');
    await page.waitForFunction(()=>window.__localeFetches.length===1);
    await page.locator('#languageSelect').selectOption('/fr/');
    await language(page,'fr');
    release();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),'fr');
    await page.goto(base+'/');
    await language(page,'fr');
  });

  await scenario('automatic routing replaces rather than duplicates browser history',{country:'RU'},async({page})=>{
    await page.goto(base+'/es/?history=sentinel');
    await language(page,'es');
    await page.goto(base+'/');
    await language(page,'ru');
    await page.goBack();
    await language(page,'es');
    assert.equal(new URL(page.url()).searchParams.get('history'),'sentinel');
  });

  await scenario('multiple ready consumers share a single lookup',{hold:true,country:'US'},async({page,requests,release})=>{
    await page.goto(base+'/');
    await page.waitForFunction(()=>window.__localeFetches.length===1);
    await page.evaluate(()=>{window.__localeObservers=Promise.all([window.RCKLocale.ready,window.RCKLocale.ready])});
    release();
    await ready(page);
    await page.evaluate(()=>window.__localeObservers);
    assert.equal(requests.length,1);
  });

  await scenario('manual English survives blocked storage and Russian country',{denied:true,country:'RU'},async({page,requests})=>{
    await page.goto(base+'/ru/?utm_source=phone#trainer');
    await language(page,'ru');
    await page.locator('#languageSelect').selectOption('/');
    await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('lang')==='en');
    await language(page,'en');
    assert.equal(requests.length,0);
    assert.equal(new URL(page.url()).searchParams.get('utm_source'),'phone');
    assert.equal(new URL(page.url()).hash,'#trainer');
    await page.reload();
    await language(page,'en');
    assert.equal(requests.length,0);
    await page.locator('#languageSelect').selectOption('/es/');
    await language(page,'es');
    assert.equal(new URL(page.url()).searchParams.has('lang'),false);
  });

  await scenario('denied storage still permits automatic country choice',{denied:true,country:'FR'},async({page,requests})=>{
    await page.goto(base+'/');
    await language(page,'fr');
    assert.equal(requests.length,1);
  });

  for(const lang of ['en','ru']) {
    await scenario(`${lang} active-session confirmation preserves theme and cancelled preference`,{},async({page})=>{
      await page.goto(base+paths[lang]);
      await language(page,lang);
      await page.locator('#rewardThemePicker summary').click();
      await page.locator('[name=rewardTheme][value=space]').check();
      await page.locator('#startButton').click();
      const before=await page.evaluate(key=>localStorage.getItem(key),manualKey);
      page.once('dialog',dialog=>dialog.dismiss());
      await page.locator('#languageSelect').selectOption('/fr/');
      assert.equal(await page.locator('#languageSelect').inputValue(),paths[lang]);
      assert(await page.locator('#wordView').isVisible());
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),before);
      assert.equal(await page.evaluate(()=>localStorage.getItem('rck.rewardTheme.v1')),'space');
      page.once('dialog',dialog=>dialog.accept());
      await page.locator('#languageSelect').selectOption('/fr/');
      await language(page,'fr');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),manualKey),'fr');
      assert.equal(await page.locator('[name=rewardTheme]:checked').inputValue(),'space');
      assert.equal(await page.evaluate(()=>localStorage.getItem('rck.rewardTheme.v1')),'space');
    });
  }

  await scenario('routing script unavailable leaves working English trainer',{blockScript:true,country:'RU'},async({page,requests})=>{
    await page.goto(base+'/');
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(requests.length,0);
    await page.locator('#startButton').click();
    await page.locator('#blendButton').click();
    await page.locator('#readButton').click();
    await page.locator('#chestButton').click();
    assert(await page.locator('#rewardName').innerText());
  });

  await scenario('JavaScript disabled preserves direct localized pages',{javaScriptEnabled:false,country:'RU'},async({page,requests})=>{
    await page.goto(base+'/');
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    await page.goto(base+'/ru/');
    assert.equal(await page.locator('html').getAttribute('lang'),'ru');
    assert.equal(requests.length,0);
  });

  await browser.close();
  console.log(`PASS ${checks} locale scenarios (country service mocked; no real visitor lookups)`);
})().catch(async error=>{
  console.error(error);
  if(browser) await browser.close();
  process.exitCode=1;
});
