# Implementation workflow

These rules apply to every implementation checkpoint. Read this document together with the root `implementation-plan.md`, `docs/implementation-progress.md`, applicable repository instructions, recent commits, and `git status` **before starting**. A checkpoint request narrows the plan; it does not authorize implementing the entire phase.

1. Record the starting commit, existing staged/unstaged/untracked changes, dependencies, and relevant acceptance criteria. Verify the current code before editing. Reuse verified existing work; do not repeat completed tasks.
2. Implement only the requested checkpoint. Preserve unrelated changes and do not stage them implicitly. Do not upgrade dependencies/frameworks or fix adjacent defects unless that checkpoint authorizes them.
3. Follow the plan's relevant dependencies and acceptance criteria. Record justified implementation choices and any narrower checkpoint boundary; do not silently weaken requirements.
4. After **each completed subtask**, update `docs/implementation-progress.md` with changes, decisions, verification commands/results, blockers, and the exact next step. Keep a durable handoff before switching tasks or stopping.
5. Mark work complete only with evidence. Distinguish **implemented**, **tested**, and **awaiting external verification**. A test attempt, successful compile, or mocked API is not proof of browser behavior or production integration. Never fabricate credentials, content approval, or test results.
6. Run appropriate checks and report failures with their cause and scope. Do not hide failures, suppress diagnostics, skip failing tests to claim success, or weaken existing checks. Baseline failures remain visible until an authorized checkpoint resolves them.
7. Use isolated synthetic fixtures, local test servers, and disposable test infrastructure. Do not push, deploy, provision paid services, or modify production data. Never expose secrets in files, logs, screenshots, commits, or handoffs.
8. Preserve recoverable user data before migrations or storage changes. Do not reset/repair the only original copy to make a test pass. Use synthetic progress for browser checks. Keep recovery separate from automatic persistence.
9. Keep verified checkpoint changes in a focused **local commit**. Review the exact diff, stage explicit paths, check whitespace, and verify commit contents/status. Preserve and document unfinished or unrelated changes. Do not discard another person's work. If committing is blocked, record the reason and exact staged/unstaged state; do not claim a commit exists.
10. Do not implement AI companion, subscriptions, offline synchronization, or handwriting recognition. Future planning mentions do not authorize these features.

## Progress entry template

- Checkpoint/subtask and status: implemented / tested / awaiting external verification / blocked.
- Starting commit and relevant plan sections/dependencies.
- Changes and files; decisions and scope exclusions.
- Verification: exact commands, results, evidence, and limitations.
- Blockers or remaining baseline failures.
- Exact next step and handoff owner/action.

## P0-A test and recovery entrypoints

`npm test` runs Node's built-in test runner with TypeScript stripping on Node 22.6+ (verified runtime recorded in the progress log). It needs no third-party test dependencies. Type stripping executes the real kana dataset; it does **not** typecheck the application or replace future React/browser tests. See [Node's TypeScript documentation](https://nodejs.org/docs/latest-v22.x/api/typescript.html).

The static `/guest-progress-backup.html` page is intentionally independent of the root React page and progress hook. Open it directly on the origin containing the existing progress before storage migrations. Localhost cannot read progress saved on the deployed origin. See `docs/guest-progress-recovery.md` for the backup format and read-only recovery verification. A later authorized checkpoint can add restore/migration; P0-A never writes the exported raw value back.
