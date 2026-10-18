import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"
import { Header } from "@/components/layout/header"

const theme = vi.hoisted(() => ({ theme: "system", resolvedTheme: "dark" as string | undefined, setTheme: vi.fn() }))
vi.mock("next-themes", () => ({ useTheme: () => theme }))

describe("effective theme", () => {
  it("toggles from system-dark to light and light to dark using resolvedTheme", async () => {
    const user = userEvent.setup()
    const view = render(<Header />)
    await user.click(screen.getByRole("button", { name: "Toggle color theme" }))
    expect(theme.setTheme).toHaveBeenLastCalledWith("light")
    theme.resolvedTheme = "light"
    view.rerender(<Header />)
    await user.click(screen.getByRole("button", { name: "Toggle color theme" }))
    expect(theme.setTheme).toHaveBeenLastCalledWith("dark")
    theme.resolvedTheme = "dark"
  })

  it("keeps server and resolved client markup identical during hydration", async () => {
    theme.resolvedTheme = undefined
    const container = document.createElement("div")
    container.innerHTML = renderToString(<Header />)
    const server = container.innerHTML
    theme.resolvedTheme = "dark"
    const client = document.createElement("div")
    client.innerHTML = renderToString(<Header />)
    expect(client.innerHTML).toBe(server)
    document.body.append(container)
    const errors = vi.fn()
    let root: ReturnType<typeof hydrateRoot>
    await act(async () => { root = hydrateRoot(container, <Header />, { onRecoverableError: errors }) })
    expect(errors).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
  })
})
