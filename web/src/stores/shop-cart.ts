import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import type {CartItem} from '@/types/app'

/** Services priced by one shop. This is what checkout books. */
type ShopCartState = {
  items: CartItem[]
  shopId: string | null
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  setItems: (shopId: string, items: CartItem[]) => void
  clear: () => void
}

export const useShopCartStore = create<ShopCartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopId: null,
      addItem: item => {
        // A booking is for one shop, so adding from another shop starts over.
        if (get().shopId !== item.store_id) {
          set({items: [item], shopId: item.store_id})
          return
        }
        set({items: [...get().items.filter(i => i.id !== item.id), item]})
      },
      removeItem: id => set({items: get().items.filter(i => i.id !== id)}),
      setItems: (shopId, items) => set({shopId, items}),
      clear: () => set({items: [], shopId: null}),
    }),
    {name: 'kumpooni-shop-cart'},
  ),
)
