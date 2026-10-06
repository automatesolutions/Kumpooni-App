import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Car, ShoppingCart, Trash2, Wrench} from '@/components/icons'
import {useCartStore, isCarRequired} from '@/stores/cart'
import {useVehicleStore} from '@/stores/vehicle'
import {useSession, useUserId} from '@/state/session'
import {useVehiclesQuery} from '@/state/queries/vehicles'
import {formatPrice, plural} from '@/lib/format'
import {Button, Checkbox, Dialog, EmptyState, PageHead, Stepper} from '@/components/ui'
import {VehicleSelect} from './Vehicles'

export function CartPage() {
  const navigate = useNavigate()
  const {session} = useSession()
  const userId = useUserId()
  const {items, removeItem, removeItems, setQuantity, setServiceIds} = useCartStore()
  const {data: vehicles} = useVehiclesQuery(userId)
  const selectedVehicleId = useVehicleStore(s => s.selectedId)
  const [selected, setSelected] = React.useState<number[]>(() => items.map(i => i.id))
  const [needCar, setNeedCar] = React.useState(false)

  // Keep the selection in step when items are added or removed.
  React.useEffect(() => {
    setSelected(prev => prev.filter(id => items.some(i => i.id === id)))
  }, [items])

  const chosen = items.filter(i => selected.includes(i.id))
  const carNeeded = isCarRequired(chosen)
  const allSelected = items.length > 0 && selected.length === items.length

  const toggle = (id: number, on: boolean) =>
    setSelected(prev => (on ? [...prev, id] : prev.filter(x => x !== id)))

  const onCompare = () => {
    // Cars are saved to the account, so car-based services need sign-in first.
    if (carNeeded && !session) {
      navigate('/login?next=/cart')
      return
    }
    if (carNeeded && !vehicles?.length) {
      setNeedCar(true)
      return
    }
    setServiceIds(chosen.map(i => i.id))
    navigate('/quotes')
  }

  if (!items.length) {
    return (
      <div className="container page">
        <PageHead title="Your cart" />
        <EmptyState
          icon={<ShoppingCart size={28} />}
          title="Your cart is empty"
          action={
            <Link to="/" className="btn btn--primary">
              Browse services
            </Link>
          }>
          Add the services your car needs. Then compare what nearby shops charge.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container page">
      <PageHead
        title="Your cart"
        description="Choose the services to get prices for. Shops set their own prices, so you'll compare them next."
      />
      <div className="split">
        <section aria-label="Services in your cart" className="stack">
          <div className="row row--between">
            <label className="row" style={{gap: 0, cursor: 'pointer'}}>
              <Checkbox
                checked={allSelected}
                onChange={on => setSelected(on ? items.map(i => i.id) : [])}
                label="Select all services"
              />
              <span className="small strong">Select all</span>
            </label>
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  removeItems(selected)
                  setSelected([])
                }}>
                <Trash2 size={16} aria-hidden /> Remove selected
              </Button>
            )}
          </div>

          <ul className="list" style={{listStyle: 'none'}}>
            {items.map(item => (
              <li key={item.id} className="card" style={{display: 'flex', alignItems: 'center', padding: 'var(--space-3)'}}>
                <Checkbox
                  checked={selected.includes(item.id)}
                  onChange={on => toggle(item.id, on)}
                  label={`Select ${item.name}`}
                />
                {item.img_url ? (
                  <img className="svc__img" src={item.img_url} alt="" style={{width: 64, height: 64}} />
                ) : (
                  <div className="svc__img" style={{width: 64, height: 64, display: 'grid', placeItems: 'center'}}>
                    <Wrench size={22} className="muted" aria-hidden />
                  </div>
                )}
                <div style={{flex: 1, minWidth: 0, padding: '0 var(--space-4)'}}>
                  <p className="strong">{item.name}</p>
                  <div className="meta">
                    {item.is_car_required && (
                      <span>
                        <Car size={14} aria-hidden /> Needs your car details
                      </span>
                    )}
                    {item.type === 'Product' && <span className="price">{formatPrice(item.price)} each</span>}
                  </div>
                </div>
                {item.type === 'Product' && (
                  <Stepper
                    value={item.quantity}
                    min={Math.max(1, item.minimum_qty ?? 1)}
                    onChange={q => setQuantity(item.id, q)}
                    label={`Quantity of ${item.name}`}
                  />
                )}
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}>
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
          <Link to="/" className="link small">
            Add more services
          </Link>
        </section>

        <aside className="card card--pad stack" aria-label="Summary">
          <h2 style={{fontSize: 'var(--text-lg)'}}>Summary</h2>
          <p className="small muted">{plural(chosen.length, 'service')} selected</p>
          {carNeeded && session && vehicles && vehicles.length > 0 && (
            <VehicleSelect vehicles={vehicles} />
          )}
          {carNeeded && !session && (
            <p className="note">Some services need your car's make and model. You'll add it after you sign in.</p>
          )}
          <Button
            block
            size="lg"
            disabled={chosen.length === 0 || (carNeeded && !!vehicles?.length && !selectedVehicleId)}
            onClick={onCompare}>
            Compare shop prices
          </Button>
          {!session && !carNeeded && (
            <p className="help">You can compare prices now. You'll sign in when you book.</p>
          )}
        </aside>
      </div>

      <Dialog open={needCar} onClose={() => setNeedCar(false)} title="Add your car first">
        <p>Shops price these services by car make and model. Add your car so they can quote you.</p>
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setNeedCar(false)}>
            Not now
          </Button>
          <Button onClick={() => navigate('/account/vehicles/new?next=/cart')}>Add my car</Button>
        </div>
      </Dialog>
    </div>
  )
}
