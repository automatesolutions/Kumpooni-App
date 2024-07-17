import React, {useCallback, useMemo, useState} from 'react';

import {Image, Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import {colors} from '#/utils/theme';

import {Text} from '../Typography';

import {atoms as a, useTheme} from '#/theme';

import {GooglePlaceDto} from '#/types/automate';
import {GOOGLE_MAP_KEY} from 'react-native-dotenv';
import {StarRating} from './StarRating';
import {FormattedAddress} from './FormattedAddress';

export function PlacesItem({place}: {place: GooglePlaceDto}) {
  const [visible, setVisible] = useState<boolean>(false);
  const t = useTheme();

  const roundedKm = Math.round((place.dist_meters ?? 0) * 10) / 10;
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
            paddingTop: 10,
          },
        ]}>
        <View style={[a.flex_row, a.align_center, a.px_xs, {gap: 10}]}>
          {place.photos ? (
            <Image
              source={{
                uri: `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=1023&key=${GOOGLE_MAP_KEY}`,
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
            <View style={{}}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.black,
                }}>
                {place.displayName.text}
              </Text>
            </View>
            <FormattedAddress
              address={place.shortFormattedAddress}
              distance={place.dist_meters ?? 0}
            />
          </View>
        </View>
        <View
          style={[
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.pr_2xs,
            a.gap_2xs,
            {marginTop: 4},
          ]}>
          <TouchableOpacity style={[styles.btn, styles.viewBtn]}>
            <Text
              style={[a.text_xs, {color: t.palette.primary_400}]}
              onPress={onPressViewLocation}>
              Get directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 5,
    borderRadius: 5,
  },
  viewBtn: {
    backgroundColor: '#fff',
    borderColor: 'transparent',
  },
  appointmentBtn: {
    backgroundColor: '#000',
  },
});
