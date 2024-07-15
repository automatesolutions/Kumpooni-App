import React, { useCallback, useMemo, useState } from 'react'
import { colors, s } from '#/lib/styles'

import { useModalControls } from '#/state/modals'

import { ServicesVariant, Service } from '#/types/automate'

import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native'

import { QuantityControl } from '../QuantityControl'
import { currency } from '#/lib/strings/currency'
import { CartStoreItem, useCartStore } from '#/stores/cart'

type VariantItem = {
  name: string
  price: number
  img_url: string
}

export const snapPoints = ['60%']
export function Component({
  service,
  serviceVariant,
  label,
  category,
  addItem,
}: {
  service: Service
  label: string
  serviceVariant: Service[]
  category: string
  addItem: (data: CartStoreItem) => void
}) {
  console.log('Service', service)
  const cartItems = useCartStore(state => state.items)
  const cartQty = cartItems.filter(item => item.id === service.id)

  const [quantity, setQuantity] = useState(
    cartQty.length > 0 ? cartQty[0]?.quantity : service.minimum_qty ?? 1,
  )
  const onUpdateQuantity = ({
    type,
    input,
  }: {
    type: 'update' | 'add' | 'subtract'
    input?: number
  }) => {
    if (type === 'update') {
      setQuantity(input ?? 0)
    } else if (type === 'add') {
      setQuantity(qty => qty + 1)
    } else if (type === 'subtract') {
      setQuantity(qty => qty - 1)
    }
  }

  const { closeModal } = useModalControls()
  // const [item, setItem] = useState<Service>({
  //   ...(serviceVariant[0] ?? service),
  // })
  // const { addItem } = useCartStore(state => ({
  //   addItem: state.addItem,
  // }))

  // const onSelectItemPress = useCallback(
  //   (service: Service, index: number) => () => {
  //     setActiveIndex(index)
  //     setItem(service)
  //   },
  //   [],
  // )
  const onAddToCartPress = useCallback(() => {
    Keyboard.dismiss()

    addItem({
      ...service,
      quantity: quantity,
    })
    setTimeout(() => {
      closeModal()
    }, 100)
  }, [service, addItem, quantity, closeModal, Keyboard])
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <View style={[styles.container]}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 16,
            flexDirection: 'row',
            borderBottomWidth: 1,
            paddingBottom: 10,
            borderColor: colors.gray1,
          }}>
          <View />
          <Text
            style={{
              fontSize: 14,
              color: colors.black,
              fontWeight: '700',
              textAlign: 'center',
            }}>
            {service.name}
          </Text>
        </View>

        <View style={styles.preview}>
          <Image
            style={[
              {
                borderWidth: 1,
                borderColor: colors.gray2,
                borderRadius: 5,
                height: 60,
                width: 60,
              },
            ]}
            source={{
              uri: service.img_url || 'null',
            }}
            resizeMode="contain"
          />

          <View>
            <Text
              style={
                (styles.text,
                { color: colors.gray6, fontSize: 12, marginTop: 5 })
              }>
              {service?.name}
            </Text>
            <Text
              style={{
                color: colors.red3,
                fontWeight: '600',
                fontSize: 14,
              }}>
              {currency.format(service.price ?? 0)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.itemSelection,
            {
              paddingHorizontal: 12,
              marginTop: 10,
              gap: 5,
            },
          ]}>
          {/* <Text style={styles.label}>{label}</Text>
          <View
            style={{ flexWrap: 'wrap', columnGap: 5, flexDirection: 'row' }}>
            {serviceVariant?.map((variant, index) => (
              <VariantItem
                key={variant.name}
                item={variant}
                isActive={index === activeIndex}
                onSelectItemPress={onSelectItemPress(variant, index)}
              />
            ))}
          </View> */}
          <QuantityControl
            quantity={quantity}
            onUpdateQuantity={onUpdateQuantity}
            minimumQty={service.minimum_qty ?? 0}
            withLabel
            style={{
              paddingTop: 10,
            }}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={onAddToCartPress}
        style={[styles.btn, { marginHorizontal: 10, marginBottom: 10 }]}>
        <Text style={{ fontSize: 14, color: '#fff' }}>Add to cart</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const PADDING_HORIZONTAL = 12
export function VariantItem({
  item,
  isActive,
  onSelectItemPress,
}: {
  item: ServicesVariant
  isActive: boolean
  onSelectItemPress: () => void
}) {
  const { width } = useWindowDimensions()

  const itemWidth = (width - 34) / 3

  return (
    <TouchableOpacity
      onPress={onSelectItemPress}
      style={{
        width: itemWidth,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: isActive ? '' : '#fff',
        borderColor: isActive ? 'red' : '#000',
        borderRadius: 5,
      }}>
      <View
        style={{
          alignItems: 'center',
          width: '100%',
          paddingBottom: 5,
        }}>
        <Image
          source={{
            uri: item.img_url || '',
            height: 90,
            width: 90,
          }}
          resizeMode="contain"
        />
        <View
          style={{
            width: '100%',
          }}
        />
      </View>
      <View
        style={{
          marginTop: 'auto',
          height: 35,
          borderTopWidth: 1,
          borderColor: colors.gray2,
          justifyContent: 'center',
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: isActive ? colors.red4 : colors.gray7,
            textAlign: 'center',
          }}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 10,
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  itemSelection: {},
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray5,
  },

  btn: {
    marginTop: 'auto',
    alignItems: 'center',

    backgroundColor: colors.black,
    paddingVertical: 10,

    borderRadius: 5,
  },
})
