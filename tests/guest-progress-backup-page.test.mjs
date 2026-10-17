import assert from "node:assert/strict"
import test from "node:test"
import { mountBackupPage } from "../public/guest-progress-backup-page.mjs"
import { readGuestProgressBackup } from "../public/guest-progress-backup.mjs"
import { fakeBrowser } from "./helpers/browser.mjs"

function page(options) {
  const context = fakeBrowser(options)
  const elements = Object.fromEntries([
    "export-progress", "export-status", "backup-file", "verify-status", "download-original", "storage-origin",
  ].map((id) => [id, {
    textContent: "", disabled: id === "download-original", files: [], handlers: {},
    addEventListener(event, callback) { this.handlers[event] = callback },
  }]))
  const document = { getElementById(id) { assert.ok(elements[id]); return elements[id] } }
  mountBackupPage(document, context.browser)
  return { ...context, elements }
}

test("page mounting does not read or write progress; user export can be verified and extracted", async () => {
  const rawValue = '  ["h-a", "h-a", "unknown"]\n'
  const { elements, reads, downloads } = page({ rawValue })
  assert.deepEqual(reads, [])
  elements["export-progress"].handlers.click()
  assert.equal(downloads.length, 1)
  assert.match(elements["export-status"].textContent, /3 stored ID entries captured/)
  assert.match(elements["export-status"].textContent, /Download requested/)
  const saved = await downloads[0].blob.text()
  assert.equal(readGuestProgressBackup(saved), rawValue)
  elements["backup-file"].files = [{ text: async () => saved }]
  await elements["backup-file"].handlers.change()
  assert.equal(elements["download-original"].disabled, false)
  assert.match(elements["verify-status"].textContent, /Verified version 1 backup/)
  elements["download-original"].handlers.click()
  assert.equal(downloads[1].filename, "kana-learned-characters-original.json")
  assert.equal(JSON.parse(await downloads[1].blob.text()), rawValue)
  assert.equal(reads.length, 1, "saved-file verification/extraction must not reread storage")
})

test("page reports unavailable storage without starting any download", () => {
  const { browser, elements, downloads } = page()
  Object.defineProperty(browser, "localStorage", { get() { throw new Error("blocked") } })
  elements["export-progress"].handlers.click()
  assert.match(elements["export-status"].textContent, /No backup was created/)
  assert.equal(downloads.length, 0)
})

test("page reports download failure honestly and preserves the original", () => {
  const { elements, downloads } = page({ failDownload: true })
  elements["export-progress"].handlers.click()
  assert.match(elements["export-status"].textContent, /could not be started/)
  assert.equal(downloads.length, 0)
})

test("malformed storage is exportable and a missing key is explicitly distinguished", async () => {
  for (const rawValue of ["broken", "", "\uD800", null]) {
    const { elements, downloads } = page({ rawValue })
    elements["export-progress"].handlers.click()
    assert.match(elements["export-status"].textContent, rawValue === null ? /No stored progress key/ : /malformed/)
    const text = await downloads[0].blob.text()
    elements["backup-file"].files = [{ text: async () => text }]
    await elements["backup-file"].handlers.change()
    assert.equal(elements["download-original"].disabled, rawValue === null)
    assert.equal(readGuestProgressBackup(text), rawValue)
    if (rawValue !== null) {
      elements["download-original"].handlers.click()
      assert.equal(JSON.parse(await downloads[1].blob.text()), rawValue)
    }
  }
})

test("an invalid selected file clears an earlier extraction and cannot change storage", async () => {
  const { elements, downloads } = page()
  elements["export-progress"].handlers.click()
  const text = await downloads[0].blob.text()
  elements["backup-file"].files = [{ text: async () => text }]
  await elements["backup-file"].handlers.change()
  elements["backup-file"].files = [{ text: async () => "invalid" }]
  await elements["backup-file"].handlers.change()
  assert.equal(elements["download-original"].disabled, true)
  assert.match(elements["verify-status"].textContent, /could not be read/)
  elements["download-original"].handlers.click()
  assert.equal(downloads.length, 1)
})

test("stale file reads cannot reenable extraction after choosing another file", async () => {
  const { elements, downloads } = page()
  elements["export-progress"].handlers.click()
  const text = await downloads[0].blob.text()
  let finishRead
  elements["backup-file"].files = [{ text: () => new Promise((resolve) => { finishRead = resolve }) }]
  const oldRead = elements["backup-file"].handlers.change()
  elements["backup-file"].files = [{ text: async () => "invalid" }]
  await elements["backup-file"].handlers.change()
  finishRead(text)
  await oldRead
  assert.equal(elements["download-original"].disabled, true)
  assert.match(elements["verify-status"].textContent, /could not be read/)
})
