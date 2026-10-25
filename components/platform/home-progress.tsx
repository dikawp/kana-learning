"use client"
import Link from "next/link"
import { useSave } from "@/lib/platform/store"
import { stats } from "@/lib/platform/learning"

export function HomeProgress() {
  const { slot } = useSave()
  const summary = slot ? stats(slot) : null
  return (
    <div className="home-progress">
      <span className="meta">YOUR NOTEBOOK</span>
      <p>
        {slot?.active
          ? "A little unfinished practice is waiting."
          : summary?.seen
            ? `${summary.seen} characters encountered. Keep the habit growing.`
            : "Every journey begins with one character."}
      </p>
      <Link
        className="primary-button"
        href={
          slot?.active
            ? `/deck/${slot.active.deck}/practice?mode=${slot.active.mode}`
            : "/deck/hiragana-basic/practice"
        }
      >
        {slot?.active ? "Continue your practice" : "Begin with Hiragana"}
        <span aria-hidden="true">↗</span>
      </Link>
      <Link className="quiet-link" href="/dashboard">
        Open your progress
      </Link>
    </div>
  )
}
