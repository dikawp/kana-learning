// Explicit acquisition only. Builds and learning never access upstream services.
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

const revision = "0d1d3410bec90bd4098a7c72de820543cb4f707c"
const root = path.join(process.cwd(), "content/jlpt/upstream/openjlpt")
const paths = [
  "NOTICE.md",
  "LICENSE",
  "data/json/meta.json",
  ...["n5", "n4", "n3", "n2", "n1"].flatMap((level) => [
    `data/json/vocab/${level}.json`,
    `data/json/grammar/${level}.json`,
  ]),
]
async function main() {
  await fs.mkdir(root, { recursive: true })
  const files = []
  for (const upstreamPath of paths) {
    const url = `https://raw.githubusercontent.com/evanclan/OpenJLPT/${revision}/${upstreamPath}`
    const response = await fetch(url)
    if (!response.ok) throw Error(`Resource acquisition failed: ${response.status} ${url}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const file = upstreamPath.replaceAll("/", "--")
    await fs.writeFile(path.join(root, file), bytes)
    files.push({
      file,
      upstreamPath,
      url,
      bytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    })
  }
  await fs.writeFile(
    path.join(root, "manifest.json"),
    `${JSON.stringify(
      {
        dataset: "OpenJLPT",
        revision,
        license: "CC-BY-SA-4.0",
        acquiredAt: "2026-10-28",
        files,
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    `Acquired ${files.length} pinned OpenJLPT data/license files; no kanji or audio imported.`,
  )
}
void main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
