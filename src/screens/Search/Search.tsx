import React, {useCallback, useState} from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  Keyboard,
  FlatList,
  ListRenderItem,
  Image,
} from 'react-native'
import {Text} from '#/components/Typography'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useTheme, atoms as a} from '#/theme'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'

import Animated, {
  FadeInRight,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import {ChevronLeft, Search} from 'lucide-react-native'
import {colors, spacing} from '#/utils/theme'
import {useNavigation} from '@react-navigation/native'
import {Separator} from '#/components/utils/Views'

import {ServiceFeed, useServicesFeed} from '#/state/queries/services'
import {SkeletonServices} from '#/components/skeleton/SkeletonServices'
import {debounce} from '#/lib/debounce'

import {logger} from '#/logger'
import {List} from '#/components/utils/List'

import {ListFooter} from '#/components/List'
import {cleanError} from '#/lib/strings/errors'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Search'>
export function SearchScreen({}: Props) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [search, setSearch] = useState('')
  const wrappedSetSearch = debounce(setSearch, 500)
  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <Animated.View entering={FadeInRight.duration(500)}>
        <View style={styles.container}>
          <Pressable onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={colors.black} />
          </Pressable>
          <TouchableOpacity style={styles.searchContainer}>
            <Search color={colors.primary} size={20} />
            <TextInput
              autoFocus
              placeholder="Search Services & Packages"
              onChangeText={wrappedSetSearch}
              style={{
                flex: 1,
                padding: 0,
                fontSize: 14,
                color: colors.textDim,
              }}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ServicesFeedList
        searchKeyword={search}
        onScroll={() => Keyboard.isVisible() && Keyboard.dismiss()}
      />
    </View>
  )
}

type ServicesFeedListProps = {
  searchKeyword: string
  onScroll?: ReturnType<typeof useAnimatedScrollHandler>
}

export function ServicesFeedList({
  searchKeyword,
  onScroll,
}: ServicesFeedListProps) {
  const {
    data: servicesFeed,
    isFetching,
    isError,
    error,
  } = useServicesFeed(searchKeyword)
  const initialNumToRender = useInitialNumToRender()
  logger.debug('services', {servicesFeed})
  const renderServiceItem: ListRenderItem<ServiceFeed> = useCallback(
    ({item}) => {
      return <ServicesListItem service={item} />
    },
    [],
  )

  if (isError || !servicesFeed) {
    return (
      <>
        <SkeletonServices style={{marginHorizontal: spacing.medium}} />
        <SkeletonServices style={{marginHorizontal: spacing.medium}} />
      </>
    )
  }
  return (
    <List
      style={{flex: 1}}
      contentContainerStyle={{
        paddingHorizontal: spacing.extraSmall,
      }}
      data={servicesFeed}
      renderItem={renderServiceItem}
      keyExtractor={(item: ServiceFeed, index) => item?.id?.toString() + index}
      ItemSeparatorComponent={() => (
        <Separator style={{marginVertical: 5, marginHorizontal: 8}} />
      )}
      scrollEventThrottle={16}
      initialNumToRender={initialNumToRender}
      ListEmptyComponent={() =>
        isFetching ? (
          <>
            <SkeletonServices style={{marginHorizontal: spacing.medium}} />
            <SkeletonServices style={{marginHorizontal: spacing.medium}} />
          </>
        ) : null
      }
      ListFooterComponent={
        <ListFooter
          error={cleanError(error)}
          showEndMessage
          endMessageText="End of result."
        />
      }
    />
  )
}

export function ServicesListItem({service}: {service: ServiceFeed}) {
  const navigation = useNavigation<NavigationProp>()

  return (
    <Pressable
      style={({pressed}) => [
        {
          flexDirection: 'row',
          gap: 10,
          backgroundColor: pressed
            ? colors.palette.neutral200
            : colors.background,
          paddingVertical: spacing.micro,
          paddingHorizontal: spacing.small,
        },
      ]}
      onPress={() =>
        navigation.push('Services', {
          categoryId: service.category.id,
          categoryName: service.category.name,
        })
      }>
      <Image
        source={{uri: service?.img_url!}}
        resizeMode="contain"
        style={{height: 70, width: 70, borderRadius: 5}}
      />
      <View style={{paddingVertical: spacing.tiny}}>
        <Text style={[a.text_md, a.font_bold]}>{service?.name}</Text>
        <Text style={[a.text_sm, {color: '#b61616'}]}>
          {service?.short_description}
        </Text>
      </View>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    marginVertical: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 18,
    alignItems: 'center',
    gap: spacing.small,
    borderWidth: 0.5,
    borderColor: '#A3A3A3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: spacing.extraSmall - 2,
  },
})
