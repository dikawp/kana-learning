# Implementation workflow

Current policy: C1–C6, revised 18 October 2026 (Asia/Jakarta). The application has no users. Clean redesign and breaking internal contracts are acceptable. P0-A/P0-S remain historical evidence, not current requirements.

1. Before each checkpoint read implementation-plan.md, this workflow, docs/implementation-progress.md, applicable repository instructions, recent commits and git status (staged/unstaged/untracked). Record starting commit and baseline checks.
2. Implement only the user's requested checkpoint; reuse verified work and preserve unrelated changes/secrets. C2 is now authorized by its backend/account prompt; C3–C6 remain governed by future prompts, not permission to implement later modules now.
3. Follow relevant dependencies and acceptance criteria. Update the plan when requirements change; mark replaced checkpoints superseded while preserving historical progress.
4. After meaningful subtasks update docs/implementation-progress.md with changes, decisions, exact automated results, blockers and the exact next step.
5. Mark completion only with verification evidence. Distinguish implemented, automated-tested, blocked and awaiting external integration verification. Never fabricate credentials, content approval, provenance or results.
6. Run relevant automated tests, lint, strict typecheck and production builds. Do not hide failures, disable checks, skip failing tests or bypass diagnostics.
7. Do not perform manual QA, exploratory browser testing, visual inspection or request manual QA approval. Do not create or maintain manual QA checklists. Historical observations create no new manual requirements.
8. Use synthetic fixtures and isolated infrastructure. Reset only explicitly designated disposable databases. Do not push, deploy, provision paid services or modify production data. Never expose secrets.
9. No legacy guest/account migration, progress export, backup/restore rehearsals, old-origin migration or backward-compatibility adapters. New guest storage may use a clean contract; future accounts start independently. Stable source identities still matter for content updates.
10. Keep verified work in focused local commits. Review exact diffs, stage explicit paths, check whitespace and verify commit contents/status. Preserve and document unfinished/unrelated changes; do not claim a blocked commit exists.
11. AI companion, subscriptions, offline synchronization and handwriting recognition are excluded. No backend implementation in C1.

## Progress entry

Record checkpoint/subtask/status, starting commit, scope/dependencies, changed paths, decisions, exact automated checks/results, limitations/blockers and exact next action. Mark superseded requirements without rewriting historical outcomes.

## Automated entrypoints

Use npm and package-lock.json. npm run check is the aggregate gate: native/React/backend tests, lint, typecheck, production build and automated loopback HTTP smoke. Backend tests use isolated embedded PostgreSQL and synthetic Auth transport; test:postgres requires an explicitly designated new disposable loopback database and never resets an existing schema. Docker is optional infrastructure for that suite. For a user-authorized hosted development target, npm run verify:supabase (after build) performs read-only SQL/Auth/Next checks; it must stay opt-in and does not prove authenticated mutation/email flows. See docs/backend-setup.md. Native tests retain the verified 208-entry fixture. Framework/runtime choices require official documentation and package compatibility checks. Mark unavailable external checks explicitly; never fabricate them.
