# Kana-Learn — A Japanese Study Notebook

A public, account-free Japanese learning platform: **208 kana + 2,759 kanji**, **19 notebooks**, **162 study decks**. English UI and dictionary meanings, warm paper and sakura-pink design, self-hosted Japanese fonts, light/dark mode.

## Architecture

Pinned kanji-data1.0.0 + local kana JSON + original curriculum → checked-in versioned content snapshots → Next.js Server Components / native Route Handlers → browser-owned learning and localStorage saves.

No Supabase, Elysia, PostgreSQL, Drizzle, runtime credentials or remote dictionary requests are required. Retired backend, UI, tests and migration files were removed during the pre-push cleanup. No remote Supabase resources were changed.

## Features

- Home, archive, notebook/set, deck, character detail, searchable catalog and printable notes.
- Hiragana/Katakana tables; kanji readings, meanings, available metadata, up to six dictionary word examples and explained related characters.
- Dedicated Flashcards/Quiz/Review rooms; three ratings; fixed10-minute/1-day/3-day review schedule.
- Mixed prompt quiz, up to20 unique questions, non-ambiguous distractors, immediate feedback and results.
- Refresh-safe active practice; one accepted response per position; last20 completed sessions.
- Local save slots, level/EXP, seen/known/mastered/accuracy, due cards, per-deck statistics, export/import previews and confirmed reset/delete.
- No learner accounts, cloud sync, service worker, audio, handwriting recognition or payment features.

## English JLPT resources

The JLPT hub imports all **7,811 vocabulary entries and 526 grammar points** from a pinned, attributed OpenJLPT snapshot (CC BY-SA 4.0), with English meanings, notes, formation, source examples and on-demand recognition drills. Five original AI-assisted reading exercises remain separately labelled, with English translations and exact answer evidence. These are complete source-snapshot imports, not a complete official JLPT syllabus. Listening, audio and full mock exams are held.

JLPT progress uses local IndexedDB under the existing learner slots. Version 2 backups include both character and JLPT progress (32 MiB import limit); version 1 character-only backups remain supported with their original 2 MB import limit. Historical question snapshots remain immutable. See [resource provenance](docs/jlpt-content.md) and [architecture](docs/jlpt-architecture.md).

`npm run jlpt:fetch` explicitly downloads the pinned source data and legal notices. `npm run jlpt:prepare` rebuilds the checked-in resource files without network access; `npm run jlpt:check` validates source coverage, checksums, schemas, references and generated drills. Ordinary builds never download or translate resources.

## Development

Node22.13+ through24.x, npm. CI uses22.22.0. Dependencies and resource package integrity are locked.

    npm ci
    npm run dev

Open http://localhost:3000. No environment file is needed.

    npm run resources:prepare
    npm run resources:check

Resource preparation is an explicit maintenance action. Normal build reads checked-in snapshots without accessing a dictionary service. See [resource updates](docs/resource-updates.md).

## Verification

    npm run check
    npm run test:browser
    npm run format:check

Check covers resources, frozen kana, learning/save contracts, APIs, frontend interactions/accessibility, lint, TypeScript, production build and HTTP smoke. Browser tests run against a production server on3210 and verify external-request absence, practice/resume, quiz/review, export/import, mobile navigation and theme screenshots. On Windows they use installed Chrome; elsewhere run npx playwright install --with-deps chromium first. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH optionally selects a browser executable.

## Data and privacy

Material IDs are stable. Progres­s uses the new kana-learn:sakura:v1 localStorage namespace; old keys are untouched and not migrated. Saves can be exported as versioned JSON; imports always create a new slot after validation/preview. Eight slots maximum;4MB overall serialized storage and2MB import limit. Browser quota/blocked/corrupt storage permits disclosed in-memory practice without overwriting existing invalid data. Export a backup before closing the page. Tabs synchronize best effort through storage events.

Correct responses and Almost/Got It ratings give1EXP. Mastered means100 correct responses per card, an app metric. Review uses the device clock. Offline resource preparation does not imply full offline browsing.

## Public content APIs

GET /api/catalog — revision, card summaries, sets, decks.
GET /api/cards/[id] — revision + detailed card.
GET /api/decks/[slug] — revision + deck + practice cards.

They are read-only and share the server repository with rendered pages. Unknown IDs return404. There are no progress-upload endpoints. The former /api/v1 routes are retired.

## Sources

Dictionary facts: James William Breen/EDRDG, kanjiapi.dev, kanji-data by Septian Ganendra S. K.; data attribution under CC BY-SA4.0/source terms, distinct from MIT software. Source revision/checksum and selection methodology appear on /sources. Original kana and curriculum are retained separately. The learning map uses48 source-matched topic introductions and66 clearly labelled reading trails, plus8 kana decks and40 JLPT decks. It is not an official JLPT syllabus.

[Implementation](implementation-plan.md) · [Design](design-system.md) · [Progress/evidence](docs/implementation-progress.md) · [REA comparison](docs/analysis/2026-10-25-kanjiflash/comparison.md)

JLPT follow-up: all2,211 source-listed N5–N1 kanji are included, with548 additional unassigned kanji. Explore `/jlpt`, card badges/detail links and the search level filter. The original cards, decks and saves remain compatible. See [card mapping](docs/jlpt-mapping.md).
