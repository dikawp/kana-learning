"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Moon,
  Sun,
  Menu,
  Flower2,
  ArrowUpRight,
  Search,
  Library,
  ChartNoAxesCombined,
  House,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { StudySet } from "@/lib/platform/types"

function Navigation({ sets, mobile = false }: { sets: StudySet[]; mobile?: boolean }) {
  const pathname = usePathname()
  const link = (href: string, label: string, icon?: React.ReactNode) => {
    const node = (
      <Link
        className={`rail-link ${pathname === href ? "is-current" : ""}`}
        href={href}
        aria-current={pathname === href ? "page" : undefined}
      >
        {icon}
        {label}
      </Link>
    )
    return mobile ? (
      <SheetClose asChild key={href}>
        {node}
      </SheetClose>
    ) : (
      <span key={href}>{node}</span>
    )
  }
  return (
    <nav aria-label="Learning catalog" className="rail-nav">
      {link("/", "Your starting point", <House size={17} />)}
      {link("/archive", "The collection", <Library size={17} />)}
      {link("/search", "Find a character", <Search size={17} />)}
      {link("/dashboard", "Your progress", <ChartNoAxesCombined size={17} />)}
      <p className="rail-label">01 — The syllabaries</p>
      {sets
        .filter((s) => s.kind !== "kanji")
        .map((s) => link(`/set/${s.slug}`, s.title, <span lang="ja">{s.symbol}</span>))}
      <p className="rail-label">02 — Kanji notebooks</p>
      {sets
        .filter((s) => s.kind === "kanji" && !s.slug.startsWith("jlpt-"))
        .map((s) => link(`/set/${s.slug}`, s.title, <span lang="ja">{s.symbol}</span>))}
      <div className="rail-note">
        <Flower2 size={23} />
        <p>
          A little practice,
          <br />a little closer.
        </p>
        <small>2,967 characters to discover.</small>
      </div>
    </nav>
  )
}
export function PlatformShell({ sets, children }: { sets: StudySet[]; children: React.ReactNode }) {
  const pathname = usePathname(),
    { resolvedTheme, setTheme } = useTheme()
  const practice = pathname.endsWith("/practice")
  return (
    <div className={practice ? "sakura-app focus-room" : "sakura-app"}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="platform-header">
        <Link href="/" className="brand">
          <span className="brand-seal" aria-hidden="true">
            <Flower2 size={25} />
          </span>
          <span>
            Kana-Learn<small>A JAPANESE STUDY NOTEBOOK</small>
          </span>
        </Link>
        <div className="header-actions">
          <Link href="/search" aria-label="Search the collection" className="icon-link">
            <Search size={20} />
          </Link>
          <Link href="/dashboard" className="header-progress">
            Your progress <ArrowUpRight size={16} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
          {!practice && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open catalog menu"
                  className="mobile-menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Your study notebook</SheetTitle>
                </SheetHeader>
                <Navigation sets={sets} mobile />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>
      <div className="platform-layout">
        {!practice && (
          <aside className="platform-rail">
            <Navigation sets={sets} />
          </aside>
        )}
        <main id="main-content" tabIndex={-1} className="platform-main">
          {children}
        </main>
      </div>
      <footer className="platform-footer">
        <span>
          Kana-Learn <span aria-hidden="true">✿</span> Made for the everyday learner.
        </span>
        <nav aria-label="Information">
          <Link href="/sources">Sources & methodology</Link>
          <Link href="/privacy">Privacy & local saves</Link>
        </nav>
      </footer>
    </div>
  )
}
