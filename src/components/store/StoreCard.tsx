import React, { useCallback, useMemo, useState } from 'react'
import { NearbyStores, NearbyStoresServices, Service } from '#/types/automate'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { colors, shadows } from '#/utils/theme'
import { Star, Store } from 'lucide-react-native'
import { color } from '#/theme/tokens'
import { Text } from '../Typography'

import { atoms as a, useTheme } from '#/theme'

import { currency } from '#/lib/strings/currency'

import { ServiceDetailModal } from '../modals/ServiceDetailModal'
import { logger } from '#/logger'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { CartStoreItem } from '#/stores/cart'
import { StoreRating } from './StoreRating'

export function StoreCard({
  store,
  onPressBookAppointment,
  cartItems,
}: {
  store: NearbyStoresServices
  onPressBookAppointment: (cartItems: CartStoreItem[]) => void
  cartItems: CartStoreItem[]
}) {
  const [visible, setVisible] = useState<boolean>(false)
  const t = useTheme()
  const kmDistance = store.dist_meters / 1000
  const roundedKm = Math.round(kmDistance * 10) / 10
  const onPressViewDetails = () => setVisible(true)

  const onClosed = () => {
    setVisible(false)
  }

  const storeServices = store.services.map(service => {
    const quantity = cartItems?.find(
      cartItem => cartItem.id === service.source_id,
    )?.quantity

    return {
      ...service,
      quantity: quantity ?? 0,
    }
  })

  const total = useMemo(() => {
    return store.services.reduce((acc, service) => {
      const quantity = cartItems?.find(
        cartItem => cartItem.id === service.source_id,
      )?.quantity
      return acc + service.price * (quantity ?? 0)
    }, 0)
  }, [store, cartItems])

  return (
    <>
      <View
        style={[
          {
            backgroundColor: '#fff',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: color.gray_50,
          },
          { marginHorizontal: 12, paddingVertical: 6 },
        ]}>
        <View style={[a.flex_row, a.align_center, a.px_xs, { gap: 10 }]}>
          {store.store_img ? (
            <Image
              source={{
                uri: store.store_img,
              }}
              style={{
                height: 70,
                width: 60,
                borderRadius: 4,
              }}
            />
          ) : (
            <View
              style={{
                height: 70,
                width: 60,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderRadius: 4,
                borderColor: color.gray_100,
              }}>
              <Store size={40} color={color.gray_100} />
            </View>
          )}
          <View
            style={{
              flex: 1,
              height: '100%',
              paddingVertical: 4,
            }}>
            <View style={{ paddingTop: 3 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.black,
                }}>
                {store.name}
              </Text>
              <View style={[a.flex_row, a.align_center, { gap: 4 }]}>
                <Star size={10} color="#FF8700" fill="#FF8700" />

                <StoreRating
                  store_rating={store.store_rating}
                  order_total={store.order_total}
                />
              </View>
            </View>
            <View style={{ paddingTop: 5 }}>
              <Text style={{ fontSize: 10, color: '#625C58', maxWidth: '90%' }}>
                <Text
                  style={{ fontSize: 10, color: '#000', fontWeight: 'bold' }}>
                  {`${roundedKm} km `}
                </Text>
                - {store?.address}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.pr_2xs,
            a.gap_2xs,
            a.mt_2xs,
          ]}>
          <Text style={[a.font_bold]}>{currency.format(total)}</Text>
          <TouchableOpacity style={[styles.btn, styles.viewBtn]}>
            <Text
              style={[a.text_xs, { color: t.palette.primary_500 }]}
              onPress={onPressViewDetails}>
              See details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.appointmentBtn]}
            onPress={() => onPressBookAppointment(storeServices)}>
            <Text style={[a.text_xs, { color: '#fff' }]}>Book appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ServiceDetailModal
        isOpen={visible}
        onClosed={onClosed}
        services={(storeServices as []) ?? []}
        total={total}
      />
    </>
  )
}

const styles = StyleSheet.create({
  btn: {
    padding: 7,
    borderWidth: 1,
    borderRadius: 5,
  },
  viewBtn: {
    borderColor: color.blue_400,
  },
  appointmentBtn: {
    backgroundColor: '#000',
  },
})
