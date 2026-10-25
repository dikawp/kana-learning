# Sakura platform implementation

Authorized25 October2026, superseding the previous Supabase/Elysia plan.

## Product decisions

Next.js App Router remains. English UI/meanings; paper and sakura-pink identity. Account-free local progress starts afresh. All208 original kana identities/order remain;2759 kanji from pinned kanji-data1.0.0, including every character in its N5–N1 lists. Nineteen sets and162 decks:12/114 original kanji,2/8 kana and5/40 JLPT. The original2681 cards and original deck memberships are retained. Dictionary/runtime backend is file-based; no remote database or dictionary dependency during learning.

## Phases and acceptance

0. Baseline: preserve uncommitted work and historical specifications. Read installed Next documentation.
1. Resources: checked-in JSON kana and deterministic dictionary/curriculum snapshot. Verify2967 cards,19 sets,162 decks, unique IDs, membership/coverage, source words and checksums.
2. Backend: native Next read-only catalog/card/deck routes and shared server-only repository. Remove active Elysia/Drizzle/SQL code, dependencies, scripts and credential configuration. Remove obsolete source and migrations locally; do not mutate remote resources.
3. Catalog: home/archive/set/deck/card/search/table/print. Original48 keyword-supported introductions plus66 grade/frequency reading trails; complete coverage without falsely claiming thematic membership. Add /jlpt overview, five source-mapped level sets, card badges/detail links and level search filters;548 kanji remain explicitly unassigned.
4. Study: one engine for all kinds; flashcards, up-to20-question quiz, review; ratings, fixed10m/1d/3d intervals; unambiguous options; active snapshots, duplicate-response prevention and completion once.
5. Saves: new local namespace, slots, derived statistics/EXP/levels,100-correct mastery label,20-session history, export/import preview and confirmed deletion/reset. No implicit old-state migration or corrupted-data overwrite.
6. Design: paper/pink/plum tokens; self-hosted Japanese font; desktop rail, mobile drawer, dedicated focus room; primary learning CTA in first mobile viewport.
7. Verification: resources/domain/API/frontend/a11y/lint/types/build/production HTTP/browser tests; screenshots at1440×1000 and390×844, both themes; no dictionary/Supabase/progress-upload requests.

## Contracts and limits

Kana IDs remain h-/k- IDs; kanji IDs use kanji-<unicode hex>. Content is revisioned. Public APIs are /api/catalog, /api/cards/[id], /api/decks/[slug]; no write APIs. Snapshot sessions retain prompts/options/answers and chosen quiz option across refresh.

Topic definitions and explicit reading trails form the reproducible editorial policy; no KanjiFlash code, teaching copy, branding or deck memberships are copied. Source updates are deliberate, reviewed snapshot changes. Incomplete metadata stays absent; JLPT is approximate.

Prior implementation and obsolete archive were removed in the authorized pre-push cleanup. Deployment, remote project deletion, accounts, cloud sync, service workers, audio/handwriting/AI and subscriptions are outside scope. Actual verification results belong in docs/implementation-progress.md, rather than being inferred from this plan.
