import assert from "node:assert/strict"

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

const origin = "http://127.0.0.1:4173"

export function fakeBrowser({ rawValue = '["h-a"]', failDownload = false } = {}) {
  const { storage, reads } = readonlyStorage(rawValue)
  const blobs = new Map()
  const downloads = []
  const deferred = []
  const removed = []
  const browser = {
    localStorage: storage,
    location: { origin },
    Blob,
    URL: {
      createObjectURL(blob) { const url = `blob:test-${blobs.size}`; blobs.set(url, blob); return url },
      revokeObjectURL(url) { blobs.delete(url) },
    },
    setTimeout(callback) { deferred.push(callback) },
    document: {
      body: { append() {} },
      createElement(tag) {
        assert.equal(tag, "a")
        return {
          click() {
            if (failDownload) throw new Error("download denied")
            downloads.push({ filename: this.download, blob: blobs.get(this.href) })
          },
          remove() { removed.push(this) },
        }
      },
    },
  }
  return { browser, reads, blobs, downloads, deferred, removed }
}
