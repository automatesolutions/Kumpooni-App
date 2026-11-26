import React from 'react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Lock, MapPin, ShieldCheck} from '@/components/icons'
import {
  businessError,
  canManageTeam,
  categoryLabel,
  CLAIM_METHODS,
  CODE_RESULT,
  isClaimablePlaceId,
  isDtiBnNumber,
  SHOP_CATEGORIES,
  type ClaimMethod,
  type CodeResult,
} from '@/lib/business'
import {ITEM_KINDS, type ItemKind} from '@/lib/kinds'
import {formatDate} from '@/lib/format'
import {toast} from '@/stores/ui'
import {useUserId} from '@/state/session'
import {
  useCancelClaimMutation,
  useClaimsQuery,
  useCreateShopMutation,
  usePlaceTakenQuery,
  useRequestClaimMutation,
  useVerifyCodeMutation,
  type MyShop,
} from '@/state/queries/business'
import {Alert, Button, CardSkeletons, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {SHOP_TERMS, shopLink, useCurrentShop, VerificationBadge} from './shared'

/**
 * /business/claim: add a shop (step 1), then prove it's yours (step 2, with ?shop=).
 * ?placeId= comes from "Is this your shop?" on /nearby. Only the id is carried, never Google's name.
 */
export function ClaimPage() {
  const [params] = useSearchParams()
  const {shop, isLoading, error, refetch} = useCurrentShop()
  if (!params.get('shop')) return <AddShop />
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!shop) {
    return (
      <div className="container page" style={{maxWidth: 560}}>
        <EmptyState
          title="This shop isn't on your list"
          action={
            <Link to="/business" className="btn btn--secondary">
              Show my shops
            </Link>
          }
        />
      </div>
    )
  }
  return <ProveShop shop={shop} disputedPlaceId={params.get('dispute')} />
}

// ---------- Step 1: add the shop ----------

const shopSchema = z.object({
  name: z.string().trim().min(2, 'Enter the shop name, at least 2 letters.').max(80, 'Keep the name under 80 letters.'),
  city: z.string().trim().max(80, 'Keep the town under 80 letters.'),
  categories: z.array(z.enum(ITEM_KINDS)).min(1, 'Pick at least one kind of repair.'),
  agree: z.literal(true, {errorMap: () => ({message: 'Tick the box to continue.'})}),
})
type ShopForm = z.infer<typeof shopSchema>

function AddShop() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const userId = useUserId()
  const placeParam = params.get('placeId')
  const placeId = isClaimablePlaceId(placeParam) ? placeParam : null
  const kind = ITEM_KINDS.find(k => k === params.get('kind'))
  const [usePin, setUsePin] = React.useState(true)
  const {data: taken, isLoading: checking} = usePlaceTakenQuery(placeId)
  const create = useCreateShopMutation(userId)

  const {register, handleSubmit, watch, setValue, formState} = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {name: '', city: '', categories: kind ? [kind] : [], agree: false as unknown as true},
  })
  const picked = watch('categories')
  const toggle = (k: ItemKind) =>
    setValue('categories', picked.includes(k) ? picked.filter(c => c !== k) : [...picked, k], {
      shouldValidate: formState.isSubmitted,
    })

  // A pin someone else already holds goes to review instead of on the shop.
  const pin = placeId && usePin && !taken ? placeId : null
  const disputed = placeId && usePin && taken ? placeId : null

  const onSubmit = handleSubmit(values => {
    create.mutate(
      {name: values.name, city: values.city, categories: values.categories, placeId: pin},
      {
        onSuccess: id => {
          toast('Shop added.')
          const next = shopLink('/business/claim', id) + (disputed ? `&dispute=${encodeURIComponent(disputed)}` : '')
          navigate(next, {replace: true})
        },
      },
    )
  })

  return (
    <div className="container page" style={{maxWidth: 560}}>
      <PageHead
        back={{to: '/business', label: 'For shops'}}
        title="Add your shop"
        description="Step 1 of 2. Next, you prove the shop is yours."
      />
      <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
        {placeId && usePin && (
          <div className="note stack" style={{gap: 'var(--space-2)'}}>
            <p className="row small" style={{gap: 'var(--space-2)'}}>
              <MapPin size={18} aria-hidden />
              {checking
                ? 'Checking the map pin from Top shops nearby.'
                : taken
                  ? 'Another account already added this map pin. If the shop is yours, our team checks it.'
                  : 'The map pin from Top shops nearby goes with this shop.'}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setUsePin(false)}>
              Add it without the pin
            </Button>
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="shop-name">
            Shop name
          </label>
          <input
            id="shop-name"
            className="input"
            autoComplete="organization"
            placeholder="Name on your sign or receipts"
            aria-invalid={!!formState.errors.name}
            {...register('name')}
          />
          {formState.errors.name && <p className="error-text">{formState.errors.name.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="shop-city">
            Town or city <span className="muted">(optional)</span>
          </label>
          <input id="shop-city" className="input" placeholder="Bacolod" aria-invalid={!!formState.errors.city} {...register('city')} />
          {formState.errors.city && <p className="error-text">{formState.errors.city.message}</p>}
        </div>

        <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
          <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
            What you repair
          </legend>
          <div className="chips chips--wrap">
            {SHOP_CATEGORIES.map(k => (
              <button key={k} type="button" className="chip" aria-pressed={picked.includes(k)} onClick={() => toggle(k)}>
                {categoryLabel(k)}
              </button>
            ))}
          </div>
          {formState.errors.categories && <p className="error-text">{formState.errors.categories.message}</p>}
        </fieldset>

        <label className="row small" style={{gap: 'var(--space-3)', alignItems: 'flex-start', minHeight: 'var(--tap)'}}>
          <input type="checkbox" style={{width: 20, height: 20, marginTop: 2, flex: 'none'}} {...register('agree')} />
          <span>{SHOP_TERMS} We process this data under the Data Privacy Act of 2012.</span>
        </label>
        {formState.errors.agree && <p className="error-text">{formState.errors.agree.message}</p>}

        {create.error && <Alert>{businessError(create.error, "We couldn't add the shop. Try again.")}</Alert>}
        <Button type="submit" size="lg" block loading={create.isPending} disabled={!!placeId && usePin && checking}>
          Add shop
        </Button>
      </form>
    </div>
  )
}

// ---------- Step 2: prove it's yours ----------

function ProveShop({shop, disputedPlaceId}: {shop: MyShop; disputedPlaceId: string | null}) {
  const userId = useUserId()
  const {data: claims, isLoading, error, refetch} = useClaimsQuery(shop.id, canManageTeam(shop.role))
  const open = claims?.find(c => c.status === 'pending')
  const last = claims?.[0]
  // The sample code is returned once, when the claim starts.
  const [sampleCode, setSampleCode] = React.useState<string | null>(null)
  const cancel = useCancelClaimMutation(shop.id, userId)

  const head = (
    <PageHead
      back={{to: shopLink('/business', shop.id), label: shop.name}}
      title="Prove it's your shop"
      description="Verified shops get a badge, and customers can send them their repairs."
    />
  )

  if (!canManageTeam(shop.role)) {
    return (
      <div className="container page" style={{maxWidth: 560}}>
        {head}
        <EmptyState icon={<Lock size={28} />} title="Only owners and admins can claim a shop">
          Ask the owner of {shop.name} to do this.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container page" style={{maxWidth: 560}}>
      {head}
      <div className="row" style={{marginBottom: 'var(--space-5)'}}>
        <VerificationBadge status={shop.verification_status} />
      </div>

      {shop.verification_status === 'verified' ? (
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="Your shop is verified"
          action={
            <Link to={shopLink('/business', shop.id)} className="btn btn--primary">
              Go to your shop
            </Link>
          }>
          {shop.verified_method === 'sample_code'
            ? 'This was a test with a sample code. It won’t count once codes are sent for real.'
            : 'Customers see the badge on your shop.'}
        </EmptyState>
      ) : isLoading ? (
        <CardSkeletons count={1} height={220} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : open && open.method.endsWith('_code') ? (
        <CodeStep shop={shop} claimId={open.id} sampleCode={sampleCode} onRestart={() => cancel.mutate(open.id)} />
      ) : open ? (
        <section className="card card--pad stack">
          <h2 style={{fontSize: 'var(--text-lg)'}}>We're checking your claim</h2>
          <p className="small">
            {CLAIM_METHODS[open.method].label}, sent {formatDate(open.created_at, 'D MMM YYYY')}. A person on our team
            reviews it, and this page shows the result.
          </p>
          {cancel.error && <Alert>{businessError(cancel.error)}</Alert>}
          <Button variant="secondary" loading={cancel.isPending} onClick={() => cancel.mutate(open.id)}>
            Cancel this claim
          </Button>
        </section>
      ) : (
        <>
          {last?.status === 'rejected' && (
            <Alert>
              Your last claim wasn't approved.{last.review_note ? ` ${last.review_note}` : ''} You can try another way.
            </Alert>
          )}
          <StartClaim shop={shop} disputedPlaceId={disputedPlaceId} onSampleCode={setSampleCode} />
        </>
      )}
    </div>
  )
}

function StartClaim({
  shop,
  disputedPlaceId,
  onSampleCode,
}: {
  shop: MyShop
  disputedPlaceId: string | null
  onSampleCode: (code: string | null) => void
}) {
  const userId = useUserId()
  const request = useRequestClaimMutation(shop.id, userId)
  const methods = (Object.keys(CLAIM_METHODS) as ClaimMethod[]).filter(m =>
    disputedPlaceId ? !CLAIM_METHODS[m].needsPlace : true,
  )
  const [method, setMethod] = React.useState<ClaimMethod>(methods[0])
  const [bn, setBn] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [note, setNote] = React.useState('')
  const [problem, setProblem] = React.useState('')
  const info = CLAIM_METHODS[method]
  const noPlace = info.needsPlace && !shop.place_id

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProblem('')
    if (method === 'dti_bn' && !isDtiBnNumber(bn)) return setProblem('Enter the number on your DTI certificate, digits only.')
    if (method === 'dti_bn' && !file) return setProblem('Add a photo or PDF of your DTI certificate.')
    if (method === 'manual' && note.trim().length < 10) return setProblem('Tell us how we can confirm the shop is yours.')
    if (file && file.size > 10 * 1024 * 1024) return setProblem('The file is over 10 MB. Try a smaller photo.')
    request.mutate(
      {method, bn, document: method === 'dti_bn' ? file : null, note, disputedPlaceId},
      {onSuccess: r => onSampleCode(r.sample_code)},
    )
  }

  return (
    <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
      {disputedPlaceId && (
        <p className="note small">
          Another account added this shop's map pin first. Send your DTI number or ask for a review, and our team
          decides who it belongs to.
        </p>
      )}
      <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
        <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
          How do you want to prove it?
        </legend>
        <div className="chips chips--wrap" role="radiogroup">
          {methods.map(m => (
            <button key={m} type="button" role="radio" className="chip" aria-checked={method === m} onClick={() => setMethod(m)}>
              {CLAIM_METHODS[m].label}
            </button>
          ))}
        </div>
        <p className="help">{info.hint}</p>
      </fieldset>

      {noPlace && (
        <p className="note small">
          Codes need your shop's map pin. Find your shop on{' '}
          <Link to="/nearby" className="link">
            Top shops nearby
          </Link>{' '}
          and tap "Is this your shop?", or pick another way.
        </p>
      )}

      {method === 'dti_bn' && (
        <>
          <div className="field">
            <label className="label" htmlFor="claim-bn">
              DTI business name number
            </label>
            <input
              id="claim-bn"
              className="input"
              inputMode="numeric"
              placeholder="3456789"
              value={bn}
              onChange={e => setBn(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="claim-doc">
              Photo or PDF of the certificate
            </label>
            <input
              id="claim-doc"
              className="input"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="help">Only your shop's owners and admins, and our review team, can open it.</p>
          </div>
        </>
      )}

      {(method === 'manual' || method === 'dti_bn') && (
        <div className="field">
          <label className="label" htmlFor="claim-note">
            {method === 'manual' ? 'How can we confirm the shop is yours?' : 'Anything we should know?'}{' '}
            {method === 'dti_bn' && <span className="muted">(optional)</span>}
          </label>
          <textarea
            id="claim-note"
            className="textarea"
            rows={4}
            maxLength={1000}
            placeholder="Your Facebook page, your business permit number, or a landline we can call"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      )}

      {problem && <Alert>{problem}</Alert>}
      {request.error && <Alert>{businessError(request.error, "We couldn't start the claim. Try again.")}</Alert>}
      <Button type="submit" size="lg" block loading={request.isPending} disabled={noPlace}>
        {info.needsPlace ? 'Send code' : 'Send for review'}
      </Button>
    </form>
  )
}

function CodeStep({
  shop,
  claimId,
  sampleCode,
  onRestart,
}: {
  shop: MyShop
  claimId: string
  sampleCode: string | null
  onRestart: () => void
}) {
  const userId = useUserId()
  const verify = useVerifyCodeMutation(shop.id, userId)
  const [code, setCode] = React.useState('')
  const [result, setResult] = React.useState<CodeResult | null>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verify.mutate(
      {claimId, code: code.trim()},
      {
        onSuccess: r => {
          setResult(r as CodeResult)
          if (r === 'approved') toast('Your shop is verified.')
        },
      },
    )
  }

  return (
    <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
      <h2 style={{fontSize: 'var(--text-lg)'}}>Enter your code</h2>
      {sampleCode ? (
        <p className="note small">
          <strong>Sample code: {sampleCode}</strong>. We don't send real codes yet, so this test shows it here.
        </p>
      ) : (
        <p className="small">The code works for 15 minutes. You have five tries.</p>
      )}
      <div className="field">
        <label className="label" htmlFor="claim-code">
          6-digit code
        </label>
        <input
          id="claim-code"
          className="input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      {result && result !== 'approved' && <Alert>{CODE_RESULT[result]}</Alert>}
      {verify.error && <Alert>{businessError(verify.error)}</Alert>}
      <Button type="submit" size="lg" block loading={verify.isPending} disabled={code.length !== 6}>
        Check code
      </Button>
      <Button type="button" variant="ghost" onClick={onRestart}>
        Start again
      </Button>
    </form>
  )
}
