import React from 'react'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {CalendarDays, Car, ClipboardList, Clock, MapPin, Phone, Star} from '@/components/icons'
import {useUserId} from '@/state/session'
import {useCreateReviewMutation, useOrderQuery, useOrdersQuery} from '@/state/queries/orders'
import {ORDER_TABS, type OrderTab} from '@/lib/constants'
import {errorMessage, formatDate, formatPrice, formatTime} from '@/lib/format'
import {toast} from '@/stores/ui'
import {OrderCard} from '@/components/cards'
import {
  Alert,
  BackLink,
  Button,
  CardSkeletons,
  EmptyState,
  ErrorState,
  PageHead,
  Spinner,
  StatusBadge,
} from '@/components/ui'

const EMPTY_COPY: Record<OrderTab, {title: string; body: string}> = {
  scheduled: {title: 'No upcoming appointments', body: 'When you book a service, it shows up here.'},
  'inprogress|awaiting-parts': {
    title: 'Nothing in progress',
    body: 'Cars the shop is working on show up here.',
  },
  completed: {title: 'No completed services yet', body: 'Finished services show up here so you can rate the shop.'},
  canceled: {title: 'No canceled appointments', body: "Good news. You haven't canceled anything."},
}

export function OrdersPage() {
  const userId = useUserId()
  const [tab, setTab] = React.useState<OrderTab>('scheduled')
  const {data: orders, isLoading, error, refetch} = useOrdersQuery(userId, tab)

  return (
    <div className="container page">
      <PageHead title="Your orders" />
      <div className="tabs" role="tablist" aria-label="Order status" style={{marginBottom: 'var(--space-6)'}}>
        {ORDER_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {isLoading ? (
          <CardSkeletons count={3} height={180} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !orders?.length ? (
          <EmptyState
            icon={<ClipboardList size={28} />}
            title={EMPTY_COPY[tab].title}
            action={
              tab === 'scheduled' && (
                <Link to="/" className="btn btn--primary">
                  Book a service
                </Link>
              )
            }>
            {EMPTY_COPY[tab].body}
          </EmptyState>
        ) : (
          <div className="grid grid--wide reveal">
            {orders.map((o, i) => (
              <OrderCard key={o.id} order={o} style={{'--i': i} as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function OrderDetailPage() {
  const {orderId = ''} = useParams()
  const userId = useUserId()
  const {data: order, isLoading, error, refetch} = useOrderQuery(userId, orderId)

  if (isLoading) return <Spinner />
  if (error || !order) {
    return (
      <div className="container page">
        <BackLink to="/orders">All orders</BackLink>
        <ErrorState error={error ?? 'We could not find this order.'} onRetry={refetch} />
      </div>
    )
  }

  const subtotal =
    order.services.reduce((s, l) => s + l.price * (l.quantity ?? 1), 0) +
    order.parts.reduce((s, p) => s + p.price * p.quantity, 0)
  const tel = order.store.contact_no?.replace(/\s/g, '')
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${order.store.latitude},${order.store.longitude}`

  return (
    <div className="container page">
      <PageHead
        back={{to: '/orders', label: 'All orders'}}
        title={order.store.name}
        description={order.reference_no ? `Reference ${order.reference_no}` : undefined}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="split">
        <div className="stack" style={{gap: 'var(--space-6)'}}>
          <section className="card card--pad grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'}}>
            <dl className="info">
              <CalendarDays size={20} aria-hidden />
              <div>
                <dt>Date</dt>
                <dd>{formatDate(order.appointment_date, 'dddd, D MMMM YYYY')}</dd>
              </div>
            </dl>
            <dl className="info">
              <Clock size={20} aria-hidden />
              <div>
                <dt>Time</dt>
                <dd>{formatTime(order.appointment_time)}</dd>
              </div>
            </dl>
            {order.vehicle && (
              <dl className="info">
                <Car size={20} aria-hidden />
                <div>
                  <dt>Car</dt>
                  <dd>
                    {order.vehicle.year_model} {order.vehicle.brand?.name} {order.vehicle.model?.name}
                    {order.vehicle.plate_no && <span className="muted"> · {order.vehicle.plate_no}</span>}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <section className="card card--pad stack" aria-labelledby="summary-title">
            <h2 id="summary-title" style={{fontSize: 'var(--text-lg)'}}>
              Services
            </h2>
            <ul className="lines">
              {order.services.map(l => (
                <li key={l.id}>
                  <span>
                    {l.name ?? l.service_name}
                    {(l.quantity ?? 1) > 1 && <span className="muted"> × {l.quantity}</span>}
                  </span>
                  <span>{formatPrice(l.price * (l.quantity ?? 1))}</span>
                </li>
              ))}
            </ul>
            {order.parts.length > 0 && (
              <>
                <h3 style={{fontSize: 'var(--text-md)', marginTop: 'var(--space-2)'}}>Parts</h3>
                <ul className="lines">
                  {order.parts.map(p => (
                    <li key={p.id}>
                      <span>
                        {p.name}
                        <span className="muted">
                          {' '}
                          × {p.quantity}
                          {p.unit_measure ? ` ${p.unit_measure}` : ''}
                        </span>
                      </span>
                      <span>{formatPrice(p.price * p.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="row row--between small muted">
              <span>Subtotal</span>
              <span className="num">{formatPrice(subtotal)}</span>
            </div>
            <div className="total">
              <span>Total</span>
              <span className="price price--lg">{formatPrice(order.total_cost ?? subtotal)}</span>
            </div>
            <p className="xsmall muted">Booked {formatDate(order.created_at, 'D MMM YYYY, h:mm A')}</p>
          </section>
        </div>

        <aside className="card card--pad stack" aria-label="Shop">
          <h2 style={{fontSize: 'var(--text-lg)'}}>Shop</h2>
          {order.store.store_img && (
            <img src={order.store.store_img} alt="" style={{borderRadius: 'var(--radius-sm)', aspectRatio: '16/9', objectFit: 'cover'}} />
          )}
          <p className="strong">{order.store.name}</p>
          <p className="small muted row" style={{alignItems: 'flex-start', gap: 'var(--space-2)'}}>
            <MapPin size={16} aria-hidden style={{flexShrink: 0, marginTop: 2}} /> {order.store.address}
          </p>
          <div className="row" style={{flexWrap: 'wrap'}}>
            <a className="btn btn--secondary btn--sm" href={mapUrl} target="_blank" rel="noreferrer">
              <MapPin size={16} aria-hidden /> Directions
            </a>
            {tel && (
              <a className="btn btn--secondary btn--sm" href={`tel:${tel}`}>
                <Phone size={16} aria-hidden /> Call shop
              </a>
            )}
          </div>
          {order.status === 'completed' && !order.reviews?.length && (
            <Link className="btn btn--primary" to={`/orders/${order.id}/review`}>
              <Star size={18} aria-hidden /> Rate this shop
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export function WriteReviewPage() {
  const {orderId = ''} = useParams()
  const navigate = useNavigate()
  const userId = useUserId()
  const {data: order, isLoading} = useOrderQuery(userId, orderId)
  const review = useCreateReviewMutation()
  const [rating, setRating] = React.useState(5)
  const [content, setContent] = React.useState('')

  if (isLoading) return <Spinner />
  if (!order) {
    return (
      <div className="container page">
        <BackLink to="/orders">All orders</BackLink>
        <ErrorState error="We could not find this order." />
      </div>
    )
  }

  if (order.reviews?.length) {
    return (
      <div className="container page">
        <BackLink to={`/orders/${order.id}`}>Back to order</BackLink>
        <EmptyState icon={<Star size={28} />} title="You already rated this visit">
          Thanks for sharing. Each booking can have one review.
        </EmptyState>
      </div>
    )
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    review.mutate(
      {content: content.trim(), rating, store_id: order.store.id, repair_order_id: order.id, user_id: userId},
      {
        onSuccess: () => {
          toast('Thanks. Your review is posted.')
          navigate('/orders')
        },
      },
    )
  }

  const names = order.services.map(s => s.name ?? s.service_name).join(', ')

  return (
    <div className="container page" style={{maxWidth: 680}}>
      <PageHead
        back={{to: `/orders/${order.id}`, label: 'Back to order'}}
        title={`Rate ${order.store.name}`}
        description={names}
      />
      <form className="card card--pad stack" onSubmit={onSubmit}>
        <fieldset style={{border: 0, padding: 0, margin: 0}}>
          <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
            Overall rating
          </legend>
          <div className="row">
            <div className="stars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}, ${RATING_WORDS[n]}`}
                  className={n <= rating ? 'on' : ''}
                  onClick={() => setRating(n)}>
                  <Star size={28} />
                </button>
              ))}
            </div>
            <span className="strong">{RATING_WORDS[rating]}</span>
          </div>
        </fieldset>
        <div className="field">
          <label className="label" htmlFor="review-text">
            Tell other drivers about your visit <span className="muted">(optional)</span>
          </label>
          <textarea
            id="review-text"
            className="textarea"
            maxLength={1000}
            placeholder="Was the work done on time? Was the price what you expected?"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <p className="help">{content.length}/1000</p>
        </div>
        {review.error && <Alert>{errorMessage(review.error, "We couldn't post your review. Try again.")}</Alert>}
        <Button type="submit" size="lg" loading={review.isPending} disabled={rating < 1}>
          Post review
        </Button>
      </form>
    </div>
  )
}
