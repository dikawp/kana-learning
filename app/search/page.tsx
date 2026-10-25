import { catalog } from "@/lib/platform/repository"
import { CatalogSearch } from "@/components/platform/search"
export const metadata = { title: "Search · Kana-Learn" }
export default function SearchPage() {
  return <CatalogSearch catalog={catalog} />
}
