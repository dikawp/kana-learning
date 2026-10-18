# Implementation progress

**Current authority (18 October 2026): C1–C6 user checkpoints supersede the old P0/phase execution sequence.** P0-A/P0-S below are historical work. Migration/export/backup rehearsals and manual verification requirements are superseded; do not repeat them. There are no legacy compatibility requirements. C2 is authorized below; C3–C6 await their prompts. Managed password recovery is part of C2, separate from excluded database recovery rehearsals.

## C2 — Backend, database, login, persistent progress

Starting commit: `0a17e02b562fc0c1d3db99b241d1719ba7113a41`; working tree clean. Read plan/workflow/progress/history and current frontend contracts. No applicable AGENTS.md found in repository/checked ancestors. C1 work is reused; no guest migration, manual QA, backup rehearsals or deployment.

### C2.1 — Architecture and baseline (implementation starting)

- Running C1 aggregate baseline. Official Elysia Next route/Node/Vercel, Supabase SSR/password/Drizzle and Drizzle migrations documentation checked. Use Node route handlers, per-request server Supabase SSR cookies, verified `getUser`, private SQL schema, bounded pooled Postgres.js/Drizzle, explicit ownership plus transaction-local RLS.
- No environment files or configured service credentials found. Docker CLI exists but Docker Desktop Linux engine is unavailable (missing named pipe). Do not start unrelated infrastructure or access an undesignated database. Use isolated embedded PostgreSQL (PGlite) for executable SQL/migration/constraint/RLS/service tests; add an opt-in designated disposable network PostgreSQL path for multi-connection checks. Hosted Supabase email/refresh and Vercel integration remain external checks, not passing claims.
- Account practice will be separate from the C1 guest route/storage. New account page provides server-driven kana flashcards/quizzes/history; no local familiarity import. Supabase handles credentials/recovery; the application never stores passwords.
- Next: implement schema/migrations/repeatable seed, auth/session contracts and validated Elysia APIs, then connect account UI and run automated boundary/persistence/concurrency regressions.

### C2.2 — SQL foundation and API contracts (implemented; automated verification ongoing)

- Added private `learning` Drizzle schema: managed-auth-linked profiles, repeatable 208-kana seed, per-account familiarity, quiz sessions/questions/answers and payload-hashed mutation receipts. Composite foreign keys enforce session/question ownership; uniqueness and score/option constraints protect integrity. Text kana keys reuse the verified fixture directly; general dictionary/material/release entities stay future content scope.
- Added transactional service with per-account profile row locks, transaction-local claims, explicit ownership filters, immutable question snapshots, server grading, paginated history and idempotent progress/reset/start/answer/complete operations. Duplicate request IDs with changed payloads return 409. Single correct answers remain familiarity, never mastery/SRS.
- Generated Drizzle migration and custom private-schema grants/RLS migration. NOLOGIN `learning_runtime` is non-bypass; runtime preflight rejects superuser/BYPASSRLS credentials. Scripts require an explicit disposable-development/isolated-preview designation; no production option. No external database has been accessed.
- Added Elysia Node fetch route, bounded JSON reader, strict validation, CSRF origin guard, private caching and consistent safe errors. Supabase SSR cookies/getUser, managed sign-up/sign-in/reset/change-password/sign-out, safe callback allowlist and Next proxy refresh implemented; account UI and full auth automation next.
- First embedded SQL run failed before tests (7 setup-skipped, not passed): custom migration grouped multiple prepared statements. Split migration breakpoints. Rerun: 6 passed / 1 failed; failure is incorrect 400 wrapping of intended 413 body-limit error in Elysia parse handling. Fix the actual error path rather than weaken the assertion. Early typecheck found only script top-level await under ES6 target; wrapped script in async main.
- Next: complete UI, auth/cookie transport and restart persistence tests; correct parse/error semantics and database constraints; run all automated gates and document unavailable hosted/network checks.

### C2.3 — Account UI, Auth protocol and restart persistence (implemented; automated-tested with static repairs ongoing)

- Added independent `/account` practice/dashboard, managed sign-in/signup/recovery forms, password update, sign-out, database-backed flashcards, server-issued quiz feedback/review/resume and paginated result history. Header links accounts; guest route/storage remains separate. Mutations retain request IDs across retry clicks; no optimistic score or local guest merge.
- Added real Supabase SSR/JS SDK tests using synthetic isolated HTTP transport: HttpOnly/Secure/SameSite cookies, fresh-request getUser verification, expired-session refresh and cookie replacement, token rejection before SQL, logout cookie clearing, fixed redirects and managed password flows. These test protocol integration, not a hosted Auth server or actual email delivery.
- Backend suite: 14/14 passed (7 database/API, 6 Auth/config, 1 disk-backed PostgreSQL close/reopen). RLS and constraints run under the actual NOLOGIN runtime role; SQL state survives new service objects and engine restart. Embedded concurrent requests are serialized by PGlite; multi-connection PostgreSQL verification remains separate.
- Initial UI lint identified synchronous-effect/ref-render issues; replaced render state with stateful retry operations and asynchronous fetch callbacks, without disabling rules. Remaining static diagnostics in test environment parameter types and a cleanup guard are being fixed explicitly. Added an explicit non-null completed score constraint because PostgreSQL CHECK treats NULL as passing otherwise.
- Drizzle Kit's old esbuild loader introduced 4 moderate audit findings. Added a narrow `@esbuild-kit/core-utils → esbuild 0.25.12` patched override, checked official package metadata, reran actual Drizzle schema generation successfully (no unintended changes), and `npm audit` returned 0. No advisory filtering, forced downgrade or disabled check. Deprecated loader notices remain documented.
- Next: finish UI/retry/session automation, generate/test the score constraint migration, add a strictly designated disposable network-PostgreSQL suite/CI service and setup documentation, then run all quality gates.

### C2.4 — Passing local vertical slice and production route verification (automated-tested)

- `npm run check` passes: native 1/1, frontend 30/30, backend 18/18 (49 distinct tests, no skips/failures), lint, strict typecheck, production build and actual Next/Elysia loopback HTTP smoke. Node build includes /account, /account/password, /auth/callback, API catch-all and Proxy with no Bun listener/runtime. External service configuration is explicitly blank for production smoke.
- Frontend tests cover independent guest use, unconfigured accounts, managed credential forms, protected password changes, sign-out/account-switch state clearing, no optimistic familiarity, stable request-ID retry and persisted-result review. Next tests verify code/token-hash callbacks, safe redirects, refresh cookie forwarding and private cache headers.
- Production HTTP smoke initially failed: empty-string URL configuration triggered an unhandled Zod refinement URL constructor, yielding generic SERVICE_UNAVAILABLE. Guarded refinements and added empty/secret-key configuration regressions; rerun proves the intended safe AUTH_UNAVAILABLE response, guest availability and private session/404 envelopes. No assertions relaxed.
- Restricted SQL grants tightened to only required operations/columns; runtime cannot edit seeded kana, question snapshots, accepted answers or receipts. Null completed-score constraint migrated explicitly in 0002 and tested. Migration scripts have no runtime URL fallback and no production execution option.
- Added strict new-empty-loopback network PostgreSQL suite and disposable CI service to prove independent pooled contention when available. It is not in default tests and has not run locally: Docker engine unavailable, no designated network URL. Remote CI, real Supabase email/confirmation/recovery/revocation, provider pooler/TLS/region and Vercel remain unavailable external checks, not passing claims.
- Updated plan, workflow, README, blank .env.example and docs/backend-setup.md with actual paths/contracts and configuration. No backend tasks for later content/SRS modules or migrations of guest data.
- Next: verify lockfile with clean isolated npm ci and the same aggregate gate, audit/generator consistency, review exact diff/secrets and make focused local commit(s). Preserve the unrelated running dev server; no deployment or production access.

### C2.5 — Clean installation and final verification (implemented and locally automated-tested)

- Clean `npm ci --no-audit --no-fund` passed (449 packages) in `C:/Users/ramad/AppData/Local/Temp/kana-c2-verification-926dfae559f843c89cd62f3d62ec14f7`. Only allowlisted source/config/tests/assets copied; no `.git`, environment credentials, personal/production data. Initial clean aggregate passed 49 tests plus lint/typecheck/build/loopback HTTP; subsequent target-guard additions passed all 19 backend tests, lint and typecheck there. All **139** allowlisted source/config/fixture/asset SHA-256 hashes match the final workspace. Deprecated esbuild-kit/whatwg notices and the unrelated home-lockfile warning remain visible, not suppressed.
- Final original-workspace `npm run check`: **exit 0**, native **1/1**, frontend **30/30**, backend **19/19** (**50 distinct tests**, zero skips/failures), lint, strict typecheck, production build including TypeScript, automated loopback production HTTP integration. Task-owned HTTP servers stop in finally; existing dev server is preserved. Test database close/reopen is persistence verification, not a backup/restore exercise.
- `npm audit`: **exit 0, 0 vulnerabilities** after clean install including dev dependencies. `npm run db:generate -- --name=c2_consistency`: no schema changes, nothing to migrate; no external DB accessed. Targeted dependency tree exits 0 with Elysia 1.4.30, Supabase SSR 0.12.7 / JS 2.118.0, Drizzle ORM 0.45.4 / Kit 0.31.11, Postgres.js 3.4.9 and PGlite 0.5.10. React/Next/runtime baseline from C1 retained.
- New database-target guard is independently tested before opening any connection: explicit non-production APP_ENV/target for scripts, no fallback to DATABASE_URL, VERCEL_ENV=production refused, network tests require an unambiguous loopback kana_c2_test_* URL and disposable flag, query-string host overrides rejected, malformed URLs redacted. Network cleanup removes only the random role this suite actually created. This suite still awaits a running designated PostgreSQL server; no skipped network test is counted as passed.
- Guest root, progress hook/store, dataset and frozen 208 fixture have no C2 diff. Existing history/P0/C1 outcomes remain intact. No actual Supabase project, email delivery, pooler, paid service, external database, manual QA, production data, backup rehearsal, push or deployment was used.
- Status: **C2 implementation complete and locally verified**. **Awaiting external integration verification:** genuine isolated Supabase email confirmation/recovery/refresh/revocation, restricted pooler/TLS/region configuration, multi-connection PostgreSQL test and remote CI/Vercel execution. No claim that these occurred. The code/automated entrypoints are ready; no fabricated credentials, content approvals or results.
- Final commit intent: `Add C2 account backend and durable kana practice`. Review/stage only C2 paths, verify complete staged whitespace and commit/status; actual hash is reported after commit verification. No unfinished source changes are intended to remain; the source-only temporary verification copy remains outside the repository.
- **Handoff:** read plan/workflow/log/status; configure only a genuinely designated isolated environment using docs/backend-setup.md before external checks. Do not target production, run a backup/restore rehearsal or infer permission to deploy. C3–C6 await their user prompts; no kanji import, SRS or later module work has started.

## C1 — Simplify and stabilize the frontend

Starting commit: `805f6f31c2f4b1e2a53161e65ec8d77a5e7f0ac7`. Starting tree: only untracked `implementation-plan.md` from planning; updating/tracking it is authorized by C1. No applicable AGENTS.md found in repository/checked ancestors. No backend work authorized.

### C1.1 — Baseline and revised workflow (implemented; automated baseline in progress)

- Read plan/workflow/progress/history and existing hooks/components. Reuse Next 16.4.2/npm reconciliation from P0-S and frozen 208-entry fixture from P0-A. Native baseline: 21/21 passed. Lint/typecheck being captured; known missing `pronunciation` and Hooks/type findings remain in current code.
- Updated workflow to C1–C6 policy: automated-only verification, no migration/export/restore or manual QA, focused commits and isolated infrastructure. Historical progress remains intact.
- Official Next upgrade/support, Node release policy and React 19 documentation checked. Node 22.22.0 remains supported; Next 16.4.2 matches current official docs. Complete React/type compatibility instead of repeating the Next upgrade.
- Next: replace obsolete plan requirements; remove export modules/tests while retaining the kana fixture; implement frontend regressions and restore automated gates.

Read `implementation-plan.md` and `docs/implementation-workflow.md` before continuing. This log distinguishes implemented work, verification, and external checks still needed.

### C1.2 — Simplified frontend contracts (implemented; automated regressions next)

- Baseline lint exits 1 with 10 findings; typecheck exits 2 on `pronunciation`; baseline production build passes while explicitly skipping types. Native 21/21 passed. The first sandbox baseline process stalled; elevated checks returned actual diagnostics. No failures suppressed.
- Replaced the execution plan with C1–C6 policy and retained source/ingestion/relational design. Removed legacy guest migration/export/restore and manual QA requirements. C2–C6 remain awaiting prompts; no invented checkpoint scopes.
- Removed obsolete P0-A recovery page/modules/docs/tests/server and UI link; these are recoverable through commit a997c36. Retained the independent 208-entry fixture. Renamed the actual dataset/type/UI field directly to `romaji`, without adapters.
- Added pure search and Fisher–Yates quiz/results modules; reset flashcard sessions by pool identity. Quiz now uses explicit feedback/Next/Cancel with synchronous submission/completion guards and no timers. Added accessible control labels, table headers/Japanese language, session score/familiarity wording, loading/error UI and resolved-theme toggle with stable markup.
- Replaced effect-based guest storage with a validated external store: new key `kana-learning:guest:v1`, safe SSR snapshot, read-only hydration, known-ID filtering, guarded writes with in-memory status, cross-tab snapshot replacement/reset policy. Old keys are neither read nor converted. localStorage concurrent writes remain best effort, not account synchronization.
- React/DOM 19.3.1 and React types 19.3.0 installed; updated incompatible cmdk/vaul peers and pinned prior floating Geist/next-themes. Incremental install emitted transient old React/type peer warnings; clean install/tree check required before completion. Native ESM package semantics declared. Added pinned Vitest/RTL/jsdom/axe for automated tests (jsdom 26.1.0 supports current Node; latest jsdom requires a newer patch).
- Removed build type bypass; consolidated duplicate mobile/toast hooks, synchronized responsive/carousel state through subscriptions, and removed random skeleton render to resolve real lint findings without disabled rules.
- Next: implement/run synthetic domain, React storage/hydration, lifecycle and accessibility regressions; then fix actual failures and run all quality gates from a clean npm install.

### C1.3 — Automated regression suite and first failures (implemented; fixes under verification)

- Added 23 initial Vitest domain/React tests plus the retained native fixture. Coverage includes all filter group/script combinations, full-width/case queries, pool shrink/empty/reveal, duplicate answers, quiz cancel/unmount/results, invalid/blocked/quota storage, cross-tab resets, StrictMode/remount and SSR hydration. Scoped axe semantic rules check control names/ARIA/table structure; jsdom has no layout engine and no visual/contrast proof is claimed.
- First run: 20 passed / 3 failed. One actual UI defect: question-count select lacked its label ID; fixed. Two test expectation issues: kana substring search legitimately matches combinations (`し` includes `しゃ`), and raw HTML serialization differs from DOM entity normalization; corrected expectations without changing product search or suppressing hydration diagnostics.
- Typecheck additionally caught invalid Testing Library `exact` options; removed (role name string matching is exact by default). React 19 application types otherwise compile. Automated role inspection exposed an existing Progress primitive bug: it consumed value for CSS but never forwarded it to Radix, leaving every bar indeterminate; fixed and added numeric ARIA assertion.
- React peer tree command passes after install; initial transient peer warnings are not final mismatches. Removed obsolete Vitest esbuild option because Vite now uses Oxc. No manual QA performed.
- Next: rerun tests/lint/typecheck, correct remaining failures, update README/CI and complete clean-install/build/audit evidence.

### C1.4 — Passing regression/static/build checks; clean-install check (automated-tested; install retry needed)

- Native fixture passes; final expanded frontend suite is 24/24 passed across five files, including actual Radix filter changes and real next-themes system-change/toggle persistence. Provider test initially failed because jsdom lacks matchMedia; supplied a synthetic media-query source, then the real provider test passed. No browser or visual/manual QA used.
- `npm run lint` and `npm run typecheck` pass. `npm run build` passes on React 19 and explicitly runs TypeScript (no skipped validation). `npm audit --json` returns zero across every severity including dev dependencies. React/type peer-tree inspection passes.
- Added `npm run check` to stop on tests/lint/typecheck/build failures and a read-only GitHub Actions workflow using the same command. Official checkout/setup-node READMEs now specify v7; use those current majors with no persisted checkout credentials. Workflow execution is not claimed because no push is authorized. README now documents 208 entries, actual grouped tables, familiarity/session score, clean storage and automated checks.
- Disclosure retains its button/focus and exposes expanded state; Progress now forwards numeric values to Radix. Removed stale spelling and build bypass. No rules disabled.
- Clean `npm ci --no-audit --no-fund` attempt failed with Windows EPERM unlinking the native lightningcss binary. This is an actual OS file-lock failure, not a passing clean install. Next step: identify only task-owned lingering processes, resolve the lock safely, retry npm ci and run the aggregate gate; preserve unrelated processes/work.

### C1.5 — Isolated clean-install verification (in progress)

- Identified an already-running `next dev` process for this workspace holding the lightningcss native DLL. It is unrelated to this checkpoint's tests and has been preserved. No process was stopped. The failed npm ci partially removed dependencies; `npm install --no-audit --no-fund` is completing the workspace installation without deleting the loaded binary.
- Created a disposable source-only verification directory: `C:/Users/ramad/AppData/Local/Temp/kana-c1-verification-89fbfe7cfca4485db6cfcb698512adc3`. Copied only an explicit allowlist of frontend source/tests/config/manifests/assets; no `.git`, environment files, credentials, databases or production data. Running clean `npm ci`, aggregate `npm run check`, audit and dependency-tree diagnostics there. This is test infrastructure, not a backup/restore workflow.
- Registry download logs show successful HTTP 200 responses for previously uncached archives; installation is slow, not yet a passing clean-install claim. Deprecated transitive `whatwg-encoding` warning remains visible; no suppression or force flags.
- New CI setup follows official [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) READMEs; actual remote workflow execution is pending an independently authorized push. [Vitest configuration](https://vitest.dev/config/) documents the test setup. No remote CI result is fabricated.
- Next: await the actual install/check outputs, compare verification source hashes to this workspace, then record final results and commit C1 locally. No C2 work.

### C1.6 — Reproducible clean install verified (automated-tested)

- Isolated `npm ci --no-audit --no-fund`: exit 0, 405 packages installed, no peer/engine bypass. Isolated `npm run check`: exit 0; native fixture 1/1 and frontend 24/24, lint, typecheck and production build all pass. Next explicitly runs TypeScript. `npm audit`: exit 0, zero vulnerabilities including development dependencies.
- All 94 allowlisted source/config/fixture/asset SHA-256 hashes match the workspace. Manifest/lock/tsconfig hashes still match after workspace dependency completion. The baseline fixture itself is unchanged (SHA-256 `7B56ECB95981835A5D54DC1A94C0FC080FEE1E7C0F659D0E14D29FB8ACB94348`). This verifies the isolated checks ran the actual C1 code, not a diverging copy.
- Isolated `npm ls --all --json`: exit 0, but reports the same two optional extraneous Sharp/WASM entries as P0-S (`@emnapi/runtime@1.11.3`, `@img/sharp-wasm32@0.35.5`). Do not describe the tree as warning-free; no invalid React/type peer is reported. No lock entries were deleted to hide them.
- Workspace `npm install --no-audit --no-fund`: exit 0, dependencies complete. npm leaves three ignored temporary native-package directories locked by the existing dev process; cleanup warnings are recorded, no deletion/termination attempted. The isolated build also warned that an unrelated home-directory lockfile was ignored; no project config was changed to hide that environment warning.
- Final aggregate gate is running in the original workspace too; native/frontend tests and lint passed, typecheck/build pending at this entry. Final next step: capture that exit code, review/stage exact C1 diff and whitespace, commit locally and verify status. No manual QA, production data, database reset, push or deploy.

### C1.7 — Completed checkpoint and handoff (implemented and automated-tested)

- Original workspace `npm run check`: **exit 0** after dependency completion: native fixture **1/1**, frontend **24/24** (25 distinct tests total; no skips/failures), configured lint, strict typecheck and production build including TypeScript validation. Same gate also passed after isolated clean npm ci. Baseline's 10 lint errors, absent-field typecheck failure and type-bypass build are resolved, not suppressed.
- Requested frontend contracts are covered: normalized search/intersected filters; reset index/reveal on pool changes; safe validated guest hydration/persistence/error status and cross-tab reset; quiz duplicate/cancel/empty/results lifecycle; direct `romaji` naming; resolved/system theme with stable hydration; named controls, numeric progress ARIA, table headers and Japanese language. Existing three modes and all 208 kana entries remain operational under automated tests.
- Plan/workflow use C1–C6 and no-user policy. Removed obsolete migration/export/recovery requirements and source/tests. Historical P0-A/P0-S evidence remains; verified fixture and Next/npm security work are reused. No backend/API/schema/import/auth feature, secret changes, database operations, manual QA, push or deployment performed.
- Remaining non-blocking environment/tool notices: transitive whatwg-encoding deprecation; two reported optional Sharp/WASM extraneous entries; ignored native temporary directories locked by the existing dev server. No audit finding. Existing dev server preserved. Temporary verification copy remains outside the repository; no environment/secret files were copied.
- External distinction: CI workflow **implemented**, equivalent commands **locally tested**; remote Actions/Vercel execution **not performed**. No manual verification or approval is required by this checkpoint. These are not claims of deployed behavior or comprehensive visual accessibility.
- Final review: exact C1 file scope and unchanged fixture checked; full staged whitespace and commit/status verification follow. Focused local commit title: `Complete C1 frontend stabilization and simplify workflow`; actual hash is reported after commit verification rather than embedding a self-referential hash here.
- **Handoff:** C1 is complete. Read current plan/workflow/log/status before continuing; wait for the user's C2 prompt to define its goal, dependencies and acceptance criteria. Do not reinterpret superseded phase 2 as authorization for backend work. No unfinished C1 source changes are intended to remain.

## P0-A — Baseline, recovery, and implementation workflow (historical; requirements superseded)

Date: 17 October 2026 (Asia/Jakarta). Starting commit: `9bf0c966d039cf0716935693e10394f287a2a0a9` (`simple update UI V.0.1.1`).

Starting working tree: no tracked changes; existing untracked `implementation-plan.md` from the prior planning task. Preserve that file unchanged and leave it outside the P0-A commit. No applicable `AGENTS.md` found in repository or checked ancestor locations. Recent history was inspected; no implementation work after the plan exists.

Scope: workflow/log, frozen kana IDs/glyphs, read-only guest progress backup/recovery, minimal contract tests. No framework upgrade, search/index/storage-persistence fixes, authentication, backend, production access, or deployment.

### A1 — Verify current code and record baseline (tested; application checks blocked)

- Read the plan and current dataset, types, root page, progress/filter hooks and progress UI; verified storage key `kana-learned-characters` and read/write-on-mount effects. Current hook has no parse/storage guards. Recovery must not mount it.
- Runtime: Node `v22.22.0`, npm `10.9.4`; no installed `node_modules` at start. `npm run build` and `npm run lint` both exited 1 because `next` was unavailable. This is an environment/dependency blocker, not a passing application check.
- `npm ci --offline --ignore-scripts --no-audit --no-fund --cache .cache/npm` exited 1 (`ENOTCACHED` for the locked Zod archive). A subsequent network attempt with `--fetch-retries=0 --fetch-timeout=20000` also exited 1 (`Exit handler never called!`); its debug log shows registry requests failing `ENOTFOUND`, including TypeScript. Neither attempt established a usable install. No dependencies/framework versions or lockfiles changed.
- A read-only import of the real TypeScript dataset counted 208 records / 208 unique IDs, 104 per script. Replaying the current search predicate for `shi` reproduces `Cannot read properties of undefined (reading 'toLowerCase')`; leave this known defect for the next authorized checkpoint. The plan also records out-of-range flashcard indices, transient quiz score, and build-error bypasses; none is fixed by P0-A.
- Blocker: application build/lint/typecheck require locked dependencies. `next.config.mjs` already ignores build lint/type errors; P0-A does not strengthen or weaken that configuration.
- Exact next step: record checkpoint workflow, freeze the verified dataset independently, then implement recovery without calling storage setters or the current hook.

### A2 — Establish checkpoint workflow (implemented and inspected)

- Added `docs/implementation-workflow.md` with per-checkpoint scope, evidence, progress updates, isolated tests, secret/production restrictions, explicit local commits and excluded features.
- Decision: use Node's built-in test runner for these small data/export contracts. No new test package or framework upgrade is necessary; later React interaction work can add its own appropriate tooling.
- Verification: compared workflow rules against the P0-A request; all requested rules are represented. No unrelated changes were altered.
- Exact next step: preserve all 208 ID/glyph pairs in a provenance-labelled fixture and add a test comparing it against the real source dataset.

### A3 — Freeze kana baseline and minimal contract tests (implemented and tested)

- Added `tests/fixtures/kana-baseline-v1.json`: all 208 ordered ID/glyph/script triples, schema version, starting commit, source path and Git blob `20a43825628f7dab969b93cc321ad3380b38f10e`.
- Before capturing, compared the working dataset text to `git show` at the baseline commit; they matched after line-ending normalization. `lib/kana-data.ts` remains unchanged. Do not regenerate this fixture from future changed data to make a failing test pass; intentional curriculum changes need a separately reviewed migration/fixture version.
- Added `tests/kana-baseline.test.mjs` and `npm test` using Node's built-in runner. Directly imports the actual TypeScript dataset; no regex data extraction, eval, new package, or lockfile change.
- Verification: `npm test` exited 0, 1/1 tests passed, no skips; compares all 208 triples/order and uniqueness/script counts. Node reports the existing package's missing module type as a warning; it is not suppressed, and package module semantics are unchanged.
- Blockers: full application checks still lack a usable dependency install. This native suite is not a replacement for typechecking or browser tests.
- Exact next step: implement the standalone recovery page and test raw-value round trips, malformed/missing storage, blocked reads, and failed downloads without storage mutation.

### A4 — Read-only export and recovery verification (implemented and contract-tested)

- Added standalone `public/guest-progress-backup.html` and two native browser modules. The existing ProgressCard gains a link only; the progress hook and persistence behavior remain unchanged. The page reads only `kana-learned-characters`, only on an explicit export click, and contains no storage setter/remover/clear calls.
- Version 1 backup preserves the exact raw string or explicit absence marker, source origin/key/baseline and capture time. Duplicate/unknown IDs and corrupt data are retained. Denied storage is a failure, never a fabricated empty backup.
- Saved-file verification decodes the envelope locally and optionally downloads the exact original value; it never restores data. Added `docs/guest-progress-recovery.md` with the direct URL/origin limitation and future restore handoff.
- Added native tests for raw/Unicode/empty/malformed/unknown/duplicate round trips, missing vs stored-null values, denied getters/reads, unsupported envelopes, download resource cleanup/failure, explicit page event behavior and stale file-read races. Mutation methods fail tests if invoked.
- Initial `npm test` passed but repeated 13 tests because a test file exported a shared fake browser. Moved the helper to `tests/helpers/browser.mjs` so final evidence counts distinct tests once; no failure was hidden.
- Exact next step: run the deduplicated suite and isolated browser smoke test; record actual download/save and original-storage checks separately from mocked contract verification.

### A5 — Verify recovery in an isolated real browser (tested)

- Added `npm run test:recovery-browser` / `tests/serve-recovery.mjs`: loopback-only, random-port, allowlisted static assets plus a test-only synthetic-storage harness. No real user storage, backend, or remote data is used.
- The first sandboxed server/browser connection timed out; a direct local fetch reported `EACCES`. Running the same isolated server with approved local-network execution allowed browser access at `http://127.0.0.1:50454`.
- Browser flow: seeded `  ["h-a", "k-shi", "h-a", "unknown-id"]` plus trailing newline; opened the actual static recovery page; downloaded the versioned backup; selected that saved file; saw **Verified version 1 backup**; downloaded the extracted original; returned to the harness and saw **PASS: original storage string is unchanged**.
- Verification found a potential loss in plain UTF-8 extraction of malformed Unicode code units. Final extraction is a JSON-encoded original string (`kana-learned-characters-original.json`); added a lone-surrogate regression and reran the final browser extraction. Node decoded the actual saved backup and extraction and asserted both equal the exact synthetic original. No real progress was accessed.
- Final contract command: `node --experimental-strip-types --test --test-reporter=spec tests/*.test.mjs`, exit 0, **21/21 distinct tests passed**, zero failures/skips/todos. The existing module-type warning remains visible. Syntax/HTTP asset checks and final diff review follow below.
- Synthetic browser downloads are in the local Downloads directory; they are not application content or committed fixtures. No production/deployed verification is claimed.
- Exact next step: stop the isolated servers, remove this checkpoint's failed-install scratch files, review the exact checkpoint diff and make a focused local commit. Keep the prior untracked plan unchanged.

### A6 — Final review and checkpoint handoff

- Stopped both local test servers. Removed only this run's failed-install `.cache` and partial `node_modules` after resolving/validating their absolute paths inside the workspace; neither existed at checkpoint start. Synthetic browser downloads remain outside the repository.
- `node --check` passed for both recovery modules and the test server; `git diff --check` passed. Reviewed the existing Button's `asChild` support for the new link. Browser loaded the actual HTML/module assets through the isolated static server; Next.js rendering of the link remains unverified because dependency installation is blocked.
- Staged whitespace review additionally caught a new blank line at EOF in the shared test helper (not covered by the earlier tracked-only diff check). Removed it and verified the complete staged diff before the final local-commit amendment. No checks were disabled.
- No changes to the dataset, progress/filter hooks, dependency versions/lockfiles, Next configuration, framework or existing learning behavior. Existing search, index, hydration, score and build-safety debt is explicitly deferred.
- Commit policy: stage only P0-A files and record them in a focused local commit titled `Add P0-A baseline and read-only guest recovery`. Preserve the starting untracked `implementation-plan.md` unchanged outside that commit. The commit containing this handoff is discoverable with `git log -1 --oneline`; final response reports its actual hash after commit verification.

| P0-A requirement | Status and evidence |
| --- | --- |
| Starting code/workflow/baseline | Implemented and inspected; starting commit, existing plan and failed checks recorded in A1–A2. |
| Preserve all 208 IDs/glyphs | Implemented and tested against the real dataset and frozen Git-backed fixture. |
| Recoverable non-destructive export | Implemented; contract-tested for valid/corrupt/missing/blocked data; actual local-browser saved-file verification and lossless extraction passed with unchanged synthetic storage. |
| Minimal tests | 21 distinct native tests passed, no skips; no new package dependency. |
| Full application build/lint/typecheck | Awaiting a usable locked dependency install; build/lint attempts failed, registry DNS failed. No passing full-app claim. |
| Deployed-origin recovery | Not performed; no push/deployment/production data access is authorized. |

**Checkpoint handoff:** P0-A's implementation and local recovery contracts are verified; full Next integration remains awaiting dependency-enabled verification. This does not mark the wider P0/phase 1 complete. Exact next step, when a subsequent checkpoint is authorized: read plan/workflow/this log and `git status`, preserve the untracked plan, restore locked dependencies in a network-enabled development environment, then run `npm run build`, `npm run lint`, and `node node_modules/typescript/bin/tsc --noEmit --incremental false` to capture actual application diagnostics before implementing that checkpoint. Do not repeat the frozen fixture/export work or silently fix the deferred P0 defects. The direct recovery page is `/guest-progress-backup.html`; see `docs/guest-progress-recovery.md` for isolated reproduction and restore boundaries.

## P0-S — Dependency security before the next feature checkpoint (historical; prior handoff superseded)

Date: 17 October 2026 (Asia/Jakarta). Starting commit: `a997c363db1d6b3c3101e9a074e0cc88ecdcab0c`.

Authorization: user requested fixing vulnerable dependencies before checkpoint 2. This authorizes the necessary supported-framework/dependency migration and compatibility tooling, not implementation of checkpoint 2 or unrelated learning features. Read the plan, workflow, progress log, working tree and recent history before changes; no applicable repository AGENTS.md exists.

### S1 — Audit, preserve existing work, and verify baseline (tested)

- Starting tree: user-modified `package-lock.json` and existing untracked `implementation-plan.md`. The lockfile's only starting difference is root/package name `my-v0-project` → `kana-learning-app`; preserve that correction while regenerating resolutions. Saved an exact pre-change lockfile and patch in a temporary directory before mutation. The plan remains unchanged/untracked.
- Node 22.22.0/npm 10.9.4; installed dependencies now available. Prior read-only audit confirmed 7 affected packages: critical Next 14.2.16/tar 7.4.3; high browserslist/lodash/nanoid/postcss/source-map-js. tar is a Tailwind oxide build-tool dependency. Advisory conditions vary; this is not a claim that every issue is reachable in the deployed app.
- Baseline `node node_modules/typescript/bin/tsc --noEmit --incremental false` exits 2 with the existing absent `KanaCharacter.pronunciation` lookup. Baseline `npm run lint` exits 1: legacy Next attempts to auto-install already-present TS dependencies through the empty pnpm lockfile, then sandbox realpath permissions fail. No resulting manifest/lockfile mutation was observed. Baseline native tests: 21 passed, no skips.
- Verified official npm metadata: Next 15.5.24 still pins PostCSS 8.4.31; Next 16.4.2 pins patched PostCSS 8.5.23 and accepts the existing React 18.3.1 peer. Choose Next 16.4.2 with unchanged React major rather than forcing legacy nested overrides. Node 22 meets its >=20.9 engine. New lint setup must use ESLint CLI because Next 16 removes `next lint`/the Next `eslint` option. Keep any pre-existing typecheck/lint defects visible rather than broadening into feature fixes.
- Exact next step: select/pin compatible patched dependencies, migrate the obsolete lint entrypoint, regenerate the npm lock preserving its corrected names, then audit the resulting actual tree before checking application compatibility.

### S2 — Install supported framework/security dependency updates (implemented; verification ongoing)

- Pinned Next 16.4.2, Tailwind/PostCSS plugin 4.3.3 and PostCSS 8.5.30; retained React 18.3.1 and the current UI. Official registry peer/engine metadata was checked before installation. No `--force`, legacy peer bypass or nested override was used.
- Replaced removed `next lint` with ESLint CLI/core-web-vitals flat configuration and added explicit `npm run typecheck`. Removed only the obsolete Next `eslint` config property; its pre-existing `typescript.ignoreBuildErrors` is unchanged, and independent typecheck remains mandatory/reported.
- Selected npm as the package manager, removed the empty pnpm lockfile that confused legacy tooling, and updated README installation/runtime commands. Existing user lockfile name correction is preserved. First install succeeded: 311 added / 9 removed / 24 changed packages, exit 0.
- First lint tool selection ESLint 9.39.4 emitted an end-of-support warning. Verified official support policy (9.x EOL 2026-08-06) and Next 16.4's ESLint 10 support; replace it with 10.13.0 rather than suppressing the warning. Declare Node >=22.13 <23 for the supported lint/runtime combination.
- Exact next step: complete ESLint 10 installation, audit all actual resolutions, apply only compatible remaining transitive updates, then run application checks and local browser regression smoke tests.

### S3 — Resolve lint-tool supply chain without bypasses (implementation ongoing)

- ESLint 10 installation succeeded but `npm ls eslint --all` identified incompatible declared peer ranges in Next's bundled import/JSX accessibility/React plugins. Actual lint executed and surfaced six pre-existing React Hooks/impure-render errors. Independent typecheck still reports only the original missing `pronunciation` field.
- Audit after Next/Tailwind upgrade: zero critical, seven high, including the newly introduced `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` chain. Verified registry latest braces is 3.0.3, within the affected <=3.0.3 range; a speculative override cannot fix it. Do not downgrade Next/lint config to the audit's suggested older major just to hide the chain.
- Replace the not-yet-committed Next lint bundle with supported ESLint 10 + official JS/TypeScript recommended presets and React Hooks recommended rules. Their peer metadata explicitly supports ESLint 10. No lint rule is disabled and app/test files are not excluded. Next-specific lint rules are not claimed; re-evaluate that optional plugin only when its dependency chain is patched. This retains React Hooks checks and adds ordinary TypeScript diagnostics rather than suppressing the six known findings.
- Exact next step: install the reduced lint set, update remaining compatible transitive resolutions, require zero audit findings and a valid dependency tree, then run build/tests/typecheck/lint and record failures without expanding the feature scope.

### S4 — Remediate actual resolutions and run application checks (tested; clean-install check next)

- Reduced lint install removed 171 packages. `npm audit fix` without `--force` changed six compatible transitive packages and reported **0 vulnerabilities** across 310 audited packages. No audit ignores/severity filtering or vulnerable-package override was added.
- Native test suite: 21 passed, no failures/skips. Independent typecheck still exits 2 on the same pre-change `hooks/use-kana-filters.ts:26` missing `pronunciation` property. Final lint executes successfully as a tool but exits 1 on 10 findings in unchanged app/UI/hooks: six React Hooks/purity findings plus two explicit-any and two unused-runtime-value findings. No rules or diagnostics were disabled to get a green result.
- `npm run build` succeeded with Next 16.4.2/Turbopack and Tailwind 4.3.3. It explicitly reports skipping types under the **pre-existing** `ignoreBuildErrors`; this does not make the typecheck pass. Next added required `jsx: react-jsx` and `.next/dev/types/**/*.ts` to tsconfig; preserve those upgrade changes. React 18 works but Next reports its support as deprecated; a separate React 19 migration remains future work, not a claim that it has already happened.
- `npm ls --all` found two extraneous platform-optional sharp/WASM packages left by incremental installation; no lint-peer mismatch remains. Exact next step: run a reproducible `npm ci` from the updated lock, audit/check the clean tree, rebuild only because the install state changes, and inspect the actual local production UI/backup route. Existing unrelated learning defects remain deferred.

### S5 — Clean installation and production-browser verification (tested)

- `npm ci --no-audit --no-fund` with the temporary npm cache completed successfully (309 packages, exit 0). An unfiltered `npm audit --json` after the clean install returned exit 0: **0 info, low, moderate, high or critical findings**, including development dependencies. No advisory suppression is present.
- Production build after clean install: exit 0, `/` and `/_not-found` generated. React 18 deprecation and the pre-existing type-validation bypass remain visible warnings. Retained only Next's two required tsconfig changes and restored unrelated JSON formatting to keep the diff focused.
- Local production server: `npm run start -- --hostname 127.0.0.1 --port 4615`; no production account or origin used. Actual browser checks: styled page renders, 208 entries displayed, answer reveal and Got it work, learned count survives refresh, 5-question quiz accepts correct/incorrect answers and displays **4/5 (80%)** with the intended mistake review, Table View contains 208 rows across both scripts, Export guest progress opens the independent recovery page, downloaded backup verifies five local synthetic learned entries. Browser console error log was empty for these exercised paths. Known broken search was not presented as fixed or included in a passing smoke claim.
- Downloaded a synthetic backup from the local production route, selected the actual saved file and observed successful version-1 verification. Public recovery modules/content and the baseline fixture are unchanged. Closed browser tab and stopped the local server after verification.
- Final native contracts after clean install: **21 passed, no skips/failures**. Full typecheck still fails on the original absent `pronunciation`; lint retains all ten findings described below. No app/UI/hook/data/test source files changed in this dependency checkpoint.
- Tree-check limitation: even clean `npm ci` and `npm prune --no-audit --no-fund` leave `npm ls --all` exiting 1 for two **extraneous** optional packages: `@img/sharp-wasm32@0.35.5` and `@emnapi/runtime@1.11.3`. Lock/source inspection shows these belong to Sharp's FreeBSD/WebContainers optional branch; no missing dependency or invalid peer is reported in the final tree. Do not claim `npm ls` passed. This npm 10/platform-optional cleanup issue is separate from the zero-vulnerability audit and functioning Windows native build; pruning reported up-to-date. Do not manually erase cross-platform lock entries to hide it.
- Exact next step: final diff/whitespace review, preserve the user's project-name correction and untracked plan, and commit only the dependency/security-tooling checkpoint. No checkpoint-2 implementation is authorized in this turn.

### S6 — Security checkpoint handoff

| Item | Verified result |
| --- | --- |
| Known npm advisories | **7 affected packages (5 high, 2 critical) → 0** on the clean installed tree, 17 October 2026. This is the current registry result, not a guarantee against future advisories. |
| Framework/styles | Next **14.2.16 → 16.4.2**; Tailwind/plugin **4.1.12 → 4.3.3**; root PostCSS **8.5.6 → 8.5.30**; Next uses PostCSS 8.5.23. |
| Transitive fixes | lodash **4.17.21 → 4.18.1**, browserslist **4.25.2 → 4.29.3**, nanoid **3.3.11 → 3.3.20**, source-map-js **1.2.1 → 1.2.2**. Vulnerable tar is no longer in the selected tree. |
| Reproducibility | npm lock v3, npm 10.9.4, Node >=22.13 <23; clean `npm ci` succeeds. Existing corrected lock project names remain `kana-learning-app`. |
| Passing checks | Native contracts 21/21; Next production build; exercised local production UI/quiz/persistence/recovery; final whitespace check before commit. |
| Failing checks retained | Typecheck exit 2: `hooks/use-kana-filters.ts:26` absent property. Lint exit 1: six React effect/purity findings in root page, carousel, sidebar, mobile hooks and progress hook; two explicit-any findings in root page/quiz; two unused `actionTypes` findings in toast hooks. These files were already present and remain unchanged. |
| Additional warnings | React 18 support deprecated in Next 16; native test module-type warning; two optional extraneous packages make `npm ls --all` exit 1. No invalid lint peer dependency remains. |
| External verification | Not deployed/pushed; no production progress modified. Vercel environment and deployed behavior remain unverified. |

Status: **dependency-advisory remediation implemented and locally verified**; this does not mark the application's wider P0 stabilization or all quality gates complete. Exact handoff: read plan/workflow/log and `git status`, reuse the existing fixture/export/tests, then implement only the next user-requested checkpoint. Address the known source-level type/lint/search/state defects in an explicitly scoped stabilization checkpoint; do not bypass them or claim this security update fixed them. Consider React 19 and the optional-package npm behavior separately when their migration/maintenance scope is authorized.

Local commit title: `Patch vulnerable dependencies and migrate security tooling`; final response identifies the actual commit after verifying it. Keep `implementation-plan.md` unchanged and untracked. The initial lockfile name correction is intentionally retained in the regenerated lockfile.

Technical decisions were checked against [Next 16 migration](https://nextjs.org/docs/app/guides/upgrading/version-16), [Next support policy](https://nextjs.org/support-policy), [npm audit behavior](https://docs.npmjs.com/cli/v10/commands/npm-audit/), [ESLint support policy](https://eslint.org/version-support/), [TypeScript ESLint setup](https://typescript-eslint.io/getting-started/) and [React Hooks recommended rules](https://react.dev/reference/eslint-plugin-react-hooks), plus exact official npm registry package/peer metadata. The Next lint bundle was evaluated and excluded before commit because it introduced an unpatched braces chain and peer-range issues; its rules were never an existing repository lint baseline.
