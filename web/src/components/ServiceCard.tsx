import React from 'react'
import {useNavigate} from 'react-router-dom'
import {Check, Plus, Wrench} from '@/components/icons'
import type {Service} from '@/types/app'
import {formatPrice} from '@/lib/format'
import {DELIVERY_STORE} from '@/lib/env'
import {useCartStore} from '@/stores/cart'
import {useShopCartStore} from '@/stores/shop-cart'
import {toast} from '@/stores/ui'
import {Button, Dialog, Stepper} from './ui'

export function ServiceCard({
  service,
  inCart,
  onToggle,
  showPrice,
  style,
}: {
  service: Service
  inCart: boolean
  onToggle: () => void
  showPrice?: boolean
  style?: React.CSSProperties
}) {
  const inclusion = service.inclusion ?? []
  const shown = inclusion.slice(0, 3)
  const isBuy = service.service_type === 'OrderDelivery'

  return (
    <article className="card svc" style={style}>
      {service.img_url ? (
        <img className="svc__img" src={service.img_url} alt="" loading="lazy" />
      ) : (
        <div className="svc__img" style={{display: 'grid', placeItems: 'center'}} aria-hidden>
          <Wrench size={28} className="muted" />
        </div>
      )}
      <div className="svc__body">
        <h3 className="svc__title">{service.name}</h3>
        {service.short_description && (
          <p className="small muted">{service.short_description}</p>
        )}
        {shown.length > 0 && (
          <ul className="svc__incl">
            {shown.map(item => (
              <li key={item}>{item}</li>
            ))}
            {inclusion.length > shown.length && (
              <li className="muted">+{inclusion.length - shown.length} more</li>
            )}
          </ul>
        )}
        <div className="svc__foot">
          {showPrice ? <span className="price">{formatPrice(service.price)}</span> : <span />}
          <Button
            size="sm"
            variant={inCart ? 'secondary' : 'primary'}
            className={inCart ? 'btn--added' : ''}
            aria-pressed={isBuy ? undefined : inCart}
            onClick={onToggle}>
            {isBuy ? (
              'Buy'
            ) : inCart ? (
              <>
                <Check size={16} aria-hidden /> Added
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden /> Add
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}

export function QuantityDialog({
  service,
  onClose,
  onConfirm,
  confirmLabel,
  initialQuantity,
}: {
  service: Service | null
  onClose: () => void
  onConfirm: (quantity: number) => void
  confirmLabel: string
  initialQuantity?: number
}) {
  const min = Math.max(1, service?.minimum_qty ?? 1)
  const [qty, setQty] = React.useState(min)

  React.useEffect(() => {
    if (service) setQty(Math.max(min, initialQuantity ?? min))
  }, [service, min, initialQuantity])

  return (
    <Dialog open={!!service} onClose={onClose} title="How many do you need?">
      {service && (
        <>
          <div className="row">
            {service.img_url && (
              <img
                src={service.img_url}
                alt=""
                width={64}
                height={64}
                style={{borderRadius: 'var(--radius-sm)', objectFit: 'cover'}}
              />
            )}
            <div>
              <p className="strong">{service.name}</p>
              <p className="price">
                {formatPrice(service.price)}
                {service.unit_measure && <span className="muted small"> / {service.unit_measure}</span>}
              </p>
            </div>
          </div>
          <div className="row row--between">
            <span className="label">Quantity</span>
            <Stepper value={qty} min={min} onChange={setQty} label="Quantity" />
          </div>
          {min > 1 && <p className="help">Minimum order is {min}.</p>}
          <div className="total">
            <span>Total</span>
            <span className="price price--lg">{formatPrice(service.price * qty)}</span>
          </div>
          <Button block size="lg" onClick={() => onConfirm(qty)}>
            {confirmLabel}
          </Button>
        </>
      )}
    </Dialog>
  )
}

/**
 * Add/remove behaviour for catalogue services, matching the mobile app:
 * - "OrderDelivery" services go straight to checkout with the delivery store.
 * - "Product" services ask for a quantity first.
 * - Everything else toggles in the cart.
 */
export function useCatalogCart() {
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const removeItem = useCartStore(s => s.removeItem)
  const setShopItems = useShopCartStore(s => s.setItems)
  const [picking, setPicking] = React.useState<Service | null>(null)

  const isInCart = (id: number) => items.some(i => i.id === id)

  const toggle = (service: Service) => {
    if (service.service_type !== 'OrderDelivery' && isInCart(service.id)) {
      removeItem(service.id)
      toast(`Removed ${service.name}.`, 'info')
      return
    }
    if (service.service_type === 'OrderDelivery' || service.type === 'Product') {
      setPicking(service)
      return
    }
    addItem({...service, quantity: 1})
    toast(`Added ${service.name} to your cart.`)
  }

  const dialog = (
    <QuantityDialog
      service={picking}
      onClose={() => setPicking(null)}
      confirmLabel={picking?.service_type === 'OrderDelivery' ? 'Continue to checkout' : 'Add to cart'}
      onConfirm={quantity => {
        if (!picking) return
        if (picking.service_type === 'OrderDelivery') {
          setShopItems(DELIVERY_STORE.id, [{...picking, quantity}])
          setPicking(null)
          navigate(`/checkout/${DELIVERY_STORE.id}`)
          return
        }
        addItem({...picking, quantity})
        toast(`Added ${picking.name} to your cart.`)
        setPicking(null)
      }}
    />
  )

  return {isInCart, toggle, dialog, count: items.length}
}
