import { notFound } from "next/navigation"
import { catalog, getDeck, getDeckCards } from "@/lib/platform/repository"
import { Practice } from "@/components/platform/practice"
import type { Mode } from "@/lib/platform/learning"
export function generateStaticParams() {
  return catalog.decks.map((d) => ({ slug: d.slug }))
}
export const dynamicParams = false
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: `Practice ${getDeck((await params).slug)?.title ?? ""} · Kana-Learn` }
}
export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const d = getDeck((await params).slug)
  if (!d) notFound()
  const value = (await searchParams).mode
  const mode: Mode = value === "quiz" || value === "review" ? value : "flashcards"
  return (
    <Practice
      deck={d}
      cards={getDeckCards(d.slug)}
      revision={catalog.revision}
      initialMode={mode}
    />
  )
}
