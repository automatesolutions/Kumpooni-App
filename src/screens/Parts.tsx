import React, {useCallback, useState} from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ListRenderItemInfo,
} from 'react-native'
import {Text} from '#/components/Typography'

import {useTheme, atoms as a} from '#/theme'

import {MapPin, Pin, SearchIcon} from 'lucide-react-native'
import {color} from '#/theme/tokens'
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutRight,
} from 'react-native-reanimated'
import {partsCategories, PartsCategory, partsShop} from '#/lib/constants'
import {GooglePlaceDto} from '#/types/automate'
import {PlacesItem} from '#/components/store/PlacesItem'
import {useListPartShopQuery} from '#/state/queries/stores/list-parts-shop'
import {useLocationStore} from '#/stores/location'
import {ListFooter} from '#/components/List'
import {cleanError} from '#/lib/strings/errors'
import {debounce} from '#/lib/debounce'
import {ListShopItem} from '#/components/PartsShop/ListShopItem'

export function PartsScreen() {
  const t = useTheme()
  const [isSearching, setIsSearching] = useState(false)
  const [query, setQuery] = useState('auto parts store')
  const [lastQuery, setLastQuery] = useState('')
  const location = useLocationStore(s => s.location)
  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<GooglePlaceDto>) => (
      <ListShopItem place={item} />
    ),
    [],
  )
  const {
    data: shops,
    isLoading,
    isFetching,
    error,
  } = useListPartShopQuery({location, query})

  const wrappedSetQuery = debounce(setQuery, 3000)

  const onSelectCategory = useCallback(
    (textQuery: string) => {
      setQuery(textQuery)
    },
    [setQuery],
  )

  return (
    <View style={[a.flex_1, t.atoms.bg_contrast_25]}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 15,
        }}>
        {isSearching ? (
          <View
            style={[
              t.atoms.bg_contrast_25,
              a.ml_sm,
              {
                borderRadius: 999,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flex: 1,
                paddingHorizontal: 8,
              },
            ]}>
            <SearchIcon size={20} color={color.blue_500} />

            <TextInput
              onChangeText={e => wrappedSetQuery(e)}
              placeholder="Search parts store"
              placeholderTextColor={color.gray_600}
              autoFocus={true}
              autoComplete="off"
              onFocus={() => setLastQuery(query)}
              spellCheck={false}
              autoCorrect={false}
              focusable={isSearching}
              style={[
                {
                  color: color.gray_1000,
                  paddingVertical: 8,
                },
              ]}
            />
          </View>
        ) : (
          <Animated.View
            entering={FadeInLeft}
            exiting={FadeOutRight}
            onTouchStart={() => setIsSearching(true)}
            style={[
              a.border,
              a.mx_sm,
              {
                width: 400,
                backgroundColor: t.atoms.bg.backgroundColor,
                padding: 10,
                borderRadius: 999,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flex: 1,
                paddingVertical: 10,
              },
            ]}>
            <SearchIcon size={20} color={color.gray_600} />
            <Text style={[{color: color.gray_200}]}>Search parts store</Text>
          </Animated.View>
        )}

        {isSearching && (
          <TouchableOpacity
            style={[a.mr_sm]}
            onPress={() => {
              setIsSearching(false)
              setQuery(lastQuery)
            }}>
            <Animated.Text
              entering={FadeInRight}
              exiting={FadeOutRight}
              style={[t.atoms.text, a.text_sm]}>
              Cancel
            </Animated.Text>
          </TouchableOpacity>
        )}
      </View>
      <Categories onSelect={onSelectCategory} />
      <FlatList
        renderItem={renderItem}
        data={shops}
        style={[a.mt_2xs]}
        contentContainerStyle={[a.gap_2xs]}
        ListHeaderComponent={
          <View style={[a.mx_sm, a.flex_row, a.gap_3xs, a.align_center]}>
            <MapPin size={12} color={'#1e1e1e'} />
            <Text style={[a.text_xs]}>Nearby</Text>
          </View>
        }
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetching}
            error={cleanError(error)}
            showEndMessage={true}
            endMessageText={`No more shops to show`}
          />
        }
      />
    </View>
  )
}

function Categories({onSelect}: {onSelect: (text: string) => void}) {
  const t = useTheme()
  const [activeCategory, setActiveCategory] = useState<PartsCategory>(
    partsCategories[0],
  )

  const onPressInner = useCallback(
    (params: PartsCategory) => {
      setActiveCategory(params)
      onSelect(params.textQuery)
    },
    [onSelect, setActiveCategory],
  )

  return (
    <View style={[a.mx_sm, a.mt_sm, a.gap_3xs]}>
      <Text style={[a.font_bold, a.text_md]}>Categories</Text>
      <View style={[a.flex_row, a.gap_2xs]}>
        {partsCategories.map(category => {
          const isActive = activeCategory.key === category.key
          return (
            <TouchableOpacity
              onPress={() => onPressInner(category)}
              key={category.key}
              style={[
                isActive ? t.atoms.bg_contrast_200 : t.atoms.bg,
                a.rounded_sm,
                a.align_center,
                {padding: 7, minWidth: 48, height: 30},
              ]}>
              <Text
                style={[
                  t.atoms.text_contrast_high,
                  a.text_xs,
                  isActive
                    ? {color: t.atoms.text.color, fontWeight: 'bold'}
                    : {},
                ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
const styles = StyleSheet.create({})
