# English JLPT resource corpus

The application imports the **complete vocabulary and grammar snapshot** of [OpenJLPT](https://github.com/evanclan/OpenJLPT) at commit `0d1d3410bec90bd4098a7c72de820543cb4f707c`. This means complete coverage of that dataset, **not** a complete or official JLPT syllabus.

| Level | Vocabulary | Grammar | Vocabulary with examples | Original readings |
| ----- | ---------: | ------: | -----------------------: | ----------------: |
| N5    |        674 |      81 |                      664 |                 1 |
| N4    |        630 |      98 |                      624 |                 1 |
| N3    |      1,659 |     101 |                    1,624 |                 1 |
| N2    |      1,778 |     123 |                    1,663 |                 1 |
| N1    |      3,070 |     123 |                    2,670 |                 1 |
| Total |      7,811 |     526 |                    7,245 |                 5 |

There are 8,342 live materials, 249 optional study sets, and 16,684 available question variants. Resource counts are derived and checked against the pinned upstream metadata. Eleven vocabulary entries lack part-of-speech metadata; 566 lack example sentences. Missing fields are left missing and explained on detail pages.

## Provenance and licensing

- **Vocabulary:** OpenJLPT combines Jonathan Waller's community JLPT mappings and short English glosses with JMdict entry IDs/parts of speech and corrections. Each imported material retains the OpenJLPT entry ID, commit, source-file URL and JMdict ID where supplied. Levels are independent of component kanji levels.
- **Examples:** imported Japanese/English pairs retain source furigana and Tatoeba sentence IDs/attribution links where supplied. Word levels do not certify the difficulty of their example sentences. No audio is imported.
- **Grammar:** all 526 OpenJLPT entries preserve source pattern, meaning, formation, notes, tags and examples. Distinct source sense IDs are not merged merely because their surface forms look alike. KanaLearn does not assert independent human review of imported explanations.
- **Reading:** the five Japanese passages and ten comprehension questions are original AI-assisted KanaLearn exercises, retained with English translations and explanations. They remain unreviewed and are not described as externally sourced texts or full exam preparation.
- **Drills:** vocabulary reading/definition recognition and grammar meaning/example-translation recognition are deterministically derived from attributed source fields. Options and feedback use source entries rather than invented Japanese sentences. These are recognition drills, not official exam question distributions; automatic checks cannot prove that every distractor is semantically unambiguous.

Imported/adapted data and derived drills are distributed under **CC BY-SA 4.0**. OpenJLPT's notice identifies EDRDG/JMdict (CC BY-SA 4.0), Waller (CC BY), Tatoeba text (CC BY 2.0 FR), and OpenJLPT grammar contributors. The full upstream notice and licence are retained with the snapshot; a public copy is at `/licenses/openjlpt-notice.txt`. Attribution on each material and example remains available. The project's MIT code licence is unchanged; only the original reading exercises use the original-content MIT notice.

The raw snapshot contains vocabulary, grammar, metadata and legal notices only. OpenJLPT's kanji corpus, SQLite/Anki distributions, website assets, audio and unrelated sources are not downloaded. Existing KanaLearn kanji remain canonical.

## Repeatable acquisition and preparation

1. `npm run jlpt:fetch` explicitly acquires only the files listed in `scripts/jlpt/fetch.ts`, from the pinned commit. Each file receives a SHA-256 in the manifest. This is never part of build or page loading.
2. `npm run jlpt:prepare` verifies every upstream checksum and creates per-level detail/summary files, study sets, compatibility aliases, progress indexes and coverage metadata. It needs no network.
3. `npm run jlpt:check` checks the complete source coverage, schemas, references, canonical kanji IDs, derived questions, immutable reading evidence, summaries, aliases and licences.

Changing the upstream version requires an explicit commit-pin update, licence/source review, fresh acquisition, regeneration and verification. The pinned metadata records JMdict data dated 2026-09-29; acquisition date is 2026-10-28. Operators should keep redistributed dictionary data current in line with upstream terms, rather than silently fetching mutable data during learning.

## Remaining content limits

There is no licensed full Dokkai passage/exam corpus in this snapshot. The five original readings are limited exercises; medium/long/integrated reading and full exam-type question banks are not claimed to be complete. Listening, audio and full mock tests remain held. Yokubi, AIUEO, Bee's aggregate and official sample questions are not imported or listed as sources of live content.

The superseded Indonesian pilot vocabulary/grammar files and reference-only TUFS/JPF metadata have been removed. Legacy IDs are recorded only for compatibility. Two pilot words without a verified source equivalent have an explicit retirement page rather than an invented mapping. Original reading IDs remain stable at material version 2; saved historical questions remain untouched.
