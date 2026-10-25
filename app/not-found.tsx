import Link from "next/link"
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="eyebrow">A PAGE NOT YET WRITTEN / 404</span>
      <h1>Let’s find another path.</h1>
      <p>This character or deck is not in the collection.</p>
      <Link className="primary-button" href="/archive">
        Back to the collection
      </Link>
    </div>
  )
}
