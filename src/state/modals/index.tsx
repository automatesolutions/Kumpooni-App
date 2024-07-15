import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback'
import { CartStoreItem } from '#/stores/cart'
import { ServicesWithVariant, ServicesVariant, Service } from '#/types/automate'
import { Json } from '#/types/supabase'
import React from 'react'

export interface WaitlistModal {
  name: 'waitlist'
}
export interface ConfirmModal {
  name: 'confirm'
}
export interface ShopFiltersModal {
  name: 'shop-filters'
  onPress: (filter: string) => void
}

export interface ServiceVariation {
  name: 'service-variation'
  service: Service
  label: string
  serviceVariant: Service[]
  category: string
  addItem: (item: CartStoreItem) => void
}
export type Modal =
  | WaitlistModal
  | ConfirmModal
  | ServiceVariation
  | ShopFiltersModal
const ModalContext = React.createContext<{
  isModalActive: boolean
  activeModals: Modal[]
}>({
  isModalActive: false,
  activeModals: [],
})

const ModalControlContext = React.createContext<{
  openModal: (modal: Modal) => void
  closeModal: () => boolean
  closeAllModals: () => void
}>({
  openModal: () => {},
  closeModal: () => false,
  closeAllModals: () => {},
})

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const [activeModals, setActiveModals] = React.useState<Modal[]>([])

  const openModal = useNonReactiveCallback((modal: Modal) => {
    setActiveModals(modals => [...modals, modal])
  })

  const closeModal = useNonReactiveCallback(() => {
    let wasActive = activeModals.length > 0
    setActiveModals(modals => {
      return modals.slice(0, -1)
    })
    return wasActive
  })

  const closeAllModals = useNonReactiveCallback(() => {
    setActiveModals([])
  })

  const state = React.useMemo(
    () => ({
      isModalActive: activeModals.length > 0,
      activeModals,
    }),
    [activeModals],
  )

  const methods = React.useMemo(
    () => ({
      openModal,
      closeModal,
      closeAllModals,
    }),
    [openModal, closeModal, closeAllModals],
  )

  return (
    <ModalContext.Provider value={state}>
      <ModalControlContext.Provider value={methods}>
        {children}
      </ModalControlContext.Provider>
    </ModalContext.Provider>
  )
}

export function useModals() {
  return React.useContext(ModalContext)
}
export function useModalControls() {
  return React.useContext(ModalControlContext)
}
