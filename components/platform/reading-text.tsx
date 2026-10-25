import { romanizeReading } from "@/lib/platform/romaji"

export function ReadingText({ readings }: { readings: string[] }) {
  if (!readings.length) return <span>Not supplied</span>
  return (
    <>
      <span lang="ja">{readings.join(" / ")}</span>
      <span className="reading-romaji" lang="en">
        Romaji: {readings.map(romanizeReading).join(" / ")}
      </span>
    </>
  )
}
