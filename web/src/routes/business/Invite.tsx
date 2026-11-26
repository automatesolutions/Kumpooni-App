import {Link, useNavigate, useParams} from 'react-router-dom'
import {UserPlus} from '@/components/icons'
import {businessError, ROLE_INFO} from '@/lib/business'
import {toast} from '@/stores/ui'
import {useSession, useUserId} from '@/state/session'
import {useAcceptInviteMutation, useInvitePreviewQuery} from '@/state/queries/business'
import {Alert, Button, EmptyState, ErrorState, Spinner} from '@/components/ui'
import {shopLink} from './shared'

/** /business/invite/:token. Signing in is handled by RequireAuth, which brings you back here. */
export function InvitePage() {
  const {token = ''} = useParams()
  const navigate = useNavigate()
  const userId = useUserId()
  const {session} = useSession()
  const {data: invite, isLoading, error, refetch} = useInvitePreviewQuery(token)
  const accept = useAcceptInviteMutation(userId)

  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const gone = !invite || invite.accepted || invite.expired
  const myEmail = session?.user.email?.toLowerCase()

  return (
    <div className="container page" style={{maxWidth: 560}}>
      {gone ? (
        <EmptyState
          icon={<UserPlus size={28} />}
          title={invite?.expired ? 'This invite expired' : "This invite link isn't valid anymore"}
          action={
            <Link to="/business" className="btn btn--secondary">
              Go to For shops
            </Link>
          }>
          Ask the shop for a new link.
        </EmptyState>
      ) : (
        <section className="card card--pad stack" style={{gap: 'var(--space-4)'}}>
          <h1 style={{fontSize: 'var(--text-xl)'}}>Join {invite.org_name}</h1>
          <p>
            You're invited as {ROLE_INFO[invite.role].label.toLowerCase()}. {ROLE_INFO[invite.role].hint}.
          </p>
          {myEmail !== invite.email && (
            <Alert>
              This invite is for {invite.email}. You're signed in as {myEmail ?? 'a phone number'}. Sign out, then sign in
              with {invite.email}.
            </Alert>
          )}
          {accept.error && <Alert>{businessError(accept.error, "We couldn't add you. Try again.")}</Alert>}
          <Button
            size="lg"
            block
            loading={accept.isPending}
            disabled={myEmail !== invite.email}
            onClick={() =>
              accept.mutate(token, {
                onSuccess: orgId => {
                  toast(`You joined ${invite.org_name}.`)
                  navigate(shopLink('/business', orgId), {replace: true})
                },
              })
            }>
            Join {invite.org_name}
          </Button>
        </section>
      )}
    </div>
  )
}
