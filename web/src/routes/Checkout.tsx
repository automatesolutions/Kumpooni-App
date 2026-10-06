import React from 'react'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import dayjs from 'dayjs'
import {CalendarX, MapPin, ShoppingCart} from '@/components/icons'
import {useShopCartStore} from '@/stores/shop-cart'
import {useCartStore, isCarRequired} from '@/stores/cart'
import {useVehicleStore} from '@/stores/vehicle'
import {useLocationStore} from '@/stores/location'
import {toast} from '@/stores/ui'
import {useUserId} from '@/state/session'
import {useStoreQuery, useStoreSlotsQuery} from '@/state/queries/stores'
import {useVehiclesQuery} from '@/state/queries/vehicles'
import {useCreateOrderMutation} from '@/state/queries/orders'
import {errorMessage, formatPrice, formatTime} from '@/lib/format'
import {Alert, Button, EmptyState, ErrorState, PageHead, Skeleton} from '@/components/ui'
import {VehicleSelect} from './Vehicles'

export function CheckoutPage() {
  const {storeId = ''} = useParams()
  const navigate = useNavigate()
  const userId = useUserId()
  const {items, shopId, clear} = useShopCartStore()
  const removeFromCart = useCartStore(s => s.removeItems)
  const cameFromQuotes = (useLocation().state as {from?: string} | null)?.from === 'quotes'
  const selectedVehicleId = useVehicleStore(s => s.selectedId)
  const address = useLocationStore(s => s.address)
  const {data: store} = useStoreQuery(storeId)
  const {data: slots, isLoading: slotsLoading, error: slotsError, refetch} = useStoreSlotsQuery(storeId)
  const {data: vehicles} = useVehiclesQuery(userId)
  const createOrder = useCreateOrderMutation()

  const [date, setDate] = React.useState<string | null>(null)
  const [time, setTime] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (slots?.length && !date) setDate(slots[0].available_date)
  }, [slots, date])

  const lines = shopId === storeId ? items : []
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const carNeeded = isCarRequired(lines)
  const times = slots?.find(s => s.available_date === date)?.available_timeslots ?? []
  const vehicleReady = !carNeeded || (!!selectedVehicleId && vehicles?.some(v => v.id === selectedVehicleId))
  const canBook = !!date && !!time && lines.length > 0 && vehicleReady

  const onBook = () => {
    if (!date || !time) return
    createOrder.mutate(
      {
        user_id: userId,
        store_id: storeId,
        appointment_date: date,
        appointment_time: time,
        vehicle_id: carNeeded ? selectedVehicleId ?? undefined : undefined,
        requested_services: lines.map(l => ({service_id: l.id, quantity: l.quantity})),
      },
      {
        onSuccess: () => {
          removeFromCart(lines.map(l => l.source_id ?? 0))
          clear()
          toast('Booked. You can track it in your orders.')
          navigate('/orders')
        },
      },
    )
  }

  if (!lines.length) {
    return (
      <div className="container page">
        <PageHead title="Book appointment" />
        <EmptyState
          icon={<ShoppingCart size={28} />}
          title="Nothing to book yet"
          action={
            <Link to="/cart" className="btn btn--primary">
              Go to cart
            </Link>
          }>
          Pick services and choose a shop first.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container page">
      <PageHead
        back={
          cameFromQuotes
            ? {to: '/quotes', label: 'Back to shop prices'}
            : {to: `/shops/${storeId}`, label: 'Back to shop'}
        }
        title="Book appointment"
        description={store ? `at ${store.name}` : undefined}
      />

      <div className="split">
        <div className="stack" style={{gap: 'var(--space-6)'}}>
          <section className="card card--pad stack" aria-labelledby="date-title">
            <h2 id="date-title" style={{fontSize: 'var(--text-lg)'}}>
              1. Choose a date
            </h2>
            {slotsLoading ? (
              <div className="chips">
                {Array.from({length: 7}).map((_, i) => (
                  <Skeleton key={i} width={68} height={72} radius="var(--radius-md)" />
                ))}
              </div>
            ) : slotsError ? (
              <ErrorState error={slotsError} onRetry={refetch} />
            ) : !slots?.length ? (
              <EmptyState icon={<CalendarX size={28} />} title="No open dates">
                This shop has no open slots right now. Try another shop.
              </EmptyState>
            ) : (
              <div className="chips" role="radiogroup" aria-label="Date">
                {slots.map(s => {
                  const d = dayjs(s.available_date)
                  return (
                    <button
                      key={s.available_date}
                      type="button"
                      role="radio"
                      className="chip date-chip"
                      aria-checked={date === s.available_date}
                      aria-label={d.format('dddd, D MMMM')}
                      onClick={() => {
                        setDate(s.available_date)
                        setTime(null)
                      }}>
                      <small>{d.format('ddd')}</small>
                      <strong>{d.format('D')}</strong>
                      <small>{d.format('MMM')}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {date && (
            <section className="card card--pad stack" aria-labelledby="time-title">
              <h2 id="time-title" style={{fontSize: 'var(--text-lg)'}}>
                2. Choose a time
              </h2>
              {times.length ? (
                <div className="chips chips--wrap" role="radiogroup" aria-label="Time">
                  {times.map(t => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      className="chip"
                      aria-checked={time === t}
                      onClick={() => setTime(t)}>
                      <span className="num">{formatTime(t)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">No times left on this day. Choose another date.</p>
              )}
            </section>
          )}

          {carNeeded && (
            <section className="card card--pad stack" aria-labelledby="car-title">
              <h2 id="car-title" style={{fontSize: 'var(--text-lg)'}}>
                3. Your car
              </h2>
              {vehicles?.length ? (
                <VehicleSelect vehicles={vehicles} />
              ) : (
                <div className="row row--between" style={{flexWrap: 'wrap'}}>
                  <p className="muted">Add your car so the shop knows what to expect.</p>
                  <Link className="btn btn--secondary" to={`/account/vehicles/new?next=/checkout/${storeId}`}>
                    Add my car
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="card card--pad stack" aria-label="Booking summary">
          <h2 style={{fontSize: 'var(--text-lg)'}}>{store?.name ?? 'Summary'}</h2>
          {store?.address && (
            <p className="small muted row" style={{alignItems: 'flex-start', gap: 'var(--space-2)'}}>
              <MapPin size={16} aria-hidden style={{flexShrink: 0, marginTop: 2}} />
              {store.address}
            </p>
          )}
          <ul className="lines">
            {lines.map(l => (
              <li key={l.id}>
                <span>
                  {l.name}
                  {l.quantity > 1 && <span className="muted"> × {l.quantity}</span>}
                </span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="total">
            <span>Estimated total</span>
            <span className="price price--lg">{formatPrice(total)}</span>
          </div>
          {date && time && (
            <p className="small">
              <span className="strong">{dayjs(date).format('ddd, D MMM')}</span> at{' '}
              <span className="strong">{formatTime(time)}</span>
            </p>
          )}
          <p className="note">
            This estimate uses the details you gave. The shop may change it after checking your car. You pay at
            the shop.
          </p>
          {address && <p className="xsmall muted">Your location: {address.formatted_address}</p>}
          {createOrder.error && <Alert>{errorMessage(createOrder.error)}</Alert>}
          <Button block size="lg" disabled={!canBook} loading={createOrder.isPending} onClick={onBook}>
            Book appointment
          </Button>
          {!canBook && !createOrder.isPending && (
            <p className="help" aria-live="polite">
              {!date
                ? 'Choose a date to continue.'
                : !time
                  ? 'Choose a time to continue.'
                  : !vehicleReady
                    ? 'Choose your car to continue.'
                    : ''}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
