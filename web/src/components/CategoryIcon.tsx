import {
  Battery,
  CircleDot,
  CircleStop,
  Droplets,
  LayoutGrid,
  ScanSearch,
  Sparkles,
  Wind,
  Wrench,
  type Icon,
} from '@/components/icons'

const BY_NAME: Record<string, Icon> = {
  'oil change': Droplets,
  brakes: CircleStop,
  aircon: Wind,
  battery: Battery,
  tires: CircleDot,
  'tune-up': Wrench,
  detailing: Sparkles,
  diagnostics: ScanSearch,
}

const PHOTO_BY_NAME: Record<string, string> = {
  'oil change': '/images/categories/oil-change.png',
  brakes: '/images/categories/brakes.png',
  aircon: '/images/categories/aircon.png',
  battery: '/images/categories/battery.png',
  tires: '/images/categories/tires.png',
  'tune-up': '/images/categories/tune-up.png',
  detailing: '/images/categories/detailing.png',
  diagnostics: '/images/categories/diagnostics.png',
}

export function categoryPhoto(name: string, remote?: string | null) {
  return PHOTO_BY_NAME[name.trim().toLowerCase()] ?? remote ?? null
}

export function CategoryIcon({name, size = 26}: {name: string; size?: number}) {
  const Icon = BY_NAME[name.trim().toLowerCase()] ?? LayoutGrid
  return (
    <span className="cat__icon" aria-hidden>
      <Icon size={size} strokeWidth={1.75} />
    </span>
  )
}
