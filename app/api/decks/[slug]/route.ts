import { catalog, getDeck, getDeckCards } from "@/lib/platform/repository"
export const dynamic = "force-static"
export const dynamicParams = false
export function generateStaticParams() {
  return catalog.decks.map((d) => ({ slug: d.slug }))
}
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug,
    deck = getDeck(slug)
  return deck
    ? Response.json(
        { revision: catalog.revision, deck, cards: getDeckCards(slug) },
        { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } },
      )
    : Response.json({ error: "Deck not found" }, { status: 404 })
}
