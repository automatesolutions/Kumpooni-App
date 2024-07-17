import React, {useCallback, useMemo, useState} from 'react';
import {NearbyStores, NearbyStoresServices, Service} from '#/types/automate';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {colors, shadows} from '#/utils/theme';
import {Star, Store} from 'lucide-react-native';
import {color} from '#/theme/tokens';
import {Text} from '../Typography';

import {atoms as a, useTheme} from '#/theme';

import {currency} from '#/lib/strings/currency';

import {ServiceDetailModal} from '../modals/ServiceDetailModal';

import {CartStoreItem} from '#/stores/cart';
import {StoreRating} from './StoreRating';
import {StarRating} from './StarRating';
import {FormattedAddress} from './FormattedAddress';
import {Ratings} from './Ratings';

export function StoreCard({
  store,
  onPressBookAppointment,
  cartItems,
}: {
  store: NearbyStoresServices;
  onPressBookAppointment: (cartItems: CartStoreItem[]) => void;
  cartItems: CartStoreItem[];
}) {
  const [visible, setVisible] = useState<boolean>(false);
  const t = useTheme();
  const kmDistance = store.dist_meters / 1000;

  const onPressViewDetails = () => setVisible(true);

  const onClosed = () => {
    setVisible(false);
  };

  const storeServices = store.services.map(service => {
    const quantity = cartItems?.find(
      cartItem => cartItem.id === service.source_id,
    )?.quantity;

    return {
      ...service,
      quantity: quantity ?? 0,
    };
  });

  const total = useMemo(() => {
    return store.services.reduce((acc, service) => {
      const quantity = cartItems?.find(
        cartItem => cartItem.id === service.source_id,
      )?.quantity;
      return acc + service.price * (quantity ?? 0);
    }, 0);
  }, [store, cartItems]);

  return (
    <>
      <View
        style={[
          {
            backgroundColor: '#fff',
            paddingTop: 8,
          },
        ]}>
        <View style={[a.flex_row, a.align_center, a.px_xs, {gap: 10}]}>
          {store.store_img ? (
            <Image
              source={{
                uri: store.store_img,
              }}
              style={{
                height: 60,
                width: 60,
                borderRadius: 3,
              }}
            />
          ) : null}
          <View
            style={{
              flex: 1,
              height: '100%',
              paddingVertical: 4,
            }}>
            {/* Store Rating */}
            <View style={{paddingTop: 3}}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.black,
                }}>
                {store.name}
              </Text>
              <Ratings rating={store.rating} />
            </View>

            <FormattedAddress address={store.address} distance={kmDistance} />
          </View>
        </View>
        <View
          style={[
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.pr_2xs,
            a.gap_2xs,
            a.mb_2xs,
            {marginTop: 2},
          ]}>
          <Text style={[a.font_bold]}>{currency.format(total)}</Text>
          <TouchableOpacity style={[styles.btn, styles.viewBtn]}>
            <Text
              style={[a.text_xs, {color: t.palette.primary_500}]}
              onPress={onPressViewDetails}>
              See details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.appointmentBtn]}
            onPress={() => onPressBookAppointment(storeServices)}>
            <Text style={[a.text_xs, {color: '#fff'}]}>Book appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ServiceDetailModal
        isOpen={visible}
        onClosed={onClosed}
        services={(storeServices as []) ?? []}
        total={total}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
    borderWidth: 1,
    borderRadius: 5,
  },
  viewBtn: {
    borderColor: color.blue_400,
  },
  appointmentBtn: {
    backgroundColor: '#000',
  },
});
