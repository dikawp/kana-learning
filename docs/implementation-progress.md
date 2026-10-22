# Implementation progress

Current authority: public learning without learner accounts. One shared UI, device-local study state, Supabase PostgreSQL content and Elysia public read APIs. C2 learner Auth/cloud-progress scope is superseded. C3-A is complete, C3-B–F are next; C4–C6 await their prompts; no automatic hosted user/table deletion.

## Prior evidence

P0/C1/C2 and planning-only C2-R.0 records are preserved in [the historical archive](archive/implementation-history-pre-no-login.md) and Git. Archived next steps are not current instructions. C1 fixes and useful C2 material infrastructure were reused.

## C2-R — Implemented 22 October 2026 (Asia/Jakarta)

Starting commit: d019fa0; tracked tree clean. Read current plan/workflow/progress/code/history; no applicable repository/ancestor AGENTS.md found. User authorized shared public practice, local quiz persistence and repository cleanup. No subagents, C3 imports, deployment or production operations.

### R1 — Baseline and shared local study

- Baseline npm run check passed: 51 tests, lint, strict typecheck, build and isolated HTTP. No pre-existing failing application gate.
- app/page.tsx now loads a validated public SQL content payload/revision with loading/error/retry. All three existing Flashcard/Quiz/Table modes share it. No learner login, Account link or bundled dictionary fallback.
- Reused filter/card/theme/a11y/domain behavior and the frozen208 fixture unchanged. Familiarity store moved to lib/study/familiarity-store.ts and receives the fetched IDs; root/hooks no longer import the parallel seed dataset. Existing local familiarity key retained without a compatibility adapter.
- Added lib/content/{client,contracts}.ts, lib/study/{contracts,local-store}.ts and hooks/use-study-session.ts. Local quiz state has one active session and last20 completed sessions; maximum262144 serialized characters, bounded schema/prompt/options/IDs validation, no initial writes. Original prompt/answer revision is preserved for results; unknown score fields rejected.
- QuizMode resumes cursor/submitted feedback after remount, stores answer review/mistakes and last completed score across refresh, prevents duplicate/stale submissions/completion, cancels without creating results and clears history separately from familiarity. Denied/quota/corrupt storage permits explicit memory-only practice. Cross-tab events replace state, including clears; concurrent localStorage writes remain best effort.
- Automated frontend evidence:37 tests, including original filter/quiz/theme/a11y/storage contracts and new local-history/reload/duplicate/revision/limits/quota/unknown-ID/public-fetch/retry tests. First attempt caught leftover score destructuring from a CRLF-sensitive edit; fixed source and reran, no assertion weakened.

### R2 — Backend, cleanup and retained migration integrity

- Removed app/account/*, app/auth/callback, components/account/*, lib/account/*, server/auth/*, proxy.ts and mixed server/services/learning.ts. Deleted learner Auth/UI suites, optional network account-concurrency suite/config and its Docker CI job. No compatibility routes or hypothetical admin placeholders.
- Added server/services/content.ts and server/db/access.ts. Elysia now serves public health/content GET only, validated items plus SHA-256 revision/ETag. Unknown queries422, removed learner paths404 and safe outages503/no-store. Health explicitly says it is not a live dependency check. No identity/cookies/learner SQL writes.
- Runtime preflight rejects privileged roles, schema CREATE, table/column writes and dormant personal-table reads. Retained bounded SQL pool/TLS/prepare:false. db schema exports only kana to runtime.
- Preserved0000–0002 SQL/snapshots and fixture unchanged. drizzle/preserved-schema.ts is migration-generation-only to keep dormant definitions in snapshots and prevent accidental DROP SQL. Custom0003_content_read_only revokes old table and column UPDATE grants, leaving kana SELECT. db:generate consistency returned no schema changes.
- Backend11 tests execute actual PGlite migrations twice/seed twice, role/RLS/column-grant/preflight/public API/error/cache/removed-route contracts, genuine CLI guards and disk reopen. A historical-fixture test inserts synthetic dormant records before0003 and proves they survive while runtime access fails.
- Removed @supabase/ssr and @supabase/supabase-js via npm uninstall:9 packages removed; package/lock synchronized, no framework/dependency upgrades. Removed test:postgres command and disposableTestTarget; retained real CLI/seed/target guards.
- Cleaned .env.example and obsolete learner-only .env.local fields; unrelated local lines/credentials preserved, never printed/staged. No provider credential/key rotation, dashboard changes or Auth-user deletion. Updated canonical README/setup/workflow/plan; single historical archive retained.
- Initial typecheck exposed missing KanaCharacter import and stale generated .next route validators for deleted pages. Fixed import, safely removed only workspace .next/dev/types and regenerated installed Next route types. No tsconfig exclusion/check bypass.

### R3 — Designated development SQL and hosted verification

- Verified configured target still matches previously designated Kana-learn development session/runtime pooler identities without printing credentials. Recorded aggregate counts only, no personal row contents.
- Applied reviewed0003 through guarded npm run db:migrate. Only privilege changes; no tables/users/records dropped. Aggregate counts in auth.users and all six dormant learner tables matched before/after. Harmless existing schema/journal notices remain visible.
- Rewrote scripts/db/verify-development.ts for content only: matching target metadata, runtime-only READ ONLY SQL, exact208 content/RLS/table+column permissions, denied dormant-table access and concurrent reads; task-owned local production server verifies anonymous content, ETag304 and removed pages/APIs404 without cookies.
- npm run verify:supabase passed against designated development after the first complete build. No learner Auth SDK/config, emails, new users, progress writes, data reset or admin SQL connection used by this verifier. Existing dev processes remain untouched; task-owned servers stop.
- Remote CI/Vercel deployment, visual QA, browser eviction guarantees and future IndexedDB/SRS are not claimed.

### R4 — Final verification and handoff

- Complete npm run check passed after implementation: native1 + frontend37 + backend11 =49 distinct tests, zero skips/failures, lint, strict typecheck, production build and isolated loopback HTTP. Build has only /, not-found and Elysia catch-all; no learner pages or proxy.
- Added a defensive denied-storage-event getter guard and corrected the displayed script for a resumed quiz. A regression also verifies the persisted last score on the actual page. Final npm run check passed: native1 + frontend38 + backend11 =50 distinct tests, zero failures/skips; lint, typecheck, build and isolated production HTTP all passed.
- npm uninstall audit reported0. Subsequent standard npm audit --json failed on the registry's retired quick-audit endpoint (HTTP400/invalid-tree response), not a vulnerability finding. Full-scope npm audit --package-lock-only then passed with0 vulnerabilities, no severity filter/advisory suppression. Do not claim the failed standard audit passed.
- Final cleanup assertions passed:21 learner-only files removed; no stale Auth SDK/import/env/test:postgres references in runtime/config, no bundled seed-data import in the client, root package/lock dependencies match,9 local docs links resolve. Frozen208 fixture plus all three old SQL migrations and their snapshots are byte-identical. .env.local remains ignored/untracked. No framework upgrade, user/table deletion or deployment. Focused commit hash is reported in the final response after staged review.
- Exact next step: await the user's C3 prompt for N5 ingestion/curation. C2-R is complete; do not repeat account QA or delete dormant hosted data as a prerequisite.

## C3-A — Content foundation (22 October 2026, implemented and automatically verified)

- Starting commit 9884f4e; tracked tree clean. User requested continuation to C3; following the previously proposed order, this implementation slice is C3-A (schema/provenance/level/revisions/publication). C3-B import execution and C3-D/E learning UI are subsequent slices, not claimed complete here. Read current plan/workflow/progress, repository state and source contracts; no applicable AGENTS.md found previously.
- Source verification: jmdict-simplified release3.6.2+20261019180022 dated19 October; exact asset SHA-256 metadata available. Current kanjiapi /jlpt-5 lists79 characters and /kanji/日 returns detail fields, not a list. Confirmed KANJIDIC2 readingMeaning can be null; JMdict preserves form/reading/sense restrictions. Rechecked EDRDG attribution/share-alike/update conditions and KanjiVG license from original documentation. Modern JLPT labels remain approximations; no vocabulary level inferred from kanji or unsupported rights approval.
- Baseline completed:50 tests, lint/typecheck/build and isolated HTTP passed. Implemented23 new reference/editorial tables, subtype/same-entry foreign keys, explicit modern/legacy level evidence, immutable source/revision identities, guarded manifests and active publication. Canonical revision building is idempotent and preserves original annotations/nulls/restrictions. No source acquisition or real review rows inserted.
- Added internal prepareRevision/publishRelease functions and a security-barrier published_materials view. Runtime SELECT is limited to published snapshots; it cannot access base editorial/draft data. Owner-readable base RLS and view execution are intentional, documented boundaries; not a claim that privileged SQL is automatically protected. Source rights/review/checksum failures leave the active release unchanged. Publication is not an HTTP write endpoint.
- Added anonymous bounded kanji/vocabulary list/detail APIs with modern approximate-level filtering, literal search and release/query-bound cursors. Repeatable-read transactions prevent mixed-release pagination. Queries do not derive vocabulary levels from kanji and no dictionary HTTP request happens at learning time.
- The61-test aggregate passed after a prior60-test run passed tests/lint/typecheck/build but failed production HTTP: out-of-range numeric query decoded before range enforcement and reached unavailable SQL. Replaced query coercion at the boundary with explicit validation before dependency resolution, added an unavailable-SQL regression and retained the production422 assertion. Malformed cursors also validate before SQL; no assertion weakened.
- Local SQL suites pass22 backend tests including10 new synthetic foundation contracts; no real approval implied by fixtures. Drizzle consistency generation reports no schema changes. A custom migration scaffold initially overwrote the un-applied0005 draft SQL; restored the actual security SQL before any migration test, and full migration/view/immutable-trigger tests passed. Previous0000–0003 files/snapshots remain unchanged.
- Added acquisition manifest with observed GitHub release SHA-256/size and docs/content-sources.md. Manifest is metadata, not completed byte-download validation, redistribution permission for level lists or N5 curriculum approval. The manifest remains an acquisition plan; C3-B must verify downloaded bytes, source schemas and reuse conditions before imports.

| Work | Status |
| --- | --- |
| C2-R.0 planning/docs | Completed historical prerequisite |
| C2-R.1 public UI/local resume/history | Implemented;38 frontend tests passed |
| C2-R.2 content-only runtime/code/config/test/CI cleanup | Implemented; full50-test/static/build/HTTP gate passed |
| Development runtime-grant migration | Applied, record counts unchanged |
| Hosted read-only content verifier | Passed against final build |
| Hosted user/table deletion | Not authorized or performed |
| C3-A foundation | Implemented; automated and designated-development checks passed |
| C3-B–F | Pending: pinned import, N5 curation, kanji/vocabulary UI, publication completion |
| C4–C6 | Await corresponding prompts |

### C3-A final evidence and handoff

- Applied additive migrations0004/0005 through guarded db:migrate to the previously designated development target after metadata matching. No schema reset, content import, approval insertion or deletion. Aggregate counts for auth.users, six dormant learner tables and kana matched before/after exactly.
- Hosted verify:supabase passed: exact208 kana, read-only runtime/grants, forbidden dormant/editorial base reads, concurrent reads, anonymous Next/Elysia kanji/vocabulary empty catalogs and removed routes404/no cookies. This is not publication-contention testing or evidence of approved N5 content.
- npm audit --package-lock-only passed:0 vulnerabilities. No package/dependency/framework/env changes. Drizzle consistency generation returned no schema changes. Final npm run check passed: native1 + frontend38 + backend22 =61 distinct tests, no skips/failures; lint, strict typecheck, production build and isolated HTTP passed. Focused local commit is reported at handoff.
- Next: C3-B. Download pinned assets to an appropriate ignored cache, validate actual SHA-256/schema/license conditions, add fixture-backed KANJIDIC/JMdict adapters and resumable/idempotent staging. Do not publish merely because dictionary import succeeds; real level-source rights and editorial review remain unresolved. No C4 work, push, deployment or manual QA performed.

- Final rerun inside the restricted filesystem sandbox failed the historical disk-reopen PGlite test with WASM Aborted(), also reproducible alone. The identical isolated test passed without source/assertion changes using elevated temporary-filesystem access. Full gate rerun uses the same permission boundary; no test skips or weaker assertions were introduced.

- Final review:25 focused paths, staged whitespace and credential-pattern guards passed; active documentation links resolve. All nine protected historical SQL/snapshot/fixture files match HEAD, .env.local remains ignored/untracked and package/lock unchanged. Whole C3 is not complete; C3-A only is complete.
