# JLPT resource and learning architecture

The English JLPT workspace provides N5–N1 vocabulary/kanji, grammar, reading, optional study sets, practice, explanations, review, resume and saved results. The complete pinned OpenJLPT vocabulary/grammar snapshot is integrated; listening, all audio and full mock simulations remain held. See [resource provenance and coverage](jlpt-content.md).

## Loading and identity

`lib/jlpt/repository.ts` is server-only. It reads and caches per-level generated JSON from the filesystem; large corpora are not compiled as TypeScript-inferred JSON objects or imported into browser modules. The hub receives only ID/level/skill progress indexes. Directories receive summary metadata for the selected level and render 40 entries at a time, with search by Japanese, kana, Romaji and English; filters stay within that level. Study-set lists paginate by 20. Detail routes resolve on demand instead of generating thousands of new content pages at build time.

Every vocabulary/grammar ID incorporates the stable upstream entry ID and the source level. A changed source level therefore requires an explicit compatibility mapping during upgrades; it is not inferred from kanji. Grammar senses retain separate upstream identities. Kanji references point to existing `kanji-<unicode hex>` cards. No kanji data, IDs, deck memberships, URLs or original card intervals are changed.

Questions are derived on the server from attributed source fields. A default practice batch contains at most ten materials per text skill; users can load another source batch or practise any individual material/study set. Review requests at most 20 due materials through the bounded read-only `/api/jlpt/questions` endpoint (maximum 40 IDs per request). Only material IDs are requested; answers, ratings and dates remain local. Active sessions pin the selected questions, options, feedback and reading context.

## Content replacement and saves

The original card schema and `kana-learn:sakura:v1` key remain unchanged. New JLPT records stay in IndexedDB `kana-learn:jlpt:v1`, store `slots`, keyed by the existing learner UUID. An active old session and every historical attempt retain their original snapshots, even if that snapshot uses the former language or references retired content.

Compatibility aliases redirect former pilot vocabulary/grammar URLs to verified source entries, including corrected source levels. Two unmatched pilot entries show retirement information. Upon loading a slot, replacement lessons inherit a **studying** marker rather than an unsupported claim that new material is already completed. Mapped concept review dates are retained, streaks restart, and source level/skill are corrected; old progress markers and immutable session history remain in the save. The migration is idempotent. Original reading material IDs are unchanged.

Updates use optimistic revisions and IndexedDB transactions. Cross-tab conflicts refresh state and require repeating the stale action. Invalid/unavailable storage falls back to memory with an export notice and never implicitly overwrites corrupt stored data. Migration write failure retains the loaded progress in memory rather than discarding it.

Dashboard version 2 backups include the untouched version 1 character slot and JLPT data; version 1 imports and legacy character-only exports remain supported. Exports drain pending writes. Duplicate copies into a new UUID, rename retains identity, and confirmed reset/delete uses a recovery journal cleared only after the card save is durable. No history is pruned by the JLPT resource upgrade.

## Learning and reporting

Opening is studying, explicit completion is studied, and practice results remain separate. Source recognition drills choose one variant per concept and up to ten questions per session. Incorrect answers are due after ten minutes; correct answers use one, three and seven days. These intervals do not change legacy card review. Translations stay hidden during attempts; feedback discloses the correct source response, distractor origins, and exact evidence for original reading questions.

Results show correct/total, accuracy and answering time, without scaled-score conversion or pass predictions. Automated schema/data/UI checks do not establish language correctness or human editorial review. Sources and limitations are visible in the application; no complete-syllabus, full-offline or full-exam claim is made.

## Verification

Run `npm run check`, then `npm run test:browser`. Checks cover original kana/kanji invariants, exact source coverage/checksums, questions, schemas, source links, aliases and migration, backup compatibility, English rendering, filters/pagination, native IndexedDB resume, bounded resource loading, automatic accessibility and responsive overflow. All UI verification is headless and automated; no manual QA or screenshot review is required.
