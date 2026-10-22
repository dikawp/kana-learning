import { and, eq, sql } from "drizzle-orm"
import * as s from "../db/schema"
import { dictionaryDocument } from "../../lib/content/dictionary"
import { documentHash, type ContentDatabase } from "./revisions"
import { ApiError } from "../api/errors"

// Operator-only function. There is deliberately no anonymous publication HTTP endpoint.
export async function publishRelease(db: ContentDatabase, releaseId: string, publisher: string) {
  if (!publisher.trim() || publisher.length > 200) throw new ApiError(409, "PUBLISHER_REQUIRED", "A real publishing operator is required.")
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(373131)`)
    const [release] = await tx.select().from(s.contentReleases).where(eq(s.contentReleases.id, releaseId)).for("update")
    if (!release) throw new ApiError(404, "RELEASE_NOT_FOUND", "Release was not found.")
    const items = await tx.select({ materialId: s.releaseItems.materialId, revisionId: s.releaseItems.revisionId, checksum: s.materialRevisions.checksum,
      payload: s.materialRevisions.payload, stableKey: s.materials.stableKey, kind: s.materials.kind })
      .from(s.releaseItems).innerJoin(s.materialRevisions, and(eq(s.materialRevisions.id, s.releaseItems.revisionId), eq(s.materialRevisions.materialId, s.releaseItems.materialId)))
      .innerJoin(s.materials, eq(s.materials.id, s.releaseItems.materialId)).where(eq(s.releaseItems.releaseId, releaseId))
    if (!items.length) throw new ApiError(409, "EMPTY_RELEASE", "A release must contain reviewed material.")
    for (const item of items) {
      const parsed = dictionaryDocument.safeParse(item.payload)
      if (!parsed.success || documentHash(parsed.data) !== item.checksum || parsed.data.kind !== item.kind || parsed.data.stableKey !== item.stableKey) throw new ApiError(409, "INVALID_REVISION", "Material revision is invalid.")
      const [review] = await tx.select().from(s.contentReviews).where(eq(s.contentReviews.revisionId, item.revisionId))
      if (!review) throw new ApiError(409, "REVIEW_REQUIRED", "A recorded editorial review is required.")
      const sources = await tx.select({ snapshotId: s.sourceSnapshots.id, sourceId: s.contentSources.id, reuseStatus: s.contentSources.reuseStatus,
        checksum: s.sourceSnapshots.checksum, version: s.sourceSnapshots.version, sourceDate: s.sourceSnapshots.sourceDate,
        name: s.contentSources.name, url: s.contentSources.url, license: s.contentSources.license, licenseUrl: s.contentSources.licenseUrl, attribution: s.contentSources.attribution })
        .from(s.revisionSources).innerJoin(s.sourceSnapshots, eq(s.sourceSnapshots.id, s.revisionSources.snapshotId))
        .innerJoin(s.contentSources, eq(s.contentSources.id, s.sourceSnapshots.sourceId)).where(eq(s.revisionSources.revisionId, item.revisionId)).for("share")
      if (sources.length !== parsed.data.sources.length || sources.some((source) => {
        const { reuseStatus, ...provenance } = source
        const recorded = parsed.data.sources.find((entry) => entry.snapshotId === source.snapshotId)
        return reuseStatus !== "verified" || !recorded || JSON.stringify(Object.entries(provenance).sort()) !== JSON.stringify(Object.entries(recorded).sort())
      })) throw new ApiError(409, "RIGHTS_REQUIRED", "Verified source rights and matching attribution are required.")
    }
    if (release.status === "draft") await tx.update(s.contentReleases).set({ status: "published", publisher: publisher.trim(), publishedAt: new Date() }).where(eq(s.contentReleases.id, releaseId))
    await tx.insert(s.activeRelease).values({ slot: "public", releaseId }).onConflictDoUpdate({ target: s.activeRelease.slot, set: { releaseId } })
    return { releaseId, count: items.length }
  })
}
