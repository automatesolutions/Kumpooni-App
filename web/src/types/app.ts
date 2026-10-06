import type {Database} from './supabase'
import type {VehicleKind} from './repair-proof'

type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns']

export type Service = Tables<'service'>
export type Category = Tables<'categories'>
export type Review = Tables<'reviews'>

export type CartItem = Service & {quantity: number}

export type Brand = {id: number; name: string; img_url?: string | null}
export type Model = {id: number; name: string}

export type Vehicle = {
  id: string
  kind: VehicleKind
  brand: Brand | null
  model: Model | null
  make_text: string | null
  model_text: string | null
  year_model: string | null
  plate_no: string | null
  vin_last6: string | null
}

export type NearbyStore = Omit<Functions<'get_nearby_stores'>[number], 'services'> & {
  services: Service[]
}

export type SearchStore = Functions<'search_nearby_stores'>[number]

export type StoreDetail = {
  id: string
  name: string
  address: string
  store_img: string | null
  banner_img: string | null
  store_logo: string | null
  outside_img: string | null
  business_hours: string | null
  contact_no: string
  latitude: number
  longitude: number
  categories: {id: number; name: string}[]
}

export type OrderVehicle = {
  id: string
  brand: {id: number; name: string}
  model: {id: number; name: string}
  year_model: string
  plate_no: string
}

export type OrderServiceLine = {
  id: number
  price: number
  name: string | null
  service_name?: string | null
  quantity?: number
}

export type OrderListItem = {
  id: string
  appointment_date: string | null
  appointment_time: string | null
  status: string | null
  reference_no: string | null
  vehicle: OrderVehicle | null
  services: OrderServiceLine[]
  store: {id: string; name: string; store_logo: string | null; tagline: string | null}
  reviews: {id: number; rating: number; content: string | null}[]
}

export type OrderDetail = {
  id: string
  created_at: string
  total_cost: number | null
  appointment_date: string | null
  appointment_time: string | null
  status: string | null
  reference_no: string | null
  services: OrderServiceLine[]
  parts: {
    id: number
    part_id: number
    name: string
    price: number
    quantity: number
    part_no: string | null
    unit_measure: string | null
  }[]
  store: {
    id: string
    name: string
    address: string
    contact_no: string
    store_img: string | null
    store_logo: string | null
    latitude: number
    longitude: number
  }
  vehicle: OrderVehicle | null
  reviews: {id: number}[]
}

export type AppNotification = {
  id: string
  type: string
  content: string | null
  user_id: string | null
  read_at: string | null
  created_at: string
  store_id: string | null
  store_name: string | null
  repair_order_id: string | null
  is_read: boolean
}

export type NotificationGroup = {date: string; data: AppNotification[]}

export type GooglePlace = {
  id: string
  displayName: {text: string; languageCode: string}
  shortFormattedAddress: string
  googleMapsUri: string
  photos?: {name: string; widthPx: number; heightPx: number}[]
  rating?: number
  userRatingCount?: number
  location: {latitude: number; longitude: number}
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  regularOpeningHours?: {openNow: boolean; weekdayDescriptions: string[]}
  dist_meters?: number
}
