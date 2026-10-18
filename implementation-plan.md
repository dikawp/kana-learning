# Kana Learning implementation plan

Revised 18 October 2026 (Asia/Jakarta). Current direction: one public learning interface without learner accounts; device-local progress; Supabase for published materials. This revision supersedes the C2 learner Auth/cloud-progress design. C1 fixes and useful C2 content/backend infrastructure remain reusable.

## 1. Scope and implementation authority

Build an English-meaning Japanese learning platform for kana, kanji and vocabulary across JLPT N5–N1, then grammar, reading and listening. Deliver a complete curated N5 experience first, not an all-13,000-kanji import. Indonesian translation is excluded.

Learners use the same Flashcard/Quiz/Table interface without registration, login or anonymous Supabase identities. Progress, quiz history, mistakes, goals, resume and later scheduling live in the browser. Supabase PostgreSQL holds reference dictionaries, curated lessons, sources/publication metadata and asset references. Elysia supplies public read APIs. Supabase Auth is a future option for explicitly authorized administrators, not a learner dependency.

Excluded: learner accounts/cloud progress, guest/account adapters, old-origin migration, progress export/import, backup/restore rehearsals, offline synchronization/service-worker delivery, AI companion, subscriptions and handwriting recognition. Local persistence is not offline synchronization. Kanjiflash's export feature is not automatically in scope.

This task changes planning/documentation only, consolidates active guides and archives historical progress. Runtime/dependency/env/SQL cleanup is the mandatory C2-R checkpoint below, to implement when explicitly requested before C3. No push, deployment, paid provisioning, manual QA, exploratory browser testing or visual inspection. No remote data/credential deletion is authorized by a request for a clean project folder.

## 2. Verified starting point and current behavior

Starting commit: 3c12ca8; tracked tree clean at inspection. No applicable AGENTS.md previously found; recheck before implementation. Installed Next 16.4.2, React 19.3.1, Node >=22.13 <23, npm 10.9.4, Elysia 1.4.30, Drizzle/Postgres.js already support this redesign; no framework rewrite/upgrade is required.

C1 fixed search, filtered flashcard indexing, storage failure handling, quiz lifecycle/empty states, Romaji, theme and accessibility. C2 added managed accounts, separate practice, relational cloud quiz/progress, migrations and public kana content. Follow-up applied/repeated three SQL migrations and 208-kana seed, configured a restricted kana_app LOGIN and localhost Auth callbacks. Reuse completed work rather than provisioning again.

Historical automated evidence at 3c12ca8: 51 tests plus lint/typecheck/build/loopback HTTP passed; hosted read-only SQL/Auth-settings/Next checks passed; localhost content returned 208 kana. These do not verify this proposed redesign. Hosted authenticated integration was not automated. The user's subsequent screenshot shows a signed-in account with familiarity/quiz history: do not assume the database is empty or that no user activity exists.

| Existing paths | Verified flow and redesign decision |
| --- | --- |
| app/page.tsx; components/kana/ | Bundled kana -> filter hook -> Flashcard/Quiz/Table. Reuse the single UI and all three modes. |
| hooks/use-kana-progress.ts; lib/progress/guest-store.ts | Validated kana-learning:guest:v1 familiarity, guarded reads/writes and cross-tab replacement. Reuse; last quiz score is currently session-only. |
| lib/kana-data.ts; types/kana.ts; lib/kana/{search,quiz}.ts | 208 records, stable IDs, glyph/Romaji/type/category; working filter/question generation. Keep stable identities and pure domain logic. |
| app/account/; components/account/; lib/account/ | Separate account surface; its dashboard does not mount TableView. Remove after local feature parity, not as a Supabase limitation. |
| server/api/{app,runtime,errors}.ts | Public content plus private learner Auth/progress/quiz APIs. Rewrite to public content only. |
| server/services/learning.ts | Mixed content reads/account transactions. Extract public content, remove cloud learner service. |
| server/db/{schema,client}.ts; drizzle/ | Seven learning tables, auth.users FK, forced RLS and pooled SQL role. Preserve kana and immutable applied migration history. |
| server/auth/; proxy.ts; app/auth/callback/route.ts | Learner session/callback/refresh infrastructure to retire. |
| scripts/db/{run,targets,seed-kana,verify-development}.ts | Real CLI/seed/target guards useful; hosted verifier still assumes learner Auth and needs rewriting. |
| tests/fixtures/kana-baseline-v1.json | Frozen 208 IDs/glyphs/scripts/order. Retain unchanged. |

Current account flow: managed Auth -> Elysia -> PostgreSQL progress/quizzes. Target: public content -> shared UI -> validated browser learner state. Familiarity remains different from mastery.

Kanjiflash informed the experience, not a claim about its server stack. Its inspected public client used localStorage, embedded practice payloads and /api/dashboard-data. That does not prove a database/server runtime or a live third-party dictionary call on each practice request. References: [privacy](https://kanjiflash.com/privacy), [sources](https://kanjiflash.com/sources), [client](https://kanjiflash.com/static/client.js). Do not copy branding, teaching text or code.

## 3. Target architecture

Keep Next App Router + Elysia fetch integration in app/api/[[...slugs]]/route.ts on Vercel-compatible Node. No Bun listener or separate backend project. A separate project adds CORS, deployment/contract coordination with no demonstrated need.

Supabase PostgreSQL remains the normal material source. Use one shared published-content loader/API instead of parallel bundled guest content and account data. Server-rendered initial payloads are acceptable through the same contract. On fetch failure show loading/error/retry and retain already loaded session content; do not silently substitute an unversioned dictionary. Seed all 208 stable kana IDs first.

Retain bounded Postgres.js pool, prepare:false, TLS and timeouts. Narrow the runtime role to SELECT on published content, no owner/superuser/BYPASSRLS or learner writes. Migration/import credentials stay separate. Supabase Auth does not automatically protect privileged SQL. Keep learning outside exposed Data API schemas and do not grant anonymous SQL writes.

Public published GETs may use bounded release-aware caching/ETags; draft/admin/error/identity responses remain private/no-store. Validate search/cursor/page limits, index release/kind/level/order keys and invalidate publication caches correctly. Keep API/database regions close; development currently uses Tokyo, production placement is a later deployment decision.

Neon remains an alternative, not a reason to migrate. Driver/transactions require current verification if adopted. Supabase Storage is optional for licensed stroke/audio assets when needed. No Redis/queue/worker until workload justifies it. Imports run dedicated scripts/job workflows, never learning requests.

Future admin Auth is separate: server-verified editor/publisher allowlist, no public admin sign-up and no automatic promotion of a former learner. Initial curation/import/publication can remain operator CLI work. Remove unused learner Auth dependencies rather than keep hypothetical admin placeholders.

Technical references: [Elysia Next](https://elysiajs.com/integrations/nextjs), [Vercel Node](https://vercel.com/docs/functions/runtimes/node-js), [Supabase pooling](https://supabase.com/docs/guides/database/connecting-to-postgres), [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). Verify official compatibility when actual package changes are needed.

## 4. Device-local learning model

Existing kana IDs such as h-a remain canonical. Local state references stable material/card keys plus content revision, never array offsets or IDs regenerated on fetch.

C2-R retains the validated localStorage familiarity/settings store and adds bounded, validated quiz resume/history records. Specify session-count/size limits in implementation/tests; do not silently clear saved data on reads. Proposed new modules: lib/content/{client,contracts}.ts, lib/study/{contracts,local-store,quiz-history}.ts and hooks/use-study-session.ts.

C4 uses IndexedDB for larger indexed review logs and atomic writes: settings/target level/goals/timezone, lesson resume, per-skill schedules, review/mistake events and quiz sessions are separate stores. Proposed lib/study/{indexeddb-store,scheduler,review-queue}.ts. New schema contracts may start fresh with a clear reset notice; no legacy/dual-write adapter. Stable content IDs and compatible review state must survive normal content corrections; do not blindly reset schedules on every release.

Practice grading is client-owned against pinned prompt/answer-policy snapshots. Store question/options/accepted-answer revision, response, cursor/status, completion/result/review. Do not recompute historical results using changed answers. Unique local attempt IDs and one transition per question/completion prevent duplicates; IndexedDB later provides atomic stale-tab/version checks. Client results are personal study feedback, not trusted certification.

Storage denied/quota/corrupt/unknown-ID states permit in-memory practice and disclose failed durability. Never overwrite initial stored state just by mounting. localStorage multi-tab updates remain best effort; later IndexedDB writes must handle stale versions. Browser data can be cleared/evicted and does not follow users to another device. Device clock/timezone is adequate for private practice but needs fixed-clock/jump tests.

FSRS remains a C4 candidate using pinned [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Recognition/meaning/reading cards have separate state where appropriate. Store algorithm/parameters/version and immutable before/after logs locally. New/learning/review/mastered is explicit policy: one correct answer is not mastery. Revealed/assisted answers cannot earn an unassisted grade; quizzes must not advance SRS twice through duplicate paths. Server-owned schedules/profile timezones/quiz receipts are superseded.

## 5. MVP and navigation

| Current gap | Target |
| --- | --- |
| Guest/account UI divergence | One public interface, no learner login gate/Account link, all three kana modes. |
| Bundled vs SQL content | One published material contract with stable IDs and shared search/filter/table/practice data. |
| Cloud quiz/history | Client checking and bounded device-local resume/history/mistakes. |
| Kana binary familiarity | Preserve honestly; per-skill review comes in C4. |
| No dictionary/course content | C3 licensed pinned imports plus curated complete N5 manifest. |
| No editorial workflow | Operator CLI first; admin Auth/UI only for a concrete later need. |

Reuse Header, FiltersCard, ProgressCard, FlashcardMode, QuizMode, TableView and theme provider. Add Kana / Kanji / Vocabulary / Lessons / Review / Progress navigation as modules actually exist, not placeholder pages. Describe progress as belonging to this device.

N5 MVP: public kana/kanji/vocabulary, curated lesson -> practice -> feedback -> review, local goals/resume/statistics and source/publication quality. No registration/cloud progress, mandatory Docker, all-kanji import, admin dashboard or advanced modules as MVP gates.

## 6. Content sources and ingestion

Retained from the prior source investigation. Revalidate pinned payload/schema/licenses during C3; this planning edit did not perform a new ingestion/freshness check.

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


## 7. Proposed database model and integrity

Only content/editorial state belongs in PostgreSQL. These are proposed entities unless already identified. Add them when needed; no empty future-module scaffold.

| Entity group | Keys, relationships and indexes |
| --- | --- |
| content_sources; source_snapshots; import_runs; import_checkpoints | Unique source slug, source/checksum, source/external-id; license/version/date/checksum/adapter/update metadata; resumable cursor bound to snapshot. Index source/status/time. |
| materials; source_records | UUID generic ID, immutable unique stable_key and kind; source-backed kanji/JMdict keys. Subtype checked kind + composite FK to materials(id, kind), publication validator requires exactly matching subtype. No arbitrary polymorphic IDs without FKs. |
| kana | Existing text ID PK, unique script/glyph and position; retain 208 IDs. Add explicit unique material mapping later if necessary, never rekey local progress. |
| kanji; kanji_readings; kanji_meanings | Unique original character/codepoint; ordered multiple raw/normalized on/kun/nanori readings and English glosses/provenance; nullable stroke/grade, alternate counts/variants. |
| components; kanji_components; kanji_variants | Source-local keys and real FKs, radical system/position/group path; not every component is a kanji/etymology. |
| vocabulary; vocabulary_forms; vocabulary_readings | Source entry identity, ordered child UUIDs and same-entry uniqueness; kana-only vocabulary supported. |
| vocabulary_form_readings; vocabulary_senses; sense_glosses; sense_tags; sense_forms; sense_readings | Explicit permitted pair/sense relations with same-entry composite FKs; all/restricted/none applicability, sense-specific POS and English glosses, not a Cartesian product. |
| vocabulary_kanji; furigana_alignments | Specific written form/kanji occurrence FKs; reviewed form/reading alignment, method/version and segment reconstruction checks. |
| sentences; sentence_translations; material_sentences | Unique source/external sentence IDs; independent English translation/contributor/license and curated sense/span associations with valid same-entry FKs. |
| level_assignments | Material/sense, source/snapshot, taxonomy/level/evidence/status; scheme-specific range checks, conflicting sources preserved; index level/kind/status. |
| lessons; lesson_revisions; lesson_items; study_cards | Curated course/level/order/prerequisites and stable lesson/card keys, per-skill prompt/answer policy; material/sense FKs. Study cards are reference definitions, not user schedules. |
| material_revisions; content_releases; release_items; active_release | Immutable pinned revisions/manifests, unique release/material, transactional validated active-release switch. Index release/kind/order. |
| editorial_overrides; publication_events; media_assets | Base revision/field locks/reason/operator audit; media key/hash/type/size/creator/source/license/publication state. No draft asset leaks. |

Personal lesson progress, card schedules, review logs, quiz sessions/questions/answers, settings and duplicate-attempt records live locally. IndexedDB keys are card stable_key + skill, session/attempt IDs; index dueAt/status and startedAt, unique accepted question/attempt in one transaction. No target learner profiles/auth.users FK or cloud mutation_receipts. Later admin identities/audit are a separate concern.

Retire active runtime use of existing profiles, kana_familiarity, quiz_sessions, quiz_questions, quiz_answers and mutation_receipts. The hosted project may contain activity. Repository cleanup does not require deleting those rows: isolate dormant data and remove runtime write grants via an authorized forward migration. Destructive table/user retirement requires separate explicit approval; no DROP CASCADE, auth.users edits or project reset. Applied SQL history remains immutable.

## 8. Target API

| Endpoint | Responsibility |
| --- | --- |
| GET /api/v1/health | Honest configuration/readiness distinction; no learner Auth dependency/secrets. |
| GET /api/v1/content/kana | Existing route retained; stable 208 entries through published material contract. |
| GET /api/v1/content/kanji and /kanji/:key (proposed) | Published level/search/cursor-limited list and readings/meanings/assets/related words. |
| GET /api/v1/content/vocabulary and /vocabulary/:key (proposed) | Published explicit form/reading/sense relationships. |
| GET /api/v1/content/lessons and /lessons/:slug (proposed) | Revision-pinned curated lessons/reference cards; progress calculated locally. |
| GET /api/v1/content/releases/current (proposed) | Manifest/revision for cache/session compatibility, not offline synchronization. |
| Later /api/v1/admin/* (proposed only when needed) | Verified admin-only curation/import status/publication; long imports remain outside HTTP handlers. |

Remove /api/v1/auth/*, /me/progress*, learner /quiz-sessions* and old /me/reviews/review-attempt proposals. No compatibility stubs/redirects. Preserve Elysia validation, capped queries/body input and consistent safe request-ID errors (400/404/422/503 etc.). Public reads require no cookies/device IDs; unknown removed routes return404. Only future admin writes need identity/CSRF/origin controls and publication idempotency. Content reads never import, publish or write learner progress.

## 9. Explicit repository cleanup inventory

Runtime removals below are planned C2-R implementation, not completed by this planning edit. Check actual imports/consumers before deletion. Replace relevant coverage when deleting superseded contracts; preserve unrelated code/secrets.

| Existing files/config | Action and dependency |
| --- | --- |
| app/account/page.tsx; app/account/password/page.tsx; app/auth/callback/route.ts; proxy.ts | Delete learner routes/callback/proxy after unified UI parity; remove empty directories. No compatibility redirects. |
| components/account/{account-page,auth-form,dashboard,account-quiz}.tsx; lib/account/{client,contracts}.ts | Extract useful quiz history/resume behavior into local modules, then delete all account UI/contracts/client calls. |
| server/auth/{client,gateway,supabase,callback,refresh}.ts | Delete learner session code after consumers are removed; no hypothetical admin scaffold. |
| server/services/learning.ts | Extract published reads into proposed server/services/content.ts; remove account transactions/grading/receipts. |
| server/api/{app,runtime,errors}.ts; server/config.ts; server/db/{client,schema}.ts | Retain/rewrite content-only API, SQL validation and safe errors; remove principal/Auth/learner claims dependencies. Shortened schema requires reviewed forward migration strategy, not drizzle-kit push. |
| app/page.tsx; components/layout/header.tsx; hooks/use-kana-progress.ts; lib/progress/guest-store.ts | Shared content, local state and no Account/guest split copy. Reuse kana/theme/a11y primitives, no duplicate study screen. |
| tests/frontend/account.test.tsx; tests/backend/auth.test.ts; tests/backend/next-auth.test.ts | Delete superseded learner Auth tests; replace useful coverage with anonymous content/boundary/local history tests. |
| tests/backend/{database,persistence,targets,db-cli}.test.ts; tests/production-smoke.mjs | Rewrite account SQL/persistence to published content/role contracts. Keep actual CLI guard, repeat migrations/seed, public errors and Next HTTP. Local learning persistence belongs in browser storage tests. |
| tests/postgres/concurrency.test.ts; vitest.postgres.config.mts | Remove obsolete account-mutation contention suite/config; content SQL tests remain PGlite. Do not require network account concurrency after removing account writes. |
| .github/workflows/check.yml | Remove obsolete postgres learner-concurrency job/service/fixtures; retain reproducible npm ci and aggregate gates. No mandatory Docker. |
| scripts/db/{run,targets,seed-kana,verify-development}.ts | Keep CLI/startup/seed/target guards. Remove disposableTestTarget when its suite is removed; rewrite hosted verifier for published content/public HTTP/read-only grants without learner Auth settings. |
| package.json; package-lock.json | Remove test:postgres when suite gone; npm-uninstall @supabase/ssr and @supabase/supabase-js after last consumer including verifier is removed. Keep Elysia/Drizzle/Postgres.js/PGlite/tsx. Audit actual imports before other pruning, no framework upgrades/force fixes. |
| .env.example | Remove SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, C2_TEST_* and APP_ORIGIN when learner consumers disappear. Keep APP_ENV, DATABASE_URL, MIGRATION_DATABASE_URL and explicit target designation. Retain a variable only with a concrete documented consumer. Future admin/storage vars added only when used. |
| .env.local and ignored secrets | Preserve user values and do not print/commit/delete the file. Clean obsolete local keys only after reference checks during authorized implementation; no provider key rotation/revocation/dashboard callback/user deletion as a side effect. |
| drizzle/0000_c2_foundation.sql; 0001_c2_security.sql; 0002_c2_score_constraint.sql; drizzle/meta/ | Keep immutable applied migration/journal/snapshots, despite historical names. Add reviewed forward SQL for grants/approved retirement; never rewrite checksums or fabricate a clean baseline. |
| README.md; docs/backend-setup.md; docs/implementation-workflow.md; implementation-plan.md | Canonical active docs, rewritten instead of duplicated no-login/account guides. Keep current implementation vs target explicit until cleanup implemented. |
| docs/implementation-progress.md; docs/archive/implementation-history-pre-no-login.md | Concise active progress + exactly one clearly historical archive. Old task instructions are superseded. Git holds prior plan/setup; no copies of every obsolete guide. |

Clean means no orphaned learner route/import/dependency/env requirement, duplicate UI/data source, account-only test/job or misleading active instructions. It does not mean deleting node_modules, all UI primitives, useful data fixtures, immutable migrations or hosted personal data. Remote schema/user cleanup is separately authorized, not a filesystem operation.

## 10. Checkpoints and acceptance

P0-A/P0-S and C1 remain historical completed evidence. Old C2 learner Auth/cloud-progress requirements and pending hosted-account acceptance are superseded; do not continue them. Useful public content work remains. C3–C6 are provisional allocation pending their corresponding prompts.

### C2-R.0 — Plan/documentation consolidation (this task)

- Goal/dependencies: resolve architecture using current repository evidence, no runtime changes.
- Deliverables/files: this plan, workflow, README/setup, concise active progress and one historical archive.
- DB/API: no changes; secrets untouched.
- Acceptance/tests: exact existing removal paths verified; proposed paths labelled; active relative Markdown links resolve; only docs changed; no runtime-clean claim or fabricated application check.
- Next: explicitly request C2-R implementation before C3.

### C2-R.1 — One public UI and local exercise state

- Goal/dependencies: R.0 plus C1 UI/C2 public kana API.
- Deliverables: shared Flashcard/Quiz/Table, filters/loading/error/retry, familiarity and bounded refresh-safe local quiz resume/history/answer review; no Account navigation.
- Reuse app/page.tsx, Header, components/kana/*, hooks and guest store. Proposed lib/content/{client,contracts}.ts, lib/study/{contracts,local-store,quiz-history}.ts, hooks/use-study-session.ts. Extract useful account quiz behavior, never keep a second public dashboard.
- DB/API: published kana GET; no learner SQL writes. Temporary account code must be removed in R.2 within this checkpoint, not shipped as an alternative.
- Acceptance: 208 stable IDs, mode/filter/search parity, no duplicate answer/completion, refresh resume/history, corrupt/quota/blocked-storage disclosure.
- Automated tests: retained fixture/domain/interaction/storage/theme/a11y plus proposed tests/frontend/local-history.test.tsx, content loading/retry; lint/typecheck/build.

### C2-R.2 — Content-only backend and complete cleanup

- Goal/dependencies: R.1 and inventory; complete before checkpoint handoff.
- Deliverables: delete learner routes/Auth/services/contracts/packages/env templates/tests/CI jobs; narrow runtime SQL grants; content-only verifier; no stale docs/empty directories/admin placeholders.
- Reuse Elysia route/errors, SQL client, CLI/seed/target guards; proposed server/services/content.ts, tests/backend/content.test.ts and reviewed forward SQL migration. Retain applied drizzle history.
- DB/API: GET-only published content; no learner /auth, /me or /quiz-sessions. Default retain dormant hosted data isolated; destructive retirement is separate authorization.
- Acceptance: anonymous content works without learner Auth env/cookies; removed routes404; runtime cannot write content/dormant account tables; no orphaned imports/config/scripts; dependencies coherent.
- Automated tests: actual PGlite grants/FKs/migrate/seed repeatability, CLI guards, anonymous validation/errors, production HTTP, npm run check and unfiltered npm audit. Hosted read-only verifier remains opt-in on designated development. No manual QA or reset.

### C3 — N5 content/ingestion (provisional)

- Goal/dependencies: C2-R clean gate; complete curated N5 kanji/vocabulary/course data.
- Deliverables: pinned licensed dictionaries, source-backed approximate levels, valid strokes/components/examples, staged/resumable imports, curriculum and attribution.
- Reuse seed/content/SQL modules; proposed scripts/imports/*, server/content/*, content/curricula/n5.json, docs/content-sources.md and /sources; shared kanji/vocabulary UI primitives.
- DB/API: section7 source/reference/revision/curriculum tables, paginated published content GETs. Operator CLI publication first; no external dictionary call per learning request.
- Acceptance: complete reviewed N5 manifest, English glosses and correct multiple form/reading/sense relations, source/license metadata, unknown fields handled honestly.
- Automated tests: pinned payload fixtures, idempotency/retries/resume/outages/editorial retention, publication atomicity, FKs/indexes/pagination/cache and full gates. Rights/editorial approval is real external publication responsibility, not fabricated test evidence.

### C4 — Local lessons/SRS/progress (provisional)

- Goal/dependencies: C3 reference cards; lesson -> practice -> feedback -> review without login.
- Deliverables: local goals/resume, due queues, per-skill schedules/mistakes/statistics and explicit mastery policy.
- Reuse single UI/local quiz/store contracts. Proposed lib/study/{indexeddb-store,scheduler,review-queue}.ts and lesson/review/progress screens.
- DB/API: reference card definitions only; personal state/logs in IndexedDB, no cloud learner endpoints.
- Acceptance/tests: fixed-clock FSRS cases, transactional duplicate/stale-tab protection, IndexedDB reopen/schema/failure tests, timezone/goals, content revision compatibility and full gates. No claim that simulated storage proves every browser's eviction behavior.

### C5 — Grammar/reading/listening and N4–N3 (provisional)

- Goal/dependencies: N5 complete and rights cleared.
- Deliverables: curated explanations/exercises, graded texts/ruby/lookup, licensed audio/transcripts and N4–N3 lessons.
- Reuse content publication/local study; proposed module-specific content adapters/UI/media metadata.
- DB/API: content subtypes/associations and public GET/media; admin Auth only if real curation workflow needs it.
- Acceptance/tests: approved content/media, valid furigana/transcript alignment, accessible playback and persisted local learning, parser/rights/association/component/full automated gates.

### C6 — N2–N1 and advanced practice (provisional)

- Goal/dependencies: earlier courses mature.
- Deliverables: curated advanced content, reading/listening and JLPT-style section practice with local results.
- Reuse release/cards/local review; proposed advanced assessment manifests/section result modules.
- DB/API: reference expansion only; no trusted cloud exams.
- Acceptance/tests: source-backed levels, section scoring/timers, revision consistency, bounded large-dataset storage/loading and full gates. Optional tracing is future scope; handwriting recognition remains excluded.

## 11. Verification, rollout and data boundaries

Maintain npm run check: native/frontend/backend, lint, strict typecheck, build, loopback production HTTP. Retire only superseded product tests while replacing relevant content/local-state coverage. Historical 51 tests are not a mandatory count for deleted Auth behavior; fewer tests do not prove sufficient replacement coverage.

Mandatory cleanup evidence: 208 fixture unchanged; public content with Auth env absent; three modes/search/filter; local storage corruption/quota/refresh/history/resume; public validation/errors; removed routes404; no learner client secrets/imports; restricted SELECT and denied writes; repeatable migrations/seed. Default tests use isolated embedded SQL/fixture transport, not personal cloud data. Remove obsolete Docker account suite; no new manual checklists.

Before local commits inspect exact diff/staged paths, docs links, dead imports/scripts, actual automated results and unrelated changes. No push/deploy. Revert source with Git; applied SQL requires a reviewed forward change rather than local-history deletion/reset. No backup/restore rehearsal. Content rollback switches to a prior validated manifest/cache key, preserving stable local learning identity.

This planning task does not query/migrate/delete hosted data. A cleanup implementation may test proposed privilege SQL locally; applying it must name the designated target. Destructive tables/users/project cleanup needs separate explicit authorization. Never delete .env.local to make Git appear clean.

## 12. Risks and prioritized handoff

- Browser data can be cleared/evicted/unavailable; cross-device progress is deliberately absent. No implicit export/backup/offline-sync work.
- Client grading is modifiable: appropriate for personal practice, not competitive/certification results.
- Define local history limits in C2-R and IndexedDB retention/schema before C4 log growth.
- Source licenses/update cadence, vocabulary level mapping, N5 curriculum, furigana and audio rights remain real gates; dictionaries alone are not a curriculum.
- Admin roles/allowlists/session flow await actual editorial need; dormant hosted account data needs a separate retention decision.
- Do not revive obsolete account QA or assume no users exist.

- [x] Inspect current code/history and adopt the user-approved no-login direction.
- [x] C2-R.0: revise plan and consolidate active docs/history (actual checks in progress log).
- [ ] C2-R.1: shared public interface, local quiz resume/history.
- [ ] C2-R.2: remove obsolete code/config/dependencies/tests/jobs; content-only API/permissions; automated gates and clean local commit.
- [ ] Review any hosted privilege/data operations against explicit scope, no automatic deletion.
- [ ] Only after C2-R completion, start authorized C3 N5 content.
- [ ] C4–C6 follow corresponding user prompts.

Exact next implementation task: C2-R. Read plan/workflow/progress/git state; begin R.1 from the verified kana UI and complete R.2 before C3. Do not remove only documentation and claim runtime cleanup, continue learner Auth QA or implement later modules during cleanup.
