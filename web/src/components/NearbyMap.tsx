import React from 'react'
import {HAS_MAPS} from '@/lib/env'
import type {Coords} from '@/lib/geo'
import {loadGoogleMaps, onMapsAuthFailure} from '@/lib/maps'
import type {ShopWithKm} from '@/lib/nearby'

/** Reads a colour token, so the pins follow tokens.css (and dark mode) instead of hard-coded hex. */
function token(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/**
 * The map strip on /nearby: you, a ring for the radius, and numbered pins 1 to 10.
 * Tapping a pin selects its card. Selecting a card pans here to its pin.
 * Without a key, or when Google fails, it says so and the list below keeps working.
 */
export function NearbyMap({
  you,
  radiusKm,
  shops,
  selectedId,
  onSelect,
}: {
  you: Coords
  radiusKm: number
  shops: ShopWithKm[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const el = React.useRef<HTMLDivElement>(null)
  const map = React.useRef<google.maps.Map | null>(null)
  const pins = React.useRef(new Map<string, google.maps.Marker>())
  const extras = React.useRef<{ring?: google.maps.Circle; you?: google.maps.Marker}>({})
  const [ready, setReady] = React.useState(false)
  const [failed, setFailed] = React.useState<'no_key' | 'failed' | null>(HAS_MAPS ? null : 'no_key')
  const select = React.useRef(onSelect)
  select.current = onSelect

  React.useEffect(() => onMapsAuthFailure(() => setFailed('failed')), [])

  React.useEffect(() => {
    if (!HAS_MAPS) return
    let cancelled = false
    loadGoogleMaps()
      .then(async () => {
        const {Map} = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary
        if (cancelled || !el.current) return
        map.current = new Map(el.current, {
          center: you,
          zoom: 13,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        })
        setReady(true)
      })
      .catch(() => !cancelled && setFailed('failed'))
    return () => {
      cancelled = true
    }
  }, [])

  // You, and the ring for the radius. Fit the ring when either changes.
  React.useEffect(() => {
    if (!ready || !map.current) return
    const brand = token('--brand', '#b61616')
    const info = token('--info', '#1d5fbf')
    const surface = token('--surface', '#ffffff')
    extras.current.ring?.setMap(null)
    extras.current.you?.setMap(null)
    extras.current.ring = new google.maps.Circle({
      map: map.current,
      center: you,
      radius: radiusKm * 1000,
      strokeColor: brand,
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: brand,
      fillOpacity: 0.04,
      clickable: false,
    })
    extras.current.you = new google.maps.Marker({
      map: map.current,
      position: you,
      title: 'You',
      zIndex: 5,
      icon: {path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: info, fillOpacity: 1, strokeColor: surface, strokeWeight: 3},
    })
    const bounds = extras.current.ring.getBounds()
    if (bounds) map.current.fitBounds(bounds, 16)
  }, [ready, you.lat, you.lng, radiusKm])

  // Numbered pins, in rank order. The selected one is larger and on top.
  React.useEffect(() => {
    if (!ready || !map.current) return
    const ink = token('--ink', '#1a1714')
    const brand = token('--brand', '#b61616')
    const surface = token('--surface', '#ffffff')
    const onBrand = token('--on-brand', '#ffffff')
    pins.current.forEach(m => m.setMap(null))
    pins.current.clear()
    shops.forEach((s, i) => {
      const isSel = s.id === selectedId
      const m = new google.maps.Marker({
        map: map.current,
        position: {lat: s.lat, lng: s.lng},
        title: `Rank ${i + 1}: ${s.name}`,
        zIndex: isSel ? 100 : 50 - i,
        label: {text: String(i + 1), color: isSel ? onBrand : surface, fontWeight: '700', fontSize: isSel ? '13px' : '12px'},
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSel ? 15 : 12,
          fillColor: isSel ? brand : ink,
          fillOpacity: 1,
          strokeColor: surface,
          strokeWeight: 2,
        },
      })
      m.addListener('click', () => select.current(s.id))
      pins.current.set(s.id, m)
    })
  }, [ready, shops, selectedId])

  // Selecting a card pans to its pin.
  React.useEffect(() => {
    if (!ready || !map.current || !selectedId) return
    const shop = shops.find(s => s.id === selectedId)
    if (!shop) return
    map.current.panTo({lat: shop.lat, lng: shop.lng})
    if ((map.current.getZoom() ?? 0) < 13) map.current.setZoom(14)
  }, [ready, selectedId])

  if (failed) {
    return (
      <div className="nearby-map nearby-map--off" role="note">
        <p className="small">
          {failed === 'no_key'
            ? "The map isn't set up on this site yet. The list below still works."
            : "The map didn't load. The list below still works."}
        </p>
      </div>
    )
  }

  return (
    <div className="nearby-map">
      <div ref={el} className="nearby-map__canvas" aria-label="Map of the shops below" role="region" />
      {!ready && <div className="skel nearby-map__loading" aria-hidden />}
    </div>
  )
}
