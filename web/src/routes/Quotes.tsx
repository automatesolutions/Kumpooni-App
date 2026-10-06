import React from 'react'
import {Link, Navigate, useNavigate} from 'react-router-dom'
import {Award, MapPin, MapPinOff, Store as StoreIcon} from '@/components/icons'
import {useCartStore} from '@/stores/cart'
import {useShopCartStore} from '@/stores/shop-cart'
import {useLocationStore} from '@/stores/location'
import {useUiStore} from '@/stores/ui'
import {useNearbyQuotesQuery, useNearbyRepairPlacesQuery} from '@/state/queries/stores'
import {QUOTE_SORTS, type SortQuotes} from '@/lib/constants'
import {formatDistance, formatPrice, plural} from '@/lib/format'
import {HAS_MAPS} from '@/lib/env'
import type {CartItem, NearbyStore} from '@/types/app'
import {PlaceCard} from '@/components/cards'
import {Button, CardSkeletons, EmptyState, ErrorState, PageHead, Rating} from '@/components/ui'

type Quote = {store: NearbyStore; lines: CartItem[]; total: number}

export function QuotesPage() {
  const navigate = useNavigate()
  const serviceIds = useCartStore(s => s.serviceIds)
  const cartItems = useCartStore(s => s.items)
  const setShopItems = useShopCartStore(s => s.setItems)
  const location = useLocationStore(s => s.location)
  const address = useLocationStore(s => s.address)
  const openLocation = useUiStore(s => s.openLocation)
  const [sort, setSort] = React.useState<SortQuotes>('price')

  const {data: stores, isLoading, error, refetch} = useNearbyQuotesQuery(location, serviceIds)

  // Each shop has its own copy of a service; source_id links it to the catalogue one.
  const quotes = React.useMemo<Quote[]>(() => {
    const list = (stores ?? []).map(store => {
      const lines = store.services.map(service => {
        const fromCart = cartItems.find(c => c.id === service.source_id)
        return {...service, quantity: fromCart?.quantity ?? 1}
      })
      const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
      return {store, lines, total}
    })
    return list.sort((a, b) => {
      if (sort === 'price') return a.total - b.total
      if (sort === 'distance') return a.store.dist_meters - b.store.dist_meters
      return (b.store.rating ?? 0) - (a.store.rating ?? 0)
    })
  }, [stores, cartItems, sort])

  const lowest = quotes.length > 1 ? Math.min(...quotes.map(q => q.total)) : null

  if (!serviceIds.length) return <Navigate to="/cart" replace />

  const onBook = (q: Quote) => {
    setShopItems(q.store.id, q.lines)
    navigate(`/checkout/${q.store.id}`, {state: {from: 'quotes'}})
  }

  return (
    <div className="container page">
      <PageHead
        back={{to: '/cart', label: 'Back to cart'}}
        title="Compare shop prices"
        description={`Prices for ${plural(serviceIds.length, 'service')} at shops near ${
          address?.main_text ?? 'you'
        }. Final cost may change after the shop checks your car.`}
        actions={
          location && (
            <div className="segmented" role="group" aria-label="Sort shops">
              {QUOTE_SORTS.map(s => (
                <button key={s.key} type="button" aria-pressed={sort === s.key} onClick={() => setSort(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
          )
        }
      />

      {!location ? (
        <EmptyState
          icon={<MapPinOff size={28} />}
          title="Set your location to see shops"
          action={
            <Button onClick={openLocation}>
              <MapPin size={18} aria-hidden /> Set location
            </Button>
          }>
          We need to know where your car is to find shops near you.
        </EmptyState>
      ) : isLoading ? (
        <CardSkeletons count={3} height={140} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !quotes.length ? (
        <EmptyState
          image="/images/no_messages.png"
          title="No shops near you offer these services yet"
          action={
            <Link to="/cart" className="btn btn--secondary">
              Change services
            </Link>
          }>
          Try fewer services, or set a different location.
        </EmptyState>
      ) : (
        <div className="list reveal">
          {quotes.map((q, i) => (
            <QuoteCard
              key={q.store.id}
              quote={q}
              isLowest={lowest !== null && q.total === lowest}
              onBook={() => onBook(q)}
              style={{'--i': i} as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {location && HAS_MAPS && <OtherShops />}
    </div>
  )
}

function QuoteCard({
  quote,
  isLowest,
  onBook,
  style,
}: {
  quote: Quote
  isLowest: boolean
  onBook: () => void
  style?: React.CSSProperties
}) {
  const {store, lines, total} = quote
  return (
    <article className="card quote" style={style}>
      <div className="shop__head">
        {store.store_img || store.store_logo ? (
          <img className="shop__logo" src={store.store_img || store.store_logo} alt="" />
        ) : (
          <div className="shop__logo" style={{display: 'grid', placeItems: 'center'}}>
            <StoreIcon size={22} className="muted" aria-hidden />
          </div>
        )}
        <div className="stack" style={{gap: 'var(--space-1)'}}>
          <h3>
            <Link to={`/shops/${store.id}`} className="card-title-link">
              {store.name}
            </Link>
          </h3>
          <div className="meta">
            <Rating value={store.rating} count={store.review_count} />
            <span>
              <MapPin size={14} aria-hidden /> {formatDistance(store.dist_meters)}
            </span>
          </div>
          <p className="small muted">{store.address}</p>
        </div>
      </div>
      <div className="quote__price">
        {isLowest && (
          <span className="best">
            <Award size={14} aria-hidden /> Lowest price
          </span>
        )}
        <span className="price price--lg">{formatPrice(total)}</span>
        <Button onClick={onBook}>Book at this shop</Button>
      </div>
      <details>
        <summary>See price breakdown</summary>
        <ul className="lines" style={{paddingBottom: 'var(--space-2)'}}>
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
      </details>
    </article>
  )
}

function OtherShops() {
  const location = useLocationStore(s => s.location)
  const {data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage} =
    useNearbyRepairPlacesQuery(location)
  const places = data?.pages.flatMap(p => p.places) ?? []

  if (error || (!isLoading && !places.length)) return null

  return (
    <section className="section" aria-labelledby="other-title">
      <div className="section-head">
        <div>
          <h2 id="other-title">Other repair shops nearby</h2>
          <p className="small muted" style={{marginTop: 'var(--space-1)'}}>
            These shops aren't on Kumpooni yet, so you can't book them here. Call or visit them directly.
          </p>
        </div>
      </div>
      {isLoading ? (
        <CardSkeletons count={3} height={260} />
      ) : (
        <>
          <div className="grid grid--cards">
            {places.map(p => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
          {hasNextPage && (
            <div style={{textAlign: 'center', marginTop: 'var(--space-6)'}}>
              <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                Show more shops
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
