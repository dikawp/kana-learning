import { getMaterial, getLegacyMaterial, getQuestions, getSources } from "@/lib/jlpt/repository"
import { isLevel } from "@/lib/jlpt/types"
export function GET(request: Request) {
  const query = new URL(request.url).searchParams,
    level = query.get("level") ?? "",
    ids = (query.get("ids") ?? "").split(",").filter(Boolean)
  if (
    !isLevel(level) ||
    !ids.length ||
    ids.length > 40 ||
    ids.some((id) => !/^[a-z0-9-]{1,128}$/.test(id))
  )
    return Response.json(
      { error: "Choose a valid level and between 1 and 40 material IDs." },
      { status: 400 },
    )
  if (ids.some((id) => !getMaterial(id) && !getLegacyMaterial(id)))
    return Response.json({ error: "Material not found." }, { status: 404 })
  const questions = getQuestions(level, ids)
  return Response.json(
    {
      questions,
      sources: getSources([...new Set(questions.flatMap((q) => q.sourceIds))]),
      missingIds: ids.filter(
        (id) => !questions.some((q) => q.materialId === (getLegacyMaterial(id)?.targetId ?? id)),
      ),
    },
    { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } },
  )
}
