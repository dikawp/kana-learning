import { catalog } from "@/lib/platform/repository"
import { SetTile, PageHeading } from "@/components/platform/catalog"
export const metadata = { title: "The Collection · Kana-Learn" }
export default function Archive() {
  return (
    <>
      <PageHeading
        eyebrow={`${catalog.sets.length} NOTEBOOKS / ${catalog.decks.length} DECKS / ${catalog.cards.length.toLocaleString("en-US")} CHARACTERS`}
        title="A collection to grow into."
      >
        Start small, follow a theme, or take a JLPT study path.
      </PageHeading>
      {["kana", "kanji", "jlpt"].map((kind) => (
        <section id={kind} key={kind}>
          <h2>
            {kind === "kana"
              ? "The syllabaries"
              : kind === "jlpt"
                ? "JLPT study paths"
                : "Kanji notebooks"}
          </h2>
          <div className="set-grid">
            {catalog.sets
              .filter((s) =>
                kind === "kana"
                  ? s.kind !== "kanji"
                  : kind === "jlpt"
                    ? s.slug.startsWith("jlpt-")
                    : s.kind === "kanji" && !s.slug.startsWith("jlpt-"),
              )
              .map((s) => (
                <SetTile key={s.slug} set={s} count={s.decks.length} />
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
