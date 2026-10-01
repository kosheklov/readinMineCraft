# Project Instructions

## Project

This repository is the active home of the Reading Craft Kids landing page and reading trainer, migrated from `/Users/khursanoff/Documents/Заплатка/readinMineCraft` on 2026-09-15.

Treat the files in this repository as the current project truth. Do not modify the former source project unless the user explicitly asks.

## Required Startup Context

Before changing the landing page, read:

1. `PRODUCT.md` for audience, positioning, constraints, evidence, and product principles.
2. `.impeccable/direction-options.json` for explored visual directions and their tradeoffs.
3. `.impeccable/build/state.json` for the current implementation phase and open quality gates.
4. The relevant prompt, comp, spec, crop, or review artifact under `.impeccable/` when working on its corresponding area.

Current approved composition: `.impeccable/mocks/decision/quiet-game-studio.webp` («Спокойная игровая студия»).

Current build status: the spec and plate phases are closed; the hero phase is open. The latest recorded hero comparison is contradicted and must not be treated as approved or finished.

Current product status: the app prototype on `codex/dev-mvp` is a visual experiment and was not approved as the product direction. Do not extend its map, rewards, economy, or game surfaces until the learning model is validated. The active product truth is the 5–7-year-old segment in `PRODUCT.md`; the skill ladder, four canonical exercise mechanics, and placement flow are defined in `LEARNING_MODEL.md`.

## Landing Workflow

Always use the installed `landing-production-workflow` skill for landing-page planning, design, implementation, audit, animation, and shipping.

Use these installed supporting skills when their scope applies:

- `design-taste-frontend` for visual direction and design judgment.
- `impeccable` for the comp-first workflow and the final quality gate.
- The relevant official `gsap-*` skills for motion; include performance and reduced-motion handling.
- `imagegen` when new raster artwork or edits to raster artwork are required.

Do not skip composition approval or replace the approved composition without explicit user approval. Keep product claims grounded in `PRODUCT.md`; do not invent reviews, research, outcomes, store links, or legal claims.

## Implementation Guardrails

- Preserve the working reading trainer while adapting the landing experience.
- Keep the age choice as the first clear action for the parent.
- Treat mobile as its own composition and verify representative desktop and mobile widths.
- Keep keyboard focus, contrast, large reading text, and `prefers-reduced-motion` support.
- Preserve deployment and discovery files unless the task explicitly changes hosting or SEO: `.github/workflows/pages.yml`, `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, and the Yandex verification file.
- Project access is available for Yandex Metrica, the GitHub repository/deployment, and Yandex Webmaster. Treat credentials as external secrets and never write them into the repository.
- Never use skills whose names start with `stefania-` in this project.

## SEO: обязательная проверка каждого коммита

- Перед каждым коммитом и публикацией оценивать влияние изменения на SEO. В описании фиксировать результат проверки или конкретную причину, почему изменение не влияет на индексируемые страницы.
- Сохранять доступность опубликованных URL, HTTP 200, уникальные title и description, корректные canonical, языковые hreflang, семантические заголовки и обычные HTML-ссылки между страницами. Не заменять индексируемый контент изображением или контентом, доступным только после взаимодействия.
- Не добавлять noindex, запреты robots.txt, неверные canonical, редиректы или удаление URL без явного решения владельца. Для переносов сохранять маршрут миграции и проверять ссылки.
- При создании публичных учебных страниц развивать SEO: понятное описание назначения, уникальные метаданные, ссылка из подходящего раздела, запись в sitemap. Не создавать поисковые дубли для ежедневных наборов, тем призов и параметров интерфейса.
- Перед публикацией запускать `node scripts/check-seo.mjs`; после публикации проверять затронутые URL, robots.txt, sitemap.xml и отсутствие запрещающих HTTP-заголовков. Даты lastmod менять только при содержательном обновлении соответствующей страницы.
- При изменении адресов или индексируемого содержания обновлять sitemap и при необходимости отправлять его/страницы через Яндекс Вебмастер и Google Search Console. Принятие заявки не считать подтверждением индексации.
- Развивать SEO через полезный учебный контент и удобную навигацию; не добавлять вымышленные результаты, отзывы, переспам, скрытый текст или неподтверждённые методические обещания.

## Source History

The former repository had four local commits beyond `origin/main`, and its working tree also contained uncommitted landing redesign artifacts. This migration intentionally copied the complete working tree but not the former `.git` directory, so this repository has independent history.
