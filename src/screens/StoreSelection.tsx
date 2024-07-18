import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import {useIsFocused, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {Text} from '#/components/Typography'
import {useTheme, atoms as a} from '#/theme'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useLocationStore} from '#/stores/location'

import {GooglePlaceDto, NearbyStoresServices} from '#/types/automate'
import {EmptyStore} from '#/components/store/EmptyStore'
import {StoreCard} from '#/components/store/StoreCard'

import {CartItems, useShopCartStore} from '#/stores/shop-cart'
import {useCartStore} from '#/stores/cart'
import {color} from '../theme/tokens'
import {SortShop, sortColumns} from '../lib/constants'
import {PlacesItem} from '#/components/store/PlacesItem'
import {ListFooter} from '#/components/List'
import {cleanError} from '#/lib/strings/errors'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'

import {logger} from '#/logger'
import {
  useGetNearbyStoreQuery,
  useListGooglePlacesQuery,
} from '#/state/queries/stores'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'StoreSelection'>
export function StoreSelectionScreen(props: Props) {
  const t = useTheme()

  const navigation = useNavigation<NavigationProp>()
  const {location} = useLocationStore(state => ({location: state.location}))
  const {serviceIds, cartItems} = useCartStore(state => ({
    serviceIds: state.serviceIds.map(serviceId => Number(serviceId)),
    cartItems: state.items,
  }))

  const [sort, setSort] = useState(sortColumns[0].key)
  const {setShopCartItems} = useShopCartStore(state => ({
    setShopCartItems: state.addBulkItems,
  }))
  const initialNumToRender = useInitialNumToRender()

  const {data: stores, isLoading: isLoadingStores} = useGetNearbyStoreQuery(
    location,
    serviceIds,
  )

  const {
    data,
    error: placesError,
    fetchNextPage,
    hasNextPage,
    error,
    isFetchingNextPage,
  } = useListGooglePlacesQuery({
    textQuery: 'auto repair shop, car repair and maintenance service',
    location,
  })

  const places = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.places)
    }
    return []
  }, [data])

  const onPressSort = (newSort: SortShop) => {
    setSort(newSort)
  }
  const sortedStores = useMemo(() => {
    if (!stores) return []
    if (sort === 'rating') {
      return [...stores.sort((a, b) => b.rating - a.rating), ...places]
    }
    if (sort === 'distance') {
      return [
        ...stores.sort((a, b) => a.dist_meters - b.dist_meters),
        ...places.sort((a, b) => a.dist_meters - b.dist_meters),
      ]
    }
    if (sort === 'price') {
      return [...stores.sort((a, b) => a.total - b.total), ...places]
    }
  }, [stores, places, sort])

  const isScreenFocused = useIsFocused()

  const onPressBookAppointment = useCallback(
    (store: NearbyStoresServices) => {
      return (services: CartItems[]) => {
        setShopCartItems(services)
        setTimeout(() => {
          navigation.navigate('Checkout', {
            store: {id: store.id, name: store.name},
          })
        }, 100)
      }
    },
    [setShopCartItems, navigation],
  )

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<NearbyStoresServices>) => (
      <StoreCard
        store={item}
        onPressBookAppointment={onPressBookAppointment(item)}
        cartItems={cartItems}
      />
    ),
    [onPressBookAppointment],
  )

  useEffect(() => {
    if (isScreenFocused && !location) {
      setTimeout(() => {
        navigation.push('Location')
      }, 100)
    }
  }, [location, isScreenFocused])

  if (isLoadingStores)
    return (
      <ActivityIndicator
        size={'large'}
        style={[a.flex_1, a.justify_center, a.align_center]}
      />
    )

  return (
    <View style={[t.atoms.bg_contrast_25, a.flex_1]}>
      <SortColumn sort={sort} onPress={onPressSort} />

      <FlatList
        data={sortedStores}
        renderItem={({item}) => {
          if ('googleMapsUri' in item) {
            return <PlacesItem place={item} />
          } else {
            return (
              <StoreCard
                cartItems={cartItems}
                store={item}
                onPressBookAppointment={onPressBookAppointment(item)}
              />
            )
          }
        }}
        // onEndReached={onEndReached}
        onEndReachedThreshold={1.5}
        style={[]}
        contentContainerStyle={{
          gap: 5,
        }}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderColor: 'transparent'}}
            hasNextPage={hasNextPage}
            showEndMessage={true}
            endMessageText={`No more shops to show`}
          />
        }
        initialNumToRender={initialNumToRender}
        ListEmptyComponent={<EmptyStore />}
      />
    </View>
  )
}

function SortColumn({
  sort,
  onPress,
}: {
  sort: string
  onPress: (sort: SortShop) => void
}) {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.bg,
        a.flex_row,
        a.px_xs,
        a.gap_2xs,
        a.border_b,
        t.atoms.border_contrast_low,
        {paddingVertical: 10},
      ]}>
      {sortColumns.map(sortColumn => {
        const isActive = sortColumn.key === sort
        return (
          <TouchableOpacity
            style={styles.btn}
            key={sortColumn.key}
            onPress={() => onPress(sortColumn.key)}>
            <Text
              style={[
                styles.rating,
                {color: isActive ? 'red' : color.gray_600},
              ]}>
              {sortColumn.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {},
  rating: {
    fontSize: 14,
  },
})
