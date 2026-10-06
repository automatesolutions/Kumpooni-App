import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {
  type Address,
  type Coords,
  getBrowserPosition,
  haversine,
  reverseGeocode,
} from '@/lib/geo'

type LocationState = {
  location: Coords | null
  address: Address | null
  isLocating: boolean
  setLocation: (location: Coords, address: Address) => void
  /** Asks the browser for the position. Throws a readable error on failure. */
  locate: () => Promise<void>
  clear: () => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      address: null,
      isLocating: false,
      setLocation: (location, address) => set({location, address}),
      locate: async () => {
        set({isLocating: true})
        try {
          const coords = await getBrowserPosition()
          const last = get().location
          // Skip the geocoding call when the person has barely moved.
          if (
            last &&
            get().address &&
            haversine([coords.lat, coords.lng], [last.lat, last.lng]) <= 0.2
          ) {
            return
          }
          const address = (await reverseGeocode(coords).catch(() => null)) ?? {
            formatted_address: 'Current location',
            main_text: 'Current location',
            secondary_text: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          }
          set({location: coords, address})
        } finally {
          set({isLocating: false})
        }
      },
      clear: () => set({location: null, address: null}),
    }),
    {
      name: 'kumpooni-location',
      partialize: s => ({location: s.location, address: s.address}),
    },
  ),
)
