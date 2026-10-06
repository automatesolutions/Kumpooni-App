import React from 'react'
import {Link, useParams} from 'react-router-dom'
import {Clock, MapPin, MapPinOff, Phone, Search, Store as StoreIcon} from '@/components/icons'
import {useLocationStore} from '@/stores/location'
import {useUiStore} from '@/stores/ui'
import {useShopCartStore} from '@/stores/shop-cart'
import {toast} from '@/stores/ui'
import {useSearchStoresQuery, useStoreQuery} from '@/state/queries/stores'
import {useStoreServicesQuery} from '@/state/queries/catalog'
import {formatDistance, formatPrice, plural} from '@/lib/format'
import type {Service} from '@/types/app'
import {ServiceCard, QuantityDialog} from '@/components/ServiceCard'
import {
  BackLink,
  Button,
  CardSkeletons,
  EmptyState,
  ErrorState,
  PageHead,
  Rating,
  Spinner,
} from '@/components/ui'

export function ShopsPage() {
  const location = useLocationStore(s => s.location)
  const address = useLocationStore(s => s.address)
  const openLocation = useUiStore(s => s.openLocation)
  const [draft, setDraft] = React.useState('')
  const [keyword, setKeyword] = React.useState('')

  React.useEffect(() => {
    const t = window.setTimeout(() => setKeyword(draft.trim()), 300)
    return () => window.clearTimeout(t)
  }, [draft])

  const {data: stores, isLoading, error, refetch} = useSearchStoresQuery(location, keyword)

  return (
    <div className="container page">
      <PageHead
        title="Shops near you"
        description={
          address ? `Kumpooni partner shops near ${address.main_text}.` : 'Kumpooni partner shops you can book online.'
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
          We show the closest shops first.
        </EmptyState>
      ) : (
        <>
          <div className="search" style={{maxWidth: 520, marginBottom: 'var(--space-6)'}}>
            <Search size={18} aria-hidden />
            <label htmlFor="shop-q" className="visually-hidden">
              Search shops by name
            </label>
            <input
              id="shop-q"
              className="input"
              type="search"
              placeholder="Search shops by name"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
          </div>

          {isLoading ? (
            <CardSkeletons height={280} />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !stores?.length ? (
            <EmptyState icon={<StoreIcon size={28} />} title={keyword ? `No shops match "${keyword}"` : 'No shops near you yet'}>
              {keyword
                ? 'Check the spelling, or clear the search to see all shops.'
                : "We're adding shops in more areas. Try a different location."}
            </EmptyState>
          ) : (
            <div className="grid grid--cards reveal">
              {stores.map((store, i) => (
                <Link
                  key={store.id}
                  to={`/shops/${store.id}`}
                  className="card card--link shop"
                  style={{'--i': i} as React.CSSProperties}>
                  {store.store_img ? (
                    <img className="shop__img" src={store.store_img} alt="" loading="lazy" />
                  ) : (
                    <div className="shop__img shop__img--empty" aria-hidden>
                      <StoreIcon size={32} />
                    </div>
                  )}
                  <div className="shop__body">
                    <h3>{store.name}</h3>
                    <div className="meta">
                      <Rating value={store.store_rating} count={store.review_count} />
                      <span>
                        <MapPin size={14} aria-hidden /> {formatDistance(store.dist_meters)}
                      </span>
                    </div>
                    <p className="small muted">{store.address}</p>
                    {store.order_total > 0 && (
                      <p className="xsmall muted">{plural(store.order_total, 'booking')} through Kumpooni</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function StorePage() {
  const {storeId = ''} = useParams()
  const {data: store, isLoading, error, refetch} = useStoreQuery(storeId)
  const [categoryId, setCategoryId] = React.useState<number | null>(null)
  const {items, shopId, addItem, removeItem} = useShopCartStore()
  const [picking, setPicking] = React.useState<Service | null>(null)

  React.useEffect(() => {
    if (store?.categories?.length && categoryId == null) setCategoryId(store.categories[0].id)
  }, [store, categoryId])

  const {data: services, isLoading: servicesLoading, error: servicesError} = useStoreServicesQuery(
    storeId,
    categoryId ?? 0,
  )

  const lines = shopId === storeId ? items : []
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const inCart = (id: number) => lines.some(l => l.id === id)

  const onToggle = (service: Service) => {
    if (inCart(service.id)) {
      removeItem(service.id)
      return
    }
    if (service.type === 'Product') {
      setPicking(service)
      return
    }
    if (shopId && shopId !== storeId && items.length) {
      toast('Started a new booking for this shop.', 'info')
    }
    addItem({...service, quantity: 1})
  }

  if (isLoading) return <Spinner />
  if (error || !store) {
    return (
      <div className="container page">
        <BackLink to="/shops">All shops</BackLink>
        <ErrorState error={error ?? 'We could not find this shop.'} onRetry={refetch} />
      </div>
    )
  }

  const tel = store.contact_no?.replace(/\s/g, '')

  return (
    <div className="container page">
      <BackLink to="/shops">All shops</BackLink>
      <div className="store-hero">
        {(store.banner_img || store.outside_img || store.store_img) && (
          <img src={store.banner_img || store.outside_img || store.store_img || ''} alt="" />
        )}
      </div>
      <div className="store-id">
        {store.store_logo || store.store_img ? (
          <img src={store.store_logo || store.store_img || ''} alt="" />
        ) : null}
        <h1 style={{paddingBottom: 'var(--space-2)'}}>{store.name}</h1>
      </div>

      <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 'var(--space-6)'}}>
        <dl className="info card card--pad">
          <MapPin size={20} aria-hidden />
          <div>
            <dt>Address</dt>
            <dd>{store.address}</dd>
          </div>
        </dl>
        {store.business_hours && (
          <dl className="info card card--pad">
            <Clock size={20} aria-hidden />
            <div>
              <dt>Open hours</dt>
              <dd>{store.business_hours}, Monday to Friday</dd>
            </div>
          </dl>
        )}
        {tel && (
          <dl className="info card card--pad">
            <Phone size={20} aria-hidden />
            <div>
              <dt>Phone</dt>
              <dd>
                <a className="link" href={`tel:${tel}`}>
                  {store.contact_no}
                </a>
              </dd>
            </div>
          </dl>
        )}
      </div>

      <section className="section" aria-labelledby="offers-title">
        <div className="section-head">
          <h2 id="offers-title">Services and prices</h2>
        </div>
        {store.categories.length > 1 && (
          <div className="tabs" role="tablist" aria-label="Service categories" style={{marginBottom: 'var(--space-4)'}}>
            {store.categories.map(c => (
              <button
                key={c.id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div role="tabpanel">
          {!store.categories.length ? (
            <EmptyState image="/images/no_messages.png" title="No services listed yet">
              This shop hasn't added its services. Call them to ask about prices.
            </EmptyState>
          ) : servicesLoading ? (
            <CardSkeletons count={4} height={150} />
          ) : servicesError ? (
            <ErrorState error={servicesError} />
          ) : !services?.length ? (
            <EmptyState image="/images/no_messages.png" title="Nothing in this category yet">
              Try another category.
            </EmptyState>
          ) : (
            <div className="grid grid--wide reveal">
              {services.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  inCart={inCart(s.id)}
                  onToggle={() => onToggle(s)}
                  showPrice
                  style={{'--i': i} as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {lines.length > 0 && (
        <div className="action-bar">
          <span>
            <span className="strong">{plural(lines.length, 'service')}</span>{' '}
            <span className="price">· {formatPrice(total)}</span>
          </span>
          <Link to={`/checkout/${storeId}`} className="btn btn--primary">
            Choose a time
          </Link>
        </div>
      )}

      <QuantityDialog
        service={picking}
        onClose={() => setPicking(null)}
        confirmLabel="Add to booking"
        onConfirm={quantity => {
          if (picking) addItem({...picking, quantity})
          setPicking(null)
        }}
      />
    </div>
  )
}
