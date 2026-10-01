import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// The local root is an unpublished prototype. Local checks cover the seven
// production Russian pages; --live checks every URL in the deployed sitemap.
const live = process.argv.includes('--live');
const root = new URL('../', import.meta.url);
const origin = 'https://readingcraftkids.com';
async function read(path) {
  if (!live) return readFileSync(new URL(path, root), 'utf8');
  const response = await fetch(`${origin}/${path.replace(/index\.html$/, '')}`);
  assert.equal(response.status, 200, path);
  assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex|none/i, path);
  return response.text();
}
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
const [sitemap, robots] = await Promise.all([read('sitemap.xml'), read('robots.txt')]);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert.ok(urls.length >= 10, 'Do not drop published pages from sitemap');
assert.match(robots, /Sitemap:\s*https:\/\/readingcraftkids\.com\/sitemap\.xml/i);
assert.doesNotMatch(robots, /^\s*Disallow:\s*\/(?:ru(?:\/.*)?)?\s*$/im, 'Published routes blocked');
const targets = urls.filter(url => live || new URL(url).pathname.startsWith('/ru/'));
const titles = new Set(), descriptions = new Set();
const pages = await Promise.all(targets.map(async url => {
  assert.equal(new URL(url).origin, origin);
  assert.equal(new URL(url).search, '', 'Daily decks must not create URL variants');
  const path = new URL(url).pathname.replace(/^\//, '') + 'index.html';
  return [url, await read(path)];
}));
for (const [url, html] of pages) {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attrs(m[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0]));
  const description = metas.find(m => m.name === 'description')?.content?.trim();
  const directives = metas.filter(m => /^(robots|googlebot|yandex)$/i.test(m.name || '')).map(m => m.content).join(',');
  assert.ok(title && description, `Missing title/description: ${url}`);
  assert.ok(!titles.has(title) && !descriptions.has(description), `Duplicate metadata: ${url}`);
  titles.add(title); descriptions.add(description);
  assert.doesNotMatch(directives, /noindex|nofollow|none/i, `Blocked indexing: ${url}`);
  assert.deepEqual(links.filter(l => l.rel === 'canonical').map(l => l.href), [url], `Canonical: ${url}`);
  assert.match(html, /<h1\b/i, `Missing heading: ${url}`);
  assert.match(html, /<html[^>]*lang=["'][a-z-]+["']/i, `Missing language: ${url}`);
  if (url === `${origin}/ru/`) {
    for (const language of ['ru', 'en', 'es', 'fr', 'x-default']) {
      assert.ok(links.some(l => l.rel === 'alternate' && l.hreflang === language && urls.includes(l.href)), `Missing hreflang ${language}`);
    }
    for (const exercise of targets.filter(u => u.startsWith(`${origin}/ru/`) && u !== url)) {
      assert.ok(html.includes(`href="${new URL(exercise).pathname}"`), `Missing entry: ${exercise}`);
    }
  }
}
console.log(`SEO OK: ${targets.length} ${live ? 'live' : 'local Russian'} pages, ${urls.length} sitemap URLs; canonical, metadata, indexing, links and language checks passed.`);
