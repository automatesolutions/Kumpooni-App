import React from 'react'
import {Link} from 'react-router-dom'
import {OfficeMap} from '@/components/OfficeMap'
import {ErrorState, PageHead} from '@/components/ui'
import {useOfficesQuery} from '@/state/queries/repair'
import {useSession} from '@/state/session'

export function OfficesPage() {
  const {data: offices, isLoading, error, refetch} = useOfficesQuery()
  const [officeId, setOfficeId] = React.useState<number | null>(null)
  const {session} = useSession()

  return (
    <div className="container page" style={{maxWidth: 960}}>
      <PageHead
        title="DTI offices"
        description="Where to file your complaint: the Department of Trade and Industry (DTI) office nearest you, on a satellite map. DTI handles complaints about repair shops, service centers, and dealers. Filing is free."
      />
      {isLoading ? (
        <div className="skel" style={{height: 420, borderRadius: 'var(--radius-lg)'}} aria-hidden />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <OfficeMap offices={offices ?? []} selectedId={officeId} onSelect={setOfficeId} />
      )}

      <section className="stack" aria-label="Before you go" style={{gap: 'var(--space-3)', marginTop: 'var(--space-8)', maxWidth: '68ch'}}>
        <h2 className="section-title">Before you go</h2>
        <ol className="steps-plain">
          <li>Talk to the shop first, in writing if you can. Keep their reply.</li>
          <li>Bring a valid ID, the job order, receipts, and photos. A timeline from your repair file helps.</li>
          <li>DTI will call you and the shop to a mediation meeting. Most cases end there.</li>
        </ol>
        <p className="small" style={{color: 'var(--ink-2)'}}>
          {session ? (
            <>
              Open a <Link to="/files" className="link">repair file</Link> to draft your letter from what you saved.
            </>
          ) : (
            <>
              <Link to="/files/new" className="link">Start a repair file</Link> to draft your letter from it.
            </>
          )}
        </p>
        <p className="xsmall muted">
          Addresses come from each office's page on dti.gov.ph, checked October 2026. Call before you go. Hours and
          addresses can change.
        </p>
      </section>
    </div>
  )
}
