import {create} from 'zustand'
import {persist} from 'zustand/middleware'

/** Which of the person's cars bookings use by default. */
type VehicleState = {
  selectedId: string | null
  select: (id: string | null) => void
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    set => ({
      selectedId: null,
      select: selectedId => set({selectedId}),
    }),
    {name: 'kumpooni-vehicle'},
  ),
)
