import { toRomaji } from "wanakana"

/** Transliterate source kana, never infer a pronunciation from a kanji glyph.
 * Source dots (okurigana boundaries) and hyphens (affixes) remain visible.
 * This is a display/search aid; dictionary readings and quiz answers stay intact.
 */
export function romanizeReading(reading: string): string {
  return toRomaji(reading.normalize("NFKC"))
}
