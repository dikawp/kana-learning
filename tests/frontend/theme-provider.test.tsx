import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"

it("uses actual next-themes system updates and persists an explicit toggle", async () => {
  let dark = true
  let onSystemChange: (event: { matches: boolean }) => void = () => {}
  const media = {
    get matches() { return dark },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: (callback: typeof onSystemChange) => { onSystemChange = callback },
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }
  vi.stubGlobal("matchMedia", vi.fn(() => media))
  const user = userEvent.setup()
  const view = render(<ThemeProvider attribute="class" defaultTheme="system" enableSystem><Header /></ThemeProvider>)
  expect(document.documentElement).toHaveClass("dark")
  act(() => { dark = false; onSystemChange({ matches: false }) })
  expect(document.documentElement).toHaveClass("light")
  await user.click(screen.getByRole("button", { name: "Toggle color theme" }))
  expect(document.documentElement).toHaveClass("dark")
  expect(localStorage.getItem("theme")).toBe("dark")
  // Explicit dark remains dark when the OS setting changes.
  act(() => onSystemChange({ matches: false }))
  expect(document.documentElement).toHaveClass("dark")
  view.unmount()
  expect(media.removeListener).toHaveBeenCalled()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove("dark", "light")
})
