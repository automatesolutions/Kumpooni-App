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
import {SafeAreaView} from 'react-native-safe-area-context'
import Animated, {
  FadeInRight,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import {ChevronLeft, Search} from 'lucide-react-native'
import {colors, spacing} from '#/utils/theme'
import {useNavigation} from '@react-navigation/native'
import {Separator} from '#/components/utils/Views'
import {Service} from '#/types/automate'
import {useServicesFeed} from '#/state/queries/services'
import {SkeletonServices} from '#/components/skeleton/SkeletonServices'
import {debounce} from '#/lib/debounce'
import {currency} from '#/lib/strings/currency'
import {logger} from '#/logger'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Search'>
export function SearchScreen({}: Props) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [search, setSearch] = useState('')
  const wrappedSetSearch = debounce(setSearch, 500)
  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: '#fff'}}>
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
    </SafeAreaView>
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
  const {data: servicesFeed, isFetching} = useServicesFeed(searchKeyword)
  logger.debug('services', {servicesFeed})
  const renderServiceItem: ListRenderItem<Service> = useCallback(({item}) => {
    return <ServicesListItem service={item} />
  }, [])
  return (
    <FlatList
      contentContainerStyle={{
        flex: 1,
        paddingHorizontal: spacing.extraSmall,
      }}
      onScroll={onScroll}
      data={servicesFeed}
      renderItem={renderServiceItem}
      keyExtractor={(item: Service) => item?.id?.toString()}
      ItemSeparatorComponent={() => (
        <Separator style={{marginVertical: 5, marginHorizontal: 8}} />
      )}
      scrollEventThrottle={16}
      ListEmptyComponent={() =>
        isFetching ? (
          <>
            <SkeletonServices style={{marginHorizontal: spacing.medium}} />
            <SkeletonServices style={{marginHorizontal: spacing.medium}} />
          </>
        ) : null
      }
    />
  )
}

export function ServicesListItem({service}: {service: Service}) {
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
      <View style={{flex: 1, paddingVertical: spacing.tiny}}>
        <Text style={[a.text_md, a.font_bold]}>{service?.name}</Text>
        <Text style={[a.text_sm, {color: '#b61616'}]}>
          {service?.short_description}
        </Text>
        {/* <Text
          style={{
            fontSize: 12,
            color: '#000',
            fontWeight: 'bold',
            fontFamily: 'Inter-Medium',
          }}>
          {currency.format(service?.price ?? 0)}
        </Text> */}
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
