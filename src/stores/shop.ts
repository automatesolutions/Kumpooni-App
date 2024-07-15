import { NearbyStores, Store } from '#/types/automate'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ShopStore {
  shop: NearbyStores | null
  setShop: (shop: NearbyStores) => void
}
export const useShopStore = create(
  persist<ShopStore>(
    (set, get) => ({
      shop: null,
      setShop: (shop: NearbyStores) => set({ shop }),
    }),
    {
      name: 'shop-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
