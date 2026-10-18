# Implementation workflow

Revised 18 October 2026 (Asia/Jakarta). Current target: one public learner UI, no learner login/cloud progress, device-local study state, Supabase PostgreSQL content. C2 learner-account scope and unfinished hosted-account acceptance are superseded. C1 fixes/useful public C2 infrastructure remain. The prior claim that no user activity exists is no longer an assumption.

1. Read implementation-plan.md, this workflow, active progress, applicable instructions, git status (including unrelated/untracked changes) and recent commits before every checkpoint. Record starting commit and actual baseline.
2. Implement only the requested task. This revision is documentation-only C2-R.0; runtime cleanup is C2-R.1–R.2, to request before C3. Later C3–C6 remain provisional until their prompts.
3. Reuse verified existing code and complete work; no framework rewrite/upgrade or repeated provisioning without need. Follow checkpoint dependencies/acceptance. Mark replaced scope superseded, never rewrite historical outcomes as new results.
4. After meaningful subtasks update docs/implementation-progress.md with paths, decisions, automated results/failures, blockers and the exact next step. Historical records are in docs/archive/implementation-history-pre-no-login.md; they are evidence, not current execution instructions.
5. Distinguish planned, implemented, automatically tested, unavailable external checks and superseded work. No fabricated credentials, approval, provenance or test success.
6. Run relevant automated tests, lint, strict typecheck and production build for runtime work. Documentation-only work uses link/path/diff consistency checks; do not claim application checks that were not rerun. Do not weaken tests, suppress failures or skip needed checks.
7. No manual QA, exploratory browser testing, visual inspection, manual QA checklist or approval gate. User-provided screenshots are observations, not automated integration proof.
8. Use isolated fixtures/embedded SQL for defaults. Hosted checks are opt-in and read-only unless a specific target/operation is authorized. No push/deploy, paid provisioning or production modifications. Reset only explicitly designated disposable databases. No assumption that current Supabase is empty.
9. Preserve secrets and unrelated files. Never print/stage credentials. Repository cleanup is not authorization to delete hosted users/tables/projects, rotate keys or edit dashboard access. Such operations require explicit scope; do not delete .env.local.
10. Remove superseded learner code/config/docs according to the plan's exact inventory, including imports/scripts/tests/CI/package-lock changes. Preserve 208-ID fixture and immutable applied migrations/journal. No orphaned dependencies, compatibility stubs, duplicate UI or empty future-admin scaffold.
11. Learner practice has one shared UI and public content source; familiarity/history/reviews/goals are local. Auth is not required, including anonymous Supabase identities. Admin Auth can be introduced only for actual later content management.
12. Legacy migration/adapters, progress export/import, backup/restore rehearsals, old-origin transfer, AI companion, subscriptions, offline synchronization and handwriting recognition remain excluded. Local browser persistence does not imply offline delivery.
13. Keep verified work in focused local commits; inspect exact staged diff/whitespace/secret boundaries and final status. Preserve/document unfinished work. No push or deployment.

## Canonical documents and commands

- implementation-plan.md: target design, cleanup inventory and acceptance.
- docs/implementation-progress.md: current work/handoff, concise.
- docs/backend-setup.md: actual current setup vs planned content-only configuration.
- README.md: entry point and runnable commands.
- docs/archive/implementation-history-pre-no-login.md: dated prior outcomes only. Do not create parallel active account/no-login guides.

Current npm run check runs native/frontend/backend tests, lint, typecheck, production build and loopback HTTP smoke. Until runtime C2-R, it still tests learner accounts. test:postgres remains the old optional loopback account-concurrency suite; it is not a Supabase-hosted command or mandatory Docker prerequisite. C2-R removes it and its obsolete CI service after replacement content coverage. verify:supabase currently checks learner Auth settings as well as SQL/public HTTP; C2-R must rewrite it before claiming no-login readiness. Default checks never require genuine external credentials.
