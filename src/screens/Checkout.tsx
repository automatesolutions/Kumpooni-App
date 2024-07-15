import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextStyle,
  ActivityIndicator,
} from 'react-native'
import { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types'
import { Text } from '#/components/Typography'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme, atoms as a } from '#/theme'
import { Service } from '#/types/automate'

import { color } from '#/theme/tokens'
import { colors, timeSlots } from '#/utils/theme'
import { DateSelection } from '#/components/checkout/DateSelection'
import { TimeSelection } from '#/components/checkout/TimeSelection'
import { useGetStoreOpenDaysQuery } from '#/state/queries/stores'
import { Separator } from '#/components/utils/Views'

import { currency } from '#/lib/strings/currency'

import { useNavigation } from '@react-navigation/native'
import { Header } from '#/components/Header'
import { useRepairOrderMutation } from '#/state/queries/appointment'
import { useGlobalLoadingControls } from '#/state/shell/global-loading'
import { useSession } from '#/state/session'
import { useCartStore, useIsCarRequired } from '#/stores/cart'
import { useVehicleStore } from '#/stores/vehicle'
import { RepairServices } from '#/components/order/RepairServices'
import { useShopCartStore } from '#/stores/shop-cart'
import { CustomerLocation } from '#/components/checkout/CustomerLocation'

import { StoreDetails } from '../components/store/StoreDetails'
type Props = NativeStackScreenProps<CommonNavigatorParams, 'Checkout'>

type TimeSlots = {
  available_date: string
  available_timeslots: string[]
  week_day: string
}
export function CheckoutScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {
    params: { store },
  } = route

  const { session } = useSession()
  const globalLoading = useGlobalLoadingControls()

  const selectedVehicle = useVehicleStore(state => state.selectedVehicle)

  const {
    data: dateSlots,
    isLoading,
    isError,
  } = useGetStoreOpenDaysQuery({
    id: store.id,
  })

  const [date, setDate] = useState<string | null>(null)

  const [time, setTime] = useState('')
  const disabled = !date || !time

  const memoDateTimeSlots: TimeSlots | undefined = useMemo(() => {
    if (dateSlots && date) {
      return dateSlots.find(dates => dates.available_date === date)
    }
    return undefined
  }, [dateSlots, isError, date])

  console.log('memoDateTimeSlots', memoDateTimeSlots)
  const { removeItems } = useCartStore(state => ({
    removeItems: state.removeItems,
  }))

  const { carts, clearCart } = useShopCartStore(state => ({
    carts: state.carts,
    clearCart: state.clearCart,
  }))

  const isCarRequired = useIsCarRequired(carts)
  const { mutate: createRepairOrder } = useRepairOrderMutation()

  const total = useMemo(() => {
    return carts.reduce(
      (acc, service) => acc + service.price * Number(service.quantity),
      0,
    )
  }, [carts])

  const onDateChanged = (newDate: string) => {
    setTime('')
    setDate(newDate)
  }

  const onPressPlaceOrder = useCallback(() => {
    globalLoading.show()
    if (!date || !time) return
    const booking = {
      user_id: session?.user.id!,
      vehicle_id: isCarRequired ? selectedVehicle?.id : undefined,
      store_id: store.id,
      appointment_date: date,
      appointment_time: time,
    }

    const requestedService = carts.map(item => ({
      service_id: item.id,
      quantity: item.quantity,
    }))
    const sourceIds = carts.map(item => item.source_id ?? 0)

    createRepairOrder(
      {
        requested_services: requestedService,
        ...booking,
      },
      {
        onSuccess: async () => {
          removeItems(sourceIds)
          clearCart()
          //@ts-ignore
          navigation.navigate('OrdersTab')
        },
        onSettled: () => {
          globalLoading.hide()
        },
      },
    )
  }, [date, time, carts, selectedVehicle, isCarRequired])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <Header
          title={'Checkout'}
          leftIcon="back"
          titleStyle={$header}
          leftIconColor={colors.black}
          onLeftPress={() => navigation.goBack()}
        />
      ),
    })
  }, [])

  useEffect(() => {
    if (dateSlots && dateSlots.length > 0) {
      setDate(dateSlots[0].available_date)
    }
  }, [dateSlots])

  console.log('date', date)
  console.log('time', time)
  if (isLoading) return <ActivityIndicator />

  return (
    <View style={[a.flex_1, t.atoms.bg]}>
      <CustomerLocation />
      <DateSelection dateSlots={dateSlots ?? []} onPress={onDateChanged} />
      <TimeSelection
        times={memoDateTimeSlots?.available_timeslots! ?? []}
        time={time}
        setTime={setTime}
      />
      <Separator style={[{ height: 7, backgroundColor: color.gray_50 }]} />
      <OrderSummary services={carts} total={total} store={store} />
      <Separator style={[{ height: 7, backgroundColor: color.gray_50 }]} />
      {/* <PaymentMethodSelection option={options} onSelect={setOptions} /> */}
      {/* <Separator style={[{ height: 7, backgroundColor: color.gray_50 }]} /> */}
      <View style={[a.p_xs]}>
        <Text style={[a.font_bold, a.text_xs, { color: color.red_400 }]}>
          Note:
          <Text style={[a.font_normal, a.text_xs]}>
            {` This estimate is based on the information submitted. Estimates may be subject to change upon further inspection of the vehicle.`}
          </Text>
        </Text>
      </View>
      <View
        style={[
          a.absolute,
          a.border_t,
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.px_xs,
          a.py_3xs,
          t.atoms.border_contrast_low,
          { bottom: 0, left: 0, width: '100%' },
        ]}>
        <View style={{}}>
          <Text style={[a.font_bold, a.text_md]}>
            {`Total: ` + currency.format(total ?? 0)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPressPlaceOrder}
          disabled={disabled}
          style={[
            {
              borderWidth: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 5,
              backgroundColor: '#000',
              opacity: disabled ? 0.5 : 1,
            },
          ]}>
          <Text style={[t.atoms.text_inverted, a.text_md, a.font_bold]}>
            Place order
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export function OrderSummary({
  store,
  services,
  total,
}: {
  store: { id: string; name: string }
  services: Service[]
  total: number
}) {
  return (
    <View style={[a.p_xs]}>
      {/* <Text style={[a.font_bold, a.text_md]}>Summary</Text> */}
      <StoreDetails store={store} />
      <RepairServices services={services} priceRequired />
      <View style={[a.flex_row, a.justify_between, a.mt_xs]}>
        <Text>Subtotal</Text>
        <Text>{currency.format(total)}</Text>
      </View>
    </View>
  )
}

const $header: TextStyle = {
  color: colors.black,
  fontWeight: 'bold',
  fontSize: 18,
  fontFamily: 'Inter-Bold',
}
