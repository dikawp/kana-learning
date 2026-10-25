"use client"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>This page needs another moment.</h1>
      <p>Your local saves are kept in your browser.</p>
      <button className="primary-button" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
