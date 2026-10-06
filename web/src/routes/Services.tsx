import React from 'react'
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom'
import {Search, SearchX} from '@/components/icons'
import {
  useCategoriesQuery,
  useServiceSearchQuery,
  useServicesByCategoryQuery,
} from '@/state/queries/catalog'
import {ServiceCard, useCatalogCart} from '@/components/ServiceCard'
import {Button, CardSkeletons, EmptyState, ErrorState, PageHead} from '@/components/ui'
import {plural} from '@/lib/format'
import type {Service} from '@/types/app'

export function CategoryPage() {
  const {categoryId} = useParams()
  const id = Number(categoryId)
  const {data: categories} = useCategoriesQuery()
  const category = categories?.find(c => c.id === id)
  const {data: services, isLoading, error, refetch} = useServicesByCategoryQuery(id)

  return (
    <div className="container page">
      <PageHead
        back={{to: '/', label: 'All services'}}
        title={category?.name ?? 'Services'}
        description="Add the services you need. You'll compare shop prices in the next step."
      />
      <ServiceList services={services} isLoading={isLoading} error={error} onRetry={refetch} />
    </div>
  )
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = React.useState(q)
  const {data: services, isLoading, error, refetch} = useServiceSearchQuery(q)

  React.useEffect(() => setDraft(q), [q])

  return (
    <div className="container page">
      <PageHead back={{to: '/', label: 'Home'}} title="Search services" />
      <form
        role="search"
        className="row"
        style={{marginBottom: 'var(--space-6)', maxWidth: 640}}
        onSubmit={e => {
          e.preventDefault()
          setParams(draft.trim() ? {q: draft.trim()} : {})
        }}>
        <div className="search" style={{flex: 1}}>
          <Search size={18} aria-hidden />
          <label htmlFor="search-q" className="visually-hidden">
            Search services
          </label>
          <input
            id="search-q"
            className="input"
            type="search"
            autoFocus={!q}
            placeholder="Oil change, aircon cleaning, tune-up…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {!q ? (
        <EmptyState icon={<Search size={28} />} title="Search for a service">
          Type what your car needs, like "change oil" or "brake pads".
        </EmptyState>
      ) : (
        <>
          {services && services.length > 0 && (
            <p className="muted small" style={{marginBottom: 'var(--space-4)'}} aria-live="polite">
              {plural(services.length, 'result')} for "{q}"
            </p>
          )}
          <ServiceList
            services={services}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            showPrice
            empty={
              <EmptyState
                icon={<SearchX size={28} />}
                title={`No services match "${q}"`}
                action={
                  <Link to="/" className="btn btn--secondary">
                    Browse all services
                  </Link>
                }>
                Try a shorter word, or browse by category.
              </EmptyState>
            }
          />
        </>
      )}
    </div>
  )
}

function ServiceList({
  services,
  isLoading,
  error,
  onRetry,
  showPrice,
  empty,
}: {
  services: Service[] | undefined
  isLoading: boolean
  error: unknown
  onRetry: () => void
  showPrice?: boolean
  empty?: React.ReactNode
}) {
  const navigate = useNavigate()
  const {isInCart, toggle, dialog, count} = useCatalogCart()

  if (isLoading) return <CardSkeletons height={150} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!services?.length) {
    return (
      <>
        {empty ?? (
          <EmptyState
            image="/images/no_messages.png"
            title="No services here yet"
            action={
              <Button variant="secondary" onClick={() => navigate('/')}>
                Browse other services
              </Button>
            }>
            Shops haven't added services to this category. Check another one.
          </EmptyState>
        )}
      </>
    )
  }

  return (
    <>
      <div className="grid grid--wide reveal">
        {services.map((service, i) => (
          <ServiceCard
            key={service.id}
            service={service}
            inCart={isInCart(service.id)}
            onToggle={() => toggle(service)}
            showPrice={showPrice || service.type === 'Product' || service.service_type === 'OrderDelivery'}
            style={{'--i': i} as React.CSSProperties}
          />
        ))}
      </div>
      {count > 0 && (
        <div className="action-bar">
          <span className="strong">{plural(count, 'service')} in your cart</span>
          <Link to="/cart" className="btn btn--primary">
            Compare shop prices
          </Link>
        </div>
      )}
      {dialog}
    </>
  )
}
