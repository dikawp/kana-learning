"use client"

import { Button } from "@/components/ui/button"

export default function KanaError({ reset }: { reset: () => void }) {
  return <main className="container mx-auto p-6" role="alert">
    <h1 className="text-2xl font-bold">Unable to display this practice session</h1>
    <p>Please try again.</p>
    <Button onClick={reset}>Try again</Button>
  </main>
}
