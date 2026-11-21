import {useQuery} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {Coords} from '@/lib/geo'
import {type NearbyKind, type NearbyResponse, gridCell, nearbyCacheKey, radiusBucket} from '@/lib/nearby'

/**
 * Shops near a point, from the nearby-shops Edge Function.
 *
 * The query key is the same cache key the function uses. Moving the slider inside one
 * radius bucket, or moving a little inside one grid cell, reuses the same answer, and the
 * page filters it by the exact radius. Crossing into another bucket or cell asks again.
 * Answers are kept for this visit only, so going back to a category doesn't search again.
 */
export function useNearbyShopsQuery(kind: NearbyKind, coords: Coords | null, radiusKm: number) {
  const key = coords ? nearbyCacheKey(kind, coords.lat, coords.lng, radiusKm) : null
  return useQuery({
    queryKey: ['nearby-shops', key],
    enabled: !!coords,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
    // Crossing into a bigger radius keeps the current board up while the wider search loads.
    // Switching category does not: that board should never show another category's shops.
    placeholderData: prev => (prev && prev.cacheKey.split(':')[0] === kind ? prev : undefined),
    queryFn: async () => {
      // Privacy: only the centre of the ~2 km grid cell leaves the browser, never the exact point.
      // The function only needs the cell, and distances are measured here from the real point.
      const {center} = gridCell(coords!.lat, coords!.lng)
      const {data, error} = await supabase.functions.invoke('nearby-shops', {
        body: {kind, lat: center.lat, lng: center.lng, radius_km: radiusBucket(radiusKm)},
      })
      if (error) {
        const ctx = (error as {context?: Response}).context
        let code = ctx?.status === 404 ? 'not_deployed' : 'failed'
        try {
          code = ((await ctx?.json()) as {error?: string} | undefined)?.error ?? code
        } catch {
          // Not JSON. Keep the code from the status.
        }
        throw Object.assign(new Error(nearbyErrorMessage(code)), {code})
      }
      return data as NearbyResponse
    },
  })
}

export function nearbyErrorMessage(code: string) {
  switch (code) {
    case 'not_deployed':
      return "Shop search isn't set up yet. Deploy the nearby-shops function, then try again."
    case 'outside_ph':
      return 'Shop search covers the Philippines only. Choose a town in the Philippines.'
    case 'bad_kind':
    case 'bad_radius':
      return "We couldn't read that search. Pick a category and a distance, then try again."
    default:
      return "We couldn't load shops right now. Check your connection, then try again."
  }
}
