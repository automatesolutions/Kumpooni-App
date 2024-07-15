import React, {useCallback, useState} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import {Text} from '#/components/Typography';
import Animated, {
  FadeInRight,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme, atoms as a} from '#/theme';
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types';
import {useNavigation} from '@react-navigation/native';
import {debounce} from '#/lib/debounce';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, Search, Star, Store} from 'lucide-react-native';
import {colors, spacing} from '#/utils/theme';
import {SkeletonServices} from '#/components/skeleton/SkeletonServices';
import {Separator} from '#/components/utils/Views';
import {SearchNearbyStore, Service, Store as StoreType} from '#/types/automate';

import {useSearchStoresQuery} from '#/state/queries/stores';
import {useLocationStore} from '#/stores/location';
import {color} from '#/theme/tokens';
import {StoreRating} from '#/components/store/StoreRating';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SearchStores'>;
export function SearchStoresScreen(props: Props) {
  const t = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const wrappedSetSearch = debounce(setSearch, 500);
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
              placeholder="Enter the store name"
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
      <StoresFeedList
        searchKeyword={search}
        onScroll={() => Keyboard.isVisible() && Keyboard.dismiss()}
      />
    </SafeAreaView>
  );
}
type StoresFeedListProps = {
  searchKeyword: string;
  onScroll?: ReturnType<typeof useAnimatedScrollHandler>;
};

export function StoresFeedList({searchKeyword, onScroll}: StoresFeedListProps) {
  const navigation = useNavigation<NavigationProp>();
  const {location} = useLocationStore(state => ({
    location: state.location,
  }));
  const {
    data: storesFeed,
    isLoading,
    isError,
    isFetching,
  } = useSearchStoresQuery({
    lng: location?.lng!,
    lat: location?.lat!,
    keyword: searchKeyword,
  });
  const onStorePress = useCallback(
    (id: string) => () => {
      navigation.navigate('Store', {storeId: id});
    },
    [navigation],
  );

  const renderServiceItem: ListRenderItem<SearchNearbyStore> = useCallback(
    ({item}) => {
      return <StoresListItem store={item} onPress={onStorePress(item.id)} />;
    },
    [],
  );

  if (isLoading) {
    return (
      <ActivityIndicator style={[a.flex_1, a.justify_center, a.align_center]} />
    );
  }
  if (!storesFeed || isError) {
    return <ActivityIndicator />;
  }
  return (
    <FlatList
      contentContainerStyle={{
        flex: 1,
        paddingHorizontal: spacing.extraSmall,
      }}
      onScroll={onScroll}
      data={storesFeed}
      renderItem={renderServiceItem}
      keyExtractor={item => `${item.id}`}
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
  );
}

export function StoresListItem({
  store,
  onPress,
}: {
  store: SearchNearbyStore;
  onPress: () => void;
}) {
  const kmDistance = 5000 / 1000;
  const roundedKm = Math.round(kmDistance * 10) / 10;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: '#fff',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: color.gray_50,
        },
        {marginHorizontal: 12, paddingVertical: 6},
      ]}>
      <View style={[a.flex_row, a.align_center, a.px_xs, {gap: 10}]}>
        {store.store_img ? (
          <Image
            source={{
              uri: store.store_img,
            }}
            style={{
              height: 70,
              width: 60,
              borderRadius: 4,
            }}
          />
        ) : (
          <View
            style={{
              height: 70,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderRadius: 4,
              borderColor: color.gray_100,
            }}>
            <Store size={40} color={color.gray_100} />
          </View>
        )}
        <View
          style={{
            flex: 1,
            height: '100%',
            paddingVertical: 4,
          }}>
          <View style={{paddingTop: 3}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.black,
              }}>
              {store.name}
            </Text>
            <View style={[a.flex_row, a.align_center, {gap: 4}]}>
              <Star size={12} color="#FF8700" fill="#FF8700" />
              {/* {!(store.order_total > 1) ? (
                <Text style={[a.text_xs, a.font_normal]}>{`${
                  store.store_rating > 1 ? store.store_rating : 'No rating yet'
                } | ${store.order_total} ${
                  store.order_total > 1 ? 'Orders' : 'Order'
                }`}</Text>
              ) : (
                <Text
                  style={[a.text_xs, a.font_normal]}>{`0 No rating yet`}</Text>
              )} */}
              <StoreRating
                store_rating={store.store_rating}
                order_total={store.order_total}
              />
            </View>
          </View>
          <View style={{paddingTop: 5}}>
            <Text style={{fontSize: 10, color: '#625C58', maxWidth: '90%'}}>
              <Text style={{fontSize: 10, color: '#000', fontWeight: 'bold'}}>
                {`${roundedKm} km `}
              </Text>
              - {store?.address}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
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
});
