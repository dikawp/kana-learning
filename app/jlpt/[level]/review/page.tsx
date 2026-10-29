import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { LevelNav } from "@/components/jlpt/navigation"
import { PracticeRoom } from "@/components/jlpt/practice"
import { catalog } from "@/lib/platform/repository"
import { isLevel } from "@/lib/jlpt/types"
export default async function ReviewPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params
  if (!isLevel(level)) notFound()
  const kanjiReview = catalog.decks
    .filter((d) => d.set === `jlpt-${level}`)
    .map((d) => ({
      href: `/deck/${d.slug}/practice?mode=review`,
      title: d.title,
      cardIds: d.cardIds,
    }))
  return (
    <>
      <LevelNav level={level} />
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()} / REVIEW`}
        title="Return to what needs practice."
      />
      <PracticeRoom
        key={level}
        level={level}
        questions={[]}
        mode="review"
        kanjiReview={kanjiReview}
      />
    </>
  )
}
