import assert from "node:assert/strict"
import test from "node:test"
import {
  GUEST_PROGRESS_KEY,
  captureGuestProgress,
  downloadText,
  readGuestProgressBackup,
  serializeGuestProgressBackup,
} from "../public/guest-progress-backup.mjs"

import { fakeBrowser } from "./helpers/browser.mjs"

const origin = "http://127.0.0.1:4173"
const capturedAt = "2026-10-17T05:00:00.000Z"

function readonlyStorage(rawValue) {
  const reads = []
  const storage = {
    getItem(key) { reads.push(key); return rawValue },
    setItem() { assert.fail("export must not write storage") },
    removeItem() { assert.fail("export must not remove storage") },
    clear() { assert.fail("export must not clear storage") },
    key() { assert.fail("export must not inspect other keys") },
  }
  return { storage, reads }
}

for (const [name, raw, expectedStatus] of [
  ["valid IDs with original spacing, duplicate and unknown ID", '  ["h-a", "k-shi", "h-a", "future-id"]\n', "valid"],
  ["malformed JSON", '["h-a", broken', "invalid"],
  ["unexpected object shape", '{"learned":["h-a"]}', "invalid"],
  ["mixed array", '["h-a",5,null]', "invalid"],
  ["empty raw string", "", "invalid"],
  ["stored null string", "null", "invalid"],
  ["empty array", "[]", "valid"],
  ["Unicode and escapes", '["h-a","きゃ","𠮟","\\u3042"]\r\n', "valid"],
  ["malformed Unicode code unit", "\uD800", "invalid"],
  ["absent key", null, "missing"],
]) {
  test(`export/recovery preserves ${name} exactly and reads only the progress key`, () => {
    const { storage, reads } = readonlyStorage(raw)
    const result = captureGuestProgress(() => storage, origin, capturedAt)
    assert.equal(result.ok, true)
    assert.equal(result.inspection.status, expectedStatus)
    assert.deepEqual(reads, [GUEST_PROGRESS_KEY])
    assert.equal(result.backup.source.origin, origin)
    assert.equal(result.backup.capturedAt, capturedAt)
    assert.equal(result.backup.storage.present, raw !== null)
    const recovered = readGuestProgressBackup(serializeGuestProgressBackup(result.backup))
    assert.equal(recovered, raw)
    if (raw !== null) assert.deepEqual(Buffer.from(recovered), Buffer.from(raw))
    assert.equal(storage.getItem(GUEST_PROGRESS_KEY), raw)
  })
}

test("denied localStorage getter or getItem fails explicitly without creating an empty backup", () => {
  for (const getter of [
    () => { throw new Error("denied getter") },
    () => ({ getItem() { throw new Error("denied read") } }),
  ]) {
    assert.deepEqual(captureGuestProgress(getter, origin, capturedAt), { ok: false, code: "storage-unavailable" })
  }
})

test("rejects malformed, unsupported, incomplete or internally inconsistent backup envelopes", () => {
  const valid = captureGuestProgress(() => readonlyStorage('["h-a"]').storage, origin, capturedAt).backup
  assert.throws(() => readGuestProgressBackup("not JSON"), /not valid backup JSON/)
  for (const alter of [
    (b) => { b.schemaVersion = 2 },
    (b) => { b.format = "other" },
    (b) => { b.capturedAt = "invalid" },
    (b) => { delete b.source },
    (b) => { b.source.storageKey = "theme" },
    (b) => { b.storage.present = false },
    (b) => { b.storage.rawValue = [] },
    (b) => { delete b.storage },
  ]) {
    const backup = structuredClone(valid)
    alter(backup)
    assert.throws(() => readGuestProgressBackup(JSON.stringify(backup)), /not a supported/)
  }
  for (const value of [null, [], {}, 1, "string"]) {
    assert.throws(() => readGuestProgressBackup(JSON.stringify(value)), /not a supported/)
  }
})


test("download carries exact recoverable bytes, removes its link and releases the URL after handoff", async () => {
  const context = fakeBrowser()
  const backup = captureGuestProgress(() => context.browser.localStorage, origin, capturedAt).backup
  downloadText(serializeGuestProgressBackup(backup), "backup.json", context.browser)
  assert.equal(context.downloads.length, 1)
  assert.equal(context.downloads[0].filename, "backup.json")
  assert.equal(readGuestProgressBackup(await context.downloads[0].blob.text()), '["h-a"]')
  assert.equal(context.removed.length, 1)
  assert.equal(context.blobs.size, 1)
  context.deferred.forEach((callback) => callback())
  assert.equal(context.blobs.size, 0)
  assert.deepEqual(context.reads, [GUEST_PROGRESS_KEY])
})

test("failed download still releases resources and cannot modify stored progress", () => {
  const context = fakeBrowser({ failDownload: true })
  assert.throws(() => downloadText("raw", "backup.json", context.browser), /download denied/)
  assert.equal(context.removed.length, 1)
  context.deferred.forEach((callback) => callback())
  assert.equal(context.blobs.size, 0)
  assert.deepEqual(context.reads, [])
})
