# Active workflow

Implement and verify the authorized Sakura plan in implementation-plan.md. Retired backend/UI code and configuration were removed in the authorized pre-push cleanup. Preserve current source and user changes.

Use installed Next16.4.2 documentation in node_modules/next/dist/docs before API/routing/caching changes. Keep package-lock authoritative. Resource preparation is explicit; never fetch dictionaries during a learning request.

Run resource validation, frozen kana, domain/API/frontend tests, lint, typecheck, production build and HTTP smoke. Run npm run format:check. Then run Playwright browser smoke, retain screenshots and inspect both mobile/desktop themes. Record actual results and limits in implementation-progress.md. No deployment or remote database mutation is implied.
