import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a} from '#/theme';
type StoreRatingProps = {
  store_rating: number;
  order_total: number;
};
export function StoreRating(props: StoreRatingProps) {
  const t = useTheme();

  return (
    <View>
      {props.order_total > 1 ? (
        <Text style={[a.text_2xs, a.font_normal]}>{`${
          props.store_rating >= 1
            ? `${props.store_rating} / 5`
            : 'No rating yet'
        } | ${props.order_total} ${
          props.order_total > 1 ? 'orders' : 'order'
        }`}</Text>
      ) : (
        <Text style={[a.text_2xs, a.font_normal]}>{`No rating yet`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
