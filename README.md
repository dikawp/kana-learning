# Kana Learning

Practice 208 kana entries (104 Hiragana and 104 Katakana) with flashcards, quizzes and reference tables.

## Product direction and implementation status

The agreed target is one public study interface without learner registration/login. Supabase PostgreSQL supplies published materials through Next/Elysia; familiarity, quiz history, goals and later review schedules are device-local. Admin Auth may be added only when content management needs it.

The runtime has not yet been converted: C1 kana practice works at /, and the old C2 account UI/backend still exists at /account. The required C2-R cleanup is planned before C3; do not mistake the plan revision for removal of those files/features. See [implementation-plan.md](implementation-plan.md) for the precise deletion/replacement inventory.

## Development

Use Node >=22.13 <23 and npm 10.9.4 (last verified Node 22.22.0). Keep the committed npm lockfile. Existing Next/React/Elysia/Drizzle stack is reused.

    npm ci
    npm run dev

Local app: http://localhost:3000. No Docker is needed to run it with hosted Supabase. Existing environment configuration and its planned removal are explained in [backend setup](docs/backend-setup.md); secrets belong only in ignored .env.local.

## Current functionality

- Root kana practice: glyph/Romaji search, script/category filters, Flashcard/Quiz/Table modes, answer reveal, familiar marking, explicit quiz feedback/results and system/light/dark theme.
- Familiarity is saved locally when storage works; it is not mastery/SRS. Root last score is currently session-only.
- The separate C2 account implementation still supports Auth, SQL progress and server quiz/history. This learner-account direction is superseded and will be removed by C2-R.
- Target local quiz resume/history, shared database content UI, kanji/vocabulary and lessons/SRS are not implemented by the documentation revision.

## Automated verification

    npm run check

Current aggregate: native/frontend/backend tests, lint, strict typecheck, production build and isolated loopback HTTP. A failed step stops the gate. Automated accessibility is DOM-based, not visual/contrast validation.

| Command | Current purpose |
| --- | --- |
| npm test | Frozen 208-entry fixture plus frontend/backend suites |
| npm run test:native | Stable kana IDs/glyphs/scripts/order |
| npm run test:frontend | Domain/storage/interaction/theme/accessibility and current account contracts |
| npm run test:backend | Isolated SQL/API/Auth fixtures and CLI guards |
| npm run test:production | Isolated Next/Elysia HTTP after build |
| npm run verify:supabase | Opt-in hosted read-only verifier, still includes learner Auth settings until C2-R |
| npm run test:postgres | Optional loopback-only account contention suite; planned removal with old CI job |
| npm run lint / typecheck / build | Static checks and production compilation |
| npm run start | Serve the built app locally |

No manual QA, exploratory browser testing or visual inspection. Default checks need no real Supabase credentials. Historical 51-test/hosted-readiness results are prior evidence, not verification of the future redesign.

## Local data and documentation

Existing familiarity key: kana-learning:guest:v1 with version and validated learnedIds. Reads do not overwrite initial state; duplicate/unknown IDs are excluded, blocked/invalid storage permits clearly labelled memory-only practice and storage events replace snapshots. C2-R reuses this reliability rather than maintaining legacy account adapters. No progress export/import, cloud sync or backup/restore features are planned.

Read [workflow](docs/implementation-workflow.md) and [active progress](docs/implementation-progress.md) before implementation. [Historical evidence](docs/archive/implementation-history-pre-no-login.md) contains superseded tasks/results only.

The platform remains English-meaning, N5-first and ready architecturally for N5–N1. AI companion, subscriptions, offline synchronization and handwriting recognition are excluded. No push/deployment is part of cleanup.

## License

Repository software is MIT licensed. Imported dictionary/media content retains its original attribution and reuse requirements.
