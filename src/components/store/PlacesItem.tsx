import React, {useCallback, useMemo, useState} from 'react';

import {Image, Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import {colors, shadows} from '#/utils/theme';
import {Star, Store} from 'lucide-react-native';
import {color} from '#/theme/tokens';
import {Text} from '../Typography';

import {atoms as a, useTheme} from '#/theme';

import {currency} from '#/lib/strings/currency';

import {StoreRating} from './StoreRating';
import {GooglePlaceDto} from '#/types/automate';
import {GOOGLE_MAP_KEY} from 'react-native-dotenv';

export function PlacesItem({place}: {place: GooglePlaceDto}) {
  const [visible, setVisible] = useState<boolean>(false);
  const t = useTheme();

  const roundedKm = Math.round((place.distance ?? 0) * 10) / 10;
  const onPressViewLocation = () => {
    Linking.openURL(place.googleMapsUri);
  };

  const onClosed = () => {
    setVisible(false);
  };

  const total = 0;

  return (
    <>
      <View
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
          {place.photos ? (
            <Image
              source={{
                uri: `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=1023&key=${GOOGLE_MAP_KEY}`,
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
                {place.displayName.text}
              </Text>
              <View style={[a.flex_row, a.align_center, {gap: 4}]}>
                <Star size={10} color="#FF8700" fill="#FF8700" />
                <StoreRating store_rating={place.rating} order_total={10} />
              </View>
            </View>
            <View style={{paddingTop: 5}}>
              <Text style={{fontSize: 10, color: '#625C58', maxWidth: '90%'}}>
                <Text style={{fontSize: 10, color: '#000', fontWeight: 'bold'}}>
                  {`${roundedKm} km `}
                </Text>
                - {place.shortFormattedAddress}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.pr_2xs,
            a.gap_2xs,
            a.mt_2xs,
          ]}>
          <TouchableOpacity style={[styles.btn, styles.viewBtn]}>
            <Text
              style={[a.text_xs, {color: t.palette.primary_400}]}
              onPress={onPressViewLocation}>
              Get directions
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={[styles.btn, styles.appointmentBtn]}>
            <Text style={[a.text_xs, {color: '#fff'}]}>Book appointment</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 7,
    borderWidth: 1,
    borderRadius: 5,
  },
  viewBtn: {
    ...shadows.medium,
    backgroundColor: '#fff',
    borderColor: 'transparent',
  },
  appointmentBtn: {
    backgroundColor: '#000',
  },
});
