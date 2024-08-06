import React, {useCallback, useState} from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Image,
  TouchableOpacity,
} from 'react-native'
import {Text} from '#/components/Typography'
import {useTheme, atoms as a} from '#/theme'
import {Service} from '#/types/automate'
import {currency} from '#/lib/strings/currency'
import {useQuery} from '@tanstack/react-query'
import {supabase} from '#/lib/supabase'
import {logger} from '#/logger'

import {useShopCartStore} from '#/stores/shop-cart'
import {useModalControls} from '#/state/modals'

import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from '#/lib/routes/types'

const ITEM_HEIGHT = 70

type StoreServicesListProps = {
  storeId: string
  categoryId: number
}

export function StoreServicesList({
  storeId,
  categoryId,
}: StoreServicesListProps) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {addItem, carts, removeItem} = useShopCartStore(state => ({
    addItem: state.addItem,
    clearCart: state.clearCart,
    carts: state.carts,
    removeItem: state.removeItem,
    shopId: state.shopId,
  }))
  const {openModal} = useModalControls()
  const {data, isLoading} = useQuery({
    queryKey: ['store-service', {storeId, categoryId}],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('service')
        .select('*')
        .match({store_id: storeId, category_id: categoryId})
        .order('price', {ascending: true})

      if (error) {
        logger.debug(`Store ${categoryId}`, {error})
        throw error
      }
      return data
    },
  })

  const onAddToCartPress = useCallback(
    (service: Service) => () => {
      if (carts.find(cart => cart.id === service.id)) {
        removeItem(service.id)
      } else if (service.type === 'Product') {
        openModal({
          name: 'service-variation',
          service: service,
          label: '',
          serviceVariant: [],
          category: '',
          addItem: serviceItem => addItem(serviceItem),
        })
        return
      } else {
        addItem({
          ...service,
          quantity: 1,
        })
      }
    },
    [carts, addItem],
  )
  const renderServices = useCallback(
    ({item, index}: ListRenderItemInfo<Service>) => {
      return (
        <ServiceItem
          item={item}
          onPress={onAddToCartPress(item)}
          isInCartItem={
            typeof carts.find(cart => cart.id === item.id) !== 'undefined'
          }
        />
      )
    },
    [carts],
  )

  if (data && !isLoading) {
    return (
      <View style={[a.flex_1]}>
        <FlatList
          data={data}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          renderItem={renderServices}
          contentContainerStyle={[a.gap_2xs]}
          keyExtractor={item => `${item.id}`}
          ListFooterComponent={<View style={[{height: 100}]} />}
          style={{height: '100%'}}
          scrollEnabled
        />
      </View>
    )
  } else {
    return (
      <View style={[a.flex_1, a.justify_center, a.align_center]}>
        <ActivityIndicator size={'small'} color="red" />
      </View>
    )
  }
}

function ServiceItem({
  item,
  onPress,
  isInCartItem,
}: {
  item: Service
  isInCartItem: boolean
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <View style={[t.atoms.bg, a.flex_row, a.gap_2xs, a.p_2xs]}>
      <Image source={{uri: item.img_url!}} style={styles.image} />
      <View style={[a.justify_between]}>
        <Text style={[a.text_xs, a.font_bold]}>{item.name}</Text>
        <Text style={[a.pb_2xs]}>{currency.format(item.price ?? 0)}</Text>
      </View>

      <TouchableOpacity
        onPress={onPress}
        style={[
          {
            position: 'absolute',
            right: 20,
            bottom: 10,
            backgroundColor: t.palette.black,
            paddingVertical: 5,
            borderRadius: 5,
            width: 80,
            alignItems: 'center',
          },
          isInCartItem && styles.alreadyInCart,
        ]}>
        <Text
          style={[
            {color: t.palette.white},
            a.text_xs,
            a.font_bold,
            isInCartItem && {color: '#000'},
          ]}>
          {!isInCartItem ? 'Add' : 'Added'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
const styles = StyleSheet.create({
  image: {
    height: 70,
    aspectRatio: 1 / 1,
    borderRadius: 5,
  },
  alreadyInCart: {
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#000',
  },
})
