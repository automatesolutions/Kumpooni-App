import {SearchBar} from '#/components/SearchBar'
import React, {useCallback} from 'react'
import {View, Image, FlatList, ListRenderItemInfo} from 'react-native'

import {ChevronDown, Pin} from 'lucide-react-native'
import {Text} from '#/components/Typography'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from '#/lib/routes/types'
import {TouchableOpacity} from 'react-native-gesture-handler'

import {useLocationStore} from '#/stores/location'

import {SearchNearbyStore, Store} from '#/types/automate'

import {getRoundedKm} from '#/lib/utils'
import {atoms as a, useTheme} from '#/theme'
import {color} from '#/theme/tokens'

import {Ratings} from '#/components/store/Ratings'
import {useSearchStoresQuery} from '#/state/queries/stores'

export function ShopsScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const onPressSearch = () => {
    navigation.navigate('SearchStores')
  }
  const {location} = useLocationStore(state => ({location: state.location}))
  const {address} = useLocationStore()
  const onPressLocation = () => {
    navigation.navigate('Location')
  }

  const {data, isLoading, isError} = useSearchStoresQuery({
    lat: location?.lat!,
    lng: location?.lng!,
    keyword: '',
  })

  console.log('useSearchStoresQuery', data)
  const onPressStore =
    ({id, order_total, store_rating, review_count}: SearchNearbyStore) =>
    () => {
      navigation.navigate('Store', {
        storeId: id,
        order_total,
        store_rating,
        review_count,
      })
    }
  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<SearchNearbyStore>) => (
      <StoreCard key={item.id} store={item} onPress={onPressStore(item)} />
    ),
    [],
  )
  return (
    <View style={[t.atoms.bg, a.flex_1]}>
      <View style={[a.mt_sm, a.flex_row, a.align_center, a.gap_3xs, a.mx_2xs]}>
        <SearchBar
          disabled={false}
          onPress={onPressSearch}
          title="Search stores"
          searchColor={color.gray_800}
        />
      </View>
      <TouchableOpacity
        style={[a.p_xs, a.flex_row, a.align_center]}
        onPress={onPressLocation}>
        <Pin size={12} color={'#000'} style={{marginRight: 4}} />
        <Text>{address?.main_text}</Text>
        <ChevronDown size={14} color={'#000'} style={{marginLeft: 4}} />
      </TouchableOpacity>
      <View
        style={[a.mx_xs, a.border_b, a.pb_2xs, {borderColor: color.gray_200}]}>
        <Text style={[a.font_bold, a.text_md]}>Near Shops</Text>
      </View>
      <FlatList data={data} renderItem={renderItem} />
    </View>
  )
}

function StoreCard({
  store,
  onPress,
}: {
  store: SearchNearbyStore
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[a.flex_row, a.p_2xs, a.gap_3xs]}
      onPress={onPress}>
      {store.store_img ? (
        <Image
          source={{
            uri: store.store_img!,
          }}
          style={[{borderRadius: 5}]}
          height={70}
          width={70}
        />
      ) : (
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.border,
            {
              height: 70,
              width: 70,
              borderRadius: 5,
              borderWidth: 0.5,
              borderColor: color.gray_100,
            },
          ]}>
          <Text style={[a.text_xs, a.font_bold, {color: color.gray_200}]}>
            No Image
          </Text>
        </View>
      )}

      <View style={[a.flex_1]}>
        <Text style={[a.font_bold]}>{`${store.name}`}</Text>
        <Text style={{fontSize: 10, color: '#625C58', maxWidth: '90%'}}>
          <Text style={{fontSize: 10, color: '#000', fontWeight: 'bold'}}>
            {`${getRoundedKm(store.dist_meters)} km `}
          </Text>
          - {store?.address}
        </Text>

        <View style={[a.flex_row, a.align_center, {gap: 4, marginTop: 8}]}>
          {/* <Star size={10} color="#FF8700" fill="#FF8700" />
          <StoreRating
            store_rating={store.store_rating}
            order_total={store.order_total}
          /> */}
          <Ratings rating={store.store_rating} />
        </View>
      </View>
    </TouchableOpacity>
  )
}
