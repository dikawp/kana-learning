# Active content sources

The active source manifest is content/generated/source.json. Kanji and word data are prepared from pinned kanji-data1.0.0, originally based on kanjiapi.dev and EDRDG dictionaries. The original source terms and attribution remain distinct from package/software MIT licensing. Public notices are available on /sources and public/licenses.

Kana-Learn retains its208 original kana, stable IDs, Romaji, categories and order in content/kana.json. This is not acquired from a kanji-only API.

The original learning map is reproducible from content/curriculum.json:48 topic introductions anchored in editor-selected characters and expanded against dictionary meanings and word glosses,66 explicitly labelled grade/frequency consolidation trails,8 kana decks. Trails cover the original2681 kanji. Five JLPT sets add40 decks and ensure all2211 source-listed N5–N1 kanji are covered; the expanded collection contains2759 kanji. Topic matches are not automatically official semantic/radical classifications. Missing data is never invented.

Word examples preserve written/read forms returned by the package and are labelled dictionary examples, not a reviewed vocabulary-level curriculum. JLPT source metadata is approximate; it is not an official exhaustive specification. Generated snapshots carry checksums/revision and are updated deliberately. See [resource updates](resource-updates.md).

The former relational import/publication architecture is retired. Historical comparison reports in docs/analysis remain reference material; they do not define an additional runtime source.

## English JLPT resources

The JLPT vocabulary and grammar corpus is imported from the pinned OpenJLPT commit recorded in `content/jlpt/upstream/openjlpt/manifest.json`: all 7,811 vocabulary entries and 526 grammar points. Upstream files, hashes, source versions and attribution are retained. English short glosses and community levels come from Jonathan Waller; JMdict provides entry IDs/part-of-speech enrichment; Tatoeba supplies attributed Japanese/English examples. OpenJLPT grammar is its contributors' original work. The combined imported data and derived recognition drills retain CC BY-SA 4.0, separately from the application's MIT code and original MIT reading exercises.

Five original AI-assisted reading exercises remain, now with English translations and feedback. The former Indonesian vocabulary/grammar pilot files have been removed; compatibility aliases and immutable saved session snapshots remain. No audio, unused reference-only grammar sources, duplicate kanji corpus or live remote dictionary is bundled. See [JLPT resource details](jlpt-content.md).
