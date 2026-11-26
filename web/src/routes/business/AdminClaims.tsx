import React from 'react'
import {ClipboardList, ExternalLink, Lock} from '@/components/icons'
import {businessError, categoryLabel, CLAIM_METHODS} from '@/lib/business'
import {formatDate} from '@/lib/format'
import {toast} from '@/stores/ui'
import {
  claimDocumentUrl,
  useClaimQueueQuery,
  useReviewClaimMutation,
  type QueuedClaim,
} from '@/state/queries/business'
import {Alert, Button, CardSkeletons, EmptyState, ErrorState, PageHead} from '@/components/ui'
import {useIsKumpooniAdmin} from './shared'

/** Kumpooni staff review DTI and manual claims. The database refuses anyone else. */
export function AdminClaimsPage() {
  const staff = useIsKumpooniAdmin()
  const {data: claims, isLoading, error, refetch} = useClaimQueueQuery(staff)

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <PageHead
        back={{to: '/business', label: 'For shops'}}
        title="Review shop claims"
        description="Check each DTI number on the DTI business name search, or check the shop another way."
      />
      {!staff ? (
        <EmptyState icon={<Lock size={28} />} title="Only Kumpooni staff can review claims" />
      ) : isLoading ? (
        <CardSkeletons count={2} height={180} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !claims?.length ? (
        <EmptyState icon={<ClipboardList size={28} />} title="No claims to review">
          New DTI and review claims show here.
        </EmptyState>
      ) : (
        <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-4)'}}>
          {claims.map(c => (
            <ClaimCard key={c.id} claim={c} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ClaimCard({claim}: {claim: QueuedClaim}) {
  const review = useReviewClaimMutation()
  const [note, setNote] = React.useState('')
  const [docError, setDocError] = React.useState('')
  const noteId = React.useId()

  const openDoc = async () => {
    setDocError('')
    try {
      window.open(await claimDocumentUrl(claim.document_path!), '_blank', 'noopener')
    } catch (e) {
      setDocError(businessError(e, "The file didn't open. Try again."))
    }
  }

  const decide = (approve: boolean) =>
    review.mutate(
      {claimId: claim.id, approve, note},
      {onSuccess: () => toast(approve ? 'Approved. The shop is verified.' : 'Not approved.')},
    )

  return (
    <li className="card card--pad stack" style={{gap: 'var(--space-3)'}}>
      <div>
        <h2 style={{fontSize: 'var(--text-lg)'}}>{claim.org?.name ?? 'Shop'}</h2>
        <p className="small muted">
          {[claim.org?.city, claim.org?.categories.map(categoryLabel).join(', ')].filter(Boolean).join(' · ')}
        </p>
      </div>
      <dl className="small stack" style={{gap: 'var(--space-1)'}}>
        <div>
          <dt className="strong">Way</dt>
          <dd>
            {CLAIM_METHODS[claim.method].label}, {formatDate(claim.created_at, 'D MMM YYYY')}
          </dd>
        </div>
        {claim.dti_bn_number && (
          <div>
            <dt className="strong">DTI number</dt>
            <dd>{claim.dti_bn_number}</dd>
          </div>
        )}
        {claim.disputed_place_id && (
          <div>
            <dt className="strong">Disputed map pin</dt>
            <dd>Another shop already holds this pin. Decide who owns it before approving.</dd>
          </div>
        )}
        {claim.note && (
          <div>
            <dt className="strong">Their note</dt>
            <dd style={{whiteSpace: 'pre-wrap'}}>{claim.note}</dd>
          </div>
        )}
      </dl>
      {claim.document_path && (
        <Button variant="secondary" size="sm" onClick={openDoc}>
          <ExternalLink size={16} aria-hidden /> Open the certificate
        </Button>
      )}
      {docError && <Alert>{docError}</Alert>}
      <div className="field">
        <label className="label" htmlFor={noteId}>
          Note to the shop <span className="muted">(optional)</span>
        </label>
        <textarea
          id={noteId}
          className="textarea"
          rows={2}
          maxLength={1000}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="The DTI name doesn't match the shop name."
        />
      </div>
      {review.error && <Alert>{businessError(review.error)}</Alert>}
      <div className="row" style={{gap: 'var(--space-3)', flexWrap: 'wrap'}}>
        <Button loading={review.isPending && review.variables?.approve} onClick={() => decide(true)}>
          Approve
        </Button>
        <Button variant="danger" loading={review.isPending && !review.variables?.approve} onClick={() => decide(false)}>
          Don't approve
        </Button>
      </div>
    </li>
  )
}
