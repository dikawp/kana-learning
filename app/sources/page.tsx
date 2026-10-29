import Link from "next/link"
import source from "@/content/generated/source.json"
import { PageHeading } from "@/components/platform/catalog"
import { sources as jlptSources } from "@/lib/jlpt/content"
import { getCoverage } from "@/lib/jlpt/repository"
export const metadata = { title: "Sources & Methodology · Kana-Learn" }
export default function Sources() {
  const coverage = getCoverage()
  return (
    <article className="prose-page">
      <PageHeading
        eyebrow="SOURCES / EDITORIAL NOTEBOOK"
        title="Good learning starts with honest sources."
      />
      <h2>Dictionary data</h2>
      <p>
        Kanji meanings, readings, metadata, and word examples are prepared from{" "}
        <a href="https://github.com/sepTN/kanji-data">kanji-data 1.0.0</a>, by Septian Ganendra S.
        K. The package is based on <a href="https://kanjiapi.dev/">kanjiapi.dev</a> and the EDICT,
        KANJIDIC and related dictionary work of James William Breen and the{" "}
        <a href="https://www.edrdg.org/">
          Electronic Dictionary Research and Development Group (EDRDG)
        </a>
        .
      </p>
      <p>
        Dictionary data is attributed under{" "}
        <a href="https://www.edrdg.org/edrdg/licence.html">
          CC BY-SA 4.0 and the original source terms
        </a>
        . Software licenses do not replace data licenses. The upstream software MIT notice is
        retained in <a href="/licenses/kanji-data.txt">the third-party notice</a>.{" "}
        <a href="/licenses/CC-BY-SA-4.0.txt">Data license</a>.
      </p>
      <h2>A local, versioned collection</h2>
      <p>
        Learning requests read a prepared local snapshot. They do not call a remote dictionary API.
        The collection contains {source.kanji.toLocaleString("en-US")} kanji and {source.kana} kana.
        Kana-Learn’s existing 208 kana retain their original IDs, readings and order.
      </p>
      <h2>How the learning map is made</h2>
      <p>
        The original 2,681 kanji were selected by school grade, then Mainichi Shinbun newspaper
        frequency, then Unicode. All missing characters in the package’s N5–N1 lists are now
        included as well, adding 78 N1 cards. Every selected character has an English meaning and a
        reading. Twelve kanji notebooks contain 48 topic introductions with editor-selected starting
        characters, expanded by whole-word matches in dictionary meanings and words, followed by 66
        explicitly labelled reading trails. Trails provide systematic coverage beyond a notebook’s
        introductory theme; they do not claim every character shares that theme.
      </p>
      <p>
        Every kanji belongs to an original reading trail or a dedicated JLPT deck, so the full
        collection is reachable. The original deck memberships are preserved. Topic decks overlap.
        Hiragana and Katakana each have four decks: basic, dakuten, handakuten and combinations.
        Five additional JLPT notebooks contain 40 decks. There are 19 notebooks and 162 decks in
        total. This map is original to Kana-Learn; it is not an official curriculum or a copy of
        KanjiFlash’s editorial content.
      </p>
      <h2 id="jlpt-materials">JLPT text learning materials</h2>
      <p>
        The English JLPT hub imports all {coverage.vocabulary.toLocaleString("en-US")} vocabulary
        entries and {coverage.grammar} grammar points from the pinned OpenJLPT snapshot across
        N5–N1. Vocabulary combines Jonathan Waller's community level assignments and short glosses
        with JMdict entry IDs/parts of speech and Tatoeba example pairs. Grammar explanations and
        examples are original OpenJLPT contributions. KanaLearn does not claim independent human
        language review of the imported content. The {coverage.readings} Japanese reading passages
        remain original AI-assisted exercises with English translations, clearly separated from
        imported content. This is complete coverage of that source snapshot, not a complete official
        syllabus. Listening, audio and full mock simulations remain held.
      </p>
      <p>
        Level and unit assignments are editorial estimates. Question feedback explains distractors
        and reading evidence. Review schedules are simple learning aids: incorrect answers return
        after 10 minutes; correct answers after 1, 3, then 7 days. Practice accuracy does not
        predict an official scaled JLPT score.
      </p>
      <ul>
        {jlptSources.map((s) => (
          <li key={s.id}>
            <a href={s.url}>{s.title}</a> — {s.license}. {s.attribution} Revision: {s.revision}.
            Usage: {s.usage}.
          </li>
        ))}
      </ul>
      <p>
        <a href="/licenses/openjlpt-notice.txt">OpenJLPT and upstream attribution notice</a> ·{" "}
        <a href="/licenses/CC-BY-SA-4.0.txt">CC BY-SA 4.0 licence</a>. Imported/adapted data and
        source-derived drills retain CC BY-SA 4.0; the application code's licence is unchanged. No
        audio is imported.
      </p>
      <h2>JLPT kanji coverage</h2>
      <p>
        All 2,211 characters in the pinned source’s N5–N1 lists are included. Another 548 kanji have
        no JLPT label. Levels are separate, not cumulative.{" "}
        <Link href="/jlpt">Browse the level map</Link>.
      </p>
      <h2>Limits worth knowing</h2>
      <p>
        JLPT levels supplied by the upstream data are approximate study labels, not an official
        exhaustive exam specification. Kanjiapi.dev credits Jonathan Waller’s JLPT Resources for
        this mapping. Word examples on legacy kanji cards are dictionary entries, not
        vocabulary-level assignments. Missing metadata is left missing. Connections between cards
        are explained by shared readings or meanings, without invented similarity scores.
      </p>
      <p>
        Review uses simple fixed intervals: Missed 10 minutes, Almost 1 day, Got It 3 days.
        Missed/learning cards can be reviewed sooner. “Mastered” means 100 correct responses in this
        app, not scientifically measured long-term mastery.
      </p>
      <h2>Romaji reading aid</h2>
      <p>
        Romaji is derived locally from the supplied kana readings using WanaKana; it is not an extra
        field from kanjiapi.dev and is never inferred from a kanji glyph alone. Dots and hyphens
        retain the source’s okurigana and affix boundaries. Original kana readings remain visible.
        Word Romaji comes from the complete word reading, not joined individual kanji readings.
      </p>
      <h2>Reproducibility</h2>
      <p>
        Snapshot revision: <code>{source.revision}</code>
      </p>
      <p>
        Source metadata SHA-256: <code>{source.metadataSha256}</code>
      </p>
      <p>
        Resource updates are explicit and require rebuilding the site. Data can change; saved
        practice sessions retain their question snapshots.
      </p>
      <Link href="/privacy">How your progress is stored →</Link>
    </article>
  )
}
