import type {ReactElement} from 'react'
import {PostgrestError} from '@supabase/supabase-js'

import {Database} from './supabase'
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns']
// etc.

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{data: infer U}>
  ? Exclude<U, null>
  : never
export type DbResultErr = PostgrestError

export type Vehicle = Tables<'vehicle'>

export type Service = Tables<'service'> & {
  quantity: number
  category: {id: number; name: string}
  service_name?: string
}

export type Parts = Tables<'parts'>
export type RepairOrder = Tables<'repair_order'>

export type Question = Tables<'questions'>
export type Address = Tables<'address'>
export type Reviews = Tables<'reviews'>
export type Categories = Tables<'categories'>
export type Recommendation = {
  service_id: number
  service_name: string
  price: number
  short_description: string
  img_url: string
}[]

export type NotificationType = Enums<'notification_type'>

export interface QuestionOption extends Omit<Question, 'options'> {
  options: {
    answer: {
      explanation: string
    } | null
    optionName: string
    nextQuestion: string | null
    explanation: string
    recommendation: Recommendation | null
  }[]
}

export type UserProfile = Tables<'users'>
export type Store = Tables<'store'>
export type NearbyStores = Functions<'get_nearby_stores'>[0]

export type VehicleWithBrand = {
  brand: {id: number; name: string}
  model: {id: number; name: string}
  year_model: string
  plate_no: string
  vehicle_size: string
}

export type ServicesArray = Array<
  Record<string, any> & Services & {service_name: string | null}
>
export interface RepairOrderTypes
  extends Omit<RepairOrder, 'vehicle_id' | 'internal_notes'> {
  vehicle: VehicleWithBrand
  services: ServicesArray
  parts: Parts[]
  store: Store
}

export interface TransactionOrderTypes
  extends Omit<RepairOrder, 'vehicle_id' | 'internal_notes'> {
  vehicle: VehicleWithBrand
  services: Service[]
  store: Store
  reviews: Reviews[]
}
//ENUM
export type RepairStatus = Enums<'notification_type'>

export type AccountNavigationItem = {
  id: number
  title: string
  name?: 'Support' | 'Terms' | 'About'
  iconElement: ReactElement
  subTitle?: string
}

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface Location {
  lat: number
  lng: number
}

export interface GeocodingResult {
  formatted_address: string
  address_components: AddressComponent[]
  geometry: {
    location: Location
    location_type: string
    viewport: {
      northeast: Location
      southwest: Location
    }
  }
  place_id: string
  types: string[]
}

export interface AddressItem {
  user_id: string | null
  address_id: number | null
  address_line: string | null
  postal_code: number | null
  region_name: string | null
  province_name: string | null
  city_name: string | null
  barangay_name: string | null
  is_default: boolean | null
  region_id: number | null
  province_id: number | null
  city_id: number | null
  barangay_id: number | null
}
export interface EditAddressItem {
  user_id: string
  address_id: number
  address_line: string
  postal_code: number
  is_default: boolean
  region_id: number
  province_id: number
  city_id: number
  barangay_id: number
}

export interface GeocodingResponse {
  plus_code: {compound_code: string; global_code: string}
  results: GeocodingResult[]
  status:
    | 'OK'
    | 'ZERO_RESULTS'
    | 'OVER_QUERY_LIMIT'
    | 'REQUEST_DENIED'
    | 'INVALID_REQUEST'
    | 'UNKNOWN_ERROR'
}

export type Coordinates = {latitude: number; longitude: number}

export type Coords = {
  lat: number
  lng: number
}
export interface ParsedNotification {
  id: string
  type: NotificationType
  content: string | null
  user_id: string | null
  read_at: string | null
  created_at: string
  store_id: string | null
  store_name: string | null
  repair_order_id: string | null
  is_read: boolean
}

export interface Services {
  id: number
  service: Service
}

export interface NearbyStoresServices extends Omit<NearbyStores, 'services'> {
  services: Service[]
}

export interface SearchNearbyStore {
  id: string
  name: string
  longitude: number
  latitude: number
  business_hours: string
  store_img: string
  contact_no: string
  address: string
  city: string
  outside_img: string
  merchant_offers: string[]
  dist_meters: number
  order_total: number
  review_count: number
  store_rating: number
}

// export interface ServiceWithCategory extends Service {
//   categories: Category[]
// }

export interface StoreCategory {
  id: string
  name: string
  address: string
  store_img: string | null
  store_logo: string | null
  outside_img: string | null
  banner_img: string | null
  business_hours: string | null
  contact_no: string
  latitude: number
  longitude: number
  categories: {id: number; name: string}[]
}

interface GooglePlaceDisplayNameDto {
  text: string
  languageCode: string
}
interface GooglePlacePhotos {
  name: string
  widthPx: number
  heightPx: number
}
export interface GooglePlaceDto {
  id: string
  displayName: GooglePlaceDisplayNameDto
  shortFormattedAddress: string
  types: string[]
  googleMapsUri: string
  photos: GooglePlacePhotos[]
  rating: number
  dist_meters?: number
  location: {
    latitude: number
    longitude: number
  }
  userRatingCount: number
  internationalPhoneNumber: string
  nationalPhoneNumber: string
  regularOpeningHours: OpeningHours
}

export type OpeningHours = {
  openNow: boolean
  periods: Periods[]
  weekdayDescriptions: string[]
}
type Periods = {
  open: {
    day: number
    hour: number
    minute: number
  }
}
