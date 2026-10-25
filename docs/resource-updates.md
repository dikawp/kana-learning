# Local resource preparation

Run `npm ci`, then `npm run resources:prepare` to deliberately regenerate the checked-in snapshot. Run `npm run resources:check` and review the generated diff before committing. Ordinary `npm run build` does not download dictionaries or regenerate content.

The generator reads `kanji-data@1.0.0` (a dev-only acquisition dependency). Its actual published API does not implement all helpers advertised by the upstream README; preparation reads its packaged metadata JSON and uses `getWords` for word shards. The approximately97MB package is not imported by runtime or client code.

Selection: admit English meanings and at least one on/kun reading; prioritize school grades1–6 and8, then newspaper frequency, then Unicode; retain the original2681, then union the package getJlpt(5…1) lists, adding78 N1 characters. Kana comes from `content/kana.json`, preserving the frozen208 IDs and order. Baseline tests read the JSON directly.

`content/curriculum.json` holds original editorial starting characters, whole-word topic selectors and notebook descriptions. The generated catalog has48 source-matched topic decks and66 reading trails, plus8 kana decks and40 JLPT decks. Trails use contiguous bands of the same grade/frequency order and explicitly state that they are consolidation rather than thematic classification. Their union preserves the original2681 kanji. Five additional JLPT sets contain40 balanced decks and cover every source-mapped level. Topic decks overlap, use10–40 cards, and match dictionary meanings and words; no arbitrary padding or invented dictionary meanings are used.

Generated artifacts: lightweight catalog, detailed cards and source manifest with metadata SHA-256 and a revision digest covering cards, sets and decks. API and pages use the same server-only repository. Only deck-specific details are passed to practice clients; search/dashboard receive summaries, not the dictionary package or complete vocabulary shards.

For a source version upgrade, explicitly change the pinned package, inspect its data/license/API changes, regenerate snapshots, review coverage and rerun checks. Missing fields stay missing. Kanji-data’s software MIT notice and EDRDG data attribution remain distinct. JLPT labels are approximate supplied metadata, not official exam coverage. All2211 source-listed N5–N1 characters are included;548 additional kanji are unassigned. The /jlpt overview, search filter and card badges expose this mapping. Kana is original project data.

The public content is independently generated from sources; KanjiFlash’s JavaScript, branding, text and deck memberships are not bundled into the application.

Romaji reading aid: original on/kun/name and vocabulary readings stay unchanged in snapshots and API responses. UI transliterates their kana locally with pinned WanaKana, preserving dots/hyphens. It never infers readings directly from kanji or joins individual-character readings to pronounce compound words. Kanji search also indexes these derived Romaji strings. Existing kana Romaji and save schemas are unchanged.
