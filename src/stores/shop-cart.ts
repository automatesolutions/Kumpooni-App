import { Service } from '#/types/automate'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartItems extends Service {
  quantity: number
  variantName?: string
}

interface ShopCartStore {
  carts: CartItems[]
  shopId: string | null
  addItem: (data: CartItems) => void
  addBulkItems: (data: CartItems[]) => void
  removeItem: (id: number) => void
  clearCart: () => void
}
export const useShopCartStore = create(
  persist<ShopCartStore>(
    (set, get) => ({
      carts: [],
      shopId: null,
      addItem: item => {
        const shopId = get().shopId
        if (shopId !== item.store_id) {
          set({ carts: [item], shopId: item.store_id })
          return
        }
        set({ carts: [...get().carts, item] })
      },
      addBulkItems: item => {
        set({ carts: item })
      },
      removeItem: (id: number) => {
        const carts = get().carts
        set({ carts: carts.filter(cart => cart.id !== id) })
      },
      clearCart: () => {
        set({ carts: [] })
      },
    }),
    {
      name: 'shop-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
