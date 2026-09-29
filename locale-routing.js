(() => {
  'use strict';

  const paths = Object.freeze({en:'/', es:'/es/', fr:'/fr/', ru:'/ru/'});
  const manualKey = 'rck.locale.manual.v1';
  const countryKey = 'rck.locale.country.v1';
  const countryLifetime = 30 * 60 * 1000;
  const timeout = 1500;
  // Product defaults, not restrictions on who can use each reading language.
  // For multilingual/unmapped countries, use the browser's language preference.
  const countryDefaults = Object.freeze(Object.fromEntries([
    ...['RU'].map(code => [code,'ru']),
    ...['FR','MC'].map(code => [code,'fr']),
    ...['ES','MX','AR','BO','CL','CO','CR','CU','DO','EC','GT','HN','NI','PA','PE','PR','PY','SV','UY','VE'].map(code => [code,'es']),
    ...['US','GB','IE','AU','NZ'].map(code => [code,'en'])
  ]));
  let interrupted = false;
  let controller;
  let resolveCancellation;
  const cancellation = new Promise(resolve => {resolveCancellation = resolve;});
  const interactionEvents = ['pointerdown','keydown','change','submit'];

  function isLanguage(value) {
    return typeof value === 'string' && Object.hasOwn(paths,value);
  }

  function readPreference() {
    try {
      const value = localStorage.getItem(manualKey);
      return isLanguage(value) ? value : null;
    } catch { return null; }
  }

  function savePreference(language) {
    try {localStorage.setItem(manualKey,language);} catch { /* URL choice still works. */ }
  }

  function cancel() {
    interrupted = true;
    controller?.abort();
    resolveCancellation(null);
  }

  function removeGuards() {
    interactionEvents.forEach(event => document.removeEventListener(event,cancel,true));
    window.removeEventListener('pagehide',cancel);
  }

  function browserLanguage() {
    const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const value of preferences) {
      const language = String(value || '').toLowerCase().split(/[-_]/)[0];
      if (isLanguage(language)) return language;
    }
    return 'en';
  }

  function readCountry() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(countryKey));
      const age = Date.now() - cached?.at;
      if (/^[A-Z]{2}$/.test(cached?.country) && Number.isFinite(cached?.at) && age >= 0 && age < countryLifetime) return cached.country;
    } catch { /* Invalid/unavailable storage must not block reading. */ }
    return null;
  }

  async function fetchCountry() {
    const cached = readCountry();
    if (cached) return cached;
    if (typeof fetch !== 'function' || typeof AbortController !== 'function') return null;
    controller = new AbortController();
    let timer;
    const deadline = new Promise(resolve => {
      timer = setTimeout(() => {controller.abort();resolve(null);},timeout);
    });
    try {
      const request = fetch('https://api.country.is/', {
        signal:controller.signal,
        credentials:'omit',
        referrerPolicy:'no-referrer',
        cache:'no-store'
      }).then(async response => {
        if (!response.ok) return null;
        const data = await response.json();
        // Never retain the IP or request more precise location fields.
        return typeof data?.country === 'string' && /^[A-Z]{2}$/.test(data.country) ? data.country : null;
      }).catch(() => null);
      const country = await Promise.race([request,deadline,cancellation]);
      if (country && !interrupted) {
        try {sessionStorage.setItem(countryKey,JSON.stringify({country,at:Date.now()}));} catch { /* No cache needed. */ }
      }
      return country;
    } catch { return null; }
    finally {clearTimeout(timer);}
  }

  function redirect(language) {
    if (interrupted || document.querySelector('.trainer.is-playing')) return 'interrupted';
    const path = paths[language];
    if (path !== '/' && location.pathname !== path) {
      location.replace(path + location.search + location.hash);
    }
    return language;
  }

  function choose(path) {
    const language = Object.keys(paths).find(code => paths[code] === path);
    if (!language) return null;
    cancel();
    savePreference(language);
    const target = new URL(path,location.origin);
    target.search = location.search;
    target.searchParams.delete('lang');
    // An explicit English URL also works with storage blocked and can be shared.
    if (language === 'en') target.searchParams.set('lang','en');
    target.hash = location.hash;
    return target.pathname + target.search + target.hash;
  }

  async function route() {
    // Keep direct language URLs stable for visitors, search, and shared links.
    if (!['/','/index.html'].includes(location.pathname)) return 'direct';
    const explicit = new URLSearchParams(location.search).get('lang');
    if (isLanguage(explicit)) {
      savePreference(explicit);
      return redirect(explicit);
    }
    const saved = readPreference();
    if (saved) return redirect(saved);
    interactionEvents.forEach(event => document.addEventListener(event,cancel,true));
    window.addEventListener('pagehide',cancel);
    try {
      const country = await fetchCountry();
      if (interrupted) return 'interrupted';
      return redirect(readPreference() || countryDefaults[country] || browserLanguage());
    } finally {removeGuards();}
  }

  window.RCKLocale = Object.freeze({choose, ready:route()});
})();
