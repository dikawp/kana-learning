# Content backend setup

Updated 22 October 2026 (Asia/Jakarta). C2-R implemented: one anonymous learning UI, public Elysia content API, local learner state. Supabase provides PostgreSQL content; no learner Supabase Auth SDK, session cookies, anonymous users or cloud progress writes.

## Local configuration

Use .env.example as the template; keep genuine values only in ignored .env.local.

| Variable | Responsibility |
| --- | --- |
| APP_ENV | development/test/preview classification for guarded scripts |
| DATABASE_URL | Dedicated non-owner SELECT-only LOGIN through Supabase transaction pooler; never admin credentials |
| MIGRATION_DATABASE_URL | Privileged direct/session connection for explicitly authorized reviewed migrations/seed, not ordinary requests |
| DATABASE_CHANGE_TARGET | disposable-development or isolated-preview guard; does not authorize destructive resets |

No SUPABASE_URL, publishable key, APP_ORIGIN or C2_TEST_* field is consumed by the application. Obsolete learner-only fields were removed from the local file without changing unrelated lines or exposing credentials. No provider keys, dashboard callbacks or Auth users were revoked/deleted. Future admin/storage variables are added only when needed.

Runtime uses Postgres.js with max1, prepare:false, TLS, bounded timeouts/lifetime. A SQL preflight rejects superuser/BYPASSRLS, schema CREATE, table/column write grants and any dormant learner-table reads. Safe failures return503 without SQL/credentials. Existing development region is Tokyo/ap-northeast-1; choose a nearby Vercel region only in a later deployment task. No Docker, Bun listener, separate backend project, Redis or worker is required.

## Database and migration history

Public kana is stored in learning.kana (208 stable text IDs). RLS remains active; only the restricted runtime role reads it. The schema is not exposed through Supabase Data API anonymous roles.

Applied 0000–0002 SQL/snapshots are immutable. drizzle/preserved-schema.ts declares dormant tables for migration generation only; it is not imported by runtime and is included by drizzle.config.ts to prevent an accidental generated DROP. 0003_content_read_only revokes table privileges and the historical column-level UPDATE grants, retaining SELECT on kana. Table-level REVOKE alone does not remove column grants.

The new migration was applied to the previously user-designated Kana-learn development target on 22 October 2026. Aggregate counts in auth.users and all six dormant learner tables were equal before/after. Data/users/tables remain intact; runtime reads and writes are denied. Deletion of those resources requires separate authorization and is not part of repository cleanup.

    npm run db:migrate
    npm run db:seed

Use only explicitly authorized non-production targets; no runtime credential fallback, migrations during build/startup, drizzle-kit push or destructive schema reconciliation. Default isolated tests supply a minimal auth.users fixture solely for historical migration dependencies; no production Auth data is imported.

## Public API

| Request | Result |
| --- | --- |
| GET /api/v1/health | contentConfigured flag and liveDependencyCheck:false; does not claim real SQL readiness |
| GET /api/v1/content/kana | Validated items + SHA-256 content revision, ordered by seed position; ETag and must-revalidate caching |
| Conditional same GET | 304 for exact unchanged revision |
| Unknown queries | 422 safe validation error |
| Missing/failed content database | 503 safe envelope, private/no-store, no bundled material fallback |
| Former learner /auth/*, /me/*, /quiz-sessions* | 404, no compatibility stubs |
| Former /account, /account/password, /auth/callback pages | 404 |

Public reads require no cookies or identity and issue no session cookies. Error envelopes have code/message/requestId, no raw SQL or stack. Currently the only published material is kana, so all valid kana rows form the published payload; staged dictionary/release publication is C3.

## Automated checks

    npm run check

Default native/frontend/backend/static/build/HTTP gates use local fixtures, PGlite SQL and credential-disabled loopback HTTP. Actual RLS/grants, migration/seed repeatability, dormant-record preservation and disk reopen are checked. Auth suites/SDKs and the obsolete account-contention network suite/CI service are removed.

After build, with explicit development configuration:

    npm run verify:supabase

The opt-in verifier checks matching administrative/session and runtime/transaction-pooler target metadata locally; only runtime credentials connect. SQL uses explicit READ ONLY transactions because transaction pooling does not preserve startup/session settings reliably. It validates exact 208 content, RLS, table/column permissions, denied dormant-table access and concurrent reads; then starts/stops its own random-port production server to verify public content/ETag and removed paths404. It does not send emails, create users, read personal records, mutate rows or apply migrations.

This hosted verifier passed on the designated development project on 22 October 2026. No remote CI/Vercel deployment, visual QA, cross-browser eviction guarantee or future SRS behavior is claimed. Active existing dev processes are not terminated by the verifier.

See [plan](../implementation-plan.md), [workflow](implementation-workflow.md) and [progress](implementation-progress.md).

## References

[Elysia Next](https://elysiajs.com/integrations/nextjs), [Supabase pooling](https://supabase.com/docs/guides/database/connecting-to-postgres), [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PGlite](https://pglite.dev/).
