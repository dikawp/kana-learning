import { catalog, getCard } from "@/lib/platform/repository"
export const dynamic = "force-static"
export const dynamicParams = false
export function generateStaticParams() {
  return catalog.cards.map((c) => ({ id: c.id }))
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const card = getCard((await params).id)
  return card
    ? Response.json(
        { revision: catalog.revision, card },
        { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } },
      )
    : Response.json({ error: "Card not found" }, { status: 404 })
}
