import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Brand = {
  id: number
  name: string
  img_url: string | null
}
export type Model = {
  id: number
  name: string
}
export type Vehicle = {
  id: string
  brand: Brand
  model: Model
  year_model: string | null
  plate_no: string | null
}

interface VehicleStore {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  setSelectedVehicle: (vehicle: Vehicle) => void
  setVehicles: (vehicles: Vehicle[]) => void
  editVehicle: (vehicle: Vehicle) => void
  addVehicle: (vehicle: Vehicle) => void
  clearVehicles: () => void
  clearSelected: () => void
  deleteVehicle: (id: string) => void
}
export const useVehicleStore = create(
  persist<VehicleStore>(
    (set, get) => ({
      vehicles: [],
      setVehicles: (vehicles: Vehicle[]) => {
        set(() => ({ vehicles: vehicles }))
      },
      selectedVehicle: null,
      setSelectedVehicle: vehicle => {
        set({ selectedVehicle: vehicle })
      },
      addVehicle: (vehicle: Vehicle) => {
        set({ vehicles: [...get().vehicles, vehicle] })
      },
      editVehicle: (vehicle: Vehicle) => {
        // const newVehicleArray = get().vehicles.map(old => {
        //   if (old.id === vehicle.id) {
        //     return vehicle; // Replace the old vehicle with the updated one
        //   }
        //   return vehicle; // Keep the other vehicles unchanged
        // });
        // set({vehicles: newVehicleArray});
        const index = get().vehicles.findIndex(v => v.id === vehicle.id)
        if (index !== -1) {
          const updatedVehicles = [...get().vehicles]
          updatedVehicles[index] = vehicle
          set({ vehicles: updatedVehicles })
        }
      },
      clearVehicles: () => set({ vehicles: [], selectedVehicle: null }),
      clearSelected: () => set({ selectedVehicle: null }),
      deleteVehicle: (id: string) => {
        const selectedVehicle = get().selectedVehicle

        if (selectedVehicle?.id === id) {
          set({
            vehicles: [...get().vehicles.filter(vehicle => vehicle.id !== id)],
            selectedVehicle: null,
          })
          return
        }
        set({
          vehicles: [...get().vehicles.filter(vehicle => vehicle.id !== id)],
        })
      },
    }),
    {
      name: 'vehicle-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
