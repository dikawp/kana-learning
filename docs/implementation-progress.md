# Sakura redesign — implementation evidence

25 October 2026 (Asia/Jakarta). This record supersedes the prior Supabase/Elysia progress direction. Retired source/tests were initially archived; the later authorized pre-push cleanup removed that obsolete archive.

## Completed phases

| Phase            | Outcome                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Baseline     | Frozen kana baseline passed before changes; existing UI primitives retained; retired backend, tests and UI edits archived without deletion. Installed Next16.4.2 routing/Route Handler/static-params documentation read.                                                                          |
| 1 — Resources    | Pinned kanji-data1.0.0, original208-kana JSON, deterministic2681-kanji selection;2889 cards,14 sets,122 decks; revision f1e4c122396c5e6b701f1b3156c1f377128df876660373a166f2b4804b3f3d4d.                                                                                                         |
| 2 — Backend      | Server-only snapshot repository, native GET catalog/card/deck handlers and prerendered content pages. SQL/Elysia/Drizzle/PGlite dependencies, active DB code/scripts/config removed from runtime. Retired credentials no longer assigned in local environment. No remote project or data changed. |
| 3 — Catalog      | Home/archive/set/deck/card/search, kana tables, print stylesheet and source-backed related cards. Twelve kanji sets/114 decks plus two kana sets/eight decks.                                                                                                                                     |
| 4 — Learning     | Shared Flashcards/Quiz/Review engine, fixed10m/1d/3d schedule, unique/non-ambiguous options, rating feedback, snapshots including quiz choices, refresh resume and duplicate-transition guards.                                                                                                   |
| 5 — Saves        | New browser namespace, local slots, EXP/levels, derived statistics,20-run history, validated import preview to new slot, export, confirmed reset/delete and disclosed memory-only fallback. Unknown card/deck imports rejected.                                                                   |
| 6 — Design       | Paper/pink/sakura light mode, plum dark mode, self-hosted Japanese font, desktop rail/mobile Radix drawer, focus practice room. Existing accessible primitive improvements retained.                                                                                                              |
| 7 — Verification | Final resource/native/domain/frontend/lint/typecheck/build/HTTP gate passed; final Chrome Playwright flow and light/dark axe audit passed; screenshots inspected. No deployment.                                                                                                                  |

## Actual checks

- npm run check: PASS on final resource/source revision.
- Frozen kana:1 test passed,208 stable IDs/glyphs/scripts/order.
- Domain/API:13 tests passed, including interval boundaries, invalid saves, unknown catalogs, idempotent responses/completion, distractor ambiguity,20-run retention and local public APIs.
- Frontend:1 integrated test passed, including answer/resume, axe serious/critical checks, slot switching/rename, canceled reset, legacy-key retention, quota failure and invalid cross-tab data.
- npm run test:browser:1 production Chrome test passed (final run14.3s total). Practice/resume→quiz completion→review→dashboard→export/import; same statistics after import; search/detail; mobile drawer Escape/focus; first-viewport CTA; no page errors, external requests or horizontal overflow on tested detail.
- Browser axe: no WCAG2A/2AA/2.1AA violations reported on tested home light/dark states. This is not a complete WCAG conformance claim.
- Production build:6167 static outputs; practice routes server-rendered for known decks; no credential dependency.
- Production HTTP smoke: public pages and APIs200, invalid IDs404, retired /api/v1 and /account404.
- npm audit --omit=dev:0 vulnerabilities. Initial Zod advisory addressed by upgrading to4.6.7.
- Compiled browser JS search found no kanji-data filesystem loader markers. Browser network audit found only loopback application requests during the flow.

## Content review and artifacts

The active map has48 topic introductions with hand-selected starting characters plus whole-word source-backed expansions,66 explicitly labelled reading trails, and8 kana decks. Reviewed the starting-character selections across all48 topics; exact samples are in [topic-review.json](analysis/2026-10-25-sakura/topic-review.json). All deck sizes, memberships, source vocabulary and coverage validated automatically.

This is transparent rule-based curation with original editorial anchors, not a claim that every dictionary gloss has been independently reviewed by a language teacher. Polysemous characters can appear through related word meanings; reading trails deliberately broaden coverage beyond themes.

Prepared detailed cards are approximately2.31MB and catalog approximately514KB; the approximately97MB acquisition package is dev-only. Normal build reads snapshots, and no runtime dictionary request is made.

[Visual review](analysis/2026-10-25-sakura/verification.md) · [Resource updates](resource-updates.md).

## Practical limits

Saves remain browser-local; clearing site data loses access unless exported. Storage events are best effort across tabs. Eight slots,4MB serialized save and2MB import limits. Blocked/full/invalid storage uses memory without silently overwriting existing invalid records. Review uses the device clock, with simple fixed intervals and100-correct mastery metric. No account/cloud backup, service worker, audio, handwriting, AI, payments, remote DB deletion or deployment.

## Romaji follow-up — 25 October 2026

Added local WanaKana5.3.1 transliteration below kanji on/kun/name readings, word readings, and flashcard/review reveals. Search accepts derived Romaji. Original dictionary snapshots, source reading order, quiz answers and save schema are unchanged. Source dots/hyphens remain; compound Romaji uses the complete word reading.

Validation: npm run check passed (28 native/domain/frontend tests, lint, types, production build and HTTP smoke); production Playwright passed with assertions for kanji/word Romaji, plus the existing practice/backup/theme/accessibility flow. Public API documentation provides kana readings without a Romaji field; UI labels are derived locally rather than presented as upstream data.

## JLPT coverage and card mapping — 25 October 2026

Added78 missing N1 characters. Total:2759 kanji +208 kana =2967 cards,19 sets,162 decks. The exact pinned source lists are covered: N5=79, N4=166, N3=367, N2=367, N1=1232;548 kanji remain unassigned. Forty dedicated level decks provide complete practice coverage. Original card IDs and all122 original deck memberships are retained, checked against content/catalog-baseline-v1.json.

Card summaries/details expose the same jlpt mapping, grids show approximate level badges, details link to level sets and search filters by level/unassigned. /jlpt shows coverage. At the user’s request, the separate “03 — JLPT study paths” sidebar section was removed from desktop and mobile; card mapping remains available. See [JLPT mapping](jlpt-mapping.md).

Validation: npm run check passed, including36 native/domain/frontend tests, lint, types, production build (6449 static outputs) and HTTP smoke. Two production browser tests passed: existing practice/save/backup/light-dark/mobile flow and new JLPT overview → filter → new N1 card → deck → flashcard → refresh. Axe reported no violations in the tested JLPT overview. A test locator initially used “Reveal answer”; corrected it to the existing “Show answer” button and reran successfully. Explicit regeneration produced the same revision39784f0006ce45b4417f244cf6466825a9d9aecb2218c7b4cd17ccac5817db14.

After the requested sidebar removal, production build and both browser tests passed again. The running preview at http://127.0.0.1:3000 serves the final navigation.

Removed the JLPT source-coverage table and caption at the user’s request. Updated the existing browser flow to navigate through the N1 set tile. Targeted lint, production build and JLPT browser flow passed; prerendered HTML contains no table.

## Pre-push cleanup — 25 October 2026

Removed unused source/configuration, legacy backend/UI archive and dependencies. Consolidated duplicate wrappers/helpers, cleaned retired CSS, constrained Tailwind source scanning and added formatting/unused-symbol checks. See [cleanup audit](cleanup-audit.md) for scope and verification.
