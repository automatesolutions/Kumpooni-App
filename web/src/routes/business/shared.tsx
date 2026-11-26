import {useSearchParams} from 'react-router-dom'
import {ShieldCheck} from '@/components/icons'
import {VERIFICATION_LABEL, type VerificationStatus} from '@/lib/business'
import {useSession, useUserId} from '@/state/session'
import {useMyShopsQuery} from '@/state/queries/business'

/** "Verified" with a shield, or the claim status in words. Text, so it never relies on colour. */
export function VerificationBadge({status}: {status: VerificationStatus}) {
  if (status === 'verified') {
    return (
      <span className="status status--completed biz-badge">
        <ShieldCheck size={14} aria-hidden /> {VERIFICATION_LABEL.verified}
      </span>
    )
  }
  const tone = status === 'pending' ? 'status--inprogress' : status === 'rejected' ? 'status--canceled' : ''
  return <span className={`status ${tone}`}>{VERIFICATION_LABEL[status]}</span>
}

/** The shop picked with ?shop=, or your first shop. */
export function useCurrentShop() {
  const userId = useUserId()
  const [params] = useSearchParams()
  const query = useMyShopsQuery(userId)
  const wanted = params.get('shop')
  const shop = query.data?.find(s => s.id === wanted) ?? (wanted ? null : (query.data?.[0] ?? null))
  return {...query, shop, userId}
}

/** Kumpooni staff, marked in app_metadata. The database checks this again on every review. */
export function useIsKumpooniAdmin() {
  const {session} = useSession()
  return session?.user.app_metadata?.role === 'admin'
}

export const shopLink = (path: string, orgId: string) => `${path}?shop=${encodeURIComponent(orgId)}`

/** Shown when you add a shop. Draft for the Data Privacy Act of 2012; have a lawyer check it. */
export const SHOP_TERMS_VERSION = '2026-11-dpa-1'
export const SHOP_TERMS =
  'You’re responsible for the customer details your team adds. Use them only for the customer’s repair, and delete them when the customer asks. We won’t sell or share them.'
