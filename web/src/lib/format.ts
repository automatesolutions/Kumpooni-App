import dayjs from 'dayjs'

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export function formatPrice(value: number | null | undefined) {
  return peso.format(value ?? 0)
}

/** "13:30" or "13:30:00" -> "1:30 PM" */
export function formatTime(time: string | null | undefined) {
  if (!time) return ''
  const [hour, minute] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute || 0, 0, 0)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatDate(date: string | null | undefined, pattern = 'ddd, D MMM YYYY') {
  if (!date) return ''
  return dayjs(date).format(pattern)
}

export function formatDistance(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export function timeAgo(date: string) {
  const d = dayjs(date)
  const mins = dayjs().diff(d, 'minute')
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = dayjs().diff(d, 'hour')
  if (hours < 24) return `${hours} h ago`
  return d.format('D MMM, h:mm A')
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (!error) return fallback
  const msg =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && 'message' in error
          ? String((error as {message: unknown}).message)
          : ''
  if (/failed to fetch|network/i.test(msg)) {
    return "We can't reach the server. Check your connection and try again."
  }
  return msg || fallback
}
