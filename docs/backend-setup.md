# Backend setup — local resources

No hosted backend or credentials are needed. Next.js Server Components and native GET Route Handlers read content/generated through lib/platform/repository.ts. The repository is server-only, so dictionary details are not imported into browser modules.

Routes: /api/catalog, /api/cards/[id], /api/decks/[slug]. Responses are publicly revalidatable and versioned. Pages do not perform HTTP calls to their own API. Catalog/set/deck/card routes are prerendered from the snapshot; practice query modes are server-rendered for known decks.

Progres­s, ratings, session grading and saves are browser-owned. There are no auth/progress write routes, SQL connections, migration steps or runtime dictionary fetches. Retired Supabase/Elysia source, migrations and credentials configuration have been removed. Remote projects/tables were not modified.

Run npm ci then npm run dev. To maintain content, follow [resource updates](resource-updates.md). Normal build needs no environment configuration. No environment template is required.
