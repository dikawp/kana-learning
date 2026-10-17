export const GUEST_PROGRESS_KEY = "kana-learned-characters"
export const BACKUP_FORMAT = "kana-learning-guest-progress"
export const BASELINE_COMMIT = "9bf0c966d039cf0716935693e10394f287a2a0a9"

// Inspection is informational only. Never normalize or discard the recoverable raw value.
export function inspectRawProgress(rawValue) {
  if (rawValue === null) return { status: "missing", count: 0 }
  try {
    const value = JSON.parse(rawValue)
    if (Array.isArray(value) && value.every((id) => typeof id === "string")) {
      return { status: "valid", count: value.length }
    }
  } catch {
    // Even malformed JSON must remain exportable.
  }
  return { status: "invalid", count: null }
}

// Accept a getter so denied access to window.localStorage itself is caught too.
// The storage capability is read-only: getItem is the only method used.
export function captureGuestProgress(getStorage, origin, capturedAt = new Date().toISOString()) {
  let rawValue
  try {
    rawValue = getStorage().getItem(GUEST_PROGRESS_KEY)
  } catch {
    return { ok: false, code: "storage-unavailable" }
  }
  if (rawValue !== null && typeof rawValue !== "string") {
    return { ok: false, code: "storage-unavailable" }
  }
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      schemaVersion: 1,
      capturedAt,
      source: { origin, storageKey: GUEST_PROGRESS_KEY, baselineCommit: BASELINE_COMMIT },
      storage: { present: rawValue !== null, rawValue },
    },
    inspection: inspectRawProgress(rawValue),
  }
}

export function serializeGuestProgressBackup(backup) {
  const text = JSON.stringify(backup, null, 2) + "\n"
  // Validate our own envelope before offering a recovery file.
  readGuestProgressBackup(text)
  return text
}

// Returns the exact original string (or null for an absent key), without writing it anywhere.
export function readGuestProgressBackup(text) {
  let backup
  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error("This file is not valid backup JSON.")
  }
  if (
    backup?.format !== BACKUP_FORMAT ||
    backup.schemaVersion !== 1 ||
    typeof backup.capturedAt !== "string" ||
    !Number.isFinite(Date.parse(backup.capturedAt)) ||
    typeof backup.source?.origin !== "string" ||
    backup.source.storageKey !== GUEST_PROGRESS_KEY ||
    backup.source.baselineCommit !== BASELINE_COMMIT ||
    typeof backup.storage?.present !== "boolean" ||
    !(backup.storage.rawValue === null || typeof backup.storage.rawValue === "string") ||
    backup.storage.present !== (backup.storage.rawValue !== null)
  ) {
    throw new Error("This file is not a supported version 1 guest progress backup.")
  }
  return backup.storage.rawValue
}

// Isolated download boundary; neither successful nor failed downloads touch storage.
export function downloadText(text, filename, browser = globalThis) {
  const blob = new browser.Blob([text], { type: "application/json;charset=utf-8" })
  const url = browser.URL.createObjectURL(blob)
  let link
  try {
    link = browser.document.createElement("a")
    link.href = url
    link.download = filename
    browser.document.body.append(link)
    link.click()
  } finally {
    link?.remove()
    // Allow the browser time to consume the object URL before releasing it.
    browser.setTimeout(() => browser.URL.revokeObjectURL(url), 1000)
  }
}
