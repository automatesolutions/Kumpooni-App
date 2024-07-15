import { Service, ServicesWithVariant } from '#/types/automate'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartStoreItem extends Service {
  quantity: number
  variantName?: string
}

interface CartStore {
  items: CartStoreItem[]
  serviceIds: number[]
  setServiceIds: (ids: number[]) => void
  addItem: (data: CartStoreItem) => void
  removeItem: (id: number) => void
  clearItem: () => void
  bulkDeleteItem: (id: number[]) => void
  increaseServiceQtyInCart: (id: number) => void
  decreaseServiceQtyInCart: (id: number) => void
  updateServiceQtyIncart: (id: number, qty: number) => void
  removeItems: (ids: number[]) => void
}
export const useCartStore = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      serviceIds: [],
      setServiceIds: (servicesIds: number[]) => {
        set({
          serviceIds: [...servicesIds],
        })
      },
      addItem: newItem => {
        const carts = get().items
        set({ items: [...carts, newItem] })
      },
      removeItem: (id: number) => {
        const carts = get().items
        set({ items: carts.filter(cart => cart.id !== id) })
      },
      clearItem: () => {
        set({ items: [] })
      },
      bulkDeleteItem: id => {
        const currentItems = get().items
        const leftItem = currentItems.filter(item => !id.includes(item.id))

        set({
          items: leftItem,
        })
      },
      increaseServiceQtyInCart: serviceId => {
        set({
          items: increaseServiceQtyInCart(get().items, serviceId),
        })
      },
      decreaseServiceQtyInCart: serviceId => {
        set({
          items: decreaseServiceQtyInCart(get().items, serviceId),
        })
      },
      updateServiceQtyIncart: (serviceId, qty) => {
        set({
          items: updateServiceQtyIncart(get().items, serviceId, qty),
        })
      },
      removeItems: (ids: number[]) => {
        set({
          items: get().items.filter(cart => !ids.includes(cart.id)),
          serviceIds: [],
        })
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

function increaseServiceQtyInCart(
  servicesInCart: Array<CartStoreItem>,
  serviceId: number,
) {
  return updateServiceQuantity(servicesInCart, serviceId, 'increase')
}

function decreaseServiceQtyInCart(
  servicesInCart: Array<CartStoreItem>,
  serviceId: number,
) {
  return updateServiceQuantity(servicesInCart, serviceId, 'decrease')
}

function updateServiceQtyIncart(
  servicesInCart: Array<CartStoreItem>,
  serviceId: number,
  qty: number,
): CartStoreItem[] {
  return servicesInCart.map(servicesInCart => {
    if (servicesInCart.id === serviceId) {
      return {
        ...servicesInCart,
        quantity: qty,
      }
    }
    return servicesInCart
  })
}

function updateServiceQuantity(
  servicesInCart: Array<CartStoreItem>,
  serviceId: number,
  updateType: 'increase' | 'decrease',
  qty?: number,
) {
  return servicesInCart.map(servicesInCart => {
    if (servicesInCart.id === serviceId) {
      return {
        ...servicesInCart,
        quantity:
          updateType === 'increase'
            ? servicesInCart.quantity + 1
            : servicesInCart.quantity - 1,
      }
    }
    return servicesInCart
  })
}

export const useIsCarRequired = (carts: CartStoreItem[]) => {
  const carRequiredIndex = carts.findIndex(cart => cart.is_car_required)
  return carRequiredIndex !== -1
}
