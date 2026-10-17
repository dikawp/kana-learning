// Local manual smoke test only. Never used by the production application.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"

const files = new Map([
  ["/guest-progress-backup.html", ["../public/guest-progress-backup.html", "text/html"]],
  ["/guest-progress-backup.mjs", ["../public/guest-progress-backup.mjs", "text/javascript"]],
  ["/guest-progress-backup-page.mjs", ["../public/guest-progress-backup-page.mjs", "text/javascript"]],
])
const harness = `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Isolated guest recovery test</title><main>
<h1>Isolated guest recovery test</h1>
<p>Synthetic progress only. This random localhost origin cannot read deployed progress.</p>
<label for="raw">Synthetic original value</label>
<textarea id="raw" rows="4" cols="70">  ["h-a", "k-shi", "h-a", "unknown-id"]
</textarea>
<p><button id="seed">Seed synthetic progress</button> <button id="check">Check unchanged original</button></p>
<p><a href="/guest-progress-backup.html">Open recovery page</a></p>
<p id="status" role="status"></p><pre id="value"></pre>
<script>
document.getElementById('seed').onclick = () => {
  const raw = document.getElementById('raw').value;
  localStorage.setItem('kana-learned-characters', raw);
  // Test-only expected value; the recovery implementation must never read this key.
  sessionStorage.setItem('recovery-test-expected', raw);
  document.getElementById('status').textContent = 'Synthetic original seeded.';
};
document.getElementById('check').onclick = () => {
  const raw = localStorage.getItem('kana-learned-characters');
  document.getElementById('status').textContent = raw === sessionStorage.getItem('recovery-test-expected')
    ? 'PASS: original storage string is unchanged.' : 'FAIL: original storage differs.';
  document.getElementById('value').textContent = JSON.stringify(raw);
};
</script></main></html>`

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store")
  if (request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" }).end(harness)
    return
  }
  const file = files.get(request.url)
  if (!file) { response.writeHead(404).end("Not found"); return }
  try {
    const content = await readFile(new URL(file[0], import.meta.url))
    response.writeHead(200, { "Content-Type": `${file[1]};charset=utf-8` }).end(content)
  } catch {
    response.writeHead(500).end("Could not read recovery asset")
  }
})
server.listen(0, "127.0.0.1", () => {
  console.log(`Isolated recovery smoke test: http://127.0.0.1:${server.address().port}`)
  console.log("Use synthetic progress only. Stop with Ctrl+C when finished.")
})
