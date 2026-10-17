# Guest progress backup and recovery

P0-A adds a read-only recovery page at `/guest-progress-backup.html`. Open it **directly on the origin where the progress is stored**, before future migrations or resets. For example, a local checkout can back up localhost progress only; it cannot read progress on `kanalearn.vercel.app`. P0-A is not deployed and has not inspected/exported anyone's production progress.

The normal progress card links to this page. The direct URL also works if the React application crashes on malformed progress or search. Unlike the root application, it does not load `useKanaProgress` or run its mount/save effects. Opening the normal learning page can still run those existing effects; fixing that is outside P0-A.

## Export and verify

1. Click **Download guest progress backup**. Save `kana-guest-progress-v1.json` using the browser's download UI.
2. Select that saved file under **Verify your saved backup**. Verify that the page recognizes a version 1 backup. A requested download alone does not prove the file was saved.
3. Optionally download `kana-learned-characters-original.json`, containing a JSON-encoded string of the exact original storage value. Decode that file with `JSON.parse` to recover the original text; do not treat the extra quotes/escapes as part of the original. This encoding preserves empty strings, malformed JSON and even malformed Unicode code units that plain UTF-8 text would replace. An absent key is distinguished from a stored `"null"` string.
4. Keep the versioned backup and original-value file. Neither export nor verification writes, clears, repairs, normalizes or restores browser storage. If storage access is denied, the page reports failure and does not pretend an empty backup is valid.

## Version 1 contract

The JSON envelope has `format: "kana-learning-guest-progress"`, `schemaVersion: 1`, `capturedAt`, source origin/storage key/baseline commit, and `storage: { present, rawValue }`. `rawValue` is the exact `getItem("kana-learned-characters")` result: a string or `null` when absent. JSON encoding may escape characters, but decoding restores the same original string, including whitespace, duplicate/unknown IDs and malformed contents. Informational counts are stored-entry counts, not validated learned/mastered counts.

This recovery snapshot is distinct from the future `kana-platform-progress-v1` migration model in the plan. It contains no auth tokens, other storage keys, theme preference, invented reviews, historical quiz scores or inferred mastery. The baseline identifier records the original dataset contract, not a claim about the deployed application's commit.

For programmatic verification, `readGuestProgressBackup(text)` in `public/guest-progress-backup.mjs` validates the supported envelope and returns the original string or absence marker. Tests serialize, decode, compare and extract raw values with storage mutation methods that fail if called. The page can verify/extract a saved file without reading or changing localStorage.

## Restore handoff

No automatic restore/import is implemented in P0-A. A future authorized migration/restore checkpoint must validate known IDs against `tests/fixtures/kana-baseline-v1.json`, show recognized/unknown/corrupt data separately, preserve this backup, and obtain an explicit destination/merge choice before writing. Never paste backup contents into a console or overwrite the only original as a verification step. If the raw data is malformed, retain it for manual recovery rather than resetting it.

## Local test setup

Run `npm test` on Node 22.6+; the current verified environment uses Node 22.22.0. The native test runner exercises the actual dataset, serialization/decoding, read failures, download boundary and page events using synthetic storage/DOM objects. No dependency install, real browser profile or remote service is required. Browser download/save verification is a separate local manual check; see the progress log for what was actually exercised.

For the isolated browser check, run `npm run test:recovery-browser`, open its printed random `127.0.0.1` URL, seed the synthetic value, open the recovery page, export/verify/extract, then return to the harness and click **Check unchanged original**. The harness deliberately writes only synthetic data to its isolated localhost origin. It is test infrastructure outside `public/`, never a deployed application route. Stop the server when finished. A sandbox may require local-network permission for the browser to reach this server.
