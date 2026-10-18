# C2 backend and automated verification

C2 adds Elysia at `app/api/[[...slugs]]/route.ts` on Next's Node runtime. There is no listener, Bun runtime, separate backend deployment or background queue. The guest `/` route remains independent of accounts. No legacy browser data is read or imported into account state.

## Environment and responsibilities

Copy `.env.example` to an ignored environment file and provide genuine development configuration. No working credentials are supplied. `APP_ORIGIN` is an exact origin (no trailing slash/path); use HTTPS except loopback development. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` select the same Supabase project as the database. Publishable keys or legacy anon JWTs are accepted; secret/service-role keys are rejected. These variables are server-only; no credentials enter `NEXT_PUBLIC_*` or browser storage.

Supabase Auth manages password hashes, email confirmation/recovery, token issuance and revocation. Enable email/password authentication with a minimum 8-character password policy. The app calls the real SDK; it never stores passwords in PostgreSQL, localStorage or logs. Cookie sessions are HttpOnly, SameSite=Lax, path `/`, Secure in production. Every protected API verifies `auth.getUser()`, rather than trusting a local `getSession()` user. Next `proxy.ts` refreshes account-page cookies; route handlers independently verify/refresh requests. Responses carrying identity or cookies are private/no-store.

Auth project configuration needs the correct Site URL and exact allowed redirects for each separate environment:

- `${APP_ORIGIN}/auth/callback?next=/account` for confirmation.
- `${APP_ORIGIN}/auth/callback?next=/account/password` for password recovery.

The standard PKCE flow requires the requesting browser's verifier cookie. The callback also supports Supabase `token_hash` plus `type=signup|recovery`; a custom email template can point to `/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/account/password` (signup uses `next=/account`). Configure the real template on the isolated Auth project, not production during this task. Unsupported types/invalid links produce a safe failure; the destination allowlist rejects open redirects. `/account/password` submits to an authenticated endpoint. Password recovery is account functionality, unrelated to excluded database backup/restore rehearsals.

Actual confirmation/recovery delivery requires Supabase email/SMTP configuration and provider rate limits. No email delivery is claimed by SDK transport fixtures. Keep development, preview and production projects, callbacks, keys, SQL roles and data separate. No service was provisioned and no project settings were changed in C2.

## PostgreSQL and SQL roles

`DATABASE_URL` must use a dedicated non-owner LOGIN role inheriting `learning_runtime`, normally through Supabase's transaction pooler. Do not use postgres/owner/service credentials for runtime traffic. Postgres.js uses `max:1`, `prepare:false`, bounded connection/statement/idle timeouts, TLS for non-loopback connections and a module-scoped pool. A runtime preflight rejects superuser or BYPASSRLS credentials. Set the Vercel function region to the database's region in a later authorized environment task; no region or deployment is assumed here.

`MIGRATION_DATABASE_URL` is a separate privileged direct/session connection for administrative scripts only. There is no fallback to runtime credentials. C2 scripts refuse production and require `DATABASE_CHANGE_TARGET=disposable-development` or `isolated-preview`. Do not target an existing production project. After a real isolated Supabase project is explicitly designated, the implementation commands are:

```sh
npm run db:migrate
npm run db:seed
```

Scripts load Next environment files; never print connection values. `db:migrate` uses the committed Drizzle journal and SQL migrations; repeat runs do not reapply migrations. `db:seed` upserts exactly the 208 verified kana by their stable text IDs and preserves familiarity/history. It does not create users or reset tables. `db:generate` generates future reviewed migrations without connecting to a database; do not use `drizzle-kit push` against a live environment. The first migration explicitly creates the private `learning` schema; RLS/grants are maintained as custom SQL, not inferred from generated snapshots.

Supabase already supplies `auth.users`; application migrations reference it and never create/alter it. Isolated tests supply a minimal test-only identity table. After migrations, an operator must create a genuine runtime LOGIN credential through the provider's supported process and grant it membership in `learning_runtime`; do not commit or manufacture passwords in project files. It must not inherit an owner/BYPASSRLS role.

The custom role has only required DML: read kana; insert/read profiles plus row-lock permission; insert/read immutable questions/answers/receipts; update session result columns; insert/read/delete familiarity. It cannot change seeded kana, edit answers/receipts, perform DDL or access Supabase Auth identities directly. Data API roles anon/authenticated have no access to `learning`; do not add it to exposed schemas. Every personal table has forced RLS based on transaction-local `app.profile_id`. The business layer also scopes each query by the verified profile ID. Identity is set with `set_config(..., true)` inside a transaction and never as session-wide pooled state. RLS does not magically protect a privileged connection, and runtime SQL credentials must never reach a browser.

## Data and concurrency contracts

- `profiles.id` references managed Auth; `kana.id` is the existing 208-entry text key. Future general dictionary/material/release entities are outside C2.
- `kana_familiarity` is unique per profile/kana, not mastery or an SRS schedule.
- Quiz sessions carry owner, config, total, status and a bounded completed score. Question snapshots retain glyph/Romaji/options for historical review; unsubmitted answer keys are omitted from API DTOs.
- Composite foreign keys bind questions/answers to the same session and owner. One accepted answer exists per question; a client cannot submit a score/correctness flag or answer an unissued question.
- All account operations run inside transactions, lock the account profile row and apply verified claims. This serializes conflicting submissions for a learner across server instances; no in-memory mutex is used. Reads also take the short profile lock for a consistent bootstrap/snapshot.
- Mutations require a UUID request ID. Durable receipts bind account + request ID to operation + canonical payload hash + result. Exact retries return the original response; conflicting reuse returns 409. Completion derives score from saved answers once and refuses incomplete sessions. A second key for the same already-answered question cannot change its answer or score.
- UI retry buttons retain the original request ID/payload until success. Failed requests never optimistically credit familiarity or a quiz score. A network failure after commit is safe to retry. Unfinished quizzes resume from account history; results/history survive refresh and a fresh server/service instance. Sign-out unmounts account state; another account starts independently. No guest merge or offline synchronization exists.

## API inventory

All paths use `/api/v1`. Writes require a matching Origin and JSON body (maximum 16 KiB); inputs reject unknown fields, invalid UUIDs, unbounded text and out-of-range counts. Errors are `{error:{code,message,requestId}}` with no SQL details/stacks/secrets. Auth-provider failures use safe messages. Responses are private/no-store; C2 does not add public CDN content caching.

| Method/path | Contract |
| --- | --- |
| GET `/health` | Configuration availability only, not a live dependency health claim. |
| GET `/auth/session` | Verified user or null; configured:false when Auth is absent. |
| POST `/auth/sign-in`, `/auth/sign-up` | `{email,password}`; managed SDK login/confirmation. |
| POST `/auth/recover` | `{email}`; generic non-enumerating response. |
| POST `/auth/password`, `/auth/sign-out` | `{password}` with verified session; `{}` for local sign-out. |
| GET `/content/kana` | Database-seeded ordered kana reference. |
| GET/PUT `/me/progress` | Known familiar IDs; write `{requestId,kanaId,familiar}`. |
| POST `/me/progress/reset` | `{requestId,type:all|hiragana|katakana}`; only familiarity, not historical quizzes. |
| POST `/quiz-sessions` | `{requestId,type,questionCount:5|10|15|20|25}`; server-generated DTO. |
| GET `/quiz-sessions?limit=10&cursor=UUID` | Owned history, max 25/page, next cursor or null. |
| GET `/quiz-sessions/:id` | Owned current/resumable session and saved answer review; completed sessions include final score. |
| POST `/quiz-sessions/:id/answers` | `{requestId,questionId,answer}`; server feedback and familiarity. |
| POST `/quiz-sessions/:id/complete` | `{requestId}`; idempotent completion and final review. |

## Automated verification and limits

```sh
npm run check
```

Runs the preserved kana fixture, C1 + account React tests, backend tests, lint, strict typecheck, production build and automated loopback HTTP smoke. No manual QA, browser exploration, visual inspection or approval is required. The production smoke starts/stops only its own random-port server, explicitly disables external credentials and checks actual Next/Elysia routes and private responses.

Backend tests use PGlite's actual embedded PostgreSQL engine in fresh isolated memory/disk databases. They execute the committed migrations twice, seed twice, exercise constraints/RLS under the runtime role, account isolation, receipts/repeated requests, scoring/history and close/reopen persistence. Synthetic Supabase HTTP responses exercise the real SDK's session cookie/refresh/getUser behavior. Next callback/proxy tests exercise cookie forwarding and redirect boundaries. These do not prove hosted Supabase delivery, production pooler/TLS or actual multi-connection PostgreSQL contention: PGlite serializes its embedded connections.

The separate network suite requires an explicitly designated **new, empty loopback** database named `kana_c2_test_*` and `C2_TEST_DATABASE_DISPOSABLE=yes-disposable`:

```sh
npm run test:postgres
```

It refuses missing/non-loopback/wrong-name/nonempty/production targets; it never resets existing schemas. It creates a restricted random LOGIN role, tests simultaneous requests over four pooled connections and removes only that role on completion. CI defines a disposable PostgreSQL 17 service for this suite. The CI service credentials are public synthetic fixtures for that short-lived service, not deployment credentials. Do not copy production data into it.

At C2 investigation time Docker Desktop's engine is unavailable and no Supabase/test connection credentials are configured. Network PostgreSQL, real Supabase email/confirmation/recovery/session revocation, provider pooler/role/region setup and Vercel integration remain **unavailable external checks**, with no fabricated success. Their automated entrypoints and limitations are recorded in `implementation-progress.md`. No production writes, deployment, backup/restore rehearsal or remote CI execution is authorized.

## Technical references

[Elysia Next integration](https://elysiajs.com/integrations/nextjs), [Elysia Vercel](https://elysiajs.com/integrations/vercel), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [password flows](https://supabase.com/docs/guides/auth/passwords), [Supabase Drizzle](https://supabase.com/docs/guides/database/drizzle), [connections/pooler](https://supabase.com/docs/guides/database/connecting-to-postgres), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [PGlite](https://pglite.dev/).

Drizzle Kit 0.31.11 depends on a deprecated esbuild-kit loader. Its nested vulnerable esbuild is narrowly overridden to patched 0.25.12; actual schema generation is tested. No force downgrade or advisory suppression is used. Re-evaluate the override when upstream removes that loader.
