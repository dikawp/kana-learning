import { AccountPage } from "@/components/account/account-page"

export default async function Page({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const query = await searchParams
  return <AccountPage linkError={query.authError === "link"} />
}
