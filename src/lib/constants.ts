import { Insets } from 'react-native'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256
export const MAX_GRAPHEME_LENGTH = 300

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 1000

export function IS_TEST_USER(handle?: string) {
  return handle && handle?.endsWith('.test')
}

// Hitslop constants
export const createHitslop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
})
export const HITSLOP_10 = createHitslop(10)
export const HITSLOP_20 = createHitslop(20)
export const HITSLOP_30 = createHitslop(30)
export const BACK_HITSLOP = HITSLOP_30
export const MAX_POST_LINES = 25

export type TransactionTabTypes =
  | 'Scheduled'
  | 'Completed'
  | 'Canceled'
  | 'In Progress|Awaiting Parts'
export const tabs: Array<{
  key: TransactionTabTypes
  label: string
}> = [
  {
    key: 'Scheduled',
    label: 'Upcoming',
  },
  {
    key: 'In Progress|Awaiting Parts',
    label: 'Ongoing',
  },
  {
    key: 'Completed',
    label: 'Completed',
  },
  {
    key: 'Canceled',
    label: 'Canceled',
  },
]

export type SortShop = 'rating' | 'distance' | 'price'
export const sortColumns: Array<{
  key: SortShop
  label: string
}> = [
  {
    key: 'rating',
    label: 'Rating',
  },
  {
    key: 'distance',
    label: 'Distance',
  },
  {
    key: 'price',
    label: 'Price',
  },
]
