# Kana Learning implementation plan

Revised 18 October 2026 (Asia/Jakarta). C1–C6 from the user's checkpoint prompts govern execution. This revision supersedes the original P0/phase sequence and all legacy migration/recovery/compatibility and manual QA requirements. Historical P0-A/P0-S outcomes remain in docs/implementation-progress.md and Git commits.

## 1. Product goal and current scope

Build an English-language Japanese learning platform: kana, kanji and vocabulary across N5–N1, then grammar, reading, listening and section-based practice. Import English meanings; Indonesian translation is excluded. First product release targets a coherent curated N5 kana/kanji/vocabulary learning loop, not exhaustive JLPT examination preparation or importing 13,000+ kanji.

There are no users. Clean redesign, new storage keys, breaking internal contracts and fresh account state are acceptable. Remove guest/account migration, progress export, backup/restore rehearsals, old-origin transfer and backward-compatibility adapters. Future accounts start independently; no synthetic historical reviews or mastery.

Excluded: AI companion, subscriptions, offline synchronization and handwriting recognition. C1 delivered frontend stabilization; C2 now authorizes the account/backend slice below. Dictionary imports and later learning modules remain proposals, not authorization to build them. C3–C6 details are not supplied yet. No production changes, deployment, backup/restore rehearsals or manual QA.

## 2. Evidence and starting repository

Original investigation was at 9bf0c96 (17 October 2026). Historical live observations included version 0.1.1, 208 entries, Flashcard/Quiz/Table modes, persistent binary learned IDs, transient quiz score and a search exception. The deployment SHA was unverified. Those observations are historical evidence, not a requirement for further browser inspection.

P0-A commit a997c36 added the frozen 208-entry fixture, workflow and read-only export tests/page. C1 retains the useful kana fixture and removes obsolete export/recovery code/tests. P0-S commit 805f6f3 already upgraded Next 14 to 16.4.2, reconciled npm, patched audit findings and configured ESLint/typecheck. Reuse that work.

C1 starting tree: untracked implementation-plan.md only. No applicable AGENTS.md found in repo/checked ancestors. Baseline Node 22.22.0/npm 10.9.4; Next 16.4.2; React 18.3.1. Native tests 21 passed. Lint has 10 actual findings; typecheck fails on nonexistent KanaCharacter.pronunciation. Build previously bypassed types. Current execution evidence belongs in the progress log.

## 3. Existing code and flow to evolve

| Existing path | Responsibility and C1 action |
| --- | --- |
| app/page.tsx | Single client page and three Radix tabs. Remove blank mounted gate, type mode changes, use semantic main and status output. |
| app/layout.tsx; components/theme-provider.tsx | Geist, English document and next-themes class/system provider. Keep shell/provider. |
| lib/kana-data.ts; types/kana.ts | 208 records / 104 per script; id, character, romanji, type, category. Rename to romaji directly and validate shape. Preserve useful fixture; no compatibility adapter. |
| hooks/use-kana-filters.ts | Script/group/query state. Invalid pronunciation access crashes search. Extract testable normalized filter predicate. |
| components/kana/flashcard-mode.tsx | Index/reveal wraps over filtered pool; stale index on shrink. Reset child session by pool identity so reveal/index never cross pools. |
| hooks/use-kana-progress.ts | Unguarded mount JSON read plus initial empty write, unknown-ID inflation, in-memory score. Replace with clean validated local store, SSR snapshot, guarded storage access, explicit ephemeral/error status and cross-tab replacement semantics. |
| components/kana/quiz-mode.tsx | Random-comparator sampling, unguarded timer, zero-pool playing state, client results. Extract pure generator/results; simplify to explicit answer/Next transitions, preventing stale timers and duplicate submissions. |
| components/kana/filters-card.tsx; table-view.tsx | Grouped two-column tables, script/group controls, explicit no-results. Label controls/headers and Japanese text; clarify quiz uses its own scope. |
| components/kana/progress-card.tsx | Percentages, reset dialogs and session score. Remove export link; label binary familiarity separately from long-term mastery and identify session-only scores. |
| components/layout/header.tsx | Hardcoded version and unresolved theme toggle. Use resolvedTheme, deterministic hydration shell and accessible theme name. |
| components/ui/; hooks/use-mobile.ts; hooks/use-toast.ts | Existing primitives. Resolve real lint/type compatibility defects; consolidate duplicate hooks without changing unrelated UI APIs. |
| next.config.mjs; package.json; package-lock.json | npm-only locked installation; restore typechecking build safety and strict aggregate quality gate. |
| tests/fixtures/kana-baseline-v1.json | Verified P0-A data fixture. Reuse, do not regenerate to hide failures. |

Data flow: bundled kana → filter hook → flashcards/table; full dataset → quiz's separately labelled script/count setup. Reveal + Got it and correct quiz answers update a binary familiarity set. It is not SRS or mastery. Quiz score is explicitly session-only in C1; durable sessions belong to a later authorized checkpoint. Guest storage uses a clean versioned snapshot, no reading/conversion of old keys. Failed storage must allow safe in-memory use and disclose persistence limitations. Validate shape, deduplicate and exclude unknown IDs; never write on initial render or merely reading state. Cross-tab policy is latest validated snapshot replacement, including resets; no union that resurrects reset entries. Simultaneous localStorage writes are best effort, not transactional synchronization.

The C1 starting implementation had no backend. C2 adds the concrete modules in section 9 and docs/backend-setup.md; imported kanji/vocabulary and SRS remain future scope. No current code/deployment identity equivalence is assumed.

## 4. Architecture and C2 account foundation

Retain Next App Router and UI primitives. C2 implements Elysia in app/api/[[...slugs]]/route.ts using app.fetch, runtime=nodejs, no listener. Supabase PostgreSQL/Auth with Drizzle is the account foundation; environment credentials are not fabricated. External dictionary APIs remain future ingestion/update inputs; normal account kana study reads the seeded PostgreSQL content.

A separate Elysia Vercel project permits independent releases/clients but adds CORS, cookies/token forwarding, shared-contract versioning and preview coordination. This repository has one frontend and no demonstrated need for that cost. Keep domain services separate internally to allow later extraction. Bun is optional, not required.

Supabase Auth issues/verifies identity; PostgreSQL/Drizzle persists relational content/progress; Storage serves licensed SVG/audio when needed; Elysia validates, authorizes, grades and schedules. Owner/service SQL connections can bypass RLS: always verify identity and scope personal queries by profile, use minimum runtime privileges, and test the actual SQL role. Do not assume Auth identity reaches arbitrary Drizzle SQL. Use transaction-local claims if adding non-bypass RLS defense; separate job/schema credentials from runtime.

Use Supabase transaction pooler/Postgres.js with bounded module-scoped connections, prepare:false, statement timeouts and same-region API/database. Neon alternative: Drizzle neon-http for noninteractive reads/batches, WebSocket Pool/Client for interactive review transactions; choose Auth explicitly (managed Supabase Auth is a candidate), and avoid extra providers without need. No Redis/worker/queue until workload justifies it. Imports use dedicated scripts/job workflows.

Stateless API requests use durable database state; public content has capped cursor pagination, release-aware cache keys/indexes, private responses no-store. Review grading/scheduling is server-owned with unique submission IDs, transactions and optimistic versions. Assets live in static/object storage with source/license metadata. Development/preview/production credentials and Auth/media are separated; reset only designated disposable databases. No provisioning, push or deployment under C1.

Official references: [Next upgrade](https://nextjs.org/docs/app/guides/upgrading/version-16), [support policy](https://nextjs.org/support-policy), [Node release policy](https://nodejs.org/en/about/previous-releases), [React 19](https://react.dev/blog/2024/12/05/react-19), [Elysia Next](https://elysiajs.com/integrations/nextjs), [Elysia Vercel](https://elysiajs.com/integrations/vercel), [Vercel runtime](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Supabase Drizzle](https://supabase.com/docs/guides/database/drizzle), [pooling](https://supabase.com/docs/guides/database/connecting-to-postgres), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Neon driver](https://neon.com/docs/serverless/serverless-driver), [Drizzle Neon](https://orm.drizzle.team/docs/connect-neon).

## 5. Gap analysis and release boundary

| Existing capability | Target / dependency |
| --- | --- |
| Kana search/filter/three modes | C1 stabilization first; typed/confusing-character practice later. |
| Binary local familiarity | Safe independent guest storage in C1; future accounts begin fresh. |
| Client-only quiz | C1 deterministic generation, duplicate protection, explicit transitions and empty states; server grading/durable sessions later. |
| No kanji/vocabulary | Licensed pinned dictionaries, validated imports and a curated N5 manifest. |
| Dataset order, no curriculum/SRS | Ordered lessons, resume/goals, per-skill cards, due queues, mistakes/statistics; FSRS candidate. |
| No content operations | Separate source reference data, editorial corrections, approved lesson targets and atomic publication. |
| No advanced modules | Grammar, graded reading/furigana/lookup, licensed listening/transcripts, section results after N5 foundation. |

The N5 release requires the curated course and actual lesson → practice → feedback → scheduled review loop, source attribution, auth ownership/idempotency and automated integration evidence. Reference dictionaries alone are not a curriculum. C2 covers account persistence/server grading; later checkpoint allocation awaits C3–C6 prompts.

## 6. Content sources and ingestion

### 6.1 Source decisions and verified formats

| Source | Verified contract / limitation | Proposed role |
| --- | --- | --- |
| [kanjiapi.dev](https://kanjiapi.dev/) and [original repository](https://github.com/onlyskin/kanjiapi.dev) | `/v1/kanji/all` is an array of character strings. `/v1/kanji/{character}` is a detail object. School-grade lists and JLPT lists are separate endpoints. Lists do not contain meanings/readings by themselves. | Small diagnostic/enrichment reads and level mapping acquisition during ingestion. Prefer a pinned bulk dictionary for initial reference import. |
| [KANJIDIC2 project](https://www.edrdg.org/wiki/KANJIDIC_Project.html) | UTF-8 XML: `character/literal`, `codepoint`, `radical`, `misc`, `reading_meaning`; multiple readings/meanings and possible variant/stroke-count entries. `misc/jlpt` is legacy pre-2010 1–4. | Bulk kanji reference truth for English meanings, on/kun/nanori readings, strokes and dictionary radicals. Preserve original data alongside normalized records. |
| [JMdict original project](https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html) | XML entries preserve written forms, readings, senses, restrictions and tags; English-only distributions exist. XML entity/DTD handling and inherited sense information require a real adapter. No modern JLPT curriculum is supplied. | Vocabulary reference source, not lesson order or automatic N5 selection. |
| [jmdict-simplified](https://github.com/scriptin/jmdict-simplified) | Prebuilt JSON, English `eng` JMdict / `en` Kanjidic variants, full/common variants, generally arrays instead of missing/null values. Scheduled weekly releases; example distribution lacks complete helper-package support. | Preferred MVP transport for JMdict; potentially KANJIDIC2 JSON too, using the same source provenance rather than treating conversion as a new dictionary authority. |
| [KanjiVG](https://kanjivg.tagaini.net/) | Per-character SVG with ordered stroke paths and component groups; [format](https://kanjivg.tagaini.net/svg-format.html) carries `kvg:element`, radical/position/variant information. Coverage/metadata are not guaranteed for every target. | Pinned stroke assets, animation and sourced components. A component decomposition is not automatically an etymological explanation. |
| [Tatoeba exports](https://tatoeba.org/en/downloads) | Sentence/link exports are tab-separated; sentence IDs and translation links are distinct; text and audio have different reuse rules. Weekly snapshots; Japanese-English pairs still need contextual/editorial checking. | Import a bounded example candidate set, then curate links to the intended vocabulary sense/lesson. Do not render arbitrary matching sentences as teaching examples. |

The [kanjiapi generator](https://raw.githubusercontent.com/onlyskin/kanjiapi.dev/master/kanjiapi/api_data.py) defines `kanji`, `grade`, `stroke_count`, `alternate_stroke_counts`, `meanings[]`, `on_readings[]`, `kun_readings[]`, `name_readings[]`, `jlpt`, `freq_mainichi_shinbun`, `unicode`, `heisig_en`, and `notes[]`; a compatibility-variant field is conditional. Grade/JLPT/frequency/keyword can be absent or null in an adapter's supported versions. Validate integer ranges and arrays, retain multiple readings and order, and represent unknowns as unknowns rather than zero or fabricated English. Do not rely on Heisig keywords as required pedagogical content.

The current [kanjiapi changelog](https://github.com/onlyskin/kanjiapi.dev/blob/master/CHANGELOG.md) explicitly changes `jlpt` from KANJIDIC's legacy levels to Jonathan Waller's five-level mappings and adds `/v1/kanji/jlpt-1` through `/v1/kanji/jlpt-5`. Its [level loader](https://raw.githubusercontent.com/onlyskin/kanjiapi.dev/master/kanjiapi/jlpt.py) reads a [five-row TSV](https://raw.githubusercontent.com/onlyskin/kanjiapi.dev/master/jlpt.tsv). Therefore, **do not describe the current API field as necessarily legacy**, and do not relabel old KANJIDIC levels as if they were the same dataset. Save source revision and taxonomy (`jlpt-current-approx` or `jlpt-pre2010`) on every assignment. Deployment payload fixtures must check these expectations before importing.

Modern mappings remain approximations: the [JLPT organizers](https://www.jlpt.jp/sp/e/faq/) explain that fixed vocabulary/kanji/grammar specifications are no longer published. Old level 4 roughly corresponds to N5, old 3 to N4, and old 2 spans N3/N2, but that is not a valid automatic item-by-item conversion. Preserve legacy labels without forcing a modern assignment. Record disagreements, evidence and editorial selection. **Never infer a vocabulary level solely from its component kanji.**

Vocabulary level acquisition is a release gate: evaluate [Waller's original JLPT resources](https://www.tanos.co.uk/jlpt/) (not accessible during this investigation) or another documented reusable mapping, retain entry-level evidence, and resolve ambiguous written-form/reading/sense matches manually. Mapping availability on an API does not establish original redistribution permission. If no reusable vocabulary mapping is approved, editors must author a documented N5 course manifest with item-level references and an explicit approximate-level methodology; do not advertise a sourced exhaustive list. Reference dictionary imports can proceed into staging while this is resolved.

**JSON adapter contract.** Inspected [JMdict root types](https://scriptin.github.io/jmdict-simplified/interfaces/JMdict.html) include `version` (converter format), `dictDate`, `dictRevisions`, `languages`, `commonOnly`, `tags`, and `words`. [Entries](https://scriptin.github.io/jmdict-simplified/types/JMdictWord.html) have string `id`, `kanji[]`, `kana[]`, and `sense[]`; kana-only words can have no kanji forms. [Readings](https://scriptin.github.io/jmdict-simplified/types/JMdictKana.html) have `text`, `common`, `tags`, and `appliesToKanji`: `['*']` means all, `[]` means none, and named spellings restrict applicability. [Senses](https://scriptin.github.io/jmdict-simplified/types/JMdictSense.html) include glosses, POS, form/reading applicability, cross-references and usage metadata. Normalize allowed relationships explicitly; do not produce a Cartesian product of all forms/readings/senses.

The inspected [release snapshot](https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2+20261012204142) is converter 3.6.2 dated 2026-10-12. Its Kanjidic counts differ between all-language and English-only distributions (13,108 versus 10,384), so do not assume the English subset covers every character. Pin an immutable release and asset checksum during implementation; select all-language kanji input with English gloss filtering if coverage requires it. “Common” is a useful candidate filter, not a JLPT level, and the common-only vocabulary distribution must not silently omit curated course entries.

Original KANJIDIC2/XML is the fallback when a JSON converter lacks needed fields. Download the published XML/DTD from the original project links, record header versions and checksums, stream-parse with trusted bundled entity definitions and external network entity resolution disabled. Accept multiple/empty on/kun/nanori readings, default-language English meanings, alternate strokes, variants and missing JLPT. Pin supported schemas and quarantine unsupported revisions instead of silently flattening them. Exact archive payload validation awaits an authorized content checkpoint.

### 6.2 Canonical text, romaji, and furigana

Kana readings are canonical. Store raw dictionary reading annotations and a separately parsed searchable/romanizable reading: KANJIDIC okurigana dots, leading/trailing hyphens and metadata are not normal syllables. Never romanize an ideograph directly or guess its reading from constituent characters.

Proposed romanization policy: lowercase, Hepburn-style display via pinned [WanaKana](https://wanakana.com/) with a tested configuration/wrapper; `shi/chi/tsu/fu`, `ji/zu` as display defaults for `ぢ/づ`, and `wo` for isolated `を`. C1 retains current `dji/dzu` display values while renaming the field to `romaji`; any later romanization policy change must resolve duplicate accepted answers explicitly, without a legacy adapter. Use apostrophes where needed for syllabic `n`; preserve distinguishable long vowels in the generated kana transliteration, without silently discarding length. Avoid claiming a kana converter handles particle pronunciation or every scholarly Hepburn convention. Write golden fixtures for `ん`, `きゃ`, `っ`, `ー`, `おう`, `おお`, loanwords, annotated readings, and romanization cases. Store converter version/policy version on cached derivations; regenerate derived romaji without changing material IDs.

Answer normalization is exercise-specific: trim whitespace, normalize full/half-width input where appropriate, and optionally map katakana/hiragana for reading exercises; do not erase meaningful small-kana/voicing/long-vowel distinctions. Romaji aliases may be accepted for introductory kana exercises; vocabulary reading practice should default to kana. English meaning exercises initially use curated accepted strings or multiple choice rather than treating arbitrary dictionary prose/fuzzy similarity as a reliable grading rubric. Display all applicable senses, but grade the targeted sense/context.

Furigana is a **separate form–reading alignment** problem. Store reviewed segments such as `{surface, reading|null}` for a particular valid spelling/reading pair, render with `<ruby><rt>`, and support whole-word ruby for irregular readings such as `今日/きょう`. Compound readings cannot be assembled by concatenating each kanji's readings. Proposed MVP uses editorial alignment with an assisted alignment tool only after its dataset/license is evaluated. Keep original written form/reading, alignment method/version and approval status; on uncertainty show the complete reading, not misleading per-character ruby. Sentence furigana additionally needs token boundaries and context-sensitive reading selection in the later reading phase.

### 6.3 Import and publication workflow

All modules in this workflow are **proposed**, not current repository paths: `scripts/imports/{kana,kanjidic,jmdict,kanjivg,tatoeba}.ts`, `scripts/imports/runner.ts`, `server/content/adapters/`, `server/content/validation.ts`, `server/content/publish.ts`, `content/curricula/n5.json`, and `tests/fixtures/content/`.

1. **Register source and snapshot.** Record original creator/URL, transport URL, dataset/converter versions, license/attribution, source date, fetch time, checksum, adapter revision and intended scope. Pin URLs/release identifiers; do not run a moving `latest` URL blindly in production. Save immutable compressed raw snapshots in administrative object storage outside the application bundle.
2. **Initial bulk acquisition.** Seed all existing 208 kana with their existing IDs. Bulk-stream a pinned English vocabulary distribution and KANJIDIC2 source; select curated N5 entries and required relations for publication. It is acceptable to stage the reference archive broadly, but loading every kanji into the public course/database is not an MVP gate. Import reference stubs for non-course kanji required by vocabulary relations without assigning them lessons or review cards.
3. **Validate before normalization.** Check file signature/size/checksum/schema, declared counts, required strings, allowed language tags, reading applicability and source IDs. Handle empty arrays/null optional fields explicitly. Quarantine malformed records with source ID and error; preserve unknown fields in raw JSON. Compare counts to the previous snapshot and stop on suspicious mass loss (initial proposed threshold 5%, adjustable with an explicit reviewed override).
4. **Normalize into staging.** Keep source spelling/codepoints, annotations, sense order and provenance. Derive search keys separately. Do not NFKC-collapse kanji compatibility variants or overwrite their identities; relate variants explicitly. Use stable IDs below and content hashes to skip unchanged records. Exclude non-English glosses from public meaning views, without translating them.
5. **Idempotent chunked upsert.** Upsert by `(source_id, external_id)` and stable local child identities; never regenerate primary keys on each run. Commit bounded batches and checkpoint source checksum/last completed partition. Persist run status/counts/error samples/retries. Retry transient 429/5xx/timeouts with bounded exponential backoff/jitter and `Retry-After`; permanent schema/permission errors fail visibly. A resumed run must match the original input checksum. Use a database advisory lock per source to prevent overlapping imports.
6. **Editorial diff and curriculum.** Present added/changed/retired records, unresolved relations, licensing gaps, and affected lesson/card targets. Maintain original reference values separately from versioned editorial overrides and field locks. Upstream changes raise conflicts on overridden fields; they never silently overwrite corrections. Editors curate senses, examples, order and level evidence in `n5.json`/admin UI; dictionary frequency/source order is not a teaching sequence.
7. **Publish atomically.** Build a validated immutable content release, require all selected lesson items/answers/media rights and relations to pass checks, then transactionally switch the active release pointer. Read APIs use that release. Do not expose partially imported batches. Admin author/importer and publisher roles have audited permissions. Initial importer is a CLI/CI workflow; admin UI lists runs and stages publication, rather than executing a long import in a web request.
8. **Keep identity and history.** Retired upstream entries become tombstones/unpublished records; do not cascade-delete material/cards/user history. Record splits/merges and stable redirects; require editorial mapping where a sense changed materially. Existing quiz answers retain their prompt/accepted-answer revision. Preserve schedules for compatible corrections; flag/reintroduce only affected cards after a reviewed pedagogical change.
9. **Updates and failures.** Check the JSON release feed weekly; ingest reviewed changes promptly and ensure dictionary updates occur at least monthly. EDRDG's [reuse statement, section 4](https://www.edrdg.org/edrdg/licence.html) explicitly requires regular updating and gives monthly web-dictionary updates as an example. Monitor source age and failed jobs; assign an operator and escalate before the monthly threshold. Check KanjiVG releases and Tatoeba snapshots monthly initially. Preserve the last published content when upstream is unavailable, retry, record the outage, and resolve prolonged freshness/permission issues rather than deleting content or claiming permanent license compliance despite stale data.

### 6.4 Reuse and attribution

Maintain proposed `docs/content-sources.md`, packaged license notices, a public `/sources` screen, per-material provenance links and a visible attribution footer on dictionary displays. The repository's MIT `LICENSE` covers its software; it does not replace imported data/media obligations.

- **EDRDG JMdict/KANJIDIC2:** [CC BY-SA 4.0 and the original reuse statement](https://www.edrdg.org/edrdg/licence.html). Attribute EDRDG/Jim Breen and contributors as specified, link documentation/licenses, identify modifications, preserve required notices and apply appropriate share-alike terms to distributed adapted dictionary data. Review special field notices before importing extra dictionary indices. Avoid claiming copyright over original dictionary data. Software using the files need not itself be open source under those terms.
- **jmdict-simplified:** conversion does not remove dictionary rights. Its helper npm packages have MIT software licensing; generated dictionaries retain the applicable source license. Keep source and converter attribution separately.
- **kanjiapi:** MIT server code is distinct from the dictionaries and third-party level/keyword data it serves. Verify each imported field's origin and redistribution terms, especially mappings and optional keywords.
- **KanjiVG:** [CC BY-SA 3.0, Ulrich Apel](https://kanjivg.tagaini.net/). Keep asset attribution/license/change notices on sanitized/animated derivatives; do not relabel them MIT. Test path/group data before stripping any metadata.
- **Tatoeba:** text exports describe CC BY 2.0 FR and a CC0 subset. Store sentence ID, contributor/attribution URL and applicable text license. Audio metadata supplies its own author/license/attribution URL; an empty license forbids external reuse. Text permission does not grant audio permission. Exclude audio lacking explicit compatible rights. Editors can author original examples as a bounded alternative with recorded ownership/reuse permission.

Rights approval is a publication gate, particularly for level lists, furigana helpers, recorded audio and future exam-style materials. Use original practice questions; linking official JLPT samples does not grant permission to copy them into the platform.

## 7. Proposed relational data model

Everything in this section is proposed. Use PostgreSQL UUIDs for internal entities, `timestamptz` in UTC for events/due dates, and text source keys (do not depend on JavaScript numeric precision). Define Drizzle schemas in proposed `server/db/schema/`; use explicit SQL for checks/partial indexes/triggers. Store reference payload JSONB for traceability, not as a substitute for relational joins needed by learning flows.

### 7.1 Identity, provenance, and material integrity

| Entity | Keys, relationships, important data |
| --- | --- |
| `profiles` | `id` PK/FK to Supabase `auth.users.id`; target level N5–N1, timezone, daily new/review goals, display preferences, timestamps. Personal authorization always uses this ID. Provider-neutral code resolves a profile from verified identity; Neon alternative can use unique `(auth_issuer, auth_subject)` mapping. |
| `profile_roles` | PK `(profile_id, role)`; editor/publisher/import operator roles. Not client-editable profile metadata. Audit role changes. |
| `content_sources` | UUID PK, unique source slug, original/transport URLs, creator, license ID/URL, attribution, update policy. |
| `source_snapshots` | UUID PK, source FK, source date, dataset/converter/schema versions, checksum/raw-object key; unique `(source_id, checksum)`. |
| `import_runs` / `import_checkpoints` | Source/snapshot FKs, adapter version, scope, status, counts/errors, cursor, started/finished times; unique checkpoint per run/partition. Resume is tied to the snapshot. |
| `materials` | UUID PK, immutable unique `stable_key`, `kind` (`kana`, `kanji`, `vocabulary`, later others), lifecycle/tombstone timestamps. Unique `(id, kind)`. |
| `source_records` | UUID PK, material FK, source FK, unique `(source_id, external_id)`, latest snapshot FK, raw hash/payload. Multiple sources can describe one material without conflating them. |
| `material_revisions` / `content_releases` / `release_items` | Immutable revision IDs with material/source-snapshot links, normalized content snapshot and editorial provenance; release manifest pins `(material_id, revision_id)`. One active release pointer. A draft revision becomes published only through a validated release. |
| `editorial_overrides` / `publication_events` | Material/field or lesson target FK, value, base revision, author/reviewer, reason and lock/conflict state; audit draft/review/publish/retire events. Never merge overrides destructively into raw source data. |

**Generic IDs with real integrity:** each subtype uses `material_id` as its PK and a constant checked `kind` with composite FK `(material_id, kind) → materials(id, kind)`. A kana cannot accidentally occupy a vocabulary material. A deferred publication validator ensures every published material has exactly its matching subtype and required references. Drafts can be incomplete. Lesson/card/sentence links target `materials.id`, not an unvalidated `(type, arbitrary_id)` pair. Later material types add a subtype through a migration, not arbitrary JSON objects masquerading as relational targets. Revisions are immutable snapshots while normalized subtype/child tables represent current reference/editorial working state; APIs read the release-pinned snapshot, not unpublished working tables.

### 7.2 Dictionary and curriculum tables

| Entity | Keys and relationships |
| --- | --- |
| `kana` / `kana_aliases` | Kana material PK, unique `entry_key`, script, glyph, normalized `romaji`, category/group/sort order. Aliases FK to kana, unique `(kana_id, alias, purpose)`; add linguistic aliases only if a future exercise requires them. Unique `(script, glyph)` for current entries. |
| `kanji` | Kanji material PK, unique original scalar/codepoint key and character, primary stroke count nullable, alternate counts, grade/raw legacy JLPT metadata. No requirement that every kanji has meanings/readings/level. Do not key by UTF-16 string length. |
| `kanji_readings` / `kanji_meanings` | Reading UUID, kanji FK, kind on/kun/nanori, raw annotation, normalized kana, order; unique source-local identity. Meaning UUID, kanji FK, English gloss/order/provenance. Retain multiples rather than comma-joined strings. |
| `kanji_variants` / `components` / `kanji_components` | Variant pair FKs with source/type; components have source keys/labels; join has kanji/component FKs, role/radical system/position/group path/source. Component may not itself be a complete kanji. Preserve source-specific radical systems. |
| `vocabulary` | Material PK; source entry key maps through `source_records` (JMdict `ent_seq`/JSON `id`). Not keyed solely by surface text. |
| `vocabulary_forms` / `vocabulary_readings` | UUID PKs, vocabulary FK; form text/common/tags/order, reading kana/common/tags/order and optional versioned derived romaji. Unique `(vocabulary_id, text)` within each table unless source evidence requires a richer key. |
| `vocabulary_form_readings` | Allowed pair join with composite FKs that ensure form and reading belong to the same vocabulary entry. Kana-only cases do not fabricate kanji forms. Preserve applicability mode (`all`, `restricted`, `none`) during ingestion and materialize valid links. |
| `vocabulary_senses` / `sense_glosses` / `sense_tags` | Sense UUID + vocabulary FK, source order/fingerprint; English gloss rows and POS/usage/field tags. POS belongs to a sense. Cross-references retain raw target plus resolved FK where possible; unresolved targets are valid import warnings. |
| `sense_forms` / `sense_readings` | Restriction joins; same-entry composite FKs. Resolve wildcards when staging; maintain applicability semantics, not a global set of unrelated synonyms. |
| `vocabulary_kanji` | `(form_id, kanji_id)` FK pair plus occurrence positions; vocabulary relation follows the **specific form**, not every possible spelling. Missing reference kanji becomes a sourced stub, not an invented lesson item. |
| `furigana_alignments` | Form/reading pair FK, revision/method/version, reviewed segments JSONB; unique approved alignment per pair/revision. Validate that segments reconstruct the form and applicable reading. |
| `sentences` / `sentence_translations` | UUID PK, unique `(source_id, external_id)`, Japanese text and revision; linked English sentence/translation with its own source ID, contributor/license and relation provenance. Source updates do not silently change an exercise snapshot. |
| `material_sentences` | Material and sentence FKs, optional vocabulary sense/form/reading target, span/context/curation status; constraint ensures targets belong to the linked vocabulary. An English translation is not an English meaning sense. |
| `level_assignments` | Material FK, optional vocabulary sense FK, scheme (`jlpt-current-approx`, `jlpt-pre2010`), source/snapshot FK, level value, evidence URL/key, confidence/editorial status. Check valid level ranges per scheme; unique source-target-scheme assignment identity. Preserve conflicting sources rather than overwriting. |
| `lessons` / `lesson_revisions` | UUID PK, immutable slug, course/level/sequence, objectives, prerequisite lesson joins, draft/review/published versions. Reject prerequisite cycles. |
| `lesson_items` | UUID PK, lesson-revision FK, material FK, optional applicable form/reading/sense target, order, explanation/exercise configuration; unique `(lesson_revision_id, position)`. A selected sense remains stable through source reorder. |
| `media_assets` / `material_media` | Asset UUID, source/external key/version, object key/hash/MIME/size, author/license/attribution, duration/transcript if appropriate, safety/review/publication state. Typed material association and purpose (`stroke_svg`, later `audio`). |

Child entries such as JMdict senses do not have guaranteed stable upstream IDs. Maintain local UUIDs using source-aware text/fingerprint matching and explicit reconciliation of edits/splits/merges; never use a changing array ordinal as a persistent learning identity. In ambiguous updates retain old target revisions, quarantine the new relationship and request editorial resolution. This is essential to preserving user progress.

### 7.3 Study, reviews, and assessments

| Entity | Important keys/state |
| --- | --- |
| `study_cards` | UUID PK, immutable unique card key, material FK, skill (`recognition`, `meaning`, `reading`, later contextual/listening), prompt template/version, optional allowed sense/form/reading target, active revision. SQL checks/composite FKs prevent targets from another entry. A kanji reading card identifies a contextual/selected reading, not an assumption that every reading is interchangeable. |
| `user_card_states` | PK `(profile_id, card_id)`, scheduler state new/learning/review/relearning, stability, difficulty, due, last review, reps/lapses/learning step, suspended flag, optimistic `version`, scheduler/policy version. Insert-on-enrollment for MVP; no preallocation of every reference card for every user. |
| `review_logs` | Immutable UUID PK, profile/card FKs, unique `(profile_id, submission_id)`, prompt/content revision, raw/normalized answer or safe summary, correctness, rating, server time, elapsed time, previous/next schedule/version and scheduler version. Log genuine events only. |
| `review_attempts` | Issued prompt/card/revision/owner/expiry and expected state version; marks completion and records response. Prevents arbitrary card/rating submissions and supports retry retrieval. |
| `user_lesson_progress` | Profile/lesson PK, pinned lesson revision, current item, started/completed times; separate completion criteria from card mastery. |
| `daily_activity` | Profile/local date/timezone snapshot PK, new/review counters derived from accepted unique events. Rebuildable summaries; immutable logs remain authoritative. |
| `quiz_sessions` / `quiz_questions` | Session UUID, owner, config/release/status/score/start/finish; question UUID, unique session/ordinal, material/card target, immutable prompt/options/answer-policy snapshot and section (initially kana). Correct answers stay server-only until feedback. |
| `quiz_answers` | FK question/session/owner, unique `(session_id, question_id)` and `(profile_id, submission_id)`, submitted/normalized answer, correctness/time; session ownership enforced. Completion computed once from stored accepted answers. |

`mastered` is a **derived product status**, not an unconditional scheduler state. Proposed initial criterion: the relevant skill has several successful reviews on distinct days and a scheduled interval of at least 30 days; record a policy version and validate it with a learning specialist. A lapse can remove mastered status. Recognition, meaning and reading have independent states; course completion and self-reported familiarity appear separately. A single quiz success  never satisfies mastery.

Important indexes/constraints: `(profile_id, due_at, card_id)` on active user states; `(profile_id, reviewed_at DESC, id)` on logs; `(profile_id, status, started_at DESC)` on sessions; all frequently joined child FK columns; release/kind/level indexes for browse; unique source/external key and snapshot checksum; lesson sequence and item position uniqueness; index normalized forms/readings and English search documents. Start with indexed prefix/equality searches; add `pg_trgm`/GIN only when substring/English search needs justify them, with query-plan tests. Do not apply English stemming assumptions to Japanese tokenization. All counters/proportions exclude tombstoned/unpublished reference-only items from the active course denominator.

User-owned tables need explicit account-deletion policies and retention limits for raw typed answers. Reference/curriculum deletion uses restrict/soft retirement so history remains interpretable; account deletion may cascade personal data through a controlled workflow. Source/progress foreign keys must not be casually cascade-deleted by an importer.

## 8. API, grading, and review contracts

All endpoints below are **proposed** under Elysia `/api/v1`; Supabase's authentication endpoints remain responsible for credentials. Separate proposed `server/api/`, `server/services/`, `server/db/`, and `server/auth/` modules; route files orchestrate validated services and never duplicate SQL/answer policies in UI code.

| Representative endpoint | Responsibility / access |
| --- | --- |
| `GET /content/kana?script=&group=&q=` | Published kana, stable IDs/aliases, release/count. Public; small enough for whole-dataset client filtering if desired. |
| `GET /content/kanji?level=N5&cursor=&limit=` / `GET /content/kanji/:id` | Published details, source-backed level, readings/meanings, stroke media, paginated related vocabulary/examples. |
| `GET /content/vocabulary?q=&level=&cursor=` / `GET /content/vocabulary/:id` | Applicable forms/readings/senses/POS/furigana/examples; never expose unreviewed editorial drafts. |
| `GET /lessons?level=N5` / `GET /lessons/:slug` | Course sequence, prerequisites and published lesson revision. |
| `GET /me` / `PATCH /me/preferences` | Verified profile, target/goals/timezone; only allowlisted settings writable. |
| `PUT /me/lessons/:id/resume` | Valid lesson revision/item; idempotent resume checkpoint. Completion validated from required activity, not an arbitrary client boolean. |
| `GET /me/reviews?limit=` | Due/learning queue and counts; no schedule mutations on GET. |
| `POST /me/review-attempts` / `POST /me/review-attempts/:id/answer` | Issue a prompt; submit answer/rating with idempotency key and expected card version; grade and atomically log/schedule. |
| `POST /quiz-sessions` / `GET /quiz-sessions/:id` | Validate pool/config, snapshot questions, retrieve/resume an owned session. Account sessions are durable; guest practice remains independent and local. |
| `POST /quiz-sessions/:id/answers` | One accepted answer per issued question, server checking and stored feedback; reject foreign/unissued questions. |
| `POST /quiz-sessions/:id/complete` / `GET /quiz-sessions/:id/results` | Idempotent completion from stored answers, durable per-item review and aggregate/last score. |
| `GET /me/progress` / `GET /me/mistakes?cursor=` | Course/skill counts, due load, daily goals and paginated incorrect review/quiz events; no new mistake service required. |
| `GET /admin/import-runs` / `POST /admin/import-requests` | Admin-only run status or durable request for dedicated job workflow; no bulk execution in handler. |
| `PATCH /admin/materials/:id/draft` / `POST /admin/lessons/:id/revisions` | Editor corrections/curation with base revision and conflict detection. |
| `POST /admin/releases/:id/validate` / `POST /admin/releases/:id/publish` | Publisher-only checks and atomic release switch with audited reason. |

Use Elysia [request/response validation](https://elysiajs.com/essential/validation) and [error hooks](https://elysiajs.com/patterns/error-handling). Return consistent `{error:{code,message,requestId,details?}}`: 400 malformed input, 401 unauthenticated, 403 unauthorized, 404 unavailable material/session, 409 stale state/reused idempotency key with different payload, 422 invalid exercise/configuration, 429 throttled and 503 retryable dependency outage. Validate query limits, enums, UUIDs, answer lengths and body size. Never return SQL errors/secrets/raw stacks to clients; log request IDs with safe context. Use origin/CSRF protection for cookie-based writes, secure SameSite cookies, trusted redirect URLs and admin checks on the server.

**Atomic review algorithm (proposal):** verify identity/attempt ownership and expiry; validate payload and hash; open a [Drizzle transaction](https://orm.drizzle.team/docs/transactions); lock the existing `(profile, card)` state row (or safely insert then lock); check for an existing submission receipt; reject mismatched expected version; grade against the attempt's pinned content/accepted-answer policy; compute the next schedule using server time; insert exactly one review log/receipt and update the state/version/daily counters; mark the attempt complete; commit. A duplicate request with the same key/body returns the stored original result, not a second advancement. Different concurrent submissions against the same state allow one winner and return 409 to the stale one. Keep transactions short; prefetch content outside the lock, with immutable revision references.

The same principles apply to quiz answers/completion: unique answer constraints plus a completion transition prevent double score accumulation. A practice quiz records assessment/mistakes and familiarity; it **does not automatically reschedule an SRS card**. A dedicated review attempt advances scheduling once. If a later quiz intentionally contributes review evidence, it must share the review event transaction/idempotency path rather than calling both handlers.

**FSRS candidate:** use a pinned [ts-fsrs implementation](https://github.com/open-spaced-repetition/ts-fsrs) behind proposed `server/study/scheduler.ts` and a small portable pure scheduling contract. The [FSRS project](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) supplies the model; product mastery thresholds remain an editorial/product policy. Store algorithm/parameter versions, all required card state and immutable before/after logs. Start with library defaults and a documented target retention; personal parameter optimization is deferred until sufficient review history exists. Incorrect objective answers map to Again; correct answers permit conservative difficulty ratings with clear UI, and revealed/assisted answers cannot earn an Easy grade. Self-graded reveal cards are explicitly self-reported. Separate cards for recognition/meaning/reading prevent one success from implying every skill was learned.

Use server timestamps for authoritative scheduling; elapsed time is bounded supporting telemetry, not trusted proof. Daily goals use profile timezone with recorded local-date attribution. Queue selection includes learning steps and overdue reviews before bounded new cards, mixes siblings to reduce immediate hints, and supports suspension/leech handling with a manual escape. Test policy changes with versioned fixed-clock fixtures; do not mass-reset schedules when upgrading a library.


## 9. Checkpoint execution and acceptance

The original P0/phase 1–6 sequence is **superseded**. P0-A/P0-S historical outcomes are retained in the progress log and Git. The numbered data/architecture sections above are target design, not checkpoint authorization.

### C1 — Simplify and stabilize frontend (implemented and automated-tested)

- Goal/dependencies: trustworthy existing kana app; reuse supported Next/npm work and the frozen dataset fixture. No backend dependency.
- Deliverables: revised plan/workflow, removal of obsolete recovery contracts, search/filtered-card/storage/quiz/theme/Romaji/accessibility fixes, supported React/types and automated gates.
- Reuse/extend: actual app/page.tsx, layout/provider/Header, types/kana.ts, lib/kana-data.ts, both kana hooks, components/kana/*, existing UI primitives/config/README.
- Implemented C1 additions: lib/kana/search.ts, lib/kana/quiz.ts, lib/progress/guest-store.ts, vitest.config.mts, tests/frontend/*, app/error.tsx and .github/workflows/check.yml. Removed public/guest-progress-backup* and their tests/docs/server. Retained tests/fixtures/kana-baseline-v1.json unchanged.
- Database/API: none.
- Acceptance: all 208 IDs/glyphs remain; shi/SHI/trimmed/kana/nonmatches and combined filters work. Shrink/empty/expand never expose invalid or previously revealed cards. Refresh/remount reads valid new storage; invalid/blocked/quota storage does not crash; no initial empty overwrite; known-ID percentages stay bounded; cross-tab resets replace state. Quiz has unique prompts/options, one submission/question, explicit cancellation/advancement, correct final review and zero-pool feedback. All UI/data contracts say Romaji. System/light/dark hydration is stable; inputs, progress, table headers, theme and feedback have accessible semantics. All automated gates pass with no build bypass or suppressed diagnostics.
- Tests: native dataset contract, pure domain tests, React interaction/storage/hydration tests, automated accessibility, lint, strict typecheck, production build. No manual QA, browser exploration or visual inspection.

### C2 — Backend, database, login and persistent progress (implemented; local automated verification passed; external checks pending)

- Goal/dependencies: layer real account services onto verified C1 kana functionality without a guest/account adapter or migration. Supabase manages email/password, verification/recovery and token sessions; Elysia owns account authorization, grading and idempotency; PostgreSQL/Drizzle owns persistence. No content import, scheduler or advanced course work.
- Deliverables: Node fetch integration, private SQL schema and committed migrations, repeatable 208-entry seed, restricted pooled SQL connection, server-only environment configuration, managed auth/account UI, persistent familiarity, server-issued quiz snapshots/feedback/results/history and durable retry receipts.
- Existing files reused/extended: components/layout/header.tsx, components/kana/flashcard-mode.tsx, filters-card.tsx and primitives; lib/kana/quiz.ts and types/kana.ts; C1 guest root/hook/store remain independent. Extend package scripts, lockfile, CI and documentation.
- Implemented additions: app/api/[[...slugs]]/route.ts; server/api/{app,runtime,errors}.ts; server/config.ts; server/db/{client,schema}.ts; server/services/learning.ts; server/auth/{client,gateway,supabase,callback,refresh}.ts; proxy.ts; app/auth/callback/route.ts; app/account/page.tsx and password/page.tsx; components/account/*; lib/account/{client,contracts}.ts; drizzle/ and drizzle.config.ts; scripts/db/{run,seed-kana,targets}.ts; .env.example; docs/backend-setup.md; backend/account/production/network automated tests and configs.
- Concrete C2 database slice: private learning.profiles (FK managed auth.users), kana (text ID from fixture, unique script/glyph/order), kana_familiarity (profile/kana PK), quiz_sessions, quiz_questions and quiz_answers (composite owner/session FKs, unique prompt/answer, bounded result state), mutation_receipts (profile/request PK, canonical payload hash and saved result). General UUID material/source/release tables from section 7 stay later content work; do not create empty entities for them now.
- SQL protection: least-privilege non-bypass runtime role, private schema, forced per-profile RLS and explicit query scoping. Transaction-local claims and profile row locks serialize mutations across pooled requests; a unique durable receipt prevents replayed activity. Immutable questions/answers/receipts are insert/read only to runtime. No client-supplied owner, correctness or score.
- API: docs/backend-setup.md lists exact implemented /api/v1 auth/content/progress/quiz resources. GET quiz-sessions/:id supplies both resumable state and completed review; history is cursor-paginated. Request validation rejects extra fields and oversized/non-JSON bodies, errors are safe/consistent and private responses uncached. Writes require the configured exact Origin.
- UI: separate /account sign-in/signup/recovery/sign-out/password change, filtered server-content flashcards, server-checked quiz, review/history/resume and stable-ID retry buttons. Failed mutations do not credit progress optimistically. Guest storage is not read/imported. Accounts never claim single-answer mastery.
- Acceptance: local Node route handles requests without Bun/listeners; managed auth methods and refresh/callback cookies are wired; unauthenticated or foreign-account access is denied; invalid payloads/unknown kana/foreign questions are rejected; seed and migrations repeat safely; new service/process state reads persisted progress/results; one response per question and one completed score survive repeated/concurrent submissions; complete only after every issued answer exists; no secrets in client output. No production operation, migration at startup, backup rehearsal or manual QA.
- Automated evidence: retained kana fixture and React regressions; real embedded PostgreSQL migrations/constraints/RLS and disk close/reopen; actual Elysia Request/Response boundaries; real Supabase SDK through synthetic HTTP Auth transport; Next callback/proxy cookie/redirect tests; retry/account-switch UI tests; lint/typecheck/build and automated loopback production HTTP smoke. Network test: explicit new empty loopback kana_c2_test_* database, restricted random login and independent pooled connections; CI defines a disposable PostgreSQL service.
- External distinction: no Supabase credentials/project or running Docker engine are available here. Hosted email/confirmation/recovery/revocation, real pooler/TLS/region behavior, network PostgreSQL contention and Vercel/remote CI are not claimed tested. Configuration and automated entrypoints/limits are documented. Continue independent implementation; no manual QA approval gate or deployment is introduced.

### C3–C6 — Await user checkpoint prompts

Not started. Their goal/dependencies/deliverables/files/database/API/acceptance/tests will follow the corresponding prompt. Later content/SRS/advanced-module architecture above remains planning context, not authorization.

## 10. Automated verification and local delivery

Use npm with one lockfile and supported pinned framework/runtime line. Aggregate npm run check runs native/React/backend tests, lint, typecheck, production build and loopback HTTP smoke. Native fixture remains evidence of the kana inventory; tests use synthetic local data and embedded PostgreSQL, not production services or live dictionaries. test:postgres separately requires an explicit new disposable network target. A simulated DOM or Auth transport does not prove hosted behavior; report that limit without requesting manual approval.

Do not perform manual QA, exploratory browser testing, visual inspection, manual acceptance checklists or backup/restore rehearsals. Editorial provenance/rights approval is a content publication responsibility, never fabricate it or mislabel it as automated proof of pedagogy.

Before each focused local commit check exact diff, whitespace, automated results and unrelated changes. Do not push/deploy. Git can recover removed source files from prior commits; new internal contracts need no legacy adapter. Future schema revisions may reset explicitly designated disposable development databases. Production operations require a later explicit task and actual environment-specific policy, not assumed credentials or reset permission.

## 11. Risks and unresolved decisions

- C3–C6 scope/order, provider budget/region, actual isolated Supabase credentials/configuration, exact N5 manifest and content reviewers await later prompts/decisions. C2 uses managed Supabase email/password and restricted PostgreSQL.
- API schema fixtures, JLPT vocabulary mapping reuse permission, media rights and editorial capacity are publication gates. Preserve unknowns; do not fabricate content.
- Node 22 is supported; Next 16.4.2 already upgraded. C1 verifies React 19 and UI peer/type compatibility. Exact dependency results and failed attempts belong in the progress log.
- Guest familiarity is best-effort device-local; no cross-device guest sync, guaranteed concurrent-write merging, old-key conversion or migration into an account.
- Single correct answers do not establish mastery. Per-skill states/scheduling are later backend work.
- No deployed verification is claimed. Only relevant automated checks are performed.

## 12. Prioritized checklist

- [x] C1: replaced obsolete policy/export contracts; normalized Romaji/search; stabilized filter/card/storage/quiz/theme/accessibility; all automated gates pass. Exact verification and local commit handoff are in docs/implementation-progress.md and Git history.
- [x] C2 implementation and local automated gates: 50 tests, lint, strict typecheck, production build/HTTP smoke, repeatable isolated SQL and clean npm install verified. Hosted/network/provider checks explicitly await genuine isolated configuration; see progress log and docs/backend-setup.md.
- [ ] C3: await prompt.
- [ ] C4: await prompt.
- [ ] C5: await prompt.
- [ ] C6: await prompt.

Historical completed fixture and dependency updates are reused, not repeated. English-only meanings, Elysia/Vercel/PostgreSQL, imported database content and N5-first delivery remain the target.
