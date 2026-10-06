export type OrderTab = 'scheduled' | 'inprogress|awaiting-parts' | 'completed' | 'canceled'

export const ORDER_TABS: Array<{key: OrderTab; label: string}> = [
  {key: 'scheduled', label: 'Upcoming'},
  {key: 'inprogress|awaiting-parts', label: 'In progress'},
  {key: 'completed', label: 'Completed'},
  {key: 'canceled', label: 'Canceled'},
]

export const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  inprogress: 'In progress',
  'awaiting-parts': 'Waiting for parts',
  completed: 'Completed',
  canceled: 'Canceled',
}

export function statusLabel(status: string | null | undefined) {
  if (!status) return 'Scheduled'
  return STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export type SortQuotes = 'price' | 'distance' | 'rating'

export const QUOTE_SORTS: Array<{key: SortQuotes; label: string}> = [
  {key: 'price', label: 'Lowest price'},
  {key: 'distance', label: 'Nearest'},
  {key: 'rating', label: 'Top rated'},
]

export type PartsCategory = {key: string; label: string; textQuery: string}

export const PARTS_CATEGORIES: PartsCategory[] = [
  {key: 'auto-parts', label: 'Auto parts', textQuery: 'auto parts store'},
  {key: 'tires', label: 'Tires', textQuery: 'car tires shop'},
  {key: 'battery', label: 'Batteries', textQuery: 'car battery store'},
  {key: 'oils', label: 'Oils', textQuery: 'car oils store'},
]

export const NOTIFICATION_COPY: Record<string, string> = {
  scheduled: 'Your appointment is booked.',
  inprogress: 'The shop started work on your car.',
  'awaiting-parts': 'The shop is waiting for parts.',
  completed: 'Your service is done. You can pick up your car.',
  canceled: 'Your appointment was canceled.',
}
