import {create} from 'zustand'

export type Toast = {id: number; message: string; tone: 'success' | 'error' | 'info'}

type UiState = {
  locationOpen: boolean
  openLocation: () => void
  closeLocation: () => void
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

let nextId = 1

export const useUiStore = create<UiState>()((set, get) => ({
  locationOpen: false,
  openLocation: () => set({locationOpen: true}),
  closeLocation: () => set({locationOpen: false}),
  toasts: [],
  toast: (message, tone = 'success') => {
    const id = nextId++
    set({toasts: [...get().toasts, {id, message, tone}].slice(-3)})
    window.setTimeout(() => get().dismissToast(id), 4000)
  },
  dismissToast: id => set({toasts: get().toasts.filter(t => t.id !== id)}),
}))

export const toast = (message: string, tone?: Toast['tone']) =>
  useUiStore.getState().toast(message, tone)
