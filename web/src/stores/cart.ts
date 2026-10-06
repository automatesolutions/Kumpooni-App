import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import type {CartItem} from '@/types/app'

/** Services the person picked from the catalogue, before choosing a shop. */
type CartState = {
  items: CartItem[]
  /** Catalogue service ids sent to the quotes screen. */
  serviceIds: number[]
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  removeItems: (ids: number[]) => void
  setQuantity: (id: number, quantity: number) => void
  setServiceIds: (ids: number[]) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serviceIds: [],
      addItem: item => {
        const rest = get().items.filter(i => i.id !== item.id)
        set({items: [...rest, item]})
      },
      removeItem: id => set({items: get().items.filter(i => i.id !== id)}),
      removeItems: ids =>
        set({items: get().items.filter(i => !ids.includes(i.id)), serviceIds: []}),
      setQuantity: (id, quantity) =>
        set({items: get().items.map(i => (i.id === id ? {...i, quantity} : i))}),
      setServiceIds: serviceIds => set({serviceIds}),
      clear: () => set({items: [], serviceIds: []}),
    }),
    {name: 'kumpooni-cart'},
  ),
)

export const isCarRequired = (items: CartItem[]) => items.some(i => i.is_car_required)
