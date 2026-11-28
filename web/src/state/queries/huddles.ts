// Calls going on in a shop (supabase/11-business-huddles.sql). The call itself is in src/lib/huddle.ts.
import React from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {supabase} from '@/lib/supabase'
import type {ShopHuddle} from '@/types/business'

const key = (orgId: string) => ['huddles', orgId] as const

/** Live calls in the shop, refreshed when someone joins or leaves, and every 20 seconds. */
export function useShopHuddlesQuery(orgId: string) {
  const qc = useQueryClient()
  // Several screens use this at once. Each needs its own Realtime topic, because joining the
  // same topic twice closes the first one.
  const id = React.useId()
  React.useEffect(() => {
    if (!orgId) return
    const channel = supabase
      .channel(`shop-huddles:${orgId}:${id}`)
      .on(
        'postgres_changes',
        {event: '*', schema: 'public', table: 'huddle_people', filter: `org_id=eq.${orgId}`},
        () => qc.invalidateQueries({queryKey: key(orgId)}),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [orgId, qc, id])
  return useQuery({
    queryKey: key(orgId),
    enabled: !!orgId,
    refetchInterval: 20_000,
    queryFn: async (): Promise<ShopHuddle[]> => {
      const {data, error} = await supabase.rpc('shop_huddles', {org: orgId})
      if (error) throw error
      return data ?? []
    },
  })
}
