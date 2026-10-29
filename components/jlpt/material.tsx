"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useSave } from "@/lib/platform/store"
import { useJlpt, updateJlpt } from "@/lib/jlpt/store"
import { markMaterial } from "@/lib/jlpt/learning"
import { materialHref, type Material, type MaterialSummary, type Source } from "@/lib/jlpt/types"
import styles from "./jlpt.module.css"

export function MixedText({ text }: { text: string }) {
  return (
    <span lang="en">
      {text.split(/([\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]+)/g).map((part, i) =>
        /[\u3040-\u30ff\u3400-\u9fff]/.test(part) ? (
          <span lang="ja" key={i}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  )
}

export function Japanese({
  text,
  reading,
  furigana = true,
  sourceFurigana,
}: {
  text: string
  reading?: string
  furigana?: boolean
  sourceFurigana?: string
}) {
  if (
    furigana &&
    sourceFurigana &&
    sourceFurigana.replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$1") === text
  )
    return (
      <span lang="ja" className={styles.japanese}>
        {sourceFurigana.split(/(\{[^|{}]+\|[^{}]+\})/g).map((part, i) => {
          const token = part.match(/^\{([^|{}]+)\|([^{}]+)\}$/)
          return token ? (
            <ruby key={i}>
              {token[1]}
              <rp>（</rp>
              <rt>{token[2]}</rt>
              <rp>）</rp>
            </ruby>
          ) : (
            part
          )
        })}
      </span>
    )
  return (
    <span lang="ja" className={styles.japanese}>
      {reading && furigana ? (
        <ruby>
          {text}
          <rp>（</rp>
          <rt>{reading}</rt>
          <rp>）</rp>
        </ruby>
      ) : (
        text
      )}
    </span>
  )
}

export function MaterialLesson({
  material: m,
  sources,
  related,
}: {
  material: Material
  sources: Source[]
  related: MaterialSummary[]
}) {
  const [furigana, setFurigana] = useState(true)
  const [translation, setTranslation] = useState(false)
  const [error, setError] = useState("")
  const opened = useRef("")
  const { slot } = useSave()
  const { data, status, message } = useJlpt(slot?.id ?? null)
  const studied = data?.materials[m.id]?.status
  useEffect(() => {
    if (!slot || !data || opened.current === `${slot.id}:${m.id}`) return
    opened.current = `${slot.id}:${m.id}`
    void updateJlpt(slot.id, (p) => markMaterial(p, m, "studying")).catch(() =>
      setError(
        "Reading progress could not be recorded. You can try the study status buttons again.",
      ),
    )
  }, [slot, data, m])
  const mark = (value: "studying" | "studied") => {
    setError("")
    if (slot)
      void updateJlpt(slot.id, (p) => markMaterial(p, m, value)).catch(() =>
        setError("Study status could not be recorded. Please try again."),
      )
  }
  return (
    <div className={styles.stack}>
      {error && <p role="alert">{error}</p>}
      {status === "memory" && (
        <p className="storage-warning" role="status">
          {message}
        </p>
      )}
      <div className={styles.nav}>
        <button
          className={styles.button}
          aria-pressed={furigana}
          onClick={() => setFurigana(!furigana)}
        >
          Furigana {furigana ? "on" : "off"}
        </button>
        <button
          className={styles.button}
          disabled={!data}
          aria-pressed={studied === "studying"}
          onClick={() => mark("studying")}
        >
          Mark studying
        </button>
        <button
          className={styles.button}
          disabled={!data}
          aria-pressed={studied === "studied"}
          onClick={() => mark("studied")}
        >
          Mark studied
        </button>
        <Link href={`/jlpt/${m.level}/practice?material=${m.id}`}>Practice this material →</Link>
      </div>
      <p role="status">Study status: {studied ?? "Not started"}</p>
      <section className={styles.card}>
        {m.kind === "reading" ? (
          <span lang="en">{m.title}</span>
        ) : (
          <Japanese text={m.title} reading={m.reading} furigana={furigana} />
        )}
        <p lang="en">{m.meaning}</p>
        {m.partOfSpeech && (
          <p>
            Part of speech: <span lang="en">{m.partOfSpeech}</span>
          </p>
        )}
        {m.kind === "vocabulary" && !m.partOfSpeech && (
          <p>Part of speech: not supplied by this source snapshot.</p>
        )}
        <h2>Learning objective</h2>
        <p lang="en">{m.objective}</p>
        <h2>Explanation</h2>
        <p lang="en">{m.explanation}</p>
        {m.formation && (
          <>
            <h3>Formation</h3>
            <p lang="ja" className={styles.japanese}>
              {m.formation}
            </p>
          </>
        )}
        {m.forms?.length ? (
          <>
            <h3>Forms</h3>
            <ul lang="ja">
              {m.forms.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        ) : null}
        {m.register && (
          <>
            <h3>Register and usage</h3>
            <p lang="en">{m.register}</p>
          </>
        )}
        {m.cautions?.length ? (
          <>
            <h3>Common errors</h3>
            <ul lang="en">
              {m.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
      {m.blocks?.length ? (
        <section className={styles.card}>
          <h2>Reading passage</h2>
          {m.textType && <p>Text type: {m.textType}</p>}
          {m.blocks.map((b) => (
            <p id={b.id} key={b.id}>
              <Japanese text={b.text} reading={b.reading} furigana={furigana} />
            </p>
          ))}
          {m.translation && (
            <>
              <button
                className={styles.button}
                aria-expanded={translation}
                onClick={() => setTranslation(!translation)}
              >
                {translation ? "Hide translation" : "Show English translation"}
              </button>
              {translation && <p lang="en">{m.translation}</p>}
            </>
          )}
          <p className={styles.muted}>
            Practice questions show the supporting passage evidence after you submit an answer.
          </p>
        </section>
      ) : null}
      {m.examples.length ? (
        <section className={styles.card}>
          <h2>Examples</h2>
          {m.examples.map((e, i) => (
            <div className={styles.section} key={i}>
              <Japanese
                text={e.japanese}
                reading={e.reading}
                furigana={furigana}
                sourceFurigana={e.furigana}
              />
              <p lang="en">{e.translation}</p>
              {e.sourceUrl && <a href={e.sourceUrl}>Example attribution · {e.sourceId}</a>}
            </div>
          ))}
        </section>
      ) : m.kind === "vocabulary" ? (
        <p>The source snapshot does not supply an example sentence for this entry.</p>
      ) : null}
      {m.comparisons?.length ? (
        <section className={styles.card}>
          <h2>Compare and distinguish</h2>
          {m.comparisons.map((c) => {
            const other = related.find((r) => r.id === c.materialId)
            return (
              <div key={c.materialId}>
                <p lang="en">{c.explanation}</p>
                {other && (
                  <Link href={materialHref(other)} lang="ja">
                    {other.title} →
                  </Link>
                )}
              </div>
            )
          })}
        </section>
      ) : null}
      {related.length ? (
        <section>
          <h2>Related materials</h2>
          <div className={styles.nav}>
            {related.map((r) => (
              <Link href={materialHref(r)} key={r.id} lang={r.kind === "reading" ? "en" : "ja"}>
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {m.kanjiIds.length ? (
        <section>
          <h2>Kanji reference cards</h2>
          <div className={styles.nav}>
            {m.kanjiIds.map((id) => (
              <Link href={`/card/${id}`} key={id}>
                Open{" "}
                <span lang="ja">
                  {String.fromCodePoint(parseInt(id.replace(/^kanji-/, ""), 16))}
                </span>{" "}
                card →
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className={styles.card}>
        <h2>Editorial and source notes</h2>
        <p>
          {m.origin} · {m.editorialStatus} · material version {m.version}
        </p>
        <p lang="en">{m.levelBasis}</p>
        {m.provenance && (
          <p>
            <a href={m.provenance.url}>Pinned {m.provenance.dataset} source file</a> · entry{" "}
            {m.provenance.entryId} · {m.provenance.license}
            {m.provenance.jmdictId ? ` · JMdict entry ${m.provenance.jmdictId}` : ""}
          </p>
        )}
        {sources.map((s) => (
          <p key={s.id}>
            <a href={s.url}>{s.title}</a> · {s.usage} · {s.license}
            <br />
            {s.attribution} · revision {s.revision}
          </p>
        ))}
        <Link href="/sources#jlpt-materials">Methodology and limits →</Link>
      </section>
    </div>
  )
}
