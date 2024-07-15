import React, { useCallback } from 'react'

import {
  View,
  ViewStyle,
  StyleSheet,
  StyleProp,
  TouchableOpacity,
} from 'react-native'

import {
  RepairStatus,
  Service,
  ServicesArray,
  TransactionOrderTypes,
} from '../../types/automate'
import { s } from '#/lib/styles'
import { StoreDetails } from '../store/StoreDetails'
import { CarDetails } from '../car/CarDetails'
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MoreHorizontal,
} from 'lucide-react-native'
import { convertTo12HourFormat } from '#/lib/utils'
import dayjs from 'dayjs'
import { Accordion } from '../accordion'
import { buttonStyle } from '#/lib/functions'
import { colors, spacing } from '#/utils/theme'
import { useNavigation } from '@react-navigation/native'
import { atoms as a } from '#/theme'
import { NavigationProp } from '#/lib/routes/types'
import { Text } from '../Typography'
import { color } from '#/theme/tokens'
export interface TransactionItemProps {
  transaction: TransactionOrderTypes
}

export const OrderItem = ({ transaction }: TransactionItemProps) => {
  const navigation = useNavigation<NavigationProp>()
  const {
    appointment_date,
    status,
    vehicle,
    appointment_time,
    id,
    services,
    store,
    reviews,
  } = transaction
  const { textColor } = buttonStyle(status)

  const onPressViewDetails = () => {
    navigation.navigate('OrderDetails', {
      repairOrderId: transaction.id,
    })
  }
  const onPressReview = useCallback(() => {
    if (reviews.length < 1) {
      navigation.navigate('WriteReview', {
        storeName: store.name,
        repairOrderId: id,
        storeId: store.id,
        services: services,
      })
    }
    return
  }, [transaction])

  return (
    <TouchableOpacity
      onPress={onPressViewDetails}
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.medium,
          paddingBottom: 8,
        },
      ]}>
      <AppointmentTime
        appointment_date={appointment_date}
        appointment_time={appointment_time}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <StoreDetails store={store} />
        {status === 'Completed' && reviews.length < 1 ? (
          <TouchableOpacity
            onPress={onPressReview}
            style={[
              a.rounded_xs,
              a.justify_center,
              a.align_center,
              {
                borderWidth: 1,
                width: 70,
                height: 25,
                borderColor: '#D9D9D9',
              },
            ]}>
            <Text style={[a.text_xs, a.font_bold]}>To Rate</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.text, { color: textColor }]}>{status}</Text>
        )}
        {/* <Text style={[styles.text, { color: textColor }]}>{status}</Text> */}
      </View>
      <CarDetails vehicle={vehicle} />
      <ServicesDetails services={services} />
      <TransactionItemFooter onPress={onPressViewDetails} />
    </TouchableOpacity>
  )
}

export function TransactionItemFooter({
  onPress,
  style,
}: {
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: '#f4f6fa',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-end',
          width: 100,
          height: 30,
          borderRadius: 4,
          flexDirection: 'row',
        },
        style,
      ]}>
      <Text style={[styles.text, { fontWeight: '600', color: '#616a76' }]}>
        View Details
      </Text>
    </TouchableOpacity>
  )
}

export function ServicesDetails({
  services,
  style,
}: {
  services: Service[]
  style?: StyleProp<ViewStyle>
}) {
  const serviceName = services[0]?.name ?? services[0]?.service_name ?? ''
  if (services.length === 1) {
    return (
      <View style={[{ flexDirection: 'row' }, style]}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.black,
            paddingRight: 5,
          }}>
          Services:
        </Text>
        <Text
          style={{
            color: colors.palette.neutral700,
            fontSize: 14,
            flex: 1,
            fontWeight: '600',
          }}>{` ${serviceName}`}</Text>
      </View>
    )
  }

  return (
    <View style={[style]}>
      <Accordion.Root>
        <Accordion.Item value={`root-key`} key={1}>
          <Accordion.Trigger
            style={{
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
              height: 20,
            }}>
            <Accordion.Label>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                Services:
                <Text
                  style={{ fontSize: 14, fontWeight: '400', color: '#000' }}>
                  {` ${serviceName}`}
                </Text>
              </Text>
            </Accordion.Label>
            <Accordion.Chevron height={5.5} width={14} />
          </Accordion.Trigger>
          <Accordion.Content style={{ padding: 0 }}>
            {services.slice(1).map((service, i) => {
              return (
                <Text
                  key={`${service.id}-${i}`}
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: '#000',
                    paddingLeft: 12,
                  }}>
                  {service.name ?? service?.service_name}
                </Text>
              )
            })}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </View>
  )
}
function AppointmentTime({
  appointment_date,
  appointment_time,
}: {
  appointment_date: string | null
  appointment_time: string | null
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 12,
      }}>
      <View style={[s.flexRow, s.alignCenter, { gap: 3 }]}>
        <CalendarDays size={12} color="#000" fill="#fff" />
        <Text style={styles.dateTime}>
          {`${dayjs(appointment_date).format('DD MMMM YYYY, dddd')}`}
        </Text>
      </View>

      <View style={[s.flexRow, s.alignCenter, { gap: 3 }]}>
        <Clock size={12} color="#000" fill="#fff" />
        <Text style={styles.dateTime}>
          {convertTo12HourFormat(appointment_time!)}
        </Text>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  outer: {
    paddingTop: 10,
  },
  itemBox: {
    borderRadius: 99,
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: { fontSize: 12, fontWeight: '700', color: colors.black },
  dateTime: { fontSize: 14, fontWeight: '700', color: colors.black },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
})
