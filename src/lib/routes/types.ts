import {CarDetails} from '#/state/queries/vehicle'
import {Service, Vehicle} from '#/types/automate'
import {NavigationState, PartialState} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'

type Store = {
  id: string
  name: string
}
export type CommonNavigatorParams = {
  Debug: undefined
  Services: {categoryId: number; categoryName: string}
  Details: undefined
  Login: undefined
  Otp: {phone: string}
  Terms: undefined
  Support: undefined
  About: undefined
  AddressList: undefined
  Notification: undefined
  Location: undefined
  NearbyStores: undefined
  Search: undefined
  StoreSelection: undefined
  Cars: undefined
  Cart: undefined
  Quote: undefined
  Vehicle: {vehicle?: CarDetails; redirect?: 'Cars' | 'Cart' | 'Home'}
  Checkout: {store: Store}
  OrderDetails: {repairOrderId: string}
  SearchStores: undefined
  Store: {
    storeId: string
    store_rating?: number
    order_total?: number
    review_count?: number
  }
  CartStore: undefined
  CreateAccount: undefined
  WriteReview: {
    storeName: string
    services: Service[]
    storeId: string
    repairOrderId: string
  }
  EditService: {
    service: Service
  }
  Settings: undefined
}

export type OrdersTabNavigatorParams = {
  Orders: undefined
}
export type PartsTabNavigatorParams = {
  Parts: undefined
}

export type ShopTabNavigatorParams = {
  Shops: undefined
}
export type MyAccountTabNavigatorParams = {
  MyAccount: undefined
}
export type BottomTabNavigatorParams = {
  HomeTab: undefined
  OrdersTab: undefined
  PartsTab: undefined
  ShopsTab: undefined
  MyAccountTab: undefined
}

export type AllNavigatorParams = CommonNavigatorParams & {
  RootTab: undefined
  HomeTab: undefined
  OrdersTab: undefined
  ShopsTab: undefined
  MyAccountTab: undefined
  Home: undefined
  Orders: undefined
  Stores: undefined
}

export type NavigationProp = NativeStackNavigationProp<AllNavigatorParams>

export type State =
  | NavigationState
  | Omit<PartialState<NavigationState>, 'stale'>

export type RouteParams = Record<string, string>
export type MatchResult = {params: RouteParams}

export type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params: RouteParams) => string
}
