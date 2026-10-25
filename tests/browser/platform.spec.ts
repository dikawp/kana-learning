import { expect, test } from "@playwright/test"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

test("catalog → practice → resume → quiz → review → dashboard → backup", async ({
  page,
}, testInfo) => {
  const external: string[] = [],
    errors: string[] = []
  page.on("request", (req) => {
    if (!new URL(req.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) external.push(req.url())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /A character today/ })).toBeVisible()
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") })
  const audit = () =>
    page.evaluate(async () => {
      const axe = (window as unknown as { axe: typeof import("axe-core") }).axe
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
      return result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      }))
    })
  expect(await audit()).toEqual([])
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: testInfo.outputPath("desktop-light.png"), fullPage: true })
  await page.screenshot({ path: testInfo.outputPath("desktop-start.png") })
  await page.getByRole("button", { name: "Toggle color theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  expect(await audit()).toEqual([])
  await page.screenshot({ path: testInfo.outputPath("desktop-dark.png"), fullPage: true })
  await page.getByRole("button", { name: "Toggle color theme" }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole("link", { name: "Begin with Hiragana" })).toBeInViewport()
  await page.getByRole("button", { name: "Open catalog menu" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).not.toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("mobile-light.png"), fullPage: true })
  await page.screenshot({ path: testInfo.outputPath("mobile-start.png") })
  await page.getByRole("button", { name: "Toggle color theme" }).click()
  await page.screenshot({ path: testInfo.outputPath("mobile-dark.png"), fullPage: true })
  await page.getByRole("button", { name: "Toggle color theme" }).click()
  await page.goto("/deck/hiragana-handakuten/practice")
  await page.getByRole("button", { name: "Start flashcards" }).click()
  await page.getByRole("button", { name: "Show answer" }).click()
  await page.getByRole("button", { name: "Got It Let it settle" }).click()
  await page.reload()
  await expect(page.getByRole("button", { name: "Next character" })).toBeVisible()
  const snapshot = await page.evaluate(() => localStorage.getItem("kana-learn:sakura:v1"))
  expect(snapshot).toBeTruthy()
  page.on("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Quiz", exact: true }).click()
  await page.getByRole("button", { name: "Start quiz" }).click()
  // Deliberately make one mistake to exercise review. Expected answers come
  // from the session snapshot, not assumptions about shuffled question order.
  for (let i = 0; i < 5; i++) {
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("kana-learn:sakura:v1")!),
    )
    const slot = state.slots.find((s: { id: string }) => s.id === state.activeSlotId)
    const q = slot.active.questions[slot.active.index]
    const option = q.options.find((o: { id: string }) =>
      i === 0 ? o.id !== q.answerId : o.id === q.answerId,
    )
    await page.getByRole("button", { name: option.label, exact: true }).click()
    await page
      .getByRole("button", { name: i === 4 ? "See your results" : "Next character" })
      .click()
  }
  await expect(page.getByRole("heading", { name: "Practice, not perfection." })).toBeVisible()
  await page.getByRole("button", { name: "Review", exact: true }).click()
  await page.getByRole("button", { name: "Start review" }).click()
  await expect(page.getByRole("button", { name: "Show answer" })).toBeVisible()
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: /Keep growing/ })).toBeVisible()
  const before = await page.locator(".stats-grid").innerText()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export save" }).click()
  const download = await downloadPromise
  const exportPath = testInfo.outputPath("backup.json")
  await download.saveAs(exportPath)
  await page.getByLabel("Import save file").setInputFiles(exportPath)
  await expect(page.getByRole("heading", { name: "Import as a new slot?" })).toBeVisible()
  await page.getByRole("button", { name: "Confirm import" }).click()
  await expect.poll(() => page.locator(".stats-grid").innerText()).toBe(before)
  await expect(page.getByLabel("Active save").locator("option")).toHaveCount(2)
  await page.goto("/search")
  await page.getByRole("searchbox").fill("water")
  await expect(page.locator(".character-tile").first()).toBeVisible()
  await page.goto("/card/kanji-65e5")
  await expect(page.getByRole("heading", { name: /日 —/ })).toBeVisible()
  await expect(page.locator(".readings dd").first()).toContainText("Romaji: jitsu / nichi")
  await expect(page.locator(".word-grid .reading-romaji").first()).toContainText("Romaji:")
  await page.screenshot({ path: testInfo.outputPath("kanji-card.png"), fullPage: true })
  expect(external).toEqual([])
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test("JLPT overview, level search, new card mapping and practice", async ({ page }, testInfo) => {
  await page.goto("/jlpt")
  await expect(page.getByRole("heading", { name: "Your JLPT study map." })).toBeVisible()
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") })
  expect(
    await page.evaluate(async () => {
      const axe = (window as unknown as { axe: typeof import("axe-core") }).axe
      return (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => v.id)
    }),
  ).toEqual([])
  await page.screenshot({ path: testInfo.outputPath("jlpt-map.png"), fullPage: true })
  await page.locator('.set-grid a[href="/set/jlpt-n1"]').click()
  await expect(page.getByRole("heading", { name: "JLPT N1", exact: true })).toBeVisible()
  await page.goto("/search")
  await page.getByLabel("JLPT level").selectOption("1")
  await expect(page.getByRole("status")).toContainText("1232 characters")
  await page.getByRole("searchbox").fill("凪")
  await page.locator('a[href="/card/kanji-51ea"]').click()
  await expect(page.getByRole("link", { name: "Approx. JLPT N1", exact: true })).toBeVisible()
  await page.locator(".deck-grid a").first().click()
  await expect(page.getByRole("heading", { name: /JLPT N1/ })).toBeVisible()
  await page.getByRole("link", { name: "Flashcards ↗", exact: true }).click()
  await page.getByRole("button", { name: "Start flashcards" }).click()
  await expect(page.getByRole("button", { name: "Show answer" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("button", { name: "Show answer" })).toBeVisible()
})
