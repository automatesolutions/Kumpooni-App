import React from 'react'

// Adding Kumpooni to the home screen (public/manifest.webmanifest).
// Chrome and Edge send `beforeinstallprompt` when the app can be installed, sometimes
// before React loads, so a script in index.html keeps the event on window.
// Safari on iPhone and iPad never sends it. There people add the app from the Share menu.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent | null
  }
  interface Navigator {
    standalone?: boolean
  }
}

export const DISMISS_KEY = 'kumpooni.install.dismissedAt'
export const DISMISS_MS = 14 * 24 * 60 * 60 * 1000

/** "prompt": Chrome or Edge can install. "ios": show the Share menu steps. null: hide. */
export type InstallHow = 'prompt' | 'ios' | null
export type InstallDevice = 'phone' | 'tablet' | 'computer'

export type InstallState = {
  how: InstallHow
  device: InstallDevice
  /** Dismissed in the last 14 days. */
  dismissed: boolean
}

const HIDDEN: InstallState = {how: null, device: 'phone', dismissed: true}

/** Reads the user agent. `ios` is false in Facebook, Messenger, Instagram, and LINE, which can't add to the home screen. */
export function deviceInfo(ua: string, maxTouchPoints: number): {ios: boolean; device: InstallDevice} {
  // iPadOS reports itself as a Mac. Touch gives it away.
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  const ios = ipad || /iPhone|iPod/.test(ua)
  const inApp = /FBAN|FBAV|Instagram|Line\//.test(ua)
  const device: InstallDevice =
    ipad || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : /Android|iPhone|iPod/.test(ua) ? 'phone' : 'computer'
  return {ios: ios && !inApp, device}
}

export function wasDismissed(at: string | null, now: number) {
  const time = Number(at)
  return time > 0 && now - time < DISMISS_MS
}

let state = HIDDEN
let installed = false
let started = false
const listeners = new Set<() => void>()

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

function readDismissed() {
  try {
    return wasDismissed(localStorage.getItem(DISMISS_KEY), Date.now())
  } catch {
    return false
  }
}

function update() {
  const {ios, device} = deviceInfo(navigator.userAgent, navigator.maxTouchPoints)
  const how: InstallHow = installed || isStandalone() ? null : window.__installPrompt ? 'prompt' : ios ? 'ios' : null
  const dismissed = readDismissed()
  if (how !== state.how || device !== state.device || dismissed !== state.dismissed) state = {how, device, dismissed}
  listeners.forEach(l => l())
}

function start() {
  if (started) return
  started = true
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    window.__installPrompt = e as BeforeInstallPromptEvent
    update()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    window.__installPrompt = null
    update()
  })
  update()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
  }
}

export function useInstall(): InstallState {
  return React.useSyncExternalStore(
    subscribe,
    () => state,
    () => HIDDEN,
  )
}

/** Hides the Home card for 14 days. */
export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // Storage is blocked. The card comes back next visit.
  }
  update()
}

/** Opens Chrome's or Edge's install dialog. Each saved event opens it once. */
export async function promptInstall() {
  const event = window.__installPrompt
  if (!event) return
  window.__installPrompt = null
  await event.prompt()
  const {outcome} = await event.userChoice
  if (outcome === 'accepted') installed = true
  else dismissInstall()
  update()
}
