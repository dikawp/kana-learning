import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "@fontsource-variable/noto-serif-jp"
import { ThemeProvider } from "next-themes"
import { PlatformShell } from "@/components/platform/shell"
import { catalog } from "@/lib/platform/repository"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kana-Learn — A Japanese Study Notebook",
  description:
    "Find your rhythm in Japanese: 208 kana, 2,759 kanji, and 162 original study decks. Flashcards, quizzes and local progress without an account.",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PlatformShell sets={catalog.sets}>{children}</PlatformShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
