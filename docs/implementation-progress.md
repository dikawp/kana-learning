# Implementation progress

Read `implementation-plan.md` and `docs/implementation-workflow.md` before continuing. This log distinguishes implemented work, verification, and external checks still needed.

## P0-A — Baseline, recovery, and implementation workflow

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
