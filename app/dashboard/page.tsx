import { catalog } from "@/lib/platform/repository"
import { Dashboard } from "@/components/platform/dashboard"
export const metadata = {
  title: "Your Progress · Kana-Learn",
  robots: { index: false, follow: false },
}
export default function DashboardPage() {
  return <Dashboard catalog={catalog} />
}
