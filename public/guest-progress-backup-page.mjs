import {
  captureGuestProgress,
  downloadText,
  inspectRawProgress,
  readGuestProgressBackup,
  serializeGuestProgressBackup,
} from "./guest-progress-backup.mjs"

export function mountBackupPage(document, browser) {
  const exportButton = document.getElementById("export-progress")
  const exportStatus = document.getElementById("export-status")
  const fileInput = document.getElementById("backup-file")
  const verifyStatus = document.getElementById("verify-status")
  const rawButton = document.getElementById("download-original")
  let verifiedRaw = null

  document.getElementById("storage-origin").textContent = browser.location.origin
  exportButton.addEventListener("click", () => {
    const result = captureGuestProgress(() => browser.localStorage, browser.location.origin)
    if (!result.ok) {
      exportStatus.textContent = "Browser storage could not be read. No backup was created. Allow storage access on this origin and try again."
      return
    }
    try {
      downloadText(serializeGuestProgressBackup(result.backup), "kana-guest-progress-v1.json", browser)
      const detail = result.inspection.status === "valid"
        ? `${result.inspection.count} stored ID entries captured, including any duplicates or unknown IDs.`
        : result.inspection.status === "missing"
          ? "No stored progress key was found on this origin. The backup records its absence."
          : "The stored value is malformed or has an unexpected shape. Its exact raw text was captured for recovery."
      exportStatus.textContent = `${detail} Download requested; verify the saved file below. The original storage was not changed.`
    } catch {
      exportStatus.textContent = "The backup download could not be started. The original storage was not changed. Try again."
    }
  })

  fileInput.addEventListener("change", async () => {
    verifiedRaw = null
    rawButton.disabled = true
    verifyStatus.textContent = ""
    const file = fileInput.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      // Ignore an outdated read if the user chose another file while this one loaded.
      if (fileInput.files?.[0] !== file) return
      verifiedRaw = readGuestProgressBackup(text)
      const inspection = inspectRawProgress(verifiedRaw)
      rawButton.disabled = verifiedRaw === null
      verifyStatus.textContent = verifiedRaw === null
        ? "Verified backup: the progress key was absent. There is no original value to extract. Storage was not changed."
        : `Verified version 1 backup. The exact original value is available to extract (${inspection.status === "valid" ? `${inspection.count} stored ID entries` : "malformed or unexpected stored data preserved"}). Storage was not changed.`
    } catch {
      if (fileInput.files?.[0] !== file) return
      verifiedRaw = null
      rawButton.disabled = true
      verifyStatus.textContent = "This file could not be read as a supported version 1 backup. Storage was not changed."
    }
  })

  rawButton.addEventListener("click", () => {
    if (verifiedRaw === null) return
    try {
      // JSON encoding preserves even lone UTF-16 surrogates; a plain UTF-8 Blob would replace them.
      downloadText(JSON.stringify(verifiedRaw), "kana-learned-characters-original.json", browser)
      verifyStatus.textContent = "Original-value download requested. Keep it with the versioned backup. No value was restored or changed in browser storage."
    } catch {
      verifyStatus.textContent = "Original-value download could not be started. The saved backup and browser storage were not changed."
    }
  })
}

if (typeof window !== "undefined") mountBackupPage(window.document, window)
