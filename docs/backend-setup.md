# Backend setup and transition status

Revised 18 October 2026. The new target is public content with device-local learner progress. Runtime C2-R is planned, not implemented by this documentation update. Do not follow historical account setup as a prerequisite for the new product.

## What exists today

At commit 3c12ca8 the repository still contains Next/Elysia learner Auth, /account and /account/password, session refresh/callbacks, account progress/quizzes and a public /api/v1/content/kana GET. The root kana page still uses bundled data/local familiarity. The two interfaces are not yet unified.

The user-designated Supabase development project has three applied C2 migrations and 208 seeded kana under the private learning schema, not public. Its database region is Tokyo/ap-northeast-1. Auth users and account learning activity may exist. Keep those data and credentials intact during planning; do not reset the project or repeat provisioning.

## Existing local configuration (until C2-R)

Actual values belong only in ignored .env.local; never send or commit passwords/URLs. No credentials are provided here.

| Variable | Current consumer | Target after C2-R |
| --- | --- | --- |
| APP_ENV | Guarded development/preview scripts | Keep. |
| DATABASE_URL | Dedicated kana_app LOGIN via transaction pooler, inheriting learning_runtime | Keep, narrow role grants to published SELECT only through reviewed SQL. Never use administrator credentials for runtime. |
| MIGRATION_DATABASE_URL | Privileged direct/session connection for reviewed scripts | Keep separate from runtime; never browser-exposed or used on ordinary requests. |
| DATABASE_CHANGE_TARGET | Explicit disposable-development or isolated-preview designation | Keep fail-closed target guard; designation alone never grants permission to erase data. |
| SUPABASE_URL; SUPABASE_PUBLISHABLE_KEY | Current learner Auth and hosted verifier | Remove after their consumers are removed; future admin configuration is separately scoped. |
| APP_ORIGIN | Current learner Auth/Origin/redirect checks | Remove when no concrete consumer remains. |
| C2_TEST_DATABASE_URL; C2_TEST_DATABASE_DISPOSABLE | Optional empty-loopback account contention test | Remove with obsolete suite/CI job. Do not use a hosted Supabase URL here. |

The current SQL role is non-owner/non-BYPASSRLS, Postgres.js uses bounded pooling/TLS/prepare:false, and personal queries use transaction-local profile claims. Those personal-query responsibilities will disappear; preserve pooling/security and tighten privileges rather than assume RLS protects admin SQL.

No automatic changes to .env.local, provider keys, dashboard callbacks, Auth users or remote data happen in this planning task. Supabase's main-branch production badge does not authorize production operations; use the specifically designated environment and inspect actual state.

## Commands available today

- npm run dev: local Next/Elysia; Docker not required.
- npm run check: current application tests/lint/typecheck/build/isolated HTTP. It still includes learner-account contracts until implementation cleanup.
- npm run db:migrate and npm run db:seed: current reviewed C2 journal and idempotent 208-kana seed, only on an authorized explicitly designated target. No migration at build/startup.
- npm run verify:supabase (after build): opt-in hosted read-only SQL/role/RLS/content/Auth-settings/Next HTTP checks. It currently requires learner Auth configuration and is not proof of the future content-only architecture.
- npm run test:postgres: old optional new-empty-loopback learner mutation suite; do not point it at Supabase. C2-R removes it and its CI service after replacing relevant coverage.

Default verification uses isolated PGlite/fixture transport. Normal filesystem permissions may be needed for disk-backed PGlite; initial sandbox Aborted failures and unchanged passing reruns are historical evidence in the archive. Do not hide a failed check or report synthetic Auth transport as hosted account verification.

## Planned content-only responsibilities (not implemented yet)

Keep Elysia in app/api/[[...slugs]]/route.ts with Node runtime, Supabase PostgreSQL and Drizzle, current SQL client/CLI/seed guards and stable kana IDs. Rewrite runtime to public published GETs with validation, bounded pagination/cache keys and consistent safe errors. Remove learner /auth/*, /me/* and /quiz-sessions*; removed paths return404, no redirects/adapters.

The public UI loads one shared published-content contract and grades/saves practice locally. No learner session cookies, anonymous Auth user or SQL progress rows. Existing account tables can remain dormant and inaccessible to runtime pending explicit retirement authorization. Keep applied SQL files/journal/snapshots immutable; use reviewed forward migrations, never drizzle-kit push or a destructive reset to match shortened types.

Admin Auth is optional future work when actual content management needs it; do not retain learner routes/packages as placeholders. Supabase Storage is optional for licensed media. No Redis/queue/worker or separate Elysia deployment is needed now.

C2-R must rewrite the hosted verifier to check only public content/read-only grants/anonymous HTTP, replace account tests with content/local-state coverage, and document actual final environment fields here. Until then, do not claim project cleanup or no-login runtime completion.

See [the plan](../implementation-plan.md), [workflow](implementation-workflow.md) and [current progress](implementation-progress.md).

## Technical references

[Elysia Next](https://elysiajs.com/integrations/nextjs), [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PGlite](https://pglite.dev/).
