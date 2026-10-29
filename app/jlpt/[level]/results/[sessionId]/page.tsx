import { notFound } from "next/navigation"
import { PageHeading } from "@/components/platform/catalog"
import { SavedResult } from "@/components/jlpt/practice"
import { isLevel } from "@/lib/jlpt/types"
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ level: string; sessionId: string }>
}) {
  const { level, sessionId } = await params
  if (!isLevel(level) || !/^[a-zA-Z0-9-]{1,100}$/.test(sessionId)) notFound()
  return (
    <>
      <PageHeading
        eyebrow={`JLPT / ${level.toUpperCase()} / SAVED RESULTS`}
        title="Your practice notes."
      />
      <SavedResult level={level} sessionId={sessionId} />
    </>
  )
}
