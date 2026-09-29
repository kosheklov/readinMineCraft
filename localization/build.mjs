import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { words } from './words.mjs';
import { messages, locales, rewardNames } from './messages.mjs';
import { phonics } from './phonics-en.mjs';
import { englishPage } from './english-page.mjs';
import { themes, themeCopy, withThemes } from './themes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'localization/source.ru.template'), 'utf8');
const rewardMatch = source.match(/const rewards = (\[[\s\S]*?\n    \]);/);
const originalRewards = runInNewContext(`(${rewardMatch[1]})`);
const originalWords = runInNewContext(`(${source.match(/const wordBanks = Object.freeze\((\{[\s\S]*?\n    \})\);/)[1]})`);
const origin = 'https://readingcraftkids.com';
const htmlEscape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const jsJSON = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const alternateLinks = Object.entries(locales).map(([lang, l]) =>
  `<link rel="alternate" hreflang="${lang}" href="${origin}${l.path}">`).join('\n  ')
  + `\n  <link rel="alternate" hreflang="x-default" href="${origin}/">`;

for (const [lang, locale] of Object.entries(locales)) {
  const wordBank = lang === 'ru' ? originalWords : lang === 'en'
    ? Object.fromEntries(phonics.map(stage=>[stage.id,stage.lessons.flatMap(lesson=>lesson.words)])) : words[lang];
  for (const [level, list] of Object.entries(wordBank)) {
    assert(list.length >= (lang === 'en' ? 6 : 30), `${lang}/${level} needs enough words`);
    assert.equal(new Set(list.map(p => p.join(''))).size, list.length, `${lang}/${level}: duplicate word`);
    assert(list.every(parts => parts.length && parts.every(p => /^[\p{L}]+$/u.test(p))), 'Invalid syllable');
  }
  let page = source;
  // Install country routing and interaction guards before the trainer is usable.
  // The country request is asynchronous; the page is never hidden or held for it.
  page = page.replace('<head>', '<head>\n  <script src="/locale-routing.js"></script>');
  if (lang !== 'ru') {
    const column = { en: 1, es: 2, fr: 3 }[lang];
    const difficulty = Object.fromEntries(['easy','medium','hard'].map((level, i) =>
      [level, {label: `${['4–5','6–7','8+'][i]} ${locale.age}`}]
    ));
    page = page.replace(/const difficulties = Object.freeze\(\{[\s\S]*?\n    \}\);/, `const difficulties = Object.freeze(${jsJSON(difficulty)});`);
    page = page.replace(/const wordBanks = Object.freeze\(\{[\s\S]*?\n    \}\);/, `const wordBanks = Object.freeze(${jsJSON(wordBank)});`);
    assert.equal(rewardNames[lang].length, originalRewards.length);
    page = page.replace(/const rewards = \[[\s\S]*?\n    \];/, `const rewards = ${jsJSON(originalRewards.map((r,i) => ({...r,name:rewardNames[lang][i],text:locale.reward})))};`);
    for (const row of [...messages].sort((a,b) => b[0].length - a[0].length)) {
      assert(page.includes(row[0]), `Translation source missing: ${row[0]}`);
      page = page.split(row[0]).join(row[column]);
    }
  }
  const url = origin + locale.path;
  page = page.replace('<html lang="ru">', `<html lang="${lang}">`)
    .replace(/<link rel="alternate"[^>]+>\n\s*/g, '')
    .replace(/<link rel="canonical"[^>]+>/, `<link rel="canonical" href="${url}">\n  ${alternateLinks}`)
    .replace('content="ru_RU"', `content="${locale.og}"`)
    .replace(/(<meta property="og:url" content=")[^"]+/, `$1${url}`)
    .replace('"url": "https://readingcraftkids.com/"', `"url": "${url}"`)
    .replace('"inLanguage": "ru"', `"inLanguage": "${lang}"`)
    .replace(/\b(src|href)="assets\//g, '$1="/assets/')
    .replaceAll('"assets/minecraft-', '"/assets/minecraft-')
    .replace('href="styles.css"', 'href="/styles.css"')
    .replace('</head>', '  <link rel="stylesheet" href="/localization.css">\n</head>')
    .replace('href="/site.webmanifest"', `href="${locale.path}site.webmanifest"`)
    .replace(/<div class="demo-word"[^>]*>[\s\S]*?<\/div>/,
      `<div class="demo-word" aria-label="${locale.demoLabel}">${locale.demo.map(p=>`<span>${p}</span>`).join('<i aria-hidden="true">•</i>')}</div>`);

  // A native control remains keyboard/touch accessible and never covers the CTA.
  const options = Object.entries(locales).map(([code, l]) =>
    `<option value="${l.path}" lang="${code}"${code === lang ? ' selected' : ''}>${l.name}</option>`).join('');
  const nav = `<nav class="language-bar" aria-label="${locale.language}">
    <label for="languageSelect">${locale.language}</label>
    <select id="languageSelect">${options}</select>
    <noscript>${Object.entries(locales).map(([code,l]) => `<a href="${l.path}" lang="${code}">${l.name}</a>`).join(' · ')}</noscript>
  </nav>`;
  page = page.replace('<body>', `<body>\n  ${nav}`);
  page = page.replace('<div class="level-picker">', `<div class="level-picker">\n                <noscript><p>${locale.js}</p></noscript>`);
  const languageScript = `
    const languageSelect = document.querySelector('#languageSelect');
    languageSelect.addEventListener('change', () => {
      const target = languageSelect.value;
      if (!${jsJSON(Object.values(locales).map(l => l.path))}.includes(target)) return;
      if (state.screen !== Screen.LEVEL && state.screen !== Screen.COLLECTION && !window.confirm(${jsJSON(locale.switchWarning)})) {
        languageSelect.value = ${jsJSON(locale.path)};
        return;
      }
      window.location.assign(window.RCKLocale?.choose(target) || target);
    });
`;
  page = page.replace('    render();\n  </script>', `${languageScript}\n    render();\n  </script>`);
  if (lang === 'en') page = englishPage(page);
  page = withThemes(page, lang);
  // Every foreign-language string must be translated before publishing.
  if (lang !== 'ru') assert(!/[А-Яа-яЁё]/.test(page.replaceAll('Русский','')), `Russian copy leaked into ${lang}`);
  const dir = resolve(root, locale.path.slice(1));
  mkdirSync(dir, {recursive: true});
  writeFileSync(resolve(dir, 'index.html'), page);
  const manifest = {
    name: 'Reading Craft Kids', short_name: 'Reading Craft', lang,
    start_url: locale.path, scope: '/', display: 'standalone',
    background_color: '#100d16', theme_color: '#084dd9',
    icons: [{src:'/assets/reading-craft-mark.png', sizes:'1254x1254',type:'image/png',purpose:'any'}]
  };
  writeFileSync(resolve(dir,'site.webmanifest'), JSON.stringify(manifest,null,2)+'\n');
  console.log(`${lang}: ${Object.values(wordBank).reduce((n,list)=>n+list.length,0)} words → ${locale.path}`);
}

const alternates = Object.entries(locales).map(([lang,l]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${l.path}"/>`).join('\n    ')
  + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>`;
writeFileSync(resolve(root,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.values(locales).map(l=>`  <url>\n    <loc>${htmlEscape(origin+l.path)}</loc>\n    ${alternates}\n  </url>`).join('\n')}
</urlset>\n`);

writeFileSync(resolve(root,'reward-themes.js'), `// Generated by localization/build.mjs\nconst REWARD_THEMES = ${jsJSON(themes)};\nconst THEME_COPY = ${jsJSON(themeCopy)};\n`+readFileSync(resolve(root,'localization/theme-runtime.js'),'utf8'));
