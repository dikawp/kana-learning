import Link from "next/link"
import { ArrowUpRight, Flower2 } from "lucide-react"
import { catalog } from "@/lib/platform/repository"
import { SetTile, DeckTile, Eyebrow } from "@/components/platform/catalog"
import { HomeProgress } from "@/components/platform/home-progress"

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <Eyebrow>THE ART OF A LITTLE, EVERY DAY</Eyebrow>
          <h1>
            A character today.
            <br />
            <em>A world tomorrow.</em>
          </h1>
          <p>
            Find your rhythm in Japanese. Start with the sounds, wander through kanji, and return to
            what matters.
          </p>
          <HomeProgress />
        </div>
        <div className="hero-art" aria-label="Japanese characters for spring, flower, and learning">
          <div className="sakura-ring" aria-hidden="true">
            <Flower2 />
          </div>
          <span className="art-caption">A NOTEBOOK FOR NEW BEGINNINGS</span>
          <div className="hero-kanji" lang="ja">
            春
          </div>
          <div className="art-bottom">
            <span lang="ja">はる</span>
            <span>SPRING / A NEW START</span>
          </div>
          <span className="floating-petal petal-one" aria-hidden="true">
            ✿
          </span>
          <span className="floating-petal petal-two" aria-hidden="true">
            ✿
          </span>
        </div>
      </section>
      <div className="collection-strip">
        <div>
          <strong>208</strong>
          <span>KANA CHARACTERS</span>
        </div>
        <span className="strip-divider">✿</span>
        <div>
          <strong>2,759</strong>
          <span>KANJI TO DISCOVER</span>
        </div>
        <span className="strip-divider">✿</span>
        <div>
          <strong>{catalog.decks.length}</strong>
          <span>SMALL STUDY DECKS</span>
        </div>
        <p>
          Yours to explore.
          <br />
          No account, no rush.
        </p>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <Eyebrow>01 / FIND YOUR STARTING POINT</Eyebrow>
            <h2>Three ways into Japanese.</h2>
          </div>
          <Link href="/archive" className="quiet-link">
            View collection <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="pathway-grid">
          {[
            {
              title: "Hiragana",
              glyph: "あ",
              text: "The soft shapes behind Japanese sounds.",
              href: "/set/hiragana",
              count: "104 CHARACTERS",
            },
            {
              title: "Katakana",
              glyph: "ア",
              text: "A new script for familiar sounds.",
              href: "/set/katakana",
              count: "104 CHARACTERS",
            },
            {
              title: "Kanji",
              glyph: "学",
              text: "Shapes that carry stories and meaning.",
              href: "/archive#kanji",
              count: "2,759 CHARACTERS",
            },
          ].map((p) => (
            <Link key={p.title} href={p.href} className="pathway">
              <div>
                <span className="meta">{p.count}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <span className="text-link">
                  Step inside <ArrowUpRight size={16} />
                </span>
              </div>
              <span lang="ja">{p.glyph}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>Follow a JLPT study path.</h2>
        <p className="muted">Explore all five source-mapped levels, from N5 to N1.</p>
        <Link href="/jlpt" className="text-link">
          Open the JLPT study map <ArrowUpRight size={16} />
        </Link>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <Eyebrow>02 / FOLLOW YOUR CURIOSITY</Eyebrow>
            <h2>Notebooks worth opening.</h2>
          </div>
          <Link href="/archive" className="quiet-link">
            All {catalog.sets.length} notebooks ↗
          </Link>
        </div>
        <div className="set-grid">
          {catalog.sets
            .filter((s) => s.kind === "kanji")
            .slice(0, 6)
            .map((s) => (
              <SetTile key={s.slug} set={s} count={s.decks.length} />
            ))}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <Eyebrow>03 / FIVE MINUTES CAN BE ENOUGH</Eyebrow>
            <h2>A small deck, a fresh page.</h2>
          </div>
        </div>
        <div className="deck-grid">
          {["hiragana-basic", "katakana-basic", "first-marks-a-small-beginning"].map((slug) => (
            <DeckTile
              key={slug}
              deck={catalog.decks.find((d) => d.slug === slug)!}
              cards={catalog.cards}
            />
          ))}
        </div>
      </section>
    </>
  )
}
