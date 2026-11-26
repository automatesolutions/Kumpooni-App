import {describe, expect, it} from 'vitest'
import {deviceInfo, DISMISS_MS, wasDismissed} from './install'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const MESSENGER_IOS = `${IPHONE} [FBAN/MessengerForiOS;FBAV/480.0]`

describe('deviceInfo', () => {
  it('shows the Share steps on iPhone Safari', () => {
    expect(deviceInfo(IPHONE, 5)).toEqual({ios: true, device: 'phone'})
  })
  it('spots an iPad that reports itself as a Mac', () => {
    expect(deviceInfo(IPAD, 5)).toEqual({ios: true, device: 'tablet'})
    expect(deviceInfo(IPAD, 0)).toEqual({ios: false, device: 'computer'})
  })
  it('hides the Share steps in Facebook and Messenger', () => {
    expect(deviceInfo(MESSENGER_IOS, 5).ios).toBe(false)
  })
  it('names Android phones, Android tablets, and computers', () => {
    expect(deviceInfo(ANDROID, 5)).toEqual({ios: false, device: 'phone'})
    expect(deviceInfo(ANDROID_TABLET, 5).device).toBe('tablet')
    expect(deviceInfo(WINDOWS, 0).device).toBe('computer')
  })
})

describe('wasDismissed', () => {
  const now = 1_800_000_000_000
  it('is true for 14 days after closing the card', () => {
    expect(wasDismissed(String(now - 1000), now)).toBe(true)
    expect(wasDismissed(String(now - DISMISS_MS + 1000), now)).toBe(true)
  })
  it('is false after 14 days, or with nothing stored', () => {
    expect(wasDismissed(String(now - DISMISS_MS - 1), now)).toBe(false)
    expect(wasDismissed(null, now)).toBe(false)
    expect(wasDismissed('junk', now)).toBe(false)
  })
})
