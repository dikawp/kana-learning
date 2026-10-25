import { PageHeading } from "@/components/platform/catalog"
export const metadata = { title: "Privacy & Local Saves · Kana-Learn" }
export default function Privacy() {
  return (
    <article className="prose-page">
      <PageHeading eyebrow="PRIVACY / YOUR NOTEBOOK" title="Your practice stays with you." />
      <h2>No learner accounts</h2>
      <p>
        You can use the collection, practice rooms, and dashboard without registration or login.
        Kana-Learn does not send learning answers, card ratings, save slots or quiz history to an
        application server.
      </p>
      <h2>Local browser storage</h2>
      <p>
        Your slots, per-card progress, review dates, active session and last 20 completed sessions
        are stored under <code>kana-learn:sakura:v1</code> in localStorage. Theme preferences are
        also saved in your browser. Slots are local profiles, not online accounts. Multi-tab updates
        are best effort, not transactional synchronization.
      </p>
      <p>
        Clearing site data, changing devices or browsers, or using private browsing can remove
        access to your progress. Export a JSON save from the dashboard and import it into a new slot
        when needed. Files can contain slot names and learning history; keep them private. Imports
        are processed locally, without upload.
      </p>
      <h2>Storage failures and old saves</h2>
      <p>
        If storage is blocked, full, or corrupted, practice can continue in memory. A notice
        explains when data is not persisted. Existing invalid records are not silently overwritten.
        Export an in-memory backup before closing the page. Older pre-redesign keys are not migrated
        or deleted automatically.
      </p>
      <h2>Technical requests</h2>
      <p>
        The browser requests pages, fonts, scripts and public catalog resources from this site.
        Fonts are self-hosted. No analytics, advertising, external dictionary requests or tracking
        scripts are included by this application. Hosting/CDN services may process ordinary request
        metadata such as IP addresses and timestamps to serve the site.
      </p>
      <h2>Backup limits</h2>
      <p>
        There is no cloud backup, automatic cross-device sync, or full offline delivery. Import
        files are versioned and validated before preview. Reset and deletion require confirmation
        and cannot be undone without a backup.
      </p>
    </article>
  )
}
