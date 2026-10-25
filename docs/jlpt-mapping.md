# JLPT card mapping

The active snapshot includes every character returned by `kanji-data@1.0.0`'s `getJlpt(5)` through `getJlpt(1)`. These are approximate source assignments, not an official exhaustive exam syllabus. Sets are separate, not cumulative. Word examples do not inherit vocabulary levels.

| Source level  | Cards |           Dedicated decks | Missing |
| ------------- | ----: | ------------------------: | ------: |
| N5            |    79 |                         2 |       0 |
| N4            |   166 |                         3 |       0 |
| N3            |   367 |                         7 |       0 |
| N2            |   367 |                         7 |       0 |
| N1            | 1,232 |                        21 |       0 |
| No JLPT label |   548 | Original notebooks/trails |       — |

The expansion adds 78 N1 characters while retaining all original 2,681 kanji and the membership/order of the original 122 decks. Total content is now 2,759 kanji + 208 kana = 2,967 cards, across 19 sets and 162 decks. Kana cards are not assigned JLPT levels.

## Card and route contracts

- Stable character IDs remain `kanji-<unicode hex>`; for example `凪` is `kanji-51ea`, assigned N1.
- `content/generated/cards.json` and lightweight `catalog.json` both expose `jlpt: 1…5 | null` for every card.
- Each assigned card belongs to exactly one dedicated level deck, as well as any retained original decks. Level sets use `jlpt-n5` through `jlpt-n1`; practice decks use `jlpt-nX-part-Y` and contain at most 60 cards.
- `/jlpt` provides coverage and entry points. Card grids display labels, card details link to the level set, and `/search` filters by level or unassigned kanji.
- `/api/catalog`, `/api/cards/[id]` and `/api/decks/[slug]` expose the same mapping as the rendered pages.
- The 548 unassigned kanji retain their original learning paths; missing labels are not guessed.

## Compatibility and validation

No progress keys, card IDs, save versions or original deck memberships change. Existing session snapshots continue to use their captured content. Newly opened sessions use the expanded snapshot. Regeneration is explicit and does not fetch a remote API during learning.

`content/catalog-baseline-v1.json` freezes original IDs and deck memberships for regression checks. `npm run resources:check` verifies exact source-list equality, full coverage, exclusive JLPT deck membership, summary/detail agreement and original-content preservation. The source manifest records per-level counts, missing glyphs, source checksum and revision.
