# Pre-push cleanup audit

25 October 2026, Asia/Jakarta. Cleanup follows the user's request to remove unused project files and configuration. No commit, push, deployment or remote database mutation is included.

## Removed and consolidated

- Removed 59 unused source modules from the active source tree: retired layout/UI components, duplicate toast/mobile hooks, the old kana quiz/search engine, obsolete kana types, a kana JSON facade and a pass-through theme provider. Active source modules decreased from 105 to 46.
- Removed the obsolete pre-Sakura implementation archive containing Supabase/Elysia/Drizzle source, migrations and old tests. The historical analysis reports and required data/software licenses remain reference artifacts.
- Removed five placeholder images, unused dictionary-acquisition manifest, unused shadcn generator configuration, the image-only Next configuration and obsolete environment template/comment-only local file.
- Reduced direct production dependencies from 53 to 15. Removed 38 unused production dependencies, the redundant direct @next/env dev dependency and a stale esbuild override; updated package-lock.json. Prettier is a dev dependency.
- Removed unused component exports, retired CSS selectors/utilities and unreferenced legacy design tokens. Moved session result calculation from client persistence to the learning domain.
- Read kana JSON directly in the frozen-baseline test; removed its now-unneeded experimental TypeScript flag.
- Limited Tailwind scanning to app and components, so captured third-party pages, research reports, tests and resource snapshots do not generate unused utility styles. This uses [explicit source registration](https://tailwindcss.com/docs/detecting-classes-in-source-files#disabling-automatic-detection).
- Added consistent formatting, format checks in the normal check command, unused-local/parameter checks in TypeScript and LF rules for text files. Updated active documentation to the current architecture.

## Audit and verification

The import graph covers app entry points, resource scripts and active tests, including relative and @/ imports. After cleanup: no unreachable active source modules and no unresolved local imports. This is static analysis plus functional verification, not a proof that every possible runtime branch is exercised.

- Clean npm ci installation succeeded with the pruned lockfile.
- npm run check passed: formatting, resource integrity, 36 native/domain/frontend tests, lint, TypeScript, production build and HTTP smoke.
- Production Playwright passed both flows: study/resume/quiz/review/dashboard/save slots/export-import and JLPT/card/deck practice. Tested light/dark themes, mobile drawer, no external requests and accessibility checks on the tested pages.
- Production dependency audit reported zero vulnerabilities.
- Resource regeneration retained revision 39784f0006ce45b4417f244cf6466825a9d9aecb2218c7b4cd17ccac5817db14: 2,967 cards, 19 sets and 162 decks. IDs and original deck memberships remain intact.
- Git whitespace check passed. Active documentation links resolve. No database integration remains in active source, scripts, dependencies or CI.

Historical comparisons and screenshots in docs/analysis are deliberately retained. The frozen kana/catalog baselines are regression fixtures, not duplicate runtime sources. Generated JSON remains checked in because normal builds must not acquire dictionary data.
