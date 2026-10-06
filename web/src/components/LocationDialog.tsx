import React from 'react'
import {LocateFixed, MapPin, Search} from '@/components/icons'
import {Alert, Button, Dialog} from './ui'
import {useUiStore} from '@/stores/ui'
import {useLocationStore} from '@/stores/location'
import {HAS_MAPS} from '@/lib/env'
import {autocompleteAddress, getPlaceLocation, type PlaceSuggestion} from '@/lib/geo'
import {errorMessage} from '@/lib/format'
import {toast} from '@/stores/ui'

export function LocationDialog() {
  const open = useUiStore(s => s.locationOpen)
  const close = useUiStore(s => s.closeLocation)
  const {address, locate, isLocating, setLocation} = useLocationStore()

  const [query, setQuery] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setSuggestions([])
      setError('')
    }
  }, [open])

  React.useEffect(() => {
    if (!HAS_MAPS || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    setSearching(true)
    const timer = window.setTimeout(() => {
      autocompleteAddress(query)
        .then(setSuggestions)
        .catch(e => setError(errorMessage(e)))
        .finally(() => setSearching(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const onUseMyLocation = async () => {
    setError('')
    try {
      await locate()
      toast('Location updated.')
      close()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const onPick = async (s: PlaceSuggestion) => {
    setError('')
    try {
      const {coords, formatted} = await getPlaceLocation(s.placeId)
      setLocation(coords, {
        formatted_address: formatted || `${s.mainText}, ${s.secondaryText}`,
        main_text: s.mainText,
        secondary_text: s.secondaryText,
      })
      toast('Location updated.')
      close()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Dialog open={open} onClose={close} title="Where is your car?">
      <p className="muted small">We use this to show shops near you and how far they are.</p>

      <Button variant="secondary" block onClick={onUseMyLocation} loading={isLocating}>
        {!isLocating && <LocateFixed size={18} aria-hidden />}
        Use my current location
      </Button>

      {HAS_MAPS && (
        <>
          <div className="row" aria-hidden>
            <hr className="divider" style={{flex: 1, margin: 0}} />
            <span className="muted xsmall">or</span>
            <hr className="divider" style={{flex: 1, margin: 0}} />
          </div>
          <div className="field">
            <label className="label" htmlFor="address-search">
              Search for an address
            </label>
            <div className="search">
              <Search size={18} aria-hidden />
              <input
                id="address-search"
                className="input"
                type="search"
                placeholder="Street, barangay or city"
                autoComplete="off"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-controls="address-results"
              />
            </div>
          </div>
          <ul id="address-results" className="menu card" aria-live="polite" hidden={!suggestions.length}>
            {suggestions.map(s => (
              <li key={s.placeId}>
                <button type="button" onClick={() => onPick(s)}>
                  <MapPin size={18} aria-hidden className="muted" />
                  <span>
                    {s.mainText}
                    <small>{s.secondaryText}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {searching && !suggestions.length && <p className="muted small">Searching…</p>}
          {!searching && query.trim().length >= 3 && !suggestions.length && (
            <p className="muted small">No matches. Try a street or city name.</p>
          )}
        </>
      )}

      {error && <Alert>{error}</Alert>}

      {address && (
        <p className="small muted">
          Current: <span className="strong" style={{color: 'var(--ink)'}}>{address.formatted_address}</span>
        </p>
      )}
    </Dialog>
  )
}
