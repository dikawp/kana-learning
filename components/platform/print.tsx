"use client"
export function PrintCard() {
  return (
    <button className="secondary-button no-print" onClick={() => window.print()}>
      Print this card
    </button>
  )
}
