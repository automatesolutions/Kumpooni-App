import React from 'react'
import {
  AlertTriangle,
  Building,
  ExternalLink,
  Eye,
  Globe,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Route,
  Search,
} from '@/components/icons'
import {Alert, Button} from '@/components/ui'
import {HAS_MAPS} from '@/lib/env'
import {geocodeText, type Coords} from '@/lib/geo'
import {
  directionsUrl,
  earthUrl,
  formatKm,
  loadGoogleMaps,
  mapsSearchUrl,
  nearestOffices,
  onMapsAuthFailure,
  type NearOffice,
} from '@/lib/maps'
import {errorMessage} from '@/lib/format'
import {loadLastLocation, saveLastLocation} from '@/state/queries/repair'
import {useUserId} from '@/state/session'
import {useLocationStore} from '@/stores/location'
import {toast} from '@/stores/ui'
import type {OfficeRow} from '@/types/repair-proof'

const FAR_KM = 50
const DTI_HOTLINE = '1-DTI (384)'

/** Compass heading from one point to another, so Street View faces the office. */
function bearing(from: Coords, to: Coords) {
  const rad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(rad(to.lng - from.lng)) * Math.cos(rad(to.lat))
  const x =
    Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) -
    Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lng - from.lng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

type LocateState = 'idle' | 'asking' | 'ready' | 'denied'

/**
 * Finds where the person is, picks the nearest office, and shows both on a satellite map.
 * Without a Google Maps key it shows the same pick with Google Earth and Google Maps links.
 */
export function OfficeMap({
  offices,
  selectedId,
  onSelect,
  onUse,
  useLabel = 'Use this office in my letter',
  compact,
  autoLocate = true,
  onLocation,
}: {
  offices: OfficeRow[]
  selectedId: number | null
  onSelect: (id: number) => void
  onUse?: (office: OfficeRow) => void
  useLabel?: string
  compact?: boolean
  /** False: use a saved point if there is one, and wait for a tap before asking the browser. */
  autoLocate?: boolean
  onLocation?: (coords: Coords | null) => void
}) {
  const userId = useUserId()
  const {location, locate, setLocation} = useLocationStore()
  const [state, setState] = React.useState<LocateState>(location ? 'ready' : 'idle')
  const [locateError, setLocateError] = React.useState('')

  const ask = React.useCallback(async () => {
    setState('asking')
    setLocateError('')
    try {
      await locate()
      setState('ready')
      const coords = useLocationStore.getState().location
      if (userId && coords) saveLastLocation(userId, coords).catch(() => undefined)
    } catch (e) {
      setLocateError(errorMessage(e))
      setState('denied')
    }
  }, [locate, userId])

  // Location is automatic: saved point first, then the browser asks once.
  React.useEffect(() => {
    if (location) return
    let cancelled = false
    ;(async () => {
      const saved = userId ? await loadLastLocation(userId).catch(() => null) : null
      if (cancelled) return
      if (saved) {
        setLocation(saved, {formatted_address: 'Saved location', main_text: 'Saved location', secondary_text: ''})
        setState('ready')
      } else if (autoLocate) {
        ask()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    onLocation?.(location)
  }, [location, onLocation])

  const near = React.useMemo(() => nearestOffices(offices, location), [offices, location])
  const selected = near.find(o => o.id === selectedId) ?? null

  // Re-pick the nearest office whenever the location changes, e.g. Manila default → allowed GPS.
  const locKey = location ? `${location.lat},${location.lng}` : ''
  const lastLocKey = React.useRef(locKey)
  React.useEffect(() => {
    if (!near.length) return
    const moved = lastLocKey.current !== locKey
    lastLocKey.current = locKey
    if (selectedId == null || moved || !near.some(o => o.id === selectedId)) onSelect(near[0].id)
  }, [near, selectedId, locKey, onSelect])

  const [mapFailed, setMapFailed] = React.useState(!HAS_MAPS)
  React.useEffect(() => onMapsAuthFailure(() => setMapFailed(true)), [])

  const list = location ? near.slice(0, 3) : near
  const showList = list.filter(o => o.id !== selected?.id)

  if (!autoLocate && state === 'idle' && !location) {
    return (
      <div className="office-map">
        <Button variant="secondary" block onClick={ask}>
          <LocateFixed size={18} aria-hidden /> Find the nearest DTI office
        </Button>
        <p className="small muted">We use your location once to pick the office. You can type your city instead.</p>
      </div>
    )
  }

  return (
    <div className={`office-map ${compact ? 'office-map--compact' : ''}`}>
      {state === 'asking' && (
        <p className="note row" role="status">
          <LocateFixed size={18} aria-hidden /> Finding where you are…
        </p>
      )}
      {state === 'denied' && <PlaceFallback error={locateError} onRetry={ask} onPlace={c => {
        setLocation(c.coords, {formatted_address: c.label, main_text: c.label.split(',')[0], secondary_text: ''})
        setState('ready')
        if (userId) saveLastLocation(userId, c.coords).catch(() => undefined)
      }} />}

      {!mapFailed && selected ? (
        <EarthMap
          offices={near}
          selected={selected}
          you={location}
          compact={compact}
          onSelect={onSelect}
          onFail={() => setMapFailed(true)}
          onPinYou={c => {
            setLocation(c, {formatted_address: 'Pin you dropped', main_text: 'Pin you dropped', secondary_text: ''})
            setState('ready')
            if (userId) saveLastLocation(userId, c).catch(() => undefined)
          }}
        />
      ) : null}

      {selected && (
        <OfficeCard
          office={selected}
          you={location}
          mapFailed={mapFailed}
          onUse={onUse}
          useLabel={useLabel}
        />
      )}

      {showList.length > 0 && (
        <div className="stack" style={{gap: 'var(--space-2)'}}>
          <h3 className="small muted" style={{fontFamily: 'var(--font-body)', fontWeight: 600}}>
            {location ? 'Other offices near you' : 'All DTI regional offices'}
          </h3>
          <ul className="office-list">
            {showList.map(o => (
              <li key={o.id}>
                <button type="button" onClick={() => onSelect(o.id)}>
                  <MapPin size={18} aria-hidden />
                  <span>
                    <span className="strong">{o.name}</span>
                    <small>{[o.city, formatKm(o.km)].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {location && state === 'ready' && (
        <button type="button" className="link small" style={{minHeight: 'var(--tap)', alignSelf: 'flex-start'}} onClick={ask}>
          Use my location again
        </button>
      )}
    </div>
  )
}

function PlaceFallback({
  error,
  onRetry,
  onPlace,
}: {
  error: string
  onRetry: () => void
  onPlace: (p: {coords: Coords; label: string}) => void
}) {
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
      if (hit) onPlace(hit)
      else setNotFound(`We couldn't find “${text}”. Try your city and province.`)
    } catch (err) {
      setNotFound(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card--pad stack" style={{gap: 'var(--space-3)'}}>
      <Alert>{error || "We couldn't get your location."} We're showing the Manila office for now.</Alert>
      <form className="row" onSubmit={find} style={{flexWrap: 'wrap'}}>
        <label htmlFor={id} className="visually-hidden">
          Your city or barangay
        </label>
        <div className="search" style={{flex: '1 1 220px'}}>
          <Search size={20} aria-hidden />
          <input
            id={id}
            className="input"
            placeholder="Your city, for example Quezon City"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" loading={busy} disabled={text.trim().length < 2}>
          Find offices
        </Button>
      </form>
      {notFound && <p className="error-text">{notFound}</p>}
      <p className="small muted">
        Or{' '}
        <button type="button" className="link" onClick={onRetry}>
          try my location again
        </button>
        {HAS_MAPS ? ', or tap the map where you are.' : '.'}
      </p>
    </div>
  )
}

function OfficeCard({
  office,
  you,
  mapFailed,
  onUse,
  useLabel,
}: {
  office: NearOffice
  you: Coords | null
  mapFailed: boolean
  onUse?: (office: OfficeRow) => void
  useLabel: string
}) {
  const far = Number.isFinite(office.km) && office.km > FAR_KM
  return (
    <article className="card card--pad office-card" aria-label={`Selected office: ${office.name}`}>
      <div className="row" style={{alignItems: 'flex-start'}}>
        <span className="office-card__icon" aria-hidden>
          <Building size={22} />
        </span>
        <div style={{minWidth: 0, flex: 1}}>
          <h3>{office.name}</h3>
          <p className="small" style={{color: 'var(--ink-2)'}}>{office.address}</p>
          <p className="meta" style={{marginTop: 'var(--space-1)'}}>
            {Number.isFinite(office.km) && <span>{formatKm(office.km)}</span>}
            {office.hours && <span>{office.hours}</span>}
          </p>
        </div>
      </div>
      <ul className="office-card__contact">
        <li>
          <Phone size={16} aria-hidden />
          {office.phone ? <a href={`tel:${office.phone.replace(/[^\d+]/g, '')}`}>{office.phone}</a> : null}
          {office.phone ? ' or ' : ''}
          <a href="tel:384">DTI hotline {DTI_HOTLINE}</a>
        </li>
        {office.email && (
          <li>
            <Mail size={16} aria-hidden />
            <a href={`mailto:${office.email}`}>{office.email}</a>
          </li>
        )}
      </ul>
      {office.pin_accuracy !== 'building' && (
        <p className="note row" style={{alignItems: 'flex-start'}}>
          <AlertTriangle size={16} aria-hidden style={{flexShrink: 0, marginTop: 2}} />
          The pin is near this office, not on the door. Follow the street address.
        </p>
      )}
      {far && <p className="note">This office is {formatKm(office.km).replace(' away', '')} from you. Call first. Confirm they handle your city.</p>}
      <div className="office-card__actions">
        {onUse && (
          <Button onClick={() => onUse(office)}>
            <Building size={18} aria-hidden /> {useLabel}
          </Button>
        )}
        <a className="btn btn--secondary" href={directionsUrl(office, you)} target="_blank" rel="noreferrer">
          <Route size={18} aria-hidden /> Get directions
        </a>
        {mapFailed && (
          <>
            <a className="btn btn--secondary" href={earthUrl(office)} target="_blank" rel="noreferrer">
              <Globe size={18} aria-hidden /> See it on Google Earth
            </a>
            <a className="btn btn--ghost" href={mapsSearchUrl(office)} target="_blank" rel="noreferrer">
              <ExternalLink size={18} aria-hidden /> Open in Google Maps
            </a>
          </>
        )}
      </div>
    </article>
  )
}

/** Google satellite map with labels, tilted where Google has 45-degree imagery. */
function EarthMap({
  offices,
  selected,
  you,
  compact,
  onSelect,
  onFail,
  onPinYou,
}: {
  offices: NearOffice[]
  selected: NearOffice
  you: Coords | null
  compact?: boolean
  onSelect: (id: number) => void
  onFail: () => void
  onPinYou: (c: Coords) => void
}) {
  const el = React.useRef<HTMLDivElement>(null)
  const map = React.useRef<google.maps.Map | null>(null)
  const markers = React.useRef<google.maps.Marker[]>([])
  const route = React.useRef<google.maps.DirectionsRenderer | null>(null)
  const line = React.useRef<google.maps.Polyline | null>(null)
  const [ready, setReady] = React.useState(false)
  const [mode, setMode] = React.useState<'DRIVING' | 'WALKING'>('DRIVING')
  const [trip, setTrip] = React.useState<string>('')
  const [routing, setRouting] = React.useState(false)
  const handlers = React.useRef({onSelect, onPinYou, you})
  handlers.current = {onSelect, onPinYou, you}

  React.useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then(async () => {
        const [{Map}] = await Promise.all([
          google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
          google.maps.importLibrary('marker'),
          google.maps.importLibrary('routes'),
          google.maps.importLibrary('streetView'),
        ])
        if (cancelled || !el.current) return
        map.current = new Map(el.current, {
          center: {lat: selected.lat, lng: selected.lng},
          zoom: 18,
          mapTypeId: 'hybrid',
          tilt: 45,
          heading: 0,
          rotateControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {mapTypeIds: ['hybrid', 'roadmap']},
          gestureHandling: 'cooperative',
          clickableIcons: false,
        })
        map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!handlers.current.you && e.latLng) handlers.current.onPinYou({lat: e.latLng.lat(), lng: e.latLng.lng()})
        })
        setReady(true)
      })
      .catch(() => !cancelled && onFail())
    return () => {
      cancelled = true
    }
  }, [])

  // Pins: you, the selected office, and smaller pins for the rest nearby.
  React.useEffect(() => {
    if (!ready || !map.current) return
    markers.current.forEach(m => m.setMap(null))
    markers.current = []
    const shown = you ? offices.slice(0, 4) : offices
    for (const o of shown) {
      const isSel = o.id === selected.id
      const m = new google.maps.Marker({
        map: map.current,
        position: {lat: o.lat, lng: o.lng},
        title: o.name,
        zIndex: isSel ? 10 : 1,
        label: isSel ? {text: 'DTI', color: '#ffffff', fontWeight: '700', fontSize: '11px'} : undefined,
        icon: isSel
          ? undefined
          : {path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#b61616', fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2},
      })
      m.addListener('click', () => handlers.current.onSelect(o.id))
      markers.current.push(m)
    }
    if (you) {
      markers.current.push(
        new google.maps.Marker({
          map: map.current,
          position: you,
          title: 'You',
          zIndex: 20,
          icon: {path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#1d5fbf', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3},
        }),
      )
    }
  }, [ready, offices, selected.id, you])

  // View: both pins in frame, or the office up close.
  React.useEffect(() => {
    if (!ready || !map.current) return
    route.current?.setMap(null)
    line.current?.setMap(null)
    setTrip('')
    const office = {lat: selected.lat, lng: selected.lng}
    if (you && selected.km < 60) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(office)
      bounds.extend(you)
      map.current.fitBounds(bounds, 64)
    } else {
      map.current.setCenter(office)
      map.current.setZoom(selected.pin_accuracy === 'building' ? 19 : 17)
    }
  }, [ready, selected.id, selected.lat, selected.lng, selected.km, selected.pin_accuracy, you])

  const showRoute = async () => {
    if (!map.current || !you) return
    setRouting(true)
    route.current?.setMap(null)
    line.current?.setMap(null)
    try {
      const res = await new google.maps.DirectionsService().route({
        origin: you,
        destination: {lat: selected.lat, lng: selected.lng},
        travelMode: google.maps.TravelMode[mode],
        region: 'PH',
      })
      route.current = new google.maps.DirectionsRenderer({
        map: map.current,
        directions: res,
        suppressMarkers: true,
        polylineOptions: {strokeColor: '#ff6b6b', strokeWeight: 6, strokeOpacity: 0.95},
      })
      const leg = res.routes[0]?.legs[0]
      setTrip(leg ? `${leg.distance?.text ?? ''} · about ${leg.duration?.text ?? ''} ${mode === 'WALKING' ? 'walking' : 'by car'}` : '')
    } catch {
      // Directions may be off for this key. Draw a straight line and keep the Google Maps link.
      line.current = new google.maps.Polyline({
        map: map.current,
        path: [you, {lat: selected.lat, lng: selected.lng}],
        strokeColor: '#ff6b6b',
        strokeWeight: 4,
        strokeOpacity: 0.9,
        geodesic: true,
      })
      setTrip(`${formatKm(selected.km).replace(' away', '')} in a straight line. Use “Get directions” for the road route.`)
    } finally {
      setRouting(false)
    }
  }

  const lookAround = async () => {
    if (!map.current) return
    try {
      const {data} = await new google.maps.StreetViewService().getPanorama({
        location: {lat: selected.lat, lng: selected.lng},
        radius: 120,
        source: google.maps.StreetViewSource.OUTDOOR,
      })
      const at = data.location!.latLng!
      const pano = map.current.getStreetView()
      pano.setPosition(at)
      pano.setPov({heading: bearing({lat: at.lat(), lng: at.lng()}, selected), pitch: 5})
      pano.setVisible(true)
    } catch {
      toast('No street photos near this office yet.', 'info')
    }
  }

  return (
    <div className="earth">
      <div
        ref={el}
        className={`earth__map ${compact ? 'earth__map--compact' : ''}`}
        role="region"
        aria-label={`Satellite map showing ${you ? 'you and ' : ''}${selected.name}`}
      />
      {!ready && <div className="earth__loading skel" aria-hidden />}
      {ready && (
        <div className="earth__bar">
          {you ? (
            <>
              <div className="segmented" role="group" aria-label="Travel mode">
                <button type="button" aria-pressed={mode === 'DRIVING'} onClick={() => setMode('DRIVING')}>
                  Drive
                </button>
                <button type="button" aria-pressed={mode === 'WALKING'} onClick={() => setMode('WALKING')}>
                  Walk
                </button>
              </div>
              <Button size="sm" variant="secondary" onClick={showRoute} loading={routing}>
                <Route size={16} aria-hidden /> Show the path
              </Button>
            </>
          ) : (
            <span className="small muted">Tap the map where you are to see the path.</span>
          )}
          <Button size="sm" variant="ghost" onClick={lookAround}>
            <Eye size={16} aria-hidden /> Look around
          </Button>
        </div>
      )}
      {trip && (
        <p className="small" role="status" style={{color: 'var(--ink-2)'}}>
          {trip}
        </p>
      )}
    </div>
  )
}
