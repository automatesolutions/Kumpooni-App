import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Filter} from 'lucide-react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a} from '#/theme';
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types';
import {useLocationStore} from '#/stores/location';

import {NearbyStoresServices} from '#/types/automate';
import {EmptyStore} from '#/components/store/EmptyStore';
import {StoreCard} from '#/components/store/StoreCard';

import {useGetNearbyStoreQuery} from '#/state/queries/stores';
import {BottomSheetModalInstance} from '#/components/BottomSheetModal';
import {CartItems, useShopCartStore} from '#/stores/shop-cart';
import {useCartStore} from '#/stores/cart';
import {color} from '../theme/tokens';
import {SortShop, sortColumns} from '../lib/constants';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'StoreSelection'>;
export function StoreSelectionScreen(props: Props) {
  const t = useTheme();
  const bottomSheetRef = useRef<BottomSheetModalInstance>(null);
  const initialSnapPoints = useMemo(() => ['35%'], []);
  const handleSheetChanges = useCallback((index: number) => {}, []);
  const handleDismiss = useCallback(() => {
    bottomSheetRef?.current?.dismiss();
  }, []);
  const navigation = useNavigation<NavigationProp>();
  const {location} = useLocationStore(state => ({location: state.location}));
  const {serviceIds, cartItems} = useCartStore(state => ({
    serviceIds: state.serviceIds.map(serviceId => Number(serviceId)),
    cartItems: state.items,
  }));

  const [sort, setSort] = useState(sortColumns[0].key);
  const {setShopCartItems} = useShopCartStore(state => ({
    setShopCartItems: state.addBulkItems,
  }));

  const {data: stores, isLoading: isLoadingStores} = useGetNearbyStoreQuery(
    location,
    serviceIds,
  );

  const onPressSort = (newSort: SortShop) => {
    setSort(newSort);
  };
  const sortedStores = useMemo(() => {
    if (!stores) return [];
    if (sort === 'rating') {
      return stores.sort((a, b) => b.store_rating - a.store_rating);
    }
    if (sort === 'distance') {
      return stores.sort((a, b) => a.dist_meters - b.dist_meters);
    }
    if (sort === 'price') {
      return stores.sort((a, b) => a.total - b.total);
    }
  }, [stores, sort]);

  const isScreenFocused = useIsFocused();

  const onPressBookAppointment = useCallback(
    (store: NearbyStoresServices) => {
      return (services: CartItems[]) => {
        const {
          services: service,
          service_ids,
          dist_meters,
          store_rating,
          order_total,
          ...restStore
        } = store;
        setShopCartItems(services);
        setTimeout(() => {
          navigation.navigate('Checkout', {
            store: {id: store.id, name: store.name},
          });
        }, 100);
      };
    },
    [setShopCartItems],
  );

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<NearbyStoresServices>) => (
      <StoreCard
        store={item}
        onPressBookAppointment={onPressBookAppointment(item)}
        cartItems={cartItems}
      />
    ),
    [],
  );

  useEffect(() => {
    if (isScreenFocused && !location) {
      setTimeout(() => {
        navigation.push('Location');
      }, 100);
    }
  }, [location, isScreenFocused]);

  if (isLoadingStores)
    return (
      <ActivityIndicator
        size={'large'}
        style={[a.flex_1, a.justify_center, a.align_center]}
      />
    );

  return (
    <View style={[t.atoms.bg, a.flex_1]}>
      <SortColumn sort={sort} onPress={onPressSort} />
      <View style={[a.flex_1]}>
        <FlatList
          data={sortedStores}
          style={{flex: 1}}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: 10,
            gap: 10,
            flex: 1,
          }}
          ListEmptyComponent={<EmptyStore />}
        />
      </View>
    </View>
  );
}

function SortColumn({
  sort,
  onPress,
}: {
  sort: string;
  onPress: (sort: SortShop) => void;
}) {
  return (
    <View
      style={[a.flex_row, a.px_xs, a.gap_2xs, a.mt_2xs, {paddingVertical: 5}]}>
      {sortColumns.map(sortColumn => {
        const isActive = sortColumn.key === sort;
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
        );
      })}
    </View>
  );
}

function ListStoreHeader({onPress}: {onPress: () => void}) {
  return (
    <View style={[a.justify_center, a.my_xs]}>
      <TouchableOpacity
        style={{position: 'absolute', left: 15}}
        onPress={onPress}>
        <Filter size={18} color={'#000'} />
      </TouchableOpacity>
      <View style={[a.self_center]}>
        <Text style={[a.text_md, a.font_bold]}>RECOMMENDED SHOPS</Text>
      </View>
      <View />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {},
  rating: {
    fontSize: 14,
  },
});
