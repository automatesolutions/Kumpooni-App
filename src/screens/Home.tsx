import React, {useCallback, useEffect, useState} from 'react'
import {useNavigation} from '@react-navigation/native'
import {CartSticky} from '#/components/cart/CartSticky'
import {CategoryList} from '#/components/category/CategoryList'
import {HomeHeader} from '#/components/home/HomeHeader'
import {SearchBar} from '#/components/SearchBar'
import {NavigationProp} from '#/lib/routes/types'
import {useCategoryQuery} from '#/state/queries/category'
import {useCartStore} from '#/stores/cart'
import {useLocationStore} from '#/stores/location'
import {colors} from '#/utils/theme'
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {Video} from '#/components/VideoPlayer/VideoPlayer'
import {atoms as a, useTheme} from '#/theme'
import BannerCarousel from '#/components/BannerCarousel'
import {Text} from '#/components/Typography'

export function HomeScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const {data: category, isLoading} = useCategoryQuery()

  const {cartItems} = useCartStore(state => ({
    clearItem: state.clearItem,
    cartItems: state.items,
  }))
  const cartCount = cartItems.length
  const {location, getCurrentLocation} = useLocationStore(state => ({
    location: state.location,
    getCurrentLocation: state.getCurrentLocation,
  }))

  const onPressSearch = useCallback(() => navigation.navigate('Search'), [])

  useEffect(() => {
    if (location) return
    async function getUserLocation() {
      const res = await getCurrentLocation()
      if (!res) {
        navigation.navigate('Location')
      }
    }
    getUserLocation()
  }, [location])

  return (
    <View style={[a.flex_1, t.atoms.bg]}>
      <ScrollView style={[{height: '100%', paddingTop: 5}]}>
        <HomeHeader />
        <View style={[a.flex_row, a.mx_sm, a.mb_sm]}>
          <SearchBar
            disabled={false}
            title="Search Services & Packages"
            onPress={onPressSearch}
          />
        </View>

        {isLoading ? (
          <>
            {/* <LoadingSkeleton /> */}
            <ActivityIndicator
              size={'large'}
              color={colors.primary}
              style={[a.mt_xs]}
            />
          </>
        ) : (
          <>
            <CategoryList category={category} />
            <Video />
            <BYDBanner />
          </>
        )}
      </ScrollView>
      {cartCount > 0 && <CartSticky cartCount={cartCount} />}
    </View>
  )
}

function BYDBanner() {
  const t = useTheme()
  const [bydPictures] = useState([
    'https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-white.png',
    'https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-blue.png',
    'https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-red.png',
  ])

  const {width} = useWindowDimensions()
  const pictureWidth = (width - a.mx_xs.marginLeft - 15) / 3
  const onPress = () => {
    return Linking.openURL('https://bydcarsphilippines.com/')
  }
  return (
    <View style={[{paddingBottom: 120}]}>
      <View
        style={[
          a.flex_row,
          a.py_2xs,
          a.mx_sm,
          a.justify_center,
          a.align_center,
          {backgroundColor: '#d9d9d9'},
        ]}>
        <Image source={require('../assets/images/byd.png')} />
        <Text style={[a.text_md, {letterSpacing: 1}]}>
          - THE FUTURE IS HERE
        </Text>
      </View>
      <View style={[a.flex_row, a.justify_center, a.mx_xs, {gap: 5}]}>
        {bydPictures.map((picture, index) => (
          <TouchableOpacity key={`${picture}-${index}`} onPress={onPress}>
            <Image
              style={{aspectRatio: 1, width: pictureWidth}}
              source={{uri: picture}}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
      {/* https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-red.png
      https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-blue.png
      https://pnisqggcyxhdowtevdzu.supabase.co/storage/v1/object/public/image/byd-car-white.png */}
    </View>
  )
}

const styles = StyleSheet.create({
  backgroundVideo: {
    height: 300,
    width: '100%',
  },
})
