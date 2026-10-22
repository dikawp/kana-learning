"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <header className="border-b bg-card sticky top-0 z-50 shadow-sm md:px-32">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kana Learning</h1>
            <p className="text-sm text-muted-foreground">Hiragana &amp; Katakana</p>
          </div>
          <div className="flex items-center gap-3">
          <Button aria-label="Toggle color theme" variant="outline" size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            <Sun aria-hidden="true" className="hidden dark:block h-4 w-4" />
            <Moon aria-hidden="true" className="block dark:hidden h-4 w-4" />
          </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
