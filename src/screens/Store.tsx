import React, {useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {Text} from '#/components/Typography';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme, atoms as a} from '#/theme';
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types';
import {logger} from '#/logger';
import {useStoreQuery} from '#/state/queries/stores';
import {color} from '#/theme/tokens';
import {Clock, MapPin, Star} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import {StoreCategory} from '#/types/automate';

import {StoreServicesList} from '#/components/store/StoreServicesList';
import {useShopCartStore} from '#/stores/shop-cart';
import {StoreCategoryList} from '#/components/category/StoreCategoryList';

import {useNavigation} from '@react-navigation/native';

import {currency} from '#/lib/strings/currency';
import {ViewHeader} from '#/view/com/util/ViewHeader';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Store'>;

const ITEM_HEIGHT = 70;

export function StoreScreen(props: Props) {
  const {
    data: store,
    isLoading: isStoreLoading,
    isError,
  } = useStoreQuery(props.route.params.storeId);
  logger.debug('storeScreen', {store});
  logger.debug('store', props.route.params);

  if (store && !isStoreLoading) {
    return <StoreScreenReady {...props} store={store} />;
  } else {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

function StoreScreenReady({
  route,
  store,
}: Props & {
  store: StoreCategory;
}) {
  const t = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState(
    store?.categories[0]?.id ?? 0,
  );

  const onPressCart = useCallback(() => {
    navigation.navigate('CartStore');
  }, [navigation]);

  return (
    <View style={[a.flex_1, t.atoms.bg, a.pt_2xs]}>
      <ViewHeader canGoBack />
      <View style={[a.flex_row, a.mx_xs]}>
        <Image
          source={{uri: store?.banner_img!}}
          resizeMode="cover"
          style={[{width: '100%', height: 120, borderRadius: 7}]}
        />
      </View>
      <ShopDetails
        store={store}
        order_total={route.params?.order_total}
        store_rating={route.params?.store_rating}
        review_count={route.params?.review_count}
      />
      <LocationAndBusinessHours
        address={store.address}
        business_hours={store.business_hours!}
        phoneNumber={store.contact_no}
      />
      <View style={[a.pt_xs]}>
        <View
          style={[{backgroundColor: '#302727'}, a.px_sm, {paddingVertical: 4}]}>
          <LinearGradient
            colors={['#967A7A', '#302727']}
            style={[a.absolute, a.inset_0]}
            start={{x: 1, y: 0}}
            end={{x: 0, y: 0}}
          />
          <Text style={[a.font_bold, t.atoms.text_inverted]}>
            Services Offers
          </Text>
        </View>
      </View>
      <StoreCategoryList
        categories={store.categories}
        selectedCategory={selectedCategory}
        onSelected={setSelectedCategory}
      />
      {/* <View style={[{ marginTop: 4 }]}>
      
      </View> */}
      <StoreServicesList categoryId={selectedCategory} storeId={store.id} />
      <CheckoutBtn storeId={store.id} name={store.name} />
      {/* {carts.length > 0 ? (
        <CartBottom cartCount={carts.length} floating onPress={onPressCart} />
      ) : undefined} */}
    </View>
  );
}

function CheckoutBtn({storeId, name}: {storeId: string; name: string}) {
  const {carts} = useShopCartStore(state => ({
    carts: state.carts,
  }));
  const navigation = useNavigation<NavigationProp>();
  const total = carts.reduce(
    (acc, cart) => acc + cart.price * (cart.quantity ?? 0),
    0,
  );
  const onPressCheckout = useCallback(() => {
    navigation.navigate('Checkout', {store: {id: storeId, name}});
  }, [navigation, storeId]);

  if (carts.length < 1) return undefined;
  return (
    <View style={[{borderTopWidth: 0.5, borderColor: color.gray_300}]}>
      <View style={[a.flex_row, a.justify_between, a.p_2xs]}>
        <Text style={[a.text_md, {fontWeight: '600'}]}>Total</Text>
        <Text style={[a.text_md, a.font_bold]}>{currency.format(total)}</Text>
      </View>
      <TouchableOpacity
        onPress={onPressCheckout}
        style={[
          a.p_2xs,
          a.mx_2xs,
          a.mb_2xs,
          {
            borderRadius: 10,
            backgroundColor: '#000',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <Text style={[a.font_bold, a.text_lg, {color: '#fff'}]}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

function ShopDetails({
  store,
  store_rating,
  order_total,
  review_count,
}: {
  store: StoreCategory;
  store_rating?: number;
  order_total?: number;
  review_count?: number;
}) {
  const t = useTheme();
  console.log('store', store);
  return (
    <View style={[a.p_xs]}>
      <Text style={[a.text_md, a.font_bold]}>{store.name}</Text>
      <View style={[a.flex_row, a.align_center]}>
        <View style={[a.flex_row]}>
          <Star color={'#FF8700'} size={14} fill={'#FF8700'} />
          {/* {[1, 2, 3, 4, 5].map(num => {
            const isGreater = store_rating >= num
            return (
              <TouchableOpacity key={`${num}`} onPress={() => {}}>
                <Star
                  color={isGreater ? '#FF8700' : color.gray_200}
                  size={14}
                  fill={isGreater ? '#FF8700' : color.gray_300}
                />
              </TouchableOpacity>
            )
          })} */}
        </View>
        <Text style={[a.text_xs]}>{` ${store_rating} / 5 (${review_count} ${
          (review_count ?? 0) > 1 ? 'reviews' : 'review'
        })`}</Text>
      </View>
    </View>
  );
}

function LocationAndBusinessHours({
  address,
  business_hours,
  phoneNumber,
}: {
  address: string;
  business_hours: string;
  phoneNumber: string;
}) {
  const onPhoneLink = useCallback(() => {
    Linking.openURL(`tel:${phoneNumber}`);
  }, [phoneNumber]);
  return (
    <View style={[a.mx_sm, a.gap_3xs]}>
      <View style={[a.flex_row, a.gap_3xs]}>
        <MapPin size={18} color={'#000'} />
        <View style={[a.flex_1]}>
          <Text style={[a.font_bold]}>Address</Text>
          <Text style={[a.text_xs]}>{address}</Text>
        </View>
      </View>
      <View style={[a.flex_row, a.gap_3xs]}>
        <Clock size={18} color={'#000'} style={[a.self_end]} />
        <View style={[a.flex_1]}>
          <Text style={[a.font_bold]}>Open Hours</Text>
          <Text style={[a.text_xs]}>{`${business_hours} Monday-Friday`}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPhoneLink}
        style={[
          a.absolute,
          a.rounded_sm,
          {
            bottom: 0,
            right: 0,
            backgroundColor: '#41C575',
            paddingVertical: 5,
            paddingHorizontal: 10,
          },
        ]}>
        <Text style={[a.font_bold]}>Call Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    height: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  image: {
    height: 70,
    aspectRatio: 1 / 1,
    borderRadius: 5,
  },
});
