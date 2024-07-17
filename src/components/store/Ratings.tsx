import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a} from '#/theme';
import {colors} from '#/lib/styles';
import {StarRating} from './StarRating';

type RatingsProps = {
  rating: number;
};

export function Ratings({rating}: RatingsProps) {
  if (rating === 0) {
    return (
      <View>
        <Text style={[a.text_2xs, {fontStyle: 'italic'}]}>No rating yet</Text>
      </View>
    );
  }
  return (
    <View style={[a.flex_row, a.align_center, {gap: 2}]}>
      <Text style={[a.text_2xs]}>{rating.toFixed(1)}</Text>
      <StarRating rating={rating} />
      <Text style={[a.text_2xs]}>{`(${0})`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
