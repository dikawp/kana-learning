# Kana Learning

Practice 208 kana (104 Hiragana and 104 Katakana) through one public Flashcard, Quiz and Table interface. No learner registration or login.

## Current implementation

- Materials load from the public Next/Elysia API backed by Supabase PostgreSQL. Search glyphs/Romaji and filter script/category; all modes share the same material contract.
- Flashcards reveal answers and mark familiarity. Familiarity persists on this device when browser storage is available; it is not mastery.
- Quizzes choose their own script/count, capped by available entries. Answers are checked locally; one answer/question and one completion are accepted.
- Active quiz questions, answers and position survive refresh, including submitted-answer feedback. Completed quizzes retain original answer snapshots and mistake review; history keeps the last 20 sessions.
- The progress summary shows the last completed quiz on this device. Clearing quiz history does not reset familiarity; familiarity resets do not erase quiz history.
- Invalid/blocked/quota storage permits clearly labelled memory-only practice. There is no cloud learner progress or cross-device synchronization.
- System/light/dark theme and keyboard-accessible controls. No learner account routes or Auth SDK.

Kanji, vocabulary, lessons, goals and spaced repetition remain later checkpoints. Admin Auth may be introduced for real content management needs only.

## Development

Use Node >=22.13 <23 and npm 10.9.4 (verified Node 22.22.0). The committed npm lockfile is authoritative; no framework upgrade was needed in C2-R.

    npm ci
    npm run dev

App: http://localhost:3000. Copy .env.example to ignored .env.local and provide real PostgreSQL configuration as described in [backend setup](docs/backend-setup.md). No Supabase Auth URL/key or Docker is required. If material storage is unavailable, the UI shows loading/error/retry rather than switching to a bundled fallback.

## Automated verification

    npm run check

Runs frozen kana fixture, frontend/backend tests, lint, strict typecheck, production build and isolated loopback HTTP. Default checks never access hosted Supabase or require credentials.

| Command | Purpose |
| --- | --- |
| npm run test:native | Frozen 208-ID/glyph/script/order contract |
| npm run test:frontend | Search/filter/quiz/storage/resume/history/theme/accessibility |
| npm run test:backend | Isolated SQL/migrations/grants/API/CLI/persistence |
| npm run test:production | Public shell, removed routes404 and safe material outage after build |
| npm run verify:supabase | Opt-in read-only hosted content/permissions/anonymous HTTP after build |
| npm run lint / typecheck / build | Static checks and production compilation |
| npm run db:migrate / db:seed | Reviewed migrations/repeatable kana seed on explicitly authorized targets |
| npm run db:generate | Generate reviewed migrations, retaining dormant declarations to avoid destructive drops |

No manual QA, exploratory browser testing or visual inspection. DOM accessibility tests do not prove visual layout/contrast. Docker/account-contention CI and test:postgres have been removed.

## Local storage

Familiarity uses the existing kana-learning:guest:v1 key with version/known learnedIds; this is a retained key, not a guest/account adapter. Quiz state uses kana-learning:study:v1: one active session and up to 20 completed sessions, maximum 262144 serialized characters before parsing/saving. Reads never automatically overwrite stored data. Snapshots retain original prompt/answer revision; historical scores are recalculated from those snapshots, not trusted persisted score fields.

Storage events replace snapshots, including resets. localStorage multi-tab writes are best effort, not transactional synchronization. Browser clearing/eviction or another device does not preserve these records. Larger transactional review logs/IndexedDB are planned for C4. No export/import, offline delivery or backup/restore features.

## Documentation and scope

Read [plan](implementation-plan.md), [workflow](docs/implementation-workflow.md) and [active progress](docs/implementation-progress.md) before a checkpoint. [Historical evidence](docs/archive/implementation-history-pre-no-login.md) is superseded execution context.

C2-R removes learner account code/config while preserving applied migrations and dormant hosted records. Supabase content uses learning.kana, not public.kana. Existing hosted users/tables are not deleted; runtime permissions cannot access them.

The platform remains English-meaning and N5-first, ready architecturally for N5–N1. AI companion, subscriptions, offline synchronization and handwriting recognition are excluded. No push/deployment performed.

## License

Software is MIT licensed. Dictionary/media imports retain their original attribution and reuse terms.
