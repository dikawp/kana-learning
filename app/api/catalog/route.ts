import { catalog } from "@/lib/platform/repository"
export const dynamic = "force-static"
export function GET() {
  return Response.json(catalog, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      ETag: `"${catalog.revision}"`,
    },
  })
}
