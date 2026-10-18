# Kana Learning

Practice 208 Japanese kana entries (104 Hiragana and 104 Katakana) with flashcards, multiple-choice quizzes and grouped reference tables.

## Current functionality

- Search glyphs or Romaji; filter by script and basic/dakuten/handakuten/combination group.
- Reveal flashcards, navigate in either direction and mark entries familiar.
- Choose quiz script/count (5–25, capped by available entries); receive feedback, advance explicitly and review results.
- Quiz scope is independent of browse filters. The last quiz score is session-only.
- Familiarity persists on this device when storage is available; it does not represent spaced repetition or long-term mastery.
- System/light/dark theme and named keyboard-accessible controls.

## Development

Use Node 22.13+ within the supported Node 22 line (verified 22.22.0) and npm 10.9.4. Next 16.4.2, React 19.3.1, TypeScript, Tailwind and existing Radix/shadcn components are retained. The committed npm lockfile is the dependency source of truth.

```sh
npm ci
npm run dev
```

Local app: http://localhost:3000.

## Automated quality gates

```sh
npm run check
```

This runs native/React/backend tests, lint, strict typecheck, production build and automated loopback HTTP smoke in sequence; a failed gate stops the command. Build type errors are not ignored.

| Command | Purpose |
| --- | --- |
| npm test | Native 208-entry fixture plus frontend and backend tests |
| npm run test:backend | Isolated PostgreSQL migrations/RLS/persistence/API/Auth protocol |
| npm run test:postgres | Explicitly designated disposable network PostgreSQL concurrency suite |
| npm run test:production | Automated loopback Next/Elysia integration after build |
| npm run test:native | Frozen kana ID/glyph/script contract |
| npm run test:frontend | Search, quiz, storage, hydration, theme and accessible semantics |
| npm run lint | ESLint with JS/TypeScript and React Hooks recommended rules |
| npm run typecheck | Strict TypeScript checking without emit |
| npm run build | Next production build including type validation |
| npm run start | Serve the built application locally |

Automated accessibility checks cover control names, ARIA and table structure in jsdom; no layout/contrast or deployed behavior claim is made. Do not perform manual QA, exploratory browser testing or visual inspection. Read [the workflow](docs/implementation-workflow.md) and [progress log](docs/implementation-progress.md) before a checkpoint. C1–C6 supersede the original execution sequence.

## Local progress contract

Guest familiarity uses `kana-learning:guest:v1` with `{ version: 1, learnedIds: string[] }`. Reads are validated and never automatically write an empty snapshot. Duplicate/unknown IDs are excluded. Invalid or unavailable storage produces a visible status and permits in-memory practice; explicit changes start a fresh record when writing is possible. Storage events replace snapshots, including resets; concurrent localStorage writes are best effort.

There are no legacy compatibility requirements. The old key is not read or converted. Export/recovery/migration features were removed in C1; historical work remains in Git. Accounts start independently.

## Account backend

C2 adds managed Supabase email/password accounts, recovery/session refresh/sign-out, private Elysia APIs, PostgreSQL/Drizzle progress, server-graded quizzes and persistent history at `/account`. Guest practice remains independent. Without genuine environment configuration the account UI reports unavailable services and guest practice still works. See [backend setup and automated verification](docs/backend-setup.md); `.env.example` contains blank configuration fields, not credentials. No migrations run during builds or function startup.

## Planned product

See [implementation-plan.md](implementation-plan.md) for the English-only, N5-first platform direction: Elysia on Next/Vercel, PostgreSQL, imported licensed kanji/vocabulary, curated lessons and per-skill review scheduling. C3–C6 await the user's prompts. AI companion, subscriptions, offline synchronization and handwriting recognition are excluded.

## License

Repository software is MIT licensed. Future dictionary/media imports retain their own source attribution and reuse terms.
