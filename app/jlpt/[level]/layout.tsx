import { notFound } from "next/navigation"
import { isLevel, levels } from "@/lib/jlpt/types"

// Material details are generated on demand; the layout validates the level below.
export const dynamicParams = true
export function generateStaticParams() {
  return levels.map((level) => ({ level }))
}
export default async function LevelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ level: string }>
}) {
  if (!isLevel((await params).level)) notFound()
  return children
}
