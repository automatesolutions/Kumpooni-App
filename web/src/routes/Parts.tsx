import React from 'react'
import {MapPin, MapPinOff, Search, Store as StoreIcon} from '@/components/icons'
import {useLocationStore} from '@/stores/location'
import {useUiStore} from '@/stores/ui'
import {usePartsShopsQuery} from '@/state/queries/stores'
import {PARTS_CATEGORIES} from '@/lib/constants'
import {HAS_MAPS} from '@/lib/env'
import {PlaceCard} from '@/components/cards'
import {Button, CardSkeletons, EmptyState, ErrorState, PageHead} from '@/components/ui'

export function PartsPage() {
  const location = useLocationStore(s => s.location)
  const address = useLocationStore(s => s.address)
  const openLocation = useUiStore(s => s.openLocation)
  const [category, setCategory] = React.useState(PARTS_CATEGORIES[0].key)
  const [draft, setDraft] = React.useState('')
  const [search, setSearch] = React.useState('')

  const query = search || PARTS_CATEGORIES.find(c => c.key === category)!.textQuery
  const {data: places, isLoading, error, refetch} = usePartsShopsQuery(location, query)
  const sorted = React.useMemo(
    () => [...(places ?? [])].sort((a, b) => (a.dist_meters ?? 0) - (b.dist_meters ?? 0)),
    [places],
  )

  return (
    <div className="container page">
      <PageHead
        title="Parts stores"
        description={`Stores near ${address?.main_text ?? 'you'} that sell parts, tires, batteries and oil.`}
      />

      {!HAS_MAPS ? (
        <EmptyState icon={<StoreIcon size={28} />} title="Parts search isn't set up">
          Add a Google Maps key to the web app's settings to search for parts stores.
        </EmptyState>
      ) : !location ? (
        <EmptyState
          icon={<MapPinOff size={28} />}
          title="Set your location to find stores"
          action={
            <Button onClick={openLocation}>
              <MapPin size={18} aria-hidden /> Set location
            </Button>
          }>
          We show the closest stores first.
        </EmptyState>
      ) : (
        <>
          <form
            role="search"
            className="row"
            style={{maxWidth: 560, marginBottom: 'var(--space-4)'}}
            onSubmit={e => {
              e.preventDefault()
              setSearch(draft.trim())
            }}>
            <div className="search" style={{flex: 1}}>
              <Search size={18} aria-hidden />
              <label htmlFor="parts-q" className="visually-hidden">
                Search parts stores
              </label>
              <input
                id="parts-q"
                className="input"
                type="search"
                placeholder="Brake pads, spark plugs, a store name…"
                value={draft}
                onChange={e => {
                  setDraft(e.target.value)
                  if (!e.target.value) setSearch('')
                }}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {!search && (
            <div className="chips" role="group" aria-label="Category" style={{marginBottom: 'var(--space-6)'}}>
              {PARTS_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className="chip"
                  aria-pressed={category === c.key}
                  onClick={() => setCategory(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <CardSkeletons height={300} />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !sorted.length ? (
            <EmptyState icon={<StoreIcon size={28} />} title="No stores found">
              Try another category, or search for a part by name.
            </EmptyState>
          ) : (
            <div className="grid grid--cards reveal">
              {sorted.map((p, i) => (
                <PlaceCard key={p.id} place={p} style={{'--i': i} as React.CSSProperties} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
