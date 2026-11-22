import React from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {LocateFixed, MapPin, Phone, Route, Scale, Search} from '@/components/icons'
import {Alert, Button, Dialog, EmptyState, ErrorState, PageHead, Rating, Skeleton} from '@/components/ui'
import {NearbyMap} from '@/components/NearbyMap'
import {geocodeText, type Coords} from '@/lib/geo'
import {gsap, MQ, useGSAP} from '@/lib/gsap'
import {kindLabel} from '@/lib/kinds'
import {errorMessage} from '@/lib/format'
import {
  BOARD_SIZE,
  NEARBY_KINDS,
  RADIUS_DEFAULT_KM,
  RADIUS_MAX_KM,
  RADIUS_MIN_KM,
  type NearbyKind,
  type ShopWithKm,
  asNearbyKind,
  clampRadius,
  formatDistance,
  openLabel,
  rankByDistance,
  shopDirectionsUrl,
  standoutLines,
  startFileUrl,
  telUrl,
  todaysHours,
  withinRadius,
} from '@/lib/nearby'
import {useNearbyShopsQuery} from '@/state/queries/nearby'
import {loadLastLocation, saveLastLocation} from '@/state/queries/repair'
import {useUserId} from '@/state/session'
import {useLocationStore} from '@/stores/location'

const COMPARE_MAX = 3
const PODIUM_LABEL = ['1st', '2nd', '3rd']

export function NearbyPage() {
  const [params, setParams] = useSearchParams()
  const kind = asNearbyKind(params.get('kind'))
  const [km, setKm] = React.useState(() => Math.round(clampRadius(Number(params.get('km')) || RADIUS_DEFAULT_KM)))

  const userId = useUserId()
  const {location, address, locate, isLocating, setLocation} = useLocationStore()
  const [locError, setLocError] = React.useState('')
  const [townOpen, setTownOpen] = React.useState(false)

  // A signed-in person's last shared point, so they aren't asked again.
  React.useEffect(() => {
    if (location || !userId) return
    let cancelled = false
    loadLastLocation(userId)
      .then(saved => {
        if (!cancelled && saved && !useLocationStore.getState().location) {
          setLocation(saved, {formatted_address: 'Saved location', main_text: 'Saved location', secondary_text: ''})
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [userId])

  const useMyLocation = async () => {
    setLocError('')
    try {
      await locate()
      setTownOpen(false)
      const coords = useLocationStore.getState().location
      if (userId && coords) saveLastLocation(userId, coords).catch(() => undefined)
    } catch (e) {
      setLocError(errorMessage(e))
      setTownOpen(true)
    }
  }

  const useTown = (hit: {coords: Coords; label: string}) => {
    setLocation(hit.coords, {formatted_address: hit.label, main_text: hit.label.split(',')[0], secondary_text: ''})
    setLocError('')
    setTownOpen(false)
    if (userId) saveLastLocation(userId, hit.coords).catch(() => undefined)
  }

  const setParam = (key: string, value: string) =>
    setParams(
      p => {
        const next = new URLSearchParams(p)
        next.set(key, value)
        return next
      },
      {replace: true},
    )

  // Category: remember which way to slide.
  const direction = React.useRef(1)
  const pickKind = (k: NearbyKind) => {
    if (k === kind) return
    direction.current = NEARBY_KINDS.indexOf(k) > NEARBY_KINDS.indexOf(kind) ? 1 : -1
    setParam('kind', k)
  }
  const changeKm = (value: number) => {
    setKm(value)
    setParam('km', String(value))
  }

  const query = useNearbyShopsQuery(kind, location, km)
  const ranked = React.useMemo(
    () => (query.data && location ? rankByDistance(withinRadius(query.data.shops, location, km)) : []),
    [query.data, location, km],
  )
  const standouts = React.useMemo(() => standoutLines(ranked), [ranked])

  // Selection is shared by the cards and the pins.
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const cardRefs = React.useRef(new Map<string, HTMLElement>())
  const selectFromMap = (id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => {
      const el = cardRefs.current.get(id)
      if (!el) return
      const reduce = !matchMedia(MQ.motion).matches
      el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'})
      el.focus({preventScroll: true})
    })
  }

  // Compare: 2 or 3 shops from this category.
  const [compare, setCompare] = React.useState<ShopWithKm[]>([])
  const [compareNote, setCompareNote] = React.useState('')
  const [compareBlocked, setCompareBlocked] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const toggleCompare = (shop: ShopWithKm) => {
    setCompareBlocked(false)
    if (compare.some(s => s.id === shop.id)) {
      setCompare(compare.filter(s => s.id !== shop.id))
      setCompareNote(`${shop.name} removed from compare.`)
    } else if (compare.length >= COMPARE_MAX) {
      setCompareBlocked(true)
      setCompareNote('You can compare up to 3 shops. Untick one to add another.')
    } else {
      setCompare([...compare, shop])
      setCompareNote(`${shop.name} added to compare. ${compare.length + 1} of 3 picked.`)
    }
  }

  // A new category starts a new board.
  React.useEffect(() => {
    setSelectedId(null)
    setCompare([])
    setCompareBlocked(false)
    setCompareNote('')
  }, [kind])
  React.useEffect(() => {
    if (selectedId && !ranked.some(s => s.id === selectedId)) setSelectedId(null)
  }, [ranked, selectedId])

  // Switching category slides the board. With reduced motion it swaps at once.
  const board = React.useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.fromTo(board.current, {x: 32 * direction.current, autoAlpha: 0}, {x: 0, autoAlpha: 1, duration: 0.35})
      })
      return () => mm.revert()
    },
    {dependencies: [kind]},
  )

  const label = kindLabel(kind)
  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const widening = query.isPlaceholderData && query.isFetching
  // Sample shops have made-up spots, so some would land in the sea. Only real shops get pins.
  const isSample = query.data?.source === 'sample'

  return (
    <div className="container page nearby">
      <PageHead
        title="Top shops nearby"
        description="Pick a kind of repair to see the 10 top shops near you. Compare up to three, then start a repair file with the one you choose."
      />

      <section className="nearby-where card card--pad" aria-label="Where to look">
        {location ? (
          <div className="row row--between" style={{flexWrap: 'wrap'}}>
            <p className="row" style={{gap: 'var(--space-2)'}}>
              <MapPin size={18} aria-hidden />
              <span>
                Near <span className="strong">{address?.main_text || 'your location'}</span>
              </span>
            </p>
            <div className="row" style={{gap: 'var(--space-2)'}}>
              <Button variant="ghost" size="sm" onClick={useMyLocation} loading={isLocating}>
                {!isLocating && <LocateFixed size={16} aria-hidden />} Use my location
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTownOpen(o => !o)} aria-expanded={townOpen}>
                <Search size={16} aria-hidden /> Choose a town
              </Button>
            </div>
          </div>
        ) : (
          <div className="stack" style={{gap: 'var(--space-3)'}}>
            <h2 className="section-title">Where should we look?</h2>
            <p className="small muted">We use your location to find shops near you. You can choose a town instead.</p>
            <div className="row" style={{flexWrap: 'wrap', gap: 'var(--space-2)'}}>
              <Button onClick={useMyLocation} loading={isLocating}>
                {!isLocating && <LocateFixed size={18} aria-hidden />} Use my location
              </Button>
              <Button variant="secondary" onClick={() => setTownOpen(true)} aria-expanded={townOpen}>
                <Search size={18} aria-hidden /> Choose a town
              </Button>
            </div>
          </div>
        )}
        {locError && <Alert>{locError}</Alert>}
        {townOpen && <TownSearch onFound={useTown} />}
      </section>

      <div className="chips nearby-chips" role="group" aria-label="Category">
        {NEARBY_KINDS.map(k => (
          <button key={k} type="button" className="chip" aria-pressed={k === kind} onClick={() => pickKind(k)}>
            {kindLabel(k)}
          </button>
        ))}
      </div>

      <div className="nearby-radius">
        <label htmlFor="nearby-radius" className="label">
          Distance: up to <span className="strong">{km} km</span>
        </label>
        <input
          id="nearby-radius"
          type="range"
          min={RADIUS_MIN_KM}
          max={RADIUS_MAX_KM}
          step={1}
          value={km}
          onChange={e => changeKm(Number(e.target.value))}
          aria-valuetext={`${km} kilometres`}
        />
        <div className="nearby-radius__ends small muted" aria-hidden>
          <span>{RADIUS_MIN_KM} km</span>
          <span>{RADIUS_MAX_KM} km</span>
        </div>
      </div>

      <p className="nearby-honesty">Ranked by distance and proof, not paid placement.</p>

      {query.data?.source === 'sample' && (
        <p className="note small">These are sample shops with made-up names. Live shop data isn't turned on yet.</p>
      )}
      {widening && (
        <p className="small muted" role="status">
          Looking up to {km} km away
        </p>
      )}

      {!location ? null : query.isLoading ? (
        <BoardSkeleton />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          <NearbyMap
            you={location}
            radiusKm={km}
            shops={isSample ? [] : ranked}
            selectedId={selectedId}
            onSelect={selectFromMap}
            note={isSample ? "Sample shops aren't on the map because their places are made up." : undefined}
          />

          <div ref={board} className="nearby-board">
            {ranked.length === 0 ? (
              <EmptyState
                icon={<MapPin size={28} />}
                title={`No ${label.toLowerCase()} shops within ${km} km`}
                action={
                  km < RADIUS_MAX_KM ? (
                    <Button variant="secondary" onClick={() => changeKm(RADIUS_MAX_KM)}>
                      Search up to {RADIUS_MAX_KM} km
                    </Button>
                  ) : undefined
                }>
                Try a larger distance or another category.
              </EmptyState>
            ) : (
              <>
                <h2 className="visually-hidden">Top {ranked.length} for {label}</h2>
                <ol className="podium">
                  {podium.map((s, i) => (
                    <ShopCard
                      key={s.id}
                      shop={s}
                      rank={i + 1}
                      total={ranked.length}
                      kind={kind}
                      variant="podium"
                      standout={standouts.get(s.id)}
                      you={location}
                      selected={s.id === selectedId}
                      compared={compare.some(c => c.id === s.id)}
                      onSelect={() => setSelectedId(s.id)}
                      onCompare={() => toggleCompare(s)}
                      cardRef={el => (el ? cardRefs.current.set(s.id, el) : cardRefs.current.delete(s.id))}
                    />
                  ))}
                </ol>
                {rest.length > 0 && (
                  <ol className="shop-list" start={4}>
                    {rest.map((s, i) => (
                      <ShopCard
                        key={s.id}
                        shop={s}
                        rank={i + 4}
                        total={ranked.length}
                        kind={kind}
                        variant="compact"
                        standout={standouts.get(s.id)}
                        you={location}
                        selected={s.id === selectedId}
                        compared={compare.some(c => c.id === s.id)}
                        onSelect={() => setSelectedId(s.id)}
                        onCompare={() => toggleCompare(s)}
                        cardRef={el => (el ? cardRefs.current.set(s.id, el) : cardRefs.current.delete(s.id))}
                      />
                    ))}
                  </ol>
                )}
                {compare.length === 0 && (
                  <p className="small muted">Tick Compare on 2 or 3 shops to see them side by side.</p>
                )}
              </>
            )}
          </div>
        </>
      )}

      <p className="visually-hidden" aria-live="polite">
        {compareNote}
      </p>

      {compare.length > 0 && (
        <div className="compare-bar" role="region" aria-label="Compare">
          <div className="container compare-bar__inner">
            <p className="small">
              {compareBlocked ? (
                'You can compare up to 3 shops. Untick one to add another.'
              ) : compare.length < 2 ? (
                'Pick 2 or 3 shops to compare.'
              ) : (
                <>
                  <span className="strong">{compare.length} of 3</span> picked
                </>
              )}
            </p>
            <div className="row" style={{gap: 'var(--space-2)'}}>
              <Button variant="ghost" size="sm" onClick={() => setCompare([])}>
                Clear the list
              </Button>
              <Button size="sm" disabled={compare.length < 2} onClick={() => setCompareOpen(true)}>
                <Scale size={16} aria-hidden /> Compare these shops
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} title="Compare shops" wide>
        {compare.length < 2 ? (
          <p>Pick 2 or 3 shops to compare.</p>
        ) : (
          <CompareTable
            shops={compare}
            ranks={new Map(ranked.map((s, i) => [s.id, i + 1]))}
            kind={kind}
            you={location}
          />
        )}
      </Dialog>

      <footer className="nearby-foot small muted">
        <p>
          Kumpooni doesn't book shops or take payments. Rankings are guidance from public ratings and your saved files.
          They aren't a certification that a shop is good or licensed.
        </p>
        <p>No shop can pay for a higher rank.</p>
      </footer>
    </div>
  )
}

function TownSearch({onFound}: {onFound: (hit: {coords: Coords; label: string}) => void}) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [notFound, setNotFound] = React.useState('')
  const id = React.useId()

  const find = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setNotFound('')
    try {
      const hit = await geocodeText(text)
      if (hit) onFound(hit)
      else setNotFound(`We couldn't find “${text}”. Try the town and province.`)
    } catch (err) {
      setNotFound(errorMessage(err, "We couldn't search right now. Check your connection, then try again."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="row nearby-town" onSubmit={find}>
      <label htmlFor={id} className="visually-hidden">
        Town or city
      </label>
      <div className="search" style={{flex: '1 1 220px'}}>
        <Search size={20} aria-hidden />
        <input
          id={id}
          className="input"
          placeholder="Town or city, for example Quezon City"
          value={text}
          onChange={e => setText(e.target.value)}
          autoComplete="address-level2"
        />
      </div>
      <Button type="submit" variant="secondary" loading={busy} disabled={text.trim().length < 2}>
        Find shops here
      </Button>
      {notFound && <p className="error-text" style={{flexBasis: '100%'}}>{notFound}</p>}
    </form>
  )
}

function ShopCard({
  shop,
  rank,
  total,
  kind,
  variant,
  standout,
  you,
  selected,
  compared,
  onSelect,
  onCompare,
  cardRef,
}: {
  shop: ShopWithKm
  rank: number
  total: number
  kind: NearbyKind
  variant: 'podium' | 'compact'
  standout?: string
  you: Coords | null
  selected: boolean
  compared: boolean
  onSelect: () => void
  onCompare: () => void
  cardRef: (el: HTMLElement | null) => void
}) {
  const open = openLabel(shop.openNow)
  const podium = variant === 'podium'
  return (
    <li
      ref={cardRef}
      tabIndex={-1}
      className={`shop-card shop-card--${variant} ${podium ? `shop-card--rank${rank}` : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={e => {
        // Taps on links, buttons and the compare box do their own thing.
        if (!(e.target as HTMLElement).closest('a, button, input, label')) onSelect()
      }}>
      <div className="shop-card__top">
        <span className="shop-card__rank" aria-hidden>
          {podium ? PODIUM_LABEL[rank - 1] : rank}
        </span>
        <span className="shop-card__initial" aria-hidden>
          {shop.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="shop-card__title">
          <h3>
            <button type="button" className="shop-card__name" onClick={onSelect}>
              <span className="visually-hidden">
                Rank {rank} of {total}:{' '}
              </span>
              {shop.name}
            </button>
          </h3>
          <p className="meta">
            <span>{formatDistance(shop.km)} away</span>
            {open && <span className={shop.openNow ? 'shop-open' : undefined}>{open}</span>}
            <Rating value={shop.rating} count={shop.reviews} />
          </p>
        </div>
        <ScoreRing score={null} />
        <label className="shop-card__compare small">
          <input type="checkbox" checked={compared} onChange={onCompare} />
          Compare
          <span className="visually-hidden"> {shop.name}</span>
        </label>
      </div>

      {standout && <p className="shop-card__standout small">{standout}</p>}

      {(podium || selected) && <ShopActions shop={shop} kind={kind} you={you} />}
    </li>
  )
}

function ShopActions({
  shop,
  kind,
  you,
  compact,
}: {
  shop: ShopWithKm
  kind: NearbyKind
  you: Coords | null
  /** Shorter button label, for narrow columns. */
  compact?: boolean
}) {
  const tel = telUrl(shop.phone)
  return (
    <div className="shop-actions">
      <Link to={startFileUrl(shop, kind)} className="btn btn--primary btn--sm shop-actions__main">
        {compact ? 'Start a repair file' : 'Start a repair file with this shop'}
        {compact && <span className="visually-hidden"> with {shop.name}</span>}
      </Link>
      <div className="shop-actions__more">
        {tel && (
          <a className="btn btn--secondary btn--sm" href={tel}>
            <Phone size={16} aria-hidden /> Call<span className="visually-hidden"> {shop.name}</span>
          </a>
        )}
        <a className="btn btn--secondary btn--sm" href={shopDirectionsUrl(shop, you)} target="_blank" rel="noreferrer">
          <Route size={16} aria-hidden /> Directions<span className="visually-hidden"> to {shop.name}</span>
        </a>
      </div>
    </div>
  )
}

/** Proof Score ring. The real score and its breakdown come with lib/proof-score.ts. */
function ScoreRing({score}: {score: number | null}) {
  if (score == null) return null
  const r = 18
  const c = 2 * Math.PI * r
  return (
    <span className="score-ring" role="img" aria-label={`Proof Score ${score} out of 100`}>
      <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden>
        <circle cx="22" cy="22" r={r} className="score-ring__track" />
        <circle
          cx="22"
          cy="22"
          r={r}
          className="score-ring__arc"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="score-ring__value">{score}</span>
    </span>
  )
}

/**
 * One column per shop. Every value carries its own label, so nothing scrolls sideways
 * and phones can stack the shops. On wide screens the rows line up across columns (subgrid).
 */
function CompareTable({
  shops,
  ranks,
  kind,
  you,
}: {
  shops: ShopWithKm[]
  ranks: Map<string, number>
  kind: NearbyKind
  you: Coords | null
}) {
  const closest = Math.min(...shops.map(s => s.km))
  const rows: {label: string; cell: (s: ShopWithKm) => React.ReactNode}[] = [
    {
      label: 'Distance',
      cell: s => (
        <>
          {formatDistance(s.km)} away
          {s.km === closest && <span className="compare__flag">Closest</span>}
        </>
      ),
    },
    {
      label: 'Public rating',
      cell: s => (s.rating != null ? <Rating value={s.rating} count={s.reviews} /> : 'No ratings yet'),
    },
    {label: 'Open now', cell: s => openLabel(s.openNow) || 'Hours not listed'},
    {label: 'Hours today', cell: s => todaysHours(s.hours)?.replace(/^\w+:\s*/, '') || 'Not listed'},
    {label: 'Phone', cell: s => s.phone || 'Not listed'},
  ]
  return (
    <div className="compare" style={{['--cols' as string]: shops.length, ['--rows' as string]: rows.length + 2}}>
      {shops.map(s => (
        <section key={s.id} className="compare__shop" aria-label={s.name}>
          <h3 className="compare__name">
            {ranks.has(s.id) && <span className="compare__rank">Rank {ranks.get(s.id)}</span>}
            {s.name}
          </h3>
          {rows.map(row => (
            <div key={row.label} className="compare__cell">
              <span className="compare__label">{row.label}</span>
              <span className="compare__value">{row.cell(s)}</span>
            </div>
          ))}
          <ShopActions shop={s} kind={kind} you={you} compact />
        </section>
      ))}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div role="status" aria-label="Loading shops" className="stack" style={{gap: 'var(--space-4)'}}>
      <Skeleton height={280} radius="var(--radius-lg)" />
      <div className="podium">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} height={200} radius="var(--radius-md)" />
        ))}
      </div>
      <div className="stack" style={{gap: 'var(--space-2)'}}>
        {Array.from({length: BOARD_SIZE - 3}).map((_, i) => (
          <Skeleton key={i} height={72} radius="var(--radius-md)" />
        ))}
      </div>
    </div>
  )
}
