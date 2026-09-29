# Main-site localization

This directory belongs to the published `kosheklov/readinMineCraft` main site,
not the separate diagnostic/beta prototype.

- English `/` is always the default; browser language does not redirect visitors.
- Spanish `/es/`, French `/fr/`, Russian `/ru/` are explicit, shareable routes.
- Each route contains fully rendered copy, metadata, words and reward names.
- Language changes during a session ask for confirmation before resetting it.
- The original Russian exercise bank, sprites and reward mechanics are preserved.

## Editing

`source.ru.template` is the original Russian HTML source. Update shared structure
there, translated copy in `messages.mjs`, and Spanish/French reading units in `words.mjs`.
English uses `phonics-en.mjs` (content), `english-game.js` (runtime), and
`english-page.mjs` (English-only markup and copy changes). See `PHONICS.md`.
Do not hand-edit generated `index.html` files.

Run `node localization/build.mjs` from the repository root. Commit the generated
HTML, manifests and sitemap with their source changes. GitHub Pages serves the
checked-in files; its deployment workflow and verification files are unchanged.
The build checks for untranslated Russian copy, duplicate words, incomplete
reward names, malformed reading units and insufficient words in a bank.

## Content limits

The three age bands and 30-word self-confirmed reading sessions remain in
Spanish, French and Russian, not as a validated placement assessment.
English instead has 14 skill-focused six-word practices, 84 words total, with
sound-spelling clues followed by whole-word reading. It has no age grading.
Spanish and French each have 90 authored words. Russian retains 108 words.
French reading units follow spoken syllables, keeping silent final e attached.
Native-speaking literacy specialists should review the new banks before making
claims about curriculum alignment or educational effectiveness. No such claims
are added by this change. No speech recognition or correctness assessment is
implied by the “I read it” button.

## Browser verification

With Playwright installed and its Chromium browser available:

1. Serve the repository: `python3 -m http.server 8768 --bind 127.0.0.1`.
2. Run `node localization/test.cjs`.
3. Run `node localization/phonics.test.mjs` (content constraints).
4. Run `node localization/test-phonics.cjs` (all 14 English practices).

`TEST_URL` overrides the server URL. `QA_DIR` overrides screenshot output.
Tests cover 1440, 1024, 768, 390 and 320 CSS-pixel widths, all four languages,
three complete sessions per language (six rewards in English, 30 elsewhere), restart, focus/age change, language
switching, cancellation, reload, metadata, asset loading and visible actions.
Analytics requests are blocked in tests to avoid polluting real visitor data.
