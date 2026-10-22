# Content sources and publication boundary

Verified 22 October 2026 (Asia/Jakarta). C3-A implements the relational foundation and fail-closed publication, not dictionary acquisition or a complete N5 course. [Acquisition metadata](../content/sources/manifest.json) records the observed immutable release asset digests. No real dictionary entries or N5 mappings were imported or approved by this checkpoint.

## Original sources and reuse

| Source | Verified contract and planned use |
| --- | --- |
| [EDRDG](https://www.edrdg.org/edrdg/licence.html) / [KANJIDIC2](https://www.edrdg.org/wiki/KANJIDIC_Project.html) | Original Japanese/English dictionary data, CC BY-SA4.0. Attribute James William Breen/EDRDG, preserve notices, link original documentation/license and distinguish software MIT licensing. Dictionary displays need source acknowledgement. Provide an ongoing update process; their statement gives monthly web updates as an example. |
| [JMdict](https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html) | English glosses, multiple written forms/readings/senses and applicability restrictions. Parts of speech belong to senses. Not a teaching curriculum or vocabulary JLPT list. |
| [jmdict-simplified](https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2%2B20261019180022) | Observed release3.6.2+20261019180022, published19 October. Full English JMdict and all-language KANJIDIC2 assets are pinned in the manifest with GitHub-reported SHA-256/size; C3-B must download and verify the bytes before import. Converter/helper software licenses do not replace EDRDG rights. |
| [kanjiapi.dev](https://kanjiapi.dev/) | /v1/kanji/all and /v1/kanji/jlpt-5 are character-list endpoints; /v1/kanji/{character} returns details. Observed N5 list contains79 characters, not an official exhaustive standard. MIT API software is distinct from dictionary/level-mapping rights. Waller mapping redistribution evidence remains unresolved; no mapping is approved merely because an endpoint responds. |
| [KanjiVG](https://kanjivg.tagaini.net/) | Ordered SVG paths/component annotations, CC BY-SA3.0, Ulrich Apel/contributors. Pin assets, sanitize/validate geometry and retain notices before C3-D stroke integration. Components are not automatically etymology. No stroke assets acquired yet. |
| [Tatoeba](https://tatoeba.org/en/downloads) | Future sentence candidates; check each applicable text license, contributor and translation-link provenance. Audio rights are separate. Pair/sense relevance requires curation; no examples/audio imported yet. |

The [JLPT organizers](https://www.jlpt.jp/e/faq/) do not publish fixed current exhaustive vocabulary/kanji/grammar specifications. Keep modern approximate level evidence separate from legacy pre-2010 levels. KANJIDIC2 misc.jlpt is legacy1–4; kanjiapi's current mappings use a different source/taxonomy. Do not silently convert one to the other or derive vocabulary levels from component kanji.

## Formats rechecked

[KANJIDIC2 character](https://scriptin.github.io/jmdict-simplified/types/Kanjidic2Character.html) has literal/misc/radicals/codepoints and nullable readingMeaning; readings/meanings can be multiple/absent. [JMdict entries](https://scriptin.github.io/jmdict-simplified/types/JMdictWord.html) have string source IDs, kanji/kana/sense arrays. [Sense restrictions](https://scriptin.github.io/jmdict-simplified/types/JMdictSense.html) distinguish all versus selected forms/readings; a kana reading can apply to no written forms. Preserve source annotations and Unicode variants; do not concatenate per-kanji readings to create compound vocabulary furigana.

The current manifest is acquisition planning evidence, not a redistributed dictionary, legal sign-off, editorial approval or a completed download checksum validation. Future imports must pin a fresh version if the recorded release is stale, enforce size/checksum/schema bounds, record rejected records, retain the last published release on outage and preserve editorial corrections/local material identity.

## C3-A database boundaries

- Source metadata, immutable snapshot identities, import-run state and source/external-ID mappings are separate from curated material identity.
- Checked subtype FKs bind kanji/vocabulary rows to their real material kind. Same-entry composite FKs bind vocabulary forms/readings/senses; the revision builder validates scope intersections rather than making a Cartesian product.
- Explicit level assignments carry taxonomy, snapshot and evidence URL. Unknown stroke counts remain null; original reading annotations are kept alongside normalized kana. No romaji/furigana library or unverified derived reading has been added yet.
- prepareRevision in server/content/revisions.ts creates a canonical immutable, hash-addressed snapshot from normalized tables plus source/level evidence. Repeated unchanged preparation returns the same revision. Changing working data creates a new revision without overwriting published history.
- content_reviews records an operator-supplied reviewer and notes per revision. No production review records are created by tests or this implementation.
- publishRelease in server/content/publication.ts requires recorded reviews, verified reuse status/evidence, matching attribution, valid references and payload checksums. It locks the release/activation path, then changes the active pointer transactionally. Invalid publication leaves the prior active release intact. It is an internal operator function, not an anonymous HTTP endpoint.
- Immutable triggers protect snapshots/revisions/reviews, material identity and published manifests. The active pointer accepts only published releases. A previous published release can be reactivated after validation, retaining history.

## SQL read privileges

All new base tables use RLS and revoke PUBLIC/runtime/Data-API role access. They intentionally do not FORCE RLS for their owner: the owner-executed, security-barrier learning.published_materials view reads base tables but exposes only immutable items in the active published release. Runtime can SELECT this view and existing kana; it cannot read editorial drafts/rights/import metadata or write any table. The application preflight now also rejects direct SELECT on any non-kana base table. Do not grant raw reference-table access as a shortcut.

This is an explicit view/ACL security design, not a claim that arbitrary privileged SQL is automatically safe because Supabase Auth exists. Operator/migration credentials remain separate, never browser-exposed. New schema/grants are migrations0004/0005; prior applied migrations/snapshots and dormant learner records stay intact.

## Public dictionary API foundation

GET /api/v1/content/kanji and /vocabulary accept q (<=100), level (current approximate1–5), limit (1–50, default20) and an opaque cursor. Detail routes use the material stable key. Every payload includes source/license attribution and immutable revision/checksum. Only active published revisions are visible; before any release is published, list endpoints return200 with an empty items array/releaseId:null and detail returns404. This is not a missing-source fallback or fake N5 dataset.

Cursors bind the release and search scope. Read-only repeatable-read list transactions prevent mixed-release pages; changed-release cursors produce409 CONTENT_CHANGED, mismatched/malformed cursors422. Search treats percent/underscore literally and excludes source URL/license metadata. For now dictionary responses remain no-store; broader release caching belongs to C3-F. The existing kana ETag contract is unchanged.

## Next checkpoint

C3-B builds bounded acquisition/adapters, schema-version verification, retry/resume/import status and stable idempotent upserts. C3-C creates a source-backed reviewed N5 curriculum. C3-D/E add stroke/kanji/vocabulary exercises and their public attribution display; C3-F completes publication/update operations. Do not declare N5 coverage complete or publish examples/level mappings without their real source/rights/editorial evidence. No learner accounts, C4 scheduler, deployment or paid service is part of C3-A.
