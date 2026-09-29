# First-visit language routing

The main site stays on GitHub Pages. `locale-routing.js` chooses a default on `/` and `/index.html` only. Direct `/ru/`, `/es/`, and `/fr/` links always retain their language. Existing canonical links, hreflang, sitemap, exercises, themes and deployment configuration are unchanged.

## Priority

1. A valid `?lang=en|es|fr|ru` on the root is an explicit choice and is remembered.
2. A language chosen in the top selector is saved under `rck.locale.manual.v1` in this browser. It is saved only after any in-progress session confirmation is accepted.
3. Country from [Country.is](https://country.is/) determines the initial default. Russia → Russian; France/Monaco → French; Spain and the listed Spanish-speaking markets → Spanish; US/UK/Ireland/Australia/New Zealand → English. See `countryDefaults` for the exact product mapping.
4. In multilingual/unmapped countries, or if detection is unavailable, the first supported browser language is used. Otherwise English.

Country is a suggestion, not proof of a visitor’s preferred language. VPNs/proxies may change the detected country. No GPS permission is requested. These defaults do not restrict which language a family can select.

## Privacy and availability

The site owner approved the Country.is integration on 2026-09-29 after disclosure that it receives the visitor’s IP. A root visit without an explicit/saved choice makes one HTTPS request to `https://api.country.is/`. Credentials and referrer are omitted. No coordinates or additional location fields are requested. The application reads only the returned two-letter country code, never stores the returned IP, and does not send names, reward data, or reading activity.

Only `{country, at}` is cached in sessionStorage for 30 minutes. Manual language preference is localStorage only. Both storage types are optional: blocked storage must not break reading or switching. English manual links carry `?lang=en` so a country redirect cannot undo a choice when storage is unavailable.

Country lookup stops after 1.5 seconds; errors, malformed responses and rate limits fall back to the browser language. Interaction (pointer, keyboard, change, submit), page departure, or an already-started exercise cancels automatic redirection. The page is not hidden while detection is pending. Manual switching retains the existing session-loss confirmation. Automatic navigation uses `replace`, preserving query/hash; it never redirects from localized URLs.

## Search and operational notes

This is client-side first-visit assistance, not server-side geo routing or a guarantee of a language on the first painted frame. All four static language pages and their links remain available without JavaScript. Google [advises against inferred-language redirects](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites); the user explicitly requested country defaults, so routing is narrowly limited to the root, with stable explicit URLs and manual override. The root's English HTML/canonical remains unchanged.

No DNS change, new account, paid plan, hosting migration, or background location tracking is involved. Country.is is a third-party availability dependency; no critical reading functionality waits for it. The browser-language fallback remains operational if it is blocked by a network or extension.

## Verification

`localization/test-locale.cjs` simulates countries and failures with intercepted API responses. Existing reading, phonics, and theme suites use a deterministic US response rather than sending test traffic to the geo service. A separate real browser smoke check verifies API CORS and the live integration; simulated-country tests are not presented as physical tests from those countries.

Local verification on 2026-09-29: all 49 routing scenarios passed; all four languages × five viewport widths × three difficulty/focus stages passed; all 84 English phonics words passed; all six themes × four languages × three widths passed. A real unmocked browser request returned a country code with no JavaScript errors. No new motion or visual layout was introduced.
