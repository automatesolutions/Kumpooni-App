import React from 'react'
import {ShieldCheck, Store} from '@/components/icons'
import {businessError} from '@/lib/business'
import {
  defaultShareFields,
  SHARE_FIELD_INFO,
  SHARE_FIELDS,
  shareConsentText,
  shareIntroText,
  type ShareField,
} from '@/lib/crm'
import {formatDate} from '@/lib/format'
import {toast} from '@/stores/ui'
import {
  useMyFileSharesQuery,
  useShareFileMutation,
  useStopShareMutation,
  useVerifiedShopQuery,
} from '@/state/queries/crm'
import type {RepairFileRow} from '@/types/repair-proof'
import {Alert, Button, Dialog} from './ui'

/**
 * "Send to this shop" on a repair file. Shows only when the file's shop is a verified
 * Kumpooni shop, or when the file is already shared. The person picks what to share and
 * agrees first. They can stop sharing at any time.
 */
export function ShareWithShop({file}: {file: Pick<RepairFileRow, 'id' | 'shop_place_id'>}) {
  const {data: shop} = useVerifiedShopQuery(file.shop_place_id)
  const {data: shares} = useMyFileSharesQuery(file.id)
  const active = shares?.filter(s => !s.revoked_at) ?? []
  const sharedWithShop = !!shop && active.some(s => s.org_id === shop.id)
  const [open, setOpen] = React.useState(false)
  const stop = useStopShareMutation(file.id)
  const [stopping, setStopping] = React.useState<(typeof active)[number] | null>(null)

  if (!shop && !active.length) return null

  return (
    <section className="card card--pad stack" aria-labelledby="share-shop-title" style={{gap: 'var(--space-3)'}}>
      <h2 id="share-shop-title" className="card-title row">
        <Store size={20} aria-hidden /> Share with the shop
      </h2>
      {shop && !sharedWithShop && (
        <>
          <p className="small" style={{color: 'var(--ink-2)'}}>
            <ShieldCheck size={16} aria-hidden style={{verticalAlign: '-3px'}} /> {shop.name} is a verified shop on
            Kumpooni. Send them this repair so they can quote it. You choose what they see.
          </p>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Send to {shop.name}
          </Button>
        </>
      )}
      {active.length > 0 && (
        <ul className="stack" style={{listStyle: 'none', gap: 'var(--space-2)'}}>
          {active.map(s => (
            <li key={s.id} className="row row--between" style={{gap: 'var(--space-2)'}}>
              <span className="small">
                Shared with <strong>{s.org_name}</strong> on {formatDate(s.consented_at, 'D MMM YYYY')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setStopping(s)}>
                Stop sharing<span className="visually-hidden"> with {s.org_name}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {shop && <ShareDialog fileId={file.id} shop={shop} open={open} onClose={() => setOpen(false)} />}

      <Dialog open={!!stopping} onClose={() => setStopping(null)} title={`Stop sharing with ${stopping?.org_name}?`}>
        <p>They can't see this repair file anymore, starting now. Notes they made about the job stay with them.</p>
        {stop.error && <Alert>{businessError(stop.error)}</Alert>}
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setStopping(null)}>
            Keep sharing
          </Button>
          <Button
            variant="danger"
            loading={stop.isPending}
            onClick={() =>
              stopping &&
              stop.mutate(stopping.id, {
                onSuccess: () => {
                  toast(`You stopped sharing with ${stopping.org_name}.`)
                  setStopping(null)
                },
              })
            }>
            Stop sharing
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

function ShareDialog({
  fileId,
  shop,
  open,
  onClose,
}: {
  fileId: string
  shop: {id: string; name: string}
  open: boolean
  onClose: () => void
}) {
  const share = useShareFileMutation(fileId)
  const [fields, setFields] = React.useState<ShareField[]>(defaultShareFields)
  const [agree, setAgree] = React.useState(false)
  const toggle = (f: ShareField) => setFields(list => (list.includes(f) ? list.filter(x => x !== f) : [...list, f]))

  return (
    <Dialog open={open} onClose={onClose} title={`Share this repair with ${shop.name}`}>
      <form
        className="stack"
        style={{gap: 'var(--space-4)'}}
        onSubmit={e => {
          e.preventDefault()
          if (!agree) return
          share.mutate(
            {orgId: shop.id, fields},
            {
              onSuccess: () => {
                toast(`Sent to ${shop.name}.`)
                setAgree(false)
                onClose()
              },
            },
          )
        }}>
        <p className="small">{shareIntroText(shop.name)}</p>
        <fieldset className="stack" style={{border: 0, padding: 0, margin: 0, gap: 'var(--space-1)'}}>
          <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
            What {shop.name} sees
          </legend>
          {SHARE_FIELDS.map(f => {
            const info = SHARE_FIELD_INFO[f]
            return (
              <label key={f} className="row" style={{gap: 'var(--space-3)', alignItems: 'flex-start', minHeight: 'var(--tap)'}}>
                <input
                  type="checkbox"
                  style={{width: 20, height: 20, marginTop: 2, flex: 'none'}}
                  checked={info.locked || fields.includes(f)}
                  disabled={info.locked}
                  onChange={() => toggle(f)}
                />
                <span>
                  <span className="strong">{info.label}</span>
                  <span className="small muted" style={{display: 'block'}}>
                    {info.locked ? `${info.hint}. Always shared, so they can quote.` : info.hint}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>
        <label className="row small" style={{gap: 'var(--space-3)', alignItems: 'flex-start', minHeight: 'var(--tap)'}}>
          <input
            type="checkbox"
            style={{width: 20, height: 20, marginTop: 2, flex: 'none'}}
            checked={agree}
            onChange={e => setAgree(e.target.checked)}
          />
          <span>
            {shareConsentText(shop.name)}{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="link">
              Read our privacy policy
            </a>
            .
          </span>
        </label>
        {share.error && <Alert>{businessError(share.error, "We couldn't share it. Try again.")}</Alert>}
        <div className="dlg__foot">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={share.isPending} disabled={!agree}>
            Share with {shop.name}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
