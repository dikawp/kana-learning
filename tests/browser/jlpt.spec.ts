import { expect, test, type Page } from "@playwright/test"
import { createRequire } from "node:module"
import fs from "node:fs/promises"
import type { JlptProgress } from "../../lib/jlpt/learning"
import { isAppExternalRequest } from "./network"

const require = createRequire(import.meta.url)
const activeSlot = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("kana-learn:sakura:v1")!).activeSlotId as string,
  )
const progress = (page: Page, slotId?: string) =>
  page.evaluate(async (id) => {
    const slot = id ?? JSON.parse(localStorage.getItem("kana-learn:sakura:v1")!).activeSlotId
    return new Promise<JlptProgress | undefined>((resolve, reject) => {
      const open = indexedDB.open("kana-learn:jlpt:v1", 1)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        const tx = db.transaction("slots", "readonly")
        const request = tx.objectStore("slots").get(slot)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.oncomplete = () => db.close()
      }
    })
  }, slotId)

async function openFirstLesson(page: Page) {
  await page.goto("/jlpt/n5/moji-goi")
  await page.getByRole("link", { name: "Open lesson", exact: false }).first().click()
  await expect(page.getByRole("button", { name: "Mark studied", exact: true })).toBeEnabled()
  return new URL(page.url()).pathname.split("/").at(-1)!
}

async function audit(page: Page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") })
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import("axe-core") }).axe
    return (
      await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
    ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))
  })
  expect(violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
}

test("directory filters keep the selected level and can be reset", async ({ page }) => {
  await page.goto("/jlpt/n3/moji-goi")
  await page.getByLabel("Search materials").fill("申し込む")
  await page.getByRole("combobox", { name: "Tag", exact: true }).selectOption("vocabulary")
  await page
    .getByRole("combobox", { name: "Source", exact: true })
    .selectOption("openjlpt-vocabulary")
  await page
    .getByRole("combobox", { name: "Study status", exact: true })
    .selectOption("not-started")
  await page.getByRole("button", { name: "Apply filters", exact: true }).click()
  await expect(page).toHaveURL(/\/jlpt\/n3\/moji-goi\?/)
  await expect(page.getByRole("link", { name: "Open lesson", exact: false })).toHaveCount(1)
  await expect(page.getByRole("heading", { name: "申し込む", exact: true })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Source", exact: true })).toHaveValue(
    "openjlpt-vocabulary",
  )
  await page.getByLabel("Search materials").fill("no-such-material")
  await page.getByRole("button", { name: "Apply filters", exact: true }).click()
  await expect(page.getByRole("status").filter({ hasText: "0 of 1659" })).toBeVisible()
  await page.getByRole("link", { name: "Reset filters", exact: true }).click()
  await expect(page).toHaveURL(/\/jlpt\/n3\/moji-goi$/)
  await expect(page.getByRole("link", { name: "Open lesson", exact: false })).toHaveCount(40)
  await page.getByRole("button", { name: /Show more materials/ }).click()
  await expect(page.getByRole("link", { name: "Open lesson", exact: false })).toHaveCount(80)
})

test("source imports keep English content, legacy links and on-demand review variants", async ({
  page,
}) => {
  await page.goto("/jlpt/n5/moji-goi/jlpt-n5-hon")
  await expect(page).toHaveURL(/\/jlpt\/n5\/moji-goi\/jlpt-n5-v-/)
  await expect(page.getByRole("link", { name: "Pinned OpenJLPT source file" })).toBeVisible()
  await expect(page.locator('[lang="id"]')).toHaveCount(0)
  await page.getByRole("link", { name: "Practice this material" }).click()
  await page.getByRole("button", { name: "Start practice" }).click()
  const initial = (await progress(page))!.active!,
    q = initial.questions[0]
  await page
    .getByRole("radio", { name: q.options.find((o) => o.id !== q.answerId)!.label, exact: true })
    .check()
  await page.getByRole("button", { name: "Submit answer" }).click()
  await page.getByRole("button", { name: "Finish and view results" }).click()
  await expect(page.getByRole("heading", { name: "Completed practice", exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const slot = JSON.parse(localStorage.getItem("kana-learn:sakura:v1")!).activeSlotId
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("kana-learn:jlpt:v1", 1)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result,
          tx = db.transaction("slots", "readwrite"),
          store = tx.objectStore("slots"),
          request = store.get(slot)
        request.onsuccess = () => {
          const data = request.result as JlptProgress
          for (const r of Object.values(data.review))
            r.nextReviewAt = new Date(Date.now() - 1000).toISOString()
          data.revision++
          store.put(data, slot)
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onabort = () => reject(tx.error)
      }
    })
  })
  const requests: string[] = []
  page.on("request", (request) => {
    if (request.url().includes("/api/jlpt/questions")) requests.push(request.url())
  })
  await page.goto("/jlpt/n5/review")
  await page.getByRole("button", { name: "Start due review" }).click()
  const reviewed = (await progress(page))!.active!
  expect(reviewed.mode).toBe("review")
  expect(reviewed.questions[0].id).not.toBe(q.id)
  expect(reviewed.questions[0].method).toBe("source-derived")
  expect(requests.length).toBeGreaterThan(0)
  for (const request of requests) {
    const query = new URL(request).searchParams
    expect(query.get("ids")?.split(",").length).toBeLessThanOrEqual(20)
    expect(query.has("answers")).toBe(false)
  }
  await page.reload()
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeVisible()
  expect((await progress(page))!.active!.questions).toEqual(reviewed.questions)
  await page.goto("/jlpt/n1/moji-goi/jlpt-n1-sessoku")
  await expect(
    page.getByRole("heading", { name: "This pilot entry has been retired." }),
  ).toBeVisible()
})

test("first-visit JLPT lessons, answers and completed snapshots survive refresh", async ({
  page,
}) => {
  const external: string[] = [],
    media: string[] = [],
    errors: string[] = []
  page.on("request", (request) => {
    if (isAppExternalRequest(request.url())) external.push(request.url())
    if (
      request.resourceType() === "media" ||
      /\.(mp3|mp4|ogg|wav|webm)(?:\?|$)/i.test(request.url())
    )
      media.push(request.url())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  const materialId = await openFirstLesson(page)
  const slotId = await activeSlot(page)
  await expect(page.getByRole("status").filter({ hasText: "Study status" })).toContainText(
    "studying",
  )
  await expect
    .poll(async () => (await progress(page))?.materials[materialId]?.status)
    .toBe("studying")
  await page.reload()
  expect(await activeSlot(page)).toBe(slotId)
  await expect(page.getByRole("button", { name: "Mark studying", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  await page.getByRole("button", { name: "Mark studied", exact: true }).click()
  await expect
    .poll(async () => (await progress(page))?.materials[materialId]?.status)
    .toBe("studied")
  await page.goto("/jlpt/n5/practice")
  await page.getByRole("button", { name: "Start practice" }).click()
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeDisabled()
  await expect.poll(async () => Boolean((await progress(page))?.active)).toBe(true)
  const started = (await progress(page))!.active!
  expect(started.questions.length).toBeGreaterThan(1)
  for (let index = 0; index < started.questions.length; index++) {
    const before = (await progress(page))!.active!
    expect(before.index).toBe(index)
    const question = before.questions[index]
    const choice = question.options.find((o) =>
      index === 0 ? o.id !== question.answerId : o.id === question.answerId,
    )!
    await page.getByRole("radio", { name: choice.label, exact: true }).check()
    await page.getByRole("button", { name: "Submit answer" }).click()
    await expect
      .poll(async () => (await progress(page))?.active?.answers[index]?.correct)
      .toBe(index !== 0)
    const answered = (await progress(page))!
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: index === 0 ? "Incorrect" : "Correct" })
        .first(),
    ).toBeVisible()
    if (index === 0) {
      await page.reload()
      await expect(page.getByRole("button", { name: "Next question" })).toBeVisible()
      expect((await progress(page))!.active).toEqual(answered.active)
      expect((await progress(page))!.review).toEqual(answered.review)
      await page.goto("/jlpt/n5")
      await page.getByRole("link", { name: /Resume N5 practice/ }).click()
      await expect(page.getByRole("button", { name: "Next question" })).toBeVisible()
    }
    await page
      .getByRole("button", {
        name: index + 1 === started.questions.length ? "Finish and view results" : "Next question",
      })
      .click()
  }
  await expect(page.getByRole("heading", { name: "Your practice notes." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Completed practice", exact: true })).toBeVisible()
  const completed = (await progress(page))!
  expect(completed.active).toBeNull()
  expect(completed.history).toHaveLength(1)
  expect(completed.history[0].questions).toEqual(started.questions)
  expect(completed.history[0].answers.filter((a) => a?.correct)).toHaveLength(
    started.questions.length - 1,
  )
  await page.reload()
  await expect(page.getByRole("heading", { name: "Completed practice", exact: true })).toBeVisible()
  expect((await progress(page))!.history).toEqual(completed.history)
  await page.goto("/jlpt/n5/review")
  await expect(
    page.getByText("No text concepts are due in this selection.", { exact: false }),
  ).toBeVisible()
  await expect(page.locator("audio, video")).toHaveCount(0)
  expect(external).toEqual([])
  expect(media).toEqual([])
  expect(errors).toEqual([])
})

test("reading practice keeps its passage and reveals evidence after submission", async ({
  page,
}) => {
  await page.goto("/jlpt/n5/dokkai")
  await page.getByRole("link", { name: "Open lesson", exact: false }).first().click()
  await expect(page.getByRole("heading", { name: "Reading passage", exact: true })).toBeVisible()
  const translationButton = page.getByRole("button", {
    name: "Show English translation",
    exact: true,
  })
  await expect(translationButton).toHaveAttribute("aria-expanded", "false")
  await translationButton.click()
  await expect(page.getByRole("button", { name: "Hide translation", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  )
  await page.getByRole("button", { name: "Furigana on", exact: true }).click()
  await expect(page.getByRole("button", { name: "Furigana off", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  )
  await page.getByRole("link", { name: "Practice this material", exact: false }).click()
  await page.getByRole("button", { name: "Start practice" }).click()
  await expect.poll(async () => Boolean((await progress(page))?.active)).toBe(true)
  const session = (await progress(page))!.active!
  const question = session.questions[0]
  expect(question.skill).toBe("dokkai")
  expect(question.context?.blocks.length).toBeGreaterThan(0)
  expect(question.evidence?.quote).toBeTruthy()
  await expect(page.getByRole("heading", { name: "Reading passage", exact: true })).toBeVisible()
  await expect(page.locator("blockquote")).toHaveCount(0)
  const correct = question.options.find((o) => o.id === question.answerId)!
  await page.getByRole("radio", { name: correct.label, exact: true }).check()
  await page.getByRole("button", { name: "Submit answer" }).click()
  await expect(page.locator("blockquote")).toContainText(question.evidence!.quote)
  await page.getByText("Why the other options do not fit", { exact: true }).click()
  for (const explanation of Object.values(question.distractors))
    await expect(page.getByText(explanation, { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator("blockquote")).toContainText(question.evidence!.quote)
  expect((await progress(page))!.active!.questions).toEqual(session.questions)
})

test("JLPT slot duplicate, reset and v2 backup import remain separate", async ({
  page,
}, testInfo) => {
  const materialId = await openFirstLesson(page)
  await page.getByRole("button", { name: "Mark studied", exact: true }).click()
  await expect
    .poll(async () => (await progress(page))?.materials[materialId]?.status)
    .toBe("studied")
  const originalId = await activeSlot(page)
  const original = (await progress(page))!
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Duplicate", exact: true }).click()
  await expect(page.getByLabel("Active save").locator("option")).toHaveCount(2)
  const duplicateId = await activeSlot(page)
  expect(duplicateId).not.toBe(originalId)
  expect((await progress(page))!.materials).toEqual(original.materials)
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export save", exact: true }).click()
  const exportPath = testInfo.outputPath("jlpt-v2-backup.json")
  await (await downloadPromise).saveAs(exportPath)
  const backup = JSON.parse(await fs.readFile(exportPath, "utf8"))
  expect(backup.version).toBe(2)
  expect(backup.jlpt.materials).toEqual(original.materials)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Reset progress", exact: true }).click()
  await expect.poll(async () => (await progress(page))?.materials ?? {}).toEqual({})
  expect((await progress(page, originalId))!.materials).toEqual(original.materials)
  await page.getByLabel("Import save file").setInputFiles(exportPath)
  await expect(page.getByRole("heading", { name: "Import as a new slot?" })).toBeVisible()
  await page.getByRole("button", { name: "Confirm import", exact: true }).click()
  await expect(page.getByLabel("Active save").locator("option")).toHaveCount(3)
  expect((await progress(page))!.materials).toEqual(original.materials)
  expect((await progress(page, duplicateId))?.materials ?? {}).toEqual({})
  await page.getByRole("button", { name: "New slot", exact: true }).click()
  await expect(page.getByLabel("Active save").locator("option")).toHaveCount(4)
  await page.goto("/jlpt/n5")
  await expect(page.getByRole("region", { name: "Your JLPT progress" })).toContainText("0/")
  expect((await progress(page))?.materials ?? {}).toEqual({})
  expect((await progress(page, originalId))!.materials).toEqual(original.materials)
})

test("mobile JLPT text routes are accessible in light and dark; audio and invalid routes stay unavailable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of [
    "/jlpt",
    "/jlpt/n5",
    "/jlpt/n1/bunpou",
    "/jlpt/n5/dokkai",
    "/jlpt/n5/practice",
    "/jlpt/n5/review",
  ]) {
    await page.goto(route)
    await expect(page.locator("h1")).toBeVisible()
    await audit(page)
    await page.getByRole("button", { name: "Toggle color theme" }).click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await audit(page)
    await page.getByRole("button", { name: "Toggle color theme" }).click()
  }
  for (const level of ["n5", "n4", "n3", "n2", "n1"]) {
    await page.goto(`/jlpt/${level}/choukai`)
    await expect(
      page.getByRole("heading", { name: "Listening is held.", exact: true }),
    ).toBeVisible()
    await expect(page.locator("audio, video")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: /play|start listening|submit answer/i }),
    ).toHaveCount(0)
  }
  for (const route of [
    "/jlpt/n0",
    "/jlpt/n5/not-a-skill",
    "/jlpt/n5/moji-goi/not-a-material",
    "/jlpt/n5/choukai/not-a-material",
    "/jlpt/n5/practice?skill=choukai",
    "/jlpt/n5/units/not-a-unit",
  ]) {
    const response = await page.goto(route)
    // Next keeps status 200 when notFound() is reached after streaming starts.
    expect([200, 404], route).toContain(response?.status())
    await expect(
      page.getByRole("heading", { name: "Let’s find another path.", exact: true }),
    ).toBeVisible()
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toHaveAttribute(
      "content",
      /noindex/,
    )
  }
})
