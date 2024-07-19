import React, {useCallback, useEffect, useLayoutEffect} from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {useTheme, atoms as a} from '#/theme'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'

import {Service} from '#/types/automate'
import {spacing} from '#/utils/theme'

import {useRequireAuth, useSession} from '#/state/session'

import {useNavigation} from '@react-navigation/native'
import {useModalControls} from '#/state/modals'

import {useCartStore} from '#/stores/cart'
import {ServicesItem} from '#/components/services/ServicesItem'
import {CartBottom} from '#/components/cart/CartBottom'
import {useServicesByCategoryQuery} from '#/state/queries/services'
import {Text} from '#/components/Typography'
import {useShopCartStore} from '../stores/shop-cart'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Services'>
export function ServicesScreen({route}: Props) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {data: services, isLoading} = useServicesByCategoryQuery(
    route.params.categoryId,
  )
  const {openModal} = useModalControls()
  const requireAuth = useRequireAuth()

  const cartItems = useCartStore(state => state.items)
  const cartsCount = cartItems.length

  const {addItem, removeItem} = useCartStore(state => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
  }))
  const setShopCartItems = useShopCartStore(state => state.addBulkItems)
  const onAddToCartPress = useCallback(
    (service: Service) => () => {
      if (cartItems.find(cartItem => cartItem.id === service.id)) {
        removeItem(service.id)
      } else if (service.service_type === 'OrderDelivery') {
        openModal({
          name: 'service-variation',
          service: service,
          label: '',
          serviceVariant: [],
          category: '',
          addItem: serviceItem => {
            setShopCartItems([serviceItem]),
              setTimeout(() => {
                navigation.navigate('Checkout', {
                  store: {
                    id: '5fb344c6-f65c-444f-8aa5-2396508356fd',
                    name: 'Auto-Mate',
                  },
                })
              }, 100)
          },
        })
        return
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
        console.log('Add Item')
        addItem({...service, quantity: 1})
      }
    },
    [addItem, removeItem, cartItems],
  )

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<Service>) => (
      <ServicesItem
        service={item}
        onPress={onAddToCartPress(item)}
        isInCartItem={
          typeof cartItems.find(cartItems => cartItems.id === item.id) !==
          'undefined'
        }
      />
    ),
    [cartItems],
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${route.params.categoryName}`,
    })
  }, [navigation, route])

  return (
    <View style={[t.atoms.bg, a.flex_1]}>
      {isLoading ? (
        <View style={[a.flex_1, a.align_center, a.justify_center]}>
          <ActivityIndicator
            size="large"
            style={[a.align_center]}
            color="#b61616"
          />
        </View>
      ) : (
        <FlatList
          data={services ?? []}
          renderItem={renderItem}
          keyExtractor={key => key.id.toString()}
          contentContainerStyle={{marginHorizontal: 16}}
          ListFooterComponent={<View style={{height: 50}} />}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={[
                  a.w_full,
                  {
                    height: 1,
                    backgroundColor: t.palette.contrast_100,
                  },
                ]}
              />
            </View>
          )}
          ListEmptyComponent={
            <View>
              <Text>No Available Services Yet.</Text>
            </View>
          }
          style={{paddingTop: 20}}
        />
      )}
      {cartsCount > 0 && (
        <CartBottom
          cartCount={cartsCount}
          floating
          onPress={() => navigation.navigate('Cart')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  $container: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    marginHorizontal: spacing.small,
    gap: spacing.extraSmall,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.small,
  },
  title: {fontSize: 15, fontWeight: '600', color: '#000', lineHeight: 24},
  subtitle: {fontSize: 12, color: '#b61616'},

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    backgroundColor: 'red',
  },
  addBtn: {
    alignItems: 'center',
    padding: 6,
    width: 98,
    marginLeft: 'auto',
    borderRadius: 5,
    backgroundColor: '#000',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  descriptionWrapper: {},

  description: {
    fontSize: 11,
  },
  price: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Inter-Medium',
  },
  imageRight: {
    resizeMode: 'contain',
    height: 90,
    width: 100,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  titleWrapper: {
    margin: 0,
    padding: 0,
  },
  inclusionImage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
})
