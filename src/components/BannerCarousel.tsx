import React, { memo, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'
import { banner, colors } from '#/utils/theme'
import { NavigationProp } from '#/lib/routes/types'

interface CarouselItem {
  key: string
  image_path: any
  categoryId: number
  name: string
  path: string
}

const { width, height } = Dimensions.get('window')

const Indicator = ({ scrollX }: any) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingTop: 10,
      }}>
      {[...Array(5).keys()].map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width]

        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [1, 1.5, 1],
          // outputRange: [0.8, 1.2, 0.8],
          extrapolate: 'clamp',
        })
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.6, 1, 0.6],
          extrapolate: 'clamp',
        })
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [
            colors.palette.neutral800,
            colors.info,
            colors.palette.neutral800,
          ],
          extrapolate: 'clamp',
        })
        return (
          <Animated.View
            key={`carousel-${i}`}
            style={{
              height: 8,
              width: 8,
              borderRadius: 4,
              opacity,
              backgroundColor,
              transform: [
                {
                  scale,
                },
              ],
            }}
          />
        )
      })}
    </View>
  )
}

const BannerCarousel = () => {
  const slideRef = useRef<FlatList>(null)
  const [index, setIndex] = useState(0)
  const navigation = useNavigation<NavigationProp>()

  const scrollX = useRef(new Animated.Value(0)).current
  const handleOnScroll = (event: NativeSyntheticEvent<any>) => {
    Animated.event(
      [
        {
          nativeEvent: {
            contentOffset: {
              x: scrollX,
            },
          },
        },
      ],
      {
        useNativeDriver: false,
      },
    )(event)
  }
  const onPressNavigation = (item: CarouselItem) => {
    if (!item.path) {
      return
    }

    navigation.navigate('Services', {
      categoryId: item.categoryId,
      categoryName: item.name,
    })
  }
  const renderItem = ({ item }: ListRenderItemInfo<CarouselItem>) => (
    <TouchableOpacity
      onPress={() => onPressNavigation(item)}
      disabled={item.path === ''}>
      <Image
        source={item.image_path}
        style={[
          {
            width: width - 32,
            height: height * 0.18,
            borderRadius: 5,
            resizeMode: 'contain',
            objectFit: 'fill',
          },
        ]}
      />
    </TouchableOpacity>
  )
  const handleOnViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setIndex(viewableItems[0].index || 0)
  }).current
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  useEffect(() => {
    const timeOut = setInterval(() => {
      if (index === banner.length - 1) {
        slideRef.current?.scrollToIndex({
          index: 0,
          animated: true,
          viewOffset: 16,
        })
      } else {
        slideRef.current?.scrollToIndex({
          index: index + 1,
          viewOffset: 16,
          animated: true,
        })
      }
    }, 20000)
    return () => clearInterval(timeOut)
  })

  return (
    <View style={{ paddingVertical: 14 }}>
      <FlatList
        ref={slideRef}
        //@ts-ignore
        data={banner.slice(0, 5)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: CarouselItem) => item.key}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 16,
        }}
        onScroll={handleOnScroll}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={handleOnViewableItemsChanged}
        style={{
          width: '100%',
        }}
      />
      <Indicator scrollX={scrollX} />
    </View>
  )
}

export default memo(BannerCarousel)

const styles = StyleSheet.create({})
