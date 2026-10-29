export function isAppExternalRequest(raw: string): boolean {
  const url = new URL(raw)
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return false
  // This exact script is injected by the host's antivirus during headless runs.
  // Keep every other external host and path subject to the app's network assertion.
  return !(
    url.origin === "http://gc.kis.v2.scr.kaspersky-labs.com" &&
    url.pathname === "/FD126C42-EBFA-4E12-B309-BB3FDD723AC1/main.js"
  )
}
