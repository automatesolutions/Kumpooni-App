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
export interface GeocodingResponse {
  plus_code: { compound_code: string; global_code: string }
  results: GeocodingResult[]
  status:
    | 'OK'
    | 'ZERO_RESULTS'
    | 'OVER_QUERY_LIMIT'
    | 'REQUEST_DENIED'
    | 'INVALID_REQUEST'
    | 'UNKNOWN_ERROR'
}

export type Coordinates = { latitude: number; longitude: number }
