# Implementation progress

Current authority: public learning without learner accounts, approved by the user on 18 October 2026 (Asia/Jakarta). One shared UI, device-local study state, Supabase PostgreSQL content, Elysia public read APIs. Future admin Auth is separate. Old C2 learner Auth/cloud-progress requirements and their unfinished acceptance are superseded.

Prior P0/C1/C2 outcomes are preserved in [the historical archive](archive/implementation-history-pre-no-login.md) and Git. Archived next steps are not current instructions. Runtime account files still exist until C2-R implementation.

## C2-R.0 — Plan and documentation consolidation

Starting commit: 3c12ca8; tracked working tree clean. User requested an updated implementation plan covering the no-login redesign and removal of unused code/config/docs before the next stage. Scope interpreted as planning and active-document cleanup; no runtime files/dependencies/secrets or hosted resources changed.

### R0.1 — Repository evidence and architecture (completed)

- Read plan/workflow/progress, recent commits, current code/config and exact paths. Reused C1 fixes and verified C2 material/backend work. No applicable AGENTS.md previously found.
- Confirmed app/page.tsx has all three modes while components/account/dashboard.tsx has flashcards/quiz but no TableView. Backend content/learning/Auth responsibilities and account tests/CI/env consumers are mapped.
- Corrected the stale no-user assumption: user screenshots show signed-in activity; never infer empty/disposable hosted personal data from an old prompt.
- Target: public published content, one UI, local familiarity/quiz resume/history and later IndexedDB/FSRS. Removed server-owned learner progress/grading/schedules from future requirements. Auth only for actual future admin work, not a placeholder.
- Exact next step: define explicit removal/replacement inventory and consolidate active docs before validating this documentation task.

### R0.2 — Cleanup plan and documentation (completed; automated consistency checks passed)

- Rewrote implementation-plan.md: evidence/current-vs-target distinction, per-path delete/rewrite/retain inventory, packages/env/CI/scripts/tests, SQL grant/data-retirement boundaries, browser data model, revised APIs, phased C2-R/C3–C6 acceptance and tests.
- Preserved the detailed source/ingestion/romanization/furigana/license investigation; C3 must revalidate pinned formats/rights before import. N5-first/English meanings/Elysia/Vercel/PostgreSQL and local reference persistence remain.
- Applied migration history/journal and frozen kana fixture must remain even if names mention old C2. Dormant hosted data retirement is separate authorization, not folder cleanup. No automatic DROP/reset/Auth-user deletion or credential changes.
- Replaced stale active workflow/README/backend setup; current commands/account code explicitly still exist. Archived original progress once in docs/archive/implementation-history-pre-no-login.md with a superseded-instructions banner. Git retains prior plan/setup; no duplicate active guides.
- Actual changes are documentation only. No application feature/code/env/dependency/migration edits, no network database requests, browser QA, provisioning, push or deployment. No new runtime test result claimed.
- Exact next step: automated local path/link/archive/source-retention/diff checks, then focused documentation commit and handoff to explicitly requested C2-R implementation.

### R0.3 — Automated verification and handoff (completed)

- Node/assert documentation checks passed: 5 active documents, 9 resolved relative Markdown links and 43 verified existing cleanup-inventory paths. Historical progress entries preserved exactly in the archive; the detailed section6 source investigation is retained. Git confirms tracked changes are Markdown only; new archive is Markdown as well.
- git diff --check passed. Reviewed changed paths: README.md, implementation-plan.md, docs/backend-setup.md, docs/implementation-workflow.md, docs/implementation-progress.md and the single historical archive. No runtime/package/env/migration/fixture changes. The first overlong Windows edit command did not run (CreateProcess error206); used focused file patches instead. No hidden partial runtime edits.
- No application tests/lint/typecheck/build or hosted verification rerun for this documentation-only task; historical passing results stay explicitly historical. No external state changed. A focused local documentation commit records this revision; final response reports its verified hash.
- C2-R.0 is complete. Runtime C2-R.1–R.2 is not implemented and the folder is not yet free of learner-account code. Exact next step: explicitly request implementation of C2-R, read the new inventory, baseline current gates, then replace/remove learner contracts with public-content and local-state coverage before C3. No user data deletion is implied.

## Checkpoint status

| Work | Status |
| --- | --- |
| C1 stabilization and useful C2 public content foundation | Prior implemented/verified work; reuse, historical evidence in archive |
| Old C2 learner-account design and pending account hosted QA | Superseded; do not continue |
| C2-R.0 planning/documentation | Implemented; final local consistency verification recorded below |
| C2-R.1 shared public UI/local quiz resume/history | Planned, not implemented |
| C2-R.2 runtime/dependency/config/test/CI cleanup | Planned, not implemented; required before C3 |
| Hosted account-data/credential deletion | Not authorized or performed |
| C3–C6 | Provisional allocation; await corresponding prompts after cleanup |

Exact next implementation task: C2-R. Begin with baseline gates and the existing root kana UI, implement R.1 then complete the inventory in R.2, replace obsolete contracts with meaningful local/content tests and commit verified work locally. Do not call the folder/runtime clean based only on this documentation revision.
