import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AuthForm } from "@/components/account/auth-form"
import { AccountPage } from "@/components/account/account-page"
import { AccountDashboard } from "@/components/account/dashboard"
import { AccountQuizPanel } from "@/components/account/account-quiz"
import PasswordPage from "@/app/account/password/page"
import KanaLearningApp from "@/app/page"
import { kanaData } from "@/lib/kana-data"
import type { AccountQuiz } from "@/lib/account/contracts"

afterEach(() => vi.unstubAllGlobals())
const fail = () => Response.json({ error: { message: "Connection interrupted. Retry this request." } }, { status: 503 })

describe("independent managed account UI", () => {
  it("keeps guest practice independent and renders an honest unconfigured account state", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ configured: false, user: null }))
    vi.stubGlobal("fetch", fetcher)
    const guest = render(<KanaLearningApp />)
    expect(fetcher).not.toHaveBeenCalled()
    guest.unmount()
    localStorage.setItem("kana-learning:guest:v1", JSON.stringify({ version: 1, learnedIds: ["h-a"] }))
    const read = vi.spyOn(Storage.prototype, "getItem")
    render(<AccountPage />)
    expect(await screen.findByText(/Account services are not configured/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument()
    expect(read).not.toHaveBeenCalledWith("kana-learning:guest:v1")
    read.mockRestore()
  })

  it("posts managed sign-in/signup/recovery credentials without storing passwords", async () => {
    const user = userEvent.setup()
    const signedIn = vi.fn()
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ message: "Check your email." }))
    vi.stubGlobal("fetch", fetcher)
    render(<AuthForm onSignedIn={signedIn} />)
    await user.type(screen.getByLabelText("Email"), "learner@example.test")
    await user.type(screen.getByLabelText("Password"), "synthetic-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    await waitFor(() => expect(signedIn).toHaveBeenCalledOnce())
    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/sign-in")
    expect(screen.getByLabelText("Password")).toHaveValue("")
    await user.click(screen.getByRole("button", { name: "Create an account" }))
    await user.type(screen.getByLabelText("Password"), "synthetic-password")
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Check your email")
    await user.click(screen.getByRole("button", { name: "Forgot password?" }))
    await user.click(screen.getByRole("button", { name: "Send recovery link" }))
    expect(fetcher.mock.calls.at(-1)?.[0]).toBe("/api/v1/auth/recover")
    expect(JSON.stringify(Object.values(localStorage))).not.toContain("synthetic-password")
  })

  it("changes password only through the protected API and reports rejected sessions", async () => {
    const user = userEvent.setup()
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ error: { message: "Sign in to use account practice." } }, { status: 401 }))
    vi.stubGlobal("fetch", fetcher)
    render(<PasswordPage />)
    await user.type(screen.getByLabelText("New password"), "synthetic-password")
    await user.click(screen.getByRole("button", { name: "Update password" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Sign in to use account practice")
    fetcher.mockImplementation(async () => Response.json({ ok: true }))
    await user.click(screen.getByRole("button", { name: "Update password" }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Password updated"))
    expect(screen.getByLabelText("New password")).toHaveValue("")
  })

  it("uses the same request ID after a failed familiarity save and never credits a failed mutation", async () => {
    const user = userEvent.setup()
    const mutationIds: string[] = []
    let saved = false
    vi.stubGlobal("fetch", vi.fn(async (path: string, init?: RequestInit) => {
      if (path.endsWith("/content/kana")) return Response.json({ items: kanaData.slice(0, 2) })
      if (path.endsWith("/me/progress") && init?.method === "PUT") {
        mutationIds.push(JSON.parse(String(init.body)).requestId)
        if (mutationIds.length === 1) return fail()
        saved = true
        return Response.json({ kanaId: "h-a", familiar: true })
      }
      if (path.endsWith("/me/progress")) return Response.json({ learnedIds: saved ? ["h-a"] : [] })
      throw Error(`Unexpected test request ${path}`)
    }))
    render(<AccountDashboard user={{ id: "test-owner", email: "learner@example.test" }} onSignedOut={vi.fn()} />)
    expect(await screen.findByText(/Account familiarity: 0\/2/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show Answer" }))
    await user.click(screen.getByRole("button", { name: "Got it!" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection interrupted")
    expect(screen.getByText(/Account familiarity: 0\/2/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Retry account request" }))
    expect(await screen.findByText(/Account familiarity: 1\/2/)).toBeInTheDocument()
    expect(mutationIds).toHaveLength(2)
    expect(mutationIds[0]).toBe(mutationIds[1])
  })

  it("clears account UI on sign-out and does not reuse the previous user's progress on sign-in", async () => {
    const user = userEvent.setup()
    let principal: { id: string; email: string } | null = { id: "first", email: "first@example.test" }
    vi.stubGlobal("fetch", vi.fn(async (path: string) => {
      if (path.endsWith("/auth/session")) return Response.json({ configured: true, user: principal })
      if (path.endsWith("/auth/sign-out")) { principal = null; return Response.json({ ok: true }) }
      if (path.endsWith("/auth/sign-in")) { principal = { id: "second", email: "second@example.test" }; return Response.json({ ok: true }) }
      if (path.endsWith("/content/kana")) return Response.json({ items: kanaData.slice(0, 2) })
      if (path.endsWith("/me/progress")) return Response.json({ learnedIds: principal?.id === "first" ? ["h-a"] : [] })
      throw Error(`Unexpected test request ${path}`)
    }))
    render(<AccountPage />)
    expect(await screen.findByText(/Account familiarity: 1\/2/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Sign out" }))
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.queryByText(/Signed in as first/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText("Email"), "second@example.test")
    await user.type(screen.getByLabelText("Password"), "synthetic-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(await screen.findByText(/Signed in as second/)).toBeInTheDocument()
    expect(await screen.findByText(/Account familiarity: 0\/2/)).toBeInTheDocument()
  })

  it("retries a server-issued quiz idempotently, displays server feedback and reloads persisted results", async () => {
    const user = userEvent.setup()
    const ids: string[] = []
    let quiz: AccountQuiz = { id: "test-session", config: { type: "all", questionCount: 5 }, status: "active", total: 1, score: null, createdAt: "2026-10-18T00:00:00Z", completedAt: null,
      questions: [{ id: "test-question", kanaId: "h-i", character: "い", type: "hiragana", options: ["a", "i"], feedback: null }] }
    vi.stubGlobal("fetch", vi.fn(async (path: string, init?: RequestInit) => {
      if (path === "/api/v1/quiz-sessions" && init?.method === "POST") {
        ids.push(JSON.parse(String(init.body)).requestId)
        return ids.length === 1 ? fail() : Response.json(quiz)
      }
      if (path.endsWith("/answers")) {
        quiz = { ...quiz, questions: [{ ...quiz.questions[0], feedback: { answer: "a", isCorrect: false, correctAnswer: "i" } }] }
        return Response.json(quiz.questions[0].feedback)
      }
      if (path.endsWith("/complete")) { quiz = { ...quiz, status: "completed", score: 0, completedAt: "2026-10-18T00:01:00Z" }; return Response.json(quiz) }
      if (path.includes("?limit=10")) return Response.json({ items: [quiz], nextCursor: null })
      if (path.endsWith("/test-session")) return Response.json(quiz)
      throw Error(`Unexpected test request ${path}`)
    }))
    const changed = vi.fn()
    const view = render(<AccountQuizPanel onProgressChanged={changed} />)
    await user.click(screen.getByRole("button", { name: "Start account quiz" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection interrupted")
    await user.click(screen.getByRole("button", { name: "Retry same request" }))
    expect(await screen.findByText("い")).toBeInTheDocument()
    expect(ids[0]).toBe(ids[1])
    await user.click(screen.getByRole("button", { name: "a" }))
    expect(await screen.findByText(/Incorrect — Your answer: a; Romaji: i/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Complete quiz" }))
    expect(await screen.findByText("Result: 0/1")).toBeInTheDocument()
    expect(changed).toHaveBeenCalledTimes(2)
    view.unmount()
    render(<AccountQuizPanel onProgressChanged={changed} />)
    await user.click(screen.getByRole("button", { name: "Load quiz history" }))
    await user.click(await screen.findByRole("button", { name: "Review result" }))
    expect(await screen.findByText("Result: 0/1")).toBeInTheDocument()
    expect(screen.getByText(/Incorrect — Your answer: a; Romaji: i/)).toBeInTheDocument()
  })
})
